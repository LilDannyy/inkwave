// Spirhalite Islands (the stretch) — Bazookarp notes: nav route lengths from mid to the goal spot in front of Alpha's
// pad, through each lane (waypoints chained with the bots' A*), and to the slice's checkpoint spot. Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=spirhalite PAGE=tools/botlab/jobs/stretch/out/spirhalite/routes-goal.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav;
  const near = (x, y, z) => nav.nearest({ x, y: y + 0.5, z }, 1.5, true);
  const leg = (a, b) => { const p = nav.path(a, b, 1, 200000); if (!p) return null; let m = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; m += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return m; };
  const route = (pts) => { let m = 0; const ids = pts.map(([x, y, z]) => near(x, y, z)); if (ids.some((i) => i == null || i < 0)) return { err: 'no node', ids }; for (let i = 1; i < ids.length; i++) { const l = leg(ids[i - 1], ids[i]); if (l == null) return { err: `no path at leg ${i}` }; m += l; } return { m: +m.toFixed(1), s: +(m / 11.8).toFixed(2) }; };
  const MID = [0, 0, 0], GOAL = [9.8, 1.3, -49.5], CP = [0.4, 1.3, -39.8];
  const lanes = {
    'centre: pillar bridge → pillar islet → rope bridge → shelf → shoulder': [MID, [-1.5, 0, -10], [3.2, 0, -21], [1.4, 1.3, -34.6], [2.0, 0, -44.8], GOAL],
    'centre: … → the ford → tide-pool islet → shoulder': [MID, [-1.5, 0, -10], [-4.8, 0, -24], [-5.1, 0, -31], [-3.0, 0, -38], GOAL],
    'east: spit bridge → Arch spit → its root → shoulder': [MID, [14.5, 0.25, -5], [13.8, 0, -18], [16.4, 0, -33], [18.0, 0, -46.5], GOAL],
    'west: mid islet → neck → the dig → dig bridge → tide-pool islet': [MID, [-14, 0, -10], [-20.8, 0, -20], [-22, 0, -30], [-20.5, 0, -42], [-13, 0.25, -42], [-5, 0, -44], GOAL],
    'west (outer): causeway → the dig → camp islet → pinch → base': [MID, [-24, 0, -3], [-29, 1.3, -18], [-33, 0, -35], [-22, 0, -52], [-6, 0, -52], GOAL],
  };
  const res = {};
  for (const [k, pts] of Object.entries(lanes)) res[k] = route(pts);
  R('mid → the goal spot, per lane (m, s at swim speed)', Object.values(res).every((r) => r.m), res);
  R('mid → the checkpoint spot (shelf)', true, { direct: route([MID, CP]), viaFord: route([MID, [-5.1, 0, -31], CP]) });
  R('goal spot → Alpha pad (straight m)', true, { m: +Math.hypot(GOAL[0] - __G.level.spawnPads[0].x, GOAL[2] - __G.level.spawnPads[0].z).toFixed(1) });
  return out;
})()
