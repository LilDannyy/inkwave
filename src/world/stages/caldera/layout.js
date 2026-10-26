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
import { KARP_VETO, KARP_VETO_16 } from './karpVeto.js';   // (fix round 5: the Carp Field's hop / gap edges over the lava, and those checker #16 found no kid makes)
import { SURF } from './surfaces.js';
import { MURAL } from './murals.js';

const { P, rotPoly, inPoly } = G;
const HIGH_BUILD = BLOCKOUT_LAVA && LAVA_VIEW === 'high';
// the outline alone (floors, lake, island, tiers, walls, crossings and riders): for the lead's shape sign-off shots
const OUTLINE_ONLY = false;

// ------------------------------------------------------------------------------------------------------------ palette
// the works: pale tuff paving, whitewash, works green iron, buff firebrick; the caldera: basalt, red scoria, glaze
const K = {
  // (the lava fix round: the region's rock lifted to mid value, ENGINE rule 38 — sRGB luminance ≥ 0.35 — so the stain's
  // ×0.7 darkening below the high mark reads; the glaze is ENGINE's #6e6862. They were near-black: only the rind read)
  tuff: '#aaa49a', tuffDk: '#97928a', basalt: '#646870', basaltDk: '#5f636b', scoria: '#675d58', glaze: '#6e6862',
  pave: '#85878b', wall: '#5f6268', iron: '#7c8186', ironDk: '#5d6268', white: '#e9e4d8', green: '#2f5a48', brick: '#c9b08a',
  spawn: '#ece7dc', pumice: '#bdb8ae', wood: '#9a7b58', cast: '#6d7176', sand: '#b9a68a', rope: '#a78f6c',
};
// (blockout patterns: never the ones the level shader caps with pale stone coping on narrow tops — plain, tiles,
// concrete, brick, glasstile, pavers, render — since the curved floors are columns often under 1.15 m wide)
const tuff = (o = {}) => ({ color: K.tuff, pattern: SURF.tuff, ...o });
const rock = (o = {}) => ({ color: K.basalt, pattern: SURF.basalt, ...o });
// (the ledges that drown: blockout colour = DESIGN.md §5.3's glaze as the stain will darken it below the high mark)
const glaze = (o = {}) => ({ color: K.glaze, pattern: SURF.glaze, ...o });
const coping = (o = {}) => ({ color: K.basaltDk, pattern: SURF.basalt, tag: 'coping', ...o });
const steps = (o = {}) => ({ color: K.basalt, pattern: SURF.basalt, ...o });
const iron = (o = {}) => ({ color: K.iron, pattern: PATTERN.metal, ...o });
const cover = (c = K.cast, o = {}) => ({ color: c, pattern: SURF.basalt, roof: true, ...o });
const white = (o = {}) => ({ color: K.white, pattern: SURF.tuff, roof: true, ...o });
const calWall = () => ({ color: K.wall, pattern: SURF.basalt, roof: true, tag: 'caldera-wall' });
// (the caldera walls round the dry floors are collision-only here and drawn by props.js — caldera_walls — so they cost
// the lightmap nothing: the art pass replaces them with the backdrop's cliffs. The Slump's cliff stays a level block: it
// stands in the lava region and carries the high-mark rind — the level shader's band, not paint)
const calWallHidden = () => ({ ...calWall(), hidden: true, paint: false });
// (fix round 9, review 9 issue 1: the Slump's cliff is never inkable either, as every other outer wall — its faces were, and
// a squid climbed onto its 7.6–7.9 m off-limits tops: against the map standard)
const calCliff = () => ({ ...calWall(), paint: false });

// ============================================================================================================ floors
// the curved floors (geo.js outlines), filled by ground.js. Alpha's half unless `single`. Floors with nothing open
// under them stop at 0.45 (under the level's 0.5 m underside cull); lake banks reach −1.1 through their copings
const FLOORS = [
  { id: 'island', poly: G.ISLAND, top: 1.2, y0: -1.1, single: true, mk: () => tuff({ tag: 'island', color: K.pave, pattern: SURF.tuff }) },
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
  { id: 'causeway', poly: rectP(-G.CW, G.CW, G.CAUSE_Z, -11.5), top: 1.2 },
  { id: 'pour', poly: rectP(-5, 5, -5, 5), top: 1.8, single: true },
  { id: 'pit', poly: rectP(G.PIT.x0, G.PIT.x1, G.PIT.z0, G.PIT.z1), top: 3.0 },
];

// ------------------------------------------------------------------------------------------------ the edges
// caldera walls (basalt, roof, ≥ 1 m thick, ≥ 3 m over the floor they bound), laid outside the outer edge of play; the
// Casting Hall (whitewashed, 12 m) along the gallery's and side yards' backs
const ALL0 = [];
for (const f of [...FLOORS, ...BOXES]) { ALL0.push(f); if (!f.single) ALL0.push({ ...f, poly: rotPoly(f.poly), twin: f }); }
const floorAt = (x, z) => ALL0.some((f) => !f.wall && inPoly(f.poly, x, z));
const EDGE_WALLS = G.EDGES.map((e) => ({ e, w: walls(e.pts, { t: e.t, top: e.top, y0: e.y0, ext0: e.ext0, ext1: e.ext1, mk: e.cliff ? calCliff : calWallHidden }, floorAt) }));
const hallMk = () => white({ tag: 'casting-hall', hidden: true, paint: false, mural: [{ n: [0, 0, 1], id: MURAL.gable }] });   // (props.js draws the hall)
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
    ? { kind: 'ledge', w: 0.6, mk: () => ({ color: '#5f6368', pattern: SURF.basalt, tag: 'socket-collar' }) }   // iron-bound socket collars
    : { kind: 'ledge', w: f.w || 1.0 }));
  GROUNDS[f.id] = fill(f.poly, { y0: f.y0, top: f.top, mk: f.mk, ledgeMk: () => coping({ color: f.drown ? '#625c58' : K.basaltDk }), edge: kinds });
}
// (fix round 6: Boss Battle's island keeps the old faces — geo.js ISLAND_BOSS, no bays by the second Race's piers: the lava
// holds LOW there and the stones never rise — built as the island was, against every other floor)
const ISLAND_F = FLOORS.find((f) => f.id === 'island'), ISLAND_BOSS_F = { ...ISLAND_F, id: 'islandBoss', poly: G.ISLAND_BOSS };
{ const others = ALL.filter((g) => g !== ISLAND_F);
  GROUNDS.islandBoss = fill(G.ISLAND_BOSS, { y0: ISLAND_F.y0, top: ISLAND_F.top, mk: ISLAND_F.mk, ledgeMk: () => coping({ color: K.basaltDk }),
    edge: edgeKinds(ISLAND_BOSS_F, [...others, ISLAND_BOSS_F], (a, b) => (onNotch(a, b)
      ? { kind: 'ledge', w: 0.6, mk: () => ({ color: '#5f6368', pattern: SURF.basalt, tag: 'socket-collar' }) }
      : { kind: 'ledge', w: 1.0 })) }); }
// (the two islands are each other's variant: neither counts the other's copings)
const FIXF = [...FLOORS, ISLAND_BOSS_F], twinOf = (a, b) => (a.id === 'island' && b.id === 'islandBoss') || (a.id === 'islandBoss' && b.id === 'island');
// (lava engine: ENGINE rule 6 — no flat top in the region within 0.3 m of LOW or HIGH. A gutter coping sunk 0.2 / 0.3 m
// below a 1.2 floor where it meets a drowning ledge would stand 0.2 / 0.1 m over the HIGH surface: pale, above the rind,
// and the 0.9 one deadly at HIGH (feet under L + 0.15). Each sinks 0.1 instead (1.10, a 1.1 m hop from the ledge), or
// where it overlaps another such coping stands proud 0.2 / 0.3 (1.40 / 1.50, a kerb on the 1.2 floor; the hop there is a
// kid's, the bots use the next coping))
{
  const inR = (x, z) => G.REGION_ALL.some((Pl) => inPoly(Pl, x, z)), HI = LAVA.high;
  const fixed = [];
  const fp = (d) => { const a = (d.rotY * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), hx = d.size[0] / 2, hz = d.size[2] / 2;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => [d.center[0] + c * hx * i + s * hz * k, d.center[2] - s * hx * i + c * hz * k]); };
  const near = (A, Bd) => { const a = fp(A), b = fp(Bd); const cx = (p) => p.reduce((s, q) => s + q[0], 0) / 4, cz = (p) => p.reduce((s, q) => s + q[1], 0) / 4;
    return Math.hypot(cx(a) - cx(b), cz(a) - cz(b)) < (Math.max(A.size[0], A.size[2]) + Math.max(Bd.size[0], Bd.size[2])) / 2 + 0.05; };
  for (const f of FIXF) {
    if (f.top < HI + 0.3 || !GROUNDS[f.id]) continue;
    for (const d of GROUNDS[f.id].ledges) {
      if (d.kind !== 'obox') continue;
      const top = d.center[1] + d.size[1] / 2, y0 = d.center[1] - d.size[1] / 2;
      if (top >= f.top || Math.abs(top - HI) >= 0.3) continue;
      if (![d.center, ...fp(d).map(([x, z]) => [x, 0, z])].some((p) => inR(p[0], p[2]))) continue;
      // (the first of 1.10 / 1.40 / 1.50 no overlapping coping — nor the Bazookarp gantry at 1.3 — shares within 8 cm)
      const tops = [];
      for (const g of FIXF) { if (twinOf(f, g)) continue; for (const o of GROUNDS[g.id]?.ledges || []) if (o !== d && o.kind === 'obox' && near(o, d)) tops.push(o.center[1] + o.size[1] / 2); }
      if (d.center[0] > 5 && d.center[0] < 12 && d.center[2] > -23 && d.center[2] < -8) tops.push(1.3);
      const t2 = [f.top - 0.1, f.top + 0.2, f.top + 0.3].find((t) => tops.every((u) => Math.abs(u - t) >= 0.08)) ?? f.top - 0.1;
      d.center[1] = G.r3((y0 + t2) / 2); d.size[1] = G.r3(t2 - y0);
      fixed.push({ d, top: t2 });
    }
  }
  // (fix round 6: the south head's shelf edge keeps its 1.1 m hop — the shelf's way out — where the chamfer by race 2
  // (geo.js CHAMF2) meets it: the two copings overlap, and the colouring gave the long one 1.4, which the nav's 1.25 m jump
  // edges don't reach — the shelf's worst exit grew to 14.2 m. The long one keeps 1.1; the chamfer's stands 1.3)
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], topOf = (d) => d.center[1] + d.size[1] / 2;
  const nearL = (m, r, lo, hi) => (GROUNDS.lakefront?.ledges || []).find((d) => d.kind === 'obox' && Math.hypot(d.center[0] - m[0], d.center[2] - m[1]) < r && d.size[0] >= lo && d.size[0] <= hi);
  const longE = nearL(mid(G.SLUMP_SW, G.CHAMF2), 1.2, 3, 99), chamf = nearL(mid(G.CHAMF2, G.TIP_S[0]), 0.9, 0.5, 2.5);
  if (longE && chamf && topOf(longE) > topOf(chamf) + 0.05) {
    // (the chamfer's coping takes 1.3: clear of the 1.1 shelf edge, the tip face's 1.4 and race 1's 1.5 wedge kerb it meets)
    for (const [d, t] of [[longE, topOf(chamf)], [chamf, 1.3]]) { const y0 = d.center[1] - d.size[1] / 2; d.center[1] = G.r3((y0 + t) / 2); d.size[1] = G.r3(t - y0); }
  }
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
// (the lava fix round 3, the lead's decision: Boss Battle's own variant — HULLBREAKER needs 2.9 m from any wall and its
// home ground was the island and both causeways, cut up by the Surge Gauge's piers and the island's dressing (463 m²).
// In Boss Battle the gauge, the island's stacks, plinths and deck and the Lakefronts' dressing in its clearance ring are
// not built, so its ground is one piece over the island, both causeways and both Lakefronts. Every other mode unchanged)
const noBoss = (p) => (Array.isArray(p) ? p.flat(Infinity).map(noBoss) : { ...p, notIn: 'boss' });
const RAILS = [];   // [x0, z0, x1, z1, y, h]: every railing's line (props.js draws them; the colliders are below)
const railSeg = (a, b, y, h = 1.0, t = 0.25, o = {}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  RAILS.push([a[0], a[1], b[0], b[1], y, h]);
  return O(G.r3((a[0] + b[0]) / 2), G.r3((a[1] + b[1]) / 2), G.r3(L - 0.06), t, y, y + h, G.r3((-Math.atan2(dz, dx) * 180) / Math.PI), { rail: true, color: K.green, tag: 'rail', ...o });
};

// ---------------------------------------------------------------------------------------- the floors themselves
for (const f of FLOORS) if (!f.single && !(f.drown && HIGH_BUILD)) add(groundOf(f.id));
SINGLE.push(...noBoss(groundOf('island')), ...groundOf('islandBoss').map((p) => ({ ...p, onlyIn: 'boss' })));
// (a hidden deck slab inside the island: the environment's sea takes the stage's footprint from its deck slabs; at HIGH
// the drowned ledges are gone. Blockout only: the lava engine's `env.sea: false` (ENGINE H22) removes the sea)
SINGLE.push(B(-0.37, 0.41, -1.2, 0, -0.43, 0.39, { hidden: true, paint: false, tag: 'footprint' }));

// ---------------------------------------------------------------------------------------- mid: Gauge Island
// the Pour Floor (cast-iron plates, 1.8): the plinth under the Surge Gauge; the centre zone, the Pond, the tower's start
SINGLE.push(B(-5, 5, 1.2, 1.8, -5, 5, iron({ tag: 'pour-floor', color: '#7f8389', mural: [{ n: [0, 1, 0], id: MURAL.pourfloor }] })));
// (Boss Battle: none of the gauge — noBoss)
// the Surge Gauge: four basalt piers to 7 m (off the diagonals: the Pond is seen from all 8 directions), two tie girders
// at 6.0–6.9 m (they cut the spawn-to-spawn sightline), the upper works solid to 22 m (props.js draws them)
for (const [px, pz] of [[4.2, 1.75], [4.2, -1.75], [-4.2, 1.75], [-4.2, -1.75]]) SINGLE.push(noBoss(B(px - 0.6, px + 0.6, 1.8, 7.0, pz - 0.6, pz + 0.6, rock({ tag: 'gauge-pier', roof: true, color: K.basaltDk }))));
for (const s of [-1, 1]) SINGLE.push(noBoss(B(-4.75, 4.75, 6.0, 6.9, s * 1.75 - 0.2, s * 1.75 + 0.2, { color: K.green, pattern: PATTERN.metal, roof: true, tag: 'tie-girder' })));
const GAUGE_HIDDEN = (o) => ({ hidden: true, roof: true, paint: false, color: '#888888', tag: 'gauge-works', ...o });
SINGLE.push(...noBoss([
  B(-4.8, 4.8, 7.0, 12.0, -2.35, 2.35, GAUGE_HIDDEN()), B(-1.8, 1.8, 12.0, 17.0, -1.8, 1.8, GAUGE_HIDDEN()),
  B(-1.5, 1.5, 17.0, 18.5, -1.5, 1.5, GAUGE_HIDDEN()), B(-1.5, 1.5, 18.5, 20.5, -1.5, 1.5, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 20.5, 22.0, -1.2, 1.2, GAUGE_HIDDEN()),
  B(-1.2, 1.2, 8.0, 15.0, -2.65, -2.35, GAUGE_HIDDEN({ tag: 'gauge-board' })), B(-1.2, 1.2, 8.0, 15.0, 2.35, 2.65, GAUGE_HIDDEN({ tag: 'gauge-board' })),
]));
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
const stack = (x, z, w, d, h, base, tag, c = K.cast, o = {}) => B(G.r3(x - w / 2), G.r3(x + w / 2), base, G.r3(base + h), G.r3(z - d / 2), G.r3(z + d / 2), cover(c, { tag, ...o }));
const stack2 = (x, z, w, d, h, base, tag, c, [w2, d2, h2, ox = 0, oz = 0], o = {}) => [stack(x, z, w, d, h, base, tag, c, o), stack(x + ox, z + oz, w2, d2, h2, base + h, tag, c, o)];
const drum = (x, z, r, h, base, tag, c) => OCT(x, z, r, base, G.r3(base + h), cover(c, { tag }));
const ob = (p, w, d, y0, y1, deg, o) => O(G.r3(p[0]), G.r3(p[1]), w, d, y0, y1, G.r3(deg), o);
// a box in the Spillway arm's frame (s along the arm, t across): centre (s, t), size along s × along t
const armBox = (s, t, ls, lt, y0, y1, o) => ob(G.A(s, t), ls, lt, y0, y1, -G.AU, o);
// a box at polar (r, θ), turned to face the island (w along the arc, d along the radius)
const polBox = (r, a, w, d, y0, y1, o) => ob(P(r, a), w, d, y0, y1, -(a + 90), o);
// a box in a local frame: origin `org`, unit axis u (its length), v = u turned +90° (its depth); spans u0…u1 × v0…v1
const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return [dx / L, dz / L]; };
function frameBox(org, u, [u0, u1], [v0, v1], y0, y1, o) {
  const v = [-u[1], u[0]], cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  return O(G.r3(org[0] + u[0] * cu + v[0] * cv), G.r3(org[1] + u[1] * cu + v[1] * cv), G.r3(u1 - u0), G.r3(v1 - v0), y0, y1, G.r3((-Math.atan2(u[1], u[0]) * 180) / Math.PI), o);
}
// a mound you climb: an octagon top and eight radial ramp facets (≤ 24°)
function cone(cx, cz, rTop, yTop, rBase, yBase, tag) {
  const out = [...OCT(cx, cz, rTop, yBase, yTop, rock({ tag, color: K.scoria }))];
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 + 22.5) * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), w = 2 * rTop * Math.tan(Math.PI / 8) + 0.3;
    out.push(R([G.r3(cx + ux * rBase), yBase, G.r3(cz + uz * rBase)], [G.r3(cx + ux * rTop * 0.92), G.r3(yTop - 0.02), G.r3(cz + uz * rTop * 0.92)], G.r3(w), rock({ tag: tag + '-facet', color: K.scoria })));
  }
  return out;
}

// the causeway (10 m, the tower's track) with four lamp plinths
add(B(-G.CW, G.CW, -1.1, 1.2, G.r3(G.CAUSE_Z), -11.5, tuff({ tag: 'causeway', color: '#aaa59c' })));
// (the lava phase: the plinths 1 m in from the edges — at x ±4 they left a 0.55 m strip, no landing for the 1.2 m hop up
// from the Casting Floor beside them, and a bot escaping the rise died there; ≥ 0.8 m from the tower's lane still)
for (const [x, z] of [[3.0, -14.5], [-3.0, -14.5], [3.0, -19.5], [-3.0, -19.5]]) add(noBoss(B(x - 0.45, x + 0.45, 1.2, 2.5, z - 0.45, z + 0.45, cover(K.basaltDk, { tag: 'lamp-plinth', mural: [{ n: [1, 0, 0], id: MURAL.highmark }, { n: [-1, 0, 0], id: MURAL.highmark }] }))));
// the Organ Pipes and (at HIGH) both Pumice Races: static stand-ins at this build's level until the lava engine lands
if (BLOCKOUT_LAVA) {
  add(riderStandIns((what, o) => (what === 'stone' ? { color: K.pumice, pattern: SURF.tuff, ...o }
    : what === 'organ-stub' ? { color: K.basaltDk, pattern: SURF.basalt, roof: true, ...o }
      : { color: '#53575e', pattern: SURF.basalt, ...o })));
}
// mid is not a flat plaza: round the Pour Floor's 1.8 m plinth, the gauge's west foundation (Bravo's east one is its
// turn) is a raised basalt deck at 2.4 with the float-well's machine house on it; the Organ cluster beside Alpha's
// causeway with its column stumps (1.8 / 2.1 / 2.4); cover in every quarter. All clear of the tower lane (|x| ≤ 2.25)
// and of the Pond's 8 sightlines (the 7 m viewpoints). The island's west face (r 16.2) is the second Race's landing:
// 4 m of floor between it and the deck, the machine house and a stump beside it
const DECK = { x0: -12.0, x1: -5.4, z0: -0.6, z1: 6.6 };
add(noBoss(B(DECK.x0, DECK.x1, 1.2, 2.4, DECK.z0, DECK.z1, { color: '#7b7e84', pattern: PATTERN.yard, tag: 'gauge-deck', mural: [{ n: [0, 0, -1], id: MURAL.warning }] })));
add(noBoss(R([-8.7, 1.2, 9.3], [-8.7, 2.4, DECK.z1], 4, steps({ tag: 'deck-stair' }))));             // up from the island's NW toward Bravo's causeway
add(noBoss(B(-12.0, -9.0, 2.4, 4.6, 2.6, 6.6, white({ tag: 'gauge-machine-house', color: '#dcd6c8' }))));
add(noBoss(B(-6.9, DECK.x1, 2.4, 3.4, DECK.z0, DECK.z0 + 1.2, cover(K.ironDk, { tag: 'valve-chest' }))));
// (fix round 8, review 8: the stump by the second Race's landing stood 0.3 m off the island's lava edge, so the corner past it
// — the coping between it and race 7 — was a dead end 18.7 m round on foot, and a running jump steered off it onto race 7
// saved 14.5–15 m. 0.6 m nearer the deck and 0.1 m slimmer, a 1.2 m walk opens past it to the pier)
for (const [x, z, r, top] of [[-6.4, -8.6, 0.9, 2.1], [-12.3, -2.7, 0.8, 2.4], [-7.0, -3.6, 0.8, 1.8]]) add(noBoss(OCT(x, z, r, 1.2, top, rock({ tag: 'organ-stump', color: K.basaltDk }))));
add(noBoss([stack(2.9, -9.3, 1.2, 1.2, 1.1, 1.2, 'ingot-stack', K.cast, { paint: false }), drum(7.6, -6.3, 1.0, 1.4, 1.2, 'stilling-drum', '#5d6268'), stack(11.6, 0.8, 1.4, 1.8, 1.4, 1.2, 'ladle-stand', K.ironDk)]));

// ---------------------------------------------------------------------------------------- Alpha's base: the gallery
// the spawn gallery (4.8): the Casting Hall's gable balcony, open to the sky. Pad (−17, 4.8, −62.5). Three exits: the
// Gallery Stair (forward) and a side stair onto each side yard; works-green balustrades (rail) between them
const GX = G.PADX, GZ1 = G.GAL.z1, SWZ = G.PADZ + 1.5, SEZ = G.PADZ + 4.9;   // the side stairs' z (west, east)
add(R([GX, 3.6, GZ1 + 2.7], [GX, 4.8, GZ1], 8, steps({ tag: 'gallery-stair' })));
add(R([G.GAL.x0 - 2.7, 3.6, SWZ], [G.GAL.x0, 4.8, SWZ], 3, steps({ tag: 'gallery-side-stair' })));
add(R([G.GAL.x1 + 2.7, 3.6, SEZ], [G.GAL.x1, 4.8, SEZ], 3, steps({ tag: 'gallery-side-stair' })));
add(railSeg([G.GAL.x0, GZ1 + 0.1], [GX - 4, GZ1 + 0.1], 4.8), railSeg([GX + 4, GZ1 + 0.1], [G.GAL.x1, GZ1 + 0.1], 4.8));
add(railSeg([G.GAL.x0 + 0.1, G.GAL.z0], [G.GAL.x0 + 0.1, SWZ - 1.5], 4.8), railSeg([G.GAL.x0 + 0.1, SWZ + 1.5], [G.GAL.x0 + 0.1, GZ1], 4.8));
add(railSeg([G.GAL.x1 - 0.1, G.GAL.z0], [G.GAL.x1 - 0.1, SEZ - 1.5], 4.8), railSeg([G.GAL.x1 - 0.1, SEZ + 1.5], [G.GAL.x1 - 0.1, GZ1], 4.8));
for (const x of [GX - 4.75, GX + 4.75]) add(B(x - 0.4, x + 0.4, 4.8, 6.0, GZ1 - 1.4, GZ1 - 0.6, cover(K.green, { tag: 'gallery-lamp' })));
for (const [x, z] of [[G.GAL.x0 + 1.6, GZ1 - 1.9], [G.GAL.x1 - 1.6, G.GAL.z0 + 2.6], [G.GAL.x0 + 1.6, G.GAL.z0 + 1.6]]) add(stack(x, z, 1.2, 1.2, 1.1, 4.8, 'urn', '#8a7f72'));

// ---------------------------------------------------------------------------------------- the Yard (3.6)
// a 39 m works leaning west. Three lanes from the gallery to the yard front, split by two lines of castings stacked for
// the ferry (2 m walls, one 3 m gap each, so the lanes read from above): the west lane past the weighbridge pit and the
// Surge Office to the Rim Head; the centre lane from the Gallery Stair to the Upper Surge Steps (the Gate stands in it,
// a level below the gallery); the east strip from the east side stair along the bay's cheek to the Bay Stair
{ // the weighbridge pit (3.0, cut out of the yard): its ramp off its south side into the west side yard, 0.6 m steps elsewhere
  const P_ = G.PIT, xc = (P_.x0 + P_.x1) / 2;
  add(B(P_.x0, P_.x1, 0.45, 3.0, P_.z0, P_.z1, iron({ tag: 'weighbridge', color: '#73787d' })));
  add(R([xc, 3.0, P_.z0], [xc, 3.6, P_.z0 - 2.4], 3.2, iron({ tag: 'pit-ramp', pattern: PATTERN.rampboard }))); }
// the Surge Office (and weigh-house): two storeys of whitewashed basalt against the west wall, its south face the pit's
// north side (props.js: its roof; the Surge Board on its east face, toward the yard)
export const OFFICE = { x0: -38.3, x1: -31.3, z0: G.PIT.z1, z1: G.PIT.z1 + 7.0 };
add(B(OFFICE.x0, OFFICE.x1, 3.6, 9.5, OFFICE.z0, OFFICE.z1, white({ tag: 'surge-office', mural: [{ n: [1, 0, 0], id: MURAL.stencils }] })));
// the lines of castings stacked for the ferry: two walls of castings (2.2–2.4 m: nobody climbs or sees over them) that
// split the yard into its three lanes, each from the gallery's front to the tower's yard lane (z −45 ± 1.75). The east
// line stands against the Gallery Stair's east side (x −12.4), clear of the tower's climb lane at x −9 (± 1.75): broken
// only where the tower crosses, it goes on to within 1.5 m of the yard-front rail. The west line stands off the
// gallery's NW corner (x −27.7) and stops at the tower's lane: north of it the moulding floor's rack carries the line on,
// leaving the west lane's mouth at the Rim Head's foot in sight of the gallery (Bazookarp: every way into the Gate's
// 15 m ring is seen from the deck)
const LANE_Z = [-46.75, -43.25];   // the tower's yard run (z −45: platform ± 1.25 and 0.5 m clear)
const castWall = (x, z0, z1, h, tag, c, o = {}) => B(G.r3(x - 0.6), G.r3(x + 0.6), 3.6, G.r3(3.6 + h), G.r3(z0), G.r3(z1), cover(c, { tag, ...o }));
add(castWall(-27.7, G.GAL.z1, LANE_Z[0], 2.4, 'ferry-castings', K.cast));
add(castWall(-12.4, G.GAL.z1, LANE_Z[0], 2.3, 'ferry-castings', '#5f6a63', { mural: [{ n: [1, 0, 0], id: MURAL.highmark }] }), castWall(-12.4, LANE_Z[1], -40.85, 2.4, 'ferry-castings', '#5f6a63'));
// the Gate's apron (Bazookarp: blocks ≥ 1.2 m within 4 m of route 1 between the gallery and the Gate): the centre lane's
// cluster, two stepped stacks (1.8 and 1.9 m to the top)
add(stack2(-20.6, -49.4, 1.6, 1.2, 1.3, 3.6, 'drain-grates', '#56606a', [1.0, 0.8, 0.5, 0, 0]), stack2(-14.6, -48.7, 1.6, 1.4, 1.3, 3.6, 'ingot-rack', K.cast, [1.1, 0.9, 0.6, 0.1, 0], { paint: false }));
// the west side yard's cluster: the bay of patterns south of the gallery's west side stair (2.0 m, filling the dead end
// between the stair, the gallery and the hall) and the drum stack
add(B(-30.6, G.GAL.x0, 3.6, 5.6, G.GAL.z0, SWZ - 1.5, cover('#6a6258', { tag: 'pattern-bay' })), drum(-36.0, -59.8, 0.85, 1.3, 3.6, 'drum-stack', '#56606a'));
// the cupola house: the furnace's shed filling the dead end of the east side yard behind the east side stair (its stack
// and the hood above, props.js)
add(B(G.GAL.x1, 0.6, 3.6, 9.4, G.GAL.z0, G.PADZ + 1.0, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'cupola-house', mural: [{ n: [0, 0, 1], id: MURAL.gable }] }));
add(OCT(-3.2, -64.3, 1.0, 9.4, 15.0, { color: '#4b4f55', pattern: PATTERN.metal, roof: true, tag: 'cupola-stack' }));
// the east lane's cluster, against the head's cheek half-way to the Bay Stair: a ladle stand (1.8) and a cable drum
{ const u = unit(G.LC, [-4.6, -53.5]);
  add(frameBox(G.LC, u, [2.6, 4.4], [-1.95, -0.1], 3.6, 5.4, cover(K.ironDk, { tag: 'ladle-stand' }))); }
add(drum(-7.6, -48.6, 0.8, 1.3, 3.6, 'cable-drum', K.ironDk));
// the yard's front band, the west lane's end: the moulding floor (a 0.6 m dais of sand moulds against the west line, west of
// the Upper Surge Steps' landing) with a lamp-post rack (2.2 m over the yard) and flasks on it, and an ingot pile beside
// it — the front's cluster, clear of the tower's run (z ≥ −43.25) and of the steps' landing (x ≤ −19.8)
add(B(-27.1, -22.4, 3.6, 4.2, -42.7, -40.5, { color: K.sand, pattern: SURF.tuff, tag: 'moulding-floor' }));
add(B(-26.9, -25.5, 3.6, 5.8, -42.5, -40.7, cover(K.ironDk, { tag: 'lamp-post-rack' })), B(-23.6, -22.6, 3.6, 5.2, -42.3, -41.2, cover('#6b5f55', { tag: 'flask-stack', paint: false })));
add(stack(-21.0, -42.2, 1.2, 1.4, 1.2, 3.6, 'ingot-pile', K.cast, { paint: false }));
// the yard front: a railing on the spiral (squids pass), open at the Bay Stair, the Upper Surge Steps and the tower's climb;
// none east of the Bay Stair, where the Firebrick Store (on the terrace below, 2.3 m over the yard) closes the yard's tip
{ const gaps = [[G.ST_CUPOLA.a[0], G.TL + 0.6], G.ST_UPPER.a, G.CHORD_Y.a];
  const runs = []; let a0 = G.TL - 0.6;
  for (const [lo, hi] of gaps.slice().sort((p, q) => q[1] - p[1])) { runs.push([a0, hi + 0.4]); a0 = lo - 0.4; }
  runs.push([a0, G.TW + 0.5]);
  for (const [r0, r1] of runs) { if (r0 - r1 < 0.8) continue; const pts = G.sarcF((a) => G.RY(a) + 0.125, r0, r1, [], 3); for (let i = 0; i + 1 < pts.length; i++) add(railSeg(pts[i], pts[i + 1], 3.6)); } }

// ---------------------------------------------------------------------------------------- the Rim Head (4.2)
// the comma's root: natural rock 0.6 over the yard, the defenders' crest over the Moorings and the Slump. The Crest Stair
// up its face from the terrace (1.8); a spatter cone, outcrops and a cairn
{ const t = P(44.0, G.TW), u = [-Math.sin(G.TW * G.D), Math.cos(G.TW * G.D)];
  add(R([G.r3(t[0] + u[0] * 4.1), 2.4, G.r3(t[1] + u[1] * 4.1)], [t[0], 4.2, t[1]], 3, steps({ tag: 'crest-stair' }))); }
add(cone(-32.5, -30.5, 1.2, 5.1, 3.2, 4.2, 'spatter-cone'));
add(stack(-29.0, -24.5, 1.6, 1.4, 1.3, 4.2, 'outcrop', K.basaltDk), stack(-35.4, -37.0, 1.4, 1.6, 1.3, 4.2, 'outcrop', K.basaltDk),
  stack(-29.2, -35.6, 1.2, 1.2, 1.2, 4.2, 'cairn', K.basaltDk), stack(-25.6, -29.6, 1.2, 1.2, 1.2, 4.2, 'cairn', K.basaltDk));

// ---------------------------------------------------------------------------------------- the Moulding Terrace (2.4)
add(stairOn(G.ST_UPPER, 2.7, 2.4, 3.6, 4.8, steps({ tag: 'upper-surge-steps' })));
add(stairOn(G.ST_CUPOLA, 2.7, 2.4, 3.6, 2.4, steps({ tag: 'bay-stair' })));
add(stairOn(G.ST_LOWER, 2.7, 1.2, 2.4, 6.1, steps({ tag: 'lower-surge-steps' })));
add(stairOn(G.ST_EAST, 2.7, 1.2, 2.4, 2.2, steps({ tag: 'east-steps' })));
// the terrace parapet (solid basalt, whitewashed coping, 0.9: cover) on the terrace-front spiral, open at the stairs;
// west of θ −106 the face is open (a hop onto the Lakefront, a step onto the Moorings)
{ const gaps = [G.ST_EAST.a, G.ST_LOWER.a];
  const runs = []; let a0 = G.TQ - 0.4;
  for (const [lo, hi] of gaps.slice().sort((p, q) => q[1] - p[1])) { runs.push([a0, hi + 0.5]); a0 = lo - 0.5; }
  runs.push([a0, -106]);
  for (const [r0, r1] of runs) if (r0 - r1 > 1) add(segsAlong(G.sarcF((a) => G.RT(a) + 0.25, r0, r1, [], 3), 0.5, 2.4, 3.3, { color: '#7a7d82', pattern: SURF.basalt, roof: true, tag: 'terrace-parapet' })); }
// (fix round 8, rule 44 steered off every take-off — the lead after review 8) a parapet along the Ladle Road's lake corner by the
// second Race (its west face and the first 1.6 m of its north face, on the coping; 1.0 m over the road: cover): a running
// jump north off that corner, steered 45–60° left in the air, came down on race 7 saving 16.3 m of the walk round by the
// horn. The road's lake view stays over the parapet
add(noBoss(segsAlong([[-20.22, 8.92], [-20.4, 8.22], [-20.74, 7.34], [-21.03, 6.44], [-21.5, 6.14], [-22.12, 6.02]], 0.5, 2.4, 3.4, { color: '#5f5a55', pattern: SURF.basalt, roof: true, tag: 'ladle-parapet' })));   // (Boss Battle holds the lava LOW: as it was)
// the terrace's masses, all clear of the tower's terrace climb (x −19.5 ± 1.75 off the Moorings), its run (z −34 ± 1.75)
// and its yard climb (x −9 ± 1.75), and of every stair's landing:
// - the west end: the Pattern Shop, a weatherboard shed built against the Rim Head's face between the Moorings' corner and
//   the Crest Stair (3 m: its roof 1.2 m over the Rim Head; a lower porch in front, 2.2 m), so the west end splits into
//   the tower's lane along the Moorings' edge and a lane along the yard face to the Crest Stair; a sand bin closes the
//   dead sliver between the Crest Stair's foot and the yard face
// - the middle: the raised casting bed (0.6) in the bay between the Upper Surge Steps and the tower's yard climb, a flask
//   stack and pattern crates on it
// - the bay end: the Firebrick Store (3.5 m), the brick store against the Bay Stair's east side on the yard face, closing
//   the yard's dead tip behind the rail (it stands 2.3 m over the yard: the Bay Stair's landing has its cover)
{ const ur = [Math.cos(G.TW * G.D), Math.sin(G.TW * G.D)];   // along the Rim Head's face (outward); v into the terrace
  add(frameBox([0, 0], ur, [38.6, 42.5], [0, 1.7], 2.4, 5.4, { color: K.wood, pattern: PATTERN.planks, roof: true, tag: 'pattern-shop' }),
    frameBox([0, 0], ur, [40.4, 42.5], [1.7, 2.6], 2.4, 4.6, { color: '#8a6e50', pattern: PATTERN.planks, roof: true, tag: 'pattern-shop-porch' }),
    frameBox([0, 0], ur, [45.5, 46.2], [0, 4.11], 2.4, 3.7, cover(K.sand, { tag: 'sand-bin' })),
    // (the lava phase's fix for the last review's bot snag at the Crest Stair's foot: the bin runs on along the stair's
    // side to its foot, closing the triangle between the stair, the bin and the yard face — bots no longer try the
    // stair → yard hop across it — and a sand box squares off the wedge in front of the foot's yard-face corner)
    frameBox([0, 0], ur, [45.0, 46.2], [4.11, 5.4], 2.4, 3.7, cover(K.sand, { tag: 'sand-bin' }))); }
add(B(-14.3, -11.05, 2.4, 3.0, -39.05, -36.95, { color: K.sand, pattern: SURF.tuff, tag: 'casting-bed' }));
add(B(-14.15, -12.95, 2.4, 4.0, -37.95, -37.05, cover('#6b5f55', { tag: 'flask-stack', paint: false })), B(-12.3, -11.3, 3.0, 3.9, -38.8, -37.6, cover(K.wood, { tag: 'pattern-crates', paint: false })));
{ const c = G.ST_CUPOLA, u = unit(c.pts[0], c.pts[1]), e = [c.mid[0] + u[0] * 1.2, c.mid[1] + u[1] * 1.2];   // the stair's top east corner
  add(frameBox(e, u, [0.02, 3.25], [-0.05, 2.3], 2.4, 5.9, { color: K.brick, pattern: PATTERN.brick, roof: true, tag: 'firebrick-store' })); }

// ---------------------------------------------------------------------------------------- the Lakefront (1.2), the Moorings (1.8)
add(noBoss(ob([-7.8, -23.4], 2.4, 0.6, 1.2, 3.4, 0, cover('#e6dfcd', { tag: 'tide-board', mural: [{ n: [0, 0, 1], id: MURAL.tideboard }, { n: [0, 0, -1], id: MURAL.tideboard }] }))));   // the Tide Board by the causeway's foot, clear of the tower's run and the weir's room
add(noBoss(stack(-4.0, -23.2, 1.0, 1.0, 1.1, 1.2, 'mooring-bollard', K.ironDk)));
// the Lakefront east of the causeway: a ladle cradle (1.6) at the terrace face's foot, between the weir's 3 m room and
// the East Steps' west side
add(noBoss(polBox(G.RT(-75.95) - 0.52, -75.95, 1.3, 1.0, 1.2, 2.8, cover(K.ironDk, { tag: 'ladle-cradle' }))));
// and a chain bin at the face's foot beside the Lower Surge Steps (3.3 m from the weir)
add(stack(1.8, -29.3, 1.0, 0.8, 1.1, 1.2, 'chain-bin', '#4f5a52', { paint: false, mural: [{ n: [0, 0, 1], id: MURAL.warning }] }));
// the Moorings (the side zone): the capstan, a chain bollard (off the tower's climb lane, x ≥ −17.75), the spare-stone
// crate and a mooring bollard on its lake edge (north of the tower's run, z ≥ −24.25). Their colliders start 0.2 m down
// in the Moorings' deck (1.6): the same on screen and to every player, and the cover rule's Lakefront-level measure
// (bare.mjs reads the Moorings at 1.2) sees them as the pieces they are
add(noBoss([stack(-14.4, -29.8, 1.4, 1.2, 1.5, 1.6, 'capstan', '#4f5a52'), stack(-17.2, -28.6, 1.0, 1.0, 1.2, 1.6, 'chain-bollard', K.ironDk),
  stack(-22.7, -26.6, 1.2, 1.2, 1.2, 1.6, 'stone-crate', K.pumice, { paint: false }), stack(-13.6, -23.4, 1.0, 0.9, 1.3, 1.6, 'mooring-bollard', K.ironDk)]));
// the south Slump head: a chain bollard back from the Race's landing; the winch house against the Rim Head's face
{ const [x, z] = G.sp(G.S0, -2.4, -1.4); add(O(x, z, 1.0, 1.0, 1.2, 2.3, 19, cover(K.ironDk, { tag: 'chain-bollard' }))); }
{ const [x, z] = P(30.4, -139.5); add(O(x, z, 2.4, 2.4, 1.2, 4.0, 139.5, white({ tag: 'winch-house', mural: [{ n: [-0.7604, 0, -0.6494], id: MURAL.pumice }, { n: [0.7604, 0, 0.6494], id: MURAL.pumice }, { n: [0.6494, 0, -0.7604], id: MURAL.pumice }, { n: [-0.6494, 0, 0.7604], id: MURAL.pumice }, { n: [1, 0, 0], id: MURAL.pumice }] }))); }

// ---------------------------------------------------------------------------------------- the Casting Floor (0, LOW only)
add(stack(12.0, -18.4, 1.4, 1.4, 1.8, 0, 'mould-stack', K.ironDk, { paint: false }), stack(14.0, -13.6, 1.6, 1.6, 2.0, 0, 'ladle-stand', K.ironDk));

// ---------------------------------------------------------------------------------------- the Spillway
// the Spillway Bridge (deck 2.3: 0.1 under the banks it bears on, underside 1.95): square across the arm's throat at the
// mouth from Alpha's quay to Bravo's horn, 5.5 m wide, 9 m bank to bank; works-green girders (rail) both sides
{ const [s0, s1] = G.BR_S, w = s1 - s0;
  add(armBox((s0 + s1) / 2, 0, w, 2 * G.AW + 1.0, 1.95, 2.3, iron({ tag: 'spillway-bridge', color: '#56685e' })));
  for (const s of [s0 + 0.125, s1 - 0.125]) add(railSeg(G.A(s, -G.AW + 0.15), G.A(s, G.AW - 0.15), 2.3));
  add(noBoss(armBox((s0 + s1) / 2, -1.6, 1.0, 1.2, 2.3, 3.4, cover(K.ironDk, { tag: 'slag-pot' })))); }   // a slag pot on the deck (cover; 2.4 m lanes beside it)
// the Gauge Post (Bravo's, on its horn's point beside the bridge's landing; Alpha's is its turn at the NW): a squat
// basalt blockhouse whose flat roof (3.6) is a hop from the horn — a lookout over the other works' bay and quay — with a
// parapet on its outer sides
add(armBox(8.9, 8.2, 2.8, 2.6, 2.4, 3.6, rock({ tag: 'gauge-post', color: '#8d8a84', mural: [{ n: [0.2079, 0, -0.9781], id: MURAL.spillway }, { n: [-0.9781, 0, -0.2079], id: MURAL.spillway }, { n: [-1, 0, 0], id: MURAL.spillway }] })));
add(armBox(10.15, 8.2, 0.3, 2.6, 3.6, 4.5, cover(K.basaltDk, { tag: 'gauge-post-parapet' })), armBox(8.9, 9.35, 2.8, 0.3, 3.6, 4.6, cover(K.basaltDk, { tag: 'gauge-post-parapet' })));
// the horn (Bravo's in the SE): a cairn behind the Horn Step
add(armBox(-2.4, 9.4, 1.2, 1.2, 2.4, 3.6, cover(K.basaltDk, { tag: 'cairn' })));

// ---------------------------------------------------------------------------------------- the Slump and Alpha's tail
// the Slump shelf: two hornitos against the cliff (1.3 m: cover from the island and the heads), each leaving ≥ 2.6 m.
// (fix round 9, review 9 issue 2: the middle one 0.64 m south along the cliff, −157° → −155.8°: at HIGH a kid held on it is
// rescued to the south head's node (∓23.5, 1.1, ∓15.5), and from its far corner that was 6.35 m — over the rescue's 6 m)
for (const a of [-155.8, -167.0]) { const r = G.SHO(a) - 0.75, [x, z] = P(r, a); add(O(x, z, 1.4, 1.4, 0, 1.3, -a, cover(K.scoria, { tag: 'slump-hornito' }))); }
// the north Slump head: a mooring bollard back from both Races' landings
{ const [x, z] = P(26.6, 178.5); add(O(x, z, 1.0, 1.2, 1.2, 2.3, -178.5, cover(K.ironDk, { tag: 'race-bollard' }))); }
// the Race kerbs (the lava fix round 5, the lead's decision after review 5 — ENGINE rule 21: every gap beside a rider is a
// seam ≤ 0.3 m or ≥ 2.5 m of open lava). Three notches per half stood 0.7–2.4 m wide beside the Pumice stones at HIGH, and
// a foot walking or swimming off the stone dropped into them: race 1's west side by the south head's wedge (1.0–1.3 m) and
// its south-east corner past the end of the head's tip coping (0.7 m), race 5's west side by the north head's wedge
// (0.95–1.25 m), race 6's north-west corner under the rim's curve (2.4 m). Each is closed by a kerb — a coping in its
// stone's own frame (x across the Race, toward the island; z along it, toward the north head; the stone ±w/2 × ±d/2), its
// face 0.2 m from the stone (a seam the stone rises and sinks past) and into the bank behind. Beside races 1 and 5 the kerb
// runs on along the stone, in the strip between it and the shelf's lake edge, to 0.2 m from the next stone's end (races 2
// and 4 stand 0.9 m further west: a kerb stopping at the wedge left a 1.4–1.9 m notch there instead). Tops 0.1 off the
// copings each one overlaps (1.5 in the heads' wedges, over their 1.1–1.4 copings; 1.2 along the strips; the stone's HIGH 1.25)
const raceKerb = ([sx, sz], yaw, [x0, x1], [z0, z1], top, tag = 'race-kerb') => {
  const a = (yaw * Math.PI) / 180, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return O(G.r3(sx + Math.cos(a) * cx + Math.sin(a) * cz), G.r3(sz - Math.sin(a) * cx + Math.cos(a) * cz), G.r3(x1 - x0), G.r3(z1 - z0), -1.1, top, yaw, coping({ tag }));
};
{ const [r1, r2, r4, r5, r6] = [G.STONES[0], G.STONES[1], G.STONES[3], G.STONES[4], G.STONES2[0]], SEAM = 0.2, Y = G.STONE_YAW;
  // (the next stone's end in this stone's frame: race 2's south end over race 1, race 4's north end under race 5)
  const endIn = (st, o, s) => { const a = (Y * Math.PI) / 180, dx = o[0] - st[0], dz = o[1] - st[1]; return dx * Math.sin(a) + dz * Math.cos(a) + (s * o[3]) / 2; };
  const w1 = -r1[2] / 2 - SEAM, w5 = -r5[2] / 2 - SEAM;
  add(raceKerb(r1, Y, [-2.35, w1], [-1.95, -0.4], 1.5),                                  // race 1, west: the south head's wedge out to the stone
    raceKerb(r1, Y, [-2.15, w1], [-0.4, endIn(r1, r2, -1) - SEAM], 1.2),                 //   and on along it, short of the shelf's edge, to race 2
    raceKerb(r1, Y, [0.85, 1.65], [-2.0, -r1[3] / 2 - SEAM], 1.2),                       //   south-east: the head's corner past its tip coping
    raceKerb(r5, Y, [-2.4, w5], [0, 1.95], 1.5),                                          // race 5, west: the north head's wedge out to the stone
    raceKerb(r5, Y, [-2.15, w5], [endIn(r5, r4, 1) + SEAM, 0], 1.2)); void r6; }           //   and on along it to race 4
// (fix round 6: race 6's kerb north of its west end is gone with the head's corner there — geo.js CUT6: the rim's curve
// that left a notch beside the stone is now open lava, 2.2 m out along the Race's line, the Ladle Road's face beyond it)
// the tail (Alpha's, the NW; drawn here in Alpha's frame): the Ladle Road's vent hood and ladle stand, two scree ramps up
// the Rim Ridge's face, and on the Ridge a spatter cone, a hummock, outcrops and cairns
// (fix round 6: the vent hood 2.5° on round the Road (r 23.4, θ 160.0): with the Road's corner bitten back by race 6
// — geo.js BITE6 — it closed the lane past it, and the corner behind it was a pocket the nav reached only round the hood)
{ const [x, z] = P(23.4, 160.0); add(O(x, z, 1.4, 1.4, 2.4, 3.8, -160.0, cover(K.ironDk, { tag: 'vent-hood' }))); }
{ const [x, z] = P(24.6, 152.0); add(O(x, z, 1.4, 1.8, 2.4, 3.7, -152.0, cover(K.ironDk, { tag: 'ladle-stand' }))); }
for (const a of [165.5, 154.5]) { const lo = P(G.RN - 2.75, a), hi = P(G.RN + 0.05, a); add(R([lo[0], 2.4, lo[1]], [hi[0], 3.6, hi[1]], 3, rock({ tag: 'scree-ramp', color: K.scoria, pattern: SURF.basalt }))); }
add(cone(-32.0, 1.6, 1.2, 4.5, 3.2, 3.6, 'spatter-cone'), cone(-27.2, 15.0, 0.8, 4.2, 2.1, 3.6, 'hummock'));
{ for (const [r, a, w, d, h, tag] of [[31.6, 168.0, 1.4, 1.6, 1.3, 'outcrop'], [32.8, 158.0, 1.2, 1.2, 1.2, 'cairn'], [33.0, -178.5, 1.2, 1.4, 1.2, 'cairn']]) {
  const [x, z] = P(r, a); add(O(x, z, w, d, 3.6, 3.6 + h, -a, cover(K.basaltDk, { tag }))); } }

// ---------------------------------------------------------------------------------------- the edges
add(EDGE_WALLS.flatMap((x) => x.w.blocks));
add(HALL_W.flatMap((w) => w.blocks));

// ---------------------------------------------------------------------------------------- Bazookarp only
// the Ladle Gantry: the second route to the weir at HIGH, when the Casting Floor is under lava (Lakefront east → the
// island's south face over the Casting Floor). 1.3 (0.1 over the Lakefront and the island it rests on); chain rails on
// both sides. Nothing stands on its landing: the mould stack is west of it, the ladle stand east, the Lakefront clear
add(B(7, 10, -1.1, 1.3, -21.4, -9.6, iron({ tag: 'ladle-gantry', color: '#56685e', onlyIn: 'bazookarp' })));
add({ ...railSeg([6.875, -20.6], [6.875, -11.4], 1.3), onlyIn: 'bazookarp' }, { ...railSeg([10.125, -19.8], [10.125, -10.4], 1.3), onlyIn: 'bazookarp' });
RAILS.length -= 2;   // (the gantry's chain rails are drawn only in its own world: props.js reads GANTRY_RAILS)
export const GANTRY_RAILS = [[6.875, -20.6, 6.875, -11.4, 1.3, 1.0], [10.125, -19.8, 10.125, -10.4, 1.3, 1.0]];
// the outline alone (OUTLINE_ONLY): floors, tiers, walls, crossings and riders — for the lead's shape sign-off shots
const OUTLINE_TAG = /^(island|gallery|yard|rim-head|terrace|lakefront|moorings|casting-floor|slump-shelf|north-head|horn-step|ladle-road|rim-ridge|coping|socket-collar|footprint|pour-floor|causeway|weighbridge|spillway-bridge|organ|race|caldera-wall|casting-hall)/;
if (OUTLINE_ONLY) { for (const L of [HALF, SINGLE]) { const keep = L.filter((b) => OUTLINE_TAG.test(b.tag || '')); L.length = 0; L.push(...keep); } RAILS.length = 0; }
export { RAILS };
// the drawn caldera walls (props.js caldera_walls): every hidden wall O-box of Alpha's half (the builder draws the turn)
export const WALL_BOXES = EDGE_WALLS.filter((x) => !x.e.cliff).flatMap((x) => x.w.blocks).map((b) => [b.center[0], b.center[1], b.center[2], b.size[0], b.size[1], b.size[2], b.rotY]);

// ============================================================================================================ modes
// Zone Control: the Pour Floor (centre, 94 m² net of the piers) and the Pumice Moorings (Alpha's side, 95 m², 36 m from its pad
// and 31 m from the centre; Bravo's turned)
const ZONES = {
  center: [{ poly: [[-5, -5], [5, -5], [5, 5], [-5, 5]], y0: 1.7, y1: 2.0 }],
  side: { poly: G.MOORINGS.map(([x, z]) => [G.r3(x), G.r3(z)]), y0: 1.7, y1: 2.0 },          // the whole Moorings top (95 m²)
};
// Tower Command: "the tower rides the ladle rail" (Alpha's attack, drawn on Bravo's half): down Bravo's causeway, west
// along its Lakefront (a 0.6 step onto the Moorings, square to the run), up the terrace face off the Moorings, east along
// the terrace, up the yard face beside the Bay Stair, west across the yard's front and north to the end-stop 12.6 m short
// of Bravo's pad. Straight runs, square corners, 97 m, three checkpoints (1.62 m/s at one rider), nothing overhead.
const TWB = G.TW_X.map((v) => -v);   // the climbs' x on Bravo's half
const TOWER = {
  path: [[0, 1.8, 0], [0, 26], [TWB[0], 26], [TWB[0], 34], [TWB[1], 34], [TWB[1], 45], [24, 45], [24, 52]],
  checkpoints: [[0, 23.5], [16.5, 34], [11, 45]],
};
// Bazookarp (bazookarp/SPEC.md §4.1: Alpha's attack on Bravo's half; the engine mirrors it)
const GAL_B = G.GALLERY.map(([x, z]) => [-x, -z]);
const BAZOOKARP = {
  start: [0, 1.8, 0],                                  // the Pond on the Pour Floor, under the Surge Gauge
  weirs: [{ at: [-3, 1.2, 25.5] }],                    // Bravo's Lakefront at its causeway's foot, west of the axis (posts ±2.7)
  gate: { at: [18, 3.6, 50] },                         // Bravo's yard, in the centre lane, a level below the gallery
  freeZones: [{ poly: GAL_B, y0: 4.6, y1: 6.5,         // Bravo's gallery; a sign at each of its three stairs
    signs: [[-G.PADX, -(G.GAL.z1 - 0.4), 0], [-(G.GAL.x0 - 0.4), -(G.PADZ + 1.5), 90], [-(G.GAL.x1 + 0.4), -(G.PADZ + 4.9), -90]] }],
  routes: {
    causeway: [[0, 12], [0, 22], [-3, 25.5], [2.5, 28.2], [2.5, 31.5], [16.8, 36.7], [16.8, 40.2], [18, 50]],     // Lower + Upper Surge Steps
    castingFloor: [[-7, 14], [-7, 20.5], [-3, 25.5]],                                                   // LOW only
    gantry: [[-8.5, 10], [-8.5, 20.6], [-3, 25.5]],                                                     // the Ladle Gantry (bazookarp only)
    east: [[-3, 25.5], [-8.6, 24.2], [-8.6, 28.5], [-3, 33.5], [4.8, 35.2], [5.5, 38.6], [18, 50]],      // East Steps → Bay Stair
  },
  // (the lava fix round 5, the lead's decision after review 5) the carrier field never relies on a jump over the lava: every
  // hop / gap edge the field would add across it (karpVeto.js; lava-karp.js K8 keeps the list whole); and the edges Bazookarp
  // checker #16 found no carrying kid makes (as built and at LOW: the Organs' LOW-pose tops to their own HIGH-pose tops)
  hopVeto: [...KARP_VETO, ...KARP_VETO_16],
};

// ============================================================================================================ the layout
const LAYOUT_CALDERA = {
  id: 'caldera',
  bounds: { minX: -44, maxX: 44, minZ: -76, maxZ: 76 },
  spawnPads: [[G.PAD[0], 4.8, G.PAD[1]], [-G.PAD[0], 4.8, -G.PAD[1]]],
  spawnBarrier: 4.2,
  intro: { from: [40, 26, -40], lookFrom: [0, 8, 0], toBack: 3.2 },
  art: { from: [-42, 17, -54], look: [4, 7.5, 4], fov: 58 },
  env: {
    backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false,
    sea: false,                 // ENGINE H22: no sea mesh (the backdrop draws the far ocean far below); the death plane stays
    stars: true,
    theme: {
      all:    { fog: [45, 950], haze: [1 / 2800, 0.7, 340] },
      day:    {
        zenith: '#2475e2', skyMid: '#68b2f8', horizon: '#ebf4fc',
        sunIntensity: 4.4, skySun: 3.5,
        hemiIntensity: 0.70, hemiSky: '#c8e2ff', hemiGround: '#d8bca0', hemiGroundK: 2.3, envK: 0.54,
        grade: { uExposure: 1.16, uSat: 1.06, uContrast: 1.04 },
      },
      sunset: {
        sunIntensity: 5.4, skySun: 4.4,
        hemiIntensity: 1.15, hemiSky: '#a498d4', hemiGround: '#df9866', envK: 0.60,
        zenith: '#282f6e', skyMid: '#8265a8', horizon: '#ffa668',
        grade: { uExposure: 1.34, uSat: 1.06, uContrast: 1.05, bloom: [0.65, 0.45, 1.2] },
      },
    },
  },
  lava: LAVA,
  zones: ZONES,
  tower: TOWER,
  bazookarp: BAZOOKARP,
  // (the lava fix round 2: headroom — the Surge Gauge's tie girders at 6.0 m stand 4.8 m over the island, over the boss's
  // ~4.5 m shell; counted as walls they cut its home ground in two: 222 m² of half the island and one causeway)
  // (fix round 3: maxRise — the terraces stand 1.2 m over the boss's tier, inside its 1.35 m stride: it walked up the Lower
  // Surge Steps toward the squad and stuck between the parapets. The Pour Floor and the Moorings, 0.6 up, stay its ground)
  // roamAfter (bossBrain._roam): with the squad on the terraces over its Lakefront wedges it settled at its preferred
  // distance and played its moves from one spot for the rest of the round
  // (fix round 5, review 5: noGo — the tips of the west Lakefront wedges, never a goal or a path's anchor: it walked or charged
  // in, could neither turn nor step out, and spent 70–88 s of a round there; the cells stay its ground: 817.5 m²)
  boss: { floorY: 1.2, headroom: 4.6, maxRise: 0.65, roamAfter: 12, noGo: [[-20.5, -25.5, 3.5], [20.5, 25.5, 3.5]] },
  single: SINGLE,
  half: HALF,
  decor: {
    lamps: [
      [-3.0, -14.5], [3.0, -14.5],      // Pour Floor lamp plinths
      [-3.0, -19.5], [3.0, -19.5],      // Causeway lamp plinths
    ],
    palms: [],
    flags: [[-6.0, 12.0, -68.5], [6.0, 12.0, -68.5]],
  },
};

export const LAYOUT = LAYOUT_CALDERA;
export { FLOORS, GROUNDS, HIGH_BUILD };
void R; void OCT; void P;
