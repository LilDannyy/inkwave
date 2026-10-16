// [b5-karp] The Carp Shot (Bazookarp SPEC §2.5): the Bazookarp's own weapon, the only thing a carrier's trigger does.
//   • charge: c = clamp((held − tapMin) / (chargeTime − tapMin)); a release before tapMin fires a c = 0 shot at tapMin (a
//     tap is never lost); cooldown 0.25 s after a shot. Kid form only: going squid drops a charge without a shot.
//   • launch: from the carp's mouth (muzzleUp over the feet, muzzleFwd ahead along the aim), lobbed `lob`° above the aim,
//     speed 12.7 + 9.7c (22.4 at full), gravity 22: level aim comes back down to the floor 7.8 / 13.2 / 20.1 m out.
//   • flight (the shooter's screen): it lands on the level, an enemy player, an enemy device, a shield or a moving block;
//     there it splats its landing ink (0.9 → 1.5 m), swells 0.45 s, then blows (1.8 + 1.6c m; a full charge 4.0 m: 180
//     within 2.4 m, then down to 55 at the edge; below full the centre does 40 + 50c down to 25).
//   • the blast is judged on each VICTIM's screen (§2.5, §7.5): each screen applies it to its own players at [2], not
//     through applyHit (which drops a remote attacker's hits online) — the Surf N' Turf ring's path: the Drainbow cut,
//     victim.damage(dmg, shooter, 'karp') with the paint mute lifted, the 'hit' event, and online the victim's owner
//     records [3, gid, dmg] so the shooter gets its hit marker. Enemy devices are hit on the shooter's screen.
//   • knockback: every shot kicks the carrier backwards along the aim's horizontal (2.5 + 3.5c m/s, decaying τ 0.3 s,
//     × 0.6 in the air); actor.js adds it after the movement model (enemy ink's cap never cancels it).
//   • records (the owner's kit records, KIT_GHOSTS.karp): [0, gid, x, y, z, vx, vy, vz, c] launch · [1, gid, x, y, z]
//     landed · [2, gid, x, y, z, c] the blast · [3, gid, dmg] a victim's owner: this player took dmg from shot gid.
// G.karpGun.shots: every live shot (real and ghost) — bots read their dangers from it (§8.6). [karp-face] Its sounds:
// src/audio/sfx-karp.js (karp:shot / karp:land / karp:blast / karp:full); its looks: src/fx/bazookarpFx.js.
import * as THREE from 'three';
import { G, emit, clamp, lerp } from '../core/ctx.js';
import { BAZOOKARP, PLAYER } from '../config.js';
import { Physics, Hit } from './physics.js';
import { KIT_GHOSTS, netRec, netId } from './kits/registry.js';
import './karpModel.js';   // [karp-face] the held carp ('sp_karp')

const GN = BAZOOKARP.gun;
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _hit = new Hit(), _res = { t: 0, dist: 0 };
const _DOWN = new THREE.Vector3(0, -1, 0);   // (a raycast's direction: never a scratch vector a caller may hold)
const DEG = Math.PI / 180;

export const speedOf = (c) => (c >= 1 ? GN.speed[1] : GN.speed[0] + (GN.speed[1] - GN.speed[0]) * c);
export const radiusOf = (c) => (c >= 1 ? GN.fullRadius : GN.radius[0] + (GN.radius[1] - GN.radius[0]) * c);
export const landPaintOf = (c) => lerp(GN.landPaint[0], GN.landPaint[1], clamp(c, 0, 1));
export const kickOf = (c) => lerp(GN.kick[0], GN.kick[1], clamp(c, 0, 1));
// the blast's damage at distance d from its centre
export function blastDamage(c, d) {
  if (c >= 1) {
    if (d <= GN.fullKillR) return GN.fullDmg;
    if (d > GN.fullRadius) return 0;
    return lerp(GN.fullDmg, GN.fullEdge, (d - GN.fullKillR) / (GN.fullRadius - GN.fullKillR));
  }
  const R = radiusOf(c);
  if (d > R) return 0;
  return lerp(GN.dmg[0] + (GN.dmg[1] - GN.dmg[0]) * c, GN.edge, d / R);
}
// the muzzle and the launch velocity for an aim (yaw, pitch) and charge c → { from, vel }
export function launch(a, c, out = { from: new THREE.Vector3(), vel: new THREE.Vector3() }) {
  const fy = a.aimYaw, fx = Math.sin(fy), fz = Math.cos(fy);
  out.from.set(a.pos.x + fx * GN.muzzleFwd, a.pos.y + GN.muzzleUp, a.pos.z + fz * GN.muzzleFwd);
  const p = clamp(a.aimPitch, -1.2, 1.2) + GN.lob * DEG, s = speedOf(c);
  out.vel.set(fx * Math.cos(p) * s, Math.sin(p) * s, fz * Math.cos(p) * s);
  return out;
}

class Shot {
  constructor(owner, gid, from, vel, c, ghost) {
    this.owner = owner; this.team = owner.team; this.gid = gid; this.c = c; this.ghost = !!ghost;
    this.pos = from.clone(); this.prev = from.clone(); this.vel = vel.clone(); this.start = from.clone();
    this.phase = 'fly';   // 'fly' | 'swell' | 'done'
    this.t = 0; this.swell = 0; this.land = null; this.radius = radiusOf(c); this.doneT = 0;
    this.mesh = null;
  }
}

export class KarpGun {
  constructor() {
    this.shots = [];
    this.byGid = new Map();      // gid → shot (kept 2 s after its blast so a victim's [3] finds its owner)
    this.stats = { fired: [0, 0, 0], landed: 0, blasts: 0, hits: 0, splats: 0, kicks: 0 };
  }
  clear() { for (const s of this.shots) this._dropMesh(s); this.shots.length = 0; this.byGid.clear(); }

  // ---- the carrier's trigger (actor.js's weapon block while carrying): true = the trigger is ours
  update(a, dt, winp) {
    const C = a.carry;
    if (!C) return false;
    const g = C.gun || (C.gun = { held: 0, charging: false, cd: 0, c: 0, tap: false, dinged: false });
    g.cd = Math.max(0, g.cd - dt);
    const kid = a.form !== 'squid';
    if (!kid) { if (g.charging) { g.charging = false; g.held = 0; g.c = 0; g.tap = false; } return true; }
    if (g.tap) {   // a tap released early: fires at tapMin
      g.held += dt;
      if (g.held >= GN.tapMin) { g.tap = false; this._fire(a, 0); g.charging = false; g.held = 0; g.c = 0; g.cd = GN.cooldown; }
      return true;
    }
    if (winp.fire && g.cd <= 0) {
      if (!g.charging) { g.charging = true; g.held = 0; g.dinged = false; }
      g.held += dt;
      g.c = clamp((g.held - GN.tapMin) / (GN.chargeTime - GN.tapMin), 0, 1);
      if (g.c >= 1 && !g.dinged) { g.dinged = true; emit('karp:full', { actor: a }); }   // [karp-face] (its ding: sfx-karp.js)
    } else if (g.charging) {
      if (g.held < GN.tapMin) { g.tap = true; return true; }
      this._fire(a, g.c);
      g.charging = false; g.held = 0; g.c = 0; g.cd = GN.cooldown;
    }
    a.weaponRunner.charge = g.charging ? Math.max(0.02, g.c) : 0;   // [karp-face] (rides the tick: the mouth's glow on every screen)
    return true;
  }
  charging(a) { return !!(a.carry?.gun?.charging || a.carry?.gun?.tap); }

  _fire(a, c) {
    const L = launch(a, c, this._L || (this._L = { from: new THREE.Vector3(), vel: new THREE.Vector3() }));
    const gid = netId(a) || ((this._seq = (this._seq || 0) + 1) % 1e6) + 1;
    const s = this._spawn(a, gid, L.from, L.vel, c, false);
    this.stats.fired[c >= 1 ? 2 : c >= 0.5 ? 1 : 0]++;
    a.lastFire = 0;
    a.character?.trigger?.('shoot');
    // the kick: backwards along the aim's horizontal
    const C = a.carry;
    if (C) {
      const k = kickOf(c) * (a.grounded ? 1 : GN.kickAir), fx = Math.sin(a.aimYaw), fz = Math.cos(a.aimYaw);
      C.kick = C.kick || new THREE.Vector3();
      C.kick.x -= fx * k; C.kick.z -= fz * k;
      this.stats.kicks++;
    }
    netRec(a, 'karp', [0, gid, r2(L.from.x), r2(L.from.y), r2(L.from.z), r2(L.vel.x), r2(L.vel.y), r2(L.vel.z), r2(c)]);
    emit('karp:shot', { actor: a, charge: c, from: s.start.clone(), vel: s.vel.clone() });
    return s;
  }
  _spawn(owner, gid, from, vel, c, ghost) {
    const s = new Shot(owner, gid, from, vel, c, ghost);
    this.shots.push(s); this.byGid.set(gid, s);
    G.karpFx?.shotMesh?.(s);
    return s;
  }
  _dropMesh(s) { G.karpFx?.dropShot?.(s); }

  // ---- per frame (main.js, with the projectiles)
  tick(dt) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.t += dt;
      if (s.phase === 'fly') this._fly(s, dt);
      else if (s.phase === 'swell') {
        s.swell += dt;
        if (s.swell >= GN.swell && !s.ghost) this._blow(s);
        else if (s.ghost && s.swell > GN.swell + 1.5) { s.phase = 'done'; }   // (a ghost whose [2] never came)
      } else if (s.phase === 'done') {
        s.doneT += dt;
        if (s.doneT > 2) { this._dropMesh(s); this.byGid.delete(s.gid); this.shots.splice(i, 1); }
      }
    }
  }
  _fly(s, dt) {
    s.prev.copy(s.pos);
    s.vel.y -= GN.gravity * dt;
    s.pos.addScaledVector(s.vel, dt);
    if (s.ghost) {   // a ghost flies until its owner says where it landed ([1])
      if (s.t > 4) s.phase = 'done';
      return;
    }
    // an enemy player (as the shooter sees them)
    for (const e of G.actors) {
      if (e.team === s.team || !e.alive) continue;
      const h = e.form === 'squid' ? PLAYER.squidHeight : PLAYER.height;
      if (Math.abs(e.pos.x - s.pos.x) > 4 || Math.abs(e.pos.z - s.pos.z) > 4) continue;
      _v.set(e.pos.x, e.pos.y + (e.smoothY || 0), e.pos.z);
      Physics.segmentCapsuleDist(s.prev, s.pos, _v, PLAYER.radius, h, _res);
      if (_res.dist < PLAYER.radius + 0.22) { this._land(s, _v2.copy(s.prev).lerp(s.pos, _res.t)); return; }
    }
    // enemy devices, shields (a Brolly canopy, a Drip Curtain …), special objects
    if (G.subs?.blockShot(s.prev, s.pos, s.team, 0, s.owner) || G.specials?.shotHit(s.prev, s.pos, s.team, 0, s.owner)) { this._land(s, s.pos); return; }
    // the level (moving blocks included)
    const hit = G.physics.segment(s.prev, s.pos, _hit, true);
    if (hit.hit) { this._land(s, _v2.copy(hit.point).addScaledVector(hit.normal, 0.05)); return; }
    if (s.pos.y < PLAYER.waterY - 1.5 || G.match?.stage?.sink(s.pos, 'shot') || s.t > 6) { s.phase = 'done'; netRec(s.owner, 'karp', [1, s.gid, 0, -99, 0]); }
  }
  _land(s, at, fromNet = false) {
    // (copy the point FIRST: callers pass the shared scratch vectors _v / _v2, which the raycast below reuses — the
    // landing record once went out as (0, −1, 0), the ray's direction)
    const L = (s.land = at.clone());
    s.pos.copy(L); s.vel.set(0, 0, 0);
    s.phase = 'swell'; s.swell = 0;
    this.stats.landed++;
    if (!s.ghost && !fromNet) {
      // its landing ink (the shooter's: replicated as its paint)
      const g = G.physics.raycast(_v.copy(L).setY(L.y + 0.3), _DOWN, 2.5, _hit, true);
      if (g.hit) s.owner.addTurf?.(G.paint.splat(_v.copy(g.point).addScaledVector(g.normal, 0.1), landPaintOf(s.c), s.team, { seed: Math.random() }));
      netRec(s.owner, 'karp', [1, s.gid, r2(L.x), r2(L.y), r2(L.z)]);
    }
    emit('karp:land', { actor: s.owner, pos: L.clone(), charge: s.c, ghost: s.ghost });
  }
  // the shooter's screen: the blast. Its own players are judged here; the record [2] has every other screen judge theirs
  _blow(s) {
    const c = _v.copy(s.land).setY(s.land.y + 0.35), R = radiusOf(s.c);
    s.phase = 'done';
    this.stats.blasts++;
    // its ink
    const g = G.physics.raycast(_v2.copy(c).setY(c.y + 0.2), _DOWN, 3, _hit, true);
    if (g.hit) s.owner.addTurf?.(G.paint.splat(_v2.copy(g.point).addScaledVector(g.normal, 0.1), R * GN.paintK, s.team, { seed: Math.random() }));
    // enemy devices and special objects (the shooter's screen, as every blast)
    if (G.subs) G.subs.damageArea(c, R, blastDamage(s.c, R * 0.5), s.team, s.owner); else G.specials?.areaHit?.(c, R, blastDamage(s.c, R * 0.5), s.team, s.owner);
    netRec(s.owner, 'karp', [2, s.gid, r2(s.land.x), r2(s.land.y), r2(s.land.z), r2(s.c)]);
    this._judge(s, c, R);
    G.fx?.explosion?.(c.clone(), s.owner.color, R);
    emit('karp:blast', { actor: s.owner, pos: c.clone(), radius: R, charge: s.c });
  }
  // a blast on THIS screen's own players of the other team (offline: everyone; the host: its player and bots; a guest:
  // its player) — never through applyHit
  _judge(s, c, R) {
    const nm = G.netm;
    for (const e of G.actors) {
      if (e.team === s.team || !e.alive || e.remote) continue;
      _v2.set(e.pos.x, e.pos.y + (e.form === 'squid' ? 0.35 : 0.8), e.pos.z);
      const d = _v2.distanceTo(c);
      if (d > R + 0.3) continue;
      if (!G.physics.los(c, _v2)) continue;
      let dmg = blastDamage(s.c, Math.max(0, d - 0.3));
      if (!(dmg > 0)) continue;
      if (G.drainbow?.live) dmg = G.drainbow.cut(s.owner, e, dmg, null, c);
      const mute = nm ? nm.mute : 0;
      if (nm) nm.mute = 0;
      let killed = false;
      try { killed = e.damage(dmg, s.owner, 'karp'); } finally { if (nm) nm.mute = mute; }
      this.stats.hits++; if (killed) this.stats.splats++;
      emit('hit', { attacker: s.owner, victim: e, damage: dmg, killed, weaponId: 'karp' });
      if (nm && s.gid) netRec(e, 'karp', [3, s.gid, r2(dmg)]);
    }
  }

  // [karp-face] this screen adopts actor a (netmatch _adopt: its player left, or the host did): its shots still in the
  // air or swelling here become ours — they fly on with collisions, land, swell and blow, and record [1] / [2]
  adopt(a) { for (const s of this.shots) if (s.owner === a && s.ghost && s.phase !== 'done') { s.ghost = false; if (s.phase === 'swell' && !s.land) s.phase = 'fly'; } }
  // ---- online: another screen's records (KIT_GHOSTS.karp)
  ghost(a, d) {
    switch (d[0]) {
      // ([karp-face] a departed host's queued launch for a bot this screen has just adopted: the shot is ours to fly, land
      // and blow — its [1] / [2] will never come from its old owner — SPEC §7.6)
      case 0: { if (this.byGid.has(d[1])) break; const own = !a.remote; const s = this._spawn(a, d[1], _v.set(d[2], d[3], d[4]), _v2.set(d[5], d[6], d[7]), d[8], !own); s.ghost = !own;
        emit('karp:shot', { actor: a, charge: d[8], from: s.start.clone(), vel: s.vel.clone(), ghost: true }); break; }   // ([karp-face] a remote carrier's shot is heard and seen leaving the mouth here too)
      case 1: {
        const s = this.byGid.get(d[1]);
        if (!s) break;
        if (d[3] < -50) { s.phase = 'done'; break; }
        this._land(s, _v.set(d[2], d[3], d[4]), true);
        break;
      }
      case 2: {
        let s = this.byGid.get(d[1]);
        if (s && !s.ghost && s.phase === 'done') break;   // ([karp-face] an adopted shot that already blew here)
        if (!s) s = this._spawn(a, d[1], _v.set(d[2], d[3], d[4]), _v2.set(0, 0, 0), d[5], true);
        if (!s.land) this._land(s, _v.set(d[2], d[3], d[4]), true);
        s.phase = 'done'; s.c = d[5];
        const c = _v.set(d[2], d[3] + 0.35, d[4]), R = radiusOf(d[5]);
        this._judge(s, c, R);
        G.fx?.explosion?.(c.clone(), a.color, R);
        emit('karp:blast', { actor: a, pos: c.clone(), radius: R, charge: d[5], ghost: true });
        break;
      }
      case 3: {   // a's owner: a took d[2] from shot d[1] — the shooter (on its screen) gets its hit marker
        const s = this.byGid.get(d[1]);
        if (s) emit('hit', { attacker: s.owner, victim: a, damage: d[2], killed: false, weaponId: 'karp', remoteVictim: true });
        break;
      }
    }
  }
}

const r2 = (x) => Math.round(x * 100) / 100;
export const KARP_GUN = new KarpGun();
G.karpGun = KARP_GUN;
KIT_GHOSTS.karp = { ghost: (a, d) => KARP_GUN.ghost(a, d) };
