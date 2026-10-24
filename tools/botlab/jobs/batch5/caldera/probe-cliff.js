// fix round 9 scratch: the Slump cliff tops — faces' paint, part d's filter, and Mitts leaps (the kit's predictor, then
// flown) from every dry nav node within 16 m that land on them; also from a cling on the cliff face (leap off the wall)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { MITTS } = await import('./src/game/kits/mitts.js');
  const { Hit } = await import('./src/game/physics.js');
  const W = __G.lavaWorld, Lv = g.match?.lava, dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, K = C.LAVA.kill, dt = 1 / 60;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent;
  const phys = __G.physics, DOWN = V(0, -1, 0), O3 = V(0, 0, 0), H3 = new Hit();
  const hitBlock = (x, z, y) => { const h = phys.raycast(O3.set(x, y, z), DOWN, 3, H3); return h.hit ? { y: H3.point.y, block: H3.block } : null; };
  const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
  const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
  const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
  Lv.debugT(50);
  const cliff = lvl.blocks.filter((b) => b && b.tag === 'caldera-wall' && topOf(b) > 7 && Math.hypot(b.center.x, b.center.z) < 36 && Math.abs(b.center.z) < 20);
  const info = cliff.map((b) => ({ id: b.id, at: [r2(b.center.x), r2(topOf(b)), r2(b.center.z)], half: [r2(b.half.x), r2(b.half.y), r2(b.half.z)], ny: r2(b.axes[1].y), paint: b.paint, hidden: !!b.hidden, faces: b.faces.map((f) => lvl.faces[f]).filter(Boolean).map((f) => [r2(f.n.x), r2(f.n.y), r2(f.n.z), f.paintable ? 'P' : '-']) }));
  R('the Slump cliff blocks', true, info);
  // Mitts leaps at the cliff tops
  const land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, vv = V(0, 0, 0);
  const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false };
  kid.setWeapon('mitts');
  const res = {};
  for (const lvT of [10, 50]) {
    Lv.debugT(lvT);
    for (const b of cliff) {
      let pred = 0, flown = 0, wall = 0, eg = null;
      for (const nd of nav.nodes) {
        if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
        const dx = b.center.x - nd.x, dz = b.center.z - nd.z, d = Math.hypot(dx, dz);
        if (d > 16 || d < 1) continue;
        for (const dyaw of [0, 0.1, -0.1, 0.2, -0.2]) for (const c of [0.3, 0.5, 0.7, 0.85, 1]) for (const pitch of [0, 0.3, 0.6, 0.9, 1.2]) {
          kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
          MITTS.predictLeap(V(nd.x, nd.y, nd.z), vv, land, null);
          if (land.kind === 'wall' && land.block === b.id) wall++;
          if (land.kind !== 'ground' || land.block !== b.id) continue;
          pred++;
          if (!eg) eg = { from: [r2(nd.x), r2(nd.y), r2(nd.z)], c, pitch, v: [r2(vv.x), r2(vv.y), r2(vv.z)] };
        }
      }
      res[lvT + ':' + b.id] = { pred, wallHits: wall, eg };
    }
  }
  R('Mitts leaps the predictor lands on each cliff top (from dry nodes within 16 m) / that meet its face (a cling)', true, res);
  return out;
})();
