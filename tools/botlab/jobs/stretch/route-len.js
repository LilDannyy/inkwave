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
    terraces: { goal: [-9.4, 3.6, -44.2], routes: {
      centre: [[-6, 1.2, -16.5], [-7, 2.4, -20.5], [-9.6, 3.6, -30.4]],
      west: [[-16.5, 0, -9], [-17.8, 2.4, -36], [-16.5, 3.6, -47]],
      groves: [[2.5, 2.4, -27.5], [-4.5, 2.4, -38.5], [-7.5, 3.6, -39.5]],
      east: [[11.5, 0, -17.5], [2.5, 2.4, -27.5], [6.3, 2.4, -44], [0.8, 3.6, -50.5]],
    } },
  };
  const S = window.__routes || SETS[id];
  if (!S) { R('no route set for ' + id, false, {}); return out; }
  const node = (p) => nav.nearest({ x: p[0], y: p[1] + 0.5, z: p[2] }, 1.5, false);
  const len = (a, b) => { const p = nav.path(a, b, 0, 400000); if (!p) return null; let L = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; L += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return L; };
  // mid: the lowest walkable node near the centre (as spawn-mid.js picks it)
  let mid = -1;
  for (const r of [3, 4, 6, 8]) { let by = Infinity; nav.nodes.forEach((n, i) => { if (Math.hypot(n.x, n.z) < r && n.y < by && nav.valid[i]) { by = n.y; mid = i; } }); if (mid >= 0) break; }
  const goal = node(S.goal);
  const d0 = len(mid, goal);
  R('direct (the nav\'s own shortest)', d0 != null, { m: d0 && +d0.toFixed(1), mid: nav.nodes[mid] && [nav.nodes[mid].x, nav.nodes[mid].z], goal: nav.nodes[goal] && [nav.nodes[goal].x, +nav.nodes[goal].y.toFixed(2), nav.nodes[goal].z] });
  for (const [name, wps] of Object.entries(S.routes)) {
    const ids = [mid, ...wps.map(node), goal];
    let L = 0, ok = true; for (let i = 1; i < ids.length; i++) { const l = len(ids[i - 1], ids[i]); if (l == null) { ok = false; break; } L += l; }
    R('route ' + name, ok, { m: +L.toFixed(1), s: +(L / 11.8).toFixed(2) });
  }
  return out;
})()
