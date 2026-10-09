// [b5-subs] Chain Bobber pictures, for tools/botlab/hud-shots.cjs:
//   MAP=halyard PLAY=3 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-bobber/scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   held      the local kid holding a Chain Bobber up to throw: the arc, the float marker 1.0 m over its landing ring,
//             dashed preview tethers to two of yours and "×3"; the count by the sub badge
//   flight    one in the air, two more floating ahead
//   chain     a 4-chain and a lone one, settled: team ink upper halves, cream lower, the band's lamps (N), the tethers
//   cue       a foe in a teammate's chain's reach: the chain glows and "Shoot to set off" sits on its nearest bobber
//   boom      the chain going off: the first blasts, the spark running down the tethers, "CHAIN ×4" by the crosshair
//   enemy     the other team's chain as you see it (no glow, no hint), its lamps telling you its size
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
  // a flat open spot near the middle of the stage
  const L = G.level, N = G.nav.nodes, b = L.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
  const flat = (n) => { for (let r = 1.5; r <= 7; r += 1.5) for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, y = L.groundHeight(n.x + Math.sin(a) * r, n.z + Math.cos(a) * r, n.y + 1.5); if (Math.abs(y - n.y) > 0.05) return false; } return true; };
  const pads = L.spawnPads, far = (n) => pads.every((q) => Math.hypot(n.x - q.x, n.z - q.z) > (L.spawnBarrier || 4) + 10);
  const P = [...N].sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz)).find((n) => far(n) && flat(n)) || N[0];
  const O = V(P.x, P.y, P.z);
  const put = (a, x, z, yaw = 0) => { a.pos.set(O.x + x, O.y + 0.02, O.z + z); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; };
  const park = () => m.actors.forEach((a, i) => { if (a !== me) put(a, -30 + i, 30); });
  const drop = (owner, x, z) => K.throwFrom(owner, V(O.x + x, O.y + 0.6, O.z + z), V(0, -3, 0));
  const cam = (yaw, pitch) => { g.rig.yaw = yaw; g.rig.pitch = pitch; me.aimYaw = me.yaw = yaw; me.aimPitch = pitch; };
  const fresh = async () => {
    if (M._modal) { key('Escape'); await wait(400); }
    if (M.current) { M.show(null); await wait(600); }
    g.hud?.setVisible?.(true);
    hold = false; G.subs.clear(); G.projectiles.clear(); park();
    me.setSub('bobber'); me.ink = 100; me.hp = 100;
    put(me, 0, -6, 0); g.rig.follow(me, true); cam(0, -0.12); step(10);
  };
  window.__hudScenes = [
    { name: 'held', wait: 250, set: async () => {
      await fresh();
      drop(me, -1.2, 3.6); drop(me, 1.6, 4.2); step(40);
      cam(0.05, -0.38); hold = true; step(24);
      return { guide: (await import('./src/game/kits/bobber-hud.js')).BOBBER_HUD.guide, prop: me.character.bomb?.kind };
    } },
    { name: 'flight', wait: 60, set: async () => {
      await fresh();
      drop(me, -1.5, 6); drop(me, 1.5, 6.5); step(40);
      cam(0.0, -0.05);
      K.throwFrom(me, V(me.pos.x, me.pos.y + 1.35, me.pos.z), V(0.4, 5.5, 8)); step(12);
      return { live: K.items.map((x) => x.state) };
    } },
    { name: 'chain', wait: 120, set: async () => {
      await fresh();
      for (const [x, z] of [[-4.5, 4], [-1.5, 5], [1.5, 4.5], [4.5, 5.5]]) drop(me, x, z);
      drop(me, 0, 11.5); step(45);
      put(me, -1, -1.5, 0); g.rig.follow(me, true); cam(0.12, -0.18); step(6);
      return { chains: K.items.map((x) => x.chain?.n) };
    } },
    { name: 'cue', wait: 200, set: async () => {
      await fresh();
      for (const [x, z] of [[-3, 5], [0, 5.6], [3, 5]]) drop(mate, x, z);
      step(45);
      put(foe, 0.8, 6.4, Math.PI); foe.hp = 100;
      put(me, 0, -2.5, 0); g.rig.follow(me, true); cam(0, -0.12); step(14);
      return { hud: (await import('./src/game/kits/bobber-hud.js')).BOBBER_HUD.hint };
    } },
    { name: 'boom', wait: 40, set: async () => {
      await fresh();
      for (const [x, z] of [[-4.5, 6], [-1.5, 6.5], [1.5, 6], [4.5, 6.5]]) drop(me, x, z);
      step(45);
      put(me, 0, -3, 0); g.rig.follow(me, true); cam(0, -0.1); step(6);
      return { n: K.items.filter((x) => x.state === 'live').length };
    }, moment: () => { const it = K.items.find((x) => x.state === 'live'); if (it) K.trigger(it, me); step(6); } },
    { name: 'enemy', wait: 160, set: async () => {
      await fresh();
      for (const [x, z] of [[-3, 6], [0, 6.6], [3, 6], [6, 6.6], [9, 6]]) drop(foe, x, z);
      step(45);
      put(me, 1, -1.5, 0); g.rig.follow(me, true); cam(0.18, -0.14); step(6);
      return { n: K.items.map((x) => x.chain?.n) };
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
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
