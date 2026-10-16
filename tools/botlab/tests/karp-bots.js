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
//   R  the other roles: escorts (lead / flank / anchor), the perch (both phases), the free phase's fighters, re-forming
//   S  specials (SPEC §8.6): breakers' bombs at ≥ 40 %, escorts' only under threat, interceptors' at the known carrier,
//      the Bubble Guard's share
//   Y  difficulty (SPEC §8.8): interceptors by difficulty, easy / hard grab delays, easy's no-lob, hard's lead, re-pick periods
//   PAGE_ARGS 'teeth=1' also runs each newer check with its feature switched off (KARP_AI / difficulty rows): it must fail
//   W  no wall-hack in the defending plan: a hidden enemy carrier's live spot never moves the defended weir, the perch's look,
//      the interceptor choice or a fight's pull — only what the team saw (its pick-up, a look) does
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER } = await import('./src/config.js');
  const { on } = await import('./src/core/ctx.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF, KARPBOX_TWO } = await import('./tools/botlab/karpbox.js');
  const { KARP_GUN, radiusOf, speedOf } = await import('./src/game/karpGun.js');
  const { KARP_BOT, KARP_AI, karpPlan, resetKarpStats, karpEngage } = await import('./src/game/botsKarp.js');
  const karpPerchLook = (await import('./src/game/botsKarp.js')).karpPerchLook || null;   // (absent before fix round 1)
  const { SIGHT, teamKnown } = await import('./src/game/botSight.js');
  const { revealedTo } = await import('./src/game/reveal.js');
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
    for (const a of m.actors) { if (a.specialActive) G.specials.end(a, 'test'); a.superJumpState = null; a.special = 0; a.status.track = 0; a.status.reveal = 0; }   // (no special left charged by an earlier group: S's barrage fired in Y(b)'s wait and took the grab away)
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
  // the checks' teeth (PAGE_ARGS teeth=1): run the scenario again with its feature off — it must fail then
  const TEETH = /teeth=1/.test(window.__pageArgs || '');
  const check = (name, fn, off) => {
    const r = fn(); R(name, r.ok, r.info);
    if (TEETH && off) { const undo = off(); let r2; try { r2 = fn(); } finally { undo(); } R('(teeth) ' + name.split(' ')[0] + ' fails with its feature off', !r2.ok, r2.info); }
  };
  const flip = (obj, kv) => () => { const old = {}; for (const k in kv) { old[k] = obj[k]; obj[k] = kv[k]; } return () => Object.assign(obj, old); };
  const track = (e, t = 0) => { e.status.track = 99; e.status.trackTeam = t; };   // (located by team t: the map shows it)
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
      R(`A ${diff}: with Bravo's side at ${frac * 100} % the Alpha bots placed 4.2 m out leave the burst (4.5 m) and keep the 5.5 m ring from 1.5 s on (0.2 m of slack), still shooting it`, minA >= 5.3 && minA < 12 && n > 0 && shoot > 1, { minA, samples: n, breakT: shoot, dangerKnown: KARP_AI.diff[diff].danger, dbg: dbgA.slice(-6) });
    }
    // (c) the danger is what keeps a bot that only walks by out: Alpha's ranged bots start on Bravo's side of the shell
    // (6.5 m out), noticing the danger first, then walk round to their own ring spots with Bravo's side at 72 % — round
    // outside 5.3 m (the full swell's 2.9 m otherwise)
    check('A(c) with Bravo\'s side at 72 % Alpha\'s ranged bots on the far side of the shell walk round it to their own ring outside 5.3 m (the danger area and the ≥ 50 % keep-out: without them they cut round the full swell)', () => {
      fresh();
      for (const a of m.actors) a.setWeapon(['shooter', 'blaster', 'spinner', 'bucket'][a.slot % 4]);
      for (const a of A) wake(a, 'normal');
      const st = A.map((a, i) => { const ang = (i - 1.5) * 0.45; return [Math.sin(ang) * 6.5, Math.cos(ang) * 6.5]; });
      A.forEach((a, i) => put(a, ...st[i]));
      Kp.shell.add = () => {};
      step(0.8, () => { pinMeter(-0.72); A.forEach((a, i) => { a.pos.set(st[i][0], floorY(...st[i]), st[i][1]); a.vel.set(0, 0, 0); a.invuln = 2; }); });
      let minA = Infinity; const c = Kp.shell.center();
      step(6, () => { pinMeter(-0.72); for (const a of m.actors) { a.invuln = 2; a.hp = PLAYER.hp; } for (const a of A) minA = Math.min(minA, hd(a.pos, c)); });
      const home = A.filter((a) => a.pos.z < -1).length;
      return { ok: minA >= 5.3 && home >= 3, info: { minA, home } };
    }, () => { const u1 = flip(KARP_AI.diff.normal, { danger: null })(), u2 = flip(KARP_AI, { keepOut: false })(); return () => { u2(); u1(); }; });
    // (d) the shell swelling fast is the danger before 70 %: Bravo's side climbing 60 %/s, at 50 % the danger area already
    // stands for Alpha (its side projected 1 s on bursts it); a still meter at 50 % has none
    check('A(d) a shell swelling fast toward Bravo\'s burst is a danger for Alpha before 70 %: climbing 60 %/s it stands at 50 %; held still at 50 % it does not', () => {
      fresh();
      for (const a of A) wake(a, 'normal');
      Kp.shell.add = () => {};
      let f = 0.2; step(0.5, () => { f = Math.min(0.5, f + 0.6 / 60); pinMeter(-f); });
      const rising = specialDangers().filter((d) => d.src === 'karpshell' && d.team === 1).length;
      step(0.8, () => pinMeter(-0.5));
      const still = specialDangers().filter((d) => d.src === 'karpshell' && d.team === 1).length;
      return { ok: rising === 1 && still === 0, info: { rising, still, meter: +(Kp.shell.meter / Kp.shell.hp).toFixed(2) } };
    }, flip(KARP_AI, { swellAhead: 0 }));
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
    // (b2) refills stay in the band: our side 75 %, the melee breakers' tanks emptied — they refill by their close spot (a
    // puddle they paint, or our ink in the band), never off at the ring or their spawn (B failed most runs on this)
    check('B(b2) melee breakers closing in at 75 % of ours refill inside their band (≤ 5 m from the centre): never walking off to the ring or the spawn for ink', () => {
      fresh();
      for (const a of A) a.setWeapon(mel[a.slot % 4]);
      for (const a of A) wake(a, 'normal');
      ring(A, 3.6); Kp.shell.add = () => {};
      step(1.5, () => { pinMeter(0.75); keepAlive(A); for (const a of m.actors) a.invuln = 2; });
      let maxR = 0, refill = 0, minR = Infinity;
      step(5, (i) => { pinMeter(0.75); keepAlive(A); for (const a of m.actors) a.invuln = 2; if (i % 60 === 0) for (const a of A) a.ink = Math.min(a.ink, PLAYER.inkMax * 0.08); for (const a of A) { const d = hd(a.pos, Kp.shell.center()); maxR = Math.max(maxR, d); minR = Math.min(minR, d); if (a.bot.mode === 'refill') refill++; } });
      return { ok: maxR <= 5 && minR >= 2.9 && refill > 60, info: { maxR, minR, refillFrames: refill } };
    }, flip(KARP_AI, { refillBand: false }));
    // (d) the other side at 60 % (out on the ring, no danger yet): a foe of theirs stands by the shell (3.4 m out on our side
    // — safe from its own team's burst); our melee breakers right by it fight it, but never follow it in past 4.8 m
    check('B(d) at 60 % of theirs a melee breaker fights a foe standing by the shell from the ring\'s edge, never in past 4.6 m (the burst reaches the chest, 1 m up, 4.5 m from the centre 1.3 m up: 4.49 m out on the floor)', () => {
      fresh();
      for (const a of A) a.setWeapon(mel[a.slot % 4]);
      for (const a of A) wake(a, 'normal');
      Kp.shell.add = () => {};
      const foe = B[0], fz = -3.4;
      A.forEach((a, i) => { const ang = Math.PI + (i - 1.5) * 0.3; put(a, Math.sin(ang) * 5.4, Math.cos(ang) * 5.4); });
      put(foe, 0, fz);
      let minD = Infinity, fight = 0;
      step(4, (i) => { pinMeter(-0.6); keepAlive(A); foe.hp = PLAYER.hp; foe.invuln = 99; foe.pos.set(0, floorY(0, fz), fz); foe.vel.set(0, 0, 0); for (const a of A) a.invuln = 2; if (i > 20) for (const a of A) { minD = Math.min(minD, hd(a.pos, Kp.shell.center())); if (a.bot.mode === 'fight' && a.bot.target === foe) fight++; } });
      return { ok: minD >= 4.6 && fight > 30, info: { minD, fightFrames: fight } };
    }, flip(KARP_AI, { keepOut: false }));
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
      let rr = [], out = null; step(3.5, (i) => { pinMeter(0.9); gA.hp = PLAYER.hp; if (i > 150) { const r = hd(gA.pos, Kp.shell.center()); rr.push(r); if (r > 3.3 && !out) out = { i, r: +r.toFixed(2), mode: gA.bot.mode, tgt: gA.bot.target?.name, mv: [+gA.intent.move.x.toFixed(2), +gA.intent.move.z.toFixed(2)], vel: [+gA.vel.x.toFixed(1), +gA.vel.z.toFixed(1)], esc: !!gA.bot.sp.esc, wig: gA.bot.wiggleT > 0, fire: gA.intent.fire, sq: gA.intent.squid, path: gA.bot.path ? gA.bot.path.length : 0 }; } });
      Kp.shell.add = add0;
      const rMin = Math.min(...rr), rMax = Math.max(...rr), role = gA.bot.kRole, spot = gA.bot.kSpot ? +hd(gA.bot.kSpot, Kp.shell.center()).toFixed(2) : null, mode = gA.bot.mode;
      // the burst (Alpha's): the time to its pick-up
      const t0 = G.time; let tp = null;
      Kp.shell.add(0, Kp.shell.hp * 2, gA);
      step(2, () => { if (Kp.holder === gA && tp === null) tp = G.time - t0; if (tp !== null) return false; });
      res.push({ w: gA.weaponId, role, rMin, rMax, spot, mode, grabAfterHold: tp === null ? null : +(tp - K.pickHold).toFixed(3), out: out || undefined });
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
    const okG2 = g2.fallback >= 1 && g2.fbAt.some((f) => f[3] === 1) && past && g2.retreatFastS > 0 && g2.retreatFastS < 4 && g2.zoneFastS < 0.1;   // (a corner clipped for a frame or two: the body cuts a waypoint)
    R('G(b) a pocket of its own free zone, open behind it: the carrier plans again without its retreat mark (carrierRetreatFallback, level 1), takes a short ×3 back out round the arm and goes on — never standing still, never into the zone (< 0.1 s: a clipped corner)', okG2, g2);
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
    R(`H a bot standing where a Big Burst lands leaves its disc before it blows (normal) — from 18 m, the range it passes at (§11 names none; from the carrier's usual 12–15 m it does not: the report rows below): ${n} of 20 (≥ 16), ${onIt} shots landed within 2.4 m of it`, n >= 16 && onIt >= 16, res);
    // (report: closer in, the flight + the 0.45 s swell is 0.9–1.1 s against a 0.2–0.45 s reaction and 4 m to run at 5.3 m/s
    // on dry ground — a coin flip at 15 m, a kill at 12 m, by the numbers rather than the bots)
    const rep = {};
    for (const HR of [12, 15]) { const r = trials(HR, 10); rep[HR + ' m'] = { escaped: r.filter((q) => q.ok).length + ' of 10', meanNotice: +(r.reduce((a, q) => a + (q.knowT ?? 1), 0) / 10).toFixed(2), meanLand: +(r.reduce((a, q) => a + (q.landT ?? 0), 0) / 10).toFixed(2) }; }
    R('H (report) the same from 12 m and 15 m (no threshold: physics, see the note)', true, rep);
    // (PAGE_ARGS hwhat=1: what it would take at 15 m — a longer swell, or a smaller Big Burst; the lead's balance decision)
    if (/hwhat=1/.test(window.__pageArgs || '')) {
      const what = {};
      for (const [k, v] of [['swell', 0.6], ['swell', 0.75], ['fullRadius', 3.5]]) { const o = K.gun[k]; K.gun[k] = v; try { const r = trials(15, 10); what[`${k} ${o} → ${v}`] = r.filter((q) => q.ok).length + ' of 10'; } finally { K.gun[k] = o; } }
      R('H (what-if, report) from 15 m with a longer swell or a smaller Big Burst disc', true, what);
    }
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
      const kInfo = A.filter((a) => P2.roleOf(a) === 'keeper' && a.alive).map((a) => ({ n: a.name, toSpot: a.bot.kSpot ? +hd(a.pos, a.bot.kSpot).toFixed(1) : null, mode: a.bot.mode, toA: +hd(a.pos, wA).toFixed(1), toB: +hd(a.pos, wB).toFixed(1) }));
      res.push({ carrierAt: [x, z], want: near, defends: obj?.key, keepers: kInfo, meanToB: mB, meanToA: mA, n: dB.length, ok: dB.length > 30 && obj?.key === (near === 'B' ? 'w11' : 'w10') && (near === 'B' ? mB : mA) <= 9.5 });
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
    // (c2) 18 m in the open: a normal bot (awareness 21 m) notices the wake; an easy one (16 m) does not — the wake never
    // reaches past what the bot sees of a kid in the open
    w.bot.reset(); squid(-6, 30);
    const wake18 = watch(1.2, 0);
    w.bot.setDifficulty('easy'); w.bot.reset(); squid(-6, 30);
    const easy18 = watch(1.2, 0);
    w.bot.setDifficulty('normal');
    // (d) the same 15 m swim by a teammate who is NOT carrying: not noticed (only the carrier has the glow)
    Kp._release(c); w.bot.reset(); squid(-6, 27);
    const plain15 = watch(1.2, 0);
    R('J(a) the wake: a hidden carrier is noticed at 15 m in the open (≤ 20 m), not at 23 m, not behind a wall; a non-carrier swimmer at 15 m is not; at 18 m a normal bot notices it, an easy one (awareness 16 m) does not', !wallSeen && !wallMem && wake15 && !wake23 && !plain15 && wake18 && !easy18, { wallSeen, wallMem, wake15, wake23, plain15, wake18, easy18, karpWakeR: SIGHT.karpWakeR });
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
    let toP1 = Infinity, goals = 0, legit = 0, firstLegit = null; const dbgJ = [];
    // (a goal by P1 is a wall-hack only if neither this bot nor its team knows the carrier is there: from the alley's open
    // end a bot may really see the wake — then it may go)
    step(4, () => { squid(10, 12); c.hp = PLAYER.hp; c.invuln = 99; const b = w.bot; if (b.path && b.goal >= 0) { const n = G.nav.nodes[b.goal]; const kk = S.get(c), tk = (G.actors.filter((o) => o.team === 0 && o.bot).map((o) => o.bot.sight.get(c)).filter(Boolean)); const knows = (kk && hd(kk.pos, p1) < 4) || tk.some((q) => hd(q.pos, p1) < 4); if (knows) { legit++; if (!firstLegit) { const who = G.actors.find((o) => o.team === 0 && o.bot && o.bot.sight.get(c) && hd(o.bot.sight.get(c).pos, p1) < 4); const q = who && who.bot.sight.get(c); firstLegit = { t: +G.time.toFixed(2), who: who?.name, at: who ? [+who.pos.x.toFixed(1), +who.pos.z.toFixed(1)] : null, src: q?.src, seen: q?.seen, reveal: revealedTo(c, 0), sub: c.submerged, form: c.form, los: who ? G.physics.los(V(who.pos.x, who.pos.y + 1.4, who.pos.z), V(c.pos.x, c.pos.y + 0.3, c.pos.z)) : null }; } } else { if (hd(n, p1) < 3.5 && dbgJ.length < 3) { const Pq = karpPlan(), fk = Pq.foes[0].find((f) => f.e === c); dbgJ.push({ t: +G.time.toFixed(2), mode: b.mode, role: b.kRole, tgt: b.target?.name, tk: b.tk ? [b.tk.src, +b.tk.pos.x.toFixed(1), +b.tk.pos.z.toFixed(1), b.tk.seen] : null, kLast: b.kLast ? [+b.kLast.x.toFixed(1), +b.kLast.z.toFixed(1)] : null, kExp: !!b.kExp, fk: fk ? [+fk.pos.x.toFixed(1), +fk.pos.z.toFixed(1), fk.seen, +(G.time - fk.t).toFixed(2)] : null, hidden: Kp.hidden(c), w: [+w.pos.x.toFixed(1), +w.pos.z.toFixed(1)], goal: [n.x, n.z], pathLen: b.path.length }); } toP1 = Math.min(toP1, hd(n, p1)); goals++; } } });
    const k = S.get(c);
    c.update = cu;
    R('J(b) an interceptor doesn\'t track a hidden carrier through a wall: while nobody of its team has seen it there, its goal stays off the carrier\'s real spot behind the alley wall', role === 'intercept' && toP1 > 3.5 && goals > 30, { role, goalNearestP1: toP1, goals, framesSeenLegitimately: legit, firstLegit, mem: k ? [k.pos.x, k.pos.z] : null, dbg: dbgJ });
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
    // (b) a remote (guest) carrier online: the host runs its fuse at the rate the guest's judgement sent — the danger stands
    // for the host's bots too (a moment's flag; the clock nudged so the danger list is rebuilt)
    Kp.fuse = 2.5; c.remote = true; G.time += 1e-4;
    const fzR = specialDangers().find((d) => d.src === 'karpfuse');
    c.remote = false; G.time -= 1e-4;
    R('L(b) a remote (guest) carrier in its last 3 s of fuse is a danger to the host\'s bots on its team too', !!fzR && fzR.team === 1 && fzR.not === c, { remote: !!fzR, tIn: fzR?.tIn });
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
  // ============================================================================ R. the other roles
  if (want('R')) {
    // (a) escorts: our carrier still at the Pond (its route: the line to its weir), a Bravo foe located off to the west
    // (20.4 m from it: outside the escorts' fights) — lead 8–14 m ahead on the route inking it, flank 3–8 m beside it on the
    // foe's side, anchor within 15 m
    check('R(a) escorts: the lead 8–14 m ahead on the carrier\'s route inking it, the flank 3–8 m beside it on the known threat\'s side, the anchor within 15 m', () => {
      fresh();
      const c = A[0], foe = B[0]; c.setWeapon('shooter'); put(c, 0, -2); step(1 / 60); grant(c);
      ['shooter', 'blaster', 'shooter'].forEach((w, i) => { A[i + 1].setWeapon(w); });
      for (const a of A.slice(1)) wake(a, 'normal');
      A.slice(1).forEach((a, i) => put(a, -2 + i * 2, -5));
      const fp = [-20, 2];
      const hold = () => { c.hp = PLAYER.hp; c.pos.set(0, floorY(0, -2), -2); c.vel.set(0, 0, 0); foe.hp = PLAYER.hp; foe.invuln = 99; foe.pos.set(fp[0], floorY(...fp), fp[1]); foe.vel.set(0, 0, 0); track(foe, 0); };
      step(6, hold);
      const P = karpPlan(), T = Kp.weirs[0][0].pos, dx = T.x - c.pos.x, dz = T.z - c.pos.z, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const off = (a) => { const rx = a.pos.x - c.pos.x, rz = a.pos.z - c.pos.z; return { along: rx * ux + rz * uz, side: rx * uz - rz * ux }; };
      const by = (r) => A.find((a) => P.roleOf(a) === r);
      const L = by('lead'), F = by('flank'), N = by('anchor');
      const fs = (fp[0] - c.pos.x) * uz - (fp[1] - c.pos.z) * ux;   // (the foe's side of the route)
      const st = { own: 0, enemy: 0, empty: 0, n: 0 }; let ink = 0, n = 0;
      for (const mm of [6, 9, 12]) { const q = P.ahead(0, mm, V(0, 0, 0)); G.paint.regionStats(q.x, q.y, q.z, 1.4, 0, st); if (st.n) { ink += st.own; n++; } }
      const lo = L && off(L), fo = F && off(F), no = N && hd(N.pos, c.pos);
      return { ok: !!L && !!F && !!N && lo.along >= 8 && lo.along <= 14 && Math.abs(lo.side) < 4 && n > 0 && ink / n > 0.25 && Math.sign(fo.side) === Math.sign(fs) && Math.abs(fo.side) >= 3 && Math.abs(fo.side) <= 8 && no <= 15,
        info: { lead: lo, flank: fo, foeSide: Math.sign(fs), anchorD: no, routeInk: n ? ink / n : null, known: P.foes[0].length } };
    }, flip(KARP_AI, { lead: 0, flank: 0, anchor: 30 }));
    // (b) the perch: a charger, shell phase — on a spot 10–22 m from the shell with a line on it; they carry — 10–22 m from
    // the known carrier with a line on it
    check('R(b) the perch: a charger holds a spot 10–22 m from the shell with a line on it (shell phase), and 10–22 m from the known enemy carrier with a line on it (they carry)', () => {
      fresh();
      A.forEach((a, i) => { a.setWeapon(i === 1 ? 'charger' : 'shooter'); wake(a, 'normal'); });
      Kp.shell.add = () => {};
      const ch = A[1], sc = Kp.shell.center();
      step(5, () => { for (const a of m.actors) a.invuln = 2; });
      const P = karpPlan(), r1 = P.roleOf(ch), s1 = ch.bot.kSpot ? V(ch.bot.kSpot.x, ch.bot.kSpot.y, ch.bot.kSpot.z) : null;
      const d1 = s1 ? hd(s1, sc) : null, los1 = s1 ? G.physics.los(V(s1.x, s1.y + 1.3, s1.z), sc) : false;
      // they carry: Bravo's carrier in kid form (its marker: located), held
      const c = B[0]; put(c, 0, -14); step(1 / 60); grant(c);
      step(5, () => { c.hp = PLAYER.hp; c.invuln = 99; c.pos.set(0, floorY(0, -14), -14); c.vel.set(0, 0, 0); for (const a of A) a.invuln = 2; });
      const P2 = karpPlan(), r2 = P2.roleOf(ch), kq = ch.bot.kPerch, s2 = kq ? V(kq.x, kq.y, kq.z) : null;   // (a nav node)
      const d2 = s2 ? hd(s2, c.pos) : null, los2 = s2 ? G.physics.los(V(s2.x, s2.y + 1.3, s2.z), V(c.pos.x, c.pos.y + 1.0, c.pos.z)) : false;
      return { ok: r1 === 'perch' && d1 >= 10 && d1 <= 22 && los1 && r2 === 'perch' && d2 >= 10 && d2 <= 22 && los2, info: { shell: { role: r1, d: d1, los: los1 }, theirs: { role: r2, d: d2, los: los2 } } };
    }, flip(KARP_AI, { perch: false }));
    // (c) the free phase's fighters: the Bazookarp free at the Pond (held untouchable), Alpha's grabber makes for it, the rest
    // fight round it 3–8 m out on Bravo's side
    check('R(c) the free phase: the grabber makes for the Bazookarp, the rest fight round it 3–8 m out on the other team\'s side', () => {
      fresh();
      for (const a of A) { a.setWeapon('shooter'); wake(a, 'normal'); }
      ring(A, 7);
      Kp.shell.clear(); Kp.pos.copy(Kp.R.pond); Kp.restNode = -1; Kp._setPhase('free', 99);
      step(4, () => { Kp.phaseT = 99; for (const a of m.actors) a.invuln = 2; });
      const P = karpPlan(), pad = G.level.spawnPads[1], kp = Kp.pos, ex = pad.x - kp.x, ez = pad.z - kp.z;
      const rows = A.map((a) => ({ role: P.roleOf(a), d: +hd(a.pos, kp).toFixed(2), their: (a.pos.x - kp.x) * ex + (a.pos.z - kp.z) * ez > 0 }));
      const grab = rows.filter((r) => r.role === 'grab'), fight = rows.filter((r) => r.role === 'fight');
      return { ok: grab.length >= 1 && grab.some((r) => r.d < 2) && fight.length >= 2 && fight.every((r) => r.d >= 3 && r.d <= 8 && r.their), info: rows };
    }, flip(KARP_AI, { fightR: 15 }));
    // (d) re-forming / resetting: melee breakers close in on a standing shell; the Bazookarp resets (flies back) and re-forms —
    // meanwhile they stand 6–8 m out (outside the burst), then close in again once it stands
    check('R(d) re-forming / resetting: the breakers reposition to the ring (spots 5.8–9.6 m: SPEC 6–8 m, the ring\'s nodes) from the resting spot (outside the burst) while it flies back and re-forms, and close in again once it stands', () => {
      fresh();
      const mel = ['roller', 'blade', 'mitts', 'brush'];
      for (const a of A) { a.setWeapon(mel[a.slot % 4]); wake(a, 'normal'); }
      ring(A, 6); Kp.shell.add = () => {};
      step(3, () => { keepAlive(A); for (const a of m.actors) a.invuln = 2; });
      const before = A.map((a) => a.bot.kSpot ? +hd(a.bot.kSpot, Kp.R.pond).toFixed(2) : null);
      Kp._reset(Kp.R.pond.clone(), 'none');
      const during = []; let minD = Infinity, fr = 0;
      step(2.2, (i) => { keepAlive(A); for (const a of m.actors) a.invuln = 2; if (Kp.phase !== 'resetting' && Kp.phase !== 'reforming') return; fr++; if (i > 20) for (const a of A) if (a.bot.kSpot) during.push(hd(a.bot.kSpot, Kp.R.pond)); if (i > 70) for (const a of A) minD = Math.min(minD, hd(a.pos, Kp.R.pond)); });
      Kp.shell.add = () => {};
      step(3, () => { keepAlive(A); for (const a of m.actors) a.invuln = 2; });
      const after = A.map((a) => a.bot.kSpot ? +hd(a.bot.kSpot, Kp.R.pond).toFixed(2) : null);
      return { ok: during.length > 20 && Math.min(...during) >= 5.8 && Math.max(...during) <= 9.6 && minD >= 4.5 && after.filter((d) => d !== null && d < 4.5).length >= 3, info: { before, duringMin: Math.min(...during), duringMax: Math.max(...during), minD, after, frames: fr, phase: Kp.phase } };
    }, flip(KARP_AI, { reformOut: false }));
  }

  // ============================================================================ S. specials (SPEC §8.6)
  if (want('S')) {
    const { karpSpecial } = await import('./src/game/botsKarp.js');
    // (a) a breaker with a bomb-type special (a barrage) keeps it for the shell: not below 40 % of ours, thrown above
    check('S(a) a breaker keeps a bomb-type special (barrage) for the shell: held at 30 % of ours, thrown at 45 % (special:use)', () => {
      fresh();
      const a0 = A[0]; a0.setWeapon('shooter'); a0.setSpecial('barrage'); wake(a0, 'normal'); put(a0, 0, -7);
      Kp.shell.add = () => {};
      step(0.5, () => { pinMeter(0.3); a0.special = a0.specialCost(); a0.invuln = 2; });
      const P = karpPlan(), lo = karpSpecial(a0.bot, P, false, 0, false);
      const e0 = ev.length; let used = false;
      step(2.5, () => { pinMeter(0.3); a0.invuln = 2; if (!used && ev.slice(e0).some((e) => e[0] === 'special:use' && e[1].actor === a0)) used = true; });
      const usedLo = used;
      a0.special = a0.specialCost();
      const hi = (pinMeter(0.45), karpSpecial(a0.bot, P, false, 0, false));
      const e1 = ev.length; used = false;
      step(2.5, () => { pinMeter(0.45); a0.invuln = 2; if (!used && ev.slice(e1).some((e) => e[0] === 'special:use' && e[1].actor === a0)) used = true; });
      return { ok: lo === false && !usedLo && hi === true && used, info: { at30: lo, used30: usedLo, at45: hi, used45: used } };
    }, flip(KARP_AI, { spShell: 2 }));
    // (b) escorts fire specials only while our carrier is threatened (a known foe within 15 m of it); (d) a Bubble Guard
    // holder within 5 m pops it then and the carrier gets it (sprules' pass-on)
    check('S(b) an escort\'s special waits while nobody threatens our carrier (karpSpecial false), and is free to go once a known foe is within 15 m of it', () => {
      fresh();
      const c = A[0], e = A[1], foe = B[0]; c.setWeapon('shooter'); put(c, 0, -2); step(1 / 60); grant(c);
      e.setWeapon('shooter'); e.setSpecial('strike'); wake(e, 'normal'); put(e, 2, -4);
      step(0.6, () => { e.special = e.specialCost(); c.hp = PLAYER.hp; });
      const P = karpPlan(), role = P.roleOf(e), calm = karpSpecial(e.bot, P, false, 0, false);
      put(foe, 6, 8);
      step(0.8, () => { track(foe, 0); foe.invuln = 99; e.special = e.specialCost(); c.hp = PLAYER.hp; });
      const thr = karpSpecial(e.bot, karpPlan(), false, 0, false);
      return { ok: ['lead', 'flank', 'anchor'].includes(role) && calm === false && thr !== false, info: { role, calm, threatened: thr } };
    }, flip(KARP_AI, { spThreat: 0 }));
    check('S(c) an interceptor fires its Vortex Strike at the known enemy carrier (karpSpecial true), and holds it while the carrier is unknown', () => {
      fresh();
      const c = B[0], w = A[2]; w.setWeapon('shooter'); w.setSpecial('strike'); put(w, 0, -8);
      [A[0], A[1], A[3]].forEach((a, i) => put(a, -3 + i * 3, -29));   // (asleep by the weirs: the keeper is one of them)
      // (picked up under its ink, w still asleep: never a look at it in kid form — its marker would be one)
      put(c, -10, -12); step(1 / 60); grant(c);
      const cu = c.update; c.update = () => { c.anim.time = G.time; };   // (its form is the test's)
      c.form = 'squid'; c.submerged = true; c.anim.form = 'swim'; c.grounded = true;
      wake(w, 'normal');
      // unknown: hidden in the alley, never seen — the special held (karpSpecial false, no special:use)
      const used = (e0) => ev.slice(e0).some((q) => q[0] === 'special:use' && q[1].actor === w);
      let e0 = ev.length;
      step(1.2, () => { c.pos.set(-10, floorY(-10, -12), -12); c.form = 'squid'; c.submerged = true; c.anim.form = 'swim'; c.invuln = 99; if (!w.specialActive) w.special = w.specialCost(); });
      const P = karpPlan(), r0 = P.roleOf(w), hid = karpSpecial(w.bot, P, false, 0, false), usedHid = used(e0);
      // known: in kid form (its marker) — fired at it (special:use)
      e0 = ev.length; let kn = null;
      step(1.5, () => { c.pos.set(0, floorY(0, -14), -14); c.form = 'kid'; c.submerged = false; c.anim.form = 'kid'; c.invuln = 99; if (!w.specialActive) w.special = w.specialCost(); w.invuln = 2; if (kn === null && karpPlan().foes[0].some((f) => f.e === c) && w.specialReady()) kn = karpSpecial(w.bot, karpPlan(), false, 0, false); });
      const r1 = karpPlan().roleOf(w), usedKn = used(e0);
      c.update = cu;
      return { ok: r1 === 'intercept' && hid === false && !usedHid && kn === true && usedKn, info: { roleHidden: r0, hidden: hid, usedHidden: usedHid, roleKnown: r1, known: kn, usedKnown: usedKn } };
    });
    check('S(d) the Bubble Guard\'s share: an escort holding one beside our carrier keeps it while nobody threatens the carrier, pops it once a known foe is within 15 m (special:use) and the carrier ends up inside a Bubble Guard', () => {
      fresh();
      const c = A[0], e = A[1], foe = B[0]; c.setWeapon('shooter'); put(c, 0, -2); step(1 / 60); grant(c);
      e.setWeapon('shooter'); e.setSpecial('bubbler'); wake(e, 'normal'); put(e, 1.5, -3);
      const hold = () => { c.hp = PLAYER.hp; c.pos.set(0, floorY(0, -2), -2); c.vel.set(0, 0, 0); };
      const used = (e0) => ev.slice(e0).some((q) => q[0] === 'special:use' && q[1].actor === e);
      // no threat: held
      let e0 = ev.length;
      step(1.2, () => { hold(); if (!e.specialActive) e.special = e.specialCost(); });
      const P = karpPlan(), role = P.roleOf(e), calm = karpSpecial(e.bot, P, false, 0, false), usedCalm = used(e0);
      // a known foe 11.7 m from the carrier: popped, and the carrier gets it
      put(foe, 6, 8); e0 = ev.length; let shield = 0;
      step(3, () => { hold(); track(foe, 0); foe.invuln = 99; if (c.status.shield > 0) shield++; });
      return { ok: ['lead', 'flank', 'anchor'].includes(role) && calm === false && !usedCalm && used(e0) && shield > 0, info: { role, calm, usedCalm, usedThreatened: used(e0), carrierShieldFrames: shield } };
    }, flip(KARP_AI, { spThreat: 0 }));
  }

  // ============================================================================ Y. difficulty (SPEC §8.8)
  if (want('Y')) {
    // (a) interceptors: easy 1 (the rest keep), normal 2 + the leftover, hard the same from two sides
    check('Y(a) interceptors by difficulty: easy 1 (the rest keep), normal ≥ 2, hard ≥ 2 approaching from both sides', () => {
      const res = {};
      for (const diff of ['easy', 'normal', 'hard']) {
        fresh();
        for (const a of A) { a.setWeapon('shooter'); a.bot.setDifficulty(diff); }
        const c = B[0]; put(c, 0, -10); step(1 / 60); grant(c);
        const P = karpPlan(); P.roles[0] = new Map(); P.dirty = true; P.tick();
        const ic = A.filter((a) => P.roleOf(a) === 'intercept');
        res[diff] = { icpt: ic.length, keep: A.filter((a) => P.roleOf(a) === 'keeper').length, sides: [...new Set(ic.map((a) => P.auxOf(a)))].sort() };
      }
      return { ok: res.easy.icpt === 1 && res.easy.keep === 3 && res.normal.icpt >= 2 && res.hard.icpt >= 2 && res.hard.sides.includes(-1) && res.hard.sides.includes(1), info: res };
    }, flip(KARP_AI.diff.easy, { icpt: 2 }));
    // (b) the grab delay after the burst (on top of the 0.25 s hold): easy 0.6 s, hard 0 s (normal: D)
    check('Y(b) the grab after the burst\'s hold: easy within 0.6 s and not before 0.3 s, hard within 0.1 s', () => {
      const res = [];
      for (const [diff, k] of [['easy', 0], ['easy', 1], ['hard', 0], ['hard', 1]]) {
        fresh();
        const gA = A[k]; gA.setWeapon('shooter'); gA.setSub('bomb'); wake(gA, diff); put(gA, 0, -9);
        restAt(Kp.R.pond.clone(), 500);
        const add0 = Kp.shell.add; Kp.shell.add = () => {};
        step(3.5, () => { pinMeter(0.9); gA.hp = PLAYER.hp; });
        Kp.shell.add = add0;
        const t0 = G.time; let tp = null;
        const at = { d: +hd(gA.pos, Kp.shell.center()).toFixed(2), mode: gA.bot.mode, role: gA.bot.kRole, esc: !!gA.bot.sp.esc };
        Kp.shell.add(0, Kp.shell.hp * 2, gA);
        step(2, () => { if (Kp.holder === gA && tp === null) tp = G.time - t0; if (tp !== null) return false; });
        res.push({ diff, role: gA.bot.kRole, after: tp === null ? null : +(tp - K.pickHold).toFixed(3), atBurst: at, phase: Kp.phase, holder: Kp.holder?.name || null, d: +hd(gA.pos, Kp.pos).toFixed(2), mode: gA.bot.mode });
      }
      const ok = res.every((r) => r.after !== null && (r.diff === 'easy' ? r.after >= 0.3 && r.after <= 0.6 + 1 / 60 : r.after >= -1e-6 && r.after <= 0.1));
      return { ok, info: res };
    }, flip(KARP_AI.diff.easy, { grab: 0 }));
    // (c) easy never lobs at a foe it can't see; normal does (over the Pond's wall at a located foe 10 m off)
    check('Y(c) easy carriers never lob at a foe out of sight (always full charge, only with a line); normal ones lob over cover', () => {
      const res = {};
      for (const diff of ['easy', 'normal']) {
        fresh();
        const c = A[0], foe = B[0]; c.setWeapon('shooter'); wake(c, diff); put(c, -6, 0); step(1 / 60); grant(c);
        put(foe, 4, 0);
        let foeShots = 0;
        step(3, () => { c.hp = PLAYER.hp; c.pos.set(-6, floorY(-6, 0), 0); c.vel.set(0, 0, 0); foe.pos.set(4, floorY(4, 0), 0); foe.vel.set(0, 0, 0); foe.invuln = 99; track(foe, 0); if (c.bot.kc && c.bot.kc.kind === 'foe' && c.intent.fire) foeShots++; });
        res[diff] = { foeShotFrames: foeShots, seen: !!c.bot.sight.sees?.(foe) };
      }
      return { ok: res.easy.foeShotFrames === 0 && res.normal.foeShotFrames > 0, info: res };
    }, flip(KARP_AI.diff.easy, { lob: true }));
    // (d) hard leads a moving target; normal aims at where it is
    check('Y(d) hard carriers lead a foe crossing in the open at 4 m/s (the aim ahead of it), normal ones aim at where it is', () => {
      const res = {};
      for (const diff of ['hard', 'normal']) {
        fresh();
        const c = A[0], foe = B[0]; c.setWeapon('shooter'); wake(c, diff); put(c, 0, -14); step(1 / 60); grant(c);
        let fx = -8; put(foe, fx, 0); const offs = [];
        step(3, () => { c.hp = PLAYER.hp; c.pos.set(0, floorY(0, -14), -14); c.vel.set(0, 0, 0); fx = fx + 4 / 60; if (fx > 8) fx = -8; foe.pos.set(fx, floorY(fx, 0), 0); foe.vel.set(4, 0, 0); foe.invuln = 99;
          const S = c.bot.kc; if (S && S.kind === 'foe') { const by = Math.atan2(foe.pos.x - c.pos.x, foe.pos.z - c.pos.z); offs.push(((S.yaw - by + 9 * Math.PI) % (2 * Math.PI)) - Math.PI); } });
        const mean = offs.length ? offs.reduce((s2, v) => s2 + v, 0) / offs.length : null;
        res[diff] = { n: offs.length, meanLead: mean };
      }
      // (+x motion seen from the south: a lead turns the aim toward +x — a positive yaw offset)
      return { ok: res.hard.n > 20 && res.normal.n > 20 && res.hard.meanLead > 0.08 && Math.abs(res.normal.meanLead) < 0.05, info: res };
    }, flip(KARP_AI.diff.hard, { lead: false }));
    // (e) the route re-pick period: easy 3 s, normal 1.5 s, hard 1 s
    check('Y(e) the carrier\'s route re-pick period: easy 3 s, normal 1.5 s, hard 1 s', () => {
      const res = {};
      for (const diff of ['easy', 'normal', 'hard']) {
        fresh();
        const c = A[0]; c.setWeapon('shooter'); wake(c, diff); put(c, -4, -22); step(1 / 60); grant(c);
        const ts = []; let last = null;
        step(7, () => { c.hp = PLAYER.hp; const RT = karpPlan().route[0]; if (RT && RT.t !== last) { last = RT.t; ts.push(RT.t); } });
        const iv = ts.slice(1).map((t, i) => t - ts[i]).filter((d) => d > 0.05).sort((x, y) => x - y);
        res[diff] = { med: iv.length ? +iv[iv.length >> 1].toFixed(2) : null, n: iv.length };
      }
      const near = (v, w) => v !== null && Math.abs(v - w) <= 0.12;
      return { ok: near(res.easy.med, 3) && near(res.normal.med, 1.5) && near(res.hard.med, 1), info: res };
    }, flip(KARP_AI.diff.normal, { repick: 3 }));
  }

  // ============================================================================ W. no wall-hack in the defending plan
  if (want('W')) {
    // Bravo's two weirs on Alpha's half: w10 (0, 1.2, −28) and w11 (−9, 2.5, −28). Two hiding places, out of sight of both:
    // the alley (−10, −12: nearer w11) and the flank lane behind its wall (17, −10: nearer w10)
    const WEST = [-10, -12], EAST = [17, -10];
    const c = B[0];
    const squid = (x, z) => { c.pos.set(x, floorY(x, z), z); c.vel.set(0, 0, 0); c.form = 'squid'; c.submerged = true; c.grounded = true; c.groundTeam = 1; c.anim.form = 'swim'; c.hp = PLAYER.hp; c.invuln = 99; };
    const kid = (x, z) => { c.pos.set(x, floorY(x, z), z); c.vel.set(0, 0, 0); c.form = 'kid'; c.submerged = false; c.anim.form = 'kid'; c.hp = PLAYER.hp; c.invuln = 99; };
    // (a) the plan alone (Alpha asleep: no look at all), easy (one interceptor: the choice is by where the carrier is believed
    // to be): the carrier picked up in the alley, then hidden there and in the lane
    fresh(KARPBOX_TWO);
    for (const a of A) { a.setWeapon(['shooter', 'shooter', 'blaster', 'roller'][a.slot % 4]); a.bot.setDifficulty('easy'); }
    [[-12, -2], [15, -4], [-2, -31], [0, -50]].forEach(([x, z], i) => put(A[i], x, z));
    put(c, ...WEST); step(1 / 60); grant(c);
    const cu = c.update; c.update = () => { c.anim.time = G.time; };
    const pb = A[3].bot, foeAt = V(EAST[0] + 5, 0, EAST[1] + 6);   // (a foe 8 m from the lane spot, 33 m from the alley)
    const read = ([x, z]) => {
      squid(x, z); step(0.1, () => squid(x, z));
      const P = karpPlan(); P.roles[0] = new Map(); P.dirty = true; P.tick();
      const look = karpPerchLook ? karpPerchLook(pb, P) : null;
      const r0 = pb.kRole, tv0 = pb.tv; pb.kRole = 'perch'; pb.tv = { pos: foeAt };
      const eng = karpEngage(pb, P); pb.kRole = r0; pb.tv = tv0;
      return { at: [x, z], known: !!teamKnown(0, c, 99), defends: P.defendObj(0)?.key, look: look ? [+look.x.toFixed(1), +look.z.toFixed(1)] : null, icpt: A.filter((a) => P.roleOf(a) === 'intercept').map((a) => a.name).join(','), engage: eng };
    };
    const rw = read(WEST), re = read(EAST);
    const same = rw.defends === re.defends && rw.icpt === re.icpt && rw.engage === re.engage && !!rw.look && !!re.look && Math.hypot(rw.look[0] - re.look[0], rw.look[1] - re.look[1]) < 0.5;
    R('W(a) the plan, Alpha never having seen the hidden carrier: moving it from the alley (its pick-up) to the lane changes neither the defended weir, nor the perch\'s look, nor the interceptor, nor whether a perch takes a fight 8 m from it', !rw.known && !re.known && same && re.defends === 'w11' && re.engage === false, { west: rw, east: re });
    c.update = cu;
    // (b) end to end, Alpha awake (normal): seen once (its pick-up, or a look in kid form), then hidden at the other place —
    // the keeper and the plan stay with what was seen. Frames once any Alpha bot really knows the live spot don't count
    const e2e = (pick, show, hide) => {
      fresh(KARPBOX_TWO);
      for (const a of A) { a.setWeapon(['shooter', 'charger', 'blaster', 'roller'][a.slot % 4]); wake(a, 'normal'); }
      put(c, ...pick); step(1 / 60); grant(c);
      const cu2 = c.update; c.update = () => { c.anim.time = G.time; };
      if (show) step(1.5, () => kid(...show));   // (in kid form: its marker shows through walls — a look)
      const keys = {}; let free = 0, legit = null; const W0 = Kp.weirs[1][0].pos, W1 = Kp.weirs[1][1].pos;
      step(8, (i) => {
        squid(...hide); for (const a of A) a.hp = PLAYER.hp;
        const k = teamKnown(0, c, 99);
        if (k && hd(k.guess, c.pos) < 4) { if (legit === null) legit = i; return; }
        if (legit !== null) return;
        free++; const key = karpPlan().defendObj(0)?.key; keys[key] = (keys[key] || 0) + 1;
      });
      // (whose hold spot each keeper is going to: one of w10's or w11's)
      const P = karpPlan(), kp = A.filter((a) => a.alive && P.roleOf(a) === 'keeper');
      const L0 = P.keepSpots({ key: 'w10', pos: W0 }, 0).spots, L1 = P.keepSpots({ key: 'w11', pos: W1 }, 0).spots;
      const spotOf = (b) => (!b.kSpot ? null : L1.some((q) => hd(q, b.kSpot) < 1) ? 'w11' : L0.some((q) => hd(q, b.kSpot) < 1) ? 'w10' : '?');
      c.update = cu2;
      return { pick, show, hide, unknownFrames: free, knownFromFrame: legit, keys, keeperSpots: kp.map((a) => spotOf(a.bot)), keeperToW10: kp.map((a) => +hd(a.pos, W0).toFixed(1)), keeperToW11: kp.map((a) => +hd(a.pos, W1).toFixed(1)) };
    };
    const b1 = e2e(WEST, null, EAST), b2 = e2e([0, 0], WEST, EAST);
    const okB = (r, key) => r.unknownFrames > 240 && Object.keys(r.keys).length === 1 && r.keys[key] > 0 && (r.knownFromFrame !== null || (r.keeperSpots.length > 0 && r.keeperSpots.every((q) => q === key)));
    R('W(b) end to end: a carrier picked up in the alley (b1), or seen there in kid form (b2), then hidden in the lane: Alpha\'s keeper holds the alley\'s weir (w11) all along — its live spot behind the wall never moves it', okB(b1, 'w11') && okB(b2, 'w11'), { b1, b2 });
  }
  } catch (e) { R('HARNESS ' + e.message, false, String(e.stack).slice(0, 600)); }
  offs.forEach((f) => f());
  return out;
})()
