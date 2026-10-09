// Stage modules: what the registry's hook-ins cost on a stage WITHOUT any module (the twelve existing stages). Plain
// measurements, the same on any commit (it uses nothing new), so a job runs it on this branch and on the base commit and
// compares (tools/botlab/jobs/batch5/stages/JOB-*.sh):
//   MAP=halyard PAGE=tools/botlab/tests/stage-mods-perf.js tools/botlab/run.sh tools/botlab/page.cjs
// Each micro-benchmark runs on seeded inputs, 5 times; the minimum is reported (ms). The match loop is 600 frames of the
// real simulation with every bot playing (rendering skipped), its median frame. Prints PERF lines; the checks only
// require that it ran.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const THREE = await import('three');
  const { rng } = await import('./src/core/ctx.js');
  const { Hit } = await import('./src/game/physics.js');
  const L = __G.level, P = __G.physics, nav = __G.nav, paint = __G.paint;
  dbg.freeze();
  const best = (fn, n = 5) => { let b = Infinity; for (let i = 0; i < n; i++) { const t0 = performance.now(); fn(); b = Math.min(b, performance.now() - t0); } return +b.toFixed(3); };
  const B = L.bounds, r = rng(1234);
  const pts = Array.from({ length: 20000 }, () => new THREE.Vector3(B.minX + r() * (B.maxX - B.minX), r() * 6 - 1, B.minZ + r() * (B.maxZ - B.minZ)));
  const dirs = Array.from({ length: 20000 }, () => new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.4, r() - 0.5).normalize());
  const hit = new Hit();
  const res = {};
  res.raycast20k = best(() => { for (let i = 0; i < 20000; i++) P.raycast(pts[i], dirs[i], 8, hit, false); });
  res.pointInside20k = best(() => { for (let i = 0; i < 20000; i++) L.pointInside(pts[i], 0); });
  res.groundHeight20k = best(() => { for (let i = 0; i < 20000; i++) L.groundHeight(pts[i].x, pts[i].z, 6); });
  const ids = nav.validIds, pairs = Array.from({ length: 300 }, () => [ids[(r() * ids.length) | 0], ids[(r() * ids.length) | 0]]);
  res.navPath300 = best(() => { for (const [a, b] of pairs) nav.path(a, b, 0); }, 3);
  res.navNearest5k = best(() => { for (let i = 0; i < 5000; i++) nav.nearest(pts[i], 1.2); });
  const sp = pts.slice(0, 1500).map((p) => { const gh = L.groundHeight(p.x, p.z, 6); return new THREE.Vector3(p.x, gh > -Infinity ? gh + 0.2 : 0.2, p.z); });
  res.splat1500 = best(() => { for (let i = 0; i < sp.length; i++) paint.splat(sp[i], 0.6 + (i % 5) * 0.2, i & 1, { seed: (i * 0.618) % 1, instant: true }); paint.flush(1 / 60); }, 3);
  res.regionStats5k = best(() => { const o = { own: 0, enemy: 0, empty: 0, n: 0 }; for (let i = 0; i < 5000; i++) paint.regionStats(sp[i % sp.length].x, sp[i % sp.length].y, sp[i % sp.length].z, 3, 0, o); });
  res.minimap200 = best(() => { for (let i = 0; i < 200; i++) g.minimap.update(1 / 60); }, 3);
  // the real loop: 600 frames with the bots playing, no rendering; the median frame's simulation time
  const fr = [];
  g._skipRender = true;
  for (let i = 0; i < 600; i++) { const t0 = performance.now(); g._frame(1 / 60); fr.push(performance.now() - t0); }
  g._skipRender = false;
  fr.sort((a, b) => a - b);
  res.frameMedian = +fr[300].toFixed(3); res.frameP90 = +fr[540].toFixed(3);
  res.hasStageWorld = !!__G.stageWorld; res.hasStageRun = !!m.stage;
  console.log('PERF ' + JSON.stringify(res));
  R('measured (no stage module on this stage)', !res.hasStageWorld && !res.hasStageRun, res);
  return out;
})();
