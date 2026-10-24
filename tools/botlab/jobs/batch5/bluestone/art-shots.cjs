// Bluestone art phase (scratch): the art phase's pictures, one Electron instance, JPEGs (< 300 KB) into
// tools/botlab/jobs/batch5/stages/bluestone/out/art/ (OUT= to put them elsewhere: a before set, a probe).
//   BOTLAB_OUT=… SLOTS=3 SET=places TIME=day tools/botlab/run.sh tools/botlab/jobs/batch5/bluestone/art-shots.cjs
// SET=places  the eight places (the circus, the knee, Swimston, the quay, Hoki Lane, the arcade, the forecourt, the Halo)
//             × the three eras, one camera per place (the era set instantly with debugJump; bots frozen, paint cleared,
//             characters hidden): places-<place>-e<n>-<time>.jpg. ONLY=circus,knee picks places; ERAS=1,3 picks eras.
// SET=jump    the jump from Swimston and the knee on the real schedule of a 3:00 Turf War (some ink down first, the HUD
//             up): J − 10, J + 0, J + 1.5, J + 3 and done + 1 of jump 1 (1880s → TODAY) and of jump 2 (TODAY → 3000s):
//             jump<k>-<view>-<moment>-<time>.jpg
// SET=cams    CAMS='[{"name":"x","from":[…],"look":[…],"fov":60}]' in ERAS (default 1,2,3): cam-<name>-e<n>-<time>.jpg
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const ROOT = process.env.BOTLAB_ROOT || '.';
const OUT = process.env.OUT || `${ROOT}/tools/botlab/jobs/batch5/stages/bluestone/out/art`;
const W = +(process.env.W || 1280), H = +(process.env.H || 720), SET = process.env.SET || 'places', TIME = process.env.TIME || 'day';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean), ERAS = (process.env.ERAS || '1,2,3').split(',').map(Number);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, +(process.env.WATCHDOG || 1500000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const want = (n) => !ONLY.length || ONLY.some((o) => n.startsWith(o));

// the eight places (Alpha's half), each from a kid's eye (1.7 m over the floor it stands on) unless the place is a view
const PLACES = {
  circus: { from: [1.2, 1.75, -16.4], look: [0, 5.4, -3], fov: 74 },             // the circus ring at 6 o'clock: the Clock Steps, the clock row, the dome, Tartar
  knee: { from: [-17.9, 1.75, -32.0], look: [-27, 3.0, -13], fov: 74 },          // up Swimston into the knee: Prow Place, the Customs House, the cab rank, the hotel
  swimston: { from: [-19.5, 2.75, -50.5], look: [-21, 3.6, -26], fov: 72 },       // from the forecourt steps up Swimston: the tram at its stop, the arcade, the GPO
  quay: { from: [-8.2, 1.75, -45], look: [-3, 2.4, -24], fov: 74 },               // the quay's south end: the river corner, the bridge site, the hotel's arch
  hoki: { from: [-33.6, 1.75, -48.5], look: [-34.6, 2.6, -28], fov: 72 },          // Hoki Lane under the viaduct: the street art, the arcade's grilles
  arcade: { from: [-28.5, 2.35, -41.3], look: [-28.5, 2.6, -29], fov: 76 },        // inside the Royal Arcade
  forecourt: { from: [-8.8, 2.75, -51.4], look: [-26, 3.6, -60], fov: 74 },        // the forecourt terrace: the ticket booth, the turntable, the grip car, the engine house
  halo: { from: [-12.6, 4.15, -14.2], look: [2, 6.2, -6], fov: 74 },               // the balcony landing, up at the Halo (the 3000s) / the dome's drum
};
const VIEWS = {
  swimston: { from: [-20.5, 2.6, -47], look: [-17.5, 2.6, -24], fov: 72 },
  knee: { from: [-21.5, 2.4, -32], look: [-17, 2.8, -12], fov: 74 },
};
const pre = `const g = window.__inkwave, E = g.match.eras, W = __G.eraWorld, P = __G.paint, THREE = window.__THREE;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));`;

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
    const start = async (o) => {
      await js(`window.__inkwave.debug.unfreeze?.(); window.__inkwave.api.startMatch(${JSON.stringify(o)})`);
      for (let i = 0; i < 300; i++) { if (await js(`window.__inkwave.match?.state === 'playing' && !!window.__inkwave.match.eras`)) break; await wait(250); }
      await wait(2500);
      await js(`(async () => { window.__THREE = await import('three'); const g = window.__inkwave; g.debug.freeze();
        for (const a of g.match.actors) { if (a.bot) { a.bot._u0 = a.bot.update; a.bot.update = () => {}; } if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } a.character.root.visible = false; a.character.setVisible?.(false); }
        __G.projectiles?.clear?.(); __G.paint.clear(); return 1; })()`);
    };
    const shot = async (name, cam, { hud = false, chars = false, js: code = '' } = {}) => {
      const r = await js(`(() => { try { ${pre} ${code}
        for (const a of g.match.actors) { a.character.root.visible = ${chars}; a.character.setVisible?.(${chars}); }
        const C = ${JSON.stringify(cam)}; g.settings.fov = C.fov;
        g.rig.cinematic(new THREE.Vector3(...C.from), new THREE.Vector3(...C.from), new THREE.Vector3(...C.look), new THREE.Vector3(...C.look), 99, () => {});
        g.hud?.setVisible?.(${hud}); g.menus?.show?.(null);
        document.querySelectorAll('.iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
        document.querySelectorAll('.iw-hud').forEach((e) => { e.style.visibility = ${hud ? "'visible'" : "'hidden'"}; });
        g.debug.step(1000 / 60); return { era: E.era, phase: E.phase, front: +E.front.toFixed(1) }; } catch (e) { return 'ERR ' + e.stack; } })()`);
      await wait(600);
      await js(`window.__inkwave.debug.step(1000 / 60); 0`); await wait(400);
      const f = `${OUT}/${name}.jpg`;
      if (frame) { let q = 84, buf = frame.toJPEG(q); while (buf.length > 290 * 1024 && q > 40) { q -= 6; buf = frame.toJPEG(q); } fs.writeFileSync(f, buf); }
      console.log('shot', name, fs.existsSync(f) ? fs.statSync(f).size : 0, JSON.stringify(r).slice(0, 200));
    };
    const at = (t) => js(`(() => { ${pre} tAt(${t}); return +E.S.clock.t.toFixed(2); })()`);

    if (SET === 'places' || SET === 'cams') {
      await start({ mapId: 'bluestone', duration: 180, time: TIME, mode: 'turf' });
      const cams = SET === 'places' ? PLACES : Object.fromEntries(JSON.parse(process.env.CAMS || '[]').map((c) => [c.name, c]));
      for (const e of ERAS) {
        await js(`(() => { ${pre} E.debugJump(${e}, { instant: true }); step(0.1); return E.era; })()`);
        for (const [name, cam] of Object.entries(cams)) if (want(name)) await shot(`${SET === 'places' ? 'places' : 'cam'}-${name}-e${e}-${TIME}`, cam);
      }
    }
    if (SET === 'jump') {
      await start({ mapId: 'bluestone', duration: 180, time: TIME, mode: 'turf' });
      await js(`(() => { ${pre} const ink = (x, z, r, t) => P.splat(new THREE.Vector3(x, 0.3, z), r, t, { instant: true });
        for (let i = 0; i < 16; i++) ink(-22 + (i % 4) * 2.2, -46 + i * 1.7, 1.8, i & 1);
        for (let i = 0; i < 8; i++) ink(-26 + (i % 3) * 3, -24 + i * 1.5, 1.6, (i >> 1) & 1);
        for (let i = 0; i < 8; i++) ink(-12 + (i % 2) * 3, -27 + i * 0.8, 1.5, 0);
        g.match.time = g.match.duration - 39.6; step(0.1); return 1; })()`);
      const done = await js(`(() => { ${pre} return W.doneOff; })()`);
      for (const [k, J] of [[1, 60], [2, 120]]) {
        for (const [m, t] of [['J-10', J - 10], ['J+0', J + 0.05], ['J+1.5', J + 1.5], ['J+3', J + 3], ['done+1', J + done + 1]]) {
          await at(t);
          for (const [v, cam] of Object.entries(VIEWS)) if (want(v)) await shot(`jump${k}-${v}-${m}-${TIME}`, cam, { hud: true });
        }
      }
    }
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} error line(s)`); for (const l of uniq.slice(0, 20)) console.log('  ' + l);
    app.quit();
  });
});
