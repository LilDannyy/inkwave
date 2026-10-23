// Issue capture smoke: deliberate console calls, browser errors, slow frame and a 5 s bot stall.
// [b5-beta1] The stuck-bot watch judged as the botlab harnesses judge it (< 1 m from every place in the last 3 s of match
// time while wanting to move; holds on purpose, the dead and tower riders left out), whatever the frame rate: a bot
// walking at 3 m/s with its noProg ticking is not stuck at 60 Hz or 120 Hz (the old frame-to-frame test logged it), a bot
// holding its spot on purpose is not, nor is a lobby standing still in a pause, the intro or the results (the old watch
// logged them together, in bursts); a bot pressed into a wall is — once, past 5 s, with where and what it was doing.
(async () => {
  const { G } = await import('./src/core/ctx.js');
  const { BotBrain } = await import('./src/game/bots.js');
  const L = window.__issueLog, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const before = L.snapshot().length;
  const oldMode = G.mode, oldMatch = G.match;
  G.mode = 'match'; G.match = { mode: 'turf', state: 'playing', loading: false, actors: [] };
  console.error('issue-log-test-error'); console.warn('issue-log-test-warning');
  window.dispatchEvent(new ErrorEvent('error', { message: 'issue-log-test-onerror' }));
  L.frame(251);
  // a stand-in bot (BotBrain's own holdingOnPurpose on it) and its actor
  const kid = (o = {}) => { const bot = Object.assign(Object.create(BotBrain.prototype), { noProg: 1, t: 0, path: null, pi: 0, zHoldUntil: 0, tHoldUntil: 0, kHoldUntil: 0, perchUntil: 0, mode: 'paint', goal: -1 }, o.bot || {});
    return { bot, alive: true, isLocal: true, pos: { x: 0, y: 0, z: 0 }, ...(o.actor || {}) }; };
  // run the watch for `secs` of match time at `hz`, moving each actor by its own step(a, t, dt)
  const run = (list, secs, hz, step) => { G.match.actors = list; const dt = 1 / hz; for (let t = 0; t < secs; t += dt) { for (const a of list) { a.bot.t += dt; step && step(a, t, dt); } L.bots(dt); } };
  const stuckRows = (from) => L.snapshot().slice(from).filter((x) => x.kind === 'stuck-bot');
  // the classic five, once each: a bot standing in a wall (stuck from 2.75 s, when 3 s of samples show it under 1 m; past
  // 5 s of that at 7.75 s)
  { const a = kid(); run([a], 8.5, 60); }
  const rows = L.snapshot().slice(before), kinds = rows.map(x => x.kind);
  const expected = ['console-error', 'console-warn', 'window-error', 'slow-frame', 'stuck-bot'];
  R('captures error, warning, window.onerror, slow frame and stuck episode exactly once', expected.every(k => kinds.filter(x => x === k).length === 1), kinds);
  const check = rows.find(x => x.kind === 'stuck-bot');
  R('entries include timestamp, build, mode, stage, era/lava and online fields', !!check && !!check.at && 'build' in check && check.mode === 'turf' && 'stage' in check && 'era' in check && 'lava' in check && typeof check.online === 'boolean', check);
  // [b5-beta1] what the old frame-to-frame watch logged and the harnesses never count
  for (const hz of [60, 120]) {
    const n0 = L.snapshot().length;
    const walker = kid(); run([walker], 8, hz, (a, t, dt) => { a.pos.x += 3 * dt; });   // walking while firing, noProg ticking
    R(`a bot walking at 3 m/s with noProg ticking is not stuck (${hz} Hz)`, stuckRows(n0).length === 0, stuckRows(n0));
  }
  { const n0 = L.snapshot().length;
    const guard = kid({ bot: { zHoldUntil: 99, path: [1, 2], pi: 2 } }), keeper = kid({ bot: { kHoldUntil: G.time + 99 } }), perch = kid({ bot: { perchUntil: 99 } });
    const dead = kid({ actor: { alive: false } }), rider = kid();
    G.match.tower = { riderList: [rider] };
    run([guard, keeper, perch, dead, rider], 8, 60);
    delete G.match.tower;
    R('holding a spot on purpose (zone guard, keeper, perch), dead, or riding the tower: not stuck', stuckRows(n0).length === 0, stuckRows(n0)); }
  { const n0 = L.snapshot().length;   // the whole lobby standing still while the match is paused, or at its finish (the results)
    const still = [kid(), kid(), kid()];
    G.match.paused = true; run(still, 8, 60); G.match.paused = false;
    G.match.state = 'finish'; run(still, 8, 60); G.match.state = 'intro'; run(still, 8, 60); G.match.state = 'playing';
    R('bots standing still while the match is paused, in its intro or at its finish: not stuck (they were logged together, in bursts)', stuckRows(n0).length === 0, stuckRows(n0).length); }
  { const n0 = L.snapshot().length;
    const wall = kid({ bot: { mode: 'paint', path: [0, 1, 2], pi: 1 } });
    run([wall], 7.25, 120, (a, t) => { a.pos.x = 0.3 * Math.sin(t * 9); });   // pressing into a wall, jittering 0.3 m
    const early = stuckRows(n0).length;
    run([wall], 1.25, 120, (a, t) => { a.pos.x = 0.3 * Math.sin(t * 9); });
    const got = stuckRows(n0);
    R('a bot pressed into a wall: no entry before 5 s, one after, with where it was and what it was doing', early === 0 && got.length === 1 && got[0].duration > 5 && Array.isArray(got[0].pos) && got[0].botMode === 'paint' && got[0].path === '1/3', { early, got }); }
  // [b5-beta1] the stage state as plain values, and nothing the desktop's IPC can't clone (a Highmark Foundry match's
  // m.lava.state is a method: every entry threw 'An object could not be cloned' inside the frame and was lost)
  { const n0 = L.snapshot().length;
    G.match.lava = { state() { return { t: 1 }; }, st: { phase: 'high' } }; G.match.eras = { era: 2 };
    let threw = null; try { L.frame(300); } catch (e) { threw = String(e && e.message || e); }
    const row = L.snapshot().slice(n0).find((x) => x.kind === 'slow-frame');
    let ipc = null; try { if (window.inkwaveNative?.issue) window.inkwaveNative.issue(row); ipc = 'ok'; } catch (e) { ipc = String(e && e.message || e); }
    delete G.match.lava; delete G.match.eras;
    R('an entry in a lava / eras match: no throw, its era and lava phase as plain values, and the desktop IPC takes it', !threw && row && row.lava === 'high' && row.era === 2 && ipc === 'ok' && 'world' in row, { threw, ipc, lava: row && typeof row.lava, era: row && row.era, world: row && row.world, native: !!window.inkwaveNative?.issue }); }
  G.mode = oldMode; G.match = oldMatch;
  return out;
})()
