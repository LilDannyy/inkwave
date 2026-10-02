// Pictures of an online Practice session: the HUD tag, the pause menus (host / guest), the clear-ink wave (a high view
// of the whole stage and the guest's own camera, five frames each) and the stage-swap card.
//   CLIENTS=2 Q0=autopilot Q1=autopilot QUALITY=high NET=tools/botlab/jobs/private-rooms/session-shots.cjs \
//     OUT=tools/botlab/jobs/private-rooms/out tools/botlab/run.sh tools/botlab/netpage.cjs
// NET_ARGS: map=<id> (default saltpan), paint=<s> (default 22), only=wave|pause|swap (comma list)
module.exports = async ({ clients: [A, B], R, wait, say, out, args }) => {
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'saltpan', PAINT = +(opt.paint || 22), only = (opt.only || 'hud,pause,wave,swap').split(',');
  const code = await A.js(`__G.net.create('Marina')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: ${JSON.stringify(MAP)}, time: 'day', botCount: 4 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Kelp').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('painting', PAINT, 's');
  await wait(PAINT * 1000);
  if (only.includes('hud')) { await A.shot(`${out}/hud-host.jpg`); await B.shot(`${out}/hud-guest.jpg`); }
  if (only.includes('pause')) {
    await A.js(`__inkwave.pause(); 1`); await B.js(`__inkwave.pause(); 1`); await wait(1300);
    say('pause', JSON.stringify(await A.shot(`${out}/pause-host.jpg`)), JSON.stringify(await B.shot(`${out}/pause-guest.jpg`)));
    await A.js(`__inkwave.menus._openStageSwap(__inkwave.api.practiceInfo()); 1`); await wait(900);
    await A.shot(`${out}/swap-picker.jpg`);
    await A.js(`__inkwave.menus._closeModal(true); 1`);
    for (const c of [A, B]) await c.js(`__inkwave.resume(); 1`);
    await wait(600);
  }
  if (only.includes('wave')) {
    // (everyone stops shooting a few seconds before, so nobody is mid-splat in the pictures; the ink stays)
    for (const c of [A, B]) await c.js(`(() => { for (const a of __G.match.actors) if (a.bot && !a.remote) { a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.sub = a.intent.special = a.intent.jump = false; }; } __G.projectiles.clear(); return 1; })()`);
    await B.until(`__G.match.local.alive`, 15000); await A.until(`__G.match.local.alive`, 15000);
    await wait(3500);
    // the guest's camera: high over the stage, looking across it (held: a long cinematic)
    await B.js(`(async () => { const THREE = await import('three'); const g = __inkwave, Bd = __G.level.bounds, a = __G.match.actors.find((x) => x.owner === __G.net.hostId && !x.isBot) || { pos: new THREE.Vector3() };
      const c = new THREE.Vector3((Bd.minX + Bd.maxX) / 2, 0, (Bd.minZ + Bd.maxZ) / 2), from = new THREE.Vector3(c.x + (Bd.maxX - Bd.minX) * 0.95, 34, a.pos.z * 0.5 + c.z * 0.5);
      g.rig.cinematic(from, from, c, c, 60, () => {}); g.hud.setVisible(false); return 1; })()`);
    await wait(500);
    await A.js(`__inkwave.api.practiceClearInk()`);
    const t0 = Date.now();
    for (const [i, at] of [[1, 90], [2, 300], [3, 560], [4, 860], [5, 1300]].values()) {
      const left = at - (Date.now() - t0); if (left > 0) await wait(left);
      await Promise.all([B.shot(`${out}/wave-high-${i}.jpg`), A.shot(`${out}/wave-host-${i}.jpg`)]);
    }
    await A.until(`!__G.paint.wiping`, 10000);
    await wait(900);
    await B.shot(`${out}/wave-high-after.jpg`);
    const st = JSON.parse(await B.js(`JSON.stringify({ fx: __inkwave.inkWipe.stats, inked: __G.paint.grid.reduce((s, v) => s + (v ? 1 : 0), 0) })`));
    say('wave', JSON.stringify(st));
    await B.js(`__inkwave.rig.follow(__G.match.local, true); __inkwave.hud.setVisible(true); 1`);
  }
  if (only.includes('swap')) {
    await A.js(`__inkwave.api.practiceSwapStage('halyard', 'golden')`);
    await wait(500);
    await A.shot(`${out}/swap-card-host.jpg`); await B.shot(`${out}/swap-card-guest.jpg`);
    for (const c of [A, B]) await c.until(`__inkwave.mapDef.id === 'halyard' && __G.match && __G.match.state === 'playing'`, 60000, 250);
    await wait(2500);
    await B.shot(`${out}/swap-after-guest.jpg`);
  }
  R('session pictures', true);
};
