// [b5-karp] Bazookarp pictures (WP1's placeholder look and HUD) through hud-shots.cjs, on karpbox:
//   MAP=karpbox MODE=bazookarp PLAY=1 SCENES=tools/botlab/scenes/karp.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
// shell-pond (the Roe Shell on the Pond, swelling Alpha's way) · carrier (an Alpha carrier with the marker and its fuse
// seconds, charging a Carp Shot: the arc preview) · carrier-foe (the same carrier seen by Bravo: the marker over its head)
// · carp-blast (a Big Burst going off) · weir-plant (the moment it lands on the weir: the shell re-forming there, the
// curtain gone) · gate (the risen Dragon Gate's light column, the carrier walking in) · score-bar (the count badges and
// the status line: "WE CARRY · 37 s ×3", "DON'T RETREAT!")
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, Kp = m.karp;
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  for (const a of m.actors) { if (!a.alive) a.respawn(); zero(a); }
  G.projectiles.clear(); G.subs.clear(); G.specials.clear(); G.paint.clear();
  const me = m.local, A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const put = (a, x, z, yaw = 0) => { if (!a.alive) a.respawn(); a.pos.set(x, Math.max(0, G.level.groundHeight(x, z, 3)), z); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.invuln = 0; a.hp = 100; zero(a); };
  const park = () => m.actors.forEach((a, i) => { const p = G.level.spawnPads[a.team]; put(a, p.x + ((i % 4) - 1.5) * 1.6, p.z + (a.team ? 2 : -2), a.team ? Math.PI : 0); a.pos.y = p.y; });
  const cine = (from, look, fov = 58) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); for (let i = 0; i < 2; i++) dbg.step(1000 / 6000); };
  const fov0 = g.settings.fov;
  // (the rig blends 0.6 s from a cinematic into follow: one frame to see the change, then the blend cut short)
  const follow = () => { g.settings.fov = fov0; g.rig.follow(me, true); g.rig.yaw = me.yaw; g.rig.pitch = -0.22; dbg.step(1000 / 60); if (g.rig.blend) g.rig.blend.active = false; g.rig.follow(me, true); };
  const paintLane = (team, x0, z0, x1, z1) => { for (let k = 0; k <= 12; k++) { const u = k / 12; G.paint.splat(V(x0 + (x1 - x0) * u, 0.2, z0 + (z1 - z0) * u), 1.5, team, { seed: k }); } };
  const S = [];
  const add = (name, set, moment, wait = 90) => S.push({ name, set: async () => { await set(); return { phase: Kp.phase, meter: Math.round(Kp.shell.meter), count: Kp.count, holder: Kp.holder?.name }; }, moment, wait });

  add('shell-pond', () => {
    park();
    put(A[1], -2.5, -7, 0.3); put(A[2], 3.5, -6.5, -0.4); put(B[1], 2.5, 7, Math.PI + 0.3); put(B[2], -3, 6.5, Math.PI - 0.4);
    paintLane(0, -3, -9, 3, -2); paintLane(1, 3, 9, -3, 2);
    Kp.shell.m = 640; Kp.shell.quiet = 0;
    step(0.2);
    cine(V(7.5, 3.2, -6.5), V(0, 1.4, 0.5), 55);
  });
  add('carrier', () => {
    park(); G.paint.clear();
    put(me, 0, 9, 0); step(0.1);
    Kp.shell.clear(); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); step(2 / 60);
    me.aimPitch = 0.12; me.intent.fire = true; step(0.9);   // (charging: the arc preview)
    Kp.fuse = 42.4; follow(); step(1 / 60);
  });
  add('carrier-foe', () => {
    me.intent.fire = false; step(0.3);
    put(B[0], 0.5, 19, Math.PI); step(0.05);
    cine(V(1.5, 2.3, 21.5), V(0, 1.5, 9.5), 60);
  });
  add('carp-blast', () => {
    park(); G.paint.clear();
    put(me, 0, 4, 0); step(0.05);
    Kp.shell.clear(); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); step(2 / 60);
    put(B[2], 1.5, 18.5, Math.PI); put(B[3], -2, 19.5, Math.PI);
    me.aimYaw = 0; me.aimPitch = 0.0;
    const s = G.karpGun._fire(me, 1);
    for (let i = 0; i < 200 && !(s.phase === 'swell' && s.swell > 0.38); i++) dbg.step(1000 / 60);
    cine(V(9, 4.5, 11), V(0, 0.8, 22), 60);
  }, () => { for (let i = 0; i < 6; i++) dbg.step(1000 / 60); }, 40);
  add('weir-plant', () => {
    park(); G.paint.clear();
    paintLane(0, 0, 14, 0, 27);
    put(me, 0, 23.5, 0); step(0.05);
    Kp.shell.clear(); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); step(2 / 60);
    me.intent.move.set(0, 0, 1);
    for (let i = 0; i < 200 && !Kp.lowered[0]; i++) dbg.step(1000 / 60);
    zero(me); me.intent.move.set(0.6, 0, -0.6); step(0.35); zero(me);
    cine(V(-7.5, 4.0, 22.5), V(0, 1.4, 28), 58);
  });
  add('gate', () => {
    step(1.2);
    Kp.shell.add(0, 600, A[1]); step(0.35);
    put(me, 0, 41, 0); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); step(2 / 60);
    me.intent.move.set(0, 0, 1); step(0.6); zero(me);
    cine(V(6.5, 3.0, 40), V(0, 1.6, 48.5), 60);
  });
  add('score-bar', () => {
    // a fresh carry on Alpha's own half, the count at 64 vs Bravo's 81, retreating: ×3
    park(); G.paint.clear();
    Kp.count = [64, 81];
    put(me, 0, -12, 0); step(0.05);
    Kp.shell.clear(); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); step(2 / 60);
    me.intent.move.set(0, 0, -1); step(2.2); zero(me); step(0.1);
    Kp.fuse = 37.2; follow(); step(1 / 60);
  });
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})()
