// Bluestone Junction — stage layout (src/world/stages/bluestone/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, the era data (this file)
//   ground.js    the ground built from outline polygons (cores, kerb bars)      era.js      era tags + the blockout filter
//   props.js     prop pack + placements (the railyard embankment)                surfaces.js / murals.js / backdrop.js
//
// BLOCKOUT (2026-10-04): every floor, tier, stair, wall and piece of cover in DESIGN.md §2.6 at its real size, both
// halves, with the era engine's tags; plain surfaces, no art. The design: tools/botlab/jobs/batch5/stages/bluestone/
// DESIGN.md (the plan, the piece tables), ENGINE.md (the era data's format). Where this file departs from them it says
// so in a "(departs: …)" note.
//
// Bluestone Junction — Clockface Circus, where Swimston Street (the tram boulevard on the spawn axis) crosses Flathead
// Street (the old river road on the diagonal, bearing 65°) under the domed station and its clocks; the city around it
// jumps from the 1880s to today to the 3000s as Commander Tartar winds the clock. Alpha at −Z (the half list), Bravo is
// the 180° twin. +x is east; a kid facing +z has +x on its left.
//   • mid: the circus (a ring at 0 round the station's octagonal concourse, 1.3, under the dome on eight columns), the
//     clock rows over the Clock Steps; the Halo (a glass ring walkway at 5.4) in the 3000s
//   • centre lane: Swimston Street (14 m: trams, the superstop median, the GPO steps, verandas)
//   • right (−x): the balcony walk (the hotel gallery, 2.4), Hotel Lane → the hotel arch (from today also the Royal
//     Arcade), Hoki Lane under the railway viaduct → Prow Place → Alpha's arm of Flathead Street to the West Wharf
//   • left (+x): Little Lane, Degrayling Lane (its north end stacked with crates in the 1880s) and Centre Plaice (the
//     side zone), the Boathouse (deck 2.4), the quay; from today the riverside boardwalk and the Iron Bridge to Bravo's arm
//   • the 3000s add the Halo (via glass stairs out of the superstops and the light-pylon) and the Signal Garden (a park
//     on a deck over each team's railyard, three stairs up), and the Tide Steps on the river
//   • spawn: the Cable Tram Engine House's gallery (3.3) over the forecourt terrace (1.0) with the turntable
// Heights: 0 streets · 0.3 tram islands · 0.6 Degrayling pavements, the arcade, the West Wharf · 1.0 the forecourt
// terrace and yards · 1.2 the GPO terrace · 1.3 the concourse · 1.6 the loading platform · 2.4 the balcony and
// gallery, the Boathouse deck · 3.1–3.18 the Signal Garden · 3.3 the spawn decks · 5.4 the Halo.
import { PATTERN, B, R as R0, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { ERA, eraFilter } from './era.js';
import { BOT, TIER_Y, coverRects, bars, reflexPatches, junctionPatches, coreBoxes, tierBoxes, symOutline, rectPoly, oPoly } from './ground.js';

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
export const Q = {
  Q1: [-21.5, 5.42], Q2: AO(-62, 14), Q3: AO(-62, -14), Q4: [-24, -26.64], Q5: [-24, -33], Q6: [-27, -58], Q7: [-27, -68],
  Q8: [-16, -82], Q9: [16, -82], Q10: [27, -68], Q11: [27, -54], Q12: [21.5, -30], Q13: [21.5, -5.42],
};
const W1 = AO(-50, 14), W2 = AO(-50, -14), V50 = [-26.04, -50], U50 = [26.0833, -50];   // (split points: the wharf, the terrace)
const CHAIN = [Q.Q1, W1, Q.Q2, Q.Q3, W2, Q.Q4, Q.Q5, V50, Q.Q6, Q.Q7, Q.Q8, Q.Q9, Q.Q10, Q.Q11, U50, Q.Q12];
export const OUTLINE = symOutline(CHAIN);
// kerb bars on the diagonal edges the street meets (edge i of the chain; its mirror is i + 16): the arm's river edge
// (−0.26: the boardwalk at −0.08 and the Iron Bridge at −0.16 tuck under Bravo's twin of it), the arm's railyard edge,
// the viaduct, the quay
const KERB = { 0: -0.26, 4: -0.09, 6: -0.18, 14: -0.09 };
const kerbAt = (i) => KERB[i % 16];

// ------------------------------------------------------------------------------------------------ the tiers
// the forecourt terrace and the yards round the spawn deck (1.0; DESIGN.md §2.6: W / C / E / E2 and the yard floors, one
// outline) — the east edge follows the quay, the west edge the viaduct, the yards' back corners the chamfer Q7–Q8
export const TERRACE = [V50, Q.Q6, Q.Q7, [-22, -74.3636], [-22, -73], [-12, -73], [-12, -66], [12, -66], [12, -73], [22, -73], [22, -74.3636],
  Q.Q10, Q.Q11, U50, [5, -50], [5, -52.5], [-5, -52.5], [-5, -50]];
const TERRACE_KERB = { 0: 0.91, 2: 0.82, 10: 0.82, 12: 0.91 };
export const P = {
  deck: [-12, 12, -76, -66], pad: [0, 3.3, -72],
  gpo: [-13.5, -7, -40, -26], arcade: [-18.5, -14, -46, -18.5], degS: [10.5, 16.5, -44, -38], degN: [10.5, 16.5, -24, -14.5],
  boathouse: [16.5, 21.5, -24, -12], engine: [-12, 12, -82, -76], boiler: [-22, -12, -82, -73],
  carriage: [-4.5, 4.5, -50, -20],   // Swimston's carriageway (granite): one slab, its own colour
  wharf: [-62, -50, -14, 14],        // the West Wharf in the arm's frame (along a0…a1, off o0…o1)
};
// the square-built buildings on the street (the street is cut out under them; they stand on a base like the tiers)
const BLDS = [[7, 10.5, -27, -19], [7, 10.5, -44, -31], [16.5, 19.5, -44, -38], [-13.5, -7, -44, -40], [-14, -7, -22.5, -18.5], [-14, -13.5, -46, -26], [-19, -18.5, -46, -26]];
const TIERS = [TERRACE, ...BLDS.map((r) => rectPoly(...r)), rectPoly(...P.deck), rectPoly(...P.engine), rectPoly(...P.boiler), rectPoly(-P.boiler[1], -P.boiler[0], P.boiler[2], P.boiler[3]),
  rectPoly(...P.gpo), rectPoly(...P.arcade), rectPoly(...P.degS), rectPoly(...P.degN), rectPoly(...P.boathouse), armPoly(...P.wharf)];
const mirP = (p) => p.map(([x, z]) => [-x, -z]);

// ------------------------------------------------------------------------------------------------ the ground
// the street (0): cores over Alpha's window (z ≤ 0; the mirror lays Bravo's), never under the circus slab or the
// carriageway, kerb bars on the diagonals. Built at module load (a few tens of ms).
const GROUND = coverRects(OUTLINE, { x0: -63, x1: 63, z0: -85, z1: 0 }, {
  hard: [[-20, 20, -20, 20], P.carriage], soft: [...TIERS, ...TIERS.map(mirP)],
});
const TER = coverRects(TERRACE, { x0: -27.5, x1: 27.5, z0: -75, z1: -50 });
export const GROUND_MISS = [...GROUND.miss, ...TER.miss];
const groundPieces = [
  ...tierBoxes(GROUND.rects, 0, ground({ tag: 'street' })),
  ...bars(OUTLINE, { only: (i) => i < 16 && kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }),
  ...junctionPatches(OUTLINE, { barred: (i) => kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }).filter((d) => d.center[2] < 0),
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
  // the dome: the drum on the columns, a stepped dome, the lantern (colliders for the look; DESIGN.md: OCT R 8.8 / 6.5)
  ...OCT(0, 0, 8.8, 8, 10, { tag: 'drum', color: '#b8a888', pattern: PATTERN.render, roof: true, paint: false }),
  ...OCT(0, 0, 7.6, 10, 11.7, { tag: 'dome', color: K.dome, pattern: PATTERN.metal, roof: true, paint: false }),
  ...OCT(0, 0, 6.3, 11.7, 13.2, { tag: 'dome', color: K.dome, pattern: PATTERN.metal, roof: true, paint: false }),
  ...OCT(0, 0, 4.4, 13.2, 14.5, { tag: 'dome', color: K.dome, pattern: PATTERN.metal, roof: true, paint: false }),
  ...OCT(0, 0, 2.4, 14.5, 15.3, { tag: 'dome', color: K.dome, pattern: PATTERN.metal, roof: true, paint: false }),
  B(-1.5, 1.5, 15.3, 19, -1.5, 1.5, { tag: 'lantern', color: '#c9bb9a', pattern: PATTERN.render, roof: true, paint: false }),
];

const MID = [
  R([0, 0, -12], [0, 1.3, -8.78], 7, stair({ tag: 'clock-steps' })),
  R([-9.03, 0, -9.03], [-6.21, 1.2, -6.21], 5, stair({ tag: 'concourse-ramp' })),
  // the dome's columns at the octagon's corners (r 8.2): an inkable base 1.2–3.3 and a cast-iron shaft to the drum
  ...[112.5, 157.5, 202.5, 247.5].flatMap((b) => { const [x, z] = polar(8.2, b); return [
    O(x, z, 0.9, 0.9, 1.2, 3.3, b, { tag: 'column', color: '#a99d84', pattern: PATTERN.render }),
    O(x, z, 0.9, 0.9, 3.3, 8, b, { tag: 'column', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  ]; }),
  // the row of five clocks over the Clock Steps
  B(-3.1, 3.1, 4.3, 6, -7.85, -7.3, { tag: 'clock-beam', color: '#3f4a45', pattern: PATTERN.metal, roof: true, paint: false }),
  // concourse cover: the ticket barriers on the diagonals (r 5)
  OB(3.54, -3.54, 0.5, 3, 1.3, 2.4, 45, cover({ tag: 'barrier', color: '#6f6a60' })),
  OB(-3.54, -3.54, 0.5, 3, 1.3, 2.4, -45, cover({ tag: 'barrier', color: '#6f6a60' })),
  // ring cover: two carts, the bollards, the arm-mouth planter, the two telephone kiosks (Tartar's), the poster column
  OB(8.36, -9.96, 1.2, 2.2, 0, 1.2, 230, cover({ tag: 'cart', color: '#7a6a58' })),
  OB(5.99, -16.44, 1.2, 2.2, 0, 1.2, 250, cover({ tag: 'cart', color: '#7a6a58' })),
  B(9.8, 11, 0, 1.2, -6.6, -5.4, cover({ tag: 'bollards' })),
  B(-20.1, -18.9, 0, 1.2, -5.6, -3.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  B(17.13, 18.33, 0, 2.4, -3.73, -2.53, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  B(-14, -12.8, 0, 2.4, -11.07, -9.87, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  // the bill-poster column (1880s, today) → the inkable light-pylon onto the Halo (the 3000s): the same footprint (5.5:
  // 0.1 over the Halo's deck it meets, a climb within nav's 5.5 m)
  B(-15.94, -14.54, 0, 2.6, -7.01, -5.61, { tag: 'poster-column', color: '#6e5f4c', pattern: PATTERN.wood, roof: true, paint: false, eras: '12', eraGroup: 'pylon-w' }),
  B(-15.94, -14.54, 0, 5.5, -7.01, -5.61, { tag: 'light-pylon', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'pylon-w' }),
];

// ------------------------------------------------------------------------------------------------ the Halo (the 3000s)
// a glass ring walkway at 5.4 (inner apothem 11.6, outer 14.6), half-sides 4.8 long, corner squares 0.1 lower; glass
// balustrades (rail) both edges; gaps where the stair lands (180°, x ±1.5), at the light-pylon (247.5°), and 2 m drop
// gaps in the inner edge at the middles of the 135° and 225° sides (DESIGN.md §2.6)
const HALO_Y = 5.4, AP_IN = 11.6, AP_OUT = 14.6, AP_MID = 13.1, T22 = Math.tan(22.5 * DEG);
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
    haloPieces.push(O(cx, cz, 3, +HOUT.toFixed(4), top - 0.4, top, b + 90, halo({ eraGroup: g })));
    // balustrades: the inner edge to its corner, the outer edge to its corner (the two outer rails cross there)
    let inner = [0.02, HIN - 0.12], outer = [0.02, HOUT + 0.03];
    if (b === 135 || b === 225) inner = [1.0, HIN - 0.12];        // the 2 m drop gaps (1 m each side of the middle)
    if (b === 180) outer = [1.5, HOUT + 0.03];                      // the stair lands at x −1.5 … 1.5
    if ((b === 225 && k === 1) || (b === 270 && k === -1)) outer = [0.02, HOUT - 0.8];   // the light-pylon's corner (247.5°)
    for (const [ap, [s0, s1]] of [[AP_IN - 0.06, inner], [AP_OUT + 0.06, outer]]) {
      const [rx, rz] = at(ap, (s0 + s1) / 2);
      haloPieces.push(O(rx, rz, 0.12, +(s1 - s0).toFixed(4), top, top + 1, b + 90, hrail({ eraGroup: g })));
    }
  }
  // planters at the corners (1.0 above the deck), with the half-side group on the corner's clockwise side
  for (const [b, g] of [[112.5, 'halo-1'], [157.5, 'halo-3'], [202.5, 'halo-5'], [247.5, 'halo-7']]) {
    const [px, pz] = polar(13.4, b);
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
  B(4.5, 7, 3.2, 3.4, -44, -31, { tag: 'veranda', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  B(-7, -4.5, 3.2, 3.4, -44, -40, { tag: 'veranda', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  ...[-26.85, -23.2, -19.15, -43.85, -40.4, -37, -31.15].map((z) => B(4.6, 4.8, 0, 3.2, z - 0.1, z + 0.1, { tag: 'veranda-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  ...[-43.85, -40.15].map((z) => B(-4.8, -4.6, 0, 3.2, z - 0.1, z + 0.1, { tag: 'veranda-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  // footpath cover: the news kiosk, the coffee cart, kerb planters (1.5 m: BossNav sees them)
  B(5.1, 6.5, 0, 2.2, -37.6, -35.6, { tag: 'news-kiosk', color: '#4d5f57', pattern: PATTERN.metal, roof: true }),
  OB(5.8, -23, 1.2, 2.2, 0, 1.5, 0, cover({ tag: 'coffee-cart', color: '#7a6a58' })),
  ...[-25.5, -21, -34, -42.5].map((z) => B(4.6, 5.2, 0, 1.5, z - 1, z + 1, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter }))),
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
  B(-12.4, -11.4, 1.2, 3.2, -28.4, -27.4, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  B(-12.4, -11.4, 1.2, 3.2, -38.6, -37.6, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  R([-10, 1.2, -27.5], [-7, 2.4, -27.5], 3, stair({ tag: 'gpo-stair' })),
  ...bld(-13.5, -7, -44, -40, 9, { tag: 'corner-shop', color: K.gpo }, BOT),
  B(-13.5, -11, 9, 16, -42.5, -40, { tag: 'gpo-clocktower', color: K.gpo, pattern: PATTERN.render, roof: true, paint: false }),
  // the arcade: its two walls, its 0.6 mosaic floor (on across Hotel Lane and under the hotel arch), its glass vault
  ...bld(-14, -13.5, -46, -26, 7, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...bld(-19, -18.5, -46, -26, 7, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...tierBoxes([P.arcade], 0.6, ground({ tag: 'arcade-floor', color: '#8d8679', pattern: PATTERN.tiles })),
  B(-18.5, -14, 6, 6.3, -46, -26, { tag: 'arcade-roof', color: '#9fb1b5', pattern: PATTERN.glasstile, roof: true, paint: false }),
  // 1880s: the arcade under construction, hoarded and full of scaffold (gates: 2.8 m, roof, not inkable) → today: a kiosk,
  // a flower stall and a bench island inside the old hoardings' footprints, in the same groups
  B(-18.5, -14, 0.6, 3.4, -46, -39.33, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-1' }),
  B(-18.5, -14, 0.6, 3.4, -39.33, -32.67, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-2' }),
  B(-18.5, -14, 0.6, 3.4, -32.67, -26, { tag: 'hoarding', color: K.hoard, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'arcade-3' }),
  OB(-16.25, -43, 1.2, 1.6, 0.6, 1.8, 0, cover({ tag: 'arcade-kiosk', color: '#5c6b62', eras: '23', eraGroup: 'arcade-1' })),
  OB(-16.25, -36, 1.2, 2, 0.6, 1.8, 0, cover({ tag: 'flower-stall', color: '#6f7a5a', eras: '23', eraGroup: 'arcade-2' })),
  OB(-16.25, -29.5, 1.2, 2.4, 0.6, 1.6, 0, cover({ tag: 'arcade-bench', color: '#7a6a58', eras: '23', eraGroup: 'arcade-3' })),
  // the hotel: H1 (to 9 m) and the prow's corner turret (to 13 m); the west wing on an arch over the arcade (soffit 3.8)
  ...bld(-14, -7, -22.5, -18.5, 9, { tag: 'hotel', color: K.hotel }, BOT),
  B(-14, -11.5, 9, 13, -21, -18.5, { tag: 'hotel-turret', color: K.hotel, pattern: PATTERN.render, roof: true, paint: false }),
  B(-19, -14, 3.8, 9, -22.5, -18.5, { tag: 'hotel-arch', color: K.hotel, pattern: PATTERN.render, roof: true, paint: false }),
  B(-19, -18.5, 0, 3.8, -22.5, -18.5, { tag: 'arch-pier', color: K.hotel, pattern: PATTERN.render, roof: true }),
  // the balcony (Alpha's raised corner over mid) and the gallery over Swimston's west footpath, the landing, the stair
  B(-14, -5, 2.1, 2.4, -18.5, -15.5, { tag: 'balcony', color: K.planks, pattern: PATTERN.planks }),
  B(-7, -5, 2.1, 2.4, -29, -18.5, { tag: 'gallery', color: K.planks, pattern: PATTERN.planks }),
  B(-14, -11, 2.1, 2.4, -15.5, -12.5, { tag: 'balcony-landing', color: K.planks, pattern: PATTERN.planks }),
  R([-5, 0, -14], [-11, 2.4, -14], 3, stair({ tag: 'balcony-stair', color: K.iron, pattern: PATTERN.treads })),
  ...[[-13.85, -12.65], [-13.85, -15.4], [-5.1, -28.85], [-5.1, -25.25], [-5.1, -21], [-5.1, -16]].map(([x, z]) => B(x - 0.125, x + 0.125, 0, 2.1, z - 0.125, z + 0.125, { tag: 'balcony-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  B(-14, -13.2, 2.4, 3.4, -13.3, -12.5, cover({ tag: 'balcony-planter', color: K.planter, pattern: PATTERN.planter })),   // (adds: cover on the landing)
  B(-13.4, -11.4, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-9, -7, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
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
// (Q4–Q5–Q6) over Hoki Lane, the railyard wall over the arm's south walk (off −14.6 … −14) and along the West Wharf, the
// wall behind the west yard. 4.1 m (not inkable, roof); 3.1 m where the Signal Garden's drop gaps are; arches (1880s and
// today) where the garden's stairs break through in the 3000s.
// the garden's heights: the walk, the lawn, the embankment's roof (props.js), the drop gaps' wall tops
const GW0 = -14.6, GW1 = -20.6, GTOP = 3.18, LTOP = 3.08, EMB = 3.0, DROP = 2.98;
const VN = [-0.9929, 0.1191];   // the viaduct diagonal's outward (railyard-side) normal
const vband = (z0, z1, top, o = {}) => lineBand(Q.Q5, Q.Q6, z0, z1, VN, 0, 0.6, BOT, top, wall({ tag: 'viaduct', ...o }));
const awall = (a0, a1, top, o = {}) => armBox(a0, a1, -14.6, -14, BOT, top, wall({ tag: 'railyard-wall', ...o }));
const pier = (x, z, deg = 0) => O(x, z, 0.8, 0.8, BOT, 4.4, deg, wall({ tag: 'viaduct-pier' }));
const VIADUCT = [
  pier(-24.3, -27.3), pier(-24.3, -33), pier(-25.44, -42.5, -6.8), pier(-25.92, -46.5, -6.8), pier(-27.3, -58.3),
  B(-24.6, -24, BOT, 4.1, -29.5, -27.7, wall({ tag: 'viaduct' })),
  B(-24.6, -24, BOT, DROP, -32.6, -29.5, wall({ tag: 'viaduct', drop: true })),
  vband(-33.4, -36, 4.1), vband(-36, -39, DROP, { drop: true }), vband(-39, -42.1, 4.1),
  vband(-42.9, -46.1, 4.1, { eras: '12', eraGroup: 'garden-t3', arch: true }),
  vband(-46.9, -57.9, 4.1),
  B(-27.6, -27, BOT, 4.1, -68, -58.7, wall({ tag: 'yard-wall' })),
  // the railyard wall over the arm's south walk and along the West Wharf (along −62 … −34)
  awall(-62, -58.6, 4.1), awall(-58.6, -55.4, 4.1, { eras: '12', eraGroup: 'garden-sc', arch: true }), awall(-55.4, -48, 4.1),
  awall(-48, -45, DROP, { drop: true }), awall(-45, -44.5, 4.1), awall(-44.5, -41.5, 4.1, { eras: '12', eraGroup: 'garden-sa', arch: true }),
  awall(-41.5, -38.5, 4.1), awall(-38.5, -35.5, DROP, { drop: true }), awall(-35.5, -33.9, 4.1),
];

// ------------------------------------------------------------------------------------------------ the Signal Garden (the 3000s)
// A park on a deck over the railyard (on the embankment's roof at 3.0: ENGINE rule 19b, it buries it by ≥ 0.08):
//   • the garden walk along the railyard wall (the arm's frame, off −14.6 … −20.6, along −60 … −37.2) at 3.18,
//   • the lower lawn south of it (world grid, x −45 … −24.4, to z −50) at 3.10 — the walk's edge stands 8 cm over it,
//   • three stairs up (23.8–24°), each in a trench through the deck: from Hoki Lane through the viaduct (an arch in the
//     1880s and today), from the arm's south walk and from the West Wharf through the railyard wall,
//   • the signal pavilion (the landmark), five planters, a lawn mound; parapets on the open edges.
// (departs from DESIGN.md's outline G1 … G10: rebuilt on the arm's frame and the world grid so every edge is straight
// and every era group stays within 8 m and 12 blocks; the arm stair starts 1 m inside the arm's walk (off −13) so it
// lands inside a 6 m walk; the wharf stair sits at along −57; about 320 m² of floor per half, as planned)
const gWalk = (a0, a1, g, o0 = GW1) => armBox(a0, a1, o0, GW0, EMB, GTOP, { tag: 'garden-walk', color: K.garden, pattern: PATTERN.pavers, eras: '3', eraGroup: g });
const gLawn = (x0, x1, z0, z1, g) => B(x0, x1, EMB, LTOP, z0, z1, { tag: 'garden-lawn', color: K.lawn, pattern: PATTERN.planter, eras: '3', eraGroup: g });
const gCover = (x, z, y0, deg, g, o = {}) => OB(x, z, 1.2, 2.4, y0, y0 + 1.2, deg, cover({ tag: 'garden-planter', color: K.planter, pattern: PATTERN.planter, eras: '3', eraGroup: g, ...o }));
const gPar = (o) => wall({ tag: 'garden-parapet', ...o });
const gStair = (o) => ({ tag: 'garden-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', thin: true, thickness: 1.0, ...o });
export const GARDEN = {
  hoki: { low: [-25.38, 0, -44.5], high: [-32.38, LTOP, -44.5], w: 3 },          // world grid (z −46 … −43), 23.7°
  arm: { a: -43, o0: -13, oMid: -16.6, o1: -20.15, y1: GTOP, w: 3 },              // the arm's frame (along −44.5 … −41.5), 24.0°
  wharf: { a: -57, o0: -14, o1: -19.8, y0: 0.6, y1: GTOP, w: 3 },                 // the arm's frame (along −58.5 … −55.5), 24.0°
};
const armRamp = (a, o0, y0, o1, y1, w, o) => { const [lx, lz] = AO(a, o0), [hx, hz] = AO(a, o1); return R([lx, y0, lz], [hx, y1, hz], w, o); };
const GA = GARDEN.arm, GH = GARDEN.hoki, GC = GARDEN.wharf, armMidY = +(GA.y1 * (GA.o0 - GA.oMid) / (GA.o0 - GA.o1)).toFixed(3);
// Twelve groups per half (ENGINE rules 3–6: each ≤ 8 m and ≤ 12 blocks; with the Halo's eight, the pylon, the two glass
// stairs and the Tide Steps, jump 2 changes 24 groups per half):
//   garden-sc  the wharf stair (the garden's west end), its landing and the wall arch (1880s, today) it breaks through
//   garden-t6 / -t4 / -t2   the walk's next three pieces (t2 also the lawn's north-east corner by the viaduct)
//   garden-sa / -sa2        the arm stair's lower flight and wall arch / its upper flight and landing
//   garden-t3  the Hoki stair, the viaduct arch, the lawn beside its foot      garden-t5 / -t8 / -t9 / -t10 / -t11 the lawn
// (departs from DESIGN.md's outline G1 … G10 and cells t1 … t7: rebuilt on the arm's frame (the walk) and the world grid
// (the lawn) so every edge is straight and every group stays within the engine's limits; each stair runs in a trench in
// the deck, with glass side rails; about 300 m² of floor per half)
const SIGNAL_GARDEN = [
  // the walk (the arm's frame, 3.18), split at the stairs' trenches; the stairs' top landings
  armBox(-58.5, -55.5, GW1, GC.o1, EMB, GTOP, { tag: 'garden-walk', color: K.garden, pattern: PATTERN.pavers, eras: '3', eraGroup: 'garden-sc' }),
  gWalk(-55.5, -50, 'garden-t6'), gWalk(-50, -44.5, 'garden-t4'),
  armBox(-44.5, -41.5, GW1, GA.o1, EMB, GTOP, { tag: 'garden-walk', color: K.garden, pattern: PATTERN.pavers, eras: '3', eraGroup: 'garden-sa2' }),
  gWalk(-41.5, -37.2, 'garden-t2'),
  // the lower lawn (world grid, 3.08): its north edges tuck under the walk, its east edges into the viaduct wall
  gLawn(-30, -26.1, -50, -46, 'garden-t3'),
  gLawn(-36, -30, -50, -46, 'garden-t5'), gLawn(-36, -32.38, -46, -43, 'garden-t5'),
  gLawn(-43, -36, -50, -44.5, 'garden-t8'), gLawn(-43, -36, -44.5, -39, 'garden-t9'),
  gLawn(-36, -30, -43, -36.5, 'garden-t10'),
  gLawn(-30, -25.25, -43, -39, 'garden-t11'), gLawn(-30, -24.78, -39, -35, 'garden-t11'),
  gLawn(-27, -24.4, -35, -29.5, 'garden-t2'),
  // the stairs (glass treads in a trench) — each with the 1880s / today wall arch it replaces
  R(GH.low, GH.high, GH.w, gStair({ eraGroup: 'garden-t3' })),
  armRamp(GA.a, GA.o0, 0, GA.oMid, armMidY, GA.w, gStair({ eraGroup: 'garden-sa', thin: false })),
  armRamp(GA.a, GA.oMid, armMidY, GA.o1, GA.y1, GA.w, gStair({ eraGroup: 'garden-sa2', thin: false })),
  armRamp(GC.a, GC.o0, GC.y0, GC.o1, GC.y1, GC.w, gStair({ eraGroup: 'garden-sc' })),
  // the signal pavilion round the old signal box (the garden's landmark), planters, the lawn mound
  B(-40, -36.2, LTOP, 8.38, -41.8, -37.3, { tag: 'signal-pavilion', color: '#e6ece9', pattern: PATTERN.glasstile, roof: true, paint: false, eras: '3', eraGroup: 'garden-t9' }),   // (glass: not inkable)
  gCover(-27.5, -32.3, GTOP, 65, 'garden-t2'), gCover(-28, -48.8, LTOP, 0, 'garden-t3'), gCover(-42.5, -37.5, GTOP, 65, 'garden-t6'),
  gCover(-33.6, -35.8, GTOP, 65, 'garden-t4'), gCover(-40, -47.5, LTOP, 90, 'garden-t8'),
  B(-35.5, -32.6, LTOP, 3.68, -49.6, -46.6, { tag: 'lawn-mound', color: K.lawn, pattern: PATTERN.planter, eras: '3', eraGroup: 'garden-t5' }),
  // parapets on the garden's open edges (every era: in the 1880s and today they edge the railyard)
  armBox(-58.9, -58.5, -21.0, GW0, EMB, 4.0, gPar()), armBox(-58.5, -57.2, -21.0, GW1, EMB, 3.92, gPar()),
  B(-43.4, -43, EMB, 4.0, -50, -42.8, gPar()), B(-43.4, -26.3, EMB, 3.92, -50.4, -50, gPar()),
];

// ------------------------------------------------------------------------------------------------ Alpha's arm: Flathead Street WSW, the West Wharf
// cross-section: carriageway |off| ≤ 6 (the tram track on its axis), frontages ±6 … ±10, the riverside promenade
// (off 10 … 14) and the south walk under the railyard wall (−14 … −10)
const armCover = (a, o, w, d, y0, y1, opts) => { const [x, z] = AO(a, o); return OB(x, z, w, d, y0, y1, 65, opts); };
const ARM = [
  ...(() => { const [x, z] = AO(-39, -8); return obld(x, z, 4, 14, 65, 8, { tag: 'customs-house', color: K.customs }); })(),
  ...(() => { const [x, z] = AO(-39, 8); return obld(x, z, 4, 14, 65, 7, { tag: 'warehouse', color: K.ware, pattern: PATTERN.brick }); })(),
  ...(() => { const [x, z] = AO(-24.5, 8); return obld(x, z, 4, 7, 65, 7, { tag: 'warehouse', color: K.ware, pattern: PATTERN.brick }); })(),
  armCover(-31, 0, 2.4, 6, 0, 0.3, { tag: 'tram-island', color: K.stone, pattern: SURF.bluestone }),
  armCover(-31, 0, 1, 4, 0.3, 2.6, { tag: 'tram-shelter', color: K.iron, pattern: PATTERN.metal, roof: true }),
  armCover(-43.5, 0, 2.4, 5, 0, 0.3, { tag: 'tram-island', color: K.stone, pattern: SURF.bluestone }),
  armCover(-43.5, 0, 1.2, 3, 0.3, 1.5, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  armCover(-37.4, 3.6, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })), armCover(-26, 3.6, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })),
  armCover(-23.5, -4, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })), armCover(-37, -4, 1.2, 2.2, 0, 1.2, cover({ tag: 'cart' })),
  armCover(-44, 12, 0.8, 2, 0, 1, cover({ tag: 'bench', color: '#7d6c5a' })), armCover(-36, 12, 0.8, 2, 0, 1, cover({ tag: 'bench', color: '#7d6c5a' })),
  armCover(-25, 12, 1.2, 2, 0, 1, cover({ tag: 'bollards' })),
  armCover(-44.5, -12, 1.2, 2, 0, 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  armCover(-37.4, -12, 1.2, 1.2, 0, 1.2, cover({ tag: 'bins', color: '#56605a' })),
  armCover(-48, 4, 1.2, 2.4, 0, 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  armCover(-48, -8, 1.2, 2.4, 0, 1.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  // the West Wharf (timber, 0.6) with its loading platform (1.6), goods shed, crane base and cargo
  // (its three sides over the water are out of reach: not inkable; its inner step onto the arm is)
  armBox(P.wharf[0], P.wharf[1], P.wharf[2], P.wharf[3], BOT, 0.6, { tag: 'west-wharf', color: K.planks, pattern: PATTERN.planks, noPaint: [[-C65, 0, S65], [C65, 0, -S65], [-S65, 0, -C65]] }),
  armBox(-62, -57, -8, 6, 0.6, 1.6, { tag: 'loading-platform', color: K.planks, pattern: PATTERN.planks }),
  ...(() => { const [x, z] = AO(-53.75, -11.25); return [O(x, z, 4.5, 4.5, 0.6, 4, 65, { tag: 'goods-shed', color: '#7e6a55', pattern: PATTERN.weatherboard, roof: true })]; })(),
  armCover(-54, 6, 2.5, 2.5, 0.6, 2.6, cover({ tag: 'crane-base', color: '#59626a', pattern: PATTERN.metal, roof: true })),
  armCover(-53.75, 11, 2, 2.5, 0.6, 2.0, cover({ tag: 'cargo', color: K.crate, pattern: PATTERN.wood })),
  armCover(-54, -2.5, 1.6, 1.6, 0.6, 1.8, cover({ tag: 'barrels', color: '#6e5a45' })),
  armCover(-58.5, 9.5, 1.4, 2.4, 0.6, 1.8, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  armCover(-59.5, -1, 1.4, 1.4, 1.6, 2.6, cover({ tag: 'winch', color: '#59626a', pattern: PATTERN.metal })),
  armCover(-60.5, -6.3, 1.2, 1.2, 1.6, 2.6, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),   // (adds: platform cover)
  armCover(-58.6, 4.6, 1.2, 1.2, 1.6, 2.6, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  // the river railings (every rail's ends on the outline or on another rail)
  armBox(-62.15, -62, -14, 14, 0.6, 1.6, rail({ tag: 'wharf-rail' })),
  armBox(-62, -50, 14, 14.15, 0.6, 1.6, rail({ tag: 'river-rail' })),
  armBox(-50, -39.23, 14, 14.15, 0, 1, rail({ tag: 'river-rail' })),
  armBox(-31.14, -21.22, 14, 14.15, 0, 1, rail({ tag: 'river-rail' })),
  armBox(-21.22, -17.39, 14, 14.15, 0, 1, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-4' })),   // (where Bravo's boardwalk lands from today)
];

// ------------------------------------------------------------------------------------------------ the east side
// Swimston's east shops and Little Lane, Degrayling Lane (0.6 pavements; its north end stacked with crates in the
// 1880s), the bond store, Centre Plaice (the side zone), the Boathouse (deck 2.4, two stairs), the Yabby quay
const EAST = [
  ...bld(7, 10.5, -27, -19, 7, { tag: 'shops', color: K.shop, pattern: PATTERN.brick }, BOT),
  ...bld(7, 10.5, -44, -31, 7, { tag: 'shops', color: K.shop, pattern: PATTERN.brick }, BOT),
  ...tierBoxes([P.degS, P.degN], 0.6, ground({ tag: 'degrayling', color: '#626a73' })),
  B(10.5, 16.5, 0.6, 3.4, -24, -19.25, { tag: 'crates-stack', color: K.crate, pattern: PATTERN.wood, roof: true, paint: false, notIn: 'tower', eras: '1', eraGroup: 'crates-1' }),
  B(10.5, 16.5, 0.6, 3.4, -19.25, -14.5, { tag: 'crates-stack', color: K.crate, pattern: PATTERN.wood, roof: true, paint: false, notIn: 'tower', eras: '1', eraGroup: 'crates-2' }),
  OB(13.5, -21.4, 1.2, 1.2, 0.6, 1.6, 0, cover({ tag: 'cafe', color: '#7b6f60', notIn: 'tower', eras: '23', eraGroup: 'crates-1' })),
  OB(13.5, -16.9, 1.2, 1.2, 0.6, 1.6, 0, cover({ tag: 'cafe', color: '#7b6f60', notIn: 'tower', eras: '23', eraGroup: 'crates-2' })),
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
  B(27, 27.15, 1, 2, -66, -54, rail({ tag: 'river-rail' })),
  lineBand(Q.Q11, Q.Q12, -54, -50, [0.9747, 0.2233], 0, 0.15, 1, 2, rail({ tag: 'river-rail' })),
  lineBand(Q.Q11, Q.Q12, -50, -30.05, [0.9747, 0.2233], 0, 0.15, 0, 1, rail({ tag: 'river-rail' })),
  B(21.5, 21.65, 0, 1, -30, -24, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-1' })),
  B(21.5, 21.65, 0, 1, -12, -10.2, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-3' })),
  B(21.5, 21.65, 0, 1, -10.2, -5.62, rail({ tag: 'river-rail', eras: '1', eraGroup: 'bw-4' })),
];

// ------------------------------------------------------------------------------------------------ the river works (today, the 3000s)
// the riverside boardwalk (over the water: ENGINE rule 20; bottom −0.6, not a waterline slab), the Iron Bridge from it to
// Bravo's arm (16 cm under the arm walk), the Tide Steps (the 3000s), and the 1880s barrier where Alpha's bridge lands
const BA = [25, -20], BD = [Math.sin(30 * DEG), Math.cos(30 * DEG)], BR = [Math.cos(30 * DEG), -Math.sin(30 * DEG)];   // the bridge's centreline, right
const SPANS = [-4, 1.96, 7.92, 13.88, 19.84, 23.09, 26.35, 29.0];
const RIGHT = [-4.02, 28.93], LEFT = [4.02, 22.30];   // where each side line leaves the boardwalk and reaches Bravo's arm
const bp = (m, s) => [BA[0] + BD[0] * m + BR[0] * s, BA[1] + BD[1] * m + BR[1] * s];
const RIVER = [];
{
  const bw = (o) => ({ tag: 'boardwalk', color: K.planks, pattern: PATTERN.planks, eras: '23', ...o });
  [[-30, -23.4], [-23.4, -16.8], [-16.8, -10.2], [-10.2, -3.49]].forEach(([z0, z1], i) => RIVER.push(B(21.5, 25, -0.6, -0.08, z0, z1, bw({ eraGroup: `bw-${i + 1}` }))));
  RIVER.push(B(25, 25.15, -0.08, 0.9, -30, -24.6, rail({ tag: 'boardwalk-rail', eras: '2', eraGroup: 'tide' })));
  RIVER.push(B(25, 25.15, -0.08, 0.9, -15.4, -10.2, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-3' })));
  RIVER.push(B(25, 25.15, -0.08, 0.9, -10.2, -3.72, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-4' })));
  // (adds: the boardwalk's south end over the water needs its rail too)
  RIVER.push(B(21.65, 25.15, -0.08, 0.9, -30.15, -30, rail({ tag: 'boardwalk-rail', eras: '23', eraGroup: 'bw-1' })));
  RIVER.push(OB(24.2, -28, 1.2, 1.6, -0.08, 1, 0, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, eras: '23', eraGroup: 'bw-1' })));
  RIVER.push(OB(24.2, -13.6, 1.2, 1.6, -0.08, 1, 0, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, eras: '23', eraGroup: 'bw-3' })));
  for (let k = 0; k < SPANS.length - 1; k++) {
    const m0 = SPANS[k], m1 = SPANS[k + 1], g = `bridge-${k + 1}`, [cx, cz] = bp((m0 + m1) / 2, 0);
    RIVER.push(O(+cx.toFixed(4), +cz.toFixed(4), 4.5, +(m1 - m0).toFixed(4), -0.6, -0.16, 30, { tag: 'iron-bridge', color: K.bridge, pattern: PATTERN.planks, eras: '23', eraGroup: g }));
    for (const [s, [r0, r1]] of [[2.32, RIGHT], [-2.32, LEFT]]) {
      const a = Math.max(m0, r0) + 0.01, b = Math.min(m1, r1) - 0.01;
      if (b - a < 0.05) continue;
      const [rx, rz] = bp((a + b) / 2, s);
      RIVER.push(O(+rx.toFixed(4), +rz.toFixed(4), 0.15, +(b - a).toFixed(4), -0.16, 0.74, 30, rail({ tag: 'bridge-rail', eras: '23', eraGroup: g })));
    }
  }
  RIVER.push(OB(27.59, -18.31, 1, 1.4, -0.16, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-2' })));
  RIVER.push(OB(31.13, -6.59, 1, 1.4, -0.16, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-4' })));
  { const [lx, lz] = bp(24.6, -1.4); RIVER.push(OB(+lx.toFixed(3), +lz.toFixed(3), 1, 1.4, -0.16, 1.2, 30, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, eras: '23', eraGroup: 'bridge-6' }))); }   // (adds: the far end was 6 m from cover)
  // the 1880s BRIDGE WORKS barrier on Bravo's arm where Alpha's bridge lands (its own group, on Bravo's side: key :b)
  RIVER.push(armBox(31.14, 39.23, -14.15, -14, 0, 1, rail({ tag: 'bridge-works', eras: '1', eraGroup: 'landing' })));
  // the Tide Steps (the 3000s): a river terrace beside the boardwalk, its rails and the FLOOD LEVEL 3026 obelisk
  const tide = (o) => ({ eras: '3', eraGroup: 'tide', ...o });
  RIVER.push(B(25, 28, -0.6, -0.08, -30, -24.6, tide({ tag: 'tide-steps', color: '#c9ccc8', pattern: PATTERN.pavers })));
  RIVER.push(B(25.15, 28.15, -0.08, 0.9, -30.15, -30, rail(tide({ tag: 'tide-rail' }))));
  RIVER.push(B(28, 28.15, -0.08, 0.9, -30, -24.6, rail(tide({ tag: 'tide-rail' }))));
  RIVER.push(B(25.15, 28.15, -0.08, 0.9, -24.6, -24.45, rail(tide({ tag: 'tide-rail' }))));
  RIVER.push(B(26.2, 27.4, -0.08, 2.4, -28.4, -27.2, tide({ tag: 'tide-obelisk', color: '#e3e6e4', pattern: PATTERN.render, roof: true })));
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
  // the forecourt steps (full width where Swimston arrives) and the spawn deck: the Engine House gallery
  R([0, 0, -50], [0, 1, -52.5], 10, stair({ tag: 'forecourt-steps', color: '#7c8088' })),
  ...tierBoxes([P.deck], 3.3, { tag: 'spawn-deck', color: K.spawn, pattern: PATTERN.spawn }),
  R([-8.5, 1, -60.5], [-8.5, 3.3, -66], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  R([8.5, 1, -60.5], [8.5, 3.3, -66], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  R([-18, 1, -71], [-12, 3.3, -71], 4, stair({ tag: 'side-ramp', color: '#a59b88', pattern: PATTERN.rampboard })),
  R([18, 1, -71], [12, 3.3, -71], 4, stair({ tag: 'side-ramp', color: '#a59b88', pattern: PATTERN.rampboard })),
  // the gallery's own cover (adds: the decks were the biggest bare floor; the pad keeps 6 m clear, the stair heads and
  // the drop over the turntable stay open): planters beside the stair heads, lamp plinths at the drop, benches at the back
  B(6.5, 7.7, 3.3, 4.3, -70.7, -68.3, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-7.7, -6.5, 3.3, 4.3, -70.7, -68.3, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(2.4, 3.6, 3.3, 4.3, -67.1, -66.5, cover({ tag: 'deck-plinth', color: '#8b8579' })),
  B(-3.6, -2.4, 3.3, 4.3, -67.1, -66.5, cover({ tag: 'deck-plinth', color: '#8b8579' })),
  B(4.8, 7.2, 3.3, 4.3, -75.6, -74.8, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(-7.2, -4.8, 3.3, 4.3, -75.6, -74.8, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(9.9, 11.1, 3.3, 4.3, -75.6, -74.4, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-11.1, -9.9, 3.3, 4.3, -75.6, -74.4, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
  // the deck's front railing (gaps at the stair heads and over the turntable: a one-way 2.3 m drop)
  ...[[-12, -11], [-6, -4.5], [4.5, 6], [11, 12]].map(([x0, x1]) => B(x0, x1, 3.3, 4.3, -66.15, -66, rail({ tag: 'deck-rail' }))),
  // the Cable Tram Engine House (and its chimney), the boiler house and the tram shed: the back of the base
  ...bld(P.engine[0], P.engine[1], P.engine[2], P.engine[3], 9, { tag: 'engine-house', color: K.engine, pattern: SURF.bluestone }, BOT),
  B(-11, -9, 9, 24, -80, -78, { tag: 'chimney', color: '#6a5b50', pattern: PATTERN.brick, roof: true, paint: false }),
  ...bld(P.boiler[0], P.boiler[1], P.boiler[2], P.boiler[3], 6, { tag: 'boiler-house', color: K.engine, pattern: SURF.bluestone }, BOT),
  ...bld(-P.boiler[1], -P.boiler[0], P.boiler[2], P.boiler[3], 6, { tag: 'tram-shed', color: K.engine, pattern: SURF.bluestone }, BOT),
  // yard and terrace cover
  B(-25, -22.4, 1, 4, -65, -57, { tag: 'grip-car', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  B(24, 27, 1, 5, -67.5, -62, { tag: 'stable', color: '#7e6a55', pattern: PATTERN.weatherboard, roof: true }),
  B(-20, -18, 1, 2.4, -66, -64.4, cover({ tag: 'coal-bin', color: '#4a4744' })),
  B(-6.1, -4.9, 1, 2.25, -60, -58, cover({ tag: 'turntable-bench', color: '#7d6c5a' })), B(4.9, 6.1, 1, 2.25, -60, -58, cover({ tag: 'turntable-bench', color: '#7d6c5a' })),
  B(-4.6, -3.4, 1, 2.25, -64.6, -63.4, cover({ tag: 'buffer', color: '#5b5048' })), B(3.4, 4.6, 1, 2.25, -64.6, -63.4, cover({ tag: 'buffer', color: '#5b5048' })),
  B(-16, -6.5, 1, 2.4, -53, -51.6, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(6.5, 12.6, 1, 2.4, -52.2, -50.8, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(-10.8, -9.4, 1, 2.4, -63, -57, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(9.4, 10.8, 1, 2.4, -63, -57, { tag: 'apron-bank', color: '#6e7a62', pattern: PATTERN.planter, roof: true }),
  B(-9.2, -6.8, 1, 2, -56, -55.2, cover({ tag: 'bench', color: '#7d6c5a' })),
  // (adds: the strip between the forecourt steps and the turntable was 6 m from cover; the east one stands in the
  //  tower's lane, so not in Tower Command)
  B(-3.8, -2.6, 1, 2.2, -55.2, -54, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter })),
  B(2.6, 3.8, 1, 2.2, -55.2, -54, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(6, 8.4, 1, 2, -54.8, -53.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, notIn: 'tower' })),
  B(19, 20.4, 1, 3.2, -54.8, -53.4, { tag: 'kiosk', color: '#4d5f57', pattern: PATTERN.metal, roof: true, notIn: 'tower' }),
  B(-21.5, -19.9, 1, 3.2, -55.8, -54.2, { tag: 'ticket-booth', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  B(16.4, 18.8, 1, 1.9, -58.4, -57.6, cover({ tag: 'trough', color: '#6f726f' })),
  B(24.4, 25.6, 1, 2, -58.6, -57.4, cover({ tag: 'bollards' })),
  // (adds: three open corners of the terrace, each clear of the tower's lane by 1.6 m)
  B(-17.7, -15.3, 1, 1.9, -60.4, -59.6, cover({ tag: 'trough', color: '#6f726f' })),
  B(17.9, 19.1, 1, 2, -66.1, -64.9, cover({ tag: 'bollards' })),
  B(24.4, 25.6, 1, 2, -53.1, -51.9, cover({ tag: 'bollards' })),
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
  path: [[0, 1.3, 0], [-13.5, 0], [-13.5, 29], [2.25, 29], [2.25, 47], [-21.5, 47], [-21.5, 62], [-14, 62], [-14, 55], [0, 55], [0, 60.5]],
  checkpoints: [[2.25, 31], [-14, 47]],
  yaw: 0,
};
// Bazookarp (DATA ONLY: the mode's engine is not built yet; nothing reads `bazookarp` until it lands, and its kit pieces
// are added by variants.js only in mode 'bazookarp', so every current build is untouched). The format of
// tools/botlab/jobs/batch5/bazookarp/SPEC.md §4.1, drawn on Bravo's half (Alpha's attack), DESIGN.md §4.4.
const BAZOOKARP = {
  start: [0, 1.3, 0],                                    // the Pond: the concourse centre, under Tartar
  weirs: [{ at: [10.15, 1.2, 33.0] }],                   // Bravo's GPO terrace
  gate: { at: [0, 59], yaw: 0 },                         // Bravo's turntable on the forecourt terrace (y 1.0)
  freeZones: [{ poly: [[-12, 66], [12, 66], [12, 76], [-12, 76]], y0: 2.9, y1: 5.9,
    signs: [[-8.5, 66.3, 0], [8.5, 66.3, 0], [-12.3, 71, 90], [12.3, 71, 270]] }],   // Bravo's spawn deck
  routes: {
    swimston: [[0, 12], [3, 26], [5.5, 34], [10.15, 33], [5.5, 36], [3, 47], [0, 52], [0, 59]],
    arch: [[8, 8], [16.25, 17], [16.25, 24], [12, 24.5], [10.15, 30], [10.15, 33]],
    east: [[10.15, 33], [5.5, 32], [-4, 33], [-4, 48], [-1, 53], [0, 59]],
  },
  noRetreat: [], carrierBlock: [], noRest: [], hopVeto: [],
};

// ------------------------------------------------------------------------------------------------ the eras (the engine's data)
// ENGINE.md §3.3 exactly; the era engine (src/game/eras.js) is not built yet: nothing reads `eras` until it lands.
const ERAS = {
  names: ['1880s', 'TODAY', '3000s'],
  at: [1 / 3, 2 / 3],
  warn: 10, prebell: 20, speed: 25, guard: 0.5,
  modes: { boss: { fixed: 2 }, practice: { cycle: 60 }, attract: { cycle: 40 } },
  tartar: { type: 'bluestone_tartar', pos: [0, 5.4, 0], rotY: 0 },
  clocks: [{ type: 'bluestone_clockhands', pos: [0, 5.15, -7.88], rotY: 180, faces: 5 }],
  phones: [[17.73, 1.2, -3.13], [-13.4, 1.2, -10.47], [-20.7, 2.1, -55.0]],
  pulses: [
    [[0, 9, 0], [0, 6.5, -20], [0, 6.5, -50], [0, 7, -64]],
    [[0, 9, 0], [-17, 6.5, -8], [-52, 6.5, -24]],
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
// the railyard wall's outer face (off −14.6), the viaduct's outer face, the yard wall's outer face, the bounds, the river
export const RAILYARD = {
  top: EMB,
  poly: [AO(-62, -14.6), AO(-33.95, -14.6), [-24.6, -33.0], [-27.6, -57.9], [-27.6, -85], [-63, -85], [-63, -46]],
  // the garden stairs' channels through it (all eras open; filled in the 1880s and today in the stair's group)
  // (poly: the stair's footprint + 0.2 m, kept clear of the embankment's cells by 0.25 m more; fills: the 1880s / today
  //  fillers of the stair's own footprint, in the stair's groups; sides: solid strips beside the stair in every era, so the
  //  trench has walls and no slot)
  channels: [
    { poly: rectPoly(-32.58, -25.6, -46.2, -42.8), fills: [[rectPoly(-32.38, -25.7, -46, -43), 'garden-t3']],
      sides: [rectPoly(-32.38, -25.7, -47.0, -46), rectPoly(-32.38, -25.7, -43, -42.0)] },
    { poly: armPoly(-44.7, -41.3, -20.35, -14.4), fills: [[armPoly(-44.5, -41.5, -16.6, -14.4), 'garden-sa'], [armPoly(-44.5, -41.5, -20.15, -16.6), 'garden-sa2']],
      sides: [armPoly(-45.5, -44.5, -20.15, -14.4), armPoly(-41.5, -40.5, -20.15, -14.4)] },
    { poly: armPoly(-58.7, -55.3, -20.0, -14.4), fills: [[armPoly(-58.5, -55.5, -19.8, -14.4), 'garden-sc']],
      sides: [armPoly(-59.5, -58.5, -19.8, -14.4), armPoly(-55.5, -54.5, -19.8, -14.4)] },
  ],
};

// ------------------------------------------------------------------------------------------------ the whole union, then this build's era
export const HALF_ALL = [...groundPieces, ...MID, ...haloPieces, ...SWIMSTON, ...WEST, ...VIADUCT, ...SIGNAL_GARDEN, ...ARM, ...EAST, ...RIVER, ...BASE];
export const SINGLE_ALL = SINGLE;

const LAYOUT_BLUESTONE = {
  id: 'bluestone',
  bounds: { minX: -63, maxX: 63, minZ: -85, maxZ: 85 },
  spawnPads: [[0, 3.3, -72], [0, 3.3, 72]],
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
