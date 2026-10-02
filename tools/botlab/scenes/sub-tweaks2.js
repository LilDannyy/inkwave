// sub-tweaks2 pictures: staged views of the changes, for tools/botlab/shoot.cjs (PRE=this file, PRE_ARGS=<scene>; PLAY=1
// so shoot.cjs keeps the paint, ACTORS=1 where the kids are in it). SubSystem.update is wrapped to hold a moment (a
// sprinkler that hasn't sprayed yet) while the camera moves to each picture. Scenes (testbox unless said):
//   bow-old / bow-new   a full-draw volley's trail alone (its stick and burst paint off) along z from (0, 0, −32): the old
//                       drip rule replayed over the same flights / the new trail       bow-full   the new one with its bursts
//   wail-ledge          a Howl Box used at the spawn deck's edge (2.4 m up), charging: on the deck by the kid
//   wail-ledge-old      the same use, the speaker where the old rule put it (the floor below)
//   wail-map            on any stage (MAP=halyard …): at its biggest ledge drop (as the test's 'wailmap' finds them)
//   sprinkler-patch     two sprinklers just stuck, before any spray: one on the floor, one on the wall (x = 14)
//   (the tracked look — once a sonar shell here — is now tools/botlab/scenes/track-arrows.js)
//   poisoned            a foe hit by a Murk Bomb                                   poisoned-self  you, poisoned (play preset)
// The pictures (PNG → JPEG q78 in tools/botlab/jobs/sub-tweaks2/out/): see that folder's shots.sh.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, WEAPONS, PLAYER } = await import('./src/config.js');
  const { MAIN_KITS } = await import('./src/game/kits/registry.js');
  const BOW = await import('./src/game/kits/bow.js');
  const G = window.__G, S = G.subs, FX = S.statusFx, SC = window.__preArgs || 'poisoned';
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z), DOWN = V(0, -1, 0);
  let hook = null, after = null;
  const DT = 1 / 60, frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; if (after) after(); };
  const step = (s) => { for (let i = 0, n = Math.max(1, Math.round(s * 60)); i < n; i++) frame(); };
  const me = m.local, others = m.actors.filter((a) => a !== me), foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => zero(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const tb = g.mapDef?.id === 'testbox';
  const hide = (a, i) => { if (tb) put(a, V(-24 + (i % 4) * 1.5, 0, 36 + Math.floor(i / 4) * 1.5)); a.character.setVisible?.(false); a.character.root.visible = false; };
  const show = (a, p, yaw) => { put(a, p, yaw); a.character.setVisible?.(true); a.character.root.visible = true; };
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  S.clear(); G.projectiles.clear(); MAIN_KITS.bow?.clear?.(); G.paint.clear();
  for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = 1e6; a.invuln = 0; zero(a); a.status.track = a.status.reveal = a.status.poison = 0; }
  others.forEach(hide); if (!SC.endsWith('-self')) hide(me, 7);
  step(0.2);
  const holds = [];
  const u0 = S.update.bind(S);
  S.update = (dt) => { for (const h of holds) h(dt); u0(dt); };
  const info = { scene: SC };
  const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
  // a speaker held charging (its beam a pulsing guide line, the box full size) once it's down
  const holdSpeaker = (E) => holds.push(() => { for (const w of G.specials.world) if (w.kind === 'speaker' && w.owner === E && w.phase === 'charge' && w.t > 0.6) w.t = 0.6; });

  if (SC.startsWith('bow')) {
    const W = WEAPONS.bow, E = mates[0];
    show(E, V(0, 0, -32), 0); E.setWeapon('bow'); step(0.4);
    E.aimYaw = E.yaw = 0; E.aimPitch = 0; E.aimDir.set(0, 0, 1); E.aimPoint.set(E.pos.x, 1.2, 80);
    G.paint.clear();
    const keep = { landWidth: W.landWidth, landWidthFull: W.landWidthFull, burstPaint: W.burstPaint };
    if (SC !== 'bow-full') { W.landWidth = W.landWidthFull = 0; W.burstPaint = [0, 0]; }
    BOW.looseVolley(E, 1);
    const arr = BOW.BOW_DEBUG.arrows.slice(-3), tracks = arr.map((p) => [p.pos.clone()]);
    after = () => arr.forEach((p, i) => { if (BOW.BOW_DEBUG.arrows.includes(p) && p.st === 0 && !p.noHit) tracks[i].push(p.pos.clone()); });
    step(1.8); after = null; Object.assign(W, keep);
    if (SC === 'bow-old') {
      // the old rule over the same flights: a 0.32 m drip every 2.4 m of flight, counted a frame at a time
      G.paint.clear();
      for (const pts of tracks) { let t = -1.8; for (let i = 1; i < pts.length; i++) { t += pts[i].distanceTo(pts[i - 1]); if (t > 2.4) { t = 0; const h = G.physics.raycast(pts[i], DOWN, 4, undefined, true); if (h.hit) G.paint.splat(h.point.clone().addScaledVector(h.normal, 0.1), 0.32 * (0.8 + Math.random() * 0.4), E.team, { seed: Math.random(), instant: true }); } } }
    }
    for (let i = 0; i < 30; i++) G.paint.flush(DT);
    MAIN_KITS.bow.clear();
    info.tracks = tracks.map((t) => t.length);
  } else if (SC.startsWith('wail')) {
    const E = mates[0];
    let p = V(0, 0, -40.25), yaw = 0;
    if (SC === 'wail-map') {
      // the stage's biggest ledge drop (as tests/sub-tweaks2.js 'wailmap')
      let best = null;
      for (const n of G.nav.nodes) {
        if (n.zone >= 0) continue;
        const g0 = G.physics.raycast(V(n.x, n.y + 0.5, n.z), DOWN, 1.2, undefined, true);
        if (!g0.hit || g0.normal.y < 0.6) continue;
        const blk = G.level.blocks[g0.block]; if (blk && (blk.roof || blk.perch || blk.rail || blk.dynamic)) continue;
        for (let k = 0; k < 8; k++) {
          const yw = (k / 8) * Math.PI * 2, h = G.physics.raycast(V(n.x + Math.sin(yw) * 1.3, g0.point.y + 1.2, n.z + Math.cos(yw) * 1.3), DOWN, 4, undefined, true);
          if (h.hit && h.normal.y > 0.6 && (!best || g0.point.y - h.point.y > best.drop)) best = { x: n.x, y: g0.point.y, z: n.z, yaw: yw, drop: g0.point.y - h.point.y };
        }
      }
      p = V(best.x, best.y, best.z); yaw = best.yaw; info.spot = best;
    } else p.y = 2.4;
    const hold = () => { E.pos.set(p.x, p.y + 0.02, p.z); E.vel.set(0, 0, 0); E.yaw = E.aimYaw = yaw; E.aimPitch = 0; };
    show(E, p, yaw); hook = hold; step(0.2);
    if (SC === 'wail-ledge-old') {
      // where the old rule set it down: a ray from 1.2 m over the spot 1.3 m in front, 4 m down
      const at = p.clone().add(V(Math.sin(yaw) * 1.3, 0, Math.cos(yaw) * 1.3)); const h = G.physics.raycast(at.clone().setY(p.y + 1.2), DOWN, 4, undefined, true);
      const o = h.hit ? h.point : p;
      G.specials.netGhost(E, [2, 'sk', 99990, o.x, o.y, o.z, Math.sin(yaw), 0, Math.cos(yaw)]);
      info.old = [o.x, o.y, o.z];
    } else {
      const s = start(E, 'wail'); s.autoT = s.t + 0.15;
      step(0.5);
    }
    holdSpeaker(E); holds.push(() => { for (const w of G.specials.world) if (w.kind === 'speaker' && w.ghost && w.t > 0.6) w.t = 0.6; });
    step(0.7);
    const sk = G.specials.world.find((w) => w.kind === 'speaker');
    info.speaker = sk && [sk.pos.x, sk.pos.y, sk.pos.z]; info.kid = [E.pos.x, E.pos.y, E.pos.z];
  } else if (SC === 'sprinkler-patch') {
    S._throw(me, SUBS.sprinkler, V(-6, 0.6, -6), V(0, -3, 0.01), false);
    S._throw(mates[0], SUBS.sprinkler, V(13.0, 1.6, -3), V(8, 0, 0), false);   // (one each: a player's second replaces their first)
    holds.push(() => { for (const it of S.items) if (it.kind === 'sprinkler' && it.state === 'spray') it.pulseT = 9; });
    step(0.5);
    for (let i = 0; i < 30; i++) G.paint.flush(DT);
    info.at = S.items.filter((x) => x.kind === 'sprinkler').map((x) => [x.pos.x, x.pos.y, x.pos.z, x.state]);
  } else if (SC.startsWith('poisoned')) {
    const self = SC === 'poisoned-self', T = self ? me : foes[0];
    show(T, V(0, 0, -6), self ? 0 : Math.PI - 0.5);
    if (self) { g.rig.follow(me, true); g.rig.yaw = 0; g.rig.pitch = -0.12; }
    S._throw(self ? foes[0] : me, SUBS.mist, V(0, 1.0, -7.4), V(0, 0, 9), false);
    step(0.3);
    T.status.poison = 99;
    // (the mist cloud itself off, so the picture shows the bubbles on the kid)
    for (const it of S.items) if (it.kind === 'mist' && it.cloud) it.cloud.visible = false;
    holds.push(() => { for (const it of S.items) if (it.kind === 'mist' && it.cloud) it.cloud.visible = false; });
    step(1.5);
    info.parts = FX.parts.length;
  }
  return info;
})()
