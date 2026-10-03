// Highmark Foundry — stage layout (src/world/stages/caldera/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, environment (this file)
//   geo.js       the plan as data (DESIGN.md §2.3's helpers and every outline)    ground.js  the curved-floor kit
//   lava.js      the lava's data (ENGINE.md format) and the blockout's stand-ins   props.js   prop pack + placements
//   surfaces.js  stage surface materials     murals.js  stage decals / signage     backdrop.js  the far scenery
//
// BLOCKOUT (DESIGN.md §6.1 step 1, revision 2): every floor, tier, stair, ramp, wall, bridge and cover piece of the
// design's piece table at its real size and height, with its collider flags; the big structures as volumes with their
// real silhouettes (props.js); every mode's data. No art pass yet (surfaces, murals, backdrop, lamps, intro, bake).
//
// Highmark Foundry stands inside Bellows Caldera: a foundry round a breathing lava lake. A tomoe of two crescents: each
// works (Alpha's South Works, Bravo's North Works) owns its base — a theatre of curved tiers (gallery 4.8 → yard 3.6 →
// terrace 2.4 → Lakefront 1.2) facing Gauge Island — and one rim sweeping round the lake to a horn tip in the other
// half. Alpha's rim runs up the west side, bitten by the Slump (a cliff-foot shelf at LOW, the Pumice Race at HIGH);
// across the lake Bravo's horn reaches down the east side to Alpha's Spillway, a diagonal lava channel cut through the
// rim. Mid is Gauge Island under the 22 m Surge Gauge, with the Organ Pipes rising out of its notches as lookouts.
import { PATTERN, B, R, O, OCT, ARC } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import * as G from './geo.js';
import { fill, edgeKinds, walls, cutColumns, rotBox, splitColumns } from './ground.js';
import { LAVA, LAVA_VIEW, BLOCKOUT_LAVA, riderStandIns } from './lava.js';

const { P, ch, arc, rotPoly, inPoly, HW, S_LIP } = G;
const HIGH_BUILD = BLOCKOUT_LAVA && LAVA_VIEW === 'high';

// ------------------------------------------------------------------------------------------------------------ palette
// the works: pale tuff paving, whitewash, works green iron, buff firebrick; the caldera: basalt, red scoria, glaze
const K = {
  tuff: '#aaa49a', tuffDk: '#97928a', basalt: '#646870', basaltDk: '#4f535a', scoria: '#5d5450', glaze: '#5f5955',
  pave: '#85878b', wall: '#45484e', iron: '#7c8186', ironDk: '#5d6268', white: '#e9e4d8', green: '#2f5a48', brick: '#c9b08a',
  spawn: '#ece7dc', pumice: '#bdb8ae', wood: '#9a7b58', cast: '#6d7176', sand: '#b9a68a', rope: '#a78f6c',
};
const tuff = (o = {}) => ({ color: K.tuff, pattern: PATTERN.pavers, ...o });
const rock = (o = {}) => ({ color: K.basalt, pattern: PATTERN.concrete, ...o });
const glaze = (o = {}) => ({ color: K.glaze, pattern: PATTERN.plain, ...o });
const coping = (o = {}) => ({ color: K.basaltDk, pattern: PATTERN.concrete, tag: 'coping', ...o });
const steps = (o = {}) => ({ color: K.basalt, pattern: PATTERN.stonestep, ...o });
const iron = (o = {}) => ({ color: K.iron, pattern: PATTERN.metalpanel, ...o });
const cover = (c = K.cast, o = {}) => ({ color: c, pattern: PATTERN.plain, roof: true, ...o });
const white = (o = {}) => ({ color: K.white, pattern: PATTERN.render, roof: true, ...o });
const calWall = () => ({ color: K.wall, pattern: PATTERN.concrete, roof: true, tag: 'caldera-wall' });

// ============================================================================================================ floors
// the curved floors (geo.js outlines), filled by ground.js. Alpha's half unless `single`.
const RH_REGION = [P(39, -126), ...G.RIMHEAD_OUT, [-27.5, -40]];   // the Rim Head inside the yard's polygon (natural rock)
const FLOORS = [
  { id: 'island', poly: G.ISLAND, top: 1.2, y0: -1.1, single: true, mk: () => rock({ tag: 'island', color: K.pave, pattern: PATTERN.tiles }) },
  { id: 'yard', poly: G.YARD, top: 3.6, y0: 0, mk: () => tuff({ tag: 'yard', color: '#b4aea3' }) },
  { id: 'terrace', poly: G.TERRACE, top: 2.4, y0: 0, mk: () => tuff({ tag: 'terrace', color: K.tuffDk }) },
  { id: 'lakefront', poly: G.LAKEFRONT, top: 1.2, y0: -1.1, mk: () => tuff({ tag: 'lakefront' }) },
  { id: 'moorings', poly: G.MOORINGS, top: 1.8, y0: 1.2, w: 0.8, mk: () => iron({ tag: 'moorings', color: '#8c8a84' }) },
  { id: 'ledgeE', poly: G.LEDGE_E, top: 0, y0: -1.1, drown: true, mk: () => glaze({ tag: 'casting-floor' }) },
  { id: 'shelf', poly: G.SHELF, top: 0, y0: -1.1, drown: true, mk: () => glaze({ tag: 'slump-shelf' }) },
  { id: 'northHead', poly: G.NORTH_HEAD, top: 1.2, y0: -1.1, mk: () => rock({ tag: 'north-head' }) },
  { id: 'hornLadle', poly: G.HORN_LADLE, top: 2.4, y0: -1.1, mk: () => rock({ tag: 'ladle-road', color: K.scoria }) },
  { id: 'hornStep', poly: G.HORN_STEP, top: 1.2, y0: -1.1, mk: () => rock({ tag: 'horn-step' }) },
  { id: 'ridge', poly: G.RIDGE, top: 3.6, y0: 0, mk: () => rock({ tag: 'rim-ridge' }) },
  { id: 'castingBed', poly: G.CASTING_BED, top: 3.0, y0: 2.4, w: 0.8, mk: () => ({ color: K.sand, pattern: PATTERN.plain, tag: 'casting-bed' }) },
];
// rectangular floors and solid volumes the edge test must see (Alpha's half): x0, x1, z0, z1, top
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const BOXES = [
  { id: 'causeway', poly: rectP(-4, 4, -22.65, -11.5), top: 1.2 },
  { id: 'pour', poly: rectP(-5, 5, -5, 5), top: 1.8, single: true },
  { id: 'gallery', poly: rectP(-10, 10, -69, -57.5), top: 4.8 },
  { id: 'pit', poly: rectP(G.PIT.x0, G.PIT.x1, G.PIT.z0, G.PIT.z1), top: 3.0 },
  { id: 'hall', poly: rectP(-16, 16, -74, -69), top: 12, wall: true },
];

// ------------------------------------------------------------------------------------------------ the edges (E1–E8)
// caldera walls (basalt, roof, ≥ 1 m thick, ≥ 3 m over the floor they bound), laid outside the outer edge of play
const ALL0 = [];
for (const f of [...FLOORS, ...BOXES]) { ALL0.push(f); if (!f.single) ALL0.push({ ...f, poly: rotPoly(f.poly), twin: f }); }
const floorAt = (x, z) => ALL0.some((f) => !f.wall && inPoly(f.poly, x, z));
const EDGE_WALLS = G.EDGES.map((e) => ({ e, w: walls(e.pts, { t: e.t, top: e.top, y0: e.y0, mk: calWall }, floorAt) }));
// the corner over the Slump between the Rim Head's parapet and the cliff (out of play; closes the notch behind them)
const SLUMP_CORNER = walls([P(36, -148.5), [-27.56, -18.17]], { t: 2.5, top: 7.45, y0: 0, ext0: 0, ext1: 0, mk: calWall }, (x, z) => inPoly(G.YARD, x, z));
// E7: the charging shed (lean-to and coke bunkers) closes the corner between the Spillway Quay and the yard
const SHED = walls(G.SHED_LINE, { t: 2.5, top: 7.5, y0: 0, mk: () => white({ tag: 'charging-shed', color: '#d9d2c2' }) }, floorAt);
const WALL_FEET = [...EDGE_WALLS.flatMap((x) => x.w.feet), ...SHED.feet, ...SLUMP_CORNER.feet];
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
  if (f.single) for (const g of FLOORS) if (!g.single && g.top <= f.top + 0.05 && g !== f) { /* (none: the island is the only single floor) */ }
  GROUNDS[f.id].cols = cutColumns(GROUNDS[f.id].cols, blockers);
}
// the Rim Head is natural rock inside the yard's polygon
GROUNDS.yard.cols = splitColumns(GROUNDS.yard.cols, (x, z) => inPoly(RH_REGION, x, z), () => rock({ tag: 'rim-head', color: K.scoria }));
const groundOf = (id) => (GROUNDS[id] ? [...GROUNDS[id].cols, ...GROUNDS[id].ledges] : []);

// ============================================================================================================ pieces
const HALF = [];
const SINGLE = [];
const add = (...p) => HALF.push(...p.flat());

// ---------------------------------------------------------------------------------------- the floors themselves
for (const f of FLOORS) if (!f.single && !(f.drown && HIGH_BUILD)) add(groundOf(f.id));
SINGLE.push(...groundOf('island'));

// ---------------------------------------------------------------------------------------- mid: Gauge Island
// the Pour Floor (cast-iron plates, 1.8): the centre zone, the Pond, the tower's start
SINGLE.push(B(-5, 5, 1.2, 1.8, -5, 5, iron({ tag: 'pour-floor', color: '#7f8389' })));
// the Surge Gauge: four basalt piers to 7 m (off the diagonals: the Pond is seen from all 8 directions), two tie girders
// at 6.0–6.9 m (they cut the spawn-to-spawn sightline; 4.1 m over the Pour Floor), the upper works solid to 22 m
// (colliders; the lattice, boards, clock house, bell cage and pyramid are props.js caldera_surge_gauge)
for (const [px, pz] of [[4.2, 1.75], [4.2, -1.75], [-4.2, 1.75], [-4.2, -1.75]]) SINGLE.push(B(px - 0.6, px + 0.6, 1.8, 7.0, pz - 0.6, pz + 0.6, rock({ tag: 'gauge-pier', roof: true, color: K.basaltDk })));
for (const s of [-1, 1]) SINGLE.push(B(-4.75, 4.75, 6.0, 6.9, s * 1.75 - 0.2, s * 1.75 + 0.2, { color: K.green, pattern: PATTERN.metal, roof: true, tag: 'tie-girder' }));
const GAUGE_HIDDEN = (o) => ({ hidden: true, roof: true, paint: false, color: '#888888', tag: 'gauge-works', ...o });
SINGLE.push(
  B(-4.8, 4.8, 7.0, 12.0, -2.35, 2.35, GAUGE_HIDDEN()), B(-1.8, 1.8, 12.0, 17.0, -1.8, 1.8, GAUGE_HIDDEN()),
  B(-1.5, 1.5, 17.0, 18.5, -1.5, 1.5, GAUGE_HIDDEN()), B(-1.5, 1.5, 18.5, 20.5, -1.5, 1.5, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 20.5, 22.0, -1.2, 1.2, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 8.0, 15.0, -2.65, -2.35, GAUGE_HIDDEN({ tag: 'gauge-board' })), B(-1.2, 1.2, 8.0, 15.0, 2.35, 2.65, GAUGE_HIDDEN({ tag: 'gauge-board' })),
);
// the causeway (8 m, the tower's track) with its four lamp plinths
add(B(-4, 4, -1.1, 1.2, -22.65, -11.5, tuff({ tag: 'causeway', color: '#aaa59c' })));
for (const [x, z] of [[3.4, -14.5], [-3.4, -14.5], [3.4, -19.5], [-3.4, -19.5]]) add(B(x - 0.45, x + 0.45, 1.2, 2.5, z - 0.45, z + 0.45, cover(K.basaltDk, { tag: 'lamp-plinth' })));
// island cover: ingot stacks at the causeway landing, the stilling-well drum, a ladle stand
add(B(2.2, 3.4, 1.2, 2.2, -9.6, -8.4, cover(K.cast, { tag: 'ingot-stack' })), B(-3.4, -2.2, 1.2, 2.2, -9.6, -8.4, cover(K.cast, { tag: 'ingot-stack' })));
add(OCT(7.5, -6.4, 1.05, 1.2, 2.8, cover('#6a6e66', { tag: 'stilling-drum' })));
add(B(10.4, 12.0, 1.2, 3.2, -0.2, 1.4, cover(K.ironDk, { tag: 'ladle-stand' })));
// the column pavement round the Organ cluster: static basalt stumps (cover and steps)
add(OCT(-6.5, -8.8, 0.9, 1.2, 2.1, rock({ tag: 'organ-stump', color: K.basaltDk })));
add(OCT(-12.4, -2.8, 0.9, 1.2, 2.4, rock({ tag: 'organ-stump', color: K.basaltDk })));
add(OCT(-7.0, -3.4, 0.8, 1.2, 1.8, rock({ tag: 'organ-stump', color: K.basaltDk })));
// the Organ Pipes and (at HIGH) the Pumice Race: static stand-ins at this build's level until the lava engine lands
if (BLOCKOUT_LAVA) {
  add(riderStandIns((what, o) => (what === 'stone' ? { color: K.pumice, pattern: PATTERN.plain, ...o }
    : what === 'organ-stub' ? { color: K.basaltDk, pattern: PATTERN.plain, roof: true, ...o }
      : { color: '#53575e', pattern: PATTERN.concrete, ...o })));
}

// ---------------------------------------------------------------------------------------- Alpha's base: the gallery
// the spawn gallery (4.8): the Casting Hall's gable balcony, open to the sky. Pad (0, 4.8, −64.5).
add(B(-10, 10, 0, 4.8, -69, -57.5, { color: K.spawn, pattern: PATTERN.spawn, tag: 'gallery' }));
// the Casting Hall (12, out of play) and its wings (8): whitewashed basalt; the sawtooth roof and round window are props
add(B(-16, 16, 0, 12, -74, -69, white({ tag: 'casting-hall' })));
add(B(-16, -10, 0, 8, -69, -66, white({ tag: 'hall-wing' })), B(10, 16, 0, 8.15, -69, -66, white({ tag: 'hall-wing' })));
// three exits: the Gallery Stair (forward) and two side stairs onto the side yards
add(R([0, 3.6, -54.8], [0, 4.8, -57.5], 8, steps({ tag: 'gallery-stair' })));
add(R([12.7, 3.6, -63], [10, 4.8, -63], 3, steps({ tag: 'gallery-side-stair' })), R([-12.7, 3.6, -63], [-10, 4.8, -63], 3, steps({ tag: 'gallery-side-stair' })));
// balustrades: the gallery is entered only by its three stairs
const RAILS = [];   // [x0, z0, x1, z1, y, h]: every railing's line (props.js draws them; the colliders are below)
const railSeg = (a, b, y, h = 1.0, t = 0.25, o = {}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  RAILS.push([a[0], a[1], b[0], b[1], y, h]);
  return O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), G.r3(L - 0.06), t, y, y + h, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), { rail: true, color: K.green, tag: 'rail', ...o });
};
add(railSeg([4, -57.4], [10, -57.4], 4.8), railSeg([-10, -57.4], [-4, -57.4], 4.8));
for (const s of [-1, 1]) add(railSeg([s * 9.9, -68.9], [s * 9.9, -64.5], 4.8), railSeg([s * 9.9, -61.5], [s * 9.9, -57.6], 4.8));
// gallery urns (cover outside the barrier)
for (const [x, z] of [[8.4, -59.4], [-8.4, -59.4], [8.4, -67.4], [-8.4, -67.4]]) add(B(x - 0.6, x + 0.6, 4.8, 5.9, z - 0.6, z + 0.6, cover('#8a7f72', { tag: 'urn' })));

// ---------------------------------------------------------------------------------------- the Yard (3.6)
// the weighbridge pit: a sunken iron plate (3.0) with a ramp off each end (14°); its long sides are 0.6 m steps
add(B(G.PIT.x0, G.PIT.x1, 0, 3.0, G.PIT.z0, G.PIT.z1, iron({ tag: 'weighbridge', color: '#73787d' })));
add(R([-12, 3.0, -50], [G.PIT.x0, 3.6, -50], 4, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard })), R([-5, 3.0, -50], [G.PIT.x1, 3.6, -50], 4, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard })));
// buildings and big pieces (roof)
add(B(-23, -16, 3.6, 9.5, -53.5, -47.5, white({ tag: 'surge-office' })));
add(OCT(14.0, -46.5, 2.38, 3.6, 9.4, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'cupola' }));
add(OCT(14.0, -46.5, 1.0, 9.4, 15.0, { color: '#4b4f55', pattern: PATTERN.metal, roof: true, tag: 'cupola-stack' }));
add(B(10.5, 14.5, 3.6, 6.8, -59.5, -56, white({ tag: 'weigh-office' })));
add(B(15.4, 16.6, 3.6, 12, -57.1, -55.9, { color: K.green, pattern: PATTERN.metal, roof: true, tag: 'jib-mast' }));
// casting stacks: cover every 5–8 m, clear of the tower lane and the Gate
const stack = (x, z, w, d, h, base, tag, c = K.cast) => B(x - w / 2, x + w / 2, base, base + h, z - d / 2, z + d / 2, cover(c, { tag }));
add(
  stack(5.6, -56.2, 1.6, 1.6, 1.3, 3.6, 'covers-stack'), stack(2.0, -50.6, 1.6, 1.6, 1.3, 3.6, 'manhole-covers'),
  stack(-7.5, -56.6, 5.0, 1.2, 1.2, 3.6, 'lamp-post-rack', '#5f6a63'), stack(-16, -44.5, 1.6, 2.4, 1.0, 3.6, 'bench-ends', K.wood),
  stack(-18.5, -41.5, 1.6, 1.6, 1.0, 3.6, 'pig-iron', '#5b5550'), stack(-1.0, -47.0, 1.6, 1.6, 1.1, 3.6, 'ingot-stack'),
  stack(-24.0, -44.5, 1.4, 1.4, 1.2, 3.6, 'drum-stack', '#56606a'), stack(-25.5, -37.0, 1.6, 1.2, 1.2, 3.6, 'drum-stack', '#56606a'),
  stack(4.0, -39.9, 2.0, 1.0, 1.0, 3.6, 'mould-boxes', K.wood), stack(13.5, -53.5, 1.6, 1.6, 1.2, 3.6, 'cable-drum', K.wood),
  stack(-8.5, -54.0, 2.0, 1.2, 1.1, 3.6, 'weighbridge-load'), stack(-8.5, -46.3, 2.4, 1.4, 2.4, 3.6, 'weigh-beam-hut', K.white),
  stack(-1.5, -40.1, 2.0, 1.0, 1.0, 3.6, 'ingot-rack'), stack(-21.5, -46.0, 1.6, 1.6, 0.9, 3.6, 'bollard-pallet', '#4f555c'),
  stack(-12.5, -59.0, 1.6, 1.6, 1.1, 3.6, 'drain-grates'), stack(10.5, -40.4, 2.2, 1.2, 1.0, 3.6, 'rails-stack', '#5b5f63'),
  stack(-21.5, -36.5, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk),
);
// the yard front railing on the r 39 arc: gaps at the Cupola Stair, the Upper Surge Steps + its hop face, the tower climb;
// the bastion (θ −116 … −123) has solid parapets instead
for (const [a0, a1] of [[-63, -67.8], [-72.2, -90], [-101, -105], [-112.2, -116], [-123, -126]]) {
  const pts = arc(39.125, a0, a1, 2.5);
  for (let i = 0; i < pts.length - 1; i++) add(railSeg(pts[i], pts[i + 1], 3.6));
}
// the bastion's parapets (basalt, 0.9) on its free sides: the Surge Office's balcony out over the terrace
add(ARC(0, 0, 35.7, 0.4, 3.6, 4.5, -123, -116, 3, { color: K.basaltDk, pattern: PATTERN.concrete, roof: true, tag: 'bastion-parapet' }));
for (const a of [-116, -123]) { const p0 = P(35.92, a), p1 = P(39, a); add(O(G.r3((p0[0] + p1[0]) / 2), G.r3((p0[1] + p1[1]) / 2), 0.4, 3.08, 3.6, 4.5, -a - 90, { color: K.basaltDk, pattern: PATTERN.concrete, roof: true, tag: 'bastion-parapet' })); }

// ---------------------------------------------------------------------------------------- Rim Head ground (3.6)
// lava-rock mounds you climb (≤ 24°) and outcrops / cairns you hide behind (roof)
function cone(cx, cz, rTop, yTop, rBase, yBase, tag) {
  const out = [...OCT(cx, cz, rTop, yBase, yTop, rock({ tag, color: K.scoria }))];
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 + 22.5) * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), w = 2 * rTop * Math.tan(Math.PI / 8) + 0.3;
    out.push(R([cx + ux * rBase, yBase, cz + uz * rBase], [cx + ux * rTop * 0.92, yTop - 0.02, cz + uz * rTop * 0.92], w, rock({ tag: tag + '-facet', color: K.scoria })));
  }
  return out;
}
add(cone(-29.5, -33.0, 1.2, 4.5, 3.25, 3.6, 'spatter-cone'));
add(cone(-28.5, -24.5, 0.8, 4.2, 2.2, 3.6, 'hummock'));
add(stack(-33.0, -38.0, 2.4, 1.6, 1.4, 3.6, 'outcrop', K.basaltDk), stack(-29.8, -40.8, 1.6, 1.4, 1.3, 3.6, 'outcrop', K.basaltDk),
  stack(-24.5, -29.0, 1.6, 1.4, 1.3, 3.6, 'outcrop', K.basaltDk), stack(-26.0, -27.0, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk),
  stack(-32.2, -27.5, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk));
// the Rim Head parapet over the Slump cliff (a vantage, not a drop route)
{ const a = P(G.SH_OUT, G.SA0), b = P(36, -148.5), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  add(O(G.r3((a[0] + b[0]) / 2 - uz * 0.2), G.r3((a[1] + b[1]) / 2 + ux * 0.2), G.r3(L), 0.4, 3.6, 4.5, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), { color: K.basaltDk, pattern: PATTERN.concrete, roof: true, tag: 'rim-head-parapet' })); }
add(SLUMP_CORNER.blocks);

// ---------------------------------------------------------------------------------------- the Moulding Terrace (2.4)
// stairs: yard ↔ terrace (on the terrace, top edge on r 39) and terrace ↔ Lakefront (on the Lakefront, top on r 30)
add(R([-5.05, 2.4, -35.95], [-5.43, 3.6, -38.62], 4, steps({ tag: 'upper-surge-steps' })));
add(R([12.41, 2.4, -34.11], [13.34, 3.6, -36.65], 3, steps({ tag: 'cupola-stair' })));
add(R([-17.10, 2.4, -28.46], [-19.51, 3.6, -26.86], 3, steps({ tag: 'office-stair' })));
add(R([-3.33, 1.2, -27.10], [-3.66, 2.4, -29.78], 8, steps({ tag: 'lower-surge-steps' })));
add(R([7.53, 1.2, -26.24], [8.27, 2.4, -28.84], 3, steps({ tag: 'east-steps' })));
// the terrace parapet (solid basalt with a whitewashed coping, 0.9: cover), θ −58.6 … −71 and −77 … −79.5
add(ARC(0, 0, 30.25, 0.5, 2.4, 3.3, -71, -58.6, 5, { color: '#7a7d82', pattern: PATTERN.concrete, roof: true, tag: 'terrace-parapet' }));
add(ARC(0, 0, 30.25, 0.5, 2.4, 3.3, -79.5, -77, 1, { color: '#7a7d82', pattern: PATTERN.concrete, roof: true, tag: 'terrace-parapet' }));
// the Firebrick Store (buff brick, turned to face the lake) and the terrace cover
{ const [x, z] = P(35, -63.5); add(O(x, z, 4, 5, 2.4, 7.0, -26.5, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'firebrick-store' })); }
add(stack(-10.0, -37.0, 2.4, 1.0, 1.2, 2.4, 'pattern-crates', K.wood), stack(11.5, -31.5, 1.0, 2.4, 1.2, 2.4, 'pattern-crates', K.wood),
  stack(9.5, -37.2, 1.2, 1.2, 1.0, 2.4, 'firebrick-pallet', K.brick), stack(-14.0, -31.4, 1.6, 1.6, 1.0, 2.4, 'ingot-pile'),
  stack(-7.5, -31.4, 1.6, 0.9, 1.1, 2.4, 'flask-stack', '#6b5f55'), stack(-2.0, -31.3, 1.6, 0.9, 1.1, 2.4, 'flask-stack', '#6b5f55'),
  stack(-1.0, -36.8, 2.0, 0.8, 1.0, 2.4, 'mould-boxes', K.wood));
// the charging shed (E7)
add(SHED.blocks);

// ---------------------------------------------------------------------------------------- the Lakefront (1.2) and Moorings (1.8)
add(stack(11.5, -24.6, 3.0, 1.6, 2.0, 1.2, 'ladle-car', '#4f5a52'), stack(-5.6, -24.2, 1.2, 1.0, 1.1, 1.2, 'chain-bin'),
  stack(7.0, -23.8, 2.4, 0.6, 2.2, 1.2, 'tide-board', '#e6dfcd'));
add(stack(-14.6, -22.0, 1.4, 1.2, 1.3, 1.8, 'capstan', '#4f5a52'), stack(-11.4, -24.4, 1.0, 1.0, 1.0, 1.8, 'chain-bollard', K.ironDk),
  stack(-17.4, -21.6, 1.2, 1.2, 1.0, 1.8, 'stone-crate', K.pumice));
// the winch house on the south head: drives the Race's chains
add(O(-21.2, -19.6, 3, 3, 1.2, 4.0, 140, white({ tag: 'winch-house' })));

// ---------------------------------------------------------------------------------------- the ledges (0) east of the causeway
if (!HIGH_BUILD || true) {   // (the props on the ledges stand in the lava at HIGH: they stay)
  add(stack(8.4, -17.4, 1.6, 1.6, 1.8, 0, 'mould-stack', K.ironDk), stack(13.4, -15.0, 1.6, 1.6, 2.0, 0, 'ladle-stand', K.ironDk));
  // hornitos on the Spillway floor (spatter chimneys) and the Spillway Bridge's pier
  for (const [s, t] of [[31.5, 2], [24.6, -2.6]]) { const [x, z] = ch(s, t); add(O(x, z, 1.6, 1.6, 0, 2.2, 48, cover(K.scoria, { tag: 'hornito' }))); }
  { const [x, z] = ch(28.5, 0); add(O(x, z, 0.8, 2.4, 0, 2.0, 48, cover(K.basaltDk, { tag: 'bridge-pier' }))); }
}
// the Spillway Bridge (2.4, underside 2.0): Alpha's quay → Bravo's horn tip; works-green girders (rail) both sides
{ const [x, z] = ch(28.5, 0); add(O(x, z, 3.0, 11.0, 2.0, 2.4, 48, iron({ tag: 'spillway-bridge', color: '#56685e' }))); }
for (const s of [27.0 - 0.125, 30.0 + 0.125]) add(railSeg(ch(s, -HW), ch(s, HW), 2.4));
// the lip fence: a chain fence across the lip (beyond it the lavafall chute)
add(railSeg(ch(S_LIP - 0.1, -HW), ch(S_LIP - 0.1, HW), 0, 1.0));

// ---------------------------------------------------------------------------------------- Alpha's west rim
// the Slump shelf's hornitos against the cliff (a 2.7 m path on their lake side)
for (const a of [-152, -168]) { const [x, z] = P(30.4, a); add(O(x, z, 1.4, 1.4, 0, 2.0, -a, cover(K.scoria, { tag: 'hornito' }))); }
// the Ladle Road's vent hood, the ladle cradle, the horn tip's cairn; the Rim Ridge's outcrop and spatter cone
{ const [x, z] = P(24, 177); add(stack(x, z, 1.4, 1.4, 1.4, 2.4, 'vent-hood', K.ironDk)); }
{ const [x, z] = P(22, 155.8); add(O(x, z, 1.6, 1.4, 2.4, 3.6, -155.8, cover(K.ironDk, { tag: 'ladle-cradle' }))); }
add(stack(-24.6, 16.2, 1.2, 1.2, 1.2, 2.4, 'cairn', K.basaltDk));
{ const [x, z] = P(28, 175.5); add(O(x, z, 2.0, 1.4, 3.6, 4.9, -175.5, cover(K.basaltDk, { tag: 'outcrop' }))); }
{ const [x, z] = P(28.25, 166.5); add(cone(x, z, 0.6, 4.2, 1.95, 3.6, 'ridge-cone')); }
// scree ramps: loose scree from the Ladle Road up onto the Ridge (21.8°)
for (const a of [163.5, 171]) { const lo = P(23, a), hi = P(26, a); add(R([lo[0], 2.4, lo[1]], [hi[0], 3.6, hi[1]], 3, rock({ tag: 'scree', color: '#6f6460' }))); }
// Gauge Post W: a squat whitewashed blockhouse whose flat roof is a 1.2 m hop (a lookout over Bravo's Spillway)
{ const [x, z] = P(26.2, 152), a = 152 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  add(O(x, z, 3.6, 3.6, 2.4, 3.6, -152, { color: K.white, pattern: PATTERN.render, tag: 'gauge-post' }));
  // the parapet on its two outer sides (the faces toward +local x: outward from the lake, and +local z)
  add(O(G.r3(x + c * 1.6), G.r3(z + s * 1.6), 0.4, 3.6, 3.6, 4.5, -152, cover(K.white, { tag: 'gauge-post-parapet' })));
  add(O(G.r3(x - s * 1.6 - c * 0.2), G.r3(z + c * 1.6 - s * 0.2), 3.2, 0.4, 3.6, 4.5, -152, cover(K.white, { tag: 'gauge-post-parapet' }))); }
// the West Bridge: Alpha's rim (Ladle Road, 2.4) → the island's W face (1.2), 4 wide, railed both sides (9.4°)
add(R([-13.5, 1.2, 5.0], [-20.75, 2.38, 5.0], 4, { thin: true, thickness: 0.5, color: '#56685e', pattern: PATTERN.gangdeck, tag: 'west-bridge' }));
for (const z of [2.875, 7.125]) {
  RAILS.push([-13.5, z, -20.75, z, 1.2, 1.0, 2.38]);
  add(R([-13.5, 2.2, z], [-20.75, 3.38, z], 0.25, { thin: true, thickness: 1.0, rail: true, color: K.green, tag: 'rail' }));
}

// ---------------------------------------------------------------------------------------- the edges
add(EDGE_WALLS.flatMap((x) => x.w.blocks));

// ---------------------------------------------------------------------------------------- Bazookarp only
// the Ladle Gantry: the second route to the weir at HIGH (Lakefront east → the island's SE shoulder over the Casting
// Floor). 1.1 (0.1 under the Lakefront and the island it rests on: no coplanar overlap); chain rails on both sides
add(B(8, 11, -1.1, 1.1, -21.5, -9.4, iron({ tag: 'ladle-gantry', color: '#56685e', onlyIn: 'bazookarp' })));
add({ ...railSeg([7.875, -20.4], [7.875, -10.5], 1.1), onlyIn: 'bazookarp' }, { ...railSeg([11.125, -20.4], [11.125, -10.5], 1.1), onlyIn: 'bazookarp' });
RAILS.length -= 2;   // (the gantry's chain rails are drawn only in its own world: props.js reads GANTRY_RAILS)
export const GANTRY_RAILS = [[7.875, -20.4, 7.875, -10.5, 1.1, 1.0], [11.125, -20.4, 11.125, -10.5, 1.1, 1.0]];
export { RAILS };

// ============================================================================================================ modes
// Zone Control: the Pour Floor (centre, 94 m² net of the piers) and the Pumice Moorings (Alpha's side; Bravo's turned)
const ZONES = {
  center: [{ poly: [[-5, -5], [5, -5], [5, 5], [-5, 5]], y0: 1.7, y1: 2.0 }],
  side: { poly: [[-6.50, -22.69], [-9.22, -21.72], [-11.80, -20.44], [-14.20, -18.85], [-16.39, -16.98], [-21.67, -22.44], [-17.93, -24.68], [-17.63, -24.27],
    [-13.15, -26.96], [-8.27, -28.84]], y0: 1.7, y1: 2.0 },
};
// Tower Command: "the tower rides the ladle rail" (Alpha's attack, drawn on Bravo's half): the causeway, a jog along the
// Lakefront, up the terrace face, along the terrace, up the yard face, across the yard to the end-stop by the gallery
const TOWER = {
  path: [[0, 1.8, 0], [0, 25.5], [-3.5, 25.5], [-3.5, 34], [13, 34], [13, 43], [-8, 43], [-8, 52]],
  checkpoints: [[0, 22.5], [8, 34], [4, 43]],
};
// Bazookarp (bazookarp/SPEC.md §4.1: Alpha's attack on Bravo's half; the engine mirrors it). Data only: inert until the
// mode's engine reads layout.bazookarp.
const BAZOOKARP = {
  start: [0, 1.8, 0],                                  // the Pond on the Pour Floor, under the Surge Gauge
  weirs: [{ at: [0, 1.2, 24.5] }],                     // Bravo's Lakefront at the causeway foot (posts at x ±2.7)
  gate: { at: [-9, 3.6, 52] },                         // Bravo's yard, a level below the gallery
  freeZones: [{ poly: [[-10, 57.5], [10, 57.5], [10, 69], [-10, 69]], y0: 4.6, y1: 6.5,   // Bravo's gallery
    signs: [[0, 57.1, 0], [10.4, 63, 90], [-10.4, 63, -90]] }],                           // front stair and both side stairs
  routes: {
    causeway: [[0, 12], [0, 22], [0, 24.5], [2, 30], [5.4, 36.5], [-9, 52]],
    castingFloor: [[-6, 14], [-6, 20.5], [0, 24.5]],                          // LOW only
    gantry: [[-9.5, 10], [-9.5, 21.5], [0, 24.5]],                            // the Ladle Gantry (bazookarp only)
    east: [[0, 24.5], [-7.9, 27], [-12.8, 35.5], [-13.3, 40], [-9, 52]],      // East Steps → Cupola Stair
  },
};

// ============================================================================================================ the layout
const LAYOUT_CALDERA = {
  id: 'caldera',
  bounds: { minX: -36, maxX: 36, minZ: -74, maxZ: 74 },
  spawnPads: [[0, 4.8, -64.5], [0, 4.8, 64.5]],
  spawnBarrier: 4.2,
  // (the art pass sets the real intro and hero shot: DESIGN.md §5.7)
  intro: { from: [40, 26, -40], lookFrom: [0, 8, 0], toBack: 3.2 },
  art: { from: [-44, 30, -56], look: [4, 2, 4], fov: 56, lava: 'high' },
  env: { backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false, sea: false },
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
