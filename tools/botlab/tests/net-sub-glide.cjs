// [b5-sub-glide] The Glide Bomb online (src/game/kits/glide.js; SPEC §A8, A10.10), real clients on the local relay:
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-glide.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan)
// Practice; A (the host) and B (the guest) on different teams, everyone's brains stubbed. Checks:
//  - A cooks a stone: B's copy of A's hand shows cook levels 1, 2, 3 in order, each within 0.3 s of A's own (the [5]
//    records on A's timeline), A's sub held (its subAim flag) — and back to 0 once A lets go;
//  - the release: B's ghost slides with the same fixed step and blows within 0.3 m of A's blast, a ghost never paints or
//    hurts: the blast's hit on B is judged on A's screen and applied once, by B's screen (B's hp falls by that hit);
//  - B shoots A's next stone on B's screen: the hit goes to A ('dh', with B's actor as the attacker on A's screen), A's
//    copy pops ('device:down' how 'shot', by B) and the end record ends B's ghost (popped, no blast anywhere);
//  - a cook that fizzles in A's hand (A splatted while holding): B's copy of the hand drops to 0;
//  - B leaves with a stone sliding: on A every ghost of B's is gone within a frame of onLeave (dropOwner), no blast;
//  - no console errors.
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
  await A.js(`__G.net.setSettings({ mode: 'practice', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1]) { await B.js(`__G.net.setMe({ team: ${1 - teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team !== p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up');
  for (const c of [A, B]) if (!(await c.js('!!__G.match.local.bot'))) throw new Error(`c${c.i}: its own kid has no brain (an ?autopilot client is needed)`);
  // everyone this screen runs stands still; the local kid's sub button is window.__hold; a per-frame hook
  const still = (c) => c.js(`(() => { window.__hold = false; for (const a of __G.match.actors) if (!a.remote && a.bot) { a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; if (a === __G.match.local) it.sub = !!window.__hold; window.__hook?.(a, it); }; }
    __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear(); return 1; })()`);
  await still(A); await still(B);
  // listeners (wall-clock times: both pages share this machine's clock)
  const listen = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const { SUB_KITS } = await import('./src/game/kits/registry.js'); window.__K = SUB_KITS.glide;
    const L = window.__g = { charge: [], boom: [], hits: [], down: [], end: [], dh: [] };
    on('sub:charge', (e) => { if (e.kind === 'glide') L.charge.push({ lv: e.level, at: Date.now(), who: e.actor?.nid }); });
    on('bomb:explode', (e) => { if (e.kind === 'glide') L.boom.push({ p: [e.pos.x, e.pos.y, e.pos.z], ghost: !!e.ghost, at: Date.now() }); });
    on('hit', (e) => { if (e.weaponId === 'glide') L.hits.push({ vic: e.victim?.nid, att: e.attacker?.nid, d: e.damage, local: !!e.victim?.isLocal }); });
    on('device:down', (e) => { if (e.kind === 'glide') L.down.push({ how: e.how, by: e.by?.nid ?? null }); });
    on('glide:end', (e) => L.end.push({ why: e.why }));
    return 1; })()`);
  await listen(A); await listen(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me); return { a: me.nid, b: him.nid, ta: me.team, tb: him.team }; })()`);
  R('A and B are on different teams', ids.ta !== ids.tb, ids);
  // a flat, open straight on the stage (12 m with no wall or drop, a step either side) near its middle — A's screen finds it
  const P = await J(A, `(() => { const L = __G.level, N = __G.nav.nodes, c = L.bounds; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
    const flatLine = (n, yaw) => { const sx = Math.sin(yaw), sz = Math.cos(yaw); for (let d = -2; d <= 13; d += 0.5) for (const w of [-1.2, 0, 1.2]) { const x = n.x + sx * d + sz * w, z = n.z + sz * d - sx * w; const y = L.groundHeight(x, z, n.y + 1.5); if (Math.abs(y - n.y) > 0.03) return false; } return true; };
    const S = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
    for (const n of S) for (let k = 0; k < 8; k++) { const yaw = k * Math.PI / 4; if (flatLine(n, yaw)) return [n.x, n.y, n.z, yaw]; } return null; })()`);
  R('a flat open straight to stage it on', !!P, P);
  if (!P) return;
  const [px, py, pz, yaw] = P, fx = Math.sin(yaw), fz = Math.cos(yaw);
  const at = (d, w = 0) => [px + fx * d + fz * w, pz + fz * d - fx * w];
  // place a kid (its own screen moves it) and keep it there
  const pin = async (c, nid, d, w, y) => c.js(`(() => { const a = __G.match.actors.find((q) => q.nid === ${nid}); const [x, z] = ${JSON.stringify(at(d, w))};
    window.__pin = { a, x, z }; a.pos.set(x, ${py} + 0.02, z); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = ${y}; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = ${y}; a.bot.aimPitch = 0; }
    window.__hook = (q, it) => { const p = window.__pin; if (p && q === p.a) { q.pos.x = p.x; q.pos.z = p.z; q.vel.x = q.vel.z = 0; q.aimYaw = q.yaw = ${y}; q.aimPitch = 0; if (q.bot) { q.bot.aimYaw = ${y}; q.bot.aimPitch = 0; } } }; return 1; })()`);
  await pin(A, ids.a, 0, 0, yaw);
  await pin(B, ids.b, 9, 0.2, yaw + Math.PI);
  await A.js(`(() => { const a = __G.match.local; a.setSub('glide'); a.ink = 100; return 1; })()`);
  await wait(1200);

  // ============================================================================================ the cook in the hand
  // B polls what it shows for A's hand (its own frames), wall-clock stamped
  // (both screens log A's hand: its cook level and its sub-held flag — on B that flag rides A's actor tick, the same
  // timeline as the [5] records, so the level's lag behind the flag isolates what the records add from the load)
  const poll = (c) => c.js(`(() => { const a = __G.match.actors.find((q) => q.nid === ${ids.a}); const S = window.__seen = []; let last = 0, aim = false;
    window.__aimOn = null;
    window.__poll = setInterval(() => { const lv = __K.levelShown(a), am = !!a.weaponRunner.aimingSub; if (am && !aim && window.__aimOn == null) window.__aimOn = Date.now(); aim = am; if (lv !== last) { S.push({ lv, at: Date.now(), aim: am }); last = lv; } }, 8); return 1; })()`);
  await poll(A); await poll(B);
  await A.js(`window.__hold = true; 1`);
  // (held until A's own cook is full — game time, whatever the machine's load — then 0.4 s more: well before the slip)
  await A.until(`__K.levelShown(__G.match.local) === 3`, 8000, 20);
  await wait(400);
  const seenMid = await J(B, `window.__seen.slice()`);
  await A.js(`window.__hold = false; 1`);
  await wait(400);
  const chA = (await J(A, `window.__g.charge`)).filter((c) => c.who === ids.a), seenB = await J(B, `window.__seen`);
  const aimA = await J(A, `window.__aimOn`), aimB = await J(B, `window.__aimOn`);
  await A.js(`clearInterval(window.__poll); 1`);
  const lag = [1, 2, 3].map((lv) => { const a = chA.find((c) => c.lv === lv), b = seenB.find((s) => s.lv === lv); return a && b ? b.at - a.at : null; });
  // (the records ride A's timeline: B plays them back as late as everything else of A's — its playback delay, which grows
  // with the machine's load. Judged: each level within 0.3 s of A's mark, or — on a loaded machine — within 0.15 s of
  // where A's own sub-held flag (the actor tick, the same timeline) puts it: the records add no lag of their own)
  const pd = await J(B, `(() => { const nm = __G.netm, a = __G.match.actors.find((q) => q.nid === ${ids.a}), p = nm.peers.get(a.owner); return p ? Math.round((p.delay || 0) * 1000) : null; })()`);
  const tickLag = aimA != null && aimB != null ? aimB - aimA : null;
  const rel = lag.map((x) => (x != null && tickLag != null ? x - tickLag : null));
  const okLv = lag.every((x, i) => x != null && x >= -50 && (x <= 300 || (rel[i] != null && Math.abs(rel[i]) <= 150)));
  R(`A cooks: B's copy of A's hand shows cook levels 1, 2, 3 in order (the [5] records), each within 0.3 s of A's own (or, loaded, of A's sub-held flag on the same timeline), A's sub held there`,
    chA.map((c) => c.lv).join() === '1,2,3' && seenMid.map((s) => s.lv).join() === '1,2,3' && okLv && seenMid.every((s) => s.aim), { a: chA.map((c) => c.lv), b: seenMid.map((s) => [s.lv, s.aim]), lagMs: lag, flagLagMs: tickLag, beyondFlagMs: rel, playbackDelayMs: pd });
  R('…and back to 0 on B once A lets go (the stone thrown)', seenB.length && seenB[seenB.length - 1].lv === 0, seenB.map((s) => s.lv));

  // ============================================================================================ the slide and the blast
  // (B pinned 9 m out: A's full-cook stone stops short of B — 5.5 m; the next one is aimed to blow at B's feet)
  await A.until(`!__K.items.some((x) => x.state !== 'dead')`, 8000, 50);
  await B.until(`!__K.items.some((x) => x.state !== 'dead')`, 8000, 50);
  await wait(300);
  const boomA = await J(A, `window.__g.boom`), boomB = await J(B, `window.__g.boom`);
  const bA = boomA.find((x) => !x.ghost), bB = boomB.find((x) => x.ghost);
  const dBoom = bA && bB ? Math.hypot(bA.p[0] - bB.p[0], bA.p[1] - bB.p[1], bA.p[2] - bB.p[2]) : null;
  R('the ghost on B slides with the same fixed step and blows within 0.3 m of A\'s blast (A\'s [1] record; the ghost never blows itself)', dBoom != null && dBoom <= 0.3 && boomB.filter((x) => !x.ghost).length === 0, { dBoom, a: bA, b: bB });
  // a stone that blows at B's feet: B's hp falls once, by the hit A judged
  await B.until(`__G.match.local.alive`, 12000, 100);
  await B.js(`(() => { const me = __G.match.local; me.hp = 1000; window.__g.hits.length = 0; return 1; })()`);
  await A.js(`(() => { window.__g.hits.length = 0; const a = __G.match.local; a.ink = 100; return 1; })()`);
  // (an uncooked stone; on A it's set to stop by B: pushed to 0.75 m short of B and stilled, its fuse then runs out there)
  const tap = async () => { await A.js(`window.__hold = true; 1`); await A.until(`__G.match.local.weaponRunner.aimingSub`, 3000, 10); await wait(40); await A.js(`window.__hold = false; 1`); };
  await tap();
  await A.until(`__K.items.some((x) => !x.ghost && x.state === 'slide')`, 3000, 30);
  await A.js(`(() => { const it = __K.items.find((x) => !x.ghost && x.state === 'slide'); const b = __G.match.actors.find((q) => q.nid === ${ids.b}); const dx = it.p.x - b.pos.x, dz = it.p.z - b.pos.z, l = Math.hypot(dx, dz) || 1;
    it.p.set(b.pos.x + dx / l * 0.75, it.p.y, b.pos.z + dz / l * 0.75); it.v.set(0, 0, 0); it.fuse = 0.6; it.recT = 0; return 1; })()`);
  await B.until(`window.__g.hits.length > 0`, 5000, 50).catch(() => null);
  await wait(500);
  const hB = await J(B, `{ hits: window.__g.hits, hp: __G.match.local.hp }`), hA = await J(A, `window.__g.hits`);
  // (B's hp also falls a little standing in A's ink: the hit itself is what's compared)
  R('its blast at B\'s feet: judged on A\'s screen (A\'s own stone), applied once by B\'s screen with the damage A judged; the ghost on B hurts nobody',
    hA.filter((h) => h.vic === ids.b).length === 1 && hB.hits.filter((h) => h.vic === ids.b).length === 1 && hB.hits[0].local && Math.abs(hB.hits[0].d - hA.find((h) => h.vic === ids.b).d) < 0.5 && hB.hits[0].d > 60 && hB.hp < 1000 - 60, { onA: hA, onB: hB });

  // ============================================================================================ B pops A's stone on B's screen
  await A.js(`(() => { window.__g.down.length = 0; window.__g.end.length = 0; window.__g.boom.length = 0; const a = __G.match.local; a.ink = 100; return 1; })()`);
  await B.js(`(() => { window.__g.end.length = 0; window.__g.boom.length = 0; return 1; })()`);
  await tap();
  await A.until(`__K.items.some((x) => !x.ghost && x.state === 'slide')`, 3000, 30);
  // A stills its stone 4 m out (its word reaches B within 0.25 s), then B fires at B's ghost of it
  await A.js(`(() => { const it = __K.items.find((x) => !x.ghost && x.state === 'slide'); const [x, z] = ${JSON.stringify(at(4))}; it.p.set(x, it.p.y, z); it.v.set(0, 0, 0); it.fuse = 4; it.recT = 0; return 1; })()`);
  await B.until(`__K.items.some((x) => x.ghost && x.state === 'slide' && Math.hypot(x.p.x - ${at(4)[0]}, x.p.z - ${at(4)[1]}) < 0.1)`, 3000, 30).catch(() => null);
  let shots = 0;
  for (; shots < 4; shots++) {
    const live = await J(A, `__K.items.some((x) => !x.ghost && x.state !== 'dead')`);
    if (!live) break;
    await B.js(`(async () => { const T = await import('three'); const me = __G.match.local, g = __K.items.find((x) => x.ghost && x.state !== 'dead'); if (!g) return 0;
      const to = new T.Vector3(g.p.x, g.p.y + 0.14, g.p.z), from = new T.Vector3(g.p.x + 3, g.p.y + 0.14, g.p.z), dir = to.clone().sub(from).normalize();
      __G.projectiles.fireCustom(me, from, dir, { type: 'shot', speed: 40, damage: 36, range: 6, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); return 1; })()`);
    await wait(350);
  }
  await wait(600);
  const dA = await J(A, `{ down: window.__g.down, end: window.__g.end, boom: window.__g.boom.length, live: __K.items.filter((x) => x.state !== 'dead').length }`);
  const eB = await J(B, `{ end: window.__g.end, boom: window.__g.boom.length, live: __K.items.filter((x) => x.state !== 'dead').length }`);
  R(`B shoots A's stone on B's screen (${shots} shots): A's copy takes the hits ('dh', B as the attacker) and pops ('device:down' shot, by B), the end record pops B's ghost — no blast anywhere`,
    dA.down.length === 1 && dA.down[0].how === 'shot' && dA.down[0].by === ids.b && dA.end.some((e) => e.why === 'popped') && eB.end.some((e) => e.why === 'popped') && dA.boom === 0 && eB.boom === 0 && dA.live === 0 && eB.live === 0, { shots, A: dA, B: eB });

  // ============================================================================================ a fizzle in A's hand
  await B.js(`(() => { window.__seen.length = 0; return 1; })()`);
  await A.js(`(() => { const a = __G.match.local; a.ink = 100; window.__hold = true; return 1; })()`);
  await wait(1000);
  await A.js(`(() => { const a = __G.match.local; a.damage(500, null); return 1; })()`);
  await A.js(`window.__hold = false; 1`);
  await wait(700);
  const seen2 = await J(B, `window.__seen`);
  R('A splatted while cooking: the cook fizzles in A\'s hand, B\'s copy of it drops back to 0 ([5, 0] / the dead kid), no stone', seen2.some((s) => s.lv >= 1) && seen2[seen2.length - 1].lv === 0 && (await J(B, `__K.items.filter((x) => x.state !== 'dead').length`)) === 0, seen2.map((s) => s.lv));
  await B.js(`clearInterval(window.__poll); 1`);
  await A.until(`__G.match.local.alive`, 12000, 200).catch(() => null);

  // ============================================================================================ B leaves mid-slide
  await A.js(`(() => { const nm = __G.netm, o = nm.onLeave.bind(nm); window.__left = null; nm.onLeave = (id, hc) => { o(id, hc); window.__left = { live: __K.items.filter((x) => x.owner?.nid === ${ids.b} && x.state !== 'dead').length, at: performance.now() }; }; window.__g.boom.length = 0; return 1; })()`);
  await B.js(`(() => { const a = __G.match.local; a.setSub('glide'); a.ink = 100; window.__hold = true; return 1; })()`);
  await wait(100); await B.js(`window.__hold = false; 1`);
  await A.until(`__K.items.some((x) => x.ghost && x.owner?.nid === ${ids.b} && x.state === 'slide')`, 3000, 30).catch(() => null);
  const before = await J(A, `__K.items.filter((x) => x.ghost && x.owner?.nid === ${ids.b} && x.state !== 'dead').length`);
  close(1);
  await A.until(`!!window.__left`, 20000, 50).catch(() => null);
  await wait(300);
  const left = await J(A, `{ left: window.__left, boom: window.__g.boom.length, live: __K.items.filter((x) => x.owner?.nid === ${ids.b} && x.state !== 'dead').length }`);
  R('B leaves with a stone sliding: on A every ghost of B\'s is gone at onLeave (dropOwner, before re-owning: no blast)', before >= 1 && left.left && left.left.live === 0 && left.live === 0 && left.boom === 0, { before, ...left });

  const errs = [...A.log, ...B.log].filter((l) => !/lightmap|WebGL|GPU|ERR_FAILED|net::/i.test(l));
  R('no console errors on either screen', !errs.length, errs.slice(0, 6));
};
