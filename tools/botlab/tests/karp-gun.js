// [b5-karp] The Carp Shot (SPEC §2.5, §10.1 karp-gun.js) on karpbox, deterministic (frozen clock, 60 Hz, bots off):
//   charge (a tap at 0.15 s, full at 1.2 s) · from the 1.4 m muzzle: level-aim ranges 7.8 / 13.2 / 20.1 m (± 0.5) and
//   flights 0.68 / 0.83 / 0.99 s (± 0.05) · the landing ink radius per charge · the 0.45 s swell · the blast radius per
//   charge (a player just inside is hit, one just outside not) · damage (a Big Burst 180 within 2.4 m, partial centre
//   ≤ 90) · no ink spent · the knockback per charge · 6 m of enemy ink: walking ≥ 3.9 s, backward Splash shots ≤ 2.2 s
//   · it lands on a player and on a Drip Curtain · the owner's records with a stub net: [0] the launch (muzzle, velocity,
//   charge), [1] the landing = the shot's own landing point (and karp:land's), [2] the blast's centre and charge, and a
//   non-lethal hit on an own player recorded as [3, gid, dmg] ON THE VICTIM — never through applyHit.
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-gun.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER, SUBS } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF } = await import('./tools/botlab/karpbox.js');
  const { blastDamage, radiusOf, landPaintOf } = await import('./src/game/karpGun.js');
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const GN = K.gun, KG = G.karpGun;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  if (m.mode !== 'bazookarp' || !m.karp) { R('a Bazookarp match on karpbox', false, { mode: m.mode }); return out; }
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  const floorY = (x, z) => { const y = G.level.groundHeight(x, z, 3); return y > -50 ? y : 0; };
  const put = (a, x, z, y = null) => { if (!a.alive) a.respawn(); a.superJumpState = null; if (a.specialActive) G.specials.end(a, 'test'); a.pos.set(x, y ?? floorY(x, z), z); a.vel.set(0, 0, 0); a.grounded = false; a.smoothY = 0; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.climbing = false; idle(a); };
  const park = () => { for (const a of m.actors) { const p = G.level.spawnPads[a.team]; a.status.shield = 0; put(a, p.x + ((a.slot % 4) - 1.5) * 1.6, p.z + (a.team ? 2.5 : -2.5), p.y); } };
  let Kp = m.karp;
  const fresh = () => {
    Kp?.dispose(); G.level.layout.bazookarp = KARPBOX_DEF; m.time = 200; m.state = 'playing'; m.result = null;
    G.paint.clear(); KG.clear();
    for (const it of [...(G.subs?.items || [])]) G.subs._destroy?.(it);
    m.karp = Kp = new Bazookarp(m, new LoopWire()); park(); step(0.05); return Kp;
  };
  const carry = (a, x, z) => { put(a, x, z); step(1 / 60); Kp.shell.clear(); Kp.pos.copy(a.pos); Kp.restNode = -1; Kp._setPhase('free', 0); step(2 / 60); return Kp.holder === a; };
  const fly = (s, maxS = 3) => { let t = 0; while (s.phase === 'fly' && t < maxS) { dbg.step(1000 / 60); t += 1 / 60; } return t; };
  const c = A[0];
  // the session stub (as deployables.js): records what the owner sends; nothing leaves the page
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {}, recMover() {},
    recKit: (a, kind, data) => sent.push({ nid: a.nid, team: a.team, kind, data: JSON.parse(JSON.stringify(data)) }), sendDevHit() {}, shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };

  try {
    // ---- charge
    fresh(); carry(c, 0, -30); step(0.1);
    c.intent.fire = true; dbg.step(1000 / 60); c.intent.fire = false;
    const n0 = KG.stats.fired[0]; let tTap = 0; while (KG.stats.fired[0] === n0 && tTap < 1) { dbg.step(1000 / 60); tTap += 1 / 60; }
    step(0.5); c.intent.fire = true; let tFull = 0; while (c.carry.gun.c < 1 && tFull < 3) { dbg.step(1000 / 60); tFull += 1 / 60; } c.intent.fire = false; step(1 / 60);
    R('G1 S15: a tap fires a Splash at 0.15 s (the press counted); a held trigger reaches full charge at 1.2 s', Math.abs(tTap + 1 / 60 - GN.tapMin) < 0.035 && Math.abs(tFull - GN.chargeTime) < 0.035 && KG.stats.fired[2] >= 1, { tap: tTap + 1 / 60, full: tFull, fired: KG.stats.fired });
    // ---- ranges and flight times at level aim, from the 1.4 m muzzle
    const shoot = (cc) => { fresh(); carry(c, 8, -44); step(0.1); c.aimYaw = 0; c.aimPitch = 0; const s = KG._fire(c, cc); const up = s.start.y - c.pos.y; fly(s); return { range: s.land ? s.land.z - s.start.z : -1, t: s.t, up }; };
    const r0 = shoot(0), r5 = shoot(0.5), r1 = shoot(1);
    R('G2 S16, S18: from the 1.4 m muzzle, level-aim ranges 7.8 / 13.2 / 20.1 m (± 0.5) and flights 0.68 / 0.83 / 0.99 s (± 0.05)',
      [r0, r5, r1].every((r) => Math.abs(r.up - GN.muzzleUp) < 0.02) && Math.abs(r0.range - 7.8) < 0.5 && Math.abs(r5.range - 13.2) < 0.5 && Math.abs(r1.range - 20.1) < 0.5 && Math.abs(r0.t - 0.68) < 0.05 && Math.abs(r5.t - 0.83) < 0.05 && Math.abs(r1.t - 0.99) < 0.05, { r0, r5, r1 });
    // ---- the landing ink (before the blast), the swell, the blast's own ink
    const landInk = (cc) => {
      fresh(); carry(c, 8, -44); step(0.1); c.aimYaw = 0; c.aimPitch = 0; const s = KG._fire(c, cc); fly(s);
      const L = s.land, r = landPaintOf(cc), q = (rad) => G.paint.regionStats(L.x, 0, L.z, rad, 0, { own: 0, enemy: 0, empty: 0, n: 0 });
      const inside = q(r * 0.7), wide = q(r * 1.9);
      let sw = 0; while (s.phase === 'swell' && sw < 2) { dbg.step(1000 / 60); sw += 1 / 60; }
      return { r, inside: inside.own, ring: (wide.own * wide.n - inside.own * inside.n) / Math.max(1, wide.n - inside.n), swell: sw, blew: s.phase === 'done' };
    };
    const i0 = landInk(0), i1 = landInk(1);
    R('G3 S17: the landing ink — 0.9 m (Splash) / 1.5 m (Big Burst): its own ink inside, little beyond (before the blast)', i0.inside > 0.6 && i1.inside > 0.6 && i0.ring < 0.35 && i1.ring < 0.35, { i0, i1 });
    R('G4 S17: it swells 0.45 s on the ground, then blows', i0.blew && i1.blew && Math.abs(i0.swell - GN.swell) < 0.035 && Math.abs(i1.swell - GN.swell) < 0.035, { s0: i0.swell, s1: i1.swell });
    // ---- the blast radius per charge (a player just inside is hit, one just outside is not), damage
    const radius = (cc) => {
      fresh(); carry(c, 0, -38); step(0.1); const R0 = radiusOf(cc);
      const at = V(8, 0, -44), inn = B[0], outn = B[1];   // (open floor: nothing between the blast and either player)
      put(inn, at.x + R0 - 0.25, at.z); put(outn, at.x - R0 - 0.6, at.z); step(0.05);
      const s = KG._fire(c, cc); s.vel.set(0, -1, 0); s.pos.set(at.x, 0.4, at.z); s.prev.copy(s.pos); KG._land(s, V(at.x, 0, at.z)); const h0 = [inn.hp, outn.hp];
      step(GN.swell + 0.05);
      return { R: R0, inHit: inn.hp < h0[0] || !inn.alive, outHit: outn.hp < h0[1] || !outn.alive, inHp: inn.hp };
    };
    const b0 = radius(0), b5 = radius(0.5), b1 = radius(1);
    R('G5 S16: the blast radius grows with the charge — 1.8 / 2.6 / 4.0 m: a player just inside is hit, one just outside is not', [b0, b5, b1].every((b) => b.inHit && !b.outHit) && Math.abs(b0.R - 1.8) < 0.01 && Math.abs(b5.R - 2.6) < 0.01 && Math.abs(b1.R - 4.0) < 0.01, { b0, b5, b1 });
    R('G6 S16, S17: damage — a Big Burst 180 within 2.4 m (lethal), 55 at its 4.0 m edge; a partial charge\'s centre is 40–90, its edge 25', blastDamage(1, 0) === 180 && blastDamage(1, 2.4) === 180 && Math.abs(blastDamage(1, 4.0) - 55) < 0.5 && blastDamage(1, 4.01) === 0 && blastDamage(0, 0) === 40 && Math.abs(blastDamage(0.999, 0) - 90) < 0.1 && blastDamage(0.5, 0) <= 90 && Math.abs(blastDamage(0.5, radiusOf(0.5)) - 25) < 0.01, { d: [blastDamage(1, 2.4), blastDamage(1, 4.0), blastDamage(0, 0), blastDamage(0.999, 0), blastDamage(0.5, 0)] });
    // ---- no ink spent
    fresh(); carry(c, 0, -30); step(0.1); c.ink = 12; const f0 = KG.stats.fired.reduce((s, x) => s + x, 0);
    for (let k = 0; k < 3; k++) { c.intent.fire = true; step(k === 1 ? 1.25 : 0.05); c.intent.fire = false; step(0.5); }
    const fired3 = KG.stats.fired.reduce((s, x) => s + x, 0) - f0;
    R('G7 S19: Carp Shots cost no ink (three shots on a 12 % tank)', c.ink >= 12 && fired3 === 3, { ink: c.ink, fired: fired3 });
    // ---- the knockback per charge: backwards along the aim (v·τ: 0.75 / 1.28 / 1.8 m)
    const kick = (cc) => { fresh(); carry(c, 8, -40); step(0.3); c.aimYaw = 0; c.aimPitch = 0.3; const p0 = c.pos.clone(); KG._fire(c, cc); step(1.2); return +(p0.z - c.pos.z).toFixed(3); };
    const k0 = kick(0), k5 = kick(0.5), k1 = kick(1);
    R('G8 S27: every shot kicks the carrier backwards: ≈ 0.75 m (Splash), 1.28 m (half), 1.8 m (Big Burst)', Math.abs(k0 - 0.75) < 0.2 && Math.abs(k5 - 1.275) < 0.25 && Math.abs(k1 - 1.8) < 0.3 && k0 < k5 && k5 < k1, { k0, k5, k1 });
    // ---- 6 m of enemy ink: walking it takes ≥ 3.9 s; Splash shots fired backwards (one per 0.4 s) get through in ≤ 2.2 s
    const cross = (shots) => {
      fresh(); for (let z = -40; z <= -20; z += 0.7) for (const x of [4.2, 5, 5.8]) G.paint.splat(V(x, 0.2, z), 1.5, 1, { seed: 4 });
      carry(c, 5, -24); step(0.3); put(c, 5, -24); Kp.base = null; step(0.2);
      const z0 = c.pos.z; c.aimYaw = c.yaw = 0; c.aimPitch = 0.2; c.intent.move.set(0, 0, -1);
      let t = 0, i = 0; while (z0 - c.pos.z < 6 && t < 8) { if (shots) c.intent.fire = (i % 24) < 3; dbg.step(1000 / 60); t += 1 / 60; i++; }
      idle(c); return +t.toFixed(2);
    };
    const tWalk = cross(false), tPush = cross(true);
    R('G9 S28: crossing 6 m of enemy ink — walking takes ≥ 3.9 s; Splash shots fired backwards push through in ≤ 2.2 s', tWalk >= 3.9 && tPush <= 2.2, { walk: tWalk, push: tPush });
    // ---- it lands on a player (no direct damage) and on an enemy Drip Curtain
    fresh(); carry(c, 8, -30); step(0.1); put(B[0], 8, -22.2); step(0.1);
    c.aimYaw = 0; c.aimPitch = -0.35; const sP = KG._fire(c, 1); fly(sP); const hpAtLand = B[0].hp;
    const onPlayer = sP.phase === 'swell' && Math.abs(sP.land.z - B[0].pos.z) < 0.9 && hpAtLand === PLAYER.hp;
    step(0.6);
    fresh(); carry(c, 8, -40); step(0.1);
    const thrower = B[1]; put(thrower, 8, -33);
    const cur = G.subs._throw(thrower, SUBS.curtain, V(8, 0.6, -35), V(0, -6, 0.2), false); let tc = 0; while (cur.state === 'fly' && tc < 1) { dbg.step(1000 / 60); tc += 1 / 60; }
    put(thrower, 8, -20); step(0.05);
    c.aimYaw = 0; c.aimPitch = 0; const sC = KG._fire(c, 0); fly(sC);
    R('G10 §2.5: it lands on a player (the shot stops on them, no direct damage) and on an enemy Drip Curtain (stops at its sheet, never beyond)',
      onPlayer && cur.state === 'curtain' && !!sC.land && Math.abs(sC.land.z - cur.pos.z) < 0.5 && Math.abs(sC.land.x - 8) < 0.3, { onPlayer, landP: sP.land?.toArray(), victim: B[0].pos.toArray(), curtain: cur.state, cz: cur.pos?.z, landC: sC.land?.toArray() });
    // ---- the owner's records with a stub net; [3] on the victim; never applyHit
    fresh(); carry(c, 8, -40); step(0.1); put(B[0], 8, -32.2); step(0.1);
    const lands = [], hitsK = []; const offL = on('karp:land', (e) => lands.push(e.pos.toArray())), offH = on('hit', (e) => { if (e.weaponId === 'karp' && e.victim === B[0]) hitsK.push(e.damage); });
    let applied = 0; const ah = G.projectiles.applyHit; G.projectiles.applyHit = function (...a) { if (a[3] === 'karp') applied++; return ah.apply(this, a); };
    netOn();
    let sR = null, vNid = null;
    try {
      vNid = B[0].nid;
      c.aimYaw = 0; c.aimPitch = 0; sR = KG._fire(c, 0); fly(sR); step(GN.swell + 0.1);
    } finally { netOff(); G.projectiles.applyHit = ah; offL(); offH(); }
    const kit = sent.filter((r) => r.kind === 'karp'), r0r = kit.find((r) => r.data[0] === 0), r1r = kit.find((r) => r.data[0] === 1), r2r = kit.find((r) => r.data[0] === 2), r3r = kit.find((r) => r.data[0] === 3);
    const L = sR.land, near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.02;
    R('G11 §7.2: the owner records [0] the launch (its muzzle, velocity and charge), [1] the landing — the shot\'s own landing point (and karp:land\'s), never (0, −1, 0) — and [2] the blast\'s centre and charge',
      !!r0r && !!r1r && !!r2r && r0r.nid === r1r.nid && near(r0r.data.slice(2, 5), sR.start.toArray()) && Math.abs(r0r.data[8] - 0) < 0.01 && near(r1r.data.slice(2, 5), L.toArray()) && near(lands[0] || [0, 0, 0], L.toArray()) && near(r2r.data.slice(2, 5), L.toArray()) && Math.abs(r2r.data[5]) < 0.01 && r1r.data[1] === r0r.data[1] && r2r.data[1] === r0r.data[1],
      { r0: r0r?.data, r1: r1r?.data, r2: r2r?.data, land: L.toArray(), event: lands[0] });
    R('G12 §2.5, §7.5: a non-lethal blast on an own player of the other team is recorded by its owner as [3, gid, dmg] on the VICTIM, and never goes through applyHit',
      !!r3r && r3r.nid === vNid && r3r.team === 1 && r3r.data[1] === r0r?.data[1] && r3r.data[2] > 0 && r3r.data[2] < PLAYER.hp && B[0].alive && hitsK.length === 1 && Math.abs(hitsK[0] - r3r.data[2]) < 0.01 && applied === 0,
      { r3: r3r?.data, by: r3r?.nid, victimNid: vNid, hit: hitsK, hp: B[0].hp, applyHit: applied });
  } catch (e) { R('HARNESS: the test threw', false, { err: String(e && e.stack || e).slice(0, 600) }); }
  return out;
})()
