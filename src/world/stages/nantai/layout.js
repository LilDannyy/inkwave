// Mount Nantai — stage layout (src/world/stages/nantai/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, environment (this file)
//   props.js     prop pack + placements (set dressing)        surfaces.js  stage surface materials (texlib)
//   murals.js    stage decals / signage (mural atlas)         backdrop.js  the far scenery round the arena
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { SURF } from './surfaces.js';
import { buildBackdrop } from './backdrop.js';
import { MURAL } from './murals.js';

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
  turf: '#c3c0b8', gravel: '#cfc9bb', graniteLt: '#d3d0c9', granite: '#c9c6bf', graniteDk: '#b7b3aa', stone: '#d6d0c4', spawn: '#eae6de',
  timber: '#b58d66', concrete: '#c8c5bd', build: '#d8d1c3',
};
const turf = (o = {}) => ({ color: K.turf, pattern: SURF.turf, ...o });
const gravel = (o = {}) => ({ color: K.graniteLt, pattern: SURF.granite, ...o });   // the brook's granite shelves
const granite = (o = {}) => ({ color: K.granite, pattern: SURF.granite, ...o });
const timber = (o = {}) => ({ color: K.timber, pattern: PATTERN.wood, ...o });
const ashlar = (o = {}) => ({ color: K.stone, pattern: SURF.ashlar, ...o });
const steps = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const DEG = 180 / Math.PI;

// ============================================================================================================
// The Nantai Brook (Alpha's reach; Bravo's is its twin). Its two banks as polylines, x ascending: BS = the base side,
// BN = the lawn side. Three reaches: W (the weir reach, 4.5–5 m), M (the Old Stone Bridge, straight along x, 4 m), E (the
// log-bridge reach, 3.6 m).
// ============================================================================================================
export const BS = [[-26, -11.6], [-8, -13.8], [12, -13.8], [26, -20.84]];
export const BN = [[-26, -6.66], [-8, -9.6], [12, -9.6], [26, -16.84]];
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
  B(7.2, 12, FL, G0, -9.6, 0, turf({ tag: 'lawn' })),
  B(-8, -7.2, FL, G0, -9.6, 0, turf({ tag: 'lawn' })),
  ...lawnCols([-24, -20, -16, -12, -8], 0, () => turf({ tag: 'lawn-w' })),
  // dry-stone walls on the lawn (the centre zone's cover, with the Dobsonians' crates)
  B(-6.3, -2.9, G0, 0.95, -4.1, -3.4, granite({ tag: 'drystone-wall', color: K.graniteDk })),
  ...lawnCols([12, 14, 16, 18, 20, 22], 0, () => turf({ tag: 'lawn-e' })),
  // the lawn's east end: a bay of the tarn between the brook mouth and the lookout point
  B(22, 24, FL, G0, zMax(BN, 22, 24) + INSET, -11, turf({ tag: 'lawn-e' })),
  B(22, 24, FL, G0, -6, 0, turf({ tag: 'lawn-e' })),
  B(24, 25.6, FL, G0, -4.6, -0.8, granite({ tag: 'lookout-point' })),
  bar(BN, -24, -8, 1, 1.3, 0.15, gravel({ tag: 'bar-n' })),
  bar(BN, 12, 24, 1, 1.7, 0.15, gravel({ tag: 'bar-n' })),

  // ---------------- base-side ground (to the back, z −45.4): banks, the shore, and the slab under the terraces
  B(-8, 12, FL, G0, -45.4, -13.8, turf({ tag: 'bank' })),
  ...baseCols([-23.5, -20, -16, -12, -8], -45.4, () => turf({ tag: 'bank-w' })),
  B(-25.5, -23.5, FL, G0, -45.4, -36, turf({ tag: 'bank-w' })), B(-25.5, -23.5, FL, G0, -28, zMin(BS, -25.5, -23.5) - INSET, turf({ tag: 'bank-w' })),
  // (the E reach: the bank under the tower's run, the shelf, the shore trail with a bay)
  ...baseCols([12, 14, 15], -45.4, () => turf({ tag: 'bank-e' })),
  ...baseCols([15, 17.5, 20, 22], -45.4, () => turf({ tag: 'shore' })),
  B(22, 24.5, FL, G0, -45.4, -38, turf({ tag: 'shore' })), B(22, 24.5, FL, G0, -30, zMin(BS, 22, 24.5) - INSET, turf({ tag: 'shore' })),
  bar(BS, -25.5, -8, -1, 1.3, 0.15, gravel({ tag: 'bar-s' })),
  bar(BS, 12, 16.2, -1, 1.4, 0.15, gravel({ tag: 'bar-s' })),
  bar(BS, 16.2, 24.5, -1, 2.3, 0.15, gravel({ tag: 'bar-s' })),

  // ---------------- spawn: the forecourt on the control building (G3), the dome behind
  B(-9, 9, G0, G3 - 0.2, -45.4, -36.5, ashlar({ color: K.graniteDk, tag: 'control-building' })),
  B(-9, 9, G3 - 0.2, G3, -45.4, -36.5, { color: K.spawn, pattern: PATTERN.spawn, tag: 'forecourt' }),
  B(3, 9, G3, G3 + 0.75, -37.1, -36.5, { color: K.build, pattern: PATTERN.render, tag: 'forecourt-parapet' }),
  // the control room: the timber-and-steel upper storey at the forecourt's east corner (weather mast on its roof)
  B(5.4, 9, G3, 6.4, -45.4, -42.2, { color: '#8f7a64', pattern: PATTERN.weatherboard, tag: 'control-room', roof: true }),
  // the dome's drum (the dome itself is a prop) behind the forecourt
  B(-9, 9, G3, 7.2, -46, -45.4, { color: '#eceae4', pattern: PATTERN.render, tag: 'dome-drum', roof: true }),
  R([0, G1, -30.2], [0, G3, -36.5], 6, steps({ tag: 'grand-stair' })),
  // east side stair down the building's face to the east yard (G1)
  B(9, 11.2, G1, G3, -45.4, -44.4, ashlar({ tag: 'east-landing' })),
  R([10.1, G1, -38.1], [10.1, G3, -44.4], 2.2, steps({ tag: 'east-stair' })),

  // ---------------- the first terrace (G1): the front of the observatory, the east yard, the shelf over the log reach
  B(-3, 9, G0, G1, -36.5, -22.2, ashlar({ tag: 't1' })),
  B(9, 17.5, G0, G1, -36.5, -22.2, ashlar({ tag: 't1', mural: [{ n: [0, 1, 0], id: MURAL.rose }] })),   // (split on a 2.4 m repeat: no seam; the compass rose centred on it)
  B(3.4, 17.5, G0, G1, -22.2, -20, ashlar({ tag: 't1', mural: [{ n: [0, 0, 1], id: MURAL.inscription }] })),
  B(15, 17.5, G0, G1, -20, -17.1, ashlar({ tag: 't1-shelf' })),
  B(9, 17.5, G0, G1, -45.4, -36.5, ashlar({ tag: 'east-yard' })),
  // the roll-off-roof observatory hut on the terrace (its walls ink, its roof is off-limits)
  B(8.2, 11.8, G1, 3.9, -33.6, -30.4, { color: '#e8e2d4', pattern: PATTERN.weatherboard, tag: 'rolloff-hut', roof: true }),
  // steps cut along the terrace wall down to the bank (the tower's bank run stays clear of them)
  R([-0.8, G0, -21.1], [3.4, G1, -21.1], 2.2, steps({ tag: 'wall-steps' })),
  // the shore trail ↔ the first terrace, and the shore's back end up to the east yard
  // the switchback path up from the shore trail: a leg along the shore to a landing, a leg back up onto the terrace
  R([23.3, G0, -23.6], [23.3, 0.65, -26.4], 2.2, { color: K.gravel, pattern: PATTERN.rampboard, tag: 'switchback' }),
  B(22.2, 24.4, G0, 0.65, -28.4, -26.4, ashlar({ tag: 'switchback-landing' })),
  R([22.2, 0.65, -27.4], [17.5, G1, -27.4], 2.0, { color: K.gravel, pattern: PATTERN.rampboard, tag: 'switchback' }),
  R([21.1, G0, -37.5], [21.1, G1, -43.6], 2.2, steps({ tag: 'shore-stair' })),
  B(17.5, 22.2, G0, G1, -45.4, -43.6, ashlar({ tag: 'shore-landing' })),

  // ---------------- the west terrace (G2) and its long flight to the bridge head; the bastion by the hollow
  B(-11, -3, G0, G2, -36.5, -23, ashlar({ tag: 'west-terrace' })),
  B(-11, -8.7, G0, G2, -23, -19, ashlar({ tag: 'bastion', mural: [{ n: [0, 0, 1], id: MURAL.blaze }] })),
  R([-6.5, G0, -17.1], [-6.5, G2, -23], 4.4, steps({ tag: 'west-flight' })),

  // ---------------- the rehearsal hollow (G1) and Pearl's rock
  B(-19, -11, G0, G1, -31.5, -19.5, turf({ tag: 'hollow', mural: [{ n: [0, 1, 0], id: MURAL.shock }] })),
  B(-19, -11, G0, G1, -19.5, -17.5, turf({ tag: 'hollow' })),
  ...OCT(-15, -25.5, 2.6, G1, 2.4, granite({ tag: 'pearls-rock' })),
  R([-15.4, G0, -14.4], [-15.4, G1, -17.5], 3, steps({ tag: 'hollow-steps' })),
  R([-17.9, G1, -28], [-17.9, G2, -31], 2.2, steps({ tag: 'hollow-back-stair' })),
  R([-14.2, G1, -20.9], [-11, G2, -20.9], 2.2, steps({ tag: 'bastion-stair' })),

  // ---------------- the ridge (G2): the spine along the tarn cliff (a bay mid-way), its root behind the hollow,
  //                  the timber viewing platform on its nose
  B(-25.5, -19, G0, G2, -45.4, -36, granite({ tag: 'ridge' })),
  B(-23.5, -19, G0, G2, -36, -28, granite({ tag: 'ridge' })),
  B(-25.5, -19, G0, G2, -28, -19.2, granite({ tag: 'ridge' })),
  B(-25.5, -19, G0, 2.45, -19.2, -15.2, granite({ tag: 'ridge-nose' })),
  B(-25.8, -18.8, 2.45, G2, -19.2, -15.2, timber({ tag: 'viewing-platform' })),
  B(-19, -9, G0, G2, -45.4, -36.5, granite({ tag: 'ridge-root' })),
  B(-19, -11, G0, G2, -36.5, -31.5, granite({ tag: 'ridge-root' })),
  R([-22, G1, -12.2], [-22, G2, -15.2], 2.4, timber({ tag: 'boardwalk' })),

  // ---------------- crossings
  // the weir across the W reach: crest (G1) bank to bank, steel stair down to the lawn
  B(-23.2, -20.8, FL, G1, -12.6, -6.6, { color: K.concrete, pattern: PATTERN.concrete, tag: 'weir' }),
  R([-22, G0, -3.5], [-22, G1, -6.6], 2.4, { color: '#8a9096', pattern: PATTERN.treads, tag: 'weir-stair' }),
  // the Old Stone Bridge (M reach): humped, crown 0.8, parapets as cover
  B(-2, 2, -0.6, 0.8, -14.6, -9.0, ashlar({ tag: 'bridge-crown' })),
  R([0, G0, -6.8], [0, 0.8, -9.0], 4, ashlar({ tag: 'bridge-ramp' })),
  R([0, G0, -16.8], [0, 0.8, -14.6], 4, ashlar({ tag: 'bridge-ramp' })),
  ...[-1, 1].flatMap((s) => [
    B(s > 0 ? 2 : -2.45, s > 0 ? 2.45 : -2, -0.6, 1.7, -14.6, -9.0, ashlar({ tag: 'bridge-parapet', perch: true, noNav: true })),
    R([s * 2.225, 0.95, -7.3], [s * 2.225, 1.7, -9.0], 0.45, ashlar({ tag: 'bridge-parapet', thin: true, thickness: 0.85, perch: true, noNav: true })),
    R([s * 2.225, 0.95, -16.3], [s * 2.225, 1.7, -14.6], 0.45, ashlar({ tag: 'bridge-parapet', thin: true, thickness: 0.85, perch: true, noNav: true })),
  ]),
  // the log bridge (E reach): two split logs, square across the reach
  O(20, -15.84, 1.6, 6.8, -0.35, 0.25, 26.7, timber({ tag: 'log-bridge' })),

  // ---------------- the back: the summit crag behind the ridge root, the east yard and the shore (off-limits)
  B(-25.5, -9, G2, 6.5, -46, -45.4, granite({ tag: 'crag', roof: true })),
  B(9, 17.5, G1, 5.5, -46, -45.4, granite({ tag: 'crag', roof: true })),
  B(17.5, 24.5, G0, 5.5, -46, -45.4, granite({ tag: 'crag', roof: true })),
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
  path: [[0, 0], [0, 18.5], [-16.25, 18.5], [-16.25, 26], [5.75, 26], [5.75, 31]],
  checkpoints: [[-6, 18.5], [-10, 26]],
};

const LAYOUT_NANTAI = {
  id: 'nantai',
  water: 'marina',   // the tarn: calm, glassy water that mirrors the mountain (the marina water mode: no sea spray)
  bounds: { minX: -26, maxX: 26, minZ: -46, maxZ: 46 },
  spawnPads: [[0, G3, -41], [0, G3, 41]],
  spawnBarrier: 4.2,
  env: {
    backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false, stars: true,
    // the tarn: cold, clear, calm — deep teal-green, pale green shallows; crisp mountain air (a deeper zenith, less haze)
    theme: {
      all: { seaDeep: '#0d3a3a', seaShallow: '#2a7a70', seaCrest: '#86cbb6', foam: '#eef6f2', waveStrength: 0.32, seaAmbientK: 0.66,
        marina: { channel: '#0e4441', shade: '#061413', calm: 0.4, lap: 0.7, caustic: 1.6, wet: 0.45 } },
      day: { zenith: '#1453c2', skyMid: '#4b97e6', horizon: '#d3e9f6', haze: [1 / 2600, 0.85, 340], fog: [30, 1300] },
    },
  },
  zones: ZONES,
  tower: TOWER,
  // the centre of the lawn: one slab across the centre line (self-symmetric), so the turf runs on without a seam
  single: [B(-7.2, 7.2, FL, G0, -9.6, 9.6, turf({ tag: 'lawn' }))],
  half: HALF,
  // two heritage lamps per half light the paths at the bridge head and the terrace steps at dusk; the team flags fly
  // from the forecourt's back corners
  decor: { lamps: [[-4.4, -8.9], [4.3, -20.6]], palms: [], flags: [[-8.3, G3, -44.7], [4.7, G3, -44.7]] },
};

export const LAYOUT = LAYOUT_NANTAI;
