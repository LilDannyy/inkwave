// Bluestone Junction's era engine — the looks (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §6 steps 5 and 7), on the
// stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-look.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGE_ARGS='only=1')
// Part 1: one level mesh per era mask, shown only in its eras (both eras' meshes during a jump); the level-shader chunks
//   (the extension at every slot: aEra, the fragment's era, the AO channel of that era, the mural masks, the front, the
//   program key '-eras'); the depth material and the GTAO gate on era meshes; NO GHOSTS: a pixel probe where an absent
//   piece stands renders exactly as if its mesh were not in the scene at all (at rest, and mid-jump after its flip, GTAO on);
//   draw calls per era and mid-jump.
// Part 2: props and backdrop per era: the tagged prop buckets shown only in their eras (exactly one tram type outside a
//   jump), their era material and depth material; the backdrop's era sets (one shown per era; both during the horizon
//   run, clipped by its radius; the new one alone after it).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const D = await import('./src/world/eras-data.js');
  const only = (/only=([\d,]+)/.exec(String(window.__pageArgs || ''))?.[1] || '1,2').split(',').map(Number);
  const dbg = g.debug;
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; } a.character.root.visible = false; a.character.setVisible?.(false); }
  __G.projectiles?.clear?.();
  g.hud?.setVisible?.(false);
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const W = __G.eraWorld, E = g.match.eras, L = __G.level, Rn = __G.renderer, scene = __G.scene;
  if (!W || !E) { R('the era engine runs on bluestone', false); return out; }
  const has = (m, e) => (m >> (e - 1)) & 1;
  const cam = (from, look, fov = 60) => { g.settings.fov = fov; g.rig.cinematic(new THREE.Vector3(...from), new THREE.Vector3(...from), new THREE.Vector3(...look), new THREE.Vector3(...look), 99, () => {}); };
  // the frame as rendered (the canvas, read back in the same task as the render)
  // (a render of the frame as it stands: no sim step between the two frames compared, so the front does not move)
  const grab = () => {
    g.R.render();
    const gl = Rn.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return { w, h, px };
  };
  const diff = (A, B, box) => {   // box = [x0, y0, x1, y1] as fractions of the frame
    const x0 = Math.floor(box[0] * A.w), x1 = Math.floor(box[2] * A.w), y0 = Math.floor(box[1] * A.h), y1 = Math.floor(box[3] * A.h);
    let sum = 0, mx = 0, n = 0, lumA = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * A.w + x) * 4; for (let c = 0; c < 3; c++) { const d = Math.abs(A.px[i + c] - B.px[i + c]); sum += d; if (d > mx) mx = d; } lumA += A.px[i] + A.px[i + 1] + A.px[i + 2]; n++; }
    return { mean: +(sum / (n * 3)).toFixed(3), max: mx, lum: +(lumA / (n * 3)).toFixed(1) };
  };
  // render with some meshes taken out of the scene (the reference: as if they were never built)
  const without = (meshes, fn) => { const par = meshes.map((m) => [m, m.parent]); for (const [m, p] of par) p?.remove(m); try { return fn(); } finally { for (const [m, p] of par) p?.add(m); } };

  if (only.includes(1)) {
    // visibility per era
    const vis = [];
    for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); step(0.05); vis.push({ e, level: W.meshes.map((m) => [m.userData.eraMask, m.visible]), ok: W.meshes.every((m) => m.visible === !!has(m.userData.eraMask, e)) }); }
    R('step 5: one level mesh per era mask (1, 3, 4, 6), each shown only in its eras', vis.every((v) => v.ok), vis);
    E.debugJump(2, { instant: true });
    const j = E.debugJump(3, { inS: 0 }); step(0.5);
    R('step 5: during a jump both eras\' meshes are shown (the shader collapses each piece at its flip): 2 → 3 shows masks 3, 4, 6', W.meshes.every((m) => m.visible === !!(has(m.userData.eraMask, 2) || has(m.userData.eraMask, 3))) && W.jumping,
      { shown: W.meshes.filter((m) => m.visible).map((m) => m.userData.eraMask), front: +E.front.toFixed(1) });
    step(W.doneOff + 1.5);
    // the shader chunks: run the material's patch on the physical shader's sources and read what it made
    const mat = g.levelMat, sh = { uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, defines: {} };
    mat.onBeforeCompile(sh, Rn);
    const want = { vert: ['attribute vec2 aEra', 'vEraK = mix('], frag: ['float eraBitHere()', 'dot(texture2D(uLight, vLightUv).rgb, eraOneHot)', 'mc.a *= eraHasF(uMurEra[mi], eraBitHere());', 'uEraTint[ei]', 'ecore * 2.0'] };
    const miss = [...want.vert.filter((x) => !sh.vertexShader.includes(x)), ...want.frag.filter((x) => !sh.fragmentShader.includes(x))];
    const key = mat.customProgramCacheKey(), gkey = g.grateMat.customProgramCacheKey();
    R('step 5: the level shader carries the era chunks (aEra and the collapse, the fragment\'s era, the AO channel of that era, the mural masks, the tint / re-skins, the front), its program key ends in -eras, the uniforms are the world\'s own objects',
      !miss.length && key.endsWith('-eras') && gkey.endsWith('-eras') && sh.uniforms.uEra === W.uniforms.uEra && mat.defines?.ERAS === 1,
      { miss, key, gkey, murals: W.uniforms.uMurEra.value, remap: W.uniforms.uEraRemap.value.map((v) => v.toArray()) });
    // the depth material and the GTAO gate
    const m0 = W.meshes[0], geo = m0.geometry;
    W.jumping = true; m0.onBeforeRender(Rn, { overrideMaterial: {} }, null, geo); const gated = geo.drawRange.count;
    m0.onBeforeRender(Rn, { overrideMaterial: null }, null, geo); const normal = geo.drawRange.count;
    W.jumping = false; m0.onBeforeRender(Rn, { overrideMaterial: {} }, null, geo); const rest = geo.drawRange.count;
    R('step 5: era meshes cast shadows through a depth material that collapses absent pieces, and sit out the GTAO pass only during a jump',
      W.meshes.every((m) => m.customDepthMaterial && m.customDepthMaterial.customProgramCacheKey() === 'era-depth-aEra') && gated === 0 && normal === Infinity && rest === Infinity,
      { gated, normal, rest });
    // NO GHOSTS: the crates (era 1 only) in era 2, against the frame with the era-1 meshes out of the scene altogether
    // (on 'high', where GTAO runs: the harness profile may run lower)
    const q0 = g.settings.quality;
    if (!g.R.gtao) { g.settings.quality = 'high'; g.R.applySettings(g.settings); }
    E.debugJump(2, { instant: true });
    const crate = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0);
    cam([crate.center.x - 6, 7.5, crate.center.z - 10], [crate.center.x, 0.4, crate.center.z], 55);
    step(0.3);
    const m1 = [...W.meshes, ...W.propMeshes].filter((m) => m.userData.eraMask === 1);
    dbg.step(1000 / 60);
    const A = grab(), B = without(m1, grab);
    const dRest = diff(A, B, [0.3, 0.3, 0.7, 0.7]);
    // mid-jump, after the flip: the ferry booking office (eras 1–2) where the 3000s' river stair grows, GTAO on
    const office = L.blocks.find((b) => b.tag === 'ferry-office' && b.center.z < 0);
    cam([office.center.x + 2, 8, office.center.z - 12], [office.center.x, 1, office.center.z], 55);
    step(0.2);
    const j2 = E.debugJump(3, { inS: 0 });
    step(2.6);   // front ≈ 65 m: every eras-1–2 piece flipped (the office at r ≈ 18, the goods wagons at 49), done not yet
    const m3 = [...W.meshes, ...W.propMeshes].filter((m) => m.userData.eraMask === 3);
    const A2 = grab(), B2 = without(m3, grab), front = E.front;
    const C2 = grab(), dSame = diff(A2, C2, [0.3, 0.3, 0.7, 0.7]);   // (the same frame twice: the noise floor)
    const gtaoOn = !!g.R.gtao;
    const dJump = diff(A2, B2, [0.3, 0.3, 0.7, 0.7]);
    R('step 5: no ghosts — where an absent piece stands the frame is the frame without its mesh (GTAO on): the era-1 crates in era 2, and the eras-1–2 booking office mid-jump after its flip',
      gtaoOn && dRest.max <= 2 && dJump.max <= 2 && front > 55, { rest: dRest, midJump: dJump, sameFrame: dSame, front: +front.toFixed(1), gtao: gtaoOn, quality: q0 });
    step(W.doneOff);
    // draw calls per era (the spawn camera) and mid-jump
    const sp = L.spawnPads[0];
    cam([sp.x, sp.y + 1.7, sp.z], [sp.x * 0.3, sp.y - 1.5, 0], 82);
    const calls = {};
    for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); step(0.1); dbg.step(1000 / 60); calls['era' + e] = { calls: Rn.info.render.calls, tris: Rn.info.render.triangles }; }
    E.debugJump(1, { instant: true }); E.debugJump(2, { inS: 0 }); step(1.5); dbg.step(1000 / 60);
    calls.jump12 = { calls: Rn.info.render.calls, tris: Rn.info.render.triangles };
    step(W.doneOff);
    calls.quality = g.settings.quality;
    if (g.settings.quality !== q0) { g.settings.quality = q0; g.R.applySettings(g.settings); }
    R('step 5: draw calls per era from the spawn camera, on high (shadows, GTAO), within the Halyard budget (≤ 334 steady, ≤ 390 mid-jump)', calls.era1.calls <= 334 && calls.era2.calls <= 334 && calls.era3.calls <= 334 && calls.jump12.calls <= 390, calls);
  }

  if (only.includes(2)) {
    const PM = W.propMeshes, trams = (__G.game?.props ? null : null);
    const tramMasks = [1, 2, 4];
    const per = [];
    for (const e of [1, 2, 3]) {
      E.debugJump(e, { instant: true }); step(0.05);
      const shown = PM.filter((m) => m.visible).map((m) => m.userData.eraMask);
      per.push({ e, shown: [...new Set(shown)], tramsShown: tramMasks.filter((k) => shown.includes(k)), ok: PM.every((m) => m.visible === !!has(m.userData.eraMask, e)) });
    }
    const dress = (await import('./src/world/dressing.js')).dressingFor('bluestone').filter((it) => /tram$/.test(it.type) && it.type !== 'bluestone_track');
    R('step 7: era prop buckets shown only in their eras; exactly one tram type outside a jump (a cable tram, a tram, a float-tram: one look per era over one shared collider)',
      per.every((x) => x.ok && x.tramsShown.length === 1 && x.tramsShown[0] === 1 << (x.e - 1)) && dress.length === 6 && dress.every((it) => D.eraMask(it.eras) !== 7),
      { per, trams: dress.map((it) => `${it.type}@${it.eras} (${it.pos[0]}, ${it.pos[2]})`) });
    R('step 7: era prop buckets use the era material (collapse + dissolve) and the era depth material; ≤ 5 materials per era mask (rule 40)',
      PM.length > 0 && PM.every((m) => /\|era-aTag$/.test(m.material.customProgramCacheKey()) && m.customDepthMaterial?.customProgramCacheKey() === 'era-depth-aTag') && [1, 2, 4].every((k) => PM.filter((m) => m.userData.eraMask === k).length <= 5),
      { buckets: PM.map((m) => m.name) });
    // the backdrop's era sets and the horizon run
    const S = __G.env?.stageSets || {};
    const setVis = () => [1, 2, 3].map((k) => (S[k] ? (S[k].visible ? 1 : 0) : -1)).join('');
    E.debugJump(1, { instant: true }); step(0.05);
    const v1 = setVis();
    const j = E.debugJump(2, { inS: 0 });
    const run0 = j.at + W.reach / W.speed;
    step(run0 + 0.5 - E.S.clock.t);
    const vRun = setVis(), far = W.uniforms.uEraFar.value.toArray().map((x) => +x.toFixed(1));
    step(run0 + 1.6 - E.S.clock.t);
    const vAfter = setVis();
    const clipKey = S[1]?.children?.[0]?.material?.customProgramCacheKey?.() || '';
    R('step 7: the backdrop\'s era sets: era 1\'s alone at rest; during the horizon run (as the front leaves the arena) both, clipped at the run\'s radius; era 2\'s alone after it',
      v1 === '100' && vRun === '110' && far[3] === 1 && far[2] > W.reach && vAfter === '010' && W.uniforms.uEraFar.value.w === 0 && clipKey.endsWith('|eraset'),
      { v1, vRun, far, vAfter, sets: Object.keys(S), clipKey });
    step(W.doneOff);
    E.debugJump(1, { instant: true });
  }
  return out;
})()
