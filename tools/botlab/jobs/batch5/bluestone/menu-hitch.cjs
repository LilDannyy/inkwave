// [b5-bluestone] (the Mac mini helper, JOB-34) does the menu backdrop hitch? Boots the game to its MENU (no match) with
// ?map=<MAP>&time=<TIME> (the backdrop at that stage and time of day), then samples requestAnimationFrame intervals in real
// time for SECS s (default 15): the longest frames (with their time since the page's api came up), how many passed 50 /
// 100 ms, and Bluestone's era-world warm-up state (warmed, the cloud cache) at the end.
// (frames before the api came up are the page load: reported apart as bootWorst; the menu is everything after it)
//   MAP=bluestone TIME=dusk SECS=15 tools/botlab/run.sh [--disable-gpu-shader-disk-cache] tools/botlab/jobs/batch5/bluestone/menu-hitch.cjs
const { app } = require('electron');
require(process.env.S + '/offscreen-boot.cjs');
const MAP = process.env.MAP || 'bluestone', TIME = process.env.TIME || 'day', SECS = +(process.env.SECS || 15);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 300000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  const errs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level))) errs.push(m.slice(0, 200)); });
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    const js = (c) => win.webContents.executeJavaScript(c, true);
    const t0 = Date.now();
    await win.loadURL(`app://inkwave/index.html?map=${MAP}&time=${TIME}`);
    // the sampler goes in as soon as the page runs, before the api (the backdrop's build and warm-up are what we watch)
    await js(`(() => { const S = window.__mh = { t: [], start: performance.now() }; let last = performance.now();
      const f = (now) => { S.t.push([+(now - S.start).toFixed(1), +(now - last).toFixed(1)]); last = now; const ew = window.__G && window.__G.eraWorld; if (S.warmAt == null && ew && ew._warmed) S.warmAt = +(now - S.start).toFixed(0); if (S.apiAt == null && window.__inkwave && window.__inkwave.api) S.apiAt = +(now - S.start).toFixed(0); requestAnimationFrame(f); }; requestAnimationFrame(f); return 0; })()`);
    let apiAt = null;
    for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) { apiAt = Date.now() - t0; break; } await wait(250); }
    await wait(SECS * 1000);
    const r = await js(`(() => { const g = window.__inkwave, G = window.__G, S = window.__mh, ew = G && G.eraWorld;
      const all = S.t.slice(1), fr = all.filter((x) => S.apiAt != null && x[0] > S.apiAt), worst = [...fr].sort((a, b) => b[1] - a[1]).slice(0, 5), boot = all.filter((x) => !(S.apiAt != null && x[0] > S.apiAt));
      return { apiAtPage: S.apiAt, warmAt: S.warmAt, bootFrames: boot.length, bootWorst: [...boot].sort((a, b) => b[1] - a[1]).slice(0, 3), mode: G && G.mode, map: g && g.mapDef && g.mapDef.id, theme: g && g.theme, frames: fr.length, over50: fr.filter((x) => x[1] > 50).length,
        over100: fr.filter((x) => x[1] > 100).length, worst, p95: [...fr].map((x) => x[1]).sort((a, b) => a - b)[Math.floor(fr.length * 0.95)] || null,
        eras: ew ? { warmed: !!ew._warmed, clouds: ew._cloudCache ? ew._cloudCache.size : null, stats: ew.stats || null } : null }; })()`);
    console.log(`MENU ${MAP} ${TIME}: api up ${apiAt} ms | ${JSON.stringify(r)}`);
    if (errs.length) console.log('CONSOLE ERRORS ' + errs.length + ': ' + [...new Set(errs)].slice(0, 3).join(' | '));
    app.quit();
  });
});
