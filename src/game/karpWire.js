// [b5-karp] The Bazookarp engine talks to the network only through a KarpWire (SPEC §5.1, §7.2):
//   host side    record(rec)   a discrete record, sent at once, carrying q        ['p' | 'u' | 'b' | 'd' | 'r' | 'w' | 'x' | 't' | 'e', q, …]
//                snapshot(rec) the 10 Hz 's' / 1 Hz 'S' snapshot, on the host's event timeline
//                toGuest(nid, msg)  'kd' (a claim refused while it stays free)
//                samples(a, since) → a remote carrier's REAL samples played since `since` ([{ t, x, y, z, alive }]), or null
//   guest side   claim(nid, ts, since, run, late) 'kc' (fs / fr / fl / fo) · decline(nid, q) 'kx' · reportRate(nid, rate, why, half, zone) 'kr' ·
//                reportFoot(nid, x, y, z, half, zone) 'kf'  (shell hits ride the guest's tick: objTargets.takeHits → 'kh')
//   both         on('claim' | 'decline' | 'rate' | 'foot' | 'hits' | 'refused', fn) · now() (the claim clock) · isHost
// LoopWire: offline — a host whose records go nowhere, except (tests) to a follower engine `delay` s later, and whose
// guest side can be driven by a test (its _emit plays a guest's message on the host).
// NetWire: online through G.netm (net/netmatch.js: 'bk' records at once, 'ks' snapshots on the timeline, the guest
// messages, kd to one guest; a remote carrier's real samples pushed by netmatch _sample → engine.onSamples; holdFor:
// the fuse hold before a remote carrier's Carp Blast). docs/NET.md's Bazookarp section is the whole protocol.
import { G } from '../core/ctx.js';

export class KarpWire {
  constructor() { this.h = {}; this.log = { rec: 0, snap: 0, claim: 0, rate: 0, foot: 0, decline: 0, refused: 0 }; }
  on(kind, fn) { (this.h[kind] || (this.h[kind] = [])).push(fn); return () => { const l = this.h[kind]; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }; }
  _emit(kind, d) { for (const f of this.h[kind] || []) f(d); }
  get isHost() { return true; }
  now() { return performance.now() / 1000; }
  // [karp-face] the host's clock now (snapshots are stamped with it): offline and on the host, its own
  hostNow() { return this.now(); }
  // [karp-face] review round 2: the host's id (a clock read from it stays that host's clock after a migration)
  hostId() { return null; }
  // [karp-face] review round 3: the floor offset to a peer (s) — receive − send at its fastest: the two clocks'
  // difference plus the fastest one-way trip from it — or null (offline, not known yet)
  off() { return null; }
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
  hostId() { return this._hostId() || null; }
  record(rec) { super.record(); if (this.nm && G.netm === this.nm && this.nm.isHost) this.nm._sendNow({ k: 'bk', e: rec }); }
  snapshot(rec) { super.snapshot(); if (this.nm && G.netm === this.nm && this.nm.isHost) this.nm._rec(['ks', rec]); }
  toGuest(nid, msg) { const a = this.nm?.byNid.get(nid); if (a && a.owner) this.nm.s.tr?.sendTo(a.owner, { k: 'kd', nid, ...msg }); }
  _toHost(d) { const h = this._hostId(); if (h && !this.nm.isHost) this.nm.s.tr?.sendTo(h, d); }
  // ([karp-face] fs: free since, its own screen; fr: already running in then, 0–1; fl: how late its 'free' moment was after
  // the burst on the host's clock read through ITS floor offset (fo) — the host adds half of fo + its own floor offset to
  // this guest (the two fastest one-way trips), which fl leaves out)
  claim(nid, ts, since, run = 0, late = null) {
    super.claim();
    const fo = this.off(this._hostId());
    this._toHost({ k: 'kc', nid, ts: Math.round(ts * 1000) / 1000, ...(Number.isFinite(since) ? { fs: Math.round(since * 1000) / 1000 } : {}),
      ...(run > 0 ? { fr: Math.round(run * 100) / 100, ...(Number.isFinite(late) ? { fl: Math.round(late * 1000) / 1000 } : {}), ...(Number.isFinite(late) && fo != null ? { fo: Math.round(fo * 1000) / 1000 } : {}) } : {}) });
  }
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
      case 'kc': {
        // ([karp-face] review round 3: how late its 'free' moment was on our clock — fl is on its floor read of our clock,
        // which leaves out the fastest one-way trip to it; half of the two floor offsets' sum is that trip, both ways
        // being alike. A claim without fo: its fl as it stands)
        let late = Number.isFinite(d.fl) ? d.fl : null;
        if (late != null && Number.isFinite(d.fo) && p && p.init) late += Math.max(0, Math.min(0.3, (p.off + d.fo) / 2));
        this._emit('claim', { actor: a, ts: (d.ts ?? 0) + (p ? p.off : 0), since: d.fs, run: +d.fr || 0, late });
        break;
      }
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
  // [karp-face] the host's clock now as this screen best knows it (a snapshot's age is hostNow(sender) − its t): on the
  // host its own; on a guest the sender's tick clock through that peer's offset (netmatch's floor of receive − send: the
  // clocks' difference plus the fastest one-way trip) plus the one-way delay — half this screen's round trip to the
  // relay plus half the sender's (the lobby's ping)
  off(id) { const p = id ? this.nm?.peers.get(id) : null; return p && p.init ? p.off : null; }
  hostNow(from) {
    const nm = this.nm;
    if (!nm || (nm.isHost && !from)) return this.now();
    const id = from || this._hostId(), p = id ? nm.peers.get(id) : null;
    return p && p.init ? this.now() - p.off + this.oneWay(id) : this.now();
  }
  oneWay(id) {
    const mine = this.nm?.s?.tr?.rtt || 0, pl = this.nm?.s?.lobby?.players?.find((q) => q.id === id), theirs = pl && pl.ping > 0 ? pl.ping : mine;
    return Math.min(0.4, (mine + theirs) / 2000);
  }
  // [karp-face] how long after the host's own actor touches it a guest's claim from an equally quick touch can still be
  // on its way (s): the round trip through the relay (both relay round trips: ours, its lobby ping) plus that peer's
  // playback delay (its tick spacing and how late its packets run: the jitter, and the tick its samples ride)
  rttTo(a) {
    const mine = this.nm?.s?.tr?.rtt || 0, pl = this.nm?.s?.lobby?.players?.find((q) => q.id === a?.owner), p = this.nm?.peers.get(a?.owner);
    return ((pl && pl.ping > 0 ? pl.ping : Math.max(mine, 40)) + mine) / 1000 + (p && p.init ? p.delay : 0.1);
  }
  // the newest sample a remote claimant sent (§7.3: claims are judged where it really is, not where we draw it)
  newest(a) { const b = a?.net?.buf; return b && b.length ? b[b.length - 1] : null; }
  // [karp-face] how long the host waits for a remote carrier's timeline to catch up before its Carp Blast (§7.5): that
  // peer's playback delay plus a frame, at most 0.3 s
  holdFor(a) { const p = this.nm?.peers.get(a?.owner); return Math.min(0.3, (p ? p.delay : 0.1) + 1 / 60); }
}
