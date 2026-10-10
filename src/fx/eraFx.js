// Bluestone Junction's eras: the looks (src/game/eras.js drives them; the contract: tools/botlab/jobs/batch5/stages/
// bluestone/ENGINE.md §3.2 EraFx, §3.5 H8 / H8b / H12 / H13, §4.5).
//   • ERA_LEVEL_EXT: the level-shader extension (docs/STAGE-MODS.md "Level material"): each fragment's era (shared
//     ground by its side of the front, an era piece by its own flip), the per-era tint and re-skins (eras.remap) on the
//     bare surface only, the mural masks (eras.murals), the AO channel of that era, the dissolve at a piece's flip, the
//     sepia flicker on what is about to vanish, the white-gold pulse on what is new, and the front's band of light
//   • eraMaterial / eraDepthMaterial: era prop buckets and era meshes' shadows collapse the same way
//   • EraFx: the holograms of what appears, the clock-light curtain riding the front (in the spirit of the Practice
//     clear-ink wave, src/fx/inkWipeFx.js: brass with drifting Roman numerals in jump 1, pearl in jump 2), Tartar's
//     shake / receiver / dial and the beam from the dome, the clock rows' countdown hands, the kiosks' bell glyphs, the
//     light beads running out along the overhead wires, the front's ticking whoosh
//   • EraHud: the era chip under the clock (the names, a bar to the next jump, the small "TODAY in 20", the big
//     countdown with Tartar's phone); drawEraMap: the minimap outlines from the warning to done
// Every highlight is in the layout's neutral colours (eras.colors: white-gold appear / warm grey vanish), never a team
// ink hue (cyan, amber, orange, magenta).
import * as THREE from 'three';
import { G } from '../core/ctx.js';

// --------------------------------------------------------------------------------------------- the level shader (H8)
// uEra   = (from bit, to bit, front radius m (< 0: no jump running), dissolve width m)
// uEraW  = (next / last jump's from bit, to bit, warning flicker 0..1, done pulse 0..1)
const LV_VPARS = /* glsl */`
attribute vec2 aEra;
uniform vec4 uEra;
varying vec2 vEra;
varying float vEraK;
float eraHasV(float m, float b) { return mod(floor(m / b + 0.01), 2.0); }`;
const LV_VMAIN = /* glsl */`
{
  float em = aEra.x < 0.5 ? 7.0 : aEra.x;
  vEra = vec2(em, aEra.y);
  vEraK = 1.0;
  if (em < 6.5) {
    float ek = uEra.z < 0.0 ? 0.0 : clamp((uEra.z - aEra.y) / max(uEra.w, 0.01) + 0.5, 0.0, 1.0);
    vEraK = mix(eraHasV(em, uEra.x), eraHasV(em, uEra.y), ek);
    if (vEraK < 0.001) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);   // absent: collapsed behind the far plane
  }
}`;
const LV_FPARS = /* glsl */`
uniform vec4 uEra;
uniform vec4 uEraW;
uniform vec4 uEraTint[3];
uniform vec4 uEraRemap[4];
uniform float uMurEra[12];
uniform vec3 uEraColA;
uniform vec3 uEraColV;
uniform float uEraT;
varying vec2 vEra;
varying float vEraK;
vec3 eraOneHot = vec3(1.0, 0.0, 0.0);
float eraHasF(float m, float b) { return mod(floor(m / b + 0.01), 2.0); }
// the era bit of this fragment: shared ground by its side of the front, an era piece by its own flip (at its group's r_g)
float eraBitHere() {
  if (vEra.x > 6.5) return (uEra.z >= 0.0 && length(vWPos.xz) < uEra.z) ? uEra.y : uEra.x;
  return uEra.z >= vEra.y ? uEra.y : uEra.x;
}`;
const LV_FMURAL = /* glsl */`
    mc.a *= eraHasF(uMurEra[mi], eraBitHere());`;
const LV_FBASE = /* glsl */`
  {
    float eb = eraBitHere();
    int ei = eb > 3.5 ? 2 : (eb > 1.5 ? 1 : 0);
    eraOneHot = vec3(ei == 0 ? 1.0 : 0.0, ei == 1 ? 1.0 : 0.0, ei == 2 ? 1.0 : 0.0);
#ifdef USE_TEXLIB
    // re-skin (eras.remap): the bare surface sampled again from this era's texlib layer (the ink on it stays)
    for (int r = 0; r < 4; r++) {
      vec4 rm = uEraRemap[r];
      if (rm.x < 0.0 || abs(pattern - rm.x) > 0.5) continue;
      float np = ei == 0 ? rm.y : (ei == 1 ? rm.z : rm.w);
      if (np < 0.0 || abs(np - rm.x) < 0.5) break;
      int rp = int(np + 0.5);
      if (abs(vWNorm.y) < 0.5) rp = int(uTLt[rp].z + 0.5); else if (vWNorm.y > 0.5) rp = int(uTLt[rp].w + 0.5);
      vec4 rtl = uTL[rp]; vec4 rtt = uTLt[rp];
      TexlibSample rts = texlibSample(tAlbedo, tNormal, tOrm, fu * rtl.y, rtl.x, int(rtl.z), int(rtl.w));
      base = rtt.x > 1.5 ? rts.albedo.rgb + diffuseColor.rgb * rts.albedo.a * 1.25 : (rtt.x > 0.5 ? diffuseColor.rgb * rts.albedo.rgb * 1.25 : rts.albedo.rgb);
      base *= texlibMacro(vWPos.xz + vWPos.y * 0.7);
      base *= mix(1.0, rts.orm.r, 0.85);
      gBaseRough = rts.orm.g;
      gTexN = rts.normal; gTexORM = rts.orm; gTexStr = rtt.y; gTexAlpha = rts.albedo.a;
      break;
    }
#endif
    // the era's tint on the bare surface (the 1880s: warm and a little desaturated), never on the ink
    vec4 etn = uEraTint[ei];
    float elum = dot(base, vec3(0.299, 0.587, 0.114));
    base = mix(base, vec3(elum), etn.w) * etn.rgb;
    if (vEra.x < 6.5) {
      float hf = eraHasF(vEra.x, uEraW.x), ht = eraHasF(vEra.x, uEraW.y);
      // the warning: what is about to vanish flickers in a sepia film grain (up to 15 %)
      if (uEraW.z > 0.0 && hf > 0.5 && ht < 0.5) {
        float fl = step(0.45, fract(sin(floor(uEraT * 9.0) * 12.9898 + dot(floor(vWPos * 3.0), vec3(1.7, 3.1, 2.3))) * 43758.5453));
        base = mix(base, vec3(elum) * vec3(1.12, 0.96, 0.74), uEraW.z * (0.08 + 0.07 * fl));
      }
      // done: what is new pulses white-gold for 4 s
      if (uEraW.w > 0.0 && ht > 0.5 && hf < 0.5) base = mix(base, uEraColA, uEraW.w * (0.3 + 0.2 * sin(uEraT * 7.0)));
    }
    // the dissolve as the front reaches a piece (0.3 s)
    if (vEraK < 0.999) {
      float en = fract(sin(dot(floor(vWPos * 5.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      if (en > vEraK) discard;
    }
  }`;
const LV_FFINAL = /* glsl */`
if (uEra.z >= 0.0) {
  // the clock-light front: a white-gold line with a soft glow, ticks of light running round it like a dial's minutes
  float ed = length(vWPos.xz) - uEra.z;
  float ecore = exp(-ed * ed * 9.0), eband = exp(-ed * ed * 0.3);
  float eang = atan(vWPos.z, vWPos.x);
  float etick = step(0.82, fract(eang * 9.549 + 0.5)) * exp(-ed * ed * 2.0);
  float esh = 0.6 + 0.4 * sin(vWPos.y * 4.0 + length(vWPos.xz) * 1.3 - uEraT * 9.0);
  outgoingLight = mix(outgoingLight, outgoingLight * 0.85 + uEraColA * 0.2, clamp(eband * 0.6, 0.0, 1.0));
  outgoingLight += uEraColA * (ecore * 2.0 + eband * 0.45 * esh + etick * 1.2);
}`;
export function eraLevelExt(U, grate = false) {
  return {
    key: 'eras', uniforms: U, defines: { ERAS: 1 },
    vertPars: LV_VPARS, vertMain: LV_VMAIN, fragPars: LV_FPARS, fragMural: LV_FMURAL, fragBase: LV_FBASE, fragFinal: grate ? '' : LV_FFINAL,
    aoSample: 'dot(texture2D(uLight, vLightUv).rgb, eraOneHot)',
  };
}

// --------------------------------------------------------------------------------------------- props and shadows (H12)
const PR_VPARS = (attr) => /* glsl */`
attribute vec2 ${attr};
uniform vec4 uEra;
varying float vEraK;
varying float vEraM;
varying vec3 vEraWP;
float eraHasV(float m, float b) { return mod(floor(m / b + 0.01), 2.0); }`;
const PR_VMAIN = (attr, depth) => /* glsl */`
{
  float em = ${attr}.x < 0.5 ? 7.0 : ${attr}.x;
  vEraM = em; vEraK = 1.0;
  vec4 ewp = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  ewp = instanceMatrix * ewp;
#endif
  vEraWP = (modelMatrix * ewp).xyz;
  if (em < 6.5) {
    float ek = uEra.z < 0.0 ? 0.0 : clamp((uEra.z - ${attr}.y) / max(uEra.w, 0.01) + 0.5, 0.0, 1.0);
    vEraK = mix(eraHasV(em, uEra.x), eraHasV(em, uEra.y), ek);
    if (vEraK < ${depth ? '0.5' : '0.001'}) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  }
}`;
const PR_FPARS = /* glsl */`
uniform vec4 uEraW;
uniform vec3 uEraColA;
uniform float uEraT;
varying float vEraK;
varying float vEraM;
varying vec3 vEraWP;
float eraHasF(float m, float b) { return mod(floor(m / b + 0.01), 2.0); }`;
const PR_FCOLOR = /* glsl */`
if (vEraM < 6.5) {
  if (vEraK < 0.999) { float en = fract(sin(dot(floor(vEraWP * 5.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); if (en > vEraK) discard; }
  float hf = eraHasF(vEraM, uEraW.x), ht = eraHasF(vEraM, uEraW.y);
  float elum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  if (uEraW.z > 0.0 && hf > 0.5 && ht < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(elum) * vec3(1.12, 0.96, 0.74), uEraW.z * (0.08 + 0.07 * step(0.5, fract(uEraT * 9.0 + vEraWP.x))));
  if (uEraW.w > 0.0 && ht > 0.5 && hf < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uEraColA, uEraW.w * (0.3 + 0.2 * sin(uEraT * 7.0)));
}`;
// a clone of a prop material whose parts carry `attr` = (era mask, r_g): absent → collapsed; dissolving at the flip
export function eraMaterial(base, U, attr = 'aTag') {
  const m = base.clone();
  const prev = base.onBeforeCompile, key0 = base.customProgramCacheKey ? base.customProgramCacheKey() : '';
  m.onBeforeCompile = (sh, r) => {
    if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(m, sh, r);
    for (const k of ['uEra', 'uEraW', 'uEraColA', 'uEraT']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${PR_VPARS(attr)}`).replace('#include <project_vertex>', `#include <project_vertex>\n${PR_VMAIN(attr, false)}`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${PR_FPARS}`).replace('#include <color_fragment>', `#include <color_fragment>\n${PR_FCOLOR}`);
  };
  m.customProgramCacheKey = () => key0 + '|era-' + attr;
  m.userData.eraOf = base;
  return m;
}
// the shadow (depth) pass of an era mesh: an absent piece casts nothing
const DEPTH = new Map();
export function eraDepthMaterial(U, attr = 'aEra') {
  const k = attr;
  if (DEPTH.has(k) && DEPTH.get(k).U === U) return DEPTH.get(k).m;
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uEra = U.uEra;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${PR_VPARS(attr)}`).replace('#include <project_vertex>', `#include <project_vertex>\n${PR_VMAIN(attr, true)}`);
  };
  m.customProgramCacheKey = () => 'era-depth-' + attr;
  DEPTH.set(k, { U, m });
  return m;
}

// --------------------------------------------------------------------------------------------- the backdrop sets (H13)
// A set's meshes clip by distance from the dome during the horizon run: the outgoing set inside the radius goes, the
// incoming one shows inside it (uEraFar = from bit, to bit, radius, on; uEraSet = this set's bit)
export function patchSetClip(group, U, bit) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    for (const mat of [].concat(o.material)) {
      if (!mat || mat.userData.eraSet) continue;
      mat.userData.eraSet = bit;
      const prev = mat.onBeforeCompile, key0 = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
      const uSet = { value: bit };
      mat.onBeforeCompile = (sh, r) => {
        if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(mat, sh, r);
        sh.uniforms.uEraFar = U.uEraFar; sh.uniforms.uEraSet = uSet;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vEraSW;').replace('#include <project_vertex>', `#include <project_vertex>
{ vec4 ew = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  ew = instanceMatrix * ew;
#endif
  vEraSW = (modelMatrix * ew).xyz; }`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uEraFar;\nuniform float uEraSet;\nvarying vec3 vEraSW;').replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (uEraFar.w > 0.5) { float er = length(vEraSW.xz); if (abs(uEraSet - uEraFar.x) < 0.5 && er < uEraFar.z) discard; if (abs(uEraSet - uEraFar.y) < 0.5 && er > uEraFar.z) discard; }`);
      };
      mat.customProgramCacheKey = () => key0 + '|eraset';
      mat.needsUpdate = true;
    }
  });
}

// --------------------------------------------------------------------------------------------- the hologram / curtain shaders
const HOLO_VS = /* glsl */`
attribute float aR;
uniform float uFront;
uniform float uD;
varying float vGone;
varying vec3 vW;
void main() {
  vGone = uFront >= 0.0 && uFront > aR - uD * 0.5 ? 1.0 : 0.0;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HOLO_FS = /* glsl */`
precision highp float;
uniform vec3 uCol;
uniform float uA;
uniform float uT;
varying float vGone;
varying vec3 vW;
void main() {
  if (vGone > 0.5) discard;
  float scan = 0.75 + 0.25 * sin(vW.y * 9.0 - uT * 6.0);
  float a = uA * scan;
  gl_FragColor = vec4(uCol * a, a);
}`;
const CURTAIN_VS = /* glsl */`
varying vec3 vW;
varying float vH;
void main() { vH = position.y; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// the curtain of clock-light standing up out of the front: brass at its foot (jump 1; pearl in jump 2), a white crest,
// Roman numerals and gear wheels drifting up through it (a canvas strip), premultiplied
const CURTAIN_FS = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uA;
uniform vec3 uFoot;
uniform vec3 uBody;
uniform sampler2D uGlyph;
varying vec3 vW;
varying float vH;
void main() {
  float ang = atan(vW.z, vW.x);
  float top = 0.78 + 0.1 * sin(ang * 6.0 + uTime * 3.0) + 0.05 * sin(ang * 19.0 - uTime * 7.0);
  float body = smoothstep(top, top - 0.35, vH);
  float crest = exp(-pow((vH - top + 0.03) / 0.05, 2.0));
  float foot = exp(-vH * 10.0);
  float g = texture2D(uGlyph, vec2(ang / 6.2831853 * 6.0, vH * 1.4 - uTime * 0.22)).a;
  float streak = 0.6 + 0.4 * sin(ang * 70.0 + vH * 12.0 - uTime * 10.0);
  vec3 col = mix(uFoot, uBody, smoothstep(0.0, 0.5, vH));
  float a = uA * (body * (0.12 + 0.14 * streak + 0.55 * g) + crest * 0.8 + foot * 0.75);
  a = clamp(a, 0.0, 0.9);
  gl_FragColor = vec4(mix(col, vec3(1.0, 0.98, 0.92), crest * 0.6 + g * 0.35) * a, a);
}`;
function glyphTexture() {
  if (typeof document === 'undefined') { const t = new THREE.DataTexture(new Uint8Array(4), 1, 1); t.needsUpdate = true; return t; }
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 1024, 256);
  x.fillStyle = '#fff'; x.strokeStyle = '#fff';
  x.font = '700 64px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const N = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) { x.globalAlpha = 0.9; x.fillText(N[i], 42 + i * 85, i % 2 ? 70 : 190); }
  // gear wheels between them
  const gear = (cx, cy, r, n) => {
    x.globalAlpha = 0.55; x.lineWidth = 5; x.beginPath();
    for (let k = 0; k <= n * 2; k++) { const a = (k / (n * 2)) * Math.PI * 2, rr = k % 2 ? r : r * 0.82; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath(); x.stroke(); x.beginPath(); x.arc(cx, cy, r * 0.3, 0, Math.PI * 2); x.stroke();
  };
  for (let i = 0; i < 6; i++) gear(85 + i * 170, i % 2 ? 190 : 70, 30, 10);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function bellTexture() {
  if (typeof document === 'undefined') { const t = new THREE.DataTexture(new Uint8Array(4), 1, 1); t.needsUpdate = true; return t; }
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(30,26,20,.82)'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#f4e9c8'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#f4e9c8';
  x.beginPath(); x.moveTo(36, 84); x.quadraticCurveTo(40, 36, 64, 34); x.quadraticCurveTo(88, 36, 92, 84); x.closePath(); x.fill();
  x.fillRect(30, 82, 68, 8); x.beginPath(); x.arc(64, 96, 8, 0, Math.PI * 2); x.fill();
  for (const s of [-1, 1]) { x.beginPath(); x.arc(64 + s * 44, 50, 10, s < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, s < 0 ? Math.PI * 1.4 : Math.PI * 0.4); x.stroke(); }
  return new THREE.CanvasTexture(c);
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
const BOX_EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const BOX_TRIS = [[0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5], [0, 4, 5], [0, 5, 1], [2, 3, 7], [2, 7, 6], [0, 2, 6], [0, 6, 4], [1, 5, 7], [1, 7, 3]];

// --------------------------------------------------------------------------------------------- EraFx
export class EraFx {
  /** W = the EraWorld; o = afterMeshes' { scene, props } */
  constructor(W, o) {
    this.W = W; this.scene = o.scene; this.E = W.E;
    this.colA = new THREE.Color(W.E.colors?.appear || '#f4e9c8');
    this.colV = new THREE.Color(W.E.colors?.vanish || '#a9a49a');
    this.group = new THREE.Group(); this.group.name = 'EraFx';
    this.scene.add(this.group);
    this._buildTartar(o.props);
    this._buildHands();
    this._buildPhones();
    this._buildPulses();
    this.holo = null; this.curtain = null;
    this.stats = { holoPieces: 0, rings: 0 };
  }

  // ---- Tartar (a shared prop, animated): body + dials + handset parts hung from the drum's ceiling by his cord
  _buildTartar(kit) {
    const T = this.E.tartar || { type: 'bluestone_tartar', pos: [0, 5.4, 0] };
    this.tartar = new THREE.Group(); this.tartar.name = 'Tartar';
    this.tartar.position.set(0, 8.2, 0);   // the pivot: where the cord meets the body's top
    const part = (p) => { if (!kit || !kit.buildPart) return new THREE.Group(); const g = kit.buildPart(T.type, { part: p }); g.position.set(0, -8.2, 0); return g; };
    this.tBody = part('body'); this.tDial = new THREE.Group(); this.tHand = new THREE.Group();
    const dial = part('dial'); dial.position.set(0, 0, 0);
    this.tDial.position.set(0, 6.6 - 8.2, 0); dial.position.set(0, -6.6, 0); this.tDial.add(dial);
    const hand = part('handset'); this.tHand.add(hand);
    this.tartar.add(this.tBody, this.tDial, this.tHand);
    this.group.add(this.tartar);
    // the beam from the dome's crown to the concourse (J − 1 … J + 0.6)
    const bm = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uCol: { value: this.colA } }, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'precision highp float; uniform float uA; uniform vec3 uCol; varying vec2 vU; void main() { float e = 1.0 - abs(vU.x * 2.0 - 1.0); gl_FragColor = vec4(uCol * uA * e * e, 1.0); }' });
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 17, 16, 1, true), bm);
    this.beam.position.set(0, 1.3 + 8.5, 0); this.beam.visible = false; this.beam.frustumCulled = false; this.beam.renderOrder = 14;
    this.group.add(this.beam);
  }
  // ---- the clock rows' hands (one instanced mesh: 5 faces × 2 sides × 2 rows, an hour and a minute hand each)
  _buildHands() {
    const C = (this.E.clocks || [])[0];
    this.hands = null; this.faces = [];
    if (!C) return;
    const n = C.faces || 5, xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 1.24);
    for (const sgn of [1, -1]) for (const x of xs) for (const side of [-1, 1]) {
      // Alpha's row at C.pos (z < 0), Bravo's its 180° twin; each face looks out along ±z
      this.faces.push({ x: sgn * x, y: C.pos[1], z: sgn * (C.pos[2] + 0.3) + side * 0.37, n: side, centre: Math.abs(x) < 0.01 });
    }
    const geo = new THREE.BoxGeometry(0.06, 1, 0.025); geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    this.hands = new THREE.InstancedMesh(geo, mat, this.faces.length * 2);
    this.hands.name = 'EraClockHands'; this.hands.frustumCulled = false;
    this.faces.forEach((f, i) => { for (let k = 0; k < 2; k++) this.hands.setColorAt(i * 2 + k, _c.set(f.centre ? '#d9b257' : '#2a2a28')); });
    this.group.add(this.hands);
    this._setHands(10 / 60 / 12, 2 / 12, 0); this._handsIdle = true;
  }
  // hour angle and minute angle as fractions of a turn (0 = twelve)
  _setHands(hr, mn, gold = 0) {
    if (!this.hands) return;
    this.faces.forEach((f, i) => {
      for (let k = 0; k < 2; k++) {
        const a = (k ? mn : hr) * Math.PI * 2, L = k ? 0.42 : 0.28;
        _q.setFromAxisAngle(_v.set(0, 0, 1), -a * f.n);
        _m4.compose(_v.set(f.x, f.y, f.z), _q, _s.set(1, L, 1));
        this.hands.setMatrixAt(i * 2 + k, _m4);
        if (f.centre) this.hands.setColorAt(i * 2 + k, _c.set('#2a2a28').lerp(_c.clone().set('#f2cf6a'), gold));
      }
    });
    this.hands.instanceMatrix.needsUpdate = true;
    if (this.hands.instanceColor) this.hands.instanceColor.needsUpdate = true;
  }
  // ---- the kiosks: a bell glyph over each when it rings
  _buildPhones() {
    const P = this.E.phones || [];
    this.phones = [];
    const tex = bellTexture();
    for (const sgn of [1, -1]) for (const p of P) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
      sp.position.set(sgn * p[0], p[1] + 2.4, sgn * p[2]); sp.scale.setScalar(1.1); sp.visible = false; sp.renderOrder = 16;
      this.group.add(sp); this.phones.push({ sp, pos: new THREE.Vector3(sgn * p[0], p[1] + 1.0, sgn * p[2]) });
    }
  }
  // ---- the light beads along the overhead wires (one instanced mesh)
  _buildPulses() {
    const L = this.E.pulses || [];
    this.wires = [];
    for (const sgn of [1, -1]) for (const line of L.slice(0, 8)) {
      const pts = line.map(([x, y, z]) => new THREE.Vector3(sgn * x, y, sgn * z)), seg = [];
      let len = 0; for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); len += d; }
      this.wires.push({ pts, seg, len });
    }
    this.beadsPer = 6;
    const n = this.wires.length * this.beadsPer;
    this.beads = n ? new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: this.colA, toneMapped: false }), n) : null;
    if (this.beads) { this.beads.name = 'EraWireBeads'; this.beads.frustumCulled = false; this.beads.visible = false; this.group.add(this.beads); }
  }
  _wireAt(w, s, out) {
    let d = s * w.len;
    for (let i = 0; i < w.seg.length; i++) { if (d <= w.seg[i] || i === w.seg.length - 1) return out.copy(w.pts[i]).lerp(w.pts[i + 1], Math.min(1, d / w.seg[i])); d -= w.seg[i]; }
    return out.copy(w.pts[w.pts.length - 1]);
  }

  // ---- the jump's holograms: wireframe boxes of every appearing block (and faint faces), hidden as the front reaches each
  setJump(J) {
    this._disposeHolo();
    if (!J) return;
    const L = this.W.level, pl = [], pf = [], rl = [], rf = [];
    for (const id of J.appear) {
      const b = L.blocks[id], g = this.W.groups[b.eraG];
      const c = [];
      for (let i = 0; i < 8; i++) c.push(_v.copy(b.center).addScaledVector(b.axes[0], (i & 1 ? 1 : -1) * (b.half.x + 0.02)).addScaledVector(b.axes[1], (i & 2 ? 1 : -1) * (b.half.y + 0.02)).addScaledVector(b.axes[2], (i & 4 ? 1 : -1) * (b.half.z + 0.02)).toArray());
      for (const [a, d] of BOX_EDGES) { pl.push(...c[a], ...c[d]); rl.push(g.rg, g.rg); }
      for (const t of BOX_TRIS) for (const k of t) { pf.push(...c[k]); rf.push(g.rg); }
    }
    this.stats.holoPieces = J.appear.length;
    if (!pl.length) return;
    const mk = (pos, r, lines) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
      const mat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: this.colA }, uA: { value: 0 }, uT: { value: 0 }, uFront: { value: -1 }, uD: { value: this.W.dissolve } }, vertexShader: HOLO_VS, fragmentShader: HOLO_FS,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
      const m = lines ? new THREE.LineSegments(geo, mat) : new THREE.Mesh(geo, mat);
      m.frustumCulled = false; m.renderOrder = 13; m.visible = false; m.name = lines ? 'EraHoloLines' : 'EraHoloFaces';
      m.onBeforeRender = (r, s, c, g) => { g.drawRange.count = s.overrideMaterial ? 0 : Infinity; };   // (out of the GTAO pass)
      this.group.add(m);
      return m;
    };
    this.holo = [mk(pl, rl, true), mk(pf, rf, false)];
  }
  _disposeHolo() { for (const m of this.holo || []) { this.group.remove(m); m.geometry.dispose(); m.material.dispose(); } this.holo = null; }

  _curtainOn(jump) {
    if (!this.curtain) {
      const geo = new THREE.CylinderGeometry(1, 1, 1, 180, 1, true); geo.translate(0, 0.5, 0);
      this._glyph = glyphTexture();
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uFoot: { value: new THREE.Color() }, uBody: { value: new THREE.Color() }, uGlyph: { value: this._glyph } },
        vertexShader: CURTAIN_VS, fragmentShader: CURTAIN_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      this.curtain = new THREE.Mesh(geo, mat);
      this.curtain.frustumCulled = false; this.curtain.renderOrder = 15; this.curtain.name = 'EraCurtain';
      this.curtain.onBeforeRender = (r, s, c, g) => { g.drawRange.count = s.overrideMaterial ? 0 : Infinity; };
      this.group.add(this.curtain);
    }
    const U = this.curtain.material.uniforms, pearl = jump.to === 3 || jump.to < jump.from;
    U.uFoot.value.set(pearl ? '#e9ecf2' : '#c79a4e'); U.uBody.value.set(pearl ? '#f6f2ea' : '#f4e9c8');
    this.curtain.visible = true;
  }

  /** per frame from the match runtime: st = R's view of the clock ({ t, jump, phase, front, warnK, … }) */
  update(dt, st) {
    const t = st.t, J = st.jump, U = this.W.uniforms;
    U.uEraT.value = (G.time ?? performance.now() / 1000);
    // Tartar: shakes on each ring, lifts his receiver at the pickup, spins his dial into the jump
    const ring = st.ring || 0, pick = st.pickup || 0;
    this.tartar.rotation.z = 0.07 * ring * Math.sin(t * 46); this.tartar.rotation.x = 0.04 * ring * Math.sin(t * 39 + 1);
    this.tHand.position.set(0, 0.45 * pick, 0); this.tHand.rotation.z = 0.35 * pick;
    this.tDial.rotation.z += dt * (st.phase === 'jump' || pick > 0.5 ? 9 : 0);
    // the beam
    this.beam.visible = st.beam > 0.01; this.beam.material.uniforms.uA.value = st.beam;
    // the clock hands: idle at ten past twelve; from the pre-bell the minute hand counts down to twelve at J, spinning
    // from J − 5; the centre faces turn gold
    if (J && st.phase !== 'idle') {
      const to = J.at - t;
      if (to > 5) this._setHands((to / 60) % 1 * (1 / 12), (-to / 60) % 1, Math.min(1, (J.at - J.prebellAt - to) / 2));
      else this._setHands(((t * 2.3) % 1), ((t * 7.0) % 1), 1);
    } else if (this._handsIdle !== true) { this._setHands(10 / 60 / 12, 2 / 12, 0); this._handsIdle = true; }
    if (J && st.phase !== 'idle') this._handsIdle = false;
    // the kiosks' bell glyphs
    for (const p of this.phones) { p.sp.visible = ring > 0.05; if (p.sp.visible) { p.sp.position.y = p.pos.y + 1.4 + 0.12 * Math.sin(t * 30); p.sp.material.opacity = Math.min(1, ring * 1.6); } }
    // the wire beads (the warning)
    if (this.beads) {
      const on = st.phase === 'warn';
      this.beads.visible = on;
      if (on) {
        let k = 0;
        for (const w of this.wires) for (let i = 0; i < this.beadsPer; i++) {
          const s = ((t * 0.5 + i / this.beadsPer) % 1);
          this._wireAt(w, s, _v);
          _m4.compose(_v, _q.identity(), _s.setScalar(0.6 + 0.6 * Math.sin(Math.PI * s)));
          this.beads.setMatrixAt(k++, _m4);
        }
        this.beads.instanceMatrix.needsUpdate = true;
      }
    }
    // holograms: from the warning until each piece's flip, 25–45 % pulsing at 2 Hz
    if (this.holo) {
      const show = st.phase === 'warn' || st.phase === 'jump';
      for (const m of this.holo) {
        m.visible = show;
        const Uh = m.material.uniforms;
        Uh.uT.value = U.uEraT.value; Uh.uFront.value = st.phase === 'jump' ? st.front : -1;
        Uh.uA.value = (m.isLineSegments ? 0.35 + 0.1 * Math.sin(U.uEraT.value * Math.PI * 4) : 0.1 + 0.04 * Math.sin(U.uEraT.value * Math.PI * 4)) * Math.min(1, st.warnK * 3 + (st.phase === 'jump' ? 1 : 0));
      }
    }
    // the curtain riding the front (10 m tall)
    if (st.phase === 'jump' && J) {
      if (!this.curtain || !this.curtain.visible) this._curtainOn(J);
      const x = Math.min(1, st.front / this.W.reach);
      this.curtain.scale.set(Math.max(0.01, st.front), 10 * (0.8 + 0.2 * (1 - x)), Math.max(0.01, st.front));
      const Uc = this.curtain.material.uniforms;
      Uc.uTime.value = U.uEraT.value; Uc.uA.value = (0.55 + 0.45 * (1 - x)) * Math.min(1, (t - J.at) / 0.12) * (st.front > this.W.reach ? 0 : 1);
      this.curtain.visible = Uc.uA.value > 0.002;
    } else if (this.curtain) this.curtain.visible = false;
  }
  dispose() {
    this._disposeHolo();
    this.scene.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh || o.isLineSegments || o.isSprite) { o.geometry?.dispose?.(); if (o.material && !o.material._shared) o.material.dispose?.(); } });
    this._glyph?.dispose?.();
  }
}

// --------------------------------------------------------------------------------------------- the HUD chip (H15)
const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 9c0-3 3-5 7-5s7 2 7 5v1.5c0 .8-.7 1.5-1.5 1.5H16c-.8 0-1.5-.7-1.5-1.5V9.5c-1.6-.5-3.4-.5-5 0v1c0 .8-.7 1.5-1.5 1.5H6.5C5.7 12 5 11.3 5 10.5V9z"/><path fill="currentColor" d="M7 13.5h10l1.6 5.2c.3.9-.4 1.8-1.3 1.8H6.7c-.9 0-1.6-.9-1.3-1.8L7 13.5z"/><circle cx="12" cy="17" r="1.8" fill="#1d1a16"/></svg>';
const CSS = `
.er-chip { position: absolute; left: 50%; top: calc(var(--u, 10px) * 6.9); translate: -50% 0; display: flex; align-items: center; gap: .5em; padding: .3em .8em .3em .45em;
  border-radius: 999px; background: rgba(24, 21, 17, .86); color: #f4e9c8; font: 900 calc(var(--u, 10px) * 1.0) / 1 'Rubik', sans-serif; letter-spacing: .08em; white-space: nowrap;
  box-shadow: 0 0 0 2px rgba(244, 233, 200, .8); pointer-events: none; z-index: 3; transition: box-shadow .2s, background .2s; }
.er-chip.is-docked { position: relative; left: auto; top: auto; translate: none; margin-top: calc(var(--u, 10px) * .2); }
.iw-tw > .er-chip.is-docked { margin-top: calc(var(--u, 10px) * .8); }
.er-chip svg { width: 1.6em; height: 1.6em; color: #f4e9c8; }
.er-names b { color: rgba(169, 164, 154, .75); font-weight: 800; } .er-names b.is-on { color: #fff6dc; text-shadow: 0 0 .5em rgba(244, 233, 200, .7); }
.er-names i { color: rgba(169, 164, 154, .6); font-style: normal; margin: 0 .25em; }
.er-bar { position: relative; width: 4.2em; height: .36em; border-radius: .2em; background: rgba(169, 164, 154, .25); overflow: hidden; }
.er-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: linear-gradient(90deg, #a9a49a, #f4e9c8); }
.er-chip.is-final .er-bar { display: none; }
.er-next { color: #f4e9c8; font-weight: 800; opacity: .9; } .er-next:empty { display: none; }
.er-count { display: none; font-size: 1.9em; color: #fff6dc; min-width: 1.2em; text-align: center; text-shadow: 0 0 .4em rgba(244, 233, 200, .8); }
.er-chip.is-warn { background: rgba(58, 48, 30, .94); box-shadow: 0 0 0 2px #f4e9c8, 0 0 18px 4px rgba(244, 233, 200, .5); animation: er-pulse .5s ease-in-out infinite alternate; }
.er-chip.is-warn .er-count { display: inline-block; } .er-chip.is-warn svg { animation: er-ring .12s linear infinite alternate; }
.er-chip.is-jump { background: rgba(244, 233, 200, .95); color: #2a2418; } .er-chip.is-jump .er-names b.is-on { color: #2a2418; text-shadow: none; } .er-chip.is-jump svg { color: #2a2418; }
@keyframes er-pulse { from { scale: 1; } to { scale: 1.07; } }
@keyframes er-ring { from { rotate: -12deg; } to { rotate: 12deg; } }`;
let cssOn = false;
const DOCKS = { zones: 'zo', tower: 'tw' };
export class EraHud {
  constructor(R) {
    this.R = R;
    const host = G.hud?.el;
    if (!host || typeof document === 'undefined') { this.el = null; return; }
    if (!cssOn) { const st = document.createElement('style'); st.id = 'era-hud-css'; st.textContent = CSS; document.head.appendChild(st); cssOn = true; }
    const N = R.W.names;
    this.el = document.createElement('div'); this.el.className = 'er-chip'; this.el.dataset.eras = '1';
    this.el.innerHTML = `${PHONE_ICON}<span class="er-names">${N.map((n, i) => `<b data-e="${i + 1}">${n}</b>`).join('<i>·</i>')}</span><span class="er-bar"><i></i></span><span class="er-next"></span><b class="er-count"></b>`;
    this.names = [...this.el.querySelectorAll('.er-names b')]; this.bar = this.el.querySelector('.er-bar i'); this.next = this.el.querySelector('.er-next'); this.count = this.el.querySelector('.er-count');
    const dock = DOCKS[R.m?.mode] ? G.hud?.[DOCKS[R.m.mode]] : null;
    if (dock && dock.appendChild) { this.el.classList.add('is-docked'); dock.appendChild(this.el); } else host.appendChild(this.el);
    this.last = '';
  }
  // o = { era, phase, next: { from, to, at, inS } | null, prog (0..1 toward the next jump) }
  update(o) {
    if (!this.el) return;
    const N = this.R.W.names, nx = o.next;
    let next = '', count = '';
    if (nx && o.phase === 'prebell') next = `${N[nx.to - 1]} in ${Math.max(1, Math.ceil(nx.inS))}`;
    else if (nx && o.phase === 'warn') { next = `→ ${N[nx.to - 1]}`; count = String(Math.max(1, Math.ceil(nx.inS))); }
    else if (o.phase === 'jump') next = 'TIME JUMP!';
    const key = `${o.era}|${o.phase}|${next}|${count}|${nx ? 1 : 0}`;
    if (key !== this.last) {
      this.last = key;
      this.names.forEach((b, i) => b.classList.toggle('is-on', i + 1 === o.era));
      this.next.textContent = next; this.count.textContent = count;
      this.el.classList.toggle('is-warn', o.phase === 'warn'); this.el.classList.toggle('is-jump', o.phase === 'jump');
      this.el.classList.toggle('is-final', !nx && o.phase !== 'jump');
    }
    this.bar.style.width = ((o.prog || 0) * 100).toFixed(1) + '%';
  }
  get text() { return this.el ? this.el.textContent : ''; }
  dispose() { this.el?.remove(); this.el = null; }
}

// --------------------------------------------------------------------------------------------- the minimap (H14)
// From the warning to done: appearing pieces as white-gold dashes, vanishing ones as warm-grey hatching
export function drawEraMap(R, c, mm, t) {
  const L = R.outlines();
  if (!L.length) return;
  const C = R.W.E.colors || {}, tc = { x: 0, y: 0 }, pulse = 0.65 + 0.35 * Math.sin(t * Math.PI * 4);
  c.save();
  for (const o of L) {
    const ca = Math.cos(o.yaw), sa = Math.sin(o.yaw), pts = [];
    for (const [i, k] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { mm.toCanvas(o.x + ca * o.hx * i + sa * o.hz * k, o.z - sa * o.hx * i + ca * o.hz * k, tc); pts.push([tc.x, tc.y]); }
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    if (o.appear) {
      c.globalAlpha = 0.95 * pulse; c.strokeStyle = C.appear || '#f4e9c8'; c.lineWidth = 2; c.setLineDash([4, 3]); c.stroke();
      c.globalAlpha = 0.22 * pulse; c.fillStyle = C.appear || '#f4e9c8'; c.fill();
    } else {
      c.save(); c.clip();
      c.globalAlpha = 0.9 * pulse; c.strokeStyle = C.vanish || '#a9a49a'; c.lineWidth = 1.6; c.setLineDash([]);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      c.beginPath(); for (let s = x0 - (y1 - y0); s < x1; s += 4) { c.moveTo(s, y1); c.lineTo(s + (y1 - y0), y0); } c.stroke();
      c.restore();
      c.globalAlpha = 0.9 * pulse; c.strokeStyle = C.vanish || '#a9a49a'; c.lineWidth = 1.2; c.setLineDash([]); c.stroke();
    }
  }
  c.restore();
}
