// track-arrows pictures: the tracked look (src/game/statusFx.js — one arrow wrapped round the tracked player in the
// tracking team's colour, the tracking team's thin lines, no name) staged on testbox for tools/botlab/shoot.cjs (PRE=this
// file, PRE_ARGS=<scene>, ACTORS=1, PLAY=1). You (the local player) are on the tracking team unless said;
// StatusFx.viewer stands in for whose screen it is. Scenes:
//   close     a foe you tracked (an Echo Orb), close up from your side: the arrow round it, your line coming in to its chest
//   far       the same from over your shoulder, 10 m off: your line from your chest to its
//   behind    third-person behind your kid, the foe ~4 m ahead (the camera of the user's screenshot): arrow and line
//   wall      the foe behind the wall (x 14…15, 4 m tall), from over your shoulder: the arrow and your line through it
//   mate      the wall scene from your teammate's screen (beside you; you threw it): their own line, the arrow, through it
//   self      you, tracked by a foe: your own follow view (shoot.cjs 'play'), the arrow round your kid, fainter
//   foemate   the tracked foe from its own teammate's screen (the user's screenshot's camera): depth-tested, no line
// The pictures (PNG → JPEG q78 in tools/botlab/jobs/track-arrows/out/): that folder's shots.sh.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS } = await import('./src/config.js');
  const G = window.__G, S = G.subs, FX = S.statusFx, SC = window.__preArgs || 'close';
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DT = 1 / 60, frame = () => { g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s) => { for (let i = 0, n = Math.max(1, Math.round(s * 60)); i < n; i++) frame(); };
  const me = m.local, others = m.actors.filter((a) => a !== me), foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const hide = (a, i) => { put(a, V(-24 + (i % 4) * 1.5, 0, 36 + Math.floor(i / 4) * 1.5)); a.character.setVisible?.(false); a.character.root.visible = false; };
  const show = (a, p, yaw) => { put(a, p, yaw); a.weaponRunner?.reset?.(); a.character.setVisible?.(true); a.character.root.visible = true; };   // (a weapon mid-burst stops)
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  S.clear(); G.projectiles.clear(); G.paint.clear();
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; zero(a); a.status.track = a.status.reveal = a.status.poison = 0; a.status.trackBy = a.status.revealBy = null; }
  others.forEach(hide); hide(me, 7);
  FX.viewer = null;
  step(0.2);
  const info = { scene: SC };
  if (SC === 'close' || SC === 'far') {
    show(me, V(0, 0, -16), 0); show(foe, V(0, 0, -6), Math.PI - 0.45);
    S._throw(me, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false);
    step(1.5);   // (its cloud gone)
    foe.status.track = 99;
  } else if (SC === 'wall' || SC === 'mate') {
    show(me, V(8, 0, -1.5), Math.PI / 2 - 0.08); show(foe, V(18.5, 0, 0.4), -Math.PI / 2 + 0.3);
    if (SC === 'mate') { show(mate, V(7.6, 0, 2.6), Math.PI / 2 - 0.1); FX.viewer = mate; }
    S.track(foe, me.team, 99);
  } else if (SC === 'self') {
    show(me, V(0, 0, -6), 0); g.rig.follow(me, true); g.rig.yaw = 0; g.rig.pitch = -0.12;
    show(foe, V(3, 0, 6), Math.PI + 0.3);
    S._throw(foe, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false);
    step(1.5);
    me.status.track = 99;
  } else if (SC === 'behind') {
    show(me, V(9, 0, 3.4), -Math.PI / 2 - 0.4); show(foe, V(4, 0, 0), Math.PI / 2 + 0.5);
    S.track(foe, me.team, 99);
  } else if (SC === 'foemate') {
    show(foe, V(4, 0, 0), Math.PI / 2 + 0.5); show(foe2, V(9, 0, 3.4), -Math.PI / 2 - 0.4); show(me, V(-7, 0, -9), 0.6);
    FX.viewer = foe2;
    S.track(foe, me.team, 99);
  }
  step(0.4);
  G.projectiles.clear(); G.paint.clear();   // (no stray shots in the picture)
  const r = FX.recs.get(SC === 'self' ? me : foe);
  info.band = !!(r && r.on && r.band.visible); info.xray = !!(r && r.bandX.visible); info.lines = FX.stats.lines; info.viewer = FX.viewer ? FX.viewer.name : 'you';
  info.alpha = r && Math.round(r.band.material[0].uniforms.uAlpha.value * 100) / 100;
  return info;
})()
