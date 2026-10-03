// Gulper Aquarium: print the nav path from Alpha's pad to mid (and a few probes) — a debugging aid for the blockout.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav;
  const pad = L.spawnPads[0];
  let goal = -1, by = Infinity;
  nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; if (Math.hypot(n.x, n.z) > 2) return; if (n.y < by) { by = n.y; goal = i; } });
  const a = nav.nearest({ x: pad.x, y: pad.y + 0.5, z: pad.z }, 0.8, true);
  const p = nav.path(a, goal, 0, 200000);
  const steps = [];
  let len = 0;
  for (let i = 1; i < p.length; i++) {
    const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]], e = u.nb.find((q) => q.to === p[i]);
    len += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z);
    if (i % 4 === 0 || (e && e.type !== 'walk')) steps.push(`${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}${e && e.type !== 'walk' ? ':' + e.type : ''}`);
  }
  R('path', true, { len: +len.toFixed(1), n: p.length, steps: steps.join(' ') });
  // edges leaving the spawn deck (drop off the front?)
  const deck = []; nav.nodes.forEach((n, i) => { if (Math.abs(n.y - 3.4) < 0.05 && Math.hypot(n.x - pad.x, n.z - pad.z) < 14) for (const e of n.nb) { const m = nav.nodes[e.to]; if (m.y < 3.0) deck.push(`${n.x},${n.z}->${m.x.toFixed(1)},${m.y.toFixed(1)},${m.z}:${e.type}`); } });
  R('deck exits', true, { n: deck.length, sample: deck.slice(0, 30) });
  return out;
})()
