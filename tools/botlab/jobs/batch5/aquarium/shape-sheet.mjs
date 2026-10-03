// The shape test: every stage's top-down footprint (its real layout pieces as check-maps reads them, Turf War build:
// anything standing above the sea that isn't a hidden collider) rasterised at the same scale, side by side.
//   node tools/botlab/jobs/batch5/aquarium/shape-sheet.mjs aquarium halyard craters spirhalite > sheet.json
// then shape-sheet.py draws it.
const { MAP_LAYOUTS } = await import(new URL('../../../../../src/world/maps.js', import.meta.url));
const { layoutFor } = await import(new URL('../../../../../src/world/variants.js', import.meta.url));
const DEG = Math.PI / 180, RES = 0.5;
const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] });
function topOf(d, x, z) {
  if (d.kind === 'box') return x < d.min[0] || x > d.max[0] || z < d.min[2] || z > d.max[2] ? null : d.max[1];
  if (d.kind === 'obox') { const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2]; const u = dx * c - dz * s, v = dx * s + dz * c; return Math.abs(u) > d.size[0] / 2 || Math.abs(v) > d.size[2] / 2 ? null : d.center[1] + d.size[1] / 2; }
  const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, run = Math.hypot(hx - lx, hz - lz), ux = (hx - lx) / run, uz = (hz - lz) / run, dx = x - lx, dz = z - lz, al = dx * ux + dz * uz, lat = -dx * uz + dz * ux;
  return Math.abs(lat) > d.width / 2 || al < 0 || al > run ? null : ly + (al * (hy - ly)) / run;
}
const out = {};
for (const id of process.argv.slice(2)) {
  const L = layoutFor(MAP_LAYOUTS[id], 'turf'), B = L.bounds;
  const defs = [...L.single, ...L.half, ...L.half.map(mir)].filter((d) => !d.hidden && !d.rail);
  const nx = Math.round((B.maxX - B.minX) / RES), nz = Math.round((B.maxZ - B.minZ) / RES), rows = [];
  for (let j = 0; j < nz; j++) {
    let row = '';
    for (let i = 0; i < nx; i++) {
      const x = B.minX + (i + 0.5) * RES, z = B.minZ + (j + 0.5) * RES;
      let t = -9; for (const d of defs) { const y = topOf(d, x, z); if (y != null && y > t) t = y; }
      row += t < -1.0 ? '.' : t > 4.5 ? '#' : t > 1.8 ? '2' : t > 0.45 ? '1' : '0';
    }
    rows.push(row);
  }
  out[id] = { bounds: B, res: RES, rows, spawns: L.spawnPads };
}
console.log(JSON.stringify(out));
