// The loadout's SUB / SPECIAL picker (menus.js _openKitPicker), for tools/botlab/hud-shots.cjs (any W × H):
//   MAP=halyard PLAY=1 W=1280 H=720 SCENES=tools/botlab/scenes/loadout-picker.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   loadout   the loadout screen, the SUB chip focused: its "ENTER CHOOSE" hint
//   sub       the sub picker opened with Enter, focus moved → → ↓ (the focused tile's details underneath)
//   special   the special picker, focus on Drainbow (the last special): one ← from the weapon's own tile (it wraps round)
//   pad       the special picker in pad mode (Ⓐ / Ⓑ glyphs), focus on the weapon's own tile
//   practice  Practice: L opens the loadout over the game (quick), then the special picker
(async () => {
  const g = window.__inkwave, M = g.menus;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code, k = code) => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: k, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code, key: k, bubbles: true })); };
  const R = () => key('ArrowRight'), D = () => key('ArrowDown'), ENTER = () => key('Enter'), ESC = () => key('Escape');
  const state = () => ({ screen: M.current, modal: !!M._modal, focus: M._focus && (M._focus.dataset.id || M._focus.className), detail: document.querySelector('.iw-kpick__dname')?.textContent || null,
    chips: [...document.querySelectorAll('.iw-kit--pick')].map((e) => e.querySelector('b')?.textContent) });
  const loadout = async () => {
    if (M._modal) { ESC(); await wait(400); }
    g.hud?.setVisible(false);
    M.setInputMode('kbm');
    if (M.current !== 'loadout') { M.show('loadout'); await wait(1400); }
  };
  g.api.setLoadout({ weapon: 'shooter', sub: null, special: null });
  g.debug.freeze();
  window.__hudScenes = [
    { name: 'loadout', wait: 500, set: async () => {
      await loadout();
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      await wait(500);
      return state();
    } },
    { name: 'sub', wait: 300, set: async () => {
      await loadout();
      M._setFocus(document.querySelector('[data-id="subpick"]'), { snap: true });
      ENTER(); await wait(900);
      R(); await wait(120); R(); await wait(120); D(); await wait(700);
      return state();
    } },
    { name: 'special', wait: 300, set: async () => {
      await loadout();
      M._setFocus(document.querySelector('[data-id="specialpick"]'), { snap: true });
      ENTER(); await wait(900);
      key('ArrowLeft'); await wait(700);
      return state();
    } },
    { name: 'pad', wait: 300, set: async () => {
      await loadout();
      M._setFocus(document.querySelector('[data-id="specialpick"]'), { snap: true });
      M.nav('accept'); await wait(900);   // (the pad's A: pad mode — Ⓐ / Ⓑ in the hints)
      M._setFocus(document.querySelector('[data-id="kp-special-own"]'), { snap: true });
      await wait(600);
      return state();
    } },
    { name: 'practice', wait: 400, set: async () => {
      if (M._modal) { ESC(); await wait(400); }
      M.show(null);
      g.api.startPractice({ mapId: g.mapDef?.id });
      for (let i = 0; i < 200 && !(g.match?.practice && g.match.state === 'playing'); i++) await wait(100);
      g.debug.freeze?.();
      M.setInputMode('kbm');
      key('KeyL'); await wait(1400);   // (L in Practice: the loadout over the game)
      M._setFocus(document.querySelector('[data-id="specialpick"]'), { snap: true });
      ENTER(); await wait(900);
      R(); await wait(700);
      return { ...state(), practice: !!g.match?.practice };
    } },
  ];
  return window.__hudScenes.map((s) => ({ name: s.name }));
})();
