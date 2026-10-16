// cover-map.js's exact rule run in Node on the caldera Level (layout blocks only — this stage has no prop colliders):
// every 1 m floor cell's distance to the nearest cover ≥ 0.9 m tall; the share within 5 m; the largest open circles.
// LAVA=low|high MODE=turf node --import ./reg.mjs cover.mjs [out.json]   (for iterating; the page test decides)
const ROOT = new URL('../../../../../../', import.meta.url).pathname;
const { LAYOUT } = await import('file://' + ROOT + 'src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + 'src/world/variants.js');
const { Level } = await import('file://' + ROOT + 'src/world/level.js');
const L = new Level(layoutFor(LAYOUT, process.env.MODE || 'turf')), B = L.bounds, ids = [], P = { x: 0, y: 0, z: 0 };
const EDGE = new Set(['kerb', 'coping', 'retaining', 'plaza-rim']);
const solidAt = (x, y, z) => { P.x = x; P.y = y; P.z = z; for (const id of L.queryBlocks(x - 0.16, z - 0.16, x + 0.16, z + 0.16, ids)) { const b = L.blocks[id]; if (b.solid && !b.dynamic && !b.rail && Math.max(b.half.x, b.half.z) >= 0.3 && L.pointInBlock(b, P, 0.15)) return true; } return false; };
const floorAt = (x, z) => {
  let best = -Infinity, bb = null;
  for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) {
    const b = L.blocks[id];
    if (!b.solid || b.dynamic || b.rail || b.hidden || b.roof || EDGE.has(b.tag)) continue;
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const tx = b.center.x + n.x * b.half.y, ty = b.center.y + n.y * b.half.y, tz = b.center.z + n.z * b.half.y;
    const y = ty - (n.x * (x - tx) + n.z * (z - tz)) / n.y;
    if (y > 30 || y <= best) continue;
    if (L.pointInBlock(b, { x, y: y - 0.01, z }, 0.001)) { best = y; bb = b; }
  }
  if (!bb || best < -1) return null;
  if (solidAt(x, best + 0.3, z)) return null;
  return best;
};
const x0 = Math.floor(B.minX), z0 = Math.floor(B.minZ), nx = Math.ceil(B.maxX) - x0, nz = Math.ceil(B.maxZ) - z0;
const RMAX = 16, offs = [];
for (let dj = -2 * RMAX; dj <= 2 * RMAX; dj++) for (let di = -2 * RMAX; di <= 2 * RMAX; di++) { const d = Math.hypot(di, dj) / 2; if (d <= RMAX) offs.push([di / 2, dj / 2, d]); }
offs.sort((a, b) => a[2] - b[2]);
let n = 0, w5 = 0; const open = [];
const grid = new Array(nx * nz).fill(-1);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const cx = x0 + i + 0.5, cz = z0 + j + 0.5, y = floorAt(cx, cz); if (y == null) continue;
  let d = RMAX + 1; for (const [di, dj, dd] of offs) if (solidAt(cx + di, y + 0.9, cz + dj)) { d = dd; break; }
  n++; if (d <= 5) w5++; grid[j * nx + i] = d; open.push([d, cx, cz, +y.toFixed(1)]);
}
open.sort((a, b) => b[0] - a[0]);
console.log(`cover ${process.env.LAVA || 'low'}: floor ${n} cells, within 5 m ${(100 * w5 / n).toFixed(1)} %, largest open`, open.slice(0, 12).map((o) => `${o[0].toFixed(1)}@(${o[1]},${o[3]},${o[2]})`).join(' '));
if (process.argv[2]) (await import('node:fs')).writeFileSync(process.argv[2], JSON.stringify({ x0, z0, nx, nz, grid }));
