// Bluestone round C fix 2 (scratch): the punt crossing on the bots' own nav (the real Level, Physics and NavGraph): its
// nodes by nav.js's wet level (2 = open water or a wall within 1.2 m, +2.0 per node on a path; 1 = within 2.2 m, +0.5;
// 0 = dry), as a map of Alpha's corner (x −8 … 20, z −50 … −18; Bravo's is the twin), and the A* cost and length of
// quay → circus by the punt against the same walk's flat length.   ERA=1|2|3 node --import ./three-hook.mjs rcf2-punt-wet.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const L0 = layoutFor(MAP_LAYOUTS.bluestone, process.env.MODE || 'turf');
const lvl = new Level(L0, []), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const onPunt = (n) => !G.inPoly(LY.OUTLINE, n.x, n.z) && n.y < 0 && n.y > -0.5 && !(LY.GARDEN || []).some((g) => n.x > g[0] && n.x < g[1] && n.z > g[2] && n.z < g[3]);
const C = [0, 0, 0], C2 = [0, 0, 0];
const at = new Map();
for (const id of nav.validIds) { const n = nav.nodes[id]; if (n.z > 0 ? onPunt({ x: -n.x, y: n.y, z: -n.z }) && false : false) {}
  if (onPunt(n)) { C[n.wet]++; at.set(Math.floor(n.x) + ':' + Math.floor(n.z), n.wet); }
  const m = { x: -n.x, y: n.y, z: -n.z }; if (n.z > 0 && onPunt(m)) C2[n.wet]++; }
console.log(`era ${process.env.ERA} the punt (Alpha's): nodes ${C[0] + C[1] + C[2]}, dry ${C[0]}, wet1 ${C[1]}, wet2 ${C[2]}  (Bravo's twin: dry ${C2[0]}, wet1 ${C2[1]}, wet2 ${C2[2]})`);
const rows = [];
for (let z = -18; z >= -50; z--) { let s = String(z).padStart(4) + ' '; for (let x = -8; x <= 20; x++) { const w = at.get(x + ':' + z); s += w === undefined ? (G.inPoly(LY.OUTLINE, x + 0.5, z + 0.5) ? '#' : '.') : String(w); } rows.push(s); }
console.log('     x −8 … 20 →   (0/1/2 = a punt node\'s wet level, # = land, . = water or no node)\n' + rows.join('\n'));
// quay → circus by the punt: the path A* picks and its cost (edge costs + the wet surcharges)
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const path = (a, b) => { const p = nav.path(near(...a), near(...b)); if (!p || !p.length) return null; let len = 0, wet = 0; for (let i = 1; i < p.length; i++) { const A = nav.nodes[p[i - 1]], B = nav.nodes[p[i]]; len += Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z); wet += B.wet === 2 ? 2 : B.wet === 1 ? 0.5 : 0; } return { len: +len.toFixed(1), wetCost: +wet.toFixed(1), viaPunt: p.some((id) => onPunt(nav.nodes[id])) }; };
for (const [name, a, b] of [['quay south end (−7.5, −43.5) → the landing (14.5, −44.5)', [-7.5, 0, -43.5], [14.5, -0.34, -44.5]], ['the landing → the circus at 5 o\'clock (12.5, −17)', [14.5, -0.34, -44.5], [12.5, 0, -17]], ['quay south end → the circus at 5 o\'clock', [-7.5, 0, -43.5], [12.5, 0, -17]]]) console.log(name, JSON.stringify(path(a, b)));
