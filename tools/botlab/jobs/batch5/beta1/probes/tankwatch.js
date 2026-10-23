// a live match on Gulper Aquarium: who ends up on the Great Tank's sand bed (inside the glass, y −0.6), and how
(async () => {
  const g = window.__inkwave, G = window.__G, m = g.match, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const r2 = (v) => Math.round(v * 100) / 100;
  const secs = +((/secs=(\d+)/.exec(String(window.__pageArgs || '')) || [])[1] || 240);
  g.debug.freeze();
  const trail = new Map(), inT = new Map(), ev = [];
  let frames = 0, tankFrames = 0;
  for (let f = 0; f < secs * 60 && m.state !== 'finish'; f++) {
    g.debug.step(1000 / 60); frames++;
    for (const a of m.actors) {
      let tr = trail.get(a); if (!tr) trail.set(a, tr = []);
      if (f % 6 === 0) { const p = a.pipe, S = a.superJumpState, tg = S && S.target, tgn = tg && tg.name ? tg.name + (tg.pipe ? '(pipe:' + tg.pipe.phase + ')' : '') + (tg.superJumpState ? '(SJ)' : '') + '@' + r2(tg.pos.x) + ',' + r2(tg.pos.y) + ',' + r2(tg.pos.z) : tg ? 'pt' : ''; tr.push(`${r2(G.time)} ${r2(a.pos.x)},${r2(a.pos.y)},${r2(a.pos.z)} ${a.form[0]}${a.grounded ? 'g' : ''}${p ? ' P' + p.phase[0] : ''}${S ? ' SJ' + S.phase[0] + (S.to ? '>' + r2(S.to.x) + ',' + r2(S.to.y) + ',' + r2(S.to.z) : '') + ' ' + tgn : ''}${a.bot ? ' ' + a.bot.mode : ''}${a.carry ? ' C' : ''}`); if (tr.length > 30) tr.shift(); }
      const inside = a.alive && Math.hypot(a.pos.x, a.pos.z) < 7.0 && a.pos.y < -0.2 && !a.pipe;
      if (inside) tankFrames++;
      const was = inT.get(a);
      if (inside && !was) { inT.set(a, { t: G.time }); ev.push({ t: r2(G.time), who: a.name, bot: !!a.bot, local: a === m.local, trail: tr.slice(-12) }); }
      else if (!inside && was) { const e = ev.filter((q) => q.who === a.name).pop(); if (e && e.dur === undefined) e.dur = r2(G.time - was.t); e.left = `${r2(a.pos.x)},${r2(a.pos.y)},${r2(a.pos.z)} ${a.alive ? 'alive' : 'dead'}`; inT.delete(a); }
    }
  }
  R(`tank: ${ev.length} entries, ${r2(tankFrames / 60)} actor-seconds on the sand bed in ${r2(G.time)} s`, ev.length === 0, ev.map((e) => ({ ...e, trail: e.trail.slice(-12) })));
  g.debug.unfreeze();
  return out;
})()
