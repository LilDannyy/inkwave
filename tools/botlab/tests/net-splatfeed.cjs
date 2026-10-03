// Online: splatting a REAL player shows the same things on the splatter's screen as splatting a bot does — the kill card
// under the crosshair, the "You splatted …" bookkeeping, the death mark — and an ally going down shows the ally feed line.
// (The victim's own screen judges a player's splat; the splatter's screen hears it as a remote splat — netmatch.js
// _remoteSplat — which used to emit only the hit marker, so nothing showed for real players, only for host-run bots.)
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-splatfeed.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async (ctx) => {
  const { clients, R, wait, say } = ctx;
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));

  const code = await A.js(`__G.net.create('Hosty')`);
  say('room', code);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'tidewater', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  // opposite teams (the host keeps teams balanced: one each)
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  await wait(2500);
  const teams = await J(A, `__G.match.actors.map((a) => [a.name, a.team, !!a.remote])`);
  say('actors', JSON.stringify(teams));

  // count what the splatter's screen does, from here on
  const watch = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); window.__spl = []; on('splatted', (e) => window.__spl.push({ v: e.victim && e.victim.name, a: e.attacker && e.attacker.name, remote: !!e.remote })); return 1; })()`);
  await watch(A); await watch(B);

  // the guest's own screen splats the guest, by the host (as a hit from the host's shot would)
  await B.js(`(() => { const m = __G.match, me = m.local, host = m.actors.find((a) => a.name === 'Hosty'); me.damage(500, host); return 1; })()`);
  await A.until(`window.__spl.length > 0`, 8000).catch(() => {});
  await wait(600);
  const a1 = await J(A, `(() => { const g = __G.match.actors.find((a) => a.name === 'Guesty'); return { spl: window.__spl, card: !!document.querySelector('.iw-kcard--kill'), guestAlive: g.alive, splats: __G.match.local.stats.splats, marks: (__inkwave._deathMarks || __inkwave.deathMarks || []).length }; })()`);
  R('splatting a real player: the splatter\'s screen gets the splat event (remote)', a1.spl.length === 1 && a1.spl[0].v === 'Guesty' && a1.spl[0].a === 'Hosty' && a1.spl[0].remote, a1);
  R('…and shows the kill card under the crosshair, as for a bot', a1.card, a1);
  R('…the victim is down there and the splat is counted once', a1.guestAlive === false && a1.splats === 1, a1);
  const b1 = await J(B, `({ spl: window.__spl })`);
  R('…and the victim\'s screen hears its own splat once (no echo back from the splatter)', b1.spl.length === 1 && !b1.spl[0].remote, b1);

  await A.js(`__G.net.leave(); 1`); await B.js(`__G.net.leave(); 1`);
};
