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
// ['u', q, nid, x, y, z] undone · ['b', q, team, x, y, z, byNid] burst · ['d', q, how, x, y, z] dropped / moved ·
// ['r', q, x, y, z, why] reset flight · ['w', q, team, index] plant · ['x', q, nid, x, y, z, own] Carp Blast ·
// ['t', q, losing, why] overtime · ['e', q, winner, reason, c0, c1, b0, b1] end.
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
const FALLS = new Set(['water', 'lava', 'void', 'fall', 'sea']);
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
      on('lava:warn', ({ to }) => { this.fieldSwitch(this.field.stateOf(to)); }),
    ];
    this.wire.on('claim', ({ actor, ts }) => this._claim(actor, ts));
    this.wire.on('decline', ({ actor, q }) => this._decline(actor, q));
    this.wire.on('rate', (d) => { if (d.actor === this.holder) { this.remote.rate = d.rate; this.remote.why = d.why; this.remote.half = d.half; this.remote.zone = d.zone; } });
    this.wire.on('foot', (d) => { if (d.actor === this.holder) this.remote.foot = { pos: new V3(d.x, d.y, d.z), half: d.half, zone: d.zone }; });
    this.wire.on('refused', ({ actor }) => { if (actor && !actor.remote) { this.lockT = 0; this.wire.log.refused = (this.wire.log.refused || 0) + 1; } });   // (kd: our claim was refused)
    this.lockT = 0; this.claimT = 0;          // a guest's kit lock while its claim is out, its re-send clock
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
  }
  _rec(e) { if (this.follower) return; e.splice(1, 0, ++this.q); this.lastQ = this.q; this.wire.record(e); }

  // ================================================================== per frame (Match.update, before the actors move)
  update(dt) {
    if (this.winner != null) return;
    this.clock += dt;
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
    this._rec(['b', team, r2(this.pos.x), r2(this.pos.y), r2(this.pos.z), by?.nid ?? -1]);
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
      if (this.host) { if (!this.claims.some((c) => c.a === a)) this.claims.push({ a, ts: this.wire.now() }); }
      else if (a === G.local && (this.claimT -= 1 / 60) <= 0) { this.claimT = K.claimRetry; this.lockT = K.claimLockMax; this.wire.claim(a.nid, this.wire.now()); }
    }
  }
  _noteRefuse(a, why) { if (!this._refT || this.clock - this._refT > 2) { this._refT = this.clock; emit('karp:refuse', { actor: a, why }); } }
  // a guest's claim (the wire): ts is its send time on our clock
  _claim(a, ts) {
    if (this.follower || !a) return;
    if (this.phase !== 'free') { if (this.phase !== 'carried' || this.holder !== a) this.wire.toGuest(a.nid, { why: this.phase }); return; }
    const c = this.claims.find((q) => q.a === a);
    if (c) c.ts = Math.min(c.ts, ts); else this.claims.push({ a, ts, remote: true });
  }
  // host: grant the nearest valid claim once the hold is over
  _grant() {
    if (this.phaseT > 0 || !this.claims.length) return;
    const W = this.otWin;
    let best = null, bd = Infinity;
    for (const c of this.claims) {
      const a = c.a;
      if (!this.match.actors.includes(a)) continue;
      // (the window's close: only claims sent before it count, for claimAge after it)
      if (W.closeT != null && c.ts > W.closeT) continue;
      const p = a.remote ? this._newest(a) : a.pos;
      if (!p || !this.canPick(a, p, a.remote ? K.claimSlack : 0)) continue;
      const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z);
      if (d < bd) { bd = d; best = c; }
    }
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
    a.character?.setWeapon?.('sp_zooka');
    this.holder = a; this.holderTeam = a.team; this.grantT = this.clock;
    this.fuse = K.fuse; this.rate = 1; this.rateWhy = null;
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
    if (a.character && a.character.weaponKind === 'sp_zooka' && !a.specialActive) a.character.setWeapon(a.weaponId);
    if (this.holder === a) { this.holder = null; this.holderTeam = -1; }
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
    // readings: the host's own carrier each frame; a remote one from each real sample it sent (never its drawn position)
    if (!a.remote) { if (a.alive) this._reading(a, T, a.pos, this.clock); }
    else {
      const ss = this.wire.samples(a, this.remote.sampleT);
      if (ss) for (const s of ss) { this.remote.sampleT = s.t; if (s.alive && this.holder === a && this.winner == null) this._reading(a, T, _v.set(s.x, s.y, s.z), s.t); }
    }
    if (this.holder !== a || this.winner != null) return;
    // the fuse: the carrier's own judgement (a remote one: its newest kr)
    const rate = a.remote ? this.remote.rate : this.rate;
    this.fuse -= dt * rate;
    const whole = Math.ceil(this.fuse);
    if (whole !== this._fuseWhole) { this._fuseWhole = whole; if (whole <= K.fuseWarn && whole >= 0) emit('karp:fuse', { actor: a, left: whole }); }
    if (this.fuse <= 0 && a.alive) this._carpBlast(a);
  }
  // one reading at pos (time t): the clamp, then count / best, a plant on a standing weir, the risen Gate
  _reading(a, T, pos, t) {
    const r = this.field.fieldAt(T, pos, this._rh || (this._rh = { d: 0, node: -1 }));
    if (!r || !Number.isFinite(r.d)) return;
    const D = r.d, B = this.base;
    if (B && D < B.D - (K.clamp.vMax * Math.max(0, t - B.t) + K.clamp.slack)) {
      this.stats.clamped++;
      if ((this.stats.clampLog || (this.stats.clampLog = [])).length < 8) this.stats.clampLog.push({ t: +t.toFixed(2), from: +B.D.toFixed(2), to: +D.toFixed(2), dt: +(t - B.t).toFixed(3), pos: [+pos.x.toFixed(2), +pos.y.toFixed(2), +pos.z.toFixed(2)], node: r.node, grounded: !!a.grounded, form: a.form, w: a.weaponId });
      return;
    }
    this.base = { D, t };
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
    if (this._danger && this.match.stage?.danger?.(n, 0)) return false;
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
      if (W.grace <= 0) { W.open = false; this.stats.windows.closed++; if (!(this.holder && this.holderTeam === this.otLosing)) this._end(1 - this.otLosing, 'no-pickup'); }
    }
  }
  _overtime(dt) {
    this.overtimeT += dt;
    const L = this.otLosing, W = 1 - L;
    if (this.count[L] < this.count[W]) return this._end(L, 'comeback');
    if (this.overtimeT >= K.overtimeMax) return this._end(W, 'overtime-cap');
  }
  _end(winner, reason) {
    if (this.winner != null) return;
    this._rec(['e', winner, REASONS.indexOf(reason), this.count[0], this.count[1], r2(this.bestM[0]), r2(this.bestM[1])]);
    this.winner = winner; this.reason = reason;
    this.stats.otEnd = this.overtime ? reason : null;
    this.log.push({ t: +this.clock.toFixed(2), winner, reason, counts: [...this.count] });
    emit('karp:end', { winner, reason, counts: [...this.count] });
    this.match.endKarp?.(winner, reason);
  }

  // ================================================================== online: snapshots, records
  _snap() {
    const H = this.holder;
    return ['s', this.q, r2(this.clock), PHASES.indexOf(this.phase), r2(this.pos.x), r2(this.pos.y), r2(this.pos.z), H ? H.nid ?? -1 : -1,
      Math.round(this.shell.meter), r2(this.fuse), this.holder?.remote ? this.remote.rate : this.rate, this.rateWhy === 'retreat' ? 1 : this.rateWhy === 'zone' ? 2 : 0,
      this.count[0], this.count[1], r2(this.overtimeT), this.overtime && this.otWin.open ? r2(this.otWin.left) : -1];
  }
  _full() {
    const s = this._snap();
    s[0] = 'S';
    s.push(r2(this.bestM[0]), r2(this.bestM[1]), r2(this.reachT[0]), r2(this.reachT[1]), this.lowered[0] ? 1 : 0, this.lowered[1] ? 1 : 0, this.touched ? 1 : 0,
      this.otLosing, r2(this.phaseT), this.shell.hp, this.field.state, this.restNode, this.overtime ? 1 : 0);
    return s;
  }
  netEvent(e, snap = false) {
    if (!Array.isArray(e) || !this.follower) return;
    const k = e[0], q = e[1];
    if (k === 's' || k === 'S') { this._applySnap(e); return; }
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
      case 'u': { const a = byNid(e[2]); if (a) { if (this.holder === a || a.carry) this._release(a); if (!a.remote) this.lockT = 0; } this.pos.set(e[3], e[4], e[5]); this._setPhase('free', 0); emit('karp:undo', { actor: a }); break; }
      case 'b': { this.pos.set(e[3], e[4], e[5]); this.stats.pops[e[2]]++; const c = _v.copy(this.pos).setY(this.pos.y + K.shell.lift); this._burst(e[2], c, byNid(e[6])); this._setPhase('free', K.pickHold); break; }
      case 'd': { const H = this.holder; if (H) this._release(H); this._reform(_v.set(e[3], e[4], e[5]), -1); emit('karp:drop', { actor: H, team: H ? H.team : -1, pos: _v.clone(), how: HOWS[e[2]] }); break; }
      case 'r': { const H = this.holder; if (H) this._release(H); this._reset(_v.set(e[2], e[3], e[4]), WHYS[e[5]] || 'none'); break; }
      case 'w': { const H = this.holder; this.count[e[2]] = Math.min(this.count[e[2]], this.weirs[e[2]][e[3]]?.count ?? this.count[e[2]]); this._applyPlant(H && H.team === e[2] ? H : null, e[2], e[3]); if (H && H.carry) this._release(H); break; }
      case 'x': { const a = byNid(e[2]); const c = new V3(e[3], e[4], e[5]); if (a) { this._release(a); this._explode(a, c, !!e[6]); } break; }
      case 't': this.overtime = true; this.otLosing = e[2]; this.overtimeT = 0; emit('karp:overtime', { losing: e[2], why: OT_WHYS[e[3]] }); break;
      case 'e': { this.count = [e[4], e[5]]; this.bestM = [e[6], e[7]]; this.winner = e[2]; this.reason = REASONS[e[3]]; emit('karp:end', { winner: e[2], reason: this.reason, counts: [...this.count] }); this.match.endKarp?.(e[2], this.reason); break; }
    }
    void snap;
  }
  _applySnap(e) {
    const [, q, t, ph, x, y, z, hn, meter, fuse, rate, why, c0, c1, otT, win] = e;
    this.count = [c0, c1];
    this.fuse = fuse; this.rate = rate; this.rateWhy = why === 1 ? 'retreat' : why === 2 ? 'zone' : null;
    if (this.overtime) this.overtimeT = otT;
    this.otWin.open = !!this.overtime && win >= 0;   // (a new host's window carries on from here: onHostChange)
    if (win >= 0) this.otWin.left = win;
    this.hostT = t;
    this._fuseSync(fuse, rate, t);
    if (q < this.lastQ) return;   // (older than the last discrete record: its phase / holder / position are stale)
    let phase = PHASES[ph];
    // (the grant this screen declined, until the host's 'u': it stays free here)
    if (phase === 'carried' && this._declined && this._declined.nid === hn && q <= this._declined.q) phase = 'free';
    if (phase === 'carried') {
      const a = this.match.actors.find((o) => o.nid === hn);
      if (a && this.holder !== a) this._applyGrant(a);
    } else if (this.holder && phase !== 'carried') this._release(this.holder);
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
    }
  }
  _followerTick(dt) {
    if (this.overtime) this.overtimeT += dt;
    if (this.phase === 'resetting') {
      this.phaseT -= dt;
      const k = clamp(1 - this.phaseT / K.resetFly, 0, 1), P = this.R.pond;
      this.pos.lerpVectors(this.from, P, k); this.pos.y += Math.sin(Math.PI * k) * 6;
      if (this.phaseT <= 0) this._reform(P, -1);
    } else if (this.phase === 'reforming' && this.shell.state === 'intact') this._setPhase('shielded');
    if (this.holder && this.holder === G.local) this.fuse -= dt * (this.holder.carry?.j?.rate || 1);
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
  _fuseSync(fuse, rate, t) {
    if (!this.holder || this.holder.remote) return;
    const hostNow = fuse - rate * Math.max(0, this.clock - t);
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
    this.claims.length = 0; this.preGrant = null; this.pendingLoss = null; this._declined = null;
    const H = this.holder;
    if (H && (!this.match.actors.includes(H) || !H.alive)) {
      this.remote.half = -1; this.remote.zone = false;   // (this screen never had its kr: the half from the field)
      this._lose(H, 'left');
    } else if (H) {
      this.remote = { half: -1, zone: false, rate: 1, why: null, foot: null, sampleT: this._newestT(H) };
      if (H.carry?.j) { const J = H.carry.j; J.mark = NaN; J.ret = false; J.half = -1; }   // (an adopted carrier: read afresh)
    }
    this.base = null;
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
