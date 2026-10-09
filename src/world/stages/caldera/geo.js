// Highmark Foundry — the plan as data: every curved outline of Alpha's half (Bravo's is the 180° turn), shared by
// layout.js (the pieces), lava.js (the region) and props.js (the looks). Pure data and plain helpers: importable in
// Node (check-maps) and in the game.
//
// Conventions (DESIGN.md): x right (east), +z toward Bravo. θ in degrees from +x toward +z. P(r, θ) is the point at
// radius r and angle θ. Alpha spawns at −z. Tiers: 0 ledges (drown) · 1.2 quays, island, causeways, Slump heads · 1.8
// Pour Floor and Moorings · 2.4 terrace, Ladle Road, horn · 3.0 pit and casting bed · 3.6 yard, Rim Head, Rim Ridge ·
// 4.8 spawn gallery. The lava: LOW −0.6, HIGH +0.8.
//
// ROUND 3 — THE SHAPE FIRST (the lead's directive: "two crescents in a pinwheel round one lava lake"). Each works is
// one comma. Its HEAD is its base, and it leans toward its own rim: Alpha's head bulges west to the Rim Head (x −35) and
// is cut back on the east, where its own Spillway runs out of the lake. Its TAIL is its rim: from the Rim Head round the
// lake's west side — bitten by the Slump — to the horn, which runs on along the other works' Spillway to a point beside
// the other base. The two SPILLWAYS are lava arms that leave the lake tangentially (Alpha's at the SE, heading SSE
// between Alpha's head and Bravo's horn; Bravo's at the NW), so the lake and its arms make a pinwheel, and each arm
// separates one comma's tail from the other comma's head. Crossings of the lava: the two causeways, the Pumice Race at
// HIGH, the Casting Floor and the Spillway ford at LOW, and one railed bridge per half (the Spillway Bridge). The tier
// fronts of each base are spirals that fatten toward the Rim Head, so the theatre faces the island from a comma.
export const D = Math.PI / 180;
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const P = (r, a) => [r3(r * Math.cos(a * D)), r3(r * Math.sin(a * D))];
export const arcN = (a0, a1, step) => Math.max(2, Math.floor(Math.abs(a1 - a0) / step) + 1);
export const arc = (r, a0, a1, step = 2.5) => { const n = arcN(a0, a1, step); return Array.from({ length: n }, (_, i) => P(r, a0 + ((a1 - a0) * i) / (n - 1))); };
export const rot = ([x, z]) => [-x, -z];
export const rotPoly = (poly) => poly.map(rot);
export const angOf = (x, z) => Math.atan2(z, x) / D;
export const radOf = (p) => Math.hypot(p[0], p[1]);
export const lin = (a0, a1, r0, r1) => (a) => r0 + (r1 - r0) * Math.max(0, Math.min(1, (a - a0) / (a1 - a0)));

// a spiral as points a0 → a1 (step 2.5°) with features spliced in: { a: [lo, hi], pts } replaces the points strictly
// between lo and hi by `pts` (given in increasing-angle order); built increasing and reversed when a1 < a0, so two
// pieces sharing a front in opposite directions get identical points
export const SP = (f, a) => P(f(a), a);
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
export function thetaAtX(f, xa, lo0 = -179, hi0 = -1) {
  let lo = lo0, hi = hi0;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) * Math.cos(m * D) < xa) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// a straight chord square to z across spiral f, from x = xa to xb, flush with the front at its west end and stepping
// back to the front at the east (no nook beside a stair)
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
// a smooth curve through control points (Catmull-Rom, centripetal enough for these gentle outlines), `k` points a span
export function smooth(C, k = 4) {
  const out = [];
  for (let i = 0; i + 1 < C.length; i++) {
    const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([r3(f(p0[0], p1[0], p2[0], p3[0])), r3(f(p0[1], p1[1], p2[1], p3[1]))]);
    }
  }
  out.push(C[C.length - 1].map(r3));
  return out;
}

// ---------------------------------------------------------------------------------------------- Alpha's Spillway
// A lava channel 9 m wide leaves the lake at the Lakefront's east end (W0 = P(23, −62)) heading SSE (θ −78), between
// Alpha's quay (its west bank) and Bravo's horn (its east bank). The Spillway Bridge crosses its throat at the mouth
// (s 3.5–9); beyond it Bravo's horn ends in a point and the channel opens into the SPILLWAY BAY, a lava bay bitten into
// the north-east of Alpha's head that pours out of the caldera over a broad lip: the void notch the outline has at the
// SE (Bravo's, the turn, at the NW). s along the arm (0 at the west bank's mouth corner), t across it (+t toward the horn).
export const AW = 4.5, AU = -78;
export const W0 = P(23, -62);
export const AU_ = [Math.cos(AU * D), Math.sin(AU * D)], AN_ = [Math.cos((AU + 90) * D), Math.sin((AU + 90) * D)];
export const AM = [W0[0] + AW * AN_[0], W0[1] + AW * AN_[1]];
export const A = (s, t) => [r3(AM[0] + s * AU_[0] + t * AN_[0]), r3(AM[1] + s * AU_[1] + t * AN_[1])];
export const toA = ([x, z]) => [(x - AM[0]) * AU_[0] + (z - AM[1]) * AU_[1], (x - AM[0]) * AN_[0] + (z - AM[1]) * AN_[1]];
export const RIM_SHORE = 21.5;
export const S_E0 = (() => { let lo = -12, hi = 0; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (radOf(A(m, AW)) < RIM_SHORE) lo = m; else hi = m; } return (lo + hi) / 2; })();
export const HS_W = 2.2;                                    // the Horn Step's width (t 4.5 → 6.7)
export const S_HS0 = (() => { let lo = -14, hi = 0; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (radOf(A(m, AW + HS_W)) < RIM_SHORE) lo = m; else hi = m; } return (lo + hi) / 2; })();
export const FORD_S1 = 3.0;                                 // the Spillway ford (LOW floor at 0): mouth → s 3
export const BR_S = [3.5, 9.0];                             // the Spillway Bridge (2.3) at the mouth: 5.5 m wide, 9 m bank to bank
export const QW = A(BR_S[0], -AW);                          // the bank where the Lakefront meets the quay (the bridge's lake edge)
export const QB = A(BR_S[1], -AW);                          // the bank at the bridge's outer edge: the bay shore starts here
export const HB = A(BR_S[1], AW);                           // the horn's corner at the bridge's outer edge
export const POINT = A(11.6, 7.4);                          // the horn's point (the Gauge Post stands on it)
// the bay shore (the head's north-east, from the bridge round the bite to the lip's west end LC), then the head's
// south-east cheek over the void down to the Casting Hall
const BAY_C = [QB, [6.0, -31.6], [0.0, -35.6], [-5.2, -41.0], [-6.6, -47.2]];
export const BAY_SHORE = smooth(BAY_C, 3);
export const YE = BAY_C[2];                                 // where the yard front leaves the bay shore (and the lip meets it)
const iBay = BAY_SHORE.findIndex((p) => Math.abs(p[0] - YE[0]) < 1e-6 && Math.abs(p[1] - YE[1]) < 1e-6);
export const LC = BAY_SHORE[BAY_SHORE.length - 1];         // the lip's west end
export const LCE = POINT;                                   // the lip's east end: the horn's point
// the lip: an arc from the horn's point round to the bay shore at YE, where the bay pours out of the caldera; past it
// the breach is void (out of play), so from above the notch is open sky, the lava a tongue pouring out of the mouth
export const LIP_LINE = smooth([POINT, [19.6, -34.2], [12.0, -37.2], [4.6, -37.6], YE], 3);

// ---------------------------------------------------------------------------------------------- the base's spirals
// shore r 23 along the Lakefront; the terrace front RT and the yard front RY rise from the bay to the Rim Head
export const RS = 23.0;                                      // the shore at the causeway's foot and east of it
// (the shore is a spiral too: r 23 from the arm to θ −100, widening smoothly to 27.5 at θ −136, so each half's lava pool
// is fat on its own Rim Head side and thin toward its Casting Floor)
export const RSF = (a) => (a >= -100 ? RS : RS + (27.5 - RS) * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, (a + 100) / -36))));
export const TQ = angOf(...QW), TL = angOf(...YE), TW = -126;
export const RT = lin(TQ, TW, radOf(QW), 36.0);            // the terrace front (the Lakefront's back): r 26.4 → 36
export const RY = lin(TL, TW, radOf(YE), 47.0);            // the yard front (the terrace's back): r 35.8 → 47

// ---------------------------------------------------------------------------------------------- the head
// the comma's head: a 40 m works leaning west toward its own rim. Pad (−17, 4.8, −62.5) (Bravo's (17, 4.8, 62.5));
// the gallery in front of the Casting Hall; the bay bites its north-east, the Rim Head bulges at its north-west
export const PADX = -17, PADZ = -62.5;
export const PAD = [PADX, PADZ];
export const GAL = { x0: PADX - 10, x1: PADX + 10, z0: PADZ - 4.5, z1: PADZ + 7 };
const CHEEK_C = [LC, [-4.6, -53.5], [-1.6, -59.0], [0.0, -63.5], [GAL.x1 + 7.5, GAL.z0]];
export const CHEEK = smooth(CHEEK_C, 3);                    // LC → the hall's east end (over the void)
export const HEAD_E = [...BAY_SHORE, ...CHEEK.slice(1)];    // QB → the hall's east end
const HEAD_W = [[GAL.x0 - 6, GAL.z0], [-36.0, -63.5], [-38.0, -57.0], [-38.6, -49.0], [-38.4, -41.0], [-37.2, -34.0], [-35.0, -28.5]];
export const HEAD_WEST = smooth(HEAD_W, 3);                 // the hall's west end → the Rim Head's crest
export const HALL_LINE = [[GAL.x1 + 7.5, GAL.z0], [GAL.x0 - 6, GAL.z0]];   // the Casting Hall's front (east → west)
// the Slump: its cliff a spiral r 29.5 → 28.5 between θ −147 and −174, a 4 m shelf at its foot
export const SA0 = -147, SA1 = -174;
export const SHO = lin(SA0, SA1, 30.5, 28.5);
export const SH_IN = 25.0;                                  // the shelf's lake edge
export const SLUMP_SW = P(SHO(SA0), SA0);                   // the cliff's south end (the Rim Head's north tip)

// ---------------------------------------------------------------------------------------------- the floors (Alpha's half)
// Gauge Island (single, self-symmetric, DESIGN.md): an irregular basalt mass with a notch round each Organ cluster; its
// east and west faces pushed out to r 16 (the second Pumice Race lands on them, square to its line at θ ∓4.5)
const NOTCH_B = [[12.63, 12.73], [11.38, 10.56], [11.25, 10.48], [10.88, 10.51], [11.63, 9.21], [11.63, 9.06], [10.88, 7.76],
  [10.88, 7.71], [11.63, 6.41], [11.63, 6.26], [10.88, 4.96], [10.75, 4.89], [9.25, 4.89], [9.12, 4.96], [8.37, 6.26], [8.37, 6.41],
  [9.12, 7.71], [9.12, 7.76], [8.37, 9.06], [8.37, 9.21], [9.12, 10.51], [8.75, 10.48], [8.62, 10.56], [7.37, 12.73]];
export const NOTCH_EDGES = [...NOTCH_B, ...rotPoly(NOTCH_B)];
export const RACE2_A = 175.5;                               // Alpha's second Race runs east along θ 175.5 (Bravo's along −4.5)
const IE = (r, dt) => { const a = (RACE2_A - 180) * D, u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]]; return [r3(u[0] * r + n[0] * dt), r3(u[1] * r + n[1] * dt)]; };
const ISLAND_E = [[0, -11.5], [5, -11.5], [7.8, -10.9], [10.4, -9.2], [12.6, -7.2], [14.4, -6.0], IE(16.2, -2.2), IE(16.2, 2.6), [15.4, 5.4], [13.6, 7.6], [12.8, 9.0]];
const ISLAND_HALF = [...ISLAND_E, ...NOTCH_B, [5, 11.5]];
export const ISLAND = [...ISLAND_HALF, ...rotPoly(ISLAND_HALF)];
export const CAUSE_Z = -Math.sqrt(RS * RS - 16);             // the causeway's foot on the shore (x ±4)

// the yard (3.6): the yard front from the bay shore west to θ −126, the Rim Head's edge, the head's west curve, the hall,
// the gallery's notch and the head's east side back to the bay shore. The Rim Head (4.2, natural rock) is its own crest
// at the yard's north-west: 0.6 over the yard, 1.8 over the terrace (the Crest Stair), walls to the Lakefront and the Slump
export const RH_FACE = [SP(RT, TW), P(RT(TW), -134), SLUMP_SW];
export const RH_YARD = HEAD_WEST[12];                        // where the Rim Head's edge meets the west curve
export const RIM_HEAD = [SP(RY, TW), ...RH_FACE, ...HEAD_WEST.slice(12).reverse()];
export const RH_REGION = RIM_HEAD;
export const ST_LOWER = chordA(RT, -100, -89);               // Lower Surge Steps (Lakefront → terrace), ~6 m
export const ST_EAST = chordA(RT, -74, -69.5);               // East Steps (Lakefront → terrace), ~2.2 m
export const ST_UPPER = chordA(RY, -110, -104);              // Upper Surge Steps (terrace → yard), ~4.3 m
export const ST_CUPOLA = chordA(RY, -95, -91);               // Bay Stair (terrace → yard, by the bay), ~2.6 m
// the tower's two climbs (Bravo's track on Alpha's half, the turn of TOWER's): a plain 1.2 m face square to the track
export const TW_X = [-8.0, -22.5];                           // the track's terrace climb (x −8) and yard climb (x −22.5)
export const CHORD_T = chordZ(RT, TW_X[0] - 1.6, TW_X[0] + 1.6);
export const CHORD_Y = chordZ(RY, TW_X[1] - 1.6, TW_X[1] + 1.6);
export const FRONT_T = (a0, a1) => sarcF(RT, a0, a1, [ST_LOWER, ST_EAST, CHORD_T], 4);
export const FRONT_Y = (a0, a1) => sarcF(RY, a0, a1, [ST_UPPER, ST_CUPOLA, CHORD_Y], 4);
// the weighbridge pit (3.0): a sunken iron plate in the yard's west lane, 0.6 m steps round it and a ramp off its east
// end; cut out of the yard through a slit along z = PIT.z1 from the head's west curve
export const PIT = { x0: -37.0, x1: -30.0, z0: -54.0, z1: -50.0 };
export const YARD = [
  ...FRONT_Y(TL, TW),
  ...(() => {   // the west curve, from the Rim Head's edge south, with the pit's slit spliced in at z = PIT.z1
    const W = HEAD_WEST.slice(0, 13).reverse(), k = W.findIndex((p) => p[1] < PIT.z1), a = W[k - 1], b = W[k];
    const xs = r3(a[0] + ((b[0] - a[0]) * (PIT.z1 - a[1])) / (b[1] - a[1]));
    const slit = [[xs, PIT.z1], [PIT.x0, PIT.z1], [PIT.x0, PIT.z0], [PIT.x1, PIT.z0], [PIT.x1, PIT.z1], [PIT.x0, PIT.z1], [xs, PIT.z1]];
    return [...W.slice(0, k), ...slit, ...W.slice(k)];
  })(),
  [GAL.x0, GAL.z0], [GAL.x0, GAL.z1], [GAL.x1, GAL.z1], [GAL.x1, GAL.z0],
  ...HEAD_E.slice(iBay).reverse().slice(0, -1),
];
export const GALLERY = [[GAL.x0, GAL.z0], [GAL.x1, GAL.z0], [GAL.x1, GAL.z1], [GAL.x0, GAL.z1]];
// the Moulding Terrace (2.4): the quay along the bank from the bridge's lake edge, round the bay shore to the yard
// front, then between the two spirals to θ −126
export const TERRACE = [QW, ...BAY_SHORE.slice(0, iBay + 1), ...FRONT_Y(TL, TW).slice(1), ...FRONT_T(TW, TQ).slice(0, -1)];
// the Lakefront (1.2) with the south Slump head (its west end: the tip face square to the stone line)
export const S0 = P(23.5, -143.5), S1 = P(23.5, -178.5);
export const U = [-0.32555, 0.94552], V = [0.94552, 0.32555];
export const sp = (b, a, c) => [r3(b[0] + U[0] * a + V[0] * c), r3(b[1] + U[1] * a + V[1] * c)];
export const FACE = 1.9;
export const TIP_S = [sp(S0, 0, -FACE), sp(S0, 0, FACE)];
export const TIP_N = [sp(S1, 0, -FACE), sp(S1, 0, FACE)];
export const SHELF_S = [P(SH_IN, SA0), SLUMP_SW];            // the shelf's south edge (lake → cliff)
export const LAKEFRONT = [
  W0, QW, ...FRONT_T(TQ, TW).slice(1), RH_FACE[1], SLUMP_SW, SHELF_S[0], TIP_S[0], TIP_S[1],
  ...sarcF(RSF, -132, -100.1), [-4, r3(CAUSE_Z)], [4, r3(CAUSE_Z)], ...arc(RS, -79.9, -62).slice(0, -1),
];
// the Pumice Moorings (1.8, on the Lakefront): Alpha's side zone, against the terrace face and the Rim Head's face
export const MOOR_A = [-113, -132];
const onSeg = ([ax, az], [bx, bz], a) => {   // where the ray at θ a crosses the segment a → b
  const u = [Math.cos(a * D), Math.sin(a * D)], dx = bx - ax, dz = bz - az, t = (ax * u[1] - az * u[0]) / (dz * u[0] - dx * u[1]);
  return [r3(ax + dx * t), r3(az + dz * t)];
};
export const MOORINGS = [...sarcF((a) => RSF(a) + 0.6, MOOR_A[0], MOOR_A[1], [], 2), onSeg(RH_FACE[0], RH_FACE[1], MOOR_A[1]), RH_FACE[0], ...FRONT_T(TW, MOOR_A[0])];
// the Casting Floor and the Spillway ford (0, LOW only): one ledge from the causeway's east side across the moat's SE
// quarter and the arm's mouth to the Horn Step; its NE edge faces the East Pool, its SE edge the arm's lava
export const E0 = A(S_E0, AW);
export const LEDGE_E = [[4, r3(CAUSE_Z)], ...arc(RS, -79.9, -62).slice(1), A(FORD_S1, -AW), A(FORD_S1, AW), E0, [14.4, -6.0], [12.6, -7.2], [10.4, -9.2], [7.8, -10.9], [5, -11.5], [4, -11.5]];
// the Slump shelf (0): the flank that drowns, at the cliff's foot, 4.5 m wide at the south head narrowing to 3.5 m
export const SHELF = [SHELF_S[0], SHELF_S[1], ...sarcF(SHO, SA0, SA1).slice(1, -1), SP(SHO, SA1), P(SH_IN, SA1), ...arc(SH_IN, SA1, SA0).slice(1, -1)];

// ---------------------------------------------------------------------------------------------- the tail
// Alpha's tail (its rim, round the lake's west side into the NW, defined here as Bravo's in the SE and turned): the north
// Slump head (1.2) — the landing of both Races —, the Ladle Road (2.4) along the lake to the horn and the Spillway
// Bridge, and the Rim Ridge (3.6) behind them: a 14–15 m band from the Slump to the horn, its outer edge r 37 → 36 → 34
export const RN = SHO(SA1);                                  // 28.5: the north head's and the Ladle Road's back (the Ridge's foot)
export const TH_N = 168;                                     // the north head's north end (the Ladle Road starts there)
export const NORTH_HEAD = [TIP_N[0], P(SH_IN, SA1), SP(SHO, SA1), ...arc(RN, SA1, TH_N - 360).slice(1), P(RIM_SHORE, TH_N - 360),
  ...arc(RIM_SHORE, TH_N - 360, -180.6).slice(1), TIP_N[1]];
export const RO_SE = (a) => (a >= -6 ? 35.5 + (a + 6) / 20 : a >= -20 ? 35.5 : 35.5 - 2 * (-20 - a) / 12);   // the Ridge's outer edge (SE frame): 36 → 35.5 → 33.5
export const TH_R = -32;                                     // the Ridge's end at the horn (SE frame)
const TH_HS = angOf(...A(S_HS0, AW + HS_W));
const HORN_OUT_SE = smooth([P(RO_SE(TH_R), TH_R), [28.7, -23.0], [27.2, -27.4], POINT], 3);   // the horn's outer edge → the point
export const HL_SE = [A(BR_S[0], AW), HB, ...HORN_OUT_SE.slice().reverse(), P(RN, TH_R), ...arc(RN, TH_R, TH_N - 180).slice(1),
  P(RIM_SHORE, TH_N - 180), ...arc(RIM_SHORE, TH_N - 180, TH_HS).slice(1, -1), A(S_HS0, AW + HS_W), A(BR_S[0], AW + HS_W)];
export const RIDGE_SE = [P(RN, SA1 + 180), P(RO_SE(SA1 + 178), SA1 + 178), ...sarcF(RO_SE, SA1 + 178, TH_R).slice(1), P(RN, TH_R), ...arc(RN, TH_R, SA1 + 180).slice(1, -1)];
export const HORN_STEP_SE = [E0, A(BR_S[0], AW), A(BR_S[0], AW + HS_W), A(S_HS0, AW + HS_W)];
export const HORN_STEP = rotPoly(HORN_STEP_SE);              // Alpha's Horn Step (NW, on Bravo's arm)
export const LADLE_HORN = rotPoly(HL_SE);                     // Alpha's Ladle Road + horn (NW, 2.4)
export const RIDGE = rotPoly(RIDGE_SE);                       // Alpha's Rim Ridge (W → NW, 3.6)
export const LR = RN;

// ---------------------------------------------------------------------------------------------- the edges (walls)
// polylines of the outer edge of walkable floor (Alpha's half); each segment gets a caldera-wall O-box laid outside it.
// The bay shore inside the lip and the horn's bay face are lava banks (copings), not walls
export const EDGES = [
  { id: 'E_east', pts: HEAD_E.slice(iBay), t: 1.5, top: 7.0, y0: 0, ext0: 0 },     // the head's east side past the lip (over the void)
  { id: 'E_west', pts: [...HEAD_WEST, SLUMP_SW], t: 1.5, top: 8.0, y0: 0, ext1: 0 }, // the west bulge and the Rim Head's crest
  { id: 'E_cliff', pts: [...sarcF(SHO, SA0, SA1), rot(P(RO_SE(SA1 + 178), SA1 + 178))], t: 1.5, top: 7.6, y0: -1.1, cliff: true },
  { id: 'E_rim', pts: rotPoly([P(RO_SE(SA1 + 178), SA1 + 178), ...sarcF(RO_SE, SA1 + 178, TH_R).slice(1)]), t: 1.2, top: 6.0, y0: 0 },
  { id: 'E_horn', pts: rotPoly(HORN_OUT_SE), t: 1.2, top: 5.4, y0: 0, ext1: 0 },
];

// ---------------------------------------------------------------------------------------------- riders
export const ORG = { L: [-10, -12.8, 2.5], B: [-10, -9.14, 1.5], A: [-10, -6.34, 1.5] };      // Alpha's cluster (x, z, r)
export const POSE = { L: [2.3, 4.65], B: [1.8, 3.5], A: [1.4, 2.35] };                        // tops at LOW, HIGH
export const DEPTH = { L: 4.2, B: 3.7, A: 3.3 };
export const STONES = [[-18.94, -12.46, 2.6, 2.4], [-20.70, -10.11, 2.3, 2.7], [-20.82, -7.13, 2.8, 2.5], [-22.54, -4.76, 2.4, 2.6], [-22.59, -1.86, 2.6, 2.43]];
export const STONE_YAW = -19.0;
// the second Race (Alpha's): two stones from the north head's lake edge (r 21.5) to the island's west face (r 16.2) along
// θ 175.5, 0.25 m seams; [x, z, w across, d along]
const R2 = (r0, r1) => { const rm = (r0 + r1) / 2; return [...P(rm, RACE2_A), 3.0, r3(r0 - r1)]; };
export const STONES2 = [R2(21.25, 18.85), R2(18.6, 16.45)];
export const STONE2_YAW = r3(90 - (RACE2_A - 180));         // local z along the line, toward the island

// ---------------------------------------------------------------------------------------------- the lava region
// the lake: the shores 0.5 m into every bank (Alpha's Lakefront r 23.5, the rims r 21), the Slump bays to the cliff +
// 0.5, the arms and bays 0.5 m into both banks out to the lip
const LAKE_HALF = [
  ...arc(RS + 0.5, -90, -62.5), A(0, -AW - 0.5), A(S_E0 - 0.6, AW + 0.5),
  ...[...arc(RIM_SHORE - 0.5, 148, 179.5), sp(S1, 0.5, FACE), sp(S1, 0.5, -FACE), sp(S0, -0.5, -FACE), sp(S0, -0.5, FACE), ...sarcF((a) => RSF(a) + 0.5, -132, -92.5)].map(rot),
];
export const LAKE = [...LAKE_HALF, ...rotPoly(LAKE_HALF)];
// the shore pushed d metres to the right of travel (into the bank, for a bank walked lake-side on its left)
const offsetRight = (pts, d) => pts.map((p, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
  return [r3(p[0] + (dz / L) * d), r3(p[1] - (dx / L) * d)];
});
export const SPILL = [A(-2, -AW - 0.5), ...offsetRight(BAY_SHORE.slice(0, iBay + 1), 0.5), ...LIP_LINE.slice(1, -1).reverse(), A(11.6 - 0.37, 7.4 + 0.33), A(BR_S[1] - 0.37, AW + 0.5), A(S_E0 - 1, AW + 0.5)];
export const SLUMP = [sp(S0, -0.5, FACE), sp(S0, -0.5, -FACE), P(SHO(SA0) + 0.5, SA0 + 1.1), ...sarcF((a) => SHO(a) + 0.5, SA0 - 1, SA1 + 1), P(SHO(SA1) + 0.5, SA1 - 1.1), sp(S1, 0.5, -FACE), sp(S1, 0.5, FACE)];
// past the lip: the breach (a fall there is a fall into lava): the void beyond the lip and south of the horn's point
export const CHUTE = [...LIP_LINE.slice().reverse(), ...BAY_SHORE.slice(iBay + 1), [LC[0] + 4.5, LC[1] - 10], A(30, 16), A(12, 16)];
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
