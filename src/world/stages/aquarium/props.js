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
import { PLANTERS, PENGUIN, PUMPS, DAIS, TICKET } from './geo.js';

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

// (fix round 6) the Kelp Ramp's parapet (layout.js runs k 8 … 11 round the E drum, r 7.65, 0.3 wide, 0.9 over the ramp): a
// render pilaster over each of its three joints (the runs' 0.25 m overlaps stood 3 cm proud of the next run's court face in
// a notch, 0.23 m to either side of the joint) and on both ends, and a KELP RAMP plate on its lowest run's court face
const KELP_PARAPET = (() => {
  const EKc = [25, 0], R = 7.65, um = R * Math.cos(7.5 * DEG), at = (a, r) => [EKc[0] + r * Math.cos(a * DEG), EKc[1] + r * Math.sin(a * DEG)];
  const floorAt = ([x, z]) => (Math.hypot(x, z) > 21.0 ? 2.4 : 0);
  const out = [];
  for (const k of [8, 9, 10]) {
    const bj = -90 - 15 * (k + 1), n = [Math.cos(bj * DEG), Math.sin(bj * DEG)], P = at(bj, R + 0.15 / Math.cos(7.5 * DEG));
    const top = (2.4 * (k + 1)) / 12 + 0.9;   // (the faience speed lines run on across it: 0.26 / 0.34 / 0.42 under the top, as on the faces)
    out.push({ type: 'aquarium_pilaster', pos: [P[0], 0, P[1]], rotY: Math.atan2(n[0], n[1]), w: 0.52, d: 0.07, b: 0.06, y0: floorAt(P), y1: top - 0.05, lines: [top - 0.26, top - 0.34, top - 0.42].filter((y) => y > floorAt(P) + 0.2) });
  }
  for (const [b0, b1, sgn, f, top] of [[-210, -225, -1, 0.25, 2.5], [-255, -270, 1, 0, 3.3]]) {
    const A = at(b0, R), Bq = at(b1, R), M = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), v = [(Bq[0] - A[0]) / M, (Bq[1] - A[1]) / M];
    const E = sgn < 0 ? [A[0] - v[0] * f, A[1] - v[1] * f] : [Bq[0] + v[0] * f, Bq[1] + v[1] * f], dn = [sgn * v[0], sgn * v[1]];
    out.push({ type: 'aquarium_pilaster', pos: [E[0], 0, E[1]], rotY: Math.atan2(dn[0], dn[1]), w: 0.34, d: 0.055, b: 0.05, y0: floorAt(E), y1: top - (sgn < 0 ? 0.025 : 0) - 0.05 });   // (its cap's corners 8.3 cm off the end)
  }
  { const n = [Math.cos(-217.5 * DEG), Math.sin(-217.5 * DEG)], P = at(-217.5, um + 0.15);
    out.push({ type: 'aquarium_plate', pos: [P[0], 0, P[1]], rotY: Math.atan2(n[0], n[1]), y: 1.2, w: 0.95, h: 0.24, lines: [['KELP RAMP', 0.08, '#dcc18c'], ['UP TO THE SEA PROMENADE', 0.04]] }); }
  return out;
})();

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
  // (fix round 8, LEAD-REVIEW 8: the OUT stop's long faces, the booth's render base, the Reef Window's jambs and short run)
  { type: 'aquarium_stopfaces', pos: [0, 0, 0] },
  { type: 'aquarium_boothbase', pos: [0, 0, 0] },
  { type: 'aquarium_reefjambs', pos: [0, 0, 0] },
  // (fix round 9, LEAD-REVIEW 9: the Express IN stop's long faces; the riser shafts' parts — Alpha's frame, turned for Bravo
  // by its own placement so its plates read N. …)
  { type: 'aquarium_stopinfaces', pos: [0, 0, 0] },
  { type: 'aquarium_shafts', pos: [0, 0, 0], half: 'S', mirror: false },
  { type: 'aquarium_shafts', pos: [0, 0, 0], rotY: PI, half: 'N', mirror: false },
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
  // (fix round 7, LEAD-REVIEW 7: the kiosks' other faces — skirting, corner pilasters, the frieze's speed lines, the
  // trade's boards — round the same blocks, in the same frames)
  ...KIOSKS.map((p) => ({ ...p, type: 'aquarium_kioskfaces' })),
  { type: 'aquarium_kioskfaces', ...atObox(ob('ferry-kiosk'), 0.6, { h: 2.4, kind: 'ferry' }) },
  { type: 'aquarium_kioskfaces', ...atObox(ob('souvenir-kiosk'), 0, { h: 2.6, kind: 'souvenir' }) },
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
  // (fix round 4: the plate on a face — at 0.83π it stood across the octagon's −45° face, half sunk in it, its other end
  // 10 cm proud)
  ...tagged('topiary').filter((d, i) => i % 4 === 0).map((d) => ({ type: 'aquarium_planterdress', pos: [boxC(d)[0], 0, boxC(d)[1]], r: 1.0, h: 1.2, plates: [PI * 0.75], label: 'FISH TOPIARY' })),
  // (fix round 4: the planters' trailing planting and brass plates; floorart.js draws their faces and beds under the ink)
  ...PLANTERS.oct.map((p, i) => ({ type: 'aquarium_planterdeco', kind: 'oct', pos: [p.c[0], 0, p.c[1]], r: p.r, top: p.top, seed: 3 + i, skip: p.fish ? [7] : [1, 5] })),   // (not over the plates)
  ...PLANTERS.box.map((b, i) => {
    const [x, z] = W((b.s[0] + b.s[1]) / 2, (b.w[0] + b.w[1]) / 2), deck = b.y0 > 1;
    // (local x along w, local +z toward the gate: −s; a deck planter's plates face the pad and mid, the queue planter's
    // both long faces)
    const plates = deck ? [{ face: [b.w[0] > 0 ? -1 : 1, 0], label: 'SEA HOLLY' }, { face: [0, 1], label: 'SEA HOLLY' }] : [{ face: [0, 1], label: 'SEA HOLLY' }, { face: [0, -1], label: 'FERRY QUEUE' }];
    return { type: 'aquarium_planterdeco', kind: 'box', pos: [x, b.y0, z], rotY: -30 * DEG, w: b.w[1] - b.w[0], d: b.s[1] - b.s[0], h: b.top - b.y0, seed: 7 + i, plates };
  }),
  ...tagged('ticket-machines').map((d) => ({ type: 'aquarium_ticketcanopy', ...atBox(d) })),
  ...tagged('icecream-cart').map((d) => ({ type: 'aquarium_cartdress', ...atBox(d) })),
  ...tagged('luggage-scale').map((d) => ({ type: 'aquarium_scale', ...atBox(d) })),
  ...tagged('luggage-scale').map((d) => ({ type: 'aquarium_scaletrim', ...atBox(d) })),   // (fix round 7)
  ...tagged('coat-pegs').map((d) => ({ type: 'aquarium_pegs', ...atBox(d) })),
  // ---- the wing's small things, out of the lanes (art round 1: "none of §5.2's queue stanchions, stacked luggage, …")
  { type: 'aquarium_aboard', pos: [10.65, 0, -47.0], rotY: PI * 0.85, text: 'FLOOR DRY', sub: 'EVERYTHING IS' },
  { type: 'aquarium_aboard', pos: [-9.4, 0, -30.4], rotY: PI * 0.92, text: 'FEEDINGS', sub: '11:00 · 15:00' },
  { type: 'aquarium_bench', pos: [3.35, 0, -46.32], rotY: PI, len: 1.8 },
  // (each now stands on its collider in layout.js — art round 2: the stanchions on the queue terrace along the penguin
  // glass, the luggage turned square to the blade against the queue planter)
  { type: 'aquarium_stanchions', pos: [W(25.6, -16.3)[0], 0.6, W(25.6, -16.3)[1]], rotY: PI / 3, len: 2.7, n: 4 },
  { type: 'aquarium_luggage', pos: at0(W(28.5, 0.35)), rotY: -30 * DEG },
  // ---- fix round 5 (the complete eye-level sweep; floorart.js draws the faces and tops under the ink): the PENGUIN POINT
  //      plaque on the upper rock's plaza face, the basking rock's lumps, the pump sets' pipework, plates on the touch pool's
  //      dais, the Ticket Hall's plaza and west faces, the helmet bed, the viewing steps and the shark bench, the stairs'
  //      brass string-courses
  { type: 'aquarium_penguinplaque', pos: at0(W(PENGUIN.plaque.s, PENGUIN.plaque.w)), rotY: PI / 3, y: PENGUIN.plaque.y - 0.31 },
  { type: 'aquarium_baskinglumps', pos: [(PENGUIN.basking.b[0] + PENGUIN.basking.b[1]) / 2, 0, (PENGUIN.basking.b[2] + PENGUIN.basking.b[3]) / 2], w: 1.2, d: 1.2, h: PENGUIN.basking.top,
    foot: [[70, 2, 0.15, 0.4, 0.28, 0.12], [71, 1, 0.25, 0.38, 0.25, 0.12], [72, -2, 0.05, 0.42, 0.26, 1.32], [73, -1, -0.1, 0.4, 0.24, 1.32]] },
  { type: 'aquarium_pumpdress', pos: [(PUMPS.box[0] + PUMPS.box[1]) / 2, 0, (PUMPS.box[2] + PUMPS.box[3]) / 2], rotY: -PI / 2, len: 2.0, wid: 1.5, aisle: 1 },
  { type: 'aquarium_pumpdress', pos: at0(W((PUMPS.blade.s[0] + PUMPS.blade.s[1]) / 2, (PUMPS.blade.w[0] + PUMPS.blade.w[1]) / 2)), rotY: -30 * DEG, len: 2.0, wid: 1.5, aisle: 1, ends: [-1] },
  { type: 'aquarium_plate', pos: [DAIS.b[1], 0, (DAIS.b[2] + DAIS.b[3]) / 2], rotY: PI / 2, y: 0.36, w: 1.45, h: 0.36, lines: [['EXHIBIT', 0.1, '#dcc18c'], ['PLEASE KEEP OFF THE ROCKS', 0.062]] },
  { type: 'aquarium_plate', pos: [DAIS.b[0], 0, (DAIS.b[2] + DAIS.b[3]) / 2], rotY: -PI / 2, y: 0.36, w: 1.45, h: 0.36, lines: [['EXHIBIT', 0.1, '#dcc18c'], ['PLEASE KEEP OFF THE ROCKS', 0.062]] },
  { type: 'aquarium_plate', pos: [3.35, 0, TICKET.b[2]], rotY: PI, y: 0.83, w: 1.62, h: 0.27, lines: [['FERRY TO INKOPOLIS', 0.085, '#dcc18c'], ['SAILINGS EVERY 20 MINUTES', 0.05]] },
  { type: 'aquarium_plate', pos: [TICKET.b[0], 0, -42.5], rotY: -PI / 2, y: 0.8, w: 1.5, h: 0.3, lines: [['TICKET HALL', 0.1, '#dcc18c'], ['FERRIES · TUBEWAY · EXHIBITS', 0.05]] },
  { type: 'aquarium_plate', pos: [11.3, 0, -6.0], rotY: -PI / 2, y: 0.3, w: 1.5, h: 0.3, lines: [['DIVING HELMET', 0.1, '#dcc18c'], ['STANDARD DRESS · 1934', 0.055]] },
  { type: 'aquarium_plate', pos: [4.2, 0, -29.7], rotY: 0, y: 0.6, w: 0.72, h: 0.15, lines: [['SHARK WATCH', 0.07, '#dcc18c']] },
  ...[[-22.5, -0.79, 1.3], [-67.5, -0.79, 0.79], [-112.5, -0.79, 0.79], [-157.5, -1.3, 0.79]].map(([a, t0, t1]) => {
    const n = [Math.cos(a * DEG), Math.sin(a * DEG)], tt = [-n[1], n[0]], tm = (t0 + t1) / 2;
    return { type: 'aquarium_plate', pos: [n[0] * 9.0 + tt[0] * tm, 0, n[1] * 9.0 + tt[1] * tm], rotY: Math.atan2(n[0], n[1]), y: 0.12, w: 1.25, h: 0.11, lines: [['PLEASE DO NOT TAP THE GLASS', 0.045]] };
  }),
  { type: 'aquarium_raketrim', pos: [0, 0, 0], low: [...[pol(-152, 15.6)].map(([x, z]) => [x, 0, z])[0]], high: [...[pol(-152, 21.4)].map(([x, z]) => [x, 2.4, z])[0]], w: 6.0, t1: 5.35 },
  { type: 'aquarium_raketrim', pos: [0, 0, 0], low: [...[pol(-120, 34.6)].map(([x, z]) => [x, 1.2, z])[0]], high: [...[pol(-120, 31.0)].map(([x, z]) => [x, 2.4, z])[0]], w: 5.0, t1: 3.2 },   // (fix round 6: to r 31.4, the nosing's face)
  { type: 'aquarium_raketrim', pos: [0, 0, 0], low: [9.0, 0, -36.2], high: [9.0, 1.2, -39.0], w: 2.0, t1: 2.75 },
  { type: 'aquarium_raketrim', pos: [0, 0, 0], low: [...[pol(-45, 13.5)].map(([x, z]) => [x, 0, z])[0]], high: [...[pol(-45, 7.2)].map(([x, z]) => [x, 2.4, z])[0]], w: 4.0, t1: 5.95 },
  // ---- fix round 6 (LEAD-REVIEW 6; floorart.js draws the faces and tops under the ink): the Feeding Step's plates and brass
  //      corner guards, the whale-tail benches' flukes and plate, the Kelp Ramp parapet's pilasters and plate, the trolley
  //      stack's casters and push bars, the ice-cream cart's menu boards
  ...[[1, PI / 2], [-1, -PI / 2]].map(([sx, ry]) => ({ type: 'aquarium_plate', pos: [sx * 2.0, 0, -8.5], rotY: ry, y: 0.2, w: 0.95, h: 0.24, lines: [['FEEDING DECK', 0.07, '#dcc18c'], ['KEEPERS ONLY', 0.042]] })),
  { type: 'aquarium_cornerguard', pos: [1.87, 0, -9.67], t0: PI / 2, r: 0.14, y0: 0.1, y1: 1.05 },
  { type: 'aquarium_cornerguard', pos: [-1.87, 0, -9.67], t0: PI, r: 0.14, y0: 0.1, y1: 1.05 },
  { type: 'aquarium_fluke', pos: [-2.5, 0, -58.0], rotY: -PI / 2 },
  { type: 'aquarium_fluke', pos: [0.5, 0, -58.0], rotY: PI / 2 },
  { type: 'aquarium_plate', pos: [-1.0, 0, -58.6], rotY: PI, y: 0.86, w: 1.0, h: 0.2, lines: [['WHALE BENCH', 0.065, '#dcc18c'], ['GIFT OF THE 1936 SOCIETY', 0.036]] },
  ...KELP_PARAPET,
  { type: 'aquarium_trolleystack', ...atObox(ob('trolley-stack'), 0, { L: 2.0, S: 1.2, H: 1.4 }) },
  ...[[-39.0, 0], [-40.5, PI]].map(([z, ry]) => ({ type: 'aquarium_plate', pos: [-5.5, 0, z], rotY: ry, y: 0.6, w: 1.0, h: 0.5, board: '#3f5a52',
    lines: [['GELATO', 0.1, '#dcc18c'], ['VANILLA · PISTACHIO · LEMON', 0.04], ['SEA SALT CARAMEL · 2 SCOOPS', 0.04]] })),
];
