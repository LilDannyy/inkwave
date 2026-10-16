// Gulper Aquarium — what lives in the water (owner: the aquarium stage; built by backdrop.js, THREE from its kit, so this
// imports nothing that imports three): the house water material, the fish, the moon jellies, the bubble columns, the
// penguins, Bathysphere No. 1 and Feeding Time. Looks only — nothing here is a collider or changes a rule.
//
//   water    one MeshStandardMaterial for every tank, drum, window and column: deep and dull (#1f4652, never bright cyan,
//            DESIGN.md §5.4), lighter toward its surface, thin seen from inside (the ride camera's lens), and clear within
//            ~1.5 m of a Tubeway tube's axis along the view ray (the closest approach of the eye ray to each tube's run
//            inside that volume: uSegA / uSegB), so a rider's team-colour glow shows through a tank as in open air. At dusk
//            a warm-white glow from within (night factor × 0.16: well under a fresh splat's luminance)
//   fish     four instanced meshes (blacktip sharks, rays, the sea turtle, small fish — reef fish, garibaldi, a silver
//            school), every one swimming its own path in the vertex shader (a circle, or to and fro along an arc), its tail
//            (or a ray's wings) flexing: one draw call per kind, no per-frame upload
//   jellies  the moon-jelly columns: dark glossy glass, the inside traced in its shader — deep water lit from the lid, soft
//            light shafts, moon jellies on two sheets round the axis (near and far: parallax), drifting up and pulsing
//   bubbles  the Shark Arch's bubble columns: glass, water, a stream of bubbles (one mesh for both)
//   penguins the colony in both coves (instanced, waddling, a few swimming in the pool)
//   bathysphere  the steel ball, its lit portholes, bolts and cables (a group of its own, so it can bob)
//   feeding  Feeding Time (DESIGN.md §3.4, looks only): at 1:00 left in every timed mode the winch bobs the bathysphere
//            half a metre, its bell rings three times (a PA chime), a krill cloud drifts down into the Great Tank and the
//            sharks wheel faster under the Glass Walk for 12 s
import { G } from '../../../core/ctx.js';

const TAU = Math.PI * 2, HP = Math.PI / 2;

// ------------------------------------------------------------------------------------------------ water
// segs: [[ax, ay, az, bx, by, bz], …] the tube runs inside the stage's water volumes (≤ 8)
export function waterMaterial(T, U, segs, perVertex = false) {
  const m = new T.MeshStandardMaterial({ color: perVertex ? '#ffffff' : '#285865', vertexColors: perVertex, roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.6, depthWrite: false, side: T.DoubleSide });
  // (the dusk glow from within: warm white × night × this, 2.8× the art pass's first 0.1; the clear water — the Reef Windows,
  // the columns, the pools — glows a little less. Measured at dusk by scenes/aquarium-glow.js: the glow's own share of a
  // tank pixel (glow on minus off) ≤ 60 % of the brighter fresh splat beside it, and it stays far less saturated than ink)
  const uGlow = { value: 0.28 };
  Object.defineProperty(m.userData, 'glow', { set: (v) => { uGlow.value = v; }, get: () => uGlow.value });
  const N = Math.min(8, segs.length);
  const uA = { value: Array.from({ length: 8 }, (_, i) => new T.Vector3(...(segs[i] ? segs[i].slice(0, 3) : [0, -99, 0]))) };
  const uB = { value: Array.from({ length: 8 }, (_, i) => new T.Vector3(...(segs[i] ? segs[i].slice(3, 6) : [0, -99, 0.01]))) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSegA = uA; sh.uniforms.uSegB = uB; sh.uniforms.uNightW = U ? U.uNight : { value: 0 }; sh.uniforms.uGlowW = uGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWW; varying float vDense;' + (perVertex ? ' attribute float aDense;' : '')).replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWW = (modelMatrix * vec4(transformed, 1.0)).xyz; vDense = ' + (perVertex ? 'aDense' : '1.0') + ';');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWW; varying float vDense; uniform vec3 uSegA[8]; uniform vec3 uSegB[8]; uniform float uNightW; uniform float uGlowW;
float aqRaySeg(vec3 ro, vec3 rd, vec3 a, vec3 b) {
  vec3 ba = b - a, w = ro - a; float d = dot(rd, ba), e = max(dot(ba, ba), 1e-5), c = dot(rd, w), f = dot(ba, w);
  float s = clamp((f - c * d) / max(e - d * d, 1e-5), 0.0, 1.0);
  float t = max(s * d - c, 0.0);
  s = clamp((f + t * d) / e, 0.0, 1.0);
  return length(w + t * rd - s * ba);
}`).replace('#include <opaque_fragment>', `
  {
    vec3 rd = normalize(vWW - cameraPosition);
    float dm = 99.0;
    for (int i = 0; i < ${Math.max(1, N)}; i++) dm = min(dm, aqRaySeg(vWW, rd, uSegA[i], uSegB[i]));
    float clear = smoothstep(0.95, 1.7, dm);
    diffuseColor.a *= mix(0.22, 1.0, clear) * (gl_FrontFacing ? 1.0 : 0.25) * vDense;
  }
#include <opaque_fragment>`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += vec3(0.98, 0.9, 0.78) * uGlowW * uNightW * mix(0.7, 1.0, vDense);`);
  };
  m.customProgramCacheKey = () => 'aq-water-' + N + (perVertex ? 'v' : '');
  return m;
}
export function glassMaterial(T) { return new T.MeshStandardMaterial({ color: '#d4ecef', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.6 }); }

// ------------------------------------------------------------------------------------------------ fish
// geometry builders: a fish points along local +z; aW = (tail flex, wing flex) per vertex
function geoFrom(T, parts) {
  for (const p of parts) if (p.g.index) p.g = p.g.toNonIndexed();
  let n = 0; for (const p of parts) n += p.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), w = new Float32Array(n * 2); let o = 0;
  const c = new T.Color();
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g, P = g.attributes.position, Nn = g.attributes.normal;
    c.set(p.c);
    for (let i = 0; i < P.count; i++) {
      pos[(o + i) * 3] = P.getX(i); pos[(o + i) * 3 + 1] = P.getY(i); pos[(o + i) * 3 + 2] = P.getZ(i);
      nor[(o + i) * 3] = Nn.getX(i); nor[(o + i) * 3 + 1] = Nn.getY(i); nor[(o + i) * 3 + 2] = Nn.getZ(i);
      const shade = p.shade ? p.shade(P.getX(i), P.getY(i), P.getZ(i)) : 1;
      col[(o + i) * 3] = c.r * shade; col[(o + i) * 3 + 1] = c.g * shade; col[(o + i) * 3 + 2] = c.b * shade;
      w[(o + i) * 2] = p.tail ? Math.max(0, -P.getZ(i)) : 0; w[(o + i) * 2 + 1] = p.wing ? Math.abs(P.getX(i)) : 0;
    }
    o += P.count;
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3));
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('aW', new T.BufferAttribute(w, 2));
  return g;
}
const tx = (g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { g.scale(sx, sy, sz); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g; };
function sharkGeo(T) {
  const belly = (x, y) => (y < -0.02 ? 1.55 : 1);
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 10, 7), 0, 0, 0, 0, 0, 0, 0.42, 0.42, 2.1), c: '#7d878c', tail: true, shade: belly },
    { g: tx(new T.ConeGeometry(0.22, 0.75, 6), 0, 0.38, 0.05, -0.5, 0, 0, 0.25, 1, 1.4), c: '#6b757a', tail: true },
    { g: tx(new T.ConeGeometry(0.2, 0.9, 6), 0, 0.12, -1.38, -1.2, 0, 0, 0.18, 1, 1.2), c: '#3a3f42', tail: true },
    { g: tx(new T.ConeGeometry(0.16, 0.6, 6), 0, -0.18, -1.3, -2.1, 0, 0, 0.18, 1, 1), c: '#3a3f42', tail: true },
    { g: tx(new T.ConeGeometry(0.14, 0.62, 5), 0.3, -0.1, 0.25, 0, 0, -2.0, 1, 1, 0.5), c: '#5c6569', tail: true },
    { g: tx(new T.ConeGeometry(0.14, 0.62, 5), -0.3, -0.1, 0.25, 0, 0, 2.0, 1, 1, 0.5), c: '#5c6569', tail: true },
  ]);
}
function rayGeo(T) {
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 10, 5), 0, 0, 0, 0, Math.PI / 4, 0, 1.4, 0.16, 1.4), c: '#4d4a45', wing: true, shade: (x, y) => (y < 0 ? 1.9 : 1) },
    { g: tx(new T.CylinderGeometry(0.02, 0.05, 1.6, 5), 0, 0, -1.2, HP, 0, 0), c: '#3a3733', tail: true },
  ]);
}
function turtleGeo(T) {
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 9, 6), 0, 0, 0, 0, 0, 0, 1.0, 0.36, 1.2), c: '#6f6a48', shade: (x, y) => (y < -0.03 ? 1.6 : 1) },
    { g: tx(new T.SphereGeometry(0.18, 7, 5), 0, 0.02, 0.68, 0, 0, 0, 1, 0.8, 1.1), c: '#8a8a6a' },
    ...[[0.5, 0.3, -0.5], [-0.5, 0.3, 0.5], [0.42, -0.4, -0.3], [-0.42, -0.4, 0.3]].map(([x, z, r]) => ({ g: tx(new T.SphereGeometry(0.2, 6, 4), x, -0.02, z, 0, r, 0, 1.6, 0.25, 0.7), c: '#7d7a5a', wing: true })),
  ]);
}
function smallFishGeo(T) {
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 7, 5), 0, 0, 0, 0, 0, 0, 0.16, 0.34, 0.5), c: '#ffffff', tail: true, shade: (x, y) => (y < -0.05 ? 1.15 : 0.92) },
    { g: tx(new T.ConeGeometry(0.12, 0.2, 4), 0, 0, -0.32, -HP, 0, 0, 0.3, 1, 1.4), c: '#ffffff', tail: true },
  ]);
}
function penguinGeo(T) {
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 9, 7), 0, 0.42, 0, 0, 0, 0, 0.42, 0.8, 0.4), c: '#24262b' },
    { g: tx(new T.SphereGeometry(0.5, 9, 7), 0, 0.4, 0.06, 0, 0, 0, 0.34, 0.68, 0.32), c: '#f1efe8' },
    { g: tx(new T.SphereGeometry(0.17, 7, 5), 0, 0.92, 0.02), c: '#24262b' },
    { g: tx(new T.ConeGeometry(0.04, 0.16, 5), 0, 0.9, 0.2, HP, 0, 0), c: '#b07a4a' },
    { g: tx(new T.SphereGeometry(0.2, 5, 4), 0.21, 0.5, 0, 0, 0, 0.3, 0.2, 1.1, 0.5), c: '#24262b', wing: true },
    { g: tx(new T.SphereGeometry(0.2, 5, 4), -0.21, 0.5, 0, 0, 0, -0.3, 0.2, 1.1, 0.5), c: '#24262b', wing: true },
    { g: tx(new T.SphereGeometry(0.08, 5, 3), 0.08, 0.04, 0.08, 0, 0, 0, 1, 0.4, 1.4), c: '#b07a4a' },
    { g: tx(new T.SphereGeometry(0.08, 5, 3), -0.08, 0.04, 0.08, 0, 0, 0, 1, 0.4, 1.4), c: '#b07a4a' },
  ]);
}
// one path per swimmer: aP0 = (cx, cy, cz, R), aP1 = (θ0, A, ω, φ): A = 0 a circle at ω, else θ0 + A sin(ωt + φ) (to and
// fro along an arc); aP2 = (bob, bob rate, scale, flex); aP3 = (clock + 2 · kind: clock 0 the house clock, 1 Feeding
// Time's; its colour packed as 0xRRGGBB; waddle, tilt).
// Every swimmer of every kind is ONE instanced draw: its geometry holds every kind's body (aV.w = the part's kind), each
// instance keeps only its own kind's vertices (the rest collapse to a point and are culled) — the fish and the penguins
// cost one draw call together, and the vertex data stays a few thousand vertices.
// It is a plain Mesh on an InstancedBufferGeometry, not an InstancedMesh: an InstancedMesh's identity instanceMatrix
// (4 attribute slots) and instanceColor (1) took the program to 16 vertex attributes, over the limit of the Mac's GL —
// the program failed to link and nothing swam at all (LEAD-REVIEW art round 1, the blocker). Now 8: position, normal,
// color, aV (tail flex, wing flex, wing rate, part), aP0 … aP3.
function swimmers(T, kinds, U) {
  let nv = 0, ni = 0; for (const k of kinds) { nv += k.geo.attributes.position.count; ni += k.list.length; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), av = new Float32Array(nv * 4);
  let o = 0;
  kinds.forEach((k, ki) => {
    const g = k.geo, m = g.attributes.position.count, w = g.attributes.aW.array;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3);
    for (let i = 0; i < m; i++) { av[(o + i) * 4] = w[i * 2]; av[(o + i) * 4 + 1] = w[i * 2 + 1]; av[(o + i) * 4 + 2] = k.wing; av[(o + i) * 4 + 3] = ki; }
    o += m;
  });
  const geo = new T.InstancedBufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('aV', new T.BufferAttribute(av, 4));
  const a0 = new Float32Array(ni * 4), a1 = new Float32Array(ni * 4), a2 = new Float32Array(ni * 4), a3 = new Float32Array(ni * 4);
  const c = new T.Color();
  let i = 0;
  kinds.forEach((k, ki) => {
    for (const f of k.list) {
      const p3 = f.p3 || [0, 0, 0, 0];
      c.set(f.c || '#ffffff');
      const rgb = (Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255);   // (linear: as setColorAt stored it)
      a0.set(f.p0, i * 4); a1.set(f.p1, i * 4); a2.set(f.p2, i * 4); a3.set([(p3[0] > 0.5 ? 1 : 0) + 2 * ki, rgb, p3[2], p3[3]], i * 4);
      i++;
    }
  });
  geo.setAttribute('aP0', new T.InstancedBufferAttribute(a0, 4)); geo.setAttribute('aP1', new T.InstancedBufferAttribute(a1, 4));
  geo.setAttribute('aP2', new T.InstancedBufferAttribute(a2, 4)); geo.setAttribute('aP3', new T.InstancedBufferAttribute(a3, 4));
  geo.instanceCount = ni;
  geo.boundingSphere = new T.Sphere(new T.Vector3(0, 2, 0), 80);
  const im = new T.Mesh(geo, null);
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = `attribute vec4 aP0; attribute vec4 aP1; attribute vec4 aP2; attribute vec4 aP3; attribute vec4 aV; uniform float uFT; uniform float uFT2;
mat3 aqYaw(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
vec3 aqRGB(float p) { float r = floor(p / 65536.0), g = floor((p - r * 65536.0) / 256.0); return vec3(r, g, p - r * 65536.0 - g * 256.0) / 255.0; }
` + sh.vertexShader
      .replace('#include <color_vertex>', `#include <color_vertex>
  vColor.rgb *= aqRGB(aP3.y);`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  vec2 aW = aV.xy; float aWg = aV.z, aPart = aV.w, aKind = floor(aP3.x * 0.5);
  float aqT = mod(aP3.x, 2.0) > 0.5 ? uFT2 : uFT;
  float aqTh = aP1.y > 0.0 ? aP1.x + aP1.y * sin(aP1.z * aqT + aP1.w) : aP1.x + aP1.z * aqT + aP1.w;
  float aqD = aP1.y > 0.0 ? aP1.y * aP1.z * cos(aP1.z * aqT + aP1.w) : aP1.z;
  vec2 aqTn = vec2(-sin(aqTh), cos(aqTh)) * (aqD >= 0.0 ? 1.0 : -1.0);
  float aqYw = atan(aqTn.x, aqTn.y) + aP3.z * sin(aqT * 2.3 + aP1.w * 5.0);
  objectNormal = aqYaw(aqYw) * objectNormal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    vec3 p = transformed * aP2.z;
    p.x += sin(aqT * 7.0 + p.z * 3.0 + aP1.w * 9.0) * aP2.w * aW.x * 0.35 * aP2.z;
    p.y += sin(aqT * aWg + aP1.w * 4.0) * aW.y * aW.y * 0.6 * aP2.z;
    p.z += aP3.w * p.y;
    vec3 c = vec3(aP0.x + aP0.w * cos(aqTh), aP0.y + aP2.x * sin(aqT * aP2.y + aP1.w * 3.0), aP0.z + aP0.w * sin(aqTh));
    transformed = aqYaw(aqYw) * p + c;
    if (abs(aPart - aKind) > 0.5) transformed = c;   // (another kind's body: collapsed, culled)
  }`);
  };
  mat.customProgramCacheKey = () => 'aq-swim-union2';
  im.material = mat;
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'aq-swimmers';
  im.userData.count = ni;   // (tests: how many swim)
  return im;
}

// the stage's fish (Alpha's half listed, twins turned): deterministic from a seed
export function buildFish(T, rnd, U) {
  const sharks = [], rays = [], turtles = [], small = [];
  const both = (list, f) => { list.push(f); list.push({ ...f, p0: [-f.p0[0], f.p0[1], -f.p0[2], f.p0[3]], p1: [f.p1[0] + Math.PI, f.p1[1], f.p1[2], f.p1[3] + 1.3] }); };
  // the Great Tank (one, at the centre: its sand at −0.6, the Gulper Run's tube across it at y 0.5 ± 0.88, the lid at 2.2):
  // sharks circling over the tube (1.5 … 2.0), a ray and the turtle gliding with them, a silver school
  for (let i = 0; i < 4; i++) sharks.push({ p0: [0, 1.62 + 0.1 * (i % 3), 0, 3.2 + i * 0.9], p1: [i * 1.6, 0, (i % 2 ? -1 : 1) * (0.32 - i * 0.03), i * 0.7], p2: [0.08, 0.6, 0.78 + 0.08 * (i % 2), 0.9], p3: [1, 0, 0, 0] });
  rays.push({ p0: [0, 1.85, 0, 5.4], p1: [0.5, 0, 0.17, 0], p2: [0.06, 0.5, 0.95, 0], p3: [1, 0, 0, 0] });
  turtles.push({ p0: [0, 1.7, 0, 4.4], p1: [3.0, 0, -0.12, 0], p2: [0.12, 0.4, 0.9, 0], p3: [1, 0, 0, 0] });
  for (let i = 0; i < 18; i++) small.push({ p0: [0, 1.5 + rnd() * 0.55, 0, 2.2 + rnd() * 0.8], p1: [rnd() * 0.9, 0, 0.55, rnd() * 6], p2: [0.05, 1.2, 0.36, 1.2], p3: [1, 0, 0, 0], c: '#c9ccc8' });
  // the Arch Tanks (6 … 9 m over the halls, x ±6, z −31 … −19; the Arch Line crosses at z −27.13 from 6.6 to 8.4): sharks
  // and an eagle ray in the court-side part (z −25.6 … −19.6), seen overhead from the hall and from the court
  // (art round 1: "sharks overhead", not one silhouette — five blacktips and two rays over each hall: three circling the
  // court-side part, two cruising to and fro along the wing-side part beyond the Arch Line's tube, at z −29.6)
  for (let i = 0; i < 3; i++) both(sharks, { p0: [0, 7.3 + 0.45 * i, -22.6, 2.4], p1: [i * 2.1, 0, 0.28 + 0.04 * i, i], p2: [0.1, 0.5, 0.75, 0.9], p3: [0, 0, 0, 0] });
  for (let i = 0; i < 2; i++) both(sharks, { p0: [0, 7.0 + 1.1 * i, -59.6, 30.0], p1: [HP, 0.15, 0.09 + 0.02 * i, i * 2.2], p2: [0.08, 0.45, 0.8, 0.9], p3: [0, 0, 0, 0] });
  both(rays, { p0: [0, 6.55, -22.7, 2.0], p1: [1.0, 0, -0.22, 0], p2: [0.05, 0.6, 0.85, 0], p3: [0, 0, 0, 0] });
  both(rays, { p0: [0, 8.35, -22.4, 1.4], p1: [3.0, 0, 0.18, 0], p2: [0.06, 0.4, 0.7, 0], p3: [0, 0, 0, 0] });
  for (let i = 0; i < 8; i++) both(small, { p0: [0, 8.65 + rnd() * 0.2, -25.0, 4.4 + rnd() * 1.2], p1: [-HP, 0.9, 0.35 + rnd() * 0.2, rnd() * 6], p2: [0.05, 1.4, 0.3, 1.2], p3: [0, 0, 0, 0], c: '#c3c8c6' });
  // the kelp drums (r 4.35; the Kelp Line's riser at 2.7 m from the centre): garibaldi on small circles round the centre
  for (let i = 0; i < 6; i++) both(small, { p0: [24.6, 1.6 + i * 1.0, 0.4, 0.55 + 0.08 * i], p1: [rnd() * 6, 0, (i % 2 ? -1 : 1) * 0.6, rnd() * 6], p2: [0.15, 0.7, 0.42, 1.4], p3: [0, 0, 0, 0], c: '#d98a4a' });
  // the Reef Windows (r 30.55 … 32.25, 0.6 … 3.4; Alpha's from α −58 to −2.6, and −70 to −67): reef fish to and fro along
  // the window, a few colours (half saturation) among grey-silver
  const reefC = ['#c9ccc8', '#d8c068', '#c48a7a', '#9db0c4', '#e0d6c4', '#b8b0c8', '#c9ccc8', '#98a6a0'];
  for (let i = 0; i < 34; i++) {
    const a = (-55 + rnd() * 50) * Math.PI / 180, amp = (4 + rnd() * 6) * Math.PI / 180;
    both(small, { p0: [0, 1.1 + rnd() * 1.9, 0, 30.9 + rnd() * 1.0], p1: [a, amp, 0.12 + rnd() * 0.12, rnd() * 6], p2: [0.08, 0.8, 0.3 + rnd() * 0.18, 1.3], p3: [0, 0, 0, 0], c: reefC[i % reefC.length] });
  }
  return [
    { geo: sharkGeo(T), list: sharks, wing: 1.8 },
    { geo: rayGeo(T), list: rays, wing: 1.8 },
    { geo: turtleGeo(T), list: turtles, wing: 1.8 },
    { geo: smallFishGeo(T), list: small, wing: 1.8 },
  ];
}
// every swimmer (the fish and the penguins) in one mesh
export function buildSwimmers(T, U, kinds) { return swimmers(T, kinds, { uFT: U.uFT, uFT2: U.uFT2 }); }
// the penguins: both coves (Alpha's along the blade's trailing edge; the twin turned), standing, waddling, a few swimming
// in the pool. toWorld(s, w) maps the blade frame; pool = [s, w, r, y]
export function buildPenguins(T, rnd, U, toWorld, spots, pool) {
  const list = [];
  const twin = (f) => [f, { ...f, p0: [-f.p0[0], f.p0[1], -f.p0[2], f.p0[3]], p1: [f.p1[0] + Math.PI, f.p1[1], f.p1[2], f.p1[3] + 0.7] }];
  for (const [s, w, y] of spots) {
    const [x, z] = toWorld(s, w);
    list.push(...twin({ p0: [x, y, z, 0.0], p1: [rnd() * TAU, 0.6, 0.35 + rnd() * 0.3, rnd() * 6], p2: [0.025, 7, 0.8 + rnd() * 0.25, 0], p3: [0, 0, 0.12, 0] }));
  }
  const [px, pz] = toWorld(pool[0], pool[1]);
  for (let i = 0; i < 3; i++) list.push(...twin({ p0: [px, pool[3] - 0.38, pz, pool[2] * (0.45 + 0.2 * i)], p1: [rnd() * TAU, 0, (i % 2 ? -1 : 1) * (0.5 + 0.2 * i), 0], p2: [0.02, 3, 0.75, 0], p3: [0, 0, 0, 0.9] }));
  return { geo: penguinGeo(T), list, wing: 6.0 };
}

// ------------------------------------------------------------------------------------------------ the moon-jelly columns
// cols: [[x, z, r, y0, y1], …] — a lit milky cylinder with the jellies in its shader
export function buildJellies(T, U, cols) {
  // (each column carries its axis and radius on its vertices: the shader traces the eye ray into it)
  const geos = cols.map(([x, z, r, y0, y1]) => { const g = new T.CylinderGeometry(r, r, y1 - y0, 40, 1, true).toNonIndexed(); g.translate(x, (y0 + y1) / 2, z); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([x, z, r], i * 3); g.setAttribute('aJC', new T.BufferAttribute(a, 3)); return g; });
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), jc = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); jc.set(g.attributes.aJC.array, o * 3); o += g.attributes.position.count; }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('aJC', new T.BufferAttribute(jc, 3));
  const [y0, y1] = [cols[0][3], cols[0][4]];
  // the glass: dark and glossy (the light we see comes from inside: emissive), milky only at grazing angles
  const mat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08, metalness: 0.0, emissive: '#000000', envMapIntensity: 1.2 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFT = U.uFT; sh.uniforms.uNightJ = U.uNight;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aJC; varying vec3 vWJ; varying vec3 vJC;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWJ = (modelMatrix * vec4(transformed, 1.0)).xyz; vJC = aJC;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWJ; varying vec3 vJC; uniform float uFT; uniform float uNightJ;
float jh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// one sheet of moon jellies on a cylinder of radius rr round the column's axis c, seen at the point h: rgb + alpha. Cells
// round the circumference (whole cells: the pattern closes) and up the column, a jelly in most, drifting up and swaying;
// each a soft saucer bell (its margin hangs, its middle lifts: no hard cut), four faint gonads, a fine fringe and three
// wavy oral arms, pulsing
vec4 jSheet(vec3 h, vec2 c, float rr, float seed) {
  float th = atan(h.z - c.y, h.x - c.x);
  float n = max(3.0, floor(6.2832 * rr / 0.62)), cw = 6.2832 * rr / n, ch = 0.82;
  vec2 g = vec2(th / 6.2832 * n, (h.y + uFT * (0.05 + 0.025 * seed)) / ch + seed * 0.37);
  vec2 ci = floor(g); ci.x = mod(ci.x, n);
  vec2 f = (fract(g) - 0.5) * vec2(cw, ch);
  float r0 = jh(ci + seed * 13.1), r1 = jh(ci + 7.3 + seed), r2 = jh(ci + 3.7 - seed);
  if (r0 < 0.36) return vec4(0.0);
  float s = 0.7 + 0.5 * r1, pulse = sin(uFT * (1.5 + 0.7 * r2) + r0 * 6.28);
  vec2 p = f - vec2((r1 - 0.5) * max(0.0, cw - 0.46 * s), 0.14 + (r2 - 0.5) * 0.12);
  p.x += 0.03 * sin(uFT * 0.7 + r0 * 9.0 + p.y * 3.0);
  vec2 q = p / vec2(0.17 * s * (1.0 + 0.07 * pulse), 0.115 * s * (1.0 - 0.09 * pulse));
  float yb = -0.25 + 0.45 * (1.0 - min(1.0, q.x * q.x)), lq = length(q), under = q.y - yb;
  float bell = smoothstep(1.0, 0.78, lq) * smoothstep(-0.14, 0.12, under);
  float rim = bell * smoothstep(0.5, 0.95, lq);
  float gon = smoothstep(0.1, 0.0, abs(length((q - vec2(0.0, 0.3)) / vec2(1.0, 0.65)) - 0.32)) * bell;
  float fringe = smoothstep(1.02, 0.9, abs(q.x)) * smoothstep(0.02, -0.06, under) * smoothstep(-0.85, -0.1, under) * (0.45 + 0.55 * sin(q.x * 29.0 + uFT * 2.0));
  float arms = 0.0;
  for (int k = 0; k < 3; k++) {
    float x0 = (float(k) - 1.0) * 0.21 + 0.11 * sin(q.y * 2.1 + uFT * 1.3 + float(k) * 2.0 + r0 * 5.0);
    arms = max(arms, smoothstep(0.12, 0.0, abs(q.x - x0)) * smoothstep(0.05, -0.15, under) * smoothstep(-3.3, -0.5, q.y));
  }
  float al = clamp(bell * (0.3 + 0.5 * rim) + gon * 0.22 + fringe * 0.2 + arms * 0.3, 0.0, 0.85);
  return vec4(mix(vec3(0.93, 0.92, 1.0), vec3(0.86, 0.74, 0.95), gon * 0.8), al);
}
vec2 jHit(vec2 pp, vec2 d2, float rr) {   // the ray's two crossings of a cylinder (t near, t far); (-1, -1) if it misses
  float A = max(dot(d2, d2), 1e-5), Bq = dot(pp, d2), D = Bq * Bq - A * (dot(pp, pp) - rr * rr);
  if (D <= 0.0) return vec2(-1.0);
  float sq = sqrt(D); return vec2((-Bq - sq) / A, (-Bq + sq) / A);
}`).replace('#include <color_fragment>', `#include <color_fragment>
  // the column's inside, traced (LEAD-REVIEW art round 2: it read as a printed drum): deep blue-black water lit from the lamp
  // in its lid, light falling down it in soft shafts, and jellies on two sheets round the axis (each seen twice, near and
  // far): real depth and parallax as the eye moves, the far ones dimmer through the water
  vec3 jIn = vec3(0.0);
  {
    vec3 ro = cameraPosition, rd = normalize(vWJ - cameraPosition);
    vec2 c = vJC.xy, pp = ro.xz - c, d2 = rd.xz; float R = vJC.z, t0 = length(vWJ - ro);
    float Y0 = ${y0.toFixed(3)}, Y1 = ${y1.toFixed(3)};
    vec2 hb = jHit(pp, d2, R * 0.97); vec3 b = ro + rd * hb.y;
    float yb = clamp((b.y - Y0) / (Y1 - Y0), 0.0, 1.0), thb = atan(b.z - c.y, b.x - c.x);
    vec3 col = mix(vec3(0.004, 0.012, 0.026), vec3(0.03, 0.075, 0.115), smoothstep(0.0, 1.0, yb)) + vec3(0.07, 0.1, 0.12) * smoothstep(0.72, 1.0, yb);
    col += vec3(0.02, 0.035, 0.045) * pow(0.5 + 0.5 * sin(thb * 7.0 + 1.7 * sin(thb * 3.0) + uFT * 0.15), 4.0) * smoothstep(0.1, 1.0, yb);
    vec2 hi = jHit(pp, d2, R * 0.42), ho = jHit(pp, d2, R * 0.72);
    for (int k = 0; k < 4; k++) {
      float t = k == 0 ? ho.y : k == 1 ? hi.y : k == 2 ? hi.x : ho.x;
      if (t <= t0) continue;
      vec3 h = ro + rd * t;
      if (h.y < Y0 + 0.08 || h.y > Y1 - 0.06) continue;
      vec4 j = jSheet(h, c, k == 1 || k == 2 ? R * 0.42 : R * 0.72, float(k));
      float lit = 0.3 + 0.7 * smoothstep(0.0, 1.0, (h.y - Y0) / (Y1 - Y0));
      // (a sheet seen edge-on smears its jellies into streaks: faded where the eye ray grazes it)
      float graze = abs(dot(normalize(h.xz - c), normalize(d2)));
      col = mix(col, j.rgb * lit, j.a * exp(-0.5 * (t - t0)) * smoothstep(0.18, 0.5, graze));
    }
    jIn = col;
  }
  float fresJ = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.0);
  diffuseColor.rgb = mix(vec3(0.012, 0.016, 0.022), vec3(0.62, 0.64, 0.7), 0.04 + 0.4 * fresJ);
  vec3 jellyE = jIn * mix(vec3(1.0), vec3(1.0, 0.94, 1.08), uNightJ) * (0.9 + 0.45 * uNightJ) * (1.0 - 0.6 * fresJ);`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += jellyE;`);
  };
  mat.customProgramCacheKey = () => 'aq-jelly3';
  const m = new T.Mesh(geo, mat); m.name = 'aq-jellies'; m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------ bubbles
// Round bubbles: each a camera-facing quad (4 vertices: the centre, a corner, a radius) drawn as a thin bright rim round a
// clear middle with a highlight, a little transparent; sizes vary (art round 1: "white diamond confetti"). `bubbleQuads`
// builds the shared geometry; the shader chunks below turn it to face the camera after the caller's motion (`transformed`
// is the centre) and shade it round. Used by the bubble columns here and the kelp drums' tide (backdrop.js).
export function bubbleQuads(T, list, attrs) {
  // list: [{ x, z, r, a: [..per-bubble attribute values..] }], attrs: [[name, size], …] for the per-bubble values
  const n = list.length, pos = new Float32Array(n * 12), cor = new Float32Array(n * 8), rad = new Float32Array(n * 4), idx = new (n * 4 > 65535 ? Uint32Array : Uint16Array)(n * 6);
  const ex = attrs.map(([, k]) => new Float32Array(n * 4 * k));
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  list.forEach((b, i) => {
    for (let v = 0; v < 4; v++) {
      const o = i * 4 + v;
      pos.set([b.x, 0, b.z], o * 3); cor.set(C[v], o * 2); rad[o] = b.r;
      attrs.forEach(([, k], j) => ex[j].set(b.a[j], o * k));
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aCorner', new T.BufferAttribute(cor, 2)); g.setAttribute('aRad', new T.BufferAttribute(rad, 1));
  attrs.forEach(([name, k], j) => g.setAttribute(name, new T.BufferAttribute(ex[j], k)));
  g.setIndex(new T.BufferAttribute(idx, 1));
  return g;
}
export const BUBBLE_VS_PARS = 'attribute vec2 aCorner; attribute float aRad; varying vec2 vBub;\n';
// (after the caller's begin_vertex code: `transformed` is the bubble's centre, `bubScale` scales its radius)
export const BUBBLE_VS_PROJECT = `
  vBub = aCorner;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  mvPosition.xy += aCorner * aRad * bubScale;
  gl_Position = projectionMatrix * mvPosition;`;
export const BUBBLE_FS = (base = '#include <color_fragment>') => ({
  pars: 'varying vec2 vBub;\n',
  body: `${base}
  {
    float r = length(vBub);
    if (r > 1.0) discard;
    float rim = smoothstep(0.62, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r));
    float hi = 1.0 - smoothstep(0.0, 0.26, length(vBub - vec2(-0.36, 0.38)));
    diffuseColor.a *= clamp(0.1 + rim * 0.85 + hi * 0.9, 0.0, 1.0);
    diffuseColor.rgb = mix(diffuseColor.rgb * 0.85, vec3(1.0), clamp(hi + rim * 0.4, 0.0, 1.0));
  }`,
});

// ------------------------------------------------------------------------------------------------ the bubble columns
// cols: [[x, z, r, y0, y1], …]: bubbles streaming up inside (their water and glass: backdrop.js)
export function buildBubbleCols(T, U, rnd, cols) {
  const list = [];
  for (const [x, z, r, y0, y1] of cols) for (let i = 0; i < 90; i++) { const a = rnd() * TAU, rr = Math.sqrt(rnd()) * (r - 0.18), sz = rnd(); list.push({ x: x + Math.cos(a) * rr, z: z + Math.sin(a) * rr, r: 0.025 + sz * sz * 0.07, a: [[rnd(), 0.6 + rnd() * 0.8, y0, y1 - y0]] }); }
  const geo = bubbleQuads(T, list, [['aB', 4]]);
  geo.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 40);
  const mat = new T.MeshBasicMaterial({ color: '#e8f6fa', transparent: true, opacity: 0.9, depthWrite: false });
  const fs = BUBBLE_FS();
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFT = U.uFT;
    sh.vertexShader = 'attribute vec4 aB; uniform float uFT;\n' + BUBBLE_VS_PARS + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  float bubScale = 1.0 + 0.5 * clamp((mod(aB.x * 9.0 + uFT * 1.4 * aB.y, aB.w - 0.2)) / aB.w, 0.0, 1.0);   // (they grow as they rise)
  transformed.y += aB.z + 0.1 + mod(aB.x * 9.0 + uFT * 1.4 * aB.y, aB.w - 0.2);
  transformed.x += 0.06 * sin(uFT * 3.0 + aB.x * 40.0); transformed.z += 0.06 * cos(uFT * 2.6 + aB.x * 33.0);`).replace('#include <project_vertex>', BUBBLE_VS_PROJECT);
    sh.fragmentShader = fs.pars + sh.fragmentShader.replace('#include <color_fragment>', fs.body);
  };
  mat.customProgramCacheKey = () => 'aq-colbubbles2';
  const m = new T.Mesh(geo, mat); m.name = 'aq-colbubbles'; m.renderOrder = 1; m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------ Bathysphere No. 1
export function buildBathysphere(T) {
  const g = new T.Group(); g.name = 'aq-bathysphere';
  const parts = [], glass = [];
  const add = (geo, hex, m4) => { const gg = geo.index ? geo.toNonIndexed() : geo; if (m4) gg.applyMatrix4(m4); const c = new T.Color(hex), n = gg.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); gg.setAttribute('color', new T.BufferAttribute(a, 3)); parts.push(gg); };
  const M = (x, y, z, rx = 0, ry = 0, rz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1));
  const look = (p, n) => { const o = new T.Object3D(); o.position.copy(p); o.lookAt(n); o.updateMatrix(); return o.matrix; };
  const STEEL = '#6d7a80', DARK = '#3e474b', BRASS = '#a8895a';
  add(new T.SphereGeometry(1.45, 32, 22), STEEL);
  add(new T.TorusGeometry(1.46, 0.06, 8, 48), DARK, M(0, 0, 0, HP));
  for (const [a, y] of [[0, 0.15], [0.75, 0.05], [-0.75, 0.05], [Math.PI, 0.15], [Math.PI + 0.75, 0.05], [Math.PI - 0.75, 0.05]]) {
    const n = new T.Vector3(Math.sin(a), y, Math.cos(a)).normalize();
    add(new T.TorusGeometry(0.22, 0.06, 8, 20), BRASS, look(n.clone().multiplyScalar(1.46), n.clone().multiplyScalar(3)));
    const gl = new T.CircleGeometry(0.2, 18).toNonIndexed(); gl.applyMatrix4(look(n.clone().multiplyScalar(1.47), n.clone().multiplyScalar(3))); glass.push(gl);
  }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; add(new T.SphereGeometry(0.035, 6, 4), DARK, M(Math.cos(a) * 1.5, 0.1 * (i % 2 ? 1 : -1), Math.sin(a) * 1.5)); }
  add(new T.CylinderGeometry(0.55, 0.6, 0.32, 20), DARK, M(0, 1.5, 0));
  add(new T.TorusGeometry(0.16, 0.05, 8, 16), DARK, M(0, 1.78, 0));
  for (const a of [HP, -HP]) add(new T.BoxGeometry(0.5, 0.22, 0.03), BRASS, M(Math.sin(a) * 1.49, -0.35, Math.cos(a) * 1.49, 0, a, 0));
  const mergeAll = (list, withColor) => {
    let n = 0; for (const q of list) n += q.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = withColor ? new Float32Array(n * 3) : null; let o = 0;
    for (const q of list) { P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3); if (C) C.set(q.attributes.color.array, o * 3); o += q.attributes.position.count; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); if (C) geo.setAttribute('color', new T.BufferAttribute(C, 3)); geo.computeBoundingSphere();
    return geo;
  };
  const body = new T.Mesh(mergeAll(parts, true), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.65 }));
  const lit = new T.MeshBasicMaterial({ color: '#f3e3c0' });
  const ports = new T.Mesh(mergeAll(glass, false), lit);
  g.add(body, ports);
  // the cables: from the eye up to the cross girder (16.8), drawn with the body's steel as two thin rods (one mesh),
  // stretched each frame as the ball bobs
  const cg = mergeAll([new T.CylinderGeometry(0.035, 0.035, 1, 6).toNonIndexed().translate(-0.27, 0.5, 0), new T.CylinderGeometry(0.035, 0.035, 1, 6).toNonIndexed().translate(0.27, 0.5, 0)], false);
  const cables = new T.Mesh(cg, new T.MeshStandardMaterial({ color: DARK, roughness: 0.5, metalness: 0.6 }));
  g.add(cables);
  g.position.set(0, 14.5, 0);
  const set = (dy, night) => {
    g.position.y = 14.5 + dy;
    const bot = 1.78, L = 16.75 - g.position.y - bot;
    cables.position.y = bot; cables.scale.y = Math.max(0.05, L);
    lit.color.setRGB(0.95, 0.89, 0.75).multiplyScalar(0.55 + 0.6 * night);
  };
  set(0, 0);
  return { group: g, set };
}

// ------------------------------------------------------------------------------------------------ Feeding Time
// state machine on the match clock (looks only): returns per frame { bob, krill, wheel } in 0 … 1
// the bathysphere's bell (a ship's bell over the PA: a struck partial series, a long ring), registered with the game's
// synthesised voices on first use (a dynamic import: this file stays importable in Node)
let bellVoice = 0;
function ensureBell() {
  if (bellVoice) return;
  bellVoice = 1;
  import('../../../audio/audio.js').then((A) => {
    if (!A.SFX.aq_bell) A.SFX.aq_bell = {
      gain: 0.5, max: 3, jitter: 0, reverb: 0.45, minGap: 0.3,
      build(v, p) {
        v.tone({ type: 'sine', f: 784 * p, a: 0.002, h: 0.02, d: 1.8, peak: 0.6 });
        v.tone({ type: 'sine', f: 784 * 2.76 * p, a: 0.002, d: 1.0, peak: 0.24 });
        v.tone({ type: 'sine', f: 784 * 5.4 * p, a: 0.001, d: 0.4, peak: 0.1 });
        v.nz({ kind: 'white', f: 4200, q: 1.4, a: 0.001, d: 0.05, peak: 0.18 });
      },
    };
    bellVoice = 2;
  }).catch(() => { bellVoice = 3; });
}
export function feedingTime() {
  let m0 = null, t0 = -1, rung = 0;
  const S = { bob: 0, krill: 0, wheel: 0, active: false };
  const bell = () => { const au = G.audio; if (!au) return; au.play(bellVoice === 2 ? 'aq_bell' : 'pipe_chime', { volume: 0.75, pos: undefined }); };
  const f = (nowS) => {
    const m = G.match;
    if (m !== m0) { m0 = m; t0 = -1; rung = 0; if (m) ensureBell(); }
    if (m && t0 < 0 && m.state === 'playing' && !m.practice && !m.attract && Number.isFinite(m.duration) && m.duration > 60 && m.time <= 60 && m.time > 45) t0 = nowS;
    if (t0 < 0) { S.bob = S.krill = S.wheel = 0; S.active = false; return S; }
    const e = nowS - t0;
    S.active = e < 16;
    // three bell strokes at 0, 0.9 and 1.8 s
    while (rung < 3 && e >= rung * 0.9) { bell(); rung++; }
    S.bob = e < 9 ? Math.sin(Math.min(1, e / 9) * Math.PI) : 0;
    S.krill = e < 16 ? Math.min(1, e / 2) * Math.min(1, (16 - e) / 3) : 0;
    S.wheel = e < 14 ? Math.min(1, e / 2) * Math.min(1, (14 - e) / 3) : 0;
    S.rung = rung; S.t = e;
    return S;
  };
  f.state = S;
  return f;
}
// the krill cloud: tiny flecks drifting down from the Glass Walk's edge into the Great Tank (visible while uKrill > 0)
export function buildKrill(T, U, rnd) {
  const pos = [], aK = [];
  for (let i = 0; i < 260; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const g = new T.OctahedronGeometry(0.035 + rnd() * 0.02, 0);
    for (let k = 0; k < g.attributes.position.count; k++) { pos.push(g.attributes.position.getX(k) + x, g.attributes.position.getY(k), g.attributes.position.getZ(k) + z); aK.push(rnd(), 0.5 + rnd()); }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3)); geo.setAttribute('aK', new T.BufferAttribute(new Float32Array(aK), 2));
  geo.boundingSphere = new T.Sphere(new T.Vector3(0, 1, 0), 9);
  const mat = new T.MeshBasicMaterial({ color: '#e6b8a2', transparent: true, opacity: 0.85, depthWrite: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFT = U.uFT; sh.uniforms.uKrill = U.uKrill;
    sh.vertexShader = 'attribute vec2 aK; uniform float uFT; uniform float uKrill;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  transformed *= step(0.01, uKrill) * step(aK.x, uKrill);
  transformed.y += 2.1 - mod(aK.x * 2.6 + uFT * 0.18 * aK.y, 2.6);
  transformed.x += 0.12 * sin(uFT * 1.3 + aK.x * 30.0); transformed.z += 0.12 * cos(uFT * 1.1 + aK.x * 21.0);`);
  };
  mat.customProgramCacheKey = () => 'aq-krill';
  const m = new T.Mesh(geo, mat); m.name = 'aq-krill'; m.renderOrder = 1; m.frustumCulled = false;
  return m;
}
