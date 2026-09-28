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
import { registerHarbour } from './harbour.js';
import { registerVillage } from './village.js';
import { P } from './layout.js';

const PI = Math.PI, HP = PI / 2, DEG = PI / 180;

export function register(D, H) {
  const KIT = makeKit(D, H);
  registerBuildings(D, H, KIT);
  registerRailway(D, H, KIT);
  registerHarbour(D, H, KIT);
  registerVillage(D, H, KIT);
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

// ---- edges: a run from A to B (world x, z) with the water / drop on its right-hand side (local +Z)
const edge = (type, A, Bp, o = {}) => {
  const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz);
  return { type, pos: [A[0], o.y ?? 0, A[1]], rotY: Math.atan2(-dz, dx), length: L, ...o };
};
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const [bA, bB] = P.basinEdge, sA = lerp2(bA, bB, P.slip.t0), sB = lerp2(bA, bB, P.slip.t1);
const basinRot = Math.atan2(-(bB[1] - bA[1]), bB[0] - bA[0]);   // (the basin quay's frame: local x toward the co-op)
const bwA = P.breakwater[0], bwB = P.breakwater[1], bwL = Math.hypot(bwB[0] - bwA[0], bwB[1] - bwA[1]);
const bwU = [(bwB[0] - bwA[0]) / bwL, (bwB[1] - bwA[1]) / bwL], bwN = [bwU[1], -bwU[0]];   // along the arm, and across it (inward)
const bwTip = [bwB[0] + bwN[0] * 1.3 - bwU[0] * 1.1, bwB[1] + bwN[1] * 1.3 - bwU[1] * 1.1];
const onBasin = (t, off, y = -0.1) => { const p = lerp2(bA, bB, t); return [p[0] - Math.cos(basinRot) * 0 + off * Math.sin(basinRot) * 0 - off * 0.99, y, p[1] + off * 0.14]; };

const HARBOUR = [
  // quay edges: the basin quay (both sides of the slipway), the north quay's shore + east end, the co-op quay's
  edge('calamari_quayedge', bA, sA, { y: -0.1, bollards: [2.5, 7.0], ladders: [5.2], drop: 1.5 }),
  edge('calamari_quayedge', sB, bB, { y: -0.1, bollards: [2.0, 7.5], fenders: 3.0, drop: 1.5 }),
  edge('calamari_quayedge', [25.5, -17], [bA[0] + 0.9, -17], { bollards: [1.6], ladders: [4.2] }),
  edge('calamari_quayedge', [25.5, -8.5], [25.5, -17], { bollards: [3.0, 7.0] }),
  edge('calamari_quayedge', [bB[0] - 0.05, -38], [18.6, -38], { fenders: 0 }),
  edge('calamari_quayedge', [18.6, -38], [18.6, -45.5], { bollards: [1.5, 5.5], ladders: [3.4] }),
  edge('calamari_quayedge', [18.6, -45.5], [15.4, -45.5], { fenders: 0 }),
  edge('calamari_quayedge', [15.4, -45.5], [15.4, -47], { fenders: 0 }),
  edge('calamari_quayedge', [15.4, -47], [11, -47], { fenders: 0 }),
  // the breakwater's light on its head; bollards along it
  { type: 'calamari_harbourlight', pos: [bwTip[0], 0.25, bwTip[1]] },
  { type: 'calamari_quayedge', pos: [bwA[0] + bwN[0] * 2.4, 0.25, bwA[1] + bwN[1] * 2.4], rotY: Math.atan2(-bwU[1], bwU[0]), length: bwL - 2.4, fenders: 0, bollards: [1.5], drop: 1.85 },
  // the slipway: a winch at its head, a boat hauled half up it
  { type: 'calamari_winch', pos: [onBasin((P.slip.t0 + P.slip.t1) / 2, 3.9)[0], -0.1, onBasin((P.slip.t0 + P.slip.t1) / 2, 3.9)[2]], rotY: basinRot - Math.PI / 2 + Math.PI, length: 5 },
  { type: 'calamari_boat', pos: [onBasin((P.slip.t0 + P.slip.t1) / 2, -4.6)[0], -1.62, onBasin((P.slip.t0 + P.slip.t1) / 2, -4.6)[2]], rotY: basinRot + Math.PI / 2 + Math.PI, L: 6.2, name: 'HOSHI MARU', c: '#b8413a' },
  // boats moored in the basin
  { type: 'calamari_boat', pos: [21.6, -1.62, -21.5], rotY: 0.08, L: 7, name: 'KAIYO MARU', c: '#3d7f7a' },
  { type: 'calamari_boat', pos: [20.6, -1.62, -34.2], rotY: Math.PI + 0.12, L: 6.5, name: 'SHOU MARU', c: '#2d3f63' },
  // harbour lane cover: fish boxes, nets, a hauled-up boat on the north quay, a drying rack, co-op quay boxes
  { type: 'calamari_fishboxes', pos: [15.3, -0.1, -20.4], rotY: basinRot, cols: 2, rows: 3, variant: 0 },
  { type: 'calamari_nets', pos: [14.1, -0.1, -24.4], r: 0.8, variant: 0 },
  { type: 'calamari_fishboxes', pos: [14.6, -0.1, -32.4], rotY: basinRot + 0.1, cols: 2, rows: 2, depth: 2, variant: 1 },
  { type: 'calamari_nets', pos: [13.2, -0.1, -36.4], r: 0.7, variant: 1 },
  { type: 'calamari_boat', pos: [21.4, 0, -14.3], rotY: Math.PI / 2, L: 5.6, hauled: true, name: 'KOMA MARU', c: '#c99a3c' },
  { type: 'calamari_rack', pos: [12.8, 0, -12.3], rotY: 0, length: 4.2 },
  { type: 'calamari_fishboxes', pos: [13.6, 0, -40.0], rotY: 0.05, cols: 3, rows: 2, variant: 2 },
  { type: 'calamari_lamppost', pos: [12.5, -0.1, -18.8], rotY: -Math.PI / 2 },
  { type: 'calamari_lamppost', pos: [12.4, -0.1, -29.2], rotY: -Math.PI / 2 },
  { type: 'calamari_lamppost', pos: [23.8, 0, -11.6], rotY: Math.PI },
];

// ---- the railway cut, the platforms, the station forecourt
const STATION = [
  // snowbanks between the tracks beyond the platform ends, at the strip's corners by the portals
  { type: 'calamari_snowbank', pos: [22.4, 0, 0], rotY: 0, length: 3.2, h: 0.95, d: 1.5, variant: 0 },
  { type: 'calamari_snowbank', pos: [-24.4, 0, -8.2], rotY: Math.PI / 2, length: 2.2, h: 0.9, d: 1.3, variant: 1, shovel: true },
  { type: 'calamari_snowbank', pos: [21.6, 0, -9.3], rotY: 0.2, length: 2.4, h: 0.9, d: 1.2, variant: 2 },
  { type: 'calamari_signal', pos: [-23.6, 0, 2.2], rotY: Math.PI / 2, aspect: 'green' },
  // island platform: benches back to back between the canopy posts, a vending machine at its end
  { type: 'calamari_bench', pos: [4.4, P.island.y, -0.3], rotY: Math.PI },
  { type: 'calamari_bench', pos: [8.2, P.island.y, 0.3], rotY: 0 },
  { type: 'calamari_vending', pos: [12.35, P.island.y, 2.3], rotY: -Math.PI / 2, variant: 0 },
  { type: 'calamari_firebuckets', pos: [12.4, P.island.y, -0.6], rotY: -Math.PI / 2 },
  // side platform: vending machine by the steps, payphone, a parcel cart, fire buckets, lamps
  { type: 'calamari_vending', pos: [-8.3, P.side.y, -9.95], rotY: 0, variant: 1 },
  { type: 'calamari_payphone', pos: [-0.9, P.side.y, -10.0], rotY: 0 },
  { type: 'calamari_cart', pos: [10.2, P.side.y, -9.3], rotY: 0.08 },
  { type: 'calamari_firebuckets', pos: [-13.2, P.side.y, -10.1], rotY: 0 },
  { type: 'calamari_lamppost', pos: [-12.8, P.side.y, -7.1], rotY: 0, h: 3.6, arm: 0.6 },
  { type: 'calamari_lamppost', pos: [13.2, P.side.y, -10.0], rotY: Math.PI / 2, h: 3.6, arm: 0.6 },
  { type: 'calamari_fence', pos: [11.8, P.side.y, -10.32], rotY: 0, length: 2.2, h: 1.0 },
  // the forecourt + square: bus shelter, kei truck, post box, pine in its planter, snowbanks, lanterns, notice board
  { type: 'calamari_busstop', pos: [-6.0, 0, -17.35], rotY: 0, w: 2.8 },
  { type: 'calamari_kei', pos: [-1.9, 0, -15.8], rotY: Math.PI / 2 },
  { type: 'calamari_postbox', pos: [2.2, 0, -17.6] },
  { type: 'calamari_tree', pos: [-3.9, 0, -21.3], kind: 'pine', h: 5.2, planter: 1.2, variant: 0 },
  { type: 'calamari_snowbank', pos: [3.5, 0, -23.8], rotY: 0.35, length: 2.6, h: 1.0, d: 1.3, variant: 1, shovel: true },
  { type: 'calamari_lantern', pos: [-1.2, 0, -25.2], h: 1.7 },
  { type: 'calamari_snowman', pos: [4.8, 0, -19.9], rotY: -0.6 },
  { type: 'calamari_vending', pos: [5.55, 0, -16.6], rotY: -Math.PI / 2, variant: 0 },
  { type: 'calamari_noticeboard', pos: [-6.9, 0, -25.7], rotY: Math.PI / 2 + 0.07 },
  { type: 'calamari_lamppost', pos: [-8.9, 0, -15.8], rotY: Math.PI / 2 },
  { type: 'calamari_lamppost', pos: [6.6, 0, -25.6], rotY: -Math.PI / 2 },
  { type: 'calamari_bike', pos: [-2.9, 0, -13.9], rotY: 0.3, variant: 0 },
  { type: 'calamari_bike', pos: [-4.0, 0, -14.1], rotY: 0.25, variant: 2 },
];

// ---- the hillside: road, terraces, the Cuttlefish cottage, T2 by the co-op, the landmark tower
const HILL = [
  { type: 'calamari_snowbank', pos: [-15.95, 0, -13.2], rotY: Math.PI / 2, length: 2.2, h: 0.9, d: 0.9, variant: 2 },
  { type: 'calamari_snowbank', pos: [-15.95, 0, -22.8], rotY: Math.PI / 2, length: 2.4, h: 0.95, d: 0.9, variant: 0, shovel: true },
  { type: 'calamari_lamppost', pos: [-15.8, 0, -17.0], rotY: -Math.PI / 2 },
  { type: 'calamari_lantern', pos: [-21.0, P.y1, -14.6], h: 1.6 },
  { type: 'calamari_bench', pos: [-22.6, P.y1, -21.2], rotY: Math.PI / 2 },
  { type: 'calamari_tree', pos: [-22.4, P.y1, -19.0], kind: 'bare', h: 4.5, variant: 1 },
  { type: 'calamari_snowbank', pos: [-24.6, P.y1, -26.4], rotY: Math.PI / 2, length: 2.2, h: 0.9, d: 1.1, variant: 1 },
  { type: 'calamari_lamppost', pos: [-20.4, P.y1, -24.6], rotY: Math.PI / 2, h: 3.8 },
  // T2: parapet walls along its edge over the back street, a pine, a lantern, a snowman
  { type: 'calamari_stonewall', pos: [-15.5, P.y2, -30.3], rotY: 0, length: 4.0, h: 0.85, t: 0.5 },
  { type: 'calamari_stonewall', pos: [-7.8, P.y2, -30.3], rotY: 0, length: 3.0, h: 0.85, t: 0.5 },
  { type: 'calamari_tree', pos: [-17.8, P.y2, -34.8], kind: 'pine', h: 5.6, variant: 2 },
  { type: 'calamari_lantern', pos: [-11.2, P.y2, -35.2], h: 1.7 },
  { type: 'calamari_snowman', pos: [-5.0, P.y2, -34.4], rotY: 0.4 },
  { type: 'calamari_snowbank', pos: [-21.9, P.y2, -30.8], rotY: Math.PI / 2, length: 2.0, h: 0.85, d: 1.1, variant: 0 },
  // the hill walls' snowy tops (no stones: their faces stay inkable)
  ...P.hillWalls.map(([x0, x1, z0, z1, y1]) => {
    const alongX = x1 - x0 > z1 - z0;
    return alongX ? { type: 'calamari_ishigaki', pos: [x0, 0, (z0 + z1) / 2 + 0.25], rotY: 0, length: x1 - x0, y0: 0, y1, stones: false }
      : { type: 'calamari_ishigaki', pos: [(x0 + x1) / 2 + 0.25, 0, z1], rotY: Math.PI / 2, length: z1 - z0, y0: 0, y1, stones: false };
  }),
  // the fire lookout tower on the hill behind the terraces (the landmark; out of play)
  { type: 'calamari_firetower', pos: [-29.5, 3.2, -27.5], rotY: 0.3, h: 13 },
];

const ONE_OFFS = [
  // Cap'n Cuttlefish's cottage on T1 (Alpha's side only): nameplate, anchor, sea chest
  { type: 'calamari_cuttlefish', pos: [P.cottage[1], P.y1, (P.cottage[2] + P.cottage[3]) / 2 + 1.0], rotY: Math.PI / 2, mirror: false },
  // the Cuttlefish cottage's nameplate by its door (Alpha's side only)
];

export const PLACEMENTS = [...BUILDINGS, ...RAILWAY, ...HARBOUR, ...STATION, ...HILL, ...ONE_OFFS];
