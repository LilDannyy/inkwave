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
import { registerPlaza } from './plaza.js';
import { registerWorks } from './works.js';
import { FEET, GROUND, PODS } from './layout.js';
import { T1, T2, T3, SP, TURBINE, GREENHOUSE, RILL_Y, GROVES, BED_H } from './plan.js';

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
  registerPlaza(D, H, T);
  registerWorks(D, H, T);
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
// (lite below 6.8 m: the forest's fill trees — the tall ones keep every tier)
const tree = (x, y, z, h, o = {}) => ({ type: 'treehills_tree', pos: [x, y, z], h, kind: o.kind ?? 'hinoki', seed: o.seed ?? Math.round(Math.abs(x * 7 + z * 3)) % 9, w: o.w ?? 0.8, lite: h < 6.8, ...o });
const rail = (pts, y, o = {}) => ({ type: 'treehills_rail', pos: [0, 0, 0], rotY: 0, pts: pts.map(([x, z]) => [x, y, z]), ...o });
// a point pulled 0.35 m in from an outline corner toward a reference point (railings stand just inside the coping)
const inset = (p, c, d = 0.4) => { const dx = c[0] - p[0], dz = c[1] - p[1], L = Math.hypot(dx, dz); return [p[0] + (dx / L) * d, p[1] + (dz / L) * d]; };

// a grove (plan.js GROVES) → its plants: trees on a 1.45 m hex lattice (rows 1.256 m apart) inside the bed (0.55 m in
// from its edge; a narrow bed: one file), the lattice's phase chosen to fit the most points; the n nearest the bed's middle are trees (the
// tallest in the middle; cores 1.1 m, so neighbours' cores stand 0.35 m apart: one solid clump, no pockets), the next m
// shrubs; ferns round the rim. The bed's lift (BED_H) under them; no mulch rings of their own (the bed is the mulch).
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function groveParts(g) {
  const a = (g.deg * P) / 180, ux = [Math.cos(a), -Math.sin(a)], uz = [Math.sin(a), Math.cos(a)];
  const W = (lx, lz) => [+(g.x + lx * ux[0] + lz * uz[0]).toFixed(3), +(g.z + lx * ux[1] + lz * uz[1]).toFixed(3)];
  const S = 1.45, RS = S * 0.866, ix = g.w / 2 - 0.55, iz = g.d / 2 - 0.55;
  let best = [];
  // or (a narrow bed, when it fits more) one file along its long side, 1.3 m apart (cores overlapping), zigzagging a little
  {
    const lim = Math.max(ix, iz), zig = Math.max(0, Math.min(0.15, Math.min(ix, iz)));
    for (const f of [0, 0.5]) {
      const pts = [];
      for (let k = -8; k <= 8; k++) { const s = (k + f) * 1.3; if (Math.abs(s) <= lim + 1e-6) pts.push(ix >= iz ? [s, (k % 2 ? 1 : -1) * zig] : [(k % 2 ? 1 : -1) * zig, s]); }
      if (pts.length > best.length) best = pts;
    }
  }
  for (const fz of [0, 0.5]) for (const fx of [0, 0.5]) {
    const pts = [];
    for (let k = -6; k <= 6; k++) for (let j = -6; j <= 6; j++) {
      const lz = (k + fz) * RS, lx = (j + fx + (Math.abs(k) % 2) * 0.5) * S;
      if (Math.abs(lx) <= ix + 1e-6 && Math.abs(lz) <= iz + 1e-6) pts.push([lx, lz]);
    }
    if (pts.length >= best.length) best = pts;
  }
  best.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]) || p[0] - q[0] || p[1] - q[1]);
  const tp = g.pts || best.slice(0, g.n), sp = g.spts || (g.pts ? [] : best.slice(g.n, g.n + g.m));
  const y = g.y + (g.bed ? BED_H : 0), out = [];
  tp.forEach(([lx, lz], i) => {
    const r = hs(g.seed * 7 + i), h = i === 0 ? g.hmax : g.hmax * (0.72 + 0.22 * r), kind = hs(g.seed * 3 + i * 5) < 0.62 ? 'hinoki' : 'thujopsis';
    const [x, z] = W(lx + (hs(g.seed + i * 11) - 0.5) * 0.16, lz + (hs(g.seed * 5 + i) - 0.5) * 0.16);
    out.push(tree(x, y, z, +h.toFixed(2), { kind, seed: (g.seed * 3 + i) % 9, w: kind === 'hinoki' ? 0.8 + 0.1 * r : 0.72, core: 1.1, mulch: false }));
  });
  sp.forEach(([lx, lz], i) => {
    const [x, z] = W(lx, lz);
    out.push({ type: 'treehills_shrubs', pos: [x, y, z], w: 1.15, h: 1.05 + 0.2 * hs(g.seed + i), seed: g.seed * 2 + i });
  });
  // ferns: round the rim, every ~1.3 m, 0.35 m in from the bed's edge
  const per = 2 * (g.w + g.d), nf = Math.max(3, Math.round(per / 1.6));
  for (let f = 0; f < nf; f++) {
    let t = ((f + 0.5) / nf) * per, lx, lz;
    const ex = g.w / 2 - 0.4, ez = g.d / 2 - 0.4;
    if (t < g.w) { lx = -g.w / 2 + t; lz = -ez; } else if ((t -= g.w) < g.d) { lx = ex; lz = -g.d / 2 + t; } else if ((t -= g.d) < g.w) { lx = g.w / 2 - t; lz = ez; } else { t -= g.w; lx = -ex; lz = g.d / 2 - t; }
    lx = Math.max(-ex, Math.min(ex, lx)); lz = Math.max(-ez, Math.min(ez, lz));
    if (hs(g.seed * 13 + f) < 0.3) continue;
    const [x, z] = W(lx, lz);
    out.push({ type: 'treehills_ferns', pos: [x, y, z], r: 0.42 + 0.2 * hs(g.seed + f * 3), seed: (g.seed + f) % 9 });
  }
  return out;
}

export const PLACEMENTS = [
  // ================= the environment's footprint under the raised tiers (their columns and copings) and the station
  ...['apron', 'lobe', 'strip', 'upper', 'crown'].flatMap((k) => footOf(GROUND[k].cols)),
  ...FEET.map((f) => ({ type: 'treehills_foot', pos: [f.cx, 0, f.cz], rotY: (f.rot * P) / 180, len: f.len, w: f.w, oboxCols: true })),
  { type: 'treehills_foot', pos: [0, 0, -42.5], rotY: 0, len: 18, w: 9 },

  // ================= the sprout pods: the planters are the stage's (static colliders, baked, turned ones kept turned);
  //                   the bulbs and hedges are the pods engine's (src/game/pods.js)
  ...PODS.list.map((p) => ({ type: 'treehills_pod', part: 'planter', pos: p.pos, rotY: p.rotY, oboxCols: true })),

  // ================= the research station (spawn) and the base terrace (T1): a working apron — the greenhouse, cargo
  //                   modules, seed-bank crates, a solar rack, the drone pad, the antenna mast; consoles on the deck
  { type: 'treehills_station', pos: [0, 0, -42.5], rotY: 0 },
  { type: 'treehills_console', pos: [7.4, SP, -39.1], rotY: 0, w: 1.4 },
  { type: 'treehills_console', pos: [-7.4, SP, -39.1], rotY: 0, w: 1.4 },
  { type: 'treehills_planter', pos: [4.3, SP, -38.55], rotY: 0, w: 1.6, d: 0.8, h: 1.0, seed: 31 },
  { type: 'treehills_planter', pos: [-4.3, SP, -38.55], rotY: 0, w: 1.6, d: 0.8, h: 1.0, seed: 33 },
  { type: 'treehills_planter', pos: [4.8, T1, -28.6], rotY: 0, w: 1.8, d: 0.8, h: 1.0, seed: 35, tree: 0.2 },
  { type: 'treehills_planter', pos: [-3.4, T1, -27.8], rotY: 0, w: 1.6, d: 0.8, h: 1.0, seed: 37 },
  { type: 'treehills_greenhouse', pos: [-8.5, T1, -34.8], rotY: 0, L: 6, R: 1.55, num: 'G-2', seed: 3 },
  { type: 'treehills_cargo', pos: [-10.8, T1, -27.0], rotY: 0, L: 5.5, num: 'ALT-07' },
  { type: 'treehills_crates', pos: [10.2, T1, -31.4], rotY: 0.18, n: 3 },
  { type: 'treehills_solar', pos: [6.2, T1, -35.6], rotY: 0, w: 3.0 },
  { type: 'treehills_planter', pos: [7.4, T1, -37.4], rotY: 0, w: 2.6, d: 0.7, h: 0.55, seed: 19 },
  { type: 'treehills_crates', pos: [-12.6, T1, -39.6], rotY: HP, n: 2 },
  { type: 'treehills_dronepad', pos: [12.6, T1, -24.6], rotY: 0.3 },
  { type: 'treehills_mast', pos: [13.9, T1, -39.4], rotY: 0.5, h: 8 },
  { type: 'treehills_bench', pos: [-14.2, T1, -35.4], rotY: HP },
  { type: 'treehills_lamp', pos: [-14.3, T1, -24.8], rotY: HP },
  { type: 'treehills_lamp', pos: [14.3, T1, -37.4], rotY: -HP },
  { type: 'treehills_totem', pos: [-4.6, T1, -25.7], rotY: 0, lines: [['^ MEADOW'], ['SEED BANK 05 >']] },
  { type: 'treehills_padring', pos: [-5.47, T1, -30.0], rotY: 0 },
  { type: 'treehills_bollard', pos: [4.1, T1, -25.5] },
  { type: 'treehills_bollard', pos: [-4.1, T1, -32.4] },
  { type: 'treehills_bollard', pos: [4.1, T1, -32.4] },

  // ================= the working garden (0): the rill (footbridge, stepping stones), a polytunnel, the tool shed, a
  //                   water tank, raised beds; the central path stair → footbridge → the plaza's ramp stays open
  { type: 'treehills_footbridge', pos: [0, 0, -16.8], rotY: HP, L: 2.8 },
  { type: 'treehills_stones', pos: [-7.2, 0, -16.8], rotY: HP, n: 3, y0: RILL_Y, seed: 2 },
  { type: 'treehills_stones', pos: [8.4, 0, -16.8], rotY: HP, n: 3, y0: RILL_Y, seed: 5 },
  { type: 'treehills_polytunnel', pos: [9.8, 0, -20.0], rotY: 0, L: 6, R: 1.4 },
  { type: 'treehills_shed', pos: [-9.4, 0, -19.9], rotY: 0 },
  { type: 'treehills_tank', pos: [-6.4, 0, -23.1], r: 0.9, h: 2.0 },
  { type: 'treehills_planter', pos: [-5.6, 0, -19.4], rotY: 0, w: 2.6, d: 1.1, h: 0.6, seed: 23 },
  { type: 'treehills_planter', pos: [5.8, 0, -23.3], rotY: 0, w: 2.6, d: 1.1, h: 0.6, seed: 29, flowers: ['#f2d45a', '#e98ab0', '#b79ae6'] },
  { type: 'treehills_shrubs', pos: [-4.5, 0, -15.2], w: 1.2, h: 1.0, seed: 3, flowers: true },
  { type: 'treehills_shrubs', pos: [9.6, 0, -15.1], w: 1.2, h: 1.0, seed: 9, flowers: true },
  { type: 'treehills_lamp', pos: [-5.0, 0, -22.2], rotY: 0 },
  { type: 'treehills_sprinkler', pos: [-6, 0, -17.9] }, { type: 'treehills_sprinkler', pos: [5, 0, -18.4] },
  { type: 'treehills_wallvalve', pos: [-6.5, 0.72, -25], rotY: 0, label: 'W-07' },
  { type: 'treehills_hatch', pos: [-4.6, 0.64, -25], rotY: 0, r: 0.4, num: '07' },

  // ================= the Seed Vault Plaza (1.3) and the Solar Canopy over it; the meadow round it: the greenhouse pod,
  //                   the mounds (layout), a boulder, a fallen log, pairs of boulders at the ramp's foot
  { type: 'treehills_canopy', pos: [0, 0, 0], rotY: 0, mirror: false },
  { type: 'treehills_clump', pos: [-5.0, T1, -3.9], seed: 12, r: 0.9 },
  { type: 'treehills_console', pos: [2.0, T1, -4.2], rotY: 0, w: 1.6 },
  { type: 'treehills_greenhouse', pos: [GREENHOUSE.x, 0, GREENHOUSE.z], rotY: 0, L: GREENHOUSE.L, R: GREENHOUSE.R, num: 'G-7', seed: 7 },
  { type: 'treehills_boulder', pos: [4.7, 0, -8.0], w: 1.5, h: 1.3, d: 1.2, seed: 4 },
  { type: 'treehills_log', pos: [10.8, 0, -3.4], rotY: 0.08, L: 3.2 },
  { type: 'treehills_boulder', pos: [-2.4, 0, -13.2], w: 1.2, h: 1.0, d: 1.0, seed: 6 },
  { type: 'treehills_boulder', pos: [2.5, 0, -13.7], w: 1.3, h: 1.1, d: 1.1, seed: 8 },
  { type: 'treehills_shrubs', pos: [12.3, 0.8, -11.05], w: 1.2, h: 1.2, seed: 25 },
  { type: 'treehills_boulder', pos: [-12.0, 0.6, -5.2], w: 1.1, h: 1.0, d: 0.9, seed: 14 },
  { type: 'treehills_sprinkler', pos: [-6, 0, -10.6] }, { type: 'treehills_sprinkler', pos: [7.6, 0, -2.8] },

  // ================= the east tree-hill (authored whole; the west hill is its twin): a forest — the groves (plan.js
  //                   GROVES: a bed each, planted as one solid clump) on every terrace, winding trails between them
  //                   (the lobe's stepping stones, the murals' gravel), clearings for the ranger shelter, the solar
  //                   array and the turbine
  ...GROVES.flatMap(groveParts),
  // ---- the south lobe (T1, Alpha's left lane)
  // a tree line along the lobe's water edge (on the coping: the lane stays inside), the corner grove's flank
  tree(19.51, T1, -27.29, 6.6, { seed: 4, w: 0.8, core: 1.0 }),
  tree(21.9, T1, -24.57, 7.4, { kind: 'thujopsis', seed: 7, w: 0.74, core: 1.0 }),
  tree(23.72, T1, -23.51, 6.2, { seed: 1, w: 0.82, core: 1.0 }),
  tree(26.21, T1, -20.3, 7.8, { seed: 6, w: 0.8, core: 1.0 }),
  tree(28.61, T1, -16.15, 6.0, { kind: 'thujopsis', seed: 3, w: 0.74, core: 1.0 }),
  { type: 'treehills_boulder', pos: [27.9, T1, -17.9], w: 1.3, h: 1.1, d: 1.1, seed: 9 },
  { type: 'treehills_lamp', pos: [19.9, T1, -17.4], rotY: -HP },
  { type: 'treehills_shrubs', pos: [19.0, T1, -15.2], w: 1.0, h: 1.1, seed: 27 },
  { type: 'treehills_totem', pos: [26.5, T1, -13.9], rotY: 0, lines: [['^ TURBINE HILL'], ['< MEADOW']] },
  { type: 'treehills_ferns', pos: [21.2, T1, -24.4], r: 0.6, seed: 4 }, { type: 'treehills_ferns', pos: [17.6, T1, -24.9], r: 0.5, seed: 8 },
  // ---- the band (T1) along the meadow: lamps by the upper tier's wall, shrubs at its foot, the groves between
  { type: 'treehills_lamp', pos: [19.05, T1, -6.2], rotY: -HP },
  { type: 'treehills_lamp', pos: [19.05, T1, 9.6], rotY: -HP },
  { type: 'treehills_hives', pos: [18.8, T1, -12.6], rotY: HP, n: 3 },
  { type: 'treehills_shrubs', pos: [18.9, T1, 4.2], w: 1.2, h: 1.1, seed: 15 },
  { type: 'treehills_shrubs', pos: [18.9, T1, -4.5], w: 1.2, h: 1.1, seed: 17 },
  { type: 'treehills_fringe', pos: [19.2, T1, 9.1], rotY: -HP, L: 2.6, seed: 9 },
  { type: 'treehills_fringe', pos: [19.2, T1, 6.1], rotY: -HP, L: 2.4, seed: 5 },
  { type: 'treehills_hatch', pos: [19.5, 1.95, -7.2], rotY: -HP, num: 'T-1' },
  { type: 'treehills_wallvalve', pos: [19.5, 1.9, 15.2], rotY: -HP, label: 'IRR 4' },
  { type: 'treehills_hatch', pos: [15, 0.62, -19.2], rotY: -HP, r: 0.4, num: 'B-3' },
  { type: 'treehills_wallvalve', pos: [15, 0.7, 11.6], rotY: -HP, label: 'IRR 2' },
  // ---- the upper tier (T2): the ranger shelter's clearing, the solar array in the south prow, the hives
  { type: 'treehills_ranger', pos: [23.2, T2 + 0.08, -4.6], rotY: 0 },
  { type: 'treehills_birdhouse', pos: [21.45, T2 + 0.08, -2.5], rotY: -HP },
  { type: 'treehills_bench', pos: [25.75, T2, -8.75], rotY: -HP },
  { type: 'treehills_totem', pos: [19.95, T2, -8.3], rotY: -HP, num: 'T-2', lines: [['RANGER POST'], ['CROWN TRAIL']] },
  { type: 'treehills_ferns', pos: [21.65, T2, 7.7], r: 0.42, seed: 2 }, { type: 'treehills_ferns', pos: [21.65, T2, 13.2], r: 0.42, seed: 5 },
  { type: 'treehills_ferns', pos: [26.15, T2, 4.2], r: 0.4, seed: 7 }, { type: 'treehills_ferns', pos: [26.15, T2, 7.6], r: 0.4, seed: 1 }, { type: 'treehills_ferns', pos: [26.2, T2, 11.9], r: 0.4, seed: 4 },
  { type: 'treehills_solar', pos: [31.7, T2, -5.9], rotY: HP, w: 2.8 },
  { type: 'treehills_hives', pos: [29.6, T2, 18.9], rotY: 0, n: 2 },
  { type: 'treehills_ferns', pos: [20.3, T2, 8.0], r: 0.5, seed: 3 }, { type: 'treehills_ferns', pos: [20.2, T2, 13.1], r: 0.55, seed: 6 },
  rail([inset([31.5, -10], [28, -6]), inset([33, -7.402], [28, -6]), inset([33, -4], [28, -6])], T2),
  rail([inset([33, 14], [28, 16]), inset([31, 17.464], [28, 16]), inset([31, 20], [28, 16])], T2),
  // ---- the crown (T3): the turbine in its clearing, the hut, the weather mast, a bench over the meadow
  { type: 'treehills_turbine', pos: [TURBINE.x, T3, TURBINE.z], rotY: -HP, hub: TURBINE.hub },
  rail([inset([33, -4], [30, 5]), inset([35.5, 0.33], [30, 5]), inset([35.5, 9.67], [30, 5]), inset([33, 14], [30, 5])], T3),
  { type: 'treehills_bench', pos: [27.3, T3, 4.6], rotY: -HP },
  { type: 'treehills_lamp', pos: [30.1, T3, 9.2], rotY: 0 },
  { type: 'treehills_weather', pos: [31.3, T3, -1.0], rotY: 0.3 },
  { type: 'treehills_hut', pos: [28.2, T3, 7.6], rotY: 0 },
  rail(Array.from({ length: 9 }, (_, k) => { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; return [TURBINE.x + Math.cos(a) * 2.25, TURBINE.z + Math.sin(a) * 2.25]; }), T3, { h: 0.95 }),
  { type: 'treehills_hatch', pos: [26.5, 3.25, 1.2], rotY: -HP, r: 0.38, num: 'C-1' },
  // ---- the north strip (T1, Bravo's right lane: the service route down to Bravo's terrace)
  tree(27.0, T1, 26.8, 5.2, { seed: 2, w: 0.75 }),
  tree(27.35, T1, 28.2, 5.8, { kind: 'thujopsis', seed: 8, w: 0.72, core: 1.0 }),
  { type: 'treehills_lamp', pos: [26.4, T1, 29.4], rotY: HP },
  { type: 'treehills_compost', pos: [20.9, T1, 34.3], rotY: 0 },
  { type: 'treehills_boulder', pos: [26.6, T1, 31.2], w: 1.1, h: 1.2, d: 1.0, seed: 16 },
  { type: 'treehills_nursery', pos: [17.2, T1, 34.0], rotY: 0, w: 2.2 },
  tree(23.5, T1, 35.0, 5.0, { kind: 'thujopsis', seed: 5, w: 0.7 }),
  { type: 'treehills_sprinkler', pos: [21.4, T1, 25.6] },
  { type: 'treehills_ferns', pos: [22.6, T1, 24.6], r: 0.5, seed: 9 },
];
