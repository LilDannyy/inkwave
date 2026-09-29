// Eco-Forest Treehills (stretch scratch): the spawn → mid nav paths (spawn-mid.js's), node by node with the edge types,
// so the route through the nursery can be read.  MAP=treehills PAGE=…/navpath.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav;
  const pads = L.spawnPads, half = pads.length / 2;
  const cen = (list) => list.reduce((a, p) => ({ x: a.x + p.x / list.length, y: a.y + p.y / list.length, z: a.z + p.z / list.length }), { x: 0, y: 0, z: 0 });
  const s0 = cen(pads.slice(0, half)), s1 = cen(pads.slice(half));
  const mid = { x: (s0.x + s1.x) / 2, z: (s0.z + s1.z) / 2 };
  let goal = -1;
  for (const r of [2, 3, 4, 6, 8]) { let by = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; if (Math.hypot(n.x - mid.x, n.z - mid.z) > r) return; if (n.y < by) { by = n.y; goal = i; } }); if (goal >= 0) break; }
  for (const [team, s] of [[0, s0], [1, s1]]) {
    const a = nav.nearest({ x: s.x, y: s.y + 0.5, z: s.z }, 0.8, true);
    const p = nav.path(a, goal, team, 200000);
    const pts = [];
    for (let i = 0; i < p.length; i++) {
      const n = nav.nodes[p[i]];
      let t = '';
      if (i > 0) { const e = nav.nodes[p[i - 1]].nb.find((e) => e.to === p[i]); t = e ? e.type : '?'; }
      pts.push([+n.x.toFixed(1), +n.y.toFixed(2), +n.z.toFixed(1), t]);
    }
    // keep the corners and non-walk edges only
    const keep = pts.filter((q, i) => i === 0 || i === pts.length - 1 || q[3] !== 'walk' || (pts[i + 1] && pts[i + 1][3] !== 'walk') ||
      (i > 0 && i + 1 < pts.length && Math.abs((pts[i + 1][0] - q[0]) * (q[2] - pts[i - 1][2]) - (pts[i + 1][2] - q[2]) * (q[0] - pts[i - 1][0])) > 1e-6));
    R('path t' + team, true, keep);
  }
  return out;
})()
