// The lava's bots, repeated (ENGINE.md §6 step 8; fix round 2: the single-run F7 / F8 in lava.js were flaky and skipped
// deaths "on dry ground"). Every scenario runs `trials` times (default 20) on both halves at once: each team's crew on
// its own half (30–50 m apart: the escape is measured, not a fight at the lava's edge), brains on, invulnerable to
// weapons (the lava ignores that); everyone else parked on their pads with brains off and the local player high over
// the far end, so nobody is knocked in. EVERY lava death of a crew bot fails the scenario, wherever it happens; each one
// comes with its frame trail (the last 1.6 s).
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js PAGE_ARGS='only=ledges;trials=20' WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
// Scenarios (PAGE_ARGS only=…, comma-separated; default all):
//   ledges — 3 bots per team on the drowning ledges (the Slump shelf, the Casting Floor, the Spillway ford, the bays) at
//            the rise warning (24.7 → 44.7: the ledges turn deadly at 38.8)
//   stones — 3 bots per team on the Pumice stones at HIGH (58 → 79: the fall warning at 60, the stones deadly at 76.2),
//            rotating through all seven stones of each half (Race 1–5 and the second Race's 6–7)
//   edges  — 3 bots per team parked on the dry 1.2 m edges over the Casting Floors, the Spillways, the Slump heads (the
//            north head's tip by the Horn Step, the lake corner) through a rise (24 → 46) and a fall (60 → 82)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const opt = Object.fromEntries(String(window.__pageArgs || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const ONLY = (opt.only || 'ledges,stones,edges').split(','), TRIALS = +(opt.trials || 20), HZ = +(opt.hz || 30);
  const THREE = await import('three');
  const { on } = await import('./src/core/ctx.js');
  const W = __G.lavaWorld, Lv = g.match?.lava, dbg = g.debug, nav = __G.nav, M = W?.navMeta, lvl = __G.level;
  R('the lava module runs', !!W && !!Lv);
  if (!W || !Lv) return out;
  dbg.freeze();
  const idle = new Map();
  const freezeBots = () => { for (const a of g.match.actors) if (a.bot) { if (!idle.has(a)) idle.set(a, a.bot.update); a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; } };
  freezeBots();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const me = g.match.local, bots = g.match.actors.filter((a) => a.bot && a !== me);
  const revive = (a) => { if (!a.alive) a.respawn(); a.superJumpState = null; a.vel.set(0, 0, 0); a.intent.move.set(0, 0, 0); a.intent.squid = false; a.intent.jump = false; a.intent.fire = false; a.lastDamage = 99; a.lastAttacker = null; };
  const put = (a, p) => { revive(a); a.pos.copy(p); a.vel.set(0, 0, 0); a.grounded = false; a._lavaFoot = null; };
  const rid = (id) => Lv.riders.find((x) => x.r.id === id);
  const twin = (p) => V(-p.x, p.y, -p.z);
  const T0 = bots.filter((b) => b.team === 0), T1 = bots.filter((b) => b.team === 1);
  const bTeam = [T0, T1];
  // (every lava death of a crew bot, with its trail: t, x, y, z, grounded, |v|, move x / z, J S F, mode, foot kind, E, next node)
  const runTrial = (crewSpots, t0, secs) => {
    Lv.debugT(t0); for (let i = 0; i < 2; i++) dbg.step(1000 / 60);
    freezeBots();
    for (const b of bots) { const pad = lvl.spawnPads[b.team]; put(b, V(pad.x + (b.bot ? 0 : 0), pad.y + 0.1, pad.z)); b.invuln = 1e6; }
    { const pad = lvl.spawnPads[me.team]; put(me, V(pad.x, pad.y + 0.1, pad.z)); me.invuln = 1e6; }   // (on its pad: a bot super-jumping to a teammate hovering over the chute fell in)
    const crew = crewSpots.map(([b]) => b);
    crewSpots.forEach(([b, p]) => { put(b, p); b.bot.update = idle.get(b); b.bot.path = null; b.bot.repath = 0; b.bot.goalTimer = 0; b.bot._lavaEsc = false; b.bot._look = null; b.invuln = 1e6; });
    Lv._lp = null;
    const deaths = [], trail = crew.map(() => []), coarse = crew.map(() => []), escAt = crew.map(() => -9);
    // (fix round 3, the lead's gate: a death during an escape — escaping within its last 1 s — is unfair and fails at once;
    // the others are fight deaths, ≤ 1 per 360 bot-trials over the whole run)
    const off = on('splatted', (e) => { const k = crew.indexOf(e.victim); if (k >= 0) deaths.push({ who: e.victim.name, kit: e.victim.weapon?.kind || e.victim.weapon?.id, cause: e.cause, by: !!e.attacker, t: r2(Lv.clock.t), esc: Lv.clock.t - escAt[k] < 1.0, mode: e.victim.bot?.mode, at: [r2(e.victim.pos.x), r2(e.victim.pos.y), r2(e.victim.pos.z)], start: crewSpots[k][1].toArray().map(r2), coarse: coarse[k].slice(), trail: trail[k].slice(-Math.round(1.6 * HZ)) }); });
    const n = Math.round(secs * HZ);
    for (let i = 0; i < n; i++) {
      dbg.step(1000 / HZ);
      crew.forEach((b, k) => {
        if (!b.alive) return;
        const it = b.intent, bb = b.bot, nx = bb.path && bb.pi < bb.path.length ? nav.nodes[bb.path[bb.pi]] : null, f = b._lavaFoot?.f;
        let near = 9; for (const o of g.match.actors) if (o !== b && o.alive) near = Math.min(near, Math.hypot(o.pos.x - b.pos.x, o.pos.z - b.pos.z) + (Math.abs(o.pos.y - b.pos.y) > 1.2 ? 9 : 0));
        if (bb._lavaEsc) escAt[k] = Lv.clock.t;
        const wr = b.weaponRunner, gb = b.ground?.block >= 0 ? lvl.blocks[b.ground.block] : null;
        let dev = ''; for (const d of __G.subs?.items || []) if (d.pos && d.state !== 'dead' && Math.hypot(d.pos.x - b.pos.x, d.pos.z - b.pos.z) < 1.5) dev += d.kind + ':' + d.state + ' ';
        const T = trail[k]; T.push([r2(Lv.clock.t), r2(b.pos.x), r2(b.pos.y), r2(b.pos.z), b.grounded ? 'g' : 'a', r2(Math.hypot(b.vel.x, b.vel.z)), r2(it.move.x), r2(it.move.z), (it.jump ? 'J' : '') + (it.squid ? 'S' : '') + (it.fire ? 'F' : ''), bb.mode, f ? f.kind : '-', bb._lavaEsc ? 'E' : '', nx ? [r2(nx.x), r2(nx.y), r2(nx.z)] : null, r2(near),
          [r2(b.vel.x), r2(b.vel.z)], bb._mvStage || null, gb ? (gb.tag || '#' + gb.id) + (gb.roof ? '/roof' : '') + (gb.rail ? '/rail' : '') + (gb.dynamic ? '/dyn' : '') : null, (b.sub?.kind || '') + (wr?.mainLocked ? '/L' : '') + (wr?.glide ? '/G' : '') + (wr?.aimingSub ? '/A' : '') + (b.specialActive ? '/sp:' + b.specialActive.kind : '') + (bb.guardOff ? '/gOff' : ''), dev || null]);
        bb._mvStage = null;
        if (T.length > 2 * HZ) T.shift();
        if (i % Math.round(HZ / 2) === 0) coarse[k].push([r2(Lv.clock.t), r2(b.pos.x), r2(b.pos.y), r2(b.pos.z), bb.mode, f ? f.kind : '-', bb._lavaEsc ? 'E' : '', bb.goal >= 0 && nav.nodes[bb.goal] ? [r2(nav.nodes[bb.goal].x), r2(nav.nodes[bb.goal].y), r2(nav.nodes[bb.goal].z)] : null]);
      });
    }
    off();
    freezeBots();
    return { deaths: deaths.filter((d) => d.cause === 'lava'), other: deaths.filter((d) => d.cause !== 'lava').map((d) => [d.who, d.cause, d.t]), alive: crew.filter((b) => b.alive).length, esc: crew.map((b) => b.bot.escN || 0) };
  };
  const jit = (p, r) => V(p.x + (Math.random() - 0.5) * r, p.y, p.z + (Math.random() - 0.5) * r);
  // (fix round 3: the trail also keeps the move the stage's botAct left, the velocity, the floor's tag and the bot's sub
  // state, and any device within 1.5 m — what overrode an escape's move, what pushed a body over a lip)
  { const orig = Lv.botAct; Lv.botAct = function (b, dt, it, move, vis) { const r = orig.call(this, b, dt, it, move, vis); b._mvStage = [Math.round(move.x * 100) / 100, Math.round(move.z * 100) / 100]; return r; }; }
  const gate = { botTrials: 0, esc: 0, fight: 0, list: [] };
  const report = (name, res, n) => {
    const all = res.flatMap((r, i) => r.deaths.map((d) => ({ trial: i, ...d })));
    const esc = all.filter((d) => d.esc);
    gate.botTrials += res.length * n; gate.esc += esc.length; gate.fight += all.length - esc.length;
    gate.list.push(...all.map((d) => [name.split(' ')[0], d.trial, d.who, d.kit, d.mode, d.esc ? 'escape' : 'fight', d.t, d.at]));
    R(`${name}: ${res.length} trials × ${n} bots — no crew bot dies in the lava during an escape (every death counted; fight deaths: the gate below)`, esc.length === 0,
      { lavaDeaths: all.length, escapeDeaths: esc.length, fightDeaths: all.length - esc.length, botTrials: res.length * n, alive: res.map((r) => r.alive), other: res.flatMap((r) => r.other), escapes: res.reduce((s, r) => s + r.esc.reduce((a, b) => a + b, 0), 0), deaths: all.slice(0, 4) });
  };
  const t0 = performance.now(), times = {};

  // ---------------------------------------------------------------- the drowning ledges at the rise warning
  if (ONLY.includes('ledges')) {
    // Alpha's half's ledge spots (Bravo's are their 180° twins): the Slump shelf (its length), the Casting Floor, the
    // Spillway ford, the bay ledges — each a floor node the lava drowns
    const cand = nav.nodes.filter((n) => nav.valid[n.id] && M.kind[n.id] === 1 && n.y < 0.3 && n.x + n.z * 0.0 < 1e9 && (n.z < 0 || (n.x < -14 && n.z < 4)));
    const A = cand.filter((n) => Math.hypot(n.x, n.z) > 6).sort(() => Math.random() - 0.5);
    const pick = (k) => A[k % A.length];
    const res = [];
    for (let tr = 0; tr < TRIALS; tr++) {
      const spots = [];
      for (let i = 0; i < 3; i++) { const n = pick(tr * 3 + i); spots.push([T0[(tr + i) % T0.length], V(n.x, n.y + 0.02, n.z)]); spots.push([T1[(tr + i) % T1.length], twin(V(pick(tr * 3 + i + 1).x, pick(tr * 3 + i + 1).y + 0.02, pick(tr * 3 + i + 1).z))]); }
      // (no bot twice in one trial)
      const seen = new Set(), uniq = spots.filter(([b]) => (seen.has(b) ? false : (seen.add(b), true)));
      res.push(runTrial(uniq.map(([b, p]) => [b, jit(p, 0.6)]), 24.7, 20));
    }
    report('ledges (the rise warning: the Slump shelf, the Casting Floor, the ford, the bays)', res, 6);
    times.ledges = r2((performance.now() - t0) / 1000);
  }

  // ---------------------------------------------------------------- the stones at the fall warning
  if (ONLY.includes('stones')) {
    const t1 = performance.now();
    const sA = W.riders.filter((r) => r.sink && !r.id.endsWith('~')), sB = W.riders.filter((r) => r.sink && r.id.endsWith('~'));
    const onStone = (r) => { const ri = W.riders.indexOf(r), ns = nav.nodes.filter((q) => M.rider[q.id] === ri && M.pose[q.id] === 1); const n = ns[Math.floor(Math.random() * ns.length)]; return V(n.x, rid(r.id).top + 0.02, n.z); };
    const res = [];
    for (let tr = 0; tr < TRIALS; tr++) {
      const spots = [];
      for (let i = 0; i < 3; i++) { spots.push([T0[(tr + i) % T0.length], sA[(tr * 3 + i) % sA.length]]); spots.push([T1[(tr + i) % T1.length], sB[(tr * 3 + i + 2) % sB.length]]); }
      const seen = new Set(), uniq = spots.filter(([b]) => (seen.has(b) ? false : (seen.add(b), true)));
      // (placed after the clock is set: the stones are up at 58)
      Lv.debugT(58); dbg.step(16);
      res.push(runTrial(uniq.map(([b, r]) => [b, onStone(r)]), 58, 21));
    }
    report('stones (the fall warning: every stone of both Races, race6 / race7 included)', res, 6);
    times.stones = r2((performance.now() - t1) / 1000);
  }

  // ---------------------------------------------------------------- dry 1.2 m edges over the ledges, a rise and a fall
  if (ONLY.includes('edges')) {
    const t2 = performance.now();
    // Alpha's half: dry nodes on the 1.1–1.5 m tier with a drop to a drowning floor or to open lava beside them (the
    // causeway's sides and the island's edge over the Casting Floor, the Lakefront and the Horn Step over the Spillway,
    // the Slump heads), ten spread by farthest-point sampling — plus the two walk-offs the review saw: the Horn Step's
    // tip by the north head (−19.4, 8.4…9.9) and the north head's lake corner (−23.8, −1.6)
    const open = (x, z, y) => W.inRegion(x, z) && lvl.groundHeight(x, z, y + 0.3) < y - 0.6;
    const half = (n) => n.z < -1 || (n.x < -14 && n.z < 11);
    const cands = nav.nodes.filter((n) => nav.valid[n.id] && M.kind[n.id] === 0 && n.y > 1.0 && n.y < 1.6 && half(n) &&
      (n.nb.some((e) => M.kind[e.to] === 1) || [0, 1, 2, 3, 4, 5, 6, 7].some((k) => open(n.x + Math.cos(k * Math.PI / 4) * 1.1, n.z + Math.sin(k * Math.PI / 4) * 1.1, n.y))));
    const pickN = [];
    const must = [V(-19.85, 1.2, 9.6), V(-25.3, 1.3, -1.9)].map((p) => { let best = null, bd = 9; for (const n of cands) { const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; best = n; } } return best; }).filter(Boolean);
    pickN.push(...must);
    while (pickN.length < 12 && cands.length) { let best = null, bd = -1; for (const n of cands) { const d = Math.min(...pickN.map((q) => Math.hypot(q.x - n.x, q.z - n.z)), 99); if (d > bd) { bd = d; best = n; } } pickN.push(best); }
    const spotsA = pickN.map((n) => V(n.x, n.y + 0.02, n.z));
    R('edges: the spots stand on dry floor (≥ HIGH + kill), both halves', spotsA.every((p) => lvl.groundHeight(p.x, p.z, p.y + 0.1) >= 0.95 && lvl.groundHeight(-p.x, -p.z, p.y + 0.1) >= 0.95), spotsA.map((p) => [r2(p.x), r2(p.y), r2(p.z), r2(lvl.groundHeight(-p.x, -p.z, p.y + 0.1))]));
    const res = [];
    for (let tr = 0; tr < TRIALS; tr++) {
      const spots = [];
      for (let i = 0; i < 3; i++) { spots.push([T0[(tr + i) % T0.length], spotsA[(tr * 3 + i) % spotsA.length]]); spots.push([T1[(tr + i) % T1.length], twin(spotsA[(tr * 3 + i + 5) % spotsA.length])]); }
      const seen = new Set(), uniq = spots.filter(([b]) => (seen.has(b) ? false : (seen.add(b), true)));
      const a = runTrial(uniq.map(([b, p]) => [b, jit(p, 0.3)]), 24, 22), b2 = runTrial(uniq.map(([b, p]) => [b, jit(p, 0.3)]), 60, 22);
      res.push({ deaths: [...a.deaths, ...b2.deaths], other: [...a.other, ...b2.other], alive: Math.min(a.alive, b2.alive), esc: [...a.esc, ...b2.esc] });
    }
    report('edges (dry 1.2 m edges over the Casting Floor, the Spillway, the heads: a rise, then a fall)', res, 6);
    times.edges = r2((performance.now() - t2) / 1000);
  }
  // (the lead's gate, fix round 3: 0 deaths during an escape and at most 1 fight death per 360 bot-trials in total)
  if (gate.botTrials) R(`the gate: 0 escape deaths, ≤ 1 fight death per 360 bot-trials (${gate.botTrials} here)`, gate.esc === 0 && gate.fight <= Math.max(1, Math.floor(gate.botTrials / 360)), gate);
  R('timing (wall s per scenario)', true, { times, trials: TRIALS, hz: HZ, total: r2((performance.now() - t0) / 1000) });
  return out;
})();
