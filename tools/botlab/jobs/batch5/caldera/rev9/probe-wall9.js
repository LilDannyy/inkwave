// Review 9 probe: the caldera-wall tops rule 47 b's reach bar calls unreachable (over 2.6 m above every dry floor within
// 6 m) — a squid CAN climb onto them: their faces are inkable. Every 0.5 m along each inkable face that rises from dry
// floor (not a roof), a squid climbs the inked face; on top: idle / pushing on (the climb's way) / steering back against the
// slide (rule 47 b's own "back" mode: on the top and in the air) / steering left / right; at LOW, the rise's 30 / 60 / 90 %,
// HIGH and the fall's 50 %. Deaths with their trail: the way the slide took, where it left the top, where it came down.
//   PAGE_ARGS ids=944,953,... (blocks; default: every such top)  lv=low,r30,r60,r90,high,f50
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { Hit } = await import('./src/game/physics.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const PA = String(window.__pageArgs || ''), arg = (k, d) => new RegExp(k + '=([^;&]+)').exec(PA)?.[1] ?? d;
  const IDS = arg('ids', '') ? arg('ids', '').split(',').map(Number) : null, LVS = arg('lv', 'low,r30,r60,r90,high,f50').split(',');
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, K = C.LAVA.kill, dt = 1 / 60, P8 = __G.paint, LO = W.low, H = W.high;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent;
  const phys = __G.physics, DOWN = V(0, -1, 0), O3 = V(0, 0, 0), H3 = new Hit();
  const hitBlock = (x, z, y) => { const h = phys.raycast(O3.set(x, y, z), DOWN, 3, H3); return h.hit ? { y: H3.point.y, block: H3.block } : null; };
  const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
  const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  const reset = (pos) => { kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(pos, 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100; kid.vel.set(0, 0, 0); it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
  const times = { low: 10 };
  { let prev = null, risen = false; for (let t = 0; t <= 170; t += 0.25) { Lv.debugT(t); const e = (Lv.y - LO) / (H - LO);
      if (prev !== null) { for (const [k, f] of [['r30', 0.3], ['r60', 0.6], ['r90', 0.9]]) if (times[k] === undefined && prev < f && e >= f) times[k] = t;
        if (e >= 0.999 && times.high === undefined) times.high = t + 3; if (e >= 0.999) risen = true; if (risen && times.f50 === undefined && prev > 0.5 && e <= 0.5) times.f50 = t; }
      prev = e; } }
  let T0 = 0, F = 0;
  const tick = () => { F++; Lv.debugT(T0 + F / 60); };
  const setClock = (t) => { T0 = t; F = 0; Lv.debugT(t); };
  const rows = [], tot = {};
  for (const lvKey of LVS) {
    const t = times[lvKey]; if (t === undefined) continue;
    setClock(t);
    const LY = Lv.y;
    for (const b of lvl.blocks) {
      if (!b || !b.roof || !b.solid || b.dynamic || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
      if (IDS && !IDS.includes(b.id)) continue;
      const top0 = topOf(b); if (top0 < LY + K) continue;
      let near = false;
      for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
        for (let s = e + 0.1; s <= e + 4.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top0 + 0.5)) near = true; }
      if (!near) continue;
      let fmax = -Infinity;
      for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
        for (let s2 = e + 0.3; s2 <= e + 6; s2 += 0.5) { const x = b.center.x + dx * s2, z = b.center.z + dz * s2, g2 = lvl.groundHeight(x, z, top0 + 3); if (g2 > -50 && !lavaAt(x, z, g2 + 0.05)) { const hb = hitBlock(x, z, g2 + 0.05); if (hb && !lvl.blocks[hb.block]?.roof) fmax = Math.max(fmax, g2); } } }
      if (!IDS && top0 - fmax <= 2.6) continue;
      const row = { level: lvKey, lavaY: r2(LY), top: b.tag || '#' + b.id, id: b.id, at: [r2(b.center.x), r2(top0), r2(b.center.z)], size: [r2(b.half.x * 2), r2(b.half.z * 2)], overDry: r2(top0 - fmax), n: 0, reached: 0, deaths: {}, tries: {}, eg: [] };
      for (const [ax, sg, hh, wa, wh] of [[b.axes[0], 1, b.half.x, b.axes[2], b.half.z], [b.axes[0], -1, b.half.x, b.axes[2], b.half.z], [b.axes[2], 1, b.half.z, b.axes[0], b.half.x], [b.axes[2], -1, b.half.z, b.axes[0], b.half.x]]) {
        const nx = ax.x * sg, nz = ax.z * sg;
        let paintable = false; for (const fid of b.faces) { const fc = lvl.faces[fid]; if (fc && fc.n.x * nx + fc.n.z * nz > 0.9 && fc.paintable) paintable = true; }
        if (!paintable) continue;
        for (let w = -wh + 0.3; w <= wh - 0.3 + 1e-6; w += 0.5) {
          setClock(t);
          const fx = b.center.x + nx * hh + wa.x * w, fz = b.center.z + nz * hh + wa.z * w;
          const sx = fx + nx * 0.6, sz = fz + nz * 0.6, gy = lvl.groundHeight(sx, sz, top0 - 0.2);
          if (!(gy > -50) || lavaAt(sx, sz, gy + 0.05) || Lv.covers(sx, sz, gy, 2)) continue;
          const hb = hitBlock(sx, sz, gy + 0.05); if (!hb || lvl.blocks[hb.block]?.roof) continue;
          if (top0 - gy < 1.2) continue;   // (a hop reaches it: the audit's own)
          for (const mode of ['idle', 'push', 'back', 'left', 'right']) {
            setClock(t);
            P8?.clear?.();
            for (let y = gy + 0.2; y <= top0 + 0.1; y += 0.4) P8?.splat?.(V(fx, y, fz), 0.9, kid.team, { instant: true, seed: y });
            reset(V(sx, gy + 0.05, sz)); kid.form = 'squid';
            let onTop = -1, died = false, sdx = 0, sdz = 0, leftF = -1, leftAt = null, slideDir = null; const tr = [];
            for (let f = 0; f < 700; f++) {
              const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null;
              if (onTop < 0 && gb && gb.id === b.id) onTop = f;
              if (kid.roofDir && (kid.roofDir.x || kid.roofDir.z)) { sdx = kid.roofDir.x; sdz = kid.roofDir.z; if (!slideDir) slideDir = [r2(sdx), r2(sdz)]; }
              if (onTop >= 0 && leftF < 0 && !kid.grounded) { leftF = f; leftAt = [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)]; }
              if (onTop < 0) { it.squid = true; it.move.set(-nx, 0, -nz); }
              else {
                it.squid = false;
                if (mode === 'idle') it.move.set(0, 0, 0);
                else if (mode === 'push') it.move.set(-nx, 0, -nz);
                else if (mode === 'back') { if (sdx || sdz) it.move.set(-sdx, 0, -sdz); else it.move.set(0, 0, 0); }
                else if (mode === 'left') { if (sdx || sdz) it.move.set(-sdz, 0, sdx); else it.move.set(0, 0, 0); }
                else { if (sdx || sdz) it.move.set(sdz, 0, -sdx); else it.move.set(0, 0, 0); }
                // (the steer only until it comes down on other ground: then idle)
                if (leftF >= 0 && kid.grounded && !(gb && gb.id === b.id)) it.move.set(0, 0, 0);
              }
              kid.update(dt); tick();
              if (onTop >= 0 && f % 6 === 0) tr.push([f - onTop, r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z), kid.grounded ? (lvl.blocks[kid.ground.block]?.tag || '#' + kid.ground.block) : 'air']);
              if (!kid.alive) { died = true; break; }
              if (onTop >= 0 && f - onTop > 240) break;
              if (onTop < 0 && f > 360) break;
            }
            it.squid = false; it.move.set(0, 0, 0);
            row.n++; row.tries[mode] = (row.tries[mode] || 0) + 1;
            if (onTop < 0) continue;
            row.reached++;
            if (died) {
              row.deaths[mode] = (row.deaths[mode] || 0) + 1;
              const k = lvKey + ':' + mode; tot[k] = (tot[k] || 0) + 1;
              if (row.eg.length < 4) row.eg.push({ mode, face: [r2(nx), r2(nz)], foot: [r2(sx), r2(gy), r2(sz)], rise: r2(top0 - gy), slideDir, leftAt, end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], tr: tr.slice(-8) });
            }
          }
        }
      }
      P8?.clear?.();
      if (row.n) rows.push(row);
    }
  }
  const D = rows.reduce((s, r) => s + Object.values(r.deaths).reduce((a, b) => a + b, 0), 0);
  R('the "unreachable" caldera-wall tops: a squid climb reaches them; 0 deaths idle / pushing on / steering back / left / right', D === 0, { times, rows: rows.length, reached: rows.reduce((s, r) => s + r.reached, 0), deaths: D, byLevelMode: tot });
  for (const r of rows) R('wall ' + r.top + ' #' + r.id + ' ' + r.level, !Object.keys(r.deaths).length, r);
  return out;
})();
