// Calamari County — stage prop pack + placements (owner: the calamari stage; see layout.js for the folder contract).
//
// register(D, H): adds this stage's prop builders to the PropKit table D (types prefixed 'calamari_'; H = PACK_HELPERS).
// The builders live in this folder: kit.js (palette, geometry, snow, roofs, lettering), buildings.js (the village's
// houses, the bath house, the station building, the co-op), railway.js, harbour.js, village.js.
// PLACEMENTS: the half list (Alpha's side, z < 0) — every entry is mirrored (x, z) → (−x, −z), rotY + π, unless it
// says `mirror: false` (one-offs that never change play: the Cuttlefish nameplate …).
import { makeKit } from './kit.js';
import { registerBuildings } from './buildings.js';
import { registerRailway } from './railway.js';
import { P } from './layout.js';

const PI = Math.PI, HP = PI / 2, DEG = PI / 180;

export function register(D, H) {
  const KIT = makeKit(D, H);
  registerBuildings(D, H, KIT);
  registerRailway(D, H, KIT);
}

// ================================================================================================ placements
const box4 = (r) => ({ pos: [(r[0] + r[1]) / 2, 0, (r[2] + r[3]) / 2], w: r[1] - r[0], d: r[3] - r[2] });
const turned = (b) => ({ pos: [b[0], 0, b[1]], rotY: b[4] * DEG, w: b[2], d: b[3], h: b[5] });
const at = (o, y) => ({ ...o, pos: [o.pos[0], y, o.pos[2]] });

const BUILDINGS = [
  // Calamari County Station (south exit): forecourt face −Z, platform face +Z
  { type: 'calamari_station', ...box4(P.station), h: 3.2 },
  // the house behind the platform's west end (two storeys, cedar below)
  { type: 'calamari_house', ...turned(P.houseA), style: 'cedar',
    faces: {
      2: [{ t: 'door', x: 1.2, w: 1.5 }, { t: 'win', x: -1.3, w: 1.3, h: 0.9 }, { t: 'kerosene', x: -2.3 }, { t: 'plate', x: 2.35, text: 'ISOBE' }],
      1: [{ t: 'win', x: -1.2, w: 1.2, h: 0.9, sash: true, lit: 1 }, { t: 'meter', x: 1.4 }, { t: 'pipe', x: 2.2 }],
      3: [{ t: 'win', x: 0.5, w: 1.6, h: 0.9 }, { t: 'ac', x: -1.6 }],
    },
    upper: { h: 2.4, inset: 0.25, c: '#e9e3d6', faces: { 2: [{ t: 'win', x: -1, w: 1.4, h: 0.9, sill: 0.8, sash: true, lit: 1.1 }, { t: 'win', x: 1.3, w: 0.9, h: 0.9, sill: 0.8, sash: true }], 1: [{ t: 'win', x: 0, w: 1.4, h: 0.9, sill: 0.8, sash: true }], 3: [{ t: 'win', x: 0, w: 1.2, h: 0.9, sill: 0.8, sash: true, lit: 0.9 }] } },
    hisashi: [2], roof: { f: 1, pitch: 0.55, alongX: true }, snow: [3] },
  // the bath house (sento), entrance on the square
  { type: 'calamari_bathhouse', ...turned(P.bath), door: 1 },
  // the general store (noren on the square) / fish shop (open front on the harbour lane)
  { type: 'calamari_house', ...turned(P.store), style: 'plaster',
    faces: {
      3: [{ t: 'shop', x: 0.3, w: 4.4, h: 2.3, goods: 'veg', noren: { c: K_INDIGO(), n: 5, L: 0.62 } }, { t: 'sign', text: 'TAKOYAMA GENERAL STORE', x: 0.3, at: 2.5, h: 0.2, board: '#3d2d23' }, { t: 'lamp', x: -2.8, at: 2.4 }],
      1: [{ t: 'shop', x: 0.4, w: 4.2, h: 2.2, goods: 'fish', noren: { c: '#2f5d6b', n: 4, L: 0.55 } }, { t: 'sign', text: 'FRESH FISH', x: 0.4, at: 2.35, h: 0.22, board: '#2c4d56' }, { t: 'kerosene', x: -2.9 }],
      0: [{ t: 'win', x: -0.8, w: 1.4, h: 1.0, sash: true, lit: 1 }, { t: 'pipe', x: 2.2 }, { t: 'meter', x: 1.2 }],
      2: [{ t: 'win', x: 0.4, w: 1.2, h: 0.9 }, { t: 'ac', x: -1.5 }],
    },
    upper: { h: 2.5, inset: 0.3, faces: { 3: [{ t: 'win', x: -1.3, w: 1.3, h: 0.9, sill: 0.8, sash: true, lit: 1.1 }, { t: 'win', x: 1.4, w: 1.3, h: 0.9, sill: 0.8, sash: true }], 1: [{ t: 'win', x: 0, w: 1.6, h: 0.9, sill: 0.8, sash: true, lit: 0.9 }], 0: [{ t: 'win', x: 0, w: 1.0, h: 0.9, sill: 0.8, sash: true }] } },
    hisashi: [1, 3], roof: { f: 0.5, pitch: 0.5, alongX: false }, snow: [0] },
  // the post office, front on the cross lane
  { type: 'calamari_house', ...box4(P.post), h: 3.0, style: 'plaster',
    faces: {
      2: [{ t: 'door', x: -0.9, w: 1.6, h: 2.1, lit: 1.3 }, { t: 'win', x: 1.2, w: 1.1, h: 1.0, sash: true, lit: 1.2 }, { t: 'sign', text: 'POST OFFICE', x: 0, at: 2.35, h: 0.2, board: '#a63a32', c: '#f3f1ec' }],
      1: [{ t: 'win', x: 0, w: 1.4, h: 0.9, sash: true }, { t: 'pipe', x: 2.3 }, { t: 'kerosene', x: -1.7 }],
    },
    roof: { f: 0, pitch: 0.45, ov: 0.7 }, snow: [1] },
  // the co-op's net store beside the loading dock
  { type: 'calamari_house', ...box4(P.netStore), h: 3.2, style: 'cedar', plinth: false,
    faces: { 1: [{ t: 'win', x: -2, w: 1.0, h: 0.8, sill: 1.4 }, { t: 'pipe', x: 3.4 }], 3: [{ t: 'sign', text: 'NETS', x: 1.5, at: 2.4, h: 0.2 }] },
    roof: { f: 1, pitch: 0.45, alongX: false, ov: 0.5 } },
  // the Cuttlefish cottage on T1 (its nameplate, anchor and sea chest are one-offs: mirror false)
  at({ type: 'calamari_house', ...box4(P.cottage), h: 3.2, style: 'cedar', wallC: '#5f4a3a',
    faces: { 1: [{ t: 'door', x: -0.9, w: 1.3 }, { t: 'win', x: 1.1, w: 1.2, h: 0.9, lit: 1.1 }], 0: [{ t: 'wood', x: 0.4, w: 2.2 }], 2: [{ t: 'win', x: 0, w: 1.0, h: 0.8 }] },
    roof: { f: 1, pitch: 0.6, alongX: false, ov: 0.7 }, snow: [0, 2] }, P.y1),
  // the house at T2's west end
  at({ type: 'calamari_house', ...box4(P.t2house), h: 3.3, style: 'plaster',
    faces: { 0: [{ t: 'door', x: 0.9, w: 1.4 }, { t: 'win', x: -1.1, w: 1.1, h: 0.9 }, { t: 'kerosene', x: -2.0 }], 1: [{ t: 'win', x: 0, w: 1.3, h: 0.9, sash: true, lit: 1 }] },
    roof: { f: 0.5, pitch: 0.55, alongX: false }, snow: [1] }, P.y2),
  // hill houses stepping up behind T2 and the spawn (their walls rise above T2 / the deck)
  { type: 'calamari_house', pos: [-18.25, 2.6, -38.85], w: 12.5, d: 3.3, h: 2.8, style: 'cedar', plinth: false, faces: { 0: [{ t: 'win', x: -4, w: 1.4, h: 0.9, sill: 0.7, lit: 1 }, { t: 'door', x: 0.2, w: 1.4 }, { t: 'win', x: 3.6, w: 1.4, h: 0.9, sill: 0.7, sash: true, lit: 0.8 }, { t: 'kerosene', x: 5.3 }] }, roof: { f: 1, pitch: 0.55, alongX: true } },
  { type: 'calamari_house', pos: [-13.25, 3.4, -42.25], w: 8.5, d: 3.5, h: 2.4, style: 'plaster', plinth: false, faces: { 0: [{ t: 'win', x: -1.5, w: 1.3, h: 0.9, sill: 0.6, sash: true, lit: 1 }], 1: [{ t: 'win', x: 0, w: 1.0, h: 0.8, sill: 0.8, lit: 1 }] }, upper: { h: 2.3, inset: 0.2, faces: { 1: [{ t: 'win', x: 0, w: 1.0, h: 0.8, sill: 0.7, sash: true }] } }, roof: { f: 0.5, pitch: 0.5, alongX: true } },
  { type: 'calamari_house', pos: [-10.75, 3.4, -45.5], w: 3.5, d: 3, h: 2.8, style: 'cedar', plinth: false, faces: { 1: [{ t: 'win', x: 0, w: 1.0, h: 0.8, sill: 0.8, lit: 1 }] }, roof: { f: 1, pitch: 0.6, alongX: false } },
  // the Fishermen's Co-op (warehouse face at z −45.5; the spawn deck + veranda in front)
  { type: 'calamari_coop', pos: [0, 0, P.deck.z0], w: 22, deckD: P.deck.z1 - P.deck.z0, deckW: P.deck.x1 - P.deck.x0, deckY: P.deck.y },
];
function K_INDIGO() { return '#2d3f63'; }

// ---- the railway
const TZ = -(P.track[0] + P.track[1]) / 2;                 // Alpha's track centre (z −5)
const XR = [P.crossing[0] + P.cutX, P.crossing[1] + P.cutX];  // the crossings' spans along a track (local x from its start)
const BRc = [(P.bridge.x0 + P.bridge.x1) / 2, (P.bridge.z0 + P.bridge.z1) / 2];
const TRAIN = { L: P.train.x1 - P.train.x0, W: P.train.z1 - P.train.z0, floor: P.train.floor, h: P.train.h };
const RAILWAY = [
  { type: 'calamari_track', pos: [-P.cutX, 0, TZ], length: P.cutX * 2, skip: [XR, [2 * P.cutX - XR[1], 2 * P.cutX - XR[0]]] },
  // the railcars (one-offs so each carries its own number / destination; the blocks are mirrored in the layout)
  { type: 'calamari_railcar', pos: [(P.train.x0 + P.train.x1) / 2, 0, TZ], ...TRAIN, number: 'KIHA 101', dest: 'INKOPOLIS', mirror: false },
  { type: 'calamari_railcar', pos: [-(P.train.x0 + P.train.x1) / 2, 0, -TZ], rotY: PI, ...TRAIN, number: 'KIHA 102', dest: 'SHIOKARA BAY', mirror: false },
  // platform edges: the island's south edge (Alpha's track), the side platform's
  { type: 'calamari_platedge', pos: [P.island.x, 0, -P.island.z], rotY: PI, length: P.island.x * 2, y: P.island.y },
  { type: 'calamari_platedge', pos: [P.side.x0, 0, P.side.z1], rotY: 0, length: P.side.x1 - P.side.x0, y: P.side.y },
  // the island canopy (one piece down the platform's spine); Tower Command leaves its middle bay open over the tower
  { type: 'calamari_canopy', pos: [0, P.island.y, 0], spans: [[-10.4, 10.4]], xs: [-10, -6.4, -2.4, 2.4, 6.4, 10], h: 2.9, clockX: 4.2, numbers: [[-8.2, '1'], [8.2, '2']], mirror: false, notIn: 'tower' },
  { type: 'calamari_canopy', pos: [0, P.island.y, 0], spans: [[-10.4, -1.6], [1.6, 10.4]], xs: [-10, -6.4, -2.4, 2.4, 6.4, 10], h: 2.9, clockX: 4.2, numbers: [[-8.2, '1'], [8.2, '2']], mirror: false, onlyIn: 'tower' },
  // name boards: on the island facing Alpha's track, on Alpha's side platform facing it
  { type: 'calamari_nameboard', pos: [11.2, P.island.y, -2.55], rotY: PI },
  { type: 'calamari_nameboard', pos: [11.0, P.side.y, -7.45], rotY: 0, prev: 'SHIOKARA BAY →', next: '← INKOPOLIS' },
  // Alpha's footbridge
  { type: 'calamari_footbridge', pos: [BRc[0], 0, BRc[1]], w: P.bridge.x1 - P.bridge.x0, d: P.bridge.z1 - P.bridge.z0, y: P.bridge.y,
    stairs: [P.bridge.s1, P.bridge.s2].map((z) => ({ z: z - BRc[1], xLow: P.bridge.foot - BRc[0], xTop: P.bridge.x1 - BRc[0], yLow: 1.0, w: P.bridge.stairW })),
    posts: [[-1.3, -3.7, 1.0], [1.3, -3.7, 1.0], [-1.3, 3.7, 1.0], [1.3, 3.7, 1.0], [-1.3, -1.65, 1.0], [-1.3, 1.65, 1.0]] },
  // Alpha's level crossing (x −20 … −15.5) over both tracks; Bravo's is the mirror
  { type: 'calamari_crossing', pos: [(P.crossing[0] + P.crossing[1]) / 2, 0, 0], w: P.crossing[1] - P.crossing[0], reach: P.track[1], tracks: [TZ, -TZ],
    units: [[P.crossing[0] - (P.crossing[0] + P.crossing[1]) / 2 - 0.7, -7.4, PI, -1], [P.crossing[0] - (P.crossing[0] + P.crossing[1]) / 2 - 0.7, 7.4, 0, 1]] },
  // tunnel portals (one-offs: each has its own name)
  { type: 'calamari_portal', pos: [P.cutX, 0, 0], rotY: -HP, w: 17, h: 7.5, bores: [-5, 5], name: 'CAPE TUNNEL', year: '1931', mirror: false },
  { type: 'calamari_portal', pos: [-P.cutX, 0, 0], rotY: HP, w: 17, h: 7.5, bores: [-5, 5], name: 'HILL TUNNEL', year: '1933', mirror: false },
  { type: 'calamari_signal', pos: [22.8, 0, -7.4], rotY: -HP, aspect: 'red' },
];

const ONE_OFFS = [
  // the Cuttlefish cottage's nameplate by its door (Alpha's side only)
];

export const PLACEMENTS = [...BUILDINGS, ...RAILWAY, ...ONE_OFFS];
