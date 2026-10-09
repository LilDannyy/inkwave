// [b5-subs] Chain Bobber drawing (tools/botlab/jobs/batch5/subs/SPEC.md C4.1: "as many as you like" has to be cheap).
// Every bobber in the world is drawn instanced: per team one InstancedMesh per part — the plastic body (cream half, band,
// pinstripe, decals, stem, eye-ring, keel), the team-ink half, the lamps (two rows of four; their on / off / white-hot state a
// per-instance vec4, shaded in their own small shader), and the white hit-flash shell (a per-instance amount) — all four
// sharing one instance-matrix buffer, so one matrix write a bobber a frame moves every part. Tethers are one instanced
// tube per team (6 sides × 8 segments along a unit length); the vertex shader lays each along the sagging quadratic
// between its two eye-rings and adds each end's bob (the same 0.05 m × sin(2π · 0.7 Hz · t + phase) the matrices use),
// so no geometry is ever rebuilt; the per-tether attributes (ends, phases, sag, brightness, the teammate glow, the spark
// running down it) are rewritten only when something about them changed. 5 draw calls a team, whatever the count
// (plus the shadow pass for the two solid parts). Buffers grow by doubling past 192.
import * as THREE from 'three';
import { G } from '../../core/ctx.js';
import { getPlasticMaterial, getInkMaterial } from '../character-mats.js';
import { worldGeometry } from './bobber-model.js';

const BOB_A = 0.05, BOB_HZ = 0.7, TAU = Math.PI * 2;
export const BOB_PERIOD = 10 / BOB_HZ;   // (the bob's clock wraps every 10 of its periods: float precision in the shader)
export const bobAt = (t, ph) => BOB_A * Math.sin(TAU * BOB_HZ * (t % BOB_PERIOD) + ph);

// ---- the lamps: lit in the team colour by brightness, white-hot past 1 (aOn per lamp: 0 off · 0..1 lit · 1..2 hot)
const LAMP_VS = `
  attribute float aLamp; attribute vec4 aOn;
  uniform vec3 uColor; varying vec3 vC;
  void main() {
    float on = aLamp < 0.5 ? aOn.x : aLamp < 1.5 ? aOn.y : aLamp < 2.5 ? aOn.z : aOn.w;
    // (lit: a strong emissive in the team colour with a white core, so a lamp reads at 6–8 m in daylight; off: near black)
    vec3 lit = uColor * (1.0 + 2.6 * min(on, 1.0)) + 0.32 * min(on, 1.0);
    vC = on <= 0.001 ? vec3(0.06, 0.04, 0.05) : mix(lit, vec3(2.6, 2.5, 2.3), clamp(on - 1.0, 0.0, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }`;
const LAMP_FS = `
  varying vec3 vC;
  void main() {
    gl_FragColor = vec4(vC, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// ---- the hit flash: a white shell, its alpha per instance (0: drawn as nothing)
const FLASH_VS = `
  attribute float aFlash; varying float vF; varying vec3 vN; varying vec3 vV;
  void main() {
    vF = aFlash;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position * (aFlash > 0.001 ? 1.0 : 0.0), 1.0);
    vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const FLASH_FS = `
  uniform vec3 uColor; varying float vF; varying vec3 vN; varying vec3 vV;
  void main() {
    if (vF <= 0.001) discard;
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
    gl_FragColor = vec4(mix(vec3(1.0), uColor, 0.15 + 0.35 * rim), vF * (0.55 + 0.45 * rim));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// ---- the tethers
const TETHER_VS = `
  attribute vec3 aA; attribute vec3 aB; attribute vec4 aP; attribute vec4 aS;
  uniform float uBob; uniform float uR;
  varying float vT; varying float vLen; varying vec4 vS; varying float vBright; varying vec3 vNr; varying vec3 vV;
  const float TAU = 6.2831853;
  void main() {
    float t = position.z;
    vec3 A = aA + vec3(0.0, 0.05 * sin(TAU * 0.7 * uBob + aP.x), 0.0);
    vec3 B = aB + vec3(0.0, 0.05 * sin(TAU * 0.7 * uBob + aP.y), 0.0);
    float sag = aP.z;
    vec3 P = mix(A, B, t); P.y -= sag * 4.0 * t * (1.0 - t);
    vec3 T = B - A; T.y -= sag * 4.0 * (1.0 - 2.0 * t);
    float L = length(B - A);
    T = normalize(T + vec3(0.0, 0.0, 1e-5));
    vec3 up = abs(T.y) > 0.97 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 N = normalize(cross(T, up)), Bn = cross(N, T);
    vec3 off = N * position.x + Bn * position.y;
    P += off * uR;
    vT = t; vLen = L; vS = aS; vBright = aP.w;
    vec4 mv = modelViewMatrix * vec4(P, 1.0);
    vNr = normalize(normalMatrix * off); vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const TETHER_FS = `
  uniform vec3 uColor; uniform float uNow; uniform float uHop;
  varying float vT; varying float vLen; varying vec4 vS; varying float vBright; varying vec3 vNr; varying vec3 vV;
  const float TAU = 6.2831853;
  void main() {
    float sh = 0.5 + 0.5 * sin(vT * vLen * 9.0 - uNow * 7.0);                 // the scrolling shimmer
    float k = vBright * (1.0 + vS.z * (0.6 + 0.3 * sin(TAU * 3.0 * uNow)));     // vS.z: the teammate glow (×1.6, 3 Hz)
    vec3 c = uColor * (0.55 + 0.45 * sh) * k;
    float rim = pow(1.0 - abs(dot(normalize(vNr), normalize(vV))), 2.0);
    c += uColor * rim * 0.35 * k;
    float s = (uNow - vS.x) / uHop;                                             // the spark: from the end that blew first
    if (vS.y != 0.0 && s >= 0.0 && s <= 1.0) {
      float at = vS.y > 0.0 ? s : 1.0 - s, d = abs(vT - at) * vLen;
      c += vec3(2.2, 1.9, 1.4) * exp(-d * d * 26.0);
    }
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
function tubeGeo(sides = 6, segs = 8) {
  const P = [], I = [];
  for (let j = 0; j <= segs; j++) for (let i = 0; i < sides; i++) { const a = (i / sides) * TAU; P.push(Math.cos(a), Math.sin(a), j / segs); }
  for (let j = 0; j < segs; j++) for (let i = 0; i < sides; i++) {
    const a = j * sides + i, b = j * sides + ((i + 1) % sides), c = a + sides, d = b + sides;
    I.push(a, c, b, b, c, d);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  return g;
}

const _m = new THREE.Matrix4();
export const DRAW_STATS = { bobbers: 0, tethers: 0, grows: 0, tetherWrites: 0 };

class TeamSet {
  constructor(team, cap, tcap) {
    this.team = team; this.cap = cap; this.tcap = tcap; this.n = 0; this.tn = 0;
    const W = worldGeometry();
    this.im = new THREE.InstancedBufferAttribute(new Float32Array(cap * 16), 16); this.im.setUsage(THREE.DynamicDrawUsage);
    this.on = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); this.on.setUsage(THREE.DynamicDrawUsage);
    this.fl = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1); this.fl.setUsage(THREE.DynamicDrawUsage);
    const col = G.teamColors?.[team] || new THREE.Color(1, 1, 1);
    this.hex = col.getHexString();
    this.lampMat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: col.clone() } }, vertexShader: LAMP_VS, fragmentShader: LAMP_FS });
    this.flashMat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: col.clone() } }, vertexShader: FLASH_VS, fragmentShader: FLASH_FS, transparent: true, depthWrite: false });
    const lampGeo = W.lamps.clone(); lampGeo.setAttribute('aOn', this.on);
    const flashGeo = W.flash.clone(); flashGeo.setAttribute('aFlash', this.fl);
    this.body = new THREE.InstancedMesh(W.body, getPlasticMaterial(), cap);
    this.ink = new THREE.InstancedMesh(W.ink, getInkMaterial(col), cap);
    this.lamps = new THREE.InstancedMesh(lampGeo, this.lampMat, cap);
    this.flash = new THREE.InstancedMesh(flashGeo, this.flashMat, cap);
    this.flash.renderOrder = 3;
    for (const m of [this.body, this.ink, this.lamps, this.flash]) { m.instanceMatrix = this.im; m.count = 0; m.frustumCulled = false; m.name = 'bobbers:' + team; }
    this.body.castShadow = this.ink.castShadow = true;
    // the flash shell stays out of the GTAO normal / depth pass (as the subs' transparent overlays do)
    this.flash.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; };
    // tethers
    this.tg = tubeGeo();
    this.aA = new THREE.InstancedBufferAttribute(new Float32Array(tcap * 3), 3); this.aB = new THREE.InstancedBufferAttribute(new Float32Array(tcap * 3), 3);
    this.aP = new THREE.InstancedBufferAttribute(new Float32Array(tcap * 4), 4); this.aS = new THREE.InstancedBufferAttribute(new Float32Array(tcap * 4), 4);
    for (const a of [this.aA, this.aB, this.aP, this.aS]) a.setUsage(THREE.DynamicDrawUsage);
    this.tg.setAttribute('aA', this.aA); this.tg.setAttribute('aB', this.aB); this.tg.setAttribute('aP', this.aP); this.tg.setAttribute('aS', this.aS);
    this.tg.instanceCount = 0;
    this.tetherMat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: col.clone() }, uBob: { value: 0 }, uNow: { value: 0 }, uHop: { value: 0.07 }, uR: { value: 0.025 } }, vertexShader: TETHER_VS, fragmentShader: TETHER_FS });
    this.tethers = new THREE.Mesh(this.tg, this.tetherMat);
    this.tethers.frustumCulled = false; this.tethers.name = 'bobber-tethers:' + team;
    this.group = new THREE.Group(); this.group.name = 'bobbers-team' + team;
    this.group.add(this.body, this.ink, this.lamps, this.flash, this.tethers);
  }
  colors() {
    const col = G.teamColors?.[this.team];
    if (!col || col.getHexString() === this.hex) return;
    this.hex = col.getHexString();
    this.ink.material = getInkMaterial(col);
    for (const m of [this.lampMat, this.flashMat, this.tetherMat]) m.uniforms.uColor.value.copy(col);
  }
  dispose() {
    this.group.parent?.remove(this.group);
    for (const m of [this.lampMat, this.flashMat, this.tetherMat]) m.dispose();
    this.lamps.geometry.dispose(); this.flash.geometry.dispose(); this.tg.dispose();
    this.body.dispose?.(); this.ink.dispose?.(); this.lamps.dispose?.(); this.flash.dispose?.();
  }
}

export class BobberDraw {
  constructor() { this.sets = [null, null]; this.cap = 192; this.tcap = 288; this.scene = null; this.epoch = 0; this.hop = 0.07; }
  _set(team) {
    let s = this.sets[team];
    if (!s) { s = this.sets[team] = new TeamSet(team, this.cap, this.tcap); if (this.scene) this.scene.add(s.group); }
    return s;
  }
  // the clock the tether sparks run on (seconds since the draw was last cleared: float precision)
  now() { return G.time - this.epoch; }
  begin(scene) {
    if (scene) this.scene = scene;
    for (const s of this.sets) if (s) { s.n = 0; s.colors(); if (this.scene && s.group.parent !== this.scene) this.scene.add(s.group); }
  }
  // one bobber this frame: m a Matrix4 (world), lamps [4] (0 off · 0..1 lit · 1..2 white-hot), flash 0..1
  bobber(team, m, l0, l1, l2, l3, flash) {
    let s = this._set(team);
    if (s.n >= s.cap) { this._grow(); s = this.sets[team]; }
    const k = s.n++;
    m.toArray(s.im.array, k * 16);
    const o = s.on.array; o[k * 4] = l0; o[k * 4 + 1] = l1; o[k * 4 + 2] = l2; o[k * 4 + 3] = l3;
    s.fl.array[k] = flash;
  }
  // the tethers (only when they changed: dirty) — list: [{ team, ax, ay, az, bx, by, bz, pa, pb, sag, bright, glow, s0, sd }]
  tethers(list) {
    for (const s of this.sets) if (s) s.tn = 0;
    for (const t of list) {
      let s = this._set(t.team);
      if (s.tn >= s.tcap) { this._grow(true); s = this.sets[t.team]; }
      const k = s.tn++;
      s.aA.array.set([t.ax, t.ay, t.az], k * 3); s.aB.array.set([t.bx, t.by, t.bz], k * 3);
      s.aP.array.set([t.pa, t.pb, t.sag, t.bright], k * 4); s.aS.array.set([t.s0 - this.epoch, t.sd, t.glow, 0], k * 4);
    }
    for (const s of this.sets) if (s) { s.tg.instanceCount = s.tn; for (const a of [s.aA, s.aB, s.aP, s.aS]) { a.addUpdateRange?.(0, Math.max(1, s.tn) * a.itemSize); a.needsUpdate = true; } }
    DRAW_STATS.tetherWrites++;
  }
  end() {
    const bob = G.time % BOB_PERIOD, now = this.now();
    let n = 0, tn = 0;
    for (const s of this.sets) {
      if (!s) continue;
      for (const m of [s.body, s.ink, s.lamps, s.flash]) m.count = s.n;
      if (s.n) { s.im.addUpdateRange?.(0, s.n * 16); s.im.needsUpdate = true; s.on.addUpdateRange?.(0, s.n * 4); s.on.needsUpdate = true; s.fl.addUpdateRange?.(0, s.n); s.fl.needsUpdate = true; }
      s.tetherMat.uniforms.uBob.value = bob; s.tetherMat.uniforms.uNow.value = now; s.tetherMat.uniforms.uHop.value = this.hop;
      s.group.visible = s.n > 0 || s.tn > 0;
      n += s.n; tn += s.tn;
    }
    DRAW_STATS.bobbers = n; DRAW_STATS.tethers = tn;
  }
  _grow(tethers = false) {
    if (tethers) this.tcap *= 2; else this.cap *= 2;
    DRAW_STATS.grows++;
    // (rebuilt bigger; this frame's instances so far are lost — redrawn from the next frame, the tethers at once by the kit)
    for (let t = 0; t < 2; t++) { const s = this.sets[t]; if (!s) continue; s.dispose(); this.sets[t] = null; this._set(t); }
    this.dirty = true;
  }
  clear() {
    for (const s of this.sets) if (s) { s.n = 0; s.tn = 0; s.tg.instanceCount = 0; for (const m of [s.body, s.ink, s.lamps, s.flash]) m.count = 0; s.group.visible = false; }
    this.epoch = G.time || 0;
  }
  // (tests) how many draw calls the bobbers cost now
  calls() { let c = 0; for (const s of this.sets) if (s) { if (s.n) c += 4; if (s.tn) c += 1; } return c; }
}
export { _m as DRAW_TMP };
