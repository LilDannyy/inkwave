// [b5-karp] The Roe Shell (Bazookarp SPEC §2.2, §5.1's API): the giant fish egg round a resting Bazookarp.
//   • one signed meter m, −hp … +hp (Alpha's counted damage adds, Bravo's subtracts); |m| ≥ hp → the engine's onBurst.
//     hp 1000 for the opening shell, 500 for every re-formed one. After regenDelay s with no hit it drifts back to 0.
//   • its radius swells with the meter: r + (rMax − r) × (|m| / hp)², 1.6 → 2.3 m; its centre is `lift` over its floor.
//   • it is an objective target (objTargets.js): it blocks every shot and beam of both teams; specials count × 0.5, one
//     hit at most 220.
//   • touching it (this screen's own players): 20 damage at most every 0.5 s, never below 1 hp; shoved out at 6 m/s,
//     never off an edge (the part of the push toward a drop deeper than 1.2 m is removed).
//   • growing (0.8 s after a drop / plant / reset / move): no hits, no pick-up, no touch damage, but it shoves, and every
//     frame it calls G.deploy.crushIn({ sphere }, 'shell') — the deploy package's one destroyer (a no-op until it exists).
import * as THREE from 'three';
import { G, clamp } from '../core/ctx.js';
import { BAZOOKARP as K, PLAYER } from '../config.js';

const S = K.shell;
const _c = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3();
const _seg = { t: 0, point: new THREE.Vector3() };

export class KarpShell {
  constructor(engine) {
    this.engine = engine;
    this.st = 'none';               // 'none' | 'growing' | 'intact'
    this.pos = new THREE.Vector3(); // the resting floor point (the centre is lift above it)
    this.c = new THREE.Vector3();
    this.m = 0; this.hpMax = S.hp;
    this.grow = 0; this.growT = 0;  // s left / total of the growth
    this.quiet = 0;                 // s since the last counted hit (regrowth)
    this.lastHit = [null, null];    // the last attacker per team (the burst's credit)
    this.touchT = new Map();        // own actor → s until it can be stung again
    this.flashK = 0; this.flashTeam = -1;
    this.stats = { counted: [0, 0], hits: 0, touches: 0, shoves: 0, crushes: 0 };
  }
  get state() { return this.st; }
  get meter() { return this.m; }
  get hp() { return this.hpMax; }
  center() { return this.c; }
  radius() {
    if (this.st === 'none') return 0;
    const full = S.r + (S.rMax - S.r) * Math.min(1, (Math.abs(this.m) / this.hpMax) ** 2);
    return this.st === 'growing' ? full * clamp(1 - this.grow / Math.max(0.01, this.growT), 0.05, 1) : full;
  }
  hittable() { return this.st === 'intact'; }

  // grow a shell round the Bazookarp resting at pos (hp: its toughness; grow: seconds, 0 = already whole)
  form(pos, hp, grow = S.reform) {
    this.pos.copy(pos); this.c.copy(pos); this.c.y += S.lift;
    this.hpMax = hp; this.m = 0; this.quiet = 0; this.lastHit = [null, null];
    this.grow = this.growT = grow;
    this.st = grow > 0 ? 'growing' : 'intact';
  }
  clear() { this.st = 'none'; this.m = 0; this.grow = 0; }
  // followers: the host's meter and toughness (snapshots)
  setFromNet(meter, hp) { this.m = meter; if (hp > 0) this.hpMax = hp; }

  // host / offline: one counted hit (already filtered). team 0 adds, team 1 subtracts
  add(team, amount, attacker) {
    if (this.st !== 'intact' || !(amount > 0) || (team !== 0 && team !== 1)) return;
    this.m = clamp(this.m + (team === 0 ? amount : -amount), -this.hpMax, this.hpMax);
    this.quiet = 0;
    this.lastHit[team] = attacker || null;
    this.stats.counted[team] += amount; this.stats.hits++;
    if (Math.abs(this.m) >= this.hpMax - 1e-6) this.engine.onBurst(this.m > 0 ? 0 : 1, this.lastHit[this.m > 0 ? 0 : 1]);
  }
  // what a hit counts for: × 0.5 for a special (by its weapon id, or o.special: a barrage's bombs), at most 220
  hitFilter(dmg, wid, o) {
    const sp = G.objTargets ? G.objTargets.isSpecial(wid, o) : false;
    return Math.min(S.hitCap, dmg * (sp ? S.specialMul : 1));
  }
  flash(attacker, amount) { this.flashK = Math.min(1, this.flashK + amount / 120); this.flashTeam = attacker?.team ?? -1; }

  // the segment a → b meets the shell (within pad) → { t, point } or null (only while intact: it blocks then)
  segHit(a, b, pad = 0) {
    if (this.st !== 'intact') return null;
    const c = this.c, R = this.radius() + pad;
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L2 = dx * dx + dy * dy + dz * dz || 1e-9;
    const fx = a.x - c.x, fy = a.y - c.y, fz = a.z - c.z;
    const bq = (fx * dx + fy * dy + fz * dz) / L2, cq = (fx * fx + fy * fy + fz * fz - R * R) / L2;
    const disc = bq * bq - cq;
    if (disc < 0) return null;
    let t = -bq - Math.sqrt(disc);
    if (cq <= 0) t = 0;                           // (starts inside: right away)
    if (t < 0 || t > 1) return null;
    _seg.t = t; _seg.point.set(a.x + dx * t, a.y + dy * t, a.z + dz * t);
    return _seg;
  }
  spheres(out) {
    if (this.st !== 'intact') return out;
    const s = this._sph || (this._sph = { c: this.c, r: 0, solid: true, kind: 'karpShell' });
    s.r = this.radius();
    out.push(s);
    return out;
  }
  // the bots' shield descriptor (a big round thing that stops shots: flank logic treats it like a shield)
  shields(out) {
    if (this.st !== 'intact') return out;
    const d = this._shd || (this._shd = { kind: 'karpShell', held: false, team: -1, owner: null, C: this.c, N: new THREE.Vector3(0, 0, 1), R: 0, live: true, blocksActors: true });
    d.R = this.radius();
    out.push(d);
    return out;
  }

  // per frame. own: this screen's own players (touch damage and the shove are their owner's). host: regrowth.
  update(dt, own, host) {
    if (this.flashK > 0) this.flashK = Math.max(0, this.flashK - dt * 3);
    if (this.st === 'none') return;
    if (this.st === 'growing') {
      this.grow -= dt;
      G.deploy?.crushIn?.({ sphere: { c: this.c, r: this.radius() } }, 'shell') && this.stats.crushes++;
      if (this.grow <= 0) { this.grow = 0; this.st = 'intact'; }
    }
    if (host && this.st === 'intact') {
      this.quiet += dt;
      if (this.quiet > S.regenDelay && this.m) this.m = Math.sign(this.m) * Math.max(0, Math.abs(this.m) - S.regen * dt);
    }
    const R = this.radius(), c = this.c;
    for (const a of own) {
      if (!a.alive || a.superJumpState) continue;
      // the body's closest point to the centre (a vertical segment from 0.3 to 1.2 m over the feet)
      const by = clamp(c.y, a.pos.y + 0.3, a.pos.y + 1.2);
      const dx = a.pos.x - c.x, dz = a.pos.z - c.z, dy = by - c.y;
      const d = Math.hypot(dx, dy, dz), reach = R + PLAYER.radius;
      let left = this.touchT.get(a) || 0;
      if (left > 0) { left -= dt; this.touchT.set(a, left); }
      if (d >= reach) continue;
      // the shove: out radially (horizontal) at touchShove, never toward a drop deeper than shoveEdge
      const hd = Math.hypot(dx, dz);
      let nx = hd > 1e-3 ? dx / hd : 1, nz = hd > 1e-3 ? dz / hd : 0;
      const gy = G.level.groundHeight(a.pos.x + nx, a.pos.z + nz, a.pos.y + 0.6);
      if (!(gy > a.pos.y - S.shoveEdge)) {
        // off an edge that way: only the part along the edge (tangent), toward whichever side has floor
        const tx = -nz, tz = nx;
        const g1 = G.level.groundHeight(a.pos.x + tx, a.pos.z + tz, a.pos.y + 0.6), g2 = G.level.groundHeight(a.pos.x - tx, a.pos.z - tz, a.pos.y + 0.6);
        const s = g1 > a.pos.y - S.shoveEdge ? 1 : g2 > a.pos.y - S.shoveEdge ? -1 : 0;
        nx = tx * s; nz = tz * s;
      }
      if (nx || nz) {
        const push = Math.min(reach - d, S.touchShove * dt * 2.5);
        _d.set(nx, 0, nz);
        a.pos.x += nx * push; a.pos.z += nz * push;
        const vn = a.vel.x * nx + a.vel.z * nz;
        if (vn < S.touchShove) { a.vel.x += nx * (S.touchShove - vn); a.vel.z += nz * (S.touchShove - vn); }
        this.stats.shoves++;
      }
      // the sting (not while it grows): 20 at most every 0.5 s, never below 1 hp
      if (this.st === 'intact' && left <= 0 && a.hp > S.touchFloor) {
        const dmg = Math.min(S.touch, a.hp - S.touchFloor);
        if (dmg > 0) { a.damage(dmg, null, 'karp-touch'); this.stats.touches++; }
        this.touchT.set(a, S.touchGap);
      }
    }
    void _v;
  }
}
