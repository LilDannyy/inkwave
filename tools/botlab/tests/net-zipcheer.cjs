// [b5-zipcheer] The Cheer Orb's cheers online (src/game/sp-cheer.js), two real clients on the local relay (netpage.cjs):
// online Practice, no bots, the host (A, "Hosty") and the guest (B, "Guesty") on ONE team.
//   1. A uses a Cheer Orb: A rises and hangs on its own screen; B's screen sees A up there too (A's tick) and B's HUD
//      shows the big cheer prompt with A's name (A's own HUD: not its own orb's prompt)
//   2. B cheers: a wisp flies to A's orb on BOTH screens (B's own, and A's from B's ['k', …, 'cheer'] record); A's screen
//      (the orb's owner) adds the +0.12 charge when its wisp lands, and B's screen gets that charge back through A's tick;
//      B's gauge gains 4 % on B's screen (its own gauge), with its HUD wisp
//   3. A throws: A drops back down on both screens, B's prompt goes
//   4. the other way round: B (the guest) uses an orb, A (the host — as the host's bots would) cheers: the charge lands on
//      B's screen (the orb's owner), A's gauge gains on A's screen
//   CLIENTS=2 NET=tools/botlab/tests/net-zipcheer.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS='shots': pictures of B's screen (the risen host, the prompt, the wisps) into OUT
module.exports = async (ctx) => {
  const { clients, R, wait, say, args, out } = ctx;
  const [A, B] = clients;
  const SHOTS = /shots/.test(args || '');
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
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
  R('host and guest on one team', teams[0] === teams[1], { teams });
  // a flat open spot near the middle (A's screen) and a clear line 9 m out from it
  const S = await J(A, `(() => {
    const G = __G, nodes = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    const flat = (x, y, z, r1) => { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= r1; r++) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
    for (const n of nodes) {
      if (!flat(n.x, n.y, n.z, 4)) continue;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let ok = true;
        for (let r = 4; r <= 10 && ok; r++) ok = Math.abs(G.level.groundHeight(n.x + dx * r, n.z + dz * r, n.y + 1.5) - n.y) < 0.2;
        if (ok) return { x: n.x, y: n.y, z: n.z, dx, dz }; }
    }
    return null; })()`);
  R('a flat spot for it', !!S, S);
  if (!S) return;
  // both stand still; A at the spot, B 8 m out facing A (its camera on A)
  const put = (c, x, z, face) => c.js(`(() => { const g = window.__inkwave, me = __G.match.local; me.pos.set(${x}, ${S.y} + 0.02, ${z}); me.vel.set(0, 0, 0); me.netTp = (me.netTp || 0) + 1; me.hp = 100; me.invuln = 0;
    const yaw = ${face}; me.yaw = me.aimYaw = yaw; if (g.rig) { g.rig.yaw = yaw; g.rig.pitch = -0.12; } return 1; })()`);
  const bx = S.x + S.dx * 8, bz = S.z + S.dz * 8;
  await put(A, S.x, S.z, Math.atan2(S.dx, S.dz));
  await put(B, bx, bz, Math.atan2(-S.dx, -S.dz));
  await wait(1500);
  // listeners on both screens
  const listen = (c) => c.js(`(async () => { const { on } = await import('./src/core/ctx.js'); const L = window.__zc = { orb: [], gain: [], cheer: [] };
    on('cheer:orb', (e) => L.orb.push({ from: e.actor?.nid, to: e.target?.nid, fromLocal: !!e.actor?.isLocal, toLocal: !!e.target?.isLocal, charge: e.target?.specialActive?.charge ?? null, t: e.target?.specialActive?.t ?? null }));
    on('cheer:gain', (e) => L.gain.push({ who: e.actor?.nid, local: !!e.actor?.isLocal, frac: e.frac }));
    on('actor:cheer', (e) => L.cheer.push({ who: e.actor?.nid, remote: !!e.remote, targets: e.targets }));
    return 1; })()`);
  await listen(A); await listen(B);
  const ids = await J(A, `(() => { const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me); return { a: me.nid, b: him && him.nid }; })()`);

  // ---------------------------------------------------------------- 1. A uses it: up on both screens, B's prompt
  const startOrb = (c) => c.js(`(() => { const me = __G.match.local; me.specialId = 'booyah'; me.special = me.specialCost(); me._startSpecial(); return 1; })()`);
  await startOrb(A);
  await wait(1200);
  const aUp = await J(A, `(() => { const me = __G.match.local, s = me.specialActive; return { pin: !!(s && s.pin), up: me.pos.y - ${S.y}, id: s && s.id, prompt: __G.hud.cheer.state().on }; })()`);
  const bSee = await J(B, `(() => { const m = __G.match, a = m.actors.find((x) => x.nid === ${ids.a}), s = a && a.specialActive, st = __G.hud.cheer.state();
    return { up: a ? a.pos.y - ${S.y} : null, ghost: !!(s && s.ghost), id: s && s.id, prompt: st.on, name: st.name, key: st.key }; })()`);
  R('A uses a Cheer Orb: A hangs ~2.2 m up on its own screen and on B\'s (A\'s tick); B\'s HUD shows the big cheer prompt for A ("Hosty"), A\'s own HUD none',
    aUp.pin && Math.abs(aUp.up - 2.2) < 0.15 && bSee.ghost && bSee.id === 'booyah' && Math.abs(bSee.up - aUp.up) < 0.25 && bSee.prompt && bSee.name === 'Hosty' && !aUp.prompt, { A: aUp, B: bSee });
  if (SHOTS) { await B.shot(`${out}/zipcheer-net-guest-prompt.png`); say('shot guest-prompt'); }

  // ---------------------------------------------------------------- 2. B cheers
  const sp0 = await J(B, `(() => { const me = __G.match.local; me.special = me.specialCost() * 0.5; return { special: me.special, cost: me.specialCost() }; })()`);
  await B.js(`(() => { __G.match.local.intent.cheer = true; return 1; })()`);
  if (SHOTS) { await wait(220); await B.shot(`${out}/zipcheer-net-guest-wisps.png`); say('shot guest-wisps'); }
  await wait(1600);
  const LA = await J(A, `window.__zc`), LB = await J(B, `window.__zc`);
  const bAfter = await J(B, `(() => { const me = __G.match.local, a = __G.match.actors.find((x) => x.nid === ${ids.a}), s = a && a.specialActive; return { special: me.special, ghostCharge: s ? s.charge : null, ghostT: s ? s.t : null, hudGains: __G.hud.cheer.state().gains }; })()`);
  const aAfter = await J(A, `(() => { const s = __G.match.local.specialActive; return s ? { charge: s.charge, t: s.t } : null; })()`);
  const wA = LA.orb.filter((o) => o.from === ids.b && o.to === ids.a), wB = LB.orb.filter((o) => o.from === ids.b && o.to === ids.a);
  R('B cheers: a wisp reaches A\'s orb on B\'s screen (B\'s own) and on A\'s (from B\'s record)', wB.length === 1 && wB[0].fromLocal && wA.length === 1 && !wA[0].fromLocal && wA[0].toLocal && LA.cheer.some((c) => c.who === ids.b && c.remote && c.targets === 1),
    { onA: wA, onB: wB, cheersOnA: LA.cheer });
  // the orb's charge: A's screen added the cheer as its wisp landed (charge − its own climb ≈ 0.12); B's ghost has it from A's tick
  const extraA = wA[0] ? wA[0].charge - wA[0].t / 4.5 : null;
  const extraA2 = aAfter ? aAfter.charge - aAfter.t / 4.5 : null;
  R('…the orb\'s charge: A\'s screen (its owner) adds +0.12 as the wisp lands; B\'s screen shows A\'s orb with the same charge (A\'s tick)',
    extraA !== null && Math.abs(extraA - 0.12) < 0.02 && Math.abs(extraA2 - 0.12) < 0.02 && aAfter && bAfter.ghostCharge !== null && Math.abs(bAfter.ghostCharge - aAfter.charge) < 0.06,
    { extraOnA: extraA && +extraA.toFixed(3), A: aAfter, Bghost: bAfter.ghostCharge });
  const gainB = bAfter.special - sp0.special;
  R('…and B\'s gauge gains 4 % on B\'s screen (its HUD wisp landed); none of that on A\'s screen', Math.abs(gainB - 0.04 * sp0.cost) < 0.05 && LB.gain.length === 1 && LB.gain[0].local && bAfter.hudGains >= 1 && LA.gain.length === 0,
    { gain: +gainB.toFixed(2), of: sp0.cost, gainsOnB: LB.gain, gainsOnA: LA.gain });

  // ---------------------------------------------------------------- 3. A throws: down on both screens, the prompt goes
  await A.js(`(() => { const s = __G.match.local.specialActive; if (s) s.charge = 1; return 1; })()`);
  await wait(300);
  await A.js(`(() => { __G.match.local.fireBuffer = 0.3; return 1; })()`);
  await wait(1800);
  const aDown = await J(A, `(() => { const me = __G.match.local; return { sp: me.specialActive ? me.specialActive.id : null, up: me.pos.y - ${S.y}, grounded: me.grounded, orbs: __G.specials.world.filter((w) => w.kind === 'orb').length }; })()`);
  const bDown = await J(B, `(() => { const a = __G.match.actors.find((x) => x.nid === ${ids.a}); return { sp: a.specialActive ? a.specialActive.id : null, up: a.pos.y - ${S.y}, prompt: __G.hud.cheer.state().on }; })()`);
  R('A throws: A drops back down on both screens; B\'s prompt goes', !aDown.sp && aDown.up < 0.1 && aDown.grounded && !bDown.sp && bDown.up < 0.2 && !bDown.prompt, { A: aDown, B: bDown });
  await wait(2500);   // (the orb's blast)

  // ---------------------------------------------------------------- 4. the other way: B's orb, A cheers
  await put(A, S.x, S.z, Math.atan2(S.dx, S.dz)); await put(B, bx, bz, Math.atan2(-S.dx, -S.dz));
  for (const c of [A, B]) await c.js(`(() => { const L = window.__zc; L.orb.length = 0; L.gain.length = 0; L.cheer.length = 0; const me = __G.match.local; if (!me.alive) me.respawn(); me._cheerT = -9; return 1; })()`);
  await wait(800);
  await startOrb(B);
  await wait(1000);
  const sa0 = await J(A, `(() => { const me = __G.match.local; me.special = me.specialCost() * 0.3; return { special: me.special, cost: me.specialCost(), prompt: __G.hud.cheer.state().on, name: __G.hud.cheer.state().name }; })()`);
  await A.js(`(() => { __G.match.local.intent.cheer = true; return 1; })()`);
  await wait(1600);
  const LA2 = await J(A, `window.__zc`), LB2 = await J(B, `window.__zc`);
  const bOrb = await J(B, `(() => { const s = __G.match.local.specialActive; return s ? { charge: s.charge, t: s.t, pin: !!s.pin } : null; })()`);
  const aSp = await J(A, `__G.match.local.special`);
  const wOnB = LB2.orb.filter((o) => o.from === ids.a && o.to === ids.b), wOnA = LA2.orb.filter((o) => o.from === ids.a && o.to === ids.b);
  const extraB = wOnB[0] ? wOnB[0].charge - wOnB[0].t / 4.5 : null;
  R('the other way: the guest\'s orb, the host cheers (as its bots do): A\'s prompt names "Guesty"; wisps on both screens; the +0.12 lands on B\'s screen (the orb\'s owner); A\'s gauge +4 % on A\'s',
    sa0.prompt && sa0.name === 'Guesty' && bOrb && bOrb.pin && wOnA.length === 1 && wOnB.length === 1 && extraB !== null && Math.abs(extraB - 0.12) < 0.02 && Math.abs(aSp - sa0.special - 0.04 * sa0.cost) < 0.05 && LA2.gain.length === 1 && LB2.gain.length === 0,
    { promptOnA: sa0, wOnA: wOnA.length, wOnB: wOnB.length, extraOnB: extraB && +extraB.toFixed(3), gainA: +(aSp - sa0.special).toFixed(2) });
  await B.js(`(() => { __G.specials.end(__G.match.local, 'test'); return 1; })()`);
  await wait(500);

  const errs = clients.flatMap((c) => c.log.filter((l) => /error|TypeError|ReferenceError/i.test(l)));
  R('no console errors', !errs.length, errs.slice(0, 5));
};
