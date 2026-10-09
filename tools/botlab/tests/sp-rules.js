// sp-rules (batch 5, [b5-sprules]): the special gauge on a splat, what outlives its owner, the Bubble Guard chain, and
// the Waddle / Mystery Bomb Barrages — on testbox (a flat deck, top y 0, x ±28 / z ±40, the sea past it; a 4 m wall at
// x 14…15, z −8…8), the bots scripted (no brains) except in 'bots':
//   gauge     splatted mid-special, the gauge restarts from PLAYER.specialKeepOnSplat (½) of what was LEFT of it (its
//             gauge as the HUD shows it: G.specials.remaining) — several shares (a Crab Rig 0.8 / 0.5 / 0.2, a Twister
//             Zooka, a held Cheer Orb 1.0, a Bubble Blower with one bubble blown, a Howl Box falling into the sea) — not
//             ½ of a full gauge (the old rule; each check shows what it would have given); what carries on without
//             you keeps nothing (an orphaned Drainbow, a Tempest already thrown: 0); it's still there after the
//             respawn. No special running: ½ of what you had (0.6 → 0.3, full → 0.5, 0.25 → 0.125), as before.
//   survive   the owner splatted, each carries on and finishes as it would have: the Whirl Boomerang (no fizzle: home
//             to where they went down — not to their respawn — circles it, bursts there, hurting a foe), the Ink
//             Tempest (its cloud rains its whole life, inks, hurts), Surf N' Turf (all its rings go out, still hitting;
//             the buoy goes after the last, not popped), the Drainbow (stands for the rest of its life, still halving
//             shots and draining foes; pops on time; the owner back from the respawn gains in it like any teammate, its
//             life no longer growing), a shared Bubble Guard (keeps its time, still shoves instead of hurting); and,
//             unchanged (the user: "I meant only bubble guard not bubble blower"), the Bubble Blower as it always was
//             (the bubble being blown is let go; every bubble floats on and pops on its own time; a teammate's shots
//             still set one off)
//   chain     A's Bubble Guard → B by touch → C by touch from B; each copy carries the time left on the one it came
//             from (never a fresh timer: all three run out together); no refresh loop (together for the rest of it:
//             two shares, no more); one field a player (C's untouched by another player's new Bubble Guard); each
//             chain once (B splatted and back can't take it again from C; a new chain can reach B); copies pass on
//             after the owner is splatted; a copy shoves instead of hurting; the hint line (share it / pass it on;
//             a copy's only with a teammate who could take it close by; on the HUD the Cheer Orb's prompt wins over it)
//   waddle    Waddle Bomb Barrage: no ink, its gap, special Waddles (`sp`: no meter), one walks to a foe and bursts;
//             a barrage's Waddle senses and chases with the barrage's own numbers (waddleSense / waddleLife), its
//             ghost on another screen too; the Waddle Bomb sub keeps its own
//   mystery   Mystery Bomb Barrage: the next bomb shows in the hand (the sub prop), on the HUD's NEXT card, the sub
//             badge and the hint line before it's thrown; each throw is that bomb; it changes every throw (never the
//             same twice running); over 120 throws every kind comes up, evenly (each a sixth, ±2); each throw waits
//             its own bomb's barrage gap; the card shows the next bomb on every real frame from the throw on (after a
//             Pop Pellet or a Splat Bomb too, when the next throw is first allowed), marked with a drop-in and a pop;
//             other barrages show no card
//   bots      a bot with each new barrage, a foe in front, pops it and throws (the Mystery: several kinds); a bot with a
//             shared Bubble Guard walks over to pass it on to a teammate close by
//   list      both appended at the END of SPECIAL_ORDER, their icons and blurbs, the online records they use
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sp-rules.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=gauge,survive,chain,waddle,mystery,bots,list'
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, dbg = g.debug;
  const THREE = await import('three');
  const { SPECIALS, PLAYER, SUBS, SPECIAL_ORDER, SUB_ORDER } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { SPECIAL_ICONS } = await import('./src/ui/ui-icons.js');
  const SURF = await import('./src/game/sp-surf.js');
  // (the modules this package adds: absent on the code before it — run there, every check fails instead of the page)
  const BAR = await import('./src/game/sp-barrage.js').catch(() => null);
  const CH = await import('./src/game/sp-bubble.js').catch(() => null);
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  // a section that throws (on the old code: what it tests isn't there) is one FAIL, and the rest still run
  const crash = (name, e) => { R(`${name}: the section threw`, false, String(e && e.stack || e).slice(0, 300)); try { reset(); } catch (e2) { /* */ } };
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  dbg.freeze();
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  const stub = (a) => { if (a.bot) { if (!a.bot._u0) a.bot._u0 = a.bot.update; a.bot.update = () => { zero(a); if (a._go) { if (a._go.move) a.intent.move.copy(a._go.move); a.intent.fire = !!a._go.fire; a.intent.sub = !!a._go.sub; } }; } };
  const unstub = (a) => { if (a.bot && a.bot._u0) a.bot.update = a.bot._u0; };
  for (const a of m.actors) stub(a);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const place = (a, x, z, y = 0.02) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); a.grounded = true; a.form = 'kid'; };
  const park = (a, i) => place(a, -24 + (i % 4) * 2, 36 + Math.floor(i / 4) * 2);
  const aim = (a, yaw, pitch = 0) => { a.yaw = a.aimYaw = yaw; a.aimPitch = pitch; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = pitch; } };
  const reset = () => {
    hook = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); G.paint.clear();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a._go = null; a.status.shield = 0; a._bgHad = null; a._shieldChain = null;
      a.form = 'kid'; a.superJumpState = null; stub(a); a.character.root.visible = true;
    }
    m.actors.forEach(park);
    step(0.1);
  };
  const start = (a, id) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); return a.specialActive; };
  const kept = (a) => r3(a.special / a.specialCost());
  const DMG = []; on('damage', (e) => DMG.push(e));
  const dmgTo = (v, src, t0) => r2(DMG.filter((e) => e.victim === v && (!src || e.source === src) && e.t >= t0).reduce((s, e) => s + e.amount, 0));
  on('damage', (e) => { e.t = G.time; });
  const SPL = []; on('splatted', (e) => SPL.push({ v: e.victim, cause: e.cause, t: G.time }));
  // hits a Bubble Guard soaked up (filterDamage → 0 with a field up), per victim
  const SOAK = new Map(); { const f0 = G.specials.filterDamage.bind(G.specials); G.specials.filterDamage = (v, amt, atk, src) => { const sh = v.status.shield > 0, r = f0(v, amt, atk, src); if (sh && !(r > 0)) SOAK.set(v, (SOAK.get(v) || 0) + 1); return r; }; }
  const shoot = (a, from, to, dmg = 40) => G.projectiles.fireCustom(a, from, to.clone().sub(from).normalize(), { speed: 40, damage: dmg, range: 40, grav: 0, drag: 0, straight: 99, radius: 0.3 });
  const chestOf = (a) => V(a.pos.x, a.pos.y + 0.9, a.pos.z);
  const [E1, E2, E3] = foes, [M1, M2, M3] = mates;
  const respawnNow = (a) => { a.respawnTimer = 0.01; step(0.1); };
  // a throw through the real input path (press, then release the sub button)
  const throwSub = (a) => { a.intent.sub = true; a._go = { ...(a._go || {}), sub: true }; frame(); a._go.sub = false; a.intent.sub = false; frame(); };
  me.bot && (me.bot._u0 = me.bot._u0 || me.bot.update);

  // ======================================================================================== the gauge on a splat
  if (want('gauge')) try {
    const rows = [];
    // a splat mid-special at `t` s (or when `at()` says): the gauge kept against ½ × what the HUD showed (remaining)
    const mid = (id, t, prep, label) => {
      reset(); place(me, 0, -10); aim(me, 0);
      const s = start(me, id);
      if (prep) prep(s); else step(t);
      const hud = G.specials.remaining(me), share = G.specials.splatShare ? G.specials.splatShare(me) : null;
      me.splat(E1, 'test');
      const k = kept(me);
      rows.push({ special: label || id, hud: r3(hud), share: r3(share), kept: k, want: r3(0.5 * share), oldRule: 0.5 });
      return { hud, share, k };
    };
    const c8 = mid('crab', 1.8, null, 'crab 0.8'), c5 = mid('crab', 4.5, null, 'crab 0.5'), c2 = mid('crab', 7.2, null, 'crab 0.2');
    const zk = mid('zooka', 2.4);
    const bo = mid('booyah', 1.0, null, 'booyah (held)');
    const bl = mid('blower', 0, (s) => { me._go = { fire: true }; step(0.8); me._go = null; step(0.4); }, 'blower (1 of 3 blown)');
    const okShare = (r, want) => Math.abs(r.share - want) < 0.02 && Math.abs(r.hud - want) < 0.02 && Math.abs(r.k - 0.5 * r.share) < 0.002;
    R('gauge: splatted mid-special, the gauge keeps ½ of what was LEFT of it (the HUD\'s remaining) — Crab Rig at 0.8 / 0.5 / 0.2 → 0.4 / 0.25 / 0.1 (the old rule: 0.5 every time)',
      okShare(c8, 0.8) && okShare(c5, 0.5) && okShare(c2, 0.2) && c2.k < 0.11 && c8.k > 0.39, rows.slice(0, 3));
    R('gauge: the same for a Twister Zooka (0.6 left → 0.3) and a held Cheer Orb (its gauge stays full while held → 0.5)',
      okShare(zk, 0.6) && Math.abs(bo.share - 1) < 1e-6 && Math.abs(bo.k - 0.5) < 0.002, rows.slice(3, 5));
    R('gauge: a Bubble Blower with one bubble blown of three: ½ × (2/3 × the time left) — the bubble being blown counts as blown (it floats on: let go at the splat)',
      bl.share > 0.5 && bl.share < 0.67 && Math.abs(bl.k - 0.5 * bl.share) < 0.002 && Math.abs(bl.hud - bl.share) < 0.002, rows[5]);
    // what carries on without you: nothing cut short
    const db = mid('drainbow', 2.0);
    const st = mid('storm', 0.1, null, 'storm (thrown)');
    R('gauge: what carries on after the splat keeps nothing back — a Drainbow (its bubble stands on: its HUD gauge showed ' + r2(db.hud) + ') and an Ink Tempest already thrown → 0',
      db.share === 0 && db.k === 0 && db.hud > 0.6 && st.share === 0 && st.k === 0, rows.slice(6, 8));
    // into the sea mid-special (a body special: the Ink Jet — specials.js body(): the special ends, then the splat)
    reset(); place(me, 0, -10); aim(me, 0);
    start(me, 'jetpack'); step(2.0);
    place(me, 34, 0, -2.6); me.grounded = false;
    const hudW = G.specials.remaining(me);
    step(DT);
    const seaSplat = SPL[SPL.length - 1];
    R('gauge: falling into the sea mid-special (an Ink Jet, a body special) keeps ½ of what was left too (the old code gave 0 here: the special was ended before the splat)',
      seaSplat && seaSplat.v === me && seaSplat.cause === 'water' && hudW < 0.98 && hudW > 0.5 && Math.abs(kept(me) - 0.5 * hudW) < 0.01, { hud: r3(hudW), kept: kept(me), cause: seaSplat && seaSplat.cause });
    // it carries through the respawn
    reset(); place(me, 0, -10); start(me, 'crab'); step(4.5); me.splat(E1, 'test'); const k0 = kept(me);
    step(PLAYER.respawnTime + 0.5);
    R('gauge: what\'s kept is still there after the respawn', me.alive && Math.abs(kept(me) - k0) < 0.002 && Math.abs(k0 - 0.25) < 0.01, { atSplat: k0, afterRespawn: kept(me) });
    // no special running: as before
    const plain = (f) => { reset(); place(me, 0, -10); me.special = me.specialCost() * f; me.splat(E1, 'test'); return kept(me); };
    const p6 = plain(0.6), p10 = plain(1), p25 = plain(0.25);
    R('gauge: no special running — ½ of what you had, as before (0.6 → 0.3, full → 0.5, 0.25 → 0.125)', Math.abs(p6 - 0.3) < 0.002 && Math.abs(p10 - 0.5) < 0.002 && Math.abs(p25 - 0.125) < 0.002, { p6, p10, p25 });
  } catch (e) { crash('gauge', e); }

  // ======================================================================================== survives its owner
  if (want('survive')) try {
    // ---- Whirl Boomerang: splatted while it hovers; home to the spot they went down, circle it, burst there
    {
      reset(); place(me, 0, -10); aim(me, 0, 0); me.setSub('boomerang'); step(0.05);
      G.subs.use(me, SUBS.boomerang);
      const items = SUB_KITS.boomerang._items, it = items[items.length - 1];
      step(1.0);
      const stHover = it.state;
      const spot = me.pos.clone();
      place(E1, 1.4, -10.6);   // (a foe standing by where the thrower goes down)
      me.splat(E2, 'test');
      respawnNow(me);   // (back at the spawn while it's still out: it must not follow there)
      const states = new Set(); let orbitD = [], burstAt = null, blasted = false;
      const t0 = G.time;
      step(6, () => {
        states.add(it.state);
        if (it.state === 'orbit' && it.t > 0.3) orbitD.push(Math.hypot(it.pos.x - spot.x, it.pos.z - spot.z));
        if (it.blasted && !blasted) { blasted = true; burstAt = it.pos.clone(); }
        if (it.state === 'dead') return false;
      });
      const hurt = dmgTo(E1, 'boomerang', t0);
      R('survive: the Whirl Boomerang carries on when its thrower is splatted (was: fizzled) — it whirls home to where they went down (not to their respawn), circles that spot and bursts there',
        stHover === 'hover' && !states.has('fizzle') && states.has('back') && states.has('orbit') && blasted && orbitD.length && Math.max(...orbitD) < 2.2 && burstAt && Math.hypot(burstAt.x - spot.x, burstAt.z - spot.z) < 2.5 && me.pos.distanceTo(burstAt) > 20,
        { before: stHover, states: [...states], orbitR: orbitD.length && [r2(Math.min(...orbitD)), r2(Math.max(...orbitD))], burstFromSpot: burstAt && r2(Math.hypot(burstAt.x - spot.x, burstAt.z - spot.z)), ownerFromBurst: burstAt && r2(me.pos.distanceTo(burstAt)) });
      R('survive: …and it still hurts the foe standing there (its orbit / burst, credited to its thrower)', hurt > 20, { hurt });
    }
    // ---- Ink Tempest: thrown, owner splatted before the cloud forms; it rains its whole life
    {
      reset(); place(me, 0, -10); aim(me, 0, 0.15);
      start(me, 'storm'); step(0.1);
      me.splat(E2, 'test');
      let cloud = null; step(1.6, () => { cloud = G.projectiles.clouds[0] || null; if (cloud) return false; });
      const t0 = G.time;
      let life = 0, placed = false;
      step(SPECIALS.storm.duration + 1, () => {
        const c = G.projectiles.clouds[0];
        if (c) { life = c.t; if (!placed && c.t > 0.6) { placed = true; place(E1, c.group.position.x, c.group.position.z); } }
        if (!c && placed) return false;
      });
      const gp = cloud && cloud.group.position, st = gp ? G.paint.regionStats(gp.x, cloud.groundY, gp.z, 2, me.team, { own: 0, enemy: 0, empty: 0, n: 0 }) : null;
      R('survive: the Ink Tempest\'s cloud forms and rains its whole life after its thrower is splatted, inking and hurting a foe under it',
        !!cloud && life > SPECIALS.storm.duration - 0.1 && G.projectiles.clouds.length === 0 && dmgTo(E1, 'storm', t0) > 30 && st && st.own > 0.25,
        { cloud: !!cloud, life: r2(life), dmg: dmgTo(E1, 'storm', t0), ink: st && r2(st.own) });
    }
    // ---- Surf N' Turf: anchored, owner splatted; every ring still goes out, hitting; the buoy goes after the last
    {
      reset(); place(me, 0, -14); aim(me, 0, 0.2);
      const s = start(me, 'surf'); step(0.3); SURF.IMPL.throwIt(me, s);
      let b = null; step(3, () => { b = G.specials.world.find((w) => w.kind === 'surf'); if (b && b.phase !== 'fly') return false; });
      const S0 = { ...SURF.SURF_STATS };
      me.splat(E2, 'test');
      place(E1, b.pos.x + 5, b.pos.z);
      step(D_SURF_TIME());
      function D_SURF_TIME() { const D = SPECIALS.surf; return D.anchor + D.gap * (D.pulses - 1) + (D.rMax - D.r0) / D.speed + 1.5; }
      const S1 = SURF.SURF_STATS, gone = !G.specials.world.includes(b);
      R('survive: Surf N\' Turf\'s buoy keeps pulsing after its owner is splatted — all its rings go out (still hitting a foe in their way), then it goes as usual (not popped, not lost)',
        S1.rings - S0.rings === SPECIALS.surf.pulses && S1.hits - S0.hits >= 2 && gone && S1.popped === S0.popped && S1.lost === S0.lost,
        { rings: S1.rings - S0.rings, hits: S1.hits - S0.hits, gone, popped: S1.popped - S0.popped });
    }
    // ---- Drainbow: stands on for the rest of its life
    {
      reset(); place(me, 0, -10);
      start(me, 'drainbow'); step(1);
      const b = G.drainbow.bubbles.find((x) => x.live), life0 = b.life;
      me.splat(E2, 'test');
      step(0.2);
      const alive1 = b.live && b.orphan;
      // still halving shots: an enemy shot into a teammate inside
      place(M1, 0, -10); place(E1, 0, -22); step(0.05);
      M1.hp = PLAYER.hp; const t0 = G.time;
      shoot(E1, V(0, 0.9, -21.4), chestOf(M1)); step(0.8);
      const half = dmgTo(M1, null, t0);
      // still draining a foe inside
      place(E1, 1.5, -10); E1.ink = 100; PLAYER._r = PLAYER.inkRefillKid; PLAYER.inkRefillKid = 0; step(1); const drained = 100 - E1.ink; PLAYER.inkRefillKid = PLAYER._r;
      // the owner back from the respawn, inside with a foe: gains like any teammate; the life no longer grows
      respawnNow(me); place(me, -1.5, -10); me.special = 0; const lifeB = b.life;
      step(1);
      const gained = kept(me), lifeA = b.life;
      let popT = null; step(b.life - b.t + 1, () => { if (!b.live && popT == null) popT = b.t; });
      R('survive: the Drainbow stands on after its owner is splatted (was: popped) — still halving shots, still draining a foe inside',
        alive1 && Math.abs(half - 20) < 0.6 && drained > 6, { orphan: alive1, shotThrough: half, drained: r2(drained) });
      R('survive: …the owner back from the respawn gains in it like any teammate (meter, not bubble time); it pops on time (its life, no longer growing)',
        gained > 0.02 && Math.abs(lifeA - lifeB) < 1e-6 && Math.abs(lifeA - life0) < 0.25 && popT != null && Math.abs(popT - lifeA) < 0.1 && b.popReason === 'time',
        { meter: gained, life: [r2(life0), r2(lifeB), r2(lifeA)], poppedAt: popT && r2(popT), reason: b.popReason });
    }
    // ---- Bubble Blower: the bubbles float on
    {
      reset(); place(me, 0, -10); aim(me, 0);
      start(me, 'blower');
      me._go = { fire: true }; step(0.8); me._go = null; step(0.4); me._go = { fire: true }; step(0.5);
      const bubs = () => G.specials.world.filter((w) => w.kind === 'bubble');
      const before = bubs().map((w) => (w.held ? 'held' : 'free'));
      me._go = null; me.splat(E2, 'test'); step(0.1);
      const after = bubs().filter((w) => !w.dead), allFree = after.length === 2 && after.every((w) => !w.held);
      // a teammate's shot sets one off (a foe beside it caught in the blast)
      const w0 = after[0]; place(E1, w0.pos.x + 1.2, w0.pos.z); place(M1, w0.pos.x, w0.pos.z - 8); step(0.05);
      const t0 = G.time;
      shoot(M1, V(w0.pos.x, w0.pos.y, w0.pos.z - 7.4), w0.pos.clone(), 60); step(0.6);
      const blown = w0.dead, hurt = dmgTo(E1, 'blower', t0);
      // the other floats on to its own end
      const w1 = after[1]; let poppedAt = null; const life1 = w1.life;
      step(life1 + 0.5, () => { if (w1.dead && poppedAt == null) poppedAt = G.time; });
      R('survive: (unchanged — the user: "only bubble guard not bubble blower") the Bubble Blower\'s bubbles float on after its owner is splatted as they always did (the one being blown let go) — a teammate\'s shot still sets one off (hurting a foe), the other pops on its own time',
        before.includes('held') && allFree && blown && hurt > 40 && poppedAt != null, { before, after: after.length, blown, hurt, lifeLeft: r2(life1) });
    }
    // ---- a shared Bubble Guard
    {
      reset(); place(me, 0, -10); place(M1, 0.9, -10); step(0.05);
      start(me, 'bubbler'); step(0.3);
      const sh0 = M1.status.shield;
      me.splat(E2, 'test'); step(0.2);
      const sh1 = M1.status.shield;
      place(M1, 0, -4); place(E1, 0, -16); step(0.05); M1.hp = PLAYER.hp; const t0 = G.time, z0 = M1.pos.z, soak0 = SOAK.get(M1) || 0;
      let zMax = z0; shoot(E1, V(0, 0.9, -15.4), chestOf(M1), 40); step(0.5, () => { zMax = Math.max(zMax, M1.pos.z); });
      const hp = M1.hp, shoved = (SOAK.get(M1) || 0) > soak0 && zMax - z0 > 0.05;
      let endT = null; step(sh1 + 0.5, () => { if (!(M1.status.shield > 0) && endT == null) endT = G.time; });
      R('survive: a Bubble Guard shared onto a teammate outlives its maker — it keeps its time (runs out when it would have), and a shot still shoves instead of hurting',
        sh0 > 6 && Math.abs(sh1 - (sh0 - 0.2)) < 0.05 && hp === PLAYER.hp && shoved && endT != null, { shared: r2(sh0), afterSplat: r2(sh1), hp, soaked: (SOAK.get(M1) || 0) - soak0, shove: r2(zMax - z0), ranOut: endT != null });
      void t0;
    }
  } catch (e) { crash('survive', e); }

  // ======================================================================================== the Bubble Guard chain
  if (want('chain')) try {
    const CS = CH.CHAIN_STATS;
    reset();
    const [A, B, C] = [me, M1, M2];
    place(A, 0, -10); place(B, 10, -10); place(C, 20, -10); step(0.05);
    const n0 = CS.shares;
    start(A, 'bubbler'); step(1.0);
    place(B, 0.9, -10); step(DT);                                // B touches A
    const bGot = B.status.shield, aAt = A.status.shield;
    place(B, 10, -10); step(1.0);
    place(C, 10.9, -10); step(DT);                               // C touches B (A nowhere near)
    const cGot = C.status.shield, bAt = B.status.shield;
    R('chain: A\'s Bubble Guard → B by touch, then B → C by touch (A nowhere near) — each copy carries the time LEFT on the one it came from, not a fresh timer',
      Math.abs(bGot - aAt) < 0.02 && bGot < SPECIALS.bubbler.duration - 0.9 && Math.abs(cGot - bAt) < 0.02 && cGot < bGot - 0.9 && !!C._shieldChain && C._shieldChain === A._shieldChain,
      { b: r2(bGot), aThen: r2(aAt), c: r2(cGot), bThen: r2(bAt), fresh: SPECIALS.bubbler.duration });
    // on screen: the hint line (the user's own field / a copy), none once no teammate could take it
    const pA = G.specials.prompt(A), pB = CH.chainPrompt(B);
    (M3._bgHad || (M3._bgHad = new WeakSet())).add(A._shieldChain);
    const pNone = CH.chainPrompt(B);
    M3._bgHad = null;
    R('chain: on screen — the hint line says so: the user\'s own "… touch teammates to share it", a copy "… touch a teammate to pass it on"; none once every teammate has had it',
      /share it/.test(pA || '') && /pass it on/.test(pB || '') && pNone === null, { pA, pB, pNone });
    // (fix round 1) a copy's line only while a teammate who could take it is close by (CHAIN.hintReach): M3, the one left
    // who could, far off → none; within reach → the line
    const pFar = CH.chainPrompt(B, true), m3At = [M3.pos.x, M3.pos.z];
    place(M3, B.pos.x + CH.CHAIN.hintReach - 1, B.pos.z + 0.5);
    const pNear = CH.chainPrompt(B, true);
    place(M3, m3At[0], m3At[1]);
    R(`chain: a copy's hint line only with a teammate who could take it within ${CH.CHAIN.hintReach} m (none far off, the line close by)`, pFar === null && /pass it on/.test(pNear || ''), { pFar, pNear });
    // together for the rest of it: no refresh, everyone's runs out together
    place(A, 10.4, -9.4); step(DT);
    const ends = {};
    step(SPECIALS.bubbler.duration, () => { for (const [k, x] of [['A', A], ['B', B], ['C', C]]) if (!(x.status.shield > 0) && ends[k] == null) ends[k] = G.time; });
    const T = Object.values(ends);
    R('chain: no refresh loop — standing together for the rest of it there are exactly two shares (A→B, B→C) and all three fields run out together (within a frame)',
      CS.shares - n0 === 2 && T.length === 3 && Math.max(...T) - Math.min(...T) < 2.5 * DT, { shares: CS.shares - n0, spread: T.length === 3 ? r3(Math.max(...T) - Math.min(...T)) : null });
    // one field a player: C (holding A's) isn't topped up by another player's new Bubble Guard
    reset();
    place(A, 0, -10); place(B, 0.9, -10); place(C, 10, -10); place(M3, 20, -10); step(0.05);
    start(A, 'bubbler'); step(0.5); place(B, 10, -10); step(0.5); place(C, 10.9, -10); step(DT); place(C, 20, -12); step(1.0);
    const cBefore = C.status.shield, chainBefore = C._shieldChain;
    start(M3, 'bubbler'); place(M3, 20, -11.1); step(DT);
    R('chain: one field a player — C, holding a copy, takes nothing from another player\'s new Bubble Guard (its time and chain unchanged)',
      cBefore > 3 && Math.abs(C.status.shield - (cBefore - DT)) < 0.01 && C._shieldChain === chainBefore, { before: r2(cBefore), after: r2(C.status.shield) });
    // each chain once: B splatted and back can't take A's chain again from C; a new chain can reach it
    place(M3, 0, 20); step(DT);
    B.splat(E1, 'test'); respawnNow(B); place(B, 20.9, -12); step(DT);
    const bAgain = B.status.shield;
    R('chain: each chain once a player — B, splatted with its copy and back, takes nothing from C\'s copy of the same bubble', B.alive && !(bAgain > 0) && C.status.shield > 1, { b: bAgain, c: r2(C.status.shield) });
    place(M3, 21.8, -12); step(DT);
    R('chain: …but a new Bubble Guard (a new chain) reaches B', B.status.shield > 3 && B._shieldChain === M3._shieldChain, { b: r2(B.status.shield) });
    // copies pass on after the owner is splatted
    reset();
    place(A, 0, -10); place(B, 0.9, -10); place(C, 10, -10); step(0.05);
    start(A, 'bubbler'); step(0.3);
    A.splat(E1, 'test'); step(0.1);
    const bHas = B.status.shield;
    place(B, 10.9, -10); step(DT);
    R('chain: copies pass on after the Bubble Guard\'s owner is splatted (B → C)', bHas > 5 && C.status.shield > 5 && Math.abs(C.status.shield - B.status.shield) < 0.02, { b: r2(bHas), c: r2(C.status.shield) });
    // a chained copy shoves instead of hurting
    place(C, 0, -4); place(E1, 0, -16); step(0.05); C.hp = PLAYER.hp; const sk0 = SOAK.get(C) || 0;
    shoot(E1, V(0, 0.9, -15.4), chestOf(C), 40); step(0.5);
    R('chain: a chained copy shoves instead of hurting (C hit — the field soaked it — no damage)', C.hp === PLAYER.hp && C.status.shield > 0 && (SOAK.get(C) || 0) > sk0, { hp: C.hp, soaked: (SOAK.get(C) || 0) - sk0 });
    // (fix round 1) the hint line the HUD shows (main.js, real frames): you holding a copy — the chain's line with a
    // teammate close by who could take it, nothing about it with none near; a teammate charging a Cheer Orb: its prompt
    // wins (the chain's line is the last word)
    reset();
    const shown = () => (g.hud && g.hud._L ? g.hud._L.prompt : undefined) ?? null;
    place(M1, 0, -10); place(me, 0.9, -10); place(M2, 20, -10); place(M3, 26, -10); step(0.05);
    start(M1, 'bubbler'); step(DT); place(M1, 0, 24); step(0.1);
    const meCopy = me.status.shield;
    const hFar = shown();
    place(M2, 4.5, -10); step(0.1);
    const hNear = shown();
    const cheer = start(M3, 'booyah'); step(0.1);
    const hCheer = shown(), pCheer = CH.chainPrompt(me, true), charging = !!(M3.specialActive && M3.specialActive.id === 'booyah' && !M3.specialActive.thrown);
    if (M3.specialActive) G.specials.end(M3, 'test');
    // (the cheer prompt: this line on this branch's main.js; [b5-zipcheer] moves it to its own big HUD prompt and leaves
    // the line empty — either way the chain's line stays off)
    R('chain: on the HUD — you with a copy: "… pass it on" with a teammate close by, not with none near; a teammate\'s Cheer Orb charging: the chain\'s line goes (the cheer prompt shows)',
      meCopy > 3 && !/pass it on/.test(hFar || '') && /pass it on/.test(hNear || '') && charging && !!cheer && pCheer === null && !/pass it on/.test(hCheer || '') && (hCheer === null || /Cheer Orb/.test(hCheer)),
      { meCopy: r2(meCopy), hFar, hNear, hCheer, pCheer, charging });
  } catch (e) { crash('chain', e); }

  // ======================================================================================== Waddle Bomb Barrage
  if (want('waddle')) try {
    reset(); place(me, 0, -12); aim(me, 0, 0.12); place(E1, 0.5, -3); step(0.05);
    const s = start(me, 'barrage_waddle');
    me.ink = 5;
    const W = SUB_KITS.waddle.items, n0 = W.length;
    throwSub(me);
    const w1 = W[W.length - 1];
    throwSub(me);   // (at once: within its gap)
    const n1 = W.length - n0;
    step(SPECIALS.barrage_waddle.gap);
    throwSub(me);
    const n2 = W.length - n0;
    R('waddle: Waddle Bomb Barrage — Waddle Bombs with no ink (a 5 % tank), one per its gap (a second press at once: nothing), special bombs (no meter); the hand holds a Waddle',
      s.bomb.kind === 'waddle' && n1 === 1 && n2 === 2 && w1 && w1.sp && w1.owner === me && me.ink >= 5 && me.character.bomb?.kind === 'waddle',
      { bomb: s.bomb.kind, first: n1, afterGap: n2, sp: w1 && w1.sp, ink: me.ink, hand: me.character.bomb?.kind });
    const t0 = G.time; let blasted = false;
    step(6, () => { if (w1.blasted) { blasted = true; return false; } });
    R('waddle: one lands, waddles after the foe near it and bursts on them', blasted && dmgTo(E1, 'waddle', t0) > 30, { blasted, dmg: dmgTo(E1, 'waddle', t0), state: w1.state });
    step(SPECIALS.barrage_waddle.duration);
    R('waddle: it ends on time and the hand goes back to the loadout\'s sub', !me.specialActive && me.character.bomb?.kind === (me.sub || SUBS.bomb).kind, { hand: me.character.bomb?.kind });
    // (fix round 1) a barrage's Waddle senses and chases with the barrage's own numbers (config barrage_waddle
    // waddleSense / waddleLife; test values here, so agreeing numbers can't pass it), and so does its ghost on another
    // screen (built from the owner's [0 …] record while the owner's barrage runs there); the Waddle Bomb sub keeps its own
    reset();
    const BW = SPECIALS.barrage_waddle, keepBW = [BW.waddleSense, BW.waddleLife], sub0 = [me.subId, me.sub];
    BW.waddleSense = 4.2; BW.waddleLife = 3.3;
    try {
      place(me, 0, -12); aim(me, 0, 0.12); step(0.05);
      start(me, 'barrage_waddle'); step(DT); throwSub(me);
      const wb = W[W.length - 1];
      G.specials.netGhost(E3, [0, SPECIAL_ORDER.indexOf('barrage_waddle')]);
      SUB_KITS.waddle.ghost(E3, [0, 90017, 6, 1.4, 20, 0, 2, -3]);
      const wg = W.find((x) => x.gid === 90017);
      if (E3.specialActive) G.specials.end(E3, 'net');
      G.specials.end(me, 'test'); step(0.05);
      me.setSub('waddle'); me.ink = PLAYER.inkMax; step(DT); throwSub(me);
      const ws = W[W.length - 1];
      const nums = (w) => w && [w.sub.senseRadius, w.sub.life];
      R('waddle: a barrage\'s Waddle senses / chases with the barrage\'s own numbers (waddleSense, waddleLife), its ghost on another screen too; the Waddle Bomb sub its own',
        wb && wb.sp && wb.owner === me && wb.sub.senseRadius === 4.2 && wb.sub.life === 3.3 && wg && wg.ghost && wg.sub.senseRadius === 4.2 && wg.sub.life === 3.3
        && ws && ws !== wb && !ws.sp && ws.sub === SUBS.waddle && ws.sub.senseRadius === SUBS.waddle.senseRadius, { barrage: nums(wb), ghost: nums(wg), sub: nums(ws), subCfg: [SUBS.waddle.senseRadius, SUBS.waddle.life] });
    } finally { BW.waddleSense = keepBW[0]; BW.waddleLife = keepBW[1]; me.subId = sub0[0]; me.sub = sub0[1]; me.character.setSub?.((sub0[1] || SUBS.bomb).kind); }
  } catch (e) { crash('waddle', e); }

  // ======================================================================================== Mystery Bomb Barrage
  if (want('mystery')) try {
    reset(); place(me, 0, -30); aim(me, 0, 0.3); step(0.05);
    const card = g.hud?.barrage;
    const s = start(me, 'barrage_mystery'); s.dur = 9999;   // (long enough for many throws)
    const KINDS = SPECIALS.barrage_mystery.mystery;
    const thrown = []; const offB = on('bomb:throw', (e) => { if (e.actor === me) thrown.push('bomb'); });
    const offS = on('sub:use', (e) => { if (e.actor === me) thrown.push(e.kind); });
    // the kind a throw made (the Splat Bomb: weapons.js's bomb list; the rest their sub items / kits)
    const rows = []; let shownOk = 0, handOk = 0, promptOk = 0, badgeOk = 0, changes = 0, gapOk = 0, gapBad = [];
    // (fix round 1) the card read on EVERY real frame (the HUD drawn by the game's own frame, as in play — no settling
    // it by hand), from the throw's own frame to the frame the next throw is first allowed: the bomb the next throw
    // will be, icon and name, every time — never another (it used to spin through other bombs for 0.3 s, longer than a
    // Pop Pellet's 0.2 s gap)
    let cardFrames = 0, cardOff = 0; const cardBad = [], atAllowed = {};
    const cardIs = (kind) => { const st = card ? card.state() : null; return !!(st && st.on && st.kind === kind && st.name === SUBS[kind].name); };
    step(0.05);
    for (let i = 0; i < 120; i++) {
      const next = s.bomb.kind;
      // shown before the throw: the hand, the HUD card, the sub badge (main.js frame subKind), the hint line — read on
      // the frame before the throw is first allowed (what the player sees as they let go)
      while (G.time + DT < s.nextThrow) { frame(); cardFrames++; if (!cardIs(next)) { cardOff++; if (cardBad.length < 4) cardBad.push({ next, card: card && card.state(), left: r3(s.nextThrow - G.time) }); } }
      if (cardIs(next)) shownOk++;
      if (me.character.bomb?.kind === next) handOk++;
      if ((G.specials.prompt(me) || '').includes(SUBS[next].name)) promptOk++;
      if ((me.specialActive?.kind === 'barrage' ? me.specialActive.bomb : me.sub).kind === next) badgeOk++;
      // then the throw, the frame it's allowed
      while (G.time < s.nextThrow) frame();
      const n0 = thrown.length; let tT = null; const offT = on('barrage:throw', (e) => { if (e.actor === me) tT = G.time; });
      throwSub(me); offT();
      // the throw's own frame: the card already on the new one
      cardFrames++; if (!cardIs(s.bomb.kind)) { cardOff++; if (cardBad.length < 4) cardBad.push({ thrown: next, next: s.bomb.kind, card: card && card.state(), at: 'throw frame' }); }
      // (the reviewer's case: right after a Pop Pellet / a Splat Bomb, the two shortest gaps)
      if ((next === 'burst' || next === 'bomb') && !atAllowed[next]) { let f = 0; const k = s.bomb.kind; while (G.time < s.nextThrow) { frame(); f++; } atAllowed[next] = { gap: r2(BAR.gapOf(next, s.def)), frames: f, next: k, card: card && card.state(), ok: cardIs(k) }; }
      const got = thrown[n0] || null;
      rows.push([next, got]);
      if (s.bomb.kind !== next) changes++;
      // its gap: the next throw is refused until gapOf(kind) has passed
      const gap = BAR.gapOf(next, s.def), want = tT + gap;
      if (Math.abs(s.nextThrow - want) < 1.5 * DT) gapOk++; else gapBad.push([next, r3(s.nextThrow - tT)]);
      if (i % 10 === 9) { G.subs.clear(); G.projectiles.clear(); SUB_KITS.waddle.clear?.(); SUB_KITS.boomerang?.clear?.(); }   // (keep the deck clear)
    }
    offB(); offS();
    const match = rows.filter(([n, t]) => n === t).length, repeats = rows.filter((r, i) => i && r[1] === rows[i - 1][1]).length;
    const counts = Object.fromEntries(KINDS.map((k) => [k, rows.filter((r) => r[1] === k).length]));
    R('mystery: each throw is the bomb that was shown next (120 throws)', match === 120, { match, sample: rows.slice(0, 8) });
    R('mystery: the next bomb shows before the throw — in the hand (the sub prop), on the HUD\'s NEXT card (icon + name), the sub badge and the hint line',
      handOk === 120 && shownOk === 120 && promptOk === 120 && badgeOk === 120, { handOk, shownOk, promptOk, badgeOk });
    R(`mystery: the NEXT card shows the bomb the next throw will be on every frame from the throw on (${cardFrames} real 1/60 s frames over 120 throws) — never another bomb, never mid-spin`,
      cardFrames > 600 && cardOff === 0, { cardFrames, cardOff, bad: cardBad });
    R('mystery: …so after a Pop Pellet (0.2 s gap) and a Splat Bomb (0.3 s), when the next throw is first allowed, the card already shows that next bomb',
      !!(atAllowed.burst && atAllowed.burst.ok && atAllowed.burst.gap === 0.2 && atAllowed.bomb && atAllowed.bomb.ok), atAllowed);
    R('mystery: it changes bomb every throw — never the same twice running', changes === 120 && repeats === 0, { changes, repeats });
    R('mystery: over 120 throws every kind comes up, evenly (each 20 ± 2: a shuffled round of all six at a time)', KINDS.every((k) => Math.abs(counts[k] - 20) <= 2), counts);
    R('mystery: each throw waits its own bomb\'s barrage gap (Splat Bomb 0.3, Cling 0.4, Pop Pellet 0.2, Skitter 0.5, Murk 0.45, Waddle 0.5)',
      gapOk === 120 && BAR.gapOf('burst', s.def) === 0.2 && BAR.gapOf('waddle', s.def) === 0.5 && BAR.gapOf('seeker', s.def) === 0.5, { gapOk, bad: gapBad.slice(0, 4) });
    // a throw marks the new bomb on the card: its icon drops in (a reel stopping) and the card pops, in the throw's frame
    const nb0 = s.bomb.kind, p0 = card ? card.state().popped : 0;
    while (G.time < s.nextThrow) frame();
    throwSub(me);
    const land = card ? card.state() : null;
    const marks = !!(card && card.icon.classList.contains('is-drop') && card.el.classList.contains('is-land'));
    R('mystery: a throw marks the new bomb on the NEXT card in that same frame — the icon drops in, the card pops — on the new bomb', land && land.kind === s.bomb.kind && s.bomb.kind !== nb0 && land.popped === p0 + 1 && marks, { land, marks, was: nb0 });
    G.specials.end(me, 'time'); card?.update(0.1);
    const offCard = card ? card.state() : null;
    reset(); place(me, 0, -30); start(me, 'barrage_sticky'); step(0.1); card?.update(0.1);
    const plainCard = card ? card.state() : null;
    R('mystery: the card goes when it ends; a plain barrage shows none (its bomb never changes)', offCard && !offCard.on && plainCard && !plainCard.on, { offCard, plainCard });
    // online: the owner records each next bomb as the special's moment [4, 'nb', SUB_ORDER index] — a ghost follows it
    reset();
    const recs = []; const NM = G.netm; const fake = { recKit: (a, kind, d) => { if (a === me && kind === 'sp') recs.push(JSON.parse(JSON.stringify(d))); }, recBomb() {} };   // (recBomb: the first bomb may be a Splat Bomb — fix round 1: without it that one in six threw here)
    G.netm = fake;
    try { const s2 = start(me, 'barrage_mystery'); step(0.05); while (G.time < s2.nextThrow) frame(); throwSub(me); } finally { G.netm = NM; }
    const nbs = recs.filter((d) => d[0] === 4 && d[1] === 'nb').map((d) => SUB_ORDER[d[2]]);
    const ghost = E3; G.specials.netGhost(ghost, [0, SPECIAL_ORDER.indexOf('barrage_mystery')]);
    for (const k of nbs) G.specials.netGhost(ghost, [4, 'nb', SUB_ORDER.indexOf(k)]);
    const gs = ghost.specialActive;
    R('mystery online: the owner records its first bomb and each next one ([4, \'nb\', index]); a ghost built from those holds the same bomb (hand prop too)',
      recs[0] && recs[0][0] === 0 && nbs.length === 2 && gs && gs.ghost && gs.bomb.kind === nbs[1] && ghost.character.bomb?.kind === nbs[1], { recs, ghost: gs && gs.bomb.kind });
    if (ghost.specialActive) G.specials.end(ghost, 'net');
  } catch (e) { crash('mystery', e); }

  // ======================================================================================== bots
  if (want('bots')) try {
    const botRun = (id) => {
      reset(); place(E1, 0, -16); aim(E1, 0); place(me, 0, -5); unstub(E1);   // (no invuln on the foe: bots hold fire on the untouchable)
      E1.specialId = id; E1.special = E1.specialCost(); E1.ink = PLAYER.inkMax;
      const kinds = new Set(); let used = false;
      const offB = on('bomb:throw', (e) => { if (e.actor === E1) kinds.add('bomb'); });
      const offS = on('sub:use', (e) => { if (e.actor === E1 && E1.specialActive?.kind === 'barrage') kinds.add(e.kind); });
      const offU = on('special:use', (e) => { if (e.actor === E1) used = true; });
      let n = 0; const offN = on('barrage:throw', (e) => { if (e.actor === E1) n++; });
      step(12, () => { me.hp = PLAYER.hp; if (used && !E1.specialActive && n > 0) return false; });
      offB(); offS(); offU(); offN(); stub(E1);
      return { used, throws: n, kinds: [...kinds] };
    };
    const bw = botRun('barrage_waddle'), bm = botRun('barrage_mystery');
    R('bots: a bot with the Waddle Bomb Barrage, a foe in front, pops it and throws Waddles', bw.used && bw.throws >= 3 && bw.kinds.includes('waddle'), bw);
    R('bots: …with the Mystery Bomb Barrage, throws several kinds', bm.used && bm.throws >= 3 && bm.kinds.length >= 3, bm);
    // a bot with a shared copy walks over to pass it on
    reset();
    place(M1, 0, -10); place(me, 0.9, -10); place(M2, 4, -10); place(E1, 0, 30); step(0.05);
    for (const x of [M1, M2]) unstub(x);
    M2._go = null; M2.bot.update = () => { zero(M2); };   // (M2 stands still)
    start(me, 'bubbler'); step(DT);
    const m1Got = M1.status.shield, meA = me.alive, d1 = r2(me.pos.distanceTo(M1.pos));
    place(me, 0, 20);   // (its maker gone: only M1 can pass it to M2)
    const s0 = CH.CHAIN_STATS.botSteps;
    let got = null; step(3, () => { if (M2.status.shield > 0 && got == null) got = G.time; });
    stub(M1); stub(M2);
    R('bots: a bot holding a shared Bubble Guard walks over to a teammate close by and passes it on', M1.status.shield > 0 && got != null && CH.CHAIN_STATS.botSteps > s0, { m1Got: r2(m1Got), meAlive: meA, d1, got: got != null, steps: CH.CHAIN_STATS.botSteps - s0 });
  } catch (e) { crash('bots', e); }

  // ======================================================================================== the list
  if (want('list')) try {
    const L = SPECIAL_ORDER.slice(-2);
    R('list: both appended at the END of SPECIAL_ORDER (online records index into it)', L[0] === 'barrage_waddle' && L[1] === 'barrage_mystery' && SPECIAL_ORDER.indexOf('drainbow') === 20, { tail: SPECIAL_ORDER.slice(-4) });
    const icons = ['barrage_waddle', 'barrage_mystery'].map((id) => SPECIAL_ICONS[id] || '');
    R('list: each has its own icon (not the fallback), a name and a blurb, kind barrage',
      icons.every((x) => x.length > 400 && x !== SPECIAL_ICONS.slam) && icons[0] !== icons[1] && SPECIALS.barrage_waddle.name === 'Waddle Bomb Barrage' && SPECIALS.barrage_mystery.name === 'Mystery Bomb Barrage' && SPECIALS.barrage_mystery.blurb.length > 30 && SPECIALS.barrage_waddle.kind === 'barrage' && SPECIALS.barrage_mystery.kind === 'barrage',
      { len: icons.map((x) => x.length) });
  } catch (e) { crash('list', e); }

  reset();
  return out;
})();
