// Spirhalite Islands — where do bots fall into the sea? (scratch). Steps the running match 240 s of sim time and logs every
// water splat: the victim's last grounded spot (the edge it left), its mode, and the cell it went in at. Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=spirhalite MODE=zones PAGE=tools/botlab/jobs/new-stages/out/spirhalite/water-log.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, G = window.__G, m = g.match;
  const { on } = await import('./src/core/ctx.js');
  const last = new Map(), deaths = [];
  on('splatted', (e) => {
    if (e.cause !== 'water') return;
    const a = e.victim, l = last.get(a) || {};
    deaths.push({ t: +l.t?.toFixed(1), leftAt: l.p, y: l.y, mode: a.bot ? a.bot.mode : 'player', w: a.weapon && a.weapon.kind, inAt: [+a.pos.x.toFixed(1), +a.pos.z.toFixed(1)] });
  });
  g.debug.freeze();
  let t = 0;
  while (t < 240 && m.state === 'playing') {
    for (let k = 0; k < 6; k++) g.debug.step(1000 / 60);
    t += 0.1;
    for (const a of G.actors) if (a.alive && a.grounded) last.set(a, { t, p: [+a.pos.x.toFixed(1), +a.pos.z.toFixed(1)], y: +a.pos.y.toFixed(2) });
  }
  return [{ name: `water splats in ${t.toFixed(0)} s: ${deaths.length}`, ok: true, info: deaths }];
})()
