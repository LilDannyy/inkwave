// Surf N' Turf looks (src/game/sp-surf.js runs the special): the buoy machine (held in the hand, and anchored in the
// world) and the rings it sends out.
//
// THE BUOY — a modified harbour buoy in the toy-plastic language of the other special props (special-props.js /
// character-weapons.js GEO_KIT: vertex colours + the aMat surface class; `body` plastic, `ink` the team's ink): a dark
// weighted keel, a fat team-ink float collar round a cream hull with a team band, a control panel with LEDs and a
// carry handle (the "machine"), the EMITTER RING (a gunmetal ring with a lit team ring and six nozzles, turning) and a
// caged BEACON LAMP on a mast, capped with a little antenna. ~1.3 m tall anchored; the same mesh shrunk in the hand.
//
// THE RING — the mark ribbon (src/game/statusFx.js: the squid arrow wrapped round a marked player) laid out as a wave:
// a standing ribbon hugging the ground (draped over the terrain the ring runs on — sp-surf.js's polar map — and cut
// off at the walls that stop it), knee-high (SPECIALS.surf.height: what you jump over), a few squid arrows (the mark's
// own shape and shading, ARROW_GLSL: the mantle head with its eyes, the shaft, the tentacles) chasing round it head
// first, on a translucent team-coloured wave whose bright crest line is the height to clear; a band of foam on the
// ground behind the front (so it reads from above too). It rises as it leaves the buoy, throbs as it travels, and at
// its last reach ripples and sinks away — the mark's going.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { GEO_KIT } from '../game/character-weapons.js';
import { lathe, smoothProfile } from '../game/character-geo.js';
import { getPlasticMaterial, getInkMaterial } from '../game/character-mats.js';
import { ARROW_GLSL, U as AU, SHAFT_H, HEAD_H, HEAD_LEN } from '../game/statusFx.js';

const { Parts, C, M, torus, at, rbox, orient, led } = GEO_KIT;
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const f4 = (x) => x.toFixed(4);
// (see-through looks stay out of the GTAO normal / depth pass — statusFx.js / subs.js noAO)
const noAO = (mesh) => { mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; return mesh; };

// ------------------------------------------------------------------------------------------------ the buoy model
export const BUOY = { height: 1.32, collarR: 0.54, lampY: 1.0, emitY: 0.62, hitR: 0.5, hitH: 1.2 };
let _geo = null;
function hring(R, r, y, rs = 6, ts = 40) { const g = torus(R, r, rs, ts); g.rotateX(Math.PI / 2); return at(g, 0, y, 0); }
function rodY(x, z, y0, y1, r, seg = 8) { return at(lathe([[0, 0], [r, 0], [r, y1 - y0], [0, y1 - y0]], seg), x, y0, z); }
export function buoyGeometry() {
  if (_geo) return _geo;
  const P = new Parts(), I = new Parts(), L = new Parts(), E = new Parts(), EI = new Parts(), EL = new Parts(), LP = new Parts();
  // keel (a dark weighted cone) + the hull: cream above the collar, dark below
  P.add(lathe(smoothProfile([[0, 0.0], [0.12, 0.0], [0.2, 0.04], [0.27, 0.12], [0.31, 0.2], [0, 0.2]], 10), 28), C.dark, M.gloss);
  P.add(lathe(smoothProfile([[0, 0.18], [0.33, 0.19], [0.4, 0.3], [0.41, 0.42], [0.37, 0.53], [0.27, 0.6], [0.14, 0.64], [0, 0.65]], 16), 32), C.cream, M.gloss);
  I.add(hring(0.41, 0.03, 0.47, 6, 40));                           // team band on the upper hull
  I.add(hring(0.43, 0.115, 0.29, 10, 44));                         // the fat float collar
  for (let k = 0; k < 8; k++) {                                     // rubber bumpers on the collar
    const a = (k / 8) * TAU;
    P.add(at(rbox(0.07, 0.09, 0.07, 0.5, 8, 6), Math.sin(a) * 0.545, 0.29, Math.cos(a) * 0.545), C.rubber, M.rubber);
  }
  // the "machine": a control panel with LEDs on the front, a carry handle on the back
  P.add(orient(rbox(0.18, 0.012, 0.13, 0.35, 10, 4), new V3(0, 0.25, 1).normalize(), new V3(0, 0.44, 0.385)), C.dark, M.satin);
  led(P, new V3(-0.045, 0.465, 0.39), new V3(0, 0.25, 1).normalize(), C.green, 0.012);
  led(P, new V3(0.0, 0.465, 0.39), new V3(0, 0.25, 1).normalize(), C.amber, 0.012);
  led(P, new V3(0.045, 0.465, 0.39), new V3(0, 0.25, 1).normalize(), C.red, 0.012);
  P.add(at(rbox(0.12, 0.022, 0.03, 0.4, 8, 4), 0, 0.415, 0.392), C.metal, M.metal);
  {
    const hd = new THREE.TorusGeometry(0.09, 0.016, 6, 16, Math.PI); hd.rotateY(Math.PI); hd.translate(0, 0.46, -0.37);
    P.add(hd, C.rubber, M.rubber);
  }
  // emitter ring (turns): gunmetal ring, lit team ring, six nozzles
  E.add(hring(0.34, 0.04, BUOY.emitY, 8, 44), C.gunmetal, M.metal);
  EL.add(hring(0.34, 0.024, BUOY.emitY + 0.035, 6, 44));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, d = new V3(Math.sin(a), 0, Math.cos(a));
    E.add(orient(lathe([[0, 0], [0.035, 0], [0.03, 0.07], [0.045, 0.09], [0.042, 0.11], [0, 0.11]], 10), d, new V3(d.x * 0.33, BUOY.emitY, d.z * 0.33)), C.metal, M.metal);
    EI.add(orient(lathe([[0, 0], [0.026, 0], [0.026, 0.012], [0, 0.012]], 10), d, new V3(d.x * 0.44, BUOY.emitY, d.z * 0.44)));
  }
  // mast, cage, lamp, cap, antenna
  P.add(rodY(0, 0, 0.62, 0.9, 0.055, 14), C.dark, M.gloss);
  P.add(hring(0.13, 0.018, 0.88, 6, 28), C.metal, M.metal);
  P.add(hring(0.13, 0.018, 1.13, 6, 28), C.metal, M.metal);
  for (let k = 0; k < 4; k++) { const a = (k / 4 + 0.125) * TAU; P.add(rodY(Math.sin(a) * 0.13, Math.cos(a) * 0.13, 0.88, 1.13, 0.012, 6), C.metal, M.metal); }
  LP.add(at(lathe(smoothProfile([[0, 0.0], [0.07, 0.01], [0.095, 0.08], [0.09, 0.17], [0.06, 0.22], [0, 0.23]], 10), 20), 0, 0.89, 0));
  P.add(at(lathe(smoothProfile([[0, 0], [0.15, 0], [0.15, 0.03], [0.1, 0.07], [0.03, 0.09], [0, 0.09]], 8), 24), 0, 1.13, 0), C.dark, M.gloss);
  P.add(rodY(0.05, 0, 1.2, 1.3, 0.007, 6), C.metal, M.metal);
  led(P, new V3(0.05, 1.305, 0), new V3(0, 1, 0), C.red, 0.016);
  _geo = { body: P.build(), ink: I.build(), glow: L.build(), emit: E.build(), emitInk: EI.build(), emitGlow: EL.build(), lamp: LP.build() };
  return _geo;
}
/** A buoy for `team`: { group, emitter (turns), lamp, glowMat, lampMat, bodyMat } — scale it as needed */
export function makeBuoy(team) {
  const g = buoyGeometry(), col = G.teamColors[team], grp = new THREE.Group();
  const glowMat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.35), emissive: col.clone(), emissiveIntensity: 1.3, roughness: 0.35 });
  const lampMat = new THREE.MeshStandardMaterial({ color: col.clone().lerp(new THREE.Color(1, 1, 1), 0.5), emissive: col.clone().lerp(new THREE.Color(1, 1, 1), 0.25), emissiveIntensity: 1.2, roughness: 0.2, transparent: true, opacity: 0.92 });
  const mk = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; return m; };
  grp.add(mk(g.body, getPlasticMaterial()), mk(g.ink, getInkMaterial(col)));
  const emitter = new THREE.Group();
  emitter.add(mk(g.emit, getPlasticMaterial()), mk(g.emitInk, getInkMaterial(col)), mk(g.emitGlow, glowMat, false));
  const lamp = mk(g.lamp, lampMat, false);
  grp.add(emitter, lamp);
  return { group: grp, emitter, lamp, glowMat, lampMat };
}
export function disposeBuoy(b) { b?.glowMat?.dispose(); b?.lampMat?.dispose(); }

// ------------------------------------------------------------------------------------------------ the ring
// One strip of N columns round the ring, three rows: 0 the foam's inner edge (on the ground, behind the front), 1 the
// front on the ground (the wave's foot), 2 the wave's top. aU: the column's share of the way round (0 … 1); aRow: the
// row; aA: the column's alpha (a wall cut it off: it fades where it struck). Positions are world space, written every
// frame by sp-surf.js (draped); materials: the foam (rows 0–1), then the wave twice (rows 1–2: its inside, then its
// outside, so the near side always lies over the far one — the mark band's trick).
export const RING_N = 160;
const RING_VS = /* glsl */`
  attribute float aU; attribute float aRow; attribute float aA;
  varying float vU; varying float vRow; varying float vA;
  void main(){ vU = aU; vRow = aRow; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the wave: the mark's squid arrows (statusFx.js BAND_FS's shape, shading and eyes) chasing round, head first, uK of
// them each a share of the way round (a wider ring only lengthens their shafts — as the mark's band), on the
// translucent wave with its crest line
const WAVE_FS = /* glsl */`
  uniform vec3 uColor; uniform float uH; uniform float uR; uniform float uK; uniform float uSpin; uniform float uAlpha;
  uniform float uPulse; uniform float uTime; uniform float uGap;
  varying float vU; varying float vRow; varying float vA;
${ARROW_GLSL}  void main(){
    const float U = ${f4(AU)}, SH = ${f4(SHAFT_H / 2)}, HH = ${f4(HEAD_H / 2)}, HL = ${f4(HEAD_LEN)};
    float v = clamp(vRow - 1.0, 0.0, 1.0);
    float Cr = 6.2831853 * uR, cell = Cr / uK;
    float s = fract(vU - uSpin) * Cr, x = mod(s, cell);
    float sc = uH * 0.94 / (2.0 * HH);                      // the arrow's metres → the wave's (its head fills the height)
    vec2 p = vec2(x / sc, (v - 0.5) * uH / sc), q = vec2(p.x, abs(p.y));
    float L = max(0.62, (cell - uGap) / sc);                // its tip (a gap before the next one's tentacles)
    float d = sdRBox(p, vec2((0.1 + L - HL + 0.25) * 0.5, 0.0), vec2(max(0.02, (L - HL + 0.25 - 0.1) * 0.5), SH), 0.06);
    if (p.x > L - HL - 0.06) d = min(d, sdHead(vec2(p.x - L, q.y)));
    float t = min(sdTaper(q, vec2(0.17, 3.2 * U), vec2(0.17 - 14.0 * U, 4.4 * U), 4.0 * U, 3.3 * U),
                  sdTaper(q, vec2(0.17, 9.0 * U), vec2(0.17 - 12.0 * U, 13.5 * U), 4.2 * U, 3.4 * U));
    d = smin(d, t, 0.025);
    float a = fill(d);
    // its colour (the mark's): darker toward the top, a gloss streak under the middle, a lighter rim, the mantle's
    // highlight, the eyes
    vec3 c = uColor * (1.12 - 0.5 * clamp((p.y + HH) / (2.0 * HH), 0.0, 1.0));
    c += 0.16 * exp(-pow((p.y + 0.32 * SH) / (0.3 * SH), 2.0));
    float rim = 1.0 - smoothstep(0.0, 0.022, -d);
    c = mix(c, vec3(1.0), 0.4 * rim);
    vec2 hp = vec2(p.x - L, p.y);
    float hs = length(hp - vec2(-10.0 * U, -7.0 * U) - clamp(dot(hp - vec2(-10.0 * U, -7.0 * U), vec2(4.8, 6.5) * U) / dot(vec2(4.8, 6.5) * U, vec2(4.8, 6.5) * U), 0.0, 1.0) * vec2(4.8, 6.5) * U);
    c = mix(c, vec3(1.0), 0.35 * (1.0 - smoothstep(0.6 * U, 2.0 * U, hs)));
    vec2 ec = vec2(L - 33.0 * U, 6.6 * U);
    float eo = sdEll(q, ec, vec2(5.4, 4.3) * U), ew = eo + 0.9 * U, ep = sdEll(q, ec + vec2(1.1, -0.7) * U, vec2(3.0, 2.4) * U);
    vec3 ink = vec3(0.007, 0.006, 0.011);
    c = mix(c, ink, fill(eo)); c = mix(c, vec3(0.93, 0.94, 0.97), fill(ew)); c = mix(c, ink, fill(ep));
    c *= 1.0 + 0.18 * uPulse;
    // the wave behind it: translucent, brighter toward its crest — the bright line on top is the height to clear —
    // with a shimmer running round the way the arrows go
    float crest = smoothstep(0.82, 0.95, v) * (1.0 - smoothstep(0.975, 1.0, v));
    float shim = 0.5 + 0.5 * sin(s * 2.3 - uTime * 10.0);
    vec3 bg = mix(uColor * 0.7, uColor * 1.3 + 0.1, v) + 0.08 * shim;
    float ba = (0.12 + 0.26 * v + 0.07 * shim) * (0.8 + 0.45 * uPulse);
    bg = mix(bg, vec3(1.0), 0.5 * crest);
    ba = max(ba, 0.85 * crest);
    vec3 col = mix(bg, c, a);
    float al = max(ba, a);
    if (!gl_FrontFacing) col *= 0.62;                        // its inside: the far side, darker
    gl_FragColor = vec4(col, clamp(al, 0.0, 1.0) * uAlpha * vA);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// the foam on the ground behind the front: thickest at the front, a churn running round
const FOAM_FS = /* glsl */`
  uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uR;
  varying float vU; varying float vRow; varying float vA;
  void main(){
    float f = clamp(vRow, 0.0, 1.0);
    float s = vU * 6.2831853 * uR;
    float n = 0.5 + 0.5 * sin(s * 3.1 + uTime * 5.0) * sin(s * 1.3 - uTime * 3.0 + f * 4.0);
    vec3 col = mix(uColor * 1.15 + 0.08, vec3(1.0), 0.25 + 0.3 * f * n);
    float al = pow(f, 1.4) * (0.32 + 0.3 * n);
    gl_FragColor = vec4(col, al * uAlpha * vA);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

let _ringIdx = null;
function ringIndex() {
  if (_ringIdx) return _ringIdx;
  const foam = [], wave = [], W = RING_N + 1;
  for (let i = 0; i < RING_N; i++) {
    const a0 = i, a1 = i + 1;
    // (row r of column c: c + r·W) — counter-clockwise seen from outside for the wave (its outside the front face)
    foam.push(a0, a1, a1 + W, a0, a1 + W, a0 + W);
    wave.push(a0 + W, a1 + W, a1 + 2 * W, a0 + W, a1 + 2 * W, a0 + 2 * W);
  }
  _ringIdx = { foam, wave };
  return _ringIdx;
}
export class RingRibbon {
  constructor(scene, team, { arrows = 3, height = 0.55 } = {}) {
    this.scene = scene;
    const W = RING_N + 1, I = ringIndex();
    const g = new THREE.BufferGeometry();
    this.pos = new THREE.Float32BufferAttribute(new Float32Array(W * 3 * 3), 3); this.pos.setUsage(THREE.DynamicDrawUsage);
    this.alpha = new THREE.Float32BufferAttribute(new Float32Array(W * 3).fill(1), 1); this.alpha.setUsage(THREE.DynamicDrawUsage);
    const u = new Float32Array(W * 3), row = new Float32Array(W * 3);
    for (let r = 0; r < 3; r++) for (let c = 0; c < W; c++) { u[r * W + c] = c / RING_N; row[r * W + c] = r; }
    g.setAttribute('position', this.pos); g.setAttribute('aA', this.alpha);
    g.setAttribute('aU', new THREE.Float32BufferAttribute(u, 1)); g.setAttribute('aRow', new THREE.Float32BufferAttribute(row, 1));
    g.setIndex([...I.foam, ...I.wave]);
    g.addGroup(0, I.foam.length, 0); g.addGroup(I.foam.length, I.wave.length, 1); g.addGroup(I.foam.length, I.wave.length, 2);
    // (one set of uniform objects shared by the three materials)
    const U = this.U = { uColor: { value: G.teamColors[team].clone() }, uH: { value: height }, uR: { value: 1 }, uK: { value: arrows }, uSpin: { value: 0 },
      uAlpha: { value: 0 }, uPulse: { value: 0 }, uTime: { value: 0 }, uGap: { value: 0.14 } };
    const wave = (side) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: RING_VS, fragmentShader: WAVE_FS, transparent: true, depthWrite: false, side });
    const foam = new THREE.ShaderMaterial({ uniforms: { uColor: U.uColor, uAlpha: U.uAlpha, uTime: U.uTime, uR: U.uR }, vertexShader: RING_VS, fragmentShader: FOAM_FS,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mats = [foam, wave(THREE.BackSide), wave(THREE.FrontSide)];
    this.mesh = noAO(new THREE.Mesh(g, this.mats));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    scene.add(this.mesh);
  }
  // write the ring: centre (cx, cz); per column (RING_N + 1, the last = the first) its radius, ground height, top
  // height over the ground, alpha; foam: how far behind the front its inner edge is (m), and that edge's ground height
  set(cx, cz, rad, gy, top, al, foamW, foamY) {
    const P = this.pos.array, A = this.alpha.array, W = RING_N + 1;
    for (let c = 0; c < W; c++) {
      const i = c % RING_N, th = (i / RING_N) * TAU, sx = Math.sin(th), cz0 = Math.cos(th);
      const r = rad[i], y = gy[i], rf = Math.max(0, r - foamW);
      let o = c * 3;
      P[o] = cx + sx * rf; P[o + 1] = foamY[i] + 0.04; P[o + 2] = cz + cz0 * rf;
      o = (W + c) * 3;
      P[o] = cx + sx * r; P[o + 1] = y + 0.03; P[o + 2] = cz + cz0 * r;
      o = (2 * W + c) * 3;
      P[o] = cx + sx * r; P[o + 1] = y + 0.03 + top[i]; P[o + 2] = cz + cz0 * r;
      A[c] = A[W + c] = A[2 * W + c] = al[i];
    }
    this.pos.needsUpdate = true; this.alpha.needsUpdate = true;
  }
  look({ radius, spin, alpha, pulse, time, height }) {
    const u = this.U;
    u.uR.value = Math.max(0.05, radius); u.uSpin.value = spin; u.uAlpha.value = alpha; u.uPulse.value = pulse; u.uTime.value = time;
    if (height !== undefined) u.uH.value = height;
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); for (const m of this.mats) m.dispose(); }
}
