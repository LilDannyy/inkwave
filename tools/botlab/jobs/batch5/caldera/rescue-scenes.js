// Fix round 8 pictures (the lead after review 8: cover standing in drowned ground is a rescue): the player put on a
// Slump hornito and on the Casting Floor's mould stack at HIGH — held 0.6 s where it stands with the HUD's personal line
// NO FOOTING → rescued, then on the nearest dry node with the rescue's rings and the invulnerability flash; and the same
// from the side (no HUD) so the hold and the move read. hud-shots.cjs scenes:
//   MAP=caldera MODE=turf PLAY=4 SCENES=tools/botlab/jobs/batch5/caldera/rescue-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, L = m.lava;
  const THREE = await import('three');
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  for (const a of m.actors) if (a !== m.local) { a.pos.copy(__G.level.spawnPads[a.team]); a.vel.set(0, 0, 0); a.invuln = 1e6; }
  const me = m.local;
  const hud = (on) => { const el = __G.hud?.el || document.querySelector('.iw-hud'); if (el) el.style.visibility = on ? '' : 'hidden'; };
  const info = () => ({ t: +L.clock.t.toFixed(2), y: +L.y.toFixed(3), phase: L.st.phase, me: [+me.pos.x.toFixed(2), +me.pos.y.toFixed(2), +me.pos.z.toFixed(2)], alive: me.alive, held: +(me.roofHeld || 0).toFixed(2), rescues: L.stats.rescues || 0, last: (L.stats.rescueLog || []).slice(-1)[0] || null, mine: document.querySelector('.lv-mine.is-on')?.textContent || null });
  const look = (x, z, pitch) => { const yw = Math.atan2(x - me.pos.x, z - me.pos.z); me.yaw = yw; if (g.rig) { g.rig.yaw = yw; g.rig.pitch = pitch; } };
  const put = (p, at, pitch) => { if (!me.alive) me.respawn(); me.spawnAt(V(p), 0); me.invuln = 0; me.vel.set(0, 0, 0); look(at[0], at[1], pitch); g.rig?.follow?.(me, true); };
  const S = [];
  // the player's own view, HUD on: held (0.35 s after landing), then rescued (0.5 s later)
  const pov = (name, t, p, at, pitch, after) => S.push({ name, wait: 90, set: async () => {
    hud(true); L.debugT(t - 3); step(3); put(p, at, pitch); step(after); return info(); } });
  pov('fix8-hornito-held-hud', 52, [-27.36, 1.75, -5.72], [-20, -2], -0.25, 0.4);
  pov('fix8-hornito-rescued-hud', 52, [-27.36, 1.75, -5.72], [-20, -2], -0.25, 0.95);
  pov('fix8-mould-stack-held-hud', 52, [11.6, 2.25, -18.2], [4, -24], -0.25, 0.4);
  pov('fix8-mould-stack-rescued-hud', 52, [11.6, 2.25, -18.2], [4, -24], -0.25, 0.95);
  // from the side, no HUD: the kid on the cover in the lava, then where the rescue put it
  const side = (name, t, p, from, at, after) => S.push({ name, wait: 120, set: async () => {
    hud(false); L.debugT(t - 3); step(3); put(p, at, -0.2); step(after);
    g.settings.fov = 60; g.rig.cinematic(V(from), V(from), V(at), V(at), 99, () => {}); step(2 / 60);
    return info(); } });
  side('fix8-hornito-held-side', 52, [-27.36, 1.75, -5.72], [-21.5, 3.6, -3.0], [-26.0, 1.0, -6.6], 0.4);
  side('fix8-hornito-rescued-side', 52, [-27.36, 1.75, -5.72], [-21.5, 3.6, -3.0], [-26.0, 1.0, -6.6], 0.95);
  side('fix8-mould-stack-held-side', 52, [11.6, 2.25, -18.2], [7.5, 3.8, -25.0], [11.0, 1.2, -19.5], 0.4);
  side('fix8-mould-stack-rescued-side', 52, [11.6, 2.25, -18.2], [7.5, 3.8, -25.0], [11.0, 1.2, -19.5], 0.95);
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})();
