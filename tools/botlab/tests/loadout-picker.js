// The loadout's SUB / SPECIAL picker (menus.js _openKitPicker): opened from the chips, 2D keyboard / pad moves, Enter / A
// picks (saved to the profile), Esc / B / a click outside closes with no change, the mouse (hover → details, click picks),
// the weapon's own (null), the chip's ← → steps, and the in-match Practice overlay (L) equipping the live player.
//   MAP=testbox PAGE=tools/botlab/tests/loadout-picker.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, M = g.menus;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await wait(50); } return !!fn(); };
  const key = (code, k = code) => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: k, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code, key: k, bubbles: true })); };
  const press = async (code, ms = 90) => { key(code); await wait(ms); };
  const C = await import('./src/config.js');
  const SUBS = C.SUBS, SPECIALS = C.SPECIALS, SUB_ORDER = C.SUB_ORDER.filter((id) => SUBS[id]), SPECIAL_ORDER = C.SPECIAL_ORDER.filter((id) => SPECIALS[id]);
  const q = (s) => document.querySelector(s);
  const saved = () => { try { return JSON.parse(localStorage.getItem('inkwave.profile')) || {}; } catch (e) { return {}; } };
  const picker = () => (M._modal && M._modal.classList.contains('iw-kpickm') ? M._modal : null);
  const tiles = () => [...(picker()?.querySelectorAll('.iw-ktile') || [])];
  const focusId = () => (M._focus && M._focus.dataset.id) || null;
  const detail = () => ({ name: q('.iw-kpick__dname')?.textContent || null, stat: q('.iw-kpick__num')?.textContent || null, kick: q('.iw-kpick__kick')?.textContent || null });
  const chipName = (id) => q(`[data-id="${id}"] b`)?.textContent || null;
  const cols = () => { const t = tiles(); if (!t.length) return 0; const y = t[0].offsetTop; let c = 0; while (c < t.length && t[c].offsetTop === y) c++; return c; };
  // the keys from tile i to tile j on the grid: rows first (↑ / ↓ keep the column), then ← / → along the row
  const path = (i, j, c) => { const ks = []; let r = Math.floor(i / c); const tr = Math.floor(j / c); while (r < tr) { ks.push('ArrowDown'); r++; } while (r > tr) { ks.push('ArrowUp'); r--; } const at = tr * c + (i % c); for (let k = at; k < j; k++) ks.push('ArrowRight'); for (let k = at; k > j; k--) ks.push('ArrowLeft'); return ks; };
  const openWithEnter = async (chipId) => { M._setFocus(q(`[data-id="${chipId}"]`), { snap: true }); await press('Enter', 60); await until(() => picker() && tiles().length); await wait(550); };
  const sounds = [];
  const ps0 = g.api.playSound; g.api.playSound = (n) => { sounds.push(n); return ps0 && ps0(n); };
  const orig = { weapon: g.profile.weapon || 'shooter', sub: g.profile.sub ?? null, special: g.profile.special ?? null };

  try {
    // ---- the main menu's LOADOUT
    await g.quitToMenu('main');
    await until(() => M.current === 'main', 10000); await wait(700);
    g.api.setLoadout({ weapon: 'shooter', sub: null, special: null });
    M._setFocus(q('[data-id="loadout"]'), { snap: true }); await press('Enter');
    await until(() => M.current === 'loadout'); await wait(700);
    const hints = [...document.querySelectorAll('.iw-kit__hint')].map((e) => e.textContent);
    R('main menu → LOADOUT; the SUB / SPECIAL chips say ENTER CHOOSE (Ⓐ on a pad), not ◀ ▶ CHANGE', M.current === 'loadout' && hints.length === 2 && hints.every((t) => /Enter/.test(t) && /A/.test(t) && /CHOOSE/.test(t)) && !M.el.textContent.includes('CHANGE'), { screen: M.current, hints });

    // ---- the sub picker: Enter on the chip
    sounds.length = 0;
    await openWithEnter('subpick');
    const T = tiles(), n0 = T.length, own = q('[data-id="kp-sub-own"]');
    R('Enter on the SUB chip opens the picker: the weapon’s own + every sub, each with its icon and name', picker() && n0 === SUB_ORDER.length + 1 && T.every((t) => t.querySelector('.iw-ktile__icon svg') && t.querySelector('.iw-ktile__name').textContent.trim())
      && T.slice(1).map((t) => t.dataset.id.slice(7)).join() === SUB_ORDER.join(), { tiles: n0, subs: SUB_ORDER.length });
    R('the current pick (the weapon’s own: Splat Bomb on the Spritzer) is marked and starts focused; its details show', focusId() === 'kp-sub-own' && own.classList.contains('is-cur') && document.querySelectorAll('.iw-ktile.is-cur').length === 1
      && /Splat Bomb/.test(detail().name) && detail().stat === `${SUBS.bomb.inkCost}%` && !!q('.iw-kpick__info.is-cur'), { focus: focusId(), detail: detail() });
    const c = cols();
    await press('ArrowRight'); await press('ArrowRight'); await press('ArrowDown', 200);
    const want = 2 + c, wantId = SUB_ORDER[want - 1];
    R(`2D: → → ↓ moves two along and one row down (${c} columns); the details follow the focus (blurb, ink cost)`, c >= 4 && focusId() === `kp-sub-${wantId}` && detail().name === SUBS[wantId].name && detail().stat === `${Math.round(SUBS[wantId].inkCost)}%`
      && q('.iw-kpick__blurb').textContent === SUBS[wantId].blurb, { cols: c, focus: focusId(), want: wantId, detail: detail() });
    await press('KeyW'); await press('KeyD', 200);   // (WASD too)
    const wasdId = SUB_ORDER[2];
    R('WASD moves the same way (W up a row, D right)', focusId() === `kp-sub-${wasdId}`, { focus: focusId(), want: wasdId });
    await press('KeyS'); await press('KeyA', 200);
    await press('Enter', 600);
    R('Enter picks: the sub changes and is saved; the picker closes and focus is back on the SUB chip, which plays its swap', !picker() && g.profile.sub === wantId && saved().sub === wantId && focusId() === 'subpick'
      && chipName('subpick') === SUBS[wantId].name && q('[data-id="subpick"]').classList.contains('is-swap'), { sub: g.profile.sub, saved: saved().sub, focus: focusId(), chip: chipName('subpick') });
    R('sounds: opening ui_click, moving ui_hover, a pick ui_confirm', sounds.includes('ui_click') && sounds.filter((s) => s === 'ui_hover').length >= 5 && sounds.includes('ui_confirm'), { sounds });

    // ---- Esc / B / a click outside: no change
    sounds.length = 0;
    await openWithEnter('subpick');
    const startAt = focusId();
    await press('ArrowRight'); await press('ArrowDown', 150);
    const moved = focusId();
    await press('Escape', 400);
    R('reopened, it starts on the current pick; Esc closes it with no change (focus back on the chip, ui_back)', startAt === `kp-sub-${wantId}` && moved !== startAt && !picker() && g.profile.sub === wantId && saved().sub === wantId && focusId() === 'subpick' && sounds.includes('ui_back'),
      { startAt, moved, sub: g.profile.sub, focus: focusId(), sounds });
    await openWithEnter('subpick');
    M.nav('right'); await wait(80); M.nav('back'); await wait(400);
    const padBack = !picker() && g.profile.sub === wantId && focusId() === 'subpick';
    await openWithEnter('subpick');
    await press('ArrowLeft', 80); picker().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(400);
    R('the pad’s B and a click outside the card close it with no change too', padBack && !picker() && g.profile.sub === wantId, { padBack, sub: g.profile.sub });
    M.setInputMode('kbm');

    // ---- the chip's ← → still step
    M._setFocus(q('[data-id="subpick"]'), { snap: true });
    await press('ArrowRight', 150);
    const stepped = g.profile.sub;
    await press('ArrowLeft', 150);
    R('← → on the SUB chip still step through the subs (no picker)', !picker() && stepped === SUB_ORDER[(SUB_ORDER.indexOf(wantId) + 1) % SUB_ORDER.length] && g.profile.sub === wantId, { stepped, back: g.profile.sub });

    // ---- the special picker: Drainbow (the last special) in a few presses
    sounds.length = 0;
    await openWithEnter('specialpick');
    const ST = tiles(), sc = cols(), last = ST.length - 1;
    R('Enter on the SPECIAL chip: the weapon’s own + every special; the weapon’s own (Twister Zooka) marked and focused; the gauge (190p on the Spritzer) shown', ST.length === SPECIAL_ORDER.length + 1 && ST[last].dataset.id === 'kp-special-drainbow'
      && focusId() === 'kp-special-own' && /Twister Zooka/.test(detail().name) && detail().stat === `${C.WEAPONS.shooter.specialCost}p` && !!q('[data-id="kp-special-zooka"] .iw-ktile__wpn'), { tiles: ST.length, focus: focusId(), detail: detail() });
    const ks = path(0, last, sc);
    for (const k of ks) await press(k);
    await wait(150);
    R(`Drainbow (the last special) in ${ks.length} presses on the grid (${ks.map((k) => k.slice(5)).join(' ')}), not ${SPECIAL_ORDER.length}`, focusId() === 'kp-special-drainbow' && ks.length <= 8 && detail().name === 'Drainbow', { presses: ks.length, cols: sc, focus: focusId() });
    await press('ArrowRight', 120);
    const wrapR = focusId();
    await press('ArrowLeft', 120);
    R('← → run on round the ends: → from Drainbow is the first tile, ← from the first is Drainbow (one press)', wrapR === 'kp-special-own' && focusId() === 'kp-special-drainbow', { wrapR, back: focusId() });
    await press('ArrowDown', 120);
    R('↓ on the bottom row bumps (stays put)', focusId() === 'kp-special-drainbow', { focus: focusId() });
    await press('Enter', 600);
    R('Enter picks Drainbow: saved, the chip shows it, focus back on the SPECIAL chip', !picker() && g.profile.special === 'drainbow' && saved().special === 'drainbow' && chipName('specialpick') === 'Drainbow' && focusId() === 'specialpick',
      { special: g.profile.special, saved: saved().special, chip: chipName('specialpick'), focus: focusId() });
    await openWithEnter('specialpick');
    const spStart = focusId();
    await press('ArrowUp'); await press('ArrowLeft', 120);
    await press('Escape', 400);
    R('special picker: starts on Drainbow; Esc closes with no change', spStart === 'kp-special-drainbow' && !picker() && g.profile.special === 'drainbow' && saved().special === 'drainbow', { spStart, special: g.profile.special });
    // nothing reaches the screen behind it: P / R (practice), Q / E (tabs)
    await openWithEnter('specialpick');
    await press('KeyP'); await press('KeyQ'); await press('KeyE', 300);
    R('P (practice) and Q / E do nothing while the picker is open', M.current === 'loadout' && !!picker() && !M._starting && g.match?.practice !== true && focusId() === 'kp-special-drainbow', { screen: M.current, open: !!picker(), focus: focusId() });
    await press('Escape', 400);

    // ---- the mouse: a click on the chip opens, hover shows details, a click picks; the weapon's own sets null
    q('[data-id="subpick"]').click();
    await until(() => picker() && tiles().length); await wait(550);
    const mine = q('[data-id="kp-sub-mine"]');
    M.el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    mine.dispatchEvent(new PointerEvent('pointerenter'));
    await wait(120);
    const hover = { focus: focusId(), detail: detail().name };
    mine.click(); await wait(600);
    R('mouse: a click on the chip opens it, hovering a tile focuses it (its details show), a click picks it', hover.focus === 'kp-sub-mine' && hover.detail === SUBS.mine.name && !picker() && g.profile.sub === 'mine' && saved().sub === 'mine' && focusId() === 'subpick',
      { hover, sub: g.profile.sub });
    q('[data-id="subpick"]').click();
    await until(() => picker() && tiles().length); await wait(550);
    q('[data-id="kp-sub-own"]').click(); await wait(600);
    R('the weapon’s own tile puts the sub back to the weapon’s (null in the profile; the chip shows Splat Bomb)', !picker() && g.profile.sub === null && saved().sub === null && chipName('subpick') === SUBS.bomb.name, { sub: g.profile.sub, chip: chipName('subpick') });

    // ---- the pad: A opens, the d-pad moves in 2D, A picks
    M._setFocus(q('[data-id="specialpick"]'), { snap: true });
    M.nav('accept'); await until(() => picker() && tiles().length); await wait(550);
    const padFrom = tiles().findIndex((t) => t.classList.contains('is-cur'));
    M.nav('up'); await wait(80); M.nav('left'); await wait(150);
    const padTo = padFrom - sc - 1, padId = SPECIAL_ORDER[padTo - 1];
    M.nav('accept'); await wait(600);
    R('pad: A opens, the d-pad moves in 2D (↑ ←), A picks', !picker() && g.profile.special === padId && saved().special === padId, { from: padFrom, to: padTo, special: g.profile.special, want: padId });
    M.setInputMode('kbm');
    M.show(null); await wait(300);

    // ---- Practice: L opens the loadout over the game; the picker equips the live player at once
    await g.startMatch({ mapId: 'testbox', practice: true });
    await until(() => g.match?.practice && g.match.state === 'playing' && !M.current, 30000); await wait(300);
    g.api.setLoadout({ weapon: 'shooter', sub: null, special: null });
    key('KeyL');
    await until(() => M.current === 'loadout'); await wait(700);
    const me = g.match.local;
    const quick = M.current === 'loadout' && g.match.paused === true;
    await openWithEnter('specialpick');
    const kIdx = SPECIAL_ORDER.indexOf('kraken') + 1;
    for (const k of path(tiles().findIndex((t) => t.classList.contains('is-cur')), kIdx, cols())) await press(k);
    await wait(120);
    const focusK = focusId();
    await press('Enter', 600);
    R('Practice (L): the loadout opens over the game; picking Kraken in the special picker equips it on the live player at once', quick && focusK === 'kp-special-kraken' && me.specialId === 'kraken' && g.profile.special === 'kraken' && !picker(),
      { quick, focus: focusK, specialId: me.specialId, special: g.profile.special });
    await openWithEnter('subpick');
    for (const k of path(tiles().findIndex((t) => t.classList.contains('is-cur')), SUB_ORDER.indexOf('burst') + 1, cols())) await press(k);
    await press('Enter', 600);
    R('Practice: the sub picker swaps the live player’s sub (Pop Pellet) the same way', me.subId === 'burst' && g.profile.sub === 'burst', { subId: me.subId, sub: g.profile.sub });
    await openWithEnter('subpick');
    await press('Escape', 400);
    const stillOpen = M.current === 'loadout';
    await press('Escape', 600);
    R('Practice: Esc closes the picker first (still on the loadout), the next Esc drops you back into the game', stillOpen && !M.current && g.match.paused === false && me.subId === 'burst', { stillOpen, screen: M.current, paused: g.match.paused });
  } catch (e) {
    R('HARNESS', false, { error: String(e && e.stack || e).slice(0, 400) });
  } finally {
    g.api.playSound = ps0;
    try { g.api.setLoadout(orig); } catch (e) { /* */ }
  }
  return out;
})();
