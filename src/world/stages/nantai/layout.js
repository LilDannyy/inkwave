// Mount Nantai — stage layout (src/world/stages/nantai/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, environment (this file)
//   props.js     prop pack + placements (set dressing)        surfaces.js  stage surface materials (texlib)
//   murals.js    stage decals / signage (mural atlas)         backdrop.js  the far scenery round the arena
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { SURF } from './surfaces.js';
import { buildBackdrop } from './backdrop.js';

// ------------------------------------------------------------------------------------------------------------
// Mount Nantai — the Nantai Observatory grounds on the summit shoulder, a promontory of granite in the tarn below the
// summit. The Nantai Brook runs out of the tarn across the grounds twice (one reach per half), so every push is a
// crossing. Alpha at −Z (the half list), Bravo is the 180° twin.
// Levels: G0 lawn / banks / shore 0 · bridge crown 0.8 · G1 first terrace, weir crest, rehearsal hollow 1.3 ·
//         G2 west terrace + ridge 2.6 · G3 spawn (the forecourt on the control building's roof) 3.8.
//   • spawn: the dome's forecourt on the control building (G3). Exits: the grand stair (mid), a drop onto the west
//     terrace (right), the side stair down the building's east face to the east yard (left).
//   • right lane (−X for Alpha) "the Ridge": a granite spine (G2) along the tarn cliff to the viewing platform at its
//     nose; a boardwalk down onto the weir's crest (G1) → the lawn's west end. Beside it the rehearsal hollow (G1) with
//     Pearl's rock (2.4) between the ridge and the west terrace (G2).
//   • mid: the grand stair → the first terrace (G1) → steps cut along its wall → the bank → the Old Stone Bridge.
//     Or the west terrace's long flight straight down to the bridge head.
//   • left lane (+X) "the Shore": the east yard (G1) and the tarn shore trail (G0) to the log bridge.
//   • centre: the star-party lawn between the two brooks.
// ------------------------------------------------------------------------------------------------------------
const G0 = 0, G1 = 1.3, G2 = 2.6, G3 = 3.8, FL = -2.4;
const K = {
  turf: '#9fb58a', gravel: '#cfc9bb', granite: '#c9c6bf', graniteDk: '#b7b3aa', stone: '#d6d0c4', spawn: '#eae6de',
  timber: '#b58d66', concrete: '#c8c5bd', build: '#d8d1c3',
};
const turf = (o = {}) => ({ color: K.turf, pattern: SURF.turf, ...o });
const gravel = (o = {}) => ({ color: K.gravel, pattern: PATTERN.pavers, ...o });
const granite = (o = {}) => ({ color: K.granite, pattern: SURF.granite, ...o });
const timber = (o = {}) => ({ color: K.timber, pattern: SURF.timber, ...o });
const steps = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const DEG = 180 / Math.PI;

// ============================================================================================================
// The Nantai Brook (Alpha's reach; Bravo's is its twin). Its two banks as polylines, x ascending: BS = the base side,
// BN = the lawn side. Three reaches: W (the weir reach, 4.5–5 m), M (the Old Stone Bridge, straight along x, 4 m), E (the
// log-bridge reach, 3.6 m).
// ============================================================================================================
export const BS = [[-26, -11.6], [-8, -13.8], [12, -13.8], [26, -20.84]];
export const BN = [[-26, -6.66], [-8, -9.8], [12, -9.8], [26, -16.84]];
export const zAt = (pl, x) => {
  for (let i = 0; i < pl.length - 1; i++) { const [ax, az] = pl[i], [bx, bz] = pl[i + 1]; if (x <= bx || i === pl.length - 2) return az + ((bz - az) * (x - ax)) / (bx - ax); }
  return pl[pl.length - 1][1];
};
// the extreme of a bank over a column [x0, x1] (vertices inside included)
const zMax = (pl, x0, x1) => Math.max(zAt(pl, x0), zAt(pl, x1), ...pl.filter(([x]) => x > x0 && x < x1).map(([, z]) => z));
const zMin = (pl, x0, x1) => Math.min(zAt(pl, x0), zAt(pl, x1), ...pl.filter(([x]) => x > x0 && x < x1).map(([, z]) => z));
const INSET = 0.25;
// ground columns on the lawn side (z from the bank to z1) / the base side (z from z0 to the bank): the stepped edge sits
// under the gravel bar along the bank
const lawnCols = (xs, z1, mk) => xs.slice(0, -1).map((x0, i) => B(x0, xs[i + 1], FL, G0, zMax(BN, x0, xs[i + 1]) + INSET, z1, mk()));
const baseCols = (xs, z0, mk) => xs.slice(0, -1).map((x0, i) => B(x0, xs[i + 1], FL, G0, z0, zMin(BS, x0, xs[i + 1]) - INSET, mk()));
// a bar along a bank segment from x0 to x1: w wide on the land side (side = +1 lawn / −1 base), top y
function bar(pl, x0, x1, side, w, y, o) {
  const a = [x0, zAt(pl, x0)], b = [x1, zAt(pl, x1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz * side, nz = ux * side;   // land-side normal
  const cx = (a[0] + b[0]) / 2 + (nx * w) / 2, cz = (a[1] + b[1]) / 2 + (nz * w) / 2;
  return O(cx, cz, L, w, FL, y, -Math.atan2(uz, ux) * DEG, o);
}

// ============================================================================================================
// Pieces (Alpha's half)
// ============================================================================================================
const HALF = [
  // ---------------- the lawn (to z 0; Bravo's twin meets it on the centre line)
  B(-8, 12, FL, G0, -9.8, 0, turf({ tag: 'lawn' })),
  ...lawnCols([-24, -20, -16, -12, -8], 0, () => turf({ tag: 'lawn-w' })),
  ...lawnCols([12, 14, 16, 18, 20, 22, 24], 0, () => turf({ tag: 'lawn-e' })),
  bar(BN, -24, -8, 1, 1.3, 0.15, gravel({ tag: 'bar-n' })),
  bar(BN, 12, 24, 1, 1.7, 0.15, gravel({ tag: 'bar-n' })),

  // ---------------- base-side ground (to the back, z −45.4): banks, the shore, and the slab under the terraces
  B(-8, 12, FL, G0, -45.4, -13.8, turf({ tag: 'bank' })),
  ...baseCols([-25.5, -24, -20, -16, -12, -8], -45.4, () => turf({ tag: 'bank-w' })),
  ...baseCols([12, 14, 16, 18, 20, 22, 24.5], -45.4, () => turf({ tag: 'bank-e' })),
  bar(BS, -25.5, -8, -1, 1.3, 0.15, gravel({ tag: 'bar-s' })),
  bar(BS, 12, 24.5, -1, 2.3, 0.15, gravel({ tag: 'bar-s' })),

  // ---------------- spawn: the forecourt on the control building (G3), the dome behind
  B(-9, 9, G0, G3 - 0.2, -45.4, -36.5, { color: K.build, pattern: PATTERN.render, tag: 'control-building' }),
  B(-9, 9, G3 - 0.2, G3, -45.4, -36.5, { color: K.spawn, pattern: PATTERN.spawn, tag: 'forecourt' }),
  R([0, G1, -30.2], [0, G3, -36.5], 6, steps({ tag: 'grand-stair' })),
  // east side stair down the building's face to the east yard (G1)
  B(9, 12.2, G1, G3, -45.4, -44.4, granite({ tag: 'east-landing' })),
  R([11.1, G1, -38.1], [11.1, G3, -44.4], 2.2, steps({ tag: 'east-stair' })),

  // ---------------- the first terrace (G1): the front of the observatory, the east yard, the shelf over the log reach
  B(-3, 17.5, G0, G1, -36.5, -22.2, granite({ tag: 't1' })),
  B(3.4, 17.5, G0, G1, -22.2, -20, granite({ tag: 't1' })),
  B(14, 17.5, G0, G1, -20, -17.1, granite({ tag: 't1-shelf' })),
  B(9, 17.5, G0, G1, -45.4, -36.5, granite({ tag: 'east-yard' })),
  // steps cut along the terrace wall down to the bank (the tower's bank run stays clear of them)
  R([-0.8, G0, -21.1], [3.4, G1, -21.1], 2.2, steps({ tag: 'wall-steps' })),
  // the shore trail ↔ the first terrace (the "switchback")
  R([22, G0, -27], [17.5, G1, -27], 2.4, gravel({ tag: 'switchback', pattern: PATTERN.rampboard })),

  // ---------------- the west terrace (G2) and its long flight to the bridge head
  B(-11, -3, G0, G2, -36.5, -23, granite({ tag: 'west-terrace' })),
  R([-6.5, G0, -17.1], [-6.5, G2, -23], 4.4, steps({ tag: 'west-flight' })),

  // ---------------- the rehearsal hollow (G1) and Pearl's rock
  B(-19, -11, G0, G1, -36.5, -17.5, turf({ tag: 'hollow' })),
  ...OCT(-15, -25.5, 2.6, G1, 2.4, granite({ tag: 'pearls-rock' })),
  R([-15, G0, -14.4], [-15, G1, -17.5], 3, steps({ tag: 'hollow-steps' })),
  R([-17, G1, -33.3], [-17, G2, -36.5], 2.4, steps({ tag: 'hollow-back-stair' })),

  // ---------------- the ridge (G2): the spine along the tarn cliff, its root behind the hollow
  B(-25.5, -19, G0, G2, -45.4, -15.2, granite({ tag: 'ridge' })),
  B(-19, -9, G0, G2, -45.4, -36.5, granite({ tag: 'ridge-root' })),
  R([-22, G1, -12.2], [-22, G2, -15.2], 2.4, timber({ tag: 'boardwalk' })),

  // ---------------- crossings
  // the weir across the W reach: crest (G1) bank to bank, steel stair down to the lawn
  B(-23.2, -20.8, FL, G1, -12.6, -6.6, { color: K.concrete, pattern: PATTERN.concrete, tag: 'weir' }),
  R([-22, G0, -3.5], [-22, G1, -6.6], 2.4, { color: '#8a9096', pattern: PATTERN.treads, tag: 'weir-stair' }),
  // the Old Stone Bridge (M reach): humped, crown 0.8
  B(-2, 2, -0.6, 0.8, -14.6, -9.0, granite({ tag: 'bridge-crown' })),
  R([0, G0, -6.8], [0, 0.8, -9.0], 4, granite({ tag: 'bridge-ramp' })),
  R([0, G0, -16.8], [0, 0.8, -14.6], 4, granite({ tag: 'bridge-ramp' })),
  // the log bridge (E reach): two split logs, square across the reach
  O(20, -15.84, 1.6, 6.8, -0.35, 0.25, 26.7, timber({ tag: 'log-bridge' })),

  // ---------------- the back: rock walls behind the ridge root and the east yard (off-limits)
  B(-25.5, -9, G2, 6.5, -46, -45.4, granite({ tag: 'crag', roof: true })),
  B(9, 24.5, G1, 5.5, -46, -45.4, granite({ tag: 'crag', roof: true })),
];

// ============================================================================================================
// Modes
// ============================================================================================================
// Zone Control: the lawn in front of the marquees (centre); Pearl's rock + the hollow floor in front of it (side)
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const circle = (cx, cz, r, n = 16) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [+(cx + Math.cos(a) * r).toFixed(3), +(cz + Math.sin(a) * r).toFixed(3)]; });
const ZONES = {
  center: [{ poly: rect(-5.5, 5.5, -5, 5), y0: -0.3, y1: 0.6 }],
  side: { polys: [circle(-15, -25.5, 2.3), rect(-19, -11, -22.9, -17.5)], y0: 1.2, y1: 2.5 },
};
// Tower Command (authored on Bravo's side, z > 0; Alpha pushes it there): over the Old Stone Bridge, along the bank,
// up onto the shelf, back across the first terrace, up onto the west terrace to the goal below the forecourt
const TOWER = {
  path: [[0, 0], [0, 18.5], [-15.25, 18.5], [-15.25, 26], [5.75, 26], [5.75, 30.5]],
  checkpoints: [[-6, 18.5], [-10, 26]],
};

const LAYOUT_NANTAI = {
  id: 'nantai',
  bounds: { minX: -26, maxX: 26, minZ: -46, maxZ: 46 },
  spawnPads: [[0, G3, -41], [0, G3, 41]],
  spawnBarrier: 4.2,
  env: { backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false, stars: true },
  zones: ZONES,
  tower: TOWER,
  single: [],
  half: HALF,
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = LAYOUT_NANTAI;
