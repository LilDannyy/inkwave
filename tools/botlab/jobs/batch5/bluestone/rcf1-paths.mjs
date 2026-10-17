// Bluestone round C fix 1 (scratch): the paths the bots' nav picks (the real Level, Physics and NavGraph) for the round's
// changes, with their turning points:   ERA=1|2|3 node --import ./three-hook.mjs rcf1-paths.mjs
//   pad → the Halo's 270° side (the knee flight and the hotel stair), Swimston's knee → the balcony (the flight), the pad →
//   the customs dock, the dock's gangway to the enemy Boathouse deck, Bravo's pad → Alpha's knee side zone (the visitors' way in) and the side zone's entrances (nav
//   edges from outside into the zone, grouped within 3 m)
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const lvl = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), nav = new NavGraph(lvl, new Physics(lvl));
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const r1 = (v) => Math.round(v * 2) / 2;
const route = (a, b, team = 0) => { const na = near(...a), nb = near(...b); if (na < 0 || nb < 0) return 'no node'; const p = nav.path(na, nb, team, 400000); if (!p) return '—';
  let s = 0; const pts = []; let lastDir = null;
  for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z);
    const d = Math.atan2(v.x - u.x, v.z - u.z); if (lastDir === null || Math.abs(d - lastDir) > 0.6 || Math.abs(v.y - u.y) > 0.4) pts.push([r1(u.x), +u.y.toFixed(1), r1(u.z)]); lastDir = d; }
  const e = nav.nodes[p[p.length - 1]]; pts.push([r1(e.x), +e.y.toFixed(1), r1(e.z)]); return { m: +s.toFixed(1), pts }; };
const out = { era: process.env.ERA || '1' };
out['pad→halo270'] = route([-18, 3.3, -64.5], [-12.8, 5.4, -3]);
out['swimKnee→balcony'] = route([-20, 0, -24], [-10, 2.4, -17]);
out['pad→dock'] = route([-18, 3.3, -64.5], [-30.5, 1.2, 8.4]);
out['circus9→dock'] = route([-14, 0, 0], [-30.5, 1.2, 8.4]);
// the gangway: the dock → the enemy Boathouse's deck (Bravo's, over the circus's north-west) and Alpha's knee → that deck
out['dock→enemyDeck'] = route([-30.5, 1.2, 8.4], [-18, 2.4, 20]);
out['prow→enemyDeck'] = route([-31, 1, -20], [-18, 2.4, 20]);
out['enemyDeck→dock'] = route([-18, 2.4, 20], [-30.5, 1.2, 8.4], 1);
out['bravoPad→sideZoneA'] = route([18, 3.3, 64.5], [-26, 0, -19.5], 1);
out['alphaPad→sideZoneA'] = route([-18, 3.3, -64.5], [-26, 0, -19.5]);
// (the round-C side zone's centre at the GPO's corner, for comparison)
out['bravoPad→oldSideZoneA'] = route([18, 3.3, 64.5], [-20.25, 0, -42], 1);
out['alphaPad→oldSideZoneA'] = route([-18, 3.3, -64.5], [-20.25, 0, -42]);
// the side zone's entrances (Alpha's): nav edges from outside the zone's rectangle into it, by the side they cross (W, E,
// S, N), split into openings where the crossings along a side are more than 1.5 m apart (a solid between)
const Z = LY.LAYOUT.zones.side, poly = Z.poly;
const X0 = Math.min(...poly.map((p) => p[0])), X1 = Math.max(...poly.map((p) => p[0])), Z0 = Math.min(...poly.map((p) => p[1])), Z1 = Math.max(...poly.map((p) => p[1]));
const inZ = (n) => n.x > X0 && n.x < X1 && n.z > Z0 && n.z < Z1 && n.y >= Z.y0 - 0.3 && n.y <= Z.y1 + 0.3;
const sides = { W: [], E: [], S: [], N: [], above: [] };
for (const n of nav.nodes) { if (!n || inZ(n)) continue; for (const e of n.nb || []) { const m = nav.nodes[e.to]; if (!m || !inZ(m)) continue;
  const k = n.x <= X0 ? 'W' : n.x >= X1 ? 'E' : n.z <= Z0 ? 'S' : n.z >= Z1 ? 'N' : 'above'; sides[k].push({ t: k === 'W' || k === 'E' ? m.z : m.x, y: m.y, type: e.type }); } }
const groups = [];
for (const [k, cs] of Object.entries(sides)) { cs.sort((a, b) => a.t - b.t); let g = null; for (const c of cs) { if (!g || c.t - g.t1 > 1.5) { g = { side: k, t0: c.t, t1: c.t, n: 0, ys: new Set(), types: new Set() }; groups.push(g); } g.t1 = c.t; g.n++; g.ys.add(+c.y.toFixed(1)); g.types.add(c.type); } }
out.sideZoneEntrances = groups.map((g) => `${g.side} ${g.side === 'W' || g.side === 'E' ? 'z' : 'x'} ${r1(g.t0)}…${r1(g.t1)} (${g.n} edges; y ${[...g.ys].join('/')}; ${[...g.types].join('/')})`);
out.sideZoneEntranceCount = groups.length;
const pad = [-18, -64.5], c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
out.sideZoneCentre = c.map((v) => +v.toFixed(2)); out.sideZoneFromPad = +Math.hypot(c[0] - pad[0], c[1] - pad[1]).toFixed(1); out.sideZoneFromMid = +Math.hypot(c[0], c[1]).toFixed(1);
console.log(JSON.stringify(out, null, 1));
