// Scratch probe (final review 2, issue 4): whose are the render spikes of a jump — the curtain, the holograms, the env
// map's PMREM rebuild at done + 0.7, or the machine? Every rendered frame of a jump is timed on the GPU itself
// (EXT_disjoint_timer_query_webgl2 round the game's render: the GPU's own time for that frame's commands) and on the wall
// clock with gl.finish() after it (CPU + GPU, synchronous), split [J + s, wall ms, GPU ms, era update ms, phase]. Runs:
//   base     240 frames with no jump
//   pmrem    env._rebuildEnvMap() alone, 5 times (GPU and finished wall time)
//   jump1    the real jump 1 (1 → 2), J − 0.5 … done + 1.5
//   theme    the kept world's 3 → 1 at sunset (the review's 82 / 130 ms case): as is, with the curtain hidden, with the
//            holograms hidden, with the env rebuild skipped
//   MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/probe-gpu.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const dbg = g.debug;
  dbg.freeze();
  const calm = () => { for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } } };
  calm();
  const W = __G.eraWorld, E = g.match.eras, Rn = __G.renderer, gl = Rn.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));
  for (let i = 0; i < 80 && !(W.stats.precompiled >= 1); i++) await new Promise((r) => setTimeout(r, 100));
  const pend = [];
  const Rr = g.R, rend0 = Rr.render.bind(Rr), upd0 = E.update.bind(E);
  let um = 0, q = null;
  Rr.render = (...a) => {
    if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    try { return rend0(...a); } finally { if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); }
  };
  E.update = (dt, t) => { const u0 = performance.now(); try { return upd0(dt, t); } finally { um = performance.now() - u0; } };
  // one frame: [J + s, wall ms (with finish), GPU ms (filled later), era update ms, phase]
  const frame = (J) => { q = null; const t0 = performance.now(); dbg.step(1000 / 60); gl.finish(); const ms = performance.now() - t0; const row = [J ? +(E.S.clock.t - J.at).toFixed(2) : null, +ms.toFixed(1), null, +um.toFixed(2), E.phase]; if (q) pend.push([q, row]); return row; };
  const resolve = async () => {
    for (let k = 0; k < 60 && pend.some(([qq]) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 50));
    const dis = ext ? gl.getParameter(ext.GPU_DISJOINT_EXT) : null;
    for (const [qq, row] of pend.splice(0)) { if (gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)) row[2] = +(gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).toFixed(2); gl.deleteQuery(qq); }
    return dis;
  };
  const sum = (rows, J) => {
    const w = rows.map((r) => r[1]).sort((a, b) => a - b), gp = rows.map((r) => r[2]).filter((v) => v !== null).sort((a, b) => a - b);
    return { frames: rows.length, wallMedian: w[w.length >> 1], wallMax: w[w.length - 1], gpuMedian: gp.length ? gp[gp.length >> 1] : null, gpuMax: gp.length ? gp[gp.length - 1] : null,
      worstWall: [...rows].sort((a, b) => b[1] - a[1]).slice(0, 5), worstGpu: [...rows].filter((r) => r[2] !== null).sort((a, b) => b[2] - a[2]).slice(0, 5), eraUpdateMax: Math.max(...rows.map((r) => r[3])) };
  };
  // (issue 7, for the balance pass: how often bots' paint-goal sampler — 28 random draws from nav.validIds, ≤ 38 m away —
  //  even sees a node fresh in the new era, the nodes the ×2 weight applies to)
  { const nav = __G.nav, rows = [];
    for (const [f, t] of [[1, 2], [2, 3]]) { const J = E._info({ from: f, to: t, at: 0 }), ids = nav.eraValidIds[t - 1], fr = ids.filter((i) => J.fresh[i]);
      const p1 = fr.length / ids.length; rows.push({ jump: `${f}>${t}`, validIds: ids.length, fresh: fr.length, share: +(p1 * 100).toFixed(2), pDrawAtLeastOneOf28: +((1 - (1 - p1) ** 28) * 100).toFixed(1) }); }
    R('issue 7: fresh nodes per jump against the sampler (28 draws from validIds)', true, rows); }
  R('the GPU timer extension', true, { ext: !!ext, renderer: gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION), size: [gl.drawingBufferWidth, gl.drawingBufferHeight], quality: g.settings?.quality });
  // base
  E.debugJump(1, { instant: true }); step(0.5);
  const base = []; for (let i = 0; i < 240; i++) base.push(frame(null));
  const bd = await resolve();
  R('base: 240 frames, no jump', true, { disjoint: bd, ...sum(base) });
  // pmrem alone
  const env = __G.env, pm = [];
  for (let i = 0; i < 5; i++) {
    gl.finish();
    let qq = null; if (ext) { qq = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, qq); }
    const t0 = performance.now(); env._rebuildEnvMap(); if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); gl.finish(); const ms = performance.now() - t0;
    const row = [i, +ms.toFixed(1), null, 0, 'pmrem']; if (qq) pend.push([qq, row]); pm.push(row);
    const nx = frame(null); nx[4] = 'after'; pm.push(nx);
  }
  const pd = await resolve();
  R('pmrem: env._rebuildEnvMap() alone (size 256, GGX 256 samples), then the next frame', true, { disjoint: pd, rows: pm });
  // jump 1
  const run = (to, label, opt = {}) => {
    const fx = W.fx, rows = [];
    const fxu = fx.update.bind(fx), envF = E._envFinal.bind(E);
    if (opt.noCurtain || opt.noHolo) fx.update = (dt, st) => { fxu(dt, st); if (opt.noCurtain && fx.curtain) fx.curtain.visible = false; if (opt.noHolo && fx.holo) for (const m of fx.holo) m.visible = false; };
    if (opt.noEnv) E._envFinal = (J) => { const r = env._rebuildEnvMap; env._rebuildEnvMap = () => {}; try { envF(J); } finally { env._rebuildEnvMap = r; } };
    const J = E.debugJump(to, { inS: 0.6 });
    step(0.1);
    while (E.S.clock.t < J.doneAt + 1.5) rows.push(frame(J));
    fx.update = fxu; E._envFinal = envF;
    return { label, jump: `${J.from}>${J.to}`, doneAt: +(J.doneAt - J.at).toFixed(2), rows };
  };
  const j1 = run(2, 'jump1');
  const d1 = await resolve();
  R('jump1: 1 → 2, J − 0.5 … done + 1.5 [J + s, wall ms (finished), GPU ms, era update ms, phase]', true, { disjoint: d1, doneAt: j1.doneAt, ...sum(j1.rows), envWindow: j1.rows.filter((r) => r[0] > j1.doneAt + 0.6 && r[0] < j1.doneAt + 0.9) });
  // the theme runs: era 3 at sunset, then 3 → 1 four ways
  const th0 = g.theme;
  g.theme = th0 === 'sunset' ? 'golden' : 'sunset'; __G.env.setTheme?.(g.theme); step(0.3);
  const rows = [];
  for (const [label, opt] of [['theme', {}], ['theme-noCurtain', { noCurtain: true }], ['theme-noHolo', { noHolo: true }], ['theme-noEnv', { noEnv: true }]]) {
    E.debugJump(3, { instant: true }); step(0.5);
    const r = run(1, label, opt);
    const dd = await resolve();
    const s = sum(r.rows);
    rows.push({ label, theme: g.theme, disjoint: dd, ...s, envWindow: r.rows.filter((x) => x[0] > r.doneAt + 0.6 && x[0] < r.doneAt + 0.9), spikeWindow: r.rows.filter((x) => x[0] > 1.0 && x[0] < 1.6) });
  }
  g.theme = th0; __G.env.setTheme?.(th0); step(0.1);
  for (const r of rows) R(`${r.label}: 3 → 1 at ${r.theme} [J + s, wall ms (finished), GPU ms, era update ms, phase]`, true, r);
  Rr.render = rend0; E.update = upd0;
  return out;
})();
