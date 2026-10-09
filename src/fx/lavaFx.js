// Highmark Foundry's lava: the looks (src/game/lava.js is the rules). At blockout level, final in its structure:
//   • the level shader's band (lavaLevelExt): below the high mark every face in the region is glazed and darkened
//     (≈ 0.7×, glossier), a crisp ash-white rind sits at the mark, the lava lights the rock just above it, a seething
//     front climbs the walls on a rise (a hot band just above the surface on a fall), and the rind pulses red before a
//     rise (pale before a fall). patchStain gives the five prop materials the same darkening and rind
//   • the surface (LavaLook): warm charcoal-maroon crust broken by lit seams (crimson → scarlet → white-hot; orange
//     only as a thin band, dropped when a team's ink is orange or red), agitated on a rise, crusting over on a fall
//   • the riders' meshes (basalt hex columns with their deck ink; pumice stones), the Surge Gauge's needles and
//     beacons (red flashing / steady red / white flashing / off), the lavafalls (the only full orange-gold: no ink is
//     ever next to them), embers streaming UP on a rise, white steam billowing DOWN on a fall, drifting pumice
//   • the HUD (LavaHud): the gauge chip under the timer and the local player's own line; the minimap layer
// The art pass owns the palette numbers below (LOOK), the lavafalls and the heat shimmer (G.game.screenfx.heat).
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { partPose } from '../game/lavaCore.js';

// ---------------------------------------------------------------------------------------------------- palette
export const LOOK = {
  crust: ['#3b1f1a', '#4a2219'],          // the crust at rest (value 0.18–0.25, never black)
  seam: ['#a3121a', '#e0301e', '#ff7a1e', '#fff0c8'],   // crimson → scarlet → (orange, a thin band) → white-hot
  fall: ['#ff8a1e', '#ffc84a'],           // the lavafalls: full orange-gold, out of play
  rind: [0.82, 0.80, 0.76],               // the ash-white crust line at the high mark (linear)
  basalt: '#646870', basaltTop: '#73777e', pumice: '#bdb8ae', pumiceDk: '#8f8a80',
  needle: '#c8202a', beaconRed: '#ff1206', beaconWhite: '#f4f6ff',
};
const HOT_INKS = new Set(['#ff8a14', '#ff4150', '#ffb000', '#ff6a00']);   // (orange / red team inks: no orange band in the seams)

export const LAVA_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 30 L58 30" stroke="#15121c" stroke-width="7" stroke-linecap="round"/><path d="M6 30 L58 30" stroke="#f4f1ea" stroke-width="3.2" stroke-linecap="round"/><path d="M5 44 C12 36 18 36 24 42 C30 48 36 48 42 41 C47 35 53 35 59 41 L59 56 L5 56 Z" fill="currentColor" stroke="#15121c" stroke-width="4.2" stroke-linejoin="round"/><circle cx="20" cy="18" r="3.4" fill="currentColor" stroke="#15121c" stroke-width="2.6"/><circle cx="34" cy="11" r="2.4" fill="currentColor" stroke="#15121c" stroke-width="2.2"/><circle cx="46" cy="19" r="2.8" fill="currentColor" stroke="#15121c" stroke-width="2.4"/></svg>`;

// ---------------------------------------------------------------------------------------------------- the level shader
const PARS = /* glsl */`
uniform sampler2D uLavaMap; uniform vec4 uLavaBox; uniform vec4 uLavaS; uniform vec4 uLavaW;
float gLavaIn = 0.0; float gLavaRind = 0.0;
float lavaMaskAt(vec2 xz) { vec2 q = (xz - uLavaBox.xy) * uLavaBox.zw; if (q.x <= 0.0 || q.y <= 0.0 || q.x >= 1.0 || q.y >= 1.0) return 0.0; return texture2D(uLavaMap, q).r; }`;
const BASE = /* glsl */`
  gLavaIn = lavaMaskAt(vWPos.xz);
  if (gLavaIn > 0.01 && vWPos.y < uLavaS.y + 0.1) {
    float lhm = uLavaS.y, ly = vWPos.y;
    float ln1 = vnoise(vWPos.xz * 2.3 + ly * 1.7), ln2 = vnoise(vec2(dot(vWPos.xz, vec2(0.7071)) * 9.0, ly * 14.0));
    // below the mark: glazed, darkened, glossy (the bathtub ring's body)
    float lbelow = 1.0 - smoothstep(lhm - 0.02, lhm + 0.01, ly + (ln2 - 0.5) * 0.02);
    base *= mix(1.0, 0.66 + 0.08 * ln1, lbelow * gLavaIn);
    gBaseRough = mix(gBaseRough, 0.34, lbelow * gLavaIn * 0.8);
    // the rind: an ash-white crust band ~6 cm high at the mark, its lower edge ragged (salt drips)
    float lrt = lhm + 0.012, lrb = lhm - 0.06 - 0.035 * ln2;
    float lrind = smoothstep(lrb - 0.012, lrb, ly) * (1.0 - smoothstep(lrt - 0.006, lrt + 0.004, ly));
    base = mix(base, vec3(${LOOK.rind.join(', ')}) * (0.9 + 0.12 * ln1), lrind * gLavaIn * 0.92);
    gLavaRind = lrind * gLavaIn;
  }`;
const EMIS = /* glsl */`
  if (gLavaIn > 0.01) {
    float lL = uLavaS.x, ldy = vWPos.y - lL, lhm = uLavaS.y;
    // (the lava's light lands on the faces that look at it: walls and slopes, hardly on floors above it)
    float lwall = 1.0 - 0.9 * max(vWNorm.y, 0.0);
    float lglow = exp(-max(ldy, 0.0) * 3.2) * step(-0.03, ldy) * lwall;
    float lmv = uLavaW.y;
    // a moving surface: the rise's seething front right at the line; the fall's hot band just above the dropping surface
    float lfront = (1.0 - smoothstep(0.0, 0.2, abs(ldy - 0.05))) * max(lmv, 0.0) + (1.0 - smoothstep(0.0, 0.6, abs(ldy - 0.25))) * max(-lmv, 0.0) * 0.7;
    float lband = smoothstep(lhm - 0.1, lhm - 0.05, vWPos.y) * (1.0 - smoothstep(lhm - 0.005, lhm + 0.02, vWPos.y));
    float lpulse = abs(uLavaW.x) * (0.55 + 0.45 * sin(uTime * 5.6));
    vec3 lwarn = uLavaW.x >= 0.0 ? vec3(0.9, 0.06, 0.03) : vec3(0.55, 0.58, 0.66);
    float link = 1.0 - 0.8 * gInk;
    totalEmissiveRadiance += (vec3(0.36, 0.04, 0.015) * lglow * (0.75 + 0.25 * uLavaW.z) + vec3(1.0, 0.3, 0.07) * lfront * lwall * 1.3) * gLavaIn * link
      + lwarn * lband * lpulse * 1.1 * gLavaIn;
  }`;
export function lavaLevelExt(W) {
  return { key: 'lava', uniforms: W.uniforms, defines: { LAVA: 1 }, fragPars: PARS, fragBase: BASE, fragEmissive: EMIS };
}
// the same darkening and rind on the prop kit's materials (props below the mark in the region: bollards, drums …)
export function patchStain(mat, U) {
  if (mat.userData.lavaStain) return;
  mat.userData.lavaStain = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uLavaMap = U.uLavaMap; sh.uniforms.uLavaBox = U.uLavaBox; sh.uniforms.uLavaS = U.uLavaS;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLavaW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 lw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nlw = instanceMatrix * lw;\n#endif\nvLavaW = (modelMatrix * lw).xyz; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLavaW; uniform sampler2D uLavaMap; uniform vec4 uLavaBox; uniform vec4 uLavaS;')
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec2 lq = (vLavaW.xz - uLavaBox.xy) * uLavaBox.zw; float lin = (lq.x > 0.0 && lq.y > 0.0 && lq.x < 1.0 && lq.y < 1.0) ? texture2D(uLavaMap, lq).r : 0.0;
  if (lin > 0.01) { float lhm = uLavaS.y; float lb = 1.0 - smoothstep(lhm - 0.02, lhm + 0.01, vLavaW.y); diffuseColor.rgb *= mix(1.0, 0.68, lb * lin);
    float lr = smoothstep(lhm - 0.07, lhm - 0.05, vLavaW.y) * (1.0 - smoothstep(lhm, lhm + 0.012, vLavaW.y)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${LOOK.rind.join(', ')}), lr * lin * 0.9); } }`);
  };
  const key = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : null;
  mat.customProgramCacheKey = () => (key ? key() : '') + '-lava';
  mat.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------------- the surface
const SURF_VS = /* glsl */`
varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const SURF_FS = /* glsl */`
uniform float uTime; uniform vec4 uS;   // x: move (−1 fall … 1 rise), y: warn (0 … 1), z: no orange band, w: rest at HIGH
uniform vec3 uCrA, uCrB, uS0, uS1, uS2, uS3;
varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
float lh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 lh2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float lvn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(lh(i), lh(i + vec2(1.0, 0.0)), u.x), mix(lh(i + vec2(0.0, 1.0)), lh(i + vec2(1.0, 1.0)), u.x), u.y); }
// the crust's plates: a cell net (F2 − F1 is 0 on the cracks between plates); the plates drift slowly
vec2 plates(vec2 x, float t) {
  vec2 n = floor(x), f = fract(x); float F1 = 8.0, F2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = lh2(n + g);
    o = 0.5 + 0.4 * sin(t * 0.12 + 6.2831 * o);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < F1) { F2 = F1; F1 = d; } else if (d < F2) F2 = d;
  }
  return vec2(sqrt(F1), sqrt(F2));
}
void main() {
  vec2 p = vW.xz; float t = uTime;
  float rise = max(uS.x, 0.0), fall = max(-uS.x, 0.0);
  vec2 warp = vec2(lvn(p * 0.21 + t * 0.01), lvn(p * 0.21 - 5.3 - t * 0.008)) * 2.4 + vec2(lvn(p * 0.7 + 3.1), lvn(p * 0.7 - 1.7)) * 0.5;
  vec2 c1 = plates(p * 0.62 + warp + vec2(t * 0.025, -t * 0.018) * (1.0 + 2.0 * rise), t * (1.0 + 3.0 * rise));
  vec2 c2 = plates(p * 1.7 + warp * 2.0 - vec2(t * 0.04, t * 0.03), t * 1.3);
  float e = c1.y - c1.x, e2 = c2.y - c2.x;
  // the cracks: wider and hotter on a rise and in its warning, narrow and dull as it crusts over on a fall
  // (lit share of the open lava, the blend weight over 0.25: ≈ 42 % at rest, ≈ 53 % on a rise, ≈ 24 % on a fall)
  float sw = 0.26 + 0.09 * rise + 0.06 * uS.y - 0.1 * fall;
  float seam = (1.0 - smoothstep(0.0, sw, e)) * (0.75 + 0.25 * lvn(p * 0.9 + t * 0.2));
  seam = max(seam, (1.0 - smoothstep(0.0, sw * 0.35, e2)) * 0.45 * (1.0 - fall));
  float core = 1.0 - smoothstep(0.0, sw * 0.16, e);
  vec3 crust = mix(uCrA, uCrB, lvn(p * 1.3)) * (0.82 + 0.36 * lvn(p * 4.7));
  crust *= 1.0 - 0.3 * fall;
  vec3 hot = mix(uS0 * 0.55, uS1 * 0.9, smoothstep(0.35, 1.0, seam));
  if (uS.z < 0.5) hot = mix(hot, uS2, smoothstep(0.9, 0.99, seam) * 0.35);
  hot = mix(hot, uS3 * 2.3, core * core * (0.45 + 0.55 * rise + 0.2 * uS.y));
  float pulse = 0.88 + 0.12 * sin(t * 1.3 + e * 23.0);
  vec3 col = mix(crust, hot * (0.8 + 0.5 * rise + 0.2 * uS.y) * pulse, smoothstep(0.05, 0.75, seam));
  // warning bubbles: sparse bright pops
  float bub = step(0.985 - 0.02 * uS.y - 0.015 * rise, lh(floor(p * 1.5) + floor(t * 2.0))) * (0.5 + 0.5 * sin(t * 9.0 + lh(floor(p * 1.5)) * 6.28));
  col += uS1 * bub * 1.2 * (uS.y + rise);
  gl_FragColor = vec4(col, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;
const FALL_FS = /* glsl */`
uniform float uTime; uniform float uK; uniform vec3 uA, uB; varying vec2 vUv;
#include <common>
#include <fog_pars_fragment>
float lh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lvn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(lh(i), lh(i + vec2(1.0, 0.0)), u.x), mix(lh(i + vec2(0.0, 1.0)), lh(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  float s = lvn(vec2(vUv.x * 9.0, vUv.y * 3.0 + uTime * 1.8)) * 0.6 + lvn(vec2(vUv.x * 23.0, vUv.y * 7.0 + uTime * 3.1)) * 0.4;
  vec3 col = mix(uA, uB, smoothstep(0.35, 0.8, s)) * (1.6 + 0.8 * s);
  float edge = 1.0;
  float a = clamp((0.45 + 0.55 * uK) * edge * (0.7 + 0.5 * s) * smoothstep(1.0, 0.75, vUv.y), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;
const FALL_VS = /* glsl */`
varying vec2 vUv;
#include <common>
#include <fog_pars_vertex>
void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const PT_VS = /* glsl */`
attribute float aSize; attribute float aA; attribute vec3 aCol; varying float vA; varying vec3 vCol;
void main() { vA = aA; vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * 320.0 / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }`;
const PT_FS = /* glsl */`
varying float vA; varying vec3 vCol; uniform float uSoft;
void main() { vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard; float a = vA * (uSoft > 0.5 ? smoothstep(0.5, 0.0, r) : smoothstep(0.5, 0.3, r)); gl_FragColor = vec4(vCol, a);
#include <colorspace_fragment>
}`;

const lin = (hex) => new THREE.Color(hex);
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class LavaLook {
  constructor(W, o) {
    this.W = W; this.scene = o.scene; this.level = o.level;
    this.root = new THREE.Group(); this.root.name = 'lava'; this.scene.add(this.root);
    this.t = 0; this.e = 0; this.mv = 0; this.warn = 0;
    const q = G.settings?.quality || 'high';
    this.nEmb = q === 'low' ? 0 : q === 'medium' ? 300 : 600;
    this._surface();
    this._riders();
    this._gauges();
    this._cascades();
    this._particles();
    this._flotsam();
    this.setY(W.low, null);
  }
  // ---- the surface: a 0.5 m grid over the region (cells the banks and the island hide are left out)
  _surface() {
    const W = this.W, B = W.box, S = 0.5, L = this.level, pos = [], idx = [], vid = new Map();
    const covered = (x, z) => L.groundHeight(x, z, 50) >= W.high + 0.2;
    const vert = (i, j) => { const k = i + ',' + j; let v = vid.get(k); if (v === undefined) { v = pos.length / 3; vid.set(k, v); pos.push(i * S, 0, j * S); } return v; };
    const i0 = Math.floor(B.x0 / S), i1 = Math.ceil((B.x0 + B.nx * B.res) / S), j0 = Math.floor(B.z0 / S), j1 = Math.ceil((B.z0 + B.nz * B.res) / S);
    const open = [];
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const cx = (i + 0.5) * S, cz = (j + 0.5) * S;
      if (!W.inRegion(cx, cz)) continue;
      if (covered(i * S + 0.02, j * S + 0.02) && covered((i + 1) * S - 0.02, j * S + 0.02) && covered(i * S + 0.02, (j + 1) * S - 0.02) && covered((i + 1) * S - 0.02, (j + 1) * S - 0.02)) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
      idx.push(a, d, c, a, c, b);
      if (L.groundHeight(cx, cz, 50) === -Infinity) open.push(cx, cz);
    }
    this.open = Float32Array.from(open);   // open-lava cell centres (embers, steam, flotsam)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere();
    const ink = (G.teamHex || []).map((h) => String(h).toLowerCase());
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uS: { value: new THREE.Vector4(0, 0, ink.some((h) => HOT_INKS.has(h)) ? 1 : 0, 0) },
        uCrA: { value: lin(LOOK.crust[0]) }, uCrB: { value: lin(LOOK.crust[1]) }, uS0: { value: lin(LOOK.seam[0]) }, uS1: { value: lin(LOOK.seam[1]) }, uS2: { value: lin(LOOK.seam[2]) }, uS3: { value: lin(LOOK.seam[3]) } },
      vertexShader: SURF_VS, fragmentShader: SURF_FS, fog: true,
    });
    this.mat.polygonOffset = true; this.mat.polygonOffsetFactor = -2; this.mat.polygonOffsetUnits = -2;
    this.surf = new THREE.Mesh(g, this.mat); this.surf.name = 'lava:surface'; this.surf.frustumCulled = false; this.surf.receiveShadow = false;
    this.surf.onBeforeRender = (r, s, c, gg) => { gg.drawRange.count = s.overrideMaterial ? 0 : Infinity; };   // (out of the GTAO / depth override pass)
    this.root.add(this.surf);
    this.tris = idx.length / 3;
  }
  // ---- the riders: basalt hex columns (their deck ink and the lookout's sides), pumice stones
  _riders() {
    // (draw calls: every stone rides at the same height — L + its sink offset — so all of them and the boulder are ONE
    // merged mesh; each column is one mesh, its cap merged in by vertex colour; the shadow pass only for the columns)
    const W = this.W;
    this.rid = [];
    const basalt = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, metalness: 0, flatShading: true });
    const pumice = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, emissive: '#000000' });
    this._mats = [basalt, null, pumice];
    const stoneGeos = [];
    const place = (g, x, y, z, yaw) => { g.rotateY(yaw); g.translate(x, y, z); return g; };
    W.riders.forEach((r, i) => {
      if (r.sink) {
        const p = r.parts[0];
        stoneGeos.push(place(rockGeo(p.hx * 2 * 0.98, r.depth, p.hz * 2 * 0.98, i * 7.3 + 1), r.x, 0, r.z, r.yaw));
        for (const q of r.parts) if (!q.body) { const qq = partPose(r, q, 0, {}); stoneGeos.push(place(rockGeo(q.hx * 2, q.y1 - q.y0, q.hz * 2, i * 3.1 + 9), qq.cx, q.y1, qq.cz, qq.yaw)); }
        this.rid.push({ r, g: null, ink: null });
        return;
      }
      const g = new THREE.Group(); g.name = 'lava:rider:' + r.id;
      const parts = [colourGeo(new THREE.CylinderGeometry(r.r, r.r, r.depth, 6, 1, false, Math.PI / 2).translate(0, -r.depth / 2, 0), LOOK.basalt),
        colourGeo(new THREE.CylinderGeometry(r.r - 0.04, r.r - 0.04, 0.06, 6, 1, false, Math.PI / 2).translate(0, -0.02, 0), LOOK.basaltTop)];
      for (const q of r.parts) if (!q.body) parts.push(colourGeo(new THREE.BoxGeometry(q.hx * 2, q.y1 - q.y0, q.hz * 2).rotateY(q.yaw).translate(q.ox, (q.y0 + q.y1) / 2, q.oz), LOOK.basalt));
      const m = new THREE.Mesh(mergeGeos(parts), basalt); m.castShadow = true; m.receiveShadow = true; g.add(m);
      g.rotation.y = r.yaw;
      g.position.set(r.x, r.top0, r.z);
      this.root.add(g);
      this.rid.push({ r, g, ink: null });
    });
    if (stoneGeos.length) {
      this.stones = new THREE.Mesh(mergeGeos(stoneGeos), pumice); this.stones.name = 'lava:stones'; this.stones.receiveShadow = true; this.stones.visible = false;
      this.root.add(this.stones);
    }
  }
  // the floats' ink overlays (built once the match runtime has made their paints)
  _inkFor(R, k) {
    const e = this.rid[k];
    if (e.ink || !R.deck) return;
    const r = R.r, mats = [];
    const deckMat = new THREE.MeshBasicMaterial({ map: R.deck.texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    mats.push(deckMat);
    // the deck: the hexagon (or the box top), UVs into the deck paint's canvas rect
    const [u0, v0, u1, v1] = R.deck.uv(0), sf = R.deck.surf[0];
    const pts = r.shape === 'hex' ? [0, 1, 2, 3, 4, 5].map((k2) => [r.r * Math.cos((k2 * Math.PI) / 3), r.r * Math.sin((k2 * Math.PI) / 3)]) : [[-sf.a1, -sf.b1], [sf.a1, -sf.b1], [sf.a1, sf.b1], [-sf.a1, sf.b1]];
    const pos = [0, 0.012, 0], uv = [(u0 + u1) / 2, (v0 + v1) / 2], idx = [];
    // (BoxPaint's local axes are the group's: a along local x, b along local z, its canvas v up = +b)
    const ca = (a) => Math.max(sf.a0, Math.min(sf.a1, a)), cb = (b) => Math.max(sf.b0, Math.min(sf.b1, b));
    for (const [a, b] of pts) { pos.push(a, 0.012, b); uv.push(u0 + ((ca(a) - sf.a0) / (sf.a1 - sf.a0)) * (u1 - u0), v0 + ((cb(b) - sf.b0) / (sf.b1 - sf.b0)) * (v1 - v0)); }
    for (let k2 = 1; k2 <= pts.length; k2++) idx.push(0, k2, (k2 % pts.length) + 1);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const deck = new THREE.Mesh(geo, deckMat); deck.renderOrder = 2;
    e.g.add(deck);
    const sides = [], sideOf = [];
    if (R.sides) R.sides.forEach((sp, j) => {
      if (!sp) return;
      const m = new THREE.MeshBasicMaterial({ map: sp.texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      const mesh = sp.inkMesh(m); mesh.position.y = -r.depth; mesh.rotation.y = r.parts[j].yaw; mesh.renderOrder = 2;
      e.g.add(mesh); sides.push(mesh); sideOf[j] = mesh; mats.push(m); mesh.visible = false;
    });
    deck.visible = false;
    e.ink = { deck, sides, sideOf, mats, R };
  }
  // ---- the Surge Gauge's needles and the beacons (the boards are the stage's props)
  _gauges() {
    // (one instanced mesh for the needles, one for every beacon: 2 draw calls)
    const G2 = this.W.gauges, nm = new THREE.MeshStandardMaterial({ color: LOOK.needle, roughness: 0.4, metalness: 0.2, emissive: '#5a0806', emissiveIntensity: 1 });
    this.beaconMat = new THREE.MeshBasicMaterial({ color: '#000000', toneMapped: false });
    this.needleIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), nm, G2.length); this.needleIM.name = 'lava:needles'; this.needleIM.frustumCulled = false;
    this.needles = G2.map((gd) => { const big = gd.h > 3; return { gd, h: gd.h, size: big ? [1.4, 0.32, 0.16] : [0.5, 0.14, 0.16], off: [big ? 0.35 : 0.1, 0, 0.22] }; });
    const bl = [];
    for (const gd of G2) { const big = gd.h > 3; for (const p of big ? [[-1.25, gd.h + 0.3, 0.12], [1.25, gd.h + 0.3, 0.12]] : [[0, gd.h + 0.2, 0.14]]) bl.push({ gd, p, s: big ? 1.4 : 0.8 }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bl.push({ gd: { pos: [0, 0, 0], yaw: 0 }, p: [sx * 1.4, 20.65, sz * 1.4], s: 1 });
    this.beaconIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), this.beaconMat, bl.length); this.beaconIM.name = 'lava:beacons'; this.beaconIM.frustumCulled = false;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    bl.forEach((b, i) => { const yaw = b.gd.yaw || 0; v.set(...b.p).applyAxisAngle(UPV, yaw).add(v2.set(...b.gd.pos)); q.setFromAxisAngle(UPV, yaw); this.beaconIM.setMatrixAt(i, m.compose(v, q, sc.setScalar(b.s))); });
    this.root.add(this.needleIM, this.beaconIM);
    this._setNeedles(0);
  }
  _setNeedles(e) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    this.needles.forEach((n, i) => { const yaw = n.gd.yaw || 0; v.set(n.off[0], 0.2 + e * (n.h - 0.4), n.off[2]).applyAxisAngle(UPV, yaw).add(v2.set(...n.gd.pos)); q.setFromAxisAngle(UPV, yaw); this.needleIM.setMatrixAt(i, m.compose(v, q, sc.set(...n.size))); n.y = 0.2 + e * (n.h - 0.4); });
    this.needleIM.instanceMatrix.needsUpdate = true;
  }
  // ---- the lavafalls over the Spillway lips (the only full orange-gold)
  _cascades() {
    this.falls = [];
    const fm = (this.fallMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uK: { value: 0 }, uA: { value: lin(LOOK.fall[0]) }, uB: { value: lin(LOOK.fall[1]) } },
      vertexShader: FALL_VS, fragmentShader: FALL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true }));
    // a lip is a polyline (the stage's lip line) or a pair of points; each segment's curtain pours to the side that is not
    // lava (tested 0.6 m off each side), out 1.7 m and down `drop`
    for (const c of this.W.cascades) {
      const L = c.lip, pos = [], uv = [], idx = [];
      // (the first row reaches 0.4 m back over the lava: it covers the surface grid's cells that overhang the lip)
      const rows = [[-0.4, 0.03, 0], [0, 0.02, 0.02], [0.45, -0.22, 0.12], [0.95, -1.1, 0.32], [1.35, -c.drop * 0.5, 0.65], [1.7, -c.drop, 1]];
      let run = 0, total = 0; for (let i = 0; i + 1 < L.length; i++) total += Math.hypot(L[i + 1][0] - L[i][0], L[i + 1][1] - L[i][1]);
      for (let i = 0; i + 1 < L.length; i++) {
        const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
        if (len < 0.05) continue;
        let nx = -dz / len, nz = dx / len;
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, inP = this.W.inRegion(mx + nx * 0.6, mz + nz * 0.6), inM = this.W.inRegion(mx - nx * 0.6, mz - nz * 0.6);
        if (inP && !inM) { nx = -nx; nz = -nz; } else if (inP === inM && nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }   // (else: away from the lake's middle)
        const cols = Math.max(1, Math.ceil(len / 1.5)), base = pos.length / 3;
        for (let ri = 0; ri < rows.length; ri++) for (let ci = 0; ci <= cols; ci++) {
          const u = ci / cols, [o, y, v] = rows[ri];
          pos.push(a[0] + dx * u + nx * o, y, a[1] + dz * u + nz * o); uv.push((run + len * u) / Math.max(1, total) * Math.max(1, total / 6), v);
        }
        for (let ri = 0; ri + 1 < rows.length; ri++) for (let ci = 0; ci < cols; ci++) { const k = base + ri * (cols + 1) + ci, k2 = k + cols + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
        run += len;
      }
      if (!idx.length) continue;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      this.falls.push({ geo, y: c.y });
    }
    // (one draw call for every lavafall: their lips sit at one height, so one mesh moves with the surface)
    if (this.falls.length) {
      const m = new THREE.Mesh(mergeGeos(this.falls.map((f) => f.geo.toNonIndexed())), fm); m.frustumCulled = false; m.renderOrder = 1; m.name = 'lava:falls';
      this.root.add(m); this.fallMesh = m; this.fallY = Math.max(...this.falls.map((f) => f.y));
    }
  }
  // ---- embers (up, on a rise) and steam (down, on a fall): one Points each, simulated here
  _particles() {
    const mk = (n, soft, blend) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = new THREE.ShaderMaterial({ uniforms: { uSoft: { value: soft ? 1 : 0 } }, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false, blending: blend });
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 3;
      this.root.add(p);
      return { p, g, n, life: new Float32Array(n), vel: new Float32Array(n * 3), age: new Float32Array(n) };
    };
    this.emb = this.nEmb ? mk(this.nEmb, false, THREE.AdditiveBlending) : null;
    this.stm = this.nEmb ? mk(Math.round(this.nEmb * 0.6), true, THREE.NormalBlending) : null;
  }
  _flotsam() {
    const f = this.W.def.flotsam, open = this.open;
    if (!f || !open.length) { this.flot = null; return; }
    const n = f.count || 0, geo = rockGeo(1, 0.5, 1, 4.2), mat = new THREE.MeshStandardMaterial({ color: '#5a5450', roughness: 1, flatShading: true });
    const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; im.name = 'lava:flotsam';
    const L = this.level, items = [];
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      const c = Math.floor(rnd(tries * 1.7 + 0.3) * (open.length / 2)), x = open[c * 2], z = open[c * 2 + 1];
      let ok = true;
      for (let a = 0; a < 8 && ok; a++) if (L.groundHeight(x + Math.cos(a * 0.785) * (f.keepOff + 0.5), z + Math.sin(a * 0.785) * (f.keepOff + 0.5), 50) > -Infinity) ok = false;
      if (!ok) continue;
      items.push({ x, z, s: f.size[0] + (f.size[1] - f.size[0]) * rnd(tries * 3.3), ph: rnd(tries * 9.1) * 6.28, yaw: rnd(tries * 5.7) * 6.28 });
      k++;
    }
    im.count = items.length;
    this.root.add(im);
    this.flot = { im, items };
  }

  setY(y, st) {
    this.y = y;
    if (this.surf) this.surf.position.y = Math.max(y, -1.56);
  }
  update(dt, t, st, R) {
    this.t += dt;
    const W = this.W, U = W.uniforms;
    const vmax = (1.5 * (W.high - W.low)) / (st.move?.dur || 10);
    this.mv = st.dir ? Math.sign(st.v || st.dir) * Math.min(1, Math.abs(st.v) / vmax + 0.35) : 0;
    const warnT = st.warn && st.next ? 1 - Math.max(0, st.next.inS) / Math.max(1, R.sched.T.warn) : 0;
    this.warn = st.warn ? (st.next.to === 'high' ? 1 : -1) * (0.5 + 0.5 * warnT) : 0;
    U.uLavaS.value.w = this.t;
    U.uLavaW.value.set(this.warn, this.mv, st.phase === 'high' ? 1 : st.dir > 0 ? 1 : 0, 0);
    this.mat.uniforms.uTime.value = this.t;
    this.mat.uniforms.uS.value.x = this.mv; this.mat.uniforms.uS.value.y = Math.abs(this.warn); this.mat.uniforms.uS.value.w = st.phase === 'high' ? 1 : 0;
    // riders
    let stoneTop = null;
    R.riders.forEach((Rr, k) => {
      const e = this.rid[k];
      if (!e) return;
      if (Rr.r.sink) { if (!Rr.parked) stoneTop = Rr.top; return; }
      if (!e.ink && Rr.deck) this._inkFor(Rr, k);
      e.g.position.y = Rr.top;
      if (e.ink) {
        const P = e.ink.R;
        if (P.deck.dirty) { P.deck.texture.needsUpdate = true; P.deck.dirty = false; }
        e.ink.deck.visible = P.deck.n > 0;   // (an overlay only once there is ink on it)
        if (P.sides) P.sides.forEach((sp, j) => { if (sp && sp.dirty) { sp.texture.needsUpdate = true; sp.dirty = false; } if (e.ink.sideOf[j]) e.ink.sideOf[j].visible = !!sp && sp.n > 0; });
      }
    });
    if (this.stones) { this.stones.visible = stoneTop !== null; if (stoneTop !== null) this.stones.position.y = stoneTop; }
    // the Organs grind as they move: rubble and dust shed at the columns' feet; the stones crack and glow before a fall
    if (st.dir && (this._rubT = (this._rubT || 0) - dt) <= 0) {
      this._rubT = 0.22;
      const cols = this.rid.filter((e) => !e.r.sink && e.r.shape === 'hex'), e = cols[(Math.random() * cols.length) | 0];
      if (e && G.camera && e.g.position.distanceTo(G.camera.position) < 45) {
        const a = Math.random() * Math.PI * 2, v = new THREE.Vector3(e.r.x + Math.cos(a) * e.r.r, Math.max(this.y, 1.2) + 0.1, e.r.z + Math.sin(a) * e.r.r);
        G.fx?.burst(v, new THREE.Vector3(Math.cos(a), 0.6, Math.sin(a)), new THREE.Color('#8d8780'), { count: 5, speed: 2.2, size: 0.09 });
      }
    }
    const crack = st.warn && st.next.to === 'low' ? 0.5 + 0.5 * Math.sin(this.t * 7) : st.phase === 'fall' ? 0.6 : 0;
    this._mats[2].emissive.setRGB(0.55 * crack, 0.05 * crack, 0.02 * crack);
    // the gauge: the needle climbs 5× the lava's own move; the beacons
    if (Math.abs((this._ne ?? -1) - st.e) > 1e-4) { this._ne = st.e; this._setNeedles(st.e); }
    const blink = (hz) => (Math.sin(this.t * Math.PI * 2 * hz) > 0 ? 1 : 0.08);
    let bc = null, bk = 0;
    if (st.warn && st.next.to === 'high') { bc = LOOK.beaconRed; bk = blink(2.2); }
    else if (st.phase === 'rise') { bc = LOOK.beaconRed; bk = blink(3.5); }
    else if (st.warn && st.next.to === 'low') { bc = LOOK.beaconWhite; bk = blink(2.2); }
    else if (st.phase === 'fall') { bc = LOOK.beaconWhite; bk = blink(3.5); }
    else if (st.phase === 'high') { bc = LOOK.beaconRed; bk = 1; }
    if (bc) this.beaconMat.color.set(bc).multiplyScalar(0.15 + bk * 1.1); else this.beaconMat.color.set('#1a0a08');
    // the lavafalls: thin at LOW, full while the surface is high over the lip
    this.fallMat.uniforms.uTime.value = this.t;
    if (this.fallMesh) { const k = Math.max(0, Math.min(1, (st.y - this.fallY) / Math.max(0.3, W.high - this.fallY))); this.fallMesh.position.y = Math.max(st.y, this.fallY) - 0.04; this.fallMat.uniforms.uK.value = k; }
    this._stepParticles(dt, st);
    this._stepFlotsam(st);
    // the rumble loop
    if (this._rum) this._rum.set({ volume: this._rumV = (this._rumV ?? 0.15) + ((this._rumW ?? 0.15) - (this._rumV ?? 0.15)) * Math.min(1, dt * 0.8) });
  }
  _stepParticles(dt, st) {
    const open = this.open;
    if (!open.length) return;
    const cam = G.camera, cx = cam ? cam.position.x : 0, cz = cam ? cam.position.z : 0;
    const pick = (k) => { // an open-lava spot near the camera more often than not
      for (let tries = 0; tries < 6; tries++) { const c = Math.floor(Math.random() * (open.length / 2)), x = open[c * 2], z = open[c * 2 + 1]; if (tries === 5 || Math.hypot(x - cx, z - cz) < 45) return [x, z]; }
      return [0, 0];
    };
    // embers: streaming up on a rise (and its warning), a few at HIGH and at rest
    const E = this.emb;
    if (E) {
      const rate = st.phase === 'rise' ? 1 : st.warn && st.next.to === 'high' ? 0.45 : st.phase === 'high' ? 0.25 : 0.06;
      const pos = E.g.attributes.position.array, sz = E.g.attributes.aSize.array, aa = E.g.attributes.aA.array, col = E.g.attributes.aCol.array;
      for (let i = 0; i < E.n; i++) {
        E.age[i] += dt;
        if (E.age[i] >= E.life[i]) {
          if (Math.random() > rate * dt * 4) { aa[i] = 0; E.life[i] = 0; E.age[i] = 0; continue; }
          // (before and during a rise a third of them spit from the drains, pools and hornitos: the vents)
          const vent = (st.warn || st.dir > 0) && this.W.vents.length && Math.random() < 0.33 ? this.W.vents[(Math.random() * this.W.vents.length) | 0] : null;
          const [x, z] = vent ? [vent[0], vent[2]] : pick(i);
          pos[i * 3] = x + (Math.random() - 0.5) * (vent ? 0.6 : 1); pos[i * 3 + 1] = vent ? Math.max(vent[1], this.y) + 0.05 : this.y + 0.05; pos[i * 3 + 2] = z + (Math.random() - 0.5) * (vent ? 0.6 : 1);
          E.vel[i * 3] = (Math.random() - 0.5) * 0.6; E.vel[i * 3 + 1] = 1.2 + Math.random() * 2.2 * (st.phase === 'rise' ? 1.4 : 1); E.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          E.life[i] = 1.2 + Math.random() * 2.2; E.age[i] = 0; sz[i] = 0.05 + Math.random() * 0.07;
          const h = Math.random(); col[i * 3] = 1.0 * 3; col[i * 3 + 1] = (0.18 + 0.4 * h) * 3; col[i * 3 + 2] = 0.05 * 3;
        }
        const k = E.age[i] / Math.max(0.01, E.life[i]);
        pos[i * 3] += E.vel[i * 3] * dt + Math.sin(this.t * 3 + i) * 0.01; pos[i * 3 + 1] += E.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += E.vel[i * 3 + 2] * dt;
        aa[i] = E.life[i] ? (1 - k) * (0.6 + 0.4 * Math.sin(this.t * 17 + i)) : 0;
      }
      E.g.attributes.position.needsUpdate = true; E.g.attributes.aA.needsUpdate = true; E.g.attributes.aSize.needsUpdate = true; E.g.attributes.aCol.needsUpdate = true;
      E.p.visible = E.life.some((l) => l > 0);
    }
    // steam: billowing DOWN off the surfaces a fall leaves (and wisps at the ebb)
    const Sm = this.stm;
    if (Sm) {
      const rate = st.phase === 'fall' ? 1 : st.warn && st.next.to === 'low' ? 0.3 : st.phase === 'low' ? 0.05 : 0.02;
      const pos = Sm.g.attributes.position.array, sz = Sm.g.attributes.aSize.array, aa = Sm.g.attributes.aA.array, col = Sm.g.attributes.aCol.array;
      for (let i = 0; i < Sm.n; i++) {
        Sm.age[i] += dt;
        if (Sm.age[i] >= Sm.life[i]) {
          if (Math.random() > rate * dt * 3) { aa[i] = 0; Sm.life[i] = 0; Sm.age[i] = 0; continue; }
          const [x, z] = pick(i);
          pos[i * 3] = x + (Math.random() - 0.5) * 2; pos[i * 3 + 1] = this.y + 0.6 + Math.random() * (st.phase === 'fall' ? 1.6 : 0.6); pos[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
          Sm.vel[i * 3] = (Math.random() - 0.5) * 0.4; Sm.vel[i * 3 + 1] = -(0.25 + Math.random() * 0.45); Sm.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
          Sm.life[i] = 2 + Math.random() * 2.5; Sm.age[i] = 0; sz[i] = 0.5 + Math.random() * 0.6;
          const g = 0.82 + Math.random() * 0.12; col[i * 3] = g; col[i * 3 + 1] = g; col[i * 3 + 2] = g * 1.02;
        }
        const k = Sm.age[i] / Math.max(0.01, Sm.life[i]);
        pos[i * 3] += Sm.vel[i * 3] * dt; pos[i * 3 + 1] = Math.max(this.y + 0.15, pos[i * 3 + 1] + Sm.vel[i * 3 + 1] * dt); pos[i * 3 + 2] += Sm.vel[i * 3 + 2] * dt;
        sz[i] += dt * 0.35;
        aa[i] = Sm.life[i] ? Math.sin(Math.PI * k) * 0.32 : 0;
      }
      Sm.g.attributes.position.needsUpdate = true; Sm.g.attributes.aA.needsUpdate = true; Sm.g.attributes.aSize.needsUpdate = true; Sm.g.attributes.aCol.needsUpdate = true;
      Sm.p.visible = Sm.life.some((l) => l > 0);
    }
  }
  _stepFlotsam(st) {
    const F = this.flot;
    if (!F) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    F.items.forEach((it, i) => {
      const a = it.ph + this.t * 0.05;
      p.set(it.x + Math.cos(a) * 0.6, this.y + 0.03 + Math.sin(this.t * 0.8 + it.ph) * 0.02, it.z + Math.sin(a) * 0.6);
      e.set(0, it.yaw + this.t * 0.02, 0); q.setFromEuler(e); s.setScalar(it.s);
      F.im.setMatrixAt(i, m.compose(p, q, s));
    });
    F.im.instanceMatrix.needsUpdate = true;
  }
  // ---- one-shots
  steam(sample, P) {   // burned ink: a puff of steam in that ink's colour off each sampled cell
    const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < sample.length; i += 2) {
      if (!P.cellWorld(sample[i], v)) continue;
      const col = G.teamColors?.[sample[i + 1]];
      if (col) G.fx?.burst(v.setY(v.y + 0.08), up, col, { count: 3, speed: 1.4, size: 0.12, mist: true });
    }
  }
  fizzle(p, what) { const v = new THREE.Vector3(p.x, this.y + 0.08, p.z); G.fx?.burst(v, new THREE.Vector3(0, 1, 0), new THREE.Color('#d9d6d2'), { count: what === 'device' ? 10 : 5, speed: 2, size: 0.1, mist: true }); }
  splash(p, team) { const v = new THREE.Vector3(p.x, this.y + 0.1, p.z); G.fx?.burst(v, new THREE.Vector3(0, 1, 0), new THREE.Color('#ff5a24'), { count: 22, speed: 5.5, size: 0.11 }); G.fx?.burst(v, new THREE.Vector3(0, 1, 0), new THREE.Color('#e8e4de'), { count: 10, speed: 2.4, size: 0.2, mist: true }); void team; }
  rumble(level) {
    this._rumW = level;
    if (!this._rum && G.audio?.loop) { try { this._rum = G.audio.loop('lava_rumble', { volume: level }); this._rumV = level; } catch (e) { this._rum = null; } }
  }
  drain(on) {
    if (on && !this._drn && G.audio?.loop) { try { this._drn = G.audio.loop('lava_drain', { volume: 0.6 }); } catch (e) { this._drn = null; } }
    if (!on && this._drn) { this._drn.stop(1.2); this._drn = null; }
  }
  reset() {
    this._rum?.stop(0.4); this._rum = null; this.drain(false);
    for (const e of this.rid) if (e.ink) { e.g.remove(e.ink.deck); for (const s of e.ink.sides) e.g.remove(s); e.ink.deck.geometry.dispose(); for (const s of e.ink.sides) s.geometry.dispose(); for (const m of e.ink.mats) m.dispose(); e.ink = null; }
    for (const e of this.rid) if (e.g) e.g.position.y = e.r.top0;
    if (this.stones) this.stones.visible = false;
    this.W.uniforms.uLavaW.value.set(0, 0, 0, 0);
  }
  dispose() {
    this.reset();
    this.scene.remove(this.root);
    this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const m of [this.mat, this.fallMat, this.beaconMat, this.needleIM?.material, ...(this._mats || [])]) m?.dispose();
    for (const P of [this.emb, this.stm]) P?.p.material.dispose();
    this.flot?.im.material.dispose();
  }
}

const UPV = new THREE.Vector3(0, 1, 0), v2 = new THREE.Vector3();
// a geometry with a flat vertex colour (non-indexed: merges with the rocks)
function colourGeo(g, hex) { const n = g.index ? g.toNonIndexed() : g, c = new THREE.Color(hex), col = new Float32Array(n.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; } n.setAttribute('color', new THREE.BufferAttribute(col, 3)); return n; }
// merge non-indexed geometries' position / normal / colour / uv (what they share)
function mergeGeos(list) {
  const keys = ['position', 'normal', 'color', 'uv'].filter((k) => list.every((g) => g.attributes[k]));
  const out = new THREE.BufferGeometry();
  for (const k of keys) { const size = list[0].attributes[k].itemSize, n = list.reduce((a, g) => a + g.attributes[k].count, 0), arr = new Float32Array(n * size); let o = 0; for (const g of list) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(arr, size)); }
  if (!out.attributes.normal) out.computeVertexNormals();
  out.computeBoundingSphere();
  for (const g of list) g.dispose();
  return out;
}
// a lumpy rock filling a w × h × d box (its top at y = 0, its base at −h), vertex-coloured pumice
function rockGeo(w, h, d, seed) {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, col = [];
  const a = new THREE.Color(LOOK.pumice), b = new THREE.Color(LOOK.pumiceDk), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // a lumpy, flat-topped boulder: the same lump for the same point (shared vertices stay shared), the top squashed
    const j = 0.9 + 0.1 * Math.sin(x * 5.1 + seed) * Math.cos(z * 4.3 - seed) + 0.05 * Math.sin(y * 7.7 + seed * 2);
    const yy = y > 0.55 ? 0.55 + (y - 0.55) * 0.25 : y;
    p.setXYZ(i, x * j * 0.5 * w, (yy * j - 0.666) * 0.5 * h * 1.2 + 0.0, z * j * 0.5 * d);
    c.copy(a).lerp(b, rnd(seed * 3 + i * 0.77) * 0.7); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------------- the HUD
const CSS = `
.lv-chip { position: absolute; left: 50%; top: calc(var(--u, 10px) * 6.9); translate: -50% 0; display: flex; align-items: center; gap: .45em; padding: .28em .75em .28em .35em;
  border-radius: 999px; background: rgba(14, 11, 22, .86); color: #fff; font: 900 calc(var(--u, 10px) * 1.05) / 1 'Rubik', sans-serif; letter-spacing: .08em; white-space: nowrap;
  box-shadow: 0 0 0 2px rgba(255,255,255,.85); pointer-events: none; transition: box-shadow .2s, background .2s; z-index: 3; }
.lv-chip svg { width: 1.7em; height: 1.7em; color: #c8102e; }
.lv-tube { position: relative; width: .7em; height: 2.1em; border-radius: .35em; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.55); overflow: hidden; }
.lv-tube i { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: linear-gradient(#ff4a3a, #a3121a); transition: height .15s linear; }
.lv-tube b { position: absolute; left: -1px; right: -1px; top: 2px; height: 2px; background: #f4f1ea; }
.lv-txt b { color: #fff; } .lv-txt span { color: rgba(255,255,255,.75); font-weight: 700; margin-left: .3em; }
.lv-arr { font-size: 1.15em; width: .9em; text-align: center; }
.lv-chip.is-up .lv-arr, .lv-chip.is-up svg { color: #ff3b2f; } .lv-chip.is-down .lv-arr { color: #cfd6e6; } .lv-chip.is-down svg { color: #cfd6e6; }
.lv-chip.is-warn { animation: lv-pulse .5s ease-in-out infinite alternate; }
.lv-chip.is-warn.is-up { background: rgba(120, 10, 16, .92); box-shadow: 0 0 0 2px #fff, 0 0 18px 4px rgba(255, 40, 30, .55); }
.lv-chip.is-warn.is-down { background: rgba(40, 46, 60, .92); box-shadow: 0 0 0 2px #fff, 0 0 18px 4px rgba(220, 230, 255, .45); }
@keyframes lv-pulse { from { scale: 1; } to { scale: 1.07; } }
.lv-mine { position: absolute; left: 50%; bottom: calc(var(--u, 10px) * 15.5); translate: -50% 0; display: none; align-items: center; gap: .55em; padding: .45em 1em .45em .6em; border-radius: 999px;
  background: rgba(150, 12, 20, .92); color: #fff; font: 900 calc(var(--u, 10px) * 1.25) / 1 'Rubik', sans-serif; letter-spacing: .08em; box-shadow: 0 0 0 3px #fff, 0 0 22px rgba(255, 40, 30, .6); pointer-events: none; z-index: 4;
  animation: lv-pulse .45s ease-in-out infinite alternate; }
.lv-mine.is-on { display: flex; } .lv-mine.is-stone { background: rgba(40, 46, 60, .94); box-shadow: 0 0 0 3px #fff, 0 0 22px rgba(220, 230, 255, .5); }
.lv-mine i { display: inline-block; font-style: normal; font-size: 1.4em; line-height: 1; }
.lv-mine span { opacity: .85; }`;
let cssOn = false;
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export class LavaHud {
  constructor(R) {
    this.R = R;
    const host = G.hud?.el;
    if (!host || typeof document === 'undefined') { this.el = null; return; }
    if (!cssOn) { const st = document.createElement('style'); st.id = 'lava-hud-css'; st.textContent = CSS; document.head.appendChild(st); cssOn = true; }
    this.el = document.createElement('div'); this.el.className = 'lv-chip'; this.el.dataset.lava = '1';
    this.el.innerHTML = `${LAVA_ICON}<span class="lv-tube"><i></i><b></b></span><span class="lv-txt"><b></b><span></span></span><span class="lv-arr"></span>`;
    this.fill = this.el.querySelector('.lv-tube i'); this.k = this.el.querySelector('.lv-txt b'); this.v = this.el.querySelector('.lv-txt span'); this.arr = this.el.querySelector('.lv-arr');
    this.mine = document.createElement('div'); this.mine.className = 'lv-mine';
    this.mine.innerHTML = '<i>➜</i><b></b><span></span>';
    this.mArrow = this.mine.querySelector('i'); this.mText = this.mine.querySelector('b'); this.mDist = this.mine.querySelector('span');
    host.appendChild(this.el); host.appendChild(this.mine);
    this.last = '';
  }
  update(o, a) {
    if (!this.el) return;
    const st = o, warn = o.warn, up = warn ? o.to === 'high' : o.dir > 0, down = warn ? o.to === 'low' : o.dir < 0;
    let k, v, arr = '';
    if (warn && up) { k = '▲ SURGE'; v = String(Math.max(1, Math.ceil(o.inS))); arr = '▲'; }
    else if (warn && down) { k = '▼ EBB'; v = String(Math.max(1, Math.ceil(o.inS))); arr = '▼'; }
    else if (st.phase === 'rise') { k = 'RISING'; v = ''; arr = '▲'; }
    else if (st.phase === 'fall') { k = 'FALLING'; v = ''; arr = '▼'; }
    else if (st.phase === 'high') { k = 'HIGH'; v = o.inS != null ? '· falls ' + fmt(o.inS) : '· holds'; }
    else { k = 'LOW'; v = o.inS != null ? '· surge ' + fmt(o.inS) : this.R.otAt < Infinity ? '· holds' : ''; }
    const key = k + v + arr + (warn ? 'w' : '') + (up ? 'u' : down ? 'd' : '');
    if (key !== this.last) {
      this.last = key;
      this.k.textContent = k; this.v.textContent = v; this.arr.textContent = arr;
      this.el.classList.toggle('is-warn', !!warn); this.el.classList.toggle('is-up', !!up); this.el.classList.toggle('is-down', !!down);
    }
    this.fill.style.height = (o.e * 100).toFixed(1) + '%';
    // the local player's own line, its arrow toward the way out (relative to the camera's heading)
    const m = o.mine;
    if (m && a) {
      this.mine.classList.add('is-on'); this.mine.classList.toggle('is-stone', m.text.includes('STONES'));
      if (this.mText.textContent !== m.text) this.mText.textContent = m.text;
      this.mDist.textContent = '→ ' + m.m + ' m';
      if (m.to && G.camera) {
        const c = G.camera, f = new THREE.Vector3(); c.getWorldDirection(f);
        const cy = Math.atan2(f.x, f.z), ty = Math.atan2(m.to[0] - a.pos.x, m.to[1] - a.pos.z);
        let d = ty - cy; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        this.mArrow.style.transform = `rotate(${(-d * 180) / Math.PI - 90}deg)`;
      }
    } else this.mine.classList.remove('is-on');
  }
  dispose() { this.el?.remove(); this.mine?.remove(); this.el = null; }
}

// ---------------------------------------------------------------------------------------------------- the minimap
// the lava fill wherever the floor is under the surface (a cached raster per 0.1 m of L), a pulsing red hatch over
// everything below the high mark from a rise's warning until it is up, the stones (dark tiles, blinking in the fall
// warning) and the Organ clusters (hexes, ▲ when risen)
export function drawLavaMap(R, c, mm, tc, s, t) {
  const W = R.W, st = R.st, w = mm.w, h = mm.h;
  const key = Math.round(st.y * 10) + ':' + (mm.flip ? 1 : 0) + ':' + w + 'x' + h + ':' + (mm.baseKey ?? '');
  const C = R._map || (R._map = {});
  if (!mm.hgt) return;
  if (C.key !== key) {
    C.key = key;
    if (!C.fill || C.fill.width !== w || C.fill.height !== h) { C.fill = document.createElement('canvas'); C.fill.width = w; C.fill.height = h; C.hatch = document.createElement('canvas'); C.hatch.width = w; C.hatch.height = h; C.hk = null; }
    const fx = C.fill.getContext('2d'), img = fx.createImageData(w, h), D = img.data, H = mm.hgt, y = st.y;
    for (let py = 0; py < h; py++) {
      const z = mm._worldZ(py + 0.5);
      for (let px = 0; px < w; px++) {
        const x = mm._worldX(px + 0.5);
        if (!W.inRegion(x, z)) continue;
        const i = py * w + px, gh = H[i];
        if (gh > y + 0.05 && gh > -50) continue;
        const n = (Math.sin(x * 1.7 + z * 0.9) + Math.sin(x * 0.6 - z * 1.9)) * 0.25 + 0.5;
        D[i * 4] = 120 + 70 * n; D[i * 4 + 1] = 18 + 22 * n; D[i * 4 + 2] = 16; D[i * 4 + 3] = 235;
      }
    }
    fx.putImageData(img, 0, 0);
    const hk = (mm.flip ? 1 : 0) + ':' + w + 'x' + h + ':' + (mm.baseKey ?? '');
    if (C.hk !== hk) {
      C.hk = hk;
      const hx = C.hatch.getContext('2d'), im2 = hx.createImageData(w, h), E = im2.data;
      for (let py = 0; py < h; py++) { const z = mm._worldZ(py + 0.5); for (let px = 0; px < w; px++) { const x = mm._worldX(px + 0.5); if (!W.inRegion(x, z)) continue; const i = py * w + px, gh = H[i]; if (gh < -50 || gh >= W.high) continue; if ((px + py) % 6 < 2) { E[i * 4] = 255; E[i * 4 + 1] = 60; E[i * 4 + 2] = 40; E[i * 4 + 3] = 255; } } }
      hx.putImageData(im2, 0, 0);
    }
  }
  c.drawImage(C.fill, 0, 0);
  const hatchOn = (st.warn && st.next.to === 'high') || st.phase === 'rise';
  if (hatchOn) { c.globalAlpha = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 6)); c.drawImage(C.hatch, 0, 0); c.globalAlpha = 1; }
  // the riders
  const blinkStones = st.warn && st.next.to === 'low';
  for (const Rr of R.riders) {
    const r = Rr.r;
    if (r.sink) {
      if (!Rr.solid || (blinkStones && Math.sin(t * 10) < 0)) continue;
      const p = r.parts[0], q = partPose(r, p, 0, {});
      c.save(); mm.toCanvas(q.cx, q.cz, tc); c.translate(tc.x, tc.y); c.rotate(-q.yaw);
      c.fillStyle = '#2b2622'; c.strokeStyle = '#d9d2c6'; c.lineWidth = 1.2;
      c.fillRect(-p.hx * s, -p.hz * s, p.hx * 2 * s, p.hz * 2 * s); c.strokeRect(-p.hx * s, -p.hz * s, p.hx * 2 * s, p.hz * 2 * s);
      c.restore();
    } else if (r.shape === 'hex') {
      mm.toCanvas(r.x, r.z, tc);
      const up = (Rr.top - r.top0) / Math.max(0.01, r.top1 - r.top0);
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3, x = tc.x + Math.cos(a) * r.r * s * (mm.flip ? -1 : 1), y = tc.y + Math.sin(a) * r.r * s; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
      c.closePath(); c.fillStyle = up > 0.66 ? '#5d6168' : '#3f4247'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#e9e4d8'; c.stroke();
      if (up > 0.66 && r.look?.role === 'lookout') { c.fillStyle = '#ffffff'; c.font = `bold ${Math.max(8, s * 2.4)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('▲', tc.x, tc.y); }
    }
  }
}
