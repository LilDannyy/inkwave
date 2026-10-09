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
const WB_Z0 = 0.3, WB_Z1 = 4.3;   // the West Bridge's sides (z)
const CUPOLA = [16.2, -46.0];
const DOCK_CAR = [...P(26.7, -62.1), -62.1], DOCK_TB = [...P(28.35, -76.3), -76.3];   // the ladle car on the casting dock, the Tide Board against the terrace face: [x, z, θ]

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
// (the ledges that drown: blockout colour = DESIGN.md §5.3's glaze as the stain will darken it below the high mark,
// #4d4945, warmed: "the dark glazed floor floods" reads before the engine's stain exists)
const glaze = (o = {}) => ({ color: K.glaze, pattern: PATTERN.rubber, ...o });
const coping = (o = {}) => ({ color: K.basaltDk, pattern: PATTERN.asphalt, tag: 'coping', ...o });
const steps = (o = {}) => ({ color: K.basalt, pattern: PATTERN.stonestep, ...o });
const iron = (o = {}) => ({ color: K.iron, pattern: PATTERN.metalpanel, ...o });
const cover = (c = K.cast, o = {}) => ({ color: c, pattern: PATTERN.rubber, roof: true, ...o });
const white = (o = {}) => ({ color: K.white, pattern: PATTERN.render, roof: true, ...o });
const calWall = () => ({ color: K.wall, pattern: PATTERN.concrete, roof: true, tag: 'caldera-wall' });

// ============================================================================================================ floors
// the curved floors (geo.js outlines), filled by ground.js. Alpha's half unless `single`. A floor's foot (y0) is only as
// deep as its open faces need (the lake's banks reach −1.1 through their copings); floors with nothing open under them
// stop at 0.45, under the level's 0.5 m underside cull (a deeper foot only adds hidden faces to the lightmap and paint
// atlases, a higher one adds undersides)
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
  { id: 'hornLadle', poly: G.HORN_LADLE, top: 2.4, y0: 0.45, mk: () => rock({ tag: 'ladle-road', color: K.scoria }) },
  { id: 'ridge', poly: G.RIDGE, top: 3.6, y0: 0.45, mk: () => rock({ tag: 'rim-ridge' }) },
  { id: 'castingBed', poly: G.CASTING_BED, top: 3.0, y0: 2.4, w: 0.8, mk: () => ({ color: K.sand, pattern: PATTERN.rubber, tag: 'casting-bed' }) },
];
// rectangular floors and solid volumes the edge test must see (Alpha's half): x0, x1, z0, z1, top
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const BOXES = [
  { id: 'causeway', poly: rectP(-4, 4, -22.65, -11.5), top: 1.2 },
  { id: 'pour', poly: rectP(-5, 5, -5, 5), top: 1.8, single: true },
  { id: 'pit', poly: rectP(G.PIT.x0, G.PIT.x1, G.PIT.z0, G.PIT.z1), top: 3.0 },
];

// ------------------------------------------------------------------------------------------------ the edges (E2–E8)
// caldera walls (basalt, roof, ≥ 1 m thick, ≥ 3 m over the floor they bound), laid outside the outer edge of play; and
// (fix round 2) the Casting Hall: a curved whitewashed hall along the head's curve behind the gallery and its side
// yards (12 m behind the gallery, 8 m wings), turned with the gallery toward the Rim Head
const ALL0 = [];
for (const f of [...FLOORS, ...BOXES]) { ALL0.push(f); if (!f.single) ALL0.push({ ...f, poly: rotPoly(f.poly), twin: f }); }
const floorAt = (x, z) => ALL0.some((f) => !f.wall && inPoly(f.poly, x, z));
const EDGE_WALLS = G.EDGES.map((e) => ({ e, w: walls(e.pts, { t: e.t, top: e.top, y0: e.y0, ext0: e.ext0, ext1: e.ext1, mk: calWall }, floorAt) }));
const hallMk = () => white({ tag: 'casting-hall', hidden: true, paint: false });
const HALL_W = [
  walls(G.HEAD(-74.5, G.TH_GE - 0.4), { t: 3.0, top: 8.0, y0: 0, ext0: 0.3, ext1: 0, mk: hallMk }, floorAt),
  walls(G.HEAD(G.TH_GE - 0.4, G.TH_GW + 0.4), { t: 3.0, top: 12.0, y0: 0, ext0: 0.3, ext1: 0.3, mk: hallMk }, floorAt),
  walls(G.HEAD(G.TH_GW + 0.4, -104.5), { t: 3.0, top: 8.0, y0: 0, ext0: 0, ext1: 0.3, mk: hallMk }, floorAt),
];
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

// a run of O-boxes along a polyline (parapets, low walls): tops alternate 0 / +0.1 so the wedges where they overlap at
// the corners never z-fight; `side` lays them left (+1) or right (−1) of travel, 0 centred
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
// a stair standing on the lower tier in front of a chord of the face it climbs (geo.js chordA)
const stairOn = (c, run, y0, y1, width, o) => R([G.r3(c.mid[0] + c.n[0] * run), y0, G.r3(c.mid[1] + c.n[1] * run)], [G.r3(c.mid[0]), y1, G.r3(c.mid[1])], width, o);

// ============================================================================================================ pieces
const HALF = [];
const SINGLE = [];
const add = (...p) => HALF.push(...p.flat());

// ---------------------------------------------------------------------------------------- the floors themselves
for (const f of FLOORS) if (!f.single && !(f.drown && HIGH_BUILD)) add(groundOf(f.id));
SINGLE.push(...groundOf('island'));
// (a hidden deck slab inside the island: the environment's sea takes the stage's footprint from its deck slabs (tops at
// 0, bottoms in the sea); at HIGH the drowned ledges are gone and the sea would fall back to the whole bounds. Blockout
// only: the lava engine's `env.sea: false` (ENGINE H22) removes the sea)
SINGLE.push(B(-0.37, 0.41, -1.2, 0, -0.43, 0.39, { hidden: true, paint: false, tag: 'footprint' }));

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
// (fix round 1: mid had no high ground at LOW — a 1.2 m disc round a 1.8 m plate, the bottom of the bowl both bases
// look down into. Now the gauge stands on raised basalt foundations, the Organ clusters on stepped aprons, and every
// quarter of the island has a mass to hold and hide behind: at fight level mid has five heights at LOW — the island
// 1.2, the Pour Floor and the aprons' first step 1.8, the decks and the aprons' second step 2.4, the aprons' tops 3.0 —
// and the Organ lookouts on top at HIGH. All of it clear of the tower lane (|x| ≤ 2.25) and of the Pond's 8 sightlines
// (the 7 m viewpoints of bazookarp SPEC checker #14))
// the West Deck (Bravo's East Deck is its turn): the Surge Gauge's west foundation, dressed basalt at 2.4 — 0.6 m over
// the Pour Floor it adjoins (the zone sits under contestable ground) and 1.2 m over the island (one hop); the West
// Bridge lands on it level. Its stair faces the enemy's causeway; its machine house holds the gauge's float-well pump.
const DECK = { x0: -12.9, x1: -5.0, z0: -2.4, z1: 6.6 };
add(B(DECK.x0, DECK.x1, 1.2, 2.4, DECK.z0, DECK.z1, { color: '#7b7e84', pattern: PATTERN.yard, tag: 'gauge-deck' }));
// (from the machine house north the deck runs flush to the island's west face — x −13.9 where it bulges, −13.5 north of
// z 2 — and the house itself stands on the island's edge: no ledge strip outside either (a bot was wedged there))
add(B(-13.9, DECK.x0, 1.2, 2.4, -0.35, 2.0, { color: '#7b7e84', pattern: PATTERN.yard, tag: 'gauge-deck' }));
add(B(-13.5, DECK.x0, 1.2, 2.4, 2.0, DECK.z1, { color: '#7b7e84', pattern: PATTERN.yard, tag: 'gauge-deck' }));
add(R([-7.35, 1.2, 9.3], [-7.35, 2.4, DECK.z1], 4, steps({ tag: 'deck-stair' })));
add(B(-13.95, -9.6, 1.2, 5.4, DECK.z0 - 0.05, -0.35, white({ tag: 'gauge-machine-house', color: '#dcd6c8' })));
// a low parapet (cover) on the deck's west edge north of the bridge, and a valve chest at its south-east corner (the
// deck's north edge west of the stair stays open: the island strip below it is a hop up, not a pocket)
add(B(-13.5, -13.1, 2.4, 3.3, WB_Z1 + 0.35, DECK.z1 - 0.2, cover(K.basaltDk, { tag: 'deck-parapet', pattern: PATTERN.concrete })));
add(B(-6.6, DECK.x1, 2.4, 3.4, DECK.z0, DECK.z0 + 1.2, cover(K.ironDk, { tag: 'valve-chest' })));
// island cover: an ingot stack at the causeway landing (east of the lane; the apron is the landing's west side)
add(B(2.2, 3.4, 1.2, 2.2, -9.6, -8.4, cover(K.cast, { tag: 'ingot-stack' })));
// the Organ apron: the column pavement east of the cluster heaved into broken steps (1.8 / 2.4 / 3.0), so the cluster is
// high ground at LOW too (at HIGH the lookout rises 1.65 m over its top). Its west side follows the socket collars'
// outer edge (the notch's east side offset 0.6 m), so no slot opens between it and the columns — the 0.15 m seam is
// the collar's, as before; none of it stands on a flat where a step link lands (those face north and south). Its first
// step meets the Pour Floor's south edge.
const APRON_EDGE = (() => {   // the collars' outer edge, z from −4.9 to −11.4 (a miter offset of the notch's east side)
  // (the notch's east side without its sub-0.4 m kinks: a miter offset of those throws spikes)
  const N = G.NOTCH_EDGES.slice(24).slice(13).filter((p, i, A) => i === 0 || i === A.length - 1 || Math.hypot(p[0] - A[i - 1][0], p[1] - A[i - 1][1]) > 0.4), d = 0.6, segs = [];
  for (let i = 0; i + 1 < N.length; i++) {
    const [ax, az] = N[i], [bx, bz] = N[i + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.05) continue;
    let nx = (bz - az) / L, nz = -(bx - ax) / L; if (nx < 0) { nx = -nx; nz = -nz; }   // toward the island (east)
    segs.push([[ax + nx * d, az + nz * d], [bx + nx * d, bz + nz * d]]);
  }
  const pts = [segs[0][0]];
  for (let i = 0; i + 1 < segs.length; i++) {   // miter: intersect consecutive offset lines
    const [[x1, z1], [x2, z2]] = segs[i], [[x3, z3], [x4, z4]] = segs[i + 1];
    const den = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
    if (Math.abs(den) < 1e-6) { pts.push([x2, z2]); continue; }
    const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / den;
    pts.push([x1 + t * (x2 - x1), z1 + t * (z2 - z1)]);
  }
  pts.push(segs[segs.length - 1][1]);
  return pts.map(([x, z]) => [G.r3(x), G.r3(z)]);
})();
export { APRON_EDGE };
const apronAt = (z) => { for (let i = 0; i + 1 < APRON_EDGE.length; i++) { const [ax, az] = APRON_EDGE[i], [bx, bz] = APRON_EDGE[i + 1]; if ((az - z) * (bz - z) <= 0 && az !== bz) return G.r3(ax + ((bx - ax) * (z - az)) / (bz - az)); } return null; };
const chainZ = (z0, z1) => [[apronAt(z0), z0], ...APRON_EDGE.filter(([, z]) => z < z0 - 0.02 && z > z1 + 0.02), [apronAt(z1), z1]];
// three disjoint tiers: 3.0 west of x −5.6 below z −9; 2.4 round it; 1.8 round that, up to the Pour Floor
const APRON = [
  [[...chainZ(-9.0, -11.2), [-5.6, -11.2], [-5.6, -9.0]], 3.0, K.basaltDk],
  [[...chainZ(-7.2, -9.0), [-5.6, -9.0], [-5.6, -11.2], [-4.6, -11.2], [-4.6, -7.2]], 2.4, '#5a5e65'],
  [[...chainZ(-5.0, -7.2), [-4.6, -7.2], [-4.6, -11.2], [-3.6, -11.2], [-3.6, -5.0]], 1.8, '#666a71'],
];
// (the collar-side edges get the kit's sunk coping, which reaches right to the collars' edge: no slot between them)
for (const [poly, top, c] of APRON) { const f = fill(poly, { y0: 1.2, top, mk: () => rock({ tag: 'organ-apron', color: c }), edge: () => ({ kind: 'ledge', w: 0.6, sink: true, y0: 1.2 }) }); add(f.cols, f.ledges); }
// a broken column stub on the apron's top (0.95 m: cover for whoever holds it; the top was an 8.2 m open circle)
add(OCT(-6.1, -10.55, 0.42, 3.0, 3.95, rock({ tag: 'organ-stump', color: K.basaltDk, roof: true })));
// the Organ Pipes and (at HIGH) the Pumice Race: static stand-ins at this build's level until the lava engine lands
if (BLOCKOUT_LAVA) {
  add(riderStandIns((what, o) => (what === 'stone' ? { color: K.pumice, pattern: PATTERN.rubber, ...o }
    : what === 'organ-stub' ? { color: K.basaltDk, pattern: PATTERN.asphalt, roof: true, ...o }
      : { color: '#53575e', pattern: PATTERN.asphalt, ...o })));
}

// ---------------------------------------------------------------------------------------- Alpha's base: the gallery
// the spawn gallery (4.8, a floor of FLOORS): the Casting Hall's gable balcony, open to the sky, turned 12° about the
// pad toward the Rim Head (fix round 2), its back on the head's curve. Pad (0, 4.8, −64.5).
const SW = (x, z) => G.sw([x, z]);
const SWD = G.swDir([0, 1]), SWX = G.swDir([1, 0]), SWA = -G.SWING;   // the gallery's forward and right, its O-box yaw
// three exits: the Gallery Stair (forward) and two side stairs onto the side yards
{ const t = SW(0, -57.5); add(R([G.r3(t[0] + SWD[0] * 2.7), 3.6, G.r3(t[1] + SWD[1] * 2.7)], [t[0], 4.8, t[1]], 8, steps({ tag: 'gallery-stair' }))); }
for (const s of [-1, 1]) { const t = SW(s * 10, -63); add(R([G.r3(t[0] + s * SWX[0] * 2.7), 3.6, G.r3(t[1] + s * SWX[1] * 2.7)], [t[0], 4.8, t[1]], 3, steps({ tag: 'gallery-side-stair' }))); }
// balustrades: the gallery is entered only by its three stairs
const RAILS = [];   // [x0, z0, x1, z1, y, h]: every railing's line (props.js draws them; the colliders are below)
const railSeg = (a, b, y, h = 1.0, t = 0.25, o = {}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  RAILS.push([a[0], a[1], b[0], b[1], y, h]);
  return O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), G.r3(L - 0.06), t, y, y + h, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), { rail: true, color: K.green, tag: 'rail', ...o });
};
add(railSeg(SW(4, -57.4), SW(10, -57.4), 4.8), railSeg(SW(-10, -57.4), SW(-4, -57.4), 4.8));
for (const s of [-1, 1]) add(railSeg(SW(s * 9.9, -68.9), SW(s * 9.9, -64.5), 4.8), railSeg(SW(s * 9.9, -61.5), SW(s * 9.9, -57.6), 4.8));
// the gallery's two lamp standards on cast-iron plinths, flanking the Gallery Stair's head (cover at the deck's front)
for (const x of [4.75, -4.75]) { const c = SW(x, -58.5); add(O(c[0], c[1], 0.8, 0.8, 4.8, 6.0, SWA, cover(K.green, { tag: 'gallery-lamp' }))); }
// gallery urns (cover outside the barrier)
for (const [x, z] of [[8.4, -59.4], [-8.4, -59.4], [8.4, -67.4], [-8.4, -67.4]]) { const c = SW(x, z); add(O(c[0], c[1], 1.2, 1.2, 4.8, 5.9, SWA, cover('#8a7f72', { tag: 'urn' }))); }
// the Casting Hall (collision: props.js draws the curved hall, its sawtooth roofs and the round window)
add(HALL_W.flatMap((w) => w.blocks));

// ---------------------------------------------------------------------------------------- the Yard (3.6)
// (fix round 2: the yard is the comma's head — its east side the head's round cheek, its back the turned hall, its west
// side sweeping into the Rim Head — and its front the yard-front spiral, r 34.4 at the lip corner to 43 at the Rim Head)
// the weighbridge pit: a sunken iron plate (3.0) with a ramp off each end (14°); its long sides are 0.6 m steps
{ const zc = (G.PIT.z0 + G.PIT.z1) / 2;
  add(B(G.PIT.x0, G.PIT.x1, 0, 3.0, G.PIT.z0, G.PIT.z1, iron({ tag: 'weighbridge', color: '#73787d' })));
  add(R([G.PIT.x0 + 2.4, 3.0, zc], [G.PIT.x0, 3.6, zc], 4, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard })), R([G.PIT.x1 - 2.4, 3.0, zc], [G.PIT.x1, 3.6, zc], 4, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard }))); }
// the floor's edge at z (the head's curve), west (x < 0) or east (x > 0) side: for buildings that stand against it
const headAtZ = (z, east) => { let best = null; for (let a = -57; a >= -137; a -= 0.02) { const r = G.headR(a), x = r * Math.cos(a * G.D), zz = r * Math.sin(a * G.D); if (Math.abs(zz - z) < 0.03 && (east ? x > 0 : x < 0)) { best = x; if (!east) break; } } return best; };
const againstWall = (x1, z0, z1, east, step = 0.5) => {   // a footprint from x1 out to the head's curve, z0 → z1 (z0 < z1)
  const pts = [[x1, z0], [x1, z1]];
  for (let z = z1; z >= z0 - 1e-6; z -= step) pts.push([G.r3(headAtZ(z, east) + (east ? -0.02 : 0.02)), G.r3(z)]);
  return pts;
};
// the Surge Office: two storeys of whitewashed basalt against the west wall, with its brick annex (the Pattern Store)
// filling to the wall so no strip is left behind it
add(B(-23.0, -16.2, 3.6, 9.5, -52.6, -46.6, white({ tag: 'surge-office' })));
{ const mk = () => ({ color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'pattern-store' });
  const annex = fill(againstWall(-23.0, -52.6, -46.6, false), { y0: 3.6, top: 8.2, mk, edge: () => ({ kind: 'poke', w: 1.0 }) }); add(annex.cols); }
// the dispatch dock: the Surge Office's loading dock, 1.2 m over the yard from the office to the west wall — the
// defenders' perch over the Rim Head's approach and the tower's climb. Stair on its north face; its east face a hop.
{ const d = fill(againstWall(-16.2, -46.6, -41.0, false), { y0: 3.6, top: 4.8, mk: () => ({ color: '#8f8b84', pattern: PATTERN.yard, tag: 'dispatch-dock' }), edge: () => ({ kind: 'ledge', w: 0.6, sink: true, y0: 3.6 }) }); add(d.cols, d.ledges); }
add(R([-20.0, 3.6, -38.3], [-20.0, 4.8, -41.0], 3, steps({ tag: 'dock-stair' })));
// the weighbridge house over the pit's north side (the scale's beam and the weighman's room): 3 m of whitewash
add(B(-12.6, -8.1, 3.6, 6.6, -48.6, -45.8, white({ tag: 'weigh-house' })));
// the core oven between the pit and the Gate: a brick kiln 3.2 m tall, the Gate apron's west block
add(B(1.0, 4.5, 3.6, 6.8, -50.5, -47.0, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'core-oven' }));
add(OCT(4.05, -47.45, 0.4, 6.8, 9.0, { color: '#4b4f55', pattern: PATTERN.metal, roof: true, tag: 'oven-flue' }));   // (at the oven's NE corner: off the spawn's line to the Surge Gauge)
// the cupola furnace on the east cheek, the weighbridge office against the east wall, the jib crane's mast outside it
add(OCT(CUPOLA[0], CUPOLA[1], 2.38, 3.6, 9.4, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'cupola' }));
add(OCT(CUPOLA[0], CUPOLA[1], 1.0, 9.4, 15.0, { color: '#4b4f55', pattern: PATTERN.metal, roof: true, tag: 'cupola-stack' }));
{ const w = fill(againstWall(17.6, -55.6, -52.0, true), { y0: 3.6, top: 6.8, mk: () => white({ tag: 'weigh-office' }), edge: () => ({ kind: 'poke', w: 1.0 }) }); add(w.cols); }
add(B(22.4, 23.6, 0, 12, -56.4, -55.2, { color: K.green, pattern: PATTERN.metal, roof: true, tag: 'jib-mast' }));
// casting stacks: cover every 5–8 m, clear of the tower lane (z −43 ± 1.25, then x 8 ± 1.25 to the goal) and the Gate
const stack = (x, z, w, d, h, base, tag, c = K.cast) => B(x - w / 2, x + w / 2, base, base + h, z - d / 2, z + d / 2, cover(c, { tag }));
// a stack of castings two pallets high: the lower pallet, and a smaller one on it set back toward (ox, oz) (a stepped
// silhouette, so a yard of stacks never reads as a field of dice); a drum / round stack is an octagon
const stack2 = (x, z, w, d, h, base, tag, c, [w2, d2, h2, ox = 0, oz = 0]) => [stack(x, z, w, d, h, base, tag, c), stack(x + ox, z + oz, w2, d2, h2, base + h, tag, c)];
const drum = (x, z, r, h, base, tag, c) => OCT(x, z, r, base, base + h, cover(c, { tag }));
add(
  // the Gate apron's second block (bazookarp SPEC #6: ≥ 1.2 m within 4 m of route 1): a pallet of manhole covers with a
  // second pallet on it, east of the Gallery Stair's foot
  stack2(7.8, -57.2, 1.6, 1.6, 1.3, 3.6, 'covers-stack', K.cast, [1.1, 1.1, 0.6, 0.15, -0.15]),
  stack2(4.0, -40.0, 2.0, 1.0, 1.0, 3.6, 'mould-boxes', K.wood, [1.0, 0.8, 0.5, -0.4, 0]),
  stack(-9.6, -54.3, 2.0, 1.2, 1.1, 3.6, 'weighbridge-load'),
  stack2(-1.5, -40.1, 2.0, 1.0, 1.0, 3.6, 'ingot-rack', K.cast, [1.4, 0.7, 0.5, 0.2, 0]),
  stack2(11.3, -39.6, 2.2, 1.2, 1.0, 3.6, 'rails-stack', '#5b5f63', [2.2, 0.6, 0.4, 0, 0.2]),
  stack2(-9.4, -39.9, 1.6, 1.2, 1.2, 3.6, 'pig-iron', '#5b5550', [1.0, 0.8, 0.4, 0.2, 0]),
  drum(-17.6, -58.4, 0.75, 1.2, 3.6, 'drain-grates', '#56606a'),
  stack(15.4, -36.8, 1.4, 1.4, 1.2, 3.6, 'drum-stack', '#56606a'),
  stack(13.2, -52.4, 1.6, 1.4, 1.2, 3.6, 'cable-drum', K.ironDk),
);
// a stack of castings for the ferry in each side yard (clear of the side stairs' landings)
add(stack(16.2, -62.4, 1.6, 2.0, 2.2, 3.6, 'ferry-stack', K.cast), stack(-14.9, -62.6, 1.6, 2.0, 2.2, 3.6, 'ferry-stack', '#5f6a63'));
add(stack2(-23.4, -44.6, 1.6, 1.6, 1.3, 4.8, 'pig-iron', '#5b5550', [1.0, 1.2, 0.45, 0.2, 0]), drum(-18.2, -45.4, 0.8, 1.2, 4.8, 'drum-stack', '#56606a'),
  stack(-21.8, -42.0, 2.4, 0.9, 1.0, 4.8, 'bench-ends', K.wood));
// the yard front railing on the yard-front spiral: gaps at the Cupola Stair, the Upper Surge Steps + its hop face, the
// tower climb; the bastion has solid parapets instead
for (const [a0, a1] of [[G.TE - 0.3, G.ST_CUPOLA.a[1]], [G.ST_CUPOLA.a[0], -90], [G.ST_UPPER.a[0], -105.4], [-112.2, -116], [-123, -126]]) {
  const pts = G.sarcF((a) => G.RY(a) + 0.125, a0, a1, [], 2.5);
  for (let i = 0; i < pts.length - 1; i++) add(railSeg(pts[i], pts[i + 1], 3.6));
}
// the bastion's parapets (basalt, 0.9) on its free sides: the Surge Office's balcony out over the terrace
add(segsAlong(G.sarcF((a) => G.RY(a) - 3.3, -123, -116, [], 2), 0.4, 3.6, 4.5, { color: K.basaltDk, pattern: PATTERN.concrete, roof: true, tag: 'bastion-parapet' }));
for (const a of [-116, -123]) add(segsAlong([P(G.RY(a) - 3.0, a), P(G.RY(a), a)], 0.4, 3.6, 4.5, { color: K.basaltDk, pattern: PATTERN.concrete, roof: true, tag: 'bastion-parapet' }));

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
add(cone(-27.0, -33.6, 1.2, 4.5, 3.25, 3.6, 'spatter-cone'));
add(cone(-29.6, -24.6, 0.8, 4.2, 2.2, 3.6, 'hummock'));
add(stack(-23.6, -26.2, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk), stack(-26.6, -39.6, 2.0, 1.4, 1.4, 3.6, 'outcrop', K.basaltDk),
  stack(-30.6, -29.0, 1.6, 1.4, 1.3, 3.6, 'outcrop', K.basaltDk), stack(-33.0, -21.6, 1.2, 1.2, 1.2, 3.6, 'cairn', K.basaltDk));

// ---------------------------------------------------------------------------------------- the Moulding Terrace (2.4)
// stairs: yard ↔ terrace (on the terrace, top edge on a chord of the yard front) and terrace ↔ Lakefront (on the
// Lakefront, top on a chord of the terrace front); the Office Stair climbs the Rim Head's east face (θ −126)
add(stairOn(G.ST_UPPER, 2.7, 2.4, 3.6, 4, steps({ tag: 'upper-surge-steps' })));
add(stairOn(G.ST_CUPOLA, 2.7, 2.4, 3.6, 3, steps({ tag: 'cupola-stair' })));
add(stairOn(G.ST_LOWER, 2.7, 1.2, 2.4, 8, steps({ tag: 'lower-surge-steps' })));
add(stairOn(G.ST_EAST, 2.7, 1.2, 2.4, 3, steps({ tag: 'east-steps' })));
{ const t = P(37.6, -126), u = [-Math.sin(-126 * G.D), Math.cos(-126 * G.D)];   // along the face, toward the terrace (θ > −126)
  add(R([G.r3(t[0] + u[0] * 2.8), 2.4, G.r3(t[1] + u[1] * 2.8)], [t[0], 3.6, t[1]], 3, steps({ tag: 'office-stair' }))); }
// the terrace parapet (solid basalt with a whitewashed coping, 0.9: cover) on the terrace-front spiral: from the quay to
// the East Steps and from the East Steps to the tower's climb; west of it the face is open (hops, stairs, the Moorings)
for (const [a0, a1] of [[G.angOf(...ch(G.S_T, -HW)) - 0.4, G.ST_EAST.a[1]], [G.ST_EAST.a[0], G.CHORD_T.a[1]]]) {
  add(segsAlong(G.sarcF((a) => G.RT(a) + 0.25, a0, a1, [], 2.5), 0.5, 2.4, 3.3, { color: '#7a7d82', pattern: PATTERN.concrete, roof: true, tag: 'terrace-parapet' }));
}
// the Firebrick Store (buff brick) at the terrace's back by the quay; the Pattern Shop on its front west; terrace cover
{ const [x, z] = P(33.9, -63.6); add(O(x, z, 2.6, 2.6, 2.4, 7.0, 63.6 + 90, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'firebrick-store' })); }
add(B(-13.4, -8.6, 2.4, 5.4, -32.6, -30.3, { color: K.wood, pattern: PATTERN.planks, roof: true, tag: 'pattern-shop' }));
add(stack(-10.2, -37.9, 2.4, 1.0, 1.2, 2.4, 'pattern-crates', K.wood),
  stack(8.6, -33.4, 1.2, 1.2, 1.0, 2.4, 'firebrick-pallet', K.brick),
  stack(-0.9, -37.6, 2.0, 0.8, 1.0, 2.4, 'mould-boxes', K.wood),
  stack(-16.4, -33.0, 1.6, 0.9, 1.1, 2.4, 'flask-stack', '#6b5f55'),
  stack(-1.2, -32.4, 1.6, 0.8, 1.1, 2.4, 'flask-stack', '#6b5f55'));   // (behind the Lower Surge Steps' head, clear of the tower lane)
{ const [x, z] = P(32.7, -77); add(stack(x, z, 1.2, 0.8, 1.0, 3.0, 'flask-stack', '#6b5f55')); }   // a moulding flask on the casting bed

// ---------------------------------------------------------------------------------------- the Lakefront (1.2) and Moorings (1.8)
// the casting dock against the terrace face below the quay (fix round 2: off the Lakefront's lake edge, so the Ladle
// Gantry's landing and the lane west to the weir stay open), the ladle car on its siding, the Tide Board against the face
{ const d = fill(G.CAST_DOCK, { y0: 1.2, top: 1.8, mk: () => iron({ tag: 'cast-dock', color: '#86847e' }), ledgeMk: () => coping({ color: K.basaltDk }), edge: () => ({ kind: 'ledge', w: 0.6, y0: 1.2 }) }); add(d.cols, d.ledges); }
add(O(G.r3(DOCK_CAR[0]), G.r3(DOCK_CAR[1]), 2.6, 1.4, 1.8, 3.9, -DOCK_CAR[2] - 90, cover('#4f5a52', { tag: 'ladle-car' })),
  stack(-5.6, -24.2, 1.2, 1.0, 1.1, 1.2, 'chain-bin'),
  O(G.r3(DOCK_TB[0]), G.r3(DOCK_TB[1]), 2.2, 0.6, 1.2, 3.4, -DOCK_TB[2] - 90, cover('#e6dfcd', { tag: 'tide-board' })));
add(stack(-14.6, -22.6, 1.4, 1.2, 1.3, 1.8, 'capstan', '#4f5a52'), stack(-11.6, -25.2, 1.0, 1.0, 1.0, 1.8, 'chain-bollard', K.ironDk),
  stack(-18.6, -23.4, 1.2, 1.2, 1.0, 1.8, 'stone-crate', K.pumice), stack(-16.4, -28.0, 1.2, 1.6, 1.1, 1.8, 'spare-pumice', K.pumice));
// a chain bollard on the south head, 2.2 m back from the Race's landing and off the steps' line (cover at the landing)
{ const [x, z] = G.sp(G.S0, -2.2, -1.8); add(O(x, z, 1.0, 1.0, 1.2, 2.3, 19, cover(K.ironDk, { tag: 'chain-bollard' }))); }
// the winch house at the Lakefront's west end against the Rim Head's face: drives the Race's chains (fix round 2: the
// shore spiral narrowed this end, so it stands back against the face and leaves a 2.6 m lane to the south head)
{ const [x, z] = P(31.3, -139.5); add(O(x, z, 2.4, 2.4, 1.2, 4.0, 139.5, white({ tag: 'winch-house' }))); }

// ---------------------------------------------------------------------------------------- the ledges (0) east of the causeway
// (the props on the Casting Floor stand in the lava at HIGH: they stay)
add(stack(8.4, -17.4, 1.6, 1.6, 1.8, 0, 'mould-stack', K.ironDk), stack(13.4, -15.0, 1.6, 1.6, 2.0, 0, 'ladle-stand', K.ironDk));
// the Spillway Bridge (2.35, underside 2.0; fix round 2): diagonally across the channel from Alpha's quay to Bravo's
// horn tip at the mouth, so the horn ends in a point inside r 25 (no landing pad hooking out to r 34). Works-green
// girders (rail) both sides; a basalt pier mid-channel. Its deck is 0.1 under the quay and the horn it reaches into.
{ const a = ch(...G.SBR.a), b = ch(...G.SBR.b), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, yaw = G.r3((-Math.atan2(dz, dx) * 180) / Math.PI);
  add(O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), G.r3(L + 1.0), 3.0, 2.0, 2.3, yaw, iron({ tag: 'spillway-bridge', color: '#56685e' })));
  for (const s of [-1, 1]) { const ox = -uz * s * (1.5 + 0.125), oz = ux * s * (1.5 + 0.125); add(railSeg([G.r3(a[0] + ox + ux * 0.3), G.r3(a[1] + oz + uz * 0.3)], [G.r3(b[0] + ox - ux * 0.3), G.r3(b[1] + oz - uz * 0.3)], 2.3)); }
  add(O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), 0.8, 2.4, 0, 2.0, yaw + 90, cover(K.basaltDk, { tag: 'bridge-pier' }))); }
// the lip fence: a chain fence strung across the lip from the quay's corner to the horn's wall, over the lava that pours
// out through the breach at both levels (beyond it the lavafall chute)
add(railSeg(G.LIP_C.map((v) => G.r3(v * 0.997)), G.LIP_N.map((v) => G.r3(v * 0.997)), 0, 1.0));

// ---------------------------------------------------------------------------------------- Alpha's west rim
// the Slump shelf's two hornitos (fix round 2: the shelf is 4.6 → 4.1 m again, the cliff back at r 31.5 → 31.0): 1.3 m
// spatter chimneys against the cliff about 5 m from each head, leaving a 2.7–3.0 m path on their lake side — cover from
// the island's west face, the Organ lookout and the north head, which the bare ledge did not have
for (const a of [-155.5, -167.0]) { const r = G.SHO(a) - 0.75, [x, z] = P(r, a); add(O(x, z, 1.4, 1.4, 0, 1.3, -a, cover(K.scoria, { tag: 'slump-hornito' }))); }
// the Ladle Road's vent hood beside the West Bridge's root, the ladle cradle on the horn; the Rim Ridge's outcrops
{ const [x, z] = P(22.2, 165.0); add(O(x, z, 1.4, 1.4, 2.4, 3.8, -165.0, cover(K.ironDk, { tag: 'vent-hood' }))); }
// (the ladle cradle 7° back from the horn's point, clear of the Spillway Bridge's landing; a 3.6 m lane beside it)
{ const [x, z] = P(22.1, 155.5); add(O(x, z, 1.6, 1.4, 2.4, 3.6, -155.5, cover(K.ironDk, { tag: 'ladle-cradle' }))); }
{ const [x, z] = P(27.6, 174.5); add(O(x, z, 1.4, 1.6, 3.6, 4.9, -174.5, cover(K.basaltDk, { tag: 'outcrop' }))); }
{ const [x, z] = P(26.0, 163.6); add(O(x, z, 1.2, 1.2, 3.6, 4.8, -163.6, cover(K.basaltDk, { tag: 'cairn' }))); }
// the West Bridge, level at 2.3 from the Ladle Road's root to the West Deck on the island, 4 wide, railed both sides
// (its deck at 2.3: 0.1 under the road and the deck it reaches into at both ends, so no two tops coincide)
add(B(-21.4, -12.4, 1.8, 2.3, WB_Z0, WB_Z1, { color: '#56685e', pattern: PATTERN.gangdeck, tag: 'west-bridge' }));
for (const z of [WB_Z0 - 0.125, WB_Z1 + 0.125]) add(railSeg([-20.6, z], [-12.95, z], 2.3));

// ---------------------------------------------------------------------------------------- the edges
add(EDGE_WALLS.flatMap((x) => x.w.blocks));

// ---------------------------------------------------------------------------------------- Bazookarp only
// the Ladle Gantry: the second route to the weir at HIGH (Lakefront east → the island's SE shoulder over the Casting
// Floor). 1.3 (0.1 over the Lakefront and the island it rests on: no coplanar overlap); chain rails on both sides
add(B(8, 11, -1.1, 1.3, -21.5, -9.4, iron({ tag: 'ladle-gantry', color: '#56685e', onlyIn: 'bazookarp' })));
add({ ...railSeg([7.875, -20.4], [7.875, -10.5], 1.3), onlyIn: 'bazookarp' }, { ...railSeg([11.125, -20.4], [11.125, -10.5], 1.3), onlyIn: 'bazookarp' });
RAILS.length -= 2;   // (the gantry's chain rails are drawn only in its own world: props.js reads GANTRY_RAILS)
export const GANTRY_RAILS = [[7.875, -20.4, 7.875, -10.5, 1.3, 1.0], [11.125, -20.4, 11.125, -10.5, 1.3, 1.0]];
export { RAILS };

// ============================================================================================================ modes
// Zone Control: the Pour Floor (centre, 94 m² net of the piers) and the Pumice Moorings (Alpha's side; Bravo's turned):
// the zone is the Moorings' top (fix round 2: the Moorings follow the spiral fronts, so the outline is re-taken from
// geo.js, its inner arc thinned to every other point)
const ZONES = {
  center: [{ poly: [[-5, -5], [5, -5], [5, 5], [-5, 5]], y0: 1.7, y1: 2.0 }],
  side: { poly: G.MOORINGS.filter((p, i, A) => i === 0 || i === A.length - 1 || i % 2 === 0 || !(Math.abs(Math.hypot(p[0], p[1]) - G.RS(G.angOf(p[0], p[1])) - 0.6) < 0.05)).map(([x, z]) => [G.r3(x), G.r3(z)]), y0: 1.7, y1: 2.0 },
};
// Tower Command: "the tower rides the ladle rail" (Alpha's attack, drawn on Bravo's half): the causeway, a jog along the
// Lakefront, up the terrace face, along the terrace, up the yard face, across the yard to the end-stop by the gallery
// (fix round 2: the terrace run 0.6 m further back, z 34.6, between the Pattern Shop on the spiral front and the Upper
// Surge Steps' foot)
const TOWER = {
  path: [[0, 1.8, 0], [0, 25.5], [-3.5, 25.5], [-3.5, 34.6], [13, 34.6], [13, 43], [-8, 43], [-8, 52]],
  checkpoints: [[0, 22.5], [8, 34.6], [4, 43]],
};
// Bazookarp (bazookarp/SPEC.md §4.1: Alpha's attack on Bravo's half; the engine mirrors it). Data only: inert until the
// mode's engine reads layout.bazookarp. (Fix round 2: the routes re-drawn through the stairs' new places.)
const BAZOOKARP = {
  start: [0, 1.8, 0],                                  // the Pond on the Pour Floor, under the Surge Gauge
  weirs: [{ at: [0, 1.2, 24.5] }],                     // Bravo's Lakefront at the causeway foot (posts at x ±2.7)
  gate: { at: [-9, 3.6, 52] },                         // Bravo's yard, a level below the gallery
  freeZones: [{ poly: G.GALLERY.map(([x, z]) => [-x, -z]), y0: 4.6, y1: 6.5,   // Bravo's gallery
    signs: [[...G.sw([0, -57.1]).map((v) => -v), 0], [...G.sw([10.4, -63]).map((v) => -v), 90], [...G.sw([-10.4, -63]).map((v) => -v), -90]].map(([x, z, a]) => [G.r3(x), G.r3(z), G.r3(a - G.SWING)]) }],
  routes: {
    causeway: [[0, 12], [0, 22], [0, 24.5], [3.8, 28.0], [5.5, 36.2], [-9, 52]],
    castingFloor: [[-6, 14], [-6, 20.5], [0, 24.5]],                          // LOW only
    gantry: [[-9.5, 10], [-9.5, 21.5], [0, 24.5]],                            // the Ladle Gantry (bazookarp only)
    east: [[0, 24.5], [-9.1, 24.1], [-11.3, 31.2], [-13.4, 35.6], [-9, 52]],  // East Steps → Cupola Stair
  },
};

// ============================================================================================================ the layout
const LAYOUT_CALDERA = {
  id: 'caldera',
  bounds: { minX: -37, maxX: 37, minZ: -77, maxZ: 77 },
  spawnPads: [[0, 4.8, -64.5], [0, 4.8, 64.5]],
  spawnBarrier: 4.2,
  // (the art pass sets the real intro and hero shot: DESIGN.md §5.7)
  intro: { from: [40, 26, -40], lookFrom: [0, 8, 0], toBack: 3.2 },
  art: { from: [-44, 30, -56], look: [4, 2, 4], fov: 56, lava: 'high' },
  // (blockout: until the lava engine's `sea: false` (ENGINE H22) and the backdrop land, the environment still draws its
  // sea round the arena; it is tinted the caldera floor's black basalt and stilled, so no picture shows a volcano
  // floating in a blue ocean. The art pass replaces this theme)
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
