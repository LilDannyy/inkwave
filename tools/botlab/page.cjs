// Botlab page test: boots a match, then runs PAGE (a script evaluated in the game page that returns [{ name, ok, info }])
// and prints PASS / FAIL lines + RESULT n/m.
//   MAP=halyard MODE=turf PAGE=path/to/test-page.js tools/botlab/run.sh tools/botlab/page.cjs
// MAP=testbox is a flat test arena defined here (never shipped); MAP=podbox is the same with sprout pods (src/game/pods.js)
// and a tower track (tools/botlab/tests/pods.js).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
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
    await win.loadURL('app://inkwave/index.html?autopilot');
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 80; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    if (MAP === 'testbox' || MAP === 'podbox') await js(`(async () => {
      // test-only arena: a flat 56 x 96 m deck, spawn steps and one wall (zipline target); never shipped
      const { MAPS } = await import('./src/config.js'); const { MAP_LAYOUTS } = await import('./src/world/maps.js');
      const id = '${MAP}';
      if (!MAPS.find((m) => m.id === id)) MAPS.push({ id, name: id === 'podbox' ? 'Pod Box' : 'Test Box', blurb: '', theme: 'day', times: { day: 'day', dusk: 'sunset' } });
      const B = (x0, x1, y0, y1, z0, z1, o = {}) => ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color: '#d8d2c4', pattern: 3, ...o });
      MAP_LAYOUTS[id] = { id, bounds: { minX: -28, maxX: 28, minZ: -48, maxZ: 48 }, spawnPads: [[0, 2.4, -44], [0, 2.4, 44]], spawnBarrier: 4.2,
        single: [B(-28, 28, -1.2, 0, -40, 40)], half: [B(-8, 8, -1.2, 2.4, -48, -40), B(14, 15, 0, 4, -8, 8)], decor: { lamps: [], palms: [], flags: [] } };
      // podbox: sprout pods (mirrored) — open ground, one hard by the wall, one by the water's edge, one beside the tower
      // track, one on it (off in Tower Command), a calibration range; the track runs x = -8 from the centre to z = 32
      if (id === 'podbox') MAP_LAYOUTS.podbox.half.push(...[[0, -6], [13.1, 0], [27.4, 12], [-6, 14], [-8, 24], [18, -20]].map(([x, z]) =>
        B(x - 0.45, x + 0.45, 0, 0.5, z - 0.45, z + 0.45, { paint: false, color: '#9a948a' })));   // (the planters: the stage's own)
      if (id === 'podbox') Object.assign(MAP_LAYOUTS.podbox, {
        tower: { path: [[0, 0], [-8, 0], [-8, 32]], checkpoints: [[-8, 16]] },
        pods: { mirror: true, list: [
          { id: 'mid', pos: [0, 0, -6], rotY: 0, size: [3, 1.8, 0.9] },
          { id: 'wall', pos: [13.1, 0, 0], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'edge', pos: [27.4, 0, 12], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'track', pos: [-6.0, 0, 14], rotY: Math.PI / 2, size: [3, 1.8, 0.9] },
          { id: 'ontrack', pos: [-8, 0, 24], rotY: 0, size: [3, 1.8, 0.9] },
          { id: 'calib', pos: [18, 0, -20], rotY: 0, size: [3, 1.8, 0.9] },
        ] },
      });
      return true; })()`);
    await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', duration: 180, mode: '${MODE}' })`);
    for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    try {
      const out = await js(fs.readFileSync(process.env.PAGE, 'utf8'));
      let pass = 0;
      for (const r of out) { console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.info !== undefined ? '  ' + JSON.stringify(r.info) : '')); pass += r.ok; }
      console.log(`RESULT ${pass}/${out.length}`);
    } catch (e) { console.log('HARNESS ERROR', e.message); }
    console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 5).join(' || ') : 'none');
    app.quit();
  });
});
