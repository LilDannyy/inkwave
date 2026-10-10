// Bluestone eras (scratch): the engine phase's pictures, one Electron instance, JPEGs straight into out/engine/.
//   BOTLAB_OUT=… SLOTS=3 tools/botlab/run.sh tools/botlab/jobs/batch5/bluestone/eras-shots.cjs        (ONLY=name,name to pick)
// Each scene: page code that puts the eras where the picture needs them (E = match.eras, W = G.eraWorld; debugJump and
// stepping the frozen sim), then a fixed camera. HUD shown where the picture is what a player sees.
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const ROOT = process.env.BOTLAB_ROOT || '.';
const OUT = `${ROOT}/tools/botlab/jobs/batch5/stages/bluestone/out/engine`;
const W = 1280, H = 720, ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, 900000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// cameras
const SWIM = { from: [-20.5, 2.0, -49], look: [-15.5, 4.0, -10], fov: 72 };           // a kid on Swimston looking up the leg toward the knee and the dome
const SPAWN = { from: [-18, 5.0, -64.5], look: [-5.4, 1.8, 0], fov: 82 };              // the spawn camera (spawnA)
const CIRCUS = { from: [-19, 2.0, 2], look: [0, 5.0, 0], fov: 74 };                   // the circus ring's west side, toward the dome (the Halo over it in era 3)
const HALO = { from: [-21, 6.5, -21], look: [-6, 4.6, -7], fov: 58 };                 // the Halo's south-west side from the knee
const PHONE = { from: [-6, 3.4, -14], look: [0, 6.8, 0], fov: 46 };                   // Tartar under the dome
const BRIDGE = { from: [-12, 5.5, -40], look: [3, 0, -31], fov: 62 };                 // the quay, the Iron Bridge site
const PROBE = { from: [-18.25, 7.5, -36], look: [-12.25, 0.4, -26], fov: 55 };      // where the era-1 crates stand (the GTAO probe)

const pre = `const g = window.__inkwave, E = g.match.eras, W = __G.eraWorld, P = __G.paint, THREE = window.__THREE;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));
  const ink = (x, y, z, r, team) => P.splat(new THREE.Vector3(x, y, z), r, team, { instant: true });`;
const SCENES = [
  ...[1, 2, 3].flatMap((e) => [
    { name: `era${e}-spawn`, cam: SPAWN, js: `E.debugJump(${e}, { instant: true }); step(0.3);` },
    { name: `era${e}-circus`, cam: CIRCUS, js: `E.debugJump(${e}, { instant: true }); step(0.3);` },
    { name: `era${e}-top`, cam: { from: [-0.02, 170, 0], look: [0, 0, 0], fov: 50 }, js: `E.debugJump(${e}, { instant: true }); step(0.3);` },
  ]),
  // the jump as a player on Swimston sees it (jump 1, HUD on): J − 10, J + 0, J + 1.5, J + 3, done + 1
  { name: 'jump-swimston-J-10', cam: SWIM, hud: true, js: `E.debugJump(1, { instant: true }); step(0.2); window.__J = E.debugJump(2, { inS: 10.6 }); step(0.9);` },
  { name: 'jump-phone-J+0', cam: PHONE, hud: true, js: `tAt(window.__J.at + 0.02);` },
  { name: 'jump-swimston-J+1.5', cam: SWIM, hud: true, js: `tAt(window.__J.at + 1.5);` },
  { name: 'jump-swimston-J+3', cam: SWIM, hud: true, js: `tAt(window.__J.at + 3.0);` },
  { name: 'jump-swimston-done+1', cam: SWIM, hud: true, js: `tAt(window.__J.doneAt + 1.0);` },
  // jump 2 from the circus: the holograms and the Halo building
  { name: 'jump2-circus-J-5', cam: HALO, hud: true, js: `window.__J2 = E.debugJump(3, { inS: 5.4 }); step(0.5);` },
  { name: 'jump2-circus-J+0.6', cam: HALO, hud: true, js: `tAt(window.__J2.at + 0.6);` },
  { name: 'jump2-circus-done+1', cam: HALO, hud: true, js: `tAt(window.__J2.doneAt + 1.0);` },
  // a vanishing piece with ink on it, before and after its flip (Practice's rewind 3 → 1: the Halo goes)
  { name: 'vanish-halo-inked-before', cam: HALO, js: `E.debugJump(3, { instant: true }); step(0.2);
      for (const b of __G.level.blocks.filter((b) => b.tag === 'halo' && b.center.z < 0)) ink(b.center.x, 5.75, b.center.z, 1.8, 0);
      for (let i = 0; i < 9; i++) ink(-8 + i * 1.6, 0.4, -12 + (i % 3), 1.6, 1); step(0.4);
      window.__R = E.debugJump(1, { inS: 0 }); step(0.3);` },
  { name: 'vanish-halo-after-flip', cam: HALO, js: `tAt(window.__R.at + 0.85);` },
  // an appearing piece arriving blank: the quay inked, the Iron Bridge appears (jump 1 → 2) with no ink on it
  { name: 'appear-bridge-before', cam: BRIDGE, js: `tAt(window.__R.doneAt + 1.3); E.debugJump(1, { instant: true }); step(0.2);
      for (let i = 0; i < 10; i++) ink(-7.5, 0.4, -46 + i * 2.2, 1.8, i & 1); for (let i = 0; i < 8; i++) ink(-2 + i * 1.6, 0.0, -31.5, 1.8, 0); step(0.4);
      window.__B = E.debugJump(2, { inS: 0.4 }); step(0.2);` },
  { name: 'appear-bridge-after', cam: BRIDGE, js: `tAt(window.__B.at + 1.9);` },
  { name: 'gtao-probe-era2', cam: PROBE, high: true, js: `tAt(window.__B.doneAt + 1.2); E.debugJump(2, { instant: true }); step(0.3);` },
  { name: 'gtao-probe-era1', cam: PROBE, high: true, js: `E.debugJump(1, { instant: true }); step(0.3);` },
];

let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  const logs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level))) logs.push(m.slice(0, 300)); });
  let frame = null; win.webContents.on('paint', (_e, _d, img) => { frame = img; });
  win.webContents.once('did-finish-load', async () => {
    win.setContentSize(W, H);
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    fs.mkdirSync(OUT, { recursive: true });
    const t0 = Date.now();
    await js(`window.__inkwave.api.startMatch({ mapId: 'bluestone', duration: 180, time: 'day', mode: 'turf' })`);
    for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    const loadMs = Date.now() - t0;
    await wait(2500);
    await js(`(async () => { window.__THREE = await import('three'); const g = window.__inkwave; g.debug.freeze();
      for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } a.character.root.visible = false; a.character.setVisible?.(false); }
      __G.projectiles?.clear?.(); __G.paint.clear(); window.__q0 = g.settings.quality; return 1; })()`);
    const rep = await js(`({ loadMs: ${loadMs}, stats: __G.eraWorld.stats, perf: window.__inkwave.perf, quality: window.__inkwave.settings.quality })`);
    console.log('REPORT ' + JSON.stringify(rep));
    for (const s of SCENES) {
      if (ONLY.length && !ONLY.includes(s.name)) { if (s.js.includes('window.__')) await js(`(() => { ${pre} ${s.js} return 1; })()`); continue; }
      const r = await js(`(() => { try { ${pre}
        const g2 = g; if (${!!s.high} && g2.settings.quality !== 'high') { g2.settings.quality = 'high'; g2.R.applySettings(g2.settings); } else if (${!s.high} && g2.settings.quality !== window.__q0) { g2.settings.quality = window.__q0; g2.R.applySettings(g2.settings); }
        ${s.js}
        const C = ${JSON.stringify(s.cam)}; g.settings.fov = C.fov;
        g.rig.cinematic(new THREE.Vector3(...C.from), new THREE.Vector3(...C.from), new THREE.Vector3(...C.look), new THREE.Vector3(...C.look), 99, () => {});
        g.hud?.setVisible?.(${!!s.hud}); g.menus?.show?.(null);
        document.querySelectorAll('.iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
        document.querySelectorAll('.iw-hud').forEach((e) => { e.style.visibility = ${s.hud ? "'visible'" : "'hidden'"}; });
        g.debug.step(1000 / 60); return E.state(); } catch (e) { return 'ERR ' + e.stack; } })()`);
      await wait(700);
      await js(`window.__inkwave.debug.step(1000 / 60); 0`); await wait(450);
      const f = `${OUT}/${s.name}.jpg`;
      if (frame) fs.writeFileSync(f, frame.toJPEG(82));
      console.log('shot', s.name, (fs.existsSync(f) ? fs.statSync(f).size : 0), JSON.stringify(r).slice(0, 220));
    }
    // the minimap in each era and during the warning: base + ink + the module's live layer, drawn on a canvas
    const mms = await js(`(async () => { const g = window.__inkwave, E = g.match.eras, mm = g.minimap, out = {};
      const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
      const draw = () => { const c = document.createElement('canvas'); c.width = mm.w; c.height = mm.h; const x = c.getContext('2d'); x.fillStyle = '#20242c'; x.fillRect(0, 0, c.width, c.height); x.drawImage(mm.base, 0, 0); if (mm.inkC) x.drawImage(mm.inkC, 0, 0); E.drawMap(x, mm, null, mm.s, null, 0.12); return c.toDataURL('image/jpeg', 0.86); };
      for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); step(0.2); out['minimap-era' + e] = draw(); }
      E.debugJump(1, { instant: true }); step(0.2); E.debugJump(2, { inS: 9.4 }); step(0.4); out['minimap-warn-jump1'] = draw();
      step(13); E.debugJump(3, { inS: 9.4 }); step(0.4); out['minimap-warn-jump2'] = draw();
      return out; })()`);
    for (const [k, v] of Object.entries(mms || {})) { const f = `${OUT}/${k}.jpg`; fs.writeFileSync(f, Buffer.from(v.split(',')[1], 'base64')); console.log('shot', k, fs.statSync(f).size); }
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} error line(s)`); for (const l of uniq.slice(0, 20)) console.log('  ' + l);
    app.quit();
  });
});
