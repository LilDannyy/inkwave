// Eco-Forest Treehills — stage prop pack + placements (owner: the treehills stage; see layout.js for the folder contract).
//
// register(D, H): this stage's own prop builders (types prefixed 'treehills_'), same contract as props-marina-dock.js: H
// carries THREE + the PropKit helpers. The builders live in modules by theme:
//   kit.js       the shared toolkit: palette, geometry helpers, stroke font, railings, valves, evergreens, shrubs
//   station.js   the research station (façade, back module, dish, balloon), greenhouse pod, seed-bank kiosk + crates, solar
//   flora.js     evergreens, cypress clumps, planters, pollinator borders, shrub fringes; the sprout pods and hedges
//   fittings.js  the wind turbine, lamps, bollards, totems, the stage sign, railings, benches, sprinklers, wall valves
// PLACEMENTS: this stage's set dressing (half list: every entry is mirrored (x,z) → (-x,-z) with rotY + π unless it says
// `mirror: false`). Authored on Alpha's half and the whole east tree-hill (x ≥ 15; the west hill is its twin) — never
// on the west hill itself. Solid props hand the level collision boxes; turned ones keep turned colliders (oboxCols).
// Keep clear of the Tower Command track (plan.js TRACK: |z| < 1.9 across the meadow and up the hill, x 22.1 … 25.9
// along the upper tier and the north strip, z 29.1 … 32.9 to the goal) and its headroom.
import { makeKit } from './kit.js';
import { registerStation } from './station.js';
import { registerFlora } from './flora.js';
import { registerFittings } from './fittings.js';
import { FEET, GROUND, PODS } from './layout.js';
import { T1, T2, T3, TURBINE } from './plan.js';

const P = Math.PI, HP = P / 2;

export function register(D, H) {
  const T = makeKit(H);
  D.treehills_foot = {
    desc: 'footprint slab under a raised tier (collision-only, hidden): the environment reads the deck outline from it',
    build(B, o) { B.col(-o.len / 2 + 0.02, -2.4, -o.w / 2 + 0.02, o.len / 2 - 0.02, -0.02, o.w / 2 - 0.02); },
  };
  registerStation(D, H, T);
  registerFlora(D, H, T);
  registerFittings(D, H, T);
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
const tree = (x, y, z, h, o = {}) => ({ type: 'treehills_tree', pos: [x, y, z], h, kind: o.kind ?? 'hinoki', seed: o.seed ?? Math.round(Math.abs(x * 7 + z * 3)) % 9, w: o.w ?? 0.8, ...o });
const rail = (pts, y, o = {}) => ({ type: 'treehills_rail', pos: [0, 0, 0], rotY: 0, pts: pts.map(([x, z]) => [x, y, z]), ...o });
// a point pulled 0.35 m in from an outline corner toward a reference point (railings stand just inside the coping)
const inset = (p, c, d = 0.4) => { const dx = c[0] - p[0], dz = c[1] - p[1], L = Math.hypot(dx, dz); return [p[0] + (dx / L) * d, p[1] + (dz / L) * d]; };

export const PLACEMENTS = [
  // ================= the environment's footprint under the raised tiers (their columns and copings) and the station
  ...['apron', 'lobe', 'strip', 'upper', 'crown'].flatMap((k) => footOf(GROUND[k].cols)),
  ...FEET.map((f) => ({ type: 'treehills_foot', pos: [f.cx, 0, f.cz], rotY: (f.rot * P) / 180, len: f.len, w: f.w, oboxCols: true })),
  { type: 'treehills_foot', pos: [0, 0, -42.5], rotY: 0, len: 18, w: 9 },

  // ================= the sprout pods: the planters are the stage's (static colliders, baked); the bulbs are stand-ins
  //                   until the pods engine draws them (then only these bulb entries go)
  ...PODS.list.map((p) => ({ type: 'treehills_pod', part: 'planter', pos: p.pos, rotY: p.rotY })),
  ...PODS.list.map((p) => ({ type: 'treehills_pod', part: 'bulb', pos: p.pos, rotY: p.rotY, standin: true })),

  // ================= the research station (spawn) and the base terrace (T1)
  { type: 'treehills_station', pos: [0, 0, -42.5], rotY: 0 },
  { type: 'treehills_greenhouse', pos: [-8.5, T1, -34.8], rotY: 0, L: 6, R: 1.55, num: 'G-2', seed: 3 },
  { type: 'treehills_crates', pos: [10.2, T1, -31.4], rotY: 0.18, n: 3 },
  { type: 'treehills_solar', pos: [6.2, T1, -35.6], rotY: 0, w: 3.0 },
  { type: 'treehills_crates', pos: [-12.6, T1, -39.6], rotY: HP, n: 2 },
  { type: 'treehills_bench', pos: [-14.2, T1, -35.4], rotY: HP },
  { type: 'treehills_lamp', pos: [-14.3, T1, -26.6], rotY: HP },
  { type: 'treehills_lamp', pos: [14.3, T1, -37.6], rotY: -HP },
  { type: 'treehills_totem', pos: [-4.6, T1, -25.7], rotY: 0, lines: [['^ MEADOW'], ['SEED BANK 05 >']] },
  { type: 'treehills_bollard', pos: [4.1, T1, -25.5] },
  { type: 'treehills_bollard', pos: [-4.1, T1, -32.4] },
  { type: 'treehills_bollard', pos: [4.1, T1, -32.4] },

  // ================= the seed-bank garden (0)
  { type: 'treehills_kiosk', pos: [1.6, 0, -15.9], rotY: 0.2, num: '05' },
  { type: 'treehills_planter', pos: [-9.6, 0, -20.2], rotY: -1.0, w: 2.6, d: 0.95, h: 0.8, seed: 7, tree: 0.6 },
  { type: 'treehills_clump', pos: [8.8, 0, -16.2], seed: 4 },
  { type: 'treehills_border', pos: [4.4, 0, -24.45], rotY: 0, L: 3.3, seed: 5 },
  { type: 'treehills_lamp', pos: [-5.0, 0, -22.6], rotY: 0 },
  { type: 'treehills_sprinkler', pos: [-6, 0, -17] }, { type: 'treehills_sprinkler', pos: [5, 0, -20] },
  { type: 'treehills_wallvalve', pos: [-6.5, 0.72, -25], rotY: 0, label: 'W-07' },
  { type: 'treehills_hatch', pos: [-4.6, 0.64, -25], rotY: 0, r: 0.4, num: '07' },

  // ================= the Commons Meadow (0): the zone's low planters, cypress clumps, crates, the pollinator border
  { type: 'treehills_planter', pos: [-3.2, 0, -4.3], rotY: 0, w: 2.0, d: 0.8, h: 0.6, seed: 11 },
  { type: 'treehills_clump', pos: [-12.1, 0, -4.2], seed: 9, r: 1.0 },
  { type: 'treehills_crates', pos: [3.4, 0, -10.9], rotY: -0.3, n: 3 },
  { type: 'treehills_border', pos: [14.35, 0, -12.2], rotY: -HP, L: 8.4, seed: 15 },
  { type: 'treehills_totem', pos: [-7.0, 0, -12.9], rotY: 0.4, lines: [['< BIOME 07'], ['TURBINE HILL >']] },
  { type: 'treehills_lamp', pos: [-14.2, 0, -12.6], rotY: HP },
  { type: 'treehills_sprinkler', pos: [-6, 0, -8] }, { type: 'treehills_sprinkler', pos: [6, 0, -6] }, { type: 'treehills_sprinkler', pos: [-10, 0, -11] },

  // ================= the east tree-hill (authored whole; the west hill is its twin)
  // ---- the south lobe (T1, Alpha's left lane): evergreens round the hill ramp and the lobe stair
  tree(18.4, T1, -29.0, 7.5, { seed: 1 }),
  tree(22.9, T1, -23.4, 6.4, { kind: 'thujopsis', seed: 2 }),
  tree(27.6, T1, -19.0, 8.2, { seed: 3 }),
  tree(30.3, T1, -14.4, 5.2, { kind: 'thujopsis', seed: 4, w: 0.7 }),
  tree(20.2, T1, -24.8, 5.8, { seed: 5, w: 0.75 }),
  tree(24.6, T1, -19.6, 5.2, { kind: 'thujopsis', seed: 6, w: 0.7 }),
  { type: 'treehills_lamp', pos: [19.9, T1, -17.4], rotY: -HP },
  { type: 'treehills_fringe', pos: [25.8, T1, -10.35], rotY: 0, L: 1.9, seed: 3 },
  { type: 'treehills_totem', pos: [25.9, T1, -16.6], rotY: 0, lines: [['^ TURBINE HILL'], ['< MEADOW']] },
  { type: 'treehills_hatch', pos: [26.7, 1.95, -10], rotY: P, num: 'T-2' },
  { type: 'treehills_sprinkler', pos: [23.4, T1, -21] }, { type: 'treehills_sprinkler', pos: [29.2, T1, -16.8] },
  // ---- the band (T1) along the meadow: a lamp by the upper tier's wall, shrubs at its foot
  { type: 'treehills_lamp', pos: [19.05, T1, -6.2], rotY: -HP },
  { type: 'treehills_lamp', pos: [19.05, T1, 9.6], rotY: -HP },
  tree(17.5, T1, 16.6, 5.0, { kind: 'thujopsis', seed: 8, w: 0.7 }),
  { type: 'treehills_fringe', pos: [19.2, T1, -9.6], rotY: -HP, L: 5.2, seed: 7 },
  { type: 'treehills_fringe', pos: [19.2, T1, 11.2], rotY: -HP, L: 6.4, seed: 9 },
  { type: 'treehills_hatch', pos: [19.5, 1.95, -7.2], rotY: -HP, num: 'T-1' },
  { type: 'treehills_wallvalve', pos: [19.5, 1.9, 17.2], rotY: -HP, label: 'IRR 4' },
  { type: 'treehills_hatch', pos: [15, 0.62, -19.2], rotY: -HP, r: 0.4, num: 'B-3' },
  { type: 'treehills_wallvalve', pos: [15, 0.7, 11.6], rotY: -HP, label: 'IRR 2' },
  // ---- the upper tier (T2): young trees on its meadow edge (off the track), evergreens on the outer parts, railings
  tree(20.6, T2, 5.6, 4.6, { seed: 5, w: 0.62 }),
  tree(20.6, T2, 15.4, 4.2, { seed: 6, w: 0.62 }),
  tree(21.4, T2, -7.2, 5.4, { kind: 'thujopsis', seed: 7 }),
  tree(31.0, T2, -8.4, 4.4, { seed: 8, w: 0.65 }),
  tree(27.6, T2, 18.4, 5.0, { kind: 'thujopsis', seed: 0, w: 0.7 }),
  rail([inset([31.5, -10], [28, -6]), inset([33, -7.402], [28, -6]), inset([33, -4], [28, -6])], T2),
  rail([inset([33, 14], [28, 16]), inset([31, 17.464], [28, 16]), inset([31, 20], [28, 16])], T2),
  // ---- the crown (T3): the turbine, evergreens, the railing round its prow, a bench over the meadow
  { type: 'treehills_turbine', pos: [TURBINE.x, T3, TURBINE.z], rotY: -HP, hub: TURBINE.hub },
  tree(28.6, T3, 11.4, 7.0, { seed: 2 }),
  tree(28.3, T3, -1.4, 6.0, { kind: 'thujopsis', seed: 6 }),
  rail([inset([33, -4], [30, 5]), inset([35.5, 0.33], [30, 5]), inset([35.5, 9.67], [30, 5]), inset([33, 14], [30, 5])], T3),
  { type: 'treehills_bench', pos: [27.3, T3, 4.6], rotY: -HP },
  { type: 'treehills_lamp', pos: [30.1, T3, 9.2], rotY: 0 },
  { type: 'treehills_weather', pos: [31.3, T3, -1.0], rotY: 0.3 },
  { type: 'treehills_hatch', pos: [26.5, 3.25, 1.2], rotY: -HP, r: 0.38, num: 'C-1' },
  // ---- the north strip (T1, Bravo's right lane: the service route down to Bravo's terrace)
  tree(27.2, T1, 23.2, 6.2, { seed: 4, w: 0.7 }),
  tree(16.8, T1, 27.9, 5.0, { kind: 'thujopsis', seed: 3, w: 0.7 }),
  tree(19.9, T1, 27.4, 4.2, { seed: 7, w: 0.6 }),
  tree(27.0, T1, 26.8, 4.5, { seed: 2, w: 0.65 }),
  { type: 'treehills_lamp', pos: [26.6, T1, 27.6], rotY: -HP },
  { type: 'treehills_nursery', pos: [17.2, T1, 34.0], rotY: 0, w: 2.2 },
  { type: 'treehills_sprinkler', pos: [21.4, T1, 25.6] },
  { type: 'treehills_fringe', pos: [19.7, T1, 23.4], rotY: -HP, L: 2.4, seed: 11, flowers: false },
];
