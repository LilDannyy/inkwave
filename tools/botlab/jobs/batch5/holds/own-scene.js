// your own squidkid with each two-handed weapon, from the match camera (behind the shoulder): idle and firing
//   MAP=halyard MODE=turf PLAY=2 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/holds/own-scene.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, me = m.local;
  for (const a of m.actors) if (a.bot && a !== me) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const drive = { fire: false };
  if (me.bot) me.bot.update = () => { const it = me.intent; it.move.set(0, 0, 0); it.fire = drive.fire; it.jump = it.squid = it.sub = it.special = false; };
  const sc = [];
  for (const w of ['roller', 'brush', 'blaster', 'brolly']) for (const st of ['idle', 'fire']) sc.push({ name: `own-${w}-${st}`, wait: 300, set: async () => {
    me.setWeapon(w); me.hp = 1e6; drive.fire = st === 'fire'; await sleep(st === 'fire' ? 700 : 1500); return { w, kind: me.character.weaponKind };
  } });
  window.__hudScenes = sc;
  return sc.map((s) => ({ name: s.name }));
})();
