// [karp-face] Bazookarp online, the package's "done means" (SPEC §11 WP2): a three-client room plays a FULL match
// through a host migration, nothing staged. Host A on Alpha, guests B (Bravo) and C (Alpha), bots filling the teams,
// every kid played by its own screen's autopilot brain (the bots' Bazookarp roles), the bots run by the host:
//   1. the room takes the (hidden) mode on a stage with a Bazookarp layout; the match starts on all three; the relay
//      room is locked
//   2. play on until the Bazookarp has been carried (or 150 s of match time); then, mid-carry if a carry is on, host A's
//      client leaves
//   3. a guest becomes the host: it runs the rules (not a follower), the other guest follows it; both agree on the
//      phase, the holder and the counts; A's kid is still in the match, now a bot of the new host (adopted, never
//      removed — a carrier keeps carrying)
//   4. A comes back and asks to rejoin mid-match: turned away ('Match in progress')
//   5. the match plays on to its end (time-up, overtime or a knockout) under the new host: its records carry on (the
//      other guest keeps applying them), and both screens show the same result — mode, winner, reason, counts, every
//      player's karpM / karpPops — and the same results table (names, CARRIED, POPS, splats, deaths)
//   6. both back in the lobby, the room open again, A can join; no page errors; the relay kicked nobody
//   The events each screen saw (bursts, pick-ups, plants, drops, resets, Carp Blasts, overtime) are reported.
//   CLIENTS=3 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' WATCHDOG=2400000 NET=tools/botlab/tests/net-karp-full.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   (a real 5:00 match with three clients rendering: on a loaded machine the frames' dt cap (1/24 s) makes the sim run
//   slower than the wall, so give it a long watchdog)
//   NET_ARGS: 'map=<id>' (default halyard), 'bots=<n>' (default 5), 'diff=easy|normal|hard' (default normal),
//             'leave=<s>' (the latest match second the host leaves at; default 150)
module.exports = async ({ clients, R, wait, say, args, open, close, relay }) => {
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'halyard', BOTS = +(opt.bots ?? 5), DIFF = opt.diff || 'normal', LEAVE = +(opt.leave || 150);
  for (const c of clients.slice(0, 3)) {
    if (/[?&]wipmodes(&|=|$)/.test(c.url || '') && /[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    await open(c.i, 'autopilot&wipmodes');
  }
  const [A, B, C] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  // ---- 1. the room, the match
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: ${JSON.stringify(MAP)}, time: 'day', botCount: ${BOTS}, difficulty: ${JSON.stringify(DIFF)} }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await C.js(`__G.net.join(${JSON.stringify(code)}, 'Thirdy').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 3`, 15000);
  await A.js(`__G.net.setMe({ team: 0 }); 1`); await B.js(`__G.net.setMe({ team: 1 }); 1`); await C.js(`__G.net.setMe({ team: 0 }); 1`);
  await A.until(`(() => { const p = __G.net.lobby.players; return p.length === 3 && p[0].team === 0 && p[1].team === 1 && p[2].team === 0; })()`, 8000).catch(() => {});
  for (const c of [B, C]) await c.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  const lob = await J(A, `({ mode: __G.net.lobby.mode, map: __G.net.lobby.map })`);
  await A.js(`__G.net.start()`);
  for (const c of [A, B, C]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 150000, 250);
  // every screen records what it saw
  for (const c of [A, B, C]) await c.js(`(() => { window.__kev = []; import('./src/core/ctx.js').then((m) => { for (const k of ['karp:burst', 'karp:pickup', 'karp:undo', 'karp:plant', 'karp:gate', 'karp:drop', 'karp:reset', 'karp:explode', 'karp:overtime', 'karp:end', 'karp:shot']) m.on(k, (e) => window.__kev.push([k, Math.round((__G.match ? __G.match.time : 0) * 10) / 10, e.actor ? e.actor.nid : e.team ?? null, e.how || e.why || null])); }); return 1; })()`);
  const ia = await J(A, `({ map: __inkwave.mapDef.id, mode: __G.match.mode, n: __G.match.actors.length, bots: __G.match.actors.filter((a) => a.isBot).length, teams: [0, 1].map((t) => __G.match.actors.filter((a) => a.team === t).length), host: __G.match.karp && __G.match.karp.host, wire: __G.match.karp && __G.match.karp.wire.constructor.name })`);
  const others = await Promise.all([B, C].map((c) => J(c, `({ map: __inkwave.mapDef.id, n: __G.match.actors.length, follower: !!(__G.match.karp && __G.match.karp.follower) })`)));
  const locked = [...relay.rooms.values()].find((r) => r.code === code)?.locked;
  R('1. a 3-player room plays Bazookarp: the same stage and roster on all three, the host runs the rules (NetWire), the guests follow, the room locked',
    lob.mode === 'bazookarp' && ia.mode === 'bazookarp' && ia.map === MAP && ia.host && ia.wire === 'NetWire' && others.every((o) => o.map === MAP && o.n === ia.n && o.follower) && locked === true, { lob, ia, others, locked });
  say(`match up: ${MAP}, ${ia.n} players (${ia.bots} bots), teams ${ia.teams}`);

  // ---- 2. play on until it has been carried (or LEAVE s), then the host leaves — mid-carry if one is on
  const st = (c) => J(c, `(() => { const K = __G.match && __G.match.karp; if (!K) return null; const s = K.state(); return { host: !!K.host, follower: !!K.follower, phase: s.phase, holder: s.holder ? s.holder.nid : null, holderTeam: s.holder ? s.holder.team : -1, count: s.count, lowered: K.lowered, gates: K.gateUp, overtime: s.overtime, winner: s.winner, q: K.q, lastQ: K.lastQ, time: Math.round(__G.match.time), played: Math.round(__G.match.duration - __G.match.time), state: __G.match.state, net: __G.net.isHost }; })()`);
  let pre = null, carried = false;
  for (let k = 0; k < 400; k++) {
    pre = await st(A);
    if (!pre || pre.state !== 'playing' || pre.winner != null) break;
    if (pre.holder != null) carried = true;
    if ((carried && pre.holder != null && pre.played >= 45) || pre.played >= LEAVE) break;
    await wait(500);
  }
  const aNid = await J(A, `__G.match.local.nid`);
  const evPre = await J(A, `window.__kev`);
  R('2. before the leave the rules have run: the shell burst and the Bazookarp was picked up', evPre.some((e) => e[0] === 'karp:burst') && evPre.some((e) => e[0] === 'karp:pickup'),
    { at: pre, bursts: evPre.filter((e) => e[0] === 'karp:burst').length, pickups: evPre.filter((e) => e[0] === 'karp:pickup').length });
  say(`host A leaves at ${pre && pre.played} s played (${pre && pre.holder != null ? 'mid-carry, holder ' + pre.holder : 'no carry on'})`);
  const preQ = pre ? pre.q : 0;
  await close(0);
  let N = null;
  for (let k = 0; k < 120 && !N; k++) { for (const c of [B, C]) if (await c.js(`!!(__G.net && __G.net.isHost)`)) { N = c; break; } if (!N) await wait(250); }
  if (!N) { R('3. a guest becomes the host', false, {}); return; }
  const O = N === B ? C : B;
  // ---- 3. the new host runs the rules; the other follows (its snapshots: one trip plus the playback delay behind a
  // carrier who keeps moving — so the counts are compared once they agree, within 6 s)
  await wait(1500);
  let n3 = await st(N), o3 = await st(O);
  for (let k = 0; k < 30 && !(n3 && o3 && n3.phase === o3.phase && n3.holder === o3.holder && JSON.stringify(n3.count) === JSON.stringify(o3.count)); k++) { await wait(200); n3 = await st(N); o3 = await st(O); }
  const aKid = await J(N, `(() => { const a = __G.match.actors.find((x) => x.nid === ${aNid}); return a ? { local: !a.remote, bot: !!a.bot, carry: !!a.carry } : null; })()`);
  const aKidO = await J(O, `(() => { const a = __G.match.actors.find((x) => x.nid === ${aNid}); return a ? { remote: !!a.remote } : null; })()`);
  R('3. a guest became the host and runs the rules (not a follower; its q goes on from the old host\'s); the other guest follows: the same phase, holder and counts',
    n3 && o3 && n3.host && !n3.follower && o3.follower && n3.q >= preQ && n3.phase === o3.phase && n3.holder === o3.holder && JSON.stringify(n3.count) === JSON.stringify(o3.count), { newHost: n3, other: o3, preQ });
  R('3b. A\'s kid stays in the match as the new host\'s bot (adopted, not removed)' + (pre && pre.holder === aNid ? ' — and, as it was carrying, it still carries or lost it by the rules' : ''),
    !!aKid && aKid.local && aKid.bot && !!aKidO && aKidO.remote, { aKid, aKidO, carrierBefore: pre && pre.holder, aNid });
  // ---- 4. A asks to rejoin mid-match: turned away
  const A2 = await open(0, 'autopilot&wipmodes');
  const err = await A2.js(`__G.net.join(${JSON.stringify(code)}, 'Hosty').then(() => 'joined', (e) => e.message)`);
  R('4. A comes back mid-match and asks to rejoin: turned away (Match in progress)', err === 'Match in progress', { err });

  // ---- 5. play to the end under the new host
  say('playing the match out under the new host…');
  let last = null, qMid = null;
  const t0 = Date.now();
  for (let k = 0; k < 3000; k++) {
    last = await st(N);
    if (!last || last.state !== 'playing') break;
    if (k % 30 === 0) say(`… ${last.played} s played (${Math.round((Date.now() - t0) / 1000)} s of wall since the leave): ${last.phase}${last.holder != null ? ' by ' + last.holder : ''}, counts ${last.count}${last.overtime ? ', OVERTIME' : ''}`);
    if (qMid == null && last.played > (pre ? pre.played : 0) + 30) qMid = { n: last.q, o: (await st(O)).lastQ };
    await wait(1000);
  }
  for (const c of [N, O]) await c.until(`!!(__G.match && __G.match.result)`, 60000, 500).catch(() => {});
  await wait(1500);
  const end = async (c) => J(c, `(() => { const r = __G.match && __G.match.result; return r ? { mode: r.mode, winner: r.winner, reason: r.reason, counts: r.counts, st: __G.match.actors.map((a) => [a.nid, Math.round(a.stats.karpM || 0), a.stats.karpPops || 0]).sort((x, y) => x[0] - y[0]) } : null; })()`);
  const en = await end(N), eo = await end(O);
  R('5. the match plays to its end under the new host: the same result on both screens (mode, winner, reason, counts, every player\'s karpM / karpPops)',
    !!en && !!eo && en.mode === 'bazookarp' && (en.winner === 0 || en.winner === 1) && JSON.stringify(en) === JSON.stringify(eo), { newHost: en, other: eo });
  R('5b. … its rules records kept flowing to the other guest after the leave', !!qMid && qMid.o >= preQ && (last ? true : true) && (await st(O))?.lastQ > preQ, { preQ, mid: qMid, end: await st(O) });
  // the results table both players see (names, CARRIED, POPS, splats, deaths)
  for (const c of [N, O]) await c.until(`__inkwave.menus.current === 'results'`, 30000, 300).catch(() => {});
  await wait(7000);
  const table = (c) => J(c, `[...document.querySelectorAll('.iw-ttable')].map((t) => [...t.querySelectorAll('.iw-prow')].map((r) => [r.querySelector('.iw-prow__nm')?.textContent, ...[...r.querySelectorAll('.iw-prow__n')].map((n) => n.textContent)].join('|')).sort())`);
  const tn = await table(N), to = await table(O);
  const cols = await J(N, `[...document.querySelectorAll('.iw-ttable__head')].map((h) => h.textContent)`);
  R('5c. … and the same results table on both screens, with the CARRIED and POPS columns', tn.length === 2 && JSON.stringify(tn) === JSON.stringify(to) && cols.every((x) => /CARRIED/.test(x) && /POPS/.test(x)), { newHost: tn, other: to, cols });
  // ---- 6. back to the lobby; A can join again
  for (const c of [N, O]) await c.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 60000, 500).catch(() => {});
  const back = await Promise.all([N, O].map((c) => J(c, `({ cur: __inkwave.menus.current, state: __G.net.state, n: __G.net.lobby.players.length, host: __G.net.isHost, mode: __G.net.lobby.mode })`)));
  const open2 = [...relay.rooms.values()].find((r) => r.code === code)?.locked === false;
  const rej = await A2.js(`__G.net.join(${JSON.stringify(code)}, 'Hosty').then(() => 'joined', (e) => e.message)`);
  if (rej === 'joined') await N.until(`__G.net.lobby.players.length === 3`, 10000).catch(() => {});
  const n6 = await J(N, `__G.net.lobby.players.length`);
  R('6. both back in the lobby (the new host hosting, still Bazookarp), the room open again, and A joins it', back.every((b) => b.cur === 'lobby' && b.state === 'lobby' && b.mode === 'bazookarp') && back[0].host && open2 && rej === 'joined' && n6 === 3, { back, open: open2, rejoin: rej, players: n6 });
  // what every screen saw
  const evs = {};
  for (const [nm, c] of [['newHost', N], ['other', O]]) {
    const ev = await J(c, `window.__kev || []`), cnt = {};
    for (const e of ev) cnt[e[0]] = (cnt[e[0]] || 0) + 1;
    evs[nm] = cnt;
  }
  const evA = {}; for (const e of evPre) evA[e[0]] = (evA[e[0]] || 0) + 1;
  R('the match, as each screen saw it (reported)', true, { oldHostBeforeLeave: evA, ...evs, leftAt: pre && pre.played, end: en && { winner: en.winner, reason: en.reason, counts: en.counts } });
  const errs = [];
  for (const c of [N, O, A2]) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on any screen; the relay kicked nobody', errs.length === 0 && !(relay.stats && relay.stats.rateKicks), { errs: errs.slice(0, 4), relay: relay.stats });
};
