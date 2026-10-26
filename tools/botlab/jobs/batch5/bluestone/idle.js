// (fix round 2 scratch) // does an idle GPU gap before each timed frame inflate the timer? the render alone, gl.finish after each, a CPU busy-wait of
// X ms before each render (as the sim step's CPU time would leave the GPU idle); median of 24 frames at one view
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  { const { DEFAULT_SETTINGS } = await import('./src/config.js'); Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); for (let i = 0; i < 30; i++) g.debug.step(1000 / 60); }
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  g.debug.freeze();
  const R = g.R, gl = G.renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const sp = G.level.layout.spawnPads || [[0, 2, -60]]; const p = sp[0];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  g.rig.cinematic(V([p[0], p[1] + 1.7, p[2]]), V([p[0], p[1] + 1.7, p[2]]), V([0, 1, 0]), V([0, 1, 0]), 99, () => {});
  for (let i = 0; i < 20; i++) g.debug.step(1000 / 60);
  const busy = (ms) => { const t = performance.now(); while (performance.now() - t < ms) { /* spin */ } };
  const out = {};
  for (const X of [0, 4, 8, 16, 0]) {
    const qs = [];
    for (let i = 0; i < 24; i++) { busy(X); const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); R.render(); gl.endQuery(ext.TIME_ELAPSED_EXT); gl.finish(); qs.push(q); }
    for (let k = 0; k < 80 && qs.some((qq) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 30));
    const ms = qs.map((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
    qs.forEach((qq) => gl.deleteQuery(qq));
    out['idle' + X + (out['idle' + X] ? 'b' : '')] = +ms[12].toFixed(2);
  }
  return { map: g.mapDef?.id, out };
})()
