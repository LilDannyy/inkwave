// Turf War Craters — stage layout (src/world/stages/craters/). The stage owns every file in this folder:
//   layout.js    level geometry (this file)        props.js    prop pack + placements (set dressing)
//   surfaces.js  stage surface materials (texlib)  murals.js   stage decals / signage (mural atlas)
//   backdrop.js  the Cape's headland round it       geo.js      geometry helpers (ground tiler, crater bowls, trenches)
import { PATTERN, B, R, O } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { Raster, PieceIndex, topOf, mirrorDef, coneFacets, ringSegments, trench, edgeBands, inPoly, inRect, inStrip, DEG, r3 } from './geo.js';

// ------------------------------------------------------------------------------------------------------------
// Turf War Craters — the memorial park on the Round Down, a near-circular chalk tableland beside The Cape (north shore of
// Inkopolis Bay), still pocked with the craters of the Great Turf War. Cliffs and coves all round; the two visitor
// pavilions stand on promontories joined to it by short necks, Alpha at −Z, Bravo the 180° twin.
//   • centre: the Great Crater — a bowl of radial slopes from its floor (−1.0) to a rim crest (1.2), a cut toward each
//     spawn where the visitor path comes in; the crest's outer face is a 1.2 m chalk bank with two earth ramps up it
//   • the Remembrance Walk: a raised hoggin ring path round the crater (r 16.5), paved stations at its bends
//   • round the ring on each half: the fire trench's bay on the right flank (the tower's) with the memorial between it and
//     the ring, the pillbox on the headland at the right front, the zig-zag trench following the ring from the middle
//     round the left front (two plank bridges), the flooded crater on the left flank
//   • from each spawn: the ramp down onto the neck, then three ways — round the ring's right side, round its left, or
//     straight on over the zig-zag's bridge and into the crater's cut
// Heights: −1.0 crater floor + trenches · 0 downs · 0.1 ring · 1.2 rims + plinth · 2.4 pillbox roof + plinth top · 3.0 deck.
// ------------------------------------------------------------------------------------------------------------
const FL = -2.0, YF = -1.0, YR = 1.2, YP = 2.4, YD = 3.0;
const CO = {
  turf: '#9cab74', chalk: '#e4dfd2', lip: '#a6ab7a', slope: '#a3ad77', crest: '#aab07c', trench: '#9d8a70', sandbag: '#b9a986', timber: '#8d7a62',
  concrete: '#bdb9ae', pavilion: '#d8d3c7', spawn: '#eae6de', stone: '#ece8de', ring: '#b3ab8a', flint: '#9d9a90', plank: '#a98f6e', path: '#cbbd9a',
};
const turf = (o = {}) => ({ color: CO.turf, pattern: SURF.turf ?? PATTERN.plain, ...o });
const chalk = (o = {}) => ({ color: CO.chalk, pattern: SURF.chalk ?? PATTERN.concrete, ...o });
const bags = (o = {}) => ({ color: CO.sandbag, pattern: SURF.sandbag ?? PATTERN.plain, ...o });
const NOSIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
void chalk;

// ============================================================================================================ the Great Crater
// 16 facets (facet k on θ = k·22.5°, 0 = +x, 90 = +z): the floor inside apothem 5 at −1.0, slopes to the crest at
// apothem 10 (1.2, 23.7°), the crest ring out to apothem 11.2 (its outer face a 1.2 m bank). The cut on Alpha's side
// is facet 12 (θ 270°, facing Alpha's base): a gentler slope up to the downs (0) at z −7.5; its two neighbours are
// trimmed 1.5 m on the cut's side, so the cut opens 5.2 m wide at the downs and ~7.7 m at the crest's outer face.
export const CRATER = { N: 16, r0: 5.0, r1: 10.0, rc: 11.2, gap: 12, gapEnd: 7.5, gapW: 5.2, trim: 1.5, outer: [9, 15], outerFoot: 14.0 };
const CK = CRATER, HALF_K = (k) => k >= 8;          // facets 8…15 are Alpha's half (the mirror builds 0…7)
const isGap = (k) => k === CK.gap || k === CK.gap - 8;
const facetN = (k) => { const th = k * 22.5 * DEG, sl = (YR - YF) / (CK.r1 - CK.r0), l = Math.hypot(sl, 1); return [r3(-sl * Math.cos(th) / l), r3(1 / l), r3(-sl * Math.sin(th) / l)]; };
const FACETS = coneFacets(0, 0, CK.N, CK.r0, CK.r1, YF, YR, {
  only: HALF_K, narrow: { [CK.gap - 1]: [0, CK.trim], [CK.gap + 1]: [CK.trim, 0] }, end: { [CK.gap]: { r: CK.gapEnd, y: 0, w: CK.gapW } },
  opts: (k) => ({ tag: isGap(k) ? 'crater-cut' : 'crater-slope', color: CO.slope, pattern: SURF.turf ?? PATTERN.plain,
    // the rim facets show a scar of exposed chalk (murals.js 10) — the normal of the facet's top face
    ...(isGap(k) ? {} : { mural: [{ n: facetN(k), id: 10 }] }) }),
});
const CREST = ringSegments(0, 0, CK.N, CK.r1, CK.rc, YF, YR, {
  only: (k) => HALF_K(k) && !isGap(k), cut: { [CK.gap - 1]: [0, CK.trim], [CK.gap + 1]: [CK.trim, 0] },
  opts: () => ({ tag: 'crater-crest', color: CO.crest, pattern: SURF.turf ?? PATTERN.plain }),
});
// the V left between two crest segments at their outer corners: a filler 10 cm lower on the bisector
const FILLERS = [];
for (let k = 8; k < 16; k++) {
  if (isGap(k) || isGap((k + 1) % 16)) continue;
  const th = (k + 0.5) * 22.5 * DEG, ra = CK.r1 / Math.cos(Math.PI / 16) - 0.05, rb = CK.rc + 0.2, rm = (ra + rb) / 2;
  FILLERS.push(O(r3(Math.cos(th) * rm), r3(Math.sin(th) * rm), r3(rb - ra), 0.5, YF, YR - 0.1, r3(-th / DEG), { tag: 'crater-crest-joint', color: CO.crest, pattern: SURF.turf ?? PATTERN.plain }));
}
// earth ramps up onto the crest from outside (Alpha's right-front and left-front)
const OUTER_RAMPS = CK.outer.map((k) => { const th = k * 22.5 * DEG, u = [Math.cos(th), Math.sin(th)];
  return R([r3(u[0] * CK.outerFoot), 0, r3(u[1] * CK.outerFoot)], [r3(u[0] * CK.rc), YR, r3(u[1] * CK.rc)], 2.4, turf({ tag: 'crater-bank-ramp', color: CO.slope })); });
const CRATER_FLOOR = B(-5.1, 5.1, FL, YF, -5.1, 5.1, turf({ tag: 'crater-floor', color: '#aaa77a', mural: [{ n: [0, 1, 0], id: 7 }] }));
// the war relics in the slope (props.js dresses them): the giant ink cannon's turret deck at θ 315° (Alpha's left-front,
// a square steel deck at 0.9 — flush with the slope uphill, a 1.7 m armoured wall toward the floor), the shell casing
// at θ 225° (a prop, off limits)
export const RELICS = { cannon: { th: 315, r: 7.2, S: 3.6, top: 0.9 }, shell: { th: 225, r: 7.6 } };
const RC_ = RELICS.cannon, rcx = r3(Math.cos(RC_.th * DEG) * RC_.r), rcz = r3(Math.sin(RC_.th * DEG) * RC_.r);
export const CANNON_AT = [rcx, RC_.top, rcz];
const TURRET = O(rcx, rcz, RC_.S, RC_.S, YF, RC_.top, -RC_.th, { tag: 'cannon-deck', color: '#8a6048', pattern: PATTERN.nonslip, noPaint: NOSIDES });
// the stone bench ring round ground zero (4 Portland stone benches on the diagonals, 0.5 high): cover in the centre
// zone, and a step for kids to hop onto the tower from (it starts here, its deck 1.6 above the floor)
const BENCHES = [225, 315].map((th) => O(r3(Math.cos(th * DEG) * 3.5), r3(Math.sin(th * DEG) * 3.5), 0.55, 2.0, YF, YF + 0.5, -th, { tag: 'gz-bench', color: CO.stone, pattern: PATTERN.pavers }));

// ============================================================================================================ the Remembrance Walk
// The ring path round the crater: 12 straight hoggin runs (centre line on apothem 16.5, 2.4 wide, 10 cm proud of the
// turf in a timber edging), centred on θ = 0, 30, … 330° and meeting at their inner corners; a paved station (2.6 m
// square, 0.2) at every bend (θ = 15, 45, … 345°) covers the joint. The runs on the axes (0 / 90 / 180 / 270°) run
// square to the grid: where the tower's track crosses (180°, the half line) and where the middle path crosses (270°)
// they stop for a flush gap of hoggin, so neither the tower nor the path meets a kerb. Alpha's half builds the runs on
// 180 … 330° (the one on the half line: its south piece, and the south piece of the 0° run) and the stations on 195 … 345°.
export const RING = { N: 12, r: 16.5, w: 2.4, top: 0.1, st: 2.6, stTop: 0.2, gap180: 1.45, gap270: 1.3 };
const RA = RING.r - RING.w / 2, RB = RING.r + RING.w / 2, RH = Math.PI / RING.N, RL = 2 * RA * Math.tan(RH);
const ringRun = () => ({ tag: 'ring-walk', color: CO.path, pattern: PATTERN.asphalt });
const RING_RUNS = [
  ...ringSegments(0, 0, RING.N, RA, RB, -0.4, RING.top, { only: (k) => k >= 7 && k !== 9, opts: ringRun }),   // 210, 240, 300, 330
  B(-RL / 2, -RING.gap270, -0.4, RING.top, -RB, -RA, ringRun()), B(RING.gap270, RL / 2, -0.4, RING.top, -RB, -RA, ringRun()),   // 270
  B(-RB, -RA, -0.4, RING.top, -RL / 2, -RING.gap180, ringRun()), B(RA, RB, -0.4, RING.top, -RL / 2, -RING.gap180, ringRun()),   // 180 + 0 (south pieces)
].map((d) => (d.piece ? d.piece : d));
// (the station's centre: midway between the joint's inner corner and the runs' outer corners along the bisector)
const ST_R = (RA / Math.cos(RH) + RB * Math.cos(RH) + RA * Math.tan(RH) * Math.sin(RH)) / 2;
export const STATIONS = [195, 225, 255, 285, 315, 345].map((th) => ({ th, c: [r3(Math.cos(th * DEG) * ST_R), r3(Math.sin(th * DEG) * ST_R)] }));
const STATION_PIECES = STATIONS.map((s) => O(s.c[0], s.c[1], RING.st, RING.st, -0.4, RING.stTop, -s.th, { tag: 'ring-station', color: '#d3cab2', pattern: PATTERN.pavers }));

// ============================================================================================================ trenches
const PARAPET = 0.3;
// T1 — the fire trench's bay on the right flank (Alpha's: x −25.75 … −22.25, z −11.75 … −1.75, a 3.5 m bay square to
// the ring's run on the half line): the tower drops in at its open north end and climbs out of its open south end (bare chalk); a timber
// revetment with a sandbag parapet each side, a fire-step stair out of each bank
export const T1 = { x0: -25.75, x1: -22.25, z0: -11.75, z1: -1.75, wall: 0.5 };
const T1_STAIRS = [
  { z: -7.0, w: 2, side: 1, run: 2.5 },    // east bank (toward the ring)
  { z: -4.5, w: 2, side: -1, run: 2.5 },   // west bank (toward the cliff path)
];
const t1StairRect = (s) => (s.side > 0 ? [T1.x1, T1.x1 + s.run, s.z - s.w / 2, s.z + s.w / 2] : [T1.x0 - s.run, T1.x0, s.z - s.w / 2, s.z + s.w / 2]);
const t1Pieces = [];
{
  const w = T1.wall, o = bags({ tag: 't1-parapet' });
  const segs = (a0, a1, gaps) => { const out = []; let a = a0; for (const [g0, g1] of gaps) { if (g0 > a) out.push([a, g0]); a = g1; } if (a1 > a) out.push([a, a1]); return out; };
  const wall = (x0, x1, z0, z1) => t1Pieces.push(B(x0, x1, YF, 0, z0, z1, { tag: 't1-revetment', color: CO.timber, pattern: PATTERN.weatherboard }), B(x0, x1, 0, PARAPET, z0, z1, o));
  for (const side of [-1, 1]) {
    const gaps = T1_STAIRS.filter((s) => s.side === side).map((s) => [s.z - s.w / 2, s.z + s.w / 2]).sort((p, q) => p[0] - q[0]);
    for (const [a, b] of segs(T1.z0, T1.z1, gaps)) side > 0 ? wall(T1.x1, T1.x1 + w, a, b) : wall(T1.x0 - w, T1.x0, a, b);
  }
  for (const s of T1_STAIRS) { const x = s.side > 0 ? T1.x1 : T1.x0; t1Pieces.push(R([x, YF, s.z], [x + s.side * s.run, 0, s.z], s.w, { tag: 't1-firestep', color: CO.timber, pattern: PATTERN.rampboard })); }
}
// T2 — the zig-zag trench (2.25 m inside) following the ring from the middle round the left front: a bay across the
// spawn's approach (the middle path crosses it on a plank bridge), a dog-leg, a second bay (the other bridge), a
// dog-leg, and a last bay running north whose end is a stair up toward the flooded crater. Its west end is a stair up
// too; a fire step climbs out of the first bay's north bank.
export const T2 = { pts: [[-1.5, -22.125], [4.5, -22.125], [8.2, -19.5], [13.8, -19.5], [18.2, -15.5], [18.2, -9.0]], w: 2.25, wall: 0.5, stair: 2.5 };
const T2_WEST = { run: 2.5 };                                                   // up out of the west end, rising west
const T2_STEP = { x0: 2.25, x1: 3.75, run: 2.5 };                              // north-bank fire step in the first bay
const T2B = trench(T2.pts, T2.w, T2.wall, YF, (i) => (i % 2 ? PARAPET + 0.1 : PARAPET), () => bags({ tag: 't2-parapet' }), {
  ends: [false, false], gaps: { '0:+1': [[T2_STEP.x0 - T2.pts[0][0], T2_STEP.x1 - T2.pts[0][0]]] },
});
const T2_LEGS = T2B.legs;
const [t2a, t2e] = [T2.pts[0], T2.pts[T2.pts.length - 1]], t2z0 = [t2a[1] - T2.w / 2, t2a[1] + T2.w / 2];
const t2Pieces = [
  ...T2B.walls,
  R([t2a[0], YF, t2a[1]], [t2a[0] - T2_WEST.run, 0, t2a[1]], T2.w, { tag: 't2-stair', color: CO.timber, pattern: PATTERN.rampboard }),
  R([t2e[0], YF, t2e[1] - T2.stair], [t2e[0], 0, t2e[1]], T2.w, { tag: 't2-stair', color: CO.timber, pattern: PATTERN.rampboard }),
  R([(T2_STEP.x0 + T2_STEP.x1) / 2, YF, t2z0[1]], [(T2_STEP.x0 + T2_STEP.x1) / 2, 0, t2z0[1] + T2_STEP.run], T2_STEP.x1 - T2_STEP.x0, { tag: 't2-firestep', color: CO.timber, pattern: PATTERN.rampboard }),
];
// plank bridges over T2's two bays (deck 0.5…0.7 on trestles, a plank ramp down each side; 1.5 m under the deck)
export const BRIDGES = [{ x: 0, z: T2.pts[0][1] }, { x: 12.0, z: T2.pts[2][1] }];
const BR = { w: 1.8, deck: [0.5, 0.7], half: T2.w / 2 + T2.wall + 0.1, ramp: 1.7 };
const bridgePieces = BRIDGES.flatMap(({ x, z }) => [
  B(x - BR.w / 2, x + BR.w / 2, BR.deck[0], BR.deck[1], z - BR.half, z + BR.half, { tag: 'bridge', color: CO.plank, pattern: PATTERN.planks }),
  R([x, 0, z - BR.half - BR.ramp], [x, BR.deck[1], z - BR.half], BR.w, { tag: 'bridge-ramp', thin: true, thickness: 0.2, color: CO.plank, pattern: PATTERN.rampboard }),
  R([x, 0, z + BR.half + BR.ramp], [x, BR.deck[1], z + BR.half], BR.w, { tag: 'bridge-ramp', thin: true, thickness: 0.2, color: CO.plank, pattern: PATTERN.rampboard }),
]);

// ============================================================================================================ the flooded crater
export const POND = { c: [24.5, -6.0], r: 3.2, rim: 4.0, N: 12 };
// (an invisible, non-solid slab under the pond's water: it counts the pond as deck for the sea — no surf, spray or
// foam round a still rainwater pond — while you still fall through into the water)
const POND_STILL = B(POND.c[0] - 3.5, POND.c[0] + 3.5, FL, -1.75, POND.c[1] - 3.5, POND.c[1] + 3.5, { tag: 'pond-still', hidden: true, solid: false, paint: false });
const POND_RIM = ringSegments(POND.c[0], POND.c[1], POND.N, POND.r, POND.rim, FL, (k) => (k % 2 ? 0.3 : 0.2), {
  outer: true, opts: () => turf({ tag: 'pond-rim', color: CO.slope }) });

// ============================================================================================================ buildings
// the visitor pavilion on its headland (spawn on its observation deck), the ramp down the neck toward mid, a stair down
// each side onto the headland's front; a clerestory block along the back of the deck (off limits) closes the stage's
// back edge, flint walls either side of it
export const PAV = { x: 8.5, z0: -44, z1: -36.5, back: 0.8, stairX: 9.4, neck: 7.0, neckZ: -35.0, head: 11.5 };
const pavilion = [
  B(-PAV.x, PAV.x, 0, YD - 0.2, PAV.z0, PAV.z1, { tag: 'pavilion', color: CO.pavilion, pattern: PATTERN.concrete, noPaint: [[0, 0, 1]] }),
  B(-PAV.x, PAV.x, YD - 0.2, YD, PAV.z0 + PAV.back, PAV.z1, { tag: 'spawn-deck', color: CO.spawn, pattern: PATTERN.spawn }),
  B(-PAV.x, PAV.x, YD - 0.2, 5.6, PAV.z0, PAV.z0 + PAV.back, { tag: 'pavilion-back', color: CO.pavilion, pattern: PATTERN.concrete, roof: true, noPaint: NOSIDES }),
  R([0, 0, PAV.z1 + 6.8], [0, YD, PAV.z1], 3.6, { tag: 'pavilion-steps', color: '#d6d1c5', pattern: PATTERN.stonestep }),
  ...[-1, 1].map((s) => R([s * PAV.stairX, 0, PAV.z0 + 7.8], [s * PAV.stairX, YD, PAV.z0 + 1.0], 1.8, { tag: 'pavilion-stair', color: '#d6d1c5', pattern: PATTERN.stonestep })),
  ...[-1, 1].map((s) => B(s < 0 ? -PAV.head : PAV.x, s < 0 ? -PAV.x : PAV.head, 0, 2.6, PAV.z0, PAV.z0 + 0.6, { tag: 'boundary-wall', color: CO.flint, pattern: PATTERN.brick, roof: true, noPaint: NOSIDES })),
];
// the pillbox on the headland at the right front (roof 2.4; it faces the ring over the tower's track, a stair climbs
// its east wall from the front to the back)
export const PILLBOX = { x0: -17.0, x1: -11.6, z0: -27.4, z1: -22.0 };
const pillbox = [
  B(PILLBOX.x0, PILLBOX.x1, 0, 2.05, PILLBOX.z0, PILLBOX.z1, { tag: 'pillbox', color: CO.concrete, pattern: PATTERN.concrete, mural: NOSIDES.map((n) => ({ n, id: 8 })) }),
  B(PILLBOX.x0 - 0.2, PILLBOX.x1 + 0.2, 2.05, YP, PILLBOX.z0, PILLBOX.z1 + 0.2, { tag: 'pillbox-roof', color: CO.concrete, pattern: PATTERN.concrete }),
  B(PILLBOX.x0 + 0.5, PILLBOX.x1 - 0.6, YP, YP + 0.6, PILLBOX.z1 - 0.55, PILLBOX.z1 + 0.05, bags({ tag: 'pillbox-sandbags' })),   // cover on the roof's front
  R([PILLBOX.x1 + 1.1, 0, PILLBOX.z1], [PILLBOX.x1 + 1.1, YP, PILLBOX.z0], 2.2, { tag: 'pillbox-stair', color: CO.concrete, pattern: PATTERN.treads }),
];
// the memorial: obelisk on a two-step plinth between the fire trench and the ring (right flank), steps up from the north
export const MEMO = { c: [-18.0, -13.5] };
const [mx, mz] = MEMO.c;
const memorial = [
  B(mx - 2.5, mx + 2.5, 0, YR, mz - 2.5, mz + 2.5, { tag: 'plinth', color: CO.stone, pattern: PATTERN.pavers }),
  B(mx - 1.25, mx + 1.25, YR, YP, mz - 1.25, mz + 1.25, { tag: 'plinth-top', color: CO.stone, pattern: PATTERN.pavers, mural: [{ n: [0, 0, 1], id: 9 }] }),
  R([mx, 0, mz + 2.5 + 2.7], [mx, YR, mz + 2.5], 2.4, { tag: 'plinth-steps', color: CO.stone, pattern: PATTERN.stonestep }),
];
// sandbag emplacements (cover, 0.95 high): straight walls and a gun pit; `rad(θ, r)` = a wall along the ring at θ
const bagwall = (x0, x1, z0, z1) => B(x0, x1, 0, 0.95, z0, z1, bags({ tag: 'emplacement' }));
const rad = (th, r, len = 2.5) => O(r3(Math.cos(th * DEG) * r), r3(Math.sin(th * DEG) * r), 0.75, len, 0, 0.95, -th, bags({ tag: 'emplacement' }));
const cover = [
  rad(292, 13.9),                                 // side zone: in the downs inside the ring
  rad(314, 14.0),                                 // side zone: the same, by the cannon's side of the crater
  rad(215, 13.3),                                 // right: inside the ring, by the crater's bank ramp
  bagwall(-19.6, -18.85, -4.25, -1.75),           // right flank, beside the tower's lane (its twin across the lane is Bravo's)
  bagwall(18.85, 19.6, -4.0, -1.75),              // left flank, the same
  rad(300, 27.3),                                 // left front, between the zig-zag and the cliff
  bagwall(3.0, 5.5, -27.25, -26.5),               // the neck, east of the path
];
// interpretive boards: a painted panel (layout block, murals.js) in a steel frame (props.js craters_board)
//   deg = the way the panel faces (0 = +z, 90 = +x)
export const BOARDS = [
  { x: 4.6, z: -29.3, deg: -90, id: 4 },    // THE GREAT TURF WAR (battle map), on the neck, facing the path
  { x: -20.8, z: -9.2, deg: -90, id: 5 },   // TRENCH LINE B, on the fire trench's east bank, facing it
  { x: 21.0, z: -12.6, deg: 28, id: 6 },    // THE FLOODED CRATERS, facing the pond
];
const BOARD_W = 1.6, BOARD_Y = [0.65, 1.65];
const boards = BOARDS.map((b) => O(b.x, b.z, BOARD_W, 0.06, BOARD_Y[0], BOARD_Y[1], b.deg, { tag: 'board', color: '#e9e4d6', pattern: PATTERN.plain, roof: true,
  noPaint: [[Math.sin(b.deg * DEG), 0, Math.cos(b.deg * DEG)], [-Math.sin(b.deg * DEG), 0, -Math.cos(b.deg * DEG)], [0, 1, 0]].map((v) => v.map(r3)),
  mural: [{ n: [r3(Math.sin(b.deg * DEG)), 0, r3(Math.cos(b.deg * DEG))], id: b.id }] }));
// the flush hoggin paths: the forecourt on the neck; the path from the ramp's foot over the bridge, through the ring's
// gap and on into the crater's cut; the ring's gaps on the half line (the tower's crossing, and its twin's)
export const PATHS = [
  [-6.3, 6.3, -36.5, -29.7], [-RING.gap270, RING.gap270, -29.7, -7.5], [-RB, -RA, -RING.gap180, 0], [RA, RB, -RING.gap180, 0],
];

// ============================================================================================================ the coast
// Alpha's half of the outline (x, z): the Round Down's cliffs (r ≈ 30–34, faceted every 8–11°: the pillbox's headland at
// θ ≈ 220–240°, coves either side of the flooded crater and beside the neck) and the pavilion's promontory on its neck.
// The half line z = 0 and the promontory's back edge z = −44 are open (the land runs on).
const polar = (th, r) => [r3(Math.cos(th * DEG) * r), r3(Math.sin(th * DEG) * r)];
export const COAST = [
  [31.0, 0], ...[[349, 31.6], [338, 30.4], [329, 29.6], [320, 30.6], [311, 32.0], [302, 31.0], [293, 30.0]].map(([t, r]) => polar(t, r)),
  [PAV.neck, -30.2], [PAV.neck, PAV.neckZ], [PAV.head, PAV.neckZ], [PAV.head, PAV.z0], [-PAV.head, PAV.z0], [-PAV.head, PAV.neckZ], [-PAV.neck, PAV.neckZ], [-PAV.neck, -30.2],
  ...[[247, 30.6], [238, 33.4], [229, 34.2], [220, 34.0], [212, 32.4], [204, 31.4], [196, 31.4], [188, 30.8]].map(([t, r]) => polar(t, r)), [-31.0, 0],
];
const openEdge = (i) => { const a = COAST[i], b = COAST[(i + 1) % COAST.length]; return (a[1] === 0 && b[1] === 0) || (a[1] === PAV.z0 && b[1] === PAV.z0); };
const LIP = edgeBands(COAST, 0.7, FL, (i) => (i % 2 ? 0.33 : 0.25), () => turf({ tag: 'cliff-lip', color: CO.lip }), openEdge);

// ============================================================================================================ the ground
const GX = [-33, 33], GZ = [PAV.z0, 0];
const T1_HOLES = [[T1.x0, T1.x1, T1.z0, T1.z1], ...t1Pieces.filter((d) => d.kind === 'box').map((d) => [d.min[0], d.max[0], d.min[2], d.max[2]]), ...T1_STAIRS.map(t1StairRect)];
const T2_HOLES = [[t2a[0] - T2_WEST.run, t2a[0], t2z0[0], t2z0[1]], [T2_STEP.x0, T2_STEP.x1, t2z0[1], t2z0[1] + T2_STEP.run]];
const inHole = (x, z) => T1_HOLES.some((r) => inRect(r, x, z)) || T2_HOLES.some((r) => inRect(r, x, z)) || T2_LEGS.some((L) => inStrip(L, x, z)) || Math.hypot(x - POND.c[0], z - POND.c[1]) < POND.r;
const CUT = [CRATER_FLOOR, ...FACETS.map((f) => f.piece)];                  // surfaces below the downs (no ground where they show)
const STANDING = [...CREST.map((c) => c.piece), ...FILLERS, ...OUTER_RAMPS, ...t1Pieces.filter((d) => d.kind !== 'ramp'), ...t2Pieces.filter((d) => d.kind !== 'ramp'),
  ...bridgePieces, ...POND_RIM.map((c) => c.piece), ...pavilion, ...pillbox, ...memorial, ...cover, ...LIP, TURRET, ...boards, ...BENCHES,
  ...RING_RUNS, ...STATION_PIECES];
const inPath = (x, z) => PATHS.some((r) => x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]);
function groundCells() {
  const all = [...CUT.map((d) => ({ d, cut: true })), ...STANDING.map((d) => ({ d, cut: false }))];
  const idx = new PieceIndex([...all, ...all.map(({ d, cut }) => ({ d: mirrorDef(d), cut }))]);
  const G = new Raster(GX[0], GX[1], GZ[0], GZ[1], 0.25), h = G.res / 2 - 0.002;
  const pt = (x, z) => {                                  // 0 forbidden · 1 needs ground · 2 hidden (may)
    if (inHole(x, z)) return 0;
    let top = -Infinity, cut = false;
    for (const { d, cut: c } of idx.at(x, z)) { const t = topOf(d, x, z); if (t != null) { if (t > top) top = t; if (c) cut = true; } }
    if (top >= 0.08) return 2;
    return cut ? 0 : 1;
  };
  G.fill((x, z) => {
    if (![[-h, -h], [h, -h], [h, h], [-h, h]].every(([a, b]) => inPoly(COAST, x + a, z + b))) return 0;
    const s = [pt(x, z), pt(x - h, z - h), pt(x + h, z - h), pt(x + h, z + h), pt(x - h, z + h)];
    return s.includes(0) ? 0 : s.every((v) => v === 2) ? 2 : inPath(x, z) ? 3 : 1;
  });
  return G;
}
// the paths are tiled first (their own slabs), then the turf round them
const GROUND_G = groundCells();
const PATH_RECTS = (() => { const G = new Raster(GX[0], GX[1], GZ[0], GZ[1], 0.25); G.s = GROUND_G.s.map((v) => (v === 3 ? 1 : v === 2 ? 2 : 0)); return G.tile(); })();
const TURF_RECTS = (() => {
  const G = new Raster(GX[0], GX[1], GZ[0], GZ[1], 0.25);
  const inP = (x, z) => PATH_RECTS.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  G.s = GROUND_G.s.map((v, k) => { if (v !== 1 && v !== 2) return 0; const x = G.cx(k % G.nx), z = G.cz((k / G.nx) | 0); return inP(x, z) ? 0 : v; });
  return G.tile();
})();
const GROUND_RECTS = [...PATH_RECTS, ...TURF_RECTS];
const GROUND = [...PATH_RECTS.map((r) => B(r.x0, r.x1, FL, 0, r.z0, r.z1, { tag: 'path', color: CO.path, pattern: PATTERN.asphalt })),
  ...TURF_RECTS.map((r) => B(r.x0, r.x1, FL, 0, r.z0, r.z1, turf({ tag: 'downs' })))];
// trench floors (duckboards): the bays' interiors, run on under the revetments wherever no ground slab is
const FLOORS = (() => {
  const G = new Raster(GX[0], GX[1], GZ[0], GZ[1], 0.25), h = 0.123;
  const covered = (x, z) => GROUND_RECTS.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  const inside = (x, z) => inRect([T1.x0, T1.x1, T1.z0, T1.z1], x, z) || T2_LEGS.some((L) => inStrip(L, x, z));
  const walls = [...t1Pieces, ...t2Pieces].filter((d) => d.kind !== 'ramp');
  G.fill((x, z) => {
    const P = [[x, z], [x - h, z - h], [x + h, z - h], [x + h, z + h], [x - h, z + h]];
    if (P.some(([a, b]) => covered(a, b))) return 0;
    if (P.some(([a, b]) => inside(a, b))) return 1;
    return P.every(([a, b]) => walls.some((d) => (topOf(d, a, b) ?? -9) > 0)) ? 2 : 0;
  });
  return G.tile().map((r) => B(r.x0, r.x1, FL, YF, r.z0, r.z1, { tag: 'trench-floor', color: CO.trench, pattern: PATTERN.planks }));
})();

// ============================================================================================================ modes
// Zone Control: the Great Crater's floor (centre); a stretch of the ring on the left front (side, Alpha's), from the
// downs inside it out to the zig-zag trench's bank — the crater's crest and the bridge over it, cover on both sides
const circle = (cx, cz, r, n = 16) => Array.from({ length: n }, (_, i) => { const a = ((i + 0.5) / n) * Math.PI * 2; return [r3(cx + Math.cos(a) * r), r3(cz + Math.sin(a) * r)]; });
const sector = (t0, t1, r0, r1, n = 7) => [...Array.from({ length: n + 1 }, (_, i) => polar(t0 + ((t1 - t0) * i) / n, r1)), ...Array.from({ length: n + 1 }, (_, i) => polar(t1 - ((t1 - t0) * i) / n, r0))];
const ZONES = {
  center: [{ poly: circle(0, 0, 5.45), y0: -1.2, y1: -0.8 }],
  side: { poly: sector(278, 322, 13.0, 19.0), y0: -0.3, y1: 0.5 },
};
// Tower Command (drawn on Bravo's half, z > 0): out of the crater east up its slope, over the crest and down, across the
// ring's gap on the half line to the flank; north into the fire trench's bay (a drop), along it and up out of its end;
// on past the memorial, then west round the outside of the ring between the memorial and the pillbox's headland; north
// past the zig-zag's end, over the forecourt to the foot of the pavilion's ramp (13 m short of Bravo's pad)
const TOWER = {
  path: [[0, 0], [24, 0], [24, 19.75], [5, 19.75], [5, 28.5]],
  checkpoints: [[24, 6.5], [14, 19.75]],
  yaw: 0,
};

const LAYOUT_CRATERS = {
  id: 'craters',
  bounds: { minX: -36, maxX: 36, minZ: -44, maxZ: 44 },
  spawnPads: [[0, YD, -40.5], [0, YD, 40.5]],
  spawnBarrier: 4.2,
  // the Cape's headland round the park (backdrop.js); a chalk coast's milky green-turquoise shallows by day
  env: {
    backdrop: (kit) => buildBackdrop(kit, { coast: COAST, ponds: [POND], back: PAV.z0, head: PAV.head }), edge: 'none', boats: false,
    theme: { day: { seaShallow: '#35a198', seaDeep: '#11587a', seaCrest: '#72d8c4' } },
  },
  single: [CRATER_FLOOR],
  half: [...GROUND, ...FLOORS, ...LIP, ...FACETS.map((f) => f.piece), ...CREST.map((c) => c.piece), ...FILLERS, ...OUTER_RAMPS, ...t1Pieces, ...t2Pieces, ...bridgePieces,
    ...POND_RIM.map((c) => c.piece), POND_STILL, ...pavilion, ...pillbox, ...memorial, ...cover, TURRET, ...boards, ...BENCHES, ...RING_RUNS, ...STATION_PIECES],
  zones: ZONES,
  tower: TOWER,
  // the intro opens high over the enemy's side of the crater and sweeps down the neck to the deck
  intro: { from: [15, 11, 15], lookFrom: [0, 0, -3], toBack: 1.0 },
  // stage-select hero: from high over Alpha's promontory across the ring round the Great Crater to Bravo's pavilion on
  // its promontory; the chalk cliffs and the downs beyond, Inkopolis across the bay
  art: { from: [-26, 28, -50], look: [2, -2, 4], fov: 55 },
  // Victorian lamp posts on the neck, by the bridge, behind the memorial, out by the zig-zag and the pond (dusk light
  // pools; none on the ring itself: HULLBREAKER's round), team flags either side of the pavilion's front
  decor: { lamps: [[-2.0, -25.9], [-21.2, -17.0], [16.6, -23.4], [-5.6, -32.0], [-15.0, -16.8], [26.9, -10.9]], palms: [], flags: [[-6.0, 0, -35.3], [6.0, 0, -35.3]] },
};

export const LAYOUT = LAYOUT_CRATERS;
