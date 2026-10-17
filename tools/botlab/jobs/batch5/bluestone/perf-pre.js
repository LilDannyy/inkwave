// Bluestone eras (scratch): shoot.cjs's PRE for the performance REPORT (ENGINE §4.8, §6 step 13). With PRE_ARGS
// 'jump12' / 'jump23' it puts the world in the era before and runs that jump to J + 1.5 s (each stepped frame rendered,
// so g.perf's calls / triangles are the jump's and its cpuRender average is over the jump's frames); without, the world as
// the page built it (PAGEQ='era=n' holds era n). Returns the union's paint density and lightmap rows and the era stats.
(() => {
  const g = window.__inkwave, E = g.match.eras, W = __G.eraWorld, L = __G.level, P = __G.paint, a = String(window.__preArgs || '');
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  g.debug.freeze();
  // (on high, as the Halyard budget is measured: shadows, GTAO; the spawn camera the match started with)
  if (g.settings.quality !== 'high') { g.settings.quality = 'high'; g.R.applySettings(g.settings); }
  step(0.6);
  let jump = null;
  if (!E) { const p = g.perf; g.debug.unfreeze(); return { stage: L.layout?.id, perf: p ? { calls: p.calls, tris: p.tris, cpuRenderMs: +p.render.toFixed(2), cpuSimMs: +p.sim.toFixed(2) } : null, ppm: +P.ppm.toFixed(2), atlas: P.size, quality: g.settings.quality }; }
  if (a === 'jump12' || a === 'jump23') {
    const [f, t] = a === 'jump12' ? [1, 2] : [2, 3];
    E.debugJump(f, { instant: true }); step(0.5);
    const J = E.debugJump(t, { inS: 0 });
    const t0 = performance.now(); step(1.5); jump = { from: f, to: t, front: +E.front.toFixed(1), wallMs: Math.round(performance.now() - t0), phase: E.phase };
  } else step(0.5);
  // the union lightmap's rows (rule 9) on a copy of the face layout (the level's own layout kept)
  const had = L.faces.map((f) => f.light), hs = L.lightSize, hu = L.lightUsed, hh = L.layoutHash;
  const fits = L.layoutLightmap(8, 2048), rows = L.lightUsed;
  L.faces.forEach((f, i) => { f.light = had[i]; }); L.lightSize = hs; L.lightUsed = hu; L.layoutHash = hh;
  const out = { stage: L.layout?.id, quality: g.settings.quality, era: E.era, phase: E.phase, jump, ppm: +P.ppm.toFixed(2), atlas: P.size, lightRows: rows, lightFits: fits, lightmapApplied: !!g.levelMat?.userData?.uniforms?.uLight?.value,
    perf: g.perf ? { calls: g.perf.calls, tris: g.perf.tris, cpuRenderMs: +g.perf.render.toFixed(2), cpuSimMs: +g.perf.sim.toFixed(2) } : null,
    stats: { navMs: W.stats.navMs, navBuilds: W.stats.navBuilds, mergeMs: W.stats.mergeMs, paintMs: W.stats.paintMs, meshMs: W.stats.meshMs, compileMs: W.stats.compileMs, compiled: W.stats.compiled, bases: W.stats.baseBuilds.map((x) => `${x.e}:${x.why} ${x.ms}`) } };
  g.debug.unfreeze();
  return out;
})()
