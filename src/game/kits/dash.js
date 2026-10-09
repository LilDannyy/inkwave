// Dash Pellet (kit sub 'dash') — see kits/registry.js, tools/botlab/jobs/batch5/subs/SPEC.md §D and DECISIONS.md 19.
//
// The user: "A bomb that acts similar to a Burst Bomb. Unlike the Burst Bomb, it is used as a movement tool to dodge
// attacks. It can be used on land or in mid-air. The user dashes omni-directional to get to a new spot or close the gap,
// and leaves behind an explosion. This uses more ink than a regular Burst Bomb."
//
// THE PRESS (an `onPress` kit, SPEC §0.5): the dash goes on the press, never the release, so a dodge is instant. The
// weapon runner's trySubPress runs in actor.update BEFORE the move (the press frame already moves) and latches until a
// real release: a held button gives one dash and a refused press says "Can't use" once. 55 % ink (the Pop Pellet,
// our Burst Bomb, is 40): one dash from a full tank leaves 45 to fight with.
// THE DASH: the pellet pops under your feet and blasts you along your steering (stick / WASD, camera-relative; no input:
// the way you face; a bot: brain.dashDir) — any of the 360°, on the ground (4.5 m) or in the air (3.5 m, once per
// airtime: back on landing or a climb), horizontal only (DECISIONS.md 19: never upward, so the 1.8 m kid reach that keeps
// roofs and perches off-limits holds). The horizontal velocity follows the Twinfire roll's v0 (1 − 0.6 u) over 0.22 s,
// then ≤ 7 m/s and normal control. No height gain ever: on the ground the feet follow it; in the air (or off a ledge,
// which counts as the air dash) vy is clamped into [−1.5, +1.0] and the fall is slowed (gravity × 0.3 while falling —
// while rising gravity stays as it is, so a dash never raises a jump's peak). The body moves in ≤ 0.2 m substeps
// (actor.js _dashSteps), so no wall, Drip Curtain, launched Brolly canopy, Bubble Blower bubble, Roe Shell or spawn
// barrier is ever passed through at any frame rate. No firing during it (lockMain: a held charge is dropped, no
// dash-sniping), no rolls, no jumps (a jump pressed on the ground waits for its end), no diving. No invulnerability: it
// dodges by speed alone.
// THE BLAST, left where you took off at once: radius 2.2, 50 → 25 (the k² falloff, line of sight from 0.3 m over the
// take-off point), devices 25, paint 2.0 (in the air: on the floor under it, smaller the higher up), the boss and the
// Bazookarp's shell (50 / 25). A thin streak of ink along the ground part of the dash (0.45 every 0.6 m): a short swim
// lane back. The look: the Twinfire's forward-roll clip, a team-ink speed ribbon, the pop at the take-off point.
//
// Online: the owner simulates; ['k', nid, 'dash', [0, gid, x, y, z, dx, dz, air]] plays the pop, its blast look and the
// ribbon at the take-off point on every screen (the motion rides the actor tick — F.dash: never extrapolated — and the
// roll clip rides ['tr']). Hits are judged on the dasher's screen and applied by each victim's owner (applyHit); paint
// is the owner's splats. Nothing outlives the dash, so there's nothing to hand over when a player leaves.
// Bots: botAct (SPEC D7) — dodges (a threat about to land, a special's danger closing), break-offs, gap closes, a rushed
// charger — only from what the bot can see or hear, with a dry, clear landing.
import * as THREE from 'three';
import { G, emit, on, clamp, lerp } from '../../core/ctx.js';
import { PLAYER, SUBS, subViewScale } from '../../config.js';
import { SUB_KITS, MAIN_KITS, netRec, netId } from './registry.js';
import { registerSubModel, getSubDef, GEO_KIT } from '../character-weapons.js';
import { superEllipsoid, smoothProfile, lathe } from '../character-geo.js';
import { getPlasticMaterial, getInkMaterial } from '../character-mats.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';
import { SFX } from '../../audio/audio.js';
import { THREAT_STATS, MELEE, CHARGES } from '../bots.js';
import { tInAt } from '../botSpecials.js';
import { Hit } from '../physics.js';

const KIND = 'dash';
const { Parts, C, M, at, latheZ, orient, decal, wrapZ, deformG, profR, led } = GEO_KIT;
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0);
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _dir = new V3(), _hit = new Hit();
const r2 = (x) => Math.round(x * 100) / 100;
const S = () => SUBS.dash;

// counters (tests / match.cjs): uses by kind, blasts, hits, the streak's splats, sea deaths soon after a dash
export const DASH_STATS = { dashes: 0, ground: 0, air: 0, refused: 0, blasts: 0, hits: 0, dmg: 0, streak: 0, ghosts: 0, seaAfter: 0, bot: 0 };
export function resetDashStats() { for (const k in DASH_STATS) DASH_STATS[k] = 0; }
// bots' use (tests switch it off for a "dash disabled" control)
export const DASH_AI = { enabled: true, teams: null, cd: 4 };
for (const k of ['dashDodge', 'dashBreak', 'dashClose', 'dashRush']) if (THREAT_STATS[k] === undefined) THREAT_STATS[k] = 0;

// ================================================================================================= model
// The Pop Pellet's capsule (character-weapons.js buildBurst) re-dressed, lying along Z (prop space: origin at the bottom
// centre, +Y up, +Z forward): cream shells round a team-ink core under four dark cage bars; the rubber trigger nub gives
// way to a dark exhaust manifold with four vents round the nose; a red pinstripe behind the cage; a team-ink lightning
// chevron on each flank of the tail shell; the tail fins swept back further (× 1.4); the knurled tail stub the fist holds.
const YC = 0.0345;
const REAR = smoothProfile([[0.001, -0.047], [0.016, -0.0455], [0.026, -0.04], [0.0318, -0.031], [0.0334, -0.024], [0.0334, -0.018]], 9);
function bolt() {
  // a lightning chevron pointing back along the body (the decal's x runs nose → tail, y round the shell)
  const s = new THREE.Shape();
  s.moveTo(0, 0.0058); s.lineTo(0.0098, 0.0012); s.lineTo(0.0081, -0.0004); s.lineTo(0.0205, -0.0062);
  s.lineTo(0.0106, 0.0001); s.lineTo(0.0123, 0.0015); s.lineTo(0, 0.0058);
  return s;
}
function buildDash() {
  const P = new Parts(), I = new Parts();
  const Z = (g) => at(g, 0, YC, 0);
  P.add(Z(latheZ([[0, -0.047]].concat(REAR, [[0, -0.018]]), 20)), C.cream, M.gloss);
  P.add(Z(latheZ([[0, 0.027]].concat(smoothProfile([[0.0334, 0.027], [0.0334, 0.033], [0.031, 0.042], [0.0258, 0.0488], [0.0205, 0.0522]], 8), [[0, 0.0526]]), 20)), C.cream, M.gloss);
  for (const z of [-0.0185, 0.0265]) P.add(Z(latheZ([[0, z - 0.0034], [0.0322, z - 0.0034], [0.0345, z - 0.0016], [0.0345, z + 0.0016], [0.0322, z + 0.0034], [0, z + 0.0034]], 20)), C.dark, M.gloss);
  // the red pinstripe just behind the cage's rear gasket
  P.add(Z(latheZ([[0, -0.0236], [0.0335, -0.0236], [0.0339, -0.0229], [0.0339, -0.0219], [0.0335, -0.0212], [0, -0.0212]], 24)), C.red, M.gloss);
  // ink core + cage bars
  I.add(Z(latheZ(smoothProfile([[0, -0.018], [0.0302, -0.0178], [0.0316, -0.008], [0.0319, 0.004], [0.0316, 0.016], [0.0302, 0.0258], [0, 0.026]], 8), 20)));
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; P.add(Z(at(superEllipsoid(0.0024, 0.0024, 0.0205, 0.6, 0.6, 4, 5), Math.cos(a) * 0.0323, Math.sin(a) * 0.0323, 0.004)), C.dark, M.satin); }
  // nose: the exhaust manifold (a dark cap) and its four vents, splayed out like a thruster's
  P.add(Z(latheZ(smoothProfile([[0, 0.0505], [0.0212, 0.0505], [0.0216, 0.0532], [0.0196, 0.0568], [0.0128, 0.0602], [0, 0.0612]], 7), 18)), C.darker, M.satin);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2, n = new V3(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.78).normalize();
    const p = new V3(Math.cos(a) * 0.0122, YC + Math.sin(a) * 0.0122, 0.0566);
    P.add(orient(lathe([[0, -0.002], [0.0047, -0.002], [0.0052, 0.0006], [0.0052, 0.0054], [0.0041, 0.0062], [0.0036, 0.0058], [0.0036, 0.0016], [0, 0.0016]], 12), n, p), C.gunmetal, M.metal);
    P.add(orient(lathe([[0, 0.0012], [0.0034, 0.0012], [0.0034, 0.0016], [0, 0.0018]], 10), n, p), C.lens, M.satin);
  }
  // tail: four fins in an X, swept back 1.4 × the Pop Pellet's, the knurled stub, the metal end cap
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2;
    const fin = superEllipsoid(0.0022, 0.0098, 0.0122, 0.6, 0.6, 4, 5, (q) => { q.z -= 0.63 * (q.y + 0.0098) * 0.5; });
    fin.rotateZ(a - Math.PI / 2); P.add(Z(at(fin, Math.cos(a) * 0.0305, Math.sin(a) * 0.0305, -0.0315)), C.cream, M.gloss);
  }
  const stub = latheZ(smoothProfile([[0, -0.0745], [0.0112, -0.074], [0.0126, -0.0695], [0.0122, -0.06], [0.0126, -0.051], [0.0118, -0.0465]], 8).concat([[0, -0.046]]), 12);
  P.add(Z(stub), C.rubber, M.rubber);
  P.add(Z(latheZ([[0, -0.0785], [0.0082, -0.0785], [0.0104, -0.0768], [0.0106, -0.0738], [0, -0.0738]], 12)), C.metal, M.metal);
  // the lightning chevrons, one per flank, wrapped onto the tail shell (they follow its taper)
  for (const az of [0, Math.PI]) {
    I.add(deformG(wrapZ(decal(bolt(), 0.0007), 0.0334, az, -0.0246, YC), (v) => {
      const a = Math.atan2(v.y - YC, v.x), R = Math.hypot(v.x, v.y - YC) - 0.0334 + profR(REAR, v.z) + 0.0003;
      v.set(R * Math.cos(a), YC + R * Math.sin(a), v.z);
    }));
  }
  led(P, new V3(0, YC + 0.0322, -0.029), new V3(0, 1, 0.12), C.green, 0.0031);   // the ready light (green: go)
  return { kind: KIND, body: P.build(), ink: I.build(), grip: { pos: new V3(0, YC, -0.0625), handZ: new V3(0, 0, -1), handY: new V3(0.3, -1, 0.1) } };
}
registerSubModel(KIND, buildDash);

// ================================================================================================= icon + sounds
// the roster's style (dark outline, light fills, team colour = currentColor): the pellet tilted up to the right, its ink
// band with a white bolt, a motion arrow sweeping from behind it, a four-point burst at its tail
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const ARC = 'M4 61 Q4.5 45 14.5 38.5';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="7.5" stroke-linecap="round"><path d="${ARC}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="${ARC}"/></g>
    <path d="M18 35 L20.6 42.4 L28 45 L20.6 47.6 L18 55 L15.4 47.6 L8 45 L15.4 42.4 Z" fill="#fff" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>
    <g transform="rotate(-38 41 26)"><g ${O}>
      <path d="M20.5 20 L14.5 13.5 L24.5 18.5 Z M20.5 32 L14.5 38.5 L24.5 33.5 Z" fill="${LT}"/>
      <rect x="15" y="22" width="7.5" height="8" rx="2.5" fill="${DK}"/>
      <path d="M31 14.5 L28 14.5 Q21 14.5 21 26 Q21 37.5 28 37.5 L31 37.5 Z" fill="${LT}"/>
      <rect x="30" y="14.5" width="15" height="23" fill="currentColor"/>
      <path d="M44 14.5 L48 14.5 Q59 14.5 59 26 Q59 37.5 48 37.5 L44 37.5 Z" fill="${LT}"/>
      <rect x="28.5" y="13" width="4" height="26" rx="1.8" fill="${DK}"/>
      <rect x="42.5" y="13" width="4" height="26" rx="1.8" fill="${DK}"/>
      <rect x="57.5" y="20" width="4.5" height="12" rx="2" fill="${DK}"/>
    </g>
    <path d="M40.5 17.5 L35 26.5 L39 26.5 L35.5 34.5 L42 24.5 L38 24.5 Z" fill="#fff" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/></g>
  </svg>`;
}
// the pellet's pop with an air "fwump" under it (the blast: SUB_CUE.dash.boom)
SFX.dash_pop = {
  gain: 0.6, max: 4, jitter: 0.05, reverb: 0.12, minGap: 0.03,
  build(v, p) {
    v.nz({ ft: 'highpass', f: 2800, a: 0.0003, d: 0.022, peak: 0.85 });                                  // the snap
    v.tone({ f: 1020 * p, f1: 230 * p, sw: 0.05, a: 0.0006, d: 0.075, peak: 0.8 });                      // pok
    v.tone({ f: 128 * p, f1: 46 * p, sw: 0.13, a: 0.004, d: 0.2, peak: 0.95 });                           // fwump
    v.nz({ t: 0.002, f: 950 * p, f1: 240 * p, sw: 0.17, q: 0.9, a: 0.005, d: 0.22, peak: 0.75 });         // its air
    v.nz({ t: 0.012, f: 2500 * p, f1: 820 * p, sw: 0.12, q: 2, a: 0.001, d: 0.13, peak: 0.42 });          // ink spray
  },
};
// the rush of air past you (a band of noise 800 → 2400 Hz over 0.25 s; SUB_CUE.dash.throw: from you, or where it is)
SFX.dash_whoosh = {
  gain: 0.5, max: 4, jitter: 0.05, reverb: 0.05, minGap: 0.05,
  build(v, p) {
    v.nz({ f: 800 * p, f1: 2400 * p, sw: 0.25, q: 1.4, a: 0.025, d: 0.27, peak: 0.9 });
    v.nz({ t: 0.03, ft: 'highpass', f: 4300 * p, a: 0.03, d: 0.17, peak: 0.22 });
    v.tone({ type: 'triangle', f: 420 * p, f1: 980 * p, sw: 0.2, a: 0.02, d: 0.2, peak: 0.08 });
  },
};
// the air dash: the whoosh pitched up, with a little lift in it
SFX.dash_air = {
  gain: 0.5, max: 4, jitter: 0.05, reverb: 0.07, minGap: 0.05,
  build(v, p) {
    v.nz({ f: 1150 * p, f1: 3400 * p, sw: 0.22, q: 1.6, a: 0.02, d: 0.24, peak: 0.9 });
    v.nz({ t: 0.02, ft: 'highpass', f: 5200 * p, a: 0.02, d: 0.15, peak: 0.25 });
    v.tone({ type: 'triangle', f: 700 * p, f1: 1500 * p, sw: 0.18, a: 0.015, d: 0.18, peak: 0.1 });
  },
};

// ================================================================================================= looks
// the speed ribbon: a vertical band of team ink trailing the body's chest line for 0.3 s, fading from its head to its tail
const RIB_N = 24, RIB_LIFE = 0.3, RIB_H = 0.36;
const RIB_VS = `attribute float aK; varying float vK; varying float vV; void main(){ vK = aK; vV = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RIB_FS = `uniform vec3 uColor; uniform float uAlpha; varying float vK; varying float vV;
  void main(){ float e = 1.0 - abs(vV * 2.0 - 1.0); float a = vK * smoothstep(0.0, 0.55, e) * uAlpha; if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.25 * e * vK), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const ribbons = [];
const ribPool = [];
function ribbonFor(a) {
  let R = ribPool.pop();
  if (!R) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RIB_N * 2 * 3), 3));
    g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(RIB_N * 2), 1));
    const uv = new Float32Array(RIB_N * 2 * 2); for (let i = 0; i < RIB_N; i++) { uv[i * 4 + 1] = 0; uv[i * 4 + 3] = 1; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const idx = []; for (let i = 0; i < RIB_N - 1; i++) { const a0 = i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({ vertexShader: RIB_VS, fragmentShader: RIB_FS, uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0.85 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
    mesh.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; };   // (out of the AO pass)
    R = { mesh, pts: [], t: 0, a: null };
  }
  R.a = a; R.pts.length = 0; R.t = 0; R.end = -1;
  R.mesh.material.uniforms.uColor.value.copy(G.teamColors[a.team]);
  R.mesh.visible = true;
  G.scene?.add(R.mesh);
  ribbons.push(R);
  return R;
}
function ribbonTick(R, dt) {
  R.t += dt;
  const a = R.a, dashing = a.alive && (a.remote ? R.t < S().dashTime + 0.02 : a.weaponRunner.dashT > 0);
  if (dashing) { a.visualPos(_v); R.pts.push({ x: _v.x, y: _v.y + 0.95, z: _v.z, t: R.t }); if (R.pts.length > RIB_N) R.pts.shift(); }
  else if (R.end < 0) R.end = R.t;
  while (R.pts.length && R.t - R.pts[0].t > RIB_LIFE) R.pts.shift();
  const n = R.pts.length;
  if (R.end >= 0 && (n < 2 || R.t - R.end > RIB_LIFE)) return false;
  const pos = R.mesh.geometry.attributes.position, K = R.mesh.geometry.attributes.aK;
  for (let i = 0; i < RIB_N; i++) {
    const q = R.pts[Math.min(i, n - 1)] || { x: 0, y: -999, z: 0, t: 0 };
    const k = n ? clamp(1 - (R.t - q.t) / RIB_LIFE, 0, 1) * (i < n ? 1 : 0) : 0;
    const h = RIB_H * (0.45 + 0.55 * k);
    pos.setXYZ(i * 2, q.x, q.y - h, q.z); pos.setXYZ(i * 2 + 1, q.x, q.y + h, q.z);
    K.setX(i * 2, k); K.setX(i * 2 + 1, k);
  }
  pos.needsUpdate = true; K.needsUpdate = true;
  return true;
}
function ribbonEnd(R) { G.scene?.remove(R.mesh); R.mesh.visible = false; R.a = null; ribPool.push(R); }

// the pellet itself, for 0.08 s at the take-off point: it drops out of the fist, swells and bursts
const pellets = [];
function pelletAt(a, p, dx, dz) {
  const d = getSubDef(KIND), vs = 1.9 * subViewScale(KIND);   // (the world props' size: subs.js SUB_SCALE × [sub-view])
  const g = new THREE.Group(), m = new THREE.Group();
  m.add(new THREE.Mesh(d.body, getPlasticMaterial()), new THREE.Mesh(d.ink, getInkMaterial(G.teamColors[a.team])));
  m.scale.setScalar(vs); g.add(m);
  g.position.copy(p); g.rotation.y = Math.atan2(dx, dz);
  G.scene?.add(g);
  pellets.push({ g, m, t: 0, vs });
}

// ================================================================================================= the dash
const _from = new V3();
// the way it goes: a bot's brain.dashDir (read once), else the stick (≥ 0.3), else the facing; off a Mitts wall cling,
// steering into the wall goes straight out along its normal
function dirOf(a, out) {
  const b = a.bot;
  if (b && b.dashDir) { out.set(b.dashDir.x, 0, b.dashDir.z); b.dashDir = null; }
  else {
    const mv = a.intent.move, ml = Math.hypot(mv.x, mv.z);
    if (ml >= 0.3) out.set(mv.x, 0, mv.z); else out.set(Math.sin(a.aimYaw), 0, Math.cos(a.aimYaw));
  }
  if (out.lengthSq() < 1e-8) out.set(Math.sin(a.yaw), 0, Math.cos(a.yaw));
  return out.normalize();
}
function use(subs, a, sub) {
  const r = a.weaponRunner, k = r.kit;
  const dir = dirOf(a, _dir.set(0, 0, 0));
  let air = !a.grounded;
  if (k && k.mitts && k.cling) {
    const n = k.clingN;
    MAIN_KITS.mitts?.letGo?.(r, 'dash');
    air = true;
    if (dir.x * n.x + dir.z * n.z < 0.2) { dir.set(n.x, 0, n.z); if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1); dir.normalize(); }
  }
  if (r.turret || r.lockT > 0) r.endDodge();   // a roll's planted turret / lock ends; the dash goes
  if (air) { a.vel.y = clamp(a.vel.y, sub.airVyMin, sub.airVyMax); r.airDashUsed = true; }
  r.dashGrav = sub.airGravMul;
  r.startDash(dir.x, dir.z, air ? sub.airDashDist : sub.dashDist, sub.dashTime, sub.endSpeed, air);
  _from.copy(a.pos);
  const gid = netId(a);
  netRec(a, KIND, [0, gid, r2(_from.x), r2(_from.y), r2(_from.z), r2(dir.x), r2(dir.z), air ? 1 : 0]);
  DASH_STATS.dashes++; DASH_STATS[air ? 'air' : 'ground']++; if (a.isBot) DASH_STATS.bot++;
  const D = live.get(a) || {};
  D.t = 0; D.from = _from.clone(); D.last = a.pos.clone(); D.acc = 0; D.gid = gid; D.sp = !!a.specialActive;
  live.set(a, D);
  pop(a, sub, _from, dir.x, dir.z, air, false);
  emit('sub:use', { actor: a, kind: KIND, pos: _from.clone() });
  emit('sub:dash', { actor: a, from: _from.clone(), dir: dir.clone(), air });
}
const live = new Map();   // actor → its dash on this screen (the owner's: the streak; for the sea count)
const lastDash = new WeakMap();

// the pop at the take-off point: its look, sound and blast (a ghost's: the look and sound only)
function pop(a, sub, from, dx, dz, air, ghost) {
  const team = a.team, col = G.teamColors[team], c = _v.copy(from);
  lastDash.set(a, G.time);
  if (!ghost) a.character?.trigger?.('roll', { x: dx, y: 0, z: dz, dur: sub.dashTime });   // the Twinfire's forward roll (a ghost's: its ['tr'])
  ribbonFor(a);
  pelletAt(a, c, dx, dz);
  G.fx?.explosion(_v3.copy(c).setY(c.y + 0.3), col, sub.radius * 0.75);
  G.fx?.burst?.(_v3.copy(c).setY(c.y + 0.15), UP, col, { count: 14, speed: 5.5, size: 0.09 });
  G.fx?.ring?.(_v3.copy(c).setY(c.y + 0.05), UP, col, { radius: sub.radius * 0.8, life: 0.3 });
  G.cues?.sub(KIND, 'boom', { owner: a, team, at: c.clone() });
  if (air) G.cues?.one('dash_air', { at: c.clone(), owner: a, kind: 'throw', sub: true, vol: 0.95 });
  else G.cues?.sub(KIND, 'throw', { owner: a, team, at: c.clone() });
  emit('shake', { pos: c.clone(), amount: 0.28 });
  emit('bomb:explode', { actor: a, pos: c.clone(), team, radius: sub.radius, kind: KIND });
  if (a.isLocal) G.input?.rumble?.(0.32, 0.4, 110);
  if (ghost) { DASH_STATS.ghosts++; return; }
  DASH_STATS.blasts++;
  blast(a, sub, c.clone(), air);
}
// the blast: the Splat Bomb's falloff at the Dash Pellet's numbers, from the take-off point (feet), line of sight from
// 0.3 m over it; devices; the boss / the Bazookarp's shell; the paint (in the air: on the floor below, smaller with
// the height — the burst's ink rains down)
function blast(a, sub, c, air) {
  const team = a.team, R = sub.radius;
  _v2.copy(c).setY(c.y + 0.3);
  for (const e of G.actors) {
    if (e.team === team || !e.alive) continue;
    _v3.copy(e.pos); _v3.y += e.form === 'squid' ? 0.3 : 0.7;
    const d = _v3.distanceTo(c);
    if (d > R || !G.physics.los(_v2, _v3)) continue;
    const k = 1 - clamp((d - 0.8) / (R - 0.8), 0, 1), dmg = lerp(sub.damageMin, sub.damageMax, k * k);
    DASH_STATS.hits++; DASH_STATS.dmg += dmg;
    G.projectiles.applyHit(a, e, dmg, KIND, null, c);   // ([drainbow] from: the blast's way to the victim decides)
  }
  G.subs?.damageArea(c, R, sub.devDamage, team, a);   // enemy devices (and special objects) in it: 25 (a bobber's 25 hp)
  G.boss?.splash(a, c, R, sub.damageMax, sub.damageMin, KIND);
  G.objTargets?.splash?.(a, c, R, sub.damageMax, sub.damageMin, KIND);
  let pc = c, pr = sub.paintRadius;
  if (air) {
    const g = G.physics.raycast(_v2.copy(c).setY(c.y + 0.2), DOWN, 6, _hit, true);
    if (!g.hit) return;
    const h = c.y - g.point.y;
    pc = _v3.copy(g.point).addScaledVector(g.normal, 0.2); pr = sub.paintRadius * clamp(1 - h / 7, 0.55, 1);
  } else pc = _v3.copy(c).setY(c.y + 0.2);
  let area = G.paint.splat(pc, pr, team, { seed: Math.random() });
  for (let i = 0; i < 4; i++) {
    const ang = Math.random() * Math.PI * 2, rr = pr * (0.55 + Math.random() * 0.4);
    area += G.paint.splat(_v2.set(pc.x + Math.cos(ang) * rr, pc.y + 0.3, pc.z + Math.sin(ang) * rr), 0.45 + Math.random() * 0.35, team, { seed: Math.random() });
  }
  credit(a, area, !!a.specialActive);
}
function credit(a, area, sp) { if (sp) a.addTurfNoSpecial(area); else a.addTurf(area); }

// the owner's streak: splats of streakRadius every streakEvery m under the ground part of the dash
function streak(a, D, dt) {
  const s = S(), r = a.weaponRunner;
  D.t += dt;
  const dx = a.pos.x - D.last.x, dz = a.pos.z - D.last.z, step = Math.hypot(dx, dz);
  if (step > 1e-4 && step < 12) {
    let acc = D.acc + step;
    while (acc >= s.streakEvery) {
      acc -= s.streakEvery;
      const f = 1 - acc / step;   // where along this frame's move the mark falls
      _v.set(D.last.x + dx * f, Math.max(D.last.y, a.pos.y) + 0.5, D.last.z + dz * f);
      const g = G.physics.raycast(_v, DOWN, 1.1, _hit, true);
      if (g.hit && g.normal.y > 0.6) { DASH_STATS.streak++; credit(a, G.paint.splat(_v2.copy(g.point).addScaledVector(g.normal, 0.12), s.streakRadius, a.team, { seed: Math.random(), kind: 'trail' }), D.sp); }
    }
    D.acc = acc;
  }
  D.last.copy(a.pos);
  return r.dashT > 0 && a.alive;
}

// a remote player's dash (their owner's record): the pop and its look where they took off; the motion is their tick
function ghost(a, d) {
  if (!Array.isArray(d) || d[0] !== 0) return;
  const sub = S();
  pop(a, sub, _from.set(d[2], d[3], d[4]), d[5], d[6], !!d[7], true);
  emit('sub:dash', { actor: a, from: _from.clone(), dir: new V3(d[5], 0, d[6]), air: !!d[7], remote: true });
}

// ================================================================================================= refusals, walls
// "Can't use": mid-dash, in a roll, mid Mitts leap, or the air dash spent (until you land or climb)
function why(a) {
  const r = a.weaponRunner, k = r.kit;
  if (r.dashT > 0) return 'Already dashing';
  if (r.dodgeT > 0 || r.dodge) return 'Rolling';
  if (k && k.mitts && k.leaping) return 'Mid-leap';
  if (!a.grounded && !a.climbing && !(k && k.mitts && k.cling) && r.airDashUsed) return 'Air dash used';
  return '';
}
// the Roe Shell (G.objTargets.spheres) and enemy Bubble Blower bubbles while dashing: put the body at its surface along
// the horizontal from its centre and take away the inward part of the velocity (the bubble's own push, specials.js
// Bubble.update, runs once a frame; this runs every substep, so a dash can't cross a bubble's thin top or bottom)
const _sph = [];
function pushOut(a, c, r) {
  const dy = a.pos.y + 0.8 - c.y;
  if (Math.abs(dy) >= r) return;
  const R = Math.sqrt(r * r - dy * dy) + PLAYER.radius, hx = a.pos.x - c.x, hz = a.pos.z - c.z, dh = Math.hypot(hx, hz);
  if (dh >= R) return;
  let nx, nz;
  if (dh > 1e-4) { nx = hx / dh; nz = hz / dh; } else { const D = a.weaponRunner.dashDir; nx = -D.x; nz = -D.z; }
  a.pos.x = c.x + nx * R; a.pos.z = c.z + nz * R;
  const vn = a.vel.x * nx + a.vel.z * nz;
  if (vn < 0) { a.vel.x -= nx * vn; a.vel.z -= nz * vn; }
}
function blockActor(a) {
  if (!(a.weaponRunner?.dashT > 0)) return;
  _sph.length = 0;
  G.objTargets?.spheres?.(_sph);
  for (const s of _sph) if (s && s.solid !== false && s.c) pushOut(a, s.c, s.r);
  for (const w of G.specials?.world || []) if (w.kind === 'bubble' && !w.dead && !w.held && w.team !== a.team) pushOut(a, w.pos, w.r);
}

// ================================================================================================= bots (SPEC D7)
// Every use needs the ink, the dash off its 4 s cooldown, the air dash unspent when airborne and a dry, clear landing.
// In this order: a dodge (the threat block's fresh heading with its threat about to land, or a special's danger closing
// on our escape), a break-off (hurt, the foe who hit us close), a gap close (melee kits, a foe seen 4–8 m off), a rushed
// charger. All of it from what the brain already knows (its target, its threat, its escape): no wall-hacks.
function landing(b, a, yaw, L) {
  const sx = Math.sin(yaw), sz = Math.cos(yaw), x0 = a.pos.x, y0 = a.pos.y, z0 = a.pos.z, x1 = x0 + sx * L, z1 = z0 + sz * L;
  if (!b._dryLine(x0, y0, z0, x1, z1) || !b._fatLos(x0, y0, z0, x1, y0, z1)) return false;
  for (let s = 0.5; s <= L + 0.75; s += 0.5) {
    const gy = G.level.groundHeight(x0 + sx * s, z0 + sz * s, y0 + 0.6);
    if (gy === -Infinity || gy < y0 - 2) return false;
  }
  return true;
}
function botAct(b, dt, it, move, busy) {
  const a = b.a, sub = a.sub;
  const evNew = b.thrEvNew; b.thrEvNew = false;
  if (!sub || sub.kind !== KIND) return null;
  const st = b._dash || (b._dash = { cd: 0, seenE: null, seenT: 0 });
  st.cd -= dt;
  const T = b.target, seen = !!(T && T.alive && b.seeTimer > 0);
  if (seen) { if (st.seenE !== T) { st.seenE = T; st.seenT = 0; } st.seenT += dt; } else { st.seenE = null; st.seenT = 0; }
  if (!DASH_AI.enabled || (DASH_AI.teams && !DASH_AI.teams[a.team])) return null;
  const r = a.weaponRunner;
  if (st.cd > 0 || a.ink < sub.inkCost || a.specialActive || a.superJumpState || a.climbing || a.carry || why(a)) return null;
  let yaw = null, use = null;
  const esc = b.sp && b.sp.esc;
  if (evNew && b.thr && b.thrAct && b.thrIn < 0.6) { yaw = b.thrEvYaw; use = 'dashDodge'; }
  else if (esc && esc.r && esc.r.d && tInAt(esc.r.d, a.pos.x, a.pos.z) < 0.5) { yaw = esc.yaw; use = 'dashDodge'; }
  else if (seen) {
    const dx = T.pos.x - a.pos.x, dz = T.pos.z - a.pos.z, d = Math.hypot(dx, dz), w = a.weapon;
    const melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
    if (a.hp < 45 && d < 5 && a.lastAttacker === T && a.lastDamage < 1) { yaw = Math.atan2(-dx, -dz); use = 'dashBreak'; }
    else if (!busy && melee && d > 4 && d < 8 && st.seenT > 0.5 && Math.random() < 1 - Math.pow(0.96, dt * 60)) { yaw = Math.atan2(dx, dz); use = 'dashClose'; }
    else if (!busy && CHARGES[w.kind] && d < 4) { yaw = Math.atan2(-dx, -dz); use = 'dashRush'; }
  }
  if (yaw === null) return null;
  const L = a.grounded ? sub.dashDist : sub.airDashDist;
  // (a dodge has a little leeway: 30° either side of the heading if that one isn't clear)
  let ok = landing(b, a, yaw, L);
  if (!ok && use === 'dashDodge') for (const o of [0.52, -0.52]) if (landing(b, a, yaw + o, L)) { yaw += o; ok = true; break; }
  if (!ok) { if (use !== 'dashClose') st.cd = 0.3; return null; }
  b.dashDir = { x: Math.sin(yaw), z: Math.cos(yaw) };
  b._bombAim = true;   // (_tail presses the sub this frame and lets go the next; trySubPress reads dashDir)
  st.cd = DASH_AI.cd;
  THREAT_STATS[use]++;
  void r; void it; void move;
  return null;
}

// ================================================================================================= HUD + prompt
// the sub badge greys with a small "AIR" pip while the air dash is spent (until you land or climb)
let pipEl = null, pipOn = null;
function hud() {
  const a = G.local, B = G.hud?.subBadge;
  if (!B) return;
  const on = !!(a && a.alive && a.sub?.kind === KIND && !a.grounded && !a.climbing && a.weaponRunner?.airDashUsed);
  if (!pipEl || pipEl.parentNode !== B) {
    if (!on && !pipEl) return;
    if (!document.getElementById('iw-dash-css')) {
      const css = document.createElement('style'); css.id = 'iw-dash-css';
      css.textContent = `.iw-sb.is-airspent .iw-sb__icon { filter: grayscale(1) brightness(.8); opacity: .42; }
.iw-dash-air { position: absolute; left: 50%; bottom: -14%; translate: -50% 0; padding: 1px 5px 1.5px; border-radius: 999px; background: rgba(14, 11, 22, .92);
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .55); font: 900 9px / 1 'Rubik', sans-serif; letter-spacing: .08em; color: #c9c4d4; opacity: 0; scale: .6;
  transition: opacity .12s, scale .22s var(--spring, ease-out); pointer-events: none; white-space: nowrap; }
.iw-dash-air::after { content: ''; position: absolute; left: 3px; right: 3px; top: 50%; height: 1.5px; background: #ff8d9c; rotate: -12deg; }
.iw-sb.is-airspent .iw-dash-air { opacity: 1; scale: 1; }`;
      document.head.appendChild(css);
    }
    pipEl = document.createElement('i'); pipEl.className = 'iw-dash-air'; pipEl.textContent = 'AIR';
    B.appendChild(pipEl); pipOn = null;
  }
  if (on !== pipOn) { pipOn = on; B.classList.toggle('is-airspent', on); }
}
// "Tap [sub] to dash …", the first time it's equipped in a match (5 s of play holding it)
const tip = { m: null, t: 0 };
function prompt(a, dt) {
  if (!a || a.sub?.kind !== KIND || !a.alive) return null;
  const m = G.match;
  if (tip.m !== m) { tip.m = m; tip.t = 0; }
  if (tip.t >= 5) return null;
  tip.t += dt || 0;
  const pad = G.input?.lastDevice === 'pad';
  return `Tap ${pad ? 'RB' : 'RMB or E'} to dash where you're steering, on the ground or in the air`;
}

// ================================================================================================= registration
SUB_KITS[KIND] = {
  onPress: true,                                   // acts on the press (WeaponRunner.trySubPress), never the release
  noArc: true,                                     // (no hold, no guide: nothing is thrown)
  use,
  blocked: (a) => !!why(a),
  blockedWhy: (a) => why(a),
  lockMain: (r) => r.dashT > 0,                    // no firing while dashing (a held charge is dropped: no dash-sniping)
  blockActor,
  botAct,
  ghost,
  prompt,
  tick(dt) {
    for (const [a, D] of live) {
      if (a.remote || !a.alive || G.match?.actors && !G.match.actors.includes(a)) { live.delete(a); continue; }
      if (!streak(a, D, dt)) live.delete(a);
    }
    for (let i = ribbons.length - 1; i >= 0; i--) { const R = ribbons[i]; if (!R.a || !ribbonTick(R, dt)) { ribbonEnd(R); ribbons.splice(i, 1); } }
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i]; p.t += dt;
      const u = p.t / 0.08;
      if (u >= 1) { G.scene?.remove(p.g); pellets.splice(i, 1); continue; }
      p.m.scale.setScalar(p.vs * (1 + 0.6 * u * u));
    }
    hud();
  },
  clear() {
    live.clear();
    for (const R of ribbons) ribbonEnd(R);
    ribbons.length = 0;
    for (const p of pellets) G.scene?.remove(p.g);
    pellets.length = 0;
    if (pipEl && pipOn) { pipOn = false; G.hud?.subBadge?.classList.remove('is-airspent'); }
  },
  bot: { fight: () => false, paint: () => false },  // (every bot use lives in botAct)
  // test handles
  _live: live, _ribbons: ribbons, why,
};
// a dasher who went into the sea within 2 s of a dash (bots must never: match.cjs counts it)
on('splatted', ({ victim, cause }) => { if (victim && cause === 'water' && G.time - (lastDash.get(victim) ?? -99) < 2) DASH_STATS.seaAfter++; });
