// (review 6 scratch) PRE: draw calls / triangles / cpu render ms at the same eight views on any stage: behind each spawn pad
// at eye height looking at mid, from each pad's front looking at mid, and four eye-level views of mid from 15 m (N, S, E, W)
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  for (const a of g.match.actors) a.bot = null; G.projectiles.clear();
  const L = G.level, lay = L.layout || {}, B = L.bounds, sp = lay.spawnPads || [[0, 2, B.minZ + 4], [0, 2, B.maxZ - 4]];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const views = [];
  for (const p of sp) { const dz = -Math.sign(p[2]); views.push([[p[0], p[1] + 1.7, p[2] - dz * 3], [0, 1, 0]]); views.push([[p[0], p[1] + 1.7, p[2]], [0, 1, 0]]); }
  for (const [x, z] of [[15, 0], [-15, 0], [0, 15], [0, -15]]) views.push([[x, 1.7, z], [0, 1.2, 0]]);
  const out = []; g.settings.fov = 75;
  for (const [f, l] of views) {
    g.rig.cinematic(V(f), V(f), V(l), V(l), 99, () => {});
    for (let i = 0; i < 40; i++) g.debug.step(1000 / 60);
    const info = G.renderer.info.render;
    out.push({ calls: info.calls, tris: info.triangles, ms: +g.perf.render.toFixed(2) });
  }
  const avg = (k) => +(out.reduce((a, o) => a + o[k], 0) / out.length).toFixed(k === 'ms' ? 2 : 0);
  return { map: g.mapDef?.id, quality: g.settings.quality, shadows: g.settings.shadows, fov0: window.__fov0, pr: G.renderer.getPixelRatio(), views: out, avg: { calls: avg('calls'), tris: avg('tris'), ms: avg('ms') } };
})()
