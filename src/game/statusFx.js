// Status looks on the players (2026-10-02, the user: "whenever you're tracked apply a translucent sonar effect on the
// player so it's more obvious youre being tracked, as well as some sort of particle on you if you're poisoned"):
//   tracked    (Echo Orb, Lurk Mine, Tracer Bolt, Deep Sonar: status.track / status.reveal) — a translucent holographic
//              shell over the body in the TRACKER's team colour: a rim glow with scan lines and a ring of light running up
//              it, and every PULSE s a sonar ping — a shell of rings swelling outward off the body and a ring running out
//              along the ground, fading;
//   poisoned   (Murk Bomb: status.poison) — murky purple-grey bubbles and wisps rising off them, a few at a time.
// Everyone sees both on everyone (a player on themselves too, in the follow view: milder, so neither gets in the way).
// They follow each player's status: local players' and bots' own, and for a remote player online the owner's word too
// (net/netmatch.js packs statusBits() into the actor tick → a.netStatus), so every screen shows them while they last and
// drops them when they end. Pooled: one shell set per player (made the first time it's needed), one instanced draw for
// every poison particle (capped at MAXP); nothing is allocated per frame. Updated by SubSystem.update.
import * as THREE from 'three';
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

export const PULSE = 0.9;                  // s between sonar pings
const SELF_K = 0.4;                        // how strong the tracked look is on your own kid (the follow view)
const SHELL_R = 0.5, SHELL_H = 1.62;       // the shell round a kid (m): radius, height (a kid is 1.45 tall, 0.38 round)
const PING_OUT = 1.85, RING_R = 1.9;       // a ping's shell swells to this × the body; its ground ring runs out this far
const MAXP = 220;                          // poison particles alive at once (every player together)
const RATE = 14, RATE_SELF = 7;            // poison particles a second off a player (off your own kid)
const SELF_SIZE = 0.8;                     // … and their size off your own kid (the follow view: never in your way)

// the shell: a capsule standing on its base, y 0 … SHELL_H (shaders read the height as 0 … 1)
const SHELL_GEO = new THREE.CapsuleGeometry(SHELL_R, SHELL_H - 2 * SHELL_R, 8, 24).translate(0, SHELL_H / 2, 0);
const PING_GEO = SHELL_GEO.clone();
const RING_GEO = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
// (see-through looks stay out of the GTAO normal / depth pass: drawn solid there they'd darken what's behind — subs.js
// noAO; on geometry only these use)
const noAO = (mesh) => { mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; return mesh; };

const VIEW_VS = /* glsl */`
  varying vec3 vN; varying vec3 vV; varying float vY;
  uniform float uH;
  void main(){
    vY = position.y / uH;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
// the hologram: a rim glow, scan lines drifting up, a ring of light climbing the body once a ping (uK 0 … 1)
const SHELL_FS = /* glsl */`
  uniform vec3 uColor; uniform float uTime; uniform float uK; uniform float uAlpha;
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main(){
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float scan = 0.6 + 0.4 * step(0.45, fract(vY * 16.0 - uTime * 1.6));
    float band = smoothstep(0.07, 0.0, abs(vY - uK * 1.15 + 0.05)) * (1.0 - uK * 0.5);
    float a = ((0.08 + 0.62 * rim) * scan + band * 0.75) * uAlpha;
    vec3 c = mix(uColor * 1.15, vec3(1.0), clamp(band * 0.55 + rim * 0.2, 0.0, 1.0));
    gl_FragColor = vec4(c, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// a ping: the shell swelling outward, rings round it, fading as it goes
const PING_FS = /* glsl */`
  uniform vec3 uColor; uniform float uK; uniform float uAlpha;
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main(){
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
    float rings = smoothstep(0.32, 0.0, abs(fract(vY * 5.0) - 0.5) - 0.18);
    float fade = (1.0 - uK) * (1.0 - uK) * smoothstep(0.0, 0.06, uK);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.3 * rings), (0.12 + 0.88 * rings) * rim * fade * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// … and its ring along the ground
const RING_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FS = /* glsl */`
  uniform vec3 uColor; uniform float uR; uniform float uAlpha; varying vec2 vUv;
  void main(){
    float r = length(vUv);
    if (r > 1.0) discard;
    float band = smoothstep(0.06, 0.0, abs(r - uR));
    float wake = smoothstep(uR, uR - 0.3, r) * step(r, uR) * 0.25;
    float fade = 1.0 - smoothstep(0.5, 1.0, uR);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), band * 0.4), (band * 0.85 + wake) * fade * uAlpha);
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
const _p = new THREE.Vector3();

export class StatusFx {
  constructor(scene) {
    this.scene = scene;
    this.recs = new Map();       // actor → { tracked look, poison emitter }
    this.parts = [];             // live poison particles
    this.time = 0;
    this.stats = { shells: 0, pings: 0, parts: 0, emitted: 0 };   // (tests read it)
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
    const mk = (geo, vs, fs, u, blend) => {
      const m = noAO(new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: blend || THREE.NormalBlending })));
      m.frustumCulled = false; m.visible = false;
      return m;
    };
    const col = () => ({ value: new THREE.Color() });
    const shell = mk(SHELL_GEO, VIEW_VS, SHELL_FS, { uColor: col(), uTime: { value: 0 }, uK: { value: 0 }, uAlpha: { value: 0 }, uH: { value: SHELL_H } });
    const ping = mk(PING_GEO, VIEW_VS, PING_FS, { uColor: col(), uK: { value: 0 }, uAlpha: { value: 0 }, uH: { value: SHELL_H } });
    const ring = mk(RING_GEO, RING_VS, RING_FS, { uColor: col(), uR: { value: 0 }, uAlpha: { value: 0 } });
    shell.renderOrder = 5; ping.renderOrder = 5; ring.renderOrder = 3;
    ring.material.polygonOffset = true; ring.material.polygonOffsetFactor = -2; ring.material.polygonOffsetUnits = -4;
    const group = new THREE.Group(); group.add(shell, ping);
    this.scene.add(group, ring);
    r = { a, group, shell, ping, ring, on: false, t0: 0, team: -1, form: 1, emit: 0, poisoned: false };
    this.recs.set(a, r);
    return r;
  }
  // per frame (after everyone moved)
  update(dt) {
    this.time += dt;
    const actors = G.actors || [];
    // a player gone with the match they were in: their looks go too
    for (const [a, r] of this.recs) if (!actors.includes(a)) this._drop(r);
    let shells = 0, pings = 0;
    for (const a of actors) {
      const shown = a.alive && a.character?.root?.visible !== false;
      const team = shown ? trackedBy(a) : -1;
      let r = this.recs.get(a);
      if (team >= 0) {
        r = r || this._rec(a);
        if (!r.on || r.team !== team) { r.on = true; r.t0 = this.time; r.team = team; for (const m of [r.shell, r.ping, r.ring]) m.material.uniforms.uColor.value.copy(G.teamColors[team]); }
        this._tracked(r, a, dt);
        shells++; if (r.ping.visible) pings++;
      } else if (r && r.on) { r.on = false; r.shell.visible = r.ping.visible = r.ring.visible = false; }
      // poison: emit while it lasts
      if (shown && isPoisoned(a)) {
        r = r || this._rec(a);
        r.poisoned = true;
        r.emit += dt * (a === G.local ? RATE_SELF : RATE);
        while (r.emit >= 1) { r.emit -= 1; this._spawn(a); }
      } else if (r) { r.poisoned = false; r.emit = 0; }
    }
    this._stepParts(dt);
    this.stats.shells = shells; this.stats.pings = pings; this.stats.parts = this.parts.length;
  }
  _tracked(r, a, dt) {
    const self = a === G.local, k = self ? SELF_K : 1;   // (your own kid, in the follow view)
    a.visualPos ? a.visualPos(_p) : _p.copy(a.pos);
    // kid → squid: the shell squats round the squid (smoothly)
    const sq = a.form === 'squid' ? 0.42 : 1;
    r.form += (sq - r.form) * Math.min(1, dt * 12);
    r.group.position.copy(_p);
    r.shell.scale.set(1, r.form, 1); r.shell.visible = true;
    const ph = ((this.time - r.t0) % PULSE) / PULSE;
    const su = r.shell.material.uniforms; su.uTime.value = this.time; su.uK.value = ph; su.uAlpha.value = k * (0.75 + 0.25 * Math.min(1, (this.time - r.t0) / 0.25));
    // the ping: the shell swelling outward (ringed), and a ring out along the floor under them
    const e = 1 - Math.pow(1 - ph, 2);
    r.ping.visible = true;
    r.ping.scale.set(1 + (PING_OUT - 1) * e, r.form * (1 + 0.28 * e), 1 + (PING_OUT - 1) * e);
    const pu = r.ping.material.uniforms; pu.uK.value = ph; pu.uAlpha.value = k * 0.9;
    r.ring.visible = a.grounded !== false;
    r.ring.position.set(_p.x, a.pos.y + 0.035, _p.z); r.ring.scale.setScalar(RING_R);
    const ru = r.ring.material.uniforms; ru.uR.value = 0.18 + 0.82 * e; ru.uAlpha.value = self ? 0.6 : 0.9;
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
    this.scene.remove(r.group, r.ring);
    for (const m of [r.shell, r.ping, r.ring]) m.material.dispose();
    this.recs.delete(r.a);
  }
  // a new match / everything cleared: no looks left over
  clear() {
    for (const r of [...this.recs.values()]) this._drop(r);
    this.parts.length = 0;
    this.partMesh.geometry.instanceCount = 0; this.partMesh.visible = false;
  }
}
