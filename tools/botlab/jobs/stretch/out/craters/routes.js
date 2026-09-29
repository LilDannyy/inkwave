// Turf War Craters (the Long Stages stretch) — Bazookarp notes: nav routes from mid to the goal spot in front of Alpha's
// spawn, each forced through its own waypoints (page script for tools/botlab/page.cjs; any mode):
//   MAP=craters PAGE=tools/botlab/jobs/stretch/out/craters/routes.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav;
  const node = (p) => nav.nearest({ x: p[0], y: p[1] + 0.5, z: p[2] }, 1.2, true);
  const leg = (a, b) => { const p = nav.path(a, b, 1, 200000); if (!p) return null; let L = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  const MID = [0, -1.3, 0], GOAL = [3.5, 0, -51], CP = [-3, 1.6, -43];
  const routes = {
    'the central path (the crater cut, the zig-zag bridge, the path past the mound)': [[0, -0.5, -9], [0, 0.7, -22.1], [3.7, 0, -31], [3.7, 0, -45]],
    'over the mound (its north steps, the top by the cross, the south steps)': [[0, -0.5, -9], [0, 0.7, -22.1], [-3, 0, -33.5], [-3, 1.6, -41], [-3, 0, -50.8]],
    'right flank (the ring, past the pillbox, down the support trench bay)': [[-8, 0.1, -14.5], [-22, 0, -24], [-26.5, -1, -36], [-22, 0, -44.5], [-8.6, 0, -50]],
    'left flank (the pond rim, the cliff walk, the bridge, the communication trench)': [[14, 0.1, -9], [26, 0, -18], [25.3, 0.7, -35.5], [16.75, -1, -43], [13.25, -1, -48.5]],
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
