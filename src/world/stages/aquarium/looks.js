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
//   jellies  the moon-jelly columns: milky glass lit from inside (warm white / pale lilac), the jellies drawn in its shader,
//            drifting up and pulsing
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
  const uGlow = { value: 0.1 };   // (the dusk glow from within: warm white × night × this)
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
  totalEmissiveRadiance += vec3(0.95, 0.92, 0.86) * uGlowW * uNightW;`);
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
// fro along an arc); aP2 = (bob, bob rate, scale, flex); aP3 = (clock: 0 the house clock, 1 Feeding Time's, waddle, tilt).
// Every swimmer of every kind is ONE instanced mesh: its geometry holds every kind's body (aPart), each instance keeps only
// its own kind's vertices (aKind; the rest collapse to a point and are culled) — the fish and the penguins cost one draw
// call together, and the vertex data stays a few thousand vertices
function swimmers(T, kinds, U) {
  let nv = 0, ni = 0; for (const k of kinds) { nv += k.geo.attributes.position.count; ni += k.list.length; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), w = new Float32Array(nv * 2), part = new Float32Array(nv), wg = new Float32Array(nv);
  let o = 0;
  kinds.forEach((k, ki) => {
    const g = k.geo, m = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); w.set(g.attributes.aW.array, o * 2);
    part.fill(ki, o, o + m); wg.fill(k.wing, o, o + m); o += m;
  });
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('aW', new T.BufferAttribute(w, 2)); geo.setAttribute('aPart', new T.BufferAttribute(part, 1)); geo.setAttribute('aWg', new T.BufferAttribute(wg, 1));
  const a0 = new Float32Array(ni * 4), a1 = new Float32Array(ni * 4), a2 = new Float32Array(ni * 4), a3 = new Float32Array(ni * 4), kd = new Float32Array(ni);
  const im = new T.InstancedMesh(geo, null, ni);
  const c = new T.Color(), id = new T.Matrix4();
  let i = 0;
  kinds.forEach((k, ki) => { for (const f of k.list) { a0.set(f.p0, i * 4); a1.set(f.p1, i * 4); a2.set(f.p2, i * 4); a3.set(f.p3 || [0, 0, 0, 0], i * 4); kd[i] = ki; im.setMatrixAt(i, id); im.setColorAt(i, c.set(f.c || '#ffffff')); i++; } });
  geo.setAttribute('aP0', new T.InstancedBufferAttribute(a0, 4)); geo.setAttribute('aP1', new T.InstancedBufferAttribute(a1, 4));
  geo.setAttribute('aP2', new T.InstancedBufferAttribute(a2, 4)); geo.setAttribute('aP3', new T.InstancedBufferAttribute(a3, 4)); geo.setAttribute('aKind', new T.InstancedBufferAttribute(kd, 1));
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = `attribute vec4 aP0; attribute vec4 aP1; attribute vec4 aP2; attribute vec4 aP3; attribute vec2 aW; attribute float aWg; attribute float aPart; attribute float aKind; uniform float uFT; uniform float uFT2;
mat3 aqYaw(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  float aqT = aP3.x > 0.5 ? uFT2 : uFT;
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
  mat.customProgramCacheKey = () => 'aq-swim-union';
  im.material = mat;
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'aq-swimmers';
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
  for (let i = 0; i < 3; i++) both(sharks, { p0: [0, 7.3 + 0.45 * i, -22.6, 2.4], p1: [i * 2.1, 0, 0.28 + 0.04 * i, i], p2: [0.1, 0.5, 0.75, 0.9], p3: [0, 0, 0, 0] });
  both(rays, { p0: [0, 6.55, -22.7, 2.0], p1: [1.0, 0, -0.22, 0], p2: [0.05, 0.6, 0.85, 0], p3: [0, 0, 0, 0] });
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
  const geos = cols.map(([x, z, r, y0, y1]) => { const g = new T.CylinderGeometry(r, r, y1 - y0, 40, 1, true).toNonIndexed(); g.translate(x, (y0 + y1) / 2, z); return g; });
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of geos) { const gg = g.index ? g.toNonIndexed() : g; pos.set(gg.attributes.position.array, o * 3); nor.set(gg.attributes.normal.array, o * 3); uv.set(gg.attributes.uv.array, o * 2); o += gg.attributes.position.count; }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
  const mat = new T.MeshStandardMaterial({ color: '#e9e4ef', roughness: 0.2, metalness: 0.0, emissive: '#000000' });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFT = U.uFT; sh.uniforms.uNightJ = U.uNight;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vJ;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvJ = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vJ; uniform float uFT; uniform float uNightJ;
float jh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`).replace('#include <color_fragment>', `#include <color_fragment>
  // jellies: a grid of cells round the column (8 across, 5 up), each with one bell drifting up and pulsing
  vec2 q = vec2(vJ.x * 8.0, vJ.y * 4.0 + uFT * 0.06);
  vec2 ci = floor(q), cf = fract(q) - 0.5;
  float r0 = jh(ci), r1 = jh(ci + 7.3);
  vec2 c = vec2((r0 - 0.5) * 0.35, (r1 - 0.5) * 0.3);
  float pulse = 0.85 + 0.15 * sin(uFT * 2.0 + r0 * 6.28);
  vec2 d = (cf - c) / vec2(0.28 * pulse, 0.2);
  float bell = smoothstep(1.0, 0.7, length(d)) * step(-0.15, d.y);
  float rim = smoothstep(0.75, 0.95, length(d)) * bell;
  float tent = smoothstep(0.06, 0.0, abs(cf.x - c.x + 0.05 * sin(cf.y * 18.0 + uFT))) * step(cf.y, c.y) * step(c.y - 0.42, cf.y) * 0.6;
  float j = clamp(bell * 0.55 + rim * 0.6 + tent, 0.0, 1.0) * step(0.25, r0);
  float glowJ = 0.55 + 0.45 * smoothstep(0.0, 1.0, vJ.y);
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.92 + 0.08 * glowJ), vec3(1.0, 0.99, 1.0), j * 0.6);
  vec3 jellyE = (vec3(0.93, 0.9, 0.97) * (0.22 + 0.25 * uNightJ) * glowJ + vec3(1.0, 0.97, 1.0) * j * (0.18 + 0.32 * uNightJ));`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += jellyE;`);
  };
  mat.customProgramCacheKey = () => 'aq-jelly';
  const m = new T.Mesh(geo, mat); m.name = 'aq-jellies'; m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------ the bubble columns
// cols: [[x, z, r, y0, y1], …]: their water (with the house material), glass, and bubbles streaming up inside
export function buildBubbleCols(T, U, rnd, cols) {
  const list = [];
  for (const [x, z, r, y0, y1] of cols) for (let i = 0; i < 90; i++) { const a = rnd() * TAU, rr = Math.sqrt(rnd()) * (r - 0.18); list.push([x + Math.cos(a) * rr, z + Math.sin(a) * rr, 0.04 + rnd() * 0.06, rnd(), 0.6 + rnd() * 0.8, y0, y1]); }
  const pos = [], aB = [], aP = [];
  for (const [x, z, r, seed, sp, y0, y1] of list) {
    const g = new T.OctahedronGeometry(r, 0);
    for (let i = 0; i < g.attributes.position.count; i++) { pos.push(g.attributes.position.getX(i) + x, g.attributes.position.getY(i), g.attributes.position.getZ(i) + z); aB.push(seed, sp, y0, y1 - y0); aP.push(x, z); }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3)); geo.setAttribute('aB', new T.BufferAttribute(new Float32Array(aB), 4)); geo.setAttribute('aP', new T.BufferAttribute(new Float32Array(aP), 2));
  geo.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 40);
  const mat = new T.MeshBasicMaterial({ color: '#eefaff', transparent: true, opacity: 0.75, depthWrite: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFT = U.uFT;
    sh.vertexShader = 'attribute vec4 aB; attribute vec2 aP; uniform float uFT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  transformed.y += aB.z + 0.1 + mod(aB.x * 9.0 + uFT * 1.4 * aB.y, aB.w - 0.2);
  transformed.x += 0.06 * sin(uFT * 3.0 + aB.x * 40.0); transformed.z += 0.06 * cos(uFT * 2.6 + aB.x * 33.0);`);
  };
  mat.customProgramCacheKey = () => 'aq-colbubbles';
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
