// node --import ./reg.mjs nav.mjs  [pairs.json]  — build the caldera Level + NavGraph in Node, print path lengths
const ROOT = process.env.ROOT || '/Users/danielosling/Desktop/1/st-b5-caldera';
const { LAYOUT } = await import('file://' + ROOT + '/src/world/stages/caldera/layout.js');
const { layoutFor } = await import('file://' + ROOT + '/src/world/variants.js');
const { Level } = await import('file://' + ROOT + '/src/world/level.js');
const { Physics } = await import('file://' + ROOT + '/src/game/physics.js');
const { NavGraph } = await import('file://' + ROOT + '/src/game/nav.js');
const mode = process.env.MODE || 'turf';
const lay = layoutFor(LAYOUT, mode);
const level = new Level(lay);
const phys = new Physics(level);
const t0 = Date.now();
const nav = new NavGraph(level, phys);
if (process.env.NOWET) for (const n of nav.nodes) n.wet = 0;   // (lengths, not bot costs: no 'near water' surcharge)
console.error('nodes', nav.nodes.length, 'valid', nav.validIds.length, (Date.now() - t0) + 'ms');
const len = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
const fs = await import('node:fs');
const pairs = JSON.parse(fs.readFileSync(process.argv[2] || new URL('./pairs.json', import.meta.url), 'utf8'));
const out = {};
for (const row of pairs) {
  const name = row[0]; let pts, team = 0;
  if (Array.isArray(row[1][0])) { pts = row[1]; team = row[2] || 0; } else { pts = [row[1], row[2]]; team = row[3] || 0; }
  let tot = 0, all = [], err = null;
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k], b = pts[k + 1];
    const na = nav.nearest({ x: a[0], y: a[1], z: a[2] }, 1.5, true), nb = nav.nearest({ x: b[0], y: b[1], z: b[2] }, 1.5, true);
    if (na < 0 || nb < 0) { err = 'no node ' + JSON.stringify(na < 0 ? a : b); break; }
    const p = nav.path(na, nb, team, 400000);
    if (!p) { err = 'no path ' + JSON.stringify([a, b]); break; }
    tot += len(p); all.push(...p);
  }
  if (err) { out[name] = { err }; continue; }
  const via = all.filter((_, i) => i % Math.max(1, Math.floor(all.length / 12)) === 0).map((i) => [+nav.nodes[i].x.toFixed(1), +nav.nodes[i].y.toFixed(1), +nav.nodes[i].z.toFixed(1)]);
  const a = pts[0], b = pts[pts.length - 1];
  out[name] = { m: +tot.toFixed(1), straight: +Math.hypot(a[0] - b[0], a[2] - b[2]).toFixed(1), via: process.env.VIA ? via : undefined };
}
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(34), v.err || (v.m + ' m  (straight ' + v.straight + ')'), v.via ? JSON.stringify(v.via) : '');
