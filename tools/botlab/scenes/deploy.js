// Deployables can be shot; the tower crushes what's in its way (batch 5, [b5-deploy]: src/game/deployables.js) — pictures
// for tools/botlab/hud-shots.cjs on a Tower Command stage (the HUD up: the hit marker shows):
//   beacon-hit / beacon-pop        my round strikes an enemy Hop Beacon (it flashes white and squashes; the hit marker)
//                                  / the round that takes it to 0: it pops (a burst of its ink, its bits)
//   sprinkler-hit / sprinkler-pop  the same on an enemy Twirl Sprinkler
//   skitter-hit / skitter-pop      an enemy Skitter Bomb scuttling at me: my first round flashes it / the second pops it —
//                                  a puff of its ink and a small ring, no blast ([b5-deploy] fix round 1)
//   buoy-hit                       my round strikes an enemy Surf N' Turf buoy (its flash; the hit marker)
//   curtain-1 … curtain-3          the moving tower and a Drip Curtain across its track: just before, the crunch, after
//   beacon-crush-1 / -2            … and a Hop Beacon on its track: just before, the crunch (the camera ahead of it, on the
//                                  device's side: the burst in front of the tower's front)
//   buoy-crush-1 / -2              … and a Surf N' Turf buoy: the same
//   deck                           a Lurk Mine and a Hop Beacon laid on the tower's deck, riding it (my team's: the
//                                  mine's see-through look)
//   (the tower shots: the HUD's lead callouts held off — "WE TOOK THE LEAD!" covered the crunch)
//   SCENES=tools/botlab/scenes/deploy.js MAP=halyard MODE=tower PLAY=2 OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  const SURF = await import('./src/game/sp-surf.js');
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
  // an enemy Skitter Bomb scuttling at me (held where it is: it never reaches me) — my rounds: the first flashes it, the
  // second pops it (60 hp: two of the Spritzer's 36)
  let sk = null, skAt = null;
  const pin = () => { stand(); if (sk && sk.state === 'run') { sk.pos.copy(skAt); sk.mesh.position.copy(skAt); sk.t = 0; sk.target = null; } };
  add('skitter-hit', () => {
    G.projectiles.clear(); stand(); hold = stand;
    const at = V(P.x + 4.2, P.y, P.z);
    sk = S._throw(foe, SUBS.seeker, V(at.x, at.y + 0.7, at.z), V(0, -6, 0), false);
    step(1, () => sk.state === 'run');
    skAt = sk.pos.clone(); sk.heading = -Math.PI / 2; hold = pin;
    step(0.3);
    shoot(sk);
    step(1, () => sk.flash >= 0.9);
    shoulder(sk);
    return { state: sk.state, hp: sk.hp, flash: +(sk.flash || 0).toFixed(2) };
  }, hm);
  add('skitter-pop', () => {
    step(0.4);
    shoot(sk);
    step(1, () => sk.state === 'dead');
    step(3 / 60);   // (the puff opening out)
    shoulder({ pos: skAt, normal: V(0, 1, 0), mesh: { userData: { hitH: 0.3 } } });
    return { state: sk.state, popped: true };
  }, hm, 40);
  // an enemy buoy, struck
  add('buoy-hit', () => {
    G.projectiles.clear(); G.specials.clear(); stand(); hold = stand;
    const b = new SURF.Buoy(foe, V(P.x + 4.6, P.y + 0.3, P.z), V(0, 0, 0), false, 0); G.specials.world.push(b); b.land(V(P.x + 4.6, P.y, P.z));
    step(0.4);
    const t = V(b.pos.x, b.pos.y + 0.6, b.pos.z), from = V(P.x + 0.3, P.y + 1.0, P.z);
    G.projectiles.fireCustom(me, from, t.clone().sub(from).normalize(), { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
    step(1, () => b.flash >= 0.45);
    cine(V(P.x - 1.9, P.y + 1.75, P.z - 1.15), V(t.x, t.y, t.z), 50);
    const out = { hp: b.hp, flash: +b.flash.toFixed(2) };
    G.specials.clear();
    return out;
  }, hm);
  // the tower: pushed at a steady 1.4 m/s (its rules stubbed), a teammate riding; a Drip Curtain across its track ahead
  const dir = me.team === 0 ? 1 : -1, rules0 = T._rules;
  let cur = null, curAt = null, sc = 0;
  const keep = () => { mate.pos.set(T.pos.x - 0.6, T.top + 0.02, T.pos.z - 0.6); mate.vel.set(0, 0, 0); mate.grounded = true; mate.form = 'kid'; mate.character.root.visible = true; };
  const along = (k) => { const a = T.path.at(T.s + dir * (k - 0.4)), b = T.path.at(T.s + dir * (k + 0.4)), d = V(b.x - a.x, 0, b.z - a.z); return d.lengthSq() > 1e-6 ? d.normalize() : V(1, 0, 0); };
  const camT = () => {
    const c = cur.pos, u = along((sc - T.s) * dir), sx = -u.z, sz = u.x;
    let from = null;
    for (const sg of [1, -1]) { const p = V(c.x + sx * 7.5 * sg - u.x * 2.5, c.y + 3.4, c.z + sz * 7.5 * sg - u.z * 2.5); if (G.physics.los(p, V(c.x, c.y + 1.2, c.z))) { from = p; break; } }
    cine(from || V(c.x + sx * 7.5, c.y + 3.4, c.z + sz * 7.5), V(c.x - u.x * 1.2, c.y + 1.0, c.z - u.z * 1.2), 58);
  };
  // (the HUD's lead callouts held off for these: "WE TOOK THE LEAD!" sat on the frame's middle)
  const quiet = () => { if (G.hud?.lead) G.hud.lead.stingT = Infinity; document.querySelectorAll('.iw-zcall, .iw-bn').forEach((e) => e.remove()); };
  add('curtain-1', () => {
    G.projectiles.clear(); park(me, 0); hold = keep; quiet();
    T._rules = function () { this.s += dir * 1.4 / 60; this.moving = dir; };
    step(0.5);
    sc = T.s + dir * 4.2;
    const p = T.path.at(sc), u = along(4.2);
    cur = S._throw(foe, SUBS.curtain, V(p.x, p.y + 0.6, p.z), V(u.x * 0.3, -6, u.z * 0.3), false);
    hold = () => { keep(); if (cur && cur.state === 'curtain') cur.hp = SUBS.curtain.hp; };
    step(4, () => Math.abs(sc - T.s) < 1.25 + 0.55);   // (its front half a metre short of the sheet)
    curAt = cur.pos.clone();
    camFront(curAt);   // (fix round 1, resumed: ahead of the sheet like the beacon / buoy shots — from beside the track the
    // tower hid most of the crunch)
    return { gap: +(Math.abs(sc - T.s) - 1.25).toFixed(2), state: cur.state };
  });
  add('curtain-2', () => {
    step(3, () => cur.state === 'dead');
    step(3 / 60);
    camFront(curAt); quiet();
    return { state: cur.state };
  }, null, 40);
  add('curtain-3', () => { step(0.9); camT(); quiet(); return { s: +T.s.toFixed(2) }; });
  // a beacon, then a buoy, on its track: just before, then the crunch — the camera ahead of the device, off to its side,
  // looking back at the tower's front (the burst in front of it, not behind it)
  // (the checkpoints' glowing columns stand on the track: a camera right beside one saw it as a wide band across the frame
  // — buoy-crush-1/2 in fix round 1. A camera whose sight line passes within 1.3 m of one is passed over)
  const cpAt = (T.cps || []).map((cp) => T.path.at(cp.team === 0 ? cp.d : -cp.d));
  const clearOfCps = (p, q) => cpAt.every((k) => { const dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((k.x - p.x) * dx + (k.z - p.z) * dz) / l2)); return Math.hypot(p.x + dx * t - k.x, p.z + dz * t - k.z) > 1.3; });
  const camFront = (c) => {
    // (u: from the tower to the device — the way it comes at it, round a bend too)
    const u = V(c.x - T.pos.x, 0, c.z - T.pos.z).normalize(), sx = -u.z, sz = u.x, look = V(c.x - u.x * 0.6, c.y + 0.7, c.z - u.z * 0.6);
    let from = null;
    for (const [ah, sd] of [[4.6, 3.4], [4.6, 4.6], [3.6, 5.2]]) for (const sg of [1, -1]) {
      if (from) break;
      const p = V(c.x + u.x * ah + sx * sd * sg, c.y + 2.2, c.z + u.z * ah + sz * sd * sg);
      if (G.physics.los(p, V(c.x, c.y + 0.6, c.z)) && clearOfCps(p, look)) from = p;
    }
    cine(from || V(c.x + u.x * 4.6 + sx * 3.4, c.y + 2.2, c.z + u.z * 4.6 + sz * 3.4), look, 56);
    return { c: [c.x, c.z].map((x) => +x.toFixed(2)), T: [T.pos.x, T.pos.z].map((x) => +x.toFixed(2)), from: from && [from.x, from.y, from.z].map((x) => +x.toFixed(2)) };
  };
  let dv = null, dvAt = null;
  for (const kind of ['beacon', 'buoy']) {
    add(kind + '-crush-1', () => {
      G.projectiles.clear(); hold = keep; quiet();
      step(kind === 'beacon' ? 3 : 0.3);   // (on Halyard: past the stretch the curtain was crushed on)
      sc = T.s + dir * 4.4;
      const p = T.path.at(sc);
      if (kind === 'beacon') { const gh = G.physics.raycast(V(p.x, p.y + 1, p.z), V(0, -1, 0), 3); dv = S._plant(foe, SUBS.beacon, gh.point.clone(), gh.normal.clone(), 0, gh, false); }
      else { dv = new SURF.Buoy(foe, V(p.x, p.y + 0.3, p.z), V(0, 0, 0), false, 0); G.specials.world.push(dv); dv.land(V(p.x, p.y, p.z)); }
      dvAt = dv.pos.clone();
      hold = () => { keep(); if (kind === 'buoy' && dv.phase === 'live') dv.T = 0; };
      step(4, () => Math.abs(sc - T.s) < 1.25 + (kind === 'buoy' ? 0.7 : 0.55));
      const cf = camFront(dvAt); quiet();
      return { gap: +(Math.abs(sc - T.s) - 1.25).toFixed(2), cam: cf };
    });
    add(kind + '-crush-2', () => {
      step(3, () => (kind === 'beacon' ? dv.state === 'dead' : dv.dead || dv.phase !== 'live'));
      step(3 / 60);
      camFront(dvAt); quiet();
      return { crushed: kind === 'beacon' ? dv.state : dv.phase };
    }, null, 40);
  }
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
