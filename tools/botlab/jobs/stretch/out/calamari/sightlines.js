// Calamari County — the longest open sightline along the two long flank runs of Alpha's half (the lead's note on the
// stretch: the hillside road and the basin quay). Lines every 0.5 m across each lane, sampled every 0.2 m along it at
// chest height (1.2 m over the lane's floor); a sample is blocked by any solid block or prop collider (railings and the
// movers don't block sight). Reports each run's longest unbroken line (m) and where. Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=calamari PAGE=tools/botlab/jobs/stretch/out/calamari/sightlines.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, THREE = await import('three'), P = new THREE.Vector3(), ids = [];
  const zMin = L.bounds.minZ;
  const solid = (x, y, z) => { P.set(x, y, z); for (const id of L.queryBlocks(x - 0.05, z - 0.05, x + 0.05, z + 0.05, ids)) { const b = L.blocks[id]; if (b.solid && !b.rail && !b.dynamic && L.pointInBlock(b, P, 0.02)) return true; } return false; };
  const runs = [
    // the hillside road: from the level crossing's south edge to the base's front (T2's wall), street level
    { name: 'hillside road', x: [-25.3, -18.7], z: [-6.8, zMin + 17.4], y: 1.2 },
    // the basin quay: from the north quay's back edge along the basin to the co-op quay (inside its angled edge)
    { name: 'basin quay', x: [16.2, 21.0], z: [-17.2, zMin + 10], y: 1.1 },
  ];
  for (const r of runs) {
    let best = 0, at = null;
    for (let x = r.x[0]; x <= r.x[1] + 1e-6; x += 0.5) {
      let open = 0, start = r.z[0];
      for (let z = r.z[0]; z >= r.z[1]; z -= 0.2) {
        // (the quay's angled edge: stop the line where it leaves the quay)
        if (solid(x, r.y, z) || L.groundHeight(x, z, r.y) === -Infinity) { open = 0; start = z - 0.2; continue; }
        open += 0.2;
        if (open > best) { best = open; at = [+x.toFixed(1), +start.toFixed(1), +z.toFixed(1)]; }
      }
    }
    R(`longest open line along the ${r.name}`, true, { m: +best.toFixed(1), x_z0_z1: at });
  }
  return out;
})()
