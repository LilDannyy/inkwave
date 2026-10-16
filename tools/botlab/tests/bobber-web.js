// [b5-subs] Chain Bobber: the web arm (tools/botlab/jobs/batch5/subs/SPEC.md C11, "what a human's big web does"). Bots
// stop at a 4-chain, so the bot A/B never meets the 12- and 24-bobber webs a human can lay inside the 30 s life ("as many as
// you like": up to 24 a player). This measures them, for the lead's consolidated balance pass and Open question 25.
//   MAP=halyard MODE=zones PAGE=tools/botlab/tests/bobber-web.js tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=treehills MODE=zones …                                    (the SPEC's two stages)
//   PAGE_ARGS='n=12,24 layout=lane,zone variant=trigger,clear reps=10'   (the defaults; 160 webs over both stages)
//   PAGE_ARGS='n=12 layout=lane variant=trigger reps=1'                  (a smoke run: one web)
// The set-up, per web:
//   teams    the scripted local player (it lays and, in 'trigger', shoots the web; invulnerable, out of the fight, standing on
//            its own side of the zone) with 3 bots of its team whose bobber trigger (botAct) is off — only the script sets
//            the web off; their own fire still can, by accident, and that is counted — against 4 enemy bots at normal.
//            Everyone starts each web from their spawn; the zone neither swaps nor knocks out meanwhile.
//   laying   N bobbers (12 or 24), one every 1.2 s (about what swimming refills: 40 ink a link, 42 ink/s in your ink), on
//            one of two layouts of the active zone —
//              lane: every 4.5 m along the nav path from the zone's edge toward the enemy side (further rows 2.6 m either
//                    side of it once the path runs out short of their pad);
//              zone: a 4.5 m grid over the zone (and on round it, nearest first, when the zone holds fewer than N).
//   variant  trigger: the script shoots the web (its bobber nearest the foes) the first moment 2 enemy bots stand within
//                     R(N) of a live bobber of it, or at 30 s;
//            clear:   it never does; the web runs until it's gone (disarmed or expired).
// Measured, per web (one line each) and per cell (stage × N × layout × variant):
//   - the lethal area of a trigger: the union of the lethal cores (where a blast does ≥ 100 to a full-health kid) of every
//     bobber that blew, on a 0.25 m grid;
//   - enemy deaths to the web, and splats per 100 ink spent laying it;
//   - the share of the web disarmed before the trigger, for webs an enemy bot saw for ≥ 3 s ("saw": within its awareness,
//     in front of it, a clear line to a bobber of the web);
//   - clear: the time from the first enemy sight of a bobber to the whole web disarmed (null when some of it expired
//     first), the share disarmed, and the ink the clearers spent on it (a floor: the ink of their shots that landed on it);
//   - who set it off (the script / a teammate's stray shot / a blast).
// The SPEC's targets (reported, not asserted until a cell has ≥ 5 webs): a 24-web's splats per 100 ink no better than the
// Splat Bomb's (the C11 A/B's 'all=bomb' arm — the lead's consolidated pass); enemy bots disarm ≥ 50 % of a seen web
// before it is set off.
(async () => {
  const g = window.__inkwave, m = g.match, THREE = await import('three');
  const { SUBS, WEAPONS, ZONES } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { zonePlan } = await import('./src/game/bots.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, S = G.subs, P = G.projectiles, K = SUB_KITS.bobber, B = SUBS.bobber;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const arg = (k, d) => (new RegExp(k + '=([\\w,.]+)').exec(window.__pageArgs || '') || [])[1] || d;
  const NS = arg('n', '12,24').split(',').map(Number), LAYOUTS = arg('layout', 'lane,zone').split(','), VARIANTS = arg('variant', 'trigger,clear').split(','), REPS = +arg('reps', '10');
  // ([b5-int3] 'trace=1': a stray's note carries the bot's last 1.5 s as botAct saw it — its intent, weapon, aim)
  if (arg('trace', '0') === '1') { const BB = await import('./src/game/kits/bobber-bots.js'); BB.BOBBER_BOT.traceOn = true; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (x) => Math.round(x * 100) / 100;
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  g.debug.freeze();
  const me = m.local, mates = m.actors.filter((a) => a !== me && a.team === me.team), foes = m.actors.filter((a) => a.team !== me.team);
  const Z = m.zones, STAGE = g.mapDef?.id || '?';
  if (!Z) { R('harness: needs MODE=zones', false); return out; }
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  me.bot && (me.bot.update = () => zero(me));
  for (const a of mates) if (a.bot) { a.bot.noBobberTrigger = true; a.bot.setDifficulty('normal'); }
  for (const a of foes) if (a.bot) a.bot.setDifficulty('normal');
  me.setSub('bobber');
  m.duration = 99999; m.time = 99999;
  const keep = () => { Z.count[0] = Z.count[1] = ZONES.count; Z.penalty[0] = Z.penalty[1] = 0; if (Number.isFinite(Z.nextSwap)) Z.nextSwap = Math.max(Z.nextSwap, 120); m.time = 99999; };
  // ---- the zone, and the two layouts
  void zonePlan();
  const zp = zonePlan(), zone = Z.active.zones[0], zi = zone.id, I = zp.info[zi], c = zone.center, L = G.level, nav = G.nav;
  const foePad = L.spawnPads[1 - me.team], myPad = L.spawnPads[me.team];
  const sz = { x: 0, y: 0, z: 0, refused: false };
  const ok = (x, y0, z, list) => {
    const gy = L.groundHeight(x, z, y0 + 3);
    if (!Number.isFinite(gy) || Math.abs(gy - y0) > 3.2) return null;
    K.spotFor(x, gy, z, 0, 1, 0, 'floor', -1, me.team, sz);
    if (sz.refused || sz.base > gy + 0.05) return null;
    if (list.some((q) => Math.hypot(q.x - x, q.z - z) < 2.5)) return null;
    return V(x, gy, z);
  };
  const lane = (N) => {
    const s0 = nav.nearest(V(c[0], c[1], c[2]), 1.5), g0 = nav.nearest(foePad, 1.5);
    const path = s0 >= 0 && g0 >= 0 ? nav.path(s0, g0, 1 - me.team) : null;
    if (!path) return [];
    const pts = path.map((id) => nav.nodes[id]);
    const stopR = (L.spawnBarrier ?? 4.2) + B.padNoDeploy + 1;
    // points every 4.5 m from the zone's edge, with the path's direction there
    const marks = [];
    let acc = 0, next = 0, started = false;
    for (let i = 1; i < pts.length; i++) {
      const A = pts[i - 1], Bp = pts[i], seg = Math.hypot(Bp.x - A.x, Bp.z - A.z);
      if (seg < 1e-6) continue;
      for (let u = 0; u <= seg; u += 0.25) {
        const x = A.x + ((Bp.x - A.x) * u) / seg, z = A.z + ((Bp.z - A.z) * u) / seg, y = A.y + ((Bp.y - A.y) * u) / seg;
        if (!started) { if (Math.hypot(x - c[0], z - c[2]) >= I.R) { started = true; acc = 0; next = 0; } else continue; }
        if (Math.hypot(x - foePad.x, z - foePad.z) < stopR) { i = pts.length; break; }
        if (acc >= next) { marks.push({ x, y, z, dx: (Bp.x - A.x) / seg, dz: (Bp.z - A.z) / seg }); next += 4.5; }
        acc += 0.25;
      }
    }
    const list = [];
    for (const off of [0, 2.6, -2.6, 5.2, -5.2, 7.8, -7.8]) {
      for (const q of marks) { if (list.length >= N) break; const p = ok(q.x - q.dz * off, q.y, q.z + q.dx * off, list); if (p) list.push(p); }
      if (list.length >= N) break;
    }
    return list;
  };
  const grid = (N) => {
    const cand = [];
    for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) {
      const x = c[0] + i * 4.5, z = c[2] + j * 4.5;
      cand.push({ x, z, d: Math.hypot(i, j) });
    }
    cand.sort((p, q) => p.d - q.d);
    const list = [];
    for (const q of cand) { if (list.length >= N) break; const p = ok(q.x, c[1], q.z, list); if (p) list.push(p); }
    return list;
  };
  // where the script stands: its team's staging spot by the zone (out of the fight, its own side)
  const st = I.stage?.[me.team] || { x: (c[0] + myPad.x) / 2, y: c[1], z: (c[2] + myPad.z) / 2 };
  // ---- what happens, from the events
  const evs = [];
  // ([b5-int3] every trigger: was a foe in that chain's reach — R(N) of a bobber of it, ±1.6 m in height — as it went? a
  // teammate setting off the web with nobody in it is the review's bug; one setting it off on a foe is the web working)
  // (in its reach as the bots' own hold judges it — bobber-bots.js foeInNow: within R(N) of a bobber, ±1.8 m in height)
  const foeInAt = (e) => { const R0 = K.sizeOf(e.n).R, L = K.items.filter((o) => o.state === 'blow' && o.blast && Math.abs(o.blast.t0 - G.time) < 1e-6 && o.team === e.team); return foes.some((f) => f.alive && L.some((o) => Math.hypot(f.pos.x - o.spot.x, f.pos.z - o.spot.z) < R0 && Math.abs(f.pos.y + 0.7 - o.spot.y) < 1.8)); };
  // (how it went: the BOBBER_STATS.via key the trigger just counted — 'chain:…' is another chain's blast, a chain reaction)
  let via0 = {};
  const viaOf = () => { const V = K.BOBBER_STATS.via || {}; let k = null; for (const x in V) if ((V[x] || 0) > (via0[x] || 0)) k = x; via0 = { ...V }; return k; };
  let strayN = 0;
  const strayOf = () => { const L = K.BOBBER_STATS.strays; const x = L.length > strayN ? L[L.length - 1] : null; strayN = L.length; return x; };
  const offs = ['bomb:explode', 'bobber:trigger', 'bobber:disarm', 'hit', 'device:hit', 'sub:end'].map((n) => on(n, (e) => evs.push({ t: G.time, n, e, foeIn: n === 'bobber:trigger' ? foeInAt(e) : undefined, stray: n === 'bobber:trigger' ? strayOf() : undefined, via: n === 'bobber:trigger' ? viaOf() : undefined })));
  // the lethal core of a blast of radius R (the chain's size by its R): ≥ 100 to a full-health kid
  const coreOf = (Rb) => { let n = 1; for (let k = 1; k <= 8; k++) if (Math.abs(K.sizeOf(k).R - Rb) < 1e-6) n = k; const s = K.sizeOf(n); if (s.dmax < 100) return 0; const kk = Math.sqrt((100 - s.dmin) / (s.dmax - s.dmin)); return 0.8 + (1 - kk) * (s.R - 0.8); };
  const unionArea = (blasts) => {
    if (!blasts.length) return 0;
    const cs = blasts.map((b) => ({ x: b.x, z: b.z, r: coreOf(b.R) })).filter((b) => b.r > 0);
    if (!cs.length) return 0;
    const x0 = Math.min(...cs.map((b) => b.x - b.r)), x1 = Math.max(...cs.map((b) => b.x + b.r)), z0 = Math.min(...cs.map((b) => b.z - b.r)), z1 = Math.max(...cs.map((b) => b.z + b.r));
    let n = 0;
    for (let x = x0 + 0.125; x < x1; x += 0.25) for (let z = z0 + 0.125; z < z1; z += 0.25) if (cs.some((b) => (b.x - x) ** 2 + (b.z - z) ** 2 <= b.r * b.r)) n++;
    return n * 0.0625;
  };
  const inkPer = (a) => { const w = a?.weapon || {}; return w.inkPerShot ?? WEAPONS[w.id]?.inkPerShot ?? 1; };
  // one web
  const web = (N, layout, variant) => {
    S.clear(); P.clear(); G.paint.clear?.(); K.resetBobberStats(); strayN = 0;   // ([b5-int3] strayN: the strays list starts again with the stats)
    for (const a of m.actors) { a.respawn(); a.ink = 100; }
    me.pos.set(st.x, st.y + 0.05, st.z); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = Math.atan2(c[0] - st.x, c[2] - st.z);
    const spots = layout === 'lane' ? lane(N) : grid(N);
    const e0 = evs.length, t0 = G.time, laid = [];
    let li = 0, layT = 0, trigT = null, trigBy = null, firstSeen = null, seenT = 0, lookT = 0, done = false, trigN = 0;
    hook = () => {
      keep(); me.invuln = 1; me.hp = 100; zero(me);
      me.pos.set(st.x, st.y + 0.05, st.z);
      if (!me.alive) me.respawn();
    };
    const mine = () => K.items.filter((x) => x.owner === me && !x.ghost);
    const liveMine = () => mine().filter((x) => x.state === 'live');
    step(70, () => {
      const t = G.time - t0;
      // lay one every 1.2 s (not after the trigger)
      if (li < spots.length && trigT == null && t >= layT) { const p = spots[li++]; laid.push(K.throwFrom(me, V(p.x, p.y + 0.6, p.z), V(0, -3, 0))); layT += 1.2; }
      const lv = liveMine();
      // enemy sight of the web (every 0.2 s): within awareness, in front, a clear line to one of its 4 nearest bobbers
      if ((lookT -= DT) <= 0 && lv.length) {
        lookT = 0.2;
        let seen = false;
        for (const e of foes) {
          if (!e.alive || !e.bot) continue;
          const aw = e.bot.diff?.awareness ?? 21, eye = V(e.pos.x, e.pos.y + 1.3, e.pos.z);
          const near4 = lv.map((o) => ({ o, d: o.spot.distanceTo(eye) })).filter((q) => q.d <= aw).sort((p, q) => p.d - q.d).slice(0, 4);
          for (const { o } of near4) {
            const yaw = Math.atan2(o.spot.x - eye.x, o.spot.z - eye.z), dy = Math.abs(Math.atan2(Math.sin(yaw - e.bot.aimYaw), Math.cos(yaw - e.bot.aimYaw)));
            if (dy < 1.2 && G.physics.los(eye, o.spot)) { seen = true; break; }
          }
          if (seen) break;
        }
        if (seen) { if (firstSeen == null) firstSeen = t; if (trigT == null) seenT += 0.2; }
      }
      // trigger: 2 enemy bots within R(N) of a live bobber of it, or 30 s
      if (variant === 'trigger' && trigT == null && lv.length) {
        const inR = foes.filter((e) => e.alive && lv.some((o) => Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z) < K.sizeOf(o.chain?.n || 1).R && Math.abs(e.pos.y + 0.7 - o.spot.y) < 1.6));
        if (inR.length >= 2 || t >= 30) {
          const cx = inR.length ? inR.reduce((s, e) => s + e.pos.x, 0) / inR.length : lv[0].spot.x, cz = inR.length ? inR.reduce((s, e) => s + e.pos.z, 0) / inR.length : lv[0].spot.z;
          const b = lv.slice().sort((p, q) => Math.hypot(p.spot.x - cx, p.spot.z - cz) - Math.hypot(q.spot.x - cx, q.spot.z - cz))[0];
          trigT = t; trigBy = inR.length >= 2 ? 'foes' : 'time'; trigN = b.chain?.n || 1;
          K.trigger(b, me, 'shot');
        }
      }
      // the end: after a trigger, 1.5 s for the hops and any chain reactions; in 'clear', once nothing of it is left
      if (trigT != null && t >= trigT + 1.5) { done = true; return false; }
      if (variant === 'clear' && li >= spots.length && !mine().some((x) => x.state !== 'dead')) { done = true; return false; }
      if (variant === 'trigger' && li >= spots.length && trigT == null && !mine().some((x) => x.state !== 'dead')) { done = true; return false; }
    });
    hook = null;
    const E = evs.slice(e0), rel = (x) => r2(x.t - t0);
    const blasts = E.filter((x) => x.n === 'bomb:explode' && x.e.kind === 'bobber' && x.e.team === me.team).map((x) => ({ x: x.e.pos.x, z: x.e.pos.z, R: x.e.radius, t: x.t }));
    const trig = E.filter((x) => x.n === 'bobber:trigger' && x.e.team === me.team);
    const firstTrig = trig[0];
    const deaths = E.filter((x) => x.n === 'hit' && x.e.weaponId === 'bobber' && x.e.killed && x.e.victim?.team !== me.team).length;
    const tCut = firstTrig ? firstTrig.t : Infinity;
    const disarms = E.filter((x) => x.n === 'bobber:disarm' && x.e.owner === me);
    const disBefore = disarms.filter((x) => x.t < tCut).length;
    const laidN = laid.filter((x) => x.state !== 'fly' || x.born).length, layN = laid.length;
    const expired = E.filter((x) => x.n === 'sub:end' && x.e.kind === 'bobber' && x.e.why === 'expired' && x.e.team === me.team).length;
    const devHits = E.filter((x) => x.n === 'device:hit' && x.e.kind === 'bobber' && x.e.team === me.team && x.e.attacker && x.e.attacker.team !== me.team);
    const clearInk = devHits.reduce((s, x) => s + inkPer(x.e.attacker), 0);
    const by = firstTrig ? (firstTrig.e.by === me ? 'script' : firstTrig.e.by?.team === me.team ? (firstTrig.foeIn ? 'mate on a foe' : 'mate') : 'blast/other') : null;
    // ([b5-int3] every chain of the web a teammate set off with no foe in its reach — not only the first)
    // (a chain reaction — 'chain:…', another of its chains' blast — is the first chain's doing, not a decision: listed apart)
    // ([b5-int3] not a teammate's stray: a web the script laid into that teammate's standing fire already there — a Vortex
    // Strike's vortex, an Ink Tempest's cloud, a Howl Box's beam, set off by it within 0.5 s of floating: 'sweep' at age < 0.5)
    const laidInto = (x) => String(x.via).startsWith('sweep:') && x.stray && x.stray.age != null && x.stray.age < 0.5;
    const mateIdle = trig.filter((x) => x.e.by && x.e.by !== me && x.e.by.team === me.team && !x.foeIn && !String(x.via).startsWith('chain:') && !laidInto(x)).map((x) => ({ t: rel(x), by: x.e.by.name, w: x.e.by.weapon?.kind, sub: x.e.by.sub?.kind, n: x.e.n, via: x.via, stray: x.stray }));
    const reactions = trig.filter((x) => String(x.via).startsWith('chain:')).length;
    const lastDis = disarms.length ? disarms[disarms.length - 1].t : null;
    const cleared = variant === 'clear' && !trig.length && expired === 0 && disarms.length === layN && layN > 0;
    return {
      N, layout, variant, laid: layN, settledN: laidN, firstSeen: firstSeen != null ? r2(firstSeen) : null, seenS: r2(seenT),
      trig: firstTrig ? { t: rel(firstTrig), why: trigBy, by, n: firstTrig.e.n, chains: trig.length } : null,
      blasts: blasts.length, lethalM2: r2(unionArea(blasts.filter((b) => b.t <= tCut + 1.6))), deaths,
      splatsPer100Ink: layN ? r2((deaths * 100) / (layN * B.inkCost)) : 0,
      disarmedBefore: disBefore, disarmedShare: layN ? r2(disBefore / layN) : 0, expired,
      clearS: cleared && firstSeen != null ? r2(lastDis - t0 - firstSeen) : null, clearInkFloor: r2(clearInk), clearHits: devHits.length, done, mateIdle, reactions,
    };
  };
  const cells = [];
  try {
    for (const variant of VARIANTS) for (const layout of LAYOUTS) for (const N of NS) {
      const runs = [];
      for (let k = 0; k < REPS; k++) {
        const w = web(N, layout, variant);
        runs.push(w);
        R(`web ${STAGE} N ${N} ${layout} ${variant} #${k + 1}: laid ${w.laid}, ${w.trig ? `set off at ${w.trig.t} s (${w.trig.why}, by ${w.trig.by}, N ${w.trig.n})` : 'never set off'} — lethal ${w.lethalM2} m², ${w.deaths} splats (${w.splatsPer100Ink} per 100 ink), ${w.disarmedBefore} disarmed first (seen ${w.seenS} s)${variant === 'clear' ? `, cleared in ${w.clearS ?? '—'} s` : ''}`,
          w.laid >= Math.min(N, 6) && w.done, w);
      }
      const mean = (f) => { const v = runs.map(f).filter((x) => x != null && Number.isFinite(x)); return v.length ? r2(v.reduce((s, x) => s + x, 0) / v.length) : null; };
      const seen = runs.filter((w) => w.seenS >= 3);
      const cell = { stage: STAGE, N, layout, variant, webs: runs.length, laid: mean((w) => w.laid), lethalM2: mean((w) => (w.trig ? w.lethalM2 : null)), deaths: mean((w) => w.deaths),
        splatsPer100Ink: mean((w) => w.splatsPer100Ink), disarmedShareSeen: seen.length ? r2(seen.reduce((s, w) => s + w.disarmedShare, 0) / seen.length) : null, seenWebs: seen.length,
        clearS: mean((w) => w.clearS), cleared: runs.filter((w) => w.clearS != null).length, clearInkFloor: mean((w) => w.clearInkFloor),
        setOffBy: runs.reduce((o, w) => { if (w.trig) o[w.trig.by] = (o[w.trig.by] || 0) + 1; return o; }, {}) };
      cells.push(cell);
      // [b5-int3] the clear variant (nobody sets the web off on purpose): no chain of it set off by a teammate with no foe in
      // its reach — bots hold their shots, their sub throws (every kind), their kit weapons' charges and leaps by an idle web
      if (variant === 'clear') { const mi = runs.flatMap((w) => w.mateIdle); R(`clear ${STAGE} N ${N} ${layout}: no chain of ${runs.length} webs set off by a teammate with no foe in its reach (${mi.length})`, mi.length === 0, mi); }
      R(`cell ${cell.stage} N ${N} ${layout} ${variant}: ${runs.length} webs — lethal ${cell.lethalM2} m² a trigger, ${cell.deaths} splats a web (${cell.splatsPer100Ink} per 100 ink), ${cell.disarmedShareSeen ?? '—'} of a seen web disarmed first (${cell.seenWebs} seen)${variant === 'clear' ? `, cleared ${cell.cleared} of ${runs.length} in ${cell.clearS ?? '—'} s` : ''}`, true, cell);
      // the SPEC's targets, once a cell has enough webs to say (the 24-web's splats per 100 ink against the Splat Bomb's
      // is the lead's comparison: the 'all=bomb' arm of the consolidated balance pass)
      if (runs.length >= 5 && cell.seenWebs >= 3) R(`target (C11): enemy bots disarm ≥ 50 % of a seen web before it is set off — ${cell.stage} N ${N} ${layout} ${variant}: ${cell.disarmedShareSeen}`, cell.disarmedShareSeen >= 0.5, cell);
    }
    R('SUMMARY bobber-web ' + JSON.stringify(cells), true);
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 1200)); }
  for (const f of offs) f();
  return out;
})();
