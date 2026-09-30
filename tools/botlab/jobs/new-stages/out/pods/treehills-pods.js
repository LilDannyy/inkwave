// Eco-Forest Treehills — the sprout pods on the stage (page script for tools/botlab/page.cjs; the engine's own tests run
// on the podbox arena, tools/botlab/tests/pods.js — this checks the stage's pods, placements and looks):
//   MAP=treehills MODE=turf|tower|boss PAGE=tools/botlab/jobs/new-stages/out/pods/treehills-pods.js tools/botlab/run.sh tools/botlab/page.cjs
// turf: the layout (4 listed → 8: 2 gateway walls + 2 canopies a half, the stage's planters by kind, the seeds on the
// soil, mirror twins, the gateways' hedgerows); every gate closes the route it's across — the way round, before and
// after it grows, on the nav graph plus the hops a kid makes (≤ 1.4 m), the key routes through it and what they cost,
// nothing near to hop onto its top from — and a kid walking / hopping into the whole line (the gate, its posts, its
// hedgerow's ends; from both sides, 4 s a run) never gets past (sliding over an off-limits roof or falling in reported
// apart); with both of a half's gates closed nothing is cut off, mid → the base keeps ≥ 2 of its 3 corridors, every
// zone keeps its ways in; every canopy — what its platform overlooks, a kid stands on it, nothing near to hop onto it
// from; the owners climb both kinds here; the looks in the grower's ink; shoving (never into the reservoir); the wilt
// carries riders down. tower: no plant sits on the track (every pod plays), the gates and hedgerows clear the track;
// boss: plants stop the charge, walking into one tramples it.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = __G.level, Ph = __G.physics, nav = __G.nav;
  const THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const { navNodesInBox } = await import('./src/game/stageKit.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  dbg.freeze();
  const P = m.pods;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  R('pods on the stage (4 listed, mirrored: 8 — 2 gateway walls and 2 canopies a half)', !!P && P.pods.length === 8 && P.pods.filter((p) => p.kind === 'wall').length === 4,
    { n: P && P.pods.length, kinds: P && P.pods.map((p) => p.id + ':' + p.kind), mode: m.mode });
  if (!P) return out;
  m.duration = 99999; m.time = m.duration - P.t;
  const intents = new Map();
  for (const a of m.actors) if (a.bot) { a.bot._up0 = a.bot.update; a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; const f = intents.get(a); if (f) f(a, it); }; }
  const A = m.actors.filter((a) => a.team === 0), Bt = m.actors.filter((a) => a.team === 1);
  const byId = (id) => P.pods.find((p) => p.id === id);
  const W = (p, lx, ly, lz) => new THREE.Vector3(p.x + lx * p.c + lz * p.s, p.y + ly, p.z - lx * p.s + lz * p.c);
  const dirW = (p, lx, lz) => W(p, lx, 0, lz).sub(W(p, 0, 0, 0));
  const loc = (p, v) => [(v.x - p.x) * p.c - (v.z - p.z) * p.s, (v.x - p.x) * p.s + (v.z - p.z) * p.c];
  const place = (a, v, squid = false) => { a.pos.copy(v); a.vel.set(0, 0, 0); a.grounded = false; a.form = squid ? 'squid' : 'kid'; a.climbing = false; };
  const home = (a, i) => { const pd = L.spawnPads[a.team]; a.pos.set(pd.x + (i % 4) - 1.5, pd.y + 0.1, pd.z); a.vel.set(0, 0, 0); };
  const grown = (p, team) => { P.grow(p, team, P.t - 1); step(2 / 60); };
  const onPlant = (a, p) => P.hedgeUnder(a) === p;
  const v = new THREE.Vector3(), d = new THREE.Vector3();

  // ---- the layout
  const looks = g.podLooks;
  const stageCols = P.pods.map((p) => L.blocks.filter((b) => !b.dynamic && b.hidden && Math.hypot(b.center.x - p.x, b.center.z - p.z) < 0.02 && Math.abs(b.center.y - (p.y + 0.25)) < 0.02));
  const sizeOk = P.pods.every((p, i) => stageCols[i].length === 1 && Math.abs(stageCols[i][0].half.x * 2 - p.def.col[0]) < 0.02 && Math.abs(stageCols[i][0].half.z * 2 - p.def.col[2]) < 0.02);
  R('the planters are the stage\'s props by kind (a 1.6 × 0.7 trough for a wall, a 1.1 tub for a canopy; one collider each); the engine draws the seeds on the soil, no planters',
    sizeOk && looks && looks.items.length === 8 && looks.items.every((it) => !it.planter && it.bulb.children.length > 0 && Math.abs(it.pivot.position.y - 0.46) < 1e-6),
    { colliders: stageCols.map((c, i) => [P.pods[i].id, c.length, c[0] && [r2(c[0].half.x * 2), r2(c[0].half.z * 2)]]) });
  let mir = true;
  for (let i = 0; i < P.pods.length; i += 2) { const a = P.pods[i], b = P.pods[i + 1]; if (Math.abs(a.x + b.x) > 1e-6 || Math.abs(a.z + b.z) > 1e-6 || Math.abs(Math.cos(a.yaw) + Math.cos(b.yaw)) > 1e-6 || a.kind !== b.kind) mir = false; }
  R('mirror twins', mir, P.pods.map((p) => [p.id, r2(p.x), r2(p.y), r2(p.z), Math.round(p.yaw * 180 / Math.PI)]));

  if (m.mode === 'turf' || m.mode === 'zones') {
    // ---- the player's graph: the nav's edges + the hops a kid makes that bots don't (up to 1.4 m, orthogonal)
    const PN = nav.nodes.length, padj = nav.nodes.map((n) => n.nb.map((e) => [e.to, e.cost]));
    for (const n of nav.nodes) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
      for (const mid of nav.cells[jz * nav.nx + jx]) { const q = nav.nodes[mid], dy = q.y - n.y; if (dy > 1.25 && dy <= 1.4 && !nav._blocked(n, q, q.y)) padj[n.id].push([mid, 3.5]); }
    }
    const dist = new Float32Array(PN), stamp = new Uint32Array(PN), hk = new Float32Array(PN * 8), hv = new Int32Array(PN * 8), from = new Int32Array(PN); let st = 0;
    const pPath = (s0, s1, avoid) => {   // A* on the player's graph: { len, nodes } or null
      st++; const gN = nav.nodes[s1]; let n = 0;
      const H = (u) => { const q = nav.nodes[u]; return Math.hypot(q.x - gN.x, q.z - gN.z); };
      const push = (k, x) => { let i = n++; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = x; };
      const pop = () => { const x = hv[0], k = hk[--n], y = hv[n]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && hk[c + 1] < hk[c]) c++; if (hk[c] >= k) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = k; hv[i] = y; return x; };
      stamp[s0] = st; dist[s0] = 0; from[s0] = -1; push(H(s0), s0);
      while (n > 0 && n < PN * 8 - 16) {
        const u = pop(), du = dist[u];
        if (u === s1) { const nodes = []; for (let k = u; k >= 0; k = from[k]) nodes.push(k); return { len: du, nodes: nodes.reverse() }; }
        if (du > 1500) break;
        for (const [w, c] of padj[u]) { if (avoid && avoid[w]) continue; const nd = du + c; if (stamp[w] !== st || nd < dist[w]) { stamp[w] = st; dist[w] = nd; from[w] = u; push(nd + H(w), w); } }
      }
      return null;
    };
    const near = (x, y, z, up = 0.8) => nav.nearest(v.set(x, y, z), up);
    const pads = L.spawnPads;
    // (each half's side of a hill's crown: the crown walls stand across its middle)
    const KEY = { 'Alpha spawn → mid': [pads[0], [0, 1.3, 0]], 'Bravo spawn → mid': [pads[1], [0, 1.3, 0]], 'Alpha spawn → the east hill': [pads[0], [30, 3.9, -5]], 'Alpha spawn → the west hill': [pads[0], [-30, 3.9, -5]],
      'Bravo spawn → the east hill': [pads[1], [30, 3.9, 5]], 'Bravo spawn → the west hill': [pads[1], [-30, 3.9, 5]], 'mid → Alpha\'s side zone': [[0, 1.3, 0], [13, 1.3, -31]], 'mid → Bravo\'s side zone': [[0, 1.3, 0], [-13, 1.3, 31]],
      'Alpha spawn → Bravo\'s potting deck': [pads[0], [-4, 2.62, 37]], 'Bravo spawn → Alpha\'s potting deck': [pads[1], [4, 2.62, -37]],
      // the flanks: over each hill's crown into the other half; down each band from mid to a half's nursery
      'Alpha spawn → over the east crown into Bravo\'s half': [pads[0], [30, 3.9, 8]], 'Alpha spawn → over the west crown into Bravo\'s half': [pads[0], [-30, 3.9, 8]],
      'Bravo spawn → over the east crown into Alpha\'s half': [pads[1], [30, 3.9, -8]], 'Bravo spawn → over the west crown into Alpha\'s half': [pads[1], [-30, 3.9, -8]],
      'mid → the west band → Alpha\'s west strip': [[0, 1.3, 0], [-18, 1.3, -30]], 'mid → the east band → Bravo\'s east strip': [[0, 1.3, 0], [18, 1.3, 30]],
      'mid → the east band → Alpha\'s side zone': [[0, 1.3, 0], [13, 1.3, -31]], 'mid → the west band → Bravo\'s side zone': [[0, 1.3, 0], [-13, 1.3, 31]] };
    const keyPaths = Object.entries(KEY).map(([name, [a, b]]) => { const s = nav.nearest(v.set(a.x ?? a[0], a.y ?? a[1], a.z ?? a[2]), 1.2, true), e = near(b[0], b[1], b[2]); const q = s >= 0 && e >= 0 ? pPath(s, e, null) : null; return { name, s, e, q }; });
    // ---- every wall closes the route it's across
    const walls = P.pods.filter((p) => p.kind === 'wall'), wallRep = [];
    let allClosed = true;
    for (const p of walls) {
      const core = navNodesInBox(p.x, p.z, p.yaw, p.w / 2, p.d / 2, PLAYER.radius - 0.05, p.y - 1, p.y + 0.6);
      const avoid = new Uint8Array(nav.nodes.length); for (const id of core) avoid[id] = 1;
      // (the nearest nodes 3.2 m either side of it, outside its footprint: a stair's foot may run under it)
      const pick = (q) => { let best = -1, bd = Infinity; for (const n of nav.nodes) { if (avoid[n.id] || !nav.valid[n.id] || Math.abs(n.y - p.y) > 1.4) continue; const dd = Math.hypot(n.x - q.x, n.z - q.z); if (dd < bd) { bd = dd; best = n.id; } } return best; };
      const f = W(p, 0, 0, 3.2), bk = W(p, 0, 0, -3.2);
      const s0 = pick(f), s1 = pick(bk);
      const before = pPath(s0, s1, null), after = pPath(s0, s1, avoid), back = pPath(s1, s0, avoid);
      const routes = [];
      for (const kp of keyPaths) {
        if (!kp.q || !kp.q.nodes.some((id) => avoid[id])) continue;
        const q2 = pPath(kp.s, kp.e, avoid);
        routes.push({ route: kp.name, before: r1(kp.q.len), after: q2 ? r1(q2.len) : 'sealed', cost: q2 ? '+' + Math.round((q2.len / kp.q.len - 1) * 100) + ' %' : '∞' });
      }
      // a standable floor within 1.3 m of it high enough to hop onto its top from
      let over = 0;
      for (let lx = -p.w / 2 - 1.2; lx <= p.w / 2 + 1.2; lx += 0.4) for (const lz of [-1.8, -1.2, 1.2, 1.8, 0]) {
        if (lz === 0 && Math.abs(lx) < p.w / 2 + 0.3) continue;
        const q = W(p, lx, 4, lz), hh = Ph.raycast(q, d.set(0, -1, 0), 4.5, undefined, false);
        if (!hh.hit || L.blocks[hh.block].roof || L.blocks[hh.block].dynamic) continue;
        const gh = hh.point.y - p.y; if (gh >= 1.25 && gh < 4) over = Math.max(over, gh);
      }
      const closed = before && after && back && after.len >= before.len + 8 && back.len >= before.len + 8 && routes.every((r) => r.after !== 'sealed') && over === 0;
      if (!closed) allClosed = false;
      wallRep.push({ wall: p.id, at: [r1(p.x), r1(p.y), r1(p.z)], length: p.w, across: before ? r1(before.len) : null, roundAfter: after ? r1(after.len) : 'sealed', roundBack: back ? r1(back.len) : 'sealed', keyRoutes: routes, hopOntoTop: over ? r2(over) : 'none' });
    }
    R('every wall closes the route it\'s across: the way round once it stands (nav + a kid\'s hops) is ≥ 8 m longer both ways, nothing gets sealed off, nothing near to hop onto its top from', allClosed, wallRep);
    // …and physically: grown (Bravo's), a kid (fresh each run) walking and hopping into the whole line — the gate's middle,
    // its ends, its hedgerow's far ends (angled toward them) — from either side, 4 s a run, never gets beyond it. A run
    // that ends up past only by sliding across an off-limits roof, or that falls in, is reported apart
    const { GATES } = await import('./src/world/stages/treehills/layout.js');
    const gateOf = (p) => GATES[p.id.replace('~', '').replace('-gate', '')];
    let passed = 0, roofSlides = 0, fell = 0; const pk = [];
    for (const p of walls) {
      const G0 = gateOf(p), hw = p.hw, hd = p.hd;
      const lo = Math.min(-hw, ...G0.wings.map((w) => w[0])), hi = Math.max(hw, ...G0.wings.map((w) => w[1]));
      const lines = [[0, 0], [hw - 0.5, 0.25], [-hw + 0.5, -0.25], [hw - 0.5, 0.6], [-hw + 0.5, -0.6], [hi - 0.6, 0.35], [lo + 0.6, -0.35], [hi - 0.6, 0.8], [lo + 0.6, -0.8]];
      let worst = -9;
      for (const side of [1, -1]) for (const [lx, bias] of lines) {
        grown(p, 1);
        const a = A[1], p0 = W(p, lx, 0, side * (hd + 1.5));
        p0.y = L.groundHeight(p0.x, p0.z, p.y + 1.5) + 0.05;
        a.spawnAt(p0, 0); a.invuln = 99; a.grounded = false;
        const into = dirW(p, bias, -side).normalize();
        let t = 0; intents.set(a, (b, i) => { t += 1 / 60; i.move.set(into.x, 0, into.z); i.jump = Math.floor(t * 60) % 24 < 3; });
        // (past = onto the route's far side: the lane just beyond the gate at its own level — its middle or either end)
        const far = [0, hw - 0.6, -hw + 0.6].map((u) => W(p, u, 0, -side * (hd + 2.4)));
        const isPast = () => a.grounded && Math.abs(a.pos.y - p.y) < 0.7 && far.some((q) => Math.hypot(a.pos.x - q.x, a.pos.z - q.z) < 1.8);
        let best = -9, died = false, roof = false, run = 0, runPast = -1; const last = a.pos.clone();
        for (let f = 0; f < 150 && !died; f++) { step(1 / 60); if (!a.alive) { died = true; break; } run += Math.hypot(a.pos.x - last.x, a.pos.z - last.z); last.copy(a.pos); if (a.grounded && a.ground && L.blocks[a.ground.block] && L.blocks[a.ground.block].roof) roof = true; best = Math.max(best, -side * loc(p, a.pos)[1]); if (runPast < 0 && isPast()) runPast = run; }
        intents.delete(a);
        if (died) { fell++; if (!a.alive) a.respawn(); continue; }
        if (runPast >= 0) { if (roof) roofSlides++; else { passed++; pk.push([p.id, side, r1(lx), bias, 'past after ' + r1(runPast) + ' m of running']); } }
        worst = Math.max(worst, run);
      }
      pk.push([p.id, 'runs ' + 2 * lines.length, 'longest run ' + r1(worst) + ' m']);
      P.reset(); step(0.1);
    }
    home(A[1], 1);
    R('…and physically: a kid walking and hopping into each gate\'s whole line (the gate, its posts, its hedgerow\'s ends; from either side: 18 runs of 2.5 s) never gets past it',
      passed === 0, { passed, roofSlides, fellIn: fell, probes: pk });

    // ---- the lead's guard-rails, with both of a half's gates closed (grown: Bravo's)
    {
      const half = (sgn) => walls.filter((p) => Math.sign(p.z) === sgn);
      const valid = nav.nodes.filter((n) => nav.valid[n.id]).map((n) => n.id);
      const reach = (from, avoid) => { const seen = new Uint8Array(nav.nodes.length), q = [from]; seen[from] = 1; while (q.length) { const u = q.pop(); for (const e of nav.nodes[u].nb) if (!seen[e.to] && !(avoid && avoid[e.to])) { seen[e.to] = 1; q.push(e.to); } } return seen; };
      const rep = [];
      let ok = true;
      for (const sgn of [-1, 1]) {
        const ws = half(sgn), avoid = new Uint8Array(nav.nodes.length);
        for (const p of ws) for (const id of navNodesInBox(p.x, p.z, p.yaw, p.w / 2, p.d / 2, PLAYER.radius - 0.05, p.y - 1, p.y + 0.6)) avoid[id] = 1;
        const pad = nav.nearest(L.spawnPads[sgn < 0 ? 0 : 1], 1.2, true), mid = near(0, 1.3, 0);
        const r0 = reach(pad, null), r1a = reach(pad, avoid);
        const lost = valid.filter((id) => r0[id] && !r1a[id] && !avoid[id]).length;
        // mid → the base through each corridor (a waypoint in it: Alpha's numbers, Bravo's their twins); the zones: from 4
        // points round each (9 m off), the way in with the gates closed vs open
        const M = (x, z) => (sgn < 0 ? [x, z] : [-x, -z]);
        const bz = M(0, -52), baseN = near(bz[0], 1.3, bz[1]);
        const open = [];
        for (const [name, wx, wz] of [['west flank', -18, -34], ['centre', 0, -30], ['east flank', 18, -34]]) {
          const [x, z] = M(wx, wz), w = near(x, 1.3, z, 1.0);
          const q1 = w >= 0 && pPath(mid, w, avoid), q2 = q1 && pPath(w, baseN, avoid);
          if (q1 && q2) open.push(name + ' ' + r1(q1.len + q2.len) + ' m');
        }
        const zs = [];
        for (const [zx, zz, name] of [[0, 0, 'the centre zone'], [13.25, -31.5, (sgn < 0 ? 'Alpha' : 'Bravo') + ' side zone']]) {
          const [cx, cz] = M(zx, zz), cN = near(cx, 1.3, cz);
          let ways = 0;
          for (const [dx, dz] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) { const s0 = near(cx + dx, 1.3, cz + dz, 1.5); if (s0 < 0) { ways++; continue; } const qa = pPath(s0, cN, null), qb = pPath(s0, cN, avoid); if (!qa || (qb && qb.len <= qa.len * 1.25 + 2)) ways++; }
          zs.push(name + ': ' + ways + '/4 approaches unchanged');
        }
        const hOK = lost === 0 && open.length >= 2 && zs.every((z) => +z.split(': ')[1][0] >= 3);
        if (!hOK) ok = false;
        rep.push({ half: sgn < 0 ? 'Alpha' : 'Bravo', gatesClosed: ws.map((p) => p.id), cutOffNodes: lost, midToBaseCorridors: open, zones: zs });
      }
      R('with both of a half\'s gates closed nothing is cut off, mid → its base keeps ≥ 2 of its 3 corridors, and every zone keeps ≥ 3 of its 4 approaches', ok, rep);
    }

    // ---- every canopy: what its platform overlooks (the share of the zone / the track it has a line of sight to, and
    // how far above), a kid stands on it; nothing near to hop onto it from
    const zonePolys = [];
    const zs = L.layout.zones; for (const z of zs.center || []) for (const q of z.polys || [z.poly]) zonePolys.push({ name: 'the centre zone', poly: q, y: z.y0 ?? 1.3 });
    for (const q of zs.side.polys || [zs.side.poly]) { zonePolys.push({ name: 'Alpha\'s side zone', poly: q, y: zs.side.y0 ?? 1.3 }); zonePolys.push({ name: 'Bravo\'s side zone', poly: q.map(([x, z]) => [-x, -z]), y: zs.side.y0 ?? 1.3 }); }
    const inPoly = (x, z, Q) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, zi] = Q[i], [xj, zj] = Q[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    const trk = L.layout.tower && L.layout.tower.path;
    const canRep = []; let canOk = true;
    const ey = new THREE.Vector3(), tg = new THREE.Vector3();
    for (const p of P.pods.filter((q) => q.kind === 'canopy')) {
      grown(p, 0);
      const eyes = [[0, 0], [p.hw - 0.7, 0], [-p.hw + 0.7, 0], [0, p.hd - 0.7], [0, -p.hd + 0.7]].map(([lx, lz]) => W(p, lx, p.h + 1.3, lz));
      const sees = (x, y, z) => eyes.some((e) => Ph.los(e, tg.set(x, y + 0.6, z)));
      const seen = [];
      for (const Z of zonePolys) {
        let n = 0, k = 0, dmin = Infinity;
        const xs = Z.poly.map((q) => q[0]), zz = Z.poly.map((q) => q[1]);
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1) for (let z = Math.min(...zz); z <= Math.max(...zz); z += 1) { if (!inPoly(x, z, Z.poly)) continue; n++; dmin = Math.min(dmin, Math.hypot(x - p.x, z - p.z)); if (dmin < 30 && sees(x, L.groundHeight(x, z, 6), z)) k++; }
        if (n && dmin < 25) seen.push({ what: Z.name, dist: r1(dmin), sees: Math.round((100 * k) / n) + ' %', above: r1(p.y + p.h - Z.y) });
      }
      // the tower track (both halves: the layout draws Alpha's goal on Bravo's side; the mirror is Bravo's)
      if (trk) {
        let n = 0, k = 0, dmin = Infinity;
        const pts = [];
        const seg = (a, b) => { const ax = a[0], az = a[a.length - 1], bx = b[0], bz = b[b.length - 1], L0 = Math.hypot(bx - ax, bz - az); for (let s = 0; s <= L0; s += 1) pts.push([ax + ((bx - ax) * s) / L0, az + ((bz - az) * s) / L0]); };
        for (let i = 1; i < trk.length; i++) { seg(trk[i - 1], trk[i]); seg(trk[i - 1].map((c, j) => (j === 1 && trk[i - 1].length === 3 ? c : -c)), trk[i].map((c, j) => (j === 1 && trk[i].length === 3 ? c : -c))); }
        for (const [x, z] of pts) { const dd = Math.hypot(x - p.x, z - p.z); if (dd > 18) continue; n++; dmin = Math.min(dmin, dd); if (sees(x, L.groundHeight(x, z, 6), z)) k++; }
        if (n) seen.push({ what: 'the tower track (within 18 m)', dist: r1(dmin), sees: Math.round((100 * k) / n) + ' %', metres: n });
      }
      const kid = A[2];
      place(kid, W(p, 0.4, p.h + 0.1, 0.3)); step(0.6);
      const stands = kid.grounded && onPlant(kid, p) && !kid.roofT;
      let hi = -9;
      for (let a = 0; a < 24; a++) for (const rr of [2.0, 2.6, 3.2, 4.0]) { const x = p.x + Math.cos(a * Math.PI / 12) * rr, z = p.z + Math.sin(a * Math.PI / 12) * rr; const hh = Ph.raycast(v.set(x, p.y + 6, z), d.set(0, -1, 0), 7, undefined, false); if (hh.hit && !L.blocks[hh.block].roof && !L.blocks[hh.block].dynamic) hi = Math.max(hi, hh.point.y - p.y); }
      const ok = stands && hi <= 1.9 && seen.some((s) => parseInt(s.sees) >= 35);
      if (!ok) canOk = false;
      canRep.push({ canopy: p.id, at: [r1(p.x), r1(p.y), r1(p.z)], overlooks: seen, kidStands: stands, highestFloorNear: r2(hi) });
      home(kid, 2); P.reset(); step(0.1);
    }
    R('every canopy overlooks something worth holding (a zone or the tower track: a real share of it in sight from its platform), a kid stands on it, and nothing near is high enough to hop onto it from', canOk, canRep);

    // ---- the owners climb both kinds here; the looks in the grower's ink
    const swimUp = (a, p, face, u, team) => {
      for (let y = 0.2; y < p.ht; y += 0.3) __G.paint.splat(W(p, u, y, face * (p.hd + 0.12)), 0.4, team);
      place(a, W(p, u, 0.05, face * (p.hd + 0.75)), true);
      const into = dirW(p, 0, -face);
      let climbed = false;
      intents.set(a, (b, i) => { i.squid = true; if (b.pos.y < p.y + p.h - 0.25 || b.climbing) i.move.set(into.x, 0, into.z); else if (p.kind === 'canopy' && !onPlant(b, p)) i.move.set(into.x * 0.4, 0, into.z * 0.4); });
      for (let f = 0; f < 60 * 3; f++) { step(1 / 60); climbed = climbed || a.climbing; }
      intents.set(a, (b, i) => { i.squid = true; }); step(0.5); intents.delete(a);
      return { climbed, on: onPlant(a, p), y: r2(a.pos.y) };
    };
    const pw = byId('band-gate'), pc = byId('meadow');
    grown(pw, 0); grown(pc, 0);
    const cw = swimUp(A[1], pw, 1, 0.3, 0), cc = swimUp(A[1], pc, -1, 0.1, 0);
    const tintOk = [pw, pc].every((p) => p.look && p.look.team[0].every((x) => x.visible && x.userData.tint === __G.teamColors[0].getHexString()));
    R('the owners swim up both kinds here (the band\'s wall onto its top, the meadow canopy\'s root curtain onto its platform); the looks wear the grower\'s ink',
      cw.climbed && cw.on && cc.climbed && cc.on && tintOk, { wall: cw, canopy: cc, tint: tintOk });
    home(A[1], 1); P.reset(); step(0.2);

    // ---- shoving: a kid where a plant grows ends up out of it, on the ground, never in the reservoir
    const sk = Bt.find((a) => !a.isLocal) || Bt[1], shov = [];
    let wet = 0, inside = 0;
    for (const p of P.pods) {
      place(sk, W(p, 0.25, 0.05, p.kind === 'canopy' ? p.hd - 0.15 : 0.2)); step(0.2);
      const c = new THREE.Vector3(p.x, p.y + p.def.bulbY + 0.2, p.z); for (let i = 0; i < 40 && p.state === 'dormant'; i++) { __G.paint.splat(c, 0.8, 1); step(1 / 60); }
      step(0.8);
      const [lx, lz] = loc(p, sk.pos);
      for (const q of p.parts) if (q.blk.solid && L.pointInBlock(q.blk, sk.pos.clone().setY(sk.pos.y + 0.4), -0.06)) inside++;
      if (!sk.alive || sk.pos.y < -1.2) wet++;
      shov.push([p.id, r2(lx), r2(lz), r2(sk.pos.y)]);
      P.reset(); step(0.1);
    }
    R('shoving: a kid standing where each plant grows ends up out of it, on the ground, never in the reservoir', inside === 0 && wet === 0, { inside, wet, shoved: P.stats.shoved, at: shov });
    home(sk, 1);
    // ---- the wilt: a kid on a wall's top comes down with it, the pod recharges
    const pg = byId('band-gate');
    grown(pg, 0);
    place(A[1], W(pg, 0.8, pg.h + 0.1, 0)); step(0.6);
    const was = onPlant(A[1], pg);
    m.time = m.duration - (pg.wiltAt - 0.3); step(2.0);
    R('it wilts after its time (the kid on top comes down with it, onto the floor or its trough); the pod recharges', was && ['recharge', 'dormant'].includes(pg.state) && A[1].pos.y < pg.y + 0.6,
      { wasOn: was, state: pg.state, kidY: r2(A[1].pos.y), carried: P.stats.carried });
    home(A[1], 1); P.reset(); step(0.2);
  }
  if (m.mode === 'tower') {
    R('Tower Command: every pod plays (none sits on the track)', P.pods.every((p) => !p.off), P.pods.map((p) => [p.id, p.off || 'on']));
    // the gates and their hedgerows (layout GATES, both halves) clear the track: the platform's half width + 0.5 m
    const { GATES } = await import('./src/world/stages/treehills/layout.js');
    const rects = [];
    for (const [id, g] of Object.entries(GATES)) {
      const r = g.deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      for (const [u0, u1] of [[-g.gate / 2, g.gate / 2], ...g.wings]) for (const sg of [1, -1]) { const u = (u0 + u1) / 2; rects.push({ id, x: sg * (g.x + u * c), z: sg * (g.z - u * s), c, s, hx: (u1 - u0) / 2, hz: 0.6 }); }
    }
    const T = m.tower;
    let worst = Infinity, at = null;
    for (let sp = -T.path.len[1]; sp <= T.path.len[0]; sp += 0.4) {
      const q = T.path.at(sp, new THREE.Vector3());
      for (const b of rects) { const dx = q.x - b.x, dz = q.z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c; const d = Math.hypot(Math.max(0, Math.abs(lx) - b.hx), Math.max(0, Math.abs(lz) - b.hz)); if (d < worst) { worst = d; at = b.id; } }
    }
    R('Tower Command: the gates and their hedgerows clear the track (the platform\'s half width + 0.5 m)', rects.length >= 8 && worst > 1.25 + 0.5, { pieces: rects.length, nearest: r2(worst), nearestGate: at });
  }
  if (m.mode === 'boss') {
    const Bs = __G.boss, nv = Bs && Bs.nav;
    const res = [];
    for (const p of P.pods) {
      const before = nv.dynWall(p.x, p.z, 1.5);
      P.grow(p, 0, P.t - 1); step(2 / 60);
      res.push([p.id, before, nv.dynWall(p.x + p.s * (p.hd + 1.2), p.z + p.c * (p.hd + 1.2), 1.5)]);
    }
    R('Boss Battle: every grown plant stops HULLBREAKER\'s charge like a wall (the charge asks dynWall)', res.every(([, b, a]) => !b && a), res);
    const pb = byId('meadow');
    const bm = Bs.move; Bs.move = null;
    const bp = Bs.pos.clone(), by0 = Bs.yaw;
    Bs.pos.set(pb.x, Bs.pos.y, pb.z - 3.2); Bs.yaw = 0;
    P.bossStep();
    const tr = pb.wiltAt <= P.t + 1e-3;
    Bs.pos.copy(bp); Bs.yaw = by0; Bs.move = bm;
    step(1.2);
    R('Boss Battle: HULLBREAKER walking into a plant tramples it (it wilts)', tr && (pb.state === 'wilt' || pb.state === 'recharge'), { trampled: tr, state: pb.state });
  }
  R('state()', !!P.state(), P.state().stats);
  return out;
})()
