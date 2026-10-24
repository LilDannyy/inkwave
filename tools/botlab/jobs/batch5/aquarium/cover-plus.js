// Cover map with heights (written by the round-1 reviewer, kept here for the fix round): cover-map.js's floor and cover rules, plus per cell the floor height, the floor block's tag,
// the distance to cover (>= 0.9 m over the floor) and the distance to ANY height change (>= 0.35 m over the floor:
// relief, a step, a kerb, a prop), so "flat and bare" can be measured. Output: JSON lines per cell, compact.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, B = L.bounds, THREE = await import('three');
  const x0 = Math.floor(B.minX), z0 = Math.floor(B.minZ), nx = Math.ceil(B.maxX) - x0, nz = Math.ceil(B.maxZ) - z0;
  const ids = [], P = new THREE.Vector3();
  const EDGE = new Set(['kerb', 'coping', 'retaining', 'plaza-rim']);
  const floorAt = (x, z) => {
    let best = -Infinity, bb = null;
    for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) {
      const b = L.blocks[id];
      if (!b.solid || b.dynamic || b.rail || b.hidden || b.roof || EDGE.has(b.tag)) continue;
      const n = b.axes[1]; if (n.y < 0.5) continue;
      const tx = b.center.x + n.x * b.half.y, ty = b.center.y + n.y * b.half.y, tz = b.center.z + n.z * b.half.y;
      const y = ty - (n.x * (x - tx) + n.z * (z - tz)) / n.y;
      if (y > 30 || y <= best) continue;
      P.set(x, y - 0.01, z);
      if (L.pointInBlock(b, P, 0.001)) { best = y; bb = b; }
    }
    if (!bb || best < -1) return null;
    if (solidAt(x, best + 0.3, z)) return null;
    return [best, bb.tag || '?'];
  };
  const solidAt = (x, y, z, minHalf = 0.3) => {
    P.set(x, y, z);
    for (const id of L.queryBlocks(x - 0.16, z - 0.16, x + 0.16, z + 0.16, ids)) { const b = L.blocks[id]; if (b.solid && !b.dynamic && !b.rail && Math.max(b.half.x, b.half.z) >= minHalf && L.pointInBlock(b, P, 0.15)) return true; }
    return false;
  };
  const RMAX = 16, offs = [];
  for (let dj = -2 * RMAX; dj <= 2 * RMAX; dj++) for (let di = -2 * RMAX; di <= 2 * RMAX; di++) { const d = Math.hypot(di, dj) / 2; if (d <= RMAX) offs.push([di / 2, dj / 2, d]); }
  offs.sort((a, b) => a[2] - b[2]);
  const cells = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const cx = x0 + i + 0.5, cz = z0 + j + 0.5;
    const f = floorAt(cx, cz); if (!f) continue;
    const [y, tag] = f;
    let dc = RMAX + 1, da = RMAX + 1;
    for (const [di, dj, dd] of offs) {
      const x = cx + di, z = cz + dj;
      if (da > RMAX && (solidAt(x, y + 0.35, z, 0.0) || floorBelow(x, z, y))) da = dd;
      if (solidAt(x, y + 0.9, z)) { dc = dd; break; }
    }
    cells.push([cx, cz, +y.toFixed(2), tag, +dc.toFixed(1), +Math.min(da, dc).toFixed(1)]);
  }
  // a drop: the floor 0.35+ m below (a ledge edge) also breaks "flat"
  function floorBelow(x, z, y) { const f = floorAt(x, z); return !f || f[0] < y - 0.35; }
  R('cells', true, { n: cells.length, cells });
  return out;
})()
