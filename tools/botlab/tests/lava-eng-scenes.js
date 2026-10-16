// The lava engine's picture set (out/engine/eng-*), for tools/botlab/hud-shots.cjs: the world views with the HUD hidden
// (a fixed camera, the lava held at its stage time) and the HUD views as the player sees them (lava-hud-scenes.js's
// default list, named eng-*). Fix round 3: the set regenerated at the final head, plus a side view of the lavafall at LOW
// and HIGH and the Organ Pipes from the island at LOW and HIGH.
//   MAP=caldera MODE=turf PLAY=4 SCENES=tools/botlab/tests/lava-eng-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = m.lava;
  const THREE = await import('three');
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  for (const a of m.actors) if (a !== m.local) { a.pos.copy(__G.level.spawnPads[a.team]); a.vel.set(0, 0, 0); }
  const me = m.local;
  // (the harness's profile may hold quality 'low', which builds no embers or steam: build them as at 'high')
  const lk = __G.lavaWorld.look; if (lk && !lk.emb) { lk.nEmb = 600; lk._particles?.(); }
  const hud = (on) => { const el = __G.hud?.el || document.querySelector('.iw-hud'); if (el) el.style.visibility = on ? '' : 'hidden'; };
  const fov0 = g.settings.fov;
  const info = () => ({ t: +L.clock.t.toFixed(2), y: +L.y.toFixed(3), phase: L.st.phase, chip: document.querySelector('.lv-chip')?.textContent || null });
  const S = [];
  // a world view: the lava at stage time t (stepped w s on to it for the particles), the camera from → look, no HUD
  // (w: s stepped to t; at least 6 — the particles live on the look's own clock and a scene's steam or embers would show
  // in the next one: they last ≤ 4.8 s)
  const cam = (name, t, from, look, fov = 70, w = 6) => S.push({ name, wait: 120, set: async () => {
    hud(false); me.pos.copy(__G.level.spawnPads[me.team]); me.vel.set(0, 0, 0);
    L.debugT(t - w); step(w);
    g.settings.fov = fov; g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); step(4 / 60);
    return info();
  } });
    cam('eng-top-low', 15, [-0.02, 140, 0], [0, 0, 0], 35);
  cam('eng-top-high', 52, [-0.02, 140, 0], [0, 0, 0], 35);
  cam('eng-mid-low', 15, [6, 4, -14], [0, 5, 0], 72);
  cam('eng-mid-high', 52, [6, 4, -14], [0, 5, 0], 72);
  cam('eng-gauge-low', 15, [0, 3.2, -10], [0, 11, -2.5], 60);
  cam('eng-gauge-warning-rise', 27, [0, 3.2, -10], [0, 11, -2.5], 60);
  cam('eng-gauge-high', 52, [0, 3.2, -10], [0, 11, -2.5], 60);
  cam('eng-gauge-warning-fall', 62, [0, 3.2, -10], [0, 11, -2.5], 60);
  cam('eng-shelf-low', 15, [-19.6, 3.0, -15.1], [-25, 0, -5], 70);
  cam('eng-shelf-warning', 30, [-19.6, 3.0, -15.1], [-25, 0, -5], 70);
  cam('eng-shelf-rising', 39, [-19.6, 3.0, -15.1], [-25, 0, -5], 70, 6);
  cam('eng-shelf-high', 52, [-19.6, 3.0, -15.1], [-25, 0, -5], 70);
  cam('eng-shelf-falling-steam', 74, [-19.6, 3.0, -15.1], [-25, 0, -5], 70, 6);
  for (const [k, t] of [[1, 37.6], [2, 38.0], [3, 38.6]]) cam('eng-stones-surfacing-' + k, t, [-17.0, 3.2, -16.0], [-22, 0.4, -3], 65);
  cam('eng-race-high', 52, [-17.0, 3.2, -16.0], [-22, 0.4, -3], 65);
  for (const [k, t, nm] of [[1, 15, 'low'], [2, 38, 'rising'], [3, 42, 'rising'], [4, 52, 'high'], [5, 75, 'falling']]) cam(`eng-organs-${k}-${nm}`, t, [-1, 4.5, -20], [-10, 3, -9], 60);
  cam('eng-organs-island-low', 15, [2.5, 6.5, -6.0], [-10, 2.5, -9.5], 55);   // (south of the gauge's piers: from the island's middle a pier stood in the way)
  cam('eng-organs-island-high', 52, [2.5, 6.5, -6.0], [-10, 2.5, -9.5], 55);
  cam('eng-stain-line-causeway-low', 15, [-9, 1.6, -19.5], [-5.2, 0.5, -16.5], 60);
  cam('eng-stain-line-cliff-low', 15, [-21.5, 2.5, -12], [-28, 1.0, -6], 60);
  cam('eng-stain-line-pulse-warning', 27, [-21.5, 2.5, -12], [-28, 1.0, -6], 60);
  cam('eng-under-spillway-bridge-low', 15, [10.0, 3.6, -22.0], [15.0, 0, -28.0], 65);
  cam('eng-under-spillway-bridge-high', 52, [10.0, 3.6, -22.0], [15.0, 0, -28.0], 65);
  // (the falls from the front: out past the lip in the void, looking back up at the curtain pouring off it)
  cam('eng-lavafall-low', 15, [9, -5, -49], [10, -3, -37.5], 72);
  cam('eng-lavafall-high', 52, [9, -5, -49], [10, -3, -37.5], 72);
  // (new, fix round 3) the lavafall from its side: west of the lip's line, low, looking east along the face it pours down
  cam('eng-lavafall-side-low', 15, [-3.5, -2.0, -42.0], [14, -7, -37.0], 72);
  cam('eng-lavafall-side-high', 52, [-3.5, -2.0, -42.0], [14, -7, -37.0], 72);
  // the HUD views (lava-hud-scenes.js's default list), the follow camera on the player
  const look = (x, z, pitch = -0.12) => { const yw = Math.atan2(x - me.pos.x, z - me.pos.z); me.yaw = yw; if (g.rig) { g.rig.yaw = yw; g.rig.pitch = pitch; } };
  const stand = (x, y, z, lx, lz, pitch) => { if (!me.alive) me.respawn(); me.pos.set(x, y, z); me.vel.set(0, 0, 0); me.invuln = 0; look(lx, lz, pitch); g.rig?.follow?.(me, true); };
  // (5 s at LOW rest first: the last scene's steam and embers die out — they live on the look's own clock)
  const H = (name, set, wait = 120) => S.push({ name, wait, set: async () => { hud(true); g.settings.fov = fov0; L.debugT(15); step(5); await set(); return info(); } });
  const shelf = [-25.6, 0.02, -9.0], to = [-12, -4];
  H('eng-rise-1-warning', () => { L.debugT(24.6); stand(...shelf, ...to); step(0.7); }, 200);
  H('eng-rise-2-countdown', () => { L.debugT(31.4); stand(...shelf, ...to); step(0.4); });
  H('eng-rise-3-surge', () => { L.debugT(34.8); stand(...shelf, ...to); step(0.5); }, 150);
  H('eng-rise-4-stones-surfacing', () => { L.debugT(37.6); stand(...shelf, ...to); step(0.4); });
  H('eng-rise-5-deadly', () => { L.debugT(38.35); stand(...shelf, ...to); step(0.35); });
  H('eng-rise-6-drowned', () => { L.debugT(44.2); stand(-19.6, 1.22, -15.1, -24, -5, -0.2); step(0.8); });
  H('eng-lava-splat', () => { L.debugT(38.5); stand(...shelf, ...to); step(0.6); }, 450);
  H('eng-hud-stones-sinking', () => { L.debugT(46); stand(-20.82, 1.27, -7.13, -12, -4); step(0.2); L.debugT(61); step(0.4); look(-18, -15); step(0.1); });
  H('eng-minimap-high', () => { L.debugT(50); stand(-10, 1.22, -3.2, 0, -20, -0.15); step(0.4); });
  H('eng-hud-warning-fall', () => { L.debugT(59.6); stand(-10, 1.22, -3.2, 0, 0, 0.05); step(0.6); }, 200);
  H('eng-minimap-low', () => { L.debugT(90); stand(-10, 1.22, -3.2, 0, -20, -0.15); step(0.4); });
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})();
