// [b5-sub-glide] fix round 2: a shallow wall bounce, for tools/botlab/hud-shots.cjs on the testbox (its wall x 14…15,
// z −8…8):
//   MAP=testbox PLAY=1 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-glide/scenes-wall.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   touch   a tap thrown 10° to the wall, the frame its body meets the face: low, looking along the wall — the stone's side
//           against the face, not sunk into it
//   after   12 frames later from the same eye: the lane runs into the wall and turns off it
//   top     the same throw from above, 30 frames after the bounce: the lane's kink off the wall
(async () => {
  const g = window.__inkwave, m = g.match, me = m.local, G = window.__G, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { on } = await import('./src/core/ctx.js');
  const K = SUB_KITS.glide, V = (x, y, z) => new THREE.Vector3(x, y, z), RB = SUBS.glide.bodyRadius;
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  let hold = false;
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = a === me && hold; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  g.debug.freeze();
  const others = m.actors.filter((a) => a !== me);
  const th = 10 * Math.PI / 180, x0 = 14 - RB - 6.5 * Math.tan(th) - 0.5 * Math.sin(th);
  let bounced = null; on('glide:bounce', (e) => { if (!bounced) bounced = { x: e.pos.x, z: e.pos.z, kind: e.kind }; });
  const cine = (from, look, fov = 50) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); };
  let stone = null;
  const throwIt = () => {
    hold = false; step(2); G.subs.clear(); G.projectiles.clear(); G.paint.clear?.();
    others.forEach((a, i) => { a.pos.set(-20 + (i % 4) * 2, 0.02, 30 - Math.floor(i / 4) * 2); a.vel.set(0, 0, 0); });
    if (!me.alive) me.respawn();
    me.pos.set(x0, 0.02, -7); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = th; me.aimPitch = -0.1; if (me.bot) { me.bot.aimYaw = th; me.bot.aimPitch = -0.1; }
    me.setSub('glide'); me.ink = 100; step(6);
    bounced = null; hold = true; step(6); hold = false; step(1);
    stone = K.items[K.items.length - 1];
    let n = 0; while (!bounced && stone.state === 'slide' && n++ < 200) step(1);
  };
  const deep = () => +(stone.p.x + RB - 14).toFixed(3);
  window.__hudScenes = [
    { name: 'touch', wait: 300, set: async () => {
      g.hud?.setVisible?.(false); throwIt();
      // (me out of the shot)
      me.pos.set(x0 - 6, 0.02, -12);
      cine(V(13.05, 0.55, stone.p.z - 3.2), V(13.95, 0.12, stone.p.z + 0.6), 42);
      step(1);
      return { bounced, at: [stone.p.x, stone.p.z], bodyIntoWall: deep() };
    } },
    { name: 'after', wait: 300, set: async () => {
      const z0 = stone.p.z; step(12);
      cine(V(13.05, 0.55, z0 - 3.2), V(13.95, 0.12, z0 + 0.6), 42);
      step(1);
      return { at: [stone.p.x, stone.p.z], vx: stone.v.x };
    } },
    { name: 'top', wait: 300, set: async () => {
      throwIt(); const b = { ...bounced }; me.pos.set(x0 - 6, 0.02, -12);
      step(30);
      cine(V(10.6, 6.2, b.z - 4.5), V(13.4, 0, b.z + 0.6), 50);
      step(1);
      return { bounce: b, at: [stone.p.x, stone.p.z] };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
