// [b5-deploy] Deployables can be shot; the tower crushes the devices in its way (batch 5, 2026-10-04). The user:
// "Deployables can be shot. These include beacons, and sprinklers, surf n turf and skitter bombs." and "If a sprinkler,
// beacon, curtain, beacon or surf n turf is in the path of the tower, the tower instantly destroys it."
//
// THE DEVICES (hp: config SUBS / SPECIALS.surf)
//   Twirl Sprinkler 100 · Hop Beacon 120 (Splatoon's Sprinkler / Squid Beakon: a few shots, not one, not a magazine) ·
//   Surf N' Turf's buoy 350 (sp-surf.js) · Skitter Bomb 40 — on the ground (running or winding up); shot down it pops
//   harmlessly: no blast, no damage, a puff, its windup cancelled. The Drip Curtain keeps its own rule (it soaks enemy
//   shots and fades: subs.js) and is one of the things the tower crushes. Hit shapes are the built size, never the drawn
//   one ([sub-view]: subs.js hitH — tools/botlab/tests/sub-scale.js holds gameplay identical at any view scale).
//
// ONE RULE FOR EVERY KIND OF ENEMY FIRE (your own team's never touches them)
//   shots — any projectile: shooters, the blaster's / bucket's blobs, the roller's / brush's flung ink, bow arrows,
//     mitts' fists, the Cutlass's wave, the Tracer, sprinkler drops, the Crab Rig's gatling, the Ink Jet …:
//     subs.blockShot (sprinkler, beacon, now the Skitter Bomb) / specials.shotHit (the buoy);
//   beams — the charger: subs.blockRay (now the sprinkler, beacon and Skitter Bomb too: rayCapsule) / specials.rayHit;
//   blasts — bombs, every sub's and special's blast, the blaster's / bucket's / mitts' splash, the bow's burst, the
//     Cutlass's cut, the Tidal Slam: subs.damageArea (the buoy through specials.areaHit; the splashes now reach the subs'
//     devices too);
//   rolling — the roller's drum, the brush's bristles (sweep): in front of it, its roll damage, once per 0.5 s (the
//     brush: its own hit cooldown);
//   standing fire — the Ink Tempest's rain, the Vortex Strike's vortex, the Howl Box's beam (per second), Surf N'
//     Turf's rings (a ring's damage, once a ring): tick().
// A hit: the device flashes white and squashes, a "tok" (device_hit), the shooter's hit marker ('device:hit'); at 0 it
// pops — a burst of its ink, its own break sound + device_pop (a Skitter Bomb: seeker_pop and a puff) — 'device:down'.
//
// THE TOWER (Tower Command): every frame it moves, its body — the platform and the pillar, their colliders — destroys a
// sprinkler, beacon, Drip Curtain or buoy it overlaps (crush): a crunch (device_crunch, a burst, a little shake),
// 'device:down' { how: 'crush' }. Anything on its deck rides it and is never crushed (a buoy on its deck did already;
// every placed / stuck device rides any moving floor now: MOVING FLOORS below). The buoy is no longer shoved by the
// tower (sp-surf.js _pushed): the tower crushes it.
//
// ONLINE (docs/NET.md): the device's owner decides what happens to it. A hit made on another screen goes to the owner
// (netHurt, as before). Standing fire and the tower are judged on the owner's screen against its own copies of the
// cloud / vortex / beam / rings / tower (as tickDamage judges players on their owner's). The end record says why it went:
// subs [2, gid, 1] shot down (a ghost Skitter pops: no blast), [2, gid, 2] crushed; the buoy [4, gid, 2] crushed. The
// flash shows wherever the hit is seen (a ghost shot flashes a device, never hurts it).
//
// BOTS: with no foe in sight they shoot enemy beacons, sprinklers and buoys in range and sight (deployables-bots.js);
// a Skitter Bomb hunting them is a threat to shoot down (threats → bots.js _threatScan).
import * as THREE from 'three';
import { G, emit, on, clamp } from '../core/ctx.js';
import { SPECIALS, TOWER } from '../config.js';
import { netRec, netMuted } from './kits/registry.js';
import { BUOY } from '../fx/surfFx.js';
import { Hit } from './physics.js';
import '../audio/sfx-deploy.js';

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _h = new Hit();
const yawOf = (b) => Math.atan2(-b.axes[0].z, b.axes[0].x);   // a moving block's heading (Level.moveDynamic: x → (cos, 0, −sin))
const near = (p, r = 40) => !!G.camera && G.camera.position.distanceToSquared(p) < r * r;
// a subs item's state → the device it is while it can be shot (the curtain has its own rule: subs.js)
const SHOOT = { spray: 'sprinkler', beacon: 'beacon', run: 'seeker', prime: 'seeker' };
export const DEV_R = { sprinkler: 0.3, beacon: 0.3, seeker: 0.25 };   // m: the hit capsule's radius (subs.js blockShot's 0.3 + 0.04)
export const ROLL_CD = 0.5;                                          // s between one roller's drum hits on one device

// counters (tests / match.cjs / tower-match.cjs)
export const DEPLOY_STATS = { hits: 0, dmg: 0, markers: 0, sweeps: 0, standing: 0, rings: 0, down: {}, crushed: {}, rides: 0, drops: 0, seekerPops: 0 };
export function resetDeployStats() { for (const k in DEPLOY_STATS) DEPLOY_STATS[k] = typeof DEPLOY_STATS[k] === 'object' ? {} : 0; }
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

// the closest approach of the segment from → from + dir·len to the vertical segment base … base + h: { t (along the
// first), d (between them) }
const _rc = { t: 0, d: Infinity };
export function rayCapsule(from, dir, len, base, h) {
  // P(s) = from + dir s, s ∈ [0, len]; Q(u) = base + up u, u ∈ [0, h]
  const wx = from.x - base.x, wy = from.y - base.y, wz = from.z - base.z;
  const a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z, b = dir.y, d = wx * dir.x + wy * dir.y + wz * dir.z, e = wy;
  const den = a - b * b;
  let s = den > 1e-9 ? (b * e - d) / den : 0;
  s = clamp(s, 0, len);
  let u = clamp(wy + b * s, 0, h);
  s = clamp((u * b - d) / Math.max(1e-9, a), 0, len);
  u = clamp(wy + b * s, 0, h);
  const px = wx + dir.x * s, py = wy + dir.y * s - u, pz = wz + dir.z * s;
  _rc.t = s; _rc.d = Math.sqrt(px * px + py * py + pz * pz);
  return _rc;
}

// a subs device's hit capsule: its middle (pos + normal × half its height, the built size), and a vertical capsule
// round that — the same shape blockShot has always used for sprinklers and beacons. devBody: the capsule's foot (→ out;
// returns its height)
export function devMid(it, out) { return out.copy(it.pos).addScaledVector(it.normal || UP, it.mesh.userData.hitH * 0.5); }
export function devBody(it, out) {
  const h = it.mesh.userData.hitH;
  devMid(it, out).y -= h * 0.5;
  return h;
}
export const devKind = (it) => SHOOT[it.state] || null;

class Deployables {
  constructor() {
    this._flash = new Map();   // per team colour: the white hit-flash material
    this._sndT = 0;
    // the shooter's hit marker (a smaller tick than a hit on a player; the same sound, quieter)
    on('device:hit', (e) => {
      const a = e.attacker, m = G.match, hud = G.hud;
      if (!a || !a.isLocal || !m || m.attract || G.mode !== 'match' || !hud?.hitMarker) return;
      hud._lastHitDmg = Math.min(30, e.damage || 0);
      hud.hitMarker('hit');
      DEPLOY_STATS.markers++;
      if (G.time - this._sndT > 0.06) { this._sndT = G.time; G.audio?.play('hit_marker', { volume: 0.4, pitch: 1.15 }); }
    });
  }

  // ---------------------------------------------------------------------------------------------- hits
  // enemy fire struck device `dev` (a subs item, or the buoy: kind 'surf') for dmg, fired by `by` (when known): the look
  // on this screen, the event the shooter's hit marker hangs on (never for a ghost's shot: muted — that one's owner
  // sees its own)
  struck(dev, dmg, by) {
    const kind = dev.kind === 'surf' ? 'surf' : devKind(dev);
    if (!kind) return;
    if (kind !== 'surf') {
      dev.flash = 1;
      if (near(dev.pos, 30) && G.time - (dev._tokT ?? -9) > 0.09) { dev._tokT = G.time; G.cues?.one('device_hit', { at: _v.copy(dev.pos).addScaledVector(dev.normal || UP, 0.3), owner: dev.owner, team: dev.team, kind: 'end', vol: 0.8 }); }
    }
    if (netMuted() || !(dmg > 0)) return;
    DEPLOY_STATS.hits++; DEPLOY_STATS.dmg += dmg;
    emit('device:hit', { attacker: by || null, kind, team: dev.team, damage: dmg, obj: dev, pos: dev.pos.clone() });
  }
  // a subs device shot down at 0 hp (subs.js _hurt, its owner's copy): a Skitter Bomb pops harmlessly, the others
  // break with the pop look. The end record carries why (subs.js update: [2, gid, 1])
  down(it, by) {
    if (it.state === 'dead') return;
    const kind = devKind(it) || it.kind;
    it.endWhy = 1;
    this.endLook(it, 1);
    bump(DEPLOY_STATS.down, kind);
    emit('device:down', { kind, team: it.team, pos: it.pos.clone(), by: by || null, how: 'shot' });
  }
  // the look of a subs device going (why 1: shot down, 2: crushed — the owner's own, or a ghost on the owner's word)
  endLook(it, why) {
    if (it.state === 'dead') return;
    const n = it.normal || UP, c = _c.copy(it.pos).addScaledVector(n, 0.25), col = G.teamColors[it.team];
    if (why === 2) this._crunch(c, it.team, it.owner);
    if (it.kind === 'seeker' && why !== 2) {
      // popped: a puff and a fizzle, no blast
      if (near(c, 40)) {
        G.fx?.burst(c, UP, col, { count: 10, speed: 2.6, size: 0.07, mist: true });
        G.fx?.ring?.(_v.copy(it.pos).setY(it.pos.y + 0.03), UP, col, { radius: 0.7, life: 0.3 });
        G.cues?.one('seeker_pop', { at: c, owner: it.owner, team: it.team, kind: 'end' });
      }
      DEPLOY_STATS.seekerPops++;
      emit('sub:destroyed', { kind: 'seeker', pos: c.clone(), team: it.team });
      it.state = 'dead';
      return;
    }
    if (why === 1 && near(c, 40)) {
      G.fx?.explosion(c, col, 0.8);
      G.cues?.one('device_pop', { at: c, owner: it.owner, team: it.team, kind: 'end' });
    }
    G.subs._destroy(it);   // (its burst, its own break sound, 'sub:destroyed')
  }

  // ---------------------------------------------------------------------------------------------- moving floors
  // The user (2026-10-04): "lurk mines don't stick to moving floors such as the tower". One rule for every placed or
  // stuck device (a Lurk Mine, a Hop Beacon, a Twirl Sprinkler, a Drip Curtain, a Cling Charge) on every moving level
  // block (Level.addDynamic / moveDynamic: the tower's deck and pillar, Calamari's railcars, the pods' plants, any mover)
  // — the rule the Surf N' Turf buoy follows (sp-surf.js _attach / _support): it keeps its spot on the block, in the
  // block's own axes, on the face it was set on (a top that rises or sinks, a wall that grows: it stays on that face), and
  // turns with the block; a mine trips (and blows) wherever the block has taken it. When its block goes from under it
  // (parked, gone, its face drawn in, a jump of more than 3 m) a device on a floor drops onto whatever is below (and
  // rides that, if it moves too), one stuck to a wall or a ceiling breaks. No records while it rides (every screen moves
  // its copy on its own copy of the block: the movers / pods run on the synced clock, the tower follows the host); the
  // owner's word [4, gid, x, y, z, tag, lx, ly, lz, nx, ny, nz] says where on which block it sits whenever it settles
  // on one (or [4, gid, x, y, z]: on still ground again), so a ghost that landed a little differently snaps to it.
  // it (a subs item) was set down / stuck on block bid: on a moving one it rides it (true)
  attach(it, bid) {
    if (it.pendOn) { const p = it.pendOn; it.pendOn = null; this.netOn(it, p); return !!it.on; }   // (a ghost: its owner's word came first)
    const b = bid != null && bid >= 0 ? G.level.blocks[bid] : null;
    it.on = null; it.ride = null;
    if (!b || !b.dynamic || b.solid === false) return false;
    const A = b.axes, d = _v.copy(it.pos).sub(b.center), n = it.normal || UP;
    const l = [d.dot(A[0]), d.dot(A[1]), d.dot(A[2])], nl = [n.dot(A[0]), n.dot(A[1]), n.dot(A[2])];
    let k = 1; for (let j = 0; j < 3; j++) if (Math.abs(nl[j]) > Math.abs(nl[k])) k = j;
    const s = Math.sign(nl[k]) || 1, h = [b.half.x, b.half.y, b.half.z];
    it.on = { b, l, nl, k, s, gap: l[k] - s * h[k], yaw: yawOf(b), q0: it.mesh.quaternion.clone(), n0: it.n ? it.n.clone() : null };
    it.ride = b;   // (truthy while it rides: tests read it)
    if (!it.ghost) it.onRec = true;   // (the owner's word, next frame: after the record that made it)
    DEPLOY_STATS.rides++;
    return true;
  }
  // per frame (subs.js _step, first): keep it at its spot of the block it rides
  carry(it) {
    const o = it.on;
    if (!o) return;
    const b = o.b, l = o.l, h = [b.half.x, b.half.y, b.half.z];
    if (b.solid === false || !G.level.dyn.includes(b)) return this._lost(it);
    l[o.k] = o.s * h[o.k] + o.gap;
    for (let j = 0; j < 3; j++) if (j !== o.k && Math.abs(l[j]) > h[j] + 0.05) return this._lost(it);   // (its face drew in)
    const A = b.axes, c = b.center;
    const x = c.x + A[0].x * l[0] + A[1].x * l[1] + A[2].x * l[2], y = c.y + A[0].y * l[0] + A[1].y * l[1] + A[2].y * l[2], z = c.z + A[0].z * l[0] + A[1].z * l[1] + A[2].z * l[2];
    const dx = x - it.pos.x, dy = y - it.pos.y, dz = z - it.pos.z;
    if (dx * dx + dy * dy + dz * dz > 9) return this._lost(it);   // (it jumped away: parked)
    it.pos.set(x, y, z);
    it.mesh.position.copy(it.pos);
    const yw = yawOf(b) - o.yaw;
    if (Math.abs(yw - (o.yw || 0)) > 1e-6) {   // the block turned: so does it
      o.yw = yw;
      _q.setFromAxisAngle(UP, yw);
      it.mesh.quaternion.copy(_q).multiply(o.q0);
      if (it.normal) it.normal.set(A[0].x * o.nl[0] + A[1].x * o.nl[1] + A[2].x * o.nl[2], A[0].y * o.nl[0] + A[1].y * o.nl[1] + A[2].y * o.nl[2], A[0].z * o.nl[0] + A[1].z * o.nl[1] + A[2].z * o.nl[2]);
      if (o.n0 && it.n) { it.n.copy(o.n0).applyQuaternion(_q); it.tan.set(-it.n.z, 0, it.n.x); }
    }
    if (it.onRec) this._onRec(it);
  }
  // the owner's word on where it sits (on a moving block: which, and where on it)
  _onRec(it) {
    it.onRec = false;
    if (it.ghost || !it.gid) return;
    const o = it.on, r = (x) => Math.round(x * 100) / 100, p = [r(it.pos.x), r(it.pos.y), r(it.pos.z)];
    netRec(it.owner, 'subs', o ? [4, it.gid, ...p, o.b.tag || '#' + o.b.id, r(o.l[0]), r(o.l[1]), r(o.l[2]), r(o.nl[0]), r(o.nl[1]), r(o.nl[2])] : [4, it.gid, ...p]);
  }
  // a ghost: its owner's word [4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)] (subs.js netGhost). Still in flight
  // here: kept until it lands (attach)
  netOn(it, d) {
    if (it.state === 'fly') { it.pendOn = d; return; }
    it.on = null; it.ride = null;
    it.pos.set(d[2], d[3], d[4]);
    const tag = d[5];
    const b = tag == null ? null : G.level.dyn.find((x) => (x.tag || '#' + x.id) === tag);
    if (b && b.solid !== false) {
      const nl = [d[9], d[10], d[11]];
      let k = 1; for (let j = 0; j < 3; j++) if (Math.abs(nl[j]) > Math.abs(nl[k])) k = j;
      const s = Math.sign(nl[k]) || 1, h = [b.half.x, b.half.y, b.half.z], l = [d[6], d[7], d[8]];
      const A = b.axes, n = _v.set(A[0].x * nl[0] + A[1].x * nl[1] + A[2].x * nl[2], A[0].y * nl[0] + A[1].y * nl[1] + A[2].y * nl[2], A[0].z * nl[0] + A[1].z * nl[1] + A[2].z * nl[2]).normalize();
      if (it.normal && it.normal.dot(n) < 0.9) { it.normal.copy(n); it.mesh.quaternion.setFromUnitVectors(UP, n); }   // (it stuck to another face here)
      it.on = { b, l, nl, k, s, gap: l[k] - s * h[k], yaw: yawOf(b), q0: it.mesh.quaternion.clone(), n0: it.n ? it.n.clone() : null };
      it.ride = b;
      this.carry(it);
    }
    it.mesh.position.copy(it.pos);
  }
  // its block went from under it: on a floor it drops onto whatever is below (riding that, if it moves); on a wall or
  // a ceiling it breaks
  _lost(it) {
    it.on = null; it.ride = null;
    if (it.state === 'dead') return;
    const n = it.normal || UP, floor = it.state === 'mine' || it.state === 'beacon' || it.state === 'curtain' || n.y > 0.6;
    const g = floor ? G.physics.raycast(_v.set(it.pos.x, it.pos.y + 0.3, it.pos.z), DOWN, 40, _h, true) : null;
    if (!g || !g.hit || g.normal.y < 0.6 || g.point.y < -30) { G.subs._destroy(it); return; }
    it.pos.copy(g.point); it.mesh.position.copy(it.pos);
    if (it.normal && it.normal.dot(g.normal) < 0.99) { it.normal.copy(g.normal); if (it.state !== 'curtain') it.mesh.quaternion.setFromUnitVectors(UP, g.normal); }
    DEPLOY_STATS.drops++;
    if (!this.attach(it, g.block) && !it.ghost) it.onRec = true;
    if (it.onRec) this._onRec(it);
  }

  // ---------------------------------------------------------------------------------------------- the tower
  isTowerBlock(b, T = G.match?.tower) { return !!T && !!b && (b === T.block || b === T.pillar); }
  // tower.js update, every frame the tower moved: its body destroys the sprinklers, beacons, curtains and buoys it
  // overlaps — this screen's own (a ghost waits for its owner's word); anything riding it is left alone
  crush(T) {
    if (!T || !T.block) return;
    const B = [T.block, T.pillar].filter(Boolean);
    for (const it of G.subs?.items || []) {
      if (it.ghost || (it.on && this.isTowerBlock(it.on.b, T)) || it.state === 'dead') continue;
      const st = it.state;
      let hit = false;
      if (st === 'spray' || st === 'beacon') { const h = devBody(it, _v); hit = this._bodyIn(B, _v, h, DEV_R[devKind(it)]); }
      else if (st === 'curtain') hit = curtainIn(B, it);
      if (!hit) continue;
      it.endWhy = 2;
      this.endLook(it, 2);
      bump(DEPLOY_STATS.crushed, it.kind);
      emit('device:down', { kind: it.kind, team: it.team, pos: it.pos.clone(), by: null, how: 'crush' });
    }
    for (const w of G.specials?.world || []) {
      if (w.kind !== 'surf' || w.ghost || w.dead || w.phase !== 'live') continue;
      if (w.on && this.isTowerBlock(w.on.b, T)) continue;
      if (!this._bodyIn(B, w.pos, BUOY.hitH, BUOY.hitR * 0.8)) continue;
      this.crushBuoy(w);
    }
  }
  crushBuoy(w) {
    if (w.gid) netRec(w.owner, 'surf', [4, w.gid, 2]);
    this.crushLook(w);
    if (G.surf?.SURF_STATS) G.surf.SURF_STATS.crushed++;
    w.pop();
    bump(DEPLOY_STATS.crushed, 'surf');
    emit('device:down', { kind: 'surf', team: w.team, pos: w.pos.clone(), by: null, how: 'crush' });
  }
  // the crunch on a buoy (the owner's, or a ghost on its owner's word: sp-surf.js KIT_GHOSTS.surf [4, gid, 2])
  crushLook(w) { w.crushed = true; this._crunch(_c.copy(w.pos).setY(w.pos.y + 0.5), w.team, w.owner); }
  // a vertical body (base … base + h, radius r) inside any of the blocks (sampled at its foot, middle and top)
  _bodyIn(B, base, h, r) {
    const L = G.level;
    for (const b of B) for (const k of [0.06, 0.5, 1]) {
      _v2.set(base.x, base.y + Math.min(h, Math.max(0.06, h * k)), base.z);
      if (L.pointInBlock(b, _v2, r)) return true;
    }
    return false;
  }
  _crunch(c, team, owner) {
    const col = G.teamColors[team];
    if (near(c, 50)) {
      G.fx?.burst(c, UP, col, { count: 18, speed: 5, size: 0.09 });
      G.fx?.burst(c, UP, new THREE.Color(0.86, 0.84, 0.8), { count: 8, speed: 3.5, size: 0.06, sheet: false });   // (bits of it)
      G.cues?.one('device_crunch', { at: c.clone(), owner, team, kind: 'end', range: 50 });
    }
    emit('shake', { pos: c.clone(), amount: 0.25 });
  }

  // ---------------------------------------------------------------------------------------------- rolling
  // a roller's drum / a brush's bristles (weapons.js _roller / _brush, its owner's screen): an enemy device in front of
  // it (fwd −0.2 … reach, ±width/2 + 0.35 across, within 1.2 m up or down) takes dmg, once per cd s each (hits: the
  // runner's own map, keyed by the device)
  sweep(a, width, reach, dmg, hits, cd) {
    const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    const test = (obj, p, r, hurt) => {
      if (obj.team === a.team) return;
      const dx = p.x - a.pos.x, dz = p.z - a.pos.z, dy = p.y - a.pos.y;
      const fwd = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx);
      if (fwd < -0.2 || fwd > reach + r || lat > width / 2 + 0.35 + r || dy < -1.2 || dy > 1.2) return;
      if (G.time - (hits.get(obj) ?? -9) <= cd) return;
      hits.set(obj, G.time);
      DEPLOY_STATS.sweeps++;
      hurt();
    };
    for (const it of G.subs?.items || []) { const k = devKind(it); if (k) test(it, it.pos, DEV_R[k], () => G.subs._hurt(it, dmg, a)); }
    for (const w of G.specials?.world || []) if (w.kind === 'surf' && !w.dead && w.phase === 'live') test(w, w.pos, BUOY.hitR, () => w._shot(dmg, a));
  }

  // ---------------------------------------------------------------------------------------------- per frame
  // (subs.js update): the hit flash; standing fire on this screen's own devices
  tick(dt) {
    const items = G.subs?.items || [];
    for (const it of items) if (it.flash > 0 || it._flashOn) this._flashLook(it, dt);
    if (!G.actors) return;
    this._standing(dt);
  }
  _flashLook(it, dt) {
    it.flash = Math.max(0, (it.flash || 0) - dt * 5.5);
    const ud = it.mesh?.userData, model = ud?.inner?.children[0];
    if (!model) return;
    if (ud.mScale === undefined) ud.mScale = model.scale.x;
    const f = it.state === 'dead' ? 0 : it.flash, s = ud.mScale;
    model.scale.set(s * (1 + 0.16 * f), s * (1 - 0.12 * f), s * (1 + 0.16 * f));
    const white = f > 0.45;
    if (white === !!it._flashOn) return;
    it._flashOn = white;
    const parts = [ud.body, ud.ink];
    if (ud.spin) ud.spin.traverse((o) => { if (o.isMesh) parts.push(o); });
    for (const m of parts) {
      if (!m) continue;
      if (white) { m.userData.mat0 = m.material; m.material = this._flashMat(it.team); }
      else if (m.userData.mat0) { m.material = m.userData.mat0; m.userData.mat0 = null; }
    }
  }
  _flashMat(team) {
    const c = G.teamColors[team], k = c.getHexString();
    let m = this._flash.get(k);
    if (!m) this._flash.set(k, (m = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).lerp(c, 0.18) })));
    return m;
  }
  // the Ink Tempest's rain, the Vortex Strike's vortex, the Howl Box's beam (per second, no hit marker: like players)
  // and Surf N' Turf's rings (a ring's damage, once a ring) on this screen's own devices — the owner judges
  _standing(dt) {
    const own = [];
    for (const it of G.subs?.items || []) { const k = devKind(it); if (k && !it.ghost) own.push({ obj: it, kind: k, team: it.team, pos: it.pos, mid: devMid(it, new THREE.Vector3()), r: DEV_R[k], hurt: (d, by) => G.subs._hurt(it, d, by) }); }
    for (const w of G.specials?.world || []) if (w.kind === 'surf' && !w.ghost && !w.dead && w.phase === 'live') own.push({ obj: w, kind: 'surf', team: w.team, pos: w.pos, mid: new THREE.Vector3(w.pos.x, w.pos.y + BUOY.hitH * 0.5, w.pos.z), r: BUOY.hitR, hurt: (d, by) => w._shot(d, by) });
    if (!own.length) return;
    const hit = (d, dmg, by) => { DEPLOY_STATS.standing++; d.hurt(dmg, by); };
    // the Ink Tempest (weapons.js _updateClouds): under its cloud with nothing between
    const sp = SPECIALS.storm;
    for (const c of G.projectiles?.clouds || []) {
      if (c.t >= c.dur - 0.3) continue;
      const P = c.group.position;
      for (const d of own) {
        if (d.team === c.team || d.pos.y > P.y) continue;
        const dx = d.pos.x - P.x, dz = d.pos.z - P.z;
        if (dx * dx + dz * dz > sp.radius * sp.radius) continue;
        if (!G.physics.los(_v.copy(d.mid), _v2.set(d.pos.x, P.y - 0.6, d.pos.z))) continue;
        hit(d, sp.dps * dt, null);
      }
    }
    for (const w of G.specials?.world || []) {
      if (w.dead) continue;
      if (w.kind === 'tornado') {   // the Vortex Strike (specials.js Tornado)
        const D = SPECIALS.strike, fade = clamp((w.dur - w.t) / 0.6, 0, 1);
        for (const d of own) {
          if (d.team === w.team) continue;
          const dh = Math.hypot(w.pos.x - d.pos.x, w.pos.z - d.pos.z);
          if (dh > w.radius + d.r || d.pos.y < w.pos.y - 1.5 || d.pos.y > w.pos.y + 7) continue;
          hit(d, D.dps * dt * fade, null);
        }
      } else if (w.kind === 'speaker' && w.phase === 'blast') {   // the Howl Box's beam (through walls)
        const D = SPECIALS.wail;
        for (const d of own) {
          if (d.team === w.team) continue;
          _v.copy(d.mid).sub(w.mouth);
          const along = _v.dot(w.dir);
          if (along < -0.5 || along > w.range) continue;
          if (_v.addScaledVector(w.dir, -along).length() < w.radius + d.r + 0.15) hit(d, D.dps * dt, null);
        }
      } else if (w.kind === 'surf' && w.phase === 'live') this._rings(w, own);
    }
  }
  // Surf N' Turf's rings: the front crossing a device on the ground it runs on (the buoy's polar map: not behind a wall,
  // not on a floor above or below it) hits it once a ring
  _rings(w, own) {
    const D = SPECIALS.surf;
    for (const R of w.rings) {
      if (R.state !== 'travel' || !R.polar) continue;
      const J = R.devs || (R.devs = new Set());
      for (const d of own) {
        if (d.team === w.team || d.obj === w || J.has(d.obj)) continue;
        const dx = d.pos.x - R.c.x, dz = d.pos.z - R.c.z, dist = Math.hypot(dx, dz);
        if (dist - d.r > R.r) continue;
        J.add(d.obj);
        if (dist + d.r < R.rPrev - 0.35) continue;   // (already inside when it went by)
        const th = Math.atan2(dx, dz), reach = R.polar.reachAt(th);
        if (reach < dist - d.r) continue;
        const g = R.polar.groundAt(th, Math.min(dist, reach));
        if (d.pos.y < g - 1.2 || d.pos.y > g + D.height) continue;
        DEPLOY_STATS.rings++;
        d.hurt(D.damage, w.owner);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- queries
  // every live device that can be shot now (bots, tests): { kind, obj, team, owner, pos (its foot), aim (its middle), r,
  // ghost }
  devices(out = []) {
    for (const it of G.subs?.items || []) {
      const k = devKind(it);
      if (!k) continue;
      const aim = devMid(it, new THREE.Vector3());
      out.push({ kind: k, obj: it, team: it.team, owner: it.owner, pos: it.pos, aim, r: DEV_R[k], ghost: !!it.ghost });
    }
    for (const w of G.specials?.world || []) {
      if (w.kind !== 'surf' || w.dead || w.phase !== 'live') continue;
      out.push({ kind: 'surf', obj: w, team: w.team, owner: w.owner, pos: w.pos, aim: new THREE.Vector3(w.pos.x, w.pos.y + 0.6, w.pos.z), r: BUOY.hitR, ghost: !!w.ghost });
    }
    return out;
  }
  // Skitter Bombs hunting players, for the bots' threat system (bots.js _threatScan; the descriptor: kits/registry.js
  // `threats`) — a walker like the Waddle: shoot it down, or get out of its way
  threats(out) {
    for (const it of G.subs?.items || []) if (it.kind === 'seeker' && it.state !== 'dead' && it.state !== 'fly') out.push(seekerThreat(it));
    return out;
  }
}

// the Drip Curtain's sheet (its base line ± width/2 along tan, pos.y … + height) against any of the blocks
function curtainIn(B, it) {
  const s = it.sub, hw = s.width / 2, pad = 0.05;
  for (const b of B) {
    if (it.pos.y + s.height < b.center.y - b.half.y || it.pos.y - 0.1 > b.center.y + b.half.y) continue;
    const ax = b.axes[0], az = b.axes[2], dx = it.pos.x - b.center.x, dz = it.pos.z - b.center.z;
    const cx = dx * ax.x + dz * ax.z, cz = dx * az.x + dz * az.z;
    const ux = it.tan.x * ax.x + it.tan.z * ax.z, uz = it.tan.x * az.x + it.tan.z * az.z;
    let lo = -hw, hi = hw;
    for (const [c, u, h] of [[cx, ux, b.half.x + pad], [cz, uz, b.half.z + pad]]) {
      if (Math.abs(u) < 1e-6) { if (Math.abs(c) > h) { lo = 1; hi = 0; } continue; }
      let a0 = (-h - c) / u, a1 = (h - c) / u;
      if (a0 > a1) { const t = a0; a0 = a1; a1 = t; }
      lo = Math.max(lo, a0); hi = Math.min(hi, a1);
    }
    if (lo <= hi) return true;
  }
  return false;
}

function seekerThreat(it) {
  if (it.thr) return it.thr;
  const s = it.sub, v = new THREE.Vector3();
  it.thr = {
    kind: 'seeker', obj: it, team: it.team, owner: it.owner, pos: it.pos, aimY: 0.2, radius: s.radius, trigger: s.triggerDist,
    speed: s.speed, senseRadius: 7, ground: true,
    get live() { return it.state !== 'dead'; },
    get state() { return it.state === 'run' ? 'walk' : it.state; },   // (bots.js reads a hunting walker as 'walk')
    get hp() { return it.hp; },
    get shootable() { return it.state === 'run' || it.state === 'prime'; },
    get locked() { return it.state === 'run' && !!it.target; },
    get priming() { return it.state === 'prime'; },
    get fuse() { return it.state === 'prime' ? Math.max(0, it.fuse) : Infinity; },
    get target() { return it.state === 'run' && it.target && it.target.alive ? it.target : null; },
    get vel() { return it.state === 'run' ? v.set(Math.sin(it.heading || 0) * s.speed, 0, Math.cos(it.heading || 0) * s.speed) : v.set(0, 0, 0); },
    get left() { return it.state === 'run' ? Math.max(0, s.life - it.t) : 0; },
  };
  return it.thr;
}

export const DEPLOY = new Deployables();
G.deploy = DEPLOY;
// (tests / tools)
export const DEPLOYABLES = { DEPLOY, DEPLOY_STATS, resetDeployStats, rayCapsule, devBody, devMid, devKind, DEV_R, ROLL_CD, curtainIn, TOWER };
