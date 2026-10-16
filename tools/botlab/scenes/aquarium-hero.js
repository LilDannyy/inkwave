// Gulper Aquarium's stage-select hero shot with riders mid-ride (DESIGN.md §5.8; LEAD-REVIEW art rounds 1 and 2): a
// shoot.cjs PRE script (ACTORS=1 so the riders stay drawn; every other actor is hidden here). It sets stageart.cjs's
// palette (tangerine-cobalt), sends riders along Tubeway legs, freezes each part-way, and leaves the rest of the stage as
// stageart.cjs would (no paint, no fx). Each rider is held where it was put (its ride's speed ~0: shoot.cjs steps the
// match between pictures).
//   MAP=aquarium TIME=day MODE=turf ACTORS=1 W=3840 H=2160 PRE=tools/botlab/scenes/aquarium-hero.js SHOTS='art' tools/botlab/run.sh tools/botlab/shoot.cjs
// PRE_ARGS (optional): a JSON list of riders [[team, leg id, end k, metres along the leg], …] (or { plan, glow }); the
// default is the stage art's (layout.js art): a Bravo rider part-way up the west drum's Kelp Line — the drum nearest the
// camera, its riser on the near side, the squid dark against its lilac glow and the kelp — and an Alpha rider on the
// Line's open run over the Sea Promenade, the squid inside its glow. (The Gulper Run can't be shown through the Great
// Tank's side glass from this camera: from any camera that keeps GULPER AQUARIUM clear of the gantry's legs the gulper's
// bronze neck stands in front of the tube's west end, and under the deck the rim hides it)
(async () => {
  const g = window.__inkwave, M = g.match, P = M.pipes, dbg = g.debug;
  const { TEAM_PALETTES } = await import('./src/config.js'); const pal = TEAM_PALETTES.find((p) => p.id === 'tangerine-cobalt'); if (pal) g._setPalette(pal);
  dbg.freeze?.();
  let plan = [[1, 'kelp~', 0, 9.2], [0, 'kelp~', 0, 19.3]], glow = 1;
  try {
    const a = String(window.__preArgs || '').trim();
    if (a.startsWith('[')) plan = JSON.parse(a);
    else if (a.startsWith('{')) { const o = JSON.parse(a); plan = o.plan || plan; glow = o.glow ?? glow; }
  } catch (e) { /* the default */ }
  // (optional: the riders' tube glow scaled, as a rider's own screen dims it — pipes.js, 0.35 for the local rider)
  if (glow !== 1 && P.W.looks && !P.W.looks._heroGlow) { const L = P.W.looks, f = L.setRiders.bind(L); L._heroGlow = true; L.setRiders = (list) => f((list || []).map((r) => ({ ...r, on: r.on * glow }))); }
  for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'shot'); }
  __G.projectiles.clear(); __G.fx?.clear?.();
  const used = new Set(), done = [];
  // (a 'pop' entry [team, leg, k, 'pop', frames]: rides the last metres of the leg from end k and pops out of the far
  // mouth; the scene stops `frames` frames after the pop — shoot.cjs steps 5 more before its picture — so the squid is in
  // the air in front of the mouth, out of the tube's glow. Staged first: the others are held while it flies)
  plan.sort((x, y) => (y[3] === 'pop') - (x[3] === 'pop'));
  for (const [team, id, k, u, n] of plan) {
    const a = M.actors.find((x) => x.team === team && !used.has(x) && x !== M.local) || M.actors.find((x) => x.team === team && !used.has(x));
    const lg = P.legs.find((l) => l.id === id);
    if (!a || !lg) { done.push({ leg: id, ok: false }); continue; }
    used.add(a);
    const e = lg.ends[k];
    a.pos.set(e.approach[0], e.approach[1], e.approach[2]); a.vel.set(0, 0, 0);
    if (u === 'pop') {
      P._start(a, e, { u0: Math.max(0.01, (lg.len || 30) - 0.4) });
      for (let i = 0; i < 120 && a.pipe && a.pipe.phase !== 'pop'; i++) dbg.step(1000 / 60);
      for (let i = 0; i < (n ?? 6); i++) dbg.step(1000 / 60);
      done.push({ leg: lg.id, team, pop: true, a });
      continue;
    }
    P._start(a, e, { u0: u });   // (straight into the ride at u: every rider is where the plan says at the same moment)
    a.pipe.v = 1e-4;             // (held there: the pictures step the match, and a picture is of one moment)
    done.push({ leg: lg.id, team, a });
  }
  dbg.step(1000 / 60);
  for (const d of done) if (d.a) { const a = d.a; delete d.a; d.u = a.pipe ? +a.pipe.u.toFixed(2) : null; d.pos = a.pos.toArray().map((v) => +v.toFixed(2)); }
  for (const a of M.actors) { const show = used.has(a); a.character.setVisible(show); a.character.root.visible = show; }
  __G.projectiles.clear(); __G.paint.clear(); g.swimWake?.reset?.();
  return { legs: P.legs.map((l) => l.id), done };
})()
