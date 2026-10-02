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
//   PAGE_ARGS='only=place,shots,drain,gain,meter,view,cross,end'
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
    reset(); place(M1, 0, -10); step(0.1); start(M1); step(0.2);
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

  PLAYER.inkRefillKid = savedRefill[0]; PLAYER.inkRefillSwim = savedRefill[1];
  return out;
})()
