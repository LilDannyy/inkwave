// [b5-karp] Objective targets (Bazookarp SPEC §2.2): things every weapon can hit the way Boss Battle's boss is hit —
// today the Roe Shell (karpShell.js). G.objTargets exists only in a Bazookarp match (null otherwise: every call site is
// `G.objTargets?.…`, so the other modes pay one null read). The calls take the boss's arguments plus one optional
// options object `o` ({ special: true } when the damage comes from a special: a projectile's / bomb's / sub item's
// `sp` flag — that is how a Bomb Barrage's bombs count as a special):
//   segHit(a, b, pad) → { t, point, dist, target } | null   asked BEFORE the actor loop: a shot that meets it stops there
//   hit(attacker, dmg, wid, point, o)                        a shot / beam / fling / droplet / melee swing connected
//   splash(attacker, c, R, dmgMax, dmgMin, wid, o)           every blast: falloff at the nearest point of its surface, with
//                                                            a clear line from the blast centre to that point
//   tick(owner, shape, dmg, wid, o)                          continuous damage ({ c, r }: a sphere, or { x, z, r }: a column);
//                                                            batched per owner like boss.rain (0.3 s)
//   spheres(out) → out                                       { c, r, solid: true } per intact target (the subs read it)
// Who decides: the shooter's screen (ghost shots never hit: a remote attacker is ignored). Offline and on the host a
// counted hit applies at once; a guest sums its hits per attacker and sends them on its next tick (`kh`, takeHits()).
import * as THREE from 'three';
import { G, clamp } from '../core/ctx.js';
import { SPECIALS, BAZOOKARP as K } from '../config.js';

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _seg = { t: 0, point: new THREE.Vector3(), dist: 0, target: null };

export class ObjTargets {
  constructor() {
    this.targets = [];
    this.pending = new Map();   // guest: attacker → summed counted damage since the last tick
    this.rain = new Map();      // owner → { amt, wid, o } (continuous damage, flushed every 0.3 s)
    this.rainT = 0;
    this.log = { hits: 0, splash: 0, ticks: 0, sent: 0 };
  }
  add(t) { if (!this.targets.includes(t)) this.targets.push(t); return t; }
  remove(t) { const i = this.targets.indexOf(t); if (i >= 0) this.targets.splice(i, 1); }
  isSpecial(wid, o) { return !!(o && o.special) || !!(wid && SPECIALS[wid]); }

  // the nearest target along a → b (within pad of its surface)
  segHit(a, b, pad = 0) {
    let best = null;
    for (const t of this.targets) {
      const h = t.segHit(a, b, pad);
      if (h && (!best || h.t < best.t)) { best = { t: h.t, target: t }; _seg.point.copy(h.point); }
    }
    if (!best) return null;
    _seg.t = best.t; _seg.target = best.target; _seg.dist = a.distanceTo(b) * best.t;
    return _seg;
  }
  // a direct hit: on the given target (o.target), else the only / nearest one to the point
  hit(attacker, dmg, wid, point, o) {
    if (!attacker || attacker.remote || !(dmg > 0)) return;
    const t = (o && o.target) || this._at(point);
    if (!t || !t.hittable()) return;
    this.log.hits++;
    this._count(t, attacker, t.hitFilter(dmg, wid, o), point);
  }
  splash(attacker, c, R, dmgMax, dmgMin, wid, o) {
    if (!attacker || attacker.remote) return;
    for (const t of this.targets) {
      if (!t.hittable()) continue;
      const sc = t.center(), r = t.radius();
      const d = Math.max(0, sc.distanceTo(c) - r);
      if (d > R) continue;
      // the nearest point of its surface, seen from the blast centre (a wall between: nothing)
      _v2.copy(c).sub(sc); const l = _v2.length();
      if (l > 1e-4) _v2.multiplyScalar((r * 0.9) / l); else _v2.set(0, 0, 0);
      _v2.add(sc);
      if (!G.physics.los(_v.copy(c).setY(c.y + 0.3), _v2)) continue;
      this.log.splash++;
      this._count(t, attacker, t.hitFilter(dmgMax + (dmgMin - dmgMax) * clamp(d / Math.max(0.01, R), 0, 1), wid, o), null);
    }
  }
  // continuous damage: dmg this frame (already × dt) while it overlaps the shell, × contMul; summed and flushed 0.3 s
  tick(owner, shape, dmg, wid, o) {
    if (!owner || owner.remote || !(dmg > 0)) return;
    for (const t of this.targets) {
      if (!t.hittable()) continue;
      const sc = t.center(), r = t.radius();
      const over = shape.c ? shape.c.distanceTo(sc) < (shape.r || 0) + r : Math.hypot(shape.x - sc.x, shape.z - sc.z) < (shape.r || 0) + r;
      if (!over) continue;
      this.log.ticks++;
      const e = this.rain.get(owner) || { amt: 0, t };
      e.amt += dmg * K.shell.contMul; e.t = t;
      this.rain.set(owner, e);
    }
  }
  update(dt) {
    this.rainT -= dt;
    if (this.rainT > 0 || !this.rain.size) return;
    this.rainT = 0.3;
    for (const [owner, e] of this.rain) if (e.t.hittable()) this._count(e.t, owner, Math.min(K.shell.hitCap, e.amt), null);
    this.rain.clear();
  }
  spheres(out = []) { for (const t of this.targets) t.spheres(out); return out; }
  shields(out = []) { for (const t of this.targets) t.shields?.(out); return out; }

  _at(point) {
    if (this.targets.length === 1 || !point) return this.targets[0] || null;
    let best = null, bd = Infinity;
    for (const t of this.targets) { const d = t.center().distanceTo(point) - t.radius(); if (d < bd) { bd = d; best = t; } }
    return best;
  }
  // one counted hit: applied now (offline / the host), or summed for the host (a guest)
  _count(t, attacker, amount, point) {
    if (!(amount > 0)) return;
    t.flash?.(attacker, amount, point);
    if (G.netm && !G.netm.isHost) { this.pending.set(attacker, (this.pending.get(attacker) || 0) + amount); return; }
    t.add(attacker.team, amount, attacker);
  }
  // a guest's tick: the shell hits since the last one, summed per attacker → [nid, dmg, nid, dmg, …] (or null)
  takeHits() {
    if (!this.pending.size) return null;
    const out = [];
    for (const [a, d] of this.pending) if (a.nid !== undefined) out.push(a.nid, Math.round(d * 10) / 10);
    this.pending.clear();
    this.log.sent++;
    return out.length ? out : null;
  }
}
