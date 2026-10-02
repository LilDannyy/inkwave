// Surf N' Turf on the HUD and in the loadout picker, for tools/botlab/hud-shots.cjs:
//   MAP=halyard MODE=turf PLAY=4 SCENES=tools/botlab/scenes/surf-hud.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   hud      you holding the buoy: the special gauge's icon, the hint line ("Aim · click to throw the buoy"), the arc
//   loadout  the loadout picker (the setup screen) with Surf N' Turf picked: its icon, name and blurb
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug;
  const me = m.local;
  for (const a of m.actors) if (a.bot) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.special = false; };
  window.__hudScenes = [
    { name: 'hud', wait: 400, set: async () => {
      me.bot = null;   // (no brain: it holds it)
      me.specialId = 'surf'; me.special = me.specialCost(); me._startSpecial(); me.aimPitch = 0.2;
      for (let i = 0; i < 40; i++) dbg.step(1000 / 60);
      return { prompt: document.querySelector('.iw-prompt')?.textContent || null, special: me.specialActive?.id };
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
