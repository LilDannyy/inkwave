// Bluestone Junction — does the Halo dominate the 3000s? (DESIGN.md §6.2 #1; fix round 1, review issue 8)
//   ERA=3 MAP=bluestone MODE=zones PAGE=…/halo-dominance.js tools/botlab/run.sh tools/botlab/page.cjs   (and ERA=2)
// An all-bot Zone Control match stepped at 60 Hz in sim time (as match.cjs) on one era, locked (the blockout's era
// filter): the centre objective's hold time, every splat with where its attacker stood (on the Halo: y > 4.8 and 11 m
// < r < 15.5 m; high: y > 4.8 anywhere within 22 m of the centre), and the bot-seconds spent on the Halo. Compare era 3
// with era 2 (no Halo) — a Halo that dominates shows as most of the centre's splats coming from it.
(async () => {
  const g = window.__inkwave, m = g.match, Z = m.zones, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  if (!Z) { R('a Zone Control match', false, { mode: m.mode }); return out; }
  const { on } = await import('./src/core/ctx.js');
  g.debug.freeze();
  const halo = (p) => p && p.y > 4.8 && Math.hypot(p.x, p.z) > 11 && Math.hypot(p.x, p.z) < 15.5;
  const high = (p) => p && p.y > 4.8 && Math.hypot(p.x, p.z) < 22;
  const S = { splats: 0, byHalo: 0, byHigh: 0, atCentre: 0, atCentreByHalo: 0, victimsOnHalo: 0 };
  const off = on('splatted', (e) => {
    const a = e.attacker, v = e.victim; if (!v) return;
    S.splats++;
    const ap = a && a !== v ? a.pos : null, centre = Math.hypot(v.pos.x, v.pos.z) < 12;
    if (halo(ap)) S.byHalo++; if (high(ap)) S.byHigh++;
    if (centre) { S.atCentre++; if (halo(ap)) S.atCentreByHalo++; }
    if (halo(v.pos)) S.victimsOnHalo++;
  });
  const DT = 1 / 60, CH = 15; let t = 0, onHalo = 0, centreLive = 0; const held = [0, 0], heldCentre = [0, 0];
  while (m.state === 'playing' && t < 620) {
    for (let k = 0; k < CH; k++) { g._skipRender = true; try { g._frame(DT); } catch (e) { /* counted by match.cjs elsewhere */ } }
    g._skipRender = false; t += CH * DT;
    if (m.state !== 'playing') break;
    if (Z.owner >= 0) held[Z.owner] += 0.25;
    if (Z.active === Z.objectives[0]) { centreLive += 0.25; if (Z.owner >= 0) heldCentre[Z.owner] += 0.25; }
    for (const a of m.actors) if (a.alive && halo(a.pos)) onHalo += 0.25;
  }
  off && off();
  R('the match ran', t > 100, { simS: +t.toFixed(1), state: m.state });
  R('the Halo report', true, { era: new URLSearchParams(location.search).get('era'), centreLive_s: centreLive, heldCentre_s: heldCentre, held_s: held,
    splats: S.splats, byHalo: S.byHalo, byHigh: S.byHigh, centreSplats: S.atCentre, centreSplatsByHalo: S.atCentreByHalo, victimsOnHalo: S.victimsOnHalo,
    botSecondsOnHalo: onHalo, haloShareOfCentreSplats: S.atCentre ? +(S.atCentreByHalo / S.atCentre).toFixed(2) : 0 });
  return out;
})();
