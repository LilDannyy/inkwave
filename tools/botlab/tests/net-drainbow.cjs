// Drainbow online (src/game/sp-drainbow.js): two real clients on the local relay (netpage.cjs), online Practice with no
// bots, one player a side. Host (A) sets a Drainbow down; the guest (B, the other team):
//   - sees it as a ghost from A's records: the same spot, radius and life, live on its screen
//   - walks into it: its own screen greys and muffles, its own ink drains (B's screen runs B's drain)
//   - meanwhile A's screen sees B inside (synced positions): A is fed (its share → bubble time) and records the longer
//     life; B's ghost follows it
//   - B shoots A inside it: B's screen halves the shot (its ghost bubble) and the halved damage is what lands on A;
//     a shot at A standing outside it: full
//   - A's Drainbow ends: B's ghost pops, B's colour and hearing come back
//   CLIENTS=2 NET=tools/botlab/tests/net-drainbow.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async (ctx) => {
  const { clients, R, wait, say } = ctx;
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  say('room', code);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await B.until(`__G.net.lobby.players.length === 2 && __G.net.lobby.mode === 'practice'`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  const teams = [await A.js('__G.match.local.team'), await B.js('__G.match.local.team')];
  R('two players, one a side', teams[0] !== teams[1], { teams });
  // a flat open spot near the middle (A's screen), and a clear line 12 m out from it
  const S = await J(A, `(() => {
    const G = __G, nodes = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    const flat = (x, y, z, r1) => { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= r1; r++) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
    for (const n of nodes) {
      if (!flat(n.x, n.y, n.z, 5)) continue;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let ok = true;
        for (let r = 5; r <= 13 && ok; r++) ok = Math.abs(G.level.groundHeight(n.x + dx * r, n.z + dz * r, n.y + 1.5) - n.y) < 0.2;
        if (ok) return { x: n.x, y: n.y, z: n.z, dx, dz }; }
    }
    return null; })()`);
  R('a flat spot for it', !!S, S);
  if (!S) return;
  // both stand still (the autopilot off), A at the spot, B 11 m out
  const hold = (c) => c.js(`(() => { const me = __G.match.local; if (me.bot) me.bot.update = () => { me.intent.move.set(0, 0, 0); me.intent.fire = me.intent.squid = me.intent.sub = me.intent.special = me.intent.jump = false; }; me.hp = 100; me.invuln = 0; return 1; })()`);
  await hold(A); await hold(B);
  const put = (c, x, z) => c.js(`(() => { const me = __G.match.local; me.pos.set(${x}, ${S.y} + 0.02, ${z}); me.vel.set(0, 0, 0); me.netTp = (me.netTp || 0) + 1; return 1; })()`);
  await put(A, S.x, S.z);
  await put(B, S.x + S.dx * 11, S.z + S.dz * 11);
  await wait(1500);
  // ---- A sets it down
  await A.js(`(() => { const me = __G.match.local; me.specialId = 'drainbow'; me.special = me.specialCost(); me._startSpecial(); return 1; })()`);
  const own = await J(A, `(() => { const b = __G.drainbow.bubbles[0]; return b ? { x: b.pos.x, y: b.pos.y, z: b.pos.z, r: b.r, life: b.life, ghost: b.ghost } : null; })()`);
  await B.until(`__G.drainbow.bubbles.length > 0`, 8000).catch(() => null);
  const gh = await J(B, `(() => { const b = __G.drainbow.bubbles[0]; return b ? { x: b.pos.x, y: b.pos.y, z: b.pos.z, r: b.r, life: b.life, ghost: b.ghost, live: b.live, team: b.team } : null; })()`);
  R('the guest sees the host\'s Drainbow as a ghost: same spot, radius, life', !!own && !!gh && gh.ghost && gh.live && Math.hypot(gh.x - own.x, gh.y - own.y, gh.z - own.z) < 0.03 && gh.r === own.r && Math.abs(gh.life - own.life) < 0.02, { own, ghost: gh });
  // ---- B walks in (its own screen moves it: 4 m/s)
  await B.js(`(() => { const me = __G.match.local, t = { x: ${S.x + S.dx * 1.8}, z: ${S.z + S.dz * 1.8} };
    window.__walk = setInterval(() => { const dx = t.x - me.pos.x, dz = t.z - me.pos.z, l = Math.hypot(dx, dz); if (l < 0.1) { clearInterval(window.__walk); return; } const s = Math.min(l, 4 / 30); me.pos.x += dx / l * s; me.pos.z += dz / l * s; }, 33); me.ink = 100; return 1; })()`);
  await B.until(`__G.drainbow.view.level > 0.99`, 8000).catch(() => null);
  const bIn = await J(B, `({ level: __G.drainbow.view.level, damp: __G.audio.damp, inside: __G.drainbow.view.inside })`);
  R('the guest walking in: its own screen greys and muffles', bIn.level > 0.99 && bIn.damp > 0.99, bIn);
  await wait(2000);
  const bInk = await B.js(`__G.match.local.ink`);
  R('…and its own screen drains its tank', bInk < 90, { ink: bInk });
  // A's screen: B inside (its synced position) → A fed: the longer life, recorded; B's ghost follows
  const aSees = await J(A, `(() => { const b = __G.drainbow.bubbles[0], foe = __G.match.actors.find((x) => x.team !== __G.match.local.team && !x.isBot); return { inside: !!(b && foe && b.in.get(foe)), life: b && b.life }; })()`);
  await wait(800);
  const lives = [await A.js(`__G.drainbow.bubbles[0] ? __G.drainbow.bubbles[0].life : 0`), await B.js(`__G.drainbow.bubbles[0] ? __G.drainbow.bubbles[0].life : 0`)];
  R('the host\'s screen sees the guest inside and feeds its Drainbow (life past 8.5 s); the guest\'s ghost gets the longer life from the record', aSees.inside && lives[0] > 8.6 && Math.abs(lives[0] - lives[1]) < 0.35, { aSees, lives });
  // ---- B shoots A inside it: the halved damage lands on A
  const shoot = () => B.js(`(() => { const G = __G, me = G.match.local, foe = G.match.actors.find((x) => x.team !== me.team && !x.isBot);
    const from = me.pos.clone(); from.y += 0.9; const to = foe.pos.clone(); to.y += 0.9; from.addScaledVector(to.clone().sub(from).normalize(), 0.6);
    G.projectiles.fireCustom(me, from, to.clone().sub(from).normalize(), { speed: 40, damage: 40, range: 30, grav: 0, drag: 0, straight: 99, radius: 0.3 }); return 1; })()`);
  await A.js(`(() => { const me = __G.match.local; me.hp = 100; me.invuln = 0; return 1; })()`);
  await shoot();
  await wait(1200);
  const hpIn = await A.js(`__G.match.local.hp`);
  R('the guest shoots the host inside it: half lands on the host (the guest\'s screen halved it)', Math.abs((100 - hpIn) - 20) < 0.6, { lost: 100 - hpIn });
  // ---- the end: A's special ends → B's ghost pops, its colour comes back
  await A.js(`(() => { __G.specials.end(__G.match.local, 'time'); return 1; })()`);
  await B.until(`!__G.drainbow.bubbles.some((b) => b.live)`, 6000).catch(() => null);
  await B.until(`__G.drainbow.view.level === 0`, 6000).catch(() => null);
  const bEnd = await J(B, `({ bubbles: __G.drainbow.bubbles.length, live: __G.drainbow.live, level: __G.drainbow.view.level, damp: __G.audio.damp })`);
  R('the host\'s Drainbow ends: the guest\'s ghost pops, its colour and hearing come back', !bEnd.live && bEnd.level === 0 && bEnd.damp === 0, bEnd);
  // a shot at the host outside any bubble now: full
  await A.js(`(() => { const me = __G.match.local; me.hp = 100; me.invuln = 0; return 1; })()`);
  await shoot();
  await wait(1200);
  const hpOut = await A.js(`__G.match.local.hp`);
  R('…and a shot at the host now lands in full', Math.abs((100 - hpOut) - 40) < 0.6, { lost: 100 - hpOut });
  const errs = clients.flatMap((c) => c.log.filter((l) => /error|TypeError|ReferenceError/i.test(l)));
  R('no console errors', !errs.length, errs.slice(0, 5));
};
