// [b5-karp] fix round 2: the Roe Shell's crush online (Bazookarp SPEC §2.2; subs SPEC §0.3 G.deploy.crushIn). Each
// screen crushes its OWN devices inside a re-forming shell, and the owner's end record ([2, gid, 2]) ends its ghosts on
// every other screen. Real clients on the local relay (netpage.cjs), karpbox injected into both, host A on Alpha, guest
// B on Bravo:
//   B plants a Hop Beacon and a Lurk Mine at a spot on Bravo's half, A a Hop Beacon beside them, B one more beacon 5 m
//   off · every one shows as a ghost on the other screen · the host drops the Bazookarp there (a 'd' record) · after
//   the 0.8 s re-form none of the three by the spot is left on either screen (B's two crushed on B's screen, A's on
//   A's: 'device:down' how 'shell'), the beacon 5 m off stands on both, and the shell stands at the same spot on both
//   · no page errors
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp-crush.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients, R, wait, say, open }) => {
  for (const c of clients.slice(0, 2)) {
    if (/[?&]wipmodes(&|=|$)/.test(c.url || '') && /[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i}: reopening with ?autopilot&wipmodes`);
    await open(c.i, 'autopilot&wipmodes');
  }
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  for (const c of [A, B]) await c.js(`(async () => { const m = await import('./tools/botlab/karpbox.js'); return m.defineKarpbox(null); })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: 'karpbox', time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1] || teams[0] !== 0) { await A.js(`__G.net.setMe({ team: 0 }); 1`); await B.js(`__G.net.setMe({ team: 1 }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === 0 && p[1].team === 1; })()`, 8000); }
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say('match up');
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  await still(A); await still(B);
  // the host's bots parked on their decks (they would walk over the spot)
  await A.js(`(() => { for (const a of __G.match.actors) if (a.bot && !a.remote) { const p = __G.level.spawnPads[a.team]; a.pos.set(p.x + (a.slot % 4) * 1.5 - 2, p.y, p.z + (a.team ? 2 : -2)); a.vel.set(0, 0, 0); } return 1; })()`);
  const aNid = await J(A, `__G.match.local.nid`), bNid = await J(B, `__G.match.local.nid`);
  await wait(1000);
  // each screen counts what its devices did ('device:down' how 'shell'), from a clean slate
  for (const c of [A, B]) await c.js(`(async () => { const D = await import('./src/game/deployables.js'); D.resetDeployStats(); window.__DS = D.DEPLOY_STATS; window.__down = []; (await import('./src/core/ctx.js')).on('device:down', (e) => window.__down.push({ kind: e.kind, how: e.how, team: e.team })); return 1; })()`);
  // B plants a beacon and a mine at the spot, and a beacon 5 m off; A a beacon beside the spot (each kid walks away)
  const plant = (c, kind, x, z) => c.js(`(async () => { const { SUBS } = await import('./src/config.js'); const a = __G.match.local; if (!a.alive) return 0; a.pos.set(${x}, 0, ${z}); a.vel.set(0, 0, 0); a.ink = 100; __G.subs.use(a, SUBS.${kind}); return 1; })()`);
  const P = [-2, 10];
  // (A first, and away at once: B's mine must never see an Alpha kid by it)
  await plant(A, 'beacon', P[0] - 0.5, P[1] - 0.3); await A.js(`(() => { __G.match.local.pos.set(0, 0, -14); return 1; })()`);
  await wait(400);
  await plant(B, 'beacon', P[0], P[1]); await plant(B, 'mine', P[0] + 0.4, P[1] + 0.4); await plant(B, 'beacon', P[0] + 5, P[1]);
  await B.js(`(() => { __G.match.local.pos.set(2, 0, 16); return 1; })()`);
  await wait(900);
  const devs = (c) => J(c, `__G.subs.items.filter((it) => it.state !== 'dead' && (it.kind === 'beacon' || it.kind === 'mine')).map((it) => ({ kind: it.kind, owner: it.owner.nid, ghost: !!it.ghost, d: +Math.hypot(it.pos.x - (${P[0]}), it.pos.z - (${P[1]})).toFixed(2) }))`);
  const a0 = await devs(A), b0 = await devs(B);
  const near = (L) => L.filter((d) => d.d < 1.5), far = (L) => L.filter((d) => d.d > 4);
  R('the devices are up on both screens: B\'s beacon and mine and A\'s beacon by the spot (a ghost on the other screen), B\'s beacon 5 m off',
    near(a0).length === 3 && near(b0).length === 3 && near(a0).filter((d) => d.ghost).length === 2 && near(b0).filter((d) => d.ghost).length === 1 && far(a0).length === 1 && far(b0).length === 1,
    { host: a0, guest: b0 });
  // the host drops the Bazookarp there ('d': every screen re-forms the shell on that node)
  await A.js(`(() => { const K = __G.match.karp; K._dropAt(K.pos.clone().set(${P[0]}, 0, ${P[1]}), 1, 'splat', null); return 1; })()`);
  await B.until(`__G.match.karp.phase === 'reforming' || __G.match.karp.shell.state === 'intact' && Math.hypot(__G.match.karp.pos.x - (${P[0]}), __G.match.karp.pos.z - (${P[1]})) < 2`, 4000, 30).catch(() => {});
  await wait(1600);
  const a1 = await devs(A), b1 = await devs(B);
  const st = async (c) => J(c, `(() => { const D = window.__DS; const K = __G.match.karp; return { crushed: D.crushed, down: window.__down, phase: K.phase, shell: K.shell.state, at: K.pos.toArray().map((x) => +x.toFixed(2)), crushes: K.shell.stats.crushes }; })()`);
  const sa = await st(A), sb = await st(B);
  R('the re-formed shell crushed each screen\'s own devices there: B\'s beacon and mine on B\'s screen, A\'s beacon on A\'s (\'device:down\' how \'shell\')',
    (sb.crushed.beacon || 0) === 1 && (sb.crushed.mine || 0) === 1 && (sa.crushed.beacon || 0) === 1 && !sa.crushed.mine && sb.down.filter((e) => e.how === 'shell').length === 2 && sa.down.filter((e) => e.how === 'shell').length === 1,
    { host: { crushed: sa.crushed, down: sa.down }, guest: { crushed: sb.crushed, down: sb.down } });
  R('both screens agree: nothing is left by the spot on either (the ghosts ended on their owner\'s word), the beacon 5 m off stands on both, the shell stands at the same spot',
    near(a1).length === 0 && near(b1).length === 0 && far(a1).length === 1 && far(b1).length === 1 && sa.shell === 'intact' && sb.shell === 'intact' && Math.hypot(sa.at[0] - sb.at[0], sa.at[2] - sb.at[2]) < 0.3,
    { host: { devs: a1, shell: sa.shell, at: sa.at }, guest: { devs: b1, shell: sb.shell, at: sb.at }, nids: [aNid, bNid] });
  const errs = [];
  for (const c of [A, B]) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on either screen', errs.length === 0, errs.slice(0, 4));
};
