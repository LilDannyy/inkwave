// Surf N' Turf online (src/game/sp-surf.js), with real clients on the local relay (netpage.cjs): the host (A) throws a
// buoy in Practice; the guest (B) — on the other team — is out in its rings.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-surf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan)
// Checks: the ghost buoy anchors where the owner's did; its rings run in step (the same count and reach, timed from the
// anchor record); a ring hits B on B's screen (40, marked by A's team) and A sees it (the mark on B, A's hit marker);
// B jumping the next ring takes nothing, B's screen opens A's assist window and A hears of the dodge; a bot of A's team
// then splats B (its hit goes to B, B judges the splat) and A gets the assist — on both screens; the turf the rings
// painted is the same on both screens; B shooting the buoy on its screen pops it on A's (its owner) and then on B's.
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
  const MAP = opt.map || 'saltpan';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
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
  // a flat open spot (no drop or wall within 7 m) near the middle of the stage — A's screen finds it, both use it
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const flat = (n) => { for (let r = 1.5; r <= 7; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) return false; } return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    for (const n of S) if (flat(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  // A stands at P, B 5 m out (each moves its own), A's teammate bot 9 m off (A owns it)
  const place = (c, nid, x, z) => c.js(`(() => { const a = __G.match.actors.find((q) => q.nid === ${nid}); a.pos.set(${x}, ${P[1]} + 0.02, ${z}); a.vel.set(0, 0, 0); return 1; })()`);
  await place(A, ids.a, P[0], P[2]); await place(A, ids.mate, P[0] - 9, P[2]); await place(B, ids.b, P[0] + 5, P[2]);
  // B keeps its kid there; it jumps the THIRD ring (index 2) as its front comes (B's own screen decides: its ghost)
  await B.js(`(() => { const me = __G.match.local; window.__surfHook = (a, it) => { if (a !== me) return; a.pos.x = ${P[0] + 5}; a.pos.z = ${P[2]}; a.vel.x = a.vel.z = 0;
    const b = __G.specials.world.find((w) => w.kind === 'surf'); const R = b && b.rings && b.rings[2];
    if (R && R.state === 'travel' && !window.__jumped) { const d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z), tIn = (d - 0.3 - R.r) / 9.5; if (tIn < 0.3 && a.grounded) { it.jump = true; window.__jumped = true; } } }; return 1; })()`);
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
  R('a ring hits B on B\'s screen (its owner judges): 40, marked by A\'s team', hitOnB.length >= 1 && markB && markB.team === ids.ta, { hits: hitOnB, mark: markB });
  R('…and A sees it: the mark on B (its ribbon from the buoy\'s beacon), A\'s own hit marker', markA && markA.from && Math.abs(markA.from[1] - (anchor[0][1] + 1.0)) < 0.1 && hitOnA.some((h) => h.local), { mark: markA, hits: hitOnA });
  await A.until(`window.__surf.dodges.length > 0`, 3000, 30).catch(() => null);
  const LA2 = await J(A, `window.__surf`);
  const dodgeB = LB.dodges.find((d) => d.who === ids.b && !d.remote), dodgeA = LA2.dodges.find((d) => d.who === ids.b && d.remote);
  R('B jumping the third ring: no hit from it on B\'s screen (one hit so far: the second ring), and A hears of the dodge', dodgeB && dodgeA && hitOnB.length === 1, { dodges: [LB.dodges, LA2.dodges], hitsOnB: hitOnB.length });
  await finish();
  // (the rest of the rings run out; then the reach each got to on both screens)
  await A.until(`!__G.specials.world.some((w) => w.kind === 'surf' && w.gid === ${anchor[0][4]})`, 12000, 100).catch(() => null);
  await wait(400);
  const reachA = await J(A, `window.__reach`), reachB = await J(B, `window.__reach`);
  R('…its rings ran in step on both screens: the same count, each reaching as far', reachA.length === 6 && reachB.length === 6 && reachA.every((r, i) => Math.abs(r - reachB[i]) < 0.05), { reachA, reachB });
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
};
