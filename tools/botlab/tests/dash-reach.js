// [b5-sub-dash] The dash-reach audit (SPEC D10.6): the Dash Pellet must not open up a roof, a perch or an out-of-bounds
// spot. Any stage:
//   MAP=<id> MODE=turf PAGE=tools/botlab/tests/dash-reach.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS: 'dt=24' runs the movement at 1/24 s a step (default 1/60); 'step=4;off=1' takes every 4th edge node from
//   the 2nd (a stage's full audit is step=N run once for each off=0 … N−1: the parts tile every edge node exactly once);
//   'air=2.5' a what-if air dash length (this run only); 'climb=0' leaves out the wall-climb dashes. Cargo Terminal
//   (humans only, online only) boots offline with DEVSTAGE=1.
// What: the nodes a kid reaches on foot (the stage's nav graph from both spawn pads: walks, jumps, drops, climbs); of
// those, the ones by a change of level or a drop within 6 m (where a dash could lead somewhere new). From each, a kid
// stepped on its own (actor.update, the real dash) tries, in 8 headings: a ground dash (off a ledge too, when there is
// one), and a running jump with an air dash on its rise, at its apex and on its fall. Where a wall ≥ 1.6 m tall stands
// within 1.2 m in that heading, also: the wall inked, a squid climb up it, and at 1 m up and just under its top a sub
// press (SPEC D1.5: the press makes it a kid off the wall, an air dash) along the wall both ways, away from it both
// diagonals, and straight off it. Where each comes to rest:
//   on foot ground       a nav node the kid reaches on foot anyway: fine
//   a roof               an off-limits top: it slides off (counted). Still on one after 3 s (its slide stalled): a LEAK
//                        unless a kid gets onto that roof block on foot anyway — a plain walk / hop (16 headings) or a plain
//                        climb up an inkable wall (8 headings) from the move's start or a spot reached on foot within 5 m of
//                        where it first touched a roof, or the same climb, touches it (then the slide is the stage's
//                        business: listed for the lead)
//   a perch              a walkable, never-inkable lookout: a LEAK unless its piece (the perch blocks a kid walks between:
//                        a reach stacker's boom is a stair of them) is reached on foot — a plain running hop or walk (16
//                        headings) from a spot reached on foot within 6 m gets onto any block of it (or, off a wall, the
//                        same climb without the dash does)
//   a stranded node      a nav node NOT reachable on foot, higher than the start: listed for the lead (SPEC D10.6: "list
//                        any spot newly reachable") unless a plain walk / hop from within 5 m (or the same climb) lands
//                        there too (16 headings), then it's only the graph lacking an edge. Lower than the start: a drop
//   off the graph        no nav node there (a narrow top, a kerb …): listed for the lead
//   out of bounds        a LEAK unless a plain walk or hop from nearby (or the same climb) ends past the line too, or on the
//                        same block within 1 m of it
//   the sea / lava       the player's own risk (counted)
// And the height, for EVERY ground dash and jump + dash whatever it comes to rest on (on-foot ground, a roof, a perch,
// past the line, the sea): where it first comes down after leaving the ground, over the kid's own standing height at
// the start, must be no higher than a plain running hop ever gets — HOP_BEST, measured by sub-dash.js 'height' to
// 0.01 m — + 0.02 m (the spec's own ± 0.02 for heights), unless a jump gets there as high without the dash: the same
// running hop from the same start and heading (hopAsHigh), or a plain hop / walk from a spot reached on foot within 6 m
// of the block it first came down on, coming down on that block as high (hopAsHighNear: a top a jump reaches, which the
// dash's flatter arc reached from further off). (A climb's height is the wall's: the dashes off one aren't judged.)
// Pass: no perch leak, no out-of-bounds leak, no kid stuck on a roof where no plain walk / hop gets stuck, no first
// landing over the height bar.
// [b5-int3] the moves that reach furthest (the sub-dash review's four points), on top of the above:
//   swim jump + air dash  from own ink at swim speed (11.8 m/s), squid held until the press, presses at frames 18 / 30 /
//                         38 / 46 / 56; its height judged against a plain swim jump from the same start and heading (as a
//                         running jump's is against the plain running hop). The kid's paint is cleared before every swim
//                         move and only a lane under its start inked, so a held squid can't climb a wall the last move inked
//   late presses          an air dash late in a long fall: the running jump pressed at frames 36 / 42 / 48 / 54 / 60 / 66
//                         while the plain running hop from there is still in the air then (off a ledge: the vy clamp
//                         arrests a fast fall, so the late press goes furthest)
//   climb dash at the top toward the wall: just under its edge, the dash straight into the wall (over its top)
// ('swim=0' leaves the swim kinds out; 'late=0' the late presses.)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const THREE = await import('three'); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { PLAYER, SUBS } = await import('./src/config.js');
  const { Hit } = await import('./src/game/physics.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const args = Object.fromEntries((window.__pageArgs || '').split(/[;,&]/).filter(Boolean).map((kv) => kv.split('=')));
  const DT = args.dt ? 1 / +args.dt : 1 / 60, EVERY = +(args.step || 1), OFF = +(args.off || 0), CLIMB = args.climb !== '0';
  // (sub-dash.js 'height', 30 run-ups, to 0.01 m: a plain running hop lands on 1.90 m at 1/60, 1.86 m at 1/24)
  const HOP_BEST = Math.abs(DT - 1 / 24) < 1e-9 ? 1.86 : 1.9, BAR = Math.round((HOP_BEST + 0.02) * 100) / 100;
  const air0 = SUBS.dash.airDashDist; if (args.air) SUBS.dash.airDashDist = +args.air;   // ('air=2.5': a what-if air dash length, this run only)
  const AIR = SUBS.dash.airDashDist;
  const L = G.level, nav = G.nav, N = nav.nodes, r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
  dbg.freeze();
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  // (a bot; on a humans-only stage — Cargo Terminal, booted offline with DEVSTAGE=1 — the local kid, stepped the same way)
  const kid = m.actors.find((a) => a.bot && !a.isLocal) || m.actors.find((a) => a.bot) || m.local, it = kid.intent;
  m.actors.forEach((a) => { if (a !== kid) { a.update = () => {}; } });
  kid.setSub('dash'); kid.setWeapon('shooter');
  // a splat only ends the move: the kid is marked dead, nothing else. (The real one feeds the HUD a "was splatted" pill,
  // a death mark and its effects, and the page's timers never run inside this synchronous loop: on a sea-heavy stage the
  // pills piled up by the thousand and every later splat queried them all — halyard's runs slowed ~4x as they went)
  kid.splat = function () { if (!this.alive) return; this.alive = false; this.hp = 0; this.climbing = false; this.specialActive = null; };
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
  const DIRS16 = []; for (let k = 0; k < 16; k++) DIRS16.push([Math.sin((k * Math.PI) / 8), Math.cos((k * Math.PI) / 8)]);   // (the baselines: a plain walk / hop in 16 headings)
  const starts = [];
  for (const n of N) {
    if (!reach[n.id]) continue;
    let edge = false;
    for (const [dx, dz] of DIRS) { for (const s of [1.5, 3, 4.5, 6]) { const gy = L.groundHeight(n.x + dx * s, n.z + dz * s, n.y + 2.2); if (gy === -Infinity || Math.abs(gy - n.y) > 0.3) { edge = true; break; } } if (edge) break; }
    if (edge) starts.push(n);
  }
  const use = starts.filter((_, i) => i % EVERY === OFF).slice(+(args.skip || 0), args.max ? +(args.skip || 0) + +args.max : Infinity);   // ('skip=<k>;max=<n>': n starts from the k-th, a diagnostic)
  // ---- the kid
  let startY = 0;
  const put = (n) => { LH = null; kid.spawnAt(V(n.x, n.y + 0.02, n.z), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false; for (let i = 0; i < 2; i++) { G.time += DT; kid.update(DT); } startY = kid.pos.y; };
  const onRoof = () => kid.grounded && kid.ground && L.blocks[kid.ground.block] && L.blocks[kid.ground.block].roof;
  const fr = (f) => Math.max(1, Math.round(f / (60 * DT)));   // a 60 Hz frame count at this step
  // the end of a move: wait out a roof's slide, a fall, the dash (≤ 3 s), and read where it came to rest
  const settle = (st) => {
    for (let k = 0; k < fr(180) && st.ok && (!kid.grounded || onRoof() || kid.weaponRunner.dashT > 0); k++) st.tick({});
    if (!st.ok) return { dead: true, roofT: st.roofT, roofs: st.roofs, landY: st.landY, landBlock: st.landBlock, landAt: st.landAt, y0: startY };
    const gb = kid.grounded && kid.ground ? L.blocks[kid.ground.block] : null;
    return { pos: kid.pos.clone(), roof: onRoof(), grounded: kid.grounded, roofT: st.roofT, roofs: st.roofs, perch: !!(gb && gb.perch), block: gb ? gb.id : -1, landY: st.landY, landBlock: st.landBlock, landAt: st.landAt, y0: startY };
  };
  // the first landing is caught inside the move's substeps (a dash runs 3–7 a frame): a frame that lands on a stair's
  // first step and steps on up it at dash speed comes down where it first touched, not where the frame ended
  const integ0 = kid._integrate; let LH = null;
  kid._integrate = function (dt, sq, j) { integ0.call(this, dt, sq, j); const s = LH; if (s) { if (!this.grounded) s.wasAir = true; else if (s.wasAir && s.landY === null) { s.landY = this.pos.y; s.landBlock = this.ground.block; s.landAt = this.pos.clone(); } } };
  const ticker = (mv) => {
    const st = { ok: true, roofT: null, roofs: null, wasAir: false, landY: null, landBlock: -1, landAt: null, i: 0 };
    LH = st;
    // (landY: where it first comes down after leaving the ground — the height the jump + dash got it to; a dash that
    // carries on along the ground after that, up a ramp or a stair, is a run, judged by where it ends like any walk)
    st.tick = (w) => {
      const q = w.dir || mv;
      it.move.set(w.move ? q[0] : 0, 0, w.move ? q[1] : 0); it.jump = !!w.jump; it.sub = !!w.sub; it.squid = !!w.squid;
      G.time += DT; kid.update(DT); st.i++;
      if (!kid.alive) st.ok = false;
      else if (onRoof()) { if (!st.roofT) st.roofT = kid.pos.clone(); (st.roofs || (st.roofs = new Set())).add(kid.ground.block); }
      return st.ok;
    };
    return st;
  };
  // a move from n along d: kind 'g' a ground dash, 'h' a plain hop, 'w' a walk, or a frame number: jump, air dash then
  const move = (n, d, kind) => {
    put(n);
    if (!kid.grounded) return null;
    // (a running start for the hop and the jumps: already at run speed along d — a hop from a standstill would make the
    // baseline look shorter than what a player does)
    const swim = typeof kind === 'string' && kind[0] === 's';
    if (swim) {
      // ([b5-int3] a swim jump: the kid's paint cleared first — a held squid climbs any wall it touches in its own ink, and
      // the last move's inked walls polluted the review's swim copy — then a lane of own ink under its start, the kid a
      // squid in it already at swim speed along d)
      G.paint.clear?.();
      for (const k of [-1.2, 0, 1.2]) G.paint.splat(V(n.x + d[0] * k, n.y + 0.1, n.z + d[1] * k), 1.0, kid.team, { instant: true, seed: 0.5 });
      kid.form = 'squid'; it.squid = true;
      for (let i = 0; i < 2; i++) { G.time += DT; kid.update(DT); }
      kid.vel.set(d[0] * PLAYER.swimSpeed, 0, d[1] * PLAYER.swimSpeed);
    }
    else if (kind !== 'g' && kind !== 'w') kid.vel.set(d[0] * PLAYER.runSpeed, 0, d[1] * PLAYER.runSpeed);
    const st = ticker(d);
    if (kind === 'g') { st.tick({ sub: true, move: true }); for (let k = 0; k < fr(16) && st.ok; k++) st.tick({ move: false }); }
    else if (kind === 'w') { for (let k = 0; k < fr(16) && st.ok; k++) st.tick({ move: true }); }
    else if (kind === 'h') { for (let k = 0; k < fr(54) && st.ok; k++) { st.tick({ move: true, jump: k < 2 }); if (k > fr(6) && kid.grounded && !onRoof()) break; } }
    else if (swim) {   // [b5-int3] the swim jump (squid held until the press, then the stick only until it lands); 'sj': no press
      const f = kind === 'sj' ? Infinity : fr(+kind.slice(1));
      for (let k = 0; k < fr(80) && st.ok; k++) {
        const press = k === f;
        st.tick({ move: true, jump: k < 2, squid: k < f && !press, sub: press });
        if (k > fr(6) && kid.grounded && !onRoof() && (kind === 'sj' || k > f) && kid.weaponRunner.dashT <= 0) break;
      }
    }
    else {   // a running jump, the air dash the same way (the furthest it goes); the stick held only until it lands (never a
             // walk on up a ramp or a stair after it: what's measured is where the dash put it)
      const f = fr(kind); for (let k = 0; k <= f && st.ok; k++) st.tick({ move: true, jump: k < 2, sub: k === f });
      for (let k = 0; k < fr(30) && st.ok && (!kid.grounded || kid.weaponRunner.dashT > 0); k++) st.tick({ move: true });
    }
    return settle(st);
  };
  // [b5-int3] how many 60 Hz frames the plain running hop from n along d stays in the air (the late presses go only while it's
  // still falling), once per start and heading
  const airF = new Map();
  const airFrames = (n, d) => {
    const key = n.id * 8 + DIRS.findIndex((q) => q[0] === d[0] && q[1] === d[1]);
    if (airF.has(key)) return airF.get(key);
    put(n);
    let k = 0;
    if (kid.grounded) {
      kid.vel.set(d[0] * PLAYER.runSpeed, 0, d[1] * PLAYER.runSpeed);
      const st = ticker(d);
      for (; k < fr(120) && st.ok; k++) { st.tick({ move: true, jump: k < 2 }); if (k > fr(6) && kid.grounded) break; }
      LH = null;
    }
    const f = Math.round(k * 60 * DT);
    airF.set(key, f);
    return f;
  };
  // ---- off a wall: an inkable wall ≥ 1.6 m tall within 1.2 m of n in heading d → its face, normal and top height
  const H = new Hit(), H2 = new Hit(), DIR = V(0, 0, 0), O = V(0, 0, 0);
  const walls = new Map();
  const wallAt = (n, d) => {
    DIR.set(d[0], 0, d[1]);
    const h = G.physics.raycast(O.set(n.x, n.y + 0.3, n.z), DIR, 1.2, H);
    if (!h.hit || Math.abs(h.normal.y) > 0.5) return null;
    const h2 = G.physics.raycast(O.set(n.x, n.y + 1.6, n.z), DIR, 1.6, H2);
    if (!h2.hit || Math.abs(h2.normal.y) > 0.5) return null;
    let top = n.y + 1.6;
    for (let y = n.y + 2.1; y < n.y + 14; y += 0.5) { const h3 = G.physics.raycast(O.set(n.x, y, n.z), DIR, 1.8, H2); if (!h3.hit || Math.abs(h3.normal.y) > 0.5) break; top = y; }
    return { p: h.point.clone(), n: h.normal.clone(), top };
  };
  // paint the wall's face (own ink, instantly) from its foot to its top, where the climb goes
  const inkWall = (w) => { for (let y = w.p.y - 0.2; y <= w.top + 0.6; y += 0.7) G.paint.splat(V(w.p.x + w.n.x * 0.1, y, w.p.z + w.n.z * 0.1), 1.0, kid.team, { instant: true, seed: 0.5 }); };
  // a climb from n up the wall in heading d: 'mid' (1 m up) or 'top' (just under its edge), then a dash along q; q null:
  // the plain climb (no dash): on over the top
  const climbMove = (n, d, w, at, q) => {
    put(n);
    if (!kid.grounded) return null;
    const st = ticker(d);
    let k = 0;
    for (; k < fr(60) && st.ok && !kid.climbing; k++) st.tick({ squid: true, move: true });
    if (!kid.climbing) return { noClimb: true };
    const wn = kid.wallN.clone(), up = V(0, 0, 0);
    const nearTop = () => !G.physics.raycast(O.set(kid.pos.x, kid.pos.y + 0.85, kid.pos.z), up.set(-wn.x, 0, -wn.z), PLAYER.radius + 0.45, H2).hit;
    if (q) {
      for (k = 0; k < fr(240) && st.ok && kid.climbing; k++) { if (at === 'mid' ? kid.pos.y >= startY + 1.0 : nearTop()) break; st.tick({ squid: true, move: true }); }
      if (!kid.climbing) return { lost: true };   // (off the wall before that height: over its top, or its ink ran out)
      // the press: swim still held, the sub the latest press (a kid off the wall), the stick along the dash
      const dq = [q[0], q[1]];
      st.tick({ squid: true, sub: true, move: true, dir: dq });
      for (k = 0; k < fr(40) && st.ok && (!kid.grounded || kid.weaponRunner.dashT > 0); k++) st.tick({ move: true, dir: dq });
    } else {
      for (k = 0; k < fr(240) && st.ok && (kid.climbing || !kid.grounded); k++) st.tick({ squid: true, move: true });
      for (k = 0; k < fr(10) && st.ok; k++) st.tick({ move: true });
    }
    return settle(st);
  };
  const B = L.bounds, inB = (p) => p.x >= B.minX - 0.5 && p.x <= B.maxX + 0.5 && p.z >= B.minZ - 0.5 && p.z <= B.maxZ + 0.5;
  const count = { sims: 0, climbSims: 0, walls: 0, noClimb: 0, climbed: 0, oobOnFoot: 0, maxUp: -99, judgedUp: 0, hopAsHigh: 0, hopAsHighNear: 0, onFoot: 0, roof: 0, roofOnFoot: 0, roofTouch: 0, perch: 0, perchOnFoot: 0, sea: 0, air: 0, stranded: 0, strandedBaseline: 0, strandedDown: 0, offGraph: 0, oob: 0 };
  const leaks = [], offs = [], strandedOk = [], oob = [], down = [], roofs = [], onRoofs = [], roofsOnFoot = [], roofReach = new Map(), perches = [], perchOk = new Map();
  const KINDS = ['g', 4, 18, 30];
  const SWIM = args.swim !== '0', LATE = args.late !== '0';
  const SWIM_KINDS = ['s18', 's30', 's38', 's46', 's56'], LATE_KINDS = [36, 42, 48, 54, 60, 66];   // [b5-int3]
  const label = (kind) => (typeof kind === 'string' && kind.startsWith('c') ? kind.slice(2) : kind === 'g' ? 'ground dash' : kind === 'sj' ? 'plain swim jump' : typeof kind === 'string' && kind.startsWith('s') ? `swim jump, air dash at frame ${kind.slice(1)}` : `air dash at frame ${kind}`);
  // perch pieces: perch blocks a kid walks between (touching within 0.15 m, tops within a step, stepUp, of each other: a
  // reach stacker's boom is a stair of 0.3 m steps, kelpline/props.js) — a piece any of whose blocks a plain walk / hop
  // gets onto is reached on foot, all of it
  const PB = L.blocks.filter((b) => b.perch && b.solid !== false), ptop = (b) => b.aabbMax.y, piece = new Map();
  { const touch = (a, b) => a.aabbMin.x <= b.aabbMax.x + 0.15 && b.aabbMin.x <= a.aabbMax.x + 0.15 && a.aabbMin.z <= b.aabbMax.z + 0.15 && b.aabbMin.z <= a.aabbMax.z + 0.15 && Math.abs(ptop(a) - ptop(b)) <= PLAYER.stepUp;
    let nc = 0; for (const b of PB) { if (piece.has(b.id)) continue; const st = [b]; piece.set(b.id, nc); while (st.length) { const x = st.pop(); for (const y of PB) if (!piece.has(y.id) && touch(x, y)) { piece.set(y.id, nc); st.push(y); } } nc++; } }
  const pieceOk = new Map();
  // is a perch piece reached on foot? a plain running hop or walk (16 headings) from a spot reached on foot within 6 m of
  // any of its blocks (and < 2.4 m under its lowest top; the highest 80 such spots) lands on any block of it
  const pieceOnFoot = (pc) => {
    if (pieceOk.has(pc)) return pieceOk.get(pc);
    const bs = PB.filter((b) => piece.get(b.id) === pc), lo = Math.min(...bs.map(ptop));
    const ns = N.filter((q) => reach[q.id] && lo - q.y < 2.4 && bs.some((b) => Math.max(b.aabbMin.x - q.x, 0, q.x - b.aabbMax.x) ** 2 + Math.max(b.aabbMin.z - q.z, 0, q.z - b.aabbMax.z) ** 2 < 36)).sort((a, b) => b.y - a.y);
    let by = null;
    for (const q of ns.slice(0, 80)) { for (const dd of DIRS16) { for (const k2 of ['h', 'w']) { const qq = move(q, dd, k2); if (qq && qq.block >= 0 && piece.get(qq.block) === pc) { by = { from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: k2 === 'h' ? 'running hop' : 'walk', onto: qq.block }; break; } } if (by) break; } if (by) break; }
    pieceOk.set(pc, by);
    return by;
  };
  // where a plain walk or running hop from start n ends, 16 headings (the nav nodes), once per start
  const plainEnds = new Map();
  const plainFrom = (n) => {
    let S = plainEnds.get(n.id);
    if (!S) { S = new Set(); for (const dd of DIRS16) for (const k2 of ['w', 'h']) { const q = move(n, dd, k2); if (q && q.pos) S.add(nodeAt(q.pos)); } plainEnds.set(n.id, S); }
    return S;
  };
  const near = (p, lo = -99) => N.filter((q) => reach[q.id] && Math.hypot(q.x - p.x, q.z - p.z) < 5 && p.y - q.y < 2.4 && p.y - q.y > lo).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  // the height a ground dash or a jump + dash first came down at, over its start, wherever it then came to rest (r.landY:
  // null when it never left the ground — a floor, a ramp, a stair). Over the bar, the same running hop from the same
  // start and heading (no dash) is asked first: when it comes down as high or higher, that height is the jump's (at 1/24
  // a running jump from a basin floor can step up a kerb in its first frame), not the dash's
  // the highest a plain running hop or walk first comes down on block b, from the spots reached on foot within 6 m of it (and
  // under 2.4 m below its top; the highest 80, 16 headings each): once per block
  const hopBestOn = new Map();
  const blockHopBest = (b) => {
    if (hopBestOn.has(b)) return hopBestOn.get(b);
    const B0 = L.blocks[b]; let best = null;
    if (B0) {
      const ns = N.filter((q) => reach[q.id] && B0.aabbMax.y - q.y < 2.4 && Math.max(B0.aabbMin.x - q.x, 0, q.x - B0.aabbMax.x) ** 2 + Math.max(B0.aabbMin.z - q.z, 0, q.z - B0.aabbMax.z) ** 2 < 36).sort((a, c) => c.y - a.y).slice(0, 80);
      for (const q of ns) for (const dd of DIRS16) for (const k2 of ['h', 'w']) { const h = move(q, dd, k2); if (h && h.landY != null && h.landBlock === b && (!best || h.landY > best.y)) best = { y: h.landY, from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: k2 === 'h' ? 'running hop' : 'walk' }; }
    }
    hopBestOn.set(b, best);
    return best;
  };
  let maxUpMove = null;   // (the highest first landing's start and heading: its plain hops are told beside it at the end)
  const judgeUp = (n, d, kind, r) => {
    if (r.landY == null) return;
    count.judgedUp++;
    const upL = r.landY - r.y0;
    if (upL > BAR) {
      // the same running hop from the same start and heading, or a plain hop / walk from any spot reached on foot near the
      // block it first came down on, coming down on that block as high: then it's a top a jump reaches, not the dash's
      const h = move(n, d, typeof kind === 'string' && kind[0] === 's' && kind[1] !== 'j' ? 'sj' : 'h');   // ([b5-int3] a swim jump's: the plain swim jump)
      if (h && h.landY != null && h.landY >= r.landY - 0.02) {
        count.hopAsHigh++;
        if (!count.hopAsHighAt) count.hopAsHighAt = { from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: label(kind), landedAt: r2(r.landY), hopLandedAt: r2(h.landY), startY: r2(r.y0) };
        return;
      }
      const hb = r.landBlock >= 0 ? blockHopBest(r.landBlock) : null;
      if (hb && hb.y >= r.landY - 0.02) {
        count.hopAsHighNear++;
        if (!count.hopAsHighNearAt) count.hopAsHighNearAt = { from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: label(kind), landedAt: r2(r.landY), startY: r2(r.y0), block: r.landBlock, tag: bTag(r.landBlock), plainOnIt: { ...hb, y: r2(hb.y) } };
        return;
      }
    }
    if (upL > count.maxUp) {
      count.maxUp = r2(upL); maxUpMove = { n, d };
      count.maxUpAt = { from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: label(kind), landedAt: r2(r.landY), startY: r2(r.y0), restedAt: r.pos ? [r1(r.pos.x), r2(r.pos.y), r1(r.pos.z)] : 'the sea', block: r.block ?? -1, tag: r.block >= 0 ? bTag(r.block) : null };
    }
  };
  // where one move came to rest, sorted into the buckets above; plain: the same climb without the dash (off a wall)
  const classify = (n, d, kind, r, plain) => {
    if (!r) return;
    if (!plain) judgeUp(n, d, kind, r);   // (every ground dash and jump + dash, before the buckets)
    if (r.roofT) { count.roofTouch++; if (roofs.length < 200) roofs.push({ from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: label(kind), roofAt: [r1(r.roofT.x), r2(r.roofT.y), r1(r.roofT.z)] }); }
    if (r.dead) { count.sea++; return; }
    if (!r.grounded) { count.air++; return; }
    const what = { from: [r1(n.x), r2(n.y), r1(n.z)], dir: d.map(r2), move: label(kind), to: [r1(r.pos.x), r2(r.pos.y), r1(r.pos.z)], up: r2(r.pos.y - r.y0), block: r.block, tag: bTag(r.block) };
    const p = r.pos;
    const plainHere = (test) => { const q = plain && plain(); return !!(q && q.pos && test(q)); };
    if (r.roof) {
      // still on a roof after 3 s (its slide stalled, or a long one still going): a leak unless a kid gets onto that roof
      // block on foot anyway — a plain walk or hop (16 headings) or a plain climb up an inkable wall (8 headings) from a spot
      // reached on foot within 5 m, or the same climb, touches it; then how it slides is the stage's business (listed)
      // (from the move's own start, then the spots near where it first touched a roof: a slide can carry a kid far along a
      // long roof before it stalls)
      const touches = (q) => !!(q && q.roofs && q.roofs.has(r.block));
      let by = plainHere(touches) ? { move: 'the same climb' } : roofReach.get(r.block) || null;
      if (!by) {
        for (const q of [n, ...near(r.roofT || p).slice(0, 30)]) {
          for (const dd of DIRS16) for (const k2 of ['h', 'w']) { if (by) break; if (touches(move(q, dd, k2))) by = { from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: k2 === 'h' ? 'running hop' : 'walk' }; }
          for (const dd of DIRS) { if (by) break; const w = wallAt(q, dd); if (!w) continue; inkWall(w); if (touches(climbMove(q, dd, w, 'top', null))) by = { from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: 'climb' }; }
          if (by) break;
        }
        if (by) roofReach.set(r.block, by);
      }
      if (by) { count.roofOnFoot++; if (roofsOnFoot.length < 12 && !roofsOnFoot.some((x) => x.block === r.block)) roofsOnFoot.push({ ...what, onFootBy: by }); }
      else { count.roof++; if (onRoofs.length < 40) onRoofs.push(what); }
      return;
    }
    if (!inB(p)) {
      // past the bounds line: a leak unless a plain walk or hop from a spot reached on foot within 5 m ends past it too, or
      // ends on the same block within a metre of it (the edge of a bollard on a walkable sea wall, its centre a hair out)
      const same = (q) => !!(q && q.pos && ((!inB(q.pos) && Math.abs(q.pos.y - p.y) < 0.4) || (r.block >= 0 && q.block === r.block && Math.hypot(q.pos.x - p.x, q.pos.z - p.z) < 1)));
      let by = plainHere(same);
      for (const q of near(p).slice(0, 30)) { for (const dd of DIRS16) for (const k2 of ['h', 'w']) { if (by) break; if (same(move(q, dd, k2))) by = true; } if (by) break; }
      if (by) count.oobOnFoot++; else { count.oob++; oob.push(what); }
      return;
    }
    if (r.perch) {
      // a perch (a crane top …): a leak unless a plain walk or hop from some spot reached on foot gets onto that block too
      const pc = piece.get(r.block);
      let by = pc === undefined ? null : pieceOnFoot(pc);
      // (off a wall: the same climb without the dash getting onto that piece says the climb reaches it anyway)
      if (!by && plainHere((q) => q.block >= 0 && piece.get(q.block) === pc)) by = { move: 'the same climb' };
      if (by) { count.perchOnFoot++; perchOk.set(pc, by); } else { count.perch++; perches.push({ ...what, piece: pc }); }
      return;
    }
    const id = nodeAt(p);
    if (id >= 0 && reach[id]) { count.onFoot++; return; }
    if (id >= 0) {
      // a node the graph says isn't reachable. Down from the start: a drop into a spot the graph doesn't reach (a walk off
      // its edge goes there too), counted. Up: does a plain walk or hop from here (16 headings: where they end, once per
      // start) or the same climb land on it too? Else it's listed
      if (p.y - n.y <= 0.3) { count.strandedDown++; if (down.length < 300) down.push(what); return; }
      const base = plainHere((q) => nodeAt(q.pos) === id) || plainFrom(n).has(id);
      if (base) { count.strandedBaseline++; if (strandedOk.length < 12) strandedOk.push(what); }
      else { count.stranded++; leaks.push({ ...what, firstLanding: r.landY != null ? r2(r.landY - r.y0) : null }); }   // up onto a top the graph can't reach: listed
      return;
    }
    count.offGraph++;
    if (offs.length < 400) offs.push(what);
  };
  // a block's name for the lists: its layout tag, else a prop collider's size (w × h × d m) and flags
  function bTag(id) { const b = L.blocks[id]; if (!b) return null; if (b.tag) return b.tag; return `${b.hidden ? 'prop collider' : 'block'} ${r1(b.half.x * 2)}×${r1(b.half.y * 2)}×${r1(b.half.z * 2)}${b.perch ? ' perch' : ''}${b.roof ? ' roof' : ''}${b.rail ? ' rail' : ''}${b.paint ? '' : ' no-ink'}`; }
  const T = (a) => [-a[1], a[0]];   // (a quarter turn: along the wall)
  const tm = { dash: 0, climb: 0, judge: 0, tops: 0 };   // (ms: the moves under test, the climbs, the baselines, the tops pass)
  const nrm = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
  let nStart = 0; const prog = [];   // (the run's pace every 500 starts: a sim that slows as it goes shows here)
  for (const n of use) {
    // (the page is frozen — no frames: what the dashes leave behind would pile up and slow every later sim. The kit's
    // ribbons and pellets go at every start; the ink and the effects every 20 starts — the walls are re-inked per climb)
    SUB_KITS.dash?.clear?.();
    if (++nStart % 20 === 0) { G.paint.clear?.(); G.fx?.clear?.(); }
    if (args.bench && nStart % (+args.every || 500) === 0) {   // ('bench=1': a fixed set of operations timed at each pace mark)
      const b0 = N[use[0].id], tb = {}, T0 = () => performance.now();
      let t = T0(); put(b0); for (let i = 0; i < 300; i++) { G.time += DT; kid.update(DT); } tb.upd = Math.round(T0() - t);
      { const u0 = kid.update; let nu = 0, slow = 0; kid.update = function (dt) { nu++; const a = performance.now(); u0.call(this, dt); const e = performance.now() - a; if (e > 1) slow++; };
        t = T0(); for (let i = 0; i < 20; i++) move(b0, DIRS[i % 8], 'g'); tb.gdash = Math.round(T0() - t); tb.gticks = nu; tb.slowTicks = slow; delete kid.update; if (kid.update !== u0) kid.update = u0; }
      t = T0(); for (let i = 0; i < 20; i++) { put(b0); SUB_KITS.dash.use(G.subs, kid, SUBS.dash); } tb.use = Math.round(T0() - t);
      SUB_KITS.dash?.clear?.();
      t = T0(); for (let i = 0; i < 20; i++) { put(b0); kid.weaponRunner.startDash(DIRS[i % 8][0], DIRS[i % 8][1], 4.5, 0.22, 7, false); for (let k = 0; k < 20; k++) { G.time += DT; kid.update(DT); } } tb.motion = Math.round(T0() - t);
      t = T0(); for (let i = 0; i < 20; i++) put(b0); tb.put = Math.round(T0() - t);
      t = T0(); for (let i = 0; i < 1000; i++) G.physics.raycast(O.set(b0.x, b0.y + 1, b0.z), DIR.set(Math.sin(i), -0.3, Math.cos(i)).normalize(), 8, H2); tb.ray = Math.round(T0() - t);
      t = T0(); for (let i = 0; i < 60; i++) G.paint.splat(V(b0.x + (i % 7), b0.y + 0.2, b0.z), 1.2, kid.team, { seed: 0.3 }); tb.splat = Math.round(T0() - t);
      prog.push({ starts: nStart, bench: tb });
    }
    if (nStart % (+args.every || 500) === 0 && prog.length < 40) prog.push({ starts: nStart, s: Math.round((performance.now() - t0) / 1000), cues: G.cues?.slots?.size ?? null, tracks: G.cues?.tracks?.size ?? null, stats: Object.keys(G.audio?.voices || {}).length || null, scene: G.scene?.children?.length, growing: G.paint.growing?.length ?? null, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, gtime: Math.round(G.time) });
    for (const d of DIRS) {
      for (const kind of KINDS) { count.sims++; const t1 = performance.now(), rr = move(n, d, kind), t2 = performance.now(); tm.dash += t2 - t1; classify(n, d, kind, rr, null); tm.judge += performance.now() - t2; }
      // [b5-int3] the swim jump + air dash; late presses while the plain running hop is still falling
      if (SWIM) for (const kind of SWIM_KINDS) { count.sims++; count.swimSims = (count.swimSims || 0) + 1; const t1 = performance.now(), rr = move(n, d, kind), t2 = performance.now(); tm.dash += t2 - t1; classify(n, d, kind, rr, null); tm.judge += performance.now() - t2; }
      if (LATE) {
        const hf = airFrames(n, d);
        for (const kind of LATE_KINDS) { if (fr(kind) >= hf) break; count.sims++; count.lateSims = (count.lateSims || 0) + 1; const t1 = performance.now(), rr = move(n, d, kind), t2 = performance.now(); tm.dash += t2 - t1; classify(n, d, kind, rr, null); tm.judge += performance.now() - t2; }
      }
      if (!CLIMB) continue;
      const w = wallAt(n, d);
      if (!w) continue;
      count.walls++;
      inkWall(w);
      const wn = [w.n.x, w.n.z], t = T(wn);
      let plainR;   // the same climb with no dash: on over the top (computed once, if a landing needs it)
      const plain = () => (plainR === undefined ? (plainR = climbMove(n, d, w, 'top', null)) : plainR);
      climbs: for (const at of ['mid', 'top']) {
        if (at === 'mid' && w.top - n.y < 2.2) continue;   // (a low wall: its top is its middle)
        for (const [nm, q] of [['along', t], ['along back', [-t[0], -t[1]]], ['off, along', nrm(t[0] + wn[0], t[1] + wn[1])], ['off, along back', nrm(-t[0] + wn[0], -t[1] + wn[1])], ['straight off', wn], ...(at === 'top' ? [['toward the wall, over its top', [-wn[0], -wn[1]]]] : [])]) {   // ([b5-int3] toward the top)
          count.sims++; count.climbSims++;
          const t1 = performance.now(), r = climbMove(n, d, w, at, q); tm.climb += performance.now() - t1;
          if (r && r.noClimb) { count.noClimb++; break climbs; }   // (no climb here: a never-inkable wall — a kid can't either)
          if (r && r.lost) { count.lost = (count.lost || 0) + 1; continue; }
          count.climbed++;
          const t3 = performance.now(); classify(n, d, `c:dash off a wall climb (${at}), ${nm}`, r, plain); tm.judge += performance.now() - t3;
        }
      }
    }
  }
  // a listed top, looked at again: does a plain walk or hop from ANY spot reached on foot within 5 m of it land on it?
  // (the graph's jump edges are short: a top a kid hops onto from beside it isn't in its reach either)
  const tops = new Map();
  for (const l of leaks) { const id = nodeAt(V(l.to[0], l.to[1], l.to[2])); if (id >= 0 && !tops.has(id)) tops.set(id, l); }
  const realLeaks = [], hopOn = [], t4 = performance.now();
  for (const [id, l] of tops) {
    const Tn = N[id]; let by = null;
    for (const q of near(Tn, -0.5).slice(0, 40)) {
      for (const dd of DIRS16) { for (const k2 of ['h', 'w']) { const r = move(q, dd, k2); if (r && r.pos && nodeAt(r.pos) === id) { by = { from: [r1(q.x), r2(q.y), r1(q.z)], dir: dd.map(r2), move: k2 === 'h' ? 'hop' : 'walk' }; break; } } if (by) break; }
      if (by) break;
    }
    if (by) hopOn.push({ top: [r1(Tn.x), r2(Tn.y), r1(Tn.z)], dashFrom: l.from, onFootBy: by });
    else realLeaks.push(l);
  }
  count.stranded = realLeaks.length; count.strandedHopOn = hopOn.length; tm.tops = performance.now() - t4;
  // beside the highest first landing: where a plain running hop from the same start comes down, the same heading and the
  // best of 16 (over the same start height)
  if (maxUpMove) {
    const { n, d } = maxUpMove, h0 = move(n, d, 'h');
    let best = -99; for (const dd of DIRS16) { const q = move(n, dd, 'h'); if (q && q.landY != null) best = Math.max(best, q.landY - q.y0); }
    count.maxUpAt.plainHopSameHeading = h0 && h0.landY != null ? r2(h0.landY - h0.y0) : null; count.maxUpAt.plainHopBestOf16 = r2(best);
  }
  for (const k in tm) tm[k] = Math.round(tm[k]);
  kid.setSub('bomb'); SUBS.dash.airDashDist = air0; LH = null; delete kid._integrate; delete kid.splat;
  for (const a of m.actors) { delete a.update; if (a.bot) delete a.bot.update; }
  // off the graph: the distinct spots (0.5 m), highest first
  const seen = new Map(); for (const o of offs) { const k = Math.round(o.to[0] * 2) + ',' + Math.round(o.to[2] * 2) + ',' + Math.round(o.to[1] * 2); if (!seen.has(k)) seen.set(k, o); }
  const spots = [...seen.values()].sort((a, b) => b.up - a.up);
  const ms = Math.round(performance.now() - t0);
  const roofSeen = new Map(); for (const o of roofs) { const k = Math.round(o.roofAt[0]) + ',' + Math.round(o.roofAt[2]); if (!roofSeen.has(k)) roofSeen.set(k, o); }
  const part = EVERY > 1 ? `every ${EVERY}th edge node from the ${OFF + 1}${['st', 'nd', 'rd'][OFF] || 'th'}` : 'every edge node';
  const perchBlocks = [...new Set(perches.map((q) => q.block))].map((b) => { const Bk = L.blocks[b], Q = perches.filter((q) => q.block === b); return { block: b, tag: bTag(b), top: [r1(Bk.center.x), r2(Bk.center.y + Bk.half.y), r1(Bk.center.z)], by: [...new Set(Q.map((q) => q.move))], from: Q[0].from }; });
  R(`${g.mapDef?.id}: dt 1/${Math.round(1 / DT)}, ${part} (${use.length} of ${starts.length}; ${N.length} nodes); air dash ${AIR} m${args.air ? ' (what-if)' : ''}: no dash (ground, off a ledge, a running jump's rise / apex / fall${LATE ? ', late in a long fall' : ''}${SWIM ? ', a swim jump' : ''}${CLIMB ? ', off a wall climb' : ''}; 8 headings) comes to rest on a perch piece, out of bounds or stuck on a roof (still on it after 3 s) where no plain walk / hop gets, and no ground dash or jump + dash, wherever it ends, first comes down more than ${BAR} m over its start (a plain hop's best ${HOP_BEST} m + 0.02; ${count.judgedUp} landings judged)`,
    perches.length === 0 && oob.length === 0 && onRoofs.length === 0 && count.maxUp <= BAR + 1e-6, { count, stillOnARoofAfter3s: onRoofs.slice(0, 6), stillOnARoofReachedOnFoot: roofsOnFoot, perchBlocks, perchPiecesOnFoot: [...perchOk].filter(([, v]) => v).map(([pc, v]) => { const bs = PB.filter((b) => piece.get(b.id) === pc); return { piece: pc, blocks: bs.length, tops: [r2(Math.min(...bs.map(ptop))), r2(Math.max(...bs.map(ptop)))], at: [r1(bs[0].center.x), r1(bs[0].center.z)], by: v }; }), perches: perches.slice(0, 4), oob: oob.slice(0, 8), roofsTouched: [...roofSeen.values()].slice(0, 6), ms, tm, prog });
  R(`${g.mapDef?.id}: listed for the lead (SPEC D10.6: newly reachable spots are listed, not judged) — tops the nav graph doesn't reach that a dash ends on and no plain walk / hop from within 5 m (or the same climb) does: ${realLeaks.length}; with their block, its tag, the first landing's height over the start (judged in the line above) and where it came to rest (it may run on up a ramp or a stair after landing)`, true,
    { tops: realLeaks.slice(0, 24), topsAKidHopsOnto: hopOn.length });
  const downSeen = new Map(); for (const o of down) { const k = Math.round(o.to[0]) + ',' + Math.round(o.to[2]); if (!downSeen.has(k)) downSeen.set(k, o); }
  R(`${g.mapDef?.id}: listed for the lead — landings off the nav graph (${spots.length} distinct spots; highest over their start first), and drops into nav nodes the graph doesn't reach (${downSeen.size} spots)`, true,
    { offGraphTop: spots.slice(0, 10), downInto: [...downSeen.values()].slice(0, 8), strandedButReachedOnFoot: strandedOk.slice(0, 4) });
  return out;
})();
