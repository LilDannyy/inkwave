// Bazookarp route lengths (nav paths from mid to the goal spot through waypoints, team 1 pushing into Alpha's base):
//   MAP=crossmarket PAGE=tools/botlab/jobs/stretch/out/crossmarket/routes.js tools/botlab/run.sh tools/botlab/page.cjs
window.__routes = { goal: [0, 0, -51.8], routes: { 'market-east': [[4.5, 0.15, -20], [6.5, 0, -44]], 'market-west': [[-2, 0, -32], [-6.6, 0, -46]], cross: [[0, 0, -35], [0, 1.2, -45.2]], 'fish-lane': [[-17, 0, -18], [-17, 0, -45], [-12, 0, -55]], flank: [[17, 0, -15], [17, 0, -45], [12, 0, -56]] } };
// page script: nav route lengths from mid to a goal spot through given waypoints (window.__routes = { goal: [x,y,z],
// routes: { name: [[x,y,z], …] } }), team 1's path rules (it may enter team 0's half; not its spawn zone)
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav, spec = window.__routes;
  const near = (p) => nav.nearest({ x: p[0], y: p[1] + 0.5, z: p[2] }, 1.2, true);
  const len = (ids) => { let L = 0; for (let i = 1; i < ids.length; i++) { const u = nav.nodes[ids[i - 1]], v = nav.nodes[ids[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  const mid = spec.mid || [0, 0, 0];
  for (const [name, wps] of Object.entries(spec.routes)) {
    const pts = [mid, ...wps, spec.goal].map(near);
    let L = 0, ok = true;
    for (let i = 1; i < pts.length; i++) { const p = pts[i - 1] >= 0 && pts[i] >= 0 ? nav.path(pts[i - 1], pts[i], 1, 200000) : null; if (!p) { ok = false; break; } L += len(p); }
    R('route ' + name, ok, { m: +L.toFixed(1), s: +(L / 11.8).toFixed(2) });
  }
  return out;
})()
