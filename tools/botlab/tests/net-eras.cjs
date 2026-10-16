// Bluestone Junction's eras online (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §4.7, H11, §6 step 11; docs/NET.md
// "Bluestone's eras"): nothing of their own on the wire — every screen runs the jump from the host's stage clock.
//   CLIENTS=2 NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs   (a third client is opened
//   for the late join; NET_ARGS='only=turf,host,practice')
// turf      a 1:30 Turf War with bots on bluestone (jumps at 30 and 60 s): every group flips on both screens within 0.4 s of
//           each other (wall clock: both clients run in this one process); after each done both screens agree on `solid`
//           for every era block and on the nav's era (edgeMask); a sprinkler the guest stuck on the Degrayling crates is
//           gone on both screens after their flip; the guest's splats on the Iron Bridge from 0.4 s before its flip to 0.6 s
//           after (the guard window: field 15 carries the painter's stage time) leave the bridge's cells equal on both
//           screens; both results screens show the host's counts
// host      a second match: the host leaves after jump 1; the guest, now the host, runs jump 2 on time (its match clock at
//           60 ± 0.4 s when its era:jump fires) and the match finishes on its screen
// practice  online Practice: the host's stage clock rides its ticks (no movers or pods here: the registry's clock); the host
//           moved to the 3000s, the guest follows within 2 s (a follower's snap → seek('clock')); a third client joins late:
//           its era is 3 within 2 s of its first host tick, importGrid takes the host's turf, its turfTotal equals the
//           host's; the rewind at 180 s takes all three back to the 1880s
module.exports = async ({ clients, R, wait, say, open, close, args }) => {
  const [A, B] = clients;
  const only = (/only=([\w,]+)/.exec(args || '')?.[1] || 'turf,host,practice').split(',');
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  // a recorder on a client: era events with the wall clock (Date.now: one process, one clock) and the stage clock
  const RECORD = `(() => { const CTX = window.__eraCtx; const L = (window.__eraLog = []);
    const st = () => { const m = __G.match, E = m && m.eras; return E ? +E.S.clock.t.toFixed(3) : null; };
    const mc = () => { const m = __G.match; return m && Number.isFinite(m.duration) ? +(m.duration - m.time).toFixed(3) : null; };
    for (const n of ['era:warn', 'era:jump', 'era:flip', 'era:done', 'era:set']) CTX.on(n, (d) => {
      const W = __G.eraWorld, row = { n, wall: Date.now(), t: st(), mc: mc(), group: d && d.group, era: d && d.era, why: d && d.why };
      if (n === 'era:done' && W) { let h = 2166136261; for (const id of W.eraIds) { h ^= __G.level.blocks[id].solid ? 1 : 2; h = Math.imul(h, 16777619) >>> 0; } row.solid = (h >>> 0).toString(16); row.edgeMask = __G.nav.edgeMask; row.navEra = W.navEra; }
      L.push(row);
    });
    return 1; })()`;
  const arm = async (c) => { await c.js(`import('./src/core/ctx.js').then((m) => { window.__eraCtx = m; return 1; })`); await c.js(RECORD); };
  const log = (c) => J(c, `window.__eraLog || []`);
  const lobbyTo = async (mode, extra = '') => {
    await A.js(`__G.net.setSettings({ mode: ${JSON.stringify(mode)}, map: 'bluestone', time: 'day', duration: 90${extra} }); 1`);
  };

  // ------------------------------------------------------------------------------------------- turf
  let code = await A.js(`__G.net.create('Hosty')`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 20000);
  const startMatch = async (cs) => {
    await B.js(`__G.net.setMe({ ready: true }); 1`).catch(() => 0);
    await A.until(`__G.net.canStart()`, 15000);
    await A.js(`__G.net.start()`);
    for (const c of cs) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing' && !!__G.match.eras`, 180000, 250);
    for (const c of cs) await arm(c);
  };
  if (only.includes('turf')) {
    await lobbyTo('turf', ', botCount: 4');
    await startMatch([A, B]);
    say('turf: playing to jump 1…');
    const sched = await J(A, `__G.match.eras.sched.jumps`);
    R('turf: a 1:30 Turf War on bluestone runs the eras on both screens (jumps at 30 and 60 s)', sched.length === 2 && sched[0].at === 30 && sched[1].at === 60, { sched });
    // the guest sticks a sprinkler on Alpha's Degrayling crates (they vanish at jump 1's flip, r 28.7: J + 1.15)
    await B.until(`__G.match.eras.S.clock.t > 18`, 60000, 200);
    const dev = await J(B, `(() => { const L = __G.level, cr = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0), me = __G.local, S = window.__SUBS;
      return { cr: [cr.aabbMin.x, cr.center.z, cr.id] }; })()`);
    const thrown = await B.js(`import('./src/config.js').then(({ SUBS }) => { const L = __G.level, cr = L.blocks[${dev.cr[2]}], V = __G.local.pos.constructor;
      const it = __G.subs._throw(__G.local, SUBS.sprinkler, new V(cr.aabbMin.x - 0.9, 1.6, cr.center.z), new V(7, 0.5, 0), false); window.__eraDev = it; return !!it; })`);
    await wait(1500);
    const devB = await J(B, `(() => { const it = window.__eraDev, L = __G.level; return it ? { state: it.state, onCrates: it.face >= 0 && L.faces[it.face] && L.blocks[L.faces[it.face].block].tag === 'crates-stack', gid: it.gid ?? it.id ?? null, pos: [it.pos.x, it.pos.y, it.pos.z].map((v) => +v.toFixed(2)) } : null; })()`);
    const ghostA = async () => J(A, `(() => { const p = ${JSON.stringify(devB && devB.pos)}; if (!p) return null; const g = __G.subs.items.filter((it) => it.ghost && it.state !== 'dead' && Math.hypot(it.pos.x - p[0], it.pos.z - p[2]) < 1.2); return g.length; })()`);
    const ghostBefore = await ghostA();
    // the guest's splats on the Iron Bridge's middle span through its flip's guard window (it appears at jump 1)
    const br = await J(B, `(() => { const L = __G.level, W = __G.eraWorld, b = L.blocks.find((x) => x.tag === 'iron-bridge' && x.eraGroup === 'bridge-2' && x.center.z < 0); const g = W.groups[b.eraG]; return { id: b.id, x: b.center.x, y: b.aabbMax.y, z: b.center.z, F: 30 + g.rg / W.speed, faces: b.faces.filter((f) => f >= 0) }; })()`);
    await B.until(`__G.match.eras.S.clock.t > ${br.F - 0.45}`, 60000, 20);
    const shots = await B.js(`(async () => { const E = __G.match.eras, V = __G.local.pos.constructor, out = []; let k = 0;
      while (E.S.clock.t < ${br.F + 0.6}) { const t = E.S.clock.t; __G.paint.splat(new V(${br.x} + ((k % 5) - 2) * 1.0, ${br.y} + 0.2, ${br.z} + ((k % 3) - 1) * 0.8), 1.1, __G.local.team, {}); out.push(+(t - ${br.F}).toFixed(2)); k++; await new Promise((r) => setTimeout(r, 60)); }
      return out; })()`);
    // (the bridge's cells compared once the replays have landed, before done: the bots' nav still has no bridge then)
    await B.until(`__G.match.eras.S.clock.t > ${br.F + 1.7}`, 30000, 50);
    const cells = async (c) => J(c, `(() => { const L = __G.level, P = __G.paint, out = []; for (const fid of ${JSON.stringify(br.faces)}) { const f = L.faces[fid]; if (!f || !f.atlas) continue; for (let k = f.grid; k < f.grid + f.nu * f.nv; k++) out.push(P.grid[k]); } return out; })()`);
    const [cA, cB] = await Promise.all([cells(A), cells(B)]), diffN = cA.reduce((s, v, i) => s + (v !== cB[i] ? 1 : 0), 0), inkedN = cB.filter((v) => v).length;
    say('turf: playing to the end…');
    await A.until(`__G.match && (__G.match.eras && __G.match.eras.S.clock.t > 66 || __G.match.state !== 'playing')`, 120000, 300);
    await wait(1200);
    const devAfter = [await J(B, `(() => { const it = window.__eraDev; return it ? it.state : null; })()`), await ghostA()];
    const la = await log(A), lb = await log(B);
    const flips = (L0) => { const m = new Map(); for (const r of L0) if (r.n === 'era:flip' && !m.has(r.group + '@' + Math.round(r.t / 30))) m.set(r.group + '@' + Math.round(r.t / 30), r); return m; };
    const fa = flips(la), fb = flips(lb), skew = [];
    for (const [k, r] of fa) { const q = fb.get(k); if (q) skew.push([k, q.wall - r.wall]); }
    const maxSkew = skew.length ? Math.max(...skew.map((x) => Math.abs(x[1]))) / 1000 : null;
    R('turf: every group flips on both screens within 0.4 s (wall clock) of each other, through both jumps',
      skew.length >= 50 && maxSkew < 0.4, { groups: skew.length, maxSkew_s: maxSkew, worst: skew.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4), flipsA: fa.size, flipsB: fb.size });
    const dA = la.filter((r) => r.n === 'era:done'), dB = lb.filter((r) => r.n === 'era:done');
    R('turf: after each done both screens agree on solid for every era block and on the nav\'s era (edgeMask)',
      dA.length === 2 && dB.length === 2 && dA.every((r, i) => r.solid === dB[i].solid && r.edgeMask === dB[i].edgeMask && r.navEra === dB[i].navEra) && dA[1].navEra === 3,
      { A: dA.map((r) => [r.era, r.solid, r.edgeMask, r.t]), B: dB.map((r) => [r.era, r.solid, r.edgeMask, r.t]) });
    R('turf: a sprinkler the guest stuck on the Degrayling crates is gone on both screens after their flip (the owner pops it, its end record ends the ghost)',
      thrown && devB && devB.onCrates && ghostBefore >= 1 && devAfter[0] === 'dead' && devAfter[1] === 0, { devB, ghostBefore, after: devAfter });
    R('turf: the guest\'s splats on the Iron Bridge from 0.4 s before its flip to 0.6 s after (the guard window; field 15 carries the painter\'s stage time) leave its cells equal on both screens',
      shots.length >= 8 && Math.min(...shots) <= -0.3 && Math.max(...shots) >= 0.5 && cA.length > 20 && diffN === 0 && inkedN > 0, { shots: shots.length, span: [Math.min(...shots), Math.max(...shots)], cells: cA.length, inked: inkedN, differ: diffN });
    for (const c of [A, B]) await c.until(`__G.match && __G.match.state === 'results' && !!__G.match.result`, 150000, 500);
    const res = [await J(A, `{ cov: __G.match.result.coverage.map((x) => +x.toFixed(4)), w: __G.match.result.winner }`), await J(B, `{ cov: __G.match.result.coverage.map((x) => +x.toFixed(4)), w: __G.match.result.winner }`)];
    R('turf: both results screens show the host\'s counts (the 3000s\' turf, the same winner)', JSON.stringify(res[0]) === JSON.stringify(res[1]), { res });
    for (const c of [A, B]) await c.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 60000, 500);
  }

  // ------------------------------------------------------------------------------------------- host change
  if (only.includes('host')) {
    await lobbyTo('turf', ', botCount: 4');
    await startMatch([A, B]);
    say('host: playing to jump 1\'s done…');
    await B.until(`__G.match.eras.S.clock.t > 35`, 120000, 300);
    close(0);
    say('host: the host left');
    await B.until(`__G.net.isHost && __G.match && !__G.match.follower`, 30000, 250).catch(() => {});
    await B.until(`(window.__eraLog || []).some((r) => r.n === 'era:jump' && r.t > 59)`, 90000, 250).catch(() => {});
    const lb = await log(B), j2 = lb.find((r) => r.n === 'era:jump' && r.t > 59), d2 = lb.find((r) => r.n === 'era:done' && r.era === 3);
    await wait(5000);
    const after = await J(B, `({ host: __G.net.isHost, follower: !!(__G.match && __G.match.follower), era: __G.match && __G.match.eras && __G.match.eras.era, state: __G.match && __G.match.state })`);
    R('host: after the host leaves (after jump 1), the new host runs jump 2 on time — its match clock at 60 ± 0.4 s when its era:jump fires — and the 3000s arrive',
      !!j2 && Math.abs(j2.mc - 60) < 0.4 && Math.abs(j2.t - 60) < 0.4 && after.host && !after.follower && (after.era === 3 || (d2 && d2.era === 3)), { jump2: j2, done2: d2, after });
    await B.until(`__G.match && (__G.match.state === 'results' || __G.match.state === 'finish')`, 120000, 500).catch(() => {});
    R('host: … and the match finishes on the new host\'s screen', await B.js(`!!__G.match && (__G.match.state === 'results' || __G.match.state === 'finish')`));
  }

  // ------------------------------------------------------------------------------------------- practice
  if (only.includes('practice')) {
    // (after the host test the guest is the host of a room of one: start again with two fresh clients)
    let H = A, G2 = B;
    if (only.includes('host')) { H = B; G2 = await open(0, ''); }
    if (!only.includes('turf') && !only.includes('host')) { /* the turf room's lobby is still there */ }
    await H.until(`__G.net.state === 'lobby' && __G.mode === 'menu'`, 60000, 500).catch(() => {});
    if (only.includes('host')) { code = await H.js(`__G.net.code`); }
    await H.js(`__G.net.setSettings({ mode: 'practice', map: 'bluestone', time: 'day', botCount: 0 }); 1`);
    if (only.includes('host')) { await G2.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty2').then(() => 1)`); await H.until(`__G.net.lobby.players.length === 2`, 20000); }
    await H.js(`__G.net.start()`);
    for (const c of [H, G2]) await c.until(`__G.net.state === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing' && !!__G.match.eras`, 180000, 250);
    for (const c of [H, G2]) await arm(c);
    await wait(3000);
    const st = async (c) => J(c, `(() => { const E = __G.match.eras; return { t: +E.S.clock.t.toFixed(2), era: E.era, navEra: __G.eraWorld.navEra, turf: __G.paint.turfTotal, phase: E.phase }; })()`);
    const s0 = [await st(H), await st(G2)];
    R('practice: online Practice runs the eras from the host\'s stage clock (its ticks carry it: no movers or pods here) — the clocks agree within 0.4 s, both in the 1880s',
      Math.abs(s0[0].t - s0[1].t) < 0.4 && s0[0].era === 1 && s0[1].era === 1, { s0 });
    // the host's stage clock moved to the 3000s (seek on the host; the guest's clock snaps to the host's ticks → seek)
    await H.js(`(() => { const E = __G.match.eras; E.S.clock.t = 125; E.seek(125, 'test'); return 1; })()`);
    const tSnap = Date.now();
    await G2.until(`__G.match.eras.era === 3`, 8000, 100).catch(() => {});
    const follow = (Date.now() - tSnap) / 1000, s1 = [await st(H), await st(G2)];
    R('practice: the host moved to the 3000s; the guest follows within 2 s (its clock snaps to the host\'s: seek(\'clock\')), turf totals equal',
      follow < 2 && s1[0].era === 3 && s1[1].era === 3 && s1[0].navEra === 3 && s1[1].navEra === 3 && s1[0].turf === s1[1].turf, { follow_s: +follow.toFixed(2), s1 });
    // a late joiner in era 3
    await H.js(`(() => { const V = __G.local.pos.constructor; for (let i = 0; i < 30; i++) __G.paint.splat(new V(-20 + (i % 6) * 2, 0.2, -40 + ((i / 6) | 0) * 2), 1.2, i & 1, {}); return 1; })()`);
    await wait(1500);
    const C = await open(2, '');
    const tJoin = Date.now();
    await C.js(`__G.net.join(${JSON.stringify(code)}, 'Latey').then(() => 1)`);
    let firstTick = null, eraAt = null;
    for (let i = 0; i < 900; i++) {
      const s = await J(C, `(() => { const m = __G.match, n = __G.netm; return { tick: !!(n && n.stageSync), era: m && m.eras ? m.eras.era : null, playing: !!(m && m.state === 'playing' && m.practice) }; })()`).catch(() => ({}));
      if (s.tick && firstTick === null) firstTick = Date.now();
      if (s.era === 3 && s.playing && eraAt === null) eraAt = Date.now();
      if (firstTick !== null && eraAt !== null) break;
      await wait(100);
    }
    await C.until(`__G.netm && !__G.netm.stagePending && !__G.netm.podsPending`, 30000, 250).catch(() => {});
    await wait(2500);
    const sc = await st(C), sh = await st(H);
    const lc = await J(C, `(window.__eraLog || [])`).catch(() => []);
    const imp = await J(C, `(() => { const P = __G.paint; let n = 0; for (let k = 0; k < P.grid.length; k++) if (P.grid[k] && P.live[k]) n++; return { inked: n, counts: [...P.counts] }; })()`);
    const imh = await J(H, `(() => { const P = __G.paint; let n = 0; for (let k = 0; k < P.grid.length; k++) if (P.grid[k] && P.live[k]) n++; return { inked: n, counts: [...P.counts] }; })()`);
    R('practice: a late joiner in the 3000s — its era is 3 within 2 s of its first host tick, its importGrid takes the host\'s turf (the same inked live cells), its turfTotal equals the host\'s',
      firstTick !== null && eraAt !== null && (eraAt - firstTick) / 1000 < 2 && sc.era === 3 && sc.navEra === 3 && sc.turf === sh.turf && Math.abs(imp.inked - imh.inked) <= Math.max(3, imh.inked * 0.01) && imh.inked > 50,
      { era3After_s: firstTick !== null && eraAt !== null ? +((eraAt - firstTick) / 1000).toFixed(2) : null, joinToTick_s: firstTick ? +((firstTick - tJoin) / 1000).toFixed(1) : null, joiner: sc, host: sh, inked: [imp, imh] });
    // the rewind (3 → 1 at 180 s) on all three
    await H.js(`(() => { const E = __G.match.eras; E.S.clock.t = 176; E.seek(176, 'test'); return 1; })()`);
    for (const c of [H, G2, C]) await c.until(`__G.match.eras.S.clock.t > 186`, 30000, 250).catch(() => {});
    const s3 = [await st(H), await st(G2), await st(C)];
    R('practice: the rewind at 180 s takes all three screens back to the 1880s (nav era 1, the same turf total)', s3.every((s) => s.era === 1 && s.navEra === 1) && s3[1].turf === s3[0].turf && s3[2].turf === s3[0].turf, { s3 });
  }
  say('done');
};
