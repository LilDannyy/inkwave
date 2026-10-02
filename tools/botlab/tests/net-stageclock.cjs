// Online Practice keeps the stage's own clock in step (no match clock: the host's stage clock rides its ticks): a late
// joiner gets the pods already grown (Treehills), and after a stage swap the movers (Calamari County's railcars) run
// on the same timetable everywhere.
//   CLIENTS=2 NET=tools/botlab/tests/net-stageclock.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients, R, wait, open, say }) => {
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'treehills', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing'`, 90000, 250);
  await wait(4000);
  // the host grows two pods (one per team)
  const grown = await J(A, `(() => { const P = __G.match.pods; P.grow(P.pods[0], 0, P.clock.t); P.grow(P.pods[1], 1, P.clock.t - 2); return P.pods.slice(0, 2).map((p) => [p.state, p.owner]); })()`);
  await wait(3000);
  const C = await open(2, '');
  await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
  await C.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && __G.netm && !__G.netm.podsPending`, 90000, 250);
  await wait(1500);
  const pa = await J(A, `({ t: __G.match.pods.clock.t, p: __G.match.pods.pods.slice(0, 3).map((p) => [p.state, p.owner, +p.t0.toFixed(2)]) })`);
  const pc = await J(C, `({ t: __G.match.pods.clock.t, p: __G.match.pods.pods.slice(0, 3).map((p) => [p.state, p.owner, +p.t0.toFixed(2)]) })`);
  R('a late joiner sees the pods the host grew (state, team, grow time)', JSON.stringify(pa.p) === JSON.stringify(pc.p) && Math.abs(pa.t - pc.t) < 0.6, { host: pa, joiner: pc, grown });
  const sw = await A.js(`__inkwave.api.practiceSwapStage('calamari', 'day')`);
  R('the host swaps the stage', sw === true);
  for (const c of [A, B, C]) await c.until(`__inkwave.mapDef.id === 'calamari' && __G.match && __G.match.state === 'playing' && !!__G.match.movers`, 90000, 250);
  await wait(4000);
  const ts = await Promise.all([A, B, C].map((c) => c.js(`__G.match.movers.clock.t`)));
  const spread = Math.max(...ts) - Math.min(...ts);
  R('after a swap: the railcars timetable clock agrees on every screen (± 0.4 s)', spread < 0.4, { ts: ts.map((t) => +t.toFixed(2)) });
};
