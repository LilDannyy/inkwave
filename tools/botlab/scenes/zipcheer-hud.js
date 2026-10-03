// [b5-zipcheer] The Cheer Orb on a teammate's HUD, for tools/botlab/hud-shots.cjs (halyard; run at 1280×720 and 960×600):
//   MAP=halyard MODE=turf PLAY=4 W=1280 H=720 SCENES=tools/botlab/scenes/zipcheer-hud.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   prompt   your teammate up in the air charging a Cheer Orb ahead of you: the big cheer prompt bottom middle (the key,
//            CHEER!, whose orb, its charge)
//   cheer    you cheered: your wisp in flight to the orb (in the world) and your HUD wisp in flight up into your gauge
//   arrive   your wisp reaching the orb: the burst at the ball (its name tag over it, not on it)
//   gain     the HUD wisp landed: the ring round the gauge and the "+4%"
//   mate     your teammate up in the air close by, from your over-the-shoulder camera: its ground cue (shadow, ring,
//            column), its orb clear of its tag
//   foe      an ENEMY up in the air charging one ahead of you (no prompt, no tag): its ground cue in its colour
// (fix round 1: the teammate's name tag sits over the orb; the ground cue under a held-up user — sp-cheer.js cue)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const me = m.local;
  dbg.freeze();
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.sub = it.jump = it.special = it.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  const frame = () => dbg.step(1000 / 60);
  const M1 = m.actors.find((a) => a.team === me.team && a !== me);
  const pad = G.level.spawnPads[me.team], f = me.team ? -1 : 1;
  const put = (a, dz, dx) => { if (!a.alive) a.respawn(); const x = pad.x + dx, z = pad.z + f * dz, y = G.level.groundHeight(x, z, pad.y + 3); a.pos.set(x, (y > -Infinity ? y : pad.y) + 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.invuln = 99; };
  // (the camera turned a little off the teammate, so your own kid doesn't hide them; tipped up to the orb)
  const view = (who = M1, off = 0.3) => {
    const dx = who.pos.x - me.pos.x, dz = who.pos.z - me.pos.z, yaw = Math.atan2(dx, dz);
    me.yaw = me.aimYaw = yaw; who.yaw = who.aimYaw = yaw + Math.PI;
    g.rig.follow?.(me, true); g.rig.yaw = yaw + off; g.rig.pitch = 0.1;
  };
  // (on screen: the bottom of M1's name tag, arrow included, over the top of its orb's halo — y grows down)
  const tagOverOrb = () => {
    const s = M1.specialActive, mk = G.hud.markers.find((el) => el._name === M1.name && el.style.display !== 'none');
    const tr = mk && /translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/.exec(mk.style.transform);
    if (!s || !s.ball || !tr) return null;
    const t = mk.querySelector('.iw-mk__tag').getBoundingClientRect(), r = mk.getBoundingClientRect();
    const v = s.ball.position.clone(); v.y += s.halo.scale.y; v.project(G.camera);
    return { tagBottom: Math.round(+tr[2] + t.bottom - r.top + 6), orbTop: Math.round((-v.y * 0.5 + 0.5) * innerHeight) };
  };
  window.__hudScenes = [
    { name: 'prompt', wait: 300, set: async () => {
      G.specials.clear(); G.projectiles.clear();
      put(me, 1.0, -1.5); put(M1, 10, 1.5); view();
      for (let i = 0; i < 20; i++) frame();
      M1.specialId = 'booyah'; M1.special = M1.specialCost(); M1._startSpecial();
      me.special = me.specialCost() * 0.45;
      for (let i = 0; i < 60; i++) { frame(); view(); }
      const st = G.hud.cheer.state(), r = G.hud.cheer.el.getBoundingClientRect();
      return { st, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], screen: [innerWidth, innerHeight], up: +(M1.pos.y - G.level.groundHeight(M1.pos.x, M1.pos.z, M1.pos.y)).toFixed(2), cue: !!M1.specialActive?.cue, tagOverOrb: tagOverOrb() };
    } },
    { name: 'cheer', wait: 120, set: async () => {
      me._cheerT = -9; me.intent.cheer = true;
      for (let i = 0; i < 14; i++) { frame(); view(); }
      const hw = G.hud.cheer.wisps[0], b = hw.firstChild.getBoundingClientRect();
      return { st: G.hud.cheer.state(), hudWisp: [Math.round(b.left), Math.round(b.top), Math.round(b.width)], orbWisps: G.specials.world.filter((w) => w.kind === 'cheerwisp').length };
    } },
    { name: 'arrive', wait: 60, set: async () => {
      let n = 0;
      for (; n < 90 && G.specials.world.some((w) => w.kind === 'cheerwisp'); n++) { frame(); view(); }
      for (let i = 0; i < 3; i++) { frame(); view(); }
      return { framesToArrive: n, orbCharge: +(M1.specialActive?.charge || 0).toFixed(2), tagOverOrb: tagOverOrb() };
    } },
    { name: 'gain', wait: 160, set: async () => {
      const sp0 = me.special;
      for (let i = 0; i < 60 && me.special <= sp0 + 1e-6; i++) { frame(); view(); }
      return { st: G.hud.cheer.state(), special: +(me.special / me.specialCost()).toFixed(3) };
    }, moment: () => { G.hud.cheer._gain(0.04); } },   // (its pop is a CSS animation: replayed for the capture)
    { name: 'mate', wait: 300, set: async () => {
      if (M1.specialActive) G.specials.end(M1, 'test');
      G.specials.clear(); G.projectiles.clear();
      put(me, 1.0, -1.5); put(M1, 5, 1.5); view(M1, 0.45);
      for (let i = 0; i < 20; i++) frame();
      M1.specialId = 'booyah'; M1.special = M1.specialCost(); M1._startSpecial();
      for (let i = 0; i < 60; i++) { frame(); view(M1, 0.45); }
      return { up: +(M1.pos.y - G.level.groundHeight(M1.pos.x, M1.pos.z, M1.pos.y)).toFixed(2), cue: !!M1.specialActive?.cue, tagOverOrb: tagOverOrb() };
    } },
    { name: 'foe', wait: 300, set: async () => {
      if (M1.specialActive) G.specials.end(M1, 'test');
      G.specials.clear(); G.projectiles.clear();
      const E1 = m.actors.find((a) => a.team !== me.team);
      put(me, 1.0, -1.5); put(M1, 3, -6); put(E1, 10, 1.5); view(E1);
      for (let i = 0; i < 20; i++) frame();
      E1.specialId = 'booyah'; E1.special = E1.specialCost(); E1._startSpecial();
      for (let i = 0; i < 60; i++) { frame(); view(E1); }
      const s = E1.specialActive;
      return { prompt: G.hud.cheer.state().on, up: +(E1.pos.y - G.level.groundHeight(E1.pos.x, E1.pos.z, E1.pos.y)).toFixed(2), cue: !!(s && s.cue), charge: s && +s.charge.toFixed(2) };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
