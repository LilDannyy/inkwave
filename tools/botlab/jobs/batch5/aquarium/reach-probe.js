// Gulper Aquarium blockout: the barriers, proved physically. A kid is stepped on its own (actor.update, as
// tools/botlab/tests/treehills-pods.js does its way-round search) from every standable spot near each barrier, running
// in 8 headings and hopping at four moments; a leak = the kid ever stands (grounded) on what's beyond the barrier.
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/reach-probe.js tools/botlab/run.sh tools/botlab/page.cjs
// barriers: the penguin glass (the cove behind it: out of bounds), the plant room over the Kelp Balcony, the Feeding
// Deck's glass over the viewing steps and the court, the spawn deck's front over the plaza, the promenade's sea edge over
// Penguin Point (only the Penguin Steps join them), the Reef Window and the pylons.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = __G.level, THREE = await import('three');
  dbg.freeze();
  const r1 = (v) => Math.round(v * 10) / 10;
  for (const a of m.actors) if (a.bot) { a.bot._up0 = a.bot.update; a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; }; }
  const kid = m.actors.find((a) => a.bot && a.team === 0), it = kid.intent, dt = 1 / 60;
  for (const q of m.actors) if (q !== kid) { q.spawnAt(new THREE.Vector3(q.team ? -15.95 : 15.95, 3.4, q.team ? 60.13 : -60.13), 0); }
  const tagAt = () => (kid.grounded && kid.ground && L.blocks[kid.ground.block] ? L.blocks[kid.ground.block].tag : null);
  const C30 = Math.cos(Math.PI / 6), toBlade = (x, z) => { const dz = z + 32.5; return [0.5 * x - C30 * dz, C30 * x + 0.5 * dz]; };
  const W = (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w];
  const put = (p) => { kid.spawnAt(new THREE.Vector3(p[0], p[1] + 0.05, p[2]), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; it.move.set(0, 0, 0); it.jump = it.squid = it.fire = false; for (let i = 0; i < 3; i++) kid.update(dt); };
  const run = (p, dir, jumpAt, forbidden) => {
    put(p); if (!kid.alive) return null;
    let hit = null;
    for (let f = 0; f < 80; f++) {
      it.move.set(dir[0], 0, dir[1]); it.jump = jumpAt >= 0 && f >= jumpAt && f < jumpAt + 4;
      kid.update(dt); if (!kid.alive) break;
      const t = tagAt(); if (t && forbidden(t, kid.pos)) { hit = { tag: t, at: [r1(kid.pos.x), r1(kid.pos.y), r1(kid.pos.z)] }; break; }
    }
    it.jump = false; return hit;
  };
  const DIRS = Array.from({ length: 8 }, (_, k) => [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)]);
  const probe = (name, starts, forbidden) => {
    const leaks = []; let n = 0;
    for (const p of starts) for (const d of DIRS) for (const j of [-1, 2, 8, 16]) { n++; const h = run(p, d, j, forbidden); if (h) leaks.push({ from: p.map(r1), dir: d.map(r1), jumpAt: j, ...h }); }
    R(name, leaks.length === 0, { starts: starts.length, runs: n, leaks: leaks.slice(0, 6), nLeaks: leaks.length });
  };
  const floorAt = (x, z, yMax) => L.groundHeight(x, z, yMax);
  // standable starts only: a floor that isn't a roof or a rail (a roof top is no place to start from)
  const standable = (x, y, z) => { const ids = L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, []); return !ids.some((id) => { const b = L.blocks[id]; return (b.roof || b.rail) && L.pointInBlock(b, new THREE.Vector3(x, y - 0.02, z), 0.001); }); };
  const sample = (pts, yMax) => pts.map(([x, z]) => [x, floorAt(x, z, yMax), z]).filter((p) => p[1] > -1 && standable(...p));
  // 1. the penguin glass: starts within 1.5 m of its inner face along the whole blade; beyond it = the cove
  { const pts = []; for (let s = -12; s <= 27; s += 2.5) { const wg = s < -3 ? -17.0 : s < 10 ? -17.8 : s < 24 ? -17.0 : -16.6; for (const dw of [0.5, 1.4]) pts.push(W(s, wg + dw)); }
    probe('penguin glass: no way onto the cove', sample(pts, 3.0), (t) => t === 'cove' || t === 'penguin-glass'); }
  // 2. the plant room over the Kelp Balcony (both drums: the W one is on Alpha's promenade)
  { const pts = []; for (const sgn of [1, -1]) for (const b of [18, 30, 45, 60, 72]) for (const r of [5.0, 6.2]) { const a = b * Math.PI / 180; pts.push([sgn * (25 + r * Math.cos(a)), sgn * r * Math.sin(a)]); }
    probe('plant room: not reachable from the Kelp Balcony', sample(pts, 4.0), (t) => t === 'plant-room'); }
  // 3. the Feeding Deck from the viewing steps and the court beside the glass (not from the Feeding Steps' line or the
  //    ramp / stair mouths: those are the ways up)
  { const pts = []; for (const a of [-22.5, -67.5, -112.5, -157.5, 22.5, 67.5, 112.5, 157.5]) for (const r of [8.2, 9.6]) { const q = a * Math.PI / 180; pts.push([r * Math.cos(q), r * Math.sin(q)]); }
    probe('Feeding Deck: no way up from the viewing steps / the court beside the glass', sample(pts, 1.0), (t) => t === 'feeding-deck' || t === 'glass-walk' || t === 'deck-rim'); }
  // 4. the spawn deck from the plaza in front of its fascia (the drop is one-way)
  { const pts = []; for (const sgn of [1, -1]) for (let w = -11; w <= 11; w += 2.75) { const [x, z] = W(26.6, w); pts.push([sgn * x, sgn * z]); }
    probe('spawn deck: the front drop is one-way (no way up from the plaza)', sample(pts, 1.0), (t) => t === 'spawn-deck' || t === 'fascia' || t === 'deck-coping'); }
  // 5. the promenade from Penguin Point below its sea edge (the Penguin Steps are the way: starts ≥ 4 m from them)
  { const pts = []; for (const a of [-142, -138, -110.5]) for (const r of [32.0, 32.6, 33.2]) { const q = a * Math.PI / 180; pts.push([r * Math.cos(q), r * Math.sin(q)]); }
    probe('promenade: only the Penguin Steps join it to Penguin Point', sample(pts, 2.0).filter((p) => p[1] < 1.5), (t, pos) => t === 'promenade' || t === 'prom-coping'); }
  // 6. roofs that should never be stood on from the floor beside them: the Reef Window, the pylons, the kiosks, the stops
  { const pts = []; for (let a = -68; a <= -6; a += 4) { const q = a * Math.PI / 180; pts.push([29.6 * Math.cos(q), 29.6 * Math.sin(q)]); }
    pts.push([10.2, -27.0], [9.4, -22.0], [-6.8, -24.0], [-25.5, -21.0], [-21.0, -18.0]);
    probe('roofs: the Reef Window, the pylons, the kiosks and stops stay off-limits', sample(pts, 3.0),
      (t) => ['reef-window', 'pylon', 'kiosk', 'kelp-stop', 'kelp-stop-deep', 'express-stop-out', 'canopy', 'lamp-column'].includes(t)); }
  for (const a of m.actors) if (a.bot && a.bot._up0) a.bot.update = a.bot._up0;
  return out;
})()
