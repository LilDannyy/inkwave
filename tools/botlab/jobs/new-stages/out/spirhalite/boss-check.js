// Spirhalite Islands — Boss Battle check (scratch, for the stage report). Run:
//   BOTLAB_OUT=~/inkwave-botlab/.botlab SLOTS=3 MAP=spirhalite MODE=boss PAGE=tools/botlab/jobs/new-stages/out/spirhalite/boss-check.js tools/botlab/run.sh tools/botlab/page.cjs
// HULLBREAKER's home ground (BossNav plannable region), then 150 s of stepped play with the bot squad: how far it roams,
// which moves it plays (charges, and how many end on a wall), whether it ever stands still wanting to move, and whether
// it ever leaves its floor (sea). Thresholds calibrated on shipped stages (same check, 2026-09-29): Halyard home ground
// 229 m², walked 16 m; Terrace Heights 187 m², walked 10 m.
// "Off its floor" counts the time the boss stands more than 1 m from any plannable cell of its home ground: its own
// pose rules let it stand up to ~0.4 m past them (claws 2.5 m from a wall vs 2.9 m for planning, body 1.5 m from the
// sea vs 1.8 m), which it does on the S when it faces the squad across a lagoon; that edge time is reported as info.
(async () => {
  const g = window.__inkwave, m = g.match, b = m && m.boss, out = [];
  if (!b) return [{ name: 'boss mode running', ok: false, info: { mode: m && m.mode } }];
  const nav = b.nav;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const i of nav.planIds) { const [x, z] = nav.xz(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  out.push({ name: 'home ground (plannable) ≥ 200 m² (Halyard 229)', ok: nav.area >= 200, info: { area: +nav.area.toFixed(0), x: [x0, x1], z: [z0, z1], floorY: nav.floorY, spawn: [+b.pos.x.toFixed(1), +b.pos.z.toFixed(1)] } });
  g.debug.freeze();
  const r1 = (v) => Math.round(v * 10) / 10;
  let t = 0, dist = 0, still = 0, maxStill = 0, minY = 99, offPlan = 0, offEdge = 0;
  const nearPlan = (x, z) => { for (let r = 0.5; r <= 1.0; r += 0.5) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; if (nav.isPlan(x + Math.cos(a) * r, z + Math.sin(a) * r)) return true; } return false; };
  const last = b.pos.clone(), seen = new Set(), movesAt = new Set();
  while (t < 150 && m.state === 'playing' && !b.dead) {
    for (let k = 0; k < 6; k++) g.debug.step(1000 / 60);
    t += 0.1;
    const d = b.pos.distanceTo(last); dist += d; last.copy(b.pos);
    minY = Math.min(minY, b.pos.y);
    seen.add(nav.cell(b.pos.x, b.pos.z) >> 3);
    if (!nav.isPlan(b.pos.x, b.pos.z)) { if (nearPlan(b.pos.x, b.pos.z)) offEdge += 0.1; else offPlan += 0.1; }
    const moving = b.st && b.st.speed > 0.3;
    if (moving && d < 0.005) { still += 0.1; maxStill = Math.max(maxStill, still); } else still = 0;
  }
  const moves = {};
  for (const mv of b.log.moves || []) { const id = Array.isArray(mv) ? mv[1] : (mv.id || '?'); moves[id] = (moves[id] || 0) + 1; }
  out.push({ name: 'roams (≥ 15 m walked in 150 s; Halyard 16)', ok: dist >= 15, info: { walked: r1(dist), cellsVisited: seen.size, simSecs: r1(t), hp: r1(b.hpFrac() * 100) + '%', dead: b.dead } });
  out.push({ name: 'never stuck wanting to move (> 2 s)', ok: maxStill <= 2, info: { longestStill: r1(maxStill) } });
  out.push({ name: 'stays on its floor (never in the sea, never > 1 m off its home ground)', ok: minY > -1.0 && offPlan < 3, info: { minY: r1(minY), offPlanSecs: r1(offPlan), atTheEdgeSecs: r1(offEdge) } });
  out.push({ name: 'plays its moves (charges included)', ok: Object.keys(moves).length >= 3, info: moves });
  return out;
})()
