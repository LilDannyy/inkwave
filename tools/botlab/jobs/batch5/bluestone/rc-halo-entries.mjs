// reviewer: where the bots' nav enters the Halo (era 3) and the garden: edges from outside into the region, clustered
const root = new URL('../../../../../', import.meta.url).pathname;   // (round C: the reviewer's halo-entries.mjs, kept in the job folder)
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, 'turf');
const extra = [];
for (const it of PR.PLACEMENTS) { if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); } }
const lvl = new Level(L0, extra), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const inHalo = (n) => n.y > 4.5 && Math.hypot(n.x, n.z) < 16.5;
const res = {};
for (const [name, f] of [['halo', inHalo]]) {
  const ent = {};
  for (const n of nav.nodes) { if (f(n)) continue;
    for (const e of n.nb) { const m = nav.nodes[e.to]; if (!f(m)) continue;
      const key = `${Math.round(m.x / 3) * 3},${Math.round(m.z / 3) * 3}:${e.type}`; ent[key] = (ent[key] || 0) + 1; } }
  res[name] = ent;
}
const halo = nav.nodes.filter(inHalo);
console.log(JSON.stringify({ era: process.env.ERA, haloNodes: halo.length, entries: res.halo }));
