// Pictures of the room lobby with the new host settings (host's view and a guest's read-only view).
//   CLIENTS=2 NET=tools/botlab/jobs/private-rooms/lobby-shots.cjs OUT=tools/botlab/jobs/private-rooms/out tools/botlab/run.sh tools/botlab/netpage.cjs
// NET_ARGS: comma list of setting presets to shoot (default 'turf,practice')
module.exports = async ({ clients: [A, B], R, wait, say, out, args }) => {
  const code = await A.js(`__G.net.create('Marina')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Kelp').then(() => { __inkwave.menus.show('lobby'); return 1; })`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  const presets = {
    turf: { mode: 'turf', map: 'halyard', time: 'golden', botCount: -1, duration: 180, difficulty: 'normal' },
    practice: { mode: 'practice', map: 'random', time: 'sunset', botCount: 2, difficulty: 'easy' },
    boss: { mode: 'boss', map: 'tidewater', time: 'day', botCount: 3 },
    cargo: { mode: 'turf', map: 'cargo', time: 'random' },
  };
  for (const name of (args || 'turf,practice').split(',')) {
    const p = presets[name];
    if (!p) continue;
    await A.js(`__G.net.setSettings(${JSON.stringify(p)}); 1`);
    await wait(2600);
    const r1 = await A.shot(`${out}/lobby-host-${name}.jpg`);
    const r2 = await B.shot(`${out}/lobby-guest-${name}.jpg`);
    say(name, r1 && r1.bytes, r2 && r2.bytes);
  }
  const l = JSON.parse(await B.js(`JSON.stringify(__G.net.lobby)`));
  R('pictures taken', true, { mode: l.mode, map: l.map, time: l.time, botCount: l.botCount });
};
