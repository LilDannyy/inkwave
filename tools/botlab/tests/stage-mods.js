// Stage modules page test (src/game/stageMods.js, docs/STAGE-MODS.md), on the test-only arena:
//   MAP=testbox PAGE=tools/botlab/tests/stage-mods.js tools/botlab/run.sh tools/botlab/page.cjs
// A dummy module registered only here (tests/stage-mods-dummy.js) goes through the whole lifecycle: the world build
// chain in order, a custom block kind and field, a level-material extension, a special nav edge that opens and closes on
// the stage clock, one moving collider, a noPlace disc, a liquid level, the match runtime's hooks, a clock snap (seek),
// the minimap layer, the HUD frame, a Practice-style snapshot / restore, the physics skip flag, and disposal on a stage
// swap; every level-material slot at its anchor, the minimap's per-state bases, a nav rule's cost on climb edges, the
// environment (a backdrop set with instances, a theme overlay, env.sea, addSurface) and the bake passes. Plus: a stage
// with no module key has no stage world and no stage run (the twelve existing stages).
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

  // ---- 1b) the environment: a backdrop set with instances (hidden until a module shows it), the module's theme overlay,
  // env.sea false (no sea mesh), a surface of the module's own (addSurface)
  const env = __G.env, set = env.stageSets && env.stageSets.d1;
  const inst = set ? set.children.filter((c) => c.isInstancedMesh) : [];
  const ovl = env._stageTheme('day').dummyMark;
  R('environment: a backdrop set (out.sets) with its instances, hidden; the theme overlay layers in; env.sea false hides the sea; addSurface',
    set && !set.visible && inst.length === 1 && inst[0].count === 2 && ovl === 'day' && env.sea && env.sea.visible === false && W.surface && W.surface.parent === env.root,
    { set: !!set, inst: inst.length, overlay: ovl, sea: env.sea && env.sea.visible, surface: !!(W.surface && W.surface.parent === env.root) });

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
  // every slot lands at its anchor, exactly once (the dummy's marker comments): a missed anchor would drop a chunk silently
  const shd = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: {} };
  g.levelMat.onBeforeCompile(shd, __G.renderer);
  const VS = shd.vertexShader, FS = shd.fragmentShader, vMain = VS.indexOf('void main()'), fMain = FS.indexOf('void main()');
  const slotAt = (src, k, ok) => { const m = '/*SM:' + k + '*/'; return src.split(m).length === 2 && ok(src.indexOf(m)); };
  const slots = {
    vertPars: slotAt(VS, 'vertPars', (i) => i < vMain && i > VS.indexOf('varying vec3 vWNorm;')),
    vertMain: slotAt(VS, 'vertMain', (i) => i > vMain && i > VS.indexOf('#include <project_vertex>')),
    fragPars: slotAt(FS, 'fragPars', (i) => i < fMain),
    fragBase: slotAt(FS, 'fragBase', (i) => i > FS.indexOf('gBaseRough = rough;') && i < FS.indexOf('// ---- wet ink (src/world/inkShading.js) ----')),
    fragMural: slotAt(FS, 'fragMural', (i) => i > FS.indexOf('vec4 mc = texture2D(uMural, muv);') && i < FS.indexOf('base = mix(base, mc.rgb')),
    fragEmissive: slotAt(FS, 'fragEmissive', (i) => i > FS.indexOf('#include <emissivemap_fragment>') && i < FS.indexOf('#include <lights_physical_fragment>')),
    fragFinal: slotAt(FS, 'fragFinal', (i) => i > FS.indexOf('#include <lights_fragment_end>') && i < FS.indexOf('outgoingLight = min(outgoingLight, vec3(5.0));')),
    aoSample: slotAt(FS, 'aoSample', (i) => FS.lastIndexOf('float bao = mix(1.0, (', i) > FS.indexOf('#include <aomap_fragment>')),
  };
  R('every level-material slot (vertPars, vertMain, fragPars, fragBase, fragMural, fragEmissive, fragFinal, aoSample) lands at its anchor, once', Object.values(slots).every(Boolean), slots);

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
  // a rule's extra cost holds on climb edges too (the lava's soft cost on a climb into a floor it will cover)
  let ce = null;
  for (let i = 0; i < nav.nodes.length && !ce; i++) {
    if (!nav.valid[i] || nav.nodes[i].zone >= 0) continue;
    for (const e of nav.nodes[i].nb) if (e.type === 'climb' && nav.valid[e.to] && !(nav.nodes[e.to].zone >= 0)) { ce = [i, e.to]; break; }
  }
  const gTo = (x) => { Rn.climbX = x; const p = ce ? nav.path(ce[0], ce[1], 0) : null; Rn.climbX = 0; return p ? +nav._g[ce[1]].toFixed(2) : null; };
  const gc0 = gTo(0), gc1 = gTo(25);
  R('a nav rule\'s extra cost holds on a climb edge (the climb rule adds to it, never replaces it)', ce && gc0 !== null && gc1 !== null && gc1 > gc0 + 1, { ce, gc0, gc1 });

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
  const np = [L.noPlace(P.set(8, 0, -12), 0), L.noPlace(P.set(8, 0, -9.5), 0), L.noPlace(P.set(8, 0, -9.5), 1), L.noPlace(P.set(-8, 0, -12), 0), L.noPlace(P.set(-8, 0, -9), 0)];
  R('G.level.noPlace: inside the world\'s disc, outside it, a device radius reaching in; the match runtime\'s own disc (R.noPlace) too', np[0] && !np[1] && np[2] && np[3] && !np[4], { np });
  const tl = S.t, ly = L.liquidY(-21, 5), lo = L.liquidY(0, 0);
  R('G.level.liquidY: the module\'s surface in its region, the sea elsewhere', Math.abs(ly - D.DUMMY.pool.y(tl)) < 1e-6 && lo === -1.6, { ly, want: D.DUMMY.pool.y(tl), lo });
  R('match.stage.under: below the surface in the region only', S.under(P.set(-21, ly - 0.5, 5)) && !S.under(P.set(-21, ly + 0.5, 5)) && !S.under(P.set(0, -5, 0)));

  // ---- 7b) actor hooks (this screen's own): a carried actor's body, damage, super jump, anchor; the camera override;
  // a kill in the module's hazard (its cause on the splat card); wet floor for bots and shoves; sink + fizzle
  const me = g.match.local || g.match.actors[0];
  me.pos.set(0, 0.05, -20); me.vel.set(0, 0, 0); step(0.2);
  Rn.ride.add(me);
  const x0 = me.pos.x, hp0 = me.hp;
  step(0.5);
  const moved = me.pos.x - x0, dmg = me.damage(40, g.match.actors.find((o) => o.team !== me.team) || null);
  const sj = me.canSuperJump(), anc = me.jumpAnchor();
  const camN = Rn.camN;
  R('a carried actor: the module owns its body (moved by it), no damage, no super jump, teammates land at its anchor', moved > 0.8 && moved < 1.2 && dmg === false && me.hp === hp0 && !sj && anc === Rn.anchor,
    { moved: +moved.toFixed(3), dmg, hp: [hp0, me.hp], sj });
  R('the camera override runs for the carried actor (cam + camAfter) and the probe\'s skip flag is cleared after', (camN > 0 && Rn.camAfterN > 0 && __G.physics.skip === null) || g.rig.target !== me,
    { camN, after: Rn.camAfterN, target: g.rig.target === me });
  Rn.ride.clear();
  const { splatCause } = await import('./src/ui/hud.js');
  let cause = null; const off = (await import('./src/core/ctx.js')).on('splatted', (e) => { if (e.victim === me) cause = e.cause; });
  me.pos.set(-21, 0.05, 5); me.vel.set(0, 0, 0); step(0.1);
  off();
  const sc = splatCause('dummy', null);
  R('a kill in the module\'s hazard (R.kill before the sea check) splats with its cause; the splat card names it', !me.alive && cause === 'dummy' && Rn.kills > 0 && sc && sc.name === 'Fell in the dummy pool',
    { alive: me.alive, cause, kills: Rn.kills, card: sc && sc.name });
  const { floorFor } = await import('./src/game/stageKit.js');
  const bot = g.match.actors.find((o) => o.bot && o !== me);
  const wetIn = bot ? bot.bot._wet(-21, 5, 0) : null, wetOut = bot ? bot.bot._wet(0, 5, 0) : null;
  const kid = { pos: new THREE.Vector3(-10, 0.05, 5), form: 'kid' };   // (a kid on the deck beside the pool)
  const ff = [floorFor(kid, -21, 5), floorFor(kid, 0, 5)];
  R('wet floor: a bot reads the module\'s hazard floor as wet (and dry elsewhere); shoves never put anyone there', wetIn === true && wetOut === false && ff && !ff[0] && ff[1], { wetIn, wetOut, ff });
  const sk = [S.sink(P.set(-21, 0.05, 5), 'test'), S.sink(P.set(0, 0.05, 5), 'test')];
  R('sink(): true (and fizzle) inside the hazard, false elsewhere', sk[0] && !sk[1] && Rn.fizzles.includes('test'), { sk, fizzles: Rn.fizzles });

  // ---- 8) the minimap layer, the HUD frame
  g.minimap.update(0.05, true);
  const drawn = Rn.drawn;
  step(0.1);
  R('the minimap live layer draws the module (drawMap)', drawn > 0 || Rn.drawn > 0, { drawn: Rn.drawn });
  // the base raster: W.mapBlock leaves a block out (and a non-solid block stays out); setBase keeps one base per state
  const mm = g.minimap; mm.ensure();
  const pix = (x, z) => { const t = mm.toCanvas(x, z, { x: 0, y: 0 }); return mm.topBlock[Math.floor(t.y) * mm.w + Math.floor(t.x)]; };
  const mb0 = { extra: pix(0, -36), shared: pix(21, 21), s2: pix(23, 21) };
  s2.solid = false; mm.setBase('s2off'); const mb1 = { s2: pix(23, 21), shared: pix(21, 21) }; s2.solid = true;
  mm.setBase('noShared', (b) => b.solid && b.dummyTag !== 'shared'); const mb2 = { shared: pix(21, 21), s2: pix(23, 21) }, base2 = mm.base;
  mm.setBase('s2off'); const mb3 = pix(23, 21);
  mm.setBase('noShared'); const same = mm.base === base2;
  mm.setBase('all');   // (every solid block again, for what follows)
  R('minimap base: W.mapBlock leaves the custom block out, a non-solid block stays out, setBase(key, present) builds a base per state and swaps back to the cached one',
    kb && mb0.extra !== kb.id && mb0.shared === sh.id && mb0.s2 === s2.id && mb1.s2 !== s2.id && mb1.shared === sh.id && mb2.shared !== sh.id && mb2.s2 === s2.id && mb3 !== s2.id && same,
    { mb0, mb1, mb2, mb3, same, ids: { extra: kb && kb.id, shared: sh && sh.id, s2: s2 && s2.id } });
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
  const ps = SW.bakePasses();
  if (ps) for (const p of ps) p();
  R('bakePasses: the module\'s world states for a per-state lightmap (one channel each, at most 3)', ps && ps.length === 2 && W.calls.includes('pass:1') && W.calls.includes('pass:2'), { n: ps && ps.length });

  // ---- 11) the runtime and the world go with the match and the stage
  D.removeDummy(MAP_LAYOUTS.testbox, dress);
  const back = await restart('testbox');
  R('a rebuild without the key disposes the module (world and run) and leaves no stage world, no nav rule, no extension', back && W.disposed && Rn.disposed && __G.stageWorld === null && !g.match.stage && !__G.nav.ext && !__G.dummyWorld && g.levelMat.customProgramCacheKey() === progKey0,
    { wd: W.disposed, rd: Rn.disposed, sw: __G.stageWorld, key: g.levelMat.customProgramCacheKey() });
  const E2 = __G.env;
  R('…and its environment pieces go with it: the theme overlay cleared, the sea back, its surface and its backdrop set gone',
    E2.themeOverlay === null && E2.sea && E2.sea.visible === true && !W.surface.parent && !(E2.stageSets && E2.stageSets.d1) && E2._stageTheme('day').dummyMark === undefined,
    { overlay: E2.themeOverlay, sea: E2.sea && E2.sea.visible, surface: !!W.surface.parent, set: !!(E2.stageSets && E2.stageSets.d1) });
  return out;
})();
