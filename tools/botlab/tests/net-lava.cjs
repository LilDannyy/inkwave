// The lava online (src/game/lava.js; ENGINE.md §4.7): nothing crosses the wire but the painter's stage time on splats
// near it — every screen derives the level, the riders, the warnings and the burn from the shared stage clock.
//   WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
// 1) a 1:30 Turf War on Highmark Foundry with bots (rise at 30, fall at 55): both screens sample L every 0.5 s and
//    agree within 0.1 m; the guest stands on the Slump shelf through the rise and splats by lava (its screen judges it,
//    the host's feed shows the cause); the guest's Lurk Mine and Hop Beacon on the shelf are gone on both screens once
//    the lava covers them; the guest paints across the waterline through the rise and the fall and the lava cells end
//    identical on both screens; the same result on both
// 2) Practice on Highmark Foundry (its own loop: rise at 20, HIGH 30–65): a third client joins at HIGH — its level and
//    its stones agree with the host's within 2 s; the host leaves in the middle of the next rise (110–120) — the new
//    host carries the clock on and the remaining screens agree through the rest of the rise
module.exports = async ({ clients, R, wait, say, open, close }) => {
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const JA = async (c, code) => JSON.parse(await c.js(`(async () => JSON.stringify(await (${code})))()`));   // (an async page expression)
  const st = (c) => J(c, `(() => { const m = __G.match, L = m && m.lava; return L ? { t: +L.clock.t.toFixed(3), y: +L.y.toFixed(4), phase: L.st.phase, stones: L.riders.filter((r) => r.r.sink).map((r) => r.solid ? 1 : 0).join(''), host: !!__G.net.isHost, key: L.sched.key } : null; })()`);
  // ---- 1) Turf War 1:30
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: 'caldera', time: 'day', duration: 90, botCount: 4 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const lob = await J(A, `__G.net.lobby`);
  R('a room on Highmark Foundry (Turf War 1:30, 4 bots)', lob.map === 'caldera' && lob.duration === 90, { map: lob.map, duration: lob.duration, mode: lob.mode });
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.state === 'playing' && !!__G.match.lava`, 150000, 250);
  // the host listens for splats (whose, why), the guest arms its player against weapons (the lava ignores that)
  await A.js(`(async () => { window.__lv = { deaths: [] }; (await import('./src/core/ctx.js')).on('splatted', (e) => window.__lv.deaths.push([e.victim && e.victim.nid, e.cause, +(__G.match.lava.clock.t).toFixed(2)])); return 1; })()`);
  const bNid = await B.js(`(__G.local.invuln = 1e6, __G.local.nid)`);
  let a = await st(A), b = await st(B);
  R('both screens run the lava on the same schedule (turf:90)', a && b && a.key === 'turf:90' && b.key === 'turf:90' && a.host && !b.host, { a, b });
  // the guest's devices on the shelf, early (before the rise's no-place window)
  const dev = await JA(B, `(async () => { const { SUBS } = await import('./src/config.js'); const me = __G.local, V = me.pos.constructor;
    const put = (x, z) => { me.pos.set(x, 0.02, z); me.vel.set(0, 0, 0); me.grounded = true; me.ink = 100; };
    put(-25.2, -8.19); __G.subs.use(me, SUBS.mine); await new Promise((r) => setTimeout(r, 300));
    put(-24.0, -10.4); __G.subs.use(me, SUBS.beacon); await new Promise((r) => setTimeout(r, 300));
    me.pos.set(-20, 1.25, -14.5); me.vel.set(0, 0, 0);   // (back on the south Slump head)
    return { t: +__G.match.lava.clock.t.toFixed(2), mine: __G.subs.items.filter((it) => it.owner === me && it.state === 'mine').map((it) => it.gid), beacon: __G.subs.items.filter((it) => it.owner === me && it.state === 'beacon').map((it) => it.gid) }; })()`);
  await wait(1500);
  const ghosts0 = await J(A, `__G.subs.items.filter((it) => it.ghost && it.state !== 'dead' && (it.state === 'mine' || it.state === 'beacon')).map((it) => it.gid)`);
  R('the guest plants a Lurk Mine and a Hop Beacon on the shelf before the rise; the host sees them (ghosts)', dev.mine.length === 1 && dev.beacon.length === 1 && dev.mine.every((g) => ghosts0.includes(g)) && dev.beacon.every((g) => ghosts0.includes(g)), { dev, ghosts0 });
  // sample the level on both screens every 0.5 s; the guest stands on the shelf from 26 s; it paints across the
  // waterline through the rise and the fall (Alpha's south Slump head's tip face: the cliff at the shelf's south end)
  const samples = [], worst = { d: 0 };
  let stood = false, painted = 0;
  for (let i = 0; i < 200; i++) {
    a = await st(A); b = await st(B);
    if (!a || !b) break;
    const d = Math.abs(a.y - b.y); samples.push([a.t, a.y, b.t, b.y]);
    if (d > worst.d) { worst.d = d; worst.at = [a.t, a.y, b.t, b.y]; }
    if (!stood && b.t > 26) { stood = true; await B.js(`(__G.local.pos.set(-25.2, 0.05, -8.19), __G.local.vel.set(0, 0, 0), __G.local.invuln = 1e6, 1)`); }
    if ((b.t > 28 && b.t < 42) || (b.t > 53 && b.t < 67)) {
      // (0.4 m off the Slump cliff at θ −153 … −157, centred on the surface: half the blob above the waterline)
      painted += await B.js(`(() => { const L = __G.match.lava, V = __G.local.pos.constructor, y = L.y, D = Math.PI / 180; let n = 0;
        for (const a of [-153, -155, -157]) { const r = 31.5 - 3 * (a + 147) / -27 - 0.4; __G.paint.splat(new V(r * Math.cos(a * D), y, r * Math.sin(a * D)), 0.7, __G.local.team, {}); n++; } return n; })()`);
    }
    if (b.t > 72) break;
    await wait(500);
  }
  R('the level agrees on both screens every 0.5 s through a rise and a fall (± 0.1 m)', samples.length > 80 && worst.d <= 0.1, { n: samples.length, worst });
  const deaths = await J(A, `window.__lv.deaths`);
  const lavaB = deaths.find((d) => d[0] === bNid && d[1] === 'lava');
  R('the guest left standing on the shelf splats by lava (its own screen judges it); the host\'s feed shows cause lava, at the rise\'s deadly moment (30 + 3.8 s ± 0.6)', !!lavaB && Math.abs(lavaB[2] - 33.79) < 0.6, { lavaB, deaths: deaths.slice(0, 8) });
  const devAfter = { host: await J(A, `__G.subs.items.filter((it) => it.state !== 'dead' && (it.state === 'mine' || it.state === 'beacon')).map((it) => it.gid)`), guest: await J(B, `__G.subs.items.filter((it) => it.owner === __G.local && it.state !== 'dead' && (it.state === 'mine' || it.state === 'beacon')).map((it) => it.gid)`) };
  const gone = [...dev.mine, ...dev.beacon].every((g) => !devAfter.host.includes(g) && !devAfter.guest.includes(g));
  R('…its devices the lava covered are gone on both screens (the owner\'s sweep and its end records)', gone, { devAfter });
  await wait(2500);
  const cells = await J(A, `(() => { const W = __G.lavaWorld, P = __G.paint; let s = ''; for (let i = 0; i < W.cells.ids.length; i++) s += P.grid[W.cells.ids[i]]; return s; })()`);
  const cellsB = await J(B, `(() => { const W = __G.lavaWorld, P = __G.paint; let s = ''; for (let i = 0; i < W.cells.ids.length; i++) s += P.grid[W.cells.ids[i]]; return s; })()`);
  let same = 0, inkedA = 0, inkedB = 0; for (let i = 0; i < Math.min(cells.length, cellsB.length); i++) { if (cells[i] === cellsB[i]) same++; if (cells[i] !== '0') inkedA++; if (cellsB[i] !== '0') inkedB++; }
  const ratio = same / Math.max(1, cells.length);
  R('the lava cells end identical on both screens after splats across the waterline through a rise and a fall (painter\'s stage time, field 15)', cells.length === cellsB.length && ratio >= 0.999 && painted > 30, { n: cells.length, ratio: +ratio.toFixed(5), inked: [inkedA, inkedB], painted });
  for (const c of [A, B]) await c.until(`__G.match && __G.match.state === 'results'`, 120000, 500);
  const res = [await J(A, `__G.match.result && __G.match.result.winner`), await J(B, `__G.match.result && __G.match.result.winner`)];
  const fin = await J(A, `(() => { const L = __G.match.lava; return { y: L.y, phase: L.st.phase }; })()`);
  R('time-up at LOW (the final ebb); the same result on both screens', res[0] === res[1] && (res[0] === 0 || res[0] === 1) && fin.phase === 'low', { res, fin });
  for (const c of [A, B]) await c.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 40000, 500);

  // ---- 2) Practice: a late joiner at HIGH, a host change in the middle of a rise
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'caldera', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.setMe({ ready: true }); 1`).catch(() => 0);
  await A.until(`__G.net.canStart()`, 8000).catch(() => 0);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.lava`, 120000, 250);
  a = await st(A);
  R('Practice runs its own loop (practice: rise at 20)', a && a.key === 'practice', a);
  await A.until(`__G.match.lava.clock.t > 34`, 60000, 500);
  const C = await open(2, '');
  await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
  await C.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.lava && __G.netm && !__G.netm.stagePending`, 120000, 250);
  let c = null, skew = [];
  for (let i = 0; i < 10; i++) { await wait(1000); a = await st(A); c = await st(C); skew.push(c ? +(c.y - a.y).toFixed(3) : null); if (c && a.phase === 'high' && Math.abs(c.y - a.y) < 0.1 && c.stones === a.stones) break; }
  R('a late joiner at HIGH: its level and its stones agree with the host\'s (± 0.1 m) once its clock settles', c && a.phase === 'high' && c.phase === 'high' && Math.abs(c.y - a.y) < 0.1 && c.stones === a.stones && /^1+$/.test(c.stones), { host: a, joiner: c, skew });
  // the host leaves in the middle of the second rise (110 – 120)
  await A.until(`__G.match.lava.clock.t > 113`, 120000, 500);
  const before = await st(B);
  await close(0);
  await B.until(`__G.net.isHost && __G.match && __G.match.lava`, 30000, 250).catch(() => {});
  const after = [];
  for (let i = 0; i < 16; i++) { await wait(500); const bb = await st(B), cc = await st(C); if (bb && cc) after.push([bb.t, bb.y, bb.phase, cc.t, cc.y, cc.phase, bb.host]); }
  const agree = after.every((x) => Math.abs(x[1] - x[4]) <= 0.1), cont = after.length > 8 && after[0][0] >= before.t - 0.5 && after.some((x) => x[2] === 'high') && after[0][1] > -0.6;
  R('the host leaves mid-rise: the new host carries the clock on (no jump back), the rise finishes on time, both remaining screens agree (± 0.1 m)', agree && cont && after.every((x) => x[6]), { before, after: after.filter((_, i) => i % 3 === 0) });
  say('done');
};
