// Bluestone eras (scratch probe): where a jump's render time goes (shoot.cjs REPORT showed jump 2 → 3 at ~12 ms cpuRender
// against ~5 ms for jump 1 → 2). On high, the spawn camera; per moment (era 2 at rest, J + 1.3 of each jump) the median
// of 40 renders of the frozen frame, with all on, then with one thing off at a time.
//   MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/probe-render.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info: JSON.parse(JSON.stringify(info)) });
  const dbg = g.debug, E = g.match.eras, W = __G.eraWorld, Rn = __G.renderer, sm = Rn.shadowMap;
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } }
  if (g.settings.quality !== 'high') { g.settings.quality = 'high'; g.R.applySettings(g.settings); }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const time = (n = 40) => { const v = []; for (let i = 0; i < n; i++) { sm.needsUpdate = true; const t0 = performance.now(); g.R.render(); v.push(performance.now() - t0); } v.sort((a, b) => a - b); return +v[n >> 1].toFixed(2); };
  const fx = W.fx;
  const variants = {
    all: () => () => {},
    noHolo: () => { const h = fx.holo || []; const was = h.map((m) => m.visible); h.forEach((m) => { m.visible = false; m.onBeforeRender = m.onBeforeRender; }); const o = fx.update.bind(fx); fx.update = (dt, st) => { o(dt, st); for (const m of fx.holo || []) m.visible = false; }; return () => { fx.update = o; h.forEach((m, i) => { m.visible = was[i]; }); }; },
    noCurtain: () => { const c = fx.curtain, v = c?.visible; if (c) c.visible = false; return () => { if (c) c.visible = v; }; },
    noEraShadows: () => { const ms = [...W.meshes, ...W.propMeshes], v = ms.map((m) => m.castShadow); ms.forEach((m) => { m.castShadow = false; }); return () => ms.forEach((m, i) => { m.castShadow = v[i]; }); },
    noEraMeshes: () => { const ms = [...W.meshes, ...W.propMeshes], v = ms.map((m) => m.visible); ms.forEach((m) => { m.visible = false; }); return () => ms.forEach((m, i) => { m.visible = v[i]; }); },
    noSets: () => { const S = Object.values(__G.env?.stageSets || {}), v = S.map((s) => s.visible); S.forEach((s) => { s.visible = false; }); return () => S.forEach((s, i) => { s.visible = v[i]; }); },
    noFxGroup: () => { const v = fx.group.visible; fx.group.visible = false; return () => { fx.group.visible = v; }; },
  };
  const measure = (label) => { const row = { label, calls: 0, tris: 0 }; g.R.render(); row.calls = Rn.info.render.calls; row.tris = Rn.info.render.triangles; for (const [k, f] of Object.entries(variants)) { const undo = f(); row[k] = time(); undo(); } return row; };
  const rows = [];
  E.debugJump(2, { instant: true }); step(0.5);
  rows.push(measure('era 2 at rest'));
  E.debugJump(1, { instant: true }); step(0.3);
  let J = E.debugJump(2, { inS: 0 }); step(1.3);
  rows.push(measure('jump 1 → 2, J + 1.3'));
  step(J.doneAt - E.S.clock.t + 1.2);
  E.debugJump(2, { instant: true }); step(0.3);
  J = E.debugJump(3, { inS: 0 }); step(1.3);
  rows.push(measure('jump 2 → 3, J + 1.3'));
  // the jump's own per-frame work (the sim step with the module's update) for the same moments
  R('render time per moment (median of 40 renders, ms) with each piece off in turn', true, rows);
  return out;
})()
