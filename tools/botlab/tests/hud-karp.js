// [karp-face] Bazookarp's HUD (SPEC §10.1 hud-karp.js, §6.1–6.5) on any stage (default testbox: placeholder data),
// deterministic (frozen clock, 60 Hz, bots parked):
//   A the count badges and the Carp Line follow the state (counts, weirs at their counts and grey once lowered, each
//     team's best notch, the carp marker by the field, padlocks on sealed Gates, the fuse on the carp while carried,
//     overtime's gold frame and draining window)
//   B the over-head marker: seen by both teams in kid form; hidden from the enemy (not the team) while the carrier swims;
//     pinned to the screen edge with its distance when off screen; never over your own head
//   C the carrier's own screen: DON'T RETREAT! / CARP-FREE ZONE! the same frame its rate changes; the reticle's fuse ring
//     and charge; the carp on the special orb and the squad badge
//   D the fuse display rule with stub snapshots (a follower): jumps forward at once, gives back ≤ 0.2 s per second
//   E prompts at their moments; call-outs per event (and one replaces the next within 1.5 s); "Can't use" notes
//   F the shell's meter tag; weir / Gate tags
//   G the cues (sfx-karp.js) on their events; the map layer draws (both layers) without error
//   H the results screen: every reason in SPEC §1.1's words, CARRIED / POPS columns, the carp in the centre label
//   I (review round 1) the GATE tag never rides up into the top bar; a weir tag on a live call-out fades out of its way;
//     the meter tag isn't drawn right under the status pill that already says the same; our call-out sits under a live
//     kill call-out (WIPEOUT!); the carrier's last 10 s in big beating digits — run it at W=960 H=600 too
//   MAP=testbox MODE=bazookarp PAGE=tools/botlab/tests/hud-karp.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, Kp = m.karp, H = g.hud;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  if (!Kp) { R('a Bazookarp match', false, { mode: m.mode }); return out; }
  const THREE = await import('three');
  const { BAZOOKARP: K } = await import('./src/config.js');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  for (const a of m.actors) { if (!a.alive) a.respawn(); zero(a); }
  const me = m.local, ally = m.actors.find((a) => a.team === me.team && a !== me), foe = m.actors.find((a) => a.team !== me.team);
  const P = Kp.R.pond, G0 = Kp.gates[me.team], dz = Math.sign(G0.pos.z - P.z) || 1;
  const spot = (x, z, y = null) => { let best = null, bd = Infinity; for (const id of G.nav.validIds) { const n = G.nav.nodes[id]; if (n.zone >= 0) continue; const d = Math.hypot(n.x - x, n.z - z) + (y == null ? 0 : Math.abs(n.y - y) * 0.6); if (d < bd) { bd = d; best = n; } } return V(best.x, best.y, best.z); };
  const put = (a, p, yaw = 0) => { if (!a.alive) a.respawn(); a.pos.copy(p); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.invuln = 0; a.hp = 100; a.form = 'kid'; a.submerged = false; zero(a); };
  const S = () => H.karp.state();
  const grab = (a) => { Kp.shell.clear(); Kp.pos.copy(a.pos); Kp._setPhase('free', 0); Kp.claims.length = 0; Kp._applyGrant(a); };
  const release = () => { for (const a of m.actors) if (a.carry) Kp._release(a); Kp._setPhase('shielded'); Kp.shell.form(P, 1000, 0); Kp.pos.copy(P); };
  const facePond = (a) => { a.yaw = a.aimYaw = Math.atan2(P.x - a.pos.x, P.z - a.pos.z); };
  const follow = () => { g.rig.follow(me, true); g.rig.yaw = me.yaw; g.rig.pitch = -0.15; step(1 / 60); if (g.rig.blend) g.rig.blend.active = false; g.rig.follow(me, true); step(1 / 60); };
  step(0.3);

  // ---- A. the badges and the Carp Line
  const zc = (t) => H.zc[t ^ me.team].querySelector('.iw-zc__num').textContent;
  Kp.count = [me.team === 0 ? 72 : 88, me.team === 0 ? 88 : 72]; step(2 / 60);
  let s = S();
  const wMine = s.line.weirs.filter((w) => w.mine), wTheirs = s.line.weirs.filter((w) => !w.mine);
  const wc = Kp.weirs[me.team][0].count, wct = Kp.weirs[1 - me.team][0].count;
  R('A1. the count badges: your team\'s count left, theirs right', zc(me.team) === '72' && zc(1 - me.team) === '88', { left: zc(me.team), right: zc(1 - me.team) });
  R('A2. the Carp Line: your weir right of the Pond at its count, theirs left at theirs; best notches at each count', wMine.length >= 1 && wTheirs.length >= 1 && Math.abs(wMine[0].x - (0.5 + 0.5 * (1 - wc / 100))) < 0.01 && Math.abs(wTheirs[0].x - (0.5 - 0.5 * (1 - wct / 100))) < 0.01
    && Math.abs(s.line.best[1] - (0.5 + 0.5 * 0.28)) < 0.01 && Math.abs(s.line.best[0] - (0.5 - 0.5 * 0.12)) < 0.01, s.line);
  R('A3. both Gates padlocked while sealed', s.line.gates.every((x) => !x) && [...H.karp.lGate].every((e) => !e.classList.contains('is-up')), s.line.gates);
  Kp.lowered[me.team] = true; Kp.gateUp[me.team] = true; step(2 / 60); s = S();
  R('A4. your weirs grey once lowered, your Gate open', s.line.weirs.filter((w) => w.mine).every((w) => w.low) && s.line.gates[1] && H.karp.lGate[1].classList.contains('is-up'), s.line);
  Kp.lowered[me.team] = false; Kp.gateUp[me.team] = false; Kp.count = [100, 100];
  // the carp marker: at the Pond 0.5; carried onto their half it moves right, onto yours left (by the field)
  put(me, spot(P.x, P.z + dz * 1.2, P.y)); grab(me); step(0.1);
  put(me, spot(P.x, P.z + dz * 12, P.y)); step(0.3); const xr = S().line.carp, held = S().line;
  put(me, spot(P.x, P.z - dz * 12, P.y)); step(0.3); const xl = S().line.carp;
  R('A5. the carp marker follows the Bazookarp by the field: right of the Pond on their half, left on yours; it wears the fuse while carried', xr > 0.55 && xl < 0.45 && held.held && held.secs > 0, { xr, xl, held: held.held, secs: held.secs });
  release(); step(0.1);
  Kp.overtime = true; Kp.otLosing = 1 - me.team; Kp.otWin = { left: 6, open: true, closeT: null, grace: 0 }; step(2 / 60); s = S();
  R('A6. overtime: the gold frame and the pick-up window draining', s.line.ot && Math.abs(s.line.win - 6) < 0.3 && H.karp.line.classList.contains('is-ot') && H.karp.line.classList.contains('is-win'), { ot: s.line.ot, win: s.line.win });
  Kp.overtime = false; Kp.otWin = { left: 10, open: false, closeT: null, grace: 0 }; Kp.otLosing = -1;

  // ---- B. the over-head marker
  put(me, spot(P.x, P.z - dz * 10, P.y)); facePond(me);
  put(ally, spot(P.x + 1, P.z - dz * 2, P.y)); grab(ally); step(0.1); follow();
  const mAlly = S().marker;
  release(); step(0.05);
  put(foe, spot(P.x + 1, P.z - dz * 2, P.y)); grab(foe); step(0.1); follow();
  const mFoe = S().marker;
  G.paint.splat(foe.pos.clone().setY(foe.pos.y + 0.3), 2.5, foe.team, { seed: 3 }); foe.intent.squid = true; step(0.2); const mFoeSwim = S().marker, fsub = foe.submerged; foe.intent.squid = false; step(0.2);
  release(); step(0.05);
  put(ally, spot(P.x + 1, P.z - dz * 2, P.y)); grab(ally); G.paint.splat(ally.pos.clone().setY(ally.pos.y + 0.3), 2.5, ally.team, { seed: 4 }); ally.intent.squid = true; step(0.2); const mAllySwim = S().marker, asub = ally.submerged; ally.intent.squid = false; step(0.2);
  R('B1. the marker over a carrier: shown in kid form to its team and to the enemy', !!mAlly && mAlly.onScreen && !!mFoe && mFoe.onScreen && mFoe.secs > 0, { mAlly, mFoe });
  R('B2. while the carrier swims: hidden from the enemy, still shown to its own team', fsub && asub && mFoeSwim === null && !!mAllySwim, { fsub, asub, mFoeSwim, mAllySwim });
  me.yaw = me.aimYaw = Math.atan2(-(P.x - me.pos.x), -(P.z - me.pos.z)); follow();
  const pin = S().marker;
  R('B3. off screen: pinned to the edge with the distance', !!pin && !pin.onScreen && pin.dist > 0, pin);
  release(); step(0.05);
  put(me, spot(P.x, P.z + dz * 1, P.y)); grab(me); step(0.1);
  R('B4. never over your own head (the reticle carries your fuse)', S().marker === null && !!S().reticle, { marker: S().marker, reticle: S().reticle });

  // ---- C. the carrier's own screen
  const J = me.carry.j;
  put(me, spot(P.x, P.z - dz * 3, P.y)); step(0.1);
  me.intent.move.set(0, 0, -dz); let frames = 0, rateAt = -1, botAt = -1;
  for (let i = 0; i < 240 && botAt < 0; i++) { dbg.step(1000 / 60); frames++; if (rateAt < 0 && J.rate > 1) rateAt = frames; if (S().bottom) botAt = frames; }
  zero(me); step(2 / 60);
  R('C1. DON\'T RETREAT! shows the same frame its own screen judges ×3', rateAt > 0 && botAt === rateAt && /DON'T RETREAT/.test(S().bottom?.[0] || ''), { rateAt, botAt, bottom: S().bottom });
  // (a floor node inside your own zone, outside the spawn barrier: on a raised spawn deck the zone ends at the deck's edge)
  { let zq = null, zd = Infinity; for (const id of G.nav.validIds) { const n = G.nav.nodes[id]; if (n.zone >= 0 || Kp.field.inFreeZone(me.team, n) < 0) continue; const pd = G.level.spawnPads[me.team], d = Math.abs(Math.hypot(n.x - pd.x, n.z - pd.z) - 6); if (d < zd) { zd = d; zq = n; } }
    if (zq) put(me, V(zq.x, zq.y, zq.z)); }
  J.mark = NaN; step(0.1);
  R('C2. in your own Carp-Free Zone: CARP-FREE ZONE!', /CARP-FREE ZONE/.test(S().bottom?.[0] || ''), { bottom: S().bottom, why: J.why });
  put(me, spot(P.x, P.z + dz * 4, P.y)); J.mark = NaN; step(0.2);
  R('C3. back to ×1: the bottom line goes', S().bottom === null, S().bottom);
  Kp.fuse = Kp.hud.fuseShown = 41.3; me.intent.fire = true; step(0.6); const rc = S().reticle; me.intent.fire = false; step(0.5);
  R('C4. the reticle: the fuse\'s whole seconds and the charge', !!rc && rc.secs >= 40 && rc.secs <= 42 && rc.charge > 0.2, rc);
  const orbHas = !!(H.spIcon && /M8 16 Q14 8.4 23 9.4/.test(H.spIcon.innerHTML));
  const sq = [...H.el.querySelectorAll('.iw-sq.is-karp')];
  R('C5. the carp on the special orb (specialId karp) and the carrier\'s squad badge', orbHas && sq.length === 1, { orb: orbHas, badges: sq.length });
  release(); step(0.1);

  // ---- D. the fuse display rule (a follower's screen, stub snapshots)
  put(me, spot(P.x, P.z + dz * 1, P.y)); grab(me); step(0.05);
  m.follower = true;
  // (snapshots are stamped with the host's wire clock; offline the wire's clock is the engine's: age 0 here)
  const tb = () => Kp.wire.hostNow();
  Kp.hud.fuseShown = 40; m.time = m.duration - 100;
  Kp._fuseSync(38, 1, tb());   // the host is 2 s ahead: jump now
  const jump = Kp.hud.fuseShown;
  let maxRise = 0, prev = Kp.hud.fuseShown;
  for (let i = 0; i < 20; i++) { m.time -= 0.1; Kp._hudFuse(0.1); Kp._fuseSync(45, 1, tb()); maxRise = Math.max(maxRise, Kp.hud.fuseShown - prev); }
  const give = Kp.hud.fuseShown - (38 - 2.0);
  m.follower = false;
  R('D1. the shown fuse jumps forward at once to the host\'s', Math.abs(jump - 38) < 1e-6, { jump });
  R('D2. it gives time back by at most 0.2 s per second (over 2 s: ≤ 0.4 above its own run)', give <= 0.4 + 1e-6 && give > 0, { give: +give.toFixed(3), maxStep: +maxRise.toFixed(3) });
  release(); step(0.1);

  // ---- E. prompts, call-outs, notes
  const prom = () => H.promptEl?.textContent || '';
  Kp.clock = 2; put(me, spot(P.x, P.z - dz * 15, P.y)); step(2 / 60);
  const p1 = prom();
  Kp.clock = 30; Kp.shell.clear(); Kp._setPhase('free', 0); put(me, spot(P.x, P.z - dz * 6, P.y)); step(2 / 60);
  const p2 = prom();
  put(foe, spot(P.x, P.z + dz * 1, P.y)); grab(foe); step(2 / 60); const p3 = prom(); release();
  R('E1. prompts at their moments (the opening, the free Bazookarp near, an enemy carrier)', /Shoot the Roe Shell/.test(p1) && /Run into the Bazookarp/.test(p2) && /follow the carp/.test(p3), { p1, p2, p3 });
  if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); H.karp._sayT = -1e9;
  const { emit } = await import('./src/core/ctx.js');
  emit('karp:burst', { team: me.team, pos: P.clone() }); const c1 = S().call;
  emit('karp:pickup', { actor: foe, team: foe.team }); const c2 = S().call, n2 = H.zcalls.children.length;
  emit('karp:plant', { team: me.team, index: 0 }); const c3 = S().call;
  R('E2. call-outs per event, each replacing the last within 1.5 s', c1 === 'SHELL BURST!' && c2 === "THEY'VE GOT THE BAZOOKARP!" && n2 === 1 && c3 === 'WEIR DOWN!', { c1, c2, n2, c3 });
  put(me, spot(P.x, P.z + dz * 1, P.y)); grab(me); step(0.05);
  emit('sub:cantuse', { actor: me, kind: 'karp' }); const nt = S().no;
  R('E3. a carrier\'s sub / special press: "Can\'t use your kit while carrying"', /Can't use your kit/.test(nt || ''), { nt });
  release(); step(0.1);

  // ---- F. the shell's meter tag; weir tags
  put(me, spot(P.x, P.z - dz * 8, P.y)); facePond(me); Kp.shell.m = (me.team === 0 ? 1 : -1) * 0.6 * Kp.shell.hp; follow(); step(2 / 60);
  const tag = S().shell;
  R('F1. the meter tag over the shell: its tip toward your team at 60 %', !!tag && Math.abs(tag.m - 0.8) < 0.02 && /60% OURS/.test(tag.label), tag);
  Kp.shell.m = 0;
  const wp = Kp.weirs[me.team][0].pos; put(me, spot(wp.x, wp.z - dz * 9, wp.y)); me.yaw = me.aimYaw = Math.atan2(wp.x - me.pos.x, wp.z - me.pos.z); follow(); step(2 / 60);
  R('F2. the count each of your standing weirs would give, over it', S().tags.includes(String(Kp.weirs[me.team][0].count)), S().tags);

  // ---- G. cues; the map layer
  const cues0 = H.karp.cues.played.length;
  emit('karp:burst', { team: me.team, pos: P.clone() }); emit('karp:explode', { actor: foe, pos: P.clone(), own: true }); emit('karp:plant', { team: me.team, index: 0 }); emit('karp:gate', { team: me.team });
  emit('karp:land', { actor: foe, pos: P.clone(), charge: 1 }); emit('karp:blast', { actor: foe, pos: P.clone(), radius: 4, charge: 1 });
  const cues = H.karp.cues.played.slice(cues0);
  const { SFX } = await import('./src/audio/audio.js'); const { KARP_SOUNDS } = await import('./src/audio/sfx-karp.js');
  R('G1. the cues on their events (karp_burst, karp_explode, karp_weir, karp_gate, karp_land, karp_blast), every karp cue defined', ['karp_burst', 'karp_explode', 'karp_weir', 'karp_gate', 'karp_land', 'karp_blast'].every((c) => cues.includes(c)) && KARP_SOUNDS.every((n) => !!SFX[n]), { cues, missing: KARP_SOUNDS.filter((n) => !SFX[n]) });
  let mapErr = null;
  try { const { drawKarpMap } = await import('./src/ui/hud-karp.js'); const mm = g.minimap; const c = mm.ctx; drawKarpMap(c, mm, { x: 0, y: 0 }, mm.s, G.teamHex, 1, 'under'); drawKarpMap(c, mm, { x: 0, y: 0 }, mm.s, G.teamHex, 1, 'over'); } catch (e) { mapErr = String(e); }
  R('G2. the map layer draws both layers without error', !mapErr, { mapErr });
  // [karp-face] the hiss: a carrier's last 3 s, on the carrier (a teammate's screen hears it where the carrier is)
  { const A0 = G.audio, lp0 = A0.loop.bind(A0), loops = []; A0.loop = (n, o) => { const hnd = lp0(n, o); if (n === 'karp_hiss') loops.push({ pos: !!(o && o.pos) }); return hnd; };
    put(ally, spot(P.x + 2, P.z + dz * 4, P.y)); grab(ally); step(0.1);
    Kp.fuse = 12; step(0.2); const before = !!H.karp.cues.loops.hiss;
    Kp.fuse = 2.6; step(0.1); const during = !!H.karp.cues.loops.hiss;
    Kp.fuse = 40; step(0.1); const after = !!H.karp.cues.loops.hiss;
    A0.loop = lp0; release(); step(0.1);
    R('G3. the hiss: a teammate carrier\'s last 3 s starts a positional karp_hiss on it, and it stops when the fuse is no longer in its last 3 s', !before && during && !after && loops.length === 1 && loops[0].pos, { before, during, after, loops }); }

  // ---- I. [karp-face] review round 1: the world tags, the call-outs' layers, the carrier's last 10 s
  {
    const wait = (ms) => new Promise((q) => setTimeout(q, ms));
    const er = () => H.el.getBoundingClientRect();
    const topY = () => H.karp.status.getBoundingClientRect().bottom - er().top;
    const clearCalls = () => { if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); H.callouts?.querySelectorAll('.iw-call').forEach((e) => e.remove()); H.karp._sayT = -1e9; };
    clearCalls(); release(); step(0.1);
    // I1. our Gate up, the carrier 9 m before it: tilt the camera until the GATE tag's own point projects above the
    // status pill's bottom (in the top bar, where the timer is); the tag is drawn below it
    Kp.lowered[me.team] = true; Kp.gateUp[me.team] = true; step(0.1);
    const gp = G0.pos; put(me, spot(gp.x, gp.z - dz * 9, gp.y)); me.yaw = me.aimYaw = Math.atan2(gp.x - me.pos.x, gp.z - me.pos.z); grab(me); follow();
    let raw = null, box = null; const tried = [];
    for (let k = 0; k < 30 && !raw; k++) {
      g.rig.pitch = 0.5 - k * 0.05; step(2 / 60); H.karp._topT = 0; step(1 / 60);
      const p = H.karp._proj(gp.x, gp.y + 6.4, gp.z), ty = topY();
      tried.push(p ? +p.y.toFixed(0) : null);
      if (p && !p.behind && p.y > 4 && p.y < ty - 4 && p.x > 0 && p.x < p.W) { raw = { y: +p.y.toFixed(1), top: +ty.toFixed(1), pitch: +g.rig.pitch.toFixed(2) }; box = (S().tagBoxes || []).find((b) => b.text === 'GATE') || null; }
    }
    R('I1. the GATE tag never rides up into the top bar: where its own point projects above the status pill\'s bottom, the tag is drawn below it', !!raw && !!box && box.t >= raw.top - 0.5, { raw, box, tried: raw ? undefined : tried });
    release(); Kp.lowered = [false, false]; Kp.gateUp = [false, false]; follow(); step(0.1);
    // I2. a call-out on screen; a weir tag whose point sits on the ray through the call-out's middle
    H.karp._say('BURST THE ROE SHELL!', { sub: 'Then carry the Bazookarp to their Dragon Gate' });
    await wait(900);
    const zr = H.zcalls.firstElementChild.getBoundingClientRect(), e0 = er(), cam = G.rig?.gameCam || G.camera;
    const nd = V(((zr.left + zr.right) / 2 - e0.left) / e0.width * 2 - 1, -(((zr.top + zr.bottom) / 2 - e0.top) / e0.height * 2 - 1), 0.5).unproject(cam);
    const wpt = cam.position.clone().addScaledVector(nd.sub(cam.position).normalize(), 12);
    const tw = [{ key: 'w0', pos: [wpt.x, wpt.y, wpt.z], y: 0, text: '45', gate: false }];
    H.karp._tags(tw, H.karp._callRects()); const onCall = { ...(S().tagBoxes || [])[0], cls: H.karp._tagEls[0].classList.contains('is-under') };
    clearCalls(); H.karp._tags(tw, H.karp._callRects()); const offCall = { ...(S().tagBoxes || [])[0], cls: H.karp._tagEls[0].classList.contains('is-under') };
    R('I2. a weir tag that would sit on a live call-out fades out of its way, and is back once the call-out is gone', onCall.under && onCall.cls && offCall.under === false && !offCall.cls, { onCall, offCall });
    step(1 / 60);
    // I3. the meter tag where it would sit right under the status pill (the shell high in the middle): not drawn; lower
    // down: drawn
    put(me, spot(P.x, P.z - dz * 7, P.y)); facePond(me); Kp.shell.m = 0.4 * Kp.shell.hp * (me.team === 0 ? 1 : -1); follow();
    let tuck = null, low = null; const tr3 = [];
    for (let k = 0; k < 40 && (!tuck || !low); k++) {
      g.rig.pitch = 0.6 - k * 0.04; step(2 / 60); H.karp._topT = 0; step(1 / 60);
      const c = Kp.shell.c, p = H.karp._proj(c.x, c.y + Kp.shell.radius() + 0.55, c.z), sr = H.karp.status.getBoundingClientRect(), o = er();
      if (!p || p.behind) continue;
      const lim = topY();
      tr3.push(+p.y.toFixed(0));
      const x0 = sr.left - o.left, x1 = sr.right - o.left;
      if (!tuck && p.y > 2 && p.y < lim - 2 && p.x > x0 && p.x < x1) tuck = { y: +p.y.toFixed(1), lim: +lim.toFixed(1), shown: S().shell };
      if (!low && p.y > topY() + 120 && p.y < p.H - 60) low = { y: +p.y.toFixed(1), shown: S().shell };
    }
    R('I3. the meter tag isn\'t drawn right under the status pill (which already says SHELL · 40% OURS); lower on the screen it is', !!tuck && tuck.shown == null && !!low && !!low.shown, { tuck, low, tried: tuck && low ? undefined : tr3 });
    Kp.shell.m = 0; g.rig.pitch = -0.15;
    // I4. a kill call-out (WIPEOUT!) and ours at once: ours sits wholly under it
    clearCalls();
    // (a burst's WIPEOUT! and SHELL BURST! come in the same frame: ours waits out the kill call-out's pop-in, then sits
    // under it — the two popped in on top of each other at 960×600)
    H._callout('WIPEOUT!', 'The whole team is splatted', true); const t4 = performance.now();
    H.karp._say('SHELL BURST!', { sub: 'GRAB THE BAZOOKARP!', icon: null });
    step(1 / 60);
    let tz = null; for (let k = 0; k < 80 && tz == null; k++) { await wait(15); if (H.zcalls.firstElementChild) tz = Math.round(performance.now() - t4); }
    step(1 / 60); await wait(400); step(1 / 60);
    const kcEl = H.callouts.querySelector('.iw-call'), zcEl = H.zcalls.firstElementChild;
    const kr = kcEl && kcEl.getBoundingClientRect(), zr4 = zcEl && zcEl.getBoundingClientRect();
    const subR = kcEl && kcEl.querySelector('.iw-call__sub')?.getBoundingClientRect();
    R('I4. a kill call-out (WIPEOUT!) and our SHELL BURST! at once: ours waits out its pop-in (≥ 0.3 s), then sits wholly below it (its sub line too)', tz != null && tz >= 300 && !!kr && !!zr4 && zr4.top >= Math.max(kr.bottom, subR ? subR.bottom : 0) - 1, { after: tz, kill: kr && { t: Math.round(kr.top), b: Math.round(kr.bottom) }, sub: subR && Math.round(subR.bottom), ours: zr4 && { t: Math.round(zr4.top), b: Math.round(zr4.bottom) }, size: [innerWidth, innerHeight] });
    // I6. the kill call-out, through its whole life until it has faded: never up on the Carp Line's status pill (its
    // stock exit drifts up 60 % of its height: WIPEOUT!'s ribbon covered FREE — GRAB IT! at 1920×1080)
    let minTop = 1e9, seen6 = 0;
    for (let k = 0; k < 70 && kcEl && kcEl.isConnected; k++) {
      const r6 = kcEl.getBoundingClientRect(), op = +getComputedStyle(kcEl).opacity;
      if (op >= 0.3) { minTop = Math.min(minTop, r6.top - er().top); seen6++; }
      await wait(40);
    }
    R('I6. a big kill call-out never rises onto the status pill while it is visible (opacity ≥ 0.3)', seen6 > 10 && minTop >= topY() - 1, { minTop: Math.round(minTop), pill: Math.round(topY()), samples: seen6, size: [innerWidth, innerHeight] });
    clearCalls(); step(1 / 60);
    // I5. the carrier's own fuse: 30 s small; 8.5 s big, beating
    put(me, spot(P.x, P.z + dz * 2, P.y)); grab(me); follow();
    Kp.fuse = Kp.hud.fuseShown = 30; step(2 / 60); const bEl = H.karp.ret.querySelector('b'), f30 = parseFloat(getComputedStyle(bEl).fontSize);
    Kp.fuse = Kp.hud.fuseShown = 8.5; step(2 / 60); const f8 = parseFloat(getComputedStyle(bEl).fontSize), beat = H.karp.ret.classList.contains('is-beat'), red = H.karp.ret.classList.contains('is-red');
    const u5 = Math.min(H.el.clientWidth / 100, (H.el.clientHeight * 1.7778) / 100);
    R('I5. the carrier\'s last 10 s: the reticle\'s seconds in big digits (≥ 3 u, nearly 3× the usual) that beat each second', red && beat && bEl.textContent === '9' && f8 >= 2.6 * f30 && f8 >= 3 * u5 - 0.5, { f30, f8, u: +u5.toFixed(2), beat, red, txt: bEl.textContent });
    release(); step(0.1);
  }

  // ---- H. the results screen
  const reasons = ['knockout', 'time', 'untouched', 'comeback', 'retake', 'no-pickup', 'stopped', 'overtime-cap'];
  const want = { knockout: 'KNOCKOUT!', untouched: 'NOBODY TOUCHED IT — THE COIN WAS YOURS', comeback: 'CARRIED PAST THEM IN OVERTIME!', retake: 'TOOK IT BACK IN OVERTIME', 'no-pickup': 'HELD THEM OFF IN OVERTIME', stopped: 'STOPPED THEIR CARRIER IN OVERTIME', 'overtime-cap': 'WON AT THE OVERTIME LIMIT', time: "TIME'S UP" };
  const got = {}; let cols = null, mid = null;
  for (const r of reasons) {
    g.menus.show(null);
    const players = m.actors.map((a, i) => ({ name: a.name, team: a.team, weapon: a.weaponId, turf: 100 + i, splats: 1, deaths: 1, isSelf: a === me, karpM: 10 + i, karpPops: i % 2 }));
    g.menus.showResults({ win: true, percents: [40, 40], colors: [G.teamHex[0], G.teamHex[1]], players, xp: { gained: 0 }, mode: 'bazookarp', karp: { counts: [0, 50], best: [55, 30], len: [55, 55], winner: me.team, reason: r, overtime: r !== 'time' && r !== 'knockout' && r !== 'untouched' } });
    g.menus.show('results');
    await new Promise((q) => setTimeout(q, 250));
    const el = [...document.querySelectorAll('.iw-results')].pop();
    got[r] = el ? [...el.querySelectorAll('.iw-res__tag')].map((t) => t.textContent.toUpperCase()).join(' | ') : null;
    if (!cols && el) { cols = [...el.querySelectorAll('.iw-ttable__head')][0]?.textContent || ''; mid = el.querySelector('.iw-zres__mid')?.textContent || ''; }
  }
  g.menus.show(null);
  R('H1. the results screen reads every reason in the spec\'s words', reasons.every((r) => (got[r] || '').includes(want[r])), got);
  R('H2. … with the CARRIED and POPS columns and CARRY IT HOME in the centre', /CARRIED/.test(cols || '') && /POPS/.test(cols || '') && /CARRY IT HOME/.test(mid || ''), { cols, mid });
  return out;
})()
