// Bluestone blockout (scratch, fix round 2): tools/botlab/tests/cover-map.js ported to Node (the real Level, the
// embankment's prop colliders included), so a layout change's floor and cover can be measured in seconds:
//   ERA=1|2|3 [MODE=turf] [SKIPTOPS=1] node --import ./three-hook.mjs cover-node.mjs
// The same floor rule (the highest non-roof, non-rail, non-hidden top with nothing solid 0.3 m over it, above the
// water) and the same cover rule (a solid ≥ 0.6 m across, 0.9 m over the floor, on a 0.5 m lattice out to 16 m).
// Prints floor cells, the share within 5 m of cover, the largest open circle (SKIPTOPS=1: not counting cells that are
// the top of a free-standing cover piece — a planter's top is not open ground), and the floor per region (both halves
// folded onto Alpha's, the regions of ink-regions.js).
const root = new URL('../../../../../', import.meta.url).pathname;
const THREE = await import('three');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const mode = process.env.MODE || 'turf';
const map = process.env.MAP || 'bluestone';
const L0 = layoutFor(MAP_LAYOUTS[map], mode);
const extra = [];
if (map === 'bluestone') for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const L = new Level(L0, extra), B = L.bounds;
const x0 = Math.floor(B.minX), z0 = Math.floor(B.minZ), nx = Math.ceil(B.maxX) - x0, nz = Math.ceil(B.maxZ) - z0;
const ids = [], P = new THREE.Vector3();
const EDGE = new Set(['kerb', 'coping', 'retaining', 'plaza-rim']);
const solidAt = (x, y, z) => {
  P.set(x, y, z);
  for (const id of L.queryBlocks(x - 0.16, z - 0.16, x + 0.16, z + 0.16, ids)) { const b = L.blocks[id]; if (b.solid && !b.dynamic && !b.rail && Math.max(b.half.x, b.half.z) >= 0.3 && L.pointInBlock(b, P, 0.15)) return true; }
  return false;
};
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
  return { y: best, b: bb };
};
const coverTop = (b) => /planter|bench|crates|bins|cart|bollard|kiosk|barrow|trough|buffer|plinth|lamp|cafe|stall|dock|racks|fountain|winch|barrels|coal|island|bed/.test(b.tag || '') && Math.max(b.half.x, b.half.z) < 3.5;
const fy = new Float32Array(nx * nz).fill(NaN), top = new Uint8Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const f = floorAt(x0 + i + 0.5, z0 + j + 0.5); if (f) { fy[j * nx + i] = f.y; top[j * nx + i] = coverTop(f.b) ? 1 : 0; } }
const RMAX = 16, offs = [];
for (let dj = -2 * RMAX; dj <= 2 * RMAX; dj++) for (let di = -2 * RMAX; di <= 2 * RMAX; di++) { const d = Math.hypot(di, dj) / 2; if (d <= RMAX) offs.push([di / 2, dj / 2, d]); }
offs.sort((a, b) => a[2] - b[2]);
const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180);
const region = (x, y, z) => {   // (fix round 3: the regions of ink-regions.js)
  if (z > 0) { x = -x; z = -z; }
  const al = x * S65 + z * C65, off = -x * C65 + z * S65, r = Math.hypot(x, z), HS = LY.HOTEL_STAIR;
  if (HS && x > HS.x0 - 0.2 && x < HS.x1 + 0.2 && z > HS.zFoot - 0.8 && z < HS.zLand + 0.2 && y > 2.3) return 'halo';
  if (y > 4.5 && r < 16) return 'halo';
  if (LY.YARD && y > 0.5 && G.inPoly(LY.YARD, x, z)) return 'garden';
  if (LY.ALLEY && G.inPoly(LY.ALLEY.floor || LY.ALLEY.quad, x, z)) return 'alley';
  if (!G.inPoly(LY.OUTLINE, x, z) && (x > 20 || z > -8)) return 'river-works';
  if (r <= 20) return 'circus';
  if (Math.abs(off) <= 15 && al <= -20) return al < -40 ? 'arm-tip' : Math.abs(off) > 9 ? 'arm-walks' : 'arm';
  if (z <= -50) return 'base';
  if (Math.abs(x) <= 7) return 'swimston';
  return x < 0 ? 'west' : 'east';
};
let n = 0, within5 = 0, maxOpen = 0, maxAt = null, maxOpenG = 0, maxAtG = null;
const reg = {};
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const y = fy[j * nx + i]; if (Number.isNaN(y)) continue;
  const cx = x0 + i + 0.5, cz = z0 + j + 0.5;
  let d = RMAX + 1;
  for (const [di, dj, dd] of offs) if (solidAt(cx + di, y + 0.9, cz + dj)) { d = dd; break; }
  n++; if (d <= 5) within5++;
  if (d > maxOpen) { maxOpen = d; maxAt = [cx, cz, +y.toFixed(2)]; }
  if (!top[j * nx + i] && d > maxOpenG) { maxOpenG = d; maxAtG = [cx, cz, +y.toFixed(2)]; }
  const r = region(cx, y, cz); reg[r] = (reg[r] || 0) + 1;
}
const out = { map, era: process.env.ERA || '1', mode, floorCells: n, within5m_pct: +(100 * within5 / n).toFixed(1), largestOpen: [+maxOpen.toFixed(1), maxAt], largestOpenGround: [+maxOpenG.toFixed(1), maxAtG], regions: Object.fromEntries(Object.entries(reg).sort((a, b) => b[1] - a[1])) };
console.log(JSON.stringify(out));
