// (scratch) karp-bots pictures: stages one scene on karpbox for tools/botlab/shoot.cjs (PRE=this, PRE_ARGS=<scene>,
// ACTORS=1, PLAY=1 so the ink stays). Each scene ends frozen at a known spot; shots.sh holds the cameras.
//   burst   — the eight bots break the opening shell from the start; frozen 0.15 s after it bursts (the breakers on the
//             ring outside the 4.5 m burst, the grabber running in)
//   weir    — an Alpha bot carrier walking up to its weir (0, 1.2, 28) with its lead / flank / anchor round it; Bravo off
//   keeper  — Bravo carries on Alpha's half with Alpha's Gate risen: Alpha's keeper on its hold spot in front of that Gate
//   wake    — an Alpha interceptor's eyes: Bravo's carrier swimming hidden in its ink 15 m off (no marker: only its wake)
(async () => {
  const g = window.__inkwave, m = g.match, G = window.__G, dbg = g.debug, scene = window.__preArgs || 'burst';
  const { PLAYER } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const { karpPlan } = await import('./src/game/botsKarp.js');
  const THREE = await import('three');
  dbg.freeze();
  const frame = () => { g._skipRender = true; g._frame(1 / 60); g._skipRender = false; };
  const step = (s, each) => { for (let i = 0, n = Math.round(s * 60); i < n; i++) { frame(); if (each && each(i) === false) return; } };
  const Kp = m.karp, A = m.actors.filter((a) => a.team === 0).sort((x, y) => !!y.bot - !!x.bot), B = m.actors.filter((a) => a.team === 1).sort((x, y) => !!y.bot - !!x.bot);   // (bots first: the local kid has no brain)
  const floorY = (x, z) => { const y = G.level.groundHeight(x, z, 4); return y > -50 ? y : 0; };
  const put = (a, x, z) => { if (!a.alive) a.respawn(); a.pos.set(x, floorY(x, z), z); a.vel.set(0, 0, 0); a.hp = PLAYER.hp; a.form = 'kid'; a.submerged = false; if (a.bot) { a.bot.path = null; a.bot._wasDead = false; } };
  const idle = (a) => { if (a.bot) a.bot.update = function () { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; }; };
  const grant = (a) => { if (Kp.holder) Kp._release(Kp.holder); Kp.shell.clear(); Kp.pos.copy(a.pos); Kp.restNode = -1; Kp._setPhase('free', 0); step(2 / 60); return Kp.holder === a; };
  const me = m.local; if (me && !me.bot) { me.pos.set(18.5, 0, -54); }   // (the local kid out of the way)
  G.paint.clear();
  const out = { scene };
  const roles = () => { const P = karpPlan(); return m.actors.filter((a) => a.alive).map((a) => [a.team ? 'B' : 'A', a.name, P.roleOf(a), +a.pos.x.toFixed(1), +a.pos.z.toFixed(1)]); };
  if (scene === 'burst') {
    for (const [i, a] of A.entries()) put(a, -6 + i * 4, -11);
    for (const [i, a] of B.entries()) put(a, -6 + i * 4, 11);
    let burst = null; const off = on('karp:burst', (e) => { burst = e; });
    step(40, () => { for (const a of m.actors) a.hp = Math.max(a.hp, 60); if (burst) return false; });
    off();
    step(0.15);
    out.burst = burst && { team: burst.team, t: +G.time.toFixed(1) };
    out.dist = m.actors.filter((a) => a.alive).map((a) => [a.team ? 'B' : 'A', +Math.hypot(a.pos.x - Kp.pos.x, a.pos.z - Kp.pos.z).toFixed(1)]);
  } else if (scene === 'weir') {
    for (const a of B) { idle(a); put(a, (a.slot - 1.5) * 2, 61); }
    const c = A[0]; put(c, 0, 1);
    // (the escorts where a fight round the shell left them: one up the route, one beside, one behind)
    const spots = [[-1.5, 10], [3.5, 2], [-1, -6]];
    for (const [i, a] of A.filter((q) => q !== c).entries()) put(a, ...spots[i % 3]);
    grant(c);
    const W = Kp.weirs[0][0].pos;
    step(14, () => { c.hp = PLAYER.hp; if (!Kp.holder || Math.hypot(c.pos.x - W.x, c.pos.z - W.z) < 6.5) return false; });
    out.carrier = [+c.pos.x.toFixed(1), +c.pos.z.toFixed(1)]; out.holder = Kp.holder === c;
    out.team = roles().filter((r) => r[0] === 'A');
  } else if (scene === 'keeper') {
    for (const a of A) put(a, (a.slot - 1.5) * 2, -58);
    const c = B[0];
    for (const a of B) { idle(a); if (a !== c) put(a, (a.slot - 1.5) * 2, 61); }
    put(c, 4, -18); grant(c);
    if (me && !me.bot) put(me, -12, 40);   // (the local kid off on Bravo's half: by our Gate it would count as our keeper — humans fill the role nearest them)
    Kp.lowered[1] = true; Kp.gateUp[1] = true;
    step(9, () => { c.hp = PLAYER.hp; c.invuln = 99; c.pos.set(4, 0, -18); });
    out.team = roles().filter((r) => r[0] === 'A');
    out.gate = Kp.gates[1].pos.toArray().map((v) => +v.toFixed(1));
  } else if (scene === 'wake') {
    const c = B[0], w = A[0];
    for (const a of m.actors) idle(a);
    for (const a of m.actors) if (a !== c && a !== w) put(a, (a.slot - 1.5) * 2, a.team ? 61 : -61);
    put(c, -6, 27); grant(c);
    for (let x = -10; x <= -2; x += 1) for (let z = 22; z <= 32; z += 1) G.paint.splat(new THREE.Vector3(x, 0.05, z), 1.0, 1, { seed: 1 });
    put(w, -6, 12); w.yaw = w.aimYaw = 0;
    // (a real swim: its brain asleep but diving, gliding back and forth across its ink — the actor's own update, so the model
    // is the submerged squid the other team sees)
    let dir = 1;
    c.bot.update = function () { const it = c.intent; it.fire = it.jump = it.sub = it.special = false; it.squid = true; if (c.pos.x > -3.5) dir = -1; if (c.pos.x < -8.5) dir = 1; it.move.set(dir * 0.5, 0, 0); c.hp = PLAYER.hp; c.invuln = 99; };
    step(1.2, () => { w.bot.aimYaw = 0; });
    w.bot._perceive(); step(0.5, () => { w.bot.aimYaw = 0; }); w.bot._perceive();
    out.seen = w.bot.sight.sees(c); out.hidden = Kp.hidden(c); out.submerged = c.submerged; out.form = c.form; out.dist = +Math.hypot(c.pos.x - w.pos.x, c.pos.z - w.pos.z).toFixed(1);
  }
  dbg.freeze();
  return out;
})()
