// (fix round 2 scratch) the GPU timer two ways at perf6's eight views (the gate's settings: DEFAULT_SETTINGS, fov 75, actors
// hidden, the sim frozen): A — gpu-views.js's method (gl.finish after every frame: the GPU idles between frames, so a light
// frame can be timed at a low clock); B — 24 frames back to back, each in its own timer query, one gl.finish at the end (the
// GPU kept busy, as in play); also B's wall time per frame (performance.now from the first frame until the last frame's query result is available: the GPU really done). Median per view,
// mean of the views. PRE_ARGS 'pre=plain' etc. as gpu-ab.js is not supported here: the stage as it is.
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  { const { DEFAULT_SETTINGS } = await import('./src/config.js'); Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); for (let i = 0; i < 30; i++) g.debug.step(1000 / 60); }
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  g.debug.freeze();
  const Rr = g.R, Rn = G.renderer, gl = Rn.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  // PRE_ARGS: 'nobloom' / 'nogtao' — that pass off for the whole run (the bloom-off anomaly: is it real GPU work?)
  const args = String(window.__preArgs || '');
  if (/nobloom/.test(args) && Rr.bloom) Rr.bloom.enabled = false;
  if (/nogtao/.test(args) && Rr.gtao) Rr.gtao.enabled = false;
  if (/plain/.test(args)) { const plain = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 }); G.scene.traverse((o) => { if (o.isMesh && /^level/.test(o.name || '')) o.material = plain; }); if (G.eraWorld) G.eraWorld._levelProgram = () => {}; }
  // 'live': the full level program at rest and no prepass (this round's static programs and prepass off); 'noprepass'
  const W = G.eraWorld;
  if (W && /live/.test(args)) { const f = W._levelProgram; W._levelProgram = () => f.call(W, 0); W._levelProgram(); }
  if (W && /noprepass/.test(args)) { const f = W._levelProgram; W._levelProgram = (e) => { f.call(W, e); for (const t of W._prepass?.twins || []) t.visible = false; }; }
  for (let i = 0; i < 4; i++) g.debug.step(1000 / 60);
  const L = G.level, lay = L.layout || {}, B = L.bounds, sp = lay.spawnPads || [[0, 2, B.minZ + 4], [0, 2, B.maxZ - 4]];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const views = [];
  for (const p of sp) { const dz = -Math.sign(p[2]); views.push([[p[0], p[1] + 1.7, p[2] - dz * 3], [0, 1, 0]]); views.push([[p[0], p[1] + 1.7, p[2]], [0, 1, 0]]); }
  for (const [x, z] of [[15, 0], [-15, 0], [0, 15], [0, -15]]) views.push([[x, 1.7, z], [0, 1.2, 0]]);
  g.settings.fov = 75;
  const rend0 = Rr.render.bind(Rr); let q = null;
  Rr.render = (...a) => { if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); } try { return rend0(...a); } finally { if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); } };
  const collect = async (qs) => {
    for (let k = 0; k < 80 && qs.some((qq) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 30));
    const ms = qs.filter((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)).map((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
    qs.forEach((qq) => gl.deleteQuery(qq));
    return ms[Math.floor(ms.length / 2)] || 0;
  };
  const A = [], A2 = [], Bq = [], Bw = [], Ci = [], Cd = [];
  for (const [f, l] of views) {
    g.rig.cinematic(V(f), V(f), V(l), V(l), 99, () => {});
    for (let i = 0; i < 20; i++) g.debug.step(1000 / 60);
    let qs = [];
    for (let i = 0; i < 24; i++) { q = null; g.debug.step(1000 / 60); gl.finish(); if (q) qs.push(q); }
    A.push(await collect(qs));
    qs = []; gl.finish();
    const t0 = performance.now();
    for (let i = 0; i < 24; i++) { q = null; g.debug.step(1000 / 60); if (q) qs.push(q); }
    gl.finish();
    // the wall time until the GPU has really finished the 24 (the last query's result available; polled every ms)
    const last = qs[qs.length - 1];
    for (let k = 0; k < 5000 && last && !gl.getQueryParameter(last, gl.QUERY_RESULT_AVAILABLE); k++) await new Promise((r) => setTimeout(r, 1));
    Bw.push((performance.now() - t0) / 24);
    Bq.push(await collect(qs));
    // A2 — the gate's method without the sim step: the render alone, timed, gl.finish after each (is A's excess the step's
    // side effects — uploads, buffers — or the isolation of each frame?)
    qs = [];
    for (let i = 0; i < 24; i++) { q = null; Rr.render(); gl.finish(); if (q) qs.push(q); }
    A2.push(await collect(qs));
    // C — GPU throughput: the game's render alone (no sim step), 30 times back to back, no timer queries; the CPU's issue
    // time per frame, and the time until a fence after the last frame signals (the GPU done), per frame. When 'done' is
    // well above 'issue' the GPU is the bottleneck and done / frame is its real time per frame
    Rr.render = rend0;
    gl.finish();
    const N = 30, c0 = performance.now();
    for (let i = 0; i < N; i++) Rr.render();
    const c1 = performance.now(), fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
    for (let k = 0; k < 20000; k++) { const st = gl.clientWaitSync(fence, 0, 0); if (st === gl.ALREADY_SIGNALED || st === gl.CONDITION_SATISFIED) break; await new Promise((r) => setTimeout(r, 0)); }
    const c2 = performance.now(); gl.deleteSync(fence);
    Ci.push((c1 - c0) / N); Cd.push((c2 - c0) / N);
    Rr.render = (...a) => { if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); } try { return rend0(...a); } finally { if (ext) gl.endQuery(ext.TIME_ELAPSED_EXT); } };
  }
  Rr.render = rend0;
  const mean = (a) => +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(2);
  return [{ name: 'gpu-sustained', ok: true, info: { map: g.mapDef?.id, era: G.eraWorld?.era ?? 0, time: G.env?.theme, args, A: mean(A), A2: mean(A2), B: mean(Bq), Bwall: mean(Bw), Cissue: mean(Ci), Cdone: mean(Cd), views: { A: A.map((x) => +x.toFixed(1)), B: Bq.map((x) => +x.toFixed(1)), Cdone: Cd.map((x) => +x.toFixed(1)) } } }];
})()
