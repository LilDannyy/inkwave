// [b5-sub-dash] The Dash Pellet (src/game/kits/dash.js; tools/botlab/jobs/batch5/subs/SPEC.md §D, DECISIONS.md 19), every
// rule of the spec's D10 but the stage audit (dash-reach.js) and the online one (net-sub-dash.cjs):
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-dash.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
// PAGE_ARGS: a comma list of sections to run (default all): press, dir, height, limits, blast, walls, edges, hud, brolly, bots,
// reach ([b5-int3] the stage audit's finds: never out through a slab's top; a roof slide's way off)
// Movement checks step the dasher alone through actor.update (any dt: 1/60, 1/30, 1/24); the blast's streak, the HUD and
// the bots run whole frames (the debug stepper). Fails without the kit (the scaffold's stub refuses every press).
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = window.__G;
  const THREE = await import('three');
  const { SUBS, SPECIALS, PLAYER } = await import('./src/config.js');
  const { SUB_KITS, MAIN_KITS } = await import('./src/game/kits/registry.js');
  const { on } = await import('./src/core/ctx.js');
  const { PlayerController } = await import('./src/game/player.js');
  const DK = await import('./src/game/kits/dash.js');
  const { THREAT_STATS, BotBrain } = await import('./src/game/bots.js');
  const { MITTS } = await import('./src/game/kits/mitts.js');
  const { DEPTH } = await import('./src/game/kits/brolly-model.js');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const want = new Set((window.__pageArgs || '').split(',').filter(Boolean)), run = (k) => !want.size || want.has(k);
  const D = SUBS.dash, K = SUB_KITS.dash, L = G.level, P = G.projectiles;
  const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
  R('the kit is built (not the scaffold\'s stub): an onPress sub with lockMain, blockActor, botAct, a ghost', K && !K.stub && K.onPress && K.lockMain && K.blockActor && K.botAct && K.ghost, { stub: !!K?.stub });
  // ---- events
  const ev = [];
  const offs = ['sub:cantuse', 'sub:dash', 'bomb:explode', 'lowink', 'hit', 'weapon:fire', 'actor:jump', 'weapon:dodge', 'actor:dodge'].map((n) => on(n, (e) => ev.push({ n, e, t: G.time })));
  const since = (i, n, f = () => true) => ev.slice(i).filter((x) => x.n === n && f(x.e));
  // ---- every brain scripted: want.get(a) → its intent each frame (whole frames); sim() steps one actor alone
  const W = new Map();
  const setIt = (a, w) => { const it = a.intent; it.move.set(w.move ? w.move[0] : 0, 0, w.move ? w.move[1] : 0); it.fire = !!w.fire; it.sub = !!w.sub; it.jump = !!w.jump; it.squid = !!w.squid; it.special = false; };
  const stub = (a) => { a.bot.update = () => setIt(a, W.get(a) || {}); };
  for (const a of m.actors) if (a.bot) stub(a);
  dbg.freeze();
  const step = (n = 1) => { for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const sim = (a, n, dt = 1 / 60, w = null, each = null) => {
    for (let i = 0; i < n; i++) {
      const ww = typeof w === 'function' ? w(i) : w;
      if (ww) setIt(a, ww);
      G.time += dt;
      a.update(dt);
      if (each && each(i) === false) return i + 1;
    }
    return n;
  };
  const home = () => m.actors.forEach((o, i) => { if (o !== me) { o.spawnAt(V(-24 + i * 2.5, 0.02, 34), 0); o.invuln = 0; W.delete(o); } });
  const put = (a, x, y, z, yaw = 0) => { a.spawnAt(V(x, y, z), yaw); a.aimYaw = a.yaw = yaw; a.aimPitch = 0; a.invuln = 0; a.vel.set(0, 0, 0); a.form = 'kid'; sim(a, 2, 1 / 60, {}); };
  const hv = (a) => Math.hypot(a.vel.x, a.vel.z);
  const blocks = [];
  const box = (cx, cy, cz, hx, hy, hz, yaw = 0, flags = {}) => { const b = L.addDynamic({ tag: 'test:dash', ...flags }); L.moveDynamic(b, V(cx, cy, cz), V(hx, hy, hz), yaw); b.dp.set(0, 0, 0); blocks.push(b); return b; };
  const unbox = () => { for (const b of blocks) { b.solid = false; L.moveDynamic(b, V(1e4, -500, 1e4), V(0.1, 0.1, 0.1), 0); } blocks.length = 0; };
  const subs0 = new Map(m.actors.map((a) => [a, [a.subId, a.weaponId]]));
  const wr = me.weaponRunner;
  home();
  me.setSub('dash'); me.setWeapon('shooter');
  // (the press: tap = press one frame, let go the next)
  const tap = (a = me, extra = {}) => (i) => (i === 0 ? { ...extra, sub: true } : { ...extra });
  try {
    // ================================================================================== the tip (first: the first frames with the dash equipped this match)
    if (run('hud') && g.hud) {
      put(me, 0, 0, -6, 0); W.set(me, {});
      step(3);
      const t1 = g.hud.promptEl.textContent, on1 = !g.hud.promptEl.classList.contains('is-out');
      step(310);
      const t2 = g.hud.promptEl.textContent, on2 = !g.hud.promptEl.classList.contains('is-out');
      R('the tip, the first time it\'s equipped in a match: "Tap RMB or E to dash where you\'re steering, on the ground or in the air" (RB on a pad), gone after 5 s',
        on1 && /^Tap (RMB or E|RB) to dash where you're steering, on the ground or in the air$/.test(t1) && !(on2 && /to dash where/.test(t2)), { first: t1, on1, after5s: on2 ? t2 : '(none)' });
    }
    // ================================================================================== 1. the press
    if (run('press')) {
      put(me, 0, 0, -6, 0);
      const e0 = ev.length, p0 = me.pos.clone(), ink0 = me.ink;
      sim(me, 1, 1 / 60, { sub: true });
      const boom = since(e0, 'bomb:explode', (e) => e.kind === 'dash');
      const moved = Math.hypot(me.pos.x - p0.x, me.pos.z - p0.z);
      R('on the press frame: the ink is −55, the blast is at the take-off point (bomb:explode, radius 2.2) and the motion starts the same frame',
        Math.abs(me.ink - (ink0 - 55)) < 0.01 && boom.length === 1 && boom[0].e.radius === 2.2 && boom[0].e.pos.distanceTo(p0) < 0.01 && moved > 0.3 && wr.dashT > 0,
        { ink: [r2(ink0), r2(me.ink)], booms: boom.length, at: boom[0] && boom[0].e.pos.distanceTo(p0), moved: r3(moved), dashT: r3(wr.dashT) });
      // held 2 s with the tank kept full: exactly one dash, no "Can't use"; a release does nothing more
      sim(me, 119, 1 / 60, (i) => { me.ink = 100; return { sub: true }; });
      sim(me, 30, 1 / 60, {});
      const d1 = since(e0, 'sub:dash', (e) => e.actor === me).length, c1 = since(e0, 'sub:cantuse', (e) => e.actor === me).length;
      R('holding the button for 2 s with 100 ink gives exactly one dash and no "Can\'t use"; the release does nothing more', d1 === 1 && c1 === 0, { dashes: d1, cantuse: c1 });
      // a press during the dash: exactly one "Can't use" ("Already dashing")
      put(me, 0, 0, -6, 0);
      const e1 = ev.length;
      sim(me, 2, 1 / 60, (i) => ({ sub: i === 0 }));
      sim(me, 30, 1 / 60, (i) => { me.ink = 100; return { sub: i < 25 }; });
      const c2 = since(e1, 'sub:cantuse', (e) => e.actor === me), d2 = since(e1, 'sub:dash', (e) => e.actor === me).length;
      R('a press during the dash gives exactly one "Can\'t use" (reason "Already dashing")', d2 === 1 && c2.length === 1 && c2[0].e.reason === 'Already dashing', { dashes: d2, cantuse: c2.map((x) => x.e.reason) });
      // two taps 0.3 s apart with 100 ink: one dash, then a low-ink refusal (45 left)
      put(me, 0, 0, -6, 0);
      const e2 = ev.length;
      sim(me, 18, 1 / 60, (i) => ({ sub: i < 2 }));
      sim(me, 3, 1 / 60, (i) => ({ sub: i < 2 }));
      const d3 = since(e2, 'sub:dash', (e) => e.actor === me).length, lo = since(e2, 'lowink', (e) => e.actor === me);
      R('two taps 0.3 s apart with 100 ink: one dash, then a low-ink refusal (45 left)', d3 === 1 && lo.length === 1 && lo[0].e.need === 55 && me.ink < 55, { dashes: d3, lowink: lo.length, ink: r2(me.ink) });
    }

    // ================================================================================== 2. distance and direction
    if (run('dir')) {
      // the real controller (camera-relative WASD), the camera turned 0.7 rad; each direction pressed with E (the sub)
      const ctrl = new PlayerController(me, g.rig, g.input), I = g.input;
      const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE'];
      const COMBOS = [['KeyW'], ['KeyW', 'KeyD'], ['KeyD'], ['KeyS', 'KeyD'], ['KeyS'], ['KeyS', 'KeyA'], ['KeyA'], ['KeyW', 'KeyA'], []];
      const yaw = 0.7, sy = Math.sin(yaw), cy = Math.cos(yaw), rows = [];
      for (const combo of COMBOS) {
        put(me, 0, 0, -4, yaw);
        g.rig.yaw = yaw; g.rig.pitch = 0;
        let mx = 0, mz = 0; for (const k of combo) { if (k === 'KeyW') mz += 1; if (k === 'KeyS') mz -= 1; if (k === 'KeyA') mx -= 1; if (k === 'KeyD') mx += 1; }
        const ml = Math.hypot(mx, mz);
        const exp = ml ? [(sy * mz - cy * mx) / ml, (cy * mz + sy * mx) / ml] : [Math.sin(yaw), Math.cos(yaw)];
        const p0 = me.pos.clone();
        let frames = 0, endV = null, endP = null;
        for (let i = 0; i < 40; i++) {
          for (const k of keys) dbg.key(k, i === 0 && (combo.includes(k) || k === 'KeyE'));
          I.mouse.dx = I.mouse.dy = 0;
          ctrl.enabled = true; ctrl.update(1 / 60);
          G.time += 1 / 60; me.update(1 / 60);
          if (wr.dashT > 0) frames = i + 1;
          else if (frames && !endP) { endP = me.pos.clone(); endV = hv(me); }
        }
        for (const k of keys) dbg.key(k, false);
        const dx = endP.x - p0.x, dz = endP.z - p0.z, dist = Math.hypot(dx, dz), ang = Math.acos(Math.max(-1, Math.min(1, (dx * exp[0] + dz * exp[1]) / (dist || 1))));
        rows.push({ keys: combo.join('+') || '(none: facing)', dist: r3(dist), angDeg: r2(ang * 180 / Math.PI), frames, endV: r2(endV) });
      }
      R('ground: 4.5 ± 0.2 m in 0.22 s ± 1 frame, in 8 directions relative to the camera (WASD through the real controller, the camera turned 0.7 rad); no stick: the way the kid faces; the end speed ≤ 7',
        rows.every((r) => Math.abs(r.dist - 4.5) <= 0.2 && r.angDeg < 1 && Math.abs(r.frames - 0.22 * 60) <= 1 && r.endV <= 7 + 1e-6), rows);
      // the air: a jump, then at its apex a dash (D.airDashDist)
      const air = [];
      for (const dir of [[1, 0], [0, -1], [-0.6, 0.8]]) {
        put(me, 0, 0, -4, 0);
        sim(me, 2, 1 / 60, { jump: true });
        sim(me, 40, 1 / 60, {}, () => !(me.vel.y < 0.3));
        const p0 = me.pos.clone();
        let frames = 0, endP = null, endV = 0;
        sim(me, 30, 1 / 60, (i) => ({ sub: i === 0, move: i === 0 ? dir : null }), (i) => { if (wr.dashT > 0) frames = i + 1; else if (!endP) { endP = me.pos.clone(); endV = hv(me); } });
        const dist = Math.hypot(endP.x - p0.x, endP.z - p0.z);
        air.push({ dir, dist: r3(dist), frames, endV: r2(endV), wasAir: wr.airDashUsed || !me.grounded });
      }
      R(`air: ${D.airDashDist} ± 0.2 m (a dash at a jump's apex), the end speed ≤ 7`, air.every((r) => Math.abs(r.dist - D.airDashDist) <= 0.2 && r.endV <= 7 + 1e-6 && Math.abs(r.frames - 0.22 * 60) <= 1), air);
    }

    // ================================================================================== 3. no height gain
    if (run('height')) {
      const peak = (fn) => { put(me, 0, 0, -8, 0); const y0 = me.pos.y; let top = y0; sim(me, 90, 1 / 60, fn, () => { top = Math.max(top, me.pos.y); }); return top - y0; };
      const plain = peak((i) => ({ jump: i < 2 }));
      let tApex = -1; { put(me, 0, 0, -8, 0); sim(me, 60, 1 / 60, (i) => ({ jump: i < 2 }), (i) => { if (tApex < 0 && i > 2 && me.vel.y < 0.3) tApex = i + 1; }); }
      let tFall = -1; { put(me, 0, 0, -8, 0); sim(me, 60, 1 / 60, (i) => ({ jump: i < 2 }), (i) => { if (tFall < 0 && me.vel.y < -3) tFall = i + 1; }); }
      const rows = [['rise', 5], ['apex', tApex], ['fall', tFall], ['the jump frame', 0], ['just after', 1]].map(([n, f]) => ({ at: n, frame: f, rise: r3(peak((i) => ({ jump: i < 2, sub: i === f, move: i === f ? [1, 0] : null }))) }));
      R(`dashing at a jump's rise, apex and fall never raises its peak above a plain jump's (${r3(plain)} m, ± 0.02)`, rows.every((r) => r.rise <= plain + 0.02), { plain: r3(plain), rows });
      // blocks just over a kid's reach: no jump + dash timing climbs one a plain hop can't (and the probe sees a 1.8 m one climbed with a plain hop)
      let CB = null;   // (one block, moved to each height: thousands of tries never pile up dynamic blocks)
      // a run-up of d0 m at the block (h m tall), then at step dt: a plain running hop (f < 0), a jump with the dash f 60 Hz
      // frames into it, or (dashFirst) the dash then a jump f frames later — does the kid end up standing on the block?
      const climb = (h, d0, f, dashFirst, dt = 1 / 60) => {
        const k = (n) => Math.round(n / (60 * dt)), J = Math.max(1, k(2));
        unbox(); if (!CB) CB = L.addDynamic({ tag: 'test:dash-climb' });
        CB.solid = true; L.moveDynamic(CB, V(4, h / 2, -20), V(1, h / 2, 3), 0); CB.dp.set(0, 0, 0);
        put(me, 3 - 0.38 - d0, 0, -20, Math.PI / 2);
        let onTop = false;
        const fk = f >= 0 ? k(f) : -1;
        sim(me, k(100), dt, (i) => dashFirst ? { sub: i === 0, jump: i > fk && i <= fk + J, move: [1, 0] } : { jump: i < J, sub: fk >= 0 && i === fk, move: [1, 0] }, () => { if (me.grounded && me.pos.y > h - 0.05) onTop = true; });
        return onTop;
      };
      // (on its own a running hop that meets the wall right at its apex is pushed up over the top edge: testbox's 1.9 m is
      // climbed from a 1.0 m run-up with no dash at all. So the rule is judged against that: with any jump + dash timing,
      // nothing taller than a plain hop's best is climbed)
      // The plain hop's best is measured to 0.01 m (1.60 … 2.20 m blocks, 30 run-ups), at 1/60 and at 1/24; the dash then
      // gets every timing × the 30 run-ups on every height from a
      // centimetre above that best up to 0.1 m over it, and must climb none of them. (dash-reach.js takes its height bars
      // from these numbers: HOP_BEST there)
      const RUN = Array.from({ length: 30 }, (_, i) => Math.round((0.05 + i * 0.15) * 100) / 100), c2 = (x) => Math.round(x * 100) / 100;   // (run-ups 0.05 … 4.4 m)
      const sane = climb(1.8, 0.3, -1, false);
      for (const dt of [1 / 60, 1 / 24]) {
        let plainBest = 0; const plainAt = {};
        for (let h = 1.6; h <= 2.2001; h += 0.01) for (const d0 of RUN) { const hh = c2(h); if (climb(hh, d0, -1, false, dt)) { plainBest = Math.max(plainBest, hh); plainAt[hh + '@' + d0] = true; } }
        const H2 = []; for (let h = plainBest + 0.01; h <= plainBest + 0.1001; h += 0.01) H2.push(c2(h));
        const fs = [...new Set(Array.from({ length: 18 }, (_, i) => Math.round(i * 2 / (60 * dt)) * 60 * dt))];   // (the timings this dt can tell apart)
        const tries = []; let dashBest = 0; const extra = [];
        for (const h of H2) for (const d0 of RUN) for (const f of fs) for (const df of [false, true]) {
          const c = climb(h, d0, f, df, dt); tries.push(c);
          if (c) { dashBest = Math.max(dashBest, h); extra.push({ h, runUp: d0, frame: f, dashFirst: df }); }
        }
        R(`dt 1/${Math.round(1 / dt)}: a plain running hop's best, to 0.01 m, lands on ${plainBest} m (testbox: a running hop meeting the wall at its apex); no jump + dash timing climbs anything higher (${tries.length} tries: ${H2.length} heights ${H2[0]}–${H2[H2.length - 1]} m × ${RUN.length} run-ups × ${fs.length} timings × dash first or jump first)`,
          sane && plainBest >= 1.6 && dashBest === 0 && H2.length > 0, { plainBest, plainRunUps: Object.keys(plainAt).filter((k) => k.startsWith(plainBest + '@')), dashClimbs: extra.slice(0, 6), sane });
      }
      unbox(); CB.solid = false; L.moveDynamic(CB, V(1e4, -500, 1e4), V(0.1, 0.1, 0.1), 0);
      // gentle slopes: an air dash whose body meets a 16° face lands there (the ledge assist, as any landing) and never
      // rides up it while airborne (round 1's did: its body slid up the face at dash speed, the feet 0.1 m higher in the air
      // and the landing 0.1–0.25 m over a plain hop's — dash-reach found it on saltpan's pitched shed roof, 2.13 m over the
      // start, and lockgate's cart ramp, 1.93 m). The two shapes as found: a 1.75 m wall with a roof pitched up 16° from
      // just behind its edge, run at head-on; and a 16.7° ramp met from its side at 45°. Every run-up × timing at 1/60 and
      // 1/24, caught in the substeps: with the dash pressed in the air, the feet's highest point before it first comes down
      // is no higher than a plain running hop's on the same shape (the best of the run-ups, + 0.02)
      const pitched = (b, cx, cy, cz, hx, hy, hz, th) => {   // an OBB tilted th about z: its x axis rises toward +x
        L.moveDynamic(b, V(cx, cy, cz), V(hx, hy, hz), 0);
        const c = Math.cos(th), s = Math.sin(th);
        b.axes[0].set(c, s, 0); b.axes[1].set(-s, c, 0); b.axes[2].set(0, 0, 1);
        const ex = c * hx + s * hy, ey = s * hx + c * hy;
        b.aabbMin.set(cx - ex, cy - ey, cz - hz); b.aabbMax.set(cx + ex, cy + ey, cz + hz);
      };
      const TH = 16 * Math.PI / 180, slabAt = (x0, y0, hx, b) => { const hy = 0.15, c = Math.cos(TH), s = Math.sin(TH); pitched(b, x0 + c * hx + s * hy, y0 + s * hx - c * hy, -20, hx, hy, 3, TH); };
      let LH = null;
      me._integrate = function (dt, sq, j) {
        Object.getPrototypeOf(this)._integrate.call(this, dt, sq, j);
        const s = LH; if (!s || s.down !== null) return;
        if (wr.dashT > 0 && s.dashAir === null) s.dashAir = !!wr.dashAir;   // (pressed in the air, or on the ground)
        if (this.grounded) { if (s.air) s.down = this.pos.y; } else { s.air = true; s.maxAir = Math.max(s.maxAir, this.pos.y); }
      };
      // from S backed off d0 m along the heading q, running: the jump, then (f ≥ 0) the dash f 60 Hz frames into it
      const tryIt = (S, q, d0, f, dt) => {
        const k = (n) => Math.round(n / (60 * dt)), J = Math.max(1, k(2)), fk = f >= 0 ? k(f) : -1;
        put(me, S[0] - q[0] * d0, 0, S[1] - q[1] * d0, Math.atan2(q[0], q[1])); const y0 = me.pos.y;
        LH = { air: false, down: null, maxAir: -99, dashAir: null };
        sim(me, k(70), dt, (i) => ({ jump: i < J, sub: fk >= 0 && i === fk, move: q }));
        const r = LH; LH = null; return { maxAir: r.maxAir - y0, dashAir: r.dashAir, down: r.down === null ? null : r.down - y0 };
      };
      const shapes = [], RU = [0.05, 0.3, 0.6, 1.0, 1.5, 2.0, 2.6, 3.4], Q = Math.SQRT1_2;
      const SHAPES = [
        { name: 'a 1.75 m wall, a roof pitched up 16° from just behind its edge (head-on)', S: [3 - 0.38, -20], q: [1, 0],
          build: () => { box(4, 0.875, -20, 1, 0.875, 3); slabAt(3.3, 1.75, 1.6, box(0, -50, 0, 0.1, 0.1, 0.1)); } },
        { name: 'a 16.7° ramp met from its side at 45°', S: [0.41, -19.55], q: [Q, Q],
          build: () => pitched(box(0, -50, 0, 0.1, 0.1, 0.1), 0, -0.15, -15, 3.35, 1.32, 4.48, Math.asin(0.287)) },
      ];
      for (const dt of [1 / 60, 1 / 24]) {
        for (const sh of SHAPES) {
          unbox(); sh.build();
          let hopAir = -9, hopDown = -9, dashAir = -9, dashDown = -9, at = null, n = 0;
          for (const d0 of RU) { const r = tryIt(sh.S, sh.q, d0, -1, dt); hopAir = Math.max(hopAir, r.maxAir); if (r.down !== null) hopDown = Math.max(hopDown, r.down); }
          for (const d0 of RU) for (let f = 0; f <= 34; f += 2) {
            const r = tryIt(sh.S, sh.q, d0, f, dt); if (!r.dashAir) continue;
            n++; if (r.maxAir > dashAir) { dashAir = r.maxAir; at = { runUp: d0, frame: f }; } if (r.down !== null) dashDown = Math.max(dashDown, r.down);
          }
          shapes.push({ shape: sh.name, dt: `1/${Math.round(1 / dt)}`, airDashes: n, dashHighestInAir: r3(dashAir), hopHighestInAir: r3(hopAir), at, dashFirstDown: r3(dashDown), hopFirstDown: r3(hopDown) });
        }
      }
      delete me._integrate; unbox();
      R(`an air dash into a gentle slope lands on it, never rides up it: the feet's highest in the air no higher than a plain hop's on the same shape (+ 0.02) — ${shapes.map((s) => `${s.shape} at ${s.dt}: ${s.dashHighestInAir} m against ${s.hopHighestInAir} (${s.airDashes} air dashes; first comes down ${s.dashFirstDown} m, a hop ${s.hopFirstDown} m)`).join('; ')} (8 run-ups × 18 timings each)`,
        shapes.length === 4 && shapes.every((s) => s.airDashes >= 60 && s.hopHighestInAir > 1 && s.dashHighestInAir <= s.hopHighestInAir + 0.02), shapes);
    }

    // ================================================================================== 4. limits
    if (run('limits')) {
      // one air dash per airtime: a second press in the air → "Can't use" (Air dash used) until landing
      put(me, 0, 0, -4, 0); me.pos.y = 4; me.grounded = false; sim(me, 2, 1 / 60, {});
      let e0 = ev.length;
      sim(me, 4, 1 / 60, (i) => ({ sub: i === 0, move: [1, 0] }));
      sim(me, 16, 1 / 60, {});
      sim(me, 3, 1 / 60, (i) => ({ sub: i === 0 }));
      const c1 = since(e0, 'sub:cantuse', (e) => e.actor === me).map((x) => x.e.reason);
      sim(me, 90, 1 / 60, {}, () => !me.grounded);
      sim(me, 3, 1 / 60, {});
      const e1 = ev.length; me.ink = 100;
      sim(me, 2, 1 / 60, (i) => ({ sub: i === 0, move: [-1, 0] }));
      const again = since(e1, 'sub:dash', (e) => e.actor === me).length;
      R('a second air dash says "Can\'t use" (Air dash used) until landing; landed, it dashes again', since(e0, 'sub:dash', (e) => e.actor === me).length === 2 && c1.length === 1 && c1[0] === 'Air dash used' && again === 1, { cantuse: c1, again });
      // a held charger charge drops on a dash: no shot, no ink for it
      me.setWeapon('charger'); put(me, 0, 0, -4, 0);
      sim(me, 30, 1 / 60, { fire: true });
      const charging = wr.charging, ch = wr.charge, ink0 = me.ink; e0 = ev.length;
      sim(me, 1, 1 / 60, { fire: true, sub: true, move: [1, 0] });
      const dropped = !wr.charging;
      sim(me, 14, 1 / 60, { fire: true });
      const shots = since(e0, 'weapon:fire', (e) => e.actor === me).length;
      R('a held charger charge drops on a dash, without a shot (no dash-sniping)', charging && ch > 0.2 && dropped && shots === 0 && Math.abs(me.ink - (ink0 - 55)) < 0.6, { charging, charge: r2(ch), dropped, shots, ink: [r2(ink0), r2(me.ink)] });
      // out of squid form: dashes on the press frame (a kid on that frame)
      me.setWeapon('shooter'); put(me, 0, 0, -4, 0);
      G.paint.splat(V(0, 0.1, -4), 3, me.team);
      sim(me, 20, 1 / 60, { squid: true });
      const wasSquid = me.form === 'squid'; e0 = ev.length;
      sim(me, 1, 1 / 60, { squid: true, sub: true, move: [0, 1] });
      R('out of squid form (swim held, sub pressed): it dashes on the press frame, a kid', wasSquid && since(e0, 'sub:dash', (e) => e.actor === me).length === 1 && me.form === 'kid' && wr.dashT > 0, { wasSquid, form: me.form, dashT: r3(wr.dashT) });
      // a Spritzer held on fire through a dash fires no shot while dashT > 0 (lockMain); it fires again after
      put(me, 0, 0, -4, 0);
      sim(me, 20, 1 / 60, { fire: true });
      let during = 0, after = 0, locked = 0, frames = 0; e0 = ev.length;
      sim(me, 40, 1 / 60, (i) => ({ fire: true, sub: i === 0, move: i < 14 ? [0, 1] : null }), () => { const n = since(e0, 'weapon:fire', (e) => e.actor === me).length; e0 = ev.length; if (wr.dashT > 0) { during += n; frames++; locked += wr.mainLocked ? 1 : 0; } else after += n; });
      R('a Spritzer held on fire through a dash fires no shot while dashT > 0 (the trigger is locked), and fires again after it', during === 0 && frames >= 12 && locked === frames && after > 2, { during, after, frames, locked });
      // a jump pressed mid-dash fires on the first frame after it
      put(me, 0, 0, -4, 0);
      let endF = -1, jumpF = -1, airDuring = false; e0 = ev.length;
      sim(me, 30, 1 / 60, (i) => ({ sub: i === 0, jump: i === 4 || i === 5, move: [1, 0] }), (i) => { if (wr.dashT > 0) { if (!me.grounded) airDuring = true; } else if (endF < 0) endF = i; if (jumpF < 0 && since(e0, 'actor:jump', (e) => e.actor === me).length) jumpF = i; });
      R('a jump pressed mid ground dash waits and fires on the first frame after the dash', endF > 4 && jumpF === endF + 1 && !airDuring, { dashEndFrame: endF, jumpFrame: jumpF, airDuring });
      // a Twinfire roll pressed mid-dash is refused (no roll, no jump after)
      me.setWeapon('twins'); put(me, 0, 0, -4, 0);
      e0 = ev.length;
      let rolled = 0;
      sim(me, 40, 1 / 60, (i) => ({ sub: i === 0, fire: i > 2, jump: i === 4 || i === 5, move: [1, 0] }), () => { if (wr.dodgeT > 0) rolled++; });
      R('a Twinfire roll pressed mid-dash is refused: no roll, no jump after it', rolled === 0 && since(e0, 'actor:jump', (e) => e.actor === me).length === 0 && since(e0, 'actor:dodge', (e) => e.actor === me).length === 0, { rolled, jumps: since(e0, 'actor:jump', (e) => e.actor === me).length });
      // a special that took the trigger (the previous frame's _spWeapon: a Crab Rig, a Zooka …) owns the sub button too:
      // the press does nothing, not even "Can't use"
      put(me, 0, 0, -4, 0); e0 = ev.length;
      me._spWeapon = true; sim(me, 1, 1 / 60, { sub: true, move: [1, 0] });
      const spDash = since(e0, 'sub:dash', (e) => e.actor === me).length, spCant = since(e0, 'sub:cantuse', (e) => e.actor === me).length;
      R('while a special has taken the main weapon (its _spWeapon), a press does nothing: no dash, no "Can\'t use", no ink', spDash === 0 && spCant === 0 && me.ink === 100, { dashes: spDash, cantuse: spCant, ink: r2(me.ink) });
      sim(me, 2, 1 / 60, {});
      // the Zipline (its tether is the sub button; its weapon() leaves the trigger to the main weapon, so _spWeapon stays
      // false): a press zips, and never dashes too; and a dash already running when a body phase starts (here a dash forced
      // through the kit, then the tether) ends there: never paused through the zip and run on after it
      {
        const { ZC_STATS } = await import('./src/game/specials.js');
        unbox(); box(0, 2, 4.25, 3, 2, 0.25);                  // a wall 8 m ahead
        const zf = (w) => { setIt(me, w); me.intent.special = !!w.special; me.aimPoint.set(0, 2.2, 3.9); G.time += 1 / 60; me.update(1 / 60); };
        const zipOn = () => { put(me, 0, 0, -4, 0); me.specialId = 'zipcaster'; me.special = me.specialCost(); zf({ special: true }); for (let i = 0; i < 6; i++) zf({}); };
        zipOn();
        const sp = me.specialActive, z0 = ZC_STATS.zips; e0 = ev.length;
        const ink0 = me.ink; let dashFrames = 0, zipped = false;
        zf({ sub: true });
        for (let i = 0; i < 50; i++) { if (wr.dashT > 0) dashFrames++; if (sp.zip) zipped = true; zf({ sub: i < 3 }); }
        const zDash = since(e0, 'sub:dash', (e) => e.actor === me).length, zCant = since(e0, 'sub:cantuse', (e) => e.actor === me).length, zips = ZC_STATS.zips - z0;
        R('with the Zipline up, a sub press fires its tether alone: one zip, no dash (no "sub:dash", dashT 0 every frame), no "Can\'t use", no ink', sp?.kind === 'zipcaster' && zipped && zips === 1 && zDash === 0 && zCant === 0 && dashFrames === 0 && Math.abs(me.ink - ink0) < 1e-6,
          { special: sp?.kind, zips, dashes: zDash, cantuse: zCant, dashFrames, ink: [r2(ink0), r2(me.ink)] });
        G.specials.end(me, 'splat'); sim(me, 30, 1 / 60, {});   // ('splat': no super jump back)
        zipOn();
        const sp2 = me.specialActive;
        K.use(G.subs, me, D);                                   // (a dash under way, however it started)
        const t0 = wr.dashT;
        zf({ sub: true });                                      // the tether: a body phase begins
        const zipping = !!sp2.zip;
        zf({});
        const tAfter = wr.dashT;
        let endAt = null, moved = 0, dashLater = 0;
        for (let i = 0; i < 60; i++) { zf({}); if (wr.dashT > 0) dashLater++; if (!sp2.zip && !endAt) endAt = me.pos.clone(); else if (endAt) moved = Math.max(moved, Math.hypot(me.pos.x - endAt.x, me.pos.z - endAt.z)); }
        R('a dash running when a body phase starts (the Zipline\'s tether) ends there: dashT 0 from the first zip frame, and nothing of it runs on after the zip (≤ 0.1 m sideways from where the zip ended)', t0 > 0.2 && zipping && tAfter === 0 && dashLater === 0 && endAt && moved <= 0.1,
          { dashT: [r3(t0), r3(tAfter)], zipping, dashLater, movedAfterZip: r3(moved) });
        G.specials.end(me, 'splat'); unbox(); sim(me, 30, 1 / 60, {});
      }
      // the sub held through a stand-in pipe ride: no dash on the exit until a release and a new press
      me.setWeapon('shooter'); put(me, 0, 0, -4, 0);
      e0 = ev.length;
      sim(me, 3, 1 / 60, { sub: true });                       // (a dash on the way in: the button down)
      me.pipe = { stage: 'test' }; wr.reset();                 // taken in: the capture resets the runner
      sim(me, 20, 1 / 60, { sub: true });                      // riding, the button held
      sim(me, 4, 1 / 60, () => { me._prevIntent.sub = false; return { sub: false }; });   // the pop phase forces the sub off
      delete me.pipe;
      sim(me, 20, 1 / 60, { sub: true });                      // out, still held: nothing
      const onExit = since(e0, 'sub:dash', (e) => e.actor === me).length;
      sim(me, 2, 1 / 60, {}); me.ink = 100;
      sim(me, 2, 1 / 60, (i) => ({ sub: i === 0 }));          // a release and a new press: the dash
      const afterNew = since(e0, 'sub:dash', (e) => e.actor === me).length;
      R('with the sub held through a stand-in pipe ride (the capture\'s reset, the pop phase forcing it off), no dash on the exit until a release and a new press', onExit === 1 && afterNew === 2, { dashesBeforeExitRelease: onExit, afterNewPress: afterNew });
    }

    // ================================================================================== 5. the blast
    if (run('blast')) {
      const [e1, e2, e3, e4] = foes;
      const setV = () => {
        put(me, 0, 0, 0, 0);
        put(e1, 0, 0, -0.3, 0); put(e2, 2.07, 0, 0, 0); put(e3, 0, 0, -2.45, 0); put(e4, -1.6, 0, 0.4, 0);
        for (const e of [e1, e2, e3, e4]) e.hp = PLAYER.hp;
      };
      unbox(); box(-0.85, 1, 0.4, 0.1, 1, 1.2);   // a wall between the take-off point and e4
      setV();
      let e0 = ev.length;
      sim(me, 1, 1 / 60, { sub: true, move: [0, 1] });
      const hits = since(e0, 'hit', (e) => e.attacker === me).map((x) => ({ v: foes.indexOf(x.e.victim), d: r2(x.e.damage), w: x.e.weaponId }));
      const hit = (k) => hits.find((h) => h.v === k);
      R('the blast: 50 at its centre (a foe 0.3 m behind the take-off point: it hits foes left behind), ~25 at its rim (2.19 m), nothing past 2.2 m, nothing through a wall',
        hit(0) && Math.abs(hit(0).d - 50) < 0.01 && hit(1) && hit(1).d >= 25 && hit(1).d < 26.5 && !hit(2) && !hit(3) && hits.every((h) => h.w === 'dash'), hits);
      // Bubble Guard and the Kraken: untouchable
      setV(); e1.status.shield = 3; e2.specialActive = { id: 'kraken', kind: 'kraken', def: SPECIALS.kraken };
      sim(me, 1, 1 / 60, { sub: true, move: [0, 1] });
      const g1 = e1.hp, g2 = e2.hp;
      e1.status.shield = 0; e2.specialActive = null;
      R('a foe under Bubble Guard and one in a Kraken take nothing from it', g1 === PLAYER.hp && g2 === PLAYER.hp, { guard: g1, kraken: g2 });
      // devices: 25 to an enemy device (a Twirl Sprinkler); a kit device's damageArea gets 25 at 2.2 m (a bobber: hp 25 → disarmed)
      setV();
      const spr = G.subs._plant(e1, SUBS.sprinkler, V(1.2, 0, -0.4), V(0, 1, 0), 0, null, false);
      spr.state = 'spray';
      const seen = [];
      SUB_KITS.__dashTest = { damageArea: (c, r, dmg, team) => seen.push({ r, dmg, team, at: r3(c.distanceTo(me.pos)) }) };
      const hp0 = spr.hp;
      sim(me, 1, 1 / 60, { sub: true, move: [0, 1] });
      delete SUB_KITS.__dashTest;
      const sprHp = spr.hp; G.subs._destroy(spr);
      R('devices take 25: an enemy Twirl Sprinkler loses 25 hp; kit devices get a 2.2 m, 25-damage blast (a Chain Bobber\'s 25 hp: disarmed)', hp0 - sprHp === 25 && seen.length === 1 && seen[0].r === 2.2 && seen[0].dmg === 25 && seen[0].team === me.team, { sprinkler: [hp0, sprHp], kitBlast: seen });
      // Drainbow: halved for a foe inside its own team's bubble (an enemy bubble to the dasher)
      unbox(); home(); put(me, 0, 0, 0, 0); put(e1, 0, 0, -0.3, 0); put(e2, 4, 0, 0, 0);
      e2.specialId = 'drainbow'; e2.special = e2.specialCost(); e2._startSpecial();
      step(50);
      put(me, 0, 0, 0, 0); put(e1, 0, 0, -0.3, 0); e1.hp = PLAYER.hp;
      const inBub = !!G.drainbow?.inEnemy?.(me) || G.drainbow.bubbles.some((b) => b.live && b.pos.distanceTo(e1.pos) < b.radius());
      e0 = ev.length;
      sim(me, 1, 1 / 60, { sub: true, move: [0, 1] });
      const dh = since(e0, 'hit', (e) => e.attacker === me && e.victim === e1).map((x) => r2(x.e.damage));
      R('Drainbow: a foe inside its team\'s bubble takes the blast halved (50 → 25)', inBub && dh.length === 1 && Math.abs(dh[0] - 25) < 0.01, { inBubble: inBub, dmg: dh });
      G.specials.clear?.(); home();
      // the streak: a ground dash inks a thin lane along its path (whole frames: the kit's tick lays it)
      const lane = [];
      put(me, -10, 0, -20, Math.PI / 2);
      const s0 = DK.DASH_STATS.streak;
      W.set(me, { sub: true, move: [1, 0] }); step(1); W.set(me, { move: [0, 0] }); step(24); W.delete(me);
      const { Hit } = await import('./src/game/physics.js'), H1 = new Hit(), DN = V(0, -1, 0);
      const inked = (x, y, z) => { const h = G.physics.raycast(V(x, y + 0.5, z), DN, 1.2, H1); return !!h.hit && h.face >= 0 && G.paint.sample(h.face, h.u, h.v) - 1 === me.team; };
      const mk = K._marks.slice(-(DK.DASH_STATS.streak - s0));
      for (const q of mk) lane.push([q[0], inked(q[0], q[1], q[2]) ? 1 : 0, inked(q[0], q[1], q[2] + 1.0) ? 1 : 0]);
      const past = lane.filter((q) => q[0] > -10 + 2.7);   // (beyond the blast's own ink: its 2 m splat and satellites)
      R('the streak: a ground dash lays about 7 splats along its path (0.45 m every 0.6 m) — its lane is inked past the blast\'s own ink, the floor a metre to its side isn\'t',
        mk.length >= 6 && past.length >= 2 && lane.every((q) => q[1] === 1) && past.every((q) => q[2] === 0) && mk.every((q, i) => !i || Math.abs(q[0] - mk[i - 1][0] - 0.6) < 0.05), { splats: mk.length, lane: lane.map((q) => q.join(' ')) });
      unbox();
    }

    // ================================================================================== [b5-int3] the look from the dasher's own camera
    // a forward dash seen from behind (the follow camera, whole frames): the ribbon faces the camera — its strip covers real
    // screen area where the old vertical band (the same points, offsets straight up and down) covers next to none; the
    // speed lines show and fade; the FOV kicks up and settles back
    if (run('look')) {
      // (the follow camera put behind the kid — earlier sections leave it anywhere: a side-on camera sees the old band too)
      unbox(); home(); put(me, 0, 0, -12, 0); W.set(me, {}); g.rig?.follow?.(me, true); if (g.rig) { g.rig.yaw = Math.PI; g.rig.pitch = 0.16; } step(40);
      const cam = G.camera, fov0 = cam.fov;
      W.set(me, { sub: true, move: [0, 1] }); step(1); W.set(me, { move: [0, 1] }); step(6);
      const Rb = K._ribbons[K._ribbons.length - 1];
      const area = (vert) => {
        if (!Rb) return 0;
        const pa = Rb.mesh.geometry.attributes.position, ka = Rb.mesh.geometry.attributes.aK, n = pa.count / 2, P2 = (i) => { const v = V(pa.getX(i), pa.getY(i), pa.getZ(i)); if (vert) { const j = i & ~1, c = V((pa.getX(j) + pa.getX(j + 1)) / 2, (pa.getY(j) + pa.getY(j + 1)) / 2, (pa.getZ(j) + pa.getZ(j + 1)) / 2), h = v.distanceTo(c); v.set(c.x, c.y + (i & 1 ? h : -h), c.z); } v.project(cam); return [v.x * 480, v.y * 270]; };
        let A = 0;
        for (let i = 0; i < n - 1; i++) {
          if (ka.getX(i * 2) < 0.05 && ka.getX(i * 2 + 2) < 0.05) continue;
          const q = [P2(i * 2), P2(i * 2 + 1), P2(i * 2 + 3), P2(i * 2 + 2)];
          let s = 0; for (let k = 0; k < 4; k++) { const [x1, y1] = q[k], [x2, y2] = q[(k + 1) % 4]; s += x1 * y2 - x2 * y1; }
          A += Math.abs(s) / 2;
        }
        return r2(A);
      };
      const aNow = area(false), aVert = area(true), fovUp = r2(cam.fov - fov0), kick = r2(DK.dashFov ? DK.dashFov(me) : 0), ln = K._lines ? K._lines() : null, op1 = ln?.el ? +ln.el.style.opacity : 0;
      W.set(me, {}); step(40);
      const fovBack = r2(cam.fov - fov0), op2 = ln?.el ? +ln.el.style.opacity : 0;
      R(`the dasher's own camera, a forward dash: the ribbon faces it (${aNow} px² of strip on a 960×540 view, against ${aVert} for the old vertical band), the speed lines show (opacity ${op1}) and fade (${op2}), the FOV kicks up ${fovUp}° and settles back (${fovBack}°)`,
        aNow > 400 && aNow > aVert * 4 && op1 > 0.3 && op2 === 0 && fovUp >= 2.5 && Math.abs(fovBack) < 0.3, { aNow, aVert, op1, op2, fovUp, fovBack, kick });
      W.delete(me);
    }
    // ================================================================================== 9. walls, curtains, canopies, bubbles, the shell, the spawn barrier — at every frame rate
    if (run('walls')) {
      home();
      const enemy = foes[0];
      // every substep's move (_integrate wrapped): ≤ 0.2 m at any dt
      const steps = []; const integ = me._integrate;
      me._integrate = function (dt, sq, j) { const x0 = this.pos.x, z0 = this.pos.z; integ.call(this, dt, sq, j); if (this.weaponRunner.dashT > 0) steps.push(Math.hypot(this.pos.x - x0, this.pos.z - z0)); };
      const DTS = [1 / 60, 1 / 30, 1 / 24];
      const X0 = 0, Z0 = 10;
      // dash +x from x0 for 0.5 s at dt; the worst x it got to, where it ended, the first frame's substeps
      const dashAt = (x0, dt, dir = [1, 0], z0 = Z0, y0 = 0) => {
        put(me, x0, y0, z0, Math.PI / 2);
        let maxX = -1e9, n1 = 0;
        sim(me, Math.ceil(0.5 / dt), dt, (i) => ({ sub: i === 0, move: i === 0 ? dir : null }), (i) => { maxX = Math.max(maxX, me.pos.x); if (i === 0) n1 = wr.dashSteps; });
        return { maxX, end: me.pos.clone(), n1 };
      };
      const rows = [];
      const obstacle = (name, set, nearX, farX, clear) => {
        for (const dt of DTS) for (const short of [0, 0.3]) {
          set();
          const r = dashAt(nearX - short, dt);
          rows.push({ name, fps: Math.round(1 / dt), short, end: r3(r.end.x - nearX), maxPast: r3(r.maxX - nearX), far: r.maxX > farX, n1: r.n1 });
          clear();
        }
      };
      for (const th of [0.10, 0.25, 0.50]) obstacle(`wall ${th} m`, () => { unbox(); box(X0 + th / 2, 1, Z0, th / 2, 1, 3); }, X0 - PLAYER.radius, X0 + th / 2, unbox);
      // an enemy Drip Curtain across the way (its face to the kid)
      let cur = null;
      obstacle('enemy Drip Curtain', () => { cur = G.subs._throw(enemy, SUBS.curtain, V(X0, 0.5, Z0), V(0, 0, 0), false); cur.dir.set(-1, 0, 0); G.subs._startCurtain(cur, { point: V(X0, 0, Z0), block: -1 }); }, X0 - PLAYER.radius - 0.12, X0, () => { G.subs._destroy(cur); G.subs._dispose(cur); G.subs.items.splice(G.subs.items.indexOf(cur), 1); });
      // a launched enemy Brolly canopy, held still (its blocking plane at X0)
      const LA = MAIN_KITS.brolly._state.LAUNCHED;
      const far = V(1e4, -100, 1e4);   // (its shot / blast shield held far off: only its push on players is under test here)
      const can = { alive: true, team: enemy.team, owner: enemy, pos: V(X0 - DEPTH * 0.5, 0, Z0), dir: V(-1, 0, 0), shoving: false,
        sh: { held: false, team: enemy.team, owner: enemy, C: far.clone(), N: V(-1, 0, 0), R: 0.8, Cp: far.clone(), Np: V(-1, 0, 0), prev: true } };
      obstacle('launched enemy Brolly canopy', () => LA.push(can), X0 - PLAYER.radius - 0.18, X0, () => LA.splice(LA.indexOf(can), 1));
      // a stand-in Roe Shell (G.objTargets.spheres: r 1.6, its centre 1.0 m over the deck) and an enemy bubble (r 0.9, afloat)
      const SH = { c: V(X0 + 1.6, 1.0, Z0), r: 1.6, solid: true };
      const shR = Math.sqrt(1.6 * 1.6 - 0.2 * 0.2) + PLAYER.radius;
      obstacle('stand-in Roe Shell', () => { G.objTargets = { spheres(o) { o.push(SH); return o; } }; }, SH.c.x - shR, SH.c.x, () => { delete G.objTargets; });
      for (const by of [0.765, 1.45]) {
        const B = { kind: 'bubble', team: enemy.team, owner: enemy, pos: V(X0 + 0.9, by, Z0), r: 0.9, held: false, dead: false, update: () => true, dispose() {},
          hitArea() {}, hitShot: () => false, hitRay: (f, d, len) => len };   // (shots / blasts on it: not under test)
        const dy = 0.8 - by, bR = Math.sqrt(0.81 - dy * dy) + PLAYER.radius;
        obstacle(`enemy bubble (r 0.9, centre ${by} m up)`, () => G.specials.world.push(B), B.pos.x - bR, B.pos.x, () => G.specials.world.splice(G.specials.world.indexOf(B), 1));
      }
      const bad = rows.filter((r) => r.far || Math.abs(r.end) > 0.05);
      const nOk = rows.filter((r) => r.name.startsWith('wall') && r.short === 0).map((r) => r.n1);
      R('no wall (0.10 / 0.25 / 0.50 m), enemy Drip Curtain, launched enemy canopy, Roe Shell or enemy bubble is ever crossed, from touching or 0.3 m short, at dt 1/60, 1/30, 1/24; the body ends within 0.05 m of touching it',
        rows.length === 8 * 6 && !bad.length, { bad, rows });
      R(`every substep moves the body ≤ 0.2 m (the longest: ${r3(Math.max(...steps))} m over ${steps.length}); a ground dash's first frame takes ${nOk.slice(0, 3).join(' / ')} substeps at 60 / 30 / 24 fps (the frame's average speed: 28.6 / 27.9 / 27.6 m/s)`,
        steps.length > 100 && Math.max(...steps) <= 0.2 + 1e-6 && nOk[0] === 3 && nOk[1] === 5 && nOk[2] === 6, { max: r3(Math.max(...steps)), n: nOk });
      // 45° into the 0.10 m wall: slides along it
      const slide = [];
      for (const dt of DTS) {
        unbox(); box(X0 + 0.05, 1, Z0, 0.05, 1, 6);
        const r = dashAt(X0 - PLAYER.radius - 0.3, dt, [Math.SQRT1_2, Math.SQRT1_2]);
        slide.push({ fps: Math.round(1 / dt), along: r3(r.end.z - Z0), past: r3(r.maxX - (X0 - PLAYER.radius)) });
      }
      unbox();
      R('a dash at 45° into a 0.10 m wall slides along it (never through)', slide.every((s) => s.along > 2 && s.past < 0.05), slide);
      // the enemy spawn barrier stops it (on the enemy pad's deck)
      const pad = L.spawnPads[me.enemyTeam], Rb = L.spawnBarrier, bar = [];
      for (const dt of DTS) for (const short of [0, 0.3]) {
        put(me, pad.x - Rb - short, pad.y, pad.z, Math.PI / 2);
        let minD = 99;
        sim(me, Math.ceil(0.5 / dt), dt, (i) => ({ sub: i === 0, move: i === 0 ? [1, 0] : null }), () => { minD = Math.min(minD, Math.hypot(me.pos.x - pad.x, me.pos.z - pad.z)); });
        bar.push({ fps: Math.round(1 / dt), short, closest: r3(minD), end: r3(Math.hypot(me.pos.x - pad.x, me.pos.z - pad.z)) });
      }
      R(`a dash into the enemy spawn barrier stops at it (${Rb} m from the pad: never inside it, and it pushes the body back), at every dt`, bar.every((b) => b.closest > Rb - 0.03 && b.end < Rb + 0.5), bar);
      // airTime after one airborne dash frame grows by 1/60, not n/60
      const at = [];
      for (const dt of DTS) {
        put(me, 0, 0, -10, 0); me.pos.y = 3; me.grounded = false; me.vel.set(0, 0, 0); sim(me, 2, 1 / 60, {});
        const a0 = me.airTime; sim(me, 1, dt, { sub: true, move: [1, 0] });
        at.push({ fps: Math.round(1 / dt), n: wr.dashSteps, grew: me.airTime - a0 });
      }
      R('airTime after one airborne dash frame grows by 1/60 (not by n/60)', at.every((x) => Math.abs(x.grew - 1 / 60) < 1e-9 && x.n > 1), at.map((x) => ({ ...x, grew: +(x.grew * 60).toFixed(6) + '/60' })));
      me._integrate = integ;
      // (the Brolly's own check: a launched canopy still holds a walking enemy back, now through its blockActor hook too)
      LA.push(can);
      put(me, X0 - 2, 0, Z0, Math.PI / 2);
      let maxX = -9; sim(me, 90, 1 / 60, { move: [1, 0] }, () => { maxX = Math.max(maxX, me.pos.x); });
      LA.splice(LA.indexOf(can), 1);
      R('a launched enemy Brolly canopy still holds a walking enemy back (kits/brolly.js blockOne, now also its blockActor hook)', maxX < X0 - PLAYER.radius - 0.18 + 0.02 && maxX > X0 - 1, { maxX: r3(maxX), plane: X0 });
    }

    // ================================================================================== 10. edge cases (D1.5)
    if (run('edges')) {
      home();
      // a ground dash off a 2 m ledge, then a press in the air: "Can't use"
      unbox(); box(0, 1, -20, 2, 1, 2);
      put(me, 1.2, 2, -20, Math.PI / 2);
      let e0 = ev.length, leftGround = false;
      sim(me, 30, 1 / 60, (i) => ({ sub: i === 0 || i === 20, move: i === 0 ? [1, 0] : null }), () => { if (wr.dashT > 0 && !me.grounded) leftGround = true; });
      const c1 = since(e0, 'sub:cantuse', (e) => e.actor === me).map((x) => x.e.reason);
      unbox();
      R('a ground dash off a 2 m ledge counts as the air dash: a press in the air then says "Can\'t use" (Air dash used)', leftGround && c1.length === 1 && c1[0] === 'Air dash used', { leftGround, cantuse: c1 });
      // during a Twinfire roll: "Can't use" (Rolling); during its post-roll turret: the turret ends and the dash goes
      me.setWeapon('twins'); put(me, 0, 0, -4, 0);
      e0 = ev.length;
      sim(me, 3, 1 / 60, (i) => ({ fire: true, jump: i === 1, move: [1, 0] }));
      const rolling = wr.dodgeT > 0;
      sim(me, 2, 1 / 60, (i) => ({ fire: true, sub: i === 0, move: [1, 0] }));
      const c2 = since(e0, 'sub:cantuse', (e) => e.actor === me).map((x) => x.e.reason);
      sim(me, 30, 1 / 60, { fire: true });
      const turret = wr.turret; const e1 = ev.length;
      sim(me, 1, 1 / 60, { fire: true, sub: true, move: [0, 1] });
      R('during a Twinfire roll: "Can\'t use" (Rolling); during its post-roll turret: the turret ends and the dash goes', rolling && c2.length === 1 && c2[0] === 'Rolling' && turret && !wr.turret && since(e1, 'sub:dash', (e) => e.actor === me).length === 1, { rolling, cantuse: c2, turret, after: wr.turret });
      // a Mitts wall cling: the cling drops and the kid moves the air dash's length ± 0.2 m away from the wall
      me.setWeapon('mitts'); unbox(); box(3.25, 2, -20, 0.25, 2, 3);
      put(me, 3 - 0.4, 0, -20, Math.PI / 2); me.pos.y = 1.4; me.grounded = false;
      const k = MITTS.K(wr); k.cling = true; k.hang = true; k.clingN.set(-1, 0, 0); k.clingPt.set(3, 2.2, -20); k.seen = G.time;
      sim(me, 2, 1 / 60, { move: [1, 0] });
      const x0 = me.pos.x;
      let endX = null, airUsed = null;
      sim(me, 30, 1 / 60, (i) => ({ sub: i === 0, move: [1, 0] }), (i) => { if (i === 0) airUsed = wr.airDashUsed; if (!(wr.dashT > 0) && endX === null) endX = me.pos.x; });
      R(`a dash from a Mitts wall cling: the cling drops and the kid dashes ${D.airDashDist} ± 0.2 m away from the wall (steering into it: its normal; the air dash)`, !k.cling && endX !== null && Math.abs((x0 - endX) - D.airDashDist) <= 0.2 && airUsed, { from: r3(x0), moved: r3(x0 - endX), cling: k.cling, airUsed });
      unbox();
      // a Mitts leap in flight: "Can't use" (Mid-leap)
      put(me, 0, 0, -4, 0); e0 = ev.length;
      const k2 = MITTS.K(wr); k2.seen = G.time; k2.leaping = true;
      sim(me, 2, 1 / 60, (i) => ({ sub: i === 0 }));
      k2.leaping = false;
      const c3 = since(e0, 'sub:cantuse', (e) => e.actor === me).map((x) => x.e.reason);
      R('during a Mitts leap: "Can\'t use" (Mid-leap)', c3.length === 1 && c3[0] === 'Mid-leap' && !since(e0, 'sub:dash', (e) => e.actor === me).length, { cantuse: c3 });
      me.setWeapon('shooter');
      // a Bazookarp pick-up mid-dash (a stand-in: a.carry set, the runner reset): dashT 0, ≤ 7 m/s that frame, ≤ 4.8 within 0.05 s
      put(me, 0, 0, -4, 0);
      sim(me, 4, 1 / 60, (i) => ({ sub: i === 0, move: [1, 0] }));
      const mid = hv(me);
      me.carry = { kind: 'stand-in' }; wr.reset();
      const v0 = hv(me), t0 = wr.dashT;
      sim(me, 1, 1 / 60, {}); const v1 = hv(me);
      sim(me, 2, 1 / 60, {}); const v3 = hv(me);
      e0 = ev.length; me.ink = 100;
      sim(me, 3, 1 / 60, (i) => ({ sub: i === 1 }));
      // ([b5-int3] with the Bazookarp merged, a carrier's press is the Bazookarp's own bonk — actor.js, 'sub:cantuse' kind
      // 'karp', S20: allowed (one); the dash itself does nothing — no dash, no refusal of its own)
      const carryPress = since(e0, 'sub:dash', (e) => e.actor === me).length + since(e0, 'sub:cantuse', (e) => e.actor === me && e.kind !== 'karp').length;
      const karpBonk = since(e0, 'sub:cantuse', (e) => e.actor === me && e.kind === 'karp').length;
      delete me.carry;
      R('a stand-in Bazookarp pick-up mid-dash (a.carry, reset()): dashT 0 and ≤ 7 m/s that frame, ≤ 4.8 m/s within 0.05 s on the ground (stick let go); a press while carrying does nothing here (but the Bazookarp\'s own bonk)',
        mid > 15 && t0 === 0 && v0 <= 7 + 1e-6 && v1 <= 7 && v3 <= 4.8 && carryPress === 0 && karpBonk <= 1, { mid: r2(mid), dashT: t0, speeds: [r2(v0), r2(v1), r2(v3)], carryPress, karpBonk });
      // a stand-in pipe capture (reset()) mid-dash ends it the same way
      put(me, 0, 0, -4, 0);
      sim(me, 4, 1 / 60, (i) => ({ sub: i === 0, move: [1, 0] }));
      wr.reset();
      R('a stand-in pipe capture (the runner\'s reset) mid-dash ends it: dashT 0, ≤ 7 m/s', wr.dashT === 0 && hv(me) <= 7 + 1e-6, { dashT: wr.dashT, v: r2(hv(me)) });
    }

    // ================================================================================== HUD: the reason line, the air pip, the dimmed reticle, the tip
    if (run('hud') && g.hud) {
      home();
      const H = g.hud;
      put(me, 0, 0, -4, 0); me.ink = 100; H._denyT = -1e9;
      W.set(me, { sub: true, move: [1, 0] }); step(1);
      const lockedRet = H.ret.classList.contains('is-locked');
      W.set(me, {}); step(2); W.set(me, { sub: true }); step(1);
      const why = H.denyWhy.textContent, whyOn = !H.denyWhy.hidden && H.denyEl.classList.contains('is-on');
      W.set(me, {}); step(20);
      const unlocked = !H.ret.classList.contains('is-locked');
      put(me, 0, 0, -4, 0); me.ink = 100; me.pos.y = 3.5; me.grounded = false; W.set(me, {}); step(2);
      W.set(me, { sub: true, move: [1, 0] }); step(1); W.set(me, {}); step(16);
      const pipAir = H.subBadge.classList.contains('is-airspent') && !!H.subBadge.querySelector('.iw-dash-air');
      W.set(me, {}); for (let i = 0; i < 90 && !me.grounded; i++) step(1); step(2);
      const pipLanded = !H.subBadge.classList.contains('is-airspent');
      R('HUD: the reticle dims while dashing; a refused press shows "CAN\'T USE" with its reason line ("Already dashing"); the sub badge greys with an AIR pip while the air dash is spent, back on landing',
        lockedRet && unlocked && why === 'Already dashing' && whyOn && pipAir && pipLanded, { lockedRet, unlocked, why, whyOn, pipAir, pipLanded });
      W.delete(me);
    }

    // ================================================================================== 7. bots
    // ================================================================================== [b5-int3] reach: what the stage audit found
    // (dash-reach.js, the lead's rules for its finds) — a kid caught inside a thin slab is never put out through its top;
    // a kid on a roof slides off by the way that gets it off soonest
    if (run('reach')) {
      home();
      // a swim jump under a 0.45 m slab whose underside a swimming squid's jump just clears (2.25 m), the dash pressed at
      // frame 18 under it (the squid turns kid: its body is inside the slab) — lockgate's loading-bay canopy, where the kid
      // went up through the canopy onto its top (2.71 m over its start); and the same with fire pressed instead (no dash)
      const Z = 30, slab = () => { unbox(); box(4, 2.475, Z, 2.5, 0.225, 3); };
      const swimUnder = (press) => {
        slab(); G.paint.clear?.();
        for (const x of [-2, -0.8, 0.4]) G.paint.splat(V(x, 0.1, Z), 1.0, me.team, { instant: true, seed: 0.5 });
        put(me, -1.5, 0, Z, Math.PI / 2);
        sim(me, 2, 1 / 60, { squid: true });
        me.vel.set(PLAYER.swimSpeed, 0, 0);
        let top = 0, onSlab = false;
        sim(me, 120, 1 / 60, (i) => ({ move: [1, 0], jump: i < 2, squid: i < 18, sub: press === 'sub' && i === 18, fire: press === 'fire' && i >= 18 && i < 22 }), () => { top = Math.max(top, me.pos.y); if (me.grounded && blocks.some((b) => b.id === me.ground.block)) onSlab = true; });
        const r = { press, top: r2(top), onSlab, end: [r2(me.pos.x), r2(me.pos.y), r2(me.pos.z)], grounded: me.grounded };
        unbox(); G.paint.clear?.();
        return r;
      };
      const under = [swimUnder('sub'), swimUnder('fire')];
      R('a swim jump under a 0.45 m slab (its underside 2.25 m up, the top 2.7), a kid on the press frame inside it — by the dash (frame 18) or by fire: never put out through its top (never on it, never over its underside)', under.every((r) => !r.onSlab && r.top < 2.25), under);
      // a kid falling onto a 0.12 m slab 1 m up at 1/24 s a frame, from 3 m over it: it lands on it (the landing still holds)
      unbox(); box(0, 0.94, Z, 1.5, 0.06, 1.5);
      put(me, 0, 4, Z, 0);
      sim(me, 48, 1 / 24, {});
      const land = { y: r2(me.pos.y), grounded: me.grounded, on: me.grounded && blocks.some((b) => b.id === me.ground.block) };
      unbox();
      R('a kid falling 3 m onto a 0.12 m slab at 1/24 s a frame lands on it (the inside rule leaves landings alone)', land.on && Math.abs(land.y - 1.0) < 0.03, land);
      // a roof slide: a 2 m wide roof strip (top 2.4) in two blocks, a wall along its west side, a wall across its south end,
      // a tall block along most of its east side but the last 0.4 m of the south block and the north block (the street below,
      // 2.4 m down). Landed on the north block 0.4 m from its south end — the nearest edge, south, runs on onto the other
      // roof block to the end wall — it slides off east, within 1 s (calamari's hill-wall, still on it after 3 s)
      const roofTrial = () => {
        unbox();
        box(0, 1.2, Z + 2.35, 1, 1.2, 2.35, 0, { roof: true });          // north roof block, z 30 … 34.7
        box(0, 1.2, Z - 2.2, 1, 1.2, 2.2, 0, { roof: true });            // south roof block, z 25.6 … 30
        box(-1.5, 2.5, Z, 0.5, 2.5, 5.2);                                // the west wall (to 5 m)
        box(0, 2.5, Z - 4.9, 2, 2.5, 0.5);                               // the south end wall
        box(1.5, 2.5, Z - 2.4, 0.5, 2.5, 2.0);                           // the east block along the south roof, z 25.6 … 29.6
        put(me, 0.1, 2.42, Z + 0.4, 0);
        let offT = null, t = 0;
        sim(me, 300, 1 / 60, {}, () => { t += 1 / 60; const onR = me.grounded && me.ground.block >= 0 && L.blocks[me.ground.block]?.roof; if (offT == null && !onR && t > 0.1) { offT = t; return false; } });
        const r = { offT: offT == null ? null : r2(offT), at: [r2(me.pos.x), r2(me.pos.y), r2(me.pos.z)] };
        unbox();
        return r;
      };
      const rs = roofTrial();
      R('a kid landed on a roof slides off by the way that gets it off soonest: off a 2 m wide roof strip within 1 s, where its nearest edge runs on along the next roof block into a wall', rs.offT != null && rs.offT <= 1.0, rs);
      // [b5-int3] a row of rail tops that are roofs 0.75 m apart (crossmarket's balconettes: 1.5 × 0.42, top 2.4 here), a wall
      // behind them, the street 2.4 m below in front: a kid on the end of one, its centre 0.13 m out over the gap (its feet
      // held by the footprint), slides off their open front to the street — at 1/24 s a frame it went from one end to the
      // next one's and back for 3 s (dash-reach.js 1/24: the way off along the row looked clear 0.3 m on, over the gap)
      const balcTrial = (dt) => {
        unbox(); const hr0 = L.hasRails; L.hasRails = true;
        box(-1.125, 1.88, Z, 0.75, 0.52, 0.21, 0, { rail: true, roof: true });
        box(1.125, 1.88, Z, 0.75, 0.52, 0.21, 0, { rail: true, roof: true });
        box(0, 2.5, Z + 0.71, 3, 2.5, 0.5);                              // the building face behind them
        put(me, -0.245, 2.42, Z - 0.17, 0);
        let downT = null, t = 0;
        sim(me, Math.round(3 / dt), dt, {}, () => { t += dt; if (downT == null && me.pos.y < 1.2) { downT = t; return false; } });
        const r = { dt: Math.round(1 / dt), downT: downT == null ? null : r2(downT), at: [r2(me.pos.x), r2(me.pos.y), r2(me.pos.z)] };
        L.hasRails = hr0; unbox();
        return r;
      };
      const bal24 = balcTrial(1 / 24), bal60 = balcTrial(1 / 60);
      R(`a kid on the end of one of a row of rail-top roofs 0.75 m apart (crossmarket's balconettes) is down in the street within 1 s — at 1/24 s a frame ${bal24.downT} s, at 1/60 ${bal60.downT} s`, bal24.downT != null && bal24.downT <= 1.0 && bal60.downT != null && bal60.downT <= 1.0, { bal24, bal60 });
    }
    if (run('bots')) {
      home();
      const B = foes[0], E = me;   // B dashes; E (us) is its foe, our brain scripted (we never shoot)
      delete B.bot.update;          // B's own brain
      B.setSub('dash'); B.setWeapon('shooter');
      const fresh = () => { const b = B.bot; b._wasDead = false; b.thr = null; b.thrCand = null; b._thrMem.clear(); b._dash = null; b.thrAct = null; b.target = null; b.seeTimer = 0; b.sp?.reset?.(); b.path = null; b.thrScanT = Math.random() * 0.25; };
      const TOR = SUB_KITS.torpedo;
      // a Torpedo launched at it from 5 m (5 m/s and speeding up, homing; one it can't shoot down: dodging is the only
      // answer), while it duels us (we can't be splatted, so the duel never ends mid-trial). The spec's D10.7 case is a
      // threat noticed with < 0.5 s left: the bot notices it by its own threat scan and reaction time. Each trial runs
      // twice, the dash on and off, on the same seeded random stream (Math.random: the scan phase, the reaction time), each
      // from a clean slate (no ink, no shots, no devices, a new brain, the match clock topped up: nothing of the last trial
      // carries over), and is judged over the trials noticed with < 0.5 s left. Judged where the dash is the answer: the
      // bot standing in our ink (a 5 m disc), where its footwork is the enemy-ink crawl and the dash isn't slowed (D1.5):
      // the spec's ≥ 70 % clear with the dash against ≤ 40 % without. On clean ground the bot's own sidestep already clears
      // most late Torpedoes (the homing turns 1.9 rad/s): those numbers are told beside it. (Round 1 measured 24–63 %
      // without the dash in trials that started in the last trial's Torpedo ink)
      const seeded = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
      const R0 = Math.random;
      const torTrial = (dash, i, inked) => {
        Math.random = seeded(1000 + i * 7919);
        try {
          DK.DASH_AI.enabled = dash;
          m.time = Math.max(m.time, 600);                         // (bots think only while the match plays)
          G.paint.clear(); G.fx?.clear?.(); G.projectiles.clear?.(); for (const k in SUB_KITS) SUB_KITS[k].clear?.();
          B.bot = new BotBrain(B, B.bot.diff?.id || 'normal');
          put(B, 0, 0, 0, 0); B.ink = 100; fresh();
          put(E, 0, 0, 8, Math.PI); E.invuln = 99; W.set(E, {});
          if (inked) for (let x = -5; x <= 5; x += 2) for (let z = -5; z <= 5; z += 2) if (Math.hypot(x, z) <= 5.5) G.paint.splat(V(x, 0.05, z), 1.8, E.team, { instant: true, seed: 0.5 });
          E.setSub('torpedo');
          const before = new Set(TOR._list);
          E.aimYaw = Math.PI; E.aimPitch = 0.2; TOR.use(G.subs, E, SUBS.torpedo);
          const t = TOR._list.find((x) => !before.has(x));
          const ang = ((i % 20) - 9.5) * 0.06;   // (a spread of approach lines, ±0.57 rad)
          t.pos.set(5 * Math.sin(ang), 1.0, 5 * Math.cos(ang)); t.vel.set(0, 0, 0); t.hover.copy(t.pos); t.target = B;
          t.state = 'launch'; t.t = 0; t.speed = 5; t.dir.set(-Math.sin(ang), -0.05, -Math.cos(ang)).normalize();
          TOR.threats([]); Object.defineProperty(t.thr, 'shootable', { get: () => false, configurable: true });
          const e0 = ev.length, d0 = THREAT_STATS.dashDodge;
          let noticed = -1, thrIn = null, onInk = null;
          for (let f = 0; f < 210 && t.state !== 'dead'; f++) { step(1); if (onInk === null) onInk = B.groundTeam === 2; if (noticed < 0 && B.bot.thr === t.thr) { noticed = f; thrIn = r2(B.bot.thrIn); } }
          step(10);
          return { noticed, thrIn, onInk, clear: !since(e0, 'hit', (e) => e.victim === B && e.weaponId === 'torpedo').length, dashed: THREAT_STATS.dashDodge > d0 };
        } finally { Math.random = R0; }
      };
      const torSet = (n, inked) => {
        const T = []; for (let i = 0; i < n; i++) T.push({ on: torTrial(true, i, inked), off: torTrial(false, i, inked) });
        const nt = T.filter((x) => x.on.noticed >= 0 && x.on.thrIn < 0.5);
        return { n: nt.length, on: r2(nt.filter((x) => x.on.clear).length / Math.max(1, nt.length)), off: r2(nt.filter((x) => x.off.clear).length / Math.max(1, nt.length)), dashed: nt.filter((x) => x.on.dashed).length,
          saved: nt.filter((x) => x.on.clear && !x.off.clear).length, worse: nt.filter((x) => !x.on.clear && x.off.clear).length, sameNotice: T.filter((x) => x.on.noticed === x.off.noticed).length, onInk: T.every((x) => x.on.onInk === inked), thrIn: nt.map((x) => x.on.thrIn) };
      };
      const tI = torSet(40, true), tC = torSet(20, false);
      E.invuln = 0; G.paint.clear();
      R(`a bot in our ink with a Torpedo launched at it from 5 m, noticed with < 0.5 s left (${tI.n} of 40 paired trials), dashes it off (once per threat, on any frame it's within 0.6 s, along the threat block's heading) in ${tI.dashed} and comes out clear in ${Math.round(tI.on * 100)} % (target ≥ 70 %); the same trials with the dash off: ${Math.round(tI.off * 100)} % (target ≤ 40 %). On clean ground (told): ${Math.round(tC.on * 100)} % with the dash, ${Math.round(tC.off * 100)} % without (${tC.n} of 20)`,
        tI.onInk && tI.n >= 15 && tI.on >= 0.7 && tI.off <= 0.4 && tI.dashed >= 0.7 * tI.n, { inOurInk: tI, cleanGround: tC });
      // a Splat Bomb landing at its feet (fuse 0.62 s: noticed, its escape has < 0.5 s): it dashes along its escape heading
      // and comes out clear; with the dash off it can't outrun the blast
      const log = [];
      const act0 = K.botAct;
      K.botAct = function (b, ...rest) { const had = b.dashDir; const r = act0.call(this, b, ...rest); if (!had && b.dashDir && b.a === B) log.push({ esc: b.sp?.esc ? b.sp.esc.yaw : null, yaw: Math.atan2(b.dashDir.x, b.dashDir.z) }); return r; };
      const bombTrial = (dash, i) => {
        DK.DASH_AI.enabled = dash;
        m.time = Math.max(m.time, 600); G.paint.clear(); G.fx?.clear?.(); G.projectiles.clear?.(); for (const k in SUB_KITS) SUB_KITS[k].clear?.();   // (a clean slate: no ink of the last blast underfoot)
        put(B, 0, 0, 0, i * 0.7); B.ink = 100; fresh();
        put(E, 0, 0, 8, Math.PI); W.set(E, {});
        P.throwBomb(E);
        const b = P.bombs[P.bombs.length - 1];
        b.pos.set(0.3 * Math.cos(i), 0.2, 0.3 * Math.sin(i)); b.vel.set(0, 0, 0); b.fuse = 0.62;
        const n0 = log.length, e0 = ev.length;
        for (let f = 0; f < 60 && P.bombs.includes(b); f++) step(1);
        step(5);
        const L1 = log.slice(n0)[0];
        return { dashed: !!L1, along: L1 && L1.esc !== null ? r2(Math.abs(Math.atan2(Math.sin(L1.yaw - L1.esc), Math.cos(L1.yaw - L1.esc)))) : null, clear: !since(e0, 'hit', (e) => e.victim === B && e.weaponId === 'bomb').length };
      };
      const bOn = [], bOff = [];
      for (let i = 0; i < 20; i++) { bOn.push(bombTrial(true, i)); bOff.push(bombTrial(false, i)); }
      K.botAct = act0; DK.DASH_AI.enabled = true;
      const along = bOn.filter((r) => r.dashed && r.along !== null && r.along < 0.6).length, cOn = bOn.filter((r) => r.clear).length, cOff = bOff.filter((r) => r.clear).length;
      R(`a bot inside a Splat Bomb's danger disc (escaping, tIn < 0.5 s) dashes along its escape heading in ${along} of 20 (target ≥ 14) and comes out clear in ${cOn} of 20 (≥ 14); with the dash off, ${cOff} of 20 (≤ 8)`,
        along >= 14 && cOn >= 14 && cOff <= 8, { on: bOn, offClear: cOff });
      stub(B);
    }
  } catch (e) {
    R('HARNESS', false, { error: String(e && e.stack || e).slice(0, 600) });
  } finally {
    offs.forEach((f) => f());
    unbox();
    DK.DASH_AI.enabled = true;
    delete G.objTargets;
    for (const [a, [s, w]] of subs0) { a.setSub(s); a.setWeapon(w); }
    for (const a of m.actors) if (a.bot) delete a.bot.update;
  }
  return out;
})();
