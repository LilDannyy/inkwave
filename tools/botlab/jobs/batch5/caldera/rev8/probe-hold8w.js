// [fix round 8: a copy of review 8's probe-hold8 whose Mitts leaps are watched 3 s after landing — the header's "held and alive 3 s
// later"; the original broke off at frame 200 whatever the landing time, 0.2 s after some landings]
// Review 8 probe: the roof HOLD (actor._roofHold: every way off lands in the lava → the kid stands still on the off-limits
// top) and the landing march's air speed. probe-roof8 found roofs in the lava at HIGH that hold a kid (the Casting
// Floor's mould stack and ladle stand, the Slump hornitos) and tall roofs whose "dry" way off drops an idle kid in the lava.
//   A  which roof tops hold a kid at HIGH (a kid put down on the centre, 0.5 s)
//   B  can a kid get onto them at HIGH and stay: a Sponge Mitts leap (predictLeap aimed at the top from every dry nav node
//      within 14 m, charges 0.3–1, pitch −0.2…0.4, then flown for real) and a swim jump out of own ink (run at the top,
//      jump at the edge, steer at its centre in the air); held and alive 3 s later = a perch on an off-limits top
//   C  the hornitos during the rise: a kid on the Slump shelf hops onto a hornito at every 0.1 s from the warning to 1 s
//      after the shelf turns deadly; alive on the hornito 3 s after the shelf is deadly = it rode out the rise on cover
//   D  the tide boards (3.4 m tops by the causeway): a Mitts leap onto one from the causeway, then idle — does the slide's
//      "dry" way off land it in the lava (the landing march assumes no air drag)?
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { MITTS } = await import('./src/game/kits/mitts.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, K = C.LAVA.kill, dt = 1 / 60, P = __G.paint;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent;
  const w0 = kid.weaponId;
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  const reset = (pos, vel) => { kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(pos, 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100; kid.vel.copy(vel || V(0, 0, 0)); it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
  const onBlock = (b) => kid.grounded && kid.ground.hit && kid.ground.block === b.id;
  const held = () => !!kid.roofDir && kid.roofDir.lengthSq() === 0 && kid.roofT > 0;
  // the times: the first rise's warning / start / end, the shelf's deadly moment
  const times = []; for (let t = 0; t <= 120; t += 0.1) { Lv.debugT(t); times.push([r2(t), Lv.y, Lv.st?.phase, !!Lv.st?.warn]); }
  const riseStart = times.find((x) => x[2] === 'rise')?.[0], highAt = times.find((x) => x[2] === 'high')?.[0], warnAt = times.find((x) => x[3])?.[0];
  const res = { schedule: { warnAt, riseStart, highAt, low: W.low, high: W.high } };
  // ---------------- A: roofs that hold at HIGH
  const TH = highAt != null ? highAt + 3 : 50; res.atT = TH;
  setT(TH);
  const holders = [];
  for (const b of lvl.blocks) {
    if (!b || !b.roof || !b.solid || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
    const top = b.center.y + b.half.y * b.axes[1].y; if (top < Lv.y + K || top > 6) continue;
    let near = false; for (let k = 0; k < 8 && !near; k++) { const a = (k * Math.PI) / 4; for (let s = 0.3; s <= 4 && !near; s += 0.4) if (lavaAt(b.center.x + Math.cos(a) * (Math.max(b.half.x, b.half.z) + s), b.center.z + Math.sin(a) * (Math.max(b.half.x, b.half.z) + s), top + 0.5)) near = true; }
    if (!near) continue;
    reset(V(b.center.x, top + 0.2, b.center.z));
    let h = false; for (let f = 0; f < 30; f++) { kid.update(dt); if (!kid.alive) break; }
    if (kid.alive && onBlock(b) && held()) holders.push(b);
  }
  res.A = holders.map((b) => ({ tag: b.tag || '#' + b.id, id: b.id, at: [r2(b.center.x), r2(b.center.y + b.half.y), r2(b.center.z)], size: [r2(b.half.x * 2), r2(b.half.y * 2), r2(b.half.z * 2)] }));
  // ---------------- B: reach them at HIGH and stay
  const land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, vv = V(0, 0, 0);
  const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false };
  kid.setWeapon('mitts');
  const r = kid.weaponRunner;
  const flyLeap = (from, v) => {
    reset(V(from.x, from.y + 0.05, from.z));
    for (let i = 0; i < 2; i++) kid.update(dt);
    const k3 = MITTS.K(r); k3.charging = false; k3.cling = false; k3.hang = false;
    kid.pos.set(from.x, from.y, from.z); kid.vel.copy(v); kid.grounded = false; kid.coyote = 0; kid.jumpBuffer = 0;
    k3.leaping = true; k3.leapT = 0; k3.slid = false; k3.leapV.set(v.x, 0, v.z); k3.leapH = Math.hypot(v.x, v.z); k3.trail = 0; k3.trailP.copy(kid.pos);
    let on = null, onF = -1; const tr = [];
    for (let f = 0; f < 480; f++) { kid.update(dt); if (f % 6 === 0) tr.push([f, r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z), kid.grounded ? (lvl.blocks[kid.ground.block]?.roof ? 'R' : 'F') : 'a', held() ? 'H' : '']); if (!kid.alive) break; if (on === null && kid.grounded) { on = kid.ground.block; onF = f; } if (on !== null && f - onF > 180) break; }   // (fix round 8 copy: 3 s after landing, as its header says)
    return { alive: kid.alive, firstGround: on, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], held: held(), onRoof: kid.grounded && !!lvl.blocks[kid.ground.block]?.roof, tr };
  };
  const B = [];
  for (const b of holders) {
    const top = b.center.y + b.half.y;
    let leap = null, tried = 0;
    for (const nd of nav.nodes) {
      if (leap) break;
      if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      const dx = b.center.x - nd.x, dz = b.center.z - nd.z, d = Math.hypot(dx, dz);
      if (d > 14 || d < 2 || nd.y < top - 2 || nd.y > top + 4) continue;
      const from = V(nd.x, nd.y, nd.z);
      for (const dyaw of [0, 0.06, -0.06]) for (const c of [0.3, 0.45, 0.6, 0.75, 0.9, 1]) for (const pitch of [-0.2, 0, 0.2, 0.4]) {
        if (leap) break;
        kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
        MITTS.predictLeap(from, vv, land, null);
        if (land.kind !== 'ground' || land.block !== b.id) continue;
        tried++;
        const f = flyLeap(from, vv.clone());
        if (f.alive && f.onRoof && f.held) leap = { from: [r2(nd.x), r2(nd.y), r2(nd.z)], charge: c, pitch, yaw: r2(kk.botYaw), end: f.end, trail: f.tr.slice(-6) };
      }
    }
    B.push({ tag: b.tag || '#' + b.id, id: b.id, mittsTried: tried, mittsHeld: leap });
  }
  kid.setWeapon(w0);
  // swim jumps: from dry nav nodes within 9.5 m, toward the top: edge within 3 m, run-up 2.6 / 1.5, own ink, squid until the
  // edge, jump, steer at the block's centre in the air
  const SJ = [];
  for (const b of holders) {
    const top = b.center.y + b.half.y; let got = null, tried = 0;
    for (const nd of nav.nodes) {
      if (got) break;
      if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      const ddx = b.center.x - nd.x, ddz = b.center.z - nd.z, d = Math.hypot(ddx, ddz);
      if (d > 9.5 || d < 2 || nd.y < top - 1.2 || nd.y > top + 3) continue;
      const dx = ddx / d, dz = ddz / d;
      let edge = null; for (let s = 0.1; s <= 3; s += 0.1) { if (lavaAt(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) || lvl.groundHeight(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) < nd.y - 0.3) { edge = s; break; } }
      if (edge === null) continue;
      for (const ru of [2.6, 1.5]) {
        const sx = nd.x + dx * (edge - ru), sz = nd.z + dz * (edge - ru), sy = lvl.groundHeight(sx, sz, nd.y + 0.6);
        if (!(Math.abs(sy - nd.y) < 0.35)) continue;
        tried++;
        P?.clear?.(); for (let s = -0.2; s <= ru - 0.2; s += 0.5) P?.splat?.(V(sx + dx * s, sy + 0.05, sz + dz * s), 0.9, kid.team, { instant: true, seed: s });
        reset(V(sx, sy + 0.05, sz)); kid.invuln = 0;
        for (let i = 0; i < 3; i++) kid.update(dt);
        let jumped = false, jf = -1;
        for (let f = 0; f < 240; f++) {
          const along = (kid.pos.x - nd.x) * dx + (kid.pos.z - nd.z) * dz;
          if (jumped && f - jf > 2) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz); it.move.set(hl > 0.15 ? hx / hl : 0, 0, hl > 0.15 ? hz / hl : 0); } else it.move.set(dx, 0, dz);
          it.squid = !jumped;
          it.jump = !jumped && along >= edge - 0.35; if (it.jump) { jumped = true; jf = f; }
          kid.update(dt);
          if (!kid.alive) break;
          if (jumped && f - jf > 100) break;
        }
        it.move.set(0, 0, 0); it.squid = false;
        for (let f = 0; f < 120 && kid.alive; f++) kid.update(dt);
        if (kid.alive && onBlock(b) && held()) { got = { from: [r2(nd.x), r2(nd.y), r2(nd.z)], runup: ru, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)] }; break; }
      }
    }
    SJ.push({ tag: b.tag || '#' + b.id, id: b.id, swimTried: tried, swimHeld: got });
  }
  P?.clear?.();
  res.B = { mitts: B, swim: SJ };
  // ---------------- B2: walk (or hop) off higher dry floor onto them at HIGH (from every dry nav node 0.3–3.5 m above the top,
  // within 4 m: walk at the top's centre, and the same with a hop at the edge)
  setT(TH);
  const E = [];
  for (const b of holders) {
    const top = b.center.y + b.half.y; let got = null, tried = 0;
    for (const nd of nav.nodes) {
      if (got) break;
      if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y) || nd.y < top + 0.3 || nd.y > top + 3.5) continue;
      const ddx = b.center.x - nd.x, ddz = b.center.z - nd.z, d = Math.hypot(ddx, ddz);
      if (d > 4.5 || d < 0.8) continue;
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      for (const hop of [false, true]) {
        tried++;
        reset(V(nd.x, nd.y + 0.05, nd.z));
        for (let i = 0; i < 2; i++) kid.update(dt);
        let jumped = false; const y0 = kid.pos.y;
        for (let f = 0; f < 150; f++) {
          const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz);
          if (kid.grounded && onBlock(b)) it.move.set(0, 0, 0); else it.move.set(hl > 0.2 ? hx / hl : 0, 0, hl > 0.2 ? hz / hl : 0);
          it.jump = hop && !jumped && kid.grounded && lvl.groundHeight(kid.pos.x + (hx / (hl || 1)) * 0.5, kid.pos.z + (hz / (hl || 1)) * 0.5, y0 + 0.2) < y0 - 0.3; if (it.jump) jumped = true;
          kid.update(dt);
          if (!kid.alive) break;
        }
        it.move.set(0, 0, 0);
        for (let f = 0; f < 120 && kid.alive; f++) kid.update(dt);
        if (kid.alive && onBlock(b) && held()) { got = { from: [r2(nd.x), r2(nd.y), r2(nd.z)], hop, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)] }; break; }
      }
    }
    E.push({ tag: b.tag || '#' + b.id, id: b.id, tried, walkedOnHeld: got });
  }
  res.B2 = E;
  // ---------------- B3: hop up onto them at HIGH from dry floor 0.4–1.7 m below (rule 47's approach: 16 sides, run-ups 0.6 /
  // 1.1 m from 0.5 m off the face; held and alive 2 s later)
  const H3 = [];
  for (const b of holders) {
    const top = b.center.y + b.half.y; let got = null, tried = 0;
    const ext = (dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
    for (let k = 0; k < 16 && !got; k++) {
      const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(dx, dz);
      for (const ru of [0.6, 1.1, 1.8]) {
        if (got) break;
        const sx = b.center.x - dx * (e + 0.5 + ru), sz = b.center.z - dz * (e + 0.5 + ru), fy = lvl.groundHeight(sx, sz, top - 0.05);
        if (!(fy > -50) || top - fy < 0.4 || top - fy > 1.7 || Lv.covers(sx, sz, fy)) continue;
        tried++;
        reset(V(sx, fy + 0.05, sz));
        for (let i = 0; i < 3; i++) kid.update(dt);
        let jumped = false; const x0 = kid.pos.x, z0 = kid.pos.z;
        for (let f = 0; f < 200; f++) {
          if (kid.grounded && onBlock(b)) it.move.set(0, 0, 0);
          else if (jumped) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz); it.move.set(hl > 0.2 ? hx / hl : 0, 0, hl > 0.2 ? hz / hl : 0); }
          else it.move.set(dx, 0, dz);
          it.jump = !jumped && (kid.pos.x - x0) * dx + (kid.pos.z - z0) * dz >= ru - 0.05; if (it.jump) jumped = true;
          kid.update(dt);
          if (!kid.alive) break;
        }
        it.move.set(0, 0, 0);
        if (kid.alive && onBlock(b) && held()) got = { from: [r2(sx), r2(fy), r2(sz)], dir: Math.round((a * 180) / Math.PI), ru, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)] };
      }
    }
    H3.push({ tag: b.tag || '#' + b.id, id: b.id, tried, hopHeld: got });
  }
  res.B3 = H3;
  // ---------------- C: hop onto a hornito during the rise
  const C2 = [];
  for (const b of holders.filter((x) => /hornito/.test(x.tag || ''))) {
    const top = b.center.y + b.half.y, floor = top - b.half.y * 2;
    let ok = null, n = 0;
    // the shelf's deadly moment by the hornito (the lava's surface + kill over the shelf)
    let td = null; for (const [t, y] of times) if (td === null && t > 20 && y + K > floor) td = t;
    if (td === null) { C2.push({ tag: b.tag, id: b.id, td: null }); continue; }
    for (let t = td - 1.2; t <= td + 0.1 && !ok; t += 0.05) {
      for (let k = 0; k < 8 && !ok; k++) {
        const a = (k * Math.PI) / 4, ex = Math.max(b.half.x, b.half.z) + 0.45 + 0.6, sx = b.center.x + Math.cos(a) * ex, sz = b.center.z + Math.sin(a) * ex;
        Lv.debugT(t);
        const fy = lvl.groundHeight(sx, sz, top - 0.05);
        if (!(Math.abs(fy - floor) < 0.3) || Lv.covers(sx, sz, fy)) continue;   // (the shelf there, not yet deadly)
        n++;
        reset(V(sx, fy + 0.05, sz));
        for (let i = 0; i < 2; i++) kid.update(dt);
        let jumped = false, tt = t; const x0 = kid.pos.x, z0 = kid.pos.z;
        for (let f = 0; f < 60 * (td - t + 3); f++) {
          tt = t + f / 60; if (f % 3 === 0) Lv.debugT(tt);
          const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz);
          if (!jumped || f < 40) it.move.set(hl > 0.2 ? hx / hl : 0, 0, hl > 0.2 ? hz / hl : 0); else it.move.set(0, 0, 0);
          it.jump = !jumped && Math.hypot(kid.pos.x - x0, kid.pos.z - z0) >= 0.5; if (it.jump) jumped = true;
          kid.update(dt);
          if (!kid.alive) break;
        }
        const shelfDeadly = Lv.covers(sx, sz, fy);
        if (kid.alive && onBlock(b) && shelfDeadly) ok = { hopAt: r2(t), from: [r2(sx), r2(fy), r2(sz)], until: r2(tt), held: held(), lava: r2(Lv.y) };
      }
    }
    C2.push({ tag: b.tag, id: b.id, td, tries: n, rodeOut: ok });
  }
  res.C = C2;
  // ---------------- D: the tide boards, a Mitts leap onto them from the causeway, then idle
  const D = [];
  kid.setWeapon('mitts');
  for (const level of ['low', 'high']) {
    setT(level === 'low' ? 10 : TH);
    for (const b of lvl.blocks.filter((x) => x && x.tag === 'tide-board')) {
      const top = b.center.y + b.half.y; let n = 0, landed = 0, died = 0; const eg = [];
      for (const nd of nav.nodes) {
        if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
        const dx = b.center.x - nd.x, dz = b.center.z - nd.z, d = Math.hypot(dx, dz);
        if (d > 9 || d < 1.5 || nd.y > top) continue;
        const from = V(nd.x, nd.y, nd.z);
        for (const dyaw of [0, 0.1, -0.1]) for (const c of [0.3, 0.5, 0.7, 0.9]) for (const pitch of [0, 0.3, 0.6]) {
          kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
          MITTS.predictLeap(from, vv, land, null);
          if (land.kind !== 'ground' || land.block !== b.id) continue;
          n++;
          const f = flyLeap(from, vv.clone());
          if (f.firstGround === b.id) { landed++; if (!f.alive) { died++; if (eg.length < 3) eg.push({ from: [r2(nd.x), r2(nd.y), r2(nd.z)], c, pitch, end: f.end, tr: f.tr }); } }
        }
      }
      D.push({ level, tag: b.tag, id: b.id, at: [r2(b.center.x), r2(top), r2(b.center.z)], leaps: n, landed, died, eg });
    }
  }
  kid.setWeapon(w0);
  res.D = D;
  const perch = B.filter((x) => x.mittsHeld).length + SJ.filter((x) => x.swimHeld).length + C2.filter((x) => x.rodeOut).length + E.filter((x) => x.walkedOnHeld).length + H3.filter((x) => x.hopHeld).length;
  R('probe-hold8: no off-limits roof top in the lava holds a kid a player can put there (Mitts leap, swim jump, a walk / hop off higher floor, a hop during the rise)', perch === 0, res);
  R('probe-hold8: a Mitts leap onto a tide board never ends in the lava with the stick idle', D.every((x) => !x.died), D.map((x) => [x.level, x.id, x.leaps, x.landed, x.died]));
  return out;
})();
