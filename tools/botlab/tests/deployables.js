// deployables (batch 5, 2026-10-04, [b5-deploy]): src/game/deployables.js (+ subs.js / sp-surf.js / weapons.js hook-ins,
// deployables-bots.js). The user: "Deployables can be shot. These include beacons, and sprinklers, surf n turf and skitter
// bombs." and "If a sprinkler, beacon, curtain, beacon or surf n turf is in the path of the tower, the tower instantly
// destroys it."
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/deployables.js tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=testbox MODE=tower PAGE=tools/botlab/tests/deployables.js PAGE_ARGS='only=tower' tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=matrix,own,down,pop,looks,beam,standing,net,bots,sounds' (MODE=turf), 'only=tower' (MODE=tower)
// Staged on testbox (a flat deck, top y 0; a 4 m wall x 14…15, z ±8); everyone parked far off, brains stubbed (the bots'
// own parts: 'bots'). Checks:
//  - matrix: every device (Hop Beacon 120, Twirl Sprinkler 100, Surf N' Turf buoy 350, Skitter Bomb 40 on the ground)
//    against every damage source, each a fresh device and the real thing where it can be: a shot (a projectile), a
//    charger beam (fireCharger), a bow volley (looseVolley), a roller rolling into it (its drum), a Splat Bomb's blast,
//    a blaster's splash (newly reaching subs' devices), a sub (a Pop Pellet), a special (the Tidal Slam): its hp falls by
//    that source's damage (or it's gone);
//  - own: its own team's shot / beam / blast / roll / slam does nothing (the shot isn't even absorbed);
//  - down: shot until gone — destroyed at 0 (how many Spritzer shots each takes), 'device:down', out of the world;
//  - pop: a Skitter Bomb shot down while winding up next to a foe pops harmlessly — no blast, no damage, its puff and
//    seeker_pop; the end record [2, gid, 1]; a ghost given that record pops with no blast, one given [2, gid] bursts;
//  - looks: a hit flashes it white (its body / ink swapped to the flash material) and squashes it, then back; the
//    "tok" (device_hit); the shooter's hit marker ('device:hit' → hud.hitMarker) for your own shot only; the pop (an
//    explosion, device_pop, its own break);
//  - beam: a charger beam stops on a device in its way (the foe behind it untouched);
//  - standing: the Ink Tempest's rain, the vortex, the Howl Box's beam (through a wall), Surf N' Turf's rings wear
//    devices down (the owner's screen judges);
//  - net: a hit on a ghost device goes to its owner (sendDevHit), flashing it here, its hp untouched; a ghost shot on
//    our own device flashes it and costs nothing; the owner's netHurt takes it down and records [2, gid, 1];
//  - bots: a bot with no foe in sight shoots an enemy beacon and an enemy sprinkler down; a bot hunted by a Skitter Bomb
//    shoots it down (the threat system);
//  - sounds: device_hit, device_pop, seeker_pop, device_crunch are built;
//  - tower (MODE=tower): the moving tower destroys a sprinkler, a beacon, a Drip Curtain and a buoy in its way (a
//    crunch; 'device:down' how 'crush'; the end records [2, gid, 2] / [4, gid, 2]), one beside the track survives, and a
//    beacon, a sprinkler, a curtain and a buoy on its deck ride it; a ghost in its way waits for its owner's word.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, SPECIALS, PLAYER, WEAPONS } = await import('./src/config.js');
  const DEP = await import('./src/game/deployables.js');
  const DB = await import('./src/game/deployables-bots.js');
  const SURF = await import('./src/game/sp-surf.js');
  const BOW = await import('./src/game/kits/bow.js');
  const { THREAT_STATS } = await import('./src/game/bots.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, S = G.subs, D = DEP.DEPLOY, ST = DEP.DEPLOY_STATS;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DOWN = V(0, -1, 0), UPV = V(0, 1, 0);
  const r2 = (x) => Math.round(x * 100) / 100, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) { if (!a.bot._u0) a.bot._u0 = a.bot.update; a.bot.update = () => { zero(a); if (a._int) a._int(a.intent); }; } };
  const unstub = (a) => { if (a.bot && a.bot._u0) a.bot.update = a.bot._u0; };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const HOME = V(-20, 0, -30);
  const parkAll = () => others.forEach((a, i) => put(a, V(-22 + (i % 4) * 2, 0, 34 + Math.floor(i / 4) * 2)));
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  const weapons0 = new Map(m.actors.map((a) => [a, a.weaponId]));
  const reset = () => {
    hook = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear(); S.clear(); P.clear(); G.paint.clear();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a); a._int = null;
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0; a.status.shield = 0; a.status.trackTeam = -1;
      if (a.weaponId !== weapons0.get(a)) a.setWeapon(weapons0.get(a));
      a.character.root.visible = true;
    }
    parkAll(); put(me, HOME, 0);
    step(0.1);
  };
  // events + the looks' calls, recorded
  const evs = [];
  for (const n of ['device:hit', 'device:down', 'bomb:explode', 'sub:destroyed', 'surf:pop']) on(n, (e) => evs.push({ n, t: G.time, kind: e.kind, how: e.how, by: e.attacker || e.by || null, dmg: e.damage }));
  const cues = [];
  if (G.cues) { const one = G.cues.one.bind(G.cues); G.cues.one = (name, o) => { cues.push({ name, t: G.time }); return one(name, o); }; }
  const fxLog = [];
  if (G.fx) { const ex = G.fx.explosion.bind(G.fx); G.fx.explosion = (p, c, r) => { fxLog.push({ f: 'explosion', t: G.time, r }); return ex(p, c, r); }; }
  let markers = 0;
  if (G.hud?.hitMarker) { const hm = G.hud.hitMarker.bind(G.hud); G.hud.hitMarker = (k) => { markers++; return hm(k); }; }
  // the local session stub (as surf.js): records what the owner sends; nothing leaves the page
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {}, recMover() {},
    recKit: (a, kind, data) => sent.push({ a, kind, data: JSON.parse(JSON.stringify(data)), t: G.time }), sendDevHit: (o, kind, id, d) => sent.push({ dh: true, kind, id, d }), shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };

  // ---- the devices, made for real (thrown / planted as the game does), owned by `o`, at (x, z) on the deck
  const ground = (x, z, y = 3) => G.physics.raycast(V(x, y, z), DOWN, y + 3);
  const mk = {
    beacon(o, x, z) { const gh = ground(x, z); return S._plant(o, SUBS.beacon, gh.point.clone(), gh.normal.clone(), 0, gh, false); },
    sprinkler(o, x, z, vel = V(0, -6, 0), y = 0.7) { const it = S._throw(o, SUBS.sprinkler, V(x, y, z), vel, false); step(1, () => it.state === 'fly'); return it; },
    seeker(o, x, z) { const it = S._throw(o, SUBS.seeker, V(x, 0.6, z), V(0, -6, 0), false); step(1, () => it.state === 'fly'); return it; },
    surf(o, x, z) { const b = new SURF.Buoy(o, V(x, 0.3, z), V(0, 0, 0), false, 0); G.specials.world.push(b); b.land(V(x, 0, z)); return b; },
    curtain(o, x, z, vx = 0, vz = 0.2) { const it = S._throw(o, SUBS.curtain, V(x, 0.6, z), V(vx, -6, vz), false); step(1, () => it.state === 'fly'); return it; },
  };
  const HP = { beacon: SUBS.beacon.hp, sprinkler: SUBS.sprinkler.hp, seeker: SUBS.seeker.hp, surf: SPECIALS.surf.hp };
  const hpOf = (d) => (d.kind === 'surf' ? (d.phase === 'live' ? d.hp : 0) : d.state === 'dead' ? 0 : d.hp);
  const gone = (d) => (d.kind === 'surf' ? d.dead || d.phase !== 'live' : d.state === 'dead' || !S.items.includes(d));
  const midOf = (d) => (d.kind === 'surf' ? V(d.pos.x, d.pos.y + 0.6, d.pos.z) : DEP.devMid(d, V(0, 0, 0)));
  // a Skitter Bomb stays put while a test plays (no foe near: it would scuttle off; its clock held: it never winds up)
  const pinSeeker = (it) => { const at = it.pos.clone(); return () => { if (it.state === 'run') { it.pos.copy(at); it.t = 0; it.target = null; } }; };
  // aim actor a at point p (its brain stubbed: the shot follows aimPoint / aimYaw / aimPitch)
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z, dy = p.y - (a.pos.y + 1.1); a.yaw = a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(dy, Math.hypot(dx, dz)); if (a.bot) { a.bot.aimYaw = a.aimYaw; a.bot.aimPitch = a.aimPitch; } a.aimPoint.copy(p); };

  try {
    // ============================================================================================ the matrix
    if (want('matrix')) {
      const C = V(0, 0, -6);
      // each source: (shooter, device) → plays it; the damage it should do
      const SRC = {
        shot: { dmg: 36, run(sh, d) { const p = midOf(d), from = V(p.x - 5, p.y, p.z); P.fireCustom(sh, from, V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); step(0.3); } },
        beam: { dmg: WEAPONS.charger.damageMin + (WEAPONS.charger.damageMax * 0.62 - WEAPONS.charger.damageMin) * 0.3, prep(sh) { sh.setWeapon('charger'); }, run(sh, d) { const p = midOf(d); put(sh, V(p.x - 9, 0, p.z), Math.PI / 2); step(0.1); aimAt(sh, p); step(2 / 60); aimAt(sh, p); P.fireCharger(sh, WEAPONS.charger, 0.3); step(2 / 60); } },
        bow: { dmg: null, prep(sh) { sh.setWeapon('bow'); }, run(sh, d) { const p = midOf(d); put(sh, V(p.x - 7, 0, p.z), Math.PI / 2); step(0.1); aimAt(sh, p); step(2 / 60); aimAt(sh, p); BOW.looseVolley(sh, 1); step(0.6); } },
        roller: { dmg: WEAPONS.roller.rollDamage, prep(sh) { sh.setWeapon('roller'); }, run(sh, d) { const p = d.pos; put(sh, V(p.x - 3.2, 0, p.z), Math.PI / 2); step(0.1); sh._int = (it) => { it.fire = true; it.move.set(1, 0, 0); }; step(0.75, () => !gone(d) && (hpOf(d) === HP[d.kind] || d.kind === 'surf' ? true : false)); sh._int = null; zero(sh); step(0.1); } },
        bomb: { dmg: 60, run(sh, d) { P._explodeBomb({ pos: V(d.pos.x + 1.4, d.pos.y + 0.2, d.pos.z), team: sh.team, owner: sh, sp: false }); step(2 / 60); } },
        blaster: { dmg: WEAPONS.blaster.splashDamageMin, run(sh, d) { P._blastBurst({ owner: sh, team: sh.team, burst: null, weaponId: 'blaster', dbw: 0 }, V(d.pos.x + 1.3, d.pos.y + 0.5, d.pos.z), null); step(2 / 60); } },
        sub: { dmg: 25, run(sh, d) { S._throw(sh, SUBS.burst, V(d.pos.x + 1.2, 1.2, d.pos.z), V(0, -8, 0), false); step(0.4); } },
        special: { dmg: 60, run(sh, d) { put(sh, V(d.pos.x + 2, 0, d.pos.z), 0); step(2 / 60); sh._slamImpact(SPECIALS.slam); step(2 / 60); } },
      };
      const rows = {};
      for (const kind of ['beacon', 'sprinkler', 'surf', 'seeker']) {
        const row = rows[kind] = {};
        for (const [sk, src] of Object.entries(SRC)) {
          reset();
          const sh = foe;
          src.prep?.(sh);
          sh.ink = PLAYER.inkMax;
          put(sh, V(C.x + 6, 0, C.z + 6), 0);
          const d = mk[kind](me, C.x, C.z);
          if (kind === 'seeker') hook = pinSeeker(d);
          const h0 = hpOf(d);
          const e0 = evs.length;
          src.run(sh, d);
          const h1 = hpOf(d), lost = r2(h0 - h1), hits = evs.slice(e0).filter((e) => e.n === 'device:hit');
          // what it should have lost: that source's damage, capped by what it had (a bow volley: whatever its arrows did —
          // more than nothing, each a hit); a roller over the buoy may land a second drum hit as it presses on (0.5 s)
          const exp = src.dmg == null ? null : Math.min(h0, src.dmg);
          const ok = exp == null ? lost > 0 && hits.length >= 1 : sk === 'roller' && kind === 'surf' ? lost >= exp - 0.5 && Math.abs(lost / exp - Math.round(lost / exp)) < 0.01 : Math.abs(lost - exp) < 0.6;
          row[sk] = { lost, exp: exp == null ? 'any' : r2(exp), gone: gone(d), hits: hits.length, ok };
          if (sh.weaponId !== weapons0.get(sh)) sh.setWeapon(weapons0.get(sh));
        }
        const all = Object.values(row).every((r) => r.ok);
        R(`${kind} (${HP[kind]} hp) vs every enemy damage source — ${Object.entries(row).map(([k, r]) => `${k} −${r.lost}${r.gone ? ' (gone)' : ''}`).join(', ')}`, all, row);
      }
      // the sweeps: a brush's bristles over a beacon (its own damage and hit cooldown)
      reset();
      foe.setWeapon('brush'); foe.ink = PLAYER.inkMax;
      const b = mk.beacon(me, 0, -6);
      put(foe, V(-3, 0, -6), Math.PI / 2); step(0.1);
      foe._int = (it) => { it.fire = true; it.move.set(1, 0, 0); };
      step(0.6); foe._int = null; zero(foe);
      R(`a brush's bristles brushing into a beacon wear it down (${WEAPONS.brush.brushDamage} a touch, its ${WEAPONS.brush.brushHitCd} s cooldown): −${HP.beacon - hpOf(b)}`, HP.beacon - hpOf(b) >= WEAPONS.brush.brushDamage && (HP.beacon - hpOf(b)) % WEAPONS.brush.brushDamage === 0, { hp: hpOf(b), sweeps: ST.sweeps });
      foe.setWeapon(weapons0.get(foe));
    }

    // ============================================================================================ own team's fire
    if (want('own')) {
      const res = {};
      for (const kind of ['beacon', 'sprinkler', 'surf', 'seeker']) {
        reset();
        const d = mk[kind](me, 0, -6);
        if (kind === 'seeker') hook = pinSeeker(d);
        const p = midOf(d);
        const shot = S.blockShot(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), mate.team, 50, mate) || G.specials.shotHit(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), mate.team, 50, mate);
        const cut = Math.min(S.blockRay(V(p.x - 8, p.y, p.z), V(1, 0, 0), 20, mate.team, 160, mate), G.specials.rayHit(V(p.x - 8, p.y, p.z), V(1, 0, 0), 20, mate.team, 160, mate));
        S.damageArea(V(d.pos.x + 1, d.pos.y + 0.3, d.pos.z), 3, 60, mate.team, mate);
        put(mate, V(d.pos.x + 1.5, 0, d.pos.z), 0); step(2 / 60); mate._slamImpact(SPECIALS.slam); step(2 / 60);
        mate.setWeapon('roller'); put(mate, V(d.pos.x - 3, 0, d.pos.z), Math.PI / 2); step(0.05);
        mate._int = (it) => { it.fire = true; it.move.set(1, 0, 0); }; step(0.6); mate._int = null; zero(mate); mate.setWeapon(weapons0.get(mate));
        res[kind] = { shotAbsorbed: shot, beamCut: r2(cut), hp: hpOf(d), full: HP[kind] };
      }
      R('its own team\'s fire does nothing: a shot goes through it, a beam isn\'t cut, a blast, a Tidal Slam and a roller over it leave it whole (each device)',
        Object.values(res).every((r) => !r.shotAbsorbed && r.beamCut === 20 && r.hp === r.full), res);
    }

    // ============================================================================================ destroyed at 0
    if (want('down')) {
      const res = {};
      for (const kind of ['beacon', 'sprinkler', 'surf', 'seeker']) {
        reset();
        const d = mk[kind](foe, 0, -6);
        if (kind === 'seeker') hook = pinSeeker(d);
        const p = midOf(d), e0 = evs.length;
        let n = 0;
        while (!gone(d) && n < 30) { n++; S.blockShot(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), me.team, 36, me) || G.specials.shotHit(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), me.team, 36, me); }
        step(0.1);
        const ev = evs.slice(e0);
        res[kind] = { shots: n, want: Math.ceil(HP[kind] / 36), down: ev.some((e) => (e.n === 'device:down' && e.how === 'shot') || (kind === 'surf' && e.n === 'surf:pop')), inWorld: kind === 'surf' ? G.specials.world.includes(d) : S.items.includes(d) };
      }
      R(`destroyed at 0 hp — Spritzer shots (36) each takes: ${Object.entries(res).map(([k, r]) => `${k} ${r.shots}`).join(', ')} (a few, not one, not a magazine); 'device:down', out of the world`,
        Object.values(res).every((r) => r.shots === r.want && r.down && !r.inWorld) && res.beacon.shots >= 3 && res.sprinkler.shots >= 3, res);
    }

    // ============================================================================================ the Skitter Bomb pops
    if (want('pop')) {
      reset(); netOn();
      try {
        // my Skitter Bomb runs at a foe and winds up beside them; the foe shoots it during the windup
        put(foe, V(0, 0, 0), Math.PI);
        const it = S._throw(me, SUBS.seeker, V(0, 0.6, -5), V(0, -6, 0), false);
        it.gid = 77001;
        step(4, () => it.state !== 'prime');
        const primed = it.state === 'prime';
        const e0 = evs.length, c0 = cues.length;
        const p = midOf(it);
        S.blockShot(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), foe.team, 40, foe);
        step(1);
        const ev = evs.slice(e0);
        const rec = sent.find((x) => x.kind === 'subs' && x.data[0] === 2 && x.data[1] === 77001);
        R('a Skitter Bomb shot down while winding up beside a foe pops harmlessly: no blast, no damage, its puff and seeker_pop; the end record [2, gid, 1]',
          primed && it.state === 'dead' && !ev.some((e) => e.n === 'bomb:explode') && foe.hp === PLAYER.hp && ev.some((e) => e.n === 'device:down' && e.kind === 'seeker') && cues.slice(c0).some((c) => c.name === 'seeker_pop') && rec && rec.data[2] === 1,
          { primed, state: it.state, explode: ev.filter((e) => e.n === 'bomb:explode').length, foeHp: foe.hp, cues: cues.slice(c0).map((c) => c.name), rec: rec && rec.data });
        // ghosts on another screen: [2, gid, 1] pops it (no blast); [2, gid] (the owner's burst) bursts it
        reset();
        put(me, V(0, 0, 0), Math.PI);
        S.netGhost(foe, [0, 88001, 'seeker', 0, 0.6, -4, 0, -6, 0]); S.netGhost(foe, [0, 88002, 'seeker', 6, 0.6, -4, 0, -6, 0]);
        step(0.4);
        const g1 = S.items.find((x) => x.gid === 88001), g2 = S.items.find((x) => x.gid === 88002);
        const e1 = evs.length;
        S.netGhost(foe, [2, 88001, 1]); step(0.05);
        const pop = { dead: g1 && g1.state === 'dead', explode: evs.slice(e1).filter((e) => e.n === 'bomb:explode').length };
        const e2 = evs.length;
        S.netGhost(foe, [2, 88002]); step(0.05);
        const burst = { dead: g2 && g2.state === 'dead', explode: evs.slice(e2).filter((e) => e.n === 'bomb:explode').length };
        R('online: a ghost Skitter Bomb given the owner\'s [2, gid, 1] pops (no blast); one given [2, gid] still bursts', g1 && g2 && pop.dead && pop.explode === 0 && burst.dead && burst.explode === 1, { pop, burst });
      } finally { netOff(); }
    }

    // ============================================================================================ the looks
    if (want('looks')) {
      reset();
      const b = mk.beacon(foe, 0, -6), ud = b.mesh.userData, mat0 = ud.body.material, model = ud.inner.children[0], s0 = model.scale.x;
      const p = midOf(b), c0 = cues.length, m0 = markers, e0 = evs.length;
      // my own shot (a real projectile) → the flash, the squash, the tok, my hit marker
      P.fireCustom(me, V(p.x - 5, p.y, p.z), V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
      let white = false, sq = 0;
      step(0.3, () => { if (ud.body.material !== mat0 && ud.body.material.isMeshBasicMaterial) white = true; sq = Math.max(sq, model.scale.x / s0); });
      step(0.4);
      const back = ud.body.material === mat0 && Math.abs(model.scale.x / s0 - 1) < 1e-3;
      const hit = evs.slice(e0).find((e) => e.n === 'device:hit');
      R('a hit flashes it white (its body / ink on the flash material) and squashes it, then it\'s back to itself; the tok (device_hit)',
        white && sq > 1.05 && back && b.hp === HP.beacon - 36 && cues.slice(c0).some((c) => c.name === 'device_hit'), { white, squash: r2(sq), back, hp: b.hp, cues: cues.slice(c0).map((c) => c.name) });
      R('…and the shooter\'s hit marker: \'device:hit\' with me as the attacker, the HUD\'s hit marker shown', hit && hit.by === me && markers === m0 + 1, { by: hit && hit.by && hit.by.name, markers: markers - m0 });
      // a foe's shot on my own beacon: no marker for me
      const mb = mk.beacon(me, 4, -6), q = midOf(mb), m1 = markers;
      S.blockShot(V(q.x - 1, q.y, q.z), V(q.x + 1, q.y, q.z), foe.team, 36, foe); step(0.05);
      R('…not for someone else\'s shot (a foe hitting my beacon: no marker on my screen)', markers === m1 && mb.hp === HP.beacon - 36, { markers: markers - m1, hp: mb.hp });
      // the pop: shot down → an explosion, device_pop, its own break
      const c1 = cues.length, f1 = fxLog.length;
      for (let k = 0; k < 4 && b.state !== 'dead'; k++) S.blockShot(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), me.team, 36, me);
      step(0.05);
      const names = cues.slice(c1).map((c) => c.name);
      R('…shot down it pops: a burst of its ink (an explosion), device_pop over its own break (beacon_break)', b.state === 'dead' && fxLog.slice(f1).some((x) => x.f === 'explosion') && names.includes('device_pop'), { names, fx: fxLog.slice(f1).length });
      // the sprinkler's spinner flashes with it
      reset();
      const sp = mk.sprinkler(foe, 0, -6), sud = sp.mesh.userData, spin0 = [];
      sud.spin.traverse((o) => { if (o.isMesh) spin0.push(o.material); });
      const sq2 = midOf(sp);
      S.blockShot(V(sq2.x - 1, sq2.y, sq2.z), V(sq2.x + 1, sq2.y, sq2.z), me.team, 20, me); step(2 / 60);
      const spinW = []; sud.spin.traverse((o) => { if (o.isMesh) spinW.push(o.material.isMeshBasicMaterial); });
      step(0.5);
      const spinB = []; sud.spin.traverse((o) => { if (o.isMesh) spinB.push(o.material); });
      R('a sprinkler flashes whole (its spinning head too), then back', spinW.length && spinW.every(Boolean) && spinB.every((x, i) => x === spin0[i]), { flashed: spinW });
    }

    // ============================================================================================ a beam stops on it
    if (want('beam')) {
      const res = {};
      for (const kind of ['beacon', 'sprinkler', 'seeker']) {
        reset();
        const d = mk[kind](me, 0, -6);
        if (kind === 'seeker') hook = pinSeeker(d);
        put(mate, V(6, 0, -6), 0);   // (behind it, on the beam's line)
        const p = midOf(d);
        put(foe, V(-8, 0, -6), Math.PI / 2); foe.setWeapon('charger'); step(0.1);
        const tgt = V(6, p.y, -6); aimAt(foe, tgt); step(2 / 60); aimAt(foe, tgt);
        foe.aimPoint.set(6, p.y, -6);
        P.fireCharger(foe, WEAPONS.charger, 1); step(2 / 60);
        res[kind] = { hp: hpOf(d), mate: mate.hp };
        foe.setWeapon(weapons0.get(foe));
      }
      R('a charger beam stops on the first device in its way (a full charge: one shot breaks a beacon, sprinkler or Skitter Bomb) — the teammate behind it untouched',
        Object.values(res).every((r) => r.hp === 0 && r.mate === PLAYER.hp), res);
    }

    // ============================================================================================ standing fire
    if (want('standing')) {
      const res = {};
      // the Ink Tempest's rain over a sprinkler (1 s)
      reset();
      { const d = mk.sprinkler(me, 0, -6); P._spawnCloud({ pos: V(0, 0.5, -6), owner: foe, team: foe.team, dir: V(0, 0, 0) }); step(1); res.tempest = { lost: r2(HP.sprinkler - hpOf(d)), want: SPECIALS.storm.dps }; }
      // the vortex (a Vortex Strike's missile coming down by a beacon — its owner's ghost, as on another screen)
      reset();
      { const d = mk.beacon(me, 0, -6); G.specials._ghostObj(foe, [2, 'mi', 99001, 1, 0, -6]); step(SPECIALS.strike.flight + 1.2); res.vortex = { lost: r2(HP.beacon - hpOf(d)), gone: gone(d) }; }
      // the Howl Box's beam through the wall (a speaker at x 8 facing +x; the beacon behind the wall at x 18)
      reset();
      { const d = mk.beacon(me, 18, 0); G.specials._ghostObj(foe, [2, 'sk', 99002, 8, 0, 0, 1, 0, 0]); step(SPECIALS.wail.charge + 1); res.wail = { lost: r2(HP.beacon - hpOf(d)), gone: gone(d) }; }
      // Surf N' Turf's first ring passing a sprinkler 5 m out
      reset();
      { const d = mk.sprinkler(me, 5, -6); mk.surf(foe, 0, -6); step(SPECIALS.surf.anchor + 1.2); res.rings = { lost: r2(HP.sprinkler - hpOf(d)), want: SPECIALS.surf.damage }; }
      // …and its own team's rain does nothing
      reset();
      { const d = mk.sprinkler(me, 0, -6); P._spawnCloud({ pos: V(0, 0.5, -6), owner: mate, team: mate.team, dir: V(0, 0, 0) }); step(1); res.ownRain = { lost: r2(HP.sprinkler - hpOf(d)) }; }
      R(`standing fire wears devices down: the Ink Tempest's rain −${res.tempest.lost} in 1 s (${res.tempest.want}/s), the vortex −${res.vortex.lost}, the Howl Box's beam through a wall −${res.wail.lost}, Surf N' Turf's ring −${res.rings.lost}; its own team's rain −${res.ownRain.lost}`,
        Math.abs(res.tempest.lost - res.tempest.want) < 4 && res.vortex.lost > 60 && res.wail.gone && Math.abs(res.rings.lost - res.rings.want) < 0.1 && res.ownRain.lost === 0, res);
    }

    // ============================================================================================ online
    if (want('net')) {
      reset(); netOn();
      try {
        // a ghost beacon (the foe's, on this screen) hit by my shot: sent to its owner, flashed here, its hp untouched
        S.netGhost(foe, [1, 55001, 'beacon', 0, 0, -6, 0, 1, 0, 0]);
        const gb = S.items.find((x) => x.gid === 55001);
        const p = midOf(gb), m0 = markers;
        P.fireCustom(me, V(p.x - 5, p.y, p.z), V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
        let fl = 0; step(0.3, () => { fl = Math.max(fl, gb.flash || 0); });
        const dh = sent.find((x) => x.dh && x.id === 55001);
        R('a hit on a ghost device goes to its owner (sendDevHit: subs, its id, 36), flashes it here, my hit marker; its hp is the owner\'s to change',
          dh && dh.kind === 'subs' && dh.d === 36 && fl > 0.3 && gb.hp === HP.beacon && markers === m0 + 1, { dh, flash: r2(fl), hp: gb.hp, markers: markers - m0 });
        // a ghost shot (another screen's, muted here) on my own beacon: a flash, no cost
        const mb = mk.beacon(me, 4, -6), q = midOf(mb);
        mb.gid = 55002;
        G.netm.mute++; try { S.blockShot(V(q.x - 1, q.y, q.z), V(q.x + 1, q.y, q.z), foe.team, 36, foe); } finally { G.netm.mute--; }
        R('a ghost\'s shot on my own device flashes it and costs it nothing (the shooter\'s screen sends the hit)', mb.flash > 0.5 && mb.hp === HP.beacon, { flash: mb.flash, hp: mb.hp });
        // the owner's side: the hits arriving (netHurt) take it down → the end record [2, gid, 1]
        for (let k = 0; k < 4; k++) S.netHurt(55002, 36);
        step(0.05);
        const rec = sent.find((x) => x.kind === 'subs' && x.data[0] === 2 && x.data[1] === 55002);
        R('the owner takes the hits that arrive (netHurt) and at 0 records [2, gid, 1] (shot down)', mb.state === 'dead' && rec && rec.data[2] === 1, { state: mb.state, rec: rec && rec.data });
        // standing fire is the owner's to judge: a ghost cloud over my own sprinkler hurts it; over the foe's ghost sprinkler nothing
        reset(); netOn();
        const ms = mk.sprinkler(me, 0, -6);
        S.netGhost(foe, [0, 55003, 'sprinkler', 8, 0.7, -6, 0, -6, 0]); step(0.5);
        const gs = S.items.find((x) => x.gid === 55003);
        P._spawnCloud({ pos: V(0, 0.5, -6), owner: foe, team: foe.team, dir: V(0, 0, 0) }); P.clouds[P.clouds.length - 1].ghost = true;
        P._spawnCloud({ pos: V(8, 0.5, -6), owner: me, team: me.team, dir: V(0, 0, 0) });
        step(1);
        R('standing fire is judged by the device\'s owner: a ghost Ink Tempest over my sprinkler wears it down here; my cloud over the foe\'s ghost sprinkler costs it nothing here (its owner judges it)',
          ms.hp < HP.sprinkler - 20 && gs && gs.hp === HP.sprinkler && !sent.some((x) => x.dh && x.id === 55003), { mine: r2(ms.hp), ghost: gs && gs.hp });
      } finally { netOff(); }
    }

    // ============================================================================================ bots
    if (want('bots')) {
      const res = {};
      for (const kind of ['beacon', 'sprinkler']) {
        reset();
        const Sh = foes.find((f) => f.weapon.kind === 'shooter') || foe;
        if (Sh.weapon.kind !== 'shooter') Sh.setWeapon('shooter');
        unstub(Sh); put(Sh, V(0, 0, 2), Math.PI);
        const d = mk[kind](me, 0, -6);
        put(me, V(-20, 0, -44), 0);   // (out of its sight: up on the spawn deck behind)
        const p0 = DB.DEV_BOT.picks;
        step(5, () => !gone(d));
        res[kind] = { hp: hpOf(d), gone: gone(d), picked: DB.DEV_BOT.picks - p0, weapon: Sh.weaponId };
        stub(Sh);
      }
      R(`a bot with no foe in sight shoots an enemy beacon and an enemy sprinkler down (${Object.entries(res).map(([k, r]) => `${k}: ${r.gone ? 'gone' : 'hp ' + r.hp}`).join(', ')})`, res.beacon.gone && res.sprinkler.gone && res.beacon.picked >= 1, res);
      // a Skitter Bomb hunting a bot (its threat system): shot down, rounds over
      let popped = 0, reached = 0, n = 0;
      const t0 = { ...THREAT_STATS };
      for (let k = 0; k < 4; k++) {
        reset();
        const Sh = foes.find((f) => f.weapon.kind === 'shooter') || foe;
        if (Sh.weapon.kind !== 'shooter') Sh.setWeapon('shooter');
        unstub(Sh); put(Sh, V(0, 0, 4), Math.PI);
        put(me, V(-20, 0, -44), 0);
        step(0.3);
        const it = S._throw(me, SUBS.seeker, V(0, 0.6, -8), V(0, -6, 0), false);
        const p0 = ST.seekerPops, b0 = evs.filter((e) => e.n === 'bomb:explode').length;
        step(4, () => it.state !== 'dead');
        n++; if (ST.seekerPops > p0) popped++; if (evs.filter((e) => e.n === 'bomb:explode').length > b0) reached++;
        stub(Sh);
      }
      R(`a bot hunted by a Skitter Bomb shoots it down (bots.js threats: ${popped} of ${n} popped, ${reached} reached it)`, popped >= 3, { popped, reached, n, shoot: THREAT_STATS.shoot - (t0.shoot || 0), noticed: THREAT_STATS.noticed - (t0.noticed || 0) });
    }

    // ============================================================================================ sounds
    if (want('sounds')) {
      const A = G.audio; if (!A.ctx) A.init();
      const { DEPLOY_SOUNDS } = await import('./src/audio/sfx-deploy.js');
      const built = DEPLOY_SOUNDS.map((n) => { A.last?.delete(n); return [n, !!A.play(n, { volume: 0.01 })]; });
      R(`its sounds are built: ${DEPLOY_SOUNDS.join(', ')}`, built.every((b) => b[1]), built);
    }

    // ============================================================================================ the tower (MODE=tower)
    if (want('tower') && m.tower) {
      reset(); netOn();
      try {
        const T = m.tower, A = m.actors.filter((a) => a.team === 0 && a !== me);
        const rider = A[0], owner = m.actors.find((a) => a.team === 1) || foe;
        const at = (s) => T.path.at(s, V(0, 0, 0));
        const dirAt = (s) => { const a = at(s), b = at(s + 0.5); const d = V(b.x - a.x, 0, b.z - a.z); return d.normalize(); };
        // a team-0 rider on the deck pushes it toward +s (held there, unhurt)
        const onTop = () => { rider.pos.set(T.pos.x - 0.6, T.top + 0.05, T.pos.z - 0.6); rider.vel.set(0, 0, 0); rider.invuln = 9; };
        hook = onTop; step(0.6);
        const s0 = T.s;
        // in its way, ahead along the track (team 1's and team 0's alike); one beside the track; a ghost in its way
        const P0 = at(s0 + 3.5), P1 = at(s0 + 5), P2 = at(s0 + 7), P3 = at(s0 + 9), P4 = at(s0 + 10.5), dir = dirAt(s0 + 5), side = V(dir.z, 0, -dir.x);
        const cur = mk.curtain(owner, P0.x, P0.z, dir.x * 0.3, dir.z * 0.3); cur.gid = 66001;
        const spr = mk.sprinkler(owner, P1.x + side.x * 0.6, P1.z + side.z * 0.6); spr.gid = 66002;
        const bea = mk.beacon(rider, P2.x, P2.z); bea.gid = 66003;
        const bu = mk.surf(rider, P3.x - side.x * 0.5, P3.z - side.z * 0.5); bu.gid = 66004;
        const by = mk.beacon(owner, P2.x + side.x * 2.9, P2.z + side.z * 2.9); by.gid = 66005;   // (beside the track: clear of the body)
        S.netGhost(owner, [1, 66006, 'beacon', r2(P4.x), r2(P4.y), r2(P4.z), 0, 1, 0, 0]);
        const gh = S.items.find((x) => x.gid === 66006);
        // on the deck: a beacon planted, a sprinkler stuck, a curtain dropped, a buoy set down
        const deck = (dx, dz) => V(T.pos.x + dx, T.top, T.pos.z + dz);
        const g1 = G.physics.raycast(deck(0.7, 0.7).setY(T.top + 0.5), DOWN, 1.5);
        const dBea = S._plant(rider, SUBS.beacon, g1.point.clone(), g1.normal.clone(), 0, g1, false);
        const dSpr = S._throw(rider, SUBS.sprinkler, deck(-0.7, 0.75).setY(T.top + 0.6), V(0, -6, 0), false);
        const dCur = S._throw(owner, SUBS.curtain, deck(0.7, -0.7).setY(T.top + 0.6), V(0.2, -6, 0), false);
        const dBu = new SURF.Buoy(rider, deck(-0.7, -0.7).setY(T.top + 0.3), V(0, 0, 0), false, 0); G.specials.world.push(dBu);
        step(0.3);
        const offs = { bea: dBea.pos.clone().sub(T.pos), spr: null, cur: null, bu: null };
        offs.spr = dSpr.pos.clone().sub(T.pos); offs.cur = dCur.pos.clone().sub(T.pos); offs.bu = dBu.pos.clone().sub(T.pos);
        const e0 = evs.length, c0 = cues.length;
        const seen = {};
        let ghostLive = true;
        step(25, () => {
          for (const [k, d] of [['curtain', cur], ['sprinkler', spr], ['beacon', bea], ['buoy', bu]]) if (seen[k] == null && gone(d)) seen[k] = r2(T.s - s0);
          if (T.s - s0 < 10.6 + TOWER_PAD()) ghostLive = ghostLive && gh.state !== 'dead';
          return T.s - s0 < 12.5;
        });
        hook = null;
        const moved = r2(T.s - s0);
        const ev = evs.slice(e0).filter((e) => e.n === 'device:down' && e.how === 'crush');
        const recs = sent.filter((x) => x.kind === 'subs' && x.data[0] === 2 && x.data[2] === 2).map((x) => x.data[1]);
        const brec = sent.find((x) => x.kind === 'surf' && x.data[0] === 4 && x.data[2] === 2);
        R(`the moving tower destroys what's in its way the moment its body reaches it — a Drip Curtain at ${seen.curtain} m, a sprinkler at ${seen.sprinkler} m, a beacon at ${seen.beacon} m, a buoy at ${seen.buoy} m (placed 3.5 / 5 / 7 / 9 m ahead; its half-width ${1.25} m), whoever's they are`,
          moved > 10 && ['curtain', 'sprinkler', 'beacon', 'buoy'].every((k) => seen[k] != null) && seen.curtain < 3.5 && seen.sprinkler < 5 && seen.beacon < 7 && seen.buoy < 9 && ev.length >= 4,
          { seen, moved, crushEvents: ev.map((e) => e.kind) });
        R('…with a crunch (device_crunch) each, and the owners\' end records say so: [2, gid, 2] for the curtain, sprinkler and beacon, [4, gid, 2] for the buoy',
          cues.slice(c0).filter((c) => c.name === 'device_crunch').length >= 4 && [66001, 66002, 66003].every((id) => recs.includes(id)) && !!brec, { crunches: cues.slice(c0).filter((c) => c.name === 'device_crunch').length, recs, buoy: brec && brec.data });
        R('a beacon beside the track (its body clear of the tower\'s) is left standing', by.state === 'beacon' && S.items.includes(by), { state: by.state });
        R('a ghost in its way waits for its owner\'s word (not crushed by this screen\'s tower); the owner\'s [2, gid, 2] takes it with the crunch', ghostLive, { ghostLive });
        const c1 = cues.length;
        S.netGhost(owner, [2, 66006, 2]); step(0.05);
        R('…[2, gid, 2] arrives: gone, with the crunch', gh.state === 'dead' && cues.slice(c1).some((c) => c.name === 'device_crunch'), { state: gh.state });
        // the deck: everything set down on it rides along
        const drift = (d, o) => r2(d.pos.clone().sub(T.pos).distanceTo(o));
        const deckRes = { beacon: { alive: dBea.state === 'beacon', drift: drift(dBea, offs.bea) }, sprinkler: { alive: dSpr.state === 'spray', drift: drift(dSpr, offs.spr) },
          curtain: { alive: dCur.state === 'curtain', drift: drift(dCur, offs.cur) }, buoy: { alive: dBu.phase === 'live', drift: drift(dBu, offs.bu), on: dBu.on && dBu.on.b.tag } };
        R(`devices on its deck ride it ${moved} m and are never crushed: a beacon planted on it, a sprinkler stuck to it, a Drip Curtain dropped on it, a buoy set down on it`,
          Object.values(deckRes).every((r) => r.alive && r.drift < 0.05) && deckRes.buoy.on === 'tower', deckRes);
      } finally { netOff(); hook = null; }
    }
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 900)); }
  function TOWER_PAD() { return 0; }
  return out;
})();
