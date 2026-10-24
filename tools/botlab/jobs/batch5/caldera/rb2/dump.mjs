// dump Alpha's base for the overlay plan: block footprints, floor polygons, the tower lanes, and bare.mjs's distance field
// (its exact rule: free-standing pieces ≥ 0.9 m over the area's floor; tier faces, walls and rails do not count)
// LAVA=low|high MODE=turf node --import reg.mjs dump.mjs out.json
const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const G = await import('file://' + ROOT + '/src/world/stages/caldera/geo.js');
const fs = await import('node:fs');
const L = new Level(layoutFor(LAYOUT, process.env.MODE || 'turf'));
const FLOORTAG = /^(island|gallery|yard|rim-head|terrace|lakefront|moorings|casting-floor|slump-shelf|north-head|horn-step|ladle-road|rim-ridge|coping|socket-collar|footprint|caldera-wall|casting-hall|causeway|pour-floor)$/;
const blocks = [];
for (const b of L.blocks) {
  if (b.aabbMax.z > 5 || b.aabbMin.z < -80) continue;
  const c = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.push([b.center.x + b.axes[0].x * b.half.x * sx + b.axes[2].x * b.half.z * sz, b.center.z + b.axes[0].z * b.half.x * sx + b.axes[2].z * b.half.z * sz]);
  blocks.push({ c, y0: b.aabbMin.y, y1: b.aabbMax.y, top: b.center.y + b.half.y, tag: b.tag || '', rail: b.rail, roof: b.roof, hidden: b.hidden && !b.rail, floor: FLOORTAG.test(b.tag || ''), ramp: b.axes[1].y < 0.999 });
}
const areas = { terrace: [G.TERRACE, 2.4], yard: [G.YARD, 3.6], lakefront: [G.LAKEFRONT, 1.2], island: [G.ISLAND, 1.2] };
const S = 0.5, dist = {};
for (const [nm, [poly, y]] of Object.entries(areas)) {
  const pts = [], cov = [];
  for (let x = -40; x <= 40; x += S) for (let z = -70; z <= 0; z += S) if (G.inPoly(poly, x, z)) pts.push([x, z]);
  for (const b of L.blocks) {
    if (!b.solid || b.rail || FLOORTAG.test(b.tag || '')) continue;
    const top = b.center.y + b.half.y, bot = b.center.y - b.half.y; if (top < y + 0.9 || bot > y + 0.5) continue;
    for (let x = -40; x <= 40; x += S) for (let z = -70; z <= 0; z += S) { if (Math.abs(x - b.center.x) > 4 || Math.abs(z - b.center.z) > 4) continue; if (L.pointInBlock(b, { x, y: y + 0.6, z }, 0.05)) cov.push([x, z]); }
  }
  const out = []; let best = [0];
  for (const p of pts) { let d = Infinity; for (const c of cov) { const e = Math.hypot(p[0] - c[0], p[1] - c[1]); if (e < d) d = e; } out.push([p[0], p[1], +d.toFixed(2)]); if (d > best[0]) best = [d, p]; }
  dist[nm] = { cells: out, max: +best[0].toFixed(1), at: best[1] };
  console.log(nm, 'largest disc with no mass: r', best[0].toFixed(1), 'at', JSON.stringify(best[1]));
}
const T = LAYOUT.tower.path.map((p) => (p.length === 3 ? [-p[0], -p[2]] : [-p[0], -p[1]]));
const polys = { yard: G.YARD, terrace: G.TERRACE, lakefront: G.LAKEFRONT, moorings: G.MOORINGS, rimHead: G.RIM_HEAD, gallery: G.GALLERY };
const K = LAYOUT.bazookarp;
fs.writeFileSync(process.argv[2], JSON.stringify({ blocks, polys, dist, tower: T, gate: [-K.gate.at[0], -K.gate.at[2]], weir: [-K.weirs[0].at[0], -K.weirs[0].at[2]] }));
