// [b5-karp] Bazookarp online — WP1's two-client test (SPEC §10.2's steps that WP1's netcode covers; the latency steps,
// three-client rooms and the finished face are WP2's; host migration is net-karp-host.cjs). Real clients on the local
// relay (netpage.cjs), karpbox injected into both before the room is made, host A on Alpha, guest B on Bravo, one bot a
// side (parked: every screen's own kids are driven by the test). Each check reads the HOST's state, not just the
// guest's own send log:
//   the host runs the rules (NetWire), the guest is a follower fed by snapshots ('ks') · B's shell hits move the
//   host's meter (kh on B's tick) · the host's burst ('b') and grant ('p') reach B at once · a host carrier's count
//   on both screens, B's HUD marker · B grabs at the Pond from its forward side: the host never scores B's samples
//   from before the pick-up · B walks forward: the host's count follows B's own field reading with no clamp rejection,
//   and its view of B's half comes from B's kr · B's Carp Shots on A's kid and on the floor: the ghost lands where
//   B's shot did (± 0.3 m), A's kid is hurt on A's own screen (victim-judged [2]) and B gets its hit marker ([3]) ·
//   B retreats on its own half: DON'T RETREAT! on B's screen, the host's fuse rate ×3 from kr · a refused claim (kd)
//   reaches B (a host bot nearer wins the race) · a grant that arrives after B died on its own screen is declined (kx),
//   undone on both screens ('u'), and inside an S39 overtime the overtime goes on · the overtime's window runs out:
//   the same result on both screens · no page errors
//   CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default karpbox)
//   [karp-face] NET_ARGS='part=face' (the rest of SPEC §10.2's two-client steps: net-karp-steps.cjs) · 'part=lag' (with
//   URLQ='netlag=150&netjitter=60': the latency steps) — the migration steps are net-karp-host.cjs's
module.exports = async (ctx) => {
  const part = (/(?:^|[;&])part=(\w+)/.exec(ctx.args || '') || [])[1];
  if (part === 'face' || part === 'lag' || part === 'snap' || part === 'race' || part === 'racekid' || part === 'racefair' || part === 'racerun' || part === 'raceswap' || part === 'raceside') return require('./net-karp-steps.cjs')(ctx, part);
  return base(ctx);
};
async function base({ clients, R, wait, say, args, open }) {
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
  const r2 = (x) => Math.round(x * 100) / 100;
  if (MAP === 'karpbox') for (const c of [A, B]) await c.js(`(async () => { const m = await import('./tools/botlab/karpbox.js'); return m.defineKarpbox(null); })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'bazookarp', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 2, difficulty: 'easy' }); 1`);
  const mode = await J(A, `__G.net.lobby.mode`);
  R('a room takes the hidden mode with ?wipmodes', mode === 'bazookarp', { mode });
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams[0] === teams[1] || teams[0] !== 0) { await A.js(`__G.net.setMe({ team: 0 }); 1`); await B.js(`__G.net.setMe({ team: 1 }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === 0 && p[1].team === 1; })()`, 8000); }
  await B.js(`__G.net.setMe({ ready: true }); 1`);
  await A.until(`__G.net.canStart()`, 8000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say('match up');
  // every screen's own kids stand still (the bots run on the host; each local kid on its owner's screen); host bots parked
  const still = (c) => c.js(`(() => { for (const a of __G.match.actors) if (!a.remote && a.bot) a.bot.update = () => {}; for (const a of __G.match.actors) if (!a.remote) { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; } return 1; })()`);
  await still(A); await still(B);
  await A.js(`(() => { for (const a of __G.match.actors) if (a.bot && !a.remote) { const p = __G.level.spawnPads[a.team]; a.pos.set(p.x + (a.slot % 4) * 1.5 - 2, p.y, p.z + (a.team ? 2 : -2)); a.vel.set(0, 0, 0); } return 1; })()`);
  // B's hit events (the [3] marker) from here on
  await B.js(`(() => { window.__hits = []; import('./src/core/ctx.js').then((m) => m.on('hit', (e) => window.__hits.push({ att: e.attacker && e.attacker.nid, vic: e.victim && e.victim.nid, dmg: e.damage, w: e.weaponId, rv: !!e.remoteVictim }))); return 1; })()`);
  const info = async (c) => J(c, `(() => { const K = __G.match.karp; if (!K) return null; const s = K.state(); return { follower: K.follower, host: K.host, phase: s.phase, holder: s.holder && s.holder.nid, meter: Math.round(s.meter), count: s.count, shell: s.shell, pos: s.pos.map((x) => +x.toFixed(2)), hostT: K.hostT ?? null, lastQ: K.lastQ, q: K.q, touched: s.touched, overtime: s.overtime, winner: s.winner, reason: s.reason, wire: K.wire.constructor.name, rec: K.wire.log, clamped: K.stats.clamped, clampLog: K.stats.clampLog || [], declined: K.stats.declined, remote: { half: K.remote.half, rate: K.remote.rate, why: K.remote.why } }; })()`);
  const put = (c, x, y, z) => c.js(`(() => { const a = __G.match.local; if (!a.alive) return 0; a.pos.set(${x}, ${y}, ${z}); a.vel.set(0, 0, 0); return 1; })()`);
  const aNid = await J(A, `__G.match.local.nid`), bNid = await J(B, `__G.match.local.nid`), bTeam = await J(B, `__G.match.local.team`);
  await wait(1500);
  const ia = await info(A), ib = await info(B);
  R('the host runs the rules (NetWire); the guest\'s engine is a follower fed by the host\'s snapshots', ia && ib && ia.host && !ia.follower && ib.follower && ia.wire === 'NetWire' && ib.hostT > 0 && ia.rec.snap > 5 && bTeam === 1, { ia: ia && { host: ia.host, wire: ia.wire, snap: ia.rec.snap }, ib: ib && { follower: ib.follower, hostT: ib.hostT }, bTeam });
  const look = await J(B, `(() => { const F = __G.karpFx; return { shell: !!(F && F.shell && F.shell.visible), carp: !!(F && F.carp && F.carp.visible), at: F && F.shell ? F.shell.position.toArray().map((x) => +x.toFixed(2)) : null }; })()`);
  R('the guest sees the Bazookarp and the Roe Shell at the Pond (engine and look)', ib.phase === 'shielded' && ib.shell === 'intact' && look.shell && look.carp && Math.hypot(look.at[0], look.at[2]) < 0.5, { ib: { phase: ib.phase, shell: ib.shell }, look });

  // ---- 1. B (Bravo) shoots the shell from 6 m for 5 s: the host's meter goes Bravo's way (its hits ride B's tick as kh);
  // [karp-face] and B's OWN sends are counted (every message its transport puts on the socket, pings included): ≤ 30 in
  // any 1 s (SPEC §10.2 step 1; the relay's per-socket peak alone didn't say whose). The host's shell can't burst meanwhile
  await put(B, 0, 0, 6);
  await A.js(`(() => { __G.match.karp.shell.hpMax = 1e9; return 1; })()`);
  await wait(400);
  await B.js(`(() => { const tr = __G.netm.s.tr; window.__sent = []; if (!tr.__raw0) { tr.__raw0 = tr._raw.bind(tr); tr._raw = (s) => { if (window.__sent) window.__sent.push([performance.now(), s.slice(0, 2)]); return tr.__raw0(s); }; } return 1; })()`);
  await B.js(`(() => { const a = __G.match.local, c = __G.match.karp.shell.center(); a.aimYaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); a.yaw = a.aimYaw; a.aimPitch = Math.atan2(c.y - (a.pos.y + 1.2), 6); a.intent.fire = true; window.__karpAim = setInterval(() => { a.aimYaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); a.yaw = a.aimYaw; a.ink = 100; }, 50); return 1; })()`);
  await wait(5000);
  const sent = await J(B, `(() => { clearInterval(window.__karpAim); __G.match.local.intent.fire = false; const s = window.__sent; window.__sent = null; return { t: s.map((q) => Math.round(q[0])), k: s.map((q) => q[1]), weapon: __G.match.local.weaponId }; })()`);
  await A.js(`(() => { const S = __G.match.karp.shell; S.hpMax = 1000; S.m = Math.max(-600, Math.min(600, S.m)); return 1; })()`);
  await wait(400);
  let ha = await info(A), hb = await info(B);
  R('1. B\'s shots on the shell move the HOST\'s meter (summed on B\'s tick: kh); B\'s meter follows the host\'s', ha.meter < -40 && Math.abs(hb.meter - ha.meter) < 120, { host: ha.meter, guest: hb.meter });
  let peak1 = 0;
  for (let i = 0; i < sent.t.length; i++) { let n = 0; for (let j = i; j < sent.t.length && sent.t[j] - sent.t[i] < 1000; j++) n++; peak1 = Math.max(peak1, n); }
  const span1 = sent.t.length > 1 ? (sent.t[sent.t.length - 1] - sent.t[0]) / 1000 : 0;
  R('1b. while B fires at the shell for 5 s, B itself sends ≤ 30 messages in any 1 s (expected ~20: its ticks; kh adds none)', sent.t.length > 40 && peak1 <= 30, { peak1s: peak1, total: sent.t.length, perSec: +(sent.t.length / Math.max(1e-3, span1)).toFixed(1), kinds: [...new Set(sent.k)], weapon: sent.weapon });

  // ---- 2. the host bursts it (Alpha), its kid walks in: 'b' and 'p' reach B at once; the host's carrier scores on both
  await put(B, 0, 0, 8);
  await A.js(`(() => { const K = __G.match.karp, a = __G.match.local; a.pos.set(0, 0, -1.2); a.vel.set(0, 0, 0); K.shell.add(0, 2000, a); return 1; })()`);
  await B.until(`__G.match.karp.phase !== 'shielded'`, 3000, 50);
  const fb = await info(B);
  await A.until(`__G.match.karp.holder === __G.match.local`, 4000, 50);
  await B.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${aNid}`, 3000, 50);
  const pb = await info(B);
  R('2. the host\'s burst frees it on B\'s screen; the host\'s kid picks it up and is B\'s carrier too', (fb.phase === 'free' || fb.phase === 'carried') && pb.holder === aNid && pb.phase === 'carried', { burst: fb.phase, holder: pb.holder, aNid });
  await A.js(`(() => { const a = __G.match.local; a.intent.move.set(0, 0, 1); return 1; })()`);
  await wait(2500);
  await A.js(`(() => { __G.match.local.intent.move.set(0, 0, 0); return 1; })()`);
  await wait(500);
  const ca = await info(A), cb = await info(B);
  const mk = await J(B, `(() => { const s = __inkwave.hud && __inkwave.hud.karp && __inkwave.hud.karp.state(); return s ? { on: s.on, marker: s.marker, status: s.status } : null; })()`);
  R('2b. the count falls on the host as its kid carries; B\'s count is the host\'s (within a snapshot)', ca.count[0] < 100 && Math.abs(cb.count[0] - ca.count[0]) <= 2, { host: ca.count, guest: cb.count });
  R('2c. B\'s HUD: the carrier marker (the carp + its fuse seconds) and the status line', !!mk && mk.on && !!mk.marker && mk.marker.secs > 0 && /CARRY/.test(mk.status), mk);

  // ---- 3. back to the Pond; B waits on its FORWARD side (4 m toward its Gate), then grabs: the host scores B only from
  // samples after the one its claim was judged on (the old code read B's queued samples from 4 m forward: count ≈ 92)
  await A.js(`(() => { const K = __G.match.karp, a = __G.match.local; a.splat(__G.match.actors.find((o) => o.team !== a.team), 'weapon'); return 1; })()`);
  await A.until(`__G.match.karp.phase === 'shielded' || __G.match.karp.phase === 'reforming'`, 4000, 50);
  await A.js(`(() => { const K = __G.match.karp; K._reset(K.pos.clone(), 'none'); return 1; })()`);
  await A.until(`__G.match.karp.phase === 'shielded' && __G.match.karp.pos.length() < 0.3`, 6000, 100);
  await put(B, 0.3, 0, -4);
  await wait(1200);
  const c0 = (await info(A)).count;
  await A.js(`(() => { const K = __G.match.karp; K.shell.add(1, 2000, __G.match.actors.find((o) => o.nid === ${bNid})); return 1; })()`);
  await B.until(`__G.match.karp.phase === 'free'`, 3000, 20);
  await put(B, 0.3, 0, 0);
  await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bNid}`, 5000, 30);
  await B.until(`__G.match.karp.holder === __G.match.local`, 3000, 30);
  await wait(700);
  const g0 = await info(A), g0b = await info(B);
  R('3. B grabs it (kc → p on both screens); right after, the host\'s count for Bravo is still the Pond\'s (no sample from before the pick-up was scored), no clamp rejection',
    g0.holder === bNid && g0b.holder === bNid && g0.count[bTeam] >= 99 && g0.clamped === 0 && g0b.rec.claim >= 1, { before: c0, host: g0.count, clamped: g0.clamped, clampLog: g0.clampLog, claims: g0b.rec.claim });

  // ---- 4. B walks toward its Gate (−z) for 3 s: the host's count follows B's own reading, no clamp rejection; the host's
  // view of B's half is B's kr (Alpha's half: 0)
  await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = Math.PI; a.intent.move.set(0, 0, -1); return 1; })()`);
  const walk = [];
  for (let i = 0; i < 6; i++) { await wait(500); const h = await info(A), own = await J(B, `(() => { const K = __G.match.karp, a = __G.match.local, r = K.field.fieldAt(a.team, a.pos); return r ? K.field.count(a.team, r.d) : null; })()`); walk.push([h.count[bTeam], own]); }
  await B.js(`(() => { __G.match.local.intent.move.set(0, 0, 0); return 1; })()`);
  await wait(800);
  const hostK = await info(A), bPos = await J(B, `__G.match.local.pos.toArray().map((x) => +x.toFixed(2))`);
  const guestOwn = await J(B, `(() => { const K = __G.match.karp, a = __G.match.local; return K.field.count(a.team, K.field.fieldAt(a.team, a.pos).d); })()`);
  R('4. B carries forward: the HOST\'s count for Bravo falls with B\'s own field reading (± 1 once still; never ahead of it on the way), with 0 clamp rejections',
    hostK.count[bTeam] < 90 && Math.abs(hostK.count[bTeam] - guestOwn) <= 1 && hostK.clamped === 0 && walk.every(([h, o]) => o == null || h >= o - 1), { host: hostK.count[bTeam], guest: guestOwn, clamped: hostK.clamped, clampLog: hostK.clampLog, walk, bPos });
  R('4b. the host\'s view of B\'s half and rate is B\'s own kr (on Alpha\'s half: half 0, rate 1)', hostK.remote.half === 0 && hostK.remote.rate === 1, hostK.remote);

  // ---- 5. B's Carp Shots: a tap that lands on A's kid, one that lands on the floor (each read on both screens before
  // the shot's record is dropped, 2 s after its blast)
  const land = [bPos[0], 0, bPos[2] - 7.3];
  await put(A, land[0], land[1], land[2]);
  await A.js(`(() => { const a = __G.match.local; a.hp = 100; a.invuln = 0; return 1; })()`);
  await wait(900);
  const hp0 = await J(A, `__G.match.local.hp`);
  // (fix round 2) A's own screen logs the kid's hp at each Carp Shot hurt as it happens: read 1.9 s and a few round trips
  // later (seconds on a loaded Mac), the kid had already regenerated (regen starts 1.3 s after a hit, 22 hp/s)
  await A.js(`(() => { window.__aHurt = []; import('./src/core/ctx.js').then((m) => m.on('damage', (e) => { if (e.victim === __G.match.local && e.source === 'karp') window.__aHurt.push({ dmg: +(+e.amount).toFixed(2), hp: +e.victim.hp.toFixed(2), att: e.attacker && e.attacker.nid }); })); return 1; })()`);
  // ([karp-face] A's screen hears and sees B's launches: a ghost's [0] emits karp:shot there too — the whomp, the mouth)
  await A.js(`(() => { window.__aShots = []; import('./src/core/ctx.js').then((m) => m.on('karp:shot', (e) => window.__aShots.push({ nid: e.actor && e.actor.nid, ghost: !!e.ghost }))); return 1; })()`);
  const pairs = [];
  const shoot = async (yaw) => {
    await B.js(`(() => { const a = __G.match.local; a.aimYaw = a.yaw = ${yaw}; a.aimPitch = 0; a.intent.fire = true; setTimeout(() => { a.intent.fire = false; }, 60); return 1; })()`);
    await wait(1900);
    const mine = await J(B, `__G.karpGun.shots.filter((s) => !s.ghost && s.land).map((s) => ({ gid: s.gid, land: s.land.toArray().map((x) => +x.toFixed(2)) }))`);
    const ghosts = await J(A, `__G.karpGun.shots.filter((s) => s.ghost).map((s) => ({ gid: s.gid, ph: s.phase, land: s.land && s.land.toArray().map((x) => +x.toFixed(2)) }))`);
    for (const m of mine) if (!pairs.some((p) => p.gid === m.gid)) { const g = ghosts.find((q) => q.gid === m.gid); pairs.push({ gid: m.gid, shooter: m.land, ghost: g && g.land, d: g && g.land ? r2(Math.hypot(g.land[0] - m.land[0], g.land[1] - m.land[1], g.land[2] - m.land[2])) : null }); }
  };
  await shoot(Math.PI);
  const hp1 = await J(A, `({ hp: __G.match.local.hp, alive: __G.match.local.alive, hurt: window.__aHurt })`);
  const hpLow = Math.min(hp1.hp, ...hp1.hurt.map((h) => h.hp));
  await wait(400);
  await shoot(Math.PI / 2);
  const onKid = pairs.find((p) => p.shooter && Math.hypot(p.shooter[0] - land[0], p.shooter[2] - land[2]) < 1.5), onFloor = pairs.find((p) => p.shooter && p.shooter[0] > bPos[0] + 4);
  R('5. B\'s Carp Shots land in the same spot on the host\'s screen (± 0.3 m): one on A\'s kid, one on the floor ([1] carries the landing, not the raycast\'s direction)',
    !!onKid && !!onFloor && onKid.d != null && onKid.d < 0.3 && onFloor.d != null && onFloor.d < 0.3, { pairs, land });
  const hits = await J(B, `window.__hits`);
  R('5b. the Splash hurts A\'s kid on A\'s own screen (the victim judges [2]: B\'s Carp Shot, its hp at that moment)', hpLow < hp0 - 15 && hp1.hurt.some((h) => h.att === bNid && h.dmg > 15), { hp0, hpLow, hp1 });
  R('5c. B gets its hit marker for A (A\'s [3] → a hit event with B as the attacker)', hits.some((h) => h.att === bNid && h.vic === aNid && h.w === 'karp' && h.rv), hits);
  const aShots = await J(A, `({ ev: window.__aShots, fire: (__inkwave.hud && __inkwave.hud.karp && __inkwave.hud.karp.cues.played || []).filter((n) => n === 'karp_fire').length })`);
  R('5d. A\'s screen hears B\'s launches: each ghost launch emits karp:shot there and plays the whomp (karp_fire)', aShots.ev.filter((e) => e.nid === bNid && e.ghost).length >= 2 && aShots.fire >= 2, aShots);

  // ---- 6. B retreats on its own half: DON'T RETREAT! on B's screen at once, the host's rate ×3 (B's kr)
  await put(B, 0.3, 0, 6);
  await wait(500);
  await put(B, 0.3, 0, 16);
  await wait(500);
  const rt = await info(A), bot = await J(B, `(() => { const s = __inkwave.hud.karp.state(); return { bottom: s.bottom, rate: __G.match.karp.state().rate }; })()`);
  R('6. B retreats 10 m on its own half: DON\'T RETREAT! on B\'s screen, and the host burns B\'s fuse ×3 (B\'s kr: retreat, own half)', rt.remote.rate === 3 && rt.remote.why === 'retreat' && rt.remote.half === bTeam && /DON'T RETREAT/.test(bot.bottom?.[0] || '') && bot.rate === 3, { host: rt.remote, guest: bot });

  // ---- 7. a refused claim (kd) reaches B: a Bravo host bot nearer the free Bazookarp wins the race
  await B.js(`(() => { const a = __G.match.local; a.splat(null, 'weapon'); return 1; })()`);
  await A.until(`!__G.match.karp.holder && __G.match.karp.phase === 'shielded'`, 6000, 100);
  await B.until(`__G.match.local.alive`, 12000, 200);
  const kp = (await info(A)).pos, ref0 = (await info(B)).rec.refused || 0;
  await put(B, kp[0] + 4, kp[1], kp[2]);
  await wait(600);
  const bot7 = await J(A, `(() => { const b = __G.match.actors.find((o) => o.bot && !o.remote && o.team === ${bTeam}); return b ? b.nid : -1; })()`);
  await A.js(`(() => { const K = __G.match.karp, b = __G.match.actors.find((o) => o.nid === ${bot7}); K.shell.add(1, 2000, b); K.phaseT = 1.0; b.pos.set(${kp[0]} + 0.2, ${kp[1]}, ${kp[2]}); b.vel.set(0, 0, 0); return 1; })()`);
  await B.until(`__G.match.karp.phase === 'free'`, 3000, 20);
  await put(B, kp[0] + 0.9, kp[1], kp[2]);
  await A.until(`__G.match.karp.holder && __G.match.karp.holder.nid === ${bot7}`, 4000, 30).catch(() => {});
  await wait(500);
  const dbg7 = await J(A, `(() => { const K = __G.match.karp, b = __G.match.actors.find((o) => o.nid === ${bot7}); return { phase: K.phase, phaseT: K.phaseT, holder: K.holder && K.holder.nid, kpos: K.pos.toArray().map((x) => +x.toFixed(2)), bot: b && { pos: b.pos.toArray().map((x) => +x.toFixed(2)), alive: b.alive, sp: !!b.specialActive, sj: !!b.superJumpState, can: K.phase === 'free' ? K.canPick(b) : null }, grants: K.stats.grants, refused: K.stats.refused }; })()`);
  const k7a = await info(A), k7b = await info(B);
  R('7. a race: the host grants the nearer Bravo bot; B\'s claim is refused and B gets the host\'s kd (it reaches the engine: its lock ends)', bot7 >= 0 && k7a.holder === bot7 && k7b.holder === bot7 && k7b.rec.claim >= 1 && (k7b.rec.refused || 0) > ref0 && !(await J(B, `__G.match.karp.lockT > 0`)), { holder: [k7a.holder, k7b.holder], bot7, claims: k7b.rec.claim, refused: [ref0, k7b.rec.refused], dbg7 });

  // ---- 8. a grant that arrives after B died on its own screen, inside an S39 overtime: B declines (kx), the host undoes
  // it ('u') on both screens, touched / the last carrier stay, and the overtime goes on
  // (whoever holds it is splatted on its owner's screen)
  if (k7a.holder === bNid) await B.js(`(() => { __G.match.local.splat(null, 'weapon'); return 1; })()`);
  else await A.js(`(() => { const h = __G.match.karp.holder; if (h && !h.remote) h.splat(__G.match.local, 'weapon'); return 1; })()`);
  await A.until(`!__G.match.karp.holder && __G.match.karp.phase === 'shielded'`, 6000, 100).catch(() => {});
  await A.js(`(() => { const K = __G.match.karp, m = __G.match; K.count = [60, 100]; K.reachT = [5, 0]; K.lastCarrier = { team: 0, how: 'splat', left: 5 }; m.time = 0.3; return 1; })()`);
  await A.until(`__G.match.karp.overtime && __G.match.karp.otWin.open`, 4000, 50);
  await B.until(`__G.match.karp.overtime`, 3000, 50);
  const kp8 = (await info(A)).pos;
  await B.until(`__G.match.local.alive`, 12000, 200);
  await put(B, kp8[0] + 3.2, kp8[1], kp8[2]);
  await wait(500);
  // B dies on its own screen the moment its grant plays there (after its claim left, before the grant arrived)
  await B.js(`(() => { const K = __G.match.karp, me = __G.match.local, ne = K.netEvent.bind(K); window.__died = 0; K.netEvent = (e, s) => { if (Array.isArray(e) && e[0] === 'p' && e[2] === me.nid && !window.__died) { window.__died = 1; me.splat(null, 'weapon'); } return ne(e, s); }; return 1; })()`);
  const pre8 = await J(A, `(() => { const K = __G.match.karp; return { touched: K.touched, lc: K.lastCarrier, win: K.otWin.left }; })()`);
  await A.js(`(() => { const K = __G.match.karp; K.shell.add(1, 2000, __G.match.actors.find((o) => o.nid === ${bNid})); K.phaseT = 0.6; return 1; })()`);
  await B.until(`__G.match.karp.phase === 'free'`, 3000, 20);
  await put(B, kp8[0] + 0.3, kp8[1], kp8[2]);
  await B.until(`window.__died === 1`, 4000, 20).catch(() => {});
  await A.until(`__G.match.karp.stats.declined >= 1`, 4000, 30).catch(() => {});
  await wait(1000);
  const d8a = await info(A), d8b = await info(B), post8 = await J(A, `(() => { const K = __G.match.karp; return { touched: K.touched, lc: K.lastCarrier, win: K.otWin.left, open: K.otWin.open }; })()`);
  R('8. B, dead on its own screen when its grant arrives, declines it (kx); the host undoes it (u): nobody holds it on either screen, free at the same spot',
    d8b.rec.decline >= 1 && d8a.declined === 1 && d8a.holder == null && d8b.holder == null && d8a.phase === 'free' && d8b.phase === 'free' && Math.hypot(d8a.pos[0] - d8b.pos[0], d8a.pos[2] - d8b.pos[2]) < 0.5,
    { kx: d8b.rec.decline, hostDeclined: d8a.declined, holder: [d8a.holder, d8b.holder], phase: [d8a.phase, d8b.phase], pos: [d8a.pos, d8b.pos] });
  R('8b. … touched and the last carrier are as before the grant, and the S39 overtime goes on (no \'stopped\')', d8a.overtime && d8a.winner == null && post8.touched === pre8.touched && JSON.stringify(post8.lc) === JSON.stringify(pre8.lc) && post8.open,
    { overtime: d8a.overtime, winner: d8a.winner, reason: d8a.reason, pre: pre8, post: post8 });

  // ---- 9. the window runs out (nobody of Bravo grabs it): the same result on both screens
  await A.until(`__G.match.karp.winner != null`, 16000, 200).catch(() => {});
  for (const c of [A, B]) await c.until(`!!__G.match.result`, 20000, 250).catch(() => {});
  const end = async (c) => J(c, `(() => { const r = __G.match.result, K = __G.match.karp; return { winner: r ? r.winner : K && K.winner, reason: r ? r.reason : K && K.reason, counts: r ? r.counts : K && K.count, mode: r && r.mode }; })()`);
  const ea = await end(A), eb = await end(B);
  R('9. the window ran out: Alpha wins \'no-pickup\', and both screens show the same result (mode, winner, reason, counts)', ea.mode === 'bazookarp' && ea.winner === 0 && ea.reason === 'no-pickup' && eb.mode === ea.mode && eb.winner === ea.winner && eb.reason === ea.reason && JSON.stringify(eb.counts) === JSON.stringify(ea.counts), { host: ea, guest: eb });
  const errs = [];
  for (const c of [A, B]) errs.push(...(c.log || []).filter((l) => /TypeError|ReferenceError|Uncaught/.test(l)));
  R('no page errors on either screen', errs.length === 0, errs.slice(0, 4));
}
