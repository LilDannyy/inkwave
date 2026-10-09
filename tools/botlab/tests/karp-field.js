// [b5-karp] The Carp Field (SPEC §3, §10.1 karp-field.js, WP0's test): on karpbox the field's own cases, then a sweep
// over every stage built in its Bazookarp variant (the twelve, Cargo, and the three wip stages as information):
//   per stage: L_A, L_B (within 2 %), no NaN, holes (nodes a carrier reaches on foot from the Pond with D = ∞), the
//   halfway line through the Pond, the hop and gap edges added and their largest gain, the reading sweep of checker #2
//   (|fieldAt − D| ≤ 0.05 m at every valid node; at the quarter, half and three-quarter points of every walk edge, ±0.3 m
//   across where the waist line is clear: fieldAt ≥ max(D[a] − |p − a|, D[b] − |p − b|) − 2.5 m, and the count of points
//   more than 1.5 m low — expected 0 except kelpline's 5), and the LOAD-TIME COST per state: the engine's own build at
//   match start (the real cost a player waits for) and the median of three warm rebuilds (budget 60 ms per state).
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=halyard,lockgate' sweeps some stages; 'karpbox=0' skips the karpbox part.
(async () => {
  const g = window.__inkwave, dbg = g.debug, G = window.__G;
  const { MAPS } = await import('./src/config.js');
  const { KarpField } = await import('./src/game/karpField.js');
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v))) });
  const args = window.__pageArgs || '';
  const only = args.match(/only=([\w,]+)/)?.[1]?.split(',') || null;
  const waitPlaying = async () => { for (let i = 0; i < 400; i++) { if (g.match?.state === 'playing' && g.match.karp) return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const start = async (mapId) => { dbg.unfreeze?.(); await g.api.startMatch({ mapId, duration: 180, mode: 'bazookarp' }); const ok = await waitPlaying(); dbg.freeze(); for (const a of g.match?.actors || []) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; } return ok && g.mapDef?.id === mapId; };
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

  // ---- one stage's field: every number of the sweep
  const sweep = (Kp) => {
    const F = Kp.field, nav = G.nav, N = F.N, nodes = nav.nodes, res = { id: g.mapDef.id, placeholder: Kp.placeholder, states: F.states.length };
    res.L = Kp.L.map((x) => +x.toFixed(2)); res.Ldiff = Math.abs(Kp.L[0] - Kp.L[1]) / Math.max(Kp.L[0], Kp.L[1]);
    // NaN anywhere in D; holes: reached forward from the Pond's own node on the carrier graph, with D = ∞ for a team
    let nan = 0; for (const S of F.states) for (const D of S.D) for (let i = 0; i < N; i++) if (Number.isNaN(D[i])) nan++;
    res.nan = nan;
    const p0 = F.ownNode(Kp.R.pond); let reach = 0; const holes = [0, 0], holeAt = [];
    if (p0 >= 0) {
      const seen = new Uint8Array(N), st = [p0]; seen[p0] = 1;
      while (st.length) { const u = st.pop(); reach++; for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { const v = F.ft[k]; if (!seen[v] && F.okN[v]) { seen[v] = 1; st.push(v); } } }
      for (let i = 0; i < N; i++) if (seen[i]) for (let t = 0; t < 2; t++) if (!Number.isFinite(F.D[t][i])) { holes[t]++; if (holeAt.length < 4) holeAt.push([t, +nodes[i].x.toFixed(1), +nodes[i].y.toFixed(1), +nodes[i].z.toFixed(1)]); }
    }
    res.pondNode = p0; res.reach = reach; res.holes = holes; res.holeAt = holeAt;
    // the halfway line runs through the Pond: D_A = D_B there (within 2 % of L)
    res.halfAtPond = +F.halfMargin(Kp.R.pond).toFixed(2);
    // … and splits the stage: the valid nodes on each half (a mirrored stage: about equal)
    const halves = [0, 0]; for (let i = 0; i < N; i++) if (F.okN[i] && Number.isFinite(F.D[0][i]) && Number.isFinite(F.D[1][i])) halves[F.nodeHalf(i)]++;
    res.halves = halves; res.halfSplit = Math.abs(halves[0] - halves[1]) / Math.max(1, halves[0] + halves[1]);
    res.hops = F.stats.hops; res.gaps = F.stats.gaps; res.maxGain = +F.hopGain().toFixed(2);
    // the reading sweep (checker #2), both teams, the start state
    let nodeWorst = 0, nNodes = 0, low15 = 0, low25 = 0, worstLow = 0, pts = 0, lowAt = [], inSpawn = 0;
    const p = V(0, 0, 0), q = V(0, 0, 0), pads = G.level.spawnPads, bar = (G.level.spawnBarrier || 4.2) + 0.4;
    for (let t = 0; t < 2; t++) {
      const D = F.states[0].D[t];
      for (let i = 0; i < N; i++) {
        if (!F.okN[i] || !Number.isFinite(D[i])) continue;
        const n = nodes[i], r = F.fieldAt(t, p.set(n.x, n.y, n.z));
        if (!r) { nodeWorst = Infinity; continue; }
        nodeWorst = Math.max(nodeWorst, Math.abs(r.d - D[i])); nNodes++;
        for (const e of n.nb) {
          if (e.type !== 'walk' || e.to < i || !F.okN[e.to] || !Number.isFinite(D[e.to])) continue;
          const m = nodes[e.to], dx = m.x - n.x, dz = m.z - n.z, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
          for (const u of [0.25, 0.5, 0.75]) for (const off of [0, 0.3, -0.3]) {
            p.set(n.x + dx * u + px * off, n.y + (m.y - n.y) * u, n.z + dz * u + pz * off);
            if (off && nav._blocked(n, p, Math.max(n.y, p.y))) continue;
            const rr = F.fieldAt(t, p);
            if (!rr) continue;
            // (inside a spawn barrier no carrier stands: it is held out of both)
            if (pads.some((pd) => Math.hypot(p.x - pd.x, p.z - pd.z) < bar && Math.abs(p.y - pd.y) < 3)) { inSpawn++; continue; }
            pts++;
            const lb = Math.max(D[i] - p.distanceTo(q.set(n.x, n.y, n.z)), D[e.to] - p.distanceTo(q.set(m.x, m.y, m.z)));
            const low = lb - rr.d;
            if (low > worstLow) worstLow = low;
            if (low > 1.5) { low15++; if (lowAt.length < 5) lowAt.push([t, +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +low.toFixed(2)]); }
            if (low > 2.5) low25++;
          }
        }
      }
    }
    Object.assign(res, { nodeWorst: +nodeWorst.toFixed(3), nNodes, pts, inSpawn, worstLow: +worstLow.toFixed(2), low15, low25, lowAt });
    // the load cost: the engine's own build at match start, and three warm rebuilds
    res.loadMs = F.stats.buildMs; res.loadPerState = F.stats.ms.perState; res.loadSplit = F.stats.ms;
    const warm = [];
    for (let k = 0; k < 3; k++) { const f2 = new KarpField(Kp.R, { states: Kp._stageStates() }); warm.push(f2.stats.ms.perState); }
    res.warmPerState = med(warm); res.warm = warm;
    return res;
  };

  try {
    // ============================================================ karpbox: the field's own cases
    if (!/karpbox=0/.test(args) && g.mapDef?.id === 'karpbox') {
      const Kp = g.match.karp, F = Kp.field;
      const E = F.extraEdgeList();
      const hop = E.find((e) => e.type === 'hop' && e.a[2] > 13 && e.a[2] < 14 && e.b[2] > 14 && e.b[2] < 15 && e.a[0] < -14.5 && Math.abs(e.b[1] - e.a[1] - 1.5) < 0.05);
      const gap = E.find((e) => e.type === 'gap' && e.a[0] > 21 && e.a[0] < 22 && e.b[0] > 24 && e.b[0] < 25);
      const nIn = F.ownNode(V(6.5, 0, 15.5)), nOut = F.ownNode(V(4.5, 0, 15.5)), D = F.D[0];
      const rIn = F.fieldAt(0, V(6.15, 0, 15.5)), rOut = F.fieldAt(0, V(5.1, 0, 15.5));
      const lane0 = F.fieldAt(0, V(-17, 0, 10), undefined, 0), lane1 = F.fieldAt(0, V(-17, 0, 10), undefined, 1);
      const s = sweep(Kp);
      R('karpbox §3.2: the hop up the lane\'s 1.5 m step and the gap edge across 2.6 m of air are in the field; the thin wall\'s two sides read their own walks (> 20 m apart); state 1 takes the lane away',
        !!hop && !!gap && nIn >= 0 && nOut >= 0 && Math.abs(D[nIn] - D[nOut]) > 20 && Math.abs(rIn.d - D[nIn]) < 1.2 && Math.abs(rOut.d - D[nOut]) < 1.2 && lane0 && !lane1 && s.states === 2,
        { hops: s.hops, gaps: s.gaps, thin: [D[nIn], D[nOut], rIn?.d, rOut?.d], lane: [lane0?.d, lane1], states: s.states });
      R('karpbox §3.2 / checker #2: L_A ≈ L_B, no NaN, no holes, the halfway line through the Pond, the reading sweep clean', s.Ldiff <= 0.02 && s.nan === 0 && s.holes[0] + s.holes[1] === 0 && Math.abs(s.halfAtPond) <= 0.02 * s.L[0] && s.halfSplit <= 0.05 && s.nodeWorst <= 0.05 && s.low25 === 0 && s.low15 === 0, s);
    }
    // ============================================================ the stages
    const ids = MAPS.filter((m) => m.id !== 'karpbox' && (!only || only.includes(m.id))).map((m) => m.id);
    const rows = [];
    for (const id of ids) {
      const wip = !!MAPS.find((m) => m.id === id)?.wip;
      let ok = false, s = null, err = null;
      try { ok = await start(id); if (ok) s = sweep(g.match.karp); } catch (e) { err = String(e && e.message || e).slice(0, 200); }
      if (!ok || !s) { R(`${id}: loads in its Bazookarp build${wip ? ' (wip: information)' : ''}`, wip, { ok, err, got: g.mapDef?.id }); continue; }
      rows.push(s);
      if (id === 'lockgate') {
        // the WP1 match's one clamp rejection (lockgate 2, t 48.3): a carrier passing the missing nav cell at (1.5, 28.5)
        // read 25.14 → 22.28 in 0.05 s; the clamp's nav-hole allowance (two own nodes 2 m apart, a clear waist line)
        // takes it, and a jump the clamp exists for (10 m, or across a wall) is still refused
        // (0.27 m in 0.05 s: the own node switches across the missing cell — 3.4 m of D between nodes 2 m apart)
        const Kp = g.match.karp, a = g.match.actors[0], F = Kp.field, P0 = V(1.5, 0, 28.35), P1 = V(1.5, 0, 28.62);
        const r0 = F.fieldAt(0, P0), r1 = F.fieldAt(0, P1), drop = r0 && r1 ? r0.d - r1.d : null, oldAllow = Kp.constructor && 15.5 * 0.05 + 2.0;
        const c0 = Kp.stats.clamped;
        Kp.base = { D: r0.d, t: 10, node: r0.node }; Kp._reading(a, 0, P1, 10.05); const took = Kp.stats.clamped === c0 && Kp.base.node === r1.node;
        // (a node ≥ 8 m nearer the Gate, more than holeR away: the jump)
        let fp = null; for (const n of G.nav.nodes) { if (!F.okN[n.id] || !(F.D[0][n.id] < r1.d - 8)) continue; const d = Math.hypot(n.x - P1.x, n.z - P1.z); if (d > 5 && d < 14 && Math.abs(n.y - P1.y) < 0.3) { fp = V(n.x, n.y, n.z); break; } }
        const far = fp && F.fieldAt(0, fp); Kp.base = { D: r1.d, t: 20, node: r1.node }; if (fp) Kp._reading(a, 0, fp, 20.05); const refused = Kp.stats.clamped === c0 + 1;
        Kp.stats.clamped = c0; Kp.base = null; Kp.count = [100, 100]; Kp.bestM = [0, 0];
        R('lockgate §3.4: the clamp takes a real step past a missing nav cell (the WP1 match\'s one rejection), and still refuses a 10 m jump', !!r0 && !!r1 && drop > oldAllow && took && !!far && refused,
          { from: r0 && [r0.d, r0.node], to: r1 && [r1.d, r1.node], drop, oldAllow, took, far: far && [far.d, fp.x, fp.z], refused });
      }
      // every stage: the mode runs (L finite), no NaN, no holes, the reading exact at every node. The mirror (L_A ≈ L_B,
      // the halfway line through the Pond, two equal halves) wherever the Pond is the centre; checker #2's sweep bound
      // (nothing more than 2.5 m low) for stages with their own data — a placeholder's Gate and weir are arbitrary, and
      // the checker fails placeholder data by design (SPEC §4.1): its sweep is reported
      const pond = g.match.karp.R.pond, centred = Math.hypot(pond.x, pond.z) < 0.3;
      const core = s.L.every((x) => Number.isFinite(x)) && s.nan === 0 && s.holes[0] + s.holes[1] === 0 && s.nodeWorst <= 0.05;
      const mirror = s.Ldiff <= 0.02 && Math.abs(s.halfAtPond) <= 0.02 * Math.max(...s.L) + 0.05 && s.halfSplit <= 0.05;
      const pass = core && (!centred || mirror) && (s.placeholder || s.low25 === 0);
      s.pond = pond.toArray().map((x) => +x.toFixed(2));
      R(`${id}${wip ? ' (wip: information)' : ''}${s.placeholder ? ' (placeholder data' + (centred ? '' : ', the Pond off a fixture on the centre') + ')' : ''}: L ${s.L.join(' / ')} m, ${s.hops} hops, ${s.gaps} gaps; no NaN, no holes${centred ? ', the halfway line through the Pond' : ''}; the reading sweep (${s.pts} points: ${s.low15} > 1.5 m low, ${s.low25} > 2.5 m, worst ${s.worstLow} m)`,
        pass || wip, { ...s, loadSplit: undefined, warm: undefined });
    }
    // the load cost per state, every stage: the engine's build at match start (what players wait for) and warm rebuilds
    const fixed = rows.filter((r) => !MAPS.find((m) => m.id === r.id)?.wip);
    const worstLoad = Math.max(...fixed.map((r) => r.loadPerState)), worstWarm = Math.max(...fixed.map((r) => r.warmPerState));
    // (the code's cost is the warm rebuild — the median of three; the build at match start adds the first build's
    // compile and whatever else the machine is doing: on the shared Mac at load average 25+ it is reported, and fails
    // only past 90 ms, a gross regression)
    R(`the load cost per state ≤ 60 ms on every stage (warm rebuilds: worst ${worstWarm} ms; at match start: worst ${worstLoad} ms)`, fixed.length >= 12 && worstWarm <= 60 && worstLoad <= 90,
      rows.map((r) => ({ id: r.id, states: r.states, start: r.loadPerState, warm: r.warmPerState, split: r.loadSplit })));
  } catch (e) { R('HARNESS: the test threw', false, { err: String(e && e.stack || e).slice(0, 600) }); }
  return out;
})()
