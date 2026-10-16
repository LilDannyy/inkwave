// [b5-karp] Bazookarp: the rules engine (no UI), the user's Rainmaker with Splatoon 3's checkpoints. A match with
// opts.mode === 'bazookarp' owns one (match.karp); its looks are src/fx/bazookarpFx.js, its HUD src/ui/hud-karp.js.
// The whole design: tools/botlab/jobs/batch5/bazookarp/SPEC.md (§2 the rules sentence by sentence, §5 this file).
//
//   • the Bazookarp rests in the Pond inside the Roe Shell (karpShell.js): a tug-of-war meter both teams shoot. A burst
//     splats every player of the OTHER team within 4.5 m with a clear line (actor.splat: through armour and every
//     invuln) and leaves it free; after a 0.25 s hold anyone runs into it to pick it up.
//   • the carrier (actor.carry): 20 % slower, no super jump / spawn / main / sub / special, a gauge that cannot rise; fires
//     the Carp Shot (karpGun.js). A fresh 60 s fuse on every pick-up, ×3 while it retreats 8 m on its own half or stands
//     in its own Carp-Free Zone (judged on the carrier's OWN screen). At 0: the Carp Blast.
//   • the score: each team's count, 100 at the Pond → 0 at its Dragon Gate, read from the Carp Field (karpField.js)
//     through a continuity clamp, capped at its weirs' count until it lands the Bazookarp on one of them (a plant lowers
//     all of that team's weirs and raises its Gate). Into the risen Gate: knockout. Best counts never rise.
//   • drops (§2.6 / §2.7): a splat drops it at the drop spot on the carrier's half; a fall, the fuse on the own half, or
//     anything in the own free zone sends it back to the Pond; every drop re-forms the shell (0.8 s, 500 hp).
//   • overtime: the user's three starts and four ends; the 10 s pick-up window counts only while it can be touched.
//   • the hidden coin: "Team Alpha wins if untouched" (the host rolls it; only the 'untouched' result shows it).
//
// Three per-frame lists (§5.2): every screen (its own players: touch, pick-up detection, passive charge, the carrier's
// own judgement), the host (timers, readings, plants, the fuse, drops, grants, overtime, records) and followers
// (snapshots by q, discrete records). The network is a KarpWire (karpWire.js): LoopWire offline, NetWire online.
//
// Records (host → all, SPEC §7.2): ['s' | 'S', q, t, …] snapshots on the timeline; at once ['p', q, nid] grant ·
// ['u', q, nid, x, y, z] undone · ['b', q, team, x, y, z, byNid, tb] burst ([karp-face] tb: its host wire time) · ['d', q, how, x, y, z] dropped / moved ·
// ['r', q, x, y, z, why] reset flight · ['w', q, team, index] plant · ['x', q, nid, x, y, z, own] Carp Blast ·
// ['t', q, losing, why] overtime · ['e', q, winner, reason, c0, c1, b0, b1, otT] end ([karp-face] otT: the overtime played).
//
// Events: karp:phase { phase, prev } · karp:hit { team, meter } · karp:burst { team, pos, by } · karp:pickup { actor,
// team } · karp:undo { actor } · karp:drop { actor, team, pos, how } · karp:reset { from, why } · karp:plant { team,
// index } · karp:gate { team } · karp:rate { actor, rate, why } · karp:fuse { actor, left } · karp:explode { actor, pos,
// own } · karp:field { state } · karp:overtime { losing, why } · karp:end { winner, reason, counts } (+ karpGun's
// karp:shot / karp:land / karp:blast)
import * as THREE from 'three';
import { G, emit, on, clamp } from '../core/ctx.js';
import { BAZOOKARP as K, PLAYER } from '../config.js';
import { KarpField, resolveKarp, placeholderKarp } from './karpField.js';
import { KarpShell } from './karpShell.js';
import { ObjTargets } from './objTargets.js';
import { LoopWire } from './karpWire.js';
import { KARP_GUN } from './karpGun.js';
import { registerReveal } from './reveal.js';

const V3 = THREE.Vector3;
const r2 = (x) => Math.round(x * 100) / 100;
const PHASES = ['shielded', 'reforming', 'free', 'carried', 'resetting', 'done'];
const HOWS = ['splat', 'fall', 'fuse', 'left', 'moved'];
const WHYS = ['fall', 'fuse', 'zone', 'left', 'none'];
const REASONS = ['knockout', 'time', 'untouched', 'comeback', 'retake', 'no-pickup', 'stopped', 'overtime-cap'];
const OT_WHYS = ['held', 'dropped', 'planted'];
const LC_HOWS = ['splat', 'fall', 'fuse', 'left', 'plant', null];   // [karp-face] lastCarrier.how on the wire ('S')
const FALLS = new Set(['water', 'lava', 'void', 'fall', 'sea']);
const REFUSE_GAP = { special: 2, spawn: 3, jump: 0 };   // [karp-face] karp:refuse at most once per … s, per kind (SPEC §1.1)
const _v = new V3(), _v2 = new V3();

// the carrier counts as revealed to the enemy (the marker through walls, the map, bots) while in kid form, not
// submerged (§2.1 S30, S31)
registerReveal('karp', (e, team) => !!(e.carry && G.match?.karp?.holder === e && e.team !== team && !G.match.karp.hidden(e)));

export class Bazookarp {
  constructor(match, wire) {
    this.match = match;
    this.wire = wire || new LoopWire(this);
    if (this.wire instanceof LoopWire) this.wire.engine = this;
    const lay = G.level.layout && G.level.layout.bazookarp;
    this.def = lay || placeholderKarp(G.level);
    this.placeholder = !!this.def.placeholder;
    this.R = resolveKarp(this.def, G.level);
    this.field = new KarpField(this.R, { states: this._stageStates() });
    this.L = this.field.L;
    this.shell = new KarpShell(this);
    G.objTargets = new ObjTargets(); G.objTargets.add(this.shell);
    KARP_GUN.clear();
    this.clock = 0;
    this.phase = 'shielded'; this.phaseT = 0;
    this.pos = this.R.pond.clone();            // where it rests (its floor point); while carried: with the carrier (visual)
    this.restNode = -1;                        // -1: the Pond / a planted weir (exempt from the rest re-check)
    this.from = new V3();                      // a reset flight's start
    this.holder = null; this.holderTeam = -1; this.grantT = -9;
    this.shell.form(this.pos, this.def.shellHp > 0 ? this.def.shellHp : K.shell.hp, 0);   // (LAYOUT shellHp: a per-stage override, balance only)
    this.fuse = K.fuse; this.rate = 1; this.rateWhy = null;
    this.remote = { half: -1, zone: false, rate: 1, why: null, foot: null, sampleT: -1 };   // a remote carrier's own word (kr / kf)
    // weirs and Gates: weirs[t] are the weirs team t lands it on (on the other team's half)
    this.weirs = this.R.weirs.map((list, t) => list.map((w) => ({ ...w, count: this._countAt(t, w.pos) })));
    this.lowered = [false, false]; this.gateUp = [false, false];
    this.gates = this.R.gates;
    this.count = [K.count, K.count]; this.bestM = [0, 0]; this.reachT = [0, 0];
    this.base = null;                          // the continuity clamp's baseline { D, t } (the holder's)
    this.touched = false;
    this.coin = Number.isInteger(match.opts?.karpCoin) ? match.opts.karpCoin : Math.random() < 0.5 ? 0 : 1;
    this.lastCarrier = null;                   // { team, how, left } (left: seconds on the clock when it was lost)
    this.lastPlant = null;                     // { team, left, win } (win: that plant's 10 s pick-up window left)
    this.overtime = false; this.otLosing = -1; this.overtimeT = 0;
    this.otWin = { left: K.otPick, open: false, closeT: null, grace: 0 };
    this.q = 0; this.lastQ = -1;               // discrete records' sequence (host: the last sent; follower: the last applied)
    this.claims = []; this.preGrant = null; this.pendingLoss = null;
    this.winner = null; this.reason = null;
    this.snapT = 0; this.stateT = 0; this.checkT = 0;
    this.log = [];
    this.stats = { clamped: 0, pops: [0, 0], popT: [], pickups: [0, 0], carries: [], blasts: { own: 0, enemy: 0 }, resets: {}, moves: 0, plants: [], fastT: { retreat: 0, zone: 0 },
      firstPop: null, burstSplats: 0, reforms: 0, otStart: null, otEnd: null, windows: { opened: 0, paused: 0, closed: 0 }, grants: 0, refused: 0, declined: 0 };
    this.unsubs = [
      on('splatted', (e) => this._onSplatted(e)),
      on('actor:removed', ({ actor }) => { if (actor === this.holder && !this.follower) this._lose(actor, 'left'); }),
      on('era:done', ({ era }) => { this._danger = false; this.fieldSwitch(this.field.stateOf(era)); }),
      on('era:warn', () => { this._danger = true; this._recheck(true); }),
      on('lava:warn', ({ to }) => { this._liq = true; this.fieldSwitch(this.field.stateOf(to)); }),   // [b5-caldera] fix round 4: _liq (_dynOk)
    ];
    this.wire.on('claim', ({ actor, ts, since, run, late }) => this._claim(actor, ts, since, run, late));
    this.wire.on('decline', ({ actor, q }) => this._decline(actor, q));
    this.wire.on('rate', (d) => { if (d.actor === this.holder) { this.remote.rate = d.rate; this.remote.why = d.why; this.remote.half = d.half; this.remote.zone = d.zone; } });
    this.wire.on('foot', (d) => { if (d.actor === this.holder) this.remote.foot = { pos: new V3(d.x, d.y, d.z), half: d.half, zone: d.zone }; });
    this.wire.on('refused', ({ actor }) => { if (actor && !actor.remote) { this.lockT = 0; this.wire.log.refused = (this.wire.log.refused || 0) + 1; } });   // (kd: our claim was refused)
    this.lockT = 0; this.claimT = 0;          // a guest's kit lock while its claim is out, its re-send clock
    this.freeT0 = 0; this.grantAt = null;     // [karp-face] when it went free on this screen; the host's grant decision time
    this.carriedOnce = new Set();             // players whose first carry has ended (the prompt's charge line)
    this.hud = { fuseShown: K.fuse, fast: false, why: null };
  }

  get follower() { return !!this.match.follower; }
  get host() { return !this.follower; }
  dispose() { this.unsubs.forEach((u) => u()); this.wire.dispose?.(); if (this.holder) this._release(this.holder); if (G.objTargets?.targets.includes(this.shell)) G.objTargets = null; KARP_GUN.clear(); }

  // a stage that changes its routes (bluestone's eras, caldera's lava): its states for the field (§5.5). A stage module
  // offers them through G.match.stage.karpStates() → [{ key, nodeOk(id) }] (none today: the stages ship later)
  _stageStates() { try { return this.match.stage?.karpStates?.() || []; } catch { return []; } }
  _countAt(t, p) { const r = this.field.fieldAt(t, p, undefined, 0); return r ? this.field.count(t, r.d) : K.count; }
  capCount(t) { if (this.lowered[t]) return 0; let c = 0; for (const w of this.weirs[t]) c = Math.max(c, w.count); return this.weirs[t].length ? c : 0; }
  // the team ahead: the lower count; equal → whoever got there first; both 100 → the hidden coin
  winning() {
    const [a, b] = this.count;
    if (a !== b) return a < b ? 0 : 1;
    if (a >= K.count) return this.coin;
    return this.reachT[0] <= this.reachT[1] ? 0 : 1;
  }
  losing() { return 1 - this.winning(); }
  // the carrier hidden from the enemy: swimming in ink (submerged, or up an inked wall)
  hidden(a) { return !!(a && (a.submerged || a.climbing)); }
  own(a) { return !a.remote; }
  _ownActors() { return this.match.actors.filter((a) => !a.remote); }
  _setPhase(p, t = 0) {
    const prev = this.phase;
    this.phase = p; this.phaseT = t;
    if (p !== prev) emit('karp:phase', { phase: p, prev });
    // [karp-face] each screen's own "free since" (claims, §7.3); a fresh free phase claims at once — a guest's re-send
    // clock left over from its last claim (up to 0.3 s) held its first claim back: race1 / race2, every other round
    if (p === 'free' && prev !== 'free') { this.freeT0 = this.clock; this.grantAt = null; this.claimT = 0; this.freeRun = this.follower ? this._runIn() : 0; this.freeLate = this.follower ? this._bAge ?? null : null; this._bAge = null; }
  }
  // [karp-face] review round 3: a guest's player already running in toward the Bazookarp when it went free on this screen
  // — 0 (standing, walking away or across) … 1 (at 0.8 × run speed or more) — from its own last ~0.1 s of movement (the
  // positions: a test's mover or a swim moves it without a.vel). A guest hears of the burst one way after the host; a
  // racer that had to SEE it first is timed fairly from its own 'free', but one already running kept running through
  // that delay: at equal real touch times its since was smaller by the one-way delay, and it won (part=racerun, netlag
  // 80 + jitter 30: guest 12 / 12). Its claim carries this and how late it heard of the burst (the 'b' record's age on
  // the host's clock, as a snapshot's is read); the host adds run × that delay to its since.
  _runIn() {
    const L = G.local, hs = this._lp;
    if (!L || !L.alive || !hs || !hs.length) return 0;
    const now = this.clock;
    let o = null; for (const h of hs) if (now - h.t >= 0.08) o = h;   // (the newest sample at least 0.08 s old)
    if (!o) return 0;
    const d1 = Math.hypot(L.pos.x - this.pos.x, L.pos.z - this.pos.z), d0 = Math.hypot(o.x - this.pos.x, o.z - this.pos.z);
    const vr = (d0 - d1) / Math.max(1e-3, now - o.t);
    return +clamp(vr / (0.8 * PLAYER.runSpeed), 0, 1).toFixed(2);
  }
  // (q carries on above the last one this screen applied as a follower: a new host's first record — even one made while
  // its leave handling still runs, before onHostChange — is never at or below what the other guests already applied)
  _rec(e) { if (this.follower) return; this.q = Math.max(this.q, this.lastQ) + 1; e.splice(1, 0, this.q); this.lastQ = this.q; this.wire.record(e); }

  // ================================================================== per frame (Match.update, before the actors move)
  update(dt) {
    if (this.winner != null) return;
    this.clock += dt; this._dt = dt; this._wn = this.wire.now();   // ([karp-face] review round 3: the wire's time at this clock — a follower's 'free' moment on it)
    const own = this._ownActors();
    // ---- every screen: its own players
    this.shell.update(dt, own, this.host);
    if (this.phase === 'free') this._detect(own);
    this._passive(dt, own);
    const H = this.holder;
    if (H && H.alive && !H.remote && H.carry) this._judge(H, dt);
    if (H) this.pos.copy(H.pos);
    this._hudFuse(dt);
    if (this.lockT > 0) this.lockT = Math.max(0, this.lockT - dt);
    G.objTargets?.update(dt);
    if (this.follower) { this._followerTick(dt); return; }
    // ---- the host (and offline)
    this._timers(dt);
    if (this.phase === 'carried' && H) this._carried(dt, H);
    if (this.phase === 'free') this._grant();
    if (this.phase === 'shielded' || this.phase === 'free' || this.phase === 'reforming') { if ((this.checkT -= dt) <= 0) { this.checkT = K.rest.check; this._recheck(false); } }
    if (this.pendingLoss && this.clock >= this.pendingLoss.t) { const p = this.pendingLoss; this.pendingLoss = null; if (this.holder === p.a) this._lose(p.a, p.how); }
    this._windows(dt);
    if (this.overtime) this._overtime(dt);
    if (this.winner != null) return;
    if ((this.snapT -= dt) <= 0) { this.snapT = 1 / K.snapHz; this.wire.snapshot(this._snap()); }
    if ((this.stateT -= dt) <= 0) { this.stateT = 1 / K.stateHz; this.wire.snapshot(this._full()); }
  }
  // the end of Match.update (§5.2 step 5): the gauge guard — nothing raises a carrier's gauge (S22); it may fall
  lateUpdate() {
    for (const a of this.match.actors) {
      const C = a.carry;
      if (!C || a.remote) continue;
      if (a.special > C.sp) a.special = C.sp;
      C.sp = a.special;
    }
  }

  // ---- timers: re-forming, the reset flight, the pick-up hold
  _timers(dt) {
    if (this.phase === 'reforming') {
      if (this.shell.state === 'intact') { this._setPhase('shielded'); this.stats.reforms++; }
    } else if (this.phase === 'resetting') {
      this.phaseT -= dt;
      const k = clamp(1 - this.phaseT / K.resetFly, 0, 1), P = this.R.pond;
      this.pos.lerpVectors(this.from, P, k); this.pos.y += Math.sin(Math.PI * k) * 6;
      if (this.phaseT <= 0) this._reform(P, -1);
    } else if (this.phase === 'free') {
      this.phaseT = Math.max(0, this.phaseT - dt);
    }
  }
  _reform(p, node, hp = K.shell.reformHp) {
    this.pos.copy(p); this.restNode = node;
    this.shell.form(p, hp);
    this._setPhase('reforming');
  }

  // ================================================================== the shell bursts (host)
  onBurst(team, by) {
    if (this.follower || this.phase !== 'shielded') return;
    const c = _v.copy(this.shell.center());
    this.stats.pops[team]++; this.stats.popT.push(+this.clock.toFixed(2));
    if (this.stats.firstPop == null) this.stats.firstPop = +this.clock.toFixed(2);
    if (by && by.stats) by.stats.karpPops = (by.stats.karpPops || 0) + 1;
    this._rec(['b', team, r2(this.pos.x), r2(this.pos.y), r2(this.pos.z), by?.nid ?? -1, Math.round(this.wire.hostNow() * 1000) / 1000]);   // ([karp-face] its host wire time: a guest reads how late it heard of it)
    this._burst(team, c, by);
    // its ink, the bursting team's (the host's splat replicates as paint)
    G.paint?.splat(_v2.copy(this.pos).setY(this.pos.y + 0.3), K.shell.burstPaint, team, { seed: Math.random() });
    this._setPhase('free', K.pickHold);
  }
  // every screen: its own players of the other team within burstR with a clear line, splatted at once (S4)
  _burst(team, c, by) {
    this.shell.clear();
    for (const a of this.match.actors) {
      if (a.remote || !a.alive || a.team === team) continue;
      if (a.pipe && a.pipe.phase !== 'suck') continue;   // (aquarium: inside a glass pipe)
      _v2.set(a.pos.x, a.pos.y + 1.0, a.pos.z);
      if (_v2.distanceTo(c) > K.shell.burstR) continue;
      if (!G.physics.los(c, _v2)) continue;
      this.stats.burstSplats++;
      a.splat(by || null, 'karp-burst');
    }
    G.fx?.explosion?.(c.clone(), G.teamColors?.[team] || null, K.shell.burstR);
    emit('karp:burst', { team, pos: c.clone(), by });
  }

  // ================================================================== picking it up
  // the pick-up rule (§2.3): who and where (a remote claimant: at p, its newest sample)
  canPick(a, p = a.pos, slack = 0) {
    if (!a || !a.alive || a.superJumpState || this.phase !== 'free') return false;
    const s = a.specialActive;
    if (s && !s.free && !(s.kind === 'bubbler' || s.id === 'bubbler')) return false;
    if (Math.hypot(p.x - this.pos.x, p.z - this.pos.z) > K.pickR + slack) return false;
    const dy = p.y - this.pos.y;
    if (dy < -K.pickBelow || dy > K.pickAbove) return false;
    _v.set(p.x, p.y + 1.1, p.z); _v2.copy(this.pos); _v2.y += K.shell.lift;
    return G.physics.los(_v, _v2);
  }
  // every screen: its own players touching the free Bazookarp claim it (offline / host: into the list; a guest: kc)
  _detect(own) {
    for (const a of own) {
      if (!a.alive) continue;
      const near = Math.hypot(a.pos.x - this.pos.x, a.pos.z - this.pos.z) <= K.pickR;
      if (!near) continue;
      const s = a.specialActive;
      if (s && !s.free && !(s.kind === 'bubbler' || s.id === 'bubbler')) { if (a.isLocal) this._noteRefuse(a, 'special'); continue; }
      if (!this.canPick(a)) continue;
      // [karp-face] each claim carries how long after it went free ON THE CLAIMANT'S OWN SCREEN it was touched (since):
      // the host orders claims by it, so a guest who heard of the burst one trip late, and whose claim arrives a trip
      // later still, races the host's own actors fairly (§7.3; the review measured a host bot winning 10 / 10). Timed
      // where the positions are — the end of the last frame (this runs before the actors move: the clock is a frame on)
      // — less the overshoot past pickR at its speed: a screen at 20 fps no longer touches a frame later than one at 60
      const v = Math.hypot(a.vel.x, a.vel.z), back = v > 0.5 ? Math.min(0.05, (K.pickR - Math.hypot(a.pos.x - this.pos.x, a.pos.z - this.pos.z)) / v) : 0;
      const since = Math.max(0, this.clock - (this._dt || 0) - this.freeT0 - back);
      if (this.host) { if (!this.claims.some((c) => c.a === a)) this.claims.push({ a, ts: this.wire.now(), since, at: this.clock, p: a.pos.clone() }); }
      else if (a === G.local && (this.claimT -= 1 / 60) <= 0) {
        this.claimT = K.claimRetry; this.lockT = K.claimLockMax; this.wire.claim(a.nid, this.wire.now(), since, this.freeRun || 0, this.freeLate);
        const kl = this.stats.kcLog || (this.stats.kcLog = []); kl.push({ at: +this.clock.toFixed(3), since: +since.toFixed(3), run: this.freeRun || 0, late: this.freeLate, fo: this.wire.off?.(this.wire.hostId?.()) ?? null }); if (kl.length > 8) kl.shift();   // ([karp-face] tests)
      }
    }
  }
  // "Can't use" (SPEC §1.1, karp:refuse → the HUD's note): 'special' touching it mid-special (at most once per 2 s),
  // [karp-face] review round 2: 'jump' a carrier's super jump from the TAB map (hud.js _jumpTo, player.js's map keys:
  // every press) and 'spawn' the spawn barrier shoving a carrier (actor.js _spawnBarrier: at most once per 3 s)
  refuse(a, why) {
    const gap = REFUSE_GAP[why] ?? 2, T = this._refT || (this._refT = {});
    if (T[why] != null && this.clock - T[why] < gap) return;
    T[why] = this.clock; emit('karp:refuse', { actor: a, why });
  }
  _noteRefuse(a, why) { this.refuse(a, why); }
  // a guest's claim (the wire): ts is its send time on our clock
  _claim(a, ts, since, run = 0, late = null) {
    if (this.follower || !a) return;
    if (this.phase !== 'free') {
      if (this.phase !== 'carried' || this.holder !== a) this.wire.toGuest(a.nid, { why: this.phase });
      // ([karp-face] a claim that lands after a grant: logged with the decision it missed, for the tests)
      const g = this.stats.grantLog?.[this.stats.grantLog.length - 1];
      if (g && this.holder !== a && this.clock - g.t < 1 && (g.late || (g.late = [])).length < 4) g.late.push({ nid: a.nid ?? -1, since: Number.isFinite(since) ? +since.toFixed(3) : null, after: +(this.clock - g.t).toFixed(3) });
      return;
    }
    // ([karp-face] a claim without its own "since" — an older client — counts from its arrival on our clock)
    // ([karp-face] review round 3: a claimant already running in when it went free on its screen gets that much of the
    // delay it heard of the burst with added — see _runIn; its own measure of that delay, else the one-way estimate; at
    // most 0.25 s)
    // (review round 3: the delay may be a little below 0 — the guest's frame began before the burst on our clock — and
    // is then taken off: its since counts from that frame)
    const dl = Number.isFinite(late) ? late : this.wire.oneWay?.(a.owner) ?? 0;
    const cr = Number.isFinite(run) && run > 0 ? Math.min(1, run) * clamp(dl, -0.1, 0.25) : 0;
    const sn = Math.max(0, (Number.isFinite(since) && since >= 0 ? since : Math.max(0, this.clock - this.freeT0)) + cr);
    const c = this.claims.find((q) => q.a === a);
    if (c) { c.ts = Math.min(c.ts, ts); c.since = Math.min(c.since, sn); c.cr = cr; } else this.claims.push({ a, ts, since: sn, at: this.clock, remote: true, cr });
  }
  // host: grant a claim once the hold is over (§7.3). [karp-face] Not the first claim that exists on this screen: the
  // host's own actors claim on the frame they touch it, a guest's claim lands a round trip after the guest heard of
  // the burst, so first-come gave the host's bots 10 grabs in 10 at equal distance (net-karp face 5). Instead:
  //   - once a claim is in, wait `wait` s for claims still in flight (a round trip plus a tick to the guests close
  //     enough to have touched it as early; 0 with nobody remote near: offline and lone grabs are at once);
  //   - then the valid claim with the smallest `since` (how long after it went free on its claimant's own screen it was
  //     touched; a touch inside the hold counts as the hold's end) wins; equal → the nearest, as before.
  // A remote claimant is valid at its newest sample or any it sent in the last claimAge s; a host actor where it is
  // now or where it touched it (within claimAge). force: decide now (the overtime window's grace runs out).
  _grant(force = false) {
    if (this.phaseT > 0 || !this.claims.length) return;
    if (this.grantAt == null) { this.grant0 = this.clock; this.grantAt = this.clock + this._claimWait(); if (!force && this.grantAt > this.clock) return; }
    else if (!force && this.clock < this.grantAt) return;
    // (a remote claim that landed in the last tick, not yet valid at its samples: they follow it within a tick — a
    // little longer, never past claimWait plus a tick from the first claim)
    const tick = 1 / 20 + 1 / 60;
    if (!force && this.wire.newest && this.clock < this.grant0 + K.claimWait + tick && this.claims.some((c) => c.remote && this.clock - c.at < tick && !this._claimPos(c))) { this.grantAt = this.clock + 1 / 60; return; }
    this.grantAt = null;
    const W = this.otWin, seen = [];
    let best = null, bk = Infinity, bd = Infinity;
    for (const c of this.claims) {
      const a = c.a;
      if (!this.match.actors.includes(a)) continue;
      // (the window's close: only claims sent before it count, for claimAge after it)
      if (W.closeT != null && c.ts > W.closeT) continue;
      const p = this._claimPos(c);
      seen.push({ nid: a.nid ?? -1, remote: !!c.remote, since: +(c.since ?? 0).toFixed(3), at: +(c.at - this.grant0).toFixed(3), ok: !!p, ...(c.cr ? { cr: +c.cr.toFixed(3) } : {}) });
      if (!p) continue;
      const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z), k = Math.max(K.pickHold, c.since ?? 0);
      if (k < bk - 0.004 || (Math.abs(k - bk) <= 0.004 && d < bd)) { bk = Math.min(bk, k); bd = d; best = c; }
    }
    // ([karp-face] the last 40 decisions, for the tests: who claimed, how long after it went free on its own screen,
    // when its claim was in relative to the first, valid or not; the wait and the winner)
    const GL = this.stats.grantLog || (this.stats.grantLog = []);
    GL.push({ t: this.clock, wait: +(this.clock - this.grant0).toFixed(3), won: best ? best.a.nid ?? -1 : null, claims: seen });
    if (GL.length > 40) GL.shift();
    for (const c of this.claims) if (c !== best && c.remote) { this.wire.toGuest(c.a.nid, { why: 'refused' }); this.stats.refused++; }
    this.claims.length = 0;
    if (!best) return;
    this.preGrant = { touched: this.touched, lastCarrier: this.lastCarrier, overtime: this.overtime, otWin: { ...this.otWin }, pos: this.pos.clone(), restNode: this.restNode, q: this.q + 1 };
    this.stats.grants++;
    this._rec(['p', best.a.nid ?? -1]);
    this._applyGrant(best.a);
    // a remote carrier is scored only from samples AFTER the one its claim was judged on (its newest): the ones still
    // queued from before the pick-up never count (and never set the clamp's baseline)
    if (best.a.remote) this.remote.sampleT = this._newestT(best.a);
    // S39a: the winning team takes it back in overtime
    if (this.overtime && best.a.team === 1 - this.otLosing) this._end(1 - this.otLosing, 'retake');
  }
  // [karp-face] where a claim is judged (null: not valid now)
  _claimPos(c) {
    const a = c.a;
    if (!a.remote) {
      if (this.canPick(a)) return a.pos;
      return c.p && this.clock - c.at <= K.claimAge && this.canPick(a, c.p) ? c.p : null;
    }
    const p = this._newest(a);
    if (p && this.canPick(a, p, K.claimSlack)) return p;
    // (any sample it sent in the last claimAge s: a swimmer that ran through the spot — SPEC §7.3)
    const buf = a.net?.buf, n = buf && buf.length ? buf[buf.length - 1] : null;
    if (n) for (let i = buf.length - 2; i >= 0 && buf[i].t >= n.t - K.claimAge; i--) {
      const s = buf[i], q = (this._np2 || (this._np2 = new V3())).set(s.x, s.y, s.z);
      if (this.canPick(a, q, K.claimSlack)) return q;
    }
    return null;
  }
  // [karp-face] how long the host holds a grant open for claims still in flight: the round trip plus that peer's
  // playback delay (NetWire.rttTo) to each guest that hasn't claimed yet but whose player could have touched it as early — alive, and at its
  // newest sample within reach of a run (claimNear m past pickR) — at most claimWait; a remote claim not yet valid at
  // its samples waits a tick for them
  _claimWait() {
    let w = 0;
    for (const a of this.match.actors) {
      if (!a.remote || !a.alive || this.claims.some((c) => c.a === a)) continue;
      const s = this.wire.newest?.(a);
      if (!s || Math.hypot(s.x - this.pos.x, s.z - this.pos.z) > K.pickR + K.claimNear) continue;
      w = Math.max(w, (this.wire.rttTo?.(a) ?? 0) + 1 / 60);
    }
    if (this.wire.newest && this.claims.some((c) => c.remote && !this._claimPos(c))) w = Math.max(w, 1 / 20 + 1 / 60);
    return Math.min(K.claimWait, w);
  }
  // (its own vector: canPick() reuses _v / _v2 — with _v2 here every remote claimant once measured 0 m and won every race)
  _newest(a) {
    const s = this.wire.newest?.(a);
    return s ? (this._np || (this._np = new V3())).set(s.x, s.y, s.z) : a.pos;
  }
  // every screen: the carry begins (its own Bubble Guard ends on every screen; its owner also ends its special)
  _applyGrant(a) {
    if (this.holder && this.holder !== a) this._release(this.holder);
    if (a._shieldOwner && a.status.shield > 0) G.specials?._dropShield(a, true);
    if (!a.remote && a.specialActive && !a.specialActive.free) G.specials?.end(a, 'karp');
    a.weaponRunner.reset();
    a.carry = { since: this.clock, sp: a.special, gun: null, kick: new V3(), j: { mark: NaN, ret: false, half: -1, zone: false, rate: 1, why: null, foot: null, sent: null, sentFoot: null, sentFootT: 0 }, startBest: this.bestM[a.team] };
    a.character?.setWeapon?.('sp_karp');   // [karp-face] the carp launcher (karpModel.js)
    this.holder = a; this.holderTeam = a.team; this.grantT = this.clock;
    this._hr = a.remote; this._sampQ = null; this.blastHold = null;   // [karp-face]
    // ([karp-face] a fresh fuse: a follower reads it on from the grant, never from an older snapshot's)
    this.fuse = K.fuse; this.rate = 1; this.rateWhy = null; this._fz = { fuse: K.fuse, rate: 1, t: this.wire.hostNow(), from: this.wire.hostId?.() ?? null };
    this.remote = { half: -1, zone: false, rate: 1, why: null, foot: null, sampleT: -1 };
    this.base = null;
    this.touched = true;
    this.lastCarrier = { team: a.team, how: null, left: this.match.time };
    this.shell.clear();
    this.restNode = -1;
    this.stats.pickups[a.team]++;
    this.stats.carries.push({ t: +this.clock.toFixed(2), team: a.team, name: a.name, how: null, dur: 0, m: 0 });
    this.hud.fuseShown = K.fuse;
    if (a === G.local) this.lockT = 0;
    this._setPhase('carried');
    emit('karp:pickup', { actor: a, team: a.team });
  }
  // the carry ends (every screen)
  _release(a) {
    if (!a) return;
    const C = a.carry;
    if (C) {
      const st = this.stats.carries[this.stats.carries.length - 1];
      if (st && st.dur === 0) { st.dur = +(this.clock - C.since).toFixed(2); st.m = +(this.bestM[a.team] - C.startBest).toFixed(1); }
      a.stats.karpM = (a.stats.karpM || 0) + Math.max(0, this.bestM[a.team] - C.startBest);
    }
    if (C) this.carriedOnce.add(a);   // (the prompt's first-carry line is done for this player)
    a.carry = null;
    if (a.character && (a.character.weaponKind === 'sp_karp' || a.character.weaponKind === 'sp_zooka') && !a.specialActive) a.character.setWeapon(a.weaponId);
    if (this.holder === a) { this.holder = null; this.holderTeam = -1; this.blastHold = null; this._sampQ = null; }   // [karp-face]
    emit('karp:rate', { actor: a, rate: 1, why: null });
  }
  // a guest declined a grant its player could no longer take (it died first): undo it (§7.3 step 6)
  _decline(a, q) {
    if (this.follower || this.holder !== a || !this.preGrant) return;
    const P = this.preGrant;
    if (Number.isFinite(q) && Number.isFinite(P.q) && q !== P.q) return;   // (a decline of an older grant: not this one)
    this.stats.declined++;
    this._release(a);
    this.touched = P.touched; this.lastCarrier = P.lastCarrier; this.overtime = P.overtime; this.otWin = P.otWin;
    this.pos.copy(P.pos); this.restNode = P.restNode;
    this._rec(['u', a.nid ?? -1, r2(this.pos.x), r2(this.pos.y), r2(this.pos.z)]);
    this._setPhase('free', 0);
    this.pendingLoss = null; this.preGrant = null;
    emit('karp:undo', { actor: a });
  }

  // ================================================================== the carrier's own screen (§3.3)
  _judge(a, dt) {
    const C = a.carry, J = C.j, T = a.team, F = this.field;
    const r = F.fieldAt(T, a.pos, this._ra || (this._ra = { d: 0, node: -1 }));
    const rb = r && F.fieldAt(1 - T, a.pos, this._rb || (this._rb = { d: 0, node: -1 }));
    if (r && rb) {
      const P = this.L[T] - r.d, margin = r.d - rb.d;   // > 0: on T's own half
      // the half flips only once clearly past the line (1 m of margin)
      const wasHalf = J.half;
      if (J.half < 0) J.half = margin > 0 ? T : 1 - T;
      else if (J.half === T && margin < -1.0) J.half = 1 - T;
      else if (J.half !== T && margin > 1.0) J.half = T;
      const onOwn = J.half === T;
      if (Number.isNaN(J.mark) || (onOwn && wasHalf !== T)) { J.mark = P; J.ret = false; }
      else if (onOwn) {
        if (P > J.mark) J.mark = P;
        if (!F.inNoRetreat(a.pos)) {
          if (!J.ret && J.mark - P >= K.retreatOn) J.ret = true;
          else if (J.ret && J.mark - P <= K.retreatOff) J.ret = false;
        } else J.ret = false;
      } else { J.ret = false; J.mark = P; }
      J.zone = F.inFreeZone(T, a.pos) >= 0;
      // the last footing: grounded on static floor (no roof, nothing that moves), with an own node
      const b = a.grounded && a.ground?.hit && a.ground.block >= 0 ? G.level.blocks[a.ground.block] : null;
      if (b && !b.roof && !b.dynamic) {
        const f = J.foot || (J.foot = { pos: new V3(), half: -1, zone: false });
        const moved = f.half < 0 ? 99 : f.pos.distanceTo(a.pos);
        f.pos.copy(a.pos); f.half = J.half; f.zone = J.zone;
        if (a.remote === false && G.netm && !G.netm.isHost) {
          const ch = !J.sentFoot || J.sentFoot.half !== f.half || J.sentFoot.zone !== f.zone;
          if (ch || (moved >= 0 && J.sentFoot && f.pos.distanceTo(J.sentFoot.pos) > 2 && this.clock - J.sentFootT > 0.2)) {
            J.sentFoot = { pos: f.pos.clone(), half: f.half, zone: f.zone }; J.sentFootT = this.clock;
            this.wire.reportFoot(a.nid, f.pos.x, f.pos.y, f.pos.z, f.half, f.zone);
          }
        }
      }
    }
    const rate = J.ret || J.zone ? K.fuseFast : 1, why = J.zone ? 'zone' : J.ret ? 'retreat' : null;
    if (rate !== J.rate || why !== J.why) { J.rate = rate; J.why = why; emit('karp:rate', { actor: a, rate, why }); }
    if (this.host) { this.rate = rate; this.rateWhy = why; }
    else {
      const key = `${rate}|${why}|${J.half}|${J.zone ? 1 : 0}`;
      if (key !== J.sent) { J.sent = key; this.wire.reportRate(a.nid, rate, why, J.half, J.zone); }
    }
    if (rate > 1) this.stats.fastT[why] = (this.stats.fastT[why] || 0) + dt;
  }
  // a field-state switch (an era, a lava level; karpbox's test state): every screen swaps the arrays; the carrier's own
  // screen resets its retreat mark (re-read on the next own-node frame); the host resets the clamp and re-checks the rest
  fieldSwitch(s) {
    if (s === this.field.state) return;
    this.field.setState(s);
    for (const a of this.match.actors) if (a.carry && !a.remote) { const J = a.carry.j; J.mark = NaN; J.ret = false; J.half = -1; }
    this.base = null;
    if (this.host) this._recheck(true);
    emit('karp:field', { state: s });
  }
  // the warning before a switch (era:warn / lava:warn): a resting Bazookarp on ground the coming state takes away moves
  fieldWarn(s) { if (this.host) this._recheck(true, s); }

  // ================================================================== carried (host)
  _carried(dt, a) {
    const T = a.team;
    // [karp-face] the carrier changed hands (a guest's carrier adopted by this host as a bot): the clamp's baseline was
    // in that guest's sample clock — start it afresh in ours, and the mark is read afresh on the new owner's first frame
    if (this._hr !== a.remote) { if (this._hr !== undefined) { this.base = null; this._sampQ = null; } this._hr = a.remote; }
    // readings: the host's own carrier each frame; a remote one from each real sample it sent (never its drawn position)
    if (!a.remote) { if (a.alive) this._reading(a, T, a.pos, this.clock); }
    else {
      const ss = this._sampQ && this._sampQ.length ? this._sampQ : this.wire.samples(a, this.remote.sampleT);
      if (ss) for (const s of ss) { if (s.t <= this.remote.sampleT) continue; this.remote.sampleT = s.t; if (s.alive && this.holder === a && this.winner == null) this._reading(a, T, _v.set(s.x, s.y, s.z), s.t); }
      if (this._sampQ) this._sampQ.length = 0;
    }
    if (this.holder !== a || this.winner != null) return;
    // the fuse: the carrier's own judgement (a remote one: its newest kr)
    const rate = a.remote ? this.remote.rate : this.rate;
    this.fuse = Math.max(0, this.fuse - dt * rate);
    const whole = Math.ceil(this.fuse);
    if (whole !== this._fuseWhole) { this._fuseWhole = whole; if (whole <= K.fuseWarn && whole >= 0) emit('karp:fuse', { actor: a, left: whole }); }
    if (this.fuse <= 0 && a.alive) {
      // [karp-face] a REMOTE carrier: wait for its timeline to catch up (its playback delay, ≤ 0.3 s) before the Carp
      // Blast — a death record of it that plays meanwhile means it was splatted (or fell) before its fuse ran out on its
      // own screen: then §2.6's splat / fall row applies and there is no blast (SPEC §7.5). The host's own: at once.
      if (!a.remote) this._carpBlast(a);
      else if (!this.blastHold || this.blastHold.a !== a) this.blastHold = { a, t: this.clock + (this.wire.holdFor?.(a) ?? 0) };
      else if (this.clock >= this.blastHold.t) { this.blastHold = null; this._carpBlast(a); }
    }
  }
  // [karp-face] host: a remote carrier's newly played REAL samples (netmatch _sample, SPEC §3.4: prevTr < s.t ≤ tr,
  // with its alive flag), scored in order by _carried — never its drawn position
  onSamples(a, ss) {
    if (this.follower || a !== this.holder || !ss || !ss.length) return;
    const Q = this._sampQ || (this._sampQ = []);
    for (const s of ss) if (s.t > this.remote.sampleT && (!Q.length || s.t > Q[Q.length - 1].t)) Q.push(s);
    if (Q.length > 90) Q.splice(0, Q.length - 90);
  }
  // one reading at pos (time t): the clamp, then count / best, a plant on a standing weir, the risen Gate
  _reading(a, T, pos, t) {
    const r = this.field.fieldAt(T, pos, this._rh || (this._rh = { d: 0, node: -1 }));
    if (!r || !Number.isFinite(r.d)) return;
    const D = r.d, B = this.base;
    if (B && D < B.D - (K.clamp.vMax * Math.max(0, t - B.t) + K.clamp.slack + this._holeStep(T, B.node, r.node))) {
      this.stats.clamped++;
      if ((this.stats.clampLog || (this.stats.clampLog = [])).length < 8) this.stats.clampLog.push({ t: +t.toFixed(2), from: +B.D.toFixed(2), to: +D.toFixed(2), dt: +(t - B.t).toFixed(3), pos: [+pos.x.toFixed(2), +pos.y.toFixed(2), +pos.z.toFixed(2)], node: r.node, grounded: !!a.grounded, form: a.form, w: a.weaponId });
      return;
    }
    this.base = { D, t, node: r.node };
    const now = Math.max(this.capCount(T), this.field.count(T, D));
    if (now < this.count[T]) { this.count[T] = now; this.reachT[T] = this.clock; }
    // best metres of progress (results): never past the weirs' cap until they're planted
    const pm = Math.min(this.L[T] - D, this.L[T] * (1 - this.capCount(T) / K.count));
    if (pm > this.bestM[T]) this.bestM[T] = pm;
    // a plant: feet within weirR of a standing weir's centre and ±trigBand of its floor
    if (!this.lowered[T]) {
      for (const w of this.weirs[T]) {
        if (Math.hypot(pos.x - w.pos.x, pos.z - w.pos.z) <= w.r && Math.abs(pos.y - w.pos.y) <= K.trigBand) { this._plant(a, T, w.index); return; }
      }
    }
    // the knockout
    if (this.gateUp[T]) {
      const g = this.gates[T].pos;
      if (Math.hypot(pos.x - g.x, pos.z - g.z) <= K.gateR && Math.abs(pos.y - g.y) <= K.trigBand) {
        this.count[T] = 0; this.reachT[T] = this.clock; this.bestM[T] = this.L[T];
        this._setPhase('done');
        this._end(T, 'knockout');
      }
    }
    // overtime: carried past the winning team's count
    if (this.overtime && T === this.otLosing && this.count[T] < this.count[1 - T]) this._end(T, 'comeback');
  }
  // the clamp's allowance for a small nav hole (a post, a bollard: a missing cell the graph walks round): two own nodes
  // ≤ clamp.holeR apart on one floor with a clear waist line between them are a straight walk of that length, so the
  // reading may drop by the graph's detour beyond it at once (lockgate, a missing cell at (1.5, 28.5): two nodes 2 m
  // apart whose D differ by 3.4 m). Never across a wall or a thin wall (their waist line is blocked), never a far jump.
  _holeStep(T, a, b) {
    if (a == null || a < 0 || b < 0 || a === b) return 0;
    const nav = G.nav, n = nav.nodes[a], m = nav.nodes[b], d = Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z);
    if (d > K.clamp.holeR || Math.abs(n.y - m.y) > 0.6 || nav._blocked(n, m, Math.max(n.y, m.y))) return 0;
    const D = this.field.D[T];
    return Number.isFinite(D[a]) && Number.isFinite(D[b]) ? Math.max(0, D[a] - D[b] - d) : 0;
  }
  _plant(a, T, i) {
    const w = this.weirs[T][i];
    this.count[T] = Math.min(this.count[T], w.count);
    if (this.count[T] === w.count) this.reachT[T] = this.clock;
    this.bestM[T] = Math.max(this.bestM[T], this.L[T] * (1 - w.count / K.count));
    this.lastPlant = { team: T, left: this.match.time, win: K.otPick, ot: this.overtime };
    this.stats.plants.push({ t: +this.clock.toFixed(2), team: T, index: i });
    this._rec(['w', T, i]);
    this._applyPlant(a, T, i);
    // S39b: a losing-team plant opens a 10 s window (in overtime: at once)
    if (this.overtime && T === this.otLosing) this._openWindow();
    if (this.overtime && T === this.otLosing && this.count[T] < this.count[1 - T]) this._end(T, 'comeback');
  }
  _applyPlant(a, T, i) {
    const w = this.weirs[T][i];
    if (a) { this.lastCarrier = { team: T, how: 'plant', left: this.match.time }; this._release(a); }
    this.lowered[T] = true; this.gateUp[T] = true;
    this._reform(w.pos, -1);
    emit('karp:plant', { team: T, index: i });
    emit('karp:gate', { team: T });
  }

  // ---- the Carp Blast: the fuse ran out (host decides; each screen splats its own players of the carrier's team)
  _carpBlast(a) {
    const T = a.team, J = a.carry?.j;
    const half = a.remote ? this.remote.half : J ? J.half : -1, zone = a.remote ? this.remote.zone : !!(J && J.zone);
    const own = (half < 0 ? this.field.halfAt(a.pos) === T : half === T) || zone;
    const c = (a.remote ? this._newest(a) : a.pos).clone();
    this._rec(['x', a.nid ?? -1, r2(c.x), r2(c.y), r2(c.z), own ? 1 : 0]);
    this.stats.blasts[own ? 'own' : 'enemy']++;
    this.lastCarrier = { team: T, how: 'fuse', left: this.match.time };
    this._release(a);
    this._explode(a, c, own);
    // its ink: the other team's (the host paints: it replicates as paint)
    G.paint?.splat(_v.copy(c).setY(c.y + 0.3), K.explodePaint, 1 - T, { seed: Math.random() });
    if (own) this._reset(c, 'fuse'); else this._dropAt(c, half < 0 ? this.field.halfAt(c) : half, 'fuse', a);
    if (this.overtime && T === this.otLosing) this._end(1 - this.otLosing, 'stopped');
  }
  // every screen: the carrier (its own screen) and its teammates within explodeR with a clear line
  _explode(a, c, own) {
    this._blasting = true;
    try {
      const cc = _v.copy(c).setY(c.y + 0.8);
      for (const e of this.match.actors) {
        if (e.remote || !e.alive || e.team !== a.team) continue;
        if (e.pipe && e.pipe.phase !== 'suck') continue;
        _v2.set(e.pos.x, e.pos.y + 1.0, e.pos.z);
        if (e !== a && (_v2.distanceTo(cc) > K.explodeR || !G.physics.los(cc, _v2))) continue;
        e.splat(null, 'karp-fuse');
      }
    } finally { this._blasting = false; }
    G.fx?.explosion?.(c.clone().setY(c.y + 0.8), G.teamColors?.[1 - a.team] || null, K.explodeR);
    emit('karp:explode', { actor: a, pos: c.clone(), own });
  }

  // ================================================================== losing it (host)
  _onSplatted({ victim, cause }) {
    if (this.follower || victim !== this.holder || this._blasting) return;
    // (a remote holder granted a moment ago: its screen may decline the grant — wait for that first, §7.3)
    if (victim.remote && this.clock - this.grantT < 1.5) { this.pendingLoss = { a: victim, how: FALLS.has(cause) ? 'fall' : 'splat', t: this.clock + K.claimAge }; return; }
    this._lose(victim, FALLS.has(cause) ? 'fall' : cause === 'left' ? 'left' : 'splat');
  }
  _lose(a, how) {
    if (this.holder !== a) return;
    const T = a.team, J = a.carry?.j;
    const R = a.remote ? this.remote : J || {};
    this.lastCarrier = { team: T, how, left: this.match.time };
    const st = this.stats.carries[this.stats.carries.length - 1]; if (st) st.how = how;
    if (how === 'fall') {
      const f = a.remote ? this.remote.foot : J?.foot;
      const fp = f ? f.pos : a.pos, fh = f ? f.half : this.field.halfAt(a.pos);
      this._release(a);
      if (fh === T || (f && f.zone) || fh < 0) this._reset(fp, 'fall'); else this._dropAt(fp, fh, 'fall', a);
    } else {
      const p = (a.remote ? this._newest(a) : a.pos).clone();
      const zone = !!R.zone, half = R.half >= 0 ? R.half : this.field.halfAt(p);
      this._release(a);
      if (zone) this._reset(p, 'zone'); else this._dropAt(p, half, how, a);
    }
    if (this.overtime && T === this.otLosing) this._end(1 - this.otLosing, 'stopped');
  }
  // dropped at the drop spot from p on half h (no spot on that half at all: the Pond, §2.7 step 4)
  _dropAt(p, h, how, a = null) {
    const id = this.field.dropSpot(p, h, (n) => this._dynOk(n));
    if (id < 0) { this._reset(p, 'none'); return; }
    const n = G.nav.nodes[id];
    _v.set(n.x, n.y, n.z);
    this._rec(['d', HOWS.indexOf(how), r2(n.x), r2(n.y), r2(n.z)]);
    this._reform(_v, id);
    if (how === 'moved') this.stats.moves++;
    emit('karp:drop', { actor: a, team: a ? a.team : -1, pos: _v.clone(), how });
  }
  // back to the Pond: a 1.5 s flight, then a fresh shell there
  _reset(from, why) {
    this.from.copy(from);
    this.stats.resets[why] = (this.stats.resets[why] || 0) + 1;
    this._rec(['r', r2(from.x), r2(from.y), r2(from.z), WHYS.indexOf(why)]);
    this.shell.clear(); this.restNode = -1;
    this._setPhase('resetting', K.resetFly);
    emit('karp:reset', { from: from.clone(), why });
  }
  // dynamic exclusions (§2.7): 2.8 m round a STANDING weir; an era's danger from its warning to its done
  _dynOk(id) {
    const n = G.nav.nodes[id];
    for (let t = 0; t < 2; t++) if (!this.lowered[t]) for (const w of this.weirs[t]) if (Math.hypot(n.x - w.pos.x, n.z - w.pos.z) < K.rest.weirR && Math.abs(n.y - w.pos.y) < K.rest.band) return false;
    // [b5-caldera] fix round 4: on a liquid stage (from its first lava:warn) the stage's danger counts at all times — the
    // lava's is a floor it covers within 10 s: the field turns LOW at the fall warning (SPEC §5.5) while the lava holds
    // HIGH for 10 s more and the ledges dry 16.2 s after it (review 4: drops onto drowned ledges from 70 to 86 s)
    if ((this._danger || this._liq) && this.match.stage?.danger?.(n, 0)) return false;
    return true;
  }
  // the resting re-check (every 0.5 s, and at once on a state warning): covered / taken away / excluded → moved
  _recheck(now, state = this.field.state) {
    if (this.follower || this.restNode < 0 || !['shielded', 'free', 'reforming'].includes(this.phase)) return;
    const id = this.restNode, F = this.field;
    const blocked = !!(G.nav.blocked && G.nav.blocked[id]);
    const ok = F.states[state].restOk[id] && this._dynOk(id) && !blocked;
    if (ok) return;
    const h = F.states[state].halfOf[id];
    const nid = F.dropSpot(this.pos, h, (n) => this._dynOk(n) && !(G.nav.blocked && G.nav.blocked[n]), state);
    if (nid < 0 || nid === id) return;
    const n = G.nav.nodes[nid];
    _v.set(n.x, n.y, n.z);
    this._rec(['d', HOWS.indexOf('moved'), r2(n.x), r2(n.y), r2(n.z)]);
    this._reform(_v, nid);
    this.stats.moves++;
    emit('karp:drop', { actor: null, team: -1, pos: _v.clone(), how: 'moved' });
    void now;
  }

  // ================================================================== passive special charge (S43–S45)
  _passive(dt, own) {
    let team = -1;
    if (this.holder) team = 1 - this.holderTeam;
    else if (this.count[0] < K.count || this.count[1] < K.count) team = this.losing();
    if (team < 0) return;
    for (const a of own) {
      if (a.team !== team || !a.alive || a.specialActive || a.carry) continue;
      const was = a.specialReady();
      a.special = Math.min(a.specialCost(), a.special + K.gauge * dt);
      if (!was && a.specialReady()) emit('special:ready', { actor: a });
    }
  }

  // ================================================================== overtime (§2.1 S38 / S39)
  // time's up (Match.update). true = the match ends now; false = overtime has begun
  timeUp() {
    if (this.winner != null) return true;
    if (!this.touched) { this._end(this.coin, 'untouched'); return true; }
    const W = this.winning(), L = 1 - W, lc = this.lastCarrier, lp = this.lastPlant;
    let why = null;
    if (this.holder && this.holderTeam === L) why = 'held';
    else if (!this.holder && lc && lc.team === W && ['splat', 'fall', 'fuse', 'left'].includes(lc.how) && lc.left < K.otDropWindow) why = 'dropped';
    else if (!this.holder && lc && lc.team === L && lc.how === 'plant' && lp && lp.team === L && lp.left < K.otPlantWindow) why = 'planted';
    if (!why) { this._end(W, 'time'); return true; }
    this.overtime = true; this.otLosing = L; this.overtimeT = 0;
    this.stats.otStart = why;
    this._rec(['t', L, OT_WHYS.indexOf(why)]);
    if (why === 'planted') { this.otWin = { left: lp.win, open: true, closeT: null, grace: 0 }; this.stats.windows.opened++; }
    else if (why === 'dropped') this._openWindow();
    emit('karp:overtime', { losing: L, why });
    return false;
  }
  _openWindow() { this.otWin = { left: K.otPick, open: true, closeT: null, grace: 0 }; this.stats.windows.opened++; }
  // the pick-up windows: they count only while somebody could act on it (shielded / free); a regulation plant's window
  // too (an S38c start carries it into overtime)
  _windows(dt) {
    const touchable = this.phase === 'shielded' || this.phase === 'free';
    const lp = this.lastPlant;
    if (lp && !lp.ot && !this.overtime && lp.win > 0) { if (touchable) lp.win = Math.max(0, lp.win - dt); }
    const W = this.otWin;
    if (!this.overtime || !W.open) return;
    if (this.holder && this.holderTeam === this.otLosing) return;   // (moot while the losing team holds it)
    if (W.closeT == null) {
      if (touchable) W.left = Math.max(0, W.left - dt); else this.stats.windows.paused += dt;
      if (W.left <= 0) { W.closeT = this.wire.now(); W.grace = K.claimAge; }
    } else {
      W.grace -= dt;
      if (W.grace <= 0 && this.phase === 'free' && this.claims.length) this._grant(true);   // ([karp-face] a grant still held open for claims in flight: decide now)
      if (this.winner != null) return;
      if (W.grace <= 0) { W.open = false; this.stats.windows.closed++; if (!(this.holder && this.holderTeam === this.otLosing)) this._end(1 - this.otLosing, 'no-pickup'); }
    }
  }
  _overtime(dt) {
    // ([karp-face] review round 3, 2nd fixer: not once it has ended — an end decided earlier in this frame (a retake in
    // _grant, a comeback or knockout in _carried) got one more frame of overtime after its 'e' had gone out: the new
    // host's results said 1.64, the other guest's 1.62 (net-karp-full))
    if (this.winner != null) return;
    this.overtimeT += dt;
    const L = this.otLosing, W = 1 - L;
    if (this.count[L] < this.count[W]) return this._end(L, 'comeback');
    if (this.overtimeT >= K.overtimeMax) return this._end(W, 'overtime-cap');
  }
  _end(winner, reason) {
    if (this.winner != null) return;
    // ([karp-face] review round 3: the overtime played rides the end record — a follower's own clock trails the host's
    // by its playback delay, and the results screen rounds it up to whole seconds: 3.04 here, 2.92 there read
    // OVERTIME +0:04 / +0:03. This screen keeps the same rounded number it sends)
    this.overtimeT = r2(this.overtimeT);
    this._rec(['e', winner, REASONS.indexOf(reason), this.count[0], this.count[1], r2(this.bestM[0]), r2(this.bestM[1]), this.overtimeT]);
    this.winner = winner; this.reason = reason;
    this.stats.otEnd = this.overtime ? reason : null;
    this.log.push({ t: +this.clock.toFixed(2), winner, reason, counts: [...this.count] });
    emit('karp:end', { winner, reason, counts: [...this.count] });
    this.match.endKarp?.(winner, reason);
  }

  // ================================================================== online: snapshots, records
  // [karp-face] snapshots are stamped with the host's WIRE clock (its tick clock, the one every peer's netmatch already
  // measures an offset to): a follower reads a snapshot's age as wire.hostNow(sender) − t — the sender's clock through
  // that peer's offset plus the one-way delay. (The match clock it used before is only kept within 0.2 s on a guest and
  // trails the host's by the one-way delay: at ×3 the carrier's ring ran up to 0.6 s long under netlag 150.)
  _snap() {
    const H = this.holder;
    return ['s', this.q, r2(this.wire.hostNow()), PHASES.indexOf(this.phase), r2(this.pos.x), r2(this.pos.y), r2(this.pos.z), H ? H.nid ?? -1 : -1,
      Math.round(this.shell.meter), r2(this.fuse), this.holder?.remote ? this.remote.rate : this.rate, this.rateWhy === 'retreat' ? 1 : this.rateWhy === 'zone' ? 2 : 0,
      this.count[0], this.count[1], r2(this.overtimeT), this.overtime && this.otWin.open ? r2(this.otWin.left) : -1];
  }
  _full() {
    const s = this._snap();
    s[0] = 'S';
    s.push(r2(this.bestM[0]), r2(this.bestM[1]), r2(this.reachT[0]), r2(this.reachT[1]), this.lowered[0] ? 1 : 0, this.lowered[1] ? 1 : 0, this.touched ? 1 : 0,
      this.otLosing, r2(this.phaseT), this.shell.hp, this.field.state, this.restNode, this.overtime ? 1 : 0);
    // [karp-face] what a NEW host needs to carry on (SPEC §7.2 'S', §7.6): the last carrier and plant (its S38 decision
    // at time-up), the overtime window, the burst's credit (lastHit per team), a remote carrier's own word (kr / kf), the
    // reset flight's start. Indices 29 … 35.
    const lc = this.lastCarrier, lp = this.lastPlant, W = this.otWin, R = this.remote, f = R.foot, lh = this.shell.lastHit;
    s.push(lc ? [lc.team, LC_HOWS.indexOf(lc.how), r2(lc.left)] : -1,
      lp ? [lp.team, r2(lp.left), r2(lp.win), lp.ot ? 1 : 0] : -1,
      [r2(W.left), W.open ? 1 : 0, W.closeT != null ? r2(W.grace) : -1],
      [lh[0]?.nid ?? -1, lh[1]?.nid ?? -1],
      [R.half, R.zone ? 1 : 0, R.rate, R.why === 'retreat' ? 1 : R.why === 'zone' ? 2 : 0],
      f ? [r2(f.pos.x), r2(f.pos.y), r2(f.pos.z), f.half, f.zone ? 1 : 0] : -1,
      [r2(this.from.x), r2(this.from.y), r2(this.from.z)]);
    return s;
  }
  netEvent(e, snap = false, from = null) {
    if (!Array.isArray(e) || !this.follower) return;
    const k = e[0], q = e[1];
    if (k === 's' || k === 'S') { this._applySnap(e, from); return; }
    if (q <= this.lastQ) return;
    this.lastQ = q;
    const byNid = (n) => (n >= 0 ? this.match.actors.find((a) => a.nid === n) || null : null);
    switch (k) {
      case 'p': {
        const a = byNid(e[2]);
        this.lockT = 0;   // (any grant answers every claim in flight, §7.3 step 5)
        // a grant to this screen's own player, who died after it claimed: declined (kx), not taken — the host undoes it
        // ('u') and that death is no carrier's loss (§7.3 step 6)
        if (a && !a.remote && !a.alive) { this._declined = { nid: a.nid, q }; this.wire.decline(a.nid, q); break; }
        if (a) this._applyGrant(a);
        break;
      }
      case 'u': { const a = byNid(e[2]); if (a) { if (this.holder === a || a.carry) this._release(a); if (!a.remote) this.lockT = 0; } this.pos.set(e[3], e[4], e[5]); this.shell.clear(); this._setPhase('free', 0); emit('karp:undo', { actor: a }); break; }   // ([karp-face] free: no shell)
      case 'b': {
        this.pos.set(e[3], e[4], e[5]);
        // ([karp-face] how late this screen's 'free' moment is after the burst on the host's clock, for _runIn's claims.
        // Review round 3: read at the frame that moment belongs to (freeT0 is this frame's clock; a 'bk' lands between
        // frames — up to a frame later), on the floor of the clock offset (receive − send at its fastest: the fastest
        // one-way trip is left in — the host adds it back from both floors). hostNow's one-way estimate, from relay
        // round trips that carry each page's event-loop wait, ran 10–100 ms high on a loaded machine: a running guest
        // lost every dead heat (racerun without lag: host bot 12 / 12))
        const o = this.wire.off?.(this.wire.hostId?.());
        this._bAge = Number.isFinite(e[7]) && o != null ? clamp((this._wn ?? this.wire.now()) - o - e[7], -0.1, 0.4) : null;
        // (what this screen saw of it, for tests: the burst's host time, the frame's and the arrival's wire times, the floor
        // offset and the one-way estimate then)
        const bl = this.stats.bLog || (this.stats.bLog = []); bl.push({ tb: e[7], wn: this._wn ?? null, arr: this.wire.now(), off: o, oneWay: this.wire.oneWay?.(this.wire.hostId?.()) ?? null }); if (bl.length > 8) bl.shift();
        this.stats.pops[e[2]]++; const c = _v.copy(this.pos).setY(this.pos.y + K.shell.lift); this._burst(e[2], c, byNid(e[6])); this._setPhase('free', K.pickHold); break; }
      case 'd': { const H = this.holder; if (H) { this.lastCarrier = { team: H.team, how: HOWS[e[2]], left: this.match.time }; this._release(H); } this._reform(_v.set(e[3], e[4], e[5]), -1); emit('karp:drop', { actor: H, team: H ? H.team : -1, pos: _v.clone(), how: HOWS[e[2]] }); break; }
      case 'r': { const H = this.holder; if (H) { const w = WHYS[e[5]]; this.lastCarrier = { team: H.team, how: w === 'zone' || w === 'none' ? 'splat' : w, left: this.match.time }; this._release(H); } this._reset(_v.set(e[2], e[3], e[4]), WHYS[e[5]] || 'none'); break; }
      case 'w': { const H = this.holder; this.lastPlant = { team: e[2], left: this.match.time, win: K.otPick, ot: this.overtime }; this.count[e[2]] = Math.min(this.count[e[2]], this.weirs[e[2]][e[3]]?.count ?? this.count[e[2]]); this._applyPlant(H && H.team === e[2] ? H : null, e[2], e[3]); if (H && H.carry) this._release(H); break; }
      case 'x': { const a = byNid(e[2]); const c = new V3(e[3], e[4], e[5]); if (a) { this.lastCarrier = { team: a.team, how: 'fuse', left: this.match.time }; this._release(a); this._explode(a, c, !!e[6]); } break; }
      case 't': this.overtime = true; this.otLosing = e[2]; this.overtimeT = 0; emit('karp:overtime', { losing: e[2], why: OT_WHYS[e[3]] }); break;
      case 'e': { this.count = [e[4], e[5]]; this.bestM = [e[6], e[7]]; if (Number.isFinite(e[8])) this.overtimeT = e[8]; this.winner = e[2]; this.reason = REASONS[e[3]]; emit('karp:end', { winner: e[2], reason: this.reason, counts: [...this.count] }); this.match.endKarp?.(e[2], this.reason); break; }
    }
    void snap;
  }
  _applySnap(e, from) {
    const [, q, t, ph, x, y, z, hn, meter, fuse, rate, why, c0, c1, otT, win] = e;
    // [karp-face] a snapshot older than the last discrete record this screen applied (the host took it before a grant,
    // a drop, a plant or the end, and it played after that record on the timeline) changes NOTHING here: not the counts
    // (a knockout's 0 went back up to the host's pre-'e' count), not the fuse (a fresh carrier's ring took the last
    // carry's leftover), not the overtime clock. After the end, nothing at all
    if (q < this.lastQ || this.winner != null) return;
    this._sn = { t, from: from ?? this.wire.hostId?.() ?? null, otT, win };   // ([karp-face] a new host reads these forward: onHostChange)
    this.count = [c0, c1];
    if (this.overtime) this.overtimeT = otT;
    this.otWin.open = !!this.overtime && win >= 0;   // (a new host's window carries on from here: onHostChange)
    if (win >= 0) this.otWin.left = win;
    this.hostT = t;
    let phase = PHASES[ph];
    // (the grant this screen declined, until the host's 'u': it stays free here)
    if (phase === 'carried' && this._declined && this._declined.nid === hn && q <= this._declined.q) phase = 'free';
    if (phase === 'carried') {
      const a = this.match.actors.find((o) => o.nid === hn);
      if (a && this.holder !== a) this._applyGrant(a);
    } else if (this.holder && phase !== 'carried') this._release(this.holder);
    // [karp-face] the fuse is this snapshot's holder's: only for that same carrier (a snapshot about the last one never
    // touches a new carrier's fuse); its age on the host's clock (the wire's: the sender's tick clock through the peer
    // offset, plus the one-way delay) — a remote carrier's fuse is read forward from here (_followerTick)
    if (this.holder && (this.holder.nid ?? -1) === hn) {
      this.fuse = fuse; this.rate = rate; this.rateWhy = why === 1 ? 'retreat' : why === 2 ? 'zone' : null;
      const age = this.wire.hostNow(from) - t;
      if (age > -0.05 && age < 1.5) { this._fz = { fuse, rate, t, from: this._sn.from }; this._fuseSync(fuse, rate, t, from); }
    }
    if (phase !== this.phase) {
      if ((phase === 'shielded' || phase === 'reforming') && this.shell.state === 'none') this.shell.form(_v.set(x, y, z), K.shell.reformHp, phase === 'reforming' ? 0.4 : 0);
      if (phase === 'free' || phase === 'carried' || phase === 'resetting') this.shell.clear();
      this._setPhase(phase);
    }
    if (phase !== 'carried' && phase !== 'resetting') {
      const d = Math.hypot(this.pos.x - x, this.pos.y - y, this.pos.z - z);
      if (d > 3) this.pos.set(x, y, z); else this.pos.lerp(_v.set(x, y, z), 0.5);
      if (this.shell.state !== 'none') { this.shell.pos.copy(this.pos); this.shell.c.copy(this.pos); this.shell.c.y += K.shell.lift; }
    }
    if (this.shell.state !== 'none') this.shell.setFromNet(meter, e[0] === 'S' ? e[25] : this.shell.hp);
    if (e[0] === 'S') {
      this.bestM = [e[16], e[17]]; this.reachT = [e[18], e[19]];
      for (let tm = 0; tm < 2; tm++) if (e[20 + tm] && !this.lowered[tm]) { this.lowered[tm] = true; this.gateUp[tm] = true; emit('karp:gate', { team: tm }); }
      this.touched = !!e[22]; this.otLosing = e[23];
      if (e[26] !== this.field.state) this.field.setState(e[26]);
      if (e[28] && !this.overtime) this.overtime = true;
      // [karp-face] the rest a new host carries on from (older hosts send none of it)
      if (e.length > 29) {
        const byNid = (n) => (n >= 0 ? this.match.actors.find((a) => a.nid === n) || null : null);
        this.lastCarrier = Array.isArray(e[29]) ? { team: e[29][0], how: LC_HOWS[e[29][1]] ?? null, left: e[29][2] } : null;
        this.lastPlant = Array.isArray(e[30]) ? { team: e[30][0], left: e[30][1], win: e[30][2], ot: !!e[30][3] } : null;
        if (Array.isArray(e[31])) { this.otWin.left = e[31][0]; this.otWin.open = !!e[31][1]; if (e[31][2] >= 0) { this.otWin.closeT = this.otWin.closeT ?? this.wire.now(); this.otWin.grace = e[31][2]; } else { this.otWin.closeT = null; this.otWin.grace = 0; } }
        if (Array.isArray(e[32])) this.shell.lastHit = [byNid(e[32][0]), byNid(e[32][1])];
        if (Array.isArray(e[33])) { const R = this.remote; R.half = e[33][0]; R.zone = !!e[33][1]; R.rate = e[33][2] || 1; R.why = e[33][3] === 1 ? 'retreat' : e[33][3] === 2 ? 'zone' : null; }
        this.remote.foot = Array.isArray(e[34]) ? { pos: new V3(e[34][0], e[34][1], e[34][2]), half: e[34][3], zone: !!e[34][4] } : null;
        if (Array.isArray(e[35]) && this.phase === 'resetting') this.from.set(e[35][0], e[35][1], e[35][2]);
        if (this.phase === 'resetting' || this.phase === 'free') this.phaseT = e[24];
        this.restNode = e[27];
      }
    }
  }
  _followerTick(dt) {
    // ([karp-face] this screen's player's last ~0.25 s of positions, for _runIn)
    const L = G.local, hs = this._lp || (this._lp = []);
    if (L) { hs.push({ t: this.clock, x: L.pos.x, z: L.pos.z }); while (hs.length > 2 && this.clock - hs[0].t > 0.25) hs.shift(); }
    if (this.overtime) this.overtimeT += dt;
    if (this.phase === 'resetting') {
      this.phaseT -= dt;
      const k = clamp(1 - this.phaseT / K.resetFly, 0, 1), P = this.R.pond;
      this.pos.lerpVectors(this.from, P, k); this.pos.y += Math.sin(Math.PI * k) * 6;
      if (this.phaseT <= 0) this._reform(P, -1);
    } else if (this.phase === 'reforming' && this.shell.state === 'intact') this._setPhase('shielded');
    if (this.holder && this.holder === G.local) this.fuse -= dt * (this.holder.carry?.j?.rate || 1);
    // [karp-face] someone else's carrier: the host's fuse now, read forward from the newest snapshot by the match clock
    // (at most 0.6 s on: a stalled stream doesn't run it away) — the marker, the Carp Line and the pause strip show it
    else if (this.holder && this._fz) this.fuse = Math.max(0, this._fz.fuse - this._fz.rate * Math.min(0.6, Math.max(0, this.wire.hostNow(this._fz.from) - this._fz.t)));
  }
  // the carrier's own HUD fuse (§7.2): run locally at the local rate; a host snapshot may move it forward at once, back
  // by at most 0.2 s a second
  _hudFuse(dt) {
    const H = this.holder;
    if (!H) { this.hud.fuseShown = K.fuse; this.hud.fast = false; this.hud.why = null; return; }
    const rate = !H.remote && H.carry?.j ? H.carry.j.rate : H.remote ? this.rate : this.rate;
    if (this.host) this.hud.fuseShown = this.fuse;
    else if (!H.remote) this.hud.fuseShown = Math.max(0, this.hud.fuseShown - dt * rate);
    else this.hud.fuseShown = this.fuse;
    this.hud.fast = rate > 1;
    this.hud.why = !H.remote && H.carry?.j ? H.carry.j.why : this.rateWhy;
  }
  _fuseSync(fuse, rate, t, from = null) {
    if (!this.holder || this.holder.remote) return;
    const hostNow = fuse - rate * Math.max(0, this.wire.hostNow(from) - t);
    const S = this.hud;
    if (S.fuseShown > hostNow + K.fuseSync.fwd) S.fuseShown = hostNow;
    else if (S.fuseShown < hostNow - K.fuseSync.fwd) S.fuseShown = Math.min(hostNow, S.fuseShown + K.fuseSync.back / K.snapHz);
  }
  // host: a guest's shell hits (its tick's kh: [nid, dmg, nid, dmg, …], already filtered and capped on its screen)
  netHits(kh) {
    if (this.follower || !Array.isArray(kh)) return;
    for (let i = 0; i + 1 < kh.length; i += 2) {
      const a = this.match.actors.find((o) => o.nid === kh[i]), d = +kh[i + 1];
      if (a && d > 0) this.shell.add(a.team, Math.min(d, K.shell.hitCap * 8), a);
    }
  }
  // host migration (netmatch.onLeave, on the NEW host, once match.follower is false — SPEC §7.6 step 4): records go on
  // from the old host's sequence (the other guests drop any q at or below the last one they applied); a holder that is
  // gone (a humans-only stage removed it while this screen was still a follower) or dead is lost as 'left' at its last
  // real sample; the clamp's baseline resets; a full state at once. (What WP2 still owns: §7.6's narrowed flush and the
  // onLeave order, the 'k' case for adopted actors, lastCarrier / lastPlant in 'S'.)
  onHostChange(meHost = true) {
    if (!meHost || this.follower) {   // (still a guest: a carrier of ours re-sends kr / kf to the new host, step 5)
      for (const a of this.match.actors) if (a.carry?.j && !a.remote) { a.carry.j.sent = null; a.carry.j.sentFoot = null; }
      this.claimT = 0;
      return;
    }
    this.q = Math.max(this.q, this.lastQ);
    this.claims.length = 0; this.preGrant = null; this.pendingLoss = null; this._declined = null; this.blastHold = null; this._sampQ = null; this.grantAt = null;
    // [karp-face] shell hits this screen batched for the old host (its kh) count here now
    const kh = G.objTargets?.takeHits?.(); if (kh) this.netHits(kh);
    const H = this.holder;
    // (a remote carrier's half / zone / rate / last footing: the old host's word from its last 'S', until the carrier's
    // own re-sent kr / kf arrive — SPEC §7.6 step 5)
    // ([karp-face] review round 2: what this screen holds from the old host's snapshots are their RAW values — a follower
    // reads a remote carrier's fuse forward each frame, its own carrier's ring runs apart, and the narrowed flush has just
    // played the newest raw — so the fuse, the overtime clock and the window are read forward to now, on the old host's
    // clock: they stepped UP by the snapshot's age × the rate at the takeover (rv2-mig3lag: +0.34 s; a carrier who became
    // the host rewound its own ring 0.2 s). A carrier on this screen never gets back time its ring has already shown spent)
    const ageOf = (z) => (z ? Math.min(0.6, Math.max(0, this.wire.hostNow(z.from) - z.t)) : 0);
    if (H && this._fz && this.match.actors.includes(H) && H.alive) {
      let f = Math.max(0, this._fz.fuse - this._fz.rate * ageOf(this._fz));
      if (H === G.local) f = Math.min(f, this.hud.fuseShown);
      this.fuse = Math.min(this.fuse, f);
    }
    const sn = this._sn, W = this.otWin;
    if (this.overtime && sn) {
      this.overtimeT = Math.max(this.overtimeT, sn.otT + ageOf(sn));
      const touchable = this.phase === 'shielded' || this.phase === 'free';
      if (W.open && W.closeT == null && sn.win >= 0 && touchable && !(H && this.holderTeam === this.otLosing)) W.left = Math.max(0, Math.min(W.left, sn.win - ageOf(sn)));
    }
    this.stats.takeover = { fuse: +this.fuse.toFixed(2), shown: +this.hud.fuseShown.toFixed(2), age: sn ? +ageOf(sn).toFixed(3) : null, overtimeT: +this.overtimeT.toFixed(2), win: W.open ? +W.left.toFixed(2) : -1 };
    if (H && (!this.match.actors.includes(H) || !H.alive)) this._lose(H, 'left');
    else if (H) {
      this.remote.sampleT = this._newestT(H);
      if (H.carry?.j && !H.remote) { const J = H.carry.j; J.mark = NaN; J.ret = false; J.half = -1; }   // (an adopted carrier: read afresh)
    }
    this._hr = this.holder ? this.holder.remote : undefined;
    this.base = null;
    this.snapT = 0; this.stateT = 0; this.checkT = 0;
    this.stats.hostChanges = (this.stats.hostChanges || 0) + 1;
    this.wire.snapshot(this._full());
  }
  _newestT(a) { const s = this.wire.newest?.(a); return s ? s.t : -1; }

  // ================================================================== the HUD / tests / bots
  // the prompt line for actor a (main.js, the light tutorial line)
  prompt(a) {
    if (!a || !a.alive || this.winner != null) return null;
    const T = a.team;
    if (this.holder === a) {
      // (the charge line for each player's FIRST carry, whenever it comes — SPEC §1.1)
      if (!this.lowered[T]) return !this.carriedOnce.has(a) ? 'Hold [FIRE] to charge a Carp Shot · carry it to a weir' : 'Land it on a weir to open their Dragon Gate';
      return 'Into the Dragon Gate for a knockout!';
    }
    if (this.phase === 'free' && Math.hypot(a.pos.x - this.pos.x, a.pos.z - this.pos.z) < 12) return 'Run into the Bazookarp to grab it';
    if (this.holder && this.holderTeam !== T) return 'Their carrier\'s marked — follow the carp';
    if (this.clock < 8) return 'Shoot the Roe Shell in the middle — when your ink bursts it, foes close by are splatted';
    if (this.lowered[T] && !this.holder && (this.phase === 'shielded' || this.phase === 'reforming')) return 'Burst the shell again and carry it on to the Dragon Gate';
    return null;
  }
  // a snapshot for the HUD / fx / results / tests
  state() {
    const H = this.holder;
    return {
      phase: this.phase, phaseT: this.phaseT, pos: [this.pos.x, this.pos.y, this.pos.z], restNode: this.restNode,
      holder: H ? { name: H.name, team: H.team, nid: H.nid ?? -1, hidden: this.hidden(H) } : null, holderTeam: this.holderTeam,
      meter: this.shell.meter, hp: this.shell.hp, shell: this.shell.state, shellR: this.shell.radius(), shellC: [this.shell.c.x, this.shell.c.y, this.shell.c.z],
      fuse: this.fuse, fuseShown: this.hud.fuseShown, rate: H && !H.remote && H.carry?.j ? H.carry.j.rate : this.rate, why: this.hud.why,
      count: [...this.count], best: [...this.bestM], reachT: [...this.reachT], len: [...this.L],
      weirs: this.weirs.map((l, t) => l.map((w) => ({ team: t, index: w.index, pos: [w.pos.x, w.pos.y, w.pos.z], count: w.count, lowered: this.lowered[t] }))),
      gates: this.gates.map((g, t) => ({ team: t, pos: [g.pos.x, g.pos.y, g.pos.z], up: this.gateUp[t] })),
      cap: [this.capCount(0), this.capCount(1)], touched: this.touched,
      overtime: this.overtime, overtimeT: +this.overtimeT.toFixed(1), losing: this.overtime ? this.otLosing : -1, window: this.overtime && this.otWin.open ? this.otWin.left : -1,
      winner: this.winner, reason: this.reason, placeholder: this.placeholder, fieldState: this.field.state, lock: this.lockT > 0,
    };
  }
  // the coin is for the result only (never in state())
  resultCoin() { return this.reason === 'untouched' ? this.coin : undefined; }
}
