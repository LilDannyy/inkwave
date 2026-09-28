// Calamari County — stage layout (src/world/stages/calamari/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, env (this file)   props.js    prop pack + placements
//   surfaces.js  stage surface materials (texlib)                       murals.js   stage decals / signage
//   backdrop.js  the far scenery (snowy hills, the coves, the headlands, the village beyond)
import { PATTERN, B, R } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';

// ------------------------------------------------------------------------------------------------------------
// Calamari County — the Squid Sisters' home village, at the far end of the line out of Inkopolis: a snowbound fishing
// village on a neck of land between two coves, the single-track-each-way railway running through the middle of it
// between two headland tunnels. Winter: snow on every roof, rime on the quays, steam off the bath house.
// Alpha at −Z (the half list), Bravo is the 180° twin. Plan (Alpha's half; Alpha looks toward +Z, so its left is +X):
//   • mid, the RAILWAY CUT (|z| < 6.6, full width): Calamari County Station's island platform (1.0) under a long
//     timber canopy between the two tracks (trackbeds at 0), a local railcar waiting at the platform on each track
//     (Alpha's at the +x end, Bravo's at the −x end: 3.4 m of cover, roofs off-limits), a covered timber footbridge on
//     each side (deck 4.3: the high ground over mid) from the side platform over its track onto the island platform, a
//     level crossing at each end (|x| 15.5 … 19.5) and the tunnel portals capping the cut (|x| 25.5)
//   • station side (z −10.4 … −6.6): the side platform (1.0) with the station building behind it, ramps at both ends
//   • right lane (−X) HILLSIDE: the crossing road (0) up past the bath house, the snowy hillside terraces above it
//     (T1 1.3, stone steps from the crossing; T2 2.6 by the spawn, overlooking the square)
//   • mid lane: the station forecourt → the village square (post box, the side zone) → the Fishermen's Co-op
//   • left lane (+X) HARBOUR: the stone quay along the cove, boats and fish boxes, the general store's back
//   • spawn: the covered upper deck of the Fishermen's Co-op warehouse (3.4): grand stair to the square, a timber ramp
//     down to the quay, drops onto T2 (0.8) and the loading dock (1.0)
// Heights: 0 streets / quay / trackbeds · 1.0 platforms, loading dock · 1.3 T1 · 2.6 T2 · 3.4 spawn, railcar tops
// (off-limits) · 4.3 footbridge decks.
// ------------------------------------------------------------------------------------------------------------

// ---- the plan (shared with props.js: dressing is placed from the same numbers)
export const P = {
  // railway cut
  track: [3.4, 6.6],            // a track band |z| 3.4 … 6.6 (Alpha's at −z); the island platform |z| < 3.4
  cutX: 25.5,                   // the trackbed runs |x| < 25.5, the tunnel portals beyond
  island: { x: 13, z: 3.4, y: 1.0 },
  side: { x0: -14, x1: 14, z0: -10.4, z1: -6.6, y: 1.0 },
  crossing: [-20, -15.5],       // Alpha's level crossing + hillside road (x); Bravo's is the mirror (x 15.5 … 20)
  // Alpha's railcar on Alpha's track (x 1.6 … 15); Bravo's is its mirror
  train: { x0: 1.6, x1: 15, z0: -6.45, z1: -3.55, h: 3.4 },
  // Alpha's footbridge (hillside side): deck x −11.4 … −9.0, stairs x −9.0 → −1.5 (side platform z −9.3, island z −2.3)
  bridge: { x0: -11.4, x1: -9.0, y: 4.3, t: 0.4, z0: -10.2, z1: -1.4, foot: -1.5, stairW: 1.8, s1: -9.3, s2: -2.3 },
  // village
  station: [-6, 2, -14.6, -10.4],            // Alpha's station building (x0, x1, z0, z1)
  platHouse: [-15.5, -9, -15, -10.4],        // the house behind the platform's west end
  bath: [-15.5, -7, -26, -18],               // bath house
  store: [6.5, 13.5, -26, -19.5],            // general store (front on the square) / fish shop (front on the quay)
  post: [6.5, 11.5, -16.5, -10.4],           // post office
  square: [-7, 6.5, -29.5, -14.6],           // the open plaza: forecourt, square, back street
  backSt: [-29.5, -26],                      // the back street (z) from the hillside road to the quay
  T1: { x0: -26, x1: -20, z0: -29.5, z1: -10.4, y: 1.3 },
  T2: { x0: -26, x1: -2.2, z0: -37.2, z1: -29.5, y: 2.6 },
  // Fishermen's Co-op
  deck: { x0: -9, x1: 9, z0: -45.5, z1: -37.2, y: 3.4 },
  pad: [0, 3.4, -41.3],
  dock: { x0: 2.2, x1: 10, z0: -37.2, z1: -29.5, y: 1.0 },
  netStore: [10, 14, -37.2, -29.5],
  // quay edge (x) by z band (Alpha's half): the cove side
  quay: [[-48, -37, 24], [-37, -27, 21.5], [-27, -14, 24], [-14, -6.6, 25.5]],
};

const K = {
  snow: '#dfe3e8', ballast: '#b9bcc0', platform: '#8a7866', timber: '#6d5543', stone: '#b7b3ab', setts: '#a9a6a0',
  wall: '#e8e2d4', plaster: '#ece6d8', dark: '#4a3a2e', spawn: '#eae6de', train: '#d9d4c4', portal: '#8f8b84',
};
const snow = (o = {}) => ({ color: K.snow, pattern: PATTERN.concrete, ...o });
const setts = (o = {}) => ({ color: K.setts, pattern: PATTERN.pavers, ...o });
const timber = (o = {}) => ({ color: K.platform, pattern: PATTERN.planks, ...o });
const bldg = (c, o = {}) => ({ color: c, pattern: PATTERN.weatherboard, roof: true, ...o });
const stair = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
const FL = -1.6;   // deck slabs reach down to the sea (the environment reads them as the stage's footprint)

const { island: I, side: S, train: TR, bridge: BR, T1, T2, deck: DK, dock: DO } = P;
const bridgeRun = (z) => R([BR.foot, 1.0, z], [BR.x1, BR.y, z], BR.stairW, { tag: 'bridge-stair', color: K.timber, pattern: PATTERN.treads });

const SINGLE = [
  // ================= the railway cut: snowy ballast the full width, the island platform between the tracks
  B(-P.cutX, P.cutX, FL, 0, -P.track[1], P.track[1], snow({ tag: 'trackbed', color: K.ballast })),
  B(-I.x, I.x, 0, I.y, -I.z, I.z, timber({ tag: 'island' })),
];

const HALF = [
  // ================= ground (Alpha's half): the village land and the quay stepping along the cove
  B(-26, 14, FL, 0, -48, -P.track[1], setts({ tag: 'village' })),
  ...P.quay.map(([z0, z1, x]) => B(14, x, FL, 0, z0, z1, setts({ tag: 'quay', color: K.stone }))),
  B(24, 26.5, FL, 0, -21.5, -18.5, setts({ tag: 'breakwater', color: K.stone })),
  // tunnel portal capping the cut (the headland beyond is scenery)
  B(P.cutX, 27, FL, 7.5, -8.5, 8.5, { tag: 'portal', color: K.portal, pattern: PATTERN.concrete, roof: true }),
  // island platform end ramp (down between the tracks)
  R([I.x + 2.4, 0, 0], [I.x, I.y, 0], I.z * 2, timber({ tag: 'island-ramp', pattern: PATTERN.rampboard })),

  // ================= station side: side platform, ramps at both ends, the railcar on Alpha's track
  B(S.x0, S.x1, 0, S.y, S.z0, S.z1, timber({ tag: 'side-platform' })),
  R([S.x1 + 2.4, 0, -8.5], [S.x1, S.y, -8.5], 3.8, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  R([S.x0 - 2.4, 0, -8.5], [S.x0, S.y, -8.5], 3.8, timber({ tag: 'side-ramp', pattern: PATTERN.rampboard })),
  B(TR.x0, TR.x1, 0, TR.h, TR.z0, TR.z1, { tag: 'railcar', color: K.train, pattern: PATTERN.hullpaint, roof: true, noPaint: SIDES }),

  // ================= Alpha's footbridge: stair up from the side platform, deck over the track, stair down to the island
  bridgeRun(BR.s1),
  bridgeRun(BR.s2),
  B(BR.x0, BR.x1, BR.y - BR.t, BR.y, BR.z0, BR.z1, timber({ tag: 'bridge-deck' })),
  B(BR.x0, BR.x0 + 0.2, BR.y, BR.y + 0.95, BR.z0, BR.z1, bldg(K.timber, { tag: 'bridge-wall', roof: false })),
  B(BR.x1 - 0.2, BR.x1, BR.y, BR.y + 0.95, BR.s1 + BR.stairW / 2, BR.s2 - BR.stairW / 2, bldg(K.timber, { tag: 'bridge-wall', roof: false })),

  // ================= village buildings (tops off-limits)
  B(P.station[0], P.station[1], 0, 3.2, P.station[2], P.station[3], bldg(K.wall, { tag: 'station' })),
  B(P.platHouse[0], P.platHouse[1], 0, 3.4, P.platHouse[2], P.platHouse[3], bldg(K.plaster, { tag: 'house' })),
  B(P.bath[0], P.bath[1], 0, 3.6, P.bath[2], P.bath[3], bldg(K.plaster, { tag: 'bathhouse' })),
  B(P.store[0], P.store[1], 0, 3.4, P.store[2], P.store[3], bldg(K.wall, { tag: 'store' })),
  B(P.post[0], P.post[1], 0, 3.0, P.post[2], P.post[3], bldg(K.plaster, { tag: 'post-office' })),

  // ================= hillside: T1 (1.3) along the crossing road, T2 (2.6) by the co-op, their steps, the hill wall
  B(T1.x0, T1.x1, 0, T1.y, T1.z0, T1.z1, setts({ tag: 'T1', color: K.stone })),
  B(T2.x0, T2.x1, 0, T2.y, T2.z0, T2.z1, setts({ tag: 'T2', color: K.stone })),
  R([-22.5, 0, -7.2], [-22.5, T1.y, T1.z1], 2.4, stair({ tag: 'T1-steps' })),
  R([-23.5, T1.y, -26], [-23.5, T2.y, T2.z1], 3, stair({ tag: 'T2-steps' })),
  B(-26, -22, T1.y, 4.6, -21, -15, bldg(K.plaster, { tag: 'cottage' })),
  B(-27, -26, 0, 4.4, -47, -8.5, bldg(K.stone, { tag: 'hill-wall', pattern: PATTERN.stonestep })),

  // ================= the Fishermen's Co-op: warehouse behind, spawn deck, grand stair, loading dock, quay ramp
  B(-11, 11, 0, 8, -48, -45.5, bldg(K.wall, { tag: 'coop' })),
  B(DK.x0, DK.x1, 0, DK.y - 0.2, DK.z0, DK.z1, { tag: 'spawn-body', color: K.timber, pattern: PATTERN.weatherboard }),
  B(DK.x0, DK.x1, DK.y - 0.2, DK.y, DK.z0, DK.z1, { tag: 'spawn', color: K.spawn, pattern: PATTERN.spawn }),
  R([0, 0, P.backSt[0]], [0, DK.y, DK.z1], 4.4, stair({ tag: 'grand-stair' })),
  B(DO.x0, DO.x1, 0, DO.y, DO.z0, DO.z1, timber({ tag: 'dock' })),
  B(P.netStore[0], P.netStore[1], 0, 3.2, P.netStore[2], P.netStore[3], bldg(K.wall, { tag: 'net-store' })),
  R([16.7, 0, -43.3], [DK.x1, DK.y, -43.3], 3.0, timber({ tag: 'quay-ramp', pattern: PATTERN.rampboard })),
  B(-26, DK.x0, 0, 5.2, -47, DK.z1, bldg(K.plaster, { tag: 'hill-houses' })),
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
// past the square (checkpoint 2), up onto the co-op's loading dock
const TX = -(P.crossing[0] + P.crossing[1]) / 2 + 0.35, TZ = -(P.backSt[0] + P.backSt[1]) / 2, GX = -5.5;
const TOWER = {
  path: [[0, I.y, 0], [0, 5.0], [TX, 5.0], [TX, TZ], [GX, TZ], [GX, 31.2]],
  checkpoints: [[TX, 5.0], [8, TZ]],
  yaw: 0,
};

const CALAMARI = {
  id: 'calamari',
  bounds: { minX: -27, maxX: 27, minZ: -48, maxZ: 48 },
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
