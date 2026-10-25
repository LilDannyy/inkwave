// reviewer PRE for shoot.cjs (caldera art review 1): a per-shot schedule (PRE_ARGS = JSON [{pal, lava, ink}…], one per
// shot in order). Each shot's g.rig.cinematic call first applies its entry: the palette, the lava held at its level, the
// paint cleared, and (ink: true) team ink splatted on the dry ground in a ring 1.5–5 m round the shot's look point
// (alternating teams), so the pair (ink false / true) of one camera differs only by the ink.
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three');
  const { TEAM_PALETTES } = await import('./src/config.js');
  const seq = JSON.parse(window.__preArgs || '[]');
  const L = G.level; let n = 0; const log = [];
  const cin0 = g.rig.cinematic.bind(g.rig);
  g.rig.cinematic = (a, b, c, d, ...rest) => {
    const e = seq[n++] || {};
    try {
      const p = TEAM_PALETTES.find((q) => q.id === e.pal); if (p) g._setPalette(p);
      if (e.lava && g.match.lava) g.match.lava.hold(e.lava);
      G.paint.clear();
      if (e.ink) {
        const ly = g.match.lava ? g.match.lava.y : -99; let k = 0, put = 0;
        for (const r of [1.6, 3.2, 4.8]) for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + r, x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r;
          const gy = L.groundHeight(x, z);
          if (!(gy > ly + 0.15) || Math.abs(gy - c.y) > 2.5) continue;
          G.paint.splat(new THREE.Vector3(x, gy + 0.05, z), 1.5, (k++) & 1, { instant: true }); put++;
        }
        log.push({ n, put });
      }
    } catch (err) { log.push({ n, err: String(err) }); }
    return cin0(a, b, c, d, ...rest);
  };
  return { seq: seq.length };
})()
