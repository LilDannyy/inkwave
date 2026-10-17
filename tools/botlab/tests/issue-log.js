// Issue capture smoke: deliberate console calls, browser errors, slow frame and a 5 s bot stall.
(async () => {
  const { G } = await import('./src/core/ctx.js');
  const L = window.__issueLog, out = [], R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const before = L.snapshot().length;
  const oldMode = G.mode, oldMatch = G.match;
  G.mode = 'match'; G.match = { mode: 'turf', loading: false, actors: [] };
  console.error('issue-log-test-error'); console.warn('issue-log-test-warning');
  window.dispatchEvent(new ErrorEvent('error', { message: 'issue-log-test-onerror' }));
  L.frame(251);
  const bot = { noProg: 1 }, actor = { bot, alive: true, pos: { x: 0, y: 0, z: 0 } };
  G.match.actors.push(actor); L.bots(5.1);
  const rows = L.snapshot().slice(before), kinds = rows.map(x => x.kind);
  const expected = ['console-error', 'console-warn', 'window-error', 'slow-frame', 'stuck-bot'];
  R('captures error, warning, window.onerror, slow frame and stuck episode exactly once', expected.every(k => kinds.filter(x => x === k).length === 1), kinds);
  const check = rows.find(x => x.kind === 'stuck-bot');
  R('entries include timestamp, build, mode, stage, era/lava and online fields', !!check && !!check.at && 'build' in check && check.mode === 'turf' && 'stage' in check && 'era' in check && 'lava' in check && typeof check.online === 'boolean', check);
  G.mode = oldMode; G.match = oldMatch;
  return out;
})()
