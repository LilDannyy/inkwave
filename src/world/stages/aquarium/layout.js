// Gulper Aquarium — stage layout (src/world/stages/aquarium/). The stage owns every file in this folder:
//   layout.js    level geometry (this file)        props.js    prop pack + placements (set dressing)
//   surfaces.js  stage surface materials (texlib)  murals.js   stage decals / signage (mural atlas)
//   backdrop.js  far scenery + the blockout's glass and tubes   geo.js  geometry helpers   tubeway.js  the pipe data
//
// THE BLOCKOUT (tools/botlab/jobs/batch5/stages/aquarium/DESIGN.md, revision 2): every floor, tier, stair, wall and
// piece of cover at its real size, both halves, the modes' data and the Tubeway's data; plain surfaces, no art.
//
// Inkopolis's 1936 aquarium on its islet: a round drum (r 31–32.5) round the Ocean Court, with one ferry wing swept off
// each gatehouse like the blade of a two-bladed propeller (Alpha's blade runs 30° off the z-axis toward Alpha's left).
//   • mid: the Great Tank (a 16-gon of glass, apothem 7.5) with the teak Feeding Deck on its lid (2.4), the Glass Walk
//     across it over the Gulper Run, six ways up (two ramps, two stairs, two Feeding Steps), the feeding gantry over it
//     with Bathysphere No. 1 hanging at 14.5 m; bronze gulper heads east and west (the Gulper Run's mouths)
//   • the ring, Alpha's half: the SE Reef Hall (Alpha's left, low: a colonnade plinth, a canopy, the curved Reef Window,
//     the side zone) · the South Gatehouse (two pylons, the Shark Arch hall under the Arch Tank: the glass tunnel you
//     fight through, split by the bubble column) · the SW Sea Promenade (Alpha's right, high: 2.4, its Lookout at 3.6,
//     the telescope bay, the Penguin Steps down to Penguin Point) · the kelp drums E and W (10 m glass cylinders with
//     the Kelp Ramp wrapped round their court side and the Kelp Balcony on their sea side)
//   • the blade: the Gate Terrace, the Ticket Hall (1.2) at the knuckle, the Pump Hall shed along the leading edge, the
//     penguin rocks along the trailing edge, the ferry plaza, the Fin Pavilion's spawn deck (3.4) at the tip
// Heights: 0 floor · 0.22–0.6 relief · 0.9–1.0 beds · 1.2 tiers · 2.4 deck + promenades · 3.0 telescope bay · 3.4 spawn
// decks · 3.6 Lookouts + Kelp Balconies. Every tier step is 1.2 m (a hop, a nav jump edge).
// Conventions: Alpha spawns at −z; Alpha's left is +x (east). `half` = Alpha's half, turned 180° for Bravo.
import { PATTERN, B, R, O } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { PIPES, allLegs, endsOf } from './tubeway.js';
import {
  DEG, W, toBlade, bladeBox, bladeRamp, pol, bearing, dist, inArc, radBox, segBox, radRamp, arcBand, arcBandIn,
  chainBand, Cover, layer, inNgon, r3, useBaked,
} from './geo.js';
import { BAKED } from './baked.js';
useBaked(BAKED);

const FL = -2.0;                                    // foundations (the sea is at −1.6)
const C0 = [0, 0], EK = [25, 0], WK = [-25, 0];      // the court's centre, the E / W kelp drums
// blockout palette (DESIGN.md §5.4's colours, so the pictures already read as this place)
const K = {
  terrazzo: '#d6cfc0', teak: '#8f7a63', render: '#ece6da', faience: '#9bb3a8', brass: '#a8895a', bronze: '#8a6a3c',
  granite: '#55595d', glassblock: '#cfe0e0', seagreen: '#6e978a', rock: '#8d8a84', rockUp: '#a09b92', kelp: '#5b5a33',
  coral: '#c99a8a', jelly: '#f2eefa', steel: '#7d8a90', sand: '#cdbb93', window: '#4f7480', crate: '#b59a72',
  kiosk: '#e8dcc4', concrete: '#bdb8ad', bund: '#a9a59b', spawn: '#eae6de', canopy: '#c6d3d1', stone: '#cfc8b8',
  walk: '#bcd2d2', plant: '#d8d2c6', pump: '#8f9a9c', planter: '#9aa57a',
};
const NOPAINT = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]];
const floor0 = (o = {}) => ({ color: K.terrazzo, pattern: PATTERN.tiles, ...o });
const teak = (o = {}) => ({ color: K.teak, pattern: PATTERN.planks, ...o });
const render = (o = {}) => ({ color: K.render, pattern: PATTERN.render, ...o });
const stone = (o = {}) => ({ color: K.stone, pattern: PATTERN.pavers, ...o });
const stair = (o = {}) => ({ color: K.stone, pattern: PATTERN.stonestep, ...o });
const cover = (c, o = {}) => ({ color: c, pattern: PATTERN.plain, ...o });            // low cover you can hop onto
// off-limits: never inked (no face of it), anyone landing on it slides off (`roof`)
const roofR = (c, o = {}) => ({ color: c, pattern: PATTERN.render, roof: true, noPaint: NOPAINT, ...o });
// glass and water: collision only (`hidden`), never inked, off-limits; drawn by backdrop.js (the blockout's glass)
const glass = (o = {}) => ({ hidden: true, paint: false, roof: true, color: '#888888', tag: 'glass', ...o });
const railO = (o = {}) => ({ rail: true, color: '#888888', tag: 'rail', ...o });
// a round piece (Ø 2r): four spokes (0°, 45°, 90°, 135°) whose union is the regular octagon of apothem r; their tops
// step down 8 cm each (they all overlap at the centre)
function rnd(cx, cz, r, y0, top, o = {}) {
  const t = r * Math.tan(22.5 * DEG);
  return [0, 45, 90, 135].map((a, i) => radBox(a, -r, r, 2 * t, y0, r3(top - 0.09 * i), o, [cx, cz]));
}
// a box set on a tank face: the face's outward normal at bearing a (from c), d0 → d1 out along it, t0 → t1 across
function faceBox(a, d0, d1, t0, t1, y0, y1, o = {}, c = C0) {
  const n = [Math.cos(a * DEG), Math.sin(a * DEG)], t = [-n[1], n[0]], dm = (d0 + d1) / 2, tm = (t0 + t1) / 2;
  return O(r3(c[0] + n[0] * dm + t[0] * tm), r3(c[1] + n[1] * dm + t[1] * tm), r3(t1 - t0), r3(d1 - d0), y0, y1, r3(90 - a), o);
}

const SINGLE = [];
const HALF = [];
const H = (...a) => HALF.push(...a.flat());
const S = (...a) => SINGLE.push(...a.flat());

// ============================================================================================================ the centre
// The Great Tank: a 16-gon of glass (apothem 7.5, faces on the axes) on a 0.15 m granite kerb, the teak Feeding Deck
// on its lid (2.2–2.4), the Glass Walk across it (x −7.5…7.5, z ±1.2) over the Gulper Run, a sand bed sunk to −0.6.
export const TANK = { a: 7.5, n: 16, lid: 2.2, deck: 2.4 };
const TANK_L = 2 * TANK.a * Math.tan(Math.PI / TANK.n);            // face length 2.98
// faces of Alpha's half: normals 0, −22.5 … −157.5 (the twins make the rest)
const HALF_FACES = Array.from({ length: 8 }, (_, k) => -22.5 * k);
for (const [k, a] of HALF_FACES.entries()) {
  // the glass (hidden; panels trimmed to meet at their inner corners)
  H(radBox(a, TANK.a - 0.3, TANK.a, 2 * (TANK.a - 0.3) * Math.tan(Math.PI / 16), FL, TANK.lid, glass({ tag: 'tank-glass' })));
  // the granite kerb (drawn; exact outer outline, neighbours alternate their tops)
  H(radBox(a, TANK.a - 0.3, TANK.a, TANK_L, FL, k % 2 ? 0.25 : 0.15, cover(K.granite, { tag: 'tank-kerb', paint: false })));
}
S(B(-7.5, 7.5, TANK.lid, TANK.deck, -1.2, 1.2, { color: K.walk, pattern: PATTERN.glasstile, tag: 'glass-walk' }));
// the brass rim kerb on the four faces with no way up (−22.5, −67.5, −112.5, −157.5): 10 cm proud
const RIM = [-22.5, -67.5, -112.5, -157.5].map((a) => radBox(a, TANK.a - 0.4, TANK.a, TANK_L, TANK.lid, 2.5, cover(K.brass, { tag: 'deck-rim', paint: false })));
H(RIM);
// deck furniture (Alpha's half; turned for Bravo): four hatches inside the zone (1.2 hop-ups), fish-food hoppers and
// feeding-pole racks on the rim
const tang = (x, z) => -(bearing(x, z) + 90);                       // O() angle that lays a box's long side tangentially
H(O(3.6, -2.52, 2.0, 1.0, TANK.deck, 3.6, tang(3.6, -2.52), cover(K.teak, { tag: 'hatch', pattern: PATTERN.planks })));
H(O(-3.6, -2.52, 2.0, 1.0, TANK.deck, 3.6, tang(-3.6, -2.52), cover(K.teak, { tag: 'hatch', pattern: PATTERN.planks })));
H(B(5.43, 6.43, TANK.deck, 3.6, -3.93, -2.93, cover(K.seagreen, { tag: 'hopper' })), B(-6.43, -5.43, TANK.deck, 3.6, -3.93, -2.93, cover(K.seagreen, { tag: 'hopper' })));
H(O(3.24, -6.09, 2.0, 0.4, TANK.deck, 3.4, tang(3.24, -6.09), cover(K.seagreen, { tag: 'pole-rack' })));
// the sand bed in the tank (seen through the glass; the Gulper Run dips to y 0.5 above it)
const TANK_IN = (x, z) => inNgon(C0, 16, TANK.a, 0, x, z, 0.32);
// the Feeding Steps (1.2 + 1.2 onto the deck on the axis: the tower's double drop)
H(B(-2, 2, 0, 1.2, -9.8, -7.2, render({ tag: 'feeding-step' })));
// the deck ramp SE and the deck stair SW (NW / NE: their twins): 4.0 wide, 2.4 → 0 from r 7.2 (under the deck's edge) to 13.5
H(radRamp(-45, 13.5, 0, 7.2, TANK.deck, 4.0, { color: K.teak, pattern: PATTERN.rampboard, tag: 'deck-ramp' }));
H(radRamp(-135, 13.5, 0, 7.2, TANK.deck, 4.0, stair({ tag: 'deck-stair' })));
// the viewing steps (0.4) hugging the glass on the four faces with no way up (children press their noses to it); the
// deck's rim stays 2.0 m above them
for (const [a, t0, t1] of [[-22.5, -0.79, 1.3], [-67.5, -0.79, 0.79], [-112.5, -0.79, 0.79], [-157.5, -1.3, 0.79]]) H(faceBox(a, TANK.a, 9.0, t0, t1, FL, 0.4, stone({ tag: 'viewing-step' })));
// the gulper heads (E listed; W = its twin): bronze, jaws facing out, the Gulper Run's mouths at (±12.7, 0.8, 0); their
// necks run into the tank glass, 0.5 m below the deck's rim
H(B(9.5, 12.7, 0, 2.4, -1.3, 1.3, roofR(K.bronze, { tag: 'gulper-head' })), B(7.4, 9.5, 0, 1.9, -1.0, 1.0, roofR(K.bronze, { tag: 'gulper-neck' })));
// the Feeding Gantry: four legs (inner faces 8.8 m apart: cover on the centre lanes; DESIGN.md had 6.0, but from the
// pads the near legs then hid half the bathysphere), beams at 16.8–17.8, the winch house;
// Bathysphere No. 1 hangs at 13.05–15.95 (drawn by props.js; this is its off-limits collider)
H(B(4.4, 5.6, 0, 16.8, -11.6, -10.4, roofR(K.seagreen, { tag: 'gantry-leg' })), B(-5.6, -4.4, 0, 16.8, -11.6, -10.4, roofR(K.seagreen, { tag: 'gantry-leg' })));
H(B(4.5, 5.5, 16.8, 17.8, -11.6, 11.6, roofR(K.seagreen, { tag: 'gantry-beam' })));
S(B(-4.5, 4.5, 16.8, 17.8, -0.5, 0.5, roofR(K.seagreen, { tag: 'gantry-beam' })), B(-1.5, 1.5, 17.8, 20.0, -1.5, 1.5, roofR(K.seagreen, { tag: 'winch-house' })));
S(B(-1.45, 1.45, 13.05, 15.95, -1.45, 1.45, glass({ tag: 'bathysphere' })));
// the court's exhibits: moon-jelly columns (opaque milky glass, lit from inside), the SW touch-pool dais (a coral-rock
// bed 1.0 with a 0.5 step), the SE diving-helmet bed (0.9) with the bronze helmet, the Tubeway map lectern
H(rnd(6.5, -17.0, 1.5, FL, 4.2, roofR(K.jelly, { tag: 'jelly' })), rnd(-16.25, -2.9, 1.5, FL, 4.2, roofR(K.jelly, { tag: 'jelly' })));
H(B(-12, -6, 0, 1.0, -16.0, -12.6, cover(K.coral, { tag: 'touch-dais', pattern: PATTERN.pavers })), B(-12, -6, 0, 0.5, -12.6, -11.8, cover(K.coral, { tag: 'touch-step', pattern: PATTERN.pavers })));
H(B(-11.5, -6.5, 1.0, 2.0, -15.6, -13.0, roofR(K.window, { tag: 'touch-pool' })));
H(B(11.3, 15.3, 0, 0.9, -8.0, -4.0, cover(K.bronze, { tag: 'helmet-bed', pattern: PATTERN.pavers })), rnd(13.3, -6.0, 1.3, 0.9, 3.5, roofR(K.bronze, { tag: 'helmet' })));
H(B(-8.5, -6.5, 0, 1.2, -18.3, -17.7, roofR(K.brass, { tag: 'lectern' })));

// ============================================================================================================ the gatehouse
// Two wedge pylons (r 20 → 31.2, α −110 … −70, 9 m, off-limits) flank the Shark Arch hall (x −6 … 6, z −19 → −32.5);
// the Arch Tank (6–9 m) joins them over the hall. The east door (x 5.9 → 8.7, z −20 … −24, lintel 4.2) leads into the
// Reef Hall. Inside each pylon a 2.2 m shaft round the Arch Line's riser, glazed toward the hall.
const PY = { r0: 20, r1: 31.2, top: 9.0, t: 0.6, void: [6.0, 8.5, -28.25, -26.0], door: [5.9, 8.7, -24, -20], lintel: 4.2 };
const inPylon = (x, z, sx, inset = 0) => {
  const r = Math.hypot(x, z), a = bearing(x, z);
  const fromFace = sx > 0 ? r * Math.sin((-70 - a) * DEG) : r * Math.sin((a + 110) * DEG);   // metres in from the outer radial face
  return z < 0 && sx * x >= 6 && r >= PY.r0 + inset && r <= PY.r1 - inset && fromFace >= inset && a >= -110 && a <= -70;
};
const inBox = (b, x, z) => x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3];
const voidOf = (sx) => (sx > 0 ? PY.void : [-PY.void[1], -PY.void[0], PY.void[2], PY.void[3]]);
const PYLONS = [];
for (const sx of [1, -1]) {
  const P = roofR(K.render, { tag: 'pylon' });
  const aHall0 = -90 + sx * (90 - Math.acos(6 / PY.r0) / DEG), aHall1 = -90 + sx * (90 - Math.acos(6 / PY.r1) / DEG);   // where x = ±6 meets r 20 / r 31.2
  const aOut = sx > 0 ? -70 : -110;
  // the court face (concave, seen from the court) and the wing face (convex, seen from the Gate Terrace)
  const [c0, c1] = sx > 0 ? [aHall0, aOut] : [aOut, aHall0], [w0, w1] = sx > 0 ? [aHall1, aOut] : [aOut, aHall1];
  PYLONS.push(...arcBandIn(C0, PY.r0, PY.r0 + PY.t, c0, c1, 1, FL, PY.top + 0.1, P));
  PYLONS.push(...arcBand(C0, PY.r1 - PY.t, PY.r1, w0, w1, 3, FL, [PY.top + 0.1, PY.top], P));
  // the outer radial face (the east pylon's into the Reef Hall, the west one's onto the promenade), on the pylon's side
  // (the west pylon's face reaches 0.4 m over the promenade's edge, hiding the floor's cells along it)
  const tdir = [-Math.sin(aOut * DEG), Math.cos(aOut * DEG)], tw = sx > 0 ? PY.t : PY.t + 0.4, off = sx > 0 ? -PY.t / 2 : PY.t / 2 - 0.4 / 2 - 0.0;
  const rad = (r0, r1, y0, y1) => segBox([pol(aOut, r0)[0] + tdir[0] * off, pol(aOut, r0)[1] + tdir[1] * off], [pol(aOut, r1)[0] + tdir[0] * off, pol(aOut, r1)[1] + tdir[1] * off], tw, y0, y1, P);
  if (sx > 0) {   // the east door cuts the face: r 21.28 … 25.54 along α −70 (z −20 … −24)
    const rd0 = 20 / Math.sin(70 * DEG), rd1 = 24 / Math.sin(70 * DEG);
    PYLONS.push(rad(PY.r0 + 0.3, rd0, FL, PY.top), rad(rd1, PY.r1 - 0.3, FL, PY.top), rad(rd0, rd1, PY.lintel, PY.top));
  } else PYLONS.push(rad(PY.r0 + 0.3, PY.r1 - 0.3, FL, PY.top));
}
const pylonCover = new Cover(PYLONS.filter((d) => d.kind !== 'ramp' && (d.center ? d.center[1] - d.size[1] / 2 : d.min[1]) <= FL + 0.01), PY.lintel);
for (const sx of [1, -1]) {
  const V = voidOf(sx), D = sx > 0 ? PY.door : null, P = roofR(K.render, { tag: 'pylon' });
  const rect = sx > 0 ? [6, 12, -31.5, -19] : [-12, -6, -31.5, -19];
  // below the lintel (no door, no shaft); above it (no shaft); the shaft's lid
  PYLONS.push(...layer({ key: `pylon${sx}-low`, rect, res: 0.25, clip: (x, z) => inPylon(x, z, sx, 0), inside: (x, z) => inPylon(x, z, sx, 0.2) && !inBox(V, x, z) && !(D && inBox(D, x, z)), cover: pylonCover, y0: 0, y1: PY.lintel, o: P }));
  PYLONS.push(...layer({ key: `pylon${sx}-high`, rect, res: 0.25, clip: (x, z) => inPylon(x, z, sx, 0), inside: (x, z) => inPylon(x, z, sx, 0.2) && !inBox(V, x, z), cover: new Cover(PYLONS.filter((d) => d.tag === 'pylon' && (d.max ? d.max[1] : d.center[1] + d.size[1] / 2) > 8.95), 8.9), y0: PY.lintel, y1: 8.9, o: P }));
  PYLONS.push(B(V[0], V[1], 8.4, 8.9, V[2], V[3], P));
  // the shaft's glazing toward the hall
  PYLONS.push(B(sx > 0 ? 6.0 : -6.15, sx > 0 ? 6.15 : -6.0, 0, 8.4, V[2], V[3], glass({ tag: 'shaft-glass' })));
}
H(PYLONS);
// the hall: the Arch Tank over it (water, 6–9 m; drawn by backdrop.js), the vault's ribs, the bubble column splitting
// its court mouth into two 4.8 m lanes (and blocking the wing → deck sightline), the shark-viewing bench.
// [blockout] The column is Ø 2.4, not DESIGN.md's 1.6: with the gantry legs out at x ±5 the court's south band
// between the Feeding Step and the hall mouth opened to an 11 m circle (cover-map r 5.5); at Ø 2.4 it is under 10 m,
// the Tower lane keeps 0.95 m to the column and the weir (0, ∓28) 5.3 m.
H(B(-6, 6, 6.0, 9.0, -31, -19, glass({ tag: 'arch-tank' })));
for (const z of [-19.15, -22.1, -25.0, -27.9, -30.85]) H(B(-6, 6, 5.8, 6.0, z - 0.15, z + 0.15, roofR(K.brass, { tag: 'vault-rib' })));
H(rnd(0, -21.5, 1.2, FL, 5.8, roofR(K.glassblock, { tag: 'bubble-column' })));
H(B(3.0, 5.4, 0, 0.9, -30.3, -29.7, cover(K.teak, { tag: 'shark-bench' })));

// ============================================================================================================ the SE Reef Hall
// Alpha's low covered flank: a 0.45 colonnade plinth along the court edge (7° gaps with a 0.22 step), slim lamp columns
// on it, a canopy (4.6–5.3) cantilevered from the outer wall, the 40 m curved Reef Window (r 30.5 → 32.5, 5 m) with the
// Service Gate through it (α −67 … −58) to the Pump Hall, a viewing kerb under the window, coral sculptures and a clam.
// The plinth stops where the Kelp Ramp's flank begins (α −18.5: the ramp bulges into the court to r 17.5).
for (const [a0, a1, n] of [[-70, -60.5, 3], [-53.5, -46.5, 2], [-39.5, -32.5, 2], [-25.5, -18.5, 2]]) H(arcBand(C0, 20.0, 21.6, a0, a1, n, FL, [0.45, 0.55], stone({ tag: 'plinth' })));
for (const [a0, a1] of [[-60.5, -53.5], [-46.5, -39.5], [-32.5, -25.5]]) H(arcBand(C0, 20.0, 21.6, a0, a1, 1, FL, 0.22, stone({ tag: 'plinth-step' })));
for (const a of [-64, -50, -36, -22]) H(radBox(a, 20.35, 21.25, 0.9, FL, 5.3, roofR(K.brass, { tag: 'lamp-column' })));
H(arcBand(C0, 25.5, 30.5, -70, -12, 12, 4.6, [5.3, 5.4], roofR(K.canopy, { tag: 'canopy' })));
// the Service Gate's opening (bearings): α −67 … −58, 4° nearer the hall than DESIGN.md's −63 … −54, so the Pump Hall
// aisle runs straight into it (fix round 1: the left flank sets spawn → mid, and it jogged east here)
const SG = [-67, -58];
if (SG[0] > -69.5) H(arcBand(C0, 29.3, 30.5, -70, SG[0], Math.max(1, Math.round((SG[0] + 70) / 3.5)), FL, [0.45, 0.55], stone({ tag: 'window-kerb' })));
H(arcBand(C0, 29.3, 30.5, -22, -12, 3, FL, [0.45, 0.55], stone({ tag: 'window-kerb' })));
const WIN = roofR(K.window, { tag: 'reef-window' });
if (SG[0] > -69.5) H(arcBand(C0, 30.5, 32.5, -70, SG[0], Math.max(1, Math.round((SG[0] + 70) / 3.5)), FL, [5.0, 5.1], WIN));
H(arcBand(C0, 30.5, 32.5, SG[1], -2.6, Math.round((-2.6 - SG[1]) / 4), FL, [5.1, 5.0], WIN));
H(rnd(...pol(-43, 25.0), 0.8, FL, 1.6, roofR(K.coral, { tag: 'coral' })), rnd(...pol(-31, 26.0), 0.8, FL, 1.6, roofR(K.coral, { tag: 'coral' })));
H(rnd(...pol(-58, 25.5), 1.0, FL, 1.2, roofR(K.stone, { tag: 'clam' })));

// ============================================================================================================ the kelp drums
// (the E drum, listed in the half list: its twin is the W drum) A 9 m glass cylinder to 10 m on a granite foot, a brass
// crown; the Kelp Ramp wraps its court side from Alpha's arcade (bearing −90, h 0) round to Bravo's promenade (+90,
// h 2.4); the Kelp Balcony (3.6) on its sea side over Bravo's promenade; the plant room (6.0) behind; the Kelp Line's
// low stop set into its foot (the A mouth, facing Alpha's arcade).
const DR = { r: 4.5, crown: [9.4, 10.6], ramp: [4.6, 7.5], wall: 0.3 };
for (let k = 0; k < 8; k++) H(radBox(22.5 * k, -DR.r, DR.r, 2 * DR.r * Math.tan(Math.PI / 16), FL, r3(9.95 - 0.09 * k), glass({ tag: 'drum-glass' }), EK));
H(arcBand(EK, 4.0, 4.6, 0, 360, 16, DR.crown[0], [10.6, 10.7], roofR(K.brass, { tag: 'drum-crown' })));
H(arcBand(EK, 4.0, 4.6, 0, 360, 16, FL, [0.3, 0.4], cover(K.granite, { tag: 'drum-foot', paint: false })));
// the plant room: x ≥ 29 between z −1.5 and the balcony's wall (bearing 15 from the drum), out to the ring
H(O(30.725, -0.155, 3.45, 2.69, FL, 6.0, 0, roofR(K.plant, { tag: 'plant-room' })));
H(segBox(pol(15, 4.4, EK).map((v, i) => v + [0.104, -0.386][i]), pol(15, 7.75, EK).map((v, i) => v + [0.104, -0.386][i]), 0.8, FL, 6.08, roofR(K.plant, { tag: 'plant-room' })));
// the Kelp Ramp: 12 runs of 15°, 2.9 wide, 0 → 2.4 (7.2°), each run slightly long so the outer edge closes; on its
// court side, from bearing −120 (3.9 m up the ramp): a railing (1.0, see-through and shoot-through) along the lower
// two-thirds, then the render parapet (0.9, a face to the floor) over the top third where it meets the promenade
// (fix round 1: a parapet all the way made the ramp a single-file walled channel in full view of the promenade)
const RAMP_N = 12, RAMP_RC = (DR.ramp[0] + DR.ramp[1]) / 2;
for (let k = 0; k < RAMP_N; k++) {
  const b0 = -90 - 15 * k, b1 = b0 - 15, h0 = (2.4 * k) / RAMP_N, h1 = (2.4 * (k + 1)) / RAMP_N;
  const P0 = pol(b0, RAMP_RC, EK), P1 = pol(b1, RAMP_RC, EK), L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]);
  const u = [(P1[0] - P0[0]) / L, (P1[1] - P0[1]) / L], e0 = k === 0 ? 0.25 : 0.2, e1 = k === RAMP_N - 1 ? 0 : 0.2, sl = (h1 - h0) / L;
  H(R([r3(P0[0] - u[0] * e0), r3(h0 - sl * e0), r3(P0[1] - u[1] * e0)], [r3(P1[0] + u[0] * e1), r3(h1 + sl * e1), r3(P1[1] + u[1] * e1)], 2.9,
    { color: K.teak, pattern: PATTERN.rampboard, tag: 'kelp-ramp', thickness: r3(h1 + 2.3) }));
  if (k >= 2 && k < 8) {   // the railing (its top 1.0 over the treads)
    const Q0 = pol(b0, 7.6, EK), Q1 = pol(b1, 7.6, EK), M = Math.hypot(Q1[0] - Q0[0], Q1[1] - Q0[1]), v = [(Q1[0] - Q0[0]) / M, (Q1[1] - Q0[1]) / M];
    const f0 = k === 2 ? 0 : 0.12, f1 = 0.12, s2 = (h1 - h0) / M;
    H(R([r3(Q0[0] - v[0] * f0), r3(h0 + 1.0 - s2 * f0), r3(Q0[1] - v[1] * f0)], [r3(Q1[0] + v[0] * f1), r3(h1 + 1.0 + s2 * f1), r3(Q1[1] + v[1] * f1)], 0.2,
      railO({ thickness: 1.0 })));
  } else if (k >= 8) {     // the parapet
    const Q0 = pol(b0, 7.65, EK), Q1 = pol(b1, 7.65, EK), M = Math.hypot(Q1[0] - Q0[0], Q1[1] - Q0[1]), v = [(Q1[0] - Q0[0]) / M, (Q1[1] - Q0[1]) / M];
    const f0 = 0.25, f1 = k === RAMP_N - 1 ? 0 : 0.25, s2 = (h1 - h0) / M;
    H(R([r3(Q0[0] - v[0] * f0), r3(h0 + 0.9 - s2 * f0), r3(Q0[1] - v[1] * f0)], [r3(Q1[0] + v[0] * f1), r3(h1 + 0.9 + s2 * f1), r3(Q1[1] + v[1] * f1)], 0.3,
      { ...render({ tag: 'kelp-parapet' }), thickness: r3(h1 + 3.3) }));
  }
}
// the Kelp Balcony (3.6): bearings 15 … 75 from the drum, r 4.6 → 7.2 (a hop up from the promenade); its sea edge railed
H(arcBand(EK, 4.6, 7.2, 15, 75, 4, FL, [3.6, 3.7], teak({ tag: 'kelp-balcony' })));
H(arcBandIn(EK, 7.15, 7.45, 15, 47, 2, 3.6, 4.6, railO()));
// the Kelp Line's low stop (A end): a brass bell in the drum's foot facing Alpha's arcade; beside it the pump housing
// closes the pocket between the stop, the drum and the Reef Window
H(B(26.2, 28.6, 0, 2.6, -4.6, -2.8, roofR(K.brass, { tag: 'kelp-stop' })), B(28.6, 30.4, 0, 2.6, -4.6, -1.5, roofR(K.pump, { tag: 'pump-housing' })));

// ============================================================================================================ the SW Sea Promenade
// Alpha's high open flank over the sea (2.4): its inner face (r 21, white render) a squid can climb; balustrades and a
// coping on its court edge, the grand stair up from the court, the Lookout (3.6) over the Jelly Gallery's skylight, the
// telescope bay (3.0) at the sea rail, two kiosks and a deckchair stack, the Penguin Steps down to Penguin Point, the
// deep Kelp stop (the B end of Bravo's Kelp Line) standing through the sea rail.
const PR = { r0: 21, r1: 31.4, y: 2.4 };
const ST_GAP = [-152 - Math.asin(3 / 21) / DEG, -152 + Math.asin(3 / 21) / DEG];      // the grand stair's mouth
const PROM = [];
// court edge: coping (2.5) and balustrades (0.9 solid, 3.3), concave chords on r 21
for (const [a0, a1, top, n] of [[-163.6, ST_GAP[0], 3.3, 1], [ST_GAP[1], -133, 2.5, 3], [-133, -117, 3.3, 4], [-117, -110, 2.5, 2]]) {
  // (the balustrades' tops are off-limits: a 0.4 m ledge nobody should stand on; their court faces stay inkable render)
  PROM.push(...arcBandIn(C0, PR.r0, PR.r0 + 0.4, a0, a1, n, FL, top, top > 3 ? render({ tag: 'balustrade', roof: true }) : stone({ tag: 'prom-coping' })));
}
// sea edge: the coping (convex chords on r 31.4), cut for the Penguin Steps
for (const [a0, a1, n] of [[-171, -124.6, 12], [-115.4, -110, 2]]) PROM.push(...arcBand(C0, 30.9, PR.r1, a0, a1, n, FL, [2.5, 2.6], stone({ tag: 'prom-coping' })));
// the Lookout (3.6) with its balustrade (4.5) on the court edge; the telescope bay (3.0); kiosks; deckchairs
PROM.push(radBox(-141.5, 21.4, 24.4, 3.6, FL, 3.6, teak({ tag: 'lookout' })), radBox(-141.5, 21.4, 21.8, 3.6, FL, 4.5, render({ tag: 'lookout-balustrade', roof: true })));
PROM.push(radBox(-145, 27.6, 31.0, 6.4, FL, 3.0, teak({ tag: 'telescope-bay' })));
PROM.push(radBox(-145, 25.75, 28.25, 2.5, FL, 5.0, roofR(K.kiosk, { tag: 'kiosk' })), radBox(-122, 26.25, 28.75, 2.5, FL, 5.0, roofR(K.kiosk, { tag: 'kiosk' })));
// (the stacked deckchairs: a hop-up, walkable as DESIGN.md has them)
PROM.push(radBox(-158, 28.3, 29.7, 1.4, FL, 3.6, cover(K.coral, { tag: 'deckchairs' })));
// the deep Kelp stop (Bravo's Kelp Line comes down into it from 9 m; its mouth at r 28.3 faces the court)
PROM.push(radBox(-132, 28.3, 33.2, 2.4, FL, 5.0, roofR(K.brass, { tag: 'kelp-stop-deep' })));
// the grand stair (6 wide, 0 → 2.4) and the Penguin Steps (5 wide, 2.4 → 1.2 onto the rock terrace)
PROM.push(radRamp(-152, 15.6, 0, 21.4, PR.y, 6.0, stair({ tag: 'grand-stair' })));
PROM.push(radRamp(-120, 34.6, 1.2, 31.0, PR.y, 5.0, stair({ tag: 'penguin-steps' })));
// the sea rail (r 31.0 → 31.4; 1.0 tall, on the telescope bay 4.0), cut for the steps and the deep stop
for (const [a0, a1, y0, n] of [[-171, -151, PR.y, 5], [-151, -139, 3.0, 3], [-139, -134.3, PR.y, 1], [-129.7, -124.6, PR.y, 1], [-115.4, -110.5, PR.y, 1]]) {
  PROM.push(...arcBandIn(C0, 31.0, 31.4, a0, a1, n, y0, y0 + 1.0, railO()));
}
// the promenade's floor: the sector r 21 → 31.4 between the W kelp drum and the west pylon, round the drum's south side
// (west of the Kelp Ramp's top), not under the plant room; laid under its bands (they hide the cells' staircase)
const inProm = (x, z) => {
  const r = Math.hypot(x, z), dW = dist(x, z, WK);
  return z < 0 && r >= PR.r0 + 0.2 && r <= PR.r1 - 0.2 && r * Math.sin((-110 - bearing(x, z)) * DEG) >= 0.2 && dW >= DR.r + 0.1 && !(x > -25.0 && dW < 7.7) && !(x <= -29.0 && z >= -4.6);
};
// (the W drum's pieces are the twins of the half list: the Cover sees them turned)
const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] }
  : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] });
PROM.push(...layer({ key: 'promenade', rect: [-32, -9, -31.5, 0], res: 0.25, inside: inProm, clip: (x, z) => bearing(x, z) <= -110, cover: new Cover([...PROM, ...HALF, ...HALF.map(mir)].filter((d) => d.kind !== 'box'), PR.y), y0: 0, y1: PR.y, o: teak({ tag: 'promenade' }) }));
H(PROM);

// ============================================================================================================ the wing (the blade)
// Blade coordinates (s along, w across: + = Alpha's left); DESIGN.md §2.4's tables.
const wE = (s) => (s < 10 ? 19.5 : s < 19 ? 18.0 : 16.5);           // the leading edge (the Pump Hall's back wall)
// --- the Ticket Hall (1.2, square to the South Gate) at the blade's knuckle: its stair, queue step, booth, scale,
//     turnstiles and glass canopy on four columns
H(B(2.0, 10.0, 0, 1.2, -46.0, -39.0, floor0({ tag: 'ticket-hall', color: '#cfc6b4' })));
H(R([9.0, 0, -36.2], [9.0, 1.2, -39.0], 2.0, stair({ tag: 'ticket-stair' })));
H(B(7.4, 10.0, 0, 0.6, -47.2, -46.0, stone({ tag: 'queue-step' })));
H(B(8.2, 10.0, 1.2, 3.7, -42.0, -40.0, roofR(K.kiosk, { tag: 'ticket-booth' })), B(2.6, 3.8, 1.2, 2.4, -40.3, -39.3, cover(K.brass, { tag: 'luggage-scale' })));
// (the school-trip coat-peg stand: cover on the hall's west half, clear of the tower's lane by 0.95 m; a hop-up, so
// walkable like every hop-height top)
H(B(2.4, 3.8, 1.2, 2.3, -44.8, -44.2, cover(K.teak, { tag: 'coat-pegs' })));
H(B(8.0, 8.6, 1.2, 2.2, -45.7, -45.1, cover(K.brass, { tag: 'turnstile' })), B(9.2, 9.8, 1.2, 2.2, -45.7, -45.1, cover(K.brass, { tag: 'turnstile' })));
for (const [x, z] of [[3.0, -39.3], [9.7, -39.3], [3.0, -45.7], [9.7, -45.7]]) H(B(x - 0.25, x + 0.25, 1.2, 6.6, z - 0.25, z + 0.25, roofR(K.brass, { tag: 'canopy-column' })));
H(B(2.5, 10.2, 6.6, 6.8, -46.2, -38.8, roofR(K.canopy, { tag: 'ticket-canopy' })));
// --- the Pump Hall: the back-of-house shed along the blade's leading edge (open on its west side), its back wall in
//     three Deco bays with 1.5 m returns, the filter bund (1.2) along it with three sand filters, pumps, sea-salt
//     crates; the sawtooth roof cantilevered from the back wall on one truss column (the forklift now stands on the
//     plaza in front of the Ticket Hall's queue step: fix round 1 found it inside the souvenir kiosk)
const BW = roofR(K.render, { tag: 'pump-wall' });
H(bladeBox(3.6, 10.0, 18.9, 19.5, FL, 7.0, BW), bladeBox(10.0, 10.6, 17.4, 19.5, FL, 7.0, BW), bladeBox(10.6, 19.0, 17.4, 18.0, FL, 7.0, BW),
  bladeBox(19.0, 19.6, 15.9, 18.0, FL, 7.0, BW), bladeBox(19.6, 21.0, 15.9, 16.5, FL, 7.0, BW));
const RF = roofR(K.steel, { tag: 'pump-roof' });
// (the roof at 6.4–6.9, not DESIGN.md's 7.0–8.2, under the back wall's 7.0 coping: the Express's span runs over it at
// 8.0 m, its glass 0.22 m above the teeth, low enough to pass under the bathysphere from the spawn; the tower keeps
// 1.7 m over its swept volume)
for (const [s0, s1, top] of [[3.6, 6.8, 6.9], [6.8, 10.0, 6.6], [10.0, 13.0, 6.9], [13.0, 16.0, 6.6], [16.0, 19.0, 6.9], [19.0, 21.0, 6.6]]) H(bladeBox(s0, s1, 6.5, wE(s0 + 0.01) - (s0 >= 19 ? 0.6 : 0), 6.4, top, RF));
H(B(17.99, 18.59, 0, 6.4, -46.49, -45.89, roofR(K.steel, { tag: 'truss-column' })));
const BUND = { color: K.bund, pattern: PATTERN.metalpanel, tag: 'bund' };
// (the bund ends at s 21, the shed's south end: the Express's plaza stop closes it against the sea edge)
H(bladeBox(8, 10, 13, 18.9, FL, 1.2, BUND), bladeBox(10, 19, 13, 17.4, FL, 1.2, BUND), bladeBox(19, 21, 13, 15.9, FL, 1.2, BUND));
for (const [x, z] of [[19.11, -33.59], [20.66, -37.89], [22.39, -42.09]]) H(rnd(x, z, 1.3, FL, 4.3, roofR(K.steel, { tag: 'sand-filter' })));
// (the second pump set stands against the bund at the shed's south end, s 18.7 … 20.2: DESIGN.md's spot is now the
// apron of the Express's plaza mouth)
H(B(17.05, 18.55, 0, 1.0, -42.0, -40.0, cover(K.pump, { tag: 'pump-set' })), bladeBox(18.7, 20.2, 11.0, 13.0, FL, 1.0, cover(K.pump, { tag: 'pump-set' })));
H(B(17.7, 19.3, 0, 1.4, -31.8, -30.2, cover(K.crate, { tag: 'salt-crates' })));
// --- the Gate Terrace's cross-cover: bollard planters at both ends, the ice-cream cart, the Tubeway post-box column,
//     the ticket-machine bank in front of the hall's wing mouth (not in Tower Command: the track runs there)
H(rnd(-8.5, -33.5, 0.9, FL, 1.3, cover(K.planter, { tag: 'planter' })), rnd(11.0, -36.6, 0.9, FL, 1.3, cover(K.planter, { tag: 'planter' })));
H(B(-6.2, -4.8, 0, 1.4, -40.5, -39.0, cover('#e7b7a8', { tag: 'icecream-cart' })), rnd(-1.0, -39.8, 0.6, FL, 2.4, roofR('#b0473a', { tag: 'post-box' })));
H(B(-0.7, 1.7, 0, 1.5, -35.6, -34.8, cover(K.steel, { tag: 'ticket-machines', notIn: 'tower' })));
// --- Penguin Point: the faux-Antarctic rockery along the trailing edge (1.2; the upper rock 2.4 over the plaza), the
//     keeper's hut, feeding buckets, the ice pile, the basking rock (not in Tower Command), an outcrop, the feeding chute;
//     the penguin glass in four angled bays (≥ 2.0 m over everything standable within 3 m), the cove behind it
const ROCK = { color: K.rock, pattern: PATTERN.concrete, tag: 'penguin-rocks' };
H(bladeBox(-16, -3, -17.0, -10, FL, 1.2, ROCK), bladeBox(-3, 10, -17.8, -10, FL, 1.2, ROCK), bladeBox(10, 13, -17.0, -10, FL, 1.2, ROCK));
H(bladeBox(13, 21, -17.0, -12, FL, 2.4, { ...ROCK, color: K.rockUp, tag: 'upper-rock' }));
const GL = glass({ tag: 'penguin-glass' });
H(bladeBox(-16, -3, -17.4, -17.0, FL, 3.2, GL), bladeBox(-3, 7, -18.2, -17.8, FL, 3.2, GL), bladeBox(7, 10, -18.2, -17.8, FL, 4.4, GL),
  bladeBox(10, 24, -17.4, -17.0, FL, 4.4, GL), bladeBox(24, 31.0, -17.0, -16.6, FL, 2.6, GL));
H(bladeBox(-3.4, -3.0, -18.2, -17.4, FL, 3.2, GL), bladeBox(10.0, 10.4, -18.2, -17.4, FL, 4.4, GL), bladeBox(23.6, 24.0, -17.0, -16.6, FL, 4.4, GL));
H(bladeBox(21.0, 31.2, -17.4, -16.3, FL, 0.4, cover(K.granite, { tag: 'glass-sill', paint: false })));
H(bladeBox(-1, 1, -16.6, -14.6, FL, 3.9, roofR('#c9b79a', { tag: 'keeper-hut' })), B(-9.6, -8.4, 0, 2.4, -46.6, -45.4, roofR('#c4a35a', { tag: 'buckets' })));
H(B(-7.7, -6.3, 0, 2.2, -49.2, -47.8, cover('#e6f0f2', { tag: 'ice-pile' })), B(-8.2, -7.0, 0, 2.2, -40.5, -39.3, cover(K.rockUp, { tag: 'basking-rock', notIn: 'tower' })));
H(bladeBox(16, 18, -14.5, -13.1, FL, 3.6, roofR(K.rock, { tag: 'outcrop' })), bladeBox(9, 10.4, -17.6, -16.2, FL, 2.6, roofR(K.steel, { tag: 'feeding-chute' })));
// the cove (out of bounds: rocks, a pool, the colony; anyone landing there slides off into the sea)
const shore = (s) => -20 - 2.5 * (1 - ((s - 7.5) / 23.5) ** 2);
const glassOut = (s) => (s < -3 ? -17.4 : s < 10 ? -18.2 : s < 24 ? -17.4 : -17.0);
const COVE = roofR(K.rock, { tag: 'cove', noPaint: undefined, paint: false });
const covePts = Array.from({ length: 13 }, (_, i) => { const s = -16 + (47 * i) / 12; return W(s, shore(s)); });
H(chainBand(covePts, 0.6, 1, FL, [0.45, 0.55], COVE));
H(layer({ key: 'cove', frame: 'blade', rect: [-23, -16.6, -16, 31], res: 0.25, inside: (x, z) => { const [s, w] = toBlade(x, z); return s >= -16 && s <= 31 && w >= shore(s) + 0.2 && w <= glassOut(s) + 0.2; }, y0: FL, y1: 0.3, o: COVE }));
// --- the ferry plaza (s 16.5 … 31, 14.5 m deep). Each pavilion stair lands on ≥ 4 m of clear floor (s 27 … 31) across
//     its width and 1 m either side; the front row stands ≥ 2 m off the deck's fascia. West: the queue terrace (0.6, a
//     step) runs from the penguin glass just north of the west stair's landing, its ferry-ticket kiosk, timetable pillar and
//     luggage trolleys at its inner end (w ≥ −12, off the stair's line); the whale-tail bench at the upper rock's foot.
//     Middle: the fish topiary, the trolley stack and the queue-barrier planter (the Bazookarp's apron blocks round the
//     Gate), a luggage trolley and the forklift behind the Ticket Hall (not in Tower Command). East: the souvenir kiosk, and the Express's
//     plaza stop at the Pump Hall's south end, its IN mouth facing across the plaza (west). (DESIGN.md's tank-delivery
//     crates are gone: on the east stair's line, and nowhere else free of the stop's mouth.)
H(bladeBox(24, 27, -17.0, -8.5, FL, 0.6, stone({ tag: 'queue-terrace' })));
H(bladeBox(24.5, 26.5, -10.5, -8.5, FL, 3.0, roofR(K.kiosk, { tag: 'ferry-kiosk' })), bladeBox(24.5, 25.7, -8.5, -7.3, FL, 2.2, roofR(K.seagreen, { tag: 'timetable' })));
H(bladeBox(24.9, 26.1, -12.0, -10.5, FL, 1.5, cover(K.steel, { tag: 'trolleys' })));
H(B(-2.5, 0.5, 0, 1.2, -58.6, -57.4, cover(K.teak, { tag: 'whale-bench' })));
H(rnd(...W(27.4, -2.4), 1.0, FL, 1.2, cover(K.planter, { tag: 'topiary' })));
H(bladeBox(27.6, 28.8, -7.8, -5.8, FL, 1.4, cover(K.crate, { tag: 'trolley-stack' })), bladeBox(28.1, 28.9, 1.2, 3.6, FL, 1.3, cover(K.planter, { tag: 'queue-planter' })));
H(B(6.2, 8.2, 0, 1.4, -52.3, -51.3, cover(K.steel, { tag: 'trolley', notIn: 'tower' })));
// the forklift with a fish tank, parked in front of the Ticket Hall's queue step at the shed's mouth (the tower's track
// turns here: not in Tower Command)
H(B(10.0, 12.0, 0, 2.2, -52.3, -49.3, roofR('#d9a441', { tag: 'forklift', notIn: 'tower' })));
H(bladeBox(25.5, 28, 7, 9.5, FL, 2.6, roofR(K.kiosk, { tag: 'souvenir-kiosk' })));
// the Express's stops: the plaza's (IN) closes the bund's south end against the sea edge, mouth on its west face at
// (s 22.75, w 12.5) facing −w (8.3 m from the east stair's foot); Penguin Point's (OUT) at the foot of the Penguin Steps
H(bladeBox(21, 24.5, 12.5, 16.8, FL, 3.2, roofR(K.brass, { tag: 'express-stop-in' })), bladeBox(-6.0, -1.4, -16.2, -13.8, FL, 5.0, roofR(K.brass, { tag: 'express-stop-out' })));
// the plaza's sea edge: a granite coping (s 24.5 … 31) with the sea rail on it
H(bladeBox(24.5, 31.2, 16.3, 16.85, FL, 0.1, cover(K.granite, { tag: 'sea-coping', paint: false })));
H(bladeBox(24.5, 31.0, 16.5, 16.8, 0.1, 1.1, railO()));

// ============================================================================================================ the Fin Pavilion
// The spawn on the pavilion's curved roof terrace (3.4): a glass-block fascia along its front (a one-way 3.4 m drop),
// stairs down its flanks toward mid (they end on the plaza at the deck's front corners), landings at their tops, sea
// rails round the back, the 18 m fin tower behind. Where DESIGN.md §2.4 drew it (front s 31, pad s 36): fix round 1
// put it back after a first build had moved it 3.5 m nearer mid, which cut the ferry plaza to 11 m and Bazookarp's L
// under 58 m; spawn → mid is shortened on the left flank instead (the Service Gate, below).
export const PAD = [18.0, 3.38, -63.68];   // (3.38, not 3.4: the front drop must stay inside nav.js's 3.4 m drop rule after rounding)
const SP = { y: 3.38, front: 31, fascia: 0.35, land: 39.6, half: 13, stair: 3 };
const back = (w) => 41 + 2 * (1 - (w / 16) ** 2);
H(bladeBox(SP.front, SP.front + SP.fascia, -SP.half, SP.half, FL, SP.y, { color: K.glassblock, pattern: PATTERN.glasstile, paint: false, tag: 'fascia' }));
H(bladeRamp(SP.front, 0, SP.land, SP.y, SP.half + SP.stair / 2, SP.stair, stair({ tag: 'pavilion-stair' })), bladeRamp(SP.front, 0, SP.land, SP.y, -SP.half - SP.stair / 2, SP.stair, stair({ tag: 'pavilion-stair' })));
const backPts = Array.from({ length: 11 }, (_, i) => { const w = -16 + 3.2 * i; return W(back(w), w); });
const SPB = [...chainBand(backPts, 0.5, 1, FL, [3.5, 3.6], stone({ tag: 'deck-coping' }))];
SPB.push(bladeBox(SP.land, back(16) - 0.1, 15.5, 16.0, FL, 3.7, stone({ tag: 'deck-coping' })), bladeBox(SP.land, back(16) - 0.1, -16.0, -15.5, FL, 3.7, stone({ tag: 'deck-coping' })));
H(SPB);
H(layer({ key: 'spawn-deck', frame: 'blade', rect: [-16.5, 16.5, 30.85, 43.35], res: 0.25, cover: new Cover(SPB, SP.y), y0: FL, y1: SP.y, o: teak({ tag: 'spawn-deck', color: '#a08a70' }),
  inside: (x, z) => { const [s, w] = toBlade(x, z), a = Math.abs(w); return s <= back(w) - 0.2 && ((a <= SP.half && s >= SP.front + SP.fascia) || (a <= 15.8 && s >= SP.land)); } }));
H(bladeBox(34, 36, 9.5, 11.5, FL, 4.5, cover(K.planter, { tag: 'deck-planter' })), bladeBox(34, 36, -11.5, -9.5, FL, 4.5, cover(K.planter, { tag: 'deck-planter' })));
// the foyer's two glass-block skylights flanking the pad (1.1 m, a hop-up: walkable and inkable like the Glass Walk),
// 4.8 m out from it (outside the 4.2 m barrier): cover for defenders re-forming on the deck (without them the deck's
// barrier ring was 5–10 m from any cover)
for (const sg of [1, -1]) H(bladeBox(32.7, 38.5, sg > 0 ? 4.8 : -6.4, sg > 0 ? 6.4 : -4.8, FL, r3(SP.y + 1.1), cover(K.glassblock, { tag: 'skylight', pattern: PATTERN.glasstile })));
H(bladeBox(43.0, 46.5, -3, 3, FL, 18.0, roofR('#efe9df', { tag: 'fin-tower' })));
// rails: the deck's back curve and the landings, the stairs' outer sides
for (let i = 0; i < backPts.length - 1; i++) {
  const [a, b] = [backPts[i], backPts[i + 1]], ux = b[0] - a[0], uz = b[1] - a[1], L = Math.hypot(ux, uz), nx = -uz / L * 0.15, nz = ux / L * 0.15;
  H(segBox([a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], 0.3, SP.y, i % 2 ? 4.5 : 4.4, railO()));
}
H(bladeBox(SP.land, back(16) - 0.4, 15.7, 16.0, SP.y, 4.4, railO()), bladeBox(SP.land, back(16) - 0.4, -16.0, -15.7, SP.y, 4.4, railO()));
H(bladeRamp(SP.front, 1.0, SP.land, SP.y + 1.0, 16.15, 0.3, railO()), bladeRamp(SP.front, 1.0, SP.land, SP.y + 1.0, -16.15, 0.3, railO()));

// ============================================================================================================ the ground (0)
// One terrazzo floor under the whole half: the Ocean Court and the ring (r ≤ 30.6), the hall to its wing mouth, the
// Service Gate, the blade between the penguin glass and the leading edge (s −16 … 31); never inside the Great Tank
// (its sand bed is sunk). Laid last, round everything standing on it (cells under a higher piece may merge freely).
const wW = (s) => (s < -3 ? -17.0 : s < 10 ? -17.8 : s < 24 ? -17.0 : -16.6);
const wEf = (s) => (s < 10 ? 19.2 : s < 19 ? 17.7 : s < 21 ? 16.2 : 16.6);
const inBlade = (x, z) => { const [s, w] = toBlade(x, z); return s >= -16 && s <= SP.front && w >= wW(s) && w <= wEf(s); };
const inDrum = (x, z) => { const r = Math.hypot(x, z); return r <= 30.6 || (Math.abs(x) <= 6.0 && z >= -32.6) || (r <= 33.0 && inArc(bearing(x, z), SG[0] - 0.5, SG[1] + 0.5)); };
const ALL = () => [...SINGLE, ...HALF, ...HALF.map(mir)];
const groundCover = new Cover(ALL(), 0);
H(layer({ key: 'ground', rect: [-36, 36, -78, 0], res: 0.25, cover: groundCover, y0: FL, y1: 0, o: floor0({ tag: 'ground' }), clip: (x, z) => !inNgon(C0, 16, TANK.a, 0, x, z, -0.05),
  inside: (x, z) => (inDrum(x, z) || inBlade(x, z)) && !inNgon(C0, 16, TANK.a, 0, x, z, -0.05),
  opt: (x, z) => { const [s, w] = toBlade(x, z); return s > SP.front && s < SP.front + 0.8 && Math.abs(w) <= 16; } }));
H(layer({ key: 'tank-bed', rect: [-7.6, 7.6, -7.6, 0], res: 0.2, inside: TANK_IN, y0: FL, y1: -0.6, o: cover(K.sand, { tag: 'tank-bed', paint: false }) }));
// the Feeding Deck's lid (2.2–2.4) on the tank, Alpha's half (z ≤ −1.2: the Glass Walk is the middle strip)
H(layer({ key: 'feeding-deck', rect: [-7.7, 7.7, -7.7, -1.2], res: 0.1, inside: (x, z) => inNgon(C0, 16, TANK.a, 0, x, z, 0.02), cover: new Cover([...RIM], TANK.deck), y0: TANK.lid, y1: TANK.deck, o: teak({ tag: 'feeding-deck' }) }));

// ============================================================================================================ the modes
// Zone Control: the Feeding Deck (one 12-gon, r 6.2, 115 m²) and Alpha's Reef Hall (the annular sector α −54 … −26,
// r 21.6 → 28.5, 84 m²; Bravo's is the twin)
const ZONES = {
  center: [{ poly: [[6.2, 0], [5.369, 3.1], [3.1, 5.369], [0, 6.2], [-3.1, 5.369], [-5.369, 3.1], [-6.2, 0], [-5.369, -3.1], [-3.1, -5.369], [0, -6.2], [3.1, -5.369], [5.369, -3.1]], y0: 2.2, y1: 2.8 }],
  side: { poly: [[16.75, -23.06], [18.32, -21.83], [19.8, -20.5], [21.18, -19.07], [22.46, -17.55], [23.63, -15.94], [24.68, -14.25], [25.62, -12.49], [19.41, -9.47], [18.71, -10.8], [17.91, -12.08], [17.02, -13.3], [16.05, -14.45], [15.0, -15.54], [13.88, -16.55], [12.7, -17.47]], y0: -0.2, y1: 0.6 },
};
// Tower Command: "the Feeding Round" (drawn on Bravo's half, Alpha's goal): off the deck over the Feeding Step, through
// the North Arch hall's east lane, along the Gate Terrace into Bravo's Pump Hall (checkpoint 1), back over the Ticket
// Hall (checkpoint 2), up past the penguins, down the lane to the plaza and across it to the goal before the pavilion
const TOWER = {
  path: [[0, 2.4, 0], [0, 13.5], [3.4, 13.5], [3.4, 33.5], [-14.0, 33.5], [-14.0, 50.0], [-6.0, 50.0], [-6.0, 37.0],
         [10.5, 37.0], [10.5, 42.5], [-0.5, 42.5], [-0.5, 53.5], [-12.5, 53.5]],
  checkpoints: [[-14.0, 44.0], [-6.0, 40.0]],
  yaw: 0,
};
// Bazookarp (data only: the mode's engine isn't built yet; nothing reads this key until it is — bazookarp/SPEC.md §4.1,
// drawn for Alpha's attack on Bravo's half). noRest: an 8-gon (r 2.5) round every pipe end's approach and landing point
// on Bravo's half and mid (the twins cover Alpha's).
const oct8 = ([x, , z], r = 2.5) => Array.from({ length: 8 }, (_, i) => [r3(x + r * Math.cos((i * Math.PI) / 4)), r3(z + r * Math.sin((i * Math.PI) / 4))]);
const NO_REST = [];
for (const leg of allLegs(PIPES)) for (const e of endsOf(leg)) for (const p of [e.approach, e.land]) if (p[2] >= -0.01) NO_REST.push({ poly: oct8(p), y0: r3(p[1] - 0.5), y1: r3(p[1] + 4), why: `${leg.id} ${e.k ? 'B' : 'A'}` });
const BAZOOKARP = {
  start: [0, 2.4, 0],                       // the Pond: on the Glass Walk's centre, raised like S1 Blackbelly's tower
  weirs: [{ at: [0, 0, 28.0], yaw: 0 }],    // inside the North Arch hall, 6.5 m past the bubble column
  gate: { at: [-8.54, 0, 55.28], yaw: -20 },// the North plaza, a level below the spawn deck, 12.6 m from the pad
  freeZones: [                              // Bravo's own (turned: Alpha's)
    { poly: [[-1.64, 67.35], [-29.36, 51.35], [-34.36, 60.01], [-29.76, 64.05], [-21.5, 69.74], [-12.44, 74.05], [-6.64, 76.01]], y0: 2.9, y1: 6,
      signs: [[-32.06, 59.02, 150], [-6.94, 73.52, 150]] },          // the spawn deck and its stair landings
    { poly: [[31.95, 1.86], [31.53, 3.04], [30.9, 4.13], [30.09, 5.09], [29.13, 5.9], [28.04, 6.53], [26.86, 6.95], [26.19, 4.44], [26.94, 4.17], [27.64, 3.77], [28.25, 3.25], [28.77, 2.64], [29.17, 1.94], [29.44, 1.19]],
      y0: 3.1, y1: 6, signs: [[26.53, 5.7, -75]] },                   // the E Kelp Balcony (on Bravo's half)
    { poly: [[8.22, 52.26], [3.89, 49.76], [-0.11, 56.69], [4.22, 59.19]], y0: 1.9, y1: 5,
      signs: [[6.26, 50.66, 150], [1.55, 53.02, -120]] },              // Bravo's Penguin upper rock
  ],
  routes: {
    centre:   [[0, 2.4, 0], [0, 10], [3.2, 21.5], [0, 28], [-1.8, 31], [-1.8, 48.8], [-8.5, 55.3]],   // (3.2: the east lane's middle past the Ø 2.4 column)
    arcade:   [[0, 2.4, 0], [-16, 16], [-8.8, 19.2], [0, 28]],
    pumphall: [[0, 28], [-10, 37.8], [-14.8, 39.8], [-13.2, 50.8], [-8.5, 55.3]],
    rocks:    [[0, 28], [9.8, 40.8], [4.8, 42.2], [-8.5, 55.3]],
  },
  noRest: NO_REST,
};

const LAYOUT_AQUARIUM = {
  id: 'aquarium',
  bounds: { minX: -36, maxX: 36, minZ: -78, maxZ: 78 },
  spawnPads: [PAD, [-PAD[0], PAD[1], -PAD[2]]],
  spawnBarrier: 4.2,
  env: { backdrop: (kit) => buildBackdrop(kit, { glass: ALL().filter((d) => d.tag && d.hidden && !d.rail), tank: TANK }), edge: 'none', boats: false, buoys: false },
  single: SINGLE,
  half: HALF,
  zones: ZONES,
  tower: TOWER,
  pipes: PIPES,
  bazookarp: BAZOOKARP,
  boss: { floorY: 0 },
  intro: { from: [24, 16, 18], lookFrom: [0, 13, 0], toBack: 3.0 },
  art: { from: [40, 26, -58], look: [0, 4, -6], fov: 56 },
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = LAYOUT_AQUARIUM;
export const GEO = { FL, C0, EK, WK, TANK, PY, PR, SP, DR, back };
