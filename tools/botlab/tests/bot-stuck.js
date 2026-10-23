// [b5-beta1] The stuck bots of the beta's issue log, each a scene with a real bot (its brain on), on the stage it was
// found on. MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js tools/botlab/run.sh tools/botlab/page.cjs
//   (PAGE_ARGS='only=step,…' for some of them)
// step   Gulper Aquarium's Feeding Steps (1.2 m below the Feeding Deck): a route planned mid-hop (a goal re-picked at the
//        top of the hop, as an interceptor's is every second) starts from the floor under the bot — the step — not from
//        the deck it is reaching for (it began on the deck, with a walk edge on from there and no hop asked for: the bot
//        pressed into the step's face, 11.75 s in one Bazookarp match); and a bot at the step's face whose goal over the
//        deck is re-picked every 0.35 s stands on the deck within 2.5 s, from every spot along both steps.
(async () => {
  const g = window.__inkwave, G = window.__G, m = g.match, L = G.level, N = G.nav, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const THREE = await import('three'), V3 = THREE.Vector3, r2 = (v) => Math.round(v * 100) / 100;
  const { PLAYER } = await import('./src/config.js');
  const only = (/only=([\w,]+)/.exec(String(window.__pageArgs || '')) || [])[1]?.split(',') || null, want = (k) => !only || only.includes(k);
  g.debug.freeze();
  const idle = function () { const it = this.a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.jump = it.special = false; };
  const bot = m.actors.find((a) => a.bot && a !== m.local);
  const park = () => { for (const a of m.actors) { if (a === bot) continue; if (a.bot) a.bot.update = idle; const pd = L.spawnPads[a.team]; a.pos.set(pd.x + (a.slot || 0), pd.y + 0.05, pd.z); a.vel.set(0, 0, 0); } };
  const b = bot.bot;
  const fresh = (x, y, z) => {
    G.projectiles.clear(); G.subs.clear(); G.specials.clear();
    if (!bot.alive) bot.respawn();
    bot.hp = PLAYER.hp; bot.invuln = 0; bot.ink = PLAYER.inkMax; bot.form = 'kid'; bot.climbing = false; bot.superJumpState = null; bot.pipeCd = 99;   // (no pipe errand takes it elsewhere)
    delete b.update; delete b._pickPaintGoal;
    b.reset(); b.setDifficulty('normal');
    bot.pos.set(x, y, z); bot.vel.set(0, 0, 0); bot.grounded = false;
  };
  const nodeOf = (id) => { const n = N.nodes[id]; return n ? [n.x, r2(n.y), n.z] : null; };
  park();

  if (want('step')) {
    // 1. a route planned at the top of a hop from the step: its first node is the step's (y 1.2), and the next edge a jump
    const rows = [];
    for (const sz of [1, -1]) for (const x of [-1.8, -1.5, -0.5, 0.5, 1.5, 1.8]) {
      fresh(x, 1.95, 7.9 * sz); bot.vel.set(0, 1.0, 0);   // (rising, 0.75 m up a hop from the step's top)
      b.mode = 'paint';
      b._pathTo(new V3(x * 0.5, 2.4, -2 * sz), 0.8);
      const p = b.path, s = p && p[0];
      rows.push({ at: [x, 7.9 * sz], start: nodeOf(s), next: p && p[1] !== undefined ? nodeOf(p[1]) : null, edge: p && p.length > 1 ? N.edgeType(p[0], p[1]) : null });
    }
    const bad = rows.filter((r) => !r.start || Math.abs(r.start[1] - 1.2) > 0.1);
    R('step: a route planned mid-hop starts from the floor under the bot (the Feeding Step, y 1.2), not from the deck it is reaching for', bad.length === 0, { bad, rows: rows.slice(0, 4) });
    // 2. end to end: at the step's face, the goal over the deck re-picked every 0.35 s (as an interceptor's)
    const runs = [];
    for (const sz of [1, -1]) for (const x of [-1.8, -1.2, -0.4, 0.4, 1.2, 1.8]) {
      fresh(x, 1.25, 7.9 * sz);
      let k = 0;
      b._pickPaintGoal = function () { this.goalTimer = 0.35; k++; this._pathTo(new V3(x * 0.5 + (k % 3) * 0.4 - 0.4, 2.4, -3 * sz), 0.8); };
      b.mode = 'paint'; b.goalTimer = 0;
      let up = null;
      for (let f = 0; f < 5 * 60 && up === null; f++) { g.debug.step(1000 / 60); if (bot.alive && bot.grounded && bot.pos.y > 2.3 && Math.abs(bot.pos.z) < 7.6) up = +(f / 60).toFixed(2); }
      runs.push({ at: [x, 7.9 * sz], up, end: [r2(bot.pos.x), r2(bot.pos.y), r2(bot.pos.z)] });
    }
    const slow = runs.filter((r) => r.up === null || r.up > 1.2);
    R('step: at the step\'s face, its goal over the deck re-picked every 0.35 s, a bot stands on the deck within 1.2 s (12 spots, both steps; mid-hop routes from the deck took up to 1.9 s)', slow.length === 0, { slow, worst: Math.max(...runs.map((r) => r.up ?? 99)), runs: runs.map((r) => r.up) });
  }
  g.debug.unfreeze();
  return out;
})()
