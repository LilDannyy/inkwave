// Gulper Aquarium — stage props (prop types prefixed 'aquarium_') and set dressing (PLACEMENTS: the half list, mirrored
// (x, z) → (−x, −z), rotY + π, unless an entry says `mirror: false`).
// register(D, H): kit.js (palette, geometry, the Deco lettering), arch.js (the building: gatehouses, gantry, gulper heads,
// the Great Tank's frame, the colonnade and canopy, the Reef Window, the kelp drums, the promenades, the Ticket Hall, the
// Pump Hall, the Fin Pavilion, the Express stops), dress.js (kiosks, exhibits, Penguin Point, rails, clutter).
// Everything here is visual: no prop adds a collider (the blockout's play geometry, colliders and flags are unchanged).
// The glass, the water and everything that swims or moves are backdrop.js's.
import { LAYOUT } from './layout.js';
import { makeKit } from './kit.js';
import { registerArch } from './arch.js';
import { registerDress } from './dress.js';

const DEG = Math.PI / 180, PI = Math.PI;
const C30 = Math.cos(30 * DEG);
const W = (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w];
const pol = (a, r) => [r * Math.cos(a * DEG), r * Math.sin(a * DEG)];
const at0 = ([x, z]) => [x, 0, z];

export function register(D, H) {
  const KIT = makeKit(D, H);
  registerArch(D, H, KIT);
  registerDress(D, H, KIT);
}

// ================================================================================================ placements
// a rail prop for every railing collider in the half list (box / obox / ramp); the promenade's sea rail carries a string
// of lights
function railFor(d) {
  if (d.kind === 'box') {
    const dx = d.max[0] - d.min[0], dz = d.max[2] - d.min[2], alongX = dx >= dz;
    return { type: 'aquarium_rail', pos: [(d.min[0] + d.max[0]) / 2, d.min[1], (d.min[2] + d.max[2]) / 2], rotY: alongX ? 0 : -Math.PI / 2, len: alongX ? dx : dz, h: d.max[1] - d.min[1] };
  }
  if (d.kind === 'obox') {
    const alongX = d.size[0] >= d.size[2], a = d.rotY * DEG, r = Math.hypot(d.center[0], d.center[2]);
    const lights = r > 30.8 && r < 31.6 && d.center[0] < -8 && d.center[2] < 0;
    return { type: 'aquarium_rail', pos: [d.center[0], d.center[1] - d.size[1] / 2, d.center[2]], rotY: alongX ? a : a - Math.PI / 2, len: alongX ? d.size[0] : d.size[2], h: d.size[1], lights };
  }
  // a ramp-shaped rail (the pavilion stairs' outer sides): its top runs low → high; 1.0 m of railing over the stair
  const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, L = Math.hypot(hx - lx, hz - lz);
  return { type: 'aquarium_rail', pos: [(lx + hx) / 2, (ly + hy) / 2 - 1.0, (lz + hz) / 2], rotY: -Math.atan2(hz - lz, hx - lx), len: L, h: 1.0, rise: hy - ly };
}
const tagged = (tag) => LAYOUT.half.filter((d) => d.tag === tag);
// an obox's foot placement (centre, given foot height, turn)
const atObox = (d, y, o = {}) => ({ pos: [d.center[0], y, d.center[2]], rotY: d.rotY * DEG, w: d.size[0], d: d.size[2], ...o });

const KIOSKS = tagged('kiosk').map((d) => {
  const a = Math.atan2(d.center[2], d.center[0]) / DEG;
  return { type: 'aquarium_kiosk', ...atObox(d, 2.4, { h: 2.6, kind: a < -135 ? 'souvenir' : 'icecream' }), rotY: d.rotY * DEG + PI };
});
const ob = (tag) => tagged(tag)[0];
// a world-axis box's foot placement (centre, floor, size); a round piece's centre (its spokes share it)
const atBox = (d, o = {}) => ({ pos: [(d.min[0] + d.max[0]) / 2, d.min[1] < 0 ? 0 : d.min[1], (d.min[2] + d.max[2]) / 2], rotY: 0, w: d.max[0] - d.min[0], d: d.max[2] - d.min[2], h: d.max[1] - Math.max(0, d.min[1]), ...o });
const boxC = (d) => (d.kind === 'box' ? [(d.min[0] + d.max[0]) / 2, (d.min[2] + d.max[2]) / 2] : [d.center[0], d.center[2]]);

export const PLACEMENTS = [
  ...LAYOUT.half.filter((d) => d.rail && d.tag !== 'queue-rope').map(railFor),
  ...LAYOUT.single.filter((d) => d.rail).map(railFor).map((p) => ({ ...p, mirror: false })),
  // ---- the building (world-frame builders at the origin; the twin turns them for Bravo)
  { type: 'aquarium_gatehouse', pos: [0, 0, 0], label: 'SOUTH GATE', mirror: false },
  { type: 'aquarium_gatehouse', pos: [0, 0, 0], rotY: PI, label: 'NORTH GATE', mirror: false },
  { type: 'aquarium_gantry', pos: [0, 0, 0], mirror: false },
  { type: 'aquarium_tankframe', pos: [0, 0, 0], mirror: false },
  { type: 'aquarium_stairtrim', pos: [0, 0, 0] },
  { type: 'aquarium_gulper', pos: [0, 0, 0] },
  { type: 'aquarium_canopy', pos: [0, 0, 0] },
  { type: 'aquarium_reefwindow', pos: [0, 0, 0], moray: true },
  { type: 'aquarium_drum', pos: [0, 0, 0] },
  { type: 'aquarium_promenade', pos: [0, 0, 0] },
  { type: 'aquarium_tickethall', pos: [0, 0, 0] },
  { type: 'aquarium_pumphall', pos: [0, 0, 0] },
  { type: 'aquarium_fintower', pos: [0, 0, 0] },
  { type: 'aquarium_stops', pos: [0, 0, 0] },
  { type: 'aquarium_cove', pos: [0, 0, 0] },
  { type: 'aquarium_pier', pos: [0, 0, 0], name: 'MV GULPER', mirror: false },
  { type: 'aquarium_pier', pos: [0, 0, 0], rotY: PI, name: 'MV BARRELEYE', mirror: false },
  // ---- the colonnade's lamp columns (on the 0.45 plinth)
  ...tagged('lamp-column').map((d) => ({ type: 'aquarium_lampcol', pos: [d.center[0], 0.45, d.center[2]], rotY: d.rotY * DEG })),
  // ---- kiosks: the promenade's souvenir and ice-cream kiosks (facing the court), the ferry kiosk, the timetable pillar,
  //      the plaza's souvenir kiosk
  ...KIOSKS,
  { type: 'aquarium_kiosk', ...atObox(ob('ferry-kiosk'), 0.6, { h: 2.4, kind: 'ferry' }) },
  { type: 'aquarium_kiosk', ...atObox(ob('timetable'), 0, { h: 2.2, kind: 'timetable' }) },
  { type: 'aquarium_kiosk', ...atObox(ob('souvenir-kiosk'), 0, { h: 2.6, kind: 'souvenir' }) },
  // ---- Penguin Point
  { type: 'aquarium_hut', ...atObox(ob('keeper-hut'), 1.2, { h: 2.7 }) },
  { type: 'aquarium_buckets', pos: [-9.0, 1.2, -46.0], rotY: -30 * DEG, h: 1.2 },
  { type: 'aquarium_chute', ...atObox(ob('feeding-chute'), 1.2, { h: 1.4 }), rotY: -30 * DEG + PI / 2 },
  { type: 'aquarium_rock', ...atObox(ob('outcrop'), 2.4, { h: 1.2, seed: 7 }) },
  ...[[-16, -3, -17.2, 3.2], [-3, 7, -18.0, 3.2], [7, 10, -18.0, 4.4], [10, 24, -17.2, 4.4], [24, 31, -16.8, 2.6]].map(([s0, s1, w, h]) => {
    const [x, z] = W((s0 + s1) / 2, w);
    return { type: 'aquarium_glassframe', pos: [x, 0, z], rotY: 60 * DEG, len: s1 - s0, h };
  }),
  // ---- the court's exhibits
  { type: 'aquarium_coral', pos: [pol(-43, 25.0)[0], 0, pol(-43, 25.0)[1]], c: '#c99a8a' },
  { type: 'aquarium_coral', pos: [pol(-31, 26.0)[0], 0, pol(-31, 26.0)[1]], c: '#b9a3b8' },
  { type: 'aquarium_clam', pos: [pol(-58, 25.5)[0], 0, pol(-58, 25.5)[1]], rotY: 0.6 },
  { type: 'aquarium_helmet', pos: [13.3, 0.9, -6.0], rotY: -2.2 },
  { type: 'aquarium_lectern', pos: [-7.5, 0, -18.0] },
  { type: 'aquarium_touchpool', pos: [-9.0, 1.0, -14.3] },
  { type: 'aquarium_column', pos: [6.5, 0, -17.0], r: 1.63, h: 4.2, lamp: true, label: 'MOON JELLIES' },
  { type: 'aquarium_column', pos: [-16.25, 0, -2.9], r: 1.63, h: 4.2, lamp: true, label: 'MOON JELLIES' },
  { type: 'aquarium_column', pos: [0, 0, -21.5], r: 1.31, h: 5.8 },
  { type: 'aquarium_postbox', pos: [-1.0, 0, -39.8] },
  { type: 'aquarium_cart', pos: [-5.5, 0, -39.75] },
  // ---- the deck's furniture and the wing's cover, dressed from outside their faces (art round 1)
  ...tagged('hopper').map((d) => ({ type: 'aquarium_hopper', ...atBox(d), rotY: d.min[0] > 0 ? 0 : PI })),
  ...tagged('hatch').map((d) => ({ type: 'aquarium_hatch', ...atObox(d, d.center[1] - d.size[1] / 2, { h: d.size[1] }) })),
  ...tagged('pole-rack').map((d) => ({ type: 'aquarium_polerack', ...atObox(d, d.center[1] - d.size[1] / 2, { h: d.size[1] }) })),
  ...tagged('turnstile').map((d) => ({ type: 'aquarium_turnstile', ...atBox(d), gap: d.min[0] < 8.8 ? 1 : -1 })),
  ...[...tagged('trolley'), ...tagged('trolleys')].map((d) => (d.kind === 'box' ? { type: 'aquarium_trolley', ...atBox(d) } : { type: 'aquarium_trolley', ...atObox(d, 0, { h: d.size[1] - 2.0 }) })),
  ...tagged('planter').filter((d, i) => i % 4 === 0).map((d) => ({ type: 'aquarium_planterdress', pos: [boxC(d)[0], 0, boxC(d)[1]], r: 0.9, h: 1.3, plates: [PI * 0.25, PI * 1.25], label: 'SEA HOLLY' })),
  ...tagged('topiary').filter((d, i) => i % 4 === 0).map((d) => ({ type: 'aquarium_planterdress', pos: [boxC(d)[0], 0, boxC(d)[1]], r: 1.0, h: 1.2, plates: [PI * 0.83], label: 'FISH TOPIARY' })),
  ...tagged('ticket-machines').map((d) => ({ type: 'aquarium_ticketcanopy', ...atBox(d) })),
  ...tagged('icecream-cart').map((d) => ({ type: 'aquarium_cartdress', ...atBox(d) })),
  ...tagged('luggage-scale').map((d) => ({ type: 'aquarium_scale', ...atBox(d) })),
  ...tagged('coat-pegs').map((d) => ({ type: 'aquarium_pegs', ...atBox(d) })),
  // ---- the wing's small things, out of the lanes (art round 1: "none of §5.2's queue stanchions, stacked luggage, …")
  { type: 'aquarium_aboard', pos: [10.65, 0, -47.0], rotY: PI * 0.85, text: 'FLOOR DRY', sub: 'EVERYTHING IS' },
  { type: 'aquarium_aboard', pos: [-9.4, 0, -30.4], rotY: PI * 0.92, text: 'FEEDINGS', sub: '11:00 · 15:00' },
  { type: 'aquarium_bench', pos: [3.35, 0, -46.32], rotY: PI, len: 1.8 },
  // (each now stands on its collider in layout.js — art round 2: the stanchions on the queue terrace along the penguin
  // glass, the luggage turned square to the blade against the queue planter)
  { type: 'aquarium_stanchions', pos: [W(25.6, -16.3)[0], 0.6, W(25.6, -16.3)[1]], rotY: PI / 3, len: 2.7, n: 4 },
  { type: 'aquarium_luggage', pos: at0(W(28.5, 0.35)), rotY: -30 * DEG },
];
