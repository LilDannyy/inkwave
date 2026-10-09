// Bluestone Junction — stage layout (src/world/stages/bluestone/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, the era data (this file)
//   ground.js    the ground built from outline polygons (cores, kerb bars)      era.js      era tags + the blockout filter
//   props.js     prop pack + placements (the railyard embankment)                surfaces.js / murals.js / backdrop.js
//
// BLOCKOUT (2026-10-04): every floor, tier, stair, wall and piece of cover in DESIGN.md §2.6 at its real size, both
// halves, with the era engine's tags; plain surfaces, no art. The design: tools/botlab/jobs/batch5/stages/bluestone/
// DESIGN.md (the plan, the piece tables), ENGINE.md (the era data's format). Where this file departs from them it says
// so in a "(departs: …)" note, and an "(adds: …)" note marks cover the design did not list.
// The big volumes whose silhouette a box cannot give (the copper dome and lantern, the hotel's turret, the GPO tower's
// spire, the railyard's trains) are props.js blockout volumes over hidden (collision-only) layout blocks.
//
// Bluestone Junction — Clockface Circus, where Swimston Street (the tram boulevard on the spawn axis) crosses Flathead
// Street (the old river road on the diagonal, bearing 65°) under the domed station and its clocks; the city around it
// jumps from the 1880s to today to the 3000s as Commander Tartar winds the clock. Alpha at −Z (the half list), Bravo is
// the 180° twin. +x is east; a kid facing +z has +x on its left.
//   • mid: the circus (a ring at 0 round the station's octagonal concourse, 1.3, under the dome on eight columns), the
//     clock rows over the Clock Steps; the Halo (a glass ring walkway at 5.4) in the 3000s
//   • centre lane: Swimston Street (14 m: trams, the superstop median, the GPO steps, verandas)
//   • right (−x): the balcony walk (the hotel gallery, 2.4), Hotel Lane → the hotel arch (from today also the Royal
//     Arcade), Hoki Lane under the railway viaduct → Prow Place → Alpha's arm of Flathead Street, out to the tram
//     terminus at its tip (fix round 3: the X restored); from the tip Prawn Alley runs back to Hoki Lane round the
//     signal yard
//   • left (+x): Little Lane, Degrayling Lane (its north end half stacked with crates in the 1880s) and Centre Plaice
//     (the side zone), the Boathouse (deck 2.4), the quay; from today the riverside boardwalk and the Iron Bridge to
//     Bravo's arm
//   • the 3000s add the Halo (3.5 m; via glass stairs out of the superstops and the hotel stair from the balcony
//     landing) and the Signal Garden (a 1.2 m park terrace over each team's signal yard, stepped onto from the arm, the
//     alley, Prow Place and Hoki Lane)
//   • spawn: the Cable Tram Engine House's gallery (3.3) over the forecourt terrace (1.0) with the turntable, between
//     the boiler house and the tram shed
// Heights: 0 streets · 0.3 tram islands · 0.6 Degrayling pavements, the arcade · 0.9 the signal yard (off limits) ·
// 1.0 the forecourt terrace · 1.2 the GPO terrace, the Signal Garden · 1.3 the concourse · 1.4 the terminus platform ·
// 2.4 the balcony and gallery, the Boathouse deck · 3.3 the spawn decks · 5.4 the Halo.
import { PATTERN, B, R as R0, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { ERA, eraFilter } from './era.js';
import { BOT, TIER_Y, coverRects, bars, reflexPatches, junctionPatches, coreBoxes, tierBoxes, symOutline, rectPoly, oPoly, polyArea } from './ground.js';

// ------------------------------------------------------------------------------------------------ frames
// a stair / ramp (a solid wedge): its sides and end caps are buried or hidden, so only its top is turf (paint atlas)
function R(low, high, width, o = {}) {
  const dx = high[0] - low[0], dy = high[1] - low[1], dz = high[2] - low[2], L = Math.hypot(dx, dy, dz), h = Math.hypot(dx, dz);
  const sx = -dz / h, sz = dx / h, ux = dx / L, uy = dy / L, uz = dz / L;
  return R0(low, high, width, { ...o, noPaint: [[sx, 0, sz], [-sx, 0, -sz], [ux, uy, uz], [-ux, -uy, -uz]] });
}
// Flathead Street's frame: along = p·(sin 65°, cos 65°), off = p·(−cos 65°, sin 65°); AO(a, o) = the world point
const S65 = Math.sin((65 * Math.PI) / 180), C65 = Math.cos((65 * Math.PI) / 180);
export const AO = (a, o) => [+(a * S65 - o * C65).toFixed(4), +(a * C65 + o * S65).toFixed(4)];
export const along = (x, z) => x * S65 + z * C65, offOf = (x, z) => -x * C65 + z * S65;
// a box in the arm's frame: along a0…a1, off o0…o1
const armBox = (a0, a1, o0, o1, y0, y1, o = {}) => { const [cx, cz] = AO((a0 + a1) / 2, (o0 + o1) / 2); return O(cx, cz, +(o1 - o0).toFixed(4), +(a1 - a0).toFixed(4), y0, y1, 65, o); };
const armPoly = (a0, a1, o0, o1) => [AO(a0, o0), AO(a1, o0), AO(a1, o1), AO(a0, o1)];
// a band along the line P → Q between its points at z0 and z1, from n0 to n1 metres out along `n` (a unit normal)
function lineBand(P, Q, z0, z1, n, n0, n1, y0, y1, o = {}) {
  const at = (z) => [P[0] + ((z - P[1]) * (Q[0] - P[0])) / (Q[1] - P[1]), z];
  const a = at(z0), b = at(z1), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  const cx = (a[0] + b[0]) / 2 + n[0] * (n0 + n1) / 2, cz = (a[1] + b[1]) / 2 + n[1] * (n0 + n1) / 2;
  return O(+cx.toFixed(4), +cz.toFixed(4), +(n1 - n0).toFixed(4), +L.toFixed(4), y0, y1, +((Math.atan2(dx, dz) * 180) / Math.PI).toFixed(4), o);
}
// a box on a bearing (deg), w across × d along (DESIGN.md's "w × d @ deg")
const OB = (cx, cz, w, d, y0, y1, deg, o = {}) => O(cx, cz, w, d, y0, y1, deg, o);

// ------------------------------------------------------------------------------------------------ palette (blockout)
// muted, mid-value: team ink must stay the loudest thing on screen (DESIGN.md §5)
const K = {
  blue: '#5c646e', blueT: '#666e77', granite: '#8a8478', sand: '#b5a990', sandDk: '#a69a80',
  hotel: '#c6b597', gpo: '#c9bea6', shop: '#a68a71', bond: '#737b84', customs: '#7d858c', ware: '#9a6d58', engine: '#6c737a',
  roof: '#59606a', dome: '#8c7a5c', iron: '#4f5b57', kiosk: '#3d5a4e', tram: '#57725f', stone: '#9b958a',
  wood: '#9a7a58', crate: '#a8875f', hoard: '#8f6f4c', wagon: '#5f4c3c', planks: '#9c8a72', bridge: '#5d6a70',
  glass: '#d6e0e4', lawn: '#7e9467', garden: '#a6ad98', cover: '#8f877a', planter: '#7f8a6c', spawn: '#e2ddd3', wall: '#6b6660',
};
const ground = (o = {}) => ({ color: K.blue, pattern: SURF.bluestone, ...o });
const sand = (o = {}) => ({ color: K.sand, pattern: SURF.sandstone, ...o });
const stair = (o = {}) => ({ color: K.sandDk, pattern: PATTERN.stonestep, ...o });
const cover = (o = {}) => ({ color: K.cover, pattern: PATTERN.plain, ...o });
const wall = (o = {}) => ({ color: K.wall, pattern: SURF.bluestone, roof: true, paint: false, ...o });
// a building: an inkable block from y0 to 3 m, and a roof block (`roof`, not inkable) from 3 m to its top (DESIGN.md
// §2.6 point 1: paint and lightmap stay in the 0–3 m band)
// (y0 < 0: the building stands in a hole in the street on a base, like a tier: no street under it in the paint atlas)
const bld = (x0, x1, z0, z1, top, o = {}, y0 = 0) => [...(y0 < 0 ? [B(x0, x1, y0, TIER_Y, z0, z1, { pattern: PATTERN.render, ...o, paint: false })] : []),
  B(x0, x1, y0 < 0 ? TIER_Y : y0, 3, z0, z1, { pattern: PATTERN.render, ...o }), B(x0, x1, 3, top, z0, z1, { pattern: PATTERN.render, ...o, roof: true, paint: false })];
const obld = (cx, cz, w, d, deg, top, o = {}, y0 = 0) => [O(cx, cz, w, d, y0, 3, deg, { pattern: PATTERN.render, ...o }), O(cx, cz, w, d, 3, top, deg, { pattern: PATTERN.render, ...o, roof: true, paint: false })];
const rail = (o = {}) => ({ rail: true, paint: false, color: '#333333', ...o });

// ------------------------------------------------------------------------------------------------ the outline
// DESIGN.md §2.1 Q1 … Q13 (Alpha's chain; the full outline is the chain and its mirror). (departs: Q8 / Q9 at z −82, not
// −83, so the engine house, tram shed and boiler house close the base exactly and the farthest corner stays 84.9 m out)
// (fix round 2, review issue 1 — the stage was far too big: the West Wharf is gone (the arm ends at along −48, where
//  Prawn Alley turns off it); the arm's south side from the alley to Prow Place is the signal yard (its edge at off −6:
//  the old south walk, the Customs House and the railyard wall behind them are gone); the yards beside the spawn deck are
//  gone (the boiler house and the tram shed come forward to the deck's sides) and the base's outer back corners are
//  chamfered (Q6 → (−22, −66); (27, −61) → (22, −66), 2 m clear of the tower's lane at x 21.5))
// (fix round 3, review issue 2 — the X restored: the arm keeps its round-2 street (off −6 … 14) out to along −40, where
//  the Iron Bridge lands; beyond that it narrows to off ±9.5 and runs on to along −56 (ARM_END), the tram terminus with
//  its loading platform; Prawn Alley turns off at the tip itself. Review issue 1 — paid for in the bare strips: the
//  terrace's outer corners are cut back (the west edge V50 → (−20, −64), the east edge (25, −50) → (25.5, −60)), with the
//  quay's line from the Plaice down to them)
export const ARM_END = -56, ARM_S = -4.5, ARM_TIP = -40, ARM_W = 9.5;
// the yard's north-east corner by Prow Place: the land outline turns along along MS.a0 from the arm's yard edge to Prow
// Place's line (x −24), so the yard ends square there instead of in a sliver (fix round 3)
export const MS = { a0: +((-24 + (ARM_S - 3) * Math.cos((65 * Math.PI) / 180)) / Math.sin((65 * Math.PI) / 180)).toFixed(4), a1: -36.3, o0: ARM_S - 3, o1: ARM_S };
const zOnOff = (x, o) => +((o + x * C65) / S65).toFixed(4);                   // the z where the line off = o crosses x
export const Q = {
  Q1: [-21.5, 5.42], R1: AO(ARM_TIP, 14), R2: AO(ARM_TIP, ARM_W), W1: AO(ARM_END, ARM_W), Q3: AO(ARM_END, -ARM_W),
  R3: AO(ARM_TIP, -ARM_W), R4: AO(ARM_TIP, ARM_S), A: [-24, zOnOff(-24, ARM_S)], MS1: AO(MS.a0, MS.o1), MS0: [-24, AO(MS.a0, MS.o0)[1]], Q5: [-24, -33],
  QW1: [-20, -64], QW2: [-20, -74.9091], Q8: [-16, -80], Q9: [16, -80], QE2: [22, -72.3636], QE1: [22, -64], QE0: [25.5, -60],
  Q12: [21.5, -30], Q13: [21.5, -5.42],
};
const V50 = [-26.04, -50], U50 = [25, -50];   // (the terrace's north corners on the viaduct and the quay)
const CHAIN = [Q.Q1, Q.R1, Q.R2, Q.W1, Q.Q3, Q.R3, Q.R4, Q.MS1, Q.MS0, Q.Q5, V50, Q.QW1, Q.QW2, Q.Q8, Q.Q9, Q.QE2, Q.QE1, Q.QE0, U50, Q.Q12];
const NCH = CHAIN.length;
export const OUTLINE = symOutline(CHAIN);
// kerb bars on the diagonal edges the street meets (edge i of the chain; its mirror is i + NCH): the arm's river edge
// (−0.26: the boardwalk at −0.34 and the Iron Bridge at −0.43 tuck under Bravo's twin of it), the step in to the tip,
// the tip's river edge, its end, its south edge (Prawn Alley's mouth), the step out to the yard edge, the arm's edge on
// the signal yard, the viaduct, the quay
const KERB = { 0: -0.26, 1: -0.18, 2: -0.26, 3: -0.18, 4: -0.09, 5: -0.18, 6: -0.09, 7: -0.18, 9: -0.18, 18: -0.09 };
const kerbAt = (i) => KERB[i % NCH];

// ------------------------------------------------------------------------------------------------ the tiers
// the forecourt terrace round the spawn deck (1.0; DESIGN.md §2.6: W / C / E / E2, one outline) — the east edge follows
// the quay, the west edge the viaduct; its back edge (z −66) is the deck's front and the fronts of the boiler house and
// the tram shed (fix round 2: the yards beside the deck are gone), its outer back corners chamfered
export const TERRACE = [V50, Q.QW1, [-12, -64], [12, -64], Q.QE1, Q.QE0, U50, [5, -50], [5, -52.5], [-5, -52.5], [-5, -50]];
const TERRACE_KERB = { 0: 0.91, 4: 0.82, 5: 0.91 };
export const P = {
  deck: [-12, 12, -74, -64], pad: [0, 3.3, -70],
  gpo: [-13.5, -7, -40, -27.5], arcade: [-18.5, -14, -46, -18.5], degS: [10.5, 16.5, -44, -38], degN: [10.5, 16.5, -24, -14.5],
  boathouse: [16.5, 21.5, -24, -12], engine: [-12, 12, -80, -74], boiler: [-20, -12, -80, -64], shed: [12, 22, -80, -64],
  carriage: [-4.5, 4.5, -50, -20],   // Swimston's carriageway (granite): one slab, its own colour
};
// the tram terminus's loading platform at the arm's tip (1.4; fix round 3): along −56 … −48, off 3.5 … 9.5 (the river side)
export const TERMINUS = { a0: ARM_END, a1: -48, o0: 3.5, o1: ARM_W, y: 1.4 };
const TERM_POLY = [AO(TERMINUS.a0, TERMINUS.o0), AO(TERMINUS.a1, TERMINUS.o0), AO(TERMINUS.a1, TERMINUS.o1), AO(TERMINUS.a0, TERMINUS.o1)];
// the square-built buildings on the street (the street is cut out under them; they stand on a base like the tiers)
const BLDS = [[7, 10.5, -27, -19], [7, 10.5, -44, -31], [16.5, 19.5, -44, -38], [-13.5, -7, -44, -40], [-14, -7, -22.5, -18.5], [-14, -13.5, -46, -27.5], [-19, -18.5, -46, -27.5]];
const TIERS = [TERRACE, ...BLDS.map((r) => rectPoly(...r)), rectPoly(...P.deck), rectPoly(...P.engine), rectPoly(...P.boiler), rectPoly(...P.shed),
  rectPoly(...P.gpo), rectPoly(...P.arcade), rectPoly(...P.degS), rectPoly(...P.degN), rectPoly(...P.boathouse), TERM_POLY];
const mirP = (p) => p.map(([x, z]) => [-x, -z]);

// ------------------------------------------------------------------------------------------------ the ground
// the street (0): cores over Alpha's window (z ≤ 0; the mirror lays Bravo's), never under the circus slab or the
// carriageway, kerb bars on the diagonals. Built at module load (a few tens of ms).
const GROUND = coverRects(OUTLINE, { x0: -63, x1: 63, z0: -85, z1: 0 }, {
  hard: [[-20, 20, -20, 20], P.carriage], soft: [...TIERS, ...TIERS.map(mirP)],
});
const TER = coverRects(TERRACE, { x0: -27.5, x1: 27.5, z0: -73, z1: -50 });
export const GROUND_MISS = [...GROUND.miss, ...TER.miss];
const groundPieces = [
  ...tierBoxes(GROUND.rects, 0, ground({ tag: 'street' })),
  ...bars(OUTLINE, { only: (i) => i < NCH && kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }),
  ...junctionPatches(OUTLINE, { barred: (i) => kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }).filter((d) => d.center[2] < 0),
  // (fix round 3: the tip's steps in and out are reflex corners between two barred edges: a patch under each)
  ...reflexPatches(OUTLINE, { only: (i) => i < NCH && kerbAt(i) !== undefined && kerbAt((i + 2 * NCH - 1) % (2 * NCH)) !== undefined, top: -0.4, size: 1.9, opts: ground({ tag: 'kerb', color: '#535a63' }) }),
  ...tierBoxes(TER.rects, 1.0, ground({ tag: 'terrace', color: K.blueT })),
  ...bars(TERRACE, { only: (i) => TERRACE_KERB[i] !== undefined, level: (i) => TERRACE_KERB[i], opts: ground({ tag: 'terrace-kerb', color: '#5f666f' }) }),
  ...reflexPatches(TERRACE, { only: (i) => TERRACE_KERB[i] !== undefined && TERRACE_KERB[(i + TERRACE.length - 1) % TERRACE.length] !== undefined, top: 0.73, opts: ground({ tag: 'terrace-kerb' }) }),
  ...junctionPatches(TERRACE, { barred: (i) => TERRACE_KERB[i] !== undefined, level: (i) => TERRACE_KERB[i], opts: ground({ tag: 'terrace-kerb', color: '#5f666f' }) }),
  ...tierBoxes([P.carriage], 0, { tag: 'carriageway', color: K.granite, pattern: SURF.granite }),
];

// ------------------------------------------------------------------------------------------------ mid: the station
const DEG = Math.PI / 180;
const polar = (r, bearing) => [+(r * Math.sin(bearing * DEG)).toFixed(4), +(r * Math.cos(bearing * DEG)).toFixed(4)];
const SINGLE = [
  // the circus floor (one slab: the hour-ring mural's face) and the concourse (the booking-hall floor, 1.3)
  B(-20, 20, BOT, 0, -20, 20, ground({ tag: 'circus', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] })),
  ...OCT(0, 0, 9.5, 0, 1.3, sand({ tag: 'concourse' })),
  // the dome: the drum on the columns (drawn), the dome and the lantern as collision only: their look is the
  // bluestone_dome prop (a copper dome and an octagonal lantern: the landmark's real silhouette, not a stepped stack)
  ...OCT(0, 0, 8.8, 8, 10, { tag: 'drum', color: '#b8a888', pattern: PATTERN.render, roof: true, paint: false }),
  ...OCT(0, 0, 7.0, 10, 12.4, { tag: 'dome', hidden: true, roof: true, paint: false }),
  ...OCT(0, 0, 4.8, 12.4, 14.4, { tag: 'dome', hidden: true, roof: true, paint: false }),
  B(-1.75, 1.75, 14.4, 19, -1.75, 1.75, { tag: 'lantern', hidden: true, roof: true, paint: false }),
];

// the hotel stair (the 3000s; fix round 3): x −16.5 … −14 (against the balcony landing's west edge), from z −15 (2.4: the
// landing's height) north to z −8.4 (5.2, 23.0°), its top landing on to z −4.5 where it meets the Halo's 270° side; the
// 1880s / today cab shelter covers z −15.8 … −10.2 (where the flight's underside is under 4.0 m)
export const HOTEL_STAIR = { x0: -16.5, x1: -14.0, zFoot: -15.0, yFoot: 2.4, zTop: -8.4, yTop: 5.2, zLand: -4.5, zK0: -15.8, zK1: -10.2 };
const HS_X = (HOTEL_STAIR.x0 + HOTEL_STAIR.x1) / 2;
const MID = [
  R([0, 0, -12], [0, 1.3, -8.78], 7, stair({ tag: 'clock-steps' })),
  R([-9.03, 0, -9.03], [-6.21, 1.2, -6.21], 5, stair({ tag: 'concourse-ramp' })),
  // the dome's columns at the octagon's corners (r 8.2): an inkable base 1.2–3.3 and a cast-iron shaft to the drum
  ...[112.5, 157.5, 202.5, 247.5].flatMap((b) => { const [x, z] = polar(8.2, b); return [
    O(x, z, 0.9, 0.9, 1.2, 3.3, b, { tag: 'column', color: '#a99d84', pattern: PATTERN.render }),
    O(x, z, 0.9, 0.9, 3.3, 8, b, { tag: 'column', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  ]; }),
  // the row of five clocks over the Clock Steps (fix round 2, review issue 3: 5.3–6.6, above HULLBREAKER's highest
  // nav sample (5.2 m), so the beam no longer walls the ring at 6 and 12 o'clock for the boss)
  B(-3.1, 3.1, 5.3, 6.6, -7.85, -7.3, { tag: 'clock-beam', color: '#3f4a45', pattern: PATTERN.metal, roof: true, paint: false }),
  // concourse cover (fix round 1, review issue 2: mass at player height): the ticket booths / departure boards on the
  // diagonals, 1.2 × 3 m and 2.3 m over the concourse (roof), at r 5.65 so the middle (r < 4.7: the Pond, the tower's
  // start) and the N–S and E–W lines (|x|, |z| ≤ 2.5: the Clock Steps' axis, the tower's lane) stay open
  ...[135, 225].map((b) => { const [x, z] = polar(5.65, b); return OB(x, z, 1.2, 3, 1.3, 3.6, b - 90, { tag: 'ticket-booth', color: '#4f5d55', pattern: PATTERN.metalpanel, roof: true }); }),
  // ring tiers (review issue 2): a raised flower bed (0.7, inkable, a hop) on each diagonal of the ring, with a 1.3 m
  // planter box at one end (roof): mid-height cover and a step in the ring's floor (both under the boss's 1.35 m stride,
  // so the ring stays HULLBREAKER's era-2 arena: the boss check), clear of the tower's lanes (|z| ≤ 2.5,
  // x 11.5 … 15.5) and the concourse's steps and ramps; under the Halo (era 3) the bed is 4.2 m below its deck
  ...[[147, 13.6, -1], [248, 13.6, 1]].flatMap(([b, r, end]) => {
    const [x, z] = polar(r, b), [ex, ez] = polar(r, b), tx = Math.sin((b + 90) * DEG), tz = Math.cos((b + 90) * DEG);
    return [OB(x, z, 2.4, 4.0, 0, 0.7, b + 90, { tag: 'ring-bed', color: '#7f8a6c', pattern: PATTERN.planter }),
      OB(+(ex + end * 1.6 * tx).toFixed(4), +(ez + end * 1.6 * tz).toFixed(4), 2.4, 0.8, 0, 1.3, b + 90, cover({ tag: 'ring-bed-planter', color: K.planter, pattern: PATTERN.planter, roof: true }))];
  }),
  // ring cover: a cart, the bollards, the arm-mouth planter, the two telephone kiosks (Tartar's), the poster column
  OB(5.99, -16.44, 1.2, 2.2, 0, 1.2, 250, cover({ tag: 'cart', color: '#7a6a58' })),
  B(9.8, 11, 0, 1.2, -6.6, -5.4, cover({ tag: 'bollards' })),
  B(-20.1, -18.9, 0, 1.2, -5.6, -3.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  B(17.13, 18.33, 0, 2.4, -3.73, -2.53, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  // (fix round 2: this kiosk stood 17 m out at 232°, pinching the boss's ring against the columns. Fix round 3: against
  //  the cab shelter's west side, out of the hotel stair's footprint)
  B(-17.7, -16.5, 0, 2.4, -13.4, -12.2, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  // the bill-poster column (1880s, today) → in the 3000s the inkable light-pylon, now the column under the hotel stair's
  // top landing (fix round 3: the stair is the walk-up the pylon's climb was)
  // (fix round 2, review issue 3: not in Boss Battle — on the 247.5° bearing it left the boss a 1.7 m lane past the dome's
  //  column; the pylon it becomes is era 3, and the boss is held in era 2)
  B(-15.94, -14.54, 0, 2.6, -7.01, -5.61, { tag: 'poster-column', color: '#6e5f4c', pattern: PATTERN.wood, roof: true, paint: false, eras: '12', eraGroup: 'pylon-w', notIn: 'boss' }),
  B(-15.94, -14.54, 0, HOTEL_STAIR.yTop - 0.4, -7.01, -5.61, { tag: 'light-pylon', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'pylon-w' }),
  // ---- the hotel stair (fix round 3, review issue 1: the Halo's third way up, from each team's side flank). The 1880s and
  // today: a cast-iron CAB SHELTER on the ring against the balcony landing's west side (3.0 m, roof, not inkable: cover at
  // the 7:30 / 8 o'clock corner, and to HULLBREAKER a wall that keeps its shell from under the landing). The 3000s: inside
  // its footprint (ENGINE rule 19) a glass stair rises from the landing's west edge (2.4, stepped onto from the landing's
  // south half) north to 5.2, on over the ring at 4.0 m and more, to a top landing that meets the Halo's west corner.
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x1, 0, 3.0, HOTEL_STAIR.zK0, HOTEL_STAIR.zK1, { tag: 'cab-shelter', color: K.kiosk, pattern: PATTERN.metalpanel, roof: true, paint: false, eras: '12', eraGroup: 'stair-w' }),
  R([HS_X, HOTEL_STAIR.yFoot, HOTEL_STAIR.zFoot], [HS_X, HOTEL_STAIR.yTop, HOTEL_STAIR.zTop], HOTEL_STAIR.x1 - HOTEL_STAIR.x0, { tag: 'hotel-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: 'stair-w', thin: true, thickness: 0.4 }),
  // its glass base inside the old shelter (2.1: no kid climbs into the space left under the flight's north end)
  B(HOTEL_STAIR.x0 + 0.05, HOTEL_STAIR.x1 - 0.05, 0, 2.1, HOTEL_STAIR.zK0 + 0.05, HOTEL_STAIR.zK1 - 0.05, { tag: 'hotel-stair-base', color: K.glass, pattern: PATTERN.glasstile, paint: false, eras: '3', eraGroup: 'stair-w' }),
  // a glass side on its outer (west) edge, where the flight stands clear of the shelter (its bottom 3.4 m over the ring);
  // the inner side is open, a drop onto the ring (ENGINE rule 6's 160 blocks per jump)
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x0 + 0.12, 3.4, HOTEL_STAIR.yTop + 1, -12.6, HOTEL_STAIR.zTop, rail({ tag: 'hotel-stair-glass', eras: '3', eraGroup: 'stair-w' })),
  // the top landing (5.2: 0.1 under the 225° side, 0.2 under the 270° side it overlaps) on the light-pylon, glass on its
  // outer (west) side (its short north end is open: ENGINE rule 6's 160 blocks per jump)
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x1, HOTEL_STAIR.yTop - 0.4, HOTEL_STAIR.yTop, HOTEL_STAIR.zTop, HOTEL_STAIR.zLand, { tag: 'hotel-stair-landing', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'pylon-w', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]] }),
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x0 + 0.12, HOTEL_STAIR.yTop, HOTEL_STAIR.yTop + 1, HOTEL_STAIR.zTop, HOTEL_STAIR.zLand, rail({ tag: 'hotel-stair-glass', eras: '3', eraGroup: 'pylon-w' })),
];

// ------------------------------------------------------------------------------------------------ the Halo (the 3000s)
// a glass ring walkway at 5.4 (inner apothem 12.2, outer 14.6), half-sides 5.05 long, corner squares 0.1 lower; glass
// balustrades (rail) both edges; gaps where the stair lands (180°, x ±1.5), at the light-pylon (247.5°), and 2 m drop
// gaps in the inner edge at the middles of the 135° and 225° sides (DESIGN.md §2.6)
// (fix round 2: narrowed to 2.4 m. Fix round 3, review issue 1: 3.5 m wide again — inner edge 11.1 m out, the outer edge
//  and the superstop stairs' landings unchanged — and a third way up per team, the hotel stair from the balcony landing
//  onto its west corner (HOTEL_STAIR below), where the light-pylon now holds up the stair's top landing)
const HALO_Y = 5.4, AP_IN = 11.1, AP_OUT = 14.6, AP_MID = (AP_IN + AP_OUT) / 2, T22 = Math.tan(22.5 * DEG);
const HIN = AP_IN * T22, HOUT = AP_OUT * T22;   // half a side's length at the inner (4.80) and outer (6.05) edge
const haloPieces = [];
{
  // (the deck's 0.4 m edges are out of reach: only its top is turf)
  const N8 = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].flatMap((a) => [[Math.sin(a * DEG), 0, Math.cos(a * DEG)], [-Math.sin(a * DEG), 0, -Math.cos(a * DEG)]]).map((v) => v.map((x) => +x.toFixed(4)));
  const halo = (o) => ({ tag: 'halo', color: K.glass, pattern: PATTERN.glasstile, eras: '3', noPaint: N8, ...o });
  const hrail = (o) => rail({ tag: 'halo-rail', eras: '3', ...o });
  // half-sides [bearing of the side, which end (+1: the tangent's + end), group]; each runs from the side's middle to
  // its outer corner (6.05 m), so the two half-sides at a corner overlap there: the diagonal sides (135°, 225°) stand
  // 0.1 m lower (5.3), as DESIGN.md's corner squares did — no corner pieces, no corner rails (ENGINE rule 6's 160 blocks)
  const sides = [[90, 1, 'halo-1'], [135, -1, 'halo-2'], [135, 1, 'halo-3'], [180, -1, 'halo-4'], [180, 1, 'halo-5'], [225, -1, 'halo-6'], [225, 1, 'halo-7'], [270, -1, 'halo-8']];
  for (const [b, k, g] of sides) {
    const top = b % 90 === 0 ? HALO_Y : HALO_Y - 0.1;
    const nx = Math.sin(b * DEG), nz = Math.cos(b * DEG), tx = Math.cos(b * DEG), tz = -Math.sin(b * DEG);   // radial n, tangent t
    const at = (ap, m) => [+(ap * nx + k * m * tx).toFixed(4), +(ap * nz + k * m * tz).toFixed(4)];
    const [cx, cz] = at(AP_MID, HOUT / 2);
    haloPieces.push(O(cx, cz, +(AP_OUT - AP_IN).toFixed(4), +HOUT.toFixed(4), top - 0.4, top, b + 90, halo({ eraGroup: g })));
    // balustrades: the inner edge to its corner, the outer edge to its corner (the two outer rails cross there)
    let inner = [0.02, HIN - 0.12], outer = [0.02, HOUT + 0.03];
    if (b === 135 || b === 225) inner = [1.0, HIN - 0.12];        // the 2 m drop gaps (1 m each side of the middle)
    if (b === 180) outer = [1.5, HOUT + 0.03];                      // the stair lands at x −1.5 … 1.5
    if (b === 225 && k === 1) outer = [0.02, HOUT - 0.8];           // the west corner (247.5°): the hotel stair's landing
    if (b === 270 && k === -1) outer = [0.02, -HOTEL_STAIR.zLand - 0.15];   // (it joins the 270° side's outer edge from z −4.5)
    for (const [ap, [s0, s1]] of [[AP_IN - 0.06, inner], [AP_OUT + 0.06, outer]]) {
      const [rx, rz] = at(ap, (s0 + s1) / 2);
      haloPieces.push(O(rx, rz, 0.12, +(s1 - s0).toFixed(4), top, top + 1, b + 90, hrail({ eraGroup: g })));
    }
  }
  // planters at the two corners flanking the glass stair's landing (1.0 above the deck). (fix round 2, review issue 5:
  //  fewer planters, DESIGN.md §6.2 #1's first lever: the 112.5° and 247.5° ones are gone. One point of the Halo sees 60 %
  //  of the centre zone within 27 m and 51 % within 18 m, against 39 % / 16 % from a balcony and 21 % / 1 % from a
  //  Boathouse deck (halo-sight.mjs), so a perch over the zone keeps little cover of its own; the two kept stop the stair's
  //  head being a 7 m bare circle)
  // (fix round 3: and one on the 225° side by the hotel stair's head, clear of the landing's join at the west corner:
  //  the stair's top was 9 m from cover)
  for (const [b, g, r] of [[157.5, 'halo-3', 14.4], [202.5, 'halo-5', 14.4], [233, 'halo-7', 13.9]]) {
    const [px, pz] = polar(r, b);
    haloPieces.push(O(px, pz, 1.2, 1.2, HALO_Y - 0.1, HALO_Y + 1, b, { tag: 'halo-planter', color: K.planter, pattern: PATTERN.planter, eras: '3', eraGroup: g }));
  }
}

// ------------------------------------------------------------------------------------------------ Swimston Street
// the superstops (1880s cable-tram shelter / today's superstop: a solid 3.2 m median, roof) → the 3000s glass stair to
// the Halo inside the same footprint, in the same groups (ENGINE rule 19)
const SWIMSTON = [
  B(-1.5, 1.5, 0, 3.2, -26.6, -20.6, { tag: 'superstop', color: '#56685e', pattern: PATTERN.metal, roof: true, paint: false, eras: '12', eraGroup: 'stair-s1' }),
  B(-1.5, 1.5, 0, 3.2, -20.6, -14.6, { tag: 'superstop', color: '#56685e', pattern: PATTERN.metal, roof: true, paint: false, eras: '12', eraGroup: 'stair-s2' }),
  R([0, 0, -26.6], [0, 2.65, -20.6], 3, { tag: 'halo-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: 'stair-s1' }),
  R([0, 2.65, -20.6], [0, 5.3, -14.6], 3, { tag: 'halo-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: 'stair-s2' }),
  // (departs: DESIGN.md's `thickness: 5.4` makes the flight's block 8.7 m long, over ENGINE rule 3's 8 m; a support block
  //  inside superstop B's footprint carries it instead)
  B(-1.38, 1.38, 0, 2.6, -20.6, -14.6, { tag: 'halo-stair-base', color: K.glass, pattern: PATTERN.glasstile, paint: false, eras: '3', eraGroup: 'stair-s2' }),
  // the glass stair's side walls (inside the superstop's footprint: departs from x ±1.5 … ±1.62 so nothing appears
  // outside the old solid)
  B(1.38, 1.5, 0, 3.65, -26.6, -20.6, rail({ tag: 'stair-glass', eras: '3', eraGroup: 'stair-s1' })),
  B(-1.5, -1.38, 0, 3.65, -26.6, -20.6, rail({ tag: 'stair-glass', eras: '3', eraGroup: 'stair-s1' })),
  B(1.38, 1.5, 0, 6.3, -20.6, -14.6, rail({ tag: 'stair-glass', eras: '3', eraGroup: 'stair-s2' })),
  B(-1.5, -1.38, 0, 6.3, -20.6, -14.6, rail({ tag: 'stair-glass', eras: '3', eraGroup: 'stair-s2' })),
  // Alpha's parked tram on the east track (the era-slot kit: one collider, three looks)
  B(0.95, 3.55, 0, 3.2, -44, -38, { tag: 'tram', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  B(0.95, 3.55, 0, 3.2, -38, -32, { tag: 'tram', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  // the west-track tram stop and the west lane planter (Tower Command: the tower runs the west track instead)
  B(-3.8, -1, 0, 0.3, -42.5, -37.5, { tag: 'tram-island', color: K.stone, pattern: SURF.bluestone, notIn: 'tower' }),
  B(-3.4, -1.4, 0.3, 2.6, -42, -38, { tag: 'tram-shelter', color: K.iron, pattern: PATTERN.metal, roof: true, notIn: 'tower' }),
  B(-3.6, -2.4, 0, 1.2, -31.5, -30.3, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  // iron-lace verandas over the footpaths (off-limits tops) and their posts on the kerb line (x ±4.7)
  B(4.5, 7, 3.2, 3.4, -27, -19, { tag: 'veranda', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  // (fix round 2, review issue 3: veranda E1's cast-iron frieze along its kerb edge and north end, 2.55–3.2, see-through:
  //  the boss's nav sees it at 2.6 m, so its shell stays out from under the veranda)
  B(4.5, 5.0, 2.55, 3.1, -27, -19.5, rail({ tag: 'veranda-frieze' })), B(4.5, 7, 2.55, 3.0, -19.5, -19, rail({ tag: 'veranda-frieze' })),
  B(4.5, 7, 3.2, 3.4, -44, -31, { tag: 'veranda', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  B(-7, -4.5, 3.2, 3.4, -44, -40, { tag: 'veranda', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  ...[-26.85, -23.2, -19.15, -43.85, -40.4, -37, -31.15].map((z) => B(4.6, 4.8, 0, 3.2, z - 0.1, z + 0.1, { tag: 'veranda-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  ...[-43.85, -40.15].map((z) => B(-4.8, -4.6, 0, 3.2, z - 0.1, z + 0.1, { tag: 'veranda-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  // footpath cover: the news kiosk, the coffee cart, kerb planters (1.5 m: BossNav sees them)
  B(5.1, 6.5, 0, 2.2, -37.6, -35.6, { tag: 'news-kiosk', color: '#4d5f57', pattern: PATTERN.metal, roof: true }),
  OB(5.8, -23, 1.2, 2.2, 0, 1.5, 0, cover({ tag: 'coffee-cart', color: '#7a6a58' })),
  ...[-25.5, -21, -34, -42.5].map((z) => B(4.6, 5.2, 0, 1.5, z - 1, z + 1, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter }))),
  B(4.55, 5.15, 0, 1.5, -19.6, -19.0, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),   // (fix round 1: veranda E1's north end, the boss check)
  ...[-27.5, -23, -18.6].map((z) => B(-5.2, -4.6, 0, 1.5, z - 1, z + 1, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter }))),
];

// ------------------------------------------------------------------------------------------------ the west side
// the GPO (terrace 1.2 with its steps, piers and the stair up to the hotel gallery), the Royal Arcade (a building site
// in the 1880s), the Young & Jackfish (the flatiron hotel, its arch over the arcade, the iron-lace balcony and gallery),
// Hotel Lane, Prow Place, Hoki Lane. (departs: x −13.3 → −13.5, −19.1 → −19, z −18.6 → −18.5, −15.6 → −15.5, −12.6 →
// −12.5 so every tier edge sits on the ground's 0.5 m raster)
const WEST = [
  ...tierBoxes([P.gpo], 1.2, sand({ tag: 'gpo-terrace' })),
  R([-4.3, 0, -36], [-7, 1.2, -36], 8, stair({ tag: 'gpo-steps' })),
  B(-12.4, -11.4, 1.2, 3.2, -29.9, -28.9, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  B(-12.4, -11.4, 1.2, 3.2, -38.6, -37.6, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  R([-10, 1.2, -29], [-7, 2.4, -29], 3, stair({ tag: 'gpo-stair' })),
  ...bld(-13.5, -7, -44, -40, 9, { tag: 'corner-shop', color: K.gpo }, BOT),
  B(-13.5, -11, 9, 16, -42.5, -40, { tag: 'gpo-clocktower', color: K.gpo, pattern: PATTERN.render, roof: true, paint: false }),
  // the arcade: its two walls, its 0.6 mosaic floor (on across Hotel Lane and under the hotel arch), its glass vault
  ...bld(-14, -13.5, -46, -27.5, 7, { tag: 'arcade-wall', color: K.gpo }, BOT),
  // the west wall onto Hoki Lane, with two shopfront grilles (fix round 1, review issue 6: Hoki Lane and the arcade were
  // two walled corridors side by side; through the grilles — rail: shots, ink, sight and squids pass, kids do not — they
  // cross-fire as one flank; the first faces Prawn Alley's mouth)
  ...bld(-19, -18.5, -46, -41.5, 7, { tag: 'arcade-wall', color: K.gpo }, BOT), ...bld(-19, -18.5, -38, -34, 7, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...bld(-19, -18.5, -30.5, -27.5, 7, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...[[-41.5, -38], [-34, -30.5]].flatMap(([z0, z1]) => [B(-19, -18.5, BOT, 3, z0, z1, rail({ tag: 'arcade-grille', color: '#2f3a35' })),
    B(-19, -18.5, 3, 7, z0, z1, { tag: 'arcade-wall', color: K.gpo, pattern: PATTERN.render, roof: true, paint: false })]),
  ...tierBoxes([P.arcade], 0.6, ground({ tag: 'arcade-floor', color: '#8d8679', pattern: PATTERN.tiles })),
  B(-18.5, -14, 6, 6.3, -46, -27.5, { tag: 'arcade-roof', color: '#9fb1b5', pattern: PATTERN.glasstile, roof: true, paint: false }),
  // 1880s: the arcade under construction, hoarded and full of scaffold (gates: 2.8 m, roof, not inkable) → today: a kiosk,
  // a flower stall and a bench island inside the old hoardings' footprints, in the same groups
  B(-18.5, -14, 0.6, 3.4, -46, -39.33, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-1' }),
  B(-18.5, -14, 0.6, 3.4, -39.33, -32.67, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-2' }),
  B(-18.5, -14, 0.6, 3.4, -32.67, -27.5, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-3' }),
  OB(-16.25, -43, 1.2, 1.6, 0.6, 1.8, 0, cover({ tag: 'arcade-kiosk', color: '#5c6b62', eras: '23', eraGroup: 'arcade-1' })),
  OB(-16.25, -36, 1.2, 2, 0.6, 1.8, 0, cover({ tag: 'flower-stall', color: '#6f7a5a', eras: '23', eraGroup: 'arcade-2' })),
  OB(-16.25, -29.5, 1.2, 2.4, 0.6, 1.6, 0, cover({ tag: 'arcade-bench', color: '#7a6a58', eras: '23', eraGroup: 'arcade-3' })),
  // the hotel: H1 (to 9 m) and the prow's corner turret (to 13 m); the west wing on an arch over the arcade (soffit 3.8)
  ...bld(-14, -7, -22.5, -18.5, 9, { tag: 'hotel', color: K.hotel }, BOT),
  B(-14, -11.5, 9, 13, -21, -18.5, { tag: 'hotel-turret', hidden: true, roof: true, paint: false }),   // (the look: bluestone_turret)
  B(-19, -14, 3.8, 9, -22.5, -18.5, { tag: 'hotel-arch', color: K.hotel, pattern: PATTERN.render, roof: true, paint: false }),
  B(-19, -18.5, 0, 3.8, -22.5, -18.5, { tag: 'arch-pier', color: K.hotel, pattern: PATTERN.render, roof: true }),
  // the balcony (Alpha's raised corner over mid) and the gallery over Swimston's west footpath, the landing, the stair
  B(-14, -5, 2.1, 2.4, -18.5, -15.5, { tag: 'balcony', color: K.planks, pattern: PATTERN.planks }),
  // (fix round 1, review issue 6: Hotel Lane is 5 m wide, the GPO terrace's north edge at z −27.5; the GPO stair and the
  //  gallery's south end move 1.5 m south with it)
  B(-7, -5, 2.1, 2.4, -30.5, -18.5, { tag: 'gallery', color: K.planks, pattern: PATTERN.planks }),
  B(-14, -11, 2.1, 2.4, -15.5, -12.5, { tag: 'balcony-landing', color: K.planks, pattern: PATTERN.planks }),
  R([-5, 0, -14], [-11, 2.4, -14], 3, stair({ tag: 'balcony-stair', color: K.iron, pattern: PATTERN.treads })),
  ...[[-13.85, -12.65], [-13.85, -15.4], [-5.1, -30.35], [-5.1, -27.8], [-5.1, -25.25], [-5.1, -21], [-5.1, -16]].map(([x, z]) => B(x - 0.125, x + 0.125, 0, 2.1, z - 0.125, z + 0.125, { tag: 'balcony-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  B(-13.5, -12.5, 2.4, 3.4, -15.5, -14.7, cover({ tag: 'balcony-planter', color: K.planter, pattern: PATTERN.planter })),   // (adds: cover on the landing)
  // (fix round 2, review issue 3: the iron-lace balustrade with its flower boxes on the balcony's and the landing's open
  //  edges, 1.0 / 0.9 m tall, 0.5 m deep, see-through (rail: shots, ink, sight and squids pass; you hop it to drop off).
  //  HULLBREAKER's nav samples 2.6 m on a 0.5 m grid, so to it the edges are walls and its shell can no longer reach
  //  under the balcony or the landing)
  B(-11, -5, 2.4, 3.4, -16.0, -15.5, rail({ tag: 'balustrade' })),
  B(-5.5, -5, 2.4, 3.3, -18.5, -16.0, rail({ tag: 'balustrade' })),
  B(-14, -11, 2.4, 3.3, -13.0, -12.5, rail({ tag: 'balustrade' })),
  // (fix round 3: the landing's west edge is open — the cab shelter stands against it in the 1880s and today, and the
  //  hotel stair rises from it in the 3000s)
  B(-6.6, -5.4, 2.4, 3.4, -27.1, -26.5, cover({ tag: 'balcony-planter', color: K.planter, pattern: PATTERN.planter })),    // (adds: the gallery's south end, 6 m from cover in the 3000s once the superstop is a glass stair)
  B(-13.4, -11.4, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-9, -7, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  // (fix round 1, review issue 8: DESIGN.md §4.5's three overhang spots, measured with the boss check — HULLBREAKER's
  //  centre came within 1.3 m of the balcony's corner and 2.25 m of the landing and veranda E1, so its legs (2.6 m) stood
  //  under them; these 1.5 m planters, which its nav sees, are the design's own fix)
  B(-14, -13.4, 0, 1.5, -15.4, -13.4, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-6.2, -5.2, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-4.8, -4.0, 0, 1.5, -16.0, -15.2, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),   // (fix round 2: the balcony's NE corner, against the boss's claws)
  // Prow Place's fountain; Hoki Lane's cover, alternating sides
  B(-23.6, -22, 0, 1.2, -24.6, -23, cover({ tag: 'fountain', color: '#8a8e8c' })),
  B(-22.9, -21.9, 0, 1, -31.7, -29.3, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-20.2, -19, 0, 1, -30, -28.4, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-23.2, -22, 0, 1.2, -37.6, -36.4, cover({ tag: 'bins', color: '#56605a' })),
  B(-20.2, -19, 0, 1.2, -37, -35.8, cover({ tag: 'bins', color: '#56605a' })),
  B(-21.6, -20.1, 0, 1, -43.75, -42.25, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
];

// ------------------------------------------------------------------------------------------------ the viaduct and the railyard walls
// the railyard (out of play: the embankment behind the viaduct, props.js) is walled off from the lanes: the viaduct
// (south of Prawn Alley) over Hoki Lane, the alley's railyard wall, the wall behind the terrace's chamfered corner.
// 4.1 m (not inkable, roof). (fix round 2: north of the alley the viaduct is gone — Hoki Lane and Prow Place open west
// onto the signal yard)
const EMB = 3.0;
const VN = [-0.9929, 0.1191];   // the viaduct diagonal's outward (railyard-side) normal
const VQ6 = [-27, -58];   // (the viaduct's line runs Q5 → VQ6; the terrace's corner V50 lies on it)
const vband = (z0, z1, top, o = {}) => lineBand(Q.Q5, VQ6, z0, z1, VN, 0, 0.6, BOT, top, wall({ tag: 'viaduct', ...o }));
const pier = (x, z, deg = 0, s = 0.8) => O(x, z, s, s, BOT, 4.4, deg, wall({ tag: 'viaduct-pier' }));

// ------------------------------------------------------------------------------------------------ Prawn Alley (every era)
// (fix round 1: the X's arms were dead ends; fix round 2: rebuilt; fix round 3: it turns off at the restored tip.) The
// goods lane from the arm's tip (along −56 … −49: it leaves the tip's south edge beside the tram terminus) east-south-east
// to Hoki Lane, 5 m wide, about 20 m long, at street level, so the tip is part of a loop, never a dead end. Its south-west
// side is the railyard wall (4.25 m); its north-east side is open: the signal yard's 0.9 m edge (the 1880s, today) or the
// Signal Garden's walk (the 3000s), so it is no trench. Hoki Lane → the alley → the tip → the arm → 8 o'clock is a loop
// round the yard. Its frame: t along the alley from the tip (bearing 112°), s across it (bearing 22°, toward the yard);
// s = −2.5 is the wall side and passes through the tip's south corner Q3.
const ALY_DEG = 112, ALY_C = [Math.sin(ALY_DEG * DEG), Math.cos(ALY_DEG * DEG)], ALY_N = [Math.sin((ALY_DEG - 90) * DEG), Math.cos((ALY_DEG - 90) * DEG)];
const ALY_A0 = [Q.Q3[0] + 2.5 * ALY_N[0], Q.Q3[1] + 2.5 * ALY_N[1]];
export const AL = (t, s) => [+(ALY_A0[0] + t * ALY_C[0] + s * ALY_N[0]).toFixed(4), +(ALY_A0[1] + t * ALY_C[1] + s * ALY_N[1]).toFixed(4)];
const alBox = (t0, t1, s0, s1, y0, y1, o = {}) => { const [cx, cz] = AL((t0 + t1) / 2, (s0 + s1) / 2); return O(cx, cz, +(s1 - s0).toFixed(4), +(t1 - t0).toFixed(4), y0, y1, ALY_DEG, o); };
export const alPoly = (t0, t1, s0, s1) => [AL(t0, s0), AL(t1, s0), AL(t1, s1), AL(t0, s1)];
// the t at which the line s = const meets a line f(x, z) = 0 (f linear)
const alT = (s, f) => { const [x0, z0] = AL(0, s), [x1, z1] = AL(1, s), f0 = f(x0, z0); return +(f0 / (f0 - f(x1, z1))).toFixed(4); };
const fArm = (o) => (x, z) => offOf(x, z) - o;                               // the arm's off = o line
const fAlong = (a) => (x, z) => along(x, z) - a;                            // the arm's along = a line
const fVia = (d) => (x, z) => x + 24 - 0.12 * (z + 33) + d;                  // the viaduct's inner face (d 0), outer (d 0.6043)
export const ALLEY = { w: 5, quad: [AL(alT(2.5, fArm(-ARM_W)), 2.5), AL(alT(-2.5, fArm(-ARM_W)), -2.5), AL(alT(-2.5, fVia(0)), -2.5), AL(alT(2.5, fVia(0)), 2.5)] };
const ALLEY_FLOOR_POLY = ALLEY.quad;
ALLEY.floor = ALLEY_FLOOR_POLY;
// (for the job folder's tools) a point's alley frame [t, s]
export const alFrame = (x, z) => { const dx = x - ALY_A0[0], dz = z - ALY_A0[1]; return [dx * ALY_C[0] + dz * ALY_C[1], dx * ALY_N[0] + dz * ALY_N[1]]; };
const ALLEY_FLOOR = coverRects(ALLEY_FLOOR_POLY, { x0: -48, x1: -22, z0: -45, z1: -26 });
GROUND_MISS.push(...ALLEY_FLOOR.miss);
const tW0 = alT(-3.1, fAlong(ARM_END)), tW1 = alT(-3.1, fVia(0.6043));      // the railyard wall's outer face, end to end
const ATOP = 4.25;
const PRAWN_ALLEY = [
  ...tierBoxes(ALLEY_FLOOR.rects, 0, ground({ tag: 'alley', color: '#555c65' })),
  // its kerbs: the two mouths at −0.09 (level with the arm's and Hoki Lane's), a gutter along each long side at −0.18
  // (each stops where its inner edge meets a mouth, so it never reaches into the arm's or Hoki Lane's kerbs)
  ...bars(ALLEY_FLOOR_POLY, { only: (i) => i === 0 || i === 2, level: () => -0.09, opts: ground({ tag: 'alley-kerb', color: '#535a63' }) }),
  ...[[1.0, 2.5], [-2.5, -1.0]].map(([s0, s1]) => alBox(Math.max(alT(s0, fArm(-ARM_W)), alT(s1, fArm(-ARM_W))), Math.min(alT(s0, fVia(0)), alT(s1, fVia(0))), s0, s1, BOT, -0.18, ground({ tag: 'alley-kerb', color: '#535a63' }))),
  // the railyard wall (4.25 m: a hand over the viaduct it runs into, so no two wall tops meet level), from the tip's end
  alBox(tW0, tW1, -3.1, -2.5, BOT, ATOP, wall({ tag: 'alley-wall' })),
  // piers at the wall's two ends
  ...[[-2.8, fAlong(ARM_END)], [-2.8, fVia(0.302)]].map(([s, f]) => { const [x, z] = AL(alT(s, f), s); return pier(x, z, ALY_DEG, 0.7); }),
  // cover: a goods barrow and a bin by the wall, a crate stack by the yard (each 1.2 m; 3.8 m clear beside each)
  alBox(7.0, 9.4, -2.3, -1.1, 0, 1.2, cover({ tag: 'barrow', color: K.wood, pattern: PATTERN.wood })),
  alBox(13.0, 15.0, 1.1, 2.3, 0, 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  alBox(18.4, 19.6, -2.3, -1.1, 0, 1.2, cover({ tag: 'bins', color: '#56605a' })),
];
// the viaduct south of the alley (its segment ends clear of the alley's floor and wall) down to the terrace's corner V50,
// and the wall along the terrace's cut-back west edge (V50 → QW1; fix round 3)
const zVS = Math.min(AL(tW1, -3.1)[1], AL(alT(-2.5, fVia(0)), -2.5)[1]) - 0.35;
const TW_N = [-0.9180, -0.3961];   // the terrace's west edge (V50 → QW1): its outward normal
const VIADUCT = [
  pier(-26.4, -50.15),
  vband(zVS, -49.75, 4.1),
  lineBand(V50, Q.QW1, -50.55, -64, TW_N, 0, 0.6, BOT, 4.1, wall({ tag: 'yard-wall' })),
];

// ------------------------------------------------------------------------------------------------ the signal yard and the Signal Garden
// (fix round 2: rebuilt in the crook between the arm, Prow Place / Hoki Lane and Prawn Alley; fix round 3: grown with the
// alley's new line and made a WALK on the routes.) The 1880s and today: the railway's SIGNAL YARD, a ballast bed 0.9 m
// above the street behind a bluestone kerb — off limits (roof: you slide off), low, so the arm, the alley, Prow Place and
// Hoki Lane see and shoot across it. (In Boss Battle an iron fence on its edge keeps HULLBREAKER off it.) The 3000s: the
// SIGNAL GARDEN, a park terrace at 1.2 m over the whole yard (ENGINE rule 19b: it buries the yard's roof): a continuous
// raised walk from the arm's tip, along Prawn Alley's yard edge, to Hoki Lane and Prow Place — a hop up (1.2: nav's jump
// edges reach 1.25, the GPO terrace's height) from the arm, the alley, Prow Place and Hoki Lane anywhere along its edges,
// so it is a step of the flank itself, never a detour (round 2's 2.68 m deck with its stairs was 23 % inked, round 3's
// first, with three stairs, 8–38 %). Its planters are roof (no standing on them).
const YARD_Y = 0.9, GY = 1.2;
const YB = AL(alT(2.5, fArm(-ARM_W)), 2.5), YC = AL(alT(2.5, fVia(0)), 2.5);
// the yard: Prow Place's corner (along MS.a0), the arm's edge (→ R4 → R3 → the alley's mouth), the alley's edge, Hoki Lane
export const YARD = [Q.MS0, Q.MS1, Q.R4, Q.R3, YB, YC, Q.Q5];
// the garden is the whole yard (the lawn and the walk along the alley)
export const GARDEN_POLY = YARD;
// tiles (each its own era group, ≤ 8 m): the garden's edges are split where they cross a tile line
const GT_X = [-41, -35, -30, -24], GT_Z = [-37, -30, -23, -16];   // (on the garden's 1 m raster)
export const tileOf = (x, z) => { let i = 0, j = 0; while (i < GT_X.length - 2 && x >= GT_X[i + 1]) i++; while (j < GT_Z.length - 2 && z >= GT_Z[j + 1]) j++; return `garden-${i}${j}`; };
const yardCol = { color: '#4c4741', pattern: SURF.bluestone, roof: true, paint: false };
// the signal yard's iron fence: Boss Battle only (onlyIn: 'boss'), 1.4 m of railing on the bed's edge, see-through, so
// HULLBREAKER's nav sees a wall (round 2: without it the boss walked over the bed into Hoki Lane and on to the bases).
// In the other modes the bed's edge is open: a kid who hops on slides off its roof; in the 3000s the garden covers it.
export const YARD_FENCE_LINES = [];
const YARD_FENCE = (() => {
  const out = [], n = YARD.length, s = polyArea(YARD) > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    let a = YARD[i], b = YARD[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.4) continue;
    const u = [dx / L, dz / L], inw = [-u[1] * s, u[0] * s];
    a = [a[0] + u[0] * 0.1, a[1] + u[1] * 0.1]; b = [b[0] - u[0] * 0.1, b[1] - u[1] * 0.1]; L -= 0.2;
    const cx = (a[0] + b[0]) / 2 + inw[0] * 0.1, cz = (a[1] + b[1]) / 2 + inw[1] * 0.1, h = i === n - 1 && i % 2 === 0 ? 1.16 : i % 2 ? 1.4 : 1.28;
    out.push(O(+cx.toFixed(4), +cz.toFixed(4), 0.1, +L.toFixed(4), YARD_Y, YARD_Y + h, +((Math.atan2(dx, dz) * 180) / Math.PI).toFixed(4), rail({ tag: 'yard-fence', onlyIn: 'boss' })));
    YARD_FENCE_LINES.push({ pos: [+cx.toFixed(3), YARD_Y, +cz.toFixed(3)], rotY: Math.atan2(dx, dz), len: +L.toFixed(3), h, onlyIn: 'boss' });
  }
  return out;
})();
const YARD_SLAB = (() => {
  const R0 = coverRects(YARD, { x0: -41, x1: -24, z0: -37, z1: -16 });
  GROUND_MISS.push(...R0.miss);
  const n = YARD.length, diag = (i) => { const a = YARD[i], b = YARD[(i + 1) % n]; return Math.abs(a[0] - b[0]) > 1e-3 && Math.abs(a[1] - b[1]) > 1e-3; };
  return [
    ...R0.rects.map(([x0, x1, z0, z1]) => B(x0, x1, BOT, YARD_Y, z0, z1, { tag: 'signal-yard', ...yardCol })),
    ...bars(YARD, { only: diag, trim: true, level: (i) => YARD_Y - 0.1 - 0.08 * (i % 2), opts: { tag: 'signal-yard-kerb', ...yardCol, color: '#5f6870' } }),
    ...reflexPatches(YARD, { only: (i) => diag(i) && diag((i + n - 1) % n), top: YARD_Y - 0.32, opts: { tag: 'signal-yard-kerb', ...yardCol } }),
    ...YARD_FENCE,
  ];
})();
const SIGNAL_GARDEN = (() => {
  const out = [];
  const lawn = (g, o = {}) => ({ tag: 'garden-lawn', color: K.lawn, pattern: PATTERN.planter, eras: '3', eraGroup: g, ...o });
  // the lawn: per tile, the raster cores (on the yard's ballast, 0.9 → 1.2) and the bars along its diagonal edges (1.08 /
  // 0.98: over the yard's own kerb bars, 0.9 / 0.82, and under the lawn), each bar in the tile its middle lies in
  for (let i = 0; i < GT_X.length - 1; i++) for (let j = 0; j < GT_Z.length - 1; j++) {
    const R1 = coverRects(GARDEN_POLY, { x0: GT_X[i], x1: GT_X[i + 1], z0: GT_Z[j], z1: GT_Z[j + 1] }, { cell: 1.0 });   // (a 1 m raster: fewer blocks, ENGINE rule 6's 160 per jump)
    GROUND_MISS.push(...R1.miss);
    for (const [x0, x1, z0, z1] of R1.rects) out.push(B(x0, x1, YARD_Y, GY, z0, z1, lawn(tileOf((x0 + x1) / 2, (z0 + z1) / 2))));
  }
  // (the bars run along whole edges — the long ones halved, the alley's edge in thirds — each in the tile its middle lies in; trimmed at acute
  //  corners so none pokes out over the street)
  const lerp = (P, R, f) => [+(P[0] + (R[0] - P[0]) * f).toFixed(4), +(P[1] + (R[1] - P[1]) * f).toFixed(4)];
  const ge = [Q.MS0, Q.MS1, lerp(Q.MS1, Q.R4, 0.5), Q.R4, Q.R3, lerp(Q.R3, YB, 0.5), YB, lerp(YB, YC, 1 / 3), lerp(YB, YC, 2 / 3), YC, Q.Q5];
  const diag = (i) => { const a = ge[i], b = ge[(i + 1) % ge.length]; return Math.abs(a[0] - b[0]) > 1e-3 && Math.abs(a[1] - b[1]) > 1e-3; };
  for (const d of bars(ge, { only: diag, trim: true, level: (i) => GY - 0.12 - 0.1 * (i % 2), y0: YARD_Y - 0.1, opts: lawn('') })) { d.eraGroup = tileOf(d.center[0], d.center[2]); out.push(d); }
  // cover on the lawn and the walk: planters (roof: nobody stands on them), 1.2 m over the lawn, about 6–8 m apart
  for (const [x, z, w, d] of [[-27.2, -21.6, 1.2, 2.4], [-29.6, -27.0, 2.4, 1.2], [-25.6, -31.4, 1.2, 1.2], [-34.4, -28.4, 1.2, 1.2], [-30.6, -32.0, 1.2, 1.2]]) out.push(B(x - w / 2, x + w / 2, GY, GY + 1.2, z - d / 2, z + d / 2, cover({ tag: 'garden-planter', color: K.planter, pattern: PATTERN.planter, roof: true, eras: '3', eraGroup: tileOf(x, z) })));
  return out;
})();

// ------------------------------------------------------------------------------------------------ Alpha's arm: Flathead Street WSW
// cross-section: carriageway |off| ≤ 6 (the tram track on its axis); on the river side the warehouses (off 6 … 10 or
// 14) and the riverside promenade (off 10 … 14) where Bravo's Iron Bridge and boardwalk land; on the railyard side the
// signal yard / Signal Garden (off < −6)
const armCover = (a, o, w, d, y0, y1, opts) => { const [x, z] = AO(a, o); return OB(x, z, w, d, y0, y1, 65, opts); };
// (fix round 2: the arm ended at along −48 and lost its West Wharf. Fix round 3, review issue 2 — the X restored: the
//  round-2 street (off −6 … 14) runs on to along −40, where Bravo's Iron Bridge lands on the promenade; beyond it the arm
//  narrows to off ±9.5 and runs to along −56, the TRAM TERMINUS: the tram waits on the track (the era-slot kit), a
//  loading platform (1.4) on the river side with two ways up (steps from the street at its east end and on its south
//  side) and cover, looking back down the arm to the circus and over the yard toward Prow Place; Prawn Alley leaves the
//  tip's south edge (a loop, no dead end), and in the 3000s the Signal Garden's tip stair rises beside it. Review issue 1:
//  W2 reaches along −31.1, so the arm's river walk is only where the bridge and the boardwalk land)
const T = TERMINUS;
const ARM = [
  ...(() => { const [x, z] = AO(-26.82, 10); return obld(x, z, 8, 8.64, 65, 7, { tag: 'warehouse', color: K.ware, pattern: PATTERN.brick, noPaint: [[-C65, 0, S65]] }); })(),
  armCover(-31, 0, 2.4, 6, 0, 0.3, { tag: 'tram-island', color: K.stone, pattern: SURF.bluestone }),
  armCover(-31, 0, 1, 4, 0.3, 2.6, { tag: 'tram-shelter', color: K.iron, pattern: PATTERN.metal, roof: true }),
  armCover(-37.4, 3.6, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })), armCover(-26, 3.6, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })),
  armCover(-23.5, -4, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })),
  // (fix round 2: the street's middle stretch, the strip test's 30 m line once the south walk's crates went with it)
  armCover(-31.3, 3.8, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })), armCover(-28.4, -3.4, 1.2, 1.6, 0, 1.2, cover({ tag: 'bollards' })),
  // the promenade at the bridge landing
  armCover(-36, 12, 0.8, 2, 0, 1, cover({ tag: 'bench', color: '#7d6c5a' })),
  // ---- the tram terminus (fix round 3)
  // the tram at the end of the line (the era-slot kit's collider: a cable tram, a tram, a float-tram; 2.6 × 6 × 3.2, roof)
  armCover(-44.5, 0, 2.6, 6, 0, 3.2, { tag: 'tram', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  // the loading platform (1.4: a wall to a kid, so stairs) and its two stair flights; its faces over the water not inkable
  ...(() => { const [x, z] = AO((T.a0 + T.a1) / 2, (T.o0 + T.o1) / 2), w = T.o1 - T.o0, d = T.a1 - T.a0, nP = [[-C65, 0, S65], [-S65, 0, -C65]];
    // (its base stops 0.1 m under the street cores' bases it overlaps: no shared tops)
    return [O(x, z, w, d, BOT, TIER_Y - 0.1, 65, { tag: 'terminus-base', color: K.stone, pattern: SURF.bluestone, paint: false }),
      O(x, z, w, d, TIER_Y - 0.1, T.y, 65, { tag: 'terminus', color: K.planks, pattern: PATTERN.planks, noPaint: nP })]; })(),
  R(AO(-44.8, 7).flatMap((v, i) => (i ? [v] : [v, 0])), AO(T.a1, 7).flatMap((v, i) => (i ? [v] : [v, T.y])), 3, stair({ tag: 'terminus-steps', color: K.wood, pattern: PATTERN.treads })),
  R(AO(-53, 0.3).flatMap((v, i) => (i ? [v] : [v, 0])), AO(-53, T.o0).flatMap((v, i) => (i ? [v] : [v, T.y])), 3, stair({ tag: 'terminus-steps', color: K.wood, pattern: PATTERN.treads })),
  // on the platform: the terminus shelter (roof) against the river rail, a stack of mail sacks and crates at its east end
  armCover(-52.5, 8.6, 1.0, 3.5, T.y, T.y + 2.2, { tag: 'terminus-shelter', color: K.iron, pattern: PATTERN.metal, roof: true }),
  armCover(-49.3, 4.3, 1.2, 1.4, T.y, T.y + 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  // the street at the tip: crates by the alley's mouth, a bollard pair past the tip stair's foot
  armCover(-53, -5.2, 1.2, 2.4, 0, 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  armCover(-41.5, -7.8, 1.2, 1.6, 0, 1.0, cover({ tag: 'bollards' })),
  // the river railings (every rail's ends on the outline or on another rail): the step in to the tip, the tip's river
  // edge (on the platform, 1.4 → 2.4), its end, the promenade beside the bridge landing, the boardwalk landing (the 1880s)
  armBox(ARM_TIP, ARM_TIP + 0.15, ARM_W, 14, 0, 1, rail({ tag: 'river-rail' })),
  armBox(T.a1, ARM_TIP, ARM_W - 0.15, ARM_W, 0, 1, rail({ tag: 'river-rail' })),
  armBox(ARM_END, T.a1, ARM_W - 0.15, ARM_W, T.y, T.y + 1, rail({ tag: 'river-rail' })),
  armBox(ARM_END, ARM_END + 0.15, -ARM_W, T.o0, 0, 1, rail({ tag: 'river-rail' })),
  armBox(ARM_END, ARM_END + 0.15, T.o0, ARM_W - 0.15, T.y, T.y + 1, rail({ tag: 'river-rail' })),
  armBox(-39.85, -39.23, 14, 14.15, 0, 1, rail({ tag: 'river-rail' })),
  armBox(-22.5, -21.22, 14, 14.15, 0, 1, rail({ tag: 'river-rail' })),
  armBox(-21.22, -17.39, 14, 14.15, 0, 1, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-4' })),   // (where Bravo's boardwalk lands from today)
];

// ------------------------------------------------------------------------------------------------ the east side
// Swimston's east shops and Little Lane, Degrayling Lane (0.6 pavements; its north end stacked with crates in the
// 1880s), the bond store, Centre Plaice (the side zone), the Boathouse (deck 2.4, two stairs), the Yabby quay
const EAST = [
  ...bld(7, 10.5, -27, -19, 7, { tag: 'shops', color: K.shop, pattern: PATTERN.brick }, BOT),
  ...bld(7, 10.5, -44, -31, 7, { tag: 'shops', color: K.shop, pattern: PATTERN.brick }, BOT),
  ...tierBoxes([P.degS, P.degN], 0.6, ground({ tag: 'degrayling', color: '#626a73' })),
  // (fix round 2, DESIGN.md §6.2 #3's lever, review issue 1: the bots left the 1880s east side half bare — it was a
  //  pocket behind a lane shut by crates. The produce stacks now fill the lane's east half only: a 3 m passage runs past
  //  them, so the 1880s have a street-level left flank to 5 o'clock; today clears the stacks and widens it)
  B(13.5, 16.5, 0.6, 3.4, -24, -19.25, { tag: 'crates-stack', color: K.crate, pattern: PATTERN.wood, roof: true, paint: false, notIn: 'tower', eras: '1', eraGroup: 'crates-1' }),
  B(13.5, 16.5, 0.6, 3.4, -19.25, -14.5, { tag: 'crates-stack', color: K.crate, pattern: PATTERN.wood, roof: true, paint: false, notIn: 'tower', eras: '1', eraGroup: 'crates-2' }),
  OB(15, -21.4, 1.2, 1.2, 0.6, 1.6, 0, cover({ tag: 'cafe', color: '#7b6f60', notIn: 'tower', eras: '23', eraGroup: 'crates-1' })),
  OB(15, -16.9, 1.2, 1.2, 0.6, 1.6, 0, cover({ tag: 'cafe', color: '#7b6f60', notIn: 'tower', eras: '23', eraGroup: 'crates-2' })),
  OB(13.6, -41.4, 1.2, 1.2, 0.6, 1.6, 0, cover({ tag: 'cafe', color: '#7b6f60', notIn: 'tower' })),
  ...bld(16.5, 19.5, -44, -38, 7, { tag: 'bond-store', color: K.bond, pattern: SURF.bluestone }, BOT),
  // Centre Plaice's cover (the side zone)
  OB(16.4, -33, 1.2, 2.2, 0, 1.5, 0, cover({ tag: 'plaice-cart', color: '#7a6a58' })),
  OB(13.6, -34.4, 1.2, 1.2, 0, 1, 0, cover({ tag: 'cafe', color: '#7b6f60' })),
  OB(13.2, -37.1, 2.4, 1, 0, 1, 0, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  OB(17.2, -36, 0.6, 2, 0, 0.9, 0, cover({ tag: 'bench', color: '#7d6c5a' })),
  // the Boathouse: its roof deck is Alpha's left raised corner; its east wall is the river wall
  ...tierBoxes([P.boathouse], 2.4, { tag: 'boathouse', color: '#8a7158', pattern: PATTERN.weatherboard }),
  R([19.5, 0, -30], [19.5, 2.4, -24], 3, stair({ tag: 'boathouse-stair', color: K.wood, pattern: PATTERN.treads })),
  R([19, 0, -6], [19, 2.4, -12], 3, stair({ tag: 'boathouse-stair', color: K.wood, pattern: PATTERN.treads })),
  B(21.35, 21.5, 2.4, 3.4, -24, -12, rail({ tag: 'deck-rail' })),
  B(17, 19.4, 2.4, 3.4, -22.6, -21.8, cover({ tag: 'deck-racks', color: '#7d6c5a' })),
  B(18.4, 19.6, 2.4, 3.4, -16.2, -14.6, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  // the quay
  B(20.5, 21.5, 0, 1, -42, -40, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(22.4, 23.4, 0, 1, -47, -45.4, cover({ tag: 'bollards', notIn: 'tower' })),
  // the river railings: the terrace's east edge, the quay, the Plaice's and the apex's river edges (1880s: where the
  // boardwalk opens from today)
  // (fix round 3: the terrace's east corner and the quay cut back, review issue 1's bare strips)
  lineBand(Q.QE1, Q.QE0, -63.9, -60.05, [0.7526, -0.6585], 0, 0.15, 1, 2, rail({ tag: 'river-rail' })),
  lineBand(Q.QE0, U50, -59.95, -50.05, [0.9988, 0.0499], 0, 0.15, 1, 2, rail({ tag: 'river-rail' })),
  lineBand(U50, Q.Q12, -50, -30.05, [0.9850, 0.1724], 0, 0.15, 0, 1, rail({ tag: 'river-rail' })),
  B(21.5, 21.65, 0, 1, -30, -24, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-1' })),
  B(21.5, 21.65, 0, 1, -12, -10.2, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-3' })),
  B(21.5, 21.65, 0, 1, -10.2, -5.62, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-4' })),
];

// ------------------------------------------------------------------------------------------------ the river works (today, the 3000s)
// the riverside boardwalk (over the water: ENGINE rule 20; bottom −0.6, not a waterline slab), the Iron Bridge from it to
// Bravo's arm (16 cm under the arm walk), and the 1880s barrier where Alpha's bridge lands
const BA = [25, -20], BD = [Math.sin(30 * DEG), Math.cos(30 * DEG)], BR = [Math.cos(30 * DEG), -Math.sin(30 * DEG)];   // the bridge's centreline, right
const SPANS = [-4, 1.96, 7.92, 13.88, 19.84, 23.09, 26.35, 29.0];
const RIGHT = [-4.02, 28.93], LEFT = [4.02, 22.30];   // where each side line leaves the boardwalk and reaches Bravo's arm
const bp = (m, s) => [BA[0] + BD[0] * m + BR[0] * s, BA[1] + BD[1] * m + BR[1] * s];
// (fix round 1, review issue 3: the decks are lowered — the boardwalk to −0.34, the bridge to −0.43 — so where their ends
//  reach over the river-edge kerb (−0.26) they lie inside it, 8–16 cm under its top, and never appear over ground anyone
//  stands on; from the Plaice the boardwalk is a 0.34 m step down, under a kid's 0.35 m step)
const BWY = -0.34, BRY = -0.43;
const RIVER = [];
{
  const bw = (o) => ({ tag: 'boardwalk', color: K.planks, pattern: PATTERN.planks, eras: '23', ...o });
  [[-30, -23.4], [-23.4, -16.8], [-16.8, -10.2], [-10.2, -3.49]].forEach(([z0, z1], i) => RIVER.push(B(21.5, 25, -0.6, BWY, z0, z1, bw({ eraGroup: `bw-${i + 1}` }))));
  RIVER.push(B(25, 25.15, BWY, BWY + 1, -30, -24.6, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-1' })));   // (fix round 2: no Tide Steps)
  RIVER.push(B(25, 25.15, BWY, BWY + 1, -15.4, -10.2, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-3' })));
  RIVER.push(B(25, 25.15, BWY, BWY + 1, -10.2, -3.72, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-4' })));
  // (adds: the boardwalk's south end over the water needs its rail too)
  RIVER.push(B(21.65, 25.15, BWY, BWY + 1, -30.15, -30, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-1' })));
  RIVER.push(OB(24.2, -28, 1.2, 1.6, BWY, 1, 0, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, eras: '23', eraGroup: 'bw-1' })));
  // (fix round 1, review issue 5: the strip test found 25.5 m bare along the boardwalk's west half; this planter now
  //  stands against the Boathouse, the other one on the river side: they alternate, 2.4 m passes beside each)
  RIVER.push(OB(22.1, -13.6, 1.0, 1.6, BWY, 1, 0, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, eras: '23', eraGroup: 'bw-3' })));
  for (let k = 0; k < SPANS.length - 1; k++) {
    const m0 = SPANS[k], m1 = SPANS[k + 1], g = `bridge-${k + 1}`, [cx, cz] = bp((m0 + m1) / 2, 0);
    RIVER.push(O(+cx.toFixed(4), +cz.toFixed(4), 4.5, +(m1 - m0).toFixed(4), -0.7, BRY, 30, { tag: 'iron-bridge', color: K.bridge, pattern: PATTERN.planks, eras: '23', eraGroup: g, noPaint: [[0.866, 0, -0.5], [-0.866, 0, 0.5]] }));
    for (const [s, [r0, r1]] of [[2.32, RIGHT], [-2.32, LEFT]]) {
      const a = Math.max(m0, r0) + 0.01, b = Math.min(m1, r1) - 0.01;
      if (b - a < 0.05) continue;
      const [rx, rz] = bp((a + b) / 2, s);
      RIVER.push(O(+rx.toFixed(4), +rz.toFixed(4), 0.15, +(b - a).toFixed(4), BRY, BRY + 1, 30, rail({ tag: 'bridge-rail', eras: '23', eraGroup: g })));
    }
  }
  RIVER.push(OB(27.59, -18.31, 1, 1.4, BRY, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-2' })));
  RIVER.push(OB(31.13, -6.59, 1, 1.4, BRY, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-4' })));
  // (fix round 1, review issue 3: this lamp stood where Bravo's arm walk is in the 1880s; it is now on the span's water
  //  side, 1.6 m short of the arm's edge)
  { const [lx, lz] = bp(24.6, 1.4); RIVER.push(OB(+lx.toFixed(3), +lz.toFixed(3), 1, 1.4, BRY, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-6' }))); }
  // (adds: two more lamp plinths in spans 3 and 4: the cover map found 11 m open circles on the deck between the lamps)
  for (const [m, g] of [[9.0, 'bridge-3'], [19.2, 'bridge-4']]) { const [lx, lz] = bp(m, 1.4); RIVER.push(OB(+lx.toFixed(3), +lz.toFixed(3), 1, 1.4, BRY, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: g }))); }   // (adds: the far end was 6 m from cover)
  // the 1880s BRIDGE WORKS barrier on Bravo's arm where Alpha's bridge lands (its own group, on Bravo's side: key :b)
  RIVER.push(armBox(31.14, 39.23, -14.15, -14, 0, 1, rail({ tag: 'bridge-works', eras: '1', eraGroup: 'landing' })));
  // (fix round 2, review issue 1: the Tide Steps are gone — DESIGN.md §6.2 #4's first cut)
}

// ------------------------------------------------------------------------------------------------ Customs Lane and the base
const BASE = [
  // Customs Lane: the 1880s goods wagon on the GPO siding (era-1 cover) → a bike dock in its footprint
  B(-12.5, -9, 0, 2.8, -49.6, -46, { tag: 'goods-wagon', color: K.wagon, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'crossing' }),
  B(-11.8, -9.7, 0, 1, -48.4, -47.2, cover({ tag: 'bike-dock', color: '#4e5a5f', pattern: PATTERN.metal, eras: '23', eraGroup: 'crossing' })),
  B(-12, -9.6, 0, 1, -45.4, -44.6, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(-23.4, -21, 0, 1, -48.6, -47.6, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-4, -1.6, 0, 1, -45.4, -44.6, cover({ tag: 'bench', color: '#7d6c5a', notIn: 'tower' })),
  B(11, 13.4, 0, 1, -45.4, -44.4, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(5.6, 8, 0, 1, -48.6, -47.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(14.8, 17.2, 0, 1, -48.4, -47.6, cover({ tag: 'bollards', notIn: 'tower' })),
  // (fix round 1, review issue 5: Customs Lane's centre line was a 31 m bare strip between the alternating benches and
  //  planters; a bollard pair on it — in the tower's lane, so not in Tower Command)
  B(7.4, 8.6, 0, 1, -46.9, -46.1, cover({ tag: 'bollards', notIn: 'tower' })),
  // the forecourt steps (full width where Swimston arrives) and the spawn deck: the Engine House gallery
  R([0, 0, -50], [0, 1, -52.5], 10, stair({ tag: 'forecourt-steps', color: '#7c8088' })),
  ...tierBoxes([P.deck], 3.3, { tag: 'spawn-deck', color: K.spawn, pattern: PATTERN.spawn }),
  R([-8.5, 1, -58.5], [-8.5, 3.3, -64], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  R([8.5, 1, -58.5], [8.5, 3.3, -64], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  // (fix round 2, review issue 1: no side ramps — the yards beside the deck are gone; the deck's ways off are the two
  //  grand stairs and the front edge's 2.3 m drop)
  // the gallery's own cover (adds: the decks were the biggest bare floor; the pad keeps 6 m clear, the stair heads and
  // the drop over the turntable stay open): planters beside the stair heads, lamp plinths at the drop, benches at the back
  B(6.5, 7.7, 3.3, 4.3, -68.7, -66.3, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-7.7, -6.5, 3.3, 4.3, -68.7, -66.3, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(2.4, 3.6, 3.3, 4.3, -65.1, -64.5, cover({ tag: 'deck-plinth', color: '#8b8579' })),
  B(-3.6, -2.4, 3.3, 4.3, -65.1, -64.5, cover({ tag: 'deck-plinth', color: '#8b8579' })),
  B(4.8, 7.2, 3.3, 4.3, -73.6, -72.8, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(-7.2, -4.8, 3.3, 4.3, -73.6, -72.8, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(9.9, 11.1, 3.3, 4.3, -73.6, -72.4, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-11.1, -9.9, 3.3, 4.3, -73.6, -72.4, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  // the deck's front railing (gaps at the stair heads and over the turntable: a one-way 2.3 m drop)
  ...[[-12, -11], [-6, -4.5], [4.5, 6], [11, 12]].map(([x0, x1]) => B(x0, x1, 3.3, 4.3, -64.15, -64, rail({ tag: 'deck-rail' }))),
  // the Cable Tram Engine House (and its chimney), the boiler house and the tram shed: the back of the base (their faces
  // over the water are out of reach: not inkable, the paint budget, ENGINE rule 8)
  ...bld(P.engine[0], P.engine[1], P.engine[2], P.engine[3], 9, { tag: 'engine-house', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1]] }, BOT),
  B(-11, -9, 9, 24, -78, -76, { tag: 'chimney', color: '#6a5b50', pattern: PATTERN.brick, roof: true, paint: false }),
  // (fix round 2: the boiler house and the tram shed fill the old yards, to the deck's sides and the terrace's back edge;
  //  their faces over the water and the railyard are out of reach: not inkable)
  ...bld(P.boiler[0], P.boiler[1], P.boiler[2], P.boiler[3], 6, { tag: 'boiler-house', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1], [-1, 0, 0]] }, BOT),
  ...bld(P.shed[0], P.shed[1], P.shed[2], P.shed[3], 6, { tag: 'tram-shed', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1], [1, 0, 0]] }, BOT),
  // terrace cover (the grip car moved in off the chamfer; the stable is gone with the east yard; the turntable's benches
  // and banks stop 0.85 m short of the tower's lane on the terrace's north strip, z −55; the banks stand beside the
  // grand stairs' outer edges, no longer over their feet)
  B(-20.4, -17.8, 1, 4, -61.6, -56.2, { tag: 'grip-car', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),   // (fix round 3: in off the cut-back edge)
  B(-20, -18, 1, 2.4, -64, -62.4, cover({ tag: 'coal-bin', color: '#4a4744' })),
  B(-6.1, -4.9, 1, 2.25, -59.2, -57.2, cover({ tag: 'turntable-bench', color: '#7d6c5a' })), B(4.9, 6.1, 1, 2.25, -59.2, -57.2, cover({ tag: 'turntable-bench', color: '#7d6c5a' })),
  B(-4.6, -3.4, 1, 2.25, -62.6, -61.4, cover({ tag: 'buffer', color: '#5b5048' })), B(3.4, 4.6, 1, 2.25, -62.6, -61.4, cover({ tag: 'buffer', color: '#5b5048' })),
  B(-16, -6.5, 1, 2.4, -53, -51.6, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(6.5, 12.6, 1, 2.4, -52.2, -50.8, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(-12, -11.1, 1, 2.4, -62, -57.1, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(11.1, 12, 1, 2.4, -62, -57.1, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(-9.2, -6.8, 1, 2, -56, -55.2, cover({ tag: 'bench', color: '#7d6c5a' })),
  // (adds: the strip between the forecourt steps and the turntable was 6 m from cover; the east one stands in the
  //  tower's lane, so not in Tower Command)
  B(-3.8, -2.6, 1, 2.2, -55.2, -54, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  B(2.6, 3.8, 1, 2.2, -55.2, -54, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(6, 8.4, 1, 2, -54.8, -53.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(19, 20.4, 1, 3.2, -54.8, -53.4, { tag: 'kiosk', color: '#4d5f57', pattern: PATTERN.metal, roof: true, notIn: 'tower' }),
  B(-21.5, -19.9, 1, 3.2, -55.8, -54.2, { tag: 'ticket-booth', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  // (fix round 1, review issue 5: the terrace's north strip, z −57.5 … −55.5, ran 31 m bare; a horse trough on it, beside
  //  the tower's lane, so not in Tower Command)
  B(7.8, 10.2, 1, 2.0, -56.9, -56.1, cover({ tag: 'trough', color: '#6f726f', notIn: 'tower' })),
  B(23.0, 24.2, 1, 2, -58.6, -57.4, cover({ tag: 'bollards', notIn: 'tower' })),
  // (adds: three open corners of the terrace, each clear of the tower's lane by 1.6 m)
  B(-16.2, -13.8, 1, 1.9, -58.4, -57.6, cover({ tag: 'trough', color: '#6f726f' })),
  B(17.9, 19.1, 1, 2, -63.4, -62.2, cover({ tag: 'bollards' })),
  B(23.2, 24.4, 1, 2, -53.1, -51.9, cover({ tag: 'bollards', notIn: 'tower' })),
];

// ------------------------------------------------------------------------------------------------ the modes
// Zone Control: the centre is the octagon under the telephone (the concourse top), the side zone Centre Plaice
const ZONES = {
  center: [{ poly: [[2.49, 6.01], [6.01, 2.49], [6.01, -2.49], [2.49, -6.01], [-2.49, -6.01], [-6.01, -2.49], [-6.01, 2.49], [-2.49, 6.01]], y0: 1.0, y1: 1.8 }],
  side: { poly: [[10.5, -37.5], [18.0, -37.5], [18.0, -26.0], [10.5, -26.0]], y0: -0.2, y1: 0.4 },
};
// Tower Command, "the tower takes the City Loop" (drawn on Bravo's half: Alpha's goal): off the concourse's east face,
// down Degrayling Lane through Centre Plaice, Little Lane to the west tram track, down past the GPO steps, along Customs
// Lane to the quay, onto the terrace, round the east yard's trough and back across to the turntable (DESIGN.md §4.3)
const TOWER = {
  path: [[0, 1.3, 0], [-13.5, 0], [-13.5, 29], [2.25, 29], [2.25, 47], [-21.5, 47], [-21.5, 60], [-14, 60], [-14, 55], [0, 55], [0, 58.5]],
  checkpoints: [[2.25, 31], [-14, 47]],
  yaw: 0,
};
// Bazookarp (DATA ONLY: the mode's engine is not built yet; nothing reads `bazookarp` until it lands, and its kit pieces
// are added by variants.js only in mode 'bazookarp', so every current build is untouched). The format of
// tools/botlab/jobs/batch5/bazookarp/SPEC.md §4.1, drawn on Bravo's half (Alpha's attack), DESIGN.md §4.4.
const BAZOOKARP = {
  start: [0, 1.3, 0],                                    // the Pond: the concourse centre, under Tartar
  weirs: [{ at: [10.15, 1.2, 33.0] }],                   // Bravo's GPO terrace (yaw: the field's downhill, the default)
  gate: { at: [0, 57], yaw: 0 },                         // Bravo's turntable on the forecourt terrace (y 1.0; fix round 2: the base is 2 m shallower)
  freeZones: [{ poly: [[-12, 64], [12, 64], [12, 74], [-12, 74]], y0: 2.9, y1: 5.9,
    signs: [[-8.5, 64.3, 0], [8.5, 64.3, 0]],           // Bravo's spawn deck: the two stair heads (fix round 2: the side
    eras: null }],                                       //  ramps are gone; its front edge is a one-way drop)
  routes: {
    swimston: [[0, 12], [3, 26], [5.5, 34], [10.15, 33], [5.5, 36], [3, 47], [0, 52], [0, 57]],
    arch: [[8, 8], [16.25, 17], [16.25, 24], [12, 24.5], [10.15, 30], [10.15, 33]],
    east: [[10.15, 33], [5.5, 32], [-4, 33], [-4, 48], [-1, 53], [0, 57]],
  },
  noRetreat: [], carrierBlock: [], noRest: [], hopVeto: [],
  pondPlinth: null,                                      // (the Pond stands on the concourse itself, 1.3 m: start's y)
  shellHp: null,
};

// ------------------------------------------------------------------------------------------------ the eras (the engine's data)
// ENGINE.md §3.3 exactly; the era engine (src/game/eras.js) is not built yet: nothing reads `eras` until it lands.
const ERAS = {
  names: ['1880s', 'TODAY', '3000s'],
  at: [1 / 3, 2 / 3],
  warn: 10, prebell: 20, speed: 25, guard: 0.5,
  modes: { boss: { fixed: 2 }, practice: { cycle: 60 }, attract: { cycle: 40 } },
  tartar: { type: 'bluestone_tartar', pos: [0, 5.4, 0], rotY: 0 },
  clocks: [{ type: 'bluestone_clockhands', pos: [0, 5.95, -7.88], rotY: 180, faces: 5 }],
  phones: [[17.73, 1.2, -3.13], [-17.1, 1.2, -12.8], [-20.7, 2.1, -55.0]],
  pulses: [
    [[0, 9, 0], [0, 6.5, -20], [0, 6.5, -50], [0, 7, -62]],
    [[0, 9, 0], [-17, 6.5, -8], [-49, 6.5, -22.8]],
    [[0, 9, 0], [13.5, 6, -14], [13.5, 6, -45]],
    [[0, 9, 0], [21, 6, -8], [24, 6, -40], [26, 7, -56]],
    [[0, 9, 0], [-16, 7, -20], [-21.5, 6, -26], [-22, 6, -48]],
  ],
  tint: { 1: [1.05, 0.99, 0.90, 0.20], 2: [1, 1, 1, 0], 3: [0.97, 1.0, 1.03, 0.08] },
  remap: [
    { base: SURF.granite, eras: [SURF.granite, PATTERN.asphalt, PATTERN.pavers] },
    { base: PATTERN.planks, eras: [PATTERN.planks, PATTERN.planks, PATTERN.glasstile] },
  ],
  murals: { 4: '123', 5: '123', 6: '23', 7: '23', 8: '2', 9: '1', 10: '123', 11: '3' },
  colors: { appear: '#f4e9c8', vanish: '#a9a49a' },
  look: {
    1: { theme: { all: { haze: [1 / 900, 0.9, 200], fog: [30, 520], horizon: '#e9dcc4' }, dusk: { zenith: '#3f3766', horizon: '#a996c2', sun: '#ffe6c8' } }, lamps: '#ffe0b8' },
    2: { lamps: '#ffd9a8' },
    3: { theme: { all: { horizon: '#e6eef6', zenith: '#4a86d0' } }, lamps: '#eef4ff' },
  },
  timelapse: { sunSwing: 60, cloudRate: 20 },
};

// the railyard embankment's outline (Alpha's SW corner, out of play: props.js builds it as roof colliders at EMB):
// Prawn Alley's railyard wall (its outer face), the viaduct's outer face, the wall behind the terrace's chamfer, the
// boiler house's west face, the bounds, the river (fix round 2: the alley and the signal yard lie outside it, so it
// needs no channels)
const RY0 = AL(tW0, -3.1), RY1 = AL(tW1, -3.1);
export const RAILYARD = {
  top: EMB,
  poly: [RY0, RY1, [-26.64, -50.15], [-20.55, -64.35], [-20, -64.35], [-20, -85], [-63, -85], [-63, -46]],
  channels: [],
};

// ------------------------------------------------------------------------------------------------ the whole union, then this build's era
export const HALF_ALL = [...groundPieces, ...MID, ...haloPieces, ...SWIMSTON, ...WEST, ...VIADUCT, ...PRAWN_ALLEY, ...YARD_SLAB, ...SIGNAL_GARDEN, ...ARM, ...EAST, ...RIVER, ...BASE];
export const SINGLE_ALL = SINGLE;

const LAYOUT_BLUESTONE = {
  id: 'bluestone',
  bounds: { minX: -63, maxX: 63, minZ: -85, maxZ: 85 },
  spawnPads: [[0, 3.3, -70], [0, 3.3, 70]],
  spawnBarrier: 4.2,
  boss: { floorY: 0 },
  // (the stage's own world, art pass: backdrop, theme, river colours; for now no Inkopolis bay, no pier pilings)
  env: { backdrop: buildBackdrop, bay: false, edge: 'none', boats: false },
  single: eraFilter(SINGLE_ALL),
  half: eraFilter(HALF_ALL),
  zones: ZONES,
  tower: TOWER,
  bazookarp: BAZOOKARP,
  eras: ERAS,
  era: ERA,   // (the blockout: the era this build was filtered to, 0 = the union; era.js)
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = LAYOUT_BLUESTONE;
