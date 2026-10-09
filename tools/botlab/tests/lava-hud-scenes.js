// Scenes for tools/botlab/hud-shots.cjs on Highmark Foundry: a rise as the player sees it from the Slump shelf (the
// warning to the drowned shelf), the gauge chip and the personal line, the callouts, the minimap at LOW and HIGH, a
// lava splat, the stones sinking line.
//   MAP=caldera MODE=turf SCENES=tools/botlab/tests/lava-hud-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = m.lava;
  const THREE = await import('three');
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  // the bots out of the way (on their pads)
  for (const a of m.actors) if (a !== m.local) { a.pos.copy(__G.level.spawnPads[a.team]); a.vel.set(0, 0, 0); }
  const me = m.local;
  const look = (x, z, pitch = -0.12) => { const yw = Math.atan2(x - me.pos.x, z - me.pos.z); me.yaw = yw; if (g.rig) { g.rig.yaw = yw; g.rig.pitch = pitch; } };
  const stand = (x, y, z, lx, lz, pitch) => { if (!me.alive) me.respawn(); me.pos.set(x, y, z); me.vel.set(0, 0, 0); me.invuln = 0; look(lx, lz, pitch); g.rig?.follow?.(me, true); };
  const info = () => ({ t: +L.clock.t.toFixed(2), y: +L.y.toFixed(3), phase: L.st.phase, chip: document.querySelector('.lv-chip')?.textContent, mine: document.querySelector('.lv-mine.is-on')?.textContent || null, alive: me.alive });
  const S = [];
  const add = (name, set, wait) => S.push({ name, set: async () => { await set(); return info(); }, wait });
  const shelf = [-25.6, 0.02, -9.0], to = [-12, -4];
  add('rise1-warning', () => { L.debugT(24.6); stand(...shelf, ...to); step(0.7); }, 200);          // the warning: bell, callout, red beacons, the rind's pulse
  add('rise2-countdown', () => { L.debugT(31.4); stand(...shelf, ...to); step(0.4); });
  add('rise3-surge', () => { L.debugT(34.8); stand(...shelf, ...to); step(0.5); }, 150);              // the rise starts: SURGE!
  add('rise4-stones', () => { L.debugT(37.6); stand(...shelf, ...to); step(0.4); });                 // the stones break the surface
  add('rise5-deadly', () => { L.debugT(38.35); stand(...shelf, ...to); step(0.35); });              // 0.1 s before the shelf is deadly
  add('rise6-drowned', () => { L.debugT(44.2); stand(-19.6, 1.22, -15.1, -24, -5, -0.2); step(0.8); });   // from the south head: the shelf drowned, the Race up
  add('splat', () => { L.debugT(38.5); stand(...shelf, ...to); step(0.6); }, 450);                    // a lava splat: the card, the flood
  add('stones-sinking', () => { L.debugT(46); stand(-20.82, 1.27, -7.13, -12, -4); step(0.2); L.debugT(61); step(0.4); look(-18, -15); step(0.1); });
  add('high-minimap', () => { L.debugT(50); stand(-10, 1.22, -3.2, 0, -20, -0.15); step(0.4); });
  add('warnfall', () => { L.debugT(59.6); stand(-10, 1.22, -3.2, 0, 0, 0.05); step(0.6); }, 200);
  add('low-minimap', () => { L.debugT(90); stand(-10, 1.22, -3.2, 0, -20, -0.15); step(0.4); });
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})();
