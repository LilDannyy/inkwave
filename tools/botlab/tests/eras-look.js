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
// Part 3: the landmark from the base: the dome and its lantern stay in sight from both spawn decks in every era (no era
//   superstructure on the spawn → dome line, DESIGN §8.3).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const D = await import('./src/world/eras-data.js');
  const only = (/only=([\d,]+)/.exec(String(window.__pageArgs || ''))?.[1] || '1,2,3').split(',').map(Number);
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

  // ================================================================================================ part 3
  // The landmark from the base (DESIGN.md §8.3; review fix 4): the copper dome and its lantern, seen from each spawn deck
  // (the pad + 1.7 m, the spawn camera's eye), are never hidden by an era's rooftop superstructures. Rays from the eye to
  // points on the dome's near side (the copper: an ellipsoid r 7.05 from the drum at 9.98 to the crown at 15.12; the
  // lantern: r 1.75, 15.0–17.4); those the shared city leaves open (the GPO hides the drum in every era) are tested per
  // era against the era meshes up then (era level meshes and era prop buckets); at least 90 % stay open in every era.
  if (only.includes(3)) {
    E.debugJump(1, { instant: true }); step(0.05);
    const rc = new THREE.Raycaster(), fxg = W.fx?.group, eraSet = new Set([...W.meshes, ...W.propMeshes]);
    const under = (o, g0) => { for (let q = o; q; q = q.parent) if (q === g0) return true; return false; };
    const shown = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    const shared = [];
    // (opaque meshes only: the spawn barrier's shimmer, water and FX are see-through)
    const opaque = (o) => [].concat(o.material || []).some((m) => m && !m.transparent && m.depthWrite !== false && m.visible !== false);
    scene.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.geometry && !eraSet.has(o) && !(fxg && under(o, fxg)) && shown(o) && opaque(o)) shared.push(o); });
    const C = 9.98, RX = 7.05, RY = 15.12 - 9.98, pts = [];
    for (let i = 0; i < 32; i++) for (let j = 0; j < 7; j++) { const th = (i / 32) * Math.PI * 2, ph = ((j + 0.5) / 7) * (Math.PI / 2); pts.push({ p: new THREE.Vector3(Math.cos(th) * RX * Math.cos(ph), C + RY * Math.sin(ph), Math.sin(th) * RX * Math.cos(ph)), n: new THREE.Vector3(Math.cos(th) * Math.cos(ph) / RX, Math.sin(ph) / RY, Math.sin(th) * Math.cos(ph) / RX) }); }
    for (let i = 0; i < 16; i++) for (const y of [15.4, 16.2, 17.0]) { const th = (i / 16) * Math.PI * 2; pts.push({ p: new THREE.Vector3(Math.cos(th) * 1.76, y, Math.sin(th) * 1.76), n: new THREE.Vector3(Math.cos(th), 0, Math.sin(th)) }); }
    const eyes = L.spawnPads.map((q) => new THREE.Vector3(q.x, q.y + 1.7, q.z)), tmp = new THREE.Vector3();
    const rays = eyes.map((eye) => pts.filter((s) => s.n.dot(tmp.copy(eye).sub(s.p)) > 0).map((s) => ({ o: eye, dir: s.p.clone().sub(eye).normalize(), d: s.p.distanceTo(eye) })));
    // (a hit on the landmark itself — inside the dome's own cylinder over the drum, r ≤ 9.5 m, y ≥ 9.9: its era-3 light
    //  lattice and collar — is the landmark seen, not hidden)
    const own = (q) => Math.hypot(q.x, q.z) <= 9.5 && q.y >= 9.9;
    const hit = (r, list) => { rc.set(r.o, r.dir); rc.near = 0.05; rc.far = r.d - 0.3; return rc.intersectObjects(list, false).find((h) => !own(h.point)) || null; };
    const t0 = performance.now();
    const sharedBy = new Map();
    const base = rays.map((rs) => rs.filter((r) => { const h = hit(r, shared); if (h) { const k = `${h.object.name || h.object.type} (${Math.round(h.point.x)}, ${Math.round(h.point.y)}, ${Math.round(h.point.z)})`; sharedBy.set(k, (sharedBy.get(k) || 0) + 1); } return !h; }));
    const per = [];
    for (const e of [1, 2, 3]) {
      E.debugJump(e, { instant: true }); step(0.05);
      const up = [...W.meshes, ...W.propMeshes].filter((m) => shown(m));
      const row = { e, open: [], frac: [], blockers: [] };
      base.forEach((rs, i) => {
        let open = 0; const at = new Map();
        for (const r of rs) { const h = hit(r, up); if (!h) { open++; continue; } const k = `${h.object.name} (${Math.round(h.point.x)}, ${Math.round(h.point.y)}, ${Math.round(h.point.z)})`; at.set(k, (at.get(k) || 0) + 1); }
        row.open.push(`${open}/${rs.length}`); row.frac.push(+(open / Math.max(1, rs.length)).toFixed(3));
        row.blockers.push([...at.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ×${n}`));
      });
      per.push(row);
    }
    E.debugJump(1, { instant: true });
    R('look (review fix 4): the dome and its lantern stay in sight from both spawn decks in every era — of the rays the shared city leaves open, ≥ 90 % are open past each era\'s superstructures (DESIGN §8.3: no tower on the spawn → dome line)',
      base.every((b) => b.length >= 40) && per.every((x) => x.frac.every((f) => f >= 0.9)),
      { eyes: eyes.map((v) => v.toArray().map((x) => +x.toFixed(1))), samples: rays.map((r) => r.length), openPastShared: base.map((b) => b.length), shared: shared.length, sharedBlockers: [...sharedBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6), per, ms: Math.round(performance.now() - t0) });
  }
  return out;
})()
