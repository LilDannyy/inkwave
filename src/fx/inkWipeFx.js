// Practice: the clear-all-ink wave's look and sound (the clearing itself is the paint system's: paint.startWipe).
//
// main.js starts it on every screen from the same record (the host's: netmatch 'w'); the paint system sweeps the turf
// and the atlas, and this module dresses it, on the paint system's own clock so the light and the clearing line up:
//   · the level shader's wave (levelMaterial.js WAVE_FRAGMENT): ink ahead of the front heats up, the front is a
//     shimmering band of pearly light over floors and walls, and behind it the old ink — a snapshot of the atlas taken
//     as the wave starts (uGhost, half size) — boils away: paling, fizzing holes eating in from bright rims, gone 0.6 s
//     after the front passed;
//   · a faint shimmering curtain standing up out of the front;
//   · steam: team-tinted wisps rising off the ink the front clears (the paint system samples those cells per frame);
//   · sound: the whoosh-and-fizz one-shot for everyone (audio.js 'ink_wipe'), and a fizz loop that rides the front
//     where it passes you ('ink_wipe_fizz', louder the more ink it is clearing near you).
import * as THREE from 'three';
import { G } from '../core/ctx.js';

export const WIPE_GHOST = 0.6;   // s: the old ink takes this long to boil away once the front has passed

const CURTAIN_VS = /* glsl */`
varying vec3 vW;
varying float vH;
void main() {
  vH = position.y;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CURTAIN_FS = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uA;
uniform vec2 uC;
varying vec3 vW;
varying float vH;
void main() {
  float ang = atan(vW.z - uC.y, vW.x - uC.x);
  float s1 = sin(ang * 46.0 + vH * 9.0 - uTime * 7.0), s2 = sin(ang * 113.0 - vH * 15.0 + uTime * 11.0);
  float streak = 0.55 + 0.3 * s1 + 0.15 * s2;
  float fade = pow(1.0 - vH, 2.2) * smoothstep(0.0, 0.04, vH);
  vec3 col = mix(vec3(0.8, 1.0, 1.0), 0.65 + 0.35 * cos(6.2831 * (ang * 0.6 + vH * 0.8 + vec3(0.0, 0.33, 0.67))), 0.3);
  gl_FragColor = vec4(col * streak * fade * uA, 1.0);
}`;
const COPY_FS = /* glsl */`
precision highp float;
uniform sampler2D uSrc;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uSrc, vUv); }`;

export class InkWipeFx {
  constructor(scene) {
    this.scene = scene;
    this.w = null;
    this.ghost = null;
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this.stats = { waves: 0, puffs: 0, t: 0 };
  }

  /** w = { k, cx, cz, dur, reach } — call right after paint.startWipe (before its first sweep: the snapshot). */
  start(w, game) {
    const P = G.paint;
    if (!P) return;
    this.stop(game);
    this.w = { ...w, t: 0, end: w.dur + WIPE_GHOST + 0.15 };
    this._snapshot(P);
    this._curtainOn(w);
    G.audio?.play?.('ink_wipe', { volume: 1 });
    this.stats.waves++; this.stats.puffs = 0;
    this._apply(game);
  }

  // the atlas as it is now → a half-size copy the level shader reads the boiling ink from
  _snapshot(P) {
    const S = Math.max(256, P.size >> 1), r = G.renderer;
    if (!this.ghost || this.ghost.width !== S) {
      this.ghost?.dispose();
      this.ghost = new THREE.WebGLRenderTarget(S, S, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: false, stencilBuffer: false });
    }
    if (!this._copy) {
      const mat = new THREE.ShaderMaterial({ uniforms: { uSrc: { value: null } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: COPY_FS, depthTest: false, depthWrite: false, toneMapped: false });
      this._copy = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      this._copy.frustumCulled = false;
      this._copyScene = new THREE.Scene(); this._copyScene.add(this._copy);
      this._copyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    this._copy.material.uniforms.uSrc.value = P.texture;
    const prev = r.getRenderTarget(), ac = r.autoClear;
    r.autoClear = true;
    r.setRenderTarget(this.ghost);
    r.render(this._copyScene, this._copyCam);
    r.setRenderTarget(prev);
    r.autoClear = ac;
  }

  _curtainOn(w) {
    if (!this.curtain) {
      const geo = new THREE.CylinderGeometry(1, 1, 1, 160, 1, true);
      geo.translate(0, 0.5, 0);
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uC: { value: new THREE.Vector2() } }, vertexShader: CURTAIN_VS, fragmentShader: CURTAIN_FS,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false });
      this.curtain = new THREE.Mesh(geo, mat);
      this.curtain.frustumCulled = false;
      this.curtain.renderOrder = 15;
      this.curtain.name = 'FX_InkWipeCurtain';
    }
    const B = G.level?.bounds || {}, y0 = Math.min(-0.4, (B.minY ?? 0) - 0.4);
    this.curtain.position.set(w.cx, y0, w.cz);
    this.curtain.scale.set(0.01, 5.5, 0.01);
    this.curtain.material.uniforms.uC.value.set(w.cx, w.cz);
    this.curtain.visible = true;
    if (!this.curtain.parent) this.scene.add(this.curtain);
  }

  update(dt, game) {
    const w = this.w;
    if (!w) return;
    // the wave's clock: the paint system's own while its front runs (the light must sit exactly on the clearing), ours after
    const PW = G.paint?._wipe;
    w.t = PW && PW.k === w.k ? PW.t : w.t + dt;
    this.stats.t = w.t;
    const x = Math.min(1, w.t / w.dur), front = w.reach * (1 - Math.pow(1 - x, 1.7));
    const fade = w.t < w.dur ? 1 : Math.max(0, 1 - (w.t - w.dur) / (WIPE_GHOST + 0.15));
    // curtain: stands up out of the front, thins out as it goes
    const c = this.curtain;
    if (c) {
      c.scale.set(Math.max(0.01, front), 5.5, Math.max(0.01, front));
      const U = c.material.uniforms;
      U.uTime.value = G.time; U.uA.value = 0.22 * (0.35 + 0.65 * (1 - x)) * (w.t < w.dur ? Math.min(1, w.t / 0.12) : 0);
      c.visible = U.uA.value > 0.002;
    }
    this._steam(game);
    this._fizz(front, w.t < w.dur, dt);
    this._apply(game, fade);
    if (w.t >= w.end) this.stop(game);
  }

  // steam off a sample of the cells the front cleared this frame (the nearer to the camera, the likelier)
  _steam(game) {
    const S = G.paint?.wipeFx, fx = G.fx;
    if (!S || !S.n || !fx?.inkSteam) return;
    const cam = G.camera.position, q = game?.settings?.quality === 'low' ? 0.5 : 1;
    const cap = Math.round(28 * q);
    let made = 0;
    for (let i = 0; i < S.n && made < cap; i++) {
      const x = S.pos[i * 3], y = S.pos[i * 3 + 1], z = S.pos[i * 3 + 2];
      const d2 = (x - cam.x) ** 2 + (y - cam.y) ** 2 + (z - cam.z) ** 2;
      if (d2 > 55 * 55 || Math.random() > 1.25 - Math.sqrt(d2) / 55) continue;
      fx.inkSteam(this._v.set(x, y, z), G.teamColors[S.team[i]] || G.teamColors[0], 1);
      made++;
    }
    this.stats.puffs += made;
  }

  // the fizz loop rides the front where it is closest to you
  _fizz(front, running, dt) {
    const A = G.audio;
    if (!A?.loop) return;
    const w = this.w, cam = G.camera.position;
    const dx = cam.x - w.cx, dz = cam.z - w.cz, d = Math.hypot(dx, dz) || 1;
    const near = Math.abs(d - front);
    const ink = Math.min(1, (G.paint?.wipeFx?.cleared || 0) / 500);
    const want = running ? Math.max(0, 1 - near / 22) * (0.35 + 0.65 * ink) : 0;
    this._fv = (this._fv || 0) + (want - (this._fv || 0)) * Math.min(1, dt * 8);
    if (this._fv > 0.02 && !this._fz) this._fz = A.loop('ink_wipe_fizz', { volume: 0 });
    if (!this._fz) return;
    this._v.set(w.cx + (dx / d) * front, cam.y - 1.2, w.cz + (dz / d) * front);
    this._fz.set({ pos: this._v, volume: this._fv * 0.9, pitch: 0.9 + 0.3 * ink });
    if (!running && this._fv < 0.02) { this._fz.stop(0.2); this._fz = null; }
  }

  _apply(game, fade = 1) {
    const w = this.w;
    for (const m of [game?.levelMat, game?.grateMat]) {
      const U = m?.userData?.uniforms;
      if (!U || !U.uWave) continue;
      if (!w) { U.uWaveT.value.y = 0; continue; }
      U.uWave.value.set(w.cx, w.cz, w.reach, w.dur);
      U.uWaveT.value.set(w.t, 1, WIPE_GHOST, fade);
      U.uGhost.value = this.ghost ? this.ghost.texture : U.uGhost.value;
    }
  }

  stop(game) {
    if (this._fz) { this._fz.stop(0.15); this._fz = null; }
    this._fv = 0;
    if (this.curtain) this.curtain.visible = false;
    this.w = null;
    this._apply(game);
  }
  /** a stage rebuild (new level material) or a new match: drop everything */
  clear(game) { this.stop(game); }
  get active() { return !!this.w; }
}
