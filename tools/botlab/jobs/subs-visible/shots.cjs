// Sub visibility pass: pictures of every sub weapon's world model (stage.js scenes), from a player ~8 m away and from
// the thrower's own camera, as JPEGs + info.json (each model's world box and position).
//   MAP=testbox OUT=/dir tools/botlab/run.sh tools/botlab/jobs/subs-visible/shots.cjs
// ONLY='bomb,sticky' limits the kinds; W / H the frame size (default 1280 × 720). Run it on the old build and the new one
// into two folders, then compose.py pairs them up (before | after).
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
require(process.env.S + '/offscreen-boot.cjs');
const { TEST_MAPS, defineTestMap } = require(process.env.S + '/testmaps.cjs');
const MAP = process.env.MAP || 'testbox';
const OUT = process.env.OUT || path.join(process.env.BOTLAB_ROOT || '.', '.botlab', 'subs-visible');
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, 480000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  const logs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error|warn/i.test(String(e.level)) && !/Security Warning|Autofill/.test(m)) logs.push(`[${e.level}] ${m.slice(0, 300)}`); });
  let frame = null, paints = 0; win.webContents.on('paint', (_e, _d, img) => { frame = img; paints++; });
  win.webContents.once('did-finish-load', async () => {
    win.setContentSize(W, H);
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    fs.mkdirSync(OUT, { recursive: true });
    if (TEST_MAPS.includes(MAP)) await js(defineTestMap(MAP));
    // the same team colours every run, and a seeded Math.random (stage.js re-seeds it per picture: the same spins and
    // bounces before and after a change)
    await js(`(async () => { const { TEAM_PALETTES } = await import('./src/config.js'); window.__inkwave._pickPalette = () => TEAM_PALETTES[1];
      let s = 20260930; window.__rs = (v) => { s = v; }; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; return 1; })()`);
    await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', duration: 180, time: 'day', mode: 'turf' })`);
    for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    await wait(2500);
    const n = await js(fs.readFileSync(path.join(__dirname, 'stage.js'), 'utf8'));
    console.log('poses', n);
    const poses = (await js('window.__SV.POSES')).filter(([k]) => !ONLY.length || ONLY.includes(k));
    const info = [];
    await js('window.__SV.reset(); 0'); await wait(800);   // (the HUD's hidden before the first picture)
    for (const [kind, pose] of poses) {
      for (const cam of ['side', 'thrower']) {
        let r;
        try { r = await js(`window.__SV.stage(${JSON.stringify(kind)}, ${JSON.stringify(pose)}, ${JSON.stringify(cam)})`); } catch (e) { r = { kind, pose, cam, err: e.message }; }
        const p0 = paints; for (let i = 0; i < 40 && paints < p0 + 2; i++) await wait(50);
        await wait(250);
        const f = path.join(OUT, `${kind}-${pose}-${cam}.jpg`);
        if (frame) fs.writeFileSync(f, frame.toJPEG(88));
        info.push(r);
        console.log('shot', path.basename(f), JSON.stringify(r));
      }
    }
    fs.writeFileSync(path.join(OUT, 'info.json'), JSON.stringify(info, null, 1));
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} unique warning/error line(s)`); for (const l of uniq.slice(0, 30)) console.log('  ' + l);
    app.quit();
  });
});
