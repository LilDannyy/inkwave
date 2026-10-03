// surf-movers (2026-10-03): Surf N' Turf on moving things — src/game/sp-surf.js (the buoy's _support / _pushed / _fall:
// the same rule for every moving level block). The user: "the surf n turf doesnt follow gravity such as moving blocks
// (like the tower)".
//   MAP=podbox MODE=tower PAGE=tools/botlab/tests/surf-movers.js tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=podbox MODE=turf PAGE=tools/botlab/tests/surf-movers.js PAGE_ARGS='only=hedge' tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=calamari MODE=turf PAGE=tools/botlab/tests/surf-movers.js tools/botlab/run.sh tools/botlab/page.cjs
// Sections (PAGE_ARGS only=…; each runs where its stage has the thing):
//  - tower (Tower Command): a buoy dropped onto the moving tower lands on its deck and rides it (same spot on the deck,
//    the deck's height, metres along with it); the rings leave from where it is when each one leaves (each ring
//    centred there, its polar map from there), the owner's [6] word for those; a ghost built from the owner's records
//    rides the tower too, its rings centred where the owner's were;
//  - lift (any stage: a test platform, Level.addDynamic): a buoy on a moving platform rides it along and up; the
//    platform taken away from under it → it falls (no ring leaves while it's in the air, the ones out keep going) and
//    anchors on the floor below, the owner's [5] word for it; a block rising under a buoy on the floor lifts it onto
//    its top; a tall block driving into it from the side shoves it out (never left inside it) and it stays anchored
//    on the floor;
//  - hedge (pods): a bramble wall growing where a buoy stands in its trough — it ends up on the wall's top or out of
//    its way (never inside it); the wall wilting away → back down to the floor, anchored;
//  - rail (movers: Calamari's railcars): a buoy on the trackbed ahead of a departing car is pushed along ahead of it
//    (never inside the car), anchored where the car stops; one dropped onto a moving car's roof (off-limits) slides
//    off it, carried by the car's motion, and anchors beside the track.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SPECIALS, PLAYER } = await import('./src/config.js');
  const { KIT_GHOSTS } = await import('./src/game/kits/registry.js');
  const SURF = await import('./src/game/sp-surf.js');
  const G = window.__G, L = G.level, D = SPECIALS.surf, ST = SURF.SURF_STATS;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(1 / 60); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  for (let i = 0; i < 1200 && m.state !== 'playing'; i++) frame();
  const me = m.local;
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); };
  const home = (a, i) => { const pd = L.spawnPads[a.team]; a.pos.set(pd.x + (i % 4) - 1.5, pd.y + 0.1, pd.z); a.vel.set(0, 0, 0); a.grounded = false; };
  const homeAll = () => m.actors.forEach(home);
  const buoys = () => G.specials.world.filter((w) => w.kind === 'surf');
  const clearBuoys = () => { for (const b of buoys()) { b.dead = true; b.phase = 'pop'; } step(2 / 60); };
  // the owner's records (as surf.js's local session stub: nothing leaves the page)
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {}, recMover() {},
    recKit: (a, kind, data) => sent.push({ a, kind, data: JSON.parse(JSON.stringify(data)), t: G.time }), sendDevHit: () => {}, shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  const recs = (gid, k) => sent.filter((x) => x.kind === 'surf' && x.data[1] === gid && (k === undefined || x.data[0] === k)).map((x) => x.data);
  // a flat open floor spot (no drop or wall within r m, nothing overhead within 6 m), nearest to (x, z)
  const flatSpot = (x0, z0, r = 6) => {
    const S = [...G.nav.nodes].sort((p, q) => Math.hypot(p.x - x0, p.z - z0) - Math.hypot(q.x - x0, q.z - z0));
    for (const n of S) {
      let ok = !G.physics.raycast(V(n.x, n.y + 0.3, n.z), V(0, 1, 0), 5).hit && !(G.nav.blocked && G.nav.blocked[n.id]);
      for (let rr = 1; ok && rr <= r; rr += 1) for (let k = 0; ok && k < 12; k++) { const a = (k / 12) * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * rr, n.z + Math.cos(a) * rr, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) ok = false; }
      if (ok) return V(n.x, n.y, n.z);
    }
    return null;
  };
  const drop = (owner, p, gid = 0, vel = V(0, 0, 0)) => { const b = new SURF.Buoy(owner, p, vel, false, gid); G.specials.world.push(b); return b; };
  const inside = (b, blk, pad = 0) => { const dx = b.pos.x - blk.center.x, dz = b.pos.z - blk.center.z, lx = dx * blk.axes[0].x + dz * blk.axes[0].z, lz = dx * blk.axes[2].x + dz * blk.axes[2].z;
    return Math.abs(lx) < blk.half.x - pad && Math.abs(lz) < blk.half.z - pad && b.pos.y < blk.center.y + blk.half.y - 0.05 && b.pos.y + 0.5 > blk.center.y - blk.half.y; };
  homeAll(); step(0.3);

  try {
    // ============================================================================================ the tower
    if (want('tower') && m.tower) {
      const T = m.tower, A = m.actors.filter((a) => a.team === 0);
      netOn();
      // a team-0 rider pushes it (its own brain stubbed: it just stands on the deck)
      const rider = A.find((a) => a !== me) || A[0];
      const onTop = (a) => { a.pos.set(T.pos.x - 0.6, T.top + 0.05, T.pos.z - 0.6); a.vel.set(0, 0, 0); a.grounded = false; };
      onTop(rider); step(0.5);
      const moving0 = T.moving;
      // the buoy dropped onto the deck from 3 m up (beside the pillar), a ghost of it built from its records as they come
      const GID = 7001, GG = 7002, fwd = (d) => { const c = d.slice(); c[1] = GG; return c; };
      let fed = 0;
      const feed = () => { const list = sent.filter((x) => x.kind === 'surf' && x.data[1] === GID); for (; fed < list.length; fed++) KIT_GHOSTS.surf.ghost(me, fwd(list[fed].data)); };
      const from = V(T.pos.x + 0.62, T.top + 3, T.pos.z + 0.62), vel = V(0, 0, 0);
      const b = drop(me, from, GID, vel);
      KIT_GHOSTS.surf.ghost(me, [0, GG, ...v2(from), 0, 0, 0]);
      const gb = buoys().find((w) => w.ghost && w.gid === GG);
      hook = feed;
      step(2, () => b.phase === 'fly');
      step(0.05);
      const offA = V(b.pos.x - T.pos.x, b.pos.y - T.top, b.pos.z - T.pos.z);
      R('tower: a buoy dropped onto the moving tower lands on its deck and holds there (riding its block)', b.phase === 'live' && b.on && b.on.b === T.block && Math.abs(offA.y) < 0.02 && moving0 !== 0,
        { phase: b.phase, on: b.on && b.on.b.tag, off: v2(offA), moving: moving0, s: r2(T.s) });
      // ride: 3 s with the tower moving; its spot on the deck kept, metres along
      const p0 = b.pos.clone(), s0 = T.s, pulses = [];
      const off = (await import('./src/core/ctx.js')).on('surf:pulse', (e) => { if (e.buoy === b) { const Rg = b.rings[e.i]; pulses.push({ i: e.i, c: v2(Rg.c), at: v2(b.pos), pc: [r2(Rg.polar.cx), r2(Rg.polar.cy), r2(Rg.polar.cz)] }); } });
      let drift = 0, dy = 0, gDiff = 0;
      step(3, () => {
        drift = Math.max(drift, Math.hypot(b.pos.x - T.pos.x - offA.x, b.pos.z - T.pos.z - offA.z)); dy = Math.max(dy, Math.abs(b.pos.y - T.top));
        if (gb && gb.phase === 'live') gDiff = Math.max(gDiff, b.pos.distanceTo(gb.pos));
        onTop(rider);
      });
      off();
      const rode = r2(b.pos.distanceTo(p0));
      R(`tower: it rides the tower (${rode} m along with it: the same spot on the deck within ${r2(drift)} m, at the deck's height)`,
        rode > 1.2 && Math.abs(rode - Math.abs(T.s - s0)) < 0.1 && drift < 0.03 && dy < 0.02 && b.phase === 'live' && !b.fall, { rode, towerMoved: r2(Math.abs(T.s - s0)), drift: r2(drift), dy: r2(dy) });
      // the rings leave from where it is: each centred on the buoy as it left, its polar map from there; later rings further on
      const moved = pulses.length >= 2 ? Math.hypot(pulses[pulses.length - 1].c[0] - pulses[0].c[0], pulses[pulses.length - 1].c[2] - pulses[0].c[2]) : 0;
      const r6 = recs(GID, 6);
      R(`tower: its rings leave from where it has got to (${pulses.length} rings out, the last ${r2(moved)} m on from the first) — each centred there with its polar map; the owner's word for each one off the anchor ([6])`,
        pulses.length >= 2 && pulses.every((p) => Math.hypot(p.c[0] - p.at[0], p.c[2] - p.at[2]) < 0.02 && Math.hypot(p.pc[0] - p.c[0], p.pc[2] - p.c[2]) < 0.02) && moved > 0.5 && r6.length >= pulses.length - 1,
        { pulses, recs6: r6 });
      // the ghost (another screen's copy, from the records): on the tower too, its rings where the owner's were
      const gRings = gb ? gb.rings.filter((x) => x.c).map((x) => v2(x.c)) : [];
      const oRings = b.rings.filter((x) => x.c).map((x) => v2(x.c));
      R('tower: a ghost from the owner\'s records rides the tower too (with the owner\'s copy all the way) and its rings are centred where the owner\'s were',
        gb && gb.phase === 'live' && gb.on && gb.on.b === T.block && gDiff < 0.05 && gRings.length === oRings.length && gRings.every((c, i) => Math.hypot(c[0] - oRings[i][0], c[2] - oRings[i][2]) < 0.02),
        { gDiff: r2(gDiff), owner: oRings, ghost: gRings, on: gb && gb.on && gb.on.b.tag });
      hook = null; clearBuoys(); netOff();
      homeAll(); step(0.3);
    }

    // ============================================================================================ a test platform
    if (want('lift')) {
      const S = flatSpot(m.tower ? 12 : 0, m.tower ? 26 : 0, 5) || flatSpot(0, 0, 4);
      R('lift: a flat open floor spot to stage it on', !!S, S && v2(S));
      if (S) {
        netOn();
        const plat = L.addDynamic({ tag: 'test:platform' }), half = V(1.6, 0.25, 1.6);
        let c = V(S.x, S.y + 2.25, S.z);
        L.moveDynamic(plat, c, half, 0.3);
        step(0.05);
        // dropped on it
        const GID = 7101;
        const b = drop(me, V(S.x + 0.4, S.y + 4, S.z - 0.3), GID);
        step(2, () => b.phase === 'fly');
        step(0.05);
        const landed = b.phase === 'live' && b.on && b.on.b === plat && Math.abs(b.pos.y - (c.y + half.y)) < 0.02;
        // along 2 m (1 m/s) and up 1 m (0.5 m/s)
        const off0 = V(b.pos.x - c.x, 0, b.pos.z - c.z);
        let drift = 0;
        step(2, () => { c.x += 1 / 60; c.y += 0.5 / 60; L.moveDynamic(plat, c, half, 0.3); drift = Math.max(drift, Math.hypot(b.pos.x - c.x - off0.x, b.pos.z - c.z - off0.z)); });
        step(2 / 60);
        R('lift: a buoy dropped onto a moving platform rides it — 2 m along and 1 m up with it, its spot on it kept, on its top',
          landed && drift < 0.05 && Math.abs(b.pos.y - (c.y + half.y)) < 0.02 && b.pos.x > S.x + 0.4 + 1.9, { landed, drift: r2(drift), at: v2(b.pos), top: r2(c.y + half.y) });
        // taken away from under it: it falls (the rings' clock waits in the air; a ring out keeps going) and anchors below
        step(Math.max(0, D.anchor + D.gap - b.T + 0.2));   // (a ring on its way)
        const rOut = b.rings.find((x) => x.state === 'travel');
        const T0 = b.T, r0 = rOut ? rOut.r : 0, f0 = ST.falls, a0 = ST.reanchors, n5 = recs(GID, 5).length;
        plat.solid = false; L.moveDynamic(plat, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        let airT = 0, landT = null;
        step(2, (i) => { if (b.fall) airT += 1 / 60; else if (i > 1 && landT == null) { landT = i; return false; } });
        const r5 = recs(GID, 5);
        const floorY = L.groundHeight(b.pos.x, b.pos.z, b.pos.y + 0.5);
        R(`lift: the platform taken away from under it → it falls (${r2(airT)} s in the air) and anchors on the floor below — no ring leaves while it's in the air (its ring clock held), the one out kept going; the owner's word for where ([5])`,
          ST.falls === f0 + 1 && ST.reanchors === a0 + 1 && b.phase === 'live' && !b.fall && Math.abs(b.pos.y - S.y) < 0.03 && Math.abs(floorY - b.pos.y) < 0.03 && Math.abs(b.T - T0 - (landT != null ? 0 : 0)) < 0.05 + 2 / 60
          && airT > 0.3 && (!rOut || rOut.r > r0 + 2) && r5.length === n5 + 1 && Math.hypot(r5[r5.length - 1][2] - b.pos.x, r5[r5.length - 1][4] - b.pos.z) < 0.02 && Math.abs(r5[r5.length - 1][5] - b.T) < 0.05,
          { falls: ST.falls - f0, reanchors: ST.reanchors - a0, at: v2(b.pos), floor: r2(S.y), T: [r2(T0), r2(b.T)], airT: r2(airT), ring: rOut && [r2(r0), r2(rOut.r)], rec5: r5[r5.length - 1] });
        clearBuoys();
        // a block rising under a buoy on the floor: onto its top (riding it up)
        const pad = L.addDynamic({ tag: 'test:riser' }), ph = V(1.2, 0.05, 1.2);
        const b2 = drop(me, V(S.x - 2.5, S.y + 1, S.z), 7102);
        step(1.5, () => b2.phase === 'fly'); step(0.1);
        let pc = V(S.x - 2.5, S.y - 0.06, S.z);   // (just under the floor, then up through it)
        L.moveDynamic(pad, pc, ph, 0);
        const l0 = ST.lifts;
        step(2, () => { pc.y += 0.8 / 60; L.moveDynamic(pad, pc, ph, 0); });
        step(2 / 60);
        R('lift: a block rising under a buoy standing on the floor lifts it onto its top and carries it up', b2.on && b2.on.b === pad && Math.abs(b2.pos.y - (pc.y + ph.y)) < 0.02 && b2.pos.y > S.y + 1.4 && b2.phase === 'live' && !b2.fall,
          { lifts: ST.lifts - l0, at: v2(b2.pos), top: r2(pc.y + ph.y), on: b2.on && b2.on.b.tag });
        pad.solid = false; L.moveDynamic(pad, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        step(1.5);
        clearBuoys();
        // a tall block driving into it from the side: shoved out ahead of it, never left inside, still anchored on the floor
        const ram = L.addDynamic({ tag: 'test:ram' }), rh = V(1.0, 1.0, 1.4);
        const b3 = drop(me, V(S.x + 1, S.y + 1, S.z + 1.5), 7103);
        step(1.5, () => b3.phase === 'fly'); step(0.1);
        const start3 = b3.pos.clone();
        let rc = V(S.x - 2.5, S.y + 1, S.z + 1.5), worst = 0;
        const s0 = ST.shoves, n5b = recs(7103, 5).length;
        step(2.5, () => { if (rc.x < S.x + 3.5) rc.x += 2 / 60; L.moveDynamic(ram, rc, rh, 0); if (inside(b3, ram, 0.05)) worst++; });
        step(0.4);
        R('lift: a tall block driving into it from the side shoves it out ahead (never left inside it), and it stays anchored on the floor; the owner\'s word for where it settled ([5])',
          ST.shoves > s0 && worst === 0 && b3.phase === 'live' && !b3.fall && Math.abs(b3.pos.y - S.y) < 0.03 && b3.pos.x > start3.x + 1 && b3.pos.x >= rc.x + rh.x && recs(7103, 5).length > n5b,
          { shoves: ST.shoves - s0, inside: worst, from: v2(start3), at: v2(b3.pos), blockFront: r2(rc.x + rh.x), rec5: recs(7103, 5).slice(-1)[0] });
        ram.solid = false; L.moveDynamic(ram, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        clearBuoys(); netOff();
      }
    }

    // ============================================================================================ a hedge growing under it
    if (want('hedge') && m.pods) {
      const P = m.pods;
      m.duration = 99999; m.time = m.duration - P.t;
      const setClock = (t) => { m.time = m.duration - t; step(1 / 60); };
      const p = P.pods.find((q) => q.kind === 'wall' && q.id === 'gate') || P.pods.find((q) => q.kind === 'wall');
      // the buoy in its trough, beside the bulb (1.6 m along the wall)
      const at = V(p.x + 1.6 * p.c, p.y + 2, p.z - 1.6 * p.s);
      const b = drop(me, at, 0);
      step(2, () => b.phase === 'fly'); step(0.1);
      const before = v2(b.pos);
      P.grow(p, 0, P.t);
      let inBlk = 0;
      step(1.2, () => { for (const q of p.parts) if (q.blk.solid && inside(b, q.blk, 0.1)) inBlk++; });
      const onTop = b.on && p.parts.some((q) => q.blk === b.on.b);
      const outOf = !p.parts.some((q) => q.blk.solid && inside(b, q.blk, -0.4));
      R(`hedge: a bramble wall growing where a buoy stands in its trough — it ends up ${onTop ? 'on the wall\'s top, riding it' : 'shoved out of its way'} (never left inside it)`,
        b.phase === 'live' && inBlk === 0 && (onTop || outOf), { before, at: v2(b.pos), onTop, inBlk, state: p.state });
      // the wall wilting away: back down to the floor (riding the top down, then a fall when it's gone), anchored
      setClock(p.wiltAt - 0.05);
      step(P.T.wilt + 1.2);
      const fy = L.groundHeight(b.pos.x, b.pos.z, b.pos.y + 0.5);
      R('hedge: the wall wilting away takes it back down to the floor, anchored there', b.phase === 'live' && !b.fall && Math.abs(b.pos.y - fy) < 0.05 && !b.on, { at: v2(b.pos), floor: r2(fy), state: p.state });
      clearBuoys();
    }

    // ============================================================================================ Calamari's railcars
    if (want('rail') && m.movers) {
      const M = m.movers, Tt = M.T;
      const setClock = (t) => { m.time = m.duration - t; frame(); };
      const car = M.cars[0];
      netOn();
      // (a) on the trackbed ahead of a departing car: pushed along ahead of it, never inside it, anchored where it stops
      setClock(Tt.first - 1.2); step(0.05);
      const front0 = car.pos.clone().addScaledVector(car.u, car.len / 2);
      const spot = front0.clone().addScaledVector(car.u, 3);
      spot.y = L.groundHeight(spot.x, spot.z, car.A.y + 1);
      const b = drop(me, V(spot.x, spot.y + 1, spot.z), 7201);
      step(1.0, () => b.phase === 'fly');
      const placed = b.phase === 'live' ? v2(b.pos) : null;
      let worst = 0, sh0 = ST.shoves, maxV = 0;
      step(Tt.move + 1.5, () => { if (inside(b, car.block, 0.05)) worst++; maxV = Math.max(maxV, Math.abs(car.vel)); });
      const along = (b.pos.x - spot.x) * car.u.x + (b.pos.z - spot.z) * car.u.z;
      const frontNow = (b.pos.x - car.pos.x) * car.u.x + (b.pos.z - car.pos.z) * car.u.z;
      R(`rail: a buoy on the trackbed ahead of a departing railcar is pushed along ahead of it (${r2(along)} m; never inside the car) and anchored where it stopped`,
        !!placed && ST.shoves > sh0 && worst === 0 && along > 3 && frontNow >= car.len / 2 && b.phase === 'live' && !b.fall && maxV > 1, { placed, at: v2(b.pos), along: r2(along), frontGap: r2(frontNow - car.len / 2), inside: worst, shoves: ST.shoves - sh0 });
      clearBuoys();
      // (b) dropped onto a moving car's roof: off-limits — it slides off, carried along by the car, and anchors beside the track
      // (the car on its way back, at speed, with open sky over its roof — not under the overpass)
      const leg = Tt.dwell + Tt.move, roofY = car.pos.y + car.ht, clearSky = () => [-2, 0, 2].every((k) => !G.physics.raycast(V(car.pos.x + car.u.x * k, roofY + 0.1, car.pos.z + car.u.z * k), V(0, 1, 0), 3).hit);
      let tt = 0.25; for (; tt <= 0.75; tt += 0.05) { setClock(Tt.first + leg + Tt.move * tt); if (clearSky()) break; }
      step(0.05);
      const fallT = Math.sqrt((2 * 1.2) / SURF.GRAV);   // (dropped 1.2 m over the roof, ahead by what the car covers meanwhile)
      const b2 = drop(me, V(car.pos.x + car.u.x * car.vel * fallT, roofY + 1.2, car.pos.z + car.u.z * car.vel * fallT), 7202);
      let onRoof = false, carV = car.vel, minAlong = 0;
      const x0 = b2.pos.clone();
      step(3, () => { if (b2.phase === 'fly' && Math.abs(b2.pos.y - roofY) < 0.15 && Math.abs((b2.pos.x - car.pos.x) * -car.u.z + (b2.pos.z - car.pos.z) * car.u.x) < car.wid / 2) onRoof = true; return b2.phase === 'fly'; });
      step(0.1);
      const alongB = (b2.pos.x - x0.x) * car.u.x + (b2.pos.z - x0.z) * car.u.z;
      const side = Math.abs((b2.pos.x - car.pos.x) * -car.u.z + (b2.pos.z - car.pos.z) * car.u.x);
      void minAlong;
      R(`rail: a buoy dropped onto a moving railcar's roof (off-limits) slides off it, carried along by the car (${r2(alongB)} m its way), and anchors beside the track`,
        onRoof && b2.phase === 'live' && !b2.fall && side >= car.wid / 2 && Math.sign(alongB) === Math.sign(carV) && Math.abs(alongB) > 0.4 && !inside(b2, car.block, 0),
        { onRoof, at: v2(b2.pos), along: r2(alongB), carVel: r2(carV), side: r2(side), halfWidth: r2(car.wid / 2) });
      clearBuoys(); netOff();
    }
  } finally { hook = null; netOff(); }
  return out;
})()
