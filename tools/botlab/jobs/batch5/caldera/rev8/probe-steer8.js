// Review 8 probe: rule 44's steered march from EVERY take-off, not only rider tops. lava-audit steers jumps only off rider
// tops (the Organs, the stones); the causeway, the copings, the island, the Lakefront and the Horn Step are flown straight
// along 16 headings only. Here: every valid nav node standing within 3.5 m of lava now (static or rider), HD headings; the
// take-off is where its floor ends along the heading within 3 m (a drop or the lava), else the node itself (a run along a
// walkway, then a jump off its side); the first run-up of 2.6 / 1.5 / 0.8 m that fits; flights straight and with the stick
// turned ±45 / ±90° (PAGE_ARGS st=) at SF frames after the jump (PAGE_ARGS sf=). A crossing: over 0.35 m with the whole
// footprint over lava, down alive on dry floor, not on the take-off's own rider (the audit's crossed2). Gain: the nav walk
// from the take-off node to the landing's node, minus the flight (the audit's detour).
// PAGE_ARGS lv=low|high; hd=16|32; sf=4,8,12; st=45,90; grid=1 (take-off nodes thinned to one per grid m)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { PLAYER } = await import('./src/config.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  if (!W || !Lv) { R('lava', false); return out; }
  const PA = String(window.__pageArgs || '');
  const LVS = (/lv=([^;&]+)/.exec(PA)?.[1] || 'high,low').split(',');
  const HD = Number(/hd=([0-9]+)/.exec(PA)?.[1] || 16);
  const SF = (/sf=([0-9,]+)/.exec(PA)?.[1] || '4,8,12').split(',').map(Number);
  const STD = (/st=([0-9.,]+)/.exec(PA)?.[1] || '45,90').split(',').map(Number);
  const GRID = Number(/grid=([0-9.]+)/.exec(PA)?.[1] || 0);
  const ONLYSTATIC = /static=1/.test(PA);
  const TLIM = Number(/tlim=([0-9]+)/.exec(PA)?.[1] || 800), SKIP = Number(/skip=([0-9]+)/.exec(PA)?.[1] || 0), TAKE = Number(/take=([0-9]+)/.exec(PA)?.[1] || 1e9);
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, M = W.navMeta, K = C.LAVA.kill, FOOT = PLAYER.footRadius;
  const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
  const STEERS = [[0, 0]]; for (const d of STD) for (const s of [1, -1]) for (const f of SF) STEERS.push([(s * d * Math.PI) / 180, f]);
  const res = { HD, SF, STD, levels: {} };
  let over15 = 0, over20 = 0, maxAll = 0;
  const t0 = performance.now();
  for (const level of LVS) {
    setT(level === 'low' ? 10 : 50);
    const ghAt = (x, z, y) => lvl.groundHeight(x, z, y + 1.3);
    const lavaAt = (x, z, y) => { const gh = ghAt(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
    const footLava = (x, z, y) => lavaAt(x, z, y) && lavaAt(x + FOOT, z, y) && lavaAt(x - FOOT, z, y) && lavaAt(x, z + FOOT, y) && lavaAt(x, z - FOOT, y);
    const detour = (c, at) => { const q = V(at[0], at[1], at[2]); let m = nav.nearest(q, 0.6, true); if (m < 0) m = nav.nearest(q, 1.4, true); if (m < 0) return null; const p = nav.path(c.id, m, 0); if (!p) return 999; let L = 0; for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; L += Math.hypot(b.x - a.x, b.z - a.z); } return Math.min(999, L - Math.hypot(q.x - c.x, q.z - c.z)); };
    // take-off nodes: valid, dry now, a floor under them now, lava within 3.5 m in some direction
    const nodes = [], taken = [];
    for (const nd of nav.nodes) {
      if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      const rider = M.kind[nd.id] === 2;
      if (rider && M.pose[nd.id] !== (level === 'high' ? 1 : 0)) continue;
      if (ONLYSTATIC && rider) continue;
      let near = false;
      for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8; for (let s = 0.3; s <= 3.5 && !near; s += 0.3) if (lavaAt(nd.x + Math.cos(a) * s, nd.z + Math.sin(a) * s, nd.y)) near = true; }
      if (!near) continue;
      if (GRID > 0 && taken.some((q) => Math.abs(q.x - nd.x) < GRID * 0.95 && Math.abs(q.z - nd.z) < GRID * 0.95 && Math.abs(q.y - nd.y) < 0.5)) continue;
      taken.push(nd); nodes.push(nd);
    }
    const own = (nd) => { if (M.kind[nd.id] !== 2) return null; const RR = Lv.riders.find((q) => q.r === W.riders[M.rider[nd.id]]); return new Set((RR?.blocks || []).map((b) => b && b.id)); };
    const tryJump = (c, runup, steer, sfr) => {
      const sx = c.x + c.dx * (c.edge - runup), sz = c.z + c.dz * (c.edge - runup), sy = lvl.groundHeight(sx, sz, c.y + 0.6);
      if (!(sy > c.y - 0.35) || sy > c.y + 0.35 || lavaAt(sx, sz, sy)) return null;
      kid.carry = null; kid.spawnAt(V(sx, sy + 0.05, sz), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid'; kid.ink = 100;
      it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
      for (let i = 0; i < 3; i++) kid.update(dt);
      if (!kid.grounded) return null;
      let jumped = false, jf = -1, run = 0, maxRun = 0, px = kid.pos.x, pz = kid.pos.z;
      const sdx = c.dx * Math.cos(steer) - c.dz * Math.sin(steer), sdz = c.dx * Math.sin(steer) + c.dz * Math.cos(steer);
      for (let f = 0; f < 200; f++) {
        if (steer && jf >= 0 && f - jf >= sfr) it.move.set(sdx, 0, sdz); else it.move.set(c.dx, 0, c.dz);
        const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
        it.jump = !jumped && along >= c.edge - 0.35;
        if (it.jump) { jumped = true; jf = f; }
        kid.update(dt);
        if (!kid.alive) return { died: true };
        if (jumped && !kid.grounded && footLava(kid.pos.x, kid.pos.z, kid.pos.y)) { run += Math.hypot(kid.pos.x - px, kid.pos.z - pz); maxRun = Math.max(maxRun, run); } else run = 0;
        px = kid.pos.x; pz = kid.pos.z;
        if (jumped && f - jf > 4 && kid.grounded) break;
        if (!jumped && f > 120) return null;
      }
      const gb = kid.ground && lvl.blocks[kid.ground.block];
      const gl = lvl.groundHeight(kid.pos.x, kid.pos.z, kid.pos.y + 0.3);
      const dry = kid.alive && kid.grounded && gl > Lv.y + K - 0.01 && !Lv.covers(kid.pos.x, kid.pos.z, kid.pos.y);
      const crossed = dry && maxRun > 0.35 && !(gb && c.own && c.own.has(gb.id));
      return { crossed, lavaRun: r2(maxRun), at3: [kid.pos.x, kid.pos.y, kid.pos.z], at: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], on: gb ? (gb.tag || (gb.dynamic ? 'rider' : '#' + gb.id)) : null };
    };
    const X = []; let cands = 0, flights = 0, stoppedAt = null;
    for (let ni = SKIP; ni < Math.min(nodes.length, SKIP + TAKE); ni++) {
      if ((performance.now() - t0) / 1000 > TLIM) { stoppedAt = ni; break; }
      const nd = nodes[ni];
      const ow = own(nd);
      for (let k = 0; k < HD; k++) {
        const a = (k * 2 * Math.PI) / HD, dx = Math.cos(a), dz = Math.sin(a);
        let edge = null;
        for (let s2 = 0.1; s2 <= 3.0; s2 += 0.1) { const x = nd.x + dx * s2, z = nd.z + dz * s2; if (lavaAt(x, z, nd.y) || ghAt(x, z, nd.y) < nd.y - 0.3) { edge = s2; break; } }
        const c = { id: nd.id, x: nd.x, y: nd.y, z: nd.z, dx, dz, edge: edge === null ? 0.35 : edge, own: ow, rider: M.kind[nd.id] === 2 };
        cands++;
        let best = null;
        for (const ru of [2.6, 1.5, 0.8]) {
          const sx = c.x + c.dx * (c.edge - ru), sz = c.z + c.dz * (c.edge - ru), sy = lvl.groundHeight(sx, sz, c.y + 0.6);
          if (!(sy > c.y - 0.35) || sy > c.y + 0.35 || lavaAt(sx, sz, sy)) continue;   // (the run-up does not fit)
          for (const [st, sf] of STEERS) {
            // a straight jump with no edge ahead lands on the same floor: skip it
            if (!st && edge === null) continue;
            const q = tryJump(c, ru, st, sf);
            if (q === null) continue;
            flights++;
            if (!q.crossed) continue;
            const gain = detour(c, q.at3);
            const x = { from: [r2(nd.x), r2(nd.y), r2(nd.z)], rider: c.rider || undefined, dir: Math.round((a * 180) / Math.PI), edge: edge === null ? 'none' : r2(edge), runup: ru, steer: Math.round((st * 180) / Math.PI), sf: st ? sf : undefined, lavaRun: q.lavaRun, landed: q.at, on: q.on, gain: gain === null ? null : r2(gain) };
            if (!best || (gain ?? 999) > (best.gain ?? -1)) best = x;
          }
          break;
        }
        if (best) X.push(best);
      }
    }
    const top = [...X].sort((p, q) => (q.gain ?? 999) - (p.gain ?? 999)).slice(0, 30);
    const o15 = X.filter((x) => !(x.gain <= 15)), o20 = X.filter((x) => !(x.gain <= 20));
    over15 += o15.length; over20 += o20.length;
    const mx = X.reduce((m, x) => Math.max(m, x.gain ?? 0), 0); maxAll = Math.max(maxAll, mx);
    const steered = X.filter((x) => x.steer), straight = X.filter((x) => !x.steer);
    res.levels[level] = { nodes: nodes.length, skip: SKIP, stoppedAt, cands, flights, crossings: X.length, steered: steered.length, steeredMax: r2(steered.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), straightMax: r2(straight.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), staticSteeredMax: r2(steered.filter((x) => !x.rider).reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), over10: X.filter((x) => !(x.gain <= 10)).length, over15: o15.length, over20: o20.length, max: r2(mx), unmeasured: X.filter((x) => x.gain === null).length, top, sec: Math.round((performance.now() - t0) / 1000) };
  }
  kid.carry = null;
  R('probe-steer8: no running jump (straight or steered in the air, from any take-off) saves over 20 m', over20 === 0, res);
  R('probe-steer8: …and the largest stays under 15 m (the margin)', maxAll < 15, { max: r2(maxAll), over15 });
  return out;
})();
