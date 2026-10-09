// The Tubeway's looks (src/game/pipes.js; aquarium ENGINE.md §3.6, DESIGN.md §3.3 / §5.4): looks only, no rules.
//   • the glass: one merged tube for every leg (20 sides, rings every 0.25 m on bends, 1 m on straights; not in the legs'
//     `hide` ranges), drawn twice (back faces, then front), transparent, out of GTAO (drainbowFx.js's noAO trick); its
//     rim from the ink-tank glass recipe (0.06 face-on → 0.5 grazing). Riders light it in their team colour (2.4 m round
//     them, a 6 m trail behind: uRide[8]); frosted chevrons along its underside run IN → OUT on one-way legs all the time,
//     on two-way legs only while someone rides, their way; a tidal leg's strobe and slow in the warning, dim while shut
//   • the hardware (one opaque merged mesh): collars every 3 m (brass on two-way legs, green-painted steel on one-way
//     ones), the saddles and posts under overhead runs where a roof or wall top is close below (no spine over the span)
//   • the mouths: a ring at every end (instance colours: a still white ring at a two-way end, a lit warm ring at an open
//     one-way IN end, dark at an OUT or shut end; the rider's team colour while its exit is lit, pulsing faster in the
//     last second), an intake fan turning behind every one-way IN end, a glass check-valve flap at every OUT end (both
//     ends of a two-way leg) that swings open for a pop and rattles at a refusal
//   • the signs (one instanced quad set on a canvas atlas): over each mouth "⇄ → WEST GULPER", "▶ IN → PENGUIN POINT",
//     "EXIT ONLY", the tidal split-flaps "▲ UP · IN" / "▼ DOWN · IN" / "EXIT ONLY" under "KELP LINE" (riffling in the warning, clattering
//     over at the flip); and the lit floor arrow on each open one-way IN end's apron
//   • look.deckLight: an additive quad 0.02 m over a floor strip above a buried run (the Glass Walk), lit at the riders
//     under it, over any ink
//   • the underwater grade while the ride camera sits in a `water` volume: a blue-green fog and tint, a caustic shimmer
// Draw calls: glass ×2, hardware, rings, fans, flaps, signs + arrows, deck light = 8 (+1 only while the grade is on).
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { legAt, hiddenAt, endIsIn } from '../world/pipes-data.js';

const noAO = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; };
const MAXR = 8, MAXL = 16;
const SEG = 20, R_GLASS = 0.88;
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _qt = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();
const Z = new THREE.Vector3(0, 0, 1), UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------------------------------------------ the glass shader
const GLASS_VS = /* glsl */`
attribute float aS; attribute float aLeg; attribute float aAng;
varying float vS; varying float vLeg; varying float vAng; varying vec3 vN; varying vec3 vV;
void main() {
  vS = aS; vLeg = aLeg; vAng = aAng;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = cameraPosition - w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLASS_FS = /* glsl */`
uniform vec4 uRide[${MAXR}];          // leg, s, team (0 / 1), dir (±1); leg < 0: none
uniform float uRideOn[${MAXR}];
uniform vec3 uTeam0; uniform vec3 uTeam1;
uniform float uTime; uniform float uBack;
uniform float uFlow[${MAXL}];          // a one-way leg's flow: +1 A → B, −1 B → A; 0: a two-way leg
uniform float uWarn[${MAXL}];          // the tide's warning strobe (0 / 1)
uniform float uShut[${MAXL}];          // shut: dim
varying float vS; varying float vLeg; varying float vAng; varying vec3 vN; varying vec3 vV;
void main() {
  vec3 N = normalize(vN) * (uBack > 0.5 ? -1.0 : 1.0), V = normalize(vV);
  float fres = pow(1.0 - abs(dot(N, V)), 3.0);
  float a = mix(0.06, 0.5, fres) * (uBack > 0.5 ? 0.7 : 1.0);
  vec3 col = vec3(0.86, 0.96, 1.0) * (0.75 + 0.35 * fres);
  int li = int(vLeg + 0.5);
  float flow = 0.0, warn = 0.0, shut = 0.0;
  for (int j = 0; j < ${MAXL}; j++) if (j == li) { flow = uFlow[j]; warn = uWarn[j]; shut = uShut[j]; }
  // riders: their team colour round them and a trail behind
  vec3 glow = vec3(0.0); float ga = 0.0; float rideDir = 0.0;
  for (int i = 0; i < ${MAXR}; i++) {
    vec4 r = uRide[i];
    if (r.x < -0.5 || abs(r.x - vLeg) > 0.5) continue;
    float d = (vS - r.y) * r.w;     // > 0 ahead of the rider, < 0 behind
    float k = abs(d) < 1.2 ? 1.0 - smoothstep(0.5, 1.2, abs(d)) : 0.0;
    if (d < 0.0 && d > -6.0) k = max(k, 0.6 * (1.0 + d / 6.0));
    k *= uRideOn[i];
    vec3 tc = r.z > 0.5 ? uTeam1 : uTeam0;
    glow += tc * k; ga = max(ga, k); rideDir = r.w;
  }
  // the chevron strip along the underside (|angle from the bottom| < 0.5)
  float strip = 1.0 - smoothstep(0.38, 0.5, abs(vAng));
  float fdir = flow != 0.0 ? flow : rideDir;
  float speed = warn > 0.5 ? 1.2 : 5.0;
  float q = fract(vS * fdir / 1.4 - uTime * speed / 1.4 + abs(vAng) * 0.55);
  float chev = (1.0 - smoothstep(0.06, 0.13, abs(q - 0.5))) * strip;
  float on = flow != 0.0 ? 1.0 : (ga > 0.0 ? 1.0 : 0.0);
  if (flow == 0.0) on *= ga > 0.0 ? 1.0 : 0.0;
  float strobe = warn > 0.5 ? step(0.5, fract(uTime * 3.0)) : 1.0;
  chev *= on * strobe * (shut > 0.5 ? 0.15 : 1.0) * (flow != 0.0 ? 0.55 : 0.8);
  vec3 c = col + glow * 2.4 + vec3(0.9, 1.0, 1.0) * chev * 0.9;
  // the glass right at the lens fades out (a ride camera inside or beside the tube sees through it, its own glow too)
  float near = smoothstep(1.2, 4.5, length(vV));
  float alpha = clamp(a + ga * 0.55 + chev * 0.45 + 0.04 * strip, 0.0, 0.95) * near;
  gl_FragColor = vec4(c, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// the deck light: a floor quad lit in the colour of the riders under it
const DECK_VS = /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DECK_FS = /* glsl */`
uniform vec4 uRP[${MAXR}];   // x, z, dirX, dirZ
uniform vec4 uRT[${MAXR}];   // team, on, leg, —
uniform float uLeg; uniform vec3 uTeam0; uniform vec3 uTeam1; uniform float uTime;
varying vec3 vW;
void main() {
  vec3 c = vec3(0.0); float k = 0.0;
  for (int i = 0; i < ${MAXR}; i++) {
    if (uRT[i].y <= 0.0 || abs(uRT[i].z - uLeg) > 0.5) continue;
    vec2 d = vW.xz - uRP[i].xy, dir = uRP[i].zw;
    float along = dot(d, dir), perp = abs(dot(d, vec2(-dir.y, dir.x)));
    // a disc over the rider with a short, crisp edge, and a trail that tapers to a point 6 m back: it keeps its strength
    // and narrows rather than fading (a half-strength rider colour laid over the other team's ink averages to a dull grey
    // stripe: LEAD-REVIEW round 2, item 4)
    float g = 1.0 - smoothstep(1.4, 2.2, length(d));
    if (along < 0.0 && along > -6.0) { float t = -along / 6.0, hw = mix(1.05, 0.12, t); g = max(g, 0.9 * (1.0 - smoothstep(hw * 0.65, hw, perp)) * (1.0 - smoothstep(0.82, 1.0, t))); }
    g *= uRT[i].y;
    c += (uRT[i].x > 0.5 ? uTeam1 : uTeam0) * g; k = max(k, g);
  }
  if (k <= 0.002) discard;
  // the rider's own colour laid over the floor (not added to it: over the other team's ink an added glow washes out to
  // white; laid over, it reads as the rider's ink on any floor), a touch brighter than ink and pulsing
  vec3 col = c / max(k, 1e-3);
  gl_FragColor = vec4(col * (1.2 + 0.15 * sin(uTime * 9.0)), min(0.9, k * 1.15));
  #include <colorspace_fragment>
}`;

// the signs and floor arrows: per-instance rects of one canvas atlas
const SIGN_VS = /* glsl */`
attribute vec4 aRect; attribute float aGlow;
varying vec2 vUv; varying float vGlow;
void main() { vUv = aRect.xy + uv * aRect.zw; vGlow = aGlow; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`;
const SIGN_FS = /* glsl */`
uniform sampler2D uMap; varying vec2 vUv; varying float vGlow;
void main() { if (vGlow <= 0.001) discard; vec4 t = texture2D(uMap, vUv); if (t.a < 0.03) discard; gl_FragColor = vec4(t.rgb * vGlow, t.a); }`;

// the underwater grade: a full-screen tint, vignette and caustic shimmer
const UW_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const UW_FS = /* glsl */`
uniform float uTime; uniform float uK; varying vec2 vUv;
void main() {
  vec2 p = vUv * vec2(9.0, 5.5);
  float c = sin(p.x + uTime * 1.3 + sin(p.y * 1.7 + uTime)) * sin(p.y * 1.3 - uTime * 0.9 + sin(p.x * 0.8));
  float caus = smoothstep(0.55, 1.0, c) * 0.10;
  float vig = smoothstep(0.35, 0.95, length(vUv - 0.5) * 1.35);
  vec3 col = mix(vec3(0.09, 0.227, 0.282), vec3(0.6, 0.95, 1.0), caus * 2.0);
  gl_FragColor = vec4(col, uK * (0.06 + caus + vig * 0.38));
}`;

// ------------------------------------------------------------------------------------------------ the atlas
const ATL = { w: 1024, h: 512, cw: 256, ch: 96 };
const COLS = ATL.w / ATL.cw, ROWS = Math.floor(ATL.h / ATL.ch);

export class PipeLooks {
  constructor(scene, net) {
    this.scene = scene; this.net = net; this.X = net.X;
    this.group = new THREE.Group(); this.group.name = 'pipes';
    scene.add(this.group);
    this.t = 0;
    const nL = this.X.legs.length;
    this.flowDir = new Float32Array(MAXL); this.warn = new Float32Array(MAXL); this.shut = new Float32Array(MAXL);
    for (const l of this.X.legs) this.flowDir[l.i] = l.way === 'two' ? 0 : 1;
    this.tideDir = this.X.legs.map((l) => (l.flip ? (l.flip.first === 'ba' ? 'ba' : 'ab') : 'ab'));
    this.tidePhase = this.X.legs.map(() => 'run');
    void nL;
    this.uniforms = {
      uRide: { value: Array.from({ length: MAXR }, () => new THREE.Vector4(-1, 0, 0, 1)) },
      uRideOn: { value: new Array(MAXR).fill(0) },
      uTeam0: { value: new THREE.Color('#ff8a14') }, uTeam1: { value: new THREE.Color('#2f5bff') },
      uTime: { value: 0 }, uFlow: { value: Array.from(this.flowDir) }, uWarn: { value: new Array(MAXL).fill(0) }, uShut: { value: new Array(MAXL).fill(0) },
    };
    this._glass();
    this._hardware();
    this._mouths();
    this._signs();
    this._deck();
    this._grade();
    this.riders = [];
  }

  // ---------------------------------------------------------------- build
  _glass() {
    const pos = [], nor = [], aS = [], aLeg = [], aAng = [], idx = [];
    const q = {};
    for (const leg of this.X.legs) {
      // ring stations: every 0.25 m on bends, 1 m on straights, plus every hide boundary; runs broken where hidden
      const st = new Set([0, leg.len]);
      for (const sg of leg.path.segs) {
        const step = sg.kind === 'arc' ? 0.25 : 1.0, n = Math.max(1, Math.ceil(sg.len / step));
        for (let i = 0; i <= n; i++) st.add(+(sg.s0 + (sg.len * i) / n).toFixed(4));
      }
      for (const h of leg.hide) { st.add(Math.max(0, h[0])); st.add(Math.min(leg.len, h[1])); }
      const S = [...st].filter((s) => s >= 0 && s <= leg.len).sort((x, y) => x - y);
      let prev = -1;
      for (let j = 0; j < S.length; j++) {
        const s = S[j];
        const mid = j > 0 ? (S[j - 1] + s) / 2 : s;
        const vis = j > 0 && !hiddenAt(leg, mid);
        legAt(leg, s, q);
        const t = _p.set(q.tx, q.ty, q.tz), side = _s.set(q.sx, 0, q.sz);
        side.addScaledVector(t, -side.dot(t)).normalize();
        const b = new THREE.Vector3().crossVectors(side, t).normalize();
        const base = pos.length / 3;
        for (let k = 0; k <= SEG; k++) {
          const th = (k / SEG) * Math.PI * 2;
          // angle measured from the underside (−b)
          const dx = side.x * Math.cos(th) + b.x * Math.sin(th), dy = side.y * Math.cos(th) + b.y * Math.sin(th), dz = side.z * Math.cos(th) + b.z * Math.sin(th);
          pos.push(q.x + dx * R_GLASS, q.y + dy * R_GLASS, q.z + dz * R_GLASS); nor.push(dx, dy, dz);
          let ang = th + Math.PI / 2; while (ang > Math.PI) ang -= 2 * Math.PI;
          aS.push(s); aLeg.push(leg.i); aAng.push(ang);
        }
        if (vis && prev >= 0) for (let k = 0; k < SEG; k++) { const a0 = prev + k, a1 = prev + k + 1, b0 = base + k, b1 = base + k + 1; idx.push(a0, b0, a1, a1, b0, b1); }
        prev = base;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
    g.setAttribute('aLeg', new THREE.Float32BufferAttribute(aLeg, 1));
    g.setAttribute('aAng', new THREE.Float32BufferAttribute(aAng, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    this.glassGeo = g;
    this.glass = [];
    for (const back of [1, 0]) {
      const mat = new THREE.ShaderMaterial({ vertexShader: GLASS_VS, fragmentShader: GLASS_FS, transparent: true, depthWrite: false, side: back ? THREE.BackSide : THREE.FrontSide,
        uniforms: { ...this.uniforms, uBack: { value: back } } });
      const mesh = new THREE.Mesh(g, mat);
      mesh.renderOrder = back ? 3 : 4; mesh.frustumCulled = false; mesh.onBeforeRender = noAO; mesh.name = back ? 'pipes:glass-back' : 'pipes:glass';
      this.group.add(mesh); this.glass.push(mesh);
    }
    this.tris = idx.length / 3;
  }
  _hardware() {
    const parts = [];
    const add = (geo, color, m) => { geo.applyMatrix4(m); const n = geo.attributes.position.count, c = new Float32Array(n * 3); _c.set(color); for (let i = 0; i < n; i++) c.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); parts.push(geo.index ? geo.toNonIndexed() : geo); };
    const q = {}, L = this.net.level;
    for (const leg of this.X.legs) {
      const color = leg.look.collars === 'brass' ? '#a8895a' : '#5f8a7d';
      const gap = leg.look.collars === 'brass' ? 3.0 : 4.0;
      for (let s = 1.2; s < leg.len - 0.6; ) {
        legAt(leg, s, q);
        const over = Math.abs(q.ty) < 0.2 && q.y > 6;
        const next = s + (over ? 7.0 : gap);
        if (hiddenAt(leg, s)) { s = next; continue; }
        s = next;
        // under an overhead run: a saddle and a post down to a roof / wall top close below (no spine over the span); over
        // open air no collar at all, only clear tube across the sky (LEAD-NOTES 2026-10-09: the spawn's view)
        let held = false, gy = -Infinity, drop = 0;
        if (Math.abs(q.ty) < 0.2 && L && q.y > 4) { gy = L.groundHeight(q.x, q.z, q.y - R_GLASS - 0.05); drop = q.y - R_GLASS - gy; held = gy > -Infinity && drop > 0.05 && drop < 3.2; }
        if (held) {
          _m.compose(_s.set(q.x, q.y - R_GLASS - 0.08, q.z), _qt.setFromEuler(_e.set(0, Math.atan2(q.tx, q.tz), 0)), new THREE.Vector3(1, 1, 1));
          add(new THREE.BoxGeometry(1.5, 0.16, 0.22), color, _m);
          _m.compose(_s.set(q.x, gy + (drop - 0.16) / 2, q.z), _qt, new THREE.Vector3(1, 1, 1));
          add(new THREE.BoxGeometry(0.2, Math.max(0.05, drop - 0.16), 0.2), color, _m);
        }
        if (over) continue;
        // high up in open air (a riser's top, a bend over the sky) no collar either: a ring with nothing to hold it reads
        // as a hoop floating in the spawn's view (LEAD-REVIEW round 1); one beside a wall, a pylon or a housing stays
        if (q.y > 4.5 && !this._nearSolid(L, q, 1.4)) { this.collarsSkipped = (this.collarsSkipped || 0) + 1; continue; }
        _qt.setFromUnitVectors(UP, _p.set(q.tx, q.ty, q.tz));
        _m.compose(_s.set(q.x, q.y, q.z), _qt, new THREE.Vector3(1, 1, 1));
        add(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 18, 1, true), color, _m);
      }
    }
    let n = 0; for (const g of parts) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    for (const g of parts) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    // a collar near the lens fades away (gone inside 2.0 m, whole from 3.6 m: the ride camera rides the tube's own corridor: a ring sweeping past it would
    // black out the view for a frame), as the glass fades there. By its alpha, not a dither: the dither's stipple read as a
    // black dotted ring across the whole frame (LEAD-REVIEW round 2, item 4). Transparent but writing depth and drawn
    // before the glass (opaque wherever the lens isn't within 3.6 m); one pass (forceSinglePass: still one draw call)
    const hwMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.55, side: THREE.DoubleSide, transparent: true, depthWrite: true, forceSinglePass: true });
    hwMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  { float lensK = smoothstep(2.0, 3.6, length(vViewPosition)); if (lensK < 0.02) discard; diffuseColor.a *= lensK; }`);
    };
    hwMat.customProgramCacheKey = () => 'pipes-hw-lensalpha';
    this.hw = new THREE.Mesh(geo, hwMat);
    this.hw.name = 'pipes:hardware'; this.hw.castShadow = false; this.hw.receiveShadow = true;
    this.group.add(this.hw);
    this.tris += pos.length / 9;
  }
  // a wall beside p: a solid, opaque block (not glass, not water, not a railing) within r of p that rises to p's height
  // (a roof edge below the ring doesn't hold it: the ring still floats against the sky)
  _nearSolid(L, p, r) {
    if (!L) return true;
    const ids = this._ids || (this._ids = []);
    L.queryBlocks(p.x - r, p.z - r, p.x + r, p.z + r, ids);
    for (const id of ids) {
      const b = L.blocks[id];
      if (!b.solid || b.pipe || b.bakeClear || b.grate || !L.pointInBlock(b, p, r)) continue;
      const top = b.center.y + Math.abs(b.axes[0].y) * b.half.x + Math.abs(b.axes[1].y) * b.half.y + Math.abs(b.axes[2].y) * b.half.z;
      if (top >= p.y - 0.3) return true;
    }
    return false;
  }
  _mouths() {
    const E = this.X.ends, n = E.length;
    // rings
    this.rings = new THREE.InstancedMesh(this._ringGeo(), new THREE.MeshBasicMaterial({ toneMapped: false, vertexColors: true }), n);
    this.rings.name = 'pipes:rings';
    this.ringCol = E.map(() => new THREE.Color('#fff'));
    this.endQ = E.map((e) => new THREE.Quaternion().setFromUnitVectors(Z, new THREE.Vector3(e.out[0], 0, e.out[2])));
    for (let i = 0; i < n; i++) {
      const e = E[i];
      _m.compose(_p.set(e.pos[0] + e.out[0] * 0.04, e.pos[1], e.pos[2] + e.out[2] * 0.04), this.endQ[i], _s.set(1, 1, 1));
      this.rings.setMatrixAt(i, _m); this.rings.setColorAt(i, this.ringCol[i]);
    }
    this.group.add(this.rings);
    // fans (every one-way end has one: shown while it is the IN end) and flaps (every end: shown while it is an OUT end)
    const fan = new THREE.BufferGeometry().copy(this._fanGeo());
    this.fanEnds = E.filter((e) => this.X.legs[e.leg].way !== 'two');
    this.fans = new THREE.InstancedMesh(fan, new THREE.MeshStandardMaterial({ color: '#8f8a7a', metalness: 0.7, roughness: 0.35 }), Math.max(1, this.fanEnds.length));
    this.fans.name = 'pipes:fans'; this.fans.count = this.fanEnds.length;
    this.fanA = new Float32Array(this.fanEnds.length); this.fanW = new Float32Array(this.fanEnds.length);
    this.group.add(this.fans);
    const flap = new THREE.CircleGeometry(0.8, 24); flap.translate(0, -0.8, 0);   // (hinged at its top edge)
    this.flaps = new THREE.InstancedMesh(flap, new THREE.MeshStandardMaterial({ color: '#d7eef2', transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }), n);
    this.flaps.name = 'pipes:flaps'; this.flaps.renderOrder = 5; this.flaps.onBeforeRender = noAO;
    this.flapA = new Float32Array(n); this.flapV = new Float32Array(n); this.rattleT = new Float32Array(n);
    this.group.add(this.flaps);
    this.lit = E.map(() => ({ team: -1, fast: false }));
    this.pulse = new Float32Array(n);
  }
  // the mouth: its lit ring and, inside it, the dark bore of the tube (vertex colours: the ring white, the bore near black —
  // times each instance's colour, so only the ring takes the light)
  _ringGeo() {
    const ring = new THREE.TorusGeometry(0.97, 0.085, 8, 30).toNonIndexed(), bore = new THREE.CircleGeometry(0.9, 30).toNonIndexed();
    bore.translate(0, 0, -0.012);
    const parts = [[ring, 1], [bore, 0.035]];
    let n = 0; for (const [g] of parts) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    for (const [g, c] of parts) { pos.set(g.attributes.position.array, o * 3); col.fill(c, o * 3, (o + g.attributes.position.count) * 3); o += g.attributes.position.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }
  _fanGeo() {
    const parts = [new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12)];
    for (let k = 0; k < 4; k++) { const b = new THREE.BoxGeometry(0.2, 0.04, 0.66); b.translate(0, 0, 0.42); b.rotateX(0.35); b.rotateY((k * Math.PI) / 2); parts.push(b); }
    let n = 0; for (const g of parts) n += (g.index ? g.toNonIndexed() : g).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    for (const g0 of parts) { const g = g0.index ? g0.toNonIndexed() : g0; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.rotateX(Math.PI / 2);   // (its axis along local z: the mouth's out axis)
    return geo;
  }
  _signs() {
    const E = this.X.ends;
    this.atlas = document.createElement('canvas'); this.atlas.width = ATL.w; this.atlas.height = ATL.h;
    this.actx = this.atlas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.atlas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    // slots: one per end (its sign), then the arrow glyph
    this.signSlot = E.map((e, i) => i);
    this.arrowSlot = E.length;
    this.arrowEnds = E.filter((e) => this.X.legs[e.leg].way !== 'two' && e.inWhen !== 'never');
    const n = E.length + this.arrowEnds.length;
    const geo = new THREE.PlaneGeometry(1, 1);
    const rect = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), glow = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1);
    geo.setAttribute('aRect', rect); geo.setAttribute('aGlow', glow);
    const mat = new THREE.ShaderMaterial({ vertexShader: SIGN_VS, fragmentShader: SIGN_FS, uniforms: { uMap: { value: this.tex } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.signs = new THREE.InstancedMesh(geo, mat, n);
    this.signs.name = 'pipes:signs'; this.signs.renderOrder = 6; this.signs.frustumCulled = false; this.signs.onBeforeRender = noAO;
    const setRect = (i, slot) => { const cx = slot % COLS, cy = Math.floor(slot / COLS); rect.setXYZW(i, (cx * ATL.cw) / ATL.w, 1 - ((cy + 1) * ATL.ch) / ATL.h, ATL.cw / ATL.w, ATL.ch / ATL.h); };
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      _m.compose(_p.set(e.pos[0] + e.out[0] * 0.14, e.pos[1] + 1.32, e.pos[2] + e.out[2] * 0.14), this.endQ[i], _s.set(1.85, 1.85 * (ATL.ch / ATL.cw), 1));
      this.signs.setMatrixAt(i, _m); setRect(i, i);
    }
    for (let j = 0; j < this.arrowEnds.length; j++) {
      const e = this.arrowEnds[j], i = E.length + j;
      // flat on the apron 0.3 … 2.1 m out, pointing into the mouth
      const yaw = Math.atan2(e.out[2], -e.out[0]);   // (the glyph points along its local +x: turned onto −out)
      _qt.setFromEuler(_e.set(-Math.PI / 2, yaw, 0, 'YXZ'));
      _m.compose(_p.set(e.pos[0] + e.out[0] * 1.25, e.floorY + 0.03, e.pos[2] + e.out[2] * 1.25), _qt, _s.set(2.1, 2.1 * (ATL.ch / ATL.cw) * 2.2, 1));
      this.signs.setMatrixAt(i, _m); setRect(i, this.arrowSlot);
    }
    this.rect = rect; this.glowAttr = glow;
    this.group.add(this.signs);
    this.signText = E.map(() => null);
    this._drawArrow();
    for (let i = 0; i < E.length; i++) this._signFor(i, false);
    this.riffle = E.map(() => 0);
  }
  _cell(slot) { const cx = slot % COLS, cy = Math.floor(slot / COLS); return [cx * ATL.cw, cy * ATL.ch]; }
  _drawArrow() {
    const c = this.actx, [x, y] = this._cell(this.arrowSlot), w = ATL.cw, hh = ATL.ch;
    c.clearRect(x, y, w, hh);
    c.save(); c.translate(x + w / 2, y + hh / 2);
    c.fillStyle = 'rgba(255, 250, 235, 0.92)';
    for (const dx of [-60, 0, 60]) { c.beginPath(); c.moveTo(dx - 26, -40); c.lineTo(dx + 8, 0); c.lineTo(dx - 26, 40); c.lineTo(dx - 6, 40); c.lineTo(dx + 28, 0); c.lineTo(dx - 6, -40); c.closePath(); c.fill(); }
    c.restore();
  }
  // the words an end's sign shows in a tide state ('ab' / 'ba'), and its kind. An OUT end names where its riders come
  // FROM, never a place on its own: "EXIT ONLY / PENGUIN POINT" (its own name) read like the IN end's "→ PENGUIN POINT", a
  // way there (LEAD-REVIEW round 2, item 4)
  _words(e, dir) {
    const leg = this.X.legs[e.leg], to = leg.ends[1 - e.k];
    if (leg.way === 'two') return { top: '⇄', sub: '→ ' + to.name, kind: 'two' };
    if (leg.way === 'one') return e.k === 0 ? { top: '▶ IN', sub: '→ ' + to.name, kind: 'in' } : { top: 'EXIT ONLY', sub: 'FROM ' + to.name, kind: 'out' };
    const isIn = endIsIn(e, dir);
    return isIn ? { top: dir === 'ab' ? '▲ UP · IN' : '▼ DOWN · IN', sub: '→ ' + to.name, kind: 'in' } : { top: 'EXIT ONLY', sub: 'FROM ' + to.name, kind: 'out' };
  }
  _signFor(i, scramble) {
    const E = this.X.ends, e = E[i], leg = this.X.legs[e.leg];
    const w = this._words(e, this.tideDir[leg.i]);
    const phase = this.tidePhase[leg.i];
    const key = `${w.top}|${w.sub}|${scramble ? Math.floor(this.t * 12) : 0}|${phase === 'shut' && w.kind === 'in' ? 1 : 0}`;
    if (this.signText[i] === key) return;
    this.signText[i] = key;
    const c = this.actx, [x, y] = this._cell(i), W = ATL.cw, H = ATL.ch;
    c.clearRect(x, y, W, H);
    const r = 18;
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(x + 4, y + 4, W - 8, H - 8, r) : c.rect(x + 4, y + 4, W - 8, H - 8);
    c.fillStyle = w.kind === 'out' ? '#2c2a30' : '#f4efe1'; c.fill();
    c.lineWidth = 6; c.strokeStyle = leg.look.collars === 'brass' ? '#a8895a' : '#5f8a7d'; c.stroke();
    c.fillStyle = w.kind === 'out' ? '#e6e1d6' : '#15121c';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    let top = w.top;
    if (scramble) { const G = '▲▼◀▶⇄IN·OUTUPDOWNEXIT'; top = top.split('').map((ch) => (ch === ' ' ? ' ' : G[Math.floor(Math.random() * G.length)])).join(''); }
    // a leg's own name over its words (look.tag: the Kelp Lines' "KELP LINE", so a stranger at the mouth can match it to
    // the HUD's "KELP LINES GOING DOWN IN …")
    const tag = leg.look?.tag;
    if (tag) { c.font = '900 17px Rubik, "Helvetica Neue", Arial, sans-serif'; c.fillText(tag, x + W / 2, y + H * 0.15, W - 40); }
    c.font = '900 40px Rubik, "Helvetica Neue", Arial, sans-serif';
    c.fillText(top, x + W / 2, y + H * (tag ? 0.42 : 0.38), W - 24);
    c.font = '800 21px Rubik, "Helvetica Neue", Arial, sans-serif';
    if (w.kind === 'out') { c.fillRect(x + 30, y + H * 0.62, W - 60, 5); c.fillText(w.sub, x + W / 2, y + H * 0.78, W - 24); }
    else c.fillText(phase === 'shut' && leg.flip ? 'CLOSED · TURNING' : w.sub, x + W / 2, y + H * 0.74, W - 24);
    if (leg.flip) {   // split-flap seams
      c.fillStyle = 'rgba(0,0,0,.22)';
      for (let k = 1; k < 9; k++) c.fillRect(x + (W * k) / 9 - 1, y + 10, 2, H - 20);
      c.fillRect(x + 8, y + H * (tag ? 0.42 : 0.38) - 1, W - 16, 2);
    }
    c.restore();
    this.tex.needsUpdate = true;
  }
  _deck() {
    this.decks = [];
    for (const leg of this.X.legs) {
      const D = leg.look.deckLight;
      if (!D || (leg.single && leg.isTwin)) continue;
      const [x0, x1, z0, z1, y] = D;
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2);
      const mat = new THREE.ShaderMaterial({ vertexShader: DECK_VS, fragmentShader: DECK_FS, transparent: true, depthWrite: false, blending: THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        uniforms: { uRP: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) }, uRT: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) }, uLeg: { value: leg.i }, uTeam0: this.uniforms.uTeam0, uTeam1: this.uniforms.uTeam1, uTime: this.uniforms.uTime } });
      const mesh = new THREE.Mesh(g, mat); mesh.name = 'pipes:deck-light'; mesh.renderOrder = 2; mesh.onBeforeRender = noAO; mesh.frustumCulled = false;
      this.group.add(mesh); this.decks.push(mesh);
    }
  }
  _grade() {
    this.uw = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: UW_VS, fragmentShader: UW_FS, transparent: true, depthTest: false, depthWrite: false, uniforms: { uTime: this.uniforms.uTime, uK: { value: 0 } } }));
    this.uw.name = 'pipes:underwater'; this.uw.renderOrder = 1000; this.uw.frustumCulled = false; this.uw.visible = false;
    // decided at render time from the camera's final position (after every lens offset): the grade is on exactly while
    // the lens is inside the rider's water volume; the fog follows a frame later
    this.uw.onBeforeRender = (r, scene, camera, geo) => {
      if (scene.overrideMaterial) { geo.drawRange.count = 0; return; }   // (an override pass: GTAO's, a depth pass — not the view)
      const V = this.rideVol, c = camera.position;
      const inside = !!V && !scene.overrideMaterial && V.y && c.y > V.y[0] + 0.05 && c.y < V.y[1] - 0.05 - (V.open || 0) && (V.cyl ? Math.hypot(c.x - V.cyl[0], c.z - V.cyl[1]) < V.cyl[2] - 0.05 : c.x > V.box[0] + 0.05 && c.x < V.box[1] - 0.05 && c.z > V.box[2] + 0.05 && c.z < V.box[3] - 0.05);
      this._setUnder(inside, c);
      geo.drawRange.count = scene.overrideMaterial || this.uwK < 0.01 ? 0 : Infinity;
    };
    this.group.add(this.uw);
    this.uwOn = false; this.uwK = 0; this._fogSave = null; this.rideVol = null;
  }

  // ---------------------------------------------------------------- state from the engine
  setRiders(list) { this.riders = list || []; }
  lightEnd(i, team, fast) { const L = this.lit[i]; if (L) { L.team = team; L.fast = !!fast; } }
  pop(i, team) { this.flapV[i] = 9; void team; }
  rattle(i) { this.rattleT[i] = 0.45; }
  // the tide: a tidal leg's direction and phase (phase 'warn' strobes the chevrons and riffles its split-flaps; 'shut'
  // dims; `ev` 'flip' clatters the signs over)
  setFlow(li, dir, phase, ev) {
    const leg = this.X.legs[li];
    if (!leg || !leg.flip) return;
    this.tideDir[li] = dir; this.tidePhase[li] = phase;
    this.flowDir[li] = dir === 'ab' ? 1 : -1;
    this.uniforms.uFlow.value[li] = this.flowDir[li];
    this.uniforms.uWarn.value[li] = phase === 'warn' ? 1 : 0;
    this.uniforms.uShut.value[li] = phase === 'shut' ? 1 : 0;
    for (const e of leg.ends) { this.riffle[e.i] = ev === 'flip' ? 0.6 : this.riffle[e.i]; this._signFor(e.i, false); }
  }
  // the ride camera's grade (only on the rider's own screen): V = the water volume its rider is in (or null); whether its
  // lens is inside is decided at render time (uw.onBeforeRender)
  underwater(V) {
    this.rideVol = V && V.y ? V : null;
    if (this.rideVol) this.uw.visible = true;   // (its render-time test must run on the very frame the lens enters)
    if (!this.rideVol && this.uwOn) this._setUnder(false);
  }
  _setUnder(on, at) {
    on = !!on;
    if (on === this.uwOn) return;
    this.uwOn = on;
    const sc = this.scene;
    if (on) {
      if (sc.fog && sc.fog.isFog) { this._fogSave = { c: sc.fog.color.clone(), n: sc.fog.near, f: sc.fog.far }; sc.fog.color.set('#173a48'); sc.fog.near = 0.5; sc.fog.far = 20; }
      if (at && G.fx?.burst) G.fx.burst(at.clone().add(new THREE.Vector3(0, -0.2, 0)), UP, new THREE.Color('#e8fbff'), { count: 14, speed: 2.2, size: 0.06 });
    } else if (this._fogSave && sc.fog) { sc.fog.color.copy(this._fogSave.c); sc.fog.near = this._fogSave.n; sc.fog.far = this._fogSave.f; this._fogSave = null; }
  }

  // ---------------------------------------------------------------- per frame
  update(dt, R) {
    this.t += dt;
    const U = this.uniforms;
    U.uTime.value = this.t;
    if (G.teamColors?.[0]) U.uTeam0.value.copy(G.teamColors[0]);
    if (G.teamColors?.[1]) U.uTeam1.value.copy(G.teamColors[1]);
    // riders
    const rs = this.riders;
    for (let i = 0; i < MAXR; i++) {
      const r = rs[i], v = U.uRide.value[i];
      if (r) { v.set(r.leg, r.s, r.team, r.dir); U.uRideOn.value[i] = r.on; } else { v.set(-1, 0, 0, 1); U.uRideOn.value[i] = 0; }
    }
    for (const d of this.decks) {
      const P = d.material.uniforms.uRP.value, T = d.material.uniforms.uRT.value;
      for (let i = 0; i < MAXR; i++) {
        const r = rs[i];
        if (r) { const leg = this.X.legs[r.leg]; const q = legAt(leg, r.s, {}); P[i].set(r.x, r.z, q.tx * r.dir, q.tz * r.dir); const l = Math.hypot(P[i].z, P[i].w) || 1; P[i].z /= l; P[i].w /= l; T[i].set(r.team, r.on, r.leg, 0); }
        else T[i].set(0, 0, -1, 0);
      }
    }
    // rings: two-way still white; one-way IN open warm-lit, OUT / shut dark; lit exits in the rider's colour, pulsing
    const E = this.X.ends;
    for (let i = 0; i < E.length; i++) {
      const e = E[i], leg = this.X.legs[e.leg], L = this.lit[i];
      if (L.team >= 0) {
        this.pulse[i] += dt * (L.fast ? 9 : 3.5);
        const k = 0.65 + 0.35 * Math.sin(this.pulse[i] * Math.PI);
        _c.copy(L.team ? U.uTeam1.value : U.uTeam0.value).multiplyScalar(1.4 * k + 0.4);
      } else {
        const isIn = R ? R._isInNow(e) : e.inWhen !== 'never', open = R ? R.open(e) : isIn;
        if (leg.way === 'two') _c.setRGB(open ? 1.15 : 0.35, open ? 1.12 : 0.35, open ? 1.05 : 0.35);
        else if (isIn && open) _c.setRGB(1.25, 1.12, 0.85);
        else _c.setRGB(0.12, 0.12, 0.14);
      }
      this.rings.setColorAt(i, _c);
    }
    if (this.rings.instanceColor) this.rings.instanceColor.needsUpdate = true;
    // fans: turn while their end is the open IN end, spin down otherwise; hidden at an OUT end
    for (let j = 0; j < this.fanEnds.length; j++) {
      const e = this.fanEnds[j];
      const isIn = R ? R._isInNow(e) : e.inWhen !== 'never', open = R ? R.open(e) : isIn;
      this.fanW[j] += ((isIn && open ? 16 : 0) - this.fanW[j]) * Math.min(1, dt * 1.5);
      this.fanA[j] += this.fanW[j] * dt;
      const q = this.endQ[e.i];
      _qt.setFromAxisAngle(Z, this.fanA[j]); _qt.premultiply(q);
      _m.compose(_p.set(e.pos[0] + e.out[0] * 0.07, e.pos[1], e.pos[2] + e.out[2] * 0.07), _qt, _s.setScalar(isIn ? 1 : 0.0001));   // (in the bore's mouth)
      this.fans.setMatrixAt(j, _m);
    }
    this.fans.instanceMatrix.needsUpdate = true;
    // flaps: at OUT ends (both ends of a two-way leg), swung open by a pop, rattled by a refusal
    for (let i = 0; i < E.length; i++) {
      const e = E[i], leg = this.X.legs[e.leg];
      const isOut = leg.way === 'two' || !(R ? R._isInNow(e) : e.inWhen !== 'never');
      this.flapV[i] += (-this.flapA[i] * 40 - this.flapV[i] * 7) * dt;
      this.flapA[i] = Math.max(0, Math.min(1.3, this.flapA[i] + this.flapV[i] * dt));
      let ang = this.flapA[i];
      if (this.rattleT[i] > 0) { this.rattleT[i] -= dt; ang += 0.07 * Math.sin(this.t * 60) * (this.rattleT[i] / 0.45); }
      _qt.setFromEuler(_e.set(-ang, 0, 0)); _qt.premultiply(this.endQ[i]);
      _m.compose(_p.set(e.pos[0] + e.out[0] * 0.1, e.pos[1] + 0.8, e.pos[2] + e.out[2] * 0.1), _qt, _s.setScalar(isOut ? 1 : 0.0001));
      this.flaps.setMatrixAt(i, _m);
    }
    this.flaps.instanceMatrix.needsUpdate = true;
    // signs: riffle in the warning, after a flip; floor arrows lit at open one-way IN ends
    for (let i = 0; i < E.length; i++) {
      const e = E[i], leg = this.X.legs[e.leg];
      if (!leg.flip) continue;
      const ph = this.tidePhase[leg.i];
      if (this.riffle[i] > 0) this.riffle[i] -= dt;
      const scr = this.riffle[i] > 0 || (ph === 'warn' && (this.t % 1) < 0.35);
      this._signFor(i, scr);
    }
    for (let j = 0; j < this.arrowEnds.length; j++) {
      const e = this.arrowEnds[j], isIn = R ? R._isInNow(e) : e.inWhen !== 'never', open = R ? R.open(e) : isIn;
      this.glowAttr.setX(E.length + j, isIn ? (open ? 1.25 + 0.25 * Math.sin(this.t * 4) : 0.25) : 0);
    }
    this.glowAttr.needsUpdate = true;
    // the grade
    const target = this.uwOn ? 1 : 0;
    this.uwK += (target - this.uwK) * Math.min(1, dt * 10);
    this.uw.visible = !!this.rideVol || this.uwK > 0.01;
    this.uw.material.uniforms.uK.value = this.uwK;
  }

  dispose() {
    this.underwater(null);
    this.group.removeFromParent();
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this.tex?.dispose();
  }
}
