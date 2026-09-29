// Calamari County — stage layout (src/world/stages/calamari/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, env (this file)   props.js    prop pack + placements
//   surfaces.js  stage surface materials (texlib)                       murals.js   stage decals / signage
//   backdrop.js  the far scenery (snowy hills, the coves, the headlands, the village beyond)
import { PATTERN, B, R, O } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { MURAL } from './murals.js';

// ------------------------------------------------------------------------------------------------------------
// Calamari County — the Squid Sisters' home village, at the far end of the line out of Inkopolis: a snowbound fishing
// village on a neck of land between two coves, the railway running through the middle of it between two headland
// tunnels. Winter: snow on every roof, rime on the quays, steam off the bath house.
// Alpha at −Z (the half list), Bravo is the 180° twin. Plan (Alpha's half; Alpha looks toward +Z, so its left is +X):
//   • mid, the RAILWAY CUT (|z| < 6.6, full width): Calamari County Station's open island platform (1.0, 32 m long) between
//     the two tracks (trackbeds at 0); two broad open overpasses (the station's kosen-kyō, 6 m wide at 4.3: the high
//     ground over mid) spanning the whole cut from side platform to side platform at x ±(2.4 … 8.4), each with wide
//     stairs down its outer edge to both side platforms and the island; the county railcars (stage movers, 3.4 m of cover,
//     roofs off-limits) shuttling between the halves of the station on a timetable (MOVERS below); a level crossing at
//     each end (|x| 18.5 … 25.5) and the tunnel portals capping the cut (|x| 31.5)
//   • station side (z −12.2 … −6.6): the side platform (1.0, 5.6 m deep) with the little station building behind its
//     middle, ramps at both ends, two flights of steps up from the forecourt
//   • right lane (−X) HILLSIDE: the crossing road (0, 7 m) up past the bath house, the open terrace T1
//     (1.3, 6–7 m, hop-up from the road) beside it, T2 (2.6) by the co-op overlooking the back street with the
//     Cuttlefish cottage at its west end, houses climbing the hill behind
//   • mid lane: the station forecourt and the village square as one open space (22 × 20 m: post box, bus shelter,
//     the pine, snowbanks, the side zone) → the co-op stair
//   • left lane (+X) HARBOUR: the basin quay (8–10 m) along the fishing-boat basin that cuts into the village (its edge
//     at an angle, a slipway), the north quay apron (20 × 6 m) with the breakwater, the co-op's quay behind
//   • spawn: the open upper deck of the Fishermen's Co-op warehouse (3.4): grand stair to the square, a timber ramp
//     down to the co-op quay, drops onto T2 (0.8) and the loading dock (1.0)
// The village grew: buildings of different sizes, several turned a few degrees off the street grid, 5 m cross streets
// and a 5 m back street between them; the outline follows the coast (the basin, the breakwater, the stepped co-op quay) and the
// hill (terraces stepping in and out, the hill houses cutting the corner behind the spawn).
// Heights: 0 streets / quays / trackbeds · −0.1 the basin quay (a kerb down from the street) · 1.0 platforms, loading
// dock · 1.3 T1 · 2.6 T2 · 3.4 spawn, railcar tops (off-limits) · 4.3 overpass decks.
// ------------------------------------------------------------------------------------------------------------

// an oriented box with one long side along A → B (world x, z), reaching `depth` to the left (side 1) or right (−1) of it
function edgeBox(A, Bp, depth, y0, y1, side, o) {
  const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
  const lx = [dz / L, -dx / L];   // the box's local x axis (level.js obox: (cos a, −sin a))
  const cx = (A[0] + Bp[0]) / 2 + side * lx[0] * depth / 2, cz = (A[1] + Bp[1]) / 2 + side * lx[1] * depth / 2;
  return O(+cx.toFixed(4), +cz.toFixed(4), depth, L, y0, y1, +((a * 180) / Math.PI).toFixed(4), o);
}
// a box of footprint w × d centred at (cx, cz), turned deg (building blocks off the street grid)
const turned = (cx, cz, w, d, y0, y1, deg, o) => O(cx, cz, w, d, y0, y1, deg, o);

// ---- the plan (shared with props.js: dressing is placed from the same numbers)
// (widened 2026-09-29 after the user's play test: "a fairly cramped map … bit wider in terms of flanks and open spaces":
// the stage grew from ±28 to ±34 in x; the hillside road 4.5 → 7 m and T1 3.2 → 6–7 m with no house on it; the harbour
// quay 4–6 → 8–10 m; the square + forecourt one open space 22 × 20 m; the cross and back streets 3–4 → 5 m)
export const P = {
  // railway cut
  track: [3.4, 6.6],            // a track band |z| 3.4 … 6.6 (Alpha's at −z); the island platform |z| < 3.4
  cutX: 31.5,                   // the trackbed runs |x| < 31.5, the tunnel portals beyond
  island: { x: 16.2, z: 3.4, y: 1.0 },
  side: { x0: -16.2, x1: 16.2, z0: -12.2, z1: -6.6, y: 1.0 },
  strip: -11,                   // the station strip (z −11 … −6.6) runs the full width at street level
  crossing: [-25.5, -18.5],     // Alpha's level crossing + hillside road (x); Bravo's is the mirror (x 18.5 … 25.5)
  // Alpha's railcar on Alpha's track (a stage mover, src/game/movers.js): 12 m long, it shuttles between the east half
  // of the station (centre x 11.2: x 5.2 … 17.2) and the west half (x −17.2 … −5.2) — never parked on the centre zone
  // (|x| < 5); Bravo's does the mirror on Bravo's track
  car: { L: 12, W: 2.9, h: 3.4, floor: 1.05, stop: 11.2 },
  // Alpha's overpass (the +x one; the −x one is its mirror): an open deck over the whole cut, side platform to side
  // platform, 6 m wide at 4.3 (3.9 under it: the railcars and the tower pass beneath), stairs 3.6 / 3.4 / 3.6 m wide down
  // its outer edge to both side platforms and the island (feet at x 16), slim piers on the platforms
  overpass: { x0: 2.4, x1: 8.4, y: 4.3, t: 0.4, z: 12.2, foot: 16.0, stairs: [[-10.2, 3.6], [0, 3.4], [10.2, 3.6]], piers: [2.95, 7.85], pierZ: [-10.4, 0, 10.4] },
  // village (buildings: [cx, cz, w (x), d (z), deg, height])
  station: [-3.5, 3.5, -16.2, -12.2],             // station building (x0, x1, z0, z1), behind the side platform's middle
  steps: [-6, 6],                                 // the steps up from the forecourt onto the side platform (x centres)
  bath: [-14.75, -22.75, 6.5, 5.5, 4, 3.6],       // bath house
  store: [13.3, -22.75, 4.8, 5.5, -5, 3.4],       // general store (front on the square) / fish shop (back on the quay)
  square: [-11, 11, -27, -15],                    // the square's setts column (x0, x1) and its open middle (z0, z1)
  backSt: [-30.5, -25.5],                         // the back street (z) from the hillside road to the quay
  T1: [[-32.5, -25.5, -18, -11], [-31.5, -25.5, -28.5, -18]],                          // T1 (1.3) pieces (x0, x1, z0, z1)
  T2: [[-25.5, -2.2, -37.2, -30.5], [-31.5, -25.5, -37.2, -28.5]],                     // T2 (2.6)
  y1: 1.3, y2: 2.6,
  cottage: [-31.5, -25.5, -37.2, -33.2],          // the Cuttlefish cottage at T2's west end, above the village
  // retaining walls along the hill side (x0, x1, z0, z1, top, dressed?): the station corner, behind T1 (a jog), behind
  // T2's end (the last one behind the cottage: no face dressing)
  hillWalls: [[-33.5, -31.5, -11, -8.5, 3.0], [-33.5, -32.5, -18, -11, 3.8], [-33.5, -31.5, -28.5, -18, 3.8], [-33.5, -31.5, -33.2, -28.5, 5.0], [-33.5, -31.5, -37.2, -33.2, 5.0, false]],
  // Fishermen's Co-op
  deck: { x0: -9, x1: 9, z0: -45.5, z1: -37.2, y: 3.4 },
  pad: [0, 3.4, -41.3],
  dock: { x0: 2.2, x1: 10, z0: -37.2, z1: -30.5, y: 1.0 },
  netStore: [10, 12, -37.2, -30.5],
  // harbour (Alpha's cove side): the basin quay's water edge runs A → B at an angle; the slipway cuts it
  kerb: 16,                                       // the village street ends at x 16; the basin quay is 0.1 lower
  basinEdge: [[24.5, -16.4], [22, -38.6]],
  slip: { t0: 0.44, t1: 0.575 },                  // the slipway's gap along the basin edge (fractions of A → B)
  northQuay: [11, 31.5, -17, -11],
  breakwater: [[28.6, -16.6], [32.9, -21.6]],
  southQuay: [[12, 24.6, -45.5, -38], [11, 18, -47, -45.5]],
};
// hillside road centre (Alpha) and the back street centre: the tower's corners
P.roadX = (P.crossing[0] + P.crossing[1]) / 2;
P.backZ = (P.backSt[0] + P.backSt[1]) / 2 + 0.1;

const K = {
  snow: '#d6dce3', ballast: '#c3c8ce', platform: '#76604d', timber: '#6d5543', stone: '#b7b3ab', setts: '#a9a6a0',
  quay: '#a7a39c', wall: '#e8e2d4', plaster: '#ece6d8', dark: '#4a3a2e', spawn: '#eae6de', train: '#d9d4c4', portal: '#8f8b84',
  cedar: '#5d4636',
};
const snow = (o = {}) => ({ color: K.snow, pattern: SURF.snow, ...o });
const setts = (o = {}) => ({ color: K.setts, pattern: SURF.setts, ...o });
const quay = (o = {}) => ({ color: K.quay, pattern: SURF.setts, ...o });
const timber = (o = {}) => ({ color: K.platform, pattern: SURF.timber, ...o });
const bldg = (c, o = {}) => ({ color: c, pattern: PATTERN.weatherboard, roof: true, ...o });
const stair = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const FL = -1.6;   // ground slabs reach down to the sea (the environment reads their tops as the stage's footprint)

const { island: I, side: S, overpass: OP, deck: DK, dock: DO } = P;
// (free-spanning steel stairs: a 0.35 m flight on its stringers, open underneath — you see and shoot under them; the
// sides are the stringers with handrails on top: not inkable, so nobody plans a climb up them into the rail)
const opStair = ([z, w]) => R([OP.foot, S.y, z], [OP.x1, OP.y, z], w, { tag: 'overpass-stair', color: K.timber, pattern: PATTERN.treads, thin: true, thickness: 0.35, noPaint: [[0, 0, 1], [0, 0, -1]] });
const bx = (r, y0, y1, o) => B(r[0], r[1], y0, y1, r[2], r[3], o);
const bt = (b, y0, o) => turned(b[0], b[1], b[2], b[3], y0, y0 + b[5], b[4], o);
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const SINGLE = [
  // ================= the railway cut: snowy ballast the full width, the island platform between the tracks
  B(-P.cutX, P.cutX, FL, 0, -P.track[1], P.track[1], snow({ tag: 'trackbed', color: K.ballast })),
  B(-I.x, I.x, 0, I.y, -I.z, I.z, timber({ tag: 'island' })),
];

// the basin quay (0.1 below the street, tucked under the village, the north quay and the co-op quay): its water edge
// runs at an angle along the basin, broken by the slipway
const [bA, bB] = P.basinEdge, sA = lerp2(bA, bB, P.slip.t0), sB = lerp2(bA, bB, P.slip.t1);
const slipDir = (() => { const dx = bB[0] - bA[0], dz = bB[1] - bA[1], L = Math.hypot(dx, dz); return [-dz / L, dx / L]; })();   // outward (east, into the basin)
const SLIP_D = 3.0;   // the slipway's notch reaches this far back into the quay
const back = (p) => [p[0] - slipDir[0] * SLIP_D, p[1] - slipDir[1] * SLIP_D];
const BASIN = [
  edgeBox(bA, sA, 9.4, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
  edgeBox(sB, bB, 9.4, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
  // the slipway's head: the basin quay behind its notch; the ramp runs from there down into the water
  edgeBox(back(sA), back(sB), 7.5, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
];
const slipIn = back([(sA[0] + sB[0]) / 2, (sA[1] + sB[1]) / 2]);

const HALF = [
  // ================= ground (Alpha's half)
  B(-P.cutX, P.cutX, FL, 0, P.strip, -P.track[1], snow({ tag: 'station-strip' })),
  B(P.crossing[0], P.square[0], FL, 0, P.backSt[0], P.strip, snow({ tag: 'village' })),
  B(P.square[0], P.square[1], FL, 0, P.backSt[0], P.strip, setts({ tag: 'square' })),
  B(P.square[1], P.kerb, FL, 0, P.backSt[0], P.northQuay[2], snow({ tag: 'village' })),
  B(-2.2, P.southQuay[0][0], FL, 0, -45.5, P.backSt[0], snow({ tag: 'coop-yard' })),
  B(P.southQuay[0][0], P.kerb, FL, 0, P.southQuay[0][3], P.backSt[0], snow({ tag: 'coop-yard' })),
  // harbour: north quay, the basin quay, the timber jetty, the breakwater, the co-op quay (stepped corner)
  bx(P.northQuay, FL, 0, quay({ tag: 'north-quay' })),
  ...BASIN,
  R([slipIn[0] + slipDir[0] * 6.4, -1.25, slipIn[1] + slipDir[1] * 6.4], [slipIn[0], -0.1, slipIn[1]], 2.8,
    { tag: 'slipway', color: '#8f918f', pattern: PATTERN.concrete }),
  edgeBox(P.breakwater[0], P.breakwater[1], 2.6, FL, 0.25, 1, { tag: 'breakwater', color: '#9d9a93', pattern: PATTERN.concrete }),
  ...P.southQuay.map((r) => bx(r, FL, 0, quay({ tag: 'coop-quay' }))),
  // tunnel portal capping the cut (the headland beyond is scenery)
  B(P.cutX, P.cutX + 1.5, FL, 7.5, -8.5, 8.5, { tag: 'portal', color: K.portal, pattern: SURF.setts, roof: true }),
  // island platform end ramp (down between the tracks, stopping short of the level crossing at x 18.5)
  R([I.x + 2.3, 0, 0], [I.x, I.y, 0], I.z * 2, timber({ tag: 'island-ramp', pattern: PATTERN.rampboard })),

  // ================= station side: the side platform (5.6 m deep), ramps at both ends, steps up from the forecourt
  // (the railcars are stage movers now: LAYOUT.movers below, src/game/movers.js)
  B(S.x0, S.x1, 0, S.y, S.z0, S.z1, timber({ tag: 'side-platform' })),
  R([S.x1 + 2.3, 0, -8.6], [S.x1, S.y, -8.6], 4.0, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  R([S.x0 - 2.3, 0, -8.6], [S.x0, S.y, -8.6], 4.0, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  ...P.steps.map((x) => R([x, 0, S.z0 - 2.7], [x, S.y, S.z0], 3.6, stair({ tag: 'platform-steps' }))),

  // ================= Alpha's overpass (the +x one): the deck over the whole cut and its three stairs down the outer edge
  B(OP.x0, OP.x1, OP.y - OP.t, OP.y, -OP.z, OP.z, timber({ tag: 'overpass' })),
  ...OP.stairs.map(opStair),

  // ================= village buildings (tops off-limits), some off the street grid
  B(P.station[0], P.station[1], 0, 3.8, P.station[2], P.station[3], bldg(K.wall, { tag: 'station' })),
  bt(P.bath, 0, bldg(K.plaster, { tag: 'bathhouse' })),
  bt(P.store, 0, bldg(K.wall, { tag: 'store' })),

  // ================= hillside: T1 (1.3) stepping along the road, T2 (2.6) by the co-op, their steps, the houses on them
  ...P.T1.map((r) => bx(r, FL, P.y1, setts({ tag: 'T1', color: K.stone }))),
  // (T2's long wall over the back street carries the village's painted welcome mural — murals.js)
  ...P.T2.map((r, i) => bx(r, FL, P.y2, setts({ tag: 'T2', color: K.stone, ...(i === 0 ? { mural: [{ n: [0, 0, 1], id: MURAL.welcome }] } : {}) }))),
  R([-29.5, 0, -7.6], [-29.5, P.y1, P.strip], 2.4, stair({ tag: 'T1-steps' })),
  R([-28.5, P.y1, -24.8], [-28.5, P.y2, P.T2[1][3]], 2.4, stair({ tag: 'T2-steps' })),
  bx(P.cottage, P.y2, P.y2 + 3.2, bldg(K.cedar, { tag: 'cottage' })),
  // the hill's retaining walls along the terraces' outer edges (ishigaki: dry stone, snow on top; off-limits tops)
  ...P.hillWalls.map(([x0, x1, z0, z1, y1]) => B(x0, x1, FL, y1, z0, z1, { tag: 'hill-wall', color: '#8f8a80', pattern: SURF.setts, roof: true })),
  // hill houses stepping up behind T2 and the spawn (out of play; they cut the corner behind the co-op)
  B(-33.5, -9, FL, 5.4, -40.5, -37.2, bldg(K.plaster, { tag: 'hill-house' })),
  B(-17.5, -9, FL, 5.8, -44, -40.5, bldg(K.cedar, { tag: 'hill-house' })),
  B(-12.5, -9, FL, 6.2, -47, -44, bldg(K.plaster, { tag: 'hill-house' })),

  // ================= the Fishermen's Co-op: warehouse behind, spawn deck, grand stair, loading dock, quay ramp
  B(-11, 11, FL, 8, -48, -45.5, bldg(K.wall, { tag: 'coop' })),
  // (its harbour-side wall is the warehouse's boarded side: not inkable — the quay ramp is the way up from the yard)
  B(DK.x0, DK.x1, FL, DK.y - 0.2, DK.z0 - 0.1, DK.z1, { tag: 'spawn-body', color: K.timber, pattern: PATTERN.weatherboard, noPaint: [[1, 0, 0]] }),
  B(DK.x0, DK.x1, DK.y - 0.2, DK.y, DK.z0, DK.z1, { tag: 'spawn', color: K.spawn, pattern: PATTERN.spawn }),
  R([0, 0, -29.5], [0, DK.y, DK.z1], 4.4, stair({ tag: 'grand-stair' })),
  B(DO.x0, DO.x1, 0, DO.y, DO.z0, DO.z1, timber({ tag: 'dock' })),
  B(P.netStore[0], P.netStore[1], 0, 3.2, P.netStore[2], P.netStore[3], bldg(K.wall, { tag: 'net-store' })),
  R([16.9, 0, -42.4], [DK.x1, DK.y, -42.4], 3.0, timber({ tag: 'quay-ramp', pattern: PATTERN.rampboard })),
];

// ---- Zone Control: the centre = the middle of the island platform and both trackbeds beside it; the side zone = the
// village square (Alpha's; Bravo's is the mirror)
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const ZONES = {
  center: [{ poly: rect(-5, 5, -P.track[1], P.track[1]), y0: -0.2, y1: 1.2 }],
  side: { poly: rect(-5, 5, -27, -18), y0: -0.2, y1: 0.4 },
};

// ---- Tower Command: "the tower rides the railway" (drawn on Bravo's half, Alpha's goal): off the island platform onto
// Bravo's track, along the rails to the level crossing (checkpoint 1), up the hillside road, back along the back street
// past the square (checkpoint 2 at its corner), up onto the co-op's loading dock
const TX = -P.roadX, TZ = -P.backZ, GX = -7.5;
const TOWER = {
  path: [[0, I.y, 0], [0, 5.0], [TX, 5.0], [TX, TZ], [GX, TZ], [GX, 31.8]],
  checkpoints: [[TX, 5.0], [8, TZ]],
  yaw: 0,
};

// ---- the stage gimmick: the county railcars (stage movers, src/game/movers.js). Alpha's car waits at the east half of
// the station on Alpha's track, Bravo's (its twin) at the west half of Bravo's: every 25 s one of them has just pulled
// across to the other half (a 20 s wait, a 5 s move through the middle, eased in and out). A parked car walls off its
// half of the platform edge and trackbed — the crossings over that track there — and opens the other half; the two
// are always each other's mirror, so both teams face the same station. Level-crossing lamps flash and the bells ring
// from 4 s before a departure until the car stops; the horn blows 1.2 s before it moves. Tower Command: parked (the
// tower rides the inner half of each track out to the crossings, so the cars wait at the far halves all match);
// Boss Battle: the trains have left (HULLBREAKER roams the whole cut).
const TZc = (P.track[0] + P.track[1]) / 2;
const CAR = P.car;
// the crossing's warning lamps (railway.js calamari_crossing units: at x crossing[0] − 0.7, z ±7.4, lamps ±0.3 at 2.25
// on the face toward the road): [x, y, z, yaw, pair]
const UX = P.crossing[0] - 0.7;
const CROSSING_LAMPS = [[UX + 0.3, 2.25, -7.4 - 0.175, Math.PI, 0], [UX - 0.3, 2.25, -7.4 - 0.175, Math.PI, 1],
  [UX - 0.3, 2.25, 7.4 + 0.175, 0, 0], [UX + 0.3, 2.25, 7.4 + 0.175, 0, 1]];
const MOVERS = {
  mirror: true,
  modes: { tower: 'park', boss: 'off' },
  timetable: { first: 20, dwell: 20, move: 5, warn: 4, horn: 1.2 },
  cars: [{
    id: 'kiha101', stops: [[CAR.stop, -TZc], [-CAR.stop, -TZc]], y: 0, size: [CAR.L, CAR.h, CAR.W], roof: true,
    mesh: { type: 'calamari_railcar', L: CAR.L, W: CAR.W, floor: CAR.floor, h: CAR.h, number: 'KIHA 101', dest: 'INKOPOLIS' },
    twinMesh: { number: 'KIHA 102', dest: 'SHIOKARA BAY' },
    sounds: { horn: 'train_horn', run: 'train_run' },
  }],
  signals: { lamps: CROSSING_LAMPS, bells: [[P.roadX, 2.6, 0]], bell: 'crossing_bell' },
};

const CALAMARI = {
  id: 'calamari',
  bounds: { minX: -34, maxX: 34, minZ: -48, maxZ: 48 },
  spawnPads: [P.pad, [-P.pad[0], P.pad[1], -P.pad[2]]],
  spawnBarrier: 4.2,
  // the world round it: no Inkopolis bay; our own hills, headlands, village beyond, breakwater, mountains (backdrop.js);
  // snow on the land (a low snow line and a heavy dusting), gentle snowfall, stars at dusk. A cold, clear winter day —
  // a low white sun, a pale blue sky, cool shadows off the snow, a slate sea — and a deep-blue dusk with warm windows.
  env: {
    backdrop: buildBackdrop,
    bay: false, boats: false, edge: 'none', stars: true,
    snow: { line: 9, cover: 0.72 },
    weather: { snow: { count: 2000, fall: 0.85, size: 0.055 } },
    theme: {
      all: { seaCrest: '#9fbcc0', foam: '#f4f8fb' },
      day: {
        sunAz: 208, sunEl: 24, sunColor: '#fff6ea', sunIntensity: 3.0, skySun: 2.5,
        hemiSky: '#bcd2f0', hemiGround: '#d6dde6', hemiGroundK: 2.0, hemiIntensity: 0.5, envK: 0.5,
        zenith: '#3f6fae', skyMid: '#86aad2', horizon: '#dde7f0', ground: '#7f98ab',
        horizonGlow: '#fff3e2', horizonGlowK: 0.08, glowColor: '#fff4e0',
        cloudLit: '#ffffff', cloudShade: '#9eacc0', cloud: [0.5, 1.0, 1.0, 0.52],
        seaDeep: '#1e3a4c', seaShallow: '#3a6a74', waveStrength: 0.9,
        haze: [1 / 1500, 0.9, 240], fog: [25, 700],
        grade: { uExposure: 0.9, uSat: 0.94, uVib: 0.08, uContrast: 1.07, uLift: 0.0, uVignette: 0.2, uShadowTint: [0.88, 0.96, 1.14], uHighTint: [1.0, 1.0, 1.0] },
      },
      sunset: {
        sunAz: 214, sunEl: 7, sunColor: '#ffae70', sunIntensity: 2.6, skySun: 3.2,
        hemiSky: '#4a6cc4', hemiGround: '#7d93c8', hemiGroundK: 1.6, hemiIntensity: 0.66, envK: 0.42,
        zenith: '#101c4a', skyMid: '#324a8c', horizon: '#e9a27e', ground: '#34426e',
        horizonGlow: '#ff9a62', horizonGlowK: 0.5, glowColor: '#ffb070',
        cloudLit: '#ffc2a0', cloudShade: '#48558f',
        seaDeep: '#101a3a', seaShallow: '#26406a', seaCrest: '#6f8fc0',
        grade: { uExposure: 1.1, uSat: 1.0, uVib: 0.1, uContrast: 1.06, uLift: 0.01, uVignette: 0.26, uShadowTint: [0.84, 0.95, 1.22], uHighTint: [1.04, 1.0, 0.94], bloom: [0.45, 0.55, 1.7] },
      },
    },
  },
  single: SINGLE,
  half: HALF,
  zones: ZONES,
  tower: TOWER,
  movers: MOVERS,
  // match intro: high over the station (the footbridges, the railcars, the canopy), then back down to the co-op deck
  intro: { from: [14, 13, 12], lookFrom: [0, 3, -2], toBack: 3.0 },
  // stage-select picture: from high on Alpha's hill across the whole village — the bath house's steaming chimney, the
  // square, the station and its railcars, the footbridges, the level crossing and the tunnel — to Bravo's co-op and hill
  art: { from: [-40, 22, -46], look: [2, 1.5, 0], fov: 58 },
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = CALAMARI;
