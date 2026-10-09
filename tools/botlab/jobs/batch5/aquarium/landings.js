// Gulper Aquarium: the spawn exits' landings (fix round 1, review issue 1), on the built level, both teams:
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/landings.js tools/botlab/run.sh tools/botlab/page.cjs
// For each pavilion stair: the landing at its foot (4 m deep along the stair's line, its 3 m width + 1 m either side,
// clipped to the plaza's edges: the sea rail, and the stair's own handrail on that side, to the east; the penguin
// glass's 0.4 m sill to the west) must be flat floor with nothing solid from 0.15 to 2.2 m over it; and how
// far the stair's line (its own width) runs clear past the foot before anything ≥ 0.5 m over the floor stands on it.
// For the front drop: nothing solid within 2 m of the fascia along the whole front. For the Express's plaza (IN) mouth:
// its distance to the east stair's foot (≥ 5 m), the angle between its outward axis and the direction to that foot (it
// must not face the stair: > 60°), and its distance to the pad (rule 19, ≥ 6 m) and to the Gate (rule 22, ≥ 15 m).
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, THREE = await import('three');
  const { PIPES, allLegs, endsOf } = await import('./src/world/stages/aquarium/tubeway.js');
  const V = new THREE.Vector3(), r2 = (v) => Math.round(v * 100) / 100, C = Math.cos(Math.PI / 6);
  const solid = (x, y, z) => { const ids = []; for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) { const b = L.blocks[id]; if (b.solid && !b.dynamic && L.pointInBlock(b, V.set(x, y, z), 0.0)) return b; } return null; };
  // Alpha's blade frame; Bravo's by the turn
  const Wt = (t, s, w) => { const x = 0.5 * s + C * w, z = -32.5 - C * s + 0.5 * w; return t ? [-x, -z] : [x, z]; };
  const SP = { front: 31, half: 13, stair: 3 };
  const K = L.layout.bazookarp, gate = K && K.gate.at;
  for (const t of [0, 1]) {
    const T = t ? 'Bravo' : 'Alpha';
    for (const [side, w0, w1] of [['east', SP.half, SP.half + SP.stair], ['west', -SP.half - SP.stair, -SP.half]]) {
      // the landing: s front − 4 … front, w0 − 1 … w1 + 1
      let bad = null, cells = 0, floorLo = Infinity, floorHi = -Infinity;
      for (let s = SP.front - 4 + 0.1; s <= SP.front - 0.05; s += 0.25) for (let w = w0 - 1; w <= w1 + 1 + 1e-6; w += 0.25) {
        if (Math.abs(w) > 16.25) continue;        // (the plaza's edges: the sea rail on the east, the penguin glass's sill on the west)
        const [x, z] = Wt(t, s, w), y = L.groundHeight(x, z, 0.5);
        if (y < -1) continue;
        cells++; floorLo = Math.min(floorLo, y); floorHi = Math.max(floorHi, y);
        if (!bad) for (const h of [0.15, 0.6, 1.2, 2.2]) { const b = solid(x, y + h, z); if (b && !(b.rail && Math.abs(w) >= 15.85)) { bad = { s: r2(s), w: r2(w), h, tag: b.tag || '?' }; break; } }
      }
      // how far the stair's line runs clear past its foot (its own width)
      let clear = 0;
      for (let d = 0.1; d <= 16; d += 0.1) {
        let hit = false;
        for (let w = w0 + 0.1; w <= w1 - 0.1 + 1e-6 && !hit; w += 0.2) { const [x, z] = Wt(t, SP.front - d, w), y = L.groundHeight(x, z, 0.7); if (y > 0.45 || solid(x, Math.max(y, 0) + 0.5, z)) hit = true; }
        if (hit) break; clear = d;
      }
      R(`${T} ${side} stair: landing 4 m × ${SP.stair + 2} m flat and clear`, !bad && floorHi - floorLo < 0.05, { cells, floor: [r2(floorLo), r2(floorHi)], blocked: bad, lineClearM: r2(clear) });
    }
    // the front drop: nothing solid within 2 m of the fascia along the front (w ±13)
    let fb = null;
    for (let s = SP.front - 2; s <= SP.front - 0.05 && !fb; s += 0.25) for (let w = -SP.half; w <= SP.half && !fb; w += 0.25) { const [x, z] = Wt(t, s, w); for (const h of [0.3, 1.0]) { const b = solid(x, h, z); if (b) { fb = { s: r2(s), w: r2(w), tag: b.tag || '?' }; break; } } }
    R(`${T} front drop: 2 m clear in front of the fascia`, !fb, { blocked: fb });
    // the Express's plaza mouth
    const ex = allLegs(PIPES).find((l) => l.id === (t ? 'express~' : 'express')), A = endsOf(ex)[0];
    const [fx, fz] = Wt(t, SP.front, SP.half + 0.0), foot = [fx, fz];      // the east stair's foot, inner corner
    const dFoot = Math.hypot(A.pos[0] - foot[0], A.pos[2] - foot[1]);
    const toFoot = [(foot[0] - A.pos[0]) / dFoot, (foot[1] - A.pos[2]) / dFoot], ang = Math.acos(Math.max(-1, Math.min(1, toFoot[0] * A.out[0] + toFoot[1] * A.out[2]))) * 180 / Math.PI;
    const pad = L.spawnPads[t], dPad = Math.hypot(A.pos[0] - pad.x, A.pos[2] - pad.z);
    const g = gate ? (t ? gate : [-gate[0], gate[1], -gate[2]]) : null, dGate = g ? Math.hypot(A.pos[0] - g[0], A.pos[2] - g[2]) : null;
    R(`${T} Express plaza mouth: ≥ 5 m from the east stair's foot, not facing it; rules 19 and 22`, dFoot >= 5 && ang > 60 && dPad >= 6 && (dGate == null || dGate >= 15),
      { mouth: A.pos.map(r2), out: A.out.map(r2), toStairFoot: r2(dFoot), angleOffStair: Math.round(ang), toPad: r2(dPad), toGate: dGate && r2(dGate) });
  }
  return out;
})()
