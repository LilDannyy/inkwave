// lightmap rows (size-budget.js's measure: the atlas at 8 ppm, 2048 wide) in Node, with the texel area by piece tag
const ROOT = new URL('../../../../../../', import.meta.url).pathname;
const { LAYOUT } = await import('file://' + ROOT + 'src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + 'src/world/variants.js');
const { Level } = await import('file://' + ROOT + 'src/world/level.js');
const L = new Level(layoutFor(LAYOUT, process.env.MODE || 'turf'));
L.layoutLightmap(8, 2048);
const by = {};
for (const f of L.faces) { if (L.blocks[f.block].grate) continue; const t = L.blocks[f.block].tag || '-'; const a = (Math.ceil(f.su * 8) + 4) * (Math.ceil(f.sv * 8) + 4); (by[t] ||= [0, 0])[0] += a; by[t][1]++; }
console.log(`rows ${L.lightUsed} / 2048, faces ${L.faces.length}, blocks ${L.blocks.length}`);
console.log(Object.entries(by).sort((a, b) => b[1][0] - a[1][0]).slice(0, +(process.argv[2] || 18)).map(([t, [a, n]]) => `${t}:${(a / 2048).toFixed(0)}r/${n}f`).join('  '));
