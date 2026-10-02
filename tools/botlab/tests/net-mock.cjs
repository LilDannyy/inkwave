// ?netmock=1 (the offline stand-in for G.net, src/net/mock.js) knows the new room settings and plays Practice: the host's
// settings, a Practice session (your own, on the room's stage, dressed as the room's: the PRACTICE · <code> tag and the
// online pause menu), the clear-ink wave, a stage swap, End Practice back to the lobby.
//   CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/tests/net-mock.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients: [A], R, wait, out, args }) => {
  const J = async (code) => JSON.parse(await A.js(`JSON.stringify(${code})`));
  await A.js(`__inkwave.menus.show('online'); 1`);
  await A.until(`__G.net && __G.net.isMock`, 10000);
  const code = await A.js(`__G.net.create('Mocky')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'random', time: 'golden', botCount: 3 }); 1`);
  const l = await J(`({ mode: __G.net.lobby.mode, map: __G.net.lobby.map, time: __G.net.lobby.time, botCount: __G.net.lobby.botCount, plan: __G.net.botPlan() })`);
  R('mock: the host\'s settings (practice · random · golden · 3 bots)', l.mode === 'practice' && l.map === 'random' && l.time === 'golden' && l.botCount === 3 && l.plan.total === 3, l);
  await A.js(`__G.net.setSettings({ time: 'dusk' }); 1`);
  R('mock: "dusk" from an older client is sunset', (await A.js(`__G.net.lobby.time`)) === 'sunset');
  if (/shots/.test(args)) { await wait(2000); await A.shot(`${out}/mock-lobby.jpg`); }
  R('mock: Practice can start without anyone readying up', await A.js(`__G.net.canStart()`));
  await A.js(`__G.net.start(); 1`);
  await A.until(`__G.mode === 'match' && __G.match && __G.match.practice && __G.match.state === 'playing'`, 60000, 250);
  const info = await J(`__inkwave.api.practiceInfo()`);
  R('mock: a practice on the room\'s stage, shown as the room\'s (online, host, code)', info.online && info.host && info.code === code && !!info.mapId, { map: info.mapId, time: info.time, code: info.code });
  const tag = await A.js(`document.querySelector('.iw-timer__txt')?.textContent || ''`);
  R('mock: the HUD reads PRACTICE · <code>', tag === `PRACTICE · ${code}`, { tag });
  await A.js(`__inkwave.pause(); 1`); await wait(700);
  const items = await J(`[...document.querySelectorAll('.iw-pause__menu .iw-btn__label')].map((e) => e.textContent)`);
  R('mock: the host\'s pause menu (clear all ink · swap stage · end practice · leave room)', ['CLEAR ALL INK', 'SWAP STAGE', 'END PRACTICE', 'LEAVE ROOM'].every((x) => items.includes(x)), items);
  if (/shots/.test(args)) await A.shot(`${out}/mock-pause.jpg`);
  await A.js(`__inkwave.resume(); 1`);
  await A.js(`__inkwave.debug.paintRandom(300); 1`);
  await wait(300);
  const ok = await A.js(`__inkwave.api.practiceClearInk()`);
  await A.until(`!__G.paint.wiping`, 10000);
  const inked = await A.js(`__G.paint.grid.reduce((s, v) => s + (v ? 1 : 0), 0)`);
  R('mock: the clear-ink wave runs and leaves no ink', ok && inked === 0, { ok, inked });
  const was = info.mapId;
  await A.js(`__inkwave.api.practiceSwapStage('random', 'sunset')`);
  await A.until(`__inkwave.mapDef.id !== ${JSON.stringify(was)} && __G.match && __G.match.practice && __G.match.state === 'playing'`, 60000, 250);
  R('mock: swap stage moves the practice', (await A.js(`__inkwave.theme`)) === 'sunset', { map: await A.js('__inkwave.mapDef.id') });
  // (ended straight away — maybe while the swap's stage is still building: the end wins)
  await A.js(`__inkwave.api.practiceEnd(); 1`);
  await A.until(`__G.mode === 'menu' && __G.net.state === 'lobby' && __inkwave.menus.current === 'lobby'`, 30000, 250);
  R('mock: End Practice is back in the lobby', !(await A.js(`__G.net.lobby.live`)));
};
