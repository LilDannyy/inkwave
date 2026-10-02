// bow-paint (2026-10-02, the user: "the bow needs to cover ink a bit better. the ink falling onto the ground as the arrow
// goes needs to cover more, making it easier to cover the floor in an uninterrupted straight line … it shouldnt be a go
// to weapon but needs to be usable" — then, from Splatoon 3's Tri-Stringer: the three arrows fly parallel at full draw
// (0.4 m apart; 8° fans at a tap / ring 1), the falling spray is a few big stretched droplets per arrow, staggered across
// the three so a full draw lays one unbroken band, the landings ink wider; "do the mid air slow charge and ink delay").
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/bow-paint.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=shots,air,ink,damage,net' for a part ('shots' also prints the per-shot numbers as info)
// Staged on testbox (a flat deck, top y 0); everyone else parked far off, brains stubbed; hits logged, not dealt. The
// archer stands at (0, 0, −32) and looses level along +z. Checks:
//  - shots: per tier (tap 0.3 / ring 1 at 0.6 / full) the ink a volley lays on clean floor — trail alone, landing +
//    burst alone, all of it (the archer's turf credit, m²) — and the line: along the full draw's axis, from 1.5 m out to
//    where the centre arrow lands, inked ≥ 95 % with no gap over 0.5 m; its width (the inked run across the axis) in
//    range; it starts within 1.5 m of the archer; a ring-1 volley leaves its three arrows' own lines (each track inked);
//    the paint records a volley sends online under the cap (40);
//  - spread: full draw — the three arrows fly parallel 0.4 m apart (ground: side by side; air: one over another);
//    tap / ring 1 — 8° fans;
//  - air: a draw in the air runs at a third of the speed (ring 1 and full take 3× as long); landing mid-draw restores
//    the rate; standing on the tower's deck (Tower Command) draws at the full rate (testbox MODE=tower only);
//  - ink: after a bow shot the tank refills not at all for 0.33 s, in any form (swimming included), then at the normal
//    rate; a Spritzer swimming right after a shot refills at once;
//  - damage: a full-draw direct hit's numbers (as configured) and how many of the three arrows hit a foe 10 / 20 m off.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { WEAPONS, PLAYER } = await import('./src/config.js');
  const { MAIN_KITS } = await import('./src/game/kits/registry.js');
  const BOW = await import('./src/game/kits/bow.js');
  const G = window.__G, P = G.projectiles, S = G.subs;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => (ONLY ? ONLY.split(',').includes(k) : k !== 'tower');
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z), DOWN = V(0, -1, 0);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const DT = 1 / 60;
  let hook = null, after = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; if (after) after(); };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const ctl = new Map();   // per bot: { fire, squid } held each frame by the stubbed brain
  const stub = (a) => { if (a.bot) a.bot.update = () => { zero(a); const c = ctl.get(a); if (c) { a.intent.fire = !!c.fire; a.intent.squid = !!c.squid; } }; };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const tb = g.mapDef?.id === 'testbox';
  const parkAll = () => { if (tb) others.forEach((a, i) => put(a, V(-22 + (i % 4) * 2, 0, 30 + Math.floor(i / 4) * 2))); };
  const hits = [];
  P.applyHit = function (att, vic, dmg, wid) { hits.push({ t: G.time, att, vic, dmg: r2(dmg), wid }); };
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }   // (the FX droplets' own random ink: off)
  const W = WEAPONS.bow;
  const NEW = W.dropEvery !== undefined;   // (this file also measures the old bow, before 2026-10-02's change)
  // what-ifs: PAGE_ARGS='… tune=dropScale:0.6,burstPaint:1/1.2' sets those WEAPONS.bow values for this run
  const TUNE = (/tune=([\w.:,\/-]+)/.exec(window.__pageArgs || '') || [])[1];
  if (TUNE) for (const kv of TUNE.split(',')) { const [k, v] = kv.split(':'); if (k in W) W[k] = v.includes('/') ? v.split('/').map(Number) : +v; }
  const reset = () => {
    hook = null; after = null; ctl.clear();
    S.clear(); P.clear(); MAIN_KITS.bow?.clear?.(); G.paint.clear?.();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; stub(a);
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0;
    }
    parkAll(); if (tb) put(me, V(18, 0, -30), Math.PI);
    step(0.1);
    hits.length = 0;
  };
  const inkAt = (x, z, y = 1) => { const h = G.physics.raycast(V(x, y, z), DOWN, y + 2); return h && h.hit ? G.paint.sample(h.face, h.u, h.v) : -1; };

  // ---- one volley from the archer A at (0, 0, −32), level along +z, at charge c; parts: which paint is on
  const knobs = (on) => {
    const keep = NEW ? { dropMax: W.dropMax, landWidth: W.landWidth, landWidthFull: W.landWidthFull, burstPaint: W.burstPaint }
      : { trailEvery: W.trailEvery, trailSideEvery: W.trailSideEvery, paintStick: W.paintStick, paintTap: W.paintTap, burstPaint: W.burstPaint };
    if (!on.trail) { if (NEW) W.dropMax = 0; else W.trailEvery = W.trailSideEvery = 1e9; }
    if (!on.land) { if (NEW) W.landWidth = W.landWidthFull = 0; else W.paintStick = W.paintTap = 0; }
    if (!on.burst) W.burstPaint = [0, 0];
    return () => Object.assign(W, keep);
  };
  const volley = (A, c, on = { trail: 1, land: 1, burst: 1 }, air = false) => {
    S.clear(); P.clear(); MAIN_KITS.bow.clear();
    put(A, V(0, air ? 3 : 0, -32), 0); step(0.15);
    if (air) { A.grounded = false; }
    A.aimYaw = A.yaw = 0; A.aimPitch = 0; A.aimDir.set(0, 0, 1); A.aimPoint.set(A.pos.x, A.pos.y + 1.2, 80);   // (aim level, far off)
    G.paint.clear();
    const undo = knobs(on);
    let recs = 0; const sp0 = G.paint.splat; G.paint.splat = function (cc, r, t, o) { if (r > 0 && !o?.cosmetic) recs++; return sp0.call(this, cc, r, t, o); };
    const turf0 = A.stats.turf;
    const o = A.pos.clone();
    BOW.looseVolley(A, c);
    const arr = BOW.BOW_DEBUG.arrows.slice(-3);
    const start = arr.map((p) => p.pos.clone()), vel = arr.map((p) => p.vel.clone());
    const tracks = arr.map((p) => ({ center: p.center, pts: [p.pos.clone()], land: null }));
    after = () => arr.forEach((p, i) => { if (!BOW.BOW_DEBUG.arrows.includes(p) || tracks[i].done) { tracks[i].done = true; return; } if (p.st === 0 && !p.noHit) tracks[i].pts.push(p.pos.clone()); else if (p.st === 1 && !tracks[i].land) tracks[i].land = p.hitP.clone(); });
    step(2.0);
    after = null; G.paint.splat = sp0; undo();
    for (let i = 0; i < 30; i++) G.paint.flush(DT);
    return { o, start, vel, tracks, turf: A.stats.turf - turf0, recs };
  };
  // the ground track of arrow track tr from the archer o: inked share and the longest bare run from d0 to its end
  const team = me.team + 1;
  const along = (o, tr, d0, dEnd) => {
    const e = tr.land || tr.pts[tr.pts.length - 1];
    const L = Math.hypot(e.x - o.x, e.z - o.z), dx = (e.x - o.x) / L, dz = (e.z - o.z) / L;
    const end = dEnd ?? L;
    let on = 0, tot = 0, gap = 0, maxGap = 0, first = null;
    for (let d = 0; d <= end + 1e-6; d += 0.1) {
      const ink = inkAt(o.x + dx * d, o.z + dz * d) === team;
      if (ink && first === null) first = r2(d);
      if (d < d0) continue;
      tot++; if (ink) { on++; gap = 0; } else { gap += 0.1; maxGap = Math.max(maxGap, gap); }
    }
    return { L: r2(L), dx, dz, cover: r2(on / Math.max(1, tot)), maxGap: r2(maxGap), first };
  };
  // the band at d along the axis (o, dx, dz): the longest inked run across it within ±1.2 m of the axis (the band
  // wanders: the three arrows' droplets sit 0.4 m either side of it) — what a squid swims along
  const across = (o, dx, dz, d, w = 1.2) => {
    let best = 0, run = 0;
    for (let s = -w; s <= w + 1e-6; s += 0.05) {
      if (inkAt(o.x + dx * d - dz * s, o.z + dz * d + dx * s) === team) { run += 0.05; best = Math.max(best, run); } else run = 0;
    }
    return best;
  };
  const SQUID = 0.4;   // (a band narrower than a swimming squid at some point is a break in it)
  const lineStats = (v) => {
    // the axis: from the archer through the centre arrow's landing; every 0.1 m from 0 to there, the band's width
    const c = v.tracks.find((t) => t.center);
    const al = along(v.o, c, 1.5);
    const prof = [];
    for (let d = 0; d <= al.L + 1e-6; d += 0.1) prof.push(across(v.o, al.dx, al.dz, d));
    const from = (d0) => { let on = 0, tot = 0, gap = 0, maxGap = 0; prof.forEach((w, i) => { if (i * 0.1 < d0 - 1e-6) return; tot++; if (w >= SQUID) { on++; gap = 0; } else { gap += 0.1; maxGap = Math.max(maxGap, gap); } }); return { cover: on / Math.max(1, tot), maxGap }; };
    const b = from(1.5);
    const ws = prof.filter((w, i) => i * 0.1 >= 2 && i * 0.1 <= al.L - 1).map(r2).sort((x, y) => x - y);
    // the band's start: the nearest d from which it holds (≥ 95 % of the way, swimmable) to the landing
    let startD = null;
    for (let d = 0; d <= al.L; d += 0.25) { if (from(d).cover >= 0.95) { startD = r2(d); break; } }
    return { L: al.L, cover: r2(b.cover), maxGap: r2(b.maxGap), axisCover: al.cover, axisGap: al.maxGap, first: al.first, start: startD,
      widthMed: ws[ws.length >> 1] ?? 0, width10: ws[Math.floor(ws.length * 0.1)] ?? 0, widthMin: ws[0] ?? 0, widthMax: ws[ws.length - 1] ?? 0 };
  };
  const avg = (xs, k) => r2(xs.reduce((t, x) => t + x[k], 0) / xs.length);

  try {
    // ============================================================================================ per-shot ink
    if (want('shots')) {
      reset();
      const w0 = me.weaponId; me.setWeapon('bow'); step(0.4);
      volley(me, 1);   // (a first one warms what's made on first use)
      const tiers = [['tap', 0.3], ['ring', 0.6], ['full', 1]];
      const rep = {};
      for (const [name, c] of tiers) {
        const all = [], trail = [], lb = [], lines = [], tl = [], arrowsCover = [], landD = [];
        // (the line is read off the floor right after each volley: the next one starts on a clean floor)
        for (let i = 0; i < 3; i++) {
          const x = volley(me, c); all.push(x); lines.push(lineStats(x));
          arrowsCover.push(x.tracks.map((t) => along(x.o, t, 1.5).cover));
          landD.push(x.tracks.map((t) => (t.land ? r2(Math.hypot(t.land.x - x.o.x, t.land.z - x.o.z)) : null)));
          const y = volley(me, c, { trail: 1 }); trail.push(y); tl.push(lineStats(y));
          lb.push(volley(me, c, { land: 1, burst: 1 }));
        }
        const v = all[0];
        rep[name] = {
          c, total: avg(all, 'turf'), trail: avg(trail, 'turf'), landBurst: avg(lb, 'turf'), recs: Math.max(...all.map((x) => x.recs)),
          line: { cover: avg(lines, 'cover'), maxGap: Math.max(...lines.map((x) => x.maxGap)), axisCover: avg(lines, 'axisCover'), axisGap: Math.max(...lines.map((x) => x.axisGap)), start: avg(lines, 'start'), widthMed: avg(lines, 'widthMed'), width10: avg(lines, 'width10'), widthMin: Math.min(...lines.map((x) => x.widthMin)), widthMax: Math.max(...lines.map((x) => x.widthMax)), L: avg(lines, 'L') },
          trailLine: { cover: avg(tl, 'cover'), maxGap: Math.max(...tl.map((x) => x.maxGap)), start: avg(tl, 'start'), widthMed: avg(tl, 'widthMed'), width10: avg(tl, 'width10') },
          arrowsCover: arrowsCover[0], landD: landD[0],
          spread: v.start.map((p) => [r2(p.x - v.start[1].x), r2(p.y - v.start[1].y)]), dirs: v.vel.map((u) => r2(Math.atan2(u.x, u.z) * 180 / Math.PI)),
        };
      }
      R('per-shot ink (m² of turf, clean flat floor; line = along the full draw\'s axis from 1.5 m to the centre arrow\'s landing)', true, rep);
      const F = rep.full, Rg = rep.ring;
      R(`full draw: the band is unbroken — swimmable (≥ ${SQUID} m of ink across it) ${F.line.cover} of the way from 1.5 m to the landing (≥ 0.95), longest break ${F.line.maxGap} m (≤ 0.3)`,
        F.line.cover >= 0.95 && F.line.maxGap <= 0.3, F.line);
      R(`…it starts within 1.5 m of the archer (${F.line.start} m) and runs to where the arrow lands (${F.line.L} m)`, F.line.start !== null && F.line.start <= 1.5, { start: F.line.start, L: F.line.L, first: F.line.first });
      R(`…a band: its width (the longest inked run across it, every 0.1 m from 2 m out to 1 m short of the landing) ${F.line.widthMed} m at the median (1.0…1.8), ≥ 0.8 m at the 10th percentile (${F.line.width10})`,
        F.line.widthMed >= 1.0 && F.line.widthMed <= 1.8 && F.line.width10 >= 0.8, F.line);
      R(`ring 1: three lines in an 8° fan — each arrow's own track inked ≥ 55 % from 1.5 m to its landing (${Rg.arrowsCover.map(r2).join(' / ')}); a full draw inks more (${F.total} vs ${Rg.total} m²)`,
        Rg.arrowsCover.every((x) => x >= 0.55) && F.total > Rg.total, { cover: Rg.arrowsCover, dirs: Rg.dirs });
      R(`paint records per volley ≤ 40 (tap ${rep.tap.recs}, ring ${Rg.recs}, full ${F.recs}; each splat is one record online, + 1 for the volley itself)`,
        Math.max(rep.tap.recs, Rg.recs, F.recs) + 1 <= 40, { tap: rep.tap.recs, ring: Rg.recs, full: F.recs });
      // ---- spread: parallel at full draw (ground: side by side, 0.4 m; air: stacked), 8° fans otherwise
      const sp = (v) => ({ off: v.start.map((p) => [r2(p.x - v.start[1].x), r2(p.y - v.start[1].y), r2(p.z - v.start[1].z)]), deg: v.vel.map((u) => r2(Math.atan2(u.x, u.z) * 180 / Math.PI)), pitch: v.vel.map((u) => r2(Math.asin(u.y / u.length()) * 180 / Math.PI)) });
      const fg = sp(volley(me, 1)), rgr = sp(volley(me, 0.6)), tp = sp(volley(me, 0.3));
      const par = (s) => Math.max(...s.deg) - Math.min(...s.deg) < 0.05;
      const gap = (s, k) => Math.abs(Math.abs(s.off[0][k]) - 0.4) < 0.03 && Math.abs(Math.abs(s.off[2][k]) - 0.4) < 0.03 && Math.sign(s.off[0][k]) === -Math.sign(s.off[2][k]);
      R('spread on the ground: full draw — three parallel arrows 0.4 m apart side by side; ring 1 and tap — an 8° fan',
        par(fg) && gap(fg, 0) && Math.abs(rgr.deg[0] - rgr.deg[1]) > 7.9 && Math.abs(rgr.deg[0] - rgr.deg[1]) < 8.1 && Math.abs(tp.deg[2] - tp.deg[1]) > 7.9 && Math.abs(tp.deg[2] - tp.deg[1]) < 8.1, { full: fg, ring: rgr, tap: tp });
      reset(); me.setWeapon('bow'); step(0.3);
      const fa = sp(volley(me, 1, undefined, true)), ra = sp(volley(me, 0.6, undefined, true));
      R('spread in the air: full draw — three parallel arrows one over another 0.4 m apart; ring 1 — an upright 8° fan',
        par(fa) && Math.max(...fa.pitch) - Math.min(...fa.pitch) < 0.05 && gap(fa, 1) && Math.abs(Math.abs(ra.pitch[0] - ra.pitch[1]) - 8) < 0.15, { full: fa, ring: ra });
      if (w0) me.setWeapon(w0);
    }

    // ============================================================================================ mid-air draw
    // a bot kid (its trigger held by the stub) draws on the ground / held in the air (no gravity: pinned each frame)
    const drawTimes = (E, airFrom, airTo, pin) => {
      reset(); E.setWeapon('bow'); step(0.3);
      put(E, pin.clone(), 0);
      const t = { ring: null, full: null };
      let f = 0;
      hook = () => {
        const air = f >= airFrom && f < airTo;
        E.pos.set(pin.x, air ? pin.y + 2.5 : pin.y + 0.02, pin.z); E.vel.set(0, 0, 0);
      };
      ctl.set(E, { fire: true });
      step(4, (i) => {
        f = i + 1;
        const c = E.weaponRunner.charge;
        if (t.ring === null && c >= W.ring1) t.ring = r2((i + 1) / 60);
        if (t.full === null && c >= 0.999) { t.full = r2((i + 1) / 60); return false; }
      });
      hook = null; ctl.delete(E);
      return t;
    };
    if (want('air')) {
      const E = mates[0], pin = V(0, 0, -20);
      const gnd = drawTimes(E, 1e9, 1e9, pin), air = drawTimes(E, 0, 1e9, pin), mid = drawTimes(E, 15, 45, pin);   // (mid: 0.25 s on the ground, 0.5 s up, then down)
      const T = W.chargeTime;
      R(`mid-air draw: on the ground ring 1 / full at ${gnd.ring} / ${gnd.full} s; held in the air ${air.ring} / ${air.full} s (3× as long)`,
        Math.abs(gnd.full - T) < 0.05 && Math.abs(air.full - 3 * T) < 0.1 && Math.abs(air.ring - 3 * W.ring1 * T) < 0.08, { gnd, air });
      // 0.25 s on the ground (0.25 of the draw), 0.5 s up (+0.1667), then down: the rest at the full rate → 0.25 + 0.5 + (1 − 0.4167) T
      const expect = 0.25 + 0.5 + (1 - 0.25 / T - 0.5 / T / 3) * T;
      R(`…landing mid-draw restores the rate: 0.25 s down, 0.5 s up, then down — full at ${mid.full} s (expected ${r2(expect)})`, Math.abs(mid.full - expect) < 0.06, { mid, expect: r2(expect) });
    }
    if (want('tower') && m.tower) {
      // Tower Command: a kid riding the tower's deck draws at the full rate (the deck counts as ground)
      const E = mates[0], T = m.tower;
      reset(); E.setWeapon('bow'); step(0.3);
      const deck = T.pos ? T.pos.clone() : null;
      if (deck) {
        put(E, V(deck.x, T.top + 0.6, deck.z), 0);
        step(1.2);   // (drops onto the deck)
        ctl.set(E, { fire: true });
        let full = null, gr = 0, n = 0;
        step(3, (i) => { n++; if (E.grounded) gr++; if (E.weaponRunner.charge >= 0.999) { full = r2((i + 1) / 60); return false; } });
        ctl.delete(E);
        R(`on the tower's deck (riding it) the draw runs at the full rate: full at ${full} s (grounded ${gr}/${n} frames)`, full !== null && Math.abs(full - W.chargeTime) < 0.06 && Math.abs(E.pos.y - T.top) < 0.3, { full, grounded: gr, frames: n, at: [r2(E.pos.x), r2(E.pos.y), r2(E.pos.z)], top: r2(T.top), moving: T.moving, riders: T.riders });
      } else R('on the tower\'s deck the draw runs at the full rate', false, 'no tower position');
    }

    // ============================================================================================ ink delay
    if (want('ink')) {
      // fire, then swim at once in own ink: the tank's level over the next 0.6 s
      const swimAfterShot = (E, wid) => {
        reset(); E.setWeapon(wid); step(0.3);
        put(E, V(0, 0, -20), 0);
        G.paint.splat(V(0, 0.1, -20), 3, E.team, { instant: true }); for (let i = 0; i < 5; i++) G.paint.flush(DT);
        E.ink = 50;
        E.aimDir.set(0, 0, 1); E.aimPoint.set(0, 1.2, 0);
        ctl.set(E, { fire: true });
        let fired = null, ink0 = null; const lv = [];
        step(1.6, (i) => {
          if (fired === null && E.lastFire === 0 && E.ink < 50) { fired = i; ctl.set(E, { fire: false, squid: true }); ink0 = E.ink; }
          else if (fired === null && wid === 'bow' && E.weaponRunner.charge >= 0.5) ctl.set(E, { fire: false });
          if (fired !== null) { lv.push({ t: r2((i - fired) / 60), ink: r2(E.ink), sub: !!E.submerged }); if (i - fired > 40) return false; }
        });
        ctl.delete(E);
        return { ink0: ink0 === null ? null : r2(ink0), lv };
      };
      const E = mates[0];
      const b = swimAfterShot(E, 'bow');
      const at = (x, t) => (x.lv.find((p) => p.t >= t - 1e-6) || {}).ink;
      const subAt = (x, t) => (x.lv.find((p) => p.t >= t - 1e-6) || {}).sub;
      R(`ink delay: swimming right after a bow shot, the tank stays at ${b.ink0} for 0.33 s (0.3 s: ${at(b, 0.3)}; submerged ${subAt(b, 0.3)}), then refills (0.6 s: ${at(b, 0.6)})`,
        b.ink0 !== null && Math.abs(at(b, 0.3) - b.ink0) < 0.01 && subAt(b, 0.3) && at(b, 0.6) > b.ink0 + 5, { ink0: b.ink0, t03: at(b, 0.3), t045: at(b, 0.45), t06: at(b, 0.6), sub: subAt(b, 0.3) });
      const s = swimAfterShot(E, 'shooter');
      R(`…a Spritzer swimming right after a shot refills at once (0.3 s: ${s.ink0} → ${at(s, 0.3)})`, s.ink0 !== null && at(s, 0.3) > s.ink0 + 3, { ink0: s.ink0, t03: at(s, 0.3), sub: subAt(s, 0.3), cfg: { bow: W.inkRecoveryDelay, shooter: WEAPONS.shooter.inkRecoveryDelay ?? 0 } });
    }

    // ============================================================================================ damage
    if (want('damage')) {
      reset();
      const w0 = me.weaponId; me.setWeapon('bow'); step(0.4);
      const shot = (dz, side, c = 1) => {
        reset(); me.setWeapon('bow'); step(0.1);
        put(me, V(0, 0, -32), 0); put(foes[0], V(side, 0, -32 + dz), Math.PI); step(0.15);
        me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.aimDir.set(0, 0, 1); me.aimPoint.set(0, 1.0, -32 + dz);
        hits.length = 0; BOW.looseVolley(me, c); step(0.5);
        return hits.filter((h) => h.vic === foes[0] && h.wid === 'bow').map((h) => h.dmg);
      };
      const res = { d10: shot(10, 0), d20: shot(20, 0), d10off: shot(10, 0.3), d20off: shot(20, 0.3), ring10: shot(10, 0, 0.6) };
      const sum = (a) => a.reduce((t, x) => t + x, 0);
      R(`full-draw direct hits: dead centre on a foe 10 / 20 m off all three arrows hit (${sum(res.d10)} / ${sum(res.d20)}: a splat); 0.3 m off, two (${sum(res.d10off)} / ${sum(res.d20off)}: the burst has to finish) — damageFull ${W.damageFull}, sideFull ${W.sideFull}`,
        res.d10.length === 3 && res.d20.length === 3 && sum(res.d10) >= 100 && sum(res.d20) >= 100 && res.d10off.length === 2 && res.d20off.length === 2 && sum(res.d10off) < 100, res);
      if (w0) me.setWeapon(w0);
    }
  } catch (e) {
    R('harness error: ' + e.message, false, String(e.stack).slice(0, 600));
  }
  return out;
})()
