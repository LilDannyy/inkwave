// [karp-face] Bazookarp online — the rest of SPEC §10.2's two-client steps (net-karp.cjs's base part has WP1's 19 checks;
// the migration steps are net-karp-host.cjs's). Real clients on the local relay; karpbox with the TWO-weir data injected
// into both; host A on Alpha, guest B on Bravo, one bot a side, parked; every screen's own kids driven by the test.
//   part 'face':   2 Bravo bursts it: A's kid at 3 m is splatted on A's screen (its owner), both screens agree ·
//                  3 a race: A and B both touch it right after the hold — exactly one gets it, the same on both, the
//                  other's lock ends on p · 4 B swims through its spot at full speed: granted (the newest-sample check) ·
//                  5 grab share: 10 bursts, a host bot and B at 3 m (reported) · 6 B carries: × 0.8 on B's screen, no
//                  super jump, B's own Bubble Guard (started just before) gone on both screens, the host's count = B's HUD ·
//                  6b the thin-wall stall: B's ticks frozen 0.4 s while it swims pressed into the 0.3 m wall — the host's
//                  best never ahead of B's own reading by more than 2, no plant / knockout, stats.clamped reported ·
//                  7 a Big Burst on A: A steps out during the swell (not splatted), A stays (splatted, on A's screen), one
//                  splat each side · 8 B's gauge +3 p/s while Alpha holds it; touching the shell: 20 hp per 0.5 s on B ·
//                  10 B plants one of its two weirs: both lowered, its Gate up, on every screen · 11 the fuse runs out on B's
//                  own half: B and a teammate at 3 m splatted, back to the Pond on both · 16 the same results on both
//                  screens (counts, reason, winner, karpM, karpPops)
//   part 'lag' (URLQ='netlag=150&netjitter=60'): 1 B's hits move the host's meter · 3 B's grab · 9 B retreats: DON'T
//                  RETREAT! the same frame, the host's rate agrees · 9b the fuse ring under ×3 never goes up by more than
//                  0.2 s in any 1 s, ≤ 0.3 s at the Carp Blast · 15b a declined grant · 15c the window's close: B claims
//                  0.2 s before an S39b window closes — granted, overtime goes on · results on both
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET_ARGS='part=face' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' URLQ='netlag=150&netjitter=60' NET_ARGS='part=lag' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients, R, wait, say, open }, part) => {
  for (const c of clients.slice(0, 2)) {
    if (/[?&]wipmodes(&|=|$)/.test(c.url || '') && /[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    await open(c.i, 'autopilot&wipmodes');
  }
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const r2 = (x) => Math.round(x * 100) / 100;
  for (const c of [A, B]) await c.js(`(async () => { const m = await import('./tools/botlab/karpbox.js'); return m.defineKarpbox(m.KARPBOX_TWO); })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: 'karpbox', time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  await A.js(`__G.net.setMe({ team: 0 }); 1`); await B.js(`__G.net.setMe({ team: 1, special: 'bubbler', weapon: 'shooter' }); 1`);
  await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === 0 && p[1].team === 1; })()`, 8000);
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say(`match up (${part})`);
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  await still(A); await still(B);
  await A.js(`(() => { __G.match.time = 290; for (const a of __G.match.actors) if (a.bot && !a.remote) { const p = __G.level.spawnPads[a.team]; a.pos.set(p.x + (a.slot % 4) * 1.5 - 2, p.y, p.z + (a.team ? 2 : -2)); a.vel.set(0, 0, 0); } return 1; })()`);
  // in every page: a log of events (splats, hits, karp records), the kid's own helpers
  for (const c of [A, B]) await c.js(`(() => { window.__ev = []; import('./src/core/ctx.js').then((m) => { for (const k of ['splatted', 'karp:pickup', 'karp:burst', 'karp:land', 'karp:blast', 'karp:plant', 'karp:explode', 'karp:reset', 'damage']) m.on(k, (e) => window.__ev.push({ k, t: performance.now(), v: e.victim ? e.victim.nid : e.actor ? e.actor.nid : null, c: e.cause || e.source || null, amt: e.amount, ghost: !!e.ghost })); }); return 1; })()`);
  const aNid = await J(A, `__G.match.local.nid`), bNid = await J(B, `__G.match.local.nid`);
  const info = async (c) => J(c, `(() => { const K = __G.match.karp; if (!K) return null; const s = K.state(); return { follower: K.follower, phase: s.phase, holder: s.holder && s.holder.nid, meter: Math.round(s.meter), count: s.count, shell: s.shell, pos: s.pos.map((x) => +x.toFixed(2)), lowered: [...K.lowered], gate: [...K.gateUp], weirsLow: s.weirs.map((l) => l.map((w) => w.lowered)), overtime: s.overtime, winner: s.winner, reason: s.reason, clamped: K.stats.clamped, lock: K.lockT, fuse: +s.fuse.toFixed(2), fuseShown: +s.fuseShown.toFixed(2), rate: s.rate, rec: K.wire.log, declined: K.stats.declined, remote: { half: K.remote.half, rate: K.remote.rate, why: K.remote.why } }; })()`);
  const put = (c, x, y, z, yaw) => c.js(`(() => { const a = __G.match.local; if (!a.alive) return 0; a.pos.set(${x}, ${y}, ${z}); a.vel.set(0, 0, 0); ${yaw != null ? `a.yaw = a.aimYaw = ${yaw};` : ''} return 1; })()`);
  const alive = (c) => c.until(`__G.match.local.alive`, 14000, 200).catch(() => {});
  const zeroB = () => B.js(`(() => { const it = __G.match.local.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = false; return 1; })()`);
  // host: back to the Pond, shielded (a fresh 500 shell): nobody holds it
  const toPond = async () => {
    await A.js(`(() => { const K = __G.match.karp; if (K.holder) { if (K.holder.remote) K._lose(K.holder, 'splat'); else K._lose(K.holder, 'splat'); } return 1; })()`);
    await wait(150);
    await A.js(`(() => { const K = __G.match.karp; if (K.phase !== 'resetting') K._reset(K.pos.clone(), 'none'); return 1; })()`);
    await A.until(`__G.match.karp.phase === 'shielded' && Math.hypot(__G.match.karp.pos.x, __G.match.karp.pos.z) < 0.4`, 8000, 100).catch(() => {});
    await B.until(`__G.match.karp.phase === 'shielded'`, 4000, 100).catch(() => {});
  };
  const burst = (team) => A.js(`(() => { const K = __G.match.karp, by = __G.match.actors.find((o) => o.nid === ${team ? bNid : aNid}); K.shell.add(${team}, 3000, by); return 1; })()`);
  // B grabs it where it rests: B waits 3 m off (outside the shell's shove), steps onto it the moment it hears the burst
  const grabB = async () => {
    const kp = (await info(A)).pos;
    await put(B, kp[0], kp[1], kp[2] + 3.2);
    await B.js(`(() => { import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); const a = __G.match.local; a.pos.set(${kp[0]}, ${kp[1]}, ${kp[2]} + 0.5); a.vel.set(0, 0, 0); }); }); return 1; })()`);
    await wait(250);
    await burst(1);
    await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bNid}`, 5000, 30).catch(() => {});
    await B.until(`__G.match.karp.holder === __G.match.local`, 3000, 30).catch(() => {});
  };
  const bHud = () => J(B, `(() => { const s = __inkwave.hud && __inkwave.hud.karp && __inkwave.hud.karp.state(); return s ? { status: s.status, bottom: s.bottom, reticle: s.reticle, line: s.line } : null; })()`);
  await wait(1500);

  if (part === 'face') {
    // ---- 2. Bravo bursts it: A's own kid, 3 m from it, is splatted on A's screen; B's screen agrees
    await put(A, 0, 0, -3); await put(B, 0, 0, 12);
    await A.js(`(() => { const a = __G.match.local; a.invuln = 0; a.hp = 100; return 1; })()`);
    await wait(400);
    await burst(1);
    await wait(1500);
    const a2 = await J(A, `({ alive: __G.match.local.alive, splat: window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).map((e) => e.c) })`);
    const b2 = await J(B, `({ aAlive: __G.match.actors.find((o) => o.nid === ${aNid}).alive, splat: window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).map((e) => e.c) })`);
    R('2. Bravo bursts the shell: A\'s kid 3 m away is splatted on A\'s screen (karp-burst), and B\'s screen agrees', !a2.alive && a2.splat.includes('karp-burst') && !b2.aAlive && b2.splat.length >= 1, { a2, b2 });
    await alive(A);

    // ---- 3. a race: both touch it right after the burst (each screen moves its own kid in on hearing the burst)
    await toPond();
    await put(A, 0, 0, -6); await put(B, 0, 0, 6);
    for (const [c, z] of [[A, -1.0], [B, 0.95]]) await c.js(`(() => { import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); const a = __G.match.local; a.pos.set(0, 0, ${z}); a.vel.set(0, 0, 0); }); }); return 1; })()`);
    await wait(300);
    await A.js(`(() => { const K = __G.match.karp; K.shell.add(1, 3000, __G.match.actors.find((o) => o.nid === ${bNid})); return 1; })()`);
    await A.until(`!!__G.match.karp.holder`, 4000, 30).catch(() => {});
    await wait(700);
    const r3a = await info(A), r3b = await info(B);
    R('3. a race: exactly one of A and B gets it, the same one on both screens, and B\'s claim lock has ended', (r3a.holder === aNid || r3a.holder === bNid) && r3b.holder === r3a.holder && !(r3b.lock > 0), { host: r3a.holder, guest: r3b.holder, aNid, bNid, lock: r3b.lock, claims: r3b.rec.claim });

    // ---- 4. B swims through its spot at full swim speed, never stopping: granted (judged at B's newest sample)
    await toPond();
    await put(A, 0, 0, -14);
    await B.js(`(() => { const a = __G.match.local; for (let z = 7; z >= -7; z -= 1.2) __G.paint.splat(new (a.pos.constructor)(0.3, 0.2, z), 1.4, a.team, { seed: z * 7 }); return 1; })()`);
    await put(B, 0.3, 0, 7, Math.PI);
    await wait(500);
    await B.js(`(() => { import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); setTimeout(() => { const a = __G.match.local; a.pos.set(0.3, 0, 3.6); a.intent.squid = true; a.intent.move.set(0, 0, -1); setTimeout(() => { a.intent.move.set(0, 0, 0); a.intent.squid = false; }, 900); }, 280); }); }); __G.match.local.intent.squid = true; return 1; })()`);
    await wait(300);
    await burst(1);
    await wait(2200);
    const r4a = await info(A), r4b = await info(B);
    const sw = await J(B, `({ sub: __G.match.local.submerged, form: __G.match.local.form })`);
    R('4. B swims through the spot at full speed without stopping: the host grants B\'s claim (its newest sample), the same on both screens', r4a.holder === bNid && r4b.holder === bNid, { host: r4a.holder, guest: r4b.holder, claims: r4b.rec.claim, sw });
    await zeroB();

    // ---- 5. grab share: 10 bursts, a Bravo host bot and B each 3 m from it, both running in on hearing the burst
    const bot = await J(A, `(() => { const b = __G.match.actors.find((o) => o.bot && !o.remote && o.team === 1); return b ? b.nid : -1; })()`);
    const wins = { bot: 0, guest: 0, none: 0 };
    for (let k = 0; k < 10; k++) {
      await toPond();
      await A.js(`(() => { const b = __G.match.actors.find((o) => o.nid === ${bot}); b.pos.set(3, 0, 0); b.vel.set(0, 0, 0); b.yaw = b.aimYaw = -Math.PI / 2; b.intent.move.set(0, 0, 0); return 1; })()`);
      await put(B, -3, 0, 0, Math.PI / 2);
      await A.js(`(() => { import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); const b = __G.match.actors.find((o) => o.nid === ${bot}); b.intent.move.set(-1, 0, 0); setTimeout(() => b.intent.move.set(0, 0, 0), 900); }); }); return 1; })()`);
      await B.js(`(() => { import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); const a = __G.match.local; a.intent.move.set(1, 0, 0); setTimeout(() => a.intent.move.set(0, 0, 0), 900); }); }); return 1; })()`);
      await wait(250);
      await burst(1);
      await A.until(`!!__G.match.karp.holder`, 3000, 30).catch(() => {});
      const h = (await info(A)).holder;
      if (h === bot) wins.bot++; else if (h === bNid) wins.guest++; else wins.none++;
      await wait(300);
    }
    const wpn = await J(A, `(() => { const b = __G.match.actors.find((o) => o.nid === ${bot}), g = __G.match.actors.find((o) => o.nid === ${bNid}); return { bot: b.weaponId, guest: g.weaponId }; })()`);
    R('5. grab share over 10 bursts, a host bot vs guest B at equal distance (reported; no threshold)', wins.bot + wins.guest >= 8, { wins, wpn });

    // ---- 6. B carries: × 0.8 on B's screen, no super jump, B's own Bubble Guard gone on both screens, counts agree
    await toPond();
    await put(A, 0, 0, -14);
    await put(B, 0, 0, 3.5, Math.PI);
    await B.js(`(() => { const a = __G.match.local; a.special = a.specialCost(); __G.specials.start(a, a.specialId); import('./src/core/ctx.js').then((m) => { const off = m.on('karp:burst', () => { off(); a.pos.set(0, 0, 0.9); a.vel.set(0, 0, 0); }); }); return 1; })()`);
    await wait(600);
    const sh0 = await J(B, `({ id: __G.match.local.specialId, sh: __G.match.local.status.shield })`);
    const sh0a = await J(A, `(() => { const b = __G.match.actors.find((o) => o.nid === ${bNid}); return { sh: b.status.shield, sp: !!b.specialActive }; })()`);
    await burst(1);
    await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bNid}`, 4000, 30).catch(() => {});
    await wait(600);
    const sh1 = await J(B, `({ sh: __G.match.local.status.shield, sp: !!__G.match.local.specialActive, sj: __G.match.local.canSuperJump(), carry: !!__G.match.local.carry })`);
    const sh1a = await J(A, `(() => { const b = __G.match.actors.find((o) => o.nid === ${bNid}); return { sh: b.status.shield, carry: !!b.carry }; })()`);
    R('6. B\'s own Bubble Guard (started just before) ends at the pick-up on both screens; B can\'t super jump', sh0.sh > 0 && sh1.carry && !(sh1.sh > 0) && !sh1.sp && sh1.sj === false && sh1a.carry && !(sh1a.sh > 0), { before: { b: sh0, a: sh0a }, after: { b: sh1, a: sh1a } });
    await B.js(`(() => { __G.paint.clear(); const a = __G.match.local; a.form = 'kid'; a.pos.set(0, 0, -1); a.intent.move.set(0, 0, -1); return 1; })()`);
    await wait(500);
    const p0 = await J(B, `({ z: __G.match.local.pos.z, t: performance.now() })`);
    await wait(1200);
    const p1 = await J(B, `({ z: __G.match.local.pos.z, t: performance.now() })`);
    await zeroB();
    const speed = Math.abs(p1.z - p0.z) / ((p1.t - p0.t) / 1000);
    const runK = await B.js(`(async () => { const { PLAYER } = await import('./src/config.js'); return PLAYER.runSpeed * 0.8; })()`);
    await wait(900);
    const c6a = await info(A), c6h = await bHud(), c6b = await info(B);
    R('6b. … B runs at PLAYER.runSpeed × 0.8 on its own screen (measured over 1.2 s)', Math.abs(speed - runK) < 0.45, { speed: r2(speed), want: r2(runK) });
    R('6c. … the host\'s count falls as B carries and B\'s HUD shows the same count', c6a.count[1] < 100 && c6b.count[1] === c6a.count[1] && JSON.stringify(c6h.line ? c6h.line : null) !== 'null', { host: c6a.count, guest: c6b.count, hud: c6h && c6h.status });

    // ---- 6b. the thin-wall stall: B swims along the 0.3 m wall pressed into it, its ticks frozen 0.4 s mid-way
    await B.js(`(() => { const a = __G.match.local; for (let z = -4; z >= -20; z -= 1.2) __G.paint.splat(new (a.pos.constructor)(-5.25, 0.2, z), 0.9, a.team, { seed: 31 + z }); return 1; })()`);
    await wait(300);
    // (walk there from where B stands, so the clamp sees a real walk; then the swim)
    await B.js(`(() => { const a = __G.match.local; a.intent.move.set(-0.9, 0, -0.45); return 1; })()`);
    await B.until(`__G.match.local.pos.x < -4.9 || !__G.match.local.carry`, 6000, 30).catch(() => {});
    await B.js(`(() => { const a = __G.match.local, nm = __G.netm; window.__freeze = 0; if (!nm.__st) { nm.__st = nm._sendTick.bind(nm); nm._sendTick = () => { if (performance.now() < window.__freeze) return; nm.__st(); }; }
      a.intent.squid = true; a.intent.move.set(-0.35, 0, -1); setTimeout(() => { window.__freeze = performance.now() + 400; }, 500); return 1; })()`);
    const stall = [];
    for (let k = 0; k < 9; k++) {
      await wait(200);
      const h = await info(A), own = await J(B, `(() => { const K = __G.match.karp, a = __G.match.local, r = K.field.fieldAt(a.team, a.pos); return { c: r ? K.field.count(a.team, r.d) : null, x: +a.pos.x.toFixed(2), z: +a.pos.z.toFixed(2) }; })()`);
      stall.push([h.count[1], own.c, own.x, own.z]);
    }
    await zeroB();
    const s6 = await info(A);
    R('6d. the thin-wall stall (B\'s ticks frozen 0.4 s, pressed into the wall): the host\'s count never 2+ below B\'s own reading, no plant or knockout; clamp rejections reported',
      stall.every(([h, o]) => o == null || h >= o - 2) && !s6.lowered[1] && s6.winner == null, { stall, clamped: s6.clamped });

    // ---- 7. a Big Burst on A: A steps out during the swell on its own screen (safe); then A stays (splatted there)
    await B.js(`(() => { const a = __G.match.local; a.intent.squid = false; a.form = 'kid'; return 1; })()`);
    await A.js(`(() => { window.__step = 1; import('./src/core/ctx.js').then((m) => m.on('karp:land', (e) => { if (e.ghost && window.__step === 1) { const a = __G.match.local; a.pos.x += 6.5; } })); return 1; })()`);
    await B.js(`(() => { const a = __G.match.local; a.pos.set(0, 0, -16); a.vel.set(0, 0, 0); return 1; })()`);
    await wait(300);
    const bp = await J(B, `__G.match.local.pos.toArray().map((x) => +x.toFixed(2))`);
    await put(A, bp[0], 0, bp[2] - 20.4); await A.js(`(() => { const a = __G.match.local; a.hp = 100; a.invuln = 0; return 1; })()`);
    await wait(600);
    await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = Math.PI; a.aimPitch = 0; a.intent.fire = true; setTimeout(() => { a.intent.fire = false; }, 2000); return 1; })()`);
    await wait(3900);
    const s7a = await J(A, `({ alive: __G.match.local.alive, hp: Math.round(__G.match.local.hp), x: +__G.match.local.pos.x.toFixed(2) })`);
    const landB = await J(B, `__G.karpGun.shots.filter((s) => !s.ghost && s.land).map((s) => ({ c: s.c, land: s.land.toArray().map((x) => +x.toFixed(1)) }))`);
    R('7. A steps out of a Big Burst\'s swell on its own screen: not splatted', s7a.alive, { a: s7a, shots: landB });
    await A.js(`(() => { window.__step = 2; const a = __G.match.local; a.pos.x -= 6.5; a.hp = 100; a.invuln = 0; return 1; })()`);
    await put(A, bp[0], 0, bp[2] - 20.4);
    await wait(500);
    const n0a = await J(A, `window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).length`), n0b = await J(B, `window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).length`);
    await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = Math.PI; a.aimPitch = 0; a.intent.fire = true; setTimeout(() => { a.intent.fire = false; }, 2000); return 1; })()`);
    await wait(4200);
    const n1a = await J(A, `window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).map((e) => e.c)`), n1b = await J(B, `window.__ev.filter((e) => e.k === 'splatted' && e.v === ${aNid}).length`);
    R('7b. A stays in it: splatted by the Carp Shot on A\'s own screen, one splat on each screen (never two)', n1a.length === n0a + 1 && n1a[n1a.length - 1] === 'karp' && n1b === n0b + 1, { a: n1a, before: [n0a, n0b], b: n1b });
    await alive(A);

    // ---- 8. B's gauge while Alpha holds it (+3 p/s); the shell's sting on B (20 per 0.5 s)
    await toPond();
    await put(B, 0, 0, 14);
    await put(A, 0, 0, -1.0);
    await burst(0);
    await A.until(`__G.match.karp.holder === __G.match.local`, 4000, 30).catch(() => {});
    await B.js(`(() => { const a = __G.match.local; a.special = 10; return 1; })()`);
    await wait(300);
    const g0 = await J(B, `({ sp: __G.match.local.special, t: performance.now() })`);
    await wait(2000);
    const g1 = await J(B, `({ sp: __G.match.local.special, t: performance.now() })`);
    const rate8 = (g1.sp - g0.sp) / ((g1.t - g0.t) / 1000);
    R('8. while Alpha holds it, B\'s gauge rises at 3 p/s on B\'s screen', Math.abs(rate8 - 3) < 0.6, { rate: r2(rate8) });
    await toPond();
    await put(A, 0, 0, -14);
    await B.js(`(() => { const a = __G.match.local; a.hp = 100; a.invuln = 0; window.__touch = setInterval(() => { const K = __G.match.karp, c = K.shell.center(), R = K.shell.radius(); a.pos.set(c.x, 0, c.z + R + 0.2); a.vel.set(0, 0, 0); }, 8); setTimeout(() => clearInterval(window.__touch), 1150); return 1; })()`);
    await wait(1600);
    const st8 = await J(B, `window.__ev.filter((e) => e.k === 'damage' && e.v === ${bNid} && e.c === 'karp-touch').slice(-4).map((e) => ({ amt: e.amt, t: Math.round(e.t) }))`);
    const gaps = st8.slice(1).map((e, i) => e.t - st8[i].t);
    R('8b. touching the shell stings B on B\'s screen: 20 hp a time, at most every 0.5 s', st8.length >= 2 && st8.every((e) => Math.abs(e.amt - 20) < 0.01) && gaps.every((g) => g >= 450), { st8, gaps });

    // ---- 10. B plants one of its two weirs (the raised deck): both of Bravo's weirs lower, its Gate rises, everywhere
    await put(B, 0, 0, 10);
    await A.js(`(() => { const K = __G.match.karp; K._dropAt(new (K.pos.constructor)(0, 0, -16.5), 0, 'moved'); return 1; })()`);
    await A.until(`__G.match.karp.phase === 'shielded'`, 4000, 100).catch(() => {});
    const kp10 = (await info(A)).pos;
    await B.until(`__G.match.karp.phase === 'shielded'`, 4000, 100).catch(() => {});
    await grabB();
    await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = Math.PI; a.intent.move.set(${-kp10[0] * 0.04}, 0, -1); return 1; })()`);
    await A.until(`__G.match.karp.lowered[1]`, 9000, 50).catch(() => {});
    await zeroB();
    await wait(800);
    const w10a = await info(A), w10b = await info(B);
    const fx10 = await J(B, `(__G.karpFx.weirs || []).filter((x) => x.w.team === 1).map((x) => x.low >= 0)`);
    const dbg10 = { kp10, holder: w10a.holder, bPos: await J(B, `__G.match.local.pos.toArray().map((x) => +x.toFixed(2))`), bCarry: await J(B, `!!__G.match.local.carry`) };
    R('10. B lands it on one of Bravo\'s two weirs (the platform\'s): both lowered and Bravo\'s Gate up, on both screens (the looks too)',
      w10a.weirsLow[1].length === 2 && w10a.weirsLow[1].every(Boolean) && w10b.weirsLow[1].every(Boolean) && w10a.gate[1] && w10b.gate[1] && !w10a.lowered[0] && fx10.length === 2 && fx10.every(Boolean), { host: { low: w10a.weirsLow, gate: w10a.gate }, guest: { low: w10b.weirsLow, gate: w10b.gate }, fx10, dbg10 });

    // ---- 11. the fuse runs out with B on its own half: B and a Bravo bot 3 m away splatted, back to the Pond on both
    await toPond();
    await put(A, 0, 0, -14);
    await grabB();
    await B.js(`(() => { const a = __G.match.local; a.pos.set(0, 0, 6); a.vel.set(0, 0, 0); return 1; })()`);
    await wait(500);
    await A.js(`(() => { const K = __G.match.karp, b = __G.match.actors.find((o) => o.nid === ${bot}); if (!K.holder) return 0; const s = K.wire.newest(K.holder); b.pos.set(s.x + 3, 0, s.z); b.vel.set(0, 0, 0); b.hp = 100; b.invuln = 0; K.fuse = 1.2; return 1; })()`);
    await A.until(`!__G.match.karp.holder`, 6000, 30).catch(() => {});
    await wait(900);
    const f11a = await J(A, `({ bot: __G.match.actors.find((o) => o.nid === ${bot}).alive, bAlive: __G.match.actors.find((o) => o.nid === ${bNid}).alive, phase: __G.match.karp.phase, blasts: __G.match.karp.stats.blasts })`);
    const f11b = await J(B, `({ me: __G.match.local.alive, phase: __G.match.karp.phase, cause: window.__ev.filter((e) => e.k === 'splatted' && e.v === ${bNid}).map((e) => e.c).slice(-1)[0] })`);
    R('11. the fuse runs out on B\'s own half: B (on its screen) and the Bravo bot 3 m away (on the host\'s) splatted by the Carp Blast; it flies back to the Pond on both screens',
      !f11b.me && f11b.cause === 'karp-fuse' && !f11a.bot && f11a.blasts.own >= 1 && ['resetting', 'reforming', 'shielded'].includes(f11a.phase) && ['resetting', 'reforming', 'shielded'].includes(f11b.phase), { host: f11a, guest: f11b });
    await alive(B);
  }

  if (part === 'lag') {
    // ---- 1. B's shots on the shell move the host's meter under lag
    await put(B, 0, 0, 6);
    await wait(500);
    await B.js(`(() => { const a = __G.match.local, c = __G.match.karp.shell.center(); a.intent.fire = true; window.__aim = setInterval(() => { a.aimYaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); a.yaw = a.aimYaw; a.aimPitch = Math.atan2(c.y - (a.pos.y + 1.2), 6); a.ink = 100; }, 30); return 1; })()`);
    await wait(2000);
    await B.js(`(() => { clearInterval(window.__aim); __G.match.local.intent.fire = false; return 1; })()`);
    await wait(900);
    const l1a = await info(A), l1b = await info(B);
    R('lag 1. B\'s shots move the host\'s meter (kh), B follows within a snapshot', l1a.meter < -40 && Math.abs(l1b.meter - l1a.meter) < 150, { host: l1a.meter, guest: l1b.meter });
    // ---- 3. B grabs it under lag
    await toPond();
    await put(A, 0, 0, -14);
    await grabB();
    const l3a = await info(A), l3b = await info(B);
    R('lag 3. B\'s claim is granted under lag, the same on both screens', l3a.holder === bNid && l3b.holder === bNid, { host: l3a.holder, guest: l3b.holder });
    // ---- 9 / 9b. B retreats on its own half: DON'T RETREAT! at once on B; the shown fuse never rewinds > 0.2 s a second
    await B.js(`(() => { const a = __G.match.local; a.pos.set(0, 0, 4); a.vel.set(0, 0, 0); window.__fz = []; window.__fzT = setInterval(() => { const K = __G.match.karp; window.__fz.push([Math.round(performance.now()), +K.hud.fuseShown.toFixed(3), K.state().rate, K.holder === __G.match.local ? 1 : 0]); }, 50); return 1; })()`);
    await wait(500);
    await B.js(`(() => { const a = __G.match.local; a.intent.move.set(0, 0, 1); return 1; })()`);
    await B.until(`__G.match.karp.state().rate === 3`, 6000, 16).catch(() => {});
    const hud9 = await bHud();
    await zeroB();
    await A.until(`__G.match.karp.remote.rate === 3`, 3000, 30).catch(() => {});
    const l9a = await info(A);
    R('lag 9. B retreats on its own half: DON\'T RETREAT! on B\'s screen the moment its own judgement says ×3; the host\'s rate follows (kr)', /DON'T RETREAT/.test(hud9?.bottom?.[0] || '') && l9a.remote.rate === 3 && l9a.remote.why === 'retreat', { hud: hud9 && hud9.bottom, host: l9a.remote });
    // the host lets the fuse run down to the blast (B stays retreated, ×3)
    await A.js(`(() => { const K = __G.match.karp; K.fuse = Math.min(K.fuse, 4.5); window.__xF = null; return 1; })()`);
    await B.js(`(() => { const K = __G.match.karp, ne = K.netEvent.bind(K); window.__xF = null; K.netEvent = (e, s) => { if (Array.isArray(e) && e[0] === 'x' && window.__xF == null) window.__xF = +K.hud.fuseShown.toFixed(3); return ne(e, s); }; return 1; })()`);
    await B.until(`window.__xF != null`, 9000, 30).catch(() => {});
    await wait(300);
    const fz = await J(B, `(() => { clearInterval(window.__fzT); return { fz: window.__fz, xF: window.__xF }; })()`);
    let worst = 0;
    const s9 = fz.fz.filter((q) => q[3] === 1);   // (while B carries)
    for (let i = 0; i < s9.length; i++) for (let j = i + 1; j < s9.length && s9[j][0] - s9[i][0] <= 1000; j++) worst = Math.max(worst, s9[j][1] - s9[i][1]);
    R('lag 9b. the fuse ring under ×3: in any 1 s it never goes up by more than 0.2 s, and at the Carp Blast B\'s ring shows ≤ 0.3 s', worst <= 0.2 + 1e-6 && fz.xF != null && fz.xF <= 0.3, { worstRise: r2(worst), atBlast: fz.xF, samples: s9.length });
    await alive(B);
    // ---- 15b. a declined grant under lag: B dies on its own screen the moment its grant plays
    await toPond();
    await put(A, 0, 0, -14);
    await put(B, 0, 0, 4);
    await wait(400);
    await B.js(`(() => { const K = __G.match.karp, me = __G.match.local, ne = K.netEvent.bind(K); window.__died = 0; K.netEvent = (e, s) => { if (Array.isArray(e) && e[0] === 'p' && e[2] === me.nid && !window.__died) { window.__died = 1; me.splat(null, 'weapon'); } return ne(e, s); }; return 1; })()`);
    await burst(1);
    await B.until(`__G.match.karp.phase === 'free'`, 4000, 20).catch(() => {});
    await put(B, 0.3, 0, 0.3);
    await A.until(`__G.match.karp.stats.declined >= 1`, 5000, 30).catch(() => {});
    await wait(1200);
    const d15a = await info(A), d15b = await info(B);
    R('lag 15b. a grant B\'s screen can no longer take (B died first) is declined (kx) and undone (u): free at the same spot on both screens',
      d15a.declined >= 1 && d15a.holder == null && d15b.holder == null && d15a.phase === 'free' && d15b.phase === 'free' && Math.hypot(d15a.pos[0] - d15b.pos[0], d15a.pos[2] - d15b.pos[2]) < 0.5, { host: { d: d15a.declined, holder: d15a.holder, phase: d15a.phase, pos: d15a.pos }, guest: { holder: d15b.holder, phase: d15b.phase, pos: d15b.pos } });
    await alive(B);
    await B.js(`(() => { const K = __G.match.karp; delete K.netEvent; return 1; })()`);
    // ---- 15c. the window's close: an S39b overtime (Bravo behind); B's claim leaves 0.2 s before the window closes
    await toPond();
    await A.js(`(() => { const K = __G.match.karp, m = __G.match; K.count = [60, 100]; K.reachT = [5, 0]; K.touched = true; K.lastCarrier = { team: 0, how: 'splat', left: 5 }; m.time = 0.3; return 1; })()`);
    await A.until(`__G.match.karp.overtime && __G.match.karp.otWin.open`, 4000, 50).catch(() => {});
    await B.until(`__G.match.karp.overtime`, 4000, 50).catch(() => {});
    // (the host closes the window 0.2 s after B's first claim was sent, by B's own timestamp on the host's clock)
    await A.js(`(() => { const K = __G.match.karp; window.__closed = null; K.wire.on('claim', ({ actor, ts }) => { const W = K.otWin; if (window.__closed == null && actor.nid === ${bNid} && W.open && W.closeT == null) { W.left = 0; W.closeT = ts + 0.2; W.grace = 0.4 + Math.max(0, K.wire.now() - W.closeT); window.__closed = { ts, now: K.wire.now() }; } }); K.otWin.left = 30; return 1; })()`);
    await grabB();
    await A.until(`__G.match.karp.holder || __G.match.karp.winner != null`, 6000, 30).catch(() => {});
    await wait(1200);
    const c15a = await info(A), c15b = await info(B), cl = await J(A, `window.__closed`);
    R('lag 15c. B\'s claim, sent 0.2 s before the S39b window closed, reaches the host after the close and is still granted: overtime goes on',
      !!cl && c15a.holder === bNid && c15b.holder === bNid && c15a.winner == null && c15a.overtime, { host: { holder: c15a.holder, winner: c15a.winner, reason: c15a.reason, ot: c15a.overtime }, guest: c15b.holder, closed: cl });
  }

  // ---- 16. the end: the same results on both screens (counts, reason, winner, karpM, karpPops)
  await A.js(`(() => { const K = __G.match.karp; if (K.overtime) K._end(K.losing(), 'comeback'); else __G.match.time = 0.2; return 1; })()`);
  for (const c of [A, B]) await c.until(`!!__G.match.result`, 25000, 250).catch(() => {});
  await wait(800);
  const end = async (c) => J(c, `(() => { const r = __G.match.result; return r ? { mode: r.mode, winner: r.winner, reason: r.reason, counts: r.counts, st: __G.match.actors.map((a) => [a.nid, Math.round(a.stats.karpM || 0), a.stats.karpPops || 0]).sort((x, y) => x[0] - y[0]) } : null; })()`);
  const ea = await end(A), eb = await end(B);
  R(`${part === 'lag' ? 'lag ' : ''}16. both screens show the same result: mode, winner, reason, counts and every player's karpM / karpPops`, !!ea && !!eb && ea.mode === 'bazookarp' && JSON.stringify(ea) === JSON.stringify(eb) && ea.st.some((q) => q[1] > 0 || q[2] > 0), { host: ea, guest: eb });
  const errs = [];
  for (const c of [A, B]) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on either screen', errs.length === 0, errs.slice(0, 4));
};
