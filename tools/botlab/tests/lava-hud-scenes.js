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
  const info = () => ({ quality: __G.settings?.quality ?? null, t: +L.clock.t.toFixed(2), y: +L.y.toFixed(3), phase: L.st.phase, chip: document.querySelector('.lv-chip')?.textContent, mine: document.querySelector('.lv-mine.is-on')?.textContent || null, alive: me.alive });
  const S = [];
  const add = (name, set, wait) => S.push({ name, set: async () => { await set(); return info(); }, wait });
  const shelf = [-25.6, 0.02, -9.0], to = [-12, -4];
  const only = String(window.__preArgs || '');
  // (fix round 1) Zone Control and Tower Command: the lava chip under each mode's own HUD (the top crop), in the warning,
  // the rise, at HIGH and in overtime — MODE=zones / MODE=tower
  // (fix round 3) Bazookarp: the chip beside Bazookarp's own status line under the clock (.iw-kst) — MODE=bazookarp
  if (m.mode === 'bazookarp' && m.karp) {
    const pt = [-6, 1.82, -12], at = [0, 10];
    add('karp-warn-rise', () => { L.debugT(26); stand(...pt, ...at, -0.1); step(0.5); }, 150);
    add('karp-high', () => { L.debugT(55); stand(...pt, ...at, -0.1); step(0.3); }, 100);
    add('karp-carry-warn', () => { L.debugT(26); stand(...pt, ...at, -0.1); m.karp.phase = 'free'; m.karp._applyGrant(me); step(0.5); }, 150);
    window.__hudScenes = S;
    return S.map((s) => ({ name: s.name }));
  }
  if (m.mode === 'zones' || m.mode === 'tower') {
    const pt = [-6, 1.82, -12], at = [0, 10];
    add(m.mode + '-warn-rise', () => { L.debugT(26); stand(...pt, ...at, -0.1); step(0.5); }, 150);
    add(m.mode + '-rising', () => { L.debugT(38); stand(...pt, ...at, -0.1); step(0.3); }, 100);
    add(m.mode + '-high', () => { L.debugT(55); stand(...pt, ...at, -0.1); step(0.3); }, 100);
    add(m.mode + '-warn-fall', () => { L.debugT(72); stand(...pt, ...at, -0.1); step(0.3); }, 100);
    add(m.mode + '-overtime', () => { L.debugT(55); const o = m.zones || m.tower; if (o) o.overtime = true; stand(...pt, ...at, -0.1); step(0.5); }, 150);
    window.__hudScenes = S;
    return S.map((s) => ({ name: s.name }));
  }
  // (fix round 1) the world's looks: a fall as a burst of stills from the Slump's south head (the stones' crack glow,
  // the steam off the leaving shelf), a rise's embers, Race 3's boulder heaving up, the dry island at HIGH (no glow on
  // its bollards and houses), and the inks beside the lava for Tangerine and Cherry (the orange band dropped) —
  // PRE_ARGS=fix1 for these alone
  if (only.includes('fix1')) {
    // (the harness's shared profile may hold quality 'low', which builds no embers or steam: build them as at 'high')
    const lk = __G.lavaWorld.look; if (!lk.emb) { lk.nEmb = 600; lk._particles(); }
    const south = [-19.6, 1.22, -15.1];
    for (const [k, t] of [[1, 61.5], [2, 66.0], [3, 72.0], [4, 74.5], [5, 76.0], [6, 78.0]]) add('fall-burst-' + k, () => { L.debugT(t - 3); stand(...south, -24, -5, -0.22); step(3.0); }, 60);
    for (const [k, t] of [[1, 36.5], [2, 38.5], [3, 41.0]]) add('rise-embers-' + k, () => { L.debugT(t - 2.5); stand(1.5, 1.22, -17.5, -14, -21, -0.1); step(2.5); }, 60);
    for (const [k, t] of [[1, 38.6], [2, 38.85], [3, 39.3]]) add('boulder-' + k, () => { L.debugT(t - 0.6); stand(...south, -20.8, -7.1, -0.2); step(0.6); }, 40);
    add('mid-high-glow', () => { L.debugT(55); stand(1.5, 1.22, -17.5, -6, -3, -0.16); step(0.4); }, 60);
    add('mid-low-glow', () => { L.debugT(15); stand(1.5, 1.22, -17.5, -6, -3, -0.16); step(0.4); }, 60);
    const { TEAM_PALETTES } = await import('./src/config.js');
    const inkEdge = () => { const P = __G.paint, V = THREE.Vector3; for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, team = k % 2; for (const r of [15.2, 16.0, 16.8]) P.splat(new V(Math.cos(a) * r, 1.3, Math.sin(a) * r * 0.75), 1.1, team, { seed: k * 7 + r }); } };
    for (const [i, nm] of [[0, 'tangerine'], [3, 'cherry']]) add(nm + '-high', () => { g._setPalette?.(TEAM_PALETTES[i]); inkEdge(); L.debugT(52); stand(-4.5, 1.25, -24.5, -10, -10, -0.22); step(0.4); }, 80);
    window.__hudScenes = S;
    return S.map((s) => ({ name: s.name }));
  }
  // (fix round 2) steam only on the way down: the same view at HIGH rest, mid-rise, mid-fall and 3 s into the ebb (each
  // after 4 s of particles), and shots fizzling into the lava at HIGH (ember sparks and dark ash, not white) — PRE_ARGS=fix2
  if (only.includes('fix2')) {
    const lk = __G.lavaWorld.look; if (!lk.emb) { lk.nEmb = 600; lk._particles(); }
    const south = [-19.6, 1.22, -15.1];
    // (the particles live on the look's own clock, not the stage's: each scene steps long enough for the last one's to die;
    // LOW rest is 20 s after the ebb)
    for (const [nm, t, w] of [['high-rest', 56, 6], ['rising', 41, 5]]) add('steam-' + nm, () => { L.debugT(t - w); stand(...south, -24, -5, -0.22); step(w); }, 60);
    add('fizzle-high', () => {
      L.debugT(48); stand(...south, -22, -9, -0.25); step(6);
      for (let k = 0; k < 6; k++) { L.fizzle(new THREE.Vector3(-22.5 + k * 0.6, L.y, -9.5 + (k % 2) * 0.8), k % 3 ? 'ink' : 'device'); step(0.05); }
    }, 10);
    for (const [nm, t, w] of [['falling', 75, 6], ['ebb-3s', 83, 9], ['low-rest', 100, 20]]) add('steam-' + nm, () => { L.debugT(t - w); stand(...south, -24, -5, -0.22); step(w); }, 60);
    window.__hudScenes = S;
    return S.map((s) => ({ name: s.name }));
  }
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
