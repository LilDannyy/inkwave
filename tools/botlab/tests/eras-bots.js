// Bluestone Junction's era engine — bots (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §4.3, §6 step 10; H16, H16b),
// on the stage itself, with the bots' own brains running:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-bots.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGE_ARGS='only=rewind,live')
// rewind  the danger layer from the warning to done: four bots that want the Halo (their paint goals all on it) stand on it
//         when Practice's rewind 3 → 1 is warned; at the Halo's flip none of them is on it — and in a control run with the
//         layer off (E.noDanger) they are, which is what the layer is for
// prepos  H16b, the pre-position: a bot at the mouth of Degrayling Lane bound for the quay just before jump 1 waits 3–6 m
//         short of the crates (outside the danger box, never inside them before their flip) and goes through the lane at
//         their flip; with E.noPrepos it goes round by the GPO terrace's hop; at J − 8 (9 s of waiting to save 4 m) it
//         does not wait (the rule: through the gate no slower than the detour, give or take a 1.5 s rush allowance)
// replan  at done, a bot whose route runs over a piece that went (the Halo, in the rewind) plans again; one whose route is
//         all on ground that stays keeps it
// live    a live 1:30 Turf War through both jumps (30 and 60 s), every bot thinking: no era shove, nobody on a vanishing
//         top or inside an appearing piece at its flip, ~0 bot-seconds inside an appearing piece's box before its flip, no
//         splat a jump could have caused (the sea, a fall), stuck time as the botlab counts it, every bot's time to the
//         3000s' new ground after done (median ≤ 20 s), bot-seconds on the Halo in the 3000s (the perch)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const parts = (/only=([\w,]+)/.exec(String(window.__pageArgs || ''))?.[1] || 'rewind,prepos,replan,live').split(',');
  const dbg = g.debug;
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let E = g.match.eras, W = __G.eraWorld, L = __G.level;
  if (!W || !E) { R('the era engine runs on bluestone', false); return out; }
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));
  const put = (a, x, y, z) => { a.pos.set(x, y, z); a.vel?.set(0, 0, 0); a.grounded = false; };
  const bots = () => g.match.actors.filter((a) => a.bot && !a.remote);
  const freeze = (a) => { a.bot._upd0 = a.bot._upd0 || a.bot.update; a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } };
  const wake = (a) => { if (a.bot._upd0) { a.bot.update = a.bot._upd0; a.bot._upd0 = null; } };
  const pad = (t) => L.spawnPads[t];
  const nav = () => __G.nav;
  const haloNodes = () => { const N = nav(); return N.nodes.filter((n) => N.eraValid[2][n.id] && !N.eraValid[1][n.id] && n.y > 5 && Math.hypot(n.x, n.z) > 11 && Math.hypot(n.x, n.z) < 14.7).map((n) => n.id); };
  const onHalo = (a) => a.alive && a.pos.y > 5.2 && Math.hypot(a.pos.x, a.pos.z) > 10.9 && Math.hypot(a.pos.x, a.pos.z) < 14.8;

  // ------------------------------------------------------------------------------------------- rewind (the danger layer)
  if (parts.includes('rewind')) {
    const run = async (noDanger) => {
      E.debugJump(3, { instant: true }); step(0.2);
      const team0 = bots().filter((a) => a.team === 0).slice(0, 4), others = bots().filter((a) => !team0.includes(a));
      for (const a of others) { freeze(a); put(a, pad(a.team).x, pad(a.team).y + 0.1, pad(a.team).z); }
      const H = haloNodes(), Nn = nav().nodes;
      // bots that love the Halo: every paint goal they pick is a Halo node (the layer must win over that)
      team0.forEach((a, i) => {
        const b = a.bot; wake(a);
        b._pick0 = b._pick0 || b._pickPaintGoal;
        b._pickPaintGoal = function () { const n = Nn[H[(Math.random() * H.length) | 0]]; this.goalTimer = 6; this._pathTo(new THREE.Vector3(n.x, n.y, n.z), 0.3); };
        const n = Nn[H[Math.floor((i + 0.5) * H.length / 4)]];
        put(a, n.x, n.y + 0.05, n.z); a.ink = 100; b.path = null; b.goalTimer = 0; b.target = null;
      });
      step(1.0);
      const before = team0.map(onHalo);
      E.noDanger = noDanger;
      const J = E.debugJump(1, { inS: 10.2 });
      const halo = L.blocks.find((b) => b.tag === 'halo' && b.center.z < 0), F = J.at + W.groups[halo.eraG].rg / W.speed;
      tAt(F - 1 / 60);
      const atFlip = team0.map(onHalo), s0 = E.stats.bots.onVanish;
      tAt(F + 0.2);
      const counted = E.stats.bots.onVanish - s0;
      tAt(J.doneAt + 0.3);
      E.noDanger = false;
      for (const a of team0) { a.bot._pickPaintGoal = a.bot._pick0; }
      for (const a of others) wake(a);
      return { before, atFlip, onAtFlip: atFlip.filter(Boolean).length, counted, alive: team0.map((a) => a.alive) };
    };
    const on = await run(false), off = await run(true);
    R('step 10: the danger layer — four bots whose every paint goal is on the Halo stand on it when the rewind 3 → 1 is warned; at the Halo\'s flip none of them is on it (they left in the 10 s warning); with the layer off (the control run) they are still there',
      on.before.filter(Boolean).length >= 3 && on.onAtFlip === 0 && on.counted === 0 && off.before.filter(Boolean).length >= 3 && off.onAtFlip >= 2,
      { withLayer: on, controlNoLayer: off });
  }

  // ------------------------------------------------------------------------------------------- prepos (H16b)
  if (parts.includes('prepos')) {
    // a bot at the west mouth of Degrayling Lane, bound for the quay on its far side, 0.7 s before jump 1: the lane opens
    // at the crates' flip (J + 1.15); through it is ~10 m, round by the GPO terrace's hop ~14 m — waiting is no more than
    // the rush allowance slower, so it waits (and at J − 8 it would not have: 9 s of waiting for 4 m)
    const run = (noPrepos, inS) => {
      E.debugJump(1, { instant: true }); step(0.2);
      const all = bots(), me = all.find((a) => a.team === 0);
      for (const a of all) if (a !== me) { freeze(a); put(a, pad(a.team).x, pad(a.team).y + 0.1, pad(a.team).z); }
      wake(me);
      const b = me.bot, goalP = new THREE.Vector3(-8.0, 0, -24.6);
      b._pick0 = b._pick0 || b._pickPaintGoal;
      b._pickPaintGoal = function () { this.goalTimer = 30; this._pathTo(goalP, 0.4); };
      put(me, -18.6, 0.05, -26.0); me.ink = 100; b.path = null; b.goalTimer = 0; b.target = null; b.mode = 'paint'; b._eraHold = null;
      step(1 / 60);
      E.noPrepos = noPrepos;
      const pp0 = E.stats.bots.prepos;
      const J = E.debugJump(2, { inS });
      const crate = L.blocks.find((x) => x.tag === 'crates-stack' && x.center.z < 0), F = J.at + W.groups[crate.eraG].rg / W.speed;
      const box = (p) => p.x > crate.aabbMin.x - 0.6 && p.x < crate.aabbMax.x + 0.6 && p.z > crate.aabbMin.z - 0.6 && p.z < crate.aabbMax.z + 0.6;
      const tr = []; let inBox = 0, held = null, arrive = null, inLaneAt = null, hold = null;
      while (E.S.clock.t < J.doneAt + 6) {
        step(1 / 15);
        const p = me.pos, t = +(E.S.clock.t - J.at).toFixed(2);
        if (b._eraHold) hold = b._eraHold;
        if (E.S.clock.t < F && box(p)) inBox++;
        if (b._eraHold?.held && !held) held = { t, at: [+p.x.toFixed(1), +p.z.toFixed(1)], dCrates: +(crate.aabbMin.x - p.x).toFixed(1) };
        if (inLaneAt === null && E.S.clock.t >= F && box(p)) inLaneAt = t;
        if (!arrive && Math.hypot(p.x - goalP.x, p.z - goalP.z) < 1.6) arrive = t;
        if (tr.length < 400) tr.push([t, +p.x.toFixed(1), +p.z.toFixed(1)]);
      }
      E.noPrepos = false; b._pickPaintGoal = b._pick0;
      for (const a of all) wake(a);
      return { inS, prepos: E.stats.bots.prepos - pp0, held, hold: hold && { tGate: hold.tGate, tDetour: hold.tDetour, until: +(hold.until - J.at).toFixed(2), heldS: +(hold.held || 0).toFixed(2) }, inBoxBeforeFlip: inBox, throughLaneAt: inLaneAt, arriveAfterJ: arrive, flipAfterJ: +(F - J.at).toFixed(2), trace: tr.filter((_, i) => i % 8 === 0).slice(0, 24) };
    };
    const on = run(false, 0.7), off = run(true, 0.7), early = run(false, 8.1);
    R('step 10 (H16b): pre-position — a bot at the mouth of Degrayling Lane bound for the quay, just before jump 1: it waits 3–6 m short of the crates (never in their danger box before their flip) and goes through the lane once they flip; with the pre-position off it goes round by the GPO terrace; at J − 8 (9 s to wait for 4 m) it does not wait',
      on.prepos === 1 && on.held && on.held.dCrates >= 2 && on.held.dCrates <= 7 && on.inBoxBeforeFlip === 0 && on.throughLaneAt !== null && on.throughLaneAt > on.flipAfterJ && on.arriveAfterJ !== null
        && off.prepos === 0 && !off.held && off.throughLaneAt === null && off.arriveAfterJ !== null && early.prepos === 0 && !early.held,
      { withPrepos: on, control: off, atJminus8: { ...early, trace: early.trace.slice(0, 6) }, doneOff: +W.doneOff.toFixed(2) });
  }

  // ------------------------------------------------------------------------------------------- replan
  if (parts.includes('replan')) {
    E.debugJump(3, { instant: true }); step(0.2);
    const all = bots(), [a1, a2] = all.filter((a) => a.team === 0);
    for (const a of all) freeze(a);
    const N = nav(), H = haloNodes(), U = N.nodes;
    // a route over the Halo (from its 270° side to its 90° side) and one on the street that stays
    const hA = H.reduce((b, id) => (U[id].x < U[b].x ? id : b), H[0]), hB = H.reduce((b, id) => (U[id].x > U[b].x ? id : b), H[0]);
    const pHalo = N.path(hA, hB, 0), s1 = N.nearest(new THREE.Vector3(-20, 0, -40), 1, true), s2 = N.nearest(new THREE.Vector3(-20, 0, -30), 1, true), pStreet = N.path(s1, s2, 0);
    const J = E.debugJump(1, { inS: 0 });
    tAt(J.doneAt - 0.1);
    for (const a of all) a.bot.path = null;
    a1.bot.path = pHalo; a1.bot.pi = 1; a2.bot.path = pStreet; a2.bot.pi = 1;
    const r0 = E.stats.bots.replans;
    tAt(J.doneAt + 0.05);
    const gone = (p) => { for (let i = 1; i < p.length; i++) if (!N.edge(p[i - 1], p[i])) return true; return false; };
    R('step 10: at done a bot whose route runs over a piece that went (the Halo, in the rewind) plans again; one whose route is all on ground that stays keeps it',
      !!pHalo && !!pStreet && gone(pHalo) && !gone(pStreet) && a1.bot.path === null && a2.bot.path === pStreet && E.stats.bots.replans - r0 === 1,
      { halo: pHalo?.length, street: pStreet?.length, replans: E.stats.bots.replans - r0 });
    tAt(J.doneAt + 1.2);
    for (const a of all) wake(a);
  }

  // ------------------------------------------------------------------------------------------- live
  if (parts.includes('live')) {
    dbg.unfreeze?.();
    await g.api.startMatch({ mapId: 'bluestone', mode: 'turf', duration: 90 });
    for (let i = 0; i < 400 && g.match?.state !== 'playing'; i++) await new Promise((r) => setTimeout(r, 100));
    dbg.freeze();
    E = g.match.eras; W = __G.eraWorld; L = __G.level;
    const m = g.match, hist = new Map();
    let samples = 0, stuckS = 0, haloS = 0, haloBots = new Set(), simT = 0;
    const t0 = performance.now();
    while (m.state === 'playing' && simT < 92) {
      step(0.25); simT += 0.25;
      for (const a of m.actors) {
        if (!a.bot) continue;
        const h = hist.get(a) || []; hist.set(a, h);
        h.push({ t: simT, x: a.pos.x, z: a.pos.z }); while (h.length && simT - h[0].t > 3) h.shift();
        const holding = !!((a.bot.zHoldUntil > a.bot.t && (!a.bot.path || a.bot.pi >= a.bot.path.length)) || a.bot.perchUntil > a.bot.t);
        const wants = a.alive && !a.superJumpState && !(a.weaponRunner && a.weaponRunner.charging) && !holding;
        samples++;
        const span = h.length > 1 ? Math.max(...h.map((p) => Math.hypot(p.x - a.pos.x, p.z - a.pos.z))) : 99;
        if (wants && h.length >= 11 && span < 1.0) stuckS += 0.25;
        if (E.era === 3 && onHalo(a)) { haloS += 0.25; haloBots.add(a.name); }
      }
    }
    const rep = E.botReport(), v3 = rep.visits.find((v) => v.jump === '2>3'), v2 = rep.visits.find((v) => v.jump === '1>2');
    const stuckPct = +(100 * stuckS / Math.max(1, samples * 0.25)).toFixed(2);
    R('step 10: a live 1:30 Turf War through both jumps, every bot thinking — no era shove, no bot on a vanishing top or inside an appearing piece at its flip, ≤ 1 bot-second inside an appearing piece\'s box before its flip, no splat a jump could have caused',
      rep.flips >= 50 && rep.eraShoves === 0 && rep.onVanishWho.filter((x) => x.bot).length === 0 && rep.inAppear === 0 && rep.loiterS <= 1 && rep.envSplats === 0,
      { simT, wallS: Math.round((performance.now() - t0) / 1000), ...rep, visits: undefined });
    R('step 10: after the 3000s arrive every bot finds the new ground — median time from done to first standing on a node new in era 3 ≤ 20 s (fresh nodes weigh ×2 as paint goals for 30 s); bots stand on the Halo in the 3000s (its perch)',
      !!v3 && v3.median !== null && v3.median <= 20 && v3.visited >= Math.ceil(v3.bots * 0.75) && haloS > 0,
      { era3: v3, era2: v2, haloBotSeconds: haloS, haloBots: [...haloBots], stuckPct, result: __G.paint.coverage().map((c) => +(c * 100).toFixed(1)) });
  }
  return out;
})()
