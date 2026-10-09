// Highmark Foundry — stage layout (src/world/stages/caldera/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, environment (this file)
//   geo.js       the plan as data (every outline)          ground.js  the curved-floor kit
//   lava.js      the lava's data (ENGINE.md format) and the blockout's stand-ins   props.js   prop pack + placements
//   surfaces.js  stage surface materials     murals.js  stage decals / signage     backdrop.js  the far scenery
//
// BLOCKOUT, ROUND B (the outline redrawn again, shape first). Highmark Foundry stands inside Bellows Caldera: a foundry
// round a breathing lava lake. Two works, two commas swirling round one lake. Each comma's HEAD is its base (Casting
// Hall, gallery, yard, terrace, Lakefront), a 40 m works leaning west toward its own rim; its TAIL is that rim, a 14 m
// band of rock (the north Slump head, the Ladle Road, the Rim Ridge) sweeping round the lake — bitten by the Slump — to
// a horn that ends in a point at the other works' Spillway Bridge. Each Spillway leaves the lake at the mouth under its
// bridge and opens into the Spillway Bay, a lava bay bitten into the other head's flank that pours out of the caldera:
// from above the lake, the bays and the Slumps make a pinwheel and the outline an S. Mid is Gauge Island under the 22 m
// Surge Gauge, reached by the two causeways, the second Pumice Race at HIGH and the Casting Floors at LOW.
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import * as G from './geo.js';
import { fill, edgeKinds, walls, cutColumns, rotBox, splitColumns } from './ground.js';
import { LAVA, LAVA_VIEW, BLOCKOUT_LAVA, riderStandIns } from './lava.js';

const { P, rotPoly, inPoly } = G;
const HIGH_BUILD = BLOCKOUT_LAVA && LAVA_VIEW === 'high';
// the outline alone (floors, lake, island, tiers, walls, crossings and riders): for the lead's shape sign-off shots
const OUTLINE_ONLY = true;

// ------------------------------------------------------------------------------------------------------------ palette
// the works: pale tuff paving, whitewash, works green iron, buff firebrick; the caldera: basalt, red scoria, glaze
const K = {
  tuff: '#aaa49a', tuffDk: '#97928a', basalt: '#646870', basaltDk: '#4f535a', scoria: '#5d5450', glaze: '#4d4542',
  pave: '#85878b', wall: '#45484e', iron: '#7c8186', ironDk: '#5d6268', white: '#e9e4d8', green: '#2f5a48', brick: '#c9b08a',
  spawn: '#ece7dc', pumice: '#bdb8ae', wood: '#9a7b58', cast: '#6d7176', sand: '#b9a68a', rope: '#a78f6c',
};
// (blockout patterns: never the ones the level shader caps with pale stone coping on narrow tops — plain, tiles,
// concrete, brick, glasstile, pavers, render — since the curved floors are columns often under 1.15 m wide)
const tuff = (o = {}) => ({ color: K.tuff, pattern: PATTERN.yard, ...o });
const rock = (o = {}) => ({ color: K.basalt, pattern: PATTERN.asphalt, ...o });
// (the ledges that drown: blockout colour = DESIGN.md §5.3's glaze as the stain will darken it below the high mark)
const glaze = (o = {}) => ({ color: K.glaze, pattern: PATTERN.rubber, ...o });
const coping = (o = {}) => ({ color: K.basaltDk, pattern: PATTERN.asphalt, tag: 'coping', ...o });
const steps = (o = {}) => ({ color: K.basalt, pattern: PATTERN.stonestep, ...o });
const iron = (o = {}) => ({ color: K.iron, pattern: PATTERN.metalpanel, ...o });
const cover = (c = K.cast, o = {}) => ({ color: c, pattern: PATTERN.rubber, roof: true, ...o });
const white = (o = {}) => ({ color: K.white, pattern: PATTERN.render, roof: true, ...o });
const calWall = () => ({ color: K.wall, pattern: PATTERN.concrete, roof: true, tag: 'caldera-wall' });
// (the caldera walls round the dry floors are collision-only here and drawn by props.js — caldera_walls — so they cost
// the lightmap nothing: the art pass replaces them with the backdrop's cliffs. The Slump's cliff stays a level block: it
// stands in the lava region and carries the high-mark rind)
const calWallHidden = () => ({ ...calWall(), hidden: true, paint: false });

// ============================================================================================================ floors
// the curved floors (geo.js outlines), filled by ground.js. Alpha's half unless `single`. Floors with nothing open
// under them stop at 0.45 (under the level's 0.5 m underside cull); lake banks reach −1.1 through their copings
const FLOORS = [
  { id: 'island', poly: G.ISLAND, top: 1.2, y0: -1.1, single: true, mk: () => rock({ tag: 'island', color: K.pave, pattern: PATTERN.yard }) },
  { id: 'gallery', poly: G.GALLERY, top: 4.8, y0: 3.6, w: 1.2, mk: () => ({ color: K.spawn, pattern: PATTERN.spawn, tag: 'gallery' }) },
  { id: 'yard', poly: G.YARD, top: 3.6, y0: 0.45, w: 1.4, mk: () => tuff({ tag: 'yard', color: '#b4aea3' }) },
  { id: 'rimHead', poly: G.RIM_HEAD, top: 4.2, y0: 0.45, w: 1.2, mk: () => rock({ tag: 'rim-head', color: K.scoria }) },
  { id: 'terrace', poly: G.TERRACE, top: 2.4, y0: 0.45, mk: () => tuff({ tag: 'terrace', color: K.tuffDk }) },
  { id: 'lakefront', poly: G.LAKEFRONT, top: 1.2, y0: 0, mk: () => tuff({ tag: 'lakefront' }) },
  { id: 'moorings', poly: G.MOORINGS, top: 1.8, y0: 1.2, w: 0.8, mk: () => iron({ tag: 'moorings', color: '#8c8a84' }) },
  { id: 'ledgeE', poly: G.LEDGE_E, top: 0, y0: -0.7, drown: true, mk: () => glaze({ tag: 'casting-floor' }) },
  { id: 'shelf', poly: G.SHELF, top: 0, y0: -0.7, drown: true, mk: () => glaze({ tag: 'slump-shelf' }) },
  { id: 'northHead', poly: G.NORTH_HEAD, top: 1.2, y0: 0, mk: () => rock({ tag: 'north-head' }) },
  { id: 'hornStep', poly: G.HORN_STEP, top: 1.2, y0: 0, mk: () => rock({ tag: 'horn-step', color: K.scoria }) },
  { id: 'ladleHorn', poly: G.LADLE_HORN, top: 2.4, y0: 0.45, mk: () => rock({ tag: 'ladle-road', color: K.scoria }) },
  { id: 'ridge', poly: G.RIDGE, top: 3.6, y0: 0.45, mk: () => rock({ tag: 'rim-ridge' }) },
];
// rectangular floors and solid volumes the edge test must see (Alpha's half): x0, x1, z0, z1, top
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const BOXES = [
  { id: 'causeway', poly: rectP(-4, 4, G.CAUSE_Z, -11.5), top: 1.2 },
  { id: 'pour', poly: rectP(-5, 5, -5, 5), top: 1.8, single: true },
  { id: 'pit', poly: rectP(G.PIT.x0, G.PIT.x1, G.PIT.z0, G.PIT.z1), top: 3.0 },
];

// ------------------------------------------------------------------------------------------------ the edges
// caldera walls (basalt, roof, ≥ 1 m thick, ≥ 3 m over the floor they bound), laid outside the outer edge of play; the
// Casting Hall (whitewashed, 12 m) along the gallery's and side yards' backs
const ALL0 = [];
for (const f of [...FLOORS, ...BOXES]) { ALL0.push(f); if (!f.single) ALL0.push({ ...f, poly: rotPoly(f.poly), twin: f }); }
const floorAt = (x, z) => ALL0.some((f) => !f.wall && inPoly(f.poly, x, z));
const EDGE_WALLS = G.EDGES.map((e) => ({ e, w: walls(e.pts, { t: e.t, top: e.top, y0: e.y0, ext0: e.ext0, ext1: e.ext1, mk: e.cliff ? calWall : calWallHidden }, floorAt) }));
const hallMk = () => white({ tag: 'casting-hall', hidden: true, paint: false });   // (props.js draws the hall)
const HALL_W = [walls(G.HALL_LINE, { t: 4.0, top: 12.0, y0: 0, ext0: 0.3, ext1: 0.3, mk: hallMk }, floorAt)];
const WALL_FEET = [...EDGE_WALLS.flatMap((x) => x.w.feet), ...HALL_W.flatMap((w) => w.feet)];
const ALL = [...ALL0];
for (const p of WALL_FEET) { ALL.push({ poly: p, wall: true, top: 9 }); ALL.push({ poly: rotPoly(p), wall: true, top: 9 }); }

// ------------------------------------------------------------------------------------------------ fill the floors
const onNotch = (a, b) => [a, b].every((p) => G.NOTCH_EDGES.some((q) => Math.abs(q[0] - p[0]) < 0.02 && Math.abs(q[1] - p[1]) < 0.02));
const GROUNDS = {};
for (const f of FLOORS) {
  const self = ALL.find((g) => g === f) || f;
  const kinds = edgeKinds(self, ALL, (a, b) => (onNotch(a, b)
    ? { kind: 'ledge', w: 0.6, mk: () => ({ color: '#4a4d52', pattern: PATTERN.metalpanel, tag: 'socket-collar' }) }   // iron-bound socket collars
    : { kind: 'ledge', w: f.w || 1.0 }));
  GROUNDS[f.id] = fill(f.poly, { y0: f.y0, top: f.top, mk: f.mk, ledgeMk: () => coping({ color: f.drown ? '#4f4a47' : K.basaltDk }), edge: kinds });
}
// a lower floor's tucked columns are cut round the higher floors' columns they meet (both halves)
for (const f of FLOORS) {
  const blockers = [];
  for (const g of FLOORS) {
    if (g === f || g.top <= f.top + 0.05) continue;
    blockers.push(...GROUNDS[g.id].cols);
    if (!g.single) blockers.push(...GROUNDS[g.id].cols.map(rotBox));
  }
  GROUNDS[f.id].cols = cutColumns(GROUNDS[f.id].cols, blockers);
}
const groundOf = (id) => (GROUNDS[id] ? [...GROUNDS[id].cols, ...GROUNDS[id].ledges] : []);

// ============================================================================================================ pieces
const HALF = [];
const SINGLE = [];
const add = (...p) => HALF.push(...p.flat());
const RAILS = [];   // [x0, z0, x1, z1, y, h]: every railing's line (props.js draws them; the colliders are below)
const railSeg = (a, b, y, h = 1.0, t = 0.25, o = {}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  RAILS.push([a[0], a[1], b[0], b[1], y, h]);
  return O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), G.r3(L - 0.06), t, y, y + h, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), { rail: true, color: K.green, tag: 'rail', ...o });
};

// ---------------------------------------------------------------------------------------- the floors themselves
for (const f of FLOORS) if (!f.single && !(f.drown && HIGH_BUILD)) add(groundOf(f.id));
SINGLE.push(...groundOf('island'));
// (a hidden deck slab inside the island: the environment's sea takes the stage's footprint from its deck slabs; at HIGH
// the drowned ledges are gone. Blockout only: the lava engine's `env.sea: false` (ENGINE H22) removes the sea)
SINGLE.push(B(-0.37, 0.41, -1.2, 0, -0.43, 0.39, { hidden: true, paint: false, tag: 'footprint' }));

// ---------------------------------------------------------------------------------------- mid: Gauge Island
// the Pour Floor (cast-iron plates, 1.8): the plinth under the Surge Gauge; the centre zone, the Pond, the tower's start
SINGLE.push(B(-5, 5, 1.2, 1.8, -5, 5, iron({ tag: 'pour-floor', color: '#7f8389' })));
// the causeway (8 m, the tower's track)
add(B(-4, 4, -1.1, 1.2, G.r3(G.CAUSE_Z), -11.5, tuff({ tag: 'causeway', color: '#aaa59c' })));
// the weighbridge pit (3.0): a sunken iron plate cut out of the yard's west lane
add(B(G.PIT.x0, G.PIT.x1, 0.45, 3.0, G.PIT.z0, G.PIT.z1, iron({ tag: 'weighbridge', color: '#73787d' })));
// the Organ Pipes and (at HIGH) both Pumice Races: static stand-ins at this build's level until the lava engine lands
if (BLOCKOUT_LAVA) {
  add(riderStandIns((what, o) => (what === 'stone' ? { color: K.pumice, pattern: PATTERN.rubber, ...o }
    : what === 'organ-stub' ? { color: K.basaltDk, pattern: PATTERN.asphalt, roof: true, ...o }
      : { color: '#53575e', pattern: PATTERN.asphalt, ...o })));
}
// the Spillway Bridge (deck 2.3: 0.1 under the banks it bears on, underside 1.95): square across the arm's throat at the
// mouth from Alpha's quay to Bravo's horn, 5.5 m wide, 9 m bank to bank
const armBox = (s, t, ls, lt, y0, y1, o) => O(...G.A(s, t), ls, lt, y0, y1, G.r3(-G.AU), o);
{ const [s0, s1] = G.BR_S, w = s1 - s0;
  add(armBox((s0 + s1) / 2, 0, w, 2 * G.AW + 1.0, 1.95, 2.3, iron({ tag: 'spillway-bridge', color: '#56685e' }))); }

// ---------------------------------------------------------------------------------------- the edges
add(EDGE_WALLS.flatMap((x) => x.w.blocks));
add(HALL_W.flatMap((w) => w.blocks));

export const GANTRY_RAILS = [];
export { RAILS };
// the drawn caldera walls (props.js caldera_walls): every hidden wall O-box of Alpha's half (the builder draws the turn)
export const WALL_BOXES = EDGE_WALLS.filter((x) => !x.e.cliff).flatMap((x) => x.w.blocks).map((b) => [b.center[0], b.center[1], b.center[2], b.size[0], b.size[1], b.size[2], b.rotY]);

// ============================================================================================================ modes
// Zone Control: the Pour Floor (centre, 94 m² net of the piers) and the Pumice Moorings (Alpha's side; Bravo's turned)
const ZONES = {
  center: [{ poly: [[-5, -5], [5, -5], [5, 5], [-5, 5]], y0: 1.7, y1: 2.0 }],
  side: { poly: G.MOORINGS.filter((p, i, A) => i === 0 || i === A.length - 1 || i % 2 === 0).map(([x, z]) => [G.r3(x), G.r3(z)]), y0: 1.7, y1: 2.0 },
};
// Tower Command: "the tower rides the ladle rail" (Alpha's attack, drawn on Bravo's half): down Bravo's causeway, a jog
// west along its Lakefront, up the terrace face, east along the terrace, up the yard face, north across the yard to the
// end-stop 14 m short of Bravo's pad. Straight runs, square corners, two climbs, nothing overhead.
const TWB = G.TW_X.map((v) => -v);   // the climbs' x on Bravo's half
const TOWER = {
  path: [[0, 1.8, 0], [0, 26.5], [TWB[0], 26.5], [TWB[0], 37], [TWB[1], 37], [TWB[1], 51]],
  checkpoints: [[0, 24], [3, 37]],
};
// Bazookarp (bazookarp/SPEC.md §4.1: Alpha's attack on Bravo's half; the engine mirrors it)
const GAL_B = G.GALLERY.map(([x, z]) => [-x, -z]);
const BAZOOKARP = {
  start: [0, 1.8, 0],                                  // the Pond on the Pour Floor, under the Surge Gauge
  weirs: [{ at: [0, 1.2, 24.5] }],                     // Bravo's Lakefront at its causeway's foot (posts at x ±2.7)
  gate: { at: [-1.5, 3.6, 53] },                       // Bravo's yard, in the centre lane, a level below the gallery
  freeZones: [{ poly: GAL_B, y0: 4.6, y1: 6.5,         // Bravo's gallery; a sign at each of its three stairs
    signs: [[-G.PADX, -(G.GAL.z1 - 0.4), 0], [-(G.GAL.x0 - 0.4), 63, 90], [-(G.GAL.x1 + 0.4), 59.6, -90]] }],
  routes: {
    causeway: [[0, 12], [0, 22], [0, 24.5], [2.9, 29], [5.4, 36], [5.4, 44.6], [-1.5, 53]],  // Lower + Upper Surge Steps
    castingFloor: [[-6, 14], [-6, 20.5], [0, 24.5]],                                    // LOW only
    gantry: [[-9.5, 10], [-9.5, 20.6], [0, 24.5]],                                      // the Ladle Gantry (bazookarp only)
    east: [[0, 24.5], [-8.9, 27.4], [-9, 41.5], [-1.5, 53]],                            // East Steps → Cupola Stair
  },
};

// ============================================================================================================ the layout
const LAYOUT_CALDERA = {
  id: 'caldera',
  bounds: { minX: -44, maxX: 44, minZ: -76, maxZ: 76 },
  spawnPads: [[G.PAD[0], 4.8, G.PAD[1]], [-G.PAD[0], 4.8, -G.PAD[1]]],
  spawnBarrier: 4.2,
  intro: { from: [40, 26, -40], lookFrom: [0, 8, 0], toBack: 3.2 },
  art: { from: [-44, 30, -56], look: [4, 2, 4], fov: 56, lava: 'high' },
  env: { backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false, sea: false,
    theme: { all: { seaDeep: '#1c1918', seaShallow: '#2b2523', seaCrest: '#3a312d', foam: '#4a403a', waveStrength: 0.15, sunSpec: 0.25 } } },
  lava: LAVA,
  zones: ZONES,
  tower: TOWER,
  bazookarp: BAZOOKARP,
  boss: { floorY: 1.2 },
  single: SINGLE,
  half: HALF,
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = LAYOUT_CALDERA;
export { FLOORS, GROUNDS, HIGH_BUILD };
void R; void OCT; void P;
