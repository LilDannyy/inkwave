// [b5-sub-dash] The dash-reach audit (SPEC D10.6): the Dash Pellet must not open up a roof, a perch or an out-of-bounds
// spot. Any stage:
//   MAP=<id> MODE=turf PAGE=tools/botlab/tests/dash-reach.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS: 'dt=24' runs the movement at 1/24 s a step (default 1/60); 'step=2' takes every 2nd start (a quick look)
// What: the nodes a kid reaches on foot (the stage's nav graph from both spawn pads: walks, jumps, drops, climbs); of
// those, the ones by a change of level or a drop within 6 m (where a dash could lead somewhere new). From each, a kid
// stepped on its own (actor.update, the real dash) tries, in 8 headings: a ground dash (off a ledge too, when there is
// one), and a jump with an air dash on its rise, at its apex and on its fall. Where each comes to rest:
//   on foot ground       a nav node the kid reaches on foot anyway: fine
//   a roof               an off-limits top: it slides off (counted, harmless)
//   a stranded node      a nav node NOT reachable on foot, higher than the start: a leak — unless a plain walk or hop
//                        from the same start, or from any spot reached on foot within 5 m of it, lands there too (then
//                        the nav graph just lacks the edge: its jump edges are short; listed). Lower
//                        than the start: listed (a walk off that edge drops there too; the graph lacks the drop)
//   off the graph        no nav node there (a narrow top, a kerb …): listed for the lead with its height over the start
//   out of bounds        a leak
//   the sea / lava       the player's own risk (counted)
// Pass: no leak, nothing out of bounds.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const THREE = await import('three'); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { PLAYER, SUBS } = await import('./src/config.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const args = Object.fromEntries((window.__pageArgs || '').split(/[;,&]/).filter(Boolean).map((kv) => kv.split('=')));
  const DT = args.dt ? 1 / +args.dt : 1 / 60, EVERY = +(args.step || 1);
  const L = G.level, nav = G.nav, N = nav.nodes, r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
  dbg.freeze();
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  const kid = m.actors.find((a) => a.bot && !a.isLocal) || m.actors.find((a) => a.bot), it = kid.intent;
  m.actors.forEach((a, i) => { if (a !== kid) { a.update = () => {}; } });
  kid.setSub('dash'); kid.setWeapon('shooter');
  const t0 = performance.now();
  // ---- on foot: the nav graph's reach from both pads
  const reach = new Uint8Array(N.length);
  for (const pad of L.spawnPads) {
    let s = -1, sd = Infinity;
    for (const n of N) { const d = (n.x - pad.x) ** 2 + (n.z - pad.z) ** 2 + ((n.y - pad.y) * 3) ** 2; if (d < sd) { sd = d; s = n.id; } }
    if (s < 0) continue;
    const st = [s]; reach[s] = 1;
    while (st.length) { const k = st.pop(); for (const e of N[k].nb) if (!reach[e.to]) { reach[e.to] = 1; st.push(e.to); } }
  }
  const nodeAt = (p) => {
    const ix = Math.round((p.x - nav.x0) / nav.step), iz = Math.round((p.z - nav.z0) / nav.step);
    let best = -1, bd = 1e9;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
      for (const id of nav.cells[jz * nav.nx + jx]) { const n = N[id]; if (Math.abs(n.y - p.y) > 0.55) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < 0.95 && d < bd) { bd = d; best = id; } }
    }
    return best;
  };
  // ---- the starts: reachable nodes near a change of level (or a drop / the sea) within 6 m in some heading
  const DIRS = []; for (let k = 0; k < 8; k++) DIRS.push([Math.sin((k * Math.PI) / 4), Math.cos((k * Math.PI) / 4)]);
  const starts = [];
  for (const n of N) {
    if (!reach[n.id]) continue;
    let edge = false;
    for (const [dx, dz] of DIRS) { for (const s of [1.5, 3, 4.5, 6]) { const gy = L.groundHeight(n.x + dx * s, n.z + dz * s, n.y + 2.2); if (gy === -Infinity || Math.abs(gy - n.y) > 0.3) { edge = true; break; } } if (edge) break; }
    if (edge) starts.push(n);
  }
  const use = starts.filter((_, i) => i % EVERY === 0);
  // ---- the kid
  const put = (n) => { kid.spawnAt(V(n.x, n.y + 0.02, n.z), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false; for (let i = 0; i < 2; i++) { G.time += DT; kid.update(DT); } };
  const onRoof = () => kid.grounded && kid.ground && L.blocks[kid.ground.block] && L.blocks[kid.ground.block].roof;
  // a move from n along d: kind 'g' a ground dash, 'h' a plain hop, 'w' a walk, or a frame number: jump, air dash then
  const move = (n, d, kind) => {
    put(n);
    if (!kid.grounded) return null;
    // (a running start for the hop and the jumps: already at run speed along d — a hop from a standstill would make the
    // baseline look shorter than what a player does)
    if (kind !== 'g' && kind !== 'w') kid.vel.set(d[0] * PLAYER.runSpeed, 0, d[1] * PLAYER.runSpeed);
    const fr = (f) => Math.round(f / (60 * DT));   // a 60 Hz frame count at this step
    let i = 0, ok = true, roofT = null;
    const tick = (w) => { it.move.set(w.move ? d[0] : 0, 0, w.move ? d[1] : 0); it.jump = !!w.jump; it.sub = !!w.sub; G.time += DT; kid.update(DT); i++; if (!kid.alive) ok = false; else if (!roofT && onRoof()) roofT = kid.pos.clone(); return ok; };
    if (kind === 'g') { tick({ sub: true, move: true }); for (let k = 0; k < fr(16) && ok; k++) tick({ move: false }); }
    else if (kind === 'w') { for (let k = 0; k < fr(16) && ok; k++) tick({ move: true }); }
    else if (kind === 'h') { for (let k = 0; k < fr(54) && ok; k++) { tick({ move: true, jump: k < 2 }); if (k > fr(6) && kid.grounded && !onRoof()) break; } }
    else {   // a running jump, the air dash the same way (the furthest it goes); the stick held only until it lands (never a
             // walk on up a ramp or a stair after it: what's measured is where the dash put it)
      const f = fr(kind); for (let k = 0; k <= f && ok; k++) tick({ move: true, jump: k < 2, sub: k === f });
      for (let k = 0; k < fr(30) && ok && (!kid.grounded || kid.weaponRunner.dashT > 0); k++) tick({ move: true });
    }
    for (let k = 0; k < fr(90) && ok && (!kid.grounded || onRoof() || kid.weaponRunner.dashT > 0); k++) tick({});
    if (!ok) return { dead: true, roofT };
    const gb = kid.grounded && kid.ground ? L.blocks[kid.ground.block] : null;
    return { pos: kid.pos.clone(), roof: onRoof(), grounded: kid.grounded, roofT, perch: !!(gb && gb.perch), block: gb ? gb.id : -1 };
  };
  const B = L.bounds, inB = (p) => p.x >= B.minX - 0.5 && p.x <= B.maxX + 0.5 && p.z >= B.minZ - 0.5 && p.z <= B.maxZ + 0.5;
  const count = { sims: 0, maxUp: -99, onFoot: 0, roof: 0, roofTouch: 0, perch: 0, perchOnFoot: 0, sea: 0, air: 0, stranded: 0, strandedBaseline: 0, strandedDown: 0, offGraph: 0, oob: 0 };
  const leaks = [], offs = [], strandedOk = [], oob = [], down = [], roofs = [], perches = [], perchOk = new Map();
  const KINDS = ['g', 4, 18, 30];
  for (const n of use) {
    for (const d of DIRS) for (const kind of KINDS) {
      count.sims++;
      const r = move(n, d, kind);
      if (!r) continue;
      if (r.roofT) { count.roofTouch++; if (roofs.length < 200) roofs.push({ from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: kind === 'g' ? 'ground dash' : `air dash at frame ${kind}`, roofAt: [r1(r.roofT.x), r2(r.roofT.y), r1(r.roofT.z)] }); }
      if (r.dead) { count.sea++; continue; }
      if (!r.grounded) { count.air++; continue; }
      if (r.roof) { count.roof++; continue; }
      const p = r.pos, what = { from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: kind === 'g' ? 'ground dash' : `air dash at frame ${kind}`, to: [r1(p.x), r2(p.y), r1(p.z)], up: r2(p.y - n.y) };
      if (!inB(p)) { count.oob++; oob.push(what); continue; }
      if (r.perch) {
        // a perch (a crane top …): a leak unless a plain walk or hop from some spot reached on foot gets onto that block too
        if (!perchOk.has(r.block)) {
          let by = false;
          const near = N.filter((q) => reach[q.id] && Math.hypot(q.x - p.x, q.z - p.z) < 5 && p.y - q.y < 2.4).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
          for (const q of near.slice(0, 30)) { for (const dd of DIRS) for (const k2 of ['h', 'w']) { if (by) break; const qq = move(q, dd, k2); if (qq && qq.block === r.block) by = true; } if (by) break; }
          perchOk.set(r.block, by);
        }
        if (perchOk.get(r.block)) count.perchOnFoot++; else { count.perch++; perches.push({ ...what, block: r.block, tag: L.blocks[r.block]?.tag || null }); }
        continue;
      }
      const id = nodeAt(p);
      if (id >= 0 && reach[id]) { count.onFoot++; continue; }
      if (p.y - n.y > count.maxUp) { count.maxUp = r2(p.y - n.y); count.maxUpAt = what; }   // (how high over its start, of the landings a walk doesn't reach: a ground dash up a stair is a walk)
      if (id >= 0) {
        // a node the graph says isn't reachable: does a plain walk or hop from here land on it too?
        let base = false;
        for (const dd of DIRS) { for (const k2 of ['w', 'h']) { const q = move(n, dd, k2); if (q && q.pos && nodeAt(q.pos) === id) { base = true; break; } } if (base) break; }
        if (base) { count.strandedBaseline++; if (strandedOk.length < 12) strandedOk.push(what); }
        else if (p.y - n.y > 0.3) { count.stranded++; leaks.push(what); }       // up onto a top the graph can't reach: a leak
        else { count.strandedDown++; if (down.length < 300) down.push(what); }   // down into a spot the graph doesn't reach (a walk off its edge goes there too)
        continue;
      }
      count.offGraph++;
      if (offs.length < 400) offs.push(what);
    }
  }
  // a leak's top, looked at again: does a plain walk or hop from ANY spot reached on foot within 5 m of it land on it?
  // (the graph's jump edges are short: a top a kid hops onto from beside it isn't in its reach either)
  const tops = new Map();
  for (const l of leaks) { const id = nodeAt(V(l.to[0], l.to[1], l.to[2])); if (id >= 0 && !tops.has(id)) tops.set(id, l); }
  const realLeaks = [], hopOn = [];
  for (const [id, l] of tops) {
    const T = N[id]; let by = null;
    const near = N.filter((q) => reach[q.id] && Math.hypot(q.x - T.x, q.z - T.z) < 5 && T.y - q.y < 2.4 && T.y - q.y > -0.5).sort((a, b) => Math.hypot(a.x - T.x, a.z - T.z) - Math.hypot(b.x - T.x, b.z - T.z));
    for (const q of near.slice(0, 40)) {
      for (const dd of DIRS) { for (const k2 of ['h', 'w']) { const r = move(q, dd, k2); if (r && r.pos && nodeAt(r.pos) === id) { by = { from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: k2 === 'h' ? 'hop' : 'walk' }; break; } } if (by) break; }
      if (by) break;
    }
    if (by) hopOn.push({ top: [r1(T.x), r2(T.y), r1(T.z)], dashFrom: l.from, onFootBy: by });
    else realLeaks.push(l);
  }
  count.stranded = realLeaks.length; count.strandedHopOn = hopOn.length;
  kid.setSub('bomb');
  for (const a of m.actors) { delete a.update; if (a.bot) delete a.bot.update; }
  // off the graph: the distinct spots (0.5 m), highest first
  const seen = new Map(); for (const o of offs) { const k = Math.round(o.to[0] * 2) + ',' + Math.round(o.to[2] * 2) + ',' + Math.round(o.to[1] * 2); if (!seen.has(k)) seen.set(k, o); }
  const spots = [...seen.values()].sort((a, b) => b.up - a.up);
  const ms = Math.round(performance.now() - t0);
  const roofSeen = new Map(); for (const o of roofs) { const k = Math.round(o.roofAt[0]) + ',' + Math.round(o.roofAt[2]); if (!roofSeen.has(k)) roofSeen.set(k, o); }
  R(`${g.mapDef?.id}: no dash (ground, off a ledge, air on a running jump's rise / apex / fall; 8 headings; dt 1/${Math.round(1 / DT)}) from ${use.length} edge nodes reached on foot (of ${starts.length}; ${N.length} nodes) comes to rest on a perch a kid can't get onto on foot, or out of bounds, or higher than a jump (1.9 m) over its start; a roof it touches slides it off (never a place to stay)`,
    perches.length === 0 && oob.length === 0 && count.roof === 0 && count.maxUp <= 1.9, { count, perchBlocks: [...new Set(perches.map((q) => q.block))].map((b) => { const B = L.blocks[b], Q = perches.filter((q) => q.block === b); return { block: b, top: [r1(B.center.x), r2(B.center.y + B.half.y), r1(B.center.z)], by: [...new Set(Q.map((q) => q.move))], from: Q[0].from }; }), perches: perches.slice(0, 4), oob: oob.slice(0, 8), roofsTouched: [...roofSeen.values()].slice(0, 6), ms });
  R(`${g.mapDef?.id}: tops the nav graph doesn't reach that a dash lands on and no plain walk / hop from within 5 m does (${realLeaks.length}; the lead's list — none is higher than a jump reaches: the dash adds no height)`, true,
    { tops: realLeaks.slice(0, 16), topsAKidHopsOnto: hopOn.length });
  const downSeen = new Map(); for (const o of down) { const k = Math.round(o.to[0]) + ',' + Math.round(o.to[2]); if (!downSeen.has(k)) downSeen.set(k, o); }
  R(`${g.mapDef?.id}: landings off the nav graph (${spots.length} distinct spots; highest over their start first), and drops into nav nodes the graph doesn't reach (${downSeen.size} spots) — for the lead's look`, true,
    { offGraphTop: spots.slice(0, 10), downInto: [...downSeen.values()].slice(0, 8), strandedButReachedOnFoot: strandedOk.slice(0, 4) });
  return out;
})();
