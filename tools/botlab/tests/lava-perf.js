// The lava's frame cost on Highmark Foundry: the same 4 s of a bot match stepped (sim + one render per step) at rest
// (LOW and HIGH) and during a rise and a fall, the worst single frame of the rise (the frame the ledges' ink burns),
// the lava's own update, and renderer.info (calls, triangles) at rest.
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-perf.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const L = g.match?.lava, dbg = g.debug;
  if (!L) { R('the lava runs', false); return out; }
  dbg.freeze();
  // the lava's own update, timed (wrapping it for this test only)
  const upd = L.update.bind(L), lt = { n: 0, ms: 0, max: 0 };
  L.update = (dt, t) => { const a = performance.now(); upd(dt, t); const d = performance.now() - a; lt.n++; lt.ms += d; lt.max = Math.max(lt.max, d); };
  const run = (t0, secs) => {
    L.debugT(t0); for (let i = 0; i < 20; i++) dbg.step(1000 / 60);
    lt.n = 0; lt.ms = 0; lt.max = 0;
    const fr = []; const n = Math.round(secs * 60);
    for (let i = 0; i < n; i++) { const a = performance.now(); dbg.step(1000 / 60); fr.push(performance.now() - a); }
    fr.sort((x, y) => x - y);
    const info = __G.renderer.info.render;
    return { med: +fr[fr.length >> 1].toFixed(2), p90: +fr[Math.floor(fr.length * 0.9)].toFixed(2), max: +fr[fr.length - 1].toFixed(2), lavaMs: +(lt.ms / Math.max(1, lt.n)).toFixed(3), lavaMax: +lt.max.toFixed(2), calls: info.calls, tris: info.triangles, perf: g.perf ? { render: +g.perf.render.toFixed(2), sim: +g.perf.sim.toFixed(2) } : null };
  };
  const res = {};
  for (let k = 0; k < 2; k++) {   // (twice, alternated: the machine is shared)
    res['low' + k] = run(12, 4); res['rise' + k] = run(36.5, 4); res['high' + k] = run(48, 4); res['fall' + k] = run(71, 4);
  }
  R('frame cost (ms per stepped frame: sim + a render) at rest and while the lava moves; the lava\'s own update', true, res);
  // the frame the whole ledge floor's ink burns (every ledge inked first)
  L.debugT(20); for (let i = 0; i < 5; i++) dbg.step(1000 / 60);
  const W = __G.lavaWorld, P = __G.paint, V = __G.local.pos.constructor;
  for (const d of W.drown) { const b = d.b; for (let x = b.aabbMin.x + 0.6; x < b.aabbMax.x; x += 1.4) for (let z = b.aabbMin.z + 0.6; z < b.aabbMax.z; z += 1.4) P.splat(new V(x, d.top + 0.05, z), 1.0, (Math.round(x + z) & 1), { instant: true }); }
  const inked = (() => { let n = 0; for (let i = 0; i < W.cells.ids.length; i++) if (P.grid[W.cells.ids[i]]) n++; return n; })();
  L.debugT(38.6); for (let i = 0; i < 3; i++) dbg.step(1000 / 60);
  lt.n = 0; lt.ms = 0; lt.max = 0;
  const fr = []; for (let i = 0; i < 120; i++) { const a = performance.now(); dbg.step(1000 / 60); fr.push(performance.now() - a); }
  R('the burn: every ledge inked, then the rise over them — the worst frame and the lava update\'s worst', true, { inked, burned: L.stats.burned, worstFrame: +Math.max(...fr).toFixed(2), medFrame: +fr.sort((x, y) => x - y)[60].toFixed(2), lavaMax: +lt.max.toFixed(2) });
  R('load: the two-pose nav build (ms), rider parts, lava faces, the surface\'s triangles', true, { navMs: W.navMeta.ms, parts: W.nParts, lavaFaces: W.lavaFaces, surfTris: W.look?.tris, cells: W.cells.ids.length, retired: W.retired });
  L.update = upd;
  return out;
})();
