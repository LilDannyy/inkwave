// [b5-sub-dash] pictures of the Dash Pellet, for tools/botlab/hud-shots.cjs:
//   MAP=testbox PLAY=1 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-dash/scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   tip        the first-time tip ("Tap RMB or E to dash …") over normal play, the sub badge with the pellet
//   held       the pellet in a kid's hand (a close look at the model)
//   dash       mid ground dash, seen from the side: the forward roll, the speed ribbon, the pop left at the take-off point
//              (a foe standing there takes it)
//   effect     after it: the blast's ink where it took off and the thin streak along the way
//   air        an air dash off a jump: flat, never up
//   cantuse    a second press in the air: "CAN'T USE · Air dash used", the badge greyed with its AIR pip
//   picker     the loadout's sub picker on the Dash Pellet tile (its blurb, 55 %)
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, me = m.local, G = window.__G;
  const THREE = await import('three'); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const K = SUB_KITS.dash;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const W = new Map();
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent, w = W.get(a) || {}; it.move.set(w.move ? w.move[0] : 0, 0, w.move ? w.move[1] : 0); it.fire = !!w.fire; it.squid = false; it.jump = !!w.jump; it.special = false; it.sub = !!w.sub; };
  g.debug.freeze();
  const foe = m.actors.find((a) => a.team !== me.team);
  // the staging spot: the middle of testbox's open deck (or any stage's centre node)
  const L = G.level, S = L.bounds && L.bounds.maxX === 28 ? { x: 0, y: 0, z: -10 } : G.nav.nodes[G.nav.nearest(V(0, 0, 0), 30)];
  const park = () => m.actors.forEach((a, i) => { if (a !== me && a !== foe) { a.spawnAt(V(S.x - 30 + i, S.y + 0.02, S.z - 30), 0); } });
  const put = (a, x, z, yaw) => { a.spawnAt(V(x, S.y + 0.02, z), yaw); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.invuln = 0; a.vel.set(0, 0, 0); };
  const cam = (from, look) => { g.rig.cinematic(from, from, look, look, 1e6); };
  const follow = () => { g.rig.follow(me, true); };
  me.setSub('dash');
  window.__hudScenes = [
    { name: 'tip', wait: 500, set: async () => {
      park(); put(me, S.x, S.z, 0.4); put(foe, S.x + 30, S.z + 30, 0); g.hud?.setVisible?.(true); follow(); g.rig.yaw = 0.4 + Math.PI; g.rig.pitch = 0.12;
      W.set(me, {}); step(20);
      return { prompt: g.hud.promptEl.textContent };
    } },
    { name: 'held', wait: 200, set: async () => {
      g.hud?.setVisible?.(false);
      put(me, S.x, S.z, 0.9); K.onPress = false;   // (for the picture: the pellet held up as a thrown sub is; onPress back next scene)
      W.set(me, { sub: true }); step(24);
      const f = V(Math.sin(0.9), 0, Math.cos(0.9)), l = V(Math.cos(0.9), 0, -Math.sin(0.9));
      const head = V(me.pos.x, me.pos.y + 1.15, me.pos.z);
      const hand = new THREE.Vector3(); me.character.bomb?.group.getWorldPosition(hand);
      cam(hand.clone().addScaledVector(f, 1.15).addScaledVector(l, 0.55).setY(hand.y + 0.05), hand.clone().addScaledVector(l, -0.2).setY(hand.y - 0.12));
      step(1);
      return { aiming: me.weaponRunner.aimingSub, prop: me.character.bomb?.kind, on: !!me.character.bomb?.group.visible };
    } },
    { name: 'model', wait: 200, set: async () => {
      W.set(me, {}); step(2); K.onPress = true;
      const { getSubDef } = await import('./src/game/character-weapons.js'), { getPlasticMaterial, getInkMaterial } = await import('./src/game/character-mats.js');
      const d = getSubDef('dash'), grp = window.__pellet = new THREE.Group();
      for (const [k, side] of [[0, 1], [1, -1]]) {
        const p = new THREE.Group(); p.add(new THREE.Mesh(d.body, getPlasticMaterial()), new THREE.Mesh(d.ink, getInkMaterial(G.teamColors[me.team])));
        p.scale.setScalar(13); p.position.set(side * 0.75, 0, 0); p.rotation.y = side > 0 ? -0.55 : Math.PI - 0.75; p.rotation.x = side > 0 ? 0 : -0.25; grp.add(p);
      }
      grp.position.set(S.x + 6, S.y + 0.6, S.z + 6); G.scene.add(grp);
      put(me, S.x + 20, S.z + 20, 0);
      cam(V(S.x + 6, S.y + 1.75, S.z + 8.6), V(S.x + 6, S.y + 1.05, S.z + 6));
      step(1);
      return { body: d.body.attributes.position.count, ink: d.ink.attributes.position.count };
    } },
    { name: 'dash', wait: 120, set: async () => {
      if (window.__pellet) { G.scene.remove(window.__pellet); window.__pellet = null; }
      W.set(me, {}); step(2); K.onPress = true; step(2);
      g.hud?.setVisible?.(false);
      put(me, S.x - 2.2, S.z, Math.PI / 2); put(foe, S.x - 2.75, S.z + 0.15, Math.PI / 2); foe.hp = 100; me.ink = 100;
      step(3);
      cam(V(S.x - 0.6, S.y + 1.5, S.z + 5.2), V(S.x - 0.6, S.y + 0.75, S.z));
      W.set(me, { sub: true, move: [1, 0] }); step(1); W.set(me, {}); step(6);
      return { dashT: +me.weaponRunner.dashT.toFixed(3), foeHp: Math.round(foe.hp), x: +(me.pos.x - S.x).toFixed(2) };
    } },
    { name: 'effect', wait: 120, set: async () => {
      step(40);
      cam(V(S.x + 4.6, S.y + 3.6, S.z + 2.6), V(S.x - 0.6, S.y, S.z));
      step(1);
      return { at: +(me.pos.x - S.x).toFixed(2) };
    } },
    { name: 'air', wait: 120, set: async () => {
      put(me, S.x - 1.5, S.z - 3, Math.PI / 2); me.ink = 100; step(3);
      cam(V(S.x + 0.3, S.y + 2.3, S.z + 4.6), V(S.x + 0.3, S.y + 1.2, S.z - 3));
      W.set(me, { jump: true }); step(2); W.set(me, {}); step(8);
      W.set(me, { sub: true, move: [1, 0] }); step(1); W.set(me, {}); step(7);
      return { y: +(me.pos.y - S.y).toFixed(2), dashT: +me.weaponRunner.dashT.toFixed(3) };
    } },
    { name: 'cantuse', wait: 160, set: async () => {
      step(10); g.hud?.setVisible?.(true);
      follow(); g.rig.yaw = Math.PI / 2 + Math.PI; g.rig.pitch = 0.05;
      put(me, S.x - 3, S.z + 3, Math.PI / 2); me.ink = 100; me.pos.y += 3.2; me.grounded = false; step(2);
      W.set(me, { sub: true, move: [1, 0] }); step(1); W.set(me, {}); step(15);
      if (g.hud) g.hud._denyT = -1e9;
      W.set(me, { sub: true }); step(1); W.set(me, {}); step(3);
      return { why: g.hud?.denyWhy?.textContent, pip: g.hud?.subBadge?.classList.contains('is-airspent') };
    } },
    { name: 'picker', wait: 400, set: async () => {
      g.hud?.setVisible?.(false); M.setInputMode('kbm');
      if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      key('Enter'); await wait(900);
      M._setFocus(document.querySelector('[data-id="kp-sub-dash"]'), { snap: true }); await wait(700);
      return { detail: document.querySelector('.iw-kpick__dname')?.textContent, blurb: document.querySelector('.iw-kpick__dblurb, .iw-kpick__blurb')?.textContent?.slice(0, 90) };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
