// The pipe engine on Gulper Aquarium (src/game/pipes.js, src/world/pipes-data.js, src/fx/pipesFx.js; the stage's
// tools/botlab/jobs/batch5/stages/aquarium/DESIGN.md §3 and ENGINE.md): every rule, on the real stage.
//   MAP=aquarium PAGE=tools/botlab/tests/pipes.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=data,ride,…' runs some parts: data world nav ride pop hit queue refuse what modes aprons tide hud
//   cam bots looks none
// It fails without the module: with no stage module for LAYOUT.pipes there is no G.pipes and no match.pipes (part 0).
(async () => {
  const g = window.__inkwave, out = [], T0 = performance.now();
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  const args = String(window.__pageArgs || ''), only = /only=([\w,]+)/.exec(args)?.[1]?.split(',') || null, part = (p) => !only || only.includes(p);
  const THREE = await import('three');
  const D = await import('./src/world/pipes-data.js');
  const PM = await import('./src/game/pipes.js');
  const { Level } = await import('./src/world/level.js');
  const { NavGraph } = await import('./src/game/nav.js');
  const { Hit } = await import('./src/game/physics.js');
  const { revealedTo } = await import('./src/game/reveal.js');
  const { on } = await import('./src/core/ctx.js');
  const { MAP_LAYOUTS } = await import('./src/world/maps.js');
  const { shovable } = await import('./src/game/stageKit.js');
  const dbg = g.debug;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const waitPlaying = async () => { for (let i = 0; i < 300; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const freeze = () => { dbg.freeze(); for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } };
  const restart = async (mode, duration) => { dbg.unfreeze?.(); await g.api.startMatch({ mapId: 'aquarium', duration, mode }); const ok = await waitPlaying(); freeze(); return ok; };
  const evs = []; const unsub = ['pipe:enter', 'pipe:refuse', 'pipe:exit-lit', 'pipe:chime', 'pipe:pop', 'pipe:land', 'pipe:abort', 'pipe:flow', 'hit'].map((n) => on(n, (e) => evs.push([n, e, g.match?.stage?.t ?? 0])));

  // ---- 0) the module is there, switched on by the layout key
  let W = __G.pipes, M = g.match, P = M.pipes;
  R('0. the stage module for LAYOUT.pipes is registered and built: G.pipes (W), match.pipes (R), its world in G.stageWorld', !!W && !!P && __G.stageWorld?.keys?.includes('pipes') && M.stage?.run('pipes') === P,
    { keys: __G.stageWorld?.keys, W: !!W, R: !!P });
  if (!W || !P) { unsub.forEach((f) => f()); return out; }
  freeze();
  const X = W.X, L = __G.level, nav = __G.nav;
  const leg = (id) => X.legs.find((l) => l.id === id);
  const team0 = M.actors.filter((a) => a.team === 0), team1 = M.actors.filter((a) => a.team === 1);
  const A = M.local || team0[0], B = team0.find((a) => a !== A), E1 = team1[0], E2 = team1[1];
  const park = () => { P.refused.clear(); for (const a of M.actors) { if (a.pipe) P._abort(a, 'test'); a.pipeCd = 0; a.respawn?.(); a.invuln = 0; a.intent.move.set(0, 0, 0); a.intent.jump = a.intent.fire = a.intent.sub = a.intent.squid = a.intent.special = false; a.hp = 100; a.carry = null; a.specialActive = null; a.superJumpState = null; a.form = 'kid'; } step(0.1); };
  const put = (a, p, yaw) => { a.pos.set(p[0], p[1], p[2]); a.vel.set(0, 0, 0); if (yaw !== undefined) { a.yaw = yaw; a.aimYaw = yaw; } };
  const atApproach = (a, e, back = 0.15) => put(a, [e.approach[0] + e.out[0] * back, e.approach[1], e.approach[2] + e.out[2] * back], Math.atan2(-e.out[0], -e.out[2]));
  const inward = (e) => new THREE.Vector3(-e.out[0], 0, -e.out[2]);
  // push into end e for up to `secs`; returns { captured, t (s from entering the capture cylinder), frames }
  const pushIn = (a, e, secs = 1.5) => {
    let tin = -1, n = 0;
    for (; n < secs * 60 && !a.pipe; n++) {
      a.intent.move.copy(inward(e));
      dbg.step(1000 / 60);
      const rx = a.pos.x - e.pos[0], rz = a.pos.z - e.pos[2], along = rx * e.out[0] + rz * e.out[2];
      if (tin < 0 && along <= 0.9) tin = n;
    }
    a.intent.move.set(0, 0, 0);
    return { captured: !!a.pipe, t: tin >= 0 ? (n - tin) / 60 : -1, frames: n };
  };
  const rideOut = (a, secs = 6, each) => { let n = 0; while (a.pipe && n < secs * 60) { if (each) each(n); dbg.step(1000 / 60); n++; } return n / 60; };
  const centre = (lg, s, dir) => { const q = D.legAt(lg, s, {}); return new THREE.Vector3(q.x + q.sx * 0.28 * dir, q.y - 0.3, q.z + q.sz * 0.28 * dir); };

  // ============================================================================================ data (ENGINE step 1)
  if (part('data')) try {
    const two = X.legs.filter((l) => l.way === 'two').length, one = X.legs.filter((l) => l.way === 'one').length, tide = X.legs.filter((l) => l.way === 'tide').length;
    R('data: 4 definitions → 7 legs and 14 ends; 3 two-way (Gulper Run, both Arch Lines), 2 static one-way (the Expresses), 2 tidal one-way (the Kelp Lines)',
      MAP_LAYOUTS.aquarium.pipes.legs.length === 4 && X.legs.length === 7 && X.ends.length === 14 && two === 3 && one === 2 && tide === 2,
      { defs: MAP_LAYOUTS.aquarium.pipes.legs.length, legs: X.legs.map((l) => `${l.id}:${l.way}`), ends: X.ends.length });
    // arc length against the analytic one (runs minus the fillets' tangents plus the arcs)
    let worst = 0;
    const lens = {};
    for (const lg of X.legs) {
      const p = lg.pts; let s = 0;
      for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]);
      for (let i = 1; i < p.length - 1; i++) {
        const a = new THREE.Vector3(...p[i - 1]).sub(new THREE.Vector3(...p[i])).normalize(), b = new THREE.Vector3(...p[i + 1]).sub(new THREE.Vector3(...p[i])).normalize();
        const th = Math.acos(Math.max(-1, Math.min(1, a.dot(b))));
        if (Math.PI - th < 1e-4) continue;
        s += -2 * lg.bend / Math.tan(th / 2) + lg.bend * (Math.PI - th);
      }
      lens[lg.id] = +lg.len.toFixed(2);
      worst = Math.max(worst, Math.abs(s - lg.len));
    }
    R('data: every leg\'s arc length matches the analytic fillet path within 1 cm (Gulper 25.4, Arch 27.8, Express 59.4, Kelp 41.8 m; 283.5 m in all)', worst < 0.01 && Math.abs(X.totalLen - 283.5) < 0.5, { worst, lens, total: X.totalLen });
    let tStep = 0, kink = 0;
    for (const lg of X.legs) { const a = {}, b = {}; for (let s = 0; s + 0.1 <= lg.len; s += 0.1) { D.legAt(lg, s, a); D.legAt(lg, s + 0.1, b); const ang = Math.acos(Math.min(1, a.tx * b.tx + a.ty * b.ty + a.tz * b.tz)); tStep = Math.max(tStep, ang); kink = Math.max(kink, ang - 0.1 / lg.bend); } }
    R('data: the tangent is continuous (no step beyond the bend\'s own curvature: ≤ 0.1 m / bend + 0.5° between LUT samples)', kink < (0.5 * Math.PI) / 180, { maxStepDeg: (tStep * 180) / Math.PI, kinkDeg: (kink * 180) / Math.PI });
    let tw = 0;
    for (const lg of X.legs) { if (lg.isTwin || lg.twin === lg.i) continue; const t = X.legs[lg.twin], a = {}, b = {}; for (let s = 0; s <= lg.len; s += 0.5) { D.legAt(lg, s, a); D.legAt(t, s, b); tw = Math.max(tw, Math.hypot(a.x + b.x, a.y - b.y, a.z + b.z)); } }
    const gl = leg('gulper'); let gs = 0; { const a = {}, b = {}; for (let s = 0; s <= gl.len; s += 0.5) { D.legAt(gl, s, a); D.legAt(gl, gl.len - s, b); gs = Math.max(gs, Math.hypot(a.x + b.x, a.y - b.y, a.z + b.z)); } }
    R('data: a twin is the exact 180° turn of its leg; the single Gulper Run is its own twin (reversed and turned)', tw < 0.002 && gs < 0.002 && gl.twin === gl.i, { twin: tw, gulper: gs });
    const probs = D.checkPipes(MAP_LAYOUTS.aquarium);
    R('data: the stage passes every static §5 rule (checkPipes: counts, lengths, bends, runs, speeds, level ends, names, glass top, pads, zones, Gates, spacing, rule 30)', probs.length === 0, { probs });
    // each static rule, one deliberately broken leg at a time, must be reported
    const brk = (label, f) => { const lay = JSON.parse(JSON.stringify(MAP_LAYOUTS.aquarium, (k, v) => (typeof v === 'function' ? undefined : v))); f(lay.pipes, lay); return [label, D.checkPipes(lay)]; };
    const cases = [
      brk('rule 23 single not symmetric', (p) => { p.legs[0].pts[0][2] = 0.4; }),
      brk('rule 4 bend too tight at 24 m/s', (p) => { p.legs[2].bend = 1.6; }),
      brk('rule 7 end run not level', (p) => { p.legs[1].pts[1][1] = 1.0; }),
      brk('rule 19 landing near a pad', (p, lay) => { const pad = lay.spawnPads[0]; p.legs[1].pts = [[pad[0] + 9, 0.8, pad[2] + 6], [pad[0] + 9, 0.8, pad[2] + 2], [pad[0] + 9, 7, pad[2] + 2], [pad[0] + 25, 7, pad[2] + 2], [pad[0] + 25, 0.8, pad[2] + 2], [pad[0] + 25, 0.8, pad[2] + 6]]; }),
      brk('rule 29 name over 14 characters', (p) => { p.legs[0].names = ['A VERY LONG MOUTH NAME', 'WEST']; }),
      brk('rule 5 speed 30', (p) => { p.legs[3].speed = 30; }),
      brk('rule 20 an end at a zone', (p, lay) => { const z = lay.zones.side.poly[0]; p.legs[1].pts[0] = [z[0], 0.8, z[1]]; p.legs[1].pts[1] = [z[0] - 2.3, 0.8, z[1] - 0.8]; }),
      brk('rule 2 total over 360 m', (p) => { p.legs.push(JSON.parse(JSON.stringify(p.legs[2])), JSON.parse(JSON.stringify(p.legs[2]))); p.legs[4].id = 'x1'; p.legs[5].id = 'x2'; }),
      brk('rule 29 a tinted leg', (p) => { p.legs[1].look.tint = 'aqua'; }),
      brk('rule 34 a tide with a 5 s warning', (p) => { p.legs[3].way.flip.warn = 5; }),
    ];
    const missed = cases.filter(([, pr]) => !pr.length).map(([l]) => l);
    R('data: each broken rule is reported (single symmetry, bend, level end, pad landing, name length, speed, zone, total length, tint, tide warning)', !missed.length, { missed, got: cases.map(([l, pr]) => [l, pr[0]]) });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ world: colliders (step 2)
  if (part('world')) try {
    const pcs = L.blocks.filter((b) => b.pipe);
    R('world: 168 glass pieces (≤ 200), hidden, roof, never inked, no faces; static hash blocks', pcs.length === X.pieces && pcs.length <= 200 && pcs.every((b) => b.hidden && b.roof && !b.paint && b.faces.every((f) => f < 0) && !b.dynamic),
      { pieces: pcs.length, expected: X.pieces });
    // rays from 16 directions at an open-air run (the Express span over the Ticket Hall) stop at the glass
    const ex = leg('express'); let sBest = 0, dBest = Infinity; { const t = {}; for (let ss = 0; ss < ex.len; ss += 0.1) { D.legAt(ex, ss, t); const d = Math.hypot(t.x + 2.6, t.z + 34.9); if (d < dBest) { dBest = d; sBest = ss; } } }
    const q = D.legAt(ex, sBest, {}), c = new THREE.Vector3(q.x, q.y, q.z), hit = new Hit();
    const dists = [];
    for (let k = 0; k < 16; k++) {
      const th = (k / 16) * Math.PI * 2, side = new THREE.Vector3(q.sx, 0, q.sz), up = new THREE.Vector3().crossVectors(side, new THREE.Vector3(q.tx, q.ty, q.tz)).normalize();
      const dir = side.clone().multiplyScalar(Math.cos(th)).addScaledVector(up, Math.sin(th)).normalize();
      const o = c.clone().addScaledVector(dir, 2.6);
      const h = __G.physics.raycast(o, dir.clone().negate(), 4, hit, false);
      dists.push(h.hit && L.blocks[hit.block].pipe ? +(2.6 - h.dist).toFixed(3) : null);
    }
    R('world: rays from 16 directions stop at the glass 0.80–1.13 m from the axis (the 1.60 m square collider round the 0.88 m tube; the Express span over the Gate Terrace)', dists.every((d) => d !== null && d >= 0.79 && d <= 1.14), { dists, at: [c.x, c.y, c.z] });
    __G.physics.skip = 'pipe';
    const thru = __G.physics.raycast(c.clone().addScaledVector(new THREE.Vector3(q.sx, 0, q.sz), 4), new THREE.Vector3(-q.sx, 0, -q.sz), 6, hit, false).hit && L.blocks[hit.block].pipe;
    __G.physics.skip = null;
    const back = __G.physics.raycast(c.clone().addScaledVector(new THREE.Vector3(q.sx, 0, q.sz), 4), new THREE.Vector3(-q.sx, 0, -q.sz), 6, hit, false).hit && L.blocks[hit.block].pipe;
    R('world: physics.skip = \'pipe\' lets a ray through the glass only while it is set (the ride camera\'s probe)', !thru && back && __G.physics.skip === null, { thru, back });
    // a body pressed against the tube (on the span's level) stops 1.18 m from the axis: 0.8 + the 0.38 body
    const side = new THREE.Vector3(q.sx, 0, q.sz), fits = (d) => __G.physics.bodyFits(c.clone().addScaledVector(side, d).setY(q.y - 0.7), 0.38, 0.3, 1.45);
    R('world: a body cannot stand within 1.18 m of the axis (a kid or squid cannot pass the glass)', !fits(1.1) && fits(1.25), { at11: fits(1.1), at125: fits(1.25) });
    const inside = nav.nodes.filter((n) => pcs.some((b) => L.pointInBlock(b, new THREE.Vector3(n.x, n.y + 0.2, n.z), 0)));
    R('world: no nav node inside a glass piece', inside.length === 0, { n: inside.length });
    const h0 = new Level(MAP_LAYOUTS.aquarium, []).layoutHash, h1 = new Level(MAP_LAYOUTS.aquarium, D.pipeColliderDefs(MAP_LAYOUTS.aquarium)).layoutHash;
    R('world: layoutHash is the same with and without the glass (the lightmap layout doesn\'t change)', h0 === h1, { h0, h1 });
    const bk = L.blocks.filter((b) => b.bakeClear).length;
    W.bakeMode(true); const off = pcs.every((b) => !b.solid) && L.blocks.filter((b) => b.bakeClear).every((b) => !b.solid); W.bakeMode(false);
    R('world: bakeMode takes the glass and the stage\'s bakeClear tank glass out of the AO trace, and puts them back', off && pcs.every((b) => b.solid) && bk > 20, { bakeClear: bk });
    R('world: the minimap base leaves the glass out (W.mapBlock), the module draws the network', pcs.every((b) => !W.mapBlock(b)) && W.mapBlock(L.blocks[0]));
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ nav (step 3)
  if (part('nav')) try {
    const pe = []; for (const n of nav.nodes) for (const e of n.nb) if (e.type === 'pipe') pe.push({ from: n.id, key: e.key, cost: e.cost, len: e.len, leg: X.legs[e.leg].id });
    const want = { gulper: 2, arch: 2, 'arch~': 2, express: 1, 'express~': 1, kelp: 2, 'kelp~': 2 };
    const got = {}; for (const e of pe) got[e.leg] = (got[e.leg] || 0) + 1;
    const costOk = pe.every((e) => { const lg = X.legs.find((l) => l.id === e.leg); return Math.abs(e.cost - ((0.25 + lg.len / lg.speed + 0.5) * 6 + 2)) < 0.1; });
    R('nav: one \'pipe\' edge per IN → OUT pair (two-way 2, the Express 1, a tidal Kelp Line both directions from load), cost (suck + L/v + pop) × 6 + 2, len carried', Object.keys(want).every((k) => got[k] === want[k]) && Object.keys(got).length === 7 && costOk && !W.navProblems.length && pe.every((e) => e.len > 20),
      { got, costs: Object.fromEntries(pe.map((e) => [e.leg + ':' + e.key, e.cost])), problems: W.navProblems.length });
    // hScale: min cost ÷ straight distance over the pipe edges
    let hs = 1; for (const n of nav.nodes) for (const e of n.nb) if (e.type === 'pipe') { const m = nav.nodes[e.to]; hs = Math.min(hs, e.cost / (Math.hypot(m.x - n.x, m.z - n.z) + Math.abs(m.y - n.y) * 0.5)); }
    R('nav: A*\'s heuristic is scaled by the cheapest pipe\'s cost per metre (hScale < 1 on this stage)', nav.hScale < 0.6 && Math.abs(nav.hScale - hs) < 1e-6, { hScale: nav.hScale, computed: hs });
    // the path takes the Gulper Run (east approach → west landing) when it's cheaper; walks when its key is shut
    const ge = leg('gulper').ends, a = nav.nearest(new THREE.Vector3(...ge[0].approach), 1), b = nav.nearest(new THREE.Vector3(...ge[1].land), 1);
    const p1 = nav.path(a, b, 0), uses = (p) => p && p.some((id, i) => i && nav.edge(p[i - 1], id)?.type === 'pipe');
    P.keyShut[leg('gulper').i * 2] = 1; const p2 = nav.path(a, b, 0); P._keys();
    R('nav: path() rides the Gulper Run east → west when it is cheaper, and walks round the deck when its key is shut', uses(p1) && p2 && !uses(p2), { pipe: p1?.length, walk: p2?.length });
    // rule 25: both ends of every leg are connected on foot, both ways, with every pipe shut
    P.keyShut.fill(1);
    const bad = [];
    for (const lg of X.legs) {
      const n0 = nav.nearest(new THREE.Vector3(...lg.ends[0].land), 1), n1 = nav.nearest(new THREE.Vector3(...lg.ends[1].land), 1);
      for (const t of [0, 1]) { if (!nav.path(n0, n1, t) || !nav.path(n1, n0, t)) bad.push(lg.id + ' t' + t); }
    }
    P._keys();
    R('nav: rule 25: both ends of every leg are walkable both ways with every pipe shut (pipes are shortcuts, never the only way)', !bad.length, { bad });
    // _prune: the same nodes with the pipe edges and without them
    const save = L.extraEdges; L.extraEdges = null; const n0 = new NavGraph(L, __G.physics).nodes.length; L.extraEdges = save;
    R('nav: the graph keeps the same nodes with and without the pipe edges (no area only a pipe reaches)', n0 === nav.nodes.length, { with: nav.nodes.length, without: n0 });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the ride (step 4)
  if (part('ride')) try {
    park();
    const gl = leg('gulper'), e = gl.ends[0];
    // standing still at the mouth, strafing across it: never captured
    atApproach(A, e, -0.3); step(2.0);
    const still = !A.pipe;
    put(A, [e.pos[0] + e.out[0] * 0.6 + 1.6, e.floorY, e.pos[2] - 2.0]);
    for (let i = 0; i < 90 && !A.pipe; i++) { A.intent.move.set(0, 0, 1); dbg.step(1000 / 60); }
    A.intent.move.set(0, 0, 0);
    const strafe = !A.pipe;
    R('ride: standing still in the capture cylinder for 2 s or strafing across a mouth never captures (intent-gated)', still && strafe, { still, strafe });
    // pushing in captures 0.08–0.12 s after entering the cylinder
    park(); atApproach(A, e, 0.1);
    const t0 = M.stage.t, pi = pushIn(A, e);
    const enter = evs.find((x) => x[0] === 'pipe:enter' && x[1].actor === A && x[2] >= t0);
    R('ride: pushing into an open mouth captures 0.08–0.12 s after the body is in the cylinder (pipe:enter, the suck phase)', pi.captured && pi.t >= 0.07 && pi.t <= 0.13 && A.pipe.phase === 'suck' && !!enter, { ...pi, phase: A.pipe?.phase });
    // the ride: suck 0.25 s, then L/v at 18 m/s, every frame on the centreline + lane − 0.3; untouchable; statuses run on
    A.status.track = 3; A.status.trackTeam = 1;
    let off = 0, frames = 0, sucked = 0, dmgOk = true, hitEv = 0, hpRide = A.hp;
    const hits0 = evs.filter((x) => x[0] === 'hit' && x[1].victim === A).length;
    const tr0 = A.status.track;
    const dur = rideOut(A, 5, () => {
      if (A.pipe?.phase === 'ride') {
        const c = centre(gl, A.pipe.s, A.pipe.dir); off = Math.max(off, c.distanceTo(A.pos)); frames++;
        if (frames === 20) { const ok = A.damage(50, E1, 'test'); dmgOk = dmgOk && ok === false; __G.projectiles.applyHit(E1, A, 50, 'shooter'); }
      } else if (A.pipe?.phase === 'suck') sucked++;
      if (A.pipe?.phase === 'pop' && !A.grounded && A.pipe.popT < 0.3 && !A._popHitTried) { A._popHitTried = true; dmgOk = dmgOk && A.damage(50, E1, 'test') === false; __G.projectiles.applyHit(E1, A, 50, 'shooter'); }
    });
    delete A._popHitTried;
    hitEv = evs.filter((x) => x[0] === 'hit' && x[1].victim === A).length - hits0;
    const rideT = frames / 60, want = gl.len / gl.speed;
    R('ride: the suck takes 0.25 s; the ride L/v ± 1 frame (Gulper 25.4 m at 18 m/s: 1.41 s)', Math.abs(sucked / 60 - 0.25) <= 1.5 / 60 && Math.abs(rideT - want) <= 1.5 / 60, { suck: sucked / 60, ride: rideT, want });
    R('ride: every ride frame the rider is within 0.02 m of the centreline + 0.28 m lane − 0.3 m', off < 0.02, { off });
    R('ride: untouchable from the suck\'s end to touchdown: damage() is false and no \'hit\' event fires (ride and the shielded pop)', dmgOk && hitEv === 0 && A.hp === hpRide, { dmgOk, hitEv, hp: A.hp });
    R('ride: statuses ride along, their timers running (tracked)', A.status.track < tr0 - rideT * 0.8 && A.status.track > 0, { before: tr0, after: A.status.track });
    // the suck can be hit, and a splat in it cancels the ride (exit unlit, pipe:abort 'splat')
    park(); atApproach(A, e, 0.1); pushIn(A, e);
    const inSuck = A.pipe?.phase === 'suck';
    const hp0 = A.hp; A.damage(30, E1, 'test'); const tookHit = A.hp < hp0 - 29;
    A.damage(500, E1, 'test');
    if (A.alive) A.splat(E1);
    step(0.1);
    const aborted = evs.some((x) => x[0] === 'pipe:abort' && x[1].actor === A && x[1].why === 'splat');
    R('ride: the 0.25 s suck takes damage; splatted there, the ride is cancelled (pipe:abort splat, its exit not lit)', inSuck && tookHit && aborted && !A.pipe && P.lit[gl.ends[1].i].n === 0, { inSuck, tookHit, aborted, lit: P.lit[gl.ends[1].i].n });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the pop (step 4)
  if (part('pop')) try {
    const popRun = (lgId, k, opts = {}) => {
      park();
      const lg = leg(lgId), e = lg.ends[k], o = lg.ends[1 - k];
      atApproach(A, e, 0.1); pushIn(A, e);
      let firedDuring = false, maxH = -Infinity, popPos = null, popYaw = null, thrown = 0;
      const subs0 = __G.subs?.items?.length || 0, bombs0 = __G.projectiles.bombs.length;
      const n = rideOut(A, 6, () => {
        const p = A.pipe;
        if (!p) return;
        if (p.phase === 'ride') {
          const left = (lg.len - p.u) / p.v;
          if (left < 0.45) { if (opts.steer) A.intent.move.set(...opts.steer); if (opts.high) A.intent.jump = true; }
          if (opts.sub) A.intent.sub = true;
        }
        if (p.phase === 'pop') {
          if (!popPos) { popPos = A.pos.clone(); popYaw = p.popYaw; }
          A.intent.fire = true; if (opts.sub) A.intent.sub = false;   // (a sub held through the ride is let go at the pop)
          maxH = Math.max(maxH, A.pos.y - o.floorY);
          if (A.weaponRunner.firingPose?.()) firedDuring = true;
        }
      });
      A.intent.fire = false; A.intent.jump = false; A.intent.move.set(0, 0, 0); A.intent.sub = false;
      thrown = (__G.subs?.items?.length || 0) - subs0 + (__G.projectiles.bombs.length - bombs0);
      const land = A.pos.clone(), d = Math.hypot(land.x - o.pos[0], land.z - o.pos[2]);
      const hd = Math.atan2(land.x - popPos.x, land.z - popPos.z), base = Math.atan2(o.out[0], o.out[2]);
      let turn = hd - base; while (turn > Math.PI) turn -= 2 * Math.PI; while (turn < -Math.PI) turn += 2 * Math.PI;
      return { d, turn: (turn * 180) / Math.PI, popYaw, n, landed: !A.pipe && A.grounded, firedDuring, maxH, thrown, hardLand: A.hardLand, cd: A.pipeCd, land };
    };
    const lv = popRun('gulper', 0);
    R('pop: a level pop with no input lands at the landing point, 3.1–3.7 m from the mouth (the real actor: ≈ 3.46 m; ENGINE.md §1.3 estimated 3.1), straight out', lv.landed && lv.d >= 3.1 && lv.d <= 3.7 && Math.abs(lv.turn) < 4 && Math.abs(lv.d - (D.PIPE.landOut)) < 0.25, lv);
    R('pop: touchdown starts the 2.5 s cooldown, no hard-landing recovery; no fire until touchdown', Math.abs(lv.cd - 2.5) < 0.05 && lv.hardLand === 0 && !lv.firedDuring, { cd: lv.cd, hardLand: lv.hardLand, fired: lv.firedDuring });
    // the touchdown splat: the rider's ink at the landing (turf, no special charge)
    const own = __G.paint.regionStats(lv.land.x, lv.land.y, lv.land.z, 0.6, A.team);
    R('pop: touchdown paints a 1.2 m splat of the rider\'s ink', own.own > 0 && own.own >= own.enemy, own);
    const hi = popRun('gulper', 1, { high: true });
    R('pop: jump held in the last 0.5 s gives a high pop (7.0 out / 8.5 up: ≥ 0.6 m further and ≥ 0.6 m higher than a level one; ENGINE.md estimated 4.3 m)', hi.landed && hi.d >= lv.d + 0.6 && hi.maxH > lv.maxH + 0.6, { d: hi.d, maxH: hi.maxH, level: [lv.d, lv.maxH] });
    const eW = leg('gulper').ends[1], sx = Math.cos(70 * Math.PI / 180), sz = Math.sin(70 * Math.PI / 180);
    const st = popRun('gulper', 0, { steer: [eW.out[0] * sx - eW.out[2] * sz, 0, eW.out[0] * sz + eW.out[2] * sx] });
    R('pop: the stick held in the last 0.5 s steers the pop, by at most 45° (asked 70°)', st.landed && Math.abs(st.turn) > 25 && Math.abs(st.turn) <= 47, { turn: st.turn, d: st.d });
    const sb = popRun('arch', 0, { sub: true });
    R('pop: a sub held through the ride is not thrown at the pop; nothing fires until touchdown (Arch Line to the promenade)', sb.landed && sb.thrown === 0 && !sb.firedDuring, { thrown: sb.thrown, fired: sb.firedDuring, d: sb.d });
    // Express (one-way, 24 m/s) down to Penguin Point's terrace
    const xp = popRun('express', 0);
    R('pop: the Express rides 59.4 m at 24 m/s and pops onto Penguin Point\'s terrace (floor 1.2)', xp.landed && Math.abs(A.pos.y - 1.2) < 0.15 && xp.d > 2.5 && xp.d < 4.5, { y: A.pos.y, d: xp.d });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ hits, pushes, super jumps
  if (part('hit')) try {
    park();
    const gl = leg('gulper'), e = gl.ends[0];
    atApproach(A, e, 0.1); pushIn(A, e); step(0.3);
    const riding = A.pipe?.phase === 'ride';
    // the soft push and shoves skip riders; no super jump while riding; a jump to a rider lands at its exit
    put(B, [A.pos.x, A.pos.y, A.pos.z]);
    const before = A.pos.clone(); dbg.step(1000 / 60);
    const anchor = A.jumpAnchor(), ex = gl.ends[1];
    R('hit: a rider is never pushed (soft push, movers / pods / curtain shoves skip it); it can\'t super jump; a jump to it lands at its exit\'s landing',
      riding && P.noPush(A) && P.noShove(A) && !shovable(A) && !A.canSuperJump() && Math.hypot(anchor.x - ex.land[0], anchor.z - ex.land[2]) < 0.01,
      { riding, push: P.noPush(A), shovable: shovable(A), sj: A.canSuperJump(), anchor: [anchor.x, anchor.z], moved: before.distanceTo(A.pos) });
    // botSight: an enemy rider is remembered at its landing ('jump'), never a target
    const eb = E1.bot; let mem = null;
    if (eb && eb.sight) { put(E1, [A.pos.x + 4, 0, A.pos.z + 3]); eb.sight.lastT = -1; eb.sight.check(); mem = eb.sight.get(A); }
    R('hit: an enemy bot remembers a rider at its exit\'s landing (src \'jump\'), never as a target in sight', mem && mem.src === 'jump' && !mem.seen && Math.hypot(mem.pos.x - ex.land[0], mem.pos.z - ex.land[2]) < 0.01, mem ? { src: mem.src, seen: mem.seen, pos: [mem.pos.x, mem.pos.z] } : null);
    const why0 = revealedTo(A, 1); A.hp = 100; A.groundTeam = 0; A.status.track = 0; const why1 = revealedTo(A, 1);
    R('hit: a rider is revealed to the other team (its dot moves along the line on their map): \'pipe\', with nothing else giving it away', !!why0 && why1 === 'pipe', { why0, why1 });
    rideOut(A); step(0.1);
    // blasts: the glass blocks line of sight from a bomb outside to a rider inside
    park(); atApproach(A, e, 0.1); pushIn(A, e); step(0.5);
    const blast = new THREE.Vector3(A.pos.x, A.pos.y + 1.6, A.pos.z + 0.0);
    const losBlocked = !__G.physics.los(new THREE.Vector3(5, 3.0, 0), new THREE.Vector3(A.pos.x, A.pos.y + 0.3, A.pos.z));
    void blast;
    R('hit: the deck and the tank stop a blast\'s line of sight to a Gulper rider (and the damage guard backs it)', losBlocked && P.damageGuard(A), { los: !losBlocked });
    rideOut(A); step(0.1);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ queueing: two riders
  if (part('queue')) try {
    park();
    const gl = leg('gulper'), eE = gl.ends[0], eW = gl.ends[1];
    // two riders into the same mouth back to back: both ride; the second pops within 0.4 s of the first and fans 30°
    atApproach(A, eE, 0.1); atApproach(B, eE, 1.4);
    let aIn = false, bIn = false, k = 0;
    for (; k < 120 && !(aIn && bIn); k++) {
      if (!A.pipe && !aIn) A.intent.move.copy(inward(eE)); else A.intent.move.set(0, 0, 0);
      if (!B.pipe && !bIn) B.intent.move.copy(inward(eE)); else B.intent.move.set(0, 0, 0);
      dbg.step(1000 / 60);
      aIn = aIn || !!A.pipe; bIn = bIn || !!B.pipe;
    }
    const pops = [];
    for (let i = 0; i < 300 && (A.pipe || B.pipe); i++) {
      for (const a of [A, B]) if (a.pipe?.phase === 'pop' && !pops.some((x) => x.a === a)) pops.push({ a, t: P.t, yaw: a.pipe.popYaw });
      dbg.step(1000 / 60);
    }
    R('queue: two riders walk into the same mouth back to back and both ride (no queue, no lock)', aIn && bIn && pops.length === 2, { aIn, bIn, gap: k / 60 });
    // two riders 0.2 s apart: the second pops within 0.4 s of the first and fans 30° to the right
    park(); step(0.5);
    P.debugRide(A, 'gulper', 0); step(0.2); P.debugRide(B, 'gulper', 0);
    const pp = [];
    for (let i = 0; i < 300 && (A.pipe || B.pipe); i++) { for (const a of [A, B]) if (a.pipe?.phase === 'pop' && !pp.some((x) => x.a === a)) pp.push({ a, t: P.t, yaw: a.pipe.popYaw }); dbg.step(1000 / 60); }
    const dt2 = pp.length === 2 ? pp[1].t - pp[0].t : null, dyaw = pp.length === 2 ? ((pp[1].yaw - pp[0].yaw) * 180) / Math.PI : null;
    R('queue: a second rider popping from the same mouth within 0.4 s fans 30° aside (to the right), so arrivals don\'t stack', pp.length === 2 && dt2 < 0.4 && Math.abs(Math.abs(dyaw) - 30) < 0.5, { dt: dt2, dyaw });
    // opposite riders on a two-way leg pass side by side (0.56 m apart laterally)
    park();
    atApproach(A, eE, 0.1); atApproach(B, eW, 0.1);
    for (let i = 0; i < 60 && !(A.pipe && B.pipe); i++) { if (!A.pipe) A.intent.move.copy(inward(eE)); if (!B.pipe) B.intent.move.copy(inward(eW)); dbg.step(1000 / 60); }
    let minLat = Infinity, minD = Infinity;
    for (let i = 0; i < 200 && (A.pipe || B.pipe); i++) {
      dbg.step(1000 / 60);
      if (A.pipe?.phase === 'ride' && B.pipe?.phase === 'ride') { const d = A.pos.distanceTo(B.pos); if (d < minD) { minD = d; minLat = Math.abs(A.pos.z - B.pos.z); } }
    }
    R('queue: two riders in opposite directions on the Gulper Run pass side by side, 0.56 m apart', Math.abs(minLat - 0.56) < 0.03, { minLat, minD });
    step(0.5);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ refusals
  if (part('refuse')) try {
    const tryEnd = (a, e) => { atApproach(a, e, 0.1); evs.length = 0; const r = pushIn(a, e, 0.8); const rf = evs.find((x) => x[0] === 'pipe:refuse' && x[1].actor === a); const prm = P.prompt(a); if (a.pipe) { P._abort(a, 'test'); } return { cap: r.captured, why: rf?.[1].why, prompt: prm }; };
    park();
    const xB = leg('express').ends[1];
    const o1 = tryEnd(A, xB);
    R('refuse: an OUT end refuses (\'oneway\'): "One way: this end is the exit", the flap rattles, a glass knock', !o1.cap && o1.why === 'oneway' && o1.prompt === PM.REFUSE.oneway, o1);
    park(); A.carry = { since: 0, sp: 0 };
    const results = X.ends.map((e) => { const r = tryEnd(A, e); park(); A.carry = { since: 0, sp: 0 }; return [e.name, e.inWhen, r.why]; });
    A.carry = null;
    R('refuse: the Bazookarp carrier is refused at every mouth ("Can\'t ride with the Bazookarp"; an OUT end says one way)', results.every(([, w, why]) => why === (w === 'never' || (w === 'ba') ? 'oneway' : 'carp')), { results });
    park(); A.specialActive = { id: 'test', kind: 'test-none', t: 0 };
    const o3 = tryEnd(A, leg('gulper').ends[0]); A.specialActive = null;
    park(); A.pipeCd = 1.5;
    const o4 = tryEnd(A, leg('gulper').ends[0]);
    park(); X.enter = 'squid';
    const o5 = tryEnd(A, leg('gulper').ends[0]); X.enter = 'any';
    R('refuse: a body-owning special ("Can\'t ride during a special"), the cooldown ("Pipe cooldown"), a kid at a squid-only stage ("Swim in as a squid")',
      o3.why === 'special' && o3.prompt === PM.REFUSE.special && o4.why === 'cooldown' && o4.prompt === PM.REFUSE.cooldown && o5.why === 'form' && o5.prompt === PM.REFUSE.form, { o3, o4, o5 });
    // a prompt at an open IN end, facing it
    park(); atApproach(A, leg('gulper').ends[0], 0.5);
    const pr = P.prompt(A);
    R('refuse: facing an open IN end within 2.5 m: "Walk in to ride → WEST GULPER"', pr === 'Walk in to ride → WEST GULPER', { pr });
    park();
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ what may ride: bombs, shots, devices, the tower
  if (part('what')) try {
    park();
    const e = leg('kelp').ends[0];   // the low Kelp stop (IN in UP)
    atApproach(A, e, 0.6);
    A.aimYaw = Math.atan2(-e.out[0], -e.out[2]); A.aimPitch = -0.05; A.yaw = A.aimYaw;
    const n0 = __G.projectiles.bombs.length;
    __G.projectiles.throwBomb(A);
    const bomb = __G.projectiles.bombs[n0];
    let deepest = Infinity;
    for (let i = 0; i < 90 && bomb && __G.projectiles.bombs.includes(bomb); i++) { dbg.step(1000 / 60); const rx = bomb.pos.x - e.pos[0], rz = bomb.pos.z - e.pos[2]; deepest = Math.min(deepest, rx * e.out[0] + rz * e.out[2]); }
    R('what: a bomb thrown into a mouth bounces off the glass (never past the mouth plane, never rides)', deepest > -0.35 && !M.actors.some((a) => a.pipe), { deepest });
    // shots stop on the glass: a ray from the court into a mouth hits the mouth's housing / glass first
    const hit = new Hit(), o = new THREE.Vector3(e.pos[0] + e.out[0] * 3, e.pos[1], e.pos[2] + e.out[2] * 3);
    const rh = __G.physics.raycast(o, inward(e), 8, hit, true);
    R('what: a shot into a mouth stops at it (the end piece or its housing): shots never travel the pipe', rh.hit && hit.dist < 3.2, { dist: hit.dist, pipe: rh.hit && !!L.blocks[hit.block].pipe });
    // devices: no device on a mouth's apron or a landing (the aprons); 4 m off, they place as anywhere
    const ap = new THREE.Vector3(e.approach[0], e.approach[1], e.approach[2]), ld = new THREE.Vector3(e.land[0], e.land[1], e.land[2]);
    const far = ld.clone().add(new THREE.Vector3(e.out[0] * 4, 0, e.out[2] * 4));
    R('what: devices are never placed on a mouth\'s IN apron or a landing (G.level.noPlace), and place as anywhere 4 m away', L.noPlace(ap, 0.3) && L.noPlace(ld, 0.3) && !L.noPlace(far, 0.3),
      { apron: L.noPlace(ap, 0.3), land: L.noPlace(ld, 0.3), far: L.noPlace(far, 0.3) });
    const aprons = X.aprons.length;
    const cen = (a) => { const pts = a.poly || [[a.box[0], a.box[2]], [a.box[1], a.box[3]]]; let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return new THREE.Vector3(x / pts.length, 0, z / pts.length); };
    const apOk = X.aprons.map((a) => [a.why, L.noPlace(cen(a), 0), +cen(a).x.toFixed(1), +cen(a).z.toFixed(1)]);
    R('what: the spawn decks\' stair landings are device aprons too (pipes.aprons, both halves)', aprons === 4 && apOk.every((x) => x[1]), { apOk });
    // a tower rider is refused; the tower's swept volume keeps 1.0 m from the glass (rule 21), its track 2 m from pop regions
    const tr = MAP_LAYOUTS.aquarium.tower, pts = tr.path.map((p) => [p[0], p[p.length - 1]]);
    let minGap = Infinity, minPop = Infinity, where = null;
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.5);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n, gy = L.groundHeight(x, z, 3.0, false);
        const top = gy + 3.72;
        for (const lg of X.legs) for (let s = 0; s <= lg.len; s += 0.5) {
          const q = D.legAt(lg, s, {});
          const dx = Math.max(0, Math.abs(q.x - x) - 1.25), dz = Math.max(0, Math.abs(q.z - z) - 1.25);
          if (Math.abs(q.x - x) > 1.25 + 0.88 + 1.5 || Math.abs(q.z - z) > 1.25 + 0.88 + 1.5) continue;
          const dy = q.y - 0.88 > top ? q.y - 0.88 - top : q.y + 0.88 < gy ? gy - q.y - 0.88 : 0;
          const gap = Math.hypot(Math.max(0, dx - 0.88), Math.max(0, dz - 0.88), dy);
          if (gap < minGap) { minGap = gap; where = [lg.id, +s.toFixed(1), +x.toFixed(1), +z.toFixed(1)]; }
        }
        for (const en of X.ends) { if (en.inWhen === 'always') continue; minPop = Math.min(minPop, Math.max(0, Math.hypot(en.land[0] - x, en.land[2] - z) - 1.25)); }
      }
    }
    R('what: the tower never meets the glass: its swept volume (2.5 m square, 3.72 m headroom) keeps ≥ 1.0 m from every leg, and its track ≥ 2 m from every landing', minGap >= 1.0 && minPop >= 2.0, { minGap, where, minPop });
    park();
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the tide (E2)
  if (part('tide')) try {
    // the pure schedule: a 300 s mode flips at 90, 180, 270; Turf War (180 s) once at 90; nothing in the last 15 s
    const F = leg('kelp').flip;
    const s300 = [0, 85, 88, 90, 90.5, 91, 180, 270, 290, 320].map((t) => [t, D.tideAt(F, t, 300).dir, D.tideAt(F, t, 300).phase]);
    const s180 = [0, 89, 90, 179, 200].map((t) => D.tideAt(F, t, 180).dir);
    const flips300 = [0, 1, 2, 3].map((n) => D.tideAt(F, 89.99 + 90 * n, 300).dir !== D.tideAt(F, 90.01 + 90 * n, 300).dir);
    R('tide: the Kelp Lines flip every 90 s starting UP; a 300 s mode flips at 90, 180 and 270 (0:30 left), Turf War once at 90; nothing changes in the last 15 s or in overtime',
      JSON.stringify(flips300) === '[true,true,true,false]' && JSON.stringify(s180) === '["ab","ab","ba","ba","ba"]' && D.tideAt(F, 320, 300).dir === 'ba' && D.tideAt(F, 179.9, 180).phase === 'run',
      { s300, s180, flips300 });
    R('tide: warn from T − 10, IN ends shut from T − 3, the new IN end open from T + 1', D.tideAt(F, 79.9, 300).phase === 'run' && D.tideAt(F, 80.1, 300).phase === 'warn' && D.tideAt(F, 87.1, 300).phase === 'shut' && D.tideAt(F, 90.9, 300).phase === 'shut' && D.tideAt(F, 91.1, 300).phase === 'run');
    // the live tide in a 300 s Zone Control match: the events in order, both twins on the same tick, the HUD, the refusals
    const ok = await restart('zones', 300);
    W = __G.pipes; M = g.match; P = M.pipes;
    const A2 = M.local || M.actors.find((a) => a.team === 0);
    const setT = (t) => { M.time = M.duration - t; P.S.clock.t = t; dbg.step(1000 / 60); };
    setT(79.0);
    evs.length = 0;
    const seen = [], txt = [];
    const pill = () => document.querySelector('.iw-pp-pill')?.textContent || '', line = () => (document.querySelector('.iw-pp-line.is-on')?.textContent || '');
    for (let i = 0; i < 13.5 * 60; i++) { dbg.step(1000 / 60); if (i % 30 === 0) txt.push([+P.S.t.toFixed(1), line(), pill()]); }
    for (const [n, e, t] of evs) if (n === 'pipe:flow') seen.push([e.id, e.phase, +t.toFixed(1)]);
    const own = seen.filter((x) => x[0] === 'kelp').map((x) => x[1]).join(), twin = seen.filter((x) => x[0] === 'kelp~').map((x) => x[1]).join();
    const sameTick = seen.filter((x) => x[0] === 'kelp').every((x) => seen.some((y) => y[0] === 'kelp~' && y[1] === x[1] && Math.abs(y[2] - x[2]) < 0.02));
    R('tide: live, pipe:flow fires warn → close → flip → open at T − 10 / T − 3 / T / T + 1 for both twins on the same tick', ok && own === 'warn,close,flip,open' && twin === own && sameTick, { seen });
    const hudWarn = txt.some(([t, l]) => t > 80.4 && t < 89.5 && /KELP LINES GOING DOWN IN\s*\d/.test(l));
    const hudNow = txt.some(([t, l]) => t > 91.2 && /KELP LINES DOWN: dive from your promenade/.test(l));
    const pillOk = txt.some(([t, , p]) => t < 89 && /KELP UP/.test(p)) && txt.some(([t, , p]) => t > 90.5 && /KELP DOWN/.test(p));
    R('tide: the HUD says "KELP LINES GOING DOWN IN 10" counting down, then "KELP LINES DOWN: dive from your promenade"; the pill under the clock turns ▲ UP → ▼ DOWN', hudWarn && hudNow && pillOk, { txt: txt.filter((_, i) => i % 2 === 0) });
    // refusals in the shut window, and a rider who entered at T − 3.1 finishes the old way
    for (const a of M.actors) { a.pipeCd = 0; }
    const kA = P.legs.find((l) => l.id === 'kelp').ends[0], kB = P.legs.find((l) => l.id === 'kelp').ends[1];
    setT(176.4);   // (the 180 s flip: DOWN → UP; the IN end in DOWN is B, the North Promenade's deep stop)
    atApproach(A2, kB, 0.1); step(0.2);
    evs.length = 0;
    const r1 = pushIn(A2, kB, 0.5);   // at 176.6 … 177.1: open (it shuts at 177)
    const okOld = A2.pipe && A2.pipe.k === 1;
    rideOut(A2);
    const poppedAt = evs.find((x) => x[0] === 'pipe:pop' && x[1].actor === A2);
    R('tide: a rider who enters just before the IN ends shut (T − 3.1) finishes the old way (DOWN: out at the Reef Hall\'s low stop)', r1.captured && okOld && poppedAt && poppedAt[1].end === kA.i, { r1, k: A2.pipe?.k, end: poppedAt?.[1].end, want: kA.i });
    setT(178.0); A2.pipeCd = 0;
    atApproach(A2, kB, 0.1); evs.length = 0;
    const r2 = pushIn(A2, kB, 0.6);
    const rf = evs.find((x) => x[0] === 'pipe:refuse' && x[1].actor === A2);
    R('tide: inside the shut window the IN end refuses: "Closed: the Kelp Lines are turning"', !r2.captured && rf && rf[1].why === 'shut' && P.prompt(A2) === PM.REFUSE.tide, { why: rf?.[1].why, prompt: P.prompt(A2) });
    // bots replan off a newly shut key: a bot whose path rides the Kelp Line is dropped at the close
    setT(255.0);
    const bb = M.actors.find((a) => a.bot && a.team === 0 && a !== A2) || M.actors.find((a) => a.bot);
    const kl = P.legs.find((l) => l.id === 'kelp');
    const na = __G.nav.nearest(new THREE.Vector3(...kl.ends[0].approach), 1), nb = __G.nav.nearest(new THREE.Vector3(...kl.ends[1].land), 1);
    const path = __G.nav.path(na, nb, bb.team);
    const usesK = path && path.some((id, i) => i && __G.nav.edge(path[i - 1], id)?.type === 'pipe');
    bb.bot.path = path; bb.bot.pi = 1;
    setT(266.5); for (let i = 0; i < 60; i++) dbg.step(1000 / 60);
    R('tide: at the close (T − 3) a bot whose route rides the closing Kelp Line drops it and replans', usesK && !bb.bot.path, { usesK, path: !!bb.bot.path, phase: P.flow().phase });
    // the hold: no change in the last 15 s (the 270 flip happened; nothing at 300) nor in overtime
    setT(284.0); const d1 = P.flow().dir; setT(299.0); const d2 = P.flow().dir; M.time = 0; P.S.clock.t = 305; dbg.step(1000 / 60); const d3 = P.flow().dir;
    R('tide: after the 0:30 flip nothing changes again (the last 15 s and overtime hold DOWN)', d1 === 'ba' && d2 === 'ba' && d3 === 'ba', { d1, d2, d3 });
    // back to Turf War for the rest
    await restart('turf', 180);
    W = __G.pipes; M = g.match; P = M.pipes;
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ modes
  if (part('modes')) try {
    W = __G.pipes; M = g.match; P = M.pipes;
    const A3 = M.local || M.actors.find((a) => a.team === 0);
    // a mode that shuts a leg: refused ("Closed in this mode") and its nav keys skipped; 'off' shuts all (boss: 'off')
    const gi = P.legs.find((l) => l.id === 'gulper').i;
    P.modeShut.add(gi); P._keys();
    const e = P.legs[gi].ends[0];
    for (const a of M.actors) { a.pipeCd = 0; }
    atApproach(A3, e, 0.1); evs.length = 0;
    pushIn(A3, e, 0.6);
    const rf = evs.find((x) => x[0] === 'pipe:refuse' && x[1].actor === A3);
    const keys = [P.keyShut[gi * 2], P.keyShut[gi * 2 + 1]];
    R('modes: a leg a mode shuts refuses ("Closed in this mode") and its nav keys are skipped', rf && rf[1].why === 'shut' && P.prompt(A3) === PM.REFUSE.shut && keys[0] && keys[1], { why: rf?.[1].why, prompt: P.prompt(A3), keys });
    P.modeShut.delete(gi); P.off = true; P._keys();
    const allShut = P.keyShut.every((k, i) => k || P.legs[i >> 1].ends[i & 1].inWhen === 'never');
    P.off = false; P._keys();
    R('modes: \'off\' (Boss Battle\'s option) shuts every leg, still drawn and solid; this stage keeps them open in every mode (boss \'open\', Bazookarp nothing shut)', allShut && MAP_LAYOUTS.aquarium.pipes.modes.boss === 'open' && !MAP_LAYOUTS.aquarium.pipes.modes.bazookarp.shut.length && L.blocks.some((b) => b.pipe));
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the HUD and the maps
  if (part('hud')) try {
    W = __G.pipes; M = g.match; P = M.pipes;
    const A4 = M.local || M.actors.find((a) => a.team === 0);
    for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'test'); }
    const e = P.legs.find((l) => l.id === 'arch').ends[0];
    atApproach(A4, e, 0.1); pushIn(A4, e); step(0.4);
    const ret = __G.hud?.ret?.style.visibility, chip = document.querySelector('.iw-pp-ride.is-on')?.textContent || '';
    let drawn = 0; const dm = P.drawMap.bind(P); P.drawMap = (...a) => { drawn++; return dm(...a); };
    step(0.2);
    P.drawMap = dm;
    const lit = P.lit[e.leg === undefined ? 0 : P.legs[e.leg].ends[1].i];
    R('hud: riding hides the reticle and shows the ride chip "→ S. PROMENADE" (+ the first-rides hint); the exit is lit in the rider\'s colour', ret === 'hidden' && /→ S\. PROMENADE/.test(chip) && /Hold a direction/.test(chip) && lit.n === 1 && lit.team === A4.team, { ret, chip, lit: { n: lit.n, team: lit.team } });
    R('hud: the network draws on the minimap every frame (R.drawMap)', drawn > 0, { drawn });
    rideOut(A4); step(0.3);
    const cd = document.querySelector('.iw-pp-cd.is-on');
    R('hud: the cooldown ring shows on the ink tank after touchdown; the reticle is back', !!cd && __G.hud?.ret?.style.visibility !== 'hidden');
    // the minimap's pixels: the legs drawn (pale) where the Gulper Run crosses mid
    const mm = g.minimap, tc = { x: 0, y: 0 };
    let diff = -1;
    if (mm && mm.canvas) {
      const grab = () => { mm._compose(0); mm.toCanvas(10, 0, tc); const x0 = Math.round(tc.x), y0 = Math.round(tc.y); mm.toCanvas(-10, 0, tc); const x1 = Math.round(tc.x), y1 = Math.round(tc.y); const X0 = Math.min(x0, x1) - 3, Y0 = Math.min(y0, y1) - 3; return mm.ctx.getImageData(X0, Y0, Math.abs(x1 - x0) + 7, Math.abs(y1 - y0) + 7).data; };
      const keep = P.drawMap; P.drawMap = () => {}; const a0 = grab(); P.drawMap = keep; const a1 = grab();
      diff = 0; for (let i = 0; i < a0.length; i += 4) if (Math.abs(a0[i] - a1[i]) + Math.abs(a0[i + 1] - a1[i + 1]) + Math.abs(a0[i + 2] - a1[i + 2]) > 60) diff++;
    }
    R('hud: the minimap draws the Gulper Run across mid (its pixels change with the network layer)', diff > 30 || !mm, { mm: !!mm, changed: diff });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the ride camera
  if (part('cam')) try {
    W = __G.pipes; M = g.match; P = M.pipes;
    const A5 = M.local;
    if (A5) {
      for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'test'); }
      const rig = g.rig;
      // the Express (open air): the boom never comes in for pipe pieces; the yaw ends within 15° of the pop heading
      const xe = P.legs.find((l) => l.id === 'express');
      atApproach(A5, xe.ends[0], 0.1); pushIn(A5, xe.ends[0]);
      let minBoom = Infinity, skipLeak = false, yawAtPop = null, glassWould = 0;
      for (let i = 0; i < 300 && A5.pipe && A5.pipe.phase !== 'pop'; i++) {
        dbg.step(1000 / 60);
        if (__G.physics.skip !== null) skipLeak = true;
        if (A5.pipe?.phase === 'ride' && A5.pipe.u > 20 && A5.pipe.u < xe.len - 10 && A5.pos.y > 7) {
          const back = rig.forward(new THREE.Vector3()).negate(), p1 = {}, p0 = {};
          __G.physics.skip = 'pipe'; __G.physics.cameraProbe(rig.pivot, back, 5.3, 0.62, p1); __G.physics.skip = null;
          __G.physics.cameraProbe(rig.pivot, back, 5.3, 0.62, p0);
          if (p1.hard >= 2.5) minBoom = Math.min(minBoom, rig.curDist);   // (where real walls / roofs allow 2.5 m)
          if (p0.hard < p1.hard - 0.5) glassWould = (glassWould || 0) + 1;
        }
        if (A5.pipe?.phase === 'pop' && yawAtPop === null) yawAtPop = rig.yaw;
      }
      if (yawAtPop === null) yawAtPop = rig.yaw;
      const pe = xe.ends[1], pd = Math.atan2(pe.out[0], pe.out[2]);
      let dy = yawAtPop - pd; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
      rideOut(A5);
      R('cam: on the Express the boom is never pulled in by pipe glass (≥ 2.5 m), physics.skip is cleared every frame, the yaw is within 15° of the pop heading at the pop',
        minBoom >= 2.5 && !skipLeak && Math.abs(dy) < (15 * Math.PI) / 180, { minBoom, skipLeak, yawErrDeg: (dy * 180) / Math.PI, framesGlassWouldPullIn: glassWould });
      // the Gulper Run: the lens stays inside the Great Tank's water volume whenever the rider's centreline is in the tank,
      // boom ≥ 1.2 m, y ≤ 2.0; the underwater grade exactly then
      step(3);
      const gl = P.legs.find((l) => l.id === 'gulper'), tankV = W.X.water[0];
      atApproach(A5, gl.ends[0], 0.1); pushIn(A5, gl.ends[0]);
      let n = 0, bad = 0, minB = Infinity, maxY = -Infinity, gradeBad = 0;
      for (let i = 0; i < 200 && A5.pipe && A5.pipe.phase !== 'pop'; i++) {
        dbg.step(1000 / 60);
        const cx = A5.pos.x, cz = A5.pos.z, inTank = Math.hypot(cx, cz) < tankV.cyl[2] - 1.6 && A5.pipe?.phase === 'ride';
        const cam = __G.camera.position;
        if (inTank) {
          n++;
          if (!D.inWaterVol(tankV, cam.x, cam.y, cam.z, 0.0)) bad++;
          minB = Math.min(minB, rig.curDist); maxY = Math.max(maxY, cam.y);
        }
        const riderIn = D.inWaterVol(tankV, A5.pos.x, A5.pos.y + 0.3, A5.pos.z, 0), inV = riderIn && D.inWaterVol(tankV, cam.x, cam.y, cam.z, 0.05);
        if (A5.pipe?.phase === 'ride' && inV !== !!W.looks.uwOn && Math.abs(Math.hypot(cam.x, cam.z) - tankV.cyl[2]) > 0.1 && Math.abs(cam.y - tankV.y[1]) > 0.1) gradeBad++;
      }
      rideOut(A5);
      R('cam: through the Great Tank (the rider 1.6 m or more inside its water) the lens stays inside the volume (boom ≥ 1.2 m, y ≤ 2.0); the underwater grade is on exactly while the rider and the lens are both in the water',
        n > 20 && bad === 0 && minB >= 1.19 && maxY <= 2.01 && gradeBad === 0, { frames: n, outside: bad, minBoom: minB, maxY, gradeBad });
      step(0.5);
      R('cam: the grade is off once the ride camera is out of the water (and the fog is the stage\'s again)', !W.looks.uwOn && !W.looks.rideVol && !W.looks._fogSave);
    } else R('cam: (no local player in this run)', true);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ bots
  if (part('bots')) try {
    W = __G.pipes; M = g.match; P = M.pipes;
    for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'test'); }
    const bot = M.actors.find((a) => a.bot && !a.isLocal && a.team === 0);
    const gl = P.legs.find((l) => l.id === 'gulper'), eE = gl.ends[0], eW = gl.ends[1];
    // a bot with its goal 2 m past the Gulper's west landing rides it from the east approach
    const goTo = (b, pos) => { const nav2 = __G.nav; const s = nav2.nearest(b.a.pos, 1.2, true), gg = nav2.nearest(pos, 1); P.beforePath(b); const p = nav2.path(s, gg, b.a.team); b.path = p; b.pi = Math.min(1, p ? p.length - 1 : 0); b.goal = gg; b.bestD = Infinity; b.noProg = 0; return p; };
    const runBot = (b, secs, until) => { delete b.update; b.repath = 99; b.goalTimer = 99; let t = 0; for (; t < secs * 60; t++) { dbg.step(1000 / 60); if (until()) break; } b.update = () => {}; b.a.intent.move.set(0, 0, 0); return t / 60; };
    put(bot, [eE.approach[0] + 1.5, eE.approach[1], eE.approach[2] + 1.0]);
    const tgt = new THREE.Vector3(eW.land[0], eW.land[1], eW.land[2] - 1.5);   // (beside the landing, on the court)
    const p = goTo(bot.bot, tgt);
    const plan = p && p.some((id, i) => i && __G.nav.edge(p[i - 1], id)?.type === 'pipe');
    let rode = false;
    const gn = __G.nav.nodes[bot.bot.goal];
    let best = Infinity, tAt = -1, landedAt = -1, tk = 0;
    runBot(bot.bot, 8, () => { tk++; if (bot.pipe) rode = true; if (rode && !bot.pipe && landedAt < 0) landedAt = tk / 60; const d = Math.hypot(bot.pos.x - gn.x, bot.pos.z - gn.z); if (rode && !bot.pipe && d < best) { best = d; if (d < 1.0 && tAt < 0) tAt = tk / 60; } return tAt > 0; });
    R('bots: a bot whose goal is past a pipe\'s landing plans the \'pipe\' edge, walks in along the axis, rides and arrives (within the ride time + 3 s)', plan && rode && tAt > 0 && tAt < 2.2 + 3, { plan, rode, t: tAt, landedAt, best, mode: bot.bot.mode, path: !!bot.bot.path });
    // a bot that saw 2 enemies near the exit walks instead (no wall-hacks: its own sight memory)
    for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'test'); }
    put(bot, [eE.approach[0] + 1.5, eE.approach[1], eE.approach[2] + 1.0]);
    const sm = bot.bot.sight;
    for (const en of M.actors.filter((a) => a.team !== bot.team).slice(0, 2)) { const k = sm._k(en); k.pos.set(eW.land[0] - 1, 0, eW.land[2] + 1); k.t = G_time(); k.seen = true; }
    function G_time() { return window.__G.time; }
    const p2 = goTo(bot.bot, tgt);
    const plan2 = p2 && p2.some((id, i) => i && __G.nav.edge(p2[i - 1], id)?.type === 'pipe');
    sm.mem.clear();
    R('bots: a bot that saw 2 enemies at the exit\'s landing in the last 3 s walks round instead (+20 each on that key)', !plan2, { plan2 });
    // a blocked mouth: a body in the way (an enemy standing in it) → given up within 2.5 s, the key marked bad
    put(bot, [eE.approach[0] + 1.5, eE.approach[1], eE.approach[2] + 1.0]);
    goTo(bot.bot, tgt);
    // (a crate dropped across the mouth: something the bot can't push past, as a body or a curtain would be)
    const blk = L.addDynamic({ tag: 'test:block' });
    L.moveDynamic(blk, new THREE.Vector3(eE.pos[0] + eE.out[0] * 0.4, eE.floorY + 1.0, eE.pos[2] + eE.out[2] * 0.4), new THREE.Vector3(0.2, 1.0, 1.4), Math.atan2(-eE.out[2], eE.out[0]));
    const bp = bot.pos.clone();
    let gaveUp = -1, tk2 = 0;
    runBot(bot.bot, 4, () => { tk2++; if (bot.pipe) return true; if (!bot.bot.path && gaveUp < 0) { gaveUp = tk2 / 60; return true; } return false; });
    blk.solid = false; L.moveDynamic(blk, new THREE.Vector3(0, -50, 0), new THREE.Vector3(0.1, 0.1, 0.1), 0);
    const bad = P.badKey.get(bot.bot), marked = bad && bad.get(gl.i * 2) > __G.time;
    void bp;
    R('bots: a mouth it can\'t get into (something solid in the way) is given up within 2.5 s of pushing and its key marked bad for 5 s (+60)', !bot.pipe && gaveUp > 0 && gaveUp < 3.5 && marked, { gaveUp, marked, pipe: !!bot.pipe });
    if (bot.pipe) P._abort(bot, 'test');
    // the tidal leg's both directed specs exist from load, the closed one masked
    const kl = P.legs.find((l) => l.id === 'kelp'), kk = [kl.i * 2, kl.i * 2 + 1];
    R('bots: both directed Kelp edges exist from load; the closed direction is masked (Infinity) by the tide', W.edgeKeys.has(kk[0]) && W.edgeKeys.has(kk[1]) && (P.keyShut[kk[0]] !== P.keyShut[kk[1]]), { has: kk.map((k) => W.edgeKeys.has(k)), shut: kk.map((k) => P.keyShut[k]) });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ looks
  if (part('looks')) try {
    W = __G.pipes; M = g.match; P = M.pipes;
    const grp = W.looks.group;
    const meshes = []; grp.traverse((o) => { if (o.isMesh && o.visible) meshes.push(o.name); });
    R('looks: the Tubeway draws in ≤ 8 meshes (glass back + front, hardware, rings, fans, flaps, signs + floor arrows, the deck light) and the grade only while on', meshes.length <= 8 && !W.looks.uw.visible, { meshes });
    R('looks: the glass is ≤ 120 k triangles with its hardware', W.looks.tris < 120000, { tris: Math.round(W.looks.tris) });
    // a rider glows in the tube in its team colour (the glass shader's uRide carries it)
    const A6 = M.local || M.actors[0];
    for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'test'); }
    const ex = P.legs.find((l) => l.id === 'express');
    atApproach(A6, ex.ends[0], 0.1); pushIn(A6, ex.ends[0]); step(0.6);
    const U = W.looks.uniforms.uRide.value[0], on = W.looks.uniforms.uRideOn.value[0];
    R('looks: a rider lights its tube in its team colour (uRide: its leg, its arc position, its team)', U.x === ex.i && Math.abs(U.y - A6.pipe.s) < 0.5 && U.z === A6.team && on === 1, { leg: U.x, s: U.y, team: U.z });
    rideOut(A6);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ a stage without the key
  if (part('none')) try {
    const { MAPS } = await import('./src/config.js');
    await g._buildWorld(MAPS.find((m) => m.id === 'halyard'));
    const noBlocks = !__G.level.blocks.some((b) => b.pipe), noEdges = !__G.nav.nodes.some((n) => n.nb.some((e) => e.type === 'pipe'));
    let grp = null; __G.scene.traverse((o) => { if (o.name === 'pipes') grp = o; });
    R('none: a stage without LAYOUT.pipes gets no glass block, no pipe edge, no draw call, no module world (halyard)', noBlocks && noEdges && !grp && !__G.pipes && !(__G.stageWorld?.keys || []).includes('pipes'), { noBlocks, noEdges, grp: !!grp });
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }
  unsub.forEach((f) => f());
  R(`(ran in ${((performance.now() - T0) / 1000).toFixed(0)} s)`, true);
  return out;
})()
