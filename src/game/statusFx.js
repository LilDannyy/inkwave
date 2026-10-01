// Status looks on the players.
//   tracked    (Echo Orb, Lurk Mine, Tracer Bolt, Deep Sonar: status.track / status.reveal). 2026-10-02, the user (with a
//              Splatoon screenshot): "replace the tracking effect again, this time to have an arrow circle around the
//              player using the colour of the enemy, and if you're the one tracking the player, a thin line directly to
//              the middle of the player. dont show their name." — then: "everyone on the tracking team should get a line
//              not just the user. anyone on the tracking team sees the line and the arrow through walls. if im tracked
//              then i just see arrow on me. if my teammates is getting tracked, i see the arrow but not through walls". So:
//                · ONE arrow wrapped round them like a label round a can (the user, on the first try's ring of
//                  chevrons: "its one arrow that is long enough to become a circle around the player. its a 2D arrow
//                  cylindrical around the player", and after it, with Splatoon 3's Wave Breaker ring for its style: "one
//                  continuous arrow, but its flat, rolled up like a cylinder, and rotates around the player"): a flat
//                  ribbon SHAFT_H tall with crisp edges and a lighter rim, a broad barbed head HEAD_H (1.8×) tall with a
//                  little "8" knocked out of it, a fletched tail (three swept-back feathers a side, a notch in its end) —
//                  rolled onto an upright cylinder BAND_R round them at waist / chest height, facing out, spanning ARC
//                  (~312°) so its head nearly meets its own tail; both sides drawn, its inside (the far side) darker;
//                  unlit, in the TRACKING team's colour (the tracked player's enemy); where it's hidden (the trackers
//                  see it through walls) it's a see-through fill inside a firm rim. It turns round them the way it
//                  points (a turn every 2π/SPIN ≈ 2.6 s) and bobs a little. Its size on screen is held: its head at
//                  least MIN_F of the screen's height far off (it grows), at most MAX_F up close (it shrinks, never
//                  below S_MIN round the kid);
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

// the wrapped arrow (the band)
export const BAND_R = 1.0, BAND_Y = 0.85;   // round a kid (m): the cylinder's radius, its middle over the feet (a kid is 1.45 tall)
const SQUID_K = 0.8, BAND_Y_SQ = 0.42;      // … round a squid: that × 0.8, lower
export const SHAFT_H = 0.26, HEAD_H = 0.47; // the arrow (m): its shaft's height, its head's (1.8×)
export const ARC = 5.45;                    // rad round the cylinder it spans, notch to tip (~312°)
const HEAD_LEN = 0.5, NOTCH = 0.1;          // its head's length along the band (barb to tip), its tail's notch (m)
export const SPIN = (2 * Math.PI) / 2.6;    // rad/s round them, the way it points (a turn every 2.6 s)
const BOB = 0.03, BOB_W = 2.2;              // its bob (m, rad/s)
export const MIN_F = 0.016, MAX_F = 0.11;   // its head's height on screen, as a share of the screen's height: at least / at most
export const S_MIN = 0.6;                   // … but up close it never shrinks below this (it stays round the kid)
export const SELF_A = 0.55;                 // on your own kid (the follow view): a little fainter
const MATE_A = 0.95, XRAY_A = 0.9;          // depth-tested for the tracked player's teammates; its hidden parts for the trackers
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

// the arrow, one piece: a strip of upright cylinder wall (radius BAND_R, the head's height + a margin) from just behind
// its tail round ARC to just past its tip, facing out; aSY: metres along it from the tail, metres up from its middle —
// the shader cuts the arrow out of it. Two groups over the same triangles: its inside (the far side) is drawn first,
// then its outside, so the near side always lies over the far one
const BAND_L = ARC * BAND_R, BAND_PAD = 0.04, BAND_N = 120;
export function bandGeometry() {
  const H = HEAD_H / 2 + BAND_PAD, s0 = -BAND_PAD, s1 = BAND_L + BAND_PAD;
  const pos = [], nor = [], sy = [], idx = [];
  for (let i = 0; i <= BAND_N; i++) {
    const sv = s0 + ((s1 - s0) * i) / BAND_N, phi = sv / BAND_R, x = Math.sin(phi), z = Math.cos(phi);
    for (const y of [-H, H]) { pos.push(x * BAND_R, y, z * BAND_R); nor.push(x, 0, z); sy.push(sv, y); }
  }
  // (seen from outside, along increases to the right: counter-clockwise from outside)
  for (let i = 0; i < BAND_N; i++) { const b0 = i * 2; idx.push(b0, b0 + 2, b0 + 3, b0, b0 + 3, b0 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aSY', new THREE.Float32BufferAttribute(sy, 2));
  g.setIndex(idx);
  g.addGroup(0, idx.length, 0); g.addGroup(0, idx.length, 1);
  return g;
}
const f3 = (x) => x.toFixed(4);
const BAND_VS = /* glsl */`
  attribute vec2 aSY; varying vec2 vSY;
  void main(){ vSY = aSY; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the arrow as a distance field (metres along × up): its body one polygon — a notched tail, the shaft, the barbed head —
// with three feathers a side swept back off the tail and a little "8" knocked out of the head. Unlit: the team colour,
// a lighter rim along its edges, crisp (smoothed only over a pixel), its inside (the far side) darker
const BAND_FS = /* glsl */`
  uniform vec3 uColor; uniform float uAlpha; uniform float uXray;
  varying vec2 vSY;
  float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
  float sdPoly(vec2 p, vec2 v[8]){
    float d = dot(p - v[0], p - v[0]), s = 1.0;
    for (int i = 0, j = 7; i < 8; j = i, i++) {
      vec2 e = v[j] - v[i], w = p - v[i], b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
      d = min(d, dot(b, b));
      bvec3 c = bvec3(p.y >= v[i].y, p.y < v[j].y, e.x * w.y > e.y * w.x);
      if (all(c) || all(not(c))) s *= -1.0;
    }
    return s * sqrt(d);
  }
  void main(){
    vec2 p = vSY, q = vec2(p.x, abs(p.y));
    const float L = ${f3(BAND_L)}, HB = ${f3(BAND_L - HEAD_LEN)}, SH = ${f3(SHAFT_H / 2)}, HH = ${f3(HEAD_H / 2)};
    // the body: notch → tail corner → along the shaft → barb → tip → barb → back along the shaft → tail corner
    vec2 v[8];
    v[0] = vec2(${f3(NOTCH)}, 0.0); v[1] = vec2(0.0, -SH); v[2] = vec2(HB + 0.04, -SH); v[3] = vec2(HB - 0.07, -HH);
    v[4] = vec2(L, 0.0); v[5] = vec2(HB - 0.07, HH); v[6] = vec2(HB + 0.04, SH); v[7] = vec2(0.0, SH);
    float d = sdPoly(p, v);
    // the fletching: three feathers a side, swept back and out off the tail
    for (int k = 0; k < 3; k++) { float a = 0.13 + 0.12 * float(k); d = min(d, sdSeg(q, vec2(a, SH * 0.4), vec2(a - 0.1, HH - 0.045)) - 0.034); }
    // the "8" knocked out of the head
    vec2 e = p - vec2(HB + 0.13, 0.0);
    d = max(d, -(min(abs(length(e - vec2(0.0, 0.044)) - 0.036), abs(length(e + vec2(0.0, 0.044)) - 0.036)) - 0.011));
    float aa = max(fwidth(d), 1e-4);
    float a = 1.0 - smoothstep(-aa, aa, d);
    if (a < 0.004) discard;
    float rim = 1.0 - smoothstep(0.0, 0.03, -d);
    vec3 c = mix(uColor, mix(uColor, vec3(1.0), 0.42), rim) * (0.9 + 0.1 * smoothstep(-HH, HH, p.y));
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
    const col = { value: new THREE.Color() };
    const mk = (xray) => {
      const u = { uColor: col, uAlpha: { value: 0 }, uXray: { value: xray ? 1 : 0 } };
      const mat = (side) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: BAND_VS, fragmentShader: BAND_FS, transparent: true, depthWrite: false, side, depthFunc: xray ? THREE.GreaterDepth : THREE.LessEqualDepth });
      const m = noAO(new THREE.Mesh(geo, [mat(THREE.BackSide), mat(THREE.FrontSide)]));
      m.frustumCulled = false; m.visible = false; m.renderOrder = xray ? 6 : 7;
      return m;
    };
    const band = mk(false), bandX = mk(true);
    this.scene.add(band, bandX);
    r = { a, band, bandX, line: null, on: false, t0: 0, team: -1, form: 0, spin: 0, size: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), emit: 0, poisoned: false };
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
        if (!r.on || r.team !== team) { r.on = true; r.t0 = this.time; r.team = team; r.band.material[0].uniforms.uColor.value.copy(G.teamColors[team]); }
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
    const s = cam ? this._clamp(_c, cam, HEAD_H * k0) : 1;
    r.size = s;
    const sc = k0 * s * (0.6 + 0.4 * easeOutBack(pop));
    const y = _c.y + Math.sin(this.time * BOB_W) * BOB * Math.min(s, 1.5);
    for (const m of [r.band, r.bandX]) { m.position.set(_c.x, y, _c.z); m.rotation.y = r.spin; m.scale.setScalar(sc); }
    const fade = Math.min(1, age / (POP * 0.6));
    r.band.visible = true;
    r.band.material[0].uniforms.uAlpha.value = fade * (self ? SELF_A : xray ? 1 : MATE_A);
    r.bandX.visible = xray;
    r.bandX.material[0].uniforms.uAlpha.value = fade * XRAY_A;
  }
  // the scale that holds something `h` tall at `c` between MIN_F and MAX_F of the screen's height (its depth along the
  // view), never below S_MIN
  _clamp(c, cam, h) {
    cam.getWorldDirection(_f);
    const th = Math.tan((cam.fov * Math.PI) / 360) / (cam.zoom || 1);
    const z = Math.max(cam.near || 0.1, (c.x - cam.position.x) * _f.x + (c.y - cam.position.y) * _f.y + (c.z - cam.position.z) * _f.z);
    const f = h / (2 * z * th);
    return Math.max(S_MIN, f < MIN_F ? MIN_F / f : f > MAX_F ? MAX_F / f : 1);
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
