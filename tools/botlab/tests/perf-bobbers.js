// [b5-subs] The Chain Bobber's budget for "as many as you like" (tools/botlab/jobs/batch5/subs/SPEC.md C4.1): the worst
// case the game must carry is 8 players × 24 = 192 live bobbers and their tethers.
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/perf-bobbers.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='quick' (300-frame phases, 900 in the live one: a smoke run)
// Rendered frames, stepped by hand (the page's own loop frozen: no dynamic resolution, no fps cap); a frame's time is
// its CPU work and the GPU's (gl.finish() after each, so a heavy draw shows). Phases:
//  1 the empty testbox, 8 bots standing still — 600 frames: p95 frame time, draw calls;
//  2 the same with 192 live bobbers (24 for each of the 8, spread over the deck in 3- and 4-chains, three of them 8-chains)
//    — 600 frames;
//  3 the three 8-chains set off at once — the 60 frames that follow (and the records a second they make: the wire);
//  4 a live 4 v 4 bot Turf match on the testbox (fighting, routing, scanning devices), 1800 frames, first with no bobbers,
//    then with 24 per bot kept topped up by the script: p95 frame time, the bots' think time (every BotBrain.update a frame,
//    summed), the bobber danger discs, SIGHT_STATS.deferred a second.
// Pass: phase 2's p95 within +2 ms of phase 1's, phase 3's within +4 ms; draw calls up by ≤ 20; the kit's own tick
// < 0.5 ms a frame (p95); phase 4 with bobbers within +3 ms (p95) of without, the bots' think p95 within +1.0 ms, and
// SIGHT_STATS.deferred at most doubled.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { SIGHT_STATS } = await import('./src/game/botSight.js');
  const { specialDangers } = await import('./src/game/botSpecials.js');
  const G = window.__G, K = SUB_KITS.bobber, S = G.subs;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const QUICK = /quick/.test(window.__pageArgs || '');
  const N1 = QUICK ? 300 : 600, N4 = QUICK ? 900 : 1800;
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DT = 1 / 60, gl = G.renderer.getContext();
  const r2 = (x) => Math.round(x * 100) / 100;
  const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  let hook = null;
  // one rendered frame: its wall time (CPU + GPU: gl.finish), the draw calls, the kit's tick, the bots' think
  const thinkAcc = { t: 0 };
  const frame = () => {
    if (hook) hook();
    thinkAcc.t = 0;
    const t0 = performance.now();
    g._skipRender = false; g._frame(DT); gl.finish();
    return { ms: performance.now() - t0, calls: G.renderer.info.render.calls, kit: K.lastTickMs || 0, think: thinkAcc.t };
  };
  const run = (n, fn) => { const F = []; for (let i = 0; i < n; i++) { F.push(frame()); if (fn) fn(i); } return F; };
  const stats = (F) => ({ p50: r2(pct(F.map((f) => f.ms), 0.5)), p95: r2(pct(F.map((f) => f.ms), 0.95)), calls: Math.round(pct(F.map((f) => f.calls), 0.5)), callsMax: Math.max(...F.map((f) => f.calls)), kit95: r2(pct(F.map((f) => f.kit), 0.95)), think95: r2(pct(F.map((f) => f.think), 0.95)) });
  const me = m.local, A = m.actors;
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const brain0 = new Map(); for (const a of A) if (a.bot) brain0.set(a, a.bot.update);
  // (the bots' think time: every brain's update timed, summed a frame)
  const timed = (a, fn) => function (dt) { const t = performance.now(); try { return fn.call(this, dt); } finally { thinkAcc.t += performance.now() - t; } };
  const still = () => { for (const a of A) if (a.bot) a.bot.update = timed(a, () => zero(a)); };
  const live = () => { for (const a of A) if (a.bot) a.bot.update = timed(a, brain0.get(a)); };
  const put = (a, p) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); };
  const camAt = () => { g.rig.follow(me, true); g.rig.yaw = 0; g.rig.pitch = -0.32; };
  const lay = () => {
    // three 8-chains in the first three rows (owners 0, 1, 2: one a row, 3 m apart), then rows 4.6 m apart of runs of
    // 4 / 4 / 3 / 3 (3 m apart in a run, 3.4 m between runs), owners round-robin — no two runs of one owner within 5 m,
    // so each run is its own chain — until every owner has 24
    const owners = A.slice(0, 8), count = new Map(owners.map((a) => [a, 0])), sizes = [4, 4, 3, 3];
    const add = (o, x, z) => { K.throwFrom(o, V(x, 0.6, z), V(0, -3, 0)); count.set(o, count.get(o) + 1); };
    for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) add(owners[k], -25 + i * 3, -36 + k * 4.6);
    let run = 0;
    for (let row = 3; row < 17; row++) {
      const z = -36 + row * 4.6;
      if (z > 38) break;
      let x = -25.5;
      for (let r = 0; r < sizes.length; r++, run++) {
        let o = owners[run % 8];
        for (let tries = 0; tries < 8 && count.get(o) >= 24; tries++) o = owners[(run + 1 + tries) % 8] === o ? o : owners[(run + 1 + tries) % 8];
        for (let i = 0; i < sizes[r]; i++, x += 3) if (count.get(o) < 24 && x <= 26) add(o, x, z);
        x += 0.4;
      }
    }
    return count;
  };
  const liveN = () => K.items.filter((x) => x.state === 'live').length;
  try {
    // ---- 1. empty, bots still
    still();
    for (let i = 0; i < A.length; i++) put(A[i], V(-12 + (i % 4) * 8, 0, 38 - Math.floor(i / 4) * 3));
    put(me, V(0, 0, 30)); camAt();
    run(60);
    const F1 = run(N1), s1 = stats(F1);
    // ---- 2. 192 live bobbers
    const cnt = lay();
    run(90);   // (settled, linked)
    const n2 = liveN(), chains = new Set(K.items.filter((x) => x.state === 'live').map((x) => x.chain)), sz = [...chains].map((c) => c.n);
    const F2 = run(N1), s2 = stats(F2);
    // ---- 3. three 8-chains set off at once
    const recs0 = { ...K.BOBBER_STATS.records };
    const eight = [...chains].filter((c) => c.n === 8).map((c) => c.items[0]);
    for (const it of eight) K.trigger(it, it.owner);
    const F3 = run(60), s3 = stats(F3);
    const recs1 = K.BOBBER_STATS.records, recRate = Object.keys(recs1).reduce((a, k) => a + (recs1[k] - (recs0[k] || 0)), 0);
    R(`phase 1: the empty testbox, 8 bots still, ${N1} frames`, true, s1);
    R(`phase 2: ${n2} live bobbers (${chains.size} chains: ${[3, 4, 8].map((k) => `${sz.filter((x) => x === k).length}×${k}`).join(', ')}) — p95 ${s2.p95} ms vs ${s1.p95} (≤ +2), draw calls ${s2.calls} vs ${s1.calls} (≤ +20), the kit's tick p95 ${s2.kit95} ms (< 0.5)`,
      n2 >= 185 && s2.p95 <= s1.p95 + 2 && s2.calls - s1.calls <= 20 && s2.kit95 < 0.5, { s2, n2, counts: [...cnt.values()] });
    R(`phase 3: three 8-chains set off at once — the 60 frames after: p95 ${s3.p95} ms (≤ ${r2(s1.p95 + 4)}), its records ${recRate} (the wire)`, eight.length === 3 && s3.p95 <= s1.p95 + 4 && s3.kit95 < 1.5, { s3, eight: eight.length, records: recRate, blasts: K.BOBBER_STATS.blasts });
    // ---- 4. a live 4 v 4, without bobbers, then with 24 a bot kept topped up
    S.clear(); run(30);
    for (const a of A) { if (!a.alive) a.respawn(); a.setSub('bobber'); a.ink = PLAYER.inkMax; }
    live();
    const sight = () => SIGHT_STATS.deferred;
    run(120);
    let d0 = sight();
    const F4a = run(N4), s4a = stats(F4a), defA = (sight() - d0) / (N4 * DT);
    // (with): every 0.1 s each bot short of 24 gets up to three more round it, on the deck (they're shot and set off as fast)
    let topT = 0, discs = [];
    hook = () => {
      if ((topT -= DT) > 0) return; topT = 0.1;
      for (const a of A) {
        let n = K.items.filter((x) => x.owner === a && x.state !== 'dead').length;
        for (let k = 0; k < 3 && n < 24; k++, n++) {
          const ang = Math.random() * Math.PI * 2, d = 3 + Math.random() * 9, x = Math.max(-26, Math.min(26, a.pos.x + Math.cos(ang) * d)), z = Math.max(-38, Math.min(38, a.pos.z + Math.sin(ang) * d));
          K.throwFrom(a, V(x, 0.6, z), V(0, -3, 0));
        }
      }
    };
    // (filled up before the measured run)
    for (let i = 0; i < 8; i++) for (const a of A) { const ang = (i / 8) * Math.PI * 2; K.throwFrom(a, V(Math.max(-26, Math.min(26, a.pos.x + Math.cos(ang) * 5)), 0.6, Math.max(-38, Math.min(38, a.pos.z + Math.sin(ang) * 5))), V(0, -3, 0)); }
    run(240);
    d0 = sight();
    const liveB = [];
    const F4b = run(N4, (i) => { if (i % 30 === 0) { liveB.push(liveN()); discs.push(specialDangers().filter((x) => x.src === 'bobber').length); } }), s4b = stats(F4b), defB = (sight() - d0) / (N4 * DT);
    hook = null; still();
    const meanLive = Math.round(liveB.reduce((a, b) => a + b, 0) / Math.max(1, liveB.length));
    R(`phase 4: a live 4 v 4 (${N4} frames) — with ${meanLive} live bobbers on average (topped up to 24 a bot): p95 ${s4b.p95} ms vs ${s4a.p95} without (≤ +3), the bots' think p95 ${s4b.think95} vs ${s4a.think95} ms (≤ +1.0), sight deferrals ${r2(defB)} vs ${r2(defA)} a second (≤ 2×, or ≤ 1 a second)`,
      s4b.p95 <= s4a.p95 + 3 && s4b.think95 <= s4a.think95 + 1.0 && (defB <= Math.max(1, 2 * defA)), { without: s4a, with: s4b, defA: r2(defA), defB: r2(defB), live: liveB, discsMax: Math.max(0, ...discs), discsMean: r2(discs.reduce((a, b) => a + b, 0) / Math.max(1, discs.length)), stats: { triggers: K.BOBBER_STATS.triggers, disarmed: K.BOBBER_STATS.disarmed } });
    R(`phase 4: the bobber danger discs stay ≤ ${K.items.length ? 48 : 48} a frame (max ${Math.max(0, ...discs)})`, Math.max(0, ...discs) <= 48, discs);
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 900)); }
  hook = null;
  for (const a of A) if (a.bot && brain0.has(a)) a.bot.update = brain0.get(a);
  return out;
})();
