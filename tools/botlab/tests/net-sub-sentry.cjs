// [b5-subs] The Scrap Sentry online (src/game/kits/sentry.js; subs SPEC B8 / B10.9), with real clients on the local
// relay (netpage.cjs): the host (A) and the guest (B), on different teams, in Practice.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-sentry.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan); 'scene=tower': A's sentry on the moving tower's deck (Tower Command)
// Checks: A sets one down; B's ghost of it stands where A's does (the owner's [0]) and unfolds; B walks into its sight:
// B's screen shows the lock tell ([3]: 'sentry:lock' on the ghost) and its bursts ([6]: the replayed flashes); A's rounds
// hit B, judged on A's screen and applied on B's (the victim's owner: B's 'hit' events, its hp); B shoots the ghost:
// each round goes to A ('dh' with B as the attacker) — A's hp 120 → 84 → 48 → 12 → down, A's 'device:down'.by is B's
// actor (as A shows it) — and the end record [2, gid, 1] ends B's ghost; B sets its own down, A has its ghost; B leaves
// the room: A's ghost of it is gone at once (dropOwner from onLeave: within the same frame); no console errors.
// scene=tower: A on the deck sets one down there; the tower moves; on both screens it rides the deck, B's ghost at the
// owner's spot of the deck within 0.1 m (the owner's [4, gid, …, 'tower', …]).
module.exports = async ({ clients, R, wait, say, args, open }) => {
  for (const c of clients.slice(0, 2)) {
    if (/[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i} has no ?autopilot (run with Q0=autopilot Q1=autopilot) — reopening it with it`);
    await open(c.i, 'autopilot');
  }
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'saltpan', TOWER_SCENE = opt.scene === 'tower';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const JA = async (c, code) => JSON.parse(await c.js(`(${code}).then((x) => JSON.stringify(x === undefined ? null : x))`));   // (an async expression)
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: ${JSON.stringify(TOWER_SCENE ? 'tower' : 'practice')}, map: ${JSON.stringify(MAP)}, time: 'day', botCount: 0, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1]) { await B.js(`__G.net.setMe({ team: ${1 - teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team !== p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('match up');
  for (const c of [A, B]) if (!(await c.js('!!__G.match.local.bot'))) throw new Error(`c${c.i}: its own kid has no brain (an ?autopilot client is needed)`);
  // each screen's own kid stands still (its brain stubbed); a per-frame hook (window.__senHook); its sub the sentry
  const still = (c) => c.js(`(async () => { const { SUBS } = await import('./src/config.js'); for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__senHook?.(a, it); }; }
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear(); __G.match.local.setSub('sentry'); return 1; })()`);
  await still(A); await still(B);
  const listen = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const L = window.__sen = { locks: [], fires: [], hits: [], downs: [], dh: [] };
    on('sentry:lock', (e) => L.locks.push({ gid: e.obj.gid, ghost: !!e.obj.ghost, tgt: e.target ? e.target.nid : null, t: performance.now() }));
    on('sentry:fire', (e) => L.fires.push({ gid: e.obj.gid, ghost: !!e.ghost }));
    on('hit', (e) => { if (e.weaponId === 'sentry') L.hits.push({ att: e.attacker?.nid, vic: e.victim?.nid, d: e.damage, local: !!e.victim?.isLocal }); });
    on('device:down', (e) => { if (e.kind === 'sentry') L.downs.push({ how: e.how, by: e.by ? e.by.nid : null }); });
    const nm = __G.netm, msg = nm.onMessage; nm.onMessage = function (from, d) { if (d && d.k === 'dh' && d.kind === 'sentry') L.dh.push({ id: d.id, d: d.d, a: d.a }); return msg.apply(this, arguments); };
    return 1; })()`);
  await listen(A); await listen(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me); return { a: me.nid, b: him.nid, ta: me.team, tb: him.team }; })()`);
  R('A and B are on different teams', ids.ta !== ids.tb, ids);
  if (TOWER_SCENE) { await towerScene(); return; }

  // a flat open spot with a clear line along +x (A's screen finds it; both use it)
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes; const lvl = (x, z, y) => Math.abs(L.groundHeight(x, z, y + 1.5) - y) < 0.05;
    const v = (x, y, z) => new (__G.camera.position.constructor)(x, y, z);   // (a THREE.Vector3)
    const ok = (n) => { if (__G.physics.raycast(v(n.x, n.y + 0.3, n.z), v(0, 1, 0), 6).hit) return false;
      for (let r = 1; r <= 3; r++) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; if (!lvl(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y)) return false; }
      for (let x = -2; x <= 10; x += 0.75) if (!lvl(n.x + x, n.z, n.y)) return false;
      if (!__G.physics.los(v(n.x + 0.9, n.y + 0.55, n.z), v(n.x + 8, n.y + 1, n.z + 0.2))) return false;
      for (const p of L.spawnPads) if (Math.hypot(n.x - p.x, n.z - p.z) < 16) return false; return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z)); for (const n of S) if (ok(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  // A at P facing +x (its screen); B 7.9 m along (its own screen keeps it there, and alive)
  await A.js(`(() => { const me = __G.match.local; window.__senHook = (a) => { if (a !== me) return; a.pos.set(${P[0]}, ${P[1]} + 0.02, ${P[2]}); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = Math.PI / 2; }; return 1; })()`);
  await B.js(`(() => { const me = __G.match.local; window.__senHook = (a) => { if (a !== me) return; a.pos.set(${P[0] + 7.9}, ${P[1]} + 0.02, ${P[2] + 0.2}); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = -Math.PI / 2; a.hp = Math.max(a.hp, 60); a.invuln = 0; }; return 1; })()`);
  await wait(900);
  // 1) A sets one down
  await A.js(`(async () => { const { SUBS } = await import('./src/config.js'); __G.match.local.ink = 100; __G.subs.use(__G.match.local, SUBS.sentry); return 1; })()`);
  const sA = await JA(A, `(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const it = SUB_KITS.sentry.items.find((x) => !x.ghost); return it ? { gid: it.gid, pos: [it.pos.x, it.pos.y, it.pos.z] } : null; })()`);
  R('A sets its sentry down (0.9 m ahead of its feet)', !!sA && Math.abs(sA.pos[0] - (P[0] + 0.9)) < 0.05, sA);
  if (!sA) return;
  const ghostOn = (c, gid) => `(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const it = SUB_KITS.sentry.items.find((x) => x.gid === ${gid}); return it ? JSON.stringify({ ghost: it.ghost, state: it.state, pos: [it.pos.x, it.pos.y, it.pos.z], hp: it.hp, why: it.why }) : 'null'; })()`;
  await B.until(`import('./src/game/kits/registry.js').then((K) => K.SUB_KITS.sentry.items.some((x) => x.gid === ${sA.gid} && x.ghost))`, 6000, 50);
  await wait(800);
  const gB = JSON.parse(await B.js(ghostOn(B, sA.gid)));
  R('B\'s ghost of it stands where A\'s does (the owner\'s [0]) and has unfolded', gB && gB.ghost && gB.state === 'watch' && Math.hypot(gB.pos[0] - sA.pos[0], gB.pos[2] - sA.pos[2]) < 0.02, gB);
  // 2) its sight, lock and bursts (A's screen decides; B's ghost shows them); its rounds on B
  await wait(3200);
  const LA = await J(A, 'window.__sen'), LB = await J(B, 'window.__sen');
  const lockA = LA.locks.filter((l) => l.gid === sA.gid && !l.ghost && l.tgt === ids.b), lockB = LB.locks.filter((l) => l.gid === sA.gid && l.ghost && l.tgt === ids.b);
  const fireA = LA.fires.filter((f) => f.gid === sA.gid && !f.ghost).length, fireB = LB.fires.filter((f) => f.gid === sA.gid && f.ghost).length;
  R(`A's sentry locks onto B on A's screen (${lockA.length}) and B's ghost plays the lock tell ([3]: ${lockB.length})`, lockA.length >= 1 && lockB.length >= 1, { lockA: lockA.length, lockB: lockB.length });
  R(`its bursts: ${fireA} rounds on A's screen, ${fireB} replayed flashes on B's ([6]: 3 a burst)`, fireA >= 6 && fireB >= 6 && Math.abs(fireA - fireB) <= 3, { fireA, fireB });
  const hitsB = LB.hits.filter((h) => h.vic === ids.b && h.att === ids.a && h.local), hitsA = LA.hits.filter((h) => h.vic === ids.b && h.att === ids.a);
  R(`its rounds hit B: judged on A's screen (${hitsA.length} hits there), applied on B's — the victim's owner (${hitsB.length} 'hit' events of 22 there)`, hitsA.length >= 2 && hitsB.length >= 2 && hitsB.every((h) => Math.abs(h.d - 22) < 0.01), { hitsA: hitsA.length, hitsB: hitsB.length, d: hitsB.slice(0, 3).map((h) => h.d) });
  // 3) B shoots the ghost on its screen: each round goes to A (with B as the attacker); down at the 4th
  await A.js(`window.__senHook = null; 1`);
  const shootB = () => B.js(`(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const it = SUB_KITS.sentry.items.find((x) => x.gid === ${sA.gid}); const me = __G.match.local; if (!it) return 0;
    const V = __G.camera.position.constructor, from = new V(it.pos.x + 3, it.pos.y + 0.36, it.pos.z), dir = new V(-1, 0, 0);
    __G.projectiles.fireCustom(me, from, dir, { type: 'shot', speed: 40, damage: 36, range: 8, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); return 1; })()`);
  const hpA = () => JA(A, `import('./src/game/kits/registry.js').then((K) => { const it = K.SUB_KITS.sentry.items.find((x) => x.gid === ${sA.gid} && !x.ghost); return it ? it.hp : null; })`);
  const hps = [];
  for (let k = 0; k < 4; k++) { await shootB(); await wait(450); hps.push(await hpA()); }
  await wait(600);
  const LA2 = await J(A, 'window.__sen');
  const dh = LA2.dh.filter((d) => d.id === sA.gid), down = LA2.downs[LA2.downs.length - 1];
  R(`B's rounds on its ghost go to A ('dh' kind 'sentry', its gid, 36, attacker B: ${dh.length}): A's sentry ${hps.map((h) => (h == null ? 'down' : h)).join(' → ')}`, dh.length === 4 && dh.every((d) => d.d === 36 && d.a === ids.b) && hps[0] === 84 && hps[1] === 48 && hps[2] === 12 && hps[3] == null, { dh, hps });
  R('A\'s \'device:down\' { how \'shot\' }.by is B\'s actor (as A shows it)', down && down.how === 'shot' && down.by === ids.b, down);
  const gB2 = JSON.parse(await B.until(`(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const it = SUB_KITS.sentry.items.find((x) => x.gid === ${sA.gid}); return !it || it.state === 'dead' ? 'gone' : ''; })()`, 3000, 50).then(() => '"gone"').catch(() => 'null'));
  R('the owner\'s end record [2, gid, 1] ends B\'s ghost too', gB2 === 'gone', gB2);
  // 4) B sets its own down; A has its ghost; B leaves: A's ghost of it goes at once (dropOwner, from onLeave)
  await B.js(`(async () => { const { SUBS } = await import('./src/config.js'); const me = __G.match.local; me.ink = 100; me.yaw = me.aimYaw = -Math.PI / 2; __G.subs.use(me, SUBS.sentry); return 1; })()`);
  const gidB = await B.js(`import('./src/game/kits/registry.js').then((K) => { const it = K.SUB_KITS.sentry.items.find((x) => !x.ghost && x.state !== 'dead'); return it ? it.gid : 0; })`);
  const seenA = await A.until(`import('./src/game/kits/registry.js').then((K) => K.SUB_KITS.sentry.items.some((x) => x.gid === ${gidB} && x.ghost && x.state !== 'dead'))`, 6000, 50).then(() => true).catch(() => false);
  await A.js(`(() => { const nm = __G.netm, ol = nm.onLeave; window.__left = null; nm.onLeave = function (id, hc) { const r = ol.apply(this, arguments); const K = window.__senK; window.__left = { at: performance.now(), gone: !K.items.some((x) => x.gid === ${gidB} && x.state !== 'dead') }; return r; }; return 1; })()`);
  await A.js(`import('./src/game/kits/registry.js').then((K) => { window.__senK = K.SUB_KITS.sentry; return 1; })`);
  const errsB = B.log.filter((l) => !/lightmap|WebGL|GPU/i.test(l));
  await B.js(`__G.net.leave(); 1`);
  const left = await A.until(`window.__left`, 15000, 50).then(() => J(A, 'window.__left')).catch(() => null);
  R(`B sets its own down (A sees its ghost: ${seenA}); B leaves the room: A's ghost of it is gone within the frame of onLeave (dropOwner)`, seenA && left && left.gone, { seenA, left });
  const errs = [...A.log, ...errsB].filter((l) => !/lightmap|WebGL|GPU|net\]|relay|WebSocket/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 5));

  // ---- scene=tower: A's sentry on the moving tower's deck, on both screens
  async function towerScene() {
    const hasT = await J(A, `!!__G.match.tower && !!__G.match.tower.block`);
    R('Tower Command is up with its tower (both screens)', hasT && await J(B, `!!__G.match.tower`), { map: MAP });
    if (!hasT) return;
    // A rides the deck (its own screen keeps it there: on the deck, the host's rules move the tower); B stays home
    await A.js(`(() => { const me = __G.match.local, T = __G.match.tower; window.__senHook = (a) => { if (a !== me) return; const c = Math.cos(T.yaw), s = Math.sin(T.yaw); a.pos.set(T.pos.x + s * -0.85, T.top + 0.05, T.pos.z + c * -0.85); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = T.yaw + Math.PI; }; return 1; })()`);
    await B.js(`(() => { const me = __G.match.local, p = __G.level.spawnPads[me.team]; window.__senHook = (a) => { if (a !== me) return; a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); a.hp = 100; }; return 1; })()`);
    await A.until(`__G.match.tower.moving !== 0`, 8000, 100).catch(() => null);
    await A.js(`(async () => { const { SUBS } = await import('./src/config.js'); const me = __G.match.local; me.ink = 100; __G.subs.use(me, SUBS.sentry); return 1; })()`);
    const st = await JA(A, `(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const it = SUB_KITS.sentry.items.find((x) => !x.ghost && x.state !== 'dead'); return it ? { gid: it.gid, on: it.rb.on && it.rb.on.b.tag } : null; })()`);
    R('A sets one down on the deck: it rides the tower (wave 1\'s attach)', st && st.on === 'tower', st);
    if (!st) return;
    await B.until(`import('./src/game/kits/registry.js').then((K) => K.SUB_KITS.sentry.items.some((x) => x.gid === ${st.gid} && x.ghost && x.rb.on && x.rb.on.b.tag === 'tower'))`, 6000, 50).catch(() => null);
    // sample both screens for 3 s: its spot relative to that screen's tower
    const sampler = (c) => c.js(`(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); const S = window.__twS = []; const T = __G.match.tower; window.__twI = setInterval(() => { const it = SUB_KITS.sentry.items.find((x) => x.gid === ${st.gid} && x.state !== 'dead'); if (!it) return;
      S.push([+(it.pos.x - T.pos.x).toFixed(3), +(it.pos.y - T.top).toFixed(3), +(it.pos.z - T.pos.z).toFixed(3), it.rb.on && it.rb.on.b === T.block ? 1 : 0, +it.pos.x.toFixed(3), +it.pos.z.toFixed(3)]); }, 50); return 1; })()`);
    await sampler(A); await sampler(B);
    await wait(3000);
    for (const c of [A, B]) await c.js(`clearInterval(window.__twI); 1`);
    const SA = await J(A, `window.__twS`), SB = await J(B, `window.__twS`);
    const span = (S) => (S.length ? Math.hypot(S[S.length - 1][4] - S[0][4], S[S.length - 1][5] - S[0][5]) : 0);
    const oA = SA[SA.length - 1], oB = SB[SB.length - 1];
    const off = oA && oB ? +Math.hypot(oA[0] - oB[0], oA[1] - oB[1], oA[2] - oB[2]).toFixed(3) : null;
    R(`it rides the tower on both screens (A: ${span(SA).toFixed(2)} m, B: ${span(SB).toFixed(2)} m along), on its tower's block, B's ghost at the owner's spot of the deck (${off} m: within 0.1)`,
      SA.length > 20 && SB.length > 20 && SA.every((x) => x[3]) && SB.every((x) => x[3]) && span(SA) > 1 && span(SB) > 1 && off != null && off < 0.1,
      { A: { n: SA.length, span: +span(SA).toFixed(2), off: oA && oA.slice(0, 3) }, B: { n: SB.length, span: +span(SB).toFixed(2), off: oB && oB.slice(0, 3) } });
    const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
    R('no console errors on either screen', !errs.length, errs.slice(0, 5));
  }
};
