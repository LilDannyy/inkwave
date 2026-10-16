const root = '/Users/danielosling/Desktop/1/st-b5-bluestone/';
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const map = process.env.MAPID || 'bluestone';
const L0 = layoutFor(MAP_LAYOUTS[map], 'turf');
const extra = [];
if (map === 'bluestone') for (const it of PR.PLACEMENTS) { if (it.type !== 'bluestone_berm') continue; for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0; extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); } }
const lvl = new Level(L0, extra), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180);
const reg = (x, y, z) => { if (z > 0) { x = -x; z = -z; } const al = x * S65 + z * C65, off = -x * C65 + z * S65, r = Math.hypot(x, z);
  if (y > 4.5 && r < 16) return 'halo'; if (map === 'bluestone' && y > 0.5 && G.inPoly(LY.YARD, x, z)) return 'garden';
  if (map === 'bluestone' && G.inPoly(LY.ALLEY.floor, x, z)) return 'alley'; if (map === 'bluestone' && !G.inPoly(LY.OUTLINE, x, z) && (x > 20 || z > -8)) return 'river-works';
  if (r <= 20) return 'circus'; if (Math.abs(off) <= 15 && al <= -20) return al < -40 ? 'arm-tip' : 'arm'; if (z <= -50) return 'base'; if (Math.abs(x) <= 7) return 'swimston'; return x < 0 ? 'west' : 'east'; };
const C = {};
for (const id of nav.validIds) { const n = nav.nodes[id]; const k = map === 'bluestone' ? reg(n.x, n.y, n.z) : 'all'; const c = C[k] || (C[k] = [0, 0, 0]); c[n.wet]++; }
const rows = Object.entries(C).map(([k, [a, b, c]]) => `${k.padEnd(12)} nodes ${String(a + b + c).padStart(5)}  wet1 ${(100 * b / (a + b + c)).toFixed(0).padStart(3)}%  wet2 ${(100 * c / (a + b + c)).toFixed(0).padStart(3)}%`);
console.log(`era ${process.env.ERA} ${map}\n` + rows.join('\n'));
let t = [0, 0, 0]; for (const v of Object.values(C)) for (let i = 0; i < 3; i++) t[i] += v[i]; console.log('all wet1', (100 * t[1] / (t[0] + t[1] + t[2])).toFixed(1), '% wet2', (100 * t[2] / (t[0] + t[1] + t[2])).toFixed(1), '%');
// false wet: a node is wet only because a probe hits a solid with no top under y + 0.6 (a wall, a bed from the sea bed)
const V = new (await import('three')).Vector3();
const F = {}, tags = {};
for (const id of nav.validIds) {
  const n = nav.nodes[id]; if (!n.wet) continue;
  let water = false, solidHit = null;
  for (const [rad] of [[1.2], [2.2]]) for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, x = n.x + Math.cos(a) * rad, z = n.z + Math.sin(a) * rad;
    if (lvl.groundHeight(x, z, n.y + 0.6) !== -Infinity) continue;
    V.set(x, n.y + 0.3, z);
    const ids = lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, []);
    const b = ids.map((i) => lvl.blocks[i]).find((b) => b.solid && lvl.pointInBlock(b, V, 0.001));
    if (b) solidHit = solidHit || b; else water = true;
  }
  const k = map === 'bluestone' ? reg(n.x, n.y, n.z) : 'all';
  if (!water && solidHit) { F[k] = (F[k] || 0) + 1; const t = solidHit.tag || solidHit._def?.tag || ('#' + solidHit.id); tags[t] = (tags[t] || 0) + 1; }
}
console.log('false-wet nodes by region', JSON.stringify(F)); console.log('by the block that makes them wet', JSON.stringify(tags));
