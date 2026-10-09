// [b5-karp] Two humans play Bazookarp (the WP1 proof): every bot is taken out of play (parked on its deck, brainless);
// Alpha's kid and Bravo's kid are driven by script the way a player would — walk the nav route, aim with the mouse
// (aimYaw / aimPitch), hold the trigger, jump the steps. Alpha bursts the Roe Shell (Bravo shoots it too and loses the
// tug-of-war), grabs the Bazookarp, carries it to its weir and lands it, Bravo splats the carrier once on the way to
// the Gate (a drop, a re-formed shell), Alpha re-bursts, re-grabs and walks into the risen Dragon Gate: a knockout.
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-two.js tools/botlab/run.sh tools/botlab/page.cjs   (and MAP=halyard)
// (6 checks; the match timeline rides on the last one's info)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { PLAYER } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const THREE = await import('three');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v))) });
  const Kp = m.karp;
  if (!Kp) { R('a Bazookarp match', false, { mode: m.mode }); return out; }
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const A0 = m.actors.find((a) => a.team === 0 && a.isLocal) || m.actors.find((a) => a.team === 0), B0 = m.actors.find((a) => a.team === 1);
  const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  // everyone else out of play: brainless, parked on their own decks
  for (const a of m.actors) {
    if (a.bot) a.bot.update = () => {};
    idle(a);
    if (a === A0 || a === B0) continue;
    const p = G.level.spawnPads[a.team]; a.pos.set(p.x + ((a.slot % 4) - 1.5) * 1.5, p.y, p.z + (a.team ? 2 : -2)); a.vel.set(0, 0, 0);
  }
  for (const a of [A0, B0]) a.setWeapon('shooter');
  const log = []; const T = () => +(m.duration - m.time).toFixed(1);
  const offs = ['karp:burst', 'karp:pickup', 'karp:plant', 'karp:drop', 'karp:reset', 'karp:end'].map((k) => on(k, (e) => log.push([T(), k.slice(5), e.team ?? e.actor?.team ?? e.winner, e.how || e.reason || ''])));
  const freeze = () => { for (const a of m.actors) if (a !== A0 && a !== B0) { idle(a); const p = G.level.spawnPads[a.team]; if (Math.hypot(a.pos.x - p.x, a.pos.z - p.z) > 5) a.pos.set(p.x, p.y, p.z + (a.team ? 2 : -2)); } };
  // aim a player at a point (a mouse's aim) — returns the horizontal distance
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z, dy = p.y - (a.pos.y + 1.2), d = Math.hypot(dx, dz); a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(dy, Math.max(0.3, d)); a.yaw = a.aimYaw; return d; };
  // walk a player along the nav route to p (stops within r), jumping the steps — as WASD + space would
  const walk = (a, p, r = 1.0, maxS = 40, pre = null) => {
    const nav = G.nav, goal = nav.nearest(new THREE.Vector3(p.x, p.y + 0.3, p.z), 1.2);
    let path = null, pi = 0, t = 0, repath = 0;
    while (t < maxS) {
      if (!a.alive) return false;
      if (Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < r && Math.abs(a.pos.y - p.y) < 1.2) { idle(a); return true; }
      if (pre && pre()) { idle(a); return true; }
      if (!path || repath <= 0) { const s = nav.nearest(a.pos, 1.2, true); path = s >= 0 && goal >= 0 ? nav.path(s, goal, a.team, undefined, true) || nav.path(s, goal, a.team) : null; pi = 1; repath = 1.5; }
      let q = p;
      if (path && pi < path.length) { const n = nav.nodes[path[pi]]; q = n; if (Math.hypot(n.x - a.pos.x, n.z - a.pos.z) < 0.55 && Math.abs(n.y - a.pos.y) < 1.4) pi++; }
      const dx = q.x - a.pos.x, dz = q.z - a.pos.z, l = Math.hypot(dx, dz) || 1;
      a.intent.move.set(dx / l, 0, dz / l);
      a.intent.jump = !!(path && pi < path.length && nav.nodes[path[pi]].y - a.pos.y > 0.45 && l < 1.6);
      freeze(); dbg.step(1000 / 60); t += 1 / 60; repath -= 1 / 60;
    }
    idle(a); return false;
  };
  // shoot the shell from where they stand until it bursts (or maxS)
  const shoot = (shooters, maxS = 30) => {
    let t = 0;
    while (t < maxS && Kp.phase === 'shielded') {
      for (const a of shooters) { if (!a.alive) continue; aimAt(a, Kp.shell.center()); a.intent.fire = a.ink > 5; if (a.ink < 6) { a.intent.fire = false; } }
      freeze(); dbg.step(1000 / 60); t += 1 / 60;
      for (const a of shooters) if (a.ink < 6) a.ink = PLAYER.inkMax;   // (a refill swim, skipped)
    }
    for (const a of shooters) idle(a);
    return Kp.phase !== 'shielded';
  };
  // a stand spot ~6 m from the shell on a's side with a clear line to it
  const spotFor = (a, ring = 6.5) => {
    const c = Kp.pos, sc = Kp.shell.center(), pad = G.level.spawnPads[a.team], base = Math.atan2(pad.x - c.x, pad.z - c.z), eye = new THREE.Vector3();
    // (a raised Pond: a spot on its own deck first — the floor under it can't reach it with a Splattershot's arc)
    for (const level of [true, false]) for (const da of [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3, 1.57, -1.57, 2, -2]) for (const r of [ring, ring - 1, ring + 1.5, ring - 2, ring + 3]) {
      const id = G.nav.nearest(new THREE.Vector3(c.x + Math.sin(base + da) * r, c.y + 0.5, c.z + Math.cos(base + da) * r), 1.2);
      if (id < 0) continue;
      const n = G.nav.nodes[id];
      if (Math.hypot(n.x - c.x, n.z - c.z) < 4.8 || (level && Math.abs(n.y - c.y) > 1)) continue;
      if (G.physics.los(eye.set(n.x, n.y + 1.1, n.z), sc)) return new THREE.Vector3(n.x, n.y, n.z);
    }
    return null;
  };
  const grab = (a) => walk(a, Kp.pos, 0.6, 15, () => Kp.holder === a);
  try {
    // 1. the opening tug-of-war: both shoot the shell from their sides; Alpha out-shoots Bravo (Bravo stops after 2 s)
    const sa = spotFor(A0), sb = spotFor(B0);
    const wa = walk(A0, sa, 0.8, 40), wb = walk(B0, sb, 0.8, 40);
    let t = 0; while (t < 2 && Kp.phase === 'shielded') { for (const a of [A0, B0]) { aimAt(a, Kp.shell.center()); a.intent.fire = true; } freeze(); dbg.step(1000 / 60); t += 1 / 60; }
    const tug = Kp.shell.stats.counted.slice();
    idle(B0);
    const burst = shoot([A0], 40);
    R('two players reach the Pond and shoot the Roe Shell from both sides (the meter moves both ways); Alpha bursts it', wa && wb && tug[0] > 0 && tug[1] > 0 && burst && Kp.stats.pops[0] === 1, { walkedA: wa, walkedB: wb, counted: tug, pops: Kp.stats.pops, phase: Kp.phase, spotA: sa, spotB: sb });
    // 2. Alpha grabs it, carries it to its weir and lands it (Bravo watches from its side)
    step(0.3);
    const got = grab(A0);
    R('Alpha runs into the Bazookarp and carries it (the carrier rules on: no super jump, the Carp Shot)', got && !!A0.carry && !A0.canSuperJump(), { holder: Kp.holder?.name, carry: !!A0.carry });
    const W = Kp.weirs[0][0];
    const planted = walk(A0, W.pos, 0.6, 40, () => Kp.lowered[0]);
    R('… walks its route to the weir and lands it: the weir lowers, the Dragon Gate rises, the count is the weir\'s', planted && Kp.lowered[0] && Kp.gateUp[0] && Kp.count[0] === W.count, { lowered: Kp.lowered, gateUp: Kp.gateUp, count: Kp.count, weir: W.count, pos: A0.pos.toArray() });
    // 3. the re-formed shell (500 hp): Alpha bursts it again and re-grabs
    step(1.0);
    const sa2 = spotFor(A0, 6); if (sa2) walk(A0, sa2, 0.8, 20);
    const burst2 = shoot([A0], 30); step(0.3);
    const got2 = grab(A0);
    R('the shell re-forms on the weir at 500 hp; Alpha bursts it and grabs it again', burst2 && got2 && Kp.stats.pops[0] === 2, { pops: Kp.stats.pops, holder: Kp.holder?.name });
    // 4. Bravo meets the carrier on the way: splats it with its Splattershot → a drop (a fresh shell where it fell)
    const gp = Kp.gates[0].pos;
    const mid = new THREE.Vector3((A0.pos.x + gp.x) / 2, A0.pos.y, (A0.pos.z + gp.z) / 2);
    walk(B0, gp, 3, 30);
    // (where the carrier stood when it was splatted, and where the engine dropped it)
    let death = null, drop = null;
    const offD = [on('splatted', (e) => { if (e.victim === A0 && !death) death = { pos: A0.pos.clone(), half: A0.carry?.j?.half ?? -1 }; }), on('karp:drop', (e) => { if (!drop) drop = { pos: e.pos.clone(), how: e.how }; })];
    let hunt = 0; while (hunt < 12 && A0.alive) { walk(A0, gp, 1.0, 0.1); aimAt(B0, new THREE.Vector3(A0.pos.x, A0.pos.y + 0.9, A0.pos.z)); B0.intent.fire = true; B0.ink = PLAYER.inkMax; freeze(); dbg.step(1000 / 60); hunt += 1 / 60; }
    idle(B0); offD.forEach((f) => f());
    const dropped = !A0.alive && !Kp.holder && (Kp.phase === 'reforming' || Kp.phase === 'shielded');
    // the drop spot is the field's drop spot from the death spot on the carrier's half (§2.7): the same node, a short
    // step from where it fell (the nearest wide, clear rest node)
    const want = death ? Kp.field.dropSpot(death.pos, death.half >= 0 ? death.half : Kp.field.halfAt(death.pos)) : -1, wn = want >= 0 ? G.nav.nodes[want] : null;
    const dDeath = death && drop ? Math.hypot(drop.pos.x - death.pos.x, drop.pos.z - death.pos.z) : null;
    R('Bravo splats the carrier on the way to the Gate: it drops at the drop spot of where the carrier fell (that node, ≤ 4 m away) and a shell re-forms there',
      dropped && !!death && !!drop && drop.how === 'splat' && !!wn && Math.hypot(wn.x - drop.pos.x, wn.z - drop.pos.z) < 0.05 && dDeath <= 4 && Kp.pos.distanceTo(drop.pos) < 0.05,
      { alive: A0.alive, phase: Kp.phase, death: death && death.pos.toArray(), half: death && death.half, drop: drop && drop.pos.toArray(), want: wn && [wn.x, wn.y, wn.z], dDeath, rest: Kp.pos.toArray(), mid: mid.toArray() });
    // Bravo walks back home; Alpha respawns, comes back, bursts and grabs, walks into the risen Gate
    walk(B0, G.level.spawnPads[1], 6, 20);
    step(6); idle(A0);
    const sa3 = spotFor(A0, 6.5); if (sa3) walk(A0, sa3, 0.8, 40);
    const burst3 = shoot([A0], 30); step(0.3); grab(A0);
    const ko = walk(A0, gp, 0.5, 40, () => Kp.winner != null);
    // (the match timeline is information, not a check: it rides on the last row)
    R('… Alpha re-bursts, re-grabs and walks into the risen Dragon Gate: a knockout, Alpha wins (no clamp rejection all match)', burst3 && ko && Kp.winner === 0 && Kp.reason === 'knockout' && Kp.count[0] === 0 && Kp.stats.clamped === 0,
      { winner: Kp.winner, reason: Kp.reason, count: Kp.count, state: m.state, clamped: Kp.stats.clamped, timeline: log, t: T() });
  } catch (e) { R('HARNESS: the script threw', false, { err: String(e && e.stack || e).slice(0, 500), log }); }
  offs.forEach((f) => f());
  return out;
})()
