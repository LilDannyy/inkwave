// [b5-sub-glide] The Glide Bomb (src/game/kits/glide.js; tools/botlab/jobs/batch5/subs/SPEC.md §A, A10's list):
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-glide.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=reach,lane,bounce,ledge,blast,shot,fizzle,guide,bots,stubs,lock,crush,boss,start,perf,more' for a part
// Staged on testbox (a flat deck, top y 0, sea all round; one wall x 14…15, z −8…8); test blocks are moving-block
// colliders (Level.addDynamic) parked out of the way between scenes. Everyone else's brain is stubbed unless a scene
// frees one; hits are logged, not dealt (nobody is splatted, so scenes stay alike), unless a scene says so.
//  1 reach: a tap (held 0.1 s) slides 15.4 ± 0.5 m and blows 2.40 s ± 1 frame after the release; holds of 0.75 / 1.35 /
//    1.95 s slide 13.1 / 9.8 / 5.5 m (± 0.5) with radii 2.53 / 2.87 / 3.2 (± 0.02, the bomb:explode radius); never in
//    the hand; the cook records [5, 1 / 2 / 3] at held 0.75 / 1.35 / 1.95 s; holding 4 s it slips at held 2.95 s ± 1
//    frame (ink −65, a full-cook slide), then no second stone, no "Can't use", no second payment; the tap at dt 1/60,
//    1/30, 1/24 stops within 0.05 m of the same spot (the fixed step)
//  2 lane: ≥ 90 % of the ground track inked, the lane ≥ 1.0 m wide at the middle of the slide
//  3 bounce: off the wall at 45° it leaves at 39° ± 3° with speed × 0.83 ± 0.03; its body's circle, not its centre line,
//    meets walls: at 6° / 10° / 20° to the wall never more than 0.03 m of it in, a slide along the wall 0.15 m off its
//    face pushed clear on its first step (no clonk), a graze 0.2 m off a corner (the wall's end, a crate turned 30°)
//    bounces away; a 0.4 m riser bounces it, a 0.25 m step it rides over; off an enemy kid × 0.6 (e 0.5), no damage on
//    contact; through a teammate it passes; off an enemy Drip Curtain and a Scrap Sentry (a stand-in device) it bounces;
//    a moving block running into it carries it off
//  4 ledge: off a ledge it falls and keeps sliding; into the sea: no blast, no paint after the plop
//  5 blast: 180 within 0.8 m, the k² falloff, 35 at R; none behind a wall; enemy devices take 40 (uncooked) → 60 (full)
//  6 shot: popped by 2 Spritzer shots — a puff, no blast, 'device:hit' ×2 and one 'device:down'; a teammate's do nothing
//  7 fizzle: splatted while cooking — a fizzle, no ink, [5, 0]; a runner reset() mid-cook the same within 0.15 s + 1
//    frame, no stone; diving while cooking the same
//  8 guide: its end ring within 0.3 m of where the real stone stops, 6 throws with 0–2 bounces; grey without the ink
//  9 bots: a fighting bot throws at a foe 10 m off, its stop within 2 m of the foe's (led) spot; a foe by the deck's edge
//    running at it: the led slide would leave the deck — the bot throws at where they stand (or holds off), no stone sinks
//    or blows over the sea; a bot in a predicted stop disc is clear of R at the blast (or popped it) with no damage
// 11 stubs: a stand-in lava (surface 0.5 m over x > 10): it sinks there, no blast; caldera's case (G.level.liquidY and
//    G.match.lava over the same half): one hiss, no water plop; a module liquid alone: a plop, no hiss; a stand-in Roe
//    Shell (r 1.6): it bounces off it like a wall (39° ± 3°) and its blast calls the shell's splash once with 180 / 35 and
//    the cook's R
// 12 lock: the Spritzer fires no shot from held 0.15 s + 1 frame on; a charger's charge in progress is dropped with no
//    shot and the stone keeps cooking; a tap never interrupts the fire; a barrage's stone never cooks (R 2.2) and never
//    stops the main weapon
//    crush: crushIn (the real one after the merge, else the sentry / bobber branches' kit loop + the crushable line) every
//    frame of a moving deck / pillar: a stone riding the deck rides on, one hit by the pillar is knocked on — never ended;
//    the shell's sphere and a lava sweep: nothing
//    boss: Boss Battle's throw (a stand-in boss): planned only when the slide stops in reach of its body, held to that
//    cook, blows within R of it; refused over the sea; let go early under a telegraph
//    start: a mid-air release drops from the hand; a wall closer than 0.5 m: set down at the feet; [4] every 0.25 s and
//    at every bounce; a 17° ramp followed
//    perf: devices() asked once a frame / a run, not per step; the guide's points pooled
//    more: the reticle dims while locked, the HUD cook bar and the reach in the sub chip, the hand's lamps / glow, the
//    first two taps' hint, the Mega Stamp's guard smash, a splatted owner's stone still blows, a Drainbow pass halves
//    it, a Bubble Guard takes 0, a stone on a moving floor rides it
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, WEAPONS, PLAYER } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { SPECIAL_STATS } = await import('./src/game/botSpecials.js');
  const { THREAT_STATS } = await import('./src/game/bots.js');
  const { DEPLOY_STATS } = await import('./src/game/deployables.js');
  const { GLIDE_STATS } = await import('./src/game/kits/glide.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, K = SUB_KITS.glide, MATH = K.math, S = SUBS.glide;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  let DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s / DT)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const until = (fn, s = 6) => { const n = Math.round(s / DT); for (let i = 0; i < n; i++) { if (fn()) return true; frame(); } return !!fn(); };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], mate = mates[0];
  // the local kid's intent is ours: hold / fire / squid; everyone else stands still (their weapons quiet)
  const ctl = { sub: false, fire: false, squid: false };
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) a.bot.update = () => { zero(a); if (a === me) { a.intent.sub = ctl.sub; a.intent.fire = ctl.fire; a.intent.squid = ctl.squid; } }; };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const HOME = V(-20, 0, 36);
  const parkAll = () => others.forEach((a, i) => put(a, V(-24 + (i % 4) * 2, 0, 38 - Math.floor(i / 4) * 2)));
  // hits logged, not dealt
  const hit0 = P.applyHit, hits = [];
  let dealHits = false;
  P.applyHit = function (att, vic, dmg, wid, shot, from) { hits.push({ t: G.time, att, vic, dmg: r2(dmg), wid, shot: shot || null }); if (dealHits) return hit0.apply(this, arguments); };
  // paint calls (who / where)
  const splat0 = G.paint.splat, splats = [];
  G.paint.splat = function (c, r, team, o) { const a = splat0.apply(this, arguments); if (!o?.cosmetic) splats.push({ t: G.time, x: c.x, y: c.y, z: c.z, r, team, a }); return a; };
  // events
  const evs = [];
  const EV = ['bomb:explode', 'sub:use', 'sub:cantuse', 'glide:bounce', 'glide:end', 'glide:fizzle', 'glide:slip', 'sub:charge', 'device:hit', 'device:down', 'weapon:fire'];
  const offs = EV.map((n) => on(n, (e) => evs.push({ t: G.time, n, e })));
  const ev = (n, t0 = -1) => evs.filter((x) => x.n === n && x.t >= t0);
  // the online stand-in (records what the owner sends; nothing leaves the page)
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {}, recStage() {},
    recKit: (a, kind, data) => sent.push({ t: G.time, kind, data: JSON.parse(JSON.stringify(data)) }), sendDevHit: (o, kind, id, d, by) => sent.push({ dev: kind, id, d, by: by?.nid }),
    shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  // test blocks (moving-block colliders; parked far below when not in use)
  const L = G.level, blocks = [];
  const box = (x0, x1, y0, y1, z0, z1) => { const b = L.addDynamic({ tag: 'glidetest' + blocks.length }); L.moveDynamic(b, V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), V((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2)); b.dp.set(0, 0, 0); blocks.push(b); return b; };
  const park = () => { for (const b of blocks) { L.moveDynamic(b, V(0, -300 - b.id, 0), V(0.1, 0.1, 0.1)); b.dp.set(0, 0, 0); b.solid = false; } };
  const reset = () => {
    hook = null; DT = 1 / 60; ctl.sub = ctl.fire = ctl.squid = false;
    G.subs.clear(); P.clear(); G.paint.clear?.(); park();
    for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = PLAYER.hp; a.invuln = 0; a.status.shield = 0; zero(a); a.form = 'kid'; a.superJumpState = null; if (a.specialActive) G.specials.end?.(a, 'test'); a.specialActive = null; stub(a); a.weaponRunner.reset(); }
    parkAll(); put(me, HOME, Math.PI); me.ink = PLAYER.inkMax; me.setSub('glide');
    step(0.12);
    hits.length = 0; splats.length = 0; evs.length = 0; sent.length = 0;
  };
  const items = () => K.items.filter((x) => x.state !== 'dead');
  const lastItem = () => K.items[K.items.length - 1];
  const inkAt = (x, z) => { const h = G.physics.raycast(V(x, 1, z), V(0, -1, 0), 3); return h && h.hit ? G.paint.sample(h.face, h.u, h.v) : -1; };
  // hold the sub for `held` s (frames at DT), then let go; returns the stone made (or null) and the release time
  const throwHeld = (held, opts = {}) => {
    ctl.sub = true; const n = Math.max(1, Math.round(held / DT));
    for (let i = 0; i < n; i++) { if (opts.during) opts.during(i); frame(); }
    const before = K.items.length;
    ctl.sub = false; frame();
    return { it: K.items.length > before ? lastItem() : null, t: G.time };
  };
  // slide a stone to its end; returns { blast: { x, z, r, t } | null, end }
  const runOut = (it, s = 4) => { until(() => it.state === 'dead', s); const b = ev('bomb:explode').filter((x) => x.e.kind === 'glide').pop(); return b ? { x: b.e.pos.x, y: b.e.pos.y, z: b.e.pos.z, r: b.e.radius, t: b.t } : null; };

  try {
    // ============================================================================================ 1 reach, cook, slip
    if (want('reach')) {
      reset(); netOn();
      const rows = [];
      for (const [held, reach, rad] of [[0.1, 15.4, 2.2], [0.75, 13.1, 2.53], [1.35, 9.8, 2.87], [1.95, 5.5, 3.2]]) {
        reset(); netOn(); put(me, V(-8, 0, -36), 0); step(0.05);
        const ink0 = me.ink;
        const { it, t } = throwHeld(held);
        // (where it was set down: its release record; the release frame is the one the button came up in — its first step)
        const r0 = sent.find((x) => x.kind === 'glide' && x.data[0] === 0), sp = r0 ? V(r0.data[2], r0.data[3], r0.data[4]) : null, b = it ? runOut(it) : null;
        const inHand = ev('bomb:explode').filter((x) => x.t < t).length;
        const levels = sent.filter((s) => s.kind === 'glide' && s.data[0] === 5).map((s) => s.data[1]);
        rows.push({ held, reach: b && sp ? r2(Math.hypot(b.x - sp.x, b.z - sp.z)) : null, want: reach, r: b ? r3(b.r) : null, wantR: rad, fuse: b ? b.t - (t - DT) : null, wantFuse: 2.4 - Math.max(0, held - 0.15), inHand, levels, paid: r2(ink0 - me.ink) });
      }
      const fr = 1 / 60 + 1e-6;
      R('a tap slides 15.4 ± 0.5 m and blows 2.40 s ± 1 frame after the release; holds of 0.75 / 1.35 / 1.95 s slide 13.1 / 9.8 / 5.5 m (± 0.5) and blow at radii 2.53 / 2.87 / 3.2 (± 0.02); never in the hand',
        rows.every((r) => r.reach != null && Math.abs(r.reach - r.want) <= 0.5 && Math.abs(r.r - r.wantR) <= 0.02 && Math.abs(r.fuse - r.wantFuse) <= fr && r.inHand === 0), rows.map((r) => ({ ...r, fuse: r.fuse && r3(r.fuse), wantFuse: r3(r.wantFuse) })));
      R('the cook in the hand is recorded as levels [5, 1], [5, 2], [5, 3] (cook 0.6 / 1.2 / 1.8 s), a tap none', rows[0].levels.length === 0 && rows[1].levels.join() === '1' && rows[2].levels.join() === '1,2' && rows[3].levels.join() === '1,2,3', rows.map((r) => [r.held, r.levels]));
      // the slip: held 4 s
      reset(); netOn(); put(me, V(-8, 0, -36), 0); step(0.05);
      const ink0 = me.ink, t0 = G.time + DT; let slipAt = null, inkMin = me.ink, it = null;   // (t0: the press frame — held counts from it)
      ctl.sub = true;
      step(4, () => { if (slipAt == null && ev('sub:use', t0).length) { slipAt = G.time - t0; it = lastItem(); } inkMin = Math.min(inkMin, me.ink); });
      ctl.sub = false; step(0.3);
      const uses = ev('sub:use', t0).length, cant = ev('sub:cantuse', t0).length;
      R('held 4 s: it slips out at held 2.95 s ± 1 frame — 65 ink paid, a full-cook slide (R 3.2, fuse 0.6) — and the rest of the hold, and its release, make no second stone, no "Can\'t use", no second payment',
        slipAt != null && Math.abs(slipAt - 2.95) <= fr + 1e-3 && it && Math.abs(it.R - 3.2) < 0.02 && Math.abs(it.fuse0 - 0.6) < 0.02 && uses === 1 && cant === 0 && Math.abs(ink0 - inkMin - 65) < 1.5 && ev('glide:slip', t0).length === 1,
        { slipAt: slipAt && r3(slipAt), R: it && r3(it.R), fuse: it && r3(it.fuse0), uses, cant, paid: r2(ink0 - inkMin) });
      // the fixed step: the same tap at dt 1/60, 1/30, 1/24
      const stops = [];
      for (const d of [1 / 60, 1 / 30, 1 / 24]) {
        reset(); put(me, V(-8, 0, -36), 0); step(0.05);
        DT = d;
        const { it: s1 } = throwHeld(0.1);
        const b = s1 ? runOut(s1) : null;
        stops.push(b ? [r3(b.x), r3(b.z)] : null);
      }
      DT = 1 / 60;
      const spread = stops.every(Boolean) ? Math.max(...stops.map((s) => Math.hypot(s[0] - stops[0][0], s[1] - stops[0][1]))) : 99;
      R('the fixed step: a tap at dt 1/60, 1/30 and 1/24 stops within 0.05 m of the same spot', spread <= 0.05, { stops, spread: r3(spread) });
      netOff();
    }

    // ============================================================================================ 2 the lane
    if (want('lane')) {
      reset(); put(me, V(0, 0, -36), 0); step(0.05);
      const { it } = throwHeld(0.1);
      const sp = it.p.clone(); runOut(it);
      const end = splats.filter((s) => s.r > 1).pop();   // (the blast's main splat)
      let n = 0, own = 0;
      for (let z = sp.z; z <= (end ? end.z : sp.z + 15); z += 0.1) { n++; if (inkAt(sp.x, z) === me.team + 1) own++; }
      // (the lane's width at the middle of the slide: the median of 7 cross-sections over its middle metre, sampled every
      // 1 cm — the ink grid's cells are 0.25 m, so a full metre reads 0.99 with the sampling step)
      const widths = [];
      for (let k = -3; k <= 3; k++) {
        const zm = sp.z + 7.5 + k * 0.17;
        let lo = 0, hi = 0;
        for (let x = 0; x < 2; x += 0.01) { if (inkAt(sp.x + x, zm) === me.team + 1) hi = x; else break; }
        for (let x = 0; x < 2; x += 0.01) { if (inkAt(sp.x - x, zm) === me.team + 1) lo = x; else break; }
        widths.push(lo + hi);
      }
      widths.sort((a, b) => a - b);
      const wMid = widths[3];
      R('its lane: ≥ 90 % of the ground track inked, ≥ 1.0 m wide at the middle of the slide (a splat of 0.55 m every 0.35 m)', own / n >= 0.9 && wMid >= 1.0 - 0.015, { track: r2(own / n), width: r2(wMid), widths: widths.map(r2), trailSplats: splats.filter((s) => Math.abs(s.r - S.trailRadius) < 1e-6).length });
    }

    // ============================================================================================ 3 bounces
    if (want('bounce')) {
      // the testbox wall (x 14, normal −x) at 45°
      reset(); put(me, V(6, 0, -6), Math.PI / 4); step(0.05);
      let vb = null, va = null, pv = null;
      const { it } = throwHeld(0.1);
      until(() => { if (ev('glide:bounce').length) return true; pv = it.v.clone(); return false; }, 3);
      vb = pv; va = it.v.clone();
      const bk = ev('glide:bounce')[0];
      const ang = (v) => Math.atan2(Math.abs(v.x), Math.abs(v.z)) * 180 / Math.PI;   // (from the wall's plane: the wall runs along z)
      const ratio = vb && va ? Math.hypot(va.x, va.z) / Math.hypot(vb.x, vb.z) : 0;
      R('off the wall at 45° it leaves at 39° ± 3° (normal part × 0.8) with speed × 0.83 ± 0.03', bk && vb && Math.abs(ang(va) - 38.66) <= 3 && Math.abs(ratio - 0.83) <= 0.03 && va.x < 0,
        { kind: bk?.e.kind, inDeg: vb && r2(ang(vb)), outDeg: va && r2(ang(va)), ratio: r3(ratio) });
      // its body's circle (bodyRadius round its axis), not its centre line, meets the wall: shallow bounces at 6°, 10°, 20°
      // to the wall's plane, each meeting the wall about z 0 — its body never more than 0.03 m into the wall (every frame,
      // the face at x 14). (Its centre ray alone sees a 6° wall only 0.05 m off: the body was 0.23 m in — the review's probe)
      const RB = S.bodyRadius, shallow = [];
      // (the 2-D distance from p to a box's footprint — centre, half extents, turned yaw as Level.moveDynamic; < 0 inside)
      const boxDist = (p, cx, cz, hx, hz, yw = 0) => { const c = Math.cos(yw), s2 = Math.sin(yw), rx = p.x - cx, rz = p.z - cz, u = rx * c - rz * s2, w = rx * s2 + rz * c;
        if (Math.abs(u) < hx && Math.abs(w) < hz) return -Math.min(hx - Math.abs(u), hz - Math.abs(w));
        return Math.hypot(u - Math.max(-hx, Math.min(hx, u)), w - Math.max(-hz, Math.min(hz, w))); };
      for (const deg of [6, 10, 20]) {
        const th = deg * Math.PI / 180, x0 = 14 - RB - 6.5 * Math.tan(th) - 0.5 * Math.sin(th);
        reset(); put(me, V(x0, 0, -7), th); step(0.05);
        const { it: sw } = throwHeld(0.1);
        let deep = -9, first = null, after = 0;
        until(() => { deep = Math.max(deep, sw.p.x + RB - 14); if (!first && ev('glide:bounce').length) first = { z: r2(sw.p.z), vx: r2(sw.v.x) }; if (first) after++; return sw.state === 'dead' || sw.p.z > 7.5 || after > 30; }, 3);
        shallow.push({ deg, bounced: !!first && first.vx < 0, kind: ev('glide:bounce')[0]?.e.kind, deepest: r3(deep), at: first });
      }
      R('shallow bounces (6°, 10°, 20° to the wall): it bounces off the wall with its body\'s circle — never more than 0.03 m of it into the wall', shallow.every((r) => r.bounced && r.kind === 'wall' && r.deepest <= 0.03), shallow);
      // sliding parallel to the wall with its centre 0.15 m from the face (its body half in it): pushed clear on its first
      // step, then on along the wall clear of it (grazing it: no clonk)
      reset(); put(me, V(10, 0, -7), 0); step(0.05);
      const { it: sp } = throwHeld(0.1);
      sp.p.set(14 - 0.15, 0, -7.5); sp.v.set(0, 0, 8);
      frame();
      const x1 = sp.p.x, zp = sp.p.z; let deepP = -9;
      step(0.9, () => { deepP = Math.max(deepP, sp.p.x + RB - 14); return sp.state !== 'dead' && sp.p.z < 7.5; });
      R('sliding along the wall with its centre 0.15 m off the face: pushed clear on its first step (its body out of the wall), then on along it, never back in, no clonk',
        x1 + RB - 14 <= 0.002 && deepP <= 0.002 && sp.p.z - zp > 4 && ev('glide:bounce').length === 0, { afterFirstStep: r3(x1 + RB - 14), deepest: r3(deepP), slid: r2(sp.p.z - zp), bounces: ev('glide:bounce').length });
      // a graze 0.2 m off a corner: the testbox wall's end (x 14…15, z −8: static level geometry), and a 1 m crate turned
      // 30° (an oriented box). Its centre line misses each by 0.2 m; its body's circle strikes the corner and bounces away
      // from the block (vx < 0), never more than 0.03 m of it inside
      const corner = [];
      {
        reset(); put(me, V(14 - 0.2, 0, -14), 0); step(0.05);
        const { it: sc } = throwHeld(0.1);
        let dMin = 9; until(() => { dMin = Math.min(dMin, boxDist(sc.p, 14.5, 0, 0.5, 8)); return sc.state === 'dead'; }, 3);
        const b0 = ev('glide:bounce')[0];
        corner.push({ what: 'the wall\'s end (x 14, z −8)', bounced: !!b0 && b0.e.kind === 'wall', vx: r2(sc.v.x), clearance: r3(dMin), at: b0 && [r2(b0.e.pos.x), r2(b0.e.pos.z)] });
      }
      {
        reset();
        const cx = -2, cz = -18, yawC = Math.PI / 6, hC = 0.5, cb = box(-0.1, 0.1, 0, 0.1, -0.1, 0.1);
        L.moveDynamic(cb, V(cx, 0.5, cz), V(hC, 0.5, hC), yawC); cb.dp.set(0, 0, 0); cb.solid = true;
        // (its corner furthest −x: its local corners in the world — local x along (cos, −sin), local z along (sin, cos))
        const cs = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([i, k]) => V(cx + (Math.cos(yawC) * i + Math.sin(yawC) * k) * hC, 0, cz + (-Math.sin(yawC) * i + Math.cos(yawC) * k) * hC));
        const cn = cs.reduce((m, q) => (q.x < m.x ? q : m));
        put(me, V(cn.x - 0.2, 0, cz - 9), 0); step(0.1);
        const { it: sk } = throwHeld(0.1);
        let dMin = 9; until(() => { dMin = Math.min(dMin, boxDist(sk.p, cx, cz, hC, hC, yawC)); return sk.state === 'dead'; }, 3);
        const b0 = ev('glide:bounce')[0];
        corner.push({ what: 'a 1 m crate turned 30°', bounced: !!b0 && (b0.e.kind === 'wall' || b0.e.kind === 'mover'), vx: r2(sk.v.x), clearance: r3(dMin), corner: [r2(cn.x), r2(cn.z)], at: b0 && [r2(b0.e.pos.x), r2(b0.e.pos.z)] });
      }
      R('a graze 0.2 m off a corner (the wall\'s end; a crate turned 30°): its body\'s circle strikes the corner and bounces away from it (never more than 0.03 m inside)', corner.every((r) => r.bounced && r.vx < 0 && r.clearance >= RB - 0.03), corner);
      // a 0.25 m step (rides up), then a 0.4 m riser (bounces)
      reset();
      box(-6, 6, 0, 0.25, -30, -26); box(-6, 6, 0, 0.4, -21, -19);
      put(me, V(0, 0, -34), 0); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      let maxY = 0, vzBack = false;
      until(() => { maxY = Math.max(maxY, s2.p.y); if (s2.v.z < 0) vzBack = true; return s2.state === 'dead' || vzBack; }, 3);
      R('a 0.25 m step: it rides up onto it; a 0.4 m riser: it bounces back', Math.abs(maxY - 0.25) < 0.02 && vzBack && ev('glide:bounce')[0]?.e.kind !== 'kid', { maxY: r3(maxY), back: vzBack, at: r2(s2.p.z) });
      // an enemy kid: × 0.6 (e 0.5), no damage on contact
      reset(); put(me, V(0, 0, -30), 0); put(foe, V(0, 0, -24), Math.PI); step(0.05);
      const { it: s3 } = throwHeld(0.1);
      let pv3 = null; until(() => { if (ev('glide:bounce').length) return true; pv3 = s3.v.clone(); return false; }, 2);
      const kb = ev('glide:bounce')[0], v3 = s3.v.clone(), ratio3 = pv3 ? Math.hypot(v3.x, v3.z) / Math.hypot(pv3.x, pv3.z) : 0;
      const hitsNow = hits.filter((h) => h.vic === foe).length;
      R('off an enemy kid: a clonk back at × 0.6 of e 0.5 (head-on: 0.3 of its speed), no damage on contact', kb?.e.kind === 'kid' && kb.e.who === foe && v3.z < 0 && Math.abs(ratio3 - 0.3) < 0.03 && hitsNow === 0, { kind: kb?.e.kind, ratio: r3(ratio3), hits: hitsNow });
      // a teammate: it passes
      reset(); put(me, V(0, 0, -30), 0); put(mate, V(0, 0, -24), Math.PI); step(0.05);
      const { it: s4 } = throwHeld(0.1);
      step(1.2);
      R('through a teammate: it passes (no bounce, on along its line)', ev('glide:bounce').length === 0 && s4.p.z > -22 && s4.v.z > 0, { z: r2(s4.p.z), bounces: ev('glide:bounce').length });
      // an enemy Drip Curtain
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      G.subs._throw(foe, SUBS.curtain, V(0, 0.5, -22), V(0, -2, 0.01), false); step(0.6);
      const cur = G.subs.items.find((x) => x.state === 'curtain');
      const { it: s5 } = throwHeld(0.1);
      until(() => ev('glide:bounce').length > 0 || s5.state === 'dead', 2);
      R('off an enemy Drip Curtain: it bounces', !!cur && ev('glide:bounce')[0]?.e.kind === 'curtain' && s5.v.z < 0, { curtain: !!cur, kind: ev('glide:bounce')[0]?.e.kind });
      // a Scrap Sentry (any team's: a stand-in device descriptor until the sentry lands)
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const SK = SUB_KITS.sentry, dev0 = SK.devices, spos = V(0.1, 0, -22);
      SK.devices = (o) => { o.push({ kind: 'sentry', kit: true, live: true, team: me.team, pos: spos, r: 0.32, h: 0.72 }); return o; };
      const { it: s6 } = throwHeld(0.1);
      until(() => ev('glide:bounce').length > 0 || s6.state === 'dead', 2);
      if (dev0) SK.devices = dev0; else delete SK.devices;
      R('off a Scrap Sentry (any team\'s; r 0.32): it bounces', ev('glide:bounce')[0]?.e.kind === 'sentry' && s6.v.z < 0, { kind: ev('glide:bounce')[0]?.e.kind });
      // a moving block running into a stone at rest: carried off, with its velocity
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s7 } = throwHeld(0.1);
      s7.p.set(0, 0, -20); s7.v.set(0, 0, 0);
      const mb = box(-1, 1, 0, 1.5, -24, -22);
      let mz = -23; hook = () => { mz += 3 / 60; L.moveDynamic(mb, V(0, 0.75, mz), V(1, 0.75, 1)); };
      step(1.2);
      hook = null;
      R('a moving block (3 m/s) running into it: knocked on ahead of it (a mover\'s side is a wall), never left inside', s7.v.z > 3 && s7.p.z > mz + 1 + S.bodyRadius - 0.05 && ev('glide:bounce').some((b) => b.e.kind === 'mover'), { vz: r2(s7.v.z), z: r2(s7.p.z), blockFront: r2(mz + 1) });
    }

    // ============================================================================================ 4 ledges and the sea
    if (want('ledge')) {
      reset();
      box(-3, 3, 0, 1.2, -32, -22);
      put(me, V(0, 1.2, -31), 0); step(0.2);
      const { it } = throwHeld(0.1);
      let wasAir = false, landZ = null;
      const b = (() => { until(() => { if (it.air) wasAir = true; if (wasAir && !it.air && landZ == null) landZ = it.p.z; return it.state === 'dead'; }, 4); return ev('bomb:explode').pop(); })();
      R('off a 1.2 m ledge it falls and slides on where it lands (no slowing in the air)', wasAir && landZ != null && landZ > -22 && b && b.e.pos.z > landZ + 3 && Math.abs(b.e.pos.y - 0.25) < 0.05, { landZ: landZ && r2(landZ), blastZ: b && r2(b.e.pos.z) });
      // into the sea (the deck's edge at x 28)
      reset(); put(me, V(22, 0, 0), Math.PI / 2); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      until(() => s2.state === 'dead', 4);
      const tEnd = ev('glide:end')[0]?.t ?? 1e9;
      step(0.5);
      const after = splats.filter((s) => s.t > tEnd).length;
      R('into the sea: it sinks (a plop) — no blast, no paint after it', ev('glide:end')[0]?.e.why === 'sunk' && ev('bomb:explode').length === 0 && after === 0, { why: ev('glide:end')[0]?.e.why, blasts: ev('bomb:explode').length, paintAfter: after });
    }

    // ============================================================================================ 5 the blast
    if (want('blast')) {
      const rows = [];
      const blastAt = (cook, place) => {
        reset();
        put(me, V(-10, 0, -30), 0); step(0.05);
        const { it } = throwHeld(0.1);
        it.p.set(0, 0, 0); it.v.set(0, 0, 0); it.R = MATH.radiusOf(cook); it.cook = cook; it.devDmg = MATH.devDmgOf(cook); it.paintR = MATH.paintOf(cook); it.fuse = 0.05;
        place?.(it);
        until(() => it.state === 'dead', 1);
        return it;
      };
      const C = V(0, 0.25, 0), chest = (d) => Math.hypot(d, 0.45);
      const want5 = (d, Rr) => { const k = 1 - Math.min(1, Math.max(0, (chest(d) - 0.8) / (Rr - 0.8))); return S.damageMin + (S.damageMax - S.damageMin) * k * k; };
      for (const [cook, d] of [[0, 0.3], [0, 1.2], [0, 1.9], [1.8, 0.5], [1.8, 2.0], [1.8, 2.9], [1.8, 3.25]]) {
        const Rr = MATH.radiusOf(cook);
        blastAt(cook, () => { put(foe, V(d, 0, 0), 0); });
        const h = hits.find((x) => x.vic === foe && x.wid === 'glide');
        rows.push({ cook, d, R: r2(Rr), got: h ? h.dmg : 0, want: chest(d) > Rr ? 0 : r2(want5(d, Rr)) });
      }
      R('its blast: 180 within 0.8 m (to the chest), the k² falloff, 35 at R, nothing past R — uncooked R 2.2, full cook R 3.2', rows.every((r) => Math.abs(r.got - r.want) <= 0.6) && rows[0].got === 180 && rows.some((r) => r.want > 0 && r.want < 40), rows);
      // behind a wall
      blastAt(1.8, () => { put(foe, V(1.6, 0, 0), 0); box(0.6, 0.9, 0, 3, -2, 2); });
      R('nothing through a wall (a line of sight from the blast to the chest)', !hits.some((x) => x.vic === foe), { hits: hits.filter((x) => x.vic === foe).length });
      // devices 40 → 60
      const dev = [];
      for (const cook of [0, 1.8]) {
        const it = blastAt(cook, () => {});
        const bc = G.subs._plant(foe, SUBS.beacon, V(1, 0, 0), V(0, 1, 0), 0, null, false);
        const hp0 = bc.hp; it.state = 'slide'; it.fuse = 0.05; K.items.includes(it) || K.items.push(it);
        until(() => it.state === 'dead', 1);
        dev.push({ cook, took: r2(hp0 - bc.hp) });
      }
      // (the second stone: its own fresh one, so the numbers come from its cook)
      R('enemy devices in its radius take 40 (uncooked) → 60 (full cook) — the Splat Bomb\'s 60', dev.length === 2 && Math.abs(dev[0].took - 40) < 0.5 && Math.abs(dev[1].took - 60) < 0.5, dev);
    }

    // ============================================================================================ 6 shot down
    if (want('shot')) {
      reset(); put(me, V(-6, 0, -30), 0); step(0.05);
      const { it } = throwHeld(0.1);
      it.p.set(0, 0, -20); it.v.set(0, 0, 0); it.fuse = 3;
      foe.setWeapon('shooter'); put(foe, V(0, 0, -14), Math.PI); foe.ink = 100; step(0.25);   // (its body turned to the stone first: the muzzle)
      const W = WEAPONS.shooter, aimAt = (a, p) => { a.aimYaw = a.yaw = Math.atan2(p.x - a.pos.x, p.z - a.pos.z); a.aimPitch = Math.atan2(p.y - (a.pos.y + 1.1), Math.hypot(p.x - a.pos.x, p.z - a.pos.z)); a.aimPoint.copy(p); };
      const t0 = G.time, d0 = DEPLOY_STATS.down.glide || 0;
      const shotLog = [];
      for (let k = 0; k < 2 && it.state !== 'dead'; k++) {
        aimAt(foe, V(0, 0.14, -20)); P.fireShooter(foe, W, 0);
        const sh = P.list[P.list.length - 1], tr = [];
        until(() => { tr.push([r2(sh.pos.x), r2(sh.pos.y), r2(sh.pos.z)]); return ev('device:hit', t0).length > k || it.state === 'dead'; }, 1);
        shotLog.push({ k, n: tr.length, first: tr[0], last: tr[tr.length - 1], hp: it.hp, stone: [r2(it.p.x), r2(it.p.y), r2(it.p.z)], state: it.state });
        step(0.15);
      }
      step(0.3);
      const dh = ev('device:hit', t0).filter((x) => x.e.kind === 'glide'), dd = ev('device:down', t0).filter((x) => x.e.kind === 'glide');
      const dbgShots = shotLog.slice();
      R('two Spritzer shots (36 each, hp 40) pop it: \'device:hit\' ×2 (attacker the shooter), one \'device:down\' how \'shot\', a puff — no blast, no damage', it.state === 'dead' && it.why === 'popped' && dh.length === 2 && dh[0].e.attacker === foe && dd.length === 1 && dd[0].e.how === 'shot' && dd[0].e.by === foe
        && (DEPLOY_STATS.down.glide || 0) === d0 + 1 && ev('bomb:explode', t0).length === 0 && !hits.some((h) => h.wid === 'glide'), { why: it.why, hits: dh.length, downs: dd.length, by: dd[0]?.e.by === foe, shots: dbgShots });
      // a teammate's shots
      reset(); put(me, V(-6, 0, -30), 0); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      s2.p.set(0, 0, -20); s2.v.set(0, 0, 0); s2.fuse = 3;
      mate.setWeapon('shooter'); put(mate, V(0, 0, -14), Math.PI); mate.ink = 100; step(0.25);
      const t1 = G.time;
      for (let k = 0; k < 3; k++) { aimAt(mate, V(0, 0.14, -20)); P.fireShooter(mate, W, 0); step(0.25); }
      R('a teammate\'s shots do nothing to it (they fly through)', s2.state !== 'dead' && s2.hp === S.hp && ev('device:hit', t1).length === 0, { state: s2.state, hp: s2.hp });
      foe.setWeapon(foe.weaponId); mate.setWeapon(mate.weaponId);
    }

    // ============================================================================================ 7 fizzles
    if (want('fizzle')) {
      reset(); netOn(); put(me, V(-6, 0, -30), 0); step(0.05);
      const ink0 = me.ink, n0 = K.items.length, t0 = G.time;
      ctl.sub = true; step(1.0);
      me.damage(200, foe);   // (splatted)
      ctl.sub = false; step(0.4);
      const fz = ev('glide:fizzle', t0), rec5 = sent.filter((s) => s.data[0] === 5).map((s) => s.data[1]);
      R('splatted while cooking: it fizzles in the hand — no ink paid, no stone, [5, 0] recorded after the levels', !me.alive && fz.length === 1 && K.items.length === n0 && Math.abs(me.ink - ink0) < 1e-6 && rec5.join() === '1,0', { fizzles: fz.length, stones: K.items.length - n0, ink: r2(ink0 - me.ink), rec5 });
      // a runner reset (the stand-in for a pipe capture / a Bazookarp pick-up: the runner is let go, the button with it)
      reset(); netOn(); put(me, V(-6, 0, -30), 0); step(0.05);
      const ink1 = me.ink, n1 = K.items.length;
      ctl.sub = true; step(1.0);
      const tr = G.time; me.weaponRunner.reset(); ctl.sub = false;
      let fzAt = null; step(0.4, () => { if (fzAt == null && ev('glide:fizzle', tr).length) fzAt = ev('glide:fizzle', tr)[0].t - tr; });
      R('a runner reset() mid-cook: the fizzle within 0.15 s + 1 frame, no ink, no stone', fzAt != null && fzAt <= 0.15 + 1 / 60 + 1e-6 && K.items.length === n1 && Math.abs(me.ink - ink1) < 1e-6, { fzAt: fzAt && r3(fzAt), stones: K.items.length - n1 });
      // diving while cooking
      reset(); put(me, V(-6, 0, -30), 0); step(0.05);
      const n2 = K.items.length, t2 = G.time;
      ctl.sub = true; step(0.8); ctl.squid = true; step(0.1); ctl.sub = false; step(0.3); ctl.squid = false;
      R('diving while cooking: the stone fizzles (the main-weapon lock never blocks the dive)', ev('glide:fizzle', t2).length === 1 && K.items.length === n2, { fizzles: ev('glide:fizzle', t2).length, stones: K.items.length - n2, form: me.form });
      netOff();
    }

    // ============================================================================================ 8 the aim guide
    if (want('guide')) {
      const rows = [];
      const scen = [
        { at: V(0, 0, -34), yaw: 0, held: 0.1, why: 'flat, tap' },
        { at: V(0, 0, -34), yaw: 0.3, held: 1.2, why: 'flat, cooked' },
        { at: V(4, 0, -4), yaw: Math.PI / 2, held: 0.4, why: 'into the wall (1 bounce)' },
        { at: V(6, 0, -6), yaw: Math.PI / 4, held: 0.1, why: 'off the wall at 45°' },
        { at: V(8, 0, 2), yaw: 1.2, held: 0.1, corner: true, why: 'a corner (2 bounces)' },
        { at: V(0, 0, -30), yaw: 0, held: 0.5, step: true, why: 'over a step' },
      ];
      for (const s of scen) {
        reset();
        if (s.corner) box(8, 14, 0, 2, 5.5, 6.5);
        if (s.step) box(-6, 6, 0, 0.25, -24, -20);
        put(me, s.at, s.yaw); step(0.1);
        ctl.sub = true;
        const n = Math.round(s.held / DT);
        for (let i = 0; i < n; i++) { if (i === n - 1) K.math.guide.t = -9; frame(); }   // (its last recompute on the frame before the release)
        const end = K.math.guide.end.clone(), shown = K.math.guide.mesh.visible;
        ctl.sub = false; frame();
        const it = lastItem(), b = runOut(it);
        rows.push({ why: s.why, off: b ? r2(Math.hypot(b.x - end.x, b.z - end.z)) : null, bounces: it.bounces, shown });
      }
      R('the aim guide\'s end ring sits within 0.3 m of where the real stone stops (6 throws, 0–2 bounces)', rows.every((r) => r.off != null && r.off <= 0.3 && r.shown) && rows.some((r) => r.bounces >= 2) && rows.some((r) => r.bounces === 1), rows);
      reset(); put(me, V(0, 0, -34), 0); step(0.05); me.ink = 20; ctl.sub = true; step(0.3);
      const u = K.math.guide.mat.uniforms.uColor.value, grey = Math.abs(u.r - u.g) < 0.06 && Math.abs(u.g - u.b) < 0.06;
      const cookNoInk = me.weaponRunner.glide?.cook ?? -1, lk = me.weaponRunner.mainLocked;
      ctl.sub = false; step(0.1);
      R('without the ink: the guide is grey, the stone never cooks (no lock), the release only says low ink', grey && cookNoInk === 0 && !lk && K.items.filter((x) => x.state !== 'dead').length === 0, { grey, cook: cookNoInk, locked: lk });
    }

    // ============================================================================================ 9 bots
    if (want('bots')) {
      // a fighting bot (B) and a foe standing 10 m off, in sight
      const B = foes[1] || foes[0], T = mates[1] || mate;
      let ok = 0; const rows = [];
      for (let round = 0; round < 3; round++) {
        reset();
        put(T, V(0, 0, -10), Math.PI); put(B, V(0, 0, -20), 0);
        B.setSub('glide'); B.ink = 100;
        delete B.bot.update;   // its own brain (it sees T 10 m off, straight ahead)
        B.bot.bombCd = 0;
        let it = null, rel = null; const t0 = G.time;
        step(8, () => { B.ink = Math.max(B.ink, 80); T.pos.set(0, 0.02, -10); T.vel.set(0, 0, 0); if (!it) { it = K.items.find((x) => x.owner === B && x.state !== 'dead'); if (it) rel = [r2(B.pos.x), r2(B.pos.z), r2(B.aimYaw)]; } return !it; });
        stub(B);
        const b = it ? runOut(it, 4) : null;
        const off = b ? Math.hypot(b.x - T.pos.x, b.z - T.pos.z) : null;
        const r0 = it && K.items.length >= 0 ? null : null;
        rows.push({ thrown: !!it, cook: it && r2(it.cook), off: off && r2(off), stop: it && [r2(it.p.x), r2(it.p.z)], B: [r2(B.pos.x), r2(B.pos.z)], fights: GLIDE_STATS.botFight, fizzles: GLIDE_STATS.fizzles, rel, start: it && [r2(it.p.x), r2(it.p.z)] });
        if (off != null && off <= 2) ok++;
      }
      B.setSub(B.subId); delete B.bot._glide;
      R('a fighting bot throws one at a foe 10 m off, cooked so it stops within 2 m of them (3 rounds, ≥ 2)', ok >= 2, rows);
      // a foe 2.5 m from the deck's edge (x 28, the sea past it) running at it on a slant (3, 3 m/s, held in place): the
      // led slide passes beside the foe (3 m off) and over the edge, into the sea or blowing in the air over it. The bot's
      // plan and its release check the slide (the guide's prediction): it throws at where the foe stands instead (or not at
      // all) — never off the deck (4 rounds: ≥ 2 thrown, none sunk or ended over the sea)
      const rowsE = []; let thrownE = 0, sunkE = 0;
      for (let round = 0; round < 4; round++) {
        reset();
        const zE = 12 + round - 1.5;   // (north of the testbox wall's end, z 8: open deck between them)
        put(T, V(25.5, 0, zE), -Math.PI / 2); put(B, V(15.5, 0, zE), Math.PI / 2);
        B.setSub('glide'); B.ink = 100;
        delete B.bot.update; B.bot.bombCd = 0;
        const g0 = { ...GLIDE_STATS };
        let it = null;
        step(8, () => { B.ink = Math.max(B.ink, 80); T.pos.set(25.5, 0.02, zE); T.vel.set(3, 0, 3); if (!it) it = K.items.find((x) => x.owner === B && x.state !== 'dead') || null; return !it; });
        stub(B);
        let offDeck = false;
        if (it) { thrownE++; until(() => it.state === 'dead', 4); offDeck = /^sunk/.test(it.why || '') || L.groundHeight(it.p.x, it.p.z, it.p.y + 0.1) === -Infinity; if (offDeck) sunkE++; }
        rowsE.push({ thrown: !!it, why: it && it.why, offDeck, cook: it && r2(it.cook), stop: it && [r2(it.p.x), r2(it.p.y), r2(it.p.z)], retarget: GLIDE_STATS.botRetarget - g0.botRetarget, refused: GLIDE_STATS.botNoSink - g0.botNoSink, relAlt: GLIDE_STATS.botRelAlt - g0.botRelAlt, cancel: GLIDE_STATS.botCancel - g0.botCancel, B: [r2(B.pos.x), r2(B.pos.z)] });
      }
      B.setSub(B.subId); delete B.bot._glide;
      R('a fighting bot\'s foe by the deck\'s edge, running at it on a slant: the led slide would leave the deck — the bot throws at where the foe stands instead (or holds off); no stone sinks or blows over the sea (4 rounds: ≥ 2 thrown, 0 off the deck)', thrownE >= 2 && sunkE === 0, { thrown: thrownE, offDeck: sunkE, rows: rowsE });
      // a bot in a predicted stop disc: out of it before the blast (botSpecials' escape: hard, its awareness on), or it
      // shoots the stone (bots.js threats). The thrower goes behind the wall at once (no fight to distract it). A round
      // counts when the bot stands in the blast; a good one (SPEC A10.9): it took no damage from it, and it was clear of
      // the blast radius when it went off, or the stone was popped first
      let good = 0, counted = 0; const rows2 = [];
      const V2 = foes[2] || foes[0], diff0 = V2.bot.diff.id;
      for (let round = 0; round < 4; round++) {
        reset();
        put(V2, V(0.85, 0, -21.6), Math.PI); put(me, V(0, 0, -30), 0); step(0.1);   // (just off its lane: it slides past their shins)
        const { it } = throwHeld(1.6);   // (cook 1.45, R 3.0: about 7.9 m — its stop by them, about z −21.6)
        put(me, V(20, 0, 0), 0);
        delete V2.bot.update; V2.bot.setDifficulty('hard'); V2.bot.sp.reset();
        const e0 = SPECIAL_STATS.escapes, th0 = { ...THREAT_STATS };
        const stop = K.threats([]).find((x) => x.obj === it)?.stopAt.clone();
        const d0 = stop ? Math.hypot(V2.pos.x - stop.x, V2.pos.z - stop.z) : null;
        let esc = null, dMin = null;
        until(() => {
          if (!esc && V2.bot.sp.esc && V2.bot.sp.esc.r?.d?.hit === 'glide') esc = { t: r3(it.age) };
          if (esc && stop) { const dd = Math.hypot(V2.pos.x - stop.x, V2.pos.z - stop.z); dMin = dMin == null ? dd : Math.min(dMin, dd); }
          return it.state === 'dead';
        }, 3);
        stub(V2); V2.bot.setDifficulty(diff0);
        const b = ev('bomb:explode').pop();
        const dmg = hits.filter((h) => h.vic === V2 && h.wid === 'glide').reduce((s2, h) => s2 + h.dmg, 0);
        const dEnd = b ? Math.hypot(V2.pos.x - b.e.pos.x, V2.pos.z - b.e.pos.z) : null;
        const row = { d0: d0 && r2(d0), R: r2(it.R), esc, escapes: SPECIAL_STATS.escapes - e0, shoot: THREAT_STATS.shoot - th0.shoot, side: THREAT_STATS.sidestep - th0.sidestep, popped: it.why === 'popped', dEnd: dEnd && r2(dEnd), dmg: r2(dmg) };
        rows2.push(row);
        if (d0 == null || d0 > it.R) continue;
        counted++;
        if (dmg === 0 && (it.why === 'popped' || (dEnd != null && dEnd > it.R))) good++;
      }
      R('a hard bot standing in a cooked stone\'s predicted stop disc gets out before the blast (botSpecials\' escape, SPECIAL_STATS.escapes) or shoots it — clear of R at the blast (or popped) and no damage (4 rounds: ≥ 3 of those it stood in)', counted >= 3 && good >= Math.ceil(counted * 3 / 4), { counted, good, rows: rows2 });
      // the threat descriptor
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it } = throwHeld(1.2);
      const d = K.threats([]).find((x) => x.obj === it), stop = d && d.stopAt.clone();
      step(0.2);
      const real = runOut(it);
      R('its threat descriptor (slider: fuse, stopAt, shootable, radius) predicts the stop within 0.3 m', d && d.slider && d.ground && Math.abs(d.radius - it.R) < 1e-6 && real && Math.hypot(stop.x - real.x, stop.z - real.z) < 0.3, { stop: stop && [r2(stop.x), r2(stop.z)], real: real && [r2(real.x), r2(real.z)] });
    }

    // ============================================================================================ 11 lava and the shell (stand-ins)
    if (want('stubs')) {
      reset(); put(me, V(0, 0, 0), Math.PI / 2); step(0.05);
      const fz = [];
      G.match.lava = { surfaceAt: (x) => (x > 10 ? 0.5 : -Infinity), under: (p, d = 0) => p.x > 10 && p.y < 0.5 + d, covers: () => false, fizzle: (p) => fz.push([r2(p.x), r2(p.y)]) };
      const { it } = throwHeld(0.1);
      until(() => it.state === 'dead', 3);
      delete G.match.lava;
      R('a stand-in lava (0.5 m over x > 10): it sinks at its edge — a hiss (lava.fizzle), no blast', it.why === 'sunk:lava' && fz.length === 1 && fz[0][0] > 10 && fz[0][0] < 10.3 && ev('bomb:explode').length === 0, { why: it.why, fizzle: fz });
      // as caldera will be: its lava IS the stage module's liquid — G.level.liquidY answers the lava's surface over the same
      // half as G.match.lava (docs/STAGE-MODS.md H23). One hiss (lava.fizzle), no water plop (its sound, its pale splash).
      // And a module liquid nobody fizzles (a tank's water: liquidY alone): it plops, no hiss
      const plops = [], ap0 = G.audio?.play, fb0 = G.fx?.burst;
      if (ap0) G.audio.play = function (n) { if (n === 'glide_plop') plops.push({ t: G.time, what: 'sound' }); return ap0.apply(this, arguments); };
      if (fb0) G.fx.burst = function (p, d, col) { if (col?.getHexString?.() === 'bfe9ff') plops.push({ t: G.time, what: 'splash' }); return fb0.apply(this, arguments); };
      const liq = [], ownLq = Object.prototype.hasOwnProperty.call(L, 'liquidY') ? L.liquidY : null;
      const lqBack = () => { if (ownLq) L.liquidY = ownLq; else delete L.liquidY; };
      try {
        for (const withLava of [true, false]) {
          reset(); put(me, V(0, 0, 0), Math.PI / 2); step(0.05);
          plops.length = 0; const fz2 = [];
          L.liquidY = (x) => (x > 10 ? 0.5 : PLAYER.waterY);
          if (withLava) G.match.lava = { surfaceAt: (x) => (x > 10 ? 0.5 : -Infinity), under: (p, d = 0) => p.x > 10 && p.y < 0.5 + d, covers: () => false, fizzle: (p) => fz2.push([r2(p.x), r2(p.y)]) };
          const { it: sl } = throwHeld(0.1);
          until(() => sl.state === 'dead', 3);
          delete G.match.lava; lqBack();
          liq.push({ lava: withLava, why: sl.why, fizzles: fz2.length, plops: plops.map((x) => x.what), blasts: ev('bomb:explode').length });
        }
      } finally { if (ap0) G.audio.play = ap0; if (fb0) G.fx.burst = fb0; lqBack(); }
      R('caldera\'s case — G.level.liquidY and G.match.lava over the same half: it hisses once (lava.fizzle) with no water plop; a module liquid alone (a tank\'s water): it plops (its sound and pale splash), no hiss — neither blows',
        liq[0].why === 'sunk:lava' && liq[0].fizzles === 1 && liq[0].plops.length === 0 && liq[0].blasts === 0 && liq[1].why === 'sunk:liquid' && liq[1].fizzles === 0 && liq[1].plops.includes('sound') && liq[1].plops.includes('splash') && liq[1].blasts === 0, liq);
      // a stand-in Roe Shell (r 1.6 at (6, 1.0, −20)): hit 45° off its normal
      reset();
      const sc = V(6, 1.0, -20), calls = [];
      G.objTargets = { spheres: (o) => { o.push({ c: sc, r: 1.6, solid: true }); return o; }, splash: (...a) => calls.push(a.slice(1).map((x) => (x && x.isVector3 ? [r2(x.x), r2(x.y), r2(x.z)] : typeof x === 'number' ? r3(x) : x))) };
      // the contact radius at the puck's middle: sqrt(r² − dy²) + bodyRadius; aim a line that meets it 45° off the normal
      const dy = 0.14 - sc.y, Rc = Math.sqrt(1.6 * 1.6 - dy * dy) + S.bodyRadius, off = Rc * Math.SQRT1_2;
      put(me, V(sc.x - off, 0, -30), 0); step(0.05);
      let pv = null;
      const { it: s2 } = throwHeld(0.1);
      until(() => { if (ev('glide:bounce').length) return true; pv = s2.v.clone(); return false; }, 3);
      const kb = ev('glide:bounce')[0], va = s2.v.clone();
      const n = V(s2.p.x - sc.x, 0, s2.p.z - sc.z).normalize();
      const outDeg = Math.asin(Math.abs(va.clone().normalize().dot(n))) * 180 / Math.PI;
      until(() => s2.state === 'dead', 3);
      delete G.objTargets;
      R('a stand-in Roe Shell (r 1.6): it bounces off it like a wall (45° in → 39° ± 3° out, speed × 0.83 ± 0.03)', kb?.e.kind === 'shell' && Math.abs(outDeg - 38.66) <= 3 && pv && Math.abs(va.length() / pv.length() - 0.83) <= 0.03, { kind: kb?.e.kind, outDeg: r2(outDeg), ratio: pv && r3(va.length() / pv.length()) });
      R('…and its blast calls the shell\'s splash once: the owner, 180 / 35 and its R', calls.length === 1 && calls[0][1] === r3(s2.R) && calls[0][2] === 180 && calls[0][3] === 35 && calls[0][4] === 'glide', calls);
    }

    // ============================================================================================ 12 the main weapon lock
    if (want('lock')) {
      // a Spritzer held on fire with the sub held 1 s
      reset(); me.setWeapon('shooter'); put(me, V(0, 0, -30), 0); step(0.2);
      ctl.fire = true; step(0.3);
      const t0 = G.time; ctl.sub = true;
      const shots = []; const off = on('weapon:fire', (e) => { if (e.actor === me) shots.push(G.time - t0); });
      let lockAt = null; step(1.0, () => { if (lockAt == null && me.weaponRunner.mainLocked) lockAt = G.time - t0; });
      off(); ctl.sub = false; ctl.fire = false; step(0.2);
      const lockFrom = 0.15 + 2 / 60 + 1e-6;   // (held counts from the press frame: the lock is read the frame after the grace)
      R('a Spritzer held on fire with the sub held 1 s: no shot from held 0.15 s + 1 frame on (the trigger locked while it cooks)', shots.length > 0 && shots.every((t) => t <= lockFrom) && lockAt != null && lockAt <= lockFrom, { lastShot: r3(Math.max(...shots)), lockAt: lockAt && r3(lockAt), shots: shots.length });
      // a charger mid-charge when the cook starts
      reset(); me.setWeapon('charger'); put(me, V(0, 0, -30), 0); step(0.2);
      ctl.fire = true; step(0.5);
      const ch0 = me.weaponRunner.charging, t1 = G.time;
      const fires = []; const off2 = on('weapon:fire', (e) => { if (e.actor === me) fires.push(G.time - t1); });
      ctl.sub = true; step(1.0);
      const mid = { charging: me.weaponRunner.charging, aiming: me.weaponRunner.aimingSub, cook: r2(me.weaponRunner.glide?.cook ?? -1) };
      ctl.sub = false; frame(); const st = lastItem();
      ctl.fire = false; step(0.3); off2();
      R('a charger mid-charge when the cook starts: the charge is dropped with no shot; the stone stays in hand and cooks on (dropCharge keeps the sub)', ch0 && !mid.charging && mid.aiming && mid.cook > 0.8 && fires.length === 0 && st && st.owner === me && st.cook > 0.8, { chargingBefore: ch0, mid, fires: fires.length, cook: st && r2(st.cook) });
      // a tap never interrupts the fire
      reset(); me.setWeapon('shooter'); put(me, V(0, 0, -30), 0); step(0.2);
      ctl.fire = true; step(0.3);
      const t2 = G.time, sh2 = []; const off3 = on('weapon:fire', (e) => { if (e.actor === me) sh2.push(G.time); });
      throwHeld(0.1); step(0.4); off3(); ctl.fire = false;
      const gaps = sh2.slice(1).map((t, i) => t - sh2[i]), maxGap = Math.max(...gaps);
      R('a tap (0.1 s) never interrupts the fire', sh2.length >= 5 && maxGap <= WEAPONS.shooter.fireInterval * 2 + 1e-6 && !ev('glide:fizzle', t2).length, { shots: sh2.length, maxGap: r3(maxGap), interval: WEAPONS.shooter.fireInterval });
      // a barrage's stone
      reset(); me.setWeapon('shooter'); put(me, V(0, 0, -30), 0); step(0.1);
      me.specialId = 'barrage'; me.special = me.specialCost(); me._startSpecial();
      const sp = me.specialActive; sp.bomb = SUBS.glide; sp.gap = 0.3; me.character.setSub('glide');
      ctl.fire = true; step(0.2);
      const t3 = G.time, sh3 = []; const off4 = on('weapon:fire', (e) => { if (e.actor === me) sh3.push(G.time); });
      const ink3 = me.ink;
      const { it: bs } = throwHeld(1.0); step(0.2); off4(); ctl.fire = false;
      const gaps3 = sh3.slice(1).map((t, i) => t - sh3[i]);
      R('a Bomb Barrage\'s Glide (a stand-in barrage handing it out): a held throw never cooks (R 2.2) and never stops the main weapon', bs && Math.abs(bs.R - 2.2) < 1e-6 && bs.sp && sh3.length >= 8 && Math.max(...gaps3) <= WEAPONS.shooter.fireInterval * 2 + 1e-6,
        { R: bs && bs.R, sp: bs && bs.sp, shots: sh3.length, maxGap: r3(Math.max(...gaps3)), inkUsed: r2(ink3 - me.ink) });
      G.specials.end?.(me, 'test'); me.specialActive = null;
      me.setWeapon(me.weaponId);
    }

    // ============================================================================================ crushIn (SPEC A5, §0.3)
    // "It is not crushed: it is a bomb … On a moving floor it rides." The one destroyer, G.deploy.crushIn, walks every kit's
    // device descriptors (the sentry / bobber builders' deployables.js); the tower calls it with its platform and pillar
    // every frame it moves. Here: the real crushIn when this tree has it (after the merge), else a stand-in that is that
    // crushIn's kit-descriptor loop verbatim (b5-sub-sentry / b5-sub-bobber deployables.js) plus the one line the Glide
    // asks of it (`d.crushable === false` → skipped). A deck moving at 2 m/s with a stone at rest on it, crushIn every
    // frame (as tower.js): it rides and is never ended; a pillar driven into a stone on the floor: knocked on, never ended;
    // the re-forming shell's sphere and a lava sweep over it: nothing; no 'device:down', no DEPLOY_STATS.crushed step.
    if (want('crush')) {
      const { emit } = await import('./src/core/ctx.js');
      const HS = [0.06, 0.5, 1];
      const bodyIn = (B, base, h, r) => { for (const b of B) for (const k of HS) { if (!b) continue; if (L.pointInBlock(b, V(base.x, base.y + Math.min(h, Math.max(0.06, h * k)), base.z), r)) return true; } return false; };
      const segPt = (base, h, c) => { const y = Math.max(base.y, Math.min(base.y + h, c.y)); return Math.hypot(c.x - base.x, c.y - y, c.z - base.z); };
      const standIn = (shape, how = 'crush') => {
        const B = shape.blocks || null, Sp = shape.sphere || null, W = typeof shape.where === 'function' ? shape.where : null, T = shape.rider || null;
        const rides = (b) => !!b && ((B && B.includes(b)) || (T && (b === T.block || b === T.pillar)));
        const inBody = (pos, base, h, r) => (B ? bodyIn(B, base, h, r) : Sp ? segPt(base, h, Sp.c) < Sp.r + r : W ? !!W(pos) : false);
        const kd = []; let n = 0;
        for (const k in SUB_KITS) SUB_KITS[k].devices?.(kd);
        for (const d of kd) {
          if (d.ghost || !d.live || d.crushable === false || rides(d.rides)) continue;   // (the Glide's line: crushable false)
          if (!inBody(d.pos, d.pos, d.h, d.r)) continue;
          n++; DEPLOY_STATS.crushed[d.kind] = (DEPLOY_STATS.crushed[d.kind] || 0) + 1;
          emit('device:down', { kind: d.kind, team: d.team, pos: d.pos.clone(), by: null, how });
          d.crush(how);
        }
        return n;
      };
      const real = typeof G.deploy?.crushIn === 'function';
      const crushIn = real ? (s, h) => G.deploy.crushIn(s, h) : standIn;
      // a deck (top y 1.0) moving +x at 2 m/s, a stone at rest on it, crushIn({ blocks: [deck], rider }) every frame it moves
      reset();
      const deck = box(-2, 2, 0, 1.0, -26, -22);
      put(me, V(0, 1.0, -25.5), 0); step(0.2);
      const { it: s1 } = throwHeld(0.1);
      s1.v.set(0, 0, 0); s1.p.set(0, 1.0, -24); s1.fuse = 1.6;
      const c0 = DEPLOY_STATS.crushed.glide || 0, t0 = G.time;
      let dx = 0, n1 = 0, rideOk = true, desc = null; const T1 = { block: deck, pillar: null };
      hook = () => { dx += 2 / 60; L.moveDynamic(deck, V(dx, 0.5, -24), V(2, 0.5, 2)); n1 += crushIn({ blocks: [deck], rider: T1 }, 'crush'); };
      step(1.0, () => { desc = desc || K.devices([]).find((d) => d.obj === s1); if (s1.state === 'slide' && Math.abs(s1.p.x - dx) > 0.08) rideOk = false; });
      const ridesDeck = desc ? desc.rides === deck && desc.floor === deck.id : false;
      until(() => s1.state === 'dead', 1.5); hook = null;
      R(`a stone at rest on a deck moving at 2 m/s, ${real ? 'the real G.deploy.crushIn' : 'crushIn (the stand-in: the sentry / bobber branches\' kit loop + the crushable line)'} every frame it moves: it rides the deck (descriptor rides / floor = the deck), is never ended, blows at its fuse`,
        n1 === 0 && rideOk && ridesDeck && s1.why === 'blast' && !ev('device:down', t0).some((x) => x.e.kind === 'glide') && (DEPLOY_STATS.crushed.glide || 0) === c0,
        { real, crushed: n1, rideOk, ridesDeck, why: s1.why, x: r2(s1.p.x), deckX: r2(dx) });
      // a pillar driven at 2 m/s into a stone on the floor, crushIn({ blocks: [pillar] }) every frame
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      s2.p.set(0, 0, -20); s2.v.set(0, 0, 0); s2.fuse = 2;
      const pil = box(-0.5, 0.5, 0, 2.5, -22.5, -21.5);
      let pz = -22, n2 = 0; const t2 = G.time;
      hook = () => { pz += 2 / 60; L.moveDynamic(pil, V(0, 1.25, pz), V(0.5, 1.25, 0.5)); n2 += crushIn({ blocks: [pil], rider: { block: pil, pillar: null } }, 'crush'); };
      step(1.0); hook = null;
      R('a pillar (2 m/s) driven into a stone on the floor, crushIn every frame: knocked on ahead of it (a mover\'s side is a wall), never ended', n2 === 0 && s2.state === 'slide' && s2.v.z > 1.5 && s2.p.z > pz + 0.5 && ev('glide:bounce', t2).some((b) => b.e.kind === 'mover') && !ev('device:down', t2).some((x) => x.e.kind === 'glide'),
        { crushed: n2, state: s2.state, vz: r2(s2.v.z), z: r2(s2.p.z), pillarFront: r2(pz + 0.5) });
      // the re-forming Roe Shell's sphere and a lava sweep (crushIn { sphere } 'shell', { where } 'lava') over a stone
      const n3 = crushIn({ sphere: { c: s2.p.clone().setY(s2.p.y + 0.5), r: 1.6 } }, 'shell') + crushIn({ where: () => true }, 'lava');
      step(0.05);
      R('the re-forming shell\'s sphere and a lava sweep (crushIn) over a stone: nothing (it bounces off a solid shell, sinks in lava on its own)', n3 === 0 && s2.state === 'slide' && (DEPLOY_STATS.crushed.glide || 0) === c0, { crushed: n3, state: s2.state });
    }

    // ============================================================================================ Boss Battle (bots)
    // bots.js _bossTick's sub throw asks SUB_KITS.glide.bot.boss first: a slide straight at the boss, at one of five cooks,
    // that stays on the stage and stops where its blast reaches the boss's body (boss.splash's rule). A stand-in boss
    // (pos, visible, model.hitShapes: a body sphere r 1.05 at 2.0 m and a claw r 0.85 at 1.2 m)
    if (want('boss')) {
      const B = foes[1] || foes[0];
      const boss = (x, z) => ({ pos: V(x, 0, z), visible: true, dead: false, model: { hitShapes: [{ pos: V(x, 2.0, z), r: 1.05, active: true, weak: false }, { pos: V(x, 1.2, z - 1.5), r: 0.85, active: true, weak: false }, { pos: V(x, 2.2, z - 1.2), r: 0.4, active: true, weak: true }] } });
      const reach = (o, bs) => Math.min(...bs.model.hitShapes.filter((h) => h.active && !h.weak).map((h) => Math.max(0, h.pos.distanceTo(V(o.x, o.y + 0.25, o.z)) - h.r)));
      reset();
      put(B, V(0, 0, -22), 0); B.setSub('glide'); B.ink = 100; step(0.05);
      const b1 = boss(0, -12);
      delete B.bot._glideNoT;
      const ok1 = K.bot.boss(B.bot, b1), plan1 = B.bot._glide && { ...B.bot._glide };
      let pred = null;
      if (plan1) { const p = V(), yaw = plan1.yaw; p.set(B.pos.x + Math.sin(yaw) * 0.5, 0, B.pos.z + Math.cos(yaw) * 0.5); const o = MATH.simulate(p, V(Math.sin(yaw) * S.speed0, 0, Math.cos(yaw) * S.speed0), false, MATH.fuseOf(plan1.cook), B.team, null, 99); pred = { x: o.x, y: o.y, z: o.z, sunk: o.sunk }; }
      const bd1 = pred ? reach(pred, b1) : null;
      // the bot holds that plan: its sub pressed one frame (the brain's press), the kit holds it to the planned cook
      let it1 = null, held1 = null;
      if (plan1) {
        let fr = 0; B.bot.update = () => { zero(B); B.intent.sub = fr++ === 0; };
        const u0 = K.items.length;
        step(3, () => { if (!it1 && K.items.length > u0) { it1 = lastItem(); return false; } });
        stub(B);
      }
      const end1 = it1 ? runOut(it1, 4) : null;
      const bdReal = end1 ? reach({ x: end1.x, y: end1.y - 0.25, z: end1.z }, b1) : null;
      R('Boss Battle: a boss 10 m off on the deck — the bot plans a cook whose slide stops in reach of its body (≤ 0.8 R of the nearest body sphere), holds to it, and the stone blows there (within R)',
        ok1 && plan1 && pred && !pred.sunk && bd1 <= 0.8 * MATH.radiusOf(plan1.cook) + 1e-6 && it1 && Math.abs(it1.cook - plan1.cook) <= 1 / 60 + 1e-6 && it1.owner === B && bdReal != null && bdReal <= it1.R,
        { ok: ok1, cook: plan1 && r2(plan1.cook), predReach: bd1 != null && r2(bd1), thrownCook: it1 && r3(it1.cook), R: it1 && r2(it1.R), blastReach: bdReal != null && r2(bdReal) });
      // a boss out over the sea past the deck's edge (x 28): every slide sinks or stops out of reach → no throw, 1 s wait
      reset(); put(B, V(24, 0, 0), Math.PI / 2); B.setSub('glide'); B.ink = 100; step(0.05);
      delete B.bot._glideNoT; B.bot._glide = null;
      const no0 = GLIDE_STATS.bossNo, ok2 = K.bot.boss(B.bot, boss(36, 0)), ok2b = K.bot.boss(B.bot, boss(36, 0));
      R('a boss out over the sea: every slide sinks or stops out of its reach — no throw (and the refusal waits 1 s before asking again)', !ok2 && !ok2b && !B.bot._glide && GLIDE_STATS.bossNo === no0 + 1, { ok: ok2, again: ok2b, refusals: GLIDE_STATS.bossNo - no0 });
      // a boss telegraph on the cooking bot: it lets go at once (a thrown stone, not a fizzle) so it can dive
      reset(); put(B, V(0, 0, -22), 0); B.setSub('glide'); B.ink = 100; step(0.05);
      B.bot._glide = { mode: 'boss', cook: 1.8, yaw: 0 };
      let fr2 = 0, it2 = null; B.bot.update = () => { zero(B); B.intent.sub = fr2++ === 0; if (fr2 === 30) B.bot._th = { level: 1, beam: false }; };
      const u2 = K.items.length;
      step(2.5, () => { if (!it2 && K.items.length > u2) it2 = lastItem(); });
      stub(B); B.bot._th = null; B.setSub(B.subId);
      R('a boss telegraph on a bot cooking for the boss: it lets go at once (thrown, cooked ~0.33 s, not fizzled)', it2 && it2.cook > 0.2 && it2.cook < 0.5 && !ev('glide:fizzle').length, { cook: it2 && r3(it2.cook) });
      delete B.bot._glide; delete B.bot._glideNoT;
    }

    // ============================================================================================ where it starts, ramps, [4]
    if (want('start')) {
      // let go in mid-air: it drops from the hand (gravity 24), lands and slides on
      reset(); put(me, V(0, 0, -34), 0); step(0.05);
      ctl.sub = true; step(0.1);
      const n0 = K.items.length;
      ctl.sub = false; me.pos.y = 2.4; me.vel.y = 0; frame();
      const tRel = G.time, s1 = K.items.length > n0 ? lastItem() : null, y0 = s1 ? s1.p.y : null, air0 = s1 ? s1.air : null;
      let landT = null; until(() => { if (landT == null && s1 && !s1.air) landT = G.time; return !s1 || s1.state === 'dead'; }, 4);
      const b1 = ev('bomb:explode').pop();
      R('let go in mid-air: it drops from the hand (0.95 m over the feet) with gravity, lands and slides on, and blows on the floor', s1 && air0 && y0 > 2.4 + 0.5 && landT != null && landT - tRel < 0.8 && b1 && Math.abs(b1.e.pos.y - 0.25) < 0.05 && b1.e.pos.z > -34 + 8,
        { y0: y0 && r2(y0), air: air0, landedAfter: landT && r3(landT - tRel), blast: b1 && [r2(b1.e.pos.y), r2(b1.e.pos.z)] });
      // a wall closer than 0.5 m ahead: set down at the feet, never in or past the wall; it bounces back off it
      reset(); netOn(); put(me, V(13.62, 0, 0), Math.PI / 2); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      const r0 = sent.find((x) => x.kind === 'glide' && x.data[0] === 0);
      step(0.3);
      R('a wall 0.38 m ahead: it is set down at the feet (not 0.5 m ahead, inside the wall), then bounces back off it', r0 && Math.abs(r0.data[2] - me.pos.x) < 0.03 && s2 && s2.v.x < 0 && s2.p.x < 14 - S.bodyRadius + 0.01, { setX: r0 && r0.data[2], feetX: r2(me.pos.x), vx: s2 && r2(s2.v.x), x: s2 && r2(s2.p.x) });
      // [4] corrections: every 0.25 s of its fuse and at every bounce (off the testbox wall at 45°)
      reset(); netOn(); put(me, V(6, 0, -6), Math.PI / 4); step(0.05);
      const { it: s3 } = throwHeld(0.1);
      const rel = sent.find((x) => x.kind === 'glide' && x.data[0] === 0);
      until(() => s3.state === 'dead', 3);
      const r4 = sent.filter((x) => x.kind === 'glide' && x.data[0] === 4 && x.data[1] === s3.gid), bt = ev('glide:bounce').filter((x) => !x.e.ghost).map((x) => x.t);
      const gaps = [rel, ...r4].slice(1).map((x, i, A) => r3(x.t - (i ? A[i - 1].t : rel.t)));
      const atBounce = bt.every((t) => r4.some((x) => Math.abs(x.t - t) < 1e-6));
      // (its clock is its own slide's: it takes its first step the frame after the release record, so the first gap is one
      // frame longer)
      R('its [4] corrections: one at every bounce and one every 0.25 s of its slide (no gap over 0.25 s; the first, from the release record, 0.25 s + 1 frame)', rel && r4.length >= 8 && bt.length >= 1 && atBounce && gaps[0] <= 0.25 + 1 / 60 + 1e-6 && gaps.slice(1).every((g) => g <= 0.25 + 1e-6), { n: r4.length, bounces: bt.length, atBounce, gaps });
      netOff();
      // a ramp (rising 1.2 m over 4 m, 17°) then a deck on top: it follows the ramp's surface up and slides on along the top
      reset();
      const ramp = L.addDynamic({ kind: 'ramp', low: [0, 0, -26], high: [0, 1.2, -22], width: 3, thickness: 0.4, tag: 'glidetest-ramp' }); blocks.push(ramp); ramp.solid = true;
      box(-1.5, 1.5, 0, 1.2, -22, -14);
      put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s4 } = throwHeld(0.1);
      let off = 0, onRamp = 0, airOn = 0;
      until(() => { const z = s4.p.z; if (z > -25.7 && z < -22.3) { onRamp++; const want = 1.2 * (z + 26) / 4; off = Math.max(off, Math.abs(s4.p.y - want)); if (s4.air) airOn++; } return s4.state === 'dead' || z > -16; }, 3);
      R('a 17° ramp: it follows the ramp\'s surface up (within 0.05 m, never airborne on it) and slides on along the deck above', onRamp >= 10 && off <= 0.05 && airOn === 0 && s4.p.z > -18 && Math.abs(s4.p.y - 1.2) < 0.03, { stepsOnRamp: onRamp, maxOff: r3(off), air: airOn, z: r2(s4.p.z), y: r2(s4.p.y) });
    }

    // ============================================================================================ cost per step
    // the slide's bumpers that aren't level geometry are gathered once a frame / a prediction run, not per step: with a
    // stone sliding and the guide up (20 runs a second of up to 144 steps), the sentry kit's devices() is asked a few times
    // a frame — it was every step of every run (≈ 2,900 a second for the guide alone); the guide's points are pooled
    if (want('perf')) {
      reset(); put(me, V(0, 0, -34), 0); step(0.05);
      const SK = SUB_KITS.sentry, dev0 = SK.devices; let calls = 0;
      SK.devices = (o) => { calls++; return dev0 ? dev0.call(SK, o) : o; };
      throwHeld(0.1); me.ink = PLAYER.inkMax;
      ctl.sub = true; step(0.1);
      calls = 0; const f0 = G.time;
      step(1.0);
      const perS = calls / (G.time - f0), live = items().length;
      ctl.sub = false; step(0.2);
      if (dev0) SK.devices = dev0; else delete SK.devices;
      // the pooled points: two runs into the same array reuse the same point objects
      const pts = [], p0 = V(0, 0, -34), v0 = V(0, 0, S.speed0);
      MATH.simulate(p0, v0, false, 2.4, me.team, pts, 3); const a1 = pts.slice();
      MATH.simulate(p0, v0, false, 1.2, me.team, pts, 3); const reused = pts.every((p, i) => p === a1[i]);
      R('a stone sliding and the guide up: the sentry kit\'s devices() is asked ≤ 100 times a second (once a frame + once a guide run), not every step of every run; the guide\'s points are pooled (reused run to run)',
        perS <= 100 && perS > 0 && live >= 1 && reused && a1.length > pts.length, { perSecond: Math.round(perS), stones: live, reused, n: [a1.length, pts.length] });
    }

    // ============================================================================================ the rest
    if (want('more')) {
      // the HUD: the reticle dims while locked; the cook bar; the reach in the sub chip
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const H = g.hud;
      ctl.sub = true; step(0.1);
      const tapChip = H?.subChip?.lastChild.textContent;
      step(1.9);
      const fullChip = H?.subChip?.lastChild.textContent, ret = H?.ret?.classList.contains('is-locked'), barEl = document.querySelector('.iw-gld');
      const barOn = !!barEl?.classList.contains('is-on'), barFull = !!barEl?.classList.contains('is-full');
      step(0.6);
      const warn = !!barEl?.classList.contains('is-warn');
      ctl.sub = false; step(0.2);
      const after = { chip: H?.subChip?.lastChild.textContent, ret: H?.ret?.classList.contains('is-locked'), bar: !!barEl?.classList.contains('is-on') };
      const fullTxt = `${Math.round(MATH.reachOf(S.fuse - S.cookMax))} m`;
      R(`the HUD: the sub chip shows the reach ("15 m" → "${fullTxt}" at full cook), the cook bar fills and flashes at full cook and red before the slip, the reticle dims while locked; all back after`,
        !!H && tapChip === '15 m' && fullChip === fullTxt && barOn && barFull && warn && ret && after.chip === '65%' && !after.ret && !after.bar, { hud: !!H, tapChip, fullChip, barOn, barFull, warn, ret, after });
      // the hand: lamps out one by one, the glow
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      ctl.sub = true; step(1.2);
      const hp = me.character.bomb?.group.userData.glide, lit = hp ? hp.lamps.filter((l) => l.material === hp.mats.on).length : -1;
      const glowOn = [...me.character.bomb ? [1] : []].length && G.scene.children.some((o) => o.isSprite && o.visible && o.material?.blending === THREE.AdditiveBlending && o.position.distanceTo(me.pos) < 2.5);
      ctl.sub = false; step(0.1);
      R('in the hand: its lamps go out with the cook (held 1.2 s: 4–5 of 8 lit), a team glow round the fist', lit >= 4 && lit <= 5 && glowOn, { lit, glowOn: !!glowOn });
      // the first two taps a match: the hint
      reset(); const bot0 = me.bot; me.bot = null;   // (a human's kid: the controller's E key)
      put(me, V(0, 0, -30), 0); step(0.05);
      const pr = [];
      const u0 = GLIDE_STATS.uses;
      for (let k = 0; k < 3; k++) { dbg.key('KeyE', true); me.intent.sub = true; step(0.08); dbg.key('KeyE', false); me.intent.sub = false; step(0.05); pr.push(K.prompt(me)); me.ink = 100; step(3.4); }
      pr.push(GLIDE_STATS.uses - u0);
      me.bot = bot0; stub(me);
      R('the first two uncooked taps a match bring the hint "Hold [sub] to cook…" (the device\'s own glyphs), the third none', /^Hold \[RMB\] or \[E\] to cook the Glide Bomb/.test(pr[0] || '') && !!pr[1] && !pr[2] && pr[3] === 3, pr);
      // the Mega Stamp's guard (its kit hook): an enemy stone in front is smashed, no blast
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s1 } = throwHeld(0.1);
      step(0.3);
      K.smash(s1.p.clone().setY(1), 2, foe.team, () => true);
      step(0.1);
      const src = await (await fetch('./src/game/specials.js')).text();
      R('a Mega Stamp\'s swing guard (specials.js guardSweep → SUB_KITS[k].smash) smashes an enemy stone in front of it: a puff, no blast', s1.why === 'smashed' && ev('bomb:explode').length === 0 && /SUB_KITS\[k\]\.smash\?\.\(/.test(src), { why: s1.why });
      // a splatted owner's stone carries on and blows
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s2 } = throwHeld(0.1);
      step(0.2); me.damage(300, foe);
      const b2 = runOut(s2);
      R('a splatted owner: the stone already let go carries on and blows', !me.alive && !!b2 && s2.why === 'blast', { alive: me.alive, why: s2.why });
      // the Drainbow: through an enemy bubble its blast is halved (it carries the mark to applyHit)
      reset(); put(me, V(0, 0, -30), 0); put(foe, V(0, 0, -16.5), 0); step(0.05);
      const dbw0 = G.drainbow;
      G.drainbow = { live: true, pass: (o, a, b, team) => { if (team === me.team && b.z > -25 && a.z <= -25) { o.dbw = 1; return true; } return false; }, cut: (att, vic, dmg, shot) => (shot && shot.dbw ? dmg * 0.5 : dmg), blind: () => null };
      const { it: s3 } = throwHeld(0.1);
      s3.fuse = 1.45;   // (its blast by the foe)
      runOut(s3);
      G.drainbow = dbw0;
      const h3 = hits.find((h) => h.vic === foe && h.wid === 'glide');
      R('through an enemy Drainbow bubble: the stone is marked (G.drainbow.pass) and its blast goes to applyHit as that shot (halved there)', s3.dbw === 1 && h3 && h3.shot === s3, { dbw: s3.dbw, hit: !!h3, shotIsStone: h3 && h3.shot === s3 });
      // Bubble Guard: 0 damage (real hits for this one)
      reset(); put(me, V(0, 0, -30), 0); put(foe, V(0, 0, -16.6), 0); step(0.05);
      foe.status.shield = 5; dealHits = true;
      const { it: s4 } = throwHeld(0.1); s4.fuse = 1.45;
      const hp0 = foe.hp; runOut(s4);
      dealHits = false; const hpAfter = foe.hp; foe.status.shield = 0;
      R('a foe in a Bubble Guard takes 0 from its blast', hits.some((h) => h.vic === foe && h.wid === 'glide') && hpAfter === hp0, { hp0, hpAfter });
      // a roller's drum / a brush (wave 1's sweep) and standing fire (an Ink Tempest's rain: wave 1's _standing) hurt it —
      // through its device descriptor; the bots never pick it as a device (prefer 0: it's a threat to them)
      reset(); put(me, V(0, 0, -30), 0); step(0.05);
      const { it: s6 } = throwHeld(0.1); s6.p.set(0, 0, -20); s6.v.set(0, 0, 0); s6.fuse = 3;
      put(foe, V(0, 0, -21.2), 0); step(0.05);
      const dsc = G.deploy.devices().find((d) => d.obj === s6);
      G.deploy.sweep(foe, 1.2, 1.6, 30, new Map(), 0.5);
      const hpRoll = s6.hp;
      const cl0 = P.clouds.slice(); P.clouds.length = 0;
      P.clouds.push({ group: { position: V(0, 4, -20) }, team: foe.team, t: 0, dur: 5, owner: foe });
      for (let k = 0; k < 30 && s6.state !== 'dead'; k++) G.deploy._standing(1 / 30);
      P.clouds.length = 0; P.clouds.push(...cl0);
      step(0.05);
      R('a roller\'s drum (wave 1\'s sweep) and an Ink Tempest\'s rain (standing fire) hurt it — 30 off its 40, then the rain pops it; the bots never pick it as a device (prefer 0)',
        !!dsc && dsc.kit && dsc.prefer({}) === 0 && Math.abs(hpRoll - (S.hp - 30)) < 1e-6 && s6.why === 'popped', { hpRoll, why: s6.why, listed: !!dsc });
      // a moving floor carries it
      reset();
      const pl = box(-3, 3, -0.4, 0.3, -30, -18);
      put(me, V(0, 0.3, -29), 0); step(0.2);
      const ev5 = evs.length, g5 = { ...GLIDE_STATS };
      const { it: s5 } = throwHeld(0.1);
      // ([b5-int3] no stone from this throw — seen 1 run in 9 on the merged tree, 2 in 2 for the round-2 reviewer — is a
      // FAIL with what the kid and the kit were doing, not a HARNESS TypeError that hides it)
      if (!s5) R('on a moving floor (2 m/s) it rides along with it — the throw made no stone', false, { me: [r2(me.pos.x), r2(me.pos.y), r2(me.pos.z)], grounded: me.grounded, form: me.form, alive: me.alive, ink: r2(me.ink),
        sub: me.sub?.kind, items: K.items.map((x) => [x.state, x.why]), events: evs.slice(ev5).map((x) => [x.n, x.e.kind, x.e.why, x.e.reason]), wr: { aiming: me.weaponRunner.aimingSub, spent: me.weaponRunner.subSpent, glide: !!me.weaponRunner.glide },
        stats: Object.fromEntries(Object.keys(GLIDE_STATS).filter((k) => GLIDE_STATS[k] !== g5[k]).map((k) => [k, GLIDE_STATS[k] - g5[k]])) });
      else {
        s5.v.set(0, 0, 0); s5.p.set(0, 0.3, -24);
        let px = 0; hook = () => { px += 2 / 60; L.moveDynamic(pl, V(px, -0.05, -24), V(3, 0.35, 6)); };
        step(1.0); hook = null;
        R('on a moving floor (2 m/s) it rides along with it', Math.abs(s5.p.x - px) < 0.1 && Math.abs(s5.p.y - 0.3) < 0.03, { stoneX: r2(s5.p.x), floorX: r2(px), y: r2(s5.p.y) });
      }
    }
  } catch (e) {
    R('HARNESS', false, { error: String(e && e.stack || e).slice(0, 600) });
  } finally {
    hook = null; DT = 1 / 60;
    P.applyHit = hit0; G.paint.splat = splat0;
    offs.forEach((f) => f());
    netOff(); park();
    delete G.match.lava; delete G.objTargets;
    for (const a of m.actors) { delete a.bot?.update; if (a.bot) { delete a.bot._glide; delete a.bot._glideNoT; } }
    G.subs.clear(); P.clear();
  }
  return out;
})();
