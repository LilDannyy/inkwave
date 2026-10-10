// The lava engine on Highmark Foundry (src/game/lava.js, src/game/lavaCore.js, src/fx/lavaFx.js; the contract:
// tools/botlab/jobs/batch5/stages/caldera/ENGINE.md, the rules: DESIGN.md §3–4):
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
// Fails without the module (the first check: no G.lavaWorld / match.lava). Sections:
//   A the schedule per mode, the level, the warning, the ease, lavaMax         B touching lava splats (the sea's rule)
//   C a whole rise and fall, frame by frame: the stones (solid exactly while the shelf is deadly), the Organs (linear,
//     one hop apart, the lookout's bottom under the surface), riders carrying players, floors gone, events, sounds
//   D ink: the burn, nothing under the surface, the waterline, retired cells, turf, the Organ decks
//   E devices, noPlace, shots, liquidY, super-jump landings   F the nav graph and its windows, restMask, bots escaping
//   G the HUD chip, callouts, the personal line, the gauge, the minimap, the splat card, the level shader
//   H modes: Zone Control's overtime hold, Boss Battle held LOW (riders before BossNav), Practice / menu loops
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const { on } = await import('./src/core/ctx.js');
  const W = __G.lavaWorld, L0 = g.match?.lava;
  R('the lava module is built for the stage (G.lavaWorld, match.lava, match.stage)', !!W && !!L0 && g.match.stage?.run('lava') === L0, { W: !!W, L: !!L0 });
  if (!W || !L0) return out;
  const C = await import('./src/game/lavaCore.js');
  const { SUBS } = await import('./src/config.js');
  const dbg = g.debug;
  dbg.freeze();
  const idle = new Map();
  const freezeBots = () => { for (const a of g.match.actors) if (a.bot) { if (!idle.has(a)) idle.set(a, a.bot.update); a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; } };
  freezeBots();
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  let Lv = g.match.lava;
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const lvl = __G.level, nav = __G.nav, M = W.navMeta;
  // stage points (Alpha's half): the Slump shelf (0), the Casting Floor (0), the lake (void), race1, the Organs
  const shelf = V(-25.2, 0, -8.19), cast = V(8.5, 0, -16), race1 = W.riders.find((r) => r.id === 'race1'), orgL = W.riders.find((r) => r.id === 'organL'), orgA = W.riders.find((r) => r.id === 'organA'), orgB = W.riders.find((r) => r.id === 'organB');
  let lake = null;
  for (let k = 0; k < 400 && !lake; k++) { const x = -7 - (k % 20) * 0.5, z = -17 - Math.floor(k / 20) * 0.5; if (W.inRegion(x, z) && lvl.groundHeight(x, z, 50) === -Infinity && !W.riders.some((r) => C.inRider(r, x, z, 1))) lake = V(x, 0, z); }
  R('stage points: the shelf and the Casting Floor are floors at 0 in the region; a lake point is void', lvl.groundHeight(shelf.x, shelf.z, 5) === 0 && lvl.groundHeight(cast.x, cast.z, 5) === 0 && W.inRegion(shelf.x, shelf.z) && W.inRegion(cast.x, cast.z) && !!lake,
    { shelf: lvl.groundHeight(shelf.x, shelf.z, 5), cast: lvl.groundHeight(cast.x, cast.z, 5), lake: lake && [lake.x, lake.z] });

  // ================================================================================================ A: the schedule
  const def = W.def, S = (m, d, f = {}) => C.lavaSchedule(def, m, d, f), mv = (s) => (s && s.kind === 'moves' ? s.moves.map((x) => x.t0 + (x.dir > 0 ? 'r' : 'f')).join(' ') : s && s.kind);
  const sch = { turf180: mv(S('turf', 180)), turf90: mv(S('turf', 90)), zones: mv(S('zones', 300)), tower: mv(S('tower', 300)), karp: mv(S('bazookarp', 300)), boss: S('boss', 300), practice: S('turf', Infinity, { practice: true }), attract: S('turf', Infinity, { attract: true }) };
  R('A1 schedules (DESIGN §3.3): Turf War 3:00 rises 35 / 110, falls 70 / 140; 1:30 rise 30, fall 55; Zone Control, Tower Command, Bazookarp 35 / 125 / 215 up, 80 / 170 / 260 down (no fourth rise)',
    sch.turf180 === '35r 70f 110r 140f' && sch.turf90 === '30r 55f' && sch.zones === '35r 80f 125r 170f 215r 260f' && sch.tower === sch.zones && sch.karp === sch.zones, sch);
  R('A2 Boss Battle held LOW; Practice loops 20 / 35 / 35 and the menu backdrop 8 / 15 / 15 (found by their flags, not the mode string)',
    sch.boss.kind === 'fixed' && sch.boss.level === 'low' && sch.practice.kind === 'loop' && sch.practice.first === 20 && sch.practice.holdHigh === 35 && sch.practice.holdLow === 35 && sch.attract.first === 8 && sch.attract.holdHigh === 15 && sch.attract.holdLow === 15
      // (and the loops move between the stage's own levels)
      && [0, 25, 45, 70, 95, 130].every((t) => { const y = C.lavaY(t, sch.practice); return y >= def.low - 1e-9 && y <= def.high + 1e-9; }) && C.lavaY(45, sch.practice) === def.high && C.lavaY(5, sch.attract) === def.low && C.lavaY(25, sch.attract) === def.high,
    { boss: sch.boss.level, practice: [sch.practice.first, sch.practice.holdHigh, sch.practice.holdLow, C.lavaY(45, sch.practice)], attract: [sch.attract.first, sch.attract.holdHigh, sch.attract.holdLow, C.lavaY(5, sch.attract), C.lavaY(25, sch.attract)] });
  {
    const bad = [];
    for (const [m, d] of [['turf', 180], ['turf', 90], ['zones', 300]]) {
      const s = S(m, d), M2 = s.moves, last = M2[M2.length - 1];
      if (M2[0].t0 < 30) bad.push(m + ' starts moving before 30 s');
      if (M2.length % 2) bad.push(m + ' does not end LOW');
      if (last.t0 + last.dur > d - 12) bad.push(m + ' moves in the last 12 s');
      if (m === 'turf' && d - (last.t0 + last.dur) < 25) bad.push(m + ' ends with < 25 s of LOW');
      for (let i = 0; i + 1 < M2.length; i++) { const hold = M2[i + 1].t0 - M2[i].t0 - M2[i].dur; if (hold < (M2[i].dir > 0 ? 15 : 25)) bad.push(m + ' hold ' + hold); }
    }
    R('A3 every match ends at LOW (Turf War ≥ 25 s of it), never moves in its first 30 s or its last 12 s, holds ≥ 15 s HIGH and ≥ 25 s LOW', !bad.length, bad);
  }
  {
    const s = S('turf', 180), at = (t) => C.lavaAt(t, s);
    const ok = at(0).y === def.low && at(46).y === def.high && at(24.9).warn === false && at(25.01).warn === true && at(25.01).next.to === 'high' && at(60.01).warn && at(60.01).next.to === 'low' && at(150).y === def.low;
    let peak = 0; for (let t = 35; t < 45; t += 0.002) peak = Math.max(peak, (C.lavaY(t + 0.002, s) - C.lavaY(t, s)) / 0.002);
    const mid = at(40);   // (smoothstep: half way at half time)
    R('A4 LOW −0.6, HIGH +0.8 (the high mark); a 10 s warning before every move; 10 s smoothstep moves peaking at 0.21 m/s', ok && def.low === -0.6 && def.high === 0.8 && Math.abs(peak - 0.21) < 0.002 && Math.abs(mid.y - 0.1) < 1e-6 && Math.abs(mid.e - 0.5) < 1e-6,
      { low: def.low, high: def.high, peak: r3(peak), mid: r3(mid.y) });
    let bad = 0;
    for (let i = 0; i < 4000; i++) { const a = Math.random() * 180, b = a + Math.random() * 25; let m = -9; for (let k = 0; k <= 300; k++) m = Math.max(m, C.lavaY(a + ((b - a) * k) / 300, s)); if (Math.abs(m - C.lavaMax(a, b, s)) > 2e-3) bad++; }
    R('A5 lavaMax equals a brute-force maximum (4,000 random intervals)', bad === 0, { bad });
    // the key moments of a rise (DESIGN §3.1's table): ledges deadly at 3.8 s (13.8 s after the warning began), stones
    // solid then; ledges dry at 6.2 s into a fall (16.2 s after the fall warning)
    const rs = s.moves[0], fl = s.moves[1], tcR = C.crossTime(rs, -0.15, s) - rs.t0, tcF = C.crossTime(fl, -0.15, s) - fl.t0;
    R('A6 notice: the ledges turn deadly 13.8 s after the rise warning begins; dry 16.2 s after the fall warning (DESIGN §3.5)', Math.abs(tcR + 10 - 13.8) < 0.05 && Math.abs(tcF + 10 - 16.2) < 0.05, { rise: r3(tcR + 10), fall: r3(tcF + 10) });
  }

  // ================================================================================================ B: touching lava splats
  const me = g.match.local;
  const foe = g.match.actors.find((a) => a.team !== me.team);
  let lastSplat = null;
  const offS = on('splatted', (e) => { lastSplat = { victim: e.victim, cause: e.cause, by: e.attacker || null }; });
  const revive = (a) => { if (!a.alive) a.respawn(); a.superJumpState = null; a.invuln = 0; a.vel.set(0, 0, 0); a.intent.move.set(0, 0, 0); a.intent.squid = false; a.intent.jump = false; a.lastDamage = 99; a.lastAttacker = null; };
  const put = (a, p) => { revive(a); a.pos.copy(p); a.vel.set(0, 0, 0); a.grounded = false; };
  // a kid on the shelf as the rise comes: alive until L passes feet − 0.15, splats the frame after, cause 'lava'
  const deathOn = (a, p, t0, squid = false, attacker = null) => {
    setT(t0); put(a, p); a.intent.squid = squid; step(0.2);
    if (attacker) { a.lastDamage = 1; a.lastAttacker = attacker; }
    lastSplat = null;
    let prevY = Lv.y, at = null;
    for (let i = 0; i < 60 * 12 && a.alive; i++) { prevY = Lv.y; dbg.step(1000 / 60); if (attacker) a.lastDamage = 1; if (!a.alive) at = { yBefore: prevY, y: Lv.y, feet: p.y, t: Lv.clock.t }; }
    return { at, splat: lastSplat && lastSplat.victim === a ? lastSplat : null };
  };
  {
    const k = deathOn(me, shelf, 36), s2 = deathOn(me, cast, 36, true, foe);
    const kOk = k.at && k.splat?.cause === 'lava' && k.at.yBefore + 0.15 <= 0.0005 && k.at.y + 0.15 > 0;
    const sOk = s2.at && s2.splat?.cause === 'lava' && s2.splat.by === foe && s2.at.y + 0.15 > 0 && s2.at.yBefore + 0.15 <= 0.0005;
    R('B1 a kid on the Slump shelf splats with cause lava the frame L + 0.15 passes its feet (0), not before; a squid on the Casting Floor likewise, its attacker credited (hit in the last 4 s)', kOk && sOk,
      { kid: k.at && { before: r3(k.at.yBefore), at: r3(k.at.y), t: r3(k.at.t) }, cause: k.splat?.cause, squid: s2.at && { before: r3(s2.at.yBefore), at: r3(s2.at.y) }, by: s2.splat?.by?.name ?? null });
  }
  {
    setT(10); put(me, V(lake.x, 2.5, lake.z)); lastSplat = null;
    let dy = null; for (let i = 0; i < 240 && me.alive; i++) { const y = me.pos.y; dbg.step(1000 / 60); if (!me.alive) dy = y; }
    R('B2 a kid dropping into the lake at LOW splats as its feet pass L + 0.15 (−0.45), cause lava — never the sea', dy !== null && lastSplat?.cause === 'lava' && dy < -0.3 && dy > -0.75, { died: dy && r3(dy), cause: lastSplat?.cause });
  }
  {
    // a fall over a Spillway lip into the chute (a `falls` polygon) says lava; and every open edge a kid can walk off on
    // the stage lands in the region or a falls polygon (no fall reports the sea)
    const F = W.falls[0]; let cx = 0, cz = 0; for (const [x, z] of F) { cx += x; cz += z; } cx /= F.length; cz /= F.length;
    let pt = null; for (let k = 0; k < 200 && !pt; k++) { const x = cx + (Math.random() - 0.5) * 6, z = cz + (Math.random() - 0.5) * 6; if (W.fallsIn(x, z) && !W.inRegion(x, z) && lvl.groundHeight(x, z, 50) === -Infinity) pt = [x, z]; }
    setT(10); put(me, V(pt[0], 0.3, pt[1])); lastSplat = null;
    for (let i = 0; i < 240 && me.alive; i++) dbg.step(1000 / 60);
    const hit = new (await import('./src/game/physics.js')).Hit();
    let edges = 0, water = [];
    for (const n of nav.nodes) {
      if (!nav.valid[n.id] || M.kind[n.id] === 2) continue;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4, dx = Math.cos(a), dz = Math.sin(a), x = n.x + dx * 1.1, z = n.z + dz * 1.1;
        if (lvl.groundHeight(x, z, n.y + 0.6) !== -Infinity) continue;
        if (__G.physics.raycast(V(n.x, n.y + 0.6, n.z), V(dx, 0, dz), 1.1, hit, false).hit || __G.physics.raycast(V(n.x, n.y + 0.2, n.z), V(dx, 0, dz), 1.1, hit, false).hit) continue;
        edges++;
        if (!W.inRegion(x, z) && !W.fallsIn(x, z)) water.push([r3(x), r3(n.y), r3(z)]);
      }
    }
    R('B3 a fall over a Spillway lip into the chute splats with cause lava; every open edge a kid can walk off (from every nav node, 8 ways) drops into the region or a chute: none reports the sea',
      lastSplat?.cause === 'lava' && !water.length, { chute: lastSplat?.cause, edges, water: water.slice(0, 8), nWater: water.length });
  }

  // ================================================================================================ C: a rise and a fall
  // dummies: a bot on Organ L, one on Organ A, one on race1 once it is up; the local kid stays on the island
  const bots = g.match.actors.filter((a) => a.bot && a !== me);
  let dsDeath = null; const dsOff = on('splatted', (e) => { if (e.victim === bots[2] && !dsDeath) dsDeath = { cause: e.cause, t: r3(Lv.clock.t), y: r3(Lv.y) }; });
  const evs = []; const evOff = ['lava:warn', 'lava:move', 'lava:rest', 'lava:rider', 'lava:hold', 'lava:set'].map((k) => on(k, (e) => evs.push([k, r3(Lv.clock.t), e.to || e.level || (e.dir ?? '') + '' || '', e.up ?? null])));
  const played = []; const play0 = __G.audio?.play?.bind(__G.audio);
  if (__G.audio) __G.audio.play = (n, o) => { played.push([n, r3(Lv.clock.t), o?.params?.kind || '']); return play0 ? play0(n, o) : null; };
  const dL = bots[0], dA = bots[1], dS = bots[2];
  const onTop = (a, r, top) => { put(a, V(r.x, top + 0.02, r.z)); };
  setT(23.5);
  onTop(dL, orgL, orgL.top0); onTop(dA, orgA, orgA.top0); put(me, V(-10, 1.22, -3.2)); step(0.3);
  const rows = [];
  const RS = () => Lv.riders, rid = (id) => RS().find((x) => x.r.id === id);
  let carryL = { maxOff: 0, air: 0 }, carryA = { maxOff: 0, air: 0 }, airL = 0, airA = 0;
  let placedS = false, prevStone = null, stoneV = 0, bad = { both: 0, neither: 0, hops: 0, lake: 0, hex: 0, bVis: 0, bCol: 0, bTop: 0 }, chip = {}, bSeen = 0, bGrow = [];
  let shelfGone = null, shelfBack = null;
  for (let i = 0; i < 60 * 58; i++) {
    dbg.step(1000 / 60);
    const t = Lv.clock.t, y = Lv.y, st = Lv.st;
    const stones = RS().filter((x) => x.r.sink), solid = stones.every((x) => x.solid), none = stones.every((x) => !x.solid);
    const deadly = y + C.LAVA.kill > 0;   // (feet on the shelf at 0)
    if (deadly && !solid) bad.neither++;
    if (!deadly && !none) bad.both++;
    const tA = rid('organA').top, tB = rid('organB').top, tL = rid('organL').top;
    if (tA - 1.2 > 1.15 + 1e-6 || tB - tA > 1.15 + 1e-6 || tL - tB > 1.15 + 1e-6) bad.hops++;
    if (y - (tL - orgL.depth) < 0.3) bad.lake++;
    const bl = rid('organL').blocks.slice(0, 3); if (bl.length === 3 && (bl.some((b) => b.center.distanceTo(bl[0].center) > 0.001) || bl.some((b) => Math.abs(b.half.y - bl[0].half.y) > 0.001))) bad.hex++;
    // riders carry: never more than 2 cm inside the part, never airborne over 0.1 s
    for (const [a, top, c, k] of [[dL, tL, carryL, 'L'], [dA, tA, carryA, 'A']]) {
      if (!a.alive) continue;
      c.maxOff = Math.max(c.maxOff, top - a.pos.y);
      if (!a.grounded) { if (k === 'L') airL += 1 / 60; else airA += 1 / 60; c.air = Math.max(c.air, k === 'L' ? airL : airA); } else if (k === 'L') airL = 0; else airA = 0;
    }
    const s1 = rid('race1');
    if (s1.solid && prevStone !== null && prevStone.solid) stoneV = Math.max(stoneV, Math.abs(s1.top - prevStone.top) * 60);
    prevStone = { top: s1.top, solid: s1.solid };
    if (!placedS && t > 46.5) { placedS = true; onTop(dS, race1, s1.top); }
    if (shelfGone === null && lvl.groundHeight(shelf.x, shelf.z, 5) === -Infinity) shelfGone = { t: r3(t), y: r3(y) };
    if (shelfGone && shelfBack === null && lvl.groundHeight(shelf.x, shelf.z, 5) === 0) shelfBack = { t: r3(t), y: r3(y) };
    if (i % 60 === 0) rows.push([r3(t), r3(y), st.phase, st.warn ? 'w' : '', r3(tA), r3(tB), r3(tL), r3(s1.top), s1.solid ? 'S' : '']);
    // (fix round 1) Race 3's boulder: never drawn while its stone is not solid; its collider exactly while drawn; the drawn
    // top on the collider's top
    { const s3 = rid('race3'), bb = s3.blocks[1], BM = W.look.boulders, vis = !!BM && BM.visible;
      if (vis && !s3.solid) bad.bVis++;
      if (bb && bb.solid && !vis) bad.bCol++;
      if (vis) { bSeen++; const vTop = BM.position.y + BM.scale.y * 1.0, cTop = bb.center.y + bb.half.y; if (Math.abs(vTop - cTop) > 0.01) bad.bTop++; if (BM.scale.y < 0.999 && bGrow.length < 40) bGrow.push([r3(t), r3(BM.scale.y), r3(vTop - y)]); } }
    // the chip at moments
    const el = document.querySelector('.lv-chip'), tx = el ? el.textContent : '';
    for (const [k, t0] of [['warnRise', 27], ['rise', 40], ['high', 50], ['warnFall', 62], ['fall', 72], ['low', 80.5]]) if (!chip[k] && t > t0) chip[k] = { tx, e: r3(st.e), fill: el ? parseFloat(el.querySelector('.lv-tube i').style.height) : null, warn: el?.classList.contains('is-warn') };
  }
  for (const o of evOff) o();
  if (__G.audio && play0) __G.audio.play = play0;
  R('C1 the Pumice Race: the stones are solid exactly while the shelf beside them is deadly — every frame of a rise and a fall (never both, never neither)', bad.both === 0 && bad.neither === 0, { both: bad.both, neither: bad.neither });
  {
    const hi = rows.find((r) => r[2] === 'high');
    R('C2 up, a stone stands L + 0.45 (1.25 at HIGH); it never moves faster than 0.6 m/s while solid', hi && Math.abs(hi[7] - 1.25) < 0.005 && stoneV <= 0.6 + 1e-3, { high: hi && hi[7], peak: r3(stoneV) });
    const lo = rows.find((r) => r[2] === 'low');
    R('C3 the Organ Pipes: tops linear in L (A 1.4 → 2.35, B 1.8 → 3.5, L 2.3 → 4.65), each one hop (≤ 1.15 m) above the next from the island (1.2) at every frame; the lookout\'s bottom ≥ 0.3 m under the surface; the hex boxes move as one',
      lo && hi && Math.abs(lo[4] - 1.4) < 1e-3 && Math.abs(lo[5] - 1.8) < 1e-3 && Math.abs(lo[6] - 2.3) < 1e-3 && Math.abs(hi[4] - 2.35) < 1e-3 && Math.abs(hi[5] - 3.5) < 1e-3 && Math.abs(hi[6] - 4.65) < 1e-3 && !bad.hops && !bad.lake && !bad.hex,
      { low: lo && lo.slice(4, 7), high: hi && hi.slice(4, 7), hops: bad.hops, lake: bad.lake, hex: bad.hex });
  }
  R('C10 Race 3\'s boulder heaves up out of the lava as its stone turns solid and sinks back as it stops: never drawn while the stone is not solid (it stood 0.55 m proud for 1.6 s of every rise and fall), its collider exactly while drawn, the drawn top on the collider\'s',
    bSeen > 600 && bad.bVis === 0 && bad.bCol === 0 && bad.bTop === 0 && bGrow.length >= 4, { seen: bSeen, vis: bad.bVis, col: bad.bCol, top: bad.bTop, grow: bGrow.slice(0, 12) });
  R('C4 riders carry players: a kid on Organ L and one on Organ A ride the whole rise and fall (never airborne over 0.1 s, never 2 cm inside the column)', dL.alive && dA.alive && carryL.air <= 0.1 + 1e-6 && carryA.air <= 0.1 + 1e-6 && carryL.maxOff <= 0.02 && carryA.maxOff <= 0.02,
    { L: { alive: dL.alive, air: r3(carryL.air), off: r3(carryL.maxOff) }, A: { alive: dA.alive, air: r3(carryA.air), off: r3(carryA.maxOff) } });
  dsOff();
  R('C5 a kid still on a stone when the shelf dries splats (cause lava) the moment the stones turn deadly (76.2 s: warned 16 s)', dsDeath && dsDeath.cause === 'lava' && Math.abs(dsDeath.t - 76.21) < 0.1, dsDeath);
  R('C6 the floors the lava covers are gone (no collider: groundHeight −∞) from 0.05 m under the surface, back when it falls away', shelfGone && shelfBack && shelfGone.y > 0.05 && shelfGone.y < 0.07 && shelfBack.y < 0.05 && shelfBack.y > 0.03, { gone: shelfGone, back: shelfBack });
  {
    const at = (k, v) => evs.filter((e) => e[0] === k && (v === undefined || e[2] === v)).map((e) => e[1]);
    const wR = at('lava:warn', 'high'), mvs = at('lava:move'), rH = at('lava:rest', 'high'), wF = at('lava:warn', 'low'), rL = at('lava:rest', 'low');
    const up = evs.filter((e) => e[0] === 'lava:rider' && e[3] === true), dn = evs.filter((e) => e[0] === 'lava:rider' && e[3] === false);
    const near = (a, b, tol = 0.05) => a.length === 1 && Math.abs(a[0] - b) <= tol;
    R('C7 events at the stage times (warn 25, move 35, the stones up at 38.8, HIGH 45, warn 60, move 70, the stones down at 76.2, LOW 80)', near(wR, 25) && mvs.length === 2 && Math.abs(mvs[0] - 35) < 0.05 && Math.abs(mvs[1] - 70) < 0.05 && near(rH, 45) && near(wF, 60) && near(rL, 80) && up.length === 14 && dn.length === 14 && Math.abs(up[0][1] - 38.79) < 0.05 && Math.abs(dn[0][1] - 76.21) < 0.05,
      { warnRise: wR, moves: mvs, high: rH, warnFall: wF, low: rL, up: up.length && up[0][1], down: dn.length && dn[0][1], n: [up.length, dn.length] });
    const rise = new Set(played.filter((p) => p[1] >= 24.9 && p[1] < 46 && p[0].startsWith('lava_')).map((p) => p[0] + (p[2] ? ':' + p[2] : '')));
    const fall = new Set(played.filter((p) => p[1] >= 59.9 && p[1] < 81 && p[0].startsWith('lava_')).map((p) => p[0] + (p[2] ? ':' + p[2] : '')));
    const shared = [...rise].filter((n) => fall.has(n) && !['lava_tick', 'lava_sizzle', 'lava_pop'].includes(n));
    R('C8 rising and falling never share a sound: bell + siren up + erupt for a rise; two whistle blasts + siren down + hiss for a fall; the all-clear at LOW',
      rise.has('lava_bell') && rise.has('lava_siren_up') && rise.has('lava_erupt') && fall.has('lava_whistle:warn') && fall.has('lava_siren_down') && fall.has('lava_hiss') && fall.has('lava_whistle:clear') && !shared.length,
      { rise: [...rise], fall: [...fall], shared });
    R('C9 the HUD chip: "▲ SURGE n" pulsing in the warning, RISING ▲, HIGH · falls, "▼ EBB n", FALLING ▼, LOW · surge; its fill tracks the level (within 2 %)',
      /SURGE\d/.test(chip.warnRise?.tx.replace(/\s/g, '')) && chip.warnRise.warn && /RISING/.test(chip.rise?.tx) && /HIGH.*falls/.test(chip.high?.tx) && /EBB\d/.test(chip.warnFall?.tx.replace(/\s/g, '')) && /FALLING/.test(chip.fall?.tx) && /LOW/.test(chip.low?.tx)
        && Object.values(chip).every((c) => Math.abs(c.fill - c.e * 100) <= 2), chip);
  }

  // ================================================================================================ D: ink
  {
    const P = __G.paint, cellsNear = (p, r) => { const ids = []; const v = new THREE.Vector3(); for (let i = 0; i < W.cells.ids.length; i++) { const k = W.cells.ids[i]; P.cellWorld(k, v); if (Math.hypot(v.x - p.x, v.z - p.z) < r && Math.abs(v.y - p.y) < 0.2) ids.push(k); } return ids; };
    const inked = (ids) => ids.filter((k) => P.grid[k] > 0).length;
    P.clear(); setT(5);
    const ids = cellsNear(shelf, 1.0);
    P.splat(V(shelf.x, 0.05, shelf.z), 1.2, 0, { instant: true });
    const n0 = inked(ids), c0 = P.counts[0];
    setT(34); step(0.1); for (let i = 0; i < 60 * 12; i++) dbg.step(1000 / 60);   // (a natural rise: the burn front)
    const n1 = inked(ids), c1 = P.counts[0];
    P.splat(V(shelf.x, 0.05, shelf.z), 1.2, 0, { instant: true });
    const n2 = inked(ids);
    // a splat across the waterline on the Slump cliff: only above the surface
    const wall = (() => { const v = new THREE.Vector3(); for (const f of P.paintFaces) { if (!f.lava || !f.wall || f.sv < 2) continue; v.copy(f.origin).addScaledVector(f.u, f.su / 2); if (W.inRegion(v.x, v.z) && v.y < 0.3) return f; } return null; })();
    let wl = null;
    if (wall) {
      const c = wall.origin.clone().addScaledVector(wall.u, wall.su / 2).addScaledVector(wall.v, Lv.y - wall.origin.y).addScaledVector(wall.n, 0.2);
      P.splat(c, 0.8, 1, { instant: true });
      let above = 0, below = 0; const v = new THREE.Vector3();
      for (let j = 0; j < wall.nv; j++) for (let i = 0; i < wall.nu; i++) { const k = wall.grid + j * wall.nu + i; if (!P.grid[k]) continue; P.cellWorld(k, v); if (v.y < Lv.y) below++; else above++; }
      wl = { above, below };
    }
    for (let i = 0; i < 60 * 40; i++) dbg.step(1000 / 60);   // (HIGH, then the fall: t ≈ 86)
    const n3 = inked(ids);
    P.splat(V(shelf.x, 0.05, shelf.z), 1.2, 1, { instant: true });
    const n4 = inked(ids);
    R('D1 ink burns: a rise clears the ink on the ledges it covers (grid and counts); a splat under the lava claims nothing; across the waterline only above it; after a fall the ledge is bare and takes ink again',
      ids.length > 20 && n0 > ids.length * 0.6 && n1 === 0 && c1 < c0 && n2 === 0 && wl && wl.above > 0 && wl.below === 0 && n3 === 0 && n4 > ids.length * 0.6,
      { cells: ids.length, before: n0, afterRise: n1, counts: [c0, c1], underLava: n2, waterline: wl, afterFall: n3, again: n4, burned: Lv.stats.burned });
    let liveRetired = 0; for (let i = 0; i < P.live.length; i++) if (P.dead[i] && P.live[i]) liveRetired++;
    R('D2 cells always under LOW are retired (never turf): out of turfTotal; the drowning ledges stay turf (cells under the lava count for nobody)', W.retired > 1000 && liveRetired === 0 && ids.filter((k) => P._faceOfCell(k)?.turf).every((k) => P.live[k] === 1 || P.dead[k] === 1) && ids.filter((k) => P.live[k] === 1).length > 30, { retired: W.retired, liveRetired, turfTotal: P.turfTotal });
    // the Organ decks take ink (their own paint, never turf); the stones never
    setT(46); step(0.1);
    const RA = rid('organA'), cov0 = P.counts.slice();
    P.splat(V(orgA.x, RA.top + 0.05, orgA.z), 1.0, 0, {});
    put(me, V(orgA.x, RA.top + 0.02, orgA.z)); step(0.3);
    const deckTeam = RA.deck ? RA.deck.groundTeam(me.pos) : -1;
    R('D3 an Organ deck takes ink (its own paint: you swim and refill in it) and is never turf; the stones carry none', RA.deck && RA.deck.n > 0 && deckTeam === 1 && me.groundTeam === 1 && P.counts[0] === cov0[0] && !rid('race1').deck,
      { deckN: RA.deck?.n, deckTeam, groundTeam: me.groundTeam, counts: [cov0[0], P.counts[0]] });
    P.clear();
    // (fix round 1) the burn on the furthest stage time reached, never on a clock going back: a follower's clock eases
    // back (StageClock) or snaps back; the level then goes up again in a fall without any rise. The lava cells of a wall
    // in the region, by height
    const wallCells = (y0, y1) => { const v = new THREE.Vector3(), ids = []; for (let i = 0; i < W.cells.ids.length; i++) { if (W.cells.y[i] < y0 || W.cells.y[i] > y1) continue; const k = W.cells.ids[i], f = P._faceOfCell(k); if (!f || !f.wall) continue; P.cellWorld(k, v); if (Math.hypot(v.x - shelf.x, v.z - shelf.z) < 9) ids.push(k); } return ids; };
    const inkAll = (ids, team) => { const v = new THREE.Vector3(); for (const k of ids) { P.cellWorld(k, v); P.splat(v, 0.35, team, { instant: true, seed: k }); } };
    const lvAt = (t) => C.lavaY(t, Lv.sched);
    // a) mid-fall (74: L 0.31), ink the walls from just over the surface to 0.6; the clock goes back 1.5 s (L 0.53: a
    //    follower's snap) and comes forward again: the ink over L(74) stays
    setT(74); const yA = Lv.y;
    const idsA = wallCells(yA + 0.04, 0.6); inkAll(idsA, 0); const nA0 = inked(idsA);
    Lv.clock.t = 72.5; Lv.seek(72.5, 'clock'); Lv.update(1 / 60, 72.52);
    Lv.clock.t = 73.4; Lv.update(1 / 60, 73.4);   // (… and eases on, still behind)
    Lv.clock.t = 74.3; Lv.update(1 / 60, 74.3);
    const nA1 = inked(idsA);
    // b) mid-rise (39: L −0.11), the clock goes back to 38.2 (L −0.33) and a splat lands at the waterline then: nothing
    //    inks under L(39), the furthest time reached
    P.clear(); setT(39); const yB = Lv.y;
    Lv.clock.t = 38.2; Lv.update(1 / 60, 38.2);
    const idsB = wallCells(lvAt(38.2) - 0.02, yB - 0.03); inkAll(idsB, 1); const nB = inked(idsB);
    Lv.clock.t = 39.1; Lv.update(1 / 60, 39.1);
    // c) a follower's forward snap from LOW into the middle of the fall (30 → 74: the surface rose to HIGH and is back
    //    down at 0.31) burns everything the surface passed in the skipped time, up to the HIGH mark, not just to 0.31
    P.clear(); setT(30);
    const idsC = wallCells(0.4, 0.75); inkAll(idsC, 0); const nC0 = inked(idsC);
    Lv.clock.t = 74; Lv.seek(74, 'clock'); Lv.update(1 / 60, 74.02);
    const nC1 = inked(idsC);
    R('D4 the burn runs on the furthest stage time reached: a clock going back in a fall burns nothing (the ink over the surface stays), a splat while it is back inks nothing under the line the surface reached, a forward snap over a whole rise burns up to the HIGH mark',
      idsA.length > 30 && nA0 > idsA.length * 0.6 && nA1 === nA0 && idsB.length > 10 && nB === 0 && idsC.length > 30 && nC0 > idsC.length * 0.6 && nC1 === 0,
      { a: { yAt74: r3(yA), cells: idsA.length, before: nA0, after: nA1 }, b: { yAt39: r3(yB), cells: idsB.length, inked: nB }, c: { cells: idsC.length, before: nC0, after: nC1 }, tMax: r3(Lv.tMax) });
    P.clear();
  }

  // ================================================================================================ E: devices, queries
  {
    __G.subs.clear();
    const live = (k) => __G.subs.items.filter((it) => it.owner === me && it.kind === k && it.state !== 'dead' && it.state !== 'fly');
    const plant = (p, k) => { revive(me); me.pos.copy(p); me.pos.y += 0.02; me.vel.set(0, 0, 0); me.grounded = true; me.ink = 100; const n0 = live(k).length; __G.subs.use(me, SUBS[k]); step(0.1); return live(k).length - n0; };
    setT(2);
    const placed = { mine: plant(shelf, 'mine'), beacon: plant(V(shelf.x + 1.5, 0, shelf.z + 0.6), 'beacon') };
    me.pos.set(cast.x - 2, 0.02, cast.z); step(0.05);
    const toss = __G.subs._throw(me, SUBS.sprinkler, V(cast.x, 1.2, cast.z), V(0, -6, 0), false); step(0.6);
    const tossSt = toss.state, tossAt = toss.pos && [r3(toss.pos.x), r3(toss.pos.y), r3(toss.pos.z)];
    const items = __G.subs.items.filter((it) => it.owner === me && it.state !== 'dead');
    const downs = []; const o2 = on('device:down', (e) => downs.push(e.how));
    put(me, V(-10, 1.22, -3.2));   // (the owner off the floor: a sprinkler also goes when its owner is splatted)
    setT(38.4); step(1.0);
    o2();
    const gone = items.filter((it) => it.state === 'dead').length, states = items.map((it) => [it.kind, it.state, it.pos && +it.pos.y.toFixed(3)]);
    R('E1 devices the lava reaches are destroyed (a Lurk Mine and a Hop Beacon on the shelf, a Twirl Sprinkler on the Casting Floor): no blast, device:down how lava', placed.mine === 1 && placed.beacon === 1 && tossSt === 'spray' && items.length >= 3 && gone === items.length && downs.filter((h) => h === 'lava').length >= 3,
      { placed, sprinkler: tossSt, at: tossAt, items: items.length, gone, states, downs });
    __G.subs.clear();
    const np = (t) => { setT(t); return lvl.noPlace(V(shelf.x, 0.02, shelf.z), 0.3); };
    const npr = { t2: np(2), t20: np(20), t27: np(27), t46: np(46), t90: np(90), t150: np(150), dry: (setT(27), lvl.noPlace(V(-10, 1.22, -3.2), 0.3)) };
    R('E2 no device is placed under rising lava: G.level.noPlace on the shelf from 21 s before a rise (the warning + the move) until it is dry again; never on dry ground', !npr.t2 && npr.t20 && npr.t27 && npr.t46 && !npr.t90 && !npr.t150 && !npr.dry, npr);
    setT(20); const at20 = plant(shelf, 'mine'); __G.subs.clear();
    R('E3 … so a Lurk Mine planted on the shelf in that window is refused', at20 === 0, { planted: at20 });
    setT(46);
    const SM = g.match.stage, sk = { under: SM.sink(V(lake.x, 0.7, lake.z), 'test'), above: SM.sink(V(lake.x, 1.2, lake.z), 'test'), out: SM.sink(V(0, 0.5, -40), 'test') };
    const ly = { inR: lvl.liquidY(lake.x, lake.z), out: lvl.liquidY(0, -40) };
    R('E4 shots, bombs and thrown subs fizzle at the surface (match.stage.sink); G.level.liquidY is L in the region, the sea (−1.6) elsewhere', sk.under && !sk.above && !sk.out && Math.abs(ly.inR - 0.8) < 1e-6 && ly.out === -1.6, { sk, ly });
    // a super jump whose landing will be under the lava lands on the nearest dry node
    setT(36.5);
    const s1 = { to: V(shelf.x, 0, shelf.z), dur: 1.6 }; Lv.superJumpLanding(me, s1);
    const dry1 = !Lv.covers(s1.to.x, s1.to.z, s1.to.y, 10);
    setT(5);
    const s2 = { to: V(shelf.x, 0, shelf.z), dur: 1.6 }; Lv.superJumpLanding(me, s2);
    R('E5 a super jump landing on the shelf as it drowns is moved to the nearest dry node (≤ 12 m); at LOW with no rise near it lands as aimed',
      dry1 && Math.hypot(s1.to.x - shelf.x, s1.to.z - shelf.z) < 12 && s2.to.distanceTo(V(shelf.x, 0, shelf.z)) < 1e-6,
      { moved: [r3(s1.to.x), r3(s1.to.y), r3(s1.to.z)], d: r3(Math.hypot(s1.to.x - shelf.x, s1.to.z - shelf.z)) });
    // (fix round 1) the riders and the lava: a sprinkler stuck to Organ A's side rides it down on a fall and is crushed as
    // it passes the socket's rim (it lived on inside the island); ink on the lookout's sides that a fall carries under the
    // surface is burned, and a splat under the waterline on them inks nothing
    __G.subs.clear();
    setT(50); put(me, V(-6.6, 1.22, -6.34)); step(0.2);
    const RAa = rid('organA'), spk = __G.subs._throw(me, SUBS.sprinkler, V(-7.6, 1.95, -6.34), V(-9, 1.2, 0), false);
    for (let i = 0; i < 40 && spk.state === 'fly'; i++) step(1 / 60);
    const stuck = { state: spk.state, onA: !!spk.ride && spk.ride.lavaRider === RAa, y: spk.pos && r3(spk.pos.y), rim: RAa.rim };
    const downs2 = []; const o6 = on('device:down', (e) => downs2.push([e.how, r3(Lv.clock.t), e.pos && r3(e.pos.y)]));
    setT(68); put(me, V(-6.6, 1.22, -3.4));
    for (let i = 0; i < 60 * 14; i++) dbg.step(1000 / 60);   // (the fall: to 82)
    o6();
    const RL2 = rid('organL'), sides = RL2.sides.filter(Boolean);
    const sideInk = (bMax) => sides.reduce((n, s) => n + s.surf.slice(1).reduce((m, f) => { let c = 0; for (let j = 0; j < f.nv; j++) { if (f.b0 + (j + 0.5) * 0.1 >= bMax) break; for (let i = 0; i < f.nu; i++) if (f.grid[j * f.nu + i]) c++; } return m + c; }, 0), 0);
    // the lookout at HIGH: its waterline 0.35 m over its base; ink its lake-side faces from 0.5 to 1.1 m over the base
    setT(50); step(0.1);
    const base = () => RL2.top - orgL.depth, wHigh = Lv.y - base();
    const P2splat = (c, r, team) => __G.paint.splat(c, r, team, {});
    for (let h = 0.55; h <= 1.1; h += 0.15) for (let a = 0; a < 6; a++) { const ang = (a * Math.PI) / 3 + Math.PI / 6, rr = orgL.r * 0.866 + 0.25; P2splat(V(orgL.x + Math.cos(ang) * rr, base() + h, orgL.z + Math.sin(ang) * rr), 0.4, 0); }
    const ink0 = sideInk(1.25);
    setT(66); for (let i = 0; i < 60 * 16; i++) dbg.step(1000 / 60);   // (the fall: to 82, LOW: the waterline 1.3 m over the base)
    const wLow = Lv.y - base(), ink1 = sideInk(wLow - 0.05);
    for (let a = 0; a < 6; a++) { const ang = (a * Math.PI) / 3 + Math.PI / 6, rr = orgL.r * 0.866 + 0.25; P2splat(V(orgL.x + Math.cos(ang) * rr, base() + 0.9, orgL.z + Math.sin(ang) * rr), 0.4, 1); }
    const ink2 = sideInk(wLow - 0.05);
    R('E6 the riders and the lava: a sprinkler on Organ A\'s side is crushed as a fall takes it past its socket\'s rim; ink a fall carries under the surface on the lookout\'s sides is burned; a splat under the waterline there inks nothing',
      stuck.state === 'spray' && stuck.onA && spk.state === 'dead' && downs2.some((d) => d[0] === 'crush') && ink0 > 20 && ink1 === 0 && ink2 === 0 && Math.abs(wHigh - 0.35) < 0.02 && Math.abs(wLow - 1.3) < 0.02,
      { stuck, after: spk.state, downs: downs2, sideInk: { atHigh: ink0, afterFall: ink1, splatUnder: ink2 }, waterline: [r3(wHigh), r3(wLow)] });
    __G.paint.clear(); __G.subs.clear();
  }

  // ================================================================================================ F: the nav graph
  {
    const ofR = (id, pose) => nav.nodes.filter((n) => M.rider[n.id] === W.riders.findIndex((r) => r.id === id) && M.pose[n.id] === pose).length;
    const per = {}; for (const r of W.riders) per[r.id] = [ofR(r.id, 0), ofR(r.id, 1)];
    const okR = W.riders.every((r) => (r.sink ? per[r.id][0] === 0 && per[r.id][1] > 0 : per[r.id][0] > 0 && per[r.id][1] > 0));
    const wet = nav.nodes.filter((n) => M.kind[n.id] === 2 && n.wet).length;
    R('F1 the merged graph: every Organ column has nodes at both poses, every stone at its HIGH pose; every step link yields its edge pairs (no problems); rider nodes pay no wet cost', okR && !W.navProblems.length && wet === 0,
      { per, problems: W.navProblems, wet, ms: M.ms, links: (W.links || []).filter((l) => !l.twin).map((l) => l.pose + ':' + l.pairs).join(' ') });
    // no edge crosses more than 0.3 m of nothing inside the region (at the pose it is used: sampled with the riders there)
    let gaps = 0, checked = 0;
    for (const n of nav.nodes) {
      if (!W.inRegion(n.x, n.z) || M.kind[n.id] === 2) continue;
      for (const e of n.nb) {
        const m = nav.nodes[e.to]; if (M.kind[m.id] === 2 || e.type === 'climb') continue;
        checked++;
        const d = Math.hypot(m.x - n.x, m.z - n.z), k = Math.ceil(d / 0.05); let run = 0, worst = 0;
        for (let i = 1; i < k; i++) { const x = n.x + ((m.x - n.x) * i) / k, z = n.z + ((m.z - n.z) * i) / k; if (lvl.groundHeight(x, z, Math.max(n.y, m.y) + 0.4) < Math.min(n.y, m.y) - 0.5) { run += d / k; worst = Math.max(worst, run); } else run = 0; }
        if (worst > 0.3) gaps++;
      }
    }
    R('F2 no static nav edge in the region crosses a gap wider than a seam (0.3 m): no leap edges', gaps === 0 && checked > 500, { checked, gaps, cuts: W.gapCuts });
    // routes and windows: the south Slump head → the north head along the shelf (LOW) or the Race (HIGH)
    const sH = nav.nearest(V(-18.74, 1.2, -14.4), 0.8), nH = nav.nearest(V(-23.64, 1.2, -0.19), 0.8);
    const route = (t) => { setT(t); const p = nav.path(sH, nH, 0); return p ? { k1: p.filter((id) => M.kind[id] === 1).length, k2: p.filter((id) => M.kind[id] === 2).length, n: p.length } : null; };
    const r = { low: route(10), warn: route(34), high: route(46), fallWarn: route(66), lateFall: route(74), low2: route(90) };
    R('F3 windows: head → head runs along the shelf at LOW and over the Race at HIGH; not along the shelf when it drowns before arrival, not over the stones once they leave their pose',
      r.low && r.low.k1 > 3 && r.low.k2 === 0 && r.warn && r.warn.k1 === 0 && r.high && r.high.k2 >= 5 && r.high.k1 === 0 && r.lateFall && r.lateFall.k2 === 0 && r.low2 && r.low2.k1 > 3, r);
    setT(10);
    const nStone = nav.nearest(V(race1.x, 1.25, race1.z), 2.5), nStoneS = nav.nearest(V(race1.x, 1.25, race1.z), 2.5, true);
    R('F4 nearest() never hands a sunk stone node out (as a goal or a start)', M.kind[nStone] !== 2 && M.kind[nStoneS] !== 2, { goal: M.kind[nStone], start: M.kind[nStoneS] });
    // the climb island → A → B → L exists at both poses over the links
    const top = (id, pose) => nav.nodes.filter((n) => M.rider[n.id] === W.riders.findIndex((r2) => r2.id === id) && M.pose[n.id] === pose)[0]?.id;
    const isl = nav.nearest(V(-10, 1.2, -3.6), 0.8);
    const climb = (t, pose) => { setT(t); const p = nav.path(isl, top('organL', pose), 0); return p ? p.map((id) => M.kind[id]).join('') : null; };
    const cl = { low: climb(10, 0), high: climb(46, 1) };
    R('F5 the Organ climb (island → A → B → L) exists at LOW and at HIGH over the step links', cl.low && cl.high && cl.high.includes('2'), cl);
    const RL = Lv.restMask('low'), RH = Lv.restMask('high'), sN = nav.nearest(shelf, 0.8, true), stN = nav.nodes.find((n) => M.rider[n.id] === W.riders.indexOf(race1))?.id;
    R('F6 Bazookarp\'s restMask: the shelf standable at LOW, not at HIGH; a stone node at HIGH, not at LOW; dry floor always', RL && RH && RL[sN] === 1 && RH[sN] === 0 && RH[stN] === 1 && RL[stN] === 0 && RL[isl] === 1 && RH[isl] === 1, { shelf: [RL[sN], RH[sN]], stone: [RL[stN], RH[stN]], island: [RL[isl], RH[isl]] });
    // (fix round 1) a floor the lava can never reach is not "low ground": no node at or above HIGH + kill is a lava floor
    // (the 1.10 m gutter copings were: 20 nodes, a false GET OFF THE LOW GROUND at HIGH, bots fleeing them); and a kid on
    // a coping at HIGH rest and in a rise warning gets no personal line
    const H = def.high, K = C.LAVA.kill;
    const high1 = nav.nodes.filter((n) => nav.valid[n.id] && M.kind[n.id] === 1 && n.y >= H + K - 1e-6).map((n) => [r3(n.x), r3(n.y), r3(n.z)]);
    const copings = nav.nodes.filter((n) => nav.valid[n.id] && W.inRegion(n.x, n.z) && n.y > 1.0 && n.y < 1.15 && M.kind[n.id] !== 2);
    const cop = nav.nodes[nav.nearest(V(5.5, 1.1, -22.5), 0.6)];
    const lines = {};
    for (const [k, t] of [['high', 50], ['warn', 27], ['rise', 39]]) { setT(t); put(me, V(cop.x, cop.y + 0.02, cop.z)); step(0.2); lines[k] = [Lv._mine(me)?.text || null, me.alive, r3(me.pos.y)]; }
    R('F9 a floor the lava never reaches is never low ground: no lava-floor node at or above HIGH + kill (the 1.10 m copings are dry, ways out); a kid on a coping gets no personal line at HIGH, in the warning or the rise',
      !high1.length && copings.length > 10 && copings.every((n) => M.kind[n.id] === 0) && cop && Math.abs(cop.y - 1.1) < 0.03 && Object.values(lines).every((l) => l[0] === null && l[1]),
      { high1: high1.slice(0, 6), nHigh1: high1.length, copings: copings.length, coping: cop && [r3(cop.x), r3(cop.y), r3(cop.z)], lines });
  }
  // bots: eight on the drowning ledges at the warning walk off before the lava comes (brains on), four on the stones at
  // the fall warning step off before they sink
  {
    setT(24.7);
    // (each team on its own half's ledges — Alpha's Slump and Casting Floor, Bravo's twins — 30–50 m apart: the escape is
    // what is measured here, not a fight at the lava's edge, which is the bot matches' business: tests/lava-match.js)
    const mates = bots.filter((b) => b.team === bots[0].team), others = bots.filter((b) => b.team !== bots[0].team);
    const crew = [...mates, ...others].slice(0, 7), sA = [shelf, cast, V(-24.0, 0, -10.5), V(10.5, 0, -13.5)], sB = [V(25.2, 0, 8.19), V(-8.5, 0, 16), V(24.0, 0, 10.5), V(-10.5, 0, 13.5)];
    const spots = crew.map((b) => (b.team === mates[0].team ? sA : sB)[(b.team === mates[0].team ? mates : others).indexOf(b) % 4]);
    // (no weapon deaths in this trial: the crew can't be hurt by each other — the lava ignores that, as it ignores armour)
    crew.forEach((b, i) => { put(b, V(spots[i].x, 0.02, spots[i].z)); b.bot.update = idle.get(b); b.bot.path = null; b.bot.repath = 0; b.bot.goalTimer = 0; b.invuln = 1e6; });
    // (a death counts against the escape when it happens on drowning ground or a stone — the nearest nav node a ledge or a
    // rider; a fall off a dry bank into the lake is listed apart)
    const kindAt = (a) => { const s2 = nav.nearest(a.pos, 1.5, true); return s2 >= 0 ? M.kind[s2] : -1; };
    let deaths = []; const o3 = on('splatted', (e) => { if (crew.includes(e.victim)) deaths.push([e.victim.name, e.cause, r3(Lv.clock.t), r3(e.victim.pos.x), r3(e.victim.pos.y), r3(e.victim.pos.z), crew.indexOf(e.victim), kindAt(e.victim)]); });
    const drowned = (d) => d[1] === 'lava' && (d[7] === 1 || d[7] === 2);
    // (each one's trail — t, x, y, z, node kind, escaping, mode, path left — reported for the first one that dies)
    const trail7 = crew.map(() => []);
    for (let i = 0; i < 30 * 20; i++) { dbg.step(1000 / 30); if (i % 8 === 0) crew.forEach((b, k) => { if (b.alive) trail7[k].push([r3(Lv.clock.t), r3(b.pos.x), r3(b.pos.y), r3(b.pos.z), kindAt(b), b.bot._lavaEsc ? 'E' : '', b.bot.mode, b.bot.path ? b.bot.path.length - b.bot.pi : 0]); }); }   // (to t ≈ 44.7: past the drowning)
    const offLedge = crew.filter((b) => b.alive && b.pos.y > 0.5).length;
    const d7 = deaths.find(drowned);
    R('F7 bots on the drowning ledges at the rise warning are off them before they drown (7 of 7: none dies on the drowning ground; escape routes walked)', !d7 && crew.every((b) => !b.alive || b.pos.y > 0.5),
      { deaths, offLedge, n: crew.length, esc: crew.map((b) => b.bot.escN || 0), trail: d7 ? trail7[d7[6]].slice(-14) : undefined });
    // the stones: four bots on them at HIGH; the fall warning comes at 60, the stones sink at 76.2
    setT(58);
    const sto = W.riders.filter((r) => r.sink && !r.id.endsWith('~')).slice(0, 4);
    // (each on its stone's own nav node: clear of race 3's boulder)
    // (Alpha's Race for one team, Bravo's for the other)
    const stoB = W.riders.filter((r) => r.sink && r.id.endsWith('~')).slice(0, 4);
    crew.slice(0, 4).forEach((b, i) => { const r = b.team === mates[0].team ? sto[i] : stoB[i], ri = W.riders.indexOf(r), n = nav.nodes.find((q) => M.rider[q.id] === ri && M.pose[q.id] === 1); put(b, V(n.x, rid(r.id).top + 0.02, n.z)); b.bot.path = null; b.bot.repath = 0; b.bot.goalTimer = 0; b.invuln = 1e6; });
    // (the other three parked on the island, brains off and standing still: put() clears the intent; the bot update
    // that would have set it again is off)
    for (const b of crew.slice(4)) { b.bot.update = () => {}; b.invuln = 1e6; put(b, V(-10, 1.22, -3.2 + crew.indexOf(b))); b.intent.fire = false; b.invuln = 1e6; }
    deaths = [];
    // (a trail for every crew member: the three parked on the island are listed too if anything befalls them)
    const trail = crew.map(() => []);
    const dead = new Set(); const o5 = on('splatted', (e) => dead.add(e.victim));
    for (let i = 0; i < 30 * 21; i++) { dbg.step(1000 / 30); if (i % 15 === 0) crew.forEach((b, k) => { if (dead.has(b)) return; const s2 = nav.nearest(b.pos, 1.2, true); trail[k].push([r3(Lv.clock.t), r3(b.pos.x), r3(b.pos.y), r3(b.pos.z), s2 >= 0 ? M.kind[s2] : -1, b.bot._lavaEsc ? 'E' : '', b.bot.mode]); }); }   // (to t ≈ 79)
    o5();
    o3();
    const deadK = deaths.length ? deaths[0][6] : -1;
    R('F8 bots on the stones at the fall warning step off before they sink (4 of 4: none dies on a stone or the drowning ground)', !deaths.some(drowned), { deaths, alive: crew.slice(0, 4).map((b) => b.alive), trail: deadK >= 0 ? trail[deadK]?.slice(-14) : undefined });
    freezeBots();
  }
  // (fix round 1) the lookout claim: from the rise each team's best long-range bot goes up its own side's lookout and
  // holds it until the fall warning; every bot from its pad, brains on, a normal fight
  {
    setT(34);
    for (const b of bots) { put(b, __G.level.spawnPads[b.team].clone().setY(__G.level.spawnPads[b.team].y + 0.05)); b.bot.update = idle.get(b) || b.bot.update; b.bot.path = null; b.bot.goalTimer = 0; b.bot._look = null; }
    Lv._lp = null; Lv.stats.lookTeam = [0, 0]; Lv.stats.lookLong = [0, 0]; Lv.stats.lookClaims = 0; Lv.stats.lookHold = 0;
    const kits = bots.map((b) => [b.team, b.weapon?.kind]);
    let claims = null, upAt = [null, null];
    for (let i = 0; i < 30 * 27; i++) {
      dbg.step(1000 / 30);
      if (!claims && Lv._lp && Lv._lp.some((T) => T && T.claim)) claims = Lv._lp.map((T) => T && T.claim ? [T.claim.a.name, T.claim.a.team, T.claim.a.weapon?.kind, r3(Lv.clock.t)] : null);
      for (const T of Lv._lp || []) if (T && T.claim && upAt[T.claim.a.team] === null && Lv._onLookout(T.claim.a, T.ri)) upAt[T.claim.a.team] = r3(Lv.clock.t);
    }
    const S2 = Lv.stats, released = bots.every((b) => !b.bot._look);
    // (a team whose kits are all short-range — rollers, brushes, buckets, brollies — has no claimant by design)
    const claimed = [0, 1].filter((tm) => (S2.lookLog || []).some((l) => l.team === tm && l.t >= 33));
    // (a 27 s fight from the pads: a claimant can die on the way; the per-match numbers are lava-match's business)
    R('F10 the lookout claim: a claim for each team with a long- or mid-range kit; a claimant reaches its own lookout at HIGH and holds it (≥ 2 s); every claim let go at the fall warning',
      claimed.length >= 1 && claimed.every((tm) => (S2.lookLog || []).some((l) => l.team === tm && l.t >= 33)) && claimed.some((tm) => upAt[tm] !== null && S2.lookTeam[tm] >= 2) && released && Lv.clock.t > 60.5,
      { claims, claimed, upAt, seconds: S2.lookTeam.map(r3), long: S2.lookLong.map(r3), held: r3(S2.lookHold), nClaims: S2.lookClaims, released, t: r3(Lv.clock.t), kits, log: (S2.lookLog || []).filter((l) => l.t >= 33) });
    freezeBots();
  }

  // ================================================================================================ G: HUD, looks
  {
    setT(26.5); put(me, V(shelf.x, 0.02, shelf.z)); step(0.3);
    const mine = document.querySelector('.lv-mine'), mtx = mine?.textContent || '', mon = mine?.classList.contains('is-on');
    const calls = [...document.querySelectorAll('.iw-call__txt')].map((e) => e.textContent);
    setT(46); put(me, V(race1.x, rid('race1').top + 0.02, race1.z)); step(0.2);
    setT(61); step(0.3);
    const m2 = document.querySelector('.lv-mine')?.textContent || '';
    setT(10); put(me, V(-10, 1.22, -3.2)); step(0.3);
    const m3 = document.querySelector('.lv-mine')?.classList.contains('is-on');
    R('G1 the local player\'s own line: on a ledge in the warning "GET OFF THE LOW GROUND → n m"; on a stone in the fall warning "THE STONES ARE SINKING"; nothing on dry ground', mon && /GET OFF THE LOW GROUND/.test(mtx) && /\d+ m/.test(mtx) && /THE STONES ARE SINKING/.test(m2) && !m3, { mtx, m2, dry: m3 });
    // the callouts from the events (a natural warning)
    setT(24.6); for (let i = 0; i < 30; i++) dbg.step(1000 / 60);
    const c2 = [...document.querySelectorAll('.iw-call')].map((e) => e.textContent);
    for (let i = 0; i < 60 * 2; i++) dbg.step(1000 / 60);   // (2 s on: the sub-line counts down with the warning)
    const c3 = [...document.querySelectorAll('.iw-call')].map((e) => e.textContent);
    R('G2 the callout from the event: "LAVA RISING" / "Off the low ground: 10" (big), and its number counts down while it shows (8 two seconds on)', c2.some((t) => /LAVA RISING/.test(t) && /Off the low ground: 10/.test(t)) && c3.some((t) => /Off the low ground: 8/.test(t)), { calls: c2, later: c3, before: calls });
    const { envCause } = await import('./src/core/envCauses.js');
    const ec = envCause('lava');
    R('G3 the splat card: "Burned in the lava" / "Knocked into the lava", a lava icon, a deep-red flood (#a3121a)', ec && ec.name === 'Burned in the lava' && ec.knocked === 'Knocked into the lava' && /<svg/.test(ec.icon) && ec.flood === '#a3121a', ec && { name: ec.name, flood: ec.flood });
    // the gauge needles track e; the beacons: red flashing at warn-rise, steady red at HIGH, white at warn-fall, off at LOW
    const look = W.look, needle = look.needles[0];
    const gs = {};
    for (const [k, t] of [['low', 10], ['warnRise', 27], ['high', 50], ['warnFall', 62]]) { setT(t); step(0.05); const c = look.beaconMat.color; gs[k] = { e: r3(Lv.st.e), y: r3(needle.y), rgb: [r3(c.r), r3(c.g), r3(c.b)] }; }
    const red = (c) => c.rgb[0] > c.rgb[2] * 2 && c.rgb[0] > 0.1, white = (c) => c.rgb[2] > 0.1 && Math.abs(c.rgb[0] - c.rgb[2]) < c.rgb[0] * 0.3, off = (c) => Math.max(...c.rgb) < 0.05;
    R('G4 the Surge Gauge: the needle at EBB at LOW and at the HIGH MARK at HIGH (7 m of travel); beacons off at LOW, red before and at HIGH, white before a fall',
      gs.low.y < 0.3 && gs.high.y > needle.h - 0.5 && off(gs.low) && (red(gs.warnRise) || off(gs.warnRise)) && red(gs.high) && (white(gs.warnFall) || Math.max(...gs.warnFall.rgb) < 0.6), gs);
    // the minimap's lava layer differs at LOW, mid-rise and HIGH
    const mm = g.minimap, cv = document.createElement('canvas'); cv.width = mm.w; cv.height = mm.h;
    const hash = (t) => { setT(t); const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); Lv.drawMap(c, mm, { x: 0, y: 0 }, mm.s, ['#f00', '#00f'], 1); const d = c.getImageData(0, 0, cv.width, cv.height).data; let h = 0, n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) { n++; h = (h * 31 + d[i - 3] + i) >>> 0; } return { n, h }; };
    const hm = { low: hash(10), mid: hash(39.5), high: hash(50) };
    // (fix round 1) a level step redraws only the pixels it floods or bares: every 0.1 m of a rise and a fall, timed
    Lv.stats.mapMs = 0; Lv.stats.mapN = 0;
    for (let t = 35; t <= 45.01; t += 0.25) hash(t);
    for (let t = 70; t <= 80.01; t += 0.25) hash(t);
    const mapT = { stepMaxMs: Lv.stats.mapMs, redraws: Lv.stats.mapN, buildMs: Lv.stats.mapBuildMs };
    R('G5 the minimap: the lava fill spreads over the ledges as it rises (pixel counts LOW < mid-rise < HIGH); a level step redraws in ≤ 1.5 ms (it re-rastered the map: 9.4 ms)', hm.low.n > 0 && hm.mid.n > hm.low.n && hm.high.n > hm.mid.n && mapT.redraws >= 20 && mapT.stepMaxMs <= 1.5, { ...hm, ...mapT });
    // (fix round 1) the glow's proximity field: the island's lake faces glow at HIGH (within 0.25 m of open lava), its
    // dry middle (the machine house's foot, 3 m in from the rim) never; the causeway's side over the Casting Floor only
    // once the floor is under (HIGH), not at LOW
    {
      const rim = [];
      for (const deg of [0, 40, 140, 180, 220, 320]) {
        const a = (deg * Math.PI) / 180; let d0 = null;
        for (let d = 3; d < 30 && d0 === null; d += 0.05) if (lvl.groundHeight(Math.cos(a) * d, Math.sin(a) * d, 1.3) < 1.0) d0 = d;
        if (d0 !== null) rim.push([deg, r3(d0), r3(W.proxAt(Math.cos(a) * (d0 - 0.12), Math.sin(a) * (d0 - 0.12), def.high)), r3(W.proxAt(Math.cos(a) * (d0 - 3), Math.sin(a) * (d0 - 3), def.high))]);
      }
      const cw = [];
      for (const sx of [1, -1]) { let xe = null; for (let x = 0.5; x < 12 && xe === null; x += 0.05) if (lvl.groundHeight(sx * x, -16, 1.3) < 1.0) xe = x; if (xe !== null) cw.push([sx, r3(xe), r3(W.proxAt(sx * (xe - 0.1), -16, def.low)), r3(W.proxAt(sx * (xe - 0.1), -16, def.high)), lvl.groundHeight(sx * (xe + 0.4), -16, 1.0)]); }
      const house = [r3(W.proxAt(-10.5, 4.6, def.high)), r3(W.proxAt(-10.5, 4.6, def.low))];
      R('G8 the lava\'s glow is faded by how near open lava a face stands: the island\'s lake faces glow at HIGH, its dry middle and the machine house\'s foot never; the causeway\'s side over the Casting Floor glows only once the floor is under',
        rim.length >= 5 && rim.every((r) => r[2] >= 0.6 && r[3] === 0) && house.every((v) => v === 0) && cw.some((c) => c[2] < 0.3 && c[3] >= 0.6), { rim: rim.map((r) => ({ deg: r[0], rimAt: r[1], face: r[2], in3m: r[3] })), house, causeway: cw, ms: W.proxMs });
    }
    const key = g.levelMat.customProgramCacheKey();
    R('G6 the level shader carries the lava band (the stain line at the high mark, its glow and pulse): program key -lava, the shared uniforms; the prop kit\'s materials carry the stain', /-lava/.test(key) && g.levelMat.userData.uniforms.uLavaS === W.uniforms.uLavaS && !!g.props?.mat?.paint?.userData?.lavaStain, { key });
  }

  // ================================================================================================ H: modes
  {
    offS();
    const restart = async (mode, extra = {}) => { dbg.unfreeze?.(); await g.api.startMatch({ mapId: 'caldera', duration: extra.duration || 300, mode, ...extra }); for (let i = 0; i < 240; i++) { if (g.match?.state === 'playing') break; await new Promise((r) => setTimeout(r, 100)); } dbg.freeze(); freezeBots(); Lv = g.match.lava; };
    await restart('zones');
    // (fix round 1) the orange band follows THIS match's inks: a match on a reused world, then every palette
    const { TEAM_PALETTES, COLORBLIND_PALETTE } = await import('./src/config.js');
    const HOT = ['#ff8a14', '#ff4150', '#ffb000', '#ff6a00', '#ffd21a'], hot = () => (__G.teamHex || []).some((h) => HOT.includes(String(h).toLowerCase()));
    const pal = [['restart', W.look.mat.uniforms.uS.value.z, hot(), (__G.teamHex || []).join(' ')]];
    for (const P0 of [...TEAM_PALETTES, COLORBLIND_PALETTE]) { g._setPalette(P0); step(1 / 60); pal.push([P0.id, W.look.mat.uniforms.uS.value.z, hot()]); }
    R('H4 the seams\' orange band is dropped exactly when this match\'s inks are orange / red (Tangerine, Cherry, the colour-blind Sun): after a restart on a reused world and for each palette', pal.every((r) => (r[1] === 1) === r[2]) && pal.filter((r) => r[2]).length >= 3, pal);
    // (fix round 1) the lava chip sits under each mode's own HUD, never over it (DOM boxes), in the warning, the rise, at
    // HIGH, and with the overtime bar (below, after H1's overtime)
    g.hud?.setVisible?.(true);
    const boxes = (sels) => sels.flatMap((q) => [...document.querySelectorAll(q)]).filter((e) => !e.classList.contains('lv-chip')).map((e) => [e.className.split(' ')[0], e.getBoundingClientRect()]).filter(([, r]) => r.width > 2 && r.height > 2);
    const ov = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const chipVs = (sels) => { const el = document.querySelector('.lv-chip'), c = el?.getBoundingClientRect(); if (!c || c.width < 2) return { chip: null }; const hit = boxes(sels).filter(([, r]) => ov(c, r) > 1).map(([n, r]) => [n, Math.round(ov(c, r))]); return { chip: [Math.round(c.left), Math.round(c.top), Math.round(c.width), Math.round(c.height)], parent: el.parentElement?.className.split(' ')[0], hit, n: boxes(sels).length }; };
    const ZSEL = ['.iw-zo__chip', '.iw-zo__shift', '.iw-zo__ot', '.iw-timer__txt', '.iw-zc'], TSEL = ['.iw-tw__track', '.iw-tw__status', '.iw-tw__ot', '.iw-tw__tower', '.iw-timer__txt', '.iw-zc'];
    const zHud = {};
    for (const [k, t] of [['warn', 26], ['rise', 38], ['high', 55]]) { setT(t); step(0.3); zHud[k] = chipVs(ZSEL); }
    // (fix round 1) Zone Control's last ebb (270) lands on its FINAL 30 banner: the EBB callout and the all-clear whistle
    // wait 3.5 s
    {
      const calls = [], wh = [], S0 = g.match.stage, c0 = S0.callout.bind(S0), p0 = __G.audio?.play?.bind(__G.audio);
      S0.callout = (a, b, c) => { calls.push([a, r3(Lv.clock.t)]); return c0(a, b, c); };
      if (__G.audio) __G.audio.play = (n, o) => { if (n === 'lava_whistle') wh.push([o?.params?.kind, r3(Lv.clock.t)]); return p0 ? p0(n, o) : null; };
      let finAt = null; const of = on('zones:active', (e) => { if (e.final && finAt === null) finAt = r3(Lv.clock.t); });
      setT(264); for (let i = 0; i < 60 * 12; i++) dbg.step(1000 / 60);
      of(); S0.callout = c0; if (__G.audio && p0) __G.audio.play = p0;
      const ebb = calls.find((c) => c[0] === 'EBB'), clear = wh.find((w) => w[0] === 'clear');
      R('H5 Zone Control\'s last ebb (270 s) and its FINAL 30 banner: the EBB callout and the all-clear whistle come 3.5 s after the banner, not with it', finAt !== null && Math.abs(finAt - 270) < 0.3 && ebb && ebb[1] >= finAt + 3 && clear && clear[1] >= finAt + 3, { finAt, ebb, clear, calls, wh });
    }
    const ev = []; const o4 = ['lava:hold', 'lava:move', 'lava:warn'].map((k) => on(k, (e) => ev.push([k, r3(Lv.clock.t)])));
    setT(118); g.match.zones.overtime = true; step(0.1);
    const ot = Lv.otAt;
    for (let i = 0; i < 30 * 30; i++) dbg.step(1000 / 30);   // (to ≈ 148: the 125 rise would have come)
    g.match.zones.overtime = false;
    for (const o of o4) o();
    R('H1 Zone Control: its schedule; overtime holds — a warning not yet at its move is cancelled, nothing moves after, "LAVA HOLDS"', Lv.sched.key === 'zones' && ot !== null && Lv.st.phase === 'low' && ev.some((e) => e[0] === 'lava:hold') && !ev.some((e) => e[0] === 'lava:move'),
      { key: Lv.sched.key, otAt: ot, phase: Lv.st.phase, ev });
    g.match.zones.overtime = true; step(0.4); zHud.overtime = chipVs(ZSEL); g.match.zones.overtime = false;
    await restart('tower');
    g.hud?.setVisible?.(true);
    const tHud = {};
    for (const [k, t] of [['warn', 26], ['rise', 38], ['high', 55]]) { setT(t); step(0.3); tHud[k] = chipVs(TSEL); }
    if (g.match.tower) { g.match.tower.overtime = true; step(0.4); tHud.overtime = chipVs(TSEL); g.match.tower.overtime = false; }
    const okHud = (o) => Object.values(o).every((x) => x.chip && !x.hit.length && x.n > 0);
    R('G7 the lava chip hangs under each mode\'s own HUD and never covers it (DOM boxes): Zone Control\'s zone chip, shift line and overtime bar, Tower Command\'s track, tower, status and overtime bar — in the warning, the rise, at HIGH and in overtime',
      okHud(zHud) && okHud(tHud) && Object.values(zHud).every((x) => x.parent === 'iw-zo') && Object.values(tHud).every((x) => x.parent === 'iw-tw'), { zones: zHud, tower: tHud });
    const ZL = lvl.layout.zones, zs = [...(ZL.center || []), ZL.side].filter(Boolean);
    R('H2 the zones never touch the lava: every zone floor ≥ HIGH + 0.3', zs.length > 0 && zs.every((z) => z.y0 >= def.high + 0.3), zs.map((z) => z.y0));
    await restart('boss');
    R('H3 Boss Battle: the lava held at LOW, the Organs in the level before the boss\'s nav is built (placed at the match\'s creation)', Lv && Lv.sched.kind === 'fixed' && Lv.sched.level === 'low' && Lv.placed && Lv.y === def.low,
      { kind: Lv?.sched.kind, level: Lv?.sched.level, placed: Lv?.placed });
  }
  return out;
})();
