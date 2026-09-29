// Spirhalite Islands — stuck-spot probe (scratch). For each reported spot (and its mirror): the nav nodes there (height,
// spawn zone, valid / exitable, edges) and a plan to the centre for each team; then a mitts bot of each team is set down
// on the spot (the others frozen, no targets) and left to play 11 s: how far it gets, whether it had a path.
//   BOTLAB_OUT=… SLOTS=3 MAP=spirhalite MODE=turf PAGE=tools/botlab/jobs/new-stages/out/spirhalite/stuck-probe.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, G = window.__G, nav = G.nav, nodes = nav.nodes, THREE = await import('three');
  const SPOTS = window.__SPOTS || [[11.5, 3.1, -39.8], [5, 0.27, -42.6], [5.7, 0, -43], [12.4, 3.1, -39.6], [4.6, 3.1, -32.1], [4.6, 3.1, -39.9], [12.4, 3.1, -32.1], [8.5, 3.2, -41.1], [13.6, 3.2, -36]];
  const out = [], r1 = (v) => Math.round(v * 10) / 10;
  const cellIds = (x, z, rr) => { const res = []; for (const n of nodes) if (Math.hypot(n.x - x, n.z - z) <= rr) res.push(n.id); return res; };
  const tC = nav.nearest({ x: 0, y: 0, z: 0 }, 0.8);
  const all = [...SPOTS, ...SPOTS.map(([x, y, z]) => [-x, y, -z])];
  for (const [x, y, z] of all) {
    const ids = cellIds(x, z, 1.25).filter((k) => Math.abs(nodes[k].y - y) < 1.6);
    const info = ids.map((k) => { const n = nodes[k]; const ty = {}; for (const e of n.nb) { const m = nodes[e.to]; const key = e.type + (m.zone >= 0 ? 'Z' + m.zone : ''); ty[key] = (ty[key] || 0) + 1; }
      return `${n.x},${n.z}@${n.y.toFixed(2)} z${n.zone} v${nav.valid[k]} x${nav.exitable[k]} ${JSON.stringify(ty)}`; });
    const s = nav.nearest(new THREE.Vector3(x, y, z), 1.2, true);
    const plan = [0, 1].map((t) => { const p = s >= 0 ? nav.path(s, tC, t, 30000) : null; return p ? p.length : 'NONE'; });
    out.push({ name: `nodes at (${x}, ${y}, ${z})`, ok: true, info: { start: s >= 0 ? `${nodes[s].x},${nodes[s].z}@${nodes[s].y.toFixed(2)} z${nodes[s].zone}` : 'none', planLen: { team0: plan[0], team1: plan[1] }, nodes: info } });
  }
  // live: a mitts bot of each team set down on each spot
  g.debug.freeze();
  const acts = G.actors.filter((a) => a.bot);
  const saved = new Map(acts.map((a) => [a, a.bot.update]));
  for (const [x, y, z] of (window.__LIVE || SPOTS)) for (const team of [0, 1]) {   // (Alpha's half only: the match runs 180 s)
    const a = acts.find((q) => q.team === team);
    for (const o of acts) o.bot.update = o === a ? saved.get(o) : function () { this.a.intent.move.set(0, 0, 0); this.a.intent.fire = false; };
    a.setWeapon?.('mitts');
    a.pos.set(x, y + 0.05, z); a.vel.set(0, 0, 0); a.hp = 100; a.alive = true;
    const b = a.bot; b.path = null; b.goalTimer = 0; b.target = null; b.mode = 'paint';
    if (b._perceive) b._perceive = function () { this.target = null; };
    const p0 = a.pos.clone(); let far = 0, noPath = 0, t = 0, died = false;
    while (t < 11 && G.match.playing()) {
      for (let k = 0; k < 6; k++) { a.ink = 100; g.debug.step(1000 / 60); }
      t += 0.1;
      if (!a.alive) { died = true; break; }
      far = Math.max(far, Math.hypot(a.pos.x - p0.x, a.pos.z - p0.z));
      if (!b.path) noPath += 0.1;
    }
    out.push({ name: `live team ${team} at (${x}, ${y}, ${z})`, ok: far > 3 || died, info: { movedMax: r1(far), end: [r1(a.pos.x), r1(a.pos.y), r1(a.pos.z)], noPathSecs: r1(noPath), died, mode: b.mode } });
  }
  return out;
})()
