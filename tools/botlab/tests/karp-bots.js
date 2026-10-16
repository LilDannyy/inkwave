// [b5-karp-bots] Bazookarp bots (SPEC §8, §11 WP3): every scenario of WP3's test list, on karpbox, deterministic (frozen clock,
// stepped at 60 Hz). Each scenario runs only the bots it is about (the rest idle on their spawn decks, unless it says so).
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=A,B,…' runs some groups:
//   A  breakers keep outside the burst while the other team's side of the meter is ≥ 70 % (normal) / 60 % (hard)
//   B  melee breakers: out to the ring above 50 % of theirs, ≥ 2.9 m from the centre above 70 % of ours
//   C  no bot takes touch damage in 20 bursts (all eight bots playing)
//   D  the grabber waits at 3.0–3.2 m and grabs within 0.2 s after the hold (normal; 5 bursts)
//   E  an autopilot carrier: 3 scripted carries, no retreat ×3, no own free zone, no stuck episode > 3 s
//   F  carriers holding the mitts, blade, brolly, bow, roller, a charger and the twins (3 carries each, a foe in sight):
//      zero shots of their own weapon, sub throws, sub:cantuse, specials, climbs, Mitts leaps, dodge rolls
//   G  every forward route closed: a short ×3 (carrierRetreatFallback) instead of standing still
//   H  a bot standing where a Big Burst lands leaves the disc before it blows (normal: ≥ 16 of 20)
//   I  the keeper holds the Gate when it opens, and the weir on the carrier's route when there are two
//   J  interceptors don't track a hidden carrier through walls; a wake is noticed at ≤ 20 m with a line, not through a wall
//   K  the knockback push through enemy ink (normal and hard; never easy)
//   L  our carrier's last fuse seconds: a danger to its teammates, never to itself
//   M  the layout's route hints are the carrier's candidates; known foes on one move the pick
//   N  a respawned bot super jumps to our carrier ≥ 35 m off; defenders stay home
//   O  a fuse that can't make it: over the halfway line first
//   P  walkers (Skitter, Waddle) go round the shell to a foe behind it
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF, KARPBOX_TWO } = await import('./tools/botlab/karpbox.js');
  const { KARP_GUN, radiusOf, speedOf } = await import('./src/game/karpGun.js');
  const { KARP_BOT, KARP_AI, karpPlan, resetKarpStats } = await import('./src/game/botsKarp.js');
  const { SIGHT } = await import('./src/game/botSight.js');
  const { specialDangers } = await import('./src/game/botSpecials.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v))) });
  const only = (window.__pageArgs || '').match(/only=([\w,]+)/)?.[1]?.split(',') || null;
  const want = (k) => !only || only.includes(k);
  if (m.mode !== 'bazookarp' || !m.karp) { R('a Bazookarp match on karpbox', false, { mode: m.mode }); return out; }
  dbg.freeze();
  const frame = () => { g._skipRender = true; g._frame(1 / 60); g._skipRender = false; };
  const step = (s, each) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (each && each(i) === false) return false; } return true; };
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const proto = Object.getPrototypeOf(m.actors.find((a) => a.bot).bot).update;
  const idleIt = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const sleep = (a) => { if (a.bot) a.bot.update = function () { idleIt(a); }; idleIt(a); };
  // (_wasDead: a bot respawned by put() would otherwise take its respawn super jump — to a teammate parked on its deck)
  const wake = (a, diff = 'normal') => { if (!a.bot) return; delete a.bot.update; if (a.bot.update !== proto) a.bot.update = proto; a.bot.setDifficulty(diff); a.bot.reset(); a.bot._wasDead = false; };
  const floorY = (x, z, hint = 3) => { const y = G.level.groundHeight(x, z, hint); return y > -50 ? y : 0; };
  const put = (a, x, z, y = null) => {
    if (!a.alive) a.respawn();
    a.superJumpState = null; if (a.specialActive) G.specials.end(a, 'test');
    a.pos.set(x, y ?? floorY(x, z), z); a.vel.set(0, 0, 0); a.grounded = false; a.smoothY = 0; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.climbing = false; a.submerged = false;
    a.status.track = 0; a.status.shield = 0; a.ink = PLAYER.inkMax; idleIt(a);
    if (a.bot) { a.bot.path = null; a.bot.target = null; a.bot.tv = null; a.bot.tk = null; a.bot._wasDead = false; }
  };
  const park = (list = m.actors) => { for (const a of list) { const p = G.level.spawnPads[a.team]; put(a, p.x + ((a.slot % 4) - 1.5) * 1.6, p.z + (a.team ? 2.5 : -2.5), p.y); } };
  let Kp = m.karp;
  const fresh = (def = KARPBOX_DEF) => {
    Kp?.dispose(); G.level.layout.bazookarp = def;
    m.time = 250; m.state = 'playing'; m.result = null;
    // (a clean slate: the last scenario's specials, projectiles, devices, ink and shots gone — as bot-climb.js does)
    for (const a of m.actors) { if (a.specialActive) G.specials.end(a, 'test'); a.superJumpState = null; }
    G.specials.clear(); G.projectiles.clear(); G.subs.clear(); G.paint.clear();
    for (const it of [...(G.subs?.items || [])]) G.subs._destroy?.(it);
    KARP_GUN.clear();
    m.karp = Kp = new Bazookarp(m, new LoopWire());
    for (const a of m.actors) { sleep(a); if (a.bot) { a.bot.sight.reset(); a.bot.sp.reset(); } }
    park(); step(0.05);
    resetKarpStats();
    return Kp;
  };
  const restAt = (p, hp = 500) => { Kp.pos.copy(p); Kp.restNode = -1; Kp.shell.form(p, hp, 0); Kp._setPhase('shielded'); };
  const freeAt = (p) => { Kp.shell.clear(); Kp.pos.copy(p); Kp.restNode = -1; Kp._setPhase('free', 0); };
  const grant = (a) => { freeAt(V(a.pos.x, a.pos.y, a.pos.z)); step(2 / 60); return Kp.holder === a; };
  const pinMeter = (frac) => { if (Kp.shell.state === 'intact') { Kp.shell.m = frac * Kp.shell.hp; Kp.shell.quiet = 0; } };
  const hd = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  const ev = []; const offs = ['karp:burst', 'karp:pickup', 'karp:plant', 'karp:end', 'damage', 'weapon:fire', 'sub:use', 'sub:cantuse', 'special:use', 'mitts:leap', 'weapon:dodge', 'actor:dodge', 'hit'].map((k) => on(k, (e) => ev.push([k, e, G.time, !!e?.actor?.carry])));   // (carrying at the moment it happened)
  const evs = (k) => ev.filter((e) => e[0] === k);
  const keepAlive = (list) => { for (const a of list) { if (!a.alive) { a.respawn(); if (a.bot) a.bot._wasDead = false; } a.hp = PLAYER.hp; } };
  // a team round the shell at r m on its own side (spread)
  const ring = (list, r) => list.forEach((a, i) => { const t = a.team, ang = (t ? 0 : Math.PI) + (i - (list.length - 1) / 2) * 0.5; put(a, Math.sin(ang) * r, Math.cos(ang) * r); });

  try {
  // ============================================================================ A. breakers outside the burst
  if (want('A')) {
    for (const [diff, frac] of [['normal', 0.72], ['hard', 0.62]]) {
      fresh();
      for (const a of m.actors) a.setWeapon(['shooter', 'blaster', 'spinner', 'bucket'][a.slot % 4]);
      for (const a of m.actors) wake(a, diff);
      ring(A, 4.2); ring(B, 7);   // (Alpha starts inside the danger disc)
      Kp.shell.add = () => {};   // (pinned: the bots' own hits never burst it here — 800 hp since the tuning)
      // Bravo's side at frac (the danger for Alpha), held there; nobody hurt (so nobody's splatted off the field)
      let minA = Infinity, n = 0; const dbgA = [];
      step(4, (i) => {
        pinMeter(-frac); for (const a of m.actors) { a.invuln = 2; a.hp = PLAYER.hp; }
        if (i > 90) for (const a of A) if (a.alive) { const c = Kp.shell.center(), d = Math.hypot(a.pos.x - c.x, a.pos.z - c.z); if (d < minA && d < 5.3) dbgA.push({ i, n: a.name, w: a.weaponId, d: +d.toFixed(2), role: a.bot.kRole, mode: a.bot.mode, esc: !!a.bot.sp.esc, known: a.bot.sp.known.map((r) => r.d.src), tgt: a.bot.target?.name, see: a.bot.seeTimer > 0, pos: [+a.pos.x.toFixed(1), +a.pos.z.toFixed(1)], v: +Math.hypot(a.vel.x, a.vel.z).toFixed(1), sq: a.form }); minA = Math.min(minA, d); n++; }
      });
      const shoot = KARP_BOT.stats.breakT;
      R(`A ${diff}: with Bravo's side at ${frac * 100} % the Alpha bots placed 4.2 m out leave the burst (4.5 m) from 1.5 s on — the ring they keep is 5.5 m — still shooting it`, minA >= 4.6 && minA < 12 && n > 0 && shoot > 1, { minA, samples: n, breakT: shoot, dangerKnown: KARP_AI.diff[diff].danger, dbg: dbgA.slice(-6) });
    }
    // easy ignores the meter (the danger area is off for an easy team)
    fresh();
    for (const a of m.actors) wake(a, 'easy');
    pinMeter(-0.75); step(0.1, () => pinMeter(-0.75));
    const dz = specialDangers().filter((d) => d.src === 'karpshell');
    pinMeter(0.75); step(0.05, () => pinMeter(0.75));
    for (const a of m.actors) wake(a, 'normal');
    pinMeter(-0.75); step(0.05, () => pinMeter(-0.75));
    const dn = specialDangers().filter((d) => d.src === 'karpshell');
    R('A easy: no shell danger area for an easy team (it ignores the meter); normal: one, for the team behind', dz.length === 0 && dn.length === 1 && dn[0].team === 1, { easy: dz.length, normal: dn.map((d) => ({ team: d.team, r: d.r })) });
  }

  // ============================================================================ B. melee breakers
  if (want('B')) {
    fresh();
    const mel = ['roller', 'blade', 'mitts', 'brush'];
    for (const a of A) a.setWeapon(mel[a.slot % 4]);
    for (const a of A) wake(a, 'normal');
    ring(A, 2.9);
    Kp.shell.add = () => {};   // (pinned: their hits never burst it here)
    // (a) their side 55 %: out to the ring
    let minOut = Infinity, maxOut = 0; step(5, (i) => { pinMeter(-0.55); keepAlive(A); for (const a of m.actors) a.invuln = 2; if (i > 200) for (const a of A) { const d = hd(a.pos, Kp.shell.center()); minOut = Math.min(minOut, d); maxOut = Math.max(maxOut, d); } });
    // (b) our side 75 %: close in, but never inside max(2.5, r + 0.88) — ≥ 2.9 m
    let minIn = Infinity, maxIn = 0;
    step(6, (i) => { pinMeter(0.75); keepAlive(A); for (const a of m.actors) a.invuln = 2; if (i > 270) for (const a of A) { const d = hd(a.pos, Kp.shell.center()); minIn = Math.min(minIn, d); maxIn = Math.max(maxIn, d); } });
    // (c) neutral: close in to break it (2.5 m)
    let near = 0; step(4, (i) => { pinMeter(0); keepAlive(A); if (i > 180) for (const a of A) if (hd(a.pos, Kp.shell.center()) < 4.6) near++; });
    R('B melee breakers (placed 2.9 m out): at 55 % of theirs out on the ring (5.5–9 m); at 75 % of ours ≥ 2.9 m from the centre and still close (≤ 5 m: in reach to hit it)', minOut >= 5.3 && maxOut <= 10 && minIn >= 2.9 && maxIn <= 5, { minOut, maxOut, minIn, maxIn, neutralCloseFrames: near, shellR: Kp.shell.radius() });
  }

  // ============================================================================ C. no touch damage in 20 bursts
  if (want('C')) {
    fresh();
    const WEAPS = ['shooter', 'blaster', 'spinner', 'bucket', 'roller', 'charger', 'twins', 'blade'];
    for (const a of m.actors) a.setWeapon(WEAPS[(a.slot + a.team * 4) % WEAPS.length]);
    for (const a of m.actors) wake(a, 'normal');
    let bursts = 0, touches = 0, frames = 0;
    const off = on('karp:burst', () => bursts++);
    const who = [];
    const offD = on('damage', (e) => { if (e.source === 'karp-touch' && e.victim?.bot) { touches++; if (who.length < 6) who.push({ n: e.victim.name, w: e.victim.weaponId, role: e.victim.bot.kRole, mode: e.victim.bot.mode, ph: Kp.phase, d: +hd(e.victim.pos, Kp.shell.center()).toFixed(2), r: +Kp.shell.radius().toFixed(2), esc: !!e.victim.bot.sp.esc, side: +karpPlan().side(e.victim.team).toFixed(2), vel: [+e.victim.vel.x.toFixed(1), +e.victim.vel.z.toFixed(1)], mv: [+e.victim.intent.move.x.toFixed(2), +e.victim.intent.move.z.toFixed(2)], form: e.victim.form, spot: e.victim.bot.kSpot ? +hd(e.victim.bot.kSpot, Kp.shell.center()).toFixed(2) : null, tgt: e.victim.bot.target?.name, sq: e.victim.intent.squid, fire: e.victim.intent.fire, grounded: e.victim.grounded, y: +(e.victim.pos.y).toFixed(2), kb: e.victim._kbT ?? null, st: Kp.shell.state, hist: (e.victim._kbHist || []).slice(-8) }); } });
    const pond = Kp.R.pond.clone();
    restAt(pond, 300);
    while (bursts < 20 && frames < 60 * 260) {
      frame(); frames++;
      for (const a of m.actors) { const h = a._kbHist || (a._kbHist = []); h.push([+hd(a.pos, Kp.shell.center()).toFixed(2), +Kp.shell.radius().toFixed(2), a.bot?.kRole, a.bot?.mode, +a.intent.move.x.toFixed(2), +a.intent.move.z.toFixed(2), +a.vel.x.toFixed(1), +a.vel.z.toFixed(1)]); if (h.length > 12) h.shift(); }
      if (Kp.phase !== 'shielded' && Kp.phase !== 'reforming') {
        // after the burst: a moment for the grab, then a fresh shell back at the Pond (no carries: the shell is the test)
        if ((Kp._tC = (Kp._tC || 0) + 1) > 40) { if (Kp.holder) Kp._release(Kp.holder); Kp._reform(pond, -1, 300); Kp._tC = 0; }   // (a re-form grows 0.8 s, shoving: as the game's)
      }
    }
    off(); offD();
    R('C no bot takes touch damage (karp-touch) in 20 bursts, all eight bots playing', bursts >= 20 && touches === 0, { bursts, touches, simS: frames / 60, who });
  }

  // ============================================================================ D. the grabber's wait and grab
  if (want('D')) {
    const res = [];
    for (let k = 0; k < 5; k++) {
      fresh();
      const gA = A[k % A.length];
      gA.setWeapon(['shooter', 'roller', 'blaster', 'twins', 'spinner'][k]); gA.setSub('bomb');   // (a plain sub: no kit dodge to carry it off its spot)
      wake(gA, 'normal');
      put(gA, 0, -9);
      restAt(Kp.R.pond.clone(), 500);
      // our side at 90 %: the grabber closes to 3.0–3.2 m and holds there
      const add0 = Kp.shell.add; Kp.shell.add = () => {};   // (its own shots never burst it during the wait)
      let rr = []; step(3.5, (i) => { pinMeter(0.9); gA.hp = PLAYER.hp; if (i > 150) rr.push(hd(gA.pos, Kp.shell.center())); });
      Kp.shell.add = add0;
      const rMin = Math.min(...rr), rMax = Math.max(...rr), role = gA.bot.kRole, spot = gA.bot.kSpot ? +hd(gA.bot.kSpot, Kp.shell.center()).toFixed(2) : null, mode = gA.bot.mode;
      // the burst (Alpha's): the time to its pick-up
      const t0 = G.time; let tp = null;
      Kp.shell.add(0, Kp.shell.hp * 2, gA);
      step(2, () => { if (Kp.holder === gA && tp === null) tp = G.time - t0; if (tp !== null) return false; });
      res.push({ w: gA.weaponId, role, rMin, rMax, spot, mode, grabAfterHold: tp === null ? null : +(tp - K.pickHold).toFixed(3) });
    }
    const ok = res.every((r) => r.role === 'grab' && r.rMin >= 2.95 && r.rMax <= 3.3 && r.grabAfterHold !== null && r.grabAfterHold <= 0.2 + 1 / 60 && r.grabAfterHold >= -1e-6);   // (3.3: the ring 3.0–3.2 + one stride of drift)
    R('D the grabber waits 3.0–3.2 m out at ≥ 85 % of ours and grabs within 0.2 s after the 0.25 s hold (normal; 5 bursts)', ok, res);
  }

  // ============================================================================ E. an autopilot carrier: 3 carries
  if (want('E')) {
    fresh();
    const c = A[0]; c.setWeapon('shooter'); wake(c, 'normal');
    const carries = [];
    const carry = (x, z, until, maxS = 40) => {
      put(c, x, z); step(1 / 60); grant(c);
      const s0 = { ret: Kp.stats.fastT.retreat || 0, zone: Kp.stats.fastT.zone || 0 };
      const hist = []; let stuck = 0, t = 0, done = null;
      step(maxS, () => {
        t += 1 / 60; c.hp = PLAYER.hp;
        hist.push([t, c.pos.x, c.pos.z]); while (hist.length && t - hist[0][0] > 3) hist.shift();
        if (hist.length > 170 && Math.max(...hist.map((h) => Math.hypot(h[1] - c.pos.x, h[2] - c.pos.z))) < 1) stuck++;
        if (until()) { done = t; return false; }
      });
      carries.push({ from: [x, z], t: done, ret: (Kp.stats.fastT.retreat || 0) - s0.ret, zone: (Kp.stats.fastT.zone || 0) - s0.zone, stuckFrames: stuck, fallback: KARP_BOT.stats.retreatFallback });
    };
    carry(0, 0, () => Kp.lowered[0]);                                         // the Pond → the weir (a plant)
    carry(Kp.weirs[0][0].pos.x, Kp.weirs[0][0].pos.z, () => Kp.winner === 0); // the weir → the Gate (a knockout)
    fresh(); wake(c, 'normal');
    carry(-4, -22, () => Kp.lowered[0]);                                      // deep on its own half → forward to the weir
    const ok = carries.length === 3 && carries.every((r) => r.t !== null && r.ret === 0 && r.zone === 0 && r.stuckFrames === 0);
    R('E an autopilot carrier finishes 3 scripted carries (Pond → weir, weir → Gate, own half → weir) with no retreat ×3, no own free zone, no stuck > 3 s', ok, carries);
  }

  // ============================================================================ F. carriers with kit weapons: the gate
  if (want('F')) {
    const rows = [];
    for (const w of ['mitts', 'blade', 'brolly', 'bow', 'roller', 'charger', 'twins']) {
      fresh();
      const c = A[1], foe = B[1];
      c.setWeapon(w); wake(c, 'normal');
      let bad = { fire: 0, sub: 0, cantuse: 0, special: 0, climb: 0, leap: 0, roll: 0, intentSub: 0, intentSpecial: 0 };
      const u0 = c.bot.update;
      c.bot.update = function (dt) { proto.call(this, dt); if (c.carry) { if (c.intent.sub) bad.intentSub++; if (c.intent.special) bad.intentSpecial++; } };
      let done = 0;
      const legs = [[0, 0, () => Kp.lowered[0]], [Kp.weirs[0][0].pos.x, Kp.weirs[0][0].pos.z, () => Kp.winner === 0], [-4, -22, () => Kp.lowered[0]]];
      for (let li = 0; li < legs.length; li++) {
        if (li === 2) { fresh(); c.bot.update = function (dt) { proto.call(this, dt); if (c.carry) { if (c.intent.sub) bad.intentSub++; if (c.intent.special) bad.intentSpecial++; } }; }
        const [x, z, until] = legs[li];
        put(c, x, z); c.special = c.specialCost(); step(1 / 60); grant(c);
        // a foe in sight off to one side (untouchable: the carrier wants to fight it, nothing more)
        put(foe, x + 7, z + 9); foe.invuln = 99;
        const e0 = ev.length;
        step(30, () => { c.hp = PLAYER.hp; c.ink = PLAYER.inkMax; foe.invuln = 99; if (c.carry && c.climbing) bad.climb++; if (c.carry && c.weaponRunner.rolling) bad.roll++; if (until()) return false; });
        for (const [k, e, , carrying] of ev.slice(e0)) {
          if (e.actor !== c || !carrying) continue;
          if (k === 'weapon:fire' && e.weapon !== 'karp') bad.fire++;
          if (k === 'sub:use') bad.sub++;
          if (k === 'sub:cantuse') bad.cantuse++;
          if (k === 'special:use') bad.special++;
          if (k === 'mitts:leap') bad.leap++;
          if (k === 'weapon:dodge' || k === 'actor:dodge') bad.roll++;
        }
        if (until()) done++;
      }
      c.bot.update = u0;
      const sum = Object.values(bad).reduce((s, v) => s + v, 0);
      rows.push({ w, done, sum, bad, carpShots: KARP_GUN.stats.fired.reduce((s, v) => s + v, 0) });
    }
    R('F carriers holding the mitts, blade, brolly, bow, roller, charger and twins, 3 carries each with a foe in sight: zero own-weapon shots, sub throws, sub:cantuse, specials, climbs, Mitts leaps and dodge rolls', rows.every((r) => r.sum === 0 && r.done === 3), rows);
  }

  // ============================================================================ G. the ×3 fallback
  if (want('G')) {
    // a Bravo Carp-Free Zone across the whole of Bravo's half at z 17…20 (sea to sea): a Bravo carrier just behind it has
    // no way forward that its route rules allow (its own free zone, and no going back round) — it must not stand still
    fresh({ ...KARPBOX_DEF, freeZones: [...KARPBOX_DEF.freeZones, { poly: [[-21, 17], [27, 17], [27, 20], [-21, 20]], y0: -0.5, y1: 1.6, signs: [] }] });
    const c = B[0]; c.setWeapon('shooter'); wake(c, 'normal');
    put(c, 0, 23); step(1 / 60); grant(c);
    const p0 = c.pos.clone(); let maxD = 0, fast = 0;
    step(6, () => { c.hp = PLAYER.hp; maxD = Math.max(maxD, hd(c.pos, p0)); if (c.carry?.j?.ret) fast++; });
    const zf = Kp.stats.fastT.zone || 0;
    // (b) the retreat mask's own case: a pocket of its own free zone (a U open behind it) — the only way on is back out of
    // it, 9–10 m behind its retreat mark (the mask forbids 6), then round an arm. Plan again without the retreat part: a
    // short ×3 (the engine's 8 m), never standing still
    const U = [[[-7, 8], [1, 8], [1, 10], [-7, 10]], [[-7, 10], [-5, 10], [-5, 21], [-7, 21]], [[-1, 10], [1, 10], [1, 21], [-1, 21]]].map((poly) => ({ poly, y0: -0.5, y1: 1.6, signs: [] }));
    const g1 = { fallback: KARP_BOT.stats.retreatFallback, moved: maxD, zoneFastS: zf, holder: Kp.holder === c, at: [c.pos.x, c.pos.z] };
    fresh({ ...KARPBOX_DEF, freeZones: [...KARPBOX_DEF.freeZones, ...U] });
    wake(c, 'normal'); put(c, -3, 12.5); step(1 / 60); grant(c);
    const q0 = c.pos.clone(); let retS = 0, past = false, minZ = 99, maxZ2 = 0; const lv = [];
    const trG = []; let fr = 0;
    step(9, () => { c.hp = PLAYER.hp; maxZ2 = Math.max(maxZ2, c.pos.z); if (c.pos.z < 7.5) past = true; minZ = Math.min(minZ, c.pos.z); if (c.carry?.j?.ret) retS += 1 / 60;
      if (fr++ % 30 === 0 && trG.length < 10) { const b = c.bot, g = b.goal >= 0 ? G.nav.nodes[b.goal] : null, RTg = karpPlan().route[1]; trG.push([+c.pos.x.toFixed(1), +c.pos.z.toFixed(1), Kp.field.inFreeZone(1, c.pos), c.carry?.j?.ret ? 1 : 0, g ? [g.x, g.z] : null, b.path ? b.path.length : 0, RTg?.pick?.name, c.form[0], KARP_BOT.stats.retreatFallback]); } });
    const g2 = { fallback: KARP_BOT.stats.retreatFallback, fbAt: KARP_BOT.stats.fbAt, retreatFastS: +(Kp.stats.fastT.retreat || 0).toFixed(2), zoneFastS: +(Kp.stats.fastT.zone || 0).toFixed(2), backTo: maxZ2, outPast: past, minZ, holder: Kp.holder === c, tr: trG };
    const okG2 = g2.fallback >= 1 && g2.fbAt.some((f) => f[3] === 1) && past && g2.retreatFastS > 0 && g2.retreatFastS < 4 && g2.zoneFastS === 0;
    R('G(b) a pocket of its own free zone, open behind it: the carrier plans again without its retreat mark (carrierRetreatFallback, level 1), takes a short ×3 back out round the arm and goes on — never standing still, never into the zone', okG2, g2);
    R('G every forward route closed: the carrier accepts a short ×3 (carrierRetreatFallback) and walks on through instead of standing still', g1.fallback >= 1 && g1.moved > 4 && g1.zoneFastS > 0 && g1.zoneFastS < 3, g1);
  }

  // ============================================================================ H. out of a Big Burst's disc
  if (want('H')) {
    // trials at range HR: a breaker settled on its spot (clean ground, a kid), a full charge lobbed onto it from HR m in
    // front of it (±0.6 rad); ok = not hurt at all (out of the 4.0 m blast when it blows)
    const trials = (HR, N) => {
      const res = [];
      for (let k = 0; k < N; k++) {
        fresh();
        const v = B[k % 4], s = A[2];
        v.setWeapon(['shooter', 'blaster', 'bucket', 'twins'][k % 4]); wake(v, 'normal');
        // (placed by its spot: after 2.5 s from its deck it was still walking in — a lob aimed at it then lands behind it and
        // it walks on under the arc; it has to be standing)
        put(v, ((k % 3) - 1) * 2.5, 7.5); Kp.shell.add = () => {};
        let vs = 0; step(4, () => { v.hp = PLAYER.hp; if (Math.hypot(v.vel.x, v.vel.z) < 1.2) vs++; else vs = 0; if (vs > 30) return false; });
        const vp = v.pos.clone(), fy = v.bot.aimYaw, side = k % 2 ? 0.6 : -0.6;
        put(s, vp.x + Math.sin(fy + side) * HR, vp.z + Math.cos(fy + side) * HR);
        const d = hd(s.pos, vp), dy = vp.y - s.pos.y;
        // the aim that lobs a full charge onto it
        // (the low arc: the first pitch from below that lands within 0.1 m — a high lob would hang in the air for 2 s)
        let best = 0, be = 1e9;
        for (let p = -0.7; p <= 0.8; p += 0.005) { const th = p + (K.gun.lob * Math.PI) / 180, sp = speedOf(1), vx = Math.cos(th) * sp, vy = Math.sin(th) * sp, disc = vy * vy + 2 * K.gun.gravity * (K.gun.muzzleUp - dy); if (disc < 0) continue; const x = (vx * (vy + Math.sqrt(disc))) / K.gun.gravity, e = Math.abs(x - (d - K.gun.muzzleFwd)); if (e < be) { be = e; best = p; } if (be < 0.1) break; }
        s.aimYaw = Math.atan2(vp.x - s.pos.x, vp.z - s.pos.z); s.aimPitch = best;
        const shot = KARP_GUN._fire(s, 1);
        let hurt = false, land = null, blowD = null, knowT = null, landT = null;
        const off = on('damage', (e) => { if (e.victim === v && e.source === 'karp') hurt = true; });
        const t0 = G.time; let fr2 = 0; const trH = [];
        step(2.2, () => {
          if (shot.land && !land) { land = shot.land.clone(); landT = G.time - t0; }
          if (shot.phase === 'done' && blowD === null) blowD = land ? hd(v.pos, land) : null;
          if (knowT === null && v.bot.sp.known.some((r) => r.d.src === 'karp')) knowT = G.time - t0;
          if ((fr2++ % 6) === 0 && trH.length < 12) { const ux = vp.x - s.pos.x, uz = vp.z - s.pos.z, ul = Math.hypot(ux, uz) || 1, rx = v.pos.x - vp.x, rz = v.pos.z - vp.z, E = v.bot.sp.esc; trH.push([+(G.time - t0).toFixed(2), +((rx * ux + rz * uz) / ul).toFixed(2), +((rx * uz - rz * ux) / ul).toFixed(2), v.bot.sp.known.filter((r) => r.d.src === 'karp').map((r) => r.d.shape).join(''), E ? E.r.d.shape : '-', shot.phase[0], E ? +(((E.yaw - Math.atan2(-ux, -uz)) + 9 * Math.PI) % (2 * Math.PI) - Math.PI).toFixed(2) : null, +shot.pos.y.toFixed(1)]); }
        });
        off();
        res.push({ ok: !hurt, landOff: land ? +hd(land, vp).toFixed(2) : null, blowD, knowT, landT, tr: hurt && HR >= 18 ? trH : undefined });
      }
      return res;
    };
    const res = trials(18, 20);
    const n = res.filter((r) => r.ok).length, onIt = res.filter((r) => r.landOff !== null && r.landOff < radiusOf(1) * 0.6).length;
    R(`H a bot standing where a Big Burst lands leaves its disc before it blows (normal, from 18 m): ${n} of 20 (≥ 16), ${onIt} shots landed within 2.4 m of it`, n >= 16 && onIt >= 16, res);
    // (report: closer in, the flight + the 0.45 s swell is 0.9–1.1 s against a 0.2–0.45 s reaction and 4 m to run at 5.3 m/s
    // on dry ground — a coin flip at 15 m, a kill at 12 m, by the numbers rather than the bots)
    const rep = {};
    for (const HR of [12, 15]) { const r = trials(HR, 10); rep[HR + ' m'] = { escaped: r.filter((q) => q.ok).length + ' of 10', meanNotice: +(r.reduce((a, q) => a + (q.knowT ?? 1), 0) / 10).toFixed(2), meanLand: +(r.reduce((a, q) => a + (q.landT ?? 0), 0) / 10).toFixed(2) }; }
    R('H (report) the same from 12 m and 15 m (no threshold: physics, see the note)', true, rep);
  }

  // ============================================================================ I. the keeper
  if (want('I')) {
    // (a) Bravo carries on Alpha's half with its Gate risen: Alpha's keeper holds 4–9 m in front of that Gate
    fresh();
    for (const a of A) wake(a, 'normal');
    const c = B[0]; put(c, 0, -16); step(1 / 60); grant(c);
    Kp.lowered[1] = true; Kp.gateUp[1] = true;
    const gate = Kp.gates[1].pos;
    let kd = [];
    var hold = (x, z) => { c.hp = PLAYER.hp; c.invuln = 99; c.pos.set(x, floorY(x, z), z); c.vel.set(0, 0, 0); };
    step(8, (i) => { hold(0, -16); if (i > 300) { const P = karpPlan(); for (const a of A) if (P.roleOf(a) === 'keeper' && a.alive) kd.push(hd(a.pos, gate)); } });
    const P = karpPlan(), keepers = A.filter((a) => P.roleOf(a) === 'keeper').length;
    R('I(a) the keeper holds the open Gate: a keeper standing 3–9.5 m from it while Bravo carries', keepers >= 1 && kd.length > 30 && Math.max(...kd) <= 9.5 && Math.min(...kd) >= 2.5, { keepers, n: kd.length, min: Math.min(...kd), max: Math.max(...kd) });
    // (b) two weirs: the one on the carrier's route (by where it's known to be)
    fresh(KARPBOX_TWO);
    for (const a of A) wake(a, 'normal');
    const wA = Kp.weirs[1][0].pos, wB = Kp.weirs[1][1].pos;   // Bravo's weirs on Alpha's half: (0, 1.2, −28) and (−9, 2.5, −28)
    const res = [];
    for (const [x, z, near] of [[wB.x, -14, 'B'], [wA.x + 2, -14, 'A']]) {
      put(c, x, z); step(1 / 60); grant(c);
      const dB = [], dA = [];
      step(7, (i) => { hold(x, z); if (i > 300) { const P2 = karpPlan(); for (const a of A) if (P2.roleOf(a) === 'keeper' && a.alive) { dB.push(hd(a.pos, wB)); dA.push(hd(a.pos, wA)); } } });
      const P2 = karpPlan(), obj = P2.defendObj(0);
      const mB = dB.reduce((s, v) => s + v, 0) / Math.max(1, dB.length), mA = dA.reduce((s, v) => s + v, 0) / Math.max(1, dA.length);
      res.push({ carrierAt: [x, z], want: near, defends: obj?.key, meanToB: mB, meanToA: mA, n: dB.length, ok: dB.length > 30 && obj?.key === (near === 'B' ? 'w11' : 'w10') && (near === 'B' ? mB : mA) <= 9.5 });
    }
    R('I(b) two weirs: the keeper holds the weir on the carrier\'s route (it switches with the carrier)', res.every((r) => r.ok), res);
  }

  // ============================================================================ J. interceptors: no wall-hack; the wake
  if (want('J')) {
    fresh();
    const w = A[0], c = B[0];
    w.setWeapon('shooter'); wake(w, 'normal');
    put(w, 0, 12); put(c, 10, 12); step(1 / 60); grant(c);
    sleep(w);   // (perception only: one look at a time)
    const S = w.bot.sight;
    const cu = c.update;
    c.update = () => { c.anim.time = G.time; };
    const squid = (x, z, vx = 0, vz = 0) => { c.pos.set(x, floorY(x, z), z); c.vel.set(vx, 0, vz); c.form = 'squid'; c.submerged = true; c.grounded = true; c.groundTeam = 1; c.anim.form = 'swim'; };
    const look = (yaw) => { w.bot.aimYaw = yaw; w.bot._perceive(); };
    const watch = (s, yaw) => { let seen = false; for (let t = 0; t < s - 1e-6; t += 0.2) { step(0.2); look(yaw); seen = seen || S.sees(c); } return seen; };
    // (a) behind the alley's thin wall (x 5.7…6), submerged and still, 10 m: not known (no wall-hack)
    w.bot.reset(); squid(10, 12);
    const wallSeen = watch(1.4, Math.PI / 2), wallMem = !!S.get(c);
    // (b) in the open, 15 m in view, submerged and still: its wake is seen (a swimmer's ripples alone: 2 m when still)
    w.pos.set(-6, 0, 12); w.vel.set(0, 0, 0);
    w.bot.reset(); squid(-6, 27);
    const wake15 = watch(1.2, 0);
    // (c) 23 m in the open: beyond the wake's 20 m
    w.bot.reset(); squid(-6, 35);
    const wake23 = watch(1.2, 0);
    // (d) the same 15 m swim by a teammate who is NOT carrying: not noticed (only the carrier has the glow)
    Kp._release(c); w.bot.reset(); squid(-6, 27);
    const plain15 = watch(1.2, 0);
    R('J(a) the wake: a hidden carrier is noticed at 15 m in the open (≤ 20 m), not at 23 m, not behind a wall; a non-carrier swimmer at 15 m is not', !wallSeen && !wallMem && wake15 && !wake23 && !plain15, { wallSeen, wallMem, wake15, wake23, plain15, karpWakeR: SIGHT.karpWakeR });
    // (e) the interceptor's goal never follows the hidden carrier through a wall: seen in kid form at P0, it dives and swims
    // behind the wall to P1 — the interceptor heads for P0 / its expected route, never P1
    c.update = cu;
    put(c, 3, 22); step(1 / 60); grant(c);
    put(w, -8, 14); wake(w, 'normal'); c.update = () => { c.anim.time = G.time; };
    step(1.2, () => { c.pos.set(3, 0, 22); c.vel.set(0, 0, 0); c.form = 'kid'; c.submerged = false; c.anim.form = 'kid'; c.hp = PLAYER.hp; c.invuln = 99; });
    const P = karpPlan(), role = P.roleOf(w);
    const p1 = V(10, 0, 12);
    // (the jump to P1 is the test's: a real carrier can't cover 12 m between two of the bot's looks, ≤ 0.25 s, so the bot's
    // next look comes at once — till then its fight memory still says "seen" and a fight's route goes to the foe itself)
    squid(10, 12); w.bot._perceive();
    let toP1 = Infinity, goals = 0, legit = 0; const dbgJ = [];
    // (a goal by P1 is a wall-hack only if neither this bot nor its team knows the carrier is there: from the alley's open
    // end a bot may really see the wake — then it may go)
    step(4, () => { squid(10, 12); c.hp = PLAYER.hp; c.invuln = 99; const b = w.bot; if (b.path && b.goal >= 0) { const n = G.nav.nodes[b.goal]; const kk = S.get(c), tk = (G.actors.filter((o) => o.team === 0 && o.bot).map((o) => o.bot.sight.get(c)).filter(Boolean)); const knows = (kk && hd(kk.pos, p1) < 4) || tk.some((q) => hd(q.pos, p1) < 4); if (knows) legit++; else { if (hd(n, p1) < 3.5 && dbgJ.length < 3) { const Pq = karpPlan(), fk = Pq.foes[0].find((f) => f.e === c); dbgJ.push({ t: +G.time.toFixed(2), mode: b.mode, role: b.kRole, tgt: b.target?.name, tk: b.tk ? [b.tk.src, +b.tk.pos.x.toFixed(1), +b.tk.pos.z.toFixed(1), b.tk.seen] : null, kLast: b.kLast ? [+b.kLast.x.toFixed(1), +b.kLast.z.toFixed(1)] : null, kExp: !!b.kExp, fk: fk ? [+fk.pos.x.toFixed(1), +fk.pos.z.toFixed(1), fk.seen, +(G.time - fk.t).toFixed(2)] : null, hidden: Kp.hidden(c), w: [+w.pos.x.toFixed(1), +w.pos.z.toFixed(1)], goal: [n.x, n.z], pathLen: b.path.length }); } toP1 = Math.min(toP1, hd(n, p1)); goals++; } } });
    const k = S.get(c);
    c.update = cu;
    R('J(b) an interceptor doesn\'t track a hidden carrier through a wall: while nobody of its team has seen it there, its goal stays off the carrier\'s real spot behind the alley wall', role === 'intercept' && toP1 > 3.5 && goals > 30, { role, goalNearestP1: toP1, goals, framesSeenLegitimately: legit, mem: k ? [k.pos.x, k.pos.z] : null, dbg: dbgJ });
  }

  // ============================================================================ K. the knockback push
  if (want('K')) {
    const res = [];
    for (const diff of ['normal', 'hard', 'easy']) {
      fresh();
      const c = A[0], foe = B[2];
      c.setWeapon('shooter'); wake(c, diff);
      // a 6 m band of Bravo ink across the deck ahead of it (z −4 … 2), a Bravo player in sight 9 m ahead
      for (let x = -14; x <= 13; x += 1.5) for (let z = -6.5; z <= 2; z += 1.5) G.paint.splat(V(x, 0.05, z), 1.2, 1, { seed: 1 });
      put(c, 0, -5); step(1 / 60); grant(c);
      put(foe, 4, 3); foe.invuln = 99;
      resetKarpStats();
      let t = 0, across = null;
      step(7, () => { t += 1 / 60; c.hp = PLAYER.hp; foe.invuln = 99; foe.pos.set(4, 0, 3); if (across === null && c.pos.z > 2.5) { across = t; return false; } });
      res.push({ diff, push: KARP_BOT.stats.push, across });
    }
    const [n, h, e] = res;
    R('K the knockback push in enemy ink: normal and hard fire Splash shots backwards (and get across 7.5 m of it faster than walking 6 m of it, 3.9 s), easy never', n.push >= 2 && h.push >= 2 && e.push === 0 && n.across !== null && n.across < 3.9, res);
  }

  // ============================================================================ L. hooks and dangers
  if (want('L')) {
    fresh();
    const c = A[0]; c.setWeapon('shooter'); put(c, 0, -6); step(1 / 60); grant(c);   // (the carrier still: its brain asleep)
    const mate = A[1]; wake(mate, 'normal'); put(mate, 2.5, -5);
    Kp.fuse = 2.8;
    step(0.05);
    const D = specialDangers();
    const fz = D.find((d) => d.src === 'karpfuse');
    // a teammate 3 m off gets out of it (the carrier never runs from its own: it isn't in its list)
    const pm = mate.pos.clone(); let maxD = 0;
    step(1.4, () => { c.hp = PLAYER.hp; c.pos.set(0, 0, -6); c.vel.set(0, 0, 0); Kp.fuse = Math.max(Kp.fuse, 1.8); maxD = Math.max(maxD, hd(mate.pos, c.pos)); });
    const cIgn = !c.bot || !c.bot.sp.recs || ![...c.bot.sp.recs.values()].some((r) => r.d.src === 'karpfuse');
    R('L our carrier\'s last 3 s of fuse: a 5.5 m danger for its teammates (team-tagged so its own team reacts), never for the carrier itself; a teammate 3 m off gets out to ≥ 5.5 m', !!fz && fz.team === 1 && fz.not === c && maxD >= 5.5 && cIgn, { fz: fz && { team: fz.team, r: fz.r, not: fz.not === c }, mateStart: hd(pm, c.pos), mateMax: maxD });
  }
  // ============================================================================ M. the layout's route hints
  if (want('M')) {
    fresh({ ...KARPBOX_DEF, routes: { west: [[-10, 14], [-9, 22]], east: [[10, 24]] } });
    const c = A[0]; c.setWeapon('shooter'); wake(c, 'normal');
    put(c, 0, 1); step(1 / 60); grant(c);
    step(0.3);
    const P = karpPlan(), RT = P.route[0], names = RT ? RT.cands.map((r) => r.name) : [];
    const first = RT && RT.pick ? RT.pick.name : null;
    // two Bravo players known on the west route (in sight; one foe is 6 m of cost, under the 8 m hysteresis): the pick goes east
    const f1 = B[0], f2 = B[1]; put(f1, -10, 15); put(f2, -8, 20);
    const holdF = () => { for (const [f, x, z] of [[f1, -10, 15], [f2, -8, 20]]) { f.pos.set(x, 0, z); f.vel.set(0, 0, 0); f.invuln = 99; f.hp = PLAYER.hp; } };
    let picks = [];
    // (a look their way first: the carrier has to see them — no wall-hack — and these two are in the open off its left)
    for (let k = 0; k < 6; k++) { holdF(); step(0.2, () => { c.hp = PLAYER.hp; holdF(); c.bot.aimYaw = Math.atan2(-9 - c.pos.x, 17 - c.pos.z); }); c.bot._perceive(); }
    // (a fresh pick-up at the start, the two of them known: the routes are picked anew — east, round them)
    if (Kp.holder) Kp._release(Kp.holder);
    put(c, 0, 1); step(1 / 60); grant(c); holdF();
    const lostM = []; const offM = ['karp:drop', 'karp:reset', 'karp:plant', 'karp:explode', 'karp:end'].map((k) => on(k, (e) => lostM.push([k, e.how || e.why || e.reason || '', +G.time.toFixed(2), +c.pos.x.toFixed(1), +c.pos.z.toFixed(1)])));
    // (walked while it carries — till its plant on the weir)
    const xs = []; let candX = null, pathX = -99;
    step(9, () => { c.hp = PLAYER.hp; holdF(); const Rt = P.route[0]; if (Rt && Rt.pick && picks[picks.length - 1] !== Rt.pick.name) picks.push(Rt.pick.name); if (Kp.holder === c) xs.push(c.pos.x); if (Rt && !candX) candX = Rt.cands.map((r) => ({ n: r.name, len: +r.len.toFixed(1), maxX: +Math.max(...r.ids.map((id) => G.nav.nodes[id].x)).toFixed(1), cost: +P.routeCost(r, 0, c.pos, null).toFixed(1) })); if (c.bot.path && Kp.holder === c) pathX = Math.max(pathX, ...c.bot.path.map((id) => G.nav.nodes[id].x)); });
    const RT2 = P.route[0], costs = RT2 ? RT2.cands.map((r) => ({ n: r.name, len: +r.len.toFixed(1), cost: +P.routeCost(r, 0, c.pos, null).toFixed(1) })) : null;
    const dbgM = { costs, foes: P.foes[0].map((f) => [f.e.name, +f.pos.x.toFixed(1), +f.pos.z.toFixed(1), f.seen]), sameRT: RT2 === RT, carrier: [+c.pos.x.toFixed(1), +c.pos.z.toFixed(1)], holder: Kp.holder === c, lost: lostM, candX, pathX, fuse: +Kp.fuse.toFixed(1), alive: c.alive };
    offM.forEach((f) => f());
    R('M the layout\'s route hints are the carrier\'s candidates (and no other); two foes known on one move the pick to the other, and the carrier walks it', names.length === 2 && names.includes('west') && names.includes('east') && picks.includes('east') && picks[picks.length - 1] === 'east' && Math.max(...xs) > 6, { names, first, picks, maxX: Math.max(...xs), planted: lostM.some((e) => e[0] === 'karp:plant'), shares: KARP_BOT.stats.routes, dbg: dbgM });
  }

  // ============================================================================ N. super jumps to the carrier
  if (want('N')) {
    fresh();
    const c = A[0], j = A[1]; c.setWeapon('shooter'); put(c, 0, 18); step(1 / 60); grant(c);   // (the carrier still, 78 m from Alpha's pad)
    wake(j, 'normal');
    let jumpT = null; const off = on('superjump', (e) => { if (e.actor === j && e.phase === 'charge') jumpT = e.target; });
    j.splat(null, 'test'); j.respawnTimer = 0.05;
    step(3, () => { c.hp = PLAYER.hp; c.pos.set(0, floorY(0, 18), 18); });
    off();
    // …and none for a defender when the other team carries (it stays home)
    fresh();
    const c2 = B[0], d = A[2]; put(c2, 0, -10); step(1 / 60); grant(c2); wake(d, 'normal');
    let jump2 = null; const off2 = on('superjump', (e) => { if (e.actor === d && e.phase === 'charge') jump2 = e.target; });
    d.splat(null, 'test'); d.respawnTimer = 0.05;
    step(3, () => { c2.hp = PLAYER.hp; c2.invuln = 99; c2.pos.set(0, 0, -10); });
    off2();
    R('N a respawned bot super jumps to our carrier ≥ 35 m away; a defender respawning while they carry stays home', jumpT === c && !jump2, { jumpedTo: jumpT ? jumpT.name : null, carrier: c.name, defenderJumped: !!jump2 });
  }

  // ============================================================================ O. the fuse: over the halfway line first
  if (want('O')) {
    fresh();
    const c = A[0]; c.setWeapon('shooter'); wake(c, 'normal'); put(c, -2, -30); step(1 / 60); grant(c);
    step(0.3, () => { c.hp = PLAYER.hp; });
    Kp.fuse = 4;   // (4 s: its weir is ~58 m away — it can't make it; the halfway line (z ≈ 0) it can)
    let half = false; const gz = [];
    step(1.5, () => { c.hp = PLAYER.hp; Kp.fuse = Math.max(Kp.fuse, 3.5); if (c.bot.kHalf) half = true; if (c.bot.goal >= 0) gz.push(G.nav.nodes[c.bot.goal].z); });
    const F = Kp.field, g = c.bot.goal >= 0 ? G.nav.nodes[c.bot.goal] : null;
    R('O a fuse that can\'t reach the weir at this pace on its own half: the carrier heads 2 m past the halfway line first (a blast there drops it forward)', half && !!g && F.D[1][g.id] - F.D[0][g.id] >= 3 && g.z < 12, { kHalf: half, goal: g ? [g.x, g.z] : null, margin: g ? +(F.D[1][g.id] - F.D[0][g.id]).toFixed(1) : null });
  }

  // ============================================================================ P. walkers round the shell
  if (want('P')) {
    const res = {};
    for (const id of ['seeker', 'waddle']) {
      fresh(); Kp.shell.hpMax = 1e9; Kp.shell.m = 0;
      const sc = Kp.shell.center(), r0 = Kp.shell.radius(), foe = B[0], th = A[1];
      // (thrown short from 7 m in front of the shell: it lands before it, its foe straight behind it — the straight way is through)
      if (th.bot) th.bot.update = () => {};   // (brainless: the test drives its trigger)
      th.setSub(id); put(th, sc.x, sc.z - 7); th.yaw = th.aimYaw = 0; th.aimPitch = -0.35; th.aimPoint.set(sc.x, 0, sc.z - 3.5);
      put(foe, sc.x, sc.z + r0 + 2.4); step(0.05);
      let inside = 0, contact = 0, minFoe = 99, seen = 0;
      const items = () => (id === 'waddle' ? SUB_KITS.waddle?.items || [] : G.subs.items.filter((it) => it.kind === 'seeker')).filter((it) => it.owner === th && it.state !== 'dead');
      for (let i = 0; i < 360; i++) {
        th.intent.sub = i < 8; th.ink = PLAYER.inkMax; th.aimYaw = 0; th.aimPitch = -0.35; th.aimPoint.set(sc.x, 0, sc.z - 3.5);
        foe.pos.set(sc.x, floorY(sc.x, sc.z + r0 + 2.4), sc.z + r0 + 2.4); foe.vel.set(0, 0, 0); foe.hp = PLAYER.hp;
        dbg.step(1000 / 60);
        for (const it of items()) {
          if (it.state === 'fly') continue;
          seen++;
          const d = Math.hypot(it.pos.x - sc.x, it.pos.z - sc.z);
          if (d < r0) inside++; else if (d < r0 + 0.3) contact++;
          minFoe = Math.min(minFoe, Math.hypot(it.pos.x - foe.pos.x, it.pos.z - foe.pos.z));
        }
      }
      th.intent.sub = false;
      res[id] = { inside, contactFrames: contact, walkFrames: seen, closestToFoe: +minFoe.toFixed(2) };
    }
    R('P walkers treat the shell as an obstacle: a Skitter and a Waddle sent at a foe right behind the shell go round it (never inside, pressed against it under a quarter of the walk) and reach the foe', Object.values(res).every((r) => r.walkFrames > 20 && r.inside === 0 && r.contactFrames <= r.walkFrames * 0.25 && r.closestToFoe < 1.6), res);
  }
  } catch (e) { R('HARNESS ' + e.message, false, String(e.stack).slice(0, 600)); }
  offs.forEach((f) => f());
  return out;
})()
