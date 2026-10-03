// jump-ui pictures (b5-jumpui: src/ui/hud-jumps.js, src/game/jumpMarks.js) for tools/botlab/hud-shots.cjs (the HUD up):
// window.__hudScenes, staged after the bots have inked the stage for PLAY s. You (the local player) are on team 0, at a
// flat spot near the middle of your half (found from the nav graph; Halyard: the fuel-dock apron).
//   alert        a teammate super jumping to you: "NAME is jumping to you!" under the top bar, the tag over where they land
//   world        a teammate jumping to another teammate, mid-flight: the reticle + light pillar, the tag with their name,
//                the countdown ring and the seconds (and the minimap's tag, bottom left)
//   foe          an enemy's jump: the ring and icon, no name
//   inkjet       a teammate up on Ink Jet, hovering off: the return beacon where they took off, with their name and
//                the countdown (the special's time left + the flight home)
//   inkjet-home  the same teammate flying home on the special's end: the ring nearly out
//   zipline      a teammate on Zipline, walked off: its return beacon
//   tab          the TAB map with a teammate's jump coming down (its pin, name, ring) and another's Ink Jet return pin
//   stack-inkjet a teammate super jumping to a teammate up on Ink Jet: the jump comes down by the return mark; both
//                tags stacked over the spot (world), one ring with both names (minimap)
//   stack-two    two teammates super jumping to one teammate: both tags stacked over the spot, clear of its name tag
//   tab-stack    the TAB map: a teammate on Ink Jet and both others jumping to them — three marks on one spot, the
//                discs side by side, each label clear of the pins
//   alert3-call  three teammates jumping to you at once (side by side) and a streak callout, dropped below them
//   alert-tracked  a teammate jumping to you while you're TRACKED and POISONED: the row under the badges
//   (a small window, W < 1400: only the alert scenes; Boss Battle: no foe scenes, the boss stands still)
//   SCENES=tools/botlab/scenes/jump-ui.js MAP=halyard MODE=turf OUT=… tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   (tools/botlab/jobs/batch5/jumpui/shots.sh does that and turns them into JPEGs)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  dbg.freeze();
  if (g.settings.quality !== 'high') { g._setSettings({ quality: 'high' }); for (let i = 0; i < 3; i++) dbg.step(1000 / 60); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const small = innerWidth < 1400, boss = m.mode === 'boss';
  if (boss && m.boss) m.boss.brain.update = () => {};
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._go) a.intent.move.copy(a._go); };
  const keepAlive = () => { for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = PLAYER.hp; a.invuln = 99; } };
  let camYaw = 0, camPitch = -0.12;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { g.rig.yaw = camYaw; g.rig.pitch = camPitch; me.aimYaw = me.yaw = camYaw; me.aimPitch = camPitch; dbg.step(1000 / 60); } };
  // the spot (a flat patch near the middle of your half) and the clearest direction from it
  const SPOTS = { halyard: [0.5, -27.5] };
  const ys = me.team === 0 ? -1 : 1, lid = G.level.layout?.id;
  const flatAround = (x, y, z, r0, r1) => {
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; for (let r = r0; r <= r1; r += 1) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } }
    return true;
  };
  let S = null;
  if (SPOTS[lid]) { const [x, z] = SPOTS[lid]; S = { x, y: G.level.groundHeight(x, z, 5), z }; }
  if (!S) { const nodes = [...(G.nav?.nodes || [])].sort((a, b) => Math.hypot(a.x * 0.6, a.z - ys * 14) - Math.hypot(b.x * 0.6, b.z - ys * 14)); S = nodes.find((n) => flatAround(n.x, n.y, n.z, 1.5, 4.5)) || { x: 0, y: 0, z: ys * 12 }; }
  const cx = S.x, cy = S.y, cz = S.z;
  let way = 0, best = -1;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let n = 0;
    for (let r = 1; r <= 16; r += 0.5) { const gy = G.level.groundHeight(cx + dx * r, cz + dz * r, cy + 1.5); if (Math.abs(gy - cy) < 0.25 && G.physics.los(V(cx, cy + 1.2, cz), V(cx + dx * r, cy + 1.2, cz + dz * r))) n++; else break; }
    if (n > best) { best = n; way = a; }
  }
  const wx = Math.sin(way), wz = Math.cos(way), sx = wz, sz = -wx;   // ahead / to the side
  const at = (f, s) => [cx + wx * f + sx * s, cz + wz * f + sz * s];
  const put = (a, [x, z], yaw = way) => { const gy = G.level.groundHeight(x, z, cy + 2); a.pos.set(x, (Number.isFinite(gy) ? gy : cy) + 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.yaw = a.aimYaw = yaw; a.netTp = (a.netTp || 0) + 1; a.character.setVisible?.(true); a.character.root.visible = true; };
  const park = (a, i) => { const pd = G.level.spawnPads[a.team]; a.pos.set(pd.x + ((i % 4) - 1.5) * 1.2, pd.y + 0.02, pd.z); a.vel.set(0, 0, 0); };
  const clearAll = () => {
    keepAlive();
    for (const a of m.actors) if (a.specialActive) G.specials.end(a, 'test');
    G.specials.clear(); G.projectiles.clear(); G.subs.clear();
    for (const a of m.actors) { a.specialActive = null; a.superJumpState = null; a._go = null; zero(a); a.status.track = a.status.poison = 0; }
    m.controller = null;
    m.actors.forEach((a, i) => park(a, i));
    step(0.05); keepAlive();
  };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const look = (yaw, pitch = -0.12) => { camYaw = yaw; camPitch = pitch; g.rig.follow?.(me, true); };
  const [M1, M2, M3] = mates;
  const scenes = [];
  const add = (name, set, wait = 120, moment) => scenes.push({ name, moment, set: async () => { const r = await set(); return { spot: [+cx.toFixed(1), +cy.toFixed(1), +cz.toFixed(1)], way: +way.toFixed(2), tags: g.hud.jumps.state(), ...(r || {}) }; }, wait });
  // the TAB map's zoomed part round the given screen points (fractions of the frame)
  const cropAround = (pts) => {
    const qx = pts.map((q) => q[0]), qy = pts.map((q) => q[1]);
    const x0 = Math.min(...qx) - 150, x1 = Math.max(...qx) + 150, y0 = Math.min(...qy) - 170, y1 = Math.max(...qy) + 110;
    const w = Math.max(x1 - x0, 640), h = Math.max(y1 - y0, 360), cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
    const W = innerWidth, H = innerHeight, cw = Math.min(W, Math.max(w, h * 16 / 9)), ch = cw * 9 / 16;
    const cx0 = Math.max(0, Math.min(W - cw, cxm - cw / 2)), cy0 = Math.max(0, Math.min(H - ch, cym - ch / 2));
    return [cx0 / W, cy0 / H, cw / W, ch / H].map((v) => +v.toFixed(4));
  };
  const scr = (p) => { const v = p.clone().project(G.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (0.5 - v.y * 0.5) * innerHeight]; };
  const tfXY = (t) => (/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(t.tf) || []).slice(1).map(Number);

  // ---- a teammate jumping to you: the alert
  add('alert-tracked', () => {
    clearAll();
    put(me, at(0, 0)); put(M2, at(8, 3.5)); put(M3, at(11, -4));
    look(way, -0.2); step(0.4);
    me.status.track = 30; me.status.poison = 30;
    M1.superJump(me); step(0.95);
  }, 700);
  add('alert3-call', () => {
    clearAll();
    put(me, at(0, 0)); put(M1, at(8, 3.5)); put(M2, at(11, -4)); put(M3, at(14, 2));
    look(way, -0.2); step(0.4);
    M1.superJump(me); M2.superJump(me); M3.superJump(me); step(0.5);
  }, 900, () => g.hud._callout('FIRST SPLAT!', null, false));
  if (!small) add('alert', () => {
    clearAll();
    put(me, at(0, 0)); put(M2, at(8, 3.5)); put(M3, at(11, -4));
    look(way, -0.2); step(0.4);
    M1.superJump(me); step(0.95);
  }, 700);
  if (small) { window.__hudScenes = scenes; return scenes.map((sc) => ({ name: sc.name })); }
  // ---- a teammate jumping to another teammate, seen in the world (and on the minimap)
  add('world', () => {
    clearAll();
    put(me, at(0, 0)); put(M2, at(10, 2.5)); put(M3, at(6, -4));
    look(way, -0.14); step(0.4);
    M1.superJump(M2); step(1.25);
  }, 200);
  // ---- two marks on one spot: a jump to a teammate up on Ink Jet comes down by their return mark; two jumps to one
  // teammate land a metre apart
  add('stack-inkjet', () => {
    clearAll();
    put(me, at(0, 0)); put(M3, at(9, 1)); put(M2, at(4, -5));
    look(way, -0.12); step(0.3);
    start(M3, 'jetpack');
    M3._go = V(sx * 0.9 + wx * 0.3, 0, sz * 0.9 + wz * 0.3).normalize(); step(1.0); M3._go = null; step(0.3);
    M1.superJump(M3); step(1.2);
  }, 200);
  add('stack-two', () => {
    clearAll();
    put(me, at(0, 0)); put(M3, at(10, 1.5));
    look(way, -0.12); step(0.3);
    M1.superJump(M3); M2.superJump(M3); step(1.25);
  }, 200);
  // ---- an enemy jumping in: the ring and icon, no name
  if (!boss) add('foe', () => {
    clearAll();
    put(me, at(0, 0)); put(foes[1], at(10, -2.5), way + Math.PI);
    look(way, -0.14); step(0.4);
    foes[0].superJump(foes[1]); step(1.1);
  }, 200);
  // ---- Ink Jet: the return beacon at the take-off spot, the user hovering off
  add('inkjet', () => {
    clearAll();
    put(me, at(0, 0)); put(M3, at(8, 1));
    look(way, -0.1); step(0.3);
    start(M3, 'jetpack');
    M3._go = V(sx * 0.9 + wx * 0.3, 0, sz * 0.9 + wz * 0.3).normalize(); step(1.2); M3._go = null; step(0.9);
  }, 200);
  add('inkjet-home', () => {
    const s = M3.specialActive;
    if (s) { s.t = s.dur - 0.02; step(0.05); }
    step(0.85);
  }, 200);
  // ---- Zipline: the same beacon, the user walked off
  // (walked on ahead along the clear line from the spot: sideways is the water on Halyard)
  add('zipline', () => {
    clearAll();
    put(me, at(0, 0)); put(M3, at(5, 1.5));
    look(way, -0.1); step(0.3);
    start(M3, 'zipcaster');
    M3._go = V(wx, 0, wz); step(1.1); M3._go = null; step(0.6);
    return { user: [+M3.pos.x.toFixed(1), +M3.pos.y.toFixed(1), +M3.pos.z.toFixed(1)], alive: M3.alive };
  }, 200);
  // ---- the TAB map: a teammate's jump coming down, another's Ink Jet return pin
  // (spread out along the clear line, so the pins and tags don't pile up at the map's scale; `crop` = the zoomed part)
  add('tab', () => {
    clearAll();
    // (the TAB map shows the whole stage: the others ~30 m apart on nav nodes — the middle, and either side of your half)
    const node = (x, z) => { let b = null, bd = 1e9; for (const n of G.nav?.nodes || []) { const d = Math.hypot(n.x - x, n.z - z); if (d < bd && flatAround(n.x, n.y, n.z, 1, 2.5)) { bd = d; b = n; } } return b ? [b.x, b.z] : [x, z]; };
    put(me, at(0, 0)); put(M2, node(cx * 0.3, ys * 2)); put(M3, node(cx - 14, cz + ys * 14)); put(M1, node(cx + 14, cz + ys * 10));
    look(way, -0.14); step(0.3);
    start(M3, 'jetpack'); M3._go = V(1, 0, 0); step(0.9); M3._go = null;
    m.controller = { mapHeld: true, enabled: true, update() {}, computeAim() {} };
    step(0.5);
    M1.superJump(M2); step(1.1);
    const pts = g.hud.jumps.state().dio.map(tfXY).filter((q) => q.length === 2);
    for (const a of [me, M1, M2, M3]) pts.push(scr(a.pos));
    return { crop: cropAround(pts) };
  }, 300);
  // ---- the TAB map: three marks on one spot (a teammate on Ink Jet, both others jumping to them)
  add('tab-stack', () => {
    clearAll();
    put(me, at(0, 0)); put(M3, at(9, 1));   // (the other two jump from the spawn: sideways from the spot is the sea)
    look(way, -0.14); step(0.3);
    start(M3, 'jetpack'); M3._go = V(sx * 0.9 + wx * 0.3, 0, sz * 0.9 + wz * 0.3).normalize(); step(1.0); M3._go = null;
    m.controller = { mapHeld: true, enabled: true, update() {}, computeAim() {} };
    step(0.5);
    M1.superJump(M3); M2.superJump(M3); step(1.0);
    const pts = g.hud.jumps.state().dio.map(tfXY).filter((q) => q.length === 2);
    for (const a of [me, M1, M2, M3]) pts.push(scr(a.pos));
    return { crop: cropAround(pts) };
  }, 300);
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
