// Sprout pods page test (src/game/pods.js) on the test arena with pods (tools/botlab/page.cjs MAP=podbox):
//   MAP=podbox MODE=turf  PAGE=tools/botlab/tests/pods.js tools/botlab/run.sh tools/botlab/page.cjs   (everything but the modes)
//   MAP=podbox MODE=tower PAGE=…   (pods on the track sit it out; a pod beside the track waits while the tower's there)
//   MAP=podbox MODE=boss  PAGE=…   (a hedge stops the boss's charge like a wall; walking into one tramples it)
// Turf covers: the layout (colliders, looks, mirror twins); each team's meter (fills from ink in proportion, drains,
// the bulb swells and blushes toward the team ahead); the calibration per weapon kind (reported); growth (the first full
// meter wins, the owner, the host's record), the timing (grow → stand → wilt → recharge → dormant); hedges block
// movement and shots; the owner's tint (following a palette change); only the owner's ink sticks; the owner's squid
// swims up its inked wall and stands on its top in its ink, an enemy can stand there but its ink doesn't stick;
// carried down as it wilts; shoving (never inside it, never into a wall, never into the water); nav marking + replans;
// the follower replay (a simulated record, with the owner); bots growing cover in a scripted fight and climbing on top.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = __G.level, Ph = __G.physics, nav = __G.nav;
  const THREE = await import('three');
  const { PLAYER, SUB, TEAM_PALETTES } = await import('./src/config.js');
  const { PODS } = await import('./src/game/pods.js');
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const r3 = (v) => Math.round(v * 1000) / 1000;
  dbg.freeze();
  const P = m.pods;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { hooks.forEach((f) => f()); dbg.step(1000 / 60); } };
  const hooks = [];
  R('pods on this stage and mode (6 listed, mirrored: 12)', !!P && P.pods.length === 12, { n: P && P.pods.length, mode: m.mode });
  if (!P) return out;
  // a long clock (the stage clock follows duration − time)
  m.duration = 99999; m.time = m.duration - P.t;
  const now = () => P.t;
  const setClock = (t) => { m.time = m.duration - t; step(1 / 60); };
  const byId = (id) => P.pods.find((p) => p.id === id);
  // brains off: scripted intents (a function per actor, run every frame)
  const intents = new Map();
  for (const a of m.actors) if (a.bot) { a.bot._up0 = a.bot.update; a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; const f = intents.get(a); if (f) f(a, it); }; }
  const A = m.actors.filter((a) => a.team === 0), B = m.actors.filter((a) => a.team === 1);
  const home = (a, i) => { const pd = L.spawnPads[a.team]; a.pos.set(pd.x + (i % 4) - 1.5, pd.y + 0.1, pd.z); a.vel.set(0, 0, 0); a.grounded = false; };
  const homeAll = () => { m.actors.forEach(home); intents.clear(); };
  homeAll();
  step(0.3);
  const W = (p, lx, ly, lz) => new THREE.Vector3(p.x + lx * p.c + lz * p.s, p.y + ly, p.z - lx * p.s + lz * p.c);   // pod local → world
  const loc = (p, v) => [(v.x - p.x) * p.c - (v.z - p.z) * p.s, (v.x - p.x) * p.s + (v.z - p.z) * p.c];
  const place = (a, v, squid = false) => { a.pos.copy(v); a.vel.set(0, 0, 0); a.grounded = false; a.form = squid ? 'squid' : 'kid'; };
  const fill = (p, team, amt = 1.2) => { const c = new THREE.Vector3(p.x, p.y + p.def.bulbY + 0.2, p.z); for (let i = 0; i < 40 && p.meter[team] < amt && p.state === 'dormant'; i++) __G.paint.splat(c, 0.8, team); };
  // capture the host's records (a stand-in for the net session, only while needed)
  const recs = [];
  const netOn = () => { __G.netm = new Proxy({ mute: 0, applying: false, recPods: (e) => recs.push(e) }, { get: (o, k) => (k in o ? o[k] : () => {}) }); };
  const netOff = () => { __G.netm = null; };
  const MODE = m.mode;

  // ---- 1) the layout: the stage's planters (the engine adds none), the engine's bulbs, mirror twins
  const own = P.pods.map((p) => L.blocks.find((b) => !b.dynamic && b.hidden && Math.hypot(b.center.x - p.x, b.center.z - p.z) < 0.01));
  const stage = P.pods.map((p) => L.blocks.find((b) => !b.dynamic && !b.hidden && !b.paint && Math.hypot(b.center.x - p.x, b.center.z - p.z) < 0.01));
  const looks = g.podLooks;
  R('the planters are the stage\'s (static, uninked): the engine adds no collider and draws no planter', own.every((b) => !b) && stage.every((b) => b && b.solid) && looks.items.every((it) => !it.planter),
    { engineColliders: own.filter(Boolean).length, stagePlanters: stage.filter(Boolean).length });
  R('each pod has its bulb (built with the stage), anchored on its planter at bulbY', looks && looks.items.length === 12 && looks.items.every((it) => it.root.parent && it.bulb.children.length > 0 && Math.abs(it.pivot.position.y - it.def.bulbY) < 1e-6),
    { items: looks && looks.items.length, bulbY: P.pods[0].def.bulbY });
  let mir = true;
  for (let i = 0; i < 12; i += 2) {
    const a = P.pods[i], b = P.pods[i + 1];
    if (Math.abs(a.x + b.x) > 1e-6 || Math.abs(a.z + b.z) > 1e-6 || Math.abs(Math.cos(a.yaw) + Math.cos(b.yaw)) > 1e-6 || Math.abs(Math.sin(a.yaw) + Math.sin(b.yaw)) > 1e-6 || a.w !== b.w) mir = false;
  }
  R('mirror twins: every pod has its 180° twin (position, heading, size)', mir, P.pods.map((p) => [p.id, r3(p.x), r3(p.z), r3(p.yaw)]));

  if (MODE === 'turf') {
    // ---- 2) meters: each team's own, in proportion, draining; the bulb swells + blushes toward the team ahead
    const pm = byId('mid');
    const c = new THREE.Vector3(pm.x, pm.y + pm.def.bulbY + 0.2, pm.z);
    __G.paint.splat(c, 0.5, 0);
    const m1 = pm.meter[0];
    __G.paint.splat(c.clone().add(new THREE.Vector3(0.75, 0, 0)), 0.5, 0);     // (a splat that only grazes it: less)
    const m2 = pm.meter[0] - m1;
    __G.paint.splat(c.clone().add(new THREE.Vector3(3, 0, 0)), 0.5, 0);        // (one that misses: nothing)
    const m3 = pm.meter[0] - m1 - m2;
    __G.paint.splat(c, 0.5, 1);
    R('meters: each team fills its own, in proportion to how much of a splat lands (a direct one > a graze > a miss)', m1 > 0 && m2 > 0 && m2 < m1 && m3 === 0 && Math.abs(pm.meter[1] - m1) < 1e-9,
      { direct: r3(m1), graze: r3(m2), miss: m3, team1: r3(pm.meter[1]) });
    for (let i = 0; i < 4; i++) __G.paint.splat(c, 0.7, 0);
    step(0.1);
    const it = looks.items[pm.i], sc = it.pivot.scale.x, mat = it.mats.find((q) => q.emissive);
    const tc = __G.teamColors[0], dBlush = mat ? Math.hypot(mat.color.r - tc.r, mat.color.g - tc.g, mat.color.b - tc.b) : 9, d0 = mat ? Math.hypot(mat.userData.c0.r - tc.r, mat.userData.c0.g - tc.g, mat.userData.c0.b - tc.b) : 0;
    R('the bulb shows the meter: it swells, glows and blushes toward the team ahead', sc > 1.05 && mat && mat.emissive.r + mat.emissive.g + mat.emissive.b > 0.05 && dBlush < d0,
      { meter: pm.meter.map(r3), scale: r3(sc), glow: mat && r3(mat.emissive.r + mat.emissive.g + mat.emissive.b), blush: [r3(dBlush), r3(d0)] });
    const before = pm.meter[0];
    step(1.0);
    const hold = pm.meter[0];
    step(2.5);
    R('an unfilled meter drains slowly (after a pause)', Math.abs(hold - before) < 1e-6 && pm.meter[0] < before - 0.2 && pm.meter[0] > 0, { before: r3(before), after1s: r3(hold), after3_5s: r3(pm.meter[0]), rate: PODS.drain, delay: PODS.drainDelay });
    P.reset(); step(0.1);

    // ---- 3) calibration per weapon kind: a kid 4 m off (melee 2.4 m) aiming at the bulb
    const pc = byId('calib'), shooter = A.find((a) => !a.isLocal) || A[1];
    const cal = {};
    const aimAt = (a, v) => { const dx = v.x - a.pos.x, dz = v.z - a.pos.z, dy = v.y - (a.pos.y + 1.1); a.aimYaw = a.yaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(dy, Math.hypot(dx, dz)); a.aimPoint.copy(v); };
    const bulb = new THREE.Vector3(pc.x, pc.y + pc.def.bulbY + 0.15, pc.z);
    const setup = (id, dist) => {
      P.reset(); __G.projectiles.clear?.(); __G.subs.clear?.();
      shooter.setWeapon(id); shooter.ink = PLAYER.inkMax; shooter.hp = PLAYER.hp; shooter.special = 0;
      place(shooter, new THREE.Vector3(pc.x, 0.02, pc.z - pc.d / 2 - dist)); step(0.3);
    };
    // (what reaches the pod: every splat within 3 m of it — radius, how much of the catch it covered)
    const diag = [], onS = P.onSplat.bind(P);
    P.onSplat = (c0, r, tm, o) => { const dx = c0.x - pc.x, dz = c0.z - pc.z; if (dx * dx + dz * dz < 9) { const m0 = pc.meter[0]; onS(c0, r, tm, o); diag.push([r, pc.meter[0] - m0]); } else onS(c0, r, tm, o); };
    const KINDS = ['shooter', 'twins', 'brolly', 'blaster', 'spinner', 'charger', 'bow', 'roller', 'brush', 'blade', 'mitts', 'bucket'];
    const foot = new THREE.Vector3(pc.x, pc.y + 0.1, pc.z);   // (a flick is thrown at the planter's foot: a flat sheet)
    for (const id of KINDS) for (const dist of id === 'roller' ? [4.4, 5, 5.6] : id === 'shooter' ? [4, 4, 4] : [['brush', 'blade', 'mitts'].includes(id) ? 2.2 : 4]) {
      // (a roller flick is an arc: it's thrown from its own range, where the sheet comes down; the best of three)
      setup(id, dist);
      let t = 0, peak = 0, full = -1, fires = 0;
      const kind = id, one = ['charger', 'bow', 'spinner', 'roller'].includes(id);
      const fr = (f) => Math.floor(t * 60 + 1e-6) % f;
      intents.set(shooter, (a, i) => {
        aimAt(a, kind === 'roller' ? foot : bulb); a.ink = PLAYER.inkMax;
        if (kind === 'charger' || kind === 'bow') { i.fire = t < 1.1; }                        // one full charge, released
        else if (kind === 'spinner') { i.fire = t < 1.05; }                                    // one full spin
        else if (kind === 'roller') { i.fire = t > 0.1 && t < 0.2; }                           // one flick (a tap)
        else if (kind === 'brush' || kind === 'blade') { i.fire = fr(12) < 5; }                // swipes / quick cuts (taps)
        else if (kind === 'brolly') { i.fire = fr(30) < 3; }                                   // taps (held opens the canopy)
        else i.fire = true;
      });
      diag.length = 0;
      const off = on('weapon:fire', (e) => { if (e.actor === shooter) fires++; });
      for (let f = 0; f < 60 * 4 && full < 0; f++) { step(1 / 60); t += 1 / 60; peak = Math.max(peak, pc.meter[0]); if (pc.state !== 'dormant' || pc.meter[0] >= 1) { full = t; peak = 1; } }
      off();
      intents.delete(shooter);
      const res = one ? { oneAction: r3(peak), t: full >= 0 ? r3(full) : null } : full >= 0 ? { full: r3(full) } : { meter4s: r3(peak) };
      res.fires = fires; res.from = dist;
      if (id === 'shooter') { (cal.shooterRuns ||= []).push(res.full ?? 9); cal.shooter = { full: r3(cal.shooterRuns.reduce((q, x) => q + x, 0) / cal.shooterRuns.length), runs: cal.shooterRuns.map(r3), fires: res.fires, splats: res.splats }; }
      else if (!cal[id] || (res.oneAction ?? 0) > (cal[id].oneAction ?? 0)) cal[id] = res;
      res.splats = diag.length; res.r = diag.length ? r3(diag.reduce((q, x) => q + x[0], 0) / diag.length) : 0;
    }
    // one bomb landing 1 m from the bulb
    setup('shooter', 4);
    diag.length = 0;
    __G.projectiles.throwBomb(shooter);
    { const bb = __G.projectiles.bombs[__G.projectiles.bombs.length - 1]; bb.pos.set(pc.x + 1, 0.6, pc.z - 0.9); bb.vel.set(0.1, -0.5, 0.05); }
    let bm = 0; for (let f = 0; f < 150; f++) { step(1 / 60); bm = Math.max(bm, pc.state !== 'dormant' ? 1 : pc.meter[0]); }
    cal.bomb = { oneBomb: r3(bm), splats: diag.length, r: diag.map((x) => r3(x[0])) };
    P.onSplat = onS;
    delete cal.shooterRuns;
    const shootOk = cal.shooter.full >= 1.0 && cal.shooter.full <= 1.5;
    const oneOk = ['charger', 'roller'].every((k) => cal[k].oneAction >= 0.95) && cal.bomb.oneBomb >= 0.95;
    R('calibration: ~1–1.5 s of direct shooter fire, one charger shot, one roller flick or one bomb fills a meter', shootOk && oneOk, cal);
    P.reset(); homeAll(); step(0.2);

    // ---- 4) growth: the first team to fill it; the host's record; the timing
    const pg = byId('mid');
    // a bot routed straight across its footprint (replans when it grows)
    const walker = B.find((a) => !a.isLocal);
    const s1 = nav.nearest(W(pg, 0.3, 0, -3.2), 0.5), s2 = nav.nearest(W(pg, 0.3, 0, 3.2), 0.5);
    const p1 = nav.path(s1, s2, walker.team);
    const through = (path) => path ? path.filter((id) => nav.blocked && nav.blocked[id]).length : -1;
    walker.bot.path = p1 ? p1.slice() : null; walker.bot.pi = 1;
    fill(pg, 1, 0.6);
    netOn();
    fill(pg, 0, 1.2);
    step(1 / 60);
    const t0 = pg.t0;
    netOff();
    const rec = recs.find((e) => e[0] === 'g' && e[1] === pg.i);
    R('growth: the first team to fill its meter grows it — its hedge; the host records it (pod, team, time)', pg.owner === 0 && (pg.state === 'grow' || pg.state === 'stand') && pg.block.solid && rec && rec[2] === 0 && Math.abs(rec[3] - t0) < 1e-3 && pg.meter[1] === 0,
      { owner: pg.owner, state: pg.state, record: rec, other: pg.meter[1] });
    R('nav: a bot routed across it replans; routes then go round it; goals skip it', !!p1 && through(p1) > 0 && walker.bot.path === null && P.state().blocked > 0 && (() => { const q = nav.path(s1, s2, 1); return q && q.every((id) => !nav.blocked[id]); })() && !nav.blocked[nav.nearest(W(pg, 0, 0, 0), 1)],
      { crossedBefore: through(p1), replanned: walker.bot.path === null, marked: P.state().blocked });
    // the timing, sampled
    const T = P.T, samples = {};
    step(0.2); samples.grow = { st: pg.state, k: r3(pg.k), solid: pg.block.solid };
    step(0.4); samples.stand = { st: pg.state, k: r3(pg.k), h: r3(pg.block.half.y * 2) };
    const growOk = samples.grow.st === 'grow' && samples.grow.k > 0.39 && samples.grow.k < 1 && samples.stand.st === 'stand' && Math.abs(samples.stand.h - pg.h) < 1e-3;

    // ---- 5) standing: blocks movement and shots; the owner's tint; only the owner's ink; climb on; stand on top
    // a kid walking into its face stops at it
    const wk = B[1];
    place(wk, W(pg, 0.6, 0.02, pg.d / 2 + 1.6)); intents.set(wk, (a, i) => { const d = W(pg, 0, 0, -1).sub(W(pg, 0, 0, 0)); i.move.set(d.x, 0, d.z); });
    step(1.5); intents.delete(wk);
    const wl = loc(pg, wk.pos);
    const hitBlk = Ph.raycast(W(pg, 0.6, 1.0, -3), W(pg, 0, 0, 1).sub(W(pg, 0, 0, 0)), 6, undefined, true);
    R('a hedge blocks movement (a kid walking into it stops at its face) and shots / sight (a ray across it hits it)',
      wl[1] >= pg.d / 2 + PLAYER.radius - 0.06 && hitBlk.hit && hitBlk.block === pg.block.id && !Ph.los(W(pg, 0.6, 1.0, -3), W(pg, 0.6, 1.0, 3)),
      { kidLocalZ: r3(wl[1]), face: pg.d / 2, rayBlock: hitBlk.block, hedge: pg.block.id });
    // tint: the look in the owner's ink (built with tint; the blossoms' vertex colours in it), a sheen on its leaves; a
    // palette change rebuilds it
    const cd = (x, col) => Math.hypot(x.r - col.r, x.g - col.g, x.b - col.b);
    const tintOf = () => {
      const h = pg.look, look = h && h.team[pg.owner];
      let bloomC = null;
      look && look.traverse((q) => { if (q.isMesh && h.mats[pg.owner].some((x) => x.kind === 'bloom' && x.m === q.material)) { const C = q.geometry.attributes.color; let r = 0, gg = 0, b = 0; for (let k = 0; k < C.count; k++) { r += C.getX(k); gg += C.getY(k); b += C.getZ(k); } bloomC = new THREE.Color(r / C.count, gg / C.count, b / C.count); } });
      const lf = h && h.mats[pg.owner].find((x) => x.kind === 'leaf');
      return { h, look, tint: look && look.userData.tint, bloomC, sheen: lf ? lf.m.emissive.r + lf.m.emissive.g + lf.m.emissive.b : 0, shown: !!(look && look.visible && h.root.visible && !h.team[1 - pg.owner].visible) };
    };
    const t1 = tintOf(), tA = __G.teamColors[0];
    const pal0 = g.palette, pal1 = TEAM_PALETTES.find((q) => q.a !== pal0.a) || TEAM_PALETTES[0];
    g._setPalette(pal1); step(1 / 60);
    const t2 = tintOf();
    g._setPalette(pal0); step(1 / 60);
    R('the hedge wears its grower\'s ink (a look built with tint: blossoms in it; a sheen on its leaves), rebuilt when the palette changes',
      t1.shown && t1.tint === tA.getHexString() && t1.bloomC && cd(t1.bloomC, tA) < 0.3 && t1.sheen > 0 && t2.tint === pal1.a.replace('#', '').toLowerCase() && t2.h !== t1.h && tintOf().shown,
      { tint: t1.tint, team: tA.getHexString(), bloom: t1.bloomC && t1.bloomC.getHexString(), sheen: r3(t1.sheen), afterPalette: t2.tint, newTeam: pal1.a, rebuilt: t2.h !== t1.h });
    // ink: the owner's sticks, the other team's doesn't (their shots still hit it)
    const wallP = W(pg, -0.6, 0.9, -pg.d / 2 - 0.15), nrm = W(pg, 0, 0, -1).sub(W(pg, 0, 0, 0));
    const n0 = pg.paint.n;
    __G.paint.splat(wallP, 0.45, 1);
    const enemyInk = pg.paint.wallTeam(W(pg, -0.6, 0.9, -pg.d / 2), nrm), nE = pg.paint.n - n0;
    __G.paint.splat(wallP, 0.45, 0);
    const ownInk = pg.paint.wallTeam(W(pg, -0.6, 0.9, -pg.d / 2), nrm);
    // a real enemy shot at it: it stops there, and leaves no ink on it
    const shot = B[2]; shot.setWeapon('shooter'); place(shot, W(pg, -0.6, 0.02, -pg.d / 2 - 4)); step(0.3);
    const n1 = pg.paint.n;
    intents.set(shot, (a, i) => { const v = W(pg, -0.6, 1.2, 0); const dx = v.x - a.pos.x, dz = v.z - a.pos.z; a.aimYaw = a.yaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(v.y - a.pos.y - 1.1, Math.hypot(dx, dz)); a.aimPoint.copy(v); a.ink = PLAYER.inkMax; i.fire = true; });
    step(0.6); intents.delete(shot); step(0.3);
    const behind = __G.paint.regionStats ? __G.paint.regionStats(pg.x - 0.6 * pg.c + 1.5 * pg.s, 0, pg.z + 0.6 * pg.s + 1.5 * pg.c, 0.6, 1, { own: 0, enemy: 0, empty: 0, n: 0 }) : null;
    R('only the grower\'s ink sticks to it: the other team\'s splats (and real shots, stopped at it) leave none', enemyInk === 0 && nE === 0 && ownInk === 1 && pg.paint.n === n1,
      { enemyInk, enemyPainted: nE, ownInk, shotPainted: pg.paint.n - n1, behindOwnShare: behind && r3(behind.own) });
    home(shot, 0);
    // climb: the owner's squid swims up an inked column and stands on the top; the top in its ink is its ground
    const cl = A[1];
    for (let y = 0.2; y < pg.h; y += 0.3) __G.paint.splat(W(pg, 0.2, y, -pg.d / 2 - 0.12), 0.4, 0);
    place(cl, W(pg, 0.2, 0.02, -pg.d / 2 - 0.75), true);
    const into = W(pg, 0, 0, 1).sub(W(pg, 0, 0, 0));
    intents.set(cl, (a, i) => { i.squid = true; if (a.pos.y < pg.y + pg.h - 0.25 || a.climbing) i.move.set(into.x, 0, into.z); });
    let climbed = false, maxY = 0;
    for (let f = 0; f < 150; f++) { step(1 / 60); climbed = climbed || cl.climbing; maxY = Math.max(maxY, cl.pos.y); }
    intents.set(cl, (a, i) => { i.squid = true; });
    step(0.5);
    const onTop = cl.grounded && cl.ground.block === pg.block.id && Math.abs(cl.pos.y - pg.top) < 0.15;
    for (const lx of [-0.9, -0.3, 0.3, 0.9]) __G.paint.splat(W(pg, lx, pg.h + 0.1, 0), 0.5, 0);
    step(0.3);
    R('the grower\'s squid swims up its inked wall onto the top (1.8 m: higher than a jump) — and its ink there is ground to swim in', climbed && onTop && cl.groundTeam === 1 && !cl.roofT,
      { climbed, maxY: r3(maxY), onTop, groundTeam: cl.groundTeam, dy: r3(cl.pos.y - pg.top), sliding: !!cl.roofT });
    // an enemy up there (a hop from higher ground, a super jump) can stand; its ink doesn't stick
    const en = B[3];
    place(en, W(pg, -1.0, pg.h + 0.05, 0)); step(0.8);
    const enOn = en.grounded && en.ground.block === pg.block.id && !en.roofT;
    const gt0 = pg.paint.groundTeam(W(pg, -1.0, pg.h, 0));
    __G.paint.splat(W(pg, -1.0, pg.h + 0.1, 0), 0.5, 1);
    const gt1 = pg.paint.groundTeam(W(pg, -1.0, pg.h, 0));
    R('an enemy on the top can stand there (no slide-off), but its ink doesn\'t stick', enOn && gt1 === gt0 && en.groundTeam !== 1, { standing: enOn, before: gt0, after: gt1, enemyGround: en.groundTeam });
    home(en, 3);
    // ---- 6) carried down as it wilts (a kid near its end, off the planter)
    intents.set(cl, null);
    place(cl, W(pg, 1.1, pg.h + 0.05, 0)); step(0.4);
    const wiltAt = pg.wiltAt;
    setClock(wiltAt - 0.3);
    samples.late = { st: pg.state, solid: pg.block.solid, t: r3(now() - t0) };
    let worst = 0, inWall = 0, frames = 0, onBlock = 0, minY = 99;
    for (let f = 0; f < 90; f++) {
      step(1 / 60); frames++;
      if (cl.grounded && cl.ground.block === pg.block.id) { onBlock++; worst = Math.max(worst, Math.abs(cl.pos.y - pg.top)); }
      if (!Ph.bodyFits(cl.pos, PLAYER.radius - 0.08, PLAYER.stepUp + 0.05, PLAYER.height * 0.8)) inWall++;
      minY = Math.min(minY, cl.pos.y);
      if (f === 45) samples.wilt = { st: pg.state, k: r3(pg.k) };
    }
    step(0.6);
    R('whoever stands on a wilting hedge is lowered with it (never dropped through, never pushed into anything)', onBlock > 20 && worst < 0.12 && inWall === 0 && minY > -0.05 && Math.abs(cl.pos.y) < 0.1,
      { framesOnIt: onBlock, worstGap: r3(worst), inWall, minY: r3(minY), endY: r3(cl.pos.y), carried: P.stats.carried });
    samples.recharge = { st: pg.state, solid: pg.block.solid, visible: !!(pg.look && pg.look.visible), ink: pg.paint.n, bulbShown: looks.items[pg.i].pivot.visible };
    setClock(wiltAt + T.wilt + T.recharge + 0.2);
    samples.dormant = { st: pg.state, owner: pg.owner, bulb: r3(looks.items[pg.i].pivot.scale.x) };
    R('timing: grows in ' + T.grow + ' s, stands ' + T.last + ' s, wilts ' + T.wilt + ' s, recharges ' + T.recharge + ' s, then dormant again (its ink gone)',
      growOk && samples.late.st === 'stand' && samples.late.solid && samples.wilt.st === 'wilt' && samples.wilt.k < 0.9 && samples.recharge.st === 'recharge' && !samples.recharge.solid && !samples.recharge.visible && samples.recharge.ink === 0 && samples.recharge.bulbShown && samples.dormant.st === 'dormant' && samples.dormant.owner === -1,
      samples);
    homeAll(); step(0.2);

    // ---- 7) shoving: a kid + a squid where it grows; a kid between it and a wall; a kid on the water side
    const ps = byId('mid~'), pw = byId('wall'), pe = byId('edge');
    const k1 = A[1], k2 = A[2], k3 = B[1], k4 = B[2];
    place(k1, W(ps, 0.8, 0.02, 0.1)); place(k2, W(ps, -1.0, 0.02, -0.2), true); intents.set(k2, (a, i) => { i.squid = true; });
    place(k3, new THREE.Vector3(13.45, 0.02, 0.95));    // (inside 'wall''s footprint, on the wall side: no room there)
    place(k4, new THREE.Vector3(27.72, 0.02, 12.7));    // (inside 'edge''s footprint, on the water side)
    step(0.3);
    const watch = [k1, k2, k3, k4], stat = { inside: 0, inWall: 0, wet: 0 }, chest = new THREE.Vector3();
    for (const p of [ps, pw, pe]) fill(p, p === pw ? 1 : 0);
    for (let f = 0; f < 60; f++) {
      step(1 / 60);
      for (const a of watch) {
        for (const p of [ps, pw, pe]) { chest.set(a.pos.x, a.pos.y + 0.4, a.pos.z); if (p.block.solid && L.pointInBlock(p.block, chest, -0.06)) stat.inside++; }
        if (!Ph.bodyFits(a.pos, PLAYER.radius - 0.08, PLAYER.stepUp + 0.05, PLAYER.height * 0.8, a.form === 'squid')) {
          let dyn = false; for (const p of [ps, pw, pe]) { chest.set(a.pos.x, a.pos.y + 0.8, a.pos.z); if (L.pointInBlock(p.block, chest, PLAYER.radius)) dyn = true; }
          if (!dyn) stat.inWall++;
        }
        if (a.pos.y < -0.5) stat.wet++;
      }
    }
    intents.delete(k2);
    const out3 = loc(pw, k3.pos), out4 = [k4.pos.x, k4.pos.z];
    R('shoving: kids and squids where it grows are pushed out of it — never inside it, never into a wall (the kid by the wall goes out the far side), never into the water',
      ps.state !== 'dormant' && pw.state !== 'dormant' && pe.state !== 'dormant' && stat.inside === 0 && stat.inWall === 0 && stat.wet === 0 && k3.pos.x + PLAYER.radius < 14.01
      && (Math.abs(out3[0]) > pw.w / 2 + PLAYER.radius - 0.05 || Math.abs(out3[1]) > pw.d / 2 + PLAYER.radius - 0.05) && k4.pos.x < 28 && k4.pos.y > -0.1,
      { ...stat, states: [ps.state, pw.state, pe.state], k1: loc(ps, k1.pos).map(r3), k2: loc(ps, k2.pos).map(r3), k3: [r3(k3.pos.x), r3(k3.pos.z), r3(out3[1])], k4: out4.map(r3), shoved: P.stats.shoved });
    // a pod that can't shove someone waits (meter full) — a kid wedged between the planter and a crate-like wall … (the
    // podbox has none that tight: covered by the rule's unit, _escapes, above)
    P.reset(); homeAll(); step(0.2);

    // ---- 8) the follower: replays the host's record (with the owner); never grows from its own meters
    const pf = byId('calib~'), pf2 = byId('calib');
    m.follower = true;
    const tg = now() - 0.1;
    P.netEvent(['g', pf.i, 1, +tg.toFixed(3)]);
    const fs0 = { st: pf.state, owner: pf.owner, solid: pf.block.solid };
    step(0.6);
    const fs1 = { st: pf.state, k: r3(pf.k), t0: r3(pf.t0) };
    fill(pf2, 0, 1.2); step(0.3);
    const noGrow = pf2.state === 'dormant';
    const q = new Array(24).fill(0); q[pf2.i * 2 + 1] = 40;
    P.netEvent(['m', ...q]);
    const snap = r3(pf2.meter[1]);
    m.follower = false;
    step(1 / 60);
    const fl = pf.look && pf.look.team[1];
    R('follower: a simulated grow record replays (the owner\'s hedge, its pose from the grow time); its own meters never grow a pod; the meters\' snapshot applies',
      fs0.owner === 1 && fs0.solid && fs1.st === 'stand' && Math.abs(fs1.t0 - tg) < 1e-3 && noGrow && Math.abs(snap - 0.4) < 1e-3 && fl && fl.visible && fl.userData.tint === __G.teamColors[1].getHexString(),
      { atRecord: fs0, after06: fs1, ownMeterGrew: !noGrow, snapshot: snap });
    P.reset(); homeAll(); step(0.2);

    // ---- 9) bots: a scripted fight across 'mid' — the Alpha bot grows cover from it, then climbs its hedge
    const pb = byId('mid'), bot = A.find((a) => !a.isLocal), foe = B.find((a) => !a.isLocal);
    bot.setWeapon('shooter'); bot.bot.setDifficulty?.('normal');
    // (the fight's line passes 1.3 m off the bulb: across the hedge-to-be, but its shots at the foe miss the pod)
    place(bot, W(pb, 1.3, 0.02, -6)); bot.yaw = bot.aimYaw = Math.atan2(0, 1); bot.bot.aimYaw = bot.yaw;
    place(foe, W(pb, 1.3, 0.02, 7));
    intents.set(foe, (a) => { a.hp = PLAYER.hp; a.invuln = 1; });
    bot.bot.update = bot.bot._up0; bot.bot.reset();
    hooks.push(() => { bot.special = 0; bot.hp = Math.max(bot.hp, PLAYER.hp * 0.9); });
    const log = [];
    let grewBy = -1, grewT = -1, topT = -1, tasks = new Set();
    for (let f = 0; f < 60 * 22 && topT < 0; f++) {
      step(1 / 60);
      const S = bot.bot.podS;
      if (S && S.task) tasks.add(S.task);
      if (grewT < 0 && pb.state !== 'dormant') { grewT = f / 60; grewBy = pb.owner; }
      if (grewT >= 0 && P.hedgeUnder(bot) === pb) topT = f / 60;
      if (f % 60 === 0) log.push([f / 60, S && S.task, r3(pb.meter[0]), pb.state, r3(bot.pos.x), r3(bot.pos.y), r3(bot.pos.z)]);
    }
    R('bots: in a fight, a bot inks the pod between it and its foe to grow cover (its team\'s hedge)', grewT >= 0 && grewBy === 0 && tasks.has('grow'), { grewAt: grewT, by: grewBy, tasks: [...tasks] });
    R('bots: …then inks a column of its own hedge, swims up and fights from the top', topT >= 0 && (tasks.has('climb') || tasks.has('top')), { topAt: topT, tasks: [...tasks], log });
    hooks.length = 0; bot.bot.update = () => {};
  }

  // ---- Tower Command: pods on the track sit it out; one beside it waits (meter full) while the tower's there
  if (MODE === 'tower') {
    const T = m.tower;
    const on = ['ontrack', 'ontrack~'].map(byId), by = byId('track');
    R('Tower Command: pods whose hedge would stand on the track (the platform\'s sweep + headroom) sit the mode out; the others play', on.every((p) => p.off === 'track') && P.pods.filter((p) => p.off).length === 2,
      P.pods.map((p) => [p.id, p.off || 'on']));
    // the tower beside it (s along Alpha's side: 8 m to the corner, then up the x = -8 line)
    T.s = 8 + by.z; T._place(); step(1 / 60);
    fill(by, 0);
    step(0.5);
    const held = { st: by.state, meter: r3(by.meter[0]), held: by.held, towerAt: [r3(T.pos.x), r3(T.pos.z)] };
    T.s = 0; T._place(); step(0.3);
    R('Tower Command: a full pod never grows into the tower (footprint + margin): it waits, meter full, and grows once the tower has gone',
      held.st === 'dormant' && held.meter >= 1 && held.held === 'tower' && by.state !== 'dormant' && by.owner === 0, { whileThere: held, after: by.state });
  }

  // ---- Boss Battle: a hedge stops the charge like a wall; walking into one tramples it
  if (MODE === 'boss') {
    const Bs = __G.boss, nv = Bs && Bs.nav, pb = byId('mid');
    const before = nv && nv.cast(pb.x, pb.z - 18, 0, 34);
    fill(pb, 0); step(0.8);
    const after = nv && nv.cast(pb.x, pb.z - 18, 0, 34);
    R('Boss Battle: a grown hedge stops HULLBREAKER\'s charge like a wall', !!nv && !!nv.dynWall && pb.state === 'stand' && after.dist < before.dist - 3 && after.wall,
      { before: before && { d: before.dist, wall: before.wall }, after: after && { d: after.dist, wall: after.wall } });
    // walking (not charging) into one: trampled (it wilts)
    const bm = Bs.move; Bs.move = null;
    const bp = Bs.pos.clone(), by0 = Bs.yaw;
    Bs.pos.set(pb.x, Bs.pos.y, pb.z - 3.2); Bs.yaw = 0;
    P.bossStep();
    const tr = pb.wiltAt <= now() + 1e-3;
    Bs.pos.copy(bp); Bs.yaw = by0; Bs.move = bm;
    step(1.2);
    R('Boss Battle: HULLBREAKER walking into a hedge tramples it (it wilts)', tr && (pb.state === 'wilt' || pb.state === 'recharge'), { trampled: tr, state: pb.state, stat: P.stats.trampled });
  }
  R('state() snapshot', !!P.state(), P.state());
  return out;
})()
