// the Bazookarp second route to the weir that does not use Bravo's causeway at all (Casting Floor at LOW, gantry at HIGH)
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
const K = LAYOUT.bazookarp, pond = K.start, weir = K.weirs[0].at, gate = K.gate.at;
const A = new Uint8Array(nav.nodes.length); for (const n of nav.nodes) if (Math.abs(n.x) < 5.6 && n.z > 11 && n.z < 22.6) A[n.id] = 1;
const r1 = nav.path(node(pond), node(weir), 0, 400000, true), r2 = nav.path(node(pond), node(weir), 0, 400000, true, A);
const via = (p) => [...new Set(p.slice().reverse().filter((_, i) => i % 5 === 0).map((i) => `(${nav.nodes[i].x.toFixed(0)},${nav.nodes[i].y.toFixed(1)},${nav.nodes[i].z.toFixed(0)})`))].join(' ');
console.log(process.env.LAVA, 'route 1', len(r1).toFixed(1), '| route 2 off the causeway', r2 ? `${len(r2).toFixed(1)} m = ${(len(r2) / len(r1)).toFixed(2)}× via ${via(r2)}` : 'NONE', '| L', len(nav.path(node(pond), node(gate), 0, 400000, true)).toFixed(1));
