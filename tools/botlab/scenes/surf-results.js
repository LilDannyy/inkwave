// The results screen with assists (src/game/assists.js → main.js _judge → menus.js), for tools/botlab/hud-shots.cjs:
//   MAP=halyard MODE=turf PLAY=6 SCENES=tools/botlab/scenes/surf-results.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
// A played-out Turf War's numbers (each player's splats and assists set), then the real judge → results flow; the
// capture comes once the rows have counted up (the splats with their assists in small type: "5 +3") and the XP bar
// has its ASSISTS line.
(async () => {
  const g = window.__inkwave, m = g.match, G = __G;
  for (const a of m.actors) if (a.bot) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = false; };
  const SPL = [5, 2, 3, 1, 4, 2, 0, 3], AS = [3, 1, 0, 2, 1, 0, 2, 4], DE = [2, 4, 3, 5, 3, 4, 6, 2];
  window.__hudScenes = [{
    name: 'results', wait: 900,
    set: async () => {
      m.actors.forEach((a, i) => { a.stats.splats = SPL[i % 8]; a.stats.assists = AS[i % 8]; a.stats.deaths = DE[i % 8]; });
      m.time = 0; m.result = { coverage: G.paint.coverage(), winner: m.local.team };
      m.setState('judge');   // (main.js runs the judge → results on it)
      // (the judge's reveal, the podium intro, the rows counting up, the medals, the XP bar)
      for (let k = 0; k < 120 && !(g.menus && g.menus.current === 'results'); k++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 9000));
      const rows = [...document.querySelectorAll('.iw-results .iw-prow')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
      const bd = [...document.querySelectorAll('.iw-xp__bd .iw-xpb')].map((e) => e.textContent);
      return { rows, xp: bd, me: { splats: m.local.stats.splats, assists: m.local.stats.assists } };
    },
  }];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
