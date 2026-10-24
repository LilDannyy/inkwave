// [b5-sub-glide] The Glide Bomb's aim guide, its HUD cook bar and the glow round a cooking fist (kits/glide.js drives
// them; SPEC §A3 / §A4).
//   Guide     a dashed team-coloured line laid on the floor (+0.05 m) through the slide's first bounces, and the blast
//             ring where it would stop (fx.mark, immediate mode). Grey when you lack the ink.
//   CookBar   under the crosshair's sub chip (the Shaker's pip spot, on G.hud.xh): a bar that fills over the 1.8 s of
//             cook with a tick per lamp; it flashes once at full cook and flashes red over the last 0.5 s before the slip
//   handGlow  a team-coloured sprite round the fist holding a primed stone (0.15 m at level 1 … 0.3 m at full cook)
import * as THREE from 'three';
import { G } from '../../core/ctx.js';

const MAXP = 160;
const R_TARGET = 4;          // fx.js mark() style: the target ring (fx.js R_TARGET)
const VS = `attribute float aD; attribute float aS; varying float vD; varying float vS;
  void main(){ vD = aD; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS = `uniform vec3 uColor; uniform float uAlpha; uniform float uTime; varying float vD; varying float vS;
  void main(){
    float dash = step(fract(vD * 2.2 - uTime * 1.4), 0.58);
    float edge = smoothstep(1.0, 0.55, abs(vS));
    float a = dash * edge * uAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.18 * (1.0 - abs(vS))), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export class Guide {
  constructor() {
    const g = new THREE.BufferGeometry();
    this.P = new Float32Array(MAXP * 2 * 3); this.D = new Float32Array(MAXP * 2); this.S = new Float32Array(MAXP * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.P, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aD', new THREE.BufferAttribute(this.D, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aS', new THREE.BufferAttribute(this.S, 1).setUsage(THREE.DynamicDrawUsage));
    const idx = []; for (let i = 0; i < MAXP - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx); g.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0.85 }, uTime: { value: 0 } },
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 3; this.mesh.visible = false;
    // (a see-through overlay: out of the GTAO normal / depth pass, which would draw it solid — subs.js noAO)
    this.mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : this._n; };
    this._n = 0;
    this.pts = [];            // the last computed path: [{ x, y, z }] (the line), end { x, y, z }
    this.end = new THREE.Vector3(); this.ok = false; this.t = -9;
  }
  // the line through pts (the floor points of the slide, cut after its third bounce), width w
  setLine(pts, w = 0.13) {
    const P = this.P, D = this.D, S = this.S, n = Math.min(MAXP, pts.length);
    let dist = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      let tx = q.x - o.x, tz = q.z - o.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = -tz * w * 0.5, nz = tx * w * 0.5;
      if (i > 0) dist += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      const j = i * 6;
      P[j] = p.x + nx; P[j + 1] = p.y + 0.05; P[j + 2] = p.z + nz;
      P[j + 3] = p.x - nx; P[j + 4] = p.y + 0.05; P[j + 5] = p.z - nz;
      D[i * 2] = D[i * 2 + 1] = dist; S[i * 2] = 1; S[i * 2 + 1] = -1;
    }
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.aD.needsUpdate = true; g.attributes.aS.needsUpdate = true;
    this._n = n > 1 ? (n - 1) * 6 : 0;
    g.setDrawRange(0, this._n);
  }
  show(on, color, alpha = 0.85) {
    if (on && this.mesh.parent !== G.scene) G.scene?.add(this.mesh);
    this.mesh.visible = !!on && this._n > 0;
    if (on) { this.mat.uniforms.uColor.value.copy(color); this.mat.uniforms.uAlpha.value = alpha; this.mat.uniforms.uTime.value = G.time; }
  }
  // the blast ring at the stop (immediate mode: call every frame it shows)
  ring(color, R, k = 0) { if (G.fx?.mark) G.fx.mark(this.end, null, color, R, R_TARGET, 0.9, k, 1.2, 0.5); }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
}

// ---- the HUD cook bar (G.hud.xh), its lamps ticked; pinned under the sub chip
export class CookBar {
  constructor() { this.el = null; this.L = null; }
  _make(xh) {
    if (!document.getElementById('iw-gld-css')) {
      const css = document.createElement('style'); css.id = 'iw-gld-css';
      css.textContent = `.iw-gld { position: absolute; left: -138px; top: 74px; width: 112px; height: 9px; pointer-events: none; opacity: 0; scale: .6; transform-origin: 100% 50%;
  transition: opacity .12s, scale .25s var(--spring, ease-out); }
.iw-gld.is-on { opacity: 1; scale: 1; }
.iw-gld__t { position: absolute; inset: 0; border-radius: 999px; background: rgba(14, 11, 22, .8); box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .5), 0 2px 0 rgba(0, 0, 0, .3); overflow: hidden; }
.iw-gld__f { position: absolute; inset: 0; background: var(--self, #fff); transform-origin: left; transform: scaleX(var(--c, 0)); }
.iw-gld__k { position: absolute; top: 1px; bottom: 1px; width: 2px; margin-left: -1px; background: rgba(14, 11, 22, .75); border-radius: 1px; }
.iw-gld.is-full .iw-gld__t { box-shadow: 0 0 0 1.5px #fff, 0 0 8px var(--self, #fff), 0 2px 0 rgba(0, 0, 0, .3); }
.iw-gld.is-ping .iw-gld__t { animation: iw-gld-ping .45s ease-out; }
.iw-gld.is-warn .iw-gld__f { animation: iw-gld-warn .125s steps(1) infinite; }
.iw-gld.is-warn .iw-gld__t { box-shadow: 0 0 0 1.5px #ff3d5e, 0 0 8px #ff3d5e, 0 2px 0 rgba(0, 0, 0, .3); }
@keyframes iw-gld-ping { 0% { filter: brightness(2.4); scale: 1.18; } }
@keyframes iw-gld-warn { 50% { background: #ff3d5e; } }`;
      document.head.appendChild(css);
    }
    const el = document.createElement('div'); el.className = 'iw-gld';
    let ticks = ''; for (let i = 1; i < 8; i++) ticks += `<i class="iw-gld__k" style="left:${(i / 8) * 100}%"></i>`;
    el.innerHTML = `<span class="iw-gld__t"><span class="iw-gld__f"></span>${ticks}</span>`;
    xh.appendChild(el);
    this.el = el; this.L = { on: null, c: -1, full: false, warn: false };
  }
  // st: null (hidden) or { cook: 0..1, full, warn }
  update(st) {
    const xh = G.hud?.xh;
    if (!xh || (!st && !this.el)) return;
    if (!this.el || this.el.parentNode !== xh) this._make(xh);
    const L = this.L, on = !!st;
    if (on !== L.on) { L.on = on; this.el.classList.toggle('is-on', on); }
    if (!on) { if (L.full) { L.full = false; this.el.classList.remove('is-full'); } if (L.warn) { L.warn = false; this.el.classList.remove('is-warn'); } return; }
    if (Math.abs(st.cook - L.c) > 0.004) { L.c = st.cook; this.el.style.setProperty('--c', st.cook.toFixed(3)); }
    if (st.full !== L.full) { L.full = st.full; this.el.classList.toggle('is-full', st.full); if (st.full) { this.el.classList.remove('is-ping'); void this.el.offsetWidth; this.el.classList.add('is-ping'); } }
    if (st.warn !== L.warn) { L.warn = st.warn; this.el.classList.toggle('is-warn', st.warn); }
  }
  dispose() { this.el?.remove(); this.el = null; }
}

// ---- the glow round a fist holding a primed stone (one sprite per actor, in the scene at the grip)
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}
export function makeGlow(color) {
  const m = new THREE.SpriteMaterial({ map: glowTex(), color: color.clone(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
  const s = new THREE.Sprite(m); s.renderOrder = 4; s.visible = false;
  return s;
}
