// Gulper Aquarium: nav path lengths from Alpha's pad through named waypoints to mid (debugging the spawn → mid routes)
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav, pad = L.spawnPads[0];
  const near = (x, y, z) => nav.nearest({ x, y, z }, 1.5, false);
  const plen = (p) => { let len = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return len; };
  const start = nav.nearest({ x: pad.x, y: pad.y + 0.5, z: pad.z }, 0.8, true);
  let goal = -1, by = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i] || Math.hypot(n.x, n.z) > 2) return; if (n.y < by) { by = n.y; goal = i; } });
  const routes = window.__pageArgs ? JSON.parse(window.__pageArgs) : {
    centre: [[13.5, 0, -50.5], [1.5, 0, -36.5], [2.5, 0, -24.5], [2.5, 0, -12.5]],
    west: [[-0.5, 0, -50.5], [-2.5, 0, -36.5], [-2.5, 0, -24.5], [-2.5, 0, -12.5]],
    left: [[13.5, 0, -44.5], [16.5, 0, -28.5], [14.5, 0, -16.5]],
    right: [[-6.5, 1.2, -52.5], [-13.5, 1.2, -36.5], [-19.5, 2.4, -22.5], [-14.5, 0, -10.5]],
  };
  for (const [name, wps] of Object.entries(routes)) {
    let at = start, total = 0, legs = [];
    for (const w of [...wps.map((p) => near(...p)), goal]) {
      const p = nav.path(at, w, 0, 200000); if (!p) { legs.push('X'); break; }
      const l = plen(p); total += l; legs.push(+l.toFixed(1)); at = w;
    }
    R(name, true, { m: +total.toFixed(1), s: +(total / 11.8).toFixed(2), legs });
  }
  return out;
})()
