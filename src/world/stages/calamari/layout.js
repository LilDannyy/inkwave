// Calamari County — stage layout (src/world/stages/calamari/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, env (this file)   props.js    prop pack + placements
//   surfaces.js  stage surface materials (texlib)                       murals.js   stage decals / signage
//   backdrop.js  the far scenery (snowy hills, the coves, the headlands, the village beyond)
import { PATTERN, B, R, O } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';

// ------------------------------------------------------------------------------------------------------------
// Calamari County — the Squid Sisters' home village, at the far end of the line out of Inkopolis: a snowbound fishing
// village on a neck of land between two coves, the railway running through the middle of it between two headland
// tunnels. Winter: snow on every roof, rime on the quays, steam off the bath house.
// Alpha at −Z (the half list), Bravo is the 180° twin. Plan (Alpha's half; Alpha looks toward +Z, so its left is +X):
//   • mid, the RAILWAY CUT (|z| < 6.6, full width): Calamari County Station's island platform (1.0) under a long
//     timber canopy between the two tracks (trackbeds at 0), a local railcar waiting at the platform on each track
//     (Alpha's at the +x end, Bravo's at the −x end: 3.4 m of cover, roofs off-limits), a covered timber footbridge on
//     each side (deck 4.3: the high ground over mid) from the side platform over its track onto the island platform, a
//     level crossing at each end (|x| 15.5 … 20) and the tunnel portals capping the cut (|x| 25.5)
//   • station side (z −11 … −6.6): the side platform (1.0) with the station building behind it, ramps at both ends
//   • right lane (−X) HILLSIDE: the crossing road (0) up past the bath house, the hillside terraces stepping up beside
//     it (T1 1.3 with the Cuttlefish cottage; T2 2.6 by the co-op, overlooking the square), houses climbing the hill
//   • mid lane: the station forecourt → the village square (post box, bus shelter, the side zone) → the co-op stair
//   • left lane (+X) HARBOUR: the basin quay along the fishing-boat basin that cuts into the village (its edge at an
//     angle, a slipway, a timber jetty), the north quay with the breakwater, the co-op's quay behind
//   • spawn: the covered upper deck of the Fishermen's Co-op warehouse (3.4): grand stair to the square, a timber ramp
//     down to the co-op quay, drops onto T2 (0.8) and the loading dock (1.0)
// The village grew: buildings of different sizes, several turned a few degrees off the street grid, the lanes between
// them bending and narrowing; the outline follows the coast (the basin, the breakwater, the stepped co-op quay) and the
// hill (terraces stepping in and out, the hill houses cutting the corner behind the spawn).
// Heights: 0 streets / quays / trackbeds · −0.1 the basin quay (a kerb down from the street) · 1.0 platforms, loading
// dock · 1.3 T1 · 2.6 T2 · 3.4 spawn, railcar tops (off-limits) · 4.3 footbridge decks.
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
export const P = {
  // railway cut
  track: [3.4, 6.6],            // a track band |z| 3.4 … 6.6 (Alpha's at −z); the island platform |z| < 3.4
  cutX: 25.5,                   // the trackbed runs |x| < 25.5, the tunnel portals beyond
  island: { x: 13, z: 3.4, y: 1.0 },
  side: { x0: -14, x1: 14, z0: -10.4, z1: -6.6, y: 1.0 },
  strip: -11,                   // the station strip (z −11 … −6.6) runs the full width at street level
  crossing: [-20, -15.5],       // Alpha's level crossing + hillside road (x); Bravo's is the mirror (x 15.5 … 20)
  // Alpha's railcar on Alpha's track (x 1.6 … 15); Bravo's is its mirror
  train: { x0: 1.6, x1: 15, z0: -6.45, z1: -3.55, h: 3.4 },
  // Alpha's footbridge (hillside side): deck x −11.4 … −9.0, stairs x −9.0 → −1.5 (side platform z −9.3, island z −2.3)
  bridge: { x0: -11.4, x1: -9.0, y: 4.3, t: 0.4, z0: -10.2, z1: -1.4, foot: -1.5, stairW: 1.8, s1: -9.3, s2: -2.3 },
  // village (buildings: [cx, cz, w (x), d (z), deg, height])
  station: [-6, 2, -14.6, -10.4],                 // station building (x0, x1, z0, z1)
  houseA: [-12.45, -12.9, 5.7, 5.0, 0, 3.5],      // the house behind the platform's west end
  bath: [-11.7, -22.1, 7.0, 7.4, 4, 3.6],         // bath house
  store: [9.05, -22.3, 5.2, 7.0, -5, 3.4],        // general store (front on the square) / fish shop (back on the quay)
  post: [7, 11.4, -14.9, -10.4],                  // post office (x0, x1, z0, z1)
  square: [-7.7, 6.2, -26, -15],                  // the square (x0, x1, z0, z1)
  backSt: [-30, -26],                             // the back street (z) from the hillside road to the quay
  T1: [[-26.5, -20, -17.5, -11], [-23.2, -20, -24, -17.5], [-25.5, -20, -28.5, -24]],   // T1 (1.3) pieces (x0, x1, z0, z1)
  T2: [[-20, -2.2, -37.2, -30], [-24.5, -20, -37.2, -28.5]],                            // T2 (2.6)
  y1: 1.3, y2: 2.6,
  cottage: [-26.5, -23.2, -17, -12.5],            // the Cuttlefish cottage on T1
  t2house: [-24.5, -20.6, -37.2, -33.4],          // a house on T2's west end
  // Fishermen's Co-op
  deck: { x0: -9, x1: 9, z0: -45.5, z1: -37.2, y: 3.4 },
  pad: [0, 3.4, -41.3],
  dock: { x0: 2.2, x1: 10, z0: -37.2, z1: -29.5, y: 1.0 },
  netStore: [10, 12, -37.2, -29.5],
  // harbour (Alpha's cove side): the basin quay's water edge runs A → B at an angle; the slipway cuts it
  kerb: 12,                                       // the village street ends at x 12; the basin quay is 0.1 lower
  basinEdge: [[18.4, -16.4], [15.9, -38.6]],
  slip: { t0: 0.44, t1: 0.575 },                  // the slipway's gap along the basin edge (fractions of A → B)
  northQuay: [12, 25.5, -17, -11],
  breakwater: [[22.6, -16.6], [26.9, -21.6]],
  southQuay: [[12, 18.6, -44.8, -38], [12, 15.4, -47, -44.8]],
};
// hillside road centre (Alpha) and the back street centre: the tower's corners
P.roadX = (P.crossing[0] + P.crossing[1]) / 2 - 0.35;
P.backZ = (P.backSt[0] + P.backSt[1]) / 2 + 0.25;

const K = {
  snow: '#dfe3e8', ballast: '#b9bcc0', platform: '#8a7866', timber: '#6d5543', stone: '#b7b3ab', setts: '#a9a6a0',
  quay: '#a7a39c', wall: '#e8e2d4', plaster: '#ece6d8', dark: '#4a3a2e', spawn: '#eae6de', train: '#d9d4c4', portal: '#8f8b84',
  cedar: '#5d4636',
};
const snow = (o = {}) => ({ color: K.snow, pattern: PATTERN.concrete, ...o });
const setts = (o = {}) => ({ color: K.setts, pattern: PATTERN.pavers, ...o });
const quay = (o = {}) => ({ color: K.quay, pattern: PATTERN.pavers, ...o });
const timber = (o = {}) => ({ color: K.platform, pattern: PATTERN.planks, ...o });
const bldg = (c, o = {}) => ({ color: c, pattern: PATTERN.weatherboard, roof: true, ...o });
const stair = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
const FL = -1.6;   // ground slabs reach down to the sea (the environment reads their tops as the stage's footprint)

const { island: I, side: S, train: TR, bridge: BR, deck: DK, dock: DO } = P;
const bridgeRun = (z) => R([BR.foot, 1.0, z], [BR.x1, BR.y, z], BR.stairW, { tag: 'bridge-stair', color: K.timber, pattern: PATTERN.treads });
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
  edgeBox(bA, sA, 7.4, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
  edgeBox(sB, bB, 7.4, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
  // the slipway's head: the basin quay behind its notch; the ramp runs from there down into the water
  edgeBox(back(sA), back(sB), 5.5, FL, -0.1, 1, quay({ tag: 'basin-quay' })),
];
const slipIn = back([(sA[0] + sB[0]) / 2, (sA[1] + sB[1]) / 2]);

const HALF = [
  // ================= ground (Alpha's half)
  B(-P.cutX, P.cutX, FL, 0, P.strip, -P.track[1], setts({ tag: 'station-strip' })),
  B(P.crossing[0], P.kerb, FL, 0, -30, P.strip, setts({ tag: 'village' })),
  B(-2.2, P.kerb, FL, 0, -45.5, -30, setts({ tag: 'coop-yard' })),
  // harbour: north quay, the basin quay, the timber jetty, the breakwater, the co-op quay (stepped corner)
  bx(P.northQuay, FL, 0, quay({ tag: 'north-quay' })),
  ...BASIN,
  R([slipIn[0] + slipDir[0] * 6.4, -1.25, slipIn[1] + slipDir[1] * 6.4], [slipIn[0], -0.1, slipIn[1]], 2.8,
    { tag: 'slipway', color: '#8f918f', pattern: PATTERN.concrete }),
  edgeBox(P.breakwater[0], P.breakwater[1], 2.6, FL, 0.25, 1, { tag: 'breakwater', color: '#9d9a93', pattern: PATTERN.concrete }),
  ...P.southQuay.map((r) => bx(r, FL, 0, quay({ tag: 'coop-quay' }))),
  // tunnel portal capping the cut (the headland beyond is scenery)
  B(P.cutX, 27, FL, 7.5, -8.5, 8.5, { tag: 'portal', color: K.portal, pattern: PATTERN.concrete, roof: true }),
  // island platform end ramp (down between the tracks)
  R([I.x + 2.4, 0, 0], [I.x, I.y, 0], I.z * 2, timber({ tag: 'island-ramp', pattern: PATTERN.rampboard })),

  // ================= station side: side platform, ramps at both ends, steps up from the forecourt, the railcar
  B(S.x0, S.x1, 0, S.y, S.z0, S.z1, timber({ tag: 'side-platform' })),
  R([S.x1 + 2.4, 0, -8.5], [S.x1, S.y, -8.5], 3.8, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  R([S.x0 - 2.4, 0, -8.5], [S.x0, S.y, -8.5], 3.8, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  R([-7.6, 0, -13.1], [-7.6, S.y, S.z0], 2.6, stair({ tag: 'platform-steps' })),
  R([4.5, 0, -13.1], [4.5, S.y, S.z0], 3.4, stair({ tag: 'platform-steps' })),
  B(TR.x0, TR.x1, 0, TR.h, TR.z0, TR.z1, { tag: 'railcar', color: K.train, pattern: PATTERN.hullpaint, roof: true, noPaint: SIDES }),

  // ================= Alpha's footbridge: stair up from the side platform, deck over the track, stair down to the island
  bridgeRun(BR.s1),
  bridgeRun(BR.s2),
  B(BR.x0, BR.x1, BR.y - BR.t, BR.y, BR.z0, BR.z1, timber({ tag: 'bridge-deck' })),
  B(BR.x0, BR.x0 + 0.2, BR.y, BR.y + 0.95, BR.z0, BR.z1, bldg(K.timber, { tag: 'bridge-wall', roof: false, noNav: true })),
  B(BR.x1 - 0.2, BR.x1, BR.y, BR.y + 0.95, BR.s1 + BR.stairW / 2, BR.s2 - BR.stairW / 2, bldg(K.timber, { tag: 'bridge-wall', roof: false, noNav: true })),

  // ================= village buildings (tops off-limits), some off the street grid
  B(P.station[0], P.station[1], 0, 3.2, P.station[2], P.station[3], bldg(K.wall, { tag: 'station' })),
  bt(P.houseA, 0, bldg(K.cedar, { tag: 'house-a' })),
  bt(P.bath, 0, bldg(K.plaster, { tag: 'bathhouse' })),
  bt(P.store, 0, bldg(K.wall, { tag: 'store' })),
  B(P.post[0], P.post[1], 0, 3.0, P.post[2], P.post[3], bldg(K.plaster, { tag: 'post-office' })),

  // ================= hillside: T1 (1.3) stepping along the road, T2 (2.6) by the co-op, their steps, the houses on them
  ...P.T1.map((r) => bx(r, FL, P.y1, setts({ tag: 'T1', color: K.stone }))),
  ...P.T2.map((r) => bx(r, FL, P.y2, setts({ tag: 'T2', color: K.stone }))),
  R([-22, 0, -7.6], [-22, P.y1, P.strip], 2.4, stair({ tag: 'T1-steps' })),
  R([-22, P.y1, -24.8], [-22, P.y2, -28.5], 2.4, stair({ tag: 'T2-steps' })),
  bx(P.cottage, P.y1, 4.5, bldg(K.cedar, { tag: 'cottage' })),
  bx(P.t2house, P.y2, 5.9, bldg(K.plaster, { tag: 't2-house' })),
  // hill houses stepping up behind T2 and the spawn (out of play; they cut the corner behind the co-op)
  B(-24.5, -12, FL, 5.4, -40.5, -37.2, bldg(K.plaster, { tag: 'hill-house' })),
  B(-17.5, -9, FL, 5.8, -44, -40.5, bldg(K.cedar, { tag: 'hill-house' })),
  B(-12.5, -9, FL, 6.2, -47, -44, bldg(K.plaster, { tag: 'hill-house' })),

  // ================= the Fishermen's Co-op: warehouse behind, spawn deck, grand stair, loading dock, quay ramp
  B(-11, 11, FL, 8, -48, -45.5, bldg(K.wall, { tag: 'coop' })),
  B(DK.x0, DK.x1, FL, DK.y - 0.2, DK.z0 - 0.1, DK.z1, { tag: 'spawn-body', color: K.timber, pattern: PATTERN.weatherboard }),
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
const TX = -P.roadX, TZ = -P.backZ, GX = -5.5;
const TOWER = {
  path: [[0, I.y, 0], [0, 5.0], [TX, 5.0], [TX, TZ], [GX, TZ], [GX, 31.2]],
  checkpoints: [[TX, 5.0], [8, TZ]],
  yaw: 0,
};

const CALAMARI = {
  id: 'calamari',
  bounds: { minX: -28, maxX: 28, minZ: -48, maxZ: 48 },
  spawnPads: [P.pad, [-P.pad[0], P.pad[1], -P.pad[2]]],
  spawnBarrier: 4.2,
  env: {
    backdrop: buildBackdrop,
    bay: false, boats: false, edge: 'none', stars: true,
    snow: { line: 40, cover: 0.55 },
    weather: { snow: { count: 2200, fall: 0.9, size: 0.08 } },
  },
  single: SINGLE,
  half: HALF,
  zones: ZONES,
  tower: TOWER,
  intro: { from: [14, 13, 12], lookFrom: [0, 3, -2], toBack: 3.0 },
  art: { from: [30, 24, -34], look: [-2, 1, 2], fov: 60 },
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = CALAMARI;
