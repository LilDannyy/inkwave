// Bluestone round C (scratch): what each jump changes, on the bots' own nav (the real Level, Physics and NavGraph), per
// era: path lengths between named places (Alpha's half), "—" when there is no way.   ERA=1|2|3 node --import ./three-hook.mjs rc-routes.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const lvl = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), nav = new NavGraph(lvl, new Physics(lvl));
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
// (lengths of the path A* picks, which pays extra for nodes by the water's edge — nav.js's wet rule — as the bots do)
const len = (a, b) => { const p = nav.path(a, b, 0, 400000); if (!p) return null; let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return +s.toFixed(1); };
const P = { pad: [-18, 3.3, -64.5], gpoSteps: [-20, 0, -35], quayMid: [-7.75, 0, -35], quayBridge: [-7.5, 0, -31.5], river5: [12.5, 0, -19], circusSW: [-13, 0, -13],
  prow: [-31, 1, -20], gardenMid: [2.5, -0.2, -37], halo180: [0, 5.4, -12.8], halo90: [12.8, 5.4, -3], halo270: [-12.8, 5.4, -3], bravoKnee: [24, 0, 10], swim26: [-17.5, 0, -25.5], quay26: [-7.75, 0, -25.5], puntN: [12.5, -0.34, -31.5], puntE: [3, -0.34, -42.5] };
const pairs = [['swim26', 'quay26'], ['quayBridge', 'puntN'], ['quayMid', 'puntE'], ['gpoSteps', 'quayMid'], ['quayBridge', 'river5'], ['pad', 'river5'], ['pad', 'bravoKnee'], ['quayMid', 'gardenMid'], ['circusSW', 'halo180'], ['pad', 'halo270'], ['pad', 'halo90'], ['prow', 'circusSW']];
const out = { era: process.env.ERA || '1' };
for (const [a, b] of pairs) { const na = near(...P[a]), nb = near(...P[b]); out[`${a}→${b}`] = na < 0 || nb < 0 ? 'no node' : len(na, nb) ?? '—'; }
console.log(JSON.stringify(out));
