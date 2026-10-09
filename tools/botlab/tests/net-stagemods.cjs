// Stage modules online (src/game/stageMods.js, docs/STAGE-MODS.md), with the test-only dummy module
// (tests/stage-mods-dummy.js) installed on halyard in every client: online Practice runs the module's clock from the
// host's ticks (no movers or pods on halyard: the stage clock is the registry's), so a pure function of it (the moving
// collider, the edge window) agrees on every screen; the host's records reach the guest ('sm'); a splat in the module's
// region carries the painter's stage time (field 15) to the replaying screen; a module's actor flag (F.stage) reaches
// the other screen; a late joiner gets the module's state (the start config's snapshot, restored on its first host
// clock) and the clock; after the host leaves, the new host runs the module and everyone follows it.
//   CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients, R, wait, open, close, say }) => {
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const install = (c) => c.js(`(async () => { const D = await import('./tools/botlab/tests/stage-mods-dummy.js'); const { MAP_LAYOUTS } = await import('./src/world/maps.js'); D.installDummy(MAP_LAYOUTS.halyard); __inkwave.worldKey = null; return 1; })()`);
  const st = (c) => J(c, `(() => { const m = __G.match, S = m && m.stage; return S && m.dummymod ? { ...m.dummymod.state(), host: __G.net.isHost, nids: m.actors.map((a) => [a.nid, a.isLocal]) } : null; })()`);
  await install(A); await install(B);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'halyard', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.stage`, 90000, 250);
  await wait(4000);
  // 1) the clock and what follows from it
  let a = await st(A), b = await st(B);
  R('both screens run the module (G.stageWorld, match.stage, the dummy)', !!a && !!b && a.host && !b.host && b.follower, { a: !!a, b: !!b });
  if (!a || !b) return;
  R('the stage clock agrees on both screens (Practice: the host\'s stage clock rides its ticks), ± 0.4 s', Math.abs(a.t - b.t) < 0.4, { a: a.t, b: b.t });
  R('a pure function of the clock agrees: the moving collider\'s top (± 0.15 m) and the edge window', Math.abs(a.top - b.top) < 0.15 && (a.open === b.open || Math.abs((a.t % 10) - 10) < 0.5 || (a.t % 10) < 0.5), { a: [a.top, a.open], b: [b.top, b.open] });
  // 2) the host's records reach the guest
  await A.js(`(__G.match.dummymod.bump(), __G.match.dummymod.bump(), __G.match.dummymod.bump(), 1)`);
  await B.until(`__G.match.dummymod.n === 3`, 8000).catch(() => {});
  b = await st(B);
  R('the host\'s module records reach the guest (S.rec → netEvent)', b.n === 3, { n: b.n });
  // 3) a splat in the module's region carries the painter's stage time
  const tB = await B.js(`(() => { const T = __G.match.stage.t; __G.paint.splat(new (__G.local.pos.constructor)(-21, 0.1, 5), 0.8, __G.local.team, {}); return T; })()`);
  await A.until(`__G.match.dummymod.lastEt !== null`, 8000).catch(() => {});
  a = await st(A);
  R('a splat in the module\'s region replays with its painter\'s stage time (field 15 → opts.et)', a.lastEt !== null && Math.abs(a.lastEt - tB) < 0.02, { et: a.lastEt, painter: tB });
  // 4) a module's actor flag reaches the other screen
  const bn = await B.js(`(() => { const me = __G.local; __G.match.dummymod.flagFor.add(me.nid); return me.nid; })()`);
  await A.until(`__G.match.dummymod.carried.has(${bn})`, 8000).catch(() => {});
  a = await st(A);
  const on = a.carried.includes(bn);
  await B.js(`(__G.match.dummymod.flagFor.clear(), 1)`);
  await A.until(`!__G.match.dummymod.carried.has(${bn})`, 8000).catch(() => {});
  a = await st(A);
  R('a module\'s actor flag (F.stage) reaches the other screen\'s carryRemote, on and off', on && !a.carried.includes(bn), { on, after: a.carried });
  // 5) a late joiner gets the module's state and the clock
  const C = await open(2, '');
  await install(C);
  await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
  await C.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.dummymod && __G.netm && !__G.netm.stagePending`, 90000, 250);
  // (a joiner that is still compiling runs a few frames a second, and a follower's stage clock trails by the frames it
  // missed until it settles: the clocks are compared once it has, within 10 s)
  let c = null, skew = [];
  for (let i = 0; i < 10; i++) {
    await wait(1000);
    a = await st(A); c = await st(C);
    skew.push(c ? +(c.t - a.t).toFixed(2) : null);
    if (c && Math.abs(c.t - a.t) < 0.6) break;
  }
  R('a late joiner restores the module\'s state from the snapshot (n) and its clock (± 0.6 s once settled), with seek(\'late\')', c && c.n === a.n && Math.abs(c.t - a.t) < 0.6 && c.seeks.includes('late'), { host: [a.n, a.t], joiner: c && [c.n, c.t, c.seeks], skew });
  await A.js(`(__G.match.dummymod.bump(), 1)`);
  await C.until(`__G.match.dummymod.n === ${a.n + 1}`, 8000).catch(() => {});
  const c2 = await st(C);
  R('…and follows the host\'s records after that', c2.n === a.n + 1, { n: c2.n });
  // 6) the host leaves: the new host runs the module (hostChanged), the others follow it
  await close(0);
  await B.until(`__G.net.isHost && __G.match && __G.match.dummymod && __G.match.dummymod.hostChanges.includes(true)`, 30000, 250).catch(() => {});
  b = await st(B);
  R('the new host is told (hostChanged(true)) and is no longer a follower', b && b.host && b.hostChanges.includes(true) && !b.follower, { b });
  const ok = await B.js(`__G.match.dummymod.bump()`);
  await C.until(`__G.match.dummymod.n === ${b.n + 1}`, 8000).catch(() => {});
  const c3 = await st(C);
  R('the new host\'s records reach the remaining guest; their clocks still agree (± 0.4 s)', ok && c3.n === b.n + 1 && Math.abs(c3.t - (await st(B)).t) < 0.4, { ok, n: c3.n, want: b.n + 1 });
  say('done');
};
