// Calamari County — spawn to "just off the island" (the stretch brief's note for this stage: the one-way overpass drops
// keep the nav off the island platform, so spawn-mid.js's goal on the island is a detour; this measures the nav path
// from each team's spawn pads to the trackbed node just off the island's edge on its own side, x ≈ 0, and to the far
// side's twin). Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=calamari PAGE=tools/botlab/jobs/stretch/out/calamari/spawn-mid-off.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav;
  const { PLAYER } = await import('./src/config.js').catch(() => ({}));
  const swim = (PLAYER && PLAYER.swimSpeed) || 11.8;
  const pads = L.spawnPads, half = pads.length / 2;
  const cen = (list) => list.reduce((a, p) => ({ x: a.x + p.x / list.length, y: a.y + p.y / list.length, z: a.z + p.z / list.length }), { x: 0, y: 0, z: 0 });
  const s0 = cen(pads.slice(0, half)), s1 = cen(pads.slice(half));
  const mid = { x: (s0.x + s1.x) / 2, z: (s0.z + s1.z) / 2 };
  // the trackbed node nearest (0, ±4.2) at y < 0.5 (just off the island platform's edge, |z| 3.4)
  const near = (x, z, y0 = -1, y1 = 0.5) => { let g = -1, bd = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i] || n.y > y1 || n.y < y0) return; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; g = i; } }); return g; };
  const plen = (p) => { let len = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return len; };
  const res = {};
  for (const [team, s] of [[0, s0], [1, s1]]) {
    const sg = Math.sign(s.z - mid.z) || -1;
    const a = nav.nearest({ x: s.x, y: s.y + 0.5, z: s.z }, 0.8, true);
    const own = near(mid.x, mid.z + sg * 4.2), far = near(mid.x, mid.z - sg * 4.2);
    // (and the side platform's edge over the own track, z ∓7: the nav keeps off the drop onto the ballast, so the
    // trackbed node is reached round the platform's end — the platform edge is the straight way's last walkable spot)
    const edgeN = near(mid.x, mid.z + sg * 7.0, 0.8, 1.2);
    const po = nav.path(a, own, team, 200000), pf = nav.path(a, far, team, 200000), pe = nav.path(a, edgeN, team, 200000);
    const n = nav.nodes[own];
    res['t' + team] = { own: po ? { m: +plen(po).toFixed(1), s: +(plen(po) / swim).toFixed(2), at: [n.x, +n.y.toFixed(1), n.z] } : null,
      far: pf ? { m: +plen(pf).toFixed(1), s: +(plen(pf) / swim).toFixed(2) } : null,
      platformEdge: pe ? { m: +plen(pe).toFixed(1), s: +(plen(pe) / swim).toFixed(2), at: [nav.nodes[edgeN].x, +nav.nodes[edgeN].y.toFixed(1), nav.nodes[edgeN].z] } : null,
      straightMid: +Math.hypot(s.x - mid.x, s.z - mid.z).toFixed(1), straightOwn: +Math.hypot(s.x - nav.nodes[own].x, s.z - nav.nodes[own].z).toFixed(1) };
  }
  R('spawn to just off the island', !!(res.t0?.own && res.t1?.own), res);
  return out;
})()
