// Drainbow pictures (src/game/sp-drainbow.js, src/fx/drainbowFx.js) for tools/botlab/hud-shots.cjs (the HUD up):
// window.__hudScenes, each staged after the bots have inked the stage for PLAY s. The spot: a flat, open patch near
// the middle of the local player's half (found from the nav graph). You (the local player) are on team 0.
//   outside        your teammate's Drainbow from outside, a foe in it being drained, your teammate gaining
//   drain          closer on the drain streams (the foe's ink pulled to the middle) and the inflow on the gainer
//   ripple-1…3     a foe walking out through the film: the dimple and the ring spreading (0.1, 0.3, 0.6 s)
//   wave-1…5       you walking into the enemy's Drainbow, your own camera: the pearly front sweeping the grey out over
//                  the view (0.12 … 1.0 s after you crossed)
//   mono           well inside: everything grey, the HUD too, the film round you
//   back-1…3       walking out: the colour sweeping back in
//   gain           your own team's: a foe inside, the drained ink flowing in to you (your camera)
//   SCENES=tools/botlab/scenes/drainbow.js MAP=halyard MODE=turf OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   (tools/botlab/jobs/drainbow/shots.sh does that and turns them into JPEGs)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SPECIALS, PLAYER } = await import('./src/config.js');
  const D = SPECIALS.drainbow, DB = G.drainbow;
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._go) a.intent.move.copy(a._go); };
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; }
  const keepAlive = () => { for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; } };
  G.projectiles.clear(); G.subs.clear();
  if (g.screenfx) { g.screenfx.reset?.(); }
  // the spot: a flat, open patch (halyard: the fuel-dock apron on Alpha's half; elsewhere the flattest nav node near
  // the middle of our half), and the way in to it — the direction with level floor and a clear line 2 … 9 m out
  const SPOTS = { halyard: [0.5, -27.5] };
  const ys = me.team === 0 ? -1 : 1, lid = G.level.layout?.id;
  const flatAround = (x, y, z, r0, r1) => {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      for (let r = r0; r <= r1; r += 1) {
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        if (!(Math.abs(G.level.groundHeight(px, pz, y + 1.5) - y) < 0.2)) return false;
      }
    }
    return true;
  };
  let S = null;
  if (SPOTS[lid]) { const [x, z] = SPOTS[lid]; S = { x, y: G.level.groundHeight(x, z, 5), z }; }
  if (!S) {
    const nodes = [...(G.nav?.nodes || [])].sort((a, b) => Math.hypot(a.x * 0.6, a.z - ys * 14) - Math.hypot(b.x * 0.6, b.z - ys * 14));
    S = nodes.find((n) => flatAround(n.x, n.y, n.z, 1.5, 4.5)) || { x: 0, y: G.level.groundHeight(0, ys * 12, 5), z: ys * 12 };
  }
  const cx = S.x, cy = S.y, cz = S.z;
  let way = 0, best = -1;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let n = 0;
    for (let r = 2; r <= 9; r += 0.5) { const gy = G.level.groundHeight(cx + dx * r, cz + dz * r, cy + 1.5); if (Math.abs(gy - cy) < 0.2 && G.physics.los(V(cx, cy + 1.2, cz), V(cx + dx * r, cy + 1.2, cz + dz * r))) n++; else break; }
    if (n > best) { best = n; way = a; }
  }
  // (fwd: the walk-in direction, toward the centre; the approach starts 7 m out along `way`)
  const wx = Math.sin(way), wz = Math.cos(way), fwd = -1;
  const put = (a, x, z, yaw = 0) => { a.pos.set(x, cy + 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.character.setVisible?.(true); a.character.root.visible = true; };
  // (out of the way: on their own spawn pad, hidden — never over the water)
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); a.character.setVisible?.(false); a.character.root.visible = false; };
  const clearAll = () => { keepAlive(); G.specials.clear(); for (const a of m.actors) { if (a.specialActive) a.specialActive = null; a._go = null; zero(a); } m.actors.forEach((a, i) => park(a, i)); step(0.05); keepAlive(); };
  const start = (a) => { a.specialId = 'drainbow'; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const face = (a, x, z) => Math.atan2(x - a.pos.x, z - a.pos.z);
  // a camera dist m out at height h, looking at `look`, from the clear direction nearest `pref` (rad): nothing between
  // it and the look point, nor between it and its ray to the bubble's middle
  const clearCam = (dist, h, look, pref, fov = 60) => {
    let best = null, bd = 1e9;
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2, x = cx + Math.sin(a) * dist, z = cz + Math.cos(a) * dist, p = V(x, cy + h, z);
      if (!G.physics.los(p, V(...look)) || !G.physics.los(p, V(cx, cy + 1.2, cz))) continue;
      const da = Math.abs(Math.atan2(Math.sin(a - pref), Math.cos(a - pref)));
      if (da < bd) { bd = da; best = [x, cy + h, z]; }
    }
    cine(best || [cx + Math.sin(pref) * dist, cy + h, cz + Math.cos(pref) * dist], look, fov);
  };
  const cine = (from, look, fov = 60) => { g.settings.fov = fov; g.rig.cinematic(V(...from), V(...from), V(...look), V(...look), 99, () => {}); };
  const follow = (yaw, pitch = -0.1) => { g.settings.fov = window.__fov0 || 75; g.rig.follow(me, true); g.rig.yaw = yaw; g.rig.pitch = pitch; me.yaw = me.aimYaw = yaw; };
  window.__fov0 = window.__fov0 || g.settings.fov;
  const [E1, E2] = foes, [M1, M2] = mates;
  const scenes = [];
  const add = (name, set, wait = 60) => scenes.push({ name, set: async () => { const r = await set(); return { spot: [+cx.toFixed(1), +cy.toFixed(1), +cz.toFixed(1)], level: +DB.view.level.toFixed(2), ...(r || {}) }; }, wait });

  // ---- your teammate's, from outside
  add('outside', () => {
    clearAll();
    put(M1, cx, cz, 0); start(M1); step(0.1);
    put(E1, cx - wz * 1.8, cz + wx * 1.8, way + Math.PI); put(M2, cx + wz * 1.6, cz - wx * 1.2, way); put(me, cx + wx * 8 - wz * 3, cz + wz * 8 + wx * 3, way + Math.PI);
    step(1.6);
    clearCam(9.8, 3.4, [cx, cy + 1.4, cz], way + 0.2);
    step(0.05);
  });
  add('drain', () => {
    step(0.4);
    clearCam(9.8, 2.6, [cx - wz * 0.7, cy + 1.0, cz + wx * 0.7], way + 0.2, 30);   // (the outside shot's camera, zoomed in)
    step(0.05);
  });
  // ---- a foe walking out through the film
  add('ripple-1', () => {
    clearAll();
    put(M1, cx, cz, 0); start(M1); step(D.inflate + 0.2);
    put(E1, cx + wx * 2.8, cz + wz * 2.8, way); E1._go = V(wx, 0, wz);
    let n = 0; while (Math.hypot(E1.pos.x - cx, E1.pos.z - cz) < D.radius - 0.05 && n++ < 120) step(1 / 60);
    step(0.1);
    clearCam(9.0, 1.7, [cx + wx * 3.9, cy + 1.3, cz + wz * 3.9], way - 0.25, 55);
    step(1 / 60);
  });
  add('ripple-2', () => { step(0.2); });
  add('ripple-3', () => { step(0.3); });
  // ---- you walking into the enemy's (your own camera)
  const walkIn = () => {
    clearAll();
    put(E1, cx, cz, 0); start(E1); step(D.inflate + 0.3);
    put(E2, cx - wx * 1.6 + wz * 1.2, cz - wz * 1.6 - wx * 1.2, way);
    const yaw = Math.atan2(-wx, -wz);
    put(me, cx + wx * 7, cz + wz * 7, yaw); follow(yaw, -0.08); step(0.3);
    // walk in at 5 m/s until across the film
    let n = 0; while (!DB.view.inside && n++ < 200) { me.pos.x -= wx * 5 / 60; me.pos.z -= wz * 5 / 60; step(1 / 60); }
  };
  let tIn = 0;
  const wave = (name, t) => add(name, () => { if (name === 'wave-1') { walkIn(); tIn = 0; } while (tIn < t) { const v = (tIn < 0.5 ? 3 : 0) / 60; me.pos.x -= wx * v; me.pos.z -= wz * v; step(1 / 60); tIn += 1 / 60; } return { t: +tIn.toFixed(2) }; });
  wave('wave-1', 0.12); wave('wave-2', 0.3); wave('wave-3', 0.5); wave('wave-4', 0.72); wave('wave-5', 1.0);
  add('mono', () => { step(1.2); g.rig.yaw += 0.5; step(0.3); });
  let tOut = 0;
  const back = (name, t) => add(name, () => {
    if (name === 'back-1') { g.rig.yaw -= 0.5; step(0.2); let n = 0; while (DB.view.inside && n++ < 300) { me.pos.x += wx * 5 / 60; me.pos.z += wz * 5 / 60; step(1 / 60); } tOut = 0; }
    while (tOut < t) { step(1 / 60); tOut += 1 / 60; }
    return { t: +tOut.toFixed(2) };
  });
  back('back-1', 0.2); back('back-2', 0.5); back('back-3', 0.85);
  // ---- your own team's: the drained ink flowing in to you
  add('gain', () => {
    clearAll();
    put(me, cx, cz, 0); start(me); step(0.2);
    put(E1, cx - wx * 2.2 + wz * 1.6, cz - wz * 2.2 - wx * 1.6, way); put(E2, cx - wx * 1.6 - wz * 2.0, cz - wz * 1.6 + wx * 2.0, way);
    put(me, cx + wx * 1.2, cz + wz * 1.2, way + Math.PI); const yaw = Math.atan2(-wx, -wz); follow(yaw + 0.2, -0.16); step(1.4);
  });
  // ---- the loadout picker with the Drainbow (its icon, name and blurb)
  add('loadout', () => {
    clearAll();
    g.api.setLoadout?.({ special: 'drainbow' });
    g.menus?.show('loadout');
    step(0.1);
    const t = document.querySelector('.iw-kit--pick b')?.textContent;
    return { picker: [...document.querySelectorAll('.iw-kit--pick b')].map((e) => e.textContent) , t };
  }, 400);
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
