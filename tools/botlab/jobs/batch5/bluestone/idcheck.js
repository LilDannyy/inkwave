// (fix round 2) the generic shader trims give the same picture: the level material patched back to the original code
// (big / fine computed for every fragment, the coping's stone everywhere) against the trimmed one, three eras × four places;
// and hex anti-tiling back on against off at the same places (the pictures saved for the eye: window.__hexShots)
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three'), W = G.eraWorld, E = g.match.eras, Rn = G.renderer;
  g.debug.freeze();
  for (const a of g.match.actors) { a.bot = null; a.character.root.visible = false; a.character.setVisible?.(false); } G.projectiles.clear();
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const grab = () => { g.R.render(); const gl = Rn.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return { w, h, px }; };
  const diff = (A, B) => { let mx = 0, s = 0, n = 0, big = 0; for (let i = 0; i < A.px.length; i += 4) { let d = 0; for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(A.px[i + c] - B.px[i + c])); mx = Math.max(mx, d); s += d; n++; if (d > 8) big++; } return { max: mx, mean: +(s / n).toFixed(3), over8: +(100 * big / n).toFixed(2) }; };
  const cams = [[[-19.5, 2.75, -50.5], [-21, 3.6, -26]], [[-17.9, 1.75, -32.0], [-27, 3.0, -13]], [[-20, 1.75, -28], [-20, 2.6, -60]], [[-33.6, 1.75, -48.5], [-34.6, 2.6, -28]]];
  const mats = [...new Set([g.levelMat, ...Object.values(W._static || {})])];
  const ORIG = (f) => f.replace('  float big = 0.0, fine = 0.0;   // [b5-bluestone] (GPU time; the same picture) the texlib path reads them in two places only: computed there', '  float big = fbm(vWPos.xz * 0.18 + vWPos.y * 0.1);\n  float fine = vnoise(fu * 9.0);')
    .replace('      if (cop > 0.0) {   // [b5-bluestone] (GPU time; the same picture) the stone only where the coping shows', '      {').replace('      fine = vnoise(fu * 9.0);   // [b5-bluestone]\n', '').replace('    big = fbm(vWPos.xz * 0.18 + vWPos.y * 0.1);   // [b5-bluestone]\n', '');
  const saved = mats.map((m) => [m.onBeforeCompile, m.customProgramCacheKey]);
  let hits = 0;
  const patch = () => mats.forEach((m, i) => { const [ob, ck] = saved[i]; m.onBeforeCompile = (sh, r) => { ob.call(m, sh, r); const f = ORIG(sh.fragmentShader); if (f !== sh.fragmentShader) hits++; sh.fragmentShader = f; }; m.customProgramCacheKey = () => ck.call(m) + '|orig'; m.needsUpdate = true; });
  const unpatch = () => mats.forEach((m, i) => { m.onBeforeCompile = saved[i][0]; m.customProgramCacheKey = saved[i][1]; m.needsUpdate = true; });
  const out = [], hex = [];
  for (const e of [1, 2, 3]) {
    E.debugJump(e, { instant: true }); step(260);
    for (const [f, l] of cams) {
      g.rig.cinematic(new THREE.Vector3(...f), new THREE.Vector3(...f), new THREE.Vector3(...l), new THREE.Vector3(...l), 99, () => {}); step(2);
      const A0 = grab(); const A = grab(); patch(); const B = grab(); unpatch(); const A2 = grab();
      out.push({ e, at: f.join(','), ...diff(A, B), noise: diff(A0, A).max, back: diff(A, A2).max });
      for (const [v, z, w] of W._hexOff) { v.z = z; v.w = w; }
      const H = grab();
      for (const [v] of W._hexOff) { v.z = 1; v.w = 7; }
      hex.push({ e, at: f.join(','), ...diff(A, H) });
    }
  }
  return { hits, patchedMaterials: mats.length, sameWithOriginalCode: out, hexOnVsOff: hex, hexSlots: W._hexOff.length };
})()
