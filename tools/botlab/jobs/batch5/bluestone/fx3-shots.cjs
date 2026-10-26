// fix round 3 (scratch): the reviewer's rv3-shots.cjs with W / H, AJ_AT (the real shots' offsets from done, default 6) and
// SET=afterjump's moments as given. Its own header follows. reviewer's probe (scratch; art review 3: + SET=inkpair, each view without and with ink): SET=jump (a dense jump sequence from Swimston with a chosen palette) / SET=ink (ink at
// several places in each era, one palette) / SET=cams (CAMS json, ERAS). OUT, TIME, PALETTE, MOMENTS (comma list of
// offsets from J, 'done+1' allowed), JUMPS (1,2), ERAS.
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const OUT = process.env.OUT; const W = +(process.env.W || 1280), H = +(process.env.H || 720), SET = process.env.SET || 'jump', TIME = process.env.TIME || 'day';
const PAL = process.env.PALETTE || 'tangerine-cobalt';
const ERAS = (process.env.ERAS || '1,2,3').split(',').map(Number);
const JUMPS = (process.env.JUMPS || '1,2').split(',').map(Number);
const MOMENTS = (process.env.MOMENTS || '-10,0.05,0.6,1.0,1.4,1.8,2.2,3,done+1').split(',');
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, +(process.env.WATCHDOG || 1500000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWS = JSON.parse(process.env.VIEWS || JSON.stringify({
  swimston: { from: [-20.5, 2.6, -47], look: [-17.5, 2.6, -24], fov: 72 },
}));
const MAPID = process.env.MAP || 'bluestone';
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
    await js(`(async () => { const { TEAM_PALETTES } = await import('./src/config.js'); const p = TEAM_PALETTES.find((q) => q.id === '${PAL}'); if (p) window.__inkwave._setPalette?.(p); return !!p; })()`);
    const start = async (o) => {
      await js(`window.__inkwave.debug.unfreeze?.(); window.__inkwave.api.startMatch(${JSON.stringify(o)})`);
      for (let i = 0; i < 300; i++) { if (await js(`window.__inkwave.match?.state === 'playing' && (MAPID !== 'bluestone' || !!window.__inkwave.match.eras)`.replace('MAPID', JSON.stringify(MAPID)))) break; await wait(250); }
      await wait(2500);
      await js(`(async () => { const { TEAM_PALETTES } = await import('./src/config.js'); const p = TEAM_PALETTES.find((q) => q.id === '${PAL}'); if (p) window.__inkwave._setPalette(p); return !!p; })()`);
      await wait(500);
      const pal = await js(`(async () => { window.__THREE = await import('three'); const g = window.__inkwave; g.debug.freeze();
        for (const a of g.match.actors) { if (a.bot) { a.bot._u0 = a.bot.update; a.bot.update = () => {}; } if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } a.character.root.visible = false; a.character.setVisible?.(false); }
        __G.projectiles?.clear?.(); __G.paint.clear(); return JSON.stringify(g.palette || null); })()`);
      console.log('palette', pal);
    };
    const shot = async (name, cam, { hud = false } = {}) => {
      const r = await js(`(() => { try { ${pre}
        for (const a of g.match.actors) { a.character.root.visible = false; a.character.setVisible?.(false); }
        const C = ${JSON.stringify(cam)}; g.settings.fov = C.fov;
        g.rig.cinematic(new THREE.Vector3(...C.from), new THREE.Vector3(...C.from), new THREE.Vector3(...C.look), new THREE.Vector3(...C.look), 99, () => {});
        g.hud?.setVisible?.(${hud}); g.menus?.show?.(null);
        document.querySelectorAll('.iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
        document.querySelectorAll('.iw-hud').forEach((e) => { e.style.visibility = ${hud ? "'visible'" : "'hidden'"}; });
        g.debug.step(1000 / 60); return E ? { era: E.era, phase: E.phase, front: +E.front.toFixed(1), t: +E.S.clock.t.toFixed(2) } : { map: g.mapDef?.id }; } catch (e) { return 'ERR ' + e.stack; } })()`);
      await wait(600);
      await js(`window.__inkwave.debug.step(1000 / 60); 0`); await wait(400);
      const f = `${OUT}/${name}.jpg`;
      if (frame) { let q = 86, buf = frame.toJPEG(q); while (buf.length > 290 * 1024 && q > 40) { q -= 6; buf = frame.toJPEG(q); } fs.writeFileSync(f, buf); }
      console.log('shot', name, JSON.stringify(r).slice(0, 200));
    };
    const at = (t) => js(`(() => { ${pre} tAt(${t}); return +E.S.clock.t.toFixed(2); })()`);
    const inkAll = MAPID !== 'bluestone' ? (process.env.INKJS || '') : `const ink = (x, z, r, t) => P.splat(new THREE.Vector3(x, 0.3, z), r, t, { instant: true });
        for (let i = 0; i < 16; i++) ink(-22 + (i % 4) * 2.2, -46 + i * 1.7, 1.8, i & 1);
        for (let i = 0; i < 8; i++) ink(-26 + (i % 3) * 3, -24 + i * 1.5, 1.6, (i >> 1) & 1);
        for (let i = 0; i < 8; i++) ink(-12 + (i % 2) * 3, -27 + i * 0.8, 1.5, 0);
        for (let i = 0; i < 10; i++) ink(-6 + i * 1.3, -14 + (i % 3), 1.7, i & 1);
        for (let i = 0; i < 10; i++) ink(-30 + (i % 2) * 2, -40 + i * 2, 1.4, (i >> 1) & 1);
        for (let i = 0; i < 10; i++) ink(-20 + i * 1.8, -8 + (i % 2) * 2, 1.7, (i >> 2) & 1);`;
    if (SET === 'jump') {
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      await js(`(() => { ${pre} ${inkAll} g.match.time = g.match.duration - 39.6; step(0.1); return 1; })()`);
      const done = await js(`(() => { ${pre} return W.doneOff; })()`);
      console.log('doneOff', done);
      for (const k of JUMPS) { const J = k * 60;
        for (const m of MOMENTS) { const t = String(m).startsWith('done+') ? J + done + +String(m).slice(5) : J + +m; await at(t);
          for (const [v, cam] of Object.entries(VIEWS)) await shot(`rj${k}-${v}-${m}-${TIME}-${PAL}`, cam, { hud: true }); }
      }
    }
    if (SET === 'ink' || SET === 'cams') {
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      if (SET === 'ink') await js(`(() => { ${pre} ${inkAll} step(0.1); return 1; })()`);
      for (const e of (MAPID === 'bluestone' ? ERAS : [0])) {
        if (e) await js(`(() => { ${pre} E.debugJump(${e}, { instant: true }); step(0.1); return E.era; })()`);
        for (const [name, cam] of Object.entries(VIEWS)) await shot(`${SET}-${name}-e${e}-${TIME}-${PAL}`, cam, { hud: SET === 'ink' });
      }
    }

    if (SET === 'inkpair') {
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      for (const e of (MAPID === 'bluestone' ? ERAS : [0])) {
        if (e) await js(`(() => { ${pre} E.debugJump(${e}, { instant: true }); step(0.1); return E.era; })()`);
        await js(`(() => { ${pre} P.clear(); step(0.05); return 1; })()`);
        for (const [name, cam] of Object.entries(VIEWS)) await shot(`ip-${name}-e${e}-${TIME}-${PAL}-0`, cam, { hud: false });
        await js(`(() => { ${pre} ${inkAll} step(0.1); return 1; })()`);
        for (const [name, cam] of Object.entries(VIEWS)) await shot(`ip-${name}-e${e}-${TIME}-${PAL}-1`, cam, { hud: false });
        await js(`(() => { ${pre} P.clear(); step(0.05); return 1; })()`);
      }
    }

    if (SET === 'lights') {
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      const rd = (lab) => js(`(() => { ${pre} const env = __G.env; return JSON.stringify({ lab: '${lab}', era: E.era, envEra: W.envEra, t: +E.S.clock.t.toFixed(1), sun: +env.sun.intensity.toFixed(2), sunC: env.sun.color.getHexString(), hemi: +env.hemi.intensity.toFixed(2), hemiSky: env.hemi.color.getHexString(), env: +(env.scene.environmentIntensity ?? -1).toFixed(2), grade: env.grade || null }); })()`);
      console.log('LIGHTS', await rd('start'));
      const done = await js(`(() => { ${pre} return W.doneOff; })()`);
      for (const k of [1, 2]) { await at(k * 60 + done + 5); console.log('LIGHTS', await rd('real jump ' + k + ' done+5')); }
      await at(2 * 60 + done + 30); console.log('LIGHTS', await rd('real jump 2 done+30'));
      for (const e of [3, 2, 1, 3]) { await js(`(() => { ${pre} E.debugJump(${e}, { instant: true }); step(0.5); return 1; })()`); console.log('LIGHTS', await rd('instant ' + e)); }
    }

    if (SET === 'afterjump') {
      // a real match from the 1880s: after each real jump (done + 6 s) the same cameras with the paint cleared; then each era
      // entered by an instant debug jump from the 1880s (the look the era's tests measure)
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      const done = await js(`(() => { ${pre} return W.doneOff; })()`);
      const AJ = (process.env.AJ_AT || '6').split(',').map(Number);
      for (const k of [1, 2]) {
        for (const a of AJ) {
          await at(k * 60 + done + a);
          await js(`(() => { ${pre} P.clear(); step(0.05); return 1; })()`);
          console.log('LIGHTS', await js(`(() => { ${pre} const env = __G.env; return JSON.stringify({ at: 'real ${k} done+${a}', era: E.era, sun: +env.sun.intensity.toFixed(2), hemi: +env.hemi.intensity.toFixed(2), env: +env.scene.environmentIntensity.toFixed(2), exp: env.grade?.uExposure }); })()`));
          for (const [name, cam] of Object.entries(VIEWS)) await shot(`aj-${name}-e${k + 1}-${TIME}-real${a === 6 ? '' : '-d' + a}`, cam, { hud: false });
        }
      }
      for (const e of [2, 3]) {
        await js(`(() => { ${pre} E.debugJump(1, { instant: true }); step(0.3); E.debugJump(${e}, { instant: true }); step(0.5); P.clear(); step(0.05); return 1; })()`);
        // (fix round 3: one throwaway frame first — the review's first instant shot after the theme's full re-bake caught the
        //  previous camera's frame)
        await shot(`warmup`, Object.values(VIEWS)[0], { hud: false }); await wait(800);
        console.log('LIGHTS', await js(`(() => { ${pre} const env = __G.env; return JSON.stringify({ at: 'instant ${e}', era: E.era, sun: +env.sun.intensity.toFixed(2), hemi: +env.hemi.intensity.toFixed(2), env: +env.scene.environmentIntensity.toFixed(2), exp: env.grade?.uExposure }); })()`));
        for (const [name, cam] of Object.entries(VIEWS)) await shot(`aj-${name}-e${e}-${TIME}-instant`, cam, { hud: false });
      }
    }
    if (SET === 'flicker') {
      await start({ mapId: MAPID, duration: 180, time: TIME, mode: 'turf' });
      const cams = { degrayling: { from: [-20.5, 2.4, -24.0], look: [-14, 1.2, -20], fov: 60 }, hoard: { from: [-20.5, 2.4, -44], look: [-26.5, 2.4, -35], fov: 66 }, quay: { from: [-8.2, 1.75, -45], look: [-3, 1.0, -30], fov: 70 } };
      // before the warning (J − 15: no flicker), then the warning of jump 1 at its strongest (J − 2), three frames
      await js(`(() => { ${pre} E.debugJump(1, { instant: true }); step(0.1); const J = E.debugJump(2, { inS: 15 }); step(0.5); return E.phase; })()`);
      for (const [name, cam] of Object.entries(cams)) await shot(`flk-${name}-pre-${TIME}`, cam, { hud: true });
      await js(`(() => { ${pre} step(12.0); return E.phase; })()`);
      for (const [name, cam] of Object.entries(cams)) for (let k = 0; k < 3; k++) {
        await shot(`flk-${name}-warn${k}-${TIME}`, cam, { hud: true });
        const z = await js(`(() => { ${pre} return [E.phase, +W.uniforms.uEraW.value.z.toFixed(2)]; })()`); console.log('warn', JSON.stringify(z));
      }
    }
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} error line(s)`); for (const l of uniq.slice(0, 20)) console.log('  ' + l);
    app.quit();
  });
});
