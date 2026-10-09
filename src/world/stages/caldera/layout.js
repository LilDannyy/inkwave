// Highmark Foundry — stage layout (src/world/stages/caldera/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, environment (this file)
//   geo.js       the plan as data (every outline)          ground.js  the curved-floor kit
//   lava.js      the lava's data (ENGINE.md format) and the blockout's stand-ins   props.js   prop pack + placements
//   surfaces.js  stage surface materials     murals.js  stage decals / signage     backdrop.js  the far scenery
//
// BLOCKOUT, ROUND 3 (shape first). Highmark Foundry stands inside Bellows Caldera: a foundry round a breathing lava lake.
// Two works, two commas swirling round one lake. Each comma's head is its base (Casting Hall, gallery, yard, terrace,
// Lakefront), leaning toward its own rim; its tail is that rim, sweeping round the lake — bitten by the Slump — to a
// horn that runs on beside the other base along the other works' Spillway. The Spillways are lava arms leaving the lake
// tangentially, so from above the lake and its two arms make a pinwheel between the commas. Mid is Gauge Island under
// the 22 m Surge Gauge, reached by the two causeways (and at LOW over the Casting Floors).
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import * as G from './geo.js';
import { fill, edgeKinds, walls, cutColumns, rotBox, splitColumns } from './ground.js';
import { LAVA, LAVA_VIEW, BLOCKOUT_LAVA, riderStandIns } from './lava.js';

const { P, rotPoly, inPoly } = G;
const HIGH_BUILD = BLOCKOUT_LAVA && LAVA_VIEW === 'high';

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
// the Rim Head is natural rock inside the yard's polygon
GROUNDS.yard.cols = splitColumns(GROUNDS.yard.cols, (x, z) => inPoly(G.RH_REGION, x, z), () => rock({ tag: 'rim-head', color: K.scoria }));
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
// the Surge Gauge: four basalt piers to 7 m (off the diagonals: the Pond is seen from all 8 directions), two tie girders
// at 6.0–6.9 m (they cut the spawn-to-spawn sightline), the upper works solid to 22 m (props.js draws them)
for (const [px, pz] of [[4.2, 1.75], [4.2, -1.75], [-4.2, 1.75], [-4.2, -1.75]]) SINGLE.push(B(px - 0.6, px + 0.6, 1.8, 7.0, pz - 0.6, pz + 0.6, rock({ tag: 'gauge-pier', roof: true, color: K.basaltDk })));
for (const s of [-1, 1]) SINGLE.push(B(-4.75, 4.75, 6.0, 6.9, s * 1.75 - 0.2, s * 1.75 + 0.2, { color: K.green, pattern: PATTERN.metal, roof: true, tag: 'tie-girder' }));
const GAUGE_HIDDEN = (o) => ({ hidden: true, roof: true, paint: false, color: '#888888', tag: 'gauge-works', ...o });
SINGLE.push(
  B(-4.8, 4.8, 7.0, 12.0, -2.35, 2.35, GAUGE_HIDDEN()), B(-1.8, 1.8, 12.0, 17.0, -1.8, 1.8, GAUGE_HIDDEN()),
  B(-1.5, 1.5, 17.0, 18.5, -1.5, 1.5, GAUGE_HIDDEN()), B(-1.5, 1.5, 18.5, 20.5, -1.5, 1.5, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 20.5, 22.0, -1.2, 1.2, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 8.0, 15.0, -2.65, -2.35, GAUGE_HIDDEN({ tag: 'gauge-board' })), B(-1.2, 1.2, 8.0, 15.0, 2.35, 2.65, GAUGE_HIDDEN({ tag: 'gauge-board' })),
);
// helpers: a run of O-boxes along a polyline (parapets): tops alternate 0 / +0.1 so overlapping corners never z-fight;
// a stair standing on the lower tier in front of a chord of the face it climbs; cover stacks
function segsAlong(pts, t, y0, y1, o, side = 0) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    const nx = -dz / L, nz = dx / L, cx = (ax + bx) / 2 + nx * side * t / 2, cz = (az + bz) / 2 + nz * side * t / 2;
    out.push(O(G.r3(cx), G.r3(cz), G.r3(L), t, y0, y1 + (i % 2) * 0.1, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), o));
  }
  return out;
}
const stairOn = (c, run, y0, y1, width, o) => R([G.r3(c.mid[0] + c.n[0] * run), y0, G.r3(c.mid[1] + c.n[1] * run)], [G.r3(c.mid[0]), y1, G.r3(c.mid[1])], width, o);
const stack = (x, z, w, d, h, base, tag, c = K.cast) => B(G.r3(x - w / 2), G.r3(x + w / 2), base, G.r3(base + h), G.r3(z - d / 2), G.r3(z + d / 2), cover(c, { tag }));
const stack2 = (x, z, w, d, h, base, tag, c, [w2, d2, h2, ox = 0, oz = 0]) => [stack(x, z, w, d, h, base, tag, c), stack(x + ox, z + oz, w2, d2, h2, base + h, tag, c)];
const drum = (x, z, r, h, base, tag, c) => OCT(x, z, r, base, G.r3(base + h), cover(c, { tag }));
const ob = (p, w, d, y0, y1, deg, o) => O(G.r3(p[0]), G.r3(p[1]), w, d, y0, y1, G.r3(deg), o);
// a box in the Spillway arm's frame (s along the arm, t across): centre (s, t), size along s × along t
const armBox = (s, t, ls, lt, y0, y1, o) => ob(G.A(s, t), ls, lt, y0, y1, -G.AU, o);
// a mound you climb: an octagon top and eight radial ramp facets (≤ 24°)
function cone(cx, cz, rTop, yTop, rBase, yBase, tag) {
  const out = [...OCT(cx, cz, rTop, yBase, yTop, rock({ tag, color: K.scoria }))];
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 + 22.5) * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), w = 2 * rTop * Math.tan(Math.PI / 8) + 0.3;
    out.push(R([G.r3(cx + ux * rBase), yBase, G.r3(cz + uz * rBase)], [G.r3(cx + ux * rTop * 0.92), G.r3(yTop - 0.02), G.r3(cz + uz * rTop * 0.92)], G.r3(w), rock({ tag: tag + '-facet', color: K.scoria })));
  }
  return out;
}

// the causeway (8 m, the tower's track) with four lamp plinths
add(B(-4, 4, -1.1, 1.2, G.r3(G.CAUSE_Z), -11.5, tuff({ tag: 'causeway', color: '#aaa59c' })));
for (const [x, z] of [[3.4, -14.5], [-3.4, -14.5], [3.4, -19.5], [-3.4, -19.5]]) add(B(x - 0.45, x + 0.45, 1.2, 2.5, z - 0.45, z + 0.45, cover(K.basaltDk, { tag: 'lamp-plinth' })));
// the Organ Pipes and (at HIGH) the Pumice Race: static stand-ins at this build's level until the lava engine lands
if (BLOCKOUT_LAVA) {
  add(riderStandIns((what, o) => (what === 'stone' ? { color: K.pumice, pattern: PATTERN.rubber, ...o }
    : what === 'organ-stub' ? { color: K.basaltDk, pattern: PATTERN.asphalt, roof: true, ...o }
      : { color: '#53575e', pattern: PATTERN.asphalt, ...o })));
}
// mid is not a flat plaza: round the Pour Floor's 1.8 m plinth, the gauge's west foundation (Bravo's east one is its
// turn) is a raised basalt deck at 2.4 with the float-well's machine house on it; the Organ cluster beside Alpha's
// causeway with its column stumps (1.8 / 2.1 / 2.4); cover in every quarter. All clear of the tower lane (|x| ≤ 2.25)
// and of the Pond's 8 sightlines (the 7 m viewpoints)
const DECK = { x0: -12.0, x1: -5.4, z0: -0.6, z1: 6.6 };
add(B(DECK.x0, DECK.x1, 1.2, 2.4, DECK.z0, DECK.z1, { color: '#7b7e84', pattern: PATTERN.yard, tag: 'gauge-deck' }));
add(R([-8.7, 1.2, 9.3], [-8.7, 2.4, DECK.z1], 4, steps({ tag: 'deck-stair' })));             // up from the island's NW toward Bravo's causeway
add(B(-12.0, -9.0, 2.4, 4.6, 2.6, 6.6, white({ tag: 'gauge-machine-house', color: '#dcd6c8' })));
add(B(-6.9, DECK.x1, 2.4, 3.4, DECK.z0, DECK.z0 + 1.2, cover(K.ironDk, { tag: 'valve-chest' })));
for (const [x, z, r, top] of [[-6.4, -8.6, 0.9, 2.1], [-12.9, -2.4, 0.9, 2.4], [-7.0, -3.6, 0.8, 1.8]]) add(OCT(x, z, r, 1.2, top, rock({ tag: 'organ-stump', color: K.basaltDk })));
add(stack(2.9, -9.3, 1.2, 1.2, 1.1, 1.2, 'ingot-stack'), drum(7.6, -6.3, 1.0, 1.4, 1.2, 'stilling-drum', '#5d6268'), stack(11.6, 0.8, 1.4, 1.8, 1.4, 1.2, 'ladle-stand', K.ironDk));

// ---------------------------------------------------------------------------------------- Alpha's base: the gallery
// the spawn gallery (4.8): the Casting Hall's gable balcony, open to the sky. Pad (−7, 4.8, −64.5). Three exits: the
// Gallery Stair (forward) and a side stair onto each side yard; works-green balustrades (rail) between them
const GX = G.PADX, GZ1 = G.GAL.z1;
add(R([GX, 3.6, GZ1 + 2.7], [GX, 4.8, GZ1], 8, steps({ tag: 'gallery-stair' })));
add(R([G.GAL.x0 - 2.7, 3.6, -63], [G.GAL.x0, 4.8, -63], 3, steps({ tag: 'gallery-side-stair' })));
add(R([G.GAL.x1 + 2.7, 3.6, -59.6], [G.GAL.x1, 4.8, -59.6], 3, steps({ tag: 'gallery-side-stair' })));
add(railSeg([G.GAL.x0, GZ1 + 0.1], [GX - 4, GZ1 + 0.1], 4.8), railSeg([GX + 4, GZ1 + 0.1], [G.GAL.x1, GZ1 + 0.1], 4.8));
add(railSeg([G.GAL.x0 + 0.1, -69], [G.GAL.x0 + 0.1, -64.5], 4.8), railSeg([G.GAL.x0 + 0.1, -61.5], [G.GAL.x0 + 0.1, GZ1], 4.8));
add(railSeg([G.GAL.x1 - 0.1, -69], [G.GAL.x1 - 0.1, -61.1], 4.8), railSeg([G.GAL.x1 - 0.1, -58.1], [G.GAL.x1 - 0.1, GZ1], 4.8));
for (const x of [GX - 4.75, GX + 4.75]) add(B(x - 0.4, x + 0.4, 4.8, 6.0, GZ1 - 1.4, GZ1 - 0.6, cover(K.green, { tag: 'gallery-lamp' })));
for (const [x, z] of [[G.GAL.x0 + 1.6, -59.4], [G.GAL.x1 - 1.6, -66.4], [G.GAL.x0 + 1.6, -67.4]]) add(stack(x, z, 1.2, 1.2, 1.1, 4.8, 'urn', '#8a7f72'));

// ---------------------------------------------------------------------------------------- the Yard (3.6)
// three lanes from the gallery to the yard front, formed by the foundry's buildings and lines of castings stacked for
// the ferry: the west lane past the Surge Office and the weighbridge to the Rim Head and the Office Stair; the centre
// lane to the Upper Surge Steps (the Gate stands in it, a level below the gallery); the east lane past the cupola
// furnace to the Cupola Stair and the quay
{ // the weighbridge pit (3.0, cut out of the yard): a ramp off its east end, 0.6 m steps elsewhere; the weigh-house on its north side
  const P_ = G.PIT, zc = (P_.z0 + P_.z1) / 2;
  add(B(P_.x0, P_.x1, 0.45, 3.0, P_.z0, P_.z1, iron({ tag: 'weighbridge', color: '#73787d' })));
  add(R([P_.x1, 3.0, zc], [P_.x1 + 2.4, 3.6, zc], 3.2, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard })));
  add(B(P_.x0 + 0.4, P_.x0 + 5.2, 3.6, 6.6, P_.z1 + 0.6, P_.z1 + 3.0, white({ tag: 'weigh-house' }))); }
// the Surge Office: two storeys of whitewashed basalt against the west wall (props.js: its roof and the Surge Board)
add(B(-39.6, -31.4, 3.6, 9.5, -55.6, -47.6, white({ tag: 'surge-office' })));
// the dispatch dock (4.8): the office's loading dock north of it against the west wall, the defenders' perch over the
// Rim Head's approach; a stair on its east face, its north face a hop
add(B(-39.6, -31.4, 3.6, 4.8, -47.6, -42.6, { color: '#8f8b84', pattern: PATTERN.yard, tag: 'dispatch-dock' }));
add(R([-28.7, 3.6, -45.1], [-31.4, 4.8, -45.1], 3, steps({ tag: 'dock-stair' })));
// the cupola furnace against the east wall; its stack
add(OCT(11.0, -50.0, 2.3, 3.6, 9.4, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'cupola' }));
add(OCT(11.0, -50.0, 1.0, 9.4, 15.0, { color: '#4b4f55', pattern: PATTERN.metal, roof: true, tag: 'cupola-stack' }));
// lines of castings: the west line (x −15.5, between the west and centre lanes) and the east line (x 5, between the centre
// and east lanes), stacked two pallets high with gaps to cut across
add(
  stack2(-15.6, -56.2, 1.6, 1.8, 1.3, 3.6, 'ferry-stack', K.cast, [1.1, 1.2, 0.8, 0, 0.1]),
  stack(-15.6, -51.6, 1.2, 4.0, 2.2, 3.6, 'lamp-post-rack', '#5f6a63'),
  stack2(-15.6, -47.0, 1.6, 1.6, 1.2, 3.6, 'bench-ends', K.wood, [1.0, 1.0, 0.6, 0.1, 0]),
  stack2(5.2, -56.4, 1.6, 1.6, 1.3, 3.6, 'covers-stack', K.cast, [1.1, 1.1, 0.6, 0.15, -0.15]),
  stack(5.2, -52.0, 1.4, 2.6, 1.8, 3.6, 'manhole-covers', K.cast),
  stack2(5.4, -47.6, 1.8, 1.2, 1.1, 3.6, 'mould-boxes', K.wood, [1.0, 0.8, 0.5, -0.3, 0]),
);
// the Gate's apron (Bazookarp: blocks ≥ 1.2 m within 4 m of route 1 between the gallery and the Gate) and centre cover
add(stack(-3.8, -54.2, 1.6, 1.4, 1.3, 3.6, 'drain-grates', '#56606a'), stack2(-5.6, -47.4, 1.8, 1.0, 1.0, 3.6, 'ingot-rack', K.cast, [1.2, 0.7, 0.5, 0.2, 0]));
// the west lane and the side yards
add(drum(-26.6, -58.6, 0.85, 1.3, 3.6, 'drum-stack', '#56606a'), stack(-21.0, -62.4, 1.6, 2.0, 2.2, 3.6, 'ferry-stack', K.cast),
  stack(-25.4, -45.4, 1.6, 1.6, 1.2, 3.6, 'pig-iron', '#5b5550'), stack(7.6, -64.2, 1.2, 1.6, 1.4, 3.6, 'cable-drum', K.ironDk));
// the yard front: a railing on the spiral (squids pass), open at the Cupola Stair, the Upper Surge Steps and the hop face
// beside them, and the tower's climb
{ const gaps = [G.ST_CUPOLA.a, G.ST_UPPER.a, G.CHORD_Y.a];
  const runs = []; let a0 = G.TL - 0.3;
  for (const [lo, hi] of gaps.slice().sort((p, q) => q[1] - p[1])) { runs.push([a0, hi + 0.4]); a0 = lo - 0.4; }
  runs.push([a0, G.TW + 0.5]);
  for (const [r0, r1] of runs) { if (r0 - r1 < 0.8) continue; const pts = G.sarcF((a) => G.RY(a) + 0.125, r0, r1, [], 3); for (let i = 0; i + 1 < pts.length; i++) add(railSeg(pts[i], pts[i + 1], 3.6)); } }

// ---------------------------------------------------------------------------------------- the Moulding Terrace (2.4)
add(stairOn(G.ST_UPPER, 2.7, 2.4, 3.6, 4.4, steps({ tag: 'upper-surge-steps' })));
add(stairOn(G.ST_CUPOLA, 2.7, 2.4, 3.6, 3, steps({ tag: 'cupola-stair' })));
add(stairOn(G.ST_LOWER, 2.7, 1.2, 2.4, 7.6, steps({ tag: 'lower-surge-steps' })));
add(stairOn(G.ST_EAST, 2.7, 1.2, 2.4, 2.6, steps({ tag: 'east-steps' })));
// the Office Stair: up the Rim Head's east face from the terrace
{ const t = P(42.5, G.TW), u = [-Math.sin(G.TW * G.D), Math.cos(G.TW * G.D)];
  add(R([G.r3(t[0] + u[0] * 2.8), 2.4, G.r3(t[1] + u[1] * 2.8)], [t[0], 3.6, t[1]], 3, steps({ tag: 'office-stair' }))); }
// the terrace parapet (solid basalt, whitewashed coping, 0.9: cover) on the terrace-front spiral, open at the stairs, the
// tower's climb and a hop face; west of θ −106 the face is open onto the Moorings (0.6 step)
{ const gaps = [G.ST_EAST.a, G.CHORD_T.a, G.ST_LOWER.a];
  const runs = []; let a0 = G.TQ - 0.4;
  for (const [lo, hi] of gaps.slice().sort((p, q) => q[1] - p[1])) { runs.push([a0, hi + 0.5]); a0 = lo - 0.5; }
  runs.push([a0, -106]);
  for (const [r0, r1] of runs) if (r0 - r1 > 1) add(segsAlong(G.sarcF((a) => G.RT(a) + 0.25, r0, r1, [], 3), 0.5, 2.4, 3.3, { color: '#7a7d82', pattern: PATTERN.concrete, roof: true, tag: 'terrace-parapet' })); }
// the Pattern Shop: a weatherboard shed splitting the terrace's west half (its doors open on giant wooden patterns)
add(ob(P(39.5, -114), 5.6, 3.2, 2.4, 5.4, 114 - 90, { color: K.wood, pattern: PATTERN.planks, roof: true, tag: 'pattern-shop' }));
// the casting bed (3.0): a raised sand bed with moulding flasks, between the tower's run and the yard face
add(ob(P(40.4, -84.2), 4.6, 2.2, 2.4, 3.0, 84.2 - 90, { color: K.sand, pattern: PATTERN.rubber, tag: 'casting-bed' }));
add(ob(P(40.6, -86.4), 1.2, 0.9, 3.0, 4.0, 86.4 - 90, cover('#6b5f55', { tag: 'flask-stack' })));
// the Firebrick Store by the quay, and terrace cover
add(ob(P(35.6, -70.5), 3.0, 3.0, 2.4, 7.0, 70.5 - 90, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'firebrick-store' }));
add(stack(-14.8, -40.2, 2.4, 1.0, 1.2, 2.4, 'pattern-crates', K.wood), stack(-17.6, -34.2, 1.6, 1.6, 1.0, 2.4, 'ingot-pile'),
  stack(-0.6, -40.6, 1.6, 0.9, 1.1, 2.4, 'flask-stack', '#6b5f55'), stack(9.4, -32.0, 1.2, 1.2, 1.0, 2.4, 'firebrick-pallet', K.brick));

// ---------------------------------------------------------------------------------------- the Lakefront (1.2), the Moorings (1.8)
add(stack(-6.4, -25.2, 1.2, 1.0, 1.1, 1.2, 'chain-bin'), ob(P(27.1, -103), 2.4, 0.6, 1.2, 3.4, 13, cover('#e6dfcd', { tag: 'tide-board' })));
add(stack(-15.4, -27.6, 1.4, 1.2, 1.3, 1.8, 'capstan', '#4f5a52'), stack(-11.2, -27.0, 1.0, 1.0, 1.0, 1.8, 'chain-bollard', K.ironDk),
  stack(-19.6, -26.2, 1.2, 1.2, 1.0, 1.8, 'stone-crate', K.pumice), stack(-20.6, -31.2, 1.2, 1.6, 1.1, 1.8, 'spare-pumice', K.pumice));
// the south Slump head: a chain bollard back from the Race's landing; the winch house against the Rim Head's face
{ const [x, z] = G.sp(G.S0, -2.4, -1.4); add(O(x, z, 1.0, 1.0, 1.2, 2.3, 19, cover(K.ironDk, { tag: 'chain-bollard' }))); }
{ const [x, z] = P(31.2, -137.5); add(O(x, z, 2.4, 2.4, 1.2, 4.0, 137.5, white({ tag: 'winch-house' }))); }

// ---------------------------------------------------------------------------------------- the Casting Floor (0, LOW only)
add(stack(6.2, -14.8, 1.4, 1.4, 1.8, 0, 'mould-stack', K.ironDk), stack(14.0, -13.6, 1.6, 1.6, 2.0, 0, 'ladle-stand', K.ironDk));

// ---------------------------------------------------------------------------------------- the Spillway
// the Spillway Bridge (deck 2.3: 0.1 under the banks it bears on, underside 1.95): square across the arm from Alpha's
// quay to Bravo's horn, 5.5 m wide, 9 m bank to bank; works-green girders (rail) both sides
{ const [s0, s1] = G.BR_S, w = s1 - s0;
  add(armBox((s0 + s1) / 2, 0, w, 2 * G.AW + 1.0, 1.95, 2.3, iron({ tag: 'spillway-bridge', color: '#56685e' })));
  for (const s of [s0 + 0.125, s1 - 0.125]) add(railSeg(G.A(s, -G.AW + 0.15), G.A(s, G.AW - 0.15), 2.3)); }
// the lip fence: a chain fence across the lip (beyond it the lavafall)
add(railSeg(G.A(G.LIP, -G.AW + 0.05), G.A(G.LIP, G.AW - 0.05), -0.6, 1.6));
// the Gauge Post (Bravo's, on its horn's tip; Alpha's is its turn at the NW): a squat basalt blockhouse across the horn's
// end whose flat roof (3.6) is a hop from the horn — a lookout over the other works' Spillway — with a parapet on its
// outer sides
add(armBox(17.4, 7.6, 3.8, 6.2, 2.4, 3.6, rock({ tag: 'gauge-post', color: '#8d8a84' })));
add(armBox(19.15, 7.6, 0.3, 6.2, 3.6, 4.5, cover(K.basaltDk, { tag: 'gauge-post-parapet' })), armBox(17.4, 10.55, 3.8, 0.3, 3.6, 4.6, cover(K.basaltDk, { tag: 'gauge-post-parapet' })));
// cover on the horn: a cairn and the ladle cradle (Bravo's horn in the SE; Alpha's are the turn)
add(armBox(8.6, 9.6, 1.2, 1.2, 2.4, 3.6, cover(K.basaltDk, { tag: 'cairn' })), ob(P(24.0, -20.5), 1.6, 1.4, 2.4, 3.6, 20.5, cover(K.ironDk, { tag: 'ladle-cradle' })));

// ---------------------------------------------------------------------------------------- Alpha's west rim
// the Rim Head (3.6, natural rock): a spatter cone and a hummock you climb, outcrops and cairns you hide behind
add(cone(-33.6, -33.4, 1.2, 4.5, 3.2, 3.6, 'spatter-cone'), cone(-30.8, -26.8, 0.8, 4.2, 2.1, 3.6, 'hummock'));
add(stack(-27.2, -37.4, 2.0, 1.4, 1.4, 3.6, 'outcrop', K.basaltDk), stack(-36.2, -41.2, 1.4, 1.6, 1.3, 3.6, 'outcrop', K.basaltDk),
  stack(-28.6, -30.8, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk));
// the Slump shelf: hornitos against the cliff (1.3 m: cover from the island and the heads) and a slag heap where the
// shelf is widest, leaving 3 m paths on both sides of it
for (const a of [-158.0, -168.5]) { const r = G.SHO(a) - 0.8, [x, z] = P(r, a); add(O(x, z, 1.4, 1.4, 0, 1.3, -a, cover(K.scoria, { tag: 'slump-hornito' }))); }
{ const [x, z] = P(31.8, -152.5); add(O(x, z, 1.6, 1.6, 0, 1.2, 152.5, cover(K.scoria, { tag: 'slag-heap' }))); }
// the Ladle Road's vent hood and the Rim Ridge's scree ramps (Ladle Road 2.4 → Ridge 3.6), outcrop and spatter cone
{ const [x, z] = P(22.3, 165.0); add(O(x, z, 1.4, 1.4, 2.4, 3.8, -165.0, cover(K.ironDk, { tag: 'vent-hood' }))); }
for (const a of [171.0]) { const lo = P(G.LR - 2.75, a), hi = P(G.LR + 0.05, a); add(R([lo[0], 2.4, lo[1]], [hi[0], 3.6, hi[1]], 3, rock({ tag: 'scree-ramp', color: K.scoria, pattern: PATTERN.asphalt }))); }
{ const [x, z] = P(28.0, 171); add(O(x, z, 1.4, 1.6, 3.6, 4.9, -171, cover(K.basaltDk, { tag: 'outcrop' }))); }

// ---------------------------------------------------------------------------------------- the edges
add(EDGE_WALLS.flatMap((x) => x.w.blocks));
add(HALL_W.flatMap((w) => w.blocks));

// ---------------------------------------------------------------------------------------- Bazookarp only
// the Ladle Gantry: the second route to the weir at HIGH, when the Casting Floor is under lava (Lakefront east → the
// island's SE shoulder over the Casting Floor). 1.3 (0.1 over the Lakefront and the island it rests on); chain rails on
// both sides. Nothing stands on its landing: the mould stack is west of it, the ladle stand east, the Lakefront clear
add(B(8, 11, -1.1, 1.3, -21.4, -9.6, iron({ tag: 'ladle-gantry', color: '#56685e', onlyIn: 'bazookarp' })));
add({ ...railSeg([7.875, -20.6], [7.875, -10.4], 1.3), onlyIn: 'bazookarp' }, { ...railSeg([11.125, -19.8], [11.125, -10.4], 1.3), onlyIn: 'bazookarp' });
RAILS.length -= 2;   // (the gantry's chain rails are drawn only in its own world: props.js reads GANTRY_RAILS)
export const GANTRY_RAILS = [[7.875, -20.6, 7.875, -10.4, 1.3, 1.0], [11.125, -19.8, 11.125, -10.4, 1.3, 1.0]];
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
  bounds: { minX: -41, maxX: 41, minZ: -76, maxZ: 76 },
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
