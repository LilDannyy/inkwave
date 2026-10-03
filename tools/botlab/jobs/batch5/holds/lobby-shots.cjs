// Pictures of the room lobby's line-up holding the four two-handed weapons (brolly / roller / brush / blaster), in the
// offline stand-in (?netmock=1), at a few moments of their lobby / menu dances:
//   CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/batch5/holds/lobby-shots.cjs OUT=/dir tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients: [A], R, wait, say, out, args }) => {
  const tag = args || 'lobby';
  const snap = async (file, o) => { await wait(1200); await A.shot(file, o); await wait(900); return A.shot(file, o); };
  A.win.setContentSize(1280, 720); await wait(500);
  await A.js(`__inkwave.api.setLoadout({ weapon: 'brolly' }); 1`);
  await A.js(`__inkwave.menus.show('online'); 1`);
  await A.until(`__G.net && __G.net.isMock`, 10000);
  await A.js(`__G.net.create('Holds')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await A.js(`(() => { const m = __G.net.mock;
    m.add({ name: 'Rolo', team: 0, weapon: 'roller', ready: true }); m.add({ name: 'Bristle', team: 0, weapon: 'brush' });
    m.add({ name: 'Boom', team: 1, weapon: 'blaster', ready: true }); m.add({ name: 'Brella', team: 1, weapon: 'brolly' });
    m.add({ name: 'Mop', team: 1, weapon: 'roller' }); return 1; })()`);
  await A.until(`__inkwave.menus.current === 'lobby'`, 10000);
  await wait(4000);
  for (let k = 0; k < 3; k++) { say(await snap(`${out}/${tag}-${k}.jpg`, { w: 1280, q: 80 })); await wait(1800); }
  const kinds = await A.js(`JSON.stringify((__inkwave.showcase?.lob?.members || __inkwave.showcase?.members || []).map?.((M) => M.c && [M.c.weaponKind, M.c.dance, !!M.c.hold?.both]) || null)`);
  R('the lobby line-up was shot', true, kinds);
};
