// [karp-face] Bazookarp in the menus (SPEC §6.6, DECISIONS #10). The mode stays behind its wip switch (config WIP_MODES,
// ?wipmodes); the harness starts the match by name.
//   with ?wipmodes (WIPMODES=1):
//     P the pause strip in a Bazookarp match: both counts, SHELL · UNTOUCHED, then <TEAM> CARRYING · n s, FREE, BACK TO
//       THE POND; a pip per weir, grey once lowered
//     H How to Play: a BAZOOKARP rules tab; its four cards (Burst the shell · Carry it · Take the weir · Mind the fuse),
//       each with its art, and the two notes (Specials charge · Overtime)
//     M the mode screen's fifth card: BAZOOKARP, RANKED RULES, NEW!, Lockgate's art, the carp, the chips (4 V 4 · 5:00 +
//       OT · CARRY IT HOME); all five cards fit the screen
//     S the stage select in this mode: only the stages with a Bazookarp layout; with ?wipstages (WIPSTAGES=1) every
//       stage, the ones still on placeholder data tagged PREVIEW (and only those); the length locked at 5:00
//     L the online lobby (the offline stand-in as the host's session): the mode with the carp icon and the locked 5:00;
//       ▶ through its stage list: the same stages as the stage select, PREVIEW on the placeholder ones (?wipstages)
//   without ?wipmodes: no BAZOOKARP card, rules tab or lobby mode (a room refuses the mode)
//   WIPMODES=1 MAP=halyard MODE=bazookarp PAGE=tools/botlab/tests/karp-menus.js tools/botlab/run.sh tools/botlab/page.cjs
//   (and the same with WIPSTAGES=1 too, and with neither)
(async () => {
  const g = window.__inkwave, M = g.menus, m = g.match, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await wait(50); } return !!fn(); };
  const C = await import('./src/config.js');
  const { modeListed, SHOW_WIP, MAPS, listedMaps } = C;
  const { karpLayoutReady } = await import('./src/world/karpStages.js');
  const { MockNet } = await import('./src/net/mock.js');
  const { roomStages } = await import('./src/net/session.js');
  const { G } = await import('./src/core/ctx.js');
  const listed = modeListed('bazookarp'), show = SHOW_WIP;
  const tag = (listed ? '[?wipmodes] ' : '[hidden] ') + (show ? '[?wipstages] ' : '');
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const ready = listedMaps().filter((s) => karpLayoutReady(s.id)).map((s) => s.id);
  const all = listedMaps().filter((s) => !s.onlineOnly).map((s) => s.id);
  R(`${tag}the stages with a Bazookarp layout`, ready.length >= 2 && ready.includes('halyard') && ready.includes('lockgate'), { ready });
  const net0 = G.net;
  try {
    // ---- P. the pause strip (the match the harness started)
    if (listed && m && m.mode === 'bazookarp' && m.karp) {
      const K = m.karp, me = m.local;
      g.debug.freeze();
      const step = (s) => { for (let i = 0; i < Math.round(s * 60); i++) g.debug.step(1000 / 60); };
      for (const a of m.actors) if (a.bot) a.bot.update = () => {};
      const strip = async () => { g.pause(); await until(() => M.current === 'pause' && q('.iw-pzone'), 4000); await wait(500);
        const r = { obj: txt(q('.iw-pzone__obj')), nums: qa('.iw-pzone__num').map(txt), pips: qa('.iw-pzone .iw-kpip').length, low: qa('.iw-pzone .iw-kpip.is-low').length, tag: txt(q('.iw-pmatch__tag')) };
        g.resume ? g.resume() : M.back?.(); await until(() => M.current !== 'pause', 3000); await wait(200); return r; };
      const nW = K.weirs[0].length + K.weirs[1].length;
      const p1 = await strip();
      R(`${tag}P1. the pause strip: BAZOOKARP, both counts, SHELL · UNTOUCHED, a pip per weir`, p1.tag === 'BAZOOKARP' && /SHELL/.test(p1.obj || '') && /UNTOUCHED/.test(p1.obj || '') && p1.nums.length === 2 && p1.nums.every((n) => n === '100') && p1.pips === nW && p1.low === 0, { ...p1, nW });
      const P0 = K.pos.clone(); me.pos.set(P0.x + 7, P0.y, P0.z); me.vel.set(0, 0, 0);   // (out of reach: nobody grabs it meanwhile)
      for (const a of m.actors) if (a !== me && Math.hypot(a.pos.x - P0.x, a.pos.z - P0.z) < 4) { a.pos.set(P0.x - 7, P0.y, P0.z + a.slot); a.vel.set(0, 0, 0); }
      K.shell.clear(); K._setPhase('free', 0); K.claims.length = 0; step(0.05);
      const p2 = await strip();
      me.pos.copy(P0); K._applyGrant(me); K.lowered[me.team] = true; step(0.1);
      const p3 = await strip();
      const tn = (t) => ((g.palette && g.palette.names && g.palette.names[t]) || ['Alpha', 'Bravo'][t]).toUpperCase();
      R(`${tag}P2. … FREE · GRAB IT! while it's free; <TEAM> CARRYING · the fuse's seconds while it's held; that team's weir pips grey once lowered`,
        /FREE/.test(p2.obj || '') && /GRAB IT/.test(p2.obj || '') && (p3.obj || '').includes(`${tn(me.team)} CARRYING`) && /(59|60) s\b/.test(p3.obj || '') && p3.low === K.weirs[me.team].length, { free: p2.obj, held: p3.obj, low: p3.low, team: tn(me.team) });
      K._release(me); K.lowered[me.team] = false; K._reset(K.pos.clone(), 'none'); step(0.1);
      const p4 = await strip();
      R(`${tag}P3. … BACK TO THE POND while it flies home`, /BACK TO THE POND/.test(p4.obj || ''), { obj: p4.obj });
      g.debug.unfreeze?.();
    }

    // ---- H. How to Play
    M.show('howto'); await until(() => M.current === 'howto' && q('.iw-rule'), 6000); await wait(500);
    const tabs = qa('.iw-howto__modes .iw-seg__opt, .iw-howto__modes [data-v]').map(txt);
    const hasTab = tabs.some((t) => /BAZOOKARP/.test(t || ''));
    if (listed) {
      // the rules cards follow the match's mode (a Bazookarp match is on): the four, with art, and the notes
      const cards = qa('.iw-rule').map((c) => ({ title: txt(c.querySelector('.iw-rule__title')), art: !!c.querySelector('.iw-rule__art svg'), text: txt(c.querySelector('.iw-rule__text')) }));
      const notes = qa('.iw-hnote').map(txt);
      R(`${tag}H1. How to Play: a BAZOOKARP tab; four cards with art (Burst the shell · Carry it · Take the weir · Mind the fuse) and the two notes`,
        hasTab && cards.length === 4 && cards.every((c) => c.art) && JSON.stringify(cards.map((c) => c.title)) === JSON.stringify(['Burst the shell', 'Carry it', 'Take the weir', 'Mind the fuse'])
        && /20% slower/.test(cards[1].text || '') && /3× as fast/.test(cards[3].text || '') && notes.length === 2 && /Specials charge/.test(notes[0]) && /Overtime/.test(notes[1]), { tabs, cards: cards.map((c) => c.title), notes });
    } else R(`${tag}H1. How to Play has no Bazookarp tab while the mode is hidden`, !hasTab && tabs.length >= 3, { tabs });

    // ---- M. the mode screen
    await g.quitToMenu('main');
    await until(() => M.current === 'main', 10000); await wait(600);
    M.show('mode'); await until(() => M.current === 'mode' && qa('.iw-mode').length >= 4, 6000); await wait(900);
    const cards = qa('.iw-mode'), kc = q('.iw-mode--bazookarp');
    if (listed) {
      const info = kc && { name: txt(kc.querySelector('.iw-mode__tape')), kicker: txt(kc.querySelector('.iw-mode__kicker')), badge: txt(kc.querySelector('.iw-mode__new')), img: kc.querySelector('.iw-mode__img')?.getAttribute('src') || '', carp: !!kc.querySelector('.iw-mode__zone svg'), chips: qa('.iw-mode--bazookarp .iw-chip').map(txt) };
      const W = innerWidth, H = innerHeight, fit = cards.every((c) => { const r = c.getBoundingClientRect(); return r.left >= -2 && r.right <= W + 2 && r.bottom <= H + 2; });
      R(`${tag}M1. the mode screen's fifth card: BAZOOKARP · RANKED RULES · NEW! · Lockgate's art · the carp · 4 V 4 / 5:00 + OT / CARRY IT HOME`,
        cards.length === 5 && !!info && info.name === 'BAZOOKARP' && info.kicker === 'RANKED RULES' && info.badge === 'NEW!' && /lockgate/.test(info.img) && info.carp && JSON.stringify(info.chips) === JSON.stringify(['4 V 4', '5:00 + OT', 'CARRY IT HOME']), info);
      R(`${tag}M2. all five cards fit the screen (${innerWidth}×${innerHeight})`, fit, cards.map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.bottom)]; }));
    } else R(`${tag}M1. no BAZOOKARP card while the mode is hidden (four cards)`, !kc && cards.length === 4, { cards: cards.length });

    // ---- S. the stage select in Bazookarp
    if (listed) {
      M.show('main'); await until(() => M.current === 'main' && !q('.iw-ticket'), 6000); await wait(300);
      M._setup = { mode: 'bazookarp', times: {} };
      M.show('setup'); await until(() => M.current === 'setup' && qa('.iw-ticket').length > 0, 8000); await wait(600);
      const tk = qa('.iw-ticket').map((c) => ({ id: c._mid, prev: !!c.querySelector('.iw-ticket__preview') })).filter((x) => x.id);
      const ids = tk.map((x) => x.id), prev = tk.filter((x) => x.prev).map((x) => x.id);
      const want = show ? all : ready;
      R(`${tag}S1. the stage select in Bazookarp lists ${show ? 'every stage, PREVIEW on the ones without a Bazookarp layout' : 'only the stages with a Bazookarp layout'}`,
        JSON.stringify([...ids].sort()) === JSON.stringify([...want].sort()) && JSON.stringify(prev.sort()) === JSON.stringify(show ? all.filter((id) => !ready.includes(id)).sort() : []), { ids, prev, want });
      const len = txt(M.el.querySelector('.iw-setup')) || txt(M.el);
      R(`${tag}S2. … with the length locked at 5:00`, /5:00/.test(len || ''), { has: /5:00/.test(len || '') });
      M.show('main'); await until(() => M.current === 'main', 6000); await wait(300);
    }

    // ---- L. the online lobby (the offline stand-in hosting)
    const mock = new MockNet(); mock._auto = false; mock._lat = 0; mock._fill = 0;
    G.net = mock;
    g.settings.lastStage = 'halyard';
    await mock.create('Tester');
    mock.setSettings({ mode: 'bazookarp' });
    if (!listed) {
      R(`${tag}L1. a room refuses the hidden mode`, mock.lobby.mode !== 'bazookarp', { mode: mock.lobby.mode });
    } else {
      mock.setSettings({ map: 'halyard' });
      M.show('lobby');
      const lobStage = () => q('.iw-lstage:not(.iw-swap__stage)');
      await until(() => M.current === 'lobby' && lobStage() && txt(lobStage().querySelector('.iw-lstage__name')), 10000); await wait(800);
      const modeTxt = txt(q('.iw-lob__modename')), modeIco = q('.iw-lset--mode b')?.innerHTML || '', lock = txt(q('.iw-lset--len')) || txt(M.el);
      R(`${tag}L1. the lobby: BAZOOKARP with the carp icon, the length locked at 5:00`, mock.lobby.mode === 'bazookarp' && modeTxt === 'BAZOOKARP' && /M8 16 Q14 8.4 23 9.4/.test(modeIco) && /5:00/.test(lock || ''), { mode: mock.lobby.mode, modeTxt, lock: /5:00/.test(lock || '') });
      const seen = new Map();
      const want = (show ? listedMaps() : listedMaps().filter((s) => karpLayoutReady(s.id)));
      for (let i = 0; i < want.length + 3; i++) {
        const name = txt(lobStage().querySelector('.iw-lstage__name')), pv = lobStage().querySelector('.iw-lstage__preview');
        seen.set(name, !!(pv && !pv.hidden));
        lobStage().querySelector('.iw-lstage__arrows .is-r').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wait(220);
      }
      const names = [...seen.keys()].filter((n) => n !== 'RANDOM STAGE');
      const nameOf = (id) => MAPS.find((s) => s.id === id).name;
      const okNames = JSON.stringify([...names].sort()) === JSON.stringify(want.map((s) => s.name).sort());
      const okPrev = names.every((n) => seen.get(n) === (show && !ready.map(nameOf).includes(n)));
      R(`${tag}L2. ▶ through the lobby's stage list: ${show ? 'every stage, PREVIEW on the placeholder ones' : 'only the stages with a Bazookarp layout'}; the room's own list agrees`,
        okNames && okPrev && JSON.stringify(roomStages('bazookarp').map((s) => s.id).sort()) === JSON.stringify(want.map((s) => s.id).sort()), { seen: Object.fromEntries(seen), want: want.map((s) => s.id) });
      // a room on a stage with no layout, switched to Bazookarp, moves to one that has it (without ?wipstages)
      mock.setSettings({ mode: 'turf' }); mock.setSettings({ map: 'kelpline' }); mock.setSettings({ mode: 'bazookarp' });
      R(`${tag}L3. a room switched to Bazookarp on a stage without a layout ${show ? 'stays (PREVIEW)' : 'moves to one with a layout'}`, show ? mock.lobby.map === 'kelpline' : karpLayoutReady(mock.lobby.map), { map: mock.lobby.map });
      M.show('main'); await until(() => M.current === 'main', 6000);
    }
    try { mock.leave(); } catch (e) { /* */ }
  } catch (e) {
    R(`${tag}no exception`, false, { err: String(e && e.stack || e).slice(0, 400) });
  } finally { G.net = net0; }
  return out;
})();
