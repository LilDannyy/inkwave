// Route lengths for the Bazookarp notes (MAP=<id> PAGE=…/route-len.js tools/botlab/run.sh tools/botlab/page.cjs): the
// nav path (Alpha's team) from mid to the goal spot through each route's waypoints, in metres and seconds of swimming.
// window.__routes = { goal: [x, y, z], routes: { name: [[x, y, z], …] } } (Alpha's half), set by a stage block below.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const nav = __G.nav, id = __G.level.layout?.id;
  const SETS = {
    lockgate: { goal: [-2, 0, -57.5], routes: {
      west: [[-23, 0, -30], [-26.4, 0, -43], [-24, 0, -50]],
      staging: [[0, 0, -20], [-10, 0, -30], [-12.5, 1.3, -38.2], [-12.5, 1.3, -43], [-11.5, 1.3, -48], [-11.5, 0, -52.5]],
      centre: [[0, 0, -20], [-1, 0, -31], [-3, 0, -43], [-3, 0, -51]],
      east: [[16, 1.3, -10], [16, 0, -20], [18, 0, -28], [18, 0, -43], [12, 0, -51]],
    } },
  };
  const S = window.__routes || SETS[id];
  if (!S) { R('no route set for ' + id, false, {}); return out; }
  const node = (p) => nav.nearest({ x: p[0], y: p[1] + 0.5, z: p[2] }, 1.5, false);
  const len = (a, b) => { const p = nav.path(a, b, 0, 400000); if (!p) return null; let L = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  let mid = -1, by = Infinity; nav.nodes.forEach((n, i) => { if (Math.hypot(n.x, n.z) < 3 && n.y < by && nav.valid[i]) { by = n.y; mid = i; } });
  const goal = node(S.goal);
  R('direct (the nav\'s own shortest)', true, { m: +len(mid, goal).toFixed(1) });
  for (const [name, wps] of Object.entries(S.routes)) {
    const ids = [mid, ...wps.map(node), goal];
    let L = 0, ok = true; for (let i = 1; i < ids.length; i++) { const l = len(ids[i - 1], ids[i]); if (l == null) { ok = false; break; } L += l; }
    R('route ' + name, ok, { m: +L.toFixed(1), s: +(L / 11.8).toFixed(2) });
  }
  return out;
})()
