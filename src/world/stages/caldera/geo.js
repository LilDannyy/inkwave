// Highmark Foundry — the plan as data: DESIGN.md §2.3's helpers and every curved outline of Alpha's half (Bravo's is
// the 180° turn), shared by layout.js (the pieces), lava.js (the region) and props.js (the looks). Pure data and plain
// helpers: importable in Node (check-maps) and in the game.
//
// Conventions (DESIGN.md): x right (east), +z toward Bravo. θ in degrees from +x toward +z. P(r, θ) is the point at
// radius r and angle θ. Alpha spawns at −z. Tiers: 0 ledges (drown) · 1.2 quays, island, causeways, Slump heads · 1.8
// Pour Floor and Moorings · 2.4 terrace, Ladle Road, horn tips · 3.0 pit and casting bed · 3.6 yard, Rim Head, Rim Ridge
// · 4.8 spawn gallery. The lava: LOW −0.6, HIGH +0.8.
//
// FIX ROUND 2 — the plan is redrawn as two interlocking commas (the review: "concentric rings between two rectangular
// base ends"). Each half is one comma whose outer edge is a single spiral: it is deepest behind the spawn gallery's
// east end, sweeps clockwise round the turned Casting Hall, the yard's west side and the Rim Head (r 44.5), bites in at
// the Slump (cliff r 31.5 → 31.0) and tapers along the Rim Ridge (31 → 27) to the horn's point (r ≤ 24.5) at the
// enemy's Spillway mouth. Inside it, the base's tier fronts are spirals too, not arcs round the island: they rise
// from the Spillway side to the Rim Head side (terrace front r 27.5 → 34, yard front r 34.4 → 43), so the Lakefront
// and the terrace are wedges that fatten toward the comma's root. The spawn gallery and its hall are turned 12° about
// the pad toward the Rim Head, the hall's front, the side yards' backs and the yard's east side are the head's curve.
export const D = Math.PI / 180;
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const P = (r, a) => [r3(r * Math.cos(a * D)), r3(r * Math.sin(a * D))];
export const arcN = (a0, a1, step) => Math.max(2, Math.floor(Math.abs(a1 - a0) / step) + 1);
export const arc = (r, a0, a1, step = 2.5) => { const n = arcN(a0, a1, step); return Array.from({ length: n }, (_, i) => P(r, a0 + ((a1 - a0) * i) / (n - 1))); };
export const rot = ([x, z]) => [-x, -z];
export const rotPoly = (poly) => poly.map(rot);
export const angOf = (x, z) => Math.atan2(z, x) / D;

// Alpha's Spillway: s along the channel (outward, θ −48), t across it (+t toward Bravo's horn tip, θ 42)
export const SD = [Math.cos(-48 * D), Math.sin(-48 * D)], SN = [Math.cos(42 * D), Math.sin(42 * D)];
export const ch = (s, t) => [r3(s * SD[0] + t * SN[0]), r3(s * SD[1] + t * SN[1])];
export const toCh = ([x, z]) => [x * SD[0] + z * SD[1], x * SN[0] + z * SN[1]];
export const HW = 5.5, S_MOUTH = 22.3, S_LIP = 34.0;
// Alpha's Slump stone line: from the south head (S0) to the north head (S1)
export const S0 = P(23.5, -143.5), S1 = P(23.5, -178.5);
export const U = [-0.32555, 0.94552], V = [0.94552, 0.32555];
export const sp = (b, a, c) => [r3(b[0] + U[0] * a + V[0] * c), r3(b[1] + U[1] * a + V[1] * c)];
export const FACE = 1.9;
export const SA0 = -145.5, SA1 = -176.5;          // the Slump shelf's south and north ends (θ)

// ---------------------------------------------------------------------------------------------- the spirals
// (fix round 2) the base's tier fronts: radius linear in θ from TE (the Spillway side: the quay's outer corner at the lip)
// to TW (the Rim Head side), clamped beyond. The yard front starts exactly at the lip corner.
export const LIP_C = ch(S_LIP, -HW);
export const TE = Math.atan2(LIP_C[1], LIP_C[0]) / D, TW = -130;
const lin = (r0, r1) => (a) => r0 + (r1 - r0) * Math.max(0, Math.min(1, (a - TE) / (TW - TE)));
// the shore (the Lakefront's lake edge): r 23 from the Spillway's mouth along the causeway's foot (the weir and the
// causeway keep their places), widening west of θ −98 to 27.6 at the Moorings, so each half's pool is fat on its Rim
// Head side and thin toward its Casting Floor: at LOW the lava reads as two commas turning round the island, each
// with its head in a West Pool and the Slump bay and its tail running out through the other works' Spillway fan
export const RS = (a) => (a >= -98 ? 23 : 23 + (27.6 - 23) * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, (a + 98) / -32))));
export const RT = lin(27.5, 34.0);                         // the terrace front (the Lakefront's back): 6.5 m of spiral
export const RY = lin(Math.hypot(LIP_C[0], LIP_C[1]), 43.0);   // the yard front (the terrace's back): 8.6 m
export const SP = (f, a) => P(f(a), a);
// a spiral as points a0 → a1 (step 2.5°) with features spliced in: { a: [lo, hi], pts } replaces the points strictly
// between lo and hi by `pts` (given in increasing-angle order); built increasing and reversed when a1 < a0, so two
// pieces sharing a front in opposite directions get identical points
export function sarcF(f, a0, a1, feats = [], step = 2.5) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), n = arcN(lo, hi, step);
  let pts = Array.from({ length: n }, (_, i) => { const a = lo + ((hi - lo) * i) / (n - 1); return { a, p: SP(f, a) }; });
  for (const ft of feats) {
    if (ft.a[1] <= lo + 1e-9 || ft.a[0] >= hi - 1e-9) continue;
    const keep = pts.filter((q) => q.a <= ft.a[0] + 1e-9 || q.a >= ft.a[1] - 1e-9);
    const at = keep.findIndex((q) => q.a >= ft.a[1] - 1e-9);
    const ins = ft.pts.map((p) => ({ a: ft.a[0], p }));
    pts = at < 0 ? [...keep, ...ins] : [...keep.slice(0, at), ...ins, ...keep.slice(at)];
  }
  const out = pts.map((q) => q.p);
  return a1 < a0 ? out.reverse() : out;
}
export const arcF = (r, a0, a1, feats = [], step = 2.5) => sarcF(() => r, a0, a1, feats, step);
// θ where spiral f crosses x = xa on the south side (z < 0)
export function thetaAtX(f, xa) {
  let lo = -179, hi = -1;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) * Math.cos(m * D) < xa) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// a straight chord square to z across spiral f, from x = xa to xb, flush with the front at its west end (no jog there:
// fix round 2, a jog beside the Lower Surge Steps made a nook bots wedged in) and stepping back to the front at the east
export function chordZ(f, xa, xb) {
  const aa = thetaAtX(f, xa), ab = thetaAtX(f, xb), pa = SP(f, aa), pb = SP(f, ab), zc = Math.min(pa[1], pb[1]);
  const pts = [[r3(xa), r3(pa[1])], [r3(xa), r3(zc)], [r3(xb), r3(zc)], [r3(xb), r3(pb[1])]].filter((p, i, A) => i === 0 || Math.hypot(p[0] - A[i - 1][0], p[1] - A[i - 1][1]) > 0.01);
  const lo = Math.min(aa, ab), hi = Math.max(aa, ab);
  return { a: [lo, hi], pts: aa < ab ? pts : pts.reverse(), zc: r3(zc), x: [xa, xb] };
}
// a straight chord across spiral f between θa and θb (a stair's top edge): its points, its centre and inward normal
export function chordA(f, a0, a1) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), pa = SP(f, lo), pb = SP(f, hi);
  const mx = (pa[0] + pb[0]) / 2, mz = (pa[1] + pb[1]) / 2, L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
  let nx = -(pb[1] - pa[1]) / L, nz = (pb[0] - pa[0]) / L; if (nx * mx + nz * mz > 0) { nx = -nx; nz = -nz; }   // toward the island
  return { a: [lo, hi], pts: [pa, pb], mid: [mx, mz], n: [nx, nz], len: L };
}

// ---------------------------------------------------------------------------------------------- the spawn complex
// (fix round 2) the gallery, its stairs and the Casting Hall are turned SWING° about the pad (toward the Rim Head:
// the hall's west end comes forward, its east end goes back), so the base's back is part of the comma's spiral
export const PAD = [0, -64.5], SWING = -12;
const cS = Math.cos(SWING * D), sS = Math.sin(SWING * D);
export const sw = ([x, z]) => { const dx = x - PAD[0], dz = z - PAD[1]; return [r3(PAD[0] + dx * cS - dz * sS), r3(PAD[1] + dx * sS + dz * cS)]; };
export const swDir = ([x, z]) => [x * cS - z * sS, x * sS + z * cS];

// ---------------------------------------------------------------------------------------------- the comma's outer edge
// polar control points (θ, r) of the outer edge of Alpha's head, from the lip corner clockwise to the Rim Head's crest;
// r rises round the head's east cheek to its deepest point behind the gallery's east end, then falls all the way
const HEAD_CTL = [[TE, Math.hypot(LIP_C[0], LIP_C[1])], [-60.5, 41.5], [-64, 49.5], [-68.5, 57.5], [-73.5, 64.5], [-78.5, 69.2], [-84, 72.0],
  [-91, 71.4], [-98, 69.0], [-104, 65.5], [-110, 61.0], [-116, 56.2], [-122, 51.6], [-128, 47.6], [-133, 45.4], [-136, 44.5]];
function headR(a) {   // monotone piecewise-cubic (Fritsch–Carlson) through HEAD_CTL in θ (decreasing)
  const C = HEAD_CTL, n = C.length;
  const xs = C.map((c) => -c[0]), ys = C.map((c) => c[1]), x = -a;
  if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
  const dk = [], m = [];
  for (let i = 0; i < n - 1; i++) dk.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = dk[0]; m[n - 1] = dk[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = dk[i - 1] * dk[i] <= 0 ? 0 : (dk[i - 1] + dk[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (dk[i] === 0) { m[i] = m[i + 1] = 0; continue; } const al = m[i] / dk[i], be = m[i + 1] / dk[i], s = al * al + be * be; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * al * dk[i]; m[i + 1] = t * be * dk[i]; } }
  let i = 0; while (x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
}
export { headR };
export const HEAD = (a0, a1, step = 2) => sarcF(headR, a0, a1, [], step);

// the gallery (4.8): the rectangle x ±10, z −69 … −57.5 turned about the pad; its back is the head's curve (its sides run
// on to meet it), and the side yards beside it reach back to the same curve
export const GAL = { fl: sw([-10, -57.5]), fr: sw([10, -57.5]), bl: sw([-10, -69]), br: sw([10, -69]) };
function sideHit(f, b) {   // where the gallery's side line f → b, run on past b, meets the head curve
  const dx = b[0] - f[0], dz = b[1] - f[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  let lo = L, hi = L + 12;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, x = f[0] + ux * m, z = f[1] + uz * m; if (Math.hypot(x, z) < headR(angOf(x, z))) lo = m; else hi = m; }
  const m = (lo + hi) / 2; return [r3(f[0] + ux * m), r3(f[1] + uz * m)];
}
export const GAL_E = sideHit(GAL.fr, GAL.br), GAL_W = sideHit(GAL.fl, GAL.bl);
export const TH_GE = angOf(...GAL_E), TH_GW = angOf(...GAL_W);
const inner = (pts, a0, a1) => pts.filter((p) => { const a = angOf(p[0], p[1]); return a < Math.max(a0, a1) - 0.2 && a > Math.min(a0, a1) + 0.2; });
export const GAL_BACK = inner(HEAD(TH_GE, TH_GW, 2), TH_GE, TH_GW);   // east → west, strictly between the sides
export const GALLERY = [GAL.fl, GAL.fr, GAL_E, ...GAL_BACK, GAL_W];

// ---------------------------------------------------------------------------------------------- tier features
// the tower's two climbs on Alpha's half (Bravo's track, the turn of TOWER's): the terrace face at x 3.5 and the yard
// face at x −13, each a 3 m chord square to the run
export const CHORD_T = chordZ(RT, 2.0, 5.0);
export const CHORD_Y = chordZ(RY, -14.6, -11.4);
// stairs: a chord across the front between two angles; the stair stands on the lower tier in front of it
export const ST_LOWER = chordA(RT, -104.5, -89.6);    // the Lower Surge Steps (Lakefront → terrace), ~8 m
export const ST_EAST = chordA(RT, -71.0, -65.4);      // the East Steps (Lakefront → terrace), ~3 m
export const ST_UPPER = chordA(RY, -101.0, -95.0);    // the Upper Surge Steps (terrace → yard), ~4 m
export const ST_CUPOLA = chordA(RY, -72.7, -68.0);    // the Cupola Stair (terrace → yard), ~3 m
// the bastion: the yard's balcony out over the terrace (sector RY − 3.5 → RY, θ −123 → −116)
export const BASTION = { a: [-123, -116], pts: [SP(RY, -123), ...sarcF((a) => RY(a) - 3.5, -123, -116, [], 2), SP(RY, -116)] };
export const FRONT_T = (a0, a1) => sarcF(RT, a0, a1, [CHORD_T, ST_LOWER, ST_EAST]);
export const FRONT_Y = (a0, a1) => sarcF(RY, a0, a1, [CHORD_Y, BASTION, ST_UPPER, ST_CUPOLA]);

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

// the Rim Head's crest and its north edge: from the head curve's last point out round the crest to the Slump's corner
// (the caldera wall stands on its north edge, so from outside the Slump bites in between the crest and the cliff)
export const SH_IN = 26.9;
export const SHO = (a) => 31.5 + (31.0 - 31.5) * Math.max(0, Math.min(1, (a - SA0) / (SA1 - SA0)));   // the cliff: 31.5 → 31.0
export const SH_OUT = SHO(SA0);
export const RH_FACE = [SP(RT, -126), P(33.6, -133), P(SH_OUT, SA0)];   // the Rim Head's face down to the Lakefront (2.4 m)
// the weighbridge pit (3.0) and its two ramps, cut out of the yard through a slit along its west end (a hole the column
// fill reads as two coincident axial edges) from the head curve behind the west side yard
export const PIT = { x0: -15.4, x1: -3.6, z0: -53.2, z1: -49.2 };
const SLIT_TH = (() => { let lo = TH_GW - 30, hi = TH_GW; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (headR(m) * Math.cos(m * D) < PIT.x0) lo = m; else hi = m; } return (lo + hi) / 2; })();
const SLIT_Z = r3(headR(SLIT_TH) * Math.sin(SLIT_TH * D));
// the yard (3.6) with the Rim Head (3.6) joined flat to it: the front (spiral) from the lip corner west to θ −126, the
// Rim Head's face, its north edge and crest, the head's curve back east round the west side yard to the gallery, the
// gallery's notch, and the head's curve from the gallery round the east cheek back to the lip corner
export const YARD = [
  ...FRONT_Y(TE, -126),
  ...RH_FACE, P(38.8, -148.5), P(42.5, -141), P(44.5, -136),
  ...inner(HEAD(-136, SLIT_TH, 2), -136, SLIT_TH),
  [PIT.x0, SLIT_Z], [PIT.x0, PIT.z0], [PIT.x0, PIT.z1], [PIT.x1, PIT.z1], [PIT.x1, PIT.z0], [PIT.x0, PIT.z0], [PIT.x0, SLIT_Z],
  ...inner(HEAD(SLIT_TH, TH_GW, 2), SLIT_TH, TH_GW), GAL_W, GAL.fl, GAL.fr, GAL_E,
  ...inner(HEAD(TH_GE, TE, 2), TH_GE, TE),
];
export const RH_REGION = [SP(RY, -126), ...RH_FACE, P(38.8, -148.5), P(42.5, -141), P(44.5, -136), SP(headR, -128), [-25.4, -36.6]];
// the Moulding Terrace (2.4): between the two spirals, θ −126 → the channel; its east end along the channel the quay
export const S_T = (() => { let lo = 22, hi = 34; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, p = ch(m, -HW), r = Math.hypot(p[0], p[1]); if (r < RT(angOf(p[0], p[1]))) lo = m; else hi = m; } return (lo + hi) / 2; })();
const TH_T = angOf(...ch(S_T, -HW));
export const TERRACE = [...FRONT_T(-126, TH_T).slice(0, -1), ch(S_T, -HW), LIP_C, ...FRONT_Y(TE, -126).slice(1)];
// the Lakefront (1.2) with the south Slump head (its west end: the tip face square to the stone line)
export const TIP_S = [sp(S0, 0, -FACE), sp(S0, 0, FACE)];          // outer, inner (lake) corner
export const TIP_N = [sp(S1, 0, -FACE), sp(S1, 0, FACE)];
export const SH_M = angOf(...ch(S_MOUTH, -HW));   // the shore's east end: the Spillway mouth's corner
export const LAKEFRONT = [
  ch(S_MOUTH, -HW), ch(S_T, -HW), ...FRONT_T(TH_T, -126).slice(1),
  ...RH_FACE.slice(1), TIP_S[0], TIP_S[1],
  ...sarcF(RS, -137, -100.1), [-4, -22.65], [4, -22.65], ...sarcF(RS, -79.9, SH_M),
];
// the Pumice Moorings (1.8, on the Lakefront): Alpha's side zone, against the terrace face and the Rim Head's face
const onSeg = ([ax, az], [bx, bz], a) => {   // where the ray at θ a crosses the segment a → b
  const u = [Math.cos(a * D), Math.sin(a * D)], dx = bx - ax, dz = bz - az, t = (ax * u[1] - az * u[0]) / (dz * u[0] - dx * u[1]);
  return [r3(ax + dx * t), r3(az + dz * t)];
};
export const MOOR_A = [-106, -134];
export const MOORINGS = [...sarcF((a) => RS(a) + 0.6, MOOR_A[0], MOOR_A[1], [], 2), onSeg(RH_FACE[1], RH_FACE[2], MOOR_A[1]), RH_FACE[1], RH_FACE[0], ...FRONT_T(-126, MOOR_A[0])];
// the ledge at 0 east of the causeway: the Casting Floor (fix round 2: the Spillway has no floor any more — each Spillway
// is a permanent lava fan from the mouth to its lip, so the breach splits the comma from the other works at both levels)
export const CASTING_FLOOR = [[4, -22.65], ...sarcF(RS, -79.9, SH_M).slice(1, -1), ch(S_MOUTH, -HW), ch(S_MOUTH, 0), [12.3, -7.4], [10.4, -9.2], [7.8, -10.9], [5, -11.5], [4, -11.5]];
export const LEDGE_E = CASTING_FLOOR;
// the Slump shelf (0): the flank that drowns, 4.6 → 4.1 m wide at the cliff's foot (fix round 2: the cliff back at
// r 31.5 → 31.0; DESIGN.md's 4.5 m with two hornitos against the cliff). Its south end lies on the south head's face.
const SHELF_S_IN = (() => {   // where the head's face P(SH_OUT, SA0) → TIP_S[0] crosses r SH_IN
  const [ax, az] = P(SH_OUT, SA0), [bx, bz] = TIP_S[0], dx = bx - ax, dz = bz - az;
  const A = dx * dx + dz * dz, Bq = 2 * (ax * dx + az * dz), Cq = ax * ax + az * az - SH_IN * SH_IN;
  const t = (-Bq - Math.sqrt(Bq * Bq - 4 * A * Cq)) / (2 * A);
  return [r3(ax + dx * t), r3(az + dz * t)];
})();
export const SHELF = [SHELF_S_IN, P(SH_OUT, SA0), ...sarcF(SHO, SA0 - 2.5, SA1 + 2.5).reverse().reverse(), SP(SHO, SA1), P(SH_IN, SA1), ...arc(SH_IN, SA1 + 2.5, SA0 - 2.5)];
// the tail (fix round 2: it tapers to a point): the Rim Ridge's outer edge RO from the cliff's r 31 at the north head
// to 27 at θ 158, the horn's outer edge on to 24.5 at its tip; the Ladle Road's outer edge LR between them
const lin2 = (a0, a1, r0, r1) => (a) => r0 + (r1 - r0) * Math.max(0, Math.min(1, (a - a0) / (a1 - a0)));
export const RO = (a) => (a >= 158 ? lin2(178, 158, 31.0, 27.4)(a) : lin2(158, 148.5, 27.4, 24.5)(a));
export const LR = lin2(178, 158, 25.8, 24.8);
// the north Slump head (1.2)
export const NH_Z = TIP_N[1][1], NH_X = -22.1, NH_TIP = [NH_X, r3(TIP_N[1][1] + (NH_X - TIP_N[1][0]) * (TIP_N[1][1] - TIP_N[0][1]) / (TIP_N[1][0] - TIP_N[0][0]))];
const xAtZ = (f, z) => { let lo = 150, hi = 180; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (f(m) * Math.sin(m * D) > z) lo = m; else hi = m; } return r3(f((lo + hi) / 2) * Math.cos(((lo + hi) / 2) * D)); };
export const RO_NH = xAtZ(RO, NH_Z), LR_NH = xAtZ(LR, NH_Z);
const thAtZ = (f, z) => { let lo = 150, hi = 180; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (f(m) * Math.sin(m * D) > z) lo = m; else hi = m; } return (lo + hi) / 2; };
export const TH_RO_NH = thAtZ(RO, NH_Z), TH_LR_NH = thAtZ(LR, NH_Z);
export const NORTH_HEAD = [TIP_N[0], P(SH_IN, SA1), SP(SHO, SA1), [RO_NH, NH_Z], [NH_X, NH_Z], NH_TIP];
// the horn's tip (Alpha's, on Bravo's Spillway): the Spillway Bridge (Bravo's, the turn of Alpha's) lands on its end
// face. Alpha's bridge runs diagonally from Alpha's quay (ch s 31.2, t −6.3) to Bravo's horn tip (s 22.3, t 6.1) at the
// channel's mouth, 3 m wide: the tip stays inside r 25 (the review: no r 34 hook round a landing pad)
export const SBR = { a: [31.2, -6.3], b: [22.3, 6.1], w: 3.0 };
export const SB_DIR = (() => { const dx = SBR.b[0] - SBR.a[0], dt = SBR.b[1] - SBR.a[1], L = Math.hypot(dx, dt); return [dx / L, dt / L, L]; })();
const bEnd = (c, ext) => { const [ux, ut] = SB_DIR, ex = -ut, et = ux; return [[c[0] + ux * ext + ex * SBR.w / 2, c[1] + ut * ext + et * SBR.w / 2], [c[0] + ux * ext - ex * SBR.w / 2, c[1] + ut * ext - et * SBR.w / 2]]; };
// Bravo's horn tip face (in Alpha's ch frame): p toward the outside (larger t), q toward the lake
export const TIPF_CH = (() => { const e = bEnd(SBR.b, 0); return e[0][1] > e[1][1] ? { p: e[0], q: e[1] } : { p: e[1], q: e[0] }; })();
export const QUAYF_CH = bEnd(SBR.a, 0);
const chA = (s, t) => rot(ch(s, t));   // Alpha's horn lives on Bravo's channel: the turn of Alpha's ch frame
export const TIP_P = chA(...TIPF_CH.p), TIP_Q = chA(...TIPF_CH.q);
export const TH_TIP = angOf(...TIP_P), TH_TIPQ = angOf(...TIP_Q);
// the lip of Bravo's Spillway on Alpha's side (the wall's outer end) and, turned, Alpha's lip's far corner
export const LIP_N_A = P(Math.hypot(LIP_C[0], LIP_C[1]), TH_TIP), LIP_N = rot(LIP_N_A);
// Alpha's horn and Ladle Road (2.4), one polygon: the tip face, the outer edge (RO) to θ 158, the Ridge's foot (LR) to
// the north head, the north head's hop face, the lake edge (r 21) back to the tip
export const HORN_LADLE = [
  TIP_Q, TIP_P, ...inner(sarcF(RO, TH_TIP, 158), TH_TIP, 158), SP(RO, 158), SP(LR, 158),
  ...inner(sarcF(LR, 158, TH_LR_NH), 158, TH_LR_NH), [LR_NH, NH_Z], [NH_X, NH_Z], TIP_N[1],
  ...arc(21, 178, TH_TIPQ + 1.5).filter((p) => angOf(p[0], p[1]) < 178.5),
];
// the Rim Ridge (3.6) over the Ladle Road
export const RIDGE = [SP(LR, 158), ...inner(sarcF(LR, 158, TH_LR_NH), 158, TH_LR_NH), [LR_NH, NH_Z], [RO_NH, NH_Z], ...inner(sarcF(RO, TH_RO_NH, 158), TH_RO_NH, 158), SP(RO, 158)];
export const CASTING_BED = [...sarcF((a) => RY(a) - 2.2, -74, -80, [], 2), ...sarcF((a) => RT(a) + 2.4, -80, -74, [], 2)];
// the casting dock (1.8, fix round 2): a loading stage against the terrace face between the Spillway's bank and the
// East Steps (θ −58.5 … −64.4, r 25.4 → the face), off the Lakefront's lake edge, so the Ladle Gantry's south end and
// the lane from it west to the weir stay open (the review: at HIGH the dock and its ladle car closed that lane)
export const CAST_DOCK = [...arc(25.4, -64.4, -59.8, 2), ...sarcF(RT, -59.8, -64.4, [], 2)];

// ---------------------------------------------------------------------------------------------- the edges E2–E8 (walls)
// polylines of the outer edge of walkable floor (Alpha's half); each segment gets a caldera-wall O-box laid outside it
export const EDGES = [
  // E8/E2: the head's curve from the lip corner round the east cheek to the gallery, and from the gallery round the west
  // side to the Rim Head's crest and its north edge, stopping square at the Slump's corner (the shelf starts there)
  { id: 'E8', pts: [LIP_C, ...inner(HEAD(TE, -74.5, 2), TE, -74.5), SP(headR, -74.5)], t: 1.5, top: 7.0, y0: 0 },
  { id: 'E2', pts: [SP(headR, -104.5), ...inner(HEAD(-104.5, -136, 2), -104.5, -136), P(44.5, -136), P(42.5, -141), P(38.8, -148.5), P(SH_OUT, SA0)], t: 1.5, top: 7.0, y0: 0, ext1: 0 },
  { id: 'E3', pts: [...sarcF(SHO, SA0, SA1), [RO_NH, NH_Z]], t: 1.5, top: 7.6, y0: -1.1, cliff: true },
  { id: 'E4r', pts: [[RO_NH, NH_Z], ...inner(sarcF(RO, TH_RO_NH, TH_TIP, [], 4), TH_RO_NH, TH_TIP), TIP_P], t: 1.2, top: 6.0, y0: 0 },
  // the breach's far side: from the horn's point straight out (radially) to the lip, so the Spillway opens as a fan
  { id: 'E4h', pts: [TIP_P, LIP_N_A], t: 1.2, top: 5.4, y0: -1.1 },
];
// the Casting Hall: a curved hall along the gallery's back and the side yards' backs (collision; props.js draws it)
export const HALL_PTS = HEAD(-74.5, -104.5, 2.5);

// ---------------------------------------------------------------------------------------------- the stones (Pumice Race)
// [cx, cz, across, along] (DESIGN.md §2.3; the zig-zag offsets are already in the centres); engine yaw −19.0°
export const STONES = [[-18.94, -12.46, 2.6, 2.4], [-20.70, -10.11, 2.3, 2.7], [-20.82, -7.13, 2.8, 2.5], [-22.54, -4.76, 2.4, 2.6], [-22.59, -1.86, 2.6, 2.43]];
export const STONE_YAW = -19.0;

// ---------------------------------------------------------------------------------------------- the lava region
// the lake: one self-symmetric outline (0.5 m into every bank), then the two bays of each half (ENGINE.md §3.3)
const LAKE_HALF = [
  ...sarcF((a) => RS(a) + 0.5, -90, -62.6), ch(Math.sqrt(22.3 ** 2 - 6 ** 2) + 0.4, -6), ch(S_MOUTH, 0),
  ...[P(21.9, 147.6), P(21.5, 150), ...arc(21.5, 152.5, 177.5), sp(S1, 0.5, FACE), sp(S1, 0.5, -FACE), sp(S0, -0.5, -FACE), sp(S0, -0.5, FACE),
    ...sarcF((a) => RS(a) + 0.5, -137, -92.5)].map(rot),
];
export const LAKE = [...LAKE_HALF, ...rotPoly(LAKE_HALF)];
// Alpha's Spillway: a fan from the mouth (0.5 m into the quay and the Lakefront on its SW side) to the lip, its NE side
// 0.5 m inside the horn's tip face and the radial wall beyond it
const TIP_FACE_B = [rot(TIP_Q), rot(TIP_P)];   // Bravo's horn tip face (in Alpha's half): lake corner, outer corner
const inset = (p, q, d) => { const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); return [-dz / L * d, dx / L * d]; };
export const SPILL = (() => {
  const w0 = TIP_FACE_B[1], w1 = LIP_N, n = inset(w0, w1, 0.5);   // the wall line, moved 0.5 m into the fan
  const f0 = TIP_FACE_B[0], f1 = TIP_FACE_B[1], m = inset(f0, f1, 0.5);
  return [ch(S_MOUTH - 1.5, -6), ch(S_LIP, -6), [r3(w1[0] - n[0]), r3(w1[1] - n[1])], [r3(w0[0] - n[0] - m[0]), r3(w0[1] - n[1] - m[1])], [r3(f0[0] - m[0]), r3(f0[1] - m[1])], ch(S_MOUTH - 1.5, 4.5)];
})();
export const SLUMP = [sp(S0, -0.5, FACE), sp(S0, -0.5, -FACE), P(SH_OUT + 0.5, -144.4), ...sarcF((a) => SHO(a) + 0.5, -147, -175), P(SHO(SA1) + 0.5, -177.6), sp(S1, 0.5, -FACE), sp(S1, 0.5, FACE)];
export const CHUTE = (() => { const a = LIP_C, b = LIP_N, out = (p, k) => [r3(p[0] * k), r3(p[1] * k)]; return [out(a, 0.985), out(a, 1.36), out(b, 1.36), out(b, 0.985)]; })();
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
