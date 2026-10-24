// Review 8 probe: a fine local search round the largest steered running jumps (probe-steer8 at HIGH: (±14.5, 1.4, ±3.5)
// heading 270 / 90, steered 45° at 4 frames, onto race 7: 14.46 / 13.87 m; and the audit's race 7 → coping 14.15 m). Start
// offsets ±0.3 m (0.15 m steps), headings ±12° (3° steps), run-ups 2.6 / 1.5 / 0.8, steers 0 / ±15…±90° (15° steps) at
// 2 / 4 / 6 / 8 frames. Gain as the audit's (nav walk − flight); a crossing has > 0.35 m with the whole footprint over lava.
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { PLAYER } = await import('./src/config.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  Lv.debugT(50); step(1 / 60);
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, K = C.LAVA.kill, FOOT = PLAYER.footRadius;
  const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y + 1.3); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  const footLava = (x, z, y) => lavaAt(x, z, y) && lavaAt(x + FOOT, z, y) && lavaAt(x - FOOT, z, y) && lavaAt(x, z + FOOT, y) && lavaAt(x, z - FOOT, y);
  const T0 = performance.now();
  const seeds = [[14.5, 1.4, 3.5, 270], [-14.5, 1.4, -3.5, 90], [17.5, 1.25, -0.5, 135], [-17.5, 1.25, 0.5, 315], [15.5, 1.4, -0.5, 68], [-15.5, 1.4, 0.5, 247]];
  const rows = []; let best = null, n = 0;
  for (const [x0, y0, z0, hd0] of seeds) {
    const m0 = nav.nearest(V(x0, y0, z0), 0.6, true); if (m0 < 0) continue; const n0 = nav.nodes[m0];
    let sb = null;
    for (let ox = -0.3; ox <= 0.3001; ox += 0.15) for (let oz = -0.3; oz <= 0.3001; oz += 0.15) for (let dh = -12; dh <= 12; dh += 3) {
      if ((performance.now() - T0) / 1000 > 780) break;
      const h = ((hd0 + dh) * Math.PI) / 180, dx = Math.cos(h), dz = Math.sin(h);
      const tx = x0 + ox, tz = z0 + oz;
      let edge = null; for (let s = 0.1; s <= 3; s += 0.1) { const x = tx + dx * s, z = tz + dz * s; if (lavaAt(x, z, y0) || lvl.groundHeight(x, z, y0 + 1.3) < y0 - 0.3) { edge = s; break; } }
      for (const ru of [2.6, 1.5, 0.8]) {
        const sx = tx + dx * ((edge ?? 0.35) - ru), sz = tz + dz * ((edge ?? 0.35) - ru), sy = lvl.groundHeight(sx, sz, y0 + 0.6);
        if (!(Math.abs(sy - y0) < 0.35) || lavaAt(sx, sz, sy)) continue;
        for (let sd = -90; sd <= 90; sd += 15) for (const sf of (sd ? [2, 4, 6, 8] : [0])) {
          if (!sd && edge === null) continue;
          kid.carry = null; kid.spawnAt(V(sx, sy + 0.05, sz), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; kid.ink = 100;
          it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
          for (let i = 0; i < 3; i++) kid.update(dt);
          const st = (sd * Math.PI) / 180, sdx = dx * Math.cos(st) - dz * Math.sin(st), sdz = dx * Math.sin(st) + dz * Math.cos(st);
          let jumped = false, jf = -1, run = 0, maxRun = 0, px = kid.pos.x, pz = kid.pos.z;
          for (let f = 0; f < 200; f++) {
            if (sd && jf >= 0 && f - jf >= sf) it.move.set(sdx, 0, sdz); else it.move.set(dx, 0, dz);
            const along = (kid.pos.x - tx) * dx + (kid.pos.z - tz) * dz;
            it.jump = !jumped && along >= (edge ?? 0.35) - 0.35; if (it.jump) { jumped = true; jf = f; }
            kid.update(dt);
            if (!kid.alive) break;
            if (jumped && !kid.grounded && footLava(kid.pos.x, kid.pos.z, kid.pos.y)) { run += Math.hypot(kid.pos.x - px, kid.pos.z - pz); maxRun = Math.max(maxRun, run); } else run = 0;
            px = kid.pos.x; pz = kid.pos.z;
            if (jumped && f - jf > 4 && kid.grounded) break;
          }
          n++;
          if (!kid.alive || !kid.grounded || maxRun <= 0.35 || Lv.covers(kid.pos.x, kid.pos.z, kid.pos.y)) continue;
          const q = V(kid.pos.x, kid.pos.y, kid.pos.z); let m = nav.nearest(q, 0.6, true); if (m < 0) m = nav.nearest(q, 1.4, true); if (m < 0) continue;
          const p = nav.path(m0, m, 0); if (!p) continue;
          let L = 0; for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; L += Math.hypot(b.x - a.x, b.z - a.z); }
          const gain = L - Math.hypot(q.x - n0.x, q.z - n0.z);
          const row = { seed: [x0, z0, hd0], at: [r2(tx), r2(tz)], hd: hd0 + dh, ru, steer: sd, sf, lavaRun: r2(maxRun), landed: [r2(q.x), r2(q.y), r2(q.z)], on: lvl.blocks[kid.ground.block]?.tag || '#', gain: r2(gain) };
          if (!sb || gain > sb.gain) sb = row;
          if (!best || gain > best.gain) best = row;
        }
        break;
      }
    }
    rows.push(sb);
  }
  R('probe-steer8-local: the largest steered running jumps, searched finely round the seeds, stay under 15 m', !best || best.gain < 15, { flights: n, best, perSeed: rows, sec: Math.round((performance.now() - T0) / 1000) });
  return out;
})();
