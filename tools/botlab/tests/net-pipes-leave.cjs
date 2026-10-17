// The pipe engine when players leave mid-ride, in a timed online Turf War on Gulper Aquarium (src/game/pipes.js adopt /
// carryRemote; aquarium ENGINE.md §3.5 rule 8, §4.7; LEAD-REVIEW round 2, the blocker: adopt() threw, netmatch.onLeave
// stopped half-way, the new host stayed a follower, the match never ended and the old host's other bots froze)
//   WIPSTAGES=1 CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-pipes-leave.cjs \
//     tools/botlab/run.sh tools/botlab/netpage.cjs
//   1. a guest (C) rage-quits inside the Express: the host (A) adopts its squidkid mid-ride, with no error; the kid is
//      A's (not a proxy, with a brain) and pops at the far end on A and on B
//   2. the host (A) leaves while one of its bots rides the Express: B is the host and no longer a follower, every
//      squidkid A ran is B's, no error; the bot pops at the far end on B
//   3. the match still ends: B's clock run down to 1.5 s, it reaches the judge (control: the same with nobody riding
//      passed before the fix; with a rider it hung at 0:00)
//   and no page logs an error or a warning
module.exports = async ({ clients, R, wait, close, say }) => {
  const [A, B, C] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const HELP = `(() => {
    if (window.__pl) return 1;
    const m = () => __G.match, P = () => __G.match && __G.match.pipes, byNid = (n) => m().actors.find((a) => a.nid === n);
    const S = {};
    window.__pl = {
      freeze() { for (const a of m().actors) if (a.bot && !a.remote) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } return 1; },
      put(n, i) { const a = byNid(n), e = P().ends[i]; a.pos.set(e.approach[0], e.approach[1], e.approach[2]); a.vel.set(0, 0, 0); a.netTp = (a.netTp || 0) + 1; a.pipeCd = 0; return 1; },
      ride(n, legId, k) { return P().debugRide(byNid(n), legId, k) ? 1 : 0; },
      // actor n's ride as this screen sees it, every frame for secs: its phases and the end it popped from
      sample(n, secs) {
        const a = byNid(n), s = S[n] = { phases: [], popEnd: -1 }, t0 = performance.now();
        const f = () => { const p = a.pipe, ph = p ? p.phase : '-'; if (s.phases[s.phases.length - 1] !== ph) s.phases.push(ph); if (p && p.phase === 'pop' && s.popEnd < 0) s.popEnd = p.exit; if (performance.now() - t0 < secs * 1000) requestAnimationFrame(f); };
        f();
        return 1;
      },
      got(n) { return S[n] || null; },
      end(leg, k) { return P().legs.find((l) => l.id === leg).ends[k].i; },
    };
    return 1;
  })()`;
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: 'aquarium', time: 'day', difficulty: 'easy' }); 1`);
  for (const [c, nm] of [[B, 'Guesty'], [C, 'Leavy']]) await c.js(`__G.net.join(${JSON.stringify(code)}, '${nm}').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 3`, 20000);
  for (const c of [B, C]) { await c.until(`__G.net.lobby.map === 'aquarium'`, 10000).catch(() => {}); await c.js(`__G.net.setMe({ ready: true }); 1`); }
  await wait(800);
  const lob = await J(A, `({ map: __G.net.lobby.map, mode: __G.net.lobby.mode, n: __G.net.lobby.players.length })`);
  R('the room: online Turf War on Gulper Aquarium, three players', lob.map === 'aquarium' && lob.mode === 'turf' && lob.n === 3, lob);
  await A.js(`__G.net.start()`);
  for (const c of [A, B, C]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.state === 'playing' && !!__G.match.pipes`, 240000, 250);
  await wait(2500);
  for (const c of [A, B, C]) { await c.js(HELP); await c.js(`__pl.freeze()`); }
  const xIn = await A.js(`__pl.end('express', 0)`), xOut = await A.js(`__pl.end('express', 1)`);
  const errAt = (c, n) => c.log.slice(n).filter((l) => /error|TypeError|ReferenceError|Uncaught/i.test(l));

  // ---- 1: a guest rage-quits inside a pipe
  const cNid = await C.js(`__G.local.nid`), aId = await A.js(`__G.netm.myId`), cId = await C.js(`__G.netm.myId`);
  await C.js(`__pl.put(${cNid}, ${xIn})`);
  await wait(700);
  for (const c of [A, B]) await c.js(`__pl.sample(${cNid}, 6)`);
  await C.js(`__pl.ride(${cNid}, 'express', 0)`);
  await wait(900);
  const midC = await J(A, `(() => { const a = __G.match.actors.find((x) => x.nid === ${cNid}); return { phase: a.pipe && a.pipe.phase, remote: !!a.remote }; })()`);
  const logA0 = A.log.length;
  close(2);
  await A.until(`(() => { const a = __G.match.actors.find((x) => x.nid === ${cNid}); return !!a && a.owner === ${JSON.stringify(aId)}; })()`, 20000, 100).catch(() => {});
  await wait(3500);
  const c1 = await J(A, `(() => { const a = __G.match.actors.find((x) => x.nid === ${cNid}), me = __G.netm.myId; return a ? { owned: a.owner === me, remote: !!a.remote, brain: !!a.bot, pipe: a.pipe ? a.pipe.phase : null, cd: +(a.pipeCd || 0).toFixed(2), adopt: __G.match.pipes.events.filter((e) => e[0] === 'pipe:adopt' && e[1].nid === ${cNid}).length } : null; })()`);
  const sA1 = await J(A, `__pl.got(${cNid})`), sB1 = await J(B, `__pl.got(${cNid})`);
  R('1. a guest leaving inside the Express: the host adopts its squidkid mid-ride (no error), the kid is the host\'s own (not a proxy, with a brain)',
    midC.phase === 'ride' && midC.remote && c1 && c1.owned && !c1.remote && c1.brain && c1.adopt === 1 && !errAt(A, logA0).length, { midC, after: c1, errA: errAt(A, logA0).slice(0, 3), cId });
  R('1. … and it pops at the Express\'s far end on the host and on the other guest', sA1 && sA1.popEnd === xOut && sB1 && sB1.popEnd === xOut, { A: sA1, B: sB1, want: xOut });

  // ---- 2: the host leaves while one of its bots rides
  await A.js(`__pl.freeze()`);
  const hostBots = await J(A, `__G.match.actors.filter((x) => x.isBot && !x.remote).map((x) => x.nid)`);
  const rider = hostBots.find((n) => n !== cNid) ?? hostBots[0];
  await A.js(`__pl.put(${rider}, ${xIn})`);
  await wait(700);
  await B.js(`__pl.sample(${rider}, 7)`);
  await A.js(`__pl.ride(${rider}, 'express', 0)`);
  await wait(900);
  const midA = await J(B, `(() => { const a = __G.match.actors.find((x) => x.nid === ${rider}); return { phase: a.pipe && a.pipe.phase, remote: !!a.remote }; })()`);
  const logB0 = B.log.length;
  close(0);
  await B.until(`__G.net.isHost`, 20000, 100).catch(() => {});
  await wait(1500);
  const h = await J(B, `(() => { const m = __G.match, me = __G.netm.myId; return { isHost: !!__G.net.isHost, follower: m.follower, state: m.state, bots: m.actors.filter((x) => x.isBot).map((x) => [x.nid, x.owner === me, !!x.remote, !!x.bot]), adopt: m.pipes.events.filter((e) => e[0] === 'pipe:adopt').map((e) => e[1].nid) }; })()`);
  R('2. the host leaving while its bot rides the Express: B is the host and not a follower, every squidkid A ran is B\'s own (not a proxy, with a brain), no error on B',
    midA.phase === 'ride' && midA.remote && h.isHost && h.follower === false && h.bots.length >= hostBots.length && h.bots.every((b) => b[1] && !b[2] && b[3]) && h.adopt.includes(rider) && !errAt(B, logB0).length,
    { midA, ...h, hostBots, errB: errAt(B, logB0).slice(0, 3) });
  await wait(4000);
  const sB2 = await J(B, `__pl.got(${rider})`);
  R('2. … and the bot pops at the Express\'s far end on B', sB2 && sB2.popEnd === xOut && sB2.phases.includes('pop'), { B: sB2, want: xOut });

  // ---- 3: the match still ends under the new host
  await B.js(`(__G.match.time = 1.5, 1)`);
  await B.until(`__G.match.state !== 'playing' || !!__G.match.result || __G.net.state !== 'match'`, 30000, 250).catch(() => {});
  const fin = await J(B, `(() => { const m = __G.match; return { state: m && m.state, time: m && +m.time.toFixed(2), result: !!(m && m.result), follower: m && m.follower, netState: __G.net.state }; })()`);
  R('3. the timed match ends on the new host when its clock runs out (it reaches the judge)', fin.state !== 'playing' || fin.result || fin.netState !== 'match', fin);
  const logs = [A, B, C].map((c) => [...new Set(c.log)].slice(0, 4));
  R('no page (A, B or C) logged an error or a warning', logs.every((l) => !l.length), { logs });
  say('done');
};
