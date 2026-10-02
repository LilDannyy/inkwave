// Surf N' Turf pictures (src/game/sp-surf.js, src/fx/surfFx.js) staged on testbox for tools/botlab/shoot.cjs (PRE=this
// file, PRE_ARGS=<scene>, ACTORS=1, PLAY=1). The pictures: tools/botlab/jobs/surf/shots.sh. Scenes:
//   hold      you holding the buoy machine up to throw (the sub-throw pose): over the shoulder and from the front
//   deployed  an anchored buoy, close up, between rings (its beacon lit)
//   rings     the rings going out (sped up FAST× so shoot.cjs's 5-frame steps between shots make a sequence): from above
//             and at ground level
//   mark      a foe 5 m out, hit by the second ring: the mark's ribbon flying in from the buoy's beacon and wrapping
//             round them (slowed: SLOW)
//   dodge     a foe jumping a ring as it goes under them
//   wall      a ring cut off by the wall (x 14…15, 4 m tall): it fades where it struck
//   turf      the ink once every ring has been by, from straight above
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SPECIALS } = await import('./src/config.js');
  const SURF = await import('./src/game/sp-surf.js');
  const G = window.__G, S = G.subs, FX = S.statusFx, SC = (window.__preArgs || 'hold').split(' ')[0], D = SPECIALS.surf;
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DT = 1 / 60, frame = () => { g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s) => { for (let i = 0, n = Math.max(1, Math.round(s * 60)); i < n; i++) frame(); };
  const me = m.local, others = m.actors.filter((a) => a !== me), foes = others.filter((a) => a.team !== me.team);
  const foe = foes[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._int) a._int(a.intent); };
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const hide = (a, i) => { put(a, V(-24 + (i % 4) * 1.5, 0, 36 + Math.floor(i / 4) * 1.5)); a.character.setVisible?.(false); a.character.root.visible = false; };
  const show = (a, p, yaw, w = 'shooter') => { put(a, p, yaw); a.setWeapon?.(w); a.weaponRunner?.reset?.(); a.character.setVisible?.(true); a.character.root.visible = true; };
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  if (g.screenfx) { g.screenfx.reset?.(); g.screenfx.update = () => { if (g.screenfx.pass) g.screenfx.pass.enabled = false; }; }
  G.specials.clear(); S.clear(); G.projectiles.clear(); G.paint.clear();
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; zero(a); a.status.track = a.status.reveal = a.status.poison = 0; }
  others.forEach(hide); hide(me, 7);
  step(0.2);
  const info = { scene: SC };
  const plant = (p) => { const b = new SURF.Buoy(me, p.clone().setY(p.y + 0.3), V(0, 0, 0), false, 0); G.specials.world.push(b); b.land(p.clone()); return b; };
  // a buoy whose clock runs k× (the shots that follow, 5 frames apart, make a sequence)
  const fast = (b, k) => { const u0 = b.update.bind(b); b.update = (dt) => u0(dt * k); };
  const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
  if (SC === 'hold') {
    show(me, V(0, 0, -6), 0, 'shooter');
    me.bot = null;   // (no brain: it holds it — a bot would throw)
    const s = start(me, 'surf');
    me.aimPitch = 0.25;
    step(0.6);
    info.held = !!(s && s.held && s.held.g.visible);
  } else if (SC === 'deployed') {
    const b = plant(V(0, 0, -6));
    step(D.anchor + D.gap - 0.25);   // (the first ring gone by, the second about to leave)
    info.rings = b.rings.map((r) => r.state);
  } else if (SC === 'rings') {
    const b = plant(V(0, 0, -6));
    step(D.anchor + D.gap * 3 + 0.05);   // (the fourth ring just leaving, the third out at ~6 m)
    fast(b, +((/fast=([\d.]+)/.exec(window.__preArgs) || [])[1] || 3.2));
    info.rings = b.rings.map((r) => r.state + ':' + r.r.toFixed(1));
  } else if (SC === 'mark') {
    show(foe, V(0, 0, -1), Math.PI - 0.5, 'blaster');
    const b = plant(V(0, 0, -6));
    const tHit = D.anchor + D.gap + (5 - SURF.HIT_R - D.r0) / D.speed;
    step(tHit + 0.02);
    // (each shot 5 frames on: the mark's flight from the beacon and its wrap — ~0.55 s — over the 5 shots)
    const f0 = FX.update.bind(FX); FX.update = (dt) => f0(dt * 1.7);
    info.hp = foe.hp;
  } else if (SC === 'dodge') {
    show(foe, V(0.4, 0, -1.4), Math.PI - 0.3, 'roller');
    const b = plant(V(0, 0, -6));
    const tHit = D.anchor + D.gap + (Math.hypot(0.4, 4.6) - SURF.HIT_R - D.r0) / D.speed, top = 8.4 / 25;
    step(tHit - top * 0.9);
    foe._int = (it) => { it.jump = true; };
    step(1 / 60); foe._int = null;
    step(top * 0.9 - 0.02);
    info.y = +foe.pos.y.toFixed(2);
  } else if (SC === 'wall') {
    const b = plant(V(9, 0, -1));
    step(D.anchor + D.gap * 2 + (5.7 - D.r0) / D.speed);   // (the third ring out at 5.7 m, just past the wall 5 m off: fading where it struck)
    info.reach = +b.polar.reachAt(Math.PI / 2).toFixed(2);
  } else if (SC === 'turf') {
    const b = plant(V(0, 0, -6));
    step(D.anchor + D.gap * (D.pulses - 1) + 2.4);
    step(0.6);
    info.splats = b.splats; info.turf = Math.round(b.turf);
  }
  return info;
})();
