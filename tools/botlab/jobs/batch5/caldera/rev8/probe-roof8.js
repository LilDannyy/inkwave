// Review 8 probe: EVERY roof top beside the lava, at every point of its top, at LOW, HIGH and mid-rise / mid-fall levels —
// not only the blocks a kid hops onto from 0.4–1.7 m below (rule 47). A kid is put down on the top (dropped 0.3 m, as a
// landing from anywhere: a drop from above, a Mitts leap, a swim jump), still, or drifting at 6.5 m/s in 8 headings (a
// landing's momentum), stick idle; or drifting and holding the stick along its drift in 4 headings ('push', information).
// Counted: deaths after touching the roof (lava or fall), holds (actor._roofHold: still on the off-limits top, roofDir 0),
// long stays (on the roof > 1 s), with each block's height over the dry floor round it (how it can be reached).
// PAGE_ARGS lv=low,high,r30,r60,r90,f50 (default all); pts=4 (grid per side); push=0 to skip pushes
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { Hit } = await import('./src/game/physics.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const PA = String(window.__pageArgs || '');
  const LVS = (/lv=([^;&]+)/.exec(PA)?.[1] || 'low,high,r30,r60,r90,f50').split(',');
  const NP = Number(/pts=([0-9]+)/.exec(PA)?.[1] || 4), doPush = !/push=0/.test(PA);
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, phys = __G.physics, K = C.LAVA.kill;
  const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
  // the schedule: LOW and HIGH, and the first rise's 30 / 60 / 90 % and the first fall's 50 %
  const lo = W.low, hi = W.high;
  const times = { low: 10, high: 50 };
  { let prev = null, risen = false; for (let t = 0; t <= 170; t += 0.25) { setT(t); const y = Lv.y, e = (y - lo) / (hi - lo);
      if (prev !== null) {
        for (const [k, f] of [['r30', 0.3], ['r60', 0.6], ['r90', 0.9]]) if (times[k] === undefined && prev < f && e >= f) times[k] = t;
        if (e >= 0.999) risen = true;
        if (risen && times.f50 === undefined && prev > 0.5 && e <= 0.5) times.f50 = t;
      }
      prev = e; } }
  const res = { times, levels: {} };
  const DOWN = V(0, -1, 0), O = V(0, 0, 0), H = new Hit();
  const hitBlock = (x, z, y) => { const h = phys.raycast(O.set(x, y, z), DOWN, 3, H); return h.hit ? { y: H.point.y, block: H.block, ny: H.normal.y } : null; };
  let deathsIdle = 0, holdsReach = 0;
  for (const lvKey of LVS) {
    if (times[lvKey] === undefined) { res.levels[lvKey] = 'no time'; continue; }
    setT(times[lvKey]);
    const LY = Lv.y;
    const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= LY + K - 0.01) && W.inRegion(x, z); };
    const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
    const cands = [];
    for (const b of lvl.blocks) {
      if (!b || !b.roof || !b.solid || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
      const top = b.center.y + b.half.y * b.axes[1].y;
      if (top < LY + K) continue;
      let near = false;
      for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
        for (let s = e + 0.1; s <= e + 4.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top + 0.5)) near = true; }
      if (near) cands.push(b);
    }
    let sims = 0, touched = 0, died = 0, diedIdle = 0, diedIdleSlid = 0, held = 0, long = 0; const per = [];
    for (const b of cands) {
      const ax = b.axes[0], az = b.axes[2], top0 = b.center.y + b.half.y * b.axes[1].y;
      // the dry floor round it (the highest within 2.5 m that is no roof and not lava): how far up the top is from it
      let floorMax = -Infinity, floorAbove = false;
      for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
        for (let s = e + 0.3; s <= e + 2.5; s += 0.3) { const x = b.center.x + dx * s, z = b.center.z + dz * s; const hb = hitBlock(x, z, top0 + 3.0);
          if (!hb || lavaAt(x, z, hb.y + 0.05)) continue; const bb = lvl.blocks[hb.block]; if (bb && bb.roof) continue; if (hb.y > top0 + 0.1) floorAbove = true; else floorMax = Math.max(floorMax, hb.y); } }
      const rise = floorMax === -Infinity ? null : r2(top0 - floorMax);
      const row = { tag: b.tag || '#' + b.id, id: b.id, dyn: !!b.dynamic, at: [r2(b.center.x), r2(top0), r2(b.center.z)], size: [r2(b.half.x * 2), r2(b.half.y * 2), r2(b.half.z * 2)], pitched: b.axes[1].y < 0.99, rise, floorAbove, sims: 0, touched: 0, died: 0, diedIdle: 0, diedIdleSlid: 0, held: 0, long: 0, eg: [] };
      const nu = Math.max(1, Math.min(NP, Math.round(b.half.x * 2 / 0.3))), nv = Math.max(1, Math.min(NP, Math.round(b.half.z * 2 / 0.3)));
      for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) {
        const u = nu === 1 ? 0 : -b.half.x + 0.12 + (iu * (2 * b.half.x - 0.24)) / (nu - 1), v = nv === 1 ? 0 : -b.half.z + 0.12 + (iv * (2 * b.half.z - 0.24)) / (nv - 1);
        const x = b.center.x + ax.x * u + az.x * v, z = b.center.z + ax.z * u + az.z * v;
        const hb = hitBlock(x, z, top0 + 1.0); if (!hb || hb.block !== b.id) continue;
        const modes = [['drop', null, false]];
        for (let k = 0; k < 8; k++) modes.push(['drift', (k * Math.PI) / 4, false]);
        if (doPush) for (let k = 0; k < 4; k++) modes.push(['push', (k * Math.PI) / 2 + Math.atan2(ax.z, ax.x), true]);
        for (const [mode, h, hold] of modes) {
          kid.carry = null; kid.spawnAt(V(x, hb.y + 0.3, z), 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100;
          it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
          kid.vel.set(h === null ? 0 : 6.5 * Math.cos(h), 0, h === null ? 0 : 6.5 * Math.sin(h));
          sims++; row.sims++;
          let on = false, onF = 0, heldNow = false, offF = 0; const trail = row.eg.length < 2 ? [] : null;
          for (let f = 0; f < 180; f++) {
            if (hold) it.move.set(Math.cos(h), 0, Math.sin(h)); else it.move.set(0, 0, 0);
            kid.update(dt);
            const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null;
            const onRoof = !!(gb && gb.roof);
            if (onRoof) { on = true; onF++; offF = 0; } else if (on && kid.grounded) offF++;
            heldNow = onRoof && kid.roofDir && kid.roofDir.lengthSq() === 0;
            if (trail && f % 3 === 0) trail.push([f, r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z), onRoof ? 'R' : kid.grounded ? 'F' : 'a']);
            if (!kid.alive || offF > 12) break;
          }
          if (!on) continue;
          touched++; row.touched++;
          if (onF > 60) { long++; row.long++; }
          if (heldNow) { held++; row.held++; }
          if (!kid.alive) {
            died++; row.died++;
            if (!hold) { diedIdle++; row.diedIdle++; if (onF >= 3) { diedIdleSlid++; row.diedIdleSlid++; } }
            if (row.eg.length < 3 && (!hold || row.eg.length < 1)) row.eg.push({ onF, mode, h: h === null ? null : Math.round((h * 180) / Math.PI), at: [r2(x), r2(hb.y), r2(z)], death: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], cause: Lv.under(kid.pos) ? 'lava' : 'other', trail });
          } else if (heldNow && row.eg.length < 3) row.eg.push({ mode, held: true, h: h === null ? null : Math.round((h * 180) / Math.PI), at: [r2(x), r2(hb.y), r2(z)], end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)] });
        }
      }
      if (row.died || row.held || row.long) per.push(row);
      if (row.held && ((row.rise !== null && row.rise <= 2.6) || row.floorAbove)) holdsReach++;
    }
    deathsIdle += diedIdle;
    res.levels[lvKey] = { t: times[lvKey], y: r2(LY), roofBlocks: cands.length, sims, touched, died, diedIdle, diedIdleSlid, held, long, blocks: per.sort((a, b) => (b.diedIdleSlid - a.diedIdleSlid) || (b.held - a.held)).slice(0, 40) };
  }
  kid.carry = null;
  R('probe-roof8: no roof top beside the lava (every point, still or drifting, stick idle) drops a kid into it; holds listed', deathsIdle === 0, res);
  R('probe-roof8 (information): holds on roofs a kid can reach (≤ 2.6 m over the dry floor round it, or floor above it)', holdsReach === 0, { holdsReach });
  return out;
})();
