// Bazookarp on Highmark Foundry: the lava's two field states (bazookarp/SPEC.md §5.5, §9.4; caldera ENGINE §6 step 11;
// fix round 3 of the lava engine, after the b5-int3 merge):
//   MAP=caldera MODE=bazookarp PAGE=tools/botlab/tests/lava-karp.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   K1 the Carp Field is built with the lava's states (G.match.stage.karpStates(): LOW, HIGH from restMask) at load
//   K2 rest flags: no rest spot on a rider (a stone, an Organ) at either level, none on lava-reachable floor at HIGH
//   K3 the drop spot from lava-reachable ground at HIGH (a carrier splatted on a drowned ledge, one fallen in the lake)
//      lands on dry floor of that half
//   K4 the field switches at lava:warn (to the level the coming move ends at), both ways, and is never rebuilt
//   K5 a Bazookarp resting on a ledge at LOW stays there until the rise's warning, then is moved to dry ground at once
//      (13.8 s before the ledge turns deadly)
//   K6 a carrier on the drowning Slump shelf gets the warning like anyone (the personal line), and standing still across
//      the switch never gets the fuse's ×3
//   K7 a bot carrier on the shelf at the rise warning escapes it (alive, off the low ground when the ledges turn deadly)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const { on } = await import('./src/core/ctx.js');
  const m = g.match, Kp = m?.karp, Lv = m?.lava, W = __G.lavaWorld, M = W?.navMeta, nav = __G.nav, dbg = g.debug;
  R('a Bazookarp match on Highmark Foundry: the mode and the lava both run', !!Kp && !!Lv && m.mode === 'bazookarp', { mode: m?.mode, karp: !!Kp, lava: !!Lv, placeholder: Kp?.placeholder });
  if (!Kp || !Lv || !M) return out;
  dbg.freeze();
  for (const a of m.actors) if (a.bot) { a.bot._upd = a.bot.update; a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; a.invuln = 1e6; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const F = Kp.field, N = nav.nodes.length, sHigh = F.stateOf('high'), sLow = F.stateOf('low');

  // K1
  const SS = m.stage.karpStates(), keys = F.states.map((s) => s.key);
  R('K1 the Carp Field is built with the lava\'s states at load: G.match.stage.karpStates() → LOW, HIGH (from restMask); the field\'s states [as built, low, high]',
    SS.length === 2 && SS[0].key === 'low' && SS[1].key === 'high' && keys.join() === '0,low,high' && sLow === 1 && sHigh === 2,
    { karpStates: SS.map((s) => s.key), fieldStates: keys, okN: F.states.map((s) => s.okN.reduce((a, b) => a + b, 0)) });

  // K2
  const rest = {}, badRest = [];
  for (const [lv, si] of [['high', sHigh], ['low', sLow], ['built', 0]]) {
    const ro = F.states[si].restOk; let n = 0;
    for (let i = 0; i < N; i++) {
      if (!ro[i]) continue;
      n++;
      const k = M.kind[i];
      if (k === 2 || (lv === 'high' && k === 1)) { if (badRest.length < 12) badRest.push([lv, k === 2 ? 'rider' : 'ledge', r2(nav.nodes[i].x), r2(nav.nodes[i].y), r2(nav.nodes[i].z)]); else badRest.push(null); }
    }
    rest[lv] = n;
  }
  const sweeps = m.stage.sweeps([]).length;
  R('K2 rest flags: no rest spot on a rider (a Pumice stone, an Organ: the riders\' whole travel is swept) in any state, none on lava-reachable floor at HIGH',
    !badRest.length && rest.high > 200 && rest.low >= rest.high && sweeps > 0, { restOk: rest, sweptBoxes: sweeps, bad: badRest.filter(Boolean).slice(0, 12), nBad: badRest.length });

  // K3
  const ledges = [];
  for (let i = 0; i < N; i++) if (nav.valid[i] && M.kind[i] === 1) ledges.push(i);
  const pick = ledges.filter((_, k) => k % Math.max(1, Math.floor(ledges.length / 30)) === 0).slice(0, 30);
  const drops = [], dropBad = [];
  for (const id of pick) {
    const n = nav.nodes[id], p = V(n.x, n.y, n.z), h = F.states[sHigh].halfOf[id];
    const d = F.dropSpot(p, h, null, sHigh);
    if (d < 0 || M.kind[d] !== 0 || F.states[sHigh].halfOf[d] !== h) dropBad.push([r2(n.x), r2(n.z), d, d >= 0 ? M.kind[d] : null]);
    else drops.push(r2(Math.hypot(nav.nodes[d].x - n.x, nav.nodes[d].z - n.z)));
  }
  R('K3 the drop spot at HIGH from lava-reachable ground (30 ledge spots, both halves): dry floor on the same half, every time',
    pick.length >= 20 && !dropBad.length, { spots: pick.length, maxM: drops.length ? Math.max(...drops) : null, bad: dropBad.slice(0, 8) });

  // K4
  const sw = [], offs = [on('karp:field', (e) => sw.push([r2(Lv.clock.t), e.state])), on('karp:drop', (e) => drops2.push([r2(Lv.clock.t), e.how, r2(e.pos.x), r2(e.pos.y), r2(e.pos.z)]))];
  const drops2 = [];
  const D0 = F.states.map((s) => s.D[0]), R0 = F.states.map((s) => s.restOk);
  setT(24.6); step(0.8); const atRise = F.state;
  setT(59.6); step(0.8); const atFall = F.state;
  const swRise = sw.find((x) => x[1] === sHigh), swFall = sw.find((x) => x[1] === sLow && x[0] > 50);
  R('K4 the field switches at lava:warn — to HIGH at the rise warning (25 s), to LOW at the fall warning (60 s) — and is never rebuilt (the same arrays)',
    atRise === sHigh && atFall === sLow && swRise && swRise[0] >= 25 && swRise[0] < 25.1 && swFall && swFall[0] >= 60 && swFall[0] < 60.1 && F.states.every((s, i) => s.D[0] === D0[i] && s.restOk === R0[i]),
    { switches: sw, atRise, atFall });

  // K5: rest the Bazookarp on a Casting Floor / shelf node at LOW (state low), then the rise's warning
  setT(18); step(0.2);
  const roLow = F.states[sLow].restOk, roHigh = F.states[sHigh].restOk;
  const ledge = ledges.find((i) => roLow[i] && !roHigh[i] && nav.nodes[i].z < -6 && Math.abs(nav.nodes[i].x) > 6);
  let k5 = { ledge: ledge ?? null };
  if (ledge != null) {
    const n = nav.nodes[ledge];
    Kp._reform(V(n.x, n.y, n.z), ledge); step(2.0);
    const stayed = Kp.restNode === ledge;
    drops2.length = 0;
    setT(24.6); step(0.8);
    const mv = drops2.find((d) => d[1] === 'moved'), now = Kp.restNode;
    k5 = { ledge: [r2(n.x), r2(n.y), r2(n.z)], stayedAtLow: stayed, moved: mv || null, restNow: now, kindNow: now >= 0 ? M.kind[now] : null, phase: Kp.phase };
    R('K5 a Bazookarp resting on a ledge at LOW stays there until the rise\'s warning, then is moved to dry ground at once (13.8 s before the ledge turns deadly)',
      stayed && !!mv && mv[0] >= 25 && mv[0] < 25.1 && now >= 0 && now !== ledge && M.kind[now] === 0, k5);
  } else R('K5 a Bazookarp resting on a ledge at LOW … moved at the warning', false, k5);

  // K6: the local player carrying, still on Alpha's shelf (its own half) across the rise's warning
  const me = m.local, shelf = V(-25.2, 0.02, -8.19);
  setT(22); step(0.1);
  Kp._reform(Kp.R.pond.clone(), -1); step(0.1);
  if (!me.alive) me.respawn();
  me.superJumpState = null; me.pos.copy(shelf); me.vel.set(0, 0, 0); me.invuln = 1e6;
  Kp.phase = 'free'; Kp._applyGrant(me); step(0.3);
  const rates = [], lines = [];
  for (let t = 22.4; t < 27; t += 0.1) { me.pos.x = shelf.x; me.pos.z = shelf.z; me.vel.set(0, 0, 0); step(0.1); rates.push(Kp.rate); const mm = Lv._mine(me); if (Lv.st.warn) lines.push(mm ? mm.text : null); }
  const carrying = Kp.holder === me;
  Kp._release(me);
  R('K6 a carrier on the drowning Slump shelf gets the warning like anyone (GET OFF THE LOW GROUND all through the warning), and standing still on its own half across the switch never gets the fuse\'s ×3',
    carrying && lines.length > 10 && lines.every((x) => x === 'GET OFF THE LOW GROUND') && rates.every((r) => r === 1),
    { carrying, warnSamples: lines.length, lines: [...new Set(lines)], rates: [...new Set(rates)] });

  // K7: a bot carrier on the shelf at the rise warning (its brain on): off the low ground, alive, when the ledges turn deadly
  const bot = m.actors.find((a) => a.bot && a.team === 0);
  let k7 = null;
  if (bot) {
    setT(24.0); step(0.1);
    Kp._reform(Kp.R.pond.clone(), -1); step(0.1);
    if (!bot.alive) bot.respawn();
    bot.superJumpState = null; bot.pos.set(shelf.x + 0.5, 0.02, shelf.z + 0.5); bot.vel.set(0, 0, 0); bot.invuln = 1e6;
    Kp.phase = 'free'; Kp._applyGrant(bot);
    bot.bot.update = bot.bot._upd; bot.bot.path = null; bot.bot.repath = 0; bot.bot.goalTimer = 0;
    const deaths = []; const o = on('splatted', (e) => { if (e.victim === bot) deaths.push([r2(Lv.clock.t), e.cause]); });
    step(15.5);   // → 39.6: the ledges are deadly from 38.8
    o();
    const f = Lv._foot(bot);
    k7 = { alive: bot.alive, at: [r2(bot.pos.x), r2(bot.pos.y), r2(bot.pos.z)], foot: f.kind, deaths, escapes: bot.bot.escN || 0, carrying: Kp.holder === bot };
    bot.bot.update = () => {};
    if (Kp.holder === bot) Kp._release(bot);
  }
  R('K7 a bot carrier on the shelf at the rise warning escapes it: alive and off the low ground when the ledges turn deadly', !!k7 && k7.alive && k7.foot === 0 && !k7.deaths.length, k7);
  offs.forEach((f) => f());
  return out;
})();
