// Bluestone round C fix 1 (scratch; the round-C reviewer's karp-ring.mjs, kept so the count can be re-run): SPEC §9.1 #5 entrances into the Gate's 15 m ring, on the bots' nav graph
// (walk/jump/drop edges; climbs reported separately), grouped within 3 m; each entrance's line of sight from 1.5 m
// above the spawn deck's front edge. Plus route 1/2 per leg (nav-measure's rule) and the Gate's distance from the pad.
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const THREE = await import('three');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, 'bazookarp');
const lvl = new Level(L0, []), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const K = MAP_LAYOUTS.bluestone.bazookarp;
const G = { x: K.gate.at[0], z: K.gate.at[1] }, R = 15;
const inR = (n) => Math.hypot(n.x - G.x, n.z - G.z) < R;
const cross = [];
for (const n of nav.nodes) { if (inR(n)) continue; for (const e of n.nb) { const m = nav.nodes[e.to]; if (m && inR(m)) cross.push({ x: (n.x + m.x) / 2, y: m.y, z: (n.z + m.z) / 2, type: e.type }); } }
// group within 3 m (single linkage)
const groups = [];
for (const c of cross.filter((c) => c.type !== 'climb')) {
  const hits = groups.filter((g) => g.some((d) => Math.hypot(d.x - c.x, d.z - c.z) <= 3));
  if (!hits.length) groups.push([c]); else { const g0 = hits[0]; g0.push(c); for (const g of hits.slice(1)) { g0.push(...g); groups.splice(groups.indexOf(g), 1); } }
}
const climbs = cross.filter((c) => c.type === 'climb');
// line of sight from 1.5 m above the deck's front edge (Bravo's deck x 12..31, z 60..70, front edge z 60, y 3.3)
const seen = (p) => { for (let x = 12.5; x <= 30.5; x += 1) { const o = new THREE.Vector3(x, 3.3 + 1.5, 60.2), t = new THREE.Vector3(p.x, p.y + 1, p.z), d = t.clone().sub(o); const L = d.length(); d.normalize(); const h = phys.raycast(o, d, L); if (!h.hit || h.dist >= L - 0.3) return true; } return false; };
const out = { era: process.env.ERA, gate: K.gate.at, ringR: R, crossings: cross.length, climbCrossings: climbs.length,
  entrances: groups.map((g) => { const xs = g.map((c) => c.x), zs = g.map((c) => c.z); const c = g[Math.floor(g.length / 2)]; return { n: g.length, x: [Math.min(...xs).toFixed(1), Math.max(...xs).toFixed(1)].map(Number), z: [Math.min(...zs).toFixed(1), Math.max(...zs).toFixed(1)].map(Number), y: +c.y.toFixed(2), types: [...new Set(g.map((c) => c.type))], seenFromDeck: g.some(seen) }; }) };
out.entranceCount = out.entrances.length;
const pad = lvl.spawnPads[1]; out.gateFromPad = +Math.hypot(pad.x - G.x, pad.z - G.z).toFixed(1);
console.log(JSON.stringify(out, null, 1));
