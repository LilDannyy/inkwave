// Eco-Forest Treehills — the sprout pods on the stage (page script for tools/botlab/page.cjs; the engine's own tests run
// on the podbox arena, tools/botlab/tests/pods.js — this checks the stage's pods, placements and looks):
//   MAP=treehills MODE=turf|tower|boss PAGE=tools/botlab/jobs/new-stages/out/pods/treehills-pods.js tools/botlab/run.sh tools/botlab/page.cjs
// (turf runs ~2 min: give it WATCHDOG=420000)
// turf: the layout (4 listed → 8: 2 gateway walls + 2 canopies a half, the stage's planters by kind, the seeds on the
// soil, mirror twins, the rill hedge's lengths); each gate closes the route it's across — on the player's graph (the
// nav's edges + what a kid really does: climbs onto anything ≤ 1.8 m up within 2.3 m, drops, hops over low things) the
// way across and round and what the key routes through it pay; then physically: a kid stepped on its own (actor.update)
// searches for the shortest way round (walks and hops in 8 headings from spot to spot, A* on the distance run) from
// both sides of each gate, alone and with both closed — the way round must never cross the hedge line away from its
// ends except through an open gateway (a crossing over a closed gate's top or the hedge = a leak); with both of a
// half's gates closed nothing is cut off, mid → the base keeps other routes, every zone keeps ≥ 3 of its 4 ways in;
// the potting deck still sees mid; every canopy — what its platform overlooks, a kid stands on it, nothing near to hop
// onto it from; the owners climb both kinds here; the looks in the grower's ink; shoving (never into the reservoir);
// the wilt carries riders down. tower: no plant sits on the track (every pod plays), the hedge and gates clear the
// track; boss: plants stop the charge, walking into one tramples it.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = __G.level, Ph = __G.physics, nav = __G.nav;
  const THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const { navNodesInBox } = await import('./src/game/stageKit.js');
  const { GATES } = await import('./src/world/stages/treehills/layout.js');
  const RL = GATES.rill;
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
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const gates = P.pods.filter((p) => p.kind === 'wall' && !p.id.endsWith('~'));   // (Alpha's; Bravo's are the mirror)

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
  // the rill hedge: its lengths between the gates (static, off-limits tops, never inked), both halves, and each gate's
  // wall as tall as the hedge (GATES.rill.h) and 4–6 m across
  const cuts = RL.gates.map((q) => [q.x - q.len / 2, q.x + q.len / 2]).sort((a, b) => a[0] - b[0]);
  const spans = []; { let a = RL.x0; for (const [c0, c1] of cuts) { spans.push([a, c0]); a = c1; } spans.push([a, RL.x1]); }
  const hedgeHits = [];
  for (const sg of [1, -1]) for (const [a, b] of spans) { const x = sg * (a + b) / 2, z = sg * RL.z; const bl = L.blocks.filter((q) => !q.dynamic && q.roof && q.hidden && Math.abs(q.center.x - x) < 0.3 && Math.abs(q.center.z - z) < 0.1 && Math.abs(q.half.x * 2 - (b - a)) < 0.1 && Math.abs(q.aabbMax.y - RL.h) < 0.05); hedgeHits.push([r1(x), r1(z), bl.length]); }
  R(`the rill hedge: ${spans.length} lengths a half between the gates (off-limits tops, ${RL.h} m), the gates as tall and 4–6 m across`, hedgeHits.every((h) => h[2] >= 1) && gates.every((p) => Math.abs(p.h - RL.h) < 1e-6 && p.w >= 4 && p.w <= 6),
    { lengths: hedgeHits, gates: gates.map((p) => [p.id, p.w, p.h]) });

  if (m.mode === 'turf' || m.mode === 'zones') {
    // ---- the player's graph: the nav's edges + what a kid does that bots don't — climbs onto anything up to 1.8 m
    // higher within 2.3 m (a hop tops out 1.41 m, ledgeAssist lands it 0.35 m above that), drops, hops over low things
    const PN = nav.nodes.length, padj = nav.nodes.map((n) => n.nb.map((e) => [e.to, e.cost]));
    const has = (a, b) => padj[a].some((e) => e[0] === b);
    const hi0 = new THREE.Vector3(), hd0 = new THREE.Vector3();
    for (const n of nav.nodes) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dz) continue;
      const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
      for (const qid of nav.cells[jz * nav.nx + jx]) {
        const q = nav.nodes[qid], dy = q.y - n.y, hd = Math.hypot(q.x - n.x, q.z - n.z);
        if (hd > 2.3 || has(n.id, qid)) continue;
        if (dy > 0.5 && dy <= 1.8) { if (!nav._blocked(n, q, q.y)) padj[n.id].push([qid, hd + 2.5]); }
        else if (dy < -0.5 && dy >= -3.4) { if (!nav._blocked(n, q, n.y) && nav._openAbove(q, n.y)) padj[n.id].push([qid, hd + 0.8]); }
        else if (Math.abs(dy) <= 0.5 && (Math.abs(dx) === 2 || Math.abs(dz) === 2)) { hi0.set(n.x, Math.max(n.y, q.y) + 1.8, n.z); hd0.set(q.x - n.x, 0, q.z - n.z).normalize(); if (!Ph.raycast(hi0, hd0, hd, undefined, false).hit) padj[n.id].push([qid, hd + 1.5]); }
      }
    }
    const dist = new Float32Array(PN), stamp = new Uint32Array(PN), hk = new Float32Array(PN * 12), hv = new Int32Array(PN * 12), from = new Int32Array(PN); let st = 0;
    const pPath = (s0, s1, avoid) => {   // A* on the player's graph: { len, nodes } or null
      if (s0 == null || s1 == null || s0 < 0 || s1 < 0) return null;
      st++; const gN = nav.nodes[s1]; let n = 0;
      const H = (u) => { const q = nav.nodes[u]; return Math.hypot(q.x - gN.x, q.z - gN.z); };
      const push = (k, x) => { let i = n++; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = x; };
      const pop = () => { const x = hv[0], k = hk[--n], y = hv[n]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && hk[c + 1] < hk[c]) c++; if (hk[c] >= k) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = k; hv[i] = y; return x; };
      stamp[s0] = st; dist[s0] = 0; from[s0] = -1; push(H(s0), s0);
      while (n > 0 && n < PN * 12 - 32) {
        const u = pop(), du = dist[u];
        if (u === s1) { const nodes = []; for (let k = u; k >= 0; k = from[k]) nodes.push(k); return { len: du, nodes: nodes.reverse() }; }
        if (du > 1500) break;
        for (const [w, c] of padj[u]) { if (avoid && avoid[w]) continue; const nd = du + c; if (stamp[w] !== st || nd < dist[w]) { stamp[w] = st; dist[w] = nd; from[w] = u; push(nd + H(w), w); } }
      }
      return null;
    };
    const near = (x, y, z, up = 0.8) => nav.nearest(v.set(x, y, z), up);
    const pads = L.spawnPads;
    // the hedge's own lengths aren't nav ground (roof tops); a closed gate's footprint is taken out of the graph, and
    // (the graph's hops reach 2.3 m) any edge crossing the gate's line
    const crosses = (a, b, p) => { const [la, za] = loc(p, a), [lb, zb] = loc(p, b); if (Math.max(a.y, b.y) < p.y - 1 || Math.min(a.y, b.y) > p.y + p.h) return false; if ((za > 0) === (zb > 0)) return false; const t = za / (za - zb), u = la + (lb - la) * t; return Math.abs(u) <= p.hw + 0.3; };
    const cut = (ps) => { const av = new Uint8Array(PN); for (const p of ps) for (const id of navNodesInBox(p.x, p.z, p.yaw, p.w / 2, p.d / 2, PLAYER.radius - 0.05, p.y - 1, p.y + 0.6)) av[id] = 1; const adj0 = padj.map((l) => l); for (let i = 0; i < PN; i++) { const A0 = nav.nodes[i]; padj[i] = adj0[i].filter(([w]) => !ps.some((p) => crosses(A0, nav.nodes[w], p))); } return { av, restore: () => { for (let i = 0; i < PN; i++) padj[i] = adj0[i]; } }; };
    const KEY = { 'Alpha spawn → mid': [pads[0], [0, 1.3, 0]], 'mid → Alpha\'s side zone': [[0, 1.3, 0], [13, 1.3, -31]], 'mid → Alpha\'s nursery': [[0, 1.3, 0], [0, 1.3, -30]],
      'mid → Alpha\'s potting deck': [[0, 1.3, 0], [4, 2.62, -37]], 'Alpha spawn → the garden': [pads[0], [0, 0, -12]], 'Alpha spawn → the meadow\'s west side': [pads[0], [-10, 0, 0]],
      'Bravo spawn → Alpha\'s potting deck': [pads[1], [4, 2.62, -37]], 'mid → the west band → Alpha\'s west strip': [[0, 1.3, 0], [-18, 1.3, -30]], 'Alpha spawn → mid → Bravo\'s half': [pads[0], [0, 1.3, 12]] };
    const keyPaths = Object.entries(KEY).map(([name, [a, b]]) => { const s = nav.nearest(v.set(a.x ?? a[0], a.y ?? a[1], a.z ?? a[2]), 1.2, true), e = near(b[0], b[1], b[2]); const q = s >= 0 && e >= 0 ? pPath(s, e, null) : null; return { name, s, e, q }; });
    const gateRep = [];
    const across = (p, closedPs) => {
      const C = cut(closedPs);
      const pick = (q) => { let best = -1, bd = Infinity; for (const n of nav.nodes) { if (C.av[n.id] || !nav.valid[n.id] || Math.abs(n.y - p.y) > 0.6) continue; const dd = Math.hypot(n.x - q.x, n.z - q.z); if (dd < bd) { bd = dd; best = n.id; } } return best; };
      const s0 = pick(W(p, 0, 0, 3.2)), s1 = pick(W(p, 0, 0, -3.2));
      const aft = pPath(s0, s1, C.av), back = pPath(s1, s0, C.av);
      const routes = [];
      for (const kp of keyPaths) { if (!kp.q || !kp.q.nodes.some((id, i) => C.av[id] || (i && closedPs.some((q) => crosses(nav.nodes[kp.q.nodes[i - 1]], nav.nodes[id], q))))) continue; const q2 = pPath(kp.s, kp.e, C.av); routes.push({ route: kp.name, open: r1(kp.q.len), closed: q2 ? r1(q2.len) : 'sealed', cost: q2 ? '+' + Math.round((q2.len / kp.q.len - 1) * 100) + ' %' : '∞' }); }
      C.restore();
      const bef = pPath(s0, s1, null);
      return { across: bef && r1(bef.len), round: aft ? r1(aft.len) : 'sealed', roundBack: back ? r1(back.len) : 'sealed', routes };
    };
    for (const p of gates) gateRep.push({ gate: p.id, alone: across(p, [p]) });
    gateRep.push({ gate: 'both', footbridge: across(byId('footbridge-gate'), gates) });
    const graphOk = gateRep.slice(0, gates.length).every((r) => typeof r.alone.round === 'number' && r.alone.round >= r.alone.across + 3) && gateRep[gates.length].footbridge.round >= gateRep[gates.length].footbridge.across + 12;
    R('on the player\'s graph each gate closes the route it\'s across: alone, the way round is by the other gateway; both closed, round the hedge\'s ends (and what the key routes through them pay)', graphOk, gateRep);

    // ---- physically: the shortest way round a kid really finds (actor.update on its own, walks and hops in 8
    // headings from spot to spot, merged on a 0.6 × 0.3 m grid; A* on the distance run), from both sides, each gate
    // alone and both closed. A leak = a way round crossing the hedge line (not through an open gateway) more than 3 m
    // from its ends (its west end meets the band's rim, where the band is the way round anyway; its east end is open)
    const kid = A.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
    for (const q of m.actors) if (q !== kid) home(q, 0);
    const onRoof = () => kid.grounded && kid.ground && L.blocks[kid.ground.block] && L.blocks[kid.ground.block].roof;
    const putKid = (pos) => { kid.spawnAt(pos, 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false; for (let i = 0; i < 3; i++) kid.update(dt); };
    const DIRS = []; for (let k = 0; k < 8; k++) DIRS.push([Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)]);
    const lastP = new THREE.Vector3();
    const move = (pos, dir, hop) => {
      putKid(pos); if (!kid.alive || !kid.grounded) return null;
      let travel = 0; lastP.copy(kid.pos);
      for (let f = 0; f < (hop ? 54 : 16); f++) { it.move.set(dir[0], 0, dir[1]); it.jump = hop && f < 3; kid.update(dt); if (!kid.alive) return null; travel += Math.hypot(kid.pos.x - lastP.x, kid.pos.z - lastP.z); lastP.copy(kid.pos); if (hop && f > 6 && kid.grounded && !onRoof()) break; }
      it.jump = false;
      for (let f = 0; f < 90 && (!kid.grounded || onRoof()); f++) { it.move.set(0, 0, 0); kid.update(dt); if (!kid.alive) return null; travel += Math.hypot(kid.pos.x - lastP.x, kid.pos.z - lastP.z); lastP.copy(kid.pos); }
      if (!kid.grounded || onRoof() || kid.pos.y < -1.2) return null;
      return { pos: kid.pos.clone(), travel };
    };
    const key = (q) => Math.round(q.x / 0.6) + ',' + Math.round(q.z / 0.6) + ',' + Math.round(q.y / 0.3);
    const wayRound = (p, side, R0, budget) => {
      const t0 = performance.now();
      const far = [0, p.hw - 0.6, -p.hw + 0.6].map((u) => W(p, u, 0, -side * (p.hd + 2.4)));
      const Hh = (q) => Math.min(...far.map((f) => Math.hypot(q.x - f.x, q.z - f.z)));
      const isFar = (q) => Math.abs(q.y - p.y) < 0.7 && far.some((f) => Math.hypot(q.x - f.x, q.z - f.z) < 1.3);
      const kk = [], vv = [];
      const push = (k, x) => { let i = kk.length; kk.push(k); vv.push(x); while (i > 0) { const q = (i - 1) >> 1; if (kk[q] <= k) break; kk[i] = kk[q]; vv[i] = vv[q]; i = q; } kk[i] = k; vv[i] = x; };
      const pop = () => { const x = vv[0], k = kk.pop(), y = vv.pop(); if (kk.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= kk.length) break; if (c + 1 < kk.length && kk[c + 1] < kk[c]) c++; if (kk[c] >= k) break; kk[i] = kk[c]; vv[i] = vv[c]; i = c; } kk[i] = k; vv[i] = y; } return x; };
      const best = new Map();
      for (const u of [0, p.hw - 0.6, -p.hw + 0.6]) { const s = W(p, u, 0, side * (p.hd + 2.4)); s.y = L.groundHeight(s.x, s.z, p.y + 1.2) + 0.05; best.set(key(s), 0); push(Hh(s), { pos: s, g: 0, par: null }); }
      let found = null;
      while (kk.length && performance.now() - t0 < budget) {
        const s = pop();
        if (isFar(s.pos)) { found = s; break; }
        if ((best.get(key(s.pos)) ?? Infinity) < s.g - 1e-6) continue;
        for (const dir of DIRS) for (const hop of [false, true]) {
          const r = move(s.pos, dir, hop);
          if (!r || r.travel < 0.15 || Math.hypot(r.pos.x - p.x, r.pos.z - p.z) > R0) continue;
          const k = key(r.pos), gg = s.g + r.travel + (hop ? 0.3 : 0);
          if ((best.get(k) ?? Infinity) <= gg) continue;
          best.set(k, gg); push(gg + Hh(r.pos), { pos: r.pos, g: gg, par: s });
        }
      }
      const way = []; for (let s = found; s; s = s.par) way.unshift(s.pos);
      return { found: !!found, len: found ? r1(found.g) : null, way, exhausted: !found && !kk.length, ms: Math.round(performance.now() - t0) };
    };
    // where a way round crosses the hedge line (z = RL.z, Alpha's half) and whether that's a leak
    const crossings = (way, openXs) => {
      const cs = [];
      for (let i = 1; i < way.length; i++) { const a = way[i - 1], b = way[i]; if ((a.z - RL.z) * (b.z - RL.z) >= 0) continue; const t = (RL.z - a.z) / (b.z - a.z), x = a.x + (b.x - a.x) * t; const inGate = openXs.some(([c0, c1]) => x >= c0 && x <= c1); const inside = x > RL.x0 + 3 && x < RL.x1; cs.push({ x: r1(x), via: inGate ? 'an open gateway' : !inside ? 'round the hedge\'s end' : 'OVER THE LINE', leak: inside && !inGate }); }
      return cs;
    };
    const phys = []; let leaks = 0, notFound = 0;
    const runs = [...gates.map((p) => ({ p, closed: [p] })), { p: byId('footbridge-gate'), closed: gates }];
    for (const { p, closed } of runs) {
      P.reset(); step(0.05);
      for (const q of closed) P.grow(q, 1, P.t - 1);
      step(2 / 60);
      const openXs = gates.filter((q) => !closed.includes(q)).map((q) => [q.x - q.hw, q.x + q.hw]);
      for (const side of [1, -1]) {
        const w = wayRound(p, side, closed.length > 1 ? 30 : 24, closed.length > 1 ? 45000 : 25000);
        const cs = crossings(w.way, openXs);
        if (!w.found) notFound++;
        leaks += cs.filter((c) => c.leak).length;
        phys.push({ closed: closed.map((q) => q.id).join(' + '), from: side > 0 ? 'the meadow side' : 'the nursery side', wayRound: w.found ? w.len + ' m' : (w.exhausted ? 'none within reach' : 'budget out'), crosses: cs, ms: w.ms });
      }
    }
    P.reset(); step(0.1); for (const q of m.actors) if (q !== kid) home(q, 0); home(kid, 0);
    R('…and physically: a kid searching for the shortest way round each gate (alone, and both closed; from both sides) finds it only through the open gateway or round the hedge\'s ends — never over a closed gate or the hedge', leaks === 0, { leaks, notFound, runs: phys });

    // ---- the lead's guard-rails, with both of a half's gates closed (grown: Bravo's)
    {
      const valid = nav.nodes.filter((n) => nav.valid[n.id]).map((n) => n.id);
      const C = cut(gates);
      const reach = (fromN, av) => { const seen = new Uint8Array(PN), q = [fromN]; seen[fromN] = 1; while (q.length) { const u = q.pop(); for (const [w] of padj[u]) if (!seen[w] && !(av && av[w])) { seen[w] = 1; q.push(w); } } return seen; };
      const pad = nav.nearest(pads[0], 1.2, true), mid = near(0, 1.3, 0), base = near(0, 1.3, -52);
      const r1a = reach(pad, C.av);
      C.restore();
      const r0 = reach(pad, null);
      const lost = valid.filter((id) => r0[id] && !r1a[id] && !C.av[id]).length;
      const C2 = cut(gates);
      // mid → the base by each other route: through a waypoint on it (the west band's end, the east band, the hills)
      const via = [];
      for (const [name, x, y, z] of [['the west band', -17, 1.3, -22], ['the east band', 17, 1.3, -20], ['the east hill\'s upper tier', 26, 2.6, -8], ['the west hill\'s upper tier', -26, 2.6, -8]]) {
        const w = near(x, y, z, 1.0); const q1 = w >= 0 && pPath(mid, w, C2.av), q2 = q1 && pPath(w, base, C2.av);
        via.push(name + ': ' + (q1 && q2 ? r1(q1.len + q2.len) + ' m' : 'CLOSED'));
      }
      const zs = [];
      for (const [zx, zz, name] of [[0, 0, 'the centre zone'], [13.25, -31.5, 'Alpha\'s side zone']]) {
        const cN = near(zx, 1.3, zz); let ways = 0; const det = [];
        for (const [dx, dz] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) { const s0 = near(zx + dx, 1.3, zz + dz, 1.5); if (s0 < 0) { ways++; continue; } C2.restore(); const qa = pPath(s0, cN, null); const C3 = cut(gates); const qb = pPath(s0, cN, C3.av); C3.restore(); if (!qa || (qb && qb.len <= qa.len * 1.25 + 2)) ways++; det.push([dx, dz, qa && r1(qa.len), qb ? r1(qb.len) : 'x']); }
        zs.push(name + ': ' + ways + '/4 approaches unchanged ' + JSON.stringify(det));
      }
      C2.restore();
      const open = via.filter((s) => !s.endsWith('CLOSED')).length;
      R('with both of a half\'s gates closed nothing is cut off, mid → its base keeps ≥ 2 other routes, and every zone keeps ≥ 3 of its 4 approaches', lost === 0 && open >= 2 && zs.every((z) => +z.split(': ')[1][0] >= 3), { cutOffNodes: lost, midToBaseBy: via, zones: zs });
    }

    // ---- the potting deck (2.62 m) still sees down the middle walk to mid, over the hedge or through a gateway, with
    // both gates grown
    {
      for (const q of gates) P.grow(q, 1, P.t - 1); step(2 / 60);
      const eyes = [[0, -33.6], [2, -33.6], [4, -33.6], [-2, -33.6]].map(([x, z]) => V(x, 2.62 + 1.6, z));
      let k = 0, n = 0;
      for (let z = -30; z <= 0; z += 1) { n++; const gy = L.groundHeight(0, z, 3) + 1.0; if (eyes.some((e) => Ph.los(e, V(0, gy, z)))) k++; }
      const midSeen = eyes.some((e) => Ph.los(e, V(0, 1.3 + 1.0, 0)));
      P.reset(); step(0.1);
      R('the potting deck still sees down the middle walk to mid over the hedge with both gates grown (a kid\'s chest, 1 m up)', midSeen && k / n >= 0.6, { midSeen, middleWalkSeen: Math.round((100 * k) / n) + ' %' });
    }

    // ---- every canopy: what its platform overlooks (the share of the zone / the track it has a line of sight to, and
    // how far above), a kid stands on it; nothing near to hop onto it from
    const zonePolys = [];
    const zs = L.layout.zones; for (const z of zs.center || []) for (const q of z.polys || [z.poly]) zonePolys.push({ name: 'the centre zone', poly: q, y: z.y0 ?? 1.3 });
    for (const q of zs.side.polys || [zs.side.poly]) { zonePolys.push({ name: 'Alpha\'s side zone', poly: q, y: zs.side.y0 ?? 1.3 }); zonePolys.push({ name: 'Bravo\'s side zone', poly: q.map(([x, z]) => [-x, -z]), y: zs.side.y0 ?? 1.3 }); }
    const inPoly = (x, z, Q) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, zi] = Q[i], [xj, zj] = Q[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    const trk = L.layout.tower && L.layout.tower.path;
    const canRep = []; let canOk = true;
    const tg = new THREE.Vector3();
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
      if (trk) {
        let n = 0, k = 0, dmin = Infinity;
        const pts = [];
        const seg = (a, b) => { const ax = a[0], az = a[a.length - 1], bx = b[0], bz = b[b.length - 1], L0 = Math.hypot(bx - ax, bz - az); for (let s = 0; s <= L0; s += 1) pts.push([ax + ((bx - ax) * s) / L0, az + ((bz - az) * s) / L0]); };
        for (let i = 1; i < trk.length; i++) { seg(trk[i - 1], trk[i]); seg(trk[i - 1].map((c, j) => (j === 1 && trk[i - 1].length === 3 ? c : -c)), trk[i].map((c, j) => (j === 1 && trk[i].length === 3 ? c : -c))); }
        for (const [x, z] of pts) { const dd = Math.hypot(x - p.x, z - p.z); if (dd > 18) continue; n++; dmin = Math.min(dmin, dd); if (sees(x, L.groundHeight(x, z, 6), z)) k++; }
        if (n) seen.push({ what: 'the tower track (within 18 m)', dist: r1(dmin), sees: Math.round((100 * k) / n) + ' %', metres: n });
      }
      const kd = A[2];
      place(kd, W(p, 0.4, p.h + 0.1, 0.3)); step(0.6);
      const stands = kd.grounded && onPlant(kd, p) && !kd.roofT;
      let hi = -9;
      for (let a = 0; a < 24; a++) for (const rr of [2.0, 2.6, 3.2, 4.0]) { const x = p.x + Math.cos(a * Math.PI / 12) * rr, z = p.z + Math.sin(a * Math.PI / 12) * rr; const hh = Ph.raycast(v.set(x, p.y + 6, z), d.set(0, -1, 0), 7, undefined, false); if (hh.hit && !L.blocks[hh.block].roof && !L.blocks[hh.block].dynamic) hi = Math.max(hi, hh.point.y - p.y); }
      // (the parapet rails ring the deck at 3.0–3.4: from a floor 1.5 m up or less a kid can't clear them — it climbs
      // 1.8 m, not 1.9); and physically: an enemy kid hopping at it from all round never ends up on its platform
      let boarded = 0;
      const en = Bt.find((a) => a.bot) || Bt[0];
      for (let a = 0; a < 16; a++) {
        const an = (a * Math.PI) / 8, sx = p.x + Math.cos(an) * 3.2, sz = p.z + Math.sin(an) * 3.2, gh = L.groundHeight(sx, sz, p.y + 2.2);
        if (!Number.isFinite(gh)) continue;
        for (const jf of [0, 5, 10]) {
          en.spawnAt(V(sx, gh + 0.05, sz), 0); en.invuln = 99; const ei = en.intent; const dx = p.x - sx, dz = p.z - sz, dl = Math.hypot(dx, dz);
          for (let f = 0; f < 50; f++) { ei.move.set(dx / dl, 0, dz / dl); ei.jump = f >= jf && f < jf + 3; en.update(1 / 60); if (onPlant(en, p) && en.grounded) { boarded++; break; } }
          ei.move.set(0, 0, 0); ei.jump = false;
        }
      }
      home(en, 3);
      const ok = stands && hi <= 1.5 && boarded === 0 && seen.some((s) => parseInt(s.sees) >= 35);
      if (!ok) canOk = false;
      canRep.push({ canopy: p.id, at: [r1(p.x), r1(p.y), r1(p.z)], overlooks: seen, kidStands: stands, highestFloorNear: r2(hi), enemyBoarded: boarded });
      home(kd, 2); P.reset(); step(0.1);
    }
    R('every canopy overlooks something worth holding (a zone or the tower track: a real share of it in sight from its platform), a kid stands on it, and nothing near is high enough to climb onto it from', canOk, canRep);

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
    const pw = byId('footbridge-gate'), pc = byId('meadow');
    grown(pw, 0); grown(pc, 0);
    const cw = swimUp(A[1], pw, -1, 1.0, 0), cc = swimUp(A[1], pc, -1, 0.1, 0);
    const tintOk = [pw, pc].every((p) => p.look && p.look.team[0].every((x) => x.visible && x.userData.tint === __G.teamColors[0].getHexString()));
    R('the owners swim up both kinds here (the footbridge gate onto its top, the meadow canopy\'s root curtain onto its platform); the looks wear the grower\'s ink',
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
    const pg = byId('footbridge-gate');
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
    // the rill hedge and its gates (both halves) clear the track: the platform's half width + 0.5 m
    const rects = [];
    for (const sg of [1, -1]) rects.push({ id: sg > 0 ? 'Alpha\'s rill hedge' : 'Bravo\'s rill hedge', x0: sg > 0 ? RL.x0 : -RL.x1, x1: sg > 0 ? RL.x1 : -RL.x0, z: sg * RL.z, hz: 0.6 });
    const T = m.tower;
    let worst = Infinity, at = null;
    for (let sp = -T.path.len[1]; sp <= T.path.len[0]; sp += 0.4) {
      const q = T.path.at(sp, new THREE.Vector3());
      for (const b of rects) { const dd = Math.hypot(Math.max(0, b.x0 - q.x, q.x - b.x1), Math.max(0, Math.abs(q.z - b.z) - b.hz)); if (dd < worst) { worst = dd; at = b.id; } }
    }
    R('Tower Command: the rill hedge and its gates clear the track (the platform\'s half width + 0.5 m)', worst > 1.25 + 0.5, { nearest: r2(worst), at });
  }
  if (m.mode === 'boss') {
    const Bs = __G.boss, nv = Bs && Bs.nav;
    // (HULLBREAKER parked and still while the plants grow: roaming, it would walk into one first)
    const bm = Bs.move, bp = Bs.pos.clone(), by0 = Bs.yaw; Bs.move = null; Bs.pos.set(0, Bs.pos.y, 30);
    const res = [];
    for (const p of P.pods) {
      const before = nv.dynWall(p.x, p.z, 1.5);
      P.grow(p, 0, P.t - 1); step(2 / 60);
      res.push([p.id, before, nv.dynWall(p.x + p.s * (p.hd + 1.2), p.z + p.c * (p.hd + 1.2), 1.5)]);
    }
    R('Boss Battle: every grown plant stops HULLBREAKER\'s charge like a wall (the charge asks dynWall)', res.every(([, b, a]) => !b && a), res);
    const pb = byId('meadow');
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
