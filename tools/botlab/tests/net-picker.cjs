// Online: the loadout's SUB / SPECIAL picker (menus.js _openKitPicker) in an online Practice. The guest opens its loadout
// over the game (L), picks in the pickers by keyboard; the host sees the picks on the guest's kid and in the room's player
// list (main.js _applyPracticeLoadout → net.setMe), the weapon's own (null) included; Esc twice and the guest is back in.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-picker.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async (ctx) => {
  const { clients, R, wait, say } = ctx;
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  // a key press in a client's page (through the game's own window listener)
  const key = async (c, code, ms = 140) => { await c.js(`(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code: ${JSON.stringify(code)}, key: ${JSON.stringify(code)}, bubbles: true })); return 1; })()`); await wait(ms); };
  const focusId = (c) => c.js(`(__inkwave.menus._focus && __inkwave.menus._focus.dataset.id) || null`);
  const openPicker = async (c, chip) => {
    await c.js(`(() => { __inkwave.menus._setFocus(document.querySelector('[data-id="${chip}"]'), { snap: true }); return 1; })()`);
    await key(c, 'Enter', 60);
    await c.until(`!!document.querySelector('.iw-kpickm .iw-ktile')`, 5000);
    await wait(650);
  };
  const guestOnHost = (idB) => J(A, `(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(idB)} && !x.isBot); const p = __G.net.lobby.players.find((q) => q.id === ${JSON.stringify(idB)}) || {};
    return { kid: a ? [a.weaponId, a.subId, a.specialId] : null, room: [p.weapon, p.sub ?? null, p.special ?? null] }; })()`);

  // a room in Practice mode, no bots; the guest starts on the Spritzer with its own kit (sub / special null)
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 0 }); 1`);
  await B.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: null, special: null }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await B.until(`__G.net.lobby.players.length === 2`, 15000);
  const t0 = Date.now();
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  say('practice up in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  const idB = await B.js('__G.net.myId');
  await wait(800);
  // the last special in SPECIAL_ORDER (← from the first tile wraps round to it): it only ever grows at its end, so this
  // follows whichever is last ([b5-sprules]: it was Drainbow, now the Mystery Bomb Barrage — as loadout-picker.js)
  const [LAST, LN] = JSON.parse(await B.js(`(async () => { const { SPECIAL_ORDER, SPECIALS } = await import('./src/config.js'); const k = SPECIAL_ORDER[SPECIAL_ORDER.length - 1]; return JSON.stringify([k, SPECIALS[k].name]); })()`));
  const LT = `kp-special-${LAST}`;
  say('the last special:', LAST, LN);

  // 1. L → the loadout over the game (the session runs on underneath); the special picker → the last special
  await key(B, 'KeyL', 300);
  await B.until(`__inkwave.menus.current === 'loadout'`, 8000);
  await wait(800);
  const quick = await J(B, `({ screen: __inkwave.menus.current, paused: !!__G.match.paused })`);
  await openPicker(B, 'specialpick');
  const start = await focusId(B);
  await key(B, 'ArrowLeft');   // (from the weapon's own, the first tile, ← wraps round to the last: LAST)
  const f1 = await focusId(B);
  await key(B, 'Enter', 700);
  const g1 = await J(B, `({ special: __G.match.local.specialId, screen: __inkwave.menus.current, open: !!__inkwave.menus._modal, focus: __inkwave.menus._focus && __inkwave.menus._focus.dataset.id })`);
  R(`guest: L opens the loadout over the online Practice (not paused); the special picker starts on the weapon's own, ← ${LN} (the last), Enter equips it`,
    quick.screen === 'loadout' && !quick.paused && start === 'kp-special-own' && f1 === LT && g1.special === LAST && !g1.open && g1.focus === 'specialpick', { quick, start, f1, g1 });
  await A.until(`(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(idB)} && !x.isBot); const p = __G.net.lobby.players.find((q) => q.id === ${JSON.stringify(idB)}); return a && a.specialId === ${JSON.stringify(LAST)} && p && p.special === ${JSON.stringify(LAST)}; })()`, 8000).catch(() => null);
  const h1 = await guestOnHost(idB);
  R(`host: the guest's kid holds ${LN}, and the room has it (setMe)`, h1.kid && h1.kid[2] === LAST && h1.room[2] === LAST, h1);

  // 2. the sub picker: → → from the weapon's own = Pop Pellet (bomb, sticky, burst …)
  await openPicker(B, 'subpick');
  await key(B, 'ArrowRight'); await key(B, 'ArrowRight'); await key(B, 'ArrowRight');
  const f2 = await focusId(B);
  await key(B, 'Enter', 700);
  await A.until(`(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(idB)} && !x.isBot); const p = __G.net.lobby.players.find((q) => q.id === ${JSON.stringify(idB)}); return a && a.subId === 'burst' && p && p.sub === 'burst'; })()`, 8000).catch(() => null);
  const h2 = await guestOnHost(idB);
  R('sub picker (→ → → Pop Pellet): the host sees it on the guest\'s kid and in the room', f2 === 'kp-sub-burst' && h2.kid && h2.kid[1] === 'burst' && h2.room[1] === 'burst', { f2, h2 });

  // 3. the weapon's own special (null): the kid goes back to the Spritzer's Twister Zooka, the room to null
  await openPicker(B, 'specialpick');
  const f3a = await focusId(B);
  await key(B, 'ArrowRight');   // (the last special → round to the first tile: the weapon's own)
  const f3 = await focusId(B);
  await key(B, 'Enter', 700);
  await A.until(`(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(idB)} && !x.isBot); const p = __G.net.lobby.players.find((q) => q.id === ${JSON.stringify(idB)}); return a && a.specialId === 'zooka' && p && !p.special; })()`, 8000).catch(() => null);
  const h3 = await guestOnHost(idB);
  R('the weapon\'s own special: the guest\'s kid is back on Twister Zooka on the host, the room\'s pick is null', f3a === LT && f3 === 'kp-special-own' && h3.kid && h3.kid[2] === 'zooka' && h3.room[2] === null, { f3a, f3, h3 });

  // 4. Esc leaves the picker without a change, the next Esc drops the guest back into the game
  await openPicker(B, 'subpick');
  await key(B, 'ArrowDown');
  await key(B, 'Escape', 400);
  const mid = await J(B, `({ screen: __inkwave.menus.current, sub: __G.match.local.subId })`);
  await key(B, 'Escape', 600);
  const back = await J(B, `({ screen: __inkwave.menus.current, sub: __G.match.local.subId, state: __G.net.state })`);
  const h4 = await guestOnHost(idB);
  R('Esc closes the picker with no change; the next Esc is back in the game; the host still sees Pop Pellet', mid.screen === 'loadout' && mid.sub === 'burst' && back.screen === null && back.state === 'match' && h4.kid && h4.kid[1] === 'burst', { mid, back, h4 });
};
