// An all-bot match on Highmark Foundry stepped at 60 Hz in sim time, reporting what the lava did to the bots (the
// lava engine's targets, ENGINE.md §6 step 8 / DESIGN §3.7): lava splats per team and where (and whether the rise had
// been announced), falls into the sea (must be none), stuck time and episodes (match.cjs's rule) with those at the
// Pumice Races and the Organ Pipes picked out, Slump crossings (the shelf or a Race), lookout time on the Organs, turf.
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-match.js PAGE_ARGS='mode=turf;secs=180' WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS 'mode=zones' plays 5:00 (+ overtime, capped at 6:30)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const opt = Object.fromEntries(String(window.__pageArgs || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MODE = opt.mode || 'turf', SECS = +(opt.secs || (MODE === 'zones' ? 300 : 180));
  const { on } = await import('./src/core/ctx.js');
  const C = await import('./src/game/lavaCore.js');
  const dbg = g.debug;
  if (MODE !== 'turf' || SECS !== 180) {
    await g.api.startMatch({ mapId: 'caldera', mode: MODE, duration: MODE === 'zones' ? 300 : SECS });
    for (let i = 0; i < 400 && g.match?.state !== 'playing'; i++) await new Promise((r) => setTimeout(r, 100));
  }
  dbg.freeze();
  const m = g.match, L = m.lava, W = __G.lavaWorld, nav = __G.nav, M = W.navMeta;
  if (!L) { R('the lava module runs', false); return out; }
  const r1 = (v) => Math.round(v * 10) / 10;
  const deaths = [], water = [], byCause = {}, trails = new Map();
  const r2 = (v) => Math.round(v * 100) / 100;
  const offs = [on('splatted', (e) => {
    const v = e.victim, c = String(e.cause || '?'); byCause[c] = (byCause[c] || 0) + 1;
    if (!v) return;
    const st = L.st, row = { t: r1(L.clock.t), team: v.team, name: v.name, at: [r1(v.pos.x), r1(v.pos.y), r1(v.pos.z)], phase: st.phase, warned: st.phase !== 'low' || st.warn, by: !!e.attacker, node: (() => { const s = nav.nearest(v.pos, 1.5, true); return s >= 0 ? ['dry', 'ledge', 'rider'][M.kind[s]] : '?'; })() };
    // (fix round 2: every lava death comes with the bot's trail, its last 1.5 s at 20 Hz — t, x, y, z, grounded, |v|, move,
    // J S F, mode, footing, escaping, next node)
    if (c === 'lava' && v.bot) row.trail = (trails.get(v) || []).slice();
    if (c === 'lava') deaths.push(row); else if (c === 'water') water.push(row);
  })];
  // the Slump bays (a bot that enters one and leaves it ≥ 8 m from where it came in crossed it: shelf or Race), the
  // Race stones and the Organ clusters (stuck episodes near them)
  const bays = W.polys.filter((P) => C.pointInPoly(P, -25.2, -8.19) || C.pointInPoly(P, 25.2, 8.19)).filter((P) => P !== W.polys[0]);
  const inPoly = C.pointInPoly, inBay = (x, z) => bays.findIndex((P) => inPoly(P, x, z));
  const near = (x, z, list, d) => list.some((r) => Math.hypot(r.x - x, r.z - z) < d + (r.r || 1.5));
  const stones = W.riders.filter((r) => r.sink), organs = W.riders.filter((r) => !r.sink);
  const hist = new Map(), open = new Map(), eps = [], bayIn = new Map();
  let samples = 0, stuckS = 0, crossings = 0, simT = 0;
  const t0 = performance.now(), end = MODE === 'zones' ? 390 : SECS + 0.5;
  for (let chunk = 0; simT < end && (m.state === 'playing' || simT < 2); chunk++) {
    for (let k = 0; k < 15; k++) {
      dbg.step(1000 / 60); simT += 1 / 60;
      if (k % 3 === 0) for (const a of m.actors) {
        if (!a.bot || !a.alive) continue;
        const T = trails.get(a) || []; trails.set(a, T);
        const b = a.bot, it = a.intent, nx = b.path && b.pi < b.path.length ? nav.nodes[b.path[b.pi]] : null, f = a._lavaFoot?.f;
        T.push([r2(L.clock.t), r2(a.pos.x), r2(a.pos.y), r2(a.pos.z), a.grounded ? 'g' : 'a', r2(Math.hypot(a.vel.x, a.vel.z)), r2(it.move.x), r2(it.move.z), (it.jump ? 'J' : '') + (it.squid ? 'S' : '') + (it.fire ? 'F' : ''), b.mode, f ? f.kind : '-', b._lavaEsc ? 'E' : '', nx ? [r2(nx.x), r2(nx.y), r2(nx.z)] : null]);
        if (T.length > 30) T.shift();
      }
    }
    for (const a of m.actors) {
      if (!a.bot) continue;
      const h = hist.get(a) || []; hist.set(a, h);
      h.push({ t: simT, x: a.pos.x, z: a.pos.z });
      while (h.length && simT - h[0].t > 3) h.shift();
      const holding = !!((a.bot.zHoldUntil > a.bot.t && (!a.bot.path || a.bot.pi >= a.bot.path.length)) || a.bot.perchUntil > a.bot.t);
      const wants = a.alive && !a.superJumpState && !(a.weaponRunner && a.weaponRunner.charging) && !holding && !(a.specialActive && a.specialActive.pin);
      samples++;
      const span = h.length > 1 ? Math.max(...h.map((p) => Math.hypot(p.x - a.pos.x, p.z - a.pos.z))) : 99;
      if (wants && h.length >= 11 && span < 1.0) {
        stuckS += 0.25;
        if (!open.has(a)) { const ep = { t: r1(simT), name: a.name, pos: [r1(a.pos.x), +a.pos.y.toFixed(2), r1(a.pos.z)], mode: a.bot.mode, dur: 0.25, stone: near(a.pos.x, a.pos.z, stones, 2), organ: near(a.pos.x, a.pos.z, organs, 2), crest: Math.hypot(Math.abs(a.pos.x) - 23.5, Math.abs(a.pos.z) - 38.7) < 2 && a.pos.x * a.pos.z > 0, lava: L.st.phase }; open.set(a, ep); eps.push(ep); }
        else {
          const ep = open.get(a); ep.dur += 0.25;
          // (fix round 4: an episode that reaches 4 s records what the bot is doing then — its mode, tank, the floor's ink
          // under it and its paintability, its route, its aim — to find what holds it)
          if (ep.dur === 4) { const b = a.bot, gb = a.ground?.block >= 0 ? __G.level.blocks[a.ground.block] : null, gn = b.goal >= 0 ? nav.nodes[b.goal] : null, nx = b.path && b.pi < b.path.length ? nav.nodes[b.path[b.pi]] : null;
            ep.why = { mode: b.mode, ink: r2(a.ink), groundTeam: a.groundTeam, seen: b.groundSeen, floor: gb ? (gb.tag || '#' + gb.id) + (gb.paint === false ? '/noPaint' : '') + (gb.roof ? '/roof' : '') + (gb.rail ? '/rail' : '') : null, goal: gn ? [r1(gn.x), r1(gn.y), r1(gn.z)] : null, next: nx ? [r1(nx.x), r1(nx.y), r1(nx.z)] : null, left: b.path ? b.path.length - b.pi : 0, noProg: r2(b.noProg), inkStep: b.inkStepOk ? [r1(b.inkStepP.x), r1(b.inkStepP.z)] : null, fire: !!a.intent.fire, squid: !!a.intent.squid, pitch: r2(b.aimPitch), move: [r2(a.intent.move.x), r2(a.intent.move.z)], target: b.target?.name || null, look: !!b._look, esc: !!b._lavaEsc, trail: (trails.get(a) || []).slice(-8) }; }
        }
      } else open.delete(a);
      // Slump crossings
      const b = a.alive ? inBay(a.pos.x, a.pos.z) : -1, was = bayIn.get(a);
      if (b >= 0 && !was) bayIn.set(a, { b, x: a.pos.x, z: a.pos.z });
      else if (b < 0 && was) { if (a.alive && Math.hypot(a.pos.x - was.x, a.pos.z - was.z) >= 8) crossings++; bayIn.delete(a); }
    }
    if (chunk % 40 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  offs.forEach((f) => f());
  const S = L.state().stats;
  const cov = __G.paint.coverage().map((c) => +(c * 100).toFixed(1));
  const nBots = m.actors.filter((a) => a.bot).length;
  const lavaByTeam = [0, 1].map((t) => deaths.filter((d) => d.team === t).length);
  const warnedNoAttacker = deaths.filter((d) => d.warned && !d.by);
  const longEps = eps.filter((e) => e.dur >= 2).sort((x, y) => y.dur - x.dur);
  R(`${MODE} ${SECS}: lava splats per team (and where), sea splats`, true, { lavaByTeam, deaths, water: water.length, byCause, perBotPer3min: +(deaths.length / nBots / ((simT) / 180)).toFixed(3) });
  // (fix round 2: no 'dry node' exemption — every unforced lava death in an announced surge counts)
  R('no bot drowned by a rise it was warned of (any lava death in an announced surge with nobody credited)', warnedNoAttacker.length === 0, { n: warnedNoAttacker.length, list: warnedNoAttacker });
  R('no falls into the sea', water.length === 0, water);
  R('stuck: % of bot time; no episode ≥ 10 s; none at the Pumice Races', eps.every((e) => e.dur < 10) && !eps.some((e) => e.stone && e.dur >= 2),
    { stuckPct: +(100 * stuckS / Math.max(1, samples * 0.25)).toFixed(2), longest: longEps.slice(0, 6), atStones: eps.filter((e) => e.stone), atOrgans: eps.filter((e) => e.organ), atCrestStair: eps.filter((e) => e.crest) });
  // (Slump crossings, DESIGN §3.7's ≥ 4 a match: informational — the lead's decision, fix round 3: the Mac mini's balance pass
  // tracks them and tunes the schedule data, not the geometry)
  R('the Slumps crossed (the shelf or a Race) and the Organ lookouts used (informational: the balance pass)', true, { crossings, lookout: Object.fromEntries(Object.entries(S.lookout).map(([k, v]) => [k, r1(v)])), burned: S.burned, devices: S.devices, redirects: S.redirects || 0, stoneSteps: S.stoneSteps || 0 });
  // (fix round 1: the DESIGN §3.7 target — a lookout used by a long-range bot at least once a match; seconds on each
  // team's lookout at HIGH, the long-range kits' share, the claims made and the seconds the claimants held the top)
  const LT = S.lookTeam || [0, 0], LL = S.lookLong || [0, 0];
  // (fix round 3: the check tests what its name says — ≥ 1 s on a lookout at HIGH by a long-range kit, lookLong; it read
  // lookTeam, any kit, and passed a match with lookLong [0, 0])
  R('an Organ lookout (organL / organL~) used at HIGH in this match, by a long-range kit (the claim)', LL[0] + LL[1] >= 1, { lookTeam: LT.map(r1), lookLong: LL.map(r1), claims: S.lookClaims || 0, held: r1(S.lookHold || 0), organL: r1(S.lookout.organL || 0), log: S.lookLog || [] });
  R('the match', true, { mode: MODE, simT: r1(simT), wallS: r1((performance.now() - t0) / 1000), state: m.state, cov, winner: m.result?.winner ?? null, phaseAtEnd: L.st.phase, yAtEnd: L.y });
  return out;
})();
