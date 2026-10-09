// int1 (batch 5, wave 1's integration, [b5-int1]): where the six wave-1 packages meet — each scene uses two or more of
// them at once, on the merged code. testbox (a flat deck, top y 0, x ±28 / z ±40; a 4 m wall x 14…15, z −8…8), the
// bots scripted (no brains):
//   survive   deploy × sprules: a Surf N' Turf buoy outlives its splatted owner (still pulsing) and enemy fire still
//             wears it down and destroys it; the splatted owner's Hop Beacon too
//   crush     (MODE=tower) deploy × sprules: the owner splatted, its buoy on the track is still crushed by the moving
//             tower (and its sprinkler there too)
//   ride      (MODE=tower) deploy × zipcheer: a Lurk Mine laid on the deck rides the moving tower while a teammate held
//             up by a Cheer Orb hangs over the same spot of the deck — still a rider — and both stay with the tower
//   zip       zipcheer × jumpui: the Zipline's return mark stands at the take-off point from the first frame and stays
//             there through a 33 m/s zip; its countdown only runs down and says when the jump home lands; the user
//             lands on it; the mark goes
//   jump      zipcheer × jumpui: a super jump to a teammate held up by a Cheer Orb lands on the floor beside them (not
//             up in the air where they hang: actor.jumpAnchor), and its landing mark stands on the floor too
//   barrage   sprules × deploy: the Waddle Bomb Barrage's and the Mystery Bomb Barrage's bombs wear enemy devices down
//             (a sprinkler, a beacon) and leave your own team's alone; an enemy barrage's Waddle can be shot down
//   chain     sprules × sprules: a Bubble Guard passed down a chain, then its user splatted mid-special — the user's
//             gauge keeps ½ of what was left; every copy runs on with its time; a copy can still be passed on; a
//             receiver splatted (no special running) keeps ½ of what it had, as ever
//   roll      tuning × holds: the roller rolls at its new 6.5 m/s (faster than the 6.0 walk), both hands on it every
//             rolling frame, the drum square to the path
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/int1.js tools/botlab/run.sh tools/botlab/page.cjs   (survive, zip, jump,
//   barrage, chain, roll) · MODE=tower (crush, ride) · PAGE_ARGS='only=survive,zip,…'
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, dbg = g.debug;
  const THREE = await import('three');
  const { SPECIALS, PLAYER, SUBS, WEAPONS } = await import('./src/config.js');
  const SURF = await import('./src/game/sp-surf.js');
  const JM = await import('./src/game/jumpMarks.js');
  const CH = await import('./src/game/sp-bubble.js');
  const { GRIP_HOLE_L } = await import('./src/game/character-weapons.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const crash = (name, e) => { R(`${name}: the scene threw`, false, String(e && e.stack || e).slice(0, 400)); try { reset(); } catch (e2) { /* */ } };
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const TOWER = m.mode === 'tower' && !!m.tower;
  const want = (k) => (!ONLY || ONLY.split(',').includes(k)) && (['crush', 'ride'].includes(k) ? TOWER : !TOWER);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  dbg.freeze();
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const [E1, E2, E3] = foes, [M1, M2, M3] = mates;
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  const stub = (a) => { if (a.bot) { if (!a.bot._u0) a.bot._u0 = a.bot.update; a.bot.update = () => { zero(a); if (a._go) { if (a._go.move) a.intent.move.copy(a._go.move); a.intent.fire = !!a._go.fire; a.intent.sub = !!a._go.sub; } }; } };
  for (const a of m.actors) stub(a);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = G.subs, P = G.projectiles;
  const place = (a, x, z, y = 0.02) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; a.netTp = (a.netTp || 0) + 1; };
  const park = (a, i) => place(a, -24 + (i % 4) * 2, 36 + Math.floor(i / 4) * 2);
  const aim = (a, yaw, pitch = 0) => { a.yaw = a.aimYaw = yaw; a.aimPitch = pitch; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = pitch; } };
  const weapons0 = new Map(m.actors.map((a) => [a, a.weaponId]));
  const reset = () => {
    hook = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear(); P.clear(); S.clear(); G.paint.clear();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a._go = null; a.status.shield = 0; a._shieldChain = null;
      a.form = 'kid'; a.superJumpState = null; stub(a); a.character.root.visible = true;
      if (a.weaponId !== weapons0.get(a)) a.setWeapon(weapons0.get(a));
    }
    m.actors.forEach(park);
    step(0.1);
  };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const kept = (a) => r3(a.special / a.specialCost());
  const shoot = (a, from, to, dmg = 36) => P.fireCustom(a, from, to.clone().sub(from).normalize(), { speed: 40, damage: dmg, range: 40, grav: 0, drag: 0, straight: 99, radius: 0.3 });
  const chestOf = (a) => V(a.pos.x, a.pos.y + 0.9, a.pos.z);
  const DOWN = V(0, -1, 0);
  const ground = (x, z, y = 3) => G.physics.raycast(V(x, y, z), DOWN, y + 3);
  const beacon = (o, x, z) => { const gh = ground(x, z); return S._plant(o, SUBS.beacon, gh.point.clone(), gh.normal.clone(), 0, gh, false); };
  const sprinkler = (o, x, z) => { const it = S._throw(o, SUBS.sprinkler, V(x, 0.7, z), V(0, -6, 0), false); step(1, () => it.state === 'fly'); return it; };
  const gone = (d) => (d.kind === 'surf' ? d.dead || d.phase !== 'live' : d.state === 'dead' || !S.items.includes(d));
  const hpOf = (d) => (gone(d) ? 0 : d.hp);
  const EV = []; for (const n of ['device:hit', 'device:down']) on(n, (e) => EV.push({ n, kind: e.kind, how: e.how, by: e.attacker || e.by || null, team: e.team, dmg: e.damage, t: G.time }));
  const LANDS = []; on('superjump:land', (e) => LANDS.push({ a: e.actor, t: G.time, pos: e.pos.clone() }));
  // a thrown special / sub through the real input path
  const press = (a, k) => { const was = a._go; a._go = { ...(was || {}), [k]: true }; frame(); a._go = was; frame(); };
  // the buoy a Surf N' Turf throw sets down (the user thrown it at its feet, aim pitch p)
  const throwBuoy = (a, pitch = -1.2) => {
    aim(a, a.yaw, pitch);
    const s = start(a, 'surf'); step(0.3); SURF.IMPL.throwIt(a, s);
    let b = null; step(3, () => { b = G.specials.world.find((w) => w.kind === 'surf' && w.owner === a); if (b && b.phase !== 'fly') return false; });
    return b;
  };

  // ======================================================================================== survive (turf)
  if (want('survive')) try {
    reset();
    place(E1, 0, 6); aim(E1, Math.PI, 0);
    const b = throwBuoy(E1);
    const bc = beacon(E1, 3, 6);
    me.invuln = 999; hook = () => { me.hp = PLAYER.hp; me.invuln = 999; };
    const anchored = !!b && b.phase === 'live';
    E1.splat(me, 'test');
    step(0.4);
    const after = { live: !!b && !gone(b), hp: b && b.hp, ownerAlive: E1.alive, beacon: bc.state };
    // the splatted owner's buoy and beacon, shot by us from 6 m: Spritzer-size shots (36) till gone
    place(me, 0, -1); aim(me, 0);
    const e0 = EV.length, pop0 = SURF.SURF_STATS.popped;
    let nb = 0, nc = 0;
    for (let i = 0; i < 16 && b && !gone(b); i++) { shoot(me, chestOf(me), V(b.pos.x, b.pos.y + 0.6, b.pos.z)); nb++; step(0.15); }
    const bhp = [];
    for (let i = 0; i < 10 && !gone(bc); i++) { shoot(me, chestOf(me), V(bc.pos.x, bc.pos.y + 0.4, bc.pos.z)); nc++; step(0.15); bhp.push(hpOf(bc)); }
    step(0.3);
    const hits = EV.slice(e0).filter((e) => e.n === 'device:hit' && e.by === me);
    const downs = EV.slice(e0).filter((e) => e.n === 'device:down');
    R('survive: a Surf N\' Turf buoy outlives its splatted owner (still standing, still live) and so does their Hop Beacon',
      anchored && after.live && !after.ownerAlive && after.beacon === 'beacon', after);
    // (hits, not shots fired: a shot takes ~0.2 s to get there, so one more may be in the air as it goes)
    const hb = hits.filter((e) => e.kind === 'surf').length, hc = hits.filter((e) => e.kind === 'beacon').length;
    R(`survive: …and enemy fire still destroys them — the buoy in ${hb} hits of 36 (350 hp), the beacon in ${hc} (120 hp); the shooter's hits counted`,
      !!b && gone(b) && SURF.SURF_STATS.popped > pop0 && hb === Math.ceil(SPECIALS.surf.hp / 36) && gone(bc) && hc === Math.ceil(SUBS.beacon.hp / 36) && downs.some((e) => e.kind === 'beacon' && e.how === 'shot'),
      { buoyShots: nb, buoyHits: hb, beaconShots: nc, beaconHits: hc, beaconHp: bhp, hitKinds: [...new Set(hits.map((e) => e.kind))], downs: downs.map((e) => `${e.kind}:${e.how}`), popped: SURF.SURF_STATS.popped - pop0 });
  } catch (e) { crash('survive', e); }

  // ======================================================================================== the tower scenes
  const T = m.tower;
  const rules0 = T ? T._rules : null;
  let drive = 0;
  const tdrive = () => { T._rules = function () { if (drive) { this.s = Math.min(this.path.len[0] - 0.5, this.s + drive / 60); this.moving = 1; } else this.moving = 0; }; };
  const at = (s) => T.path.at(s, V(0, 0, 0));
  const dirAt = (s) => { const a = at(s - 0.3), b = at(s + 0.3); return V(b.x - a.x, 0, b.z - a.z).normalize(); };
  const deck = (lx, lz) => { const c = Math.cos(T.yaw), s = Math.sin(T.yaw); return V(T.pos.x + c * lx + s * lz, T.top, T.pos.z - s * lx + c * lz); };
  const local = (p) => { const dx = p.x - T.pos.x, dz = p.z - T.pos.z, c = Math.cos(T.yaw), s = Math.sin(T.yaw); return V(dx * c - dz * s, p.y - T.top, dx * s + dz * c); };

  // ======================================================================================== crush (tower)
  if (want('crush')) try {
    reset(); tdrive();
    const s0 = T.s;
    // E1 stands on the track 3 m ahead, facing along it, and throws its buoy a few metres on down the track; its Hop
    // Beacon goes on the track 9 m ahead (a splatted owner's sprinkler goes with them — subs.js, as ever: not this one)
    const p3 = at(s0 + 3), d3 = dirAt(s0 + 3);
    place(E1, p3.x, p3.z, p3.y + 0.02); aim(E1, Math.atan2(d3.x, d3.z), 0);
    const b = throwBuoy(E1);
    const p9 = at(s0 + 9), sp = beacon(E1, p9.x, p9.z);
    let bOn = 99; for (let u = 0; u <= 14; u += 0.1) if (b) bOn = Math.min(bOn, Math.hypot(b.pos.x - at(s0 + u).x, b.pos.z - at(s0 + u).z));
    E1.splat(me, 'test');
    park(E1, 1);
    hook = () => { if (E1.alive) park(E1, 1); };
    step(0.3);
    const liveAfter = !!b && !gone(b) && !gone(sp);
    const e0 = EV.length;
    drive = 1.5;
    let seenB = null, seenS = null;
    step(9, () => { if (seenB == null && gone(b)) seenB = r2(T.s - s0); if (seenS == null && gone(sp)) seenS = r2(T.s - s0); return !(seenB != null && seenS != null) && T.s - s0 < 11; });
    drive = 0;
    const crushed = EV.slice(e0).filter((e) => e.n === 'device:down' && e.how === 'crush').map((e) => e.kind);
    R('crush: its owner splatted, a buoy on the track still stands (it outlives them) — and the moving tower still crushes it, and the owner\'s Hop Beacon on the track',
      liveAfter && bOn < 1.0 && seenB != null && seenS != null && crushed.includes('surf') && crushed.includes('beacon'),
      { buoyOffTrack: r2(bOn), liveAfter, buoyAt: seenB, beaconAt: seenS, crushed });
  } catch (e) { crash('crush', e); } finally { if (T) T._rules = rules0; drive = 0; hook = null; }

  // ======================================================================================== ride (tower)
  if (want('ride')) try {
    reset(); tdrive();
    // M1 lays a Lurk Mine on the deck, front left; M2 stands on the deck, back right, and holds up a Cheer Orb
    const pm = deck(-0.7, 0.7); place(M1, pm.x, pm.z, T.top + 0.02); step(2 / 60); S._place(M1, SUBS.mine);
    const mine = S.items.filter((x) => x.owner === M1 && x.kind === 'mine' && x.state !== 'dead').pop();
    park(M1, 2);
    const po = deck(0.6, -0.6); place(M2, po.x, po.z, T.top + 0.02); step(0.2);
    const sOrb = start(M2, 'booyah');
    step(0.8);
    const mOff = mine && local(mine.pos), oOff = local(M2.pos);
    const s0 = T.s;
    drive = 1.5;
    let worstM = 0, worstO = 0, minLift = 9, rider = 0, n = 0;
    step(4, () => {
      n++;
      if (mine) worstM = Math.max(worstM, local(mine.pos).distanceTo(mOff));
      const lo = local(M2.pos); worstO = Math.max(worstO, Math.hypot(lo.x - oOff.x, lo.z - oOff.z)); minLift = Math.min(minLift, lo.y);
      if (T.riderList.includes(M2)) rider++;
    });
    drive = 0;
    const moved = r2(T.s - s0);
    R(`ride: a Lurk Mine laid on the deck rides the moving tower (${moved} m) on its spot, still armed`, !!mine && mine.state === 'mine' && moved > 5 && worstM < 0.05 && mine.on && mine.on.b.tag === 'tower',
      { moved, drift: r3(worstM), state: mine && mine.state, on: mine && mine.on && mine.on.b.tag });
    R('ride: …while a teammate held up by a Cheer Orb hangs over the same spot of the deck (2.2 m up), riding along and still counted as a rider every frame',
      !!sOrb && sOrb.pin && worstO < 0.08 && minLift > SPECIALS.booyah.lift - 0.2 && rider === n,
      { drift: r3(worstO), lift: r2(minLift), riderFrames: `${rider}/${n}` });
    // the orb thrown: M2 comes down onto the deck
    G.specials.end(M2, 'throw'); step(1.2);
    const lo = local(M2.pos);
    R('ride: …the orb let go, they come down onto the deck where they hung', M2.alive && Math.abs(lo.y) < 0.15 && Math.hypot(lo.x - oOff.x, lo.z - oOff.z) < 0.4, { at: [r2(lo.x), r2(lo.y), r2(lo.z)] });
  } catch (e) { crash('ride', e); } finally { if (T) T._rules = rules0; drive = 0; hook = null; }

  // ======================================================================================== zip (turf)
  if (want('zip')) try {
    reset();
    place(M1, -6, 0); aim(M1, Math.PI / 2, 0); step(0.1);
    const origin = M1.pos.clone();
    const s = start(M1, 'zipcaster');
    const mk = () => JM.landingMarks().find((r) => r.kind === 'return' && r.actor === M1) || null;
    frame();   // (the special's first frame; landingMarks() is read once a frame)
    const first = mk() && { x: mk().x, z: mk().z, left: mk().left };
    // zip to the wall (x 14): 33 m/s
    const ax = V(14, 1.4, 0), dx = ax.x - M1.pos.x;
    M1.yaw = M1.aimYaw = Math.atan2(dx, 0); M1.aimPitch = Math.atan2(1.4 - 1.2, dx); M1.aimPoint.copy(ax);
    press(M1, 'sub');
    let zipFrames = 0; step(2, () => { if (s.zip) { zipFrames++; return true; } return false; });
    const afterZip = mk() && { x: mk().x, z: mk().z }, zipEnd = M1.pos.clone();
    // end it soon (its time cut to 1.2 s from now): the countdown, read every frame, to the touchdown at the mark
    s.dur = s.t + 1.2;
    const reads = []; let t0 = G.time, pred = null;
    const l0 = LANDS.length;
    step(5, () => { const r = mk(); if (r) { reads.push(r.left); if (pred == null) pred = G.time + r.left; } return !(LANDS.length > l0 && !mk()); });
    const land = LANDS.slice(l0).find((l) => l.a === M1);
    const mono = reads.every((x, i) => !i || x <= reads[i - 1] + 0.02);
    R('zip: the Zipline\'s return mark stands at the take-off point from its first frame', !!first && Math.hypot(first.x - origin.x, first.z - origin.z) < 0.3, { first, origin: [r2(origin.x), r2(origin.z)] });
    R(`zip: …and stays there through a 33 m/s zip (${zipFrames} frames to the wall, ${r2(zipEnd.x - origin.x)} m)`, zipFrames > 0 && zipFrames < 45 && !!afterZip && Math.hypot(afterZip.x - origin.x, afterZip.z - origin.z) < 0.3 && zipEnd.x - origin.x > 15,
      { zipFrames, afterZip, at: r2(zipEnd.x) });
    R('zip: …its countdown only runs down and says when the jump home lands (within 0.3 s); the user lands on the mark; the mark goes',
      reads.length > 30 && mono && !!land && Math.abs(land.t - pred) < 0.3 && Math.hypot(land.pos.x - origin.x, land.pos.z - origin.z) < 1.2 && !mk(),
      { reads: reads.length, mono, first: r2(reads[0] || 0), last: r2(reads[reads.length - 1] || 0), predicted: pred && r2(pred - t0), landed: land && r2(land.t - t0), at: land && [r2(land.pos.x), r2(land.pos.z)] });
  } catch (e) { crash('zip', e); }

  // ======================================================================================== jump (turf)
  if (want('jump')) try {
    reset();
    place(M1, 0, 10); step(0.1);
    const sOrb = start(M1, 'booyah');
    step(0.8);
    const lift = r2(M1.pos.y);
    place(M2, 0, -10); step(0.1);
    const l0 = LANDS.length;
    const ok = M2.superJump(M1);
    step(0.1);
    const mk = JM.landingMarks().find((r) => r.kind === 'jump' && r.actor === M2);
    const markY = mk ? r2(mk.y) : null, markD = mk ? r2(Math.hypot(mk.x - M1.pos.x, mk.z - M1.pos.z)) : null;
    let peak = 0; step(4, () => { if (M2.superJumpState?.phase === 'flight') peak = Math.max(peak, M2.pos.y); return !(LANDS.length > l0); });
    const land = LANDS.slice(l0).find((l) => l.a === M2);
    step(0.3);
    R(`jump: a super jump to a teammate held up ${lift} m by a Cheer Orb lands on the floor beside them (not up in the air where they hang)`,
      ok && !!sOrb && lift > SPECIALS.booyah.lift - 0.2 && !!land && Math.abs(land.pos.y) < 0.3 && Math.hypot(land.pos.x - M1.pos.x, land.pos.z - M1.pos.z) < 1.8 && M2.grounded,
      { lift, land: land && [r2(land.pos.x), r2(land.pos.y), r2(land.pos.z)], grounded: M2.grounded, orbUser: [r2(M1.pos.x), r2(M1.pos.y), r2(M1.pos.z)] });
    R('jump: …and its landing mark stands on the floor under them while it charges (the world tag, the maps)', mk && Math.abs(markY) < 0.3 && markD < 0.5, { markY, markD });
    R('jump: …the orb user stays up, the orb still charging', !!M1.specialActive && M1.specialActive.id === 'booyah' && M1.pos.y > SPECIALS.booyah.lift - 0.2, { y: r2(M1.pos.y) });
  } catch (e) { crash('jump', e); }

  // ======================================================================================== barrage (turf)
  if (want('barrage')) try {
    // the Waddle Bomb Barrage at an enemy sprinkler by an enemy (the Waddles go after it) and a teammate's beacon
    reset();
    place(me, 0, -2); aim(me, 0, -0.5);
    place(E2, 0, 3.5); E2.invuln = 999; hook = () => { E2.hp = PLAYER.hp; E2.invuln = 999; me.hp = PLAYER.hp; };
    const spE = sprinkler(E2, 0.9, 3.8), bOwn = beacon(M1, -1.0, 3.8);
    const e0 = EV.length;
    const s = start(me, 'barrage_waddle');
    let n = 0; step(5.5, () => { if (G.time >= (s.nextThrow || 0) && n < 6 && me.specialActive === s) { press(me, 'sub'); n++; } });
    step(2);
    const hitW = EV.slice(e0).filter((e) => e.n === 'device:hit' && e.by === me);
    R(`barrage: the Waddle Bomb Barrage's Waddles (${n} thrown) wear down an enemy sprinkler (100 hp: ${hpOf(spE)} left) and leave a teammate's beacon whole (${hpOf(bOwn)} of ${SUBS.beacon.hp})`,
      n >= 3 && hpOf(spE) < SUBS.sprinkler.hp && hitW.some((e) => e.kind === 'sprinkler') && hpOf(bOwn) === SUBS.beacon.hp && bOwn.state === 'beacon',
      { thrown: n, sprinkler: hpOf(spE), beacon: hpOf(bOwn), hits: hitW.map((e) => `${e.kind}:${e.dmg}`) });
    // the Mystery Bomb Barrage at an enemy beacon 2.5 m ahead
    reset();
    place(me, 0, -2); aim(me, 0, -0.55);
    place(E2, 0, 4.5); E2.invuln = 999; hook = () => { E2.hp = PLAYER.hp; E2.invuln = 999; me.hp = PLAYER.hp; };
    const bE = beacon(E2, 0.3, 1.0), bOwn2 = beacon(M1, -1.6, 1.0);
    const e1 = EV.length, kinds = [];
    const sm = start(me, 'barrage_mystery');
    step(5.5, () => { if (me.specialActive === sm && G.time >= (sm.nextThrow || 0) && kinds.length < 8) { kinds.push(sm.bomb.kind); press(me, 'sub'); } });
    step(2);
    const hitM = EV.slice(e1).filter((e) => e.n === 'device:hit' && e.by === me && e.kind === 'beacon');
    R(`barrage: the Mystery Bomb Barrage's bombs (${kinds.join(', ')}) wear down an enemy beacon (${hpOf(bE)} of ${SUBS.beacon.hp} left) and leave a teammate's beacon whole`,
      new Set(kinds).size >= 3 && hitM.length >= 1 && hpOf(bE) < SUBS.beacon.hp && hpOf(bOwn2) === SUBS.beacon.hp,
      { kinds, beacon: hpOf(bE), own: hpOf(bOwn2), hits: hitM.map((e) => e.dmg) });
    // an enemy's barrage Waddle, shot down (the Waddle was shootable before; a barrage's too)
    reset();
    place(E1, 0, 8); aim(E1, Math.PI, -0.5);
    const se = start(E1, 'barrage_waddle');
    press(E1, 'sub'); step(0.8);
    const wd = (SUB_KITS.waddle?.items || []).find((x) => x.owner === E1 && x.state !== 'dead');
    place(me, 0, 0); me.invuln = 999; hook = () => { me.hp = PLAYER.hp; };
    let shots = 0; for (let i = 0; i < 6 && wd && wd.state !== 'dead'; i++) { shoot(me, chestOf(me), V(wd.pos.x, wd.pos.y + 0.25, wd.pos.z), 36); shots++; step(0.15); }
    R('barrage: an enemy barrage\'s Waddle can be shot down (one or two shots)', !!se && !!wd && wd.sp && wd.state === 'dead' && shots <= 2, { found: !!wd, sp: wd && wd.sp, state: wd && wd.state, shots });
  } catch (e) { crash('barrage', e); }

  // ======================================================================================== chain (turf)
  if (want('chain')) try {
    reset();
    place(me, 0, 0); place(M1, 1.2, 0); park(M2, 3); park(M3, 4);
    const s = start(me, 'bubbler');
    step(0.3);
    const m1Got = M1.status.shield > 0;
    place(M2, 2.6, 0); step(0.3);   // (from M1 by touch: 1.4 m from M1, 2.6 m from the user)
    const m2Got = M2.status.shield > 0, viaM1 = M2._shieldChain && M2._shieldChain === M1._shieldChain;
    step(0.6);
    const left = G.specials.remaining(me), share = G.specials.splatShare(me), times = [me.status.shield, M1.status.shield, M2.status.shield].map(r2);
    M1.special = 0.6 * M1.specialCost();
    me.splat(E1, 'test');
    const kMe = kept(me);
    step(0.5);
    const t1 = [M1.status.shield, M2.status.shield].map(r2);
    place(M3, 4.0, 0); step(0.3);   // (from M2 by touch, the user down)
    const m3Got = M3.status.shield > 0, t3 = r2(M3.status.shield), t2 = r2(M2.status.shield);
    M1.splat(E1, 'test');
    const kM1 = kept(M1);
    step(0.3);
    R(`chain: a Bubble Guard passed down a chain (user → M1 → M2), then its user splatted mid-special: the user\'s gauge keeps ½ of what was left (${r3(share)} → ${kMe})`,
      !!s && m1Got && m2Got && viaM1 && Math.abs(left - share) < 0.01 && share > 0.6 && Math.abs(kMe - 0.5 * share) < 0.003, { left: r3(left), share: r3(share), kept: kMe, times });
    R('chain: …every copy runs on with its own time after the user is gone, and can still be passed on (M2 → M3: the same time left)',
      t1[0] > 0 && t1[1] > 0 && Math.abs(t1[0] - (times[1] - 0.5)) < 0.1 && Math.abs(t1[1] - (times[2] - 0.5)) < 0.1 && m3Got && Math.abs(t3 - t2) < 0.05,
      { before: times, after: t1, m3: t3, m2: t2 });
    R(`chain: …a receiver splatted with no special running keeps ½ of what it had, as ever (0.6 → ${kM1}); the others' copies run on`,
      Math.abs(kM1 - 0.3) < 0.003 && M2.status.shield > 0 && M3.status.shield > 0, { kept: kM1, m2: r2(M2.status.shield), m3: r2(M3.status.shield) });
  } catch (e) { crash('chain', e); }

  // ======================================================================================== roll (turf)
  if (want('roll')) try {
    reset();
    me.setWeapon('roller'); step(0.1);
    place(me, 0, -30); aim(me, 0, -0.2);
    me._go = { move: V(0, 0, 1), fire: true };
    const ch = me.character, U = V(0, 0, 0), H = V(0, 0, 0), Gp = V(0, 0, 0), Q = new THREE.Quaternion(), X = V(0, 0, 0);
    let n = 0, vSum = 0, off = 0, worstH = 0, worstSq = 0, sqN = 0, t0 = me.stats.turf;
    step(3, (i) => {
      me.ink = PLAYER.inkMax;
      if (i < 50) return;
      const vl = Math.hypot(me.vel.x, me.vel.z);
      if (ch.wRoll < 0.9 || vl < 0.5 || me.form !== 'kid') return;
      ch.root.updateMatrixWorld(true);
      const w = ch.weapon, gl = w.def.gripL;
      Gp.copy(gl.pos); w.off.localToWorld(Gp); H.copy(GRIP_HOLE_L); ch.bones.handL.localToWorld(H);
      const d = H.distanceTo(Gp) / ch.kid.getWorldScale(U).y;
      n++; vSum += vl; worstH = Math.max(worstH, d); if (d > 0.03) off++;
      w.off.getWorldQuaternion(Q); X.set(1, 0, 0).applyQuaternion(Q);
      const sq = Math.asin(Math.min(1, Math.abs((X.x * me.vel.x + X.z * me.vel.z) / vl / Math.hypot(X.x, X.z)))) * 180 / Math.PI;
      sqN++; worstSq = Math.max(worstSq, sq);
    });
    me._go = null;
    const v = n ? vSum / n : 0, turf = r2(me.stats.turf - t0);
    R(`roll: the roller rolls at its new speed (${r2(v)} m/s; the roll ${WEAPONS.roller.rollSpeed}, walking ${PLAYER.runSpeed ?? 6}) — faster than a walk — and paints as it goes (${turf} m²)`,
      n > 60 && Math.abs(v - WEAPONS.roller.rollSpeed) < 0.35 && v > (PLAYER.runSpeed ?? 6) && turf > 20, { frames: n, speed: r2(v), turf });
    R(`roll: …held with both hands every rolling frame at that speed (off hand ≤ 3 cm from its grip: worst ${r2(worstH * 100)} cm), the drum square to the path (worst ${r2(worstSq)}°)`,
      n > 60 && off === 0 && sqN > 60 && worstSq <= 5, { frames: n, offFrames: off, worstCm: r2(worstH * 100), worstSquare: r2(worstSq) });
  } catch (e) { crash('roll', e); }

  reset();
  return out;
})();
