// [b5-zipcheer] Zipline / Cheer Orb pictures, staged on testbox (flat deck at y 0; a 4 m wall at x 14…15, z −8…8) for
// tools/botlab/shoot.cjs (PRE=this file, PRE_ARGS=<scene>, ACTORS=1, PLAY=1). Every shot after the first steps the sim
// 5 frames (shoot.cjs), so several shots from one camera make a sequence. Scenes:
//   risen   your teammate up in the air with a Cheer Orb (~2.2 m, the orb ~70 % charged over its head), held there
//   wisps   the same, three teammates cheering it from round about: their wisps arcing in to the orb (a sequence)
//   zip     a Zipline user mid-zip toward the wall (the tether, the aura; a sequence along the zip)
// The pictures (PNG → JPEG in tools/botlab/jobs/batch5/zipcheer/out/): that folder's shots.sh.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const G = window.__G, SC = (window.__preArgs || 'risen').split(' ')[0];
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const frame = () => dbg.step(1000 / 60);
  const step = (s) => { for (let i = 0; i < Math.round(s * 60); i++) frame(); };
  const me = m.local, mates = m.actors.filter((a) => a.team === me.team && a !== me), foes = m.actors.filter((a) => a.team !== me.team);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.sub = it.jump = it.special = it.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._go) { a.intent.sub = !!a._go.sub; a.intent.fire = !!a._go.fire; } };
  me.bot = null;
  G.projectiles.clear(); G.subs.clear(); G.specials.clear();
  const place = (a, x, z, yaw) => { if (!a.alive) a.respawn(); a.pos.set(x, 0.02, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.yaw = a.aimYaw = yaw; a.aimPitch = 0.1; a.hp = 100; a.invuln = 99; };
  m.actors.forEach((a, i) => place(a, -26 + (i % 4) * 2, 38 + Math.floor(i / 4) * 2, 0));
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z; a.yaw = a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(p.y - (a.pos.y + 1.2), Math.hypot(dx, dz)); a.aimPoint.copy(p); };
  const [M1, M2, M3] = mates;
  step(0.2);
  if (SC === 'risen' || SC === 'wisps') {
    place(M1, 0, -6, 0.5);
    const s = start(M1, 'booyah');
    step(1.6);
    s.charge = 0.7;
    if (SC === 'wisps') {
      // the cheerers in a ring in front of it, facing it; their cheers a few frames apart (the wisps at different points)
      const ring = [[me, 6, 2], [M2, -5.5, 1.5], [M3, 1.5, 4.5]];
      for (const [a, x, z] of ring) { place(a, x, z, 0); aimAt(a, V(0, 3.5, -6)); }
      step(0.1);
      s.charge = 0.55;
      for (const [a] of ring) { a._cheerT = -9; a.intent.cheer = true; frame(); frame(); frame(); frame(); }
      step(0.05);
    }
    step(1 / 60);
    return { scene: SC, up: +(M1.pos.y).toFixed(2), charge: +s.charge.toFixed(2), pin: !!s.pin, wisps: G.specials.world.filter((w) => w.kind === 'cheerwisp').length };
  }
  if (SC === 'zip') {
    place(M1, -5, 1.5, Math.PI / 2);   // (19 m from the wall: in reach, 21 m)
    const s = start(M1, 'zipcaster');
    step(0.3);
    aimAt(M1, V(14, 1.6, 0.5));
    M1._go = { sub: true }; frame(); M1._go = null;
    for (let i = 0; i < 9; i++) frame();
    return { scene: SC, zip: !!s.zip, x: +M1.pos.x.toFixed(2), y: +M1.pos.y.toFixed(2), speed: +Math.hypot(M1.vel.x, M1.vel.y, M1.vel.z).toFixed(1) };
  }
  return { scene: SC, unknown: true };
})();
