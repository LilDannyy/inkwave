// Bluestone round C (scratch): spawn-mid.js in Node (the same goal: the lowest valid nav node within 2 m of the point
// halfway between the spawns), with the path's turning points.   ERA=1 node --import ./three-hook.mjs rc-spawnmid.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const lvl = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), nav = new NavGraph(lvl, new Physics(lvl));
let goal = -1; for (const r of [2, 3, 4, 6, 8]) { let by = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; if (Math.hypot(n.x, n.z) > r) return; if (n.y < by) { by = n.y; goal = i; } }); if (goal >= 0) break; }
const out = { goal: [nav.nodes[goal].x, nav.nodes[goal].y, nav.nodes[goal].z] };
for (const [t, p] of lvl.spawnPads.entries()) {
  const a = nav.nearest({ x: p.x, y: p.y + 0.5, z: p.z }, 0.8, true), path = nav.path(a, goal, t, 200000);
  let len = 0; const pts = []; for (let i = 1; i < path.length; i++) { const u = nav.nodes[path[i - 1]], v = nav.nodes[path[i]]; len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); if (i % 8 === 0) pts.push([+v.x.toFixed(1), +v.y.toFixed(1), +v.z.toFixed(1)]); }
  out['t' + t] = { m: +len.toFixed(1), s: +(len / 11.8).toFixed(2), pts };
}
console.log(JSON.stringify(out));
