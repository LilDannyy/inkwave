// Bluestone round C fix 2 (scratch): the Halo's ways up on the bots' own nav (era 3), for the Halo proposal: path length
// and turning points from the places the attackers' routes come in (the quay out of the hotel's arch at 6:30, the punt's
// end at 5 o'clock, Swimston's knee, the pad) to the Halo's sides.   ERA=3 node --import ./three-hook.mjs rcf2-halo-ways.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics } = await import(root + 'src/game/physics.js');
const { NavGraph } = await import(root + 'src/game/nav.js');
const lvl = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), []), phys = new Physics(lvl), nav = new NavGraph(lvl, phys);
const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 0.8, false);
const P = { pad: [-18, 3.3, -64.5], archExit: [-6.5, 0, -17.5], quay26: [-7.75, 0, -25.5], punt5: [12.5, -0.34, -21.5], swimKnee: [-19.5, 0, -23.5],
  halo180: [0, 5.4, -12.8], halo225: [-9.1, 5.4, -9.1], halo270: [-12.8, 5.4, -3], halo135: [9.1, 5.4, -9.1], halo90: [12.8, 5.4, -3] };
const out = { era: process.env.ERA };
for (const a of ['archExit', 'quay26', 'punt5', 'swimKnee', 'pad']) for (const b of ['halo180', 'halo225', 'halo270', 'halo135']) {
  const p = nav.path(near(...P[a]), near(...P[b]));
  if (!p) { out[`${a}→${b}`] = '—'; continue; }
  let m = 0; for (let i = 1; i < p.length; i++) { const A = nav.nodes[p[i - 1]], B = nav.nodes[p[i]]; m += Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z); }
  const up = p.map((id) => nav.nodes[id]).find((n) => n.y > 2.3 && n.y < 5.2);
  out[`${a}→${b}`] = { m: +m.toFixed(1), firstStairNode: up ? [up.x, +up.y.toFixed(1), up.z] : null };
}
console.log(JSON.stringify(out));
