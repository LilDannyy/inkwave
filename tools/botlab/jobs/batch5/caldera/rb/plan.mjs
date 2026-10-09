// Highmark Foundry r3: a top-down sample of the real Level in Node (no Electron), for the shape iterations and the
// floor-silhouette metrics. LAVA=low|high MODE=turf node plan.mjs out.json [cell]
//   per cell: the highest solid top (y), what it is (floor / roof / rail / drown / spawn), and whether the lava region
//   covers it; plus cover-map's floor grid (1 m cells, its exact floor rule) for the footprint metrics
const ROOT = process.env.ROOT || new URL('../../../../../../', import.meta.url).pathname;
const { LAYOUT } = await import('file://' + ROOT + 'src/world/stages/caldera/layout.js');
const G = await import('file://' + ROOT + 'src/world/stages/caldera/geo.js');
const { layoutFor } = await import('file://' + ROOT + 'src/world/variants.js');
const { Level } = await import('file://' + ROOT + 'src/world/level.js');
const fs = await import('node:fs');
const mode = process.env.MODE || 'turf';
const L = new Level(layoutFor(LAYOUT, mode)), ids = [];
const S = +(process.argv[3] || 0.5), X = 40, Z = 78;
const nx = Math.round(2 * X / S), nz = Math.round(2 * Z / S);
const EDGE = new Set(['kerb', 'coping', 'retaining', 'plaza-rim']);
function topAt(x, z, floorOnly) {
  let best = -Infinity, bb = null;
  for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) {
    const b = L.blocks[id];
    if (!b.solid || b.hidden) continue;
    if (floorOnly && (b.dynamic || b.rail || b.roof || EDGE.has(b.tag))) continue;
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const tx = b.center.x + n.x * b.half.y, ty = b.center.y + n.y * b.half.y, tz = b.center.z + n.z * b.half.y;
    const y = ty - (n.x * (x - tx) + n.z * (z - tz)) / n.y;
    if (y > 30 || y <= best) continue;
    if (L.pointInBlock(b, { x, y: y - 0.01, z }, 0.001)) { best = y; bb = b; }
  }
  return bb ? { y: best, b: bb } : null;
}
const inRegion = (x, z) => G.REGION_ALL.some((p) => G.inPoly(p, x, z));
const cells = new Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const x = -X + (i + 0.5) * S, z = -Z + (j + 0.5) * S, t = topAt(x, z, false);
  let k = 0, y = -9;
  if (t) {
    y = t.y; const b = t.b;
    k = b.rail ? 3 : b.roof ? 2 : (/casting-floor|slump-shelf/.test(b.tag || '') ? 4 : /gallery/.test(b.tag || '') ? 5 : /bridge/.test(b.tag || '') ? 6 : /organ|stone|race/.test(b.tag || '') ? 7 : 1);
  }
  cells[j * nx + i] = [k, +y.toFixed(2), inRegion(x, z) ? 1 : 0];
}
// cover-map's floor rule on 1 m cells (no prop colliders in Node: layout blocks only, which is all this stage has)
const P = { x: 0, y: 0, z: 0 };
const solidAt = (x, y, z) => { P.x = x; P.y = y; P.z = z; for (const id of L.queryBlocks(x - 0.16, z - 0.16, x + 0.16, z + 0.16, ids)) { const b = L.blocks[id]; if (b.solid && !b.dynamic && !b.rail && Math.max(b.half.x, b.half.z) >= 0.3 && L.pointInBlock(b, P, 0.15)) return true; } return false; };
const gx0 = Math.floor(L.bounds.minX), gz0 = Math.floor(L.bounds.minZ), gnx = Math.ceil(L.bounds.maxX) - gx0, gnz = Math.ceil(L.bounds.maxZ) - gz0;
const floor = [];
for (let j = 0; j < gnz; j++) for (let i = 0; i < gnx; i++) {
  const x = gx0 + i + 0.5, z = gz0 + j + 0.5, t = topAt(x, z, true);
  floor.push(t && t.y >= -1 && !solidAt(x, t.y + 0.3, z) ? 1 : 0);
}
fs.writeFileSync(process.argv[2], JSON.stringify({ S, X, Z, nx, nz, cells, grid: { x0: gx0, z0: gz0, nx: gnx, nz: gnz, floor } }));
console.log('wrote', process.argv[2], 'blocks', L.blocks.length);
