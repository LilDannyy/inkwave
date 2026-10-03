// Two-handed holds online (batch 5 [b5-holds]): real clients on the local relay (netpage.cjs), an online Practice.
// Nothing new crosses the wire — a remote player's squidkid is posed by the same character code from the replayed
// state — so this checks that it shows: each player walks, fires (rolls / swipes / shoots / opens the canopy) and jumps,
// and on the OTHER screen that player's remote squidkid keeps its off hand on the weapon on every kid-form frame.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-holds.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'a=roller;b=brolly' (default) · 'a=brush;b=blaster' — the host's and the guest's weapons
module.exports = async ({ clients, R, wait, say, args, open }) => {
  for (const c of clients.slice(0, 2)) {
    if (/[?&]autopilot(&|=|$)/.test(c.url || '')) continue;
    say(`c${c.i} has no ?autopilot (run with Q0=autopilot Q1=autopilot) — reopening it with it`);
    await open(c.i, 'autopilot');
  }
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const WA = opt.a || 'roller', WB = opt.b || 'brolly';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  await A.js(`__inkwave.api.setLoadout({ weapon: ${JSON.stringify(WA)} }); 1`);
  await B.js(`__inkwave.api.setLoadout({ weapon: ${JSON.stringify(WB)} }); 1`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 0, difficulty: 'easy' }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  // (each picks its weapon in the room too: an ?autopilot client may have come in with another loadout)
  await A.js(`__G.net.setMe({ weapon: ${JSON.stringify(WA)} }); 1`); await B.js(`__G.net.setMe({ weapon: ${JSON.stringify(WB)} }); 1`);
  await A.until(`(() => { const p = __G.net.lobby.players; return p.length === 2 && p.some((x) => x.weapon === ${JSON.stringify(WA)}) && p.some((x) => x.weapon === ${JSON.stringify(WB)}); })()`, 10000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up');
  // each screen drives its own kid round a loop: walking, the trigger held for 1.4 s of every 3, a hop every 4 s
  const drive = (c) => c.js(`(() => { const a = __G.match.local; let t = 0; if (!a.bot) return 0;
    a.bot.update = () => { t += 1 / 60; const it = a.intent; it.move.set(Math.sin(t * 0.8), 0, Math.cos(t * 0.8)); it.fire = (t % 3) > 1.6; it.jump = (t % 4) < 0.05; it.squid = it.sub = it.special = false; a.aimPitch = 0; };
    return 1; })()`);
  R('both kids are driven', (await drive(A)) === 1 && (await drive(B)) === 1);
  // on each screen: the OTHER player's remote squidkid, sampled every 50 ms for 10 s
  const sampler = (c) => c.js(`(async () => { const { GRIP_HOLE_L } = await import('./src/game/character-weapons.js'); const THREE = await import('three');
    const m = __G.match, me = m.local, him = m.actors.find((x) => !x.isBot && x !== me);
    const S = window.__holdsNet = { kind: him && him.character.weaponKind, both: !!(him && him.character.hold.both), n: 0, off: 0, worst: 0, skipped: 0, firing: 0, moved: 0 };
    if (!him) return 0;
    const h = new THREE.Vector3(), g = new THREE.Vector3(), u = new THREE.Vector3(), p0 = him.pos.clone();
    const id = setInterval(() => {
      const ch = him.character;
      S.moved += him.pos.distanceTo(p0); p0.copy(him.pos);
      if (!him.alive || him.form !== 'kid' || ch.form !== 'kid' || ch.bombHeld || ch.wSub > 0.05 || ch.tr[2] < 0.62 || ch.formT < 0.5 || ch.weaponHidden) { S.skipped++; return; }
      ch.root.updateMatrixWorld(true);
      const w = ch.weapon, gl = w.def.gripL; g.copy(gl.pos); if (w.pump) g.z -= 0.036 * w.pump; w.off.localToWorld(g);
      h.copy(GRIP_HOLE_L); ch.bones.handL.localToWorld(h);
      const d = h.distanceTo(g) / ch.kid.getWorldScale(u).y;
      S.n++; if (d > 0.03) S.off++; S.worst = Math.max(S.worst, d); if (ch.wAim > 0.5 || ch.wRoll > 0.5 || ch.tr[1] < 0.5) S.firing++;
    }, 50);
    setTimeout(() => clearInterval(id), 10000); return 1; })()`);
  await sampler(A); await sampler(B);
  await wait(10800);
  for (const [c, other, wt] of [[A, 'B', WB], [B, 'A', WA]]) {
    const S = await J(c, `window.__holdsNet`);
    S.worst = +S.worst.toFixed(3); S.moved = +S.moved.toFixed(1);
    R(`c${c.i}: ${other}'s remote squidkid holds the ${wt} (a two-handed hold)`, S.kind === wt && S.both, S);
    R(`c${c.i}: ${other}'s remote squidkid moved and fired while sampled`, S.moved > 10 && S.firing > 10, { moved: S.moved, firing: S.firing });
    R(`c${c.i}: ${other}'s remote squidkid keeps its off hand on the ${wt} (≤ 3 cm) on every kid-form frame`, S.n > 60 && S.off === 0, S);
  }
};
