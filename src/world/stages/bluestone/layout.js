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
export const LEG = { x0: -36, x1: -6, z0: -76, z1: -20 };
// (the knee's outer corner is chamfered on 45° from the circus's corner (−20, 20) to the west edge at z 4: the crossbar
//  tapers into each leg, so the Z's stroke reads, and the pocket behind the knee is not bare floor)
const CHAIN = [[-20, 20], [-36, 4], [-36, -76], [-6, -76], [-6, -20]];
const NCH = CHAIN.length;
export const OUTLINE = symOutline(CHAIN);
// kerb bars on the diagonal edges (edge i of the chain; its mirror is i + NCH): the chamfer
const KERB = { 0: -0.18 };
const kerbAt = (i) => KERB[i % NCH];

// ------------------------------------------------------------------------------------------------ the base
// the forecourt terrace (1.0) across the leg, its front notched for the forecourt steps; the spawn deck (3.3) behind it
// between the boiler house and the tram shed; the Cable Tram Engine House at the back
export const PAD = [-21.5, 3.3, -65];
export const P = {
  deck: [-31, -12, -70, -60], engine: [-31, -12, -76, -70], boiler: [-36, -31, -76, -60], shed: [-12, -6, -76, -60],
};
export const TERRACE = [[-36, -60], [-6, -60], [-6, -50], [-16.5, -50], [-16.5, -52.5], [-26.5, -52.5], [-26.5, -50], [-36, -50]];
const BLDS = [P.engine, P.boiler, P.shed, [-14, -6, -22.5, -18.5]];   // (the street is cut out under them: the hotel last)
const TIERS = [TERRACE, ...BLDS.map((r) => rectPoly(...r)), rectPoly(...P.deck), rectPoly(16.5, 21.5, -24, -12)];
const mirP = (p) => p.map(([x, z]) => [-x, -z]);

// ------------------------------------------------------------------------------------------------ the ground
// the street (0): cores over the window z ≤ 0 (the mirror lays the rest), never under the circus slab
const GROUND = coverRects(OUTLINE, { x0: -36, x1: 36, z0: -76, z1: 0 }, { hard: [[-20, 20, -20, 20]], soft: [...TIERS, ...TIERS.map(mirP)] });
const TER = coverRects(TERRACE, { x0: -36, x1: -6, z0: -60, z1: -50 });
export const GROUND_MISS = [...GROUND.miss, ...TER.miss];
const groundPieces = [
  ...tierBoxes(GROUND.rects, 0, ground({ tag: 'street' })),
  ...bars(OUTLINE, { only: (i) => i < NCH && kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }),
  ...junctionPatches(OUTLINE, { barred: (i) => kerbAt(i) !== undefined, level: kerbAt, opts: ground({ tag: 'kerb', color: '#535a63' }) }).filter((d) => d.center[2] < 0),
  ...tierBoxes(TER.rects, 1.0, ground({ tag: 'terrace', color: K.blueT })),
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
  OB(5.99, -16.44, 1.2, 2.2, 0, 1.2, 250, cover({ tag: 'cart', color: '#7a6a58' })),
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
  ...bld(-14, -6, -22.5, -18.5, 9, { tag: 'hotel', color: K.hotel }, BOT),
  B(-14, -11.5, 9, 13, -21, -18.5, { tag: 'hotel-turret', hidden: true, roof: true, paint: false }),
  B(-14, -5, 2.1, 2.4, -18.5, -15.5, { tag: 'balcony', color: K.planks, pattern: PATTERN.planks }),
  B(-14, -11, 2.1, 2.4, -15.5, -12.5, { tag: 'balcony-landing', color: K.planks, pattern: PATTERN.planks }),
  R([-5, 0, -14], [-11, 2.4, -14], 3, stair({ tag: 'balcony-stair', color: K.iron, pattern: PATTERN.treads })),
  ...[[-13.85, -12.65], [-13.85, -15.4], [-5.1, -16]].map(([x, z]) => B(x - 0.125, x + 0.125, 0, 2.1, z - 0.125, z + 0.125, { tag: 'balcony-post', color: K.iron, pattern: PATTERN.metal, paint: false })),
  B(-13.5, -12.5, 2.4, 3.4, -15.5, -14.7, cover({ tag: 'balcony-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-11, -5, 2.4, 3.4, -16.0, -15.5, rail({ tag: 'balustrade' })),
  B(-5.5, -5, 2.4, 3.3, -18.5, -16.0, rail({ tag: 'balustrade' })),
  B(-14, -11, 2.4, 3.3, -13.0, -12.5, rail({ tag: 'balustrade' })),
  B(-13.4, -11.4, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-9, -7, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-14, -13.4, 0, 1.5, -15.4, -13.4, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-6.2, -5.2, 0, 1.5, -16.4, -15.8, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  B(-4.8, -4.0, 0, 1.5, -16.0, -15.2, cover({ tag: 'kerb-planter', color: K.planter, pattern: PATTERN.planter })),
  // the Boathouse: its roof deck is Alpha's raised corner by the river (2.4)
  ...tierBoxes([[16.5, 21.5, -24, -12]], 2.4, { tag: 'boathouse', color: '#8a7158', pattern: PATTERN.weatherboard }),
  R([19, 0, -6], [19, 2.4, -12], 3, stair({ tag: 'boathouse-stair', color: K.wood, pattern: PATTERN.treads })),
  B(21.35, 21.5, 2.4, 3.4, -24, -12, rail({ tag: 'deck-rail' })),
  B(16.5, 21.35, 2.4, 3.3, -24, -23.85, rail({ tag: 'deck-rail' })),
  B(17, 19.4, 2.4, 3.4, -22.6, -21.8, cover({ tag: 'deck-racks', color: '#7d6c5a' })),
  B(18.4, 19.6, 2.4, 3.4, -16.2, -14.6, cover({ tag: 'deck-planter', color: K.planter, pattern: PATTERN.planter })),
];

// ------------------------------------------------------------------------------------------------ the Halo (the 3000s)
// a glass ring walkway at 5.4 (inner apothem 11.1, outer 14.6), glass balustrades both edges
const HALO_Y = 5.4, AP_IN = 11.1, AP_OUT = 14.6, AP_MID = (AP_IN + AP_OUT) / 2, T22 = Math.tan(22.5 * DEG);
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
    let inner = [0.02, HIN - 0.12], outer = [0.02, HOUT + 0.03];
    if (b === 135 || b === 225) inner = [1.0, HIN - 0.12];
    if (b === 225 && k === 1) outer = [0.02, HOUT - 0.8];
    if (b === 270 && k === -1) outer = [0.02, -HOTEL_STAIR.zLand - 0.15];
    for (const [ap, [s0, s1]] of [[AP_IN - 0.06, inner], [AP_OUT + 0.06, outer]]) {
      const [rx, rz] = at(ap, (s0 + s1) / 2);
      haloPieces.push(O(rx, rz, 0.12, +(s1 - s0).toFixed(4), top, top + 1, b + 90, hrail({ eraGroup: g })));
    }
  }
  for (const [b, g, r] of [[157.5, 'halo-3', 14.4], [202.5, 'halo-5', 14.4], [233, 'halo-7', 13.9]]) {
    const [px, pz] = polar(r, b);
    haloPieces.push(O(px, pz, 1.2, 1.2, HALO_Y - 0.1, HALO_Y + 1, b, { tag: 'halo-planter', color: K.planter, pattern: PATTERN.planter, eras: '3', eraGroup: g }));
  }
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
];

// ------------------------------------------------------------------------------------------------ the modes
// Zone Control: the centre is the octagon under the telephone (the concourse top); the side zone on Alpha's leg
const ZONES = {
  center: [{ poly: [[2.49, 6.01], [6.01, 2.49], [6.01, -2.49], [2.49, -6.01], [-2.49, -6.01], [-6.01, -2.49], [-6.01, 2.49], [-2.49, 6.01]], y0: 1.0, y1: 1.8 }],
  side: { poly: [[-17, -46], [-8, -46], [-8, -37], [-17, -37]], y0: -0.2, y1: 0.4 },
};
// Tower Command (drawn on Bravo's half: Alpha's goal): east along the crossbar, then north up Bravo's Swimston
const TOWER = {
  path: [[0, 1.3, 0], [21.5, 0], [21.5, 52]],
  checkpoints: [[21.5, 14], [21.5, 34]],
  yaw: 0,
};
// Bazookarp (DATA ONLY; SPEC.md §4.1, drawn on Bravo's half: Alpha's attack)
const BAZOOKARP = {
  start: [0, 1.3, 0],
  weirs: [{ at: [21.5, 0, 18] }],
  gate: { at: [22, 53], yaw: 0 },
  freeZones: [{ poly: [[12, 60], [32, 60], [32, 70], [12, 70]], y0: 2.9, y1: 5.9, signs: [[15.5, 60.3, 0], [28.5, 60.3, 0]], eras: null }],
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
  phones: [[17.73, 1.2, -3.13], [-17.1, 1.2, -12.8]],
  pulses: [
    [[0, 9, 0], [-22, 6.5, -10], [-22, 6.5, -50], [-22, 7, -62]],
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
export const HALF_ALL = [...groundPieces, ...MID, ...haloPieces, ...BASE];
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
