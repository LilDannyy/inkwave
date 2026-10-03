const root = new URL('../../../../../', import.meta.url).href;
const { Level } = await import(root + 'src/world/level.js');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
for (const id of process.argv.slice(2)) {
  const L = new Level(layoutFor(MAP_LAYOUTS[id], 'turf'), []);
  const ok = L.layoutLightmap(8, 2048);
  const by = new Map(); let tot = 0;
  for (const f of L.faces) { if (L.blocks[f.block].grate) continue; const a = (Math.ceil(f.su * 8) + 4) * (Math.ceil(f.sv * 8) + 4); const t = L.blocks[f.block].tag || '?'; by.set(t, (by.get(t) || 0) + a); tot += a; }
  console.log(id, 'rows', L.lightUsed, ok, 'blocks', L.blocks.length, 'faces', L.faces.length, 'texels', tot);
  console.log([...by].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t, a]) => `${t} ${(100 * a / tot).toFixed(1)}%`).join(', '));
}
