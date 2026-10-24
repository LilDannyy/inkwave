// Review 9 probe: the HELD kid and the RESCUE's target.
//   A  a kid held on a hornito at HIGH that leaves the hold another way than the rescue (a super jump to its spawn pad,
//      pressed 0.2 s into the hold): does actor.roofHeld stay set, and does the HUD's personal line (lava._mine) stay on
//      "NO FOOTING → rescued" afterwards — hiding the real lava line on a drowning floor?
//   B  every point (≤ 5 × 5) of every top that holds, at HIGH and at the rise's 40 / 70 / 95 %: the rescue's move as
//      measured from the kid (horizontal, height change), the node's floor, how long until the lava covers where it put
//      the kid, alive 4 s later, and whether the kid can walk back to the take-off side (the nav walk to the nearest dry
//      node on the far side of the top)
//   C  roof tops beside the lava that the audit's reach bar calls unreachable (over 2.6 m above every dry floor within
//      6 m): a squid climbing an inked face of theirs from dry floor at its foot, then on top idle / still pushing the
//      climb's way / steering back against the slide
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { Hit } = await import('./src/game/physics.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const PA = String(window.__pageArgs || ''), arg = (k, d) => new RegExp(k + '=([^;&]+)').exec(PA)?.[1] ?? d;
  const PARTS = arg('parts', 'A,B,C').split(',');
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, K = C.LAVA.kill, dt = 1 / 60, P8 = __G.paint, LO = W.low, H = W.high, M = W.navMeta;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent;
  const phys = __G.physics, DOWN = V(0, -1, 0), O3 = V(0, 0, 0), H3 = new Hit();
  const hitBlock = (x, z, y) => { const h = phys.raycast(O3.set(x, y, z), DOWN, 3, H3); return h.hit ? { y: H3.point.y, block: H3.block } : null; };
  const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
  const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  const reset = (pos, vel) => { kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(pos, 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100; kid.vel.copy(vel || V(0, 0, 0)); it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
  const sched = []; for (let t = 0; t <= 175; t += 0.05) { Lv.debugT(t); sched.push([+t.toFixed(2), Lv.y, Lv.st?.phase, !!Lv.st?.warn]); }
  const riseAt = sched.find((x) => x[2] === 'rise')?.[0], highAt = sched.find((x) => x[0] > riseAt && x[2] === 'high')?.[0], warnAt = sched.find((x) => x[3])?.[0];
  const fracT = (f) => sched.find((x) => x[0] >= riseAt && (x[1] - LO) / (H - LO) >= f)?.[0];
  let T0 = 0, F = 0;
  const tick = () => { F++; Lv.debugT(T0 + F / 60); };
  const setClock = (t) => { T0 = t; F = 0; Lv.debugT(t); };
  const holdersAt = (t) => {
    setClock(t); const hs = [];
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
        for (let f = 0; f < 45 && kid.alive; f++) { kid.update(dt); tick(); if (kid.roofHeld > 0) h = true; }
        if (h) { hs.push(b); break; }
      }
    }
    return hs;
  };
  const res = { schedule: { warnAt, riseAt, highAt, LO, H } };

  // ---------------- A: leaving the hold by a super jump
  if (PARTS.includes('A')) {
    const hs = holdersAt(highAt + 3), A = [];
    for (const b of hs.slice(0, 3)) {
      setClock(highAt + 3);
      const top = topOf(b); reset(V(b.center.x, top + 0.3, b.center.z));
      let f = 0; for (; f < 12; f++) { kid.update(dt); tick(); }
      const heldBefore = r2(kid.roofHeld);
      const pad = lvl.spawnPads[kid.team];
      const ok = kid.superJump(V(pad.x + 3, pad.y, pad.z));
      let n = 0; for (; n < 400 && (kid.superJumpState || !kid.grounded); n++) { kid.update(dt); tick(); }
      const after = { sjOk: ok, frames: n, pos: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], grounded: kid.grounded, roofHeld: r2(kid.roofHeld), roofT: kid.roofT, rescues: Lv.stats.rescues || 0 };
      for (let i = 0; i < 300; i++) { kid.update(dt); tick(); }
      const m5 = Lv._mine(kid);
      after.roofHeld5s = r2(kid.roofHeld); after.mine5s = m5;
      // the line on a drowning floor: move the kid (no reset) onto a node the next rise drowns, during that rise's warning
      const t2 = sched.find((x) => x[0] > highAt + 20 && x[3] && x[1] < LO + 0.1)?.[0] ?? warnAt;
      setClock(t2 + 1);
      let nd = null; for (const q of nav.nodes) { if (M.kind[q.id] === 1 && nav.valid[q.id] && Math.abs(lvl.groundHeight(q.x, q.z, q.y + 0.3) - q.y) < 0.3 && !Lv.covers(q.x, q.z, q.y)) { nd = q; break; } }
      if (nd) {
        kid.pos.set(nd.x, nd.y + 0.02, nd.z); kid.vel.set(0, 0, 0);
        for (let i = 0; i < 10; i++) { kid.update(dt); tick(); }
        const stale = Lv._mine(kid), keep = kid.roofHeld; kid.roofHeld = 0; const fresh = Lv._mine(kid); kid.roofHeld = keep;
        after.onDrowningFloor = { node: [r2(nd.x), r2(nd.y), r2(nd.z)], t: r2(Lv.clock.t), phase: Lv.st?.phase, warn: !!Lv.st?.warn, lineWithStaleHold: stale, lineIfCleared: fresh, roofHeld: r2(kid.roofHeld) };
      }
      A.push({ top: b.tag || '#' + b.id, heldBefore, ...after });
    }
    res.A = A;
    const stale = A.filter((x) => x.roofHeld5s > 0 && x.mine5s && x.mine5s.rescue);
    R('A: a kid that leaves the hold by a super jump does not keep the hold (roofHeld cleared, the HUD line not stuck on NO FOOTING → rescued, the real lava line shown on a drowning floor)', A.length > 0 && !stale.length, { A });
  }

  // ---------------- B: the rescue's target, every point of every top that holds
  if (PARTS.includes('B')) {
    const B = [], worst = { d: 0, up: 0, down: 0, soon: 99 };
    for (const [key, t] of [['high', highAt + 3], ['r40', fracT(0.4)], ['r70', fracT(0.7)], ['r95', fracT(0.95)]]) {
      if (t === undefined) continue;
      const hs = holdersAt(t);
      for (const b of hs) {
        const top = topOf(b), ax = b.axes[0], az = b.axes[2], rows = [];
        const nu = Math.max(1, Math.min(5, Math.round((b.half.x * 2) / 0.3))), nv = Math.max(1, Math.min(5, Math.round((b.half.z * 2) / 0.3)));
        for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) {
          const u = nu === 1 ? 0 : -b.half.x + 0.12 + (iu * (2 * b.half.x - 0.24)) / (nu - 1), v = nv === 1 ? 0 : -b.half.z + 0.12 + (iv * (2 * b.half.z - 0.24)) / (nv - 1);
          const x = b.center.x + ax.x * u + az.x * v, z = b.center.z + ax.z * u + az.z * v;
          setClock(t);
          const hb = hitBlock(x, z, top + 1.0); if (!hb || hb.block !== b.id) continue;
          reset(V(x, hb.y + 0.3, z));
          const tp0 = kid.netTp || 0; let prev = kid.pos.clone(), mv = null, died = false, f = 0;
          for (; f < 240; f++) { kid.update(dt); tick(); if (!kid.alive) { died = true; break; } if ((kid.netTp || 0) !== tp0 && !mv) { mv = { f, from: prev.clone(), to: kid.pos.clone(), t: Lv.clock.t }; break; } prev.copy(kid.pos); }
          if (!mv) { rows.push({ at: [r2(x), r2(z)], rescued: false, died, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], onRoof: kid.grounded && !!lvl.blocks[kid.ground.block]?.roof }); continue; }
          const d = Math.hypot(mv.to.x - mv.from.x, mv.to.z - mv.from.z), dy = mv.to.y - mv.from.y;
          // how long until the lava covers where it was put (the rise keeps going)
          let soon = 99; for (let s = 0; s <= 30; s += 0.25) if (Lv.covers(mv.to.x, mv.to.z, mv.to.y - 0.05, s)) { soon = s; break; }
          let a4 = true; for (let i = 0; i < 240; i++) { kid.update(dt); tick(); if (!kid.alive) { a4 = false; break; } }
          const nid = nav.nearest(mv.to, 0.6, true), gh = lvl.groundHeight(mv.to.x, mv.to.z, mv.to.y + 0.3);
          rows.push({ at: [r2(x), r2(z)], rescued: true, f: mv.f, to: [r2(mv.to.x), r2(mv.to.y), r2(mv.to.z)], d: r2(d), dy: r2(dy), floorDy: r2(gh - (mv.to.y - 0.05)), kind: nid >= 0 ? M.kind[nid] : -1, coverIn: soon, alive4: a4 });
          worst.d = Math.max(worst.d, d); worst.up = Math.max(worst.up, dy); worst.down = Math.min(worst.down, dy); worst.soon = Math.min(worst.soon, soon);
        }
        const tgt = new Map(); for (const r of rows) if (r.rescued) { const k = r.to.join(','); tgt.set(k, (tgt.get(k) || 0) + 1); }
        B.push({ level: key, t: r2(t), lavaY: r2((setClock(t), Lv.y)), top: b.tag || '#' + b.id, id: b.id, at: [r2(b.center.x), r2(top), r2(b.center.z)], floor: r2(top - 2 * b.half.y), points: rows.length,
          rescued: rows.filter((r) => r.rescued).length, notRescued: rows.filter((r) => !r.rescued).map((r) => r), died: rows.filter((r) => r.died || r.alive4 === false).length,
          maxD: r2(Math.max(0, ...rows.filter((r) => r.rescued).map((r) => r.d))), dyRange: [r2(Math.min(0, ...rows.filter((r) => r.rescued).map((r) => r.dy))), r2(Math.max(0, ...rows.filter((r) => r.rescued).map((r) => r.dy)))],
          coverInMin: Math.min(99, ...rows.filter((r) => r.rescued).map((r) => r.coverIn)), targets: [...tgt] });
      }
    }
    res.B = B;
    R('B: every point of every top that holds → rescued within 6 m, alive 4 s later (worst move, height change, soonest cover)', B.every((x) => x.died === 0 && x.rescued === x.points && x.maxD <= 6), { worst: { d: r2(worst.d), up: r2(worst.up), down: r2(worst.down), soon: worst.soon } });
    for (const x of B) R('B row ' + x.top + ' ' + x.level, x.died === 0 && x.rescued === x.points && x.maxD <= 6, x);
  }

  // ---------------- C: the "unreachable" tops: a squid climbing an inked face from dry floor
  if (PARTS.includes('C')) {
    const Cr = [];
    for (const [key, t] of [['low', 10], ['high', highAt + 3]]) {
      setClock(t);
      const LY = Lv.y;
      for (const b of lvl.blocks) {
        if (!b || !b.roof || !b.solid || b.dynamic || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
        const top0 = topOf(b); if (top0 < LY + K) continue;
        let near = false;
        for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
          for (let s = e + 0.1; s <= e + 4.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top0 + 0.5)) near = true; }
        if (!near) continue;
        let fmax = -Infinity;
        for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
          for (let s2 = e + 0.3; s2 <= e + 6; s2 += 0.5) { const x = b.center.x + dx * s2, z = b.center.z + dz * s2, g2 = lvl.groundHeight(x, z, top0 + 3); if (g2 > -50 && !lavaAt(x, z, g2 + 0.05)) { const hb = hitBlock(x, z, g2 + 0.05); if (hb && !lvl.blocks[hb.block]?.roof) fmax = Math.max(fmax, g2); } } }
        if (top0 - fmax <= 2.6) continue;   // (the audit calls it reachable: not this part's)
        // its four side faces: paintable? the floor at the foot (0.5 m out) dry and not a roof?
        const faces = [];
        for (const [ax, sg, hh, wa, wh] of [[b.axes[0], 1, b.half.x, b.axes[2], b.half.z], [b.axes[0], -1, b.half.x, b.axes[2], b.half.z], [b.axes[2], 1, b.half.z, b.axes[0], b.half.x], [b.axes[2], -1, b.half.z, b.axes[0], b.half.x]]) {
          const nx = ax.x * sg, nz = ax.z * sg;
          for (const w of [-0.6, 0, 0.6]) {
            const fx = b.center.x + nx * hh + wa.x * w * wh, fz = b.center.z + nz * hh + wa.z * w * wh;
            const sx = fx + nx * 0.6, sz = fz + nz * 0.6, gy = lvl.groundHeight(sx, sz, top0 - 0.2);
            if (!(gy > -50) || lavaAt(sx, sz, gy + 0.05) || Lv.covers(sx, sz, gy)) continue;
            const hb = hitBlock(sx, sz, gy + 0.05); if (!hb || lvl.blocks[hb.block]?.roof) continue;
            // the face there: a paintable face of this block with this normal?
            let paintable = null; for (const fid of b.faces) { const fc = lvl.faces[fid]; if (fc && fc.n.x * nx + fc.n.z * nz > 0.9) paintable = !!fc.paintable; }
            faces.push({ n: [r2(nx), r2(nz)], foot: [r2(sx), r2(gy), r2(sz)], rise: r2(top0 - gy), paintable, w });
          }
        }
        const climbable = faces.filter((f) => f.paintable);
        const row = { level: key, top: b.tag || '#' + b.id, id: b.id, at: [r2(b.center.x), r2(top0), r2(b.center.z)], overDry: r2(top0 - fmax), faces: faces.length, inkable: climbable.length, climbs: [] };
        for (const fc of climbable.slice(0, 6)) for (const mode of ['idle', 'push', 'back']) {
          setClock(t);
          const nx = fc.n[0], nz = fc.n[1];
          // ink the face: splats up the wall in front of the foot
          P8?.clear?.();
          for (let y = fc.foot[1] + 0.2; y <= top0 + 0.1; y += 0.4) P8?.splat?.(V(fc.foot[0] - nx * 0.6, y, fc.foot[2] - nz * 0.6), 0.9, kid.team, { instant: true, seed: y });
          reset(V(fc.foot[0], fc.foot[1] + 0.05, fc.foot[2])); kid.form = 'squid';
          let onTop = -1, died = false, sdx = 0, sdz = 0, endOn = null;
          for (let f = 0; f < 600; f++) {
            const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null;
            if (onTop < 0 && gb && gb.id === b.id) onTop = f;
            if (kid.roofDir && (kid.roofDir.x || kid.roofDir.z)) { sdx = -kid.roofDir.x; sdz = -kid.roofDir.z; }
            if (onTop < 0) { it.squid = true; it.move.set(-nx, 0, -nz); }
            else if (mode === 'idle') { it.squid = false; it.move.set(0, 0, 0); }
            else if (mode === 'push') { it.squid = false; it.move.set(-nx, 0, -nz); }
            else { it.squid = false; if (sdx || sdz) it.move.set(sdx, 0, sdz); else it.move.set(0, 0, 0); }
            kid.update(dt); tick();
            if (!kid.alive) { died = true; break; }
            if (onTop >= 0 && f - onTop > 240) break;
            if (onTop < 0 && f > 300) break;
          }
          it.squid = false; it.move.set(0, 0, 0);
          endOn = kid.grounded && kid.ground.hit ? (lvl.blocks[kid.ground.block]?.tag || '#' + kid.ground.block) : 'air';
          row.climbs.push({ n: fc.n, rise: fc.rise, mode, reachedTop: onTop >= 0, died: died && onTop >= 0, diedBeforeTop: died && onTop < 0, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], endOn, held: kid.roofHeld > 0 });
        }
        P8?.clear?.();
        Cr.push(row);
      }
    }
    res.C = Cr;
    const reached = Cr.flatMap((r) => r.climbs.filter((c) => c.reachedTop).map((c) => ({ top: r.top, level: r.level, ...c })));
    const deaths = reached.filter((c) => c.died);
    R('C: the tops the audit calls unreachable — a squid can climb onto them by an inked face from dry floor? and then: 0 deaths idle / pushing on / steering back', !deaths.length, { tops: Cr.length, withInkableFace: Cr.filter((r) => r.inkable).length, reachedTop: reached.length, deaths: deaths.length, deathsEg: deaths.slice(0, 8), reachedEg: reached.slice(0, 8) });
    for (const r of Cr) if (r.climbs.some((c) => c.reachedTop)) R('C row ' + r.top + ' ' + r.level, !r.climbs.some((c) => c.died), r);
  }
  return out;
})();
