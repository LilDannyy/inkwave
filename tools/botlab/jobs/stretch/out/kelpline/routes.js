// Kelpline / Cargo (Long Stages) — Bazookarp notes: nav route lengths from mid to the goal spot in front of Alpha's
// spawn through the slice, via forced waypoints (Bravo attacking), and the checkpoint / goal spots in world metres.
//   MAP=kelpline PAGE=tools/botlab/jobs/stretch/out/kelpline/routes.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav, RA = 35 * Math.PI / 180, RC = Math.cos(RA), RS = Math.sin(RA);
  const W = (x, y, z) => ({ x: x * RC + z * RS, y, z: -x * RS + z * RC });
  const near = (p) => nav.nearest({ x: p.x, y: p.y + 0.5, z: p.z }, 1.2, true);
  const len = (ids) => { let L = 0; for (let i = 1; i < ids.length; i++) { const u = nav.nodes[ids[i - 1]], v = nav.nodes[ids[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  const route = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) { const a = near(pts[i - 1]), b = near(pts[i]); if (a < 0 || b < 0) return null; const p = nav.path(a, b, 1, 200000); if (!p) return null; L += len(p); } return +L.toFixed(1); };
  const mid = W(0, 0, -7.5), cp = W(0, 2.4, -42.4), goal = W(6.4, 0, -58.0);
  const r = {
    lane: route([mid, W(5.2, 0, -30), W(5.2, 0, -44), goal]),
    overTP: route([mid, W(0, 0, -30), cp, W(0, 0, -52.5), goal]),
    shipApron4B: route([mid, W(20, 0, -24), W(20, 0, -36), W(12.3, 2.6, -46), goal]),
    reeferSide: route([mid, W(-9.44, 2.6, -16), W(-12, 0, -34), W(-9.6, 1.2, -48), goal]),
    reeferApron: route([mid, W(-20, 0, -20), W(-20, 0, -48), goal]),
  };
  R('routes mid → goal (m)', Object.values(r).every((v) => v), r);
  R('spots (world)', true, { checkpoint: [cp.x, cp.y, cp.z].map((v) => +v.toFixed(2)), goal: [goal.x, goal.y, goal.z].map((v) => +v.toFixed(2)), pad: (({ x, y, z }) => [x, y, z].map((v) => +v.toFixed(2)))(__G.level.spawnPads[0]) });
  return out;
})()
