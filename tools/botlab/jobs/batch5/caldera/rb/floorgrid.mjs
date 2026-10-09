// floor grid (cover-map.js's floor rule, layout blocks only) for any stage: node --import <reg> floorgrid.mjs <id> <out.json>
const ROOT = (process.env.ROOT || '/Users/danielosling/Desktop/1/st-b5-caldera') + '/';
const id = process.argv[2];
const { MAP_LAYOUTS } = await import('file://' + ROOT + 'src/world/maps.js');
const { layoutFor } = await import('file://' + ROOT + 'src/world/variants.js');
const { Level } = await import('file://' + ROOT + 'src/world/level.js');
const L = new Level(layoutFor(MAP_LAYOUTS[id], 'turf')), B = L.bounds, ids = [], P = { x: 0, y: 0, z: 0 };
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
const grid = new Array(nx * nz).fill(-1);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const y = floorAt(x0 + i + 0.5, z0 + j + 0.5); if (y != null) grid[j * nx + i] = +y.toFixed(2); }
(await import('node:fs')).writeFileSync(process.argv[3], JSON.stringify({ x0, z0, nx, nz, grid }));
console.log(id, 'floor cells', grid.filter((v) => v !== -1).length);
