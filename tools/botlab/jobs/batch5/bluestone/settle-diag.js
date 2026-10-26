// fix round 3: what the settle (done + 0.7, the 'env' event) does in a real side jump — per frame: GL compileShader /
// linkProgram calls, renderer.info.programs, textures and geometries, PMREM passes, cloud bakes, render ms (as the frames test)
(async () => {
  const g = window.__inkwave, out = [], dbg = g.debug, E = g.match.eras, W = __G.eraWorld, env = __G.env, Rn = __G.renderer, gl = Rn.getContext();
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const cnt = { comp: 0, link: 0, pmrem: 0, bake: 0, texImg: 0 };
  const wrap = (o, k, c) => { const f = o[k].bind(o); o[k] = (...a) => { cnt[c]++; return f(...a); }; };
  wrap(gl, 'compileShader', 'comp'); wrap(gl, 'linkProgram', 'link'); wrap(gl, 'texImage2D', 'texImg');
  wrap(env._pmrem, 'fromScene', 'pmrem'); wrap(env, '_bakeClouds', 'bake');
  const Rr = g.R, rend0 = Rr.render.bind(Rr); let fr = 0;
  Rr.render = (...a) => { const t0 = performance.now(); try { return rend0(...a); } finally { fr = performance.now() - t0; } };
  const run = async (label, to, off) => {
    const em = W._envCache; if (off) W._envCache = new Map();
    step(1); await new Promise((r) => setTimeout(r, 1500));
    const J = E.debugJump(to, { inS: 0 }), rows = []; let fired = '';
    const ef = E._envFinal.bind(E); E._envFinal = (j) => { fired = 'env'; return ef(j); };
    while (E.S.clock.t < J.doneAt + 1.0) {
      const c0 = { ...cnt }, p0 = Rn.info.programs.length, tx0 = Rn.info.memory.textures, g0 = Rn.info.memory.geometries, t0 = performance.now();
      dbg.step(1000 / 60);
      const ms = performance.now() - t0, d = {}; for (const k in cnt) if (cnt[k] - c0[k]) d[k] = cnt[k] - c0[k];
      rows.push({ t: +(E.S.clock.t - J.at).toFixed(2), ms: +ms.toFixed(1), render: +fr.toFixed(1), prog: Rn.info.programs.length - p0, tex: Rn.info.memory.textures - tx0, geo: Rn.info.memory.geometries - g0, ...d, ev: fired });
      fired = '';
    }
    E._envFinal = ef; if (off) W._envCache = em;
    const envRow = rows.findIndex((r) => r.ev === 'env');
    const win = rows.slice(Math.max(0, envRow - 3), envRow + 15);
    const any = rows.filter((r) => r.prog || r.tex || r.geo || r.comp || r.link || r.pmrem || r.bake || r.texImg);
    out.push({ name: label, ok: true, info: { jump: `${J.from}>${J.to}`, worst: [...rows].sort((a, b) => b.ms - a.ms).slice(0, 3), changes: any, aroundEnv: win.map((r) => `${r.t} ${r.ms}/${r.render}${r.ev ? ' ENV' : ''}`).join(' | '), envMiss: W.stats.envMiss || 0, envCache: W._envCache?.size, cloudCache: W._cloudCache?.size } });
  };
  E.debugJump(2, { instant: true }); step(0.3);
  await run('bravo-like 2>3 day, env maps by reference', 3, false);
  E.debugJump(2, { instant: true }); step(0.3);
  await run('bravo-like 2>3 day, PMREM rebuild (the JOB-30 code)', 3, true);
  env.setTheme('sunset'); g.theme = 'sunset'; step(0.1);
  await run('theme 3>1 sunset, env maps by reference', 1, false);
  E.debugJump(3, { instant: true }); step(0.3);
  await run('theme 3>1 sunset, PMREM rebuild', 1, true);
  Rr.render = rend0;
  return out;
})()
