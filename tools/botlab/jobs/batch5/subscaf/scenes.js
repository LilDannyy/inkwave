// [b5-subscaf] pictures of the four stub subs, for tools/botlab/hud-shots.cjs:
//   MAP=halyard PLAY=2 W=1280 H=720 SCENES=tools/botlab/jobs/batch5/subscaf/scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   picker            the loadout's sub picker, focus on the Glide Bomb (the four new tiles at the end)
//   held-<id>         the local kid holding each stub's placeholder up (the HUD badge shows its icon)
//   cantuse           the release: the "Can't use" callout
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, me = m.local;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code) => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code, key: code, bubbles: true })); };
  const step = (n) => { for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  let hold = false;
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = a === me && hold; };
  g.debug.freeze();
  const held = (id) => ({ name: `held-${id}`, wait: 300, set: async () => {
    if (M._modal) { key('Escape'); await wait(400); }
    if (M.current) { M.show(null); await wait(600); }
    g.hud?.setVisible?.(true);
    me.setSub(id); me.ink = 100; hold = false; step(6);
    me.yaw = me.aimYaw = 0.5; me.aimPitch = 0.1; g.rig.yaw = 0.5 + Math.PI; g.rig.pitch = 0.1;
    hold = true; step(20);
    return { sub: me.subId, prop: me.character.bomb?.kind, on: !!me.character.bomb?.group.visible };
  } });
  window.__hudScenes = [
    { name: 'picker', wait: 400, set: async () => {
      g.hud?.setVisible?.(false); M.setInputMode('kbm');
      if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      key('Enter'); await wait(900);
      M._setFocus(document.querySelector('[data-id="kp-sub-glide"]'), { snap: true }); await wait(700);
      return { detail: document.querySelector('.iw-kpick__dname')?.textContent, tiles: document.querySelectorAll('.iw-ktile').length };
    } },
    ...['glide', 'sentry', 'bobber', 'dash'].map(held),
    { name: 'cantuse', wait: 60, set: async () => { if (g.hud) g.hud._denyT = -1e9; hold = false; step(2); return { deny: g.hud?.denyIcon?._k }; } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
