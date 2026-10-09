// Highmark Foundry r3: the Bazookarp layout brief's checks (bazookarp/SPEC.md §9.1, §4.4) that need only the layout and
// the nav graph, run in Node until tools/botlab/bazookarp-check.cjs exists (it is the karp engine's, not on this branch).
// Distances are walking metres on the nav graph with climb edges off (the carrier's graph without its hop/gap proofs).
//   LAVA=low|high node --import ./reg.mjs karp.mjs
const ROOT = '/Users/danielosling/Desktop/1/st-b5-caldera/';
const { LAYOUT } = await import('file://' + ROOT + 'src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + 'src/world/variants.js');
const { Level } = await import('file://' + ROOT + 'src/world/level.js');
const { Physics } = await import('file://' + ROOT + 'src/game/physics.js');
const { NavGraph } = await import('file://' + ROOT + 'src/game/nav.js');
const lay = layoutFor(LAYOUT, 'bazookarp'), K = LAYOUT.bazookarp, L = new Level(lay), nav = new NavGraph(L, new Physics(L));
for (const n of nav.nodes) n.wet = 0;
const P3 = (p) => (p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], y: 3, z: p[1] });
const node = (p) => nav.nearest(P3(p), 1.5, true);
const len = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
const route = (a, b, avoid = null, team = 0) => { const p = nav.path(node(a), node(b), team, 400000, true, avoid); return p ? p.reverse() : null; };
const out = [], ok = (n, pass, info) => out.push(`${pass ? 'OK  ' : 'FAIL'} ${n}  ${info}`);
const avoidNear = (p, keepA, keepB) => {   // nodes within 2.5 m of route p, except within 6 m of either end
  const A = new Uint8Array(nav.nodes.length), ea = nav.nodes[p[0]], eb = nav.nodes[p[p.length - 1]];
  for (const n of nav.nodes) {
    if (Math.hypot(n.x - ea.x, n.z - ea.z) < 6 || Math.hypot(n.x - eb.x, n.z - eb.z) < 6) continue;
    for (const i of p) { const m = nav.nodes[i]; if (Math.hypot(n.x - m.x, n.z - m.z) < 2.5 && Math.abs(n.y - m.y) < 2) { A[n.id] = 1; break; } }
  }
  void keepA; void keepB; return A;
};
const pond = K.start, weir = K.weirs[0].at, gate = K.gate.at, pad = LAYOUT.spawnPads[1];
const r1 = route(pond, weir), g1 = route(weir, gate), Lp = route(pond, gate);
const Lm = len(Lp), wm = len(r1), gm = len(g1);
// Bravo's attack is the mirror: measure it too (|L_A − L_B| ≤ 2 %)
const neg = (p) => p.map((v, i) => (i === 1 && p.length === 3 ? v : -v));
const LpB = nav.path(node(neg(pond)), node(neg(gate)), 1, 400000, true); const LmB = LpB ? len(LpB) : NaN;
ok('#1 L Pond → Gate 55–85 m (both teams within 2 %)', Lm >= 55 && Lm <= 85 && Math.abs(Lm - LmB) / Lm <= 0.02, `L_A ${Lm.toFixed(1)} m, L_B ${LmB.toFixed(1)} m, walking ${(Lm / 4.8).toFixed(1)} s, swimming ${(Lm / 9.44).toFixed(1)} s`);
ok('#2 weir at 40–55 % of L', wm / Lm >= 0.4 && wm / Lm <= 0.55, `Pond → weir ${wm.toFixed(1)} m = ${(100 * wm / Lm).toFixed(1)} %`);
ok('#3 weir → Gate ≥ 45 % of L and ≥ 25 m', gm / Lm >= 0.45 && gm >= 25, `${gm.toFixed(1)} m = ${(100 * gm / Lm).toFixed(1)} %`);
const r2 = route(pond, weir, avoidNear(r1)), g2 = route(weir, gate, avoidNear(g1));
ok('#4/#5 route 2 Pond → weir ≤ 1.6× and disjoint', r2 && len(r2) <= 1.6 * wm, r2 ? `${len(r2).toFixed(1)} m = ${(len(r2) / wm).toFixed(2)}× via ${[...new Set(r2.filter((_, i) => i % 6 === 0).map((i) => `(${nav.nodes[i].x.toFixed(0)},${nav.nodes[i].z.toFixed(0)})`))].join(' ')}` : 'none');
ok('#4/#5 route 2 weir → Gate ≤ 1.6× and disjoint', g2 && len(g2) <= 1.6 * gm, g2 ? `${len(g2).toFixed(1)} m = ${(len(g2) / gm).toFixed(2)}× via ${[...new Set(g2.filter((_, i) => i % 6 === 0).map((i) => `(${nav.nodes[i].x.toFixed(0)},${nav.nodes[i].z.toFixed(0)})`))].join(' ')}` : 'none');
// #6 / #8 the Gate: 12–20 m from the pad, y ≤ pad y + 0.2, inside the ±40° cone of the pad → Pond line, seen from the deck
const dG = Math.hypot(gate[0] - pad[0], gate[2] - pad[2]);
const cone = (() => { const a = [pond[0] - pad[0], pond[2] - pad[2]], b = [gate[0] - pad[0], gate[2] - pad[2]]; return Math.acos((a[0] * b[0] + a[1] * b[1]) / Math.hypot(...a) / Math.hypot(...b)) * 180 / Math.PI; })();
const solid = (x, y, z) => L.pointInside({ x, y, z }, 0, -1) && !(() => { const ids = []; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (L.pointInBlock(b, { x, y, z }, 0) && !b.rail) return false; } return true; })();
const los = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.1); for (let i = 1; i < n; i++) { const t = i / n; if (solid(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)) return false; } return true; };
const deckEdge = [pad[0], pad[1] + 1.5, -K.freeZones[0].poly.reduce((m, p) => Math.min(m, -p[1]), Infinity)];
ok('#6/#8 Gate 12–20 m from the pad, a level below, in the cone, seen from the deck', dG >= 12 && dG <= 20 && gate[1] <= pad[1] + 0.2 && cone <= 40 && los(deckEdge, [gate[0], gate[1] + 1, gate[2]]),
  `${dG.toFixed(1)} m, y ${gate[1]} vs pad ${pad[1]}, ${cone.toFixed(1)}° off the pad → Pond line, LOS from the deck's front ${los(deckEdge, [gate[0], gate[1] + 1, gate[2]])}`);
// #13 ways off the deck (nav edges leaving the deck's nodes, grouped within 3 m) and the apron's cover
const fz = K.freeZones[0].poly, inZ = (x, z) => { let c = false; for (let i = 0, j = fz.length - 1; i < fz.length; j = i++) { const [xi, zi] = fz[i], [xj, zj] = fz[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const exits = [];
for (const n of nav.nodes) if (inZ(n.x, n.z) && n.y > 4.5) for (const e of n.nb) { const m = nav.nodes[e.to]; if (!(inZ(m.x, m.z) && m.y > 4.5) && m.y < 4.5) { if (!exits.some((q) => Math.hypot(q[0] - m.x, q[1] - m.z) < 3)) exits.push([m.x, m.z]); } }
const deckToGate = route([pad[0], pad[1], pad[2]], gate, null, 1);
const blocks = L.blocks.filter((b) => b.solid && !b.rail && (b.roof || b.tag) && b.center.y + b.half.y >= 3.6 + 1.2 && b.center.y - b.half.y <= 3.7 && b.half.x < 4 && b.half.z < 4);
const apron = blocks.filter((b) => deckToGate && deckToGate.some((i) => { const m = nav.nodes[i]; return Math.hypot(m.x - b.center.x, m.z - b.center.z) - Math.max(b.half.x, b.half.z) <= 4 && m.z < pad[2] - 4; }));
ok('#13 ≥ 3 ways off the deck, ≥ 2 cover blocks ≥ 1.2 m on the apron', exits.length >= 3 && apron.length >= 2, `ways off ${exits.length} ${JSON.stringify(exits.map((e) => e.map((v) => +v.toFixed(1))))}; apron blocks ${apron.length} ${[...new Set(apron.map((b) => b.tag))].join(', ')}`);
// #14 the Pond: ring 4.5–10 m nav coverage ≥ 70 %, the shell's centre (1.3 up) seen from 1.5 up at 7 m in 8 directions
const ring = nav.nodes.filter((n) => nav.valid[n.id] && Math.hypot(n.x - pond[0], n.z - pond[2]) >= 4.5 && Math.hypot(n.x - pond[0], n.z - pond[2]) <= 10).length;
const ringA = Math.PI * (100 - 20.25), shell = [pond[0], pond[1] + 1.3, pond[2]];
const dirs = [...Array(8)].map((_, k) => { const a = k * Math.PI / 4, x = Math.cos(a) * 7, z = Math.sin(a) * 7; return [x, L.groundHeight(x, z, 6) + 1.5, z]; });
const seen = dirs.filter((d) => los(d, shell)).length;
ok('#14 Pond: ring coverage ≥ 70 %, seen from ≥ 6 of 8', ring / ringA >= 0.7 && seen >= 6, `ring ${(100 * ring / ringA).toFixed(0)} %, seen ${seen}/8`);
// #15 the weir's room: no solid within 3.0 m of its centre between 0.3 and 3.6 m above its floor (posts at 2.7 m excepted)
let near = [];
for (let a = 0; a < 360; a += 10) for (let r = 0.2; r <= 3.0; r += 0.2) for (let h = 0.3; h <= 3.6; h += 0.3) { const x = weir[0] + Math.cos(a * Math.PI / 180) * r, z = weir[2] + Math.sin(a * Math.PI / 180) * r; if (solid(x, weir[1] + h, z)) { const ids = []; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (L.pointInBlock(b, { x, y: weir[1] + h, z }, 0)) near.push(`${b.tag}@${r.toFixed(1)}m`); } } }
near = [...new Set(near.map((s) => s.split('@')[0]))];
const wdirs = [...Array(8)].map((_, k) => { const a = k * Math.PI / 4, x = weir[0] + Math.cos(a) * 7, z = weir[2] + Math.sin(a) * 7; const g = L.groundHeight(x, z, 6); return g > -1 ? [x, g + 1.5, z] : null; }).filter(Boolean);
const wseen = wdirs.filter((d) => los(d, [weir[0], weir[1] + 1.3, weir[2]])).length;
ok('#15 weir room clear 3 m, seen from ≥ 3 of 8', near.length === 0 && wseen >= 3, `solids within 3 m: ${near.join(', ') || 'none'}; seen from ${wseen}/${wdirs.length} directions on floor`);
// #5 entrances into the Gate's 15 m ring (nav edges crossing inward, grouped within 3 m), each seen from the deck's front
const cross = [];
for (const n of nav.nodes) { if (!nav.valid[n.id]) continue; const dn = Math.hypot(n.x - gate[0], n.z - gate[2]); if (dn <= 15) continue; for (const e of n.nb) { const m = nav.nodes[e.to]; if (Math.hypot(m.x - gate[0], m.z - gate[2]) <= 15 && !inZ(m.x, m.z) && m.zone < 0) cross.push([m.x, m.z, m.y]); } }
// single-linkage chaining: crossings within 3 m of each other are one entrance
const lab = cross.map((_, i) => i), find = (i) => (lab[i] === i ? i : (lab[i] = find(lab[i])));
for (let i = 0; i < cross.length; i++) for (let j = i + 1; j < cross.length; j++) if (Math.hypot(cross[i][0] - cross[j][0], cross[i][1] - cross[j][1]) < 3) lab[find(i)] = find(j);
const groups = {}; cross.forEach((c, i) => { (groups[find(i)] ||= []).push(c); });
const ent = Object.values(groups).map((g) => { const c = g.reduce((a, q) => [a[0] + q[0] / g.length, a[1] + q[1] / g.length, a[2] + q[2] / g.length], [0, 0, 0]); return [c[0], c[1], c[2], g.length]; });
const rim = []; for (let i = 0; i < fz.length; i++) { const a = fz[i], b = fz[(i + 1) % fz.length]; for (let t = 0; t < 1; t += 0.1) rim.push([a[0] + (b[0] - a[0]) * t, pad[1] + 1.5, a[1] + (b[1] - a[1]) * t]); }
const entSeen = ent.filter((q) => rim.some((r) => los(r, [q[0], q[2] + 1, q[1]])));
ok('#5 2–5 entrances into the Gate\'s 15 m ring, seen from the deck', ent.length >= 2 && ent.length <= 5 && entSeen.length === ent.length, `${ent.length} entrance groups (3 m), ${entSeen.length} seen: ${JSON.stringify(ent.map((q) => q.map((v) => +v.toFixed(1))))}`);
console.log(`== Bazookarp brief (Node nav, climbs off) LAVA=${process.env.LAVA || 'low'}`);
for (const l of out) console.log(l);
for (const q of ent) {
  const hits = rim.filter((r) => los(r, [q[0], q[2] + 1, q[1]]));
  // first blocker from the nearest rim point
  let best = null; for (const r of rim) { const d = Math.hypot(r[0] - q[0], r[2] - q[1]); if (!best || d < best[0]) best = [d, r]; }
  const r = best[1], a = r, b = [q[0], q[2] + 1, q[1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.1); let blk = null;
  for (let i = 1; i < n && !blk; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t; if (solid(x, y, z)) { const ids = []; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const bb = L.blocks[id]; if (L.pointInBlock(bb, { x, y, z }, 0)) blk = `${bb.tag}@(${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)})`; } } }
  console.log('entrance', q.map((v) => +v.toFixed(1)), 'seen from', hits.length, 'of', rim.length, 'rim points; nearest rim blocked by', blk);
}
