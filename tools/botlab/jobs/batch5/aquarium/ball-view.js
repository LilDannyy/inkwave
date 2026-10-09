// Gulper Aquarium: Bathysphere No. 1 from the spawn's play camera (fix round 1, review issue 5), both teams:
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/ball-view.js tools/botlab/run.sh tools/botlab/page.cjs
// The camera stands where the follow rig puts it at the start (measured: 2.51 m over the pad, 4.36 m behind it, facing
// down the stage: +z for Alpha, −z for Bravo). 400 rays to points spread over the ball's visible disc; a ray is blocked
// by any opaque level block (hidden glass and water, rails and the ball's own collider don't block) or by an Express
// tube (Ø 1.76, its 0.22 m spine on top). Reports the share of the disc seen, and the angular gap between the ball and
// the nearest Express tube in the picture (degrees; negative = they overlap). Pass: the whole ball seen (≥ 98 %).
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, THREE = await import('three');
  const { PIPES, allLegs, centreline } = await import('./src/world/stages/aquarium/tubeway.js');
  const V = new THREE.Vector3(), BALL = [0, 14.5, 0], RB = 1.45, r2 = (v) => Math.round(v * 100) / 100;
  const opaqueAt = (x, y, z) => { const ids = []; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (!b.solid || b.hidden || b.rail || b.dynamic) continue; if (L.pointInBlock(b, V.set(x, y, z), 0)) return b; } return null; };
  // the Express tubes as capsule chains (centreline samples), radius incl. the spine
  const tubes = allLegs(PIPES).filter((l) => l.id.startsWith('express')).map((l) => centreline(l, 0.5));
  const segDist = (p, d, a, b) => {   // distance between the ray p + t d (t ≥ 0) and the segment a–b (sampled)
    let best = Infinity;
    for (let k = 0; k <= 4; k++) {
      const q = [a[0] + (b[0] - a[0]) * k / 4, a[1] + (b[1] - a[1]) * k / 4, a[2] + (b[2] - a[2]) * k / 4];
      const w = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], t = Math.max(0, w[0] * d[0] + w[1] * d[1] + w[2] * d[2]);
      best = Math.min(best, Math.hypot(w[0] - d[0] * t, w[1] - d[1] * t, w[2] - d[2] * t));
    }
    return best;
  };
  for (const t of [0, 1]) {
    const pad = L.spawnPads[t], f = t ? -1 : 1, C = [pad.x - 0.1 * f, pad.y + 2.51, pad.z - 4.36 * f];
    const toB = [BALL[0] - C[0], BALL[1] - C[1], BALL[2] - C[2]], DB = Math.hypot(...toB), u = toB.map((v) => v / DB);
    // a basis across the line of sight
    const e1 = [u[2], 0, -u[0]].map((v, i, a) => v / Math.hypot(a[0], a[2])), e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];
    let seen = 0, n = 0, byLevel = 0, byTube = 0, gap = Infinity;
    for (let i = 0; i < 400; i++) {
      const rr = RB * 0.97 * Math.sqrt((i + 0.5) / 400), a = i * 2.39996;
      const P = [BALL[0] + (e1[0] * Math.cos(a) + e2[0] * Math.sin(a)) * rr, BALL[1] + (e1[1] * Math.cos(a) + e2[1] * Math.sin(a)) * rr, BALL[2] + (e1[2] * Math.cos(a) + e2[2] * Math.sin(a)) * rr];
      const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], D = Math.hypot(...d); d[0] /= D; d[1] /= D; d[2] /= D;
      n++;
      let lev = false;
      for (let s = 1.0; s < D - RB - 0.3; s += 0.25) if (opaqueAt(C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s)) { lev = true; break; }
      let tub = false;
      for (const c of tubes) for (let k = 1; k < c.length && !tub; k++) if (segDist(C, d, c[k - 1], c[k]) < 0.88 + 0.12) tub = true;
      if (lev) byLevel++; if (tub) byTube++; if (!lev && !tub) seen++;
    }
    // the angular gap between the ball's disc and the nearest tube (as seen from the camera)
    for (const c of tubes) for (const q of c) {
      const w = [q[0] - C[0], q[1] - C[1], q[2] - C[2]], D = Math.hypot(...w);
      const ang = Math.acos(Math.max(-1, Math.min(1, (w[0] * u[0] + w[1] * u[1] + w[2] * u[2]) / D))) * 180 / Math.PI;
      gap = Math.min(gap, ang - Math.asin(Math.min(1, RB / DB)) * 180 / Math.PI - Math.asin(Math.min(1, 1.0 / D)) * 180 / Math.PI);
    }
    R(`${t ? 'Bravo' : 'Alpha'}: the whole bathysphere seen from the play camera`, seen / n >= 0.98, { camera: C.map(r2), seenPct: Math.round((100 * seen) / n), hiddenByLevel: byLevel, hiddenByExpress: byTube, gapToExpressDeg: r2(gap) });
  }
  return out;
})()
