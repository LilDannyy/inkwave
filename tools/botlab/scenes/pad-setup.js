// Settings › Controller setup (menus.js _scr_padsetup) with a faked HORIPAD S (as Chrome / Edge report it: mapping '', the
// right stick on axes 2 / 5, the hat on 9), for tools/botlab/hud-shots.cjs:
//   MAP=testbox PLAY=1 W=1280 H=720 SCENES=tools/botlab/scenes/pad-setup.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   toast     the one-off "Controller detected: HORIPAD — using a fitted layout …" over the game
//   settings  Settings › Controls, the new "Controller setup" row focused (its preview card names the pad)
//   live      the screen: KNOWN: HORIPAD, the live test with the right stick up-right, X (top) and ZR held
//   remap     the guided setup at step 5 (the four stick prompts answered): "Press JUMP — the BOTTOM face button"
(async () => {
  const g = window.__inkwave, M = g.menus, inp = g.input, S = g.settings;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const REST = [0.0039, -0.0039, 0.0039, 0, 0, -0.0039, 0, 0, 0, 9 / 7];
  const pad = { id: 'HORIPAD S (Vendor: 0f0d Product: 00c1)', index: 0, connected: true, mapping: '', timestamp: 0, axes: REST.slice(),
    buttons: Array.from({ length: 14 }, () => ({ pressed: false, touched: false, value: 0 })), vibrationActuator: null };
  const btn = (i, on = true) => { const b = pad.buttons[i]; b.pressed = b.touched = on; b.value = on ? 1 : 0; };
  const neutral = () => { pad.axes = REST.slice(); pad.buttons.forEach((b) => { b.pressed = b.touched = false; b.value = 0; }); };
  let pads = [];
  Object.defineProperty(navigator, 'getGamepads', { value: () => pads, configurable: true, writable: true });
  const padMaps0 = S.padMaps;
  g._setSettings({ padNoticed: [], padMaps: {} });
  const toSetup = async () => {
    if (M.current !== 'settings' && M.current !== 'padsetup') { M.show('settings'); await wait(700); }
    if (M.current === 'settings') { M._setFocus(document.querySelector('[data-id="set-_padsetup"]'), { snap: true }); M.nav('accept'); await wait(900); }
  };
  window.__hudScenes = [
    { name: 'toast', wait: 700, set: async () => {
      g.hud?.setVisible(false);
      pads = [pad]; await wait(1200);
      return { status: inp.padInfo && inp.padInfo.status, toast: document.querySelector('.iw-toast__text')?.textContent };
    } },
    { name: 'settings', wait: 500, set: async () => {
      M.setInputMode('pad');
      M.show('settings'); await wait(900);
      M._setFocus(document.querySelector('[data-id="set-_padsetup"]'), { snap: true }); await wait(700);
      return { focus: M._focus && M._focus.dataset.id };
    } },
    { name: 'live', wait: 300, set: async () => {
      await toSetup();
      M.setInputMode('pad');
      pad.axes[2] = 0.62; pad.axes[5] = -0.71; pad.axes[0] = -0.3; pad.axes[1] = 0.2; btn(3); btn(7);   // (X and ZR: B, the bottom button, would press GUIDED SETUP)
      await wait(600);
      return { screen: M.current, status: document.querySelector('.iw-pads__status')?.textContent, raw: document.querySelector('.iw-pads__raw')?.textContent };
    } },
    { name: 'remap', wait: 300, set: async () => {
      neutral(); await wait(300);
      await toSetup();
      M._scr._start(); await wait(700);   // hands off: the rest values
      for (const set of [() => { pad.axes[5] = -1; }, () => { pad.axes[2] = 1; }, () => { pad.axes[1] = -1; }, () => { pad.axes[0] = 1; }]) { set(); await wait(250); neutral(); await wait(250); }
      return { guide: M._scr._guide && M._scr._guide(), prompt: document.querySelector('.iw-pads__gtext')?.textContent };
    } },
    { name: 'restore', wait: 0, set: async () => {
      M._scr && M._scr._cancel && M._scr._cancel();
      pads = []; await wait(100); delete navigator.getGamepads;
      g._setSettings({ padMaps: padMaps0 });
      return null;
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
