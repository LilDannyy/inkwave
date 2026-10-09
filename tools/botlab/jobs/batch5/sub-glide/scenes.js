// [b5-sub-glide] pictures of the Glide Bomb, for tools/botlab/hud-shots.cjs:
//   MAP=halyard PLAY=2 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-glide/scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   held     the stone in a kid's hand, cooking (its lamps going out, the team glow round the fist), seen from the front
//   guide    the player's view while cooking: the aim guide (the dashed lane, the blast ring at its stop), the HUD cook bar,
//            the reach in the sub chip, the reticle dimmed (the main weapon locked)
//   slide    a stone sliding: its curl, its lamps, the inked lane behind it, its size ring riding with it
//   fuse     its last 0.8 s: the Splat Bomb's danger ring, beep pulses
//   blast    the blast (full cook: R 3.2)
//   picker   the loadout's sub picker on the Glide Bomb (its tile, blurb, ink cost)
//   hint     the tap's hint ("Hold [RMB] or [E] to cook the Glide Bomb …")
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, me = m.local, G = window.__G, THREE = await import('three');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const K = SUB_KITS.glide, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  let hold = false;
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = a === me && hold; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  g.debug.freeze();
  // a flat open straight (16 m, a step either side) near the middle
  const L = G.level, N = G.nav.nodes, B = L.bounds, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2;
  const _o = V(0, 0, 0), _dir = V(0, 0, 0);
  const flat = (n, yaw) => { const sx = Math.sin(yaw), sz = Math.cos(yaw); for (let d = -6; d <= 16; d += 0.5) for (const w of [-1.5, 0, 1.5]) { const x = n.x + sx * d + sz * w, z = n.z + sz * d - sx * w; if (Math.abs(L.groundHeight(x, z, n.y + 1.5) - n.y) > 0.03) return false; }
    for (const w of [-1.2, 0, 1.2]) for (const h of [0.3, 2.5]) { _o.set(n.x - sx * 6 + sz * w, n.y + h, n.z - sz * 6 - sx * w); _dir.set(sx, 0, sz); if (G.physics.raycast(_o, _dir, 22, undefined, true).hit) return false; }   // (no wall along it, nor overhead)
    return true; };
  let P = null;
  for (const n of [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz))) { for (let k = 0; k < 8 && !P; k++) if (flat(n, k * Math.PI / 4)) P = { x: n.x, y: n.y, z: n.z, yaw: k * Math.PI / 4 }; if (P) break; }
  const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), at = (d, w = 0, y = 0) => V(P.x + fx * d + fz * w, P.y + y, P.z + fz * d - fx * w);
  const others = m.actors.filter((a) => a !== me);
  const park = () => others.forEach((a, i) => { a.pos.copy(at(-14 - (i % 4) * 1.5, 6 + Math.floor(i / 4) * 1.5)); a.vel.set(0, 0, 0); });
  const putMe = (d = 0) => { me.pos.copy(at(d)).setY(P.y + 0.02); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = P.yaw; me.aimPitch = -0.12; me.bot && (me.bot.aimYaw = P.yaw, me.bot.aimPitch = -0.12); };
  const cine = (from, look, fov = 55) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); };
  const reset = () => { hold = false; step(2); G.subs.clear(); G.projectiles.clear(); G.paint.clear?.(); park(); putMe(); me.setSub('glide'); me.ink = 100; if (!me.alive) me.respawn(); step(6); };
  const lastStone = () => K.items[K.items.length - 1];
  let stone = null;
  window.__hudScenes = [
    { name: 'held', wait: 300, set: async () => {
      if (M.current) { M.show(null); await wait(500); }
      g.hud?.setVisible?.(false); reset();
      hold = true; step(78);   // (held 1.3 s: cook 1.15 — half the lamps out, the glow up)
      const h = new THREE.Vector3(); me.character.bones.handL.getWorldPosition(h);
      cine(at(1.7, 1.6, 1.75), h.clone().lerp(at(0, 0, 1.3), 0.3), 36);
      step(1);
      return { cook: me.weaponRunner.glide?.cook, lv: K.levelShown(me) };
    } },
    { name: 'guide', wait: 300, set: async () => {
      g.hud?.setVisible?.(true); reset(); g.settings.fov = 70; g.rig.follow(me, true); g.rig.yaw = P.yaw; g.rig.pitch = -0.32;
      hold = true; step(60);   // (held 1.0 s: cook 0.85 — the lane to its stop, the bar a half, "12 m")
      return { chip: g.hud?.subChip?.lastChild.textContent, locked: me.weaponRunner.mainLocked };
    } },
    { name: 'slide', wait: 300, set: async () => {
      g.hud?.setVisible?.(false); reset(); g.settings.fov = 70; g.rig.follow(me, true);
      hold = true; step(8); hold = false; step(48);
      stone = lastStone();
      const p = stone.p.clone();
      cine(at(p.distanceTo(at(0)) - 2.6, 2.6, 1.9), V(p.x, p.y + 0.15, p.z).addScaledVector(V(fx, 0, fz), -1.6), 50);
      step(1);
      return { at: [p.x, p.z], speed: Math.hypot(stone.v.x, stone.v.z) };
    } },
    { name: 'fuse', wait: 200, set: async () => {
      let n = 0; while (stone && stone.state === 'slide' && stone.fuse > 0.32 && n++ < 200) step(1);
      const p = stone.p.clone();
      cine(at(p.distanceTo(at(0)) + 3.4, 3.0, 3.2), V(p.x, p.y, p.z), 55);
      step(1);
      return { fuse: stone.fuse, R: stone.R };
    } },
    { name: 'blast', wait: 120, set: async () => {
      reset(); g.settings.fov = 70;
      hold = true; step(124); hold = false; step(1);   // (full cook: R 3.2, a 0.6 s fuse)
      stone = lastStone();
      const p0 = stone.p.clone(), end = p0.clone().addScaledVector(V(fx, 0, fz), 5.3);
      cine(at(-3.5, 2.2, 3.6), end, 60);
      let n = 0; while (stone.state !== 'dead' && n++ < 80) step(1);
      step(3);
      return { R: stone.R, why: stone.why };
    } },
    { name: 'picker', wait: 400, set: async () => {
      g.hud?.setVisible?.(false); M.setInputMode('kbm');
      if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      key('Enter'); await wait(900);
      M._setFocus(document.querySelector('[data-id="kp-sub-glide"]'), { snap: true }); await wait(700);
      return { detail: document.querySelector('.iw-kpick__dname')?.textContent, blurb: document.querySelector('.iw-kpick__blurb')?.textContent };
    } },
    { name: 'hint', wait: 300, set: async () => {
      if (M._modal) { key('Escape'); await wait(400); }
      if (M.current) { M.show(null); await wait(600); }
      g.hud?.setVisible?.(true); reset(); g.rig.follow(me, true); g.rig.yaw = P.yaw; g.rig.pitch = -0.2;
      const bot0 = me.bot; me.bot = null;
      g.debug.key('KeyE', true); me.intent.sub = true; step(5); g.debug.key('KeyE', false); me.intent.sub = false; step(20);
      me.bot = bot0;
      return { prompt: K.prompt(me) };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
