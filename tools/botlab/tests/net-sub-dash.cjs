// [b5-sub-dash] The Dash Pellet online (src/game/kits/dash.js; SPEC §D8 / D10.8), two real clients on the local relay
// (netpage.cjs): the host (A) dashes in Practice; the guest (B), on the other team, watches — its client receives
// everything 150 ms late with jitter (?netlag=150&netjitter=60: the buffer runs dry now and then, the case F.dash is for).
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-dash.cjs WATCHDOG=900000 tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan)
// Checks: the guest sees the pop at the host's take-off point (≤ 0.3 m: the 'sub:dash' remote record and its blast look)
// and the roll clip on the host's proxy; B standing behind A's take-off point takes the blast once (50, on its own screen
// — A's screen judged it — and once only); a host dash ending against a 0.25 m wall (built on both screens) never shows
// the host's proxy past the wall on the guest's screen, sampled every frame, over 6 dashes; the tick flags are distinct
// powers of two with F.dash (bit 23) apart from the stage modules' F.stage (bit 22); no console errors.
module.exports = async ({ clients, R, wait, say, args, open }) => {
  const LAG = 'netlag=150&netjitter=60';
  for (const c of clients.slice(0, 2)) {
    const lag = c.i === 1 && !/netlag=/.test(c.url || '');
    if (/[?&]autopilot(&|=|$)/.test(c.url || '') && !lag) continue;
    say(`c${c.i}: reopening with ?autopilot${c.i === 1 ? '&' + LAG : ''}`);
    await open(c.i, c.i === 1 ? 'autopilot&' + LAG : 'autopilot');
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
  // every squidkid each screen runs stands still; a per-frame hook (window.__dashHook) drives the local kid
  // (a special a brain popped before the stubs took over ends now: a weapon special owns the sub button, a body one the kid)
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; window.__dashHook?.(a, it); }; }
    for (const a of __G.match.actors) if (!a.remote && a.specialActive) __G.specials.end(a, 'test'); for (const a of __G.match.actors) if (!a.remote) a.special = 0;
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear(); return 1; })()`);
  await still(A); await still(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me); return { a: me.nid, b: him.nid, ta: me.team, tb: him.team }; })()`);
  R('A and B are on different teams', ids.ta !== ids.tb, ids);
  // the dash on both screens' kits; a flat open spot near the middle (A's screen finds it, both use it)
  for (const c of [A, B]) await c.js(`(async () => { const { SUB_KITS } = await import('./src/game/kits/registry.js'); window.__K = SUB_KITS.dash; const me = __G.match.local; me.setSub('dash'); return 1; })()`);
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const flat = (n) => { for (let r = 1.5; r <= 7; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) return false; } return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    for (const n of S) if (flat(n)) return [n.x, n.y, n.z]; return null; })()`);
  R('a flat open spot to stage it', !!P, P);
  if (!P) return;
  // listeners on both screens
  for (const c of [A, B]) await c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const L = window.__dash = { dashes: [], booms: [], hits: [], dmg: [], rolls: [] };
    on('sub:dash', (e) => L.dashes.push({ who: e.actor?.nid, remote: !!e.remote, from: [e.from.x, e.from.y, e.from.z], air: !!e.air }));
    on('bomb:explode', (e) => { if (e.kind === 'dash') L.booms.push({ who: e.actor?.nid, pos: [e.pos.x, e.pos.y, e.pos.z] }); });
    on('hit', (e) => { if (e.weaponId === 'dash') L.hits.push({ att: e.attacker?.nid, vic: e.victim?.nid, d: +e.damage.toFixed(2) }); });
    on('damage', (e) => { if (e.source === 'dash') L.dmg.push({ vic: e.victim?.nid, d: +e.amount.toFixed(2) }); });
    return 1; })()`);
  // the kids: A at the spot (dashing on a cue, then held where it ends), B pinned where it's put
  await A.js(`(() => { const me = __G.match.local; window.__pin = null; window.__go = null; window.__dashHook = (a, it) => { if (a !== me) return;
    if (window.__go) { it.sub = true; it.move.set(window.__go[0], 0, window.__go[1]); window.__go = null; return; }
    if (window.__pin) { a.pos.x = window.__pin[0]; a.pos.z = window.__pin[2]; a.vel.x = a.vel.z = 0; } }; return 1; })()`);
  await B.js(`(() => { const me = __G.match.local; window.__pin = null; window.__dashHook = (a, it) => { if (a !== me || !window.__pin) return; a.pos.x = window.__pin[0]; a.pos.z = window.__pin[2]; a.vel.x = a.vel.z = 0; }; return 1; })()`);
  const place = (c, x, z) => c.js(`(() => { const me = __G.match.local; me.pos.set(${x}, ${P[1]} + 0.02, ${z}); me.vel.set(0, 0, 0); me.invuln = 0; window.__pin = [${x}, 0, ${z}]; return 1; })()`);
  // ---- 1. the pop where A took off, the roll clip, the blast on B once
  await place(A, P[0], P[2]); await place(B, P[0] - 0.3, P[2]);
  await B.js(`(() => { const me = __G.match.local; me.hp = 100; me.invuln = 0; return 1; })()`);
  await wait(900);
  // the roll clip on B's screen: A's proxy's character starts its forward tumble (sampled every frame)
  await B.js(`(() => { const a = __G.match.actors.find((x) => x.nid === ${ids.a}); window.__roll = null; const nm = __G.netm, ap = nm.applyRemote.bind(nm);
    nm.applyRemote = (x, dt) => { ap(x, dt); if (x === a && a.character.dodge && !window.__roll) window.__roll = { dur: a.character.dodge.dur, dir: [a.character.dodge.dir.x, a.character.dodge.dir.z] }; }; window.__apOrig = ap; return 1; })()`);
  const st = () => J(A, `(() => { const me = __G.match.local, r = me.weaponRunner; return { sub: me.subId, ink: Math.round(me.ink), form: me.form, grounded: me.grounded, dashT: r.dashT, latch: r.subLatch, why: window.__K.why(me), alive: me.alive, sp: !!me.specialActive, sj: !!me.superJumpState }; })()`);
  const st0 = await st();
  const from = await J(A, `(() => { const me = __G.match.local; window.__pin = null; window.__go = [1, 0]; return [me.pos.x, me.pos.y, me.pos.z]; })()`);
  const went = await A.until(`window.__dash.dashes.length > 0`, 3000, 30).then(() => true, () => false);
  if (!went) { R('A\'s dash went', false, { before: st0, after: await st() }); return; }
  await B.until(`window.__dash.dashes.length > 0`, 4000, 30).catch(() => null);
  await wait(900);
  const LA = await J(A, 'window.__dash'), LB = await J(B, 'window.__dash');
  const roll = await J(B, 'window.__roll');
  const dB = LB.dashes.find((d) => d.who === ids.a && d.remote), bB = LB.booms.find((b) => b.who === ids.a);
  const off = (p) => (p ? Math.hypot(p[0] - from[0], p[1] - from[1], p[2] - from[2]) : 99);
  R('the guest sees the pop at the host\'s take-off point (≤ 0.3 m: its remote sub:dash and its blast look) and the roll clip on the host\'s proxy',
    !!dB && off(dB.from) <= 0.3 && !!bB && off(bB.pos) <= 0.3 && !!roll && Math.abs(roll.dur - 0.22) < 0.01, { take: from.map((v) => +v.toFixed(2)), atB: dB && dB.from, boomB: bB && bB.pos, roll });
  const hpB = await J(B, `__G.match.local.hp`);
  const hitsA = LA.hits.filter((h) => h.vic === ids.b), dmgB = LB.dmg.filter((d) => d.vic === ids.b);
  R('B, just behind the take-off point, takes the blast once: A\'s screen judges one hit (25–50, from where it shows B), B\'s screen applies that same amount once',
    hitsA.length === 1 && hitsA[0].d >= 25 && hitsA[0].d <= 50 && dmgB.length === 1 && Math.abs(dmgB[0].d - hitsA[0].d) < 0.05 && hpB <= 100 - hitsA[0].d + 0.6, { hitsA, dmgB, hpB: +hpB.toFixed(1), note: 'B also stands in A\'s fresh ink (its ink damage)' });
  // ---- 2. dashes into a 0.25 m wall, watched every frame on B's screen (150 ms late, jittery)
  const WX = P[0] + 3, TH = 0.25;
  for (const c of [A, B]) await c.js(`(async () => { const THREE = await import('three'); const L = __G.level; const b = window.__wall = L.addDynamic({ tag: 'test:dashwall' }); L.moveDynamic(b, new THREE.Vector3(${WX + TH / 2}, ${P[1]} + 1, ${P[2]}), new THREE.Vector3(${TH / 2}, 1, 3), 0); b.dp.set(0, 0, 0); return 1; })()`);
  await place(B, P[0] - 4, P[2] + 4);
  await B.js(`(() => { const a = __G.match.actors.find((x) => x.nid === ${ids.a}); const nm = __G.netm, ap = window.__apOrig; window.__wx = []; window.__extrap = nm.stats.extrap;
    nm.applyRemote = (x, dt) => { ap(x, dt); if (x === a) window.__wx.push(+(a.pos.x).toFixed(3)); }; return 1; })()`);
  const runs = [];
  for (let k = 0; k < 6; k++) {
    await place(A, WX - 0.38 - 1.2 - 0.25 * (k % 3), P[2] + (k - 2.5) * 0.6);
    await A.js(`__G.match.local.ink = 100, 1`);
    await wait(700);
    await B.js(`window.__wx.length = 0, 1`);
    await A.js(`(() => { window.__pin = null; window.__go = [1, 0]; return 1; })()`);
    await wait(1400);
    const xs = await J(B, 'window.__wx'), endA = await J(A, `__G.match.local.pos.x`);
    runs.push({ samples: xs.length, maxPastFace: +(Math.max(...xs) - (WX - 0.38)).toFixed(3), farSide: xs.some((x) => x > WX + TH / 2), endA: +(endA - (WX - 0.38)).toFixed(3) });
  }
  const extrap = await J(B, `__G.netm.stats.extrap - window.__extrap`);
  R('a host dash ending against a 0.25 m wall never shows the host\'s proxy past it on the guest\'s screen (every frame, 6 dashes, 150 ms late with jitter)',
    runs.every((r) => r.samples > 20 && !r.farSide && r.maxPastFace < 0.05 && Math.abs(r.endA) < 0.06), { runs, guestExtrapolatedFrames: extrap });
  for (const c of [A, B]) await c.js(`(async () => { const THREE = await import('three'); const b = window.__wall; if (b) { b.solid = false; __G.level.moveDynamic(b, new THREE.Vector3(1e4, -500, 1e4), new THREE.Vector3(0.1, 0.1, 0.1), 0); } __G.netm.applyRemote = window.__apOrig || __G.netm.applyRemote; return 1; })()`);
  // ---- 3. the tick flags
  const F = JSON.parse(await A.js(`(async () => { const N = await import('./src/net/netmatch.js'); return JSON.stringify(N.NET_FLAGS); })()`));
  const vals = Object.values(F), pow2 = vals.every((v) => v > 0 && (v & (v - 1)) === 0), distinct = new Set(vals).size === vals.length;
  R('the tick flags are distinct powers of two; F.dash is bit 23 (8388608), apart from the stage modules\' F.stage (bit 22)', pow2 && distinct && F.dash === 8388608 && F.stage === 4194304 && Math.max(...vals) <= 2 ** 30, F);
  const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 5));
};
