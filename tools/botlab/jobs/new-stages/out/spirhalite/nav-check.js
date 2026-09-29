// Spirhalite Islands — nav check (scratch, for the stage report). Run:
//   BOTLAB_OUT=… SLOTS=3 MAP=spirhalite MODE=turf PAGE=tools/botlab/jobs/new-stages/out/spirhalite/nav-check.js tools/botlab/run.sh tools/botlab/page.cjs
// 1. the nav graph: node counts; probes at the key crossings (bridges, pillar islet, necks, causeway, spits …): is there a
//    valid node, how wet, which neighbours; 2. A* from Alpha's pad to the centre (the bots' costs) vs the pure-distance
//    shortest, the route each takes; 3. four Alpha bots walked to the centre with nothing else on their minds (Bravo
//    frozen): time, distance, route, splats.
(async () => {
  const g = window.__inkwave, G = window.__G, nav = G.nav, out = [];
  const N = nav.nodes.length, nodes = nav.nodes;
  const r1 = (v) => Math.round(v * 10) / 10;
  let valid = 0, wet2 = 0, wet1 = 0; for (const n of nodes) { if (nav.valid[n.id]) { valid++; if (n.wet === 2) wet2++; else if (n.wet === 1) wet1++; } }
  out.push({ name: 'nav graph', ok: true, info: { nodes: N, valid, wet2, wet1 } });
  const cellNodes = (x, z) => { const ix = Math.round((x - nav.x0) / nav.step), iz = Math.round((z - nav.z0) / nav.step); return ix < 0 || iz < 0 || ix >= nav.nx || iz >= nav.nz ? [] : nav.cells[iz * nav.nx + ix]; };
  // the probes: a line of samples across each crossing (valid nodes / samples, wet levels)
  const PROBES = window.__NAV_PROBES || {
    'pillar bridge': [[-3.5, -10], [0.5, -10]], 'Arch spit bridge': [[12.5, -5], [16.5, -5]], 'Arch spit (mid)': [[10.9, -16], [15.9, -16]],
    'headland ring W': [[-8, -18.6], [-5, -18.6]], 'headland ring E': [[2, -18.6], [5, -18.6]], 'headland ring N': [[-1.5, -12.5], [-1.5, -15]],
    'plinth top (W)': [[-5, -18.6], [-3.4, -18.6]], 'tier top': [[-3.5, -18.6], [-2.5, -18.6]], 'pillar steps': [[-1.5, -22.2], [-1.5, -25.4]],
    'zone south (tombolo)': [[-7, -24.8], [4, -24.8]], 'east bay head beach': [[7.5, -23.2], [7.5, -26]], 'shoulder east slope': [[12.6, -28.3], [15.9, -28.3]],
    'neck': [[-24.4, -18], [-18, -18]], 'causeway top': [[-31, -18], [-27, -18]], 'mid islet beach (x -13)': [[-13, -8.5], [-13, -12.5]],
    'centre (sandbar)': [[-3, 0], [3, 0]],
  };
  const probe = {};
  for (const [name, [a, b]] of Object.entries(PROBES)) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(2, Math.round(L / 0.5)), got = [];
    for (let i = 0; i <= k; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / k, z = a[1] + ((b[1] - a[1]) * i) / k;
      for (const id of cellNodes(x, z)) { const n = nodes[id]; if (!got.some((q) => q.id === id)) got.push({ id, x: n.x, z: n.z, y: r1(n.y), wet: n.wet, v: nav.valid[id], e: n.nb.length }); }
    }
    probe[name] = { nodes: got.length, valid: got.filter((q) => q.v).length, wet: got.map((q) => q.wet).join(''), ys: [...new Set(got.map((q) => q.y))].join('/') };
  }
  out.push({ name: 'probes at the crossings', ok: Object.values(probe).every((p) => p.valid > 0), info: probe });

  // regions a route passes (for naming it)
  const PX = -1.5, PZ = -18.6;
  const REG = window.__NAV_REG || [
    ['archSpit', (x, z) => x > 10.4 && x < 17.2 && z > -24.6 && z < -8.3], ['eastBridge', (x, z) => x > 12.3 && x < 16.7 && z >= -8.3 && z < -1.6],
    ['headland', (x, z) => Math.hypot(x - PX, z - PZ) < 6.8 && z > -24], ['bridgeN', (x, z) => Math.abs(x - PX) < 2.1 && z > -11.9 && z < -7.4],
    ['neck', (x, z) => x > -24.8 && x < -17.4 && z > -22.5 && z < -13.6], ['causeway', (x, z) => x > -31.3 && x < -26.7 && z > -26.2 && z < -9.8],
    ['bendHead', (x, z) => x < -27 && z > -10], ['camp', (x, z) => x < -9 && z < -29], ['midBeach', (x, z) => x < -4 && x > -18 && z > -13.8 && z < -8.6],
    ['crest', (x, z, y) => x < -12.8 && x > -24.3 && z > -8.8 && z < -4.7 && y > 0.6], ['northShore', (x, z) => x < -8 && x > -28 && z > -4.6 && z < 1.5],
  ];
  const route = (pts) => { const seq = []; for (const [x, z, y] of pts) for (const [nm, f] of REG) if (f(x, z, y ?? 0) && seq[seq.length - 1] !== nm) { if (!seq.includes(nm)) seq.push(nm); } return seq.join('→'); };
  const measure = (ids) => {
    let len = 0, cost = 0, w2 = 0, w1 = 0; const types = {};
    for (let i = 1; i < ids.length; i++) {
      const a = nodes[ids[i - 1]], b = nodes[ids[i]], e = nav.edge(ids[i - 1], ids[i]);
      len += Math.hypot(b.x - a.x, b.z - a.z); cost += (e ? e.cost : 0) + (b.wet === 2 ? 2 : b.wet === 1 ? 0.5 : 0);
      if (b.wet === 2) w2++; else if (b.wet === 1) w1++;
      const t = e ? e.type : '?'; if (t !== 'walk') types[t] = (types[t] || 0) + 1;
    }
    return { len: r1(len), cost: r1(cost), estSecs: r1(len / 6.0 + (types.jump || 0) * 0.35 + (types.climb || 0) * 1.2), wetNodes: `${w2}+${w1}`, ...types, route: route(ids.map((k) => [nodes[k].x, nodes[k].z, nodes[k].y])) };
  };
  // pure-distance Dijkstra (no wet surcharge, jumps/drops/climbs at their base cost): the geometric shortest walk
  const dijkstra = (s, t, wetK = 0, skip = null) => {
    const dist = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    dist[s] = 0; const open = [s];
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[bi]]) bi = i;
      const c = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (done[c]) continue; done[c] = 1; if (c === t) break;
      for (const e of nodes[c].nb) {
        const m = nodes[e.to]; if (m.zone >= 0 && m.zone !== 0) continue; if (skip && skip(m)) continue;
        const nd = dist[c] + e.cost + (wetK && m.wet === 2 ? wetK : 0);
        if (nd < dist[e.to]) { dist[e.to] = nd; from[e.to] = c; open.push(e.to); }
      }
    }
    if (!isFinite(dist[t])) return null;
    const p = []; for (let k = t; k !== -1; k = from[k]) p.push(k); return p.reverse();
  };
  const pad = G.level.spawnPads[0];
  const V = (x, y, z) => ({ x, y, z });
  const s = nav.nearest(V(pad.x, pad.y, pad.z), 1.2, true);
  const DESTS = window.__NAV_DESTS || { centre: [0, 0, 0], 'east end (14, 1)': [14, 0, 1], 'mid islet head': [-28, 0, -6] };
  const paths = {};
  for (const [nm, [x, y, z]] of Object.entries(DESTS)) {
    const t = nav.nearest(V(x, y, z), 0.8);
    const pDef = nav.path(s, t, 0), pGeo = dijkstra(s, t);
    paths[nm] = { botPlan: pDef ? measure(pDef) : 'NO PATH (A* ran out)', shortestWalk: pGeo ? measure(pGeo) : 'NO PATH' };
  }
  out.push({ name: 'Alpha pad → destinations (bot plan vs shortest walk)', ok: true, info: paths });
  // each route on its own (the others' crossings shut): the bots' cost, the walk
  const inReg = (nm) => { const f = REG.find((r) => r[0] === nm)[1]; return (m) => f(m.x, m.z, m.y); };
  const shut = (...names) => { const fs = names.map(inReg); return (m) => fs.some((f) => f(m)); };
  const tC = nav.nearest(V(0, 0, 0), 0.8), per = {};
  const ROUTES = window.__NAV_ROUTES || { 'Arch spit': ['bridgeN', 'neck', 'causeway'], 'pillar headland': ['eastBridge', 'neck', 'causeway'], 'neck (inner bend)': ['eastBridge', 'bridgeN', 'causeway'], 'causeway (outer bend)': ['eastBridge', 'bridgeN', 'neck'] };
  const routePts = {};
  for (const [nm, sh] of Object.entries(ROUTES)) { const p = dijkstra(s, tC, 2.0, shut(...sh)); per[nm] = p ? measure(p) : 'NO PATH'; if (p) routePts[nm] = p.map((k) => [nodes[k].x, nodes[k].z]); }
  // over the pillar's tiers: via a node on the plinth's top (1.3) and one on the tier (2.5)
  {
    // (the plinth's north half or the tier: up the steps, across the top, off its north face)
    const onTop = (lo, hi) => nodes.filter((n) => nav.valid[n.id] && Math.hypot(n.x - PX, n.z - PZ) < 4.2 && n.z > PZ + 1.2 && n.y > lo && n.y < hi).map((n) => n.id);
    let best = null;
    for (const mid of [...onTop(1.1, 1.5), ...onTop(2.3, 2.7)]) {
      const a = dijkstra(s, mid, 2.0, shut('eastBridge', 'neck', 'causeway')), b = a && dijkstra(mid, tC, 2.0, shut('eastBridge', 'neck', 'causeway'));
      if (!a || !b) continue;
      const p = [...a, ...b.slice(1)], m = measure(p);
      if (!best || m.cost < best.cost) { best = { ...m, via: [nodes[mid].x, +nodes[mid].y.toFixed(1), nodes[mid].z] }; routePts['over the pillar tiers'] = p.map((k) => [nodes[k].x, nodes[k].z]); }
    }
    per['over the pillar tiers (via its top)'] = best || 'NO PATH';
  }
  out.push({ name: 'Alpha pad → centre, one route at a time (costs as the bots see them)', ok: Object.values(per).every((v) => v !== 'NO PATH'), info: per });
  out.push({ name: 'ROUTEPTS', ok: true, info: routePts });
  window.__navSummary = { s };

  // ---------------------------------------------------------------- live: four Alpha bots walked to the centre
  g.debug.freeze();
  const goal = { x: 0, y: 0, z: 0 };
  const alpha = G.actors.filter((a) => a.team === 0 && a.bot), bravo = G.actors.filter((a) => a.team === 1 && a.bot);
  for (const a of bravo) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = false; };
  const tr = alpha.map((a) => ({ a, t: null, len: 0, last: a.pos.clone(), pts: [], deaths: 0, stuckMax: 0 }));
  for (const T of tr) {
    const b = T.a.bot;
    b._perceive = function () { this.target = null; };
    b._pickPaintGoal = function () { this._pathTo(goal, 0.3); this.goalTimer = 99; };
    b.goalTimer = 0; b.path = null;
  }
  const onDeath = []; const off = G.bus && G.bus.on ? null : null;
  let t = 0;
  while (t < 40 && tr.some((T) => T.t === null)) {
    for (let k = 0; k < 6; k++) { for (const T of tr) T.a.ink = 100; g.debug.step(1000 / 60); }
    t += 0.1;
    for (const T of tr) {
      if (T.t !== null) continue;
      const p = T.a.pos;
      if (!T.a.alive) { T.deaths++; continue; }
      T.len += Math.hypot(p.x - T.last.x, p.z - T.last.z); T.last.copy(p);
      T.pts.push([p.x, p.z, p.y]);
      if (Math.hypot(p.x - goal.x, p.z - goal.z) < 3.5) T.t = t;
    }
  }
  const live = tr.map((T) => ({ weapon: T.a.weapon.kind, secs: T.t === null ? 'not there in 40 s' : r1(T.t), walked: r1(T.len), route: route(T.pts), end: [r1(T.a.pos.x), r1(T.a.pos.z)], alive: T.a.alive }));
  const done = tr.filter((T) => T.t !== null);
  out.push({ name: 'live: Alpha bots from the pad to the centre (Bravo frozen, no fights)', ok: done.length === tr.length, info: { meanSecs: done.length ? r1(done.reduce((s2, T) => s2 + T.t, 0) / done.length) : null, bots: live } });
  return out;
})()
