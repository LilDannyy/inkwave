// [b5-karp] Bazookarp: every rule in the SPEC's rules table (§2.1 S0–S52, §2.2–§2.8, §3) checked on karpbox, deterministic
// (frozen clock, stepped at 60 Hz, bots off). Groups as SPEC §10.1 karp-rules: A setup · B the shell · C the pick-up and
// the carrier · D scoring · E the fuse · F drops · G overtime · H passive charge · I the field reading · J state switches
// · K the Carp Shot. Each check fails without its rule (its comment names the rule).
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/bazookarp-rules.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=A,B,…' runs some groups.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER, SPECIALS, SUB } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF, KARPBOX_TWO } = await import('./tools/botlab/karpbox.js');
  const { blastDamage } = await import('./src/game/karpGun.js');
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  const only = (window.__pageArgs || '').match(/only=([\w,]+)/)?.[1]?.split(',') || null;
  const want = (k) => !only || only.includes(k);
  if (m.mode !== 'bazookarp' || !m.karp) { R('A: a Bazookarp match on karpbox', false, { mode: m.mode }); return out; }
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  function idle(a) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; }
  const floorY = (x, z, hint = 3) => { const y = G.level.groundHeight(x, z, hint); return y > -50 ? y : 0; };
  // a player at (x, z) on the floor (or y), standing still, fit and ready
  const put = (a, x, z, y = null) => {
    if (!a.alive) { a.respawn(); }
    a.superJumpState = null; if (a.specialActive) G.specials.end(a, 'test');
    a.pos.set(x, y ?? floorY(x, z), z); a.vel.set(0, 0, 0); a.grounded = false; a.smoothY = 0; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.climbing = false;
    a.status.track = 0; idle(a);
  };
  // everyone out of the way: on their own spawn decks
  const park = () => { for (const a of m.actors) { const p = G.level.spawnPads[a.team]; a.status.shield = 0; put(a, p.x + ((a.slot % 4) - 1.5) * 1.6, p.z + (a.team ? 2.5 : -2.5), p.y); } };
  let Kp = m.karp;
  // a fresh engine (def: LAYOUT.bazookarp to use; the world keeps its kit pieces)
  const fresh = (def = KARPBOX_DEF, opts = {}) => {
    Kp?.dispose(); G.level.layout.bazookarp = def;
    m.time = opts.time ?? 200; m.state = 'playing'; m.result = null;
    if (m.karp) { m.karp.winner = 'disposed'; }
    G.paint.clear();   // (every check starts on a clean deck: ink left by the last one slows a carrier)
    m.karp = Kp = new Bazookarp(m, new LoopWire());
    if (opts.coin != null) Kp.coin = opts.coin;
    park(); step(0.05);
    return Kp;
  };
  const freeAt = (p) => { Kp.shell.clear(); Kp.pos.copy(p); Kp.restNode = -1; Kp._setPhase('free', 0); };
  const restAt = (p, node = -1, hp = 500) => { Kp.pos.copy(p); Kp.restNode = node; Kp.shell.form(p, hp, 0); Kp._setPhase('shielded'); };
  const grant = (a) => { freeAt(V(a.pos.x, a.pos.y, a.pos.z)); step(2 / 60); return Kp.holder === a; };
  const carry = (a, x, z, y = null) => { put(a, x, z, y); step(1 / 60); grant(a); return Kp.holder === a; };
  const ev = []; const offs = ['karp:burst', 'karp:pickup', 'karp:drop', 'karp:reset', 'karp:plant', 'karp:gate', 'karp:rate', 'karp:explode', 'karp:overtime', 'karp:end', 'karp:refuse', 'sub:cantuse', 'splatted'].map((k) => on(k, (e) => ev.push([k, e])));
  const evs = (k) => ev.filter((e) => e[0] === k).map((e) => e[1]);
  const clearEv = () => { ev.length = 0; };
  const inPoly = (poly, x, z) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins; } return ins; };
  const F = () => Kp.field;

  try {
  // ============================================================================ A. setup (S0, S3, S41, §3.2)
  if (want('A')) {
    fresh();
    R('A1 S0: the mode, its engine and the objective-target registry', m.mode === 'bazookarp' && !!Kp && G.objTargets?.targets.includes(Kp.shell), { mode: m.mode });
    const E = F().extraEdgeList();
    const hop = E.find((e) => e.type === 'hop' && e.a[2] > 13 && e.a[2] < 14 && e.b[2] > 14 && e.b[2] < 15 && e.a[0] < -14.5 && Math.abs(e.b[1] - e.a[1] - 1.5) < 0.05);
    const gap = E.find((e) => e.type === 'gap' && e.a[0] > 21 && e.a[0] < 22 && e.b[0] > 24 && e.b[0] < 25);
    R('A2 §3.2: the field has the hop up the lane\'s 1.5 m step and the gap edge across the 2.6 m of air', !!hop && !!gap, { hops: F().stats.hops, gaps: F().stats.gaps, hop, gap, maxGain: F().stats.maxHopGain, buildMs: F().stats.buildMs });
    R('A3 §3.2 step 4: L_A ≈ L_B (within 2 %)', Math.abs(Kp.L[0] - Kp.L[1]) / Math.max(Kp.L[0], Kp.L[1]) < 0.02, { L: Kp.L });
    R('A4 S3: the Pond, a shielded Bazookarp at 1000 hp, counts 100 / 100', Kp.phase === 'shielded' && Kp.shell.hp === 1000 && Kp.shell.state === 'intact' && Kp.pos.length() < 0.3 && Kp.count[0] === 100 && Kp.count[1] === 100, { phase: Kp.phase, hp: Kp.shell.hp, pos: Kp.pos.toArray(), count: Kp.count });
    const st = JSON.stringify(Kp.state());
    R('A5 S41: the coin is nowhere in state() (the HUD never sees it)', !/coin/.test(st) && (Kp.coin === 0 || Kp.coin === 1), { keys: Object.keys(Kp.state()) });
  }

  // ============================================================================ B. the Roe Shell (S4–S6, §2.2)
  if (want('B')) {
    fresh();
    const a0 = A[0], b0 = B[0], O = G.objTargets;
    O.hit(a0, 50, 'shooter'); const m1 = Kp.shell.meter; O.hit(b0, 80, 'shooter'); const m2 = Kp.shell.meter;
    R('B1 §2.2: Alpha\'s hits add, Bravo\'s subtract (a tug-of-war)', m1 === 50 && m2 === -30, { m1, m2 });
    Kp.shell.m = 300; Kp.shell.quiet = 0; step(1.4); const r1 = Kp.shell.meter; step(1.1); const r2 = Kp.shell.meter;
    R('B2 §2.2: no regrowth for 1.5 s without hits, then back toward 0 at 200 / s', r1 === 300 && Math.abs(r2 - (300 - 200 * 1.0)) < 12, { r1, r2 });
    // a Splat Bomb at the shell's surface: its true 180, not the devices' 60
    Kp.shell.m = 0; const c = Kp.shell.center();
    G.projectiles._explodeBomb({ pos: V(c.x, c.y, c.z - 1.6), team: 0, owner: a0, sp: false, kind: 'bomb' });
    const bomb = Kp.shell.meter;
    Kp.shell.m = 0; G.projectiles._explodeBomb({ pos: V(c.x, c.y, c.z - 1.6), team: 0, owner: a0, sp: true, kind: 'bomb' });
    const bar = Kp.shell.meter;
    R('B3 §2.2: a Splat Bomb at the surface counts its player damage (180), not the device number (60)', Math.abs(bomb - SUB.bomb.damageMax) < 1, { bomb, max: SUB.bomb.damageMax });
    R('B4 §2.2: a Bomb Barrage\'s bomb (its sp flag) counts × 0.5', Math.abs(bar - SUB.bomb.damageMax * 0.5) < 1, { bar });
    Kp.shell.m = 0; O.hit(a0, 500, 'charger'); const cap = Kp.shell.meter;
    Kp.shell.m = 0; O.hit(a0, 120, 'zooka'); const sp = Kp.shell.meter;
    R('B5 §2.2: one hit counts at most 220; a special (by its id) × 0.5', cap === 220 && sp === 60, { cap, sp });
    // the Tidal Slam: its own hook in actor.js (_slamImpact), × 0.5
    Kp.shell.m = 0; put(a0, 0, -2.6); step(0.05); a0._slamImpact(SPECIALS.slam); const slam = Kp.shell.meter;
    R('B6 §2.2: a Tidal Slam beside it counts (× 0.5)', slam > 0 && slam <= SPECIALS.slam.damageMax * 0.5 + 0.5, { slam, max: SPECIALS.slam.damageMax });
    // a roller's roll is a touch, not a hit (no rollHit): it rolls into the shell and the meter doesn't move
    park(); Kp.shell.m = 0; Kp.shell.quiet = 0;
    a0.setWeapon('roller'); put(a0, 0, -9); a0.yaw = a0.aimYaw = Math.PI; a0.aimPitch = 0.3; a0.intent.fire = true; step(0.6);   // (the press's flick goes away from it)
    a0.aimYaw = 0; a0.intent.move.set(0, 0, 1); step(2.0); a0.intent.fire = false; idle(a0);
    const roll = Kp.shell.meter;
    R('B7 §2.2: a roller rolling into it is a touch (stung, shoved), not a hit (the meter stays)', roll === 0 && Kp.shell.stats.touches > 0, { roll, touches: Kp.shell.stats.touches, z: a0.pos.z });
    a0.setWeapon('shooter');
    // it blocks shots: a shot fired through it at a player right behind it stops on it
    park(); Kp.shell.m = 0;
    put(a0, 0, -7); put(b0, 0, 2.3); step(0.1);
    a0.yaw = a0.aimYaw = 0; a0.aimPitch = Math.atan2(Kp.shell.center().y - (a0.pos.y + 1.2), 7);
    a0.intent.fire = true; step(1.0); a0.intent.fire = false; step(0.3);
    R('B8 §2.2: it blocks shots — a stream fired through it hits it and never the player right behind it', b0.hp === PLAYER.hp && Kp.shell.meter > 0, { victimHp: b0.hp, meter: Kp.shell.meter });
    // touching it: 20 at most every 0.5 s, shoved out, never below 1 hp
    park(); Kp.shell.m = 0; Kp.shell.touchT.clear();
    put(b0, 0, -1.9); b0.intent.move.set(0, 0, 1); const hp0 = b0.hp; step(1.02); const hp1 = b0.hp; const d1 = Math.hypot(b0.pos.x, b0.pos.z);
    b0.hp = 15; let hpLow = 99; for (let i = 0; i < 180; i++) { dbg.step(1000 / 60); hpLow = Math.min(hpLow, b0.hp); } idle(b0);
    R('B9 S6: touch 20 every 0.5 s (3 stings in 1 s), shoved out to its surface, never below 1 hp', hp0 - hp1 >= 59 && hp0 - hp1 <= 61 && d1 > Kp.shell.radius() + PLAYER.radius - 0.15 && hpLow === 1 && b0.alive, { taken: hp0 - hp1, dist: d1, reach: Kp.shell.radius() + PLAYER.radius, hpLow });
    // the shove never pushes off an edge: a shell resting at the pier's middle, a player at its north edge walking in
    park(); restAt(V(15.5, 0, 37.0), -1, 500);
    put(b0, 15.5, 37.85); b0.intent.move.set(0, 0, -1); step(2.0); idle(b0);
    R('B10 §2.2: the shove never pushes off an edge (the pier\'s side: along it, never into the water)', b0.alive && b0.pos.z <= 38.05 && b0.pos.y > -0.5, { pos: b0.pos.toArray(), alive: b0.alive });
    // the burst: Bravo players near it splatted through Bubble Guard / respawn invuln / a super jump's landing / a
    // Tidal Slam's 0.3 s; one behind the wall, a friendly, a pipe rider not; Alpha's ink painted
    fresh(); clearEv();
    const [b1, b2, b3] = [B[1], B[2], B[3]];
    put(b0, 3, 0.5); G.specials.giveShield(b0, 6, true);
    put(b1, -3.8, 0.2);                      // behind the Pond wall
    put(b2, 0.5, 3.4); b2.invuln = 1.1;      // 0.5 s after a respawn
    put(b3, -1.0, -3.3); b3.pipe = { phase: 'ride' };   // a pipe rider (aquarium stub)
    put(A[1], 2.5, -2.5);
    step(0.05);
    Kp.shell.add(0, 1000, A[0]);
    const spl = evs('splatted').map((e) => e.victim);
    R('B11 S4: the burst splats the other team within 4.5 m at once — through Bubble Guard and respawn invuln — credited to the last hitter',
      spl.includes(b0) && spl.includes(b2) && !b0.alive && !b2.alive && evs('splatted').every((e) => e.attacker === A[0] && e.cause === 'karp-burst'), { splatted: spl.map((a) => a.name), shield: b0.status.shield });
    R('B12 S4: … not behind the wall, not a friendly, not a pipe rider', b1.alive && A[1].alive && b3.alive, { b1: b1.alive, friend: A[1].alive, rider: b3.alive });
    const st0 = G.paint.regionStats(1.5, 0, 0, 2.5, 0, { own: 0, enemy: 0, empty: 0, n: 0 });
    R('B13 §2.2: the burst paints the bursting team\'s ink (3.5 m) and leaves it free; touched stays false (S42)', st0.own > 0.5 && Kp.phase === 'free' && !Kp.touched, { ink: st0, phase: Kp.phase, touched: Kp.touched });
    delete b3.pipe;
    // a super jump's landing and a Tidal Slam's 0.3 s don't save you either
    fresh(); clearEv();
    put(B[0], 2.8, 1.0); B[0].invuln = 0.4; B[0].superJumpState = null;   // (just landed: flight + 0.2 s)
    put(B[1], -1.0, 3.0); B[1].invuln = 0.3;                                // (0.1 s after a Tidal Slam's 0.3 s … its invuln)
    step(0.02);
    Kp.shell.add(0, 1000, A[0]);
    R('B14 S4: … and through a super jump landing\'s and a Tidal Slam\'s invuln', !B[0].alive && !B[1].alive, { b0: B[0].alive, b1: B[1].alive });
    // a re-formed shell: 500 hp; spheres() only while intact
    const sph1 = G.objTargets.spheres([]).length;
    put(A[2], 6, 6); step(0.02); carry(A[2], 6, 6); const sph2 = G.objTargets.spheres([]).length;
    A[2].splat(B[2], 'weapon'); step(0.05); const growing = Kp.shell.state, sph3 = G.objTargets.spheres([]).length;
    step(1.0);
    R('B15 S23: every drop re-forms a 500 hp shell (0.8 s to grow)', Kp.shell.hp === 500 && Kp.shell.state === 'intact' && growing === 'growing', { hp: Kp.shell.hp, growing });
    R('B16 §2.2: spheres() lists the shell only while intact (free / carried / growing: none)', sph1 === 0 && sph2 === 0 && sph3 === 0 && G.objTargets.spheres([]).length === 1, { free: sph1, carried: sph2, growing: sph3, intact: G.objTargets.spheres([]).length });
  }

  // ============================================================================ C. the pick-up and the carrier (S5, S20–S22, §2.3, §2.4)
  if (want('C')) {
    fresh(); clearEv();
    // the 0.25 s hold, then either team, radius 1.3
    put(B[0], 0.9, 0.4); step(0.05);
    Kp.shell.add(0, 1000, A[0]);   // (Alpha bursts it: Bravo's B[0] at 1 m is splatted — use an Alpha grabber)
    put(A[0], 1.0, 0.5); step(0.2); const early = Kp.holder;
    step(0.1);
    R('C1 S5: nobody picks it up for 0.25 s after the burst; then the player within 1.3 m does', early === null && Kp.holder === A[0], { early: early?.name, holder: Kp.holder?.name });
    fresh(); Kp.shell.add(1, 1000, B[1]); put(B[1], 1.25, 0); step(0.35);
    R('C2 S5: either team (Bravo after Bravo\'s burst)', Kp.holder === B[1], { holder: Kp.holder?.name });
    fresh(); Kp.shell.add(1, 1000, B[1]); put(B[1], 1.45, 0); step(0.4);
    R('C3 §2.3: not from 1.45 m (beyond 1.3)', Kp.holder === null, { holder: Kp.holder?.name });
    // from under the raised deck / through the wall
    fresh(); freeAt(V(9, 2.5, 28)); put(A[0], 9, 28, 0.02); step(0.5);
    const under = Kp.holder;
    fresh(); freeAt(V(-2.4, 0, 0)); put(A[0], -3.6, 0); step(0.5);
    R('C4 §2.3: not from the floor 2.5 m under it, nor through a wall', under === null && Kp.holder === null, { under: under?.name, wall: Kp.holder?.name });
    // mid-special: refused, with the prompt
    fresh(); clearEv(); const me = m.local; put(me, 0.5, 0.5); me.special = me.specialCost(); G.specials.start(me, 'jetpack'); freeAt(V(0.5, 0, 0.5)); step(0.4);
    const refused = Kp.holder !== me && evs('karp:refuse').some((e) => e.actor === me && e.why === 'special');
    G.specials.end(me, 'test'); put(me, 0.5, 0.5); step(0.2);
    R('C5 §2.3: refused while a special runs (Ink Jet), with "Finish your special first"; allowed once it ends', refused && Kp.holder === me, { refused, holder: Kp.holder?.name, hud: g.hud?.karp?.state?.().no });
    // Bubble Guard: their own ends (status and mesh) on the pick-up; copies they shared keep their time; a shared one on
    // the carrier stays; a teammate touching the carrier gets nothing from it
    fresh(); park();
    const [a0, a1, a2] = A;
    put(a0, 3, 3); put(a1, 3.6, 3); a0.special = a0.specialCost(); G.specials.start(a0, 'bubbler'); step(0.2);
    const shared = a1.status.shield;
    put(a1, -8, 3); step(0.05);
    freeAt(V(a0.pos.x, a0.pos.y, a0.pos.z)); step(2 / 60);
    const own = a0.status.shield, mesh = G.specials.shieldMeshes.has(a0), copyLeft = a1.status.shield;
    R('C6 §2.3: their own Bubble Guard ends at the pick-up (no shield, no mesh); the copy they shared keeps its time', Kp.holder === a0 && own === 0 && !mesh && shared > 3 && copyLeft > 3, { holder: Kp.holder?.name, own, mesh, shared, copyLeft });
    fresh(); park();
    put(a0, 3, 3); put(a1, 3.6, 3); a0.special = a0.specialCost(); G.specials.start(a0, 'bubbler'); step(0.2);
    put(a0, -8, -3); step(0.05);
    freeAt(V(a1.pos.x, a1.pos.y, a1.pos.z)); step(2 / 60);
    const keep = a1.status.shield;
    put(a2, a1.pos.x + 0.5, a1.pos.z); step(0.3);
    R('C7 §2.3, sprules: a Bubble Guard shared onto the carrier stays, and the carrier passes none on', Kp.holder === a1 && keep > 3 && !(a2.status.shield > 0), { holder: Kp.holder?.name, keep, passed: a2.status.shield });
    // the carrier's speeds: PLAYER × 0.8, whatever the weapon
    const speed = (a, setup, ms = 1.0, warm = 1.2) => { setup(); step(warm); const p0 = a.pos.clone(); step(ms); const d = Math.hypot(a.pos.x - p0.x, a.pos.z - p0.z) / ms; idle(a); return d; };
    const runs = {};
    for (const w of ['shooter', 'brolly', 'mitts', 'bow', 'blade']) {
      fresh(); const c0 = A[0]; c0.setWeapon(w); carry(c0, -3, 2); runs[w] = speed(c0, () => { c0.intent.move.set(0, 0, 1); });
    }
    R('C8 S21: a carrier runs at PLAYER × 0.8 (4.8 m/s) with the Splattershot, Brolly, Mitts, Bow and Blade alike', Object.values(runs).every((v) => Math.abs(v - PLAYER.runSpeed * K.speedMul) < 0.15), runs);
    A[0].setWeapon('shooter');
    // swimming, squid on dry ground, enemy ink, the air, the wall climb
    fresh(); const c0 = A[0];
    for (let z = 4; z <= 22; z += 1.2) G.paint.splat(V(-3, 0.2, z), 1.4, 0, { seed: 1 });
    carry(c0, -3, 4.5);
    const swim = speed(c0, () => { c0.intent.move.set(0, 0, 1); c0.intent.squid = true; }, 0.6, 0.5);
    c0.intent.squid = false;
    fresh(); carry(A[0], 3, 6);
    const dry = speed(A[0], () => { A[0].intent.move.set(0, 0, 1); A[0].intent.squid = true; });
    fresh(); for (let z = 4; z <= 18; z += 1.2) G.paint.splat(V(-5, 0.2, z), 1.4, 1, { seed: 2 });
    carry(A[0], -5, 4.5);
    const enemy = speed(A[0], () => { A[0].intent.move.set(0, 0, 1); });
    fresh(); carry(A[0], -2, 4); A[0].pos.y = 9; A[0].grounded = false; A[0].vel.set(0, 0, 0); A[0].intent.move.set(0, 0, 1);
    let air = 0; for (let i = 0; i < 40; i++) { dbg.step(1000 / 60); if (!A[0].grounded) air = Math.max(air, Math.hypot(A[0].vel.x, A[0].vel.z)); } idle(A[0]);
    fresh(); for (let y = 0.3; y < 3; y += 0.4) for (let x = -11.6; x <= -8.4; x += 0.8) G.paint.splat(V(x, y, 7.9), 0.7, 0, { seed: 3 });
    carry(A[0], -10, 6.9); A[0].intent.move.set(0, 0, 1); A[0].intent.squid = true;
    let climb = 0; for (let i = 0; i < 70; i++) { dbg.step(1000 / 60); if (A[0].climbing) climb = Math.max(climb, A[0].vel.y); } idle(A[0]);
    const S = { swim, dry, enemy, air, climb };
    const W = { swim: PLAYER.swimSpeed * 0.8, dry: PLAYER.squidDrySpeed * 0.8, enemy: PLAYER.enemyInkSpeed * 0.8, air: Math.max(PLAYER.runSpeed * 0.8, PLAYER.airMinSpeed), climb: PLAYER.climbSpeed * 0.8 };
    R('C9 S21: swim 9.44, squid on dry ground 2.32, wading enemy ink 1.52, the air 4.8, climbing 6.0 (× 0.8 each)', Object.keys(W).every((k) => Math.abs(S[k] - W[k]) < W[k] * 0.06 + 0.06), { got: S, want: W });
    // no super jump; both spawn barriers; the carrierBlock (a carrier pushed out to its edge; others pass)
    fresh(); carry(A[0], 2, -40);
    const sj = A[0].canSuperJump();
    put(A[0], 0.5, -57.6, 2.4); step(0.1); const own2 = Math.hypot(A[0].pos.x, A[0].pos.z + 60);
    put(A[0], 0.5, 57.6, 2.4); step(0.1); const foe = Math.hypot(A[0].pos.x, A[0].pos.z - 60);
    R('C10 S20: no super jump; both spawn barriers hold the carrier out (its own pad too)', !sj && own2 >= G.level.spawnBarrier - 0.05 && foe >= G.level.spawnBarrier - 0.05, { sj, own: own2, foe });
    put(A[0], -10.7, 26.2); step(0.1); const bp = A[0].pos.clone();
    const poly = KARPBOX_DEF.carrierBlock[0].poly;
    put(B[3], -10.7, 26.2); step(0.1);
    R('C11 §4.1: a carrierBlock pushes a carrier out to its edge (others pass through it)', !inPoly(poly, bp.x, bp.z) && Math.min(Math.abs(bp.x + 13.5), Math.abs(bp.x + 8), Math.abs(bp.z - 24), Math.abs(bp.z - 28.5)) < 0.2 && inPoly(poly, B[3].pos.x, B[3].pos.z), { carrier: bp.toArray(), other: B[3].pos.toArray() });
    // the kit: sub and special presses bonk; no special starts
    fresh(); clearEv(); carry(A[0], 2, -6);
    A[0].special = A[0].specialCost();
    A[0].intent.sub = true; step(0.1); A[0].intent.sub = false; step(0.1);
    A[0].intent.special = true; step(0.1); A[0].intent.special = false; step(0.05);
    const bonks = evs('sub:cantuse').filter((e) => e.actor === A[0] && e.kind === 'karp').length;
    R('C12 S20: sub and special presses bonk ("Can\'t use your kit while carrying"); no sub thrown, no special', bonks >= 2 && !A[0].specialActive && G.subs.items.filter((it) => it.owner === A[0]).length === 0 && !A[0].specialReady(), { bonks, special: A[0].specialActive?.id });
    // a Mitts carrier's fire + jump is a plain jump; a twins carrier's jump while firing and moving is no dodge roll
    fresh(); A[0].setWeapon('mitts'); carry(A[0], 2, -6); step(0.2);
    A[0].intent.fire = true; A[0].intent.jump = true; dbg.step(1000 / 60); const vyM = A[0].vel.y; const leap = !!(A[0].weaponRunner.kit && (A[0].weaponRunner.kit.leapT > 0 || A[0].weaponRunner.kit.charge > 0)); idle(A[0]); step(1);
    fresh(); A[0].setWeapon('twins'); carry(A[0], 2, -6); step(0.2);
    A[0].intent.fire = true; A[0].intent.move.set(1, 0, 0); step(0.1); A[0].intent.jump = true; dbg.step(1000 / 60); const vyT = A[0].vel.y; const rolled = A[0].weaponRunner.dodgeT > 0 || !!A[0].weaponRunner.dodge; idle(A[0]); step(1);
    A[0].setWeapon('shooter');
    R('C13 §2.4: a Mitts carrier\'s fire + jump is a plain jump (no leap); a Twins carrier\'s is no dodge roll', Math.abs(vyM - PLAYER.jumpVel) < 0.6 && !leap && Math.abs(vyT - PLAYER.jumpVel) < 0.6 && !rolled, { vyM, leap, vyT, rolled });
    // the gauge: nothing raises it (turf, a direct gain, a teammate's Drainbow draining a foe); an enemy Drainbow lowers it
    fresh(); carry(A[0], 2, -6); A[0].special = 50; Kp.lateUpdate(); A[0].carry.sp = 50;
    A[0].addTurf(400); step(0.05); const t1 = A[0].special;
    A[0].special += 30; step(0.05); const t2 = A[0].special;
    put(A[1], 3, -6); put(B[0], 4.5, -6); step(0.05); A[1].special = A[1].specialCost(); G.specials.start(A[1], 'drainbow'); step(3); const t3 = A[0].special;
    G.specials.end(A[1], 'test'); step(0.1);
    put(B[1], 2.2, -5); B[1].special = B[1].specialCost(); G.specials.start(B[1], 'drainbow'); A[0].special = 50; A[0].carry.sp = 50; step(3); const t4 = A[0].special;
    G.specials.end(B[1], 'test');
    R('C14 S22: the carrier\'s gauge cannot rise (inking, any gain, a teammate\'s draining Drainbow); an enemy Drainbow lowers it', t1 === 50 && t2 === 50 && t3 === 50 && t4 < 50, { t1, t2, t3, t4 });
  }

  // ============================================================================ D. scoring (S32–S37, §2.8, §3.4)
  if (want('D')) {
    fresh(); const c = A[0]; carry(c, 0, 1.5);
    const cs = []; for (let z = 2; z <= 18; z += 4) { c.intent.move.set(0, 0, 1); step(0.85); cs.push(Kp.count[0]); } idle(c);
    R('D1 §2.8: the count falls as the carrier walks toward their Gate', cs.every((v, i) => i === 0 || v < cs[i - 1]) && cs[cs.length - 1] < 100, { counts: cs });
    // walking round the weir: capped at its count
    put(c, 5, 18); Kp.base = null; step(0.1);
    for (let z = 18; z < 40; z += 0.8) { put(c, 5, z); Kp.base = null; step(2 / 60); }
    const capped = Kp.count[0], cap = Kp.weirs[0][0].count;
    R('D2 S36: past the weir without landing it: the count stops at the weir\'s count', capped === cap, { count: capped, cap });
    put(c, 0, 25); Kp.base = null; step(0.1); c.intent.move.set(0, 0, 1); step(1.5); idle(c);
    const W = Kp.weirs[0][0];
    R('D3 S33, S34: walking onto the weir plants it — released, set on the weir, the weir lowered, the Gate up, a fresh shell, count = the weir\'s',
      !Kp.holder && !c.carry && Kp.lowered[0] && Kp.gateUp[0] && !Kp.gateUp[1] && (Kp.phase === 'reforming' || Kp.phase === 'shielded') && Kp.pos.distanceTo(W.pos) < 0.05 && Kp.count[0] === W.count && Kp.shell.hp === 500, { holder: Kp.holder?.name, lowered: Kp.lowered, gateUp: Kp.gateUp, phase: Kp.phase, count: Kp.count, weir: W.count });
    // the knockout: in the risen Gate (radius 1.7)
    step(1); Kp.shell.add(0, 600, c); step(0.3); carry(c, 0, 26); const gp = Kp.gates[0].pos;
    put(c, gp.x, gp.z - 2.2); Kp.base = null; step(0.1); const outside = Kp.winner;
    put(c, gp.x, gp.z - 1.0); Kp.base = null; step(0.1);
    R('D4 §2.8: into the risen Gate (within 1.7 m) is a knockout; 2.2 m out is not', outside == null && Kp.winner === 0 && Kp.reason === 'knockout' && Kp.count[0] === 0, { outside, winner: Kp.winner, reason: Kp.reason, count: Kp.count });
    // a sealed Gate: nothing
    fresh(); carry(c, 0, 40); put(c, Kp.gates[0].pos.x, Kp.gates[0].pos.z); Kp.base = null; step(0.2);
    R('D5 S36: a sealed Gate (no weir landed) is no knockout', Kp.winner == null, { winner: Kp.winner });
    // best never rises
    fresh(); carry(c, 0, 10); step(0.1); const b0 = Kp.count[0]; put(c, 0, 2); Kp.base = null; step(0.3);
    R('D6 §2.8: the best count never rises (walking back)', Kp.count[0] === b0 && b0 < 100, { before: b0, after: Kp.count[0] });
    // under the raised weir (two-weir data): no plant from 2.5 m below; either weir lowers both; the cap is the higher;
    // the other team's weirs stay up
    fresh(KARPBOX_TWO); carry(c, 12, 27); for (let z = 26.4; z <= 29.6; z += 0.4) { put(c, 9, z, 0.02); Kp.base = null; step(2 / 60); }
    const underNo = !Kp.lowered[0] && Kp.holder === c;
    const capTwo = Kp.capCount(0), wc = Kp.weirs[0].map((w) => w.count);
    put(c, 9, 25.5, floorY(9, 25.5, 3)); Kp.base = null; c.intent.move.set(0, 0, 1); step(1.5); idle(c);
    R('D7 S33 (two weirs): walking under the raised weir doesn\'t plant it; the cap is the higher count; landing either lowers BOTH of the team\'s weirs (not the other team\'s)',
      underNo && capTwo === Math.max(...wc) && Kp.lowered[0] && !Kp.lowered[1] && Kp.gateUp[0], { underNo, cap: capTwo, counts: wc, lowered: Kp.lowered });
    // the hop onto the lane's 1.5 m step: the count drops by the shortcut, progress never falls (no false retreat)
    fresh(); carry(c, -17, 13.2); step(0.2); Kp.base = null;
    const before = Kp.field.fieldAt(0, c.pos).d, P0 = Kp.L[0] - before;
    put(c, -17, 14.7, 1.5); Kp.base = null; step(0.2);
    const after = Kp.field.fieldAt(0, c.pos).d, plain = Kp.field.plainD[0][Kp.field.ownNode(V(-17, 0, 13.2))];
    R('D8 §3.2: the field counts the hop — the foot of the step reads via it (not the long way round), and hopping up never lowers progress',
      before < plain - 8 && Kp.L[0] - after >= P0 - 0.01 && !c.carry.j.ret, { before, after, withoutHops: plain, P0, P1: Kp.L[0] - after });
    // the continuity clamp: a reading 10 m closer than possible is refused, the next real one accepted
    fresh(); carry(c, 0, 6); step(0.2); const cl0 = Kp.stats.clamped, n0 = Kp.count[0];
    Kp._reading(c, 0, V(0, 0, 16), Kp.clock);
    const cl1 = Kp.stats.clamped, n1 = Kp.count[0];
    c.intent.move.set(0, 0, 1); step(0.3); idle(c);
    R('D9 §3.4: the continuity clamp refuses a reading 10 m closer than a carrier can move (counted), and accepts the next real one', cl1 === cl0 + 1 && n1 === n0 && Kp.count[0] < n0, { clamped: cl1 - cl0, n0, n1, after: Kp.count[0] });
    // winning(): the lower count; a tie → the earlier reachT; 100 / 100 → the coin
    fresh(); Kp.count = [40, 60]; const w1 = Kp.winning(); Kp.count = [50, 50]; Kp.reachT = [9, 4]; const w2 = Kp.winning(); Kp.count = [100, 100]; Kp.coin = 1; const w3 = Kp.winning(); Kp.coin = 0; const w4 = Kp.winning();
    R('D10 S37: winning() — the lower count; equal → whoever got there first; 100 / 100 → the hidden coin', w1 === 0 && w2 === 1 && w3 === 1 && w4 === 0, { w1, w2, w3, w4 });
  }

  // ============================================================================ E. the fuse (S8–S13, S50)
  if (want('E')) {
    fresh(); const c = A[0]; carry(c, 0, 6); step(5); const f5 = Kp.fuse;
    c.splat(B[0], 'weapon'); step(1.0); put(c, Kp.pos.x, Kp.pos.z); step(0.05); Kp.shell.add(0, 600, A[1]); step(0.35);
    const re = Kp.holder === c ? Kp.fuse : null;
    R('E1 S8: 60 s per pick-up — fresh after a re-pick', Math.abs(f5 - 55) < 0.05 && re !== null && re > 59.6, { f5, re, holder: Kp.holder?.name });
    // retreat on the own half: ×3 at 8 m back, ×1 again within 3 m; off on the enemy half
    fresh(); carry(c, 5, -20); step(0.2);
    put(c, 5, -27.5); Kp.base = null; step(0.15); const r7 = Kp.rate;
    put(c, 5, -28.6); Kp.base = null; step(0.15); const r8 = Kp.rate, why8 = c.carry.j.why;
    put(c, 5, -24.2); Kp.base = null; step(0.15); const r4 = Kp.rate;
    put(c, 5, -22.4); Kp.base = null; step(0.15); const r2 = Kp.rate;
    R('E2 S10, S11: own half — 7.5 m back ×1, 8.6 m back ×3 ("DON\'T RETREAT!"), 4.2 m back still ×3, within 3 m ×1', r7 === 1 && r8 === 3 && why8 === 'retreat' && r4 === 3 && r2 === 1, { r7, r8, why8, r4, r2 });
    fresh(); carry(c, 0, 20); step(0.2); put(c, 0, 8); Kp.base = null; step(0.2);
    R('E3 S10: nothing on the enemy half (12 m back)', Kp.rate === 1, { rate: Kp.rate });
    // the own free zone ×3 ("BAZOOKARP-FREE ZONE!"), not the enemy's
    fresh(); carry(c, 13, -43); step(0.2); const zr = Kp.rate, zw = c.carry.j.why;
    put(c, -13, 43); Kp.base = null; step(0.2); const ez = Kp.rate;
    R('E4 S12, S51: ×3 in its own Carp-Free Zone; nothing in the enemy\'s', zr === 3 && zw === 'zone' && ez === 1, { own: zr, why: zw, enemy: ez });
    // the Carp Blast: the carrier and teammates within 4.5 m with a line (spawn invuln too), not at 5 m or behind the
    // wall; enemy ink 5 m; own half → the Pond
    fresh(); clearEv(); carry(c, -1.5, -0.6); step(0.1);
    put(A[1], 2.0, -0.6); A[1].invuln = 1.2; put(A[2], 3.6, -0.6); put(A[3], -4.0, -0.4);
    step(0.02); Kp.fuse = 0.02; step(0.1);
    const ink = G.paint.regionStats(-1.5, 0, -0.6, 3.5, 0, { own: 0, enemy: 0, empty: 0, n: 0 });
    R('E5 S8: the Carp Blast splats the carrier and a teammate at 3.5 m (even with spawn invuln) — not one at 5.1 m or behind the wall',
      !c.alive && !A[1].alive && A[2].alive && A[3].alive && evs('splatted').some((e) => e.victim === c && e.cause === 'karp-fuse'), { carrier: c.alive, near: A[1].alive, far: A[2].alive, wall: A[3].alive });
    R('E6 S8: … paints the other team\'s ink (5 m)', ink.enemy > 0.5, { ink });
    R('E7 S13: on its own half → the Bazookarp flies back to the Pond', Kp.phase === 'resetting' && evs('karp:reset').some((e) => e.why === 'fuse'), { phase: Kp.phase });
    step(2.5);
    R('E8 §2.6: the reset lands in the Pond and re-forms a 500 hp shell there', Kp.pos.length() < 0.3 && Kp.shell.hp === 500 && (Kp.phase === 'shielded' || Kp.phase === 'reforming'), { pos: Kp.pos.toArray(), phase: Kp.phase });
    fresh(); carry(c, 2, 14); step(0.1); const p14 = c.pos.clone(); Kp.fuse = 0.02; step(0.1);
    R('E9 S13: on the enemy half → it drops there (the shell re-forms where the carrier blew)', Kp.phase === 'reforming' && Kp.pos.distanceTo(p14) < 4.5 && Kp.field.halfAt(Kp.pos) === 1, { phase: Kp.phase, pos: Kp.pos.toArray(), from: p14.toArray() });
    fresh(); carry(c, 13, -43); step(0.1); Kp.fuse = 0.02; step(0.1);
    R('E10 S50: in its own free zone → the Pond', Kp.phase === 'resetting', { phase: Kp.phase });
  }

  // ============================================================================ F. drops (S23, S25, S26, S50, S51, §2.7)
  if (want('F')) {
    const zoneB = KARPBOX_DEF.freeZones[0].poly;
    fresh(); const c = A[0]; carry(c, -2, 10); step(0.1); c.splat(B[0], 'weapon'); step(0.05);
    const d1 = Kp.pos.clone();
    fresh(); carry(c, -2, 10); step(0.1); c.pos.y = 2.0; c.grounded = false; c.vel.set(0, 3, 0); dbg.step(1000 / 60); c.splat(B[0], 'weapon'); step(0.05);
    const d2 = Kp.pos.clone();
    R('F1 S23: a splat drops it at the floor under the carrier (from a jump too)', Math.hypot(d1.x + 2, d1.z - 10) < 1.2 && Math.abs(d1.y) < 0.2 && Math.hypot(d2.x + 2, d2.z - 10) < 1.2 && Math.abs(d2.y) < 0.2, { d1: d1.toArray(), d2: d2.toArray() });
    fresh(); carry(c, 15.5, 37); step(0.1); c.splat(B[0], 'weapon'); step(0.05);
    const pier = Kp.pos.clone(), pn = Kp.restNode;
    R('F2 §2.7: a splat on the 2 m pier rests it on wide floor, not the pier', !(pier.x > 13.9 && pier.x < 17.1 && pier.z > 35.9 && pier.z < 38.1) && pn >= 0 && Kp.field.wide[pn] === 1 && pier.distanceTo(V(15.5, 0, 37)) < 6, { pos: pier.toArray() });
    fresh(); carry(c, -13, 43); step(0.1); c.splat(B[0], 'weapon'); step(0.05);
    const zp = Kp.pos.clone(), edge = Math.min(Math.abs(zp.x + 6), Math.abs(zp.z - 30));
    R('F3 S51: an Alpha carrier splatted mid Bravo\'s big Carp-Free Zone: just outside it (≤ 1 m from its edge), on Bravo\'s half — never the Pond',
      Kp.phase === 'reforming' && !inPoly(zoneB, zp.x, zp.z) && edge <= 1.0 && Kp.field.halfAt(zp) === 1, { pos: zp.toArray(), edge, phase: Kp.phase });
    // the rest flags: never in a spawn zone, within 9.7 m of a pad, on a roof (no node), in the car's whole corridor, by
    // the pod plot, in a carrierBlock or a free zone, within 2.7 m of a Gate
    fresh();
    const ro = Kp.field.states[0].restOk, nodes = G.nav.nodes, pads = G.level.spawnPads, bad = [];
    const corridor = new Set(); for (const car of m.movers?.cars || []) for (const [, id] of car.nodes) corridor.add(id);
    const podN = new Set(); for (const p of m.pods?.pods || []) for (const id of p.nav || []) podN.add(id);
    const allZones = [...Kp.R.zones[0], ...Kp.R.zones[1]], blocks = Kp.R.carrierBlock;
    for (let i = 0; i < nodes.length; i++) {
      if (!ro[i]) continue;
      const n = nodes[i];
      if (n.zone >= 0) bad.push(['zone', i]);
      if (pads.some((p) => Math.hypot(n.x - p.x, n.z - p.z) < 9.7)) bad.push(['pad', i]);
      if (corridor.has(i)) bad.push(['car', i]);
      if (podN.has(i)) bad.push(['pod', i]);
      if (allZones.some((z) => inPoly(z.poly, n.x, n.z) && n.y >= z.y0 - 0.25 && n.y <= z.y1 + 0.25)) bad.push(['freezone', i]);
      if (blocks.some((z) => inPoly(z.poly, n.x, n.z) && n.y >= z.y0 - 0.25 && n.y <= z.y1 + 0.25)) bad.push(['block', i]);
      if (Kp.gates.some((q) => Math.hypot(n.x - q.pos.x, n.z - q.pos.z) < 2.7 && Math.abs(n.y - q.pos.y) < 1.6)) bad.push(['gate', i]);
    }
    R('F4 §2.7: no resting spot in a spawn zone, within 9.7 m of a pad, in the car\'s whole corridor, on the pod plot, in a free zone or carrierBlock, or within 2.7 m of a Gate',
      bad.length === 0 && corridor.size > 0 && podN.size > 0, { bad: bad.slice(0, 8), corridor: corridor.size, pod: podN.size });
    // dynamic: 2.8 m round a STANDING weir (a splat right by it rests further off)
    fresh(); carry(c, 0, 25.5); step(0.1); c.splat(B[0], 'weapon'); step(0.05);
    const byWeir = Math.hypot(Kp.pos.x, Kp.pos.z - 28);
    R('F5 §2.7: never within 2.8 m of a standing weir', byWeir >= 2.8 || Math.abs(Kp.pos.y - 1.32) > 1.6, { dist: byWeir, pos: Kp.pos.toArray() });
    // falls: last footing on the enemy half → there; on its own half → the Pond
    fresh(); carry(c, 13.4, 25); step(0.3); c.pos.set(15.5, -1.4, 25); c.vel.set(0, -2, 0); c.grounded = false; step(0.2);
    const fallE = { phase: Kp.phase, pos: Kp.pos.toArray(), half: Kp.field.halfAt(Kp.pos) };
    fresh(); carry(c, -13.4, -25); step(0.3); c.pos.set(-15.5, -1.4, -25); c.vel.set(0, -2, 0); c.grounded = false; step(0.2);
    const fallO = { phase: Kp.phase, evs: evs('karp:reset').length };
    R('F6 S25, S26: a fall with its last footing on the enemy half rests it by that footing (that half); on its own half → the Pond',
      fallE.phase === 'reforming' && fallE.half === 1 && Math.hypot(fallE.pos[0] - 13.4, fallE.pos[2] - 25) < 4 && fallO.phase === 'resetting', { fallE, fallO });
    fresh(); clearEv(); carry(c, 13, -43); step(0.1); c.splat(B[0], 'weapon'); step(0.05);
    R('F7 S50: splatted in its own free zone → the Pond', Kp.phase === 'resetting' && evs('karp:reset').some((e) => e.why === 'zone'), { phase: Kp.phase });
    // moved off a covered spot: resting in the car's corridor when it runs → moved (a 0.8 s re-form)
    fresh(); const cid = [...corridor][Math.floor(corridor.size / 2)], cn = nodes[cid];
    restAt(V(cn.x, cn.y, cn.z), cid); const mv0 = Kp.stats.moves;
    step(1.0);
    R('F8 §2.7: resting in the car\'s path → moved off it (a fresh 0.8 s re-form)', Kp.stats.moves > mv0 && !corridor.has(Kp.restNode), { moves: Kp.stats.moves - mv0, node: Kp.restNode, phase: Kp.phase });
    // the lazy clear rays
    fresh(); const r0 = Kp.field.stats.clearRays; Kp.field.dropSpot(V(-2, 0, 30), 1, null); const rays = Kp.field.stats.clearRays - r0;
    R('F9 §2.7: the clear test is lazy (one search < 500 rays)', rays < 500, { rays });
    // a carrier who leaves the room (humans-only) → dropped where it was (offline: a removed actor) — LAST: it removes an actor
    fresh(); const gone = B[3]; carry(gone, -2, -12); step(0.1); m.removeActor(gone); step(0.05);
    R('F10 §2.6: a carrier who leaves → it drops where it was', Kp.phase === 'reforming' && !Kp.holder && Kp.pos.distanceTo(V(-2, 0, -12)) < 4, { phase: Kp.phase, pos: Kp.pos.toArray() });
  }

  // ============================================================================ G. overtime (S38–S40)
  const B4 = B.filter((a) => m.actors.includes(a));
  if (want('G')) {
    const c = A[0], L = B4[0];
    // S38a: the winning team's carrier lost it with < 15 s left
    const s38a = (left) => { fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [60, 100]; Kp.reachT = [5, 0]; carry(c, 0, 10); m.time = left; c.splat(L, 'weapon'); m.time = 0.02; step(0.1); return { ot: Kp.overtime, winner: Kp.winner, reason: Kp.reason, why: Kp.stats.otStart }; };
    const a149 = s38a(14.9), a150 = s38a(15.0);
    R('G1 S38a: the winning team\'s carrier splatted with 14.9 s left → overtime; with 15.0 s → it ends (strict)', a149.ot && a149.why === 'dropped' && a149.winner == null && !a150.ot && a150.winner === 0 && a150.reason === 'time', { a149, a150 });
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(L, 0, -10); m.time = 0.02; step(0.1);
    R('G2 S38b: the losing team holds it at time-up → overtime', Kp.overtime && Kp.stats.otStart === 'held' && Kp.winner == null, { ot: Kp.overtime });
    // (the plant lands in the frame the carrier steps onto the weir; the engine runs before the clock ticks that frame)
    const s38c = (left) => { fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [30, 100]; carry(L, 5, -20); m.time = left; put(L, 0, -28, 1.32); Kp.base = null; step(1 / 60); const planted = Kp.lowered[1]; const pl = Kp.lastPlant?.left; m.time = 0.02; step(0.1); return { planted, pl, ot: Kp.overtime, why: Kp.stats.otStart, winner: Kp.winner }; };
    const c49 = s38c(4.9), c50 = s38c(5.0);
    R('G3 S38c: the losing team planted with < 5 s left → overtime; with ≥ 5 s → it ends', c49.planted && c49.pl < 5 && c49.ot && c49.why === 'planted' && c50.planted && c50.pl >= 5 && !c50.ot && c50.winner === 0, { c49, c50 });
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(c, 0, 10); m.time = 0.02; step(0.1);
    R('G4 S38: otherwise no overtime (the winning team holds it at time-up)', !Kp.overtime && Kp.winner === 0 && Kp.reason === 'time', { winner: Kp.winner, reason: Kp.reason });
    // S39a: the winning team takes it back
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(L, 0, -10); m.time = 0.02; step(0.1); L.splat(c, 'weapon');
    R('G5a S39c: the losing team\'s carrier splatted in overtime → the winning team wins (stopped)', Kp.winner === 0 && Kp.reason === 'stopped', { winner: Kp.winner, reason: Kp.reason });
    fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [60, 100]; Kp.reachT = [5, 0]; carry(c, 0, 10); m.time = 10; c.splat(L, 'weapon'); m.time = 0.02; step(0.1);
    step(1.0); Kp.shell.add(0, 600, A[1]); put(A[1], Kp.pos.x, Kp.pos.z); step(0.4);
    R('G5 S39a: the winning team picks it up in overtime → it wins (retake)', Kp.winner === 0 && Kp.reason === 'retake', { winner: Kp.winner, reason: Kp.reason });
    // S39b: the 10 s window — paused while re-forming / resetting, then the losing team didn't grab it → no-pickup
    fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [60, 100]; Kp.reachT = [5, 0]; carry(c, 0, 10); m.time = 10; c.splat(L, 'weapon'); m.time = 0.02; step(0.1);
    const w0 = Kp.otWin.left; step(0.7); const w1 = Kp.otWin.left; step(9.0); const w2 = Kp.otWin.left, during = Kp.winner; step(1.6);
    R('G6 S39b: the 10 s window pauses while the shell re-forms, then counts down; not grabbed → the winning team wins (no-pickup)', w0 > 9.9 && w1 > 9.8 && w2 < 1.6 && during == null && Kp.winner === 0 && Kp.reason === 'no-pickup', { w0, w1, w2, winner: Kp.winner, reason: Kp.reason });
    // S38c's window counts from the plant; a losing-team plant in overtime opens a new one
    fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [30, 100]; carry(L, 5, -20); m.time = 4.5; put(L, 0, -28, 1.32); Kp.base = null; step(1 / 60);
    const tPlant = Kp.lastPlant?.left; step(4.6); const winS38c = Kp.otWin.left, wantW = 10 - (tPlant - K.shell.reform);
    R('G7 S39b: an S38c window counts from the plant (paused while it re-forms) — at time-up it has 10 − (4.5 − 0.8) s left', Kp.overtime && Kp.stats.otStart === 'planted' && Math.abs(winS38c - wantW) < 0.25, { left: winS38c, want: wantW, plantedWithLeft: tPlant });
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [30, 100]; Kp.reachT = [5, 0]; carry(L, 0, -20); m.time = 0.02; step(0.1);
    const g8 = []; L.intent.move.set(0, 0, -1); for (let i = 0; i < 120; i++) { dbg.step(1000 / 60); if (i % 15 === 0) g8.push([+L.pos.z.toFixed(2), +L.pos.y.toFixed(2), L.alive, Kp.holder === L, +L.vel.z.toFixed(2), m.state]); } idle(L);
    R('G8 S39b: a losing-team plant in overtime opens a fresh 10 s window', Kp.lowered[1] && Kp.otWin.open && Kp.otWin.left > 9.5 && Kp.winner == null, { lowered: Kp.lowered, win: Kp.otWin.left, count: Kp.count, g8 });
    // S39c by the fuse and a fall
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(L, 0, -10); m.time = 0.02; step(0.1); Kp.fuse = 0.02; step(0.1);
    const fuseEnd = [Kp.winner, Kp.reason];
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(L, 13.4, 25); step(0.2); m.time = 0.02; step(0.1); L.pos.set(15.5, -1.4, 25); L.vel.set(0, -2, 0); L.grounded = false; step(0.2);
    R('G9 S39c: … by the fuse, and by a fall', fuseEnd[0] === 0 && fuseEnd[1] === 'stopped' && Kp.winner === 0 && Kp.reason === 'stopped', { fuseEnd, fall: [Kp.winner, Kp.reason] });
    // S39d: strictly below wins; equal isn't enough
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [80, 100]; Kp.reachT = [5, 0]; carry(L, 0, -2); m.time = 0.02; step(0.1);
    Kp.count[1] = 80; step(0.05); const eq = Kp.winner;
    const g10 = []; L.intent.move.set(0, 0, -1); for (let i = 0; i < 132; i++) { dbg.step(1000 / 60); if (i % 15 === 0) g10.push([+L.pos.x.toFixed(2), +L.pos.z.toFixed(2), +L.pos.y.toFixed(2), L.alive, Kp.holder === L, Kp.count[1], Kp.stats.clamped]); } idle(L);
    R('G10 S39d: the losing team carried past the winning team\'s count wins (comeback); an equal count isn\'t enough', eq == null && Kp.winner === 1 && Kp.reason === 'comeback', { eq, winner: Kp.winner, reason: Kp.reason, count: Kp.count, g10, ot: Kp.overtime, losing: Kp.otLosing });
    fresh(KARPBOX_DEF, { time: 1 }); Kp.count = [60, 100]; carry(L, 0, -10); m.time = 0.02; step(0.1); Kp.overtimeT = K.overtimeMax - 0.05; Kp.fuse = 99; step(0.2);
    R('G11: the 300 s safety cap → the winning team (overtime-cap)', Kp.winner === 0 && Kp.reason === 'overtime-cap', { winner: Kp.winner, reason: Kp.reason });
    fresh(KARPBOX_DEF, { time: 1, coin: 1 }); m.time = 0.02; step(0.1);
    R('G12 S40: never touched → the coin team wins (untouched), no overtime; the result names the coin', !Kp.overtime && Kp.winner === 1 && Kp.reason === 'untouched' && Kp.resultCoin() === 1, { winner: Kp.winner, reason: Kp.reason });
    // the LoopWire guest stub: claims stamped before the window's close count for claimAge after it; a declined grant
    // leaves touched, S39c and the window as they were
    const stub = (ts, late) => {
      fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [60, 100]; Kp.reachT = [5, 0]; carry(c, 0, 10); m.time = 10; c.splat(L, 'weapon'); m.time = 0.02; step(0.1);
      step(1); Kp.shell.add(1, 600, B4[1]); Kp.otWin.left = 0.5; step(0.55);
      const closeT = Kp.otWin.closeT;
      L.remote = true; put(L, Kp.pos.x + 0.2, Kp.pos.z); step(late);
      Kp.wire._emit('claim', { actor: L, ts: closeT + ts });
      step(2 / 60); const got = Kp.holder === L; L.remote = false; step(0.5);
      return { got, closeT, winner: Kp.winner, reason: Kp.reason };
    };
    const early = stub(-0.2, 0.3), lateC = stub(+0.05, 0.1);
    R('G13 §7.3: a claim stamped 0.2 s before the window closed, arriving 0.3 s after, is granted (overtime goes on); one stamped after the close is refused (no-pickup)',
      early.got && early.winner == null && !lateC.got && lateC.winner === 0 && lateC.reason === 'no-pickup', { early, late: lateC });
    fresh(KARPBOX_DEF, { time: 30 }); Kp.count = [60, 100]; Kp.reachT = [5, 0]; carry(c, 0, 10); m.time = 10; c.splat(L, 'weapon'); m.time = 0.02; step(0.1);
    step(1); Kp.shell.add(1, 600, B4[1]); step(0.3);
    const before = { touched: Kp.touched, lc: Kp.lastCarrier, win: Kp.otWin.left };
    L.remote = true; put(L, Kp.pos.x + 0.2, Kp.pos.z); Kp.wire._emit('claim', { actor: L, ts: Kp.wire.now() }); step(2 / 60);
    const held = Kp.holder === L;
    Kp.wire._emit('decline', { actor: L, q: Kp.q }); L.remote = false;
    R('G14 §7.3: a declined grant (kx) is undone — free again, touched, the last carrier and the window as they were; overtime goes on',
      held && !Kp.holder && Kp.phase === 'free' && Kp.touched === before.touched && Kp.lastCarrier === before.lc && Math.abs(Kp.otWin.left - before.win) < 0.05 && Kp.winner == null, { held, phase: Kp.phase, win: Kp.otWin.left, before: before.win });
  }

  // ============================================================================ H. passive special charge (S43–S45)
  if (want('H')) {
    fresh(); const c = A[0]; carry(c, 0, 6);
    for (const a of m.actors) if (a !== c) { a.special = 0; }
    step(2.0);
    const bGain = B4.filter((a) => a.alive).map((a) => a.special), aGain = A.filter((a) => a !== c).map((a) => a.special);
    R('H1 S43: while Alpha holds it, Bravo\'s gauges fill at 3 p/s; Alpha\'s don\'t', bGain.every((v) => Math.abs(v - 6) < 0.25) && aGain.every((v) => v < 0.01), { bravo: bGain, alpha: aGain });
    fresh(); Kp.count = [60, 100]; Kp.reachT = [3, 0];
    for (const a of m.actors) a.special = 0;
    step(2.0);
    R('H2 S45: while nobody holds it, the losing team (Bravo, 100 vs 60) fills at 3 p/s', B4.every((a) => Math.abs(a.special - 6) < 0.25) && A.every((a) => a.special < 0.01), { bravo: B4.map((a) => a.special), alpha: A.map((a) => a.special) });
    fresh(); for (const a of m.actors) a.special = 0; step(2.0);
    R('H3 §2.9: nobody gains at 100 / 100 (the coin stays hidden)', m.actors.every((a) => a.special < 0.01), { gauges: m.actors.map((a) => a.special) });
  }

  // ============================================================================ I. the field reading (§3.2)
  if (want('I')) {
    fresh(); const Fi = F(), D = Fi.D[0];
    const nIn = Fi.ownNode(V(6.5, 0, 15.5)), nOut = Fi.ownNode(V(4.5, 0, 15.5));
    const rIn = Fi.fieldAt(0, V(6.15, 0, 15.5)), rOut = Fi.fieldAt(0, V(5.1, 0, 15.5));
    R('I1 §3.2: by the 0.3 m thin wall each side reads its own walk (they differ by > 20 m)', nIn >= 0 && nOut >= 0 && Math.abs(D[nIn] - D[nOut]) > 20 && Math.abs(rIn.d - D[nIn]) < 1.2 && Math.abs(rOut.d - D[nOut]) < 1.2, { dIn: D[nIn], dOut: D[nOut], rIn: rIn?.d, rOut: rOut?.d });
    let worst = 0, n = 0;
    for (let i = 0; i < G.nav.nodes.length; i++) {
      if (!Fi.okN[i] || !Number.isFinite(D[i])) continue;
      const q = G.nav.nodes[i], r = Fi.fieldAt(0, V(q.x, q.y, q.z));
      if (!r) { worst = Infinity; continue; }
      worst = Math.max(worst, Math.abs(r.d - D[i])); n++;
    }
    R('I2 §3.2: at every valid node the reading is that node\'s D (≤ 0.05 m)', worst <= 0.05, { worst, n });
    const air = Fi.fieldAt(0, V(0, 2.0, 10)), wall = Fi.fieldAt(0, V(-10, 1.6, 7.6));
    R('I3 §3.2: airborne / climbing — no own node (the count keeps its last value)', air === null && wall === null, { air, wall });
    Kp.fieldSwitch(1); const lane = Fi.fieldAt(0, V(-17, 0, 10)); Kp.fieldSwitch(0); const lane0 = Fi.fieldAt(0, V(-17, 0, 10));
    R('I4 §3.2 step 6: a node the current state removes gives no own node', lane === null && lane0 !== null, { inState1: lane, inState0: lane0?.d });
  }

  // ============================================================================ J. field-state switches (§3.3, §5.2)
  if (want('J')) {
    fresh(); const c = A[0];
    // a still carrier just behind the band state 1 cuts (its walk grows by far more than 8 m): never ×3
    carry(c, 0, -21); step(0.3);
    const D0 = Kp.field.fieldAt(0, c.pos).d;
    Kp.fieldSwitch(1); const markNow = c.carry.j.mark; step(2 / 60); const markNext = c.carry.j.mark;
    const D1 = Kp.field.fieldAt(0, c.pos).d; step(1.0);
    R('J1 §3.3: a carrier standing still across a switch that lengthens its walk by > 8 m never gets ×3 (the mark resets, re-read next frame)',
      D1 - D0 > 8 && Kp.rate === 1 && Number.isNaN(markNow) && Math.abs(markNext - (Kp.L[0] - D1)) < 0.01 && c.carry.j.half === 0, { D0, D1, rate: Kp.rate, markNow, markNext });
    fresh(); carry(c, 5, -30); step(0.2); put(c, 5, -39); Kp.base = null; step(0.15); const r3 = Kp.rate;
    const cl = Kp.stats.clamped; Kp.fieldSwitch(1); const base = Kp.base; step(0.1);
    R('J2 §3.3: a carrier at ×3 retreat at the switch goes back to ×1; the host\'s clamp baseline resets (no rejection)', r3 === 3 && Kp.rate === 1 && Kp.stats.clamped === cl && base === null, { r3, after: Kp.rate, base });
    // a Bazookarp resting on a node state 1 removes is moved at the warning
    fresh(); const id = G.nav.nearest(V(0, 0, -19), 0.6), n = G.nav.nodes[id];
    restAt(V(n.x, n.y, n.z), id); Kp.fieldWarn(1); step(0.05);
    R('J3 §2.7: resting on ground the coming state takes away → moved at the warning', Kp.restNode !== id && Kp.restNode >= 0 && Kp.field.states[1].restOk[Kp.restNode], { from: id, to: Kp.restNode });
  }

  // ============================================================================ K. the Carp Shot (S14–S19, S27, S28, §2.5)
  if (want('K')) {
    const KG = G.karpGun;
    fresh(); const c = A[0]; carry(c, 0, -30); step(0.1);
    // a tap fires at 0.15 s with c = 0; a full charge in 1.2 s
    c.intent.fire = true; dbg.step(1000 / 60); c.intent.fire = false; const n0 = KG.stats.fired[0]; step(0.06); const tapEarly = KG.stats.fired[0]; step(0.12);
    R('K1 §2.5: a tap fires a Splash at 0.15 s (never lost)', tapEarly === n0 && KG.stats.fired[0] === n0 + 1, { before: n0, early: tapEarly, after: KG.stats.fired[0] });
    step(0.5); c.intent.fire = true; step(1.2); const full = c.carry.gun.c; c.intent.fire = false; step(1 / 60);
    R('K2 S15: full charge in 1.2 s (then a Big Burst)', full >= 0.999 && KG.stats.fired[2] >= 1, { c: full, fired: KG.stats.fired });
    // ranges at level aim from the 1.4 m muzzle, flight times
    const shoot = (cc) => { fresh(); carry(c, 8, -42); step(0.1); c.aimYaw = 0; c.aimPitch = 0; const s = KG._fire(c, cc); const t0 = s.t; let t = 0; while (s.phase === 'fly' && t < 3) { dbg.step(1000 / 60); t += 1 / 60; } return { range: s.land ? s.land.z - s.start.z : -1, t: s.t - t0 }; };
    const r0 = shoot(0), r5 = shoot(0.5), r1 = shoot(1);
    R('K3 S18: ranges at level aim 7.8 / 13.2 / 20.1 m (±0.5), flights 0.68 / 0.83 / 0.99 s (±0.05)', Math.abs(r0.range - 7.8) < 0.5 && Math.abs(r5.range - 13.2) < 0.5 && Math.abs(r1.range - 20.1) < 0.5 && Math.abs(r0.t - 0.68) < 0.05 && Math.abs(r5.t - 0.83) < 0.05 && Math.abs(r1.t - 0.99) < 0.05, { r0, r5, r1 });
    // damage: a Big Burst splats within 2.4 m (180), partial centre ≤ 90; no ink spent
    R('K4 S17: a Big Burst does 180 within 2.4 m, 55 at its 4.0 m edge; below full the centre is at most 90', blastDamage(1, 2.3) === 180 && Math.abs(blastDamage(1, 4.0) - 55) < 0.5 && blastDamage(0.99, 0) <= 90 && blastDamage(0, 0) === 40, { full: blastDamage(1, 2.3), edge: blastDamage(1, 4.0), part: blastDamage(0.99, 0) });
    fresh(); carry(c, 0, -30); step(0.1); c.ink = 37; c.intent.fire = true; step(0.5); c.intent.fire = false; step(0.1);
    R('K5 S19: Carp Shots cost no ink', c.ink >= 37, { ink: c.ink });
    // the blast on a player: landed, swell 0.45 s, then the damage — a player who steps out during the swell is safe
    fresh(); carry(c, 8, -30); step(0.1); put(B4[0], 8, -22.2); put(B4[1], 10, -22.2); step(0.1);
    c.aimYaw = 0; c.aimPitch = -0.35; const s = KG._fire(c, 1);
    let t = 0; while (s.phase === 'fly' && t < 2) { dbg.step(1000 / 60); t += 1 / 60; }
    const landed = s.phase === 'swell'; put(B4[1], 17, -22.2); step(0.2); const mid = B4[0].alive; step(0.4);
    R('K6 S14, S17: it lands on a player (no direct damage), swells 0.45 s, then a Big Burst splats; the one who stepped out during the swell is safe',
      landed && mid && !B4[0].alive && B4[1].alive && B4[1].hp === PLAYER.hp, { landed, mid, victim: B4[0].alive, stepped: B4[1].alive });
    // knockback: backwards along the aim, ~0.75 m (Splash) / ~1.8 m (Big Burst); through enemy ink faster than walking
    const kick = (cc) => { fresh(); carry(c, 8, -40); step(0.3); c.aimYaw = 0; c.aimPitch = 0.3; const p0 = c.pos.clone(); KG._fire(c, cc); step(1.2); return p0.z - c.pos.z; };
    const k0 = kick(0), k1 = kick(1);
    R('K7 S27: every shot kicks the carrier backwards (≈ 0.75 m Splash, ≈ 1.8 m Big Burst)', Math.abs(k0 - 0.75) < 0.2 && Math.abs(k1 - 1.8) < 0.3, { k0, k1 });
    fresh(); for (let z = -38; z <= -24; z += 1.0) G.paint.splat(V(5, 0.2, z), 1.5, 1, { seed: 4 });
    carry(c, 5, -25); step(0.2); const pW = c.pos.clone(); c.intent.move.set(0, 0, -1); step(3); const walk = (pW.z - c.pos.z) / 3; idle(c);
    put(c, 5, -25); Kp.base = null; step(0.2); const pK = c.pos.clone(); c.aimYaw = 0; c.aimPitch = 0.2; c.intent.move.set(0, 0, -1);
    for (let i = 0; i < 180; i++) { c.intent.fire = (i % 24) < 3; dbg.step(1000 / 60); } idle(c); const push = (pK.z - c.pos.z) / 3;
    R('K8 S28: Splash shots fired backwards push a carrier through enemy ink faster than walking it (~1.52 m/s)', walk < 1.7 && push > walk * 1.6, { walk, push });
  }
  } catch (e) { R('HARNESS: the test threw', false, { err: String(e && e.stack || e).slice(0, 600) }); }
  offs.forEach((f) => f());
  return out;
})()
