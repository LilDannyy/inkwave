// deployables (batch 5, 2026-10-04, [b5-deploy]): src/game/deployables.js (+ subs.js / sp-surf.js / weapons.js hook-ins,
// deployables-bots.js). The user: "Deployables can be shot. These include beacons, and sprinklers, surf n turf and skitter
// bombs." and "If a sprinkler, beacon, curtain, beacon or surf n turf is in the path of the tower, the tower instantly
// destroys it."
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/deployables.js tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=testbox MODE=tower PAGE=tools/botlab/tests/deployables.js PAGE_ARGS='only=tower' tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=calamari MODE=turf … PAGE_ARGS='only=rail' · MAP=podbox MODE=turf … PAGE_ARGS='only=hedge'
//   PAGE_ARGS='only=matrix,own,down,pop,looks,beam,standing,net,bots,sounds,floors' (MODE=turf), 'only=tower' (MODE=tower)
// Staged on testbox (a flat deck, top y 0; a 4 m wall x 14…15, z ±8); everyone parked far off, brains stubbed (the bots'
// own parts: 'bots'). Checks:
//  - matrix: every device (Hop Beacon 120, Twirl Sprinkler 100, Surf N' Turf buoy 350, Skitter Bomb 60 on the ground)
//    against every damage source, each a fresh device and the real thing where it can be: a shot (a projectile), a
//    charger beam (fireCharger), a bow volley (looseVolley), a roller rolling into it (its drum), a Splat Bomb's blast,
//    a blaster's splash (newly reaching subs' devices), a sub (a Pop Pellet), a special (the Tidal Slam): its hp falls by
//    that source's damage (or it's gone);
//  - own: its own team's shot / beam / blast / roll / slam does nothing (the shot isn't even absorbed);
//  - down: shot until gone — destroyed at 0 (how many Spritzer shots each takes: a few, the Skitter Bomb two), 'device:down',
//    out of the world;
//  - pop: a Skitter Bomb shot down while winding up next to a foe pops harmlessly — no blast, no damage, its puff and
//    seeker_pop; the end record [2, gid, 1]; a ghost given that record pops with no blast, one given [2, gid] bursts;
//  - looks: a hit flashes it white (its body / ink swapped to the flash material) and squashes it, then back; the
//    "tok" (device_hit); the shooter's hit marker ('device:hit' → hud.hitMarker) for your own shot only; the pop (an
//    explosion, device_pop, its own break);
//  - beam: a charger beam stops on a device in its way (the foe behind it untouched);
//  - standing: the Ink Tempest's rain, the vortex, the Howl Box's beam (through a wall), Surf N' Turf's rings wear
//    devices down (the owner's screen judges) — the buoy too;
//  - net: a hit on a ghost device goes to its owner (sendDevHit), flashing it here, its hp untouched; a ghost shot on
//    our own device flashes it and costs nothing; the owner's netHurt takes it down and records [2, gid, 1]; a player who
//    left (their squidkid carried on here: DEPLOY.adopt) — their ghost devices are ours now, shot down here; a squidkid
//    removed from the match takes its devices with it;
//  - bots: a bot with no foe in sight walks up to an enemy beacon / sprinkler and shoots it down (a shooter, a roller, a
//    charger, a blaster); a bot hunted by a Skitter Bomb shoots it down (the threat system); a noticed Vortex Strike
//    between a bot and an enemy beacon: it never steps into it (device AI on and off); a foe in sight comes first; a
//    device it can't break: it gives up after 8 s on it in all (summed over re-picks), leaves it 12 s, comes back;
//  - sounds: device_hit, device_pop, seeker_pop, device_crunch are built;
//  - floors (any stage): the one moving-floor rule on a plain moving block — a Lurk Mine and a Hop Beacon laid on it, a
//    sprinkler stuck to its side, a curtain dropped on it ride it along, up and round, at their spots; the owner's word
//    [4, gid, …, tag, l, n] once each, ghosts from the records ride the same; a foe trips the mine where it is now; the
//    block taken away: the floor ones drop onto the floor below ([4, gid, x, y, z]), the wall one breaks;
//  - tower (MODE=tower, its push stubbed to a steady 1.5 m/s): the moving tower destroys a Drip Curtain, a sprinkler, a
//    beacon and a buoy in its way the moment its body reaches each (a crunch; 'device:down' how 'crush'; the end
//    records [2, gid, 2] / [4, gid, 2]), one beside the track survives, a ghost in its way waits for its owner's word;
//    a Lurk Mine and a Hop Beacon laid on its deck, a sprinkler stuck to its pillar, a curtain and a buoy on its deck
//    ride it (the mine's ghost too) and the mine trips for a foe on the deck there; a Lurk Mine lying in its way is
//    pushed aside out of its path (never inside it, nor its ghost), still armed; bots: a rider shoots a device in reach
//    from the deck, leaves one out of reach alone and never steps off; an escort never walks off its task for one;
//  - rail (MAP=calamari): a sprinkler stuck to a railcar's flank and a curtain on its roof ride it the whole way (ghosts
//    too) — a mine or a beacon can't be laid on a railcar (an off-limits roof, as before); a Lurk Mine lying on the
//    trackbed in its way is pushed out of it as it comes (never inside it), still armed where it ends up, its ghost too;
//  - hedge (MAP=podbox): a mine in a bramble wall's trough is lifted onto it or shoved out of its way as it grows (never
//    inside it); one laid on its top rides it down as it wilts; both end on the floor, still armed.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, SPECIALS, PLAYER, WEAPONS, TOWER: TWR, weaponRange } = await import('./src/config.js');
  const TOWER_R = TWR.platformR;
  const DEP = await import('./src/game/deployables.js');
  const DB = await import('./src/game/deployables-bots.js');
  const SURF = await import('./src/game/sp-surf.js');
  const BOW = await import('./src/game/kits/bow.js');
  const { THREAT_STATS } = await import('./src/game/bots.js');
  const { on, emit } = await import('./src/core/ctx.js');
  const { Hit } = await import('./src/game/physics.js');
  const G = window.__G, P = G.projectiles, S = G.subs, D = DEP.DEPLOY, ST = DEP.DEPLOY_STATS;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z), _vIn = new THREE.Vector3();
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
  // (its own brain back, fresh: nothing remembered from an earlier scene — a foe it saw there would have it hunting)
  const unstub = (a) => { if (a.bot && a.bot._u0) { a.bot.update = a.bot._u0; a.bot.reset(); } };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  // (testbox / podbox: the open deck; any other stage: the spawn pads)
  const BOX = /box$/.test(G.level.layout?.id || ''), pad = (t) => G.level.spawnPads[t];
  const HOME = BOX ? V(-20, 0, -30) : V(pad(me.team).x, pad(me.team).y, pad(me.team).z);
  const parkAll = () => others.forEach((a, i) => put(a, BOX ? V(-22 + (i % 4) * 2, 0, 34 + Math.floor(i / 4) * 2) : V(pad(a.team).x + (i % 4) - 1.5, pad(a.team).y, pad(a.team).z + Math.floor(i / 4) - 0.5)));
  // (a bot scene on testbox: everyone on the other side from bot x — but `keep` — behind the 4 m wall at x 14…15: no foe
  // for it to find but the ones a scene shows it)
  const hideFoes = (x, keep = []) => m.actors.filter((a) => a.team !== x.team && !keep.includes(a)).forEach((a, i) => put(a, V(21 + (i % 3) * 1.5, 0, -3 + Math.floor(i / 3) * 1.5), 0));
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
  for (const n of ['device:hit', 'device:down', 'bomb:explode', 'sub:destroyed', 'surf:pop']) on(n, (e) => evs.push({ n, t: G.time, kind: e.kind, how: e.how, by: e.attacker || e.by || null, dmg: e.damage, pos: e.pos ? e.pos.clone() : null }));
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
    surf(o, x, z, gid = 0) { const b = new SURF.Buoy(o, V(x, 0.3, z), V(0, 0, 0), false, gid); G.specials.world.push(b); b.land(V(x, 0, z)); return b; },
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
      // (it runs up first: a press while standing is a swipe — flung globs — not the bristles)
      put(foe, V(-4.6, 0, -6), Math.PI / 2); step(0.1);
      let fr = 0;
      foe._int = (it) => { it.move.set(1, 0, 0); it.fire = ++fr > 14; };
      const sw0 = ST.sweeps, e0 = evs.length;
      step(0.75); foe._int = null; zero(foe);
      // (a press always flicks a swipe first — its globs hit too; the bristles' touches are the 30s, one per touch)
      const bl = HP.beacon - hpOf(b), nsw = ST.sweeps - sw0, t30 = evs.slice(e0).filter((e) => e.n === 'device:hit' && e.dmg === WEAPONS.brush.brushDamage).length;
      R(`a brush's bristles brushing into a beacon wear it down (${WEAPONS.brush.brushDamage} a touch, its ${WEAPONS.brush.brushHitCd} s cooldown): ${nsw} touches of ${WEAPONS.brush.brushDamage} (−${bl} with the swipe's globs)`, nsw >= 1 && t30 === nsw && bl >= nsw * WEAPONS.brush.brushDamage, { hp: hpOf(b), sweeps: nsw, hits30: t30 });
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
      R(`destroyed at 0 hp — Spritzer shots (36) each takes: ${Object.entries(res).map(([k, r]) => `${k} ${r.shots}`).join(', ')} (a few, not one — two for the small, quick Skitter Bomb — not a magazine); 'device:down', out of the world`,
        Object.values(res).every((r) => r.shots === r.want && r.down && !r.inWorld) && res.beacon.shots >= 3 && res.sprinkler.shots >= 3 && res.seeker.shots >= 2 && Object.values(res).every((r) => r.shots <= 12), res);
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
        let shots = 0;
        for (; shots < 4 && it.state !== 'dead'; shots++) S.blockShot(V(p.x - 1, p.y, p.z), V(p.x + 1, p.y, p.z), foe.team, 40, foe);
        step(1);
        const ev = evs.slice(e0);
        const rec = sent.find((x) => x.kind === 'subs' && x.data && x.data[0] === 2 && x.data[1] === 77001);
        R(`a Skitter Bomb shot down while winding up beside a foe (${shots} shots of 40) pops harmlessly: no blast, no damage, its puff and seeker_pop; the end record [2, gid, 1]`,
          primed && shots === Math.ceil(SUBS.seeker.hp / 40) && it.state === 'dead' && !ev.some((e) => e.n === 'bomb:explode') && foe.hp === PLAYER.hp && ev.some((e) => e.n === 'device:down' && e.kind === 'seeker') && cues.slice(c0).some((c) => c.name === 'seeker_pop') && rec && rec.data[2] === 1,
          { primed, shots, state: it.state, explode: ev.filter((e) => e.n === 'bomb:explode').length, foeHp: foe.hp, cues: cues.slice(c0).map((c) => c.name), rec: rec && rec.data });
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
      put(me, V(-8, 0, -6), Math.PI / 2); step(0.1);   // (close by: a hit's tok is heard within 30 m)
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
      // the Surf N' Turf buoy under the same standing fire: the rain, the vortex, the Howl Box's beam, another buoy's ring
      const bres = {};
      reset();
      { const d = mk.surf(me, 0, -6); P._spawnCloud({ pos: V(0, 0.5, -6), owner: foe, team: foe.team, dir: V(0, 0, 0) }); step(1); bres.tempest = { lost: r2(HP.surf - hpOf(d)), want: SPECIALS.storm.dps }; }
      reset();
      { const d = mk.surf(me, 0, -6); G.specials._ghostObj(foe, [2, 'mi', 99011, 1, 0, -6]); step(SPECIALS.strike.flight + 1.2); bres.vortex = { lost: r2(HP.surf - hpOf(d)) }; }
      reset();
      { const d = mk.surf(me, 18, 0); G.specials._ghostObj(foe, [2, 'sk', 99012, 8, 0, 0, 1, 0, 0]); step(SPECIALS.wail.charge + 1); bres.wail = { lost: r2(HP.surf - hpOf(d)), gone: gone(d) }; }
      reset();
      { const d = mk.surf(me, 5, -6); mk.surf(foe, 0, -6, 0); step(SPECIALS.surf.anchor + 1.2); bres.rings = { lost: r2(HP.surf - hpOf(d)), want: SPECIALS.surf.damage }; }
      R(`…and the Surf N' Turf buoy (${HP.surf} hp) under it: the rain −${bres.tempest.lost} in 1 s, the vortex −${bres.vortex.lost}, the Howl Box's beam through a wall −${bres.wail.lost}${bres.wail.gone ? ' (gone)' : ''}, another buoy's ring −${bres.rings.lost}`,
        Math.abs(bres.tempest.lost - bres.tempest.want) < 4 && bres.vortex.lost > 60 && bres.wail.lost > 60 && bres.rings.lost >= bres.rings.want - 0.1, bres);
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
        const rec = sent.find((x) => x.kind === 'subs' && x.data && x.data[0] === 2 && x.data[1] === 55002);
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
        // a player who left: this screen (the host) carries on their squidkid (netmatch.js _adopt → DEPLOY.adopt) — their
        // ghost devices become this screen's own: a hit here takes their hp (no sendDevHit to the one who's gone), at 0
        // they're shot down with the end record [2, gid, 1]; a squidkid taken out of the match takes its devices with it
        reset(); netOn();
        S.netGhost(foe, [1, 55011, 'beacon', 0, 0, -6, 0, 1, 0, 0]); S.netGhost(foe, [0, 55012, 'sprinkler', 4, 0.7, -6, 0, -6, 0]); step(0.5);
        const ab = S.items.find((x) => x.gid === 55011), as = S.items.find((x) => x.gid === 55012);
        D.adopt(foe);
        const ownNow = { beacon: ab && !ab.ghost, sprinkler: as && !as.ghost };
        const qa = midOf(ab), d0 = sent.length;
        S.blockShot(V(qa.x - 1, qa.y, qa.z), V(qa.x + 1, qa.y, qa.z), me.team, 36, me); step(0.05);
        const hpAfter = ab.hp, toGone = sent.slice(d0).filter((x) => x.dh).length;
        for (let k = 0; k < 4 && ab.state !== 'dead'; k++) S.blockShot(V(qa.x - 1, qa.y, qa.z), V(qa.x + 1, qa.y, qa.z), me.team, 36, me);
        step(0.05);
        const arec = sent.find((x) => x.kind === 'subs' && x.data && x.data[0] === 2 && x.data[1] === 55011);
        R('a player who left (their squidkid carried on here): their ghost devices become this screen\'s own — a hit takes the beacon\'s hp here (nothing sent to the one who\'s gone), and it\'s shot down with [2, gid, 1]',
          ownNow.beacon && ownNow.sprinkler && hpAfter === HP.beacon - 36 && toGone === 0 && ab.state === 'dead' && arec && arec.data[2] === 1, { ownNow, hpAfter, sentToOwner: toGone, state: ab.state, rec: arec && arec.data });
        reset(); netOn();
        S.netGhost(foe, [1, 55021, 'beacon', 0, 0, -6, 0, 1, 0, 0]); step(0.2);
        const rb = S.items.find((x) => x.gid === 55021), keep = mk.beacon(me, 4, -6);
        emit('actor:removed', { actor: foe }); step(0.05);
        R('a squidkid taken out of the match (Practice: a player who left) takes its devices with it; everyone else\'s stay',
          rb && rb.state === 'dead' && keep.state === 'beacon', { removed: rb && rb.state, other: keep.state });
      } finally { netOff(); }
    }

    // ============================================================================================ bots
    if (want('bots')) {
      const res = {};
      // (a bot 9 m off, facing away, its brain running; me behind the wall: no foe in its sight)
      for (const [kind, wid] of [['beacon', 'shooter'], ['sprinkler', 'shooter'], ['beacon', 'roller'], ['sprinkler', 'charger'], ['beacon', 'blaster']]) {
        reset();
        const Sh = foe;
        Sh.setWeapon(wid); Sh.ink = PLAYER.inkMax;
        unstub(Sh); put(Sh, V(0, 0, 3), 0);
        const d = mk[kind](me, 0, -6);
        put(me, V(22, 0, 0), 0);   // (out of its sight: behind the wall)
        const p0 = DB.DEV_BOT.picks;
        const n = step(10, () => !gone(d));
        res[kind + ':' + wid] = { gone: gone(d), hp: r2(hpOf(d)), s: r2(n / 60), picked: DB.DEV_BOT.picks - p0 };
        stub(Sh); Sh.setWeapon(weapons0.get(Sh));
      }
      R(`a bot with no foe in sight walks up to an enemy beacon / sprinkler and shoots it down: ${Object.entries(res).map(([k, r]) => `${k} ${r.gone ? r.s + ' s' : 'hp ' + r.hp}`).join(', ')}`, Object.values(res).every((r) => r.gone && r.picked >= 1), res);
      // a Skitter Bomb hunting a bot (its threat system): shot down, rounds over
      let popped = 0, reached = 0, n = 0;
      const t0 = { ...THREAT_STATS };
      for (let k = 0; k < 4; k++) {
        reset();
        const Sh = foes.find((f) => f.weapon.kind === 'shooter') || foe;
        if (Sh.weapon.kind !== 'shooter') Sh.setWeapon('shooter');
        unstub(Sh); put(Sh, V(0, 0, 4), Math.PI);
        put(me, V(22, 0, 0), 0);
        step(0.3);
        const it = S._throw(me, SUBS.seeker, V(0, 0.6, -8), V(0, -6, 0), false);
        const p0 = ST.seekerPops, b0 = evs.filter((e) => e.n === 'bomb:explode').length;
        step(4, () => it.state !== 'dead');
        n++; if (ST.seekerPops > p0) popped++; if (evs.filter((e) => e.n === 'bomb:explode').length > b0) reached++;
        stub(Sh);
      }
      R(`a bot hunted by a Skitter Bomb shoots it down (bots.js threats: ${popped} of ${n} popped, ${reached} reached it)`, popped >= 3, { popped, reached, n, shoot: THREAT_STATS.shoot - (t0.shoot || 0), noticed: THREAT_STATS.noticed - (t0.noticed || 0) });

      // a noticed danger on its way to a device: a shooter bot with no foe in sight, my beacon 12 m off (it walks to ~8 m
      // of one) and my team's Vortex Strike coming down beside their line, across it (on the map: noticed) — it goes round the
      // vortex or waits, never a step into it; the same with the device AI off (the danger guard has the last word over
      // the device's footwork: bots.js runs devShootAim before botSpecials act)
      // (the area the bots' danger model gives a Vortex Strike: its ring + 0.6 m — botSpecials.js specialDangers; a step in
      // it shows as an escape out of it)
      const VX = V(4.7, 0, -1), RV = SPECIALS.strike.radius + 0.6, dres = {};
      const { SPECIAL_STATS } = await import('./src/game/botSpecials.js');
      for (const [onAI, rep] of [[true, 0], [false, 0], [true, 1], [false, 1]]) {
        reset();
        DB.DEV_AI.enabled = onAI;
        try {
          const Sh = foe;
          Sh.setWeapon('shooter'); Sh.ink = PLAYER.inkMax;
          unstub(Sh); put(Sh, V(0, 0, 5), Math.PI);
          hideFoes(Sh);
          G.specials._ghostObj(mate, [2, 'mi', 99101 + (onAI ? 0 : 1) + rep * 2, VX.x, VX.y, VX.z]);
          hook = () => { put(Sh, V(0, 0, 5), Math.PI); Sh.ink = PLAYER.inkMax; };
          step(0.8);   // (it has noticed it — on the map — standing where it starts)
          hook = () => { Sh.ink = PLAYER.inkMax; };
          const d = mk.beacon(me, 0, -7), s0 = DB.DEV_BOT.secs, esc0 = SPECIAL_STATS.escapes;
          let inside = 0, minD = 99, n2 = 0;
          step(SPECIALS.strike.flight + SPECIALS.strike.duration - 0.8, () => {
            const w = G.specials.world.find((x) => (x.kind === 'tornado' || x.kind === 'missile') && !x.dead);
            if (!w) return false;
            n2++;
            const dd = Math.hypot(Sh.pos.x - VX.x, Sh.pos.z - VX.z);
            minD = Math.min(minD, dd); if (dd < RV - 0.05) inside++;
          });
          (dres[onAI ? 'on' : 'off'] || (dres[onAI ? 'on' : 'off'] = [])).push({ inside, escapes: SPECIAL_STATS.escapes - esc0, closest: r2(minD), frames: n2, deviceSecs: r2(DB.DEV_BOT.secs - s0), beaconHp: r2(hpOf(d)), at: v2(Sh.pos) });
        } finally { hook = null; DB.DEV_AI.enabled = true; stub(foe); foe.setWeapon(weapons0.get(foe)); }
      }
      // (two scenes each way. The danger model's area is the vortex's ring + 0.6 m; a bot sliding along the area's edge on
      // its own route may graze it — a few frames, a few cm — and step back out (an escape): the danger guard's own
      // precision, the same with the device AI off. What may never happen: a walk into it — the old order (device
      // footwork after the guard) went 0.26 m in for 36 frames with 4 escapes in one scene)
      const worst = (xs) => ({ closest: Math.min(...xs.map((x) => x.closest)), inside: Math.max(...xs.map((x) => x.inside)), escapes: xs.reduce((t, x) => t + x.escapes, 0) });
      const wOn = worst(dres.on), wOff = worst(dres.off);
      R(`a bot going for an enemy beacon with a noticed Vortex Strike between them goes round it or waits — never a walk into it (device AI on: closest ${wOn.closest} m, ${wOn.inside} frames past the edge, ${wOn.escapes} escapes; off: ${wOff.closest} m, ${wOff.inside}, ${wOff.escapes}; the area ${r2(RV)} m, the vortex's ring ${SPECIALS.strike.radius} m)`,
        [wOn, wOff].every((w) => w.closest >= RV - 0.2 && w.inside <= 12) && dres.on.every((x) => x.frames > 200 && x.deviceSecs > 1) && dres.off.every((x) => x.deviceSecs === 0), { on: dres.on, off: dres.off, area: r2(RV) });

      // a foe in sight comes first: a bot with my beacon 6 m off and a foe (a dummy) in the open 11 m off fights the foe,
      // never the beacon; once the foe has gone (behind the wall, and forgotten) it shoots the beacon down
      {
        reset();
        const Sh = foe;
        Sh.setWeapon('shooter'); Sh.ink = PLAYER.inkMax;
        unstub(Sh); put(Sh, V(0, 0, 3), Math.PI);
        put(me, V(22, 0, 0), 0);
        const d = mk.beacon(me, -6, 1);
        hideFoes(Sh, [mate]);
        put(mate, V(0, 0, -8), 0); mate.hp = 1e6;
        const s0 = DB.DEV_BOT.secs, h0 = hpOf(d);
        let fought = 0, devWhile = 0;
        step(3, () => { mate.hp = 1e6; Sh.ink = PLAYER.inkMax; if (Sh.bot.target === mate && Sh.bot.seeTimer > 0) { fought++; if (Sh.bot.sp._dev) devWhile++; } });
        const during = { deviceSecs: r2(DB.DEV_BOT.secs - s0), deviceFramesWhileSeen: devWhile, beaconLost: r2(h0 - hpOf(d)), framesOnFoe: fought };
        put(mate, V(22, 0, 4), 0); mate.hp = PLAYER.hp;
        const trace = []; let fr = 0;
        const n3 = step(16, () => { Sh.ink = PLAYER.inkMax; if (fr++ % 60 === 0) trace.push([Sh.bot.mode, Sh.bot.target ? Sh.bot.target.name : null, r2(Sh.bot.seeTimer), v2(Sh.pos), Sh.bot.sp._dev ? Sh.bot.sp._dev.kind : null]); return !gone(d); });
        const after = { gone: gone(d), s: r2(n3 / 60), deviceSecs: r2(DB.DEV_BOT.secs - s0), trace };
        stub(Sh); Sh.setWeapon(weapons0.get(Sh)); parkAll();
        const tr = after.gone ? '' : ` — ${trace.map((t) => `${t[0]}${t[1] ? ':' + t[1] + (t[2] > 0 ? '(seen)' : '') : ''}${t[4] ? '+dev' : ''}@${t[3][0]},${t[3][2]}`).join(' ')}`;
        R(`a foe in sight comes first: a bot with an enemy beacon 6 m off and a foe in the open fights the foe (frames on the beacon while it sees the foe: ${devWhile}; device mode ${during.deviceSecs} s before it had seen it; the beacon −${during.beaconLost}); the foe gone, it shoots the beacon down (${after.gone ? after.s + ' s' : 'not'}${tr})`,
          during.framesOnFoe > 90 && devWhile === 0 && during.deviceSecs < 0.5 && during.beaconLost === 0 && after.gone && after.deviceSecs > during.deviceSecs, { during, after });
      }

      // giving up: a beacon it can't break (hp held at Infinity) — it gives up after DEV_GIVEUP s on it in all, even when
      // a foe showing up for a moment broke it off and it went back (the time on it is summed, not restarted), then
      // leaves it alone DEV_FORGET s, then comes back to it (a re-pick, not a new pick)
      {
        reset();
        const Sh = foe;
        Sh.setWeapon('shooter'); Sh.ink = PLAYER.inkMax;
        unstub(Sh); put(Sh, V(0, 0, 3), Math.PI);
        put(me, V(22, 0, 0), 0);
        hideFoes(Sh, [mate]);
        const d = mk.beacon(me, 0, -6); d.hp = Infinity;
        const on = () => Sh.bot.sp._dev?.obj === d;
        const P0 = { ...DB.DEV_BOT };
        let busy = 0, t = 0, gaveAt = null, busyAtGive = null, broke = false, hid = false, seen = 0, backAt = null, offFor = null, pin = null, repickBack = null;
        step(40, () => {
          t += DT; Sh.ink = PLAYER.inkMax;
          if (on()) busy += DT;
          // (3 s on it: a foe in the open, in front of it, for a moment breaks it off; then gone again)
          if (!broke && busy >= 3) { broke = true; put(mate, V(1.2, 0, -2.5), 0); mate.hp = 1e6; }
          if (broke && !hid && Sh.bot.target === mate && Sh.bot.seeTimer > 0) seen += DT;
          if (broke && !hid && seen >= 0.6) { hid = true; put(mate, V(22, 0, 4), 0); mate.hp = PLAYER.hp; }
          else if (broke && !hid) mate.hp = 1e6;
          if (hid && repickBack == null && on()) repickBack = DB.DEV_BOT.repicks - P0.repicks;
          if (gaveAt == null && DB.DEV_BOT.gaveUp > P0.gaveUp) { gaveAt = t; busyAtGive = busy; pin = Sh.pos.clone(); }
          // (while it leaves it alone it stays where it gave up — in sight of it — so the time it's left alone is the rule's)
          if (pin && backAt == null) { Sh.pos.x = pin.x; Sh.pos.z = pin.z; Sh.vel.x = Sh.vel.z = 0; }
          if (gaveAt != null && backAt == null && on()) { backAt = t; offFor = t - gaveAt; }
          return backAt == null;
        });
        const res2 = { busyAtGiveUp: busyAtGive && r2(busyAtGive), wallAtGiveUp: gaveAt && r2(gaveAt), leftAlone: offFor && r2(offFor), picks: DB.DEV_BOT.picks - P0.picks, repicks: DB.DEV_BOT.repicks - P0.repicks, broke, foeSeenS: r2(seen), repickAfterFoe: repickBack, giveUp: DB.DEV_GIVEUP, forget: DB.DEV_FORGET };
        stub(Sh); Sh.setWeapon(weapons0.get(Sh)); parkAll();
        R(`giving up: a beacon it can't break — it gives up after ${res2.busyAtGiveUp} s on it in all (${DB.DEV_GIVEUP} s; ${res2.wallAtGiveUp} s of the clock: a foe broke it off and it went back), leaves it alone ${res2.leftAlone} s (${DB.DEV_FORGET} s), then comes back to it (${res2.picks} pick, ${res2.repicks} re-picks)`,
          broke && hid && repickBack === 1 && busyAtGive != null && Math.abs(busyAtGive - DB.DEV_GIVEUP) < 0.1 && gaveAt > busyAtGive + 0.5 && offFor != null && offFor >= DB.DEV_FORGET - 0.05 && offFor < DB.DEV_FORGET + 0.6 && res2.picks === 1 && res2.repicks === 2, res2);
      }
    }

    // ============================================================================================ sounds
    if (want('sounds')) {
      const A = G.audio; if (!A.ctx) A.init();
      const { DEPLOY_SOUNDS } = await import('./src/audio/sfx-deploy.js');
      const built = DEPLOY_SOUNDS.map((n) => { A.last?.delete(n); return [n, !!A.play(n, { volume: 0.01 })]; });
      R(`its sounds are built: ${DEPLOY_SOUNDS.join(', ')}`, built.every((b) => b[1]), built);
    }

    // ============================================================================================ moving floors: helpers
    // a device's spot in a block's own axes (what the rule keeps), and back to the world
    const locOf = (p, b) => { const d = p.clone().sub(b.center); return [d.dot(b.axes[0]), d.dot(b.axes[1]), d.dot(b.axes[2])]; };
    const worldOf = (l, b) => b.center.clone().addScaledVector(b.axes[0], l[0]).addScaledVector(b.axes[1], l[1]).addScaledVector(b.axes[2], l[2]);
    // the owner's records for these gids, played into ghosts (another player's copies: gid + 500000) as they come
    const feeder = (owner) => { let n = 0; const ids = new Set(); return { ids, owner, feed() { for (; n < sent.length; n++) { const x = sent[n]; if (x.kind !== 'subs' || !x.data || !ids.has(x.data[1])) continue; const d = x.data.slice(); d[1] += 500000; S.netGhost(owner, d); } } }; };
    const ghostOf = (it) => S.items.find((x) => x.ghost && x.gid === it.gid + 500000);
    // a throw, as G.subs.use makes it, with its throw record played into the ghost too (use() sends [0, gid, kind, from, vel])
    const throwG = (o, sub, from, vel, F) => { const it = S._throw(o, sub, from, vel, false); F.ids.add(it.gid); S.netGhost(F.owner, [0, it.gid + 500000, sub.kind, r2(from.x), r2(from.y), r2(from.z), r2(vel.x), r2(vel.y), r2(vel.z)]); return it; };
    const recs4 = (gid) => sent.filter((x) => x.kind === 'subs' && x.data && x.data[0] === 4 && x.data[1] === gid).map((x) => x.data);
    const hold = (list) => () => { for (const d of list) { if (!d) continue; if (d.state === 'spray') d.pulseT = 9; if (d.state === 'curtain') d.hp = SUBS.curtain.hp; if (d.kind === 'surf' && d.phase === 'live') d.T = 0; } };
    // a foe walking up to a mine (wherever it is now): it trips and blows there
    const tripAt = (mine, who) => {
      const e0 = evs.length, at = mine.pos.clone();
      put(who, V(at.x + 0.9, at.y, at.z + 0.3), 0); who.pos.y = at.y + 0.02;
      let boom = null;
      const h0 = hook; hook = () => { if (h0) h0(); if (!boom) { who.pos.x = mine.pos.x + 0.9; who.pos.z = mine.pos.z + 0.3; who.pos.y = mine.pos.y + 0.02; who.vel.set(0, 0, 0); } };
      step(1.6, () => { const e = evs.slice(e0).find((x) => x.n === 'bomb:explode'); if (e) boom = e.pos; return !boom; });
      hook = h0;
      return { tripped: !!boom, at: boom && v2(boom), from: v2(at), off: boom ? r2(Math.hypot(boom.x - mine.pos.x, boom.z - mine.pos.z)) : null };
    };

    // ============================================================================================ a moving platform (any stage)
    // the one rule on a plain moving block (Level.addDynamic): a Lurk Mine and a Hop Beacon planted on it by a kid standing
    // there, a Twirl Sprinkler stuck to its side, a Drip Curtain dropped on it — it goes 3 m along, 1 m up and turns
    // 0.5 rad: each keeps its spot (and the sprinkler its face); ghosts built from the owner's records ride it the same;
    // a foe walking up trips the mine where it is now. Then the block goes from under them: the floor ones drop onto the
    // floor below (the owner's word [4, gid, x, y, z]), the one on its side breaks
    if (want('floors')) {
      reset(); netOn();
      try {
        const L = G.level, plat = L.addDynamic({ tag: 'test:platform' }), half = V(2.4, 0.3, 2.4);
        const c = V(-6, 1.1, 8); let yaw = 0;
        L.moveDynamic(plat, c, half, yaw); step(2 / 60);
        const top = c.y + half.y, F = feeder(mate);
        const plantOn = (sub, x, z) => { put(me, V(x, top, z), 0); me.pos.y = top + 0.02; step(2 / 60); S._place(me, sub); return S.items.filter((x) => x.owner === me && x.kind === sub.kind).pop(); };
        const laid = V(c.x - 1.4, top, c.z - 1.4);
        const mine = plantOn(SUBS.mine, c.x - 1.4, c.z - 1.4), mine2 = plantOn(SUBS.mine, c.x - 1.4, c.z + 1.4), bea = plantOn(SUBS.beacon, c.x + 1.3, c.z - 1.3);
        put(me, HOME, 0); step(2 / 60);
        const spr = throwG(me, SUBS.sprinkler, V(c.x + half.x + 1.2, c.y + 0.05, c.z + 0.6), V(-14, 1.5, 0), F);
        const cur = throwG(me, SUBS.curtain, V(c.x + 0.6, top + 0.9, c.z + 1.0), V(0, -6, 0.25), F);
        for (const d of [mine, mine2, bea, spr, cur]) F.ids.add(d.gid);
        step(0.6, () => { F.feed(); return spr.state === 'fly' || cur.state === 'fly'; }); step(0.1); F.feed(); step(0.1); F.feed();
        const all = { mine, mine2, beacon: bea, sprinkler: spr, curtain: cur };
        const set = Object.fromEntries(Object.entries(all).map(([k, d]) => [k, { on: d.on && d.on.b === plat, face: d.on ? [d.on.k, d.on.s] : null }]));
        const l0 = Object.fromEntries(Object.entries(all).map(([k, d]) => [k, locOf(d.pos, plat)]));
        const n0 = locOf(spr.normal.clone().add(plat.center), plat);
        hook = hold([spr, cur]);
        let drift = {}, gdrift = {};
        step(2, () => { c.x += 1.5 / 60; c.y += 0.5 / 60; yaw += 0.25 / 60; L.moveDynamic(plat, c, half, yaw); F.feed();
          for (const [k, d] of Object.entries(all)) { const w = worldOf(l0[k], plat); drift[k] = Math.max(drift[k] || 0, r2(d.pos.distanceTo(w))); const gh = ghostOf(d); gdrift[k] = Math.max(gdrift[k] || 0, gh ? r2(gh.pos.distanceTo(d.pos)) : 99); } });
        step(2 / 60);
        const nNow = locOf(spr.normal.clone().add(plat.center), plat), curTurn = r2(Math.atan2(cur.n.x, cur.n.z));
        const r4 = Object.fromEntries(Object.entries(all).map(([k, d]) => [k, recs4(d.gid).map((x) => x[5])]));
        R(`a moving platform: a Lurk Mine and a Hop Beacon planted on it, a sprinkler stuck to its side, a Drip Curtain dropped on it ride it 3 m along, 1 m up and turned 0.5 rad, each at its spot (worst drift ${Math.max(...Object.values(drift))} m), the sprinkler still on its side`,
          Object.values(set).every((x) => x.on) && Object.values(drift).every((x) => x < 0.05) && Math.abs(nNow[0] - n0[0]) < 0.02 && set.sprinkler.face[0] !== 1 && set.mine.face[0] === 1 && Math.abs(c.y + half.y - mine.pos.y) < 0.02,
          { set, drift, sprinklerFace: set.sprinkler.face, curtainFacing: curTurn, mineY: r2(mine.pos.y), top: r2(c.y + half.y) });
        R('…the owner says where each sits once ([4, gid, …, \'test:platform\', …]), and the ghosts built from its records ride the same spots',
          Object.values(r4).every((x) => x.length === 1 && x[0] === 'test:platform') && Object.values(gdrift).every((x) => x < 0.05), { records: r4, ghostDrift: gdrift });
        const tr = tripAt(mine, foe);
        const away = r2(Math.hypot(tr.from[0] - laid.x, tr.from[2] - laid.z));
        R(`…a foe walking up to the mine where the platform has taken it trips it, and it blows there (${tr.off} m from it; ${away} m from where it was laid)`, tr.tripped && tr.off < 0.4 && away > 2, { ...tr, away });
        put(foe, V(c.x + 30, 0, c.z), 0); step(0.1);
        // the block goes from under them
        const s0 = sent.length;
        plat.solid = false; L.moveDynamic(plat, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        step(0.2, () => { F.feed(); }); F.feed();
        const fl = (d) => d.state !== 'dead' && Math.abs(d.pos.y - L.groundHeight(d.pos.x, d.pos.z, d.pos.y + 0.5)) < 0.05 && !d.on;
        const after = sent.slice(s0).filter((x) => x.kind === 'subs' && x.data).map((x) => x.data);
        const dropRec = (d) => after.find((x) => x[0] === 4 && x[1] === d.gid && x.length === 5);
        R('…the platform taken away: the mine, the beacon and the curtain drop onto the floor below (the owner\'s word [4, gid, x, y, z]), the sprinkler on its side breaks ([2, gid]); the ghosts do the same',
          fl(mine2) && fl(bea) && fl(cur) && spr.state === 'dead' && dropRec(mine2) && dropRec(bea) && dropRec(cur) && after.some((x) => x[0] === 2 && x[1] === spr.gid)
            && [mine2, bea, cur].every((d) => { const gh = ghostOf(d); return gh && gh.pos.distanceTo(d.pos) < 0.05; }) && !(ghostOf(spr) && ghostOf(spr).state !== 'dead'),
          { mine2: v2(mine2.pos), beacon: v2(bea.pos), curtain: v2(cur.pos), sprinkler: spr.state, recs: after });
        const tr2 = tripAt(mine2, foe);
        R('…and the mine that dropped is still armed where it landed: a foe trips it there', tr2.tripped && tr2.off < 0.4, tr2);
      } finally { netOff(); hook = null; }
    }

    // ============================================================================================ the tower (MODE=tower)
    if (want('tower') && m.tower) {
      reset(); netOn();
      const T = m.tower, rules0 = T._rules;
      try {
        // the tower pushed at a steady 1.5 m/s (its rules stubbed: the push itself is tower-rules.js's)
        let drive = 0;
        T._rules = function () { if (drive) { this.s = Math.min(this.path.len[0] - 0.5, this.s + drive / 60); this.moving = 1; } else this.moving = 0; };
        const rider = mates[0] || me, owner = foe, F = feeder(foe2 || foe);
        const at = (s) => T.path.at(s, V(0, 0, 0));
        const dirAt = (s) => { const a = at(s - 0.3), b = at(s + 0.3); return V(b.x - a.x, 0, b.z - a.z).normalize(); };
        const s0 = T.s;
        // ON ITS DECK: a Lurk Mine and a Hop Beacon laid by a kid standing there, a sprinkler stuck to the pillar, a Drip
        // Curtain dropped on it, a buoy set down on it
        const deck = (lx, lz) => { const c = Math.cos(T.yaw), s = Math.sin(T.yaw); return V(T.pos.x + c * lx + s * lz, T.top, T.pos.z - s * lx + c * lz); };
        const lay = (sub, lx, lz) => { const p = deck(lx, lz); put(rider, p, 0); rider.pos.y = T.top + 0.02; step(2 / 60); S._place(rider, sub); return S.items.filter((x) => x.owner === rider && x.kind === sub.kind && x.state !== 'dead').pop(); };
        const dMine = lay(SUBS.mine, -0.75, 0.75), dBea = lay(SUBS.beacon, 0.75, 0.75);
        put(rider, HOME, 0); step(2 / 60);
        const pc = deck(0, -1.4); pc.y = T.top + 1.0;
        const dSpr = S._throw(rider, SUBS.sprinkler, pc, V(T.pos.x - pc.x, 0, T.pos.z - pc.z).normalize().multiplyScalar(10), false);
        const dCur = S._throw(owner, SUBS.curtain, deck(-0.7, -0.7).setY(T.top + 0.6), V(0.2, -6, 0), false);
        const dBu = new SURF.Buoy(rider, deck(0.75, -0.75).setY(T.top + 0.4), V(0, 0, 0), false, 0); G.specials.world.push(dBu);
        for (const d of [dMine, dBea, dSpr]) F.ids.add(d.gid);
        step(0.5, () => { F.feed(); }); F.feed();
        const deckSet = { mine: dMine.on && dMine.on.b.tag, beacon: dBea.on && dBea.on.b.tag, sprinkler: dSpr.on && dSpr.on.b.tag, curtain: dCur.on && dCur.on.b.tag, buoy: dBu.on && dBu.on.b.tag };
        // IN ITS WAY, ahead along the track (whoever's they are): a curtain across it, a sprinkler, a beacon, a buoy; one
        // beacon beside it; a ghost beacon (another player's) in its way
        const P = (k) => at(s0 + k), side = (k) => { const d = dirAt(s0 + k); return V(d.z, 0, -d.x); };
        const way = { curtain: 2.6, sprinkler: 3.6, beacon: 4.6, buoy: 5.8, ghost: 7.0 };
        const cur = mk.curtain(owner, P(way.curtain).x, P(way.curtain).z, dirAt(s0 + way.curtain).x * 0.3, dirAt(s0 + way.curtain).z * 0.3);
        const spr = mk.sprinkler(owner, P(way.sprinkler).x + side(way.sprinkler).x * 0.5, P(way.sprinkler).z + side(way.sprinkler).z * 0.5);
        const bea = mk.beacon(rider, P(way.beacon).x, P(way.beacon).z);
        const bu = mk.surf(owner, P(way.buoy).x - side(way.buoy).x * 0.4, P(way.buoy).z - side(way.buoy).z * 0.4, 66004);
        const by = mk.beacon(owner, P(way.beacon).x + side(way.beacon).x * 3.2, P(way.beacon).z + side(way.beacon).z * 3.2);
        S.netGhost(owner, [1, 66006, 'beacon', r2(P(way.ghost).x), r2(P(way.ghost).y), r2(P(way.ghost).z), 0, 1, 0, 0]);
        const gh = S.items.find((x) => x.gid === 66006);
        // a Lurk Mine lying in its way (not on the user's list: pushed aside, out of its path — never inside it)
        way.mine = 6.4;
        const mAt = P(way.mine).addScaledVector(side(way.mine), 0.5);
        put(owner, mAt, 0); owner.pos.y = mAt.y + 0.02; step(2 / 60); S._place(owner, SUBS.mine);
        const pm = S.items.filter((x) => x.owner === owner && x.kind === 'mine' && x.state !== 'dead').pop();
        F.ids.add(pm.gid); parkAll(); step(2 / 60); F.feed();
        let mIn = 0, gmIn = 0;
        const L = G.level, inT = (p) => L.pointInBlock(T.block, _vIn.set(p.x, p.y + 0.1, p.z), -0.05);
        const offs = { mine: dMine.pos.clone().sub(T.pos), beacon: dBea.pos.clone().sub(T.pos), sprinkler: dSpr.pos.clone().sub(T.pos), curtain: dCur.pos.clone().sub(T.pos), buoy: dBu.pos.clone().sub(T.pos) };
        hook = hold([dSpr, dCur, dBu, cur, spr, bu]);
        const e0 = evs.length, c0 = cues.length, seen = {};
        let ghostLive = true, gdrift = 0;
        drive = 1.5;
        step(6.5, () => {
          F.feed();
          for (const [k, d] of [['curtain', cur], ['sprinkler', spr], ['beacon', bea], ['buoy', bu]]) if (seen[k] == null && gone(d)) seen[k] = r2(T.s - s0);
          if (T.s - s0 < way.ghost) ghostLive = ghostLive && gh.state !== 'dead';
          const g1 = ghostOf(dMine); gdrift = Math.max(gdrift, g1 ? g1.pos.distanceTo(dMine.pos) : 99);
          if (pm.state !== 'dead' && inT(pm.pos)) mIn++;
          const gpm = ghostOf(pm); if (gpm && gpm.state !== 'dead' && inT(gpm.pos)) gmIn++;
          return T.s - s0 < way.ghost + 1.4;
        });
        drive = 0;
        const moved = r2(T.s - s0);
        // the moment the body reaches it: its front (half-width 1.25 m, up to 1.77 m on a diagonal) at its near edge
        const R0 = { curtain: 0, sprinkler: DEP.DEV_R.sprinkler, beacon: DEP.DEV_R.beacon, buoy: 0.37 * 0.8 };
        const timely = Object.fromEntries(Object.keys(R0).map((k) => [k, seen[k] != null && seen[k] <= way[k] - 1.25 - R0[k] + 0.15 && seen[k] >= way[k] - 1.77 - R0[k] - 0.15]));
        const ev = evs.slice(e0).filter((e) => e.n === 'device:down' && e.how === 'crush');
        const recs = sent.filter((x) => x.kind === 'subs' && x.data && x.data[0] === 2 && x.data[2] === 2).map((x) => x.data[1]);
        const brec = sent.find((x) => x.kind === 'surf' && x.data && x.data[0] === 4 && x.data[1] === bu.gid && x.data[2] === 2);
        R(`the moving tower destroys what's in its way the moment its body reaches it — a Drip Curtain across the track at ${seen.curtain} m, a sprinkler at ${seen.sprinkler} m, a beacon at ${seen.beacon} m, a buoy at ${seen.buoy} m (placed ${way.curtain} / ${way.sprinkler} / ${way.beacon} / ${way.buoy} m ahead), whoever's they are`,
          moved > way.ghost && Object.values(timely).every(Boolean) && ['curtain', 'sprinkler', 'beacon', 'surf'].every((k) => ev.some((e) => e.kind === k)), { seen, timely, moved, crushEvents: ev.map((e) => e.kind) });
        R('…with a crunch (device_crunch) each, and the owners\' end records say so: [2, gid, 2] for the curtain, sprinkler and beacon, [4, gid, 2] for the buoy',
          cues.slice(c0).filter((c) => c.name === 'device_crunch').length >= 4 && [cur.gid, spr.gid, bea.gid].every((id) => recs.includes(id)) && !!brec, { crunches: cues.slice(c0).filter((c) => c.name === 'device_crunch').length, recs, want: [cur.gid, spr.gid, bea.gid], buoy: brec && brec.data });
        R('a beacon beside the track (its body clear of the tower\'s) is left standing', by.state === 'beacon' && S.items.includes(by), { state: by.state });
        R('a ghost in its way waits for its owner\'s word (not crushed by this screen\'s tower)', ghostLive && gh.state === 'beacon', { ghostLive, state: gh.state });
        const c1 = cues.length;
        S.netGhost(owner, [2, 66006, 2]); step(0.05);
        R('…[2, gid, 2] arrives: gone, with the crunch', gh.state === 'dead' && cues.slice(c1).some((c) => c.name === 'device_crunch'), { state: gh.state });
        // the deck: everything set down on it rode along
        const drift = (d, o) => r2(d.pos.clone().sub(T.pos).distanceTo(o));
        const deckRes = { mine: { alive: dMine.state === 'mine', drift: drift(dMine, offs.mine) }, beacon: { alive: dBea.state === 'beacon', drift: drift(dBea, offs.beacon) }, sprinkler: { alive: dSpr.state === 'spray', drift: drift(dSpr, offs.sprinkler) },
          curtain: { alive: dCur.state === 'curtain', drift: drift(dCur, offs.curtain) }, buoy: { alive: dBu.phase === 'live', drift: drift(dBu, offs.buoy) } };
        const r4 = [dMine, dBea, dSpr].map((d) => recs4(d.gid).map((x) => x[5]));
        R(`devices on its deck ride it ${moved} m and are never crushed: a Lurk Mine and a Hop Beacon laid on it, a sprinkler stuck to its pillar, a Drip Curtain dropped on it, a buoy set down on it`,
          Object.values(deckRes).every((r) => r.alive && r.drift < 0.05) && deckSet.mine === 'tower' && deckSet.beacon === 'tower' && deckSet.sprinkler === 'tower-pillar' && deckSet.curtain === 'tower' && deckSet.buoy === 'tower', { deckRes, on: deckSet });
        R('…the owner says where each sits ([4, gid, …, \'tower\' / \'tower-pillar\', …]); a ghost of the mine built from its records rides the deck with it', r4[0][0] === 'tower' && r4[1][0] === 'tower' && r4[2][0] === 'tower-pillar' && gdrift < 0.05, { records: r4, ghostDrift: r2(gdrift) });
        hook = null;
        const tr = tripAt(dMine, owner);
        R(`…the mine on the deck trips for a foe who comes up onto it there, and blows there (${tr.off} m from it, ${r2(moved)} m from where it was laid)`, tr.tripped && tr.off < 0.4, tr);
        // the Lurk Mine that lay in its way
        F.feed();
        const gpm = ghostOf(pm), lat = Math.abs(pm.pos.clone().sub(P(way.mine)).dot(side(way.mine))), mfl = Math.abs(pm.pos.y - L.groundHeight(pm.pos.x, pm.pos.z, pm.pos.y + 0.05)) < 0.05 && !pm.on;
        const mtr = pm.state === 'mine' ? tripAt(pm, me) : null;
        R(`a Lurk Mine lying in its way is pushed aside, out of its path (${r2(lat)} m off its line, laid ${0.5} m off), never inside it (frames inside: ${mIn}, its ghost ${gmIn}), and lies on the floor there still armed (a foe trips it there), its ghost with it`,
          mIn === 0 && gmIn === 0 && lat >= TOWER_R + 0.25 && mfl && !!gpm && gpm.pos.distanceTo(pm.pos) < 0.08 && mtr && mtr.tripped && mtr.off < 0.4 && !ev.some((e) => e.kind === 'mine'),
          { from: v2(mAt), at: v2(pm.pos), lat: r2(lat), inside: mIn, ghostInside: gmIn, floor: mfl, ghost: gpm && v2(gpm.pos), trip: mtr, recs: recs4(pm.gid) });
      } finally { T._rules = rules0; netOff(); hook = null; }

      // BOTS IN TOWER COMMAND (the tower's own rules: a rider on it pushes it): every role keeps its task — a rider shoots
      // enemy devices from the deck only and never steps off for one out of its reach; any other role (an escort …) never
      // walks off its route for one either: an enemy beacon past its reach (but inside what a free bot notices) is left
      // alone; one in reach is shot down from where the task has it
      {
        reset();
        const X = foe, Y = foes.find((f) => f !== X) || foe2;
        X.setWeapon('shooter'); X.ink = PLAYER.inkMax; unstub(X);
        const reach = weaponRange(WEAPONS.shooter) * 0.95, notice = Math.max(reach * 1.25, 10);
        X.pos.set(T.pos.x + 0.6, T.top + 0.05, T.pos.z + 0.6); X.vel.set(0, 0, 0);
        step(1.5, () => { X.ink = PLAYER.inkMax; });
        const role = X.bot.tRole;
        // a spot off to the side of the track at distance k from p, on the floor and in sight of the deck
        const at2 = (q) => T.path.at(q, V(0, 0, 0)), dirAt2 = (q) => { const a = at2(q - 0.3), b = at2(q + 0.3); return V(b.x - a.x, 0, b.z - a.z).normalize(); };
        // (a spot k m from p, on the floor, in sight from p's eye, at least 3.5 m off the track: the side of the track first)
        const offTrack = (p, k) => { const dd = dirAt2(T.s), a0 = Math.atan2(dd.z, -dd.x);
          for (let i = 0; i < 24; i++) { const ang = a0 + (i % 2 ? -1 : 1) * Math.ceil(i / 2) * (Math.PI / 12) + (i === 0 ? 0 : 0); for (const sg of i === 0 ? [1, -1] : [1]) {
            const q = V(p.x + Math.sin(ang) * sg * k, 0, p.z + Math.cos(ang) * sg * k); const gy = G.level.groundHeight(q.x, q.z, 3); if (gy === -Infinity || Math.abs(gy) > 0.3) continue; q.y = gy;
            let clear = true; for (let u = -20; u <= 20 && clear; u += 1) { const t = at2(T.s + u); if (Math.hypot(t.x - q.x, t.z - q.z) < 3.5) clear = false; }
            if (clear && G.physics.los(V(p.x, p.y + 1.1, p.z), V(q.x, q.y + 0.4, q.z))) return q; } }
          return null; };
        const far = offTrack(X.pos, (reach + notice) / 2);
        const bFar = far ? mk.beacon(me, far.x, far.z) : null;
        put(me, HOME, 0);
        const p0 = DB.DEV_BOT.picks + DB.DEV_BOT.repicks;
        let onT = 0, n = 0, minFar = 99;
        step(4, () => { X.ink = PLAYER.inkMax; n++; if (T.riderList?.includes(X)) onT++; if (bFar) minFar = Math.min(minFar, Math.hypot(X.pos.x - bFar.pos.x, X.pos.z - bFar.pos.z)); });
        const pickedFar = DB.DEV_BOT.picks + DB.DEV_BOT.repicks - p0;
        // …then one in its reach, beside the track
        const nearAt = offTrack(X.pos, reach * 0.6), bNear = nearAt ? mk.beacon(me, nearAt.x, nearAt.z) : null;
        let onT2 = 0, n2 = 0;
        const s2 = step(10, () => { X.ink = PLAYER.inkMax; n2++; if (T.riderList?.includes(X)) onT2++; return !!bNear && !gone(bNear); });
        const rres = { role, far: bFar && r2(Math.hypot(X.pos.x - bFar.pos.x, X.pos.z - bFar.pos.z)), reach: r2(reach), notice: r2(notice), pickedFar, onDeck: `${onT}/${n}`, near: bNear && { gone: gone(bNear), s: r2(s2 / 60) }, onDeck2: `${onT2}/${n2}` };
        stub(X);   // (it stays on the deck: the rider)
        R(`Tower Command: a rider shoots enemy devices from the deck only — one beside the track past its reach is left alone (${pickedFar} picks; it stayed on ${onT} of ${n} frames), one in reach is shot down from the deck (${rres.near && rres.near.gone ? rres.near.s + ' s' : 'not'}; on ${onT2} of ${n2} frames)`,
          role === 'ride' && !!bFar && pickedFar === 0 && onT >= n - 2 && !!bNear && gone(bNear) && onT2 >= n2 - 2, rres);
        // a bot with another role, off the tower: a beacon past its reach, inside what a free bot would notice
        S.clear(); P.clear(); G.paint.clear();
        Y.setWeapon('shooter'); Y.ink = PLAYER.inkMax; unstub(Y);
        const ys = offTrack(V(T.pos.x, T.top, T.pos.z), 4);
        if (ys) put(Y, ys, 0);
        step(1, () => { Y.ink = PLAYER.inkMax; });
        const yRole = Y.bot.tRole;
        const yFar = offTrack(V(Y.pos.x, Y.pos.y, Y.pos.z), (reach + notice) / 2);
        const yb = yFar ? mk.beacon(me, yFar.x, yFar.z) : null;
        put(me, HOME, 0);
        const q0 = DB.DEV_BOT.picks + DB.DEV_BOT.repicks, w0 = DB.DEV_BOT.walkSecs;
        let inReachT = 0, pickedOut = 0, onYb = 0;
        step(5, () => { Y.ink = PLAYER.inkMax; if (!yb || gone(yb)) return; const dd = Math.hypot(Y.pos.x - yb.pos.x, Y.pos.z - yb.pos.z); if (dd < reach - 0.3) inReachT += DT; const on = Y.bot.sp._dev?.obj === yb; if (on) onYb++; if (on && dd > reach + 0.3) pickedOut++; });
        const yres = { role: yRole, beacon: !!yb, framesOnIt: onYb, framesOnItOutOfReach: pickedOut, sInReach: r2(inReachT), walkSecs: r2(DB.DEV_BOT.walkSecs - w0), picks: DB.DEV_BOT.picks + DB.DEV_BOT.repicks - q0 };
        stub(Y); Y.setWeapon(weapons0.get(Y)); X.setWeapon(weapons0.get(X)); parkAll();
        R(`Tower Command: a bot with another role (${yRole}) never walks off its task for a device — an enemy beacon past its reach (inside what a free bot notices) is left alone (frames on it out of reach: ${pickedOut}; device walking ${yres.walkSecs} s)`,
          !!yb && yRole && yRole !== 'ride' && pickedOut === 0 && yres.walkSecs === 0, yres);
      }
    }

    // ============================================================================================ Calamari's railcars
    // MAP=calamari: a sprinkler stuck to a railcar's flank and a Drip Curtain dropped on its roof ride it the whole way
    // (the ghosts from the owner's records too). (A Lurk Mine or a Hop Beacon can't be laid on a railcar: its roof is
    // off-limits — nothing is planted on one, as before: the platform, the tower and the pods carry those.)
    if (want('rail') && m.movers) {
      reset(); netOn();
      try {
        const M = m.movers, Tt = M.T, car = M.cars[0], L = G.level, F = feeder(foe);
        m.duration = 99999;
        const setClock = (t) => { m.time = m.duration - t; frame(); };
        setClock(Tt.first - 0.8); step(2 / 60);
        const perp = V(-car.u.z, 0, car.u.x);
        // its flank facing the open side (nothing between the throw and it)
        let sgn = 1, from = null;
        for (const sg of [1, -1]) { const f = car.pos.clone().addScaledVector(perp, sg * (car.wid / 2 + 0.9)).addScaledVector(car.u, 1.5); f.y = car.pos.y + car.ht * 0.6; const h = G.physics.segment(f, f.clone().addScaledVector(perp, -sg * 1.2), new Hit()); if (h.hit && h.block === car.block.id) { sgn = sg; from = f; break; } }
        const spr = from ? throwG(me, SUBS.sprinkler, from, perp.clone().multiplyScalar(-sgn * 12).setY(1.4), F) : null;
        const cur = throwG(me, SUBS.curtain, V(car.pos.x - car.u.x * 2, car.pos.y + car.ht + 1.2, car.pos.z - car.u.z * 2), V(perp.x * 0.2, -5, perp.z * 0.2), F);
        step(0.5, () => { F.feed(); }); F.feed();
        const on = { sprinkler: spr && spr.on && spr.on.b === car.block, curtain: cur.on && cur.on.b === car.block, face: spr && spr.on ? [spr.on.k, spr.on.s] : null };
        const o0 = { spr: spr && spr.pos.clone().sub(car.pos), cur: cur.pos.clone().sub(car.pos) };
        hook = hold([spr, cur]);
        let worst = 0, gworst = 0;
        const p0 = car.pos.clone();
        step(Tt.move + 1.2, () => { F.feed(); if (spr) worst = Math.max(worst, spr.pos.clone().sub(car.pos).distanceTo(o0.spr)); worst = Math.max(worst, cur.pos.clone().sub(car.pos).distanceTo(o0.cur));
          for (const d of [spr, cur]) { if (!d) continue; const g1 = ghostOf(d); gworst = Math.max(gworst, g1 ? g1.pos.distanceTo(d.pos) : 99); } });
        hook = null;
        const went = r2(car.pos.distanceTo(p0));
        R(`a railcar: a sprinkler stuck to its flank and a Drip Curtain dropped on its roof ride it the ${went} m to its other stop (worst drift ${r2(worst)} m), and so do their ghosts (${r2(gworst)} m)`,
          !!spr && on.sprinkler && on.curtain && went > 10 && worst < 0.05 && gworst < 0.05 && spr.state === 'spray' && cur.state === 'curtain', { on, went, worst: r2(worst), ghost: r2(gworst), rec: recs4(cur.gid)[0] });
      } finally { netOff(); hook = null; }
      // a Lurk Mine and a railcar: one can't be laid on its roof (off-limits, as before); one lying on the trackbed in its
      // way is pushed out of it as it comes (the buoy's rule, as players are: never inside the car), stays on the floor,
      // armed (a foe trips it where it ends up), and its ghost goes with it (the owner's word [4, gid, x, y, z])
      reset(); netOn();
      try {
        const M = m.movers, Tt = M.T, car = M.cars[0], L = G.level, F = feeder(foe);
        m.duration = 99999;
        const setClock = (t) => { m.time = m.duration - t; frame(); };
        setClock(Tt.first - 0.8); step(2 / 60);
        const perp = V(-car.u.z, 0, car.u.x);
        const lay = (p) => { put(me, p, 0); me.pos.y = p.y + 0.02; step(2 / 60); const n0 = S.items.length; S._place(me, SUBS.mine); const it = S.items.length > n0 ? S.items[S.items.length - 1] : null; if (it) F.ids.add(it.gid); put(me, HOME, 0); return it; };
        const roofAt = car.pos.clone().addScaledVector(car.u, car.len * 0.25); roofAt.y = car.pos.y + car.ht;
        const onRoof = lay(roofAt);
        const at = car.pos.clone().addScaledVector(car.u, car.len / 2 + 2.5).addScaledVector(perp, 0.4);
        at.y = L.groundHeight(at.x, at.z, car.pos.y + 0.5);
        const mn = lay(at);
        step(0.3, () => { F.feed(); }); F.feed();
        const p0 = car.pos.clone(), m0 = mn ? mn.pos.clone() : null;
        let inside = 0, gworst = 0;
        step(Tt.move + 1.2, () => { F.feed(); if (!mn) return; if (L.pointInBlock(car.block, _vIn.set(mn.pos.x, mn.pos.y + 0.1, mn.pos.z), -0.05)) inside++; const g1 = ghostOf(mn); if (g1) gworst = Math.max(gworst, g1.pos.distanceTo(mn.pos)); });
        step(0.4, () => { F.feed(); }); F.feed();
        const went = r2(car.pos.distanceTo(p0)), g1 = mn && ghostOf(mn);
        const floor = mn && Math.abs(mn.pos.y - L.groundHeight(mn.pos.x, mn.pos.z, mn.pos.y + 0.05)) < 0.05 && !mn.on;
        const clear = mn && !L.pointInBlock(car.block, _vIn.set(mn.pos.x, mn.pos.y + 0.1, mn.pos.z), 0.25);
        const tr = mn && mn.state === 'mine' ? tripAt(mn, foe) : null;
        R(`a railcar: a Lurk Mine can't be laid on its roof; one lying on the trackbed in its way is pushed out of it as it comes (${went} m; the mine moved ${mn && m0 ? r2(Math.hypot(mn.pos.x - m0.x, mn.pos.z - m0.z)) : '?'} m) — never inside it — and lies on the floor, still armed (a foe trips it there), its ghost with it (${g1 ? r2(g1.pos.distanceTo(mn.pos)) : '?'} m)`,
          !onRoof && !!mn && went > 10 && inside === 0 && floor && clear && !!g1 && g1.pos.distanceTo(mn.pos) < 0.08 && tr && tr.tripped && tr.off < 0.4,
          { onRoof: !!onRoof, from: m0 && v2(m0), at: mn && v2(mn.pos), went, inside, floor, clear, ghostEnd: g1 && r2(g1.pos.distanceTo(mn.pos)), ghostWorst: r2(gworst), recs: mn ? recs4(mn.gid).slice(-2) : null, trip: tr });
      } finally { netOff(); hook = null; }
    }

    // ============================================================================================ a grown pod (MAP=podbox)
    // a Lurk Mine lying in a bramble wall's trough is lifted onto its top as it grows (never left inside it); one laid on
    // the grown wall's top rides it; both ride the top down as it wilts and, when the wall has gone, lie on the floor
    // where it stood — still armed: a foe trips one there
    if (want('hedge') && m.pods) {
      reset(); netOn();
      try {
        const Pd = m.pods, L = G.level, F = feeder(foe);
        m.duration = 99999; m.time = m.duration - Pd.t;
        const setClock = (t) => { m.time = m.duration - t; step(1 / 60); };
        const p = Pd.pods.find((q) => q.kind === 'wall' && q.id === 'gate') || Pd.pods.find((q) => q.kind === 'wall');
        const along = (k, y) => V(p.x + k * p.c, y, p.z - k * p.s);
        const layAt = (k, y) => { const q = along(k, y); put(me, q, 0); me.pos.y = y + 0.02; step(2 / 60); S._place(me, SUBS.mine); const it = S.items.filter((x) => x.owner === me && x.kind === 'mine' && x.state !== 'dead').pop(); F.ids.add(it.gid); return it; };
        // in the trough, beside the bulb (1.6 m along the wall)
        const fy0 = L.groundHeight(along(1.6, 0).x, along(1.6, 0).z, 3);
        const mA = layAt(1.6, fy0);
        put(me, HOME, 0); step(0.1, () => { F.feed(); }); F.feed();
        Pd.grow(p, me.team, Pd.t);
        let inside = 0;
        step(Pd.T.grow + 0.4, () => { F.feed(); for (const q of p.parts) if (q.blk.solid && L.pointInBlock(q.blk, _vIn.set(mA.pos.x, mA.pos.y + 0.1, mA.pos.z), -0.05)) inside++; });
        const tb = p.topPart.blk, ty = tb.center.y + tb.half.y;
        const liftedA = !!(mA.on && p.parts.some((q) => q.blk === mA.on.b)) && Math.abs(mA.pos.y - ty) < 0.05;
        const outA = !mA.on && !p.parts.some((q) => q.blk.solid && L.pointInBlock(q.blk, _vIn.set(mA.pos.x, mA.pos.y + 0.1, mA.pos.z), 0.25)) && Math.abs(mA.pos.y - L.groundHeight(mA.pos.x, mA.pos.z, mA.pos.y + 0.05)) < 0.05;
        const ghA = ghostOf(mA);
        R(`a grown pod: a Lurk Mine lying in a bramble wall's trough where it grows ends up ${liftedA ? 'on its top, riding it' : 'shoved out of its way, on the floor beside it'} — never inside it (nor its ghost)`,
          (liftedA || outA) && inside === 0 && mA.state === 'mine' && ghA && ghA.pos.distanceTo(mA.pos) < 0.08, { from: v2(along(1.6, fy0)), at: v2(mA.pos), top: r2(ty), inside, on: mA.on && mA.on.b.tag, ghost: ghA && v2(ghA.pos), recs: recs4(mA.gid) });
        const mB = layAt(-1.6, ty);
        put(me, HOME, 0);
        step(0.2, () => { F.feed(); }); F.feed();
        const onTop = !!(mB.on && p.parts.some((q) => q.blk === mB.on.b)), y0 = r2(mB.pos.y);
        let rode = 0, gworst = 0;
        setClock(p.wiltAt - 0.05);
        step(Pd.T.wilt + 0.6, () => { F.feed(); if (mB.on) rode = Math.max(rode, y0 - mB.pos.y); for (const d of [mA, mB]) { const g1 = ghostOf(d); gworst = Math.max(gworst, g1 ? g1.pos.distanceTo(d.pos) : 99); } });
        const fl = (d) => { const fy = L.groundHeight(d.pos.x, d.pos.z, d.pos.y + 0.05); return d.state === 'mine' && Math.abs(d.pos.y - fy) < 0.05 && !d.on; };
        R(`…a Lurk Mine laid on its top (${y0} m) rides it down as it wilts (${r2(rode)} m); once it has gone both lie on the floor where it stood (their ghosts with them)`,
          onTop && rode > 0.5 && fl(mA) && fl(mB) && gworst < 0.08, { onTop, y0, rode: r2(rode), A: v2(mA.pos), B: v2(mB.pos), ghost: r2(gworst), recs: recs4(mB.gid) });
        const tr = tripAt(mB, foe);
        R('…still armed there: a foe trips it and it blows there', tr.tripped && tr.off < 0.4, tr);
      } finally { netOff(); hook = null; }
    }
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 900)); }
  return out;
})();
