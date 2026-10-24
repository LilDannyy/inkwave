// (fix round 7, the caldera builder: boss-check with the idle spot recorded — where and in what state the boss stood still
// over 6 s — to find JOB-9's one 46 s idle)
// Boss Battle check for a stretched stage (a copy of jobs/new-stages/out/craters/boss-check.js) (MODE=boss PAGE=…/boss-check.js tools/botlab/run.sh tools/botlab/page.cjs):
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
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let idleAt = null;
  const flat = (o) => { if (o == null || typeof o !== 'object') return o ?? null; const r = {}; for (const k of Object.keys(o).slice(0, 12)) { const v = o[k]; r[k] = typeof v === 'number' ? +v.toFixed(2) : typeof v === 'object' ? (v && 'x' in v ? [+(+v.x).toFixed(1), +(+v.z).toFixed(1)] : '…') : v; } return r; };
  const seen = new Set(), trail = []; let dist = 0, still = 0, maxStill = 0, prev = boss.pos.clone();
  const moves = {}; let stuns = 0, lastStun = false;
  // (fix round 4, caldera review 4: the seconds on each half — z < 0 / z ≥ 0 — and the longest spell within 6 m of one spot)
  const half = [0, 0]; let camp = null, campMax = 0, campAt = null;
  for (let t = 0; t < 120; t++) {
    step(1);
    const p = boss.pos; dist += Math.hypot(p.x - prev.x, p.z - prev.z);
    if (Math.hypot(p.x - prev.x, p.z - prev.z) < 0.15 && !boss.move) { still++; if (still > maxStill) { maxStill = still; if (still >= 6) idleAt = { t, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], yaw: +(boss.yaw ?? 0).toFixed(2), goal: typeof boss.brain?.goal === 'number' && boss.brain.goal >= 0 ? nav.xz(boss.brain.goal).map((v) => +v.toFixed(1)) : (boss.brain?.goal ?? null), path: boss.brain?.path ? boss.brain.path.length : null, pi: boss.brain?.pi ?? null, stuckT: boss.brain?.stuckT ?? null, turning: boss.brain?._turnT ?? null, wedge: flat(boss.brain?._wedge), detour: flat(boss.brain?._detour), cross: flat(boss.brain?._cross), toL: +Math.min(Math.hypot(p.x + 10, p.z + 12.8), Math.hypot(p.x - 10, p.z - 12.8)).toFixed(1), state: boss.brain?.state ?? boss.state ?? null, stunned: !!boss.stunned, target: boss.brain?.target?.name ?? null, wp: boss.brain?._wp ? [boss.brain._wp.x, boss.brain._wp.z] : null,
      // (fix round 8, review 8: the 13 s at the causeway's south end — the walk's own state: the turn time-out, the waypoint, the fit)
      tl: flat(boss.brain?._tl), tw: +(boss.brain?._tw || 0).toFixed(2), speed: +(boss.brain?.speed || 0).toFixed(2), goalT: +(boss.brain?.goalT || 0).toFixed(2),
      wpNext: boss.brain?.path && boss.brain.pi < boss.brain.path.length ? boss.brain.path[boss.brain.pi].map((v) => +v.toFixed(2)) : null,
      dyWp: boss.brain?.path && boss.brain.pi < boss.brain.path.length ? +(Math.atan2(boss.brain.path[boss.brain.pi][0] - p.x, boss.brain.path[boss.brain.pi][1] - p.z) - boss.yaw).toFixed(2) : null,
      poseOk: nav.poseOk?.(p.x, p.z, boss.yaw) ?? null, turnOk: nav.turnOk?.(p.x, p.z, boss.yaw) ?? null, turnsOk: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (nav.turnOk?.(p.x, p.z, (k * Math.PI) / 4) ? 1 : 0)).join(''),
      bad: boss.brain?._bad ? boss.brain._bad.length : null, unstick: boss.brain?._unstick ?? null, phase: boss.phase, move: boss.move?.id ?? null }; } } else still = 0;
    half[p.z < 0 ? 0 : 1]++;
    if (!camp || Math.hypot(p.x - camp.x, p.z - camp.z) > 6) camp = { x: p.x, z: p.z, n: 0 }; else if (++camp.n > campMax) { campMax = camp.n; campAt = [+camp.x.toFixed(1), +camp.z.toFixed(1)]; }
    prev = p.clone(); seen.add(Math.round(p.x / 4) + ':' + Math.round(p.z / 4)); if (t % 10 === 0) trail.push([+p.x.toFixed(1), +p.z.toFixed(1)]);
    if (boss.move && boss.move.id) moves[boss.move.id] = (moves[boss.move.id] || 0) + (boss.moveT < 1 ? 1 : 0);
    if (boss.stunned && !lastStun) stuns++; lastStun = boss.stunned;
    if (boss.dead) break;
  }
  const played = boss.log.moves.reduce((o, mv) => { o[mv[1]] = (o[mv[1]] || 0) + 1; return o; }, {});
  R('it roams (distance walked, 4 m cells visited)', dist > 50 && seen.size > 8, { dist_m: Math.round(dist), cells4m: seen.size, trail });
  R('it never stands idle for long (outside a move)', maxStill < 12, { maxIdle_s: maxStill, idleAt, brainKeys: Object.keys(boss.brain || {}).slice(0, 60) });
  R('(information) seconds on each half (z < 0 / z ≥ 0) and the longest spell within 6 m of one spot', true, { halves_s: half, longestSpell_s: campMax, at: campAt, camps: boss.brain?._camps ?? null, backOuts: boss.brain?._backs ?? 0 });
  R('it plays its moves (charges included)', Object.keys(played).length >= 3, { played, stuns, hp: +(boss.hp / boss.maxHp).toFixed(2), dead: boss.dead });
  return out;
})();
