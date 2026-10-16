// Bluestone eras (scratch probe 2): the render call's time per frame (g.R.render wrapped, the sim stepped as in play) from
// J to J + 3 of jump 1 → 2 and jump 2 → 3, alternated three times each (a shared machine drifts), against the same span of
// frames at rest in era 2; on high, the spawn camera (as the shoot.cjs REPORT). Medians and p90 per run.
(async () => {
  const g = window.__inkwave, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info: JSON.parse(JSON.stringify(info)) });
  const dbg = g.debug, E = g.match.eras, Rn = __G.renderer;
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } }
  if (g.settings.quality !== 'high') { g.settings.quality = 'high'; g.R.applySettings(g.settings); }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const R0 = g.R.render.bind(g.R); let rec = null;
  g.R.render = (...a) => { const t0 = performance.now(); const r = R0(...a); if (rec) rec.push([performance.now() - t0, Rn.info.render.calls]); return r; };
  const stat = (v) => { const s = v.map((x) => x[0]).sort((a, b) => a - b); return { n: s.length, med: +s[s.length >> 1].toFixed(2), p90: +s[Math.floor(s.length * 0.9)].toFixed(2), max: +s[s.length - 1].toFixed(2), calls: Math.max(...v.map((x) => x[1])) }; };
  const run = (kind) => {
    if (kind === 'rest') { E.debugJump(2, { instant: true }); step(0.5); rec = []; step(3); const r = stat(rec); rec = null; return r; }
    const [f, t] = kind === 'j12' ? [1, 2] : [2, 3];
    E.debugJump(f, { instant: true }); step(0.5);
    const J = E.debugJump(t, { inS: 0 }); rec = []; step(3); const r = stat(rec); rec = null; step(J.doneAt - E.S.clock.t + 1.3); return r;
  };
  const rows = [];
  for (let k = 0; k < 3; k++) for (const kind of ['rest', 'j12', 'j23']) rows.push({ k, kind, ...run(kind) });
  g.R.render = R0;
  const by = (kind) => rows.filter((r) => r.kind === kind).map((r) => r.med);
  R('the render call per frame (ms; median of each 3 s run, three runs each, alternated): at rest in era 2, jump 1 → 2, jump 2 → 3', true, { rest: by('rest'), j12: by('j12'), j23: by('j23'), rows });
  return out;
})()
