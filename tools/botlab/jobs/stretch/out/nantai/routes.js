// Mount Nantai (the Long Stages stretch) — Bazookarp notes: nav routes from mid to the goal spot in front of Alpha's
// spawn, each forced through its own waypoints (page script for tools/botlab/page.cjs; any mode):
//   MAP=nantai PAGE=tools/botlab/jobs/stretch/out/nantai/routes.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav;
  const node = (p) => nav.nearest({ x: p[0], y: p[1] + 0.5, z: p[2] }, 1.2, true);
  const leg = (a, b) => { const p = nav.path(a, b, 1, 200000); if (!p) return null; let L = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  const MID = [0, 0, 0], GOAL = [6, 1.3, -53], CP = [3, 2.6, -41];
  const routes = {
    'knoll (front steps, over the knoll, back steps)': [[0, 0, -12], [3, 1.3, -33], [3, 2.6, -42], [0, 2.6, -48.6]],
    'east terrace (past the hut, the strip by the knoll)': [[0, 0, -12], [12, 1.3, -30], [14.5, 1.3, -38], [12.5, 1.3, -48]],
    'stargazing terrace (west flight, the terrace, the drop to the apron)': [[-5.8, 2.6, -24], [-6, 2.6, -40], [-4.5, 2.6, -52]],
    'shore trail (log bridge, the meadow, the garden ramp)': [[18.6, 0, -11.5], [22.4, 0, -19.4], [20, 0, -34], [19, 0, -48], [18.9, 0, -51.3]],
    'ridge (the boardwalk, the ridge past the Solar Tower)': [[-22, 1.3, -10], [-22, 2.6, -17], [-22, 2.6, -40], [-17, 2.6, -53], [-5, 2.6, -55]],
  };
  const res = {};
  for (const [name, vias] of Object.entries(routes)) {
    const pts = [MID, ...vias, GOAL].map(node);
    let L = 0, ok = true;
    for (let i = 1; i < pts.length; i++) { const d = leg(pts[i - 1], pts[i]); if (d == null) { ok = false; break; } L += d; }
    res[name] = ok ? +L.toFixed(1) : null;
  }
  res.direct = +leg(node(MID), node(GOAL)).toFixed(1);
  res.midToCheckpoint = +leg(node(MID), node(CP)).toFixed(1);
  R('routes mid → goal (m)', Object.values(res).every((v) => v != null), res);
  return out;
})()
