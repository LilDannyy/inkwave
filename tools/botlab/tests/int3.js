// int3 (batch 5, wave 2's integration, [b5-int3]): where the four new subs and the Bazookarp engine meet, on the merged
// code — each scene uses two or more packages at once. The bots are scripted (no brains). Three stages:
//   MAP=karpbox MODE=bazookarp (the Roe Shell at the Pond, a carrier): subs SPEC §0.6's per-sub rules
//     shell     the Glide Bomb bounces off the intact shell (never inside) and its blast counts into it; a dash into
//               it is held outside (dash blockActor) and its blast counts; a bobber thrown at it deploys outside it and a
//               3-chain set off beside it counts into it ONCE (one objTargets.splash 'bobber' a chain); a Scrap Sentry
//               never sees a foe straight behind it (no lock, no round), and sees one past its edge (the control)
//     reform    a carrier splatted among a Scrap Sentry, a 2-bobber chain and a resting Glide Bomb: the re-forming shell
//               (G.deploy.crushIn { sphere }, 'shell') ends the sentry and the bobbers, one 'device:down' how 'shell' each;
//               the Glide is never crushed (crushable false); a Drip Curtain whose sheet stands 3 m off (its base 3 m out,
//               the sheet across) is left standing — the sphere test reads the sheet, not a 1.7 m-radius body round its
//               base (b5-sub-bobber's crushIn would have crushed it: the karp review's open point)
//     carrier   the carrier's sub press bonks ('sub:cantuse' kind 'karp', no dash); a dash running into the pick-up ends
//               there (dashT 0, ≤ 7 m/s); a Glide cooking at the pick-up fizzles (no stone); a sentry and bobbers already
//               out keep working after their owner picks it up
//   MAP=testbox MODE=tower
//     tower     the moving tower crushes an enemy sentry on its track (how 'crush'); bobbers floating over the track
//               ahead are crushed or lifted onto the deck — never inside it; a sentry and a bobber on the deck ride it
//   MAP=testbox MODE=turf
//     curtain   a dash into an enemy Drip Curtain at 1/60 and 1/24 never crosses its sheet (the dash's substeps run
//               subs.js blockActor's curtain push)
//     throwhold a bot teammate's Splat Bomb press that would land in a human's idle 2-chain is held (bobber-bots
//               throwHits: the press cleared, the chain stands); a foe in the chain: not held; no chain: not held
//     thinwall  DECISIONS #22: a Twinfire roll and a Mitts leap into a 0.10 m wall at 60 and 24 frames a second never
//               cross it (the dash's sub-step rule, actor.js _fastSteps); with the rule switched off they do at 24 (the
//               check bites); in the open the roll goes as far at 24 as at 60
//   MAP=calamari MODE=turf (a moving floor: the railcars)
//     rail      a Chain Bobber thrown onto a railcar's roof rides it to its other stop; a Scrap Sentry can't be set down
//               on that roof (a roof: "Set it down on open ground"); one standing on the trackbed in the car's way is
//               shoved out of it or crushed ('device:down' how crush) — never left inside the car
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/int3.js tools/botlab/run.sh tools/botlab/page.cjs   (shell, reform,
//   carrier) · MAP=testbox MODE=tower (tower) · MAP=testbox MODE=turf (curtain, throwhold, thinwall) · MAP=calamari
//   MODE=turf (rail) · PAGE_ARGS='only=shell,…'
(async () => {
  const g = window.__inkwave, m = g.match, G = __G, dbg = g.debug;
  const THREE = await import('three');
  const { PLAYER, SUBS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  const crash = (name, e) => R(`${name}: the scene threw`, false, String(e && e.stack || e).slice(0, 500));
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const KARP = m.mode === 'bazookarp' && !!m.karp, TOWER = m.mode === 'tower' && !!m.tower;
  const SCENES = { shell: 'karp', reform: 'karp', carrier: 'karp', tower: 'tower', curtain: 'turf', throwhold: 'turf', thinwall: 'turf', rail: 'turf' };
  const want = (k) => (!ONLY || ONLY.split(',').includes(k)) && (SCENES[k] === 'karp' ? KARP : SCENES[k] === 'tower' ? TOWER : !KARP && !TOWER);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100;
  dbg.freeze();
  let DT = 1 / 60, hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s / DT)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();
  const S = G.subs, P = G.projectiles, KB = SUB_KITS.bobber, KS = SUB_KITS.sentry, KG = SUB_KITS.glide, KD = SUB_KITS.dash;
  const me = m.local;
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  const floorY = (x, z, hint = 3) => { const y = G.level.groundHeight(x, z, hint); return y > -50 ? y : 0; };
  const put = (a, x, z, y = null) => {
    if (!a.alive) a.respawn();
    a.superJumpState = null; if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; }
    a.pos.set(x, y ?? floorY(x, z), z); a.vel.set(0, 0, 0); a.grounded = false; a.smoothY = 0; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.climbing = false;
    a.ink = PLAYER.inkMax; a.status.shield = 0; a.netTp = (a.netTp || 0) + 1; idle(a);
  };
  const aim = (a, yaw, pitch = 0) => { a.yaw = a.aimYaw = yaw; a.aimPitch = pitch; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = pitch; } };
  const EV = [];
  for (const n of ['device:down', 'device:hit', 'sub:cantuse', 'glide:bounce', 'glide:fizzle', 'sentry:fire', 'sentry:lock', 'sub:dash', 'bobber:trigger', 'karp:pickup'])
    on(n, (e) => EV.push({ n, t: G.time, kind: e.kind, how: e.how, e }));
  const evs = (n, t0 = -1) => EV.filter((x) => x.n === n && x.t >= t0);
  const sentryOf = (a) => KS.items.filter((x) => x.owner === a && x.state !== 'dead').pop() || null;
  const bobbersOf = (a) => KB.items.filter((x) => x.owner === a && x.state !== 'dead');
  const settle = (L, s = 2.5) => step(s, () => !L.every((o) => o.state === 'live'));
  const clearAll = () => { P.clear(); S.clear(); G.specials.clear(); G.paint.clear?.(); };

  // ================================================================================================ Bazookarp (karpbox)
  let Kp = m.karp;
  const karpSetup = async () => {
    const { Bazookarp } = await import('./src/game/bazookarp.js');
    const { LoopWire } = await import('./src/game/karpWire.js');
    const { KARPBOX_DEF } = await import('./tools/botlab/karpbox.js');
    return (opts = {}) => {
      Kp?.dispose(); G.level.layout.bazookarp = KARPBOX_DEF;
      m.time = 200; m.state = 'playing'; m.result = null;
      if (m.karp) m.karp.winner = 'disposed';
      clearAll();
      m.karp = Kp = new Bazookarp(m, new LoopWire());
      for (const a of m.actors) { const p = G.level.spawnPads[a.team]; put(a, p.x + ((a.slot % 4) - 1.5) * 1.6, p.z + (a.team ? 2.5 : -2.5), p.y); }
      step(0.05);
      if (opts.big) { Kp.shell.hpMax = 1e9; Kp.shell.m = 0; }   // (it counts, it never bursts)
      // every objective splash the subs make, by weapon id
      const sp0 = G.objTargets.splash; SPL.length = 0;
      G.objTargets.splash = function (att, c, Rr, mx, mn, wid, o) { SPL.push({ wid, t: G.time, team: att?.team }); return sp0.apply(this, arguments); };
      return Kp;
    };
  };
  const SPL = [];
  const fresh = KARP ? await karpSetup() : null;
  const freeAt = (p) => { Kp.shell.clear(); Kp.pos.copy(p); Kp.restNode = -1; Kp._setPhase('free', 0); };
  const grant = (a) => { freeAt(V(a.pos.x, a.pos.y, a.pos.z)); step(2 / 60); return Kp.holder === a; };

  if (want('shell')) try {
    // ---- the Glide Bomb: a tap from 4.2 m slid at the shell — it bounces off it as off a wall; blown just after
    fresh({ big: true });
    let sc = Kp.shell.center(), r0 = Kp.shell.radius();
    const th = A[1]; th.setSub('glide'); put(th, sc.x + 4.2, sc.z); aim(th, -Math.PI / 2); step(0.05);
    const t0 = G.time, n0 = Kp.shell.stats.counted[0];
    S.use(th, SUBS.glide);
    const stone = KG.items.filter((x) => x.owner === th && x.state !== 'dead').pop();
    let pen = -9, bounced = false;
    step(1.2, () => {
      if (!stone || stone.state === 'dead') return false;
      const dy = stone.p.y + 0.14 - sc.y, rr = Math.sqrt(Math.max(0, r0 * r0 - dy * dy));
      pen = Math.max(pen, rr - Math.hypot(stone.p.x - sc.x, stone.p.z - sc.z));
      if (!bounced && stone.bounces > 0) { bounced = true; stone.fuse = Math.min(stone.fuse, 0.2); }
    });
    step(0.5);
    const gb = evs('glide:bounce', t0).map((x) => x.e.kind), gs = SPL.filter((x) => x.wid === 'glide');
    R('shell × Glide: a stone slid at the intact Roe Shell bounces off it (glide:bounce kind shell), its body never inside the sphere, and its blast counts into the shell (one objTargets.splash \'glide\')',
      !!stone && bounced && gb.includes('shell') && pen < 0.02 && gs.length === 1 && Kp.shell.stats.counted[0] > n0,
      { bounced, kinds: gb, deepest: pen, splashes: gs.length, counted: Kp.shell.stats.counted[0] - n0, why: stone && stone.why });

    // ---- the Dash Pellet: dashed straight at the shell from 3 m (4.5 m of dash would end 1.5 m past its centre)
    fresh({ big: true }); sc = Kp.shell.center(); r0 = Kp.shell.radius();
    const d = A[2]; d.setSub('dash'); put(d, sc.x + 3.0, sc.z); aim(d, -Math.PI / 2); step(0.1);
    const n1 = Kp.shell.stats.counted[0], t1 = G.time;
    d.bot.dashDir = { x: -1, z: 0 }; S.use(d, SUBS.dash);
    let worst = 9; const dashT0 = d.weaponRunner.dashT;
    step(0.6, () => { const dy = d.pos.y + 0.8 - sc.y, rr = Math.sqrt(Math.max(0, r0 * r0 - dy * dy)) + PLAYER.radius; worst = Math.min(worst, Math.hypot(d.pos.x - sc.x, d.pos.z - sc.z) - rr); });
    const ds = SPL.filter((x) => x.wid === 'dash' && x.t >= t1);
    R('shell × dash: a dash straight at the shell is held outside it every frame (its substeps push the body out — dash blockActor), and its blast counts into the shell',
      dashT0 > 0 && worst > -0.06 && ds.length === 1 && Kp.shell.stats.counted[0] > n1, { dashT0, worstGap: worst, splashes: ds.length, counted: Kp.shell.stats.counted[0] - n1, end: [r2(d.pos.x - sc.x), r2(d.pos.z - sc.z)] });

    // ---- the Chain Bobber: one thrown flat at the shell deploys outside it; a 3-chain beside it, set off: ONE splash
    fresh({ big: true }); sc = Kp.shell.center(); r0 = Kp.shell.radius();
    const bo = A[3]; bo.setSub('bobber'); put(bo, sc.x + 5, sc.z); step(0.05);
    const b1 = KB.throwFrom(bo, V(sc.x + 3.4, sc.y + 0.3, sc.z), V(-7, 1.5, 0));
    let inside1 = 0;
    step(2, () => { if (b1.pos.distanceTo(sc) < r0 - 0.05) inside1++; return b1.state !== 'live'; });
    const off1 = b1.state === 'live' ? b1.spot.distanceTo(sc) - r0 : null;
    const fy = floorY(sc.x + 2.6, sc.z);
    const b2 = KB.throwFrom(bo, V(sc.x + 2.8, fy + 0.6, sc.z + 1.6), V(0, -3, 0)), b3 = KB.throwFrom(bo, V(sc.x + 2.8, fy + 0.6, sc.z - 1.6), V(0, -3, 0));
    settle([b1, b2, b3]); step(0.6);
    const N = b1.chain ? b1.chain.n : 0, n2 = Kp.shell.stats.counted[0], t2 = G.time;
    KB.trigger(b1, bo);
    step(1.2);
    const bs = SPL.filter((x) => x.wid === 'bobber' && x.t >= t2);
    R('shell × bobber: one thrown flat at the shell deploys outside it (never inside; 0.45 m out from its surface); a 3-chain beside it, set off, counts into the shell ONCE (one objTargets.splash \'bobber\')',
      inside1 === 0 && off1 != null && off1 > 0.25 && off1 < 0.75 && N === 3 && bs.length === 1 && Kp.shell.stats.counted[0] > n2,
      { insideFrames: inside1, offSurface: off1, chain: N, splashes: bs.length, counted: Kp.shell.stats.counted[0] - n2, states: [b1, b2, b3].map((x) => x.state) });

    // ---- the Scrap Sentry: a foe straight behind the shell is never seen; one past its edge is (the control)
    fresh({ big: true }); sc = Kp.shell.center(); r0 = Kp.shell.radius();
    const se = A[1]; se.setSub('sentry'); put(se, sc.x, sc.z + 5.4); aim(se, Math.PI); step(0.1);
    S.use(se, SUBS.sentry); const sen = sentryOf(se); put(se, -14, -30);
    const foe = B[0]; put(foe, sc.x, sc.z - 3.4);
    const t3 = G.time;
    step(2.2, () => { foe.pos.set(sc.x, floorY(sc.x, sc.z - 3.4), sc.z - 3.4); foe.vel.set(0, 0, 0); foe.hp = PLAYER.hp; });
    const hidden = { target: !!sen?.target, locks: evs('sentry:lock', t3).length, rounds: evs('sentry:fire', t3).length };
    const t4 = G.time;
    step(2.0, () => { foe.pos.set(sc.x + 4, floorY(sc.x + 4, sc.z - 2), sc.z - 2); foe.vel.set(0, 0, 0); foe.hp = PLAYER.hp; });
    const seen = { locks: evs('sentry:lock', t4).length, rounds: evs('sentry:fire', t4).length };
    R('shell × sentry: a foe straight behind the intact shell is never seen (no lock, no round in 2 s: its sight ends at the sphere); moved past its edge, the sentry locks and fires',
      !!sen && sen.pos.distanceTo(sc) > r0 && hidden.locks === 0 && hidden.rounds === 0 && seen.locks >= 1 && seen.rounds >= 1, { placed: !!sen, hidden, seen, at: sen && [r2(sen.pos.x - sc.x), r2(sen.pos.z - sc.z)] });
  } catch (e) { crash('shell', e); }

  if (want('reform')) try {
    fresh();
    const c = A[0]; put(c, -2, 10); step(1 / 60); grant(c); step(0.05);
    const carried = Kp.holder === c;
    // a sentry (A1's), set down 0.9 m ahead of A1 — 0.3 m from the carrier's feet; a 2-chain of A2's floating by them
    const sA = A[1]; sA.setSub('sentry'); put(sA, -2, 11.2); aim(sA, Math.PI); step(0.05); S.use(sA, SUBS.sentry); const sen = sentryOf(sA); put(sA, -14, -30);
    const bA = A[2]; bA.setSub('bobber'); put(bA, -6, 10);
    const q1 = KB.throwFrom(bA, V(-1.3, floorY(-1.3, 10) + 0.6, 10), V(0, -3, 0)), q2 = KB.throwFrom(bA, V(-2.7, floorY(-2.7, 9.5) + 0.6, 9.5), V(0, -3, 0));
    // a Glide Bomb of A3's resting by them (a long fuse: still there through the re-form)
    const gA = A[3]; gA.setSub('glide'); put(gA, -1.2, 8.2); aim(gA, 0); step(0.05); S.use(gA, SUBS.glide);
    const st = KG.items.filter((x) => x.owner === gA && x.state !== 'dead').pop();
    if (st) { st.p.set(-1.2, floorY(-1.2, 8.9), 8.9); st.v.set(0, 0, 0); st.fuse = 9; }
    put(gA, 14, -30);
    // a Drip Curtain of B1's: its base 3.0 m out (z 13), thrown along +z so its sheet runs across (along x)
    const cur = S._throw(B[1], SUBS.curtain, V(-2, floorY(-2, 13) + 0.45, 13), V(0, -2, 0.6), false);
    settle([q1, q2]); step(0.8, () => cur.state === 'fly');
    const before = { sentry: sen?.state, bobbers: [q1.state, q2.state], chain: q1.chain?.n || 0, glide: st?.state, curtain: cur.state };
    // the curtain sheet's nearest point to the drop spot (the karp test, exactly)
    const sheetDist = (p) => { const s = cur.sub, dx = p.x - cur.pos.x, dz = p.z - cur.pos.z; const u = Math.max(-s.width / 2, Math.min(s.width / 2, dx * cur.tan.x + dz * cur.tan.z)); return Math.hypot(dx - cur.tan.x * u, dz - cur.tan.z * u); };
    const t0 = G.time;
    c.splat(B[0], 'weapon'); step(0.05);
    const dropAt = Kp.pos.clone(), phase = Kp.phase;
    step(1.3);
    const downs = evs('device:down', t0).map((x) => `${x.kind}:${x.how}`);
    const rMax = Kp.shell.radius();
    R('reform: the re-forming Roe Shell (crushIn { sphere }) ends a Scrap Sentry and a 2-chain of bobbers at the drop spot — one \'device:down\' how \'shell\' each — and never the resting Glide Bomb (crushable false)',
      carried && phase === 'reforming' && before.sentry && before.chain === 2 && !!st && sen.state === 'dead' && q1.state === 'dead' && q2.state === 'dead'
        && downs.filter((x) => x === 'sentry:shell').length === 1 && downs.filter((x) => x === 'bobber:shell').length === 2 && !downs.some((x) => x.startsWith('glide')) && st.why !== 'crush' && Kp.shell.state === 'intact',
      { carried, phase, before, downs, glide: st && [st.state, st.why], shell: Kp.shell.state });
    R('reform: a Drip Curtain whose sheet stands 3 m off the drop spot (its base 3 m out, the sheet across) is left standing — the sphere is tested against the sheet itself, not a 1.7 m-radius body round its base',
      before.curtain === 'curtain' && cur.state === 'curtain' && !downs.some((x) => x.startsWith('curtain')) && sheetDist(dropAt) > rMax + 0.3,
      { curtain: cur.state, sheetOff: sheetDist(dropAt), radius: rMax, baseOff: Math.hypot(cur.pos.x - dropAt.x, cur.pos.z - dropAt.z) });
  } catch (e) { crash('reform', e); }

  if (want('carrier')) try {
    // the carrier's sub press: the Bazookarp's own bonk, no dash
    fresh();
    const c = A[0]; c.setSub('dash'); put(c, 2, 8); step(1 / 60); grant(c); step(0.05);
    const t0 = G.time, d0 = evs('sub:dash').length;
    c.intent.sub = true; step(1 / 60); c.intent.sub = false; step(0.2);
    const bonk = evs('sub:cantuse', t0).map((x) => x.kind);
    R('carrier: the carrier\'s sub press bonks (\'sub:cantuse\' kind karp) and nothing dashes', Kp.holder === c && bonk.includes('karp') && evs('sub:dash').length === d0 && !(c.weaponRunner.dashT > 0),
      { holder: Kp.holder === c, bonk, dashes: evs('sub:dash').length - d0 });
    // a dash that runs into the pick-up ends there
    fresh();
    const c2 = A[1]; c2.setSub('dash'); put(c2, 2, 8); aim(c2, 0); step(0.1);
    c2.bot.dashDir = { x: 0, z: 1 }; S.use(c2, SUBS.dash);
    freeAt(V(c2.pos.x, c2.pos.y, c2.pos.z + 1.0));
    let tPick = null, dashAt = null, spd = null;
    step(0.6, () => { if (tPick == null && Kp.holder === c2) { tPick = G.time; } else if (tPick != null && dashAt == null) { dashAt = c2.weaponRunner.dashT; spd = Math.hypot(c2.vel.x, c2.vel.z); } });
    R('carrier: a dash that runs over the free Bazookarp picks it up and ends there (the pick-up resets the runner: dashT 0, ≤ 7 m/s)',
      tPick != null && dashAt === 0 && spd != null && spd <= 7.05, { picked: tPick != null, dashTAfter: dashAt, speedAfter: spd });
    // a Glide cooking at the pick-up fizzles
    fresh();
    const c3 = A[2]; c3.setSub('glide'); put(c3, -2, 8); aim(c3, 0); step(0.1);
    const fz0 = evs('glide:fizzle').length, n0 = KG.items.length;
    c3.intent.sub = true; step(0.8);
    const cooking = !!c3.weaponRunner.glide;
    grant(c3); step(0.1); c3.intent.sub = false; step(0.3);
    R('carrier: a Glide Bomb cooking at the pick-up fizzles in the hand (glide:fizzle, no stone thrown)', cooking && Kp.holder === c3 && evs('glide:fizzle').length > fz0 && KG.items.filter((x) => x.owner === c3 && x.state !== 'dead').length === 0,
      { cooking, holder: Kp.holder === c3, fizzles: evs('glide:fizzle').length - fz0, stones: KG.items.length - n0 });
    // a sentry and bobbers already out keep working while their owner carries
    fresh();
    const o = A[3]; o.setSub('sentry'); put(o, 4, 6); aim(o, 0); step(0.05); S.use(o, SUBS.sentry); const sen = sentryOf(o);
    // (west of the alley's thin wall, x 5.7…6: open deck)
    const k1 = KB.throwFrom(o, V(1.5, floorY(1.5, 6) + 0.6, 6), V(0, -3, 0)), k2 = KB.throwFrom(o, V(1.5, floorY(1.5, 9) + 0.6, 9), V(0, -3, 0));
    settle([k1, k2]); const bob0 = [k1.state, k2.state];
    put(o, 4, 3); step(1 / 60); grant(o); const tPick5 = G.time;
    const foe = B[2]; put(foe, 4, 14);
    const t5 = G.time;
    step(2.0, () => { foe.pos.set(4, floorY(4, 14), 14); foe.vel.set(0, 0, 0); foe.hp = PLAYER.hp; });
    R('carrier: a Scrap Sentry and Chain Bobbers already out keep working while their owner carries the Bazookarp (the sentry still fires; the bobbers still float)',
      !!sen && Kp.holder === o && sen.state === 'watch' && evs('sentry:fire', t5).length > 0 && bob0.every((x) => x === 'live') && k1.state === 'live' && k2.state === 'live',
      { holder: Kp.holder === o, sentry: sen && sen.state, rounds: evs('sentry:fire', t5).length, before: bob0, bobbers: [k1.state, k2.state], why: [k1.why, k2.why], at: [k1.spot, k2.spot].map((p) => [r2(p.x), r2(p.y), r2(p.z)]),
        trig: evs('bobber:trigger', t5 - 3).map((x) => [x.e.by?.name || null, r2(x.t - t5)]), downs: evs('device:down', t5 - 3).map((x) => `${x.kind}:${x.how}@${r2(x.t - t5)}`), pick: r2(tPick5 - t5) });
  } catch (e) { crash('carrier', e); }

  // ================================================================================================ Tower Command (testbox)
  if (want('tower')) try {
    const T = m.tower, rules0 = T._rules;
    let drive = 0;
    T._rules = function () { if (drive) { this.s = Math.min(this.path.len[0] - 0.5, this.s + drive / 60); this.moving = 1; } else this.moving = 0; };
    const at = (s) => T.path.at(s, V(0, 0, 0));
    const dirAt = (s) => { const a = at(s - 0.3), b = at(s + 0.3); return V(b.x - a.x, 0, b.z - a.z).normalize(); };
    const deck = (lx, lz) => { const c = Math.cos(T.yaw), s = Math.sin(T.yaw); return V(T.pos.x + c * lx + s * lz, T.top, T.pos.z - s * lx + c * lz); };
    const local = (p) => { const dx = p.x - T.pos.x, dz = p.z - T.pos.z, c = Math.cos(T.yaw), s = Math.sin(T.yaw); return V(dx * c - dz * s, p.y - T.top, dx * s + dz * c); };
    clearAll();
    for (const a of m.actors) put(a, -24 + (a.slot % 4) * 2, a.team ? 36 : -36);
    step(0.1);
    const s0 = T.s, d0 = dirAt(s0 + 4), yaw0 = Math.atan2(d0.x, d0.z);
    // an enemy (B1) sentry on the track 4 m ahead; B2's 2-chain floating over the track 7 and 9 m ahead
    const p4 = at(s0 + 4); const sB = B[1]; sB.setSub('sentry'); put(sB, p4.x - d0.x * 0.9, p4.z - d0.z * 0.9); aim(sB, yaw0); step(0.05); S.use(sB, SUBS.sentry); const sTrack = sentryOf(sB); put(sB, 24, 36);
    const bB = B[2]; bB.setSub('bobber'); put(bB, 20, 36);
    const p7 = at(s0 + 7), p9 = at(s0 + 9);
    const t1 = KB.throwFrom(bB, V(p7.x, floorY(p7.x, p7.z) + 0.6, p7.z), V(0, -3, 0)), t2 = KB.throwFrom(bB, V(p9.x, floorY(p9.x, p9.z) + 0.6, p9.z), V(0, -3, 0));
    // A1's sentry on the deck (set down at its front right, clear of the pillar), A2's bobber over its back left
    const sA = A[1]; sA.setSub('sentry'); const pd = deck(0.8, -0.1); put(sA, pd.x, pd.z, T.top + 0.02); aim(sA, T.yaw); step(0.1); S.use(sA, SUBS.sentry); const sDeck = sentryOf(sA); put(sA, -24, -36);
    const bA = A[2]; bA.setSub('bobber'); put(bA, -20, -36);
    const pb = deck(-0.7, -0.7); const tD = KB.throwFrom(bA, V(pb.x, T.top + 0.6, pb.z), V(0, -3, 0));
    settle([t1, t2, tD]); step(0.4);
    const before = { track: sTrack?.state, deck: sDeck?.state, bob: [t1.state, t2.state, tD.state] };
    const offS = sDeck && local(sDeck.pos), offB = local(tD.spot);
    const e0 = EV.length;
    drive = 1.5;
    let worstS = 0, worstB = 0, insideB = 0;
    const inBlock = (p) => G.level.pointInBlock ? G.level.pointInBlock(T.block, p, 0) : false;
    step(9, () => {
      if (sDeck && sDeck.state !== 'dead') worstS = Math.max(worstS, local(sDeck.pos).distanceTo(offS));
      if (tD.state === 'live') worstB = Math.max(worstB, local(tD.spot).distanceTo(offB));
      for (const o of [t1, t2]) if (o.state === 'live' && inBlock(o.spot)) insideB++;
      return T.s - s0 < 11;
    });
    drive = 0;
    const downs = EV.slice(e0).filter((x) => x.n === 'device:down').map((x) => `${x.kind}:${x.how}`);
    const trackFate = [t1, t2].map((o) => (o.state === 'dead' ? 'crushed' : o.rb?.on && (o.rb.on.b === T.block || o.rb.on.b === T.pillar) ? 'deck' : o.state));
    R('tower: the moving tower crushes an enemy Scrap Sentry on its track (\'device:down\' how crush); bobbers floating over the track ahead are crushed or lifted onto its deck — never inside the platform',
      before.track && sTrack.state === 'dead' && downs.includes('sentry:crush') && trackFate.every((f) => f === 'crushed' || f === 'deck') && insideB === 0,
      { before, downs, trackFate, insideFrames: insideB });
    R('tower: a Scrap Sentry and a Chain Bobber on its deck ride it (each within 0.1 m of its spot on the deck all the way)',
      !!sDeck && sDeck.state !== 'dead' && tD.state === 'live' && worstS < 0.1 && worstB < 0.1, { sentry: sDeck && sDeck.state, bobber: tD.state, worstSentry: worstS, worstBobber: worstB });
    T._rules = rules0;
  } catch (e) { crash('tower', e); }

  // ================================================================================================ Turf War (testbox)
  if (want('curtain')) try {
    const rows = [];
    for (const dt of [1 / 60, 1 / 24]) {
      clearAll(); DT = 1 / 60;
      for (const a of m.actors) put(a, -24 + (a.slot % 4) * 2, a.team ? 36 : -36);
      const E = B[1], D = A[1];
      put(E, 0, -10); aim(E, 0);
      const cur = S._throw(E, SUBS.curtain, V(0, 0.45, -6), V(0, -2, 0.6), false);
      step(1, () => cur.state === 'fly');
      put(E, 20, 36);
      D.setSub('dash'); put(D, 0, -8.2); aim(D, 0); step(0.1);
      const side = (p) => (p.x - cur.pos.x) * cur.n.x + (p.z - cur.pos.z) * cur.n.z;
      const s0 = side(D.pos);
      DT = dt;
      D.bot.dashDir = { x: 0, z: 1 }; S.use(D, SUBS.dash);
      let crossed = false, minAbs = 9;
      step(0.6, () => { const s = side(D.pos); if (Math.sign(s) !== Math.sign(s0)) crossed = true; minAbs = Math.min(minAbs, Math.abs(s)); });
      DT = 1 / 60;
      rows.push({ dt: r2(1 / dt), curtain: cur.state, startSide: s0, crossed, closest: minAbs, end: side(D.pos) });
    }
    R('curtain: a dash into an enemy Drip Curtain from 2 m never crosses its sheet, at 60 and at 24 frames a second (the dash\'s substeps run the curtain\'s push)', rows.every((r) => r.curtain === 'curtain' && !r.crossed && Math.abs(r.end) > 0.3), rows);
  } catch (e) { crash('curtain', e); }

  if (want('throwhold')) try {
    const { BOBBER_BOT } = await import('./src/game/kits/bobber-bots.js');
    const M = A.find((a) => a !== me && a.bot) || A[1];
    const trial = (web, foeIn) => {
      clearAll(); DT = 1 / 60;
      for (const a of m.actors) if (a !== me) put(a, -24 + (a.slot % 4) * 2, a.team ? 36 : -36);
      put(me, -6, 0); me.setSub('bobber');
      const L = web ? [KB.throwFrom(me, V(0, 0.6, 6), V(0, -3, 0)), KB.throwFrom(me, V(2.2, 0.6, 6.4), V(0, -3, 0))] : [];
      if (L.length) settle(L);
      step(0.5);
      // (a foe the team sees standing in it: M's own sight memory has them — the brains are scripted here)
      if (foeIn) { put(B[0], 1, 6); step(0.1); M.bot.sight?.mem?.set(B[0], { pos: B[0].pos.clone(), vel: V(0, 0, 0), seen: true, t: G.time }); }
      // the bot teammate: a Splat Bomb, aimed so its throw lands among them (the bomb-arc preview's own flight)
      M.setSub('bomb'); put(M, 1, -1); step(0.05);
      let best = null;
      for (let p = -0.4; p <= 0.9; p += 0.02) {
        aim(M, 0, p); const v = P.throwVelocity(M, SUBS.bomb.throwSpeed, V(0, 0, 0)), q = V(M.pos.x, M.pos.y + 1.35, M.pos.z), q0 = V();
        let land = null; for (let i = 0; i < 240; i++) { q0.copy(q); v.y -= 24 / 60; q.addScaledVector(v, 1 / 60); const h = G.physics.segment(q0, q); if (h.hit) { land = h.point.clone(); break; } }
        if (land && (!best || Math.abs(land.z - 6.2) < Math.abs(best.land.z - 6.2))) best = { p, land };
      }
      aim(M, 0, best.p);
      const h0 = BOBBER_BOT.throwHolds || 0, b0 = P.bombs.length;
      M.bot._bombAim = true; M.intent.sub = false;
      KB.holdThrow(M.bot, M.intent);   // ([b5-int3] the press's check: bots.js asks it after every kit's botAct — it moved there from the bobber's botAct, 7882d3ee)
      const held = !M.bot._bombAim;
      // (let the brain's own press go through if it wasn't held: _tail presses on _bombAim, releases next frame)
      if (!held) { M.bot._bombAim = false; M.intent.sub = true; step(1 / 60); M.intent.sub = false; step(1 / 60); }
      step(1.6);
      return { held, holds: (BOBBER_BOT.throwHolds || 0) - h0, thrown: P.bombs.length > b0 || !held, land: [r2(best.land.x), r2(best.land.z)], web: L.map((o) => o.state) };
    };
    const tA = trial(true, false), tB = trial(true, true), tC = trial(false, false);
    R('throwhold: a bot teammate\'s Splat Bomb press that would land in a human\'s idle 2-chain is held (the press cleared, the chain still floating) — a foe standing in it: not held; no chain: not held',
      tA.held && tA.holds === 1 && tA.web.every((s) => s === 'live') && !tB.held && !tC.held, { idleWeb: tA, foeInWeb: tB, noWeb: tC });
    me.setSub(me.subId);
  } catch (e) { crash('throwhold', e); }

  if (want('thinwall')) try {
    const { MITTS } = await import('./src/game/kits/mitts.js');
    const { Actor } = await import('./src/game/actor.js');
    const L = G.level, blocks = [];
    const box = (cx, cy, cz, hx, hy, hz) => { const b = L.addDynamic({ tag: 'test:int3' }); L.moveDynamic(b, V(cx, cy, cz), V(hx, hy, hz), 0); b.dp.set(0, 0, 0); blocks.push(b); return b; };
    const unbox = () => { for (const b of blocks) { b.solid = false; L.moveDynamic(b, V(1e4, -500, 1e4), V(0.1, 0.1, 0.1), 0); } blocks.length = 0; };
    // the actor alone, stepped at dt (as sub-dash.js: G.time by hand, a.update)
    const D = A.find((a) => a !== me && a.bot) || A[1], w0 = D.weaponId;
    const setIt = (a, w) => { const it = a.intent; it.move.set(w.move ? w.move[0] : 0, 0, w.move ? w.move[1] : 0); it.fire = !!w.fire; it.sub = false; it.jump = !!w.jump; it.squid = false; it.special = false; };
    const sim = (a, n, dt, w, each) => { for (let i = 0; i < n; i++) { setIt(a, typeof w === 'function' ? w(i) : w || {}); G.time += dt; a.update(dt); if (each) each(i); } };
    const spawn = (a, x, z) => { a.spawnAt(V(x, 0, z), Math.PI / 2); aim(a, Math.PI / 2); a.invuln = 0; a.vel.set(0, 0, 0); a.form = 'kid'; a.ink = PLAYER.inkMax; sim(a, 3, 1 / 60, {}); };
    const X0 = 0, Z0 = -14;   // (the wall's near face at x 0, across the way; the kid comes from −x going +x)
    const roll = (dt, wall) => {
      unbox(); if (wall) box(X0 + 0.05, 1, Z0, 0.05, 1, 3);
      D.setWeapon('twins'); spawn(D, X0 - 0.6, Z0);
      let maxX = -1e9, rolled = false;
      sim(D, Math.ceil(0.6 / dt), dt, (i) => ({ fire: true, jump: i === 1, move: [1, 0] }), () => { maxX = Math.max(maxX, D.pos.x); if (D.weaponRunner.dodgeT > 0) rolled = true; });
      return { rolled, maxX: r2(maxX), end: r2(D.pos.x) };
    };
    const leap = (dt, wall) => {
      unbox(); if (wall) box(X0 + 0.05, 3, Z0, 0.05, 3, 3);
      D.setWeapon('mitts'); spawn(D, X0 - 1.5, Z0);
      const wr = D.weaponRunner, k = MITTS.K(wr); k.seen = G.time;
      const v = MITTS.leapVelocity(D, k, 1, V(0, 0, 0));
      D.vel.copy(v); D.grounded = false; D.coyote = 0; D.jumpBuffer = 0;
      k.leaping = true; k.leapT = 0; k.slid = false; k.leapV.set(v.x, 0, v.z); k.leapH = Math.hypot(v.x, v.z); k.trailP.copy(D.pos);
      let maxX = -1e9;
      sim(D, Math.ceil(1.6 / dt), dt, () => { k.seen = G.time; return {}; }, () => { maxX = Math.max(maxX, D.pos.x); });
      return { v: r2(Math.hypot(v.x, v.z)), maxX: r2(maxX), end: r2(D.pos.x), cling: !!k.cling };
    };
    const rows = [];
    for (const dt of [1 / 60, 1 / 24]) { rows.push({ what: 'roll', fps: Math.round(1 / dt), ...roll(dt, true) }); rows.push({ what: 'leap', fps: Math.round(1 / dt), ...leap(dt, true) }); }
    const open = [roll(1 / 60, false), roll(1 / 24, false)];
    // the check bites: the same at 24 with the rule switched off
    const fn0 = Actor.prototype._fastN; Actor.prototype._fastN = () => 1;
    const off = { roll: roll(1 / 24, true), leap: leap(1 / 24, true) };
    Actor.prototype._fastN = fn0;
    unbox(); D.setWeapon(w0); spawn(D, -24, -36);
    R('thinwall (DECISIONS #22): a Twinfire roll and a Mitts leap into a 0.10 m wall never cross it, at 60 and at 24 frames a second (the body never past its near face)',
      rows.every((r) => (r.what === 'leap' || r.rolled) && r.maxX < X0 + 0.02), { rows, open });
    R('thinwall: the check bites — with the sub-step rule switched off, at 24 frames a second the roll or the leap goes through the wall; and in the open the roll goes as far at 24 as at 60 (± 0.15 m)',
      (off.roll.maxX > X0 + 0.1 || off.leap.maxX > X0 + 0.1) && Math.abs(open[0].end - open[1].end) <= 0.15, { off, open });
  } catch (e) { crash('thinwall', e); }

  if (want('rail') && m.movers) try {
    clearAll();
    const Mv = m.movers, Tt = Mv.T, car = Mv.cars[0], L = G.level;
    for (const a of m.actors) put(a, -24 + (a.slot % 4) * 2, a.team ? 36 : -36);
    m.duration = 99999;
    const setClock = (t) => { m.time = m.duration - t; frame(); };
    setClock(Tt.first - 0.8); step(2 / 60);
    const perp = V(-car.u.z, 0, car.u.x);
    // a bobber of A1's dropped onto the roof; A2 tries to set a sentry down on the roof; B1's sentry on the trackbed ahead
    const bA = A[1], roof = car.pos.clone().addScaledVector(car.u, -car.len * 0.2); roof.y = car.pos.y + car.ht;
    const bob = KB.throwFrom(bA, V(roof.x, roof.y + 0.6, roof.z), V(0, -3, 0));
    settle([bob]);
    const sA = A[2], ra = car.pos.clone().addScaledVector(car.u, car.len * 0.25); sA.setSub('sentry'); put(sA, ra.x, ra.z, car.pos.y + car.ht + 0.02); aim(sA, Math.atan2(car.u.x, car.u.z)); step(2 / 60);
    const why = KS.blockedWhy(sA, SUBS.sentry), n0 = KS.items.length; S.use(sA, SUBS.sentry); const roofSentry = KS.items.length > n0;
    put(sA, -20, -36);
    const sB = B[1]; sB.setSub('sentry');
    const ahead = car.pos.clone().addScaledVector(car.u, car.len / 2 + 2.6); ahead.y = L.groundHeight(ahead.x, ahead.z, car.pos.y + 0.5);
    put(sB, ahead.x - car.u.x * 0.9, ahead.z - car.u.z * 0.9, ahead.y + 0.02); aim(sB, Math.atan2(car.u.x, car.u.z)); step(2 / 60);
    S.use(sB, SUBS.sentry); const trackS = sentryOf(sB); put(sB, 20, 36);
    const { DEPLOY_STATS: DS } = await import('./src/game/deployables.js');
    const sp0 = trackS && trackS.pos.clone(), ds0 = { shoves: DS.shoves, lifts: DS.lifts, crushed: { ...DS.crushed } };
    const o0 = bob.spot.clone().sub(car.pos), p0 = car.pos.clone();
    const insideCar = (p, r) => L.pointInBlock(car.block, p, -r);
    let worst = 0, inS = 0;
    const e0 = EV.length;
    step(Tt.move + 1.4, () => {
      if (bob.state === 'live') worst = Math.max(worst, bob.spot.clone().sub(car.pos).distanceTo(o0));
      if (trackS && trackS.state !== 'dead' && insideCar(V(trackS.pos.x, trackS.pos.y + 0.3, trackS.pos.z), 0.05)) inS++;
    });
    const went = r2(car.pos.distanceTo(p0)), downs = EV.slice(e0).filter((x) => x.n === 'device:down').map((x) => `${x.kind}:${x.how}`);
    R(`rail: a Chain Bobber dropped on a railcar's roof rides it the ${went} m to its other stop (worst drift ${r2(worst)} m, its ride body on the car)`,
      bob.state === 'live' && went > 10 && worst < 0.06 && bob.rb?.on?.b === car.block, { went, worst, state: bob.state, on: bob.rb?.on?.b?.tag || bob.rb?.on?.b?.id || null });
    R('rail: a Scrap Sentry can\'t be set down on a railcar\'s roof (a roof); one on the trackbed in the car\'s way is shoved out of its path or crushed — never left inside the car',
      !roofSentry && !!why && !!trackS && inS === 0 && (downs.includes('sentry:crush') || (trackS.state !== 'dead' && (trackS.pos.distanceTo(sp0) > 0.3 || trackS.rb?.on?.b === car.block))),
      { why, roofSentry, track: trackS && trackS.state, moved: trackS && sp0 ? trackS.pos.distanceTo(sp0) : null, rides: trackS?.rb?.on?.b === car.block, insideFrames: inS, downs,
        shoves: DS.shoves - ds0.shoves, lifts: DS.lifts - ds0.lifts, carFront: r2(car.pos.clone().sub(sp0 || car.pos).dot(car.u)) });
  } catch (e) { crash('rail', e); }

  DT = 1 / 60; hook = null;
  return out;
})();
