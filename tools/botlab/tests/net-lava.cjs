// The lava online (src/game/lava.js; ENGINE.md §4.7): nothing crosses the wire but the painter's stage time on splats
// near it — every screen derives the level, the riders, the warnings and the burn from the shared stage clock.
//   WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
// 1) a 1:30 Turf War on Highmark Foundry with bots (rise at 30, fall at 55): both screens sample L every 0.5 s and
//    agree within 0.1 m; the guest stands on the Slump shelf through the rise and splats by lava (its screen judges it,
//    the host's feed shows the cause); the guest's Lurk Mine and Hop Beacon on the shelf are gone on both screens once
//    the lava covers them; the guest paints across the waterline through the rise and the fall and the lava cells end
//    identical on both screens; the same result on both
// 2) Practice on Highmark Foundry (its own loop: rise at 20, HIGH 30–65): the host paints across the waterline at LOW
//    and at HIGH; a third client joins at HIGH — its level and its stones agree with the host's within 2 s, and its lava
//    cells (the imported grid) equal the host's (ENGINE §6 net step 7)
// 3) a timed Turf War 1:30 with all three: the host leaves in the middle of the rise (35 s) — the new host's fall starts
//    at 55 ± 0.4 s on its screen and the stones turn deadly (the ledges dry) at 61.2 ± 0.4 s on both remaining screens
//    (net step 6). (fix round 1: the guest in 1) is pinned out of the bots' way until it stands on the shelf, and pinned
//    there in x / z: an idle guest knocked into the lava at 19.4 s, before the warning, failed a run on a loaded machine)
module.exports = async ({ clients, R, wait, say, open, close }) => {
  const [A, B] = clients;
  // (the guest held at a spot in x / z, its height free: the lava still judges its feet; knockback can't move it)
  const pin = (c, x, z) => c.js(`(() => { window.__pin = ${x === null ? 'null' : `{ x: ${x}, z: ${z} }`}; if (!window.__pinT) window.__pinT = setInterval(() => { const p = window.__pin, me = __G.local; if (!p || !me || !me.alive) return; me.pos.x = p.x; me.pos.z = p.z; me.vel.x = 0; me.vel.z = 0; }, 4); return 1; })()`);
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
    const pad = __G.level.spawnPads[me.team]; me.pos.set(pad.x, pad.y + 0.05, pad.z); me.vel.set(0, 0, 0);   // (back on its own pad, out of the fights)
    return { t: +__G.match.lava.clock.t.toFixed(2), mine: __G.subs.items.filter((it) => it.owner === me && it.state === 'mine').map((it) => it.gid), beacon: __G.subs.items.filter((it) => it.owner === me && it.state === 'beacon').map((it) => it.gid) }; })()`);
  const padB = await J(B, `(() => { const p = __G.level.spawnPads[__G.local.team]; return [p.x, p.z]; })()`);
  await pin(B, padB[0], padB[1]);
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
    if (!stood && b.t > 26) { stood = true; await B.js(`(__G.local.pos.set(-25.2, 0.05, -8.19), __G.local.vel.set(0, 0, 0), __G.local.invuln = 1e6, 1)`); await pin(B, -25.2, -8.19); }
    if (stood && b.t > 36) await pin(B, null);
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
  // (fix round 3, the lead's decision: the grids are compared at the results screen — nothing in flight — and the lava
  // cells are judged against the same run's other cells: the netcode's own 1 cm splat rounding moves a blob's rim on
  // both, the lava may add no mismatch of its own; mid-match, 4 bots still painting left 144 lava cells differing)
  for (const c of [A, B]) await c.until(`__G.match && __G.match.state === 'results'`, 120000, 500);
  await wait(1500);
  const split = (cl) => J(cl, `(() => { const W = __G.lavaWorld, P = __G.paint, lava = new Uint8Array(P.grid.length); for (const k of W.cells.ids) lava[k] = 1; let a = '', b = ''; for (let i = 0; i < P.grid.length; i++) { if (lava[i]) a += P.grid[i]; else if (P.grid[i] !== 255) b += P.grid[i]; } return [a, b]; })()`);
  const [cells, others] = await split(A), [cellsB, othersB] = await split(B);
  const diffOf = (x, y) => { let same = 0, inA = 0, inB = 0; const idx = []; for (let i = 0; i < Math.min(x.length, y.length); i++) { if (x[i] === y[i]) same++; else if (idx.length < 400) idx.push(i); if (x[i] !== '0') inA++; if (y[i] !== '0') inB++; } return { n: x.length, nB: y.length, differ: x.length - same, ratio: same / Math.max(1, x.length), inked: [inA, inB], idx }; };
  const dl = diffOf(cells, cellsB), dO = diffOf(others, othersB);
  // (where the differing lava cells are: their heights — at the waterlines would be the lava's own doing)
  const diffWhere = await J(A, `(() => { const W = __G.lavaWorld, P = __G.paint, v = new (__G.local.pos.constructor)(), ids = ${JSON.stringify(dl.idx)}; const ys = ids.map((i) => { P.cellWorld(W.cells.ids[i], v); return +v.y.toFixed(2); }); const band = ys.filter((y) => Math.abs(y - 0.8) < 0.08 || Math.abs(y + 0.6) < 0.08).length; return { n: ys.length, minY: ys.length ? Math.min(...ys) : null, maxY: ys.length ? Math.max(...ys) : null, atWaterlines: band, eg: ys.slice(0, 16) }; })()`);
  R('at the results screen the lava cells agree between the two screens at least as well as the same run\'s other cells do (splats across the waterline through a rise and a fall: the painter\'s stage time, field 15)', dl.n === dl.nB && dO.n === dO.nB && dl.ratio >= dO.ratio && dl.ratio >= 0.998 && painted > 30,
    { lava: { n: dl.n, differ: dl.differ, ratio: +dl.ratio.toFixed(5), inked: dl.inked }, other: { n: dO.n, differ: dO.differ, ratio: +dO.ratio.toFixed(5), inked: dO.inked }, painted, diffWhere });
  const res = [await J(A, `__G.match.result && __G.match.result.winner`), await J(B, `__G.match.result && __G.match.result.winner`)];
  const fin = await J(A, `(() => { const L = __G.match.lava; return { y: L.y, phase: L.st.phase }; })()`);
  R('time-up at LOW (the final ebb); the same result on both screens', res[0] === res[1] && (res[0] === 0 || res[0] === 1) && fin.phase === 'low', { res, fin });
  for (const c of [A, B]) await c.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 40000, 500);

  // ---- 2) Practice: the host paints across the waterline; a late joiner at HIGH (its level, stones and lava cells)
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'caldera', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.setMe({ ready: true }); 1`).catch(() => 0);
  await A.until(`__G.net.canStart()`, 8000).catch(() => 0);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.lava`, 120000, 250);
  a = await st(A);
  R('Practice runs its own loop (practice: rise at 20) between the stage\'s own levels', a && a.key === 'practice' && a.y === -0.6, a);
  // (the host paints the Slump cliff across the waterline at LOW, then again at HIGH: the rise burns the first)
  const paintCliff = (c) => c.js(`(() => { const L = __G.match.lava, V = __G.local.pos.constructor, y = L.y, D = Math.PI / 180; let n = 0;
    for (let a = -151; a >= -159; a -= 1) { const r = 31.5 - 3 * (a + 147) / -27 - 0.4; for (const dy of [0.1, 0.7]) { __G.paint.splat(new V(r * Math.cos(a * D), y + dy, r * Math.sin(a * D)), 0.75, __G.local.team, {}); n++; } } return n; })()`);
  await A.until(`__G.match.lava.clock.t > 12`, 60000, 250);
  let pA = await paintCliff(A);
  await A.until(`__G.match.lava.clock.t > 31`, 60000, 250);
  pA += await paintCliff(A);
  await A.until(`__G.match.lava.clock.t > 34`, 60000, 500);
  const C = await open(2, '');
  await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
  await C.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.lava && __G.netm && !__G.netm.stagePending`, 120000, 250);
  let c = null, skew = [];
  for (let i = 0; i < 10; i++) { await wait(1000); a = await st(A); c = await st(C); skew.push(c ? +(c.y - a.y).toFixed(3) : null); if (c && a.phase === 'high' && Math.abs(c.y - a.y) < 0.1 && c.stones === a.stones) break; }
  R('a late joiner at HIGH: its level and its stones agree with the host\'s (± 0.1 m) once its clock settles', c && a.phase === 'high' && c.phase === 'high' && Math.abs(a.y - 0.8) < 1e-6 && Math.abs(c.y - a.y) < 0.1 && c.stones === a.stones && /^1+$/.test(c.stones), { host: a, joiner: c, skew });
  await wait(2000);
  const cellsOf = (cl) => J(cl, `(() => { const W = __G.lavaWorld, P = __G.paint; let s = ''; for (let i = 0; i < W.cells.ids.length; i++) s += P.grid[W.cells.ids[i]]; return s; })()`);
  const cmp = (x, y) => { let same = 0, inked = [0, 0]; for (let i = 0; i < Math.min(x.length, y.length); i++) { if (x[i] === y[i]) same++; if (x[i] !== '0') inked[0]++; if (y[i] !== '0') inked[1]++; } return { n: x.length, differ: x.length - same, inked }; };
  const jA = await cellsOf(A), jC = await cellsOf(C), jB = await cellsOf(B);
  const jc = cmp(jA, jC), jb = cmp(jA, jB);
  // (at HIGH nearly every lava cell is under the surface — burned, bare — so the whole grid is compared too: the host's
  // ink on the cliff above the waterline must have come over in the import, its ink from LOW under it must not)
  const gridOf = (cl) => J(cl, `(() => { const P = __G.paint; let s = ''; for (let i = 0; i < P.grid.length; i++) s += P.grid[i]; return s; })()`);
  const gA = await gridOf(A), gC = await gridOf(C), gB = await gridOf(B);
  const gc = cmp(gA, gC), gb = cmp(gA, gB);
  // (fix round 4, review 4: the live guest's grid is judged on the lava cells — exact — as the results-screen check is; its
  // other cells replay the host's splat records at the netcode's 1 cm rounding, a blob's rim cell apart now and then (1 and
  // 3 cells of 438,753 in two of the last three runs, none a lava cell): reported, not the lava's. The joiner's grid is
  // the host's imported: exact, whole)
  // (fix round 5, review 5 issue 6: and the live guest's other cells bounded again — a ratio ≥ 0.999 of the whole grid, as
  // the results-screen check bounds its other cells: a rim cell apart now and then, never a region)
  const gbRatio = 1 - gb.differ / Math.max(1, gb.n);
  R('…and its paint (the imported grid) equals the host\'s, lava cells and all; the live guest\'s lava cells equal the host\'s too (the host painted the Slump cliff across the waterline at LOW — burned by the rise — and at HIGH), and its other cells agree to a ratio ≥ 0.999', jA.length === jC.length && jc.differ === 0 && jb.differ === 0 && gc.differ === 0 && gc.inked[0] > 100 && pA >= 18 && gbRatio >= 0.999,
    { lavaCells: { joiner: jc, guest: jb }, grid: { joiner: gc, guest: gb }, guestOtherCellsDiffer: gb.differ, guestRatio: +gbRatio.toFixed(6), painted: pA });
  await wait(3200);
  await A.js(`__inkwave.api.practiceEnd(); 1`);
  for (const cl of [A, B, C]) await cl.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 40000, 500);

  // ---- 3) a timed Turf War 1:30 with three screens; the host leaves mid-rise (35 s)
  await A.js(`__G.net.setSettings({ mode: 'turf', map: 'caldera', time: 'day', duration: 90, botCount: 3 }); 1`);
  for (const cl of [B, C]) await cl.js(`__G.net.setMe({ ready: true }); 1`).catch(() => 0);
  await A.until(`__G.net.canStart()`, 10000).catch(() => 0);
  await A.js(`__G.net.start()`);
  for (const cl of [A, B, C]) await cl.until(`__G.net.state === 'match' && __G.match && __G.match.state === 'playing' && !!__G.match.lava`, 150000, 250);
  const hook = (cl) => cl.js(`(async () => { window.__lv3 = []; const { on } = await import('./src/core/ctx.js'); for (const k of ['lava:move', 'lava:rider', 'lava:rest', 'lava:set']) on(k, (e) => window.__lv3.push([k, +__G.match.lava.clock.t.toFixed(2), e.dir ?? e.up ?? e.level ?? e.why ?? null, !!__G.net.isHost])); return 1; })()`);
  for (const cl of [B, C]) await hook(cl);
  await A.until(`__G.match.lava.clock.t > 35`, 120000, 250);
  const before3 = await st(B);
  await close(0);
  await B.until(`__G.net.isHost && __G.match && __G.match.lava`, 30000, 250).catch(() => {});
  await B.until(`__G.match.lava.clock.t > 63`, 90000, 500).catch(() => {});
  const evB = await J(B, `window.__lv3`), evC = await J(C, `window.__lv3`), b3 = await st(B), c3 = await st(C);
  const fallAt = (ev) => (ev.find((e) => e[0] === 'lava:move' && e[2] === -1) || [])[1] ?? null;
  const deadAt = (ev) => (ev.find((e) => e[0] === 'lava:rider' && e[2] === false) || [])[1] ?? null;
  const f = { B: fallAt(evB), C: fallAt(evC) }, d = { B: deadAt(evB), C: deadAt(evC) };
  R('a timed match: the host leaves mid-rise (35 s) — the new host\'s fall starts at 55 ± 0.4 s on its screen, and the stones turn deadly (the ledges dry) at 61.2 ± 0.4 s on both remaining screens', b3 && b3.host && f.B !== null && Math.abs(f.B - 55) <= 0.4 && d.B !== null && Math.abs(d.B - 61.21) <= 0.4 && d.C !== null && Math.abs(d.C - 61.21) <= 0.4,
    { before: before3, fall: f, stonesDeadly: d, after: { B: b3, C: c3 }, sets: evB.filter((e) => e[0] === 'lava:set').slice(0, 4) });
  for (const cl of [B, C]) await cl.until(`__G.match && __G.match.state === 'results'`, 120000, 500).catch(() => {});
  const res3 = [await J(B, `__G.match && __G.match.result && __G.match.result.winner`), await J(C, `__G.match && __G.match.result && __G.match.result.winner`)];
  R('…and both remaining screens show the same result at time-up', res3[0] === res3[1] && (res3[0] === 0 || res3[0] === 1), { res3 });
  say('done');
};
