// [b5-karp] Bazookarp online — WP1's two-client SMOKE test (the full netcode and its 16 steps, SPEC §10.2, are WP2's):
// real clients on the local relay (netpage.cjs), karpbox injected into both before the room is made, host A on Alpha,
// guest B on Bravo, bots filling. Checks that the records exist and a guest follows them:
//   the guest's engine is a follower fed by the host's snapshots ('ks' on the timeline) · it sees the Bazookarp and the
//   Roe Shell at the Pond (the engine and the look) · B's shots on the shell move the HOST's meter (kh on B's tick) ·
//   the host's burst ('b', sent at once) frees it on B's screen · a host carrier ('p') is B's carrier too, with the
//   marker over its head on B's HUD · the count falls on the host as it carries and B's count follows · B claims a free
//   Bazookarp (kc) and the host grants it ('p') on both screens · B's Carp Shot is a ghost on the host's screen
//   ([0] / [1] / [2] kit records) · the carrier's rate report (kr) reaches the host
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default karpbox; any stage with LAYOUT.bazookarp or a placeholder works)
module.exports = async ({ clients, R, wait, say, args, open }) => {
  // the mode is hidden (config WIP_MODES) and the kids' brains are stubbed: every client needs ?autopilot&wipmodes
  for (const c of clients.slice(0, 2)) {
    if (/[?&]wipmodes(&|=|$)/.test(c.url || '') && /[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i}: reopening with ?autopilot&wipmodes`);
    await open(c.i, 'autopilot&wipmodes');
  }
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'karpbox';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  if (MAP === 'karpbox') for (const c of [A, B]) await c.js(`(async () => { const m = await import('./tools/botlab/karpbox.js'); return m.defineKarpbox(null); })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  const mode = await J(A, `__G.net.lobby.mode`);
  R('a room takes the hidden mode with ?wipmodes', mode === 'bazookarp', { mode });
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1]) { await B.js(`__G.net.setMe({ team: ${1 - teams[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team !== p[1].team; })()`, 8000); }
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say('match up');
  // every screen's own kids stand still (the bots run on the host; each local kid on its owner's screen)
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  await still(A); await still(B);
  const info = async (c) => J(c, `(() => { const K = __G.match.karp; if (!K) return null; const s = K.state(); return { follower: K.follower, host: K.host, phase: s.phase, holder: s.holder && s.holder.nid, meter: Math.round(s.meter), count: s.count, shell: s.shell, pos: s.pos.map((x) => +x.toFixed(2)), hostT: K.hostT ?? null, lastQ: K.lastQ, wire: K.wire.constructor.name, rec: K.wire.log }; })()`);
  await wait(1500);
  const ia = await info(A), ib = await info(B);
  R('the host runs the rules (NetWire); the guest\'s engine is a follower fed by the host\'s snapshots', ia && ib && ia.host && !ia.follower && ib.follower && ia.wire === 'NetWire' && ib.hostT > 0 && ia.rec.snap > 5, { ia, ib });
  const look = await J(B, `(() => { const F = __G.karpFx; return { shell: !!(F && F.shell && F.shell.visible), carp: !!(F && F.carp && F.carp.visible), at: F && F.shell ? F.shell.position.toArray().map((x) => +x.toFixed(2)) : null }; })()`);
  R('the guest sees the Bazookarp and the Roe Shell at the Pond (engine and look)', ib.phase === 'shielded' && ib.shell === 'intact' && look.shell && look.carp && Math.hypot(look.at[0], look.at[2]) < 0.5, { ib: { phase: ib.phase, shell: ib.shell }, look });
  // B (Bravo) shoots the shell from 6 m: the host's meter goes Bravo's way (its hits ride B's tick as kh)
  await B.js(`(() => { const a = __G.match.local; a.pos.set(0, 0, 6); a.vel.set(0, 0, 0); return 1; })()`);
  await wait(400);
  await B.js(`(() => { const a = __G.match.local, c = __G.match.karp.shell.center(); a.aimYaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); a.yaw = a.aimYaw; a.aimPitch = Math.atan2(c.y - (a.pos.y + 1.2), 6); a.intent.fire = true; window.__karpAim = setInterval(() => { a.aimYaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); a.yaw = a.aimYaw; a.ink = 100; }, 50); return 1; })()`);
  await wait(2200);
  await B.js(`(() => { clearInterval(window.__karpAim); __G.match.local.intent.fire = false; return 1; })()`);
  await wait(400);
  const ha = await info(A), hb = await info(B);
  R('B\'s shots on the shell move the HOST\'s meter (summed on B\'s tick: kh); B\'s meter follows the host\'s', ha.meter < -40 && Math.abs(hb.meter - ha.meter) < 120, { host: ha.meter, guest: hb.meter });
  // the host bursts it (Alpha: B's side clear of it), a host kid walks in: 'b' and 'p' reach B at once
  const hostNid = await J(A, `__G.match.local.nid`);
  await A.js(`(() => { const K = __G.match.karp, a = __G.match.local; a.pos.set(0, 0, -1.2); a.vel.set(0, 0, 0); K.shell.add(0, 2000, a); return 1; })()`);
  await B.until(`__G.match.karp.phase !== 'shielded'`, 3000, 50);
  const fb = await info(B);
  await A.until(`__G.match.karp.holder === __G.match.local`, 4000, 50);
  await B.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${hostNid}`, 3000, 50);
  const pb = await info(B);
  R('the host\'s burst frees it on B\'s screen; the host\'s kid picks it up and is B\'s carrier too', (fb.phase === 'free' || fb.phase === 'carried') && pb.holder === hostNid && pb.phase === 'carried', { burst: fb.phase, holder: pb.holder, hostNid });
  // the host's carrier walks into Bravo's half: the host's count falls, B's follows; B's HUD shows the carrier's marker
  await A.js(`(() => { const a = __G.match.local; a.intent.move.set(0, 0, 1); return 1; })()`);
  await wait(2500);
  await A.js(`(() => { __G.match.local.intent.move.set(0, 0, 0); return 1; })()`);
  await wait(500);
  const ca = await info(A), cb = await info(B);
  const mk = await J(B, `(() => { const s = __inkwave.hud && __inkwave.hud.karp && __inkwave.hud.karp.state(); return s ? { on: s.on, marker: s.marker, status: s.status } : null; })()`);
  R('the count falls on the host as it carries; B\'s count is the host\'s (within a snapshot)', ca.count[0] < 100 && Math.abs(cb.count[0] - ca.count[0]) <= 2, { host: ca.count, guest: cb.count });
  R('B\'s HUD: the carrier marker (the carp + its fuse seconds) and the status line', !!mk && mk.on && !!mk.marker && mk.marker.secs > 0 && /CARRY/.test(mk.status), mk);
  // the host's carrier is splatted; B (on its own) walks into the re-burst Bazookarp: a claim (kc) the host grants
  await A.js(`(() => { const K = __G.match.karp, a = __G.match.local, foe = __G.match.actors.find((o) => o.team !== a.team); a.splat(foe, 'weapon'); return 1; })()`);
  await A.until(`__G.match.karp.phase === 'shielded'`, 4000, 50);
  const kpos = await J(A, `__G.match.karp.pos.toArray()`);
  const bNid = await J(B, `__G.match.local.nid`);
  await B.js(`(() => { const a = __G.match.local; a.pos.set(${kpos[0]} + 4, ${kpos[1]}, ${kpos[2]}); a.vel.set(0, 0, 0); return 1; })()`);
  await wait(400);
  await A.js(`(() => { const K = __G.match.karp; K.shell.add(1, 2000, __G.match.actors.find((o) => o.nid === ${bNid})); return 1; })()`);
  await wait(450);
  await B.js(`(() => { const a = __G.match.local; a.pos.set(${kpos[0]} + 0.4, ${kpos[1]}, ${kpos[2]}); a.vel.set(0, 0, 0); return 1; })()`);
  await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bNid}`, 5000, 50);
  await B.until(`__G.match.karp.holder === __G.match.local`, 3000, 50);
  const gb = await info(B), ga = await info(A), claims = await J(B, `__G.match.karp.wire.log.claim`);
  R('B claims the free Bazookarp (kc) and the host grants it (p): B carries on both screens', ga.holder === bNid && gb.holder === bNid && claims >= 1, { host: ga.holder, guest: gb.holder, claims });
  // B (the carrier) fires a Carp Shot: the host's screen plays it as a ghost; B's carrier reports (kr) reach the host
  await B.js(`(() => { const a = __G.match.local; a.aimYaw = 0; a.aimPitch = 0.2; a.intent.fire = true; return 1; })()`);
  await wait(700);
  await B.js(`(() => { __G.match.local.intent.fire = false; return 1; })()`);
  await wait(1800);
  const gh = await J(A, `(() => { const S = __G.karpGun.shots; return { ghosts: S.filter((s) => s.ghost).length, landed: S.filter((s) => s.ghost && s.land).length, blasts: __G.karpGun.stats.blasts }; })()`);
  const kr = await J(B, `__G.match.karp.wire.log`);
  R('B\'s Carp Shot is a ghost on the host\'s screen (its launch, landing and blast records)', gh.ghosts >= 1 && gh.landed >= 1, gh);
  R('the guest carrier\'s rate / footing reports go to the host (kr / kf)', kr.rate >= 1, kr);
  const errs = [];
  for (const c of [A, B]) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on either screen', errs.length === 0, errs.slice(0, 4));
};
