// Gulper Aquarium's stage-select hero shot with riders mid-ride (DESIGN.md §5.8; LEAD-REVIEW art round 1): a shoot.cjs PRE
// script (ACTORS=1 so the riders stay drawn; every other actor is hidden here). It sets stageart.cjs's palette
// (tangerine-cobalt), sends an Alpha rider along the Gulper Run under the Glass Walk and a Bravo rider up the east drum's
// Kelp Line, freezes them part-way, and leaves the rest of the stage as stageart.cjs would (no paint, no fx).
//   MAP=aquarium TIME=day MODE=turf ACTORS=1 W=3840 H=2160 PRE=tools/botlab/scenes/aquarium-hero.js SHOTS='art' tools/botlab/run.sh tools/botlab/shoot.cjs
(async () => {
  const g = window.__inkwave, M = g.match, P = M.pipes, dbg = g.debug;
  const { TEAM_PALETTES } = await import('./src/config.js'); const pal = TEAM_PALETTES.find((p) => p.id === 'tangerine-cobalt'); if (pal) g._setPalette(pal);
  dbg.freeze?.();
  const legAt = (pred) => P.legs.find(pred);
  const gul = legAt((l) => l.id === 'gulper');
  // the east drum's Kelp Line (across the court from the camera): the kelp leg whose points sit round x +25
  const kelpW = legAt((l) => /kelp/.test(l.id) && l.pts && l.pts.some((p) => p[0] > 20));
  const riders = [M.actors.find((a) => a.team === 0 && a !== M.local) || M.actors.find((a) => a.team === 0), M.actors.find((a) => a.team === 1)];
  const plan = [[riders[0], gul, 0, 9.5], [riders[1], kelpW, 0, 5.5]];   // (u: metres along the leg)
  for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'shot'); }
  const done = [];
  for (const [a, lg, k, u] of plan) {
    if (!a || !lg) { done.push({ leg: lg?.id || null, ok: false }); continue; }
    const e = lg.ends[k];
    a.pos.set(e.approach[0], e.approach[1], e.approach[2]); a.vel.set(0, 0, 0);
    dbg.step(1000 / 60);
    P.debugRide(a, lg.id, k);
    for (let i = 0; i < 600 && a.pipe && !(a.pipe.phase === 'ride' && a.pipe.u >= u); i++) dbg.step(1000 / 60);
    done.push({ leg: lg.id, u: a.pipe ? +a.pipe.u.toFixed(2) : null, pos: a.pos.toArray().map((v) => +v.toFixed(1)) });
  }
  for (const a of M.actors) { const show = riders.includes(a); a.character.setVisible(show); a.character.root.visible = show; }
  __G.projectiles.clear(); __G.paint.clear(); __G.fx?.clear?.(); g.swimWake?.reset?.();
  return { legs: P.legs.map((l) => l.id), done };
})()
