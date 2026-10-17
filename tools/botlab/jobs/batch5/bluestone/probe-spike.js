// Scratch probe (final review 2, issue 4): the render spikes that recur at the same moments of eras-jump 'frames' — the
// Bravo viewer's 2 → 3 at J + 0.32–0.35 and the kept world's 3 → 1 at sunset at J + 1.37–1.5 — replayed exactly as
// 'frames' sets them up, each frame split into the renderer's own passes (renderer.render calls: target, ms, draw calls,
// triangles), with what flipped in the frame, the curtain's radius and the camera; the three costliest frames of each
// jump are printed in full. PROBE_ARGS-free:
//   MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/probe-spike.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const dbg = g.debug;
  dbg.freeze();
  const calm = () => { for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } } };
  calm();
  const W = __G.eraWorld, E = g.match.eras, Rn = __G.renderer, gl = Rn.getContext();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (let i = 0; i < 80 && !(W.stats.precompiled >= 1); i++) await new Promise((r) => setTimeout(r, 100));
  const ARGS = String(window.__pageArgs || ''), finish = /finish/.test(ARGS);
  // (nosay: the era's callouts not shown — E._say a no-op; nohud: the HUD's DOM hidden, the era band and chip with it)
  if (/nosay/.test(ARGS)) E._say = () => {};
  if (/nohud/.test(ARGS)) document.querySelectorAll('.iw-hud').forEach((e) => { e.style.display = 'none'; });
  // (nomap: the minimap's era work off — no base swap at done, no outlines or ping drawn)
  if (/nomap/.test(ARGS)) { W._mapEra = () => {}; E.drawMap = () => {}; }
  // the renderer's own passes
  const r0 = Rn.render.bind(Rn);
  let passes = null;
  Rn.render = (scene, camera) => {
    const t0 = performance.now(), c0 = Rn.info.render.calls, tr0 = Rn.info.render.triangles;
    try { return r0(scene, camera); } finally {
      if (finish) gl.finish();
      if (passes) { const rt = Rn.getRenderTarget(); passes.push([(rt && (rt.texture?.name || `${rt.width}x${rt.height}`)) || 'screen', scene?.overrideMaterial ? 'override' : (scene?.name || scene?.type || '?'), +(performance.now() - t0).toFixed(1), Rn.info.render.calls - c0, Rn.info.render.triangles - tr0]); }
    }
  };
  // (each draw call timed: the costliest five of each frame kept — object, material, program, ms)
  const rbd0 = Rn.renderBufferDirect.bind(Rn);
  let calls = null;
  Rn.renderBufferDirect = (camera, scene, geometry, material, object, group) => {
    if (!calls) return rbd0(camera, scene, geometry, material, object, group);
    const t0 = performance.now();
    try { return rbd0(camera, scene, geometry, material, object, group); } finally {
      const ms = performance.now() - t0;
      if (ms > 0.5) calls.push([+ms.toFixed(1), object?.name || object?.type || '?', material?.name || material?.type || '?', (material && Rn.properties?.get?.(material)?.currentProgram?.name) || null, scene?.overrideMaterial ? 'override' : '']);
    }
  };
  const mm = g.minimap, th0 = g.theme, rows = [];
  const Rr = g.R, rend0 = Rr.render.bind(Rr);
  let fren = 0;
  Rr.render = (...a) => { const t0 = performance.now(); try { return rend0(...a); } finally { fren += performance.now() - t0; } };
  const run = async (label, prep) => {
    prep();
    // (settle: 1 s of sim and 1.5 s of wall time between the set-up — the minimap bases it rebuilds — and the jump)
    if (/settle/.test(ARGS)) { step(1); await new Promise((r) => setTimeout(r, 1500)); }
    const to = E.era === 3 ? 1 : E.era + 1, J = E.debugJump(to, { inS: 0 }), fr = [];
    while (E.S.clock.t < J.doneAt + 1.0) {
      passes = []; fren = 0; calls = [];
      const hp = () => performance.memory?.usedJSHeapSize || 0, h0 = hp();
      const n0 = E.stats.flips, t0 = performance.now(); dbg.step(1000 / 60); const ms = performance.now() - t0, heap = +((hp() - h0) / 1e6).toFixed(1);
      const k = E.stats.flips - n0, flips = k > 0 ? E.stats.flipLog.slice(-k).map((f) => `${f.key}:${f.on}+${f.off}-`) : [];
      const cam = G_cam();
      fr.push({ ms: +ms.toFixed(1), t: +(E.S.clock.t - J.at).toFixed(2), render: +fren.toFixed(1), heapMB: heap, heapNowMB: +(hp() / 1e6).toFixed(0), passes, flips, draws: calls.sort((a, b) => b[0] - a[0]).slice(0, 5), curtain: W.fx?.curtain?.visible ? +W.fx.curtain.scale.x.toFixed(1) : null, cam, holo: W.fx?.holo ? W.fx.holo.filter((m) => m.visible).length : 0 });
    }
    passes = null; calls = null;
    const worst = [...fr].sort((a, b) => b.render - a.render).slice(0, 3);
    const med = [...fr].map((x) => x.render).sort((a, b) => a - b)[fr.length >> 1];
    const dW = fr.filter((x) => x.t > J.doneAt - J.at + 0.2 && x.t < J.doneAt - J.at + 0.6), jW = fr.filter((x) => x.t > 0.2 && x.t < 0.5);
    const mx = (a) => (a.length ? Math.max(...a.map((x) => x.render)) : null);
    rows.push({ label, jump: `${J.from}>${J.to}`, frames: fr.length, renderMedian: +med.toFixed(1), windows: { 'J+0.2..0.5': mx(jW), 'done+0.2..0.6': mx(dW) }, worst, typical: fr.find((x) => Math.abs(x.render - med) < 1) || fr[fr.length >> 1] });
  };
  const G_cam = () => { const c = __G.camera?.position; return c ? [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)] : null; };
  E.debugJump(2, { instant: true }); step(0.5);   // ('frames' reaches these from jump 1: the world in era 2)
  await run('bravo', () => { mm.setViewerTeam(1); });
  await run('theme', () => { mm.setViewerTeam(0); step(0.1); g.theme = th0 === 'sunset' ? 'golden' : 'sunset'; __G.env.setTheme?.(g.theme); step(4 / 60); });
  g.theme = th0; __G.env.setTheme?.(th0); step(0.1);
  Rn.render = r0; Rr.render = rend0; Rn.renderBufferDirect = rbd0;
  for (const r of rows) R(`${r.label} ${r.jump}${finish ? ' (gl.finish after each pass)' : ''}${ARGS ? ` [${ARGS}]` : ''}: the three costliest frames by render, each split into its passes [target, scene, ms, draw calls, triangles]`, true, r);
  return out;
})();
