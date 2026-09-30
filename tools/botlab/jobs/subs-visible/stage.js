// Sub visibility pass: stages one sub weapon in one pose on the testbox for a picture (or a measurement).
// Evaluated in the game page (MAP=testbox); defines window.__SV:
//   __SV.POSES                     [[kind, pose], …] every staged picture
//   __SV.stage(kind, pose, cam)    reset the scene, throw / place the sub, run the sim to the pose, point the camera
//                                  (cam 'side': a player ~8 m away at eye height; 'thrower': the thrower's own follow
//                                  camera) → { kind, pose, pos, box } (box: the model's world box, precise)
// Only public game objects are driven (G.subs, G.projectiles, the kit lists), so it runs on any build — the same scenes
// before and after a change. Everything else in the match is parked out of sight; bots are frozen.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const G = window.__G;
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foe = others.find((a) => a.team !== me.team);
  for (const a of others) if (a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const step = (n = 1) => { if (n > 0) dbg.step(n * 1000 / 60); };
  const fov0 = g.settings.fov;
  const T = V(0, 0, -8), S = V(0, 0, -1);           // thrower's spot (facing +z) and the rest spot 7 m ahead of it
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const park = (a, i) => { put(a, V(-24 + (i % 4) * 1.5, 0, 34 + Math.floor(i / 4) * 1.5)); a.character.setVisible(false); };
  const aim = (yaw, pitch) => { g.rig.yaw = yaw; g.rig.pitch = pitch; me.aimYaw = me.yaw = yaw; me.aimPitch = pitch; };
  const until = (cond, max = 240) => { for (let i = 0; i < max; i++) { if (cond()) return true; step(1); } return !!cond(); };
  const last = (arr) => arr[arr.length - 1];
  const K = SUB_KITS;
  const kitList = { shaker: () => K.shaker.items, waddle: () => K.waddle.items, torpedo: () => K.torpedo._list, tracer: () => K.tracer._bolts, boomerang: () => K.boomerang._items };

  function reset() {
    window.__rs?.(4242);   // (shots.cjs: a seeded Math.random)
    G.subs.clear(); G.projectiles.clear(); G.paint.clear?.();
    others.forEach(park);
    put(me, T, 0); me.character.setVisible(true); me.ink = 100;
    g.hud?.setVisible(false); g.menus?.show(null);
    document.querySelectorAll('.iw-hud, .iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
    g.settings.fov = fov0;
    g.rig.follow(me, true);
    aim(0, 0.1);
    step(2); if (g.rig.blend) g.rig.blend.active = false;   // (no ease back from the last picture's camera: the crosshair
    step(8);                                                 // ray — the tracer's launch line — must be the same every time)
  }
  // the model part of each staged object (what the picture / the size check is about: no sheets, rings or blur discs)
  const model = {
    sub: (it) => it.mesh.userData.inner,
    bomb: (b) => b.mesh,
    shaker: (it) => it.m.inner,
    waddle: (it) => it.m.rock,
    torpedo: (t) => t.mesh,
    tracer: (b) => b.head.children[0],
    boomerang: (it) => it.mesh.userData.spin,
  };
  const worldBox = (o) => { o.updateWorldMatrix(true, true); return new THREE.Box3().setFromObject(o, true); };

  // ---- the scenes: each returns { obj, root (the object whose world position the camera looks at), side (camera dir) }
  const subItem = (kind) => last(G.subs.items.filter((it) => it.kind === kind));
  const throwSub = (kind) => { G.subs.use(me, SUBS[kind]); };
  const scenes = {
    fly(kind) {   // a natural throw from the thrower, 0.2 s into its flight
      if (kind === 'tracer') { aim(0, -0.1); step(4); }   // (fired at the floor a few m out: it skims on from there)
      if (kind === 'bomb') G.projectiles.throwBomb(me); else throwSub(kind);
      step(kind === 'tracer' ? 10 : 12);   // (the tracer: past its first bounce, skimming the floor)
      return pick(kind);
    },
    rest(kind) {
      if (kind === 'bomb') {
        G.projectiles.throwBomb(me); const b = last(G.projectiles.bombs); b.pos.set(S.x, 0.5, S.z); b.vel.set(0, -1, 0);
        until(() => b.fuse >= 0, 90); step(8); return { item: b, obj: model.bomb(b), root: b.mesh };
      }
      if (kind === 'sticky') {   // on the wall block's face (x = 14), 1.2 m up
        put(me, V(7, 0, 0), Math.PI / 2); aim(Math.PI / 2, 0); g.rig.follow(me, true); step(3);
        G.subs._throw(me, SUBS.sticky, V(13.2, 1.2, 0), V(10, 0, 0), false);
        const it = subItem('sticky'); until(() => it.state === 'stuck', 60); step(6);
        return { item: it, obj: model.sub(it), root: it.mesh, side: V(-4, 0, 7) };
      }
      if (kind === 'curtain' || kind === 'sprinkler') {
        G.subs._throw(me, SUBS[kind], V(S.x, 0.5, S.z), V(0, -2, 0.02), false);
        const it = subItem(kind); until(() => it.state === kind || it.state === 'spray', 60); step(kind === 'curtain' ? 24 : 30);
        return { item: it, obj: model.sub(it), root: it.mesh };
      }
      if (kind === 'mine' || kind === 'beacon') {
        put(me, S, 0); step(2); throwSub(kind); put(me, T, 0); g.rig.follow(me, true); aim(0, 0.1); step(12);
        const it = subItem(kind); return { item: it, obj: model.sub(it), root: it.mesh };
      }
      if (kind === 'shaker' || kind === 'waddle') {
        throwSub(kind); const it = last(kitList[kind]()); it.pos.set(S.x, 0.5, S.z); it.vel.set(0, -1, 0);
        if (kind === 'shaker') { until(() => it.armed && it.ground > 0, 90); step(8); } else { until(() => it.state === 'sense', 90); step(12); }
        return { item: it, obj: model[kind](it), root: kind === 'shaker' ? it.m.outer : it.m.outer };
      }
      return null;
    },
    run(kind) {   // skitter bomb scuttling after a foe
      put(foe, V(3, 0, 7), Math.PI); foe.character.setVisible(true);
      throwSub(kind); const it = subItem(kind); until(() => it.state === 'run', 120); step(24);
      return { item: it, obj: model.sub(it), root: it.mesh };
    },
    walk(kind) {  // waddle bomb walking after a foe
      put(foe, V(4, 0, 4), Math.PI); foe.character.setVisible(true);
      throwSub(kind); const it = last(kitList.waddle()); it.pos.set(S.x, 0.5, S.z); it.vel.set(0, -1, 0);
      until(() => it.state === 'walk', 150); step(30);
      return { item: it, obj: model.waddle(it), root: it.m.outer };
    },
    lock(kind) {  // tide torpedo locked on, fins out (hovering), just before it launches
      put(foe, V(0, 0, -2), Math.PI); foe.character.setVisible(true);
      throwSub(kind); const t = last(kitList.torpedo()); until(() => t.state === 'unfold', 90); step(24);
      return { item: t, obj: model.torpedo(t), root: t.mesh };
    },
    hover(kind) { throwSub(kind); const it = last(kitList.boomerang()); until(() => it.state === 'hover', 120); step(10); return { item: it, obj: model.boomerang(it), root: it.mesh }; },
    orbit(kind) { throwSub(kind); const it = last(kitList.boomerang()); until(() => it.state === 'orbit', 300); step(10); return { item: it, obj: model.boomerang(it), root: it.mesh }; },
  };
  function pick(kind) {
    if (kind === 'bomb') { const b = last(G.projectiles.bombs); return { item: b, obj: model.bomb(b), root: b.mesh }; }
    if (kitList[kind]) {
      const it = last(kitList[kind]());
      const root = kind === 'shaker' || kind === 'waddle' ? it.m.outer : kind === 'tracer' ? it.head : it.mesh;
      return { item: it, obj: model[kind](it), root };
    }
    const it = subItem(kind); return { item: it, obj: model.sub(it), root: it.mesh };
  }

  const POSES = [
    ['bomb', 'rest'], ['bomb', 'fly'], ['sticky', 'rest'], ['sticky', 'fly'], ['burst', 'fly'], ['seeker', 'run'], ['seeker', 'fly'],
    ['scan', 'fly'], ['curtain', 'rest'], ['curtain', 'fly'], ['sprinkler', 'rest'], ['sprinkler', 'fly'], ['mine', 'rest'], ['beacon', 'rest'],
    ['mist', 'fly'], ['shaker', 'rest'], ['shaker', 'fly'], ['waddle', 'rest'], ['waddle', 'walk'], ['waddle', 'fly'],
    ['torpedo', 'lock'], ['torpedo', 'fly'], ['tracer', 'fly'], ['boomerang', 'hover'], ['boomerang', 'orbit'],
  ];
  const r3 = (v) => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
  function stage(kind, pose, cam = 'side') {
    reset();
    const s = scenes[pose](kind);
    if (!s || !s.obj) return { kind, pose, err: 'no object' };
    // the camera: 2 frames to settle (the scene moves on with it: the same for every run)
    const p = s.root.getWorldPosition(new THREE.Vector3());
    if (cam === 'side') {
      const moving = pose !== 'rest' && pose !== 'hover';
      const vel = s.item.vel && moving ? s.item.vel : null;
      const look = p.clone(); if (vel) look.addScaledVector(vel, 2 / 60);
      const d = (s.side || V(8, 0, 2.2)).clone().setY(0).normalize().multiplyScalar(8);
      const from = look.clone().add(d); from.y = Math.max(0, look.y - 0.3) + 1.5;
      g.rig.cinematic(from, from, look, look, 99, () => {});
    } else {   // the thrower looking at it (the camera orbits over the kid's shoulder: pitched down onto the floor)
      const d = p.clone().sub(me.pos), grounded = p.y - me.pos.y < 0.9;
      aim(Math.atan2(d.x, d.z), grounded ? -0.3 : Math.max(-0.3, Math.min(0.5, Math.atan2(d.y - 1.6, Math.hypot(d.x, d.z)) + 0.12)));
      g.rig.follow(me, true);
    }
    step(2);
    const box = worldBox(s.obj), p2 = s.root.getWorldPosition(new THREE.Vector3());
    const scr = box.getCenter(new THREE.Vector3()).project(G.camera);   // where it is in the picture (0..1, y down)
    return { kind, pose, cam, state: s.item.state, pos: r3(p2), min: r3(box.min), max: r3(box.max), size: r3(box.getSize(new THREE.Vector3())),
      screen: [+((scr.x + 1) / 2).toFixed(4), +((1 - scr.y) / 2).toFixed(4)] };
  }
  window.__SV = { POSES, stage, reset, scenes, model, worldBox, T, S };
  return POSES.length;
})()
