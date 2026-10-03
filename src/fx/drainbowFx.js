// INKWAVE — the Drainbow's looks (src/game/sp-drainbow.js runs the special; this file draws it):
//   BubbleLook   the soap-film bubble: a team-tinted film with a thin-film rainbow swirling through it (bands draining
//                down, a slow swirl that quickens while it's fed), see-through in the middle and bright at the rim;
//                ripples — a dimple at the crossing point and a ring spreading over the film — wherever someone passes
//                through it (or a shot fizzles on it); a ring on the floor where it stands; it blows up with a wobble and
//                tears open when it pops. Out of the GTAO normal / depth pass like the other transparent looks.
//   DrainView    the drained player's own screen (the clear-ink wave's look, reused): on going in, a shimmering pearly
//                front sweeps out from where they crossed — world-space distance through the depth buffer, so the
//                characters and the sky are covered in turn — and behind it everything is grey; on coming out the
//                front sweeps the colour back in. One full-screen pass after the screen FX (linear HDR, before tone
//                mapping; idle = disabled). Depth: GTAO's own depth texture when AO is on (high / ultra), else the scene
//                once more depth-only at half size — only while a front is sweeping. It drives the muffle on the
//                master bus (audio.setDamp) and greys the HUD with the same amount (level), and turns both teams' ink
//                to one shade under the same front (src/world/inkOne.js: the level's paint, the tower's and hedges' ink,
//                shots, ink drops, the minimap's turf) — so in there turf can't be told apart.
//   drain streams, inflow, fizzles, the pop's spray: glows from the FX pools (src/fx/fx.js).
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { G, clamp } from '../core/ctx.js';
import { SPECIALS } from '../config.js';
import { inkOneSet, inkOneSetTint } from '../world/inkOne.js';

const TAU = Math.PI * 2;
const RIPS = 8;
const noAO = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; };
const _v = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1);
const rand = Math.random;

// ------------------------------------------------------------------------------------------------ the film
const NOISE = /* glsl */`
float dbH(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dbN(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dbH(i), dbH(i + vec3(1, 0, 0)), f.x), mix(dbH(i + vec3(0, 1, 0)), dbH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dbH(i + vec3(0, 0, 1)), dbH(i + vec3(1, 0, 1)), f.x), mix(dbH(i + vec3(0, 1, 1)), dbH(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;
const FILM_VS = /* glsl */`
uniform float uTime; uniform float uR; uniform float uPop; uniform float uWob;
uniform vec4 uRip[${RIPS}]; uniform vec2 uRipK[${RIPS}];
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vRing; varying float vD;
void main() {
  vec3 n = normalize(position);
  float disp = 0.0, ring = 0.0;
  for (int i = 0; i < ${RIPS}; i++) {
    float age = uTime - uRip[i].w;
    if (uRipK[i].x <= 0.0 || age < 0.0 || age > 2.0) continue;
    float s = acos(clamp(dot(n, uRip[i].xyz), -1.0, 1.0)) * uR;          // metres over the film from the crossing
    float fr = 0.25 + 3.4 * age;                                         // the ring spreading out
    float env = exp(-age * 1.9) * uRipK[i].x;
    float x = (s - fr) / 0.6;
    disp += env * 0.09 * sin((s - fr) * 5.5) * exp(-x * x);              // the ring: a travelling ripple
    disp -= uRipK[i].y * uRipK[i].x * 0.42 * exp(-s * s / 0.45) * exp(-age * 4.5);   // the dimple (+ in, − out)
    ring += env * exp(-pow((s - fr) / 0.32, 2.0));
  }
  // the whole film breathing a little, swelling as it pops
  disp += uWob * 0.05 * sin(uTime * 2.1 + n.y * 3.1 + n.x * 1.7) + uPop * 0.25;
  vec3 p = n * (1.0 + disp / max(uR, 0.5));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * n); vV = normalize(-mv.xyz); vP = n; vRing = ring; vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FILM_FS = /* glsl */`
uniform vec3 uColor; uniform float uTime; uniform float uSwirl; uniform float uAlpha; uniform float uBoost; uniform float uDrain;
uniform float uPop; uniform vec3 uSun; uniform float uBack; uniform float uCamIn;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vRing; varying float vD;
${NOISE}
void main() {
  vec3 N = normalize(vN) * (uBack > 0.5 ? -1.0 : 1.0), V = normalize(vV);   // (the far side: its inner face toward you)
  float c = abs(dot(N, V)), f = 1.0 - c;
  // film thickness: a slow swirl round the bubble (uSwirl integrates its speed), bands draining down the sides
  float ang = uSwirl * 0.3 + vP.y * 1.4;
  vec3 q = vP * 2.1;
  q.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q.xz;
  float th = dbN(q + vec3(0.0, uSwirl * 0.18, 0.0)) * 0.65 + dbN(q * 2.4 - uSwirl * 0.11) * 0.35;
  th += 0.22 * (1.0 - vP.y);
  th += 0.1 * sin(vP.y * 10.0 - uSwirl * 1.3 + th * 5.0);
  // thin-film interference: the colour turns with thickness and with the angle you see it at
  float ph = th * 1.7 + 0.32 / max(c, 0.2) + vRing * 0.7 + uTime * 0.03;
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (ph + vec3(0.0, 0.33, 0.67)));
  vec3 tint = mix(uColor, irid, 0.5);                                   // team-tinted, slightly rainbow
  float rim = pow(f, 2.3);
  vec3 R = reflect(-V, N);
  float sd = max(dot(R, uSun), 0.0);
  float spec = (pow(sd, 140.0) * 3.2 + pow(sd, 14.0) * 0.22) * (1.0 - uBack * 0.75);
  float win = smoothstep(0.6, 0.85, R.y) * 0.16 * (1.0 - uBack * 0.8);
  float a = 0.04 + 0.46 * rim + 0.05 * smoothstep(0.45, 0.95, th) + vRing * 0.4 + uBoost * (0.05 + 0.2 * rim) + uDrain * 0.03;
  vec3 col = tint * (0.5 + 0.95 * rim + vRing * 1.1 + uBoost * 0.5 + uDrain * 0.15);
  // the pop: the film tears open from holes that spread, their edges flaring white
  float tearN = dbN(vP * 4.5 + 7.0);
  float keep = uPop > 0.001 ? smoothstep(uPop * 1.3 - 0.12, uPop * 1.3 + 0.04, tearN) : 1.0;
  float edge = uPop > 0.001 ? (1.0 - smoothstep(0.0, 0.08, abs(tearN - uPop * 1.3))) : 0.0;
  // (seen from inside: a lighter veil, its rim far softer; the film right at the camera fades out)
  float veil = (1.0 - uBack * 0.35) * mix(1.0, 0.45 + 0.4 * (1.0 - rim), uCamIn) * smoothstep(0.8, 3.0, vD);
  a = clamp(a * keep * veil, 0.0, 0.85) * uAlpha;
  spec *= smoothstep(0.8, 3.0, vD);
  vec3 light = col * a + vec3(spec + win) * uAlpha * keep + vec3(1.6, 1.7, 1.8) * edge * uAlpha * 0.8;
  gl_FragColor = vec4(light, a * 0.75);
}`;
const RING_FS = /* glsl */`
uniform vec3 uColor; uniform float uTime; uniform float uA;
varying vec2 vUv;
void main() {
  float r = vUv.x, ang = vUv.y;
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (ang * 3.0 + uTime * 0.12 + vec3(0.0, 0.33, 0.67)));
  float band = exp(-pow((r - 0.5) / 0.22, 2.0));
  vec3 c = mix(uColor, irid, 0.45) * 1.6;
  gl_FragColor = vec4(c * band * uA, 1.0);
}`;
const RING_VS = /* glsl */`
attribute float aAng; varying vec2 vUv;
void main() { vUv = vec2(uv.x, aAng); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

let _sphere = null, _ringGeo = null;
function sphereGeo() { return _sphere || (_sphere = new THREE.IcosahedronGeometry(1, 5)); }
// a flat band (r 0.94 … 1.0 of the footprint) with its angle round as an attribute (the rainbow runs round it)
function ringGeo() {
  if (_ringGeo) return _ringGeo;
  const n = 128, pos = [], uv = [], ang = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, cx = Math.cos(a), sz = Math.sin(a);
    pos.push(cx * 0.93, 0, sz * 0.93, cx * 1.0, 0, sz * 1.0); uv.push(0, 0, 1, 0); ang.push(i / n, i / n);
    if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aAng', new THREE.Float32BufferAttribute(ang, 1));
  g.setIndex(idx);
  return (_ringGeo = g);
}

export class BubbleLook {
  constructor(scene, color) {
    this.scene = scene;
    const U = this.U = {
      uTime: { value: 0 }, uR: { value: 4 }, uPop: { value: 0 }, uWob: { value: 1 }, uSwirl: { value: 0 },
      uColor: { value: new THREE.Color().copy(color) }, uAlpha: { value: 0 }, uBoost: { value: 0 }, uDrain: { value: 0 },
      uSun: { value: new THREE.Vector3(-0.4, 0.75, 0.5).normalize() }, uBack: { value: 0 }, uCamIn: { value: 0 },
      uRip: { value: Array.from({ length: RIPS }, () => new THREE.Vector4(0, 1, 0, -99)) },
      uRipK: { value: Array.from({ length: RIPS }, () => new THREE.Vector2(0, 0)) },
    };
    const mk = (side, back, order) => {
      const m = new THREE.ShaderMaterial({ uniforms: { ...U, uBack: { value: back } }, vertexShader: FILM_VS, fragmentShader: FILM_FS,
        transparent: true, depthWrite: false, side, fog: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      const mesh = new THREE.Mesh(sphereGeo(), m);
      mesh.renderOrder = order; mesh.frustumCulled = false; mesh.onBeforeRender = noAO; mesh.name = 'FX_Drainbow';
      return mesh;
    };
    // the far side first, then the near side over it (seen from inside: only the far side)
    this.back = mk(THREE.BackSide, 1, 13); this.front = mk(THREE.FrontSide, 0, 14);
    const rm = new THREE.ShaderMaterial({ uniforms: { uColor: U.uColor, uTime: U.uTime, uA: { value: 0 } }, vertexShader: RING_VS, fragmentShader: RING_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.ring = new THREE.Mesh(ringGeo(), rm); this.ring.renderOrder = 12; this.ring.onBeforeRender = noAO; this.ring.frustumCulled = false;
    this.ripN = 0;
    scene.add(this.back, this.front, this.ring);
  }
  // a ripple from the film point in direction dir (unit, from the centre) — sign 1: pushed in (someone / something
  // coming in), −1: bulging out (going out); amp: 1 a body, ~0.35 a shot
  ripple(dir, sign = 1, amp = 1) {
    const i = this.ripN++ % RIPS;
    this.U.uRip.value[i].set(dir.x, dir.y, dir.z, this.U.uTime.value);
    this.U.uRipK.value[i].set(amp, sign);
  }
  // per frame: c the centre, r the (inflated) radius, groundY / foot the floor ring
  update(dt, o) {
    const U = this.U;
    U.uTime.value = o.t; U.uR.value = o.r; U.uAlpha.value = o.alpha; U.uPop.value = o.pop || 0; U.uWob.value = o.wob ?? 1;
    U.uBoost.value = o.boost || 0; U.uDrain.value = o.drain || 0;
    U.uCamIn.value = G.camera && G.camera.position.distanceTo(o.c) < o.r ? 1 : 0;
    U.uSwirl.value += dt * (0.9 + 2.4 * (o.boost || 0) + 0.8 * (o.drain || 0));
    for (const m of [this.back, this.front]) { m.position.copy(o.c); m.scale.setScalar(Math.max(0.01, o.r)); }
    const show = o.foot > 0.3 && o.groundY > -Infinity;
    this.ring.visible = show;
    if (show) { this.ring.position.set(o.c.x, o.groundY + 0.05, o.c.z); this.ring.scale.setScalar(o.foot); this.ring.material.uniforms.uA.value = 0.55 * o.alpha * (1 - (o.pop || 0)); }
  }
  dispose() {
    this.scene.remove(this.back, this.front, this.ring);
    this.back.material.dispose(); this.front.material.dispose(); this.ring.material.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ particles
// glows from the FX pool (additive, they bloom): a drop of drained ink flying from p toward q over `life` s
function flyGlow(fx, p, q, col, size, life, jitter = 0.25) {
  if (!fx || !fx._sprite) return;
  const vx = (q.x - p.x) / life + (rand() - 0.5) * jitter, vy = (q.y - p.y) / life + (rand() - 0.5) * jitter, vz = (q.z - p.z) / life + (rand() - 0.5) * jitter;
  fx._sprite(fx.glows, p.x, p.y, p.z, vx, vy, vz, col, size, size * 0.55, life, 0.9, 0, 0, 1, 0.06, 0.8, 0, 0.3);
}
// drained: a thin stream of the victim's ink pulled out of them toward the bubble's middle
export function drainStream(from, to, color, rate, dt) {
  const fx = G.fx;
  if (!fx || !(rate > 0)) return;
  const n = rate * dt * (fx.q ?? 1);
  for (let k = n + rand(); k >= 1; k--) {
    _v.set(from.x + (rand() - 0.5) * 0.45, from.y + (rand() - 0.4) * 0.7, from.z + (rand() - 0.5) * 0.45);
    const d = _v.distanceTo(to), life = clamp(d / 3.6, 0.25, 1.4);
    _c.copy(color).lerp(WHITE, 0.2).multiplyScalar(3.0);
    flyGlow(fx, _v, to, _c, 0.11 + rand() * 0.08, life, 0.45);
    if (rand() < 0.3) { _c2.copy(color).lerp(WHITE, 0.3); fx.mist?.(_v, null, _c2, 0.16, 0.18); }
  }
}
// gaining: the drained ink (rainbow-shifted, then in their colour) flowing in round them from the bubble's middle
export function inflow(from, to, color, rate, dt, t) {
  const fx = G.fx;
  if (!fx || !(rate > 0)) return;
  const n = rate * dt * (fx.q ?? 1);
  for (let k = n + rand(); k >= 1; k--) {
    // a few straight from the middle, most swirling in from a ring round them
    if (rand() < 0.35) {
      _v.copy(from);
      _c.setHSL((t * 0.15 + rand() * 0.3) % 1, 0.8, 0.65).lerp(color, 0.4).multiplyScalar(1.6);
    } else {
      const a = rand() * TAU, r = 0.7 + rand() * 0.35;
      _v.set(to.x + Math.cos(a) * r, to.y + (rand() - 0.3) * 0.9, to.z + Math.sin(a) * r);
      _c.copy(color).lerp(WHITE, 0.35).multiplyScalar(2.6);
    }
    const d = _v.distanceTo(to), life = clamp(d / 3.2, 0.18, 1.2);
    flyGlow(fx, _v, to, _c, 0.07 + rand() * 0.05, life, 0.3);
  }
}
// an enemy shot losing half its ink at the film: a fizz of pale rainbow sparks off the film point, outward n
export function fizzle(at, n, color) {
  const fx = G.fx;
  if (!fx || !fx._sprite) return;
  const c = Math.max(2, Math.round(7 * (fx.q ?? 1)));
  for (let i = 0; i < c; i++) {
    _c.setHSL(rand(), 0.7, 0.75).lerp(color, 0.3).multiplyScalar(2.2);
    const s = 1.5 + rand() * 2.5;
    fx._sprite(fx.glows, at.x, at.y, at.z, n.x * s + (rand() - 0.5) * 2, n.y * s + (rand() - 0.2) * 2, n.z * s + (rand() - 0.5) * 2, _c, 0.06, 0.02, 0.22 + rand() * 0.15, 1, 3, 0, 10 + 1, 0.02, 2);
  }
  _c2.copy(color).lerp(WHITE, 0.7);
  fx.mist?.(at, null, _c2, 0.18, 0.22);
}
// the pop: the film's last rainbow flung outward as sparks and droplets, a ring on the floor
export function popSpray(c, r, color, groundY) {
  const fx = G.fx;
  if (!fx || !fx._sprite) return;
  const n = Math.round(70 * (fx.q ?? 1));
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1, a = rand() * TAU, s = Math.sqrt(1 - u * u);
    _v.set(Math.cos(a) * s, Math.abs(u) * (u < -0.3 ? -0.3 : 1), Math.sin(a) * s).normalize();
    const p = { x: c.x + _v.x * r, y: c.y + _v.y * r, z: c.z + _v.z * r };
    if (groundY > -Infinity && p.y < groundY + 0.05) continue;
    _c.setHSL(rand(), 0.75, 0.68).lerp(color, 0.35).multiplyScalar(2.4);
    const sp = 1 + rand() * 2.5;
    fx._sprite(fx.glows, p.x, p.y, p.z, _v.x * sp, _v.y * sp - 0.5, _v.z * sp, _c, 0.09 + rand() * 0.06, 0.02, 0.4 + rand() * 0.35, 1, 1.8, -1.5, 10 + 1, 0.02, 1.5);
  }
  if (groundY > -Infinity) fx.ring?.(_v.set(c.x, groundY + 0.06, c.z), null, color, { radius: Math.max(1, r) * 1.05, life: 0.5, snap: false });
}

// ------------------------------------------------------------------------------------------------ the grey wave
const VIEW_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const VIEW_FS = /* glsl */`
uniform sampler2D tDiffuse; uniform sampler2D tDepth;
uniform mat4 uInvProj; uniform mat4 uCamWorld;
uniform vec3 uFrom; uniform float uR; uniform float uBefore; uniform float uAfter; uniform float uDepthOn; uniform float uTime;
uniform float uFrontA; uniform float uSkyD; uniform float uMono;
varying vec2 vUv;
${NOISE}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
void main() {
  float mono = uAfter, dW = 1e4, d = 0.0, sheet = 0.0, sheetT = 1e4;
  vec3 wp = vec3(0.0);
  if (uDepthOn > 0.5) {
    float z = texture2D(tDepth, vUv).x;
    vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
    vp /= vp.w;
    wp = (uCamWorld * vp).xyz;
    d = z >= 0.99999 ? uSkyD : distance(wp, uFrom);
    // the front in the air: the view ray through the expanding sphere of radius uR round uFrom (a pearly sheet
    // standing between you and whatever it hasn't reached yet — the clear-ink wave's curtain, as a sphere)
    vec3 cam = uCamWorld[3].xyz, rd = normalize(wp - cam), oc = cam - uFrom;
    float sd = z >= 0.99999 ? 1e5 : distance(wp, cam);
    float bb = dot(oc, rd), cc = dot(oc, oc) - uR * uR, disc = bb * bb - cc;
    if (disc > 0.0 && uR > 0.3) {
      float sq = sqrt(disc);
      for (int k = 0; k < 2; k++) {
        float t = k == 0 ? -bb - sq : -bb + sq;
        if (t > 0.25 && t < sd) {
          vec3 hp = cam + rd * t, nn = normalize(hp - uFrom);
          float gz = 1.0 - abs(dot(nn, rd));
          float ripple = 0.55 + 0.45 * sin(hp.y * 6.0 + atan(nn.z, nn.x) * 23.0 - uTime * 9.0 + dbN(hp * 1.7) * 6.0);
          sheet += (0.3 + 0.7 * pow(gz, 2.5)) * ripple * smoothstep(0.25, 2.0, t);
          sheetT = min(sheetT, t);
        }
      }
    }
    float wn = dbN(wp * 1.3 + vec3(0.0, uTime * 1.1, 0.0)) * 0.7 + dbN(wp * 4.1 - uTime * 2.0) * 0.3;
    dW = d - uR + (wn - 0.5) * 0.9;                                    // > 0: ahead of the front (a ragged, shimmering edge)
    mono = mix(uBefore, uAfter, smoothstep(0.45, -0.45, dW));
  }
  // near the front the view wobbles as if seen through the film
  float band = exp(-dW * dW * 0.35);
  vec2 uv = vUv;
  if (band * uFrontA > 0.002) uv += (vec2(dbN(vec3(vUv * 40.0, uTime * 3.0)), dbN(vec3(vUv * 40.0 + 7.0, uTime * 3.0))) - 0.5) * 0.007 * band * uFrontA;
  vec3 col = texture2D(tDiffuse, uv).rgb;
  vec3 g = vec3(luma(col)) * vec3(0.95, 1.0, 1.07);
  col = mix(col, g, mono * uMono);
  // the front: a bright pearly line with a shimmering glow round it, a soft sheen trailing behind
  if (uDepthOn > 0.5 && uFrontA > 0.001) {
    float core = exp(-dW * dW * 6.0);
    float sheen = dW < 0.0 ? exp(dW * 0.9) * 0.45 : 0.0;
    float sh = 0.55 + 0.45 * sin(wp.y * 5.0 + d * 1.7 - uTime * 11.0);
    vec3 pearl = mix(vec3(0.5, 0.95, 1.0), 0.55 + 0.45 * cos(6.2831 * (d * 0.05 + wp.y * 0.13 + uTime * 0.3 + vec3(0.0, 0.33, 0.67))), 0.6);
    float lum = 0.45 + luma(col) * 0.55;
    col += pearl * (core * 4.0 + band * 1.2 * sh + sheen) * uFrontA * lum;
    if (sheet > 0.0) {
      vec3 sp = mix(vec3(0.6, 0.95, 1.0), 0.6 + 0.4 * cos(6.2831 * (sheetT * 0.04 + uTime * 0.25 + vUv.y * 0.6 + vec3(0.0, 0.33, 0.67))), 0.55);
      col = mix(col, col * 0.85 + sp * 0.3, clamp(sheet * 0.5, 0.0, 0.6) * uFrontA) + sp * sheet * 0.32 * uFrontA;
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

class ViewPass extends ShaderPass {
  constructor(view) {
    super(new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, tDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
        uFrom: { value: new THREE.Vector3() }, uR: { value: 0 }, uBefore: { value: 0 }, uAfter: { value: 0 }, uDepthOn: { value: 0 },
        uTime: { value: 0 }, uFrontA: { value: 0 }, uSkyD: { value: 70 }, uMono: { value: 0.97 },
      },
      vertexShader: VIEW_VS, fragmentShader: VIEW_FS, depthTest: false, depthWrite: false,
    }));
    this.view = view;
    this.enabled = false;
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    this.view._prepare(renderer, this.uniforms);
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }
}

export class DrainView {
  constructor() {
    this.inside = false;
    this.level = 0;             // the grey's overall amount right now (0 … 1): the muffle and the HUD follow it
    this.wave = null;           // { from, t, dur, reach, before, after }
    this.pass = null;
    this.stats = { waves: 0, depthRenders: 0, depthSrc: '' };
    this._hud = -1;
  }
  get active() { return this.level > 0.001 || !!this.wave || this.inside; }
  // in or out; from: where they crossed (the wave starts there)
  set(inside, from) {
    if (inside === this.inside) return;
    const d = SPECIALS.drainbow;
    this.inside = inside;
    this._ensurePass();
    const now = this.wave ? this._visual() : this.level;
    this.wave = { from: from.clone(), t: 0, dur: d.waveTime, reach: d.waveReach, before: now, after: inside ? 1 : 0 };
    this.stats.waves++;
    G.audio?.play(inside ? 'drainbow_in' : 'drainbow_out', { volume: 0.9 });
  }
  // the grey a wave in progress shows overall (its front's share of the way out)
  _visual() { const w = this.wave; if (!w) return this.level; const x = clamp(w.t / w.dur, 0, 1); return w.before + (w.after - w.before) * x * x * (3 - 2 * x); }
  _front(w) { const x = clamp(w.t / w.dur, 0, 1); return w.reach * Math.pow(x, 1.5); }
  update(dt) {
    const w = this.wave, d = SPECIALS.drainbow;
    if (w) { w.t += dt; if (w.t >= w.dur) this.wave = null; }
    this.level = this.wave ? this._visual() : this.inside ? 1 : 0;
    if (this.pass) this.pass.enabled = this.level > 0.001 || !!this.wave;
    // every ink look on this screen: both teams' ink to one shade with the grey (src/world/inkOne.js)
    if (this.level > 0.001 || this.wave) inkOneSetTint(G.teamColors?.[0], G.teamColors?.[1]);
    inkOneSet(this.level, this.wave, this.wave ? this._front(this.wave) : 0, G.time);
    G.audio?.setDamp?.(this.level, d.dampCut, d.dampGain);
    const hk = Math.round(this.level * 85) / 100;
    if (hk !== this._hud && G.hud?.el) { this._hud = hk; G.hud.el.style.filter = hk > 0 ? `grayscale(${hk})` : ''; }
  }
  reset() {
    this.inside = false; this.level = 0; this.wave = null;
    if (this.pass) this.pass.enabled = false;
    inkOneSet(0, null, 0, G.time || 0);
    G.audio?.setDamp?.(0);
    if (G.hud?.el && this._hud !== 0) G.hud.el.style.filter = '';
    this._hud = 0;
  }
  _ensurePass() {
    if (this.pass || !G.post?.addPostPass) return;
    this.pass = new ViewPass(this);
    G.post.addPostPass(this.pass);
  }
  // (in the composer, just before the pass draws: this frame's camera; the depth while a front sweeps)
  _prepare(renderer, U) {
    const w = this.wave, R = G.post, cam = R?.camera || G.camera;
    U.uTime.value = G.time;
    U.uMono.value = SPECIALS.drainbow.mono;
    if (!w || w.before === w.after || !cam) { U.uDepthOn.value = 0; U.uAfter.value = this.level; U.uFrontA.value = 0; return; }
    const x = clamp(w.t / w.dur, 0, 1);
    U.uFrom.value.copy(w.from); U.uR.value = this._front(w); U.uBefore.value = w.before; U.uAfter.value = w.after;
    U.uSkyD.value = w.reach * 0.97;
    U.uFrontA.value = (1 - x * 0.6) * Math.min(1, w.t / 0.06);
    cam.updateMatrixWorld();
    U.uInvProj.value.copy(cam.projectionMatrixInverse); U.uCamWorld.value.copy(cam.matrixWorld);
    const tex = this._depth(renderer, R, cam);
    U.tDepth.value = tex; U.uDepthOn.value = tex ? 1 : 0;
  }
  _depth(renderer, R, cam) {
    const gt = R?.gtao;
    if (gt && gt.enabled !== false && gt.depthTexture) { this.stats.depthSrc = 'gtao'; return gt.depthTexture; }
    const scene = R?.scene;
    if (!scene) return null;
    const sz = renderer.getDrawingBufferSize(_size), W = Math.max(2, sz.x >> 1), H = Math.max(2, sz.y >> 1);
    if (!this._rt || this._rt.width !== W || this._rt.height !== H) {
      this._rt?.dispose();
      const dt = new THREE.DepthTexture(W, H); dt.type = THREE.UnsignedIntType;
      this._rt = new THREE.WebGLRenderTarget(W, H, { depthTexture: dt, depthBuffer: true, stencilBuffer: false, type: THREE.UnsignedByteType, generateMipmaps: false });
      this._dm = this._dm || new THREE.MeshBasicMaterial({ colorWrite: false });
    }
    const prevT = renderer.getRenderTarget(), ac = renderer.autoClear, om = scene.overrideMaterial, bg = scene.background, sm = renderer.shadowMap.needsUpdate;
    try {
      scene.overrideMaterial = this._dm; scene.background = null; renderer.shadowMap.needsUpdate = false;
      renderer.autoClear = true;
      renderer.setRenderTarget(this._rt);
      renderer.clear();
      renderer.render(scene, cam);
    } finally {
      scene.overrideMaterial = om; scene.background = bg; renderer.shadowMap.needsUpdate = sm;
      renderer.autoClear = ac;
      renderer.setRenderTarget(prevT);
    }
    this.stats.depthRenders++; this.stats.depthSrc = 'own';
    return this._rt.depthTexture;
  }
}
const _size = new THREE.Vector2();
