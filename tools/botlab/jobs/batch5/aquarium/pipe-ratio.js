// Gulper Aquarium, ENGINE.md rule 26 for every leg (fix round 1): door to door (L / v + 0.75 s: the 0.25 s suck and the
// ≈ 0.5 s pop, as DESIGN.md §3.1 counts it) against swimming the shortest walking
// route on the nav graph (no pipe edges) from the approach point to the landing point at 11.8 m/s. Pass: ≤ 1.0 (rule 26);
// DESIGN.md §6.2 also asks the Gulper, the Arch Line promenade-ward and the Express for ≤ 0.80
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/pipe-ratio.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav;
  const { PIPES, allLegs, endsOf, centreline } = await import('./src/world/stages/aquarium/tubeway.js');
  const node = (p) => { let b = -1, bd = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; const d = Math.hypot(n.x - p[0], n.z - p[2]) + 2 * Math.abs(n.y - p[1]); if (d < bd) { bd = d; b = i; } }); return b; };
  const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
  for (const leg of allLegs(PIPES)) {
    if (leg.twin) continue;
    const c = centreline(leg); let Lc = 0; for (let i = 1; i < c.length; i++) Lc += Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1], c[i][2] - c[i - 1][2]);
    const v = leg.speed || PIPES.speed, door = Lc / v + 0.75, E = endsOf(leg);
    const dirs = leg.way === 'one' ? [[0, 1]] : [[0, 1], [1, 0]];
    for (const [a, b] of dirs) {
      const p = nav.path(node(E[a].approach), node(E[b].land), 0, 400000);
      const walk = p ? plen(p) / 11.8 : null;
      R(`${leg.id} ${'AB'[a]}→${'AB'[b]}`, walk && door / walk <= 1.0, { len: +Lc.toFixed(1), doorS: +door.toFixed(2), walkS: walk && +walk.toFixed(2), ratio: walk && +(door / walk).toFixed(2) });
    }
  }
  return out;
})()
