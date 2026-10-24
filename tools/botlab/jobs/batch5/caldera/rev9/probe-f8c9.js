// Review 9: lava.js F8c (a bot sent off a rising stone up the step at its end) failed in my run: race1, t0 40.4, node 4410,
// both slants, not up within 4 s, no death. The same cases (race1 / 5 / 6 / 7, every node, ±0.7, t0 39.6 / 40.4), 3 passes,
// with a trail for each one not up: where it stood, on what (roof? rider?), the roof slide's hold, the bot's escape state
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const { on } = await import('./src/core/ctx.js');
  const W = __G.lavaWorld, dbg = g.debug; dbg.freeze();
  const idle = new Map();
  const freezeBots = () => { for (const a of g.match.actors) if (a.bot) { if (!idle.has(a)) idle.set(a, a.bot.update); a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; } };
  freezeBots();
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const Lv = g.match.lava, setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r3 = (v) => Math.round(v * 1000) / 1000, r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, M = W.navMeta, me = g.match.local;
  const revive = (a) => { if (!a.alive) a.respawn(); a.superJumpState = null; a.invuln = 0; a.vel.set(0, 0, 0); a.intent.move.set(0, 0, 0); a.intent.squid = false; a.intent.jump = false; a.lastDamage = 99; a.lastAttacker = null; };
  const put = (a, p) => { revive(a); a.pos.copy(p); a.vel.set(0, 0, 0); a.grounded = false; };
  const rid = (id) => Lv.riders.find((x) => x.r.id === id);
  const bots = g.match.actors.filter((a) => a.bot && a !== me), fc = bots[1] || bots[0], FC = fc.bot;
  const heads = nav.nodes.filter((q) => nav.valid[q.id] && M.kind[q.id] === 0 && q.y > 1.0 && q.y < 1.6);
  const headOf = (q) => { let best = null, bd = 2.6; for (const h of heads) { const d = Math.hypot(h.x - q.x, h.z - q.z); if (d < bd) { bd = d; best = h; } } return best; };
  const all = [], bad = [];
  for (let pass = 0; pass < 3; pass++) for (const sid of ['race1', 'race5', 'race6', 'race7']) {
    const r = W.riders.find((x) => x.id === sid), ri = W.riders.indexOf(r), ns = nav.nodes.filter((q) => M.rider[q.id] === ri && M.pose[q.id] === 1 && headOf(q));
    for (const t0 of [39.6, 40.4]) for (const sn of ns) for (const sl of [0.7, -0.7]) {
      setT(t0); freezeBots();
      put(fc, V(sn.x, rid(sid).top + 0.02, sn.z)); fc.invuln = 1e6; fc._lavaFoot = null; step(0.05);
      FC.update = idle.get(fc); FC.path = null; FC.repath = 0; FC.goalTimer = 0; FC._look = null; FC._lavaEsc = true; FC._stoneStep = true; FC._lavaT = 0; FC.goal = -1;
      const h = headOf(sn), dx = h.x - fc.pos.x, dz = h.z - fc.pos.z, dl = Math.hypot(dx, dz) || 1, c = Math.cos(sl), s2 = Math.sin(sl), ux = (dx * c - dz * s2) / dl, uz = (dx * s2 + dz * c) / dl;
      fc.vel.set(ux * 5.5, 0, uz * 5.5); FC.mvYaw = Math.atan2(ux, uz); FC.mvMag = 1; FC.jumpCd = 0.8; FC._jRef = true;
      let died = null, up = null; const tr = [], o8 = on('splatted', (e) => { if (e.victim === fc && !died) died = [e.cause, r3(Lv.clock.t)]; });
      let held = 0, rescued = 0, tp = fc.netTp || 0;
      for (let i = 0; i < 30 * 4 && !died && up === null; i++) {
        dbg.step(1000 / 30);
        const gb = fc.ground?.block >= 0 ? lvl.blocks[fc.ground.block] : null;
        if (fc.roofHeld > 0) held++; if ((fc.netTp || 0) !== tp) { rescued++; tp = fc.netTp || 0; }
        if (i % 3 === 0) tr.push([i, r2(fc.pos.x), r2(fc.pos.y), r2(fc.pos.z), fc.grounded ? (gb ? (gb.tag || (gb.lavaRider ? 'rider' : '#' + gb.id)) + (gb.roof ? '/R' : '') : '?') : 'air', r2(Math.hypot(fc.vel.x, fc.vel.z)), r2(fc.vel.y), fc.roofHeld > 0 ? 'H' : '', fc.roofDir ? [r2(fc.roofDir.x), r2(fc.roofDir.z)] : null, FC.mode, FC._lavaEsc ? 'E' : '', FC._stoneStep ? 'S' : '', r2(FC.jumpCd || 0), fc.intent.jump ? 'J' : '', r2(Lv.y)]);
        if (fc.grounded && !gb?.lavaRider && fc.pos.y > 1.0) up = r3(Lv.clock.t - t0);
      }
      o8(); freezeBots();
      const row = [pass, sid, t0, sn.id, sl, up, died, held, rescued];
      all.push(row);
      if (up === null || died) bad.push({ row, head: [r2(h.x), r2(h.y), r2(h.z)], node: [r2(sn.x), r2(sn.y), r2(sn.z)], tr: tr.slice(-24) });
    }
  }
  R('F8c again ×3 with trails', !bad.length, { n: all.length, notUp: bad.length, heldAny: all.filter((x) => x[7] > 0).length, rescuedAny: all.filter((x) => x[8] > 0).length, slowest: Math.max(...all.map((x) => x[5] ?? 0)), bad: bad.slice(0, 6) });
  return out;
})();
