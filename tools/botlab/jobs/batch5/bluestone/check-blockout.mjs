// Bluestone blockout checks in Node (scratch, not shipped): ERA=1|2|3 [MODE=turf|tower] node check-blockout.mjs
//   holes in the walkable ground, the ground helper's misses, era groups (ENGINE rules 3–6), floor by height,
//   paintable area, the lightmap rows at 8 ppm in 2048 (the size budget), the embankment colliders.
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const ERA = await import(root + 'src/world/stages/bluestone/era.js');
const mode = process.env.MODE || 'turf';
const L = layoutFor(MAP_LAYOUTS.bluestone, mode);
// the embankment colliders (as PropKit._xfCols would hand them over)
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) {
    const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0);
    extra.push({ obox: true, center: [sgn * x, (3 - 2) / 2, sgn * z], size: [w, 5, d], rotY: (rot * 180) / Math.PI, roof: true });
  }
}
const lvl = new Level(L, extra);
const out = {};
out.era = ERA.ERA; out.mode = mode; out.blocks = lvl.blocks.length; out.layoutBlocks = L.single.length + 2 * L.half.length;
out.groundMiss = LY.GROUND_MISS.length; out.bermMiss = PR.BERM_MISS.length;
// holes: points inside the outline (and on the terrace) with no walkable top above y −0.5
const holes = [];
for (let x = -63; x <= 63; x += 0.25) for (let z = -85; z <= 85; z += 0.25) {
  if (!G.inPoly(LY.OUTLINE, x, z)) continue;
  if (G.edgeDist(LY.OUTLINE, x, z) < 0.05) continue;
  const y = lvl.groundHeight(x, z, 60);
  if (y < -0.5) holes.push([x, z]);
}
out.holes = holes.length; out.holeSample = holes.slice(0, 12);
// floor area by height (walkable tops: solid, not roof / rail / hidden; 0.5 m raster over the bounds, the highest top
// with 1.8 m of clearance above it counts once per cell; tops above 30 m ignored)
const bins = { '<0.5': 0, '0.5-1.1': 0, '1.1-2': 0, '2-3': 0, '3-4': 0, '4-6': 0 };
let floor = 0;
const P = new (await import('three')).Vector3();
for (let x = -63 + 0.25; x < 63; x += 0.5) for (let z = -85 + 0.25; z < 85; z += 0.5) {
  const ids = lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, []);
  const tops = [];
  for (const id of ids) {
    const b = lvl.blocks[id]; if (!b.solid) continue;
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const t = b.center.clone().addScaledVector(n, b.half.y), y = t.y - (n.x * (x - t.x) + n.z * (z - t.z)) / n.y;
    P.set(x, y - 0.01, z); if (!lvl.pointInBlock(b, P, 0.001)) continue;
    tops.push({ y, b });
  }
  // walkable: a non-roof, non-rail, non-hidden top with nothing solid in the 1.0 m above it
  for (const { y, b } of tops) {
    if (b.roof || b.rail || b.hidden || y < -0.5 || y > 30) continue;
    P.set(x, y + 0.5, z); if (lvl.pointInside(P)) continue;
    P.set(x, y + 1.2, z); if (lvl.pointInside(P)) continue;
    floor += 0.25;
    const k = y < 0.5 ? '<0.5' : y < 1.1 ? '0.5-1.1' : y < 2 ? '1.1-2' : y < 3 ? '2-3' : y < 4 ? '3-4' : '4-6';
    bins[k] += 0.25;
  }
}
out.floor_m2 = Math.round(floor); out.floorByHeight = Object.fromEntries(Object.entries(bins).map(([k, v]) => [k, `${Math.round(v)} (${(100 * v / floor).toFixed(0)}%)`]));
// paintable area, lightmap rows
let paint = 0; for (const f of lvl.faces) if (f.paintable) paint += f.su * f.sv;
out.paint_m2 = Math.round(paint);
out.lightmapFits = lvl.layoutLightmap(8, 2048); out.lightRows = lvl.lightUsed;
// era groups (the union build only): AABB, members, side
if (!ERA.ERA) {
  const groups = new Map();
  const add = (d, key, aabb, kind) => { let g = groups.get(key); if (!g) groups.set(key, (g = { n: 0, props: 0, x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, eras: new Set() })); g[kind]++; g.x0 = Math.min(g.x0, aabb[0]); g.x1 = Math.max(g.x1, aabb[1]); g.z0 = Math.min(g.z0, aabb[2]); g.z1 = Math.max(g.z1, aabb[3]); g.eras.add(d.eras); };
  for (const b of lvl.blocks) {
    const d = b._def; // (not kept) — fall back to the layout list below
  }
  const defs = [...L.half, ...L.half.map((d) => ({ ...d, _m: true }))];
  const mirror = (d) => d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] } : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] };
  const lvl2 = new Level({ ...L, single: [], half: L.half.filter((d) => d.eras) }, []);
  let i = 0;
  const eraDefs = L.half.filter((d) => d.eras);
  const all = [...eraDefs, ...eraDefs.map(mirror)];
  for (const b of lvl2.blocks) {
    const d = all[i++]; if (!d || !d.eras) continue;
    const key = (d.eraGroup || '#' + b.id) + (b.center.z < 0 ? ':a' : ':b');
    add(d, key, [b.aabbMin.x, b.aabbMax.x, b.aabbMin.z, b.aabbMax.z], 'n');
  }
  for (const it of PR.PLACEMENTS) if (it.eras) { const [x, , z] = it.pos, r = Math.hypot(...it.size) / 2; for (const s of [1, -1]) add(it, (it.eraGroup || 'p') + (s * z < 0 ? ':a' : ':b'), [s * x - r, s * x + r, s * z - r, s * z + r], 'props'); }
  const rows = [];
  let bad = 0;
  for (const [k, g] of groups) {
    const side = Math.max(g.x1 - g.x0, g.z1 - g.z0), r = Math.hypot((g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2);
    const flag = side > 8.05 || g.n > 12 || g.props > 12 ? ' <-- FAIL' : '';
    if (flag) bad++;
    if (k.endsWith(':a')) rows.push(`${k.padEnd(16)} blocks ${String(g.n).padStart(2)} props ${g.props} aabb ${(g.x1 - g.x0).toFixed(1)} x ${(g.z1 - g.z0).toFixed(1)}  r_g ${r.toFixed(1)}  eras ${[...g.eras].join('/')}${flag}`);
    else if (flag) rows.push(`${k} ${flag}`);
  }
  out.groups = groups.size; out.groupFails = bad;
  console.log(rows.sort().join('\n'));
  const eraBlocks = all.length;
  out.eraBlocks = eraBlocks; out.eraShare = +(eraBlocks / (L.single.length + 2 * L.half.length)).toFixed(3);
}
console.log(JSON.stringify(out, null, 1));
