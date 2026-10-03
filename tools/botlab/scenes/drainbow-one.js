// Drainbow "one shade" pictures (src/world/inkOne.js, src/fx/drainbowFx.js) for tools/botlab/hud-shots.cjs (the HUD up):
// a foe's own view inside an enemy Drainbow, with both teams' ink striped over the floor in front of them.
//   outside   the floor striped in the two teams' inks, seen from just outside the bubble (in colour)
//   before    inside, the grey as it was before this change: both inks still two different greys (the one-shade
//             uniforms held off for this frame)
//   wave      walking in: the grey front sweeping over the floor, the inks going one shade under it
//   after     inside, now: all ink one shade — whose turf is whose can't be told
//   SCENES=tools/botlab/scenes/drainbow-one.js MAP=halyard MODE=turf OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SPECIALS } = await import('./src/config.js');
  const IO = await import('./src/world/inkOne.js');
  const D = SPECIALS.drainbow, DB = G.drainbow;
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; }
  G.projectiles.clear(); G.subs.clear();
  // the spot (as tools/botlab/scenes/drainbow.js): halyard's fuel-dock apron, else a flat nav node in our half
  const SPOTS = { halyard: [0.5, -27.5] };
  const lid = G.level.layout?.id, ys = me.team === 0 ? -1 : 1;
  let S = SPOTS[lid] ? { x: SPOTS[lid][0], z: SPOTS[lid][1] } : null;
  if (S) S.y = G.level.groundHeight(S.x, S.z, 5);
  else { const n = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x * 0.6, a.z - ys * 14) - Math.hypot(b.x * 0.6, b.z - ys * 14))[0]; S = { x: n.x, y: n.y, z: n.z }; }
  const cx = S.x, cy = S.y, cz = S.z;
  // the way in: the clearest level direction out of the spot
  let way = 0, best = -1;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let n = 0;
    for (let r = 2; r <= 9; r += 0.5) { const gy = G.level.groundHeight(cx + dx * r, cz + dz * r, cy + 1.5); if (Math.abs(gy - cy) < 0.2 && G.physics.los(V(cx, cy + 1.2, cz), V(cx + dx * r, cy + 1.2, cz + dz * r))) n++; else break; }
    if (n > best) { best = n; way = a; }
  }
  const wx = Math.sin(way), wz = Math.cos(way);
  const put = (a, x, z, yaw = 0) => { a.pos.set(x, cy + 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.character.root.visible = true; };
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); a.character.root.visible = false; };
  const follow = (yaw, pitch) => { g.rig.follow(me, true); g.rig.yaw = yaw; g.rig.pitch = pitch; me.yaw = me.aimYaw = yaw; };
  const E1 = foes[0];
  // stage: everyone parked, E1's bubble on the spot (E1 hidden at home after), the floor beyond the middle striped in the
  // two teams' inks (one seed: the same per-splat tone), you 7 m out along the way in
  const stage = () => {
    G.specials.clear(); for (const a of m.actors) { a.specialActive = null; zero(a); } m.actors.forEach((a, i) => park(a, i)); step(0.05);
    put(E1, cx, cz, 0); E1.specialId = 'drainbow'; E1.special = E1.specialCost(); E1._startSpecial(); step(D.inflate + 0.2);
    park(E1, 0);
    const fx = -wx, fz = -wz, sx = -fz, sz = fx;   // forward (into the bubble, toward its far side) and across
    for (let i = -3; i <= 3; i++) for (let j = 0; j < 5; j++) {
      const t = ((i + j) & 1) ? 1 : 0, along = 0.5 + j * 1.5, across = i * 1.5;
      const x = cx + fx * along + sx * across, z = cz + fz * along + sz * across, y = G.level.groundHeight(x, z, cy + 1.5);
      if (Math.abs(y - cy) < 0.5) G.paint.splat(V(x, y + 0.1, z), 1.05, t, { seed: 0.37, instant: true });
    }
    step(0.1);
  };
  const yawIn = Math.atan2(-wx, -wz);
  const scenes = [];
  const add = (name, set, wait = 80) => scenes.push({ name, set: async () => { const r = await set(); return { level: +DB.view.level.toFixed(2), one: IO.INK_ONE.uOneB.value.toArray().map((v) => +v.toFixed(2)), ...(r || {}) }; }, wait });
  add('outside', () => { stage(); put(me, cx + wx * 7.2, cz + wz * 7.2, yawIn); follow(yawIn, -0.3); step(0.3); });
  let tIn = 0;
  add('wave', () => {
    // walk in at 5 m/s until across the film, then a moment more: the front partway over the striped floor
    let n = 0; while (!DB.view.inside && n++ < 200) { me.pos.x -= wx * 5 / 60; me.pos.z -= wz * 5 / 60; step(1 / 60); }
    tIn = 0; while (tIn < 0.2) { step(1 / 60); tIn += 1 / 60; }
    return { t: +tIn.toFixed(2) };
  });
  add('after', () => { step(1.3); });
  add('before', () => { step(0.05); const B = IO.INK_ONE.uOneB.value; B.set(0, 0, 0, B.w); g.R.render(); return { note: 'one-shade uniforms held off for this frame (the old look)' }; });
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
