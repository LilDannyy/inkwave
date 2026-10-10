// Bluestone Junction — stage layout (src/world/stages/bluestone/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, Bazookarp data, the era data (this file)
//   ground.js    the ground built from outline polygons (cores, kerb bars)      era.js      era tags + the blockout filter
//   props.js     prop pack + placements                                         surfaces.js / murals.js / backdrop.js
//
// BLOCKOUT, ROUND C (2026-10-10): the macro shape is a DOG-LEG, a kinked Z (STAGE-RULES.md, "The lead's correction
// (2026-10-10)"). Each team's main street, Swimston Street, comes in from its spawn; the two are offset sideways (Alpha's
// on the west, Bravo's on the east) and joined at mid by Flounders Street Station's concourse running east–west as the
// Z's crossbar. The river fills the Z's two re-entrant corners. Mid is the round-B mid, kept as built.
// The design: tools/botlab/jobs/batch5/stages/bluestone/DESIGN.md (the place, mid, the eras, the look; §2.6c is this
// round's plan), ENGINE.md (the era data's format).
//
// Alpha at −Z (the half list), Bravo is the 180° twin. +x is east; a kid facing +z has +x on its left.
//   • the Z: Alpha's leg x −38 … −6 from its base (z −76) to the crossbar (z −20); the crossbar x −38 … 38, z −20 … 20;
//     Bravo's leg the twin. The SE river corner (x > −6, z < −20) is Alpha's side of the river, the NW one Bravo's.
//   • mid: the circus (a ring at 0 round the station's octagonal concourse, 1.3, under the dome on eight columns), the
//     clock rows over the Clock Steps, the hotel balcony (2.4), the Boathouse deck (2.4); the Halo (5.4) in the 3000s
//   • spawn: the Cable Tram Engine House's gallery (3.3) over the forecourt terrace (1.0), between the boiler house and
//     the tram shed, at the foot of Alpha's leg
// Heights: 0 streets · 1.0 the forecourt terrace · 1.3 the concourse · 2.4 the balcony, the Boathouse deck · 3.3 the
// spawn decks · 5.4 the Halo.
import { PATTERN, B, R as R0, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { ERA, eraFilter } from './era.js';
import { BOT, TIER_Y, coverRects, bars, junctionPatches, tierBoxes, symOutline, rectPoly } from './ground.js';

// ------------------------------------------------------------------------------------------------ frames
// a stair / ramp (a solid wedge): its sides and end caps are buried or hidden, so only its top is turf (paint atlas)
function R(low, high, width, o = {}) {
  const dx = high[0] - low[0], dy = high[1] - low[1], dz = high[2] - low[2], L = Math.hypot(dx, dy, dz), h = Math.hypot(dx, dz);
  const sx = -dz / h, sz = dx / h, ux = dx / L, uy = dy / L, uz = dz / L;
  return R0(low, high, width, { ...o, noPaint: [[sx, 0, sz], [-sx, 0, -sz], [ux, uy, uz], [-ux, -uy, -uz]] });
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
// a building: an inkable block from y0 to 3 m, and a roof block (`roof`, not inkable) from 3 m to its top (DESIGN.md
// §2.6 point 1: paint and lightmap stay in the 0–3 m band)
// (y0 < 0: the building stands in a hole in the street on a base, like a tier: no street under it in the paint atlas)
const bld = (x0, x1, z0, z1, top, o = {}, y0 = 0) => [...(y0 < 0 ? [B(x0, x1, y0, TIER_Y, z0, z1, { pattern: PATTERN.render, ...o, paint: false })] : []),
  B(x0, x1, y0 < 0 ? TIER_Y : y0, 3, z0, z1, { pattern: PATTERN.render, ...o }), B(x0, x1, 3, top, z0, z1, { pattern: PATTERN.render, ...o, roof: true, paint: false })];
const rail = (o = {}) => ({ rail: true, paint: false, color: '#333333', ...o });

// ------------------------------------------------------------------------------------------------ the Z
// Alpha's chain (the full outline is the chain and its mirror): the knee's north-west corner, down the leg's west edge
// (the railway viaduct side) to the engine house's back, across the base, up the leg's east edge (the quay on the SE
// river corner) to the knee's inner corner; the mirror runs on from (38, −20) along the crossbar's south edge
export const LEG = { x0: -37, x1: -6, z0: -76, z1: -20 };
// (the knee's outer corner is chamfered on 45° from (−22, 20) by the circus's corner to the west edge at z 5: the crossbar
//  tapers into each leg, so the Z's stroke reads, and the pocket behind the knee is not bare floor)
const CHAIN = [[-22, 20], [-37, 5], [-37, -76], [-6, -76], [-6, -20]];
const NCH = CHAIN.length;
export const OUTLINE = symOutline(CHAIN);
// kerb bars on the diagonal edges (edge i of the chain; its mirror is i + NCH): the chamfer
const KERB = { 0: -0.18 };
const kerbAt = (i) => KERB[i % NCH];

// ------------------------------------------------------------------------------------------------ the base
// the forecourt terrace (1.0) across the leg, its front notched for the forecourt steps; the spawn deck (3.3) behind it
// between the boiler house and the tram shed; the Cable Tram Engine House at the back
export const PAD = [-18, 3.3, -64.5];   // (east of the deck's middle, toward the leg's inner side: spawn → mid 6.1 / 6.4 s, and the Bazookarp Gate 12 m off)
export const P = {
  deck: [-31, -12, -70, -60], engine: [-31, -12, -76, -70], boiler: [-37, -31, -76, -60], shed: [-12, -6, -76, -60],
  carriage: [-24.5, -16, -50, -20],   // Swimston's carriageway (granite): one slab, its own colour
  arcade: [-30.5, -26.5, -42, -28],   // the Royal Arcade's mosaic floor (0.6)
  gpo: [-13, -9.5, -42, -29],       // the GPO's portico terrace (1.2)
  gpoB: [-16, -9.5, -46, -42],        // the GPO (its clock tower on Customs Lane's corner)
  customs: [-33, -26, -12, -2],       // the Customs House in the knee
  prow: [-36.5, -27, -25, -14],         // Prow Place (1.0), at the head of Hoki Lane and the arcade
  boathouse: [14.5, 21.5, -24, -12],  // the Boathouse (deck 2.4), standing in the river at the crossbar's SE
};
export const TERRACE = [[-37, -60], [-6, -60], [-6, -50], [-16.5, -50], [-16.5, -52.5], [-26.5, -52.5], [-26.5, -50], [-37, -50]];
const BLDS = [P.engine, P.boiler, P.shed, [-14, -9.5, -22.5, -18.5], P.gpoB, P.customs, [-31, -30.5, -42, -28], [-26.5, -26, -42, -28], [-37, -36.5, -50, -14]];   // (the street is cut out under them)
const TIERS = [TERRACE, ...BLDS.map((r) => rectPoly(...r)), rectPoly(...P.deck), rectPoly(...P.boathouse), rectPoly(...P.arcade), rectPoly(...P.gpo), rectPoly(...P.prow)];
const mirP = (p) => p.map(([x, z]) => [-x, -z]);

// ------------------------------------------------------------------------------------------------ the ground
// the street (0): cores over the window z ≤ 0 (the mirror lays the rest), never under the circus slab
const GROUND = coverRects(OUTLINE, { x0: -37, x1: 37, z0: -76, z1: 0 }, { hard: [[-20, 20, -20, 20], P.carriage, [16, 24.6, 20, 50]], soft: [...TIERS, ...TIERS.map(mirP)] });
const TER = coverRects(TERRACE, { x0: -37, x1: -6, z0: -60, z1: -50 });
export const GROUND_MISS = [...GROUND.miss, ...TER.miss];
const groundPieces = [
  ...tierBoxes(GROUND.rects, 0, ground({ tag: 'street' })),
  ...bars(OUTLINE, { only: (i) => i < NCH && kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }),
  ...junctionPatches(OUTLINE, { barred: (i) => kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }).filter((d) => d.center[2] < 0),
  ...tierBoxes(TER.rects, 1.0, ground({ tag: 'terrace', color: K.blueT })),
  ...tierBoxes([P.carriage], 0, { tag: 'carriageway', color: K.granite, pattern: SURF.granite }),
];

// ------------------------------------------------------------------------------------------------ mid: the station (kept as built in round B)
const DEG = Math.PI / 180;
const polar = (r, bearing) => [+(r * Math.sin(bearing * DEG)).toFixed(4), +(r * Math.cos(bearing * DEG)).toFixed(4)];
const SINGLE = [
  // the circus floor (one slab: the hour-ring mural's face) and the concourse (the booking-hall floor, 1.3)
  B(-20, 20, BOT, 0, -20, 20, ground({ tag: 'circus', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] })),
  ...OCT(0, 0, 9.5, 0, 1.3, sand({ tag: 'concourse' })),
  // the dome: the drum on the columns (drawn), the dome and the lantern as collision only: their look is the
  // bluestone_dome prop
  ...OCT(0, 0, 8.8, 8, 10, { tag: 'drum', color: '#b8a888', pattern: PATTERN.render, roof: true, paint: false }),
  ...OCT(0, 0, 7.0, 10, 12.4, { tag: 'dome', hidden: true, roof: true, paint: false }),
  ...OCT(0, 0, 4.8, 12.4, 14.4, { tag: 'dome', hidden: true, roof: true, paint: false }),
  B(-1.75, 1.75, 14.4, 19, -1.75, 1.75, { tag: 'lantern', hidden: true, roof: true, paint: false }),
];

// the hotel stair (the 3000s): x −16.5 … −14 (against the balcony landing's west edge), from z −15 (2.4) north to
// z −8.4 (5.2, 23.0°), its top landing on to z −4.5 where it meets the Halo's 270° side
export const HOTEL_STAIR = { x0: -16.5, x1: -14.0, zFoot: -15.0, yFoot: 2.4, zTop: -8.4, yTop: 5.2, zLand: -4.5, zK0: -15.8, zK1: -10.2 };
const HS_X = (HOTEL_STAIR.x0 + HOTEL_STAIR.x1) / 2;
// (round C) the Boathouse stair: x 14.6 … 17.1, from the deck's north edge (z −12, 2.4) north to z −5 (5.4, 23.2°), its
// landing on to z −2.5 over the Halo's 90° side's outer edge; the river stair: z −20 … −17 on the circus's river edge,
// from x 9.6 (0) west to x −2.4 (5.3, 23.8°), its landing west to x −5.4 and north to the Halo's 180° side (z −14.6)
export const BOAT_STAIR = { x0: 14.6, x1: 17.1, zFoot: -12, zTop: -5, zLand: -2.5 };
const BS_X = (BOAT_STAIR.x0 + BOAT_STAIR.x1) / 2;
export const RIVER_STAIR = { xFoot: 9.6, xMid: 3.6, xTop: -2.4, xLand: -5.4, z0: -20, z1: -17 };
const RS_Z = (RIVER_STAIR.z0 + RIVER_STAIR.z1) / 2;
// (round C fix 1) the knee flight: x −17.8 (0) … −14 (2.4, the balcony's west edge), z −18.5 (the hotel's north face) …
// −15.8 (the cab shelter's south end)
export const KNEE_FLIGHT = { x0: -17.8, x1: -14, z0: -18.5, z1: -15.8 };
const KF_Z = (KNEE_FLIGHT.z0 + KNEE_FLIGHT.z1) / 2;
const AP_OUT = 14.6;
const MID = [
  R([0, 0, -12], [0, 1.3, -8.78], 7, stair({ tag: 'clock-steps' })),
  R([-9.03, 0, -9.03], [-6.21, 1.2, -6.21], 5, stair({ tag: 'concourse-ramp' })),
  ...[112.5, 157.5, 202.5, 247.5].flatMap((b) => { const [x, z] = polar(8.2, b); return [
    O(x, z, 0.9, 0.9, 1.2, 3.3, b, { tag: 'column', color: '#a99d84', pattern: PATTERN.render }),
    O(x, z, 0.9, 0.9, 3.3, 8, b, { tag: 'column', color: K.iron, pattern: PATTERN.metal, roof: true, paint: false }),
  ]; }),
  B(-3.1, 3.1, 5.3, 6.6, -7.85, -7.3, { tag: 'clock-beam', color: '#3f4a45', pattern: PATTERN.metal, roof: true, paint: false }),
  ...[135, 225].map((b) => { const [x, z] = polar(5.65, b); return OB(x, z, 1.2, 3, 1.3, 3.6, b - 90, { tag: 'ticket-booth', color: '#4f5d55', pattern: PATTERN.metalpanel, roof: true }); }),
  ...[[147, 13.6, -1], [248, 13.6, 1]].flatMap(([b, r, end]) => {
    const [x, z] = polar(r, b), tx = Math.sin((b + 90) * DEG), tz = Math.cos((b + 90) * DEG);
    return [OB(x, z, 2.4, 4.0, 0, 0.7, b + 90, { tag: 'ring-bed', color: '#7f8a6c', pattern: PATTERN.planter }),
      OB(+(x + end * 1.6 * tx).toFixed(4), +(z + end * 1.6 * tz).toFixed(4), 2.4, 0.8, 0, 1.3, b + 90, cover({ tag: 'ring-bed-planter', color: K.planter, pattern: PATTERN.planter, roof: true }))];
  }),
  OB(6.2, -14.6, 1.2, 2.2, 0, 1.2, 250, cover({ tag: 'cart', color: '#7a6a58' })),   // (round C: off the river booking office)
  B(9.8, 11, 0, 1.2, -6.6, -5.4, cover({ tag: 'bollards' })),
  B(17.13, 18.33, 0, 2.4, -3.73, -2.53, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  B(-17.7, -16.5, 0, 2.4, -13.4, -12.2, { tag: 'phone-kiosk', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  B(-15.94, -14.54, 0, 2.6, -7.01, -5.61, { tag: 'poster-column', color: '#6e5f4c', pattern: PATTERN.wood, roof: true, paint: false, notIn: 'boss' }),
  // the hotel stair: the 1880s / today cab shelter (its lower 2.1 m every era), the 3000s glass flight inside it
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x1, 0, 2.1, HOTEL_STAIR.zK0, HOTEL_STAIR.zK1, { tag: 'cab-shelter', color: K.kiosk, pattern: PATTERN.metalpanel, paint: false }),
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x1, 2.1, 3.0, HOTEL_STAIR.zK0, HOTEL_STAIR.zK1, { tag: 'cab-shelter', color: K.kiosk, pattern: PATTERN.metalpanel, roof: true, paint: false, eras: '12', eraGroup: 'stair-w' }),
  R([HS_X, HOTEL_STAIR.yFoot, HOTEL_STAIR.zFoot], [HS_X, HOTEL_STAIR.yTop, HOTEL_STAIR.zTop], HOTEL_STAIR.x1 - HOTEL_STAIR.x0, { tag: 'hotel-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: 'stair-w', thin: true, thickness: 0.4 }),
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x0 + 0.12, 3.4, HOTEL_STAIR.yTop + 1, -12.6, HOTEL_STAIR.zTop, rail({ tag: 'hotel-stair-glass', eras: '3', eraGroup: 'stair-w' })),
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x1, HOTEL_STAIR.yTop - 0.4, HOTEL_STAIR.yTop, HOTEL_STAIR.zTop, HOTEL_STAIR.zLand, { tag: 'hotel-stair-landing', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'pylon-w', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]] }),
  B(HOTEL_STAIR.x0, HOTEL_STAIR.x0 + 0.12, HOTEL_STAIR.yTop, HOTEL_STAIR.yTop + 1, HOTEL_STAIR.zTop, HOTEL_STAIR.zLand, rail({ tag: 'hotel-stair-glass', eras: '3', eraGroup: 'pylon-w' })),
  // the Young & Jackfish: H1 (to 9 m) and the prow's corner turret; the balcony over the circus, its landing and stair
  ...bld(-14, -9.5, -22.5, -18.5, 9, { tag: 'hotel', color: K.hotel }, BOT),   // (round C: its east wing arches over the quay, KNEE)
  B(-14, -11.5, 9, 13, -21, -18.5, { tag: 'hotel-turret', hidden: true, roof: true, paint: false }),
  B(-14, -5, 2.1, 2.4, -18.5, -15.5, { tag: 'balcony', color: K.planks, pattern: PATTERN.planks }),
  B(-14, -11, 2.1, 2.4, -15.5, -12.5, { tag: 'balcony-landing', color: K.planks, pattern: PATTERN.planks }),
  R([-5, 0, -14], [-11, 2.4, -14], 3, stair({ tag: 'balcony-stair', color: K.iron, pattern: PATTERN.treads })),
  // the knee flight (round C fix 1; the review: the Halo's three stairs were each a detour off the main routes): from the
  // knee, where Swimston meets the circus, east up the hotel's north face onto the balcony's west end (2.4), against the
  // cab shelter, so the balcony and, in the 3000s, the hotel stair to the Halo (over the shelter's top) sit on the
  // Swimston → circus route instead of a U-turn off the balcony stair (32°; its mirror stands 0.45 m off the tower's
  // lane and 3.3 m from the Bazookarp weir)
  R([KNEE_FLIGHT.x0, 0, KF_Z], [KNEE_FLIGHT.x1, 2.4, KF_Z], KNEE_FLIGHT.z1 - KNEE_FLIGHT.z0, stair({ tag: 'knee-flight', color: K.iron, pattern: PATTERN.treads })),
  ...[[-13.85, -12.65], [-13.85, -15.4], [-5.1, -16]].map(([x, z]) => B(x - 0.125, x + 0.125, 0, 2.1, z - 0.125, z + 0.125, { tag: 'balcony-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  B(-12.6, -11.6, 2.4, 3.4, -15.5, -14.7, cover({ tag: 'balcony-planter', color: K.planter, pattern: PATTERN.planter })),   // (round C fix 1: 0.9 m east, so the knee flight's top walks straight on to the landing)
  B(-11, -5, 2.4, 3.4, -16.0, -15.5, rail({ tag: 'balustrade' })),
  B(-5.5, -5, 2.4, 3.3, -18.5, -16.0, rail({ tag: 'balustrade' })),
  B(-14, -11, 2.4, 3.3, -13.0, -12.5, rail({ tag: 'balustrade' })),
  B(-13.4, -11.4, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-9, -7, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-14, -13.4, 0, 1.5, -15.4, -13.4, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  // (the balcony's north-east corner, against HULLBREAKER's claws: rounds 1–2's boss fix; in the 3000s they stand 3.4 m
  //  under the river stair's landing, roofs nobody stands on)
  B(-6.2, -5.2, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-4.8, -4.0, 0, 1.5, -16.0, -15.2, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  // the Boathouse: its roof deck is Alpha's raised corner by the river (2.4)
  ...tierBoxes([P.boathouse], 2.4, { tag: 'boathouse', color: '#8a7158', pattern: PATTERN.weatherboard }),
  R([18.6, 0, -6], [18.6, 2.4, -12], 3, stair({ tag: 'boathouse-stair', color: K.wood, pattern: PATTERN.treads })),   // (round C: flush with the boat shed)
  B(21.35, 21.5, 2.4, 3.4, -24, -12, rail({ tag: 'deck-rail' })),
  B(14.5, 21.35, 2.4, 3.3, -24, -23.85, rail({ tag: 'deck-rail' })),
  // ---- the Halo's east way up (round C; the round-B review's third way up, from the Boathouse deck): the 1880s / today
  // BOAT SHED on the ring against the deck's north edge (3.2, roof, not inkable: cover at 4:30); the 3000s, inside its
  // footprint (ENGINE rule 19), a glass flight from the deck's north-west corner (2.4) north to 5.4 and a landing
  // over the ring (underside 5.1) onto the Halo's 90° side
  B(BOAT_STAIR.x0, BOAT_STAIR.x1, 0, 3.2, BOAT_STAIR.zFoot, BOAT_STAIR.zTop, { tag: 'boat-shed', color: '#6f5a46', pattern: PATTERN.weatherboard, roof: true, paint: false, eras: '12', eraGroup: 'stair-e' }),
  R([BS_X, 2.4, BOAT_STAIR.zFoot], [BS_X, 5.4, BOAT_STAIR.zTop], BOAT_STAIR.x1 - BOAT_STAIR.x0, { tag: 'boat-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: 'stair-e', thin: true, thickness: 0.4 }),
  B(BOAT_STAIR.x1 - 0.12, BOAT_STAIR.x1, 3.4, 6.4, BOAT_STAIR.zFoot, BOAT_STAIR.zTop, rail({ tag: 'boat-stair-glass', eras: '3', eraGroup: 'stair-e' })),
  B(AP_OUT, BOAT_STAIR.x1, 5.0, 5.4, BOAT_STAIR.zTop, BOAT_STAIR.zLand, { tag: 'boat-stair-landing', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'stair-e2', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]] }),
  B(BOAT_STAIR.x1 - 0.12, BOAT_STAIR.x1, 5.4, 6.4, BOAT_STAIR.zTop, BOAT_STAIR.zLand, rail({ tag: 'boat-stair-glass', eras: '3', eraGroup: 'stair-e2' })),
  B(AP_OUT, BOAT_STAIR.x1 - 0.12, 5.4, 6.4, BOAT_STAIR.zLand - 0.12, BOAT_STAIR.zLand, rail({ tag: 'boat-stair-glass', eras: '3', eraGroup: 'stair-e2' })),
  // ---- the Halo's south way up (round C: Swimston's superstop is gone with the old Swimston, so its glass stair moves
  // to the river): the 1880s / today FERRY BOOKING OFFICE on the circus's river edge (3.2, roof, not inkable), the 3000s
  // glass flight inside its footprint rising west to 5.3 and a landing over the promenade (underside 4.9) onto the
  // Halo's 180° side
  // (two 6 m halves, one group each: ENGINE rule 3's 8 m)
  ...[[RIVER_STAIR.xMid, RIVER_STAIR.xFoot, 0, 2.65, 'stair-s1'], [RIVER_STAIR.xTop, RIVER_STAIR.xMid, 2.65, 5.3, 'stair-s2']].flatMap(([x0, x1, ya, yb, g]) => [
    B(x0, x1, 0, 3.2, RIVER_STAIR.z0, RIVER_STAIR.z1, { tag: 'ferry-office', color: '#56685e', pattern: PATTERN.metal, roof: true, paint: false, eras: '12', eraGroup: g }),
    R([x1, ya, RS_Z], [x0, yb, RS_Z], RIVER_STAIR.z1 - RIVER_STAIR.z0, { tag: 'river-stair', color: K.glass, pattern: PATTERN.treads, eras: '3', eraGroup: g, thin: true, thickness: 0.4 }),
    B(x0, x1, Math.max(3.4, ya + 1), yb + 1, RIVER_STAIR.z0, RIVER_STAIR.z0 + 0.12, rail({ tag: 'river-stair-glass', eras: '3', eraGroup: g }))]),
  B(RIVER_STAIR.xLand, RIVER_STAIR.xTop, 4.9, 5.3, RIVER_STAIR.z0, -AP_OUT, { tag: 'river-stair-landing', color: K.glass, pattern: PATTERN.glasstile, eras: '3', eraGroup: 'stair-s3', noPaint: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]] }),
  B(RIVER_STAIR.xLand, RIVER_STAIR.xTop, 5.3, 6.3, RIVER_STAIR.z0, RIVER_STAIR.z0 + 0.12, rail({ tag: 'river-stair-glass', eras: '3', eraGroup: 'stair-s3' })),
  B(RIVER_STAIR.xLand, RIVER_STAIR.xLand + 0.12, 5.3, 6.3, RIVER_STAIR.z0 + 0.12, -AP_OUT, rail({ tag: 'river-stair-glass', eras: '3', eraGroup: 'stair-s3' })),
  B(17, 19.4, 2.4, 3.4, -22.6, -21.8, cover({ tag: 'deck-racks', color: '#7d6c5a', roof: true })),
  B(18.4, 19.6, 2.4, 3.4, -16.2, -14.6, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
];

// ------------------------------------------------------------------------------------------------ the Halo (the 3000s)
// a glass ring walkway at 5.4 (inner apothem 11.1, outer 14.6), glass balustrades both edges
const HALO_Y = 5.4, AP_IN = 11.1, AP_MID = (AP_IN + AP_OUT) / 2, T22 = Math.tan(22.5 * DEG);
const HIN = AP_IN * T22, HOUT = AP_OUT * T22;
const haloPieces = [];
{
  const N8 = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].flatMap((a) => [[Math.sin(a * DEG), 0, Math.cos(a * DEG)], [-Math.sin(a * DEG), 0, -Math.cos(a * DEG)]]).map((v) => v.map((x) => +x.toFixed(4)));
  const halo = (o) => ({ tag: 'halo', color: K.glass, pattern: PATTERN.glasstile, eras: '3', noPaint: N8, ...o });
  const hrail = (o) => rail({ tag: 'halo-rail', eras: '3', ...o });
  const sides = [[90, 1, 'halo-1'], [135, -1, 'halo-2'], [135, 1, 'halo-3'], [180, -1, 'halo-4'], [180, 1, 'halo-5'], [225, -1, 'halo-6'], [225, 1, 'halo-7'], [270, -1, 'halo-8']];
  for (const [b, k, g] of sides) {
    const top = b % 90 === 0 ? HALO_Y : HALO_Y - 0.1;
    const nx = Math.sin(b * DEG), nz = Math.cos(b * DEG), tx = Math.cos(b * DEG), tz = -Math.sin(b * DEG);
    const at = (ap, m) => [+(ap * nx + k * m * tx).toFixed(4), +(ap * nz + k * m * tz).toFixed(4)];
    const [cx, cz] = at(AP_MID, HOUT / 2);
    const thick = b % 90 === 0 ? 0.3 : 0.4;
    haloPieces.push(O(cx, cz, +(AP_OUT - AP_IN).toFixed(4), +HOUT.toFixed(4), top - thick, top, b + 90, halo({ eraGroup: g })));
    let inner = [[0.02, HIN - 0.12]], outer = [[0.02, HOUT + 0.03]];
    if (b === 135 || b === 225) inner = [[1.0, HIN - 0.12]];
    if (b === 225 && k === 1) outer = [[0.02, HOUT - 0.8]];
    if (b === 270 && k === -1) outer = [[0.02, -HOTEL_STAIR.zLand - 0.15]];
    // (round C: the river stair's landing joins the 180° side at x −5.4 … −2.4, the Boathouse stair's the 90° side at
    //  z −5 … −2.5)
    if (b === 180 && k === 1) outer = [[0.02, -RIVER_STAIR.xTop - 0.05], [-RIVER_STAIR.xLand + 0.05, HOUT + 0.03]];
    if (b === 90 && k === 1) outer = [[0.02, -BOAT_STAIR.zLand - 0.05], [-BOAT_STAIR.zTop + 0.05, HOUT + 0.03]];
    for (const [ap, segs] of [[AP_IN - 0.06, inner], [AP_OUT + 0.06, outer]]) for (const [s0, s1] of segs) {
      const [rx, rz] = at(ap, (s0 + s1) / 2);
      haloPieces.push(O(rx, rz, 0.12, +(s1 - s0).toFixed(4), top, top + 1, b + 90, hrail({ eraGroup: g })));
    }
  }
  // (round C: and one on each of the 90°, 125° and 270° sides — the 3000s cover map's open stretches on the Halo)
  for (const [b, g, r] of [[157.5, 'halo-3', 14.4], [202.5, 'halo-5', 14.4], [233, 'halo-7', 13.9], [98.5, 'halo-1', 13.2], [125, 'halo-2', 13.6], [261, 'halo-8', 13.2]]) {
    const [px, pz] = polar(r, b);
    haloPieces.push(O(px, pz, 1.2, 1.2, HALO_Y - 0.1, HALO_Y + 1, b, { tag: 'halo-planter', color: K.planter, pattern: PATTERN.planter, roof: true, eras: '3', eraGroup: g }));
  }
}


// ------------------------------------------------------------------------------------------------ Alpha's leg: Swimston Street
// west to east: the railway viaduct (the leg's outer edge), Hoki Lane under it, the Royal Arcade, Swimston (footpaths and
// the tram carriageway), the GPO (its building on Customs Lane's corner, its portico terrace at 1.2 with steps down to
// Swimston), the quay on the river corner; Degrayling Lane crosses from Swimston to the quay north of the GPO; Customs
// Lane runs along the forecourt terrace's front
const VIA = 4.1;
const LEG_PIECES = [
  // the railway viaduct (4.1, roof, not inkable: the leg's outer wall over the river)
  B(-37, -36.5, BOT, VIA, -50, -14, { tag: 'viaduct', color: K.wall, pattern: SURF.bluestone, roof: true, paint: false }),
  ...[-40, -28, -16].map((z) => B(-37.2, -36.2, BOT, VIA + 0.3, z - 0.5, z + 0.5, { tag: 'viaduct-pier', color: K.wall, pattern: SURF.bluestone, roof: true, paint: false })),
  // Hoki Lane's cover (street art on the viaduct; bins, crates and planters on alternate sides, 1.0–1.2 m)
  B(-36.4, -35.2, 0, 1.2, -45, -43.4, cover({ tag: 'bins', color: '#56605a' })),
  B(-32.2, -31, 0, 1.0, -39, -37.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-36.4, -35.2, 0, 1.0, -33, -31.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-32.2, -31, 0, 1.2, -27, -25.4, cover({ tag: 'bins', color: '#56605a' })),
  // the Royal Arcade: its walls (7 m; the west wall's two shopfront grilles onto Hoki Lane: rail, shots, ink and sight
  // pass), its 0.6 mosaic floor, its glass vault (roof)
  ...bld(-31, -30.5, -42, -38.5, 6, { tag: 'arcade-wall', color: K.gpo }, BOT), ...bld(-31, -30.5, -35, -33, 6, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...bld(-31, -30.5, -29.5, -28, 6, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...[[-38.5, -35], [-33, -29.5]].flatMap(([z0, z1]) => [B(-31, -30.5, BOT, 3, z0, z1, rail({ tag: 'arcade-grille', color: '#2f3a35' })),
    B(-31, -30.5, 3, 6, z0, z1, { tag: 'arcade-wall', color: K.gpo, pattern: PATTERN.render, roof: true, paint: false })]),
  ...bld(-26.5, -26, -42, -28, 6, { tag: 'arcade-wall', color: K.gpo }, BOT),
  ...tierBoxes([P.arcade], 0.6, ground({ tag: 'arcade-floor', color: '#8d8679', pattern: PATTERN.tiles })),
  B(-31, -26, 6, 6.3, -42, -28, { tag: 'arcade-roof', color: '#9fb1b5', pattern: PATTERN.glasstile, roof: true, paint: false }),
  OB(-28.5, -39.2, 1.2, 1.6, 0.6, 1.8, 0, cover({ tag: 'arcade-kiosk', color: '#5c6b62' })),
  OB(-28.5, -31.4, 1.2, 2.0, 0.6, 1.8, 0, cover({ tag: 'flower-stall', color: '#6f7a5a' })),
  // Swimston: the tram at its stop on the west track (the era-slot kit: one collider, three looks — a cable tram, a
  // tram, a float-tram), the stop's island and shelter on the west footpath, the kiosks and planters on the kerbs
  B(-24.2, -21.6, 0, 3.2, -34, -28, { tag: 'tram', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  B(-26, -24.6, 0, 0.3, -35, -27, { tag: 'tram-island', color: K.stone, pattern: SURF.bluestone }),
  B(-25.8, -24.8, 0.3, 2.6, -33, -29, { tag: 'tram-shelter', color: K.iron, pattern: PATTERN.metal, roof: true }),
  B(-25.9, -24.7, 0, 1.5, -45, -43, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-25.9, -24.7, 0, 1.5, -24, -22, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-15.9, -14.7, 0, 1.5, -27.5, -25.5, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-21.2, -19.8, 0, 2.2, -41.5, -39.5, { tag: 'news-kiosk', color: '#4d5f57', pattern: PATTERN.metal, roof: true, notIn: 'tower' }),
  OB(-22.4, -24, 1.2, 2.2, 0, 1.2, 0, cover({ tag: 'cart' })),
  // (round C, the strip test: the east track ran 46 m bare from the kiosk into the knee — the tower's lane, so these
  //  stand in every mode but Tower Command; the kerb planter by the GPO steps' north end stands in every mode)
  B(-20.4, -18.6, 0, 1.2, -27, -25.8, cover({ tag: 'bollards', notIn: 'tower' })),
  B(-20.4, -18.6, 0, 1.0, -11, -9.8, cover({ tag: 'trough', color: '#6f726f', notIn: 'tower' })),
  B(-17.2, -16.2, 0, 1.5, -30, -28, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  // the GPO: the building on Customs Lane's corner (its clock tower to 16 m), the portico terrace (1.2) with its steps
  // down to Swimston and its piers, the hop down to the quay on its east face
  // (6 m, no clock tower: in the Z the dome stands off Swimston's axis, 10–22° right of it from the spawn deck, exactly
  //  behind the GPO's corner; a tower there hid it. The art pass puts the GPO's clock on its parapet, under the dome's line)
  ...bld(P.gpoB[0], P.gpoB[1], P.gpoB[2], P.gpoB[3], 6, { tag: 'gpo', color: K.gpo }, BOT),
  ...tierBoxes([P.gpo], 1.2, sand({ tag: 'gpo-terrace' })),
  R([-16, 0, -35.5], [-13, 1.2, -35.5], 9, stair({ tag: 'gpo-steps' })),
  B(-13, -12.2, 1.2, 3.2, -41.5, -40.7, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  B(-13, -12.2, 1.2, 3.2, -30.3, -29.5, { tag: 'gpo-pier', color: '#bdb196', pattern: PATTERN.render, roof: true }),
  B(-10.9, -9.7, 1.2, 2.2, -36.4, -34.6, cover({ tag: 'gpo-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  // Degrayling Lane (Swimston ↔ the quay, north of the GPO): the 1880s produce stacks shut its west half (2.8, roof, not
  // inkable) → today café tables in their footprint (the same group)
  B(-14.5, -10, 0, 2.8, -28.5, -23.5, { tag: 'crates-stack', color: K.crate, pattern: PATTERN.wood, roof: true, paint: false, eras: '1', eraGroup: 'crates-1' }),
  OB(-13, -27, 1.2, 1.2, 0, 1.0, 0, cover({ tag: 'cafe', color: '#7b6f60', eras: '23', eraGroup: 'crates-1' })),
  OB(-11.5, -25, 1.2, 1.2, 0, 1.0, 0, cover({ tag: 'cafe', color: '#7b6f60', eras: '23', eraGroup: 'crates-1' })),
  // the quay: bollards and crates along the river edge, a crane base
  B(-7.2, -6.2, 0, 1.0, -46, -44.8, cover({ tag: 'bollards' })),
  B(-7.4, -6.2, 0, 1.2, -38.6, -36.4, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-7.4, -6.2, 0, 1.0, -27.8, -26.6, cover({ tag: 'bollards' })),
  B(-9.5, -8.3, 0, 1.2, -32.2, -30.6, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),   // (the strip test: against the GPO terrace)
  // Customs Lane: the goods wagon on the GPO siding (the 1880s, today: a horse-drawn wagon, then the heritage siding's
  // last wagon) → the 3000s clear the level crossing, a bike dock in its footprint; benches, planters
  B(-12.4, -9, 0, 2.8, -49.6, -46.4, { tag: 'goods-wagon', color: K.wagon, pattern: PATTERN.wood, roof: true, paint: false, eras: '12', eraGroup: 'crossing' }),
  B(-11.8, -9.6, 0, 1, -48.6, -47.4, cover({ tag: 'bike-dock', color: '#4e5a5f', pattern: PATTERN.metal, eras: '3', eraGroup: 'crossing' })),
  B(-33, -30.6, 0, 1, -48.4, -47.6, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(-27.8, -26.6, 0, 1.2, -46, -44.6, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
];

// ------------------------------------------------------------------------------------------------ the knee (Alpha's end of the crossbar)
// Prow Place (where Hoki Lane and the arcade come out), the cab rank where Swimston meets the circus, the Customs House,
// the river walk round its west side to the chamfer and the circus's north-west; the hotel's arch over the quay
// (round C fix 1: the customs loading dock along the chamfer, placed in the chamfer's own frame: a metres along it from
//  its west end (−37, 5), c metres in from its water edge)
const S2 = Math.SQRT1_2;
const CH = (a, c) => [+(-37 + S2 * (a + c)).toFixed(4), +(5 + S2 * (a - c)).toFixed(4)];
const CH3 = (a, c, y) => { const [x, z] = CH(a, c); return [x, y, z]; };
export const DOCK = { a0: 0, len: 14, c0: 0.05, w: 4.2, y: 1.2 };
const KNEE = [
  // the Young & Jackfish's east wing on an arch over the quay (soffit 3.8): the quay runs under it into the circus
  // (round C: carried 2.5 m out over the river corner on iron brackets, and an oriel bay over Swimston's east footpath
  //  (2.6 – 9): with the hotel they close the Z's throat, so no line from one spawn deck reaches the other — rc-sight.mjs)
  B(-9.5, -3.5, 3.8, 9, -22.5, -18.5, { tag: 'hotel-arch', color: K.hotel, pattern: PATTERN.render, roof: true, paint: false }),
  B(-17, -14, 2.6, 9, -22.5, -18.5, { tag: 'hotel-oriel', color: K.hotel, pattern: PATTERN.render, roof: true, paint: false }),
  B(-6.4, -6, 0, 3.8, -22.5, -21.7, { tag: 'arch-pier', color: K.hotel, pattern: PATTERN.render, roof: true }),
  // the Customs House (9 m)
  ...bld(P.customs[0], P.customs[1], P.customs[2], P.customs[3], 9, { tag: 'customs-house', color: K.customs, pattern: SURF.bluestone }, BOT),
  // Prow Place: a 1.0 m bluestone terrace at the head of Hoki Lane and the arcade (steps up from Hoki Lane, a hop from
  // the arcade's mouth, a drop to the cab rank and the river walk), its fountain and a horse trough: the outer flank
  // arrives above the knee and looks over the cab rank to the circus
  ...tierBoxes([P.prow], 1.0, ground({ tag: 'prow-place', color: K.blueT })),
  R([-34, 0, -27.5], [-34, 1.0, -25], 5, stair({ tag: 'prow-steps', color: '#7c8088' })),
  B(-31.6, -29.4, 1.0, 2.2, -21.6, -19.4, cover({ tag: 'fountain', color: '#8a8e8c' })),
  B(-36.4, -35.4, 1.0, 2.0, -18, -15.6, cover({ tag: 'trough', color: '#6f726f' })),
  B(-28.4, -27.2, 1.0, 2.0, -24.4, -23, cover({ tag: 'bollards' })),
  // the cab rank: a cabmen's shelter, a statue on its plinth, bollards
  B(-25.6, -23.4, 0, 2.6, -11.5, -8.5, { tag: 'cabmen-shelter', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
  B(-23.8, -22.2, 0, 1.6, -4.8, -3.2, cover({ tag: 'statue-plinth', color: '#8b8579' })),
  B(-16.8, -15.6, 0, 1.2, -4.2, -2.2, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-26, -24.8, 0, 1.0, 1.0, 2.2, cover({ tag: 'bollards' })),
  // the river walk west of the Customs House and the apron behind it: crates, a bench against the house
  B(-36.4, -35.2, 0, 1.0, -9, -7.2, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood })),
  B(-32.6, -30.6, 0, 1.0, -1.6, -0.8, cover({ tag: 'bench', color: '#7d6c5a' })),   // (round C fix 1: off the dock stair's foot)
  B(-29.6, -28.4, 0, 1.2, -1.6, -0.2, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, roof: true })),   // (the strip test: the knee's east–west line)
  B(-25, -23.6, 0, 1.5, 15.4, 16.8, cover({ tag: 'lamp-plinth', color: '#8b8579' })),
  // ---- the CUSTOMS LOADING DOCK (round C fix 1; the review: the apron behind the Customs House was the emptiest floor
  // on the stage, flat to the water and right under the enemy's Boathouse deck): a 1.2 m bluestone dock along the
  // chamfer's water edge, 14 × 4.2 m, from the west corner to 7 m short of the enemy Boathouse; two stairs down its inner
  // face to the apron (the rest of that face is a 1.2 m hop). It looks over the apron, the cab rank's north end and the
  // circus ring at 9–10 o'clock, and answers the Boathouse deck from 1.2 m under it instead of 2.4 m (a kid on it sees 81 %
  // of that deck's floor against 47 % from the apron: rcf1-dock-sight.mjs). Its cover, all low so it sees over it: a crate
  // stack, the planter and the crates that stood on the apron, mooring posts (their tops are roofs: no perch on the dock).
  OB(...CH(DOCK.a0 + DOCK.len / 2, DOCK.c0 + DOCK.w / 2), DOCK.w, DOCK.len, BOT, DOCK.y, 45, ground({ tag: 'customs-dock', color: '#6a717a', noPaint: [[-0.7071, 0, 0.7071]] })),
  ...[3.0, 10.5].map((a) => R(CH3(a, DOCK.c0 + DOCK.w + 3, 0), CH3(a, DOCK.c0 + DOCK.w, DOCK.y), 2.5, stair({ tag: 'dock-stair', color: '#7c8088' }))),
  OB(...CH(1.6, 1.6), 1.2, 1.2, DOCK.y, DOCK.y + 1.0, 45, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood, roof: true })),
  OB(...CH(5.6, 1.6), 1.2, 2.4, DOCK.y, DOCK.y + 1.2, 45, cover({ tag: 'planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  OB(...CH(8.6, 0.7), 0.8, 1.6, DOCK.y, DOCK.y + 1.0, 45, cover({ tag: 'mooring-post', color: '#5b5048', roof: true })),   // (low: a crane's plinth here hid the Boathouse deck from the dock)
  OB(...CH(12.4, 2.0), 1.4, 2.2, DOCK.y, DOCK.y + 1.0, 45, cover({ tag: 'crates', color: K.crate, pattern: PATTERN.wood, roof: true })),
];

// ------------------------------------------------------------------------------------------------ the river corner (Alpha's: x > −6, z < −20)
// the PUNT CROSSING (every era: a chain ferry's pontoons, 3 m, top −0.34) from the quay's south end east, then north to
// the circus's river edge at 5 o'clock; TODAY the IRON BRIDGE (top −0.2) from the quay by the GPO straight across to the
// punt's north leg; the 3000s the FLOATING GARDEN in the harbour basin the two enclose (top −0.2). Decks over the water
// stand on prop columns, bottoms −0.6 (ENGINE rule 36); nothing over the water ever vanishes (rule 28).
export const PUNT = { x0: -6, x1: 14, zE0: -44, zE1: -41, xN0: 11, zN1: -20, y: -0.34 };
export const BRIDGE = { x0: -6, x1: PUNT.xN0, z0: -33, z1: -30, y: -0.2 };
export const GARDEN = [[-6, PUNT.xN0, PUNT.zE1, BRIDGE.z0], [-6, PUNT.xN0, BRIDGE.z1, -26]];   // the basin's two parts
const RIVER = [];
{
  const pnt = (o) => ({ tag: 'punt', color: K.planks, pattern: PATTERN.planks, ...o });
  RIVER.push(B(PUNT.x0, PUNT.x1, -0.6, PUNT.y, PUNT.zE0, PUNT.zE1, pnt()));
  RIVER.push(B(PUNT.xN0, PUNT.x1, -0.6, PUNT.y, PUNT.zE1, PUNT.zN1, pnt()));
  // its rails on the open river side; its cover (mooring posts, a ferryman's box, rope coils)
  RIVER.push(B(PUNT.x0, PUNT.x1, PUNT.y, PUNT.y + 1, PUNT.zE0, PUNT.zE0 + 0.12, rail({ tag: 'punt-rail' })));
  RIVER.push(B(PUNT.x1 - 0.12, PUNT.x1, PUNT.y, PUNT.y + 1, PUNT.zE0 + 0.12, PUNT.zN1, rail({ tag: 'punt-rail' })));
  RIVER.push(B(-0.6, 0.6, PUNT.y, PUNT.y + 1.2, PUNT.zE0 + 0.2, PUNT.zE0 + 1.4, cover({ tag: 'ferry-box', color: '#6f5a46', roof: true })));
  RIVER.push(B(PUNT.x1 - 1.4, PUNT.x1 - 0.2, PUNT.y, PUNT.y + 1.0, -38.6, -37.4, cover({ tag: 'mooring-post', color: '#5b5048', roof: true })));
  RIVER.push(B(PUNT.xN0 + 0.2, PUNT.xN0 + 1.4, PUNT.y, PUNT.y + 1.0, -29.6, -28.4, cover({ tag: 'mooring-post', color: '#5b5048', roof: true })));
  RIVER.push(B(6.4, 7.6, PUNT.y, PUNT.y + 1.0, PUNT.zE1 - 1.4, PUNT.zE1 - 0.2, cover({ tag: 'mooring-post', color: '#5b5048', roof: true })));
  // the Iron Bridge (today, the 3000s): three spans (≤ 8 m, one group each) and their rails; in the 3000s the garden
  // fills the basin either side of it, reached from the quay and the punt
  const spans = [-6, -0.33, 5.33, PUNT.xN0];
  for (let k = 0; k < 3; k++) {
    const g = `bridge-${k + 1}`;
    RIVER.push(B(spans[k], spans[k + 1], -0.6, BRIDGE.y, BRIDGE.z0, BRIDGE.z1, { tag: 'iron-bridge', color: K.bridge, pattern: PATTERN.planks, eras: '23', eraGroup: g }));
    for (const [z0, z1] of [[BRIDGE.z0, BRIDGE.z0 + 0.12], [BRIDGE.z1 - 0.12, BRIDGE.z1]]) RIVER.push(B(spans[k], spans[k + 1], BRIDGE.y, BRIDGE.y + 1, z0, z1, rail({ tag: 'bridge-rail', eras: '23', eraGroup: g })));
  }
  RIVER.push(B(2, 2.8, BRIDGE.y, 1.2, BRIDGE.z0 + 0.15, BRIDGE.z0 + 0.95, cover({ tag: 'bridge-lamp', color: '#3f4a48', pattern: PATTERN.metal, roof: true, eras: '23', eraGroup: 'bridge-2' })));
  // the floating garden (the 3000s): tiles ≤ 8 m (one group each), its planters and glasshouse (roof) on them
  const gt = (o) => ({ tag: 'floating-garden', color: K.lawn, pattern: PATTERN.planter, eras: '3', ...o });
  const xs = [-6, -0.33, 5.33, PUNT.xN0];
  GARDEN.forEach(([gx0, gx1, gz0, gz1], j) => { for (let k = 0; k < 3; k++) RIVER.push(B(xs[k], xs[k + 1], -0.6, BRIDGE.y, gz0, gz1, gt({ eraGroup: `garden-${j}${k}` }))); });
  for (const [x0, x1, z0, z1, g, h] of [[-3.8, -2.2, -39.2, -36.4, 'garden-00', 1.2], [7.4, 9.6, -38.8, -37.6, 'garden-02', 1.2], [1.4, 4.2, -36.6, -35.4, 'garden-01', 2.6],
    [-2.6, -1.4, -29, -27, 'garden-10', 1.2], [7.6, 9.2, -28.8, -27.2, 'garden-12', 1.2]]) RIVER.push(B(x0, x1, BRIDGE.y, h, z0, z1, cover({ tag: 'garden-planter', color: K.planter, pattern: PATTERN.planter, roof: true, eras: '3', eraGroup: g })));
}

// ------------------------------------------------------------------------------------------------ the base
const BASE = [
  // the forecourt steps (where Swimston arrives) and the spawn deck, the Engine House gallery (3.3)
  R([-21.5, 0, -50], [-21.5, 1, -52.5], 10, stair({ tag: 'forecourt-steps', color: '#7c8088' })),
  ...tierBoxes([P.deck], 3.3, { tag: 'spawn-deck', color: K.spawn, pattern: PATTERN.spawn }),
  R([-28, 1, -54.5], [-28, 3.3, -60], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  R([-15, 1, -54.5], [-15, 3.3, -60], 5, stair({ tag: 'grand-stair', color: '#a59b88' })),
  ...[[-31, -30.5], [-25.5, -24.5], [-18.5, -17.5], [-12.5, -12]].map(([x0, x1]) => B(x0, x1, 3.3, 4.3, -60.15, -60, rail({ tag: 'deck-rail' }))),
  // the Cable Tram Engine House (and its chimney), the boiler house and the tram shed: the back of the base (their faces
  // over the water are out of reach: not inkable)
  ...bld(P.engine[0], P.engine[1], P.engine[2], P.engine[3], 9, { tag: 'engine-house', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1]] }, BOT),
  B(-30, -28, 9, 24, -74, -72, { tag: 'chimney', color: '#6a5b50', pattern: PATTERN.brick, roof: true, paint: false }),
  ...bld(P.boiler[0], P.boiler[1], P.boiler[2], P.boiler[3], 6, { tag: 'boiler-house', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1], [-1, 0, 0]] }, BOT),
  ...bld(P.shed[0], P.shed[1], P.shed[2], P.shed[3], 6, { tag: 'tram-shed', color: K.engine, pattern: SURF.bluestone, noPaint: [[0, 0, -1], [1, 0, 0]] }, BOT),
  // the gallery's own cover: planters beside the stair heads and at the back, a plinth by the drop (the pad keeps 4.2 m clear)
  B(-26.8, -25.6, 3.3, 4.3, -68.4, -66.2, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-13.6, -12.4, 3.3, 4.3, -69.6, -68.4, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-30.6, -29.4, 3.3, 4.3, -64.4, -62.2, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-13.6, -12.4, 3.3, 4.3, -64.4, -62.2, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter, roof: true })),
  B(-23.9, -22.7, 3.3, 4.3, -60.9, -60.3, cover({ tag: 'deck-plinth', color: '#8b8579', roof: true })),
  // the forecourt terrace: the grip car on the turntable road, a coal bin, the turntable's benches and buffers, banks,
  // troughs, the ticket booth (cover every 6–8 m; the tower's lane on the east track, x −19.5 … −17, stays clear)
  B(-36, -33.4, 1, 4, -59.4, -54, { tag: 'grip-car', color: K.tram, pattern: PATTERN.metalpanel, roof: true }),
  B(-36.6, -35.4, 1, 2.4, -52.6, -51, cover({ tag: 'coal-bin', color: '#4a4744' })),
  B(-27.6, -26.4, 1, 2.25, -58.4, -56.4, cover({ tag: 'turntable-bench', color: '#7d6c5a' })),
  B(-25, -23.8, 1, 2.25, -57.6, -56.4, cover({ tag: 'buffer', color: '#5b5048' })),   // (3 m clear of the Bazookarp Gate)
  B(-12.4, -11.2, 1, 2.25, -58.4, -56.4, cover({ tag: 'turntable-bench', color: '#7d6c5a' })),
  B(-9, -6.6, 1, 2, -59, -58, cover({ tag: 'trough', color: '#6f726f' })),
  B(-9.4, -7, 1, 2, -53.4, -52.4, cover({ tag: 'trough', color: '#6f726f' })),
  B(-31.6, -29, 1, 2, -52.4, -51.4, cover({ tag: 'bench', color: '#7d6c5a' })),
  B(-15.6, -14.4, 1, 3.2, -52.6, -51, { tag: 'ticket-booth', color: K.kiosk, pattern: PATTERN.metal, roof: true }),
];

// ------------------------------------------------------------------------------------------------ the modes
// Zone Control: the centre is the octagon under the telephone (the concourse top); the side zone at Alpha's knee
const ZONES = {
  center: [{ poly: [[2.49, 6.01], [6.01, 2.49], [6.01, -2.49], [2.49, -6.01], [-2.49, -6.01], [-6.01, -2.49], [-6.01, 2.49], [-2.49, 6.01]], y0: 1.0, y1: 1.8 }],
  // the side zone: the knee (round C fix 1; it stood at the GPO's corner, 22.6 m from the pad): the cab rank where
  // Swimston meets the circus and Prow Place's east end (1.0) with its fountain, 12 × 9 m, about 32 m from mid and 46 m
  // from the pad; both floors count (the street 0, the terrace 1.0, not the 1.2 m cover tops). In from Swimston, Prow
  // Place's steps (Hoki Lane), the arcade's mouth, the circus ring, the cab rank from the north and the river walk
  side: { poly: [[-32, -24], [-20, -24], [-20, -15], [-32, -15]], y0: -0.2, y1: 1.1 },
};
// Tower Command, "the tower takes the tram line" (drawn on Bravo's half: Alpha's goal): off the concourse's east face,
// east across the circus to Bravo's knee, a square corner onto Swimston's east track, north up it past the GPO and the
// tram stop, up the forecourt steps onto the terrace, its goal 12 m short of Bravo's pad
const TOWER = {
  path: [[0, 1.3, 0], [19.5, 0], [19.5, 53]],
  checkpoints: [[19.5, 8], [19.5, 30]],
  yaw: 0,
};
// Bazookarp (DATA ONLY; SPEC.md §4.1, drawn on Bravo's half: Alpha's attack)
const BAZOOKARP = {
  start: [0, 1.3, 0],
  weirs: [{ at: [21, 0, 15] }],                         // Bravo's knee, where its Swimston meets the crossbar (y 0)
  gate: { at: [22, 53], yaw: 0 },                       // Bravo's forecourt terrace (y 1.0), 12 m in front of its pad
  freeZones: [{ poly: [[12, 60], [31, 60], [31, 70], [12, 70]], y0: 2.9, y1: 5.9, signs: [[15, 60.3, 0], [28, 60.3, 0]], eras: null }],   // Bravo's spawn deck
  routes: {},
  noRetreat: [], carrierBlock: [], noRest: [], hopVeto: [],
  pondPlinth: null,
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
  phones: [[17.73, 1.2, -3.13], [-17.1, 1.2, -12.8], [-15, 2.1, -51.8]],   // (round C: the third on the forecourt terrace's ticket booth)
  pulses: [                                                                  // (round C: the overhead wires on the Z, Alpha's half)
    [[0, 9, 0], [-20, 6.5, -10], [-20, 6.5, -50], [-21.5, 7, -62]],          //   up Swimston to the engine house
    [[0, 9, 0], [-30, 6.5, -18], [-34, 6.5, -45]],                          //   Prow Place and Hoki Lane
    [[0, 9, 0], [-8, 6, -24], [-8, 6, -45]],                                //   the quay
    [[0, 9, 0], [12.5, 6, -20], [12.5, 6, -42]],                            //   the punt crossing
    [[0, 9, 0], [-30, 6.5, 2], [-35, 6.5, -10]],                            //   the knee's river walk
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

// ------------------------------------------------------------------------------------------------ the whole union, then this build's era
export const HALF_ALL = [...groundPieces, ...MID, ...haloPieces, ...LEG_PIECES, ...KNEE, ...RIVER, ...BASE];
export const SINGLE_ALL = SINGLE;

const LAYOUT_BLUESTONE = {
  id: 'bluestone',
  bounds: { minX: -42, maxX: 42, minZ: -80, maxZ: 80 },
  spawnPads: [PAD, [-PAD[0], PAD[1], -PAD[2]]],
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
