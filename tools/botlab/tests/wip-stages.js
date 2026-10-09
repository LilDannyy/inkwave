// Stages under construction (config MAPS `wip: true`): in no player-facing stage list — the offline stage select (and its
// Boss Battle list), the online lobby's stage picker (and its Boss Battle list), Random (the lobby's roll, the Practice
// stage swap, Practice's new stage, the offline stand-in's rooms), the stage the game boots on (the menu backdrop) and
// the room it opens — while api.startMatch still loads one by id (the botlab harness: MAP=<id>). With ?wipstages
// (WIPSTAGES=1) every one of those lists them instead.
//   MAP=bluestone PAGE=tools/botlab/tests/wip-stages.js tools/botlab/run.sh tools/botlab/page.cjs
//   WIPSTAGES=1 MAP=bluestone PAGE=tools/botlab/tests/wip-stages.js tools/botlab/run.sh tools/botlab/page.cjs
// (Once every stage ships and no MAPS entry is wip, the test flags Saltpan Basin wip for its run, so it keeps checking.)
(async () => {
  const g = window.__inkwave, M = g.menus, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await wait(50); } return !!fn(); };
  const C = await import('./src/config.js');
  const { MAPS, SHOW_WIP, mapListed, listedMaps, bossFallbackMap } = C;
  const { NetSession, roomStages } = await import('./src/net/session.js');
  const { MockNet } = await import('./src/net/mock.js');
  const { G } = await import('./src/core/ctx.js');
  const show = SHOW_WIP;   // ?wipstages: every list must include the wip stages; without it, none may
  const tag = show ? '[?wipstages] ' : '';
  let flagged = null;
  if (!MAPS.some((m) => m.wip)) { flagged = MAPS.find((m) => m.id === 'saltpan'); flagged.wip = true; }
  const WIP = MAPS.filter((m) => m.wip).map((m) => m.id), WIPN = MAPS.filter((m) => m.wip).map((m) => m.name);
  const harnessMap = g.mapDef && g.mapDef.id;
  // a list of ids / names agrees with the flag: no wip stage in it (or, with ?wipstages, every one of them)
  const fits = (ids, all = WIP) => (show ? all.every((id) => ids.includes(id)) : !ids.some((id) => all.includes(id)));
  // the same for a random sample: none (or, with ?wipstages, at least one — a roll can miss one by chance)
  const rollFits = (ids, all = WIP) => (show ? all.some((id) => ids.includes(id)) : !ids.some((id) => all.includes(id)));
  const net0 = G.net, lastStage0 = g.settings.lastStage, setup0 = M._setup;
  try {
    R(`${tag}the wip stages (config MAPS wip: true): ${WIP.join(', ')}`, WIP.length > 0 && (flagged || ['bluestone', 'aquarium', 'caldera'].every((id) => WIP.includes(id))), { wip: WIP, flagged: flagged && flagged.id, SHOW_WIP });
    R(`${tag}config: mapListed / listedMaps() follow the flag; a shipped stage is always listed; an unknown id never is`,
      WIP.every((id) => mapListed(id) === show) && fits(listedMaps().map((m) => m.id)) && mapListed('halyard') && !mapListed('nope'), { listed: listedMaps().map((m) => m.id) });

    // ---- the harness loaded MAP by id (page.cjs: api.startMatch) — the boot / room rules come from it being on screen
    R(`${tag}the harness built the stage it asked for by id (MAP=${harnessMap})`, !!harnessMap && g.mapDef.id === harnessMap && __G.level.layout && __G.level.layout.id === harnessMap, { mapDef: harnessMap, level: __G.level.layout && __G.level.layout.id });
    // the room a player opens from the menu starts on the backdrop's stage — never a wip one
    const s0 = new NetSession();
    R(`${tag}online: a room opened over ${harnessMap} starts on ${show || !WIP.includes(harnessMap) ? 'it' : 'the first stage instead'}`,
      s0.lobby.map === (show || !WIP.includes(harnessMap) ? harnessMap : MAPS[0].id), { map: s0.lobby.map, backdrop: harnessMap });
    // the stage the game boots on (main.js _bootMap: ?map=<id>, the menu backdrop)
    const boots = WIP.map((id) => g._bootMap(id).id);
    R(`${tag}boot: ?map=<a wip stage> ${show ? 'boots on it' : 'boots on the first stage instead'}; ?map=halyard / none / cargo as before`,
      boots.every((b, i) => (show ? b === WIP[i] : b === MAPS[0].id)) && g._bootMap('halyard').id === 'halyard' && g._bootMap(null).id === MAPS[0].id && g._bootMap('cargo').id !== 'cargo',
      { boots, halyard: g._bootMap('halyard').id, none: g._bootMap(null).id, cargo: g._bootMap('cargo').id });

    // ---- the host's rules (src/net/session.js) — stage lists, Random, the host refusing a wip pick, Practice swap
    const modes = ['turf', 'zones', 'tower', 'boss', 'practice'];
    const lists = Object.fromEntries(modes.map((md) => [md, roomStages(md).map((m) => m.id)]));
    R(`${tag}online: every mode's stage list (Random's pool; Boss Battle's too) ${show ? 'lists' : 'leaves out'} the wip stages`, modes.every((md) => fits(lists[md], md === 'boss' ? WIP.filter((id) => C.mapBossOk(id)) : WIP)), lists);
    const s = new NetSession();
    s.myId = s.hostId = 'me'; s._broadcastLobby = () => {};
    s.lobby.players = [{ id: 'me', you: true, host: true, team: 0, name: 'Tester' }];
    const rolls = {};
    for (const md of modes) { s.lobby.mode = md; for (let i = 0; i < 160; i++) { const id = s._randomMap(md); rolls[id] = (rolls[id] || 0) + 1; } }
    R(`${tag}online: 'random' (800 rolls over the five modes) ${show ? 'can roll' : 'never rolls'} a wip stage`, rollFits(Object.keys(rolls)), rolls);
    s.lobby.mode = 'turf'; s.setSettings({ map: 'halyard' });
    const picks = WIP.map((id) => { s.setSettings({ map: id }); return s.lobby.map; });
    R(`${tag}online: the host ${show ? 'takes' : 'refuses'} a wip stage in setSettings`, picks.every((p, i) => (show ? p === WIP[i] : p === 'halyard')), { picks });
    s.setSettings({ map: 'cargo' }); s.setSettings({ mode: 'boss' });
    const fbs = WIP.map((id) => bossFallbackMap(id));
    R(`${tag}online: Boss Battle's fallback (a room switched to boss on a noBoss stage) is never a wip stage${show ? '' : '; nor is one asked to fall back from a wip stage'}`,
      !WIP.includes(s.lobby.map) && s.lobby.map !== 'cargo' && fbs.every((f, i) => (show ? f === WIP[i] : !WIP.includes(f))), { boss: s.lobby.map, fallbacks: fbs });
    const swaps = [];
    Object.assign(s, { state: 'match', _startCfg: { k: 'start', practice: 1, mode: 'practice', map: 'halyard', time: 'day', gen: 0 }, match: { liveRoster: () => [] }, tr: { broadcast() {} }, _swap: (cfg) => swaps.push(cfg.map) });
    s.lobby.mode = 'practice';
    for (const id of WIP) s.practiceSwap({ map: id });
    const swapPicked = swaps.slice();
    for (let i = 0; i < 120; i++) s.practiceSwap({ map: 'random' });
    R(`${tag}online Practice: the host's stage swap ${show ? 'goes to' : 'refuses'} a wip stage, and its RANDOM ${show ? 'can roll' : 'never rolls'} one`,
      swapPicked.every((p, i) => (show ? p === WIP[i] : p === 'halyard')) && fits([...new Set(swaps.slice(WIP.length))]), { picked: swapPicked, randoms: [...new Set(swaps.slice(WIP.length))] });

    // ---- the offline stand-in (?netmock=1, src/net/mock.js): its rooms, the host's settings, its Practice
    {
      const m = new MockNet(); m._auto = false; m._lat = 0; m._fill = 0;
      g.settings.lastStage = WIP[0];
      await m.create('Tester');
      const created = m.lobby.map;
      m.setSettings({ map: 'halyard' }); const picksM = WIP.map((id) => { m.setSettings({ map: id }); return m.lobby.map; });
      m.leave();
      const joined = {};
      for (let i = 0; i < 60; i++) { await m.join('BCDEF', 'Tester'); joined[m.lobby.map] = (joined[m.lobby.map] || 0) + 1; m.leave(); }
      R(`${tag}netmock: a room created with a wip lastStage ${show ? 'opens on it' : 'opens on the first stage'}; the host ${show ? 'takes' : 'refuses'} a wip pick; joined rooms (60) ${show ? 'can be' : 'are never'} on one`,
        (show ? created === WIP[0] : created === MAPS[0].id) && picksM.every((p, i) => (show ? p === WIP[i] : p === 'halyard')) && rollFits(Object.keys(joined)),
        { created, picks: picksM, joined });
      const sm0 = g.startMockPractice, practiced = [];
      g.startMockPractice = (live) => { practiced.push(live.map); return null; };
      try {
        await m.create('Tester');
        Object.assign(m, { state: 'match' }); m.lobby.live = { mode: 'practice', map: 'halyard', time: 'day', gen: 0 };
        for (let i = 0; i < 100; i++) m.practiceSwap({ map: 'random' });
        for (const id of WIP) m.practiceSwap({ map: id });
      } finally { g.startMockPractice = sm0; m.leave(); }
      R(`${tag}netmock Practice: its stage swaps (random ×100, then each wip stage by id) ${show ? 'can land on' : 'never land on'} a wip stage`,
        show ? rollFits(practiced.slice(0, 100)) && WIP.every((id, i) => practiced[100 + i] === id) : fits(practiced), { stages: [...new Set(practiced)] });
    }

    // ---- main.js: Practice's random stage (the main menu's PRACTICE, the pause menu's NEW STAGE); by id it's the harness'
    {
      const sm0 = g.startMatch, got = [];
      g.startMatch = (o) => { got.push(o.mapId); return Promise.resolve(); };
      try {
        for (let i = 0; i < 150; i++) g.api.startPractice();
        g.startPractice({ mapId: WIP[0] });
      } finally { g.startMatch = sm0; }
      const rnd = [...new Set(got.slice(0, -1))];
      R(`${tag}Practice's random stage (150 rolls) ${show ? 'can be' : 'is never'} a wip stage; startPractice({ mapId }) still takes one by id`, rollFits(rnd) && got[got.length - 1] === WIP[0], { stages: rnd, byId: got[got.length - 1] });
    }

    // ---- the menus: the offline stage select (Turf War, Boss Battle), the online lobby's picker, the Practice swap modal
    await g.quitToMenu('main');
    await until(() => M.current === 'main', 10000); await wait(600);
    const tickets = () => [...document.querySelectorAll('.iw-ticket')].map((c) => c._mid).filter(Boolean);
    const openSetup = async (mode) => {
      M.show('main'); await until(() => M.current === 'main' && !document.querySelector('.iw-ticket'), 6000); await wait(300);
      M._setup = { mode, times: {} };
      M.show('setup'); await until(() => M.current === 'setup' && tickets().length > 0, 8000); await wait(400);
      return tickets();
    };
    g.api.setSettings({ lastStage: WIP[0] });
    const turfT = await openSetup('turf');
    const sel = M._setup && M._setup.mapId;
    R(`${tag}offline stage select (Turf War): the tickets ${show ? 'include' : 'leave out'} the wip stages; a wip lastStage ${show ? 'is selected' : 'falls back to a listed one'}`,
      turfT.length > 0 && fits(turfT) && (show ? sel === WIP[0] : !WIP.includes(sel)), { tickets: turfT, selected: sel });
    const zonesT = await openSetup('zones'), bossT = await openSetup('boss');
    R(`${tag}offline stage select: Zone Control and Boss Battle ${show ? 'list' : 'leave out'} the wip stages too`, zonesT.length > 0 && bossT.length > 0 && fits(zonesT) && fits(bossT), { zones: zonesT, boss: bossT });
    M.show('main'); await until(() => M.current === 'main', 6000); await wait(300);

    // the online lobby (the stand-in as the host's session): ▶ through the whole stage list, in Turf War and Boss Battle
    const mock = new MockNet(); mock._auto = false; mock._lat = 0; mock._fill = 0;
    G.net = mock;
    g.settings.lastStage = 'halyard';
    await mock.create('Tester');
    M.show('lobby');
    const lobStage = () => document.querySelector('.iw-lstage:not(.iw-swap__stage)');
    await until(() => M.current === 'lobby' && lobStage() && lobStage().querySelector('.iw-lstage__name').textContent, 10000); await wait(800);
    const walk = async (n) => {
      const names = new Set();
      for (let i = 0; i < n; i++) {
        lobStage().querySelector('.iw-lstage__arrows .is-r').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wait(60);
        names.add(lobStage().querySelector('.iw-lstage__name').textContent);
      }
      return [...names];
    };
    const n = MAPS.length + 3;
    const lobTurf = await walk(n), lobMap = mock.lobby.map;
    mock.setSettings({ mode: 'boss' }); await wait(300);
    const lobBoss = await walk(n);
    const wipBossN = MAPS.filter((m) => m.wip && C.mapBossOk(m.id)).map((m) => m.name);
    R(`${tag}online lobby: ▶ through the stage picker (Turf War) ${show ? 'shows' : 'never shows'} a wip stage; RANDOM is still there`, lobTurf.includes('RANDOM STAGE') && lobTurf.length > 5 && fits(lobTurf, WIPN), { names: lobTurf, last: lobMap });
    R(`${tag}online lobby: Boss Battle's stage picker ${show ? 'shows' : 'never shows'} a wip stage`, lobBoss.length > 5 && fits(lobBoss, wipBossN), { names: lobBoss });
    const cnt = (lobStage().querySelector('.iw-lstage__num em') || {}).textContent || '';
    mock.setSettings({ mode: 'turf' }); await wait(300);
    const cntT = (lobStage().querySelector('.iw-lstage__num em') || {}).textContent || '';
    R(`${tag}online lobby: the stage count is the listed stages (${listedMaps().length})`, +cntT.replace(/\D/g, '') === listedMaps().length, { turf: cntT, boss: cnt });
    // the online Practice host's SWAP STAGE modal (pause menu): ▶ through its list
    M._openStageSwap({ mapId: 'halyard', time: 'day' });
    await until(() => document.querySelector('.iw-swap .iw-lstage__name'), 4000); await wait(300);
    const swapNames = new Set();
    for (let i = 0; i < n; i++) {
      document.querySelector('.iw-swap .iw-lstage__arrows .is-r').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(40);
      swapNames.add(document.querySelector('.iw-swap .iw-lstage__name').textContent.replace(/ · NOW$/, ''));
    }
    M._closeModal(true);
    R(`${tag}online Practice: the SWAP STAGE modal ${show ? 'lists' : 'never lists'} a wip stage`, swapNames.size > 5 && fits([...swapNames], WIPN), { names: [...swapNames] });
    M.show('main'); await until(() => M.current === 'main', 6000); await wait(300);
    mock.leave(); G.net = net0;

    // ---- every wip stage still loads by id through the harness' call (api.startMatch), like MAP=<id>
    for (const id of WIP) {
      await g.api.startMatch({ mapId: id, duration: 180, mode: 'turf' });
      await until(() => g.match && (g.match.state === 'playing' || g.match.state === 'intro' || g.match.state === 'countdown'), 20000);
      const lay = __G.level.layout && __G.level.layout.id;
      R(`${tag}api.startMatch({ mapId: '${id}' }) builds ${id} and starts the match (the harness' MAP=${id})`, g.mapDef && g.mapDef.id === id && lay === id && g.match && !g.match.attract && __G.level.blocks.length > 0,
        { mapDef: g.mapDef && g.mapDef.id, level: lay, state: g.match && g.match.state, blocks: __G.level.blocks.length });
    }
  } catch (e) {
    R('no exception', false, String(e && e.stack || e));
  } finally {
    if (G.net !== net0) { try { G.net.leave(); } catch (e) {} G.net = net0; }
    g.api.setSettings({ lastStage: lastStage0 });
    M._setup = setup0;
    if (flagged) delete flagged.wip;
  }
  return out;
})()
