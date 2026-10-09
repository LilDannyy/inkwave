// Bluestone Junction — Boss Battle check, era 2 (DESIGN.md §4.5; copied from the Craters check, fix round 1):
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
  // DESIGN.md §4.5's three overhang spots (Alpha's; Bravo's are the mirror): the balcony landing's west end, the front
  // stair's foot, veranda E1's north end. The boss reaches under an overhang only if its body (2.5 m wall radius, 2.3 m
  // ahead of its centre) gets there: the nearest cell its centre may plan to must be under 4.8 m away.
  const spots = [[-16, -14], [-5, -14], [4.5, -17]].flatMap(([x, z]) => [[x, z], [-x, -z]]);
  const near = spots.map(([x, z]) => { let best = Infinity; for (const i of nav.planIds) { const [px, pz] = nav.xz(i); best = Math.min(best, Math.hypot(px - x, pz - z)); } return { at: [x, z], plan: nav.isPlan(x, z), nearestPlan_m: +best.toFixed(2) }; });
  R('overhang spots: the boss body cannot reach under the balcony or the verandas (nearest plan cell ≥ 4.8 m)', near.every((n) => n.nearestPlan_m >= 4.8), near);
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
