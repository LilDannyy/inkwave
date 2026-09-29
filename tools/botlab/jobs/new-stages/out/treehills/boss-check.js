// Eco-Forest Treehills — Boss Battle check (page script for tools/botlab/page.cjs, MODE=boss): HULLBREAKER's home ground on the
// stage, its spawn, whether it roams the whole Commons Meadow (into both gardens), and a stepped fight (bots vs the boss) watching its
// positions: never over water, never stuck, roams the meadow.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const b = m.boss, nav = b && b.nav;
  R('boss match running with HULLBREAKER', m.mode === 'boss' && !!b && !!nav, { mode: m.mode });
  if (!nav) return out;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const i of nav.planIds) { const [x, z] = nav.xz(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  R('home ground: one open region big enough to roam (≥ 150 m² of plannable cells)', nav.area >= 150, { area: nav.area, floorY: nav.floorY, bbox: [+x0.toFixed(1), +x1.toFixed(1), +z0.toFixed(1), +z1.toFixed(1)] });
  R('it reaches both ends of the meadow (its home ground runs into both seed-bank gardens, |z| > 14)', z0 < -14 && z1 > 14 && x0 < -10 && x1 > 10, { x0, x1, z0, z1 });
  R('spawn on the home ground, on the floor', nav.isPlan(b.pos.x, b.pos.z), { pos: [+b.pos.x.toFixed(2), +b.pos.y.toFixed(2), +b.pos.z.toFixed(2)] });
  // fight for 150 s (bots attack it), sampling its position
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let wet = 0, samples = 0, still = 0, maxStill = 0, lastP = b.pos.clone(), path = 0, stuns = 0, bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9, offPlan = 0;
  const { on } = await import('./src/core/ctx.js');
  const un = on('boss:stun', () => stuns++);
  for (let t = 0; t < 150 && !b.dead && m.state === 'playing'; t += 0.5) {
    step(0.5);
    samples++;
    const k = nav.kindAt(b.pos.x, b.pos.z);
    if (k === 2 || b.pos.y < -1.2) wet++;
    if (!nav.isPlan(b.pos.x, b.pos.z)) offPlan++;
    const d = b.pos.distanceTo(lastP); path += d;
    if (d < 0.05 && !b.move) { still += 0.5; maxStill = Math.max(maxStill, still); } else still = 0;
    lastP.copy(b.pos);
    bx0 = Math.min(bx0, b.pos.x); bx1 = Math.max(bx1, b.pos.x); bz0 = Math.min(bz0, b.pos.z); bz1 = Math.max(bz1, b.pos.z);
  }
  un();
  R('never over water / off the deck', wet === 0, { wet, samples });
  R('it moves about while it fights (walks ≥ 10 m over the fight; it closes on its targets rather than patrolling)', path >= 10, { path: +path.toFixed(1), x: [+bx0.toFixed(1), +bx1.toFixed(1)], z: [+bz0.toFixed(1), +bz1.toFixed(1)] });
  R('never stands idle for long (≤ 8 s without a move)', maxStill <= 8, { maxStill });
  R('stays on its home ground (≤ 10 % of samples off the planned cells)', offPlan / samples <= 0.1, { offPlan, samples });
  R('the fight goes on (the boss acts: charges / stuns happen or it is hurt)', b.hp < b.maxHp || stuns > 0, { hp: Math.round(b.hp), maxHp: Math.round(b.maxHp), stuns, dead: b.dead, phase: b.phase });
  return out;
})()
