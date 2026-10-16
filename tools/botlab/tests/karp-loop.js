// [b5-karp] The follower path offline (SPEC §10.1 karp-loop.js, WP1a's done criterion): the host engine and a SHADOW
// follower engine joined by LoopWire (0.1 s delay), on karpbox, deterministic (frozen clock, 60 Hz, bots off). The
// follower is what a guest's screen runs: its match is a proxy with follower = true whose actors are stand-ins for the
// host's players (remote, positions copied each frame), so it owns nobody and only follows records and snapshots.
//   • after EVERY discrete record (p · b · d · r · w · x · t · u · e) the follower's phase, holder, weirs, Gates,
//     overtime and result equal the host's at that record (counts within 1: they ride the 10 Hz snapshots), and at
//     every quiet point the counts are exactly the host's;
//   • a snapshot shuffled late (taken before a grant, delivered after it) is skipped: the follower keeps the carrier;
//   • the carrier's own Bubble Guard is gone on the follower once 'p' plays there;
//   • a grant to the follower's own player who is dead on its screen: the follower declines it (kx through its wire),
//     the host undoes it ('u'), and the follower detaches it — nobody holds it on either side, touched unchanged;
//   • a scripted match: burst, grab, carry, plant, re-pop, a splat (drop), a Bravo carry ending in a Carp Blast on its
//     own half (reset to the Pond), the declined grant, an S38a overtime whose window runs out (no-pickup).
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-loop.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER } = await import('./src/config.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF } = await import('./tools/botlab/karpbox.js');
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  if (m.mode !== 'bazookarp' || !m.karp) { R('a Bazookarp match on karpbox', false, { mode: m.mode }); return out; }
  dbg.freeze();
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  const floorY = (x, z) => { const y = G.level.groundHeight(x, z, 3); return y > -50 ? y : 0; };
  const put = (a, x, z, y = null) => { if (!a.alive) a.respawn(); a.superJumpState = null; a.pos.set(x, y ?? floorY(x, z), z); a.vel.set(0, 0, 0); a.grounded = false; a.smoothY = 0; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.climbing = false; idle(a); };
  const park = () => { for (const a of m.actors) { const p = G.level.spawnPads[a.team]; a.status.shield = 0; put(a, p.x + ((a.slot % 4) - 1.5) * 1.6, p.z + (a.team ? 2.5 : -2.5), p.y); } };
  // records name actors by nid: give the offline actors theirs for the test
  m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } });
  // ---- the host engine and its wire
  m.karp?.dispose(); G.level.layout.bazookarp = KARPBOX_DEF; G.paint.clear(); m.time = 250; m.state = 'playing';
  const hw = new LoopWire(); hw.delay = 0.1;
  const Kp = (m.karp = new Bazookarp(m, hw));
  const hostOT = G.objTargets;
  // ---- the shadow follower: a proxy match (follower) with stand-ins for every player
  const stand = new Map();
  for (const a of m.actors) stand.set(a.nid, { nid: a.nid, team: a.team, name: a.name, slot: a.slot, pos: a.pos.clone(), vel: new THREE.Vector3(), alive: a.alive, remote: true, isLocal: false, bot: null,
    carry: null, status: { shield: 0 }, _shieldOwner: false, specialActive: null, special: 0, stats: {}, weaponRunner: { reset() {}, charge: 0 }, character: null, weaponId: a.weaponId, form: 'kid', submerged: false, climbing: false,
    color: new THREE.Color(), specialReady: () => false, specialCost: () => 100, damage() { return false; }, splat() {}, _hold: false });
  const stands = [...stand.values()];
  const fm = Object.create(m); fm.follower = true; fm.actors = stands; fm.local = null; fm.endKarp = () => {};
  const fw = new LoopWire();
  // the follower's own player declining a grant: kx straight to the host's engine (the guest → host message)
  fw.decline = (nid, q) => { fw.log.decline++; hw._emit('decline', { actor: m.actors.find((a) => a.nid === nid), q }); };
  const F = new Bazookarp(fm, fw);
  const folOT = G.objTargets; G.objTargets = hostOT;
  hw.follower = F; hw.q.length = 0;
  // ---- per record: the host's view at the end of the frame that produced it; per pump: the follower's view after it
  const view = (E) => ({ phase: E.phase, holder: E.holder ? E.holder.nid : -1, lowered: [...E.lowered], gateUp: [...E.gateUp], overtime: !!E.overtime, losing: E.overtime ? E.otLosing : -1, winner: E.winner ?? null, reason: E.reason ?? null, count: [...E.count] });
  const hostAt = new Map(), recLog = [], mism = [], checked = new Set();
  let frameRecs = [];
  const recOrig = hw.record.bind(hw);
  let shuffleNextP = false, stale = null;
  hw.record = (rec) => {
    recOrig(rec); frameRecs.push(rec[1]); recLog.push(rec[0] + rec[1]);
    if (rec[0] === 'p' && shuffleNextP) {   // the snapshot taken just before this grant: delivered 0.15 s after it
      shuffleNextP = false;
      const due = hw.q[hw.q.length - 1][0];
      const snaps = hw.q.filter((e) => e[1] === 's' && e[0] <= due);
      if (snaps.length) { const sn = snaps[snaps.length - 1]; sn[0] = due + 0.15; stale = { q: sn[2][1], ph: sn[2][3], holder: sn[2][7], pq: rec[1] }; }
    }
  };
  const snapsSeen = [];
  const neOrig = F.netEvent.bind(F);
  F.netEvent = (e, s) => { if (e[0] === 's' || e[0] === 'S') snapsSeen.push({ q: e[1], lastQ: F.lastQ, ph: e[3], holder: e[7] }); return neOrig(e, s); };
  const same = (h, f, exact) => h.phase === f.phase && h.holder === f.holder && JSON.stringify(h.lowered) === JSON.stringify(f.lowered) && JSON.stringify(h.gateUp) === JSON.stringify(f.gateUp) && h.overtime === f.overtime && h.losing === f.losing && h.winner === f.winner && h.reason === f.reason
    && (exact ? JSON.stringify(h.count) === JSON.stringify(f.count) : Math.abs(h.count[0] - f.count[0]) <= 1 && Math.abs(h.count[1] - f.count[1]) <= 1);
  // the host's view once the records made since the last seal are all out (the test's own actions between frames, a
  // frame's step, the follower's kx inside a pump)
  const seal = () => { if (frameRecs.length) { hostAt.set(frameRecs[frameRecs.length - 1], view(Kp)); frameRecs = []; } };
  const tick = () => {
    seal();
    dbg.step(1000 / 60);
    seal();
    for (const a of m.actors) { const s = stand.get(a.nid); if (!s) continue; s.pos.copy(a.pos); if (!s._hold) s.alive = a.alive; s.form = a.form; s.submerged = !!a.submerged; s.climbing = !!a.climbing; }
    // (once the host's engine has ended, its clock — LoopWire's — stops: what is still queued goes out now)
    if (Kp.winner != null) for (const e of hw.q) e[0] = Math.min(e[0], hw.now());
    const q0 = F.lastQ;
    hw.pump();
    seal();
    if (F.lastQ !== q0 && hostAt.has(F.lastQ) && !checked.has(F.lastQ)) {
      checked.add(F.lastQ);
      const rec = recLog.find((r) => +r.slice(1) === F.lastQ) || '';
      // (a grant the follower declined differs on purpose until its 'u': L3 checks that path)
      if (!(F._declined && F._declined.q === F.lastQ)) {
        const h = hostAt.get(F.lastQ), f = view(F), exact = /^[we]/.test(rec);
        if (!same(h, f, exact)) mism.push({ q: F.lastQ, rec, host: h, follower: f });
      }
    }
    G.objTargets = folOT; try { F.update(1 / 60); } finally { G.objTargets = hostOT; }
  };
  const run = (s, until = null) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { tick(); if (until && until()) return true; } return false; };
  const quiet = (tag) => { run(0.35); const h = view(Kp), f = view(F); return { tag, ok: same(h, f, true), h, f }; };
  const quiets = [];
  const grantTo = (a, x, z) => { put(a, x, z); return run(0.6, () => Kp.holder === a); };

  try {
    park(); run(0.3);
    quiets.push(quiet('start'));
    // burst (Alpha), grab with its own Bubble Guard (on the follower's stand-in), the late snapshot
    put(A[1], 0, -6); Kp.shell.add(0, 2000, A[1]); run(0.4);
    const sA = stand.get(A[0].nid); sA._shieldOwner = true; sA.status.shield = 4;
    shuffleNextP = true;
    const g1 = grantTo(A[0], Kp.pos.x, Kp.pos.z); run(0.4);
    const bubbleGone = sA.status.shield === 0, folHolder = F.holder?.nid;
    const staleSeen = stale && snapsSeen.find((s) => s.q === stale.q && s.lastQ >= stale.pq);
    R('L1 §7.2: a snapshot taken before a grant and delivered after it is skipped — the follower keeps the carrier (phase, holder)', g1 && !!stale && !!staleSeen && stale.ph !== 3 && F.phase === 'carried' && folHolder === A[0].nid, { stale, staleSeen, phase: F.phase, holder: folHolder });
    R('L2 §2.3: the carrier\'s own Bubble Guard is gone on the follower once \'p\' plays there', bubbleGone, { shield: sA.status.shield });
    // carry to the weir and plant ('w'); the shell re-forms on it
    A[0].intent.move.set(0, 0, 1); run(10, () => Kp.lowered[0]); idle(A[0]); run(1.2);
    quiets.push(quiet('planted'));
    // re-pop, re-grab, carry a little, a splat ('d')
    put(A[1], Kp.pos.x, Kp.pos.z - 6); Kp.shell.add(0, 600, A[1]); run(0.4);
    grantTo(A[0], Kp.pos.x, Kp.pos.z); A[0].intent.move.set(0, 0, 1); run(1.0); idle(A[0]);
    quiets.push(quiet('carrying'));
    A[0].splat(B[1], 'weapon'); run(1.2);
    quiets.push(quiet('dropped'));
    // Bravo bursts and grabs; its fuse runs out on its own half: the Carp Blast ('x') and the reset flight ('r')
    put(B[1], Kp.pos.x, Kp.pos.z + 6); Kp.shell.add(1, 600, B[1]); run(0.4);
    grantTo(B[0], Kp.pos.x, Kp.pos.z); run(0.2); Kp.fuse = 0.05; run(0.3);
    const blasted = Kp.stats.blasts.own === 1;
    run(2.6);
    quiets.push(quiet('reset to the Pond'));
    // a grant to the follower's own player, dead on its screen: kx → u
    const sB = stand.get(B[2].nid);
    put(B[1], 0, 6); Kp.shell.add(1, 600, B[1]); run(0.4);
    const pre = { touched: Kp.touched, lc: Kp.lastCarrier };
    sB.remote = false; sB._hold = true; sB.alive = false;
    put(B[2], Kp.pos.x, Kp.pos.z);
    const gotB = run(0.6, () => Kp.holder === B[2]);
    put(B[2], 0, 12);   // (its screen's player is dead: the host's copy steps away)
    run(0.5);
    const und = { gotB, kx: fw.log.decline, declined: Kp.stats.declined, host: view(Kp), fol: view(F), touched: Kp.touched === pre.touched, lc: Kp.lastCarrier === pre.lc, u: recLog.filter((r) => r[0] === 'u').length };
    sB.remote = true; sB._hold = false;
    R('L3 §7.3 step 6: a grant to the follower\'s own player, dead there, is declined (kx) — the host undoes it (u) and the follower detaches it; touched and the last carrier unchanged',
      gotB && und.kx === 1 && und.declined === 1 && und.u === 1 && und.host.holder === -1 && und.fol.holder === -1 && und.host.phase === 'free' && und.fol.phase === 'free' && und.touched && und.lc, und);
    // an S38a overtime, its window runs out: 'no-pickup'
    Kp.count = [60, 100]; Kp.reachT = [5, 0]; Kp.lastCarrier = { team: 0, how: 'splat', left: 5 }; m.time = 0.05;
    run(0.5);
    const ot = { host: Kp.overtime, fol: F.overtime, losing: [Kp.otLosing, F.otLosing] };
    run(11.5, () => F.winner != null); run(0.2);
    quiets.push({ tag: 'end', ok: same(view(Kp), view(F), true), h: view(Kp), f: view(F) });
    R('L4 S38a / S39b: overtime starts and its window runs out on both — the same winner, reason and counts', ot.host && ot.fol && ot.losing[0] === 1 && ot.losing[1] === 1 && Kp.reason === 'no-pickup' && F.reason === 'no-pickup' && F.winner === Kp.winner, { ot, host: view(Kp), fol: view(F) });
    const kinds = [...new Set(recLog.map((r) => r[0]))].sort().join('');
    R('L5 §7.2: after EVERY discrete record the follower\'s phase, holder, weirs, Gates, overtime and result equal the host\'s at that record (counts within 1)',
      mism.length === 0 && checked.size >= 13 && ['b', 'd', 'e', 'p', 'r', 't', 'u', 'w', 'x'].every((k) => kinds.includes(k)) && blasted, { records: recLog, compared: [...checked].sort((a, b) => a - b), kinds, mism: mism.slice(0, 3) });
    R('L6 §7.2: at every quiet point (start, planted, carrying, dropped, reset, the end) the follower\'s counts are exactly the host\'s too', quiets.length === 6 && quiets.every((q) => q.ok), quiets.map((q) => ({ tag: q.tag, ok: q.ok, h: q.h.count, f: q.f.count, ph: [q.h.phase, q.f.phase] })));
  } catch (e) { R('HARNESS: the test threw', false, { err: String(e && e.stack || e).slice(0, 600), records: recLog }); }
  try { F.dispose(); } catch { /* */ }
  G.objTargets = hostOT;
  for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; }
  return out;
})()
