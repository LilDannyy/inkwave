// Surf N' Turf on the HUD and in the loadout picker, for tools/botlab/hud-shots.cjs:
//   MAP=halyard MODE=turf PLAY=4 SCENES=tools/botlab/scenes/surf-hud.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   hud      you holding the buoy: the special gauge's icon, the hint line ("Aim · click to throw the buoy"), the arc
//   live     thrown: the buoy anchored ahead, its rings going out (and on the minimap)
//   pause    the pause menu's YOUR MATCH stats: splats with your assists after them
//   loadout  the loadout picker (the setup screen) with Surf N' Turf picked: its icon, name and blurb
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug;
  const me = m.local;
  dbg.freeze();   // (nothing moves between the scenes: only their own steps)
  for (const a of m.actors) if (a.bot) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.special = false; };
  window.__hudScenes = [
    { name: 'hud', wait: 400, set: async () => {
      me.bot = null;   // (no brain: it holds it)
      me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial(); me.aimPitch = 0.2;
      for (let i = 0; i < 40; i++) dbg.step(1000 / 60);
      return { prompt: document.querySelector('.iw-prompt')?.textContent || null, special: me.specialActive?.id };
    } },
    { name: 'live', wait: 300, set: async () => {
      // thrown: the buoy anchored ahead, its rings going out — on screen and on the minimap (both teams see it)
      const S = await import('./src/game/sp-surf.js');
      // (from your spawn deck's front, toward the middle — open ground ahead)
      const pad = __G.level.spawnPads[me.team];
      if (!me.alive) me.respawn();
      me.pos.set(pad.x, pad.y + 0.02, pad.z + (me.team ? -3 : 3)); me.vel.set(0, 0, 0); me.yaw = me.aimYaw = me.team ? Math.PI : 0; me.aimPitch = 0.15;
      g.rig.follow?.(me, true); g.rig.yaw = me.yaw; g.rig.pitch = -0.18;
      for (let i = 0; i < 20; i++) dbg.step(1000 / 60);
      let s = me.specialActive;
      if (!s || s.kind !== 'surf') { me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial(); s = me.specialActive; for (let i = 0; i < 20; i++) dbg.step(1000 / 60); }
      S.IMPL.throwIt(me, s);
      for (let i = 0; i < 60 * 3.4; i++) dbg.step(1000 / 60);
      const b = __G.specials.world.find((w) => w.kind === 'surf');
      return { phase: b && b.phase, rings: b && b.rings.map((r) => r.state + ':' + r.r.toFixed(1)) };
    } },
    { name: 'pause', wait: 900, set: async () => {
      // the pause menu's YOUR MATCH: the splats with your assists after them
      me.stats.splats = 4; me.stats.assists = 2;
      g.hud?.setVisible(false);
      g.menus.show('pause');
      await new Promise((r) => setTimeout(r, 1200));
      return { screen: g.menus.current, stat: [...document.querySelectorAll('.iw-pstat')].map((e) => e.textContent) };
    } },
    { name: 'loadout', wait: 900, set: async () => {
      try { g.api.setLoadout?.({ special: 'surf' }); } catch (e) { /* */ }
      g.hud?.setVisible(false);
      g.menus.show('loadout');
      await new Promise((r) => setTimeout(r, 1500));
      const pick = document.querySelector('.iw-kit--pick b')?.parentElement?.textContent || null;
      return { screen: g.menus.current, chips: [...document.querySelectorAll('.iw-kit')].map((e) => e.textContent.replace(/\s+/g, ' ').slice(0, 160)) };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
