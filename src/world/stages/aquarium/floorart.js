// Gulper Aquarium — the floor art and the dusk light pools, drawn in the level shader (LAYOUT.levelArt; the pipe engine's
// world hands it to the level material through the stage-module `levelMaterial` hook, docs/STAGE-MODS.md). Everything in
// `fragBase` sits UNDER the ink (it changes the bare surface `base`, like a mural); the light pools are `fragEmissive`, at
// dusk only. No geometry, no collider, no paint cell changes: the floors stay the blockout's tiles, so world-space inlays
// can cross tile seams where a face-fitted mural could not (DESIGN.md §5.5 item 7; LEAD-REVIEW art round 1).
//
//   rose        a brass compass rose in each ferry plaza (8 points, two rings, ticks, N to the north gate)
//   trails      brass fish swimming in a line across the terrazzo from each rose to the Express's plaza mouth and the
//               ferry kiosk, and from the Gate Terrace to the South (North) Gate's wing mouth
//   keep clear  in front of every Tubeway mouth, on its own floor: a hatched cream-and-brass arc (two dashed rings and
//               chevrons running off the mouth) — the pop lands here
//   glass walk  the Gulper Run's Glass Walk: glass blocks in a brass grid, the tube's shadow down its middle, a brass
//               border; at dusk lit warm from below (under the ink: the ink still wins)
//   deck rim    a brass wave inlay round the Feeding Deck inside its rim, and one along the gatehouse's foot on the Gate
//               Terrace
//   stair flank the deck stair's two side faces (bearing −135 and its twin), a 2.4 m-high triangle each beside the Great
//               Tank's glass (LEAD-REVIEW art round 2: bare grey stonestep in mid): white render over a black-granite
//               skirting with a brass line, three faience speed lines running down the rake under the brass string-course
//               (props.js, aquarium_stringcourse), and two brass-ringed portholes into the tank stepping down with it (a
//               moon jelly and a fish in each, lit from within at dusk). Under the ink, like a mural
//   lookout     (fix round 4) the Sea Promenade's Lookout and telescope bay (LEAD-REVIEW art round 4: bare dark-teak slabs at
//               eye level on the high flank): the Lookout's outer and side faces a raised Streamline deck — white render over
//               a black-granite skirting with a brass line, three faience speed lines, a teak fascia board under the brass
//               nosing (props), two lit portholes into the Jelly Gallery on its sea face and one on each side; its court
//               balustrade under SEA PROMENADE given the balustrades' porthole and speed lines (its pilasters and coping
//               cap: props); the telescope bay's 0.6 m riser a granite kerb, a render riser with one speed line, a teak board
//   planters    (fix round 4) the planters (the fish topiary, the queue-barrier planter, the spawn decks' planters, the Gate
//               Terrace's bollard planters; LEAD-REVIEW art round 4: undressed cubes in front of both spawns): cast cream
//               stone in courses over a granite plinth, two faience speed lines, the coping's shadow (the coping, the
//               trailing planting and the plates: props); the tops one planted bed of sea holly inside a stone rim across
//               the round planters' stepped spokes (their risers drawn as the planting's side), the fish topiary's clipped
//               into a box-hedge fish. All of it on inkable faces, so all of it under the ink
//   pools       dusk light on the floors under the colonnade's globes, the canopy pendants, the Ticket Hall's canopy,
//               round the lit jelly columns, the Great Tank and the Reef Windows (warm white, times the surface's own
//               colour: ink in a pool is lit in its own colour, never washed out)
// Imports nothing (layout.js stays importable in Node); the uniforms are plain objects, their arrays flat Float32Arrays.
import { W, pol, C30, LOOKOUT, TBAY, PLANTERS } from './geo.js';

// Alpha's half (the shader turns the fragment into Alpha's frame: (x, z) → (−x, −z) on Bravo's half)
const ROSE = [...W(24.9, 2.6), 2.3];                        // centre (x, z), radius: the ferry plaza's open floor
const TRAILS = [                                              // segments (ax, az, bx, bz), fish every 0.9 m along each
  [...W(25.2, 5.6), ...W(23.4, 10.3)],                        //   rose → the Express's plaza mouth (s 22.75, w 12.5)
  [...W(25.0, 1.2), ...W(25.6, -6.2)],                        //   rose → the ferry kiosk and the queue
  [...W(4.6, 1.2), ...W(0.6, 1.2)],                           //   the Gate Terrace → the wing mouth of the gate
];
// light pools: (x, z, radius, strength)
const POOLS = [];
for (const a of [-64, -50, -36, -22]) POOLS.push([...pol(a, 20.8), 3.4, 0.7]);                       // colonnade globes
for (let i = 0; i < 12; i++) POOLS.push([...pol(-70 + (58 / 12) * (i + 0.5), 23.9), 1.8, 0.45]);    // canopy pendants
POOLS.push([6.35, -42.5, 4.2, 0.45]);                                                                // Ticket Hall canopy
POOLS.push([6.5, -17.0, 3.3, 0.5], [-16.25, -2.9, 3.3, 0.5]);                                       // jelly columns
POOLS.push([0, -21.5, 2.8, 0.35]);                                                                   // the bubble column
POOLS.push([0, 0, 9.0, 0.22]);                                                                       // the bathysphere's portholes and the winch lantern over the deck
const N_POOL = 24;

// night: a uniform-like object whose .value is the environment's night factor (the pipe engine passes a getter on it)
export function levelArt({ grate = false, ends = [], night = { value: 0 } } = {}) {
  if (grate) return null;
  const end = new Float32Array(16 * 4), endN = Math.min(16, ends.length);
  ends.slice(0, 16).forEach((e, i) => end.set([e.pos[0], e.floorY ?? 0, e.pos[2], Math.atan2(e.out[2], e.out[0])], i * 4));
  const trail = new Float32Array(4 * 4); TRAILS.forEach((t, i) => trail.set(t, i * 4));
  const pool = new Float32Array(N_POOL * 4); POOLS.slice(0, N_POOL).forEach((p, i) => pool.set(p, i * 4));
  return {
    key: 'aqart',
    uniforms: {
      uAqNight: night, uAqRose: { value: new Float32Array([...ROSE, 0]) }, uAqTrail: { value: trail }, uAqTrailN: { value: TRAILS.length },
      uAqEnd: { value: end }, uAqEndN: { value: endN }, uAqPool: { value: pool }, uAqPoolN: { value: Math.min(N_POOL, POOLS.length) },
    },
    fragPars: GLSL_PARS, fragBase: GLSL_BASE, fragEmissive: GLSL_EMIT,
  };
}

const GLSL_PARS = /* glsl */`
uniform float uAqNight;
uniform vec4 uAqRose;
uniform vec4 uAqTrail[4];
uniform int uAqTrailN;
uniform vec4 uAqEnd[16];
uniform int uAqEndN;
uniform vec4 uAqPool[24];
uniform int uAqPoolN;
vec3 gAqGlow = vec3(0.0);     // (fragBase → fragEmissive: the Glass Walk's under-glow)
vec3 gAqWin = vec3(0.0);      // (fragBase → fragEmissive: the stair flanks' portholes)
float gAqTop = 0.0;
vec2 aqR2(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float aqSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// a filled triangle (signed: < 0 inside)
float aqTri(vec2 p, vec2 a, vec2 b, vec2 c) {
  vec2 e0 = b - a, e1 = c - b, e2 = a - c, v0 = p - a, v1 = p - b, v2 = p - c;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0), q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0), q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
float aqFill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }
// a porthole on the deck stair's flank: p in metres from its centre (along the rake's run, up), R the glass's radius;
// returns the colour and writes its coverage (glass 0…1, brass ring) for the roughness and the dusk glow
vec3 aqPort(vec2 p, float R, float aa, vec3 under, out float glass, out float ring) {
  float r = length(p);
  glass = aqFill(r - R, aa);
  ring = aqFill(abs(r - R - 0.026) - 0.026, aa);
  vec3 BR = vec3(0.56, 0.38, 0.15);
  // the water: deep blue-green, lighter toward its top, a shaft of light, a moon jelly and a small fish
  vec2 u = p / R;
  vec3 w = mix(vec3(0.008, 0.03, 0.045), vec3(0.06, 0.16, 0.19), smoothstep(-1.0, 0.9, u.y));
  w += vec3(0.05, 0.08, 0.08) * smoothstep(0.25, 0.0, abs(u.x + 0.35 * u.y - 0.1)) * smoothstep(-0.6, 1.0, u.y);
  vec2 jb = (u - vec2(-0.18, 0.2)) / vec2(0.34, 0.24);
  float bell = aqFill((length(jb) - 1.0) * 0.1, aa) * smoothstep(-0.12, 0.14, jb.y + 0.22 - 0.45 * (1.0 - min(1.0, jb.x * jb.x)));   // (a soft saucer: the margin hangs, the middle lifts)
  float tent = 0.0;
  for (int k = 0; k < 3; k++) { float x = -0.3 + 0.12 * float(k); tent = max(tent, aqFill(abs(u.x - x - 0.04 * sin(u.y * 14.0 + float(k))) - 0.012, aa) * step(u.y, 0.12) * step(-0.45, u.y) * smoothstep(-0.45, 0.1, u.y)); }
  w = mix(w, vec3(0.62, 0.62, 0.7), max(bell * 0.75, tent * 0.45));
  vec2 fb = (u - vec2(0.38, -0.36)) / vec2(0.2, 0.08);
  float fish = max(aqFill((length(fb) - 1.0) * 0.06, aa), aqFill(aqTri(u - vec2(0.38, -0.36), vec2(-0.16, 0.0), vec2(-0.3, 0.08), vec2(-0.3, -0.08)), aa));
  w = mix(w, vec3(0.02, 0.05, 0.06), fish * 0.85);
  // the glass's highlight
  w += vec3(0.12) * aqFill(abs(length(u - vec2(0.12, -0.12)) - 0.78) - 0.035, aa) * step(0.0, -u.x + u.y * 0.2) * step(0.2, u.y);
  vec3 c = mix(under, w, glass);
  // the brass ring and its eight bolts
  float ang = atan(p.y, p.x), bolt = aqFill(length(vec2(fract(ang / 0.7854 + 0.5) - 0.5, 0.0) * 0.7854 * (R + 0.026) + vec2(0.0, r - R - 0.026)) - 0.011, aa);
  c = mix(c, BR, ring);
  c = mix(c, BR * 0.35, bolt * ring);
  return c;
}
// ---- fix round 4: planting and the planters' and Lookouts' faces
vec2 aqH22(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
// overlapping leaves, one per cell (an ellipse at a random turn, lit across its width, a midrib), dark soil between them;
// sc the leaf's size in metres. Returns the leaf colour, writes the cover (0 soil … 1 leaf)
vec3 aqLeaves(vec2 p, float sc, vec3 cA, vec3 cB, out float cov) {
  vec2 g = p / sc, i = floor(g), f = fract(g);
  float bd = 9.0; vec3 bk = vec3(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y)), h = aqH22(i + o), c = f - o - 0.2 - 0.6 * h;
    float a = h.x * 6.2832, cs = cos(a), sn = sin(a);
    vec2 r = vec2(cs * c.x + sn * c.y, -sn * c.x + cs * c.y);
    float d = length(r / vec2(0.8, 0.38));
    if (d < bd) { bd = d; bk = vec3(h, r.y / 0.38); }
  }
  cov = 1.0 - smoothstep(0.78, 1.0, bd);
  vec3 c = mix(cA, cB, bk.y) * (0.78 + 0.42 * bk.x);
  c *= 0.8 + 0.32 * clamp(0.5 + 0.5 * bk.z, 0.0, 1.0);
  c *= 1.0 - 0.28 * bd * bd;
  c += vec3(0.035, 0.045, 0.03) * (1.0 - smoothstep(0.0, 0.18, abs(bk.z))) * step(bd, 0.72);
  return c;
}
// sea-holly heads: a steel-blue thistle cone in a ruff of spiny silver-blue bracts, in half the cells (sc apart)
float aqHolly(vec2 p, float sc, out vec3 col) {
  vec2 g = p / sc, i = floor(g), f = fract(g) - 0.5, h = aqH22(i + 7.3);
  vec2 d = f - (h - 0.5) * 0.35; float r = length(d), a = atan(d.y, d.x);
  float ruff = 1.0 - smoothstep(0.0, 0.035, r - (0.17 + 0.13 * pow(abs(cos(a * 3.5 + h.y * 6.0)), 3.0)));
  float cone = 1.0 - smoothstep(0.0, 0.035, r - 0.095);
  col = mix(vec3(0.33, 0.41, 0.52) * (0.8 + 0.3 * (1.0 - r * 3.0)), vec3(0.15, 0.19, 0.45) * (0.75 + 0.45 * aqH22(floor(d * 46.0) + i).x), cone);
  return max(ruff, cone) * step(h.x, 0.5);
}
// the fish topiary's clipped fish (metres, nose along +x): a body, a forked tail, dorsal and ventral fins (signed: < 0 in)
float aqFishSD(vec2 p) {
  float body = (length((p - vec2(0.1, 0.0)) / vec2(0.56, 0.26)) - 1.0) * 0.26;
  float tail = max(aqTri(p, vec2(-0.36, 0.0), vec2(-0.78, 0.27), vec2(-0.78, -0.27)), -aqTri(p, vec2(-0.6, 0.0), vec2(-0.82, 0.13), vec2(-0.82, -0.13)));
  float fd = (length((p - vec2(0.0, 0.2)) / vec2(0.22, 0.12)) - 1.0) * 0.12, fv = (length((p - vec2(-0.02, -0.2)) / vec2(0.14, 0.09)) - 1.0) * 0.09;
  return min(min(body, tail), min(fd, fv));
}
// a planted bed seen from above: sea holly — two layers of glaucous leaves in clumps over dark soil, steel-blue thistle
// heads — inside the cast-stone rim (e: metres in from the outline; rim: the rim's width, its rounded coping included);
// pf (with fish > 0.5): the topiary's own frame, its bed clipped into a box-hedge fish
vec3 aqBed(vec2 p, float e, float rim, float aa, float fish, vec2 pf) {
  float cov0, cov1;
  vec3 c = aqLeaves(p + 0.37, 0.07, vec3(0.07, 0.15, 0.06), vec3(0.14, 0.25, 0.11), cov0);
  c = mix(vec3(0.04, 0.045, 0.025), c, cov0);
  vec3 l1 = aqLeaves(p, 0.042, vec3(0.16, 0.30, 0.15), vec3(0.32, 0.46, 0.30), cov1);
  c = mix(c, l1, cov1 * 0.92);
  float clump = aqH22(floor(p / 0.23)).x * 0.5 + 0.5 * sin(p.x * 13.0 + 2.0 * sin(p.y * 9.0)) * sin(p.y * 11.0);
  c *= 0.82 + 0.3 * clump;
  vec3 hc; float hh = aqHolly(p, 0.16, hc); c = mix(c, hc, hh * 0.9);
  if (fish > 0.5) {
    float sd = aqFishSD(pf), hedge = aqFill(sd, aa), hcov;
    vec3 hcol = aqLeaves(p, 0.018, vec3(0.04, 0.10, 0.03), vec3(0.09, 0.19, 0.06), hcov);
    hcol = mix(vec3(0.015, 0.035, 0.012), hcol, 0.6 + 0.4 * hcov) * (0.7 + 0.55 * smoothstep(0.0, -0.1, sd));   // clipped round: lighter on its crown
    c *= 1.0 - 0.6 * aqFill(abs(sd) - 0.022, aa) * (1.0 - hedge);               // the clipped edge's shadow in the bed
    c = mix(c, hcol, hedge);
    c *= 1.0 - 0.4 * aqFill(abs(length((pf - vec2(0.5, 0.0)) / vec2(1.0, 1.25)) - 0.25) - 0.012, aa) * step(pf.x, 0.38) * hedge;   // the gill
    c *= 1.0 - 0.3 * aqFill(abs(sd + 0.05) - 0.008, aa) * step(pf.x, -0.3) * hedge;                                                 // the tail's clipped line
    c = mix(c, vec3(0.025, 0.025, 0.03), aqFill(length(pf - vec2(0.45, 0.07)) - 0.034, aa) * hedge);                             // its eye
    c = mix(c, vec3(0.62, 0.64, 0.62), aqFill(length(pf - vec2(0.462, 0.082)) - 0.01, aa) * hedge);
  }
  vec3 ST = vec3(0.70, 0.64, 0.52) * 1.06 * (0.96 + 0.04 * sin(p.x * 23.0 + p.y * 17.0));
  c *= 1.0 - 0.5 * (1.0 - smoothstep(rim, rim + 0.07, e));                    // the rim's shadow on the planting
  return mix(c, ST, aqFill(e - rim, aa));
}
// a Deco planter's face: cast cream stone in courses over a black-granite plinth with a brass line, two faience speed
// lines round the body, a smooth coping band from cope under the top (its upper part the block's own rounded edge:
// level.js bevels it) with a groove under it; h over its foot, H its height, t along it (props.js: the trailing
// planting over the coping, the plates)
vec3 aqPlanterFace(float t, float h, float H, float cope, float aa, float big, float fine, out float rough, out float metal) {
  vec3 ST = vec3(0.70, 0.64, 0.52) * (0.93 + 0.08 * big + 0.05 * (fine - 0.5));
  vec3 GRAN = vec3(0.045, 0.048, 0.052), FAI = vec3(0.33, 0.45, 0.39), BRASS = vec3(0.56, 0.38, 0.15);
  vec3 c = ST;
  float hc = h - 0.13, row = floor(hc / 0.42), yc = H - cope;
  float jy = abs(fract(hc / 0.42 + 0.5) - 0.5) * 0.42, jx = abs(fract((t + 0.3 * mod(row, 2.0)) / 0.6 + 0.5) - 0.5) * 0.6;
  c *= 1.0 - 0.16 * aqFill(min(jy, jx) - 0.004, aa) * step(0.0, hc) * step(h, yc - 0.03);
  c = mix(c, GRAN * 1.6, aqFill(h - 0.12, aa));
  float br = aqFill(abs(h - 0.126) - 0.006, aa);
  float y1 = min(H * 0.46, yc - 0.2), l = min(abs(h - y1), abs(h - y1 - 0.075));
  float band = aqFill(l - 0.021, aa);
  c = mix(c, FAI, band);
  // the coping: smoother, lighter stone; under it a groove and its shadow
  c *= 1.0 - 0.3 * smoothstep(yc - 0.12, yc - 0.01, h) * step(h, yc);
  c *= 1.0 - 0.55 * aqFill(abs(h - yc) - 0.008, aa);
  c = mix(c, ST * 1.1 * (1.0 + 0.03 * (fine - 0.5)), aqFill(yc + 0.008 - h, aa));
  c = mix(c, BRASS, br);
  rough = mix(mix(0.82, 0.25, band), 0.3, br);
  rough = mix(rough, 0.6, aqFill(yc - h, aa));
  metal = 0.65 * br;
  return c;
}
`;

// ---- fix round 4: the GLSL for the Lookouts, the telescope bays and the planters, from geo.js's numbers (Alpha's frame)
const f4 = (v) => (+v).toFixed(4);
const DIRV = (a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
const CB = f4(C30);
// level.js rounds every exposed edge of a block (bevel = min(max(0.04, min(0.13, 0.14 h)), 0.45 h), h its smallest
// half-size, its foot at the foundations' −2.0): the planters' coping is that bullnose and a band under it
const BEV = (h) => Math.min(Math.max(0.04, Math.min(0.13, 0.14 * h)), 0.45 * h);
const bevOct = (o) => BEV(Math.min(o.r * Math.tan(Math.PI / 8), (o.top + 2) / 2));
const bevBox = (b) => BEV(Math.min((b.s[1] - b.s[0]) / 2, (b.w[1] - b.w[0]) / 2, (b.top + 2) / 2));
// the planters' beds (tops): the round ones inside their octagon of apothem r over every spoke's top, the boxes in the
// blade frame
const PLANTER_TOPS = [
  ...PLANTERS.oct.map((o) => `{
      vec2 p = q - vec2(${f4(o.c[0])}, ${f4(o.c[1])}); float m = max(max(abs(p.x), abs(p.y)), max(abs(p.x + p.y), abs(p.x - p.y)) * 0.70711);
      if (m < ${f4(o.r + 0.004)} && y > ${f4(o.top - 0.3)} && y < ${f4(o.top + 0.02)}) { base = aqBed(wp, ${f4(o.r)} - m, ${f4(bevOct(o) + 0.04)}, aa, ${o.fish ? '1.0' : '0.0'}, p); gBaseRough = 0.9; gTexStr *= 0.1; gTexORM.b = 0.0; }
    }`),
  ...PLANTERS.box.map((b) => `if (abs(y - ${f4(b.top)}) < 0.02) {
      vec2 sw = vec2(0.5 * q.x - ${CB} * (q.y + 32.5), ${CB} * q.x + 0.5 * (q.y + 32.5));
      float e = min(min(sw.x - ${f4(b.s[0])}, ${f4(b.s[1])} - sw.x), min(sw.y - ${f4(b.w[0])}, ${f4(b.w[1])} - sw.y));
      if (e > -0.004) { base = aqBed(wp, e, ${f4(bevBox(b) + 0.04)}, aa, 0.0, vec2(0.0)); gBaseRough = 0.9; gTexStr *= 0.1; gTexORM.b = 0.0; }
    }`),
].join('\n    ');
// the planters' faces: the outer faces cast stone (aqPlanterFace), the round ones' inner risers the planting's side
const PLANTER_FACES = [
  ...PLANTERS.oct.map((o) => `{
      vec2 p = q - vec2(${f4(o.c[0])}, ${f4(o.c[1])}); float m = max(max(abs(p.x), abs(p.y)), max(abs(p.x + p.y), abs(p.x - p.y)) * 0.70711);
      if (m < ${f4(o.r + 0.01)} && y < ${f4(o.top + 0.01)}) {
        float t = dot(p, vec2(-nq.y, nq.x)), aa = max(fwidth(t) + fwidth(y), 0.003), r0, m0;
        if (m > ${f4(o.r - 0.012)}) {
          float k = mod(floor(atan(nq.y, nq.x) / 0.7854 + 0.5), 4.0);    // (each spoke's ends its own height: 9 cm down a spoke)
          base = aqPlanterFace(t, y, ${f4(o.top)} - 0.09 * k, ${f4(Math.max(0.11, bevOct(o) + 0.04))}, aa, big, fine, r0, m0); gBaseRough = r0; gTexORM.b = m0; gTexStr *= 0.15;
        } else if (y > ${f4(o.top - 0.3)}) {
          float cov; vec3 lf = aqLeaves(vec2(t, y), 0.05, vec3(0.12, 0.24, 0.11), vec3(0.24, 0.38, 0.22), cov);
          base = mix(mix(vec3(0.03, 0.026, 0.02), lf * 0.72, cov), vec3(0.63, 0.58, 0.47), aqFill(${f4(o.r - bevOct(o) - 0.04)} - m, aa));
          gBaseRough = 0.9; gTexStr *= 0.1; gTexORM.b = 0.0;
        }
      }
    }`),
  ...PLANTERS.box.map((b) => `if (y > ${f4(b.y0 - 0.01)} && y < ${f4(b.top + 0.01)}) {
      vec2 sw = vec2(0.5 * q.x - ${CB} * (q.y + 32.5), ${CB} * q.x + 0.5 * (q.y + 32.5)), nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
      float e = min(min(sw.x - ${f4(b.s[0])}, ${f4(b.s[1])} - sw.x), min(sw.y - ${f4(b.w[0])}, ${f4(b.w[1])} - sw.y));
      if (abs(e) < 0.012) {
        float t = abs(nb.x) > 0.7 ? sw.y : sw.x, aa = max(fwidth(t) + fwidth(y), 0.003), r0, m0;
        base = aqPlanterFace(t, y - ${f4(b.y0)}, ${f4(b.top - b.y0)}, ${f4(Math.max(0.11, bevBox(b) + 0.04))}, aa, big, fine, r0, m0); gBaseRough = r0; gTexORM.b = m0; gTexStr *= 0.15;
      }
    }`),
].join('\n    ');
// the rounded edges between a top and its faces (level.js's bevels, 30°–75° off the vertical: neither branch above
// draws them): the planters' as their stone coping (or the planting's side inside a round planter's bed), the Lookout's
// and the bay's as their teak deck's edge, the balustrade's as render
const BEVELS = [
  ...PLANTERS.oct.map((o) => `{
      vec2 p = q - vec2(${f4(o.c[0])}, ${f4(o.c[1])}); float m = max(max(abs(p.x), abs(p.y)), max(abs(p.x + p.y), abs(p.x - p.y)) * 0.70711);
      if (m < ${f4(o.r + 0.01)} && y > ${f4(o.top - 0.42)} && y < ${f4(o.top + 0.01)}) base = m > ${f4(o.r - bevOct(o) - 0.04)} ? STb : vec3(0.06, 0.11, 0.05);
    }`),
  ...PLANTERS.box.map((b) => `if (y > ${f4(b.top - 0.2)} && y < ${f4(b.top + 0.01)}) {
      vec2 sw = vec2(0.5 * q.x - ${CB} * (q.y + 32.5), ${CB} * q.x + 0.5 * (q.y + 32.5));
      if (min(min(sw.x - ${f4(b.s[0])}, ${f4(b.s[1])} - sw.x), min(sw.y - ${f4(b.w[0])}, ${f4(b.w[1])} - sw.y)) > -0.01) base = STb;
    }`),
].join('\n    ');
const [dLx, dLz] = DIRV(LOOKOUT.a), [dBx, dBz] = DIRV(TBAY.a), Lk = LOOKOUT, Tb = TBAY;
const LOOKOUT_BEVELS = `if (y > ${f4(Tb.top - 0.16)} && y < ${f4(Lk.bal + 0.01)}) {
      float uL = dot(q, vec2(${f4(dLx)}, ${f4(dLz)})), vL = dot(q, vec2(${f4(-dLz)}, ${f4(dLx)})), uB = dot(q, vec2(${f4(dBx)}, ${f4(dBz)})), vB = dot(q, vec2(${f4(-dBz)}, ${f4(dBx)}));
      vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.85 + 0.2 * fine);
      if (abs(vL) < ${f4(Lk.half + 0.01)} && uL > ${f4(Lk.r0 - 0.01)} && uL < ${f4(Lk.r1 + 0.01)}) {
        if (uL < ${f4(Lk.rb + 0.01)} && y > ${f4(Lk.bal - 0.16)}) base = vec3(0.84, 0.79, 0.70) * 0.86;
        else if (y > ${f4(Lk.top - 0.16)} && y < ${f4(Lk.top + 0.01)}) base = TEAK;
      } else if (abs(vB) < ${f4(Tb.half + 0.01)} && uB > ${f4(Tb.r0 - 0.01)} && uB < ${f4(Tb.r1 + 0.01)} && y < ${f4(Tb.top + 0.01)}) base = TEAK;
    }`;
const LOOKOUT_FACES = `if (y > ${f4(Lk.floor - 0.02)} && y < ${f4(Lk.bal + 0.06)}) {
      vec2 dL = vec2(${f4(dLx)}, ${f4(dLz)}), pL = vec2(${f4(-dLz)}, ${f4(dLx)}), dB = vec2(${f4(dBx)}, ${f4(dBz)}), pB = vec2(${f4(-dBz)}, ${f4(dBx)});
      float uL = dot(q, dL), vL = dot(q, pL), uB = dot(q, dB), vB = dot(q, pB), nd = dot(nq, dL), np = dot(nq, pL);
      // which face: 1 the Lookout's sea face, 2 its sides, 3 its balustrade's court face, 4 the balustrade over the Lookout's
      // deck (its back and its sides above 3.6), 5 the telescope bay's riser (t: along the face)
      float fc = 0.0, t = 0.0;
      if (abs(vL) < ${f4(Lk.half + 0.03)} && uL > ${f4(Lk.r0 - 0.03)} && uL < ${f4(Lk.r1 + 0.03)}) {
        if (abs(uL - ${f4(Lk.r1)}) < 0.045 && nd > 0.6 && y < ${f4(Lk.top + 0.01)}) { fc = 1.0; t = vL; }
        else if (abs(abs(vL) - ${f4(Lk.half)}) < 0.045 && abs(np) > 0.6) { if (y < ${f4(Lk.top)}) { fc = 2.0; t = uL; } else if (uL < ${f4(Lk.rb + 0.01)}) { fc = 4.0; t = uL; } }
        else if (abs(uL - ${f4(Lk.r0)}) < 0.045 && nd < -0.6) { fc = 3.0; t = vL; }
        else if (abs(uL - ${f4(Lk.rb)}) < 0.045 && nd > 0.6 && y > ${f4(Lk.top - 0.01)}) { fc = 4.0; t = vL; }
      }
      if (fc < 0.5 && abs(vB) < ${f4(Tb.half + 0.03)} && uB > ${f4(Tb.r0 - 0.03)} && uB < ${f4(Tb.r1 + 0.03)} && y < ${f4(Tb.top + 0.01)}) {
        float ndB = dot(nq, dB), npB = dot(nq, pB);
        if ((abs(uB - ${f4(Tb.r0)}) < 0.045 && ndB < -0.6) || (abs(uB - ${f4(Tb.r1)}) < 0.045 && ndB > 0.6)) { fc = 5.0; t = vB; }
        else if (abs(abs(vB) - ${f4(Tb.half)}) < 0.045 && abs(npB) > 0.6) { fc = 5.0; t = uB; }
      }
      if (fc > 0.5) {
        float aa = max(fwidth(t) + fwidth(y), 0.003), bay = step(4.5, fc), lk = step(fc, 2.5), bal = 1.0 - bay - lk;
        vec3 GRAN = vec3(0.045, 0.048, 0.052), BRASS = vec3(0.56, 0.38, 0.15), FAI = vec3(0.33, 0.45, 0.39);
        vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
        vec3 c = REN;
        // the skirting: black granite (16 cm; the bay's kerb 15; the balustrade's foot on the Lookout's deck 12), a brass line
        float yb = fc > 3.5 && fc < 4.5 ? ${f4(Lk.top)} : ${f4(Lk.floor)}, hk = bay > 0.5 ? 0.15 : (fc > 3.5 ? 0.12 : 0.16);
        c = mix(c, GRAN * 1.5, aqFill(y - yb - hk, aa));
        float sk = aqFill(abs(y - yb - hk - 0.007) - 0.007, aa);
        // faience speed lines: three round the Lookout's sea and side faces, three round its balustrade under SEA PROMENADE,
        // one along the bay's riser
        float l0 = lk > 0.5 ? 3.13 : (bay > 0.5 ? 2.72 : 3.74), dl = abs(y - l0);
        if (bay < 0.5) dl = min(dl, min(abs(y - l0 - 0.1), abs(y - l0 - 0.2)));
        float band = aqFill(dl - 0.026, aa), grout = aqFill(abs(dl - 0.026) - 0.004, aa);
        c = mix(c, FAI, band); c *= 1.0 - 0.22 * grout;
        // the deck's edge: a teak fascia board under the brass nosing (props), its shadow line; the balustrade's top: the
        // shadow under its coping cap (props)
        float board = 0.0;
        if (bal < 0.5) {
          float yt = lk > 0.5 ? ${f4(Lk.top)} : ${f4(Tb.top)}, bt = lk > 0.5 ? 0.14 : 0.1;
          board = aqFill(yt - bt - y, aa);
          vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.82 + 0.25 * fine) * (0.92 + 0.08 * sin(t * 9.0 + 2.0 * sin(t * 2.3)));
          c = mix(c * (1.0 - 0.35 * aqFill(abs(y - yt + bt + 0.03) - 0.01, aa)), TEAK, board);
          float nose = aqFill(abs(y - yt + bt + 0.008) - 0.013, aa);      // a brass nosing strip along the board's foot
          c = mix(c, BRASS * (1.05 + 0.15 * smoothstep(0.0, 0.013, y - yt + bt + 0.008)), nose); sk = max(sk, nose);
        } else c *= 1.0 - 0.28 * smoothstep(${f4(Lk.bal - 0.16)}, ${f4(Lk.bal)}, y);
        // portholes into the Jelly Gallery, lit at dusk: two on the Lookout's sea face, one on each side, one of the
        // balustrades' size on the court face
        float gW = 0.0, rW = 0.0;
        if (fc < 1.5) c = aqPort(vec2(abs(t) - 0.95, y - 2.86), 0.17, aa, c, gW, rW);
        else if (fc < 2.5) c = aqPort(vec2(t - ${f4((Lk.rb + Lk.r1) / 2)}, y - 2.86), 0.17, aa, c, gW, rW);
        else if (fc < 3.5) c = aqPort(vec2(t, y - 3.06), 0.3, aa, c, gW, rW);
        c = mix(c, BRASS, sk);
        base = c;
        gBaseRough = mix(mix(mix(0.85, 0.25, band), 0.3, max(rW, sk)), 0.12, gW);
        gBaseRough = mix(gBaseRough, 0.55, board);
        gAqWin = vec3(0.95, 0.88, 0.8) * gW;
        gTexStr *= 0.12;
        gTexORM.b = 0.65 * max(rW, sk);
      }
    }`;

const GLSL_BASE = /* glsl */`
  // ---- Gulper Aquarium: floor art under the ink (src/world/stages/aquarium/floorart.js)
  if (vWNorm.y > 0.9) {
    gAqTop = 1.0;
    vec2 wp = vWPos.xz;
    vec2 q = vWPos.z > 0.0 ? -wp : wp;        // Alpha's frame (the twins are turned 180°)
    float aa = max(fwidth(wp.x) + fwidth(wp.y), 0.004);
    vec3 BRASS = vec3(0.56, 0.38, 0.15), BRASS_D = vec3(0.30, 0.19, 0.07), GRAN = vec3(0.045, 0.048, 0.052), CREAM = vec3(0.80, 0.74, 0.60);
    float y = vWPos.y;
    // -- the compass rose (ground level, the ferry plaza)
    if (abs(y) < 0.06) {
      vec2 p = q - uAqRose.xy; float R = uAqRose.z, r = length(p);
      if (r < R + 0.05) {
        float ring = max(aqFill(abs(r - (R - 0.07)) - 0.07, aa), aqFill(abs(r - (R - 0.42)) - 0.035, aa));
        float band = step(R - 0.42, r) * step(r, R - 0.14);   // (the ring band between: dark granite with brass ticks)
        float ang = atan(p.y, p.x), tick = aqFill(abs(fract(ang / 0.17453 + 0.5) - 0.5) * 0.17453 * r - 0.02, aa) * band;
        base = mix(base, GRAN * 1.6, band * 0.85);
        // the eight points: N/E/S/W long, the diagonals short; each split down its axis (brass / dark granite)
        float star = 0.0, dark = 0.0;
        for (int k = 0; k < 8; k++) {
          float a = float(k) * 0.7854, L = (k - (k / 2) * 2 == 0) ? R - 0.1 : (R - 0.42) * 0.7, w = (k - (k / 2) * 2 == 0) ? 0.34 : 0.22;
          vec2 u = aqR2(p, -a);
          float t = aqFill(aqTri(u, vec2(0.0, -w), vec2(L, 0.0), vec2(0.0, w)), aa);
          star = max(star, t); dark = max(dark, t * step(0.0, u.y));
        }
        float hub = aqFill(r - 0.2, aa), hubR = aqFill(abs(r - 0.2) - 0.03, aa);
        base = mix(base, BRASS, max(max(ring, tick), star * (1.0 - dark)));
        base = mix(base, GRAN, dark * star);
        base = mix(base, BRASS, max(hub, hubR) );
        if (max(max(ring, tick), star) > 0.5) gBaseRough = 0.32;
      } else if (length(q - (uAqRose.xy + vec2(0.0, uAqRose.z + 0.45))) < 0.4) {
        vec2 n = q - (uAqRose.xy + vec2(0.0, uAqRose.z + 0.45));
        float N = aqFill(min(min(aqSeg(n, vec2(-0.16, -0.24), vec2(-0.16, 0.24)), aqSeg(n, vec2(-0.16, 0.24), vec2(0.16, -0.24))), aqSeg(n, vec2(0.16, -0.24), vec2(0.16, 0.24))) - 0.045, aa);
        base = mix(base, BRASS, N);
      }
      // -- fish trails: little brass fish every 0.9 m, swimming along each segment
      for (int i = 0; i < 4; i++) {
        if (i >= uAqTrailN) break;
        vec2 a = uAqTrail[i].xy, b = uAqTrail[i].zw, ba = b - a; float Lb = length(ba); vec2 dir = ba / Lb;
        vec2 pa = q - a; float al = dot(pa, dir), ac = dot(pa, vec2(-dir.y, dir.x));
        if (al < -0.4 || al > Lb + 0.4 || abs(ac) > 0.4) continue;
        float c = mod(al, 1.15) - 0.575;
        vec2 f = vec2(c, ac);
        float body = length(f / vec2(0.26, 0.105)) - 1.0;
        float tail = aqTri(f, vec2(-0.2, 0.0), vec2(-0.42, 0.14), vec2(-0.42, -0.14));
        float fish = max(aqFill(body * 0.1, aa), aqFill(tail, aa)) * step(-0.05, al) * step(al, Lb + 0.05);
        float eye = aqFill(length(f - vec2(0.13, 0.025)) - 0.024, aa);
        base = mix(base, BRASS_D * 1.25, fish); base = mix(base, GRAN, eye * fish);
      }
      // -- the Gate Terrace: a brass wave along the gatehouse's foot (r 31.85 … 32.25, bearing −113 … −67)
      {
        float r = length(q), b = atan(q.y, q.x) * 57.2958;
        if (r > 31.7 && r < 32.4 && b > -113.0 && b < -67.0) {
          float u = b * 0.5585 * 1.0, v = r - 32.05;
          float wave = aqFill(abs(v - 0.09 * sin(u * 6.2832 / 0.9)) - 0.025, aa);
          float rails = aqFill(abs(abs(v) - 0.17) - 0.012, aa);
          base = mix(base, BRASS, max(wave, rails));
        }
      }
    }
    // -- the Feeding Deck (2.4): a brass wave inlay inside the rim (r 6.72 … 7.04), not across the Glass Walk
    if (abs(y - 2.4) < 0.06) {
      float r = length(wp);
      if (r > 6.66 && r < 7.1 && abs(wp.y) > 1.25) {
        float b = atan(wp.y, wp.x), v = r - 6.88;
        float wave = aqFill(abs(v - 0.06 * sin(b * 6.88 * 6.2832 / 0.75)) - 0.018, aa);
        float rails = aqFill(abs(abs(v) - 0.15) - 0.01, aa);
        base = mix(base, BRASS, max(wave, rails));
        if (max(wave, rails) > 0.5) gBaseRough = 0.35;
      }
      // -- the Glass Walk: glass blocks (0.3 m) in a brass grid every 1.5 m, the Gulper Run's tube a shadow down its
      // middle, a brass border; under-glow at dusk (fragEmissive)
      if (abs(wp.x) < 7.5 && abs(wp.y) < 1.2) {
        vec2 g = wp / 0.3, gf = abs(fract(g) - 0.5);
        float grout = aqFill(0.5 - max(gf.x, gf.y) - 0.04, 0.02);
        vec2 g5 = abs(fract(wp / 1.5) - 0.5) * 1.5;
        float strip = aqFill(min(g5.x, 99.0) - 0.022, aa) + aqFill(abs(abs(wp.y) - 1.13) - 0.035, aa);
        float tube = 1.0 - smoothstep(0.45, 0.92, abs(wp.y));
        float bevel = smoothstep(0.5, 0.36, max(gf.x, gf.y));
        vec3 glass = base * mix(0.86, 1.06, bevel) * mix(1.0, 0.5, tube);
        glass = mix(glass, base * 0.55, grout * 0.6);
        base = mix(glass, BRASS, clamp(strip, 0.0, 1.0));
        gAqGlow = vec3(1.0, 0.86, 0.62) * (0.5 + 0.5 * bevel) * (1.0 - clamp(strip, 0.0, 1.0)) * (1.0 - 0.45 * tube) * 0.32;
      }
    }
    // -- fix round 4: the planters' beds (sea holly in dark soil inside a cast-stone rim, across the round planters'
    // stepped spokes; the fish topiary's clipped into a box-hedge fish)
    if (y > 0.88 && y < 4.53) {
    ${PLANTER_TOPS}
    }
    // -- KEEP CLEAR in front of every Tubeway mouth, on its own floor
    for (int i = 0; i < 16; i++) {
      if (i >= uAqEndN) break;
      vec4 e = uAqEnd[i];
      if (abs(y - e.y) > 0.07) continue;
      vec2 p = aqR2(wp - e.xz, -e.w);          // +x out of the mouth
      float r = length(p);
      if (r > 2.45 || p.x < 0.25) continue;
      float th = atan(p.y, p.x);
      if (abs(th) > 1.25) continue;
      // a dark granite arc band (r 1.95 … 2.35) striped with brass, edged in brass: the landing's "keep clear"
      float bandK = aqFill(abs(r - 2.15) - 0.2, aa) * aqFill(abs(th) - 1.2, 0.02);
      float stripe = step(0.5, fract((th * 2.15 + (r - 2.15) * 1.2) / 0.32));
      float edge = aqFill(abs(abs(r - 2.15) - 0.2) - 0.022, aa) * aqFill(abs(th) - 1.2, 0.02);
      base = mix(base, GRAN * 1.4, bandK * 0.9);
      base = mix(base, BRASS, max(bandK * stripe * 0.9, edge));
    }
  } else if (abs(vWNorm.y) < 0.3) {
    vec2 q = vWPos.z > 0.0 ? -vWPos.xz : vWPos.xz, nq = vWPos.z > 0.0 ? -vWNorm.xz : vWNorm.xz;
    if (vWPos.y < 2.45) {
    // ---- the deck stair's flanks (layout.js radRamp(−135, 13.5 → 7.2, 0 → 2.4, 4.0 wide) and its twin at +45): its side
    // faces stand at ±2.0 m off the stair's axis; t runs out along the axis (7.5 at the tank's glass … 13.5 at the foot)
    vec2 ax = vec2(-0.70711), pr = vec2(0.70711, -0.70711);
    float t = dot(q, ax), l = dot(q, pr);
    if (abs(abs(l) - 2.0) < 0.04 && abs(dot(nq, pr)) > 0.95 && t > 7.0 && t < 14.2) {
      float y = vWPos.y, aa = max(fwidth(t) + fwidth(y), 0.003);
      float ys = clamp(2.4 * (13.5 - t) / 6.3, 0.0, 2.4), d = (ys - y) * 0.9345;   // (d: metres in from the rake, square to it)
      vec3 GRAN = vec3(0.045, 0.048, 0.052), BRASS = vec3(0.56, 0.38, 0.15);
      vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
      vec3 FAI = vec3(0.33, 0.45, 0.39) * (0.96 + 0.05 * fine);
      vec3 c = REN;
      // the shadow line under the string-course, then three faience speed lines down the rake (6 cm, 8 cm apart)
      c *= 1.0 - 0.18 * aqFill(abs(d - 0.1) - 0.02, aa);
      float dl = min(abs(d - 0.3), min(abs(d - 0.44), abs(d - 0.58)));
      float band = aqFill(dl - 0.03, aa), grout = aqFill(abs(dl - 0.03) - 0.005, aa);
      c = mix(c, FAI, band);
      c *= 1.0 - 0.22 * grout;
      // the skirting: black granite to 0.15 m, a brass line on it
      c = mix(c, GRAN * 1.5, aqFill(y - 0.15, aa));
      float sk = aqFill(abs(y - 0.157) - 0.008, aa);
      c = mix(c, BRASS, sk);
      // two portholes into the tank, stepping down the rake
      float g1, r1, g2, r2;
      c = aqPort(vec2(t - 8.3, y - 0.92), 0.32, aa, c, g1, r1);
      c = aqPort(vec2(t - 9.4, y - 0.55), 0.26, aa, c, g2, r2);
      base = c;
      float glassW = max(g1, g2), ringW = max(r1, r2);
      gBaseRough = mix(mix(0.85, 0.25, band), 0.3, max(ringW, sk));
      gBaseRough = mix(gBaseRough, 0.12, glassW);
      gAqWin = vec3(0.95, 0.88, 0.8) * glassW;
      // (the stonestep's own relief and metal off the face: smooth trowelled render, brass where the brass is)
      gTexStr *= 0.12;
      gTexORM.b = 0.65 * max(ringW, sk);
    }
    }
    float y = vWPos.y;
    // ---- fix round 4: the Sea Promenade's Lookout, its court balustrade and the telescope bay (both halves)
    ${LOOKOUT_FACES}
    // ---- fix round 4: the planters' faces
    if (y < 1.32 || (y > 3.36 && y < 4.52)) {
    ${PLANTER_FACES}
    }
  } else if (vWNorm.y > 0.0) {
    // ---- fix round 4: the rounded edges of the Lookouts', the bays' and the planters' tops (level.js's bevels)
    vec2 q = vWPos.z > 0.0 ? -vWPos.xz : vWPos.xz;
    float y = vWPos.y;
    vec3 STb = vec3(0.70, 0.64, 0.52) * 1.06;
    ${LOOKOUT_BEVELS}
    if (y < 1.32 || (y > 4.28 && y < 4.52)) {
    ${BEVELS}
    }
  }
`;

const GLSL_EMIT = /* glsl */`
  // ---- Gulper Aquarium: the stair flanks' portholes, lit from within (a little by day, more at dusk)
  totalEmissiveRadiance += gAqWin * diffuseColor.rgb * (0.35 + 1.6 * uAqNight) * (1.0 - gInk);
  // ---- Gulper Aquarium: dusk light pools and the Glass Walk's under-glow (floorart.js)
  if (uAqNight > 0.01 && gAqTop > 0.5) {
    vec2 q = vWPos.z > 0.0 ? -vWPos.xz : vWPos.xz;
    float pool = 0.0;
    for (int i = 0; i < 24; i++) {
      if (i >= uAqPoolN) break;
      vec4 P = uAqPool[i];
      float d = length(q - P.xy) / P.z;
      pool += P.w * (1.0 - smoothstep(0.0, 1.0, d)) * (1.0 - smoothstep(0.0, 1.0, d));
    }
    // the Great Tank's glow on the court round it, and the Reef Windows' on the arcade floor in front of them
    float rq = length(q), rc = length(vWPos.xz);
    pool += 0.4 * smoothstep(10.5, 7.6, rc) * step(vWPos.y, 0.6);
    float ba = atan(q.y, q.x) * 57.2958;
    pool += 0.28 * smoothstep(26.5, 30.4, rq) * step(rq, 30.6) * step(-70.0, ba) * step(ba, -2.6) * step(vWPos.y, 0.6);
    totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.84, 0.62) * min(pool, 0.9) * uAqNight * 1.4;
    totalEmissiveRadiance += gAqGlow * uAqNight * (1.0 - 0.75 * gInk);
  }
`;
