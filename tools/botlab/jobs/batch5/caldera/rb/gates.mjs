const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const { Physics } = await import('file://' + ROOT + '/src/game/physics.js');
const { NavGraph } = await import('file://' + ROOT + '/src/game/nav.js');
const L = new Level(layoutFor(LAYOUT, 'bazookarp')), nav = new NavGraph(L, new Physics(L));
for (const n of nav.nodes) n.wet = 0;
const len = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
const node = (p) => nav.nearest({ x: p[0], y: p[1], z: p[2] }, 1.5, true);
for (const g of [[18.5, 50.5], [18, 50.5], [18, 50], [17.5, 50.5], [19, 50.5], [18.5, 51], [19, 50]]) {
  const a = len(nav.path(node([0, 1.8, 0]), node([g[0], 3.6, g[1]]), 0, 400000, true)), b = len(nav.path(node([0, 1.8, 0]), node([-g[0], 3.6, -g[1]]), 1, 400000, true));
  console.log(JSON.stringify(g), 'L_A', a.toFixed(1), 'L_B', b.toFixed(1), 'diff', (100 * Math.abs(a - b) / a).toFixed(1) + ' %', 'pad', Math.hypot(g[0] - 17, g[1] - 62.5).toFixed(1));
}
