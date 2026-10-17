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
  // (the dusk glow from within: warm white × night × this; the clear water — the Reef Windows, the columns, the pools —
  // glows a little less. Measured at dusk by scenes/aquarium-glow.js PRE_ARGS=pal, every team palette, the fish and
  // bubbles out of the sample points: the glow's own share of a Great Tank pixel (glow on minus off) ≤ 60 % of the
  // brighter fresh splat beside it in all five palettes — tangerine-cobalt is the tightest — and it stays far less
  // saturated than ink. Art round 2: 0.15, not round 1's 0.28: with a steady probe 0.28 measured 0.92 of tangerine's splat
  // (round 1's 0.45 was another palette with a shark in a sample point))
  const uGlow = { value: 0.15 };
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
  // (a blacktip's back is grey and its belly white: seen from the shark tunnel's floor the belly is what shows — fix
  // round 3 checked them from below with the eagle rays; the body is white, darkened up its flanks to the grey back)
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const belly = (x, y) => 1 - 0.78 * ss(-0.09, 0.05, y);
  return geoFrom(T, [
    { g: tx(new T.SphereGeometry(0.5, 10, 7), 0, 0, 0, 0, 0, 0, 0.42, 0.42, 2.1), c: '#e2e6e8', tail: true, shade: belly },
    { g: tx(new T.ConeGeometry(0.22, 0.75, 6), 0, 0.38, 0.05, -0.5, 0, 0, 0.25, 1, 1.4), c: '#6b757a', tail: true },
    { g: tx(new T.ConeGeometry(0.2, 0.9, 6), 0, 0.12, -1.38, -1.2, 0, 0, 0.18, 1, 1.2), c: '#3a3f42', tail: true },
    { g: tx(new T.ConeGeometry(0.16, 0.6, 6), 0, -0.18, -1.3, -2.1, 0, 0, 0.18, 1, 1), c: '#3a3f42', tail: true },
    { g: tx(new T.ConeGeometry(0.14, 0.62, 5), 0.3, -0.1, 0.25, 0, 0, -2.0, 1, 1, 0.5), c: '#5c6569', tail: true },
    { g: tx(new T.ConeGeometry(0.14, 0.62, 5), -0.3, -0.1, 0.25, 0, 0, 2.0, 1, 1, 0.5), c: '#5c6569', tail: true },
  ]);
}
// a spotted eagle ray (fix round 3: the rays read as dark frying pans from the tunnel floor — a flattened sphere with a stick
// tail): a kite of a body whose wings sweep back to pointed tips (span ≈ 2 × the body's length), the leading edge convex,
// the trailing edge falcate; a short duck-bill head lobe before the wings; a thin tapering whip of a tail. The back is a dark
// slate, a little lighter toward the wingtips, the belly white (what the tunnel sees overhead). Every wing vertex keeps its flex (aW.y = |x|)
function eagleWing(T, top) {
  // the right half's outline (x across, z forward), the snout's root to the tail root; the left half mirrors it. Star-shaped
  // round the origin, so every ring is the outline scaled (no fold-over); the wingtip is a vertex (it stays a point)
  const half = [[0, 0.4], [0.12, 0.39], [0.32, 0.29], [0.56, 0.13], [0.8, -0.04], [1.0, -0.2], [0.86, -0.25], [0.64, -0.245], [0.42, -0.27], [0.24, -0.34], [0.1, -0.42], [0, -0.44]];
  const poly = [...half, ...half.slice(1, -1).reverse().map(([x, z]) => [-x, z])];
  const ring = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.24));
    for (let k = 0; k < n; k++) ring.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const NA = ring.length, NR = 2, P = [], idx = [];
  P.push(0, top ? 0.075 : -0.05, 0);
  for (let r = 1; r <= NR; r++) for (let a = 0; a < NA; a++) {
    const t = r / NR, h = (top ? 0.075 : -0.05) * (1 - Math.pow(t, 1.6)) + (top ? 0.004 : -0.004);
    P.push(ring[a][0] * t, h, ring[a][1] * t);
  }
  for (let a = 0; a < NA; a++) { const a2 = (a + 1) % NA; idx.push(0, 1 + a2, 1 + a); }
  for (let r = 1; r < NR; r++) for (let a = 0; a < NA; a++) {
    const a2 = (a + 1) % NA, i0 = 1 + (r - 1) * NA + a, i1 = 1 + (r - 1) * NA + a2, j0 = 1 + r * NA + a, j1 = 1 + r * NA + a2;
    idx.push(i0, i1, j1, i0, j1, j0);
  }
  // (as listed the triangles face down: the belly keeps them, the back turns them over — the material culls back faces)
  if (top) for (let i = 0; i < idx.length; i += 3) { const k = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = k; }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function rayGeo(T) {
  return geoFrom(T, [
    { g: eagleWing(T, true), c: '#3b3c40', wing: true, shade: (x, y, z) => 1 + 0.5 * Math.min(1, Math.hypot(x, z)) },
    { g: eagleWing(T, false), c: '#ebe8e1', wing: true, shade: (x, y, z) => 0.82 + 0.18 * (1 - Math.min(1, Math.hypot(x, z * 1.4))) },
    // the duck-bill head lobe before the wings (white under, slate over)
    { g: tx(new T.SphereGeometry(0.5, 6, 4), 0, -0.005, 0.5, 0, 0, 0, 0.24, 0.12, 0.3), c: '#ebe8e1', shade: (x, y) => (y > 0.004 ? 0.085 : 1) },
    // the whip: a thin four-sided taper back from the tail root, 2.4 × the body's length
    { g: tx(new T.ConeGeometry(0.022, 1.9, 4), 0, 0, -1.3, -HP, 0, 0), c: '#2f3033', tail: true },
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
  // (fix round 3: a fuller reef — ten more reef fish per window on their own seed, so every earlier swimmer keeps its path;
  // every swimmer runs every kind's vertices, so the count stays modest; the clownfish in the reef's anemones are the
  // exhibits' own (buildExhibits): a kind here would add its vertices to every swimmer)
  const r2 = mulberry(5150);
  for (let i = 0; i < 10; i++) {
    const a = (-56 + r2() * 52) * Math.PI / 180, amp = (3 + r2() * 5) * Math.PI / 180;
    both(small, { p0: [0, 0.9 + r2() * 2.2, 0, 30.8 + r2() * 1.1], p1: [a, amp, 0.1 + r2() * 0.14, r2() * 6], p2: [0.06, 0.9, 0.26 + r2() * 0.2, 1.3], p3: [0, 0, 0, 0], c: reefC[(i + 3) % reefC.length] });
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
  vec3 jellyE = jIn * mix(vec3(1.0), vec3(1.0, 0.94, 1.08), uNightJ) * (0.9 + 0.15 * uNightJ) * (1.0 - 0.6 * fresJ);`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
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

// ------------------------------------------------------------------------------------------------ exhibits
// (fix round 3) The Reef Windows' reef and what the touch pools' viewing panels look into, in ONE mesh for both halves (one
// draw call, like the fish): an unlit material whose light is its own — the reef lit from the window's lid (brightest near
// the top, on what faces up, a soft caustic play on it), by day and, warm-white, at dusk ("every tank glows softly from
// within": its glow is userData.glow, which the glow probe switches off to measure it); the touch pools' panels traced in
// the shader — the eye ray runs into a box of clear water behind the acrylic: sand with sea stars, urchins and anemones on
// it, rock walls, the bright rippling surface overhead, the water between thickening with distance — and the creatures
// pressed to each panel's glass, real geometry lit like the reef. Kinds (aEx.x): 0 lit, 1 traced, 2 self-lit (the lid lamp),
// 3 a clownfish (lit, circling its anemone in the vertex shader).
// The reef: DESIGN.md §5.1 / §5.4 — staghorn, sea fans, table and brain corals, sponges, anemones with clownfish, rock, on
// the near half of the sand (r 30.75 … 31.3) with rock, fans and staghorn behind, in the half-saturated coral palette; the
// moray in its pipe and the octopus in its den (from arch.js: they were lit like the hall outside, grey through the water)
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const REEF = { glass: 30.47, back: 32.2, sand: 0.64, lid: 3.38, runs: [[-70, -67], [-58, -2.6]], moray: -31, den: -47 };
// (DESIGN.md §5.4's half-saturated coral family, a little warmer than its swatch: the water's veil greys it further)
const CORAL = ['#d08f7c', '#e0b08f', '#e3a9a0', '#b496b8', '#cf9f6a', '#93b38c', '#c57466', '#dcc08a', '#a28fc4'];
// the reef's pieces (Alpha's window; the twin turns them): { k: kind, a: bearing, r, s: size, seed, c: colour }
let REEF_PLAN = null;
export function reefPlan() {
  if (REEF_PLAN) return REEF_PLAN;
  const rnd = mulberry(9157), items = [], anemones = [];
  const near = (a, w) => Math.abs(a - REEF.moray) < w || Math.abs(a - REEF.den) < w;
  const pol = (a, r) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
  for (const [a0, a1] of REEF.runs) {
    // the back row: rock heaps against the back wall (to 1.6 m), each crowned with a tall sea fan, a staghorn thicket or
    // tube sponges, and a tall fan or staghorn between them — the reef rises most of the way up the window behind
    for (let a = a0 + 0.8; a < a1 - 0.5; a += 2.0 + rnd() * 0.8) {
      if (near(a, 1.3)) continue;
      const s = 1.0 + rnd() * 0.6;
      items.push({ k: 'rock', a, r: 31.85 + rnd() * 0.12, s, h: 0.75 + rnd() * 0.75, seed: 1 + Math.floor(rnd() * 97), c: rnd() < 0.5 ? '#8a7d70' : '#7b7368' });
      const top = ['fan', 'stag', 'fan', 'sponge', 'stag', 'fan'][Math.floor(rnd() * 6)];
      items.push({ k: top, a: a + (rnd() - 0.5) * 1.0, r: 31.7 + rnd() * 0.15, s: (top === 'fan' ? 1.5 : 1.25) + rnd() * 0.5, seed: Math.floor(rnd() * 1e4), c: CORAL[Math.floor(rnd() * CORAL.length)], y: 0.35 + rnd() * 0.45 });
      if (a + 1.1 < a1 - 0.5 && !near(a + 1.1, 1.3)) items.push({ k: rnd() < 0.55 ? 'fan' : 'stag', a: a + 1.0 + rnd() * 0.3, r: 31.95 + rnd() * 0.1, s: 1.4 + rnd() * 0.5, seed: Math.floor(rnd() * 1e4), c: CORAL[Math.floor(rnd() * CORAL.length)] });
    }
    // the middle row (r 31.3 … 31.55): staghorn, table and brain corals, sponges on low rock
    const MR = ['stag', 'table', 'brain', 'sponge', 'stag', 'rock'];
    for (let a = a0 + 1.3; a < a1 - 0.5; a += 1.7 + rnd() * 0.9) {
      if (near(a, 1.4)) continue;
      const kind = MR[Math.floor(rnd() * MR.length)];
      items.push({ k: kind, a, r: 31.3 + rnd() * 0.25, s: 1.1 + rnd() * 0.5, h: 0.4 + rnd() * 0.3, seed: Math.floor(rnd() * 1e4), c: kind === 'rock' ? '#857a6e' : CORAL[Math.floor(rnd() * CORAL.length)], y: kind === 'rock' ? 0 : 0.05 + rnd() * 0.15 });
    }
    // the front row: on the near half of the sand
    const FR = ['brain', 'anemone', 'table', 'stag', 'sponge', 'brain', 'rock', 'anemone', 'stag', 'table', 'fan', 'anemone'];
    let k = Math.floor(rnd() * FR.length);
    for (let a = a0 + 0.6; a < a1 - 0.4; a += 1.15 + rnd() * 0.7) {
      if (near(a, 1.6)) continue;
      const kind = FR[k++ % FR.length], r = 30.78 + rnd() * 0.45, s = 0.95 + rnd() * 0.5;
      const it = { k: kind, a, r, s, seed: Math.floor(rnd() * 1e4), c: CORAL[Math.floor(rnd() * CORAL.length)], h: 0.3 + rnd() * 0.25 };
      if (kind === 'anemone') { it.c = rnd() < 0.6 ? '#d9a3a6' : '#b8c49a'; const [x, z] = pol(a, r); anemones.push({ x, y: REEF.sand + 0.12 * s * 1.25, z, n: 2 + (rnd() < 0.4 ? 1 : 0) }); }
      items.push(it);
    }
  }
  items.push({ k: 'moray', a: REEF.moray, r: 31.4 }, { k: 'den', a: REEF.den, r: 31.5 });
  REEF_PLAN = { items, anemones };
  return REEF_PLAN;
}

// a builder of non-indexed triangles with a colour and the two exhibit attributes per vertex
class ExB {
  constructor(T) { this.T = T; this.p = []; this.n = []; this.c = []; this.e = []; this.e2 = []; this.ex = [0, REEF.lid, 0, 0]; this.ex2 = [0, 0, 0, 0]; this.m = new T.Matrix4(); }
  M(x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) { const T = this.T; return new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz, 'YXZ')), new T.Vector3(sx, sy, sz)); }
  // g through matrix m (after the frame this.m); col: a hex or fn(local position, local normal) → [r, g, b] (linear)
  add(g, m, col) {
    const T = this.T, G = g.index ? g.toNonIndexed() : g;
    if (!G.attributes.normal) G.computeVertexNormals();
    const W = new T.Matrix4().multiplyMatrices(this.m, m), nm = new T.Matrix3().getNormalMatrix(W);
    const P = G.attributes.position, N = G.attributes.normal, v = new T.Vector3(), nv = new T.Vector3(), lp = new T.Vector3(), ln = new T.Vector3();
    const C = typeof col === 'function' ? null : Array.isArray(col) ? col : (() => { const k = new T.Color(col); return [k.r, k.g, k.b]; })();
    for (let i = 0; i < P.count; i++) {
      lp.fromBufferAttribute(P, i); ln.fromBufferAttribute(N, i);
      v.copy(lp).applyMatrix4(W); nv.copy(ln).applyMatrix3(nm).normalize();
      this.p.push(v.x, v.y, v.z); this.n.push(nv.x, nv.y, nv.z);
      const c = C || col(lp, ln);
      this.c.push(c[0], c[1], c[2]); this.e.push(...this.ex); this.e2.push(...this.ex2);
    }
  }
  // the same triangles turned 180° about Y (the twin's half)
  twin(from = 0) {
    const n = this.p.length;
    for (let i = from; i < n; i += 3) { this.p.push(-this.p[i], this.p[i + 1], -this.p[i + 2]); this.n.push(-this.n[i], this.n[i + 1], -this.n[i + 2]); }
    const nc = this.c.length; for (let i = from; i < nc; i++) this.c.push(this.c[i]);
    for (let i = (from / 3) * 4; i < (n / 3) * 4; i++) { this.e.push(this.e[i]); this.e2.push(this.e2[i]); }
    // (a clownfish's orbit centre turns with it)
    for (let i = (n / 3) * 4; i < this.e.length; i += 4) if (this.e[i] > 2.5) { this.e2[i] = -this.e2[i]; this.e2[i + 1] = -this.e2[i + 1]; }
  }
  geo() {
    const T = this.T, g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3)); g.setAttribute('aEx', new T.Float32BufferAttribute(this.e, 4)); g.setAttribute('aEx2', new T.Float32BufferAttribute(this.e2, 4));
    g.computeBoundingSphere();
    return g;
  }
}
const lin = (T, hex) => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixL = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// a lumpy rock (an icosahedron pushed about by a few sines; faceted), radius 1 before scaling
function rockG(T, seed, det = 1) {
  const g = new T.IcosahedronGeometry(1, det), P = g.attributes.position, s = seed * 1.713;   // (a polyhedron is non-indexed already)
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    let k = 1 + 0.18 * Math.sin(x * 3.1 + s) * Math.sin(y * 2.7 + s * 1.3) * Math.sin(z * 3.3 + s * 0.7) + 0.08 * Math.sin(x * 6.3 + z * 5.1 + s * 2.1);
    if (y < -0.2) k *= 1 - (-0.2 - y) * 0.4;
    P.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}
// a branching coral (staghorn): rods from P along dir, three levels, the tips paler
function staghorn(T, X, m, seed, c, s) {
  const rnd = mulberry(seed), base = lin(T, c), tip = mixL(base, [0.95, 0.9, 0.85], 0.55), up = new T.Vector3(0, 1, 0);
  const branch = (P, dir, len, rad, lvl) => {
    const Q = P.clone().addScaledVector(dir, len);
    const g = new T.CylinderGeometry(lvl >= 2 ? rad * 0.35 : rad * 0.7, rad, len, 4, 1, lvl < 2);
    g.translate(0, len / 2, 0);
    const q = new T.Quaternion().setFromUnitVectors(up, dir), mm = new T.Matrix4().compose(P, q, new T.Vector3(1, 1, 1));
    X.add(g, new T.Matrix4().multiplyMatrices(m, mm), (lp) => mixL(base, tip, Math.min(1, (lp.y / len) * 0.5 + lvl * 0.3)));
    if (lvl >= 2) return;
    const n = 2 + (rnd() < 0.3 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, tilt = 0.35 + rnd() * 0.45;
      const d = new T.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt)).lerp(dir, 0.35).normalize();
      branch(Q, d, len * (0.62 + rnd() * 0.2), rad * 0.7, lvl + 1);
    }
  };
  const n0 = 3;
  for (let k = 0; k < n0; k++) { const a = (k / n0) * Math.PI * 2 + rnd(), tl = 0.15 + rnd() * 0.35; branch(new T.Vector3(Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06), new T.Vector3(Math.cos(a) * Math.sin(tl), Math.cos(tl), Math.sin(a) * Math.sin(tl)), 0.26 * s, 0.035 * s, 0); }
}
// a sea fan (a gorgonian): a flat fan of lace in the local x-y plane, facing the glass — a solid web with a wavy rim, darker
// veins branching up through it and a mottled pale lace between them (both faces); its stalk
function seaFan(T, X, m, seed, c, s) {
  const rnd = mulberry(seed), base = lin(T, c), H = 0.75 * s, Wd = 0.55 * s, NA = 10, NR = 4, P = [], Cc = [];
  const ph = rnd() * 6.28, rim = (u) => 1 + 0.07 * Math.sin(u * 9 + ph) + 0.05 * Math.sin(u * 23 + ph * 2);
  const at = (u, t) => { const a = (u - 0.5) * 1.95, R = t * rim(u); return [Math.sin(a) * Wd * R, 0.06 * s + H * R * Math.cos(a * 0.55)]; };
  const vein = (u, t) => { const k = Math.abs(Math.sin((u * (5 + 4 * t)) * Math.PI + Math.sin(t * 5 + ph))); return k < 0.18 ? 0.62 : 1.0 + 0.12 * Math.sin(u * 61 + t * 43 + ph); };
  for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) {
    const u0 = i / NA, u1 = (i + 1) / NA, t0 = j / NR, t1 = (j + 1) / NR, q = [[u0, t0], [u1, t0], [u1, t1], [u0, t1]];
    for (const z of [0.004, -0.004]) for (const k of (z > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2])) { const [u, t] = q[k], [x, y] = at(u, t); P.push(x, y, z); Cc.push(...mul(base, vein(u, t) * (0.78 + 0.3 * t))); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  let ci = 0; X.add(g, m, () => { const v = [Cc[ci], Cc[ci + 1], Cc[ci + 2]]; ci += 3; return v; });
  X.add(new T.CylinderGeometry(0.02 * s, 0.035 * s, 0.1 * s, 5, 1, true), X.M(0, 0.05 * s, 0).premultiply(m), mul(base, 0.6));
}
// an anemone: a short column, its oral disc, a crown of tentacles leaning out, pale tips
function anemone(T, X, m, seed, c, s) {
  const rnd = mulberry(seed), base = lin(T, c), tip = mixL(base, [0.95, 0.92, 0.86], 0.6), r = 0.09 * s;
  X.add(new T.CylinderGeometry(r * 0.85, r, 0.1 * s, 10, 1, true).translate(0, 0.05 * s, 0), m, mul(base, 0.8));
  X.add(new T.CircleGeometry(r * 0.85, 10).rotateX(-Math.PI / 2).translate(0, 0.1 * s, 0), m, mul(base, 0.6));
  const n = 18;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd() * 0.2, tilt = 0.35 + 0.55 * (k % 2) + rnd() * 0.2, L = (0.13 + rnd() * 0.07) * s;
    const g = new T.ConeGeometry(0.016 * s, L, 4, 1, true).translate(0, L / 2, 0);
    g.rotateZ(-tilt); g.rotateY(-a); g.translate(Math.cos(a) * r * 0.7, 0.1 * s, Math.sin(a) * r * 0.7);
    X.add(g, m, (lp) => mixL(base, tip, Math.min(1, Math.max(0, (lp.y - 0.1 * s) / (L * 0.8)))));
  }
}
// what each piece of the plan looks like (frame: its foot on the sand, local +z toward the glass)
function reefPiece(T, X, it) {
  const a = it.a * Math.PI / 180, x = it.r * Math.cos(a), z = it.r * Math.sin(a), ry = Math.atan2(-Math.cos(a), -Math.sin(a));
  const s = it.s || 1, y0 = REEF.sand - 0.02 + (it.y || 0), m = X.M(x, y0, z, ry);
  // live rock: grey-brown, darker low, crusted with coralline pinks, lilacs and ochres in patches, a little weed on top
  const CRUST = ['#c98a8a', '#a98fb4', '#c9a26c', '#9fae86'].map((h) => lin(T, h));
  const rock = (sd, c) => (lp) => {
    const b = lin(T, c), t = Math.max(0, Math.min(1, (lp.y + 1) / 2)); let col = mul(b, 0.72 + 0.45 * t);
    const n = Math.sin(lp.x * 5.3 + sd) * Math.sin(lp.y * 4.1 - sd * 0.7) * Math.sin(lp.z * 4.7 + sd * 1.9);
    if (n > 0.12) col = mixL(col, CRUST[(Math.floor(sd + lp.x * 2 + lp.z * 3) % 4 + 4) % 4], Math.min(0.75, (n - 0.12) * 3.2));
    if (lp.y > 0.5) col = mixL(col, lin(T, '#7f8a5a'), 0.3 * Math.min(1, (lp.y - 0.5) * 2));
    return col;
  };
  switch (it.k) {
    case 'rock': X.add(rockG(T, it.seed, 1), X.M(0, it.h * 0.22, 0, it.seed, 0.62 * s, it.h * 0.8, 0.44 * s).premultiply(m), rock(it.seed, it.c)); break;
    case 'brain': {
      const r = 0.24 * s, b = lin(T, it.k === 'brain' ? (it.seed % 2 ? '#c4b48a' : '#c9ab86') : it.c);
      X.add(new T.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), X.M(0, -0.02, 0, 0, 1, 0.72, 1).premultiply(m), (lp) => mul(b, 0.8 + 0.22 * Math.sin(lp.x * 46 + Math.sin(lp.z * 38) * 2.2 + lp.y * 20)));
      break;
    }
    case 'table': {
      const h = (0.25 + 0.2 * ((it.seed % 7) / 7)) * s, r = 0.3 * s, b = lin(T, it.c);
      X.add(new T.CylinderGeometry(0.04 * s, 0.07 * s, h, 6, 1, true), X.M(0, h / 2, 0).premultiply(m), mul(b, 0.7));
      X.add(new T.CylinderGeometry(r, r * 0.85, 0.05 * s, 14), X.M(0, h, 0, 0, 1, 1, 1, 0.08, -0.06).premultiply(m), (lp, ln) => mul(b, ln.y > 0.5 ? 1.0 : 0.6));
      break;
    }
    case 'stag': staghorn(T, X, m, it.seed, it.c, s * 1.1); break;
    case 'fan': seaFan(T, X, m, it.seed, it.c, s); break;
    case 'anemone': anemone(T, X, m, it.seed, it.c, s * 1.25); X.add(rockG(T, it.seed, 0), X.M(0, -0.04, -0.05, 0, 0.2 * s, 0.08, 0.16 * s).premultiply(m), rock(it.seed, '#7b7368')); break;
    case 'sponge': {
      const b = lin(T, it.c), rnd = mulberry(it.seed);
      for (let k = 0; k < 3; k++) {
        const h = (0.22 + rnd() * 0.25) * s, r = (0.05 + rnd() * 0.03) * s, ox = (k - 1) * 0.1 * s, oz = (rnd() - 0.5) * 0.12;
        X.add(new T.CylinderGeometry(r, r * 0.8, h, 9, 1, true), X.M(ox, h / 2, oz, 0, 1, 1, 1, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3).premultiply(m), mul(b, 0.9));
        X.add(new T.CircleGeometry(r * 0.92, 9).rotateX(-Math.PI / 2), X.M(ox, h - 0.005, oz).premultiply(m), mul(b, 0.25));
      }
      break;
    }
    case 'moray': {   // the moray's pipe (a terracotta drain on the sand), its head out of it
      X.add(new T.CylinderGeometry(0.22, 0.22, 1.0, 12, 1, true), X.M(0, 0.25, 0, 0, 1, 1, 1, 0, Math.PI / 2).premultiply(m), lin(T, '#9c6a4c'));
      X.add(new T.CircleGeometry(0.2, 12).rotateY(Math.PI / 2), X.M(0.5, 0.25, 0).premultiply(m), lin(T, '#1c1612'));
      X.add(new T.SphereGeometry(0.17, 10, 8), X.M(0.55, 0.27, 0.02, 0, 1.5, 1, 1).premultiply(m), lin(T, '#6b6a3a'));
      X.add(new T.SphereGeometry(0.03, 6, 4), X.M(0.66, 0.33, 0.13).premultiply(m), lin(T, '#e8e2c0'));
      break;
    }
    case 'den': {     // the octopus's den: a rock with a dark mouth, the octopus peering out
      X.add(rockG(T, 77, 1), X.M(0, 0.2, -0.1, 0, 1.0, 0.75, 0.6).premultiply(m), rock(77, '#6e6760'));
      X.add(new T.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), X.M(0, 0.14, 0.4, 0, 1, 0.35, 0.85, Math.PI / 2).premultiply(m), lin(T, '#24201e'));
      X.add(new T.SphereGeometry(0.16, 10, 8), X.M(0.05, 0.18, 0.48).premultiply(m), lin(T, '#b46e4e'));
      for (const sx of [-1, 1]) X.add(new T.SphereGeometry(0.035, 6, 4), X.M(0.05 + sx * 0.07, 0.23, 0.6).premultiply(m), lin(T, '#e7d9a7'));
      break;
    }
    default: break;
  }
}
// the pool's creatures pressed to a panel's glass (frame: the panel's window centre on the face, +z out; sizes in metres)
function pressed(T, X, kind, u, v) {
  const m = X.M(u, v, 0);
  if (kind === 'star') {
    const P = [], R = 0.12, r = 0.04, d = 0.016;
    const pt = (k) => { const a = (k / 10) * Math.PI * 2 + 0.3, rr = k % 2 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr]; };
    for (let k = 0; k < 10; k++) { const A = pt(k), Bq = pt(k + 1); P.push(0, 0, d, A[0], A[1], d * 0.4, Bq[0], Bq[1], d * 0.4); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
    X.add(g, m, (lp) => mul(lin(T, '#d0703f'), 0.85 + 0.25 * (1 - Math.hypot(lp.x, lp.y) / R)));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; X.add(new T.SphereGeometry(0.012, 5, 3), X.M(u + Math.cos(a) * 0.06, v + Math.sin(a) * 0.06, d * 0.8), lin(T, '#f0c08a')); }
  } else if (kind === 'urchin') {
    const b = lin(T, '#3c2b45');
    X.add(new T.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), X.M(u, v, 0, 0, 1, 0.25, 1, Math.PI / 2), b);
    const rnd = mulberry(311);
    for (let k = 0; k < 22; k++) {
      const a = rnd() * Math.PI * 2, e = rnd() * 1.1, L = 0.05 + rnd() * 0.04, dir = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e) * 0.12];
      const g = new T.ConeGeometry(0.007, L, 3, 1, true).translate(0, L / 2, 0), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...dir).normalize());
      X.add(g, new T.Matrix4().compose(new T.Vector3(u + dir[0] * 0.06, v + dir[1] * 0.06, 0.012), q, new T.Vector3(1, 1, 1)), mul(b, 1.3));
    }
  } else if (kind === 'anemone') {
    const b = lin(T, '#d39aa3'), tip = lin(T, '#f3dcd2');
    X.add(new T.CircleGeometry(0.06, 12), X.M(u, v, 0.006), mul(b, 0.75));
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, L = 0.08 + 0.03 * (k % 3);
      const g = new T.ConeGeometry(0.012, L, 4, 1, true).translate(0, L / 2, 0);
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.cos(a), Math.sin(a), 0.1).normalize());
      X.add(g, new T.Matrix4().compose(new T.Vector3(u + Math.cos(a) * 0.04, v + Math.sin(a) * 0.04, 0.012), q, new T.Vector3(1, 0.55, 1)), (lp) => mixL(b, tip, Math.min(1, lp.y / L)));
    }
  }
}
export function buildExhibits(T, U, TOUCH) {
  const X = new ExB(T);
  // ---- the reef (Alpha's window, then the twin)
  const deg = Math.PI / 180;
  for (const [a0, a1] of REEF.runs) {
    const n = Math.max(2, Math.round(a1 - a0)), sand = lin(T, '#cdbb93'), deep = lin(T, '#223f47'), deepTop = lin(T, '#4a777d');
    // the sand: a strip from the glass to the back wall, gently rippled
    const P = [], C = [];
    const sp = (a, r) => { const y = REEF.sand + 0.012 * Math.sin(a * 2.3 + r * 9) + 0.02 * (r - REEF.glass); return [r * Math.cos(a * deg), y, r * Math.sin(a * deg)]; };
    const rs = [REEF.glass + 0.05, 31.0, 31.6, REEF.back];
    for (let i = 0; i < n; i++) for (let j = 0; j < rs.length - 1; j++) {
      const A = a0 + ((a1 - a0) * i) / n, Bq = a0 + ((a1 - a0) * (i + 1)) / n, q = [sp(A, rs[j]), sp(Bq, rs[j]), sp(Bq, rs[j + 1]), sp(A, rs[j + 1])];
      for (const k of [0, 1, 2, 0, 2, 3]) { P.push(...q[k]); const w = 0.85 + 0.15 * Math.sin(q[k][0] * 7.1 + q[k][2] * 5.3); C.push(...mul(sand, w)); }
    }
    { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); let ci = 0; X.add(g, new T.Matrix4(), () => { const c = [C[ci], C[ci + 1], C[ci + 2]]; ci += 3; return c; }); }
    // the back wall: dark reef rock, lighter toward the lid (a painted deep: lit by the lid like the rest)
    { const g = new T.CylinderGeometry(REEF.back, REEF.back, REEF.lid - REEF.sand + 0.05, n, 4, true, Math.PI / 2 - a1 * deg, (a1 - a0) * deg); g.translate(0, (REEF.lid + REEF.sand) / 2, 0);
      const gi = g.toNonIndexed(), Pp = gi.attributes.position; const idx = []; for (let i = 0; i < Pp.count; i += 3) idx.push(i, i + 2, i + 1);
      const g2 = new T.BufferGeometry(); const arr = []; for (const i of idx) arr.push(Pp.getX(i), Pp.getY(i), Pp.getZ(i)); g2.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g2.computeVertexNormals();
      X.add(g2, new T.Matrix4(), (lp) => { const t = (lp.y - REEF.sand) / (REEF.lid - REEF.sand), w = 0.8 + 0.25 * Math.sin(lp.x * 3.1 + lp.y * 4.3) * Math.sin(lp.z * 2.7 - lp.y * 2.1); return mul(mixL(deep, deepTop, t * t), w); }); }
    // the lid lamp: a warm strip under the lid behind the glass (self-lit)
    X.ex = [2, REEF.lid, 0, 0];
    { const g = new T.CylinderGeometry(30.66, 30.66, 0.05, n, 1, true, Math.PI / 2 - a1 * deg, (a1 - a0) * deg); const gi = g.toNonIndexed(), Pp = gi.attributes.position, arr = []; for (let i = 0; i < Pp.count; i += 3) for (const k of [0, 2, 1]) arr.push(Pp.getX(i + k), Pp.getY(i + k), Pp.getZ(i + k)); const g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g2.computeVertexNormals(); X.add(g2, X.M(0, REEF.lid - 0.06, 0), lin(T, '#fff1d6')); }
    X.ex = [0, REEF.lid, 0, 0];
  }
  for (const it of reefPlan().items) reefPiece(T, X, it);
  // the clownfish: two or three hovering in each anemone, circling it in the vertex shader (kind 3: aEx2 = the orbit's
  // centre, its rate, its phase), orange with two white bands
  { const rnd = mulberry(5151), orange = lin(T, '#e2742c'), white = lin(T, '#f4f1ea'), tailC = lin(T, '#d8682a');
    for (const an of reefPlan().anemones) for (let k = 0; k < (an.n || 2); k++) {
      const R = 0.1 + 0.06 * k, w = (k % 2 ? -1 : 1) * (0.7 + 0.4 * rnd()), ph = rnd() * 6.28, y = an.y + 0.06 + 0.07 * k, sc = 0.36;
      X.ex = [3, REEF.lid, 0, 0]; X.ex2 = [an.x, an.z, w, ph];
      const f = X.M(an.x + R, y, an.z, w > 0 ? 0 : Math.PI, sc);
      X.add(new T.SphereGeometry(0.5, 6, 4).scale(0.18, 0.36, 0.5), f, (lp) => mul(orange, lp.y < -0.06 ? 1.15 : 0.95));
      for (const z of [0.1, -0.1]) X.add(new T.CylinderGeometry(0.5, 0.5, 0.06, 8, 1, true).rotateX(Math.PI / 2).scale(0.2 * 0.94, 0.38 * 0.94, 1).translate(0, 0, z), f, white);
      X.add(new T.ConeGeometry(0.12, 0.2, 4).rotateX(-Math.PI / 2).scale(0.3, 1, 1.4).translate(0, 0, -0.32), f, tailC);
    }
    X.ex = [0, REEF.lid, 0, 0]; X.ex2 = [0, 0, 0, 0]; }
  X.twin(0);
  // ---- the touch pools' panels: the traced plane in each window (kind 1), what is pressed to the glass (kind 0, lit by
  // the pool's own light: its top at 2.0)
  const from = X.p.length;
  const { pos: [px, py, pz], d, w, win, panels, port } = TOUCH, hd = d / 2, hw = w / 2;
  for (const [s, cx, list] of panels) {
    X.m = X.M(px + cx, py, pz + s * hd, s > 0 ? 0 : Math.PI);
    X.ex = [1, d - 0.4, 0, 0]; X.ex2 = [-0.12, 0.78, 1.25, (cx + 3) * (s + 2)];
    // (u, v on the plane: across from the window's centre, up from its foot — set per vertex below)
    const g = new T.PlaneGeometry(win.w, win.h).translate(0, win.y0 + win.h / 2, 0.038);
    const start = X.e.length;
    X.add(g, new T.Matrix4(), [1, 1, 1]);
    { const G = g.toNonIndexed(), Pp = G.attributes.position; for (let k = 0; k < Pp.count; k++) { X.e[start + k * 4 + 2] = Pp.getX(k); X.e[start + k * 4 + 3] = Pp.getY(k) - win.y0; } }
    X.ex = [0, 2.0, 0, 0]; X.ex2 = [0, 0, 0, 0];
    X.m = X.M(px + cx, py, pz + s * hd, s > 0 ? 0 : Math.PI).multiply(X.M(0, 0, 0.042));
    for (const [kind, u, v] of list) pressed(T, X, kind, u, win.y0 + v);
  }
  for (const s of [-1, 1]) {
    X.m = X.M(px + s * hw, py, pz, s * Math.PI / 2);
    X.ex = [1, w - 0.4, 0, 0]; X.ex2 = [-0.14 - (port.y - port.r - win.y0) * 0, port.r * 2 + 0.22, 0.95, 11 + s];
    const g = new T.CircleGeometry(port.r, 20).translate(0, port.y, 0.038), start = X.e.length;
    X.add(g, new T.Matrix4(), [1, 1, 1]);
    const G = g.toNonIndexed(), Pp = G.attributes.position; for (let k = 0; k < Pp.count; k++) { X.e[start + k * 4 + 2] = Pp.getX(k); X.e[start + k * 4 + 3] = Pp.getY(k) - (port.y - port.r); }
  }
  X.m = new T.Matrix4(); X.ex = [0, REEF.lid, 0, 0]; X.ex2 = [0, 0, 0, 0];
  X.twin(from);
  // ---- the material
  const uGlow = { value: 1 };
  const mat = new T.MeshBasicMaterial({ vertexColors: true });
  Object.defineProperty(mat.userData, 'glow', { set: (v) => { uGlow.value = v; }, get: () => uGlow.value });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNightE = U.uNight; sh.uniforms.uGlowE = uGlow; sh.uniforms.uTE = U.uFT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aEx; attribute vec4 aEx2; uniform float uTE; varying vec3 vWE; varying vec3 vNE; varying vec4 vEx; varying vec4 vEx2;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  vec3 nrmE = normal;
  if (aEx.x > 2.5) {   // a clownfish circling its anemone
    float a = aEx2.z * uTE + aEx2.w, cs = cos(a), sn = sin(a); vec2 d = transformed.xz - aEx2.xy;
    transformed.xz = aEx2.xy + vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y); transformed.y += 0.025 * sin(uTE * 1.7 + aEx2.w * 3.0);
    nrmE.xz = vec2(cs * nrmE.x - sn * nrmE.z, sn * nrmE.x + cs * nrmE.z);
  }
  vWE = (modelMatrix * vec4(transformed, 1.0)).xyz; vNE = normalize(mat3(modelMatrix) * nrmE); vEx = aEx; vEx2 = aEx2;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWE; varying vec3 vNE; varying vec4 vEx; varying vec4 vEx2; uniform float uNightE; uniform float uGlowE; uniform float uTE;
float eH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float eN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(eH(i), eH(i + vec2(1.0, 0.0)), f.x), mix(eH(i + vec2(0.0, 1.0)), eH(i + vec2(1.0, 1.0)), f.x), f.y); }
float eCaus(vec2 p, float t) {   // a soft web of caustic light, 0 … 1
  vec2 q = p + 0.3 * vec2(sin(t * 0.7 + p.y * 1.3), cos(t * 0.6 + p.x * 1.1));
  float c = sin(q.x * 3.1 + t * 0.9) * sin(q.y * 2.7 - t * 0.8) + 0.5 * sin((q.x - q.y) * 2.2 + t * 1.3);
  return clamp(0.5 + 0.4 * c, 0.0, 1.0);
}`).replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec3 nE = normalize(vNE);
    vec3 warm = mix(vec3(1.0), vec3(1.0, 0.92, 0.8), uNightE);
    if (vEx.x > 1.5 && vEx.x < 2.5) {   // the lid lamp
      diffuseColor.rgb *= mix(0.8, 1.0, uNightE) * mix(1.0, uGlowE, uNightE);
    } else if (vEx.x > 0.5 && vEx.x < 1.5) {   // a touch pool's water, traced behind its panel
      vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), nE)), rd = normalize(vWE - cameraPosition);
      vec3 dd = vec3(dot(rd, rt), rd.y, dot(rd, nE));
      vec2 p0 = vEx.zw; float D = vEx.y, vF = vEx2.x, vS = vEx2.y, hx = vEx2.z, sd = vEx2.w;
      float t = 99.0; int face = 0;
      if (dd.z < -1e-4) t = -D / dd.z;
      if (dd.y < -1e-4) { float tt = (vF - p0.y) / dd.y; if (tt < t) { t = tt; face = 1; } }
      if (dd.y > 1e-4) { float tt = (vS - p0.y) / dd.y; if (tt < t) { t = tt; face = 2; } }
      if (abs(dd.x) > 1e-4) { float tt = (sign(dd.x) * hx - p0.x) / dd.x; if (tt < t) { t = tt; face = 3; } }
      vec3 h = vec3(p0, 0.0) + dd * t;
      float hy = clamp((h.y - vF) / (vS - vF), 0.0, 1.0);
      vec3 col;
      if (face == 1) {          // the sand, pebbles, and here and there a sea star, an urchin or an anemone
        vec2 q = vec2(h.x, -h.z);
        col = vec3(0.6, 0.52, 0.37) * (0.82 + 0.25 * eN(q * 9.0 + sd));
        col = mix(col, vec3(0.3, 0.28, 0.26), smoothstep(0.74, 0.8, eN(q * 5.0 + 3.1 + sd)));
        vec2 g = floor(q / 0.55), f = fract(q / 0.55) - 0.5; float r0 = eH(g + sd), r1 = eH(g + 3.3 + sd);
        vec2 o = f - (vec2(r0, r1) - 0.5) * 0.4; float l = length(o);
        if (r0 < 0.3) { float an = atan(o.y, o.x) + r1 * 6.28, arm = 0.05 + 0.15 * pow(abs(cos(an * 2.5)), 3.0); col = mix(col, vec3(0.72, 0.3, 0.17), smoothstep(arm + 0.012, arm - 0.012, l)); }
        else if (r0 < 0.45) col = mix(col, vec3(0.13, 0.08, 0.17), smoothstep(0.13, 0.1, l + 0.02 * sin(atan(o.y, o.x) * 18.0)));
        else if (r0 < 0.62) col = mix(col, mix(vec3(0.72, 0.42, 0.48), vec3(0.95, 0.86, 0.8), smoothstep(0.03, 0.12, l)) * (0.82 + 0.18 * sin(atan(o.y, o.x) * 14.0)), smoothstep(0.14, 0.11, l));
        col *= 0.82 + 0.4 * eCaus(q * 3.0 + sd, uTE);
      } else if (face == 2) {   // the surface seen from under the water: bright, rippling
        col = vec3(0.6, 0.78, 0.78) * (0.72 + 0.32 * eN(h.xz * 6.0 + vec2(uTE * 0.6, sd)));
      } else {                  // the pool's rock walls, weed low down
        vec2 q = face == 0 ? h.xy : h.zy;
        col = vec3(0.37, 0.35, 0.32) * (0.62 + 0.55 * (eN(q * 4.0 + sd) * 0.6 + eN(q * 11.0 - sd) * 0.4));
        col = mix(col, vec3(0.28, 0.38, 0.2), 0.4 * smoothstep(0.55, 0.8, eN(q * 6.0 + 9.0)) * (1.0 - hy));
        col *= 0.85 + 0.25 * eCaus(q * 2.5 + sd, uTE) * hy;
      }
      col = mix(col, vec3(0.07, 0.15, 0.16), (1.0 - exp(-t * 0.85)) * 0.8);
      col *= (0.7 + 0.4 * hy) * mix(1.0, 0.85 * uGlowE, uNightE) * warm;
      // the acrylic: a faint sheen at a glancing look and a soft diagonal highlight (its own: the house glass mirrored the
      // bright sky over the water)
      float fr = pow(1.0 - abs(dd.z), 4.0), hl = smoothstep(0.07, 0.0, abs(fract((p0.x + p0.y * 0.8) * 0.9 + 0.3) - 0.5));
      col = mix(col, vec3(0.5, 0.56, 0.6) * mix(1.0, 0.35, uNightE), clamp(0.35 * fr + 0.06 * hl, 0.0, 0.5));
      diffuseColor.rgb = col;
    } else {                    // lit from the lid (the reef, the pressed creatures, the clownfish)
      float up = max(nE.y, 0.0), dep = clamp((vEx.y - vWE.y) / 2.8, 0.0, 1.0);
      float cs = mix(1.0, 0.88 + 0.24 * eCaus(vWE.xz * 1.7, uTE), up);
      float Ld = (0.5 + 0.6 * up * (1.0 - 0.45 * dep) + 0.22 * (1.0 - dep) + 0.06 * max(-nE.y, 0.0)) * cs;
      float Ln = (0.36 + 0.95 * up * (1.0 - 0.4 * dep) + 0.26 * (1.0 - dep)) * cs * uGlowE;
      diffuseColor.rgb *= mix(Ld, Ln, uNightE) * warm;
    }
  }`);
  };
  mat.customProgramCacheKey = () => 'aq-exhibits2';
  const mesh = new T.Mesh(X.geo(), mat);
  mesh.name = 'aq-exhibits'; mesh.castShadow = false; mesh.receiveShadow = false;
  return mesh;
}
