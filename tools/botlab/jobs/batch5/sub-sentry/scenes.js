// [b5-subs] Scrap Sentry pictures, for tools/botlab/hud-shots.cjs (the HUD up):
//   SCENES=tools/botlab/jobs/batch5/sub-sentry/scenes.js MAP=halyard PLAY=2 W=1280 H=720 OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   held         the local kid holding it up (the badge shows its icon), the guide on the floor: its ghost + the 11 m ring
//   hand         close on the kid's hand: the folded turret by its coat-hanger hose
//   guide-bad    held in mid-air: the guide grey, with its "×"
//   cantuse      released there: "CAN'T USE" and the reason line
//   unfold       just set down: the legs ratcheting out, the head popping up
//   standing     close: the junk turret standing (can, caps, bottle head, copper barrel, tape, lamp, antenna, tag)
//   lock         a foe walks into its sight: the lamp blinking white, the faint aim line
//   firing       its bursts: muzzle flash, Spritzer-style rounds in the air, ink on the floor
//   hit          my round on an enemy sentry: the white flash + my hit marker
//   down         shot down: the burst of tin bits and ink, the owner's "SENTRY DOWN" (my own sentry, a foe's rounds)
//   life         the HUD while my sentry stands: the life ring on the sub badge, the turret mark on the minimap
//   picker       the loadout's sub picker on the Scrap Sentry tile (its blurb, its ink)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const K = SUB_KITS.sentry, M = g.menus;
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, S = G.subs, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  let holdSub = false;
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.jump = a.intent.special = a.intent.squid = false; a.intent.sub = a === me && holdSub; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; }
  G.projectiles.clear(); S.clear(); G.specials.clear();
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); };
  m.actors.forEach(park);
  const foe = m.actors.find((a) => a.team !== me.team);
  me.setSub('sentry'); foe.setSub('sentry');
  let hold = null;
  const step = (s, until) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { if (hold) hold(); dbg.step(1000 / 60); if (until && until()) return; } };
  const cine = (from, look, fov = 50) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); for (let i = 0; i < 2; i++) dbg.step(1000 / 6000); };
  const uncine = () => { g.settings.fov = 75; };
  // a flat open spot: level 3 m round it, nothing overhead, a clear 9 m line along +x
  const lvl = (x, z, y) => Math.abs(G.level.groundHeight(x, z, y + 1.5) - y) < 0.05;
  const N = [...G.nav.nodes].filter((n) => {
    if (G.physics.raycast(V(n.x, n.y + 0.3, n.z), V(0, 1, 0), 6).hit) return false;
    for (let r = 1; r <= 3; r += 1) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; if (!lvl(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y)) return false; }
    for (let x = -3; x <= 9; x += 0.75) if (!lvl(n.x + x, n.z, n.y)) return false;
    if (!G.physics.los(V(n.x + 0.9, n.y + 0.55, n.z), V(n.x + 8, n.y + 1, n.z + 0.2)) || !G.physics.los(V(n.x - 2.8, n.y + 1.2, n.z), V(n.x + 6, n.y + 1, n.z))) return false;   // (a clear line along it)
    return Math.hypot(n.x - G.level.spawnPads[0].x, n.z - G.level.spawnPads[0].z) > 14 && Math.hypot(n.x - G.level.spawnPads[1].x, n.z - G.level.spawnPads[1].z) > 14;
  }).sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
  const P = N[0] ? V(N[0].x, N[0].y, N[0].z) : V(0, 0, 0);
  // some ink round it (a match in progress)
  for (let k = 0; k < 9; k++) G.paint.splat(V(P.x + (Math.random() - 0.3) * 9, P.y + 0.3, P.z + (Math.random() - 0.5) * 7), 1.4 + Math.random(), k % 3 ? me.team : foe.team, { seed: k + 1 });
  const stand = (a, p, yaw) => { a.pos.set(p.x, p.y + 0.02, p.z); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = -0.05; a.form = 'kid'; a.grounded = true; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = -0.05; } };
  const follow = (yaw, pitch = -0.18) => { uncine(); g.rig.follow(me, true); g.rig.yaw = yaw; g.rig.pitch = pitch; };
  const out = [];
  const add = (name, set, moment, w = 120) => out.push({ name, set, moment, wait: w });
  let mineS = null;
  const place = () => { S.clear(); stand(me, P, Math.PI / 2); me.ink = 100; holdSub = false; step(0.05); G.subs.use(me, SUBS.sentry); mineS = K.items.find((x) => x.owner === me && x.state !== 'dead'); return mineS; };
  const awayFoe = () => park(foe, 0);

  add('held', async () => {
    if (M.current) { M.show(null); await wait(600); }
    g.hud?.setVisible?.(true);
    S.clear(); awayFoe(); stand(me, P, Math.PI / 2); me.ink = 100;
    holdSub = true; hold = () => stand(me, P, Math.PI / 2);
    step(0.6);
    cine(V(P.x - 0.4, P.y + 2.3, P.z - 3.6), V(P.x + 1.2, P.y + 0.6, P.z), 50);
    const gd = K._guide();
    return { guide: !!gd && gd.root.visible, ok: gd && gd.ok };
  });
  add('hand', async () => {
    hold = () => stand(me, P, Math.PI / 2); step(0.2);
    const h = me.character.bomb?.group; const hp = V(); if (h) h.getWorldPosition(hp); else hp.copy(me.pos).setY(me.pos.y + 1);
    // (in front of the kid, a little to its left: its left hand holds the sub up)
    cine(V(hp.x + 1.25, hp.y + 0.15, hp.z - 1.05), V(hp.x, hp.y - 0.05, hp.z), 34);
    step(0.05);
    return { prop: me.character.bomb?.kind };
  });
  add('guide-bad', async () => {
    uncine(); const air = V(P.x, P.y + 3, P.z);
    hold = () => { stand(me, air, Math.PI / 2); me.grounded = false; me.vel.set(0, 0, 0); };
    follow(Math.PI / 2, -0.3); step(0.4);
    const gd = K._guide();
    return { ok: gd && gd.ok, why: gd && gd.why };
  });
  add('cantuse', async () => { if (g.hud) g.hud._denyT = -1e9; holdSub = false; step(2 / 60); return { why: g.hud?.denyWhy?.textContent }; }, null, 220);
  add('unfold', async () => {
    hold = null; holdSub = false; step(0.3);
    const s = place(); stand(me, V(P.x - 2.6, P.y, P.z), Math.PI / 2); hold = () => stand(me, V(P.x - 2.6, P.y, P.z), Math.PI / 2);
    step(0.32);
    const c = s.pos;
    cine(V(c.x + 1.25, c.y + 0.7, c.z - 1.15), V(c.x, c.y + 0.32, c.z), 45);
    return { state: s.state, t: s.t };
  });
  add('standing', async () => {
    step(0.6); const c = mineS.pos;
    stand(me, V(P.x - 2.8, P.y, P.z), Math.PI / 2);
    cine(V(c.x + 1.0, c.y + 0.62, c.z - 1.12), V(c.x, c.y + 0.4, c.z), 42);
    step(0.05);
    return { state: mineS.state };
  });
  add('lock', async () => {
    const c = mineS.pos;
    stand(foe, V(c.x + 7, P.y, c.z + 0.2), -Math.PI / 2); hold = () => { stand(foe, V(c.x + 7, P.y, c.z + 0.2), -Math.PI / 2); stand(me, V(P.x - 2.8, P.y, P.z), Math.PI / 2); };
    mineS.target = null; mineS.lookT = 0;
    step(0.25, () => mineS.target && !mineS.locked && mineS.lockT > 0.12);
    cine(V(P.x - 1.4, P.y + 1.9, P.z - 2.1), V(c.x + 3.0, c.y + 0.55, c.z + 0.1), 52);
    step(1 / 60);
    return { target: !!mineS.target, locked: mineS.locked, lockT: mineS.lockT, state: mineS.state, why: mineS.why, me: me.alive, foeD: +mineS.pos.distanceTo(foe.pos).toFixed(2), foeAlive: foe.alive, inv: foe.invuln, sh: foe.status.shield };
  });
  add('firing', async () => {
    const c = mineS.pos;
    step(0.6, () => mineS.locked && mineS.fireT > 0.05 && mineS.burstLeft === 2);
    cine(V(c.x - 1.7, c.y + 1.05, c.z + 1.1), V(c.x + 3.4, c.y + 0.55, c.z - 0.2), 50);
    step(1 / 60);
    return { shots: mineS.shots };
  });
  add('hit', async () => {
    hold = null; S.clear(); G.projectiles.clear();
    stand(me, P, Math.PI / 2);
    // an enemy sentry 5 m ahead of me; my round on it
    stand(foe, V(P.x + 5.9, P.y, P.z), -Math.PI / 2); foe.ink = 100; G.subs.use(foe, SUBS.sentry); park(foe, 0);
    const es = K.items.find((x) => x.owner === foe && x.state !== 'dead');
    step(0.8);
    follow(Math.PI / 2, -0.08);
    hold = () => stand(me, P, Math.PI / 2);
    step(0.2);
    const t = es.pos.clone().setY(es.pos.y + 0.36), from = V(P.x + 0.3, P.y + 1.0, P.z);
    G.projectiles.fireCustom(me, from, t.clone().sub(from).normalize(), { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
    step(0.3, () => es.flashOn);
    return { flash: es.flashOn, hp: es.hp };
  });
  add('down', async () => {
    hold = null; S.clear(); G.projectiles.clear();
    const s = place(); const at = V(P.x - 2.4, P.y, P.z + 1.5), yw = Math.atan2(s.pos.x - at.x, s.pos.z - at.z);
    stand(me, at, yw); hold = () => stand(me, at, yw);
    step(0.8);
    follow(yw, -0.12); step(0.1);
    if (g.hud) g.hud._denyT = -1e9;
    s.desc.hurt(200, foe);
    step(3 / 60);
    return { state: s.state, note: g.hud?.denyTxt?.textContent };
  }, null, 60);
  add('life', async () => {
    hold = null; S.clear(); G.projectiles.clear(); awayFoe();
    const s = place(); stand(me, V(P.x - 2.8, P.y, P.z), Math.PI / 2);
    hold = () => stand(me, V(P.x - 2.8, P.y, P.z), Math.PI / 2);
    follow(Math.PI / 2, -0.2);
    step(4);
    return { k: K._life()?.dataset.k, state: s.state };
  });
  add('picker', async () => {
    hold = null; g.hud?.setVisible?.(false); M.setInputMode?.('kbm');
    if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
    M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
    key('Enter'); await wait(900);
    M._setFocus(document.querySelector('[data-id="kp-sub-sentry"]'), { snap: true }); await wait(700);
    return { detail: document.querySelector('.iw-kpick__dname')?.textContent };
  }, null, 300);
  window.__hudScenes = out;
  return out.map((x) => ({ name: x.name }));
})();
