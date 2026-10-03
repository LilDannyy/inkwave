// Surf N' Turf online (src/game/sp-surf.js), with real clients on the local relay (netpage.cjs): the host (A) throws a
// buoy in Practice; the guest (B) — on the other team — is out in its rings.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-surf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan); 'scene=tower': the buoy riding the tower instead (Tower Command, below)
// Checks: the ghost buoy anchors where the owner's did; its rings run in step (the same count and reach, timed from the
// anchor record); a ring hits B on B's screen (40, marked by A's team) and A sees it (the mark on B, A's hit marker);
// B jumping the next ring takes nothing, B's screen opens A's assist window and A hears of the dodge; a bot of A's team
// then splats B (its hit goes to B, B judges the splat) and A gets the assist — on both screens; the turf the rings
// painted is the same on both screens; B shooting the buoy on its screen pops it on A's (its owner) and then on B's.
// scene=tower (Tower Command): A rides the tower and drops a buoy on its deck — on both screens it rides the tower (its
// spot on the deck the same on each screen's tower), and every ring is centred at the same spot on both (B's ghost
// re-centred by the owner's [6] word).
module.exports = async ({ clients, R, wait, say, args, open }) => {
  // its hooks ride the local kids' brains (window.__surfHook in the bots' update): the clients must be ?autopilot ones.
  // Not given them (no Q0=autopilot Q1=autopilot): each is reopened with it; still none after that: a loud failure
  for (const c of clients.slice(0, 2)) {
    if (/[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i} has no ?autopilot (run with Q0=autopilot Q1=autopilot) — reopening it with it`);
    await open(c.i, 'autopilot');
  }
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'saltpan', TOWER_SCENE = opt.scene === 'tower';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: ${JSON.stringify(TOWER_SCENE ? 'tower' : 'practice')}, map: ${JSON.stringify(MAP)}, time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1]) { await B.js(`__G.net.setMe({ team: ${1 - teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team !== p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up');
  for (const c of [A, B]) if (!(await c.js('!!__G.match.local.bot'))) throw new Error(`c${c.i}: its own kid has no brain (an ?autopilot client is needed: Q0=autopilot Q1=autopilot)`);
  // everyone's own squidkids stand still (each screen stubs the brains it runs); a test hook per frame (window.__surfHook)
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__surfHook?.(a, it); }; }
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear(); return 1; })()`);
  await still(A); await still(B);
  // listeners on both screens
  const listen = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const L = window.__surf = { hits: [], dodges: [], marks: [] };
    on('hit', (e) => { if (e.weaponId === 'surf') L.hits.push({ att: e.attacker?.nid, vic: e.victim?.nid, local: !!e.attacker?.isLocal }); });
    on('surf:dodge', (e) => L.dodges.push({ who: e.actor?.nid, remote: !!e.remote }));
    on('actor:marked', (e) => L.marks.push({ who: e.actor?.nid, team: e.team, from: e.from && e.from.isVector3 ? [e.from.x, e.from.y, e.from.z] : null }));
    return 1; })()`);
  await listen(A); await listen(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me), mate = m.actors.find((x) => x.isBot && x.team === me.team);
    return { a: me.nid, b: him.nid, mate: mate ? mate.nid : null, ta: me.team, tb: him.team }; })()`);
  R('A and B are on different teams, A has a bot teammate', ids.ta !== ids.tb && ids.mate !== null, ids);
  if (TOWER_SCENE) { await towerScene(); return; }
  // a flat open spot (no drop or wall within 7 m) near the middle of the stage — A's screen finds it, both use it
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const flat = (n) => { for (let r = 1.5; r <= 7; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) return false; } return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    for (const n of S) if (flat(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  // the rings' numbers from the game's config (their reach is tuned: SPECIALS.surf rMin … rMax, sp-surf.js ringReach)
  const CFG = JSON.parse(await A.js(`(async () => { const { SPECIALS } = await import('./src/config.js'); const S = await import('./src/game/sp-surf.js'); const D = SPECIALS.surf;
    return JSON.stringify({ pulses: D.pulses, speed: D.speed, damage: D.damage, hitR: S.HIT_R, reach: Array.from({ length: D.pulses }, (_, i) => S.ringReach(i)) }); })()`));
  // A stands at P, B DB m out (each moves its own), A's teammate bot 9 m off (A owns it); B jumps ring JR — every ring
  // before it that reaches DB (less a body's radius) hits B first
  const DB = 5, JR = 2;
  const preHits = CFG.reach.slice(0, JR).filter((r) => r >= DB - CFG.hitR).length;
  R(`the staging fits the rings' reach (${CFG.reach.map((r) => r.toFixed(1)).join(' / ')} m): B ${DB} m out, ring ${JR + 1} (jumped) reaches B, ${preHits} ring(s) before it hit B`, CFG.reach[JR] >= DB && CFG.pulses > JR, CFG);
  const place = (c, nid, x, z) => c.js(`(() => { const a = __G.match.actors.find((q) => q.nid === ${nid}); a.pos.set(${x}, ${P[1]} + 0.02, ${z}); a.vel.set(0, 0, 0); return 1; })()`);
  await place(A, ids.a, P[0], P[2]); await place(A, ids.mate, P[0] - 9, P[2]); await place(B, ids.b, P[0] + DB, P[2]);
  // B keeps its kid there; it jumps ring JR as its front comes (B's own screen decides: its ghost; the ring's own centre)
  await B.js(`(() => { const me = __G.match.local; window.__surfHook = (a, it) => { if (a !== me) return; a.pos.x = ${P[0] + DB}; a.pos.z = ${P[2]}; a.vel.x = a.vel.z = 0;
    const b = __G.specials.world.find((w) => w.kind === 'surf'); const R = b && b.rings && b.rings[${JR}];
    if (R && R.state === 'travel' && !window.__jumped) { const c = R.c || b.pos, d = Math.hypot(a.pos.x - c.x, a.pos.z - c.z), tIn = (d - ${CFG.hitR} - R.r) / ${CFG.speed}; if (tIn < 0.3 && a.grounded) { it.jump = true; window.__jumped = true; } } }; return 1; })()`);
  await A.js(`(() => { const me = __G.match.local; window.__surfHook = (a, it) => { if (a === me) { a.pos.x = ${P[0]}; a.pos.z = ${P[2]}; a.vel.x = a.vel.z = 0; } }; return 1; })()`);
  await wait(800);
  // A pops Surf N' Turf and tosses it at its feet
  await A.js(`(async () => { const S = await import('./src/game/sp-surf.js'); const me = __G.match.local; me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial();
    const s = me.specialActive; s.botVel = new (await import('three')).Vector3(0.3, 3, 0); S.IMPL.throwIt(me, s); return 1; })()`);
  await A.until(`__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live')`, 6000, 50);
  await B.until(`__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live')`, 6000, 50);
  const anchor = [await J(A, `(() => { const b = __G.specials.world.find((w) => w.kind === 'surf'); return [b.pos.x, b.pos.y, b.pos.z, b.ghost, b.gid]; })()`),
    await J(B, `(() => { const b = __G.specials.world.find((w) => w.kind === 'surf'); return [b.pos.x, b.pos.y, b.pos.z, b.ghost, b.gid]; })()`)];
  R('the ghost buoy on B\'s screen anchors where A\'s did (the owner\'s record)', !anchor[0][3] && anchor[1][3] && anchor[0][4] === anchor[1][4] && Math.hypot(anchor[0][0] - anchor[1][0], anchor[0][1] - anchor[1][1], anchor[0][2] - anchor[1][2]) < 0.02, anchor);
  // the rings' reach on both screens, recorded by each page as they go (an interval in the page)
  for (const c of [A, B]) await c.js(`(() => { const R = window.__reach = []; setInterval(() => { const b = __G.specials.world.find((w) => w.kind === 'surf' && w.gid === ${anchor[0][4]}); if (b && b.rings) b.rings.forEach((r, j) => { R[j] = Math.max(R[j] || 0, +r.r.toFixed(2)); }); }, 20); return 1; })()`);
  // B jumps the third ring (its own screen judges it); right after, a bot of A's team splats B
  await B.until(`window.__surf.dodges.length > 0`, 9000, 30).catch(() => null);
  await wait(150);
  const LA = await J(A, `window.__surf`), LB = await J(B, `window.__surf`);
  const hitOnB = LB.hits.filter((h) => h.vic === ids.b), hitOnA = LA.hits.filter((h) => h.vic === ids.b);
  const markA = LA.marks.find((m) => m.who === ids.b), markB = LB.marks.find((m) => m.who === ids.b);
  R(`a ring hits B on B's screen (its owner judges): ${CFG.damage}, marked by A's team`, hitOnB.length >= 1 && markB && markB.team === ids.ta, { hits: hitOnB, mark: markB });
  R('…and A sees it: the mark on B (its ribbon from the buoy\'s beacon), A\'s own hit marker', markA && markA.from && Math.abs(markA.from[1] - (anchor[0][1] + 1.0)) < 0.1 && hitOnA.some((h) => h.local), { mark: markA, hits: hitOnA });
  await A.until(`window.__surf.dodges.length > 0`, 3000, 30).catch(() => null);
  const LA2 = await J(A, `window.__surf`);
  const dodgeB = LB.dodges.find((d) => d.who === ids.b && !d.remote), dodgeA = LA2.dodges.find((d) => d.who === ids.b && d.remote);
  R(`B jumping ring ${JR + 1}: no hit from it on B's screen (${preHits} hit(s) so far: the ring(s) before it that reach ${DB} m), and A hears of the dodge`, dodgeB && dodgeA && hitOnB.length === preHits, { dodges: [LB.dodges, LA2.dodges], hitsOnB: hitOnB.length, want: preHits });
  await finish();
  // (the rest of the rings run out; then the reach each got to on both screens)
  await A.until(`!__G.specials.world.some((w) => w.kind === 'surf' && w.gid === ${anchor[0][4]})`, 12000, 100).catch(() => null);
  await wait(400);
  const reachA = await J(A, `window.__reach`), reachB = await J(B, `window.__reach`);
  R('…its rings ran in step on both screens: the same count, each reaching as far', reachA.length === CFG.pulses && reachB.length === CFG.pulses && reachA.every((r, i) => Math.abs(r - reachB[i]) < 0.05), { reachA, reachB });
  await later();
  return;

  async function finish() {
    // the assist: B jumped A's ring; within the window A's teammate bot splats B (its hit goes to B, B judges)
    await B.js(`window.__surfHook = null; 1`);
    const win = await J(B, `(() => { const w = __G.assists.windowsOn(__G.match.local); return w.map((x) => [x.helper.nid, x.kind, +x.left.toFixed(2)]); })()`);
    R('B\'s screen holds A\'s assist window on B (the jump)', win.some((w) => w[0] === ids.a && w[1] === 'jump'), win);
    await B.js(`(() => { __G.match.local.invuln = 0; return 1; })()`);
    await A.js(`(() => { const m = __G.match, bot = m.actors.find((x) => x.nid === ${ids.mate}), v = m.actors.find((x) => x.nid === ${ids.b}); __G.projectiles.applyHit(bot, v, 200, bot.weaponId); return 1; })()`);
    await B.until(`!__G.match.local.alive`, 5000, 50).catch(() => null);
    await A.until(`__G.match.local.stats.assists >= 1`, 5000, 100).catch(() => null);
    const asA = await J(A, `({ assists: __G.match.local.stats.assists, splats: __G.match.local.stats.splats, mate: __G.match.actors.find((x) => x.nid === ${ids.mate}).stats.splats })`);
    const asB = await J(B, `({ assists: __G.match.actors.find((x) => x.nid === ${ids.a}).stats.assists, alive: __G.match.local.alive })`);
    R('A\'s teammate splats B inside it: A gets the assist on both screens (B judged it; the splat event carried it), the bot the splat', asA.assists === 1 && asB.assists === 1 && asA.mate === 1 && asA.splats === 0 && !asB.alive, { A: asA, B: asB });
  }
  async function later() {
    // the rings' turf, the same on both screens (after the last splats have arrived)
    await wait(1500);
    const gridOf = (c) => J(c, `(() => { const P = __G.paint; return { counts: [...P.counts], d: P.exportGrid().d, n: P.grid.length }; })()`);
    const decode = (d, n) => { const bin = Buffer.from(d, 'base64'); const g = new Uint8Array(n); let k = 0, x = 0, mul = 1; for (const b of bin) { x += (b & 127) * mul; if (b & 128) { mul *= 128; continue; } g.fill(x % 4, k, k + Math.floor(x / 4)); k += Math.floor(x / 4); x = 0; mul = 1; } return g; };
    const gA = await gridOf(A), gB = await gridOf(B), xa = decode(gA.d, gA.n), xb = decode(gB.d, gB.n);
    let diff = 0, inked = 0; for (let i = 0; i < gA.n; i++) { if (xa[i]) inked++; if (xa[i] !== xb[i]) diff++; }
    R(`the rings' ink is the same turf on both screens (${diff} of ${inked} inked cells differ)`, inked > 500 && diff <= inked * 0.01, { diff, inked, counts: [gA.counts, gB.counts] });
    // B shoots a second buoy on its screen: its owner's copy (A) takes the hits and pops; then B's ghost goes too
    await A.js(`(async () => { const S = await import('./src/game/sp-surf.js'); const me = __G.match.local; me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial();
      const s = me.specialActive; s.botVel = new (await import('three')).Vector3(0.3, 3, 0); S.IMPL.throwIt(me, s); return 1; })()`);
    await B.until(`__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live' && w.ghost)`, 8000, 50);
    await B.until(`__G.match.local.alive`, 9000, 100).catch(() => null);
    const hp0 = await J(A, `(() => { const b = __G.specials.world.find((w) => w.kind === 'surf' && !w.ghost && w.phase === 'live'); return b ? b.hp : null; })()`);
    await B.js(`(async () => { const THREE = await import('three'); const b = __G.specials.world.find((w) => w.kind === 'surf' && w.ghost && w.phase === 'live'), me = __G.match.local;
      for (let k = 0; k < 4; k++) __G.specials.shotHit(new THREE.Vector3(b.pos.x - 1, b.pos.y + 0.6, b.pos.z), new THREE.Vector3(b.pos.x + 1, b.pos.y + 0.6, b.pos.z), me.team, 100, me); return 1; })()`);
    const popA = await A.until(`!__G.specials.world.some((w) => w.kind === 'surf' && !w.ghost)`, 5000, 50).then(() => true, () => false);
    const popB = await B.until(`!__G.specials.world.some((w) => w.kind === 'surf')`, 5000, 50).then(() => true, () => false);
    R('B shooting the buoy on its screen: A\'s buoy (its owner\'s copy) takes it and pops, then B\'s ghost of it goes', hp0 === 350 && popA && popB, { hp0, popA, popB });
    const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
    R('no console errors on either screen', !errs.length, errs.slice(0, 5));
  }

  // ---- scene=tower: the buoy on the tower, on both screens
  async function towerScene() {
    const hasT = await J(A, `!!__G.match.tower && !!__G.match.tower.block`);
    R('Tower Command is up with its tower (both screens)', hasT && await J(B, `!!__G.match.tower`), { map: MAP });
    if (!hasT) return;
    // A rides the deck (its own screen keeps it there: the host's rules move the tower; B follows the host's clock);
    // B stands well away
    await A.js(`(() => { const me = __G.match.local, T = __G.match.tower; window.__surfHook = (a, it) => { if (a !== me) return; a.pos.set(T.pos.x - 0.6, T.top + 0.05, T.pos.z - 0.6); a.vel.set(0, 0, 0); }; return 1; })()`);
    await B.js(`(() => { const me = __G.match.local, T = __G.match.tower, p = __G.level.spawnPads[me.team]; window.__surfHook = (a, it) => { if (a !== me) return; a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); }; return 1; })()`);
    await A.until(`__G.match.tower.moving !== 0`, 8000, 100).catch(() => null);
    const mv = await J(A, `__G.match.tower.moving`);
    R('A on the deck moves the tower', mv !== 0, { moving: mv });
    // A throws its buoy straight up (moving with the tower) and it comes down onto the deck where A stands
    await A.js(`(async () => { const S = await import('./src/game/sp-surf.js'), THREE = await import('three'); const me = __G.match.local, T = __G.match.tower; me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial();
      const s = me.specialActive, dp = T.block.dp || new THREE.Vector3(); s.botVel = new THREE.Vector3(dp.x * 60, 3, dp.z * 60); S.IMPL.throwIt(me, s); return 1; })()`);
    const live = `__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live')`;
    const upA = await A.until(live, 8000, 50).then(() => true, () => false); await B.until(live, 6000, 50).catch(() => null);
    const st = await J(A, `(() => { const b = __G.specials.world.find((w) => w.kind === 'surf'), T = __G.match.tower, S = __G.surf.SURF_STATS; return { b: b && { phase: b.phase, fall: b.fall, pos: [b.pos.x, b.pos.y, b.pos.z].map((v) => +v.toFixed(2)), on: b.on && b.on.b.tag }, tower: [T.pos.x, T.top, T.pos.z].map((v) => +v.toFixed(2)), stats: { lost: S.lost, crushed: S.crushed, falls: S.falls, shoves: S.shoves } }; })()`);
    R('A\'s buoy lands on the deck', upA && st.b && st.b.on === 'tower', st);
    if (!upA) return;
    // sample both screens for 4 s: the buoy's spot on its screen's tower, whether it rides the tower's block, where it is
    const sampler = (c) => c.js(`(() => { const S = window.__twS = []; const T = __G.match.tower; window.__twI = setInterval(() => { const b = __G.specials.world.find((w) => w.kind === 'surf' && w.phase === 'live'); if (!b) return;
      S.push([+(b.pos.x - T.pos.x).toFixed(3), +(b.pos.y - T.top).toFixed(3), +(b.pos.z - T.pos.z).toFixed(3), b.on && b.on.b === T.block ? 1 : 0, +b.pos.x.toFixed(3), +b.pos.z.toFixed(3)]); }, 50); return 1; })()`);
    await sampler(A); await sampler(B);
    await new Promise((r) => setTimeout(r, 4000));
    for (const c of [A, B]) await c.js(`clearInterval(window.__twI); 1`);
    const SA = await J(A, `window.__twS`), SB = await J(B, `window.__twS`);
    const span = (S) => S.length ? Math.hypot(S[S.length - 1][4] - S[0][4], S[S.length - 1][5] - S[0][5]) : 0;
    const spread = (S) => { if (!S.length) return 99; let m = 0; for (const x of S) m = Math.max(m, Math.hypot(x[0] - S[0][0], x[2] - S[0][2]), Math.abs(x[1])); return m; };
    const offA = SA[SA.length - 1], offB = SB[SB.length - 1];
    R(`the buoy rides the tower on both screens (A: ${span(SA).toFixed(2)} m, B: ${span(SB).toFixed(2)} m along), on its tower's block, at the same spot of the deck on each`,
      SA.length > 20 && SB.length > 20 && SA.every((x) => x[3]) && SB.every((x) => x[3]) && span(SA) > 1 && span(SB) > 1 && spread(SA) < 0.04 && spread(SB) < 0.04 && offA && offB && Math.hypot(offA[0] - offB[0], offA[2] - offB[2]) < 0.06,
      { A: { n: SA.length, span: +span(SA).toFixed(2), spread: +spread(SA).toFixed(3), off: offA && offA.slice(0, 3) }, B: { n: SB.length, span: +span(SB).toFixed(2), spread: +spread(SB).toFixed(3), off: offB && offB.slice(0, 3) } });
    // its rings: centred at the same spots on both screens (the owner's word for each one off the anchor)
    const ringsOf = (c) => J(c, `(() => { const b = __G.specials.world.find((w) => w.kind === 'surf'); return b ? b.rings.filter((r) => r.c).map((r) => [+r.c.x.toFixed(2), +r.c.y.toFixed(2), +r.c.z.toFixed(2)]) : []; })()`);
    const RA = await ringsOf(A), RB = await ringsOf(B);
    const movedR = RA.length > 1 ? Math.hypot(RA[RA.length - 1][0] - RA[0][0], RA[RA.length - 1][2] - RA[0][2]) : 0;
    R(`its rings leave from where it has got to (the last ${movedR.toFixed(2)} m on from the first) and are centred at the same spots on both screens`,
      RA.length >= 3 && RB.length === RA.length && movedR > 0.5 && RA.every((c, i) => Math.hypot(c[0] - RB[i][0], c[1] - RB[i][1], c[2] - RB[i][2]) < 0.05), { A: RA, B: RB });
    const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
    R('no console errors on either screen', !errs.length, errs.slice(0, 5));
  }
};
