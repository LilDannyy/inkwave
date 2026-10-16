// [b5-int3] wave 2's polish pictures, for tools/botlab/hud-shots.cjs (scratch):
//   MAP=testbox PLAY=1 W=960 H=600 SCENES=tools/botlab/jobs/batch5/int3/scenes-polish.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   dash-pov-fwd     the Dash Pellet from the dasher's own camera, a forward dash ~0.1 s in: the camera-facing ribbon,
//                    the speed lines at the edges, the FOV kick (the HUD up)
//   dash-pov-back    the same, a backward dash
//   glide-roll-mid   the Glide Bomb's underhand roll, side-on, mid-swing (~0.03 s after the release: the arm coming through
//                    low with the stone still at the fist), a Splattershot in the other hand so the free arm reads
//   glide-roll-release the release frame: the stone at the fist that held it, the arm starting through
//   glide-roll-leave the stone out of the hand and down (~0.07 s: the fist low in front, the follow-through)
//   sentry-stencil   close on the Scrap Sentry's scrap plate: the team-ink squid stencil centred on it
//   sentry-guide     holding the sentry beside testbox's wall: the guide's ring stops at the wall (where it will see), the
//                    full 11 m past it faint
//   sentry-life      the HUD with my sentry standing: the life ring on the sub badge (the redrawn icon at HUD size)
//   sentry-picker    the loadout's sub picker on the Scrap Sentry tile (the redrawn icon beside the others)
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, me = m.local, G = window.__G;
  const THREE = await import('three'); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { SUBS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const W = new Map();
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent, w = W.get(a) || {}; it.move.set(w.move ? w.move[0] : 0, 0, w.move ? w.move[1] : 0); it.fire = !!w.fire; it.squid = false; it.jump = !!w.jump; it.special = false; it.sub = !!w.sub; };
  g.debug.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); step(3); }
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; }
  const S = { x: 0, y: 0, z: -10 };
  const park = () => m.actors.forEach((a, i) => { if (a !== me) a.spawnAt(V(-24 + i * 1.5, 0.02, 34), 0); });
  const put = (a, x, z, yaw) => { a.spawnAt(V(x, S.y + 0.02, z), yaw); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.invuln = 0; a.vel.set(0, 0, 0); };
  const cam = (from, look) => { g.rig.cinematic(from, from, look, look, 1e6); };
  const follow = (yaw, pitch = 0.12) => { g.rig.follow(me, true); g.rig.yaw = yaw; g.rig.pitch = pitch; };
  const clean = () => { G.subs.clear(); G.projectiles.clear(); G.paint.clear?.(); };
  park();
  window.__hudScenes = [
    { name: 'dash-pov-fwd', wait: 60, set: async () => {
      clean(); me.setWeapon('shooter'); me.setSub('dash'); me.ink = 100;
      put(me, S.x, S.z - 6, 0); g.hud?.setVisible?.(true); follow(Math.PI, 0.16);
      W.set(me, {}); step(40);
      W.set(me, { sub: true, move: [0, 1] }); step(1); W.set(me, { move: [0, 1] }); step(9);   // (~0.17 s: past the pop, the ribbon out ahead of it)
      return { dashT: +me.weaponRunner.dashT.toFixed(3), fov: +G.camera.fov.toFixed(2), lines: SUB_KITS.dash._lines?.().el?.style.opacity, ribbons: SUB_KITS.dash._ribbons.length };
    } },
    { name: 'dash-pov-back', wait: 60, set: async () => {
      W.set(me, {}); step(60); clean(); me.ink = 100;
      put(me, S.x, S.z + 2, 0); follow(Math.PI, 0.16); step(40);
      W.set(me, { sub: true, move: [0, -1] }); step(1); W.set(me, { move: [0, -1] }); step(5);
      return { dashT: +me.weaponRunner.dashT.toFixed(3), fov: +G.camera.fov.toFixed(2), lines: SUB_KITS.dash._lines?.().el?.style.opacity };
    } },
    { name: 'glide-roll-mid', wait: 60, set: async () => {
      W.set(me, {}); step(60); clean();
      g.hud?.setVisible?.(false);
      me.setWeapon('shooter'); me.setSub('glide'); me.ink = 100;
      put(me, S.x, S.z, Math.PI / 2); step(20);
      // side-on: the kid faces +x; the camera off its left side (the free left arm — the Splattershot is in its right hand),
      // at hip height
      cam(V(S.x + 0.6, S.y + 0.85, S.z - 3.1), V(S.x + 0.6, S.y + 0.55, S.z));
      W.set(me, { sub: true }); step(8);   // (a tap: held ~0.13 s, so no cook)
      W.set(me, {}); step(1);   // (the release frame)
      const t0 = G.time;
      step(2);   // ([b5-int3] ~0.03 s into the swing: the arm coming through low, the stone still at the fist — glide.js fromHand)
      const st = SUB_KITS.glide.items.find((x) => x.state !== 'dead');
      return { since: +(G.time - t0).toFixed(3), stone: st ? [+(st.m.outer.position.x - me.pos.x).toFixed(2), +st.m.outer.position.y.toFixed(2), +(st.p.x - me.pos.x).toFixed(2)] : null };
    } },
    { name: 'glide-roll-release', wait: 60, set: async () => {
      clean(); step(30);
      put(me, S.x, S.z, Math.PI / 2); me.ink = 100; step(20);
      cam(V(S.x + 0.6, S.y + 0.85, S.z - 3.1), V(S.x + 0.6, S.y + 0.45, S.z));
      W.set(me, { sub: true }); step(8);
      W.set(me, {}); step(1);   // ([b5-int3] the release frame: the stone at the fist, the arm starting through)
      const st = SUB_KITS.glide.items.find((x) => x.state !== 'dead');
      return { stone: st ? [+(st.m.outer.position.x - me.pos.x).toFixed(2), +st.m.outer.position.y.toFixed(2), +(st.p.x - me.pos.x).toFixed(2)] : null };
    } },
    { name: 'glide-roll-leave', wait: 60, set: async () => {
      clean(); step(30);
      put(me, S.x, S.z, Math.PI / 2); me.ink = 100; step(20);
      cam(V(S.x + 0.6, S.y + 0.85, S.z - 3.1), V(S.x + 0.6, S.y + 0.45, S.z));
      W.set(me, { sub: true }); step(8);
      W.set(me, {}); step(1);   // (the release frame)
      step(4);   // ([b5-int3] ~0.07 s: the fist low in front, the stone just out of it, onto the floor ahead)
      const st = SUB_KITS.glide.items.find((x) => x.state !== 'dead');
      return { stone: st ? [+(st.m.outer.position.x - me.pos.x).toFixed(2), +st.m.outer.position.y.toFixed(2), +(st.p.x - me.pos.x).toFixed(2)] : null };
    } },
    { name: 'sentry-stencil', wait: 80, set: async () => {
      clean(); step(30);
      me.setSub('sentry'); me.ink = 100;
      put(me, S.x - 0.9, S.z, Math.PI / 2); step(5);
      G.subs.use(me, SUBS.sentry);
      const it = SUB_KITS.sentry.items.find((x) => x.owner === me && x.state !== 'dead');
      put(me, S.x - 4, S.z + 3, 0);
      step(50);
      // (the plate is on the hub's front, its +z: the camera straight out from it, a little above)
      const c = it.pos, fz = V(0, 0, 1); it.m.hub.getWorldDirection(fz); fz.y = 0; fz.normalize();
      cam(V(c.x + fz.x * 0.7, c.y + 0.36, c.z + fz.z * 0.7), V(c.x, c.y + 0.24, c.z));
      step(3);
      return { state: it.state, front: [+fz.x.toFixed(2), +fz.z.toFixed(2)] };
    } },
    { name: 'sentry-guide', wait: 80, set: async () => {
      clean(); step(20);
      g.hud?.setVisible?.(true);
      me.setSub('sentry'); me.ink = 100;
      put(me, 12.4, -2, Math.PI / 2); step(10);   // (1.6 m from testbox's wall, x 14…15, z ±8, facing it)
      W.set(me, { sub: true }); step(20);
      cam(V(7.5, 17, -2.2), V(13.2, 0, -2));   // (high, from the open side: the ring stops at the wall, its far part faint beyond)
      step(4);
      const gd = SUB_KITS.sentry._guide?.();
      return { guide: !!gd && gd.root.visible, ok: gd && gd.ok };
    } },
    { name: 'sentry-life', wait: 80, set: async () => {
      W.set(me, {}); step(3); clean(); step(20);
      me.setSub('sentry'); me.ink = 100;
      put(me, S.x - 0.9, S.z, Math.PI / 2); step(5);
      G.subs.use(me, SUBS.sentry);
      put(me, S.x - 3.5, S.z, Math.PI / 2); follow(-Math.PI / 2, 0.2); step(120);
      return { k: SUB_KITS.sentry._life?.()?.dataset?.k };
    } },
    { name: 'sentry-picker', wait: 300, set: async () => {
      g.hud?.setVisible?.(false); M.setInputMode?.('kbm');
      if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      key('Enter'); await wait(900);
      M._setFocus(document.querySelector('[data-id="kp-sub-sentry"]'), { snap: true }); await wait(700);
      return { detail: document.querySelector('.iw-kpick__dname')?.textContent };
    } },
  ];
  if (window.__preArgs) window.__hudScenes = window.__hudScenes.filter((s) => window.__preArgs.split(',').includes(s.name));
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
