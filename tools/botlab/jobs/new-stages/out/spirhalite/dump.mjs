// dump spirhalite layout (pieces mirrored) + placements + zones + tower + outline as JSON for plan.py
import fs from 'node:fs';
const root = process.argv[2], mode = process.argv[3] || 'turf', out = process.argv[4];
const { LAYOUT } = await import(`file://${root}/src/world/stages/spirhalite/layout.js`);
const { OUTLINE } = await import(`file://${root}/src/world/stages/spirhalite/outline.js`);
const { layoutFor } = await import(`file://${root}/src/world/variants.js`);
const { PLACEMENTS } = await import(`file://${root}/src/world/stages/spirhalite/props.js`);
const L = layoutFor(LAYOUT, mode);
const mirror = (d) => d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] }
  : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] };
const defs = [...L.single, ...L.half, ...L.half.map(mirror)].map((d) => { const o = { ...d }; delete o.mural; delete o.shelf; return o; });
const pl = [];
for (const p of PLACEMENTS) {
  const b = { type: p.type.replace('spirhalite_', ''), pos: p.pos, rotY: p.rotY || 0, L: p.L ?? p.len, w: p.w, two: p.two };
  pl.push(b);
  if (p.mirror !== false) pl.push({ ...b, pos: [-p.pos[0], p.pos[1], -p.pos[2]], rotY: (p.rotY || 0) + Math.PI });
}
fs.writeFileSync(out, JSON.stringify({ bounds: L.bounds, defs, pl, zones: L.zones, tower: L.tower, pads: L.spawnPads, outline: OUTLINE }));
console.log('pieces', defs.length, 'placements', pl.length);
