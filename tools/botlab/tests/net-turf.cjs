// Regression: a normal online Turf War still runs start → results → lobby, with the host's bot count honoured (and
// split to even the teams), the relay room locked while it runs (a late joiner is turned away: 'Match in progress').
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-turf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
// NET_ARGS: 'bots=<n>' (default 3), 'map=<id>' (default kelpline)
module.exports = async ({ clients, R, wait, say, open, close, relay, args }) => {
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const BOTS = +(opt.bots ?? 3), MAP = opt.map || 'kelpline';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: ${JSON.stringify(MAP)}, time: 'sunset', duration: 60, botCount: ${BOTS} }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const plan = await J(A, `__G.net.botPlan()`);
  R(`bot plan: ${BOTS} bots, split to even the teams`, plan.total === BOTS && Math.abs(plan.team[0] - plan.team[1]) <= 1, plan);
  R('a match still waits for everyone to ready up', !(await A.js(`__G.net.canStart()`)));
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  const ia = await J(A, `({ actors: __G.match.actors.map((a) => [a.team, !!a.isBot]), practice: !!__G.match.practice, time: __G.match.time, theme: __inkwave.theme, map: __inkwave.mapDef.id })`);
  const ib = await J(B, `({ n: __G.match.actors.length, map: __inkwave.mapDef.id, theme: __inkwave.theme })`);
  const bots = ia.actors.filter((x) => x[1]), byTeam = [0, 1].map((t) => ia.actors.filter((x) => x[0] === t).length);
  R('the match has the 2 players + the bots asked for, teams even', bots.length === BOTS && ia.actors.length === 2 + BOTS && Math.abs(byTeam[0] - byTeam[1]) <= 1 && ib.n === ia.actors.length, { byTeam, bots: bots.length });
  R('a timed match (not practice) on the same stage and look for both', !ia.practice && ia.time > 0 && ia.map === MAP && ib.map === MAP && ia.theme === 'sunset' && ib.theme === 'sunset', ia);
  const locked = [...relay.rooms.values()].find((r) => r.code === code)?.locked;
  R('the relay room is locked during a match', locked === true);
  const C = await open(2, '');
  const err = await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 'joined', (e) => e.message)`);
  R('…a late joiner is turned away: Match in progress', err === 'Match in progress', { err });
  close(2);
  say('playing the minute out…');
  for (const c of [A, B]) await c.until(`__G.match && __G.match.state === 'results'`, 150000, 500);
  const res = [await J(A, `__G.match.result && __G.match.result.winner`), await J(B, `__G.match.result && __G.match.result.winner`)];
  R('results on both screens, the same winner', res[0] === res[1] && (res[0] === 0 || res[0] === 1), { res });
  for (const c of [A, B]) await c.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 40000, 500);
  const back = [await J(A, `({ cur: __inkwave.menus.current, n: __G.net.lobby.players.length, bc: __G.net.lobby.botCount })`), await J(B, `({ cur: __inkwave.menus.current, n: __G.net.lobby.players.length })`)];
  R('…then both back in the lobby, the settings kept', back[0].cur === 'lobby' && back[1].cur === 'lobby' && back[0].n === 2 && back[0].bc === BOTS, back);
  R('the relay room is open again', [...relay.rooms.values()].find((r) => r.code === code)?.locked === false);
};
