// Eco-Forest Treehills — the sprout pods in a stepped all-bot match (page script for tools/botlab/page.cjs, any MODE):
//   MAP=treehills MODE=turf|zones|tower SECS=150 PAGE=tools/botlab/jobs/new-stages/out/treehills/pods-match.js tools/botlab/run.sh tools/botlab/page.cjs
// Samples every 0.25 s: hedges standing (by owner), kids / squids on a hedge top (theirs or not), bots stuck beside a
// standing hedge (no progress on a path for > 3 s within 1.5 m of its block), water deaths; the engine's own stats.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const P = m.pods, SECS = +(window.__podSecs || 150);
  if (!P) { R('pods present', false); return out; }
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const grownBy = [0, 0], seen = new Set();
  let maxUp = 0, topS = [0, 0], topOwn = [0, 0], samples = 0, dead = 0;
  const still = new Map(); let worstStuck = 0; const stuckAt = [];
  let splatsWater = 0; const un = [];
  try { const { on } = await import('./src/core/ctx.js'); un.push(on('actor:splatted', (e) => { if (e && (e.cause === 'water' || e.water)) splatsWater++; })); } catch (e) { /* optional */ }
  for (let t = 0; t < SECS && m.state === 'playing'; t += 0.25) {
    step(0.25); samples++;
    let up = 0;
    for (const p of P.pods) {
      if (p.state === 'grow' || p.state === 'stand') {
        up++;
        const key = p.id + '@' + Math.round(p.t0 * 10);
        if (!seen.has(key)) { seen.add(key); grownBy[p.owner]++; }
      }
    }
    maxUp = Math.max(maxUp, up);
    for (const a of m.actors) {
      if (a.dead) { continue; }
      for (const p of P.pods) {
        if (p.state !== 'stand' || !p.block) continue;
        const b = p.block, dx = a.pos.x - b.center.x, dz = a.pos.z - b.center.z;
        const lx = dx * b.axes[0].x + dz * b.axes[0].z, lz = dx * b.axes[2].x + dz * b.axes[2].z;
        const top = b.center.y + b.half.y;
        if (Math.abs(lx) < b.half.x + 0.2 && Math.abs(lz) < b.half.z + 0.2 && a.pos.y > top - 0.2 && a.pos.y < top + 0.6) { topS[a.team] += 0.25; if (p.owner === a.team) topOwn[a.team] += 0.25; }
        // stuck beside it: a bot with a path making no progress for > 3 s within 1.5 m of the block
        const moving = a.intent && a.intent.move && a.intent.move.lengthSq() > 0.01 && !a.intent.fire;   // (trying to walk, not holding to fight)
        if (a.bot && moving && a.bot.path && Math.abs(lx) < b.half.x + 1.5 && Math.abs(lz) < b.half.z + 1.5 && a.pos.y < top) {
          const s = still.get(a) || { x: a.pos.x, z: a.pos.z, t: 0 };
          if (Math.hypot(a.pos.x - s.x, a.pos.z - s.z) < 0.3) s.t += 0.25; else { s.x = a.pos.x; s.z = a.pos.z; s.t = 0; }
          still.set(a, s);
          if (s.t > worstStuck) worstStuck = s.t;
          if (s.t === 3) stuckAt.push([a.name, p.id, Math.round(a.pos.x * 10) / 10, Math.round(a.pos.z * 10) / 10, Math.round(t)]);
        } else if (a.bot) still.delete(a);
      }
    }
  }
  un.forEach((f) => f && f());
  R(`hedges grow in a ${m.mode} match (both teams)`, grownBy[0] > 0 && grownBy[1] > 0, { grownBy, maxStandingAtOnce: maxUp, stats: P.stats, secs: SECS });
  R('bots climb hedges (seconds on a hedge top, of which on their own team\'s)', topS[0] + topS[1] > 0, { onTop: topS, onOwn: topOwn });
  R('no bot stuck beside a hedge for more than 3 s (no progress within 1.5 m of it)', worstStuck <= 3, { worstStuck_s: worstStuck, episodes: stuckAt.slice(0, 8) });
  return out;
})()
