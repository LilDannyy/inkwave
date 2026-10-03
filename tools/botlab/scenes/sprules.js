// [b5-sprules] pictures for tools/botlab/hud-shots.cjs (the HUD up): the Mystery Bomb Barrage's NEXT card and the bomb in
// hand, the Waddle Bomb Barrage, the special picker with both new barrages, a Bubble Guard passed down a chain.
//   mystery-1 … 3   you with the Mystery Bomb Barrage, the throw held (the arc): the NEXT card by the crosshair, the bomb
//                   in your hand, the hint line and the gauge's sub badge — then after a throw (the card landed on a
//                   different bomb, the last one in the air), and after another
//   waddle          the Waddle Bomb Barrage: Waddles out ahead walking to a foe, the next one in your hand
//   picker-waddle / picker-mystery   the loadout's special picker, focus on each new barrage (icon, name, blurb)
//   chain           you, the THIRD player of a chain: a teammate used Bubble Guard and was splatted, the second passed it
//                   on to you — both bubbles up, your hint line "… touch a teammate to pass it on"
//   chain-cine      the same from a camera out front: the copy on you and on the teammate who passed it
//   SCENES=tools/botlab/scenes/sprules.js MAP=halyard MODE=turf PLAY=6 OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { SPECIALS, SUBS } = await import('./src/config.js');
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  const hold = { on: false, press: false };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._go) a.intent.move.copy(a._go); if (a === me) { a.intent.sub = hold.on || hold.press; hold.press = false; } };
  const keepAlive = () => { for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 99; } };
  keepAlive();
  G.projectiles.clear(); G.subs.clear();
  // the spot: a flat open patch near the middle of our half (halyard: the fuel-dock apron), and its clearest direction
  const SPOTS = { halyard: [0.5, -27.5] };
  const ys = me.team === 0 ? -1 : 1, lid = G.level.layout?.id;
  const flatAround = (x, y, z, r0, r1) => { for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; for (let r = r0; r <= r1; r += 1) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
  let S = null;
  if (SPOTS[lid]) { const [x, z] = SPOTS[lid]; S = { x, y: G.level.groundHeight(x, z, 5), z }; }
  if (!S) { const nodes = [...(G.nav?.nodes || [])].sort((a, b) => Math.hypot(a.x * 0.6, a.z - ys * 14) - Math.hypot(b.x * 0.6, b.z - ys * 14)); S = nodes.find((n) => flatAround(n.x, n.y, n.z, 1.5, 4.5)) || { x: 0, y: G.level.groundHeight(0, ys * 12, 5), z: ys * 12 }; }
  const cx = S.x, cy = S.y, cz = S.z;
  let way = 0, best = -1;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let n = 0;
    for (let r = 2; r <= 12; r += 0.5) { const gy = G.level.groundHeight(cx + dx * r, cz + dz * r, cy + 1.5); if (Math.abs(gy - cy) < 0.2 && G.physics.los(V(cx, cy + 1.2, cz), V(cx + dx * r, cy + 1.2, cz + dz * r))) n++; else break; }
    if (n > best) { best = n; way = a; }
  }
  const wx = Math.sin(way), wz = Math.cos(way);
  const put = (a, x, z, yaw = 0) => { a.pos.set(x, cy + 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.character.setVisible?.(true); a.character.root.visible = true; };
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); a.character.setVisible?.(false); a.character.root.visible = false; };
  const clearAll = () => {
    keepAlive(); hold.on = false;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } a._go = null; zero(a); a.status.shield = 0; a._shieldChain = null; a._bgHad = null; }
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); for (const k of ['waddle', 'boomerang']) (window.__SK?.[k])?.clear?.();
    m.actors.forEach((a, i) => park(a, i)); step(0.05); keepAlive();
  };
  window.__SK = (await import('./src/game/kits/registry.js')).SUB_KITS;
  const follow = (yaw, pitch = -0.1) => { g.settings.fov = window.__fov0 || 75; g.rig.follow(me, true); g.rig.yaw = yaw; g.rig.pitch = pitch; me.yaw = me.aimYaw = yaw; };
  window.__fov0 = window.__fov0 || g.settings.fov;
  const cine = (from, look, fov = 55) => { g.settings.fov = fov; g.rig.cinematic(V(...from), V(...from), V(...look), V(...look), 99, () => {}); };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const card = () => g.hud?.barrage?.state?.() || null;
  const prompt = () => document.querySelector('.iw-prompt')?.textContent || null;
  const throwOne = () => { const s = me.specialActive; let n = 0; while (s && G.time < s.nextThrow && n++ < 60) step(1 / 60); hold.on = false; step(2 / 60); hold.on = true; step(1 / 60); };
  const scenes = [];
  const add = (name, set, wait = 120) => scenes.push({ name, set: async () => ({ spot: [+cx.toFixed(1), +cy.toFixed(1), +cz.toFixed(1)], ...((await set()) || {}) }), wait });
  const yawOut = Math.atan2(wx, wz);

  // ---- the Mystery Bomb Barrage: held, then after a throw, then another
  add('mystery-1', () => {
    clearAll();
    put(me, cx - wx * 2, cz - wz * 2, yawOut); put(foes[0], cx + wx * 10 + wz * 1.5, cz + wz * 10 - wx * 1.5, yawOut + Math.PI);
    follow(yawOut + 0.1, -0.12); me.aimPitch = 0.22; step(0.2);
    const s = start(me, 'barrage_mystery'); s.dur = 99;
    hold.on = true; step(0.6);
    return { next: s.bomb.kind, hand: me.character.bomb?.kind, card: card(), prompt: prompt() };
  }, 500);
  add('mystery-2', () => {
    const s = me.specialActive, was = s.bomb.kind;
    throwOne(); step(0.5);
    return { was, next: s.bomb.kind, hand: me.character.bomb?.kind, card: card(), prompt: prompt() };
  }, 500);
  add('mystery-3', () => {
    const s = me.specialActive, was = s.bomb.kind;
    throwOne(); step(0.12);
    return { was, next: s.bomb.kind, hand: me.character.bomb?.kind, card: card(), spinning: card()?.spinning };
  }, 60);
  // ---- the Waddle Bomb Barrage: Waddles walking out to a foe, the next in hand
  add('waddle', () => {
    clearAll();
    put(me, cx - wx * 2, cz - wz * 2, yawOut); put(foes[0], cx + wx * 8 + wz * 2, cz + wz * 8 - wx * 2, yawOut + Math.PI); foes[0].invuln = 99;
    follow(yawOut + 0.15, -0.16); me.aimPitch = 0.2; step(0.2);
    const s = start(me, 'barrage_waddle'); s.dur = 99;
    hold.on = true; step(0.3);
    for (let i = 0; i < 3; i++) { throwOne(); step(0.25); me.aimYaw = me.yaw = yawOut + (i - 1) * 0.12; }
    step(0.7);
    return { waddles: (window.__SK.waddle.items || []).filter((x) => x.owner === me).map((x) => x.state), prompt: prompt() };
  }, 300);
  // ---- the special picker, focus on each new barrage
  const picker = async (id) => {
    clearAll();
    const M = g.menus;
    g.api.setLoadout?.({ weapon: 'shooter', special: null });
    g.hud?.setVisible(false);
    M.setInputMode('kbm');
    if (M.current !== 'loadout') { M.show('loadout'); await new Promise((r) => setTimeout(r, 1400)); }
    if (!(M._modal && M._modal.classList.contains('iw-kpickm'))) {
      M._setFocus(document.querySelector('[data-id="specialpick"]'), { snap: true });
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 900));
    }
    M._setFocus(document.querySelector(`[data-id="kp-special-${id}"]`), { snap: true });
    await new Promise((r) => setTimeout(r, 700));
    return { focus: M._focus?.dataset?.id, detail: document.querySelector('.iw-kpick__dname')?.textContent || null, blurb: document.querySelector('.iw-kpick__blurb')?.textContent || null };
  };
  add('picker-waddle', () => picker('barrage_waddle'), 300);
  add('picker-mystery', () => picker('barrage_mystery'), 300);
  // ---- a Bubble Guard passed down a chain: M1 used it → M2 → you; M1 splatted
  add('chain', async () => {
    const M = g.menus;
    if (M._modal) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); await new Promise((r) => setTimeout(r, 400)); }
    M.show(null); g.hud?.setVisible(true);
    clearAll();
    const [M1, M2, M3] = mates;
    put(M1, cx, cz, yawOut); put(M2, cx + wz * 0.9, cz - wx * 0.9, yawOut); step(0.05);
    start(M1, 'bubbler'); step(1.0);
    M1.splat(foes[0], 'test'); M1.character.setVisible?.(false); step(0.2);
    put(me, cx + wx * 3, cz + wz * 3, yawOut + Math.PI);
    put(M2, cx + wx * 3 + wz * 1.0, cz + wz * 3 - wx * 1.0, yawOut + Math.PI + 0.4);
    if (M3) put(M3, cx + wx * 9 - wz * 2, cz + wz * 9 + wx * 2, yawOut + Math.PI);
    step(0.1);
    put(M2, cx + wx * 4.6 + wz * 2.4, cz + wz * 4.6 - wx * 2.4, yawOut + Math.PI + 0.6);
    follow(yawOut - 0.55, -0.2); step(0.4);
    return { me: +me.status.shield.toFixed(2), m2: +M2.status.shield.toFixed(2), sameChain: me._shieldChain === M2._shieldChain, m1Alive: M1.alive, prompt: prompt() };
  }, 300);
  add('chain-cine', () => {
    const [, M2] = mates;
    const mid = [(me.pos.x + M2.pos.x) / 2, cy + 1.0, (me.pos.z + M2.pos.z) / 2];
    cine([mid[0] + wx * 5.2 - wz * 1.5, cy + 2.2, mid[2] + wz * 5.2 + wx * 1.5], mid, 50);
    step(0.1);
    return { me: +me.status.shield.toFixed(2), m2: +M2.status.shield.toFixed(2) };
  }, 200);
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})();
