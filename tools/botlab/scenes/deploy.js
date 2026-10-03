// Deployables can be shot; the tower crushes what's in its way (batch 5, [b5-deploy]: src/game/deployables.js) — pictures
// for tools/botlab/hud-shots.cjs on a Tower Command stage (the HUD up: the hit marker shows):
//   beacon-hit / beacon-pop        my round strikes an enemy Hop Beacon (it flashes white and squashes; the hit marker)
//                                  / the round that takes it to 0: it pops (a burst of its ink, its bits)
//   sprinkler-hit / sprinkler-pop  the same on an enemy Twirl Sprinkler
//   curtain-1 … curtain-3          the moving tower and a Drip Curtain across its track: just before, the crunch, after
//   deck                           a Lurk Mine and a Hop Beacon laid on the tower's deck, riding it (my team's: the
//                                  mine's see-through look)
//   SCENES=tools/botlab/scenes/deploy.js MAP=halyard MODE=tower PLAY=2 OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = m.tower, me = m.local, S = G.subs;
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; }
  G.projectiles.clear(); S.clear(); G.specials.clear(); G.paint.clear();
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); };
  m.actors.forEach(park);
  const foe = m.actors.find((a) => a.team !== me.team), mate = m.actors.find((a) => a.team === me.team && a !== me) || me;
  let hold = null;
  const step = (s, until) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { if (hold) hold(); dbg.step(1000 / 60); if (until && until()) return; } };
  const cine = (from, look, fov = 55) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); for (let i = 0; i < 2; i++) dbg.step(1000 / 6000); };   // (a sliver of sim: the rig takes it)
  const mid = (it) => { const n = it.normal || V(0, 1, 0), h = it.mesh.userData.hitH * 0.5; return it.pos.clone().addScaledVector(n, h); };
  // a flat open spot off the tower's track: level 3 m round it, nothing overhead, a clear 6 m line along +x
  const lvl = (x, z, y) => Math.abs(G.level.groundHeight(x, z, y + 1.5) - y) < 0.05;
  const N = [...G.nav.nodes].filter((n) => {
    if (G.physics.raycast(V(n.x, n.y + 0.3, n.z), V(0, 1, 0), 6).hit) return false;
    for (let r = 1; r <= 3; r += 1) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; if (!lvl(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y)) return false; }
    for (let x = 0; x <= 6; x += 0.75) if (!lvl(n.x + x, n.z, n.y)) return false;
    for (let s = -T.path.len[1]; s < T.path.len[0]; s += 2) { const q = T.path.at(s); if (Math.hypot(q.x - n.x, q.z - n.z) < 8) return false; }
    return true;
  }).sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
  const P = N[0] ? V(N[0].x, N[0].y, N[0].z) : V(T.pos.x + 10, T.pos.y, T.pos.z);
  // me at P facing +x; the device 4.2 m on; the camera over my shoulder
  const stand = () => { me.pos.set(P.x, P.y + 0.02, P.z); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = Math.PI / 2; me.aimPitch = -0.1; me.form = 'kid'; me.character.root.visible = true; };
  const shoulder = (it) => { const t = mid(it); cine(V(P.x - 1.9, P.y + 1.75, P.z - 1.15), V(t.x, t.y + 0.05, t.z), 50); };
  const shoot = (it) => { const t = mid(it), from = V(P.x + 0.3, P.y + 1.0, P.z); G.projectiles.fireCustom(me, from, t.clone().sub(from).normalize(), { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); };
  const scenes = [];
  const add = (name, set, moment, wait = 90) => scenes.push({ name, set, moment, wait });
  const hm = () => G.hud?.hitMarker?.('hit');
  let dev = null;
  for (const kind of ['beacon', 'sprinkler']) {
    add(kind + '-hit', () => {
      G.projectiles.clear(); stand(); hold = stand;
      const at = V(P.x + 4.2, P.y, P.z);
      if (kind === 'beacon') { const gh = G.physics.raycast(V(at.x, at.y + 1, at.z), V(0, -1, 0), 3); dev = S._plant(foe, SUBS.beacon, gh.point.clone(), gh.normal.clone(), -Math.PI / 2, gh, false); }
      else { dev = S._throw(foe, SUBS.sprinkler, V(at.x, at.y + 0.9, at.z), V(0, -6, 0), false); step(1, () => dev.state === 'spray'); step(0.6); }
      step(0.3);
      shoot(dev);
      step(1, () => dev.flash >= 0.9);   // (the frame it's struck)
      shoulder(dev);
      return { hp: dev.hp, flash: +dev.flash.toFixed(2), white: !!dev._flashOn };
    }, hm);
    add(kind + '-pop', () => {
      stand();
      while (dev.state !== 'dead' && dev.hp > 36) { shoot(dev); step(0.5, () => dev.flash >= 0.9); step(0.15); }
      shoot(dev);
      step(1, () => dev.state === 'dead');
      step(4 / 60);   // (the burst opening out)
      shoulder({ pos: dev.pos, normal: dev.normal, mesh: dev.mesh });
      return { state: dev.state };
    }, hm, 60);
  }
  // the tower: pushed at a steady 1.4 m/s (its rules stubbed), a teammate riding; a Drip Curtain across its track ahead
  const dir = me.team === 0 ? 1 : -1, rules0 = T._rules;
  let cur = null, sc = 0;
  const keep = () => { mate.pos.set(T.pos.x - 0.6, T.top + 0.02, T.pos.z - 0.6); mate.vel.set(0, 0, 0); mate.grounded = true; mate.form = 'kid'; mate.character.root.visible = true; };
  const along = (k) => { const a = T.path.at(T.s + dir * (k - 0.4)), b = T.path.at(T.s + dir * (k + 0.4)), d = V(b.x - a.x, 0, b.z - a.z); return d.lengthSq() > 1e-6 ? d.normalize() : V(1, 0, 0); };
  const camT = () => {
    const c = cur.pos, u = along((sc - T.s) * dir), sx = -u.z, sz = u.x;
    let from = null;
    for (const sg of [1, -1]) { const p = V(c.x + sx * 7.5 * sg - u.x * 2.5, c.y + 3.4, c.z + sz * 7.5 * sg - u.z * 2.5); if (G.physics.los(p, V(c.x, c.y + 1.2, c.z))) { from = p; break; } }
    cine(from || V(c.x + sx * 7.5, c.y + 3.4, c.z + sz * 7.5), V(c.x - u.x * 1.2, c.y + 1.0, c.z - u.z * 1.2), 58);
  };
  add('curtain-1', () => {
    G.projectiles.clear(); park(me, 0); hold = keep;
    T._rules = function () { this.s += dir * 1.4 / 60; this.moving = dir; };
    step(0.5);
    sc = T.s + dir * 4.2;
    const p = T.path.at(sc), u = along(4.2);
    cur = S._throw(foe, SUBS.curtain, V(p.x, p.y + 0.6, p.z), V(u.x * 0.3, -6, u.z * 0.3), false);
    hold = () => { keep(); if (cur && cur.state === 'curtain') cur.hp = SUBS.curtain.hp; };
    step(4, () => Math.abs(sc - T.s) < 1.25 + 0.55);   // (its front half a metre short of the sheet)
    camT();
    return { gap: +(Math.abs(sc - T.s) - 1.25).toFixed(2), state: cur.state };
  });
  add('curtain-2', () => {
    step(3, () => cur.state === 'dead');
    step(3 / 60);
    camT();
    return { state: cur.state };
  }, null, 40);
  add('curtain-3', () => { step(0.9); camT(); return { s: +T.s.toFixed(2) }; });
  add('deck', () => {
    hold = keep; step(0.2);
    const c = Math.cos(T.yaw), s = Math.sin(T.yaw), at = (lx, lz) => V(T.pos.x + c * lx + s * lz, T.top, T.pos.z - s * lx + c * lz);
    for (const [kind, lx, lz] of [['mine', 0.7, 0.65], ['beacon', 0.7, -0.65]]) { const p = at(lx, lz); mate.pos.set(p.x, p.y + 0.02, p.z); dbg.step(1000 / 60); S._place(mate, SUBS[kind]); }
    step(1.6);
    const u = along(0.5), sx = -u.z, sz = u.x, look = V(T.pos.x, T.top + 0.2, T.pos.z);
    let from = null;
    for (const sg of [1, -1]) { const p = V(T.pos.x + sx * 4.6 * sg + u.x * 1.6, T.top + 2.3, T.pos.z + sz * 4.6 * sg + u.z * 1.6); if (G.physics.los(p, look)) { from = p; break; } }
    cine(from || V(T.pos.x + sx * 4.6, T.top + 2.3, T.pos.z + sz * 4.6), look, 52);
    const ms = S.items.filter((x) => x.state === 'mine' || x.state === 'beacon').map((x) => [x.kind, x.on && x.on.b.tag]);
    T._rules = rules0;
    return { on: ms };
  });
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
