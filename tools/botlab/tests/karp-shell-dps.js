// [b5-karp] The Roe Shell's tuning table (SPEC §2.2, §10.1 karp-shell-dps.js, WP1b): every main, every special (each
// Bomb Barrage with all of its bombs) and the Tidal Slam against a lone shell on karpbox, deterministic (frozen clock,
// 60 Hz, bots off). The damage COUNTED into the shell (after the × 0.5 for specials and the 220 cap per hit) per second
// (a special's own damage only, over the time it runs), the best of several ways to use it: the trigger held; pressed
// 0.6 s / released 0.1 s (chargers, flings); tapped, 3 frames in 12. Mains from a fitting distance for 5 s. Specials
// from 7 m, once more walking in to 2.5 m and, for the close-range ones, started at 2.5 m; while they run (5–14 s) plus
// 5 s for what they threw (a Cheer Orb's flight and fuse; 7.5 s for a Vortex Strike's flight and vortex). A barrage
// throws with the sub button, with a Bravo player 1 m behind the shell for its bombs to go after; the Zipline's
// tether zips in to the shell's foot and out again; a Vortex Strike's spot is the shell. No pass threshold (the lead sets
// shell.hp from it, Q12): a row fails only on an error, a main or a damaging special putting in 0, or a no-damage
// special (a shield, a scan, a drain, a Murk Bomb) putting in anything. The shell can't burst here (its hp is raised
// out of reach; the radius stays the resting 1.6 m).
//   MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-shell-dps.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=shooter,zooka,…' some rows; 'secs=5'.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const { BAZOOKARP: K, PLAYER, WEAPON_ORDER, SPECIAL_ORDER, SPECIALS } = await import('./src/config.js');
  const { Bazookarp } = await import('./src/game/bazookarp.js');
  const { LoopWire } = await import('./src/game/karpWire.js');
  const { KARPBOX_DEF } = await import('./tools/botlab/karpbox.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(1) : v))) });
  if (m.mode !== 'bazookarp' || !m.karp) { R('a Bazookarp match on karpbox', false, { mode: m.mode }); return out; }
  const args = window.__pageArgs || '';
  const only = args.match(/only=([\w,]+)/)?.[1]?.split(',') || null;
  const SECS = +(args.match(/secs=([\d.]+)/)?.[1] || 5);
  dbg.freeze();
  const A = m.actors.filter((a) => a.team === 0), me = A[0];
  const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  const floorY = (x, z) => { const y = G.level.groundHeight(x, z, 3); return y > -50 ? y : 0; };
  const park = () => { for (const a of m.actors) { if (!a.alive) a.respawn(); if (a.specialActive) G.specials.end(a, 'test'); const p = G.level.spawnPads[a.team]; a.status.shield = 0; a.pos.set(p.x + ((a.slot % 4) - 1.5) * 1.6, p.y, p.z + (a.team ? 2.5 : -2.5)); a.vel.set(0, 0, 0); idle(a); } };
  let Kp = m.karp;
  const fresh = () => {
    Kp?.dispose(); G.level.layout.bazookarp = KARPBOX_DEF; m.time = 250; m.state = 'playing'; m.result = null;
    G.paint.clear(); G.projectiles.clear?.(); G.specials.clear?.(); for (const it of [...(G.subs?.items || [])]) G.subs._destroy?.(it);
    m.karp = Kp = new Bazookarp(m, new LoopWire()); park();
    Kp.shell.hpMax = 1e9; Kp.shell.m = 0;   // (never bursts; the radius stays the resting one)
    for (let i = 0; i < 3; i++) dbg.step(1000 / 60);
    return Kp;
  };
  // how far from the shell's centre each main stands (in reach, as a player would)
  const DIST = { shooter: 8, twins: 8, brolly: 6, blaster: 6.5, spinner: 9, charger: 10, bow: 10, roller: 4.5, brush: 4, blade: 2.6, mitts: 2.6, bucket: 5.5 };
  // the close-range specials walk in to 2.5 m; the others are used from 7 m
  const CLOSE = new Set(['kraken', 'stamp', 'crab', 'slam', 'booyah', 'jetpack', 'zipcaster']);
  // specials that put no damage into anything by design (a shield, a scan, a gauge drain, a Murk Bomb's mist)
  const NODMG = new Set(['bubbler', 'sonar', 'drainbow', 'barrage_mist']);
  const PATTERNS = { hold: () => true, cycle: (i) => i % 42 < 36, tap: (i) => i % 12 < 3 };
  // a Bomb Barrage throws with the sub button (its main still fires, and counts as the main): hold = a throw as fast as
  // its gap allows (pressed 2 frames, released 2), cycle = one throw every 0.6 s
  const THROWS = { hold: (i) => i % 4 < 2, cycle: (i) => i % 36 < 2 };
  // after a special ends, how long what it threw can still land (a Vortex Strike: 2.2 s of flight + 4.5 s of vortex)
  const TAIL = { strike: 7.5 };
  const run = (kind, id, pattern, dist, close) => {
    fresh();
    const c = Kp.shell.center();
    const a = me;
    if (!a.alive) a.respawn();
    a.superJumpState = null; a.invuln = 0; a.hp = PLAYER.hp; a.form = 'kid'; a.status.shield = 0;
    if (kind === 'main') a.setWeapon(id); else a.setWeapon('shooter');
    a.pos.set(c.x, floorY(c.x, c.z - dist), c.z - dist); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = 0;
    for (let i = 0; i < 3; i++) dbg.step(1000 / 60);
    // every counted hit, by its source: a special's (by its id or its sp flag) or not — a special's row counts only
    // the special's own damage (the main weapon still fires during some specials), a main's row everything
    const OT = G.objTargets, sum = { sp: 0, main: 0 }, rainSp = new Map();
    let tag = null;
    const oh = OT.hit.bind(OT), os = OT.splash.bind(OT), ot = OT.tick.bind(OT), ou = OT.update.bind(OT), sa = Kp.shell.add.bind(Kp.shell);
    OT.hit = (att, dmg, wid, pt, o) => { tag = OT.isSpecial(wid, o) ? 'sp' : 'main'; try { return oh(att, dmg, wid, pt, o); } finally { tag = null; } };
    OT.splash = (att, cc, R, d0, d1, wid, o) => { tag = OT.isSpecial(wid, o) ? 'sp' : 'main'; try { return os(att, cc, R, d0, d1, wid, o); } finally { tag = null; } };
    OT.tick = (own, shape, dmg, wid, o) => { rainSp.set(own, OT.isSpecial(wid, o)); return ot(own, shape, dmg, wid, o); };
    OT.update = (dt) => { tag = 'rain'; try { return ou(dt); } finally { tag = null; } };
    Kp.shell.add = (team, amt, att) => { const sp = tag === 'rain' ? !!rainSp.get(att) : tag === 'sp'; sum[sp ? 'sp' : 'main'] += amt; return sa(team, amt, att); };
    if (kind === 'special') { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); }
    // a Vortex Strike: the spot picked on the map is the shell (its default is 16 m ahead, past it)
    if (kind === 'special' && id === 'strike' && a.specialActive?.target) { a.specialActive.target.set(c.x, 0, c.z); a.specialActive.confirm = true; }
    const barrage = kind === 'special' && SPECIALS[id]?.kind === 'barrage', zip = kind === 'special' && id === 'zipcaster';
    // a barrage's row: a Bravo player stands 1 m behind the shell's far side (Skitter and Waddle Bombs go after a foe;
    // with none near they run off and burst elsewhere); kept unhurt and still
    const foe = barrage ? m.actors.find((x) => x.team === 1) : null, R1 = Kp.shell.radius() + 1.0;
    if (foe) { if (!foe.alive) foe.respawn(); const L = Math.hypot(c.x - a.pos.x, c.z - a.pos.z) || 1, fx = c.x + ((c.x - a.pos.x) / L) * R1, fz = c.z + ((c.z - a.pos.z) / L) * R1; foe.pos.set(fx, floorY(fx, fz), fz); foe.vel.set(0, 0, 0); }
    let err = null, frames = 0;
    // mains: 5 s; specials: while the special runs (5 s at least, 14 s at most) and 5 s after (what it threw)
    const minF = Math.round(SECS * 60), maxF = kind === 'special' ? 14 * 60 : minF;
    const fire = barrage || zip ? () => false : PATTERNS[pattern], sub = barrage || zip ? THROWS[pattern] : () => false;
    let tail = kind === 'special' ? Math.round((TAIL[id] || 5) * 60) : 0;   // (a Vortex Strike's flight and vortex, a Cheer Orb's flight and fuse)
    try {
      for (let i = 0; i < maxF + tail; i++) {
        const dx = c.x - a.pos.x, dz = c.z - a.pos.z, dh = Math.hypot(dx, dz), dy = c.y - (a.pos.y + 1.2);
        a.aimYaw = a.yaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(dy, Math.max(0.5, dh)) + (kind === 'main' && id === 'bucket' ? 0.08 : 0);
        // the Zipline's tether (sub): in to the floor 1 m short of the shell (its body impact reaches it), then back
        // out to 7 m, and in again
        if (zip && a.specialActive) {
          const out = dh > 4 ? R1 : 7, k = 1 / (dh || 1), tx = c.x - dx * k * out, tz = c.z - dz * k * out, ty = floorY(tx, tz);
          const ex = tx - a.pos.x, ez = tz - a.pos.z;
          a.aimYaw = a.yaw = Math.atan2(ex, ez); a.aimPitch = Math.atan2(ty - (a.pos.y + 1.2), Math.max(0.3, Math.hypot(ex, ez)));
          a.aimPoint.set(tx, ty, tz);   // (the tether flies at the aim point; nothing else sets it here: the brains are off)
        }
        if (foe) { foe.invuln = 1; foe.hp = PLAYER.hp; foe.vel.set(0, 0, 0); idle(foe); }
        a.intent.move.set(0, 0, 0);
        if (close && dh > 2.5) a.intent.move.set(dx / dh, 0, dz / dh);
        a.intent.fire = fire(i); a.intent.sub = !!a.specialActive && sub(i); a.ink = PLAYER.inkMax; a.hp = PLAYER.hp;
        dbg.step(1000 / 60); frames++;
        if (kind === 'main' && frames >= minF) break;
        if (kind === 'special' && frames >= minF && !a.specialActive) { if (--tail <= 0) break; }
      }
    } catch (e) { err = String(e && e.message || e).slice(0, 160); }
    idle(a); if (a.specialActive) G.specials.end(a, 'test');
    const got = kind === 'main' ? sum.sp + sum.main : sum.sp, secs = frames / 60;
    return { counted: got, dps: got / secs, secs, main: sum.main, err };
  };
  const rows = [];
  const measure = (kind, id) => {
    const res = {};
    if (kind === 'main') for (const p of Object.keys(PATTERNS)) res[p] = run(kind, id, p, DIST[id] || 7, false);
    else {
      const close = CLOSE.has(id);
      for (const p of ['hold', 'cycle']) res[p] = run(kind, id, p, 7, close);
      res.walk = run(kind, id, 'cycle', 7, true);
      if (close) res.near = run(kind, id, 'hold', 2.5, true);   // (started by the shell: a Tidal Slam, a Cheer Orb, a Mega Stamp…)
    }
    const best = Object.entries(res).sort((x, y) => y[1].dps - x[1].dps)[0];
    const err = Object.values(res).map((r) => r.err).find(Boolean) || null;
    rows.push([kind, id, +best[1].dps.toFixed(1), best[0], +best[1].counted.toFixed(0), +best[1].secs.toFixed(1)]);
    return { best: best[0], dps: best[1].dps, total: best[1].counted, secs: best[1].secs, all: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, +v.dps.toFixed(1)])), err };
  };
  try {
    for (const id of WEAPON_ORDER) {
      if (only && !only.includes(id)) continue;
      const r = measure('main', id);
      R(`main ${id}: ${r.dps.toFixed(1)} /s into the shell (${r.best})`, !r.err && r.dps > 0, r);
    }
    for (const id of SPECIAL_ORDER) {
      if (only && !only.includes(id)) continue;
      const r = measure('special', id);
      const zero = NODMG.has(id);
      R(`special ${id}${SPECIALS[id]?.kind === 'barrage' ? ' (every bomb, × 0.5)' : ' (× 0.5)'}: ${r.dps.toFixed(1)} /s into the shell over ${r.secs.toFixed(1)} s, ${Math.round(r.total)} in all (${r.best})${zero ? ' — no damage by design' : ''}`, !r.err && (zero ? r.total === 0 : r.dps > 0), r);
    }
  } catch (e) { R('HARNESS: the test threw', false, { err: String(e && e.stack || e).slice(0, 600) }); }
  // the table, one line (the report's)
  R('the table (kind id dps pattern total secs)', true, rows.map((r) => r.join(' ')));
  return out;
})()
