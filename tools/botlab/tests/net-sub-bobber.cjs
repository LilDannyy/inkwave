// [b5-subs] Chain Bobber online (src/game/kits/bobber.js; docs/NET.md "Chain Bobber"), real clients on the local relay
// (netpage.cjs): the host (A) and the guest (B) on the SAME team (a team shot is the trigger), the bots filling the rest
// (A owns them all: the enemy team's bots are A's).
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-bobber.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan)
// Checks (SPEC C10.9, §0.4):
//  - A lays a 3-chain: B's ghosts float exactly where A's do (the owner's rounded [3]), and B draws exactly A's tether list
//    (the [5]; ghosts never link);
//  - B's team shot (a real round of B's) on A's ghost sets the chain off on A (within 0.3 s on the local relay, through
//    'bobberPop' crediting B); both screens blow the same bobbers in the same breadth-first order at 0.07 s hops; an
//    enemy bot by the chain (A's: judged on A's screen) is splatted by it — the splat A's, the assist B's, on both screens;
//  - B's enemy shot (on a bobber of an enemy bot of A's) disarms it on A's screen (netHurt 'bobber' with B as `by`) and
//    B's ghost sags with it; a ghost's round passing through a real bobber on its owner's screen does nothing;
//  - damage is judged where the victim is owned: an enemy bot's chain (A's screen) blows by B — B's own screen hurts B
//    (once, the chain's ledger), A's screen never applies it (B is remote there) and learns of it from B's [6];
//  - B lays 6 and leaves: on A all 6 ghosts are gone at once (dropOwner from onLeave, before B's squidkid is taken over),
//    no blast, and a round through their spots meets nothing of theirs.
module.exports = async ({ clients, R, wait, say, args, open, close }) => {
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
  await A.js(`__G.net.setSettings({ mode: 'turf', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 6, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] !== teams[1]) { await B.js(`__G.net.setMe({ team: ${teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('turf up');
  for (const c of [A, B]) if (!(await c.js('!!__G.match.local.bot'))) throw new Error(`c${c.i}: its own kid has no brain (an ?autopilot client is needed)`);
  // everyone's own squidkids stand still (each screen stubs the brains it runs); helpers and listeners on both screens
  const setup = (c) => c.js(`(async () => {
    for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__bobHook?.(a, it); }; }
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear();
    const { on } = await import('./src/core/ctx.js'), REG = await import('./src/game/kits/registry.js'), THREE = await import('three');
    const K = REG.SUB_KITS.bobber;
    const L = window.__bob = { ev: [], K, THREE };
    for (const n of ['bomb:explode', 'bobber:trigger', 'device:down', 'hit', 'splatted', 'assist']) on(n, (e) => {
      if (n === 'bomb:explode' && e.kind !== 'bobber') return;
      if (n === 'hit' && e.weaponId !== 'bobber') return;
      if (n === 'device:down' && e.kind !== 'bobber') return;
      L.ev.push({ n, t: Date.now(), att: (e.attacker || e.actor || e.by)?.nid ?? null, by: e.by?.nid ?? null, vic: e.victim?.nid ?? null, dmg: e.damage ?? null, how: e.how ?? null, cause: e.cause ?? null,
        n2: e.n ?? null, ghost: e.ghost ?? null, pos: e.pos ? [+e.pos.x.toFixed(2), +e.pos.y.toFixed(2), +e.pos.z.toFixed(2)] : null, as: e.assists ? e.assists.map((x) => x.nid) : null });
    });
    L.byNid = (n) => __G.match.actors.find((q) => q.nid === n);
    L.mine = () => K.items.filter((x) => !x.ghost && x.state === 'live');
    L.ghosts = () => K.items.filter((x) => x.ghost && x.state === 'live');
    L.at = (gid) => { const x = K.items.find((q) => q.gid === gid); return x ? { s: x.state, p: [x.spot.x, x.spot.y, x.spot.z], ghost: x.ghost } : null; };
    L.pairs = (ghost) => { const o = []; for (const x of K.items) if (!!x.ghost === ghost && x.state === 'live') for (const t of x.ten) if (x.gid < t.gid) o.push([x.gid, t.gid]); return o.sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
    // a round of this screen's actor a (a real one of theirs) from p along d
    L.shoot = (nid, p, d) => { const a = L.byNid(nid); __G.projectiles.fireCustom(a, new THREE.Vector3(...p), new THREE.Vector3(...d).normalize(), { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); return 1; };
    // a bobber of actor nid dropped from just over (x, y, z)
    L.drop = (nid, x, y, z) => K.throwFrom(L.byNid(nid), new THREE.Vector3(x, y + 0.6, z), new THREE.Vector3(0, -3, 0)).gid;
    L.place = (nid, x, y, z) => { const a = L.byNid(nid); a.pos.set(x, y + 0.02, z); a.vel.set(0, 0, 0); return 1; };
    return 1; })()`);
  await setup(A); await setup(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me), foes = m.actors.filter((x) => x.isBot && x.team !== me.team);
    return { a: me.nid, b: him.nid, ta: me.team, tb: him.team, foes: foes.map((x) => x.nid) }; })()`);
  R('A and B are on the same team; the other team is A\'s bots', ids.ta === ids.tb && ids.foes.length >= 3, ids);
  // a flat open spot near the middle (no drop or wall within 7 m)
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const flat = (n) => { for (let r = 1.5; r <= 5.5; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) return false; } return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    const pads = L.spawnPads, far = (n) => pads.every((q) => Math.hypot(n.x - q.x, n.z - q.z) > (L.spawnBarrier || 4) + 10);   // (no bobber near a pad: the spawn-trap rule)
    for (const n of S) if (far(n) && flat(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  const [px, py, pz] = P;
  // park everyone else off to the side (A moves its bots, each screen its own kid)
  await A.js(`(() => { let i = 0; for (const a of __G.match.actors) if (!a.remote && a.bot && a !== __G.match.local) { a.pos.set(${px} + 30 + (i % 3) * 1.5, ${py} + 50, ${pz} + Math.floor(i / 3) * 1.5); a.vel.set(0, 0, 0); a.invuln = 999; i++; } return 1; })()`);
  await A.js(`window.__bobHook = (a, it) => { if (a.__pin) { a.pos.set(...a.__pin); a.vel.set(0, 0, 0); } else if (a.isBot && a !== __G.match.local) { a.pos.y = Math.max(a.pos.y, ${py} + 50); a.vel.set(0, 0, 0); } }; 1`);
  await A.js(`(() => { __G.match.local.__pin = [${px} - 6, ${py} + 0.02, ${pz} - 10]; return 1; })()`);
  await B.js(`window.__bobHook = (a) => { if (a.__pin) { a.pos.set(...a.__pin); a.vel.set(0, 0, 0); } }; (() => { __G.match.local.__pin = [${px} + 6, ${py} + 0.02, ${pz} - 10]; return 1; })()`);
  await wait(600);

  // ============================================================================================ 1. a chain and its ghosts
  const g = [];
  for (const dx of [-3, 0, 3]) g.push(await A.js(`__bob.drop(${ids.a}, ${px + dx}, ${py}, ${pz})`));
  await A.until(`__bob.mine().length === 3`, 4000, 50);
  await B.until(`__bob.ghosts().length === 3 && __bob.pairs(true).length >= 2`, 6000, 50);
  await wait(300);
  const spotsA = [], spotsB = [];
  for (const gid of g) { spotsA.push(await J(A, `__bob.at(${gid})`)); spotsB.push(await J(B, `__bob.at(${gid})`)); }
  const pA = await J(A, `__bob.pairs(false)`), pB = await J(B, `__bob.pairs(true)`);
  R('A\'s 3-chain: B\'s ghosts float exactly where A\'s bobbers do (the owner\'s rounded [3])', spotsA.every((s, i) => s && spotsB[i] && spotsB[i].ghost && s.p.every((v, k) => Math.abs(v - spotsB[i].p[k]) < 1e-6)), { A: spotsA, B: spotsB });
  R('…and B draws exactly A\'s tether list (the owner\'s [5]; a ghost never links)', JSON.stringify(pA) === JSON.stringify(pB) && pA.length === 2, { A: pA, B: pB });

  // ============================================================================================ 2. B's team shot sets it off
  // an enemy bot (A's) by the middle one, low on hp: the chain splats it (judged on A's screen, where it's owned)
  const foe = ids.foes[0];
  await A.js(`(() => { const e = __bob.byNid(${foe}); e.__pin = [${px} + 0.6, ${py} + 0.02, ${pz} + 0.4]; e.pos.set(...e.__pin); e.invuln = 0; e.hp = 40; return 1; })()`);
  await wait(500);
  await A.js(`__bob.ev.length = 0; 1`); await B.js(`__bob.ev.length = 0; 1`);
  const asA0 = await J(A, `__bob.byNid(${ids.b}).stats.assists || 0`), asB0 = await J(B, `__bob.byNid(${ids.b}).stats.assists || 0`);
  const t0 = Date.now();
  // B's round straight down onto A's first bobber (its ghost on B's screen)
  await B.js(`(() => { const s = __bob.at(${g[0]}).p; return __bob.shoot(${ids.b}, [s[0], s[1] + 2.5, s[2]], [0, -1, 0]); })()`);
  await A.until(`__bob.ev.some((e) => e.n === 'bobber:trigger')`, 4000, 10);
  const tA = Date.now() - t0;
  await wait(1500);
  const evA = await J(A, `__bob.ev`), evB = await J(B, `__bob.ev`);
  const trA = evA.find((e) => e.n === 'bobber:trigger'), orderA = evA.filter((e) => e.n === 'bomb:explode').map((e) => e.pos.join()), orderB = evB.filter((e) => e.n === 'bomb:explode').map((e) => e.pos.join());
  const exA = evA.filter((e) => e.n === 'bomb:explode'), exB = evB.filter((e) => e.n === 'bomb:explode');
  const hopsA = exA.map((e) => e.t - exA[0].t), hopsB = exB.map((e) => e.t - exB[0].t);
  R(`B's team shot on A's ghost bobber sets A's chain off on A's screen in ${tA} ms (≤ 300 on the local relay; 'bobberPop', crediting B)`, !!trA && tA <= 300 && trA.by === ids.b && trA.n2 === 3, { tA, trigger: trA });
  R('both screens blow the same bobbers in the same breadth-first order (1, 2, 3), 0.07 s a hop on each', orderA.length === 3 && JSON.stringify(orderA) === JSON.stringify(orderB) && orderA[0] === spotsA[0].p.join() && orderA[2] === spotsA[2].p.join()
    && hopsA[2] >= 100 && hopsA[2] <= 260 && hopsB[2] >= 100 && hopsB[2] <= 260, { orderA, orderB, hopsA, hopsB });
  const splA = evA.find((e) => e.n === 'splatted' && e.vic === foe), splB = evB.find((e) => e.n === 'splatted' && e.vic === foe);
  const asA1 = await J(A, `__bob.byNid(${ids.b}).stats.assists || 0`), asB1 = await J(B, `__bob.byNid(${ids.b}).stats.assists || 0`);
  R('the enemy bot by it (A\'s: judged on A\'s screen) is splatted by A\'s chain — the splat A\'s, the assist B\'s (the trigger), on both screens', !!splA && splA.att === ids.a && splA.cause === 'bobber' && !!splB && asA1 === asA0 + 1 && asB1 === asB0 + 1,
    { splA, splB, assistsA: [asA0, asA1], assistsB: [asB0, asB1] });

  // ============================================================================================ 3. B's enemy shot disarms
  const foe2 = ids.foes[1];
  await A.js(`(() => { const e = __bob.byNid(${foe2}); e.__pin = [${px} - 8, ${py} + 0.02, ${pz} + 8]; e.pos.set(...e.__pin); return 1; })()`);
  const ge = await A.js(`__bob.drop(${foe2}, ${px}, ${py}, ${pz} + 4)`);
  await B.until(`(() => { const x = __bob.at(${ge}); return x && x.s === 'live'; })()`, 6000, 50);
  await A.js(`__bob.ev.length = 0; 1`); await B.js(`__bob.ev.length = 0; 1`);
  await B.js(`(() => { const s = __bob.at(${ge}).p; return __bob.shoot(${ids.b}, [s[0] + 4, s[1], s[2]], [-1, 0, 0]); })()`);
  await A.until(`(() => { const x = __bob.at(${ge}); return !x || x.s !== 'live'; })()`, 3000, 20).catch(() => null);
  await B.until(`(() => { const x = __bob.at(${ge}); return !x || x.s !== 'live'; })()`, 3000, 20).catch(() => null);
  await wait(400);
  const dA = (await J(A, `__bob.ev`)).filter((e) => e.n === 'device:down'), stA = await J(A, `__bob.at(${ge})`), stB = await J(B, `__bob.at(${ge})`);
  R('B\'s enemy round on an enemy bot\'s bobber (its ghost on B\'s screen) disarms it on its owner\'s screen (A: \'device:down\' shot, by B) and B\'s ghost sags with it — no blast', dA.length === 1 && dA[0].how === 'shot' && dA[0].by === ids.b
    && (!stA || stA.s !== 'live') && (!stB || stB.s !== 'live') && !(await J(A, `__bob.ev`)).some((e) => e.n === 'bomb:explode'), { downs: dA, A: stA, B: stB });

  // ============================================================================================ 4. the victim's screen judges
  // an enemy bot's lone bobber by B: A's screen sets it off (A owns that bot); B's own screen hurts B, A's never does
  const foe3 = ids.foes[2];
  const bPos = [px + 6, py + 0.02, pz - 10];
  await A.js(`(() => { const e = __bob.byNid(${foe3}); e.__pin = [${px} + 6, ${py} + 0.02, ${pz} - 18]; e.pos.set(...e.__pin); return 1; })()`);
  const gv = await A.js(`__bob.drop(${foe3}, ${bPos[0]}, ${py}, ${bPos[2]} + 0.3)`);
  await B.until(`(() => { const x = __bob.at(${gv}); return x && x.s === 'live'; })()`, 6000, 50);
  await B.js(`(() => { const me = __G.match.local; me.hp = 100; me.invuln = 0; return 1; })()`);
  await wait(300);
  await A.js(`__bob.ev.length = 0; 1`); await B.js(`__bob.ev.length = 0; 1`);
  const hpA0 = await J(A, `__bob.byNid(${ids.b}).hp`);
  await A.js(`(() => { const it = __bob.K.items.find((x) => x.gid === ${gv}); __bob.K.trigger(it, __bob.byNid(${foe3})); return 1; })()`);
  await B.until(`__bob.ev.some((e) => e.n === 'bomb:explode')`, 3000, 20).catch(() => null);
  await wait(900);
  const evA4 = await J(A, `__bob.ev`), evB4 = await J(B, `__bob.ev`);
  const hitsB = evB4.filter((e) => e.n === 'hit' && e.vic === ids.b), hitsA = evA4.filter((e) => e.n === 'hit' && e.vic === ids.b);
  const caughtA = await J(A, `(() => { const g2 = __bob.K.groups.get(${gv}); return g2 ? [...g2.caught].map((x) => x.nid) : null; })()`);
  const hpB = await J(B, `__G.match.local.hp`);
  R('damage is judged where the victim is owned: an enemy bot\'s bobber (set off on A\'s screen) blowing by B hurts B on B\'s own screen, once (60: a lone one at its centre); A\'s screen applies nothing to B (remote there) and learns of the hit from B\'s [6]',
    hitsB.length === 1 && Math.abs(hitsB[0].dmg - 60) < 1.5 && hpB <= 100 - 55 && hitsA.length === 0 && Array.isArray(caughtA) && caughtA.includes(ids.b), { hitsB, hitsA: hitsA.length, hpB, hpA0, caughtA });

  // ============================================================================================ 5. B lays 6 and leaves
  await B.js(`(() => { const me = __G.match.local; me.hp = 100; for (let i = 0; i < 6; i++) __bob.drop(${ids.b}, ${px} - 7.5 + i * 3, ${py}, ${pz} + 10); return 1; })()`);
  await A.until(`__bob.ghosts().filter((x) => x.owner.nid === ${ids.b}).length === 6`, 8000, 50);
  const spots6 = await J(A, `__bob.ghosts().filter((x) => x.owner.nid === ${ids.b}).map((x) => [x.spot.x, x.spot.y, x.spot.z])`);
  const idB = await B.js('__G.net.myId');
  // (the moment onLeave runs on A, before B's squidkid is taken over: how many of B's bobbers are left there)
  await A.js(`(() => { const nm = __G.netm, ol = nm.onLeave.bind(nm); window.__leftN = null; nm.onLeave = (id, hc) => { const b = __bob.byNid(${ids.b}); ol(id, hc); window.__leftN = __bob.K.items.filter((x) => x.owner === b && x.state !== 'dead').length; window.__leftOwner = b && b.owner; }; __bob.ev.length = 0; return 1; })()`);
  close(1);
  await A.until(`window.__leftN !== null`, 20000, 50);
  const leftN = await J(A, `window.__leftN`);
  await wait(400);
  const blasts = (await J(A, `__bob.ev`)).filter((e) => e.n === 'bomb:explode').length;
  // a round of A's through where they floated: nothing of B's absorbs it
  const through = await J(A, `(() => { const T = __bob.THREE, out = []; for (const s of ${JSON.stringify(spots6)}) out.push(__G.subs.blockShot(new T.Vector3(s[0], s[1] + 1, s[2]), new T.Vector3(s[0], s[1] - 1, s[2]), ${ids.ta}, 36, __G.match.local)); return out; })()`);
  R('B lays 6 and leaves: on A every one of B\'s ghosts is gone at once (dropOwner, in onLeave before B\'s squidkid is taken over), no blast; a round through their spots meets nothing',
    leftN === 0 && blasts === 0 && through.every((x) => x === false), { leftN, blasts, through, idB });
  const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU|ERR_CONNECTION|websocket|WebSocket/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 5));
};
