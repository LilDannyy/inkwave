// [b5-zipcheer] The Zipline buffs and the Cheer Orb rework (batch 5, 2026-10-04; src/game/specials.js IMPL.zipcaster /
// IMPL.booyah, src/game/sp-cheer.js, src/ui/hud-cheer.js, actor.js's ink and pin hooks) on testbox (a flat deck, top y 0;
// a 4 m wall at x 14…15, z −8…8), the bots scripted (no brains) except in 'bots':
//   zipdmg    damage taken is 25 % while travelling along a zip, 100 % before it, clinging after it and once it's over
//   zipspeed  zip travel at 33 m/s (1.5 × the old 22): a long zip timed frame by frame
//   zipink    every ink cost while the Zipline runs is 0.7 × (a shooter's shots, a charger's full charge, a dualies roll);
//             a shot that needs a little more ink than you have but no more than 0.7 × fires during it, not after
//   lift      the Cheer Orb lifts its user ~2.2 m over its lift time and holds them there: no moving, jumping or swimming
//             (turning and aiming yes); thrown → down they come; a splat / the special ending lets go too; under a low
//             ceiling it lifts less (the kid and the orb fit under it); started on a moving block it hangs over the same
//             spot of it as the block moves; held up, a ground cue under it (a drop shadow and a ring on the ground, a
//             light column up past its feet), gone once it's back down
//   prompt    a teammate charging an orb: the big bottom-middle cheer prompt on your HUD (its name, its charge, the key —
//             C, or the d-pad's up once you're on a pad), much bigger than the hint line; never for an enemy's orb or
//             your own; CHARGED! once full; gone once thrown; its name tag over its orb, not on it
//   cheer     your cheer: a wisp flies from you to the orb (charge +0.12 as it arrives, not before) and one into your
//             gauge on the HUD (+4 % of a full gauge as it lands, not before); one cheer per 0.4 s; none to a full orb,
//             an enemy's, your own; no gauge wisp with your gauge full or your own special running; a "Yeah!" bubble
//             either way
//   sounds    the new sounds (orb_lift, cheer_wisp, cheer_orb, cheer_gain) ride the cue bus (SFX_GROUPS.Specials, isCue)
//   bots      bot teammates cheer a charging orb (with brains); a bot using it stays up where it rose and throws it
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=zipdmg,zipspeed,zipink,lift,prompt,cheer,sounds,bots'; MODE=tower: the 'tower' part (a rider using it on the deck)
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, dbg = g.debug;
  const THREE = await import('three');
  const { SPECIALS, PLAYER, WEAPONS } = await import('./src/config.js');
  const ZC = (await import('./src/game/sp-cheer.js')).ZC_STATS;
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const TOWER = m.mode === 'tower';   // (MODE=tower: only the 'tower' part, unless asked)
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1] || (TOWER ? 'tower' : null);
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const ZD = SPECIALS.zipcaster, BD = SPECIALS.booyah;
  dbg.freeze();
  const frame = () => { g._skipRender = true; g._frame(1 / 60); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  const brains = new Map();
  for (const a of m.actors) if (a.bot) { brains.set(a, a.bot.update); a.bot.update = () => { zero(a); if (a._go) { if (a._go.move) a.intent.move.copy(a._go.move); a.intent.fire = !!a._go.fire; a.intent.squid = !!a._go.squid; a.intent.jump = !!a._go.jump; a.intent.sub = !!a._go.sub; } }; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const place = (a, x, z, y = 0.02) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; };
  const park = (a, i) => place(a, -24 + (i % 4) * 2, 36 + Math.floor(i / 4) * 2);
  const reset = () => {
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); G.paint.clear();
    for (const a of m.actors) { if (!a.alive) a.respawn(); if (a.specialActive) G.specials.end(a, 'swap'); a.specialActive = null; a.superJumpState = null; a.character.setVisible?.(true);   /* (a Zipline ended by hand jumps its user back: not here) */ a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a._go = null; a.status.shield = 0; a._cheerT = -9; }
    m.actors.forEach(park);
    step(0.1);
  };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z; a.yaw = a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(p.y - (a.pos.y + 1.2), Math.hypot(dx, dz)); a.aimPoint.copy(p); };
  // (a scripted bot's intent is rewritten from _go every frame: press through it)
  const press = (a, k) => { if (a.bot) { const was = a._go; a._go = { ...(was || {}), [k]: true }; frame(); a._go = was; } else { a.intent[k] = true; frame(); a.intent[k] = false; } };
  const [E1, E2] = foes, [M1, M2, M3] = mates;
  const saved = [PLAYER.inkRefillKid, PLAYER.inkRefillSwim];
  // (every splat in the test, for the record: a kill card for the local player from one shows up in the HUD checks)
  const splatLog = []; const offSplat = on('splatted', (e) => splatLog.push(`${e.victim?.name || '?'} by ${e.attacker?.name || '-'}${e.attacker === me ? ' (you)' : ''} ${e.cause || ''} @${r2(G.time)}`));

  // ======================================================================================== Zipline: damage while zipping
  if (want('zipdmg')) {
    reset();
    place(M1, 2, 0); place(E1, -6, -14); step(0.1);
    const s = start(M1, 'zipcaster');
    const hit = () => { M1.hp = PLAYER.hp; M1.invuln = 0; G.projectiles.applyHit(E1, M1, 40, 'shooter'); return r2(PLAYER.hp - M1.hp); };
    const before = hit();
    aimAt(M1, V(14, 1.4, 0)); press(M1, 'sub');
    let mid = null, frames = 0;
    step(1, () => { frames++; if (s.zip && frames === 4) { mid = hit(); } return !!s.zip || frames < 3; });
    const zipped = mid !== null;
    step(0.05);
    const cling = s.hang > 0 ? hit() : null;
    G.specials.end(M1, 'test'); step(0.05);
    const after = hit();
    R('zipdmg: a hit while travelling along a zip takes 25 % (10 of 40); before the zip, clinging after it and once the special is over: all of it',
      zipped && Math.abs(mid - 10) < 0.01 && Math.abs(before - 40) < 0.01 && cling !== null && Math.abs(cling - 40) < 0.01 && Math.abs(after - 40) < 0.01,
      { before, midZip: mid, clinging: cling, after, zipDamage: ZD.zipDamage });
    // a blast mid-zip too (every damage source goes through actor.damage → specials.filterDamage)
    reset(); place(M1, 2, 0); step(0.1); const s2 = start(M1, 'zipcaster'); aimAt(M1, V(14, 1.4, 0)); press(M1, 'sub');
    let blastLost = null; step(0.5, (i) => { if (s2.zip && i === 2) { M1.hp = PLAYER.hp; M1.invuln = 0; M1.damage(80, E1, 'bomb'); blastLost = r2(PLAYER.hp - M1.hp); } return !!s2.zip; });
    R('zipdmg: a bomb\'s 80 mid-zip comes to 20', blastLost !== null && Math.abs(blastLost - 20) < 0.01, { lost: blastLost });
  }

  // ======================================================================================== Zipline: speed
  if (want('zipspeed')) {
    reset();
    place(M1, -6, 0); step(0.1);
    const s = start(M1, 'zipcaster');
    aimAt(M1, V(14, 1.4, 0)); const p0 = M1.pos.clone();
    press(M1, 'sub');
    const to = s.zip && s.zip.to.clone();
    let n = 1, mid = [];   // (the press frame moved it already)
    step(2, () => { if (s.zip) { n++; mid.push(M1.pos.x); return true; } return false; });
    const dist = to ? Math.hypot(to.x - p0.x, to.y - p0.y, to.z - p0.z) : 0, t = n / 60, v = dist / t;
    // its steady speed: the travel between two frames well inside the zip
    const steady = mid.length > 4 ? (mid[3] - mid[2]) * 60 : 0;
    R('zipspeed: zips travel at 33 m/s — 1.5 × the old 22 (a ~19.5 m zip in ~0.6 s; the frame-to-frame step 0.55 m)',
      ZD.speed === 33 && Math.abs(ZD.speed / 22 - 1.5) < 1e-9 && Math.abs(steady - 33) < 0.6 && v > 30 && v < 36 && !!to,
      { dist: r2(dist), frames: n, avg: r2(v), steady: r2(steady) });
    // the frame's travel cut in pieces: the zip still stops at an enemy in its path (not through them) at this speed
    reset(); place(M1, -6, 0); place(E1, 3, 0); step(0.1);
    const s2 = start(M1, 'zipcaster'); aimAt(M1, V(14, 1.4, 0)); press(M1, 'sub');
    step(1, () => !!s2.zip);
    R('zipspeed: an enemy in the way still stops the zip at them (it slams in, never passes through)', M1.pos.x < E1.pos.x && Math.abs(M1.pos.x - E1.pos.x) < 1.4, { zipper: r2(M1.pos.x), enemy: E1.pos.x });
  }

  // ======================================================================================== Zipline: ink
  if (want('zipink')) {
    PLAYER.inkRefillKid = 0; PLAYER.inkRefillSwim = 0;
    const spend = (a, wpn, zip, act) => {
      reset(); a.setWeapon(wpn); place(a, 0, -6); aimAt(a, V(0, 1, 10)); step(0.1);
      if (zip) start(a, 'zipcaster');
      a.ink = PLAYER.inkMax; step(0.05); a.ink = PLAYER.inkMax;
      act(a);
      const used = PLAYER.inkMax - a.ink;
      if (zip) G.specials.end(a, 'test');
      return used;
    };
    const fireFor = (s) => (a) => { a._go = { fire: true }; step(s); a._go = null; step(0.05); };
    const sh0 = spend(M1, 'shooter', false, fireFor(1.0)), sh1 = spend(M1, 'shooter', true, fireFor(1.0));
    const chargeShot = (a) => { a._go = { fire: true }; step(WEAPONS.charger.chargeTime + 0.4); a._go = null; step(0.15); };
    const ch0 = spend(M1, 'charger', false, chargeShot), ch1 = spend(M1, 'charger', true, chargeShot);
    R('zipink: a shooter\'s shots cost 0.7 × while the Zipline runs (1 s of fire)', sh0 > 5 && Math.abs(sh1 / sh0 - 0.7) < 0.03, { off: r2(sh0), on: r2(sh1), ratio: r3(sh1 / sh0) });
    R('zipink: a charger\'s full charge costs 0.7 ×', ch0 > 5 && Math.abs(ch1 / ch0 - 0.7) < 0.03, { off: r2(ch0), on: r2(ch1), ratio: r3(ch1 / ch0) });
    // a dualies dodge roll (the jump press while firing and moving: weaponRunner.tryDodge, before the weapon runs)
    const roll = (a) => { a._go = { fire: true, move: V(1, 0, 0) }; step(0.1); a._go = { fire: true, move: V(1, 0, 0), jump: true }; step(1 / 60); a._go = { fire: false, move: V(1, 0, 0) }; step(1 / 60); a._go = null; };
    const W2 = WEAPONS.twins || WEAPONS.dualies, dk = W2 ? (WEAPONS.twins ? 'twins' : 'dualies') : null;
    if (dk) {
      const rollCost = (zip) => { let c = 0; spend(M1, dk, zip, (a) => { a._go = { fire: true, move: V(1, 0, 0) }; step(0.15); const i0 = a.ink; roll(a); c = i0 - a.ink; }); return c; };
      const r0 = rollCost(false), r1 = rollCost(true);
      R(`zipink: a ${dk} dodge roll costs 0.7 × (the roll's ink, apart from the shots round it)`, r0 > 1 && r1 / r0 < 0.8 && r1 / r0 > 0.6, { off: r2(r0), on: r2(r1), ratio: r3(r1 / r0) });
    }
    // the threshold: ink for 0.8 of a shot — it fires during the Zipline (0.7 of one), not after
    const W = WEAPONS.shooter, thr = (zip) => { let used = 0; spend(M1, 'shooter', zip, (a) => { a.ink = W.inkPerShot * 0.8; const i0 = a.ink; a._go = { fire: true }; step(0.08); a._go = null; used = i0 - a.ink; }); return used; };
    const t1 = thr(true), t0 = thr(false);
    R('zipink: with ink for 0.8 of a shot, a shot fires during the Zipline (it costs 0.7 of one) and not without it',
      Math.abs(t1 - W.inkPerShot * 0.7) < 0.01 && t0 < 1e-6, { during: r3(t1), without: r3(t0), shot: W.inkPerShot });
    M1.setWeapon('shooter');
    PLAYER.inkRefillKid = saved[0]; PLAYER.inkRefillSwim = saved[1];
  }

  // ======================================================================================== Cheer Orb: the lift
  if (want('lift')) {
    reset();
    place(M1, 0, -6); step(0.2);
    const y0 = M1.pos.y, x0 = M1.pos.x, z0 = M1.pos.z;
    const s = start(M1, 'booyah');
    const ys = []; step(BD.liftTime + 0.15, () => { ys.push(M1.pos.y - y0); });
    const up = M1.pos.y - y0;
    R('lift: up 2.2 m over its lift time (an ease-out, no overshoot), held there (special.pin)', s.pin && Math.abs(up - BD.lift) < 0.07 && ys[Math.round(BD.liftTime * 30)] > BD.lift * 0.6 && Math.max(...ys) < BD.lift + 0.07 && !M1.grounded,
      { up: r2(up), half: r2(ys[Math.round(BD.liftTime * 30)]), max: r2(Math.max(...ys)) });
    // the ground cue under it (sp-cheer.js cue, from IMPL.booyah.tick — every screen's: net-zipcheer checks a ghost's): on
    // the deck right under it a ring, and a light column from the deck up to its feet
    const cueFrame = () => {
      const fx = G.fx, got = { pillar: [], mark: [] }, oP = fx.pillar, oM = fx.mark;
      fx.pillar = function (p, c, r, h, al) { got.pillar.push({ x: p.x, y: p.y, z: p.z, r, h, al }); return oP.apply(this, arguments); };
      fx.mark = function (p, n, c, r, st, al) { got.mark.push({ x: p.x, y: p.y, z: p.z, r, st, al, dark: Math.max(c.r, c.g, c.b) < 0.1 }); return oM.apply(this, arguments); };
      try { frame(); } finally { delete fx.pillar; delete fx.mark; }
      const under = (q) => Math.hypot(q.x - M1.pos.x, q.z - M1.pos.z) < 0.02, onDeck = (q) => under(q) && Math.abs(q.y - y0) < 0.1;
      return { col: got.pillar.find(under), ring: got.mark.find((q) => onDeck(q) && !q.dark && q.r >= 0.9 && q.al > 0.5), shadow: got.mark.find((q) => onDeck(q) && q.dark && q.al > 0.3) };
    };
    const cu = cueFrame(), gapNow = M1.pos.y - y0;
    R('lift: held up, it has a ground cue — on the deck right under it a dark drop shadow and a bright ring, and a light column from the deck up past its feet',
      !!s.cue && Math.abs(s.cue.gap - gapNow) < 0.03 && !!cu.col && Math.abs(cu.col.y - y0) < 0.1 && cu.col.h > gapNow * 1.2 && cu.col.h < gapNow * 2 && cu.col.al > 0.3 && !!cu.ring && !!cu.shadow,
      { gap: s.cue && r2(s.cue.gap), column: cu.col && { y: r2(cu.col.y), h: r2(cu.col.h), alpha: r2(cu.col.al) }, ring: cu.ring && { y: r2(cu.ring.y), r: r2(cu.ring.r) }, shadow: cu.shadow && { r: r2(cu.shadow.r), alpha: r2(cu.shadow.al) } });
    // no walking, jumping or swimming up there
    M1._go = { move: V(1, 0, 0.3) }; step(0.6);
    const dxz = Math.hypot(M1.pos.x - x0, M1.pos.z - z0);
    M1._go = { jump: true }; step(0.3); M1._go = { squid: true }; step(0.3); M1._go = null; step(0.1);
    const dy = Math.abs(M1.pos.y - y0 - BD.lift);
    R('lift: stuck up there — walking, jumping and swimming move it nowhere, it stays a kid', dxz < 0.02 && dy < 0.07 && M1.form === 'kid' && M1.specialActive === s, { moved: r3(dxz), offHeight: r3(dy), form: M1.form });
    // turning and aiming still work
    M1.aimYaw = Math.PI / 2; step(0.5);
    R('lift: it still turns to its aim up there', Math.abs(Math.atan2(Math.sin(M1.yaw - Math.PI / 2), Math.cos(M1.yaw - Math.PI / 2))) < 0.1, { yaw: r2(M1.yaw) });
    // thrown → down it comes
    s.charge = 1; step(0.1); M1.intent.fire = true; M1._go = { fire: true }; frame(); M1._go = null; frame();
    const thrown = !M1.specialActive && s.thrown && !s.pin;
    step(1.4);
    R('lift: throwing the orb lets go — it drops back to the deck', thrown && M1.grounded && Math.abs(M1.pos.y - y0) < 0.05 && G.specials.world.some((w) => w.kind === 'orb'), { thrown, y: r2(M1.pos.y - y0), grounded: M1.grounded });
    const cuAfter = cueFrame();
    R('lift: back on the deck, its ground cue is gone', thrown && !cuAfter.col && !cuAfter.ring && !cuAfter.shadow, { column: !!cuAfter.col, ring: !!cuAfter.ring, shadow: !!cuAfter.shadow });
    // the special ending otherwise (a splat; a swap) lets go too
    reset(); place(M1, 0, -6); step(0.2); let s2 = start(M1, 'booyah'); step(1);
    G.specials.end(M1, 'swap'); step(1.2);
    const swapDown = !s2.pin && M1.grounded && M1.pos.y < 0.1;
    reset(); place(M1, 0, -6); step(0.2); s2 = start(M1, 'booyah'); step(1);
    const held0 = ZC.splatHeld; M1.splat(E1, 'shooter'); step(0.05);
    R('lift: the special ending (a loadout swap) lets go and it drops; splatted up there: let go, counted', swapDown && !s2.pin && !M1.specialActive && ZC.splatHeld === held0 + 1, { swapDown, splatHeld: ZC.splatHeld - held0 });
    // used mid-jump (1.2 m up): it rises only to 2.2 m over the ground, never higher; a hit up there: all of it (today's
    // damage rule kept: heldDamage 1), the what-if lever (heldDamage 0.5) halves it
    reset(); place(M1, 0, -6, 1.22); M1.grounded = false; M1.vel.set(0, 0, 0);
    const sj = start(M1, 'booyah'); step(BD.liftTime + 0.15);
    const jumpUp = M1.pos.y;
    const hitHeld = () => { M1.hp = PLAYER.hp; M1.invuln = 0; G.projectiles.applyHit(E1, M1, 40, 'shooter'); return r2(PLAYER.hp - M1.hp); };
    const full = hitHeld(); BD.heldDamage = 0.5; const half = hitHeld(); BD.heldDamage = 1;
    G.specials.end(M1, 'test'); step(0.8);
    R('lift: used mid-jump it rises to 2.2 m over the ground (not 2.2 m over the jump); a hit held up takes all of it (heldDamage 1: today\'s rule), 0.5 halves it',
      sj.lift && Math.abs(jumpUp - BD.lift) < 0.07 && Math.abs(sj.lift.H - (BD.lift - 1.22)) < 0.05 && full === 40 && half === 20, { up: r2(jumpUp), H: sj.lift && r2(sj.lift.H), full, half });
    // under a low ceiling: only as high as the kid and its orb fit
    reset();
    const lv = G.level;
    const ceil = lv.addDynamic({ min: [0, 0, 0], max: [1, 1, 1] }); lv.moveDynamic(ceil, V(-10, 3.2, -14), V(2, 0.2, 2));
    place(M1, -10, -14); step(0.2);
    const s3 = start(M1, 'booyah'); step(BD.liftTime + 0.2);
    const lowUp = M1.pos.y;
    // the orb at its biggest (full, just cheered: the pulse) must still clear the ceiling's underside (y 3.0)
    s3.charge = 1; s3.cheered = 0.35; step(1 / 60);
    const orbTop = s3.ball.position.y + s3.halo.scale.x;
    G.specials.end(M1, 'test'); step(0.6);
    R('lift: under a low ceiling (its underside 3 m up) it lifts only as far as leaves room for the kid and its orb, full and pulsing, never into it',
      s3.lift && lowUp > 0.15 && lowUp < 0.45 && orbTop < 3.0 && orbTop > 2.3, { up: r2(lowUp), H: s3.lift && r2(s3.lift.H), orbTop: r2(orbTop) });
    // on a moving block: it hangs over the same spot of it as it moves
    const plat = lv.addDynamic({ min: [0, 0, 0], max: [1, 1, 1] }); lv.moveDynamic(plat, V(8, 0.5, 20), V(2, 0.5, 2));
    place(M1, 8.5, 20, 1.02); step(0.3);
    const onPlat = M1.grounded && M1.ground.block === plat.id;
    const s4 = start(M1, 'booyah'); step(BD.liftTime + 0.1);
    const pre = M1.pos.clone();
    step(1.0, (i) => { lv.moveDynamic(plat, V(8 + (i + 1) * 3 / 60, 0.5 + (i + 1) * 0.5 / 60, 20), V(2, 0.5, 2)); });
    const moved = M1.pos.clone().sub(pre);
    R('lift: started on a moving block it rides along over the same spot (the block went +3 m x, +0.5 m up)', onPlat && s4.pin && Math.abs(moved.x - 3) < 0.08 && Math.abs(moved.y - 0.5) < 0.1 && Math.abs(moved.z) < 0.05,
      { onPlat, moved: [r2(moved.x), r2(moved.y), r2(moved.z)] });
    G.specials.end(M1, 'test');
    lv.clearDynamic();
    step(0.6);
    // the old way still there for a what-if: lift 0 = walking slowly with it
    reset(); BD.lift = 0; place(M1, 0, -6); step(0.2);
    const s5 = start(M1, 'booyah'); const xa = M1.pos.x; M1._go = { move: V(1, 0, 0) }; step(1); M1._go = null;
    BD.lift = 2.2;
    R('lift: (lift 0 — the old way, for an A/B: it walks slowly at moveSpeed, no lift)', !s5.pin && M1.pos.x - xa > 1 && M1.pos.x - xa < 2.2 && M1.pos.y < 0.1, { walked: r2(M1.pos.x - xa) });
    G.specials.end(M1, 'test');
  }

  // ======================================================================================== the cheer prompt (HUD)
  if (want('prompt')) {
    reset();
    const C = G.hud.cheer, P = C.el, pill = G.hud.promptEl;
    place(me, 0, -10); place(M1, 4, -2); place(E1, -4, 6); step(0.2);
    const off0 = C.state().on;
    const s = start(M1, 'booyah'); step(0.3);
    await new Promise((res) => setTimeout(res, 600));   // (its fade / grow-in is a CSS transition: real time)
    const st = C.state(), r = P.getBoundingClientRect(), W = innerWidth, H = innerHeight, pr = pill.getBoundingClientRect();
    const ks = P.querySelector('.iw-cheerp__key').getBoundingClientRect();
    R('prompt: a teammate charging a Cheer Orb → the cheer prompt on your HUD, bottom middle, its name and charge, key C',
      !off0 && st.on && st.name === M1.name && st.key === 'C' && st.charge > 0 && Math.abs((r.left + r.right) / 2 - W / 2) < 3 && r.top > H * 0.6 && r.bottom < H - 10 && getComputedStyle(P).opacity > 0.5,
      { on: st.on, name: st.name, charge: r2(st.charge), box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], screen: [W, H], text: P.textContent });
    R('prompt: it\'s big — at least twice the hint line\'s height, a keycap a few times the hint\'s font', r.height >= pr.height * 2 && ks.height >= 2.4 * parseFloat(getComputedStyle(pill).fontSize), { prompt: Math.round(r.height), hint: Math.round(pr.height), key: Math.round(ks.height) });
    // the pad: the d-pad's up arrow
    const ld = G.input.lastDevice; G.input.lastDevice = 'pad'; step(0.05);
    const padKey = C.state().key, svg = !!P.querySelector('.iw-cheerp__key svg');
    G.input.lastDevice = ld || 'kbd'; step(0.05);
    R('prompt: on a pad it shows the d-pad\'s up (the pad\'s cheer button)', padKey === 'dpad-up' && svg && C.state().key === 'C', { padKey });
    // full → CHARGED!; thrown → gone
    s.charge = 1; step(0.1);
    const full = C.state().full && /CHARGED/.test(P.textContent);
    s.charge = 1; M1._go = { fire: true }; step(0.1); M1._go = null; step(0.1);
    R('prompt: CHARGED! once full; gone once it\'s thrown', full && !C.state().on && !P.classList.contains('is-on'), { full, after: C.state().on });
    // an enemy's orb, or your own: no prompt
    reset(); place(me, 0, -10); place(E1, -4, 6); step(0.1); start(E1, 'booyah'); step(0.3);
    const enemy = C.state().on;
    reset(); place(me, 0, -10); step(0.1); start(me, 'booyah'); step(0.3);
    const own = C.state().on, ownLine = G.specials.prompt(me);
    G.specials.end(me, 'test');
    R('prompt: never for the other team\'s orb, nor for your own (you get your own hint line)', !enemy && !own && /Charging|Charged/.test(ownLine || ''), { enemy, own, ownLine });
    // the teammate's name tag (main.js's ally markers) sits over its orb, never on it — the orb, where the cheer wisps
    // fly, stays in view (the orb at its biggest: full, just cheered); the old anchor (head + 0.45 m) was inside it
    reset(); place(me, 0, -16); place(M1, 0, -5); step(0.1);
    const sT = start(M1, 'booyah');
    const look = () => { me.yaw = me.aimYaw = 0; me.aimPitch = 0.1; if (g.rig) { g.rig.yaw = 0; g.rig.pitch = 0.1; } };
    step(BD.liftTime + 0.4, look);
    sT.charge = 1; sT.cheered = 0.35; step(2 / 60, look);
    const proj = (p) => { const v = p.clone().project(G.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, z: v.z }; };
    const mk = G.hud.markers.find((el) => el._name === M1.name && el.style.display !== 'none');
    const tr = mk && /translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/.exec(mk.style.transform);
    let tagBottom = null, orbTop = null, orbC = null, oldAnchor = null;
    if (mk && tr && sT.ball) {
      const tagR = mk.querySelector('.iw-mk__tag').getBoundingClientRect(), mkR = mk.getBoundingClientRect();
      tagBottom = +tr[2] + (tagR.bottom - mkR.top) + 6;   // (its little arrow under it: 6 px)
      orbTop = proj(sT.ball.position.clone().setY(sT.ball.position.y + sT.halo.scale.y));
      orbC = proj(sT.ball.position);
      const hd = new THREE.Vector3(); M1.character.getHeadPosition(hd); oldAnchor = proj(hd.setY(hd.y + 0.45));
    }
    R('prompt: your teammate\'s name tag sits over its Cheer Orb, not on it (the old spot, head + 0.45 m, was inside the orb)',
      !!mk && !mk.classList.contains('is-off') && orbC && orbC.z < 1 && orbC.y > 0 && orbC.y < innerHeight && tagBottom <= orbTop.y + 1 && oldAnchor.y > orbTop.y + 3,
      { tagBottomY: tagBottom && Math.round(tagBottom), orbTopY: orbTop && Math.round(orbTop.y), orbCentreY: orbC && Math.round(orbC.y), oldAnchorY: oldAnchor && Math.round(oldAnchor.y) });
    G.specials.end(M1, 'test');
    // (fix round 2) the hint line under it (hud.js .iw-prompt — its font is floored at 13.5 px, so on a small window it
    // doesn't shrink with --u): the prompt stands on top of it, never on it — at this window's size and at 960×600's and
    // 1280×720's --u (9.6 / 12.8 px: set on the HUD, the window "resized"), with the low-ink hint and the special-ready
    // one (main.js's own), and a taller one with a keycap in it; with no hint it's back where it was. The rare "… Super
    // Jump cancelled" note (hud.js jumpNote, normally at 7.6 u — inside the prompt) goes over the prompt meanwhile
    reset(); place(me, 0, -10); place(M1, 4, -2); place(E1, -4, 6); step(0.1);
    const sH = start(M1, 'booyah'); step(0.2);
    const hudEl = G.hud.el, sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const updP = G.hud._updPrompt;
    const box = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    // (kill / assist cards — hud.js: they hide the hint and lift the prompt 3.4 u — are their own case, 'cards': a card
    // from something earlier in the test still up is noted (strayCards) and cleared first)
    const clearCards = () => { const k = [...G.hud.kcards.children].map((c) => c.textContent); for (const c of [...G.hud.kcards.children]) { clearTimeout(c._t); c.remove(); } hudEl.classList.remove('has-cards'); return k; };
    const hintCase = async (u, how) => {
      if (u) hudEl.style.setProperty('--u', u); else hudEl.style.removeProperty('--u');
      C.L.vw = -1;   // (the window "resized": re-measure)
      sH.charge = 0.3; me.ink = PLAYER.inkMax; me.special = 0; g._lowInkFlash = 0; g._hints.specialT = 0; g._hints.shot = true; G.hud._updPrompt = updP;   // (shot: no start-of-match tutorial hint)
      if (how === 'lowink' || how === 'cards') me.ink = PLAYER.inkMax * 0.12;
      if (how === 'ready') { me.special = me.specialCost(); g._hints.specialT = 2.5; }
      if (how === 'keycap') G.hud._updPrompt = function () { return updP.call(this, 'Hold [SHIFT] to swim in your ink and refill'); };
      step(0.1);
      const stray = clearCards();
      if (how === 'cards') { G.hud._killCard(E1, 'kill'); G.hud._killCard(E2, 'assist'); }
      frame();
      await sleep(how === 'cards' ? 650 : 500);   // (the hint's grow-in, the prompt's move, a card's pop-in: real time)
      const r = P.getBoundingClientRect(), hr = pill.getBoundingClientRect(), hintOn = !pill.classList.contains('is-out') && getComputedStyle(pill).opacity > 0.5;
      const res = { u: u || 'window', how, hint: G.hud._L.prompt, over: C.state().overHint, gap: Math.round(hr.top - r.bottom), prompt: box(P), hintBox: box(pill), bottom: Math.round(innerHeight - r.bottom) };
      if (stray.length) res.strayCards = stray;
      if (how === 'cards') { const top = G.hud.kcards.firstChild; res.card = top && box(top); res.cardGap = top ? Math.round(top.getBoundingClientRect().top - r.bottom) : null; }
      G.hud.jumpNote('Beakon gone — Super Jump cancelled'); await sleep(450);
      const jr = G.hud.jnote.getBoundingClientRect(); res.note = box(G.hud.jnote); res.noteGap = Math.round(r.top - jr.bottom);
      G.hud.jnote.classList.remove('is-on');
      if (how === 'cards') clearCards();
      const uPx = u ? parseFloat(u) : Math.min(innerWidth / 100, innerHeight * 1.7778 / 100);
      res.ok = C.state().on && res.noteGap >= 4 && jr.top > innerHeight * 0.3 && r.top > innerHeight * 0.5 && (
        how === 'none' ? !hintOn && !res.over && Math.abs(res.bottom - 5.2 * uPx) < 2
        : how === 'cards' ? !hintOn && !res.over && res.cardGap >= 4   // (the hint hidden under the cards; the prompt over the top card)
        : hintOn && res.over && res.gap >= 4);
      return res;
    };
    const hc = [];
    for (const u of [null, '9.6px', '12.8px']) for (const how of ['lowink', 'ready', 'keycap', 'none', 'cards']) hc.push(await hintCase(u, how));
    hudEl.style.removeProperty('--u'); C.L.vw = -1; G.hud._updPrompt = updP; me.ink = PLAYER.inkMax; me.special = 0; g._hints.specialT = 0; step(0.05);
    const hb = hc.filter((x) => !x.ok);
    R('prompt: a hint line showing (low ink, special ready, one with a keycap) — the cheer prompt stands on top of it (≥ 4 px clear) at this window\'s size, 960×600\'s and 1280×720\'s; no hint, back down at 5.2 u; kill cards up: the hint hidden, the prompt over the cards; a "Super Jump cancelled" note over it, not on it',
      hb.length === 0 && hc.filter((x) => x.how === 'lowink').every((x) => /SHIFT/.test(x.hint || '')) && hc.filter((x) => x.how === 'ready').every((x) => /Special ready/.test(x.hint || '')),
      { bad: hb, gaps: hc.map((x) => `${x.u}/${x.how}: ${x.how === 'none' ? 'bottom ' + x.bottom : x.how === 'cards' ? 'card gap ' + x.cardGap : 'gap ' + x.gap + ' (hint ' + (x.hintBox[3] - x.hintBox[1]) + ' px high)'}, note ${x.noteGap}`),
        strayCards: hc.filter((x) => x.strayCards).map((x) => `${x.u}/${x.how}: ${x.strayCards.join(' | ')}`), splats: splatLog.slice(-6) });
    G.specials.end(M1, 'test');
  }

  // ======================================================================================== the cheer: wisps, charge, gauge
  if (want('cheer')) {
    reset();
    place(me, 0, -10); place(M1, 5, -3); place(E1, -14, 20); step(0.2);
    const s = start(M1, 'booyah'); step(BD.liftTime + 0.2);
    const cost = me.specialCost(); me.special = cost * 0.5;
    const c0 = s.charge, sp0 = me.special;
    const orbW = () => G.specials.world.filter((w) => w.kind === 'cheerwisp');
    const gaugeW = () => G.cheerOrb.gauge.filter((w) => w.owner === me);
    const cheers0 = G.specials.cheers.length;
    me.intent.cheer = true; frame();
    const ow = orbW()[0], gw = gaugeW()[0];
    R('cheer: one press sends a wisp to the orb and one into your gauge, and a "Yeah!" bubble', !!ow && ow.owner === me && ow.to === M1 && !!gw && G.specials.cheers.length === cheers0 + 1,
      { orbWisps: orbW().length, gaugeWisps: gaugeW().length });
    // fly: the wisp closes on the orb; the charge only jumps as it arrives (by cheer = 0.12 on top of its own climb)
    const dists = [], charges = [], hudOn = [], hudXY = [];
    let arrived = -1, gained = -1, f = 0;
    const spGauge = G.hud.sp.getBoundingClientRect(), gx = spGauge.left + spGauge.width / 2, gy = spGauge.top + spGauge.height / 2;
    step(1.2, () => {
      f++;
      if (ow && !ow.dead && G.specials.world.includes(ow)) dists.push(ow.pos.distanceTo(s.ball.position));
      else if (arrived < 0) arrived = f;
      charges.push(s.charge);
      if (gained < 0 && me.special > sp0 + 0.01) gained = f;
      const hs = G.hud.cheer.state(); hudOn.push(hs.wisps);
      const head = G.hud.cheer.wisps[0].firstChild; if (hs.wisps) { const b = head.getBoundingClientRect(); hudXY.push(Math.hypot(b.left + b.width / 2 - gx, b.top + b.height / 2 - gy)); }
    });
    const expect = (i) => c0 + (i + 1) / 60 / BD.charge;   // its own climb, frame by frame
    const before = arrived > 1 ? charges[arrived - 2] - expect(arrived - 2) : null, after = arrived > 0 ? charges[arrived] - expect(arrived) : null;
    R('cheer: the orb wisp closes on the orb and arrives in ~cheerFly s; only then the orb gains 0.12 (on top of its own charging)',
      dists.length > 10 && dists[dists.length - 1] < dists[0] * 0.3 && Math.abs(before) < 0.01 && Math.abs(after - BD.cheer) < 0.01 && arrived / 60 > BD.cheerFly * 0.75 && arrived / 60 < BD.cheerFly * 1.7,
      { arrivedS: r2(arrived / 60), dist0: dists.length && r2(dists[0]), distEnd: dists.length && r2(dists[dists.length - 1]), extraBefore: before !== null && r3(before), extraAfter: after !== null && r3(after) });
    const gain = me.special - sp0;
    R('cheer: your gauge gains 4 % of a full gauge as its wisp lands (cheerGaugeFly s), not before; the HUD wisp flies up into the gauge meanwhile',
      Math.abs(gain - BD.cheerGain * cost) < 0.01 && Math.abs(gained / 60 - BD.cheerGaugeFly) < 0.05 && hudOn.slice(2, Math.round(BD.cheerGaugeFly * 60) - 2).every((n) => n === 1) && hudOn[hudOn.length - 1] === 0 && hudXY.length > 10 && hudXY[hudXY.length - 1] < hudXY[0] * 0.35 && G.hud.cheer.state().gains >= 1,
      { gain: r2(gain), pct: r3(gain / cost), landedS: r2(gained / 60), hudFrames: hudOn.filter((n) => n).length, hudDist: [Math.round(hudXY[0] || 0), Math.round(hudXY[hudXY.length - 1] || 0)] });
    // rate: one cheer per 0.4 s
    const n0 = ZC.cheers; me.intent.cheer = true; frame(); me.intent.cheer = true; frame(); step(0.2); me.intent.cheer = true; frame(); step(0.3); me.intent.cheer = true; frame();
    R('cheer: one cheer per 0.4 s (mashing does no more)', ZC.cheers - n0 === 2, { cheers: ZC.cheers - n0 });
    step(1.0);
    // gauge full: the orb wisp, no gauge wisp; your own special running: likewise
    s.charge = 0.2; me._cheerT = -9; me.special = cost; me.intent.cheer = true; frame();
    const fullG = gaugeW().length, fullO = orbW().length;
    step(1.0); s.charge = 0.2; me._cheerT = -9; me.special = cost; start(me, 'bubbler'); step(0.05); me.intent.cheer = true; frame();
    const ownSpG = gaugeW().length, ownSpO = orbW().length;
    G.specials.end(me, 'test'); step(1.0);
    R('cheer: with your gauge full or your own special running: the orb still gets its wisp, your gauge none', fullG === 0 && fullO === 1 && ownSpG === 0 && ownSpO === 1, { fullG, fullO, ownSpG, ownSpO });
    // a full orb, an enemy's, your own: no wisps (just the "Yeah!")
    s.charge = 1; step(0.05); me._cheerT = -9; me.special = 0; const b0 = G.specials.cheers.length; me.intent.cheer = true; frame();
    const fullOrb = orbW().length + gaugeW().length, bub = G.specials.cheers.length - b0;
    reset(); place(me, 0, -10); place(E1, 4, -3); step(0.1); start(E1, 'booyah'); step(0.5); me.intent.cheer = true; frame();
    const enemyOrb = orbW().length + gaugeW().length;
    reset(); place(me, 0, -10); step(0.1); const so = start(me, 'booyah'); step(0.5); const co = so.charge; me.intent.cheer = true; frame(); step(0.6);
    const ownOrb = orbW().length + gaugeW().length, ownGain = so.charge - co - 0.6 / BD.charge;
    R('cheer: a full orb, an enemy\'s orb, your own orb: no wisps, no charge (a "Yeah!" all the same)', fullOrb === 0 && bub === 1 && enemyOrb === 0 && ownOrb === 0 && Math.abs(ownGain) < 0.02, { fullOrb, bubble: bub, enemyOrb, ownOrb, ownExtra: r3(ownGain) });
    G.specials.end(me, 'test');
    // two teammates charging: a wisp to each
    reset(); place(me, 0, -10); place(M1, 5, -3); place(M2, -5, -3); step(0.1); start(M1, 'booyah'); start(M2, 'booyah'); step(0.5);
    me.intent.cheer = true; frame();
    const both = orbW().map((w) => w.to);
    step(1);
    R('cheer: two teammates charging orbs: a wisp to each, both charged', both.length === 2 && both.includes(M1) && both.includes(M2), { to: both.map((a) => a.name) });
  }

  // ======================================================================================== sounds (fix round 1)
  // the four new sounds ride the cue bus like every special's (docs/EVENTS.md: listed in SFX_GROUPS.Specials → isCue):
  // the Cues slider and +6 dB with the rest, not 6 dB under the "Yeah!"
  if (want('sounds')) {
    const AU = await import('./src/audio/audio.js');
    const names = ['orb_lift', 'cheer_wisp', 'cheer_orb', 'cheer_gain'];
    const st = names.map((n) => ({ n, def: !!AU.SFX[n], group: AU.SFX_GROUPS.Specials.includes(n), cue: AU.isCue(n) }));
    R('sounds: the Cheer Orb\'s lift / wisp / orb / gain sounds are defined, in the Specials group and on the cue bus (as booyah_cheer is)',
      st.every((x) => x.def && x.group && x.cue) && AU.isCue('booyah_cheer'), st);
  }

  // ======================================================================================== bots
  // (fix round 2: when a bot cheers is a roll — bots.js, ~1.3 a second — so a fixed 2.5 s window made the count vary and
  // the check flaky. Now: step until EACH bot has cheered once (cap 10 s), switch that bot off at its cheer — one cheer
  // each, an exact count — let every wisp land, then require exactly that many arrivals and +0.12 a wisp. The orb's own
  // climb is slowed meanwhile so a late cheer never lands on a full orb.)
  if (want('bots')) {
    reset();
    for (const a of [M1, M2]) { a.bot._wasDead = false; a.bot.update = brains.get(a); }   // (no respawn super jump away on the first tick)
    place(me, 0, -12); place(M1, 4, -16); place(M2, -4, -16); step(0.2);
    const charge0 = BD.charge; BD.charge = 60;
    const s = start(me, 'booyah');
    const first = new Map(); let helps = 0, arrived = 0, n = 0;
    const offC = on('actor:cheer', (e) => {
      if (!e.helped || (e.actor !== M1 && e.actor !== M2)) return;
      helps++;
      if (!first.has(e.actor)) { first.set(e.actor, r2(n / 60)); const b = e.actor; b.bot.update = () => { zero(b); }; }
    });
    const offW = on('cheer:orb', (e) => { if (e.target === me) arrived++; });
    const c0 = s.charge;
    step(10, () => { n++; return first.size < 2; });
    const nCheer = n; step(1.2, () => { n++; });   // (the last wisps land: cheerFly × ≤ 1.6 s)
    const extra = s.charge - c0 - n / 60 / BD.charge;
    offC(); offW(); BD.charge = charge0;
    R('bots: each bot teammate cheers a charging orb (within 10 s; one cheer each, then it\'s switched off) — every cheer\'s wisp reaches the orb and adds 0.12',
      first.size === 2 && helps === 2 && arrived === 2 && Math.abs(extra - 2 * BD.cheer) < 0.01 && s.charge < 1 && me.specialActive === s,
      { firstCheerS: [...first].map(([a, t]) => `${a.name} ${t}`), helps, arrived, extra: r3(extra), steppedS: r2(nCheer / 60) });
    G.specials.end(me, 'test');
    for (const a of [M1, M2]) a.bot.update = () => { zero(a); };
    // a bot using it in a fight: stays where it rose, throws it once charged
    reset();
    M1.bot._wasDead = E1.bot._wasDead = false; M1.bot.update = brains.get(M1); E1.bot.update = brains.get(E1);
    place(M1, 0, -12); place(E1, 0, 4); M1.invuln = 99; E1.invuln = 99; step(0.1);
    const s2 = start(M1, 'booyah'); const p0 = M1.pos.clone();
    let maxMove = 0, threw = false;
    step(BD.charge + BD.autoThrow + 0.5, () => { if (M1.specialActive === s2) maxMove = Math.max(maxMove, Math.hypot(M1.pos.x - p0.x, M1.pos.z - p0.z)); if (s2.thrown) { threw = true; return false; } });
    R('bots: a bot with the orb stays up where it rose (no walking off) and throws it once charged', threw && maxMove < 0.02, { threw, maxMove: r3(maxMove) });
    for (const a of [M1, E1]) a.bot.update = () => { zero(a); };
  }

  // ======================================================================================== Tower Command (MODE=tower)
  if (TOWER && want('tower') && m.tower) {
    reset();
    const T = m.tower;
    const onTop = (a) => { a.pos.set(T.pos.x - 0.6, T.top + 0.05, T.pos.z - 0.6); a.vel.set(0, 0, 0); a.grounded = false; };
    onTop(M1); step(0.6);
    const moving0 = T.moving, rode0 = T.riderList.includes(M1);
    const s = start(M1, 'booyah'); step(BD.liftTime + 0.2);
    const off0 = V(M1.pos.x - T.pos.x, M1.pos.y - T.top, M1.pos.z - T.pos.z), s0 = T.s;
    let drift = 0, riding = 0, n = 0;
    step(3, () => { n++; if (T.riderList.includes(M1)) riding++; drift = Math.max(drift, Math.hypot(M1.pos.x - T.pos.x - off0.x, M1.pos.y - T.top - off0.y, M1.pos.z - T.pos.z - off0.z)); });
    R('tower: a rider using a Cheer Orb on the deck hangs 2.2 m over it, still counts as riding (the tower keeps going) and rides along over the same spot',
      rode0 && moving0 !== 0 && s.pin && Math.abs(off0.y - BD.lift) < 0.15 && riding === n && Math.abs(T.s - s0) > 1 && drift < 0.12,
      { rode0, up: r2(off0.y), ridingFrames: `${riding}/${n}`, towerMoved: r2(Math.abs(T.s - s0)), drift: r2(drift) });
    G.specials.end(M1, 'test'); step(1.2);
    R('tower: thrown / ended, it drops back onto the deck', M1.grounded && Math.abs(M1.pos.y - T.top) < 0.1, { dy: r2(M1.pos.y - T.top) });
  }

  for (const [a] of brains) a.bot.update = brains.get(a);
  PLAYER.inkRefillKid = saved[0]; PLAYER.inkRefillSwim = saved[1];
  offSplat();
  return out;
})();
