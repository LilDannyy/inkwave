// Fix round 9 pictures (the lead after review 9: "two side-view pictures re-shot with the kid in frame"; the Slump cliff's
// high-mark rind now that its faces are not inkable). The kid is a teammate bot (no local screen effects — the rescue's
// invulnerability vignette hid fix8's side view), the local player parked on its pad; the camera is placed from the kid's
// own positions (the cover top, then where the rescue put it) so both are in frame. hud-shots.cjs scenes:
//   MAP=caldera MODE=turf PLAY=4 SCENES=tools/botlab/jobs/batch5/caldera/rescue9-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = m.lava, lvl = __G.level;
  const THREE = await import('three');
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  const me = m.local, kid = m.actors.find((a) => a.bot && a.team === me.team) || m.actors.find((a) => a.bot);
  const park = () => { for (const a of m.actors) if (a !== kid) { if (!a.alive) a.respawn(); a.pos.copy(lvl.spawnPads[a.team]); a.vel.set(0, 0, 0); a.invuln = 1e6; } };
  const hud = (on) => { const el = __G.hud?.el || document.querySelector('.iw-hud'); if (el) el.style.visibility = on ? '' : 'hidden'; };
  const near = (tag, x, z) => lvl.blocks.filter((b) => b && b.tag === tag).sort((a, b) => Math.hypot(a.center.x - x, a.center.z - z) - Math.hypot(b.center.x - x, b.center.z - z))[0];
  const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
  const cam = (from, at) => { g.settings.fov = 60; g.rig.cinematic(from, from.clone(), at, at.clone(), 99, () => {}); step(2 / 60); };
  // where the rescue sends a kid from the middle of a top (a dry run, then the scene puts it back)
  const rescueOf = (b, t) => {
    L.debugT(t - 3); step(3); park();
    if (!kid.alive) kid.respawn(); kid.spawnAt(V(b.center.x, topOf(b) + 0.3, b.center.z), 0); kid.invuln = 1e6; kid.vel.set(0, 0, 0);
    const tp = kid.netTp || 0; for (let i = 0; i < 120 && (kid.netTp || 0) === tp; i++) step(1 / 60);
    return kid.pos.clone();
  };
  const S = [];
  // from the side (no HUD): held on the cover in the lava, then on the node the rescue chose — the camera off to the side of
  // the line from the cover to that node, far enough back that both stand in the frame
  const side = (name, b, t, after) => S.push({ name, wait: 120, set: async () => {
    hud(false);
    const to = rescueOf(b, t), c = V(b.center.x, topOf(b), b.center.z);
    L.debugT(t - 3); step(3); park();
    if (!kid.alive) kid.respawn(); kid.spawnAt(V(c.x, c.y + 0.3, c.z), 0); kid.invuln = 1e6; kid.vel.set(0, 0, 0);
    step(after);
    const mid = c.clone().add(to).multiplyScalar(0.5), dx = to.x - c.x, dz = to.z - c.z, d = Math.hypot(dx, dz) || 1;
    // (the side of the line nearer the island: the camera stands over open floor, not in the cliff)
    let px = -dz / d, pz = dx / d; if (px * -mid.x + pz * -mid.z < 0) { px = -px; pz = -pz; }
    const back = Math.max(6, d * 1.05 + 3.5);
    cam(V(mid.x + px * back, mid.y + 3.4, mid.z + pz * back), V(mid.x, mid.y + 0.4, mid.z));
    return { t: r2(L.clock.t), lavaY: r2(L.y), top: b.tag + '#' + b.id, kid: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)], held: r2(kid.roofHeld || 0), rescueTo: [r2(to.x), r2(to.y), r2(to.z)], rescueD: r2(Math.hypot(to.x - c.x, to.z - c.z)), alive: kid.alive };
  } });
  const horn = near('slump-hornito', -27.2, -12.2), mould = near('mould-stack', 12, -18.4);
  side('fix9-hornito-held-side', horn, 52, 0.35);
  side('fix9-hornito-rescued-side', horn, 52, 0.85);
  side('fix9-mould-stack-held-side', mould, 52, 0.35);
  side('fix9-mould-stack-rescued-side', mould, 52, 0.85);
  // the Slump cliff, its faces no longer inkable: ink splatted along the cliff's foot and up its face stays off it (the Rim
  // Head beside it takes it), and the high mark's rind (the level shader's band) reads on the cliff at LOW and at HIGH
  const cliff = (name, t) => S.push({ name, wait: 120, set: async () => {
    hud(false); L.debugT(t); step(0.2); park();
    if (!kid.alive) kid.respawn(); kid.spawnAt(V(-25.6, 4.25, -19.2), 0); kid.vel.set(0, 0, 0);
    const P8 = __G.paint; P8?.clear?.();
    for (const b of lvl.blocks.filter((q) => q && q.tag === 'caldera-wall' && topOf(q) > 7 && q.center.x < -26 && q.center.z < 0 && q.center.z > -18)) {
      for (const y of [1.6, 2.6, 3.6, 4.6, 5.6, 6.6]) for (const s of [-0.6, 0.6]) for (const o of [-0.85, 0.85]) {
        const p = V(b.center.x + b.axes[0].x * s + b.axes[2].x * o, y, b.center.z + b.axes[0].z * s + b.axes[2].z * o);
        P8?.splat?.(p, 1.0, kid.team, { instant: true, seed: y + s });
      }
    }
    for (const [x, z] of [[-26.2, -18.4], [-25.0, -19.6], [-27.4, -18.9]]) P8?.splat?.(V(x, 4.25, z), 1.2, kid.team, { instant: true, seed: x });
    cam(V(-19.5, 4.6, -12.8), V(-28.3, 2.6, -9.6));
    return { t: r2(L.clock.t), lavaY: r2(L.y) };
  } });
  cliff('fix9-slump-cliff-rind-low', 10);
  cliff('fix9-slump-cliff-rind-high', 50);
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})();
