// (art review 2, the reviewer's scratch probe) where Bluestone's view-independent GPU time goes: the GPU's own time per frame
// (timer query, median of 16 frames, mean of perf6's eight views; the default settings forced, fov 75, actors hidden, the
// sim frozen) as is, then with ONE thing off at a time: the sun's shadow map frozen (rendered once, not every frame), GTAO
// off, bloom off, the EraFx group hidden, every transparent mesh hidden, the level material's art + era chunks swapped for
// a plain MeshStandardMaterial on the level meshes (the same geometry), and everything hidden (the post stack and the
// clear alone); plus a scene summary (top-level children: meshes, vertices, transparent meshes, shadow-casting vertices)
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  { const { DEFAULT_SETTINGS } = await import('./src/config.js'); Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); for (let i = 0; i < 30; i++) g.debug.step(1000 / 60); }
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  g.debug.freeze();
  const R = g.R, Rn = G.renderer, gl = Rn.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const L = G.level, lay = L.layout || {}, B = L.bounds, sp = lay.spawnPads || [[0, 2, B.minZ + 4], [0, 2, B.maxZ - 4]];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const views = [];
  for (const p of sp) { const dz = -Math.sign(p[2]); views.push([[p[0], p[1] + 1.7, p[2] - dz * 3], [0, 1, 0]]); views.push([[p[0], p[1] + 1.7, p[2]], [0, 1, 0]]); }
  for (const [x, z] of [[15, 0], [-15, 0], [0, 15], [0, -15]]) views.push([[x, 1.7, z], [0, 1.2, 0]]);
  g.settings.fov = 75;
  const rend0 = R.render.bind(R); let q = null;
  R.render = (...a) => { if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); } try { return rend0(...a); } finally { if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); } };
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
  const sc = G.scene, res = {}, SET = window.__preArgs || 'A';   // (two sets per run: shoot.cjs's own 90 s watchdog)
  const hideAll = (arr) => { const v = arr.map((o) => o.visible); arr.forEach((o) => { o.visible = false; }); return () => arr.forEach((o, i) => { o.visible = v[i]; }); };
  res.base = await measure();
  // the sun's shadow map rendered once and held (no per-frame shadow pass)
  if (SET === 'A') {
  Rn.shadowMap.autoUpdate = false; Rn.shadowMap.needsUpdate = true; g.debug.step(1000 / 60);
  res.shadowHeld = await measure(); Rn.shadowMap.autoUpdate = true;
  if (R.gtao) { R.gtao.enabled = false; res.noGtao = await measure(); R.gtao.enabled = true; }
  if (R.bloom) { const b = R.bloom.enabled; R.bloom.enabled = false; res.noBloom = await measure(); R.bloom.enabled = b; }
  } else {
  const fx = sc.getObjectByName('EraFx'); if (fx) { const un = hideAll([fx]); res.noEraFx = await measure(); un(); }
  { const tr = []; sc.traverse((o) => { if (o.isMesh && o.visible && (Array.isArray(o.material) ? o.material.some((m) => m.transparent) : o.material?.transparent)) tr.push(o); }); const un = hideAll(tr); res.noTransparent = await measure(); res.nTransparent = tr.length; un(); }
  { const lv = []; sc.traverse((o) => { if (o.isMesh && /^level/.test(o.name || '')) lv.push(o); }); const plain = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 }); const mats = lv.map((m) => m.material); lv.forEach((m) => { m.material = plain; }); res.levelPlainMat = await measure(); lv.forEach((m, i) => { m.material = mats[i]; }); res.nLevelMeshes = lv.length; }
  { const un = hideAll([...sc.children]); res.emptyScene = await measure(); un(); }
  }
  res.base2 = await measure();
  R.render = rend0;
  // the scene summary
  const sum = [];
  for (const c of sc.children) { let meshes = 0, verts = 0, tr = 0, shv = 0; c.traverse((o) => { if (!o.isMesh && !o.isPoints && !o.isLine) return; meshes++; const n = (o.geometry?.attributes?.position?.count || 0) * (o.isInstancedMesh ? o.count : 1); verts += n; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m?.transparent) tr++; if (o.castShadow) shv += n; });
    sum.push([c.name || c.type, c.visible ? 1 : 0, meshes, verts, tr, shv]); }
  const sun = []; sc.traverse((o) => { if (o.isLight && o.castShadow) sun.push([o.type, o.shadow?.mapSize?.x, o.shadow?.camera?.right - o.shadow?.camera?.left]); });
  return { set: SET, map: g.mapDef?.id, ext: !!ext, quality: g.settings.quality, gtao: !!R.gtao, res, lights: sun, scene: sum.sort((a, b) => b[3] - a[3]).slice(0, 14), mem: Rn.info.memory, programs: Rn.info.programs?.length };
})()
