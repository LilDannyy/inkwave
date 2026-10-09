// jump-ui online (b5-jumpui, 2026-10-04: src/game/jumpMarks.js, src/ui/hud-jumps.js; net/netmatch.js sjNetEvent /
// sjNetFill): two real clients on the local relay (netpage.cjs), online Practice with no bots, both players on ONE team.
// The user asked for "an on screen alert when a teammate is jumping to you and their name, as well as a name around the
// super jump icon, and an indicator for when they're landing", and for Zipline / Ink Jet "an indicator when they start
// using the special so players know where they'd super jump to, and where the player will jump back when it ends".
//   1. A (the host) super jumps to B (the guest). B's screen: "Hosty is jumping to you!" (only there: A's own screen has
//      no alert), the landing tag with A's name on B's minimap, A's flight on B's screen the owner's (the same landing
//      spot and flight time, from A's 'superjump' events), the countdown running down to ~0 at A's touchdown on B's
//      screen, then gone. And the other way round: B jumps to A, A's screen alerts with B's name.
//   2. A goes up on Ink Jet. B's screen: A's return mark from the special's start, at A's take-off spot, with A's name
//      in the world (B looks at it) and on the minimap; its countdown in step with A's own screen; B super jumps to A
//      and lands at the mark (A's screen alerts "Guesty is jumping to you!" while A is up on Ink Jet); A's Ink Jet runs
//      out, A jumps home: on B's screen the mark stays until A lands on it, then goes. Its countdown on each screen runs
//      from the time it really takes there to ~0 at A's touchdown there.
//   3. A's Zipline: its mark (the Zipline icon, A's name) on B's screen; A's special ends with A still on its take-off
//      spot (no jump home): B's mark goes at once (specials.js ReturnMarker: it used to sit grey for 30 s).
//   scene=tower (Tower Command, instead of 1–3): B rides the moving tower, A jumps to B. On both screens A's landing
//      mark rides the deck through the flight and A comes down where the mark ended up (the owner's landing follows the
//      tower: Actor._updateSuperJump; B's copy of A's jump follows B's own tower: jumpMarks.js sjNetFill).
//   CLIENTS=2 NET=tools/botlab/tests/net-jump-ui.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS: 'map=<id>' (default saltpan); 'shots' saves B's screen (the alert; A's Ink Jet return mark) to
//   tools/botlab/jobs/batch5/jumpui/out/ (or OUT); 'scene=tower'
const path = require('path');
module.exports = async (ctx) => {
  const { clients, R, wait, say, args } = ctx;
  const [A, B] = clients;
  const opt = Object.fromEntries((args || '').split(/[;&]/).filter(Boolean).map((kv) => kv.split('=')));
  const MAP = opt.map || 'saltpan', SHOTS = 'shots' in opt, TOWER = opt.scene === 'tower';
  const SHOT_DIR = process.env.OUT || path.join(process.env.BOTLAB_ROOT || process.cwd(), 'tools/botlab/jobs/batch5/jumpui/out');
  const shot = async (c, name) => { if (!SHOTS) return; const r = await c.shot(`${SHOT_DIR}/${name}.jpg`); say('shot', name, r && r.bytes); };
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const r2 = (x) => Math.round(x * 100) / 100;
  const code = await A.js(`__G.net.create('Hosty')`);
  say('room', code);
  await A.js(`__G.net.setSettings({ mode: ${JSON.stringify(TOWER ? 'tower' : 'practice')}, map: ${JSON.stringify(MAP)}, time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  // one team: the guest asks for the host's side
  const teams0 = await J(A, `__G.net.lobby.players.map((p) => p.team)`);
  if (teams0[0] !== teams0[1]) { await B.js(`__G.net.setMe({ team: ${teams0[0]} }); 1`); await A.until(`(() => { const p = __G.net.lobby.players; return p[0].team === p[1].team; })()`, 8000); }
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up');
  const ids = await J(A, `(() => { const m = __G.match; return m.actors.map((a) => [a.nid, a.name, a.team, !!a.isLocal]); })()`);
  const tA = ids.find((x) => x[1] === 'Hosty'), tB = ids.find((x) => x[1] === 'Guesty');
  R(`two players on one team (online ${TOWER ? 'Tower Command' : 'Practice'}, no bots)`, !!tA && !!tB && tA[2] === tB[2] && ids.length === 2, ids);
  if (!tA || !tB) return;
  // on each screen: listeners, and a per-frame sampler of what the HUD shows (hud.jumps.state()) and the marks
  const setup = (c) => c.js(`(async () => {
    const { on } = await import('./src/core/ctx.js'); const JM = await import('./src/game/jumpMarks.js');
    const g = __inkwave, G = __G, L = window.__ju = { land: [], sj: [], f: [], rec: false };
    const nameOf = (a) => (a ? a.name : null);
    on('superjump:land', (e) => L.land.push({ who: nameOf(e.actor), t: Date.now(), g: G.time, p: [e.pos.x, e.pos.y, e.pos.z] }));
    on('superjump', (e) => L.sj.push({ who: nameOf(e.actor), phase: e.phase, t: Date.now(), to: e.to ? [e.to.x, e.to.y, e.to.z] : null, dur: e.dur || 0 }));
    const tick = () => {
      if (L.rec && G.match && !G.match.attract) {
        const st = g.hud.jumps.state();
        L.f.push({ t: Date.now(), g: G.time, al: st.alerts.map((x) => [x.name, x.sec]), w: st.world.map((x) => [x.kind, x.name, x.sec]), m: st.map.map((x) => [x.kind, x.name, x.sec]),
          mk: JM.landingMarks().map((r) => [r.kind, r.actor.name, +r.x.toFixed(2), +r.y.toFixed(2), +r.z.toFixed(2), +r.left.toFixed(3), r.phase]) });
        if (L.f.length > 4000) L.f.splice(0, 1000);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const me = G.match.local; if (me.bot) me.bot.update = () => { me.intent.move.set(0, 0, 0); me.intent.fire = me.intent.squid = me.intent.sub = me.intent.special = me.intent.jump = false; };
    me.invuln = 999;
    return 1; })()`);
  await setup(A); await setup(B);
  // a flat open spot near the middle (A's screen), and a clear line 13 m out from it
  const S = await J(A, `(() => {
    const G = __G, nodes = [...G.nav.nodes].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    const flat = (x, y, z, r1) => { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= r1; r++) { if (!(Math.abs(G.level.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r, y + 1.5) - y) < 0.2)) return false; } } return true; };
    for (const n of nodes) {
      if (!flat(n.x, n.y, n.z, 5)) continue;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let ok = true;
        for (let r = 5; r <= 15 && ok; r++) ok = Math.abs(G.level.groundHeight(n.x + dx * r, n.z + dz * r, n.y + 1.5) - n.y) < 0.2;
        if (ok) return { x: n.x, y: n.y, z: n.z, dx, dz }; }
    }
    return null; })()`);
  R('a flat spot to stage it', !!S, S);
  if (!S) return;
  const put = (c, x, z, yaw) => c.js(`(() => { const me = __G.match.local; me.pos.set(${x}, ${S.y} + 0.02, ${z}); me.vel.set(0, 0, 0); me.netTp = (me.netTp || 0) + 1; ${yaw != null ? `__inkwave.rig.yaw = me.yaw = me.aimYaw = ${yaw}; __inkwave.rig.pitch = -0.15;` : ''} return 1; })()`);
  const homeA = [S.x, S.z], homeB = [S.x + S.dx * 13, S.z + S.dz * 13];
  const yawAtoB = Math.atan2(S.dx, S.dz), yawBtoA = Math.atan2(-S.dx, -S.dz);
  const stage = async () => { await put(A, homeA[0], homeA[1], yawAtoB); await put(B, homeB[0], homeB[1], yawBtoA); await wait(1200); };
  const rec = (c, on) => c.js(`(() => { window.__ju.rec = ${on}; if (${on}) { window.__ju.f.length = 0; window.__ju.land.length = 0; window.__ju.sj.length = 0; } return 1; })()`);
  const log = (c) => J(c, `window.__ju`);
  const landOf = (L, who) => L.land.find((l) => l.who === who) || null;
  if (TOWER) { await towerScene(); return; }

  // ------------------------------------------------------------------------------------------------ 1. A jumps to B
  await stage();
  await rec(A, true); await rec(B, true);
  const okJ = await A.js(`(() => { const m = __G.match, him = m.actors.find((a) => a.name === 'Guesty'); return m.local.superJump(him); })()`);
  await B.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 8000).catch(() => null);
  await wait(800);
  await rec(A, false); await rec(B, false);
  const LA = await log(A), LB = await log(B);
  const aLand = landOf(LA, 'Hosty'), bLand = landOf(LB, 'Hosty');
  const aFl = LA.sj.find((e) => e.who === 'Hosty' && e.phase === 'flight');
  const fB = LB.f, alF = fB.filter((f) => f.al.some((x) => x[0] === 'Hosty'));
  const firstAl = alF[0], lastAl = alF[alF.length - 1];
  R('A super jumps to B: on B\'s screen "Hosty is jumping to you!" comes up', okJ && alF.length > 10, { ok: okJ, frames: alF.length, first: firstAl && firstAl.al });
  R('…and not on A\'s own screen (the jumper)', !LA.f.some((f) => f.al.length), { aAlerts: LA.f.filter((f) => f.al.length).length });
  const bMapNamed = alF.filter((f) => f.m.some((x) => x[0] === 'jump' && x[1] === 'Hosty'));
  R('B\'s minimap: the landing tag carries A\'s name all the way down', alF.length > 10 && bMapNamed.length >= alF.length - 1, { alertFrames: alF.length, mapFrames: bMapNamed.length });
  // A's flight on B's screen is the owner's: the same landing spot and flight time
  const bMk = fB.map((f) => f.mk.find((x) => x[0] === 'jump' && x[1] === 'Hosty')).filter(Boolean), bFl = bMk.filter((x) => x[6] === 'flight');
  const bTo = bFl.length ? bFl[bFl.length - 1] : null;
  R('B\'s screen draws A\'s jump to the landing A\'s own screen flies to (A\'s flight record: from / to / duration)', !!aFl && !!bTo && Math.hypot(bTo[2] - aFl.to[0], bTo[4] - aFl.to[2]) < 0.05, { aTo: aFl && aFl.to.map(r2), bTo: bTo && [bTo[2], bTo[3], bTo[4]] });
  // the countdown on B's screen: down every frame, ~0 when A lands there; the time it showed = the time it took there
  const secs = alF.map((f) => +f.al.find((x) => x[0] === 'Hosty')[1]);
  const mono = secs.every((s, i) => !i || s <= secs[i - 1] + 1e-9);
  const took = bLand && firstAl ? bLand.g - firstAl.g : null;   // (game time: an offscreen window's frames can run slow)
  R('B\'s alert counts down (never up) to ~0 at A\'s touchdown on B\'s screen', mono && secs.length > 10 && secs[secs.length - 1] <= 0.25 && !!bLand && Math.abs(lastAl.t - bLand.t) < 150, { first: secs[0], last: secs[secs.length - 1], lastAlertToLand: bLand && lastAl && Math.round(bLand.t - lastAl.t) });
  R('…its first reading is the time the jump really took on B\'s screen (within 0.3 s)', took != null && Math.abs(secs[0] - took) < 0.3, { shown: secs[0], took: took && r2(took) });
  const after = fB.filter((f) => bLand && f.t > bLand.t + 400);
  R('…and it is gone once A has landed (alert and tags)', !!bLand && after.length > 3 && after.every((f) => !f.al.length && !f.m.some((x) => x[1] === 'Hosty')), { after: after.length });
  R('A lands by B on both screens at the same spot', !!aLand && !!bLand && Math.hypot(aLand.p[0] - bLand.p[0], aLand.p[2] - bLand.p[2]) < 0.4, { a: aLand && aLand.p.map(r2), b: bLand && bLand.p.map(r2) });
  // the other way round: B jumps to A (a guest's jump on the host's screen)
  await stage();
  await rec(A, true); await rec(B, true);
  await B.js(`(() => { const m = __G.match, him = m.actors.find((a) => a.name === 'Hosty'); return m.local.superJump(him); })()`);
  await A.until(`window.__ju.land.some((l) => l.who === 'Guesty')`, 8000).catch(() => null);
  await wait(400);
  await rec(A, false); await rec(B, false);
  const LA2 = await log(A), LB2 = await log(B);
  const al2 = LA2.f.filter((f) => f.al.some((x) => x[0] === 'Guesty'));
  R('B jumps to A: A\'s screen alerts "Guesty is jumping to you!" (and B\'s own does not)', al2.length > 10 && !LB2.f.some((f) => f.al.length) && !!landOf(LA2, 'Guesty'), { aFrames: al2.length, bAlerts: LB2.f.filter((f) => f.al.length).length });
  // a picture of the alert on B's screen (A jumping in again)
  if (SHOTS) {
    await stage();
    await A.js(`(() => { const m = __G.match, him = m.actors.find((a) => a.name === 'Guesty'); return m.local.superJump(him); })()`);
    await wait(900); await shot(B, 'net-guest-alert');
    await B.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 6000).catch(() => null);
    await wait(600);
  }

  // ------------------------------------------------------------------------------------------------ 2. A's Ink Jet
  await stage();
  await rec(A, true); await rec(B, true);
  await A.js(`(() => { const me = __G.match.local; me.specialId = 'jetpack'; me.special = me.specialCost(); me._startSpecial(); window.__ju.t0 = Date.now(); return 1; })()`);
  const origin = await J(A, `(() => { const s = __G.match.local.specialActive; return s && s.origin ? [s.origin.x, s.origin.y, s.origin.z] : null; })()`);
  await B.until(`__G.specials.world.some((w) => w.kind === 'return' && w.owner && w.owner.name === 'Hosty')`, 5000).catch(() => null);
  const gm = await J(B, `(() => { const w = __G.specials.world.find((w) => w.kind === 'return' && w.owner && w.owner.name === 'Hosty'); return w ? [w.pos.x, w.pos.y, w.pos.z] : null; })()`);
  R('A goes up on Ink Jet: B\'s screen shows A\'s return mark at A\'s take-off spot', !!origin && !!gm && Math.hypot(gm[0] - origin[0], gm[2] - origin[2]) < 0.6, { origin: origin && origin.map(r2), onB: gm && gm.map(r2) });
  // A hovers off sideways (its own screen moves it, 4 m/s for 1.5 s)
  await A.js(`(() => { const me = __G.match.local, sx = ${S.dz}, sz = ${-S.dx}; let n = 0;
    window.__hover = setInterval(() => { if (++n > 45) { clearInterval(window.__hover); return; } me.pos.x += sx * 4 / 30; me.pos.z += sz * 4 / 30; }, 33); return 1; })()`);
  await wait(1800);
  const tagB = await J(B, `(() => { const st = __inkwave.hud.jumps.state(); return { w: st.world.filter((x) => x.kind === 'return').map((x) => x.name), m: st.map.filter((x) => x.kind === 'return').map((x) => x.name) }; })()`);
  R('…with A\'s name in B\'s world view and on B\'s minimap', tagB.w.includes('Hosty') && tagB.m.includes('Hosty'), tagB);
  await shot(B, 'net-guest-inkjet-return');
  // B super jumps to A (up on Ink Jet): B lands at the mark; A's screen alerts with B's name
  await B.js(`(() => { const m = __G.match, him = m.actors.find((a) => a.name === 'Hosty'); window.__ju.okJ = m.local.superJump(him); return 1; })()`);
  await B.until(`window.__ju.land.some((l) => l.who === 'Guesty')`, 8000).catch(() => null);
  const LB3 = await log(B), LA3 = await log(A);
  const bl = landOf(LB3, 'Guesty'), al3 = LA3.f.filter((f) => f.al.some((x) => x[0] === 'Guesty'));
  const aNow = await J(A, `(() => { const p = __G.match.local.pos; return [p.x, p.y, p.z]; })()`);
  R('B super jumps to A up on Ink Jet: B lands at A\'s return mark (not under A)', LB3.okJ && !!bl && !!origin && Math.hypot(bl.p[0] - origin[0], bl.p[2] - origin[2]) < 1.6 && Math.hypot(bl.p[0] - aNow[0], bl.p[2] - aNow[2]) > 3, { land: bl && bl.p.map(r2), mark: origin && origin.map(r2), a: aNow.map(r2) });
  R('…and A\'s screen alerted "Guesty is jumping to you!" while A was up', al3.length > 10, { frames: al3.length });
  // A's Ink Jet runs out: A jumps home. On B's screen the mark stays until A lands on it, then goes
  await A.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 12000).catch(() => null);
  await B.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 4000).catch(() => null);
  await wait(800);
  await rec(A, false); await rec(B, false);
  const LA4 = await log(A), LB4 = await log(B);
  const hl = landOf(LB4, 'Hosty'), hlA = landOf(LA4, 'Hosty');
  // (from the frame the ghost's mark first shows — A's start record is a network hop behind — to A's touchdown)
  const has = (f) => f.mk.some((x) => x[0] === 'return' && x[1] === 'Hosty');
  const i0 = LB4.f.findIndex(has), t0B = i0 >= 0 ? LB4.f[i0].t : Infinity;
  const fr = LB4.f.filter((f) => hl && f.t >= t0B && f.t < hl.t - 40), frAfter = LB4.f.filter((f) => hl && f.t > hl.t + 300);
  const shownB = fr.filter(has);
  const homeFr = fr.filter((f) => f.mk.some((x) => x[0] === 'return' && x[1] === 'Hosty' && x[6] === 'home'));
  R('A\'s Ink Jet runs out: A jumps home and lands on its take-off spot (A\'s screen and B\'s)', !!hlA && !!hl && Math.hypot(hlA.p[0] - origin[0], hlA.p[2] - origin[2]) < 1.2 && Math.hypot(hl.p[0] - origin[0], hl.p[2] - origin[2]) < 1.2, { a: hlA && hlA.p.map(r2), b: hl && hl.p.map(r2), origin: origin.map(r2) });
  // its countdown: on each screen it says when that screen will see A land (B's runs a network hop behind A's, as
  // everything of A's does there); read at the mark's first frame, and at touchdown
  const cd = (L, land) => { const fs = L.f.filter((f) => land && f.t < land.t - 20 && has(f)); if (!fs.length) return null; const v = fs.map((f) => f.mk.find((x) => x[0] === 'return' && x[1] === 'Hosty')[5]);
    return { first: r2(v[0]), took: r2(land.g - fs[0].g), last: r2(v[v.length - 1]), mono: v.every((x, i) => !i || x <= v[i - 1] + 0.02) }; };
  const cdA = cd(LA4, hlA), cdB = cd(LB4, hl);
  const okCd = (c) => !!c && c.mono && Math.abs(c.first - c.took) < 0.35 && c.last <= 0.25;
  R('…its countdown on both screens runs down (never up) from the time it really takes there to ~0 at touchdown', okCd(cdA) && okCd(cdB), { a: cdA, b: cdB, lagMs: hlA && hl ? hl.t - hlA.t : null });
  R('…on B\'s screen the mark stayed up every frame until then (the flight home included), then went', fr.length > 60 && shownB.length >= fr.length - 2 && homeFr.length > 5 && frAfter.length > 3 && frAfter.every((f) => !f.mk.some((x) => x[1] === 'Hosty')), { frames: fr.length, shown: shownB.length, home: homeFr.length, after: frAfter.length, startToShownMs: i0 >= 0 && LA4.t0 ? Math.round(t0B - LA4.t0) : null });
  // ------------------------------------------------------------------------------------------------ 3. A's Zipline, ended on the spot
  // A's Zipline shows on B's screen too; A's special runs out with A still within 2.5 m of its take-off point (no jump
  // home: the owner just walks on). B's ghost mark heads home, sees no jump, and goes (it used to sit there grey for 30 s)
  await stage();
  await A.js(`(() => { const me = __G.match.local; me.specialId = 'zipcaster'; me.special = me.specialCost(); me._startSpecial(); return 1; })()`);
  const zOk = await B.until(`(() => { const w = __G.specials.world.find((w) => w.kind === 'return' && w.owner && w.owner.name === 'Hosty' && !w.done); return !!w && w.icon === 'zipcaster' && __inkwave.hud.jumps.state().map.some((x) => x.kind === 'return' && x.name === 'Hosty'); })()`, 5000).catch(() => false);
  R('A starts Zipline: B\'s screen shows its return mark (the Zipline icon) with A\'s name', !!zOk, { ok: zOk });
  await wait(600);
  await A.js(`(() => { __G.specials.end(__G.match.local, 'time'); return 1; })()`);
  const tEnd = Date.now();
  const zGone = await B.until(`!__G.specials.world.some((w) => w.kind === 'return' && w.owner && w.owner.name === 'Hosty' && !w.done) && !__inkwave.hud.jumps.state().map.some((x) => x.name === 'Hosty')`, 4000).then(() => Date.now() - tEnd).catch(() => null);
  const aSj = await A.js(`!!__G.match.local.superJumpState`);
  R('…A\'s Zipline ends on the spot (no jump home): the mark goes on B\'s screen within 1.5 s, not stuck', !aSj && zGone != null && zGone < 1500, { aJumped: aSj, goneAfterMs: zGone });
  const errs = clients.flatMap((c) => c.log.filter((l) => /error|TypeError|ReferenceError/i.test(l)));
  R('no console errors', !errs.length, errs.slice(0, 5));

  // ------------------------------------------------------------------------------------------------ scene=tower
  async function towerScene() {
    const hasT = await J(A, `!!__G.match.tower`) && await J(B, `!!__G.match.tower`);
    R('Tower Command is up with its tower (both screens)', hasT, { map: MAP });
    if (!hasT) return;
    // B steps onto the deck (its own screen carries it from there: the tower moves under one team's riders); A waits at
    // its pad, a long jump away
    await B.js(`(() => { const me = __G.match.local, T = __G.match.tower; me.pos.set(T.pos.x + 0.6, T.top + 0.05, T.pos.z + 0.6); me.vel.set(0, 0, 0); me.netTp = (me.netTp || 0) + 1; return 1; })()`);
    await A.js(`(() => { const me = __G.match.local, p = __G.level.spawnPads[me.team]; me.pos.set(p.x, p.y + 0.05, p.z); me.vel.set(0, 0, 0); me.netTp = (me.netTp || 0) + 1; return 1; })()`);
    const mv = await A.until(`__G.match.tower.moving !== 0 && __G.match.tower.riderList.some((a) => a.name === 'Guesty')`, 10000, 100).then(() => true, () => false);
    await B.until(`__G.match.tower.riderList.includes(__G.match.local)`, 5000, 100).catch(() => null);
    R('B rides the tower and it moves', mv, { moving: await J(A, `__G.match.tower.moving`) });
    if (!mv) return;
    await rec(A, true); await rec(B, true);
    const ok = await A.js(`(() => { const m = __G.match, him = m.actors.find((a) => a.name === 'Guesty'); return m.local.superJump(him); })()`);
    await B.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 9000).catch(() => null);
    await A.until(`window.__ju.land.some((l) => l.who === 'Hosty')`, 3000).catch(() => null);
    await wait(300);
    await rec(A, false); await rec(B, false);
    const LA = await log(A), LB = await log(B);
    // on each screen: the mark's spot through the flight, and where A came down there
    const ride = (L) => { const land = landOf(L, 'Hosty'); const fl = L.f.map((f) => f.mk.find((x) => x[0] === 'jump' && x[1] === 'Hosty' && x[6] === 'flight')).filter(Boolean);
      if (!land || fl.length < 5) return { land: land && land.p.map(r2), n: fl.length };
      const a = fl[0], z = fl[fl.length - 1];
      return { n: fl.length, rode: r2(Math.hypot(z[2] - a[2], z[4] - a[4])), miss: r2(Math.hypot(z[2] - land.p[0], z[4] - land.p[2])), missFirst: r2(Math.hypot(a[2] - land.p[0], a[4] - land.p[2])) }; };
    const rA = ride(LA), rB = ride(LB);
    const okR = (r) => r.n >= 5 && r.rode > 0.8 && r.miss < 0.8;
    R('A jumps to B on the moving tower: on both screens the landing mark rides the deck through the flight and A comes down where it ended (B\'s screen: from its own tower)', ok && okR(rA) && okR(rB), { owner: rA, other: rB });
    const al = LB.f.filter((f) => f.al.some((x) => x[0] === 'Hosty')).length;
    R('…and B, on the tower, got the alert', al > 10, { frames: al });
    const errs = clients.flatMap((c) => c.log.filter((l) => /error|TypeError|ReferenceError/i.test(l)));
    R('no console errors', !errs.length, errs.slice(0, 5));
  }
};
