// DECISIONS #33: playable but unfinished stages and Bazookarp stay visible and carry the PUBLIC BETA badge.
// MAP=bluestone PAGE=tools/botlab/tests/beta-content.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, M = g.menus, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 8000) => { const t = performance.now(); while (performance.now() - t < ms) { if (fn()) return true; await wait(50); } return !!fn(); };
  const C = await import('./src/config.js');
  const { MAPS, WIP_MODES, SHOW_WIP, mapListed, listedMaps } = C;
  const beta = MAPS.filter((m) => m.beta);
  const betaIds = beta.map((m) => m.id);
  const oldSetup = M._setup, lastStage = g.settings.lastStage;
  const netCtx = await import('./src/core/ctx.js');
  const { MockNet } = await import('./src/net/mock.js');
  const net0 = netCtx.G.net;
  try {
    R('config: Bluestone Junction, Gulper Aquarium and Highmark Foundry are beta; all are listed; Bazookarp is no longer WIP',
      ['bluestone', 'aquarium', 'caldera'].every((id) => betaIds.includes(id) && mapListed(id) && listedMaps().some((m) => m.id === id)) && !WIP_MODES.includes('bazookarp'),
      { beta: betaIds, wipModes: WIP_MODES });
    const saltpan = MAPS.find((m) => m.id === 'saltpan'); saltpan.wip = true;
    const wipWorks = mapListed('saltpan') === SHOW_WIP; delete saltpan.wip;
    R('wip still hides an unplayable stage unless ?wipstages is enabled', wipWorks, { SHOW_WIP, listed: mapListed('saltpan') });

    await g.quitToMenu('main'); await until(() => M.current === 'main');
    M.show('mode'); await until(() => M.current === 'mode' && document.querySelector('.iw-mode--bazookarp'));
    const modeCard = document.querySelector('.iw-mode--bazookarp');
    R('Bazookarp mode card is listed with PUBLIC BETA badge', !!modeCard?.querySelector('.iw-mode__beta') && modeCard.querySelector('.iw-mode__beta').textContent.trim() === 'PUBLIC BETA', { found: !!modeCard });

    M.show(null); M._setup = { mode: 'turf', times: {} }; M.show('setup');
    await until(() => document.querySelectorAll('.iw-ticket').length > 0);
    const tiles = [...document.querySelectorAll('.iw-ticket')];
    const tileBadges = Object.fromEntries(tiles.map((e) => [e._mid, e.querySelector('.iw-ticket__beta')?.textContent.trim() || '']));
    R('offline stage picker shows each beta stage with its badge', betaIds.every((id) => tileBadges[id] === 'PUBLIC BETA'), tileBadges);

    M.show('main'); await until(() => M.current === 'main');
    const mock = new MockNet(); mock._auto = false; mock._lat = 0; mock._fill = 0; netCtx.G.net = mock;
    await mock.create('Tester');
    mock.setSettings({ mode: 'turf', map: 'bluestone' }); M.show('lobby');
    await until(() => M.current === 'lobby' && document.querySelector('.iw-lstage__name')?.textContent.includes('Bluestone'));
    const lobbyStage = document.querySelector('.iw-lstage:not(.iw-swap__stage)');
    R('online lobby stage name shows the beta badge', lobbyStage?.querySelector('.iw-lstage__beta')?.textContent.trim() === 'PUBLIC BETA' && !lobbyStage.querySelector('.iw-lstage__beta').hidden);
    mock.setSettings({ mode: 'bazookarp' }); await wait(250);
    R('online lobby mode shows the Bazookarp beta badge', document.querySelector('.iw-lobby.is-betamode .iw-lob__beta')?.textContent.trim() === 'PUBLIC BETA');

    M.show(null);
    M.showResults({ win: true, percents: [52, 38], colors: ['#ff8a14', '#2f5bff'], mapName: 'Bluestone Junction', mode: 'turf', players: [], xp: { gained: 0 } });
    M.show('results'); await wait(350);
    R('results identify a beta stage with PUBLIC BETA', [...document.querySelectorAll('.iw-results .iw-beta')].some((e) => e.textContent.trim() === 'PUBLIC BETA'));
  } catch (e) { R('no exception', false, String(e?.stack || e)); }
  finally {
    try { netCtx.G.net?.leave?.(); } catch {}
    netCtx.G.net = net0; M._setup = oldSetup; g.api.setSettings({ lastStage });
    M.show('main');
  }
  return out;
})()
