// b5-tuning (2026-10-04, the user: "Make rolling with roller slightly faster than walking speed"; "reduce charger's aim
// assist lock on."; "Make contesting and covering zones more forgiving"):
//   MAP=testbox MODE=turf  PAGE=tools/botlab/tests/tuning.js tools/botlab/run.sh tools/botlab/page.cjs   (roller, assist)
//   MAP=testbox MODE=zones PAGE=tools/botlab/tests/tuning.js tools/botlab/run.sh tools/botlab/page.cjs   (zones)
//   PAGE_ARGS='only=roller,bot,assist,mouse,zones,hud,net,horn' for a part; PAGE_ARGS='old' runs it on the old values
// Staged on testbox (a flat deck, top y 0); everyone else parked far off, brains stubbed.
//  - roller: a kid walking flat out vs the same kid rolling (fire held, a Swell Roller) along the deck, measured over a
//    second of steady motion: rolling a few % to ~10 % faster than walking (config WEAPONS.roller.rollSpeed vs
//    PLAYER.runSpeed), the roll still painting its stripe and still splatting what it runs into;
//  - bot: a roller bot on its own brain on the empty deck rolls (and at the new speed), paints, isn't stuck;
//  - assist: the real PlayerController (src/game/player.js) on a fake gamepad, the same enemy 10 m ahead: the look's
//    slow-down near it (stick: right stick held, Δyaw per frame on it / off it) and the share of its sideways motion the
//    camera carries (pull: left stick held, the target strafing) — the Glint Charger's noticeably less than the
//    Spritzer's, dead centre and 1.6° off; every other weapon's exactly the Spritzer's (only the charger changed);
//  - mouse: the same with the optional mouse assist (settings.aimAssistMouse);
//  - zones (MODE=zones): the thresholds at their edges on the live centre zone — taking (control − 1 % never, + 1 % after
//    the hold), a sliver over the line inked straight back never flips it, losing it (contest − 1 % never, + 1 % after the
//    hold), the contested warning at the warn line; the absolute 72 % take / 37 % neutralise the old 80 / 40 refused;
//    slivers held past a coverage sample (so a run without the hold flips on them);
//  - hud: the share bar's take ticks sit at ZONES.control;
//  - net: the host records the flip (one 'zz') only when it lands; a follower's own ink past the line never flips its
//    copy (owner, zones:zone, the HUD pip) before the host's 'zz', which then applies at once;
//  - horn: a take still in its hold counts for the team behind — at time-up (overtime, not the end) and when the
//    overtime grace runs out (overtime goes on). Last, as on the old code it ends the match. Not run with PAGE_ARGS=old.
// Which checks prove what (PAGE_ARGS=old fails them): the rule values; 72 % / 37 %; the two slivers (the hold). The
// 'after the hold' timings check the hold against the config; hud: the ticks follow ZONES.control (they were fixed at
// 80 % in hud.css — with 'old' it fails only because the HUD read the shipped value at match start); the follower
// check guards an unchanged path; horn: the fix round's _controls (fails on bbade3e's zones.js).
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { WEAPONS, WEAPON_ORDER, PLAYER, ZONES } = await import('./src/config.js');
  const { PlayerController } = await import('./src/game/player.js');
  const { Input } = await import('./src/core/input.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => (ONLY ? ONLY.split(',').includes(k) : true);
  // PAGE_ARGS='old': the values before b5-tuning put back for this run (the roller 4.4 m/s, no charger assist scale,
  // zones 80 % / no hold) — the checks that prove the change must FAIL then
  if (/\bold\b/.test(window.__pageArgs || '')) { WEAPONS.roller.rollSpeed = 4.4; delete WEAPONS.charger.assist; Object.assign(ZONES, { control: 0.8, contest: 0.4, warn: 0.3, flipHold: 0 }); }
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const ctl = new Map();   // per kid: { move: [x, z], fire } held each frame by its stubbed brain
  const stub = (a) => { if (a.bot) a.bot.update = () => { zero(a); const c = ctl.get(a); if (c) { if (c.move) a.intent.move.set(c.move[0], 0, c.move[1]); a.intent.fire = !!c.fire; } }; };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const parkAll = () => others.forEach((a, i) => put(a, V(-24 + (i % 4) * 2, 0, 34 + Math.floor(i / 4) * 2)));
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  const reset = () => {
    hook = null; ctl.clear();
    G.subs?.clear?.(); G.projectiles?.clear?.();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; stub(a);
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0;
    }
    parkAll();
    step(0.1);
  };

  if (m.mode !== 'zones') {
    // ============================================================================================ roller
    if (want('roller')) {
      reset();
      // one run along +z: `fire` held or not; the speed over [t0, t1] s of it (distance / time on the flat), the top speed
      const run = (wid, fire, t0 = 2, t1 = 3.2) => {
        reset(); me.setWeapon(wid); step(0.2);
        put(me, V(0, 0, -36), 0); G.paint.clear?.();
        const turf0 = me.stats.turf;
        ctl.set(me, { move: [0, 1], fire });
        hook = () => { me.ink = PLAYER.inkMax; };
        let p0 = null, p1 = null, top = 0, rolled = 0, n = 0;
        step(t1, (i) => { const t = (i + 1) * DT, hs = Math.hypot(me.vel.x, me.vel.z);
          if (Math.abs(t - t0) < DT / 2) p0 = me.pos.clone();
          if (t > t0) { top = Math.max(top, hs); n++; if (me.weaponRunner.rolling) rolled++; } });
        p1 = me.pos.clone();
        ctl.delete(me); hook = null; step(0.5);
        const v = Math.hypot(p1.x - p0.x, p1.z - p0.z) / (t1 - t0);
        return { v: r3(v), top: r3(top), rolling: r2(rolled / Math.max(1, n)), turf: r2(me.stats.turf - turf0), z: r2(p1.z), grounded: me.grounded };
      };
      const walk = run('roller', false), roll = run('roller', true), walkS = run('shooter', false);
      const k = roll.v / walk.v;
      R(`walking (no trigger) with the roller ${walk.v} m/s = with the Spritzer ${walkS.v} m/s = PLAYER.runSpeed ${PLAYER.runSpeed}`,
        Math.abs(walk.v - PLAYER.runSpeed) < 0.15 && Math.abs(walkS.v - walk.v) < 0.05, { walk, walkS });
      R(`rolling ${roll.v} m/s vs walking ${walk.v} m/s: ×${r3(k)} — slightly faster (×1.02 … ×1.12; config rollSpeed ${WEAPONS.roller.rollSpeed})`,
        k >= 1.02 && k <= 1.12 && roll.rolling > 0.95, { roll, walk });
      R(`the roll still paints its stripe on the way (${roll.turf} m² in 3.2 s; walking ${walk.turf})`, roll.turf > 25 && walk.turf < 1, { roll: roll.turf, walk: walk.turf });
      // still splats what it runs into at the new speed: a foe standing in the lane
      {
        reset(); me.setWeapon('roller'); step(0.2);
        const F = foes[0]; put(me, V(0, 0, -36), 0); put(F, V(0, 0, -24), Math.PI);
        const hits = []; const off = on('damage', (e) => { if (e.attacker === me && e.victim === F) hits.push({ src: e.source, amt: r2(e.amount) }); });
        ctl.set(me, { move: [0, 1], fire: true }); hook = () => { me.ink = PLAYER.inkMax; };
        step(3, () => !(hits.length && !F.alive) ? undefined : false);
        off(); ctl.delete(me); hook = null;
        R('rolling into a foe at the new speed still splats it (the drum)', !F.alive && hits.some((h) => h.src === 'roller'), { hits, alive: F.alive });
      }
    }

    // ============================================================================================ roller bot
    if (want('bot')) {
      reset();
      const E = mates[0];
      E.setWeapon('roller'); step(0.3);
      others.forEach((a, i) => { if (a !== E) put(a, V(-26 + (i % 4) * 1.5, 0, 38 + Math.floor(i / 4) * 1.5)); });
      put(me, V(-20, 0, 36), 0);
      put(E, V(0, 0, -30), 0);
      delete E.bot.update;   // (its own brain again)
      const turf0 = E.stats.turf, p0 = E.pos.clone(), modes = {};
      let rolled = 0, fast = 0, n = 0, path = 0, last = E.pos.clone();
      step(10, () => { modes[E.bot.mode] = (modes[E.bot.mode] || 0) + 1; n++; const hs = Math.hypot(E.vel.x, E.vel.z);
        if (E.weaponRunner.rolling) { rolled++; if (hs > PLAYER.runSpeed + 0.1) fast++; }
        path += E.pos.distanceTo(last); last.copy(E.pos); });
      stub(E);
      R(`bots: a roller bot on its own brain, the empty deck, 10 s — rolls ${Math.round(100 * rolled / n)} % of the time (${Math.round(100 * fast / Math.max(1, rolled))} % of that faster than walking), ${r2(path)} m covered, ${r2(E.stats.turf - turf0)} m² inked`,
        rolled / n > 0.4 && fast / Math.max(1, rolled) > 0.3 && path > 30 && E.stats.turf - turf0 > 50, { modes, start: [r2(p0.x), r2(p0.z)], end: [r2(E.pos.x), r2(E.pos.z)] });
    }

    // ============================================================================================ aim assist
    if (want('assist') || want('mouse')) {
      reset();
      const S = G.settings, keep = { aimAssist: S.aimAssist, aimAssistMouse: S.aimAssistMouse, sensitivity: S.sensitivity, padSensitivity: S.padSensitivity, invertY: S.invertY };
      S.aimAssist = 1; S.sensitivity = 1; S.padSensitivity = 1; S.invertY = false;
      const cam = G.camera, F = foes[0];
      // a fake input: a gamepad (right stick = look, left stick = move) or a mouse; nothing else pressed
      const inp = { pad: { axes: [0, 0, 0, 0], buttons: [] }, lastDevice: 'pad', mouse: { dx: 0, dy: 0, left: false, right: false }, padPressed: new Set(),
        down: () => false, wasPressed: () => false, padButton: () => false, padValue: () => 0, padStick: Input.prototype.padStick };
      const rig = { yaw: 0, pitch: 0 };
      const pc = new PlayerController(me, rig, inp);
      const P0 = V(0, 0, -20);
      // the camera at the kid's eye, turned `off` rad (yaw) away from the target's chest (> 0: the target sits to its left)
      const aimCam = (off = 0) => {
        const c = V(F.pos.x, F.pos.y + 0.95, F.pos.z), e = V(me.pos.x, me.pos.y + 1.5, me.pos.z);
        cam.position.copy(e);
        const d = c.clone().sub(e), yaw = Math.atan2(d.x, d.z) - off, h = Math.hypot(d.x, d.z);
        cam.lookAt(e.x + Math.sin(yaw) * h, c.y, e.z + Math.cos(yaw) * h); cam.updateMatrixWorld(true);
      };
      const setup = (wid, dist = 10) => {
        reset(); me.setWeapon(wid);
        put(me, P0, 0); put(F, V(0, 0, P0.z + dist), Math.PI); F.invuln = 0; F.form = 'kid';
        pc.assist.has = false; pc.assist.target = null; pc.padLook.x = pc.padLook.y = 0; pc.edgeT = 0;
      };
      // stick: Δyaw per frame with the look input held, the target dead centre (off) vs no target (F splatted away)
      const stickRatio = (wid, mode, off = 0, dist = 10) => {
        setup(wid, dist);
        const look = (has) => {
          if (!has) put(F, V(30, 0, 30), 0);
          let d = 0;
          for (let i = 0; i < 40; i++) {
            aimCam(off);
            if (mode === 'pad') { inp.lastDevice = 'pad'; inp.pad.axes[2] = 0.6; inp.pad.axes[3] = 0; inp.mouse.dx = 0; }
            else { inp.lastDevice = 'kbm'; inp.pad.axes[2] = 0; inp.mouse.dx = 8; }
            const y0 = rig.yaw; pc.update(DT); if (i >= 30) d += rig.yaw - y0;
            rig.yaw = 0; rig.pitch = 0;
          }
          inp.pad.axes[2] = 0; inp.mouse.dx = 0;
          return { d, has: pc.assist.has && pc.assist.target === F };
        };
        const on1 = look(true), off1 = look(false);
        return { k: r3(on1.d / off1.d), on: on1.has, off: !off1.has };
      };
      // pull: the left stick held (moving), no look input; the target strafes 3 m/s across the view (camera kept `off`
      // from it) — the share of its angular motion the camera follows
      const pullShare = (wid, mode, off = 0, dist = 10) => {
        setup(wid, dist);
        inp.lastDevice = mode; inp.pad.axes[1] = mode === 'pad' ? -0.9 : 0; inp.pad.axes[2] = 0; inp.mouse.dx = 0;
        if (mode !== 'pad') inp.down = (c) => c === 'KeyW';
        // the target's bearing from the camera (as the assist measures it), frame to frame, vs the yaw the assist adds
        const bearing = () => { const c = V(F.pos.x, F.pos.y + 0.95, F.pos.z).sub(cam.position); return Math.atan2(c.x, c.z); };
        let follow = 0, ang = 0, seen = 0, prev = null;
        for (let i = 0; i < 40; i++) {
          aimCam(off);
          const b = bearing(), y0 = rig.yaw;
          pc.update(DT);
          if (prev !== null && i >= 3) { follow += rig.yaw - y0; ang += b - prev; }
          prev = b; rig.yaw = 0; rig.pitch = 0;
          if (pc.assist.has && pc.assist.target === F) seen++;
          F.pos.x += 3 * DT;   // (strafing across the view)
        }
        inp.pad.axes[1] = 0; inp.down = () => false;
        return { k: r3(follow / ang), seen: r2(seen / 40) };
      };
      const OFF = 1.6 * Math.PI / 180;
      if (want('assist')) {
        S.aimAssistMouse = false;
        const st = { shooter: stickRatio('shooter', 'pad'), charger: stickRatio('charger', 'pad') };
        const stO = { shooter: stickRatio('shooter', 'pad', OFF), charger: stickRatio('charger', 'pad', OFF) };
        const pu = { shooter: pullShare('shooter', 'pad'), charger: pullShare('charger', 'pad') };
        const puO = { shooter: pullShare('shooter', 'pad', OFF), charger: pullShare('charger', 'pad', OFF) };
        const slow = (x) => r3(1 - x.k);   // how much the look slows (0 = none)
        R(`pad, the same foe 10 m off, dead centre — the look slows ×${st.shooter.k} on it with the Spritzer, ×${st.charger.k} with the Glint Charger (the slow-down ${slow(st.charger)} vs ${slow(st.shooter)}: ≤ 60 % of it)`,
          st.shooter.on && st.charger.on && st.shooter.off && st.charger.off && slow(st.shooter) > 0.3 && slow(st.charger) <= 0.6 * slow(st.shooter), st);
        R(`pad, 1.6° off the foe — Spritzer ×${stO.shooter.k}, Glint Charger ×${stO.charger.k} (its window is narrower too: ≤ 50 % of the slow-down)`,
          slow(stO.shooter) > 0.15 && slow(stO.charger) <= 0.5 * slow(stO.shooter), stO);
        R(`pad, the foe strafing 3 m/s, dead centre — the camera carries ${pu.shooter.k} of its motion with the Spritzer, ${pu.charger.k} with the Glint Charger (≤ 50 % of it)`,
          pu.shooter.k > 0.3 && pu.charger.k > 0.02 && pu.charger.k <= 0.5 * pu.shooter.k, pu);
        R(`pad, the foe strafing, 1.6° off — Spritzer ${puO.shooter.k}, Glint Charger ${puO.charger.k} (≤ 40 %)`,
          puO.shooter.k > 0.15 && puO.charger.k <= 0.4 * puO.shooter.k, puO);
        // only the charger: every other roster weapon is exactly the Spritzer's (4.5 m: inside every weapon's reach)
        const ref = { st: stickRatio('shooter', 'pad', 0, 4.5), pu: pullShare('shooter', 'pad', 0, 4.5) }, diff = [];
        for (const w of WEAPON_ORDER) {
          if (w === 'charger' || w === 'shooter') continue;
          const s = stickRatio(w, 'pad', 0, 4.5), p = pullShare(w, 'pad', 0, 4.5);
          if (Math.abs(s.k - ref.st.k) > 0.005 || Math.abs(p.k - ref.pu.k) > 0.01 || !s.on) diff.push([w, s.k, p.k]);
        }
        R(`only the charger changed: every other weapon's stick / pull 4.5 m off = the Spritzer's (×${ref.st.k} / ${ref.pu.k})`, !diff.length, { ref, diff, assist: Object.fromEntries(WEAPON_ORDER.map((w) => [w, WEAPONS[w].assist || null])) });
      }
      if (want('mouse')) {
        S.aimAssistMouse = true;
        const st = { shooter: stickRatio('shooter', 'kbm'), charger: stickRatio('charger', 'kbm') };
        const pu = { shooter: pullShare('shooter', 'kbm'), charger: pullShare('charger', 'kbm') };
        const slow = (x) => r3(1 - x.k);
        R(`mouse (assist opted in), dead centre — the look slows ×${st.shooter.k} Spritzer / ×${st.charger.k} Glint Charger; the camera carries ${pu.shooter.k} / ${pu.charger.k} of a strafe (both ≤ 60 %)`,
          slow(st.shooter) > 0.12 && slow(st.charger) <= 0.6 * slow(st.shooter) && pu.shooter.k > 0.12 && pu.charger.k <= 0.6 * pu.shooter.k, { st, pu });
        S.aimAssistMouse = false;
        const none = stickRatio('charger', 'kbm');
        R('mouse with the assist off: no slow-down at all (×1)', Math.abs(none.k - 1) < 0.001, none);
      }
      Object.assign(S, keep);
    }
  }

  // ============================================================================================ zones
  if (m.mode === 'zones' && (want('zones') || want('hud') || want('net') || want('horn'))) {
    reset();
    for (const a of m.actors) put(a, V(-24 + (m.actors.indexOf(a) % 4) * 2, 0, 34 + Math.floor(m.actors.indexOf(a) / 4) * 2));
    const Z = m.zones;
    Z.nextSwap = 999;                                         // (no rotation mid-test)
    const z = Z.active.zones[0], N = z.cells.length, grid = G.paint.grid;
    // the zone's cells: the first a·N team 0's, the next b·N team 1's, the rest bare (written straight into the turf grid)
    const ink = (a, b) => { const na = Math.round(a * N), nb = Math.round(b * N); z.cells.forEach((c, i) => { grid[c] = i < na ? 1 : i < na + nb ? 2 : 0; }); };
    const own = () => z.owner;
    // hold an ink pattern for s seconds (re-written every frame: the capture flood can't creep in); the time the owner changed
    const hold = (a, b, s) => { const o0 = own(); let at = null; hook = () => ink(a, b); step(s, (i) => { if (at === null && own() !== o0) at = r2((i + 1) * DT); }); hook = null; return at; };
    const neutral = () => { hold(0, 0, 0.1); if (own() !== -1) { Z._zoneOwner(z, -1); Z._setOwner(-1); } hold(0, 0, 0.5); };
    const C = ZONES.control, K = ZONES.contest, W = ZONES.warn, H = ZONES.flipHold;
    if (want('zones')) {
      neutral();
      R(`the rules: take at ${Math.round(C * 100)} % (was 80), neutralise at ${Math.round(K * 100)} % (was 40), warn at ${Math.round(W * 100)} % (was 30), over the line ${H} s before a flip (was 0)`,
        C <= 0.72 && C >= 0.65 && K <= 0.37 && K >= 0.3 && W < K - 0.05 && H >= 0.4 && H <= 1, { control: C, contest: K, warn: W, flipHold: H });
      // the absolute edges the old rules failed: 72 % takes a zone (80 % was needed), 37 % of a held one neutralises it (40 %)
      let t72 = hold(0.72, 0.1, 2); const o72 = own();
      hold(1, 0, 1.2); const t37 = hold(0.63, 0.37, 2), o37 = own();
      R(`72 % takes a neutral zone (the old rules needed 80 %): after ${t72} s; then 37 % of it inked back by the other team (the old rules needed 40 %) neutralises it after ${t37} s`, o72 === 0 && o37 === -1 && t37 !== null, { t72, o72, t37, o37 });
      neutral();
      let t = hold(C - 0.01, 0.1, 3);
      R(`taking: ${Math.round((C - 0.01) * 100)} % for 3 s never takes it`, t === null && own() === -1, { owner: own(), share: z.share });
      t = hold(C + 0.01, 0.1, 2);
      R(`taking: ${Math.round((C + 0.01) * 100)} % (well short of the old 80) takes it after the hold — ${t} s (${H} … ${r2(H + 0.45)})`, own() === 0 && t !== null && t >= H - 0.01 && t <= H + 0.45, { t, owner: own() });
      neutral();
      // a sliver over the line, inked straight back: never a flip. (SL ≥ 0.35 s: longer than a coverage sample (5 Hz), so
      // without the hold — PAGE_ARGS=old — the sliver IS sampled over the line and flips the zone: these checks fail then)
      const SL = Math.max(0.35, H - 0.25);
      hold(C + 0.01, 0.1, SL); t = hold(C - 0.03, 0.12, 2.5);
      R(`a sliver: ${Math.round((C + 0.01) * 100)} % for ${r2(SL)} s, then inked back to ${Math.round((C - 0.03) * 100)} % — never taken`, own() === -1, { owner: own(), t });
      // losing it: held by team 0 (flooded), the other team inks it back
      hold(1, 0, 1.5);
      const heldOk = own() === 0;
      const contests = []; const offC = on('zones:contest', (e) => contests.push(r2(e.share)));
      t = hold(1 - (W - 0.02), W - 0.02, 2.5);
      R(`held: the other team at ${Math.round((W - 0.02) * 100)} % — still held, no contested warning yet`, heldOk && own() === 0 && !contests.length, { owner: own(), contests });
      t = hold(1 - (W + 0.01), W + 0.01, 1);
      R(`held: the other team at ${Math.round((W + 0.01) * 100)} % (the warn line) — "contested" warned, still held`, own() === 0 && contests.length === 1, { contests });
      t = hold(1 - (K - 0.01), K - 0.01, 3);
      R(`losing: the other team at ${Math.round((K - 0.01) * 100)} % for 3 s — still held`, own() === 0 && t === null, { owner: own() });
      hold(1 - (K + 0.01), K + 0.01, SL); t = hold(1 - (K - 0.06), K - 0.06, 2);
      R(`a sliver: the other team at ${Math.round((K + 0.01) * 100)} % for ${r2(SL)} s, inked back to ${Math.round((K - 0.06) * 100)} % — still held`, own() === 0, { owner: own() });
      t = hold(1 - (K + 0.01), K + 0.01, 2);
      R(`losing: the other team at ${Math.round((K + 0.01) * 100)} % — neutral after the hold (${t} s)`, own() === -1 && t !== null && t >= H - 0.01 && t <= H + 0.45, { t, owner: own(), objOwner: Z.owner });
      offC();
      // after a neutralise the old holder needs the full take share again (no retake on a sliver)
      t = hold(1 - K - 0.02, K + 0.02, 2);
      R(`after the neutralise, the old holder at ${Math.round((1 - K - 0.02) * 100)} % (short of ${C * 100}) doesn't get it back`, own() === -1 && Z.owner === -1, { owner: own() });
      neutral();
    }
    if (want('hud')) {
      g.hud?.setVisible?.(true);
      hold(0.5, 0.2, 0.6);
      for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
      const bar = document.querySelector('.iw-zo__sh'), ta = bar && bar.querySelector('.ta'), tb = bar && bar.querySelector('.tb');
      const bw = bar ? bar.clientWidth : 0, la = ta ? ta.offsetLeft : -1, lb = tb ? tb.offsetLeft : -1;
      R(`HUD: the share bar's take ticks sit at ${C * 100} % from each end (${r2(la)} / ${r2(lb)} px of ${r2(bw)})`, bw > 10 && Math.abs(la / bw - C) < 0.02 && Math.abs(lb / bw - (1 - C)) < 0.02, { la, lb, bw });
      g.hud?.setVisible?.(false);
    }
    if (want('net')) {
      neutral();
      // (the zone engine's own record hook — G.netm.recZone online — caught on this instance)
      const recs = []; Z._net = (e) => recs.push({ e: e[0], z: e[1], o: e[2], t: r2(Z.clock) });
      const t0 = r2(Z.clock); const t = hold(C + 0.02, 0.05, 1.5);
      delete Z._net;
      const zz = recs.filter((r) => r.e === 'zz');
      R(`online (host): one 'zz' record, sent when the take lands (${zz[0] && r2(zz[0].t - t0)} s after the ink), none while it waits`, zz.length === 1 && zz[0].o === 0 && zz[0].t - t0 >= H - 0.01, { recs, t });
      neutral();
      // a follower (a guest's copy), its own ink past the take line for 1.5 s — over twice the hold the host waits out:
      // its zone stays neutral (no zones:zone, the HUD's zone pip not held) until the host's 'zz' arrives, which then
      // applies at once (owner, event, HUD). (The follower path itself is unchanged by b5-tuning — a guest never decided a
      // capture — this guards it through the longer window the hold opens between the ink and the host's record.)
      g.hud?.setVisible?.(true);
      const kf = Object.getOwnPropertyDescriptor(m, 'follower'); m.follower = true;
      const zev = [], offZ = on('zones:zone', (e) => { if (e.zone === z) zev.push(e.owner); });
      const pip = () => { const el = document.querySelectorAll('.iw-zo__z')[Z.active.zones.indexOf(z)]; return el ? el.classList.contains('is-held') : null; };
      hold(C + 0.05, 0.05, 1.5);
      const bf = { owner: own(), events: [...zev], held: pip(), share: r3(z.share[0]), pend: z.pend };
      Z.netEvent(['zz', z.id, 0]); step(3 / 60);
      const got = { owner: own(), events: [...zev], held: pip() };
      offZ();
      if (kf) Object.defineProperty(m, 'follower', kf); else delete m.follower;
      g.hud?.setVisible?.(false);
      R(`online (follower): its own ink at ${Math.round(bf.share * 100)} % for 1.5 s — still neutral (owner ${bf.owner}, no zones:zone, HUD pip ${bf.held ? 'held' : 'neutral'}); the host's 'zz' then applies at once (owner ${got.owner}, HUD pip ${got.held ? 'held' : 'neutral'})`,
        bf.owner === -1 && !bf.events.length && bf.held === false && bf.pend === null && got.owner === 0 && got.events.join() === '0' && got.held === true, { before: bf, got });
      Z._zoneOwner(z, -1); Z._setOwner(-1);
    }
    // ---- the horn and overtime with a take still in its hold: the hold filters slivers, it must not cost the team behind
    // a real take. Team 1 behind (count 90 vs 40). Both fail on b5-tuning's zones.js before fix round 1 (bbade3e), which
    // read only owner / lastOwner / neutralT; with PAGE_ARGS=old (no hold) a take lands before either moment.
    if (want('horn') && H > 0) {   // (PAGE_ARGS=old: no hold, nothing ever waits — not run)
      const setCounts = () => { Z.count[0] = 40; Z.count[1] = 90; Z.penalty[0] = Z.penalty[1] = 0; Z.tieEnd = [null, null]; };
      // (1) overtime: team 1 off the objective, its 10 s grace 0.3 s from running out, inks the zone past the take line —
      //     the grace runs out while the take is in its hold: overtime goes on and the take lands. (Z._end recorded, not
      //     played: the match itself doesn't end here, so the horn check below still runs on the old code.)
      neutral(); setCounts();
      const ends = [], keepEnd = Z._end;
      Z._end = (w, r) => { ends.push([w, r]); Z.winner = w; Z.reason = r; };
      Object.assign(Z, { overtime: true, overtimeT: 0, otLosing: 1, lastOwner: 1, neutralT: ZONES.overtimeGrace - 0.3 });
      m.time = 0;
      let pendAt = null;
      const tO = (() => { const o0 = own(); let at = null; hook = () => ink(0.05, C + 0.02);
        step(1.5, (i) => { if (pendAt === null && z.pend && z.pend.to === 1) pendAt = r2((i + 1) * DT); if (at === null && own() !== o0) at = r2((i + 1) * DT); }); hook = null; return at; })();
      const ot = { ends: [...ends], zone: own(), objective: Z.owner, overtime: Z.overtime, takeAt: tO, pendAt, graceOutAt: 0.3 };
      Z._end = keepEnd; Object.assign(Z, { winner: null, reason: null, overtime: false, overtimeT: 0, otLosing: -1 });
      m.time = 200;
      R(`overtime: team 1 behind, off the objective, its grace running out 0.3 s in — its take of the zone in its hold from ${pendAt} s: overtime goes on, the take lands (${tO} s)`,
        !ot.ends.length && pendAt !== null && pendAt < 0.3 && tO !== null && tO > 0.3 && ot.zone === 1 && ot.objective === 1, ot);
      // (2) time-up: team 1 inks the neutral centre past the take line 0.3 s before the horn; team 0 held it last (no
      //     grace) — overtime at the horn, the take lands in it, the match plays on. (Last: on the old code this ends the match.)
      neutral(); setCounts();
      Object.assign(Z, { lastOwner: 0, neutralT: 30 });
      m.time = 0.3;
      const ev = [], offO = on('zones:overtime', (e) => ev.push(e.losing)), offE = on('zones:end', (e) => ev.push('end ' + e.winner + ' ' + e.reason));
      let otAt = null, takeAt = null, pend2 = null; hook = () => ink(0.05, C + 0.02);
      step(1.5, (i) => { const tt = r2((i + 1) * DT);
        if (pend2 === null && z.pend && z.pend.to === 1) pend2 = tt;
        if (otAt === null && Z.overtime) otAt = tt;
        if (takeAt === null && own() === 1) takeAt = tt;
        if (m.state !== 'playing') return false; });
      hook = null; offO(); offE();
      R(`time-up: team 1 behind takes the neutral centre over the line 0.3 s before the horn (in its hold from ${pend2} s; team 0 held it last) — overtime at the horn (${otAt} s), the take lands in it (${takeAt} s), the match plays on`,
        otAt !== null && otAt <= 0.35 && ev[0] === 1 && takeAt !== null && takeAt > otAt && m.state === 'playing' && Z.winner == null && Z.owner === 1, { otAt, takeAt, pend2, ev, state: m.state, winner: Z.winner, owner: Z.owner });
    }
  }
  return out;
})();
