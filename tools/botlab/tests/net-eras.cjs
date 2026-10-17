// Bluestone Junction's eras online (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §4.7, H11, §6 step 11; docs/NET.md
// "Bluestone's eras"): nothing of their own on the wire — every screen runs the jump from the host's stage clock.
//   CLIENTS=2 URLQ=wipstages NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs   (a third client is opened
//   for the late join; NET_ARGS='only=turf,host,practice')
// turf      a 1:30 Turf War with bots on bluestone (jumps at 30 and 60 s): every group flips on both screens within 0.4 s of
//           each other (wall clock: both clients run in this one process), and the two stage clocks agree (each screen's
//           era update logged with the wall time: the follower's clock is the host's to within 0.15 s, median, and 0.25 s,
//           90th percentile — the trip to the relay added back, final review issue 4); after each done both screens agree
//           on `solid` for every era block and on the nav's era (edgeMask); a sprinkler the guest stuck on the Degrayling
//           crates' wall and a Drip Curtain it threw onto their roof (final review, issue 1) are gone on both screens after
//           their flip (the guest kept alive through it: a precondition that both ghosts stood on the host's screen);
//           the guest's splats on the Iron Bridge from 0.4 s before its flip to 0.6 s after (the guard window: field 15
//           carries the painter's stage time) leave the bridge's cells equal on both screens; both results screens show
//           the host's counts. The contract's lagged run (ENGINE §4.7, §6 step 11): URLQ='wipstages&netlag=150&netjitter=50'
//           NET_ARGS='only=turf' — the same checks and thresholds
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
    // each era update with the wall clock and the runtime's time after it (the two screens' clocks compared offline)
    const E = __G.match.eras, C = (window.__eraClk = []), u = E.update.bind(E);
    E.update = (dt, t) => { u(dt, t); C.push([Date.now(), +E._tHigh.toFixed(4)]); if (C.length > 40000) C.splice(0, 10000); };
    return 1; })()`;
  const arm = async (c) => { await c.js(`import('./src/core/ctx.js').then((m) => { window.__eraCtx = m; return 1; })`); await c.js(RECORD); };
  const log = (c) => J(c, `window.__eraLog || []`);
  // (bluestone is a stage under construction: the room lists it only with ?wipstages — run with URLQ=wipstages)
  const lobbyTo = async (mode, extra = '', H = A) => {
    await H.js(`__G.net.setSettings({ mode: ${JSON.stringify(mode)}, map: 'bluestone', time: 'day', duration: 90${extra} }); 1`);
    const map = await H.js(`__G.net.lobby.map`);
    if (map !== 'bluestone') throw new Error(`the room would not take bluestone (lobby map ${map}): run with URLQ=wipstages`);
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
    // the guest sticks a sprinkler on Alpha's Degrayling crates (they vanish at jump 1's flip, r 28.7: J + 1.15): its own
    // player, put on Swimston 3 m west of them, throws it flat at their west face (the game's own sub use: it records it)
    await B.until(`__G.match.eras.S.clock.t > 18`, 60000, 250);
    // (the guest is kept alive through the crates' flip at J + 1.15: invulnerable from here to 34 s — teleported among
    //  the bots on Swimston it was splatted once, and a splat takes its sprinkler with it: final review, issue 4)
    const thrown = await B.js(`import('./src/config.js').then(({ SUBS }) => { const L = __G.level, cr = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0), me = __G.local;
      me.invuln = 16;
      me.pos.set(cr.aabbMin.x - 2.9, 0.02, cr.aabbMax.z - 0.7); me.vel.set(0, 0, 0); me.aimYaw = Math.PI / 2; me.aimPitch = -0.28;
      const n0 = __G.subs.items.length; __G.subs.use(me, SUBS.sprinkler); window.__eraDev = __G.subs.items[__G.subs.items.length - 1]; return __G.subs.items.length > n0; })`);
    await wait(1800);
    const devB = await J(B, `(() => { const it = window.__eraDev, L = __G.level; return it ? { state: it.state, onCrates: it.face >= 0 && !!L.faces[it.face] && L.blocks[L.faces[it.face].block].tag === 'crates-stack', gid: it.gid ?? null, pos: [it.pos.x, it.pos.y, it.pos.z].map((v) => +v.toFixed(2)) } : null; })()`);
    const ghostNear = async (p, kind) => J(A, `(() => { const p = ${JSON.stringify(p)}; if (!p) return null; return __G.subs.items.filter((it) => it.ghost && it.state !== 'dead' && it.kind === ${JSON.stringify(kind)} && Math.hypot(it.pos.x - p[0], it.pos.z - p[2]) < 1.2).length; })()`);
    const ghostA = async () => ghostNear(devB && devB.pos, 'sprinkler');
    const ghostBefore = await ghostA();
    // a Drip Curtain onto the crates' roof (2.8 m; a curtain has no face and lives ~9 s: thrown at 28.6 s, 2.5 s before
    // the flip): the game's own sub use (its record), from a throw point over the roof, straight down
    await B.until(`__G.match.eras.S.clock.t > 28.6`, 60000, 100);
    const curThrown = await B.js(`import('./src/config.js').then(({ SUBS }) => { const L = __G.level, cr = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0), me = __G.local, P = __G.projectiles, tv = P.throwVelocity;
      const back = me.pos.clone(); me.pos.set(cr.center.x, cr.aabbMax.y + 0.2, cr.center.z - 1.0);
      P.throwVelocity = (a, sp, out) => out.set(0.3, -3, 0);
      try { __G.subs.use(me, SUBS.curtain); } finally { P.throwVelocity = tv; }
      me.pos.copy(back); me.vel.set(0, 0, 0);
      window.__eraCur = __G.subs.items[__G.subs.items.length - 1]; return window.__eraCur && window.__eraCur.kind === 'curtain'; })`);
    await wait(900);
    const curB = await J(B, `(() => { const it = window.__eraCur; return it ? { state: it.state, pos: [it.pos.x, it.pos.y, it.pos.z].map((v) => +v.toFixed(2)), hp: +(it.hp || 0).toFixed(1), t: +__G.match.eras.S.clock.t.toFixed(2) } : null; })()`);
    const curGhostBefore = await ghostNear(curB && curB.pos, 'curtain');
    // the guest's splats on the Iron Bridge's middle span through its flip's guard window (it appears at jump 1)
    const br = await J(B, `(() => { const L = __G.level, W = __G.eraWorld, b = L.blocks.find((x) => x.tag === 'iron-bridge' && x.eraGroup === 'bridge-2' && x.center.z < 0); const g = W.groups[b.eraG]; return { id: b.id, x: b.center.x, y: b.aabbMax.y, z: b.center.z, F: 30 + g.rg / W.speed, faces: b.faces.filter((f) => f >= 0) }; })()`);
    await B.until(`__G.match.eras.S.clock.t > ${br.F - 3}`, 60000, 250);
    const shots = await B.js(`(async () => { const E = __G.match.eras, V = __G.local.pos.constructor, out = []; let k = 0;
      while (E.S.clock.t < ${br.F - 0.42}) await new Promise((r) => setTimeout(r, 15));
      while (E.S.clock.t < ${br.F + 0.6}) { const t = E.S.clock.t; __G.paint.splat(new V(${br.x} + ((k % 5) - 2) * 1.0, ${br.y} + 0.2, ${br.z} + ((k % 3) - 1) * 0.8), 1.1, __G.local.team, {}); out.push(+(t - ${br.F}).toFixed(2)); k++; await new Promise((r) => setTimeout(r, 60)); }
      return out; })()`);
    // (the bridge's cells compared once the replays have landed, before done: the bots' nav still has no bridge then)
    await B.until(`__G.match.eras.S.clock.t > ${br.F + 1.7}`, 30000, 50);
    const cells = async (c) => J(c, `(() => { const L = __G.level, P = __G.paint, out = []; for (const fid of ${JSON.stringify(br.faces)}) { const f = L.faces[fid]; if (!f || !f.atlas) continue; for (let k = f.grid; k < f.grid + f.nu * f.nv; k++) out.push(P.grid[k]); } return out; })()`);
    // (the host's bots paint too, and with netlag a splat is in flight for ~0.2 s: the cells are compared up to six times,
    //  0.4 s apart — paint in flight differs once and then agrees, a guard verdict that differs would differ every time)
    let cA = [], cB = [], diffN = -1; const tries = [];
    for (let k = 0; k < 6 && diffN !== 0; k++) {
      if (k) await wait(400);
      [cA, cB] = await Promise.all([cells(A), cells(B)]);
      diffN = cA.reduce((s, v, i) => s + (v !== cB[i] ? 1 : 0), 0); tries.push(diffN);
    }
    const inkedN = cB.filter((v) => v).length;
    // after each done (+ 1.5 s on each screen's own clock): the era blocks' solid flags and the nav's era on both screens
    const snap = async (c) => J(c, `(() => { const W = __G.eraWorld; let h = 2166136261; for (const id of W.eraIds) { h ^= __G.level.blocks[id].solid ? 1 : 2; h = Math.imul(h, 16777619) >>> 0; } return { t: +__G.match.eras.S.clock.t.toFixed(2), era: __G.match.eras.era, solid: (h >>> 0).toString(16), edgeMask: __G.nav.edgeMask, navEra: W.navEra }; })()`);
    const after = [];
    const done1 = 30 + (await J(A, `__G.eraWorld.doneOff`));
    for (const c of [A, B]) await c.until(`__G.match.eras.S.clock.t > ${done1 + 1.5}`, 60000, 250);
    after.push([await snap(A), await snap(B)]);
    // the stage clocks of the two screens sampled together (the skew a flip's wall time shows)
    const skewS = [];
    for (let i = 0; i < 8; i++) { const [ta, tb] = await Promise.all([A.js('__G.match.eras.S.clock.t'), B.js('__G.match.eras.S.clock.t')]); skewS.push(+(ta - tb).toFixed(3)); await wait(700); }
    for (const c of [A, B]) await c.until(`__G.match.eras.S.clock.t > ${done1 + 30 + 1.5}`, 90000, 250);
    after.push([await snap(A), await snap(B)]);
    say('turf: playing to the end…');
    await A.until(`__G.match && (__G.match.eras && __G.match.eras.S.clock.t > 66 || __G.match.state !== 'playing')`, 120000, 300);
    await wait(1200);
    const devAfter = [await J(B, `(() => { const it = window.__eraDev; return it ? it.state : null; })()`), await ghostA()];
    const curAfter = [await J(B, `(() => { const it = window.__eraCur; return it ? it.state : null; })()`), await ghostNear(curB && curB.pos, 'curtain')];
    const la = await log(A), lb = await log(B);
    // the two stage clocks compared at the same wall time: for each of the follower's era updates from done 1 + 2 s to
    // 28 s later, the host's clock interpolated at that wall time, minus the follower's
    const [ka, kb] = [await J(A, `window.__eraClk || []`), await J(B, `window.__eraClk || []`)];
    const clockSkew = (() => {
      const out = [], per = new Map();
      let i = 1;
      for (const [w, tb] of kb) {
        if (tb < done1 + 2 || tb > done1 + 28) continue;
        while (i < ka.length && ka[i][0] < w) i++;
        if (i >= ka.length || ka[i - 1][0] > w) continue;
        const [w0, t0] = ka[i - 1], [w1, t1] = ka[i], ta = w1 > w0 ? t0 + ((t1 - t0) * (w - w0)) / (w1 - w0) : t0;
        out.push(ta - tb);
        const k = Math.floor(tb); (per.get(k) || per.set(k, []).get(k)).push(ta - tb);
      }
      const ab = out.map(Math.abs).sort((x, y) => x - y), q = (k) => (ab.length ? +ab[Math.min(ab.length - 1, Math.floor(ab.length * k))].toFixed(3) : null);
      const signed = [...out].sort((x, y) => x - y);
      // (per second of the follower's clock: the signed median, host − follower; and each screen's frames over 1/24 s, whose
      //  lost time the clock tick takes back: the game clock advances by at most 1/24 s a frame)
      const series = [...per].map(([k, v]) => { v.sort((x, y) => x - y); return [k, +v[v.length >> 1].toFixed(2)]; });
      const longFrames = (L0) => { let n = 0, lost = 0; for (let j = 1; j < L0.length; j++) { const d = (L0[j][0] - L0[j - 1][0]) / 1000; if (d > 1 / 24 + 0.005) { n++; lost += d - 1 / 24; } } return { n, lostS: +lost.toFixed(2) }; };
      return { n: out.length, median: q(0.5), p90: q(0.9), max: q(1), signedMedian: signed.length ? +signed[signed.length >> 1].toFixed(3) : null, series, longFrames: [longFrames(ka), longFrames(kb)] };
    })();
    const lagQ = await A.js(`location.search`);
    const flips = (L0) => { const m = new Map(); for (const r of L0) if (r.n === 'era:flip' && !m.has(r.group + '@' + Math.round(r.t / 30))) m.set(r.group + '@' + Math.round(r.t / 30), r); return m; };
    const fa = flips(la), fb = flips(lb), skew = [];
    for (const [k, r] of fa) { const q = fb.get(k); if (q) skew.push([k, q.wall - r.wall]); }
    const maxSkew = skew.length ? Math.max(...skew.map((x) => Math.abs(x[1]))) / 1000 : null;
    const perJump = [1, 2].map((j) => { const v = skew.filter((x) => x[0].endsWith('@' + j)).map((x) => Math.abs(x[1]) / 1000); return v.length ? { groups: v.length, max_s: +Math.max(...v).toFixed(3), median_s: +v.sort((a, b) => a - b)[v.length >> 1].toFixed(3) } : null; });
    const lag = (/netlag=(\d+)/.exec(lagQ) || [])[1] || 0, jit = (/netjitter=(\d+)/.exec(lagQ) || [])[1] || 0;
    // (each screen's clock at the wall time of the worst flips, from the era-update logs: a flip lands on the frame that
    //  crosses its time, so on a loaded machine a slow frame adds up to its length to the skew)
    const clkAt = (K, w) => { for (let j = 1; j < K.length; j++) if (K[j][0] >= w) { const [w0, t0] = K[j - 1], [w1, t1] = K[j]; return +(w1 > w0 ? t0 + ((t1 - t0) * (w - w0)) / (w1 - w0) : t0).toFixed(3); } return null; };
    const atFlips = skew.slice().sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3).map(([k]) => { const r = fa.get(k), q = fb.get(k); return { k, hostFlip: [r.wall, clkAt(ka, r.wall), clkAt(kb, r.wall)], guestFlip: [q.wall, clkAt(ka, q.wall), clkAt(kb, q.wall)] }; });
    R(`turf${lag ? ` (netlag ${lag} / jitter ${jit})` : ''}: every group flips on both screens within 0.4 s (wall clock) of each other, through both jumps`,
      skew.length >= 50 && maxSkew < 0.4, { groups: skew.length, maxSkew_s: maxSkew, perJump, clockSkew_s: skewS, worst: skew.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4), atFlips, flipsA: fa.size, flipsB: fb.size });
    R(`turf${lag ? ` (netlag ${lag} / jitter ${jit})` : ''}: the follower's stage clock is the host's at the same wall time — within 0.15 s (median) and 0.25 s (90th percentile) over 26 s after jump 1 (the trip to the relay added back, final review issue 4)`,
      clockSkew.n >= 200 && clockSkew.median < 0.15 && clockSkew.p90 < 0.25, { clockSkew, sampled: skewS, rtt: [await A.js(`Math.round(__G.net?.tr?.rtt || __G.netm?.s?.tr?.rtt || 0)`).catch(() => null), await B.js(`Math.round(__G.netm?.s?.tr?.rtt || 0)`).catch(() => null)] });
    R('turf: after each done both screens agree on solid for every era block and on the nav\'s era (edgeMask)',
      after.length === 2 && after.every(([a, b]) => a.solid === b.solid && a.edgeMask === b.edgeMask && a.navEra === b.navEra && a.era === b.era) && after[0][0].navEra === 2 && after[1][0].navEra === 3,
      { after, donesB: lb.filter((r) => r.n === 'era:done').map((r) => [r.era, r.t]) });
    R('turf (precondition): the guest\'s sprinkler stuck on the Degrayling crates\' wall and its Drip Curtain on their roof both stand on both screens before the flip (the host has their ghosts)',
      thrown && devB && devB.onCrates && devB.state === 'spray' && ghostBefore >= 1 && curThrown && curB && curB.state === 'curtain' && Math.abs(curB.pos[1] - 2.8) < 0.1 && curGhostBefore >= 1, { devB, ghostBefore, curB, curGhostBefore });
    R('turf: that sprinkler and that curtain are gone on both screens after the crates\' flip (the owner pops them, the end record [2, gid, 2] ends the ghosts)',
      devAfter[0] === 'dead' && devAfter[1] === 0 && curAfter[0] === 'dead' && curAfter[1] === 0, { sprinkler: devAfter, curtain: curAfter });
    R('turf: the guest\'s splats on the Iron Bridge from 0.4 s before its flip to 0.6 s after (the guard window; field 15 carries the painter\'s stage time) leave its cells equal on both screens',
      shots.length >= 8 && Math.min(...shots) <= -0.3 && Math.max(...shots) >= 0.5 && cA.length > 20 && diffN === 0 && inkedN > 0, { shots: shots.length, span: [Math.min(...shots), Math.max(...shots)], cells: cA.length, inked: inkedN, differ: diffN, differPerTry: tries });
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
    if ((await H.js(`__G.net.lobby.map`)) !== 'bluestone') throw new Error('the room would not take bluestone for Practice (URLQ=wipstages)');
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
