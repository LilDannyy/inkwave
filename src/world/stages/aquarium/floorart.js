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
import { W, pol, C30, LOOKOUT, TBAY, PLANTERS, PENGUIN, PUMPS, DAIS, TICKET } from './geo.js';

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

// ---- fix round 5 (the complete eye-level sweep): Penguin Point's rockwork, its basking rock and ice pile, the pump sets,
// the touch pool's dais and step, the Ticket Hall's plaza, west and east faces — all on inkable cover, so all under the ink.
// Relief goes through the level's own normal path (gTexN, as the texture library's): it lights like the surfaces' relief
// and flattens under the ink like theirs
const R5_PARS = /* glsl */`
float aqVN(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(aqH22(i).x, aqH22(i + vec2(1.0, 0.0)).x, f.x), mix(aqH22(i + vec2(0.0, 1.0)).x, aqH22(i + vec2(1.0, 1.0)).x, f.x), f.y);
}
// a world-space normal into the level's relief (the face's tangent frame, as levelMaterial.js builds it)
void aqRelief(vec3 n) {
  vec3 T = normalize(vFaceTan - vWNorm * dot(vFaceTan, vWNorm)), Bt = cross(vWNorm, T);
  gTexN = vec3(dot(n, T), dot(n, Bt), dot(n, vWNorm)); gTexStr = 1.0;
}
// cast rockwork (the touch pools' language, drawn): rounded stones in a jittered running bond (sz a stone's size, metres),
// each domed out of the dark crevices between them. Returns (dome 0…1, its slope per metre along p.x and p.y, the stone's
// id); e: 0 on a crevice … about 0.5 in a stone's middle
vec4 aqStones(vec2 p, vec2 sz, float seed, out float e) {
  vec2 g = p / sz;
  float j0 = floor(g.y), i0 = floor(g.x - 0.5 * mod(j0, 2.0)), d1 = 9.0, d2 = 9.0, id = 0.0;
  vec2 c1 = g, c2 = g;
  for (int dj = -1; dj <= 1; dj++) for (int di = -1; di <= 2; di++) {
    float j = j0 + float(dj), i = i0 + float(di);
    vec2 h = aqH22(vec2(i, j) + seed);
    vec2 c = vec2(i + 0.5 + 0.5 * mod(j, 2.0) + 0.5 * (h.x - 0.5), j + 0.5 + 0.35 * (h.y - 0.5));
    float d = length(g - c);
    if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = c; id = h.y; } else if (d < d2) { d2 = d; c2 = c; }
  }
  e = d2 - d1;
  vec2 ge = (g - c2) / max(d2, 1e-3) - (g - c1) / max(d1, 1e-3);
  float x = clamp(e / 0.42, 0.04, 1.0), dd = e < 0.42 ? 0.6 * pow(x, -0.4) / 0.42 : 0.0;
  return vec4(pow(x, 0.6), ge * dd / sz, id);
}
// a Penguin Point rock face: pale faux-Antarctic rockwork in DESIGN §5.4's penguin rock (#8d8a84 … #bfc5c7) — rounded
// stones in courses, dark crevices, lit ledges and shaded undersides — on a granite foot, under a snow lip with icicles,
// a few guano streaks down from it. t along the face, y height, y0 the floor it stands on, top its top; Tw, N the face's
// along and out directions (world)
vec3 aqRockFace(float t, float y, float y0, float top, vec3 Tw, vec3 N, float seed, float aa, out float rough) {
  vec2 pq = vec2(t, y - y0); pq += 0.09 * vec2(aqVN(pq * 1.9 + seed), aqVN(pq * 1.9 + seed + 5.3)) - 0.045;   // (wandering courses)
  float e; vec4 st = aqStones(pq, vec2(0.6, 0.38), seed, e);
  float lipY = top - 0.1 - 0.06 * (0.5 + 0.5 * sin(t * 3.7 + seed)) - 0.05 * aqVN(vec2(t * 6.0, seed));
  float foot = y - y0, ease = smoothstep(0.1, 0.2, foot) * smoothstep(lipY + 0.01, lipY - 0.07, y);
  vec2 gr = st.yz * 0.075 * ease; float gl = length(gr); if (gl > 1.1) gr *= 1.1 / gl;
  vec3 n = normalize(N - gr.x * Tw - vec3(0.0, gr.y, 0.0));
  float k = aqH22(vec2(st.w * 17.0, seed + 1.0)).x;
  vec3 c = mix(vec3(0.27, 0.26, 0.235), vec3(0.52, 0.565, 0.58), 0.55 + 0.45 * st.w) * (0.92 + 0.12 * k) * vec3(1.04, 1.0, 0.95);
  c *= mix(1.0, mix(0.42, 1.0, smoothstep(0.0, 0.16, e)), ease);                  // the crevices
  c *= 1.0 + 0.3 * max(0.0, n.y) - 0.28 * max(0.0, -n.y);                         // ledges lit, undersides shaded
  c *= 0.93 + 0.12 * aqVN(vec2(t, y) * 23.0);
  // lichen: a few muted ochre spots on some stones
  c = mix(c, vec3(0.42, 0.3, 0.12), step(0.86, k) * smoothstep(0.62, 0.7, aqVN(vec2(t, y) * 9.0 + seed)) * 0.55 * ease);
  // guano streaks down from the lip
  float gi = floor(t / 1.9), gk = aqH22(vec2(gi, seed + 5.0)).x, gx = t - (gi + 0.3 + 0.4 * gk) * 1.9;
  float streak = step(gk, 0.5) * aqFill(abs(gx + 0.02 * sin(y * 13.0)) - 0.025 + 0.02 * (lipY - y), aa) * smoothstep(lipY - 0.45 - 0.5 * gk, lipY - 0.05, y) * step(y, lipY);
  c = mix(c, vec3(0.74, 0.72, 0.64), streak * 0.55);
  // the granite foot
  c = mix(c, vec3(0.07, 0.075, 0.08) * (0.85 + 0.3 * aqVN(vec2(t * 9.0, y * 9.0))), aqFill(foot - 0.11, aa));
  // icicles under the snow lip, the lip's shadow, the snow
  float cell = floor(t / 0.085); vec2 ih = aqH22(vec2(cell, seed + 3.0));
  float tc = (cell + 0.25 + 0.5 * ih.y) * 0.085, L = 0.03 + 0.15 * ih.x * ih.x, dy = lipY - y;
  float ic = step(0.35, ih.x) * step(0.0, dy) * step(dy, L) * aqFill(abs(t - tc) - 0.017 * (1.0 - dy / L), aa);
  c = mix(c, vec3(0.6, 0.72, 0.8), ic * 0.9);
  float snow = aqFill(lipY - y, aa);
  c *= 1.0 - 0.4 * aqFill(abs(dy - 0.015) - 0.015, aa) * (1.0 - snow) * (1.0 - ic);
  c = mix(c, vec3(0.8, 0.85, 0.9) * (0.93 + 0.07 * aqVN(vec2(t * 5.0, y * 25.0))), snow);
  rough = mix(mix(0.9, 0.4, ic), 0.8, snow);
  if (snow > 0.5) n = normalize(N + vec3(0.0, 0.7, 0.0));
  aqRelief(n);
  return c;
}
// a penguin's footprint (metres; toes toward −x)
float aqPrint(vec2 d, float aa) {
  float s = min(min(aqSeg(d, vec2(0.03, 0.0), vec2(-0.035, -0.032)), aqSeg(d, vec2(0.03, 0.0), vec2(-0.048, 0.0))), aqSeg(d, vec2(0.03, 0.0), vec2(-0.035, 0.032)));
  return aqFill(s - 0.009, aa);
}
// a trail of them toward the glass (p = (s, w) in the blade frame; the glass is at −w): wandering about s0, from w0 to w1
float aqTrail(vec2 p, float s0, float w0, float w1, float k, float aa) {
  if (p.y > w0 || p.y < w1) return 0.0;
  float sc = s0 + 0.45 * sin(p.y * 0.7 + k * 2.1) + 0.15 * sin(p.y * 2.3 + k);
  float u = p.y / 0.17, n = floor(u), side = mod(n, 2.0) < 1.0 ? 1.0 : -1.0;
  return aqPrint(vec2((u - n - 0.5) * 0.17, p.x - sc - side * 0.055), aa);
}
// a Penguin Point rock top: pale rock slabs with wandering cracks, snow lying toward the glass (glass 0…1), guano
// splashes; p in metres (the blade frame) (its rounded edge is snow: the bevels' branch)
vec3 aqRockTop(vec2 p, float glass, float aa, out float rough) {
  vec2 pw = p + 0.14 * vec2(aqVN(p * 1.4), aqVN(p * 1.4 + 7.1));
  vec2 g = pw / 1.2, i0 = floor(g);
  float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 o = vec2(float(xx), float(yy)), h = aqH22(i0 + o + 31.0), cc = i0 + o + 0.2 + 0.6 * h;
    float d = length(g - cc); if (d < d1) { d2 = d1; d1 = d; id = h.x; } else if (d < d2) d2 = d;
  }
  float gap = (d2 - d1) * 1.2;
  vec3 c = mix(vec3(0.33, 0.325, 0.305), vec3(0.56, 0.585, 0.585), 0.3 + 0.6 * id) * (0.93 + 0.1 * aqVN(p * 3.1)) * (0.94 + 0.09 * aqVN(p * 37.0));
  c *= 1.0 - 0.55 * aqFill(gap - 0.011, aa);                       // the cracks
  c *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.09, gap));            // worn arrises
  // guano splashes
  vec2 gq = p / 0.8, gi = floor(gq), gh = aqH22(gi + 91.0);
  float gd = length((fract(gq) - 0.25 - 0.5 * gh) * 0.8);
  c = mix(c, vec3(0.78, 0.77, 0.7), step(0.84, gh.x) * aqFill(gd - 0.035 - 0.05 * gh.y * aqVN(p * 21.0), aa) * 0.85);
  // snow, drifted toward the glass and into the slabs' cracks
  float sn = aqVN(p * 0.5 + 3.0) * 0.58 + aqVN(p * 1.7) * 0.3 + aqVN(p * 6.0) * 0.12 + 0.24 * glass + 0.12 * (1.0 - smoothstep(0.0, 0.05, gap));
  float snow = smoothstep(0.66, 0.71, sn);
  c = mix(c, vec3(0.8, 0.85, 0.9) * (0.94 + 0.06 * aqVN(p * 13.0)), snow);
  c *= 1.0 - 0.18 * (smoothstep(0.6, 0.66, sn) - snow);           // the drift's blue-grey margin
  rough = mix(0.88, 0.75, snow);
  return c;
}
// the ice pile's blocks (fix round 5): stacked ice — blue-white, deeper blue toward each block's middle (a little
// translucency), frosted edges, dark seams, a fracture and bubbles inside; p in metres on the face (along, up from its
// foot); writes the pillowed relief
vec3 aqIce(vec2 p, vec3 Tw, vec3 N, vec3 Up, float aa, out float rough) {
  float row = floor(p.y / 0.5), bx = (p.x + 0.31 * mod(row, 2.0)) / 0.62, col = floor(bx);
  vec2 h = aqH22(vec2(col, row) + 5.0), f = vec2(fract(bx) * 0.62, fract(p.y / 0.5) * 0.5);
  float ed = min(min(f.x, 0.62 - f.x), min(f.y, 0.5 - f.y));
  vec3 c = mix(vec3(0.55, 0.74, 0.85), vec3(0.17, 0.4, 0.57) * (0.8 + 0.4 * h.x), smoothstep(0.02, 0.2, ed) * (0.55 + 0.3 * h.y) * (0.8 + 0.4 * (1.0 - f.y / 0.5)));
  vec2 a = vec2(0.1 + 0.4 * h.x, 0.05 + 0.15 * h.y), b = vec2(0.15 + 0.35 * h.y, 0.3 + 0.15 * h.x);
  c += vec3(0.16, 0.2, 0.22) * aqFill(aqSeg(f, a, b) - 0.003, aa) * smoothstep(0.02, 0.06, ed);    // a fracture
  vec2 bq = f / 0.045, bi = floor(bq), bh = aqH22(bi + vec2(col, row) * 7.0);
  c += vec3(0.25) * step(0.85, bh.x) * aqFill(length(fract(bq) - 0.5) * 0.045 - 0.005, aa) * smoothstep(0.03, 0.07, ed);   // bubbles
  float frost = aqFill(ed - 0.028 - 0.012 * aqVN(p * 31.0), aa);
  c = mix(c, vec3(0.8, 0.88, 0.94) * (0.92 + 0.08 * aqVN(p * 47.0)), frost);
  c = mix(c, vec3(0.04, 0.1, 0.15), aqFill(ed - 0.006, aa));      // the seams
  rough = mix(0.1, 0.6, frost);
  // pillowed: the normal turns toward each block's edges within 7 cm of them
  vec2 tilt = vec2(smoothstep(0.07, 0.0, f.x) * -1.0 + smoothstep(0.55, 0.62, f.x), smoothstep(0.07, 0.0, f.y) * -1.0 + smoothstep(0.43, 0.5, f.y));
  aqRelief(normalize(N + 0.75 * (tilt.x * Tw + tilt.y * Up)));
  return c;
}
// a pump set's casing (fix round 5, the Pump Hall; the props add a pipe stub, a flange and a red handwheel): a granite
// foot, a hazard band, a bolted sea-green bedplate, then on a long face the motor's drum lying along it (cooling ribs,
// two flanges, a brass nameplate) and on a short face the drum's flanged end with its bolt circle and the shaft's hub.
// t along the face from its middle, L the face's length, y over the foot (the casing is 1.0 tall)
vec3 aqPump(float t, float L, float y, float longF, vec3 Tw, vec3 N, float aa, out float rough, out float metal) {
  vec3 GRN = vec3(0.075, 0.16, 0.14), GRN2 = vec3(0.1, 0.22, 0.19), BR = vec3(0.56, 0.38, 0.15);
  vec3 c = GRN, n = N;
  rough = 0.42; metal = 0.0;
  if (y < 0.1) { c = vec3(0.06, 0.064, 0.07) * (0.9 + 0.2 * aqVN(vec2(t, y) * 11.0)); rough = 0.8; }
  else if (y < 0.17) { c = mix(vec3(0.02), vec3(0.72, 0.5, 0.06), step(0.5, fract((t + y) / 0.12))); rough = 0.6; }
  else if (y < 0.3) {
    c = GRN * 0.8;
    float bolt = aqFill(length(vec2(mod(t + 0.06, 0.24) - 0.12, y - 0.235)) - 0.016, aa);
    c = mix(c, vec3(0.26, 0.28, 0.28), bolt); metal = 0.6 * bolt;
    c *= 1.0 - 0.45 * aqFill(abs(y - 0.297) - 0.005, aa);
  } else if (longF > 0.5) {
    float ty = (y - 0.63) / 0.3, hl = L * 0.5 - 0.12;
    if (abs(ty) < 1.0 && abs(t) < hl) {
      float sn = clamp(ty, -0.96, 0.96);
      n = normalize(N * sqrt(1.0 - sn * sn) + vec3(0.0, sn, 0.0));
      c = GRN2 * (0.75 + 0.35 * (1.0 - abs(sn)));
      c *= 1.0 - 0.38 * aqFill(abs(fract(t / 0.06) - 0.5) * 0.06 - 0.007, aa) * step(abs(t), hl - 0.3) * step(abs(ty), 0.9);   // cooling ribs
      float fl = aqFill(abs(abs(t) - (hl - 0.14)) - 0.04, aa);                                      // the flanges
      c = mix(c, GRN2 * 1.3 * (0.8 + 0.3 * (1.0 - abs(sn))), fl);
      float fb = aqFill(length(vec2(abs(t) - (hl - 0.14), mod(y - 0.63 + 0.04, 0.08) - 0.04)) - 0.012, aa) * fl;
      c = mix(c, vec3(0.25, 0.27, 0.27), fb); metal = 0.6 * fb;
      vec2 np = vec2(t - 0.12, y - 0.66);                                                           // the nameplate
      float plate = aqFill(max(abs(np.x) - 0.15, abs(np.y) - 0.065), aa);
      c = mix(c, BR * (0.9 + 0.2 * aqVN(np * 40.0)), plate);
      c = mix(c, vec3(0.05, 0.04, 0.03), plate * aqFill(abs(abs(np.y - 0.005) - 0.025) - 0.006, aa) * step(abs(np.x), 0.11));
      metal = mix(metal, 0.7, plate); rough = mix(rough, 0.3, plate);
      c *= 1.0 - 0.5 * aqFill(abs(abs(ty) - 1.0) * 0.3 - 0.008, aa);
    } else c = GRN * 0.92;
  } else {
    vec2 d = vec2(t, y - 0.63); float r = length(d);
    if (r < 0.31) {
      float rr = r / 0.31; n = normalize(N + 0.5 * rr * (Tw * d.x + vec3(0.0, d.y, 0.0)) / max(r, 1e-3));
      c = GRN2 * (0.9 + 0.2 * (1.0 - rr));
      float bolts = aqFill(length(vec2(fract(atan(d.y, d.x) / 0.5236 + 0.5) - 0.5, 0.0) * 0.5236 * 0.25 + vec2(0.0, r - 0.25)) - 0.014, aa);
      c = mix(c, vec3(0.26, 0.28, 0.28), bolts); metal = 0.6 * bolts;
      c *= 1.0 - 0.5 * aqFill(abs(r - 0.3) - 0.006, aa);
      float hub = aqFill(r - 0.07, aa);
      c = mix(c, vec3(0.3, 0.32, 0.33) * (1.0 + 0.3 * (0.07 - r) / 0.07), hub); metal = max(metal, 0.7 * hub);
    } else c = GRN * 0.92;
  }
  c *= 1.0 - 0.3 * smoothstep(0.93, 1.0, y);
  aqRelief(n);
  return c;
}
// checker plate (the pump sets' covers): raised lozenges in a basket weave
vec3 aqTread(vec2 p, float aa) {
  vec2 cell = floor(p / 0.06), g = fract(p / 0.06) - 0.5;
  float sg = mod(cell.x + cell.y, 2.0) < 1.0 ? 1.0 : -1.0;
  vec2 r = vec2(g.x + sg * g.y, g.x - sg * g.y) * 0.7071;
  float dia = aqFill(max(abs(r.x) - 0.3, abs(r.y) - 0.065) * 0.06, aa);
  return vec3(0.2, 0.215, 0.22) * (0.9 + 0.12 * aqVN(p * 3.0)) * (1.0 + 0.45 * dia);
}
// cast-stone flags (the touch pool's dais and step): 0.6 × 0.45 m in a running bond, fine dark joints
vec3 aqFlags(vec2 p, vec3 stc, float aa) {
  float row = floor(p.y / 0.45), sx = p.x + 0.3 * mod(row, 2.0);
  vec2 f = vec2(fract(sx / 0.6) * 0.6, fract(p.y / 0.45) * 0.45);
  float j = min(min(f.x, 0.6 - f.x), min(f.y, 0.45 - f.y));
  vec3 c = stc * (0.93 + 0.1 * aqH22(vec2(floor(sx / 0.6), row)).x) * (0.95 + 0.07 * aqVN(p * 19.0));
  return c * (1.0 - 0.3 * aqFill(j - 0.005, aa));
}
// a stair's flank (fix round 5: the grand stair, the Penguin Steps, the Ticket Hall's stair; the deck stair's are round 2's):
// white render in the deck stair flanks' language — a black-granite skirting with a brass line over the floor it stands on,
// the brass string-course's shadow (props) and three faience speed lines down the rake; d metres in from the rake (square
// to it), hb over the floor
vec3 aqFlank(float d, float hb, float aa, float big, float fine, out float rough, out float metal) {
  vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
  vec3 c = REN;
  c *= 1.0 - 0.18 * aqFill(abs(d - 0.1) - 0.02, aa);
  float dl = min(abs(d - 0.3), min(abs(d - 0.44), abs(d - 0.58)));
  float band = aqFill(dl - 0.03, aa), grout = aqFill(abs(dl - 0.03) - 0.005, aa);
  c = mix(c, vec3(0.33, 0.45, 0.39) * (0.96 + 0.05 * fine), band); c *= 1.0 - 0.22 * grout;
  c = mix(c, vec3(0.045, 0.048, 0.052) * 1.5, aqFill(hb - 0.15, aa));
  float sk = aqFill(abs(hb - 0.157) - 0.008, aa);
  c = mix(c, vec3(0.56, 0.38, 0.15), sk);
  rough = mix(mix(0.85, 0.25, band), 0.3, sk); metal = 0.65 * sk;
  return c;
}
// a raised teak deck's face in the Lookouts' language (fix round 5: the Kelp Balconies, the Fin Pavilion's flank walls by
// its stairs): white render over a black-granite skirting with a brass line, three faience speed lines, the deck's rounded
// edge a teak fascia board over a brass nosing strip; hb over the floor (or the stair's rake) at its foot, yt its top, y
vec3 aqDeckFace(float t, float y, float hb, float yt, float aa, float big, float fine, out float rough, out float metal) {
  vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
  vec3 c = REN;
  c = mix(c, vec3(0.045, 0.048, 0.052) * 1.5, aqFill(hb - 0.16, aa));
  float sk = aqFill(abs(hb - 0.167) - 0.007, aa);
  float l0 = yt - 0.47, dl = min(abs(y - l0), min(abs(y - l0 - 0.1), abs(y - l0 - 0.2)));
  float band = aqFill(dl - 0.026, aa), grout = aqFill(abs(dl - 0.026) - 0.004, aa);
  c = mix(c, vec3(0.33, 0.45, 0.39), band * step(0.2, hb)); c *= 1.0 - 0.22 * grout * step(0.2, hb);
  float board = aqFill(yt - 0.14 - y, aa);
  vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.82 + 0.25 * fine) * (0.92 + 0.08 * sin(t * 9.0 + 2.0 * sin(t * 2.3)));
  c = mix(c * (1.0 - 0.35 * aqFill(abs(y - yt + 0.17) - 0.01, aa)), TEAK, board);
  float nose = aqFill(abs(y - yt + 0.148) - 0.013, aa);
  c = mix(c, vec3(0.56, 0.38, 0.15) * (1.05 + 0.15 * smoothstep(0.0, 0.013, y - yt + 0.148)), max(nose, sk));
  rough = mix(mix(mix(0.85, 0.25, band), 0.3, max(nose, sk)), 0.55, board); metal = 0.65 * max(nose, sk);
  return c;
}
// a stack of folded deckchairs seen from the side (fix round 5: the promenade's deckchair stack): eight chairs in layers,
// each a little askew — a teak frame rail under its striped canvas's folded edge — their uprights at the stack's ends; t
// along the face from its middle, hl its half length, h over the promenade
vec3 aqChairs(float t, float hl, float h, float aa, out float rough) {
  float k = floor(h / 0.15), f = fract(h / 0.15);
  vec2 hh = aqH22(vec2(k, 3.0));
  float tt = t + (hh.x - 0.5) * 0.08;
  vec3 TEAK = vec3(0.3, 0.2, 0.12) * (0.82 + 0.25 * aqVN(vec2(tt * 3.0, k * 1.7)));
  int ci = int(mod(k + floor(hh.y * 3.0), 4.0));
  vec3 cA = ci == 0 ? vec3(0.36, 0.2, 0.17) : (ci == 1 ? vec3(0.12, 0.14, 0.2) : (ci == 2 ? vec3(0.27, 0.35, 0.31) : vec3(0.42, 0.34, 0.17)));
  vec3 canvas = mix(cA, vec3(0.72, 0.68, 0.58), step(0.5, fract(tt / 0.11))) * (0.72 + 0.32 * smoothstep(0.3, 0.85, f));   // (muted: the ink stays the loudest)
  vec3 c = mix(TEAK, canvas, step(0.36, f));
  c *= 1.0 - 0.55 * aqFill(min(f, 1.0 - f) * 0.15 - 0.008, aa);                    // the dark gap between two chairs
  c = mix(c, TEAK * 0.9, step(hl - 0.07, abs(t)));                                     // the uprights at the ends
  rough = mix(0.6, 0.85, step(0.36, f));
  return c;
}
// a bed of sea-worn pebbles and shell grit (fix round 5: the diving helmet's bed)
vec3 aqPebbles(vec2 p, float aa) {
  vec2 g = p / 0.09, i0 = floor(g); float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 o = vec2(float(xx), float(yy)), h = aqH22(i0 + o + 17.0), cc = i0 + o + 0.15 + 0.7 * h;
    float d = length(g - cc); if (d < d1) { d2 = d1; d1 = d; id = h; } else if (d < d2) d2 = d;
  }
  vec3 SAND = vec3(0.5, 0.42, 0.3);
  vec3 peb = mix(vec3(0.34, 0.33, 0.31), vec3(0.62, 0.58, 0.5), id.x) * (id.y > 0.8 ? vec3(1.1, 0.95, 0.8) : vec3(1.0));
  float gap = (d2 - d1) * 0.09;
  return mix(SAND * (0.85 + 0.2 * aqVN(p * 60.0)), peb * (0.8 + 0.3 * smoothstep(0.0, 0.03, gap)), smoothstep(0.004, 0.012, gap));
}
// the shark-viewing bench's faces (fix round 5): on the long faces a teak back and seat front in slats between brass end
// posts over a dark kick space; on the ends a brass Deco end frame; t along the face from its middle, hl its half length
vec3 aqBench(float t, float hl, float y, float longF, float aa, out float rough, out float metal) {
  vec3 TEAK = vec3(0.3, 0.2, 0.12), BR = vec3(0.56, 0.38, 0.15);
  vec3 c; rough = 0.6; metal = 0.0;
  if (y < 0.1) { c = vec3(0.04, 0.042, 0.045); rough = 0.8; }
  else {
    float sl = y < 0.45 ? fract((y - 0.1) / 0.115) : fract((y - 0.45) / 0.112);
    c = TEAK * (0.8 + 0.3 * aqVN(vec2(t * 2.0, floor(y / 0.11) * 3.1))) * (1.0 - 0.6 * aqFill(min(sl, 1.0 - sl) * 0.11 - 0.006, aa));
    c *= 1.0 - 0.5 * aqFill(abs(y - 0.45) - 0.012, aa);                              // the seat's edge
    float post = longF > 0.5 ? step(hl - 0.07, abs(t)) : 0.0;
    float fr = longF > 0.5 ? 0.0 : aqFill(abs(length(vec2(t, y - 0.5) / vec2(1.0, 1.3)) - 0.22) - 0.022, aa) + aqFill(abs(abs(t) - (hl - 0.03)) - 0.025, aa);
    float rail = aqFill(abs(y - 0.86) - 0.018, aa);
    float br = clamp(post + fr + rail, 0.0, 1.0);
    c = mix(c, BR * (0.9 + 0.2 * aqVN(vec2(t, y) * 30.0)), br); metal = 0.7 * br; rough = mix(0.6, 0.3, br);
  }
  return c;
}
// on a face of a world box b = (x0, x1, z0, z1) (Alpha's frame): t along it from its middle, hl its half length, td the
// direction t runs (Alpha's frame)
bool aqBoxFace(vec2 q, vec2 nq, vec4 b, out float t, out float hl, out vec2 td) {
  float ex = min(q.x - b.x, b.y - q.x), ez = min(q.y - b.z, b.w - q.y);
  t = 0.0; hl = 0.0; td = vec2(0.0);
  if (ex < -0.015 || ez < -0.015) return false;
  if (abs(nq.x) > 0.95 && ex < 0.015) { t = q.y - 0.5 * (b.z + b.w); hl = 0.5 * (b.w - b.z); td = vec2(0.0, 1.0); return true; }
  if (abs(nq.y) > 0.95 && ez < 0.015) { t = q.x - 0.5 * (b.x + b.y); hl = 0.5 * (b.y - b.x); td = vec2(1.0, 0.0); return true; }
  return false;
}
// the same for a blade box b = (s0, s1, w0, w1): sw, nb the point and the normal in the blade frame
bool aqBladeFace(vec2 sw, vec2 nb, vec4 b, out float t, out float hl, out vec2 td) {
  float es = min(sw.x - b.x, b.y - sw.x), ew = min(sw.y - b.z, b.w - sw.y);
  t = 0.0; hl = 0.0; td = vec2(0.0);
  if (es < -0.015 || ew < -0.015) return false;
  if (abs(nb.x) > 0.95 && es < 0.015) { t = sw.y - 0.5 * (b.z + b.w); hl = 0.5 * (b.w - b.z); td = vec2(0.866, 0.5); return true; }    // (an s face: t runs along w)
  if (abs(nb.y) > 0.95 && ew < 0.015) { t = sw.x - 0.5 * (b.x + b.y); hl = 0.5 * (b.y - b.x); td = vec2(0.5, -0.866); return true; }   // (a w face: along s)
  return false;
}
// a white-render face (the Ticket Hall's plaza, west and east faces): black granite skirting with a brass line, three
// faience speed lines, the shadow under its rounded top edge; h over its foot, H its height
vec3 aqRenderFace(float h, float H, float aa, float big, float fine, out float rough, out float metal) {
  vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
  vec3 c = REN;
  float dl = min(abs(h - 0.7), min(abs(h - 0.8), abs(h - 0.9)));
  float band = aqFill(dl - 0.026, aa), grout = aqFill(abs(dl - 0.026) - 0.004, aa);
  c = mix(c, vec3(0.33, 0.45, 0.39), band); c *= 1.0 - 0.22 * grout;
  c *= 1.0 - 0.3 * aqFill(abs(h - (H - 0.15)) - 0.012, aa);
  c = mix(c, vec3(0.045, 0.048, 0.052) * 1.5, aqFill(h - 0.16, aa));
  float br = aqFill(abs(h - 0.167) - 0.007, aa);
  c = mix(c, vec3(0.56, 0.38, 0.15), br);
  rough = mix(mix(0.85, 0.25, band), 0.3, br); metal = 0.65 * br;
  return c;
}
`;

// ---- fix round 6 (LEAD-REVIEW 6's list): the Feeding Step, the Kelp Ramps' parapets, the whale-tail benches, the trolley
// stacks, the ice-cream carts' stripes — all on inkable cover, so all under the ink (their props: plates, corner guards,
// pilasters, flukes, casters and push bars, within 8.5 cm of a face and below its walkable top)
const R6_PARS = /* glsl */`
// the Feeding Step's faces: the riser's language round its corners — white render over a black-granite skirting with a
// brass line, three faience speed lines under the riser mural's faience wave at its height (side > 0.5: the riser keeps its
// mural), a teak fascia over a brass nosing along the top edge; t along the face, y over the court
vec3 aqFeedFace(float t, float y, float side, float aa, float big, float fine, out float rough, out float metal) {
  vec3 c = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
  float band = 0.0, grout = 0.0;
  if (side > 0.5) {
    float dl = min(abs(y - 0.62), min(abs(y - 0.7), abs(y - 0.78)));
    band = aqFill(dl - 0.022, aa); grout = aqFill(abs(dl - 0.022) - 0.004, aa);
    band = max(band, aqFill(abs(y - 0.974 - 0.033 * sin(t * 43.63)) - 0.015, aa));    // (the mural's wave: 14.4 cm a wave)
  }
  c = mix(c, vec3(0.33, 0.45, 0.39) * (0.96 + 0.05 * fine), band); c *= 1.0 - 0.22 * grout;
  c = mix(c, vec3(0.045, 0.048, 0.052) * 1.5, aqFill(y - 0.088, aa));
  float br = max(aqFill(abs(y - 0.094) - 0.006, aa), aqFill(abs(y - 1.07) - 0.008, aa));
  vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.82 + 0.25 * fine) * (0.92 + 0.08 * sin(t * 9.0 + 2.0 * sin(t * 2.3)));
  float board = aqFill(1.078 - y, aa);
  c = mix(c, TEAK * (1.0 - 0.3 * aqFill(abs(y - 1.15) - 0.004, aa)), board);
  c = mix(c, vec3(0.56, 0.38, 0.15) * (1.0 + 0.12 * fine), br);
  rough = mix(mix(mix(0.85, 0.25, band), 0.55, board), 0.3, br); metal = 0.65 * br;
  return c;
}
// the Feeding Step's top: the Feeding Deck's teak planks (staggered butt joints, dark caulk) inside a brass border, a brass
// KEEP CLEAR wave between two rails across it toward the deck; p in the step's frame (x along it from its middle, y from
// its front edge toward the deck), e metres in from its outline (the fascia's rounding over it: teak)
vec3 aqFeedTop(vec2 p, float e, float aa, float fine, out float rough, out float metal) {
  float k = floor(p.y / 0.145), f = fract(p.y / 0.145), off = 7.0 * aqH22(vec2(k, 2.0)).x;
  float bj = fract((p.x + off) / 1.9);
  vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.8 + 0.25 * aqH22(vec2(k, floor((p.x + off) / 1.9))).x) * (0.92 + 0.1 * aqVN(vec2(p.x * 3.0, k * 5.1)));
  vec3 c = TEAK * (1.0 - 0.55 * aqFill(min(f, 1.0 - f) * 0.145 - 0.006, aa)) * (1.0 - 0.45 * aqFill(min(bj, 1.0 - bj) * 1.9 - 0.004, aa));
  c = mix(c, vec3(0.30, 0.20, 0.12) * 0.95, aqFill(e - 0.14, aa));
  float zb = 2.6 - p.y;
  float wv = aqFill(abs(zb - 0.45 - 0.05 * sin(p.x * 25.13)) - 0.014, aa) + aqFill(abs(abs(zb - 0.45) - 0.12) - 0.01, aa);
  float br = clamp(aqFill(abs(e - 0.17) - 0.016, aa) + wv * step(0.19, e), 0.0, 1.0);
  c = mix(c, vec3(0.56, 0.38, 0.15) * (1.0 + 0.12 * fine), br);
  rough = mix(0.62, 0.3, br); metal = 0.65 * br;
  return c;
}
// the whale-tail bench (its bronze flukes at the ends: props): a back-to-back promenade bench — on its long faces the seat's
// teak apron under a brass-nosed seat edge, the backrest's upright slats between brass rails, a teak cap, brass end posts;
// on its ends a teak panel in a brass frame; t along the face from its middle, hl its half length, y over the floor
vec3 aqWBench(float t, float hl, float y, float longF, float aa, float fine, out float rough, out float metal) {
  vec3 TEAK = vec3(0.3, 0.2, 0.12), BR = vec3(0.56, 0.38, 0.15);
  rough = 0.5; metal = 0.0;
  if (y < 0.08) return vec3(0.045, 0.048, 0.052) * 1.4;
  vec3 c; float br;
  if (longF > 0.5) {
    if (y < 0.44) { float sl = fract((y - 0.08) / 0.09); c = TEAK * (0.8 + 0.3 * aqVN(vec2(t * 2.0, floor(y / 0.09) * 3.1))) * (1.0 - 0.6 * aqFill(min(sl, 1.0 - sl) * 0.09 - 0.005, aa)); }
    else { float sl = fract((t + 7.0) / 0.1); c = TEAK * (0.85 + 0.3 * aqVN(vec2(floor((t + 7.0) / 0.1) * 2.7, y * 2.0))) * (1.0 - 0.6 * aqFill(min(sl, 1.0 - sl) * 0.1 - 0.006, aa)); }
    if (y > 1.11) c = TEAK * (0.85 + 0.2 * fine);
    c *= 1.0 - 0.55 * aqFill(abs(y - 0.478) - 0.01, aa);
    br = aqFill(abs(y - 0.455) - 0.016, aa) + aqFill(abs(y - 0.8) - 0.013, aa) + aqFill(abs(y - 1.095) - 0.015, aa) + step(hl - 0.08, abs(t));
  } else {
    c = TEAK * (0.85 + 0.25 * aqVN(vec2(t, y) * 4.0));
    br = aqFill(abs(abs(t) - (hl - 0.06)) - 0.03, aa) + aqFill(abs(y - 1.095) - 0.015, aa) + aqFill(abs(y - 0.12) - 0.015, aa);
  }
  br = clamp(br, 0.0, 1.0);
  c = mix(c, BR * (0.9 + 0.2 * fine), br); metal = 0.7 * br; rough = mix(0.6, 0.3, br);
  return c;
}
// nested luggage trolleys seen from the side (the trolley stack; their casters and push bars: props): through upright
// bars every 12 cm the shade inside and the luggage on the bottom deck, a thicker steel upright where each trolley ends
// (nested 38 cm apart), steel deck and mid rails, a brass top rail; t along the face, hl its half length, y, H the top
vec3 aqCage(float t, float hl, float y, float H, float longF, float aa, float fine, out float rough, out float metal) {
  vec3 STEEL = vec3(0.25, 0.28, 0.3), BR = vec3(0.56, 0.38, 0.15);
  vec3 c = vec3(0.035, 0.04, 0.045);
  if (longF > 0.5 && y > 0.32 && y < 0.95) {
    float u = (t + hl) / (2.0 * hl);
    vec3 L = u < 0.36 ? vec3(0.32, 0.19, 0.1) : (u < 0.7 ? vec3(0.12, 0.23, 0.25) : vec3(0.4, 0.33, 0.21));
    float top = u < 0.36 ? 0.78 : (u < 0.7 ? 0.62 : 0.9), gap = min(abs(u - 0.36), abs(u - 0.7)) * 2.0 * hl;
    float inC = aqFill(y - top, aa) * (1.0 - aqFill(gap - 0.03, aa));
    c = mix(c, L * (0.55 + 0.15 * fine) * (1.0 - 0.35 * aqFill(abs(y - top + 0.07) - 0.012, aa)), inC);
  }
  float bar = aqFill(abs(fract((t + hl) / 0.12 + 0.5) - 0.5) * 0.12 - 0.009, aa) * step(0.3, y) * step(y, H - 0.06);
  float k = (t + hl - 0.05) / 0.38, up = aqFill(abs(fract(k + 0.5) - 0.5) * 0.38 - 0.022, aa) * step(-0.2, k);
  float rail = aqFill(abs(y - 0.29) - 0.03, aa) + aqFill(abs(y - 0.8) - 0.012, aa) + aqFill(abs(y - (H - 0.09)) - 0.016, aa);
  float brr = aqFill(abs(y - (H - 0.035)) - 0.022, aa);
  c = mix(c, STEEL * (0.85 + 0.25 * fine), clamp(bar + up + rail, 0.0, 1.0));
  c = mix(c, BR * (0.95 + 0.15 * fine), brr);
  if (y < 0.24) c = mix(vec3(0.03, 0.032, 0.035), STEEL * 0.7, up);
  float m = clamp(bar + up + rail + brr, 0.0, 1.0);
  rough = mix(0.85, 0.35, m); metal = 0.6 * m;
  return c;
}
// the Kelp Ramp's parapet: render in the stair flanks' language — a black-granite skirting with a brass line along its foot
// (the court, the promenade or the ramp's rake), three faience speed lines along the rake under a smooth coping band and
// its groove; d metres down from its sloping top, hb over its foot
vec3 aqParapet(float d, float hb, float aa, float big, float fine, out float rough, out float metal) {
  vec3 REN = vec3(0.84, 0.79, 0.70) * 0.86 * (1.0 + 0.05 * (big - 0.5) + 0.03 * (fine - 0.5));
  vec3 c = mix(REN, REN * 1.07, aqFill(d - 0.09, aa));
  c *= 1.0 - 0.4 * aqFill(abs(d - 0.1) - 0.008, aa);
  float dl = min(abs(d - 0.26), min(abs(d - 0.34), abs(d - 0.42)));
  float band = aqFill(dl - 0.022, aa), grout = aqFill(abs(dl - 0.022) - 0.004, aa);
  c = mix(c, vec3(0.33, 0.45, 0.39) * (0.96 + 0.05 * fine), band); c *= 1.0 - 0.22 * grout;
  c = mix(c, vec3(0.045, 0.048, 0.052) * 1.5, aqFill(hb - 0.15, aa));
  float sk = aqFill(abs(hb - 0.157) - 0.008, aa);
  c = mix(c, vec3(0.56, 0.38, 0.15), sk);
  rough = mix(mix(0.85, 0.25, band), 0.3, sk); metal = 0.65 * sk;
  return c;
}
`;

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
// (fix round 5: the same face in any cast stone, stc its colour; lines 0 leaves out the speed lines — the touch pool's dais
// and step)
vec3 aqStoneFace(float t, float h, float H, float cope, float aa, float big, float fine, vec3 stc, float lines, out float rough, out float metal) {
  vec3 ST = stc * (0.93 + 0.08 * big + 0.05 * (fine - 0.5));
  vec3 GRAN = vec3(0.045, 0.048, 0.052), FAI = vec3(0.33, 0.45, 0.39), BRASS = vec3(0.56, 0.38, 0.15);
  vec3 c = ST;
  float hc = h - 0.13, row = floor(hc / 0.42), yc = H - cope;
  float jy = abs(fract(hc / 0.42 + 0.5) - 0.5) * 0.42, jx = abs(fract((t + 0.3 * mod(row, 2.0)) / 0.6 + 0.5) - 0.5) * 0.6;
  c *= 1.0 - 0.16 * aqFill(min(jy, jx) - 0.004, aa) * step(0.0, hc) * step(h, yc - 0.03);
  c = mix(c, GRAN * 1.6, aqFill(h - 0.12, aa));
  float br = aqFill(abs(h - 0.126) - 0.006, aa);
  float y1 = min(H * 0.46, yc - 0.2), l = min(abs(h - y1), abs(h - y1 - 0.075));
  float band = aqFill(l - 0.021, aa) * lines;
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
vec3 aqPlanterFace(float t, float h, float H, float cope, float aa, float big, float fine, out float rough, out float metal) {
  return aqStoneFace(t, h, H, cope, aa, big, fine, vec3(0.70, 0.64, 0.52), 1.0, rough, metal);
}
` + R5_PARS + R6_PARS;

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
          // (fix round 5, the lead's nit: the spokes' steps blend into the bed — their risers are the bed's own planting at
          // its tone, not dark soil under a darker leaf: from above they read as one bed, not straight cuts across it)
          base = mix(aqBed(vec2(t + 3.1, y * 1.6), 1.0, 0.0, aa, 0.0, vec2(0.0)) * 1.45, vec3(0.63, 0.58, 0.47), aqFill(${f4(o.r - bevOct(o) - 0.04)} - m, aa));   // (brighter: a riser is lit less than a top)
          gBaseRough = 0.9; gTexORM.b = 0.0;
          // (fix round 6, LEAD-REVIEW 6's nit: the 9 cm steps still drew a straight dark line across the bed — the riser and
          // the rounded edge over it lit as walls turned from the sun) the planting's own light: shaded as the bed is, up
          if (m < ${f4(o.r - bevOct(o) - 0.06)}) aqRelief(vec3(0.0, 1.0, 0.0)); else gTexStr *= 0.1;
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
      if (m < ${f4(o.r + 0.01)} && y > ${f4(o.top - 0.42)} && y < ${f4(o.top + 0.01)}) {
        base = m > ${f4(o.r - bevOct(o) - 0.04)} ? STb : aqBed(vWPos.xz, 1.0, 0.0, max(fwidth(vWPos.x) + fwidth(vWPos.z), 0.004), 0.0, vec2(0.0)) * 1.2;   // (fix round 5: the steps' rounded edges in the bed's planting)
        if (m < ${f4(o.r - bevOct(o) - 0.06)}) aqRelief(vec3(0.0, 1.0, 0.0));   // (fix round 6: and lit as the bed is, up)
      }
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

// ---- fix round 5: the GLSL for Penguin Point, the pump sets, the touch pool's dais and step, the Ticket Hall (Alpha's
// frame, from geo.js's numbers)
const v4 = (a) => `vec4(${a.map(f4).join(', ')})`;
const PG = PENGUIN;
// the rock pieces: [s0, s1, w0, w1, top] (the terrace's three, the upper rock)
const ROCKS = [...PG.rocks, PG.upper];
const BASK = PG.basking.b, ICE = PG.ice.b, P1 = PUMPS.box, P2 = [PUMPS.blade.s[0], PUMPS.blade.s[1], PUMPS.blade.w[0], PUMPS.blade.w[1]];
const DAISB = DAIS.b, STEPB = DAIS.step, TICK = TICKET.b;
const DAIS_C = 'vec3(0.62, 0.47, 0.39)';         // (the dais's cast stone: DESIGN §5.4's coral, half toward the planters' cream)
// penguins' footprint trails to the glass: [s0 the trail wanders about, w0 → w1, top]
const TRAILS5 = [[-8.6, -10.4, -16.6, 1.2], [3.2, -10.4, -17.4, 1.2], [7.6, -10.4, -16.6, 1.2], [17.4, -12.4, -16.6, 2.4]];
const SW = `vec2 sw = vec2(0.5 * q.x - ${CB} * (q.y + 32.5), ${CB} * q.x + 0.5 * (q.y + 32.5));`;
const inBlade = (r) => `(sw.x > ${f4(r[0] - 0.004)} && sw.x < ${f4(r[1] + 0.004)} && sw.y > ${f4(r[2] - 0.004)} && sw.y < ${f4(r[3] + 0.004)})`;
const inBox = (b, m = 0.004) => `(q.x > ${f4(b[0] - m)} && q.x < ${f4(b[1] + m)} && q.y > ${f4(b[2] - m)} && q.y < ${f4(b[3] + m)})`;
const R5_TOPS = `if (y > 0.45 && y < 2.45) {
      float r5r = 0.0;
      if (q.x < 1.5 && q.x > -24.5 && q.y < -22.0 && q.y > -61.0) {
        ${SW}
        // the basking rock's top: weathered rock, a guano splash, darker toward its rounded edge
        if (abs(y - ${f4(PG.basking.top)}) < 0.03 && ${inBox(BASK)}) {
          vec2 lq = q - vec2(${f4((BASK[0] + BASK[1]) / 2)}, ${f4((BASK[2] + BASK[3]) / 2)});
          base = aqRockTop(q * 1.6, 0.0, aa, r5r) * (1.0 - 0.3 * smoothstep(0.3, 0.6, max(abs(lq.x), abs(lq.y))));
          gBaseRough = r5r; gTexStr *= 0.1; gTexORM.b = 0.0;
        // the ice pile's top: its blocks seen from above, frosted
        } else if (abs(y - ${f4(PG.ice.top)}) < 0.03 && ${inBox(ICE)}) {
          float sg = vWPos.z > 0.0 ? -1.0 : 1.0;
          base = mix(aqIce(q - vec2(${f4(ICE[0])}, ${f4(ICE[2])}) + vec2(0.0, 0.25), sg * vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), sg * vec3(0.0, 0.0, 1.0), aa, r5r), vec3(0.82, 0.88, 0.93), 0.35);
          gBaseRough = r5r; gTexORM.b = 0.0;
        // the rock terrace (1.2) and the upper rock (2.4): pale slabs, snow toward the glass, guano, penguins' footprints
        } else if ((abs(y - 1.2) < 0.03 && (${PG.rocks.map(inBlade).join(' || ')})) || (abs(y - ${f4(PG.upper[4])}) < 0.03 && ${inBlade(PG.upper)})) {
          vec3 c = aqRockTop(sw, smoothstep(-13.0, -16.8, sw.y), aa, r5r);
          float pr = 0.0;
          ${TRAILS5.map(([s0, w0, w1, top], k) => `if (abs(y - ${f4(top)}) < 0.03) pr = max(pr, aqTrail(sw, ${f4(s0)}, ${f4(w0)}, ${f4(w1)}, ${f4(k)}, aa));`).join('\n          ')}
          base = mix(c, c * vec3(0.5, 0.56, 0.64), pr * 0.85);
          gBaseRough = r5r; gTexStr *= 0.1; gTexORM.b = 0.0;
        }
      }
      // the pump sets' checker-plate covers (a plain steel rim round them)
      else if (abs(y - ${f4(PUMPS.top)}) < 0.03 && q.x > 16.5 && q.x < 21.5 && q.y > -45.0 && q.y < -39.5) {
        ${SW}
        float ep = -1.0;
        if (${inBox(P1)}) ep = min(min(q.x - ${f4(P1[0])}, ${f4(P1[1])} - q.x), min(q.y - ${f4(P1[2])}, ${f4(P1[3])} - q.y));
        else if (${inBlade(P2)}) ep = min(min(sw.x - ${f4(P2[0])}, ${f4(P2[1])} - sw.x), min(sw.y - ${f4(P2[2])}, ${f4(P2[3])} - sw.y));
        if (ep > -0.01) {
          base = mix(aqTread(wp, aa), vec3(0.075, 0.16, 0.14), aqFill(ep - 0.12, aa));
          gBaseRough = 0.45; gTexStr *= 0.1; gTexORM.b = 0.55;
        }
      }
      // the touch pool's dais (1.0) and its step (0.5): cast-stone flags in the dais's coral cream, a brass strip at the edge
      else if (q.x > -12.1 && q.x < -5.9 && q.y > -16.1 && q.y < -11.7) {
        float ed = -1.0;
        if (abs(y - ${f4(DAIS.top)}) < 0.03 && ${inBox(DAISB)}) ed = min(min(q.x - ${f4(DAISB[0])}, ${f4(DAISB[1])} - q.x), min(q.y - ${f4(DAISB[2])}, ${f4(DAISB[3])} - q.y));
        else if (abs(y - ${f4(DAIS.stepTop)}) < 0.03 && ${inBox(STEPB)}) ed = min(min(q.x - ${f4(STEPB[0])}, ${f4(STEPB[1])} - q.x), ${f4(STEPB[3])} - q.y);   // (its back runs under the dais)
        if (ed > -0.01) {
          base = aqFlags(wp, ${DAIS_C} * 1.08, aa);
          float strip = aqFill(abs(ed - 0.07) - 0.014, aa);
          base = mix(base, BRASS, strip);
          gBaseRough = mix(0.8, 0.3, strip); gTexStr *= 0.1; gTexORM.b = 0.65 * strip;
        }
      }
    }`;
const R5_FACES = `if (y < 2.45) {
      float sg = vWPos.z > 0.0 ? -1.0 : 1.0, t5, hl5, r5r = 0.0, r5m = 0.0;
      vec2 td5;
      bool r5 = false;
      if (q.x < 1.5 && q.x > -24.5 && q.y < -22.0 && q.y > -61.0) {
        ${SW}
        vec2 nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        // the basking rock: a rounded boulder — big weathered lumps, its faces turning away toward their corners and over
        // its top, strata, a little lichen, guano down from its top (props: low lumps round its corners)
        if (aqBoxFace(q, nq, ${v4(BASK)}, t5, hl5, td5) && y < ${f4(PG.basking.top + 0.01)}) {
          vec3 Tw = sg * vec3(td5.x, 0.0, td5.y);
          float e; vec4 st = aqStones(vec2(t5 * 0.8, y), vec2(0.6, 0.46), 41.0, e);
          float u = clamp(t5 / hl5, -1.0, 1.0), vt = smoothstep(1.5, 2.2, y);
          vec2 gr = st.yz * 0.05;
          vec3 n = normalize(vWNorm * (1.0 - 0.3 * u * u) + Tw * (0.9 * u - gr.x) + vec3(0.0, 0.8 * vt - gr.y, 0.0));
          vec3 c = mix(vec3(0.3, 0.29, 0.27), vec3(0.5, 0.52, 0.52), 0.4 + 0.5 * st.w) * mix(0.5, 1.0, smoothstep(0.0, 0.14, e));
          c *= (1.0 + 0.25 * max(0.0, n.y) - 0.2 * max(0.0, -n.y)) * (1.0 - 0.25 * u * u) * (0.93 + 0.12 * aqVN(vec2(t5, y) * 21.0));
          c *= 1.0 - 0.3 * aqFill(abs(y - 0.55 - 0.08 * sin(t5 * 4.0 + 1.0)) - 0.008, aa) - 0.25 * aqFill(abs(y - 1.35 - 0.06 * sin(t5 * 5.0)) - 0.007, aa);
          c = mix(c, vec3(0.42, 0.3, 0.12), smoothstep(0.66, 0.72, aqVN(vec2(t5, y) * 7.0 + 3.0)) * 0.5);
          c = mix(c, vec3(0.74, 0.72, 0.64), aqFill(abs(t5 - 0.15 + 0.03 * sin(y * 11.0)) - 0.03 + 0.03 * (2.2 - y), aa) * smoothstep(1.55, 2.1, y) * 0.6);
          c = mix(c, vec3(0.07, 0.075, 0.08), aqFill(y - 0.1, aa));
          base = c; aqRelief(n); gBaseRough = 0.88; gTexORM.b = 0.0; r5 = true;
        // the ice pile: stacked ice blocks on the terrace
        } else if (aqBoxFace(q, nq, ${v4(ICE)}, t5, hl5, td5) && y > ${f4(PG.ice.foot - 0.01)} && y < ${f4(PG.ice.top + 0.01)}) {
          base = aqIce(vec2(t5 + hl5, y - ${f4(PG.ice.foot)}), sg * vec3(td5.x, 0.0, td5.y), vWNorm, vec3(0.0, 1.0, 0.0), aa, r5r);
          gBaseRough = r5r; gTexORM.b = 0.0; r5 = true;
        } else {
          // the rock terrace and the upper rock: cast rockwork, a granite foot, a snow lip (the upper rock's face over the
          // terrace stands on the terrace)
          ${ROCKS.map((r, i) => `if (!r5 && y < ${f4(r[4] + 0.01)} && aqBladeFace(sw, nb, ${v4(r.slice(0, 4))}, t5, hl5, td5)) {
            float y0 = ${i === ROCKS.length - 1 ? `nb.x < -0.95 ? 1.2 : 0.0` : '0.0'}, ta = abs(nb.y) > 0.95 ? sw.x : sw.y;   // (along the face, unbroken across the pieces)
            base = aqRockFace(ta, y, y0, ${f4(r[4])}, sg * vec3(td5.x, 0.0, td5.y), vWNorm, ${f4(i === ROCKS.length - 1 ? 17 : 11)}, aa, r5r);
            gBaseRough = r5r; gTexORM.b = 0.0; r5 = true;
          }`).join('\n          ')}
        }
      }
      // the pump sets: painted casings (the drum, its flanges and nameplate; the props add the stub, flange and handwheel)
      else if (q.x > 16.5 && q.x < 21.5 && q.y > -45.0 && q.y < -39.5 && y < ${f4(PUMPS.top + 0.01)}) {
        ${SW}
        vec2 nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        if (aqBoxFace(q, nq, ${v4(P1)}, t5, hl5, td5) || aqBladeFace(sw, nb, ${v4(P2)}, t5, hl5, td5)) {
          base = aqPump(t5, 2.0 * hl5, y, step(0.9, hl5), sg * vec3(td5.x, 0.0, td5.y), vWNorm, aa, r5r, r5m);
          gBaseRough = r5r; gTexORM.b = r5m; r5 = true;
        }
      }
      // the touch pool's dais and step: cast coral-cream stone in courses over a granite plinth with a brass line, the
      // coping under their rounded edges (the dais's 1.0 m faces with two faience speed lines; its court face above the step
      // and the step's own 0.5 m faces without)
      else if (q.x > -12.1 && q.x < -5.9 && q.y > -16.1 && q.y < -11.7 && y < 1.01) {
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        if (aqBoxFace(q, nq, ${v4(DAISB)}, t5, hl5, td5)) {
          bool court = nq.y > 0.95;
          float y0 = court ? 0.5 : 0.0;
          base = aqStoneFace(t5, y - y0, ${f4(DAIS.top)} - y0, 0.13, aa, big, fine, ${DAIS_C}, court ? 0.0 : 1.0, r5r, r5m);
          gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.15; r5 = true;
        } else if (y < ${f4(DAIS.stepTop + 0.01)} && aqBoxFace(q, nq, ${v4(STEPB)}, t5, hl5, td5)) {
          base = aqStoneFace(t5, y, ${f4(DAIS.stepTop)}, 0.11, aa, big, fine, ${DAIS_C}, 0.0, r5r, r5m);
          gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.15; r5 = true;
        }
      }
      // the Ticket Hall's plaza, west and east faces: the render family (skirting, brass line, speed lines; a FERRY TO
      // INKOPOLIS plate over the bench: props)
      else if (q.x > 1.9 && q.x < 10.1 && q.y > -46.1 && q.y < -38.9 && y < ${f4(TICKET.top + 0.01)}) {
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        if (aqBoxFace(q, nq, ${v4(TICK)}, t5, hl5, td5) && nq.y < 0.95) {
          base = aqRenderFace(y, ${f4(TICKET.top)}, aa, big, fine, r5r, r5m);
          gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.12; r5 = true;
        }
      }
    }`;
const R5_BEVELS = `if (y > 0.3 && y < 2.45) {
      if (q.x < 1.5 && q.x > -24.5 && q.y < -22.0 && q.y > -61.0) {
        ${SW}
        if (${inBox(BASK, 0.02)} && y > ${f4(PG.basking.top - 0.2)}) base = vec3(0.36, 0.36, 0.34);
        else if (${inBox(ICE, 0.02)} && y > ${f4(PG.ice.top - 0.2)}) base = vec3(0.78, 0.86, 0.92);
        else if ((y > 1.0 && y < 1.21 && (${PG.rocks.map((r) => inBlade(r).replace(/0\.004/g, '0.02')).join(' || ')})) || (y > ${f4(PG.upper[4] - 0.2)} && ${inBlade(PG.upper).replace(/0\.004/g, '0.02')})) base = vec3(0.8, 0.85, 0.9) * (0.93 + 0.07 * fine);
      } else if (q.x > 16.5 && q.x < 21.5 && q.y > -45.0 && q.y < -39.5 && y > 0.75 && y < 1.01) base = vec3(0.075, 0.16, 0.14);
      else if (q.x > -12.1 && q.x < -5.9 && q.y > -16.1 && q.y < -11.7 && y < 1.01) base = ${DAIS_C} * 1.12;
      else if (q.x > 1.9 && q.x < 10.1 && q.y > -46.1 && q.y < -38.9 && y > 0.95 && y < 1.21) base = vec3(0.84, 0.79, 0.70) * 0.86;
    }`;

// ---- fix round 5, the rest of the sweep's list: the stairs' flanks (the grand stair, the Penguin Steps, the Ticket Hall's
// stair), the Kelp Balconies, the deckchair stacks, the diving helmet's bed, the viewing steps, the queue terrace and step,
// the shark-viewing bench, the Fin Pavilion's flank walls by its stairs (Alpha's frame; numbers from layout.js / geo.js)
const ST = 'vec3(0.70, 0.64, 0.52)';       // (the planters' cast cream stone)
const VSTEP = [[-22.5, -0.79, 1.3], [-67.5, -0.79, 0.79], [-112.5, -0.79, 0.79], [-157.5, -1.3, 0.79]];   // the viewing steps: [bearing, t0, t1], d 7.5 → 9.0, top 0.4
const dirS = (a) => `vec2(${f4(Math.cos((a * Math.PI) / 180))}, ${f4(Math.sin((a * Math.PI) / 180))})`;
const ramp = (a, r0, y0, r1, y1, hw, yb, key, port, cut) => {   // a stair's flank: radial ramp on bearing a, low end r0 (y0) → high end r1 (y1)
  const run = Math.abs(r1 - r0), cosA = run / Math.hypot(run, y1 - y0), lo = Math.min(r0, r1), hi = cut ?? Math.max(r0, r1);
  return `{ // ${key}
        vec2 ax = ${dirS(a)}, pr = vec2(-ax.y, ax.x);
        float tr = dot(q, ax), l = dot(q, pr);
        if (!r5 && abs(abs(l) - ${f4(hw)}) < 0.04 && abs(dot(nq, pr)) > 0.95 && tr > ${f4(lo - 0.6)} && tr < ${f4(hi + 0.05)} && y < ${f4(Math.max(y0, y1) + 0.05)} && y > ${f4(yb - 0.05)}) {
          float aa = max(fwidth(tr) + fwidth(y), 0.003), ys = ${f4(y0)} + ${f4(y1 - y0)} * clamp((tr - ${f4(r0)}) / ${f4(r1 - r0)}, 0.0, 1.0);
          base = aqFlank((ys - y) * ${f4(cosA)}, y - ${f4(yb)}, aa, big, fine, r5r, r5m);
          ${port ? `float gW, rW; base = aqPort(vec2(tr - ${f4(port[0])}, y - ${f4(port[1])}), ${f4(port[2])}, aa, base, gW, rW);
          r5r = mix(mix(r5r, 0.3, rW), 0.12, gW); r5m = max(r5m, 0.65 * rW); gAqWin = vec3(0.95, 0.88, 0.8) * gW;` : ''}
          gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.12; r5 = true;
        }
      }`;
};
const R5B_FACES = `{
      float sg = vWPos.z > 0.0 ? -1.0 : 1.0, t5, hl5, r5r = 0.0, r5m = 0.0;
      vec2 td5;
      bool r5 = false;
      ${ramp(-152, 15.6, 0, 21.4, 2.4, 3.0, 0.0, 'the grand stair (radRamp(−152, r 15.6 → 21.4, 0 → 2.4, 6 wide)): a porthole into the Jelly Gallery near its head (its flanks end under the nosing at r 20.95)', [20.3, 0.95, 0.26], 20.96)}
      ${ramp(-120, 34.6, 1.2, 31.0, 2.4, 2.5, 1.2, 'the Penguin Steps (radRamp(−120, r 34.6 → 31.0, 1.2 → 2.4, 5 wide)) over the rock terrace')}
      // the Ticket Hall's stair (x 8 … 10, z −36.2 → −39, 0 → 1.2)
      if (!r5 && abs(abs(q.x - 9.0) - 1.0) < 0.04 && abs(nq.x) > 0.95 && q.y < -36.1 && q.y > -39.0 && y < 1.25) {
        float tr = -36.2 - q.y, aa = max(fwidth(tr) + fwidth(y), 0.003), ys = clamp(1.2 * tr / 2.8, 0.0, 1.2);
        base = aqFlank((ys - y) * 0.9191, y, aa, big, fine, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.12; r5 = true;
      }
      // the Kelp Balcony round the W drum (Alpha's frame: arcBand r 4.6 → 7.2, bearings 195 … 255, tops 3.6 / 3.7 alternating)
      // over the promenade (2.4): a raised deck in the Lookouts' language
      if (!r5 && y > 2.38 && y < 3.71) {
        vec2 pk = q - vec2(-25.0, 0.0); float bk = degrees(atan(pk.y, pk.x)); if (bk < 0.0) bk += 360.0;
        float rk = length(pk);
        if (bk > 193.0 && bk < 257.0 && rk > 4.4 && rk < 7.35) {
          float i = clamp(floor((bk - 195.0) / 15.0), 0.0, 3.0), am = radians(195.0 + 15.0 * (i + 0.5));
          vec2 dm = vec2(cos(am), sin(am)), pm = vec2(-dm.y, dm.x);
          float u = dot(pk, dm), v = dot(pk, pm), top = 3.6 + 0.1 * mod(i, 2.0);
          bool outer = abs(u - 7.1384) < 0.04 && dot(nq, dm) > 0.95, side = abs(abs(v) - 0.9397) < 0.05 && abs(dot(nq, pm)) > 0.95 && u > 4.5;
          if ((outer || side) && y < top + 0.01) {
            float tb = outer ? v : u, aa = max(fwidth(tb) + fwidth(y), 0.003);
            base = aqDeckFace(tb, y, y - 2.4, top, aa, big, fine, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.12; r5 = true;
          }
        }
      }
      // the deckchair stack on the promenade (radBox(−158, r 28.3 → 29.7, 1.4 wide, top 3.6))
      if (!r5 && y > 2.38 && y < 3.61) {
        vec2 dd = ${dirS(-158)}, pp = vec2(-dd.y, dd.x); float u = dot(q, dd), v = dot(q, pp);
        if (u > 28.27 && u < 29.73 && abs(v) < 0.73) {
          float tb = -9.0;
          if (min(abs(u - 28.3), abs(u - 29.7)) < 0.03 && abs(dot(nq, dd)) > 0.95) tb = v;
          else if (abs(abs(v) - 0.7) < 0.03 && abs(dot(nq, pp)) > 0.95) tb = u - 29.0;
          if (tb > -5.0) { float aa = max(fwidth(tb) + fwidth(y), 0.003); base = aqChairs(tb, 0.7, y - 2.4, aa, r5r); gBaseRough = r5r; gTexORM.b = 0.0; gTexStr *= 0.1; r5 = true; }
        }
      }
      if (!r5 && y < 0.95) {
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        // the diving helmet's bed: cast cream stone in courses over a granite plinth, two faience speed lines (a brass plate: props)
        if (aqBoxFace(q, nq, vec4(11.3, 15.3, -8.0, -4.0), t5, hl5, td5)) { base = aqStoneFace(t5, y, 0.9, 0.12, aa, big, fine, ${ST}, 1.0, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.15; r5 = true; }
        // the shark-viewing bench: teak slats between brass end posts, brass Deco ends
        else if (aqBoxFace(q, nq, vec4(3.0, 5.4, -30.3, -29.7), t5, hl5, td5)) { base = aqBench(t5, hl5, y, step(1.0, hl5), aa, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.1; r5 = true; }
        // the queue step (0.6): cast stone over a granite plinth
        else if (y < 0.61 && aqBoxFace(q, nq, vec4(7.4, 10.0, -47.2, -46.0), t5, hl5, td5)) { base = aqStoneFace(t5, y, 0.6, 0.1, aa, big, fine, ${ST}, 0.0, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.15; r5 = true; }
        // the viewing steps (0.4) round the Great Tank: polished black granite risers under a brass nosing (plates: props)
        else if (y < 0.41 && length(q) > 7.4 && length(q) < 9.3) {
          ${VSTEP.map(([a, t0, t1]) => `if (!r5) { vec2 n = ${dirS(a)}, tt = vec2(-n.y, n.x); float u = dot(q, n), v = dot(q, tt);
            if ((abs(u - 9.0) < 0.03 && dot(nq, n) > 0.95 && v > ${f4(t0 - 0.02)} && v < ${f4(t1 + 0.02)}) || (min(abs(v - ${f4(t0)}), abs(v - ${f4(t1)})) < 0.03 && abs(dot(nq, tt)) > 0.95 && u > 7.45 && u < 9.03)) {
              float br = aqFill(abs(y - 0.37) - 0.018, aa);
              base = mix(vec3(0.05, 0.053, 0.058) * (1.5 + 0.2 * aqVN(vec2(u + v, y) * 9.0)), vec3(0.56, 0.38, 0.15), br);
              gBaseRough = mix(0.22, 0.3, br); gTexORM.b = 0.65 * br; gTexStr *= 0.1; r5 = true;
            } }`).join('\n          ')}
        }
      }
      // the queue terrace (0.6) on the ferry plaza: cast stone over a granite plinth
      if (!r5 && y < 0.61 && q.x > -4.0 && q.x < 7.0 && q.y > -66.5 && q.y < -55.5) {
        ${SW}
        vec2 nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
        float aa = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
        if (aqBladeFace(sw, nb, vec4(24.0, 27.0, -17.0, -8.5), t5, hl5, td5)) { base = aqStoneFace(t5, y, 0.6, 0.1, aa, big, fine, ${ST}, 0.0, r5r, r5m); gBaseRough = r5r; gTexORM.b = r5m; gTexStr *= 0.15; r5 = true; }
      }
      // the Fin Pavilion's flank walls beside its stairs (the spawn deck's sides at |w| 13, s 31.35 … 39.6, over the stair's
      // rake 0 → 3.38 from s 31 → 39.6): a raised deck's face in the Lookouts' language, a lit porthole into the foyer
      if (!r5 && y < 3.4 && q.x > 0.0 && q.x < 36.0 && q.y > -80.0 && q.y < -46.0) {
        ${SW}
        vec2 nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
        if (abs(abs(sw.y) - 13.0) < 0.03 && nb.y * sign(sw.y) > 0.95 && sw.x > 31.33 && sw.x < 39.62) {
          float ys = 3.38 * clamp((sw.x - 31.0) / 8.6, 0.0, 1.0), aa = max(fwidth(sw.x) + fwidth(y), 0.003);
          base = aqDeckFace(sw.x, y, y - ys, 3.38, aa, big, fine, r5r, r5m);
          float gW, rW; base = aqPort(vec2(sw.x - 36.6, y - 2.42), 0.2, aa, base, gW, rW);
          gBaseRough = mix(mix(r5r, 0.3, rW), 0.12, gW); gTexORM.b = max(r5m, 0.65 * rW); gAqWin = vec3(0.95, 0.88, 0.8) * gW; gTexStr *= 0.12; r5 = true;
        }
      }
    }`;
const R5B_TOPS = `{
      // the deckchair stack's top chair: its striped sling in a teak frame
      if (abs(y - 3.6) < 0.03) {
        vec2 dd = ${dirS(-158)}, pp = vec2(-dd.y, dd.x); float u = dot(q, dd) - 29.0, v = dot(q, pp);
        if (abs(u) < 0.704 && abs(v) < 0.704) {
          float fr = step(0.6, max(abs(u), abs(v)));
          vec3 cv = mix(vec3(0.36, 0.2, 0.17), vec3(0.72, 0.68, 0.58), step(0.5, fract(v / 0.11))) * (0.8 + 0.2 * (1.0 - abs(u) / 0.6));
          base = mix(cv, vec3(0.3, 0.2, 0.12) * (0.85 + 0.2 * fine), fr); gBaseRough = 0.8; gTexStr *= 0.1; gTexORM.b = 0.0;
        }
      }
      // the diving helmet's bed: sea-worn pebbles inside a cast-stone rim (the helmet stands in the middle)
      else if (abs(y - 0.9) < 0.03 && q.x > 11.29 && q.x < 15.31 && q.y > -8.01 && q.y < -3.99) {
        float e = min(min(q.x - 11.3, 15.3 - q.x), min(q.y + 8.0, -4.0 - q.y));
        base = mix(aqPebbles(q, aa) * (1.0 - 0.35 * (1.0 - smoothstep(0.18, 0.3, e))), ${ST} * 1.06, aqFill(e - 0.18, aa));
        gBaseRough = 0.85; gTexStr *= 0.1; gTexORM.b = 0.0;
      }
      // the shark-viewing bench's seat: teak slats along it
      else if (abs(y - 0.9) < 0.03 && q.x > 2.99 && q.x < 5.41 && q.y > -30.31 && q.y < -29.69) {
        float sl = fract((q.y + 30.3) / 0.12);
        base = vec3(0.3, 0.2, 0.12) * (0.82 + 0.25 * aqVN(vec2(q.x * 2.0, floor((q.y + 30.3) / 0.12) * 3.0))) * (1.0 - 0.55 * aqFill(min(sl, 1.0 - sl) * 0.12 - 0.006, aa));
        gBaseRough = 0.6; gTexStr *= 0.1; gTexORM.b = 0.0;
      }
      // the viewing steps' treads: cast cream stone, a brass strip along the nose
      else if (abs(y - 0.4) < 0.03 && length(q) > 7.4 && length(q) < 9.1) {
        ${VSTEP.map(([a, t0, t1]) => `{ vec2 n = ${dirS(a)}, tt = vec2(-n.y, n.x); float u = dot(q, n), v = dot(q, tt);
          if (u > 7.45 && u < 9.01 && v > ${f4(t0 - 0.01)} && v < ${f4(t1 + 0.01)}) { float br = aqFill(abs(9.0 - u - 0.07) - 0.014, aa); base = mix(aqFlags(q, ${ST} * 1.05, aa), BRASS, br); gBaseRough = mix(0.8, 0.3, br); gTexStr *= 0.1; gTexORM.b = 0.65 * br; } }`).join('\n        ')}
      }
    }`;
const R5B_BEVELS = `{
      vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.85 + 0.2 * fine);
      vec2 pk = q - vec2(-25.0, 0.0); float bk = degrees(atan(pk.y, pk.x)); if (bk < 0.0) bk += 360.0;
      vec2 dd = ${dirS(-158)}, pp = vec2(-dd.y, dd.x); float u = dot(q, dd) - 29.0, v = dot(q, pp);
      if (y > 3.4 && y < 3.71 && bk > 193.0 && bk < 257.0 && length(pk) > 4.4 && length(pk) < 7.35) base = TEAK;                        // the Kelp Balcony
      else if (y > 3.4 && y < 3.61 && abs(u) < 0.73 && abs(v) < 0.73) base = TEAK;                                                   // the deckchairs
      else if (y > 0.7 && y < 0.91 && q.x > 11.25 && q.x < 15.35 && q.y > -8.05 && q.y < -3.95) base = ${ST} * 1.1;                  // the helmet bed
      else if (y > 0.7 && y < 0.91 && q.x > 2.95 && q.x < 5.45 && q.y > -30.35 && q.y < -29.65) base = TEAK;                         // the shark bench
      else if (y > 0.3 && y < 0.41 && length(q) > 7.4 && length(q) < 9.1) base = vec3(0.56, 0.38, 0.15);                              // the viewing steps
      else if (y > 0.45 && y < 0.61 && ((q.x > 7.35 && q.x < 10.05 && q.y > -47.25 && q.y < -45.95) || (q.x > -3.5 && q.x < 6.5 && q.y > -66.0 && q.y < -56.0))) base = ${ST} * 1.1;   // the queue step and terrace
      else if (y > 3.2 && y < 3.39 && q.x > 0.0 && q.x < 36.0 && q.y > -80.0 && q.y < -46.0) {
        ${SW}
        if (abs(abs(sw.y) - 13.0) < 0.2 && sw.x > 31.3 && sw.x < 39.7) base = TEAK;                                                  // the pavilion's flank walls' top edge
      }
    }`;

// ---- fix round 6: the pieces (Alpha's frame; numbers from layout.js)
const FSTEP = [-2.0, 2.0, -9.8, -7.2];                      // the Feeding Step (top 1.2; its riser, −z, carries mural 7)
const WBENCH = [-2.5, 0.5, -58.6, -57.4];                   // the whale-tail bench (top 1.2)
const TSTACK = [27.6, 28.8, -7.8, -5.8];                    // the trolley stack, blade frame (s0, s1, w0, w1; top 1.4)
const CARTB = [-6.2, -4.8, -40.5, -39.0];                   // the ice-cream cart (top 1.4)
// the Kelp Ramp's parapet round the W drum (Alpha's frame: layout.js's runs k 8 … 11 round EK turned 180° onto WK):
// chords between bearings −30 − 15 i and −45 − 15 i at r 7.65, 0.3 wide, tops 0.9 over the ramp (2.5 → 3.3), each run
// 0.25 m long at both ends (the last one not past the promenade): the notches at the joints are the pilasters' (props)
const KP = [0, 1, 2, 3].map((i) => {
  const b0 = -30 - 15 * i, d0 = DIRV(b0), d1 = DIRV(b0 - 15), r = 7.65;
  const Q0 = [-25 + r * d0[0], r * d0[1]], Q1 = [-25 + r * d1[0], r * d1[1]], M = Math.hypot(Q1[0] - Q0[0], Q1[1] - Q0[1]);
  return { Q0, v: [(Q1[0] - Q0[0]) / M, (Q1[1] - Q0[1]) / M], n: DIRV(b0 - 7.5), um: r * Math.cos((7.5 * Math.PI) / 180), M, f0: 0.25, f1: i === 3 ? 0 : 0.25,
    t0: (2.4 * (8 + i)) / 12 + 0.9, sl: 0.2 / M };
});
const kpLoop = (body) => KP.map((k) => `if (!r6) {
        vec2 kv = vec2(${f4(k.v[0])}, ${f4(k.v[1])}), kn = vec2(${f4(k.n[0])}, ${f4(k.n[1])});
        float ks = dot(q - vec2(${f4(k.Q0[0])}, ${f4(k.Q0[1])}), kv), ku = dot(q - vec2(-25.0, 0.0), kn) - ${f4(k.um)};
        float kt = ${f4(k.t0)} + ${f4(k.sl)} * clamp(ks, ${f4(-k.f0)}, ${f4(k.M + k.f1)});
        bool kin = ks > ${f4(-k.f0 - 0.03)} && ks < ${f4(k.M + k.f1 + 0.03)} && abs(ku) < 0.19;
        ${body(k)}
      }`).join('\n      ');
const R6_FACES = `{
      float t6, hl6, r6r = 0.0, r6m = 0.0;
      vec2 td6;
      bool r6 = false;
      float aa6 = max(fwidth(vWPos.x) + fwidth(vWPos.z) + fwidth(y), 0.003);
      // the Feeding Step: its sides and the riser's skirting and fascia (the riser's mural stays: 0.1 … 1.06 untouched)
      if (y < 1.21 && aqBoxFace(q, nq, ${v4(FSTEP)}, t6, hl6, td6)) {
        float side = abs(nq.x) > 0.95 ? 1.0 : 0.0;
        if (side > 0.5 || y < 0.1 || y > 1.06) {
          base = aqFeedFace(t6, y, side, aa6, big, fine, r6r, r6m); gBaseRough = r6r; gTexORM.b = r6m; gTexStr *= 0.12;
        }
        r6 = true;
      }
      // the whale-tail bench
      else if (y < 1.21 && aqBoxFace(q, nq, ${v4(WBENCH)}, t6, hl6, td6)) {
        base = aqWBench(t6, hl6, y, step(1.0, hl6), aa6, fine, r6r, r6m); gBaseRough = r6r; gTexORM.b = r6m; gTexStr *= 0.1; r6 = true;
      }
      // the ice-cream cart: candy stripes round its skirt under the coral bands, a coral pinstripe under its brass lip
      else if (y < 1.41 && aqBoxFace(q, nq, ${v4(CARTB)}, t6, hl6, td6)) {
        vec3 CR = vec3(0.86, 0.78, 0.63) * (0.97 + 0.05 * fine), CO = vec3(0.58, 0.32, 0.25);
        float st = step(0.5, fract(t6 / 0.18 + 0.25)) * aqFill(y - 0.39, aa6) * (1.0 - aqFill(y - 0.07, aa6));
        vec3 c = mix(CR, CO, st);
        c = mix(c, CO, aqFill(abs(y - 1.26) - 0.012, aa6));
        c = mix(c, vec3(0.06, 0.06, 0.065), aqFill(y - 0.065, aa6));
        base = c; gBaseRough = 0.55; gTexStr *= 0.15; r6 = true;
      }
      // the trolley stack: nested luggage trolleys
      else if (y < 1.41 && q.x > 4.0 && q.x < 12.0 && q.y > -64.0 && q.y < -57.0) {
        ${SW}
        vec2 nb = vec2(0.5 * nq.x - ${CB} * nq.y, ${CB} * nq.x + 0.5 * nq.y);
        if (aqBladeFace(sw, nb, ${v4(TSTACK)}, t6, hl6, td6)) {
          base = aqCage(t6, hl6, y, 1.4, step(0.9, hl6), aa6, fine, r6r, r6m); gBaseRough = r6r; gTexORM.b = r6m; gTexStr *= 0.1; r6 = true;
        }
      }
      // the Kelp Ramp's parapet: its court face (on the court, or the promenade past r 21), its ramp face, its ends
      if (!r6 && y > -0.05 && y < 3.35 && q.y < -2.0 && q.y > -8.2 && q.x < -17.0 && q.x > -26.0) {
        ${kpLoop((k) => `if (kin && y < kt + 0.02) {
          bool outer = abs(ku - 0.15) < 0.03 && dot(nq, kn) > 0.95, inner = abs(ku + 0.15) < 0.03 && dot(nq, kn) < -0.95;
          bool endF = abs(dot(nq, kv)) > 0.95 && (abs(ks + ${f4(k.f0)}) < 0.03 || abs(ks - ${f4(k.M + k.f1)}) < 0.03);
          if (outer || inner || endF) {
            float d = kt - y, fy = length(q) > 21.0 ? 2.4 : 0.0, hb = (inner || (endF && ku < 0.0)) ? 0.9 - d : y - fy;
            base = aqParapet(d, hb, aa6, big, fine, r6r, r6m); gBaseRough = r6r; gTexORM.b = r6m; gTexStr *= 0.12; r6 = true;
          }
        }`)}
      }
    }`;
const R6_TOPS = `{
      // the Feeding Step's top
      if (abs(y - 1.2) < 0.03 && q.x > -2.01 && q.x < 2.01 && q.y > -9.81 && q.y < -7.19) {
        float e = min(min(q.x + 2.0, 2.0 - q.x), min(q.y + 9.8, -7.2 - q.y)), r6r, r6m;
        base = aqFeedTop(vec2(q.x, q.y + 9.8), e, aa, fine, r6r, r6m); gBaseRough = r6r; gTexStr *= 0.1; gTexORM.b = r6m;
      }
      // the whale-tail bench's top: teak slats along it, brass end straps
      else if (abs(y - 1.2) < 0.03 && q.x > -2.51 && q.x < 0.51 && q.y > -58.61 && q.y < -57.39) {
        float sl = fract((q.y + 58.6) / 0.12), e = min(q.x + 2.5, 0.5 - q.x);
        base = vec3(0.3, 0.2, 0.12) * (0.82 + 0.25 * aqVN(vec2(q.x * 2.0, floor((q.y + 58.6) / 0.12) * 3.0))) * (1.0 - 0.55 * aqFill(min(sl, 1.0 - sl) * 0.12 - 0.006, aa));
        float br = aqFill(abs(e - 0.13) - 0.03, aa);
        base = mix(base, BRASS, br); gBaseRough = mix(0.6, 0.3, br); gTexStr *= 0.1; gTexORM.b = 0.65 * br;
      }
      // the trolley stack's top: the top cage's steel mesh over the shade inside, its brass rails along the edges
      else if (abs(y - 1.4) < 0.03 && q.x > 4.0 && q.x < 12.0 && q.y > -64.0 && q.y < -57.0) {
        ${SW}
        if (sw.x > 27.59 && sw.x < 28.81 && sw.y > -7.81 && sw.y < -5.79) {
          float e = min(min(sw.x - 27.6, 28.8 - sw.x), min(sw.y + 7.8, -5.8 - sw.y));
          float bar = aqFill(abs(fract((sw.y + 7.8) / 0.12 + 0.5) - 0.5) * 0.12 - 0.01, aa), slat = aqFill(abs(fract((sw.x - 27.6) / 0.3 + 0.5) - 0.5) * 0.3 - 0.012, aa);
          vec3 c = mix(vec3(0.035, 0.04, 0.045), vec3(0.25, 0.28, 0.3) * (0.85 + 0.25 * fine), clamp(bar + slat, 0.0, 1.0));
          float br = aqFill(abs(e - 0.1) - 0.03, aa);
          base = mix(c, BRASS, br); gBaseRough = mix(0.8, 0.35, max(br, bar)); gTexStr *= 0.1; gTexORM.b = 0.6 * clamp(bar + slat + br, 0.0, 1.0);
        }
      }
      // the Kelp Ramp's parapet's top: its smooth render coping
      else if (y > 2.4 && y < 3.35 && q.y < -2.0 && q.y > -8.2 && q.x < -17.0 && q.x > -26.0) {
        bool r6 = false;
        ${kpLoop(() => `if (kin && abs(ku) < 0.16 && abs(y - kt) < 0.05) { base = vec3(0.84, 0.79, 0.70) * 0.86 * 1.07 * (0.97 + 0.05 * fine); gBaseRough = 0.7; gTexStr *= 0.12; r6 = true; }`)}
      }
    }`;
const R6_BEVELS = `{
      vec3 TEAK = vec3(0.30, 0.20, 0.12) * (0.85 + 0.2 * fine);
      if (y > 1.04 && y < 1.21 && q.x > -2.05 && q.x < 2.05 && q.y > -9.85 && q.y < -7.15) base = TEAK;                         // the Feeding Step's fascia rounding over
      else if (y > 1.08 && y < 1.21 && q.x > -2.55 && q.x < 0.55 && q.y > -58.65 && q.y < -57.35) base = TEAK;                  // the whale-tail bench's cap
      else if (y > 1.25 && y < 1.41 && q.x > 4.0 && q.x < 12.0 && q.y > -64.0 && q.y < -57.0) {
        ${SW}
        if (sw.x > 27.55 && sw.x < 28.85 && sw.y > -7.85 && sw.y < -5.75) base = vec3(0.56, 0.38, 0.15);                         // the trolleys' brass top rails
      }
      else if (y > 2.3 && y < 3.35 && q.y < -2.0 && q.y > -8.2 && q.x < -17.0 && q.x > -26.0) {
        bool r6 = false;
        ${kpLoop(() => `if (kin && y > kt - 0.16) { base = vec3(0.84, 0.79, 0.70) * 0.86 * 1.07; r6 = true; }`)}
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
    // -- fix round 5: Penguin Point's tops (pale rock slabs: cracks, snow toward the glass, guano, the penguins' footprints
    // to the glass; the basking rock's; the ice pile's frosted blocks), the pump sets' checker-plate covers, the touch pool's
    // dais and step (cast-stone flags, a brass strip)
    ${R5_TOPS}
    // -- fix round 5: the deckchair stack's top chair, the helmet's pebble bed, the shark bench's seat, the viewing steps' treads
    ${R5B_TOPS}
    // -- fix round 6: the Feeding Step's top, the whale-tail bench's, the trolley stack's, the Kelp Ramp parapet's coping
    ${R6_TOPS}
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
    // ---- fix round 5: Penguin Point's faces, the basking rock, the ice pile, the pump sets, the dais and step, the Ticket
    // Hall's plaza / west / east faces
    ${R5_FACES}
    // ---- fix round 5: the stairs' flanks, the Kelp Balconies, the deckchair stacks, the helmet bed, the shark bench, the
    // queue step and terrace, the viewing steps, the Fin Pavilion's flank walls by its stairs
    ${R5B_FACES}
    // ---- fix round 6: the Feeding Step, the whale-tail bench, the ice-cream cart, the trolley stack, the Kelp Ramp's parapet
    ${R6_FACES}
  } else if (vWNorm.y > 0.0) {
    // ---- fix round 4: the rounded edges of the Lookouts', the bays' and the planters' tops (level.js's bevels)
    vec2 q = vWPos.z > 0.0 ? -vWPos.xz : vWPos.xz;
    float y = vWPos.y;
    vec3 STb = vec3(0.70, 0.64, 0.52) * 1.06;
    ${LOOKOUT_BEVELS}
    if (y < 1.32 || (y > 4.28 && y < 4.52)) {
    ${BEVELS}
    }
    // ---- fix round 5: their rounded top edges (snow on Penguin Point's rocks, frost on the ice pile, the painted casing,
    // the dais's coping, the hall's render)
    ${R5_BEVELS}
    ${R5B_BEVELS}
    ${R6_BEVELS}
  }
`;

const GLSL_EMIT = /* glsl */`
  // ---- Gulper Aquarium: the stair flanks' portholes, lit from within (a little by day, more at dusk)
  // (fix round 5, the lead's nit: at dusk the glow is warm white like every tank's — DESIGN §5.4: never cyan or green; it
  // was the porthole's blue-green picture times the lamp, hue 192 — the picture's own luminance lit warm, its jelly brightest)
  totalEmissiveRadiance += gAqWin * mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11))) * vec3(1.45, 1.22, 0.92), uAqNight) * (0.35 + 1.6 * uAqNight) * (1.0 - gInk);
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
