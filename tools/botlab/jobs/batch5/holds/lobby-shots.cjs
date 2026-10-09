// Pictures of the room lobby's line-up holding the four two-handed weapons (brolly / roller / brush / blaster), in the
// offline stand-in (?netmock=1), at a few moments of their lobby / menu dances — then everyone's HEY! emote (the same
// 'emote' event a real room's relay delivers: menus → showcase.lobbyEmote on each screen), checked and pictured:
//   CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/batch5/holds/lobby-shots.cjs OUT=/dir tools/botlab/run.sh tools/botlab/netpage.cjs
// Checks: during HEY! every squidkid with a two-handed weapon has let go with its off hand (> 8 cm off its grip, waving);
// once the emote is over every one has it back on the weapon (≤ 2.5 cm).
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
  // each line-up squidkid: its weapon, dance, whether its hold is two-handed, the HEY! flag and its off hand's grip hole to
  // the weapon's off-hand handle (cm; as tests/holds.js measures it: the handle ± its half-length, a pump riding its stroke)
  const state = `(async () => { const { GRIP_HOLE_L } = await import('./src/game/character-weapons.js'); const THREE = await import('three');
    const HALF = { roller: 0.065, brush: 0.065, blaster: 0.02, brolly: 0.012 };
    return JSON.stringify(Array.from(__inkwave.showcase?.lob?.members?.values?.() || []).filter((M) => M.c && M.c.weapon).map((M) => {
      const c = M.c, w = c.weapon, d = w.def, V = () => new THREE.Vector3(); c.root.updateMatrixWorld(true);
      const gl = d.gripL || { pos: d.handL.pos, handZ: new THREE.Vector3(0, 0, 1), handY: new THREE.Vector3(0, 1, 0) };
      const gy = gl.handY.clone().normalize(), gz = gl.handZ.clone().addScaledVector(gy, -gl.handZ.dot(gy)).normalize();
      const half = HALF[c.weaponKind] ?? 0.01, pz = w.pump ? -0.036 * w.pump : 0;
      const a0 = gl.pos.clone().addScaledVector(gz, -half), a1 = gl.pos.clone().addScaledVector(gz, half); a0.z += pz; a1.z += pz;
      w.off.localToWorld(a0); w.off.localToWorld(a1);
      const hp = GRIP_HOLE_L.clone(); c.bones.handL.localToWorld(hp);
      const cl = new THREE.Line3(a0, a1).closestPointToPoint(hp, true, V());
      return { kind: c.weaponKind, dance: c.dance, both: !!c.hold?.both, wave: !!c.waveHand, offCm: +(hp.distanceTo(cl) / c.kid.getWorldScale(V()).y * 100).toFixed(1) };
    })); })()`;
  const before = JSON.parse(await A.js(state));
  R('the lobby line-up: the two-handed squidkids hold on with both hands', before.length >= 5 && before.filter((s) => s.both).every((s) => s.offCm <= 2.5), before);
  // HEY! from everyone (the mock's room events, as the relay's would be)
  await A.js(`(() => { const n = __G.net; for (const p of n.lobby.players) { if (p.you) n.emote('wave'); else n.mock.emote(p.id, 'wave'); } return 1; })()`);
  await wait(750);
  const during = JSON.parse(await A.js(state));
  say(await A.shot(`${out}/${tag}-hey.jpg`, { w: 1280, q: 80 }));
  const two = during.filter((s) => s.both);
  R('HEY!: every two-handed squidkid lets go with its off hand to wave', two.length >= 5 && two.every((s) => s.wave && s.offCm > 8), during);
  await wait(3200);
  const after = JSON.parse(await A.js(state));
  R('after HEY!: the off hand back on the weapon', after.filter((s) => s.both).every((s) => !s.wave && s.offCm <= 2.5), after);
};
