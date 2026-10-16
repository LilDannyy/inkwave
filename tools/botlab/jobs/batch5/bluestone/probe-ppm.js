// Bluestone eras (scratch probe): the union world's paint density and lightmap rows on 'high' (the 4096 paint atlas),
// against Halyard's on the same settings (ENGINE §4.8, rule 8: ≥ ~22 ppm on high).
(async () => {
  const g = window.__inkwave, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info: JSON.parse(JSON.stringify(info)) });
  const { MAPS } = await import('./src/config.js');
  const q0 = g.settings.quality, rows = [];
  g.settings.quality = 'high'; g.R.applySettings?.(g.settings);
  for (const id of ['bluestone', 'halyard']) {
    g.worldKey = null;
    const t0 = performance.now();
    await g._buildWorld(MAPS.find((m) => m.id === id));
    const L = __G.level, P = __G.paint;
    let area = 0; for (const f of P.paintFaces) area += f.su * f.sv;
    rows.push({ id, quality: g.settings.quality, atlas: P.size, ppm: +P.ppm.toFixed(2), paintArea_m2: Math.round(area), lightUsed: L.lightUsed ?? null, lightSize: L.lightSize, buildMs: Math.round(performance.now() - t0) });
  }
  g.settings.quality = q0; g.R.applySettings?.(g.settings);
  R('paint density and lightmap rows on high (the union world vs Halyard)', true, rows);
  return out;
})()
