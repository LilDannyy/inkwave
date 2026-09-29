// Eco-Forest Treehills — stage prop pack + placements (owner: the treehills stage; see layout.js for the folder contract).
//
// register(D, H): this stage's own prop builders (types prefixed 'treehills_'), same contract as props-marina-dock.js: H
// carries THREE + the PropKit helpers.
// PLACEMENTS: this stage's set dressing (half list: every entry is mirrored (x,z) → (-x,-z) with rotY + π unless it says
// `mirror: false`). Solid props hand the level collision boxes; turned ones keep turned colliders (oboxCols).
import { FEET, GROUND, PODS } from './layout.js';

const P = Math.PI, HP = P / 2;

export function register(D, H) {
  D.treehills_foot = {
    desc: 'footprint slab under a raised tier (collision-only, hidden): the environment reads the deck outline from it',
    build(B, o) { B.col(-o.len / 2 + 0.02, -2.4, -o.w / 2 + 0.02, o.len / 2 - 0.02, -0.02, o.w / 2 - 0.02); },
  };
  D.treehills_pod = {
    desc: 'sprout pod: a dormant seed bulb in its low planter (the engine scales the bulb as its meter fills)',
    build(B, o) {
      if (o.part !== 'bulb') { B.box('paint', '#5f7f6a', 0.9, 0.5, 0.9, 0, 0.25, 0); B.col(-0.45, 0, -0.45, 0.45, 0.5, 0.45); }
      if (o.part !== 'planter') B.sph('foliage', '#9cc27a', 0.3, 0, o.part === 'bulb' ? 0.3 : 0.72, 0, {});
    },
  };
  D.treehills_hedge = {
    desc: 'grown sprout hedge (w × h × d from `size`, origin at its base centre; no colliders)',
    build(B, o) { const [w, h, d] = o.size || [3, 1.8, 0.9]; B.box('foliage', o.tint || '#a9cf8a', w, h, d, 0, h / 2, 0, { r: 0.2 }); },
  };
}

// merged footprint rects for the raised regions' columns (adjacent columns with one z-span join up)
function footOf(cols) {
  const byZ = new Map();
  for (const c of cols) { const k = c.min[2] + '|' + c.max[2]; if (!byZ.has(k)) byZ.set(k, []); byZ.get(k).push([c.min[0], c.max[0], c.min[2], c.max[2]]); }
  const out = [];
  for (const list of byZ.values()) {
    list.sort((a, b) => a[0] - b[0]);
    let cur = null;
    for (const r of list) { if (cur && Math.abs(cur[1] - r[0]) < 1e-4) cur[1] = r[1]; else { if (cur) out.push(cur); cur = [...r]; } }
    if (cur) out.push(cur);
  }
  return out.map(([x0, x1, z0, z1]) => ({ type: 'treehills_foot', pos: [(x0 + x1) / 2, 0, (z0 + z1) / 2], rotY: 0, len: x1 - x0, w: z1 - z0 }));
}

export const PLACEMENTS = [
  // the environment's footprint under the raised tiers (their columns and copings) and the station
  ...['plateau', 'strip', 'upper', 'crown'].flatMap((k) => footOf(GROUND[k].cols)),
  ...FEET.map((f) => ({ type: 'treehills_foot', pos: [f.cx, 0, f.cz], rotY: (f.rot * P) / 180, len: f.len, w: f.w, oboxCols: true })),
  { type: 'treehills_foot', pos: [0, 0, -42.5], rotY: 0, len: 18, w: 9 },
  // the sprout pods (as set dressing until the pods engine owns them)
  ...PODS.list.map((p) => ({ type: 'treehills_pod', pos: p.pos, rotY: p.rotY })),
];
