// [b5-karp] [b5-karp-bots] Bazookarp bots (SPEC §8): the team plan, the carrier's job, breakers, defenders, the danger areas
// and the wake sight — wired into bots.js by short tagged hooks (§8.7). No wall-hacks: a bot knows a foe only through
// botSight.js (seen, located — the carrier's marker is a reveal in kid form — or remembered: teamKnown) and a danger only
// as a player could notice it (botSpecials.js).
//
// THE PLAN (karpPlan(): one per match engine, re-dealt twice a second and on every karp event). Per team, by situation:
//   shell   (shielded / re-forming / resetting) 3 'break' (shoot the shell from a ring 5.5–9 m out with a line on it, and
//           strafe; melee mains close in to max(2.5, r + 0.88) m while the other team's side of the meter is under 50 %,
//           then out to the ring), 1 'perch' (a charger) or a 4th breaker. The 'grab' breaker (nearest the shell, no special
//           running, hp ≥ 60) closes to 3.0–3.2 m once OUR side is ≥ 85 % (just outside touch range at full swell).
//   free    the grabber (and anyone within 6 m) times its run in after the 0.25 s hold (+ the difficulty's grab delay);
//           the rest 'fight' round it, between it and their side
//   ours    'carry' (§8.4), 'lead' (8–14 m ahead on the carrier's route, inking it), 'flank' (3–8 m beside it on the side
//           the known threat is), 'anchor' (8–12 m behind it: the jump target, and it fights)
//   theirs  'intercept' ×2 (×1 easy; hard: from two sides) at the carrier while it is known, else to its last known spot
//           and along the route it is expected to take; 'keeper' ×1 (×2 when the carrier is within 25 m of our open Gate
//           or its count within 10 of its weir's) on a hold spot 4–9 m in front of the weir on its route / our Gate, in
//           cover, inking the approach; 'perch' (a charger) or a third interceptor
//   Humans on the team fill the role whose spot is nearest them (bots take the rest).
// THE CARRIER (§8.4): candidate routes to its weir(s) / Gate on G.nav (the layout's `routes` hints when there are any, else
// the shortest no-climb path and k-disjoint alternatives), re-picked by cost (length + 6 m per known foe within 10 m of the
// next 25 m + 0.3 × the metres of enemy ink on the next 20 m + the known dangers, 8 m of hysteresis) every 3 / 1.5 / 1 s
// by difficulty; walked through _pathTo with the carrier's avoid mask (spawns, own free zones, carrierBlock, the retreat
// mark: never ×3 unless no forward path exists — carrierRetreatFallback) and a Float32 cost (dangers + the picked
// route's corridor). Swims in our ink when no foe is known within 12 m (hidden), kid to charge; Carp Shots by §8.4's
// table (lobs over cover, leads on hard); the knockback push through enemy ink; a fuse that can't make it → over the
// halfway line first.
// DIFFICULTY (§8.8): KARP_AI.diff.
//   karpPlan · karpSync · karpEngage · karpGoal · karpFightNav · karpCarrierAct · karpAim · karpMove · karpPaintAim ·
//   karpSpecial · karpStrikeAt · karpJump · karpShields · karpPathArgs / karpPathFallback · karpShellAvoid · karpDangers
//   (botSpecials.js) · KARP_W · KARP_BOT.stats (karp-match)
import * as THREE from 'three';
import { G, on, clamp, angleDiff } from '../core/ctx.js';
import { BAZOOKARP as K, PLAYER, SPECIALS } from '../config.js';
import { revealedTo } from './reveal.js';
import { speedOf, radiusOf } from './karpGun.js';
import { teamKnown } from './botSight.js';
import { SUB_KITS } from './kits/registry.js';
import { Hit } from './physics.js';

export const KARP_W = Object.freeze({ kind: 'karp', id: 'karp', range: 20, projSpeed: 20, special: null });
// tuning and the difficulty table (SPEC §8.8). Tests flip `enabled` off for an A/B (the WP1 minimal behaviour stays)
export const KARP_AI = {
  enabled: true,
  ring: [5.5, 9],          // m from the shell's centre: the ranged breakers' ring (the burst 4.5 + 1 m)
  meleeOut: 0.5,           // the other team's side of the meter at which melee breakers move out to the ring
  grabAt: 0.85, grabR: 3.1,   // our side at which the grabber closes in, and to how far (touch at full swell: 2.68 m)
  dangerR: 5.5,            // the shell's danger disc (≥ the threshold of the other team's side)
  fuseDanger: 3,           // s: our carrier's last seconds are a danger to its teammates
  wakeR: 20,               // m (botSight SIGHT.karpWakeR mirrors it)
  escortR: 20,             // escorts don't chase further than this from the carrier
  jumpR: 35,               // a respawned bot super jumps to the carrier this far off
  diff: {
    easy:   { id: 'easy',   full: true,  lob: false, lead: false, push: 0, repick: 3,   danger: null, icpt: 1, grab: 0.6 },
    normal: { id: 'normal', full: false, lob: true,  lead: false, push: 1, repick: 1.5, danger: 0.7,  icpt: 2, grab: 0.2 },
    hard:   { id: 'hard',   full: false, lob: true,  lead: true,  push: 2, repick: 1.0, danger: 0.6,  icpt: 2, grab: 0, sides: true, threat: true },
  },
};
export const KARP_BOT = { stats: { fbAt: [], carrierShots: 0, retreatFallback: 0, grabs: 0, breakT: 0, push: 0, dodges: 0, splashes: 0, routeInk: 0, picks: 0, routes: {}, keeperT: 0, icptT: 0, jumps: 0, specials: 0, roles: {} } };
export function resetKarpStats() { const S = KARP_BOT.stats; for (const k in S) S[k] = Array.isArray(S[k]) ? [] : typeof S[k] === 'object' ? {} : 0; }

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _sc = new V3(), _e = new V3(), _q = new V3();
const _plans = new WeakMap();
const MELEE = new Set(['roller', 'brush', 'blade', 'mitts']);
const SHELL_SP = new Set(['barrage', 'booyah', 'strike']);   // bomb-type specials breakers throw at the shell (§8.6)
const hd = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
const DF = (b) => KARP_AI.diff[b && b.diff && b.diff.id] || KARP_AI.diff.normal;
const isBot = (a) => !!(a.bot && !a.bot.human);
const busy = (a) => { const s = a.specialActive; return !!(s && !s.free && !(s.kind === 'bubbler' || s.id === 'bubbler')); };
const spKind = (a) => SPECIALS[a.specialId]?.kind || a.specialId;

export function karpPlan() {
  const m = G.match, Kp = m && m.karp;
  if (!Kp || m.attract || m.practice || !G.nav) return null;
  let P = _plans.get(Kp);
  if (!P) { P = new KarpPlan(Kp); _plans.set(Kp, P); }
  P.tick();
  return P;
}

// ================================================================================================ the team plan
class KarpPlan {
  constructor(Kp) {
    this.Kp = Kp; this.t = -9; this.dirty = true;
    this.roles = [new Map(), new Map()]; this.sit = ['shell', 'shell']; this.aux = new Map();
    const N = (this.N = G.nav.nodes.length), F = Kp.field;
    // the carrier's static avoid masks per team: both spawn zones, its own free zones, carrierBlock nodes (zoneN: its own
    // free zones alone — a carrier inside one leaves it the shortest way instead of finding no route at all)
    this.zoneN = [new Uint8Array(N), new Uint8Array(N)];
    this.avoidBase = [0, 1].map((t) => {
      const m = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        const n = G.nav.nodes[i];
        if (n.zone >= 0 || !F.ok[i]) { m[i] = 1; continue; }
        const p = _v.set(n.x, n.y, n.z);
        if (F.inFreeZone(t, p) >= 0) { m[i] = 1; this.zoneN[t][i] = 1; }
        if (F.inCarrierBlock(p)) m[i] = 1;
      }
      return m;
    });
    this.shellMask = new Uint8Array(N); this.shellKey = '';
    this.route = [null, null];      // per team: { cands, pick, i (the carrier's index on it), t, from, key }
    this.foes = [[], []];           // per team: the foes it knows of ({ e, pos, seen, t }) — teamKnown, no wall-hacks
    this.burstT = -9; this.burstTeam = -1;
    this.keepC = new Map();         // objective key → hold spots
    this._tmp = new Uint8Array(N);
    const dirty = () => { this.dirty = true; };
    Kp.unsubs.push(on('karp:burst', (e) => { this.burstT = G.time; this.burstTeam = e.team; this.dirty = true; }),
      on('karp:pickup', () => { this.dirty = true; this.route = [null, null]; }), on('karp:drop', dirty), on('karp:reset', dirty),
      on('karp:plant', () => { this.dirty = true; this.route = [null, null]; }), on('karp:phase', dirty), on('karp:field', () => { this.dirty = true; this.route = [null, null]; }));
  }
  tick() {
    const now = G.time;
    if (!this.dirty && now - this.t < 0.5 && now >= this.t) return;
    this.dirty = false; this.t = now;
    const Kp = this.Kp;
    // the shell's footprint (nobody routes through it): its current radius + 0.6 m (SPEC §8.2)
    const R = Kp.shell.radius() + 0.6, key = Kp.shell.state === 'none' ? '' : `${Kp.pos.x.toFixed(1)},${Kp.pos.z.toFixed(1)},${R.toFixed(1)}`;
    if (key !== this.shellKey) {
      this.shellKey = key; this.shellMask.fill(0);
      if (key) { const c = Kp.shell.center(); for (let i = 0; i < this.N; i++) { const n = G.nav.nodes[i]; if (Math.hypot(n.x - c.x, n.z - c.z) < R && Math.abs(n.y - Kp.pos.y) < 2) this.shellMask[i] = 1; } }
    }
    for (let t = 0; t < 2; t++) {
      // the foes this team knows of (seen / located / remembered ≤ 4 s)
      const F = this.foes[t]; F.length = 0;
      for (const e of G.actors) {
        if (e.team === t || !e.alive) continue;
        const k = teamKnown(t, e, 4);
        if (k) F.push({ e, pos: k.guess, seen: k.seen, t: k.t });   // (its last look's spot: never the live position)
      }
    }
    for (let t = 0; t < 2; t++) this._deal(t);
    // a human carrier's route (a bot carrier picks its own)
    const H = Kp.holder;
    if (H && !isBot(H)) this.pickRoute(H.team, H, 1.5, null);
  }
  // the carrier's avoid mask in the field's state now in force: the static one, plus every node the state takes away (an
  // era's, the lava's: the field reads them as no ground — a route over them would be a wall-walk, or a retreat)
  avoidFor(t) {
    const F = this.Kp.field, st = F.state;
    if (st === 0) return this.avoidBase[t];
    const C = this._avS || (this._avS = new Map()), key = t + ':' + st;
    let m = C.get(key);
    if (!m) { m = new Uint8Array(this.N); const b = this.avoidBase[t], ok = F.states[st].okN; for (let i = 0; i < this.N; i++) m[i] = b[i] || !ok[i] ? 1 : 0; C.set(key, m); }
    return m;
  }
  roleOf(a) { return this.roles[a.team].get(a) || 'break'; }
  auxOf(a) { return this.aux.get(a) || 0; }
  restPos() { return this.Kp.phase === 'resetting' ? this.Kp.R.pond : this.Kp.pos; }
  shellC() { const Kp = this.Kp; if (Kp.shell.state !== 'none') return Kp.shell.center(); const p = this.restPos(); return _sc.set(p.x, p.y + K.shell.lift, p.z); }
  // team t's share of the meter (−1 … 1: positive = on t's side)
  side(t) { const S = this.Kp.shell; if (S.state === 'none') return 0; const m = S.meter / (S.hp || 1); return t === 0 ? m : -m; }

  _deal(t) {
    const Kp = this.Kp, H = Kp.holder, prev = this.roles[t], out = new Map();
    const mem = G.actors.filter((a) => a.team === t), up = mem.filter((a) => a.alive), ubots = up.filter(isBot), humans = up.filter((a) => !isBot(a));
    const sit = (this.sit[t] = H ? (H.team === t ? 'ours' : 'theirs') : Kp.phase === 'free' ? 'free' : 'shell');
    const set = (a, r, x = 0) => { out.set(a, r); this.aux.set(a, x); };
    const keep = (a, r) => (prev.get(a) === r ? -3 : 0);
    if (sit === 'shell') {
      const c = this.restPos();
      // the grabber: the bot nearest the shell, no special running (its own Bubble Guard is fine), hp ≥ 60
      const ok = ubots.filter((a) => !busy(a) && a.hp >= 60);
      const g = (ok.length ? ok : ubots).slice().sort((x, y) => hd(x.pos, c) + keep(x, 'grab') - hd(y.pos, c) - keep(y, 'grab'))[0];
      if (g) set(g, 'grab');
      const ch = ubots.filter((a) => a !== g && a.weapon.kind === 'charger').sort((x, y) => keep(x, 'perch') - keep(y, 'perch'))[0];
      if (ch) set(ch, 'perch');
      let i = 0; for (const a of ubots) if (!out.has(a)) set(a, 'break', i++);
    } else if (sit === 'free') {
      const p = Kp.pos;
      const ok = ubots.filter((a) => !busy(a));
      let g = (ok.length ? ok : ubots).slice().sort((x, y) => hd(x.pos, p) - hd(y.pos, p))[0];
      // (a human teammate within 3 m and closer gets it: SPEC §8.3)
      if (g && humans.some((h) => hd(h.pos, p) < 3 && hd(h.pos, p) < hd(g.pos, p))) g = null;
      if (g) set(g, 'grab', 1);
      let i = 0; for (const a of ubots) if (!out.has(a)) set(a, hd(a.pos, p) < 6 ? 'grab' : 'fight', i++);
    } else if (sit === 'ours') {
      if (isBot(H)) set(H, 'carry');
      const pts = { lead: this.ahead(t, 11, _v.set(0, 0, 0)).clone(), flank: H.pos.clone(), anchor: this.ahead(t, -9, _v.set(0, 0, 0)).clone() };
      const want = ['lead', 'flank', 'anchor'];
      // (humans: the role whose spot is nearest them)
      for (const h of humans) { if (h === H || !want.length) continue; const r = want.slice().sort((x, y) => hd(h.pos, pts[x]) - hd(h.pos, pts[y]))[0]; want.splice(want.indexOf(r), 1); }
      const rest = ubots.filter((a) => a !== H);
      for (const r of want) {
        if (!rest.length) break;
        const b = rest.sort((x, y) => hd(x.pos, pts[r]) + keep(x, r) * 2 - hd(y.pos, pts[r]) - keep(y, r) * 2)[0];
        set(b, r, b.slot % 2 ? 1 : -1); rest.splice(rest.indexOf(b), 1);
      }
      for (const a of rest) set(a, 'flank', a.slot % 2 ? 1 : -1);
    } else {
      // they carry: keepers on the objective, interceptors at the carrier, a charger perched over its route
      const df = DF(ubots[0]?.bot), obj = this.defendObj(t), kH = this.foes[t].find((f) => f.e === H);
      const near = !!kH && ((Kp.gateUp[H.team] && Kp.field.fieldAt(H.team, kH.pos)?.d < 25) || (!Kp.lowered[H.team] && Kp.count[H.team] - Kp.capCount(H.team) <= 10));
      let nk = near ? 2 : 1, ni = df.icpt;
      const kp = obj ? obj.pos : G.level.spawnPads[t], cp = kH ? kH.pos : this.restPos();
      // (humans: the role nearest them — a keeper near our objective, an interceptor near the carrier)
      for (const h of humans) { if (hd(h.pos, kp) < hd(h.pos, cp) && nk > 0) nk--; else if (ni > 0) ni--; }
      const rest = ubots.slice();
      const take = (n, r, at, x) => { for (let k = 0; k < n && rest.length; k++) { const b = rest.sort((p, q) => hd(p.pos, at) + keep(p, r) * 2 - hd(q.pos, at) - keep(q, r) * 2)[0]; set(b, r, x(k)); rest.splice(rest.indexOf(b), 1); } };
      take(nk, 'keeper', kp, (k) => k);
      const ch = rest.find((a) => a.weapon.kind === 'charger');
      if (ch && !near) { set(ch, 'perch'); rest.splice(rest.indexOf(ch), 1); }
      take(ni, 'intercept', cp, (k) => (k % 2 ? 1 : -1));
      for (const a of rest) set(a, df.id === 'easy' ? 'keeper' : 'intercept', df.id === 'easy' ? out.size % 2 : (out.size % 2 ? 1 : -1));
    }
    // the dead: a role for when they're back (re-dealt within 0.5 s anyway)
    for (const a of mem) if (isBot(a) && !out.has(a)) set(a, sit === 'shell' ? 'break' : sit === 'free' ? 'fight' : sit === 'ours' ? 'anchor' : 'intercept');
    this.roles[t] = out;
    for (const [a, r] of out) if (a.alive) KARP_BOT.stats.roles[r] = (KARP_BOT.stats.roles[r] || 0) + 0.5;
  }

  // ---------------------------------------------------------------------------------------------- targets, routes
  // the carrier's targets for team t: its standing weirs (each its own target), else its Gate
  targets(t) {
    const Kp = this.Kp, out = [];
    const list = !Kp.lowered[t] && Kp.weirs[t].length ? Kp.weirs[t].map((w) => ({ key: 'w' + w.index, pos: w.pos })) : [{ key: 'g', pos: Kp.gates[t].pos }];
    for (const T of list) { T.node = G.nav.nearest(_v.set(T.pos.x, T.pos.y + 0.3, T.pos.z), 0.9); out.push(T); }
    return out;
  }
  // base + nodes within 2.5 m of route r (except within 6 m of either end)
  _near(base, r, into) {
    const nav = G.nav, m = into || new Uint8Array(this.N);
    if (base !== m) m.set(base);
    const A = nav.nodes[r[0]], B = nav.nodes[r[r.length - 1]];
    for (const id of r) {
      const n = nav.nodes[id];
      if (hd(n, A) < 6 || hd(n, B) < 6) continue;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        const jx = n.ix + dx, jz = n.iz + dz;
        if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const q of nav.cells[jz * nav.nx + jx]) { const o = nav.nodes[q]; if (Math.hypot(o.x - n.x, o.z - n.z) <= 2.5 && Math.abs(o.y - n.y) < 2 && hd(o, A) >= 6 && hd(o, B) >= 6) m[q] = 1; }
      }
    }
    return m;
  }
  _mk(name, ids, T) {
    const nav = G.nav, cum = new Float32Array(ids.length);
    for (let i = 1; i < ids.length; i++) { const a = nav.nodes[ids[i - 1]], b = nav.nodes[ids[i]]; cum[i] = cum[i - 1] + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }
    return { name, ids, cum, len: cum[cum.length - 1] || 0, T };
  }
  // up to 3 candidate routes for team t from node s (SPEC §8.4): the layout's hints when it has any, else per target the
  // shortest no-climb path and the shortest one 2.5 m clear of it (and a third with one target)
  cands(t, s) {
    const nav = G.nav, base = this.avoidFor(t), out = [], TG = this.targets(t), F = this.Kp.field;
    const hints = this.Kp.def.routes || null;
    for (const T of TG) {
      if (T.node < 0) continue;
      const r1 = nav.path(s, T.node, t, undefined, true, base);
      if (!r1) continue;
      const R1 = this._mk(TG.length > 1 ? 'short-' + T.key : 'short', r1, T);
      if (hints) {
        // a hint route: its waypoints still ahead (between here and the target by the field), in order, then the target
        const D = F.D[t], d0 = D[s], dT = D[T.node];
        for (const name in hints) {
          const pts = hints[name].map((p) => (t === 0 ? p : p.length === 3 ? [-p[0], p[1], -p[2]] : [-p[0], -p[1]]));
          let ids = [s], cur = s, ok = true;
          for (const p of pts) {
            const q = nav.nearest(_v.set(p[0], p.length === 3 ? p[1] + 0.3 : this.Kp.pos.y + 2, p[p.length - 1]), p.length === 3 ? 0.9 : 6);
            if (q < 0 || !(D[q] < d0 - 2 && D[q] > dT + 2)) continue;
            const seg = nav.path(cur, q, t, undefined, true, base);
            if (!seg) { ok = false; break; }
            ids = ids.concat(seg.slice(1)); cur = q;
          }
          const last = ok && nav.path(cur, T.node, t, undefined, true, base);
          if (last && ids.length > 1) { ids = ids.concat(last.slice(1)); const R = this._mk(name + (TG.length > 1 ? '-' + T.key : ''), ids, T); if (R.len <= R1.len * 1.8) out.push(R); }
        }
      }
      // (the hints are the routes the stage has: the plain shortest one only when none of them leads to this target)
      if (!hints || !out.some((R) => R.T === T)) out.push(R1);
      if (!hints) {
        const av2 = this._near(base, r1);
        const r2 = nav.path(s, T.node, t, undefined, true, av2);
        if (r2) { const R2 = this._mk(TG.length > 1 ? 'alt-' + T.key : 'alt', r2, T); if (R2.len <= R1.len * 1.7) out.push(R2); }
        if (TG.length === 1 && r2) {
          const r3 = nav.path(s, T.node, t, undefined, true, this._near(av2, r2, av2));
          if (r3) { const R3 = this._mk('alt2', r3, T); if (R3.len <= R1.len * 1.7) out.push(R3); }
        }
      }
    }
    return out.slice(0, 4);
  }
  // where a is on route R: { i, off } (searched round the last index, else over all of it)
  onRoute(R, pos, i0 = -1) {
    const nav = G.nav, n = R.ids.length;
    let bi = 0, bd = Infinity;
    const lo = i0 >= 0 ? Math.max(0, i0 - 12) : 0, hi = i0 >= 0 ? Math.min(n - 1, i0 + 40) : n - 1;
    for (let i = lo; i <= hi; i++) { const q = nav.nodes[R.ids[i]], d = Math.hypot(q.x - pos.x, q.z - pos.z) + Math.abs(q.y - pos.y) * 1.5; if (d < bd) { bd = d; bi = i; } }
    if (i0 >= 0 && bd > 4) return this.onRoute(R, pos, -1);
    return { i: bi, off: bd };
  }
  // the cost of route R from pos for team t (SPEC §8.4): what's left of it + 6 m per known foe within 10 m of its next 25 m
  // + 0.3 × the metres of enemy ink on its next 20 m + the dangers its next 25 m crosses
  routeCost(R, t, pos, C) {
    const nav = G.nav, at = this.onRoute(R, pos), c0 = R.cum[at.i];
    let cost = R.len - c0 + at.off, foes = 0, ink = 0, dz = 0;
    const st = this._st || (this._st = { own: 0, enemy: 0, empty: 0, n: 0 });
    let lastInk = -9;
    for (let i = at.i; i < R.ids.length && R.cum[i] - c0 <= 25; i++) {
      const id = R.ids[i], q = nav.nodes[id];
      if (C) dz += C[id] || 0;
      if (R.cum[i] - c0 <= 20 && R.cum[i] - lastInk >= 2) { lastInk = R.cum[i]; G.paint.regionStats(q.x, q.y, q.z, 1.0, t, st); if (st.n) ink += st.enemy * 2; }
    }
    for (const f of this.foes[t]) {
      if (!f.e.alive) continue;
      for (let i = at.i; i < R.ids.length && R.cum[i] - c0 <= 25; i += 2) { const q = nav.nodes[R.ids[i]]; if (Math.hypot(q.x - f.pos.x, q.z - f.pos.z) < 10 && Math.abs(q.y - f.pos.y) < 4) { foes++; break; } }
    }
    return cost + 6 * foes + 0.3 * ink + 0.15 * dz;
  }
  // (re-)pick team t's route for its carrier H; every `every` s, or now when the threat changed (hard). C: the danger costs
  pickRoute(t, H, every, C, now = false) {
    let RT = this.route[t];
    const s = G.nav.nearest(H.pos, 1.2, true);
    if (s < 0) return RT;
    const tk = this.targets(t).map((T) => T.key).join(',');
    if (!RT || RT.key !== tk || (RT.pick && this.onRoute(RT.pick, H.pos, RT.i).off > 8)) {
      const cands = this.cands(t, s);
      RT = this.route[t] = { cands, pick: null, i: 0, t: -9, key: tk, foes: -1 };
      if (!cands.length) return RT;
    }
    if (!RT.cands.length) return RT;
    const nf = this.foes[t].length;
    if (G.time - RT.t >= every || !RT.pick || (now && nf !== RT.foes)) {
      RT.t = G.time; RT.foes = nf;
      let best = null, bc = Infinity;
      for (const R of RT.cands) { const c = this.routeCost(R, t, H.pos, C) - (R === RT.pick ? 8 : 0); if (c < bc) { bc = c; best = R; } }
      if (best !== RT.pick) { RT.pick = best; KARP_BOT.stats.picks++; KARP_BOT.stats.routes[best.name] = (KARP_BOT.stats.routes[best.name] || 0) + 1; }
    }
    if (RT.pick) RT.i = this.onRoute(RT.pick, H.pos, RT.i).i;
    return RT;
  }
  // the point m metres along team t's carrier route from the carrier (negative: behind it) → into out
  ahead(t, m, out) {
    const H = this.Kp.holder, RT = this.route[t], nav = G.nav;
    if (!H) return out.copy(this.Kp.pos);
    if (RT && RT.pick) {
      const R = RT.pick, c = R.cum[RT.i] + m;
      let j = RT.i;
      if (m >= 0) { while (j < R.ids.length - 1 && R.cum[j] < c) j++; } else { while (j > 0 && R.cum[j] > c) j--; }
      const q = nav.nodes[R.ids[j]];
      out.set(q.x, q.y, q.z);
      if (m < 0 && RT.i === 0) { const T = R.T.pos, dx = H.pos.x - T.x, dz = H.pos.z - T.z, l = Math.hypot(dx, dz) || 1; out.set(H.pos.x + (dx / l) * -m, H.pos.y, H.pos.z + (dz / l) * -m); }
      return out;
    }
    const T = this.targets(t)[0].pos, dx = T.x - H.pos.x, dz = T.z - H.pos.z, l = Math.hypot(dx, dz) || 1, k = clamp(m, -20, l);
    return out.set(H.pos.x + (dx / l) * k, H.pos.y, H.pos.z + (dz / l) * k);
  }
  // the route direction at the carrier (unit xz)
  dirAt(t, out) {
    const H = this.Kp.holder;
    this.ahead(t, 4, out); out.sub(H.pos).setY(0);
    if (out.lengthSq() < 0.01) out.set(0, 0, t === 0 ? 1 : -1);
    return out.normalize();
  }
  // what team t defends while they carry: the weir on the carrier's route (two weirs: the one nearer where it's known
  // to be), or our Gate once it has risen → { key, pos } | null
  defendObj(t) {
    const Kp = this.Kp, H = Kp.holder, e = 1 - t;
    if (Kp.lowered[e] || !Kp.weirs[e].length) return { key: 'g' + e, pos: Kp.gates[e].pos };
    const W = Kp.weirs[e];
    if (W.length === 1) return { key: 'w' + e + '0', pos: W[0].pos };
    const k = H && this.foes[t].find((f) => f.e === H), at = k ? k.pos : this.restPos();
    const w = W.slice().sort((x, y) => hd(x.pos, at) + Math.abs(x.pos.y - at.y) - hd(y.pos, at) - Math.abs(y.pos.y - at.y))[0];
    return { key: 'w' + e + w.index, pos: w.pos };
  }
  // the keepers' hold spots in front of an objective (SPEC §8.5): nav nodes 4–9 m out on the attackers' approach (their
  // field distance to their Gate larger than the objective's), with a line to it and to the approach, in cover
  keepSpots(obj, team) {
    const key = obj.key + ':' + this.Kp.field.state;
    let L = this.keepC.get(key);
    if (L) return L;
    const nav = G.nav, F = this.Kp.field, att = 1 - team, D = F.D[att], o = obj.pos;
    const on = nav.nearest(_v.set(o.x, o.y + 0.3, o.z), 0.9), dO = on >= 0 ? D[on] : Infinity;
    // the approach: a node 10–15 m out on the attackers' side, the nearest to them by the field
    let A = null, ad = Infinity;
    for (const id of nav.validIds) {
      const n = nav.nodes[id], h = hd(n, o);
      if (h < 10 || h > 15 || n.zone >= 0 || !Number.isFinite(D[id]) || D[id] < dO + 7) continue;
      if (D[id] < ad) { ad = D[id]; A = n; }
    }
    const cand = [];
    for (const id of nav.validIds) {
      const n = nav.nodes[id], h = hd(n, o);
      if (h < 4 || h > 9 || n.zone >= 0 || n.wet || Math.abs(n.y - o.y) > 2.5 || !(D[id] > dO + 1)) continue;
      cand.push(n);
    }
    cand.sort(() => Math.random() - 0.5);
    const scored = [];
    const eye = _v2, h0 = new THREE.Vector3();
    for (const n of cand.slice(0, 70)) {
      eye.set(n.x, n.y + 1.3, n.z);
      let sc = -Math.abs(hd(n, o) - 6) * 0.3;
      sc += G.physics.los(eye, _v3.set(o.x, o.y + 1.0, o.z)) ? 3 : -6;
      if (A) sc += G.physics.los(eye, _v3.set(A.x, A.y + 1.0, A.z)) ? 2 : 0;
      let cov = 0;
      for (let k = 0; k < 4; k++) { const ang = (k / 4) * Math.PI * 2; if (!G.physics.los(h0.set(n.x, n.y + 0.9, n.z), _v3.set(n.x + Math.cos(ang) * 1.6, n.y + 0.9, n.z + Math.sin(ang) * 1.6))) cov++; }
      sc += Math.min(2, cov) * 0.8 - (cov >= 3 ? 1.5 : 0);
      scored.push({ n, sc });
    }
    scored.sort((x, y) => y.sc - x.sc);
    L = { spots: [], A };
    for (const s of scored) { if (L.spots.every((q) => hd(q, s.n) > 3)) L.spots.push(s.n); if (L.spots.length >= 3) break; }
    if (!L.spots.length && on >= 0) L.spots.push(nav.nodes[on]);
    this.keepC.set(key, L);
    return L;
  }
  // a stand spot for a breaker: a nav node want m from the shell on our side, spread by slot, with a line from a kid's eyes
  // to the shell's centre (none with a line → the nearest at all)
  breakSpot(a, want, slot) {
    const c = this.restPos(), pad = G.level.spawnPads[a.team], sc = this.shellC();
    const base = Math.atan2(pad.x - c.x, pad.z - c.z), ang = base + ((slot % 4) - 1.5) * 0.55;
    const eye = _v2;
    let any = null;
    const R = Math.max(1.6, this.Kp.shell.radius());
    const rs = want < 4.5 ? [want, want + 0.4, want + 0.8] : [want, want + 1, want - 0.7, want + 2.5, want + 4.5];   // (close in: it must stay in reach)
    for (const da of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.1, -2.1, Math.PI]) for (const r of rs) {
      if (r < R + PLAYER.radius + 0.3) continue;
      _v.set(c.x + Math.sin(ang + da) * r, c.y + 0.5, c.z + Math.cos(ang + da) * r);
      const id = G.nav.nearest(_v, 1.2);
      if (id < 0) continue;
      const n = G.nav.nodes[id];
      if (n.zone >= 0 || Math.hypot(n.x - c.x, n.z - c.z) <= R + 0.6 || Math.abs(n.y - c.y) > 3) continue;
      any = any || n;
      if (G.physics.los(eye.set(n.x, n.y + 1.1, n.z), sc)) return n;
    }
    return any;
  }
}

// ================================================================================================ per bot
export function karpSync(b, P) {
  const r = P.roleOf(b.a);
  if (r !== b.kRole) { b.kRole = r; b.goalTimer = 0; b.repath = 0; b.kGoalAt = 0; b.kSpot = null; b.kExp = null; }
}
const meleeOf = (a) => MELEE.has(a.weapon.kind);
// take the fight? (else the objective first)
export function karpEngage(b, P) {
  const a = b.a, t = b.tv;
  if (!t) return false;
  const d = Math.hypot(t.pos.x - a.pos.x, t.pos.z - a.pos.z), Kp = P.Kp, role = b.kRole, rng = b._range();
  if (a.carry) return d < 22;
  if (!KARP_AI.enabled) return d < rng * 1.1 || hd(t.pos, Kp.pos) < 12;
  const H = Kp.holder;
  const sit = P.sit[a.team];
  switch (role) {
    case 'grab':
      if (sit === 'free') return a.hp < 40 && d < 10;   // (hurt with a foe close: that one first, §8.3)
      if (sit === 'shell') return d < Math.min(6, rng);   // (the shell first: only a foe right on it)
      break;
    case 'break':
      // the shell first (first pop 6–12 s): a foe in close range, or one inside the ring (on the shell)
      if (sit === 'shell') return d < Math.min(rng * 0.75, 10) || (hd(t.pos, P.restPos()) < KARP_AI.ring[0] && d < rng * 1.1);
      break;
    case 'intercept': return (H && t.actor === H) || t === H || d < rng * 1.1;
    case 'keeper': { const s = b.kSpot; return d < rng * 1.15 || (!!s && hd(t.pos, s) < 10); }
    case 'lead': case 'flank': case 'anchor': return !!H && (hd(t.pos, H.pos) < KARP_AI.escortR || d < rng * 1.1);
  }
  return d < rng * 1.1 || hd(t.pos, P.restPos()) < 12;
}

// the navigation goal (paint mode), by role
export function karpGoal(b, P) {
  const a = b.a, Kp = P.Kp, role = b.kRole, now = G.time;
  if (!KARP_AI.enabled) return minimalGoal(b, P);
  if (role === 'carry' && a.carry) return carryGoal(b, P);
  // holding its spot on purpose (a keeper, a breaker at the ring, a perch, an escort at its slot): karp-match's stuck
  // metric leaves it out, as match.cjs does a zone guard
  if (b.kSpot && hd(a.pos, b.kSpot) < 1.5 && (!b.path || b.pi >= b.path.length)) b.kHoldUntil = now + 0.3;
  // (due: its time is up, or the route ran out short of the spot — standing on it is no reason to re-plan)
  const due = now >= (b.kGoalAt || 0) || (!b.path && (!b.kSpot || hd(a.pos, b.kSpot) > 1.2));
  const go = (p, maxUp = 1.0, every = 1.5) => {
    // (a fresh route when due, or the spot moved > 2.5 m from where the route goes)
    const g = b.path && b.goal >= 0 ? G.nav.nodes[b.goal] : null;
    if (!due && g && hd(g, p) < 2.5) return;
    b.kGoalAt = now + every; b.kSpot = b.kSpot || new V3(); b.kSpot.copy(p);
    if (hd(a.pos, p) < 0.8 && Math.abs(a.pos.y - p.y) < 1) { b.path = null; return; }
    b._pathTo(p, maxUp);
  };
  const sit = P.sit[a.team];
  if (sit === 'shell') {
    // (the spot costs sight lines: worked out only when due, or when what it depends on changed)
    const key = shellKey(b, P, role);
    if (key !== b.kKey) { b.kKey = key; b.kGoalAt = 0; }
    if (!due) return;
    const n = shellSpot(b, P, role);
    if (n) go(n, 0.6, 1.5); else go(P.restPos(), 1.0, 1.5);
    return;
  }
  if (sit === 'free') {
    if (role === 'grab') { if (grabWait(b, P) > 0) { b.path = null; return; } go(Kp.pos, 1.2, 0.4); return; }
    // fight round it: 4–7 m out toward their side
    const pad = G.level.spawnPads[1 - a.team], ang = Math.atan2(pad.x - Kp.pos.x, pad.z - Kp.pos.z) + ((P.auxOf(a) % 3) - 1) * 0.8;
    const id = G.nav.nearest(_v.set(Kp.pos.x + Math.sin(ang) * 5.5, Kp.pos.y + 0.5, Kp.pos.z + Math.cos(ang) * 5.5), 1.2);
    go(id >= 0 ? G.nav.nodes[id] : Kp.pos, 1.0, 1.2);
    return;
  }
  const H = Kp.holder;
  if (sit === 'ours' && H) {
    const t = a.team;
    if (role === 'lead') { go(P.ahead(t, 11, _e), 1.0, 0.8); return; }
    if (role === 'anchor') { go(P.ahead(t, -9, _e), 1.0, 1.0); return; }
    // flank: beside it, on the side the known threat is (else its own side)
    const d = P.dirAt(t, _q), px = -d.z, pz = d.x;
    let sx = 0, sz = 0, n = 0;
    for (const f of P.foes[t]) if (hd(f.pos, H.pos) < 25) { sx += f.pos.x - H.pos.x; sz += f.pos.z - H.pos.z; n++; }
    const sg = n ? (sx * px + sz * pz >= 0 ? 1 : -1) : P.auxOf(a) || 1;
    const id = G.nav.nearest(_e.set(H.pos.x + px * sg * 5 + d.x * 2, H.pos.y + 0.5, H.pos.z + pz * sg * 5 + d.z * 2), 1.5);
    go(id >= 0 ? G.nav.nodes[id] : H.pos, 1.0, 0.8);
    return;
  }
  if (sit === 'theirs' && H) {
    if (role === 'keeper') {
      const obj = P.defendObj(a.team), L = obj && P.keepSpots(obj, a.team), s = L && L.spots[Math.min(L.spots.length - 1, P.auxOf(a))];
      if (s) { go(s, 1.0, 2); if (hd(a.pos, s) < 2) KARP_BOT.stats.keeperT += 1 / 60; }
      return;
    }
    if (role === 'perch') { const n = perchSpot(b, P); if (n) go(n, 1.0, 3); return; }
    // intercept: at the carrier while it's known (from outside its Splash range; hard: from two sides), else its last
    // known spot, then along the route it's expected to take
    const k = P.foes[a.team].find((f) => f.e === H);
    if (k && (k.seen || G.time - k.t < 1.5)) {
      b.kLast = (b.kLast || new V3()).copy(k.pos); b.kExp = null;
      const dx = a.pos.x - k.pos.x, dz = a.pos.z - k.pos.z, l = Math.hypot(dx, dz) || 1, df = DF(b);
      let ang = Math.atan2(dx, dz);
      if (df.sides) ang += P.auxOf(a) * 0.9;
      const r = meleeOf(a) ? 0 : 7.5;
      const id = r > 0 && l > r ? G.nav.nearest(_e.set(k.pos.x + Math.sin(ang) * r, k.pos.y + 0.5, k.pos.z + Math.cos(ang) * r), 1.5) : -1;
      go(id >= 0 ? G.nav.nodes[id] : k.pos, 1.0, 0.6);
      KARP_BOT.stats.icptT += 1 / 60;
      return;
    }
    if (b.kLast) {
      if (!b.kExp) {
        const s = G.nav.nearest(b.kLast, 1.5), T = P.targets(H.team)[0];
        b.kExp = s >= 0 && T.node >= 0 ? G.nav.path(s, T.node, H.team, undefined, true, P.avoidFor(H.team)) : null;
        b.kExpI = 0;
      }
      if (b.kExp && b.kExp.length > 1) {
        // walk the expected route forward from the last known spot, 8 m at a time
        const q = G.nav.nodes[b.kExp[Math.min(b.kExp.length - 1, b.kExpI)]];
        if (hd(a.pos, q) < 3 && b.kExpI < b.kExp.length - 1) b.kExpI = Math.min(b.kExp.length - 1, b.kExpI + 8);
        go(G.nav.nodes[b.kExp[Math.min(b.kExp.length - 1, b.kExpI)]], 1.0, 1.0);
        return;
      }
      go(b.kLast, 1.0, 1.0);
      return;
    }
    const obj = P.defendObj(a.team);
    go(obj ? obj.pos : P.restPos(), 1.0, 2);
  }
}
// what a breaker's spot depends on (a change re-picks it at once)
function shellKey(b, P, role) {
  const t = b.a.team, our = P.side(t), df = DF(b), c = P.restPos();
  return `${role}|${our >= KARP_AI.grabAt ? 1 : 0}|${-our >= KARP_AI.meleeOut ? 1 : 0}|${df.danger != null && -our >= df.danger ? 1 : 0}|${c.x.toFixed(0)},${c.z.toFixed(0)}`;
}
// the shell phase's stand spot by role → a nav node
function shellSpot(b, P, role) {
  const a = b.a, t = a.team, our = P.side(t), their = -our, df = DF(b), R = P.Kp.shell.radius() || K.shell.r;
  const danger = df.danger != null && their >= df.danger;
  if (role === 'perch') return perchSpot(b, P);
  let want, slot = P.auxOf(a);
  if (role === 'grab' && our >= KARP_AI.grabAt) { want = KARP_AI.grabR; slot = 1.5; }
  else if (meleeOf(a)) want = their >= KARP_AI.meleeOut || danger ? 7 : Math.max(2.5, R + PLAYER.radius + 0.5) + 0.2;
  else want = 7;
  if (danger) want = Math.max(want, KARP_AI.dangerR + 0.7);
  if (role === 'grab' && slot !== 1.5) slot = 1.5 + (meleeOf(a) ? 0 : 1);
  return P.breakSpot(a, want, slot);
}
// a perch: high ground with a line over the shell (shell phase) or the enemy carrier / its route (they carry)
function perchSpot(b, P) {
  const a = b.a, now = G.time;
  if (b.kPerch && now < b.kPerchT) return b.kPerch;
  const H = P.Kp.holder, k = H && H.team !== a.team ? P.foes[a.team].find((f) => f.e === H) : null;
  const at = k ? k.pos : H ? P.ahead(H.team, 10, _e) : P.shellC();
  const nav = G.nav;
  let best = null, bs = -Infinity;
  for (let i = 0; i < 40; i++) {
    const id = nav.validIds[(Math.random() * nav.validIds.length) | 0], n = nav.nodes[id], d = hd(n, at);
    if (n.zone >= 0 || n.wet || d < 10 || d > 22) continue;
    const ownSide = Math.hypot(n.x - G.level.spawnPads[a.team].x, n.z - G.level.spawnPads[a.team].z) < Math.hypot(at.x - G.level.spawnPads[a.team].x, at.z - G.level.spawnPads[a.team].z) + 4;
    let sc = clamp(n.y - at.y, -1, 4) * 1.2 - Math.abs(d - 15) * 0.15 - hd(n, a.pos) * 0.04 + (ownSide ? 1.5 : -2);
    if (sc <= bs) continue;
    if (!G.physics.los(_v.set(n.x, n.y + 1.3, n.z), _v2.set(at.x, at.y + 1.0, at.z))) continue;
    bs = sc; best = n;
  }
  b.kPerch = best || b.kPerch; b.kPerchT = now + (best ? 6 : 1.5);
  return b.kPerch;
}
// the grabber's wait after a burst (s left before it starts its run in), so that it gets there as the hold (+ its
// difficulty's grab delay) ends: start = hold + delay − the run's time
function grabWait(b, P) {
  const a = b.a, Kp = P.Kp;
  if (Kp.phase !== 'free' || P.burstT < 0) return 0;
  // (the run: swimming in through the burst's ink when it was ours — 3.5 m of it round the Bazookarp — else on foot;
  // + getting up to speed, and a little early rather than late)
  const d = Math.max(0, hd(a.pos, Kp.pos) - K.pickR + 0.25), swim = P.burstTeam === a.team && d < K.shell.burstPaint;
  const run = swim ? 0.12 + d / 10 : 0.2 + d / Math.max(3, Math.min(PLAYER.runSpeed, a.weaponRunner.moveSpeed?.() || PLAYER.runSpeed) * 0.92);
  return P.burstT + K.pickHold + DF(b).grab - run - 0.05 - G.time;
}
// in a fight: the carrier keeps walking its route; keepers hold their spot; escorts stay with the carrier; interceptors
// chase the carrier
export function karpFightNav(b, P) {
  const a = b.a, role = b.kRole, H = P.Kp.holder;
  if (a.carry) { karpGoal(b, P); return true; }
  if (!KARP_AI.enabled) { if (b.kRole === 'grab') { karpGoal(b, P); return true; } return false; }
  if (role === 'grab' && P.sit[a.team] === 'free' && !(a.hp < 40)) { karpGoal(b, P); return true; }
  if (role === 'keeper') { const s = b.kSpot; if (s && hd(a.pos, s) > 3 && hd(b.tv.pos, s) > 6) { karpGoal(b, P); return true; } if (s) { b.path = null; b.repath = 0.3; return true; } return false; }
  if ((role === 'lead' || role === 'flank' || role === 'anchor') && H) {
    if (hd(b.tv.pos, H.pos) > KARP_AI.escortR || hd(a.pos, H.pos) > 18) { karpGoal(b, P); return true; }
    return false;
  }
  return false;
}

// ================================================================================================ the carrier
// the arc solver: the aim pitch that lobs a Carp Shot of charge c from the muzzle to a point d m out, dy above the feet
function lobPitch(c, d, dy) {
  const s = speedOf(c), g = K.gun.gravity, y0 = K.gun.muzzleUp - dy;
  let best = null, be = Infinity;
  for (let p = -0.7; p <= 0.8; p += 0.02) {
    const th = p + (K.gun.lob * Math.PI) / 180, vx = Math.cos(th) * s, vy = Math.sin(th) * s;
    const disc = vy * vy + 2 * g * y0;
    if (disc < 0) continue;
    const t = (vy + Math.sqrt(disc)) / g, x = vx * t;
    const e = Math.abs(x - (d - K.gun.muzzleFwd));
    if (e < be) { be = e; best = p; }
  }
  return be < 2.5 ? best : null;
}
const flightT = (c, d, p) => d / Math.max(1, speedOf(c) * Math.cos(p + (K.gun.lob * Math.PI) / 180));
// the carrier's route and goal (paint and fight alike)
function carryGoal(b, P) {
  const a = b.a, t = a.team, df = DF(b), now = G.time;
  const RT = P.pickRoute(t, a, df.repick, b.sp.cost(), !!df.threat);
  const R = RT && RT.pick;
  let goal = R ? R.T.pos : P.targets(t)[0].pos;
  // the fuse can't make it at this pace: over the halfway line first, so the blast drops it forward (§8.4)
  const J = a.carry.j, F = P.Kp.field;
  if (R && J && J.half === t && P.Kp.fuse * PLAYER.runSpeed * K.speedMul * 0.85 < R.len - R.cum[RT.i]) {
    for (let i = RT.i; i < R.ids.length; i++) { const id = R.ids[i]; if (F.D[1 - t][id] - F.D[t][id] >= 4) { const q = G.nav.nodes[id]; goal = _e.set(q.x, q.y, q.z); b.kHalf = true; break; } }
  } else b.kHalf = false;
  const g = b.path && b.goal >= 0 ? G.nav.nodes[b.goal] : null;
  const changed = !g || hd(g, goal) > 2 || (R && b.kPick !== R);
  if (changed || now >= (b.kGoalAt || 0) || !b.path || b.pi >= b.path.length) {
    b.kGoalAt = now + 1.0; b.kPick = R;
    b._pathTo(goal, 0.6);
  }
}
// known foes for the carrier's own decisions: in sight, or seen in the last 1.5 s → [{ e, pos, d, seen }]
function knownFoes(b) {
  const a = b.a, out = b._kf || (b._kf = []), now = G.time;
  out.length = 0;
  for (const [e, k] of b.sight.mem) {
    if (!e.alive || !(k.seen || now - k.t < 1.5)) continue;
    const p = k.seen ? e.pos : k.guess;
    out.push({ e, pos: p, d: Math.hypot(p.x - a.pos.x, p.z - a.pos.z), seen: k.seen, vel: k.seen ? e.vel : null });
  }
  return out.sort((x, y) => x.d - y.d);
}
// a carrier's trigger and aim (the only writer of it.fire while carrying, SPEC §8.4's table) → { yaw, pitch, dist } | null
export function karpCarrierAct(b, P, { dt, it, move }) {
  const a = b.a, C = a.carry, g = C?.gun, df = DF(b);
  it.sub = false; it.special = false; it.jump = false;
  if (!KARP_AI.enabled) return minimalAct(b, P, it);
  const S = b.kc || (b.kc = { back: 0, backX: 0, backZ: 0, push: 0, cd: 0, want: -1, kind: null, yaw: 0, pitch: 0, dist: 6 });
  S.back -= dt; S.cd -= dt;
  const foes = knownFoes(b), Kp = P.Kp, t = a.team;
  const near = (r) => foes.filter((f) => f.d < r);
  const charging = !!(g && (g.charging || g.tap));
  const aimed = (yaw, pitch, tol = 0.12) => Math.abs(angleDiff(b.aimYaw, yaw)) < tol && Math.abs(b.aimPitch - pitch) < 0.12;
  // hold a charge to want, then let go (a tap for a Splash); the shot only once aimed
  const shoot = (want, yaw, pitch, dist, kind) => {
    S.yaw = yaw; S.pitch = pitch; S.dist = dist; S.kind = kind;
    if (charging) { it.fire = !(g.c >= want - 1e-3 && aimed(yaw, pitch)) || g.tap; }
    else if ((!g || g.cd <= 0) && aimed(yaw, pitch, want > 0 ? 0.12 : 0.2) && (b.react <= 0.05 || (kind !== 'foe' && kind !== 'splash'))) { it.fire = true; KARP_BOT.stats.carrierShots++; if (kind === 'push') KARP_BOT.stats.push++; if (kind === 'splash') KARP_BOT.stats.splashes++; if (kind === 'ink') KARP_BOT.stats.routeInk++; if (kind === 'dodge') KARP_BOT.stats.dodges++; }
    if (want <= 0 && charging && !g.tap && g.held > 0.05) it.fire = false;   // (a Splash: let go at once)
    it.squid = false;
    return { yaw, pitch, dist };
  };
  // the route ahead (for the push and the ink)
  const RT = P.route[t], R = RT && RT.pick;
  const toGoal = R ? R.len - R.cum[RT.i] : 99;
  const T = R ? R.T.pos : P.targets(t)[0].pos;
  // 1. a weir or the Gate within 4 m: walk in, no shots
  if (hd(a.pos, T) < 4 && Math.abs(a.pos.y - T.y) < 1.5) { it.fire = false; it.squid = false; return null; }
  // the way it's going (for a shot backwards)
  let mx = move.x, mz = move.z;
  if (Math.hypot(mx, mz) < 0.1) { _v.set(T.x - a.pos.x, 0, T.z - a.pos.z); mx = _v.x; mz = _v.z; }
  const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  const back = Math.atan2(-mx, -mz);
  const inEnemy = b.groundSeen === 2;
  // 2. the knockback push: Splash shots backwards, as fast as allowed — stuck in enemy ink with a foe close, or the fuse
  // short and the target near (normal and hard; never easy)
  if (df.push >= 1 && ((inEnemy && near(10).length) || (Kp.fuse / Math.max(1, Kp.rate) < 6 && toGoal <= 12)) && S.back <= 0) {
    return shoot(0, back, -0.35, 4, 'push');
  }
  // hard: a Splash at the focus, kicked out of it (hit just now with two of them on it)
  if (df.push >= 2 && a.lastDamage < 0.3 && near(12).length >= 2 && S.cd <= 0 && !charging) {
    const f = near(12)[0], yaw = Math.atan2(f.pos.x - a.pos.x, f.pos.z - a.pos.z);
    S.cd = 1.0;
    return shoot(0, yaw, -0.1, f.d, 'dodge');
  }
  // 3. a known foe within 6 m: a Splash at its feet, then step back out of the swell
  const close = near(6)[0];
  if (close) {
    const pitch = lobPitch(0, Math.max(2.5, close.d), close.pos.y - a.pos.y) ?? -0.5, yaw = Math.atan2(close.pos.x - a.pos.x, close.pos.z - a.pos.z);
    const r = shoot(0, yaw, pitch, close.d, 'splash');
    if (it.fire && !charging) { S.back = 0.6; S.backX = -Math.sin(yaw); S.backZ = -Math.cos(yaw); }
    return r;
  }
  if (S.back > 0) { move.set(S.backX, 0, S.backZ); it.squid = false; }
  // (just picked up, in our ink — the burst's — with foes round the shell: under the ink and away first, hidden, at
  // swim speed; the escorts take the fight)
  const justGot = Kp.clock - (C.since ?? -9) < 1.8 && b.groundSeen === 1 && S.back <= 0;
  if (justGot) { if (charging) it.fire = false; it.squid = b._pathRemaining() > 2; return null; }
  // 4. a known foe 6–22 m out: charge (full unless another is close, then a Burst) and lob it at where it is (easy: only
  // with a line on it, always full; hard: leads a moving one)
  const tgt = foes.find((f) => f.d >= 6 && f.d < 22 && (f.seen || df.lob));
  if (tgt) {
    const want = df.full ? 1 : near(6).length ? 0.5 : 1;
    let px = tgt.pos.x, pz = tgt.pos.z;
    let pitch = lobPitch(want, tgt.d, tgt.pos.y - a.pos.y);
    if (pitch !== null && df.lead && tgt.vel) { const ft = flightT(want, tgt.d, pitch) + K.gun.swell * 0.5; px += tgt.vel.x * ft; pz += tgt.vel.z * ft; pitch = lobPitch(want, Math.hypot(px - a.pos.x, pz - a.pos.z), tgt.pos.y - a.pos.y) ?? pitch; }
    if (pitch !== null) return shoot(want, Math.atan2(px - a.pos.x, pz - a.pos.z), pitch, tgt.d, 'foe');
  }
  // 5. a Waddle Bomb / Torpedo coming at it within 8 m: a Splash at it (the gate skips _threatCtl)
  const thr = b._kThr || (b._kThr = []); thr.length = 0;
  for (const k of ['waddle', 'torpedo']) SUB_KITS[k]?.threats?.(thr);
  for (const d of thr) {
    if (!d.live || d.team === t || d.state === 'fly') continue;
    const dd = hd(d.pos, a.pos);
    if (dd > 8 || dd < 1.5) continue;
    const pitch = lobPitch(0, dd, d.pos.y - a.pos.y);
    if (pitch !== null) return shoot(0, Math.atan2(d.pos.x - a.pos.x, d.pos.z - a.pos.z), pitch, dd, 'splash');
  }
  // 6. enemy ink on the next 10 m of the route and nobody known within 15 m: a full charge onto the route 12–18 m ahead
  // (big ink to swim in)
  if (R && !near(15).length) {
    const st = b._kst || (b._kst = { own: 0, enemy: 0, empty: 0, n: 0 });
    let bad = 0;
    for (let i = RT.i; i < R.ids.length && R.cum[i] - R.cum[RT.i] <= 10; i += 2) { const q = G.nav.nodes[R.ids[i]]; G.paint.regionStats(q.x, q.y, q.z, 0.8, b.inkTeam, st); if (st.n && st.enemy > 0.4) bad++; }
    if (bad >= 2 || charging) {
      const p = P.ahead(t, 15, _e), d = hd(p, a.pos);
      const pitch = d > 8 ? lobPitch(1, d, p.y - a.pos.y) : null;
      if (pitch !== null) return shoot(1, Math.atan2(p.x - a.pos.x, p.z - a.pos.z), pitch, d, 'ink');
    }
  }
  if (charging) it.fire = false;   // (let a stray charge go)
  // travel: swim through our own ink when nobody's known within 12 m (the marker hides); never a squid in theirs
  it.squid = b.groundSeen === 1 && !near(12).length && b._pathRemaining() > 3 && S.back <= 0;
  return null;
}

// ================================================================================================ breakers, footwork
// a breaker with nothing better to shoot: the shell → { yaw, pitch, dist } | null
export function karpAim(b, P, dt, it) {
  const a = b.a, Kp = P.Kp;
  if (Kp.shell.state !== 'intact' || a.carry) return null;
  const c = Kp.shell.center(), d = Math.hypot(c.x - a.pos.x, c.z - a.pos.z), w = a.weapon;
  const melee = meleeOf(a);
  if (d > (melee ? 4.5 : Math.min(b._range() * 1.05, 18))) return null;
  // (the grabber closing to its 3.0–3.2 m at ≥ 85 % of ours: in position first — a charge weapon walks slowly while it charges)
  if (b.kRole === 'grab' && P.side(a.team) >= KARP_AI.grabAt && d > KARP_AI.grabR + 0.35) return null;
  _v.set(a.pos.x, a.pos.y + 1.1, a.pos.z);
  if (!G.physics.los(_v, c)) return null;
  const yaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z), pitch = clamp(Math.atan2(c.y - (a.pos.y + 1.1), Math.max(0.5, d)), -0.9, 0.9);
  const wr = a.weaponRunner, off = Math.abs(angleDiff(b.aimYaw, yaw));
  if (a.ink < 3) return { yaw, pitch, dist: d };
  if (w.kind === 'charger' || w.kind === 'bow') it.fire = !(wr.charging && wr.charge >= 0.85) && off < 0.25;
  else if (w.kind === 'spinner' || w.kind === 'splatling') it.fire = wr.burstT <= 0 && !wr.streaming && !(wr.charging && wr.charge >= 0.7) && off < 0.3;
  else it.fire = off < 0.3;
  it.squid = false;
  b.kBreaking = G.time;
  KARP_BOT.stats.breakT += dt;
  return { yaw, pitch, dist: d };
}
// every bot's footwork round the Bazookarp, after the danger escape (bots.js, before _tail): never into the shell (a
// sting is 20 hp); a breaker at its spot strafes; the grabber holds 3.0–3.2 m out, then runs in after the burst; the
// carrier steps back after a Splash
export function karpMove(b, P, dt, move, it) {
  const a = b.a, Kp = P.Kp;
  if (!KARP_AI.enabled || a.carry || !a.alive) return;
  const sit = P.sit[a.team], esc = !!b.sp.esc;
  if (!esc && b.kRole === 'grab' && sit === 'free') {
    // the run in: straight at it once its time comes (wait first, standing)
    if (grabWait(b, P) > 0) { move.set(0, 0, 0); it.squid = false; b.kHoldUntil = G.time + 0.3; return; }
    const dx = Kp.pos.x - a.pos.x, dz = Kp.pos.z - a.pos.z, l = Math.hypot(dx, dz);
    if (l < 4 && Math.abs(Kp.pos.y - a.pos.y) < 1.2) { move.set(dx / (l || 1), 0, dz / (l || 1)); it.fire = false; it.squid = P.burstTeam === a.team && l < K.shell.burstPaint + 0.3 && b.groundSeen !== 2; }   // (in through our burst's ink as a squid)
    return;
  }
  const S = Kp.shell;
  if (S.state === 'none') return;
  const c = S.center(), R = S.radius() + 0.08;
  const dx = a.pos.x - c.x, dz = a.pos.z - c.z, h = Math.hypot(dx, dz) || 1e-3, nx = dx / h, nz = dz / h;
  if (!esc && sit === 'shell' && Math.abs(a.pos.y - Kp.pos.y) < 1.5) {
    if (b.kRole === 'grab' && P.side(a.team) >= KARP_AI.grabAt && h < 5) {
      // hold 3.0–3.2 m out (the exact ring: the nav spot is up to half a metre off)
      const e = h - KARP_AI.grabR, k = Math.sign(e) * clamp(Math.abs(e) * 1.5, 0.18, 0.75);   // (gently: a run in overshoots into touch range)
      if (Math.abs(e) > 0.08 && !(b.mode === 'fight' && b.seeTimer > 0)) move.set(-nx * k, 0, -nz * k); else if (Math.abs(e) <= 0.08) move.set(0, 0, 0);
      b.kHoldUntil = G.time + 0.3; b.moveAcc = 0; b.noProg = 0; it.squid = false;   // (holding on purpose: not the stuck watchdog's business; a kid — a squid in its own splash slid off the ring)
    } else if ((b.kRole === 'break' || b.kRole === 'grab') && !(b.kRole === 'grab' && P.side(a.team) >= KARP_AI.grabAt) && G.time - (b.kBreaking || -9) < 0.2 && !(b.mode === 'fight' && b.seeTimer > 0) && h > KARP_AI.ring[0] && b.kSpot && hd(a.pos, b.kSpot) < 1.5) {
      // strafe round the ring a little while it shoots
      if ((b.kStrafeT = (b.kStrafeT || 0) - dt) <= 0) { b.kStrafeT = 0.8 + Math.random() * 0.7; b.kStrafe = Math.random() < 0.5 ? -1 : 1; }
      const rr = clamp(((KARP_AI.ring[0] + KARP_AI.ring[1]) / 2 - h) * 0.3, -0.5, 0.5);
      move.set(-nz * b.kStrafe * 0.55 + nx * rr, 0, nx * b.kStrafe * 0.55 + nz * rr);
      if (b._nearWater?.(a, 1.2)) move.set(0, 0, 0);
    }
  }
  // the shell guard: never a step into touch range (the body's closest point to its centre within r + 0.38 + margin)
  const by = clamp(c.y, a.pos.y + 0.3, a.pos.y + 1.2), d3 = Math.hypot(h, by - c.y), reach = R + PLAYER.radius;
  if (d3 < reach + 0.6) {
    const inward = -(move.x * nx + move.z * nz), vin = -(a.vel.x * nx + a.vel.z * nz);
    if (d3 < reach + 0.15) move.set(nx, 0, nz);
    else if (inward > 0 && d3 < reach + 0.35) { move.x += inward * nx; move.z += inward * nz; }
    // (still coming in fast — momentum would carry it into range: lean out)
    if (d3 < reach + 0.6 && vin > 2) { move.x += nx * 0.6; move.z += nz * 0.6; }
  }
}
// the route / approach a lead escort or a keeper inks (paint mode) → { x, y, z, d } | null
export function karpPaintAim(b, P, dt) {
  const a = b.a, role = b.kRole;
  if (!KARP_AI.enabled || a.carry || MELEE.has(a.weapon.kind)) return null;
  if ((b.kPaintT = (b.kPaintT || 0) - dt) > 0) return b.kPaintAim;
  b.kPaintT = 0.4;
  b.kPaintAim = null;
  const reach = clamp(b._range() * 0.6, 3, 9), st = b._kst || (b._kst = { own: 0, enemy: 0, empty: 0, n: 0 });
  let pts = null;
  if (role === 'lead' && P.Kp.holder) { pts = []; for (const m of [4, 7, 10, 13, 16]) pts.push(P.ahead(a.team, m, new V3())); }
  else if (role === 'keeper' && P.sit[a.team] === 'theirs') {
    const obj = P.defendObj(a.team), L = obj && P.keepSpots(obj, a.team);
    if (L && L.A) { pts = []; for (const k of [0.2, 0.4, 0.6, 0.8, 1.0]) pts.push(new V3().lerpVectors(obj.pos, L.A, k)); }
  }
  if (!pts) return null;
  let best = null, bv = 0.25;
  for (const p of pts) {
    const d = hd(p, a.pos);
    if (d > reach + 1.5 || d < 1.5) continue;
    G.paint.regionStats(p.x, p.y, p.z, 1.4, b.inkTeam, st);
    if (!st.n) continue;
    const v = st.empty + st.enemy * 1.5;
    if (v > bv && G.physics.los(_v.set(a.pos.x, a.pos.y + 1.1, a.pos.z), _v2.set(p.x, p.y + 0.4, p.z))) { bv = v; best = p; }
  }
  if (best) b.kPaintAim = { x: best.x, y: best.y, z: best.z, d: hd(best, a.pos) };
  return b.kPaintAim;
}

// ================================================================================================ specials, jumps, shields
// when to fire the special (SPEC §8.6) → true / false / null (the usual rules)
export function karpSpecial(b, P, fighting, dist, vis) {
  const a = b.a, role = b.kRole, id = spKind(a), H = P.Kp.holder;
  if (!KARP_AI.enabled || a.carry || !a.specialReady()) return null;
  // breakers: a bomb-type special onto the shell once our side is ≥ 40 %
  if ((role === 'break' || role === 'grab' || role === 'perch') && P.sit[a.team] === 'shell' && P.Kp.shell.state === 'intact' && SHELL_SP.has(id)) {
    const d = hd(a.pos, P.Kp.shell.center());
    if (P.side(a.team) >= 0.4 && (id === 'strike' ? d < 40 : d < 14)) { KARP_BOT.stats.specials++; return true; }
    return false;   // (saved for the shell)
  }
  if (H && H.team === a.team && (role === 'lead' || role === 'flank' || role === 'anchor')) {
    // escorts clear the carrier's way when it's threatened; a Bubble Guard goes to the carrier (sprules' pass-on)
    const thr = P.foes[a.team].some((f) => hd(f.pos, H.pos) < 15);
    if (!thr) return false;
    if (id === 'bubbler') { if (hd(a.pos, H.pos) < 5) { KARP_BOT.stats.specials++; return true; } return false; }
    return null;
  }
  if (H && H.team !== a.team && role === 'intercept') {
    // at the known carrier
    const k = P.foes[a.team].find((f) => f.e === H);
    if (!k) return false;
    if (id === 'strike' && hd(k.pos, a.pos) < 40) { KARP_BOT.stats.specials++; return true; }
    return null;
  }
  return null;
}
// a Vortex Strike's landing point in a Bazookarp match: the known enemy carrier, else the shell (ours to break) → V3 | null
export function karpStrikeAt(b) {
  const P = karpPlan(); if (!P) return null;
  const a = b.a, H = P.Kp.holder;
  if (H && H.team !== a.team) { const k = P.foes[a.team].find((f) => f.e === H); if (k) return k.pos; }
  if (P.Kp.shell.state !== 'none') { const c = P.restPos(), d = G.level.spawnPads[1 - a.team], dx = d.x - c.x, dz = d.z - c.z, l = Math.hypot(dx, dz) || 1; return _e.set(c.x + (dx / l) * 2.5, c.y, c.z + (dz / l) * 2.5); }
  return null;
}
// a respawned bot: super jump to our carrier (≥ 35 m off and alive), or the anchor → true if it handled the respawn
export function karpJump(b, P) {
  const a = b.a, H = P.Kp.holder;
  if (!KARP_AI.enabled) return false;
  if (H && H.team === a.team && H !== a) {
    if (H.alive && hd(H.pos, a.pos) >= KARP_AI.jumpR && a.superJump(H)) { KARP_BOT.stats.jumps++; b.path = null; b.goalTimer = 0; return true; }
    for (const [o, r] of P.roles[a.team]) if (r === 'anchor' && o !== a && o.alive && hd(o.pos, a.pos) >= KARP_AI.jumpR && a.superJump(o)) { b.path = null; b.goalTimer = 0; return true; }
    return true;
  }
  // they carry: defenders stay home (no jump forward)
  return !!(H && H.team !== a.team);
}
// the Roe Shell as a shield in the way of a shot (bots.js _shieldFight: flank round it, hold fire): a per-bot descriptor
// facing the bot (a sphere seen from here is a disc across the line to it)
export function karpShields(b, S) {
  const Kp = G.match?.karp, sh = Kp && Kp.shell;
  if (!KARP_AI.enabled || !sh || sh.state !== 'intact') return;
  const a = b.a, c = sh.center(), d = b._kShd || (b._kShd = { kind: 'karpShell', team: -1, owner: null, C: new V3(), N: new V3(), R: 0, live: true, held: true, hp: 1e9, left: 99, blocksActors: false });
  d.C.copy(c); d.R = sh.radius();
  d.N.set(a.pos.x - c.x, 0, a.pos.z - c.z); if (d.N.lengthSq() < 1e-4) d.N.set(0, 0, 1); d.N.normalize();
  S.push(d);
}

// ================================================================================================ route rules (_pathTo)
// the carrier's route rules for _pathTo (built at most twice a second): { avoid, cost, noClimb } — the avoid mask (both
// spawn zones, its own free zones, carrierBlock, the shell, and on its own half nodes 6 m behind its retreat mark) and a
// Float32 cost: the known dangers + off the picked route's corridor + by known foes
export function karpPathArgs(b) {
  const a = b.a, P = karpPlan();
  if (!P || !a.carry) return null;
  const now = G.time;
  if (b.kArgs && now - b.kArgsT < 0.5) return b.kArgs;
  const N = P.N, base = P.avoidFor(a.team), sm = P.shellMask;
  const avoid = b.kAvoid && b.kAvoid.length === N ? b.kAvoid : (b.kAvoid = new Uint8Array(N));
  const cost = b.kCost && b.kCost.length === N ? b.kCost : (b.kCost = new Float32Array(N));
  const F = P.Kp.field, J = a.carry.j, D = F.D[a.team], L = F.L[a.team];
  const retreat = J && Number.isFinite(J.mark) && J.half === a.team;
  // (inside its own free zone already: its nodes cost, they don't stop it — out the shortest way)
  const inZone = F.inFreeZone(a.team, a.pos) >= 0, Z = P.zoneN[a.team];
  for (let i = 0; i < N; i++) avoid[i] = (base[i] && !(inZone && Z[i])) || sm[i] || (retreat && F.nodeHalf(i) === a.team && L - D[i] < J.mark - 6) ? 1 : 0;
  const C = b.sp.cost();
  if (C) for (let i = 0; i < N; i++) cost[i] = C[i]; else cost.fill(0);
  if (inZone) for (let i = 0; i < N; i++) if (Z[i]) cost[i] += 6;
  const RT = P.route[a.team];
  if (KARP_AI.enabled && RT && RT.pick) {
    // off the picked route's corridor (2 m round its nodes from the carrier on): + 1.2 a node
    const R = RT.pick, nav = G.nav, on = P._tmp; on.fill(0);
    for (let i = Math.max(0, RT.i - 2); i < R.ids.length; i++) {
      const n = nav.nodes[R.ids[i]];
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue; for (const q of nav.cells[jz * nav.nx + jx]) if (Math.abs(nav.nodes[q].y - n.y) < 1.5) on[q] = 1; }
    }
    for (let i = 0; i < N; i++) if (!on[i]) cost[i] += 1.2;
    // by a known foe: + 2 within 4 m
    for (const f of P.foes[a.team]) {
      const ix = Math.round((f.pos.x - nav.x0) / nav.step), iz = Math.round((f.pos.z - nav.z0) / nav.step);
      for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue; for (const q of nav.cells[jz * nav.nx + jx]) if (Math.hypot(nav.nodes[q].x - f.pos.x, nav.nodes[q].z - f.pos.z) < 4) cost[q] += 2; }
    }
  }
  b.kArgs = { avoid, retreat, cost, noClimb: true }; b.kArgsT = now;
  return b.kArgs;
}
// the same without the retreat part (no forward path at all: accept a short ×3 rather than stand still); level 2 (still
// none: its own free zones the only way on) without the zones either, their nodes costly — a ×3 for the zone, never a
// carrier standing still. One episode per 3 s counts (carrierRetreatFallback: each re-plan in a dead end is the same one)
export function karpPathFallback(b, level = 1) {
  const a = b.a, P = karpPlan();
  if (!P) return null;
  const N = P.N, base = P.avoidFor(a.team), sm = P.shellMask, Z = P.zoneN[a.team], avoid = b.kFbA && b.kFbA.length === N ? b.kFbA : (b.kFbA = new Uint8Array(N));
  for (let i = 0; i < N; i++) avoid[i] = (base[i] && !(level >= 2 && Z[i])) || sm[i] ? 1 : 0;
  if (!(G.time - (b.kFbT ?? -9) < 3)) { KARP_BOT.stats.retreatFallback++; const L = Array.isArray(KARP_BOT.stats.fbAt) ? KARP_BOT.stats.fbAt : (KARP_BOT.stats.fbAt = []); if (L.length < 6) L.push([+a.pos.x.toFixed(1), +a.pos.y.toFixed(1), +a.pos.z.toFixed(1), level]); }   // (where: a stage builder's flag)
  b.kFbT = G.time;
  let cost = b.kArgs ? b.kArgs.cost : b.sp.cost();
  if (level >= 2) { const c = b.kFbC && b.kFbC.length === N ? b.kFbC : (b.kFbC = new Float32Array(N)); for (let i = 0; i < N; i++) c[i] = (cost ? cost[i] : 0) + (Z[i] ? 6 : 0); cost = c; }
  return { avoid, cost, noClimb: true };
}
// everyone else in a Bazookarp match: no route through the shell
export function karpShellAvoid() { const P = karpPlan(); return P && P.shellKey ? P.shellMask : null; }

// ================================================================================================ dangers (botSpecials.js)
// SPEC §8.6, built from what a player could see (G.karpGun.shots, ghosts included; no walls seen through):
//   an enemy Carp Shot in flight — a disc at its predicted landing, the blast + 0.6 m, tIn = the flight left + the
//   swell, near (a lob seen coming, like a thrown bomb); landed — the same disc, tIn = the swell left, lethal 2 for a Big
//   Burst (1 otherwise), a wall is cover, big · our carrier's last 3 s of fuse: 4.5 + 1 m round it for its teammates (it
//   shakes and hisses) · the shell while the other team's side of the meter is ≥ the threatened team's threshold (70 %
//   normal, 60 % hard, none easy): 5.5 m, big, lingering (routes go round it)
const _pp = new V3(), _pq = new V3(), _ph = new Hit();
function predictShot(s) {
  const now = G.time, P = s._kp || (s._kp = { t: -9, ok: false, x: 0, y: 0, z: 0, at: 0 });
  if (now - P.t < 0.1 && now >= P.t) return P.ok ? P : null;
  P.t = now; P.ok = false;
  let x = s.pos.x, y = s.pos.y, z = s.pos.z, vx = s.vel.x, vy = s.vel.y, vz = s.vel.z;
  const dt = 0.05, g = K.gun.gravity, H = _ph;
  for (let tt = dt; tt <= 3; tt += dt) {
    const nx = x + vx * dt, ny = y + vy * dt - 0.5 * g * dt * dt, nz = z + vz * dt;
    vy -= g * dt;
    const r = G.physics.segment(_pp.set(x, y, z), _pq.set(nx, ny, nz), H, true);
    if (r && r.hit) { P.x = r.point.x; P.y = r.point.y; P.z = r.point.z; P.at = now + tt - dt * 0.5; P.ok = true; return P; }
    if (ny < PLAYER.waterY - 1.5) return null;
    x = nx; y = ny; z = nz;
  }
  return null;
}
export function karpDangers(A) {
  const Kp = G.match && G.match.karp;
  if (!Kp || !KARP_AI.enabled) return;
  const now = G.time;
  for (const s of G.karpGun?.shots || []) {
    if (s.phase === 'done') continue;
    const R = radiusOf(s.c), lethal = s.c >= 1 ? 2 : 1;
    if (s.phase === 'fly') {
      const p = predictShot(s); if (!p) continue;
      const d = A.D(A.keyOf(s, 0), 'karp', s.team, s.owner);
      A.disc(d, p.x, p.y, p.z, R + 0.6, Math.min(R, K.gun.fullKillR));
      d.tIn = Math.max(0, p.at - now) + K.gun.swell; d.tOut = d.tIn + 0.1; d.lethal = lethal; d.los = true; d.losY = 0.35; d.vis = 'near'; d.hit = 'karp';
      A.see(d, s.pos.x, s.pos.y, s.pos.z);
    } else if (s.phase === 'swell' && s.land) {
      const d = A.D(A.keyOf(s, 1), 'karp', s.team, s.owner);
      A.disc(d, s.land.x, s.land.y, s.land.z, R + 0.6, Math.min(R, K.gun.fullKillR));
      d.tIn = Math.max(0, K.gun.swell - s.swell); d.tOut = d.tIn + 0.1; d.lethal = lethal; d.los = true; d.losY = 0.35; d.vis = 'big'; d.hear = 9; d.hit = 'karp';
      A.see(d, s.land.x, s.land.y + 0.4, s.land.z);
    }
  }
  const H = Kp.holder;
  if (H && H.alive && !H.remote && Kp.fuse / Math.max(1, Kp.rate) <= KARP_AI.fuseDanger) {
    const d = A.D(A.keyOf(H, 7), 'karpfuse', 1 - H.team, null);
    A.disc(d, H.pos.x, H.pos.y, H.pos.z, K.explodeR + 1, K.explodeR);
    d.vx = H.vel.x; d.vz = H.vel.z; d.vt = 0.4; d.tIn = Math.max(0, Kp.fuse / Math.max(1, Kp.rate)); d.tOut = d.tIn + 0.1; d.lethal = 2;
    d.los = true; d.losY = 0.8; d.vis = 'big'; d.hear = 10; d.actor = H; d.not = H; d.hit = 'karp-fuse';
    A.see(d, H.pos.x, H.pos.y + 1.2, H.pos.z);
  }
  const S = Kp.shell;
  if (S.state === 'intact') {
    const m = S.meter / (S.hp || 1), lead = m > 0 ? 0 : 1, frac = Math.abs(m);
    const tb = G.actors.find((o) => o.team === 1 - lead && o.bot && o.bot.diff), thr = KARP_AI.diff[tb?.bot.diff.id || 'normal']?.danger;
    if (thr != null && frac >= thr) {
      const c = S.center(), d = A.D(A.keyOf(S, 0), 'karpshell', lead, null);
      A.disc(d, c.x, Kp.pos.y, c.z, KARP_AI.dangerR, K.shell.burstR);
      d.yLo = Kp.pos.y - 2.5; d.yHi = Kp.pos.y + 3.5; d.tIn = 0.4; d.tOut = 5; d.lethal = 2; d.los = true; d.losY = K.shell.lift;
      d.vis = 'big'; d.hear = 14; d.linger = true; d.hit = 'karp-burst';
      A.see(d, c.x, c.y, c.z);
    }
  }
}

// ================================================================================================ WP1's minimal set
// (KARP_AI.enabled = false: the A/B baseline — WP1's behaviour, unchanged)
function minimalGoal(b, P) {
  const a = b.a, Kp = P.Kp, now = G.time;
  if (now < (b.kGoalAt || 0) && b.path && b.pi < b.path.length) return;
  b.kGoalAt = now + (a.carry ? 1.0 : 1.5);
  const role = a.carry ? 'carry' : P.sit[a.team] === 'free' && (b.kRole === 'grab' || hd(a.pos, Kp.pos) < 6) ? 'grab' : P.sit[a.team] === 'ours' ? 'escort' : P.sit[a.team] === 'theirs' ? 'hunt' : 'break';
  if (role === 'carry') { b._pathTo(P.targets(a.team)[0].pos, 0.6); return; }
  if (role === 'grab') { b._pathTo(Kp.pos, 1.2); return; }
  const H = Kp.holder;
  if (role === 'escort' && H) { const tg = P.targets(H.team)[0].pos; _v.copy(tg).sub(H.pos).setY(0); if (_v.lengthSq() > 1) _v.normalize(); b._pathTo(_v2.copy(H.pos).addScaledVector(_v, 5).add(_v.set((a.slot % 2 ? 1 : -1) * 2.5, 0, 0)), 1.0); return; }
  if (role === 'hunt' && H) { if (revealedTo(H, a.team)) { b.kLast = H.pos.clone(); b._pathTo(H.pos, 1.0); return; } if (b.kLast) { b._pathTo(b.kLast, 1.0); return; } b._pathTo(P.targets(H.team)[0].pos, 1.0); return; }
  const n = P.breakSpot(a, meleeOf(a) ? Math.max(2.5, Kp.shell.radius() + PLAYER.radius + 0.5) + 0.3 : 7, a.slot);
  if (n) b._pathTo(_v.set(n.x, n.y, n.z), 0.5); else b._pathTo(Kp.pos, 1.0);
}
function minimalAct(b, P, it) {
  const a = b.a, g = a.carry?.gun, t = b.tv;
  if (t && (b.seeTimer > 0 || (b.tk && G.time - b.tk.t < 1.5))) {
    const d = Math.hypot(t.pos.x - a.pos.x, t.pos.z - a.pos.z), dy = t.pos.y - a.pos.y, want = d < 6 ? 0 : 1, pitch = lobPitch(want, d, dy);
    if (pitch !== null) {
      const yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z), aimed = Math.abs(angleDiff(b.aimYaw, yaw)) < 0.12;
      if (g && (g.charging || g.tap)) it.fire = !(g.c >= want && aimed && b.react <= 0);
      else it.fire = aimed && b.react <= 0 && (g ? g.cd <= 0 : true);
      if (it.fire) it.squid = false;
      if (it.fire && !(g && g.charging)) KARP_BOT.stats.carrierShots++;
      return { yaw, pitch, dist: d };
    }
  }
  if (g && g.charging) it.fire = false;
  if (b.groundSeen === 1 && b._pathRemaining() > 4) it.squid = true;
  return null;
}
