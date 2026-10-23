// Rule 21 by the real physics (fix round 5; the reviewer's probe-notch5b of review 5, rebuilt — its file was gone from
// /tmp): at HIGH, every Pumice stone's outline every 0.25 m (lava-audit rule 21's samples, both halves) where a static top
// stands within 2.5 m straight out — a kid stepped by actor.update, no jump pressed:
//   off   from 0.6 m inside the stone, walking (stick 0.5) and running (1.0) straight out toward that top, the stick let go
//         on the first grounded frame on the floor past the gap (or 0.6 m past it); then 1 s standing — alive?
//   swim  the same as a squid (no ink: the bare stone)
//   on    from 0.5 m past the top's edge, walking back onto the stone — alive?
//   a death is placed: before the gap, IN THE GAP (a notch), past the far floor (run off it into open lava)
// controls: standing 2 s on each stone; walking the chains stone → stone across each 0.25 m seam (race 1 → … → 5, 6 → 7)
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-notch.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS: 'stones=race1,race5' to limit; 'old=1' only the fix-round-4 pinch samples (the 18); 'nokerb=1' the Race
//   kerbs taken out (not solid): the stage as it stood before fix round 5 — the check must fail (40 deaths in the gaps)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { on } = await import('./src/core/ctx.js');
  const W = __G.lavaWorld, Lv = g.match.lava, dbg = g.debug, lvl = __G.level; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const args = String(window.__pageArgs || ''), only = /stones=([^;&]+)/.exec(args)?.[1]?.split(','), oldOnly = /old=1/.test(args);
  const OLD = [[-19.81, -13.92], [-19.89, -13.69], [-19.97, -13.45], [-17.56, -13.25], [-23.86, -2.16], [-23.94, -1.92], [-24.03, -1.68], [-24.11, -1.45], [-20.97, 3.15]];
  const isOld = (x, z) => OLD.some(([a, b]) => (Math.hypot(a - x, b - z) < 0.05) || Math.hypot(-a - x, -b - z) < 0.05);
  // (teeth: nokerb=1 takes the Race kerbs out of the level — not solid — as the stage stood before fix round 5)
  const noKerb = /nokerb=1/.test(args); let kerbs = 0;
  if (noKerb) for (const b of lvl.blocks) if (b.tag === 'race-kerb') { b.solid = false; kerbs++; }
  setT(50);
  const qb = [], hp = new THREE.Vector3();
  const solidAt = (x, y, z) => { hp.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb)) { const b = lvl.blocks[id]; if (b.solid && !b.dynamic && lvl.pointInBlock(b, hp, 0.001)) return b; } return null; };
  const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
  let dead = null; const off = on('splatted', (e) => { if (e.victim === kid && !dead) dead = e.cause; });
  const reset = () => { if (!kid.alive) kid.respawn?.(); dead = null; };
  // one trial: from p (x, z, y), stick along (ux, uz) × mag until `until` m along from the start, then let go 1 s
  const trial = (p, ux, uz, mag, until, squid, gap = null) => {   // gap: [along where it starts, along where it ends, the far side static?]
    reset();
    kid.spawnAt(V(p[0], p[1] + 0.05, p[2]), 0); kid.invuln = 0; kid.vel.set(0, 0, 0); kid.form = 'kid'; kid.ink = 100;
    it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
    for (let i = 0; i < 3; i++) kid.update(dt);
    let f = 0, along = 0, landed = false, maxAlong = 0;
    // (the stick is let go on the first grounded frame past the gap on the floor beyond it — a narrow kerb is crossed at
    // a walk, not overrun — or at `until`; a death is then placed: in the gap (the notch) or past the floor (run off it))
    for (; f < 150 && kid.alive; f++) {
      along = (kid.pos.x - p[0]) * ux + (kid.pos.z - p[2]) * uz; maxAlong = Math.max(maxAlong, along);
      const gb = kid.grounded && kid.ground && lvl.blocks[kid.ground.block];
      if (along >= until || (gap && gb && along > gap[1] && (gap[2] ? !gb.dynamic : !!gb.dynamic))) { landed = !!gb; break; }
      it.move.set(ux * mag, 0, uz * mag); it.squid = !!squid; kid.update(dt);
    }
    it.move.set(0, 0, 0); it.squid = false;
    for (let i = 0; i < 60 && kid.alive; i++) { kid.update(dt); along = (kid.pos.x - p[0]) * ux + (kid.pos.z - p[2]) * uz; maxAlong = Math.max(maxAlong, along); }
    // (the module's kill runs in the match's frame: one frame of it after the actor's own steps)
    dbg.step(1000 / 60);
    const gb = kid.ground && lvl.blocks[kid.ground.block], ok = kid.alive && !dead;
    return { alive: ok, cause: dead || (kid.alive ? null : 'dead'), at: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], on: gb ? (gb.tag || (gb.dynamic ? 'rider' : '#' + gb.id)) : null, landed,
      where: ok ? null : !gap ? '?' : maxAlong < gap[0] ? 'before the gap' : maxAlong <= gap[1] + 0.15 ? 'IN THE GAP' : 'past the far floor' };
  };
  const rows = { n: 0, off: 0, swim: 0, on: 0, deaths: [], byStone: {} };
  for (const RR of Lv.riders.filter((q) => q.r.sink && q.solid && (!only || only.includes(q.r.id)))) {
    const r = RR.r, top = RR.top;
    const bs = (rows.byStone[r.id] = { samples: 0, deaths: 0 });
    for (const p of r.parts) {
      if (!p.body) continue;
      const q = C.partPose(r, p, top, {}), c = Math.cos(q.yaw), sn = Math.sin(q.yaw);
      const edges = [[q.hx, null, c, -sn], [-q.hx, null, -c, sn], [null, q.hz, sn, c], [null, -q.hz, -sn, -c]];
      for (const [u0, v0, nx, nz] of edges) {
        const L = u0 === null ? q.hx : q.hz;
        for (let t = -L + 0.1; t <= L - 0.1 + 1e-6; t += 0.25) {
          const u = u0 === null ? t : u0, v = v0 === null ? t : v0, ex = q.cx + u * c + v * sn, ez = q.cz - u * sn + v * c;
          if (oldOnly && !isOld(ex, ez)) continue;
          let hit = null;
          for (let d = 0.05; d <= 2.5 && !hit; d += 0.05) {
            const x = ex + nx * d, z = ez + nz * d;
            if (Lv.riders.some((o) => o !== RR && o.solid && C.inRider(o.r, x, z, 0) && Math.abs(o.top - top) < 0.4)) { hit = { d, rider: true }; break; }
            for (let y = top + 0.35; y >= top - 0.4; y -= 0.05) { const b = solidAt(x, y, z); if (b) { hit = { d, y: lvl.groundHeight(x, z, top + 0.5), tag: b.tag }; break; } }
          }
          if (!hit || hit.rider) continue;   // (open lava ≥ 2.5 m out, or another stone: not this probe's)
          rows.n++; bs.samples++; setT(50);
          const inside = [ex - nx * 0.6, top, ez - nz * 0.6], untilOff = 0.6 + hit.d + 0.6;
          const res = [];
          const gOff = [0.6, 0.6 + hit.d, true], gOn = [0.5, 0.5 + hit.d, false];
          for (const mag of [0.5, 1.0]) { const a = trial(inside, nx, nz, mag, untilOff, false, gOff); rows.off++; res.push(['off' + mag, a]); }
          { const a = trial(inside, nx, nz, 1.0, untilOff, true, gOff); rows.swim++; res.push(['swim', a]); }
          { const st = [ex + nx * (hit.d + 0.5), hit.y, ez + nz * (hit.d + 0.5)]; const a = trial(st, -nx, -nz, 0.5, 0.5 + hit.d + 0.6, false, gOn); rows.on++; res.push(['on', a]); }
          for (const [k, a] of res) if (!a.alive) { bs.deaths++; if (a.where === 'IN THE GAP') rows.gapDeaths = (rows.gapDeaths || 0) + 1; if (rows.deaths.length < 30) rows.deaths.push([r.id, r2(ex), r2(ez), r2(hit.d), hit.tag, k, a.where, a.cause, a.at, a.on, isOld(ex, ez) ? 'OLD' : '']); }
        }
      }
    }
  }
  R((noKerb ? '[kerbs out: ' + kerbs + '] ' : '') + 'walking (0.5 / 1.0) and swimming off every stone toward the static top beside it, and walking back on, at HIGH: no death (' + (oldOnly ? 'the 18 old pinch samples' : 'every outline sample with a static top within 2.5 m') + ')', rows.n > 0 && !rows.deaths.length, rows);
  // controls: stand 2 s on each stone; walk the chains stone → stone
  const stand = [];
  for (const RR of Lv.riders.filter((q) => q.r.sink && q.solid && (!only || only.includes(q.r.id)))) {
    reset(); kid.spawnAt(V(RR.r.x, RR.top + 0.05, RR.r.z), 0); kid.vel.set(0, 0, 0); it.move.set(0, 0, 0); it.squid = false;
    for (let i = 0; i < 120 && kid.alive; i++) kid.update(dt); dbg.step(1000 / 60);
    stand.push([RR.r.id, kid.alive && !dead]);
  }
  const chain = [];
  for (const tw of ['', '~']) for (const ids of [['race1', 'race2', 'race3', 'race4', 'race5'], ['race6', 'race7']]) for (let k = 0; k + 1 < ids.length; k++) {
    const A = Lv.riders.find((q) => q.r.id === ids[k] + tw), B = Lv.riders.find((q) => q.r.id === ids[k + 1] + tw);
    if (!A || !B) continue;
    const dx = B.r.x - A.r.x, dz = B.r.z - A.r.z, d = Math.hypot(dx, dz);
    const a = trial([A.r.x, A.top, A.r.z], dx / d, dz / d, 0.5, d, false);
    chain.push([A.r.id, B.r.id, a.alive, a.on]);
  }
  R('controls: standing 2 s on each stone at HIGH, and walking stone → stone across each seam (both Races, both halves): all alive', stand.every((s) => s[1]) && chain.every((c) => c[2]), { stand: stand.filter((s) => !s[1]), standN: stand.length, chain });
  off();
  return out;
})();
