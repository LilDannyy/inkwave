// reviewer PRE (caldera art review 3): per shot {ink, tags}; with ink, every paintable side face of the blocks with those
// tags within 10 m of the shot's look point gets team ink splatted over it on a 0.5 m grid (both teams alternating), so the
// pair (no ink / ink) shows whether ink on those faces can be seen
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  const seq = JSON.parse(window.__preArgs || '[]'); const L = G.level; let n = 0; const log = [];
  const cin0 = g.rig.cinematic.bind(g.rig);
  g.rig.cinematic = (a, b, c, d, ...rest) => {
    const e = seq[n++] || {};
    try {
      if (g.match.lava) g.match.lava.hold('low');
      G.paint.clear();
      if (e.ink) { let put = 0, k = 0;
        for (const f of L.faces) { if (!f.paintable || !f.wall) continue; const b = L.blocks[f.block]; if (!e.tags.includes(b.tag)) continue;
          const cx = f.origin.x + f.u.x * f.su / 2 + f.v.x * f.sv / 2, cz = f.origin.z + f.u.z * f.su / 2 + f.v.z * f.sv / 2;
          if (Math.hypot(cx - c.x, cz - c.z) > 10) continue;
          for (let i = 0.25; i < f.su; i += 0.5) for (let j = 0.25; j < f.sv; j += 0.5) {
            const p = f.origin.clone().addScaledVector(f.u, i).addScaledVector(f.v, j).addScaledVector(f.n, 0.05);
            G.paint.splat(p, 0.45, (k++) & 1, { instant: true }); put++; } }
        log.push({ n, put }); }
    } catch (err) { log.push({ n, err: String(err) }); }
    window.__wallinkLog = log;
    return cin0(a, b, c, d, ...rest);
  };
  return { seq: seq.length };
})()
