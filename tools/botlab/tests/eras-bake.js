// Bluestone Junction's era engine — the lightmap bake (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md T1, §4.6, §6
// step 6; docs/STAGE-MODS.md "Per-state bakes"), on the stage with its baked assets/lightmaps/bluestone.png:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-bake.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGEQ='era=n' as you like)
// The bake (tools/botlab/bake.cjs bluestone) traced W.bakePasses() — the world put in era 1, 2, 3 — once each, into the
// R, G and B channels of one RGB PNG with one layout hash ("channels": 3 in its JSON). Here: the JSON says so and its hash
// is this build's (the lightmap applies); the texture has three different channels; the channel probe — the street right
// beside and under Degrayling Lane's era-1 crates — is darker in R (era 1: the crates stand there) than in G (TODAY: they
// are gone), while shared ground far from any era piece reads the same in all three; and the level shader picks the AO
// channel of each fragment's era (its aoSample is the one-hot dot of the three).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const L = __G.level, W = __G.eraWorld;
  const meta = await (await fetch('assets/lightmaps/bluestone.json', { cache: 'no-cache' })).json().catch(() => null);
  const img = g.levelMat?.userData?.uniforms?.uLight?.value?.image;
  R('T1: the bake is one RGB lightmap of the union world — its JSON says channels 3, its hash is this build\'s (the lightmap applies)', !!meta && meta.channels === 3 && meta.hash === L.layoutHash && L.lightSize > 0 && !!img,
    { meta, hash: L.layoutHash, lightSize: L.lightSize, rows: L.lightUsed });
  if (!img) return out;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const S = c.height;
  // a texel of face f at (cu, cv) metres on it (the atlas is flipped on load: atlas row y → image row S − 1 − y)
  const texel = (f, cu, cv) => { const a = f.light, X = Math.round(a.x + a.pad + cu * a.ppm), Y = S - 1 - Math.round(a.y + a.pad + cv * a.ppm); const d = x.getImageData(X, Y, 1, 1).data; return [d[0], d[1], d[2]]; };
  // the street's top faces round a block: texels within `pad` m of its footprint (outside it: beside; inside: under)
  const ring = (b, inside, pad = 0.5) => {
    const acc = [0, 0, 0]; let n = 0;
    for (const f of L.faces) {
      if (!f.turf || !f.light || Math.abs(f.origin.y - b.aabbMin.y) > 0.06) continue;
      const fx0 = Math.min(f.origin.x, f.origin.x + f.u.x * f.su), fx1 = Math.max(f.origin.x, f.origin.x + f.u.x * f.su), fz0 = Math.min(f.origin.z, f.origin.z + f.v.z * f.sv), fz1 = Math.max(f.origin.z, f.origin.z + f.v.z * f.sv);
      if (fx1 < b.aabbMin.x - pad || fx0 > b.aabbMax.x + pad || fz1 < b.aabbMin.z - pad || fz0 > b.aabbMax.z + pad) continue;
      for (let cv = 0.1; cv < f.sv; cv += 0.25) for (let cu = 0.1; cu < f.su; cu += 0.25) {
        const wx = f.origin.x + f.u.x * cu + f.v.x * cv, wz = f.origin.z + f.u.z * cu + f.v.z * cv;
        const dx = Math.max(b.aabbMin.x - wx, 0, wx - b.aabbMax.x), dz = Math.max(b.aabbMin.z - wz, 0, wz - b.aabbMax.z), d = Math.hypot(dx, dz);
        const inB = dx === 0 && dz === 0;
        if (inside ? !inB : (inB || d > pad)) continue;
        const t = texel(f, cu, cv); acc[0] += t[0]; acc[1] += t[1]; acc[2] += t[2]; n++;
      }
    }
    return { n, rgb: acc.map((v) => +(v / Math.max(1, n)).toFixed(1)) };
  };
  const crate = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0);
  const beside = ring(crate, false, 0.6), under = ring(crate, true);
  // shared ground far from any era piece: the forecourt terrace's middle (every era alike)
  const at = (wx, wy, wz) => { for (const f of L.faces) { if (!f.turf || !f.light || Math.abs(f.origin.y - wy) > 0.06) continue; const cu = (wx - f.origin.x) * f.u.x + (wz - f.origin.z) * f.u.z, cv = (wx - f.origin.x) * f.v.x + (wz - f.origin.z) * f.v.z; if (cu > 0.05 && cv > 0.05 && cu < f.su - 0.05 && cv < f.sv - 0.05) return { at: [wx, wy, wz], rgb: texel(f, cu, cv) }; } return null; };
  const far = at(-22, 1.0, -56.5);   // (the forecourt terrace's middle: 9 m from the goods wagon, the nearest era piece)
  R('T1: the channel probe — the street beside and under Degrayling Lane\'s era-1 crates is darker in R (era 1: the crates stand there) than in G (TODAY: gone); shared ground far from any era piece reads alike in R, G and B',
    beside.n > 20 && under.n > 20 && beside.rgb[0] < beside.rgb[1] - 8 && under.rgb[0] < under.rgb[1] - 20 && !!far && Math.abs(far.rgb[0] - far.rgb[1]) <= 3 && Math.abs(far.rgb[1] - far.rgb[2]) <= 3,
    { beside, under, far });
  // the shader samples the channel of each fragment's era (eras' aoSample), so the probe's R / G difference is what a
  // player sees beside the crates in era 1 against TODAY
  const sh = { uniforms: {}, vertexShader: (await import('three')).ShaderLib.physical.vertexShader, fragmentShader: (await import('three')).ShaderLib.physical.fragmentShader, defines: {} };
  g.levelMat.onBeforeCompile(sh, __G.renderer);
  R('T1: the level shader reads the AO channel of the fragment\'s era (dot of the RGB lightmap with the era\'s one-hot)', sh.fragmentShader.includes('dot(texture2D(uLight, vLightUv).rgb, eraOneHot)'), {});
  void W;
  return out;
})()
