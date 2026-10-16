// Bluestone (scratch, fix round 2): shoot.cjs PRE script for the boss-under-the-balcony picture. Puts HULLBREAKER on the
// home-ground cell nearest Alpha's balcony (window.__preArgs 'veranda': nearest veranda E1 instead), turned toward it at
// the heading that reaches deepest (the worst pose its nav allows), and freezes the match so the picture shows exactly
// that: how close its body gets to the overhang, and the balustrade / frieze / planters that keep it out.
(async () => {
  const g = window.__inkwave, b = __G.boss; if (!b) return 'no boss';
  const { WALL_BODY } = await import('./src/boss/bossNav.js');
  const nav = b.nav, which = window.__preArgs || 'balcony';
  const box = which === 'veranda' ? [4.5, 7, -27, -19] : [-14, -5, -18.5, -15.5];
  const dbox = (x, z) => Math.hypot(Math.max(box[0] - x, 0, x - box[1]), Math.max(box[2] - z, 0, z - box[3]));
  let best = null, bp = -Infinity;
  for (const i of nav.planIds) { const [x, z] = nav.xz(i); if (dbox(x, z) > 6) continue;
    for (let a = 0; a < 32; a++) { const yaw = (a / 32) * Math.PI * 2; if (!nav.poseOk(x, z, yaw)) continue;
      for (const w of WALL_BODY) { const p = w.r - dbox(x + Math.sin(yaw) * w.z, z + Math.cos(yaw) * w.z); if (p > bp) { bp = p; best = [x, z, yaw]; } } } }
  if (!best) return 'no pose';
  g.debug.freeze();
  b.pos.x = best[0]; b.pos.z = best[1]; b.yaw = best[2];
  if (b.brain) { b.brain.path = null; b.brain.goal = [best[0], best[1]]; b.brain.goalT = 99; }
  for (let i = 0; i < 3; i++) g.debug.step(1000 / 60);
  b.pos.x = best[0]; b.pos.z = best[1]; b.yaw = best[2];
  g.debug.step(1000 / 60);
  return { pose: best, penetration: +bp.toFixed(2) };
})();
