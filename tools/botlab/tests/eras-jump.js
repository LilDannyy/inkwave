// Bluestone Junction's era engine — the jump (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §6 step 8: the StageEras
// runtime), offline, on the stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGE_ARGS='only=sched,flip')
// sched   the schedule per mode (1/3 and 2/3 of the clock in timed modes, Boss Battle fixed in era 2, Practice and the menu
//         backdrop cycling with the rewind, the audit), overtime never jumps; the live match driven only by the host
//         stage clock (the match clock moved: the events and flips follow it)
// flip    every group flips whole at J + r_g / 25 (±1 frame): collision, looks (the shader's front), ink (the guard) and
//         nav (the danger layer from the warning, the era switch at done) agree; a ray through a vanishing piece hits
//         before its flip and misses after
// fall    a kid on a vanishing top falls and lands (Practice's rewind: the Halo)
// shove   a kid forced into an appearing piece is shoved out with its body fitting (straight up onto it; else round it /
//         the nearest node), stats.eraShoves counts it
// rescue  a kid on a piece that vanishes over water is rescued to a valid node, never splatted
// device  a sprinkler on a vanishing piece is destroyed (S.crushIn, then the module's walk of G.subs.items)
// guard   a splat on a changing piece within 0.5 s of its flip claims nothing; after the guard it inks
// fx      the warning's holograms and wire beads, Tartar's ring and pickup, the curtain riding the front, the synthesized
//         sounds (era_bell, era_ring, era_kiosk, era_pickup, era_swell, era_front, era_pop)
// frames  no frame over 50 ms during a jump (performance.now() round each simulated, rendered frame)
// sky     12c: the time-lapse from J to done (the sun swings, the clouds race, exposure and the grade held) and the new
//         era's look settling at done (the env map rebuilt once)
// modes   a Boss Battle starts in era 2 and never jumps; Practice starts in era 1 and cycles 1 → 2 → 3 → 1
// first   (review 2, issue 1; first on a fresh page: PAGE_ARGS='only=first' or the default order) the page's first jump on
//         the real schedule compiles no shader program from J − 20 to done + 1.5 (renderer.info.programs never grows:
//         every era program — the kiosks' bell sprites and the holograms included — was compiled at load) and the warning
//         frame's era update stays under 10 ms (the first callout's layout warmed at set-up)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const D = await import('./src/world/eras-data.js');
  const { SUBS, PLAYER } = await import('./src/config.js');
  const { SFX } = await import('./src/audio/audio.js');
  const { Hit } = await import('./src/game/physics.js');
  const parts = (/only=([\w,]+)/.exec(String(window.__pageArgs || ''))?.[1] || 'first,sched,flip,fall,shove,rescue,device,guard,fx,frames,sky,modes').split(',');
  const dbg = g.debug;
  dbg.freeze();
  const calm = () => { for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } } };
  calm();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let W = __G.eraWorld, E = g.match.eras, L = __G.level, P = __G.paint;
  if (!W || !E) { R('the era engine runs on bluestone', false); return out; }
  const has = (m, e) => (m >> (e - 1)) & 1;
  const blk = (tag, side = -1) => L.blocks.find((b) => b.tag === tag && Math.sign(b.center.z) === side);
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));   // run the sim to stage time t
  const flipAt = (b, J) => J.at + W.groups[b.eraG].rg / W.speed;
  const kid = () => g.match.actors.find((a) => a.isLocal) || g.match.actors[0];
  const put = (a, x, y, z) => { a.pos.set(x, y, z); a.vel?.set(0, 0, 0); a.grounded = false; };

  // ------------------------------------------------------------------------------------------- first (a fresh page)
  if (parts.includes('first')) {
    // the load-time compile pass (EraWorld.ready → the idle callback → _precompile) has run
    for (let i = 0; i < 80 && !(W.stats.precompiled >= 1); i++) await new Promise((r) => setTimeout(r, 100));
    const m = g.match, Rn = __G.renderer, prog = () => Rn.info.programs?.length || 0, G = __G;
    m.time = m.duration - 39; step(0.1);   // (the host clock to 39 s played: J − 21 of jump 1)
    const upd = E.update.bind(E); let um = 0;
    E.update = (dt, t) => { const a0 = performance.now(); upd(dt, t); um = performance.now() - a0; };
    // (what the warning frame spends its time on, and the programs compiled by name)
    const parts2 = {}, timed = (o, k, label) => { const f = o[k].bind(o); o[k] = (...a) => { const t0 = performance.now(); try { return f(...a); } finally { parts2[label] = +((parts2[label] || 0) + performance.now() - t0).toFixed(2); } }; return () => { o[k] = f; }; };
    const undo = [timed(E, '_say', 'say'), timed(E, '_ring', 'ring'), timed(E, '_warnState', 'warnState'), timed(W.paint, 'clearFaces', 'clearFaces'), timed(W.fx, 'setJump', 'setJump'), timed(E, '_view', 'view'), timed(G.audio || { play() {} }, 'play', 'audio')];
    const names0 = new Set((Rn.info.programs || []).map((q) => q.name + '#' + q.id));
    const p0 = prog(), rows = [];
    let warnFrame = null, maxProg = p0, prevPhase = E.phase;
    while (E.S.clock.t < 60 + W.doneOff + 1.5) {
      dbg.step(1000 / 60);
      const p = prog(), ph = E.phase;
      if (p > maxProg) { maxProg = p; rows.push([+(E.S.clock.t - 60).toFixed(2), ph, p - p0]); }
      if (ph === 'warn' && prevPhase !== 'warn' && !warnFrame) warnFrame = { t: +(E.S.clock.t - 60).toFixed(2), updateMs: +um.toFixed(2), parts: { ...parts2 } };
      prevPhase = ph;
    }
    E.update = upd; undo.forEach((f) => f());
    const newProgs = (Rn.info.programs || []).filter((q) => !names0.has(q.name + '#' + q.id)).map((q) => q.name || q.cacheKey?.slice(0, 60));
    R('step 8 (review 2, issue 1): the page\'s first jump on the real schedule compiles no shader program from J − 20 to done + 1.5 (every era program was compiled at load: the bells\' sprites and the holograms too) and the warning frame\'s era update is under 10 ms',
      W.stats.precompiled >= 1 && maxProg === p0 && !!warnFrame && warnFrame.updateMs < 10 && E.era === 2,
      { precompiled: W.stats.precompiled, compiledAtLoad: W.stats.compiled, compileMs: W.stats.compileMs, programs: [p0, maxProg], grew: rows.slice(0, 8), newPrograms: newProgs, warnFrame });
    E.debugJump(1, { instant: true }); E.over = null;   // (back on the real schedule: 'sched' moves the clock back to 49 s)
  }

  // ------------------------------------------------------------------------------------------- sched
  if (parts.includes('sched')) {
    const Es = L.layout.eras, S = (o) => D.eraSchedule(Es, o);
    const turf = S({ mode: 'turf', duration: 180 }), t90 = S({ mode: 'turf', duration: 90 }), zones = S({ mode: 'zones', duration: 300 }), tower = S({ mode: 'tower', duration: 300 }), karp = S({ mode: 'bazookarp', duration: 300 });
    const boss = S({ mode: 'boss', duration: 300 }), prac = S({ practice: true, duration: Infinity }), attract = S({ attract: true, duration: 99999 }), audit = S({ mode: 'turf', duration: 180, audit: 2 });
    const at = (s) => s.jumps.map((j) => `${j.from}>${j.to}@${j.at}`).join(' ');
    const cyc = D.cycleJumps(60, 200).map((j) => `${j.from}>${j.to}@${j.at}`).join(' ');
    R('step 8: the schedule per mode — Turf War 3:00 jumps at 60 and 120 s, 1:30 at 30 and 60, the five-minute modes at 100 and 200 (none in overtime: all inside regulation), Boss Battle fixed in era 2, Practice every 60 s with the rewind 3 → 1, the menu backdrop every 40 s, ?era=2 holds era 2',
      at(turf) === '1>2@60 2>3@120' && at(t90) === '1>2@30 2>3@60' && at(zones) === '1>2@100 2>3@200' && at(tower) === at(zones) && at(karp) === at(zones) && boss.fixed === 2 && !boss.jumps.length
        && prac.cycle === 60 && cyc.startsWith('1>2@60 2>3@120 3>1@180') && attract.cycle === 40 && audit.fixed === 2 && !audit.jumps.length && zones.jumps.every((j) => j.at + W.doneOff < 300),
      { turf: at(turf), t90: at(t90), zones: at(zones), boss, practice: cyc, attract, audit, live: E.sched });
    // the live match: the host's clock (duration − time) moved to 49 s; the warning at 50, the jump at 60, done ≈ 64
    const m = g.match, calls = [];
    const off = (await import('./src/core/ctx.js')).on('era:warn', (e) => calls.push(['warn', +E.S.clock.t.toFixed(2)]));
    const off2 = (await import('./src/core/ctx.js')).on('era:done', (e) => calls.push(['done', +E.S.clock.t.toFixed(2), e.era]));
    m.time = m.duration - 49; step(0.2);
    const e0 = E.era, p0 = E.phase;
    tAt(66);
    off?.(); off2?.();
    const w = calls.find((c) => c[0] === 'warn'), dn = calls.find((c) => c[0] === 'done');
    R('step 8: the live match is driven only by the host stage clock: the match clock set to 49 s played → the warning at 50 s, the jump at 60, done at 60 + R_max / 25 + 0.5, era 2 after',
      e0 === 1 && w && Math.abs(w[1] - 50) < 0.05 && dn && Math.abs(dn[1] - (60 + W.doneOff)) < 0.05 && E.era === 2 && W.navEra === 2,
      { before: [e0, p0], calls, after: E.state() });
    E.debugJump(1, { instant: true });
    // the clock easing BACK (an online follower after a stalled host packet: StageClock t += dt + d·min(1, 3dt) walks back
    // for a few frames when the host's clock arrives > 1/3 s behind): 0.9 s more time on the match clock just after the
    // warning, and again just after the crates' flip — every event fires once and no group flips back
    {
      E.over = null;
      const CTX = await import('./src/core/ctx.js'), ev = [], said = [], say = E._say.bind(E);
      const offs = ['era:warn', 'era:jump', 'era:done', 'era:flip'].map((n) => CTX.on(n, (d) => ev.push([n, +E.S.clock.t.toFixed(3), d?.group, d?.on?.length || 0, d?.off?.length || 0])));
      E._say = (t, s, b) => { said.push([t, +E.S.clock.t.toFixed(2)]); say(t, s, b); };
      m.time = m.duration - 49.5; step(0.2);
      const fl0 = E.stats.flipLog.length;
      tAt(50.05);
      const tA = E.S.clock.t; m.time += 0.9; const tr = [];
      for (let i = 0; i < 40; i++) { step(1 / 60); tr.push(E.S.clock.t); }
      // (the stage clock now runs 0.9 s behind the old track and converges on it: run on to the crates' flip by the
      //  runtime's own time, not the raw clock)
      const crate = blk('crates-stack'), Fc = 60 + W.groups[crate.eraG].rg / W.speed;
      for (let k = 0; (E.tNow ?? E.S.clock.t) < Fc + 0.05 && k < 2400; k++) step(1 / 60);
      const tB = E.S.clock.t, solidB = crate.solid; m.time += 0.9; const tr2 = []; let reSolid = false;
      for (let i = 0; i < 40; i++) { step(1 / 60); tr2.push(E.S.clock.t); if (crate.solid) reSolid = true; }
      tAt(60 + W.doneOff + 1.5);
      offs.forEach((f) => f?.()); E._say = say;
      const n = (k) => ev.filter((x) => x[0] === k).length, flips = ev.filter((x) => x[0] === 'era:flip'), log = E.stats.flipLog.slice(fl0);
      const back = [+(tA - Math.min(...tr)).toFixed(3), +(tB - Math.min(...tr2)).toFixed(3)];
      R('step 8: the runtime never runs backwards — the match clock pushed 0.9 s back just after the warning and again just after the crates\' flip (the stage clock walks back for a few frames): one era:warn, one era:jump, one era:done, the 8 groups flip once each (none flips back), "TIME JUMP" said once',
        back[0] > 0.1 && back[1] > 0.1 && n('era:warn') === 1 && n('era:jump') === 1 && n('era:done') === 1 && flips.length === 8 && new Set(flips.map((x) => x[2])).size === 8 && log.length === 8 && log.every((x) => x.era === 2)
          && !solidB && !reSolid && said.filter((x) => x[0] === 'TIME JUMP').length === 1 && E.era === 2,
        { clockWentBack: back, warns: n('era:warn'), jumps: n('era:jump'), dones: n('era:done'), flips: flips.map((x) => `${x[2]} @${x[1]}`), crateSolidAfterFlip: solidB, crateBackSolid: reSolid, tB: +tB.toFixed(3), Fc: +Fc.toFixed(3), said });
      E.debugJump(1, { instant: true });
    }
    // a follower's clock snapping FORWARD across a done (a stalled screen catching up): the done still happens there —
    // one era:done (snapped: Bazookarp's field switches on it), the nav in the new era, the fresh-ground weight on
    {
      E.over = null;
      const CTX = await import('./src/core/ctx.js'), dn = [];
      const off = CTX.on('era:done', (d) => dn.push({ ...d, t: +E.S.clock.t.toFixed(2) }));
      m.time = m.duration - 52; step(0.3);
      const before = { era: E.era, nav: W.navEra };
      m.time = m.duration - 66.5; step(0.2);   // (the match clock jumps 14.5 s: the stage clock snaps, seek('clock'))
      off();
      R('step 8 (H11): a follower\'s clock snapping forward across a done (a stalled screen catching up) still fires that done once (era:done, snapped) — the nav in the new era, the fresh-ground weight on',
        before.era === 1 && dn.length === 1 && dn[0].era === 2 && dn[0].snapped === true && W.navEra === 2 && !!E.fresh && E.stats.snapDones >= 1,
        { before, dones: dn, navEra: W.navEra, fresh: !!E.fresh, snapDones: E.stats.snapDones });
      E.debugJump(1, { instant: true });
    }
  }

  // ------------------------------------------------------------------------------------------- flip
  if (parts.includes('flip')) {
    E.debugJump(1, { instant: true });
    const crate = blk('crates-stack'), Ph = __G.physics, hit = new Hit();
    const ray = () => Ph.raycast(new THREE.Vector3(crate.aabbMin.x - 0.5, 1.6, crate.center.z), new THREE.Vector3(1, 0, 0), crate.aabbMax.x - crate.aabbMin.x + 1, hit, false).hit;
    const n0 = E.stats.flipLog.length;
    const J = E.debugJump(2, { inS: 10.2 });
    step(0.5);   // the warning
    const warnLayer = !!__G.nav.blocked && __G.nav.blocked.some((v) => v);
    const F = flipAt(crate, J);
    tAt(F - 0.05);
    const before = { ray: ray(), solid: crate.solid, ink: W.inkOk(crate, E.S.clock.t) };
    tAt(F + 0.05);
    const after = { ray: ray(), solid: crate.solid, k: Math.min(1, Math.max(0, (W.uniforms.uEra.value.z - W.groups[crate.eraG].rg) / W.uniforms.uEra.value.w + 0.5)) };
    const cafe = L.blocks.find((b) => b.tag === 'cafe' && b.eraG === crate.eraG);
    const guardInk = W.inkOk(cafe, E.S.clock.t), lateInk = W.inkOk(cafe, F + 0.6), navMid = W.navEra;
    tAt(J.doneAt + 0.2);
    const log = E.stats.flipLog.slice(n0), errs = log.map((x) => { const g2 = W.groups.find((q) => q.key === x.key); return +(x.t - (J.at + g2.rg / W.speed)).toFixed(4); });
    const worst = Math.max(...errs.map(Math.abs));
    R('step 8: every changing group flips at J + r_g / 25 within one frame (jump 1 → 2: 8 groups)', log.length === 8 && errs.every((d) => d >= -1e-6 && d <= 1 / 60 + 1e-3),
      { flips: log.map((x, i) => `${x.key} r ${x.r} +${errs[i]}`), worst });
    R('step 8: at its flip a group switches whole: a ray through the era-1 crates hits before and misses after; the shader\'s front reaches it then (visibility mix 0.5 → 1 over 0.3 s); its new piece takes no ink in the guard and ink after; the nav marks it from the warning and switches era at done',
      before.ray && before.solid && !after.ray && !after.solid && after.k >= 0.5 && warnLayer && !guardInk && lateInk && navMid === 1 && W.navEra === 2 && !__G.nav.blocked,
      { before, after, warnLayer, guardInk, lateInk, navMid, navAfter: W.navEra });
  }

  // ------------------------------------------------------------------------------------------- fall
  if (parts.includes('fall')) {
    E.debugJump(3, { instant: true });
    const a = kid(), halo = blk('halo'), top = halo.center.y + halo.half.y;
    const J = E.debugJump(1, { inS: 0 });
    const F = flipAt(halo, J);
    tAt(F - 0.1);
    calm(); put(a, halo.center.x, top + 0.02, halo.center.z); step(0.05);
    const onIt = a.pos.y > top - 0.2;
    tAt(F + 1.6);
    const gh = L.groundHeight(a.pos.x, a.pos.z, a.pos.y + 0.5);
    R('step 8: a kid standing on a vanishing top (the Halo in Practice\'s rewind 3 → 1) falls when it goes and lands on the floor below, alive', onIt && a.alive && Math.abs(a.pos.y - gh) < 0.15 && a.pos.y < 2,
      { onIt, y: +a.pos.y.toFixed(2), floor: gh, alive: a.alive });
    tAt(J.doneAt + 1.2);
  }

  // ------------------------------------------------------------------------------------------- shove
  if (parts.includes('shove')) {
    E.debugJump(2, { instant: true });
    const acts = g.match.actors.filter((x) => !x.remote).slice(0, 3), halo = blk('halo'), top = halo.center.y + halo.half.y;
    const J = E.debugJump(3, { inS: 0 });
    const F = flipAt(halo, J), s0 = E.stats.eraShoves;
    tAt(F - 1 / 60 - 0.001);
    calm();
    // one hovering where the deck builds (feet 0.35 m under its top: straight up onto it), one under it (feet 1.6 m under
    // the deck, head inside it: shoved out to the nearest fitting node)
    put(acts[0], halo.center.x, top - 0.35, halo.center.z);
    put(acts[1], halo.center.x, top - 1.6, halo.center.z);
    step(2 / 60);
    const Ph = __G.physics;
    const fit = (a) => Ph.bodyFits(a.pos.clone().setY(a.pos.y + 0.02), PLAYER.radius, PLAYER.stepUp, PLAYER.height * 0.9, a.form === 'squid');
    const res = acts.slice(0, 2).map((a) => ({ y: +a.pos.y.toFixed(2), x: +a.pos.x.toFixed(2), z: +a.pos.z.toFixed(2), fits: fit(a) }));
    R('step 8: a kid forced into an appearing piece is shoved out with its body fitting (up onto the Halo when the feet are within 0.8 m under its top; else to the nearest fitting spot), counted in stats.eraShoves',
      E.stats.eraShoves - s0 >= 2 && res.every((r) => r.fits) && Math.abs(res[0].y - top) < 0.1 && !L.pointInBlock(halo, new THREE.Vector3(res[1].x, res[1].y + 0.9, res[1].z), 0),
      { shoves: E.stats.eraShoves - s0, res, top });
    tAt(J.doneAt + 0.5);
  }

  // ------------------------------------------------------------------------------------------- rescue
  if (parts.includes('rescue')) {
    E.debugJump(3, { instant: true });
    const a = kid(), gd = blk('floating-garden'), top = gd.center.y + gd.half.y, r0 = E.stats.rescues, deaths0 = a.stats?.deaths ?? 0;
    const J = E.debugJump(1, { inS: 0 });
    const F = flipAt(gd, J);
    tAt(F - 0.1); calm(); put(a, gd.center.x, top + 0.02, gd.center.z); step(0.05);
    const on = a.pos.y > top - 0.2;
    tAt(F + 0.5);
    const gh = L.groundHeight(a.pos.x, a.pos.z, a.pos.y + 0.5);
    R('step 8: a kid on a piece that vanishes over water (the floating garden in the rewind) is rescued to a valid node, never splatted',
      on && E.stats.rescues > r0 && a.alive && gh > PLAYER.waterY + 0.3 && (a.stats?.deaths ?? 0) === deaths0, { on, rescues: E.stats.rescues - r0, alive: a.alive, at: [+a.pos.x.toFixed(1), +a.pos.y.toFixed(2), +a.pos.z.toFixed(1)], floor: gh });
    tAt(J.doneAt + 1.2);
    // the roof branch (ENGINE §4.2 rev 2; no garden-on-roof on the Z): a kid left on a roof top with nothing walkable
    // within 3.4 m under it after a flip — the Customs House's roof (9 m over its 3 m block) stands in for the vanished deck
    const roof = L.blocks.find((b) => b.tag === 'customs-house' && b.roof && b.center.z < 0), ry = roof.center.y + roof.half.y, r1 = E.stats.rescues;
    calm(); put(a, roof.center.x, ry + 0.02, roof.center.z); a.pos.y = ry + 0.02;
    E._rescue([roof.id]);
    const ghR = L.groundHeight(a.pos.x, a.pos.z, a.pos.y + 0.5);
    R('step 8: … and a kid left on a roof with nothing walkable within 3.4 m below it is rescued the same way (the roof branch)', E.stats.rescues === r1 + 1 && a.pos.y < ry - 3 && ghR > PLAYER.waterY + 0.3,
      { roofTop: ry, at: [+a.pos.x.toFixed(1), +a.pos.y.toFixed(2), +a.pos.z.toFixed(1)], floor: ghR });
    step(0.5);
  }

  // ------------------------------------------------------------------------------------------- device
  if (parts.includes('device')) {
    E.debugJump(3, { instant: true });
    const a = kid(), halo = blk('halo'), top = halo.center.y + halo.half.y;
    const it = __G.subs._throw(a, SUBS.sprinkler, new THREE.Vector3(halo.center.x, top + 1.2, halo.center.z), new THREE.Vector3(0, -6, 0), false);
    step(0.6);
    const st0 = it.state, onFace = it.face >= 0 ? L.faces[it.face].block === halo.id : null;
    const J = E.debugJump(1, { inS: 0 }), d0 = E.stats.devices;
    tAt(flipAt(halo, J) + 0.1);
    R('step 8: a sprinkler on a vanishing piece (the Halo in the rewind) is destroyed at its flip (S.crushIn; until G.deploy.crushIn exists, the module\'s walk of G.subs.items)',
      st0 === 'spray' && onFace && it.state === 'dead' && E.stats.devices > d0, { before: st0, onFace, after: it.state, crushIn: typeof __G.deploy?.crushIn });
    tAt(J.doneAt + 1.2);
  }

  // ------------------------------------------------------------------------------------------- guard
  if (parts.includes('guard')) {
    E.debugJump(2, { instant: true });
    const halo = blk('halo'), top = halo.center.y + halo.half.y, hk = [];
    for (const fid of halo.faces) if (fid >= 0 && L.faces[fid].atlas) { const f = L.faces[fid]; for (let k = f.grid; k < f.grid + f.nu * f.nv; k++) hk.push(k); }
    const ink = () => hk.reduce((s, k) => s + (P.grid[k] ? 1 : 0), 0);
    const shoot = () => P.splat(new THREE.Vector3(halo.center.x, top + 0.3, halo.center.z), 1.4, 0, { instant: true });
    const J = E.debugJump(3, { inS: 0 }), F = flipAt(halo, J);
    tAt(F - 0.3); shoot(); const early = ink();
    tAt(F + 0.2); shoot(); const guarded = ink();
    tAt(F + 0.65); shoot(); const late = ink();
    // a replayed splat carries its painter's time: the same verdict at any receiver time
    const replayIn = W.inkOk(halo, F + 0.3), replayOut = W.inkOk(halo, F + 0.55);
    R('step 8: the guard window — a splat on the Halo 0.3 s before its flip (absent) and 0.2 s after (guarded) claims nothing; 0.65 s after it inks; a replay is judged at its painter\'s time',
      early === 0 && guarded === 0 && late > 0 && !replayIn && replayOut, { early, guarded, late, replayIn, replayOut });
    tAt(J.doneAt + 0.5);
  }

  // ------------------------------------------------------------------------------------------- fx + frames
  if (parts.includes('fx') || parts.includes('frames')) {
    E.debugJump(1, { instant: true });
    const played = [], A = __G.audio, orig = A?.play?.bind(A), origLoop = A?.loop?.bind(A);
    if (A) { A.play = (n, o) => { played.push(n); return orig(n, o); }; A.loop = (n, o) => { played.push(n + ':loop'); return origLoop(n, o); }; }
    const base = []; for (let i = 0; i < 240; i++) { const t0 = performance.now(); dbg.step(1000 / 60); base.push(performance.now() - t0); } base.sort((a, b) => a - b);
    // (the same with ink going down every frame, as in play: the minimap and the turf meter redraw)
    const base2 = [], nodes = __G.nav.nodes; for (let i = 0; i < 240; i++) { const n = nodes[(i * 7919) % nodes.length]; P.splat(new THREE.Vector3(n.x, n.y + 0.4, n.z), 1.2, i & 1); const t0 = performance.now(); dbg.step(1000 / 60); base2.push([performance.now() - t0, i]); } base2.sort((a, b) => b[0] - a[0]);
    const J = E.debugJump(2, { inS: 20.2 });
    step(0.4);   // the pre-bell
    const pre = { phase: E.phase };
    tAt(J.at - 9.6);
    const fx = W.fx, warn = { phase: E.phase, holo: !!fx.holo && fx.holo.every((m) => m.visible), holoPieces: fx.stats.holoPieces, beads: !!fx.beads?.visible, bells: fx.phones.some((p) => p.sp.visible), shake: Math.abs(fx.tartar.rotation.z) + Math.abs(fx.tartar.rotation.x) > 0 };
    tAt(J.at - 0.5);
    const pick = { hand: +fx.tHand.position.y.toFixed(2), beam: fx.beam.visible };
    // frames: from J − 1 to done + 1.5
    const ft = [], top = []; let curt = null, um = 0;
    const upd = E.update.bind(E); E.update = (dt, t) => { const a0 = performance.now(); upd(dt, t); um = performance.now() - a0; };
    while (E.S.clock.t < J.doneAt + 1.5) {
      const pr0 = __G.renderer.info.programs?.length || 0, h0 = performance.memory?.usedJSHeapSize || 0, t0 = performance.now(); dbg.step(1000 / 60); const ms = performance.now() - t0; ft.push(ms);
      top.push([+ms.toFixed(1), +(E.S.clock.t - J.at).toFixed(2), E.phase, (__G.renderer.info.programs?.length || 0) - pr0, +um.toFixed(2), Math.round(((performance.memory?.usedJSHeapSize || 0) - h0) / 1e5) / 10]);
      if (!curt && E.phase === 'jump' && E.front > 30) curt = { visible: fx.curtain?.visible, scale: +fx.curtain?.scale.x.toFixed(1), front: +E.front.toFixed(1) };
    }
    if (A) { A.play = orig; A.loop = origLoop; }
    E.update = upd;
    ft.sort((a, b) => a - b);
    const need = ['era_bell', 'era_ring', 'era_kiosk', 'era_pickup', 'era_swell', 'era_front:loop', 'era_pop'];
    if (parts.includes('fx')) {
      R('step 8: the warning shows what comes (white-gold holograms of every appearing block, the wire beads, the kiosks\' bells, Tartar shaking); the pickup lifts his receiver and drops the beam; the curtain rides the front',
        pre.phase === 'prebell' && warn.phase === 'warn' && warn.holo && warn.holoPieces === 24 && warn.holoPieces === E._info(J).appear.length && warn.beads && warn.bells && warn.shake && pick.hand > 0.3 && pick.beam && curt && curt.visible && Math.abs(curt.scale - curt.front) < 1.5,
        { pre, warn, pick, curt });
      R('step 8: the sounds are synthesized in code (src/audio/sfx-eras.js) and play in order: the pre-bell, Tartar\'s rings and the kiosks, the pickup, the swell, the front\'s loop, the pops',
        need.every((n) => played.includes(n)) && need.filter((n) => !n.endsWith(':loop')).every((n) => SFX[n] && (SFX[n].build || SFX[n].loop)), { played: [...new Set(played)].filter((n) => n.startsWith('era_')) });
    }
    if (parts.includes('frames')) R('step 8: no frame over 50 ms during a jump (each simulated and rendered frame from J − 0.5 to done + 1.5, performance.now())', ft[ft.length - 1] < 50,
      { baselineNoJump: { max: +base[base.length - 1].toFixed(1), p95: +base[Math.floor(base.length * 0.95)].toFixed(1) }, baselineInking: base2.slice(0, 4).map((x) => [+x[0].toFixed(1), x[1]]), frames: ft.length, worst: top.sort((a, b) => b[0] - a[0]).slice(0, 4), baseMs: W.stats.baseMs.slice(-6), compileMs: W.stats.compileMs, max: +ft[ft.length - 1].toFixed(1), p95: +ft[Math.floor(ft.length * 0.95)].toFixed(1), median: +ft[ft.length >> 1].toFixed(1), setThemeMs: W.stats.setThemeMs, envFinalMs: W.stats.envFinalMs, eraUpdateMaxMs: +Math.max(...top.map((x) => x[4])).toFixed(2) });
    if (parts.includes('frames')) {
      // the same seen by a viewer whose minimap lost its cached era bases: an online player on Bravo (the side flip:
      // main.js calls setViewerTeam(1) while the match loads) and a world kept for a match at another time of day (the
      // theme). Each drop is rebuilt before the jump — the flip inside setViewerTeam, the theme by the next era update —
      // so between J and done + 1 no base raster is built (W.stats.baseBuilds) and no frame passes 50 ms
      const mm = g.minimap, th0 = g.theme, rows = [];
      const jumpRun = (label, prep) => {
        const b0 = W.stats.baseBuilds.length, info = prep();
        const before = W.stats.baseBuilds.slice(b0), missing = W._basesMissing();
        const to = E.era === 3 ? 1 : E.era + 1, Jx = E.debugJump(to, { inS: 0 }), b1 = W.stats.baseBuilds.length, fr = [];
        while (E.S.clock.t < Jx.doneAt + 1.0) { const t0 = performance.now(); dbg.step(1000 / 60); fr.push([+(performance.now() - t0).toFixed(1), +(E.S.clock.t - Jx.at).toFixed(2)]); }
        const during = W.stats.baseBuilds.slice(b1);
        fr.sort((a, b) => b[0] - a[0]);
        rows.push({ label, ...info, rebuiltBefore: before.map((x) => `${x.e}:${x.why} ${x.ms} ms`), missingAtJ: missing, jump: `${Jx.from}>${Jx.to}`, buildsJtoDone1: during, worst: fr.slice(0, 3) });
      };
      jumpRun('bravo', () => { mm.setViewerTeam(1); return { flip: mm.flip, cached: [...(mm._bases?.keys() || [])].sort().join('') }; });
      jumpRun('theme', () => { mm.setViewerTeam(0); step(0.1); g.theme = th0 === 'sunset' ? 'golden' : 'sunset'; __G.env.setTheme?.(g.theme); step(4 / 60); return { theme: g.theme, mmTheme: mm._theme, cached: [...(mm._bases?.keys() || [])].sort().join('') }; });
      g.theme = th0; __G.env.setTheme?.(th0); step(0.1);
      R('step 8 (review fix 1): a viewer on Bravo (the minimap\'s side flip drops its cached era bases) and a match at another time of day (the theme drops them): the bases are rebuilt before the jump, and none is built between J and done + 1',
        rows.length === 2 && rows.every((r) => !r.missingAtJ && r.cached === '123' && r.buildsJtoDone1.length === 0) && rows[0].flip === true && rows[0].rebuiltBefore.length === 2 && rows[1].rebuiltBefore.length >= 2,
        rows);
      // (the frame time of those two jumps: a timing, judged like the frames check above — flaky on a loaded machine)
      R('step 8 (review fix 1, timing): … and no frame of those two jumps passes 50 ms', rows.length === 2 && rows.every((r) => r.worst[0][0] < 50),
        { worst: rows.map((r) => [r.label, r.worst]), baselineNoJumpMax: +base[base.length - 1].toFixed(1) });
    }
  }

  // ------------------------------------------------------------------------------------------- sky (12c: the time-lapse)
  // from J to done the sun swings (up to timelapse.sunSwing°) and the clouds race (× cloudRate), the sky blending to the new
  // era's look; exposure and the grade are never touched; at done + 0.7 the new era's look settles and the env map is
  // rebuilt once (the scene's environment is a new PMREM texture)
  if (parts.includes('sky')) {
    E.debugJump(1, { instant: true }); step(0.3);
    const env = __G.env, U = env.U, Rn = __G.renderer, TL = W.E.timelapse;
    const sun0 = U.uSunDir.value.clone(), cloud0 = U.uCloudParams.value.z, exp0 = Rn.toneMappingExposure, grade0 = env.grade, envMap0 = __G.scene.environment, hz0 = U.uHorizon.value.getHexString();
    const J = E.debugJump(2, { inS: 0.05 });
    const rows = [];
    let maxAng = 0, maxCloud = cloud0, exposureKept = true, gradeKept = true;
    while (E.S.clock.t < J.doneAt + 1.2) {
      step(1 / 15);
      const ang = Math.acos(Math.max(-1, Math.min(1, U.uSunDir.value.dot(sun0)))) * 180 / Math.PI;
      if (E.phase === 'jump') { maxAng = Math.max(maxAng, ang); maxCloud = Math.max(maxCloud, U.uCloudParams.value.z); }
      if (Rn.toneMappingExposure !== exp0) exposureKept = false;
      if (env.grade !== grade0) gradeKept = false;
      if (rows.length < 12 && Math.round((E.S.clock.t - J.at) * 15) % 8 === 0) rows.push([+(E.S.clock.t - J.at).toFixed(2), E.phase, +ang.toFixed(1), +(U.uCloudParams.value.z / Math.max(1e-6, cloud0)).toFixed(1)]);
    }
    const sunEnd = Math.acos(Math.max(-1, Math.min(1, U.uSunDir.value.dot(sun0)))) * 180 / Math.PI, envMap1 = __G.scene.environment;
    R('12c: the time-lapse from J to done — the sun swings (≥ 30° at its widest), the clouds race (≥ 5×), exposure and the grade held; at done the new era\'s look settles (the sun back within 5°, the clouds at their rate) and the env map is rebuilt once',
      maxAng >= 30 && maxCloud >= cloud0 * 5 && exposureKept && gradeKept && sunEnd < 5 && Math.abs(U.uCloudParams.value.z - cloud0) < 1e-6 && envMap1 && envMap1 !== envMap0 && W.stats.envFinalMs !== undefined,
      { timelapse: TL, maxSunAngle: +maxAng.toFixed(1), maxCloudRate: +(maxCloud / Math.max(1e-6, cloud0)).toFixed(1), exposureKept, gradeKept, sunEnd: +sunEnd.toFixed(1), horizon: [hz0, U.uHorizon.value.getHexString()], envMapNew: envMap1 !== envMap0, envFinalMs: W.stats.envFinalMs, rows });
    E.debugJump(1, { instant: true });
  }

  // ------------------------------------------------------------------------------------------- modes (last: new matches)
  if (parts.includes('modes')) {
    const waitPlaying = async () => { for (let i = 0; i < 300; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
    dbg.unfreeze?.();
    await g.api.startMatch({ mapId: 'bluestone', mode: 'boss' });
    await waitPlaying(); dbg.freeze(); calm();
    W = __G.eraWorld; E = g.match.eras; L = __G.level;
    const bossEra = E && E.era, navEra = W.navEra, haloSolid = L.blocks.filter((b) => b.tag === 'halo').some((b) => b.solid);
    step(1);
    R('step 8: a Boss Battle on Bluestone is held in era 2 (applied before BossMode builds its nav) and never jumps', bossEra === 2 && navEra === 2 && !haloSolid && E.sched.fixed === 2 && !E.next && !!g.match.bossMode,
      { era: bossEra, navEra, next: E?.next, sched: E?.sched });
    dbg.unfreeze?.();
    await g.api.startMatch({ mapId: 'bluestone', practice: true });
    await waitPlaying(); dbg.freeze(); calm();
    W = __G.eraWorld; E = g.match.eras;
    const p0 = E.era;
    E.S.clock.t = 59; E.lastT = 59; tAt(64.5);
    const p1 = E.era;
    E.S.clock.t = 179; E.seek(179, 'test'); tAt(184.5);
    R('step 8: Practice starts in era 1 and cycles: era 2 after the jump at 60 s … and back to the 1880s (the rewind) after 180 s', p0 === 1 && p1 === 2 && E.era === 1 && E.sched.cycle === 60, { p0, p1, p2: E.era });
    // review fix 1, the load path: a match on the world kept from the last one, at another time of day — the minimap's
    // theme drop and the era bases' rebuild happen while the match is set up (behind the faded screen), none once it plays
    {
      const mm0 = g.minimap, th0 = g.theme, time = /sunset|dusk/.test(String(th0)) ? 'day' : 'dusk', mmTheme0 = mm0._theme;   // (offline times: day / dusk)
      const b0 = W.stats.baseBuilds.length;
      dbg.unfreeze?.();
      await g.api.startMatch({ mapId: 'bluestone', practice: true, time });
      await waitPlaying(); dbg.freeze(); calm();
      W = __G.eraWorld; E = g.match.eras;
      const atLoad = W.stats.baseBuilds.slice(b0).map((x) => `${x.e}:${x.why} ${x.ms} ms @${x.t}`), missing0 = W._basesMissing(), b1 = W.stats.baseBuilds.length;
      step(1.0);
      const after = W.stats.baseBuilds.slice(b1);
      R('step 8 (review fix 1): a match on the kept world at another time of day — the minimap takes the new theme and the other eras\' bases are rebuilt during the set-up, so none is missing or built once the match plays',
        g.minimap === mm0 && g.theme !== th0 && mmTheme0 && mm0._theme === g.theme && atLoad.filter((x) => /:theme /.test(x)).length === 2 && !missing0 && after.length === 0,
        { theme: [th0, g.theme], mmTheme: [mmTheme0, mm0._theme], keptWorld: g.minimap === mm0, atLoad, missingAtPlay: missing0, builtWhilePlaying: after });
    }
  }
  return out;
})()
