// Deployables online (batch 5, [b5-deploy]: src/game/deployables.js), with real clients on the local relay (netpage.cjs):
// the host (A) and the guest (B) on different teams.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-deploy.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan); 'scene=tower': Tower Command (below)
// scene shoot (Practice): A plants a Hop Beacon and throws a Twirl Sprinkler; B shoots each down on its own screen (real
//   rounds from B's kid): every hit goes to A (the owner's copy: its hp falls by each), B's hit marker on each, and at
//   0 A's copy breaks ('device:down' shot) and its end record [2, gid, 1] pops B's ghost with the pop look — both
//   screens agree (gone on both, the same number of shots).
// scene=tower (Tower Command): A rides the tower, after laying a Lurk Mine and a Hop Beacon on its deck. In its way: A's
//   own beacon and sprinkler, and a beacon B planted (B's own). On both screens the deck devices ride the tower at the
//   same spot of the deck; the tower crushes the three in its way — each judged by its owner's screen (A's two on A's,
//   B's on B's, against that screen's tower) and the crunch shows on both. Then B comes up onto the deck: A's mine (its
//   owner judges) trips on B there and blows there, hurting B (on B's screen), on both screens at the same spot.
module.exports = async ({ clients, R, wait, say, args, open }) => {
  // its hooks ride the local kids' brains (window.__depHook in the bots' update): the clients must be ?autopilot ones
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
  say(TOWER_SCENE ? 'tower command up' : 'practice up');
  for (const c of [A, B]) if (!(await c.js('!!__G.match.local.bot'))) throw new Error(`c${c.i}: its own kid has no brain (an ?autopilot client is needed: Q0=autopilot Q1=autopilot)`);
  // everyone's own squidkids stand still (each screen stubs the brains it runs); a test hook per frame; the page's helpers
  const setup = (c) => c.js(`(async () => {
    for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__depHook?.(a, it); }; }
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear();
    const { on } = await import('./src/core/ctx.js'), { SUBS } = await import('./src/config.js'), REG = await import('./src/game/kits/registry.js'), THREE = await import('three');
    const L = window.__dep = { ev: [], cues: [], SUBS, REG, THREE };
    for (const n of ['device:hit', 'device:down', 'sub:destroyed', 'bomb:explode', 'hit']) on(n, (e) => L.ev.push({ n, kind: e.kind, how: e.how, att: (e.attacker || e.by)?.nid ?? null, local: !!(e.attacker || e.by)?.isLocal, dmg: e.damage ?? e.dmg ?? null, w: e.weaponId || null, vic: e.victim?.nid ?? null, pos: e.pos ? [+e.pos.x.toFixed(2), +e.pos.y.toFixed(2), +e.pos.z.toFixed(2)] : null }));
    const one = __G.cues.one.bind(__G.cues); __G.cues.one = (name, o) => { L.cues.push(name); return one(name, o); };
    // a device of mine, by kind (the newest live one)
    L.mine = (kind, ghost = false) => __G.subs.items.filter((x) => x.kind === kind && !!x.ghost === ghost && x.state !== 'dead').pop();
    L.byGid = (gid) => __G.subs.items.find((x) => x.gid === gid);
    L.mid = (it) => { const n = it.normal || new THREE.Vector3(0, 1, 0), h = it.mesh.userData.hitH * 0.5; return new THREE.Vector3(it.pos.x + n.x * h, it.pos.y + n.y * h, it.pos.z + n.z * h); };
    // plant (as G.subs._place does: the owner's record goes out) at x, z where my kid stands
    L.plant = (kind, x, y, z) => { const me = __G.match.local; me.pos.set(x, y + 0.02, z); me.vel.set(0, 0, 0); __G.subs._place(me, SUBS[kind]); return L.mine(kind).gid; };
    // throw (as G.subs.use does: [0, gid, kind, from, vel])
    L.toss = (kind, from, vel) => { const me = __G.match.local, it = __G.subs._throw(me, SUBS[kind], from, vel, false), r = (v) => Math.round(v * 100) / 100;
      REG.netRec(me, 'subs', [0, it.gid, kind, r(from.x), r(from.y), r(from.z), r(vel.x), r(vel.y), r(vel.z)]); return it.gid; };
    return 1; })()`);
  await setup(A); await setup(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me); return { a: me.nid, b: him.nid, ta: me.team, tb: him.team }; })()`);
  R('A and B are on different teams', ids.ta !== ids.tb, ids);
  if (TOWER_SCENE) { await towerScene(); return; }

  // ============================================================================================ scene shoot
  // a flat open spot near the middle of the stage (A's screen finds it, both use it)
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const T = __dep.THREE, lvl = (x, z, n) => Math.abs(L.groundHeight(x, z, n.y + 1.5) - n.y) < 0.05;
    // level ground 3.5 m round it and along +x to 9 m (B's line), nothing overhead, nothing between
    const flat = (n) => { if (__G.physics.raycast(new T.Vector3(n.x, n.y + 0.3, n.z), new T.Vector3(0, 1, 0), 5).hit) return false;
      for (let r = 1; r <= 3.5; r += 1.25) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; if (!lvl(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n)) return false; }
      for (let x = 0; x <= 9; x += 0.75) for (const dz of [0, -2]) if (!lvl(n.x + x, n.z + dz, n)) return false;
      return __G.physics.los(new T.Vector3(n.x + 9, n.y + 1, n.z), new T.Vector3(n.x, n.y + 1, n.z)) && __G.physics.los(new T.Vector3(n.x + 9, n.y + 0.5, n.z - 2), new T.Vector3(n.x, n.y + 0.5, n.z - 2)); };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    for (const n of S) if (flat(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  // A stands at P: plants a beacon 2 m on (+x) and throws a sprinkler down 2 m the other side (−z); B stands 8 m off (+x)
  await A.js(`(() => { const me = __G.match.local; window.__depHook = (a) => { if (a === me) { a.pos.x = ${P[0]}; a.pos.z = ${P[2]}; a.vel.x = a.vel.z = 0; } }; return 1; })()`);
  await B.js(`(() => { const me = __G.match.local; window.__depHook = (a) => { if (a === me) { a.pos.x = ${P[0] + 8}; a.pos.z = ${P[2]}; a.vel.x = a.vel.z = 0; } }; me.pos.set(${P[0] + 8}, ${P[1]} + 0.02, ${P[2]}); return 1; })()`);
  await wait(500);
  const gBea = await J(A, `__dep.plant('beacon', ${P[0] + 2}, ${P[1]}, ${P[2]})`);
  await A.js(`(() => { const me = __G.match.local; me.pos.set(${P[0]}, ${P[1]} + 0.02, ${P[2]}); return 1; })()`);
  const gSpr = await J(A, `__dep.toss('sprinkler', new __dep.THREE.Vector3(${P[0] + 2}, ${P[1]} + 0.8, ${P[2] - 2}), new __dep.THREE.Vector3(0, -6, 0))`);
  await A.until(`__dep.byGid(${gSpr}) && __dep.byGid(${gSpr}).state === 'spray'`, 3000, 50).catch(() => null);
  const seen = await B.until(`(() => { const a = __dep.byGid(${gBea}), b = __dep.byGid(${gSpr}); return !!(a && a.ghost && a.state === 'beacon' && b && b.ghost && b.state === 'spray'); })()`, 6000, 50).then(() => true, () => false);
  const hp0 = await J(A, `[__dep.byGid(${gBea}).hp, __dep.byGid(${gSpr}).hp]`);
  R(`B sees A's beacon and sprinkler (ghosts from A's records); A's copies at full hp (${hp0.join(' / ')})`, seen && hp0[0] === 120 && hp0[1] === 100, { seen, hp0 });
  // B shoots each down: one straight round (36) every 0.3 s from its kid's eye at the device's middle, until it's gone
  // on B's screen (its ghost ends on A's word) — each round a real one of B's (recorded: A sees it fly)
  const shootDown = async (gid) => {
    const hpsA = [];
    let n = 0;
    for (; n < 12; n++) {
      const live = await J(B, `(() => { const d = __dep.byGid(${gid}); return !!(d && d.state !== 'dead'); })()`);
      if (!live) break;
      await B.js(`(() => { const me = __G.match.local, d = __dep.byGid(${gid}), m = __dep.mid(d), T = __dep.THREE; const from = new T.Vector3(m.x + 4, m.y, m.z); __G.projectiles.fireCustom(me, from, new T.Vector3(-1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); return 1; })()`);
      await wait(300);
      hpsA.push(await J(A, `(() => { const d = __dep.byGid(${gid}); return d && d.state !== 'dead' ? Math.round(d.hp) : 0; })()`));
    }
    return { n, hpsA };
  };
  const evB0 = (await J(B, `__dep.ev.length`)), evA0 = (await J(A, `__dep.ev.length`)), cB0 = await J(B, `__dep.cues.length`);
  const sb = await shootDown(gBea);
  const ss = await shootDown(gSpr);
  await wait(400);
  const endA = await J(A, `[__dep.byGid(${gBea})?.state ?? 'gone', __dep.byGid(${gSpr})?.state ?? 'gone']`);
  const endB = await J(B, `[__dep.byGid(${gBea})?.state ?? 'gone', __dep.byGid(${gSpr})?.state ?? 'gone']`);
  const evA = (await J(A, `__dep.ev`)).slice(evA0), evB = (await J(B, `__dep.ev`)).slice(evB0), cuesB = (await J(B, `__dep.cues`)).slice(cB0);
  const downA = evA.filter((e) => e.n === 'device:down' && e.how === 'shot').map((e) => e.kind);
  const markB = evB.filter((e) => e.n === 'device:hit' && e.local).length;
  R(`B shoots A's beacon down on B's screen: each hit reaches A's copy (A's hp ${sb.hpsA.join(' → ')}), ${sb.n} rounds of 36 (120 hp)`, sb.n === 4 && sb.hpsA.slice(0, 3).join() === '84,48,12' && sb.hpsA[3] === 0, sb);
  R(`…and the sprinkler (A's hp ${ss.hpsA.join(' → ')}), ${ss.n} rounds (100 hp)`, ss.n === 3 && ss.hpsA.slice(0, 2).join() === '64,28' && ss.hpsA[2] === 0, ss);
  R('both screens agree: gone on A (shot down: \'device:down\') and on B (A\'s end record [2, gid, 1]: the pop look, device_pop); B\'s hit marker on each of its hits',
    endA.every((s) => s === 'gone' || s === 'dead') && endB.every((s) => s === 'gone' || s === 'dead') && downA.includes('beacon') && downA.includes('sprinkler') && markB === sb.n + ss.n && cuesB.filter((c) => c === 'device_pop').length >= 2,
    { endA, endB, downA, markB, popB: cuesB.filter((c) => c === 'device_pop').length });
  const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 5));
  return;

  // ============================================================================================ scene=tower
  async function towerScene() {
    const hasT = await J(A, `!!__G.match.tower && !!__G.match.tower.block`);
    R('Tower Command is up with its tower (both screens)', hasT && await J(B, `!!__G.match.tower`), { map: MAP });
    if (!hasT) return;
    const dir = ids.ta === 0 ? 1 : -1;   // (the way A's team pushes it: +s for team 0)
    // B goes home; A lays a Lurk Mine and a Hop Beacon on the deck (standing there), then rides it
    await B.js(`(() => { const me = __G.match.local, p = __G.level.spawnPads[me.team]; window.__depHook = (a) => { if (a === me && !window.__bFree) { a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); } }; return 1; })()`);
    const deck = await J(A, `(() => { const T = __G.match.tower, c = Math.cos(T.yaw), s = Math.sin(T.yaw); const at = (lx, lz) => [T.pos.x + c * lx + s * lz, T.top, T.pos.z - s * lx + c * lz];
      const gm = __dep.plant('mine', ...at(-0.75, 0.75)), gb = __dep.plant('beacon', ...at(0.75, 0.75));
      const me = __G.match.local; window.__depHook = (a) => { if (a === me) { a.pos.set(T.pos.x - 0.6, T.top + 0.05, T.pos.z - 0.6); a.vel.set(0, 0, 0); } };
      return { gm, gb, mine: __dep.byGid(gm).on?.b.tag, beacon: __dep.byGid(gb).on?.b.tag }; })()`);
    R('A lays a Lurk Mine and a Hop Beacon on the tower\'s deck: they ride its block', deck.mine === 'tower' && deck.beacon === 'tower', deck);
    // in its way: A's beacon and sprinkler 4 / 5.5 m ahead (A's screen); B's beacon 7 m ahead (B plants it on its screen)
    const ahead = (c, k) => J(c, `(() => { const T = __G.match.tower, p = T.path.at(T.s + ${dir} * ${k}); return [p.x, p.y, p.z]; })()`);
    const a1 = await ahead(A, 4), a2 = await ahead(A, 5.5);
    const way = await J(A, `(() => { const me = __G.match.local; const g1 = __dep.plant('beacon', ${a1[0]}, ${a1[1]}, ${a1[2]});
      const g2 = __dep.toss('sprinkler', new __dep.THREE.Vector3(${a2[0]} + 0.3, ${a2[1]} + 0.8, ${a2[2]}), new __dep.THREE.Vector3(0, -6, 0)); return { g1, g2 }; })()`);
    const b1 = await ahead(B, 7);
    const wayB = await J(B, `(() => { __dep.ev.length = 0; const g = __dep.plant('beacon', ${b1[0]}, ${b1[1]}, ${b1[2]}); const me = __G.match.local, p = __G.level.spawnPads[me.team]; me.pos.set(p.x, p.y + 0.05, p.z); return g; })()`);
    await A.until(`!!__dep.byGid(${wayB})`, 4000, 50).catch(() => null);
    await B.until(`!!__dep.byGid(${way.g1}) && !!__dep.byGid(${way.g2}) && !!__dep.byGid(${deck.gm})`, 4000, 50).catch(() => null);
    await A.js(`__dep.cues.length = 0; __dep.ev.length = 0; 1`); await B.js(`__dep.cues.length = 0; 1`);
    // the deck devices on both screens: their spot on each screen's tower, sampled as it goes
    const sampler = (c) => c.js(`(() => { const S = window.__twS = []; const T = __G.match.tower; window.__twI = setInterval(() => { const m = __dep.byGid(${deck.gm}), b = __dep.byGid(${deck.gb}); if (!m || !b) return;
      S.push([+(m.pos.x - T.pos.x).toFixed(3), +(m.pos.y - T.top).toFixed(3), +(m.pos.z - T.pos.z).toFixed(3), +(b.pos.x - T.pos.x).toFixed(3), +(b.pos.z - T.pos.z).toFixed(3), +T.pos.x.toFixed(2), +T.pos.z.toFixed(2), m.on ? 1 : 0, b.on ? 1 : 0]); }, 50); return 1; })()`);
    await sampler(A); await sampler(B);
    const t0 = Date.now();
    const gone = (c, g) => `(() => { const d = __dep.byGid(${g}); return !d || d.state === 'dead'; })()`;
    await A.until(`${gone(A, way.g1)} && ${gone(A, way.g2)} && ${gone(A, wayB)}`, 30000, 100).catch(() => null);
    await B.until(`${gone(B, way.g1)} && ${gone(B, way.g2)} && ${gone(B, wayB)}`, 6000, 100).catch(() => null);
    await wait(600);
    for (const c of [A, B]) await c.js(`clearInterval(window.__twI); 1`);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const goneA = await J(A, `[${gone(A, way.g1)}, ${gone(A, way.g2)}, ${gone(A, wayB)}]`), goneB = await J(B, `[${gone(B, way.g1)}, ${gone(B, way.g2)}, ${gone(B, wayB)}]`);
    const crA = (await J(A, `__dep.cues`)).filter((x) => x === 'device_crunch').length, crB = (await J(B, `__dep.cues`)).filter((x) => x === 'device_crunch').length;
    const evA = await J(A, `__dep.ev`), evB = await J(B, `__dep.ev`);
    const crushA = evA.filter((e) => e.n === 'device:down' && e.how === 'crush').map((e) => e.kind), crushB = evB.filter((e) => e.n === 'device:down' && e.how === 'crush').map((e) => e.kind);
    R(`the tower crushes the three in its way (in ${secs} s), each judged by its owner (A's beacon and sprinkler on A's screen, B's beacon on B's), gone on both screens with the crunch on both`,
      goneA.every(Boolean) && goneB.every(Boolean) && crA >= 3 && crB >= 3 && crushA.filter((k) => k === 'beacon').length === 1 && crushA.includes('sprinkler') && crushB.filter((k) => k === 'beacon').length === 1,
      { goneA, goneB, crunches: [crA, crB], crushedHere: { A: crushA, B: crushB } });
    const SA = await J(A, `window.__twS`), SB = await J(B, `window.__twS`);
    const span = (S) => S.length ? Math.hypot(S[S.length - 1][5] - S[0][5], S[S.length - 1][6] - S[0][6]) : 0;
    const spread = (S) => { if (!S.length) return 99; let m = 0; for (const x of S) m = Math.max(m, Math.hypot(x[0] - S[0][0], x[2] - S[0][2]), Math.abs(x[1]), Math.hypot(x[3] - S[0][3], x[4] - S[0][4])); return m; };
    const oA = SA[SA.length - 1], oB = SB[SB.length - 1];
    R(`the Lurk Mine and the Hop Beacon on its deck ride the tower on both screens (A: ${span(SA).toFixed(2)} m, B: ${span(SB).toFixed(2)} m), at the same spot of the deck on each`,
      SA.length > 20 && SB.length > 20 && SA.every((x) => x[7] && x[8]) && SB.every((x) => x[7] && x[8]) && span(SA) > 2 && span(SB) > 2 && spread(SA) < 0.04 && spread(SB) < 0.04 && oA && oB && Math.hypot(oA[0] - oB[0], oA[2] - oB[2]) < 0.06 && Math.hypot(oA[3] - oB[3], oA[4] - oB[4]) < 0.06,
      { A: { n: SA.length, span: +span(SA).toFixed(2), spread: +spread(SA).toFixed(3), off: oA && oA.slice(0, 5) }, B: { n: SB.length, span: +span(SB).toFixed(2), spread: +spread(SB).toFixed(3), off: oB && oB.slice(0, 5) } });
    // B comes up onto the deck by A's mine (on B's screen: B's kid is B's to move); A's screen (its owner) trips it
    await A.js(`__dep.ev.length = 0; 1`); await B.js(`__dep.ev.length = 0; 1`);
    const hpB0 = await J(B, `__G.match.local.hp`);
    await B.js(`(() => { const me = __G.match.local, T = __G.match.tower; window.__bFree = true; me.invuln = 0; const m = __dep.byGid(${deck.gm});
      window.__depHook = (a) => { if (a === me) { const mm = __dep.byGid(${deck.gm}); const q = mm && mm.state !== 'dead' ? mm.pos : m.pos; a.pos.set(q.x + 0.8, T.top + 0.05, q.z + 0.3); a.vel.set(0, 0, 0); } }; return 1; })()`);
    const boomA = await A.until(`__dep.ev.some((e) => e.n === 'bomb:explode')`, 8000, 50).then(() => true, () => false);
    await B.until(`__dep.ev.some((e) => e.n === 'bomb:explode')`, 4000, 50).catch(() => null);
    await wait(500);
    const exA = (await J(A, `__dep.ev`)).find((e) => e.n === 'bomb:explode'), exB = (await J(B, `__dep.ev`)).find((e) => e.n === 'bomb:explode');
    const mineA = await J(A, `(() => { const T = __G.match.tower; return [T.pos.x, T.top, T.pos.z]; })()`);
    const hpB = await J(B, `__G.match.local.hp`), hitB = (await J(B, `__dep.ev`)).filter((e) => e.n === 'hit' && e.w === 'mine' && e.vic === ids.b);
    R(`B coming up onto the deck trips A's mine there (A's screen judges it) and it blows there on both screens (A ${exA && exA.pos}, B ${exB && exB.pos}), hurting B (${hpB0} → ${hpB} on B's screen)`,
      boomA && exA && exB && Math.hypot(exA.pos[0] - exB.pos[0], exA.pos[2] - exB.pos[2]) < 0.15 && Math.abs(exA.pos[1] - (mineA[1] + 0.3)) < 0.2 && (hpB < hpB0 || hitB.length > 0),
      { exA, exB, deckTop: mineA, hpB0, hpB, hitB });
    await B.js(`window.__depHook = null; 1`);
    const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
    R('no console errors on either screen', !errs.length, errs.slice(0, 5));
  }
};
