// (fix round 1 scratch) GPU time per frame at perf6's eight fixed views (behind / at each spawn pad looking at mid, four
// eye-level views of mid from 15 m), the game's default settings forced: median of 24 frames each, timed with
// EXT_disjoint_timer_query_webgl2 round the game's render (the GPU's own time); also calls / triangles / cpu render ms
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  { const { DEFAULT_SETTINGS } = await import('./src/config.js'); Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); for (let i = 0; i < 30; i++) g.debug.step(1000 / 60); }
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  g.debug.freeze();
  const Rn = G.renderer, gl = Rn.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const L = G.level, lay = L.layout || {}, B = L.bounds, sp = lay.spawnPads || [[0, 2, B.minZ + 4], [0, 2, B.maxZ - 4]];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const views = [];
  for (const p of sp) { const dz = -Math.sign(p[2]); views.push([[p[0], p[1] + 1.7, p[2] - dz * 3], [0, 1, 0]]); views.push([[p[0], p[1] + 1.7, p[2]], [0, 1, 0]]); }
  for (const [x, z] of [[15, 0], [-15, 0], [0, 15], [0, -15]]) views.push([[x, 1.7, z], [0, 1.2, 0]]);
  g.settings.fov = 75;
  const Rr = g.R, rend0 = Rr.render.bind(Rr); let q = null;
  Rr.render = (...a) => { if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); } try { return rend0(...a); } finally { if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); } };
  const out = [];
  for (const [f, l] of views) {
    g.rig.cinematic(V(f), V(f), V(l), V(l), 99, () => {});
    for (let i = 0; i < 20; i++) g.debug.step(1000 / 60);
    const qs = [];
    for (let i = 0; i < 24; i++) { q = null; g.debug.step(1000 / 60); gl.finish(); if (q) qs.push(q); }
    for (let k = 0; k < 60 && qs.some((qq) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 30));
    const ms = qs.filter((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)).map((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
    qs.forEach((qq) => gl.deleteQuery(qq));
    const info = Rn.info.render;
    out.push({ gpu: +(ms[Math.floor(ms.length / 2)] || 0).toFixed(2), calls: info.calls, tris: info.triangles });
  }
  Rr.render = rend0;
  const avg = (k) => +(out.reduce((a, o) => a + o[k], 0) / out.length).toFixed(2);
  return { map: g.mapDef?.id, ext: !!ext, quality: g.settings.quality, views: out.map((o) => o.gpu), avg: { gpu: avg('gpu'), calls: avg('calls'), tris: Math.round(avg('tris')) } };
})()
