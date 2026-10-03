// Highmark Foundry — the plan as data: DESIGN.md §2.3's helpers and every curved outline of Alpha's half (Bravo's is
// the 180° turn), shared by layout.js (the pieces), lava.js (the region) and props.js (the looks). Pure data and plain
// helpers: importable in Node (check-maps) and in the game.
//
// Conventions (DESIGN.md): x right (east), +z toward Bravo. θ in degrees from +x toward +z. P(r, θ) is the point at
// radius r and angle θ. Alpha spawns at −z. Tiers: 0 ledges (drown) · 1.2 quays, island, causeways, Slump heads · 1.8
// Pour Floor and Moorings · 2.4 terrace, Ladle Road, horn tips · 3.0 pit and casting bed · 3.6 yard, Rim Head, Rim Ridge
// · 4.8 spawn gallery. The lava: LOW −0.6, HIGH +0.8.
export const D = Math.PI / 180;
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const P = (r, a) => [r3(r * Math.cos(a * D)), r3(r * Math.sin(a * D))];
export const arcN = (a0, a1, step) => Math.max(2, Math.floor(Math.abs(a1 - a0) / step) + 1);
export const arc = (r, a0, a1, step = 2.5) => { const n = arcN(a0, a1, step); return Array.from({ length: n }, (_, i) => P(r, a0 + ((a1 - a0) * i) / (n - 1))); };
export const rot = ([x, z]) => [-x, -z];
export const rotPoly = (poly) => poly.map(rot);

// Alpha's Spillway: s along the channel (outward, θ −48), t across it (+t toward Bravo's horn tip, θ 42)
export const SD = [Math.cos(-48 * D), Math.sin(-48 * D)], SN = [Math.cos(42 * D), Math.sin(42 * D)];
export const ch = (s, t) => [r3(s * SD[0] + t * SN[0]), r3(s * SD[1] + t * SN[1])];
export const HW = 5.5, S_MOUTH = 22.3, S_LIP = 34.0, S_R30 = Math.sqrt(30 ** 2 - HW ** 2);
// Alpha's Slump stone line: from the south head (S0) to the north head (S1)
export const S0 = P(23.5, -143.5), S1 = P(23.5, -178.5);
export const U = [-0.32555, 0.94552], V = [0.94552, 0.32555];
export const sp = (b, a, c) => [r3(b[0] + U[0] * a + V[0] * c), r3(b[1] + U[1] * a + V[1] * c)];
export const FACE = 1.9;
export const SA0 = -145.5, SA1 = -176.5;          // the Slump shelf's south and north ends (θ)
export const SH_IN = 27.0, SH_OUT = 31.5;         // the shelf, r

// ---------------------------------------------------------------------------------------------- arcs with features
// An arc as a point list (a0 → a1, step 2.5°), with features spliced in: each { a: [lo, hi] (degrees, lo < hi), pts }
// replaces the arc's points strictly between lo and hi by `pts` (given in increasing-angle order). Built in increasing
// angle order and reversed when a1 < a0, so two pieces sharing an arc in opposite directions get identical points.
export function arcF(r, a0, a1, feats = [], step = 2.5) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), n = arcN(lo, hi, step);
  let pts = Array.from({ length: n }, (_, i) => { const a = lo + ((hi - lo) * i) / (n - 1); return { a, p: P(r, a) }; });
  for (const f of feats) {
    const keep = pts.filter((q) => q.a <= f.a[0] + 1e-9 || q.a >= f.a[1] - 1e-9);
    const at = keep.findIndex((q) => q.a >= f.a[1] - 1e-9);
    const ins = f.pts.map((p) => ({ a: f.a[0], p }));
    pts = at < 0 ? [...keep, ...ins] : [...keep.slice(0, at), ...ins, ...keep.slice(at)];
  }
  const out = pts.map((q) => q.p);
  return a1 < a0 ? out.reverse() : out;
}
const angOf = (x, z) => Math.atan2(z, x) / D;
// a straight chord across an arc on the south side (z < 0), square to z, from x = xa to x = xb at z = zc: where the
// tower's track climbs a curved face (the platform never turns, so the face it climbs must be square to the run)
function chordS(r, xa, xb, zc) {
  const za = -Math.sqrt(r * r - xa * xa), zb = -Math.sqrt(r * r - xb * xb);
  const aa = angOf(xa, za), ab = angOf(xb, zb), lo = Math.min(aa, ab), hi = Math.max(aa, ab);
  const pts = [[r3(xa), r3(za)], [r3(xa), r3(zc)], [r3(xb), r3(zc)], [r3(xb), r3(zb)]];
  return { a: [lo, hi], pts: aa < ab ? pts : pts.reverse() };
}
// The two tower climbs on Alpha's half (Bravo's track, the turn of TOWER's): the terrace face (r 30) at x 3.5 and the
// yard face (r 39) at x −13. Each is a 3.0–3.2 m chord square to the run, 0.15 / 0.5 m off the arc at most.
export const CHORD30 = chordS(30, 2.0, 5.0, -Math.sqrt(900 - 3.5 * 3.5));
export const CHORD39 = chordS(39, -14.6, -11.4, -Math.sqrt(1521 - 13 * 13));
// the bastion: the yard's balcony out over the terrace (sector r 35.5 → 39, θ −123 → −116)
export const BASTION = { a: [-123, -116], pts: [P(39, -123), P(35.5, -123), ...arc(35.5, -123, -116, 2).slice(1, -1), P(35.5, -116), P(39, -116)] };
export const R30 = (a0, a1) => arcF(30, a0, a1, [CHORD30]);
export const R39 = (a0, a1) => arcF(39, a0, a1, [CHORD39, BASTION]);

// ---------------------------------------------------------------------------------------------- the Organ Pipes
export const ORG = { L: [-10, -12.8, 2.5], B: [-10, -9.14, 1.5], A: [-10, -6.34, 1.5] };      // Alpha's cluster (x, z, r)
export const POSE = { L: [2.3, 4.65], B: [1.8, 3.5], A: [1.4, 2.35] };                        // tops at LOW, HIGH
export const DEPTH = { L: 4.2, B: 3.7, A: 3.3 };
// the notch round Bravo's cluster (DESIGN.md: every point 0.15 m off a column flat)
const NOTCH_B = [[12.63, 12.73], [11.38, 10.56], [11.25, 10.48], [10.88, 10.51], [11.63, 9.21], [11.63, 9.06], [10.88, 7.76],
  [10.88, 7.71], [11.63, 6.41], [11.63, 6.26], [10.88, 4.96], [10.75, 4.89], [9.25, 4.89], [9.12, 4.96], [8.37, 6.26], [8.37, 6.41],
  [9.12, 7.71], [9.12, 7.76], [8.37, 9.06], [8.37, 9.21], [9.12, 10.51], [8.75, 10.48], [8.62, 10.56], [7.37, 12.73]];
export const NOTCH_EDGES = [...NOTCH_B, ...rotPoly(NOTCH_B)];

// ---------------------------------------------------------------------------------------------- the floors (Alpha's half)
// Gauge Island (single, self-symmetric: 70 vertices)
const ISLAND_E = [[0, -11.5], [5, -11.5], [7.8, -10.9], [10.4, -9.2], [12.3, -7.4], [13.5, -7.9], [13.5, -2.0], [14.1, 1.0], [13.7, 4.4], [12.7, 7.6]];
const ISLAND_HALF = [...ISLAND_E, ...NOTCH_B, [5, 11.5]];
export const ISLAND = [...ISLAND_HALF, ...rotPoly(ISLAND_HALF)];

// the yard (3.6) with the Rim Head (3.6) joined flat to it (one polygon: DESIGN.md §2.3 "fill it once"), the weighbridge pit
// cut out of it through a slit along x −14.4 (a hole the column fill reads as two coincident axial edges), the gallery's
// notch, the bastion out over the terrace, and the tower chord on its front
const PIT = { x0: -14.4, x1: -2.6, z0: -52, z1: -48 };        // the sunken weighbridge plate (3.0) and its two ramps
export { PIT };
export const RIMHEAD_OUT = [P(30.5, -126), P(31.5, -133), P(SH_OUT, SA0), P(36, -148.5), P(41, -143), P(44.5, -136), [-34, -35.5], [-31.5, -41], [-27.5, -44]];
export const YARD = [
  ...R39(-63, -126),
  ...RIMHEAD_OUT,
  [-27.5, -47], [-24, -54], [-20.5, -58], [-16, -60.5], [-16, -66],
  [PIT.x0, -66], [PIT.x0, PIT.z0], [PIT.x0, PIT.z1], [PIT.x1, PIT.z1], [PIT.x1, PIT.z0], [PIT.x0, PIT.z0], [PIT.x0, -66],
  [-10, -66], [-10, -57.5], [10, -57.5], [10, -66], [16, -66], [16, -60], [17.5, -54], [18, -47], [18, -40],
];
// the Moulding Terrace (2.4): r 30 → 39, θ −126 → −58.6, its east end along the channel the Spillway Quay
export const TERRACE = [...R30(-126, -58.6).slice(0, -1), ch(S_R30, -HW), ch(S_LIP, -HW), ...R39(-63, -126)];
// the Lakefront (1.2) with the south Slump head (its west end: the tip face square to the stone line)
export const TIP_S = [sp(S0, 0, -FACE), sp(S0, 0, FACE)];          // outer, inner (lake) corner
export const TIP_N = [sp(S1, 0, -FACE), sp(S1, 0, FACE)];
export const LAKEFRONT = [
  ch(S_MOUTH, -HW), ch(S_R30, -HW), ...R30(-58.6, -126).slice(1),
  P(30.5, -126), P(31.5, -133), P(SH_OUT, SA0), TIP_S[0], TIP_S[1],
  ...arc(23, -137, -100.1), [-4, -22.65], [4, -22.65], ...arc(23, -79.9, -61.9),
];
// the Pumice Moorings (1.8, on the Lakefront): Alpha's side zone. Its outer corner lies on the Rim Head's face.
const RH_FACE_134 = (() => {   // the Rim Head's face P(31.5, −133) → P(31.5, −145.5) at θ −134
  const [ax, az] = P(31.5, -133), [bx, bz] = P(SH_OUT, SA0), u = [Math.cos(-134 * D), Math.sin(-134 * D)];
  const dx = bx - ax, dz = bz - az, t = (ax * u[1] - az * u[0]) / (dz * u[0] - dx * u[1]);
  return [r3(ax + dx * t), r3(az + dz * t)];
})();
export const MOORINGS = [...arc(23.6, -106, -134, 2), RH_FACE_134, P(31.5, -133), P(30.5, -126), ...R30(-126, -106)];
// the ledges at 0 east of the causeway: the Casting Floor and the Spillway's floor, one polygon (both at 0, joined along
// half the Spillway's mouth)
export const LEDGE_E = [
  [4, -22.65], ...arc(23, -79.9, -61.9).slice(1), ch(S_MOUTH, -HW), ch(S_LIP, -HW), ch(S_LIP, HW), ch(S_MOUTH, HW), ch(S_MOUTH, 0),
  [12.3, -7.4], [10.4, -9.2], [7.8, -10.9], [5, -11.5], [4, -11.5],
];
export const CASTING_FLOOR = [[4, -22.65], ...arc(23, -79.9, -61.9).slice(1), ch(S_MOUTH, -HW), ch(S_MOUTH, 0), [12.3, -7.4], [10.4, -9.2], [7.8, -10.9], [5, -11.5], [4, -11.5]];
export const SPILLWAY = [ch(S_MOUTH, -HW), ch(S_LIP, -HW), ch(S_LIP, HW), ch(S_MOUTH, HW)];
// the Slump shelf (0): the flank that drowns. Its south end lies on the south head's west face.
const SHELF_S_IN = (() => {   // where the head's face P(31.5, SA0) → TIP_S[0] crosses r 27
  const [ax, az] = P(SH_OUT, SA0), [bx, bz] = TIP_S[0], dx = bx - ax, dz = bz - az;
  const A = dx * dx + dz * dz, Bq = 2 * (ax * dx + az * dz), Cq = ax * ax + az * az - SH_IN * SH_IN;
  const t = (-Bq - Math.sqrt(Bq * Bq - 4 * A * Cq)) / (2 * A);
  return [r3(ax + dx * t), r3(az + dz * t)];
})();
export const SHELF = [SHELF_S_IN, P(SH_OUT, SA0), ...arc(SH_OUT, SA0 - 2.5, SA1 + 2.5), P(SH_OUT, SA1), P(SH_IN, SA1), ...arc(SH_IN, SA1 + 2.5, SA0 - 2.5)];
// the north Slump head (1.2)
export const NORTH_HEAD = [TIP_N[0], P(SH_IN, SA1), P(SH_OUT, SA1), P(30.5, 178), P(21, 178), TIP_N[1]];
// the Ladle Road (2.4) joined flat to the horn tip (2.4): Alpha's tail along Bravo's Spillway (z > 0)
export const HORN_LADLE = [
  ch(-27, -HW), ch(-S_LIP, -HW), P(31, 144.5), P(30.5, 149), P(29.5, 153), P(28, 156), P(26, 157.5),
  ...arc(26, 157.5, 178).slice(1), P(21, 178), ...arc(21, 178, 157.5).slice(1),
  ...arc(21, 155, 150), P(21.3, 149), ch(-27, -8),
];
// the Horn Step (1.2): a shelf along the horn's channel face (channel 0 → step 1.2 → tip 2.4)
export const HORN_STEP = [ch(-S_MOUTH, -HW), ch(-27, -HW), ch(-27, -8), P(21.3, 149), P(21.6, 148)];
// the Rim Ridge (3.6) over the Ladle Road
export const RIDGE = [...arc(26, 158, 178), P(30.5, 178), P(31, 172), P(30, 166), P(28.2, 161)];
export const CASTING_BED = [...arc(36.2, -74, -80, 2), ...arc(33, -80, -74, 2)];

// ---------------------------------------------------------------------------------------------- the edges E2–E8 (walls)
// polylines of the outer edge of walkable floor (Alpha's half); each segment gets a caldera-wall O-box laid outside it
export const EDGES = [
  { id: 'E2', pts: [[-16, -66], [-16, -60.5], [-20.5, -58], [-24, -54], [-27.5, -47], [-27.5, -44], [-31.5, -41], [-34, -35.5], P(44.5, -136), P(41, -143), P(36, -148.5)], t: 1.5, top: 7.0, y0: 0 },
  { id: 'E3', pts: [...arc(SH_OUT, SA0, SA1), P(30.5, 178)], t: 1.5, top: 7.0, y0: -1.1, cliff: true },
  { id: 'E4r', pts: [P(30.5, 178), P(31, 172), P(30, 166), P(28.2, 161), P(26, 158), P(26, 157.5)], t: 1.2, top: 6.6, y0: 0 },
  { id: 'E4h', pts: [P(26, 157.5), P(28, 156), P(29.5, 153), P(30.5, 149), P(31, 144.5), ch(-S_LIP, -HW)], t: 1.2, top: 5.4, y0: -1.1 },
  { id: 'E8', pts: [P(39, -63), [18, -40], [18, -47], [17.5, -54], [16, -60], [16, -66]], t: 1.5, top: 7.0, y0: 0 },
];
// E7: the charging shed closes the corner between the Spillway Quay and the yard
export const SHED_LINE = [ch(S_LIP, -HW), P(39, -63)];

// ---------------------------------------------------------------------------------------------- the stones (Pumice Race)
// [cx, cz, across, along] (DESIGN.md §2.3; the zig-zag offsets are already in the centres); engine yaw −19.0°
export const STONES = [[-18.94, -12.46, 2.6, 2.4], [-20.70, -10.11, 2.3, 2.7], [-20.82, -7.13, 2.8, 2.5], [-22.54, -4.76, 2.4, 2.6], [-22.59, -1.86, 2.6, 2.43]];
export const STONE_YAW = -19.0;

// ---------------------------------------------------------------------------------------------- the lava region
// the lake: one self-symmetric outline (0.5 m into every bank), then the two bays of each half (ENGINE.md §3.3)
const LAKE_HALF = [
  ...arc(23.5, -90, -62.6), ch(Math.sqrt(23.5 ** 2 - 6 ** 2), -6), ch(S_MOUTH, 0),
  ...[P(22.1, 148), P(21.5, 150), ...arc(21.5, 152.5, 177.5), sp(S1, 0.5, FACE), sp(S1, 0.5, -FACE), sp(S0, -0.5, -FACE), sp(S0, -0.5, FACE),
    ...arc(23.5, -137, -92.5)].map(rot),
];
export const LAKE = [...LAKE_HALF, ...rotPoly(LAKE_HALF)];
export const SPILL = [ch(S_MOUTH - 1.5, -6), ch(S_LIP, -6), ch(S_LIP, 6), ch(S_MOUTH - 1.5, 6)];
export const SLUMP = [sp(S0, -0.5, FACE), sp(S0, -0.5, -FACE), P(32, -144.4), ...arc(32, -147, -175), P(32, -177.6), sp(S1, 0.5, -FACE), sp(S1, 0.5, FACE)];
export const CHUTE = [ch(S_LIP, -6), ch(S_LIP + 12, -7), ch(S_LIP + 12, 7), ch(S_LIP, 6)];
// every region polygon, both halves (for the placeholder lava surface and the checks)
export const REGION_ALL = [LAKE, SPILL, SLUMP, rotPoly(SPILL), rotPoly(SLUMP)];

// ---------------------------------------------------------------------------------------------- polygon utilities
export const area2 = (Pl) => { let a = 0; for (let i = 0; i < Pl.length; i++) { const [x0, z0] = Pl[i], [x1, z1] = Pl[(i + 1) % Pl.length]; a += x0 * z1 - x1 * z0; } return a; };
export function inPoly(Pl, x, z) {
  let c = false;
  for (let i = 0, j = Pl.length - 1; i < Pl.length; j = i++) {
    const [xi, zi] = Pl[i], [xj, zj] = Pl[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi) c = !c;
  }
  return c;
}
