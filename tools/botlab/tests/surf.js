// surf (2026-10-02): Surf N' Turf — src/game/sp-surf.js (+ src/fx/surfFx.js, src/game/assists.js, sp-surf-bots.js).
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/surf.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=throw,pulses,hit,dodge,assist,turf,buoy,walls,results,net,bots,sounds'; MAP=podbox PAGE_ARGS='only=roof'
// Staged on testbox (a flat deck, top y 0; the spawn deck A at z −48…−40 stands 2.4 m over it; a wall x 14…15, z ±8,
// 4 m tall); everyone else parked far off, brains stubbed (bots' own parts: 'bots'). Checks:
//  - throw: the special holds the buoy (the sub-throw pose, the arc preview's numbers), a click throws it, it flies and
//    anchors upright where the arc preview's ring said (≤ 0.35 m), the special over;
//  - pulses: SPECIALS.surf.pulses rings, `gap` s apart from `anchor` s after landing, each reaching further (rMin … rMax)
//    at `speed` m/s, then gone; the buoy goes after the last;
//  - hit: a foe standing in a ring's way takes `damage` once per ring and is marked (track status: the buoy's team,
//    markTime s; the mark's arrow flies in from the buoy's beacon — actor:marked's source);
//  - dodge: a foe jumping as the front passes (feet over the ribbon's top) takes nothing and isn't marked; the owner's
//    assist window on them opens (assists.js); a squid hop counts; swimming in ink doesn't help (hit);
//  - assist: a teammate's splat on the jumper inside the window → the owner gets an assist (the teammate the splat), one
//    after it → nothing; the damage rule (≤ 3 s); never the splatter's own; one per splat per player;
//  - turf: after all rings, the ink by bands from the buoy out to the last ring's reach (rMax; where the rings get to):
//    ≈ solid near it, falling off with distance as the ink model has it (≈ paintFar at the outermost band); how many
//    splats it took;
//  - buoy: enemy shots / blasts / a charger beam hurt it, it pops at 0 (the rings stop); its own team's don't;
//  - walls: a foe behind the wall isn't reached (one beside it, the same distance out, is);
//  - results: the results data carry assists (Match → main.js _judge → menus), and so does the host's final count online
//    (NetMatch sendResult / _result), and the splat event's `as` credits them on another screen (_remoteSplat);
//  - net: the owner's records (throw, anchor, pop) build a ghost whose rings run in step (same times, same reach); a
//    remote foe isn't judged by the owner's copy, a local one is judged by the ghost (the victim's owner), and the hit
//    / dodge records reach the other screens (the mark there, from the beacon);
//  - bots: a bot holding it picks a spot and throws; a bot in a ring's way jumps it (mostly); one with no foe in sight
//    shoots an enemy buoy.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SPECIALS, PLAYER } = await import('./src/config.js');
  const { KIT_GHOSTS } = await import('./src/game/kits/registry.js');
  const SURF = await import('./src/game/sp-surf.js');
  const SB = await import('./src/game/sp-surf-bots.js');
  const AS = await import('./src/game/assists.js');
  const NM = await import('./src/net/netmatch.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, S = G.subs, D = SPECIALS.surf;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DOWN = V(0, -1, 0);
  const r2 = (x) => Math.round(x * 100) / 100, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) { if (!a.bot._u0) a.bot._u0 = a.bot.update; a.bot.update = () => { zero(a); if (a._int) a._int(a.intent); }; } };   // (_int: a test's own input that frame)
  const unstub = (a) => { if (a.bot && a.bot._u0) a.bot.update = a.bot._u0; };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const HOME = V(0, 0, -12);
  const parkAll = () => others.forEach((a, i) => put(a, V(-22 + (i % 4) * 2, 0, 34 + Math.floor(i / 4) * 2)));
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }   // (the FX droplets' own random ink: off)
  const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
  const buoys = () => G.specials.world.filter((w) => w.kind === 'surf');
  const reset = () => {
    hook = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear(); S.clear(); P.clear(); G.paint.clear();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a);
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0; a.status.shield = 0; a.status.trackTeam = -1;
      a.stats.assists = 0; a.stats.splats = 0; a.stats.deaths = 0; a._int = null; AS.judge(a, null);   // (judge: clears its assist ledger)
      a.character.root.visible = true;
    }
    parkAll(); put(me, HOME, 0);
    step(0.1);
  };
  const inkAt = (x, z, y = 1) => { const h = G.physics.raycast(V(x, y, z), DOWN, y + 2); return h && h.hit ? G.paint.sample(h.face, h.u, h.v) : -1; };
  // a buoy of `owner`'s anchored at p right now (no flight): the owner's copy (or a ghost)
  const plant = (owner, p, ghost = false, gid = 0) => {
    const b = new SURF.Buoy(owner, p.clone().setY(p.y + 0.3), V(0, 0, 0), ghost, gid);
    G.specials.world.push(b); b.land(p.clone()); return b;
  };
  // hold a kid where it stands each frame (a stubbed brain still falls / slides)
  const pin = (...list) => { const at = list.map((a) => a.pos.clone()); return () => list.forEach((a, i) => { if (a.alive && a.grounded) { a.pos.x = at[i].x; a.pos.z = at[i].z; a.vel.x = a.vel.z = 0; } }); };
  // the local session stub (as sub-tweaks.js): records what the owner sends; nothing leaves the page
  const sent = [];
  const netOn = (extra = {}) => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {},
    recKit: (a, kind, data) => sent.push({ a, kind, data: JSON.parse(JSON.stringify(data)), t: G.time }), sendDevHit: (o, kind, id, d) => sent.push({ dh: true, kind, id, d }), shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {}, ...extra }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };

  try {
    // ============================================================================================ throw
    if (want('throw')) {
      reset();
      const s = start(me, 'surf');
      step(0.3);
      const held = s && s.held;
      R('Surf N\' Turf starts: the buoy machine in hand (the sub-throw pose: raise), the throw-arc preview\'s numbers (bomb.throwSpeed), no swimming, the prompt',
        s && s.kind === 'surf' && s.raise && s.showArc && s.bomb?.throwSpeed === D.throwSpeed && s.noSquid && held && held.g.visible && G.specials.prompt(me) === 'Aim · click to throw the buoy',
        { kind: s?.kind, raise: s?.raise, arc: s?.showArc, held: !!held, visible: held?.g.visible, prompt: G.specials.prompt(me) });
      // aim 0.25 rad up along +z: where the arc preview's ring lands
      me.aimYaw = me.yaw = 0; me.aimPitch = 0.25;
      P.updateArc(me, true);
      const pred = P.arcRing.visible ? P.arcRing.position.clone() : null;
      SURF.IMPL.throwIt(me, s);
      const b = buoys()[0];
      R('…a click throws it: the special is over, the buoy flies', !me.specialActive && b && b.phase === 'fly' && !held.g.parent, { phase: b?.phase, special: !!me.specialActive });
      let landT = null; const t0 = G.time;
      step(3, () => { if (b.phase === 'live' && landT == null) landT = G.time - t0; return b.phase === 'fly'; });
      const d = pred && b.phase === 'live' ? Math.hypot(b.pos.x - pred.x, b.pos.z - pred.z) : 99;
      R(`…it anchors upright where the arc preview said (${r2(d)} m off), ${r2(Math.hypot(b.pos.x - HOME.x, b.pos.z - HOME.z))} m out, after ${r2(landT ?? -1)} s in the air`,
        b.phase === 'live' && d < 0.35 && Math.abs(b.pos.y) < 0.05, { pred: pred && v2(pred), at: v2(b.pos), flight: landT });
      // thrown at the wall from close: it bounces off and anchors on the floor
      reset();
      put(me, V(11, 0, 0), Math.PI / 2); step(0.1);
      const s2 = start(me, 'surf'); step(0.25);
      me.aimYaw = me.yaw = Math.PI / 2; me.aimPitch = 0.05;
      SURF.IMPL.throwIt(me, s2);
      const b2 = buoys()[0];
      step(3, () => b2.phase === 'fly');
      R('…thrown into a wall it bounces off and anchors on the floor in front of it', b2.phase === 'live' && b2.pos.x < 14 && Math.abs(b2.pos.y) < 0.05, { at: v2(b2.pos) });
    }

    // ============================================================================================ pulses
    if (want('pulses')) {
      reset();
      const b = plant(me, V(0, 0, -6));
      const evs = [], reach = [];
      const off = on('surf:pulse', (e) => { if (e.buoy === b) evs.push({ i: e.i, t: b.T }); });
      let samp = null;
      // (long enough for the last ring to reach rMax and sink: about 9.7 s at 8 … 32 m)
      step(D.anchor + D.gap * (D.pulses - 1) + (D.rMax - D.r0) / D.speed + SURF.BREAK_T + 1.5, () => {
        for (const Rg of b.rings) { reach[Rg.i] = Math.max(reach[Rg.i] || 0, Rg.r); if (Rg.state === 'travel' && Rg.i === 2 && Rg.age > 0.3 && !samp) samp = { r: Rg.r, age: Rg.age }; }
        return G.specials.world.includes(b);
      });
      off();
      const gaps = evs.slice(1).map((e, i) => r2(e.t - evs[i].t)), first = evs[0] ? r2(evs[0].t) : null;
      const want0 = Array.from({ length: D.pulses }, (_, i) => r2(SURF.ringReach(i)));
      R(`${D.pulses} rings, the first ${D.anchor} s after it anchors, then every ${D.gap} s`, evs.length === D.pulses && Math.abs(first - D.anchor) < 0.03 && gaps.every((x) => Math.abs(x - D.gap) < 0.03), { n: evs.length, first, gaps });
      R(`…each reaching further: ${want0.join(' → ')} m`, reach.length === D.pulses && reach.every((r, i) => Math.abs(r - want0[i]) < 0.02) && reach.every((r, i) => !i || r > reach[i - 1]), { reach: reach.map(r2) });
      R(`…the front moves at ${D.speed} m/s (ring 3 at ${samp && r2(samp.age)} s: ${samp && r2(samp.r)} m)`, samp && Math.abs(samp.r - (D.r0 + D.speed * samp.age)) < 0.12, samp);
      R('…and after the last one the buoy is gone (its rings too)', !G.specials.world.includes(b) && b.rings.every((x) => x.state === 'done' && !x.ribbon), { phase: b.phase });
    }

    // ============================================================================================ hit
    if (want('hit')) {
      reset();
      const c = V(0, 0, -6);
      put(foe, V(0, 0, -3), Math.PI);   // 3 m out: every ring passes them
      hook = pin(foe);
      const marks = []; const off = on('actor:marked', (e) => { if (e.actor === foe) marks.push({ from: e.from && e.from.isVector3 ? v2(e.from) : null, team: e.team, fresh: e.fresh }); });
      const hp = []; let tracked = null;
      const offD = on('damage', (e) => { if (e.victim === foe && e.source === 'surf') { hp.push(r2(e.amount)); if (!tracked) tracked = 'pending'; } });
      const b = plant(me, c);
      step(D.anchor + 0.7, () => { if (tracked === 'pending') tracked = { track: r2(foe.status.track), team: foe.status.trackTeam }; });
      R(`a foe standing 3 m out takes ${D.damage} from the first ring and is marked: the buoy's team, ${D.markTime} s`, hp.length && Math.abs(hp[0] - D.damage) < 0.5 && tracked && tracked.team === me.team && Math.abs(tracked.track - D.markTime) < 0.1,
        { dmg: hp[0], tracked });
      const bc = b.beacon();
      R('…the mark flies in from the buoy\'s beacon (actor:marked\'s source; the tracked look\'s fresh mark)', marks.length && marks[0].fresh && marks[0].from && Math.hypot(marks[0].from[0] - bc.x, marks[0].from[1] - bc.y, marks[0].from[2] - bc.z) < 0.05, { marks, beacon: v2(bc) });
      // once per ring: no more ring damage until the next ring, then one more
      step(0.4);
      const n1 = hp.length;
      step(D.gap);
      R('…once per ring (no more ring damage until the next ring comes by, then once)', n1 === 1 && hp.length === 2, { hits: hp });
      off(); offD(); hook = null;
      // swimming in ink doesn't help: a squid submerged in its own ink 4 m out
      reset();
      G.paint.splat(V(0, 0.2, -2), 2.5, foe.team, { seed: 0.3, instant: true });
      put(foe, V(0, 0, -2), 0);
      foe._int = (it) => { it.squid = true; };
      hook = () => { foe.pos.x = 0; foe.pos.z = -2; };
      step(0.4);
      const sub = foe.submerged && foe.form === 'squid';
      let hpS = null; const offS = on('damage', (e) => { if (e.victim === foe && e.source === 'surf' && hpS == null) hpS = r2(e.amount); });
      plant(me, V(0, 0, -6));
      step(D.anchor + 0.6);
      offS(); hook = null; foe._int = null;
      R('…swimming in ink doesn\'t help: a squid under its own ink is hit like anyone', sub && hpS != null && Math.abs(hpS - D.damage) < 0.5, { submerged: sub, dmg: hpS });
    }

    // ============================================================================================ dodge
    if (want('dodge')) {
      const tryJump = (squid) => {
        reset();
        const c = V(0, 0, -6), d = 3;
        put(foe, V(0, 0, -6 + d), Math.PI);
        if (squid) { G.paint.splat(V(0, 0.2, -6 + d), 2.0, foe.team, { seed: 0.2, instant: true }); foe._int = (it) => { it.squid = true; }; step(0.3); }
        const b = plant(me, c);
        // jump so its feet are highest as the front gets there: the front reaches them (d − HIT_R − r0) / speed after the ring leaves
        const tHit = D.anchor + (d - SURF.HIT_R - D.r0) / D.speed, vj = squid ? PLAYER.swimJumpVel : PLAYER.jumpVel, tTop = vj / PLAYER.gravity;
        let jumped = false, crossY = null;
        const pinXZ = pin(foe);
        let jumpNow = false;
        foe._int = (it) => { if (squid) it.squid = true; it.jump = jumpNow; };
        hook = () => {
          pinXZ();
          jumpNow = !jumped && b.T >= tHit - tTop * 0.85;
          if (jumpNow) jumped = true;
        };
        const dodges = []; const off = on('surf:dodge', (e) => { if (e.actor === foe) { dodges.push(e.ring); crossY = r2(foe.pos.y); } });
        let ringDmg = 0; const offD = on('damage', (e) => { if (e.victim === foe && e.source === 'surf') ringDmg += e.amount; });
        step(D.anchor + 0.8);
        off(); offD(); hook = null; foe._int = null;
        const w = AS.windowsOn(foe).find((x) => x.helper === me);
        return { ringDmg, track: r2(foe.status.track), dodges, crossY, win: w ? { kind: w.kind, left: r2(w.left) } : null, form: foe.form };
      };
      const k = tryJump(false);
      R('a foe jumping as the first ring\'s front passes (feet over its top) takes nothing from it and isn\'t marked (only the ink they land back in)', k.ringDmg === 0 && k.track === 0 && k.dodges.length === 1 && k.crossY > D.height, k);
      R(`…and the buoy's owner gets the assist window on them (${D.jumpAssist} s, 'jump')`, k.win && k.win.kind === 'jump' && k.win.left > D.jumpAssist - 1, k.win);
      const q = tryJump(true);
      R('…a squid hop out of ink counts too', q.ringDmg === 0 && q.dodges.length === 1 && q.form === 'squid', q);
      // a foe standing on a deck 2.4 m up over the ring's floor (the spawn deck's side): not involved (no hit, no dodge)
      reset();
      put(foe, V(0, 2.4, -40.6), Math.PI);   // (the deck's south edge: z −40)
      hook = pin(foe);
      const b = plant(me, V(0, 0, -37.5));
      let dn = 0; const off = on('surf:dodge', (e) => { if (e.actor === foe) dn++; });
      step(D.anchor + 0.8);
      off(); hook = null;
      R('…a foe standing on a deck above the ring\'s floor isn\'t involved (no hit, no dodge, no window)', foe.hp === PLAYER.hp && !dn && !AS.windowsOn(foe).length, { hp: foe.hp, dodges: dn, reach: r2(b.polar.reachAt(Math.PI)) });
    }

    // ============================================================================================ assists
    if (want('assist')) {
      const splatBy = (killer, v) => { v.hp = 1; v.invuln = 0; P.applyHit(killer, v, 50, killer.weaponId); };
      const dodgeOn = (v) => { AS.noteJump(v, me); };
      // the user's rule: forced to jump → a teammate's splat inside the window = the owner's assist
      reset();
      dodgeOn(foe); step(1.0);
      splatBy(mate, foe);
      const a1 = { owner: me.stats.assists, mateSplats: mate.stats.splats, ownerSplats: me.stats.splats };
      R(`a teammate splats a foe ${r2(1.0)} s after they jumped the owner's ring: the owner gets an assist, the teammate the splat`, !foe.alive && a1.owner === 1 && a1.mateSplats === 1 && a1.ownerSplats === 0, a1);
      reset();
      dodgeOn(foe); step(D.jumpAssist + 0.4);
      splatBy(mate, foe);
      R(`…${r2(D.jumpAssist + 0.4)} s after: no assist (the window's ${D.jumpAssist} s)`, !foe.alive && me.stats.assists === 0, { owner: me.stats.assists });
      // the owner's own splat on the jumper: a splat, never also an assist
      reset();
      dodgeOn(foe); step(0.5);
      splatBy(me, foe);
      R('…the owner splatting the jumper themselves: the splat, no assist', !foe.alive && me.stats.splats === 1 && me.stats.assists === 0, { splats: me.stats.splats, assists: me.stats.assists });
      // the damage rule: damage, then a teammate's splat ≤ 3 s later
      reset();
      P.applyHit(me, foe, 20, me.weaponId); step(2.0);
      splatBy(mate, foe);
      const d1 = me.stats.assists;
      reset();
      P.applyHit(me, foe, 20, me.weaponId); step(AS.ASSIST.damage + 0.4);
      splatBy(mate, foe);
      const d2 = me.stats.assists;
      R(`the damage rule: hurt a foe, a teammate splats them 2 s later → an assist; ${r2(AS.ASSIST.damage + 0.4)} s later → none`, d1 === 1 && d2 === 0, { within: d1, after: d2 });
      // one per splat per player: damage + a forced jump on the same foe → still one; two helpers → one each
      reset();
      P.applyHit(me, foe, 10, me.weaponId); dodgeOn(foe); P.applyHit(mates[1], foe, 10, mates[1].weaponId); step(0.5);
      splatBy(mate, foe);
      R('…one assist per splat per player (damage + a jump from one, damage from another: one each)', me.stats.assists === 1 && mates[1].stats.assists === 1 && mate.stats.assists === 0, { me: me.stats.assists, other: mates[1].stats.assists, killer: mate.stats.assists });
      // an enemy's own splat (by water) with nobody's splat: no assist
      reset();
      P.applyHit(me, foe, 10, me.weaponId); step(0.3);
      foe.splat(null, 'water');
      R('…no splatter (the sea, nobody\'s last hit): nobody gets one', me.stats.assists === 0, { me: me.stats.assists });
    }

    // ============================================================================================ turf
    if (want('turf')) {
      reset();
      const c = V(0, 0, -6);
      put(me, V(-20, 0, -30), 0);
      const n0 = SURF.SURF_STATS.splats, t0 = SURF.SURF_STATS.turf;
      const b = plant(me, c);
      step(D.anchor + D.gap * (D.pulses - 1) + (D.rMax - D.r0) / D.speed + SURF.BREAK_T + 1.5, () => G.specials.world.includes(b));
      step(0.6);   // (the last splats spread)
      // the bands: 0–3 m (solid), then five even bands out to the last ring's reach (rMax) — counted only where a ring
      // could get to (the polar map: not behind the wall, not past the deck's edge); each against the ink model's
      // share for that band (SURF.inkCover averaged over its area)
      const Pm = b.polar, sol = D.solid, nb = 5;
      const bands = [[0, Math.min(3, sol)], ...Array.from({ length: nb }, (_, i) => [r2(sol + ((D.rMax - sol) * i) / nb), r2(sol + ((D.rMax - sol) * (i + 1)) / nb)])];
      const cov = bands.map(([r0, r1]) => {
        let n = 0, own = 0;
        for (let r = r0 + 0.05; r < r1; r += 0.25) { const k = Math.max(24, Math.round(Math.PI * 2 * r / 0.25)); for (let j = 0; j < k; j++) { const a = (j / k) * Math.PI * 2; if (r > Pm.reachAt(a) - 0.6) continue; const v = inkAt(c.x + Math.sin(a) * r, c.z + Math.cos(a) * r); if (v < 0) continue; n++; if (v === me.team + 1) own++; } }
        return n ? r2(own / n) : -1;
      });
      const model = bands.map(([r0, r1]) => { let w = 0, t = 0; for (let r = r0 + 0.05; r < r1; r += 0.1) { w += r; t += r * SURF.inkCover(r); } return r2(t / w); });
      const splats = SURF.SURF_STATS.splats - n0, turf = r2(SURF.SURF_STATS.turf - t0);
      const last = cov.length - 1;
      R(`the ink after all ${D.pulses} rings by band from the buoy, where the rings reach (${bands.map(([a, z], i) => `${a}–${z} m ${Math.round(cov[i] * 100)} % (model ${Math.round(model[i] * 100)} %)`).join(', ')}): ≈ solid out to 3 m, then falling off as the model has it, ≈ ${Math.round(D.paintFar * 100)} % at the last ring's reach`,
        cov[0] >= 0.93 && cov.every((x, i) => x >= 0 && (!i || x <= cov[i - 1] + 0.03)) && cov.every((x, i) => Math.abs(x - model[i]) <= 0.12) && cov[last] >= D.paintFar - 0.08 && cov[last] <= D.paintFar + 0.12, { cov, model, splats, turf, ownerTurf: r2(me.stats.surfTurf || 0) });
      R(`…in ${splats} splats (≤ 260 on the wire for the whole special) for ${turf} m² of turf, the owner's turf (never the special meter)`, splats > 20 && splats <= 260 && me.special === 0, { splats, turf, meter: me.special });
    }

    // ============================================================================================ buoy hp
    if (want('buoy')) {
      reset();
      const b = plant(me, V(0, 0, -6));
      step(D.anchor + 0.2);
      const mid = V(0, 0.6, -6);
      // its own team's shots go through
      const own = G.specials.shotHit(V(-1, 0.6, -6), V(1, 0.6, -6), me.team, 50, mate);
      const hp0 = b.hp;
      // an enemy shot, a blast, a charger beam
      const shot = G.specials.shotHit(V(-1, 0.6, -6), V(1, 0.6, -6), foe.team, 50, foe);
      const hp1 = b.hp;
      G.specials.areaHit(V(1.2, 0.3, -6), 2, 60, foe.team, foe);
      const hp2 = b.hp;
      const cut = G.specials.rayHit(V(-8, 0.7, -6), V(1, 0, 0), 20, foe.team, 80, foe);
      const hp3 = b.hp;
      R(`the buoy (${D.hp} hp) takes enemy fire — a shot (absorbed), a blast, a charger beam (cut at it) — and its own team's goes through`,
        !own && hp0 === D.hp && shot && hp1 === D.hp - 50 && hp2 === hp1 - 60 && cut < 8.5 && hp3 === hp2 - 80 && b.flash > 0, { own, shot, hp: [hp0, hp1, hp2, hp3], cut: r2(cut) });
      const pops = []; const off = on('surf:pop', (e) => pops.push(e.buoy));
      for (let i = 0; i < 6 && b.phase === 'live'; i++) G.specials.shotHit(V(-1, 0.6, -6), V(1, 0.6, -6), foe.team, 50, foe);
      off();
      step(0.1);
      const ringsLeft = b.rings.filter((x) => x.ribbon).length;
      R('…and pops at 0: gone from the world, its rings with it', pops.includes(b) && !G.specials.world.includes(b) && !ringsLeft, { hp: b.hp, phase: b.phase });
    }

    // ============================================================================================ walls
    if (want('walls')) {
      reset();
      const c = V(10, 0, 0);
      put(foe, V(17.5, 0, 0), 0);     // 7.5 m out, behind the wall (x 14…15, 4 m tall)
      put(foe2, V(10, 0, 7.5), 0);    // 7.5 m out, in the open
      hook = pin(foe, foe2);
      const b = plant(me, c);
      step(D.anchor + D.gap * 2 + 1.2);
      hook = null;
      R('a wall taller than the ribbon stops it: the foe behind it isn\'t reached, the one the same distance out in the open is',
        foe.hp === PLAYER.hp && foe.status.track === 0 && foe2.hp < PLAYER.hp && foe2.status.trackTeam === me.team, { behind: r2(foe.hp), open: r2(foe2.hp), reach: r2(b.polar.reachAt(Math.PI / 2)) });
      const hd = b.polar.reachAt(Math.PI / 2);
      R(`…its reach that way ends at the wall's face (${r2(hd)} m: the wall is 4 m off)`, hd > 3.6 && hd < 4.2, { reach: r2(hd) });
    }

    // ============================================================================================ results
    if (want('results')) {
      reset();
      me.stats.assists = 3; mate.stats.assists = 1;
      m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } });
      // the online final count carries them (the host's sendResult → a guest's _result)
      let msg = null;
      const ctx = { isHost: true, match: m, _sendNow: (d) => { msg = d; } };
      NM.NetMatch.prototype.sendResult.call(ctx, { coverage: [0.4, 0.3], winner: 0 });
      const row = msg && msg.st.find((r) => r[0] === me.nid);
      me.stats.assists = 0;
      const gctx = { isHost: false, match: { ...m, setState() {} }, byNid: new Map(m.actors.map((a) => [a.nid, a])) };
      NM.NetMatch.prototype._result.call(gctx, { ...msg, st: msg.st.map((r) => r[0] === me.nid ? r : r) });
      R('the host\'s final count carries each player\'s assists, and a guest\'s screen takes them', row && row[6] === 3 && me.stats.assists === 3, { row });
      // the splat event's `as` credits the helpers on another screen
      const before = me.stats.assists;
      const ctx2 = { byNid: new Map(m.actors.map((a) => [a.nid, a])), _stopLoops() {} };
      foe.alive = true; const net0 = foe.net; foe.net = { buf: [], ready: true, has: true, tp: 0 };
      NM.NetMatch.prototype._remoteSplat.call(ctx2, foe, mate, 'shooter', String(me.nid));
      const dead = !foe.alive;
      foe.net = net0; foe.respawn();
      R('…and a splat event\'s helpers (`as`: their net ids) are credited on every other screen', me.stats.assists === before + 1 && dead, { before, after: me.stats.assists });
      for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; }
      // the results data: main.js puts each player's assists in the rows the results screen shows
      reset();
      me.stats.assists = 2;
      const rowsFn = g._judge.toString();
      R('…the results data carry them (main.js _judge: players[].assists) and the screen shows them after the splats (menus.js)', /assists: a\.stats\.assists/.test(rowsFn), {});
    }

    // ============================================================================================ net
    if (want('net')) {
      reset();
      netOn();
      // the owner throws (records [0]), anchors ([3])
      const s = start(me, 'surf'); step(0.2);
      me.aimYaw = me.yaw = 0; me.aimPitch = 0.2;
      SURF.IMPL.throwIt(me, s);
      const ob = buoys().find((w) => !w.ghost);
      step(3, () => ob.phase === 'fly');
      const recs = sent.filter((x) => x.kind === 'surf').map((x) => x.data);
      const thr = recs.find((d) => d[0] === 0), anc = recs.find((d) => d[0] === 3);
      R('online: the owner records the throw ([0, gid, from, vel]) and where it anchored ([3, gid, x, y, z])', thr && anc && thr[1] === ob.gid && Math.hypot(anc[2] - ob.pos.x, anc[4] - ob.pos.z) < 0.02, { thr, anc });
      // another screen: those records build a ghost (it flies, then snaps to the anchor at the record), its rings in step
      reset(); netOn();
      const ownerB = plant(me, V(0, 0, -6), false, 4242);
      KIT_GHOSTS.surf.ghost(me, [0, 4343, 0, 1.4, -10, 0, 6, 5]);
      const gb = buoys().find((w) => w.ghost && w.gid === 4343);
      step(0.3);
      KIT_GHOSTS.surf.ghost(me, [3, 4343, 0, 0, -6]);
      const pair = [];
      step(D.anchor + D.gap * 2 + 0.5, () => { pair.push([ownerB.rings.map((x) => r2(x.r)).join(','), gb.rings.map((x) => r2(x.r)).join(',')]); });
      const lagged = pair.filter(([a, b2]) => a !== b2).length;
      // (the ghost anchored 0.3 s + 1 frame later: compare its ring radii shifted by that)
      const sh = Math.round((gb.landT - ownerB.landT) * 60);
      const same = pair.slice(0, pair.length - sh).every((p, i) => pair[i + sh] && pair[i + sh][1] === p[0]);
      R('…a ghost from the records anchors where the owner\'s did and its rings run in step from that moment (same reach, same times)', gb && gb.phase === 'live' && Math.abs(gb.pos.z + 6) < 0.01 && same, { lagged, shift: sh });
      // judging: the owner's copy never judges a remote player; the ghost copy judges its own (the victim's owner)
      reset(); netOn();
      foe.remote = true;
      put(foe, V(0, 0, -3), Math.PI); hook = pin(foe);
      plant(me, V(0, 0, -6), false, 5151);
      step(D.anchor + 0.6);
      const remoteHp = foe.hp;
      foe.remote = false; hook = null;
      reset(); netOn();
      put(foe, V(0, 0, -3), Math.PI); hook = pin(foe);
      const gb2 = plant(me, V(0, 0, -6), true, 5252);
      step(D.anchor + 0.6);
      hook = null;
      const hitRec = sent.find((x) => x.kind === 'surf' && x.data[0] === 1 && x.a === foe);
      R('…hits are judged where the victim is owned: the owner\'s copy leaves a remote foe alone; a ghost hits this screen\'s own foe, which records the hit ([1, gid, ring] on the victim)',
        remoteHp === PLAYER.hp && foe.hp === PLAYER.hp - D.damage && hitRec && hitRec.data[1] === 5252 && gb2.ghost, { remoteHp, localHp: foe.hp, rec: hitRec?.data });
      // that record on a third screen: the mark there (from the beacon), the hit marker for the owner
      reset(); netOn();
      const gb3 = plant(me, V(0, 0, -6), true, 5353);
      foe.remote = true;
      const hits = []; const off = on('hit', (e) => { if (e.victim === foe && e.weaponId === 'surf') hits.push(e.attacker === me); });
      const marks = []; const off2 = on('actor:marked', (e) => { if (e.actor === foe) marks.push(e.from && e.from.isVector3 ? v2(e.from) : null); });
      KIT_GHOSTS.surf.ghost(foe, [1, 5353, 0]);
      off(); off2(); foe.remote = false;
      R('…the hit record plays on the other screens: the mark (from the buoy\'s beacon), the hit for the owner', foe.status.track > 0 && foe.status.trackTeam === me.team && hits[0] === true && marks.length && Math.abs(marks[0][1] - gb3.beacon().y) < 0.05, { track: foe.status.track, hits, marks });
      // a shot on a ghost buoy goes to its owner
      sent.length = 0;
      G.specials.shotHit(V(-1, 0.6, -6), V(1, 0.6, -6), foe.team, 40, foe);
      const dh = sent.find((x) => x.dh);
      R('…a shot at a remote player\'s buoy goes to its owner (device hit: kind surf, its gid, the damage); the owner\'s copy takes it', dh && dh.kind === 'surf' && dh.id === 5353 && dh.d === 40, dh);
      netOff();
    }

    // ============================================================================================ bots
    if (want('bots')) {
      // a bot holding it picks a spot (here: the foes it knows about) and throws there
      reset();
      const B = mate; unstub(B);
      put(B, V(0, 0, -12), 0);
      put(foe, V(1, 0, -3), Math.PI); put(foe2, V(-1, 0, -2), Math.PI);
      hook = pin(foe, foe2);
      step(0.6);   // (the bot sees them)
      const s = start(B, 'surf');
      let b = null;
      step(3, () => { b = buoys().find((w) => w.owner === B); return !b; });
      step(2, () => b.phase === 'fly');
      hook = null;
      const dTo = b ? Math.min(...[foe, foe2].map((f) => Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z))) : 99;
      R(`a bot holding it throws it at the foes it knows about (it landed ${r2(dTo)} m from the nearer)`, b && b.phase === 'live' && dTo < 4, { at: b && v2(b.pos), plan: s.plan && { x: r2(s.plan.x), z: r2(s.plan.z), why: s.plan.why } });
      stub(B);
      // bots in a ring's way jump it (hard bots: most of the time)
      // (their own brains, held in place: no walking, no shooting — the jump is theirs)
      const still = (f) => { const u0 = f.bot._u0; f.bot.update = function (dt) { u0.call(this, dt); f.intent.move.set(0, 0, 0); f.intent.fire = false; f.intent.sub = false; f.intent.squid = false; f.intent.special = false; }; };
      const run = (id) => {
        let jumps = 0, hitsN = 0;
        for (let k = 0; k < 6; k++) {
          reset();
          put(me, V(-24, 0, -30), 0);
          const J = foes.slice(0, 3);
          J.forEach((f, i) => { f.bot.diff = { ...f.bot.diff, id, reaction: { easy: 0.55, normal: 0.32, hard: 0.17 }[id] }; still(f); put(f, V(-3 + i * 3, 0, -1), Math.PI); });
          const bb = plant(me, V(0, 0, -6));
          const offD = on('surf:dodge', (e) => { if (e.buoy === bb) jumps++; }), offH = on('surf:hit', (e) => { if (e.buoy === bb) hitsN++; });
          step(D.anchor + D.gap * 2 + 1.4);
          offD(); offH();
          J.forEach(stub);
        }
        return { jumps, hits: hitsN, share: r2(jumps / Math.max(1, jumps + hitsN)) };
      };
      const hard = run('hard'), easy = run('easy');
      // (hard bots jump 72–86 % across runs — about 35 rings a run, so the share swings ±7 points: a 75 % bar flaked at 0.72 / 0.74)
      R(`bots in a ring's way jump it: hard ${hard.jumps} jumped / ${hard.hits} hit (≥ 65 %), easy ${easy.jumps} / ${easy.hits} (fewer)`, hard.jumps + hard.hits >= 20 && hard.share >= 0.65 && easy.share < hard.share, { hard, easy, stats: { ...SB.SURF_BOT } });
      // no foe in sight: a bot shoots an enemy buoy down
      reset();
      const Sh = foes.find((f) => ['shooter', 'blaster', 'dualies', 'splatling', 'slosher'].includes(f.weapon.kind)) || foe;
      const w0 = Sh.weaponId; if (!['shooter', 'blaster', 'dualies', 'splatling', 'slosher'].includes(Sh.weapon.kind)) Sh.setWeapon('shooter');
      // ([b5-deploy] a fresh brain: one still hunting a foe from the scenes before is not "no foe in sight" — and what it
      // did, for a diagnosis: seconds on the buoy, its mode, a target, escapes)
      unstub(Sh); Sh.bot.reset(); put(Sh, V(0, 0, 2), Math.PI);
      const bb = plant(me, V(0, 0, -6));
      put(me, V(-20, 0, -40), 0);
      const hp0 = bb.hp, DBm = await import('./src/game/deployables-bots.js'), SPm = await import('./src/game/botSpecials.js');
      const ds0 = DBm.DEV_BOT.secs, es0 = SPm.SPECIAL_STATS.escapes, modes = {};
      step(4, () => { modes[Sh.bot.mode] = (modes[Sh.bot.mode] || 0) + 1; return bb.phase === 'live'; });
      const diag = { devS: r2(DBm.DEV_BOT.secs - ds0), escapes: SPm.SPECIAL_STATS.escapes - es0, modes, target: Sh.bot.target ? Sh.bot.target.name : null, weapon: Sh.weaponId, ink: Math.round(Sh.ink) };
      stub(Sh); if (Sh.weaponId !== w0) Sh.setWeapon(w0);
      R(`with no foe in sight a bot shoots an enemy buoy down (hp ${hp0} → ${Math.max(0, bb.hp)}; ${diag.weapon}, ${diag.devS} s on it, ${diag.escapes} escapes, modes ${JSON.stringify(modes)})`, bb.hp < hp0, { hp: bb.hp, phase: bb.phase, weapon: Sh.weaponId, diag });
    }
    // ============================================================================================ roof (MAP=podbox)
    // an off-limits top (a roof: the dead-end lane's walls, x 19.5…20 / 24…24.5, z −36.5…−22, 2.6 m, roof) is no place to
    // anchor: dropped onto one, the buoy slides off it and anchors on the floor beside it
    if (want('roof') && g.mapDef?.id === 'podbox') {
      reset();
      const b = new SURF.Buoy(me, V(19.75, 4, -29), V(0, -2, 0), false, 0);
      G.specials.world.push(b);
      let onTop = false;
      step(3, () => { if (b.phase === 'fly' && b.pos.y > 2.55 && b.pos.y < 2.7) onTop = true; return b.phase === 'fly'; });
      R('a buoy dropped onto an off-limits roof (a lane wall\'s top) slides off it and anchors on the floor beside it', onTop && b.phase === 'live' && b.pos.y < 0.1 && (b.pos.x < 19.5 || b.pos.x > 20), { at: v2(b.pos), phase: b.phase, slid: onTop });
    }
    // ============================================================================================ sounds
    if (want('sounds')) {
      const A = G.audio; if (!A.ctx) A.init();
      const { SURF_SOUNDS } = await import('./src/audio/sfx-surf.js');
      // (the engine collapses a sound played within its minGap of the last: a buoy shot down a moment ago in the same
      // stepped block — the audio clock doesn't move inside one — would swallow surf_pop here)
      const built = SURF_SOUNDS.map((n) => { A.last?.delete(n); return [n, !!A.play(n, { volume: 0.01 })]; });
      R('every Surf N\' Turf sound builds and plays (synthesized: ' + SURF_SOUNDS.join(', ') + ')', built.every((x) => x[1]), built);
      // the special's own moments: its sounds as it goes (the enemy's ring in your face, your dodge)
      const rec = []; const p0 = A.play.bind(A);
      A.play = (n, o) => { const v = p0(n, o); if (/^surf_|^sting_surf/.test(n)) rec.push({ n, k: o?.params?.n, local: !o?.pos }); return v; };
      reset();
      put(me, V(0, 0, -12), 0); step(0.1);
      const s = start(me, 'surf'); step(0.2); me.aimPitch = 0.1;
      SURF.IMPL.throwIt(me, s);
      const b = buoys()[0];
      step(1.5, () => b.phase !== 'live');
      put(foe, V(b.pos.x, 0, b.pos.z + 3), Math.PI); hook = pin(foe);
      step(D.anchor + D.gap * (D.pulses - 1) + 2.2);
      hook = null;
      A.play = p0;
      const names = rec.map((x) => x.n), pulses = rec.filter((x) => x.n === 'surf_pulse').map((x) => x.k);
      R(`…heard in play: the machine powering up, the throw, the deploy clunk + bell, a "whoom" per ring growing with each (params.n 0 … ${D.pulses - 1}), the hit`,
        ['surf_ready', 'surf_throw', 'surf_deploy', 'surf_hit'].every((n) => names.includes(n)) && JSON.stringify(pulses) === JSON.stringify(Array.from({ length: D.pulses }, (_, i) => i)), { names: [...new Set(names)], pulses });
      // the sting an enemy's Surf N' Turf gets (the cue director: sting_<kind>)
      reset();
      const st = []; const p1 = A.play.bind(A); A.play = (n, o) => { if (n === 'sting_surf') st.push(1); return p1(n, o); };
      start(foe, 'surf'); step(0.2);
      A.play = p1;
      R('…an enemy popping it plays its sting (sting_surf)', st.length === 1, { stings: st.length });
    }
  } catch (e) {
    R('HARNESS ERROR ' + e.message, false, String(e.stack).split('\n').slice(0, 6));
  }
  for (const a of m.actors) unstub(a);
  return out;
})();
