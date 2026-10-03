// Gulper Aquarium blockout: the Tubeway's mouths against the built level (the pipe engine isn't built yet, so this
// checks the geometry its rules need — ENGINE.md §5, rules 7, 8, 9, 12 — on the real colliders and nav graph):
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/pipe-aprons.js tools/botlab/run.sh tools/botlab/page.cjs
// For every end (both tide states: each Kelp Line end is IN in one, OUT in the other):
//   floor   the mouth floor under the approach point is walkable floor at the end's floorY (mouth centre − 0.8 ± 0.05)
//   apron   IN ends: 2.0 m deep × 2.4 m wide in front of the mouth, flat (±0.1) floor, nothing solid 0.15 … 2.2 m over it
//   nav     a valid nav node within 0.8 m of the approach point and of the landing point
//   landing OUT ends: the landing point (3.1 m out) on walkable floor ≤ 3.4 m below the mouth floor, never water, never
//           in a spawn barrier; the no-input lane (axis ±20°, 3.5 m) free of blocks taller than 0.5 m over the floor;
//           headroom ≥ 3.2 m over the mouth floor out to 3.5 m
//   cover   ≥ 1.0 m tall cover within 4 m of the landing point
//   spawn   no landing within 22 m of a pad; an IN end within 15 m of a pad is one-way
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav, THREE = await import('three');
  const { PIPES, allLegs, endsOf } = await import('./src/world/stages/aquarium/tubeway.js');
  const V = new THREE.Vector3(), r2 = (v) => Math.round(v * 100) / 100;
  const solid = (x, y, z) => L.pointInside(V.set(x, y, z), 0);
  const gh = (x, z, yMax) => L.groundHeight(x, z, yMax);
  const nodeNear = (p, r = 0.8) => { let best = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; const d = Math.hypot(n.x - p[0], n.z - p[2]); if (d < r && Math.abs(n.y - p[1]) < 0.6) best = Math.min(best, d); }); return best === Infinity ? null : r2(best); };
  const pads = L.spawnPads;
  for (const leg of allLegs(PIPES)) {
    const tidal = typeof leg.way === 'object', two = leg.way === 'two';
    for (const e of endsOf(leg)) {
      const isIn = two || tidal || (leg.way === 'one' && e.k === 0), isOut = two || tidal || (leg.way === 'one' && e.k === 1);
      const name = `${leg.id} ${e.k ? 'B' : 'A'}`, o = e.out, t = [-o[2], 0, o[0]];
      const info = { mouth: e.pos.map(r2), floorY: r2(e.floorY), way: tidal ? 'tidal' : leg.way, in: isIn, out: isOut };
      const bad = [];
      // the mouth floor
      const fy = gh(e.approach[0], e.approach[2], e.floorY + 0.5);
      info.approachFloor = r2(fy);
      if (Math.abs(fy - e.floorY) > 0.05) bad.push(`approach floor ${r2(fy)} ≠ ${r2(e.floorY)}`);
      info.navApproach = nodeNear([e.approach[0], fy, e.approach[2]]);
      if (info.navApproach == null) bad.push('no nav node within 0.8 m of the approach');
      if (isIn) {   // the apron: 2.0 deep × 2.4 wide, flat, clear to 2.2
        let flat = 0, lo = Infinity, hi = -Infinity, block = null;
        for (let d = 0.25; d <= 2.0; d += 0.25) for (let w = -1.2; w <= 1.2; w += 0.3) {
          const x = e.pos[0] + o[0] * d + t[0] * w, z = e.pos[2] + o[2] * d + t[2] * w, y = gh(x, z, e.floorY + 0.4);
          lo = Math.min(lo, y); hi = Math.max(hi, y);
          for (const h of [0.15, 0.6, 1.2, 1.8, 2.2]) if (!block && solid(x, e.floorY + h, z)) block = [r2(x), r2(e.floorY + h), r2(z)];
          flat++;
        }
        info.apron = { floor: [r2(lo), r2(hi)], block };
        if (hi - lo > 0.1 + 1e-6 || Math.abs(lo - e.floorY) > 0.1) bad.push(`apron not flat floor: ${r2(lo)}…${r2(hi)}`);
        if (block) bad.push(`apron blocked at ${block}`);
        for (const p of pads) { const dd = Math.hypot(e.pos[0] - p.x, e.pos[2] - p.z); if (dd < 15 && !(leg.way === 'one')) bad.push(`two-way / tidal IN end ${r2(dd)} m from a pad`); if (dd < 6) bad.push(`IN end ${r2(dd)} m from a pad`); }
      }
      if (isOut) {
        const ly = gh(e.land[0], e.land[2], e.floorY + 0.5);
        info.landFloor = r2(ly); info.drop = r2(e.floorY - ly);
        if (ly === -Infinity || ly < -1.0) bad.push('landing over water');
        else if (e.floorY - ly > 3.4) bad.push(`landing ${r2(e.floorY - ly)} m below the mouth floor`);
        info.navLanding = nodeNear([e.land[0], ly, e.land[2]]);
        if (info.navLanding == null) bad.push('no nav node within 0.8 m of the landing');
        // the no-input lane: axis ±20°, 3.5 m: no block taller than 0.5 m over the floor; headroom 3.2 m
        let lane = null, head = null;
        for (const a of [-20, -10, 0, 10, 20]) {
          const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), dx = o[0] * c - o[2] * s, dz = o[0] * s + o[2] * c;
          for (let d = 0.6; d <= 3.5; d += 0.3) {
            const x = e.pos[0] + dx * d, z = e.pos[2] + dz * d, fl = gh(x, z, e.floorY + 3.0);
            if (!lane && fl > e.floorY + 0.5) lane = [r2(x), r2(fl), r2(z)];
            if (!head && solid(x, e.floorY + 3.2, z)) head = [r2(x), r2(z)];
          }
        }
        info.lane = lane; info.headroom = head;
        if (lane) bad.push(`pop lane blocked (floor ${lane[1]} at ${lane[0]},${lane[2]})`);
        if (head) bad.push(`headroom < 3.2 m at ${head}`);
        // cover ≥ 1.0 m within 4 m of the landing
        let cov = null;
        for (let r = 0.5; r <= 4 && !cov; r += 0.25) for (let k = 0; k < 24 && !cov; k++) { const a = (k / 24) * Math.PI * 2, x = e.land[0] + Math.cos(a) * r, z = e.land[2] + Math.sin(a) * r; if (solid(x, ly + 1.0, z)) cov = r2(r); }
        info.coverWithin = cov;
        if (cov == null) bad.push('no cover ≥ 1.0 m within 4 m of the landing');
        for (const p of pads) { const dd = Math.hypot(e.land[0] - p.x, e.land[2] - p.z); if (dd < 22) bad.push(`landing ${r2(dd)} m from a pad`); if (dd < L.spawnBarrier + 0.5) bad.push('landing in a spawn barrier'); }
        info.padDist = r2(Math.min(...pads.map((p) => Math.hypot(e.land[0] - p.x, e.land[2] - p.z))));
      }
      R(name, bad.length === 0, { ...info, bad });
    }
  }
  return out;
})()
