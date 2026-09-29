// Eco-Forest Treehills (stretch copy) — dump the layout (pieces mirrored) + placements + zones + tower + pods as JSON for plan.py
//   node dump.mjs <repo root> [mode] <out.json>
import fs from 'node:fs';
const root = process.argv[2], mode = process.argv[3] || 'turf', out = process.argv[4];
const { LAYOUT } = await import(`file://${root}/src/world/stages/treehills/layout.js`);
const { layoutFor } = await import(`file://${root}/src/world/variants.js`);
const { PLACEMENTS } = await import(`file://${root}/src/world/stages/treehills/props.js`);
const L = layoutFor(LAYOUT, mode);
const mirror = (d) => d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] }
  : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] };
const defs = [...L.single, ...L.half, ...L.half.map(mirror)].map((d) => { const o = { ...d }; delete o.mural; return o; });
// approximate collision footprints per type (w along local x, d along local z; or a radius), for the plan
const FP = {
  tree: (p) => { const c = Math.min(1.8, (p.h ?? 7) * (p.w ?? 0.8) * 0.3); return { w: c, d: c, canopy: (p.h ?? 7) * (p.w ?? 0.8) * 0.27 }; },
  clump: (p) => ({ w: 2 * (p.r ?? 1.1) * 0.92, d: 2 * (p.r ?? 1.1) * 0.92 }), planter: (p) => ({ w: p.w ?? 2.2, d: p.d ?? 0.9 }),
  crates: () => ({ w: 2.3, d: 1.8 }), solar: (p) => ({ w: p.w ?? 3.2, d: 1.1 }), greenhouse: (p) => ({ w: (p.L ?? 6) + 0.3, d: 2 * (p.R ?? 1.55) + 0.3 }),
  polytunnel: (p) => ({ w: (p.L ?? 6) + 0.2, d: 2 * (p.R ?? 1.5) + 0.2 }), cargo: (p) => ({ w: p.L ?? 6, d: 2.5 }), shed: (p) => ({ w: p.w ?? 2.4, d: p.d ?? 2 }),
  tank: (p) => ({ r: p.r ?? 0.9 }), hives: (p) => ({ w: (p.n ?? 3) * 0.62, d: 0.6 }), compost: () => ({ w: 3.3, d: 1.1 }),
  boulder: (p) => ({ w: (p.w ?? 1.6) * 0.8, d: (p.d ?? 1.3) * 0.8 }), log: (p) => ({ w: p.L ?? 4, d: 0.8 }), shrubs: (p) => ({ w: (p.w ?? 1.6) * 0.76, d: (p.w ?? 1.6) * 0.76 }),
  console: (p) => ({ w: p.w ?? 1.6, d: 0.7 }), kiosk: () => ({ w: 2.6, d: 2.4 }), bench: (p) => ({ w: p.w ?? 1.8, d: 0.46 }), lamp: () => ({ r: 0.1 }), bollard: () => ({ r: 0.12 }),
  totem: () => ({ w: 0.62, d: 0.2 }), turbine: () => ({ r: 1.55 }), ranger: () => ({ w: 3.2, d: 3.6 }), hut: (p) => ({ w: p.w ?? 2.2, d: p.d ?? 2 }), mast: () => ({ r: 0.45 }),
  dronepad: () => ({ r: 1.3 }), weather: () => ({ r: 0.35 }), nursery: (p) => ({ w: p.w ?? 2.2, d: 0.7 }), footbridge: (p) => ({ w: p.L ?? 2.6, d: 1.4 }),
  stones: (p) => ({ w: (p.n ?? 3) * (p.gap ?? 0.55), d: 0.5 }), pod: () => ({ r: 0.45 }), solarrow: (p) => ({ w: p.w ?? 5, d: 1.2 }),
  // the nursery (the stretch)
  seedbed: (p) => ({ w: p.w ?? 4, d: p.d ?? 1.2 }), cloches: (p) => ({ w: ((p.n ?? 4) - 1) * (p.gap ?? 1) + 1, d: 1 }), pottingshed: (p) => ({ w: p.w ?? 3, d: p.d ?? 2.2 }),
  pbench: (p) => ({ w: p.w ?? 2, d: 0.7 }), potstack: () => ({ w: 1.2, d: 1 }), pumphouse: (p) => ({ w: p.w ?? 2.6, d: p.d ?? 2.2 }), transformer: () => ({ w: 1.6, d: 1.1 }),
  trellis: (p) => ({ w: p.w ?? 3, d: 0.36 }), saplings: (p) => ({ w: p.w ?? 3, d: p.d ?? 2 }), trolley: () => ({ w: 1.35, d: 0.56 }),
};
const pl = [];
for (const p of PLACEMENTS) {
  if (p.type === 'treehills_foot') continue;
  const t = p.type.replace('treehills_', '');
  const b = { type: t, pos: p.pos, rotY: p.rotY || 0, fp: FP[t] ? FP[t](p) : null };
  pl.push(b);
  if (p.mirror !== false) pl.push({ ...b, pos: [-p.pos[0], p.pos[1], -p.pos[2]], rotY: (p.rotY || 0) + Math.PI });
}
fs.writeFileSync(out, JSON.stringify({ bounds: L.bounds, defs, pl, zones: L.zones, tower: L.tower, pads: L.spawnPads, pods: L.pods }));
console.log('pieces', defs.length, 'placements', pl.length);
