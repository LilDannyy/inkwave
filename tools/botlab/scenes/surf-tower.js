// Surf N' Turf on the moving tower (src/game/sp-surf.js: it rides moving blocks) for tools/botlab/hud-shots.cjs on a Tower
// Command stage: a teammate rides the tower, a buoy dropped onto its deck rides along and sends its rings out from where
// it has got to (each ring centred where it left from).
//   ride-1 … ride-3   the buoy on the deck, 1.1 s / 2.6 s / 4.1 s after it landed (the camera beside the track)
//   SCENES=tools/botlab/scenes/surf-tower.js MAP=halyard MODE=tower OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const SURF = await import('./src/game/sp-surf.js');
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = m.tower, me = m.local;
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; }
  G.projectiles.clear(); G.subs.clear(); G.specials.clear();
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); };
  m.actors.forEach(park);
  const rider = m.actors.find((a) => a.team === me.team && a !== me) || me;
  const keep = () => { rider.pos.set(T.pos.x - 0.6, T.top + 0.02, T.pos.z - 0.6); rider.vel.set(0, 0, 0); rider.grounded = true; rider.form = 'kid'; rider.character.root.visible = true; };
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { keep(); dbg.step(1000 / 60); } };
  // the camera beside the track: the side of the tower's motion, 9 m off, 4.5 m up, looking at the deck
  const cam = () => {
    const d = T.path.at(T.s + 0.5), mx = d.x - T.pos.x, mz = d.z - T.pos.z, l = Math.hypot(mx, mz) || 1, sx = -mz / l, sz = mx / l;
    let from = null;
    for (const sg of [1, -1]) { const p = V(T.pos.x + sx * 9 * sg - (mx / l) * 3, T.top + 3.2, T.pos.z + sz * 9 * sg - (mz / l) * 3); if (G.physics.los(p, V(T.pos.x, T.top + 0.8, T.pos.z))) { from = p; break; } }
    from = from || V(T.pos.x + sx * 9, T.top + 4.5, T.pos.z + sz * 9);
    const look = V(T.pos.x, T.top + 0.4, T.pos.z);
    g.settings.fov = 60; g.rig.cinematic(from, from, look, look, 99, () => {});
  };
  let b = null, t0 = 0;
  const scenes = [];
  const add = (name, set, wait = 80) => scenes.push({ name, set: async () => { const r = await set(); return { s: +T.s.toFixed(2), moving: T.moving, on: !!(b && b.on && b.on.b === T.block), rings: b ? b.rings.filter((x) => x.c).map((x) => [+x.c.x.toFixed(2), +x.c.z.toFixed(2)]) : [], ...(r || {}) }; }, wait });
  add('ride-1', () => {
    keep(); step(0.8);   // (the rider takes it: it starts moving)
    b = new SURF.Buoy(me, V(T.pos.x + 0.62, T.top + 2.5, T.pos.z + 0.62), V(0, 0, 0), false, 0);
    G.specials.world.push(b);
    let n = 0; while (b.phase === 'fly' && n++ < 120) step(1 / 60);
    t0 = 0; step(1.1); cam(); step(1 / 60);
    return { t: 1.1 };
  });
  add('ride-2', () => { step(1.5); cam(); step(1 / 60); return { t: 2.6 }; });
  add('ride-3', () => { step(1.5); cam(); step(1 / 60); return { t: 4.1 }; });
  void t0;
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
