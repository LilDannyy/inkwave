// Bluestone blockout (scratch, fix round 2, review issue 5): does the Halo dominate the 3000s (DESIGN.md §6.2 #1)?
// Geometry, not bots: in the era-3 build (the real Level; rails and glass see-through, as for shots and sight), from every
// standable point of each high perch at a kid's eye (top + 1.45), which points of the centre zone (the octagon on the
// concourse) and of the two Clock Steps can it see within 27 m (the charger's rangeMax) and within 18 m (a shooter's
// reach)? A target point is a kid's body (its floor + 1.0). Reports per perch: the share of the zone / steps that SOME
// point of the perch sees, and the mean share one point of it sees; for the Halo, era 3 against the balconies, the
// Boathouse decks and the concourse floor itself (era 2 has only those).
//   ERA=3 node --import ./three-hook.mjs halo-sight.mjs
const root = new URL('../../../../../', import.meta.url).pathname;
const THREE = await import('three');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics, Hit } = await import(root + 'src/game/physics.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const L = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'zones'), []), phys = new Physics(L), hit = new Hit();
const P = new THREE.Vector3(), ids = [];
const topAt = (x, z) => {
  let best = null;
  for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) {
    const b = L.blocks[id]; if (!b.solid || b.rail || b.grate || b.hidden || b.roof) continue;   // (walkable tops only)
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const t = b.center.clone().addScaledVector(n, b.half.y), y = t.y - (n.x * (x - t.x) + n.z * (z - t.z)) / n.y;
    P.set(x, y - 0.01, z); if (!L.pointInBlock(b, P, 0.001)) continue;
    if (!best || y > best.y) best = { y, b };
  }
  if (!best) return null;
  P.set(x, best.y + 0.5, z); if (L.pointInside(P)) return null;   // under something
  return best;
};
// perches (both halves): points on a 0.5 m grid whose top is in the height band and inside the region
const grid = (test, yb) => { const out = []; for (let x = -25; x <= 25; x += 0.5) for (let z = -25; z <= 25; z += 0.5) { if (!test(x, z)) continue; const t = topAt(x, z); if (t && t.y >= yb[0] && t.y <= yb[1]) out.push({ x, z, y: t.y }); } return out; };
const r = (x, z) => Math.hypot(x, z);
const inRect = (x, z, [x0, x1, z0, z1]) => (x >= x0 && x <= x1 && z >= z0 && z <= z1) || (-x >= x0 && -x <= x1 && -z >= z0 && -z <= z1);
const perches = {
  halo: grid((x, z) => r(x, z) > 10.5 && r(x, z) < 16.5, [4.8, 5.6]),   // (fix round 3: the 3.5 m Halo, inner apothem 11.1)
  balconies: grid((x, z) => inRect(x, z, [-14, -5, -18.5, -12.5]), [2.2, 2.6]),
  boathouseDecks: grid((x, z) => inRect(x, z, [16.5, 21.5, -24, -12]), [2.2, 2.6]),
  concourseEdge: grid((x, z) => r(x, z) > 6.6 && r(x, z) < 8.6, [1.2, 1.4]),
};
// targets: the centre zone (its octagon) and the two Clock Steps, on a 0.5 m grid, a kid's body (floor + 1.0)
const zone = LY.LAYOUT.zones.center[0].poly, targets = { zone: [], steps: [] };
for (let x = -9.75; x <= 9.75; x += 0.5) for (let z = -12; z <= 12; z += 0.5) {
  const t = topAt(x, z); if (!t) continue;
  if (G.inPoly(zone, x, z)) targets.zone.push({ x, z, y: t.y + 1.0 });
  else if (Math.abs(x) <= 3.5 && Math.abs(z) >= 8.78 && Math.abs(z) <= 12) targets.steps.push({ x, z, y: t.y + 1.0 });
}
const O = new THREE.Vector3(), D = new THREE.Vector3();
const sees = (s, t, maxD) => { O.set(s.x, s.y + 1.45, s.z); D.set(t.x - O.x, t.y - O.y, t.z - O.z); const d = D.length(); if (d > maxD) return false; D.divideScalar(d); phys.raycast(O, D, d - 0.05, hit, true); return !hit.hit; };
const out = { era: process.env.ERA, targets: { zone: targets.zone.length, steps: targets.steps.length } };
for (const [k, src] of Object.entries(perches)) {
  const row = { points: src.length };
  for (const maxD of [27, 18]) for (const [tk, tl] of Object.entries(targets)) {
    const any = new Set(); let sum = 0;
    for (const s of src) { let n = 0; for (const t of tl) if (sees(s, t, maxD)) { n++; any.add(t.x + ',' + t.z); } sum += n / tl.length; }
    row[`${tk}${maxD}`] = { anyPoint: +(any.size / tl.length).toFixed(2), onePoint: +(src.length ? sum / src.length : 0).toFixed(2) };
  }
  out[k] = row;
}
console.log(JSON.stringify(out));
