// Gulper Aquarium: what a pipe ride costs a frame (the pipe engine's per-frame work, the glass's draw calls), stepped:
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/perf-ride.js tools/botlab/run.sh tools/botlab/page.cjs
// Three stretches of 240 stepped frames each (bots frozen, the camera following the local player): nobody riding; the
// local player riding the Express end to end over and over (the ride camera, the underwater grade off); four squidkids
// riding at once (the Gulper Run and both Arch Lines). Reported: the median and p90 frame (sim + render, ms), the pipe
// module's own share (StagePipes.update + lateUpdate + the ride: ownsBody), draw calls and triangles.
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const dbg = g.debug; dbg.freeze();
  const M = g.match, P = M.pipes;
  for (const a of M.actors) if (a.bot) a.bot.update = () => {};
  let modMs = 0;
  const wrap = (o, k) => { const f = o[k].bind(o); o[k] = (...x) => { const t = performance.now(); const r = f(...x); modMs += performance.now() - t; return r; }; };
  wrap(P, 'update'); wrap(P, 'lateUpdate'); wrap(P, 'ownsBody'); wrap(P, 'cam'); wrap(P, 'camAfter');
  const legs = (id) => P.legs.find((l) => l.id === id);
  const keepRiding = (list) => { for (const [a, id, k] of list) if (!a.pipe) { a.pipeCd = 0; const e = legs(id).ends[k]; a.pos.set(e.approach[0], e.approach[1], e.approach[2]); P.debugRide(a, id, k); } };
  const run = (list) => {
    const ft = [], calls = [], tris = []; modMs = 0;
    for (let i = 0; i < 240; i++) {
      keepRiding(list);
      const t = performance.now(); dbg.step(1000 / 60); ft.push(performance.now() - t);
      calls.push(__G.renderer.info.render.calls); tris.push(__G.renderer.info.render.triangles);
    }
    ft.sort((x, y) => x - y);
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    return { frameMed: +ft[120].toFixed(2), frameP90: +ft[216].toFixed(2), pipesMsPerFrame: +(modMs / 240).toFixed(3), calls: med(calls), tris: med(tris) };
  };
  const me = M.local || M.actors[0], others = M.actors.filter((a) => a !== me);
  for (let i = 0; i < 60; i++) dbg.step(1000 / 60);
  const idle = run([]);
  const one = run([[me, me.team === 0 ? 'express' : 'express~', 0]]);
  for (const a of M.actors) if (a.pipe) P._abort(a, 'perf');
  const four = run([[others[0], 'gulper', 0], [others[1], 'gulper', 1], [others[2], 'arch', 0], [others[3], 'arch~', 1]]);
  R('frame cost: nobody riding', true, idle);
  R('frame cost: the local player riding the Express (the ride camera)', true, one);
  R('frame cost: four squidkids riding at once (Gulper both ways, both Arch Lines)', true, four);
  R('the pipe module costs ≤ 0.1 ms a frame with four riders (ENGINE.md §4.8)', four.pipesMsPerFrame <= 0.1 && one.pipesMsPerFrame <= 0.1, { one: one.pipesMsPerFrame, four: four.pipesMsPerFrame });
  return out;
})()
