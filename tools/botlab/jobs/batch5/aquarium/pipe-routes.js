// Gulper Aquarium with the pipe engine built: the pipe routes' times on the real nav graph and the real 'pipe' edges
// (ENGINE.md rules 26 and 27, DESIGN.md §3.1's targets), both teams:
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/pipe-routes.js tools/botlab/run.sh tools/botlab/page.cjs
// • each leg and direction: door to door (suck 0.25 + L/v + pop 0.5) against swimming the shortest walking route between
//   its approach and landing points at 11.8 m/s (pipes shut): rule 26 asks 0.35–1.0; DESIGN.md's targets Gulper 0.74,
//   Arch 0.78 / 0.87, Express 0.73, Kelp 0.92 (UP) / 0.88 (DOWN) (≤ 0.80 for the Gulper, the Arch Line promenade-ward and
//   the Express, §6.2)
// • spawn → mid on foot (pipes shut) and with pipes (a Dijkstra in seconds: walking edges at 11.8 m/s, pipe edges at
//   their door-to-door time): rule 27 asks ≥ 4.5 s with pipes and no more than 25 % off the time on foot
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav, P = __G.match.pipes, X = __G.pipes.X, SW = 11.8;
  const door = (lg) => 0.25 + lg.len / lg.speed + 0.5;
  // Dijkstra in seconds over the nav graph; pipes on / off
  const fastest = (a, b, team, pipes) => {
    const N = nav.nodes.length, d = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    d[a] = 0; const heap = [[0, a]];
    const push = (x) => { heap.push(x); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [t, u] = pop();
      if (done[u]) continue; done[u] = 1;
      if (u === b) break;
      const n = nav.nodes[u];
      for (const e of n.nb) {
        const m = nav.nodes[e.to];
        if (m.zone >= 0 && m.zone !== team) continue;
        let w;
        if (e.type === 'pipe') { if (!pipes || P.keyShut[e.key]) continue; w = door(X.legs[e.leg]); }
        else w = Math.hypot(m.x - n.x, m.y - n.y, m.z - n.z) / SW + (e.type === 'climb' ? 0.6 : 0);
        if (t + w < d[e.to]) { d[e.to] = t + w; from[e.to] = u; push([t + w, e.to]); }
      }
    }
    const path = []; for (let k = b; k >= 0 && path.length < 5000; k = from[k]) path.push(k);
    path.reverse();
    const legs = []; for (let i = 1; i < path.length; i++) { const e = nav.edge(path[i - 1], path[i]); if (e && e.type === 'pipe') legs.push(X.legs[e.leg].id); }
    return { s: d[b], legs };
  };
  const node = (p) => nav.nearest({ x: p[0], y: p[1] + 0.3, z: p[2] }, 1.0);
  const TGT = { gulper: [0.74, 0.74], arch: [0.78, 0.87], express: [0.73], kelp: [0.92, 0.88] };
  const ratios = [];
  for (const lg of X.legs) {
    for (const k of [0, 1]) {
      const from = lg.ends[k], to = lg.ends[1 - k];
      if (from.inWhen === 'never') continue;
      const a = node(from.approach), b = node(to.land);
      const walk = fastest(a, b, 0, false).s, dd = door(lg), r = dd / walk;
      const base = lg.id.replace('~', ''), want = TGT[base][k] ?? TGT[base][0];
      ratios.push([lg.id, k ? 'B→A' : 'A→B', +dd.toFixed(2), +walk.toFixed(2), +r.toFixed(2), want]);
    }
  }
  R('rule 26: every leg and direction rides door to door in 0.35–1.0 of the swim on its walking route', ratios.every((x) => x[4] >= 0.35 && x[4] <= 1.0), { 'leg, dir, door s, walk s, ratio, DESIGN': ratios });
  const strict = ratios.filter((x) => ['gulper', 'express'].includes(x[0].replace('~', '')) || (x[0].startsWith('arch') && x[1] === 'A→B'));
  R('DESIGN.md §6.2: the Gulper, the Arch Line promenade-ward and the Express save at least a fifth (≤ 0.80)', strict.every((x) => x[4] <= 0.8), { strict });
  // spawn → mid (the mid node as spawn-mid.js picks it: the lowest valid node within 2 m of the centre)
  let goal = -1, by = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i] || Math.hypot(n.x, n.z) > 2) return; if (n.y < by) { by = n.y; goal = i; } });
  const res = {};
  for (const t of [0, 1]) {
    const pad = __G.level.spawnPads[t], a = nav.nearest({ x: pad.x, y: pad.y + 0.5, z: pad.z }, 0.8, true);
    const foot = fastest(a, goal, t, false), pipe = fastest(a, goal, t, true);
    res['t' + t] = { foot: +foot.s.toFixed(2), withPipes: +pipe.s.toFixed(2), legs: pipe.legs, cut: +(1 - pipe.s / foot.s).toFixed(3) };
  }
  R('rule 27: spawn → mid with pipes is ≥ 4.5 s and no more than 25 % faster than on foot (both teams)', ['t0', 't1'].every((k) => res[k].withPipes >= 4.5 && res[k].cut <= 0.25), res);
  // the fastest door-to-door way between each team's two flanks through its own Arch Line, against walking round the hall
  return out;
})()
