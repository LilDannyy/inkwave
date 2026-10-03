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
//             spot of it as the block moves
//   prompt    a teammate charging an orb: the big bottom-middle cheer prompt on your HUD (its name, its charge, the key —
//             C, or the d-pad's up once you're on a pad), much bigger than the hint line; never for an enemy's orb or
//             your own; CHARGED! once full; gone once thrown
//   cheer     your cheer: a wisp flies from you to the orb (charge +0.12 as it arrives, not before) and one into your
//             gauge on the HUD (+4 % of a full gauge as it lands, not before); one cheer per 0.4 s; none to a full orb,
//             an enemy's, your own; no gauge wisp with your gauge full or your own special running; a "Yeah!" bubble
//             either way
//   bots      bot teammates cheer a charging orb (with brains); a bot using it stays up where it rose and throws it
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=zipdmg,zipspeed,zipink,lift,prompt,cheer,bots'
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, dbg = g.debug;
  const THREE = await import('three');
  const { SPECIALS, PLAYER, WEAPONS } = await import('./src/config.js');
  const ZC = (await import('./src/game/sp-cheer.js')).ZC_STATS;
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
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
  for (const a of m.actors) if (a.bot) { brains.set(a, a.bot.update); a.bot.update = () => { zero(a); if (a._go) { if (a._go.move) a.intent.move.copy(a._go.move); a.intent.fire = !!a._go.fire; a.intent.squid = !!a._go.squid; a.intent.jump = !!a._go.jump; } }; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const place = (a, x, z, y = 0.02) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; };
  const park = (a, i) => place(a, -24 + (i % 4) * 2, 36 + Math.floor(i / 4) * 2);
  const reset = () => {
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); G.paint.clear();
    for (const a of m.actors) { if (!a.alive) a.respawn(); if (a.specialActive) G.specials.end(a, 'swap'); a.specialActive = null; a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a._go = null; a.status.shield = 0; a._cheerT = -9; }
    m.actors.forEach(park);
    step(0.1);
  };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z; a.yaw = a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(p.y - (a.pos.y + 1.2), Math.hypot(dx, dz)); a.aimPoint.copy(p); };
  const press = (a, k) => { a.intent[k] = true; frame(); a.intent[k] = false; };
  const [E1, E2] = foes, [M1, M2, M3] = mates;
  const saved = [PLAYER.inkRefillKid, PLAYER.inkRefillSwim];

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
    R('zipink: a shooter\'s shots cost 0.7 × while the Zipline runs (1 s of fire)', sh0 > 10 && Math.abs(sh1 / sh0 - 0.7) < 0.03, { off: r2(sh0), on: r2(sh1), ratio: r3(sh1 / sh0) });
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
    // the special ending otherwise (a splat; a swap) lets go too
    reset(); place(M1, 0, -6); step(0.2); let s2 = start(M1, 'booyah'); step(1);
    G.specials.end(M1, 'swap'); step(1.2);
    const swapDown = !s2.pin && M1.grounded && M1.pos.y < 0.1;
    reset(); place(M1, 0, -6); step(0.2); s2 = start(M1, 'booyah'); step(1);
    const held0 = ZC.splatHeld; M1.splat(E1, 'shooter'); step(0.05);
    R('lift: the special ending (a loadout swap) lets go and it drops; splatted up there: let go, counted', swapDown && !s2.pin && !M1.specialActive && ZC.splatHeld === held0 + 1, { swapDown, splatHeld: ZC.splatHeld - held0 });
    // under a low ceiling: only as high as the kid and its orb fit
    reset();
    const lv = G.level;
    const ceil = lv.addDynamic({ min: [0, 0, 0], max: [1, 1, 1] }); lv.moveDynamic(ceil, V(-10, 3.2, -14), V(2, 0.2, 2));
    place(M1, -10, -14); step(0.2);
    const s3 = start(M1, 'booyah'); step(BD.liftTime + 0.2);
    const lowUp = M1.pos.y, headTop = M1.pos.y + PLAYER.height;
    G.specials.end(M1, 'test'); step(0.6);
    R('lift: under a low ceiling (3 m) it lifts only as far as leaves room for the kid and the orb (0.6 m here), never into it',
      s3.lift && Math.abs(lowUp - 0.6) < 0.08 && headTop < 3.0 - 0.9, { up: r2(lowUp), H: s3.lift && r2(s3.lift.H) });
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
    me._cheerT = -9; me.special = cost; me.intent.cheer = true; frame();
    const fullG = gaugeW().length, fullO = orbW().length;
    step(1.0); me._cheerT = -9; me.special = cost; start(me, 'bubbler'); step(0.05); me.intent.cheer = true; frame();
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

  // ======================================================================================== bots
  if (want('bots')) {
    reset();
    for (const a of [M1, M2]) a.bot.update = brains.get(a);
    place(me, 0, -12); place(M1, 4, -16); place(M2, -4, -16); step(0.2);
    const s = start(me, 'booyah');
    const by = new Set(); const offC = on('actor:cheer', (e) => { if (e.helped && (e.actor === M1 || e.actor === M2)) by.add(e.actor.name); });
    let wisps = 0; const offW = on('cheer:orb', (e) => { if (e.target === me) wisps++; });
    const c0 = s.charge; step(2.5); const extra = s.charge - c0 - 2.5 / BD.charge;
    offC(); offW();
    R('bots: bot teammates cheer a charging orb — their wisps reach it and charge it', by.size >= 1 && wisps >= 2 && extra > 0.2, { cheeredBy: [...by], wisps, extra: r2(extra) });
    G.specials.end(me, 'test');
    for (const a of [M1, M2]) a.bot.update = () => { zero(a); };
    // a bot using it in a fight: stays where it rose, throws it once charged
    reset();
    M1.bot.update = brains.get(M1); E1.bot.update = brains.get(E1);
    place(M1, 0, -12); place(E1, 0, 4); M1.invuln = 99; E1.invuln = 99; step(0.1);
    const s2 = start(M1, 'booyah'); const p0 = M1.pos.clone();
    let maxMove = 0, threw = false;
    step(BD.charge + BD.autoThrow + 0.5, () => { if (M1.specialActive === s2) maxMove = Math.max(maxMove, Math.hypot(M1.pos.x - p0.x, M1.pos.z - p0.z)); if (s2.thrown) { threw = true; return false; } });
    R('bots: a bot with the orb stays up where it rose (no walking off) and throws it once charged', threw && maxMove < 0.02, { threw, maxMove: r3(maxMove) });
    for (const a of [M1, E1]) a.bot.update = () => { zero(a); };
  }

  for (const [a] of brains) a.bot.update = brains.get(a);
  PLAYER.inkRefillKid = saved[0]; PLAYER.inkRefillSwim = saved[1];
  return out;
})();
