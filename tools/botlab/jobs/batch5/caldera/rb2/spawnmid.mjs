// spawn-mid.js's measure in Node, with the path's turning points
const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const { Physics } = await import('file://' + ROOT + '/src/game/physics.js');
const { NavGraph } = await import('file://' + ROOT + '/src/game/nav.js');
const L = new Level(layoutFor(LAYOUT, 'turf')), nav = new NavGraph(L, new Physics(L));
const pads = L.spawnPads, mid = { x: 0, z: 0 };
let goal = -1; for (const r of [2, 3, 4, 6, 8]) { let by = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; if (Math.hypot(n.x - mid.x, n.z - mid.z) > r) return; if (n.y < by) { by = n.y; goal = i; } }); if (goal >= 0) break; }
for (const [team, s] of [[0, pads[0]], [1, pads[1]]]) {
  const a = nav.nearest({ x: s.x, y: s.y + 0.5, z: s.z }, 0.8, true), p = nav.path(a, goal, team, 200000);
  let len = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); }
  const pts = p.filter((_, i) => i % 6 === 0).map((i) => `(${nav.nodes[i].x.toFixed(1)},${nav.nodes[i].y.toFixed(1)},${nav.nodes[i].z.toFixed(1)})`);
  console.log(process.env.LAVA, 'team', team, len.toFixed(1), 'm', (len / 11.8).toFixed(2), 's', pts.join(' '));
}
