// The lava's look against every team palette (ENGINE.md §6 step 6, rules 38 / 39, §7 R1): scenes for hud-shots.cjs,
// each shot twice — as the player sees it, and with the lava surface drawn flat magenta (the mask the report reads) —
// then tools/botlab/tests/lava-look-report.py measures, on the open lava away from the shore: the lit-seam share (R1:
// ≥ 35 % at rest, ≤ 55 % moving), the lit pixels' mean hue and value, and each palette's inks against them.
//   MAP=caldera MODE=turf SCENES=tools/botlab/tests/lava-look.js OUT=/dir PLAY=4 tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   python3 tools/botlab/tests/lava-look-report.py /dir
// Scenes: <palette>-high and <palette>-low for the 5 team palettes and the colour-blind one (both teams' ink along the
// island's lake edge and the causeway's sides, the camera on the causeway over the lake), and the default palette's
// warn-rise, rise, fall; each with a "-mask" twin.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = m.lava;
  const THREE = await import('three');
  const { TEAM_PALETTES, COLORBLIND_PALETTE } = await import('./src/config.js');
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  for (const a of m.actors) if (a !== m.local) { a.pos.copy(__G.level.spawnPads[a.team]); a.vel.set(0, 0, 0); }
  const me = m.local, look = __G.lavaWorld.look;
  const aim = (x, z, pitch) => { const yw = Math.atan2(x - me.pos.x, z - me.pos.z); me.yaw = yw; if (g.rig) { g.rig.yaw = yw; g.rig.pitch = pitch; } };
  const stand = (x, y, z, lx, lz, pitch) => { if (!me.alive) me.respawn(); me.pos.set(x, y, z); me.vel.set(0, 0, 0); me.invuln = 1e6; aim(lx, lz, pitch); g.rig?.follow?.(me, true); };
  const magenta = new THREE.MeshBasicMaterial({ color: 0xff00ff, toneMapped: false, fog: false });
  const mask = (on) => { look.surf.material = on ? magenta : look.mat; if (look.fallMesh) look.fallMesh.visible = !on; if (on) for (const P of [look.emb, look.stm]) if (P) P.p.visible = false; };
  const inkEdge = () => {
    const P = __G.paint, V = THREE.Vector3;
    P.clear();
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, team = k % 2; for (const r of [15.2, 16.0, 16.8]) P.splat(new V(Math.cos(a) * r, 1.3, Math.sin(a) * r * 0.75), 1.1, team, { seed: k * 7 + r }); }
    for (let z = -20; z <= -8; z += 1.5) { P.splat(new V(-3.4, 1.0, z), 1.0, 0, { seed: z }); P.splat(new V(3.4, 1.0, z), 1.0, 1, { seed: -z }); }
  };
  const info = () => ({ quality: __G.settings?.quality ?? null, particles: !!look.emb, t: +L.clock.t.toFixed(2), y: +L.y.toFixed(3), phase: L.st.phase, teamHex: __G.teamHex, noOrange: look.mat.uniforms.uS.value.z });
  const S = [];
  const pair = (name, set) => {
    S.push({ name, set: async () => { mask(false); await set(); return info(); }, wait: 120 });
    S.push({ name: name + '-mask', set: async () => { mask(true); step(1 / 60); mask(true); return info(); }, wait: 60 });   // (a stepped frame draws it)
  };
  const view = () => stand(-19.6, 1.22, -15.1, -24, -5, -0.3);   // (Alpha's south Slump head, over the bay and the Race)
  const pals = [...TEAM_PALETTES.map((p) => [p.id, p]), ['colourblind', COLORBLIND_PALETTE]];
  for (const [id, p] of pals) {
    pair(id + '-high', () => { g._setPalette?.(p); inkEdge(); L.debugT(52); view(); step(0.5); });
    pair(id + '-low', () => { g._setPalette?.(p); L.debugT(15); view(); step(0.5); });
  }
  g._setPalette?.(TEAM_PALETTES[4]);
  pair('moving-warnrise', () => { L.debugT(31); view(); step(0.5); });
  pair('moving-rise', () => { L.debugT(39.5); view(); step(0.3); });
  pair('moving-fall', () => { L.debugT(74.5); view(); step(0.3); });
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})();
