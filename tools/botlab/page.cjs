// Botlab page test: boots a match, then runs PAGE (a script evaluated in the game page that returns [{ name, ok, info }])
// and prints PASS / FAIL lines + RESULT n/m. PAGE_ARGS (a string) reaches the script as window.__pageArgs; PAGE_ARGS2 (optional)
// then reloads the page (localStorage kept), boots again and runs PAGE once more with those args ('[reload] ' results).
//   MAP=halyard MODE=turf PAGE=path/to/test-page.js tools/botlab/run.sh tools/botlab/page.cjs
//   (W=960 H=600: the page at that size instead of the window's)
// MAP=testbox / podbox are test-only arenas (tools/botlab/testmaps.cjs, never shipped).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const { TEST_MAPS, defineTestMap } = require(process.env.S + '/testmaps.cjs');
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 600000));   // (hard exit if a hung page blocks quitting)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MAP = process.env.MAP || 'halyard', MODE = process.env.MODE || 'turf';
let claimed = false; app.on('browser-window-created', (_, win) => { if (claimed) return; claimed = true;
  if (BrowserWindow.getAllWindows().length > 1) return;
  win.webContents.setBackgroundThrottling(false);
  const errs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level)) || /TypeError|ReferenceError/.test(m)) errs.push(m.slice(0, 300)); });
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    const js = (c) => win.webContents.executeJavaScript(c, true);
    // boot the game page and start the match (again after a reload: PAGE_ARGS2)
    const boot = async () => {
      await win.loadURL('app://inkwave/index.html?autopilot');
      if (process.env.W) win.setContentSize(+process.env.W, +(process.env.H || 600));   // [b5-jumpui] W / H: the page's size (default the window's)
      for (let i = 0; i < 80; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
      await js('window.__inkwave._onPointerUnlock = () => {}; 0');
      if (TEST_MAPS.includes(MAP)) await js(defineTestMap(MAP));   // (a test-only arena: testmaps.cjs)
      await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', duration: 180, mode: '${MODE}' })`);
      { const got = await js(`(window.__inkwave.mapDef && window.__inkwave.mapDef.id) || null`); if (got !== MAP) { console.log(`MAP MISMATCH: asked for ${MAP}, the game built ${got} (a stage missing from MAPS falls back to the first one)`); app.exit(3); return false; } }   // (never test the wrong stage silently)
      for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
      return true;
    };
    let pass = 0, total = 0;
    const runPage = async (pageArgs, tag) => {
      await js(`window.__pageArgs = ${JSON.stringify(pageArgs)}; 0`);   // (PAGE_ARGS: the test's own options, e.g. which scenes)
      const out = await js(fs.readFileSync(process.env.PAGE, 'utf8'));
      for (const r of out) { console.log((r.ok ? 'PASS ' : 'FAIL ') + tag + r.name + (r.info !== undefined ? '  ' + JSON.stringify(r.info) : '')); pass += r.ok; total++; }
    };
    try {
      if (!(await boot())) return;
      await runPage(process.env.PAGE_ARGS || '', '');
      // PAGE_ARGS2: reload the page (localStorage kept), boot again and run PAGE a second time with these args — for
      // checks that something saved survives a reload
      if (process.env.PAGE_ARGS2) { if (!(await boot())) return; await runPage(process.env.PAGE_ARGS2, '[reload] '); }
      console.log(`RESULT ${pass}/${total}`);
    } catch (e) { console.log('HARNESS ERROR', e.message, e.stack); }   // [b5-jumpui] (the stack)
    console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 5).join(' || ') : 'none');
    app.quit();
  });
});
