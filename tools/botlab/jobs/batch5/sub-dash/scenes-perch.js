// [b5-sub-dash] Kelpline's perches reached ON FOOT, no dash (the dash-reach audit's finding, for the lead and the user):
//   MAP=kelpline PLAY=1 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/sub-dash/scenes-perch.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   boom-foot    a plain running hop off a 2.6 m container top lands on a reach stacker's boom (perch block 517)
//   boom-up      then a walk up the boom's 0.3 m steps (a stair of perch blocks) to its top
//   spreader     a plain running hop off a 5.2 m container stack lands on a straddle carrier's spreader (perch block 617)
// The kid has the Splattershot and its usual sub (no Dash Pellet): every move is the actor's own walk and jump.
(async () => {
  const g = window.__inkwave, m = g.match, me = m.local, G = window.__G, L = G.level;
  const THREE = await import('three'); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const W = new Map();
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent, w = W.get(a) || {}; it.move.set(w.move ? w.move[0] : 0, 0, w.move ? w.move[1] : 0); it.fire = false; it.squid = false; it.jump = !!w.jump; it.special = false; it.sub = false; };
  g.debug.freeze();
  g.hud?.setVisible?.(false);
  me.setSub('bomb'); me.setWeapon('shooter');
  m.actors.forEach((a, i) => { if (a !== me) a.spawnAt(V(40 + i, 0.02, 60), 0); });
  const put = (p, yaw) => { me.spawnAt(V(p[0], p[1] + 0.02, p[2]), yaw); me.yaw = me.aimYaw = yaw; me.aimPitch = 0; me.invuln = 99; me.vel.set(0, 0, 0); W.set(me, {}); step(3); };
  const under = () => { const b = me.grounded && me.ground ? L.blocks[me.ground.block] : null; return b ? { block: b.id, perch: !!b.perch, roof: !!b.roof, top: +(b.aabbMax.y).toFixed(2) } : null; };
  // a running start along d, the jump pressed, the stick held until it lands
  const hop = (from, d) => {
    put(from, Math.atan2(d[0], d[1]));
    me.vel.set(d[0] * 6, 0, d[1] * 6);
    let air = false;
    for (let i = 0; i < 120; i++) { W.set(me, { move: d, jump: i < 2 }); step(1); if (!me.grounded) air = true; else if (air) break; }
    W.set(me, {}); step(20);
    return { from, to: [+me.pos.x.toFixed(2), +me.pos.y.toFixed(2), +me.pos.z.toFixed(2)], on: under() };
  };
  // a camera beside the kid, square to d, on the side with a clear view (else higher up)
  const side = (d, dist = 6.5, up = 2.4) => {
    const c = V(me.pos.x, me.pos.y + 1.0, me.pos.z), px = -d[1], pz = d[0];
    for (const [s, u] of [[1, up], [-1, up], [1, up + 4], [-1, up + 4]]) {
      const from = V(c.x + px * s * dist - d[0] * 2.5, c.y + u, c.z + pz * s * dist - d[1] * 2.5);
      if (G.physics.los(from, c)) { g.rig.cinematic(from, from, c.clone().addScaledVector(V(d[0], 0, d[1]), 1.2), c.clone().addScaledVector(V(d[0], 0, d[1]), 1.2), 1e6); return [s, u]; }
    }
    const from = V(c.x, c.y + 9, c.z + 4); g.rig.cinematic(from, from, c, c, 1e6); return 'above';
  };
  window.__hudScenes = [
    { name: 'boom-foot', wait: 200, set: async () => {
      const r = hop([-14.5, 2.6, -9.5], [1, 0]);
      const cam = side([1, 0]); step(1);
      return { ...r, cam };
    } },
    { name: 'boom-up', wait: 200, set: async () => {
      // up the boom: toward the highest of its perch blocks (517–559: the walk-connected piece the foot belongs to, as the
      // audit's probe found it), over its 0.3 m steps
      const boom = L.blocks.filter((b) => b.perch && b.id >= 517 && b.id <= 559);
      const hi = boom.reduce((a, b) => (b.aabbMax.y > a.aabbMax.y ? b : a));
      let dx = hi.center.x - me.pos.x, dz = hi.center.z - me.pos.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      let top = me.pos.y;
      for (let i = 0; i < 600; i++) {
        const tx = hi.center.x - me.pos.x, tz = hi.center.z - me.pos.z, tl = Math.hypot(tx, tz);
        if (tl < 0.3) break;
        W.set(me, { move: [tx / tl, tz / tl] }); step(1); top = Math.max(top, me.pos.y);
      }
      W.set(me, {}); step(20);
      const to = [+me.pos.x.toFixed(2), +me.pos.y.toFixed(2), +me.pos.z.toFixed(2)], on = under(), cam = side([dx, dz], 7.5, 1.6); step(1);
      return { to, highest: +top.toFixed(2), on, boomTop: +hi.aabbMax.y.toFixed(2), cam, visible: !!me.character.root.visible };
    } },
    { name: 'spreader', wait: 200, set: async () => {
      const d = [-0.38, 0.92], l = Math.hypot(d[0], d[1]);
      const r = hop([-29.5, 5.2, -16.5], [d[0] / l, d[1] / l]);
      const c = V(me.pos.x, me.pos.y + 0.9, me.pos.z), from = V(c.x + 4.5, c.y + 2.2, c.z + 5.5);
      g.rig.cinematic(from, from, c, c, 1e6); step(1);
      return { ...r, cam: [+from.x.toFixed(1), +from.y.toFixed(1), +from.z.toFixed(1)], clear: G.physics.los(from, c), visible: !!me.character.root.visible };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
