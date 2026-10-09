// [b5-karp] Bazookarp bots — WP1's MINIMAL set through the real hook points (SPEC §8.7). WP3 (karp-bots) builds the full
// brain on these hooks (roles, routes, difficulty, the danger areas, the wake sight): see SPEC §8.
//   karpPlan()                 the team plan (re-dealt twice a second): per bot a role — 'break' (shoot the shell from a
//                              ring 5.5–9 m out; melee mains close in), 'grab' (the one nearest a free Bazookarp makes
//                              for it), 'carry', 'escort' (beside our carrier), 'hunt' (at their known carrier)
//   karpSync(b, P)             a changed role re-targets at once
//   karpEngage(b, P)           take the fight? (a carrier: anyone within 22 m; the rest: in range or by the objective)
//   karpGoal(b, P) / karpFightNav(b, P)   the navigation goal by role (the carrier: its weir, then its Gate)
//   karpCarrierAct(b, P, ctx)  a carrier's ONLY trigger writer: charge and loose Carp Shots at known foes (full charge
//                              past 6 m, a Splash up close), lobbing over cover; never a sub or special → { yaw, pitch, dist }
//   karpAim(b, P, dt, it)      a breaker with no foe in sight: aim at the shell and shoot it → { yaw, pitch, dist } | null
//   karpPathArgs(b)            the carrier's route rules for _pathTo: { avoid, cost, noClimb: true } — both spawn zones, its
//                              own free zones, carrierBlock, the shell, and (own half) nodes 6 m behind its retreat mark
//   KARP_W                     the carrier's weapon stand-in (not melee, no kit: every kit hook skips itself)
import * as THREE from 'three';
import { G, clamp } from '../core/ctx.js';
import { BAZOOKARP as K, PLAYER } from '../config.js';
import { revealedTo } from './reveal.js';
import { speedOf } from './karpGun.js';

export const KARP_W = Object.freeze({ kind: 'karp', id: 'karp', range: 20, projSpeed: 20, special: null });
export const KARP_BOT = { stats: { carrierShots: 0, retreatFallback: 0, grabs: 0, breakT: 0 } };
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _plans = new WeakMap();
const MELEE = new Set(['roller', 'brush', 'blade', 'mitts']);

export function karpPlan() {
  const m = G.match, Kp = m && m.karp;
  if (!Kp || m.attract || m.practice || !G.nav) return null;
  let P = _plans.get(Kp);
  if (!P) { P = new KarpPlan(Kp); _plans.set(Kp, P); }
  P.tick();
  return P;
}

class KarpPlan {
  constructor(Kp) {
    this.Kp = Kp; this.t = -1; this.roles = new Map(); this.spot = new Map();
    const N = G.nav.nodes.length;
    // the carrier's static avoid masks per team: both spawn zones, its own free zones, carrierBlock nodes
    this.avoidBase = [0, 1].map((t) => {
      const m = new Uint8Array(N), F = Kp.field;
      for (let i = 0; i < N; i++) {
        const n = G.nav.nodes[i];
        if (n.zone >= 0 || !F.ok[i]) { m[i] = 1; continue; }
        const p = _v.set(n.x, n.y, n.z);
        if (F.inFreeZone(t, p) >= 0 || F.inCarrierBlock(p)) m[i] = 1;
      }
      return m;
    });
    this.shellMask = new Uint8Array(N); this.shellKey = '';
  }
  tick() {
    const now = G.time;
    if (now - this.t < 0.5) return;
    this.t = now;
    const Kp = this.Kp, H = Kp.holder;
    // the shell's footprint (nobody routes through it)
    const key = Kp.shell.state === 'none' ? '' : `${Kp.pos.x.toFixed(1)},${Kp.pos.z.toFixed(1)}`;
    if (key !== this.shellKey) {
      this.shellKey = key; this.shellMask.fill(0);
      if (key) { const c = Kp.shell.center(), R = K.shell.rMax + 0.6; for (let i = 0; i < this.shellMask.length; i++) { const n = G.nav.nodes[i]; if (Math.hypot(n.x - c.x, n.z - c.z) < R && Math.abs(n.y - Kp.pos.y) < 2) this.shellMask[i] = 1; } }
    }
    this.roles.clear();
    for (let t = 0; t < 2; t++) {
      const team = G.actors.filter((a) => a.team === t && a.alive && a.bot);
      if (H && H.team === t) { for (const a of team) this.roles.set(a, a === H ? 'carry' : 'escort'); continue; }
      if (H) { for (const a of team) this.roles.set(a, 'hunt'); continue; }
      if (Kp.phase === 'free') {
        let g = null, gd = Infinity;
        for (const a of team) { const d = a.pos.distanceTo(Kp.pos); if (d < gd && !a.specialActive) { gd = d; g = a; } }
        for (const a of team) this.roles.set(a, a === g || a.pos.distanceTo(Kp.pos) < 6 ? 'grab' : 'break');
        continue;
      }
      for (const a of team) this.roles.set(a, 'break');
    }
  }
  roleOf(a) { return this.roles.get(a) || 'break'; }
  // the carrier's target: its team's standing weir (the one with the shortest walk), then its Gate
  target(t) {
    const Kp = this.Kp;
    if (!Kp.lowered[t] && Kp.weirs[t].length) {
      let best = null, bd = Infinity;
      for (const w of Kp.weirs[t]) { const H = Kp.holder; const d = H ? H.pos.distanceTo(w.pos) : 0; if (d < bd) { bd = d; best = w; } }
      return best.pos;
    }
    return Kp.gates[t].pos;
  }
  // a breaker's spot: a nav node 6–8 m from the shell on our side, spread by slot
  breakSpot(a) {
    const Kp = this.Kp, c = Kp.pos, pad = G.level.spawnPads[a.team];
    const base = Math.atan2(pad.x - c.x, pad.z - c.z), ang = base + ((a.slot % 4) - 1.5) * 0.55;
    const melee = MELEE.has(a.weapon.kind), want = melee ? Math.max(2.5, Kp.shell.radius() + 0.9) : 7;
    for (const r of [want, want + 1, want - 1, want + 2.5]) {
      _v.set(c.x + Math.sin(ang) * r, c.y + 0.5, c.z + Math.cos(ang) * r);
      const id = G.nav.nearest(_v, 1.0);
      if (id >= 0) { const n = G.nav.nodes[id]; if (Math.hypot(n.x - c.x, n.z - c.z) > Kp.shell.radius() + 0.6) return n; }
    }
    return null;
  }
}

export function karpSync(b, P) {
  const r = P.roleOf(b.a);
  if (r !== b.kRole) { b.kRole = r; b.goalTimer = 0; b.repath = 0; b.kGoalT = 0; }
}
export function karpEngage(b, P) {
  const a = b.a, t = b.tv;
  if (!t) return false;
  const d = Math.hypot(t.pos.x - a.pos.x, t.pos.z - a.pos.z);
  if (a.carry) return d < 22;
  if (b.kRole === 'hunt' && t === P.Kp.holder) return true;
  const c = P.Kp.pos, dc = Math.hypot(t.pos.x - c.x, t.pos.z - c.z);
  return d < b._range() * 1.1 || dc < 12;
}
// the navigation goal (paint mode), by role
export function karpGoal(b, P) {
  const a = b.a, Kp = P.Kp;
  b.kGoalT = (b.kGoalT || 0) - 1 / 60;
  const due = b.kGoalT <= 0 || !b.path || b.pi >= b.path.length;
  if (!due) return;
  b.kGoalT = a.carry ? 1.0 : 1.5;
  const role = b.kRole;
  if (role === 'carry') { b._pathTo(P.target(a.team), 0.6); return; }
  if (role === 'grab') { b._pathTo(Kp.pos, 1.2); return; }
  if (role === 'escort' && Kp.holder) { const H = Kp.holder, tg = P.target(H.team); _v.copy(tg).sub(H.pos).setY(0); if (_v.lengthSq() > 1) _v.normalize(); b._pathTo(_v2.copy(H.pos).addScaledVector(_v, 5).add(_v.set((a.slot % 2 ? 1 : -1) * 2.5, 0, 0)), 1.0); return; }
  if (role === 'hunt' && Kp.holder) {
    const H = Kp.holder;
    if (revealedTo(H, a.team) || H.pos.distanceTo(a.pos) < 12) { b.kLast = H.pos.clone(); b._pathTo(H.pos, 1.0); return; }
    if (b.kLast) { b._pathTo(b.kLast, 1.0); return; }
    b._pathTo(P.target(H.team), 1.0); return;
  }
  if (Kp.phase === 'resetting') { b._pathTo(_v.copy(P.Kp.R.pond).add(_v2.set(0, 0, a.team === 0 ? -7 : 7)), 1.0); return; }
  const n = P.breakSpot(a);
  if (n) b._pathTo(_v.set(n.x, n.y, n.z), 0.5);
  else b._pathTo(Kp.pos, 1.0);
}
// in a fight: the carrier keeps walking its route; hunters keep after the carrier
export function karpFightNav(b, P) {
  const a = b.a;
  if (a.carry) { karpGoal(b, P); return true; }
  if (b.kRole === 'hunt' && P.Kp.holder && b.target === P.Kp.holder) return false;
  if (b.kRole === 'grab') { karpGoal(b, P); return true; }
  return false;
}

// the arc solver: the aim pitch that lobs a Carp Shot of charge c from the muzzle to a point d m out, dy above the feet
function lobPitch(c, d, dy) {
  const s = speedOf(c), g = K.gun.gravity, y0 = K.gun.muzzleUp - dy;
  let best = null, be = Infinity;
  for (let p = -0.6; p <= 0.8; p += 0.02) {
    const th = p + (K.gun.lob * Math.PI) / 180, vx = Math.cos(th) * s, vy = Math.sin(th) * s;
    const disc = vy * vy + 2 * g * y0;
    if (disc < 0) continue;
    const t = (vy + Math.sqrt(disc)) / g, x = vx * t;
    const e = Math.abs(x - (d - K.gun.muzzleFwd));
    if (e < be) { be = e; best = p; }
  }
  return be < 2.5 ? best : null;
}
// a carrier's trigger and aim (the only writer of it.fire while carrying)
export function karpCarrierAct(b, P, { it, enemyVisible }) {
  const a = b.a, g = a.carry?.gun;
  it.sub = false; it.special = false; it.jump = false;
  const t = b.tv;
  if (t && (enemyVisible || (b.tk && G.time - b.tk.t < 1.5))) {
    const d = Math.hypot(t.pos.x - a.pos.x, t.pos.z - a.pos.z), dy = t.pos.y - a.pos.y;
    const want = d < 6 ? 0 : 1;
    const pitch = lobPitch(want, d, dy);
    if (pitch !== null) {
      const yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z);
      const aimed = Math.abs(((b.aimYaw - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.12;
      if (g && (g.charging || g.tap)) it.fire = !(g.c >= want && aimed && b.react <= 0);
      else it.fire = aimed && b.react <= 0 && (g ? g.cd <= 0 : true);
      if (it.fire) it.squid = false;
      if (it.fire && !(g && g.charging)) KARP_BOT.stats.carrierShots++;
      return { yaw, pitch, dist: d };
    }
  }
  if (g && g.charging) it.fire = false;   // (let a stray charge go)
  // travel: swim through our own ink when nobody's close
  if (b.groundSeen === 1 && b._pathRemaining() > 4) it.squid = true;
  return null;
}
// a breaker with nothing better to shoot: the shell
export function karpAim(b, P, dt, it) {
  const a = b.a, Kp = P.Kp;
  if (Kp.shell.state !== 'intact' || a.carry) return null;
  const c = Kp.shell.center(), d = Math.hypot(c.x - a.pos.x, c.z - a.pos.z), w = a.weapon;
  const melee = MELEE.has(w.kind);
  if (d > (melee ? 4.5 : Math.min(b._range() * 1.05, 18))) return null;
  _v.set(a.pos.x, a.pos.y + 1.1, a.pos.z);
  if (!G.physics.los(_v, c)) return null;
  const yaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z), pitch = clamp(Math.atan2(c.y - (a.pos.y + 1.1), Math.max(0.5, d)), -0.9, 0.9);
  const wr = a.weaponRunner, off = Math.abs(((b.aimYaw - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  if (a.ink < 3) return { yaw, pitch, dist: d };
  if (w.kind === 'charger' || w.kind === 'bow') it.fire = !(wr.charging && wr.charge >= 0.85) && off < 0.25;
  else if (w.kind === 'spinner' || w.kind === 'splatling') it.fire = wr.burstT <= 0 && !wr.streaming && !(wr.charging && wr.charge >= 0.7) && off < 0.3;
  else it.fire = off < 0.3;
  it.squid = false;
  KARP_BOT.stats.breakT += dt;
  return { yaw, pitch, dist: d };
}
// the carrier's route rules for _pathTo (built at most twice a second)
export function karpPathArgs(b) {
  const a = b.a, P = karpPlan();
  if (!P || !a.carry) return null;
  const now = G.time;
  if (b.kArgs && now - b.kArgsT < 0.5) return b.kArgs;
  const N = G.nav.nodes.length, base = P.avoidBase[a.team], sm = P.shellMask;
  const avoid = b.kAvoid && b.kAvoid.length === N ? b.kAvoid : (b.kAvoid = new Uint8Array(N));
  const F = P.Kp.field, J = a.carry.j, D = F.D[a.team], L = F.L[a.team];
  const retreat = J && Number.isFinite(J.mark) && J.half === a.team;
  for (let i = 0; i < N; i++) avoid[i] = base[i] || sm[i] || (retreat && F.nodeHalf(i) === a.team && L - D[i] < J.mark - 6) ? 1 : 0;
  b.kArgs = { avoid, retreat, cost: null, noClimb: true }; b.kArgsT = now;
  return b.kArgs;
}
// the same without the retreat part (no forward path at all: accept a short ×3 rather than stand still)
export function karpPathFallback(b) {
  const a = b.a, P = karpPlan();
  if (!P) return null;
  const N = G.nav.nodes.length, base = P.avoidBase[a.team], sm = P.shellMask, avoid = new Uint8Array(N);
  for (let i = 0; i < N; i++) avoid[i] = base[i] || sm[i] ? 1 : 0;
  KARP_BOT.stats.retreatFallback++;
  return { avoid, cost: null, noClimb: true };
}
// everyone else in a Bazookarp match: no route through the shell
export function karpShellAvoid() { const P = karpPlan(); return P && P.shellKey ? P.shellMask : null; }
void PLAYER;
