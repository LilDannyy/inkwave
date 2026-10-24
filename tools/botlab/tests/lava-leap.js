// Highmark Foundry, fix round 7 (the lead's decision after review 7, DESIGN §3.5): the Sponge Mitts' leap over the lava is
// skill movement like a swim jump — but not off a roof top, and a bot's leap flies as it was planned.
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-leap.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   A  the roof gate holds for the kit's jump: a Mitts kid on a roof top (Organ L's 1.0 m stub, race 3's boulder, at HIGH)
//      presses fire + jump: no charge starts and no jump leaves the roof while it stands there (actor.js: the kit's jump is
//      not asked on a roof; mitts.js startCharge refuses one) — and on the lookout's own top (no roof) the same press
//      charges a leap (the control)
//   B  a bot's leap is not steered: a Mitts bot leaps from the causeway's edge over the lava to a landing its plan checked
//      (the kit's own predictLeap; dry now and 2 s on, as mitts.js landingOk), with an enemy behind it (the brain wants to
//      turn back): every frame in the air its stick holds along the leap (bots.js: the air guard never steers a kit leap),
//      and it comes down alive within 0.6 m of the predicted spot (review 7: the guard's pick bent a leap off the causeway
//      0.33 m short into the lava)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { MITTS } = await import('./src/game/kits/mitts.js');
  const W = __G.lavaWorld, Lv = g.match?.lava, dbg = g.debug, lvl = __G.level;
  R('the lava module runs on the stage', !!W && !!Lv);
  if (!W || !Lv) return out;
  dbg.freeze();
  const brains = new Map();
  for (const a of g.match.actors) if (a.bot) { brains.set(a, a.bot.update); a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const step = (n = 1) => { for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const setT = (t) => { Lv.debugT(t); step(1); };
  const K = C.LAVA.kill;
  const bots = g.match.actors.filter((a) => a.bot && a !== g.match.local);
  const kid = bots.find((b) => b.team === 0), foe = bots.find((b) => b.team === 1);
  const park = () => { for (const a of g.match.actors) { if (a === kid || a === foe) continue; const pad = lvl.spawnPads[a.team]; if (!a.alive) a.respawn(); a.pos.set(pad.x, pad.y + 0.1, pad.z); a.vel.set(0, 0, 0); a.invuln = 1e6; } };
  const w0 = kid.weaponId;
  kid.setWeapon('mitts');
  const it = kid.intent, r = kid.weaponRunner;

  // ------------------------------------------------------------------------------------------------ A: the roof gate
  setT(50); park();
  const rid = (id) => Lv.riders.find((q) => q.r.id === id);
  // (a rider's blocks follow its normalized parts: the body's boxes first, then the data's parts — the stub, the boulder)
  const partBlock = (id) => { const RR = rid(id); if (!RR) return null; const k = RR.r.parts.findIndex((p) => !p.body && !p.pipe); return k >= 0 ? RR.blocks[k] : null; };
  const rows = [];
  const tryPress = (label, at, roofBlock) => {
    kid.isBot = true; kid.carry = null;
    if (!kid.alive) kid.respawn();
    kid.spawnAt(at, 0); kid.invuln = 1e6; kid.hp = 100; kid.vel.set(0, 0, 0); kid.form = 'kid'; kid.ink = 100;
    it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false;
    for (let i = 0; i < 3; i++) step();
    const k = MITTS.K(r); k.charging = k.leaping = false;
    kid.isBot = false;   // (the kit's jump hook takes a player's fire + jump; bots leap through their own code)
    const onIt = () => kid.grounded && kid.ground.hit && (roofBlock ? kid.ground.block === roofBlock.id : !lvl.blocks[kid.ground.block]?.roof);
    const was = onIt();
    let charged = false, rose = false, frames = 0, y0 = kid.pos.y;
    it.fire = true; it.jump = true;
    for (let f = 0; f < 24; f++) {
      if (!onIt()) break;
      frames++;
      step();
      if (MITTS.K(r).charging || MITTS.K(r).leaping) charged = true;
      if (kid.vel.y > 1 || kid.pos.y > y0 + 0.2) rose = true;
    }
    it.fire = false; it.jump = false; step(2);
    const k2 = MITTS.K(r); if (k2.charging) { k2.charging = false; k2.charge = 0; }
    kid.isBot = true;
    rows.push({ label, startedOn: was, framesOn: frames, charged, rose });
    return { was, charged, rose, frames };
  };
  const top = rid('organL').top;
  const ctl = tryPress('Organ L top (no roof)', V(-10, top + 0.05, -12.0), null);
  const stubB = partBlock('organL'), stubTop = stubB ? stubB.center.y + stubB.half.y : null;
  const stub = stubB ? tryPress('Organ L stub (roof)', V(stubB.center.x, stubTop + 0.05, stubB.center.z), stubB) : null;
  const bould = partBlock('race3'), bTop = bould ? bould.center.y + bould.half.y : null;
  const boul = bould ? tryPress('race 3 boulder (roof)', V(bould.center.x, bTop + 0.05, bould.center.z), bould) : null;
  R('A: the roof gate holds for the Mitts leap — fire + jump on a roof top (Organ L\'s stub, race 3\'s boulder, HIGH) starts no charge and no jump while the kid stands on it; on the lookout\'s own top the same press charges a leap (the control)',
    ctl.was && ctl.charged && !!stub && stub.was && stub.frames >= 3 && !stub.charged && !stub.rose && !!boul && boul.was && boul.frames >= 3 && !boul.charged && !boul.rose,
    { rows, stubBlock: stubB?.tag, boulderBlock: bould?.tag });

  // ------------------------------------------------------------------------------------------------ B: a bot's leap
  // a plan as a bot makes one (MITTS.leapVelocity with its yaw / pitch / charge, MITTS.predictLeap): from the causeway's
  // edge outward over the lava to dry ground (not wet now nor in 2 s, nor 0.8–2.4 m on along its line), the longest lava
  // stretch under it first
  const res = {};
  for (const level of ['low', 'high']) {
    setT(level === 'low' ? 10 : 50); park();
    const SM = g.match.stage;
    const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
    const k = MITTS.K(r), land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, pts = new Float32Array(64 * 3), vv = V(0, 0, 0);
    let plan = null;
    for (const sz of [-15.5, -16.5, -17.5, -18.5, -19.5, -20.5]) for (const side of [1, -1]) {
      // the causeway's edge on that side at this z (the first lava 0.1 m steps out from x 0)
      let ex = null; for (let s = 0.5; s < 9; s += 0.1) if (lavaAt(side * s, sz, 1.3)) { ex = side * (s - 0.45); break; }
      if (ex === null) continue;
      const fy = lvl.groundHeight(ex, sz, 2); if (!(fy > 0.9)) continue;
      const from = V(ex, fy, sz);
      for (let dyaw = -0.9; dyaw <= 0.9 + 1e-6; dyaw += 0.15) for (const c of [0.3, 0.5, 0.7, 0.9, 1]) {
        const yaw = (side > 0 ? Math.PI / 2 : -Math.PI / 2) + dyaw;
        k.botWant = c; k.botYaw = yaw; k.botPitch = 0;
        MITTS.leapVelocity(kid, k, c, vv); k.botWant = -1;
        MITTS.predictLeap(from, vv, land, pts);
        if (land.kind !== 'ground') continue;
        const L = land.pos, dx = L.x - from.x, dz = L.z - from.z, d = Math.hypot(dx, dz) || 1;
        if (Lv.covers(L.x, L.z, L.y) || SM.wet(L.x, L.z, L.y, 2)) continue;
        let slideBad = false; for (const q of [0.8, 1.6, 2.4]) { const x = L.x + (dx / d) * q, z = L.z + (dz / d) * q, gy = lvl.groundHeight(x, z, L.y + 0.5); if (gy === -Infinity || SM.wet(x, z, gy, 2)) slideBad = true; }
        if (slideBad) continue;
        let run = 0, best = 0; for (let q = 0.1; q < d; q += 0.1) { if (lavaAt(from.x + (dx / d) * q, from.z + (dz / d) * q, fy + 0.3)) { run += 0.1; best = Math.max(best, run); } else run = 0; }
        if (best < 0.8) continue;
        if (!plan || best > plan.lava) plan = { from: from.clone(), yaw, c, v: vv.clone(), to: L.clone(), lava: r2(best), t: land.t };
      }
    }
    if (!plan) { res[level] = { plan: null }; continue; }
    // the bot on its spot, brain on, an enemy 4 m behind it (brain off, invulnerable): the leap released as the kit does
    kid.isBot = true; if (!kid.alive) kid.respawn();
    kid.spawnAt(plan.from.clone().setY(plan.from.y + 0.05), 0); kid.vel.set(0, 0, 0); kid.invuln = 1e6; kid.hp = 100; kid.ink = 100; kid.form = 'kid';
    const back = V(-Math.sin(plan.yaw), 0, -Math.cos(plan.yaw));
    if (!foe.alive) foe.respawn();
    { const fx = plan.from.x + back.x * 4, fz = plan.from.z + back.z * 4, fy = lvl.groundHeight(fx, fz, plan.from.y + 1); foe.spawnAt(V(fx, (fy > -50 ? fy : plan.from.y) + 0.05, fz), 0); foe.invuln = 1e6; foe.vel.set(0, 0, 0); }
    step(3);
    kid.bot.update = brains.get(kid); kid.bot.path = null; kid.bot.repath = 0;
    step(2);
    const k3 = MITTS.K(r);
    k3.charging = false; k3.cling = false; k3.hang = false;
    kid.pos.copy(plan.from); kid.vel.copy(plan.v); kid.grounded = false; kid.coyote = 0; kid.jumpBuffer = 0;
    k3.leaping = true; k3.leapT = 0; k3.slid = false; k3.leapV.set(plan.v.x, 0, plan.v.z); k3.leapH = Math.hypot(plan.v.x, plan.v.z); k3.trail = 0; k3.trailP.copy(kid.pos);
    MITTS.predictLeap(kid.pos, plan.v, k3.land, null);
    const lx = plan.v.x / k3.leapH, lz = plan.v.z / k3.leapH;
    let frames = 0, minDot = 1, slid = false; const mv = [];
    for (let f = 0; f < 180; f++) {
      step();
      if (!kid.alive || kid.grounded) break;
      if (!k3.leaping) continue;
      frames++;
      const m = kid.intent.move, ml = Math.hypot(m.x, m.z), dot = ml > 0.05 ? (m.x * lx + m.z * lz) / ml : 0;
      minDot = Math.min(minDot, dot); if (k3.slid) slid = true;
      if (f % 6 === 0) mv.push([f, r2(m.x), r2(m.z), r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)]);
    }
    step(2);
    kid.bot.update = () => {}; kid.intent.move.set(0, 0, 0); kid.intent.fire = kid.intent.jump = kid.intent.squid = false;
    const off = Math.hypot(kid.pos.x - plan.to.x, kid.pos.z - plan.to.z);
    res[level] = { plan: { from: plan.from.toArray().map(r2), yaw: r2(plan.yaw), charge: plan.c, to: plan.to.toArray().map(r2), lavaUnder: plan.lava, flight: r2(plan.t) }, frames, minDot: r2(minDot), slid, alive: kid.alive, landed: kid.pos.toArray().map(r2), offPlan: r2(off), moves: mv };
  }
  const okB = (x) => !!x && !!x.plan && x.frames > 10 && x.minDot > 0.99 && !x.slid && x.alive && x.offPlan < 0.6;
  R('B: a Mitts bot\'s leap over the lava flies as planned — every frame in the air its stick holds along the leap (the air guard never steers a kit leap), and it lands alive within 0.6 m of the predicted spot, with an enemy behind it (LOW and HIGH)',
    okB(res.low) && okB(res.high), res);
  kid.setWeapon(w0); kid.isBot = true;
  for (const [a, u] of brains) a.bot.update = u;
  return out;
})();
