// [b5-subs] Chain Bobber pictures, for tools/botlab/hud-shots.cjs:
//   MAP=craters PLAY=3 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-bobber/scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   (Craters: the open downs. Halyard has no clear 9 × 21 m patch of floor out of the enemy pad's reach — its quays run
//   beside moored hulls and water — and Tidewater's has a planter in it. PRE_ARGS=hand,held: only those scenes)
//   hand      the local kid holding a Chain Bobber up, seen from the front
//   held      the local kid holding a Chain Bobber up to throw: the arc, the float marker 1.0 m over its landing ring,
//             dashed preview tethers to two of yours and "×3"; the count by the sub badge
//   flight    one in the air, two more floating ahead
//   chain     a 4-chain and a lone one, settled: team ink upper halves, cream lower, the band's lamps (N), the tethers
//   cue       a foe in a teammate's chain's reach: the chain glows and "Shoot to set off" sits on its nearest bobber
//   boom      the chain going off: the first blasts, the spark running down the tethers, "CHAIN ×4" by the crosshair
//   enemy     the other team's chain as you see it (no glow, no hint), its lamps telling you its size
//   lamps     a lone one (one lamp) and a 4-chain (four), 6–10 m off: what the lamps say at play distance
//   cueoff    the cue scene's chain with its foe out of reach: the tethers at their normal brightness (against 'cue')
//   picker    the loadout's sub picker on the Chain Bobber (its tile, name, blurb, 40 %)
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, me = m.local, THREE = await import('three');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const K = SUB_KITS.bobber, G = window.__G, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  let hold = false;
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = a === me && hold; };
  g.debug.freeze();
  const mate = m.actors.find((a) => a !== me && a.team === me.team), foe = m.actors.find((a) => a.team !== me.team);
  // a flat open spot: flat ground from 8 m behind to 10 m ahead and 4.5 m to each side, nothing standing in it (lines
  // across it at knee and float height), facing any of the four ways (T: the facing yaw — yaw 0 looks +z, π/2 +x), far
  // from the enemy pad (no refusals) and off our own terrace
  const L = G.level, N = G.nav.nodes, pads = L.spawnPads, foePad = pads[1 - me.team], myPad = pads[me.team];
  const rot = (x0, z0, T, x, z) => [x0 + x * Math.cos(T) + z * Math.sin(T), z0 - x * Math.sin(T) + z * Math.cos(T)];
  const XS = [-4.5, -3, -1.5, 0, 1.5, 3, 4.5], ZS = [-8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
  const flatN = (x0, y0, z0, T) => {
    let k = 0;
    // (a sample inside a block — a moored hull standing on the quay — is no floor: groundHeight from inside it reads its foot)
    const inside = (x, z) => [0.4, 1.4, 2.4].some((h) => L.pointInside(V(x, y0 + h, z), 0.05));
    for (const dz of [-11, -10, ...ZS]) for (const dx of XS) { const [x, z] = rot(x0, z0, T, dx, dz); k += dz >= -8 && Math.abs(L.groundHeight(x, z, y0 + 1.5) - y0) <= 0.05 && !inside(x, z) ? 1 : inside(x, z) ? -6 : dz >= -8 ? -2 : 0; }
    const ln = (ax, az, bx, bz, h) => { const [x1, z1] = rot(x0, z0, T, ax, az), [x2, z2] = rot(x0, z0, T, bx, bz); const A = V(x1, y0 + h, z1), B = V(x2, y0 + h, z2); return G.physics.los(A, B) && G.physics.los(B, A); };
    // (and the camera's own room: 4.5 m behind the kid and 2–3 m up — a ship's flared hull overhangs a quay up there)
    for (const dz of [-11, -10, ...ZS]) for (const h of [0.5, 1.2, 2.7]) if (!ln(-4.5, dz, 4.5, dz, h)) k -= 6;
    for (const dx of XS) for (const h of [1.0, 2.7]) if (!ln(dx, -11, dx, 10, h)) k -= 6;
    return k;
  };
  const quick = (x0, y0, z0, T) => [[-4.5, -8], [4.5, -8], [-4.5, 10], [4.5, 10], [0, 2]].every(([dx, dz]) => { const [x, z] = rot(x0, z0, T, dx, dz); return Math.abs(L.groundHeight(x, z, y0 + 1.5) - y0) <= 0.05; });
  const okN = (n) => Math.hypot(n.x - foePad.x, n.z - foePad.z) > (L.spawnBarrier ?? 4.2) + 2 + 14 && Math.hypot(n.x - myPad.x, n.z - myPad.z) > 9;
  let P = null, T0 = 0, bk = -1e9, tried = 0;
  for (const n of N) {
    if (!okN(n)) continue;
    for (const T of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      if (!quick(n.x, n.y, n.z, T)) continue;
      tried++;
      const k = flatN(n.x, n.y, n.z, T);
      if (k > bk) { bk = k; P = n; T0 = T; }
    }
    if (bk >= 70) break;
  }
  P = P || N[0];
  const diag = (() => { let fl = 0, ins = 0; for (const dz of ZS) for (const dx of XS) { const [x, z] = rot(P.x, P.z, T0, dx, dz); if (Math.abs(L.groundHeight(x, z, P.y + 1.5) - P.y) <= 0.05) fl++; if ([0.4, 1.4, 2.4].some((h) => L.pointInside(V(x, P.y + h, z), 0.05))) ins++; } return { fl, ins, nodes: N.length }; })();
  const O = V(P.x, P.y, P.z), Y0 = T0, F = 1;
  // scene-local (x across, z ahead) → the world
  const at = (x, z, y = 0) => { const [wx, wz] = rot(O.x, O.z, T0, x, z); return V(wx, O.y + y, wz); };
  const dirOf = (x, y, z) => { const [wx, wz] = rot(0, 0, T0, x, z); return V(wx, y, wz); };
  const put = (a, x, z, yaw = 0) => { const p = at(x, z, 0.02); a.pos.copy(p); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = Y0 + yaw; };
  // (everyone not in a scene stands where they are, off out of it: the bots stand still; only the ones a scene needs move)
  const home = new Map(m.actors.map((a) => [a, a.pos.clone()]));
  const park = () => { for (const a of m.actors) if (a !== me) { const h = home.get(a); if (Math.hypot(h.x - O.x, h.z - O.z) < 22) { a.pos.set(O.x - 40, O.y + 40, O.z); a.vel.set(0, 0, 0); a.invuln = 99; } else { a.pos.copy(h); a.vel.set(0, 0, 0); } if (!a.alive) a.respawn(); } };
  const drop = (owner, x, z) => K.throwFrom(owner, at(x, z, 0.6), V(0, -3, 0));
  const cam = (yaw, pitch) => { g.rig.yaw = Y0 + yaw; g.rig.pitch = pitch; me.aimYaw = me.yaw = Y0 + yaw; me.aimPitch = pitch; };
  const D0 = g.rig.dist;
  const fresh = async () => {
    if (M._modal) { key('Escape'); await wait(400); }
    if (M.current) { M.show(null); await wait(600); }
    g.hud?.setVisible?.(true);
    if (hold) { hold = false; step(30); }   // (a held one is let go — thrown — before the stage is cleared; each scene's
    // drops then settle 100 frames, long enough for the last scene's pop-open mist to fade)
    g.rig.dist = D0; G.subs.clear(); G.projectiles.clear(); park();
    me.setSub('bobber'); me.ink = 100; me.hp = 100;
    put(me, 0, -1.5, 0); g.rig.follow(me, true); cam(0, -0.12); step(10);
  };
  window.__hudScenes = [
    { name: 'hand', wait: 300, set: async () => {
      await fresh();
      // (the kid faces the camera, three-quarters: the bobber held up in its throwing hand)
      // (it faces back down the area, the camera in front of it looking up the open area)
      put(me, 0, 1, Math.PI + 0.5); g.rig.follow(me, true); me.aimPitch = 0.1;
      hold = true; step(20);
      // (a fixed camera 1.7 m in front of it at chest height — the rig's cinematic path held still — framing the kid and its
      // raised hand; fresh() hands the camera back to the follow rig)
      const fw = V(Math.sin(me.yaw), 0, Math.cos(me.yaw)), sd = V(fw.z, 0, -fw.x), k0 = me.pos.clone();
      // (sd: the kid's left — the hand the sub is held up in — the camera off that shoulder)
      const from = k0.clone().addScaledVector(fw, 0.85).addScaledVector(sd, 1.25); from.y += 1.6;
      const look = k0.clone().addScaledVector(sd, 0.18); look.y += 1.38;
      g.rig.cinematic(from, from, look, look, 1e6); step(4);
      g.hud?.setVisible?.(false);   // (the model alone: the crosshair would sit on the hand)
      return { prop: me.character.bomb?.kind, on: !!me.character.bomb?.group?.visible };
    } },
    { name: 'held', wait: 250, set: async () => {
      await fresh();
      // the guide's landing spot first (a lob 5–6 m ahead), then two of yours either side of it, each within 5 m
      cam(0.04, -0.15); step(2);
      const s0 = K.predictSpot(me), c0 = Math.cos(T0), s1 = Math.sin(T0), ddx = s0 ? s0.x - O.x : 0, ddz = s0 ? s0.z - O.z : 4;
      const lx = ddx * c0 - ddz * s1, lz = ddx * s1 + ddz * c0;
      drop(me, lx - 2.6, lz + 1.6); drop(me, lx + 2.4, lz + 2.4); step(100);
      cam(0.04, -0.15); hold = true; step(24);
      return { O: [O.x, O.y, O.z], T0, tried, bk, diag, spot: s0 && [s0.x, s0.z], guide: (await import('./src/game/kits/bobber-hud.js')).BOBBER_HUD.guide, prop: me.character.bomb?.kind };
    } },
    { name: 'flight', wait: 60, set: async () => {
      await fresh();
      drop(me, -1.5, 6); drop(me, 1.5, 6.5); step(100);
      cam(0.0, -0.05);
      K.throwFrom(me, V(me.pos.x, me.pos.y + 1.35, me.pos.z), dirOf(0.4, 5.5, 8)); step(12);
      return { live: K.items.map((x) => x.state) };
    } },
    { name: 'chain', wait: 120, set: async () => {
      await fresh();
      for (const [x, z] of [[-3.9, 4], [-1.3, 5], [1.3, 4.5], [3.9, 5.5]]) drop(me, x, z);
      drop(me, 0, 10.6); step(100);
      put(me, 1.5, 1.0, 0); g.rig.dist = 3.2; g.rig.follow(me, true); cam(0.1, -0.22); step(6);
      return { chains: K.items.map((x) => x.chain?.n) };
    } },
    { name: 'cue', wait: 200, set: async () => {
      await fresh();
      for (const [x, z] of [[-2.6, 5], [0, 5.6], [2.6, 5]]) drop(mate, x, z);
      step(100);
      put(foe, 0.8, 6.4, Math.PI); foe.hp = 100;
      put(me, 0.6, 2, 0); g.rig.follow(me, true); cam(0, -0.14); step(14);
      return { hud: (await import('./src/game/kits/bobber-hud.js')).BOBBER_HUD.hint };
    } },
    { name: 'boom', wait: 40, set: async () => {
      await fresh();
      for (const [x, z] of [[-3.9, 6], [-1.3, 6.5], [1.3, 6], [3.9, 6.5]]) drop(me, x, z);
      step(100);
      put(me, 1.5, -1, 0); g.rig.follow(me, true); cam(0.05, -0.1); step(6);
      return { n: K.items.filter((x) => x.state === 'live').length };
    }, moment: () => { const it = K.items.find((x) => x.state === 'live'); if (it) K.trigger(it, me); step(6); } },
    { name: 'enemy', wait: 160, set: async () => {
      await fresh();
      for (const [x, z] of [[-4.4, 6], [-2.2, 6.6], [0, 6], [2.2, 6.6], [4.4, 6]]) drop(foe, x, z);
      step(100);
      put(me, 1.2, 1.5, 0); g.rig.dist = 3.2; g.rig.follow(me, true); cam(0.06, -0.18); step(6);
      return { n: K.items.map((x) => x.chain?.n) };
    } },
    // (fix round 1) the lamps at play distance: a lone one and a 4-chain, 5.2 m apart (out of linking range), 6–10 m from
    // the camera
    { name: 'lamps', wait: 160, set: async () => {
      await fresh();
      // (the flat patch is 9 m wide: a lone one on the left, a 4-chain running away on the right, 5.2 m apart)
      const groups = [[[-2.6, 7.6]], [[2.6, 7.2], [2.6, 8.6], [2.6, 10.0], [2.6, 11.4]]];
      for (const gp of groups) for (const [x, z] of gp) drop(me, x, z);
      step(100);
      put(me, -0.2, 4.3, 0); g.rig.dist = 3.2; g.rig.follow(me, true); cam(0.05, -0.06); step(6);
      const cp = g.rig.gameCam?.position || me.pos;
      return { n: K.items.map((x) => x.chain?.n), d: K.items.map((x) => Math.round(x.spot.distanceTo(cp) * 10) / 10) };
    } },
    // (fix round 1) the cue's glow, before / after: the same teammate's chain with the foe out of its reach, then in it
    { name: 'cueoff', wait: 200, set: async () => {
      await fresh();
      for (const [x, z] of [[-2.6, 5], [0, 5.6], [2.6, 5]]) drop(mate, x, z);
      step(100);
      put(foe, 0.8, 13.5, Math.PI); foe.hp = 100;
      put(me, 0.6, 2, 0); g.rig.follow(me, true); cam(0, -0.14); step(14);
      return { glow: K.items.some((x) => x.glow) };
    } },
    { name: 'picker', wait: 400, set: async () => {
      hold = false; G.subs.clear();
      g.hud?.setVisible?.(false); M.setInputMode('kbm');
      if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      key('Enter'); await wait(900);
      M._setFocus(document.querySelector('[data-id="kp-sub-bobber"]'), { snap: true }); await wait(700);
      return { detail: document.querySelector('.iw-kpick__dname')?.textContent, blurb: document.querySelector('.iw-kpick__dblurb, .iw-kpick__blurb')?.textContent };
    } },
  ];
  // (PRE_ARGS=name,name: only those scenes)
  const only = String(window.__preArgs || '').split(',').filter(Boolean);
  if (only.length) window.__hudScenes = window.__hudScenes.filter((s) => only.includes(s.name));
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
