// [b5-subscaf] Online: batch 5's four stub subs (Glide Bomb, Scrap Sentry, Chain Bobber, Dash Pellet) cross the wire as
// loadout ids like any sub, with real clients on the local relay. The guest picks each in turn (profile + setMe): its own
// SUB chip shows the name and icon, the host's room and the guest's nameplate get the id; the host picks one too. In the
// turf match each screen equips both players with their stubs; the guest holds the button (the host sees the stub's
// model raised in the guest's hand through the actor tick's subAim flag), lets go: "Can't use" on the guest's screen,
// no ink paid, nothing made, and nothing recorded for the stub kinds on either screen; no console errors.
//   CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-subscaf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async (ctx) => {
  const { clients, R, wait, say } = ctx;
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const NEW = ['glide', 'sentry', 'bobber', 'dash'];
  const NAMES = { glide: 'Glide Bomb', sentry: 'Scrap Sentry', bobber: 'Chain Bobber', dash: 'Dash Pellet' };
  // the guest's SUB chip: [kit id, name, its icon is that sub's]
  const subChip = (c) => J(c, `(async () => { const { SUB_ICONS } = await import('./src/ui/ui-icons.js'); const e = [...document.querySelectorAll('.iw-lkit')].find((x) => x._k.kind === 'sub'); if (!e) return null;
    const id = String(e._k.sig || '').split('|')[0], t = document.createElement('template'); t.innerHTML = (SUB_ICONS[id] || '').trim();
    const ic = e.querySelector('svg'); return { id, name: e.querySelector('.iw-lkit__name').textContent, icon: !!ic && ic.outerHTML === t.innerHTML }; })()`);
  const hostSees = (name, test, ms = 8000) => A.until(`(() => { const p = __G.net.lobby.players.find((q) => q.name === ${JSON.stringify(name)}); const pl = [...document.querySelectorAll('.iw-plate')].find((e) => (e.querySelector('.iw-plate__name') || {}).textContent === ${JSON.stringify(name)});
    const kit = pl && pl.querySelector('.iw-plate__kit') ? pl.querySelector('.iw-plate__kit').dataset.kit : null; return !!p && (${test}); })()`, ms).then(() => true).catch(() => false);

  // ---------------------------------------------------------------- a turf room, no bots
  for (const c of [A, B]) await c.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: null, special: null }); 1`);
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: 'saltpan', time: 'day', botCount: 0, duration: 90 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => { __inkwave.menus.show('lobby'); return 1; })`);
  await A.until(`__G.net.lobby.players.length === 2`, 15000);
  for (const c of [A, B]) await c.until(`__inkwave.menus.current === 'lobby' && !!document.querySelector('.iw-lkit') && __G.net.lobby.players.length === 2`, 15000);
  await wait(2200);   // (the lobby's entrance)

  // ---------------------------------------------------------------- 1. the guest picks each stub
  const picks = {};
  for (const id of NEW) {
    await B.js(`__inkwave.api.setLoadout({ sub: ${JSON.stringify(id)} }); __G.net.setMe({ sub: ${JSON.stringify(id)} }); 1`);
    const seen = await hostSees('Guesty', `p.sub === ${JSON.stringify(id)} && kit === ${JSON.stringify(id + '|zooka')}`);
    await wait(500);   // (the chip's swap)
    picks[id] = { host: seen, chip: await subChip(B) };
  }
  R('the guest picks each stub in turn: its SUB chip shows the name and icon; the host\'s room and the guest\'s nameplate get the id',
    NEW.every((id) => picks[id].host && picks[id].chip && picks[id].chip.id === id && picks[id].chip.name === NAMES[id] && picks[id].chip.icon), picks);
  await A.js(`__inkwave.api.setLoadout({ sub: 'glide' }); __G.net.setMe({ sub: 'glide' }); 1`);
  const hostPick = await B.until(`(() => { const p = __G.net.lobby.players.find((q) => q.name === 'Hosty'); return p && p.sub === 'glide'; })()`, 8000).then(() => true).catch(() => false);
  R('the host picks the Glide Bomb: the guest\'s room has it', hostPick);

  // ---------------------------------------------------------------- 2. the match: both kits on both screens
  await A.js(`__G.net.start(); 1`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 250);
  const idA = await A.js('__G.net.myId'), idB = await B.js('__G.net.myId');
  const kits = (c) => J(c, `__G.match.actors.filter((a) => !a.isBot).map((a) => [a.owner, a.subId, a.character && a.character.bomb ? a.character.bomb.kind : null])`);
  const kA = await kits(A), kB = await kits(B);
  const want = (k) => k.length === 2 && k.some((x) => x[0] === idA && x[1] === 'glide' && x[2] === 'glide') && k.some((x) => x[0] === idB && x[1] === 'dash' && x[2] === 'dash');
  R('turf match: on both screens the host holds the Glide Bomb and the guest the Dash Pellet (sub and the model in hand)', want(kA) && want(kB), { onHost: kA, onGuest: kB });

  // ---------------------------------------------------------------- 3. the guest uses it: refused; nothing crosses the wire
  // (record every kit record each screen sends or receives for the stub kinds, and the guest's own refusals / uses)
  const watch = `(async () => { const { on } = await import('./src/core/ctx.js'); const NEW = ${JSON.stringify(NEW)}; window.__ss = { cant: 0, use: 0, sent: 0, got: 0 };
    on('sub:cantuse', (e) => { if (e.actor === __G.match.local) __ss.cant++; }); on('sub:use', (e) => { if (e.actor === __G.match.local) __ss.use++; });
    const nm = __G.netm, rec = nm.recKit; nm.recKit = function (a, kind, data) { if (NEW.includes(kind)) __ss.sent++; return rec.apply(this, arguments); };
    const play = nm._play; nm._play = function (from, e) { if (e && e[1] === 'k' && NEW.includes(e[3])) __ss.got++; return play.apply(this, arguments); };
    const msg = nm.onMessage; nm.onMessage = function (from, d) { if (d && d.k === 'dh' && NEW.includes(d.kind)) __ss.got++; return msg.apply(this, arguments); };
    return 1; })()`;
  for (const c of [A, B]) await c.js(watch);
  await B.js(`(() => { const me = __G.match.local; window.__hold = true; me.bot.update = () => { const it = me.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = window.__hold; }; me.ink = 100; return 1; })()`);
  let seenHeld = false;
  for (let i = 0; i < 30 && !seenHeld; i++) { seenHeld = await A.js(`(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(idB)} && !x.isBot); return !!(a && a.character.bomb && a.character.bomb.kind === 'dash' && a.character.bomb.group.visible); })()`); if (!seenHeld) await wait(100); }
  const inkHeld = await B.js(`__G.match.local.ink`);
  await B.js(`window.__hold = false; 1`);
  await wait(1500);
  const gs = await J(B, `({ ...__ss, ink: __G.match.local.ink, items: __G.subs.items.length, deny: __inkwave.hud && __inkwave.hud.denyIcon ? __inkwave.hud.denyIcon._k : null })`);
  const hs = await J(A, `({ ...__ss, items: __G.subs.items.length })`);
  R('the host sees the guest raise the Dash Pellet\'s model while holding the button (the actor tick\'s subAim)', seenHeld);
  R('the guest lets go: "Can\'t use" on its screen (one refusal, the callout\'s icon), no ink paid, nothing made, no use',
    gs.cant === 1 && gs.use === 0 && gs.ink >= inkHeld - 0.01 && gs.items === 0 && gs.deny === 'dash', { guest: gs, inkHeld });
  R('nothing recorded or received for the stub kinds on either screen', gs.sent === 0 && gs.got === 0 && hs.sent === 0 && hs.got === 0 && hs.items === 0, { guest: gs, host: hs });
  await B.js(`delete __G.match.local.bot.update; 1`);
  for (const c of [A, B]) await c.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: null, special: null }); 1`);   // (as found)
  say('done');
};
