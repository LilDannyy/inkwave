// Bluestone Junction's era engine — every mode (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §6 step 12; DESIGN.md
// §3.3, §8.7), on the stage itself, each mode's own match started by the test:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-modes.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGE_ARGS='only=zones,boss')
// zones     Zone Control on the real schedule (jumps at 100 and 200 s of the 5:00): every zone's paint cells are the same
//           cells, all live, before and after each jump (a recount from the outline, as zones.js counts them at the start)
// overtime  the same match taken into overtime (the match clock held at 0, the stage clock running on frame time): no
//           warning, no jump, no flip — the world stays in the 3000s
// boss      a Boss Battle starts in era 2 and never jumps (60 s played: no event, no flip); its BossNav roams ≥ 150 m² of the
//           circus ring; an era-3 BossNav built for the record walls the circus off (the Halo's deck at 5.0–5.4 m over it:
//           BossNav's 5.2 m test), so a later change of `fixed` is caught here
// practice  Practice on its own schedule (a jump every 60 s: 1 → 2 → 3, then the rewind 3 → 1 at 180 s): a kid on the
//           floating garden over the river when it goes is rescued to dry ground, a kid on the Halo drops to the circus;
//           neither is splatted, neither is shoved
// attract   the menu backdrop (the attract match behind the menus and the lobby): a jump every 40 s through the rewind,
//           the city's looks and the bots' world change, no HUD chip, no era sound, no callout
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const CTX = await import('./src/core/ctx.js');
  const parts = (/only=([\w,]+)/.exec(String(window.__pageArgs || ''))?.[1] || 'zones,overtime,boss,practice,attract').split(',');
  const dbg = g.debug;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const waitPlaying = async () => { for (let i = 0; i < 400; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const start = async (o) => { dbg.unfreeze?.(); await g.api.startMatch({ mapId: 'bluestone', ...o }); const ok = await waitPlaying(); dbg.freeze(); return ok; };
  const calm = () => { for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } } };
  const evLog = () => { const ev = []; const offs = ['era:prebell', 'era:warn', 'era:jump', 'era:flip', 'era:done', 'era:set'].map((n) => CTX.on(n, (d) => ev.push([n, +(g.match?.eras?.S.clock.t ?? -1).toFixed(2), d?.era ?? d?.group ?? null]))); return { ev, off: () => offs.forEach((f) => f()) }; };

  // a zone's cells as zones.js counts them: every live turf cell whose centre is inside the outline and within [y0, y1]
  const insidePoly = (poly, x, z) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins; } return ins; };
  const recount = (def) => {
    const L = __G.level, P = __G.paint, parts2 = def.polys || [def.poly], y0 = def.y0 ?? -2, y1 = def.y1 ?? 6, cells = [];
    for (const f of L.faces) {
      if (!f.turf || !f.atlas) continue;
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
        const s = (i + 0.5) * f.cu, t = (j + 0.5) * f.cv;
        const wx = f.origin.x + f.u.x * s + f.v.x * t, wy = f.origin.y + f.u.y * s + f.v.y * t, wz = f.origin.z + f.u.z * s + f.v.z * t;
        if (wy < y0 || wy > y1 || !parts2.some((p) => insidePoly(p, wx, wz))) continue;
        const k = f.grid + j * f.nu + i;
        if (P.dead && P.dead[k]) continue;
        cells.push(k);
      }
    }
    return cells.sort((a, b) => a - b);
  };
  const hash = (a) => { let h = 2166136261; for (const v of a) { h ^= v; h = Math.imul(h, 16777619) >>> 0; } return (h >>> 0).toString(16); };

  // ------------------------------------------------------------------------------------------- zones (+ overtime)
  if (parts.includes('zones') || parts.includes('overtime')) {
    await start({ mode: 'zones' });
    calm();
    const m = g.match, E = m.eras, Z = m.zones, W = __G.eraWorld, P = __G.paint;
    if (!E || !Z) R('Zone Control runs with the era engine', false, { E: !!E, Z: !!Z });
    else {
      const t0 = Z.zones.map((z) => [...z.cells].sort((a, b) => a - b));
      const snap = (label) => ({ label, era: E.era, t: +E.S.clock.t.toFixed(1), zones: Z.zones.map((z, i) => { const rc = recount(z.def); return { i, kind: z.kind, n: rc.length, hash: hash(rc), same: rc.length === t0[i].length && rc.every((k, j) => k === t0[i][j]), live: t0[i].every((k) => P.live[k] && !P.dead[k]) }; }) });
      const rows = [snap('start')];
      const L = evLog();
      // the real schedule: the host clock moved (duration − time) to just before each jump, then played through it
      for (const J of E.sched.jumps) {
        m.time = m.duration - (J.at - 12); step(0.3);
        rows.push(snap(`before ${J.from}>${J.to}`));
        step(12 + W.doneOff + 1.5);
        rows.push(snap(`after ${J.from}>${J.to}`));
      }
      L.off();
      const jumps = L.ev.filter((x) => x[0] === 'era:jump').map((x) => x[1]), dones = L.ev.filter((x) => x[0] === 'era:done').map((x) => [x[1], x[2]]);
      if (parts.includes('zones')) R('step 12: Zone Control — every zone\'s paint cells are the same cells, all of them live, before and after each jump (the real schedule: jumps at 100 and 200 s of the 5:00; nothing changes within 2 m of a zone, rule 15)',
        rows.length === 5 && rows.every((r) => r.zones.every((z) => z.same && z.live && z.n > 50)) && jumps.length === 2 && Math.abs(jumps[0] - 100) < 0.05 && Math.abs(jumps[1] - 200) < 0.05 && dones.length === 2 && dones[1][1] === 3 && E.era === 3,
        { rows: rows.map((r) => ({ ...r, zones: r.zones.map((z) => `${z.kind}${z.i}: ${z.n} cells ${z.hash} same ${z.same} live ${z.live}`) })), jumps, dones });
      if (parts.includes('overtime')) {
        // overtime: the match clock is held at 0 (match.js: the clock stays at 0 through overtime) and the stage clock runs
        // on, on frame time, past regulation
        m.time = 0.4; step(0.2);
        const was = { state: m.state, overtime: Z.overtime, t: +E.S.clock.t.toFixed(1) };
        // (the bots stand still in this test, so the counts are level: sudden death from a tie, which plays on to the cap)
        if (m.state === 'playing' && !Z.overtime) { Z.overtime = true; Z.overtimeT = 0; Z.otLosing = -1; m.time = 0; }
        const L2 = evLog(), f0 = E.stats.flips, tA = E.S.clock.t;
        let played = 0;
        for (let i = 0; i < 40 * 60 && m.state === 'playing'; i++) { dbg.step(1000 / 60); played += 1 / 60; }
        L2.off();
        R('step 12: overtime never jumps — the stage clock runs on past regulation (the match clock held at 0) with no warning, no jump and no flip; the world stays in the 3000s',
          played > 20 && E.S.clock.t > tA + 19 && L2.ev.filter((x) => x[0] !== 'era:set').length === 0 && E.stats.flips === f0 && E.era === 3 && !E.next && E.phase === 'idle',
          { before: was, simulated_s: +played.toFixed(1), clock: [+tA.toFixed(1), +E.S.clock.t.toFixed(1)], events: L2.ev.slice(0, 6), era: E.era, phase: E.phase, next: E.next, overtime: Z.overtime, state: m.state });
      }
    }
  }

  // ------------------------------------------------------------------------------------------- boss
  if (parts.includes('boss')) {
    await start({ mode: 'boss' });
    const m = g.match, E = m.eras, W = __G.eraWorld, L = __G.level, boss = __G.boss;
    const L1 = evLog(), f0 = E?.stats.flips ?? -1;
    step(60);
    L1.off();
    const ring = (nav) => { let n = 0; for (const i of nav.planIds) { const [x, z] = nav.xz(i); const r = Math.hypot(x, z); if (r >= 8.8 && r <= 20) n++; } return n * nav.step * nav.step; };
    const nav = boss?.nav, ring2 = nav ? ring(nav) : -1;
    // for the record: the same BossNav built with the world in era 3 (the Halo's deck over the ring), then era 2 again
    let ring3 = -1, area3 = -1;
    if (nav && W) {
      const { BossNav } = await import('./src/boss/bossNav.js');
      W._solidity(3);
      try { const n3 = new BossNav(L); ring3 = ring(n3); area3 = n3.area; } finally { W._solidity(2); for (const gq of W.groups) W._setGroup(gq, 2); }
    }
    const haloSolid = L.blocks.filter((b) => b.tag === 'halo').some((b) => b.solid);
    R('step 12: a Boss Battle starts in era 2 and never jumps (60 s played: no warning, no jump, no flip); its BossNav roams ≥ 150 m² of the circus ring',
      !!E && E.era === 2 && E.sched.fixed === 2 && !E.next && W.navEra === 2 && !haloSolid && L1.ev.filter((x) => x[0] !== 'era:set').length === 0 && E.stats.flips === f0 && ring2 >= 150,
      { era: E?.era, sched: E?.sched, navEra: W?.navEra, events: L1.ev.length, flips: [f0, E?.stats.flips], ringArea_m2: ring2, homeArea_m2: nav ? Math.round(nav.area) : null });
    R('step 12 (for the record): a BossNav built in era 3 walls the circus off — the Halo\'s deck (5.0–5.4 m) stands inside BossNav\'s 5.2 m test over the ring — so Boss Battle must stay fixed in era 2 (a change of `fixed` fails here)',
      ring3 >= 0 && ring3 < 20 && ring2 - ring3 > 130, { ring_era2_m2: ring2, ring_era3_m2: ring3, home_era3_m2: Math.round(area3) });
  }

  // ------------------------------------------------------------------------------------------- practice
  if (parts.includes('practice')) {
    await start({ practice: true });
    calm();
    const m = g.match, E = m.eras, W = __G.eraWorld, L = __G.level, P = __G.paint;
    const own = m.actors.filter((a) => !a.remote);
    const kid = own.find((a) => a.isLocal) || own[0];
    const blk = (tag, side = -1) => L.blocks.find((b) => b.tag === tag && Math.sign(b.center.z) === side);
    const put = (a, x, y, z) => { a.pos.set(x, y, z); a.vel?.set(0, 0, 0); a.grounded = false; };
    const tAt = (t) => step(Math.max(0, t - E.S.clock.t));
    const rows = [];
    // the schedule: the stage clock to just before the 3000s' rewind (the jump at 180 s: 3 → 1)
    const cyc = E.sched.cycle;
    const jumpTo = (t) => { E.S.clock.t = t; E.seek(t, 'test'); step(0.1); };   // (Practice's stage clock runs on frame time)
    jumpTo(cyc * 3 - 14); tAt(cyc * 3 - 12);
    const era0 = E.era;
    // (1) the floating garden over the river (rescued), (2) the Halo (drops to the circus)
    for (const [label, tag] of [['garden', 'floating-garden'], ['halo', 'halo']]) {
      if (label === 'halo') { jumpTo(cyc * 6 - 14); tAt(cyc * 6 - 12); }   // (the next rewind: 360 s)
      const J = E._info(E.nextAt(E.S.clock.t));
      const b = blk(tag), top = b.center.y + b.half.y, F = J.at + W.groups[b.eraG].rg / W.speed;
      const r0 = E.stats.rescues, s0 = E.stats.eraShoves, d0 = kid.stats?.deaths ?? 0, sp0 = m.events.length;
      tAt(F - 0.4); calm(); put(kid, b.center.x, top + 0.05, b.center.z); step(0.25);
      const on = kid.pos.y > top - 0.25;
      tAt(F + 1.6);
      const gh = L.groundHeight(kid.pos.x, kid.pos.z, kid.pos.y + 0.5);
      rows.push({ label, jump: `${J.from}>${J.to}@${J.at}`, flipAt: +F.toFixed(2), on, alive: kid.alive, rescued: E.stats.rescues - r0, shoves: E.stats.eraShoves - s0, deaths: (kid.stats?.deaths ?? 0) - d0, splats: m.events.length - sp0,
        at: [+kid.pos.x.toFixed(1), +kid.pos.y.toFixed(2), +kid.pos.z.toFixed(1)], floor: +gh.toFixed(2), circus: Math.hypot(kid.pos.x, kid.pos.z) < 20 && Math.abs(kid.pos.y - gh) < 0.2 && gh > -0.2 && gh < 0.2 });
      tAt(J.at + W.doneOff + 1.2);
    }
    const [gd, ha] = rows;
    R('step 12: Practice rewinds 3 → 1 with the rescue — a kid on the floating garden over the river when it goes is moved to dry ground (a rescue, not a splat); a kid on the Halo drops 5.4 m to the circus and lands alive; nobody is shoved',
      era0 === 3 && E.sched.cycle === 60 && gd.on && gd.rescued === 1 && gd.alive && gd.deaths === 0 && gd.floor > -1 && ha.on && ha.rescued === 0 && ha.alive && ha.deaths === 0 && ha.circus && gd.shoves === 0 && ha.shoves === 0 && E.era === 1,
      { era0, rows, eraNow: E.era });
  }

  // ------------------------------------------------------------------------------------------- attract
  if (parts.includes('attract')) {
    dbg.unfreeze?.();
    g._startAttract();
    for (let i = 0; i < 100 && !(g.match?.attract && g.match.state === 'playing'); i++) await new Promise((r) => setTimeout(r, 100));
    dbg.freeze();
    const m = g.match, E = m.eras;
    const played = [], A = __G.audio, op = A?.play?.bind(A), ol = A?.loop?.bind(A);
    if (A) { A.play = (n, o) => { if (/^era_/.test(n)) played.push(n); return op(n, o); }; A.loop = (n, o) => { if (/^era_/.test(n)) played.push(n + ':loop'); return ol(n, o); }; }
    const calls = []; const sayOrig = E?._say?.bind(E);
    const L1 = evLog(), eras = [];
    if (E) for (let k = 0; k < 4; k++) { step(40); eras.push([+E.S.clock.t.toFixed(1), E.era]); }
    L1.off();
    if (A) { A.play = op; A.loop = ol; }
    const chipEls = document.querySelectorAll('.er-chip').length, callEls = document.querySelectorAll('.er-call').length;
    const dones = L1.ev.filter((x) => x[0] === 'era:done').map((x) => x[2]);
    R('step 12: the menu backdrop (attract: behind the menus and the lobby) cycles a jump every 40 s through the rewind — the city changes (2, 3, then back to 1) — with no HUD chip, no era callout and no era sound',
      !!E && m.attract && E.sched.cycle === 40 && dones.slice(0, 3).join('') === '231' && chipEls === 0 && callEls === 0 && !E.chip && played.length === 0 && E.stats.flips > 0,
      { sched: E?.sched, eras, dones, chipEls, callEls, played, flips: E?.stats.flips, shoves: E?.stats.eraShoves, bots: E?.botReport?.() });
    void calls; void sayOrig;
  }
  return out;
})()
