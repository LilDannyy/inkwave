// Review 9 probe: a kid LANDING on the cover that stands in drowned ground (the Slump hornitos, the mould stacks, the ladle
// stands — every roof top that holds a kid at HIGH or during the rise), by hop, plain running jump, swim jump out of own ink
// and Sponge Mitts leap, at HIGH and at points through the first rise (the lava clock runs with the frames, so a kid in the
// air during the rise sees the lava keep rising). For every landing: what happens (held, rescued, slid, died, perched), where
// it ends (the rescue's own move measured from the kid's position — not the capped rescueLog — with its height change and the
// nav node it lands on), alive 3 s and 6 s after touching the top, and the rescue as a crossing: the nav walk from the
// take-off node to where the rescue put it, minus the straight line (rule 44's "gain").
//   PAGE_ARGS lv=high,rise  kinds=hop,run,swim,mitts  cap=40 (per kind, top and phase)  fr=0.15,0.35,0.55,0.75,0.92 (rise)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { MITTS } = await import('./src/game/kits/mitts.js');
  const { Hit } = await import('./src/game/physics.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const PA = String(window.__pageArgs || ''), arg = (k, d) => new RegExp(k + '=([^;&]+)').exec(PA)?.[1] ?? d;
  const LVS = arg('lv', 'high,rise').split(','), KINDS = arg('kinds', 'hop,run,swim,mitts').split(','), CAP = +arg('cap', 40);
  const FR = arg('fr', '0.15,0.35,0.55,0.75,0.92').split(',').map(Number);
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, K = C.LAVA.kill, dt = 1 / 60, P8 = __G.paint, LO = W.low, H = W.high;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent, w0 = kid.weaponId;
  const phys = __G.physics, DOWN = V(0, -1, 0), O3 = V(0, 0, 0), H3 = new Hit();
  const hitBlock = (x, z, y) => { const h = phys.raycast(O3.set(x, y, z), DOWN, 3, H3); return h.hit ? { y: H3.point.y, block: H3.block } : null; };
  const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
  const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  const reset = (pos, vel) => { kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(pos, 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100; kid.vel.copy(vel || V(0, 0, 0)); it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
  // the schedule (first rise)
  const sched = []; for (let t = 0; t <= 175; t += 0.05) { Lv.debugT(t); sched.push([+t.toFixed(2), Lv.y, Lv.st?.phase, !!Lv.st?.warn]); }
  const riseAt = sched.find((x) => x[2] === 'rise')?.[0], highAt = sched.find((x) => x[0] > riseAt && x[2] === 'high')?.[0], warnAt = sched.find((x) => x[3])?.[0];
  const fracT = (f) => sched.find((x) => x[0] >= riseAt && (x[1] - LO) / (H - LO) >= f)?.[0];
  const res = { schedule: { warnAt, riseAt, highAt, LO, H, K } };
  // the lava clock follows the frames
  let T0 = 0, F = 0;
  const tick = () => { F++; Lv.debugT(T0 + F / 60); };
  const setClock = (t) => { T0 = t; F = 0; Lv.debugT(t); };
  // ---- the tops that hold (at HIGH, and at the rise's 50 / 80 %): a kid put down still on the centre and four points round it
  const holders = new Map();
  for (const [key, t] of [['high', highAt + 3], ['r50', fracT(0.5)], ['r80', fracT(0.8)]]) {
    setClock(t);
    for (const b of lvl.blocks) {
      if (!b || !b.roof || !b.solid || b.dynamic || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
      const top = topOf(b); if (top < Lv.y + K || top > 7) continue;
      let near = false;
      for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
        for (let s = e + 0.1; s <= e + 4.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top + 0.5)) near = true; }
      if (!near) continue;
      for (const [u, v] of [[0, 0], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) {
        const x = b.center.x + b.axes[0].x * u * b.half.x + b.axes[2].x * v * b.half.z, z = b.center.z + b.axes[0].z * u * b.half.x + b.axes[2].z * v * b.half.z;
        const hb = hitBlock(x, z, top + 1.0); if (!hb || hb.block !== b.id) continue;
        setClock(t); reset(V(x, hb.y + 0.3, z)); let h = false;
        for (let f = 0; f < 45 && kid.alive; f++) { kid.update(dt); if (kid.roofHeld > 0) h = true; }
        if (h) { const s = holders.get(b.id) || new Set(); s.add(key); holders.set(b.id, s); break; }
      }
    }
  }
  res.holders = [...holders].map(([id, s]) => { const b = lvl.blocks[id]; return [b.tag || '#' + id, id, [r2(b.center.x), r2(topOf(b)), r2(b.center.z)], [r2(b.half.x * 2), r2(b.half.z * 2)], r2(topOf(b) - 2 * b.half.y), [...s]]; });
  // ---- one trial's watch
  const nodeAt = (p) => { let m = nav.nearest(p, 0.6, true); if (m < 0) m = nav.nearest(p, 1.4, true); return m; };
  const walk = (a, b) => { if (a < 0 || b < 0) return null; const p = nav.path(a, b, 0); if (!p) return 999; let L = 0; for (let i = 1; i < p.length; i++) { const q = nav.nodes[p[i - 1]], w = nav.nodes[p[i]]; L += Math.hypot(w.x - q.x, w.z - q.z); } return L; };
  const watch = (bid) => ({ bid, touched: false, f0: -1, held: false, heldF: 0, tp: kid.netTp || 0, prev: kid.pos.clone(), resc: [], died: false, diedAt: null, diedF: -1, slid: false, a3: null, a6: null, roof3: false, end: null, offTopF: -1, relaunchV: 0, prevHeld: false, launchF: -1 });
  const look = (m, f) => {
    const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null, onRoof = !!(gb && kid.isRoofFor(gb));
    if (!m.touched && gb && gb.id === m.bid) { m.touched = true; m.f0 = f; }
    const h = kid.roofHeld > 0;
    if (m.touched) {
      if (h) { m.held = true; m.heldF++; }
      if ((kid.netTp || 0) !== m.tp) m.resc.push({ f: f - m.f0, from: [r2(m.prev.x), r2(m.prev.y), r2(m.prev.z)], to: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], d: r2(Math.hypot(kid.pos.x - m.prev.x, kid.pos.z - m.prev.z)), dy: r2(kid.pos.y - m.prev.y), lavaY: r2(Lv.y), t: r2(Lv.clock.t), invuln: r2(kid.invuln || 0) });
      else if (m.prevHeld && !h) { m.launchF = f; }
      if (m.launchF >= 0 && f === m.launchF + 1) m.relaunchV = Math.max(m.relaunchV, Math.hypot(kid.vel.x, kid.vel.z));
      if (!onRoof && m.offTopF < 0 && !(gb && gb.id === m.bid) && kid.grounded) m.offTopF = f;
      if (!kid.alive && !m.died) { m.died = true; m.diedF = f - m.f0; m.diedAt = [r2(m.prev.x), r2(m.prev.y), r2(m.prev.z)]; m.diedLava = r2(Lv.y); }
      if (f - m.f0 === 180) { m.a3 = kid.alive; m.roof3 = kid.alive && onRoof; m.p3 = [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)]; }
      if (f - m.f0 === 360) m.a6 = kid.alive;
    }
    m.tp = kid.netTp || 0; m.prevHeld = h; m.prev.copy(kid.pos);
  };
  const finish = (m, take) => {
    m.end = [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)];
    if (m.a3 === null) m.a3 = kid.alive && !m.died;
    if (m.a6 === null) m.a6 = kid.alive && !m.died;
    const rz = m.resc[0];
    if (rz && take >= 0) { const to = nodeAt(V(...rz.to)); const L = walk(take, to); const tn = nav.nodes[take]; m.gain = L === null ? null : r2(Math.min(999, L - Math.hypot(rz.to[0] - tn.x, rz.to[2] - tn.z))); m.walk = L === null ? null : r2(L); }
    return m;
  };
  const tally = () => ({ trials: 0, touched: 0, held: 0, rescued: 0, slidOff: 0, died: 0, diedAfterRescue: 0, perched3: 0, deadBy6: 0, flung: 0, maxRescueD: 0, maxRescueUp: 0, maxRescueDown: 0, maxGain: -1, eg: [], egGain: null, egUp: null });
  const add = (T, m, info) => {
    T.trials++; if (!m.touched) return; T.touched++;
    if (m.held) T.held++;
    if (m.resc.length) { T.rescued++; for (const r of m.resc) { T.maxRescueD = Math.max(T.maxRescueD, r.d); T.maxRescueUp = Math.max(T.maxRescueUp, r.dy); T.maxRescueDown = Math.min(T.maxRescueDown, r.dy); } }
    if (!m.held && !m.resc.length && m.offTopF >= 0) T.slidOff++;
    if (m.died) { T.died++; if (m.resc.length) T.diedAfterRescue++; }
    if (m.roof3) T.perched3++;
    if (!m.a6) T.deadBy6++;
    const flung = m.launchF >= 0 && !m.resc.length && (m.died || m.relaunchV > 3.6); if (flung) T.flung++;
    if (m.gain !== undefined && m.gain !== null && m.gain > T.maxGain) { T.maxGain = m.gain; T.egGain = { ...info, resc: m.resc[0], walk: m.walk, gain: m.gain }; }
    if (m.resc.length && (!T.egUp || m.resc[0].dy > T.egUp.resc.dy)) T.egUp = { ...info, resc: m.resc[0] };
    if ((m.died || m.roof3 || flung || !m.a6) && T.eg.length < 5) T.eg.push({ ...info, died: m.died, diedF: m.diedF, diedAt: m.diedAt, diedLava: m.diedLava, roof3: m.roof3, flung, a6: m.a6, held: m.held, resc: m.resc, end: m.end });
  };
  const dryNode = (nd) => nav.valid[nd.id] && !Lv.covers(nd.x, nd.z, nd.y) && Math.abs(lvl.groundHeight(nd.x, nd.z, nd.y + 0.3) - nd.y) < 0.3;
  const land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, vv = V(0, 0, 0);
  const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false };
  // ---- the phases: HIGH (3 s into it), and take-offs through the first rise
  const phases = [];
  if (LVS.includes('high')) phases.push(['high', highAt + 3]);
  if (LVS.includes('rise')) for (const f of FR) phases.push(['rise' + Math.round(f * 100), fracT(f)]);
  if (LVS.includes('warn')) phases.push(['warn', warnAt + 0.5]);
  const rows = [];
  for (const [id, lset] of holders) {
    const b = lvl.blocks[id], top = topOf(b), tag = b.tag || '#' + id;
    for (const [ph, t0] of phases) {
      if (t0 === undefined) continue;
      const T = { hop: tally(), run: tally(), swim: tally(), mitts: tally() };
      // hop: from floor 0.4–1.7 m below the top, 16 sides, run-ups 0.6 / 1.1 / 1.8
      if (KINDS.includes('hop')) {
        let n = 0;
        for (let k = 0; k < 16 && n < CAP; k++) {
          const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
          for (const ru of [0.6, 1.1, 1.8]) {
            setClock(t0);
            const sx = b.center.x - dx * (e + 0.5 + ru), sz = b.center.z - dz * (e + 0.5 + ru), fy = lvl.groundHeight(sx, sz, top - 0.05);
            if (!(fy > -50) || top - fy < 0.4 || top - fy > 1.7 || fy <= Lv.y + K + 0.02 || Lv.covers(sx, sz, fy)) continue;
            reset(V(sx, fy + 0.05, sz)); for (let i = 0; i < 3; i++) { kid.update(dt); tick(); }
            if (!kid.alive || !kid.grounded) continue;
            const take = nodeAt(kid.pos);
            let jumped = false; const x0 = kid.pos.x, z0 = kid.pos.z, m = watch(id);
            for (let f = 0; f < 600; f++) {
              if (m.touched) it.move.set(0, 0, 0);
              else if (jumped) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz) || 1; it.move.set(hx / hl, 0, hz / hl); }
              else it.move.set(dx, 0, dz);
              it.jump = !jumped && (kid.pos.x - x0) * dx + (kid.pos.z - z0) * dz >= ru - 0.05; if (it.jump) jumped = true;
              kid.update(dt); tick(); look(m, f);
              if (m.touched && f - m.f0 >= 362) break;
              if (!m.touched && (!kid.alive || (jumped && kid.grounded && f > 80))) break;
            }
            if (!m.touched) continue;
            n++; finish(m, take); add(T.hop, m, { how: 'hop', from: [r2(sx), r2(fy), r2(sz)], dir: Math.round((a * 180) / Math.PI), ru });
          }
        }
      }
      // running / swim jumps: dry nodes within 9.5 m, toward the top's centre, edge within 3 m, run-ups 2.6 / 1.5, steered at it
      for (const how of ['run', 'swim']) {
        if (!KINDS.includes(how)) continue;
        let n = 0;
        setClock(t0);
        const nodes = nav.nodes.filter((nd) => { const d = Math.hypot(b.center.x - nd.x, b.center.z - nd.z); return d <= 9.5 && d >= 2 && nd.y >= top - (how === 'swim' ? 1.2 : 0.9) && nd.y <= top + 3 && dryNode(nd); });
        nodes.sort((p, q) => Math.hypot(b.center.x - p.x, b.center.z - p.z) - Math.hypot(b.center.x - q.x, b.center.z - q.z));
        for (const nd of nodes) {
          if (n >= CAP) break;
          const ddx = b.center.x - nd.x, ddz = b.center.z - nd.z, d = Math.hypot(ddx, ddz), dx = ddx / d, dz = ddz / d;
          setClock(t0);
          let edge = null; for (let s = 0.1; s <= 3; s += 0.1) { if (lavaAt(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) || lvl.groundHeight(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) < nd.y - 0.3) { edge = s; break; } }
          if (edge === null) continue;
          for (const ru of [2.6, 1.5]) {
            if (n >= CAP) break;
            setClock(t0);
            const sx = nd.x + dx * (edge - ru), sz = nd.z + dz * (edge - ru), sy = lvl.groundHeight(sx, sz, nd.y + 0.6);
            if (!(Math.abs(sy - nd.y) < 0.35) || Lv.covers(sx, sz, sy)) continue;
            if (how === 'swim') { P8?.clear?.(); for (let s = -0.2; s <= ru - 0.2; s += 0.5) P8?.splat?.(V(sx + dx * s, sy + 0.05, sz + dz * s), 0.9, kid.team, { instant: true, seed: s }); }
            reset(V(sx, sy + 0.05, sz)); for (let i = 0; i < 3; i++) { kid.update(dt); tick(); }
            let jumped = false, jf = -1; const m = watch(id);
            for (let f = 0; f < 640; f++) {
              const along = (kid.pos.x - nd.x) * dx + (kid.pos.z - nd.z) * dz;
              if (m.touched) it.move.set(0, 0, 0);
              else if (jumped && f - jf > 2) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz); it.move.set(hl > 0.15 ? hx / hl : 0, 0, hl > 0.15 ? hz / hl : 0); } else it.move.set(dx, 0, dz);
              it.squid = how === 'swim' && !jumped;
              it.jump = !jumped && along >= edge - 0.35; if (it.jump) { jumped = true; jf = f; }
              kid.update(dt); tick(); look(m, f);
              if (m.touched && f - m.f0 >= 362) break;
              if (!m.touched && (!kid.alive || (jumped && f - jf > 120))) break;
            }
            it.squid = false;
            if (!m.touched) continue;
            n++; finish(m, nd.id); add(T[how], m, { how, from: [r2(nd.x), r2(nd.y), r2(nd.z)], ru });
          }
        }
        P8?.clear?.();
      }
      // Mitts leaps: predictLeap aimed at the top from every dry node within 14 m
      if (KINDS.includes('mitts')) {
        kid.setWeapon('mitts');
        let n = 0;
        setClock(t0);
        const nodes = nav.nodes.filter((nd) => { const d = Math.hypot(b.center.x - nd.x, b.center.z - nd.z); return d <= 14 && d >= 2 && nd.y >= top - 2 && nd.y <= top + 4 && dryNode(nd); });
        for (let i = nodes.length - 1; i > 0; i--) { const j = (i * 7919) % (i + 1); [nodes[i], nodes[j]] = [nodes[j], nodes[i]]; }   // (a fixed shuffle: spread the cap over the sides)
        for (const nd of nodes) {
          if (n >= CAP) break;
          const dx = b.center.x - nd.x, dz = b.center.z - nd.z, from = V(nd.x, nd.y, nd.z);
          let got = 0;
          for (const dyaw of [0, 0.06, -0.06]) for (const c of [0.3, 0.6, 0.9]) for (const pitch of [-0.2, 0.1, 0.4]) {
            if (n >= CAP || got >= 2) break;
            kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
            setClock(t0);
            MITTS.predictLeap(from, vv, land, null);
            if (land.kind !== 'ground' || land.block !== id) continue;
            reset(V(from.x, from.y + 0.05, from.z)); for (let i = 0; i < 2; i++) { kid.update(dt); tick(); }
            const r = kid.weaponRunner, k3 = MITTS.K(r); k3.charging = false; k3.cling = false; k3.hang = false;
            kid.pos.copy(from); kid.vel.copy(vv); kid.grounded = false; kid.coyote = 0; kid.jumpBuffer = 0;
            k3.leaping = true; k3.leapT = 0; k3.slid = false; k3.leapV.set(vv.x, 0, vv.z); k3.leapH = Math.hypot(vv.x, vv.z); k3.trail = 0; k3.trailP.copy(kid.pos);
            const m = watch(id);
            for (let f = 0; f < 720; f++) { kid.update(dt); tick(); look(m, f); if (m.touched && f - m.f0 >= 362) break; if (!m.touched && (!kid.alive || f > 300)) break; }
            if (!m.touched) continue;
            n++; got++; finish(m, nd.id); add(T.mitts, m, { how: 'mitts', from: [r2(nd.x), r2(nd.y), r2(nd.z)], c, pitch });
          }
        }
        kid.setWeapon(w0);
      }
      setClock(t0);
      rows.push({ top: tag, id, at: [r2(b.center.x), r2(top), r2(b.center.z)], phase: ph, t0: r2(t0), lavaY: r2(Lv.y), ...Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v])) });
    }
  }
  res.rows = rows.length;
  // summary per phase and kind
  const S = {};
  for (const row of rows) for (const k of ['hop', 'run', 'swim', 'mitts']) {
    const T = row[k], key = row.phase + ':' + k, s = (S[key] ||= { touched: 0, held: 0, rescued: 0, slidOff: 0, died: 0, diedAfterRescue: 0, perched3: 0, deadBy6: 0, flung: 0, maxRescueD: 0, maxRescueUp: 0, maxRescueDown: 0, maxGain: -1 });
    for (const f of ['touched', 'held', 'rescued', 'slidOff', 'died', 'diedAfterRescue', 'perched3', 'deadBy6', 'flung']) s[f] += T[f];
    s.maxRescueD = Math.max(s.maxRescueD, T.maxRescueD); s.maxRescueUp = Math.max(s.maxRescueUp, T.maxRescueUp); s.maxRescueDown = Math.min(s.maxRescueDown, T.maxRescueDown); s.maxGain = Math.max(s.maxGain, T.maxGain);
  }
  res.summary = S;
  R('schedule and holders', true, { schedule: res.schedule, holders: res.holders });
  for (const [k, s] of Object.entries(S)) R('landings ' + k + ': 0 deaths, 0 perches, 0 flings, rescue ≤ 6 m', s.died === 0 && s.perched3 === 0 && s.flung === 0 && s.deadBy6 === 0 && s.maxRescueD <= 6, s);
  for (const row of rows) {
    const bad = ['hop', 'run', 'swim', 'mitts'].some((k) => row[k].died || row[k].perched3 || row[k].flung || row[k].deadBy6);
    R('row ' + row.top + ' ' + row.phase, !bad, row);
  }
  return out;
})();
