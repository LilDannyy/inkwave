// Online: the room lobby's SUB / SPECIAL chips (menus.js _scr_lobby → _openKitPicker), with real clients on the local
// relay. The guest walks the bottom bar by keyboard (WEAPON → SUB ↓ SPECIAL → LOOK and back), readies up, picks a sub
// and a special (the last in SPECIAL_ORDER: ← from the first tile; Drainbow until [b5-sprules] appended two) in the picker by keyboard — the host's room and its nameplate for the guest show them, and
// the guest stays ready — then the weapon's own (null on the wire); a weapon swap in the drawer moves a Weapon's Own
// chip to the new weapon's kit and keeps an explicit pick; the host picks too; the chips are there in every room mode;
// the match starts with the guest's kit in its hands on both screens.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-lobbykit.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
// NET_ARGS: 'shots' also saves pictures to OUT (both lobbies, the picker over the lobby).
module.exports = async (ctx) => {
  const { clients, R, wait, say, out } = ctx;
  const [A, B] = clients;
  const SHOTS = /shots/.test(ctx.args);
  const shot = async (c, name, opts) => { if (!SHOTS) return; const r = await c.shot(`${out}/${name}.jpg`, opts); say('shot', name, r && r.bytes); };
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  // a key press in a client's page (through the game's own window listener)
  const key = async (c, code, ms = 160) => { await c.js(`(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { code: ${JSON.stringify(code)}, key: ${JSON.stringify(code)}, bubbles: true })); return 1; })()`); await wait(ms); };
  const focusId = (c) => c.js(`(__inkwave.menus._focus && __inkwave.menus._focus.dataset.id) || null`);
  const focus = (c, id) => c.js(`(() => { __inkwave.menus._setFocus(document.querySelector('[data-id="${id}"]'), { snap: true }); return 1; })()`);
  const pickerOpen = (c) => c.until(`!!document.querySelector('.iw-kpickm .iw-ktile') && !document.querySelector('.iw-kpickm.is-leaving')`, 5000).then(() => wait(650));
  const pickerGone = (c) => c.until(`!document.querySelector('.iw-kpickm') && !__inkwave.menus._modal`, 5000).catch(() => null);
  // your chips: [shown kit id, weapon's own?, name] for SUB and SPECIAL
  const chips = (c) => J(c, `[...document.querySelectorAll('.iw-lkit')].map((e) => ({ kind: e._k.kind, sig: e._k.sig, own: e.classList.contains('is-own'), name: e.querySelector('.iw-lkit__name').textContent, seen: !!e.offsetParent, mark: getComputedStyle(e.querySelector('.iw-lkit__own')).display !== 'none' }))`);
  const kitOf = (cs, kind) => { const k = cs.find((x) => x.kind === kind) || {}; return { id: String(k.sig || '').split('|')[0], own: k.own, name: k.name, seen: k.seen, mark: k.mark }; };
  // how the host's room / nameplate has the guest
  const onHost = (name) => J(A, `(() => { const p = __G.net.lobby.players.find((q) => q.name === ${JSON.stringify(name)}) || {}; const pl = [...document.querySelectorAll('.iw-plate')].find((e) => (e.querySelector('.iw-plate__name') || {}).textContent === ${JSON.stringify(name)});
    return { weapon: p.weapon, sub: p.sub ?? null, special: p.special ?? null, ready: !!p.ready, plate: pl ? (pl.querySelector('.iw-plate__kit') || { dataset: {} }).dataset.kit || null : null }; })()`);
  const hostSees = (name, test, ms = 8000) => A.until(`(() => { const p = __G.net.lobby.players.find((q) => q.name === ${JSON.stringify(name)}); const pl = [...document.querySelectorAll('.iw-plate')].find((e) => (e.querySelector('.iw-plate__name') || {}).textContent === ${JSON.stringify(name)});
    const kit = pl && pl.querySelector('.iw-plate__kit') ? pl.querySelector('.iw-plate__kit').dataset.kit : null; return !!p && (${test}); })()`, ms).catch(() => null);

  // the last special in SPECIAL_ORDER (← from the first tile wraps round to it): the order only grows at its end, so this
  // follows whichever is last ([b5-sprules]: it was Drainbow, now the Mystery Bomb Barrage — as loadout-picker.js)
  const [LAST, LN] = JSON.parse(await B.js(`(async () => { const { SPECIAL_ORDER, SPECIALS } = await import('./src/config.js'); const k = SPECIAL_ORDER[SPECIAL_ORDER.length - 1]; return JSON.stringify([k, SPECIALS[k].name]); })()`));
  const LT = `kp-special-${LAST}`;
  say('the last special:', LAST, LN);

  // ---------------------------------------------------------------- a turf room, no bots; both on the Spritzer with its own kit
  // (a slot's profile outlives a run: set both loadouts)
  for (const c of [A, B]) await c.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: null, special: null }); 1`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: 'saltpan', time: 'day', botCount: 0, duration: 90 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => { __inkwave.menus.show('lobby'); return 1; })`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  for (const c of [A, B]) await c.until(`__inkwave.menus.current === 'lobby' && !!document.querySelector('.iw-lkit') && __G.net.lobby.players.length === 2`, 15000);
  await wait(2200);   // (the lobby's entrance)
  const c0 = await chips(B);
  const s0 = kitOf(c0, 'sub'), p0 = kitOf(c0, 'special');
  R('guest: SUB and SPECIAL chips beside WEAPON — the Spritzer\'s own Splat Bomb and Twister Zooka, tagged WEAPON\'S OWN',
    s0.seen && p0.seen && s0.id === 'bomb' && s0.own && s0.mark && s0.name === 'Splat Bomb' && p0.id === 'zooka' && p0.own && p0.name === 'Twister Zooka', c0);

  // ---------------------------------------------------------------- 1. the bar by keyboard; ready up
  await focus(B, 'weapon');
  const walk = [];
  for (const k of ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) { await key(B, k); walk.push(await focusId(B)); }
  R('the bar by arrows: WEAPON → SUB ↓ SPECIAL → LOOK ← SPECIAL (where you left the stack) ↑ SUB ← WEAPON → SUB',
    JSON.stringify(walk) === JSON.stringify(['sub', 'special', 'look', 'special', 'sub', 'weapon', 'sub']), walk);
  await key(B, 'KeyR', 600);
  await hostSees('Guesty', 'p.ready');
  R('guest readies up (R)', (await onHost('Guesty')).ready);
  if (SHOTS) { await focus(B, 'sub'); await wait(400); await shot(B, 'lobby-guest-chips'); }

  // ---------------------------------------------------------------- 2. SUB: the picker by keyboard → Echo Orb
  await focus(B, 'sub');
  await key(B, 'Enter', 60);
  await pickerOpen(B);
  const st1 = await focusId(B);
  await key(B, 'ArrowDown'); await key(B, 'ArrowRight'); await key(B, 'ArrowRight');   // (8 a row: own · bomb … → row 2: tracer, boomerang, Echo Orb)
  const f1 = await focusId(B);
  if (SHOTS) await shot(B, 'lobby-picker-sub');
  await key(B, 'Enter', 200);
  await pickerGone(B);
  await wait(400);
  const g1 = await J(B, `({ focus: __inkwave.menus._focus && __inkwave.menus._focus.dataset.id, prof: __inkwave.api.getProfile().sub, me: __G.net.lobby.players.find((p) => p.you).sub })`);
  const k1 = kitOf(await chips(B), 'sub');
  R('guest: Enter on SUB opens the kit picker on the weapon\'s own; ↓ → → Echo Orb, Enter picks it — saved to the profile, the chip shows it, focus back on the chip',
    st1 === 'kp-sub-own' && f1 === 'kp-sub-scan' && g1.prof === 'scan' && g1.me === 'scan' && k1.id === 'scan' && !k1.own && !k1.mark && k1.name === 'Echo Orb' && g1.focus === 'sub', { st1, f1, g1, k1 });
  await hostSees('Guesty', `p.sub === 'scan' && kit === 'scan|zooka'`);
  const h1 = await onHost('Guesty');
  R('host: the room has the guest\'s Echo Orb, and so does its nameplate; the guest is still ready', h1.sub === 'scan' && h1.plate === 'scan|zooka' && h1.ready, h1);

  // ---------------------------------------------------------------- 3. SPECIAL: → the last special (LAST)
  await key(B, 'ArrowDown');
  const fs = await focusId(B);
  await key(B, 'Enter', 60);
  await pickerOpen(B);
  const st2 = await focusId(B);
  await key(B, 'ArrowLeft');   // (from the weapon's own, the first tile, ← wraps round to the last: LAST)
  const f2 = await focusId(B);
  if (SHOTS) await shot(B, 'lobby-picker-special');
  await key(B, 'Enter', 200);
  await pickerGone(B);
  await wait(400);
  const k2 = kitOf(await chips(B), 'special');
  R(`guest: ↓ SPECIAL, Enter: the picker on the weapon's own, ← ${LN} (the last), Enter — the chip shows ${LN}`,
    fs === 'special' && st2 === 'kp-special-own' && f2 === LT && k2.id === LAST && !k2.own && k2.name === LN, { fs, st2, f2, k2 });
  await hostSees('Guesty', `p.special === ${JSON.stringify(LAST)} && kit === ${JSON.stringify('scan|' + LAST)}`);
  const h2 = await onHost('Guesty');
  R(`host: the guest's ${LN} in the room and on its nameplate; still ready`, h2.special === LAST && h2.plate === 'scan|' + LAST && h2.ready, h2);

  // ---------------------------------------------------------------- 4. SUB back to the weapon's own: null on the wire
  await focus(B, 'sub');
  await key(B, 'Enter', 60);
  await pickerOpen(B);
  const st3 = await focusId(B);
  await key(B, 'ArrowUp'); await key(B, 'ArrowLeft'); await key(B, 'ArrowLeft');   // (Echo Orb ↑ Cling Charge ← Splat Bomb ← the weapon's own)
  const f3 = await focusId(B);
  await key(B, 'Enter', 200);
  await pickerGone(B);
  await wait(400);
  const g3 = await J(B, `({ prof: __inkwave.api.getProfile().sub ?? null, me: __G.net.lobby.players.find((p) => p.you).sub ?? null })`);
  const k3 = kitOf(await chips(B), 'sub');
  await hostSees('Guesty', `p.sub == null && kit === ${JSON.stringify('bomb|' + LAST)}`);
  const h3 = await onHost('Guesty');
  R('Weapon\'s Own: the picker starts on Echo Orb, ↑ ← ← the first tile, Enter — null in the profile and the room, the chip back on Splat Bomb marked as the weapon\'s own',
    st3 === 'kp-sub-scan' && f3 === 'kp-sub-own' && g3.prof === null && g3.me === null && k3.id === 'bomb' && k3.own && k3.mark && h3.sub === null && h3.plate === 'bomb|' + LAST && h3.ready, { st3, f3, g3, k3, h3 });

  // ---------------------------------------------------------------- 5. a weapon swap in the drawer: the Weapon's Own chip follows, the pick stays
  await B.js(`document.querySelectorAll('.iw-lkit').forEach((e) => e.classList.remove('is-swap')); 1`);
  await focus(B, 'weapon');
  await key(B, 'Enter', 700);
  const drawer = await B.js(`!!document.querySelector('.iw-ldr')`);
  await focus(B, 'lw-roller');
  await key(B, 'Enter', 200);
  await B.until(`!document.querySelector('.iw-ldr') || document.querySelector('.iw-ldr.is-leaving')`, 5000).catch(() => null);
  await wait(700);
  const c5 = await chips(B);
  const s5 = kitOf(c5, 'sub'), p5 = kitOf(c5, 'special');
  const anim = await J(B, `[...document.querySelectorAll('.iw-lkit')].map((e) => e.classList.contains('is-swap'))`);
  R(`guest: the Swell Roller from the drawer — the Weapon's Own SUB chip moves to its Cling Charge (swap animation), the SPECIAL pick stays ${LN}`,
    drawer && s5.id === 'sticky' && s5.own && s5.name === 'Cling Charge' && anim[0] && !anim[1] && p5.id === LAST && !p5.own, { drawer, s5, p5, anim });
  await hostSees('Guesty', `p.weapon === 'roller' && kit === ${JSON.stringify('sticky|' + LAST)}`);
  const h5 = await onHost('Guesty');
  R(`host: roller, sub null (its own: Cling Charge on the nameplate), ${LN}; still ready`, h5.weapon === 'roller' && h5.sub === null && h5.special === LAST && h5.plate === 'sticky|' + LAST && h5.ready, h5);

  // ---------------------------------------------------------------- 6. the host picks too: SPECIAL → Tidal Slam (the first after the weapon's own)
  const hostName = await A.js(`__G.net.lobby.players.find((p) => p.you).name`);
  await focus(A, 'special');
  await key(A, 'Enter', 60);
  await pickerOpen(A);
  const fa0 = await focusId(A);
  await key(A, 'ArrowRight');
  const fa = await focusId(A);
  await key(A, 'Enter', 200);
  await pickerGone(A);
  await B.until(`(() => { const p = __G.net.lobby.players.find((q) => q.name === ${JSON.stringify(hostName)}); return p && p.special === 'slam'; })()`, 8000).catch(() => null);
  const hs = await J(B, `(() => { const p = __G.net.lobby.players.find((q) => q.name === ${JSON.stringify(hostName)}) || {}; const pl = [...document.querySelectorAll('.iw-plate')].find((e) => (e.querySelector('.iw-plate__name') || {}).textContent === ${JSON.stringify(hostName)}); return { special: p.special, plate: pl ? pl.querySelector('.iw-plate__kit').dataset.kit : null }; })()`);
  const ka = kitOf(await chips(A), 'special');
  R('host: its SPECIAL chip → Tidal Slam; the guest\'s room and nameplate show it', fa0 === 'kp-special-own' && fa === 'kp-special-slam' && ka.id === 'slam' && hs.special === 'slam' && hs.plate === 'bomb|slam', { fa0, fa, ka, hs });
  if (SHOTS) { await wait(600); await shot(A, 'lobby-host-plates'); await shot(B, 'lobby-guest-plates'); }

  // ---------------------------------------------------------------- 7. every room mode: the chips stay (host and guest)
  const modes = {};
  for (const mode of ['zones', 'tower', 'boss', 'practice', 'turf']) {
    await A.js(`__G.net.setSettings({ mode: ${JSON.stringify(mode)} }); 1`);
    await B.until(`__G.net.lobby.mode === ${JSON.stringify(mode)}`, 8000).catch(() => null);
    await wait(500);
    const seen = [];
    for (const c of [A, B]) seen.push((await chips(c)).map((k) => k.seen && !!k.name).every(Boolean));
    modes[mode] = seen;
  }
  R('the chips are there in every room mode (zones · tower · boss · practice · turf), host and guest', Object.values(modes).every((v) => v[0] && v[1]), modes);
  await A.js(`__G.net.setSettings({ mode: 'turf', botCount: 0 }); 1`);
  await hostSees('Guesty', 'p.ready', 6000);

  // ---------------------------------------------------------------- 8. the match: the guest's kit in its hands on both screens
  const ready = await A.js(`__G.net.canStart()`);
  const t0 = Date.now();
  await A.js(`__G.net.start(); 1`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  say('match up in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  const idB = await B.js('__G.net.myId'), idA = await A.js('__G.net.myId');
  const actorOf = (c, owner) => J(c, `(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(owner)} && !x.isBot); return a ? [a.weaponId, a.subId, a.specialId] : null; })()`);
  const onA = await actorOf(A, idB), onB = await J(B, `[__G.match.local.weaponId, __G.match.local.subId, __G.match.local.specialId]`);
  const hostOnB = await actorOf(B, idA);
  R(`turf match (the guest stayed ready, so the host could start): the guest holds the roller, its own Cling Charge and ${LN} — on the host's screen and its own`,
    ready && JSON.stringify(onA) === JSON.stringify(['roller', 'sticky', LAST]) && JSON.stringify(onB) === JSON.stringify(['roller', 'sticky', LAST]), { ready, onA, onB });
  R('…and the host\'s Tidal Slam reached the guest\'s screen', hostOnB && hostOnB[2] === 'slam', { hostOnB });
  for (const c of [A, B]) await c.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: null, special: null }); 1`);   // (as found)
};
