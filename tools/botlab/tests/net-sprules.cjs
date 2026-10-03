// sprules online ([b5-sprules]: src/game/sp-bubble.js, sp-barrage.js, kits/boomerang.js, sp-drainbow.js): two real
// clients on the local relay (netpage.cjs), online Practice, the host (A) and the guest (B) on the SAME team, with one bot
// teammate (C, the host's) and two enemy bots; everyone's brains stubbed (each screen the ones it runs).
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sprules.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'only=chain,survive,barrage' (default all) · 'shots' (pictures into OUT: the chain seen on B's screen)
// Checks:
//   chain     A's Bubble Guard → B by touch (B's screen decides: B is its player; A's screen hears it from B's record),
//             A splatted (B's copy stays on both screens), then B → C by touch (A's screen decides: C is its bot; B's
//             screen hears it) — each copy the time left on the one it came from, one chain on both screens, all of them
//             running out together on both screens, no extra shares (no refresh loop)
//   survive   A splatted with its things out, seen on B's screen: the Whirl Boomerang carries on (no fizzle) home to where
//             A went down and bursts there (A's burst record); the Drainbow stands for the rest of its life and pops on
//             time (not 'lost'); the Ink Tempest's cloud rains its whole life; the Surf N' Turf buoy sends every ring
//   barrage   B (the guest) throws a Mystery Bomb Barrage: A's screen shows B's running special, the bomb in B's hand
//             (B's [4, 'nb'] records) and every bomb B threw, kind for kind; then a Waddle Bomb Barrage likewise
module.exports = async ({ clients, R, wait, say, args, open, out }) => {
  for (const c of clients.slice(0, 2)) {
    if (/[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i} has no ?autopilot — reopening it with it`);
    await open(c.i, 'autopilot');
  }
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const want = (k) => !opt.only || opt.only.split(',').includes(k);
  const J = async (c, code) => JSON.parse(await c.js(`Promise.resolve(${code}).then((v) => JSON.stringify(v))`));   // (async code too)
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 3, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] !== teams[1]) { await B.js(`__G.net.setMe({ team: ${teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up');
  // every brain this screen runs stands still; a per-frame test hook (window.__spHook) rides them
  const still = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const { SUB_KITS } = await import('./src/game/kits/registry.js'); window.__SK = SUB_KITS;
    for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__spHook?.(a, it); };
    const L = window.__sp = { throws: [], shields: [] };
    on('barrage:throw', (e) => { if (e.actor === __G.match.local) L.throws.push(e.kind); });
    on('special:share', (e) => L.shields.push({ from: e.from ? e.from.nid : null, to: e.to.nid, t: +e.time.toFixed(2), remote: !!e.remote }));
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear(); return 1; })()`);
  await still(A); await still(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me), mate = m.actors.find((x) => x.isBot && x.team === me.team);
    return { a: me.nid, b: him && him.nid, c: mate ? mate.nid : null, ta: me.team, tb: him && him.team, foes: m.actors.filter((x) => x.team !== me.team).map((x) => x.nid) }; })()`);
  R('A and B on the same team, with a bot teammate C (the host\'s) and enemy bots', ids.ta === ids.tb && ids.c !== null && ids.foes.length >= 1, ids);
  if (ids.ta !== ids.tb || ids.c === null) return;
  // a flat open spot near the middle with a clear 14 m line from it (A's screen finds it; both use it)
  const S = await J(A, `(() => {
    const G = __G, nodes = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    const flat = (x, y, z, r1) => { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= r1; r++) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
    for (const n of nodes) {
      if (!flat(n.x, n.y, n.z, 5)) continue;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let ok = true;
        for (let r = 3; r <= 15 && ok; r++) ok = Math.abs(G.level.groundHeight(n.x + dx * r, n.z + dz * r, n.y + 1.5) - n.y) < 0.2 && G.physics.los(new (G.match.local.pos.constructor)(n.x, n.y + 1, n.z), new (G.match.local.pos.constructor)(n.x + dx * r, n.y + 1, n.z + dz * r));
        if (ok) return { x: n.x, y: n.y, z: n.z, dx, dz }; }
    }
    return null; })()`);
  R('a flat open spot with a clear line from it', !!S, S);
  if (!S) return;
  const at = (k) => [S.x + S.dx * k, S.z + S.dz * k];
  // put an actor this screen owns at k m along the line (a teleport: the others snap to it)
  const put = (c, nid, k, side = 0) => c.js(`(() => { const a = __G.match.actors.find((q) => q.nid === ${nid}); if (!a || !a.alive) return 0; a.pos.set(${S.x} + ${S.dx} * ${k} - ${S.dz} * ${side}, ${S.y} + 0.02, ${S.z} + ${S.dz} * ${k} + ${S.dx} * ${side}); a.vel.set(0, 0, 0); a.netTp = (a.netTp || 0) + 1; return 1; })()`);
  const parkFoes = async () => { for (const [i, f] of ids.foes.entries()) await put(A, f, -30 - i * 2, 6); };
  const respawnA = async () => {
    await A.js(`(() => { const me = __G.match.local; if (!me.alive) me.respawnTimer = 0.01; return 1; })()`);
    await A.until(`__G.match.local.alive`, 8000, 50);
    await B.until(`__G.match.actors.find((x) => x.nid === ${ids.a}).alive`, 8000, 50).catch(() => null);
    await wait(800);
    await put(A, ids.a, 0);
    await A.js(`(() => { const me = __G.match.local; me.invuln = 0; me.special = 0; return 1; })()`);
    await wait(600);
  };
  const splatA = () => A.js(`(() => { const me = __G.match.local; me.invuln = 0; me.splat(null, 'test'); return 1; })()`);
  const startSp = (c, id) => c.js(`(() => { const me = __G.match.local; me.specialId = '${id}'; me.special = me.specialCost(); me._startSpecial(); return me.specialActive ? me.specialActive.id : '${id}'; })()`);
  await parkFoes();
  await put(A, ids.a, 0); await put(A, ids.c, 13); await put(B, ids.b, 6);
  await wait(1200);

  // ============================================================================================ the Bubble Guard chain
  if (want('chain')) {
    const sh = (c) => J(c, `(() => { const m = __G.match, f = (n) => m.actors.find((x) => x.nid === n); const o = {};
      for (const [k, n] of [['A', ${ids.a}], ['B', ${ids.b}], ['C', ${ids.c}]]) { const x = f(n); o[k] = { t: +(x.status.shield || 0).toFixed(2), chain: x._shieldChain ? x._shieldChain.nid : null, alive: x.alive }; }
      const cA = f(${ids.a})._shieldChain, cB = f(${ids.b})._shieldChain, cC = f(${ids.c})._shieldChain; o.same = { AB: !!cA && cA === cB, BC: !!cB && cB === cC }; o.stats = { ...__G.bubbleChain.CHAIN_STATS }; return o; })()`);
    const s0 = { A: (await sh(A)).stats, B: (await sh(B)).stats };
    await startSp(A, 'bubbler');
    await wait(1000);
    // B steps up to A (B's screen moves B: it decides B's copy and records it)
    await put(B, ids.b, 0.9);
    const bGot = await B.until(`__G.match.local.status.shield > 0`, 4000, 30).then(() => true, () => false);
    const onB1 = await sh(B);
    const aHeard = await A.until(`__G.match.actors.find((x) => x.nid === ${ids.b}).status.shield > 0`, 4000, 30).then(() => true, () => false);
    const onA1 = await sh(A);
    R('chain: A\'s Bubble Guard → B by touch on B\'s screen (B\'s copy: the time left on A\'s, not a fresh 6.5 s), and A\'s screen hears it (B\'s record) — the same chain on both',
      bGot && aHeard && onB1.B.t > 3 && onB1.B.t < 6.1 && Math.abs(onB1.B.t - onB1.A.t) < 0.25 && onA1.B.t > 3 && Math.abs(onA1.B.t - onA1.A.t) < 0.15 && onA1.same.AB && onB1.same.AB,
      { onB: { A: onB1.A, B: onB1.B, same: onB1.same }, onA: { A: onA1.A, B: onA1.B, same: onA1.same } });
    // A splatted: B's copy stays, on both screens
    await splatA();
    await B.until(`!__G.match.actors.find((x) => x.nid === ${ids.a}).alive`, 4000, 30).catch(() => null);
    await wait(300);
    const onA2 = await sh(A), onB2 = await sh(B);
    R('chain: A splatted — B\'s copy outlives it on both screens (keeps its time)', !onA2.A.alive && !onB2.A.alive && onA2.B.t > 2.5 && onB2.B.t > 2.5 && Math.abs(onA2.B.t - onB2.B.t) < 0.5, { onA: onA2, onB: onB2 });
    // B walks over to C (the host's bot): the host's screen decides C's copy from B's (B's synced position)
    await put(B, ids.b, 12.1);
    const cGot = await A.until(`__G.match.actors.find((x) => x.nid === ${ids.c}).status.shield > 0`, 4000, 30).then(() => true, () => false);
    const onA3 = await sh(A);
    const bHeard = await B.until(`__G.match.actors.find((x) => x.nid === ${ids.c}).status.shield > 0`, 4000, 30).then(() => true, () => false);
    const onB3 = await sh(B);
    if (opt.shots !== undefined) {
      await B.js(`(() => { const g = window.__inkwave, me = __G.match.local; me.aimYaw = me.yaw = Math.atan2(${-S.dx}, ${-S.dz}) + 0.9; me.aimPitch = -0.15; if (g.rig) { g.rig.yaw = me.yaw; g.rig.pitch = -0.2; } return 1; })()`);
      await wait(400);
      const f = await B.shot(`${out}/sprules-net-chain-B.jpg`);
      say('shot', JSON.stringify(f));
    }
    R('chain: B → C by touch with A gone (the host\'s screen decides: C is its bot) — C\'s copy the time left on B\'s; B\'s screen hears it; one chain on both screens',
      cGot && bHeard && onA3.C.t > 1.5 && Math.abs(onA3.C.t - onA3.B.t) < 0.15 && Math.abs(onB3.C.t - onB3.B.t) < 0.15 && onA3.same.BC && onB3.same.BC && onA3.C.chain === ids.a && onB3.C.chain === ids.a,
      { onA: { B: onA3.B, C: onA3.C, same: onA3.same }, onB: { B: onB3.B, C: onB3.C, same: onB3.same } });
    // together till the end: no more shares; both run out together on each screen
    const ends = (c) => c.js(`(() => { const E = window.__ends = {}; const f = (n) => __G.match.actors.find((x) => x.nid === n); const t0 = performance.now();
      window.__endI = setInterval(() => { for (const [k, n] of [['B', ${ids.b}], ['C', ${ids.c}]]) if (!(f(n).status.shield > 0) && E[k] == null) E[k] = +((performance.now() - t0) / 1000).toFixed(2); }, 20); return 1; })()`);
    await ends(A); await ends(B);
    await A.until(`window.__ends.B != null && window.__ends.C != null`, 9000, 100).catch(() => null);
    await B.until(`window.__ends.B != null && window.__ends.C != null`, 9000, 100).catch(() => null);
    const eA = await J(A, `window.__ends`), eB = await J(B, `window.__ends`);
    for (const c of [A, B]) await c.js(`clearInterval(window.__endI); 1`);
    const s1 = { A: (await sh(A)).stats, B: (await sh(B)).stats };
    const d = (k, s) => s1[k][s] - s0[k][s];
    R('chain: B and C run out together on each screen (within 0.15 s: a copy heard from a record runs to the chain\'s end there, not a hop of latency later; no refresh loop: the host gave one copy, the guest one, each heard the other\'s once)',
      eA.B != null && eA.C != null && Math.abs(eA.B - eA.C) < 0.15 && eB.B != null && eB.C != null && Math.abs(eB.B - eB.C) < 0.15 && d('A', 'shares') === 1 && d('A', 'net') === 1 && d('B', 'shares') === 1 && d('B', 'net') === 1,
      { endsA: eA, endsB: eB, host: { shares: d('A', 'shares'), heard: d('A', 'net') }, guest: { shares: d('B', 'shares'), heard: d('B', 'net') } });
    await respawnA();
  }

  // ============================================================================================ survives its owner
  if (want('survive')) {
    await put(B, ids.b, 14, 3);
    await A.js(`(() => { const me = __G.match.local; me.aimYaw = me.yaw = Math.atan2(${S.dx}, ${S.dz}); me.aimPitch = 0; window.__spHook = (a, it) => { if (a === me) { a.aimYaw = a.yaw = Math.atan2(${S.dx}, ${S.dz}); a.aimPitch = window.__pitch || 0; } }; return 1; })()`);
    await wait(500);
    // ---- the Whirl Boomerang: thrown, A splatted while it hovers; B's screen follows it home to where A went down
    await B.js(`(() => { const K = window.__SK.boomerang; window.__bm = { states: [], it: null }; window.__bmI = setInterval(() => { const it = K._items.find((x) => x.ghost && x.owner.nid === ${ids.a});
      const W = window.__bm; if (it) { W.it = it; if (W.states[W.states.length - 1] !== it.state) W.states.push(it.state); } }, 15); return 1; })()`);
    await A.js(`(async () => { const { SUBS } = await import('./src/config.js'); const me = __G.match.local; me.setSub('boomerang'); __G.subs.use(me, SUBS.boomerang);
      const K = window.__SK.boomerang; window.__bmA = K._items.find((x) => !x.ghost && x.owner === me); return 1; })()`);
    await wait(1100);
    const spotA = await J(A, `(() => { const p = __G.match.local.pos; return [p.x, p.y, p.z]; })()`);
    await splatA();
    await B.until(`window.__bm.it && window.__bm.it.state === 'dead'`, 9000, 50).catch(() => null);
    await A.until(`window.__bmA && window.__bmA.state === 'dead'`, 9000, 50).catch(() => null);
    const bmB = await J(B, `(() => { clearInterval(window.__bmI); const W = window.__bm, it = W.it; return it ? { states: W.states, blasted: it.blasted, pos: [it.pos.x, it.pos.y, it.pos.z], home: it.home ? [it.home.pos.x, it.home.pos.y, it.home.pos.z] : null } : null; })()`);
    const bmA = await J(A, `(() => { const it = window.__bmA; return it ? { state: it.state, blasted: it.blasted, pos: [it.pos.x, it.pos.y, it.pos.z] } : null; })()`);
    const hd = (p, q) => (p && q ? Math.hypot(p[0] - q[0], p[2] - q[2]) : 99);
    R('survive: A\'s Whirl Boomerang outlives A on B\'s screen — no fizzle; it whirls home to where A went down, circles and bursts there (A\'s burst record), as on A\'s screen',
      bmB && bmA && bmB.blasted && bmA.blasted && !bmB.states.includes('fizzle') && bmB.states.includes('back') && bmB.states.includes('orbit') && hd(bmB.home, spotA) < 1.0 && hd(bmB.pos, spotA) < 2.5 && hd(bmA.pos, bmB.pos) < 0.05,
      { B: bmB, A: bmA, spotA: spotA.map((v) => +v.toFixed(2)) });
    await respawnA();
    // ---- the Drainbow: A splatted a second in; it stands on both screens for the rest of its life
    const life = await J(A, `(async () => { const { SPECIALS } = await import('./src/config.js'); return SPECIALS.drainbow.duration; })()`);
    await startSp(A, 'drainbow');
    await B.until(`__G.drainbow.bubbles.some((b) => b.live && b.ghost)`, 6000, 30).catch(() => null);
    const watch = (c, ghost) => c.js(`(() => { const b = __G.drainbow.bubbles.find((x) => x.live && x.ghost === ${ghost}); window.__db = { b, popT: null }; window.__dbI = setInterval(() => { const W = window.__db; if (W.b && !W.b.live && W.popT == null) W.popT = +W.b.t.toFixed(2); }, 20); return !!b; })()`);
    await watch(A, false); await watch(B, true);
    await wait(1000);
    await splatA();
    await wait(1500);
    const mid = async (c) => J(c, `(() => { const b = window.__db.b; return b ? { live: b.live, orphan: b.orphan, t: +b.t.toFixed(2), life: b.life } : null; })()`);
    const mA = await mid(A), mB = await mid(B);
    await B.until(`window.__db.popT != null`, 12000, 50).catch(() => null);
    await A.until(`window.__db.popT != null`, 4000, 50).catch(() => null);
    const pop = async (c) => J(c, `(() => { clearInterval(window.__dbI); const W = window.__db; return { popT: W.popT, reason: W.b && W.b.popReason, life: W.b && W.b.life }; })()`);
    const pA = await pop(A), pB = await pop(B);
    R(`survive: A's Drainbow outlives A — still up on both screens after the splat (orphaned), then pops on time (${life} s: 'time', not 'lost') on both`,
      mA && mB && mA.live && mB.live && mA.orphan && mB.orphan && pA.popT != null && pB.popT != null && Math.abs(pA.popT - life) < 0.15 && Math.abs(pB.popT - life) < 0.15 && pA.reason === 'time' && pB.reason === 'time',
      { mid: { A: mA, B: mB }, pop: { A: pA, B: pB } });
    await respawnA();
    // ---- the Ink Tempest: thrown, A splatted at once; B's screen sees its cloud rain its whole life
    const dur = await J(A, `(async () => { const { SPECIALS } = await import('./src/config.js'); return SPECIALS.storm.duration; })()`);
    await B.js(`(() => { window.__cl = { max: 0, seen: false, gone: false }; window.__clI = setInterval(() => { const c = __G.projectiles.clouds.find((x) => x.owner.nid === ${ids.a}); const W = window.__cl;
      if (c) { W.seen = true; W.max = Math.max(W.max, c.t); W.ghost = !!c.ghost; } else if (W.seen) W.gone = true; }, 20); return 1; })()`);
    await A.js(`(() => { window.__pitch = 0.25; return 1; })()`);
    await wait(100);
    await startSp(A, 'storm');
    await wait(120);
    await splatA();
    await B.until(`window.__cl.gone`, dur * 1000 + 6000, 100).catch(() => null);
    const cl = await J(B, `(() => { clearInterval(window.__clI); const W = window.__cl; return { seen: W.seen, ghost: W.ghost, life: +W.max.toFixed(2), gone: W.gone }; })()`);
    R(`survive: A's Ink Tempest, thrown and A splatted at once — B's screen sees its cloud rain its whole life (${dur} s)`, cl.seen && cl.ghost && cl.life > dur - 0.15 && cl.gone, cl);
    await A.js(`(() => { window.__pitch = 0; return 1; })()`);
    await respawnA();
    // ---- Surf N' Turf: anchored, A splatted; B's screen sees every ring go out, then the buoy go (not popped)
    const pulses = await J(A, `(async () => { const { SPECIALS } = await import('./src/config.js'); return SPECIALS.surf.pulses; })()`);
    await A.js(`(async () => { const S = await import('./src/game/sp-surf.js'), THREE = await import('three'); const me = __G.match.local; me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial();
      const s = me.specialActive; s.botVel = new THREE.Vector3(${S.dx} * 2, 3, ${S.dz} * 2); S.IMPL.throwIt(me, s); return 1; })()`);
    await A.until(`__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live')`, 6000, 50).catch(() => null);
    await B.until(`__G.specials.world.some((w) => w.kind === 'surf' && w.phase === 'live')`, 6000, 50).catch(() => null);
    const st0 = await J(A, `(async () => { const S = (await import('./src/game/sp-surf.js')).SURF_STATS; return { popped: S.popped, lost: S.lost }; })()`);
    await B.js(`(() => { window.__sf = { n: 0, gone: false, b: __G.specials.world.find((w) => w.kind === 'surf' && w.ghost) }; window.__sfI = setInterval(() => { const W = window.__sf; if (!W.b) return;
      W.n = Math.max(W.n, W.b.rings.filter((r) => r.state !== 'wait').length); W.done = W.b.rings.filter((r) => r.state === 'done' || r.r >= r.R - 0.05).length; if (!__G.specials.world.includes(W.b)) W.gone = true; }, 20); return !!window.__sf.b; })()`);
    const ringsAt = await J(B, `window.__sf.b ? window.__sf.b.rings.filter((r) => r.state !== 'wait').length : -1`);
    await splatA();
    await B.until(`window.__sf.gone`, 20000, 100).catch(() => null);
    await A.until(`!__G.specials.world.some((w) => w.kind === 'surf')`, 3000, 50).catch(() => null);
    const sf = await J(B, `(() => { clearInterval(window.__sfI); return { rings: window.__sf.n, full: window.__sf.done, gone: window.__sf.gone }; })()`);
    const st1 = await J(A, `(async () => { const S = (await import('./src/game/sp-surf.js')).SURF_STATS; return { popped: S.popped, lost: S.lost, onA: __G.specials.world.some((w) => w.kind === 'surf') }; })()`);
    R(`survive: A's Surf N' Turf buoy outlives A — B's screen sees all ${pulses} rings go out to their full reach (${ringsAt} had left when A was splatted), then the buoy go as usual (not popped, not lost)`,
      ringsAt < pulses && sf.rings === pulses && sf.full === pulses && sf.gone && st1.popped === st0.popped && st1.lost === st0.lost && !st1.onA, { ringsAtSplat: ringsAt, B: sf, A: { st0, st1 } });
    await A.js(`(() => { window.__spHook = null; return 1; })()`);
    await respawnA();
  }

  // ============================================================================================ the guest's barrage
  if (want('barrage')) {
    // B throws (its own screen: a press then a release every 22 frames), aiming away down the line; A's screen collects
    // every object of B's it gets (bombs, subs, Waddles) as they appear
    await put(B, ids.b, 4, -2);
    await A.js(`(() => { const W = window.__seen = { kinds: [], set: new WeakSet() }; const f = () => __G.match.actors.find((x) => x.nid === ${ids.b});
      window.__seenI = setInterval(() => { const b = f(); const add = (o, k) => { if (!W.set.has(o)) { W.set.add(o); W.kinds.push(k); } };
        for (const x of __G.projectiles.bombs) if (x.owner === b && x.kind === 'bomb') add(x, 'bomb');
        for (const x of __G.subs.items) if (x.owner === b) add(x, x.kind);
        for (const x of window.__SK.waddle.items) if (x.owner === b) add(x, 'waddle'); }, 15); return 1; })()`);
    const runBarrage = async (id, n) => {
      await A.js(`(() => { window.__seen.kinds.length = 0; return 1; })()`);
      await B.js(`(() => { window.__sp.throws.length = 0; const me = __G.match.local; me.specialId = '${id}'; me.special = me.specialCost(); me._startSpecial(); me.specialActive.dur = 60;
        let k = 0; window.__spHook = (a, it) => { if (a !== me) return; a.aimYaw = a.yaw = Math.atan2(${S.dx}, ${S.dz}) + 0.4; a.aimPitch = 0.25; if (window.__sp.throws.length >= ${n}) return; k++; if (k % 22 === 0) it.sub = true; }; return 1; })()`);
      await B.until(`window.__sp.throws.length >= ${n}`, 30000, 100).catch(() => null);
      await wait(250);
      // the bomb in B's hand right now, on both screens (A's: from B's records)
      const handB = await J(B, `(() => { const me = __G.match.local, s = me.specialActive; return { next: s && s.bomb.kind, hand: me.character.bomb ? me.character.bomb.kind : null }; })()`);
      await wait(400);
      const onA = await J(A, `(() => { const b = __G.match.actors.find((x) => x.nid === ${ids.b}), s = b.specialActive; return { id: s && s.id, ghost: !!(s && s.ghost), next: s && s.bomb && s.bomb.kind, hand: b.character.bomb ? b.character.bomb.kind : null }; })()`);
      await wait(1200);
      const thrown = await J(B, `window.__sp.throws`), seen = await J(A, `window.__seen.kinds`);
      await B.js(`(() => { window.__spHook = null; const me = __G.match.local; if (me.specialActive) __G.specials.end(me, 'time'); return 1; })()`);
      await wait(600);
      const ended = await J(A, `!__G.match.actors.find((x) => x.nid === ${ids.b}).specialActive`);
      const tally = (L) => L.reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {});
      return { handB, onA, thrown, seen, tB: tally(thrown), tA: tally(seen), ended };
    };
    const my = await runBarrage('barrage_mystery', 12);
    const kinds = Object.keys(my.tB);
    R('barrage: the guest\'s Mystery Bomb Barrage on the host\'s screen — B\'s running special, the next bomb in B\'s hand there as on B\'s screen (its [4, \'nb\'] records)',
      my.onA.id === 'barrage_mystery' && my.onA.ghost && my.onA.next === my.handB.next && my.onA.hand === my.handB.next && my.handB.hand === my.handB.next, { B: my.handB, A: my.onA });
    R(`barrage: …and every bomb B threw shows up on the host's screen, kind for kind (${my.thrown.length} throws, ${kinds.length} kinds: a different one each throw)`,
      my.thrown.length >= 12 && kinds.length === 6 && Object.keys(my.tA).length === kinds.length && kinds.every((k) => my.tA[k] === my.tB[k]) && my.seen.length === my.thrown.length
      && my.thrown.every((k, i) => i === 0 || k !== my.thrown[i - 1]) && my.ended,
      { thrownByB: my.thrown, seenByA: my.seen, tB: my.tB, tA: my.tA, endedOnA: my.ended });
    const wd = await runBarrage('barrage_waddle', 4);
    R('barrage: the guest\'s Waddle Bomb Barrage on the host\'s screen — its special, a Waddle in B\'s hand, every Waddle B threw',
      wd.onA.id === 'barrage_waddle' && wd.onA.hand === 'waddle' && wd.thrown.length >= 4 && wd.thrown.every((k) => k === 'waddle') && wd.seen.length === wd.thrown.length && wd.seen.every((k) => k === 'waddle') && wd.ended,
      { thrownByB: wd.thrown.length, seenByA: wd.seen, A: wd.onA });
    await A.js(`clearInterval(window.__seenI); 1`);
  }
  const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 5));
};
