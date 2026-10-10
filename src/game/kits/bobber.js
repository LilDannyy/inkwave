// Chain Bobber (kit sub 'bobber') — see kits/registry.js; the design: tools/botlab/jobs/batch5/subs/SPEC.md §C (+ §0, the
// shared rules) and DECISIONS.md #20. [b5-subs]
//
// The user: "A floating bomb that explodes after being attacked by a weapon. The more you link together, the bigger the
// explosion. They can be connected by a tether if nearby, but enemies can disarm them by shooting them. This uses 40%
// in, and you can throw out as many as you like, but they disappear after a fair bit of time."
//
// THROW: a normal bomb lob (throwSpeed 12, the standard arc + this kit's aim guide: bobber-hud.js), flown at a fixed
// 1/60 s step on every screen (the arc preview's own integrator, so it lands on the ring). DEPLOY: on first touching
// anything it pops open (40 → 100 % over 0.35 s) rising to its float spot — 1.0 m over a floor (or over the floor below a
// ceiling); 0.45 m out from a wall at the hit height, clamped to 0.6 … 2.2 m over the floor below; 0.45 m off a Bazookarp
// shell; over the sea / lava, or with no floor within 6 m, 1.0 m over the liquid (liquidTop). The settled spot is
// rounded to 0.01 m on every screen. Never within spawnBarrier + 2 m of the enemy pad, nor in a stage's no-place disc,
// nor inside a block: there it fizzles with a puff. LIVE once settled: it bobs ±0.05 m at 0.7 Hz and turns (drawn only),
// floats 1.0 m over the higher of its floor and the liquid (re-checked every 0.25 s, eased ≤ 1 m/s: it rides rising
// lava up and settles back), rides moving floors (wave 1's ride body: deployables.js attach / carry / _pushes), and is
// not solid: players and bombs pass through, every shot / beam touching it is absorbed. LIFE 30 s (blinking the last
// 3), then a quiet fizzle. No cap (one hidden guard: 24 a player, the oldest fizzles past it). Splatted owner: they stay.
// TETHERS (the owner only links, and records the whole list [5]): any two of the owner's live bobbers within 5.0 m
// with a clear line (walls block, grates don't), nearest pairs first (ties: the lower gid pair), ≤ 3 tethers each;
// re-linked on a settle, a removal, every 0.5 s while one rides, and when one stretches past 5.5 m or loses its line
// (it snaps). A CHAIN is a connected group; N its size (shown on the lamps).
// OWN-TEAM FIRE (shots, beams, flung ink, drops, sentry rounds, blasts, roller / brush sweeps, standing fire — the owner's,
// a teammate's) sets off the whole chain of the bobber it touches: it blows first, then the blast runs out along the
// tethers breadth-first, 0.07 s a hop (a spark races down each). Every bobber blows at its own spot at the size for N at
// the trigger: radius 1.8 / 2.2 / 2.6 / 3.0 for 1–4, then +0.2 m a link to 3.8 m at 8 (DECISIONS #20), damage 60 / 95 /
// 140 / 180 at the centre (held at 180 from 4), 25 / 30 / 35 / 35 at the edge. One chain is one explosion per victim (a
// ledger: each later blast adds only its excess); the boss's body and the Bazookarp shell take exactly one blast a chain
// (its bobber nearest them), crablets every blast; devices each blast they reach. A blast is own-team fire: it sets off
// the team's other chains in its radius (separate explosions). ENEMY FIRE of every kind wears its 25 hp down (one main
// shot of any gun; any blast within its radius + 0.2 m, no line test): disarmed it sags, its lamps die, its tethers
// snap, and it pops in a puff 0.4 s later — no blast; the chain splits and re-links.
//
// ONLINE (docs/NET.md "Chain Bobber"): the owner simulates and records ['k', nid, 'bobber', …]: [0] thrown, [3] settled /
// re-floated (rounded spot + hover), [4] wave 1's ride word, [5] the tether list, [1] a chain set off (N, the trigger,
// the blow order with hop levels), [2] gone without a blast (0 expired · 1 disarmed · 2 crushed · 3 refused). Ghosts
// never link, trigger or disarm themselves: a hit on a ghost goes to its owner (enemy fire: netHurt 'bobber'; team fire:
// netHurt 'bobberPop', with the shooter as `by`), and ghost fire (netMuted) never touches a real bobber. Damage to players
// is judged where the victim is owned (each screen replays the chain from [1] at its own hop times and hurts only the
// players it owns, with its own ledger; the victim's screen records [6, chain, dmg] for the owner's hit marker and the
// CHAIN ×N callout's ticks). Paint, device damage, the boss and the shell: the owner's screen. A player who leaves takes
// their bobbers with them (dropOwner).
//
// Events: 'sub:use' { actor, kind }, 'sub:land' { kind, pos, team, radius: 0 }, 'bobber:link' { owner, n } (the tether
// list changed: n tethers), 'bobber:trigger' { actor (owner), by, n, pos, team, ghost }, 'bomb:explode' { actor, pos,
// team, radius, kind: 'bobber' } (one per bobber), 'bobber:disarm' { owner, by, pos, team }, 'device:hit' / 'device:down'
// (wave 1's, kind 'bobber'), 'sub:end' { kind, why, team, pos }.
import * as THREE from 'three';
import { G, emit, on, clamp, lerp } from '../../core/ctx.js';
import { PLAYER, SUBS, subViewScale } from '../../config.js';
import { SUB_KITS, KIT_GHOSTS, netRec, netId, netHurt, netMuted } from './registry.js';
import { Hit } from '../physics.js';
import { THROWN, THREAT_STATS } from '../bots.js';
import { DEPLOY_STATS } from '../deployables.js';
import { BobberDraw, bobAt, DRAW_STATS } from './bobber-draw.js';
import { WSCALE, B_EYE, worldGeometry } from './bobber-model.js';
import { botKit, botAct, botDangers, preferFor, botThrowOk, botLog, webHit, holdThrow } from './bobber-bots.js';
import { hudTick, hudClear, kitPrompt, guideOff, onChainHud, onDisarmHud, onRefusedHud, onThrowHud } from './bobber-hud.js';
import '../../audio/sfx-bobber.js';

const KIND = 'bobber';
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0);
const STEP = 1 / 60, GRAV = 24;
const r2 = (x) => Math.round(x * 100) / 100;
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _c = new V3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _m = new THREE.Matrix4();
const _hit = new Hit(), _hit2 = new Hit();
export const SB = () => SUBS.bobber;   // (read live: what-if tuning patches SUBS in place)

// ---- the blast by chain size (index N − 1; past an array's end its last value holds)
const at = (arr, n) => arr[Math.min(arr.length, Math.max(1, n)) - 1];
export function sizeOf(n) {
  const s = SB();
  return { n, R: at(s.chainRadius, n), dmax: at(s.chainDamageMax, n), dmin: at(s.chainDamageMin, n), paint: at(s.chainPaint, n), dev: at(s.chainDevDamage, n) };
}
// the falloff every blast uses (SPEC §0): k = 1 − clamp((d − 0.8) / (R − 0.8)), damage = lerp(min, max, k²)
export function falloff(d, R, dmin, dmax) { const k = 1 - clamp((d - 0.8) / (R - 0.8), 0, 1); return lerp(dmin, dmax, k * k); }
// the liquid's top under (x, z): the sea, a stage module's liquid (G.level.liquidY), caldera's lava (SPEC §0.5)
export function liquidTop(x, z) {
  let y = PLAYER.waterY;
  const ly = G.level?.liquidY?.(x, z); if (Number.isFinite(ly) && ly > y) y = ly;
  const lv = G.match?.lava?.surfaceAt?.(x, z); if (Number.isFinite(lv) && lv > y) y = lv;
  return y;
}

// counters (tests / match.cjs BOBBER line)
export const BOBBER_STATS = { thrown: 0, settled: 0, refused: 0, triggers: 0, hist: {}, hitTriggers: 0, wasted: 0, splats: 0, hits: 0, disarmed: 0, expired: 0,
  crushed: 0, guard: 0, blasts: 0, links: 0, by: { owner: 0, mate: 0, blast: 0, other: 0 }, via: {}, records: {}, maxLive: 0, tickMs: 0, tickN: 0, pops: 0, refloats: 0,
  // (per placement source — the bot plan that laid a chain: chain-seconds, foe-seconds within 3 m of its reach and in it,
  // chains set off and those that caught a foe; strays: what a bot's unaimed fire was doing as it set one off)
  src: {}, strays: [] };
export function resetBobberStats() { for (const k in BOBBER_STATS) BOBBER_STATS[k] = Array.isArray(BOBBER_STATS[k]) ? [] : typeof BOBBER_STATS[k] === 'object' ? (k === 'by' ? { owner: 0, mate: 0, blast: 0, other: 0 } : {}) : 0; }
export const srcStat = (s) => BOBBER_STATS.src[s] || (BOBBER_STATS.src[s] = { chainS: 0, nearS: 0, inS: 0, trig: 0, caught: 0, splats: 0 });
const rec = (a, data) => { BOBBER_STATS.records[data[0]] = (BOBBER_STATS.records[data[0]] || 0) + 1; netRec(a, KIND, data); };

// ================================================================================================= the bobbers
export const items = [];
let SEQ = 0, liveN = 0, LOCAL_GID = 0;
const relinkSet = new Set();   // owners to re-link at the end of this tick (a bobber of theirs ended)
const byGid = new Map();
class Bobber {
  constructor(owner, sub, pos, vel, ghost, gid) {
    this.kit = true; this.kind = KIND;
    this.owner = owner; this.team = owner.team; this.sub = sub; this.ghost = !!ghost; this.gid = gid; this.seq = ++SEQ;
    this.state = 'fly'; this.t = 0; this.age = 0; this.acc = 0;
    this.pos = pos.clone(); this.vel = vel.clone(); this.prev = pos.clone();
    this.from = new V3(); this.spot = new V3(); this.hover = sub.floatH; this.baseY = 0; this.floorB = -1;
    this.born = 0; this.hp = sub.hp; this.ten = []; this.chain = null;
    this.phase = ((gid * 0.6180339887) % 1) * Math.PI * 2; this.yaw = this.phase * 3.1;
    this.flash = 0; this.struckT = -9; this.glow = false; this.blink = false;
    this.rb = null; this.desc = null; this.cell = -1; this.blast = null; this.hop = 0; this.blowAt = 0;
    this.dpos = new V3(); this.aim = new V3();
    this.easeY = null; this.easeV = 1; this.floatT = Math.random() * 0.25; this.blockT = Math.random() * 0.1;
    this.pend3 = null; this.pend4 = null; this.sagT = 0; this.why = null; this.spin = new V3(5 + Math.random() * 4, 0, 4 + Math.random() * 4);
    this.sp = !!owner.specialActive; this.ownRecT = -9;
  }
  get live() { return this.state === 'live'; }
}
const ownerLive = (a) => items.filter((it) => it.owner === a && !it.ghost && it.state !== 'dead' && it.state !== 'blow' && it.state !== 'sag');
export function liveCount() { return liveN; }

// ---- a spatial hash of the live bobbers (4 m cells over x, z): shots, beams, blasts and linking ask only the cells
// they touch (C4.1)
const CELL = 4, H = new Map();
const cellOf = (x, z) => ((Math.floor(x / CELL) + 4096) << 13) | ((Math.floor(z / CELL) + 4096) & 8191);
function hashPut(it) {
  const k = cellOf(it.spot.x, it.spot.z);
  if (k === it.cell) return;
  hashDel(it);
  let L = H.get(k); if (!L) H.set(k, (L = []));
  L.push(it); it.cell = k;
}
function hashDel(it) {
  if (it.cell < 0) return;
  const L = H.get(it.cell);
  if (L) { const i = L.indexOf(it); if (i >= 0) { L[i] = L[L.length - 1]; L.pop(); } if (!L.length) H.delete(it.cell); }
  it.cell = -1;
}
// every hashed bobber in the cells the box [x0, x1] × [z0, z1] touches → out
const _near = [];
export function near(x0, z0, x1, z1, out = _near) {
  out.length = 0;
  const i0 = Math.floor(Math.min(x0, x1) / CELL), i1 = Math.floor(Math.max(x0, x1) / CELL), j0 = Math.floor(Math.min(z0, z1) / CELL), j1 = Math.floor(Math.max(z0, z1) / CELL);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) { for (const it of items) if (it.cell >= 0) out.push(it); return out; }
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = H.get(((i + 4096) << 13) | ((j + 4096) & 8191)); if (L) for (const it of L) out.push(it); }
  return out;
}

// ---- helpers
const nearCam = (p, r = 40) => { const c = G.rig?.gameCam || G.camera; return !!c && c.position.distanceToSquared(p) < r * r; };
const chestOf = (e, out) => out.set(e.pos.x, e.pos.y + (e.form === 'squid' ? 0.3 : 0.7), e.pos.z);
const byNid = (n) => (n >= 0 ? G.actors.find((e) => e.nid === n) || null : null);
// the floor under (x, y, z) within depth: { y, block } or null (grates are floors to a float)
function floorBelow(x, y, z, depth = 6) {
  const g = G.physics?.raycast(_v3.set(x, y, z), DOWN, depth, _hit2);
  return g && g.hit && g.normal.y > 0.3 ? { y: g.point.y, block: g.block } : null;
}
// where a bobber that touched (px, py, pz) with surface normal n (kind 'floor' | 'wall' | 'ceil' | 'liquid' | 'shell')
// floats → into out { x, y, z, hover, base, block, refused } (pure: the flight and the aim guide both use it)
export function spotFor(px, py, pz, nx, ny, nz, kind, block, team, out) {
  const s = SB();
  let x = px, y = py, z = pz, base, hover = s.floatH, fb = -1, floorY = -Infinity;
  if (kind === 'floor') {
    const liq = liquidTop(x, z);
    base = Math.max(py, liq); fb = py >= liq ? block : -1;
  } else if (kind === 'liquid') {
    base = liquidTop(x, z);
  } else {
    if (kind === 'wall') { const hl = Math.hypot(nx, nz) || 1; x += (nx / hl) * s.wallOut; z += (nz / hl) * s.wallOut; }
    else if (kind === 'shell') { x += nx * s.wallOut; y += ny * s.wallOut; z += nz * s.wallOut; }
    const f = floorBelow(x, (kind === 'ceil' ? py - 0.15 : y + 0.05), z, 6), liq = liquidTop(x, z);
    floorY = f ? f.y : -Infinity;
    base = Math.max(floorY, liq); fb = f && f.y >= liq ? f.block : -1;
    hover = kind === 'ceil' ? s.floatH : clamp(y - base, s.floatMin, s.floatMax);
  }
  out.x = r2(x); out.z = r2(z); out.y = r2(base + hover); out.base = base; out.hover = r2(out.y - base); out.block = fb; out.kind = kind;
  out.floorY = kind === 'floor' ? py : kind === 'liquid' ? -Infinity : floorY;
  // refused: near the enemy pad (no spawn traps), in a stage's no-place disc, inside a block
  const L = G.level, pad = L?.spawnPads?.[1 - team];
  out.refused = !!pad && Math.hypot(out.x - pad.x, out.z - pad.z) < (L.spawnBarrier ?? 4.2) + s.padNoDeploy;
  out.why = out.refused ? 'pad' : '';
  if (!out.refused && L?.noPlace?.(_v3.set(out.x, base, out.z), 0.3)) { out.refused = true; out.why = 'place'; }
  if (!out.refused && L?.pointInside?.(_v3.set(out.x, out.y, out.z), 0.06)) { out.refused = true; out.why = 'inside'; }
  return out;
}
const _spot = { x: 0, y: 0, z: 0, hover: 0, base: 0, block: -1, refused: false, why: '', kind: '' };
// the Bazookarp's solid spheres (G.objTargets.spheres, §0.6): the first one a segment a → b touches (pad: the float's
// own radius) → { t, c, r } or null
const _sph = [];
function sphereHit(a, b, pad) {
  const T = G.objTargets;
  if (!T?.spheres) return null;
  _sph.length = 0; T.spheres(_sph);
  let best = null;
  for (const s of _sph) {
    if (s.solid === false) continue;
    const R = s.r + pad, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, fx = a.x - s.c.x, fy = a.y - s.c.y, fz = a.z - s.c.z;
    const A = dx * dx + dy * dy + dz * dz, B = 2 * (fx * dx + fy * dy + fz * dz), C = fx * fx + fy * fy + fz * fz - R * R;
    if (C <= 0) { if (!best || 0 < best.t) best = { t: 0, c: s.c, r: s.r }; continue; }
    const D = B * B - 4 * A * C;
    if (D < 0 || A < 1e-9) continue;
    const t = (-B - Math.sqrt(D)) / (2 * A);
    if (t >= 0 && t <= 1 && (!best || t < best.t)) best = { t, c: s.c, r: s.r };
  }
  return best;
}
// one fixed step of a thrown bobber: the touch → a deploy description, or null (still flying)
function flyStep(p, v, prev, team, out) {
  v.y -= GRAV * STEP;
  prev.copy(p);
  p.addScaledVector(v, STEP);
  const sh = sphereHit(prev, p, 0.05);
  const h = G.physics.segment(prev, p, _hit);
  if (sh && (!h.hit || sh.t * prev.distanceTo(p) <= h.dist)) {
    const hp = _v.lerpVectors(prev, p, sh.t), n = _v2.subVectors(hp, sh.c).normalize();
    p.copy(sh.c).addScaledVector(n, sh.r);
    return spotFor(p.x, p.y, p.z, n.x, n.y, n.z, 'shell', -1, team, out);
  }
  if (h.hit) {
    p.copy(h.point);
    const n = h.normal, kind = n.y > 0.6 ? 'floor' : n.y < -0.6 ? 'ceil' : 'wall';
    return spotFor(h.point.x, h.point.y, h.point.z, n.x, n.y, n.z, kind, h.block, team, out);
  }
  if (p.y <= liquidTop(p.x, p.z)) return spotFor(p.x, p.y, p.z, 0, 1, 0, 'liquid', -1, team, out);
  return null;
}
// (bots) where a throw from pos at vel would float → out or null
const _bp = new V3(), _bv = new V3(), _bq = new V3();
export function predictFrom(pos, vel, team, out = _gs) {
  _bp.copy(pos); _bv.copy(vel);
  for (let i = 0; i < 240; i++) { const r = flyStep(_bp, _bv, _bq, team, out); if (r) return r; }
  return null;
}
// (the aim guide: where a throw by a from now would float — the same flight) → out or null
const _gp = new V3(), _gv = new V3(), _gq = new V3(), _gs = { ..._spot };
export function predictSpot(a, out = _gs) {
  const s = a.sub?.kind === KIND ? a.sub : SB();
  _gp.copy(a.pos); _gp.y += 1.35;
  G.projectiles.throwVelocity(a, s.throwSpeed, _gv);
  for (let i = 0; i < 240; i++) { const r = flyStep(_gp, _gv, _gq, a.team, out); if (r) { out.hx = _gp.x; out.hy = _gp.y; out.hz = _gp.z; return r; } }
  return null;
}

// ================================================================================================= throw / spawn
// a bot's planned spot (bobber-bots.js): the lob that lands there (throwVelocity: pitch + 0.28 rad, +1.5 m/s up, from
// 1.35 m, gravity 24) — the Waddle's own trick, aimed at the bot's own pick
function lobPitch(d, dy, speed) {
  let best = null, be = Infinity;
  for (let p = -0.5; p <= 0.75; p += 0.0125) {
    const tp = clamp(p + 0.28, -0.3, 1.1), vx = Math.cos(tp) * speed, vy = Math.sin(tp) * speed + 1.5, disc = vy * vy + 48 * (1.35 - dy);
    if (disc < 0) continue;
    const e = Math.abs((vx * (vy + Math.sqrt(disc))) / 24 - d);
    if (e < be) { be = e; best = p; }
  }
  return be < 1.0 ? best : null;
}
// (bots) the lob from a kid standing at `from` that settles nearest the pick P (a floor spot): its aim checked against
// the real flight — predictFrom, the step every screen flies — and corrected up to three times (a ledge's lip, a rail, a
// slope move where it settles) → out { yaw, pitch, miss: the predicted float spot's miss in metres (Infinity: none) }.
// (A bot's throw cancels the run it would inherit — use() — so this is the whole of it.)
const _lv = new V3(), _ls = { x: 0, y: 0, z: 0 }, _lo = new V3();
export function lobAim(from, P, team, speed, out = { yaw: 0, pitch: 0, miss: Infinity }, tries = 4) {
  const want = Math.hypot(P.x - from.x, P.z - from.z), wy = Math.atan2(P.x - from.x, P.z - from.z);
  let yaw = wy, d = want;
  out.yaw = wy; out.pitch = 0; out.miss = Infinity;
  _lo.set(from.x, from.y + 1.35, from.z);
  for (let k = 0; k < tries; k++) {
    const pitch = lobPitch(d, P.y - from.y, speed);
    if (pitch == null) break;
    const tp = clamp(pitch + 0.28, -0.3, 1.1), cp = Math.cos(tp);
    _lv.set(Math.sin(yaw) * cp * speed, Math.sin(tp) * speed + 1.5, Math.cos(yaw) * cp * speed);
    const s = predictFrom(_lo, _lv, team, _ls);
    if (!s || s.refused) break;
    const miss = Math.hypot(s.x - P.x, s.z - P.z) + Math.max(0, Math.abs(s.base - P.y) - 0.6);   // (and not up on a ledge above it, nor down below)
    if (miss < out.miss) { out.miss = miss; out.yaw = yaw; out.pitch = pitch; }
    if (miss < 0.5) break;
    // (short or long: ask for the distance it's off by; off to a side: turn by the angle it's off by)
    const got = Math.hypot(s.x - from.x, s.z - from.z);
    if (got < 1) break;
    d = clamp(d + (want - got), want * 0.6, want * 1.6);
    let da = wy - Math.atan2(s.x - from.x, s.z - from.z); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    yaw += clamp(da, -0.4, 0.4);
  }
  return out;
}
const _la = { yaw: 0, pitch: 0, miss: Infinity };
function use(subs, a, sub) {
  const P = a.bot?._bobberAt, snap = !!a.bot?._bobSnap;
  if (a.bot) a.bot._bobSnap = false;
  const pos = a.pos.clone(); pos.y += 1.35;
  if (P) {
    a.bot._bobberAt = null;
    // (no lob lands within 1.6 m of the pick — a wall's lip or a ledge in the way: not thrown, the ink back; its plan
    // skips that link)
    const la = lobAim(a.pos, P, a.team, sub.throwSpeed, _la), miss = la.miss;
    a.aimYaw = la.yaw; a.aimPitch = la.pitch;
    botLog(a, 'throw', { miss: Math.round(miss * 10) / 10, d: Math.round(Math.hypot(P.x - a.pos.x, P.z - a.pos.z) * 10) / 10 });
    if (!(miss <= 1.6)) { BOBBER_STATS.badLobs = (BOBBER_STATS.badLobs || 0) + 1; if (a.specialActive?.kind !== 'barrage') a.ink = Math.min(PLAYER.inkMax, a.ink + sub.inkCost); return; }
  }
  const vel = G.projectiles.throwVelocity(a, sub.throwSpeed, new V3());
  if (P) { vel.x -= a.vel.x * 0.4; vel.z -= a.vel.z * 0.4; }   // (a bot throwing at its pick allows for its own run, as a player would)
  // a bot never throws one that would settle where it can't stand (Tower Command: in the tower's way) — the ink back
  if (a.bot && !botThrowOk(a, pos, vel)) { if (a.specialActive?.kind !== 'barrage') a.ink = Math.min(PLAYER.inkMax, a.ink + sub.inkCost); return; }
  // the hidden guard (C1.9): past maxPerPlayer the oldest fizzles
  const mine = ownerLive(a);
  if (mine.length >= sub.maxPerPlayer) { mine.sort((x, y) => x.seq - y.seq); for (let i = 0; i <= mine.length - sub.maxPerPlayer; i++) { BOBBER_STATS.guard++; finish(mine[i], 0, 'fizzle'); } }
  const it = spawn(a, sub, pos, vel, false, netId(a) || 9e8 + ++LOCAL_GID);   // (offline: netId is 0 — an id of its own)
  it.src = a.bot ? (P && a.bot._bobSrc) || 'bot' : 'player';   // (the counters' placement source: the bot plan it was laid by)
  if (P) it.planned = new V3(P.x, P.y + sub.floatH, P.z);   // (where a bot's pick will float: its team's bots hold fire into it on the way)
  if (P && snap) { it.snapBy = a; it.snapT = a.bot._bobSnapT = G.time + 4; }   // [b5-int3] (thrown at a foe: its thrower shoots it the moment that foe is in reach — bobber-bots.js scan)
  rec(a, [0, it.gid, r2(pos.x), r2(pos.y), r2(pos.z), r2(vel.x), r2(vel.y), r2(vel.z)]);
  BOBBER_STATS.thrown++;
  G.cues?.sub(KIND, 'throw', { owner: a, at: a.pos });
  emit('sub:use', { actor: a, kind: KIND });
  if (a.isLocal) onThrowHud(a);
}
// (tests, bots' scripts) a bobber thrown by a from pos at vel — recorded like a throw
export function throwFrom(a, pos, vel, sub = SB()) {
  const it = spawn(a, sub, pos, vel, false, netId(a) || 9e8 + ++LOCAL_GID);
  rec(a, [0, it.gid, r2(pos.x), r2(pos.y), r2(pos.z), r2(vel.x), r2(vel.y), r2(vel.z)]);
  BOBBER_STATS.thrown++;
  return it;
}
function spawn(a, sub, pos, vel, ghost, gid) {
  const it = new Bobber(a, sub, pos, vel, ghost, gid);
  items.push(it); byGid.set(gid, it);
  return it;
}

// ================================================================================================= life
function fly(it) {
  while (it.acc >= STEP - 1e-9) {
    it.acc -= STEP;
    const r = flyStep(it.pos, it.vel, it.prev, it.team, _spot);
    if (r) return deploy(it, r);
    if (it.pos.y < -60) { finish(it, 3, 'quiet'); return; }
  }
}
// touched something: pop open toward the float spot (a ghost takes its owner's spot [3] when it has it)
function deploy(it, s) {
  it.from.copy(it.pos);
  if (!it.ghost && s.refused) {
    BOBBER_STATS.refused++;
    it.spot.set(s.x, s.y, s.z);
    if (it.owner.isLocal) onRefusedHud(it, s.why);
    finish(it, 3, 'puff');
    return;
  }
  if (it.ghost && it.pend3) { const d = it.pend3; it.pend3 = null; it.spot.set(d[2], d[3], d[4]); it.hover = d[5] ?? s.hover; it.baseY = it.spot.y - it.hover; }
  else { it.spot.set(s.x, s.y, s.z); it.hover = s.hover; it.baseY = s.base; }
  it.floorB = s.block; it.floorY = s.floorY; it.liqY = null;
  it.state = 'open'; it.t = 0;
  if (!it.ghost) rec(it.owner, [3, it.gid, it.spot.x, it.spot.y, it.spot.z, r2(it.hover)]);
  if (nearCam(it.spot, 40)) G.cues?.sub(KIND, 'land', { owner: it.owner, team: it.team, at: it.spot });
}
function settle(it) {
  it.state = 'live'; it.t = 0; it.born = G.time; it.flash = 0.6;
  it.pos.copy(it.spot);
  liveN++;
  BOBBER_STATS.settled++;
  BOBBER_STATS.maxLive = Math.max(BOBBER_STATS.maxLive, liveN);
  hashPut(it);
  // on a moving floor: it rides it (wave 1's ride body; the owner's [4] word follows)
  const rb = rideBody(it);
  rb.pos.set(it.spot.x, it.baseY, it.spot.z); rb.mesh.position.copy(rb.pos);
  if (it.ghost && it.pend4) { const d = it.pend4; it.pend4 = null; G.deploy?.netOn(rb, d); syncFromRide(it); }
  else if (it.floorB >= 0) G.deploy?.attach(rb, it.floorB);
  emit('sub:land', { kind: KIND, pos: it.spot.clone(), team: it.team, radius: 0 });
  if (!it.ghost) relink(it.owner);
  else applyTethers(it.owner);
  tethersDirty = true;
  botLog(it.owner, 'land', { at: [r2(it.spot.x), r2(it.spot.y), r2(it.spot.z)], n: it.chain?.n || 1 });
}
// the ride body (§0.2): what wave 1 moves like one of its own floor devices — its foot on the floor, the bobber
// floating `hover` over it
function rideBody(it) {
  if (it.rb) return it.rb;
  const rb = it.rb = {
    obj: it, kit: true, pos: new V3(), normal: UP.clone(), mesh: new THREE.Object3D(), state: 'kit', floor: true,
    get hover() { return it.hover; }, kind: KIND, get team() { return it.team; }, get ghost() { return it.ghost; }, gid: it.gid, get owner() { return it.owner; },
    netKind: KIND, on: null, ride: null, onRec: false, pendOn: null, pushRec: false, pushT: 0,
    kill: (why) => finish(it, 2, 'crunch'),          // (wave 1 decided it — _pushes with nowhere to go — and emits)
    lost: () => lost(it),
  };
  rb.pos.set(it.spot.x, it.spot.y - it.hover, it.spot.z);
  return rb;
}
// the ride body moved (carried, lifted, shoved): the bobber floats `hover` over its foot
function syncFromRide(it) {
  const rb = it.rb, x = rb.pos.x, y = rb.pos.y + it.hover, z = rb.pos.z;
  const moved = Math.abs(x - it.spot.x) + Math.abs(y - it.spot.y) + Math.abs(z - it.spot.z) > 1e-4;
  if (moved) { it.spot.set(x, y, z); it.baseY = rb.pos.y; it.floorY = rb.pos.y; hashPut(it); tethersDirty = true; it.moved = true; }
  _e.setFromQuaternion(rb.mesh.quaternion, 'YXZ'); it.rideYaw = _e.y;
  return moved;
}
// its floor went from under it (wave 1's _lost: the block it rode moved away / parked; an era flip took its floor):
// it re-floats over whatever is below (a floor within 6 m, else the liquid), easing at ≤ 3 m/s; the owner's new [3]
function lost(it) {
  if (it.state !== 'live') return;
  const rb = it.rb; if (rb) { rb.on = null; rb.ride = null; }
  const f = floorBelow(it.spot.x, it.spot.y - 0.05, it.spot.z, 6 + it.hover), liq = liquidTop(it.spot.x, it.spot.z);
  const base = Math.max(f ? f.y : -Infinity, liq), y = r2(base + SB().floatH);
  it.hover = SB().floatH; it.baseY = base; it.floorB = f && f.y >= liq ? f.block : -1; it.floorY = f ? f.y : -Infinity;
  it.easeY = y; it.easeV = 3;
  BOBBER_STATS.refloats++;
  if (rb) { rb.pos.set(it.spot.x, base, it.spot.z); rb.mesh.position.copy(rb.pos); if (it.floorB >= 0) G.deploy?.attach(rb, it.floorB); }
  if (!it.ghost) { rec(it.owner, [3, it.gid, it.spot.x, y, it.spot.z, r2(it.hover)]); it.relinkSoon = true; }
}
function live(it, dt) {
  const s = SB();
  if (it.flash > 0) it.flash = Math.max(0, it.flash - dt * 5.5);
  const life = G.time - it.born;
  it.blink = life > s.life - 3;
  if (!it.ghost && life >= s.life) { BOBBER_STATS.expired++; finish(it, 0, 'fizzle'); return; }
  if (it.ghost && life >= s.life + 3) { finish(it, 'drop', 'fizzle'); return; }   // (its owner's end never came)
  const rb = it.rb;
  if (rb?.on) { G.deploy?.carry(rb); if (it.state !== 'live') return; if (rb.on) syncFromRide(it); }
  else if (rb && Math.abs(rb.pos.x - it.spot.x) + Math.abs(rb.pos.z - it.spot.z) + Math.abs(rb.pos.y + it.hover - it.spot.y) > 1e-3 && it.easeY == null) syncFromRide(it);   // (lifted / shoved by wave 1)
  else {
    // its float: `hover` over the higher of its floor (re-checked every 0.25 s: a ray) and the liquid's top (every frame:
    // a lookup), eased at ≤ 1 m/s — so it rides rising lava up and settles back as it falls. (A liquid rising faster
    // than 1 m/s — no stage's does: caldera's peaks at 0.36 — is outpaced at 1.25 × its rate, so it never sinks in.)
    if ((it.floatT -= dt) <= 0) { it.floatT = 0.25; const f = floorBelow(it.spot.x, it.spot.y - 0.05, it.spot.z, 6 + it.hover); it.floorY = f ? f.y : -Infinity; }
    const liq = liquidTop(it.spot.x, it.spot.z), rate = dt > 0 && it.liqY != null ? (liq - it.liqY) / dt : 0;
    it.liqY = liq;
    const base = Math.max(it.floorY ?? -Infinity, liq);
    it.baseY = base;
    if (it.easeY == null) {
      const d = base + it.hover - it.spot.y;
      if (Math.abs(d) > 0.002) {
        const v = Math.max(1, Math.abs(rate) * 1.25) * dt;
        it.spot.y += Math.abs(d) <= v ? d : Math.sign(d) * v;
        if (rb) { rb.pos.set(it.spot.x, it.spot.y - it.hover, it.spot.z); rb.mesh.position.copy(rb.pos); }
        tethersDirty = true; it.moved = true;
      }
    }
  }
  if (it.easeY != null) {
    const d = it.easeY - it.spot.y, st = it.easeV * dt;
    it.spot.y = Math.abs(d) <= st ? it.easeY : it.spot.y + Math.sign(d) * st;
    if (it.spot.y === it.easeY) it.easeY = null;
    if (rb) { rb.pos.set(it.spot.x, it.spot.y - it.hover, it.spot.z); rb.mesh.position.copy(rb.pos); }
    tethersDirty = true; it.moved = true;
  }
  // (the owner) a moving block through its body (not its foot: a railcar, a hedge, a platform) crushes it
  if (!it.ghost && (it.blockT -= dt) <= 0) {
    it.blockT = 0.1;
    const D = G.level?.dyn;
    if (D?.length) for (const b of D) {
      if (b.solid === false || (rb?.on && (b === rb.on.b || G.deploy?.isTowerBlock(rb.on.b) && G.deploy.isTowerBlock(b)))) continue;
      if (G.level.pointInBlock(b, it.spot, 0.12)) { ownEnding(it, 'crush'); return; }
    }
  }
}
// the inflate: 40 → 100 % over deployTime, rising from the touch to the float spot
function open(it) {
  if (it.t >= SB().deployTime) settle(it);
}

// ================================================================================================= tethers + chains
let tethersDirty = true;
// (bobber-hud.js: the teammate cue's glow flipped on a bobber — the tethers' glow attribute is re-uploaded)
export function markTethers() { tethersDirty = true; }
const lastList = new Map();   // owner → the last [5] list sent (a string)
// (the owner) re-link every live bobber of this owner: nearest pairs first, ≤ maxTethers each, a clear line
export function relink(owner) {
  const s = SB(), L = items.filter((it) => it.owner === owner && !it.ghost && it.state === 'live');
  const pairs = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j], d = a.spot.distanceTo(b.spot);
    if (d > s.linkRange) continue;
    if (!G.physics.los(a.spot, b.spot)) continue;
    const lo = Math.min(a.gid, b.gid), hi = Math.max(a.gid, b.gid);
    pairs.push({ a, b, d, lo, hi });
  }
  pairs.sort((x, y) => (x.d - y.d) || (x.lo - y.lo) || (x.hi - y.hi));
  const old = new Map(L.map((it) => [it, it.ten]));
  for (const it of L) it.ten = [];
  const out = [];
  for (const p of pairs) {
    if (p.a.ten.length >= s.maxTethers || p.b.ten.length >= s.maxTethers) continue;
    p.a.ten.push(p.b); p.b.ten.push(p.a);
    out.push([p.lo, p.hi]);
  }
  chainsOf(L);
  out.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]));
  const key = out.map((p) => p[0] + ':' + p[1]).join(',');
  if (lastList.get(owner) !== key) {
    // a tether that went: it snapped (a spark and a tick); new ones: a zing a semitone higher per link
    let made = 0;
    for (const it of L) for (const o of it.ten) if (it.gid < o.gid && !(old.get(it) || []).includes(o)) made++;
    for (const [it, ten] of old) for (const o of ten) if (it.gid < o.gid && L.includes(o) && !it.ten.includes(o)) snapFx(it, o);
    lastList.set(owner, key);
    rec(owner, [5, ...out.flat()]);
    BOBBER_STATS.links += made;
    if (made && L.length) { const it = L.find((x) => x.ten.length) || L[0]; if (nearCam(it.spot, 30)) G.audio?.play('bobber_link', { pos: it.spot, volume: 0.55, pitch: Math.pow(2, (Math.min(8, it.chain?.n || 2) - 2) / 12) }); }
    emit('bobber:link', { owner, n: out.length });
    tethersDirty = true;
  }
  for (const it of L) { it.relinkSoon = false; it.moved = false; }
}
// connected groups → it.chain = { items, n } for every bobber in L
function chainsOf(L) {
  const seen = new Set();
  for (const it of L) {
    if (seen.has(it)) continue;
    const ch = { items: [], n: 0, glow: false, armed: [false, false], armT: 0, key: it.gid };
    const st = [it]; seen.add(it);
    while (st.length) { const x = st.pop(); ch.items.push(x); x.chain = ch; for (const o of x.ten) if (!seen.has(o) && L.includes(o)) { seen.add(o); st.push(o); } }
    ch.n = ch.items.length;
  }
}
// (a ghost) the owner's tether list [5] → tethers + chains on this screen (never computed here)
const ghostLists = new Map();   // owner → [gidA, gidB, …]
function applyTethers(owner) {
  const list = ghostLists.get(owner) || [];
  const L = items.filter((it) => it.owner === owner && it.ghost && it.state === 'live');
  for (const it of L) it.ten = [];
  for (let i = 0; i + 1 < list.length; i += 2) {
    const a = byGid.get(list[i]), b = byGid.get(list[i + 1]);
    if (!a || !b || a.state !== 'live' || b.state !== 'live' || a.ghost !== true || b.ghost !== true) continue;
    a.ten.push(b); b.ten.push(a);
  }
  chainsOf(L);
  tethersDirty = true;
}
function snapFx(a, b) {
  const c = _c.addVectors(a.spot, b.spot).multiplyScalar(0.5);
  if (!nearCam(c, 35)) return;
  G.fx?.burst?.(c, UP, new THREE.Color(1, 0.95, 0.8), { count: 4, speed: 2.5, size: 0.04, sheet: false });
  G.audio?.play('bobber_snap', { pos: c, volume: 0.5 });
}
// (the owner, every 0.5 s) a tether stretched past linkSnap or lost its line, or a bobber of its rides / moved: re-link
let snapT = 0;
function checkTethers(dt) {
  if ((snapT -= dt) > 0) return;
  snapT = 0.5;
  const s = SB(), owners = new Set();
  for (const it of items) {
    if (it.ghost || it.state !== 'live') continue;
    if (it.rb?.on || it.moved || it.relinkSoon) { owners.add(it.owner); continue; }
    for (const o of it.ten) if (it.gid < o.gid && (it.spot.distanceTo(o.spot) > s.linkSnap || !G.physics.los(it.spot, o.spot))) owners.add(it.owner);
  }
  for (const a of owners) relink(a);
}

// ================================================================================================= setting a chain off
export const groups = new Map();   // the chain's first bobber's gid → its blast group (kept a few seconds: [6] records)
// (the owner) own-team fire touched it: the whole chain goes
export function trigger(it, by, how = 'shot') {
  if (it.state !== 'live' || it.ghost) return null;
  const levels = [], seen = new Set([it]);
  let cur = [it];
  while (cur.length) {
    levels.push(cur);
    const nx = [];
    for (const b of cur) for (const o of b.ten) if (!seen.has(o) && o.state === 'live') { seen.add(o); nx.push(o); }
    nx.sort((x, y) => x.gid - y.gid);
    cur = nx;
  }
  const g = makeGroup(it.gid, it.owner, seen.size, by || null, levels, G.time, false);
  g.boss = pickBoss(g); g.shell = pickShell(g);
  const flat = [];
  levels.forEach((L, k) => { for (const b of L) if (b !== it) flat.push(b.gid, k); });
  rec(it.owner, [1, it.gid, g.n, by?.nid ?? -1, ...flat]);
  BOBBER_STATS.triggers++;
  BOBBER_STATS.hist[g.n] = (BOBBER_STATS.hist[g.n] || 0) + 1;
  BOBBER_STATS.by[how === 'blast' ? 'blast' : !by ? 'other' : by === it.owner ? 'owner' : by.team === it.team ? 'mate' : 'other']++;
  // (what set it off: 'chain' — another chain's blast — apart from the other blasts)
  const k = `${how === 'blast' && _chainBlast ? 'chain' : how}:${by?.specialActive ? 'sp-' + (by.specialActive.kind || by.specialActive.id || '?') : by?.weapon?.kind || '-'}${by?.bot?._bob ? '(aimed)' : ''}`;
  BOBBER_STATS.via[k] = (BOBBER_STATS.via[k] || 0) + 1;
  g.src = it.chain?.items?.[0]?.src || it.src || '-'; srcStat(g.src).trig++;
  if (by?.bot && !by.bot._bob && !_chainBlast && BOBBER_STATS.strays.length < 60) { try { strayNote(it, by, k); } catch (e) { /* a counter: never the chain */ } }
  schedule(g);
  return g;
}
// (the counters) a bot's unaimed fire set one off: where it stood and aimed, what it was doing, whether its hold-fire
// check had just said hold
let _chainBlast = false;
function strayNote(it, by, via) {
  const b = by.bot, dx = it.spot.x - by.pos.x, dz = it.spot.z - by.pos.z, d = Math.hypot(dx, dz);
  let ang = Math.atan2(dx, dz) - b.aimYaw; while (ang > Math.PI) ang -= 2 * Math.PI; while (ang < -Math.PI) ang += 2 * Math.PI;
  BOBBER_STATS.strays.push({ via, w: by.weapon?.kind, mode: b.mode, d: r2(d), dy: r2(it.spot.y - by.pos.y), ang: r2(ang), pitch: r2(b.aimPitch),
    hf: b._bobHF ? (b._bobHF.o ? 1 : 0) : -1, hfAge: b._bobHF ? r2(G.time - b._bobHF.t) : -1, age: r2(G.time - it.born), n: it.chain?.n || 1,
    own: by === it.owner ? 1 : 0, gr: by.grounded ? 1 : 0, sp: by.specialActive ? (by.specialActive.kind || '?') : '', tgt: b.target?.pos ? r2(Math.hypot(b.target.pos.x - by.pos.x, b.target.pos.z - by.pos.z)) : -1 });   // (a boss bot's target is the boss: no pos)
}
function makeGroup(id, owner, n, by, levels, t0, ghost) {
  return { id, owner, team: owner.team, by, levels, t0, ghost, ...sizeOf(n), n, taken: new Map(), lvl: 0, boss: null, shell: null, caught: new Set(), hit: 0, sparks: [], done: false, endT: 0, local: !!owner.isLocal };
}
function schedule(g) {
  const hop = SB().hopDelay;
  const lvOf = new Map();
  // (out of the spatial hash at once: a bobber about to blow is no longer anything's target — shots, blasts, links)
  g.levels.forEach((L, k) => { for (const b of L) { b.state = 'blow'; b.blast = g; b.hop = k; b.blowAt = g.t0 + k * hop; lvOf.set(b, k); liveN--; hashDel(b); } });
  // the sparks: down every tether of the chain, from the end that blows first (a level apart; level-mates blow together)
  for (const [b, k] of lvOf) for (const o of b.ten) {
    const ko = lvOf.get(o);
    if (ko === undefined || ko <= k) continue;
    g.sparks.push({ a: b.spot.clone(), b: o.spot.clone(), pa: b.phase, pb: o.phase, t0: g.t0 + k * hop, n: g.n });
  }
  g.endT = g.t0 + (g.levels.length - 1) * hop;
  groups.set(g.id, g);
  tethersDirty = true;
  const c = g.levels[0][0].spot;
  emit('bobber:trigger', { actor: g.owner, by: g.by, n: g.n, pos: c.clone(), team: g.team, ghost: g.ghost });
  if (g.local) onChainHud(g);
}
// (the owner) which bobber of the chain the boss's body / the shell takes its one blast from: the one nearest its
// surface within R(N), with a clear line from 0.3 m above it to that surface point (C1.5)
function pickBoss(g) {
  const B = G.boss;
  if (!B || !B.visible || B.dead || !B.model?.hitShapes) return null;
  let best = null, bd = Infinity;
  for (const L of g.levels) for (const b of L) for (const h of B.model.hitShapes) {
    if (!h.active || h.weak) continue;
    const dc = h.pos.distanceTo(b.spot), d = Math.max(0, dc - h.r);
    if (d > g.R || d >= bd) continue;
    _v.copy(h.pos).lerp(b.spot, Math.min(0.9, h.r / Math.max(h.r, dc)));
    if (!G.physics.los(_v2.copy(b.spot).setY(b.spot.y + 0.3), _v)) continue;
    bd = d; best = b;
  }
  return best;
}
function pickShell(g) {
  const T = G.objTargets;
  if (!T?.spheres || !T.splash) return null;
  _sph.length = 0; T.spheres(_sph);
  let best = null, bd = Infinity;
  for (const s of _sph) {
    if (s.solid === false) continue;
    for (const L of g.levels) for (const b of L) {
      const dc = s.c.distanceTo(b.spot), d = Math.max(0, dc - s.r);
      if (d > g.R || d >= bd) continue;
      _v.copy(s.c).lerp(b.spot, Math.min(1, s.r / Math.max(1e-3, dc)));
      if (!G.physics.los(_v2.copy(b.spot).setY(b.spot.y + 0.3), _v)) continue;
      bd = d; best = b;
    }
  }
  return best;
}
// every blast group's hop levels that are due (a chain's blast may set off another chain: loop until none is due)
function runGroups() {
  for (let guard = 0; guard < 8; guard++) {
    let any = false;
    for (const g of [...groups.values()]) {
      while (!g.done && g.lvl < g.levels.length && G.time >= g.t0 + g.lvl * SB().hopDelay - 1e-6) { blowLevel(g, g.lvl); g.lvl++; any = true; }
      if (!g.done && g.lvl >= g.levels.length) { g.done = true; chainDone(g); }
      if (g.done && G.time - g.endT > 6) groups.delete(g.id);
    }
    if (!any) break;
  }
}
// one hop level of a chain going off (every screen: the owner's real chain, or a ghost's from its [1])
const _cent = new V3();
function blowLevel(g, k) {
  const L = g.levels[k].filter((b) => b.state === 'blow' && b.blast === g);
  if (!L.length) return;
  const own = !g.ghost, col = G.teamColors[g.team], hop = SB().hopDelay;
  _cent.set(0, 0, 0);
  // the look: an explosion per bobber (a chain's particles total ≤ 400: each gets its share), one boom per level
  const fx = G.fx, q0 = fx?.q, share = Math.min(1, (SB().particleCap ?? 400) / (g.n * 54));
  for (const b of L) {
    _cent.add(b.spot);
    if (fx && nearCam(b.spot, 70)) { if (q0 !== undefined) fx.q = q0 * share; try { fx.explosion(_c.copy(b.spot), col, Math.min(g.R, 3.4) * 0.92); } finally { if (q0 !== undefined) fx.q = q0; } }
    emit('bomb:explode', { actor: g.owner, pos: b.spot.clone(), team: g.team, radius: g.R, kind: KIND });
  }
  _cent.multiplyScalar(1 / L.length);
  const N = Math.min(g.n, 8);
  G.cues?.one('bobber_boom', { at: _cent.clone(), owner: g.owner, team: g.team, kind: 'boom', sub: true, pitch: 1.15 - 0.08 * (N - 1), vol: (0.62 + 0.1 * Math.min(N, 4)) * Math.min(2, 1 + 0.25 * (L.length - 1)) });
  if (k + 1 < g.levels.length && nearCam(_cent, 40)) G.audio?.play('bobber_fuse', { pos: _cent, volume: 0.6 });
  if (k === 0) {
    emit('shake', { pos: _cent.clone(), amount: 0.3 + 0.08 * Math.min(N, 4) });
    const loc = G.local;
    if (loc && loc.alive) { const d = loc.pos.distanceTo(_cent); if (d < 14) G.input?.rumble?.(clamp(1 - d / 14, 0, 1) * 0.6, clamp(1 - d / 14, 0, 1) * 0.5, 160); }
  }
  BOBBER_STATS.blasts += L.length;
  // the players this screen owns: the strongest blast of this level on each, its excess over what they took already
  for (const e of G.actors) {
    if (!e.alive || e.team === g.team || e.remote) continue;
    chestOf(e, _v);
    let best = 0, bc = null;
    for (const b of L) {
      const d = b.spot.distanceTo(_v);
      if (d > g.R) continue;
      const dm = falloff(d, g.R, g.dmin, g.dmax);
      if (dm <= best || !G.physics.los(b.spot, _v)) continue;
      best = dm; bc = b;
    }
    if (!bc) continue;
    const prev = g.taken.get(e) || 0;
    if (best <= prev + 0.01) continue;
    g.taken.set(e, best);
    hitVictim(g, e, best - prev, bc.spot);
  }
  // (the owner's screen) its ink, the devices in reach, the boss, the shell
  if (own) {
    const a = g.owner;
    for (const b of L) {
      const c = b.spot;
      let area = 0;
      const f = G.physics.raycast(_v2.copy(c), DOWN, 3.2, _hit);
      const pc = f.hit ? _v2.copy(f.point).setY(f.point.y + 0.2) : _v2.copy(c);
      area += G.paint.splat(pc, g.paint, g.team, { seed: Math.random() });   // (one splat a bobber, C4.1: a big chain paints a lot already)
      if (b.sp) a.addTurfNoSpecial?.(area); else a.addTurf?.(area);
      _chainBlast = true; try { G.subs?.damageArea(c, g.R, g.dev, g.team, a); } finally { _chainBlast = false; }
      if (G.boss) G.boss.splash(a, c, g.R, g.dmax, g.dmin, KIND, { body: b === g.boss });
      if (b === g.shell) G.objTargets?.splash?.(a, c, g.R, g.dmax, g.dmin, KIND);
    }
  }
  // (the owner's HUD) foes in reach as this screen shows them — the callout's ticks (a remote victim's own screen judges it)
  if (g.local) for (const e of G.actors) {
    if (!e.alive || e.team === g.team || !e.remote || g.caught.has(e)) continue;
    chestOf(e, _v);
    for (const b of L) if (b.spot.distanceTo(_v) < g.R && G.physics.los(b.spot, _v)) { g.caught.add(e); break; }
  }
  for (const b of L) { b.state = 'dead'; b.why = 'blown'; }
  void hop;
}
// a victim this screen owns caught by a chain: its damage, its hit (the owner's marker), the triggering teammate's assist
function hitVictim(g, e, dmg, c) {
  if (g.by && g.by !== g.owner && g.by.team === g.team) G.assists?.noteDamage(e, g.by);
  const d2 = G.drainbow?.live ? G.drainbow.cut(g.owner, e, dmg, null, c) : dmg;   // [drainbow] (from: the bobber)
  const killed = e.damage(d2, g.owner, KIND);
  emit('hit', { attacker: g.owner, victim: e, damage: d2, killed, weaponId: KIND });
  g.caught.add(e); g.hit++;
  BOBBER_STATS.hits++; if (killed) { BOBBER_STATS.splats++; if (g.src) srcStat(g.src).splats++; }
  if (G.netm && !e.remote && e.nid !== undefined && g.owner.remote) rec(e, [6, g.id, r2(d2), killed ? 1 : 0]);
}
function chainDone(g) {
  if (!g.ghost) {
    if (g.caught.size) { BOBBER_STATS.hitTriggers++; if (g.src) srcStat(g.src).caught++; } else { BOBBER_STATS.wasted++; THREAT_STATS.chainWasted = (THREAT_STATS.chainWasted || 0) + 1; }
    relink(g.owner);
  } else applyTethers(g.owner);
  tethersDirty = true;
}

// ================================================================================================= hits, endings
// the descriptor for wave 1 (deployables.js devices / crushIn / sweep / _standing) and the bots (§0.2)
function descOf(it) {
  if (it.desc) return it.desc;
  const s = SB();
  return (it.desc = {
    kind: KIND, kit: true, obj: it, get team() { return it.team; }, get owner() { return it.owner; },
    pos: it.dpos, aim: it.aim, r: s.hitR, h: s.hitR * 2, hitH: s.hitR * 2, normal: UP,
    get floor() { return it.floorB; }, get ghost() { return it.ghost; }, get rides() { return it.rb?.on?.b || null; },
    get live() { return it.state === 'live'; },
    prefer: (brain) => preferFor(it, brain),
    hurt: (dmg, by) => hurt(it, dmg, by),
    crush: (how) => finish(it, 2, how === 'lava' ? 'sizzle' : 'crunch'),
    flash: () => { it.flash = 1; },
    teamFire: (by) => teamFire(it, by, 'sweep'),   // (wave 1: a roller / brush sweep, standing fire)
  });
}
function syncDesc(it) { it.aim.copy(it.spot); it.dpos.set(it.spot.x, it.spot.y - SB().hitR, it.spot.z); }
// enemy fire (a shot, beam, blast, sweep, standing fire …): its hp (25) worn down; 0 → disarmed
export function hurt(it, dmg, by) {
  if (it.state !== 'live' || !(dmg > 0)) return;
  G.deploy?.struck(descOf(it), dmg, by || null);   // (the flash wherever it's seen; the shooter's hit marker)
  if (netMuted()) return;                          // (a ghost's shot replayed here: its owner's screen decides)
  if (it.ghost) { netHurt(it.owner, KIND, it.gid, dmg, by); return; }
  it.hp -= dmg;
  if (it.hp <= 0) disarm(it, by);
}
// own-team fire: the chain goes (a ghost: its owner's copy does it, on its own channel — §0.4)
export function teamFire(it, by, how) {
  if (it.state !== 'live') return;
  it.flash = 1;
  if (netMuted()) return;
  if (it.ghost) {
    if (G.time - it.struckT > 0.25) netHurt(it.owner, 'bobberPop', it.gid, 1, by);
    it.struckT = G.time;
    return;
  }
  trigger(it, by, how);
}
function disarm(it, by) {
  if (it.state !== 'live') return;
  BOBBER_STATS.disarmed++;
  DEPLOY_STATS.down[KIND] = (DEPLOY_STATS.down[KIND] || 0) + 1;
  emit('device:down', { kind: KIND, team: it.team, pos: it.spot.clone(), by: by || null, how: 'shot' });
  emit('bobber:disarm', { owner: it.owner, by: by || null, pos: it.spot.clone(), team: it.team });
  if (!it.ghost) rec(it.owner, [2, it.gid, 1]);
  sag(it);
  if (it.owner.isLocal) onDisarmHud(it);
}
// disarmed: its lamps die, its tethers snap, it sags and drops, then pops in a puff 0.4 s later (no blast)
function sag(it) {
  for (const o of it.ten) snapFx(it, o);
  leaveLive(it);
  it.state = 'sag'; it.sagT = 0; it.from.copy(it.spot);
  G.cues?.sub(KIND, 'end', { owner: it.owner, team: it.team, at: it.spot.clone() });
}
// what a bobber ending on this screen leaves behind
function leaveLive(it) {
  if (it.state === 'live') { liveN--; if (!it.ghost) relinkSet.add(it.owner); }
  hashDel(it);
  for (const o of it.ten) { const i = o.ten.indexOf(it); if (i >= 0) o.ten.splice(i, 1); }
  it.ten = [];
  if (it.rb) { it.rb.on = null; it.rb.ride = null; }
  tethersDirty = true;
}
// an ending this kit decided that destroys it (its 0.1 s block test, an era flip, the lava sweep): wave 1's event + count
function ownEnding(it, how) {
  if (it.state !== 'live') return;
  DEPLOY_STATS.crushed[KIND] = (DEPLOY_STATS.crushed[KIND] || 0) + 1;
  emit('device:down', { kind: KIND, team: it.team, pos: it.spot.clone(), by: null, how });
  finish(it, 2, how === 'lava' ? 'sizzle' : 'crunch');
}
// gone without a blast — why: 0 expired · 1 disarmed · 2 crushed · 3 refused · 'drop' (quiet: its owner left / a
// ghost's fallback); look: 'fizzle' | 'crunch' | 'sizzle' | 'puff' | 'quiet'
export function finish(it, why, look) {
  if (it.state === 'dead') return;
  const was = it.state;
  if (why === 2) BOBBER_STATS.crushed++;
  if (!it.ghost && typeof why === 'number' && it.state !== 'sag') rec(it.owner, [2, it.gid, why]);
  leaveLive(it);
  it.state = 'dead'; it.why = why;
  const c = was === 'fly' ? it.pos : it.spot, col = G.teamColors[it.team];
  if (look !== 'quiet' && nearCam(c, 45)) {
    if (look === 'crunch' || look === 'sizzle') {
      G.fx?.explosion(c, col, 0.6);
      G.fx?.burst(c, UP, look === 'sizzle' ? new THREE.Color(1, 0.45, 0.15) : new THREE.Color(0.86, 0.84, 0.8), { count: 10, speed: 3.5, size: 0.06, sheet: false });
      G.cues?.one('device_crunch', { at: c.clone(), owner: it.owner, team: it.team, kind: 'end', range: 50, vol: 0.7 });
    } else if (look === 'puff') {
      G.fx?.burst(c, UP, col, { count: 10, speed: 2.4, size: 0.06, mist: true });
      G.audio?.play('bobber_expire', { pos: c, volume: 0.6, pitch: 0.85 });
    } else {
      G.fx?.burst(c, UP, col, { count: 6, speed: 1.8, size: 0.05, mist: true });
      G.audio?.play('bobber_expire', { pos: c, volume: 0.5 });
    }
  }
  emit('sub:end', { kind: KIND, why: why === 0 ? 'expired' : why === 2 ? 'crushed' : why === 3 ? 'refused' : String(why), team: it.team, pos: c.clone() });
}

// ================================================================================================= online
function ghost(a, d) {
  if (!Array.isArray(d)) return;
  const op = d[0];
  if (op === 0) {
    if (byGid.has(d[1])) return;
    const it = spawn(a, SUBS.bobber, new V3(d[2], d[3], d[4]), new V3(d[5], d[6], d[7]), true, d[1]);
    G.cues?.sub(KIND, 'throw', { owner: a, at: a.pos });
    return it;
  }
  if (op === 6) {   // a hit judged on its victim's screen (a = the victim): the owner's marker, the callout's tick
    const g = groups.get(d[1]);
    if (!g || !a) return;
    g.caught.add(a); g.hit++;
    if (g.owner.isLocal) emit('hit', { attacker: g.owner, victim: a, damage: d[2], killed: !!d[3], weaponId: KIND });
    return;
  }
  if (op === 5) { ghostLists.set(a, d.slice(1)); applyTethers(a); return; }
  const it = byGid.get(d[1]);
  if (!it || !it.ghost || it.state === 'dead') {
    if (op === 1) ghostChain(a, d);   // (some of its bobbers may be gone here already: the rest still go)
    return;
  }
  if (op === 3) {
    if (it.state === 'fly') it.pend3 = d;
    else {
      it.hover = d[5] ?? it.hover;
      if (it.state === 'open') { it.spot.set(d[2], d[3], d[4]); it.baseY = d[3] - it.hover; }
      else { it.spot.x = d[2]; it.spot.z = d[4]; it.easeY = d[3]; it.easeV = Math.max(1, Math.abs(d[3] - it.spot.y) / 0.3); it.baseY = d[3] - it.hover; hashPut(it); if (it.rb) { it.rb.on = null; it.rb.pos.set(d[2], it.baseY, d[4]); } tethersDirty = true; }
    }
  } else if (op === 4) {
    if (it.state !== 'live') it.pend4 = d;
    else { G.deploy?.netOn(rideBody(it), d); syncFromRide(it); }
  } else if (op === 1) ghostChain(a, d);
  else if (op === 2) {
    const why = d[2];
    if (why === 1) { if (it.state === 'live') sag(it); else finish(it, 'drop', 'puff'); }
    else if (why === 2) finish(it, 'drop', 'crunch');
    else if (why === 3) finish(it, 'drop', 'puff');
    else { if (it.state === 'live' || it.state === 'open') finish(it, 'drop', 'fizzle'); else finish(it, 'drop', 'quiet'); }
  }
}
// (a ghost) the owner's chain [1, gid0, N, by, gid, level, …]: the same blasts at this screen's own hop times
function ghostChain(a, d) {
  const n = d[2], by = byNid(d[3]), levels = [];
  const add = (gid, k) => {
    const b = byGid.get(gid);
    if (!b || !b.ghost || b.state === 'dead' || b.state === 'blow') return;
    if (b.state === 'fly' || b.state === 'open') { if (b.state === 'fly' && b.pend3) b.spot.set(b.pend3[2], b.pend3[3], b.pend3[4]); else if (b.state === 'fly') b.spot.copy(b.pos); b.state = 'live'; liveN++; }
    if (b.state === 'sag') return;
    (levels[k] || (levels[k] = [])).push(b);
  };
  add(d[1], 0);
  for (let i = 4; i + 1 < d.length; i += 2) add(d[i], d[i + 1]);
  for (let k = 0; k < levels.length; k++) if (!levels[k]) levels[k] = [];
  if (!levels.length || !levels.some((L) => L.length)) return;
  const g = makeGroup(d[1], a, n, by, levels, G.time, true);
  schedule(g);
}
// a hit on one of our bobbers made on another screen (enemy fire), and a teammate's shot on one ('bobberPop')
function netHurtOwn(gid, dmg, by) { const it = byGid.get(gid); if (it && !it.ghost) hurt(it, dmg, by); }
KIT_GHOSTS.bobberPop = { netHurt(gid, n, by) { const it = byGid.get(gid); if (it && !it.ghost && it.state === 'live') { it.flash = 1; trigger(it, by || null, 'shot'); } } };
// a player who left (netmatch onLeave / _remove): every bobber of theirs on this screen goes at once, quietly (§0.4)
export function dropOwner(a) {
  let n = 0;
  for (const it of items) if (it.owner === a && it.state !== 'dead') { finish(it, 'drop', 'puff'); n++; }
  ghostLists.delete(a); lastList.delete(a);
  return n;
}

// ================================================================================================= per frame
const draw = new BobberDraw();
const _mat = new THREE.Matrix4(), _pos = new V3(), _scl = new V3();
function tick(dt) {
  const t0 = performance.now();
  if (!items.length && !groups.size) { if (draw.sets.some(Boolean)) { draw.begin(G.scene); draw.tethers([]); draw.end(); } hudTick(dt); return; }
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.age += dt; it.t += dt;
    switch (it.state) {
      case 'fly': it.acc += dt; fly(it); break;
      case 'open': open(it); break;
      case 'live': live(it, dt); break;
      case 'sag': it.sagT += dt; if (it.sagT >= SB().sagTime) { finish(it, 'drop', 'puff'); BOBBER_STATS.pops++; } break;
      case 'blow': if (G.time - it.blowAt > 3) it.state = 'dead'; break;   // (never blew: its group went)
    }
    if (it.state !== 'dead') syncDesc(it);
  }
  runGroups();
  for (const a of relinkSet) relink(a);
  relinkSet.clear();
  checkTethers(dt);
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.state !== 'dead') continue;
    if (it.rb) { it.rb.on = null; it.rb.ride = null; }
    hashDel(it);   // (every way out of the world leaves the hash too)
    byGid.delete(it.gid); items.splice(i, 1);
  }
  hudTick(dt);
  render();
  const ms = performance.now() - t0;
  BOBBER_STATS.tickMs += ms; BOBBER_STATS.tickN++; kit.lastTickMs = ms;
}
// the instanced drawing: one matrix (and lamps / flash) per bobber in view, the tethers when they changed
function render() {
  draw.hop = SB().hopDelay;
  draw.begin(G.scene);
  const cam = G.rig?.gameCam || G.camera, far = SB().drawDist ?? 60, far2 = far * far, T = G.time;
  for (const it of items) {
    if (it.state === 'dead' || it.state === 'blow' && G.time >= it.blowAt) continue;
    const vs = subViewScale(KIND), base = WSCALE * vs;
    let k = 1, tilt = 0, dy = 0, sx = 1, sy = 1;
    if (it.state === 'fly') { _pos.copy(it.pos); tilt = it.age * it.spin.x; }
    else if (it.state === 'open') {
      const u = clamp(it.t / SB().deployTime, 0, 1), e = 1 - (1 - u) * (1 - u) * (1 - u);
      _pos.lerpVectors(it.from, it.spot, e);
      k = 0.4 + 0.6 * (1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2));
    } else if (it.state === 'sag') {
      const u = clamp(it.sagT / SB().sagTime, 0, 1);
      _pos.copy(it.spot); _pos.y -= 0.35 * u * u; tilt = 0.8 * u; k = 1 - 0.25 * u; sy = 1 - 0.3 * u;
    } else { _pos.copy(it.spot); dy = bobAt(T, it.phase); }
    _pos.y += dy;
    if (cam && cam.position.distanceToSquared(_pos) > far2) continue;
    const f = it.flash || 0, struck = G.time - it.struckT < 0.6 ? 0.55 + 0.45 * Math.sin(G.time * 40) : 0, fl = Math.max(f, struck);
    sx = 1 + 0.16 * fl; sy *= 1 - 0.12 * fl;
    _e.set(tilt, it.yaw + (it.rideYaw || 0) + T * 0.35, tilt * 0.6, 'YXZ'); _q.setFromEuler(_e);
    _scl.set(base * k * sx, base * k * sy, base * k * sx);
    _mat.compose(_pos, _q, _scl);
    const l = lampsOf(it, _lamps, k);
    draw.bobber(it.team, _mat, l[0], l[1], l[2], l[3], fl * 0.9);
  }
  // (the tether buffer is rewritten only when it changes: the list, a riding / easing bobber, the cue's glow, and as a
  // chain's sparks come and go — the spark itself runs in the shader, so not every frame while a chain's group is kept)
  if (tethersDirty || (sparkNext != null && G.time > sparkNext)) { tethersDirty = false; draw.tethers(tetherList()); }
  draw.end();
}
// the lamps → out[4] (0 off · 0..1 lit, its brightness · 1..2 white-hot): N of 4 lit, one more white-hot for each link
// past 4 (8: four white lamps); the teammate cue's glow (×1.6, pulsing); the last 3 s of its life they blink; dark once
// disarmed; all white-hot as its chain goes
const _lamps = [0, 0, 0, 0];
export function lampsOf(it, out = [0, 0, 0, 0], k = 1) {
  out[0] = out[1] = out[2] = out[3] = 0;
  if (it.state !== 'live' && it.state !== 'blow' && it.state !== 'open') return out;
  const T = G.time, n = it.state === 'blow' ? it.blast?.n || 1 : it.chain?.n || 1;
  const g = it.glow ? 1.0 * (0.88 + 0.12 * Math.sin(T * Math.PI * 6)) : 0.62;
  const age = T - it.born, on = it.blink && it.state === 'live' && Math.sin(age * (12 + 10 * (age - SB().life + 3))) < 0 ? 0 : 1;
  for (let i = 0; i < 4; i++) out[i] = on && i < n ? (n > 4 && i < n - 4 ? 1 + g : g) : 0;
  if (it.state === 'blow') for (let i = 0; i < 4; i++) out[i] = out[i] ? 2 : 0;
  if (it.state === 'open') { out[0] = g * k; out[1] = out[2] = out[3] = 0; }
  return out;
}
const _tl = [];
let sparkNext = null;
const eyeUp = () => B_EYE * WSCALE * subViewScale(KIND);
function tetherList() {
  _tl.length = 0;
  const up = eyeUp();
  for (const it of items) {
    if (it.state !== 'live') continue;
    for (const o of it.ten) {
      if (o.gid < it.gid || o.state !== 'live') continue;
      const n = it.chain?.n || 2, len = it.spot.distanceTo(o.spot);
      _tl.push({ team: it.team, ax: it.spot.x, ay: it.spot.y + up, az: it.spot.z, bx: o.spot.x, by: o.spot.y + up, bz: o.spot.z, pa: it.phase, pb: o.phase,
        sag: 0.03 * len, bright: n <= 2 ? 0.6 : n === 3 ? 0.75 : n === 4 ? 0.9 : Math.min(1.2, 1 + 0.05 * (n - 4)), glow: it.glow || o.glow ? 1 : 0, s0: -99, sd: 0 });
    }
  }
  // a chain going off: its tethers stay until the spark has run down them (sparkNext: when the next one drops out)
  sparkNext = null;
  for (const g of groups.values()) for (const s of g.sparks) {
    const end = s.t0 + SB().hopDelay + 0.03;
    if (G.time > end) continue;
    if (sparkNext == null || end < sparkNext) sparkNext = end;
    _tl.push({ team: g.team, ax: s.a.x, ay: s.a.y + up, az: s.a.z, bx: s.b.x, by: s.b.y + up, bz: s.b.z, pa: s.pa, pb: s.pb, sag: 0.03 * s.a.distanceTo(s.b), bright: 1.1, glow: 0, s0: s.t0, sd: 1 });
  }
  return _tl;
}

// ================================================================================================= the hooks
const _res = { t: 0, dist: 0 };
// the closest approach of segment a → b to point p: { t, d }
function segPoint(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = dx * dx + dy * dy + dz * dz;
  let t = L > 1e-12 ? ((p.x - a.x) * dx + (p.y - a.y) * dy + (p.z - a.z) * dz) / L : 0;
  t = clamp(t, 0, 1);
  const x = a.x + dx * t - p.x, y = a.y + dy * t - p.y, z = a.z + dz * t - p.z;
  _res.t = t; _res.dist = Math.sqrt(x * x + y * y + z * z);
  return _res;
}
// (tests / sub-scale) the live bobber a shot segment would touch, without touching it
export function shotProbe(prev, pos) {
  if (!liveN) return null;
  const R = SB().hitR;
  let best = null, bt = Infinity;
  for (const it of near(Math.min(prev.x, pos.x) - R, Math.min(prev.z, pos.z) - R, Math.max(prev.x, pos.x) + R, Math.max(prev.z, pos.z) + R)) {
    if (it.state !== 'live') continue;
    const r = segPoint(prev, pos, it.spot);
    if (r.dist < R && r.t < bt) { bt = r.t; best = it; }
  }
  return best;
}
const kit = SUB_KITS[KIND] = {
  use,
  ghost,
  netHurt: netHurtOwn,
  tick,
  clear() {
    for (const it of items) { if (it.rb) { it.rb.on = null; it.rb.ride = null; } }
    items.length = 0; byGid.clear(); H.clear(); groups.clear(); lastList.clear(); ghostLists.clear(); relinkSet.clear(); liveN = 0; tethersDirty = true; sparkNext = null;
    draw.clear(); hudClear(); guideOff();
  },
  // every shot / beam touching it is absorbed: own team's sets the chain off, the enemy's wears it down
  blockShot(prev, pos, team, dmg, by) {
    if (!liveN || !(dmg > 0)) return false;
    const it = shotProbe(prev, pos);
    if (!it) return false;
    if (it.team === team) teamFire(it, by || null, 'shot'); else hurt(it, dmg, by || null);
    return true;
  },
  blockRay(from, dir, len, team, dmg, by) {
    if (!liveN || !(dmg > 0)) return len;
    const R = SB().hitR, ex = from.x + dir.x * len, ez = from.z + dir.z * len;
    let best = len, hit = null;
    for (const it of near(Math.min(from.x, ex) - R, Math.min(from.z, ez) - R, Math.max(from.x, ex) + R, Math.max(from.z, ez) + R)) {
      if (it.state !== 'live') continue;
      const t = _v.copy(it.spot).sub(from).dot(dir);
      if (t <= 0 || t >= best) continue;
      if (_v2.copy(from).addScaledVector(dir, t).distanceTo(it.spot) < R + 0.04) { best = t; hit = it; }
    }
    if (!hit) return len;
    if (hit.team === team) teamFire(hit, by || null, 'beam'); else hurt(hit, dmg, by || null);
    return Math.max(0.1, best - R * 0.5);
  },
  // a blast (G.subs.damageArea, never a ghost's): every bobber whose centre is within its radius + hitR (no line test)
  damageArea(c, radius, dmg, team, by) {
    if (!liveN || !(dmg > 0)) return;
    const R = radius + SB().hitR, L = near(c.x - R, c.z - R, c.x + R, c.z + R).slice();
    for (const it of L) {
      if (it.state !== 'live' || it.spot.distanceTo(c) >= R) continue;
      if (it.team === team) teamFire(it, by || null, 'blast'); else hurt(it, dmg, by || null);
    }
  },
  // the Mega Stamp's swing guard: enemy bobbers in front of it are smashed (disarmed)
  smash(c, r, team, front) {
    if (!liveN) return;
    for (const it of near(c.x - r, c.z - r, c.x + r, c.z + r).slice()) {
      if (it.state !== 'live' || it.team === team || it.spot.distanceTo(c) > r || (front && !front(it.spot))) continue;
      if (it.ghost) { netHurt(it.owner, KIND, it.gid, SB().hp, null); it.flash = 1; } else disarm(it, null);
    }
  },
  devices(out) { for (const it of items) if (it.state === 'live') out.push(descOf(it)); return out; },
  rideBodies(out) { for (const it of items) if (it.state === 'live' && it.rb && !it.rb.on) out.push(it.rb); return out; },
  // caldera's destroyWhere (H17 / H19): own bobbers whose sphere bottom is in its lava end with the sizzle
  lavaSweep(pred) { let n = 0; for (const it of items) if (!it.ghost && it.state === 'live' && pred(it.dpos)) { ownEnding(it, 'lava'); n++; } return n; },
  dropOwner,
  // the minimap (any team's: they're in plain sight): small team dots, their tethers as thin lines
  drawMap(c, map, tc, s, hex) {
    if (!items.length) return;
    c.lineWidth = Math.max(1, s * 0.12);
    const A = { x: 0, y: 0 }, B = { x: 0, y: 0 };
    for (const it of items) {
      if (it.state !== 'live') continue;
      for (const o of it.ten) if (o.gid > it.gid && o.state === 'live') {
        map.toCanvas(it.spot.x, it.spot.z, A); map.toCanvas(o.spot.x, o.spot.z, B);
        c.strokeStyle = hex[it.team] || '#fff'; c.globalAlpha = 0.75; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.globalAlpha = 1;
      }
    }
    for (const it of items) {
      if (it.state !== 'live') continue;
      map.toCanvas(it.spot.x, it.spot.z, tc);
      const r = Math.max(1.2, s * 0.32);
      c.beginPath(); c.arc(tc.x, tc.y, r + 1, 0, Math.PI * 2); c.fillStyle = '#15121c'; c.fill();
      c.beginPath(); c.arc(tc.x, tc.y, r, 0, Math.PI * 2); c.fillStyle = hex[it.team] || '#fff'; c.fill();
    }
  },
  prompt: (a) => kitPrompt(a),
  botAct,
  webHit, holdThrow,   // [b5-int3] (bots: a throw / blast that would set off an own idle chain — bots.js, glide.js, dash.js, mitts.js)
  dangers: botDangers,
  bot: botKit,
  items, groups, BOBBER_STATS, resetBobberStats, sizeOf, falloff, liquidTop, spotFor, predictSpot, relink, trigger, hurt, teamFire, finish, shotProbe, near, draw, DRAW_STATS, throwFrom, lampsOf,
  liveCount: () => liveN,
  lastTickMs: 0,
  // (tests / sub-scale) a stand-in node carrying a bobber's drawn size (the world draws them instanced)
  drawNode(it) { const g = new THREE.Group(), m = new THREE.Mesh(worldGeometry().body); m.scale.setScalar(WSCALE * subViewScale(KIND)); g.add(m); g.position.copy(it.spot); return m; },
};
// (not in bots.js THROWN: the generic bomb lobs — onto a zone's enemy ink, a tower's riders, a remembered foe, over a
// shield — would waste a bobber that only goes off on follow-up fire; its bots throw it through bot.paint / bot.fight)
void THROWN;

// ---- the world's own endings it listens for
// bluestone's era flips (§0.6): a block in `on` round its sphere ends it; its floor in `off` makes it re-float
on('era:flip', (e) => {
  if (!items.length || !G.level) return;
  const onB = (e?.on || []).map((id) => G.level.blocks[id]).filter(Boolean), off = new Set(e?.off || []);
  for (const it of [...items]) {
    if (it.ghost || it.state !== 'live') continue;
    if (onB.some((b) => G.level.pointInBlock(b, it.spot, SB().hitR))) { ownEnding(it, 'flip'); continue; }
    if (it.floorB >= 0 && off.has(it.floorB)) lost(it);
  }
});
// a squidkid taken out of the match (netmatch _remove → match.removeActor): its bobbers go with it
on('actor:removed', (e) => { if (e?.actor) dropOwner(e.actor); });
