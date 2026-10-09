// Bluestone blockout (scratch): the bots' own nav graph in Node (the real Level, Physics and NavGraph, the embankment's
// prop colliders included), per era:   ERA=1|2|3 node --import ./three-hook.mjs nav-measure.mjs
//   • spawn → mid for both teams, to the node nearest the exact centre AND to its mirror (review: spawn-mid.js's goal
//     node sits on Alpha's half, so mirrored stages read differently for the two teams)
//   • Bazookarp (DESIGN.md §4.4, SPEC §9.1): L = Pond → Gate, Pond → weir, weir → Gate, per team, on the nav's paths
// Path length = the sum of 3D edge lengths along nav.path (as spawn-mid.js); seconds at swimSpeed.
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const { PLAYER } = await import(root + 'src/config.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, process.env.MODE || 'turf');
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const lvl = new Level(L0, extra), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const swim = PLAYER.swimSpeed || 11.8;
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const len = (a, b, team) => { const p = nav.path(a, b, team, 400000); if (!p) return null; let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return +s.toFixed(1); };
const out = { era: process.env.ERA || '1', nodes: nav.nodes.length };
const c0 = near(0, 1.3, 0), cA = near(-0.5, 1.3, -0.5), cB = near(0.5, 1.3, 0.5);
const pads = lvl.spawnPads;
for (const [t, p] of [[0, pads[0]], [1, pads[1]]]) {
  const a = nav.nearest({ x: p.x, y: p.y + 0.5, z: p.z }, 0.8, true);
  const m0 = len(a, c0, t), mA = len(a, cA, t), mB = len(a, cB, t);
  out['spawnMid_t' + t] = { centre: [m0, +(m0 / swim).toFixed(2)], alphaSide: [mA, +(mA / swim).toFixed(2)], bravoSide: [mB, +(mB / swim).toFixed(2)] };
}
// Bazookarp: Alpha attacks toward Bravo's Gate (the data is drawn on Bravo's half); Bravo's attack is the mirror
const K = MAP_LAYOUTS.bluestone.bazookarp || L0.bazookarp;
const pond = near(...K.start), gateB = near(K.gate.at[0], 1.0, K.gate.at[1]), weirB = near(...K.weirs[0].at);
const gateA = near(-K.gate.at[0], 1.0, -K.gate.at[1]), weirA = near(-K.weirs[0].at[0], K.weirs[0].at[1], -K.weirs[0].at[2]);
out.bazookarp = {
  alphaAttack: { L: len(pond, gateB, 0), pondWeir: len(pond, weirB, 0), weirGate: len(weirB, gateB, 0) },
  bravoAttack: { L: len(pond, gateA, 1), pondWeir: len(pond, weirA, 1), weirGate: len(weirA, gateA, 1) },
};
// (fix round 2, review issue 7) SPEC §9.1 #4: each leg's second route. Route 1 = the nav's shortest walk (no wall climbs:
// the carrier walks; hops and drops are nav edges); then every node within 2.5 m (xz) of route 1's polyline is avoided,
// except within 6 m of either end, and route 2 is the shortest walk left. Pass: route 2 ≤ 1.6 × route 1.
const segD = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2)) : 0; return Math.hypot(x - a.x - t * dx, z - a.z - t * dz); };
const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return +s.toFixed(1); };
const route2 = (a, b, team) => {
  const p1 = nav.path(a, b, team, 400000, true); if (!p1) return null;
  const A = nav.nodes[a], Bn = nav.nodes[b], pts = p1.map((i) => nav.nodes[i]);
  const avoid = new Uint8Array(nav.nodes.length);
  for (let i = 0; i < nav.nodes.length; i++) { const n = nav.nodes[i];
    if (Math.hypot(n.x - A.x, n.z - A.z) < 6 || Math.hypot(n.x - Bn.x, n.z - Bn.z) < 6) continue;
    for (let k = 1; k < pts.length; k++) if (segD(n.x, n.z, pts[k - 1], pts[k]) < 2.5) { avoid[i] = 1; break; } }
  const p2 = nav.path(a, b, team, 400000, true, avoid);
  const L1 = plen(p1), L2 = p2 ? plen(p2) : null;
  const via = (p) => { const m = nav.nodes[p[Math.floor(p.length / 2)]]; return [+m.x.toFixed(1), +m.z.toFixed(1)]; };
  return { route1: L1, route2: L2, ratio: L2 ? +(L2 / L1).toFixed(2) : null, ok: !!L2 && L2 <= 1.6 * L1, via1: via(p1), via2: p2 ? via(p2) : null };
};
out.bazookarpRoutes = {
  alphaAttack: { pondWeir: route2(pond, weirB, 0), weirGate: route2(weirB, gateB, 0) },
  bravoAttack: { pondWeir: route2(pond, weirA, 1), weirGate: route2(weirA, gateA, 1) },
};
console.log(JSON.stringify(out));
