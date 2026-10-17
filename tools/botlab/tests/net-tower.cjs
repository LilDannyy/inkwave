// [karp-face] Tower Command / Zone Control across a host change — the regression for netmatch.onLeave's new order
// (docs/NET.md, Bazookarp SPEC §7.6): the departed host's queued RULE records ('tw' / 'z' / 'ks') play at once on every
// remaining client, in order, before the new host stops being a follower; everything else stays on that peer's clock.
// Three real clients (host A on Alpha, guests B and C on Bravo), halyard, bots parked:
//   1. the host's control records reach both guests (owner on both screens)
//   2. the host flips control and leaves 60 ms later (its record already sent, still inside both guests' playback delay):
//      on the new host and the other guest the same owner (without the flush the new host — no longer a follower —
//      ignored that last record while the other guest applied it), the same counts
//   3. the new host runs the rules on (a follower no more), the other guest follows: owner / position / counts agree
//   4. the match finishes with the same result on both screens · no page errors
//   CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-tower.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS='mode=zones' (or tests/net-zones.cjs): Zone Control
module.exports = async ({ clients, R, wait, say, args, open, close }) => {
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const mode = opt.mode === 'zones' ? 'zones' : 'tower', MAP = opt.map || 'halyard';
  const cs = clients.slice(0, 3), [A] = cs, rest = cs.slice(1);
  for (const c of cs) if (!/[?&]autopilot(&|=|$)/.test(c.url || '')) await open(c.i, 'autopilot');
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: '${mode}', map: '${MAP}', time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  for (let i = 1; i < 3; i++) await cs[i].js(`__G.net.join(${JSON.stringify(code)}, 'Guest${i}').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 3`, 15000);
  await A.js(`__G.net.setMe({ team: 0 }); 1`);
  for (let i = 1; i < 3; i++) { await cs[i].js(`__G.net.setMe({ team: 1 }); 1`); await cs[i].js(`__G.net.setMe({ ready: true }); 1`); }
  await A.until(`__G.net.lobby.players.every((p, i) => p.team === (i === 0 ? 0 : 1)) && __G.net.canStart()`, 10000);
  await A.js(`__G.net.start()`);
  for (const c of cs) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say(`match up (${mode})`);
  for (const c of cs) await c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  const E = mode === 'tower' ? '__G.match.tower' : '__G.match.zones';
  const st = async (c) => J(c, mode === 'tower'
    ? `(() => { const T = ${E}; return { follower: T.follower, owner: T.owner, s: +T.s.toFixed(2), count: T.count.map((x) => Math.ceil(x - 1e-6)) }; })()`
    : `(() => { const Z = ${E}; return { follower: Z.follower, owner: Z.owner, count: Z.count.map((x) => Math.round(x)), penalty: Z.penalty.map((x) => Math.round(x)) }; })()`);
  await wait(1500);
  // ---- 1. a control record from the host reaches both guests
  // (Zone Control's control follows the zones' ink on the host: take every live zone — _zoneOwner floods it with that
  // team's ink, so the host's own sampling keeps it — then the objective; Tower Command's is set directly)
  const own = (t) => (mode === 'tower' ? `${E}._setOwner(${t})` : `(() => { const Z = ${E}; for (const z of Z.active.zones) Z._zoneOwner(z, ${t}); Z._setOwner(${t}); })()`);
  await A.js(`(() => { ${own(0)}; return 1; })()`);
  await wait(1500);
  const s1 = await Promise.all(cs.map(st));
  R(`${mode} 1. the host's control record reaches both guests`, s1.every((x) => x.owner === 0), s1);
  // ---- 2. the host flips control and leaves 60 ms later
  await A.js(`(() => { ${own(1)}; return 1; })()`);
  await wait(60);
  say('host A leaves 60 ms after its last control record');
  await close(0);
  let N = null;
  for (let k = 0; k < 120 && !N; k++) { for (const c of rest) if (await c.js(`!!(__G.net && __G.net.isHost)`)) { N = c; break; } if (!N) await wait(250); }
  if (!N) { R(`${mode} 2. a guest becomes the host`, false, {}); return; }
  const O = rest.find((c) => c !== N);
  await wait(300);
  const n2 = await st(N), o2 = await st(O);
  R(`${mode} 2. the old host's last control records, still queued when it left, are on both remaining screens (the narrowed flush): the same owner`, n2.owner === o2.owner && (mode === 'zones' || n2.owner === 1) && !n2.follower && o2.follower, { newHost: n2, other: o2 });
  // ---- 3. the new host runs the rules; the other guest follows
  await wait(2500);
  const n3 = await st(N), o3 = await st(O);
  const agree = mode === 'tower' ? n3.owner === o3.owner && Math.abs(n3.s - o3.s) < 1.0 && JSON.stringify(n3.count) === JSON.stringify(o3.count)
    : n3.owner === o3.owner && Math.abs(n3.count[0] - o3.count[0]) <= 1 && Math.abs(n3.count[1] - o3.count[1]) <= 1;
  R(`${mode} 3. the new host runs the rules on and the other guest follows (owner, ${mode === 'tower' ? 'the tower\'s position, counts' : 'counts'})`, agree, { newHost: n3, other: o3 });
  // ---- 4. the end
  await N.js(`(() => { __G.match.time = 0.2; return 1; })()`);
  for (const c of [N, O]) await c.until(`!!__G.match.result`, 25000, 250).catch(() => {});
  const end = async (c) => J(c, `(() => { const r = __G.match.result; return r ? { mode: r.mode, winner: r.winner, reason: r.reason, counts: r.counts } : null; })()`);
  const en = await end(N), eo = await end(O);
  R(`${mode} 4. the match finishes under the new host with the same result on both screens`, !!en && en.mode === mode && JSON.stringify(en) === JSON.stringify(eo), { en, eo });
  const errs = [];
  for (const c of rest) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on the remaining screens', errs.length === 0, errs.slice(0, 4));
};
