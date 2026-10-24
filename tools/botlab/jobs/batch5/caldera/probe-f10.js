// fix round 9 scratch: lava.js F10 (the lookout claim) N times in a row, fresh from the pads each time, with what each
// claimant met: holds on off-limits tops (where), rescues (from / to), its log's end (stalled / busy / foot-timeout)
//   PAGE_ARGS n=8
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const W = __G.lavaWorld, Lv = g.match?.lava, dbg = g.debug; dbg.freeze();
  const PA = String(window.__pageArgs || ''), N = +(/n=([0-9]+)/.exec(PA)?.[1] || 6);
  const r3 = (v) => Math.round(v * 1000) / 1000, r2 = (v) => Math.round(v * 100) / 100, lvl = __G.level;
  const idle = new Map();
  for (const a of g.match.actors) if (a.bot) { idle.set(a, a.bot.update); }
  const revive = (a) => { if (!a.alive) a.respawn(); a.superJumpState = null; a.invuln = 0; a.vel.set(0, 0, 0); a.intent.move.set(0, 0, 0); a.intent.squid = false; a.intent.jump = false; a.lastDamage = 99; a.lastAttacker = null; };
  const put = (a, p) => { revive(a); a.pos.copy(p); a.vel.set(0, 0, 0); a.grounded = false; };
  const runs = []; const WALL = /w=([a-z]+)/.exec(PA)?.[1];
  if (WALL) for (const a of g.match.actors) if (a.bot) a.setWeapon(WALL);
  for (let run = 0; run < N; run++) {
    Lv.debugT(34); dbg.step(1000 / 60);
    const crewF = g.match.actors.filter((a) => a.bot);
    for (const b of crewF) { put(b, lvl.spawnPads[b.team].clone().setY(lvl.spawnPads[b.team].y + 0.05)); b.bot.update = idle.get(b) || b.bot.update; b.bot.path = null; b.bot.goalTimer = 0; b.bot._look = null; }
    Lv._lp = null; Lv.stats.lookTeam = [0, 0]; Lv.stats.lookLong = [0, 0]; Lv.stats.lookClaims = 0; Lv.stats.lookHold = 0; Lv.stats.lookBusyOuts = 0; Lv.stats.lookStalls = 0; Lv.stats.lookFootOuts = 0; Lv.stats.lookLog = [];
    const upAt = [null, null], holds = {}, resc = {}, tp = new Map(), lastPos = new Map();
    for (let i = 0; i < 30 * 27; i++) {
      for (const a of crewF) lastPos.set(a, a.pos.clone());
      dbg.step(1000 / 30);
      for (const T of Lv._lp || []) if (T && T.claim && upAt[T.claim.a.team] === null && Lv._onLookout(T.claim.a, T.ri)) upAt[T.claim.a.team] = r3(Lv.clock.t);
      for (const a of crewF) {
        const claimant = (Lv._lp || []).some((T) => T && T.claim && T.claim.a === a);
        if (!claimant) continue;
        const k = a.team + ':' + a.name;
        if (a.roofHeld > 0) { const gb = a.ground?.block >= 0 ? lvl.blocks[a.ground.block] : null; const key = (gb?.tag || '#' + a.ground?.block); (holds[k] ||= {})[key] = ((holds[k] || {})[key] || 0) + 1; }
        if ((a.netTp || 0) !== (tp.get(a) || 0)) { if (tp.has(a)) { const p0 = lastPos.get(a); (resc[k] ||= []).push([r3(Lv.clock.t), [r2(p0.x), r2(p0.y), r2(p0.z)], [r2(a.pos.x), r2(a.pos.y), r2(a.pos.z)]]); } }
        tp.set(a, a.netTp || 0);
      }
    }
    const S2 = Lv.stats;
    runs.push({ run, upAt, seconds: S2.lookTeam.map(r3), claims: S2.lookClaims, stalls: S2.lookStalls || 0, busy: S2.lookBusyOuts || 0, foot: S2.lookFootOuts || 0, ends: (S2.lookLog || []).map((l) => [l.team, l.who, l.kit, l.t, l.up, l.end, l.at]), holds, resc });
  }
  const fails = runs.filter((r) => !r.upAt.some((u, tm) => u !== null && r.seconds[tm] >= 2)).length;
  R('F10 ×' + N + ': runs where no claimant got up and held ≥ 2 s', fails === 0, { fails, runs });
  return out;
})();
