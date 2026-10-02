// Status looks on the players.
//   tracked    (Echo Orb, Lurk Mine, Tracer Bolt, Deep Sonar: status.track / status.reveal). 2026-10-02, the user (with a
//              Splatoon screenshot): "replace the tracking effect again, this time to have an arrow circle around the
//              player using the colour of the enemy, and if you're the one tracking the player, a thin line directly to
//              the middle of the player. dont show their name." — then: "everyone on the tracking team should get a line
//              not just the user. anyone on the tracking team sees the line and the arrow through walls. if im tracked
//              then i just see arrow on me. if my teammates is getting tracked, i see the arrow but not through walls". So:
//                · ONE arrow wrapped round them like a label round a can — the game's own squid icon (ui-icons.js
//                  SQUID) turned on its side and stretched out (the user, with Splatoon 3's Wave Breaker ring: "one
//                  continuous arrow, but its flat, rolled up like a cylinder, and rotates around the player", "make the
//                  circle closer to the player … notice how its more rounded in Splatoon", "those are eyes of the squid
//                  icon rotated 90 degrees and lengthened into an arrow"): the squid's mantle is the arrowhead (its
//                  rounded point the tip, its fins the plump barbs, their backs curving into the shaft), its two eyes
//                  sit in the head one above the other, its body is the long shaft (round-ended), its four tentacles
//                  the rounded lobes of the tail. Rolled onto an upright cylinder hugging them at waist / chest height
//                  (BAND_R, opened out just enough round a long or wide weapon so it never cuts through it), spanning
//                  ARC (~312°) so the head nearly meets the tail; a soft gradient across its height (darker up top), a
//                  gloss streak, a lighter rim; both sides drawn, its inside (the far side) darker; unlit, in the
//                  TRACKING team's colour (the tracked player's enemy); where it's hidden (the trackers see it through
//                  walls) a see-through fill inside a firm rim. It turns round them the way it points (a turn every
//                  2π/SPIN ≈ 2.6 s) and bobs a little. Far off it grows (its head at least MIN_F of the screen's
//                  height); up close it never shrinks;
//                · who sees what, on each screen (the local player's — StatusFx.viewer in tests / pictures):
//                    on the TRACKING team   the arrow through walls (a second, occluded pass: GreaterDepth) and a thin
//                                           line (Line2, LINE_PX screen px) from your chest to the middle of theirs,
//                                           through walls, in your team's colour — one per tracked enemy, whoever threw;
//                    the tracked player     the arrow round your own kid, a little fainter; no line;
//                    their teammates        the arrow, depth-tested (not through walls); no line.
//                  (Bots draw nothing: it's only the local view.)
//                · no name: the HUD's world markers no longer tag tracked enemies (main.js _updateHud).
//              The old see-through sonar shell and its ground ping are gone.
//   poisoned   (Murk Bomb: status.poison) — murky purple-grey bubbles and wisps rising off them, a few at a time.
// They follow each player's status: local players' and bots' own, and for a remote player online the owner's word too
// (net/netmatch.js packs statusBits() into the actor tick → a.netStatus; two teams, so "tracked" is by the other one), so
// every screen shows them while they last and drops them when they end. Pooled: one wrapped arrow (+ a line, made the
// first time it's needed) per player, one instanced draw for every poison particle (capped at MAXP); nothing is
// allocated per frame. Updated by SubSystem.update.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { G } from '../core/ctx.js';

export const NET_TRACKED = 1, NET_POISONED = 2;
// the team tracking `a` (-1: nobody). Two teams: a remote player the owner says is tracked is tracked by the other one
export function trackedBy(a) {
  const st = a.status;
  if (st) {
    if (st.track > 0 && st.trackTeam >= 0) return st.trackTeam;
    if (st.reveal > 0 && st.revealTeam >= 0) return st.revealTeam;
  }
  if (a.remote && (a.netStatus & NET_TRACKED)) return 1 - a.team;
  return -1;
}
export const isPoisoned = (a) => (a.status && a.status.poison > 0) || !!(a.remote && (a.netStatus & NET_POISONED));
// the owner's side (the actor tick): what this player's own status says
export function statusBits(a) {
  const st = a.status;
  return st ? ((st.track > 0 || st.reveal > 0) ? NET_TRACKED : 0) | (st.poison > 0 ? NET_POISONED : 0) : 0;
}

// the wrapped arrow (the band). Its shape comes from the game's squid icon (64-unit box), U metres a unit
const U = 0.0098;
export const BAND_R = 0.62, BAND_Y = 0.85;  // round a kid (m): the cylinder's least radius, its middle over the feet (a kid is 1.45 tall)
export const ROOM = 0.06;                   // … opened out to a held weapon's reach (within its height) + this
const RELAX = 4;                            // 1/s: and back in once the weapon's in again
const SQUID_K = 0.8, BAND_Y_SQ = 0.42;      // round a squid: × 0.8, lower
export const SHAFT_H = 28 * U;              // the arrow (m): its shaft's height (the icon's body); its head's: HEAD_H, below
export const ARC = 5.45;                    // rad round the cylinder it spans, tentacle tips to the head's tip (~312°)
export const SPIN = (2 * Math.PI) / 2.6;    // rad/s round them, the way it points (a turn every 2.6 s)
const BOB = 0.03, BOB_W = 2.2;              // its bob (m, rad/s)
export const MIN_F = 0.016;                 // far off: its head's height on screen at least this share of the screen's height
export const SELF_A = 0.55;                 // on your own kid (the follow view): a little fainter
const MATE_A = 1, XRAY_A = 0.9;             // depth-tested for the tracked player's teammates; its hidden parts for the trackers
const POP = 0.22;                           // s: a fresh one pops in
// the line (the tracking team's view)
export const LINE_PX = 1.75, LINE_A = 0.72; // width (screen px), opacity
export const CHEST = 0.95, CHEST_SQ = 0.3;  // the middle of a kid / a squid over its feet (m)
const LINE_OFF = 0.3;                       // it leaves your chest this far toward them (not from inside your own kid)
// poison
const MAXP = 220;                          // poison particles alive at once (every player together)
const RATE = 14, RATE_SELF = 7;            // poison particles a second off a player (off your own kid)
const SELF_SIZE = 0.8;                     // … and their size off your own kid (the follow view: never in your way)

export const chestY = (a) => (a.form === 'squid' ? CHEST_SQ : CHEST);
const TAU = Math.PI * 2;

// (see-through looks stay out of the GTAO normal / depth pass: drawn solid there they'd darken what's behind — subs.js
// noAO; on geometry only these use)
const noAO = (mesh) => { mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; return mesh; };

// the arrowhead: the squid icon's mantle — its rounded point, a fin with a round end, the fin's back curving into the body
// (a fillet), the body down to where the shaft takes over — sampled from the icon's own curves (src/ui/ui-icons.js
// SQUID), right half (y ≥ 0; the shader mirrors it), turned on its side: metres back from the tip × metres up, closed
// just under the middle line (so the halves meet without a seam)
const bz = (pts, n, out) => {
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const w = pts.length === 4 ? [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] : [u * u, 2 * u * t, t * t];
    out.push([w.reduce((a, k, j) => a + k * pts[j][0], 0), w.reduce((a, k, j) => a + k * pts[j][1], 0)]);
  }
};
const HEAD_CUT = 40;                        // icon y where the body becomes the shaft (the tip is at y 3)
const HEAD_ICON = (() => {
  const o = [[32, 3]];
  bz([[32, 3], [38.5, 3], [53.5, 13.5], [56.5, 23.5]], 18, o);              // the mantle's side, out to the fin (a little plumper than the icon's)
  bz([[56.5, 23.5], [58.5, 28], [55.5, 32], [51, 31]], 10, o);              // the fin's round end
  const c = [46, 29.6], f = [51 - 46, 31 - 29.6], fl = Math.hypot(f[0], f[1]);
  bz([[c[0] + (f[0] / fl) * 5, c[1] + (f[1] / fl) * 5], c, [46, 34.6]], 9, o);   // the fin's back curving into the body
  o.push([46, HEAD_CUT]);
  return o;
})();
const HEAD_PTS = [...HEAD_ICON.map(([x, y]) => [-(y - 3) * U, (x - 32) * U]), [-(HEAD_CUT - 3) * U, -0.05], [0, -0.05]];
export const HEAD_H = 2 * Math.max(...HEAD_PTS.map((p) => p[1]));   // the head's height (m): the fins, ~1.8× the shaft's
const HEAD_LEN = (HEAD_CUT - 3) * U;        // tip → where the shaft takes over (m)

// the arrow, one piece: a strip of upright cylinder wall (unit radius: the mesh's scale puts it at the band's radius)
// from just behind the tentacles round ARC to just past the tip, facing out, as tall as the head and tentacles only at
// the ends (the shaft's height + a margin elsewhere, so it hugs the arrow); aPY: its angle round, metres up from its
// middle — the shader cuts the arrow out of it (in metres along it: the angle × the radius, so a wider band only
// lengthens the shaft). Two groups over the same triangles: its inside (the far side) is drawn first, then its outside,
// so the near side always lies over the far one
const BAND_PAD = 0.1, BAND_N = 160;
const TALL_TAIL = 0.42, TALL_HEAD = 0.72;   // rad from each end the strip stands the head's height (the head and tentacles at BAND_R)
export function bandGeometry() {
  const HT = HEAD_H / 2 + 0.02, HS = SHAFT_H / 2 + 0.02, p0 = -BAND_PAD, p1 = ARC + BAND_PAD;
  const pos = [], nor = [], py = [], idx = [];
  for (let i = 0; i <= BAND_N; i++) {
    const phi = p0 + ((p1 - p0) * i) / BAND_N, x = Math.sin(phi), z = Math.cos(phi);
    const H = phi < TALL_TAIL || phi > ARC - TALL_HEAD ? HT : HS;
    for (const y of [-H, H]) { pos.push(x, y, z); nor.push(x, 0, z); py.push(phi, y); }
  }
  // (seen from outside, along increases to the right: counter-clockwise from outside)
  for (let i = 0; i < BAND_N; i++) { const b0 = i * 2; idx.push(b0, b0 + 2, b0 + 3, b0, b0 + 3, b0 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPY', new THREE.Float32BufferAttribute(py, 2));
  g.setIndex(idx);
  g.addGroup(0, idx.length, 0); g.addGroup(0, idx.length, 1);
  return g;
}
const f4 = (x) => x.toFixed(4), v2s = (p) => `vec2(${f4(p[0])}, ${f4(p[1])})`;
const BAND_VS = /* glsl */`
  attribute vec2 aPY; uniform float uR; varying vec2 vSY;
  void main(){
    vSY = vec2(aPY.x * uR, aPY.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
// the squid arrow as a distance field (metres along × up; q mirrors it about the middle line): the mantle polygon, the
// round-ended shaft, four tentacles (tapered, round-tipped, the outer pair swept out) smoothly joined on. Unlit: the
// team colour darker toward the top, a gloss streak under the middle, a lighter rim, the mantle's highlight near the
// tip; the eyes (white, a dark rim, a dark pupil looking ahead) stacked in the head with a clear gap; crisp at any
// size (each edge smoothed over a pixel, fwidth); its inside (the far side) darker
const BAND_FS = /* glsl */`
  uniform vec3 uColor; uniform float uAlpha; uniform float uXray; uniform float uR;
  varying vec2 vSY;
  const vec2 HEAD[${HEAD_PTS.length}] = vec2[${HEAD_PTS.length}](${HEAD_PTS.map(v2s).join(', ')});
  float sdHead(vec2 p){
    float d = dot(p - HEAD[0], p - HEAD[0]), s = 1.0;
    for (int i = 0, j = ${HEAD_PTS.length - 1}; i < ${HEAD_PTS.length}; j = i, i++) {
      vec2 e = HEAD[j] - HEAD[i], w = p - HEAD[i], b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
      d = min(d, dot(b, b));
      bvec3 c = bvec3(p.y >= HEAD[i].y, p.y < HEAD[j].y, e.x * w.y > e.y * w.x);
      if (all(c) || all(not(c))) s *= -1.0;
    }
    return s * sqrt(d);
  }
  float sdRBox(vec2 p, vec2 c, vec2 h, float r){ vec2 q = abs(p - c) - h + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(ra, rb, h); }
  float sdEll(vec2 p, vec2 c, vec2 r){ return (length((p - c) / r) - 1.0) * min(r.x, r.y); }
  float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
  float fill(float d){ float aa = max(fwidth(d), 1e-4); return 1.0 - smoothstep(-aa, aa, d); }
  void main(){
    const float U = ${f4(U)}, SH = ${f4(SHAFT_H / 2)}, HH = ${f4(HEAD_H / 2)}, HL = ${f4(HEAD_LEN)};
    vec2 p = vSY, q = vec2(p.x, abs(p.y));
    float L = ${f4(ARC)} * uR;                                      // the tip
    // the shaft (the squid's body, stretched; round-ended), on under the head; the head where it is
    float d = sdRBox(p, vec2((0.1 + L - HL + 0.25) * 0.5, 0.0), vec2((L - HL + 0.25 - 0.1) * 0.5, SH), 0.06);
    if (p.x > L - HL - 0.06) d = min(d, sdHead(vec2(p.x - L, q.y)));
    // the tentacles: the inner pair straight back, the outer pair swept out; tapered, round-tipped
    float t = min(sdTaper(q, vec2(0.17, 3.2 * U), vec2(0.17 - 14.0 * U, 4.4 * U), 4.0 * U, 3.3 * U),
                  sdTaper(q, vec2(0.17, 9.0 * U), vec2(0.17 - 12.0 * U, 13.5 * U), 4.2 * U, 3.4 * U));
    d = smin(d, t, 0.025);
    float a = fill(d);
    if (a < 0.004) discard;
    // its colour: darker toward the top, a gloss streak under the middle, a lighter rim, the mantle's highlight
    vec3 c = uColor * (1.12 - 0.5 * clamp((p.y + HH) / (2.0 * HH), 0.0, 1.0));
    c += 0.16 * exp(-pow((p.y + 0.32 * SH) / (0.3 * SH), 2.0));
    float rim = 1.0 - smoothstep(0.0, 0.022, -d);
    c = mix(c, vec3(1.0), 0.4 * rim);
    vec2 hp = vec2(p.x - L, p.y);
    float hs = length(hp - vec2(-10.0 * U, -7.0 * U) - clamp(dot(hp - vec2(-10.0 * U, -7.0 * U), vec2(4.8, 6.5) * U) / dot(vec2(4.8, 6.5) * U, vec2(4.8, 6.5) * U), 0.0, 1.0) * vec2(4.8, 6.5) * U);
    c = mix(c, vec3(1.0), 0.35 * (1.0 - smoothstep(0.6 * U, 2.0 * U, hs)));
    // the eyes: white, a dark rim, a dark pupil looking ahead; one above the other with a clear gap
    vec2 ec = vec2(L - 33.0 * U, 6.6 * U);
    float eo = sdEll(q, ec, vec2(5.4, 4.3) * U), ew = eo + 0.9 * U, ep = sdEll(q, ec + vec2(1.1, -0.7) * U, vec2(3.0, 2.4) * U);
    vec3 ink = vec3(0.007, 0.006, 0.011);
    c = mix(c, ink, fill(eo)); c = mix(c, vec3(0.93, 0.94, 0.97), fill(ew)); c = mix(c, ink, fill(ep));
    if (!gl_FrontFacing) c *= 0.6;   // its inside: the far side, darker
    // seen through something (the trackers' hidden-part pass): a see-through fill inside a firm rim
    a *= mix(1.0, mix(0.45, 1.0, 1.0 - smoothstep(0.0, 0.05, -d)), uXray);
    gl_FragColor = vec4(c, a * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// poison particles: camera-facing quads (world-sized: the same at any render scale), one instanced draw.
// aP: centre xyz + size (m) · aD: alpha, kind (0 bubble, 1 wisp), seed, age 0 … 1
const PART_VS = /* glsl */`
  attribute vec4 aP; attribute vec4 aD;
  varying vec2 vUv; varying vec4 vD; varying float vNear;
  void main(){
    vUv = position.xy * 2.0; vD = aD;
    vec4 mv = modelViewMatrix * vec4(aP.xyz, 1.0);
    vNear = smoothstep(0.9, 2.2, -mv.z);   // (fades out right in front of the camera: never a screenful)
    mv.xy += position.xy * aP.w;
    gl_Position = projectionMatrix * mv;
  }`;
const PART_FS = /* glsl */`
  varying vec2 vUv; varying vec4 vD; varying float vNear;
  void main(){
    float d = length(vUv);
    if (d > 1.0 || vD.x < 0.004) discard;
    vec3 c; float a;
    if (vD.y < 0.5) {
      // a bubble: a dark, murky purple body, a thin violet rim, a glint up top
      float rim = smoothstep(0.74, 0.93, d) * smoothstep(1.0, 0.94, d);
      float glint = smoothstep(0.22, 0.0, length(vUv - vec2(-0.34, 0.38)));
      c = mix(vec3(0.04, 0.019, 0.064), vec3(0.32, 0.17, 0.57), rim);   // (linear: sRGB #382748 → #9973c7)
      c = mix(c, vec3(0.89, 0.83, 1.0), glint);
      a = max(0.86 * smoothstep(1.0, 0.9, d), rim) + glint * 0.5;
    } else {
      // a wisp: a soft murky purple-grey puff, darker at its heart
      float k = (1.0 - smoothstep(0.0, 1.0, d)) * (0.88 + 0.12 * sin(vD.z * 40.0 + d * 7.0));
      c = mix(vec3(0.12, 0.084, 0.147), vec3(0.022, 0.013, 0.033), k);   // (linear: sRGB #61526b → #291f33)
      a = sqrt(k) * 0.62;
    }
    gl_FragColor = vec4(c, a * vD.x * vNear);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// a tiny seeded random of our own (the FX never draw from Math.random: gameplay runs stay comparable)
let _seed = 0x2f6b1a3;
const rnd = () => ((_seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const _p = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Vector3();
// a sample of a geometry's vertices (local: every few, and its extremes along each axis — a barrel's muzzle, a
// canopy's rim), cached per geometry (made again if its positions change)
const _samples = new WeakMap(), _stack = [];
function samplesOf(geo) {
  const P = geo.attributes.position;
  let e = _samples.get(geo);
  if (e && e.ver === P.version) return e.v;
  const n = P.count, keep = new Set(), step = Math.max(1, Math.floor(n / 256));
  for (let i = 0; i < n; i += step) keep.add(i);
  for (let k = 0; k < 3; k++) {
    let lo = 0, hi = 0;
    for (let i = 1; i < n; i++) { const x = P.getComponent(i, k); if (x < P.getComponent(lo, k)) lo = i; if (x > P.getComponent(hi, k)) hi = i; }
    keep.add(lo); keep.add(hi);
  }
  const v = new Float32Array(keep.size * 3);
  let j = 0;
  for (const i of keep) { v[j++] = P.getX(i); v[j++] = P.getY(i); v[j++] = P.getZ(i); }
  _samples.set(geo, (e = { v, ver: P.version }));
  return v;
}
// the furthest (squared, horizontally from cx, cz) any visible rigid mesh under `root` reaches between heights y0 … y1
function reachUnder(root, cx, cz, y0, y1) {
  if (!root) return 0;
  root.updateWorldMatrix(true, true);
  let best = 0;
  const st = _stack;
  st.length = 0;
  for (const o of root.children) st.push(o);
  while (st.length) {
    const o = st.pop();
    if (!o.visible) continue;
    for (const k of o.children) st.push(k);
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.geometry?.attributes?.position) continue;
    const v = samplesOf(o.geometry), m = o.matrixWorld.elements;
    for (let i = 0; i < v.length; i += 3) {
      const x = v[i], y = v[i + 1], z = v[i + 2], wy = m[1] * x + m[5] * y + m[9] * z + m[13];
      if (wy < y0 || wy > y1) continue;
      const wx = m[0] * x + m[4] * y + m[8] * z + m[12] - cx, wz = m[2] * x + m[6] * y + m[10] * z + m[14] - cz;
      if (wx * wx + wz * wz > best) best = wx * wx + wz * wz;
    }
  }
  return best;
}
const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

export class StatusFx {
  constructor(scene) {
    this.scene = scene;
    this.recs = new Map();       // actor → { wrapped arrow, line, poison emitter }
    this.parts = [];             // live poison particles
    this.time = 0;
    this.viewer = null;          // (tests / pictures) whose eyes: an actor, or null = the local player
    this.bandGeo = null;         // the wrapped arrow's strip (every player's: made the first time it's needed)
    this.stats = { bands: 0, xray: 0, lines: 0, parts: 0, emitted: 0 };   // (tests read it)
    this._buildParts();
  }
  _buildParts() {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.aP = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4); this.aP.setUsage(THREE.DynamicDrawUsage);
    this.aD = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4); this.aD.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aP', this.aP); g.setAttribute('aD', this.aD);
    g.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({ vertexShader: PART_VS, fragmentShader: PART_FS, transparent: true, depthWrite: false });
    this.partMesh = noAO(new THREE.Mesh(g, mat));
    this.partMesh.frustumCulled = false; this.partMesh.renderOrder = 6;
    this.scene.add(this.partMesh);
  }
  _rec(a) {
    let r = this.recs.get(a);
    if (r) return r;
    // the arrow: one strip, drawn depth-tested — and for the trackers once more where something stands in front of it
    // (first, so the depth-tested draw lies over it where it's in sight)
    const geo = this.bandGeo || (this.bandGeo = bandGeometry());
    const col = { value: new THREE.Color() }, rad = { value: BAND_R };
    const mk = (xray) => {
      const u = { uColor: col, uAlpha: { value: 0 }, uXray: { value: xray ? 1 : 0 }, uR: rad };
      const mat = (side) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: BAND_VS, fragmentShader: BAND_FS, transparent: true, depthWrite: false, side, depthFunc: xray ? THREE.GreaterDepth : THREE.LessEqualDepth });
      // (the depth-tested arrow's near side stands in the GTAO normal / depth pass — the strip hugs the arrow — so its
      // pixels take their ambient occlusion from it, none, not from whatever's behind it: a wall's edge, the kid's body
      // would darken across it. The far side, the strip's inside facing away, is culled there; the hidden-part pass
      // stays out: noAO)
      const m = new THREE.Mesh(geo, [mat(THREE.BackSide), mat(THREE.FrontSide)]);
      if (xray) noAO(m);
      m.frustumCulled = false; m.visible = false; m.renderOrder = xray ? 6 : 7;
      return m;
    };
    const band = mk(false), bandX = mk(true);
    this.scene.add(band, bandX);
    r = { a, band, bandX, line: null, on: false, t0: 0, team: -1, form: 0, spin: 0, size: 1, R: BAND_R, reach: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), emit: 0, poisoned: false };
    this.recs.set(a, r);
    return r;
  }
  // whose eyes the looks follow: StatusFx.viewer (tests, pictures) or the local player; their team (no player: the
  // subs' view team — a spectator sees what a team sees)
  eyes() { return this.viewer || G.local || null; }
  // per frame (after everyone moved)
  update(dt) {
    this.time += dt;
    const actors = G.actors || [];
    // a player gone with the match they were in: their looks go too
    for (const [a, r] of this.recs) if (!actors.includes(a)) this._drop(r);
    const me = this.eyes(), vt = me ? me.team : (G.subs?.viewTeam?.() ?? -1), cam = G.camera;
    let bands = 0, xray = 0, lines = 0;
    for (const a of actors) {
      const shown = a.alive && a.character?.root?.visible !== false;
      const team = shown ? trackedBy(a) : -1;
      let r = this.recs.get(a);
      if (team >= 0) {
        r = r || this._rec(a);
        if (!r.on || r.team !== team) { r.on = true; r.t0 = this.time; r.team = team; r.R = BAND_R; r.band.material[0].uniforms.uColor.value.copy(G.teamColors[team]); }
        this._band(r, a, dt, me, vt, cam);
        bands++; if (r.bandX.visible) xray++;
        // the line: on the tracking team's screens (whoever threw), from your kid while you're up
        if (me && me.team === team && me !== a && me.alive) { this._line(r, a, me); lines++; }
        else if (r.line) r.line.visible = false;
      } else if (r && r.on) this._off(r);
      // poison: emit while it lasts
      if (shown && isPoisoned(a)) {
        r = r || this._rec(a);
        r.poisoned = true;
        r.emit += dt * (a === G.local ? RATE_SELF : RATE);
        while (r.emit >= 1) { r.emit -= 1; this._spawn(a); }
      } else if (r) { r.poisoned = false; r.emit = 0; }
    }
    this._stepParts(dt);
    this.stats.bands = bands; this.stats.xray = xray; this.stats.lines = lines; this.stats.parts = this.parts.length;
  }
  _off(r) {
    r.on = false;
    r.band.visible = r.bandX.visible = false;
    if (r.line) r.line.visible = false;
  }
  _band(r, a, dt, me, vt, cam) {
    const self = a === me, xray = !self && vt === r.team;   // (the trackers: through walls)
    a.visualPos ? a.visualPos(_p) : _p.copy(a.pos);
    // kid → squid: it sinks and tightens round the squid (smoothly)
    r.form += ((a.form === 'squid' ? 1 : 0) - r.form) * Math.min(1, dt * 12);
    const k0 = 1 + (SQUID_K - 1) * r.form, Y = BAND_Y + (BAND_Y_SQ - BAND_Y) * r.form;
    r.spin = (r.spin + SPIN * dt) % TAU;
    const age = this.time - r.t0, pop = Math.min(1, age / POP);
    _c.set(_p.x, _p.y + Y, _p.z);
    const s = cam ? this._grow(_c, cam, HEAD_H * k0) : 1;   // (far off it grows; up close it never shrinks)
    r.size = s;
    const sc = k0 * s, y = _c.y + Math.sin(this.time * BOB_W) * BOB * Math.min(s, 1.5);
    // its radius: BAND_R round the kid, or out past whatever's in their hands within the band's height (a charger's
    // barrel, an open brolly, a blade's swing) by ROOM — at once — and back in when it's in again
    const hh = (HEAD_H / 2) * sc + 0.02;
    r.reach = this._reach(a, _c.x, _c.z, y - hh, y + hh);
    const want = Math.max(BAND_R, (r.reach + ROOM) / sc);
    r.R = want > r.R ? want : r.R + (want - r.R) * Math.min(1, dt * RELAX);
    const sy = sc * (0.35 + 0.65 * easeOutBack(pop));   // (popping in: it grows to its height)
    for (const m of [r.band, r.bandX]) { m.position.set(_c.x, y, _c.z); m.rotation.y = r.spin; m.scale.set(r.R * sc, sy, r.R * sc); }
    const u = r.band.material[0].uniforms;
    u.uR.value = r.R;
    const fade = Math.min(1, age / (POP * 0.6));
    r.band.visible = true;
    u.uAlpha.value = fade * (self ? SELF_A : xray ? 1 : MATE_A);
    r.bandX.visible = xray;
    r.bandX.material[0].uniforms.uAlpha.value = fade * XRAY_A;
  }
  // far off: the scale that keeps something `h` tall at `c` at least MIN_F of the screen's height (its depth along the
  // view); up close nothing shrinks
  _grow(c, cam, h) {
    cam.getWorldDirection(_f);
    const th = Math.tan((cam.fov * Math.PI) / 360) / (cam.zoom || 1);
    const z = Math.max(cam.near || 0.1, (c.x - cam.position.x) * _f.x + (c.y - cam.position.y) * _f.y + (c.z - cam.position.z) * _f.z);
    const f = h / (2 * z * th);
    return f < MIN_F ? MIN_F / f : 1;
  }
  // how far from (cx, cz) whatever's in their hands reaches between the heights y0 … y1 (a sample of each mesh's
  // vertices, their extremes among them: samplesOf)
  _reach(a, cx, cz, y0, y1) {
    const b = a.form === 'squid' ? null : a.character?.bones;
    if (!b) return 0;
    return Math.sqrt(Math.max(reachUnder(b.handR, cx, cz, y0, y1), reachUnder(b.handL, cx, cz, y0, y1)));
  }
  // the tracking team's line: your chest → theirs, through walls, in your colour
  _line(r, a, me) {
    const l = r.line || (r.line = this._mkLine());
    me.visualPos ? me.visualPos(_s) : _s.copy(me.pos); _s.y += chestY(me);
    a.visualPos ? a.visualPos(_e) : _e.copy(a.pos); _e.y += chestY(a);
    _c.set(_e.x - _s.x, 0, _e.z - _s.z);
    const d = _c.length();
    if (d > 1e-3) _s.addScaledVector(_c, Math.min(LINE_OFF, d * 0.5) / d);
    r.from.copy(_s); r.to.copy(_e);
    const buf = l.geometry.attributes.instanceStart.data;
    buf.array[0] = _s.x; buf.array[1] = _s.y; buf.array[2] = _s.z; buf.array[3] = _e.x; buf.array[4] = _e.y; buf.array[5] = _e.z;
    buf.needsUpdate = true;
    const m = l.material;
    m.color.copy(G.teamColors[me.team]);
    m.opacity = LINE_A * Math.min(1, (this.time - r.t0) / POP);
    m.resolution.set(innerWidth || 1, innerHeight || 1);   // (CSS px: the same width at any render scale)
    l.visible = true;
  }
  _mkLine() {
    const g = new LineGeometry(); g.setPositions([0, 0, 0, 0, 0, 1]);
    const m = new LineMaterial({ color: 0xffffff, linewidth: LINE_PX, transparent: true, opacity: LINE_A, depthTest: false, depthWrite: false });
    const l = noAO(new Line2(g, m));
    l.frustumCulled = false; l.renderOrder = 8; l.visible = false;
    this.scene.add(l);
    return l;
  }
  // one poison particle off `a`: a bubble (55 %) or a wisp, from round the body, rising
  _spawn(a) {
    if (this.parts.length >= MAXP) return;
    const squid = a.form === 'squid', ang = rnd() * Math.PI * 2, rr = 0.12 + rnd() * 0.26;
    const bub = rnd() < 0.55;
    const h = squid ? 0.08 + rnd() * 0.4 : 0.3 + rnd() * 1.05;
    a.visualPos ? a.visualPos(_p) : _p.copy(a.pos);
    this.parts.push({
      x: _p.x + Math.cos(ang) * rr, y: _p.y + h, z: _p.z + Math.sin(ang) * rr,
      vx: Math.cos(ang) * 0.12 + a.vel.x * 0.25, vy: (bub ? 0.5 : 0.35) + rnd() * 0.45, vz: Math.sin(ang) * 0.12 + a.vel.z * 0.25,
      bub, t: 0, life: bub ? 0.9 + rnd() * 0.5 : 1.2 + rnd() * 0.6, size: (bub ? 0.1 + rnd() * 0.08 : 0.28 + rnd() * 0.16) * (a === G.local ? SELF_SIZE : 1), seed: rnd(),
    });
    this.stats.emitted++;
  }
  _stepParts(dt) {
    const P = this.parts, ap = this.aP.array, ad = this.aD.array;
    let n = 0;
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i];
      q.t += dt;
      if (q.t >= q.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    }
    for (const q of P) {
      const u = q.t / q.life;
      // bubbles wobble up and pop; wisps drift, swell and thin out
      const wob = q.bub ? Math.sin(q.t * 9 + q.seed * 20) * 0.25 : Math.sin(q.t * 2.5 + q.seed * 10) * 0.12;
      q.x += (q.vx + wob * 0.6) * dt; q.y += q.vy * dt; q.z += (q.vz + wob * 0.4) * dt;
      q.vx *= 1 - dt * 1.5; q.vz *= 1 - dt * 1.5;
      const o = n * 4;
      ap[o] = q.x; ap[o + 1] = q.y; ap[o + 2] = q.z;
      ap[o + 3] = q.bub ? q.size * (0.7 + 0.3 * Math.min(1, u * 5)) * (u > 0.88 ? 1.25 : 1) : q.size * (0.6 + 0.9 * u);
      ad[o] = q.bub ? Math.min(1, u * 8) * (u > 0.9 ? Math.max(0, 1 - (u - 0.9) * 10) : 1) : Math.min(1, u * 5) * (1 - u) * 1.2;
      ad[o + 1] = q.bub ? 0 : 1; ad[o + 2] = q.seed; ad[o + 3] = u;
      n++;
    }
    this.partMesh.geometry.instanceCount = n;
    this.partMesh.visible = n > 0;
    if (n) { this.aP.needsUpdate = true; this.aD.needsUpdate = true; }
  }
  _drop(r) {
    this.scene.remove(r.band, r.bandX);
    for (const m of [...r.band.material, ...r.bandX.material]) m.dispose();
    if (r.line) { this.scene.remove(r.line); r.line.material.dispose(); r.line.geometry.dispose(); }
    this.recs.delete(r.a);
  }
  // a new match / everything cleared: no looks left over
  clear() {
    for (const r of [...this.recs.values()]) this._drop(r);
    this.parts.length = 0;
    this.partMesh.geometry.instanceCount = 0; this.partMesh.visible = false;
  }
}
