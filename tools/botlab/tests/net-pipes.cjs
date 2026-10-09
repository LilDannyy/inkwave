// The pipe engine online on Gulper Aquarium (src/game/pipes.js; aquarium ENGINE.md §3.9, §4.7, step 9 / 11): online
// Practice on the real stage, the host's bots frozen and placed by the test.
//   WIPSTAGES=1 CLIENTS=2 Q0=autopilot Q1='autopilot&netlag=80&netjitter=40' NET=tools/botlab/tests/net-pipes.cjs \
//     tools/botlab/run.sh tools/botlab/netpage.cjs
//   1. B (the guest) walks into the Express and rides it: on A's screen B's drawn position stays within 0.05 m of the
//      centreline + lane every frame of the ride (drawn from the [0] record on B's timeline, never extrapolated off the
//      tube); on B's own screen it is the path exactly; A sees the ride from the suck to the pop
//   2. A's exit ring for that end is lit from B's suck end to B's pop: the two screens' lit spans agree within 0.15 s
//   3. A's bot shoots B mid-ride: no 'hit', B's hp unchanged; after B's touchdown the same shot hurts
//   4. two-way traffic: B and a bot ride the Gulper Run in opposite directions at once and pop at the right ends on
//      both screens; the turf round both landings is the same on A and B
//   5. the tide on two screens (the Kelp Lines' period set to 20 s on every screen for the test): A and B report the
//      same flow() state at the same stage-clock times
//   6. a late joiner C, opening while a bot is mid-ride: C draws it within 0.3 m of the centreline (projection from
//      the tick flag), C's applyHit drops a shot at it, and C's first frame has the host's tide state
//   7. a host change mid-ride and mid-tide: a bot enters the Gulper Run, A leaves; B adopts the bot mid-ride and it
//      pops within ±0.3 s of when it would have; C draws it within 0.1 m of the centreline across the handoff; the
//      tide's next flip lands on the same tick on B and C
module.exports = async ({ clients, R, wait, open, close, say }) => {
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const HELP = `(async () => {
    if (window.__pp) return 1;
    const PD = await import('./src/world/pipes-data.js'), CTX = await import('./src/core/ctx.js');
    const hits = {}; CTX.on('hit', (e) => { if (e && e.victim) hits[e.victim.nid] = (hits[e.victim.nid] || 0) + 1; });
    const m = () => __G.match, P = () => __G.match && __G.match.pipes;
    const byNid = (n) => m().actors.find((a) => a.nid === n);
    const S = {};
    const centre = (lg, s, dir) => { const q = PD.legAt(lg, s, {}); return [q.x + q.sx * 0.28 * dir, q.y - 0.3, q.z + q.sz * 0.28 * dir]; };
    window.__pp = {
      // (owned squidkids stand still: their brains off, any special they had going ended, the special meter emptied)
      freeze() { for (const a of m().actors) if (a.bot && !a.remote) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; if (a.specialActive) __G.specials?.end?.(a, 'test'); a.specialActive = null; a.superJumpState = null; a.special = 0; if (!a.alive) a.respawn(); a.hp = 100; } return 1; },
      put(n, x, y, z) { const a = byNid(n); a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.netTp = (a.netTp || 0) + 1; a.pipeCd = 0; return 1; },
      // walk owned actor n into end i for up to secs (intent each frame) — resolves when captured
      push(n, i, secs = 1.5) {
        const a = byNid(n), e = P().ends[i], t0 = performance.now();
        return new Promise((res) => { const f = () => { if (a.pipe || performance.now() - t0 > secs * 1000) { a.intent.move.set(0, 0, 0); res(!!a.pipe); return; } a.intent.move.set(-e.out[0], 0, -e.out[2]); requestAnimationFrame(f); }; f(); });
      },
      approach(n, i, back = 0.1) { const e = P().ends[i]; return this.put(n, e.approach[0] + e.out[0] * back, e.approach[1], e.approach[2] + e.out[2] * back); },
      ride(n, legId, k) { return P().debugRide(byNid(n), legId, k) ? 1 : 0; },
      // sample actor n every frame for secs: its ride as this screen draws it
      sample(n, secs) {
        const a = byNid(n), s = S[n] = { rows: 0, ride: 0, maxD: 0, phases: [], litOn: null, litOff: null, exit: -1, popEnd: -1, enterT: null, popT: null, gaps: 0, after: 0, maxDAfter: 0, hps: [] };
        const t0 = performance.now();
        const f = () => {
          const t = performance.now(), p = a.pipe;
          s.rows++;
          const ph = p ? p.phase : '-';
          if (s.phases[s.phases.length - 1] !== ph) s.phases.push(ph);
          // (a proxy's ride starts on this screen a playback delay after its owner started it: that delay, to put the
          // pop on the owner's clock)
          if (p && s.enterT === null) { s.enterT = t; const pr = a.remote && __G.netm && __G.netm._peer(a.owner); s.enterLag = pr && pr.init && pr.tr !== undefined ? t / 1000 - pr.off - pr.tr : 0; }
          if (p && p.phase === 'ride' && !p.held) {
            const lg = P().legs[p.leg], c = centre(lg, p.s, p.dir), d = Math.hypot(a.pos.x - c[0], a.pos.y - c[1], a.pos.z - c[2]);
            s.ride++; s.maxD = Math.max(s.maxD, d); s.exit = p.exit;
            if (s.mark && t > s.mark) { s.after++; s.maxDAfter = Math.max(s.maxDAfter, d); }
          }
          // (the lit span on this screen's wall clock, and on the rider's owner's timeline: the ride's own time base)
          if (s.exit >= 0) { const L = P().lit[s.exit]; if (L.n && s.litOn === null) { s.litOn = t; s.litOnT = p ? P()._T(p) : null; } if (!L.n && s.litOn !== null && s.litOff === null) { s.litOff = t; s.litOffT = p ? P()._T(p) : null; } }
          if (p && p.phase === 'pop' && s.popT === null) { s.popT = t; s.popEnd = p.exit; }
          if (s.enterT !== null && !p && s.popT === null && ph === '-') s.gaps++;
          if (t - t0 < secs * 1000) requestAnimationFrame(f);
          else s.done = true;
        };
        f();
        return 1;
      },
      mark(n) { S[n].mark = performance.now(); return 1; },
      got(n) { const s = S[n]; return s ? { ...s, lit: s.litOn !== null && s.litOff !== null ? +((s.litOff - s.litOn) / 1000).toFixed(3) : null, litT: s.litOnT != null && s.litOffT != null ? +(s.litOffT - s.litOnT).toFixed(3) : null } : null; },
      flow() { const f = P().flow(); return f && { dir: f.dir, phase: f.phase, t: +m().stage.t.toFixed(2) }; },
      period(T) { for (const l of P().legs) if (l.flip) l.flip.every = T; P()._tideSync(m().stage.t, true); return 1; },
      hp(n) { return byNid(n).hp; },
      hits(n) { return hits[n] || 0; },
    };
    return 1;
  })()`;
  // ---- the room: online Practice on Gulper Aquarium, 2 host bots
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'aquarium', time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  await B.until(`__G.net.lobby.map === 'aquarium' && __G.net.lobby.mode === 'practice'`, 10000).catch(() => {});
  const lob = await J(B, `({ map: __G.net.lobby.map, mode: __G.net.lobby.mode })`);
  R('the room: online Practice on Gulper Aquarium (WIPSTAGES lists the stage under construction)', lob.map === 'aquarium' && lob.mode === 'practice', lob);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.pipes`, 120000, 250);
  await wait(3000);
  for (const c of [A, B]) { await c.js(HELP); await c.js(`__pp.freeze()`); }
  const ids = await J(A, `(() => { const m = __G.match; return { a: __G.local.nid, b: m.actors.find((x) => x.remote && !x.isBot).nid, bots: m.actors.filter((x) => x.isBot && !x.remote).map((x) => [x.nid, x.team]) }; })()`);
  const bNid = ids.b, aNid = ids.a, bTeam = await B.js(`__G.local.team`);
  const enemyBot = (ids.bots.find((x) => x[1] !== bTeam) || ids.bots[0])[0], otherBot = (ids.bots.find((x) => x[0] !== enemyBot) || ids.bots[0])[0];
  say('nids', JSON.stringify({ aNid, bNid, bTeam, bots: ids.bots }));
  const ends = await J(A, `__G.match.pipes.ends.map((e) => ({ i: e.i, leg: __G.match.pipes.legs[e.leg].id, k: e.k, land: e.land }))`);
  const endOf = (leg, k) => ends.find((e) => e.leg === leg && e.k === k).i;

  // ---- 1–3: B walks into the Express; A watches; A's bot shoots B mid-ride
  const xIn = endOf('express', 0);
  await B.js(`__pp.freeze()`);
  await B.js(`__pp.approach(${bNid}, ${xIn})`);
  await wait(600);
  await A.js(`__pp.sample(${bNid}, 6)`);
  await B.js(`__pp.sample(${bNid}, 6)`);
  const capB = await B.js(`__pp.push(${bNid}, ${xIn})`);
  await wait(900);
  // mid-ride: A's bot fires at B (the shooter's screen judges: behind the glass, no 'hit')
  const shot = await J(A, `(() => { const m = __G.match, b = m.actors.find((x) => x.nid === ${bNid}), s = m.actors.find((x) => x.nid === ${enemyBot}); const h0 = __pp.hits(${bNid}); __G.projectiles.applyHit(s, b, 60, 'shooter'); return { riding: !!(b.pipe && b.pipe.phase === 'ride'), phase: b.pipe && b.pipe.phase, guard: m.pipes.damageGuard(b), hitEvents: __pp.hits(${bNid}) - h0, team: [s.team, b.team] }; })()`);
  await wait(5000);
  const sa = await J(A, `__pp.got(${bNid})`), sb = await J(B, `__pp.got(${bNid})`);
  const hpB = await B.js(`__pp.hp(${bNid})`);
  R('1. B walks into the Express on its own screen (captured), and rides it there exactly on the path (≤ 0.005 m)', capB && sb.ride > 20 && sb.maxD < 0.005, { capB, frames: sb.ride, maxD: sb.maxD, phases: sb.phases });
  R('1. on A\'s screen B\'s rider is drawn within 0.05 m of the centreline + lane every frame of the ride (from the [0] record; netlag 80 ± 40 on B)', sa.ride > 20 && sa.maxD < 0.05 && sa.phases.join() === '-,suck,ride,pop,-', { frames: sa.ride, maxD: sa.maxD, phases: sa.phases });
  // (compared on B's timeline, the ride's own time base on both screens: A replays B on a playback clock that steers
  // ±8–25 % to keep its buffer, so A's wall-clock span may differ by that stretch — shown, checked within 0.25 s)
  R('2. A\'s exit ring is lit from B\'s suck end to B\'s pop: on B\'s timeline the lit spans agree within 0.05 s (A ' + sa.litT + ' s, B ' + sb.litT + ' s; wall clock A ' + sa.lit + ' s, B ' + sb.lit + ' s)',
    sa.litT !== null && sb.litT !== null && Math.abs(sa.litT - sb.litT) <= 0.05 && Math.abs(sa.lit - sb.lit) <= 0.25 && sa.popEnd === sb.popEnd, { a: [sa.litOnT, sa.litOffT], b: [sb.litOnT, sb.litOffT], wall: [sa.lit, sb.lit], popEnd: [sa.popEnd, sb.popEnd] });
  R('3. A\'s bot shooting B mid-ride: the shooter\'s screen drops it (behind the glass: no \'hit\' event), B\'s hp unchanged', shot.riding && shot.guard && shot.hitEvents === 0 && hpB >= 99.5, { shot, hpB });
  // after touchdown the same shot hurts (the shooter's screen sends it; B's screen applies it)
  await A.js(`(() => { const m = __G.match; __G.projectiles.applyHit(m.actors.find((x) => x.nid === ${enemyBot}), m.actors.find((x) => x.nid === ${bNid}), 30, 'shooter'); return 1; })()`);
  await B.until(`__pp.hp(${bNid}) < 99`, 6000).catch(() => {});
  const hpB2 = await B.js(`__pp.hp(${bNid})`);
  R('3. after B\'s touchdown the same shot hurts (judged on A, applied on B)', hpB2 < 99, { hp: hpB2 });

  // ---- 4: two-way traffic on the Gulper Run
  const gE = endOf('gulper', 0), gW = endOf('gulper', 1);
  for (const c of [A, B]) await c.js(`__pp.freeze()`);
  await B.js(`__pp.approach(${bNid}, ${gE})`);
  await A.js(`__pp.approach(${otherBot}, ${gW})`);
  await wait(800);
  for (const c of [A, B]) { await c.js(`__pp.sample(${bNid}, 4)`); await c.js(`__pp.sample(${otherBot}, 4)`); }
  await Promise.all([B.js(`__pp.push(${bNid}, ${gE})`), A.js(`__pp.push(${otherBot}, ${gW})`)]);
  await wait(4300);
  const t4 = { aB: await J(A, `__pp.got(${bNid})`), aO: await J(A, `__pp.got(${otherBot})`), bB: await J(B, `__pp.got(${bNid})`), bO: await J(B, `__pp.got(${otherBot})`) };
  R('4. two-way traffic: B east → west and a bot west → east on the Gulper Run at once; each pops at the right end on both screens',
    t4.aB.popEnd === gW && t4.bB.popEnd === gW && t4.aO.popEnd === gE && t4.bO.popEnd === gE && t4.aB.maxD < 0.05 && t4.bO.maxD < 0.05, { B: [t4.aB.popEnd, t4.bB.popEnd], bot: [t4.aO.popEnd, t4.bO.popEnd], want: [gW, gE], maxD: [t4.aB.maxD, t4.bO.maxD] });
  await wait(1500);
  // the turf round both landings: the same on A and B (the pop splats are records like any other)
  const turf = async (c) => J(c, `(() => { const out = []; for (const i of [${gE}, ${gW}]) { const e = __G.match.pipes.ends[i]; const r = __G.paint.regionStats(e.land[0], e.land[1], e.land[2], 2.0, 0); out.push([r.own, r.enemy, r.empty]); } return out; })()`);
  const ta = await turf(A), tb = await turf(B);
  R('4. the turf round both landings is the same on A and B', JSON.stringify(ta) === JSON.stringify(tb) && ta.some((x) => x[0] + x[1] > 0), { a: ta, b: tb });

  // ---- 5: the tide on two screens (a 20 s period for the test, set on every screen)
  for (const c of [A, B]) await c.js(`__pp.period(20)`);
  const flows = [];
  for (let i = 0; i < 12; i++) { const [fa, fb] = await Promise.all([J(A, `__pp.flow()`), J(B, `__pp.flow()`)]); flows.push([fa, fb]); await wait(1700); }
  const agree = flows.filter(([fa, fb]) => fa.dir === fb.dir && fa.phase === fb.phase).length;
  const skew = Math.max(...flows.map(([fa, fb]) => Math.abs(fa.t - fb.t)));
  const nearEdge = flows.filter(([fa, fb]) => !(fa.dir === fb.dir && fa.phase === fb.phase)).every(([fa]) => { const k = fa.t % 20; return Math.min(Math.abs(k - 10), Math.abs(k - 17), Math.abs(k - 20), Math.abs(k), Math.abs(k - 1)) < 0.6; });
  R('5. the tide on two screens: A and B report the same flow() at the same moments (their stage clocks within 0.4 s; any mismatch only at a change instant)', skew < 0.4 && nearEdge && agree >= 10, { agree, of: flows.length, skew, sample: flows.slice(0, 4) });

  // ---- 6: a late joiner while a bot is mid-ride
  const botLeg = await A.js(`(() => { const b = __G.match.actors.find((x) => x.nid === ${otherBot}); return b.team === 0 ? 'express' : 'express~'; })()`);
  const xIn2 = endOf(botLeg, 0);   // (the bot's own team's Express: the long one, 2.5 s)
  const C = await open(2, 'autopilot');
  await C.js(HELP);
  const joined = C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
  // start the bot's ride so that C's first frames land inside it
  await joined;
  await C.until(`__G.net.state === 'match' && __G.match && __G.match.practice && !!__G.match.pipes && __G.netm && !__G.netm.stagePending`, 120000, 200);
  for (const c of [A, B]) await c.js(`__pp.period(20)`);
  await C.js(`__pp.period(20)`);
  const fC0 = await J(C, `__pp.flow()`), fA0 = await J(A, `__pp.flow()`);
  // (a joiner still compiling runs a few frames a second and its follower clock trails until it settles: compared again
  // once it has, within 10 s, as net-stagemods.cjs does)
  let fC1 = null, fA1 = null;
  for (let i = 0; i < 10; i++) { [fC1, fA1] = await Promise.all([J(C, `__pp.flow()`), J(A, `__pp.flow()`)]); if (Math.abs(fC1.t - fA1.t) < 0.6) break; await wait(1000); }
  const sameState = (x, y) => x.dir === y.dir && (x.phase === y.phase || [10, 17, 20, 0, 1].some((k) => Math.abs((y.t % 20) - k) < 1.1));
  R('6. a late joiner\'s first look at the tide is the host\'s (direction and phase); once its clock settles it is within 0.6 s of the host\'s', fC0 && fA0 && sameState(fC0, fA0) && Math.abs(fC1.t - fA1.t) < 0.6 && sameState(fC1, fA1), { first: { c: fC0, a: fA0 }, settled: { c: fC1, a: fA1 } });
  // C's own copy of the bot as it rides: projection from the tick flag (C missed the [0]) — simulated by riding the bot
  // and dropping its [0] for C: C samples and must place it on the line anyway
  await C.js(`(() => { window.__drop0 = true; const K = window.__kitg = window.__kitg || null; return 1; })()`);
  await C.js(`(async () => { const { KIT_GHOSTS } = await import('./src/game/kits/registry.js'); const g = KIT_GHOSTS.pipe.ghost; KIT_GHOSTS.pipe.ghost = (a, d) => { if (window.__drop0 && d && d[0] === 0 && a.nid === ${otherBot}) return; return g(a, d); }; return 1; })()`);
  await A.js(`__pp.approach(${otherBot}, ${xIn2}, 0)`);
  await wait(700);
  await C.js(`__pp.sample(${otherBot}, 5)`);
  await A.js(`__pp.ride(${otherBot}, '${botLeg}', 0)`);
  await wait(1200);
  const cHit = await J(C, `(() => { const m = __G.match, b = m.actors.find((x) => x.nid === ${otherBot}), me = __G.local; const hp0 = b.hp; let hit = 0; __G.projectiles.applyHit(me.team !== b.team ? me : m.actors.find((x) => x.team !== b.team), b, 60, 'shooter'); return { proj: !!(b.pipe && b.pipe.proj), flag: !!b.pipeNet, hp: b.hp, hp0 }; })()`);
  await wait(3500);
  const sc = await J(C, `__pp.got(${otherBot})`);
  await C.js(`(window.__drop0 = false, 1)`);
  R('6. a joiner that never saw the ride\'s [0] (C) draws the rider within 0.3 m of the centreline from the tick flag (projection), and its applyHit drops a shot at it',
    sc.ride > 10 && sc.maxD < 0.3 && cHit.proj && cHit.hp === cHit.hp0, { frames: sc.ride, maxD: sc.maxD, hit: cHit, phases: sc.phases });

  // ---- 7: a host change mid-ride and mid-tide
  // a bot enters the Gulper Run on A (the host); A leaves 0.6 s later; B (the new host) adopts it mid-ride
  await wait(2000);
  await A.js(`__pp.approach(${otherBot}, ${gE}, 0)`);
  await wait(500);
  for (const c of [B, C]) await c.js(`__pp.sample(${otherBot}, 6)`);
  const t0 = Date.now();
  await A.js(`__pp.ride(${otherBot}, 'gulper', 0)`);
  await wait(600);
  await C.js(`__pp.mark(${otherBot})`);
  const fBefore = await J(B, `__pp.flow()`);
  close(0);
  await B.until(`__G.net.isHost`, 20000, 100).catch(() => {});
  await wait(4500);
  const s7b = await J(B, `__pp.got(${otherBot})`), s7c = await J(C, `__pp.got(${otherBot})`);
  const expectPop = 0.25 + 25.44 / 18;   // s from the capture
  // (B saw the ride start a playback delay after A started it: B's pop is measured from A's start, on A's clock)
  const popB = s7b.popT !== null && s7b.enterT !== null ? (s7b.popT - s7b.enterT) / 1000 + (s7b.enterLag || 0) : null;
  R('7. after the host leaves mid-ride, the new host (B) adopts the bot and it pops at the far end within ±0.3 s of when it would have (on the old host\'s clock)', s7b.popEnd === gW && popB !== null && Math.abs(popB - expectPop) < 0.3, { popB, expectPop, enterLag: s7b.enterLag, raw: s7b.popT !== null ? (s7b.popT - s7b.enterT) / 1000 : null, end: s7b.popEnd, phases: s7b.phases, wall: (Date.now() - t0) / 1000 });
  R('7. the remaining guest (C) draws the rider within 0.1 m of the centreline across the handoff', s7c.after > 5 && s7c.maxDAfter < 0.1 && s7c.popEnd === gW, { after: s7c.after, maxDAfter: s7c.maxDAfter, maxD: s7c.maxD, phases: s7c.phases });
  // the tide carries on under the new host: B and C agree through the next change
  const fl = [];
  for (let i = 0; i < 8; i++) { const [fb, fc] = await Promise.all([J(B, `__pp.flow()`), J(C, `__pp.flow()`)]); fl.push([fb, fc]); await wait(1500); }
  // (the remaining guest's clock settles onto the new host's within a few seconds: the clocks are compared from the 4th
  // sample on, the flow states on every sample)
  const ag = fl.filter(([fb, fc]) => fb.dir === fc.dir && fb.phase === fc.phase).length, sk = Math.max(...fl.slice(3).map(([fb, fc]) => Math.abs(fb.t - fc.t)));
  const dirs = new Set(fl.map(([fb]) => fb.dir));
  R('7. the tide carries on under the new host: B and C report the same flow() through the next change (clocks within 0.4 s once settled)', sk < 0.4 && ag >= 7 && fBefore, { agree: ag, of: fl.length, skewSettled: sk, skewAll: fl.map(([fb, fc]) => +Math.abs(fb.t - fc.t).toFixed(2)), dirs: [...dirs], before: fBefore });
  say('done');
};
