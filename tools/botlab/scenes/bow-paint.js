// bow-paint pictures (2026-10-02, the user: "the bow needs to cover ink a bit better … making it easier to cover the floor
// in an uninterrupted straight line" — and "use a dummy to shoot a fully charged shot and look at the ink on the
// ground"): a dummy kid on testbox draws the Tideline Bow for real (its trigger held through the runner, not a scripted
// volley), lets go and the arrows fly, lodge and burst over the clean flat deck. For tools/botlab/shoot.cjs (PRE=this
// file, PRE_ARGS=<scene>, PLAY=1 so the paint stays). Scenes:
//   full       one full-draw volley from (0, 0, −32), level along +z (the default)
//   ring       the same at ring 1 (charge 0.6)          tap   a tap (charge 0.3)
//   three      three full-draw volleys side by side from x = −9, 0, 9 (three kids, one each)
// The cameras (tools/botlab/jobs/bow-paint/shots.sh): 'archer' just behind and above the kid, 'top' straight down over
// the flight, 'view' from the side — the same as the lead's tools/botlab/jobs/bow-paint/ref/bow-now-*.jpg.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { WEAPONS, TEAM_PALETTES } = await import('./src/config.js');
  const { MAIN_KITS } = await import('./src/game/kits/registry.js');
  const G = window.__G, ARGS = (window.__preArgs || 'full').split(' '), SC = ARGS[0];
  // what-ifs: PRE_ARGS='full tune=dropScale:0.6' sets those WEAPONS.bow values for the picture
  const TUNE = (/tune=([\w.:,-]+)/.exec(ARGS.slice(1).join(' ')) || [])[1];
  if (TUNE) for (const kv of TUNE.split(',')) { const [k, v] = kv.split(':'); if (k in WEAPONS.bow) WEAPONS.bow[k] = +v; }
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DT = 1 / 60, frame = () => { g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s) => { for (let i = 0, n = Math.max(1, Math.round(s * 60)); i < n; i++) frame(); };
  const me = m.local, others = m.actors.filter((a) => a !== me), mates = others.filter((a) => a.team === me.team);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const firing = new Set();
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (firing.has(a)) a.intent.fire = true; };
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const hide = (a, i) => { put(a, V(-24 + (i % 4) * 1.5, 0, 36 + Math.floor(i / 4) * 1.5)); a.character.setVisible?.(false); a.character.root.visible = false; };
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }   // (the FX droplets' own random ink: off)
  G.subs.clear(); G.projectiles.clear(); MAIN_KITS.bow?.clear?.();
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; zero(a); a.special = 0; }
  m.actors.forEach(hide);
  // the same colours every time: the archer's team lemon, the other grape
  { const L = TEAM_PALETTES.find((p) => p.id === 'lemon-grape'); if (L && g._setPalette) g._setPalette(me.team === 0 ? L : { ...L, a: L.b, b: L.a }); }
  step(0.2);
  const xs = SC === 'three' ? [-9, 0, 9] : [0];
  const charge = SC === 'ring' ? 0.6 : SC === 'tap' ? 0.3 : 1;
  const kids = xs.map((x, i) => mates[i]);
  kids.forEach((E, i) => { put(E, V(xs[i], 0, -32), 0); E.setWeapon('bow'); E.character.root.visible = true; E.character.setVisible?.(true); });
  step(0.4);
  G.paint.clear();
  const aim = () => kids.forEach((E) => { E.aimYaw = E.yaw = 0; E.aimPitch = 0; E.bot.aimYaw = 0; E.bot.aimPitch = 0; E.aimDir.set(0, 0, 1); E.aimPoint.set(E.pos.x, 1.2, 80); });
  // the draw: the trigger held until the runner's charge reaches `charge` (full: the draw tops out and holds), then let go
  const W = WEAPONS.bow, info = { scene: SC, charge: [], loosed: [] };
  kids.forEach((E) => { E.ink = 100; firing.add(E); });
  for (let i = 0; i < 120; i++) {
    aim(); frame();
    if (kids.every((E) => E.weaponRunner.charge >= Math.min(0.999, charge))) break;
  }
  info.charge = kids.map((E) => +E.weaponRunner.charge.toFixed(3));
  if (charge >= 1) { aim(); step(0.1); }
  kids.forEach((E) => firing.delete(E));
  aim(); frame();
  info.loosed = kids.map((E) => !E.weaponRunner.charging);
  step(2.2);   // flight, lodge, fuse, burst
  for (let i = 0; i < 30; i++) G.paint.flush(DT);
  MAIN_KITS.bow.clear();
  g.screenfx?.reset?.();   // (no lens drops in the pictures)
  return info;
})()
