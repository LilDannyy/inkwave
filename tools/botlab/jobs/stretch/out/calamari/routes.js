// Calamari County — Bazookarp notes: nav route lengths on Alpha's half from mid (the side platform's edge over
// Alpha's track, just off the island) to the goal spot at the grand stair's foot, forced through waypoints (each leg
// the nav's own path). Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=calamari PAGE=tools/botlab/jobs/stretch/out/calamari/routes.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav;
  const near = ([x, y, z]) => { let g = -1, bd = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; const d = Math.hypot(n.x - x, (n.y - y) * 2, n.z - z); if (d < bd) { bd = d; g = i; } }); return g; };
  const plen = (p) => { let len = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return len; };
  const start = [0, 1, -7], goal = [0, 0, -48];
  const routes = {
    'centre: the square, the terrace steps, over the fire-watch terrace, down its SW steps': [[1, 0, -24], [-2.5, 1.3, -35], [-2, 1.3, -42.5], [-7, 0, -44]],
    'High Street: the square, down the High Street past the inn': [[-4, 0, -24], [-8, 0, -31.5], [-9.5, 0, -44]],
    'west: the hillside road through the chicane to the forecourt': [[-22, 0, -12], [-22, 0, -30], [-22, 0, -42]],
    'west high: T1, the allotment steps, the upper allotments, T2, the T2 stair': [[-28, 1.3, -20], [-28.5, 1.3, -33], [-28, 2.6, -45], [-15, 2.6, -54], [-11.5, 0, -49.5]],
    'east: the store corner, the basin quay, over the fish market, the post yard': [[13, 0, -24], [18, -0.1, -36], [22, 0.5, -45], [15, 0, -50]],
    'fire lane: the square, the fire lane beside the terrace': [[7, 0, -26], [7.2, 0, -40]],
  };
  const res = {};
  for (const [name, via] of Object.entries(routes)) {
    const pts = [start, ...via, goal].map(near);
    let len = 0, ok = true;
    for (let i = 1; i < pts.length; i++) { const p = nav.path(pts[i - 1], pts[i], 0, 200000); if (!p) { ok = false; break; } len += plen(p); }
    res[name] = ok ? { m: +len.toFixed(1), s: +(len / 11.8).toFixed(2) } : 'no path';
  }
  const direct = nav.path(near(start), near(goal), 0, 200000);
  res.shortest = direct ? { m: +plen(direct).toFixed(1) } : null;
  R('mid → goal routes (Alpha half)', true, res);
  return out;
})()
