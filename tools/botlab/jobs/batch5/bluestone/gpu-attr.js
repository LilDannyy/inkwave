// (fix round 1 scratch) where Bluestone's GPU time goes: the GPU's own time per frame (timer query, median of 16 frames)
// at perf6's eight views, the default settings, with parts of the scene hidden in turn: as is; no level meshes (the
// main level mesh and the era meshes); no props; no backdrop sets (the stage's far city); no water/sky (env root)
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
  const measure = async () => {
    const per = [];
    for (const [f, l] of views) {
      g.rig.cinematic(V(f), V(f), V(l), V(l), 99, () => {});
      for (let i = 0; i < 8; i++) g.debug.step(1000 / 60);
      const qs = [];
      for (let i = 0; i < 16; i++) { q = null; g.debug.step(1000 / 60); gl.finish(); if (q) qs.push(q); }
      for (let k = 0; k < 60 && qs.some((qq) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 30));
      const ms = qs.filter((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)).map((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
      qs.forEach((qq) => gl.deleteQuery(qq));
      per.push(ms[Math.floor(ms.length / 2)] || 0);
    }
    return +(per.reduce((a, b) => a + b, 0) / per.length).toFixed(2);
  };
  const W = G.eraWorld, env = G.env, sc = G.scene;
  const levelMeshes = []; sc.traverse((o) => { if (o.isMesh && /^level/.test(o.name || '')) levelMeshes.push(o); });
  const propsG = []; sc.traverse((o) => { if (o.name === 'props') propsG.push(o); });
  const sets = Object.values(env?.stageSets || {});
  const hide = (arr, f) => { const v = arr.map((o) => o.visible); arr.forEach((o) => { o.visible = false; }); return async () => { const r = await f(); arr.forEach((o, i) => { o.visible = v[i]; }); return r; }; };
  const res = {};
  res.base = await measure();
  res.noLevel = await (hide(levelMeshes, measure))();
  res.noProps = await (hide(propsG, measure))();
  res.noBackdrop = await (hide(sets, measure))();
  res.noEnvRoot = env?.root ? await (hide([env.root], measure))() : null;
  res.base2 = await measure();
  Rr.render = rend0;
  return { map: g.mapDef?.id, levelMeshes: levelMeshes.length, levelNames: [...new Set(levelMeshes.map((m) => m.name))].slice(0, 8), props: propsG.length, sets: sets.length, res };
})()
