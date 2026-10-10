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
//   pools       dusk light on the floors under the colonnade's globes, the canopy pendants, the Ticket Hall's canopy,
//               round the lit jelly columns, the Great Tank and the Reef Windows (warm white, times the surface's own
//               colour: ink in a pool is lit in its own colour, never washed out)
// Imports nothing (layout.js stays importable in Node); the uniforms are plain objects, their arrays flat Float32Arrays.
import { W, pol } from './geo.js';

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
`;

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
  }
`;

const GLSL_EMIT = /* glsl */`
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
