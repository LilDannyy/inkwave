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
//   J (review round 2) all four "Can't use" lines (the TAB map's super jump, the spawn barrier at most once per 3 s, a
//     special); OVERTIME!'s instruction readable in real time with the stock centre banner left in; the call-outs' wait
//     on play time (a stale kill call-out never holds ours)
//   K (review round 3) the carrier's over-head marker: never in the top bar (pinned under it, its arrow up); faded off a
//     live call-out's instruction and the centre banner; a grant undone takes its pick-up call-out back
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
  // [karp-face] review round 3: the TAB map's halfway line — traced polylines through the Pond, across the map (it was a
  // few dots on nodes whose two walks were within 0.9 m: on halyard nothing across the middle)
  { let L4 = null, e4 = null; try { const { halfwayLines } = await import('./src/ui/hud-karp.js'); L4 = halfwayLines(Kp.field, G.nav); } catch (e) { e4 = String(e); }
    const gx = G0.pos.x - P.x, gz = G0.pos.z - P.z, gl = Math.hypot(gx, gz) || 1, px = -gz / gl, pz = gx / gl;
    let n4 = 0, near = Infinity, lo = Infinity, hi = -Infinity, nlo = Infinity, nhi = -Infinity;
    for (const l of L4 || []) for (let i = 0; i < l.length; i += 2) { n4++; near = Math.min(near, Math.hypot(l[i] - P.x, l[i + 1] - P.z)); const q = l[i] * px + l[i + 1] * pz; lo = Math.min(lo, q); hi = Math.max(hi, q); }
    for (const id of G.nav.validIds) { const nd = G.nav.nodes[id], q = nd.x * px + nd.z * pz; nlo = Math.min(nlo, q); nhi = Math.max(nhi, q); }
    const span = (hi - lo) / Math.max(1, nhi - nlo);
    R('G4. the TAB map\'s halfway line: traced lines through the Pond, across most of the map', !!L4 && L4.length >= 1 && n4 > 15 && near < 2.5 && span > 0.5, { err: e4, lines: L4 && L4.length, points: n4, pond: +near.toFixed(2), span: +span.toFixed(2) }); }
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
    const clearCalls = () => { if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); H.callouts?.querySelectorAll('.iw-call').forEach((e) => e.remove()); H.karp._sayT = -1e9; H.karp._pend = null; H.karp._hold = 0; };
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
    // (review round 2: the wait is counted in play time — the stepped sim here — so the test steps a frame and lets a
    // frame's worth of wall time pass, in turn, the way play does; tz: the play time until ours was up, tw the wall time)
    H._callout('WIPEOUT!', 'The whole team is splatted', true); const t4 = performance.now();
    H.karp._say('SHELL BURST!', { sub: 'GRAB THE BAZOOKARP!', icon: null });
    let tz = null, tw4 = null; for (let k = 1; k <= 80 && tz == null; k++) { step(1 / 60); await wait(17); if (H.zcalls.firstElementChild) { tz = Math.round((k / 60) * 1000); tw4 = Math.round(performance.now() - t4); } }
    step(1 / 60); await wait(400); step(1 / 60);
    const kcEl = H.callouts.querySelector('.iw-call'), zcEl = H.zcalls.firstElementChild;
    const kr = kcEl && kcEl.getBoundingClientRect(), zr4 = zcEl && zcEl.getBoundingClientRect();
    const subR = kcEl && kcEl.querySelector('.iw-call__sub')?.getBoundingClientRect();
    R('I4. a kill call-out (WIPEOUT!) and our SHELL BURST! at once: ours waits out its pop-in (≥ 0.3 s), then sits wholly below it (its sub line too)', tz != null && tz >= 300 && tw4 >= 300 && !!kr && !!zr4 && zr4.top >= Math.max(kr.bottom, subR ? subR.bottom : 0) - 1, { after: tz, wall: tw4, kill: kr && { t: Math.round(kr.top), b: Math.round(kr.bottom) }, sub: subR && Math.round(subR.bottom), ours: zr4 && { t: Math.round(zr4.top), b: Math.round(zr4.bottom) }, size: [innerWidth, innerHeight] });
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

  // ---- J. [karp-face] review round 2: the "Can't use" lines (all four of SPEC §1.1's), the OVERTIME! instruction in
  // real time against the stock centre banner, and the call-outs' wait counted in play time
  {
    const wait = (ms) => new Promise((q) => setTimeout(q, ms));
    const { on: onEv, emit: emit2 } = await import('./src/core/ctx.js');
    const refs = []; const offR = onEv('karp:refuse', (e) => refs.push([e.why, e.actor === me, Kp.clock]));
    const clearAll = () => { if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); H.callouts?.querySelectorAll('.iw-call').forEach((e) => e.remove()); H.bannerLayer?.querySelectorAll('.iw-bn').forEach((b) => b.remove()); H.karp._sayT = -1e9; H.karp._pend = null; H.karp._hold = 0; };
    const noteOff = () => { H.karp._noT = 0; H.karp.no.classList.remove('is-on'); H.karp.show.no = null; };
    clearAll(); release(); step(0.1);
    // J1. a carrier picks a teammate on the TAB map (a click on its row: hud._jumpTo), then presses the map's number key
    put(me, spot(P.x, P.z + dz * 1, P.y)); put(ally, spot(P.x + 3, P.z - dz * 3, P.y)); grab(me); step(0.05); noteOff(); refs.length = 0;
    const sj0 = me.superJumpState;
    H._jumpTo(0); const n1 = S().no, r1 = refs.slice();
    noteOff(); refs.length = 0;
    // (the page runs ?autopilot, which has no PlayerController: a real one drives the kid for these frames)
    const { PlayerController } = await import('./src/game/player.js'); const pc0 = m.controller; m.controller = new PlayerController(me, g.rig, g.input);
    dbg.key('Tab', true); step(2 / 60); dbg.key('Digit1', true); step(1 / 60); dbg.key('Digit1', false); step(1 / 60); dbg.key('Tab', false); step(2 / 60);
    m.controller = pc0; zero(me);
    const n1k = S().no, r1k = refs.slice();
    R('J1. a carrier\'s super jump from the TAB map — a teammate\'s row clicked, or the map\'s number key — shows "Can\'t super jump with the Bazookarp" (no jump)',
      n1 === "Can't super jump with the Bazookarp" && n1k === "Can't super jump with the Bazookarp" && r1.some((r) => r[0] === 'jump' && r[1]) && r1k.some((r) => r[0] === 'jump' && r[1]) && !sj0 && !me.superJumpState && Kp.holder === me,
      { click: n1, key: n1k, refs: [r1, r1k], jumping: !!me.superJumpState });
    // J2. the carrier on its own spawn deck, 0.4 m inside the barrier, pressing inward for 4 s: the barrier shoves it out
    // and keeps it out; the note at most once per 3 s; a player without it on the same spot: no note (it walks in).
    // (testbox's spawn deck stands 2.4 m up and ends at the barrier's radius: the carrier starts on it)
    // (two phases: 1 s pressing inward — the note, never let in; then 4 s held 0.3 m inside it every frame — the note's
    // limit: twice, 3 s apart. The other players are moved off the deck first: their soft push moved the carrier)
    const pad = G.level.spawnPads[me.team], Rb = G.level.spawnBarrier, toP = Math.atan2(P.x - pad.x, P.z - pad.z);
    const onDeck = V(pad.x + Math.sin(toP) * (Rb - 0.4), pad.y, pad.z + Math.cos(toP) * (Rb - 0.4)), inward = V(-Math.sin(toP), 0, -Math.cos(toP));
    const inside = V(pad.x + Math.sin(toP) * (Rb - 0.3), pad.y, pad.z + Math.cos(toP) * (Rb - 0.3));
    for (const a of m.actors) if (a !== me) put(a, spot(P.x + (a.slot % 4) * 2 - 3, P.z + (a.team === me.team ? -dz : dz) * 14, P.y));
    const kev = []; const offK = ['karp:drop', 'karp:reset', 'karp:explode', 'splatted'].map((k) => onEv(k, (e) => kev.push([k, +Kp.clock.toFixed(2), e.how || e.why || e.cause || null])));
    put(me, spot(P.x, P.z + dz * 1, P.y)); grab(me); step(0.05);
    put(me, onDeck); noteOff(); refs.length = 0; Kp._refT = null;
    let minD = 1e9;
    for (let i = 0; i < 60; i++) { me.intent.move.copy(inward); dbg.step(1000 / 60); if (i >= 2) minD = Math.min(minD, Math.hypot(me.pos.x - pad.x, me.pos.z - pad.z)); }
    const n2a = S().no;
    zero(me); noteOff(); refs.length = 0; Kp._refT = null; const t0 = Kp.clock;
    for (let i = 0; i < 240; i++) { me.pos.copy(inside); me.vel.set(0, 0, 0); dbg.step(1000 / 60); }
    zero(me); step(2 / 60);
    offK.forEach((f) => f());
    const n2 = S().no, sp = refs.filter((r) => r[0] === 'spawn' && r[1]).map((r) => +(r[2] - t0).toFixed(2)), held2 = Kp.holder === me;
    release(); step(0.1); put(me, onDeck); noteOff(); refs.length = 0;
    let minDB = 1e9; for (let i = 0; i < 90; i++) { me.intent.move.copy(inward); dbg.step(1000 / 60); minDB = Math.min(minDB, Math.hypot(me.pos.x - pad.x, me.pos.z - pad.z)); }
    zero(me); step(2 / 60);
    const n2b = S().no, spB = refs.filter((r) => r[0] === 'spawn').length;
    R('J2. a carrier shoved by its spawn\'s barrier: "You can\'t take it into a spawn", at most once per 3 s (4 s of pushing: twice); without it: no note',
      n2a === "You can't take it into a spawn" && n2 === "You can't take it into a spawn" && held2 && sp.length === 2 && sp[1] - sp[0] >= 3 - 1e-6 && minD >= Rb - 0.3 && spB === 0 && n2b == null && minDB < Rb - 1,
      { walkIn: { note: n2a, minD: +minD.toFixed(2) }, held4s: { note: n2, at: sp, held: held2 }, barrier: Rb, kev, without: { refs: spB, note: n2b, minD: +minDB.toFixed(2) } });
    // J3. touching the free Bazookarp mid-special (an Ink Jet): "Finish your special first"
    put(me, spot(P.x + 0.5, P.z + 0.5, P.y)); step(0.05); noteOff(); refs.length = 0;
    me.special = me.specialCost(); G.specials.start(me, 'jetpack'); Kp.shell.clear(); Kp.pos.copy(me.pos); Kp._setPhase('free', 0); Kp.claims.length = 0; step(0.3);
    const n3 = S().no, r3 = refs.filter((r) => r[0] === 'special' && r[1]).length, h3 = Kp.holder;
    G.specials.end(me, 'test'); step(0.1); release(); step(0.1);
    R('J3. touching the free Bazookarp mid-special: "Finish your special first" (not picked up)', n3 === 'Finish your special first' && r3 >= 1 && h3 !== me, { note: n3, refs: r3, holder: h3?.name || null });
    offR();
    // J4. OVERTIME!, in real time (the clock running: the banner's CSS and the HUD's play clock both move): the stock
    // centre banner and its sound stay; its instruction is readable from the start and for ≥ 3 s of the first 6 s, in the
    // banner under the word and then in our call-out, which never comes up under the opaque banner
    // (our team behind, 80 to 60: losing — 'Grab it within 10 s!' — and not yet past them, or the engine ends it as a
    // comeback at once)
    clearAll(); release(); put(me, spot(P.x, P.z - dz * 8, P.y)); facePond(me); follow(); step(0.1);
    Kp.count = me.team === 0 ? [80, 60] : [60, 80]; Kp.overtime = true; Kp.otLosing = me.team; Kp.otWin = { left: 30, open: true, closeT: null, grace: 0 };
    const live4 = m.state === 'playing' && Kp.winner == null;
    const want4 = 'Grab it within 10 s!';
    const eff = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    const box = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
    const cover = (a, b) => (a.w * a.h > 0 ? Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)) / (a.w * a.h) : 0);
    const rows = [];
    dbg.unfreeze();
    const tw0 = performance.now(), sounds0 = H.karp.cues.played.length;
    emit2('karp:overtime', { losing: me.team, why: 'dropped' });
    while (performance.now() - tw0 < 7000) {
      await wait(40);
      const ms = Math.round(performance.now() - tw0), row = { ms };
      const bn = H.bannerLayer.querySelector('.iw-bn--ot'), bt = bn?.querySelector('.iw-bn__text'), bsub = bn?.querySelector('.iw-kbn-sub');
      const bo = bt ? eff(bt) : 0, bBox = bt ? box(bt) : null, sBox = bsub ? box(bsub) : null;
      const tags = [...H.karp.tags.children].filter((e) => e.classList.contains('is-on') && !e.classList.contains('is-under') && eff(e) > 0.3).map((e) => box(e.firstChild));
      row.banner = bn ? +bo.toFixed(2) : null;
      row.inBanner = !!bsub && bsub.textContent.includes(want4) && eff(bsub) >= 0.6 && !tags.some((t) => cover(sBox, t) > 0.05);
      const z = [...H.zcalls.children].find((e) => /OVERTIME!/.test(e.textContent)), zt = z?.querySelector('.iw-zcall__txt'), zs = z?.querySelector('.iw-zcall__sub');
      if (z) {
        const zo = eff(z), zb = box(zt), zsb = zs ? box(zs) : null, under = bn && bo >= 0.3 && (cover(zb, bBox) > 0.05 || (zsb && (cover(zsb, bBox) > 0.05 || (sBox && cover(zsb, sBox) > 0.05))));
        row.call = +zo.toFixed(2); row.under = !!under;
        row.inCall = !!zs && zs.textContent === want4 && zo >= 0.6 && !under && !tags.some((t) => cover(zsb, t) > 0.05);
      }
      rows.push(row);
    }
    dbg.freeze();
    const dur = (k) => rows.reduce((s, r, i) => s + (r[k] ? (i ? r.ms - rows[i - 1].ms : r.ms) : 0), 0);
    const first = rows.find((r) => r.inBanner || r.inCall), readMs = rows.reduce((s, r, i) => s + ((r.inBanner || r.inCall) ? (i ? r.ms - rows[i - 1].ms : r.ms) : 0), 0);
    const underVis = rows.filter((r) => r.call != null && r.call >= 0.3 && r.under);
    const snd = H.karp.cues.played.length >= sounds0;   // (the stock banner's own sound is hud._snd('zone_overtime'): unchanged code)
    R('J4. OVERTIME! with the stock banner left in (real time): the instruction is readable within 0.5 s and for ≥ 3 s of the first 7 s — under the banner\'s word, then in our call-out (≥ 1 s), which never comes up under the opaque banner',
      live4 && Kp.winner == null && !!first && first.ms <= 500 && readMs >= 3000 && dur('inBanner') >= 900 && dur('inCall') >= 1000 && underVis.length === 0 && rows.some((r) => r.banner != null),
      { live: live4, winner: Kp.winner, first: first && first.ms, readMs, inBanner: dur('inBanner'), inCall: dur('inCall'), underVis: underVis.slice(0, 3), snd, fps: g.fps, rows: rows.filter((r, i) => i % 6 === 0) });
    Kp.overtime = false; Kp.otLosing = -1; Kp.otWin = { left: 10, open: false, closeT: null, grace: 0 }; Kp.count = [100, 100]; G.music?.setOvertime?.(false); clearAll(); step(0.1);
    // J5. the wait is counted in play time: a kill call-out made 0.6 s of play ago — with no frame painted since, as in
    // the stepped rules test (its CSS clock still at 0) — doesn't hold ours back; one made this frame holds it ~0.38 s
    clearAll(); step(2 / 60);
    H._callout('FIRST SPLAT!', null, false); step(0.6);
    H.karp._say('SHELL BURST!', { sub: 'GRAB THE BAZOOKARP!', icon: null }); const stale = H.zcalls.children.length;
    clearAll(); H._callout('WIPEOUT!', 'The whole team is splatted', true); H.karp._say('SHELL BURST!', { sub: 'GRAB THE BAZOOKARP!', icon: null });
    step(0.3); const at03 = H.zcalls.children.length; step(0.12); const at042 = H.zcalls.children.length;
    R('J5. the call-outs\' wait runs on play time: a stale kill call-out (0.6 s of play, no frame painted) doesn\'t hold ours; a fresh one holds it past 0.3 s and lets it up by 0.42 s', stale === 1 && at03 === 0 && at042 === 1 && m.state === 'playing', { stale, at03, at042, state: m.state });
    clearAll(); step(0.1);
  }

  // ---- K. [karp-face] review round 3: the carrier's over-head marker keeps out of the top bar (pinned under it, its arrow
  // up) and fades out of the way of a live call-out (OVERTIME!'s sub line) and the centre banner, as the world tags do
  {
    const wait = (ms) => new Promise((q) => setTimeout(q, ms));
    const er = () => H.el.getBoundingClientRect();
    const topY = () => H.karp.status.getBoundingClientRect().bottom - er().top;
    const rel = (r) => { const o = er(); return { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; };
    const ov = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
    const clearAll = () => { if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); H.callouts?.querySelectorAll('.iw-call').forEach((e) => e.remove()); H.bannerLayer?.querySelectorAll('.iw-bn').forEach((b) => b.remove()); H.karp._sayT = -1e9; H.karp._pend = null; H.karp._hold = 0; };
    const opMk = () => +getComputedStyle(H.karp.mk).opacity;
    clearAll(); release(); step(0.1);
    // an enemy carrier on the Pond in kid form, the viewer 12 m off facing it
    put(me, spot(P.x, P.z - dz * 12, P.y)); facePond(me);
    put(foe, spot(P.x, P.z, P.y)); grab(foe); step(0.1); follow();
    const u = Math.min(H.el.clientWidth / 100, (H.el.clientHeight * 1.7778) / 100);
    // K1. tilt the camera down until the marker's own point projects up in the top bar (above the status pill's bottom)
    let raw1 = null, mk1 = null; const tr1 = [];
    for (let k = 0; k < 70 && !raw1; k++) {
      g.rig.pitch = -0.2 - k * 0.02;   // (a lower pitch: the camera looks down, the point rises on the screen) step(2 / 60); H.karp._topT = 0; step(1 / 60);
      const p = H.karp._proj(foe.pos.x, foe.pos.y + 2.4, foe.pos.z), ty = topY();
      tr1.push(p ? +p.y.toFixed(0) : null);
      if (p && !p.behind && p.y > 6 && p.y < ty - 6 && p.x > 60 && p.x < p.W - 60) { raw1 = { y: +p.y.toFixed(1), top: +ty.toFixed(1), pitch: +g.rig.pitch.toFixed(3) }; mk1 = S().marker; }
    }
    R('K1. a carrier whose marker would sit up in the top bar (a raised Pond seen from below): pinned under the status pill — its pill and its arrow below the bar, the distance shown — never over the Carp Line',
      !!raw1 && !!mk1 && !!mk1.box && !mk1.onScreen && mk1.box.t >= raw1.top - 0.5 && mk1.y - 3 * u >= raw1.top - 1 && mk1.dist > 0, { raw: raw1, marker: mk1, u: +u.toFixed(2), tried: raw1 ? undefined : tr1 });
    // K2. a live OVERTIME! call-out with its instruction; tilt until the marker sits on the sub line: it fades out (and is
    // back once the call-out is gone)
    g.rig.pitch = -0.15; step(2 / 60); H.karp._topT = 0; step(1 / 60);
    H._zCall('OVERTIME!', { team: foe.team, sub: 'Stop them — 10 s to hold!', icon: null });
    await wait(450);
    let hit2 = null; const tr2 = [];
    for (let k = 0; k < 70 && !hit2; k++) {
      g.rig.pitch = -0.45 + k * 0.015; step(2 / 60);
      const z = H.zcalls.firstElementChild, sub = z?.querySelector('.iw-zcall__sub'), mk = S().marker;
      if (!z || !sub || !mk) { tr2.push(null); continue; }
      const sb = rel(sub.getBoundingClientRect());
      tr2.push(mk.y);
      const mb2 = mk.box || { l: mk.x - 25, r: mk.x + 25, t: mk.y - 25, b: mk.y };   // (the old marker reported no box: its pill, roughly)
      if (mk.onScreen && ov(mb2, sb) > 0) hit2 = { mk, sub: sb, cls: H.karp.mk.classList.contains('is-under') };
    }
    await wait(260);
    const op2 = opMk();
    if (H.zcalls) [...H.zcalls.children].forEach((e) => e.remove()); step(2 / 60); await wait(260); step(1 / 60);
    const back2 = { under: S().marker?.under, op: opMk() };
    R('K2. a marker that would sit on a live call-out\'s instruction (OVERTIME! / Stop them — 10 s to hold!) fades out of its way, and is back once the call-out is gone',
      !!hit2 && hit2.mk.under && hit2.cls && op2 < 0.05 && back2.under === false && back2.op > 0.95, { hit: hit2, opacity: op2, back: back2, tried: hit2 ? undefined : tr2 });
    // K3. the stock OVERTIME! centre banner: the same
    clearAll(); g.rig.pitch = -0.15; step(2 / 60);
    H._zBanner('OVERTIME!');
    await wait(300);
    let hit3 = null; const tr3 = [];
    for (let k = 0; k < 70 && !hit3; k++) {
      g.rig.pitch = -0.45 + k * 0.015; step(2 / 60);
      const bt = H.bannerLayer.querySelector('.iw-bn[data-g="center"] .iw-bn__text'), mk = S().marker;
      if (!bt || !mk) { tr3.push(null); continue; }
      const bb = rel(bt.getBoundingClientRect());
      tr3.push(mk.y);
      const mb3 = mk.box || { l: mk.x - 25, r: mk.x + 25, t: mk.y - 25, b: mk.y };
      if (mk.onScreen && ov(mb3, bb) > 0) hit3 = { mk, word: bb, cls: H.karp.mk.classList.contains('is-under') };
    }
    await wait(260);
    const op3 = opMk();
    R('K3. … and off the stock OVERTIME! centre banner\'s word', !!hit3 && hit3.mk.under && hit3.cls && op3 < 0.05, { hit: hit3, opacity: op3, tried: hit3 ? undefined : tr3 });
    clearAll(); g.rig.pitch = -0.15; release(); step(0.1);
    // K4. a grant undone (the host's 'u': its claimant had died): the pick-up call-out goes and a small FREE — GRAB IT!
    // says so — the call-out said somebody had it while the status pill said FREE
    const { emit: em4 } = await import('./src/core/ctx.js');
    const txt4 = () => [...H.zcalls.children].map((e) => e.querySelector('.iw-zcall__txt')?.textContent || '');
    em4('karp:pickup', { actor: foe, team: foe.team }); const up4 = txt4();
    em4('karp:undo', { actor: foe }); const after4 = txt4();
    R('K4. a grant undone (u): the pick-up call-out is taken back, a small FREE — GRAB IT! instead', up4.some((t) => /THEY'VE GOT THE BAZOOKARP/.test(t)) && !after4.some((t) => /GOT THE BAZOOKARP/.test(t)) && after4.includes('FREE — GRAB IT!'), { up: up4, after: after4 });
    clearAll(); step(0.1);
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
