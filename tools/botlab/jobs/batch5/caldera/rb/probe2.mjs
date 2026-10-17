// round B nav probes (Node NavGraph, no 'near water' cost): spawn → mid, the ways onto mid per level (each door alone),
// the flanks, dead-end pockets. LAVA=low|high node --import <reg> probe2.mjs
const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const { Physics } = await import('file://' + ROOT + '/src/game/physics.js');
const { NavGraph } = await import('file://' + ROOT + '/src/game/nav.js');
const level = new Level(layoutFor(LAYOUT, process.env.MODE || 'turf')); const nav = new NavGraph(level, new Physics(level));
for (const n of nav.nodes) n.wet = 0;
const L = process.env.LAVA || 'low';
const len = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
const node = (p) => nav.nearest({ x: p[0], y: p[1], z: p[2] }, 1.5, true);
const route = (a, b, avoid = null, team = 0) => { const na = node(a), nb = node(b); if (na < 0 || nb < 0) return null; const p = nav.path(na, nb, team, 400000, true, avoid); return p ? p.reverse() : null; };
const via = (p) => [...new Set(p.filter((_, i) => i % Math.max(1, Math.floor(p.length / 8)) === 0).map((i) => `(${nav.nodes[i].x.toFixed(0)},${nav.nodes[i].y.toFixed(1)},${nav.nodes[i].z.toFixed(0)})`))].join(' ');
const pad = [-17, 4.8, -62.5], padB = [17, 4.8, 62.5], mid = [0, 1.8, 0];
const out = [];
const R = (k, pts, avoid) => { let tot = 0, all = []; for (let i = 0; i + 1 < pts.length; i++) { const p = route(pts[i], pts[i + 1], avoid); if (!p) { out.push(`${L} ${k}: NO PATH (${JSON.stringify(pts[i])} → ${JSON.stringify(pts[i + 1])})`); return null; } tot += len(p); all.push(...p); } out.push(`${L} ${k}: ${tot.toFixed(1)} m  via ${via(all)}`); return tot; };
R('A pad → centre (Pour Floor)', [pad, mid]);
R('B pad → centre (Pour Floor)', [padB, mid]);
// the doors onto Gauge Island: the island's nodes (r ≤ 16.6 round the centre, or within the Organ notches) vs the rest
const onIsland = (n) => Math.hypot(n.x, n.z) <= 16.8;
const doors = { 'causeway S': (n) => Math.abs(n.x) < 4.6 && n.z < -11 && n.z > -23.5, 'causeway N': (n) => Math.abs(n.x) < 4.6 && n.z > 11 && n.z < 23.5,
  'Race 2 W (stones)': (n) => n.x < -15.6 && n.x > -21.8 && Math.abs(n.z - 1.5) < 2.4, 'Race 2 E (stones)': (n) => n.x > 15.6 && n.x < 21.8 && Math.abs(n.z + 1.5) < 2.4,
  'Casting Floor SE': (n) => n.y < 0.6 && n.x > 3.5 && n.z < -5 && n.z > -23, 'Casting Floor NW': (n) => n.y < 0.6 && n.x < -3.5 && n.z > 5 && n.z < 23 };
const block = (keep) => { const A = new Uint8Array(nav.nodes.length); for (const n of nav.nodes) for (const [k, f] of Object.entries(doors)) if (k !== keep && f(n)) A[n.id] = 1; return A; };
let nDoors = 0;
for (const k of Object.keys(doors)) {
  const A = block(k), target = k.endsWith('W (stones)') || k === 'Casting Floor NW' || k === 'causeway N' ? [0, 1.2, 26] : [0, 1.2, -26];
  const p = nav.path(node(mid), node(k === 'Race 2 W (stones)' ? [-24.5, 1.2, 2] : k === 'Race 2 E (stones)' ? [24.5, 1.2, -2] : target), 0, 400000, true, A);
  if (p) nDoors++;
  out.push(`${L} door ${k} alone: ${p ? len(p).toFixed(1) + ' m via ' + via(p.reverse()) : 'NO PATH'}`);
}
out.push(`${L} ways onto mid: ${nDoors}`);
// with both causeways removed: mid → each rim
const noC = block('none-causeway'); for (const n of nav.nodes) { noC[n.id] = 0; if (doors['causeway S'](n) || doors['causeway N'](n)) noC[n.id] = 1; }
for (const [k, t] of [['Alpha Lakefront', [0, 1.2, -26]], ['Alpha north head (W rim)', [-24.5, 1.2, 1]], ['Bravo north head (E rim)', [24.5, 1.2, -1]], ['Bravo Lakefront', [0, 1.2, 26]]]) {
  const p = nav.path(node(mid), node(t), 0, 400000, true, noC); out.push(`${L} causeways removed: mid → ${k}: ${p ? len(p).toFixed(1) + ' m via ' + via(p.reverse()) : 'NO PATH'}`);
}
// the flanks from Alpha's pad
R('flank own rim → north Slump head (free)', [pad, [-24.5, 1.2, 1]]);
R(`flank own rim over the ${L === 'high' ? 'Race' : 'shelf'} → north head`, [pad, [-19.5, 1.2, -16.4], L === 'high' ? [-20.8, 1.3, -7.1] : [-27.4, 0.05, -9.0], [-24.5, 1.2, 1]]);
R('flank own rim → island W face', [pad, [-24.5, 1.2, 1], [-14.5, 1.2, 1.5]]);
R('flank own rim → own horn tip (NW) → Bravo quay', [pad, [-24.5, 1.2, 1], [-22.5, 2.4, 22.5], [-12.4, 2.4, 25.6]]);
R('flank enemy horn via own bridge → Bravo tail → Bravo Slump', [pad, [12.2, 2.4, -26.0], [21.5, 2.4, -24.0], [24.5, 1.2, -1]]);
R('flank enemy horn → Bravo Lakefront (S head)', [pad, [12.2, 2.4, -26.0], [21.5, 2.4, -24.0], [19.4, 1.2, 16.4]]);
if (L === 'low') R('flank ford (LOW): Lakefront → Casting Floor → ford → Bravo Horn Step', [pad, [6, 1.2, -25], [12, 0.05, -17], [19.6, 1.2, -15.5]]);
for (const l of out) console.log(l);
