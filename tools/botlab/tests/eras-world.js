// Bluestone Junction's era engine — the world (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md §6 steps 1–4), on the
// stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-world.js tools/botlab/run.sh tools/botlab/page.cjs   (PAGE_ARGS='only=2,3')
// Part 1, the data and the Level: presence (a face pressed against a block of another era keeps its faces and bevels;
//   its cells live only in the eras nothing buries them), groups keyed per half (mirrored twins separate, equal r_g, the
//   same groups as the layout's plan), the aEra attribute on every vertex.
// Part 2, paint: turf totals and counts per era (and mid-jump) equal a brute-force recount; a splat on an absent piece
//   claims nothing; a vanishing piece takes its ink (its cells stop counting at its flip, grid and atlas zeroed at
//   done + 1 s); an appearing piece arrives blank (cleared at the warning); ground in both eras keeps its ink.
// Part 3, nav: the union graph in era e costs the same as a fresh graph built in era e (200 random pairs per era, ±1 %);
//   a route shut in era 1 and open in era 2; nodes of a later era valid only there; the merge time.
// Part 4, load: the world build with and without the era engine (loadMs), nav ×3 (ENGINE.md step 4: 4b if > 700 ms).
// Part 5 (PAGE_ARGS='only=5'), the other stages: halyard, calamari and treehills build with no era world, their level
//   program key and geometry are today's (no '-eras', no aEra attribute), and no block carries a presence.
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const { Level } = await import('./src/world/level.js');
  const { NavGraph } = await import('./src/game/nav.js');
  const D = await import('./src/world/eras-data.js');
  const only = (/only=([\d,]+)/.exec(String(window.__pageArgs || ''))?.[1] || '1,2,3,4').split(',').map(Number);
  const dbg = g.debug;
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const W = __G.eraWorld, E = g.match.eras, L = __G.level, P = __G.paint;
  if (!W || !E) { R('the era engine runs on bluestone (G.eraWorld, match.eras)', false, { W: !!W, E: !!E }); return out; }
  const p = new THREE.Vector3();
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const cellsOf = (bid) => { const ks = []; for (const fid of L.blocks[bid].faces) { if (fid < 0) continue; const f = L.faces[fid]; if (!f.atlas) continue; for (let k = f.grid; k < f.grid + f.nu * f.nv; k++) ks.push(k); } return ks; };
  const inked = (ks) => ks.reduce((s, k) => s + (P.grid[k] ? 1 : 0), 0);
  // one pixel of the paint atlas at a face's centre (its alpha: ink there)
  const atlasAt = (fid) => {
    const f = L.faces[fid], a = f.atlas, x = Math.round(a.x + a.pad + (f.su / 2) * a.ppm), y = Math.round(a.y + a.pad + (f.sv / 2) * a.ppm);
    const rt = P.rt, T = rt.texture.type, buf = T === THREE.UnsignedByteType ? new Uint8Array(4) : T === THREE.HalfFloatType ? new Uint16Array(4) : new Float32Array(4);
    __G.renderer.readRenderTargetPixels(rt, x, y, 1, 1, buf);
    return T === THREE.HalfFloatType ? THREE.DataUtils.fromHalfFloat(buf[3]) : T === THREE.UnsignedByteType ? buf[3] / 255 : buf[3];
  };
  const brute = () => {
    let tt = 0; const c = [0, 0];
    for (const f of P.paintFaces) {
      if (!f.turf) continue;
      const fb = L.blocks[f.block];
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) {
        if (!fb.solid) continue;
        p.copy(f.origin).addScaledVector(f.u, (i + 0.5) * f.cu).addScaledVector(f.v, (j + 0.5) * f.cv).addScaledVector(f.n, 0.06);
        if (L.pointInside(p, 0, f.block)) continue;
        const k = f.grid + j * f.nu + i;
        tt++; if (P.grid[k]) c[P.grid[k] - 1]++;
      }
    }
    return { tt, c };
  };
  const tag = (t) => L.blocks.filter((b) => b.tag === t);

  // ================================================================================================ part 1
  if (only.includes(1)) {
    // a toy level: a shared block with an era-3 block pressed against its +x face
    const toy = (eras) => new Level({ bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, spawnPads: [[0, 1, -8], [0, 1, 8]], spawnBarrier: 2, half: [],
      single: [{ kind: 'box', min: [-2, 0, -2], max: [0, 2, 2], color: '#888888' }, { kind: 'box', min: [0, 0, -2], max: [2, 2, 2], color: '#888888', ...(eras ? { eras, eraGroup: 't' } : {}) }] });
    const T3 = toy('3'), T0 = toy(null);
    const tris = (lv) => { lv.buildGeometry(1024, (b) => b.id === 0); return lv.renderTris; };
    R('step 1: a shared face pressed against an era-3 block exists (and its edge is bevelled); the era block\'s own face against the shared one is hidden; untagged, both are hidden',
      T3.blocks[0].faces[0] >= 0 && T3.blocks[1].faces[1] < 0 && T0.blocks[0].faces[0] < 0 && T3.presenceAll === 7 && T3.blocks[1].presence === 4 && tris(T3) > tris(T0),
      { tagged: [T3.blocks[0].faces[0], T3.blocks[1].faces[1]], untagged: T0.blocks[0].faces[0], tris: [tris(T3), tris(T0)] });
    // on the stage: cells live in eras 1–2 and dead in 3 (a shared face an era-3 piece buries), and the reverse
    const by = {}; for (let k = 0; k < W.cellPres.length; k++) by[W.cellPres[k]] = (by[W.cellPres[k]] || 0) + 1;
    let k3 = -1; for (let k = 0; k < W.cellPres.length && k3 < 0; k++) if (W.cellPres[k] === 3 && W.relOf[k] >= 0 && !L.blocks[W.rFace[W.relOf[k]]].presence) k3 = k;
    const liveIn = []; for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); liveIn.push(1 - P.dead[k3]); }
    const f3 = P._faceOfCell(k3);
    R('step 1: a cell of a shared face that an era-3 piece presses against is alive in eras 1–2 and dead in era 3 (cellPres per era)', k3 >= 0 && liveIn.join('') === '110',
      { cell: k3, face: f3 && { block: L.blocks[f3.block].tag, y: +f3.origin.y.toFixed(2) }, liveIn, presCounts: by });
    E.debugJump(1, { instant: true });
    // groups
    const plan = D.eraGroups(D.eraPieces(L.layout));
    const keys = W.groups.map((q) => q.key).sort(), pkeys = [...plan.keys()].sort();
    let twinBad = 0, planDiff = 0, sideBad = 0;
    for (const q of W.groups) {
      const tw = W.groups.find((x) => x.key === q.key.slice(0, -2) + (q.key.endsWith(':a') ? ':b' : ':a'));
      if (!tw || Math.abs(tw.rg - q.rg) > 1e-6 || Math.abs(tw.cx + q.cx) > 1e-6 || Math.abs(tw.cz + q.cz) > 1e-6) twinBad++;
      const pg = plan.get(q.key); if (pg) planDiff = Math.max(planDiff, Math.abs(pg.rg - q.rg));
      for (const id of q.blocks) if (Math.sign(L.blocks[id].center.z) !== (q.key.endsWith(':a') ? -1 : 1)) sideBad++;
    }
    R('step 1: era groups keyed per half (52), every group\'s mirrored twin a separate group with the same r_g from Tartar at (0, 0); the same keys as the layout\'s plan (eras-data.js)',
      W.groups.length === 52 && JSON.stringify(keys) === JSON.stringify(pkeys) && twinBad === 0 && sideBad === 0,
      { groups: W.groups.length, twinBad, sideBad, maxRgDiffVsPlan: +planDiff.toFixed(3), rg: W.groups.filter((q) => q.key.endsWith(':a')).map((q) => `${q.key} ${q.rg.toFixed(1)}`) });
    R('step 1: every era block has its presence from its tag (b.presence = mask, shared blocks 0) and its group\'s r_g (b.eraR)',
      W.eraIds.length === 156 && W.eraIds.every((id) => { const b = L.blocks[id]; return b.presence === b.eras && b.eraG >= 0 && b.eraR === W.groups[b.eraG].rg; }) && L.blocks.filter((b) => !b.presence).every((b) => b.eraG === -1),
      { eraBlocks: W.eraIds.length, all: L.blocks.length, reach: +W.reach.toFixed(2), doneOff: +W.doneOff.toFixed(3) });
    // the aEra attribute
    const attrOk = W.meshes.every((m) => { const A = m.geometry.getAttribute('aEra'); if (!A) return false; for (let i = 0; i < A.count; i += 7) if (A.getX(i) !== m.userData.eraMask) return false; return true; });
    const main = g.levelMesh.geometry.getAttribute('aEra');
    let main7 = !!main; if (main) for (let i = 0; i < main.count; i += 11) if (main.getX(i) !== 7) { main7 = false; break; }
    R('step 1: aEra = (mask, r_g) on every vertex: each era mesh carries its own mask, the shared mesh 7; one mesh per mask present (1, 3, 4, 6)',
      attrOk && main7 && W.meshes.map((m) => m.userData.eraMask).join(',') === '1,3,4,6', { meshes: W.meshes.map((m) => [m.name, m.geometry.index.count / 3]) });
  }

  // ================================================================================================ part 2
  if (only.includes(2)) {
    E.debugJump(1, { instant: true });
    P.clear();
    // ink all over the stage (both teams), then recount per era
    const nodes = __G.nav.nodes;
    for (let i = 0; i < 500; i++) { const n = nodes[(rnd() * nodes.length) | 0]; P.splat(new THREE.Vector3(n.x, n.y + 0.4, n.z), 1.2 + rnd() * 1.5, i & 1, { instant: true, seed: rnd() }); }
    const per = [];
    for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); const b = brute(); per.push({ e, turf: P.turfTotal, brute: b.tt, counts: [...P.counts], bc: b.c }); }
    R('step 2: per era, turfTotal and counts equal a brute-force recount (every turf cell of a present face, not buried by a present block)',
      per.every((x) => x.turf === x.brute && x.counts[0] === x.bc[0] && x.counts[1] === x.bc[1]) && per[0].turf !== per[2].turf, per);
    // the turf rules (ENGINE §5 rules 11–13; D.turfRules, which eras-static.mjs shows failing on planted numbers) on the
    // live grid: each era's turf area (P.turfArea after apply) and the turf live in a jump's era before and gone after
    {
      const area = [];
      for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); area.push(P.turfArea); }
      const gone = { '1>2': 0, '2>3': 0 }, cellA = [0, 0, 0];
      for (let k = 0; k < W.cellPres.length; k++) {
        if (!W.cellTurf[k]) continue;
        const pr = W.cellPres[k], a = W.cellArea[k];
        for (const e of [1, 2, 3]) if (pr & (1 << (e - 1))) cellA[e - 1] += a;
        if (pr & 1 && !(pr & 2)) gone['1>2'] += a;
        if (pr & 2 && !(pr & 4)) gone['2>3'] += a;
      }
      const probs = D.turfRules(area, gone), pc = (x) => +(x * 100).toFixed(1);
      R('step 2 (review fix 3): the turf rules hold on the live grid — era 2 within ±10 % of era 1 (rule 11), era 3 ≥ era 2 and ≤ 1.25 × era 2 (12), the turf vanishing in one jump ≤ 8 % of that era\'s (13)',
        probs.length === 0 && area.every((a, i) => Math.abs(a - cellA[i]) < 1), { areaM2: area.map((a) => Math.round(a)), era2vs1: pc(area[1] / area[0] - 1) + ' %', era3vs2: pc(area[2] / area[1] - 1) + ' %',
          goneM2: Object.fromEntries(Object.entries(gone).map(([k, v]) => [k, Math.round(v)])), gonePct: [pc(gone['1>2'] / area[0]) + ' %', pc(gone['2>3'] / area[1]) + ' %'], probs });
      E.debugJump(1, { instant: true });
    }
    // mid-jump (some groups flipped, some not): the incremental bookkeeping still equals the recount
    E.debugJump(2, { instant: true });
    const n0 = E.stats.flips, j = E.debugJump(3, { inS: 0 });
    step(0.75);   // front ≈ 18 m: the Halo (r 13.2–13.3) and the near stairs flipped, the garden not yet
    const mid = brute(), flipped = E.stats.flips - n0;
    R('step 2: mid-jump (part of the city in the 3000s) turfTotal and counts still equal the recount', mid.tt === P.turfTotal && mid.c[0] === P.counts[0] && mid.c[1] === P.counts[1] && flipped > 0 && flipped < 44,
      { turf: P.turfTotal, brute: mid.tt, counts: P.counts, bc: mid.c, front: E.front, flipped });
    step(W.doneOff + 1.5);
    // a splat on an absent piece claims nothing
    E.debugJump(1, { instant: true });
    const halo = tag('halo')[0], hk = cellsOf(halo.id), top = halo.center.y + halo.half.y;
    const pre = inked(hk);
    P.splat(new THREE.Vector3(halo.center.x, top + 0.3, halo.center.z), 1.6, 0, { instant: true });
    const after = inked(hk);
    R('step 2: in era 1 a splat on the Halo (an era-3 piece, absent) claims none of its cells', halo.presence === 4 && after === 0 && pre === 0, { pre, after, cells: hk.length });
    // a vanishing piece takes its ink: era 3, ink the Halo; the rewind 3 → 1 (Practice) — its cells stop counting at
    // its flip and are zeroed (grid and atlas) at done + 1 s
    E.debugJump(3, { instant: true });
    P.splat(new THREE.Vector3(halo.center.x, top + 0.3, halo.center.z), 1.6, 0, { instant: true });
    P.flush?.(1 / 60); step(0.1);
    const topFace = halo.faces.map((fid) => L.faces[fid]).find((f) => f && f.turf && f.atlas);
    const inkV = inked(hk), inkT = hk.filter((k) => P.grid[k] && P.live[k]).length, a0 = atlasAt(topFace.id), c0 = P.counts[0];
    const r = E.debugJump(1, { inS: 0 });
    const flipT = r.at + W.groups[halo.eraG].rg / W.speed;
    step(flipT - E.S.clock.t + 0.05);
    const c1 = P.counts[0], gridAtFlip = inked(hk);
    step(r.doneAt + 1.2 - E.S.clock.t);
    const a1 = atlasAt(topFace.id), gridAfter = inked(hk);
    R('step 2: a vanishing piece takes its ink: the Halo\'s inked cells stop counting at its flip (Practice\'s rewind), and at done + 1 s its grid cells and atlas are zero',
      inkT > 0 && c0 - c1 >= inkT && gridAtFlip === inkV && gridAfter === 0 && a0 > 0.3 && a1 < 0.02, { inked: inkV, inkedTurf: inkT, countsBefore: c0, countsAtFlip: c1, gridAtFlip, gridAfter, atlas: [+a0.toFixed(3), +a1.toFixed(3)] });
    // an appearing piece arrives blank: stale ink on the (absent) Halo, then a jump to era 3 — cleared at the warning
    const gate = P.blockGate; P.blockGate = null;
    P.splat(new THREE.Vector3(halo.center.x, top + 0.3, halo.center.z), 1.6, 1, { instant: true });
    P.blockGate = gate; P.flush?.(1 / 60); step(0.1);
    const stale = inked(hk), as = atlasAt(topFace.id);
    const r3 = E.debugJump(3, { inS: 10.5 });
    step(0.8);   // the warning has passed (J − 10)
    const atWarn = inked(hk), aw = atlasAt(topFace.id);
    R('step 2: an appearing piece arrives blank: stale ink on the Halo (absent in era 1) is cleared, grid and atlas, at the warning', stale > 0 && as > 0.3 && atWarn === 0 && aw < 0.02,
      { stale, atlas: [+as.toFixed(3), +aw.toFixed(3)], phase: E.phase });
    // ground in both eras keeps its ink: the circus floor under the front
    const circus = tag('circus')[0], cf = L.faces[circus.faces[2]];
    P.splat(new THREE.Vector3(-14, 0.3, 14), 2.0, 0, { instant: true });
    const ck = []; for (let k = cf.grid; k < cf.grid + cf.nu * cf.nv; k++) if (P.grid[k]) ck.push(k);
    const snap = ck.map((k) => P.grid[k]).join('');
    step(r3.doneAt + 1.5 - E.S.clock.t);
    R('step 2: ground that exists in both eras keeps its ink through the jump (the circus floor, cell for cell)', ck.length > 10 && ck.map((k) => P.grid[k]).join('') === snap && E.era === 3,
      { cells: ck.length, era: E.era });
    E.debugJump(1, { instant: true });
  }

  // ================================================================================================ part 3
  if (only.includes(3)) {
    E.debugJump(1, { instant: true });
    const U = __G.nav, phys = __G.physics;
    R('step 3: the union graph: three builds merged (per-era valid / exitable / wet columns, an era mask on every edge); merge under 60 ms',
      U.eraValid?.length === 3 && U.nodes.every((n) => n.em > 0) && U.nodes.every((n) => n.nb.every((e) => e.em > 0 && e.em < 8)) && W.stats.mergeMs < 60,
      { nodes: U.nodes.length, valid: U.eraValid.map((v) => v.reduce((a, b) => a + b, 0)), mergeMs: W.stats.mergeMs, builds: W.stats.navBuilds, navMs: W.stats.navMs, edges: U.nodes.reduce((s, n) => s + n.nb.length, 0) });
    const res = [];
    for (const e of [1, 2, 3]) {
      W._solidity(e);
      const F = new NavGraph(L, phys);
      W._solidity(1);
      W._setNavEra(e);
      const fv = F.nodes.filter((n) => F.valid[n.id]);
      const toU = (n) => { for (const u of U.cells[n.iz * U.nx + n.ix]) { const m = U.nodes[u]; if (Math.abs(m.y - n.y) < 0.15 && m.em & (1 << (e - 1))) return u; } return -1; };
      let n = 0, bad = 0, worst = 0, nul = 0; const ex = [];
      for (let i = 0; i < 200; i++) {
        const a = fv[(rnd() * fv.length) | 0], b = fv[(rnd() * fv.length) | 0];
        const ua = toU(a), ub = toU(b);
        const pf = F.path(a.id, b.id, 0), pu = ua >= 0 && ub >= 0 ? U.path(ua, ub, 0) : null;
        if (!pf || !pu) { if (!!pf !== !!pu) { bad++; nul++; } continue; }
        const cf = F._g[b.id], cu = U._g[ub], d = Math.abs(cf - cu) / Math.max(1, cf);
        n++; worst = Math.max(worst, d);
        if (d > 0.01) { bad++; if (ex.length < 3) ex.push([a.x, a.z, b.x, b.z, +cf.toFixed(2), +cu.toFixed(2)]); }
      }
      res.push({ e, pairs: n, bad, nul, worst: +(worst * 100).toFixed(3) + ' %', freshNodes: F.nodes.length, ex });
    }
    W._setNavEra(1);
    R('step 3: on 200 random node pairs per era, union-graph path costs in era e equal a fresh NavGraph built in era e (±1 %)', res.every((x) => x.bad === 0 && x.pairs >= 150), res);
    // a route shut in era 1 and open in era 2: Degrayling Lane (Swimston ↔ the quay at mid-leg; the produce stacks)
    const at = (x, y, z) => U.nearest(new THREE.Vector3(x, y, z), 0.8, true);
    const cost = (e, a, b) => { W._setNavEra(e); const pth = U.path(a, b, 0); return pth ? +U._g[b].toFixed(2) : null; };
    const A = at(-18.5, 0, -26), B = at(-7.6, 0, -26.2);
    const c1 = cost(1, A, B), c2 = cost(2, A, B);
    W._setNavEra(1);
    const halo = tag('halo')[0], hy = halo.center.y + halo.half.y;
    let hn = -1; { const ix = Math.round((halo.center.x - U.x0) / U.step), iz = Math.round((halo.center.z - U.z0) / U.step); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const u of U.cells[(iz + dz) * U.nx + ix + dx] || []) if (Math.abs(U.nodes[u].y - hy) < 0.2) hn = u; }
    R('step 3: a route shut in era 1 and open in era 2 (Degrayling Lane: Swimston → the quay at mid-leg is much shorter from era 2)', c1 && c2 && c2 < c1 * 0.75, { era1: c1, era2: c2, from: A, to: B });
    R('step 3: the Halo\'s nodes are valid only in era 3', hn >= 0 && !U.eraValid[0][hn] && !U.eraValid[1][hn] && U.eraValid[2][hn] && U.nodes[hn].em === 4,
      { node: hn, y: hn >= 0 ? U.nodes[hn].y : null, em: hn >= 0 ? U.nodes[hn].em : null });
  }

  // ================================================================================================ part 4 (last: it rebuilds the world)
  if (only.includes(4)) {
    const { MAPS } = await import('./src/config.js');
    const SM = await import('./src/game/stageMods.js');
    const EM = await import('./src/game/eras.js');
    const map = MAPS.find((m) => m.id === 'bluestone');
    const time = async () => { g.worldKey = null; const t0 = performance.now(); await g._buildWorld(map); return Math.round(performance.now() - t0); };
    // (timings on a machine other builders share: the world built twice, each build's nav ×3 kept, the lower judged)
    const navRuns = [], withE = [];
    for (let i = 0; i < 2; i++) { withE.push(await time()); navRuns.push(__G.eraWorld.stats.navBuilds.slice()); }
    const navE = __G.eraWorld.stats, navSum = Math.min(...navRuns.map((r) => r.reduce((a, b) => a + b, 0)));
    SM.unregisterStageMod('eras');
    const without = [await time(), await time()];
    SM.registerStageMod({ key: 'eras', order: 10, worldAs: 'eraWorld', matchAs: 'eras', world: (ctx) => new EM.EraWorld(ctx), match: (m, W2, S) => EM.StageEras.create(m, W2, S) });
    await time();
    R('step 4: load measured on the stage: the world build with the era engine and without it (the union, everything solid); nav ×3 under 700 ms (no dirty-region rebuild needed)',
      navSum < 700, { withEras: withE, without, navRuns, navSum, mergeMs: navE.mergeMs, paintMs: navE.paintMs, meshMs: navE.meshMs, levelMs: navE.levelMs });
  }
  // ================================================================================================ part 5 (the other stages)
  if (only.includes(5)) {
    const { MAPS } = await import('./src/config.js');
    for (const id of ['halyard', 'calamari', 'treehills']) {
      g.worldKey = null;
      await g._buildWorld(MAPS.find((m) => m.id === id));
      const key = g.levelMat.customProgramCacheKey(), gk = g.grateMat.customProgramCacheKey();
      R(`step 13: ${id} builds as before — no era world, the level program key '${key}' (no -eras), no aEra attribute, no presence on any block, the nav an ordinary graph`,
        !__G.eraWorld && !__G.stageWorld && key === 'inkwave-level-v8' && gk === 'inkwave-level-v8-grate' && !g.levelMesh.geometry.getAttribute('aEra') && __G.level.blocks.every((b) => !b.presence) && !__G.level.presenceAll && !__G.nav.eraValid && __G.nav.edgeMask === 0,
        { key, gk, layout: __G.level.layout.id });
    }
  }
  return out;
})()
