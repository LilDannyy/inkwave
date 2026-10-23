// [b5-beta1] The stuck bots of the beta's issue log, each a scene with a real bot (its brain on), on the stage it was
// found on. MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js tools/botlab/run.sh tools/botlab/page.cjs
//   (PAGE_ARGS='only=step,…' for some of them)
// step   Gulper Aquarium's Feeding Steps (1.2 m below the Feeding Deck): a route planned mid-hop (a goal re-picked at the
//        top of the hop, as an interceptor's is every second) starts from the floor under the bot — the step — not from
//        the deck it is reaching for (it began on the deck, with a walk edge on from there and no hop asked for: the bot
//        pressed into the step's face, 11.75 s in one Bazookarp match); and a bot at the step's face whose goal over the
//        deck is re-picked every 0.35 s stands on the deck within 1.2 s, from every spot along both steps.
// bobber a Chain Bobber bot run dry while laying a chain on bare ground lets the plan go and goes to refill, instead of
//        sitting a squid on bare ground refilling at 4.5 ink/s until its plan times out (11.5 s episodes on Bluestone);
//        and standing for its plan, its stand spot or its ambush it says it holds on purpose (perchUntil).
// refill a bot at its refill spot on bare ground, its tank too low for its weapon to shoot (a charger's draw held at
//        its cap, a roller's trigger held with nothing coming out), lets go and refills (40 % back within 6 s).
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
  if (want('bobber')) {
    // a Chain Bobber bot laying a chain runs dry on bare ground (its links were picked from where it stands, so the plan
    // holds it there): it must get its ink back — to its refill, a puddle painted and a dive — not sit a squid on bare
    // ground refilling at 4.5 ink/s until the plan times out (11.5 s episodes in a Bluestone Turf War of bobbers)
    const rows = [];
    const spots = [[0, 12.5], [-6, 13], [6, 13], [0, -12.5]].filter(([x, z]) => Math.abs(L.groundHeight(x, z, 3) - 0) < 0.05);
    for (const [x, z] of spots.slice(0, 3)) {
      G.paint.clear();
      fresh(x, 0.05, z);
      bot.setSub('bobber'); bot.setWeapon('shooter'); b.reset(); b.setDifficulty('normal');
      for (let f = 0; f < 6; f++) g.debug.step(1000 / 60);
      bot.ink = 5; b.mode = 'refill'; b.refillUntil = 0.9; b.path = null; b.repath = 0;
      b._bobPlan = { pts: [new V3(x + 3.4, 0, z), new V3(x, 0, z + 3.4), new V3(x - 3.4, 0, z)], i: 0, t0: G.time, m: G.match };
      const hist = []; let worst = 0, run = 0, ink3 = null, planAt1 = null;
      for (let f = 0; f < 10 * 60; f++) {
        g.debug.step(1000 / 60);
        if (f === 60) planAt1 = !!b._bobPlan;
        if (f === 3 * 60) ink3 = Math.round(bot.ink);
        if (f % 15 === 0) {
          hist.push({ x: bot.pos.x, z: bot.pos.z }); if (hist.length > 13) hist.shift();
          const span = Math.max(...hist.map((q) => Math.hypot(q.x - bot.pos.x, q.z - bot.pos.z)));
          if (hist.length >= 11 && span < 1 && bot.alive && !b.holdingOnPurpose()) { run += 0.25; worst = Math.max(worst, run); } else run = 0;
        }
      }
      rows.push({ at: [x, z], planAt1, ink3, ink10: Math.round(bot.ink), worst, mode: b.mode });
    }
    const bad = rows.filter((r) => r.planAt1 || r.worst > 3);
    R('bobber: a bot run dry mid-chain on bare ground lets its chain plan go to refill (within 1 s) and is never held there over 3 s (10 s watched)', rows.length >= 2 && bad.length === 0, { bad, rows });
    // …and with ink it stands to lay the links (its plan), which is on purpose: it says so (perchUntil — what the botlab's
    // stuck rule and the issue log read), as a Zone Control guard or a pod perch does
    const lay = [];
    for (const [x, z] of spots.slice(0, 2)) {
      G.paint.clear(); fresh(x, 0.05, z);
      bot.setSub('bobber'); bot.setWeapon('shooter'); b.reset(); b.setDifficulty('normal');
      for (let f = 0; f < 6; f++) g.debug.step(1000 / 60);
      bot.ink = 100; b.mode = 'paint';
      b._bobPlan = { pts: [new V3(x + 3.4, 0, z), new V3(x, 0, z + 3.4), new V3(x - 3.4, 0, z)], i: 0, t0: G.time, m: G.match };
      let held = 0, laying = 0;
      for (let f = 0; f < 90; f++) { g.debug.step(1000 / 60); if (b._bobPlan) { laying++; if (b.holdingOnPurpose()) held++; } }
      lay.push({ at: [x, z], laying, held });
    }
    R('bobber: laying its chain, the bot holds on purpose (every frame it stands for its plan)', lay.every((r) => r.laying > 10 && r.held >= r.laying - 2), lay);
  }
  if (want('refill')) {
    // a bot at its refill spot on bare ground with a few % of ink paints a puddle to swim in — unless its weapon can't
    // shoot on that: a charger drew its shot "while charging" and held the draw for good once it stood at what the tank
    // allows; a roller held its trigger with nothing coming out; a held trigger stops the kid's refill, so neither ever
    // refilled (the base: ink unchanged for 10 s). Each must have 40 of 100 back within 6 s, from 6 and from 10
    const rows = [];
    const here0 = N.nearest(new V3(0, 0.05, 12.5), 1.2, true), at = N.nodes[here0];
    for (const w of ['charger', 'roller', 'splatling', 'shooter']) for (const ink0 of [6, 10]) {
      G.paint.clear(); fresh(at.x, at.y + 0.05, at.z);
      bot.setWeapon(w); delete b._pickRefill; b.reset(); b.setDifficulty('normal');
      for (let f = 0; f < 6; f++) g.debug.step(1000 / 60);
      const here = N.nearest(bot.pos, 1.2, true);
      b._pickRefill = function () { this.path = [here]; this.pi = 1; this.goal = here; this.repath = 1; };
      bot.ink = ink0; b.mode = 'refill'; b.refillUntil = 0.9; b.path = [here]; b.pi = 1; b.goal = here; b.repath = 1;
      let t40 = null;
      for (let f = 0; f < 8 * 60 && t40 === null; f++) { g.debug.step(1000 / 60); if (bot.ink >= 40) t40 = +(f / 60).toFixed(1); }
      rows.push({ w, ink0, t40 });
      delete b._pickRefill;
    }
    const bad = rows.filter((r) => r.t40 === null || r.t40 > 6);
    R('refill: a charger, a roller, a splatling and a shooter at their refill spot on bare ground (6 % and 10 %) have 40 % back within 6 s', bad.length === 0, { bad, rows });
  }
  g.debug.unfreeze();
  return out;
})()
