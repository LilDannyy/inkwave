// (fix round 2 scratch) GPU time A/B in ONE page: the game's default settings forced, fov 75, actors hidden, the sim frozen;
// the GPU's own time per frame (EXT_disjoint_timer_query_webgl2 round the game's render, gl.finish after each), median of
// N frames per view, mean of perf6's eight views (gpu-views.js's measure, shorter). PRE_ARGS = 'v1,v2,…[;rounds=2]': the
// base, then each variant switched on alone and off again, in rounds (base v1 v2 … base v1 v2 …), so each variant is
// compared with the base measured beside it on the same page. Variants (runtime switches, nothing in the source changes):
//   plain      the level meshes' material → a plain MeshStandardMaterial (the reviewer's bound)
//   prepass    a depth-only prepass of the level meshes drawn first (colour off, era collapse kept, pushed back a hair)
//   noart      the level art's branch compiled out (if (false))      noera   the era chunks' per-fragment work compiled out
//   nolamps    the lamp loops off (uLampN = 0, uBsLampN = 0)        nosea / nosky / noback / noprops / nodecor: hidden
//   shadowheld the sun's shadow map rendered once and held           nogtao / nobloom: those passes off
//   nolevel    the level meshes hidden                                 empty: every scene child hidden
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  { const { DEFAULT_SETTINGS } = await import('./src/config.js'); Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); for (let i = 0; i < 30; i++) g.debug.step(1000 / 60); }
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  g.debug.freeze();
  const R = g.R, Rn = G.renderer, gl = Rn.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const A = String(window.__preArgs || ''), [vl, ...opt] = A.split(';'), O = Object.fromEntries(opt.map((s) => s.split('=')));
  const VARS = vl.split(',').map((s) => s.trim()).filter(Boolean), ROUNDS = +(O.rounds || 2), NF = +(O.frames || 12), WARM = +(O.warm || 6);
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
      for (let i = 0; i < WARM; i++) g.debug.step(1000 / 60);
      const qs = [];
      for (let i = 0; i < NF; i++) { q = null; g.debug.step(1000 / 60); gl.finish(); if (q) qs.push(q); }
      for (let k = 0; k < 60 && qs.some((qq) => !gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)); k++) await new Promise((r) => setTimeout(r, 30));
      const ms = qs.filter((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)).map((qq) => gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
      qs.forEach((qq) => gl.deleteQuery(qq));
      per.push(ms[Math.floor(ms.length / 2)] || 0);
    }
    return { mean: +(per.reduce((a, b) => a + b, 0) / per.length).toFixed(2), views: per.map((x) => +x.toFixed(1)) };
  };
  const sc = G.scene, env = G.env;
  const hideAll = (arr) => { const v = arr.map((o) => o.visible); arr.forEach((o) => { o.visible = false; }); return () => arr.forEach((o, i) => { o.visible = v[i]; }); };
  const levelMeshes = () => { const lv = []; sc.traverse((o) => { if (o.isMesh && /^level/.test(o.name || '')) lv.push(o); }); return lv; };
  const lmats = () => [...new Set([g.levelMat, g.grateMat].filter(Boolean))];
  const notes = {};
  const patch = (fn, tag) => {
    const ms = lmats(), saved = ms.map((m) => [m.onBeforeCompile, m.customProgramCacheKey]);
    ms.forEach((m, i) => { const [ob, ck] = saved[i]; m.onBeforeCompile = (sh, r) => { ob.call(m, sh, r); const nf = fn(sh.fragmentShader); notes['hit:' + tag] = (notes['hit:' + tag] || 0) + (nf !== sh.fragmentShader ? 1 : 0); sh.fragmentShader = nf; }; m.customProgramCacheKey = () => ck.call(m) + '|ab-' + tag; m.needsUpdate = true; });
    return () => ms.forEach((m, i) => { m.onBeforeCompile = saved[i][0]; m.customProgramCacheKey = saved[i][1]; m.needsUpdate = true; });
  };
  const rep = (s, a, b) => { const n = s.split(a).length - 1; return n ? s.split(a).join(b) : s; };
  const V2 = {
    plain: () => { const lv = levelMeshes(), plain = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 }), mats = lv.map((m) => m.material); lv.forEach((m) => { m.material = plain; }); return () => lv.forEach((m, i) => { m.material = mats[i]; }); },
    nolevel: () => hideAll(levelMeshes().filter((m) => m.visible)),
    empty: () => hideAll([...sc.children]),
    nosea: () => hideAll([env.sea].filter(Boolean)),
    nosky: () => hideAll([env.sky].filter(Boolean)),
    noback: () => hideAll([...Object.values(env.stageSets || {}), env.city, env.terrain, env.staticScenery].filter(Boolean)),
    noprops: () => hideAll(sc.children.filter((o) => o.name === 'props')),
    nodecor: () => hideAll(sc.children.filter((o) => o.name === 'decor')),
    noerafx: () => hideAll([sc.getObjectByName('EraFx')].filter(Boolean)),
    shadowheld: () => { Rn.shadowMap.autoUpdate = false; Rn.shadowMap.needsUpdate = true; return () => { Rn.shadowMap.autoUpdate = true; }; },
    nogtao: () => { if (!R.gtao) return () => {}; R.gtao.enabled = false; return () => { R.gtao.enabled = true; }; },
    nobloom: () => { if (!R.bloom) return () => {}; const b = R.bloom.enabled; R.bloom.enabled = false; return () => { R.bloom.enabled = b; }; },
    nolamps: () => { const us = lmats().map((m) => m.userData.uniforms).filter(Boolean), sv = us.map((u) => [u.uLampN?.value, u.uBsLampN?.value]); us.forEach((u) => { if (u.uLampN) u.uLampN.value = 0; if (u.uBsLampN) u.uBsLampN.value = 0; }); return () => us.forEach((u, i) => { if (u.uLampN) u.uLampN.value = sv[i][0]; if (u.uBsLampN) u.uBsLampN.value = sv[i][1]; }); },
    noart: () => patch((f) => rep(f, 'if (vBsArt.x > 0.5) {', 'if (false) {'), 'noart'),
    noera: () => patch((f) => rep(rep(rep(f, 'for (int r = 0; r < 4; r++) {', 'for (int r = 0; r < 0; r++) {'), 'if (vEra.x < 6.5 && eraHasF(vEra.x, eb) < 0.5) discard;', ''), 'if (uEra.z >= 0.0) {\n  // the clock-light front', 'if (false) {\n  // the clock-light front'), 'noera'),
    // (fix round 2) the full program at rest instead of the static one (and no prepass) / the static one without the prepass
    live: () => { const W = G.eraWorld, f = W._levelProgram; W._levelProgram = () => f.call(W, 0); W._levelProgram(); return () => { W._levelProgram = f; }; },
    noprepass: () => { const W = G.eraWorld, f = W._levelProgram; W._levelProgram = (e) => { f.call(W, e); for (const t of W._prepass?.twins || []) t.visible = false; }; return () => { W._levelProgram = f; }; },
    prepass: () => {
      const lv = levelMeshes().filter((m) => m.visible && !/grate/.test(m.name)), add = [];
      for (const m of lv) {
        let pm;
        if (m.customDepthMaterial) { const d = m.customDepthMaterial; pm = new THREE.MeshDepthMaterial({ depthPacking: d.depthPacking }); pm.onBeforeCompile = d.onBeforeCompile; pm.customProgramCacheKey = d.customProgramCacheKey; }
        else pm = new THREE.MeshBasicMaterial();
        pm.colorWrite = false; pm.polygonOffset = true; pm.polygonOffsetFactor = 1; pm.polygonOffsetUnits = 2;
        const pmesh = new THREE.Mesh(m.geometry, pm);
        pmesh.renderOrder = -100; pmesh.castShadow = false; pmesh.receiveShadow = false; pmesh.frustumCulled = m.frustumCulled;
        pmesh.matrixAutoUpdate = false; pmesh.matrix.copy(m.matrixWorld); pmesh.matrixWorld.copy(m.matrixWorld);
        pmesh.onBeforeRender = (r, s, c, geo) => { /* (out of override passes: GTAO) */ };
        pmesh.name = 'prepass:' + m.name;
        sc.add(pmesh); add.push(pmesh);
      }
      notes.prepass = add.length;
      return () => { for (const p of add) { sc.remove(p); p.material.dispose(); } };
    },
  };
  // patterned variants: skip:N (the art's style N falls back to the bare surface), hexoff (texlib's hex anti-tiling off:
  // one tap), nofine (the generic 'modelled detail' block off), nomural, nowake
  const pat = (v) => {
    let m;
    if ((m = /^skip:(\d+)$/.exec(v))) return () => patch((f) => rep(f, 'if (vBsArt.x > 0.5) {', `if (vBsArt.x > 0.5 && abs(vBsArt.x - ${m[1]}.0) > 0.5) {`), v);
    if (v === 'artrt') return () => patch((f) => rep(f, 'if (vBsArt.x > 0.5) {', 'if (vBsArt.x > 0.5 && uBsNight > 99.0) {'), v);
    if (v === 'roomsoff') return () => patch((f) => rep(f, '  if (m < 0.002) return vec3(0.0);', '  return vec3(0.0);'), v);
    if (v === 'copefix') return () => patch((f) => rep(f, '      vec3 stone = vec3(0.9, 0.885, 0.845) * (0.95 + 0.07 * vnoise(fu * 9.0) + 0.03 * vnoise(fu * 41.0));\n      base = mix(base, stone * texlibMacro(wp + vWPos.y * 0.7), cop);', '      if (cop > 0.0) { vec3 stone = vec3(0.9, 0.885, 0.845) * (0.95 + 0.07 * vnoise(fu * 9.0) + 0.03 * vnoise(fu * 41.0));\n      base = mix(base, stone * texlibMacro(wp + vWPos.y * 0.7), cop); }'), v);
    if (v === 'combo') return () => patch((f) => rep(rep(rep(rep(f, 'if (vBsArt.x > 0.5) {', 'if (false) {'), '  // ---- modelled detail (shader-only, no layout change) ----\n  {', '  if (false) {'), 'if (mode == TEXLIB_HEX) {', 'if (false) {'), 'for (int r = 0; r < 4; r++) {', 'for (int r = 0; r < 0; r++) {'), v);
    if ((m = /^lod(\d+)$/.exec(v))) return () => patch((f) => rep(f, 'if (vBsArt.x > 0.5) {', `if (vBsArt.x > 0.5 && length(vViewPosition) < ${m[1]}.0) {`), v);
    if (v === 'hexoff') return () => patch((f) => rep(f, 'if (mode == TEXLIB_HEX) {', 'if (false) {'), v);
    if (v === 'nofine') return () => patch((f) => rep(f, '  // ---- modelled detail (shader-only, no layout change) ----\n  {', '  if (false) {'), v);
    if (v === 'nomural') return () => patch((f) => rep(f, '  if (vFaceFlags.z > -0.5) {\n    // atlas rect', '  if (false) {\n    // atlas rect'), v);
    if (v === 'nolampsF') return () => patch((f) => rep(f, 'if (i >= uLampN) break;', 'break;'), v);
    return null;
  };
  // the share of the frame each art style covers (level meshes only, the eight views, a 320×180 target): style 0 = no art,
  // 9 = not level (sky, backdrop, props …); and the distance histogram of level pixels (< 10, 20, 30, 45, 60, ≥ 60 m)
  const coverage = () => {
    if (O.cover === '0') return null;
    const W = 320, H = 180, rt = new THREE.WebGLRenderTarget(W, H), buf = new Uint8Array(W * H * 4);
    const mat = new THREE.ShaderMaterial({ vertexShader: 'attribute vec2 aArt; varying float vS; varying float vD; void main() { vS = aArt.x; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vS; varying float vD; void main() { gl_FragColor = vec4((floor(vS + 0.5) + 0.5) / 16.0, clamp(vD / 100.0, 0.0, 1.0), 1.0, 1.0); }' });
    const lv = levelMeshes().filter((o) => o.visible), keep = new Set(lv), hid = [];
    sc.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && !keep.has(o)) { o.visible = false; hid.push(o); } });
    const mats = lv.map((o) => o.material); lv.forEach((o) => { o.material = mat; });
    const bg = sc.background, fog = sc.fog; sc.background = null; sc.fog = null;
    const st = new Array(10).fill(0), dh = new Array(6).fill(0); let n = 0;
    for (const [f, l] of views) {
      g.rig.cinematic(V(f), V(f), V(l), V(l), 99, () => {}); g.debug.step(1000 / 60);
      Rn.setRenderTarget(rt); Rn.setClearColor(0x000000, 0); Rn.clear(); Rn.render(sc, G.camera); Rn.readRenderTargetPixels(rt, 0, 0, W, H, buf); Rn.setRenderTarget(null);
      for (let i = 0; i < W * H; i++) { n++; if (buf[i * 4 + 2] < 128) { st[9]++; continue; } st[Math.min(8, Math.floor(buf[i * 4] / 16))]++; const d = buf[i * 4 + 1] / 2.55; dh[d < 10 ? 0 : d < 20 ? 1 : d < 30 ? 2 : d < 45 ? 3 : d < 60 ? 4 : 5]++; }
    }
    lv.forEach((o, i) => { o.material = mats[i]; }); hid.forEach((o) => { o.visible = true; }); sc.background = bg; sc.fog = fog;
    rt.dispose(); mat.dispose();
    const lvN = n - st[9];
    return { styles: st.map((c) => +(100 * c / n).toFixed(1)), dist: dh.map((c) => +(100 * c / Math.max(1, lvN)).toFixed(1)) };
  };
  const cover = coverage();
  const res = { base: [] };
  for (let r = 0; r < ROUNDS; r++) {
    res.base.push((await measure()).mean);
    for (const v of VARS) {
      const f = V2[v] || pat(v); if (!f) { notes[v] = 'unknown'; continue; }
      const off = f();
      for (let i = 0; i < 4; i++) g.debug.step(1000 / 60);   // (a patched program compiles here)
      await new Promise((r) => setTimeout(r, +(O.settle || 800)));
      for (let i = 0; i < 8; i++) { g.debug.step(1000 / 60); gl.finish(); }
      const m = await measure();
      off();
      for (let i = 0; i < 2; i++) g.debug.step(1000 / 60);
      (res[v] = res[v] || []).push(m.mean);
    }
  }
  res.base.push((await measure()).mean);
  R.render = rend0;
  const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const b = med(res.base), d = {};
  for (const v of VARS) if (res[v]) d[v] = +(med(res[v]) - b).toFixed(2);
  return { map: g.mapDef?.id, era: G.eraWorld?.era ?? 0, time: G.env?.theme, ext: !!ext, quality: g.settings.quality, base: +b.toFixed(2), delta: d, cover, res, notes, calls: Rn.info.render.calls };
})()
