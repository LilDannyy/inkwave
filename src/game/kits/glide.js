// Glide Bomb (kit sub 'glide') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §A.
//
// The user: "A bomb that travels in a straight line across the floor, leaving a trail of ink and bouncing off of walls
// and obstacles. It explodes after its timer expires. The maximum distance of the bomb can be shortened by holding the
// deployment button to 'cook' the timer before release. This makes the blast radius larger."
//
// HOLD (SPEC A1.1). Press the sub button: the kid raises the stone. One clock: `held` is the time since the press, the
// cook is clamp(held − cookGrace 0.15, 0, cookMax 1.8) — a tap never cooks. From held 0.15 s the fuse burns in the hand:
// the 8 lamps round its waist go out one by one, a team glow grows round the fist, the fuse sizzles; the main weapon is
// locked (SUB_KITS.glide.lockMain → weapons.js: no shot, a charge dropped; walking, jumping, aiming and diving still work).
// Full cook at held 1.95 s (a clink, the HUD bar flashes); 1.0 s later (held 2.95 s) the stone slips out as if released
// (ink paid, 0.6 s fuse) and the still-held button does nothing more (runner.subSpent). Without the ink it never cooks.
// A hold that stops without a throw (splatted, dived, a runner reset: a pipe, a pick-up, a super jump, a loadout swap)
// fizzles in the hand: no ink. A Bomb Barrage's stone never cooks and never locks the main weapon.
// RELEASE. 65 % ink; set down 0.5 m ahead of the feet (at the feet if a wall is closer), off along the aim's yaw at
// speed0 10 m/s; let go in the air it drops from the hand (gravity 24) and slides where it lands.
// SLIDE (A1.3). Fixed 1/60 s steps through an accumulator on every screen (≤ 6 a frame): slows 3 m/s² linearly to no
// less than 1.2 m/s; a splat of 0.55 m every 0.35 m (a swimmable lane); rides steps ≤ 0.3 m and ramps; sails off
// ledges (no slowing in the air) and slides on where it lands; rides moving floors.
// BOUNCES (A1.4): walls (|n.y| < 0.6) and risers over 0.3 m struck at its middle (0.14 m), an enemy Drip Curtain, any
// team's Scrap Sentry (kit devices of kind 'sentry'), an intact Roe Shell (G.objTargets.spheres), pipes, glass, the tower
// and every mover's sides (taking their velocity): v ← v − (1 + e)(v·n)n, e 0.8, × 0.92. An enemy kid (r 0.38 round the
// axis, feet within ±0.8 m): e 0.5, × 0.6, once per 0.25 s each — a clonk, never a blast. Teammates don't touch it.
// FUSE (A1.5): 2.4 s − the cook; its blast radius rides with it as a faint ring, then over the last 0.8 s the Splat Bomb's
// danger ring with beep pulses quickening 7 → 20 a second. BLAST (A1.6): radius 2.2 → 3.2, 180 / 35 with the k² falloff
// from the centre to the chest and a line of sight; paint 1.8 → 2.8 (+ satellites); enemy devices 40 → 60
// (G.subs.damageArea); the boss and the Bazookarp's shell take the true numbers (G.boss.splash, G.objTargets.splash).
// Turf and special charge through the subs' credit rule (a barrage's: turf only).
// ENDINGS WITHOUT A BLAST (A1.7): sunk (the sea, a stage module's liquid, lava — G.match.lava.under / stage.sink); popped
// by enemy fire (hp 40: a puff, 'device:hit' / 'device:down' how 'shot'); smashed by an enemy Mega Stamp's guard.
// ONLINE (A8, docs/NET.md): kit records ['k', nid, 'glide', …] — [5, level] the cook in the hand (1, 2, 3; 0 a fizzle);
// [0, gid, x, y, z, vx, vz, fuse, R] the release; [4, gid, x, y, z, vx, vz, fuse] the owner's word at every bounce and
// every 0.25 s; [1, gid, x, y, z] the blast; [2, gid, why] an end without one (0 sank, 1 popped, 2 smashed). Ghosts slide
// with the same step function, never paint, hurt, blow or pop on their own (a ghost at the end of its fuse holds, pulsing,
// until the owner's word: 2 s at most). Hits on a ghost go to the owner (netHurt; a Stamp's smash on the 'glideSmash'
// channel). The owner's screen judges players in the blast; each victim's owner applies it (applyHit, as every bomb).
//
// Events: 'sub:use' { actor, kind, cook }, 'sub:charge' { actor, kind: 'glide', level, max } (cook levels),
// 'glide:bounce' { pos, kind: 'wall' | 'player' | …, speed, team }, 'bomb:explode' { actor, pos, team, radius, kind: 'glide' },
// 'device:hit' / 'device:down' (shot down), 'sub:destroyed' { kind: 'glide', pos, team }, 'glide:end' { why, pos, team }.
import * as THREE from 'three';
import { G, emit, on, clamp, lerp } from '../../core/ctx.js';
import { PLAYER, SUBS, subViewScale } from '../../config.js';
import { SUB_KITS, KIT_GHOSTS, netRec, netId, netHurt, netMuted, ghostMute } from './registry.js';
import { Physics, Hit } from '../physics.js';
import { DEPLOY_STATS } from '../deployables.js';
import { makeMesh, disposeMesh, setLamps, litFor, LAMPS, GRIP, LAMP_GEO, lampAt, lampMats, SUB_SCALE } from './glide-model.js';
import { Guide, CookBar, makeGlow } from './glide-guide.js';
import { GLIDE_SOUNDS } from '../../audio/sfx-glide.js';

const KIND = 'glide';
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0);
const GRAV = 24;
const MID = 0.14;            // m: the puck's middle over its foot (walls are struck here)
const STEP_UP = 0.3;         // m: risers it rides over
const SNAP_K = 0.75;         // a drop of more than this × the step's run (or 6 cm) is a ledge: it sails off
const MAX_STEPS = 6;         // fixed steps a frame at most
const R_KID = 0.38, KID_DY = 0.8, KID_CD = 0.25;   // an enemy kid as a bumper: radius round the axis, feet within ±, cooldown
const R_SENTRY = 0.32;       // a Scrap Sentry as a bumper
const r2 = (x) => Math.round(x * 100) / 100;
const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3(), _q = new V3();
const _hit = new Hit(), _hit2 = new Hit();
const _res = { t: 0, dist: 0 };
const _devs = [], _sph = [];
const S = () => SUBS.glide;

// counters (tests / match.cjs)
export const GLIDE_STATS = { uses: 0, cookSum: 0, cooked: 0, slips: 0, fizzles: 0, blasts: 0, popped: 0, sunk: 0, smashed: 0, bounces: 0, kidBounces: 0, hits: 0, dmg: 0, botFight: 0, botPaint: 0 };
export function resetGlideStats() { for (const k in GLIDE_STATS) GLIDE_STATS[k] = 0; }

// ================================================================================================= the numbers
export const cookOf = (held, s = S()) => clamp(held - s.cookGrace, 0, s.cookMax);
const share = (cook, s) => clamp(cook / s.cookMax, 0, 1);
export const radiusOf = (cook, s = S()) => lerp(s.radius, s.radiusMax, share(cook, s));
export const paintOf = (cook, s = S()) => lerp(s.paintRadius, s.paintRadiusMax, share(cook, s));
export const devDmgOf = (cook, s = S()) => lerp(s.devDamage, s.devDamageMax, share(cook, s));
export const fuseOf = (cook, s = S()) => s.fuse - cook;
export const levelOf = (cook, s = S()) => (cook >= s.cookMax - 1e-6 ? 3 : cook >= (s.cookMax * 2) / 3 - 1e-6 ? 2 : cook >= s.cookMax / 3 - 1e-6 ? 1 : 0);
// the reach of an f-second slide on the flat (linear slowing to minSpeed) — A2: 10 × 2.4 − 1.5 × 2.4² = 15.4 m uncooked
export function reachOf(f, s = S()) {
  const t1 = (s.speed0 - s.minSpeed) / s.decel;
  return f <= t1 ? s.speed0 * f - 0.5 * s.decel * f * f : s.speed0 * t1 - 0.5 * s.decel * t1 * t1 + s.minSpeed * (f - t1);
}
// the fuse that slides D m on the flat (the bots' cook planning)
export function fuseFor(D, s = S()) { let lo = 0, hi = s.fuse; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (reachOf(m, s) < D) lo = m; else hi = m; } return (lo + hi) / 2; }

// ================================================================================================= the slide (one step)
// s: { p (foot), v, air, t } — a stone, a ghost, or a guide / prediction run. ctx: { team, kids (bounce off enemy kids),
// cd (the kid cooldowns, keyed on the stone's own clock), frameDt } or null (walls and the level's bumpers only).
// Returns the bounce (or null): { kind, nx, nz, speed, who }.
const _bounce = { kind: '', nx: 0, nz: 0, speed: 0, who: null };
function reflect(v, nx, nz, e, keep) {
  const l = Math.hypot(nx, nz); if (l < 1e-6) return 0;
  nx /= l; nz /= l;
  const vn = v.x * nx + v.z * nz;
  if (vn >= 0) return 0;
  v.x -= (1 + e) * vn * nx; v.z -= (1 + e) * vn * nz;
  v.x *= keep; v.z *= keep;
  _bounce.nx = nx; _bounce.nz = nz;
  return -vn;
}
// a moving block's velocity this frame (its centre's move over our last look; a still one 0)
const _dyn = new Map();
function dynVel(b) { const r = _dyn.get(b); return r && r.t === G.time ? r.v : null; }
function trackDyn(dt) {
  for (const b of G.level?.dyn || []) {
    let r = _dyn.get(b);
    if (!r) { _dyn.set(b, (r = { c: b.center.clone(), v: new V3(), t: G.time })); continue; }
    if (r.t === G.time) continue;
    r.v.subVectors(b.center, r.c).multiplyScalar(1 / Math.max(1 / 240, dt)); r.c.copy(b.center); r.t = G.time;
  }
}
export function slideStep(s, h, ctx) {
  const sb = S(), p = s.p, v = s.v, L = G.level;
  let hit = 0;
  _bounce.who = null;
  if (s.air) v.y -= GRAV * h;
  else {
    v.y = 0;
    const sp = Math.hypot(v.x, v.z);
    if (sp > 1e-6) { const ns = Math.max(sb.minSpeed, sp - sb.decel * h); if (ns !== sp) { const k = ns / sp; v.x *= k; v.z *= k; } }
  }
  const x0 = p.x, z0 = p.z, y0 = p.y;
  // ---- along the floor, walls first (struck at its middle)
  const dx = v.x * h, dz = v.z * h, len = Math.hypot(dx, dz);
  if (len > 1e-7) {
    const ux = dx / len, uz = dz / len;
    const r = G.physics.raycast(_a.set(p.x, p.y + MID, p.z), _d.set(ux, 0, uz), len + sb.bodyRadius, _hit);
    let wall = r.hit && Math.abs(r.normal.y) < 0.6;
    if (wall && !s.air) {   // a riser it rides over? (the floor just past the face no higher than a step)
      const gy = L.groundHeight(r.point.x + ux * 0.06, r.point.z + uz * 0.06, p.y + STEP_UP + 0.02);
      if (gy > p.y + 0.02 && gy <= p.y + STEP_UP + 1e-3) wall = false;
    }
    if (wall) {
      const adv = Math.max(0, r.dist - sb.bodyRadius - 0.005);
      p.x += ux * adv; p.z += uz * adv;
      const b = L.blocks[r.block], bv = b?.dynamic ? dynVel(b) : null;
      if (bv) { v.x -= bv.x; v.z -= bv.z; }   // (off a mover: in its own frame, then its velocity back on)
      hit = reflect(v, r.normal.x, r.normal.z, sb.restitution, sb.scrape);
      if (bv) { v.x += bv.x; v.z += bv.z; }
      if (hit) _bounce.kind = b?.dynamic ? 'mover' : 'wall';
    } else { p.x += dx; p.z += dz; }
  }
  // ---- what isn't level geometry
  if (!hit) hit = bumpers(s, ctx);
  // ---- the floor: follow it (steps, ramps), or sail off a ledge
  if (!s.air) {
    const gy = L.groundHeight(p.x, p.z, p.y + STEP_UP + 0.02);
    const run = Math.hypot(p.x - x0, p.z - z0);
    if (gy === -Infinity || gy < p.y - Math.max(0.06, run * SNAP_K)) { s.air = true; v.y = 0; }
    else p.y = gy;
  } else {
    p.y += v.y * h;
    const gy = L.groundHeight(p.x, p.z, y0 + 0.05);
    if (gy > -Infinity && p.y <= gy) { p.y = gy; s.air = false; v.y = 0; s.landed = true; }
  }
  s.t = (s.t || 0) + h;
  if (!hit) return null;
  _bounce.speed = hit;
  return _bounce;
}
// enemy kids, an enemy Drip Curtain, any Scrap Sentry, an intact Roe Shell
function bumpers(s, ctx) {
  const sb = S(), p = s.p, v = s.v, team = ctx ? ctx.team : -1, my = p.y + MID;
  if (ctx && ctx.kids) {
    for (const e of G.actors || []) {
      if (e.team === team || !e.alive || e.superJumpState) continue;
      if (Math.abs(e.pos.y - p.y) > KID_DY) continue;
      const dx = p.x - e.pos.x, dz = p.z - e.pos.z, d = Math.hypot(dx, dz), R = R_KID + sb.bodyRadius;
      if (d >= R) continue;
      const nx = d > 1e-4 ? dx / d : -v.x, nz = d > 1e-4 ? dz / d : -v.z;
      const ready = (ctx.cd.get(e) ?? -9) <= (s.t || 0);
      const hit = ready ? reflect(v, nx, nz, sb.playerE, sb.playerKeep) : 0;
      const nl = Math.hypot(nx, nz) || 1;
      p.x = e.pos.x + (nx / nl) * R; p.z = e.pos.z + (nz / nl) * R;   // (never inside a kid)
      if (hit) { ctx.cd.set(e, (s.t || 0) + KID_CD); _bounce.kind = 'kid'; _bounce.who = e; return hit; }
    }
  }
  if (ctx) {
    for (const it of G.subs?.items || []) {
      if (it.state !== 'curtain' || it.team === team) continue;
      const c = it.sub, rx = p.x - it.pos.x, rz = p.z - it.pos.z;
      const along = rx * it.tan.x + rz * it.tan.z, across = rx * it.n.x + rz * it.n.z;
      if (Math.abs(across) >= sb.bodyRadius || Math.abs(along) > c.width / 2 + sb.bodyRadius || my < it.pos.y - 0.3 || my > it.pos.y + c.height) continue;
      const side = across >= 0 ? 1 : -1;
      p.x += it.n.x * (side * sb.bodyRadius - across); p.z += it.n.z * (side * sb.bodyRadius - across);
      const hit = reflect(v, it.n.x * side, it.n.z * side, sb.restitution, sb.scrape);
      if (hit) { _bounce.kind = 'curtain'; return hit; }
    }
  }
  // any team's Scrap Sentry (the sentry kit's device descriptors), the guide's runs too
  _devs.length = 0;
  for (const k in SUB_KITS) if (k !== KIND) SUB_KITS[k].devices?.(_devs);
  for (const d of _devs) {
    if (d.kind !== 'sentry' || d.live === false) continue;
    const dx = p.x - d.pos.x, dz = p.z - d.pos.z, dist = Math.hypot(dx, dz), R = (d.r || R_SENTRY) + sb.bodyRadius;
    if (dist >= R || my < d.pos.y - 0.3 || my > d.pos.y + (d.h || 0.72)) continue;
    const nx = dist > 1e-4 ? dx / dist : -v.x, nz = dist > 1e-4 ? dz / dist : -v.z, nl = Math.hypot(nx, nz) || 1;
    p.x = d.pos.x + (nx / nl) * R; p.z = d.pos.z + (nz / nl) * R;
    const hit = reflect(v, nx, nz, sb.restitution, sb.scrape);
    if (hit) { _bounce.kind = 'sentry'; return hit; }
  }
  // an intact Roe Shell (Bazookarp: G.objTargets.spheres — none on any other mode)
  _sph.length = 0;
  G.objTargets?.spheres?.(_sph);
  for (const o of _sph) {
    if (o.solid === false) continue;
    const dy = my - o.c.y;
    if (Math.abs(dy) >= o.r) continue;
    const R = Math.sqrt(o.r * o.r - dy * dy) + sb.bodyRadius, dx = p.x - o.c.x, dz = p.z - o.c.z, dist = Math.hypot(dx, dz);
    if (dist >= R) continue;
    const nx = dist > 1e-4 ? dx / dist : -v.x, nz = dist > 1e-4 ? dz / dist : -v.z, nl = Math.hypot(nx, nz) || 1;
    p.x = o.c.x + (nx / nl) * R; p.z = o.c.z + (nz / nl) * R;
    const hit = reflect(v, nx, nz, sb.restitution, sb.scrape);
    if (hit) { _bounce.kind = 'shell'; return hit; }
  }
  return 0;
}
// where a slide from p (velocity v, in the air or not) for f s ends, ignoring kids: the guide, the bots' prediction.
// pts (optional): the floor points along it, cut after `maxBounces` bounces. Returns { x, y, z, bounces, sunk }
const _sim = { p: new V3(), v: new V3(), air: false, t: 0 }, _simOut = { x: 0, y: 0, z: 0, bounces: 0, sunk: false };
export function simulate(p, v, air, f, team, pts = null, maxBounces = 3, ctx = null) {
  const s = _sim, h = S().step || 1 / 60, n = Math.min(Math.round(f / h), 240);
  s.p.copy(p); s.v.copy(v); s.air = air; s.t = 0;
  const c = ctx || _simCtx; c.team = team;
  _simOut.bounces = 0; _simOut.sunk = false;
  if (pts) { pts.length = 0; pts.push({ x: p.x, y: p.y, z: p.z }); }
  let cut = false;
  for (let i = 0; i < n; i++) {
    const b = slideStep(s, h, c);
    if (b) { _simOut.bounces++; if (_simOut.bounces > maxBounces) cut = true; }
    if (sinks(s.p, s.air)) { _simOut.sunk = true; break; }
    if (pts && !cut && (i % 2 === 1 || b)) pts.push({ x: s.p.x, y: s.p.y, z: s.p.z });
  }
  if (pts && !cut) pts.push({ x: s.p.x, y: s.p.y, z: s.p.z });
  _simOut.x = s.p.x; _simOut.y = s.p.y; _simOut.z = s.p.z;
  return _simOut;
}
const _simCtx = { team: -1, kids: false, cd: null, frameDt: 0 };
// sunk: off the map into the sea, under a stage module's liquid, into lava ('' when not)
function sinks(p, air) {
  if (p.y < PLAYER.waterY - 1.8) return 'sea';
  if (air && p.y < PLAYER.waterY && G.level.groundHeight(p.x, p.z, p.y + 0.05) === -Infinity) return 'sea';
  const lq = G.level.liquidY?.(p.x, p.z);
  if (lq > PLAYER.waterY + 0.01 && p.y + 0.05 < lq) return 'liquid';
  const LV = G.match?.lava;
  if (LV?.under?.(p)) return 'lava';
  return '';
}

// ================================================================================================= the stones
const items = [];
const vs0 = () => subViewScale(KIND);
function spawn(a, sub, p, v, air, fuse, R, cook, ghost, gid) {
  const s = sub || S(), vs = vs0();
  const m = makeMesh(a.team, vs);
  m.mat0 = [m.body.material, m.ink.material];   // (its own look, under the hit flash)
  m.outer.position.copy(p);
  m.outer.rotation.y = Math.atan2(v.x, v.z);
  G.scene.add(m.outer);
  const it = { kind: KIND, owner: a, team: a.team, sub: s, gid, ghost: !!ghost, sp: !!a.specialActive,
    p: p.clone(), v: v.clone(), air: !!air, t: 0, age: 0, acc: 0, trail: s.trailEvery, fuse, fuse0: Math.max(0.05, fuse), R, cook,
    paintR: paintOf(cook, s), devDmg: devDmgOf(cook, s), hp: s.hp, state: 'slide', recT: 0.25, bounces: 0, cd: new Map(),
    err: new V3(), m, vs, spin: m.outer.rotation.y, flash: 0, flashT: 0, holdT: 0, why: null, dbw: 0, thr: null,
    pred: { t: -9, x: 0, y: 0, z: 0, n: -1 }, floorB: null, floorId: -1, ctx: null };
  it.pos = it.p;   // (the generic name: cues, tests, liveIn)
  it.ctx = { team: it.team, kids: true, cd: it.cd, frameDt: 1 / 60 };
  items.push(it);
  look(it, 0);
  return it;
}
// where a stone is set down: 0.5 m ahead of the feet along the aim's yaw (at the feet if a wall is closer); in the air:
// the hand, to drop from
function startOf(a, out) {
  const fx = Math.sin(a.aimYaw), fz = Math.cos(a.aimYaw);
  if (!a.grounded) { out.set(a.pos.x + fx * 0.3, a.pos.y + 0.95, a.pos.z + fz * 0.3); return true; }
  const r = G.physics.raycast(_e.set(a.pos.x, a.pos.y + MID, a.pos.z), _q.set(fx, 0, fz), 0.5 + S().bodyRadius, _hit2);
  const ahead = r.hit && Math.abs(r.normal.y) < 0.6 ? 0 : 0.5;
  out.set(a.pos.x + fx * ahead, a.pos.y, a.pos.z + fz * ahead);
  const gy = G.level.groundHeight(out.x, out.z, a.pos.y + STEP_UP);
  if (gy === -Infinity || gy < a.pos.y - 0.4) { out.y = a.pos.y + 0.05; return true; }   // (over a drop: it falls)
  out.y = gy;
  return false;
}

// ---- the release (SubSystem.use, after the runner paid the ink)
function use(subs, a, sub) {
  const s = sub || S(), r = a.weaponRunner, st = r?.glide;
  const bar = a.specialActive?.kind === 'barrage';
  const cook = !bar && st && G.time - st.t1 < 0.25 ? st.cook : 0;
  if (a.bot) botAimAt(a);
  if (st) endHold(a, false);
  const p = new V3(), air = startOf(a, p);
  const v = new V3(Math.sin(a.aimYaw) * s.speed0, 0, Math.cos(a.aimYaw) * s.speed0);
  const fuse = fuseOf(cook, s), R = radiusOf(cook, s);
  const it = spawn(a, s, p, v, air, fuse, R, cook, false, netId(a));
  netRec(a, KIND, [0, it.gid, r2(p.x), r2(p.y), r2(p.z), r2(v.x), r2(v.z), r2(fuse), r2(R)]);
  GLIDE_STATS.uses++; GLIDE_STATS.cookSum += cook; if (cook > 0) GLIDE_STATS.cooked++;
  if (a.isLocal && !a.bot && cook <= 0 && !bar) tapNote();
  G.cues?.sub(KIND, 'throw', { owner: a, at: a.pos, pitch: 1.05 - 0.12 * share(cook, s) });   // sfx-cues: its release thock
  emit('sub:use', { actor: a, kind: KIND, cook });
  return it;
}

// ---- per frame
function tickOne(it, dt) {
  it.age += dt;
  it.ctx.frameDt = dt;
  if (it.state === 'slide') {
    ride(it);
    it.acc += dt / (it.sub.step || 1 / 60);
    let n = 0;
    while (it.acc >= 1 - 1e-6 && n < MAX_STEPS && it.state === 'slide') { it.acc -= 1; n++; stepOnce(it); }
    if (n === MAX_STEPS) it.acc = Math.min(it.acc, 1);
    if (it.state === 'slide') pushed(it, dt);
    if (it.ghost) correct(it, dt);
  } else if (it.state === 'hold') {   // (a ghost at the end of its fuse: the owner's word decides)
    it.holdT += dt;
    if (it.holdT > 2) quietEnd(it, 'timeout');
  }
  if (it.ghost && it.age > it.fuse0 + 6 && it.state !== 'dead') quietEnd(it, 'timeout');   // (its owner left mid-slide)
  if (it.state !== 'dead') look(it, dt);
}
function stepOnce(it) {
  const s = it.sub, h = s.step || 1 / 60, p = it.p;
  _b.set(p.x, p.y + MID, p.z);
  const b = slideStep(it, h, it.ctx);
  if (G.drainbow?.live && !it.dbw) G.drainbow.pass(it, _b, _c.set(p.x, p.y + MID, p.z), it.team);   // [drainbow] (its blast is halved)
  // the trail: a splat every trailEvery m on the floor (a ghost's are muted: its owner's arrive)
  if (!it.air) {
    it.trail += Math.hypot(p.x - _b.x, p.z - _b.z);
    while (it.trail >= s.trailEvery) { it.trail -= s.trailEvery; credit(it, G.paint.splat(_c.set(p.x, p.y + 0.12, p.z), s.trailRadius, it.team, { seed: Math.random() })); }
  } else it.trail = Math.min(it.trail, s.trailEvery);
  if (b) onBounce(it, b);
  if (it.landed) { it.landed = false; it.pred.t = -9; if (near(p, 30)) G.audio?.play('glide_bounce', { pos: p, volume: 0.35, pitch: 0.7 }); }
  const sk = sinks(p, it.air);
  if (sk) return sink(it, sk);
  if (!it.ghost && G.match?.stage?.sink?.(p, KIND)) return sink(it, 'stage');   // [b5-stagehooks] (the lava's own test)
  it.fuse -= h;
  if (!it.ghost && (it.recT -= h) <= 0) rec4(it);
  if (it.fuse <= 1e-6) {
    if (it.ghost) { it.state = 'hold'; it.holdT = 0; }
    else blast(it);
  }
}
function onBounce(it, b) {
  it.bounces++; it.pred.t = -9;
  if (!it.ghost) { GLIDE_STATS.bounces++; if (b.kind === 'kid') GLIDE_STATS.kidBounces++; rec4(it); }
  const vol = clamp(b.speed / 8, 0.15, 1);
  if (near(it.p, 35)) G.audio?.play('glide_bounce', { pos: _c.set(it.p.x, it.p.y + MID, it.p.z), volume: vol, pitch: b.kind === 'kid' ? 0.8 : 1 });
  if (near(it.p, 30)) G.fx?.burst?.(_c.set(it.p.x + b.nx * 0.2, it.p.y + MID, it.p.z + b.nz * 0.2), _e.set(b.nx, 0.4, b.nz), G.teamColors[it.team], { count: 4, speed: 2.2, size: 0.05, sheet: false });
  emit('glide:bounce', { pos: it.p.clone(), kind: b.kind, speed: b.speed, team: it.team, who: b.who || null, ghost: it.ghost });
}
function rec4(it) {
  it.recT = 0.25;
  if (it.ghost || !it.gid) return;
  netRec(it.owner, KIND, [4, it.gid, r2(it.p.x), r2(it.p.y), r2(it.p.z), r2(it.v.x), r2(it.v.z), Math.round(it.fuse * 1000) / 1000]);
}
// a moving floor under it carries it (its block's move since our last look)
function ride(it) {
  if (it.air) { it.floorB = null; it.floorId = -1; return; }
  const r = G.physics.raycast(_e.set(it.p.x, it.p.y + 0.2, it.p.z), DOWN, 0.5, _hit2);
  const b = r.hit ? G.level.blocks[r.block] : null;
  it.floorId = b ? b.id : -1;   // (its device descriptor's floor)
  if (!b || !b.dynamic || b.solid === false) { it.floorB = null; return; }
  if (it.floorB === b && it.floorC) { it.p.x += b.center.x - it.floorC.x; it.p.y += b.center.y - it.floorC.y; it.p.z += b.center.z - it.floorC.z; }
  it.floorB = b; (it.floorC || (it.floorC = new V3())).copy(b.center);
}
// a moving block running into it: carried out of its way with the block's velocity (a mover's side is a wall)
function pushed(it, dt) {
  const L = G.level;
  if (!L.dyn.length) return;
  _e.set(it.p.x, it.p.y + MID, it.p.z);
  for (const b of L.dyn) {
    if (b.solid === false || b === it.floorB || !L.pointInBlock(b, _e, S().bodyRadius * 0.5)) continue;
    const bv = dynVel(b);
    if (!bv) continue;
    const sp = Math.hypot(bv.x, bv.z);
    if (sp < 1e-3) continue;
    const nx = bv.x / sp, nz = bv.z / sp;
    // out ahead of it, then off it like off a wall in its own frame
    let k = 0; while (k++ < 20 && L.pointInBlock(b, _e, S().bodyRadius * 0.5)) { it.p.x += nx * 0.05; it.p.z += nz * 0.05; _e.set(it.p.x, it.p.y + MID, it.p.z); }
    it.v.x -= bv.x; it.v.z -= bv.z;
    const hit = reflect(it.v, nx, nz, S().restitution, S().scrape);
    it.v.x += bv.x; it.v.z += bv.z;
    if (hit) { _bounce.kind = 'mover'; _bounce.speed = hit; _bounce.who = null; onBounce(it, _bounce); }
    break;
  }
}
// a ghost eases onto its owner's word (k = 1 − e^(−14 dt))
function correct(it, dt) {
  const e = it.err;
  if (e.lengthSq() < 1e-8) return;
  const k = 1 - Math.exp(-14 * dt);
  it.p.x += e.x * k; it.p.y += e.y * k; it.p.z += e.z * k;
  e.multiplyScalar(1 - k);
}

// ---- the look: the drawn stone at its foot, curling (0.8 rad/s per m/s), its lamps the fuse left; the faint size ring,
// then the danger ring and beeps over its last 0.8 s; the white hit flash
function look(it, dt) {
  const m = it.m, s = it.sub, sp = Math.hypot(it.v.x, it.v.z);
  m.outer.position.copy(it.p);
  it.spin += 0.8 * sp * dt;
  m.outer.rotation.y = it.spin;
  const k = clamp(it.fuse / it.fuse0, 0, 1), n = litFor(it.fuse / s.fuse);
  setLamps(m.lamps, m.mats, it.state === 'hold' ? 1 : n);
  const last = it.fuse < 0.8 || it.state === 'hold';
  m.mats.on.emissiveIntensity = n <= 1 || last ? 1 + 2.6 * Math.max(0, Math.sin(it.age * (last ? 26 : 12))) : 2.2;
  it.flash = Math.max(0, it.flash - dt * 5.5);
  const f = it.flash, base = SUB_SCALE * it.vs;
  m.model.scale.set(base * (1 + 0.14 * f), base * (1 - 0.1 * f), base * (1 + 0.14 * f));
  const white = f > 0.45;
  if (white !== !!it._white) { it._white = white; m.body.material = white ? flashMat(it.team) : m.mat0[0]; m.ink.material = white ? flashMat(it.team) : m.mat0[1]; }
  if (!G.fx || !near(it.p, 55) || dt <= 0) return;
  const col = G.teamColors[it.team];
  _c.set(it.p.x, it.p.y + 0.03, it.p.z);
  if (last) {
    // the Splat Bomb's windup language: the danger ring, beep pulses 7 → 20 a second
    const w = it.state === 'hold' ? 1 : clamp(1 - it.fuse / Math.min(0.8, it.fuse0), 0, 1);
    it.flashT += dt * (7 + 13 * w);
    G.fx.dangerRing?.(_c, UP, col, it.R, w);
    if (it.flashT >= 1) { it.flashT -= 1; G.fx.beepPulse?.(_e.set(it.p.x, it.p.y + MID * it.vs * 1.6, it.p.z), _c, UP, col, it.R, w); }
  } else G.fx.mark?.(_c, UP, col, it.R, 3, 0.3, 0, 0.8, 0.37);   // (its size, faint, riding with it: fx.js R_DANGER)
}
const _flash = new Map();
function flashMat(team) {
  const c = G.teamColors[team], k = c.getHexString();
  let m = _flash.get(k);
  if (!m) _flash.set(k, (m = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).lerp(c, 0.18) })));
  return m;
}
function near(p, r) { const c = G.rig?.gameCam || G.camera; return !!c && c.position.distanceToSquared(p) < r * r; }
function credit(it, area) { if (!(area > 0) || !it.owner) return; if (it.sp) it.owner.addTurfNoSpecial(area); else it.owner.addTurf(area); }

// ---- the blast (the owner's; a ghost's on its owner's word: the look only — its paint muted, its hits dropped)
function blast(it) {
  if (it.state === 'dead') return;
  const s = it.sub, a = it.owner, team = it.team, col = G.teamColors[team], R = it.R;
  const c = new V3(it.p.x, it.p.y + 0.25, it.p.z);
  if (!it.ghost) netRec(a, KIND, [1, it.gid, r2(it.p.x), r2(it.p.y), r2(it.p.z)]);
  it.state = 'dead'; it.why = 'blast';
  // ink: the floor under it and four satellites (subs.js _paint)
  let area = G.paint.splat(_c.set(it.p.x, it.p.y + 0.2, it.p.z), it.paintR, team, { seed: Math.random() });
  for (let k = 0; k < 4; k++) {
    const ang = Math.random() * Math.PI * 2, rr = it.paintR * (0.55 + Math.random() * 0.45);
    area += G.paint.splat(_c.set(c.x + Math.cos(ang) * rr, c.y + 0.3, c.z + Math.sin(ang) * rr), 0.5 + Math.random() * 0.4, team, { seed: Math.random() });
  }
  credit(it, area);
  G.fx?.explosion(c, col, R);
  G.cues?.sub(KIND, 'boom', { owner: a, team, at: c, pitch: lerp(1.1, 0.85, share(it.cook, s)), radius: R });   // sfx-cues: pitched by the cook
  emit('shake', { pos: c.clone(), amount: 0.45 + 0.25 * share(it.cook, s) });
  emit('bomb:explode', { actor: a, pos: c.clone(), team, radius: R, kind: KIND, ghost: it.ghost });
  const loc = G.local;
  if (loc && loc.alive) { const d = loc.pos.distanceTo(c); if (d < 14) G.input?.rumble?.(clamp(1 - d / 14, 0, 1) * 0.6, clamp(1 - d / 14, 0, 1) * 0.5, 160); }
  if (it.ghost) return;
  GLIDE_STATS.blasts++;
  // damage: k = 1 − clamp((d − 0.8) / (R − 0.8)), lerp(min, max, k²), from the centre to the chest, with a line of sight
  _b.copy(c); _b.y += 0.3;
  for (const e of G.actors) {
    if (e.team === team || !e.alive) continue;
    _a.copy(e.pos); _a.y += e.form === 'squid' ? 0.3 : 0.7;
    const d = _a.distanceTo(c);
    if (d > R || !G.physics.los(_b, _a)) continue;
    const k = 1 - clamp((d - 0.8) / (R - 0.8), 0, 1), dmg = lerp(s.damageMin, s.damageMax, k * k);
    GLIDE_STATS.hits++; GLIDE_STATS.dmg += dmg;
    G.projectiles.applyHit(a, e, dmg, KIND, it.dbw ? it : null, c);   // ([drainbow] the shot through a bubble: halved)
  }
  G.subs?.damageArea(c, R, it.devDmg, team, a);              // enemy devices 40 → 60 ([b5-deploy] by: the hit marker)
  G.boss?.splash(a, c, R, s.damageMax, s.damageMin, KIND);  // Boss Battle: the true numbers
  G.objTargets?.splash?.(a, c, R, s.damageMax, s.damageMin, KIND);   // Bazookarp's Roe Shell (SPEC §0.6)
}
// sunk: a plop (a hiss and steam in lava), no blast, no paint after it
function sink(it, why) {
  if (it.state === 'dead') return;
  if (!it.ghost) { netRec(it.owner, KIND, [2, it.gid, 0]); GLIDE_STATS.sunk++; }
  it.state = 'dead'; it.why = 'sunk:' + why;
  const LV = G.match?.lava;
  if (why === 'lava' && LV?.fizzle) LV.fizzle(it.p, KIND);
  else if (near(it.p, 40)) {
    G.audio?.play('glide_plop', { pos: it.p, volume: 0.7 });
    G.fx?.burst?.(_c.set(it.p.x, Math.max(it.p.y, PLAYER.waterY) + 0.05, it.p.z), UP, new THREE.Color('#bfe9ff'), { count: 10, speed: 3, size: 0.07 });
  }
  emit('glide:end', { why: 'sunk', pos: it.p.clone(), team: it.team });
}
// popped by enemy fire (why 1) / smashed by a Mega Stamp's guard (2): a harmless puff
function pop(it, why, by) {
  if (it.state === 'dead') return;
  if (!it.ghost) netRec(it.owner, KIND, [2, it.gid, why]);
  it.state = 'dead'; it.why = why === 2 ? 'smashed' : 'popped';
  _c.set(it.p.x, it.p.y + MID, it.p.z);
  if (near(_c, 40)) {
    const col = G.teamColors[it.team];
    G.fx?.burst?.(_c, UP, col, { count: 12, speed: 2.8, size: 0.07, mist: true });
    G.fx?.ring?.(_e.set(it.p.x, it.p.y + 0.03, it.p.z), UP, col, { radius: 0.8, life: 0.3 });
    G.cues?.sub(KIND, 'end', { owner: it.owner, team: it.team, at: _c.clone() });   // sfx-cues: its thup and fizz
  }
  emit('sub:destroyed', { kind: KIND, pos: _c.clone(), team: it.team });
  emit('glide:end', { why: it.why, pos: it.p.clone(), team: it.team });
  if (it.ghost) return;
  if (why === 1) {
    GLIDE_STATS.popped++;
    DEPLOY_STATS.down[KIND] = (DEPLOY_STATS.down[KIND] || 0) + 1;
    emit('device:down', { kind: KIND, team: it.team, pos: it.p.clone(), by: by || null, how: 'shot' });
  } else GLIDE_STATS.smashed++;
}
// an end without a look worth a sound (its owner left, a ghost never told): a small puff
function quietEnd(it, why) {
  if (it.state === 'dead') return;
  it.state = 'dead'; it.why = why;
  if (near(it.p, 30)) G.fx?.burst?.(_c.set(it.p.x, it.p.y + MID, it.p.z), UP, G.teamColors[it.team], { count: 6, speed: 1.8, size: 0.05, sheet: false });
}
function dispose(it) {
  G.scene?.remove(it.m.outer);
  disposeMesh(it.m);
}

// ---- enemy fire: hp 40 (the shot capsule hitR 0.22 × hitH 0.24 — config numbers, never the drawn model)
function hurt(it, dmg, by) {
  if (it.state === 'dead' || !(dmg > 0)) return;
  it.flash = 1;
  if (near(it.p, 30) && G.time - (it._tokT ?? -9) > 0.09) { it._tokT = G.time; G.cues?.one('device_hit', { at: _c.set(it.p.x, it.p.y + MID, it.p.z), owner: it.owner, team: it.team, kind: 'end', vol: 0.8 }); }
  if (netMuted()) return;   // (a ghost's shot / blast: only the flash — the owner's own copy hit our ghost of it, and that comes by netHurt)
  DEPLOY_STATS.hits++; DEPLOY_STATS.dmg += dmg;
  emit('device:hit', { attacker: by || null, kind: KIND, team: it.team, damage: dmg, obj: it, pos: it.p.clone() });
  if (it.ghost) { netHurt(it.owner, KIND, it.gid, dmg, by); return; }   // (a remote player's: its owner's copy takes it)
  it.hp -= dmg;
  if (it.hp <= 0) pop(it, 1, by);
}
// (the shot shape: hitR round its middle — hitH 0.24 is under 2 × hitR, so the capsule is a ball at the middle)
// its device descriptor (deployables.js: wave 1's rolling and standing fire, the device list — SPEC §0.2's shape). The
// bots never pick it as a device to shoot (prefer 0): it's a threat to them (threats() / bots.js), shot down from there.
// It is a bomb, not a device (SPEC A5): nothing crushes it — `crushable: false` keeps it out of G.deploy.crushIn (the
// tower, the re-forming Roe Shell, a lava / era-flip sweep: crushIn skips a descriptor with it, one tagged line at
// integration). The tower's and every mover's sides are walls it bounces off (pushed, slideStep), a moving floor carries
// it (ride: `rides` / `floor` are that block), lava sinks it on its own (sinks), the shell shoves it out once solid.
function devOf(it) {
  if (it.dev) return it.dev;
  const aim = new V3(), s = it.sub;
  it.dev = { kind: KIND, kit: true, obj: it, team: it.team, owner: it.owner, pos: it.p, r: s.hitR, h: s.hitH, hitH: s.hitH, normal: UP, crushable: false,
    get rides() { return it.floorB || null; },
    get floor() { return it.floorId ?? -1; },
    get aim() { return aim.set(it.p.x, it.p.y + MID, it.p.z); },
    get ghost() { return it.ghost; },
    get live() { return it.state === 'slide' || it.state === 'hold'; },
    prefer: () => 0,
    hurt: (dmg, by) => hurt(it, dmg, by),
    crush: () => {},   // (never: crushable false — a crushIn that ignored the flag would only have emitted its event)
    flash: () => { it.flash = 1; } };
  return it.dev;
}
const capFoot = (it, out) => out.set(it.p.x, it.p.y + MID - it.sub.hitR, it.p.z);

// ================================================================================================= holding (the cook)
function newHold(a) {
  const pressT = a._subPressT != null && a._subPressT <= G.time && a._subPressT > G.time - 0.25 ? a._subPressT : G.time;
  return { t0: pressT, t1: G.time, held: 0, cook: 0, level: 0, full: false, loop: null, plan: null, aimYaw: null };
}
function hold(runner, dt, inp, sub) {
  const a = runner.a;
  if (a.specialActive?.kind === 'barrage') return;   // a barrage's stone never cooks (the barrage keeps the main weapon free)
  let st = runner.glide;
  if (st && G.time - st.t1 > 0.15) { endHold(a, true); st = null; }   // (a stale cook: the hold was interrupted)
  if (!st) st = runner.glide = newHold(a);
  st.t1 = G.time;
  const s = sub || S();
  if (a.ink < s.inkCost) {   // without the ink it never cooks (no lock, no slip)
    if (st.level > 0) { st.level = 0; st.full = false; netRec(a, KIND, [5, 0]); }   // (drained mid-cook — poison: the cook is gone)
    st.t0 = G.time; st.held = 0; st.cook = 0;
  }
  else {
    st.held = G.time - st.t0;
    st.cook = cookOf(st.held, s);
    const lv = levelOf(st.cook, s);
    if (lv > st.level) {
      st.level = lv;
      netRec(a, KIND, [5, lv]);
      emit('sub:charge', { actor: a, kind: KIND, level: lv, max: lv === 3 });
      if (lv === 3) { st.full = true; if (a.isLocal || a._nearCamera?.()) G.audio?.play('glide_clink', { pos: a.isLocal ? undefined : a.pos, volume: a.isLocal ? 0.9 : 0.6 }); if (a.isLocal) G.input?.rumble?.(0.2, 0.4, 90); }
    }
    // held a full second past full cook: it slips out, as if let go (the runner throws it this frame; the held button is spent)
    if (st.held >= s.cookGrace + s.cookMax + s.overHold - 1e-6) {
      inp.sub = false; inp.subReleased = true;
      runner.subSpent = true;
      GLIDE_STATS.slips++;
      emit('glide:slip', { actor: a });
      return;
    }
  }
  if (a.bot) botHold(a, st, inp, s);
}
// the cook ends: thrown (fizzle false) or dropped in the hand (true: the fizzle look, [5, 0], no ink)
function endHold(a, fizzle) {
  const r = a.weaponRunner, st = r?.glide;
  if (!st) return;
  r.glide = null;
  st.loop?.stop(0.08);
  if (fizzle && st.cook > 0) {
    netRec(a, KIND, [5, 0]);
    GLIDE_STATS.fizzles++;
    emit('glide:fizzle', { actor: a });
    if (a.isLocal || a._nearCamera?.()) {
      const p = gripWorld(a, _c) || _c.set(a.pos.x, a.pos.y + 1.1, a.pos.z);
      G.fx?.burst?.(p, UP, a.color, { count: 7, speed: 1.4, size: 0.04, sheet: false });
      G.fx?.mist?.(p, _e.set(0, 0.8, 0), a.color, 0.1, 0.3);
      G.audio?.play('glide_fizzle', { pos: a.isLocal ? undefined : p, volume: a.isLocal ? 0.8 : 0.55 });
    }
  }
  handLook(a, 0, 0, false);
}
// SUB_KITS.glide.lockMain: the main weapon is locked while the stone cooks — read at the top of the runner's update, so
// from the frame after the grace (held this frame > 0.15 s; never without the ink: its clock waits, nor in a barrage)
function lockMain(runner) {
  const st = runner.glide;
  if (!runner.aimingSub || !st || G.time - st.t1 > 0.15 || runner.a.specialActive?.kind === 'barrage') return false;
  return G.time - st.t0 > (runner.a.sub?.kind === KIND ? runner.a.sub : S()).cookGrace + 1e-6;
}
on('splatted', ({ victim }) => { if (victim?.weaponRunner?.glide) endHold(victim, true); netCook.delete(victim); });

// ---- the stone in the fist, on every screen: its lamps (8, then out one by one with the cook; online: by level, 8 / 5 /
// 3 / 1), the last one throbbing at full cook; a team glow round the fist (0.15 m at level 1 … 0.3 m full)
const LEVEL_LIT = [8, 5, 3, 1];
const _glows = new Map();   // actor → sprite
function handProp(a) {
  const b = a.character?.bomb;
  if (!b || b.kind !== KIND) return null;
  const g = b.group;
  let hp = g.userData.glide;
  if (!hp) {
    const mats = lampMats(a.color);
    const lamps = Array.from({ length: LAMPS }, (_, k) => { const m = lampAt(new THREE.Mesh(LAMP_GEO, mats.on), k); g.add(m); return m; });
    hp = g.userData.glide = { group: g, lamps, mats };
  }
  return hp;
}
function gripWorld(a, out) {
  const b = a.character?.bomb;
  if (!b || b.kind !== KIND || !b.group.visible) return null;
  b.group.updateWorldMatrix(true, false);
  return out.copy(GRIP).applyMatrix4(b.group.matrixWorld);
}
// lit: lamps lit; k: 0..1 the cook (the glow); throb: the last lamp throbbing
function handLook(a, lit, k, throb) {
  const hp = handProp(a);
  if (hp) {
    hp.mats.on.emissive.copy(a.color).lerp(_white, 0.25); hp.mats.off.emissive.copy(a.color);
    setLamps(hp.lamps, hp.mats, lit || LAMPS);
    hp.mats.on.emissiveIntensity = throb ? 1 + 2.8 * Math.max(0, Math.sin(G.time * 50)) : 2.2;
  }
  let gl = _glows.get(a);
  if (k <= 0) { if (gl) gl.visible = false; return; }
  const p = gripWorld(a, _c);
  if (!p) { if (gl) gl.visible = false; return; }
  if (!gl) { gl = makeGlow(a.color); _glows.set(a, gl); }
  if (gl.parent !== G.scene) G.scene?.add(gl);
  gl.material.color.copy(a.color);
  const r = 0.075 + 0.225 * k;
  gl.scale.setScalar(r * 2 * (1 + (throb ? 0.12 * Math.sin(G.time * 30) : 0)));
  gl.position.copy(p); gl.visible = true;
}
const _white = new THREE.Color(1, 1, 1);
// remote players' cook levels ([5, level] records), until their subAim flag drops
const netCook = new Map();
function handsTick(dt) {
  for (const a of G.actors || []) {
    const r = a.weaponRunner;
    if (!r) continue;
    const st = r.glide;
    if (st) {
      // a hold that stopped without a throw: the runner let go of the sub (a reset, a dive) or hold() hasn't run for 0.15 s
      if (!r.aimingSub || G.time - st.t1 > 0.15 || !a.alive) { endHold(a, true); continue; }
      const s = a.sub?.kind === KIND ? a.sub : S(), k = share(st.cook, s), slipIn = s.cookGrace + s.cookMax + s.overHold - st.held;
      handLook(a, st.cook > 0 ? Math.max(1, LAMPS - Math.round((LAMPS - 1) * k)) : LAMPS, k, st.full);
      sizzle(a, st, k, slipIn < 0.5);
      continue;
    }
    if (!a.remote) { if (_glows.get(a)?.visible) handLook(a, 0, 0, false); continue; }
    const nc = netCook.get(a);
    if (nc && (!r.aimingSub || !a.alive)) { netCook.delete(a); handLook(a, 0, 0, false); stopSizzle(nc); continue; }
    if (nc && a.sub?.kind === KIND) { const lv = nc.level; handLook(a, LEVEL_LIT[lv], lv / 3, lv >= 3); sizzle(a, nc, lv / 3, false); }
  }
}
// the fuse sizzle: the local player's (2D), others' within 12 m at half volume
function sizzle(a, st, k, warn) {
  const hear = a.isLocal || (G.camera && G.camera.position.distanceToSquared(a.pos) < 144);
  if (!hear || k <= 0) { stopSizzle(st); return; }
  if (!st.loop) st.loop = G.audio?.loop('glide_cook', { pos: a.isLocal ? undefined : a.pos, volume: a.isLocal ? 0.7 : 0.35, params: { k, warn: warn ? 1 : 0 } }) || null;
  st.loop?.set({ pos: a.isLocal ? undefined : a.pos, volume: (a.isLocal ? 0.45 : 0.25) + (a.isLocal ? 0.5 : 0.25) * k, params: { k, warn: warn ? 1 : 0 } });
}
function stopSizzle(st) { if (st?.loop) { st.loop.stop(0.08); st.loop = null; } }

// ================================================================================================= the local player's aids
const guide = new Guide(), bar = new CookBar();
const _gpts = [], _gp = new V3(), _gv = new V3();
let chipK = null;   // the sub chip's text while we show the reach in it
function aids() {
  const a = G.local, r = a?.weaponRunner, bb = a?.specialActive?.kind === 'barrage' ? a.specialActive.bomb : null, sub = bb || a?.sub;
  const show = !!(a && a.alive && r?.aimingSub && sub?.kind === KIND && a.form !== 'squid' && G.match && !G.match.attract);
  if (!show) {
    guide.show(false); bar.update(null);
    if (chipK != null) { const chip = G.hud?.subChip; if (chip && a) chip.lastChild.textContent = a.specialActive?.kind === 'barrage' ? 'FREE' : `${Math.round((a.sub || S()).inkCost)}%`; chipK = null; }
    return;
  }
  const s = sub, st = r.glide, cook = bb ? 0 : st?.cook || 0, paid = !!bb || a.ink >= s.inkCost;
  const f = fuseOf(cook, s), R = radiusOf(cook, s);
  if (G.time - guide.t >= 0.05 || guide.t > G.time) {   // the path: 20 a second (between, only the ring's radius follows the cook)
    guide.t = G.time;
    const air = startOf(a, _gp);
    _gv.set(Math.sin(a.aimYaw) * s.speed0, 0, Math.cos(a.aimYaw) * s.speed0);
    const o = simulate(_gp, _gv, air, f, a.team, _gpts, 3);
    guide.end.set(o.x, o.y, o.z); guide.ok = !o.sunk;
    guide.setLine(_gpts);
  }
  const col = paid ? a.color : _grey;
  guide.show(true, col, paid ? 0.85 : 0.55);
  if (guide.ok) guide.ring(col, R, 0);
  // the HUD: the cook bar, the reach in the sub chip
  const slipIn = st ? s.cookGrace + s.cookMax + s.overHold - st.held : 9;
  bar.update(bb ? null : { cook: share(cook, s), full: !!st?.full, warn: !!st?.full && slipIn < 0.5 });
  const chip = G.hud?.subChip;
  if (chip) {
    if (chipK == null) chipK = chip.lastChild.textContent;
    const t = `${Math.round(reachOf(f, s))} m`;
    if (chip.lastChild.textContent !== t) chip.lastChild.textContent = t;
  }
}
const _grey = new THREE.Color(0.55, 0.56, 0.6);
// the light tutorial (main.js): the first two uncooked taps a match → a hint for a few seconds
let _tapN = 0, _tapT = -9, _tapM = null;
function tapNote() { if (G.match !== _tapM) { _tapM = G.match; _tapN = 0; } if (_tapN < 2) { _tapN++; _tapT = G.time; } }
function prompt(a) {
  if (!a || a !== G.local || G.match !== _tapM || G.time - _tapT > 3.2 || a.weaponRunner?.aimingSub) return null;
  return G.input?.lastDevice === 'pad' ? 'Hold {RB} to cook the Glide Bomb: shorter slide, bigger blast' : 'Hold [RMB] or [E] to cook the Glide Bomb: shorter slide, bigger blast';
}

// ================================================================================================= online
function ghost(a, d) {
  if (!Array.isArray(d)) return;
  const op = d[0];
  if (op === 5) {   // the cook in the hand reached a level (0: it fizzled)
    if (d[1] > 0) netCook.set(a, { level: clamp(d[1] | 0, 1, 3), t: G.time, loop: netCook.get(a)?.loop || null });
    else { const nc = netCook.get(a); stopSizzle(nc); netCook.delete(a); handLook(a, 0, 0, false); if (nc && (a._nearCamera?.() ?? true)) G.audio?.play('glide_fizzle', { pos: a.pos, volume: 0.5 }); }
    return;
  }
  const gid = d[1];
  if (op === 0) {
    if (items.some((x) => x.gid === gid)) return;
    const nc = netCook.get(a); stopSizzle(nc); netCook.delete(a); handLook(a, 0, 0, false);
    const s = a.specialActive?.kind === 'barrage' && a.specialActive.bomb?.kind === KIND ? a.specialActive.bomb : S();
    const fuse = d[7], R = d[8], cook = clamp(s.fuse - fuse, 0, s.cookMax);
    const p = new V3(d[2], d[3], d[4]), gy = G.level.groundHeight(p.x, p.z, p.y + 0.05);
    spawn(a, s, p, new V3(d[5], 0, d[6]), !(gy > -Infinity && p.y - gy < 0.06), fuse, R, cook, true, gid);
    G.cues?.sub(KIND, 'throw', { owner: a, at: a.pos, pitch: 1.05 - 0.12 * share(cook, s) });
    return;
  }
  const it = items.find((x) => x.ghost && x.gid === gid && x.state !== 'dead');
  if (!it) return;
  if (op === 4) {
    it.err.set(d[2] - it.p.x, d[3] - it.p.y, d[4] - it.p.z);
    if (it.err.lengthSq() > 9) { it.p.set(d[2], d[3], d[4]); it.err.set(0, 0, 0); }   // (way off: snap)
    it.v.x = d[5]; it.v.z = d[6]; it.fuse = d[7];
    const gy = G.level.groundHeight(d[2], d[4], d[3] + 0.05);
    it.air = !(gy > -Infinity && d[3] - gy < 0.06);
    if (it.state === 'hold' && it.fuse > 0) it.state = 'slide';
    it.pred.t = -9;
  } else if (op === 1) { it.p.set(d[2], d[3], d[4]); blast(it); }
  else if (op === 2) { if (d[2] === 0) sink(it, 'net'); else pop(it, d[2]); }
}
function netHurtOwn(gid, dmg, by) { const it = items.find((x) => !x.ghost && x.gid === gid && x.state !== 'dead'); if (it) hurt(it, dmg, by); }
// a Mega Stamp's guard smashed our stone on another screen
KIT_GHOSTS.glideSmash = { netHurt: (gid) => { const it = items.find((x) => !x.ghost && x.gid === gid && x.state !== 'dead'); if (it) pop(it, 2); } };

// ================================================================================================= bots
// Facing one (bots.js _threatScore / _threatCtl `slider` branches, botSpecials.js specialDangers): the predicted stop,
// re-predicted every 0.2 s or on a bounce; noticed only as a player could (seen, or heard rumbling within 8 m)
function predict(it) {
  const P = it.pred;
  if (G.time - P.t < 0.2 && P.t <= G.time && P.n === it.bounces) return P;
  P.t = G.time; P.n = it.bounces;
  const o = simulate(it.p, it.v, it.air, Math.max(0, it.fuse), it.team, null, 99, _predCtx);
  P.x = o.x; P.y = o.y; P.z = o.z; P.sunk = o.sunk;
  return P;
}
const _predCtx = { team: -1, kids: false, cd: null, frameDt: 0 };
// how close a bot at (x, z) is to the stone's lane ahead (to the predicted stop; 9: not ahead of it)
function laneDist(it, x, z) {
  const P = predict(it), ax = it.p.x, az = it.p.z, bx = P.x - ax, bz = P.z - az, l2 = bx * bx + bz * bz;
  if (l2 < 1e-4) return 9;
  const u = ((x - ax) * bx + (z - az) * bz) / l2;
  if (u < 0 || u > 1) return 9;
  return Math.hypot(ax + bx * u - x, az + bz * u - z);
}
const knows = (it, a) => {
  const dx = it.p.x - a.pos.x, dz = it.p.z - a.pos.z;
  if (dx * dx + dz * dz < 64) return true;   // (heard: it rumbles)
  return G.physics.los(_e.set(a.pos.x, a.pos.y + 1.1, a.pos.z), _q.set(it.p.x, it.p.y + MID, it.p.z));
};
function threatOf(it) {
  if (it.thr) return it.thr;
  const v = new V3(), stop = new V3();
  it.thr = {
    kind: KIND, obj: it, team: it.team, owner: it.owner, pos: it.p, aimY: 0.12, trigger: 0, ground: true, slider: true, locked: false, target: null,
    get live() { return it.state !== 'dead'; },
    get state() { return it.state; },
    get hp() { return it.hp; },
    get vel() { return v.set(it.v.x, it.air ? it.v.y : 0, it.v.z); },
    get speed() { return Math.hypot(it.v.x, it.v.z); },
    get radius() { return it.R; },
    get shootable() { return it.state === 'slide'; },
    get fuse() { return Math.max(0, it.fuse); },
    get stopAt() { const P = predict(it); return stop.set(P.x, P.y, P.z); },
    // bots.js _threatScore's slider branch: 1.2 + 2 / (0.3 + fuse) in the stop disc or on the lane ahead; else 0
    score(a) {
      if (it.state === 'dead' || !knows(it, a)) return 0;
      const P = predict(it), inDisc = Math.hypot(a.pos.x - P.x, a.pos.z - P.z) < it.R + 0.5 && Math.abs(a.pos.y - P.y) < 2.5;
      if (!inDisc && !(laneDist(it, a.pos.x, a.pos.z) < 1 && Math.abs(a.pos.y - it.p.y) < 1.2)) return 0;
      return 1.2 + 2 / (0.3 + Math.max(0, it.fuse));
    },
    // … and _threatCtl's: in the stop disc with the fuse under 1.5 s, or on the lane ahead and it gets here within 1 s
    urgent(a) {
      const P = predict(it);
      if (it.fuse < 1.5 && Math.hypot(a.pos.x - P.x, a.pos.z - P.z) < it.R + 0.5) return true;
      const sp = Math.hypot(it.v.x, it.v.z);
      return laneDist(it, a.pos.x, a.pos.z) < 1 && Math.hypot(a.pos.x - it.p.x, a.pos.z - it.p.z) < sp * 1;
    },
  };
  return it.thr;
}
// botSpecials.js: its blast where it'll stop (null when it can't hurt anyone: dead, sunk on the way)
const _dgr = { x: 0, y: 0, z: 0, R: 0, core: 0, tIn: 0, lethal: 1 };
export function dangerOf(it) {
  if (it.state === 'dead') return null;
  const P = predict(it);
  if (P.sunk) return null;
  const R = it.R, s = it.sub;
  _dgr.x = P.x; _dgr.y = P.y; _dgr.z = P.z; _dgr.R = R;
  _dgr.core = 0.8 + (1 - Math.sqrt((PLAYER.hp - s.damageMin) / (s.damageMax - s.damageMin))) * (R - 0.8);   // (where it splats a full-health kid)
  _dgr.tIn = Math.max(0, it.fuse); _dgr.lethal = R >= 2.6 ? 2 : 1;
  return _dgr;
}
// Using it (SPEC A7). fight: a foe in sight 5–15 m off on our level with a clear floor line → the cook that stops it on
// them, led (planned in hold: botHold); paint: an uncooked lane down a stretch that's under 40 % ours
function fight(brain, dist) {
  const a = brain.a, t = brain.target, s = a.sub?.kind === KIND ? a.sub : S();
  if (!t || !t.alive || !(brain.seeTimer > 0) || dist < 5 || dist > 15 || Math.abs(t.pos.y - a.pos.y) > 1.2 || a.ink < s.inkCost + 5) return false;
  if (Math.random() > 0.03 * (1 + brain.diff.fireDiscipline)) return false;
  if (!brain._dryLine(a.pos.x, a.pos.y, a.pos.z, t.pos.x, t.pos.z) || !brain._fatLos(a.pos.x, a.pos.y - 0.15, a.pos.z, t.pos.x, t.pos.y - 0.15, t.pos.z)) return false;
  brain.bombCd = 6 + Math.random() * 5;
  brain._glide = { mode: 'fight', t };
  GLIDE_STATS.botFight++;
  return true;
}
function paint(brain) {
  const a = brain.a, s = a.sub?.kind === KIND ? a.sub : S();
  if (Math.random() > 0.008 || a.ink < s.inkCost + 8) return false;
  const fx = Math.sin(a.aimYaw), fz = Math.cos(a.aimYaw);
  let own = 0, n = 0;
  for (const d of [2, 6, 10]) {
    const st = G.paint.regionStats(a.pos.x + fx * d, a.pos.y, a.pos.z + fz * d, 2, brain.inkTeam ?? a.team, _rs);
    if (st.n) { own += st.own / st.n; n++; }
  }
  if (!n || own / n >= 0.4) return false;
  if (!brain._dryLine(a.pos.x, a.pos.y, a.pos.z, a.pos.x + fx * 10, a.pos.z + fz * 10)) return false;
  // (the whole uncooked slide: not off the stage into the sea or a liquid — the guide's own prediction, ignoring kids)
  const air = startOf(a, _gp); _gv.set(fx * s.speed0, 0, fz * s.speed0);
  if (simulate(_gp, _gv, air, s.fuse, a.team, null, 99).sunk) return false;
  brain.bombCd = 9 + Math.random() * 6;
  brain._glide = { mode: 'paint' };
  GLIDE_STATS.botPaint++;
  return true;
}
const _rs = { own: 0, enemy: 0, empty: 0, n: 0 };
// the bot's hold (the Shaker's botHold pattern: the press is one frame, the hold is ours): in a fight it holds until the
// cook stops the stone on its foe — their spot led by their velocity × the fuse left (≤ 2 s), from where the bot stands
// now (re-solved every frame: it may be strafing), never past full cook (a bot never reaches the slip); painting: a tap
function botHold(a, st, inp, s) {
  const b = a.bot;
  if (!st.plan) { const g = b._glide; b._glide = null; st.plan = { mode: g?.mode || 'paint', t: g?.t || null }; }
  const P = st.plan;
  let keep = false;
  if (P.mode === 'fight') {
    const t = P.t && P.t.alive ? P.t : b.target;
    if (t && t.alive && t.pos) {
      P.t = t;
      startOf(a, _gp);
      let f = fuseFor(Math.hypot(t.pos.x - _gp.x, t.pos.z - _gp.z), s), ax = t.pos.x, az = t.pos.z;
      for (let i = 0; i < 2; i++) { const lead = Math.min(2, f); ax = t.pos.x + t.vel.x * lead; az = t.pos.z + t.vel.z * lead; f = fuseFor(Math.hypot(ax - _gp.x, az - _gp.z), s); }
      st.aimAt = st.aimAt || { x: 0, z: 0 }; st.aimAt.x = ax; st.aimAt.z = az;
      const need = clamp(s.fuse - f, 0, s.cookMax);
      keep = st.cook < need - 1e-6 && st.held < s.cookGrace + s.cookMax;
    }
  }
  keep = keep && a.alive && a.form === 'kid';
  if (keep) { inp.sub = true; inp.subReleased = false; }
  else if (!inp.sub) inp.subReleased = true;   // (the brain let go frames ago: throw now)
}
// at the release: a fighting bot turns to its foe's led spot
function botAimAt(a) {
  const st = a.weaponRunner?.glide, P = st?.plan;
  if (!P || P.mode !== 'fight' || !st.aimAt || !P.t?.alive) return;
  a.aimYaw = Math.atan2(st.aimAt.x - a.pos.x, st.aimAt.z - a.pos.z);
}

// ================================================================================================= registration
SUB_KITS[KIND] = {
  noArc: true,                                     // (it draws its own guide: the slide's path and its blast ring)
  use,
  hold,
  lockMain,
  ghost,
  netHurt: netHurtOwn,
  prompt,
  items,
  sounds: GLIDE_SOUNDS,
  // the cook level this screen shows in a player's hand (0 … 3: its own cook, or a remote player's last [5] record)
  levelShown(a) { const st = a?.weaponRunner?.glide; if (st) return levelOf(st.cook, a.sub?.kind === KIND ? a.sub : S()); return netCook.get(a)?.level || 0; },
  // exposed for tests / tools: the numbers and the step function
  math: { cookOf, radiusOf, paintOf, devDmgOf, fuseOf, levelOf, reachOf, fuseFor, simulate, slideStep, dangerOf, guide, bar },
  threats(out) { for (const it of items) if (it.state !== 'dead') out.push(threatOf(it)); return out; },
  devices(out) { for (const it of items) if (it.state !== 'dead') out.push(devOf(it)); return out; },
  tick(dt) {
    trackDyn(dt);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      ghostMute(it, () => tickOne(it, dt));
      if (it.state === 'dead') { dispose(it); items.splice(i, 1); }
    }
    handsTick(dt);
    aids();
  },
  clear() {
    for (const it of items) dispose(it);
    items.length = 0;
    for (const a of G.actors || []) if (a.weaponRunner?.glide) endHold(a, false);
    for (const nc of netCook.values()) stopSizzle(nc);
    netCook.clear();
    for (const g of _glows.values()) g.parent?.remove(g);
    _glows.clear();
    guide.show(false); bar.update(null);
    _dyn.clear();
  },
  // enemy shots and beams pop it (it absorbs the shot): the capsule hitR × hitH round its middle
  blockShot(prev, pos, team, dmg, by) {
    for (const it of items) {
      if (it.team === team || it.state === 'dead') continue;
      Physics.segmentCapsuleDist(prev, pos, capFoot(it, _a), it.sub.hitR, it.sub.hitH, _res);
      if (_res.dist < it.sub.hitR) { hurt(it, dmg, by); return true; }
    }
    return false;
  },
  blockRay(from, dir, len, team, dmg, by) {
    let best = len, hitIt = null;
    for (const it of items) {
      if (it.team === team || it.state === 'dead') continue;
      _a.set(it.p.x, it.p.y + MID, it.p.z);
      const t = _b.copy(_a).sub(from).dot(dir);
      if (t <= 0 || t >= best) continue;
      _c.copy(from).addScaledVector(dir, t);
      if (_c.distanceTo(_a) < it.sub.hitR + 0.02) { best = t; hitIt = it; }
    }
    if (hitIt) hurt(hitIt, dmg, by);
    return best;
  },
  // an enemy blast (a device's damage: the blast's own dmg) — it pops, never goes off
  damageArea(c, radius, dmg, team, by) {
    for (const it of items) {
      if (it.team === team || it.state === 'dead') continue;
      if (_a.set(it.p.x, it.p.y + MID, it.p.z).distanceTo(c) < radius + 0.3) hurt(it, dmg, by);
    }
  },
  // the Mega Stamp's swing guard (specials.js guardSweep): an enemy stone in front of it is smashed before it goes off
  smash(c, r, team, front) {
    for (const it of items) {
      if (it.team === team || it.state === 'dead' || it.p.distanceTo(c) > r + 0.3 || !front(it.p)) continue;
      if (it.ghost) netHurt(it.owner, 'glideSmash', it.gid, 1);   // (its owner's copy ends; we show it at once)
      pop(it, 2);
    }
  },
  // a player who left (netmatch.js onLeave / _remove): their stones and cook go with them, quietly, on every screen
  dropOwner(actor) {
    for (const it of items) if (it.owner === actor && it.state !== 'dead') quietEnd(it, 'left');
    if (actor.weaponRunner?.glide) endHold(actor, false);
    const nc = netCook.get(actor); if (nc) { stopSizzle(nc); netCook.delete(actor); handLook(actor, 0, 0, false); }
  },
  bot: { fight, paint },
};
