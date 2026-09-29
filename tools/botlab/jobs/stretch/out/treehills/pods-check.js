// Eco-Forest Treehills — sprout pods on the stage (page script for tools/botlab/page.cjs; the engine's own tests run on
// its podbox arena, tools/botlab/tests/pods.js — this checks the stage's pods, looks and placements):
//   MAP=treehills MODE=turf|tower|boss PAGE=tools/botlab/jobs/stretch/out/treehills/pods-check.js tools/botlab/run.sh tools/botlab/page.cjs
// turf: the layout (18 pods, the stage's planters, the bulbs on the soil, mirror twins), a hedge of each team (owner,
// the look in its ink), the owner's kid on the top, shoving (out of the hedge, never into the reservoir), nav marking,
// the wilt (the kid lowered with it); tower: no pod sits the mode out (none on the track); boss: a hedge stops the
// charge, walking into it tramples it.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = __G.level, nav = __G.nav;
  const THREE = await import('three');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const r2 = (v) => Math.round(v * 100) / 100;
  dbg.freeze();
  const P = m.pods;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  R('pods on the stage (9 listed, mirrored: 18)', !!P && P.pods.length === 18, { n: P && P.pods.length, mode: m.mode });
  if (!P) return out;
  m.duration = 99999; m.time = m.duration - P.t;
  for (const a of m.actors) if (a.bot) { a.bot._up0 = a.bot.update; a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; }; }
  const A = m.actors.filter((a) => a.team === 0), Bt = m.actors.filter((a) => a.team === 1);
  const byId = (id) => P.pods.find((p) => p.id === id);
  const W = (p, lx, ly, lz) => new THREE.Vector3(p.x + lx * p.c + lz * p.s, p.y + ly, p.z - lx * p.s + lz * p.c);
  const loc = (p, v) => [(v.x - p.x) * p.c - (v.z - p.z) * p.s, (v.x - p.x) * p.s + (v.z - p.z) * p.c];
  const place = (a, v) => { a.pos.copy(v); a.vel.set(0, 0, 0); a.grounded = false; a.form = 'kid'; };
  const fill = (p, team) => { const c = new THREE.Vector3(p.x, p.y + p.def.bulbY + 0.2, p.z); for (let i = 0; i < 60 && p.meter[team] < 1.2 && p.state === 'dormant'; i++) __G.paint.splat(c, 0.8, team); };

  // ---- the layout
  const stageCols = P.pods.map((p) => L.blocks.filter((b) => !b.dynamic && b.hidden && Math.hypot(b.center.x - p.x, b.center.z - p.z) < 0.02 && Math.abs(b.center.y - (p.y + 0.25)) < 0.02).length);
  const looks = g.podLooks;
  R('the planters are the stage\'s props (one collider each, 0.9 × 0.5 × 0.9); the engine draws the bulbs, no planters', stageCols.every((n) => n === 1) && looks && looks.items.length === 18 && looks.items.every((it) => !it.planter && it.bulb.children.length > 0),
    { stageColliders: stageCols, bulbs: looks && looks.items.length });
  R('each bulb sits on its planter\'s soil (bulbY 0.46)', looks.items.every((it) => Math.abs(it.pivot.position.y - 0.46) < 1e-6), { bulbY: P.pods[0].def.bulbY });
  let mir = true;
  for (let i = 0; i < P.pods.length; i += 2) { const a = P.pods[i], b = P.pods[i + 1]; if (Math.abs(a.x + b.x) > 1e-6 || Math.abs(a.z + b.z) > 1e-6 || Math.abs(Math.cos(a.yaw) + Math.cos(b.yaw)) > 1e-6) mir = false; }
  R('mirror twins', mir, P.pods.map((p) => [p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.yaw)]));

  if (m.mode === 'turf' || m.mode === 'zones') {
    // ---- a hedge of each team on the meadow
    const pa = byId('meadow-w'), pb = byId('meadow-w~');
    fill(pa, 0); fill(pb, 1); step(0.8);
    const tintA = pa.look && pa.look.team && pa.look.team[0]?.userData?.tint, tintB = pb.look && pb.look.team && pb.look.team[1]?.userData?.tint;
    R('a hedge of each team grows (the first full meter): standing, solid, its look in the grower\'s ink',
      pa.owner === 0 && pb.owner === 1 && pa.state === 'stand' && pb.state === 'stand' && pa.block.solid && pb.block.solid && tintA === __G.teamColors[0].getHexString() && tintB === __G.teamColors[1].getHexString(),
      { a: [pa.owner, pa.state, tintA], b: [pb.owner, pb.state, tintB], size: [pa.w, pa.h, pa.d] });
    R('nav: the hedges\' nodes are marked blocked', P.state().blocked > 0, { blocked: P.state().blocked });
    // ---- the owner's kid on the top (a standable top, 1.8 m over the meadow)
    const kid = A.find((a) => !a.isLocal) || A[1];
    place(kid, W(pa, 0.6, pa.h + 0.4, 0)); step(1.0);
    const onTop = { y: r2(kid.pos.y), top: r2(pa.y + pa.h), grounded: kid.grounded };
    R('the owner\'s kid stands on its top', Math.abs(kid.pos.y - (pa.y + pa.h)) < 0.25 && kid.grounded, onTop);
    // ---- shoving: a kid where a hedge grows is moved out of it, onto floor (never into the reservoir)
    const pe = byId('band-e'), sk = Bt.find((a) => !a.isLocal) || Bt[1];
    place(sk, W(pe, 1.0, 0.05, 0)); step(0.3);
    fill(pe, 1); step(1.0);
    const [lx, lz] = loc(pe, sk.pos);
    const outside = Math.abs(lx) > pe.w / 2 - 0.05 || Math.abs(lz) > pe.d / 2 - 0.05 || sk.pos.y > pe.y + pe.h - 0.1;
    R('shoving: a kid standing where a hedge grows ends up out of it, on the ground (not in the reservoir)', pe.state === 'stand' && outside && sk.pos.y > -1.0,
      { state: pe.state, local: [r2(lx), r2(lz)], y: r2(sk.pos.y), shoved: P.stats.shoved });
    // ---- the wilt: the kid on the top is lowered with it, then the pod recharges
    step(21.5);
    R('it wilts after its time (the kid on top comes down with it); the pod recharges', ['recharge', 'dormant'].includes(pa.state) && kid.pos.y < pa.y + 0.6,
      { state: pa.state, kidY: r2(kid.pos.y), carried: P.stats.carried });
  }
  if (m.mode === 'tower') {
    R('Tower Command: every pod plays (none sits on the track)', P.pods.every((p) => !p.off), P.pods.map((p) => [p.id, p.off || 'on']));
    const T = m.tower, pt = byId('strip-w');
    fill(pt, 0); step(0.8);
    R('a pod near the track (the west strip) still grows', pt.state === 'stand' && pt.owner === 0, { state: pt.state, towerAt: [r2(T.pos.x), r2(T.pos.z)] });
  }
  if (m.mode === 'boss') {
    // a charge lane at a pod: a start on the boss's plannable ground, 5–14 m out along the hedge's normal, whose cast
    // (the boss's pose, claws and all) reaches the pod before it grows
    const Bs = __G.boss, nv = Bs && Bs.nav;
    let lane = null;
    for (const p of P.pods) {
      for (const side of [-1, 1]) for (let dd = 5; dd <= 14 && !lane; dd += 0.5) {
        const st = W(p, 0, 0, side * dd), yaw = p.yaw + (side > 0 ? Math.PI : 0);
        if (!nv.isPlan(st.x, st.z)) continue;
        const c = nv.cast(st.x, st.z, yaw, dd + 4);
        if (c.dist >= dd - 1.0) lane = { p, st, yaw, dd, before: c };
      }
      if (lane) break;
    }
    R('a clear charge lane at a pod on the boss\'s ground', !!lane, lane && { pod: lane.p.id, from: [r2(lane.st.x), r2(lane.st.z)], dist: lane.dd, before: r2(lane.before.dist) });
    if (lane) {
      // (the boss spawns on the meadow's north-west, beside a pod: a hedge never grows into it — step it away first)
      let far = null, fd = -1;
      for (const i of nv.planIds) { const [x, z] = nv.xz(i), d = Math.hypot(x - lane.p.x, z - lane.p.z); if (d > fd) { fd = d; far = [x, z]; } }
      const bp0 = Bs.pos.clone(); Bs.pos.set(far[0], Bs.pos.y, far[1]);
      fill(lane.p, 0); step(0.8);
      Bs.pos.copy(bp0);
      const after = nv.cast(lane.st.x, lane.st.z, lane.yaw, lane.dd + 4);
      R('Boss Battle: a grown hedge stops HULLBREAKER\'s charge like a wall', lane.p.state === 'stand' && after.wall && after.dist < lane.before.dist - 2,
        { before: { d: r2(lane.before.dist), wall: lane.before.wall }, after: { d: r2(after.dist), wall: after.wall } });
      const pb = lane.p, bm = Bs.move; Bs.move = null;
      const bp = Bs.pos.clone(), by0 = Bs.yaw;
      const at = W(pb, 0, 0, -3.2); Bs.pos.set(at.x, Bs.pos.y, at.z); Bs.yaw = pb.yaw;
      P.bossStep();
      const tr = pb.wiltAt <= P.t + 1e-3;
      Bs.pos.copy(bp); Bs.yaw = by0; Bs.move = bm;
      step(1.2);
      R('Boss Battle: HULLBREAKER walking into a hedge tramples it', tr && ['wilt', 'recharge'].includes(pb.state), { trampled: tr, state: pb.state, stat: P.stats.trampled });
    }
  }
  R('state()', !!P.state(), P.state().stats);
  return out;
})()
