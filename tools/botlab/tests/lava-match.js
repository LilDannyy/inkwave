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
  const deaths = [], water = [], byCause = {};
  const offs = [on('splatted', (e) => {
    const v = e.victim, c = String(e.cause || '?'); byCause[c] = (byCause[c] || 0) + 1;
    if (!v) return;
    const st = L.st, row = { t: r1(L.clock.t), team: v.team, name: v.name, at: [r1(v.pos.x), r1(v.pos.y), r1(v.pos.z)], phase: st.phase, warned: st.phase !== 'low' || st.warn, by: !!e.attacker, node: (() => { const s = nav.nearest(v.pos, 1.5, true); return s >= 0 ? ['dry', 'ledge', 'rider'][M.kind[s]] : '?'; })() };
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
    for (let k = 0; k < 15; k++) { dbg.step(1000 / 60); simT += 1 / 60; }
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
        else open.get(a).dur += 0.25;
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
  R('no bot drowned by a rise it was warned of (a lava death on drowning ground in an announced surge, not knocked in)', warnedNoAttacker.filter((d) => d.node !== 'dry' || d.at[1] < 0.5).length === 0, { n: warnedNoAttacker.length, list: warnedNoAttacker });
  R('no falls into the sea', water.length === 0, water);
  R('stuck: % of bot time; no episode ≥ 10 s; none at the Pumice Races', eps.every((e) => e.dur < 10) && !eps.some((e) => e.stone && e.dur >= 2),
    { stuckPct: +(100 * stuckS / Math.max(1, samples * 0.25)).toFixed(2), longest: longEps.slice(0, 6), atStones: eps.filter((e) => e.stone), atOrgans: eps.filter((e) => e.organ), atCrestStair: eps.filter((e) => e.crest) });
  R('the Slumps crossed (the shelf or a Race) and the Organ lookouts used', true, { crossings, lookout: Object.fromEntries(Object.entries(S.lookout).map(([k, v]) => [k, r1(v)])), burned: S.burned, devices: S.devices, redirects: S.redirects || 0 });
  // (fix round 1: the DESIGN §3.7 target — a lookout used by a long-range bot at least once a match; seconds on each
  // team's lookout at HIGH, the long-range kits' share, the claims made and the seconds the claimants held the top)
  const LT = S.lookTeam || [0, 0], LL = S.lookLong || [0, 0];
  R('an Organ lookout (organL / organL~) used at HIGH in this match, by a long-range kit (the claim)', LT[0] + LT[1] >= 1, { lookTeam: LT.map(r1), lookLong: LL.map(r1), claims: S.lookClaims || 0, held: r1(S.lookHold || 0), organL: r1(S.lookout.organL || 0) });
  R('the match', true, { mode: MODE, simT: r1(simT), wallS: r1((performance.now() - t0) / 1000), state: m.state, cov, winner: m.result?.winner ?? null, phaseAtEnd: L.st.phase, yAtEnd: L.y });
  return out;
})();
