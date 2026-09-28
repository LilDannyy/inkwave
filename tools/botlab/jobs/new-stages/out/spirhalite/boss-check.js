// Spirhalite Islands — Boss Battle check (scratch, for the stage report). Run:
//   BOTLAB_OUT=~/inkwave-botlab/.botlab SLOTS=3 MAP=spirhalite MODE=boss PAGE=tools/botlab/jobs/new-stages/out/spirhalite/boss-check.js tools/botlab/run.sh tools/botlab/page.cjs
// HULLBREAKER's home ground (BossNav plannable region), then 150 s of stepped play with the bot squad: how far it roams,
// which moves it plays (charges, and how many end on a wall), whether it ever stands still wanting to move, and whether
// it ever leaves its floor (sea). Thresholds calibrated on shipped stages (same check, 2026-09-29): Halyard home ground
// 229 m², walked 16 m; Terrace Heights 187 m², walked 10 m.
(async () => {
  const g = window.__inkwave, m = g.match, b = m && m.boss, out = [];
  if (!b) return [{ name: 'boss mode running', ok: false, info: { mode: m && m.mode } }];
  const nav = b.nav;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const i of nav.planIds) { const [x, z] = nav.xz(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  out.push({ name: 'home ground (plannable) ≥ 200 m² (Halyard 229)', ok: nav.area >= 200, info: { area: +nav.area.toFixed(0), x: [x0, x1], z: [z0, z1], floorY: nav.floorY, spawn: [+b.pos.x.toFixed(1), +b.pos.z.toFixed(1)] } });
  g.debug.freeze();
  const r1 = (v) => Math.round(v * 10) / 10;
  let t = 0, dist = 0, still = 0, maxStill = 0, minY = 99, offPlan = 0;
  const last = b.pos.clone(), seen = new Set(), movesAt = new Set();
  while (t < 150 && m.state === 'playing' && !b.dead) {
    for (let k = 0; k < 6; k++) g.debug.step(1000 / 60);
    t += 0.1;
    const d = b.pos.distanceTo(last); dist += d; last.copy(b.pos);
    minY = Math.min(minY, b.pos.y);
    seen.add(nav.cell(b.pos.x, b.pos.z) >> 3);
    if (!nav.isPlan(b.pos.x, b.pos.z)) offPlan += 0.1;
    const moving = b.st && b.st.speed > 0.3;
    if (moving && d < 0.005) { still += 0.1; maxStill = Math.max(maxStill, still); } else still = 0;
  }
  const moves = {};
  for (const mv of b.log.moves || []) { const id = Array.isArray(mv) ? mv[1] : (mv.id || '?'); moves[id] = (moves[id] || 0) + 1; }
  out.push({ name: 'roams (≥ 15 m walked in 150 s; Halyard 16)', ok: dist >= 15, info: { walked: r1(dist), cellsVisited: seen.size, simSecs: r1(t), hp: r1(b.hpFrac() * 100) + '%', dead: b.dead } });
  out.push({ name: 'never stuck wanting to move (> 2 s)', ok: maxStill <= 2, info: { longestStill: r1(maxStill) } });
  out.push({ name: 'stays on its floor (never in the sea)', ok: minY > -1.0 && offPlan < 3, info: { minY: r1(minY), offPlanSecs: r1(offPlan) } });
  out.push({ name: 'plays its moves (charges included)', ok: Object.keys(moves).length >= 3, info: moves });
  return out;
})()
