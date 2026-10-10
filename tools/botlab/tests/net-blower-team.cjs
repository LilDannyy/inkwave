// Team fire on a remote player's Bubble Blower bubble, online ([b5-int1]; the bug the subs designer found, DECISIONS.md:
// "fixed at integration, with a two-client test"). A bubble is set off by its own team's shots (specials.js _bubbleHit:
// its charge, popDamage 55). On another screen the shot hits that screen's ghost of the bubble and goes to the bubble's
// owner as a device hit — team fire as a negative amount, which kits/registry.js netHurt dropped (it sends dmg > 0 only):
// online, a teammate could never set off your bubble. Two real clients on the local relay, an online Practice, one team:
//   - the host blows a bubble and lets it go; the guest's screen shows its ghost
//   - the guest shoots it twice (team fire, 40 each): on the host's screen it charges and goes off; the guest's ghost
//     goes with it
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-blower-team.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async (ctx) => {
  const { clients, R, wait, say, open } = ctx;
  for (const c of clients.slice(0, 2)) if (!/[?&]autopilot(&|=|$)/.test(c.url || '')) await open(c.i, 'autopilot');
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const r2 = (x) => Math.round(x * 100) / 100;
  const code = await A.js(`__G.net.create('Hosty')`);
  say('room', code);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const teams0 = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams0[0] !== teams0[1]) { await B.js(`__G.net.setMe({ team: ${teams0[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  const teams = [await A.js('__G.match.local.team'), await B.js('__G.match.local.team')];
  R('two players on one team (online Practice, no bots)', teams[0] === teams[1], { teams });
  // both kids held still by their own screens (the autopilot's brain swapped for a script: window.__fire)
  for (const c of [A, B]) await c.js(`(() => { const me = __G.match.local; window.__fire = false; if (me.bot) me.bot.update = () => { const it = me.intent; it.move.set(0, 0, 0); it.squid = it.sub = it.special = it.jump = false; it.fire = !!window.__fire; me.special = me.special; }; me.invuln = 99; return 1; })()`);
  // a flat open spot (the host's screen); the host there, the guest 7 m off, facing it
  const S = await J(A, `(() => {
    const G = __G, nodes = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    const flat = (x, y, z, r1) => { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= r1; r++) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
    for (const n of nodes) {
      if (!flat(n.x, n.y, n.z, 3)) continue;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let ok = true;
        for (let r = 1; r <= 8 && ok; r++) ok = Math.abs(G.level.groundHeight(n.x + dx * r, n.z + dz * r, n.y + 1.5) - n.y) < 0.2;
        if (ok) return { x: n.x, y: n.y, z: n.z, dx, dz }; }
    }
    return null; })()`);
  R('a flat spot for it', !!S, S);
  if (!S) return;
  const put = (c, x, z, yaw) => c.js(`(() => { const me = __G.match.local; me.pos.set(${x}, ${S.y} + 0.02, ${z}); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = ${yaw}; me.aimPitch = 0; if (me.bot) { me.bot.aimYaw = ${yaw}; me.bot.aimPitch = 0; } me.netTp = (me.netTp || 0) + 1; return 1; })()`);
  await put(A, S.x, S.z, 0);
  await put(B, S.x + S.dx * 7, S.z + S.dz * 7, Math.atan2(-S.dx, -S.dz));
  await wait(1200);
  // the host blows one bubble (the trigger held 1.1 s), lets it go, and its special ends (the bubble floats on)
  await A.js(`(() => { const me = __G.match.local; me.specialId = 'blower'; me.special = me.specialCost(); me._startSpecial(); window.__fire = true; return 1; })()`);
  await wait(1100);
  await A.js(`(() => { window.__fire = false; return 1; })()`);
  await wait(500);
  await A.js(`(() => { const me = __G.match.local; if (me.specialActive) __G.specials.end(me, 'time'); return 1; })()`);
  const own = await J(A, `(() => { const w = __G.specials.world.find((x) => x.kind === 'bubble' && !x.ghost && !x.dead); return w ? { gid: w.gid, held: w.held, charge: w.charge, r: r(w.r), x: w.pos.x, y: w.pos.y, z: w.pos.z } : null; function r(x) { return Math.round(x * 100) / 100; } })()`);
  await B.until(`__G.specials.world.some((x) => x.kind === 'bubble' && x.ghost && !x.dead)`, 6000).catch(() => null);
  const gh = await J(B, `(() => { const w = __G.specials.world.find((x) => x.kind === 'bubble' && x.ghost && !x.dead); return w ? { gid: w.gid, x: w.pos.x, y: w.pos.y, z: w.pos.z, r: w.r } : null; })()`);
  R('the host\'s bubble, let go, floats on; the guest\'s screen shows its ghost', !!own && !own.held && !!gh && gh.gid === own.gid, { own, ghost: gh });
  if (!own || !gh) return;
  // the guest shoots the ghost bubble twice: team fire (40 each; popDamage 55)
  const t0 = Date.now();
  for (let i = 0; i < 2; i++) {
    await B.js(`(() => { const G = __G, me = G.match.local, w = G.specials.world.find((x) => x.kind === 'bubble' && x.ghost && !x.dead); if (!w) return 0;
      const from = me.pos.clone(); from.y += 1.0; const to = w.pos.clone(); const dir = to.clone().sub(from).normalize();
      G.projectiles.fireCustom(me, from, dir, { speed: 40, damage: 40, range: 30, grav: 0, drag: 0, straight: 99, radius: 0.3 }); return 1; })()`);
    await wait(350);
  }
  await A.until(`(() => { const w = __G.specials.world.find((x) => x.gid === ${own.gid} && !x.ghost); return !w || w.dead; })()`, 4000, 50).catch(() => null);
  const aAfter = await J(A, `(() => { const w = __G.specials.world.find((x) => x.gid === ${own.gid} && !x.ghost); return { gone: !w || !!w.dead, charge: w ? Math.round(w.charge) : null }; })()`);
  await B.until(`!__G.specials.world.some((x) => x.kind === 'bubble' && x.ghost && !x.dead && x.gid === ${gh.gid})`, 4000, 50).catch(() => null);
  const bAfter = await J(B, `(() => ({ ghostGone: !__G.specials.world.some((x) => x.kind === 'bubble' && x.ghost && !x.dead && x.gid === ${gh.gid}) }))()`);
  R('the guest\'s team shots on its screen set the host\'s bubble off on the host\'s screen (its charge reaches popDamage)', aAfter.gone, { ...aAfter, ms: Date.now() - t0 });
  R('…and the guest\'s ghost of it goes with it', bAfter.ghostGone, bAfter);
  const errs = [...new Set([...A.log, ...B.log])].filter((l) => /TypeError|Cannot read|Uncaught/.test(l));
  R('no console errors', !errs.length, errs.slice(0, 4));
};
