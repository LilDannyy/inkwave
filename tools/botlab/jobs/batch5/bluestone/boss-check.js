// Bluestone Junction — Boss Battle check, era 2 (DESIGN.md §4.5; copied from the Craters check, fix round 1; the overhang
// test made pose-based in fix round 2):
//   ERA=2 MAP=bluestone MODE=boss PAGE=…/boss-check.js tools/botlab/run.sh tools/botlab/page.cjs
// HULLBREAKER's home ground on this stage (the nav plan), then 120 s of a stepped bot match: where it walks, how far,
// which moves it plays (charges that hit a wall → stuns), and whether it ever sits still for long.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const boss = __G.boss;
  R('boss match running on the stage', m.mode === 'boss' && !!boss, { mode: m.mode });
  if (!boss) return out;
  const nav = boss.nav, st = nav.step;
  const kinds = [0, 0, 0, 0]; for (let i = 0; i < nav.kind.length; i++) kinds[nav.kind[i]]++;
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const i of nav.planIds) { const [x, z] = nav.xz(i); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); }
  R('home ground (plannable area for the boss)', nav.area > 150, { area_m2: Math.round(nav.area), floorY: nav.floorY, box: [bx0, bx1, bz0, bz1].map((v) => +v.toFixed(1)), cells: { floor: kinds[0] * st * st, wall: kinds[1] * st * st, drop: kinds[2] * st * st, pad: kinds[3] * st * st } });
  // the overhangs (fix round 2, review issue 3: the honest measure): every pose the boss may take on its home ground (each
  // plan cell × 32 headings where its nav's poseOk holds), its wall circles (claws r 2.5 at 2.3 m ahead, shell rim r 2.6 at
  // 1.8 m behind) against each overhang's footprint (the balcony, its landing, the gallery, the verandas; Bravo's are the
  // mirror). Penetration = how far the deepest circle reaches inside the footprint; ≤ 0.05 m (the nav's 0.5 m grid
  // rounding) passes: the body never stands under a balcony or a veranda
  const { WALL_BODY } = await import('./src/boss/bossNav.js');
  const OVER = { balconyN: [-14, -5, -18.5, -15.5], landing: [-14, -11, -15.5, -12.5], gallery: [-7, -5, -30.5, -18.5], verandaE1: [4.5, 7, -27, -19], verandaE2: [4.5, 7, -44, -31], verandaW: [-7, -4.5, -44, -40] };
  const dbox = (x, z, [x0, x1, z0, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
  const pen = {}; let worst = -Infinity;
  for (const [k, b] of Object.entries(OVER)) for (const sg of [1, -1]) {
    const bb = sg > 0 ? b : [-b[1], -b[0], -b[3], -b[2]]; let w0 = -Infinity, at = null;
    for (const i of nav.planIds) { const [x, z] = nav.xz(i); if (dbox(x, z, bb) > 6) continue;
      for (let a = 0; a < 32; a++) { const yaw = (a / 32) * Math.PI * 2; if (!nav.poseOk(x, z, yaw)) continue;
        for (const w of WALL_BODY) { const p = w.r - dbox(x + Math.sin(yaw) * w.z, z + Math.cos(yaw) * w.z, bb); if (p > w0) { w0 = p; at = [x, z]; } } } }
    pen[k + (sg > 0 ? ':a' : ':b')] = w0 === -Infinity ? null : { pen_m: +w0.toFixed(2), at }; if (w0 > worst) worst = w0;
  }
  R('overhangs: no pose of the boss reaches under the balcony, its landing, the gallery or a veranda (penetration ≤ 0.05 m)', worst <= 0.05, { worst_m: +worst.toFixed(2), pen });
  // where its home ground is (the circus ring: a plan cell 9.5 … 20 m from the centre)
  let ring = 0; for (const i of nav.planIds) { const [x, z] = nav.xz(i); const r = Math.hypot(x, z); if (r >= 8.8 && r <= 20) ring++; }
  R('home ground includes the circus ring (≥ 150 m² of it)', ring * st * st >= 150, { ring_m2: ring * st * st });
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const seen = new Set(), trail = []; let dist = 0, still = 0, maxStill = 0, prev = boss.pos.clone();
  const moves = {}; let stuns = 0, lastStun = false;
  for (let t = 0; t < 120; t++) {
    step(1);
    const p = boss.pos; dist += Math.hypot(p.x - prev.x, p.z - prev.z);
    if (Math.hypot(p.x - prev.x, p.z - prev.z) < 0.15 && !boss.move) { still++; maxStill = Math.max(maxStill, still); } else still = 0;
    prev = p.clone(); seen.add(Math.round(p.x / 4) + ':' + Math.round(p.z / 4)); if (t % 10 === 0) trail.push([+p.x.toFixed(1), +p.z.toFixed(1)]);
    if (boss.move && boss.move.id) moves[boss.move.id] = (moves[boss.move.id] || 0) + (boss.moveT < 1 ? 1 : 0);
    if (boss.stunned && !lastStun) stuns++; lastStun = boss.stunned;
    if (boss.dead) break;
  }
  const played = boss.log.moves.reduce((o, mv) => { o[mv[1]] = (o[mv[1]] || 0) + 1; return o; }, {});
  R('it roams (distance walked, 4 m cells visited)', dist > 50 && seen.size > 8, { dist_m: Math.round(dist), cells4m: seen.size, trail });
  R('it never stands idle for long (outside a move)', maxStill < 12, { maxIdle_s: maxStill });
  R('it plays its moves (charges included)', Object.keys(played).length >= 3, { played, stuns, hp: +(boss.hp / boss.maxHp).toFixed(2), dead: boss.dead });
  return out;
})();
