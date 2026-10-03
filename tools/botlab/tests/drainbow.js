// Drainbow (src/game/sp-drainbow.js, src/fx/drainbowFx.js): the special end to end on testbox (a flat deck, top y 0;
// a 4 m wall at x 14…15, z −8…8), the bots scripted (no brains):
//   place      set down at the owner's feet (centre lift m over the floor, radius), the owner free at once, its life,
//              the special's gauge running with it, a clean end (nothing left: meshes, world objects, the view, loops)
//   shots      an enemy shot through it does half, one beside it full; through both sides: half once (not a quarter);
//              a charger beam through it half; a bomb going off outside with the victim inside half, beside it full;
//              the owner's team's own shots through it full; a shot fired from inside out half
//   drain      a foe inside loses ink inkDrain / s and specialDrain × its meter / s; out again, it stops
//   gain       teammates inside gain drain × foes / team inside (ink and special); nobody gains with no foe inside;
//              the owner's share is bubble time (extendPerMeter s per full meter, capped at maxLife), not meter
//   meter      the owner's painting (and the zone gauge) doesn't charge the meter while it's up; after it ends it does
//   view       the local player walking into an enemy's: the grey (DrainView.level / the pass's uniforms) and the
//              muffle (the master's damp low-pass / gain) ramp in over the wave and back out after leaving; in your
//              own team's: none
//   cross      walking through the film ripples it (a ripple slot) and counts a crossing
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/drainbow.js tools/botlab/run.sh tools/botlab/page.cjs
//   bots       a bot dropped inside an enemy's walks out (its danger area); a bot with it ready, a foe close and a
//              teammate beside it sets it down
//   one        (the user: "make all ink appear the same colour") the local player walking into an enemy's: both teams'
//              ink tint (src/world/inkOne.js — the uniforms every ink look reads, and the CPU mirror) converges to one
//              value, swept in with the grey wave (near ink first), and on screen two patches of the two teams' ink
//              read as one shade (pixels; against the same frame with the one-shade uniforms off: the old look);
//              out again both go back to the team colours; the minimap's turf too; nobody else's view (in your own
//              team's bubble, or a bot drained while you're outside: no change)
//   blind      ("bots cant tell if its their ink or not so they cover everything as they go") a bot inside an enemy's:
//              its ink queries (BotBrain.inkTeam / groundSeen) report none of its own ink as its own; held on a patch of
//              its own ink it paints all the while, the same bot there with no bubble doesn't; walking out it keeps
//              painting (botBlind 0: it holds its fire, as before); dry, its refill sends it out of the bubble first
//   PAGE_ARGS='only=place,shots,drain,gain,meter,view,cross,bots,one,blind'
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, A = G.audio, dbg = g.debug;
  const THREE = await import('three');
  const { SPECIALS, PLAYER, WEAPONS } = await import('./src/config.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const D = SPECIALS.drainbow, DB = G.drainbow;
  dbg.freeze();
  if (!A.ctx) A.init();
  const frame = () => { g._skipRender = true; g._frame(1 / 60); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return; } };
  const stepR = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { dbg.step(1000 / 60); if (fn && fn(i) === false) return; } };   // (rendered: the pass's uniforms)
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();   // (a slow boot under load can hand over before the intro's done)
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  // (the bots scripted: a._go = { move, fire } holds their intents frame after frame)
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a._go) { if (a._go.move) a.intent.move.copy(a._go.move); a.intent.fire = !!a._go.fire; } };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const place = (a, x, z, y = 0.02) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; };
  const park = (a, i) => place(a, -24 + (i % 4) * 2, 36 + Math.floor(i / 4) * 2);
  const reset = () => {
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); G.paint.clear();
    for (const a of m.actors) { if (!a.alive) a.respawn(); if (a.specialActive) G.specials.end(a, 'swap'); a.specialActive = null; a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a._go = null; a.status.shield = 0; }
    m.actors.forEach(park);
    step(0.1);
  };
  const start = (a, id = 'drainbow') => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const bubble = () => DB.bubbles.find((b) => b.live) || null;
  const world = () => G.specials.world.filter((w) => w.kind === 'drainbow' || w.kind === 'drainbowView').length;
  // a straight test shot (fixed damage, no gravity): from → toward `to`
  const shoot = (a, from, to, dmg = 40) => G.projectiles.fireCustom(a, from, to.clone().sub(from).normalize(), { speed: 40, damage: dmg, range: 40, grav: 0, drag: 0, straight: 99, radius: 0.3 });
  const { on } = await import('./src/core/ctx.js');
  const HITS = []; on('hit', (e) => HITS.push(e));
  // the damage v takes from hits (not from the ink it stands in) while fn's shot lands
  const hpLost = (v, fn, secs = 0.8) => { v.hp = PLAYER.hp; v.invuln = 0; HITS.length = 0; fn(); step(secs); return r2(HITS.filter((e) => e.victim === v).reduce((t, e) => t + (e.damage || 0), 0)); };
  const [E1, E2, E3] = foes, [M1, M2] = mates;
  const savedRefill = [PLAYER.inkRefillKid, PLAYER.inkRefillSwim];
  PLAYER.inkRefillKid = 0; PLAYER.inkRefillSwim = 0;   // (the drain measured clean of the tank's own refill)

  // ======================================================================================== placement + lifetime
  if (want('place')) {
    reset();
    place(me, 0, -10); step(0.1);
    const s = start(me), b = bubble();
    const groundY = 0;
    R('place: the bubble stands at the owner\'s feet (centre lift over the floor), its radius, life = duration; the owner is free (the special flagged free: can super jump, no body / weapon hold)',
      !!b && Math.hypot(b.pos.x - me.pos.x, b.pos.z - me.pos.z) < 0.05 && Math.abs(b.pos.y - (groundY + D.lift)) < 0.05 && b.r === D.radius && b.life === D.duration && s && s.free && !s.body && me.canSuperJump?.() !== false,
      b && { pos: [r2(b.pos.x), r2(b.pos.y), r2(b.pos.z)], r: b.r, life: b.life, free: s.free });
    step(0.5);
    // inflating: grows to full within inflate s
    R('place: blown up to full size within its inflate time', bubble() && Math.abs(bubble().radius() - D.radius) < 0.05, { r: bubble() && r2(bubble().radius()) });
    // the gauge: remaining() drains with its life
    step(2);
    const rem = G.specials.remaining(me);
    R('place: the owner\'s special gauge counts its life down (remaining ≈ 1 − t / life)', Math.abs(rem - (1 - s.t / D.duration)) < 0.02 && rem < 0.8 && rem > 0.6, { rem: r3(rem), t: r2(s.t) });
    R('place: the HUD hint line names it', /Drainbow/.test(G.specials.prompt(me) || ''), { prompt: G.specials.prompt(me) });
    // its end: at duration it pops, the special ends, nothing lingers
    let poppedAt = null;
    step(D.duration, () => { if (poppedAt == null && !(bubble())) poppedAt = s.t; });
    step(0.6);
    const sceneLeft = []; G.specials.scene.traverse((o) => { if (o.name === 'FX_Drainbow') sceneLeft.push(o.name); });
    R('place: it pops when its life runs out (≈ duration), the special ends with it', poppedAt != null && Math.abs(poppedAt - D.duration) < 0.1 && !me.specialActive, { poppedAt: poppedAt && r2(poppedAt) });
    step(1.5);
    R('end: nothing left — no bubble objects, no film meshes in the scene, nothing halving shots', world() === 0 && !sceneLeft.length && DB.bubbles.length === 0 && !DB.live, { world: world(), meshes: sceneLeft.length, bubbles: DB.bubbles.length });
    // a bot owner walks on and keeps firing (the special holds neither body nor trigger)
    reset(); M1.setWeapon('shooter'); place(M1, 0, -10); step(0.1); start(M1); step(0.2);
    const p0 = M1.pos.clone(), ink0 = M1.ink;
    M1._go = { move: V(0, 0, 1), fire: true }; step(0.8); M1._go = null; step(0.05);
    R('place: the owner walks on and fires its weapon (its special holds neither body nor weapon)', M1.pos.distanceTo(p0) > 2 && M1.ink < ink0 - 2 && !!bubble(), { moved: r2(M1.pos.distanceTo(p0)), ink: [r2(ink0), r2(M1.ink)] });
    // splatted owner: it pops
    reset(); place(me, 0, -10); step(0.1); start(me); step(1);
    me.splat(E1, 'test'); step(0.6);
    R('place: the owner splatted → it pops (popOnOwnerSplat)', !bubble() && DB.stats.pops >= 2, { pops: DB.stats.pops });
  }

  // ======================================================================================== shots
  if (want('shots')) {
    reset();
    // the bubble on M1 at (0, z −10); M1 stands inside it; a control mate at (10, −10) outside
    place(M1, 0, -10); step(0.05); start(M1); step(0.8);
    const b = bubble();
    const chestOf = (a) => V(a.pos.x, a.pos.y + 0.9, a.pos.z);
    // (1) an enemy shot into it → the victim inside takes half
    place(E1, 0, -22); place(me, 9, -10); place(E2, 9, -22);
    const inside = hpLost(M1, () => shoot(E1, V(0, 0.9, -21.4), chestOf(M1)));
    const ctl = hpLost(me, () => shoot(E2, V(9, 0.9, -21.4), chestOf(me)));
    R('shots: an enemy shot into the bubble does half (the victim inside); the same shot beside it does full', Math.abs(inside - 20) < 0.6 && Math.abs(ctl - 40) < 0.6, { inside, control: ctl });
    // (2) through both sides: the victim behind it (outside) — halved once
    place(M1, -2.5, -10); place(M2, 0, 2); place(E1, 0, -22); step(0.05);
    const through = hpLost(M2, () => shoot(E1, V(0, 0.9, -21.4), chestOf(M2)), 1.0);
    R('shots: through the bubble and out the far side (crossing twice): half once, not a quarter', Math.abs(through - 20) < 0.6, { through });
    // (3) a charger beam (half charge) through it
    place(E1, 0, -20); place(M2, 0, -2);
    E1.setWeapon('charger');
    const aimAt = (e, p) => { const dx = p.x - e.pos.x, dz = p.z - e.pos.z; e.yaw = e.aimYaw = Math.atan2(dx, dz); e.aimPitch = Math.atan2(p.y - (e.pos.y + 1.2), Math.hypot(dx, dz)); e.aimPoint?.copy(p); e.aimDir?.set(dx, p.y - (e.pos.y + 1.2), dz).normalize(); };
    aimAt(E1, chestOf(M2)); step(0.05); aimAt(E1, chestOf(M2));
    const W = WEAPONS.charger, beamDmg = THREE.MathUtils.lerp(W.damageMin, W.damageMax * 0.62, 0.5);
    const beam = hpLost(M2, () => G.projectiles.fireCharger(E1, W, 0.5), 0.1);
    place(E2, 9, -20); place(me, 9, -2); aimAt(E2, chestOf(me)); E2.setWeapon('charger'); step(0.05); aimAt(E2, chestOf(me));
    const beamCtl = hpLost(me, () => G.projectiles.fireCharger(E2, W, 0.5), 0.1);
    R('shots: a charger beam through it does half; beside it full', Math.abs(beam - beamDmg / 2) < 0.8 && Math.abs(beamCtl - beamDmg) < 0.8, { beam, control: beamCtl, full: r2(beamDmg) });
    E1.setWeapon('shooter'); E2.setWeapon('shooter');
    // (4) a bomb going off just outside: the victim inside half (its blast comes through the film), beside it full
    const bombAt = (owner, p) => { G.projectiles.throwBomb(owner); const bb = G.projectiles.bombs[G.projectiles.bombs.length - 1]; bb.pos.copy(p); bb.vel.set(0, 0, 0); bb.fuse = 0.01; bb.dbw = 0; return bb; };
    place(M1, 0, -12.6); place(me, 9, -12.6); step(0.05);
    const bIn = hpLost(M1, () => bombAt(E1, V(0, 0.25, -15.6)), 0.3);
    const bOut = hpLost(me, () => bombAt(E2, V(9, 0.25, -15.6)), 0.3);
    R('shots: a bomb going off outside — the victim inside takes half of its blast, the same blast beside it full', bIn > 1 && Math.abs(bIn - bOut / 2) < 1, { inside: bIn, control: bOut });
    // (5) the owner's team's own shots through it: full (it's theirs)
    place(M1, 0, -10); place(E1, 0, 2); place(E3, 9, 2); place(M2, 9, -10); step(0.05);
    const own = hpLost(E1, () => shoot(M1, V(0, 0.9, -9.4), chestOf(E1)), 0.8);
    const ownCtl = hpLost(E3, () => shoot(M2, V(9, 0.9, -9.4), chestOf(E3)), 0.8);
    R('shots: its own team\'s shots out through it do full damage', Math.abs(own - 40) < 0.6 && Math.abs(ownCtl - 40) < 0.6, { own, control: ownCtl });
    // (6) an enemy firing out from inside it: half
    place(E1, 0, -11); place(M2, 0, 2); place(M1, -2, -9); step(0.05);
    const outOf = hpLost(M2, () => shoot(E1, V(0, 0.9, -10.4), chestOf(M2)), 0.8);
    R('shots: an enemy firing from inside out: half', Math.abs(outOf - 20) < 0.6, { outOf });
    // (assists, src/game/assists.js: a halved hit still counts — E1 chips M2 through the film, E2 splats M2)
    { place(M2, 0, -8.6); place(E1, 0, -22); place(M1, -2.5, -10); step(0.05);
      const as0 = E1.stats.assists || 0, chip = hpLost(M2, () => shoot(E1, V(0, 0.9, -21.4), chestOf(M2)));
      G.projectiles.applyHit(E2, M2, 500, 'shooter'); step(0.1);
      R('shots: a halved hit still earns its shooter the assist when a teammate splats that player', chip > 0 && chip < 25 && (E1.stats.assists || 0) === as0 + 1 && !M2.alive, { chip, assists: [as0, E1.stats.assists] });
      M2.respawn(); step(0.05); }
    R('shots: every halved shot fizzled at the film (passes / fizzles counted)', DB.stats.passes >= 3 && DB.stats.fizzles >= 3, { passes: DB.stats.passes, fizzles: DB.stats.fizzles, cuts: DB.stats.cuts });
    void b;
  }

  // ======================================================================================== drain + gain + meter
  if (want('drain') || want('gain') || want('meter')) {
    reset();
    // owner M1 at (0, −10); E1 inside, E2 outside (control)
    place(M1, 0, -10); step(0.05); start(M1); step(D.inflate + 0.1);
    place(E1, 1.5, -10); place(E2, 12, -30); place(me, 10, 20); place(M2, -10, 20); step(0.05);
    const cost1 = E1.specialCost();
    E1.ink = 80; E1.special = cost1 * 0.8; E2.ink = 80; E2.special = E2.specialCost() * 0.8;
    const b = bubble(), life0 = b.life, T = 2;
    step(T);
    const inkLost = r2(80 - E1.ink), spLost = r3((cost1 * 0.8 - E1.special) / cost1), ctlInk = r2(80 - E2.ink), ctlSp = r3((E2.specialCost() * 0.8 - E2.special) / E2.specialCost());
    if (want('drain')) R('drain: a foe inside loses ink (inkDrain / s) and special (specialDrain of a full meter / s); a foe outside nothing',
      Math.abs(inkLost - D.inkDrain * T) < 1 && Math.abs(spLost - D.specialDrain * T) < 0.01 && ctlInk < 0.5 && ctlSp < 0.005, { inkLost, spLost, want: [D.inkDrain * T, D.specialDrain * T], control: [ctlInk, ctlSp] });
    // the owner alone with one foe: its share (1 × drain) is bubble time
    const ext = r2(b.life - life0);
    if (want('gain')) R('gain: the owner\'s drained-special share becomes bubble time (specialDrain × extendPerMeter s per s), its meter untouched; the special\'s gauge follows the longer life',
      Math.abs(ext - D.specialDrain * D.extendPerMeter * T) < 0.08 && M1.special === 0 && Math.abs(M1.specialActive.dur - b.life) < 1e-6, { ext, want: r2(D.specialDrain * D.extendPerMeter * T), meter: M1.special, dur: r2(M1.specialActive.dur) });
    // out again: no more drain
    place(E1, 12, -24); step(0.1);
    const ink1 = E1.ink, sp1 = E1.special;
    step(1);
    if (want('drain')) R('drain: out of it the drain stops', Math.abs(E1.ink - ink1) < 0.01 && Math.abs(E1.special - sp1) < 0.01, { ink: [r2(ink1), r2(E1.ink)] });
    if (want('gain')) {
      // M2 joins the owner inside, two foes inside: share = 2 foes / 2 of us = 1 each
      place(M2, -1.5, -10); place(E1, 1.5, -9); place(E2, 0, -11.5); step(0.05);
      const c2 = M2.specialCost();
      M2.ink = 40; M2.special = 0; M1.ink = 40;
      const lifeA = b.life; step(T);
      const mInk = r2(M2.ink - 40), mSp = r3(M2.special / c2), oInk = r2(M1.ink - 40), ext2 = r2(b.life - lifeA);
      R('gain: two foes, two of us inside — each gainer gets drain × 2 / 2: the teammate ink and special, the owner ink and bubble time',
        Math.abs(mInk - D.inkDrain * T) < 1 && Math.abs(mSp - D.specialDrain * T) < 0.01 && Math.abs(oInk - D.inkDrain * T) < 1 && Math.abs(ext2 - D.specialDrain * D.extendPerMeter * T) < 0.08,
        { mate: [mInk, mSp], owner: [oInk, ext2] });
      // no foe inside: nobody gains
      place(E1, 12, -24); place(E2, 12, -30); step(0.05);
      const i0 = M2.ink, s0 = M2.special, l0 = b.life;
      step(1);
      R('gain: no foe inside, nobody gains (ink, special, life)', M2.ink === i0 && M2.special === s0 && b.life === l0, { ink: [r2(i0), r2(M2.ink)] });
      // the cap: three foes, the owner alone, until it can't grow
      place(M2, -10, 20); place(E1, 1.5, -9); place(E2, 0, -11.5); place(E3, -1.5, -9.5); step(0.05);
      let cap = 0;
      step(8, () => { cap = Math.max(cap, b.life); if (!b.live) return false; });
      R('gain: its life never passes maxLife', cap <= D.maxLife + 1e-6 && cap > D.maxLife - 0.05, { cap: r2(cap), max: D.maxLife });
      R('gain: a running special still gains no meter (the owner\'s stays at 0 while it stands)', M1.special === 0 && !!M1.specialActive, { meter: M1.special });
    }
    if (want('meter')) {
      // painting while it stands: no meter (a fresh one)
      reset(); place(M1, 0, -10); step(0.05); start(M1); step(1);
      M1.addTurf(200);
      const zone = G.match.zones; void zone;
      const during = M1.special, live = !!bubble();
      // until it ends (the special with it), then painting charges again
      let n = 0; while (M1.specialActive && n++ < 1200) frame();
      M1.addTurf(50);
      R('meter: the owner\'s painting doesn\'t charge the meter while the Drainbow is out; after it ends it does',
        live && during === 0 && !M1.specialActive && M1.special > 0, { live, during, after: r2(M1.special) });
    }
  }

  // ======================================================================================== the view (local player)
  if (want('view')) {
    reset();
    // E1's bubble at (0, −10); you walk in from the side
    place(E1, 0, -10); step(0.05); start(E1); step(D.inflate + 0.1);
    place(me, 7, -10); g.rig.follow?.(me, true); stepR(0.2);
    const U = () => DB.view.pass?.uniforms;
    const before = { level: DB.view.level, damp: A.damp, lp: A.dampLP ? Math.round(A.dampLP.frequency.value) : null };
    // walk in (the local kid moved by hand at 4.5 m/s: the controller owns its intents)
    const trace = [];
    stepR(1.8, (i) => {
      if (me.pos.x > 2) me.pos.x -= 4.5 / 60;
      if (i % 6 === 0) trace.push([r2(DB.view.level), r2(A.damp), U() ? r2(U().uR.value) : null]);
    });
    const inLvl = DB.view.level, inDamp = A.damp, lpIn = A.dampLP ? A.dampLP.frequency.value : null, gIn = A.dampG ? A.dampG.gain.value : null;
    const rising = trace.map((x) => x[0]);
    const ramp = rising.some((x) => x > 0.05 && x < 0.95);
    R('view: walking into an enemy\'s: the grey wave sweeps in (the level ramps 0 → 1 over the wave, the front radius growing), then stays full inside; the muffle follows (master low-pass down to ~dampCut, gain to ~dampGain)',
      before.level === 0 && ramp && inLvl > 0.99 && inDamp > 0.99 && lpIn < D.dampCut * 1.6 && gIn < D.dampGain + 0.08 && U() && U().uAfter.value > 0.99,
      { before, trace: trace.slice(0, 14), in: { level: r2(inLvl), damp: r2(inDamp), lp: lpIn && Math.round(lpIn), gain: gIn && r2(gIn) }, waves: DB.view.stats.waves, depth: DB.view.stats.depthSrc });
    R('view: the HUD greys with it', /grayscale\(0\.8/.test(g.hud?.el?.style.filter || ''), { filter: g.hud?.el?.style.filter });
    // and the drained local player loses ink
    me.ink = 80; step(1);
    R('view: you\'re drained in there too (your own screen drains your tank)', me.ink < 80 - D.inkDrain * 0.8, { ink: r2(me.ink) });
    // walk out
    const trace2 = [];
    stepR(2.2, (i) => { if (me.pos.x < 8) me.pos.x += 4.5 / 60; if (i % 6 === 0) trace2.push([r2(DB.view.level), r2(A.damp)]); });
    const outLvl = DB.view.level, outDamp = A.damp, lpOut = A.dampLP ? A.dampLP.frequency.value : null;
    R('view: walking out: the colour sweeps back (the level ramps down to 0), the muffle lifts (the filter back at Nyquist, gain 1), the pass idles',
      trace2.some((x) => x[0] > 0.05 && x[0] < 0.95) && outLvl === 0 && outDamp === 0 && lpOut >= A.ctx.sampleRate / 2 - 1 && (!DB.view.pass || !DB.view.pass.enabled),
      { trace: trace2.slice(0, 14), out: { level: outLvl, damp: outDamp, lp: lpOut && Math.round(lpOut) } });
    R('view: the HUD back in colour', !(g.hud?.el?.style.filter || ''), { filter: g.hud?.el?.style.filter });
    // your own team's bubble: no grey
    reset();
    place(me, 0, -10); step(0.05); start(me); stepR(1.5);
    R('view: inside your own team\'s Drainbow: no grey, no muffle', DB.view.level === 0 && A.damp === 0, { level: DB.view.level, damp: A.damp });
    // a bot inside an enemy's: drained, but the screen (the local player's) stays in colour
    place(E1, 1.5, -10); stepR(1.2);
    R('view: a bot inside an enemy\'s is drained (its sight shrinks: botSight) — the local screen stays in colour', DB.view.level === 0 && G.time - (E1._dbT ?? -9) < 0.1, { level: DB.view.level });
  }

  // ======================================================================================== crossings
  if (want('cross')) {
    reset();
    place(M1, 0, -10); step(0.05); start(M1); step(D.inflate + 0.2);
    const b = bubble(), c0 = DB.stats.crossings, rip0 = b.look.ripN;
    place(E1, 7, -10); step(0.1);
    E1._go = { move: V(-1, 0, 0) }; step(1.0); E1._go = null; step(0.05);
    const c1 = DB.stats.crossings, rip1 = b.look.ripN;
    E1._go = { move: V(1, 0, 0) }; step(1.6); E1._go = null;
    R('cross: walking in and out through the film: two crossings, each a ripple on the film (a dimple in, a bulge out)', c1 - c0 === 1 && DB.stats.crossings - c0 === 2 && b.look.ripN - rip0 >= 2,
      { crossings: DB.stats.crossings - c0, ripples: b.look.ripN - rip0, signs: b.look.U.uRipK.value.slice(0, 3).map((v) => v.y) });
  }

  // ======================================================================================== bots
  if (want('bots')) {
    reset();
    const { SPECIAL_STATS } = await import('./src/game/botSpecials.js');
    place(E1, 0, -10); step(0.05); start(E1); step(D.inflate + 0.2);
    // a teammate of yours with its real brain, dropped inside the enemy's bubble: it notices (it's on the map) and leaves
    const brain = M1.bot, Brain = brain.constructor;
    M1.bot = new Brain(M1, 'normal'); M1.bot.aimYaw = M1.yaw;
    place(M1, 1, -10); step(0.05);
    const esc0 = SPECIAL_STATS.escapes;
    let outAt = null;
    step(4, (i) => { if (outAt == null && !DB.inEnemy(M1)) outAt = r2(i / 60); });
    R('bots: a bot inside an enemy Drainbow notices it and walks out (an escape)', outAt != null && outAt < 3 && SPECIAL_STATS.escapes > esc0,
      { outAt, escapes: SPECIAL_STATS.escapes - esc0 });
    M1.bot = brain;
    // a bot with the Drainbow ready, a foe close and a teammate beside it: it sets it down
    reset();
    const b2 = M2.bot; M2.bot = new Brain(M2, 'normal');
    place(M2, 0, -10); place(M1, 1.5, -10); place(E2, 0, -3); E2.hp = 1e6; M2.hp = 1e6; M1.hp = 1e6;
    M2.specialId = 'drainbow'; M2.special = M2.specialCost();
    let used = null;
    step(6, (i) => { if (used == null && M2.specialActive?.id === 'drainbow') used = r2(i / 60); });
    R('bots: with a foe close and a teammate beside it, a bot sets its Drainbow down', used != null, { used });
    M2.bot = b2;
  }

  // ======================================================================================== one shade (the local player's view)
  if (want('one')) {
    reset();
    const IO = await import('./src/world/inkOne.js'), { TEAM_PALETTES } = await import('./src/config.js');
    const dC = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
    const pal0 = g.palette; g._setPalette(TEAM_PALETTES[0]);   // (tangerine / cobalt: two inks far apart in grey too)
    // E1's bubble at (0, −10) (E1 then steps aside, inside); two patches side by side in it: team 0's and team 1's
    // (one seed: the same per-splat tone), you walking in from +z
    place(E1, 0, -10); step(0.05); start(E1); step(D.inflate + 0.1); place(E1, 3.5, -7.5);
    const P0 = V(-1.25, 0, -11.5), P1 = V(1.25, 0, -11.5), PF = V(0, 0, -36);
    G.paint.splat(V(P0.x, 0.1, P0.z), 1.15, 0, { seed: 0.37, instant: true });
    G.paint.splat(V(P1.x, 0.1, P1.z), 1.15, 1, { seed: 0.37, instant: true });
    place(me, 0, -2.6); me.yaw = me.aimYaw = Math.PI; me.aimPitch = -0.35;
    g.rig.follow?.(me, true); g.rig.yaw = Math.PI; g.rig.pitch = -0.32;
    stepR(0.4);
    // the two patches' colour on screen (a 5 × 5 average round each one's middle), read straight after a render
    const gl = G.renderer.getContext(), buf = new Uint8Array(4);
    const px = (p) => {
      const v = p.clone().setY(0.02).project(G.camera), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      const x = Math.round((v.x + 1) / 2 * W), y = Math.round((v.y + 1) / 2 * H);
      let r = 0, gg = 0, b = 0, n = 0;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { gl.readPixels(x + i * 3, y + j * 3, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf); r += buf[0]; gg += buf[1]; b += buf[2]; n++; }
      return [r / n, gg / n, b / n];
    };
    const shot = () => { const v = me.character.root.visible; me.character.root.visible = false; g.R.render(); const r = [px(P0), px(P1)]; me.character.root.visible = v; return r; };
    const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const dPx = (pp) => r2(Math.hypot(pp[0][0] - pp[1][0], pp[0][1] - pp[1][1], pp[0][2] - pp[1][2]));
    const dL = (pp) => r2(Math.abs(lum(pp[0]) - lum(pp[1])));
    const out0 = shot();
    const t0 = [IO.inkOneTint(0, P0), IO.inkOneTint(1, P1)];
    R('one: outside, each team\'s ink in its own colour (the one-shade uniforms off; on screen the two patches far apart)',
      IO.INK_ONE.uOneB.value.y === 0 && IO.INK_ONE.uOneB.value.z === 0 && dC(t0[0], G.teamColors[0]) < 1e-6 && dC(t0[1], G.teamColors[1]) < 1e-6 && dPx(out0) > 40,
      { uOneB: IO.INK_ONE.uOneB.value.toArray().map(r3), px: out0.map((c) => c.map(Math.round)), dPx: dPx(out0) });
    // walk in (4.5 m/s): the one shade sweeps in with the wave — the patch near where you crossed before the far floor
    const trace = []; let swept = null;
    stepR(2.2, (i) => {
      if (me.pos.z > -6) me.pos.z -= 4.5 / 60;
      const kN = IO.inkOneK(P0), kF = IO.inkOneK(PF);
      if (DB.view.wave && kN > 0.6 && kF < 0.05 && !swept) swept = { kNear: r2(kN), kFar: r2(kF), level: r2(DB.view.level) };
      if (i % 8 === 0) trace.push([r2(DB.view.level), r2(kN), r2(kF), r2(me.pos.z)]);
    });
    const t1 = [IO.inkOneTint(0, P0), IO.inkOneTint(1, P1)];
    R('one: walking in, both teams\' ink goes to the one tint with the grey wave — the patch by the crossing before the floor 25 m on — and inside the two tints are one value (the shaders\' uniforms: one tint, full amount)',
      !!swept && dC(t1[0], t1[1]) < 1e-6 && dC(t1[0], IO.INK_ONE.uOneC.value) < 1e-6 && IO.INK_ONE.uOneB.value.y === 1 && DB.view.level === 1,
      { swept, trace: trace.slice(0, 12), tint: [t1[0].toArray().map(r3), t1[1].toArray().map(r3)], one: IO.INK_ONE.uOneC.value.toArray().map(r3) });
    // on screen: the two patches one shade; the same frame with the one-shade uniforms off (the old look: two greys)
    stepR(0.1);
    const one = shot();
    const B0 = IO.INK_ONE.uOneB.value.clone();
    IO.INK_ONE.uOneB.value.set(0, 0, 0, B0.w); const ctl = shot(); IO.INK_ONE.uOneB.value.copy(B0); shot();
    R('one: on screen inside, the two teams\' patches are one shade (pixels), where with the one shade off (the old look) the grey still told them apart',
      dL(ctl) > 8 && dL(one) < Math.max(3, dL(ctl) * 0.25) && dPx(one) < Math.max(5, dPx(ctl) * 0.3),
      { one: { px: one.map((c) => c.map(Math.round)), dPx: dPx(one), dLum: dL(one) }, old: { px: ctl.map((c) => c.map(Math.round)), dPx: dPx(ctl), dLum: dL(ctl) } });
    // the minimap's turf: one shade in there too
    const mm = g.minimap, rgb = mm && mm._teamRGB();
    R('one: the minimap draws both teams\' turf in the one shade while you\'re in there', !!rgb && rgb[0].join() === rgb[1].join(), { rgb });
    // walk out: the team colours sweep back
    stepR(2.6, () => { if (me.pos.z < 0) me.pos.z += 4.5 / 60; });
    const t2 = [IO.inkOneTint(0, P0), IO.inkOneTint(1, P1)], back = shot(), rgb2 = mm && mm._teamRGB();
    R('one: out again, each team\'s ink is back in its own colour (uniforms off, the patches apart on screen, the minimap in team colours)',
      DB.view.level === 0 && IO.INK_ONE.uOneB.value.y === 0 && dC(t2[0], G.teamColors[0]) < 1e-6 && dC(t2[1], G.teamColors[1]) < 1e-6 && dPx(back) > 40 && rgb2 && rgb2[0].join() !== rgb2[1].join(),
      { uOneB: IO.INK_ONE.uOneB.value.toArray().map(r3), dPx: dPx(back), rgb: rgb2 });
    // only the drained local player: in your own team's bubble — nothing; a bot drained in an enemy's while you're out — nothing
    reset();
    place(me, 0, -10); step(0.05); start(me); stepR(1.2);
    const own = IO.INK_ONE.uOneB.value.y;
    place(E1, 1.5, -10); place(me, 0, 8); stepR(1.0);
    R('one: only the drained local player — inside your own team\'s bubble, and with a foe bot drained in yours while you\'re outside, every ink keeps its colour',
      own === 0 && IO.INK_ONE.uOneB.value.y === 0 && IO.inkOneK(V(1.5, 0, -10)) === 0 && G.time - (E1._dbT ?? -9) < 0.1, { own, after: IO.INK_ONE.uOneB.value.y });
    if (pal0) g._setPalette(pal0);
  }

  // ======================================================================================== blind bots (their ink)
  if (want('blind')) {
    reset();
    const { SPECIAL_AI } = await import('./src/game/botSpecials.js');
    const brain = M1.bot, Brain = brain.constructor;
    const S = V(8, 0, -20);   // (far from where everyone else is parked: nobody in sight)
    const ownInk = () => { for (const [dx, dz] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, 4], [4, -4], [-4, -4]]) G.paint.splat(V(S.x + dx, 0.1, S.z + dz), 4.2, M1.team, { seed: 0.21, instant: true }); };
    const fresh = () => { M1.bot = new Brain(M1, 'normal'); M1.setWeapon('shooter'); M1.ink = PLAYER.inkMax; M1.hp = 1e6; place(M1, S.x, S.z); M1.yaw = M1.aimYaw = 0; M1.bot.aimYaw = 0; M1.bot.bombCd = 99; };
    const awayE1 = () => park(E1, m.actors.indexOf(E1));
    // the paint M1 puts down (its splats' area) over a few seconds, held where it stands (its decisions run as usual)
    const sp0 = G.paint.splat; let painted = 0, counting = false;
    G.paint.splat = function (c, r, team, o) { if (counting && team === M1.team) painted += Math.PI * r * r; return sp0.call(this, c, r, team, o); };
    const measure = (secs, pin = true) => {
      painted = 0; counting = true; let fires = 0, inside = 0;
      step(secs, () => { if (pin) { M1.pos.x = S.x; M1.pos.z = S.z; M1.vel.x = M1.vel.z = 0; } M1.ink = PLAYER.inkMax; if (M1.intent.fire) fires++; if (DB.inEnemy(M1)) inside++; });
      counting = false; return { painted: r2(painted), fires, inside };
    };
    try {
      // (a) no bubble: on its own ink it sees nothing to paint
      ownInk(); step(0.2); fresh(); step(0.3);
      const q0 = { inkTeam: M1.bot.inkTeam, groundSeen: M1.bot.groundSeen, own: r2(G.paint.regionStats(S.x, 0, S.z, 3, M1.bot.inkTeam).own) };
      const out1 = measure(3);
      // (b) E1's bubble round the same spot (E1 steps away; M1's ink painted back over the bubble's splash)
      reset(); place(E1, S.x, S.z); step(0.05); start(E1); step(D.inflate + 0.1); awayE1();
      ownInk(); step(0.2); fresh(); step(0.3);
      const q1 = { inkTeam: M1.bot.inkTeam, groundSeen: M1.bot.groundSeen, own: r2(G.paint.regionStats(S.x, 0, S.z, 3, M1.bot.inkTeam).own), real: r2(G.paint.regionStats(S.x, 0, S.z, 3, M1.team).own), ground: M1.groundTeam };
      R('blind: a bot inside an enemy Drainbow reads none of its own ink as its own (inkTeam: nobody\'s; the ground under it: theirs) — outside the same ink is its own',
        q0.inkTeam === M1.team && q0.groundSeen === 1 && q0.own > 0.9 && q1.inkTeam === 2 && q1.own === 0 && q1.real > 0.9 && q1.groundSeen === 2 && q1.ground === 1, { outside: q0, inside: q1 });
      const in1 = measure(3);
      R('blind: held on a patch of its own ink, the bot in the bubble paints all the while ("they cover everything as they go"); the same bot there with no bubble barely does',
        in1.inside > 150 && in1.painted > 30 && in1.painted > out1.painted * 3 + 10 && in1.fires > out1.fires + 60, { inBubble: in1, noBubble: out1 });
      // (c) walking out (not held): it keeps painting on its way out; botBlind 0 — as before: no shots while it gets out
      const walkOut = (blind) => {
        D.botBlind = blind;
        reset(); place(E1, S.x, S.z); step(0.05); start(E1); step(D.inflate + 0.1); awayE1();
        ownInk(); step(0.2); fresh(); step(0.05);
        painted = 0; counting = true; let fires = 0, t = 0;
        step(4, () => { M1.ink = PLAYER.inkMax; if (!DB.inEnemy(M1)) return false; t++; if (M1.intent.fire) fires++; });
        counting = false;
        return { fires, framesInside: t, painted: r2(painted), out: !DB.inEnemy(M1) };
      };
      const wB = walkOut(1), wS = walkOut(0);
      D.botBlind = 1;
      R('blind: walking out of it the blind bot keeps painting everything it passes; with botBlind 0 (the old reading: its own ink known) it holds its fire on the way out',
        wB.out && wS.out && wB.fires > 10 && wB.painted > 10 && wS.fires === 0, { blind: wB, sighted: wS });
      // (d) dry in there: a refill sends it out of the bubble first (it can't tell its ink, and the bubble stops refills)
      SPECIAL_AI.enabled = false;   // (its own danger escape off: the refill's route alone)
      reset(); place(E1, S.x, S.z); step(0.05); start(E1); step(D.inflate + 0.1); awayE1();
      ownInk(); step(0.2); fresh(); M1.ink = 4; step(0.4);
      const b = bubble(), pth = M1.bot.path, end = pth && pth.length ? G.nav.nodes[pth[pth.length - 1]] : null;
      const endD = end && b ? r2(Math.hypot(end.x - b.pos.x, end.z - b.pos.z)) : null;
      let outAt = null; step(4, (i) => { if (outAt == null && !DB.inEnemy(M1)) outAt = r2(i / 60); M1.ink = Math.min(M1.ink, 4); });
      SPECIAL_AI.enabled = true;
      R('blind: dry inside it, its refill heads out of the bubble first (the route ends past the film), not to the own ink under its feet',
        M1.bot.mode === 'refill' && endD != null && endD > D.radius && outAt != null, { mode: M1.bot.mode, routeEnd: endD, radius: D.radius, outAt });
    } finally {
      G.paint.splat = sp0; D.botBlind = 1; SPECIAL_AI.enabled = true;
      M1.bot = brain;
    }
  }

  PLAYER.inkRefillKid = savedRefill[0]; PLAYER.inkRefillSwim = savedRefill[1];
  return out;
})()
