// The results podium with your team holding the four two-handed weapons (brush / roller / blaster / brolly), for
// tools/botlab/hud-shots.cjs (the victory dances; PRE_ARGS=lose: the defeat ones):
//   MAP=halyard MODE=turf PLAY=3 SCENES=tools/botlab/jobs/batch5/holds/podium-scene.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
// The real judge → results flow, captured three times as the podium plays.
(async () => {
  const g = window.__inkwave, m = g.match, G = __G;
  const lose = /lose/.test(window.__preArgs || '');
  for (const a of m.actors) if (a.bot) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = false; };
  const FOUR = ['brush', 'roller', 'blaster', 'brolly'];
  const mine = m.actors.filter((a) => a.team === m.local.team);
  mine.forEach((a, i) => { a.setWeapon(FOUR[i % 4]); a.stats.splats = 4 - i; a.stats.turf = 900 - 100 * i; });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const kinds = () => (g.showcase?.chars || []).map((c) => [c.weaponKind, c.dance, c.danceVar, !!c.hold?.both]);
  window.__hudScenes = [
    { name: lose ? 'podium-lose-a' : 'podium-a', wait: 400, set: async () => {
      m.time = 0; m.result = { coverage: G.paint.coverage(), winner: lose ? 1 - m.local.team : m.local.team };
      m.setState('judge');
      for (let k = 0; k < 150 && !(g.menus && g.menus.current === 'results'); k++) await sleep(100);
      await sleep(3500);
      return { weapons: mine.map((a) => a.weaponId), kids: kinds() };
    } },
    { name: lose ? 'podium-lose-b' : 'podium-b', wait: 400, set: async () => { await sleep(2500); return { kids: kinds() }; } },
    { name: lose ? 'podium-lose-c' : 'podium-c', wait: 400, set: async () => { await sleep(2500); return { kids: kinds() }; } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
