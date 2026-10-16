// [karp-face] Bazookarp's finished face, in pictures (hud-shots.cjs), on any stage with a Bazookarp layout:
//   MAP=halyard MODE=bazookarp TIME=day PLAY=2 URLQ=wipmodes SCENES=tools/botlab/scenes/karp-face.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   PRE_ARGS='only=hud-start,hud-carry' (a comma list of scene names) runs a part
// The HUD states (hud-*), the looks (look-*), the maps (map-*), the menus (menu-*). Each scene stages the state with the
// engine's own calls (a grant, a burst, a plant …) on the frozen clock and frames it with the follow camera or a fixed one.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, Kp = m.karp;
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ONLY = (/only=([\w,-]+)/.exec(window.__preArgs || '') || [])[1];
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const zero = (a) => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.jump = a.intent.special = a.intent.squid = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  for (const a of m.actors) { if (!a.alive) a.respawn(); zero(a); }
  const me = m.local, A = m.actors.filter((a) => a.team === 0 && a !== me), B = m.actors.filter((a) => a.team === 1);
  const P = Kp.R.pond, W0 = Kp.weirs[0][0], G0 = Kp.gates[0], dz = Math.sign(G0.pos.z) || 1;
  // the nav node nearest (x, z) with its floor near y: somewhere a kid can stand
  const spot = (x, z, y = null) => { let best = null, bd = Infinity; for (const id of G.nav.validIds) { const n = G.nav.nodes[id]; if (n.zone >= 0) continue; const d = Math.hypot(n.x - x, n.z - z) + (y == null ? 0 : Math.abs(n.y - y) * 0.6); if (d < bd) { bd = d; best = n; } } return best ? V(best.x, best.y, best.z) : V(x, y ?? 0, z); };
  // [karp-face] a spot near (x, z) whose follow camera (behind it along yaw, up 2.4 m) sees the kid's head clearly: HUD
  // pictures with the camera inside a wall are no use
  const clearSpot = (x, z, y = null, yaw = 0, R = 9) => {
    const bx = -Math.sin(yaw), bz = -Math.cos(yaw); let best = null, bd = Infinity;
    for (const id of G.nav.validIds) { const n = G.nav.nodes[id]; if (n.zone >= 0) continue;
      const d = Math.hypot(n.x - x, n.z - z) + (y == null ? 0 : Math.abs(n.y - y) * 0.6); if (d > R || d >= bd) continue;
      const head = V(n.x, n.y + 1.4, n.z);
      let ok = true; for (const k of [3.2, 4.6]) if (!G.physics.los(V(n.x + bx * k, n.y + 2.4, n.z + bz * k), head)) { ok = false; break; }
      if (ok) for (const sd of [-1.2, 1.2]) if (!G.physics.los(V(n.x + bx * 4.6 - bz * sd, n.y + 2.4, n.z + bz * 4.6 + bx * sd), head)) { ok = false; break; }
      if (ok) { bd = d; best = n; } }
    return best ? V(best.x, best.y, best.z) : spot(x, z, y);
  };
  const put = (a, p, yaw = 0) => { if (!a.alive) a.respawn(); a.pos.copy(p); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.invuln = 0; a.hp = 100; a.form = 'kid'; a.submerged = false; zero(a); };
  const park = () => m.actors.forEach((a, i) => { const p = G.level.spawnPads[a.team]; put(a, V(p.x + ((i % 4) - 1.5) * 1.6, p.y, p.z + (a.team ? 2 : -2) * (p.z > 0 ? 1 : -1)), a.team ? Math.PI : 0); });
  const yawTo = (a, p) => Math.atan2(p.x - a.pos.x, p.z - a.pos.z);
  const fov0 = g.settings.fov;
  // a camera spot round `look` with a clear view of it: dist m out, h m up, the direction nearest yaw0 that sees it
  const camAt = (look, dist, h, yaw0 = 0) => {
    let best = null, bs = -Infinity;
    for (let k = 0; k < 24; k++) {
      const a = yaw0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 12), p = V(look.x + Math.sin(a) * dist, look.y + h, look.z + Math.cos(a) * dist);
      let seen = 0; for (const o of [[0, 0, 0], [0, 0.8, 0], [0.6, 0.3, 0], [-0.6, 0.3, 0]]) if (G.physics.los(p, V(look.x + o[0], look.y + o[1], look.z + o[2]))) seen++;
      const sc = seen * 10 - k * 0.5; if (sc > bs) { bs = sc; best = p; }
    }
    return best;
  };
  const cine = (from, look, fov = 58) => { g.settings.fov = fov; g.rig.cinematic(from, from, look, look, 99, () => {}); for (let i = 0; i < 2; i++) dbg.step(1000 / 6000); };
  const follow = (a = me) => { g.settings.fov = fov0; g.rig.follow(a, true); g.rig.yaw = a.yaw; g.rig.pitch = -0.2; dbg.step(1000 / 60); if (g.rig.blend) g.rig.blend.active = false; g.rig.follow(a, true); };
  const calm = () => { if (g.hud.zcalls) [...g.hud.zcalls.children].forEach((el) => el.remove()); if (g.hud.karp) g.hud.karp._sayT = -1e9; g.hud.bannerLayer?.querySelectorAll('.iw-bn').forEach((b) => b.remove()); };   // (and the big banners: an OVERTIME! left over from the scene before)
  const reset = () => {
    m.local = me; window.__tab = false;
    for (const a of m.actors) if (a.carry) Kp._release(a);
    Kp.holder = null; Kp.holderTeam = -1; Kp.winner = null; Kp.overtime = false; Kp.otWin = { left: 10, open: false, closeT: null, grace: 0 };
    Kp.lowered = [false, false]; Kp.gateUp = [false, false]; Kp.count = [100, 100]; Kp.lastCarrier = null; Kp.lastPlant = null;
    if (g.karpFx) { for (const w of g.karpFx.weirs || []) w.low = -1; for (const q of g.karpFx.gates || []) q.up = -1; }
    G.karpGun.clear(); G.projectiles.clear(); G.subs.clear(); G.specials.clear(); G.paint.clear();
    Kp.pos.copy(P); Kp.restNode = -1; Kp.shell.form(P, 1000, 0); Kp._setPhase('shielded'); Kp.shell.m = 0;
    park(); calm();
  };
  const grab = (a) => { Kp.shell.clear(); Kp.pos.copy(a.pos); Kp._setPhase('free', 0); Kp.claims.length = 0; Kp._applyGrant(a); };
  const paintAround = (team, c, r, n = 10) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; G.paint.splat(V(c.x + Math.cos(a) * r * 0.6, c.y + 0.3, c.z + Math.sin(a) * r * 0.6), r * 0.55, team, { seed: k + 3 }); } G.paint.splat(V(c.x, c.y + 0.3, c.z), r * 0.6, team, { seed: 1 }); };
  // the TAB map: the HUD's big map for one scene
  if (!g.hud._karpTabHook) { const u = g.hud.update.bind(g.hud); g.hud.update = (dt, f) => { if (window.__tab && f && f.map) f.map.expanded = true; return u(dt, f); }; g.hud._karpTabHook = true; }
  const S = [];
  const add = (name, set, moment, wait = 90) => { if (ONLY && !ONLY.split(',').includes(name)) return; S.push({ name, set: async () => { g.hud.setVisible?.(!name.startsWith('look-')); if (name !== 'map-tab') window.__tab = false; await set(); return { phase: Kp.phase, meter: Math.round(Kp.shell.meter), count: Kp.count, holder: Kp.holder?.name, hud: g.hud.karp?.state() }; }, moment, wait }); };
  const side = (p, k) => V(p.x, p.y, p.z - dz * k);   // k m back toward Alpha's side

  // ================================================================ the HUD
  add('hud-start', async () => {
    reset(); m.time = 296;
    put(me, spot(P.x + 1.2, P.z - dz * 6.5, P.y), dz > 0 ? 0 : Math.PI); A.forEach((a, i) => put(a, spot(P.x + (i - 1) * 3, P.z - dz * 9, P.y), dz > 0 ? 0 : Math.PI));
    B.forEach((b, i) => put(b, spot(P.x + (i - 1.5) * 3, P.z + dz * 9, P.y), dz > 0 ? Math.PI : 0));
    Kp.clock = 1.5; step(0.2); follow();
    g.hud.karp._say('BURST THE ROE SHELL!', { sub: 'Then carry the Bazookarp to their Dragon Gate', icon: (await import('./src/ui/hud-karp.js')).KARP_GLYPH });
  });
  add('hud-shell', () => {
    reset(); m.time = 281;
    put(me, spot(P.x - 0.8, P.z - dz * 5.5, P.y), 0); me.yaw = me.aimYaw = yawTo(me, P);
    A.forEach((a, i) => { put(a, spot(P.x + (i - 1) * 3.5, P.z - dz * 6, P.y)); a.yaw = yawTo(a, P); });
    B.forEach((b, i) => { put(b, spot(P.x + (i - 1.5) * 3, P.z + dz * 7, P.y)); b.yaw = yawTo(b, P); });
    paintAround(0, side(P, 4), 3); paintAround(1, side(P, -4), 3);
    Kp.clock = 19; Kp.shell.m = 0.66 * Kp.shell.hp; Kp.shell.quiet = 0; Kp.shell.flashK = 0.6; step(0.1); follow(); g.rig.pitch = 0.05; step(1 / 60); calm();
  });
  // ([karp-face] review round 1: the burst happens in set() and the frame is taken 0.15 s of sim later — as a moment()
  // the 1080 picture caught the frame before it; the WIPEOUT! of the four splatted and our SHELL BURST! both live)
  add('hud-burst', () => {
    reset(); m.time = 274;
    put(me, spot(P.x - 0.6, P.z - dz * 6, P.y), 0); me.yaw = me.aimYaw = yawTo(me, P);
    B.forEach((b, i) => put(b, spot(P.x + (i - 1.5) * 2.2, P.z + dz * 3, P.y)));
    Kp.clock = 25; step(0.05); follow(); calm();
    Kp.shell.add(0, 5000, me); for (let i = 0; i < 9; i++) dbg.step(1000 / 60);
  }, null, 350);
  add('hud-free', () => {
    reset(); m.time = 270;
    Kp.shell.clear(); Kp._setPhase('free', 0);
    put(me, spot(P.x - 1, P.z - dz * 5, P.y), 0); me.yaw = me.aimYaw = yawTo(me, P);
    Kp.clock = 30; step(0.1); follow(); calm();
  });
  add('hud-carry', () => {
    reset(); m.time = 262;
    put(me, clearSpot(P.x, P.z + dz * 13, null, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); grab(me); step(0.1);
    Kp.fuse = 42.4; Kp.hud.fuseShown = 42.4; Kp.count[0] = 88;
    me.aimPitch = 0.1; me.intent.fire = true; step(1.0); calm(); follow(); step(1 / 60);
  });
  add('hud-retreat', () => {
    reset(); m.time = 241;
    put(me, spot(P.x, P.z - dz * 2, P.y), dz > 0 ? Math.PI : 0); grab(me); step(0.1);
    me.intent.move.set(0, 0, -dz); step(2.6); zero(me); step(0.1);
    Kp.fuse = Kp.hud.fuseShown = 31.6; calm(); follow(); step(1 / 60);
  });
  add('hud-zone', () => {
    reset(); m.time = 233;
    const z = Kp.R.zones[0][0], cx = z.poly.reduce((a, q) => a + q[0], 0) / z.poly.length, cz = z.poly.reduce((a, q) => a + q[1], 0) / z.poly.length;
    put(me, spot(P.x, P.z, P.y)); grab(me); step(0.1);
    put(me, spot(cx, cz, z.y0), dz > 0 ? Math.PI : 0); me.carry.j.mark = NaN; step(0.3);
    Kp.fuse = Kp.hud.fuseShown = 24.2; calm(); follow(); step(1 / 60);
  });
  add('hud-foe', () => {
    reset(); m.time = 220;
    const b = B[0]; put(b, spot(P.x + 0.5, P.z - dz * 5, P.y), dz > 0 ? Math.PI : 0); grab(b); step(0.1);
    put(me, clearSpot(P.x - 0.5, P.z - dz * 13, P.y, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); me.yaw = me.aimYaw = yawTo(me, b.pos);
    Kp.fuse = 47.3; Kp.count[1] = 93; step(0.1); calm(); follow();
  });
  add('hud-foe-pin', () => {
    reset(); m.time = 214;
    const b = B[0]; put(b, spot(P.x + 3, P.z - dz * 8, P.y)); grab(b); step(0.1);
    put(me, clearSpot(P.x, P.z + dz * 13, null, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI);
    Kp.fuse = 8.6; Kp.count[1] = 74; step(0.1); calm(); follow();
  });
  add('hud-ally', () => {
    reset(); m.time = 205;
    const a = A[0]; put(a, spot(P.x + 1.5, P.z + dz * 9, P.y), dz > 0 ? 0 : Math.PI); grab(a); step(0.1);
    put(me, clearSpot(P.x - 1, P.z + dz * 1, P.y, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); me.yaw = me.aimYaw = yawTo(me, a.pos);
    Kp.fuse = 51.2; Kp.count[0] = 78; step(0.1); calm(); follow();
  });
  add('hud-weir', () => {
    reset(); m.time = 186;
    const w = W0.pos;
    put(me, spot(w.x - Math.sin(W0.yaw) * 3.5, w.z - Math.cos(W0.yaw) * 3.5, w.y)); grab(me); step(0.1);
    me.yaw = me.aimYaw = yawTo(me, w); Kp.fuse = 33;
    me.intent.move.set(0, 0, 1);
    for (let i = 0; i < 240 && !Kp.lowered[0]; i++) dbg.step(1000 / 60);
    zero(me); step(0.35);
    put(me, spot(w.x - Math.sin(W0.yaw) * 5, w.z - Math.cos(W0.yaw) * 5, w.y)); me.yaw = me.aimYaw = yawTo(me, w); follow();
  });
  add('hud-gate', () => {
    reset(); m.time = 140;
    Kp.lowered[0] = true; Kp.gateUp[0] = true; Kp.count[0] = 44; step(1.6);
    const gp = G0.pos;
    put(me, clearSpot(gp.x, gp.z - dz * 9, gp.y, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); grab(me); step(0.1); me.yaw = me.aimYaw = yawTo(me, gp);
    Kp.count[0] = 12; Kp.fuse = Kp.hud.fuseShown = 19.4; calm(); follow(); step(1 / 60);
  });
  add('hud-ot', async () => {
    reset(); m.time = 0.05;
    Kp.count = [41, 63]; Kp.reachT = [120, 90]; Kp.touched = true; Kp.lastCarrier = { team: 0, how: 'splat', left: 6 };
    put(me, clearSpot(P.x - 1, P.z + dz * 9, null, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI);
    B.forEach((b, i) => put(b, spot(P.x + (i - 1.5) * 3, P.z + dz * 7, P.y)));
    step(0.05); step(3.2); follow(); calm();
    g.hud.karp._say('OVERTIME!', { team: 0, sub: 'Stop them — 10 s to hold!', icon: (await import('./src/ui/hud-karp.js')).KARP_GLYPH });
  });
  add('hud-fuse-low', () => {
    reset(); m.time = 120;
    put(me, clearSpot(P.x, P.z + dz * 12, P.y, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); grab(me); step(0.1);
    A.forEach((a, i) => put(a, spot(me.pos.x + (i - 1) * 2.4, me.pos.z - dz * 2.5, me.pos.y)));
    Kp.fuse = Kp.hud.fuseShown = 2.4; step(0.1); calm(); follow(); step(1 / 60);
  });
  add('hud-sunset-carry', () => {   // (the same HUD, the stage's evening light: set by the run's TIME)
    reset(); m.time = 150;
    put(me, clearSpot(P.x + 1, P.z + dz * 10, P.y, dz > 0 ? 0 : Math.PI), dz > 0 ? 0 : Math.PI); grab(me); step(0.1);
    Kp.fuse = Kp.hud.fuseShown = 28; Kp.count[0] = 71; me.aimPitch = 0.15; me.intent.fire = true; step(0.7); calm(); follow(); step(1 / 60);
  });
  // ================================================================ the maps
  add('map-tab', () => {
    reset(); m.time = 170;
    const a = A[0]; put(a, spot(P.x, P.z + dz * 14, P.y)); grab(a); step(0.1);
    paintAround(0, a.pos, 4); paintAround(1, side(P, -16), 4);
    put(me, spot(P.x - 2, P.z - dz * 4, P.y)); Kp.fuse = 36;
    window.__tab = true; step(0.6); follow();
  });
  add('map-mini', () => {
    window.__tab = false;
    reset(); m.time = 168;
    Kp.shell.m = -0.45 * Kp.shell.hp;
    put(me, spot(P.x - 2, P.z - dz * 6, P.y)); me.yaw = me.aimYaw = yawTo(me, P); step(0.2); follow(); calm();
  });
  // ================================================================ the looks
  add('look-shell-3m', () => {
    reset(); m.time = 290;
    paintAround(0, side(P, 3.5), 2.5); paintAround(1, side(P, -3.5), 2.5);
    Kp.shell.m = 0.7 * Kp.shell.hp; Kp.shell.quiet = 0; step(0.3);
    const c = Kp.shell.center();
    cine(camAt(c, 5.2, 0.9, dz > 0 ? Math.PI * 0.8 : -Math.PI * 0.2), V(c.x, c.y - 0.1, c.z), 55);
  });
  add('look-weir-standing', () => {
    reset();
    const w = W0.pos, f = V(Math.sin(W0.yaw), 0, Math.cos(W0.yaw)), ac = V(Math.cos(W0.yaw), 0, -Math.sin(W0.yaw));
    step(0.4);
    const lk = V(w.x, w.y + 1.3, w.z); cine(camAt(lk, 8, 2.2, Math.atan2(-f.x, -f.z) + 0.4), lk, 58); void ac;
  });
  add('look-weir-down', () => {
    reset();
    Kp.lowered[0] = true; Kp.gateUp[0] = true; step(1.6);
    const w = W0.pos, f = V(Math.sin(W0.yaw), 0, Math.cos(W0.yaw));
    const lk = V(w.x, w.y + 1.3, w.z); cine(camAt(lk, 8, 2.2, Math.atan2(-f.x, -f.z) + 0.4), lk, 58);
  });
  add('look-gate-sealed', () => {
    reset(); step(0.2);
    const gp = G0.pos, f = V(Math.sin(G0.yaw), 0, Math.cos(G0.yaw));
    const lk = V(gp.x, gp.y + 1.8, gp.z); cine(camAt(lk, 9.5, 2.0, Math.atan2(-f.x, -f.z) + 0.3), lk, 58);
  });
  add('look-gate-open', () => {
    reset();
    Kp.lowered[0] = true; Kp.gateUp[0] = true; step(1.8);
    const gp = G0.pos, f = V(Math.sin(G0.yaw), 0, Math.cos(G0.yaw));
    const lk = V(gp.x, gp.y + 3.0, gp.z); cine(camAt(lk, 12, 1.0, Math.atan2(-f.x, -f.z) + 0.3), lk, 60);
  });
  add('look-carrier-front', () => {
    reset();
    put(me, spot(P.x, P.z + dz * 8, P.y), dz > 0 ? 0 : Math.PI); grab(me); step(0.4);
    const fy = me.yaw, F = V(Math.sin(fy), 0, Math.cos(fy)), Rr = V(Math.cos(fy), 0, -Math.sin(fy));
    cine(V(me.pos.x + F.x * 2.6 - Rr.x * 0.9, me.pos.y + 1.55, me.pos.z + F.z * 2.6 - Rr.z * 0.9), V(me.pos.x, me.pos.y + 1.05, me.pos.z), 42);
  });
  add('look-carrier-side', () => {
    const fy = me.yaw, F = V(Math.sin(fy), 0, Math.cos(fy)), Rr = V(Math.cos(fy), 0, -Math.sin(fy));
    me.intent.fire = true; step(1.25);
    cine(V(me.pos.x - Rr.x * 2.9 + F.x * 0.4, me.pos.y + 1.4, me.pos.z - Rr.z * 2.9 + F.z * 0.4), V(me.pos.x + F.x * 0.3, me.pos.y + 1.1, me.pos.z + F.z * 0.3), 42);
  });
  add('look-shot-flight', () => {
    reset();
    put(me, spot(P.x, P.z + dz * 5, P.y), dz > 0 ? 0 : Math.PI); grab(me); step(0.1);
    B.forEach((b, i) => put(b, spot(me.pos.x + (i - 1.5) * 2, me.pos.z + dz * 19, me.pos.y)));
    me.aimPitch = 0.05; const s = G.karpGun._fire(me, 1); step(0.42);
    const Rr = V(Math.cos(me.yaw), 0, -Math.sin(me.yaw));
    cine(V(s.pos.x - Rr.x * 9, s.pos.y + 1.5, s.pos.z - Rr.z * 9 - dz * 2), V(s.pos.x, s.pos.y - 0.6, s.pos.z + dz * 2), 60);
  });
  add('look-shot-swell', () => {
    const s = G.karpGun.shots.find((q) => !q.ghost);
    for (let i = 0; i < 200 && s && !(s.phase === 'swell' && s.swell > 0.3); i++) dbg.step(1000 / 60);
    const L = s ? s.land : me.pos;
    cine(V(L.x + 6.5, L.y + 4.2, L.z - dz * 6), V(L.x, L.y + 0.5, L.z), 58);
  });
  add('look-shot-blast', () => {
    const s = G.karpGun.shots.find((q) => !q.ghost && q.land);
    for (let i = 0; i < 60 && s && s.phase !== 'done'; i++) dbg.step(1000 / 60);
    step(0.12);
    const L = s ? s.land : me.pos;
    cine(V(L.x + 7, L.y + 4.5, L.z - dz * 6.5), V(L.x, L.y + 1.4, L.z), 60);
  });
  add('look-wake', () => {
    reset();
    put(me, spot(P.x + 2, P.z + dz * 8, P.y), dz > 0 ? 0 : Math.PI); grab(me);
    paintAround(0, me.pos, 4, 12); step(0.1);
    me.intent.squid = true; me.intent.move.set(0, 0, 1); step(0.5);
    cine(V(me.pos.x + 3.5, me.pos.y + 4.2, me.pos.z - dz * 3.5), V(me.pos.x, me.pos.y, me.pos.z + dz * 0.8), 55);
  });
  add('look-resting', () => {
    reset(); step(0.5);
    const c = Kp.shell.center();
    cine(camAt(c, 6, 1.2, dz > 0 ? Math.PI * 0.8 : -Math.PI * 0.2), V(c.x, c.y - 0.3, c.z), 50);
  });
  // the carrierBlock shimmer (a stage with one: karpbox) — a carrier pressed against its edge, a teammate walking in
  add('look-carrierblock', () => {
    reset();
    const v = (Kp.R.carrierBlock || [])[0];
    if (!v) return;
    const cx = v.poly.reduce((a, q) => a + q[0], 0) / v.poly.length, cz = v.poly.reduce((a, q) => a + q[1], 0) / v.poly.length;
    const xs = v.poly.map((q) => q[0]), x1 = Math.max(...xs);
    put(me, spot(x1 + 1.2, cz, v.y0 + 0.3), -Math.PI / 2); grab(me); step(0.1);
    me.intent.move.set(-1, 0, 0); step(0.8); zero(me);
    if (A[0]) { put(A[0], spot(cx, cz + 0.8, v.y0 + 0.3)); }
    step(0.2);
    const lk = V(cx + 1, (v.y0 + v.y1) / 2 + 0.8, cz);
    cine(V(lk.x + 6.5, lk.y + 3.2, lk.z - 5.5), lk, 56);
  });
  // ================================================================ the menus (over the match)
  const menu = async (id, prep) => { g.menus.show(null); await new Promise((r) => setTimeout(r, 50)); prep?.(); g.menus.show(id); for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 900)); };
  add('menu-pause', async () => {
    reset(); m.time = 186;
    put(me, spot(P.x, P.z + dz * 8, P.y)); grab(me); step(0.1); Kp.fuse = 37; Kp.count = [62, 81];
    Kp.lowered[1] = true; Kp.gateUp[1] = true; step(0.1);
    await menu('pause');
  }, null, 400);
  add('menu-rules', async () => {
    await menu('howto', () => { g.menus._setSetting?.('lastMode', 'bazookarp'); m.mode = 'bazookarp'; });
  }, null, 400);
  add('menu-mode', async () => { await menu('mode'); }, null, 500);
  add('menu-results', async () => {
    g.menus.show(null);
    const names = m.actors.map((a) => a.name);
    const players = m.actors.map((a, i) => ({ name: a.name, team: a.team, weapon: a.weaponId, turf: 300 + ((i * 97) % 400), splats: (i * 3) % 7, assists: i % 3, deaths: (i * 2) % 5, isSelf: a === me, bot: a !== me, karpM: [42, 18, 0, 7, 25, 0, 11, 3][i % 8], karpPops: [2, 1, 0, 1, 1, 0, 2, 0][i % 8] }));
    g.menus.showResults({ win: true, percents: [46, 41], colors: [G.teamHex[0], G.teamHex[1]], teamNames: g.palette?.names, players,
      xp: { gained: 734, levelBefore: 12, levelAfter: 13, xpBefore: 1700, xpAfter: 434, xpToNextBefore: 2000, xpToNextAfter: 2100, parts: [['WIN BONUS', 300], ['TURF', 142], ['CARRIED', 126], ['SHELL POPS', 120], ['SPLATS', 46]] },
      mapName: g.mapDef?.name, mode: 'bazookarp', karp: { counts: [0, 37], best: [55, 34], len: [55, 55], winner: 0, reason: 'knockout', overtime: false } });
    void names;
    g.menus.show('results'); for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 6500));
  }, null, 600);
  // the stage select in this mode (DECISIONS #10: only stages with a Bazookarp layout; ?wipstages adds the rest, PREVIEW)
  add('menu-setup', async () => {
    g.menus.show(null); g.menus._setup = { mode: 'bazookarp', times: {} };
    g.menus.show('setup'); for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 1200));
  }, null, 500);
  // the online lobby: the offline stand-in hosting a Bazookarp room with two friends in it
  add('menu-lobby', async () => {
    g.menus.show(null);
    const { MockNet } = await import('./src/net/mock.js');
    const mk = new MockNet(); mk._auto = false; mk._lat = 0; mk._fill = 0;
    G.net = mk; await mk.create('Danny');
    const lm = (/lobbymap=(\w+)/.exec(window.__preArgs || '') || [])[1] || 'lockgate';   // (PRE_ARGS lobbymap=kelpline with WIPSTAGES=1: a PREVIEW stage)
    mk.setSettings({ mode: 'bazookarp', map: lm, time: 'day', botCount: -1 });
    try { mk.fill?.(2); } catch (e) { /* */ }
    g.menus.show('lobby'); for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 1500));
  }, null, 600);
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})()
