// Stage modules page test (src/game/stageMods.js, docs/STAGE-MODS.md), on the test-only arena:
//   MAP=testbox PAGE=tools/botlab/tests/stage-mods.js tools/botlab/run.sh tools/botlab/page.cjs
// A dummy module registered only here (tests/stage-mods-dummy.js) goes through the whole lifecycle: the world build
// chain in order, a custom block kind and field, a level-material extension, a special nav edge that opens and closes on
// the stage clock, one moving collider, a noPlace disc, a liquid level, the match runtime's hooks, a clock snap (seek),
// the minimap layer, the HUD frame, a Practice-style snapshot / restore, the physics skip flag, and disposal on a stage
// swap. Plus: a stage with no module key has no stage world and no stage run (the twelve existing stages).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const { MAPS } = await import('./src/config.js');
  const { MAP_LAYOUTS } = await import('./src/world/maps.js');
  const { DRESSING } = await import('./src/world/dressing.js');
  const dress = DRESSING.testbox || (DRESSING.testbox = []);
  const { Hit } = await import('./src/game/physics.js');
  const D = await import('./tools/botlab/tests/stage-mods-dummy.js');
  const dbg = g.debug;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const waitPlaying = async () => { for (let i = 0; i < 240; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const restart = async (mapId) => {
    dbg.unfreeze?.();
    g.worldKey = null;   // (rebuild the world: the layout changed under the same id)
    await g.api.startMatch({ mapId, duration: 180, mode: 'turf' });
    const ok = await waitPlaying();
    dbg.freeze();
    for (const a of g.match.actors) if (a.bot) a.bot.update = () => {};
    for (const a of g.match.actors) { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
    return ok;
  };

  // ---- 0) the plain arena: no module key → no stage world, no stage run (every hook-in is one null check)
  R('a stage without a module key has no stage world and no stage run', __G.stageWorld === null && !g.match.stage && !__G.nav.ext && __G.nav.hScale === 1 && __G.nav.edgeMask === 0 && !__G.paint.blockGate && !__G.paint.clip,
    { sw: __G.stageWorld, stage: !!g.match.stage, ext: !!__G.nav.ext, hScale: __G.nav.hScale });
  const progKey0 = g.levelMat.customProgramCacheKey();

  // ---- 1) switch the module on and rebuild
  D.installDummy(MAP_LAYOUTS.testbox, dress);
  const started = await restart('testbox');
  const SW = __G.stageWorld, W = __G.dummyWorld, S = g.match.stage, Rn = g.match.dummymod;
  R('the layout key builds the module: G.stageWorld, match.stage, G.dummyWorld (worldAs), match.dummymod (matchAs)', started && SW && S && W && Rn && SW.keys.join() === 'dummymod' && S.run('dummymod') === Rn && SW.world('dummymod') === W,
    { started, keys: SW && SW.keys });
  if (!SW || !S || !W || !Rn) return out;
  const want = ['world', 'prop', 'colliders', 'extraColliders', 'attachLevel', 'attachPaint', 'levelMaterial', 'levelMaterial:grate', 'afterMeshes', 'navEdges', 'attachNav', 'attachMinimap', 'attachEnv', 'ready'];
  const seen = W.calls.filter((c) => want.includes(c));
  R('the world build calls every hook once, in order', JSON.stringify(seen) === JSON.stringify(want), { calls: W.calls });
  R('the match runtime was made after the world was ready, and ticks (update and lateUpdate)', Rn.calls[0] === 'match' && Rn.calls.includes('lateUpdate') && Rn.lastT !== undefined, { calls: Rn.calls });

  // ---- 2) level: block kind + field, the physics skip flag
  const L = __G.level;
  const kb = L.blocks.find((b) => b.dummyTag === 'extra'), fb = L.blocks.find((b) => b.dummyTag === 'piece');
  const hit = new Hit(), o = new THREE.Vector3(0, 1, -31), d = new THREE.Vector3(0, 0, -1);
  const h1 = __G.physics.raycast(o, d, 10, hit, false).hit && hit.block === kb?.id;
  __G.physics.skip = 'dummy';
  const h2 = __G.physics.raycast(o, d, 10, hit, false).hit && hit.block === kb?.id;
  __G.physics.skip = null;
  R('a custom block kind (from W.extraColliders) is solid; a block field rides a layout piece and a prop collider', kb && fb && kb.hidden && !kb.paint && Math.abs(kb.center.z + 36) < 1e-6 && h1, { kb: kb && kb.id, fb: fb && fb.id, h1 });
  R('physics.skip: a ray ignores blocks with that flag only while it is set', !h2 && __G.physics.skip === null, { h2 });
  // presence: a shared block's face pressed against a state-limited block stays; the state block's face against the
  // shared one is hidden (the shared block is there in every state it is)
  const sh = L.blocks.find((b) => b.dummyTag === 'shared'), s2 = L.blocks.find((b) => b.dummyTag === 'state2');
  R('presence: a shared face against a state-2-only block is kept; that block\'s face against the shared one is hidden', sh && s2 && L.presenceAll === 3 && s2.presence === 2 && sh.faces[0] >= 0 && s2.faces[1] < 0,
    { shared: sh && sh.faces, state2: s2 && s2.faces, all: L.presenceAll });
  // the dressing item W.prop tagged: its parts in their own bucket (material@dm, aTag = bucketVec), its colliders tagged
  const tagged = g.props?._meshes?.filter((m) => m.userData.tag === 'dm') || [];
  const at = tagged[0]?.geometry.getAttribute('aTag');
  const pb = L.blocks.filter((b) => b.dummyTag === 'prop');
  R('a prop W.prop tagged merges into its own bucket (name @dm, aTag = bucketVec); W.colliders tagged its colliders', tagged.length > 0 && tagged.every((m) => m.name.endsWith('@dm')) && at && at.getX(0) === 1 && at.getY(0) === 2 && pb.length > 0,
    { meshes: tagged.map((m) => m.name), colliders: pb.length });

  // ---- 3) the level material extension compiled (its key on the program) and the shared uniform object is the module's
  const k1 = g.levelMat.customProgramCacheKey();
  R('the level material carries the extension: program key + shared uniform', k1 === progKey0 + '-dummymod' && g.levelMat.userData.uniforms.uDummyK === W.uniforms.uDummyK, { k0: progKey0, k1 });

  // ---- 4) nav: the special edge, the heuristic scale, open / closed on the stage clock
  const nav = __G.nav, edges = [];
  for (const n of nav.nodes) for (const e of n.nb) if (e.type === 'dummy') edges.push([n.id, e.to, e.cost, e.key, e.len]);
  R('the special edge is in the graph (nearest nodes, its extra fields), none unresolved, hScale < 1', edges.length === 1 && edges[0][2] === 3 && edges[0][3] === 0 && edges[0][4] === 32 && nav.edgeProblems.length === 0 && nav.hScale < 1,
    { edges, problems: nav.edgeProblems.length, hScale: nav.hScale });
  const setT = (t) => { g.match.time = g.match.duration - t; step(1 / 60); };
  const [ea, eb] = edges[0] || [-1, -1];
  setT(3);
  const pOpen = nav.path(ea, eb, 0);
  setT(13);
  const pShut = nav.path(ea, eb, 0);
  R('the edge is taken while open (t 3: 2 nodes) and forbidden while shut (t 13: walks round)', pOpen && pOpen.length === 2 && pShut && pShut.length > 10, { open: pOpen && pOpen.length, shut: pShut && pShut.length, t: S.t });
  R('nav.ext is this match\'s rule while the module runs', !!nav.ext && typeof nav.ext.edge === 'function');

  // ---- 5) the moving collider follows the clock (a pure function of it)
  setT(7.5); step(0.2);
  const t1 = S.t, top1 = Rn.state().top;
  R('one moving collider: its top is a pure function of the stage clock', Math.abs(top1 - D.DUMMY.lift.top(t1)) < 0.02 && L.dyn.includes(Rn.block), { t: t1, top: top1, want: D.DUMMY.lift.top(t1) });

  // ---- 6) a clock snap → seek(t, 'clock')
  const nSeek = Rn.seeks.length;
  g.match.time = g.match.duration - (S.t + 6); step(1 / 60);
  R('a stage-clock snap (> 1 s) calls seek(t, \'clock\')', Rn.seeks.length > nSeek && Rn.seeks[Rn.seeks.length - 1][1] === 'clock', { seeks: Rn.seeks });

  // ---- 7) queries: noPlace, liquidY, under (and the sea elsewhere)
  const P = new THREE.Vector3();
  const np = [L.noPlace(P.set(8, 0, -12), 0), L.noPlace(P.set(8, 0, -9.5), 0), L.noPlace(P.set(8, 0, -9.5), 1)];
  R('G.level.noPlace: inside the disc, outside it, and a device radius reaching in', np[0] && !np[1] && np[2], { np });
  const tl = S.t, ly = L.liquidY(-21, 5), lo = L.liquidY(0, 0);
  R('G.level.liquidY: the module\'s surface in its region, the sea elsewhere', Math.abs(ly - D.DUMMY.pool.y(tl)) < 1e-6 && lo === -1.6, { ly, want: D.DUMMY.pool.y(tl), lo });
  R('match.stage.under: below the surface in the region only', S.under(P.set(-21, ly - 0.5, 5)) && !S.under(P.set(-21, ly + 0.5, 5)) && !S.under(P.set(0, -5, 0)));

  // ---- 8) the minimap layer, the HUD frame
  g.minimap.update(0.05, true);
  const drawn = Rn.drawn;
  step(0.1);
  R('the minimap live layer draws the module (drawMap)', drawn > 0 || Rn.drawn > 0, { drawn: Rn.drawn });
  Rn.n = 4;
  const fr = S.hud(g.match.local || g.match.actors[0]);
  R('frame.stage carries the module\'s own HUD object under its key', fr && fr.dummymod && fr.dummymod.n === 4, { fr });

  // ---- 9) records offline: bump makes no record without a NetMatch; snapshot / restore round-trip with seek('late')
  const ok = Rn.bump();
  const snap = S.netSnapshot();
  Rn.n = 0;
  S.netRestore(snap, snap.t + 2);
  R('netSnapshot / netRestore: the module\'s state and the clock come back, then seek(t, \'late\')', ok && snap.m && snap.m.dummymod && Rn.n === snap.m.dummymod.n && Math.abs(S.t - (snap.t + 2)) < 1e-6 && Rn.seeks[Rn.seeks.length - 1][1] === 'late',
    { snap, n: Rn.n, t: S.t });

  // ---- 10) bake mode reaches the world
  SW.bakeMode(true); SW.bakeMode(false);
  R('bakeMode(on / off) reaches the module world', W.calls.includes('bakeMode:true') && W.calls.includes('bakeMode:false'));

  // ---- 11) the runtime and the world go with the match and the stage
  D.removeDummy(MAP_LAYOUTS.testbox, dress);
  const back = await restart('testbox');
  R('a rebuild without the key disposes the module (world and run) and leaves no stage world, no nav rule, no extension', back && W.disposed && Rn.disposed && __G.stageWorld === null && !g.match.stage && !__G.nav.ext && !__G.dummyWorld && g.levelMat.customProgramCacheKey() === progKey0,
    { wd: W.disposed, rd: Rn.disposed, sw: __G.stageWorld, key: g.levelMat.customProgramCacheKey() });
  return out;
})();
