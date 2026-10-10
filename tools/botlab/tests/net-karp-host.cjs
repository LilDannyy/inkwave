// [b5-karp] Bazookarp online: the host leaves mid-carry (SPEC §7.6, §10.2 steps 12 and 14 — WP1's part: the new host
// runs the rules from where the old one stopped; WP2 owns the narrowed flush, the onLeave order and adopted actors'
// queued Carp Shots). karpbox injected into every client, the kids driven by the test.
//   NET_ARGS='part=bots' (CLIENTS=3): host A carries on a stage with bots, A leaves. The new host (B or C, the relay's
//     pick) calls onHostChange: it is no longer a follower, its carrier is A's kid adopted as a bot (still carrying, not
//     dropped), the other guest agrees on the carrier, the counts and the fuse; the new host's records carry on from
//     the old host's q (the other guest applies its drop — a restart at q 1 would be dropped there); the match ends with
//     the same result on both screens.
//   NET_ARGS='part=cargo' (CLIENTS=2): a humans-only karpbox (noBots, like Cargo): host A carries and leaves; its kid is
//     removed while B is still a follower. Within 1 s of B becoming host, nothing is held by a removed actor: it is
//     dropped where A last was (or flies to the Pond), on B's screen.
//   [karp-face] NET_ARGS='part=plant' (CLIENTS=3, SPEC §10.2 step 13): an Alpha bot plants and host A leaves 0.1 s later —
//     on B and C the same weirs lowered, the same phase, the same resting spot (the narrowed flush of 'ks', 'S' carries
//     lastPlant / lastCarrier). 'part=shot' (CLIENTS=3, step 13b): an old-host bot carrier fires a Big Burst 0.1 s before
//     A leaves — the new host flies, lands and blows it (its adopted bot's shot: the 'k' case, KarpGun.adopt): on both
//     screens the swell lasts 0.45 ± 0.05 s, the other guest's kid standing in it is splatted on its own screen, and a
//     Bravo bot the new host now owns standing in it is splatted on the new host's. 'part=guestleave' (CLIENTS=2, step
//     15): guest B carries and B's client leaves — the host adopts B's kid as a bot, it keeps carrying, the fuse runs on.
//   CLIENTS=3 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' NET_ARGS='part=bots' NET=tools/botlab/tests/net-karp-host.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET_ARGS='part=cargo' NET=tools/botlab/tests/net-karp-host.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients, R, wait, say, args, open, close }) => {
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const part = opt.part || (clients.length >= 3 ? 'bots' : 'cargo');
  const n = part === 'bots' || part === 'plant' || part === 'shot' ? 3 : 2;
  for (const c of clients.slice(0, n)) {
    if (/[?&]wipmodes(&|=|$)/.test(c.url || '') && /[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    await open(c.i, 'autopilot&wipmodes');
  }
  const cs = clients.slice(0, n), [A] = cs;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  for (const c of cs) await c.js(`(async () => { const m = await import('./tools/botlab/karpbox.js'); await m.defineKarpbox(null); const { MAPS } = await import('./src/config.js'); MAPS.find((x) => x.id === 'karpbox').noBots = ${part === 'cargo'}; return 1; })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: 'karpbox', time: 'day', botCount: ${part === 'shot' ? 5 : 2}, difficulty: 'easy' }); 1`);   // ([karp-face] shot: bots on both teams)
  for (let i = 1; i < n; i++) await cs[i].js(`__G.net.join(${JSON.stringify(code)}, 'Guest${i}').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === ${n}`, 15000);
  // A on Alpha, the guests on Bravo
  await A.js(`__G.net.setMe({ team: 0 }); 1`);
  for (let i = 1; i < n; i++) { await cs[i].js(`__G.net.setMe({ team: 1 }); 1`); await cs[i].js(`__G.net.setMe({ ready: true }); 1`); }
  await A.until(`__G.net.lobby.players.every((p, i) => p.team === (i === 0 ? 0 : 1)) && __G.net.canStart()`, 10000);
  await A.js(`__G.net.start()`);
  for (const c of cs) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say(`match up (${part})`);
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  for (const c of cs) await still(c);
  await A.js(`(() => { for (const a of __G.match.actors) if (a.bot && !a.remote) { const p = __G.level.spawnPads[a.team]; a.pos.set(p.x + (a.slot % 4) * 1.5 - 2, p.y, p.z + (a.team ? 2 : -2)); a.vel.set(0, 0, 0); } return 1; })()`);
  for (let i = 1; i < n; i++) await cs[i].js(`(() => { const a = __G.match.local, p = __G.level.spawnPads[a.team]; a.pos.set(p.x + ${i * 2 - 3}, p.y, p.z); a.vel.set(0, 0, 0); return 1; })()`);
  const info = async (c) => J(c, `(() => { const K = __G.match && __G.match.karp; if (!K) return null; const s = K.state(); return { host: __G.net.isHost, follower: K.follower, phase: s.phase, holder: s.holder && s.holder.nid, holderRemote: K.holder ? !!K.holder.remote : null, holderBot: K.holder ? !!K.holder.bot : null, holderIn: K.holder ? __G.match.actors.includes(K.holder) : null, count: s.count, fuse: +s.fuse.toFixed(2), pos: s.pos.map((x) => +x.toFixed(2)), q: K.q, lastQ: K.lastQ, hostChanges: K.stats.hostChanges || 0, winner: s.winner, reason: s.reason, actors: __G.match.actors.length }; })()`);
  const aNid = await J(A, `__G.match.local.nid`);
  await wait(1200);
  if (part === 'plant' || part === 'shot' || part === 'guestleave') return more({ cs, A, J, info, R, wait, say, close, part, aNid });
  // A's kid grabs it at the Pond (the host's own burst) and carries toward Bravo's half for 2 s
  await A.js(`(() => { const K = __G.match.karp, a = __G.match.local; a.pos.set(0, 0, -1.2); a.vel.set(0, 0, 0); K.shell.add(0, 2000, a); return 1; })()`);
  await A.until(`__G.match.karp.holder === __G.match.local`, 4000, 50);
  await A.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = 0; a.intent.move.set(0, 0, 1); return 1; })()`);
  await wait(2000);
  await A.js(`(() => { __G.match.local.intent.move.set(0, 0, 0); return 1; })()`);
  await wait(600);
  const pre = [];
  for (const c of cs) pre.push(await info(c));
  const aLast = (await info(A)).pos;
  R(`${part}: before the leave, every screen has A's kid as the carrier`, pre.every((p) => p && p.holder === aNid && p.phase === 'carried'), pre.map((p) => p && { holder: p.holder, phase: p.phase, q: p.q, lastQ: p.lastQ }));
  const preQ = pre[0].q;
  say('host A leaves');
  await close(0);
  const rest = cs.slice(1);
  let N = null;
  for (let k = 0; k < 120 && !N; k++) { for (const c of rest) if (await c.js(`!!(__G.net && __G.net.isHost)`)) { N = c; break; } if (!N) await wait(250); }
  if (!N) { R(`${part}: a guest becomes the host`, false, {}); return; }
  const O = rest.find((c) => c !== N) || null;
  say(`new host: c${N.i}`);

  if (part === 'cargo') {
    await wait(1000);
    const nb = await info(N);
    const goneAll = await J(N, `!__G.match.actors.some((a) => a.nid === ${aNid})`);
    const d = Math.hypot(nb.pos[0] - aLast[0], nb.pos[2] - aLast[2]);
    R('cargo: within 1 s the new host runs the rules (onHostChange: not a follower, its q carries on from the old host\'s)', !nb.follower && nb.hostChanges === 1 && nb.q > preQ, { follower: nb.follower, hostChanges: nb.hostChanges, q: nb.q, preQ });
    R('cargo: A\'s kid was removed, and nothing is held by it: the Bazookarp is dropped where A last was (or flies to the Pond)', goneAll && nb.holder == null && (nb.phase === 'reforming' || nb.phase === 'shielded' || nb.phase === 'resetting') && (d < 4 || nb.phase === 'resetting'), { gone: goneAll, holder: nb.holder, phase: nb.phase, pos: nb.pos, aLast, d: +d.toFixed(2) });
  } else {
    await wait(1200);
    const nb = await info(N);
    R('bots: the new host runs the rules (onHostChange: not a follower) and A\'s kid, adopted as its bot, still carries — nothing dropped; the new host scores it', !nb.follower && nb.hostChanges === 1 && nb.holder === aNid && nb.holderRemote === false && nb.holderBot && nb.phase === 'carried' && nb.count[0] <= pre[1].count[0], { ...nb, before: pre[1].count });
    // (the adopted bot stands still, so both screens can be compared once a snapshot has played)
    await N.js(`(() => { const h = __G.match.karp.holder; if (h && h.bot) { h.bot.update = () => {}; const it = h.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = false; } return 1; })()`);
    await wait(1000);
    const nb2 = await info(N), ob = await info(O);
    R('bots: the other guest agrees — the same carrier, counts identical, the fuse within 0.5 s', ob.holder === aNid && ob.phase === 'carried' && JSON.stringify(ob.count) === JSON.stringify(nb2.count) && Math.abs(ob.fuse - nb2.fuse) < 0.5, { nb: { count: nb2.count, fuse: nb2.fuse }, ob: { count: ob.count, fuse: ob.fuse } });
    // the adopted carrier is splatted on the new host: its drop record ('d', q above the old host's) reaches the other guest
    const qN = nb2.q;
    await N.js(`(() => { const h = __G.match.karp.holder; if (h && !h.remote) h.splat(__G.match.local, 'weapon'); return 1; })()`);
    await O.until(`!__G.match.karp.holder && __G.match.karp.lastQ > ${preQ}`, 4000, 50).catch(() => {});
    await wait(400);
    const n2 = await info(N), o2 = await info(O);
    R('bots: the new host\'s records carry on from the old host\'s q — its drop reaches the other guest (same phase, same spot)', n2.q > qN && n2.q > preQ && o2.lastQ === n2.q && o2.holder == null && n2.holder == null && o2.phase === n2.phase && Math.hypot(o2.pos[0] - n2.pos[0], o2.pos[2] - n2.pos[2]) < 0.5, { preQ, qN, n: { q: n2.q, phase: n2.phase, pos: n2.pos }, o: { lastQ: o2.lastQ, phase: o2.phase, pos: o2.pos } });
    // the new host calls time: the same result on both screens
    await N.js(`(() => { __G.match.time = 0.2; return 1; })()`);
    for (const c of [N, O]) await c.until(`!!__G.match.result`, 20000, 250).catch(() => {});
    const end = async (c) => J(c, `(() => { const r = __G.match.result; return r ? { mode: r.mode, winner: r.winner, reason: r.reason, counts: r.counts } : null; })()`);
    const en = await end(N), eo = await end(O);
    R('bots: the match finishes under the new host with the same result on both screens', !!en && !!eo && en.mode === 'bazookarp' && JSON.stringify(en) === JSON.stringify(eo), { host: en, guest: eo });
  }
  const errs = [];
  for (const c of rest) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on the remaining screens', errs.length === 0, errs.slice(0, 4));
};

// [karp-face] SPEC §10.2 steps 13, 13b and 15
async function more({ cs, A, J, info, R, wait, say, close, part, aNid }) {
  const rest = cs.slice(1);
  const newHost = async () => { for (let k = 0; k < 120; k++) { for (const c of rest) if (await c.js(`!!(__G.net && __G.net.isHost)`)) return c; await wait(250); } return null; };
  const errs = () => { const e = []; for (const c of rest) e.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l))); return e; };
  if (part === 'guestleave') {
    const B = cs[1], bNid = await J(B, `__G.match.local.nid`);
    await B.js(`(() => { const a = __G.match.local; a.pos.set(0, 0, 1.0); a.vel.set(0, 0, 0); return 1; })()`);
    await wait(500);
    await A.js(`(() => { const K = __G.match.karp; K.shell.add(1, 3000, __G.match.actors.find((o) => o.nid === ${bNid})); return 1; })()`);
    await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bNid}`, 5000, 30).catch(() => {});
    await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = Math.PI; a.intent.move.set(0, 0, -1); return 1; })()`);
    await wait(1500);
    await B.js(`(() => { __G.match.local.intent.move.set(0, 0, 0); return 1; })()`);
    await wait(500);
    const pre = await info(A);
    say('guest B leaves while carrying');
    await close(1);
    await wait(1500);
    const a1 = await J(A, `(() => { const K = __G.match.karp, h = K.holder; return { holder: h && h.nid, remote: h ? !!h.remote : null, bot: h ? !!h.bot : null, phase: K.phase, fuse: +K.fuse.toFixed(2), clamped: K.stats.clamped }; })()`);
    await wait(1500);
    const a2 = await J(A, `(() => { const K = __G.match.karp; return { holder: K.holder && K.holder.nid, phase: K.phase, fuse: +K.fuse.toFixed(2), count: K.count }; })()`);
    R('15. guest B leaves mid-carry: the host adopts B\'s kid as a bot and it keeps carrying (nothing dropped), the fuse runs on', pre.holder === bNid && a1.holder === bNid && a1.remote === false && a1.bot && a1.phase === 'carried' && a2.holder === bNid && a2.fuse < a1.fuse && a1.fuse < pre.fuse, { pre: { holder: pre.holder, fuse: pre.fuse }, a1, a2 });
    const e = (A.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l));
    R('no page errors on the host', e.length === 0, e.slice(0, 4));
    return;
  }
  // an Alpha bot of the host's gets it at the Pond (the host's own burst); B and C stay on their deck
  const bot = await J(A, `(() => { const b = __G.match.actors.find((o) => o.bot && !o.remote && o.team === 0); return b ? b.nid : -1; })()`);
  await A.js(`(() => { const K = __G.match.karp, b = __G.match.actors.find((o) => o.nid === ${bot}); b.pos.set(0, 0, -1.0); b.vel.set(0, 0, 0); K.shell.add(0, 3000, b); return 1; })()`);
  await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bot}`, 5000, 30).catch(() => {});
  for (const c of rest) await c.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bot}`, 4000, 30).catch(() => {});
  if (part === 'plant') {
    // the bot walks up the ramp onto weir A's platform; the moment the host has the plant, A leaves (0.1 s later)
    await A.js(`(() => { const b = __G.match.actors.find((o) => o.nid === ${bot}); b.pos.set(0, 0, 21.5); b.vel.set(0, 0, 0); return 1; })()`);
    await wait(400);
    await A.js(`(() => { const K = __G.match.karp; K.base = null; const b = __G.match.actors.find((o) => o.nid === ${bot}); b.yaw = b.aimYaw = 0; b.intent.move.set(0, 0, 1); return 1; })()`);
    await A.until(`__G.match.karp.lowered[0]`, 8000, 15).catch(() => {});
    await wait(100);
    const hp = await J(A, `(() => { const K = __G.match.karp; return { lowered: K.lowered, phase: K.phase, pos: K.pos.toArray().map((x) => +x.toFixed(2)), q: K.q }; })()`);
    say('host A leaves 0.1 s after the plant');
    await close(0);
    const N = await newHost();
    if (!N) { R('13. a guest becomes the host', false, {}); return; }
    const O = rest.find((c) => c !== N);
    await wait(1500);
    const st = async (c) => J(c, `(() => { const K = __G.match.karp; return { follower: K.follower, lowered: [...K.lowered], gate: [...K.gateUp], phase: K.phase, pos: K.pos.toArray().map((x) => +x.toFixed(2)), lastPlant: K.lastPlant && K.lastPlant.team, lastCarrier: K.lastCarrier && K.lastCarrier.how }; })()`);
    const n1 = await st(N), o1 = await st(O);
    R('13. a plant in the old host\'s last moment: on both remaining screens the same weirs lowered, the same Gate up, the same phase and resting spot (the weir)',
      hp.lowered[0] && n1.lowered[0] && o1.lowered[0] && n1.gate[0] && o1.gate[0] && n1.phase === o1.phase && Math.hypot(n1.pos[0] - o1.pos[0], n1.pos[2] - o1.pos[2]) < 0.3 && Math.hypot(n1.pos[0] - hp.pos[0], n1.pos[2] - hp.pos[2]) < 0.3 && !n1.follower,
      { host: hp, newHost: n1, other: o1 });
    R('13b. … and the new host has the old host\'s last plant and last carrier (its S38 decision at time-up)', n1.lastPlant === 0 && n1.lastCarrier === 'plant', { newHost: { lastPlant: n1.lastPlant, lastCarrier: n1.lastCarrier } });
    await N.js(`(() => { __G.match.time = 0.2; return 1; })()`);
    for (const c of [N, O]) await c.until(`!!__G.match.result`, 20000, 250).catch(() => {});
    const end = async (c) => J(c, `(() => { const r = __G.match.result; return r ? { mode: r.mode, winner: r.winner, reason: r.reason, counts: r.counts } : null; })()`);
    const en = await end(N), eo = await end(O);
    R('13c. the match finishes under the new host, the same result on both screens', !!en && JSON.stringify(en) === JSON.stringify(eo), { en, eo });
  } else {
    // a Big Burst from the bot at a spot where the other guest's kid and a Bravo host bot stand; A leaves 0.1 s later
    const bravo = await J(A, `(() => { const b = __G.match.actors.find((o) => o.bot && !o.remote && o.team === 1); return b ? b.nid : -1; })()`);
    if (bravo < 0) { R('13b. a Bravo bot of the host\'s to stand in the blast', false, await J(A, `__G.match.actors.map((a) => [a.nid, a.team, !!a.bot])`)); return; }
    await A.js(`(() => { const b = __G.match.actors.find((o) => o.nid === ${bot}); b.pos.set(0, 0, -4); b.vel.set(0, 0, 0); b.yaw = b.aimYaw = 0; b.aimPitch = 0; const v = __G.match.actors.find((o) => o.nid === ${bravo}); v.pos.set(1.0, 0, 16.6); v.vel.set(0, 0, 0); v.hp = 100; v.invuln = 0; return 1; })()`);
    // every remaining screen logs the shot's landing and blast (performance.now), and its own splats
    // (the bots the new host adopts stand still: their brains are stubbed on both guests before the leave)
    for (const c of rest) await c.js(`(async () => { const m = await import('./src/game/bots.js'); m.BotBrain.prototype.update = function () {}; return 1; })()`);
    for (const c of rest) await c.js(`(() => { window.__sh = []; import('./src/core/ctx.js').then((m) => { m.on('karp:land', (e) => window.__sh.push(['land', performance.now()])); m.on('karp:blast', (e) => window.__sh.push(['blast', performance.now()])); m.on('splatted', (e) => window.__sh.push(['splat', performance.now(), e.victim && e.victim.nid, e.cause])); }); return 1; })()`);
    // the kids of B and C: both stand in the landing spot; whichever stays a guest is the one judged on its own screen
    for (const c of rest) await c.js(`(() => { const a = __G.match.local; a.pos.set(${'Math.random() * 0.6 - 0.3'}, 0, 16.3); a.vel.set(0, 0, 0); a.hp = 100; a.invuln = 0; return 1; })()`);
    await wait(700);
    await A.js(`(() => { const b = __G.match.actors.find((o) => o.nid === ${bot}); window.__fired = __G.karpGun._fire(b, 1).gid; return 1; })()`);
    await wait(100);
    say('host A leaves 0.1 s after its bot fired a Big Burst');
    await close(0);
    const N = await newHost();
    if (!N) { R('13b. a guest becomes the host', false, {}); return; }
    const O = rest.find((c) => c !== N);
    await wait(3500);
    const log = async (c) => J(c, `window.__sh`);
    const ln = await log(N), lo = await log(O);
    const swell = (L) => { const a = L.find((e) => e[0] === 'land'), b = L.find((e) => e[0] === 'blast'); return a && b ? +(((b[1] - a[1]) / 1000).toFixed(3)) : null; };
    const oNid = await J(O, `__G.match.local.nid`);
    const sn = swell(ln), so = swell(lo);
    R('13b. a shot in the air at migration: on both remaining screens it still lands and swells 0.45 ± 0.05 s before it blows (the new host flies its adopted bot\'s shot)', sn != null && so != null && Math.abs(sn - 0.45) <= 0.05 && Math.abs(so - 0.45) <= 0.05, { newHost: sn, other: so, ln, lo });
    const oSplat = lo.some((e) => e[0] === 'splat' && e[2] === oNid && e[3] === 'karp'), oAlive = await J(O, `__G.match.local.alive`);
    const vSplat = ln.some((e) => e[0] === 'splat' && e[2] === bravo && e[3] === 'karp'), vOwn = await J(N, `(() => { const v = __G.match.actors.find((o) => o.nid === ${bravo}); return { alive: v.alive, remote: !!v.remote }; })()`);
    R('13c. … the other guest\'s kid standing in it is splatted on its own screen, and the Bravo bot the new host now owns is splatted on the new host\'s', oSplat && !oAlive && vSplat && vOwn.remote === false && !vOwn.alive, { oSplat, oAlive, vSplat, vOwn });
  }
  const e = errs();
  R('no page errors on the remaining screens', e.length === 0, e.slice(0, 4));
}
