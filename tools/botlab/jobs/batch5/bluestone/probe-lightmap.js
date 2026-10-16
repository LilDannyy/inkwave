// Bluestone eras (scratch): the lightmap probe picture — the R, G and B channels (eras 1, 2, 3) of the street face that
// holds Degrayling Lane's era-1 crates, side by side, scaled up; returned as a JPEG data URL in the result's info (the
// caller writes it to out/engine/lightmap-probe.jpg).
(() => {
  const g = window.__inkwave, L = __G.level, lm = g.levelMat?.userData?.uniforms?.uLight?.value, img = lm && lm.image;
  if (!img) return [{ name: 'lightmap-probe', ok: false, info: 'no lightmap' }];
  const cr = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0);
  const f = L.faces.find((q) => q.turf && q.light && Math.abs(q.origin.y) < 0.05 && cr.center.x > Math.min(q.origin.x, q.origin.x + q.u.x * q.su) && cr.center.x < Math.max(q.origin.x, q.origin.x + q.u.x * q.su) && cr.center.z > Math.min(q.origin.z, q.origin.z + q.v.z * q.sv) && cr.center.z < Math.max(q.origin.z, q.origin.z + q.v.z * q.sv));
  if (!f) return [{ name: 'lightmap-probe', ok: false, info: 'no face' }];
  const c0 = document.createElement('canvas'); c0.width = img.width; c0.height = img.height; const x0 = c0.getContext('2d'); x0.drawImage(img, 0, 0);
  const ppm = f.light.ppm, pad = f.light.pad, w = Math.ceil(f.su * ppm) + pad * 2, h = Math.ceil(f.sv * ppm) + pad * 2, S = img.height;
  const d0 = x0.getImageData(f.light.x, S - (f.light.y + h), w, h).data;   // (the atlas is stored flipped: atlas row y → image row S − 1 − y)
  const K = Math.max(2, Math.floor(400 / Math.max(w, h))), c = document.createElement('canvas'); c.width = w * K * 3 + 40; c.height = h * K + 60;
  const x = c.getContext('2d'); x.fillStyle = '#20242c'; x.fillRect(0, 0, c.width, c.height); x.font = '16px sans-serif'; x.fillStyle = '#f4e9c8';
  ['R: 1880s (the crates there)', 'G: TODAY (gone)', 'B: 3000s'].forEach((t, k) => {
    x.fillStyle = '#f4e9c8'; x.fillText(t, 10 + k * (w * K + 10), 22);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const v = d0[((h - 1 - yy) * w + xx) * 4 + k]; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(10 + k * (w * K + 10) + xx * K, 36 + (h - 1 - yy) * K, K, K); }
  });
  // the crates' footprint drawn on each panel (face u / v → texels)
  x.strokeStyle = '#f4e9c8'; x.lineWidth = 2;
  const uv = (wx, wz) => [((wx - f.origin.x) * f.u.x + (wz - f.origin.z) * f.u.z) * ppm + pad, ((wx - f.origin.x) * f.v.x + (wz - f.origin.z) * f.v.z) * ppm + pad];
  for (let k = 0; k < 3; k++) { const [u0, v0] = uv(cr.aabbMin.x, cr.aabbMin.z), [u1, v1] = uv(cr.aabbMax.x, cr.aabbMax.z); const X0 = 10 + k * (w * K + 10);
    x.save(); x.beginPath(); x.rect(X0, 36, w * K, h * K); x.clip(); x.setLineDash([6, 4]); x.strokeRect(X0 + Math.min(u0, u1) * K, 36 + (h - Math.max(v0, v1)) * K, Math.abs(u1 - u0) * K, Math.abs(v1 - v0) * K); x.restore(); }
  x.fillStyle = '#cfc6b0'; x.font = '13px sans-serif'; x.fillText('the street face under Degrayling Lane\'s era-1 crates (dashed: their footprint); dark = occluded', 10, h * K + 54);
  return [{ name: 'lightmap-probe', ok: true, info: { face: [f.su, f.sv], texels: [w, h], url: c.toDataURL('image/jpeg', 0.88) } }];
})()
