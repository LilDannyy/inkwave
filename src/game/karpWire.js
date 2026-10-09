// [b5-karp] The Bazookarp engine talks to the network only through a KarpWire (SPEC §5.1, §7.2):
//   host side    record(rec)   a discrete record, sent at once, carrying q        ['p' | 'u' | 'b' | 'd' | 'r' | 'w' | 'x' | 't' | 'e', q, …]
//                snapshot(rec) the 10 Hz 's' / 1 Hz 'S' snapshot, on the host's event timeline
//                toGuest(nid, msg)  'kd' (a claim refused while it stays free)
//                samples(a, since) → a remote carrier's REAL samples played since `since` ([{ t, x, y, z, alive }]), or null
//   guest side   claim(nid, ts) 'kc' · decline(nid, q) 'kx' · reportRate(nid, rate, why, half, zone) 'kr' ·
//                reportFoot(nid, x, y, z, half, zone) 'kf'  (shell hits ride the guest's tick: objTargets.takeHits → 'kh')
//   both         on('claim' | 'decline' | 'rate' | 'foot' | 'hits' | 'refused', fn) · now() (the claim clock) · isHost
// LoopWire: offline — a host whose records go nowhere, except (tests) to a follower engine `delay` s later, and whose
// guest side can be driven by a test (its _emit plays a guest's message on the host).
// NetWire: online through G.netm (net/netmatch.js: 'bk' records at once, 'ks' snapshots on the timeline, the guest
// messages). WP2 (karp-face) owns the full netcode (migration, the fuse hold, the window's grace for late claims …);
// this is the shape it builds on.
import { G } from '../core/ctx.js';

export class KarpWire {
  constructor() { this.h = {}; this.log = { rec: 0, snap: 0, claim: 0, rate: 0, foot: 0, decline: 0, refused: 0 }; }
  on(kind, fn) { (this.h[kind] || (this.h[kind] = [])).push(fn); return () => { const l = this.h[kind]; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }; }
  _emit(kind, d) { for (const f of this.h[kind] || []) f(d); }
  get isHost() { return true; }
  now() { return performance.now() / 1000; }
  record() { this.log.rec++; }
  snapshot() { this.log.snap++; }
  toGuest() {}
  claim() { this.log.claim++; }
  decline() { this.log.decline++; }
  reportRate() { this.log.rate++; }
  reportFoot() { this.log.foot++; }
  samples() { return null; }
  dispose() { this.h = {}; }
}

// offline. engine: the host engine (its clock is the wire's clock, so a test stepping time steps claims too)
export class LoopWire extends KarpWire {
  constructor(engine) { super(); this.engine = engine; this.follower = null; this.delay = 0.1; this.q = []; this.out = []; }
  now() { return this.engine ? this.engine.clock : 0; }
  record(rec) { super.record(); this.out.push(rec); if (this.out.length > 400) this.out.shift(); if (this.follower) this.q.push([this.now() + this.delay, 'r', rec]); }
  snapshot(rec) { super.snapshot(); if (this.follower) this.q.push([this.now() + this.delay, 's', rec]); }
  // tests: hand records to the follower once they're due (and a snapshot `late` s later than its turn: the shuffle)
  pump() {
    const t = this.now();
    this.q.sort((a, b) => a[0] - b[0]);
    while (this.q.length && this.q[0][0] <= t + 1e-9) { const [, k, rec] = this.q.shift(); this.follower?.netEvent(rec, k === 's'); }
  }
}

// online. Records: 'bk' at once (broadcast), 'ks' snapshots on the host's timeline (netmatch _rec), guest messages to
// the host (sendTo), 'kd' to one guest.
export class NetWire extends KarpWire {
  constructor(nm) { super(); this.nm = nm; }
  get isHost() { return !!this.nm?.isHost; }
  now() { return performance.now() / 1000; }
  _hostId() { return this.nm?.s?.hostId; }
  record(rec) { super.record(); if (this.nm && G.netm === this.nm && this.nm.isHost) this.nm._sendNow({ k: 'bk', e: rec }); }
  snapshot(rec) { super.snapshot(); if (this.nm && G.netm === this.nm && this.nm.isHost) this.nm._rec(['ks', rec]); }
  toGuest(nid, msg) { const a = this.nm?.byNid.get(nid); if (a && a.owner) this.nm.s.tr?.sendTo(a.owner, { k: 'kd', nid, ...msg }); }
  _toHost(d) { const h = this._hostId(); if (h && !this.nm.isHost) this.nm.s.tr?.sendTo(h, d); }
  claim(nid, ts) { super.claim(); this._toHost({ k: 'kc', nid, ts: Math.round(ts * 1000) / 1000 }); }
  decline(nid, q) { super.decline(); this._toHost({ k: 'kx', nid, q }); }
  reportRate(nid, rate, why, half, zone) { super.reportRate(); this._toHost({ k: 'kr', nid, rate, why, half, zone: zone ? 1 : 0 }); }
  reportFoot(nid, x, y, z, half, zone) { super.reportFoot(); this._toHost({ k: 'kf', nid, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, z: Math.round(z * 100) / 100, half, zone: zone ? 1 : 0 }); }
  // a message for the engine (netmatch onMessage): the host gets a guest's kc / kx / kr / kf (only for an actor that
  // guest owns), its sender's clock turned into ours; a guest gets the host's kd (a refused claim, about its own player)
  message(from, d) {
    const a = this.nm?.byNid.get(d.nid);
    if (!a) return;
    if (d.k === 'kd') { if (from === this._hostId() && !this.nm.isHost && !a.remote) this._emit('refused', { actor: a, why: d.why }); return; }
    if (a.owner !== from) return;
    const p = this.nm.peers.get(from);
    switch (d.k) {
      case 'kc': this._emit('claim', { actor: a, ts: (d.ts ?? 0) + (p ? p.off : 0) }); break;
      case 'kx': this._emit('decline', { actor: a, q: d.q }); break;
      case 'kr': this._emit('rate', { actor: a, rate: d.rate, why: d.why, half: d.half, zone: !!d.zone }); break;
      case 'kf': this._emit('foot', { actor: a, x: d.x, y: d.y, z: d.z, half: d.half, zone: !!d.zone }); break;
    }
  }
  // host: a remote carrier's real samples (netmatch keeps them in a.net.buf) with since < t ≤ its owner's playback time
  samples(a, since) {
    const buf = a?.net?.buf, p = this.nm?.peers.get(a.owner);
    if (!buf || !p || p.tr === undefined) return null;
    const out = [];
    for (const s of buf) if (s.t > since && s.t <= p.tr) out.push({ t: s.t, x: s.x, y: s.y, z: s.z, alive: !!(s.f & 1) });
    return out;
  }
  // the newest sample a remote claimant sent (§7.3: claims are judged where it really is, not where we draw it)
  newest(a) { const b = a?.net?.buf; return b && b.length ? b[b.length - 1] : null; }
}
