// Bluestone blockout (scratch, fix round 2, review issue 2): can anyone standing in the Signal Garden see Alpha's own
// base? The era-3 build (the real Level, the embankment's prop colliders included). From every standable top of the
// garden — the lawn, the two stairs, and (to prove they are roof) any cover top a kid could stand on — at the kid's eye
// (top + 1.45) and at the camera's pivot (top + 1.85), a ray to every sample point on Alpha's spawn deck (3.3 + 1.0)
// and on the forecourt terrace (1.0 + 1.0); railings and glass (rail / grate) are see-through, as for shots and sight.
// Counts the clear lines, all of them and those within 27 m (the charger's rangeMax), and the nearest.
//   ERA=3 node --import ./three-hook.mjs garden-sight.mjs [MIRROR=1: Bravo's garden toward Bravo's base]
const root = new URL('../../../../../', import.meta.url).pathname;
const THREE = await import('three');
const { MAP_LAYOUTS } = await import(root + 'src/world/maps.js');
const { layoutFor } = await import(root + 'src/world/variants.js');
const { Level } = await import(root + 'src/world/level.js');
const { Physics, Hit } = await import(root + 'src/game/physics.js');
const LY = await import(root + 'src/world/stages/bluestone/layout.js');
const G = await import(root + 'src/world/stages/bluestone/ground.js');
const PR = await import(root + 'src/world/stages/bluestone/props.js');
const extra = [];
for (const it of PR.PLACEMENTS) {
  if (it.type !== 'bluestone_berm') continue;
  for (const sgn of [1, -1]) { const [x, , z] = it.pos, [w, d] = it.size, rot = (it.rotY || 0) + (sgn < 0 ? Math.PI : 0), top = it.top ?? 3.0;
    extra.push({ obox: true, center: [sgn * x, (top - 2) / 2, sgn * z], size: [w, top + 2, d], rotY: (rot * 180) / Math.PI, roof: true }); }
}
const L = new Level(layoutFor(MAP_LAYOUTS.bluestone, 'turf'), extra), phys = new Physics(L), hit = new Hit();
const M = process.env.MIRROR ? -1 : 1;
// standable tops in and on the garden: the highest solid non-roof non-rail top at each 0.5 m point of the yard and the
// arm stair's strip, plus (separately) every non-roof top of a cover piece there
const P = new THREE.Vector3(), ids = [];
const topAt = (x, z, wantCover) => {
  let best = null;
  for (const id of L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, ids)) {
    const b = L.blocks[id]; if (!b.solid || b.rail || b.grate || b.hidden) continue;
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const t = b.center.clone().addScaledVector(n, b.half.y), y = t.y - (n.x * (x - t.x) + n.z * (z - t.z)) / n.y;
    P.set(x, y - 0.01, z); if (!L.pointInBlock(b, P, 0.001)) continue;
    if (!best || y > best.y) best = { y, b };
  }
  if (!best || best.y < 0.3) return null;
  if (best.b.roof) return wantCover ? { y: best.y, roof: true, tag: best.b.tag } : null;
  return { y: best.y, roof: false, tag: best.b.tag };
};
const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180);
const inArmStair = (x, z) => { const al = x * S65 + z * C65, off = -x * C65 + z * S65; return off > -6 && off < -3 && al > -39.4 && al < -32.6; };
const eyes = [], coverTops = [];
for (let x = -37; x <= -23.5; x += 0.5) for (let z = -37; z <= -16; z += 0.5) {
  if (!G.inPoly(LY.YARD, x, z) && !inArmStair(x, z)) continue;
  const t = topAt(x, z, true); if (!t) continue;
  if (/planter|bench|crate|mast/.test(t.tag)) { coverTops.push({ x, z, y: t.y, roof: t.roof, tag: t.tag }); continue; }
  if (t.roof) continue;
  eyes.push({ x, z, y: t.y });
}
// targets: Alpha's deck and terrace on a 1 m grid
const targets = [];
const deck = LY.P.deck;
for (let x = deck[0] + 0.5; x < deck[1]; x += 1) for (let z = deck[2] + 0.5; z < deck[3]; z += 1) targets.push({ x, z, y: 3.3 + 1.0, k: 'deck' });
for (let x = -26.5; x < 27; x += 1) for (let z = -63.5; z < -50; z += 1) { if (!G.inPoly(LY.TERRACE, x, z)) continue; targets.push({ x, z, y: 1.0 + 1.0, k: 'terrace' }); }
const O = new THREE.Vector3(), D = new THREE.Vector3();
const test = (srcs, h) => {
  const r = { deck: 0, terrace: 0, deck27: 0, terrace27: 0, nearest: { deck: Infinity, terrace: Infinity }, sample: null };
  for (const s of srcs) for (const t of targets) {
    O.set(M * s.x, s.y + h, M * s.z); D.set(M * t.x - O.x, t.y - O.y, M * t.z - O.z); const d = D.length(); D.divideScalar(d);
    phys.raycast(O, D, d - 0.05, hit, true);
    if (hit.hit) continue;
    r[t.k]++; if (d <= 27) r[t.k + '27']++; if (d < r.nearest[t.k]) { r.nearest[t.k] = +d.toFixed(1); if (!r.sample || d < r.sample.d) r.sample = { from: [M * s.x, +(s.y + h).toFixed(2), M * s.z], to: [M * t.x, t.y, M * t.z], d: +d.toFixed(1) }; }
  }
  return r;
};
// the baseline: the same targets from the street at Hoki Lane's north half and Prow Place (eye 1.45 over the street)
const street = [];
for (let x = -23.75; x <= -19.25; x += 0.5) for (let z = -33; z <= -18.75; z += 0.5) { const t = topAt(x, z, false); if (t && t.y < 0.3) street.push({ x, z, y: t.y }); else if (!t) street.push({ x, z, y: 0 }); }
const per = (srcs, h, maxD) => { // the share of targets within maxD that some source sees
  const seen = new Set(); for (const t of targets) for (const s of srcs) { O.set(M * s.x, s.y + h, M * s.z); D.set(M * t.x - O.x, t.y - O.y, M * t.z - O.z); const d = D.length(); if (d > maxD) continue; D.divideScalar(d); phys.raycast(O, D, d - 0.05, hit, true); if (!hit.hit) { seen.add(t.x + ',' + t.z); break; } }
  return seen; };
const sg = per(eyes, 1.45, 27), ss = per(street, 1.45, 27), newOnly = [...sg].filter((k) => !ss.has(k));
const out = {
  terraceDeckPointsSeenWithin27m: { fromGarden: sg.size, fromStreetHokiProw: ss.size, onlyFromGarden: newOnly.length, onlyFromGardenSample: newOnly.slice(0, 12) },
  era: process.env.ERA, side: M > 0 ? 'Alpha' : 'Bravo', standable: eyes.length, targets: targets.length,
  coverTops: { n: coverTops.length, standable: coverTops.filter((c) => !c.roof).length, tags: [...new Set(coverTops.map((c) => c.tag + (c.roof ? '(roof)' : '')))] },
  kidEye: test(eyes, 1.45), camera: test(eyes, 1.85),
  standableCoverTops: test(coverTops.filter((c) => !c.roof), 1.45),
};
console.log(JSON.stringify(out));
