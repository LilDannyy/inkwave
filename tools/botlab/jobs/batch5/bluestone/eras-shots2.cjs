// Bluestone eras (scratch): the engine phase's second-half pictures, one Electron instance, JPEGs into out/engine/.
//   BOTLAB_OUT=… SLOTS=3 tools/botlab/run.sh tools/botlab/jobs/batch5/bluestone/eras-shots2.cjs        (ONLY=a,b to pick)
// ONE continuous jump on the real schedule (a 3:00 Turf War, one palette; the match clock moved to 2:21 left and played
// on): the pre-bell (Tartar and the clock row counting, the chip's "TODAY in 20"), the warning (the knee, the quay, Hoki
// Lane's wall before its mural, the wire pulses), J + 1.5 (the knee, the quay, the time-lapse sky), the front crossing
// Hoki Lane, done + 1 (the knee, the quay, the mural painted in), then jump 2 to the 3000s on the same clock; the minimap
// and the TAB map in each era; a bot standing on the Halo; the rescue over the river in Practice's rewind; the lightmap
// probe (once bluestone.png is baked: the R and G channels of the street beside the era-1 crates). ONLY=fr1: the final
// review's done + 0.5 pictures (the opened lane and the wagon's footprint outlined on the floor, the minimap's ping).
// ONLY=fr2: the final review 2's jump chip at J + 1.5 (the frame and the chip's crop, 2×).
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const ROOT = process.env.BOTLAB_ROOT || '.';
const OUT = `${ROOT}/tools/botlab/jobs/batch5/stages/bluestone/out/engine`;
const W = 1280, H = 720, ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, 1500000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const want = (n) => !ONLY.length || ONLY.some((o) => n.startsWith(o));

const CAM = {
  knee: { from: [-18, 2.4, -41], look: [-10, 2.2, -24], fov: 70 },           // Swimston by the GPO steps, toward Degrayling Lane's crates and the hotel
  quay: { from: [-8.5, 2.4, -47], look: [5, 0.2, -30], fov: 66 },            // the quay's south end, over the basin to the bridge site
  hoki: { from: [-32.8, 1.75, -26.5], look: [-36.5, 1.7, -39], fov: 64 },    // Hoki Lane, the viaduct's wall
  phone: { from: [1.0, 2.6, -13.5], look: [0, 6.8, 0], fov: 52 },           // Tartar under the dome, Alpha's clock row in front (between two columns)
  pulses: { from: [-36, 18, -60], look: [-6, 4, -12], fov: 62 },             // high over the leg: the wires from the dome outward
  sky: { from: [8, 3.4, 13], look: [-14, 9, -10], fov: 74 },                 // Bravo's side of the ring, over the hotel at the sky (shadows on the ring)
  halo: { from: [-21, 7.2, -21], look: [-8, 5.0, -8], fov: 56 },             // the Halo's south-west side from the knee
  rescue: { from: [-8.6, 2.8, -44.5], look: [2.5, -0.2, -36.5], fov: 62 },   // the quay over the floating garden
  probe: { from: [-18.25, 7.5, -36], look: [-12.25, 0.4, -26], fov: 55 },    // the era-1 crates from above
  lane: { from: [-19.5, 4.2, -33], look: [-12.2, 0.2, -26], fov: 62 },       // (final review, issue 7) Degrayling Lane where the crates stood, from Swimston
  wagon: { from: [-10.7, 5.2, -57], look: [-10.7, 0.6, -47.5], fov: 60 },   // (final review, issue 7) Customs Lane where the goods wagon stood, from the forecourt terrace
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
    // a picture: the camera, the HUD (as a player sees it) or not, the characters shown or not; one frame rendered
    const shot = async (name, cam, { hud = false, chars = false, js: code = '' } = {}) => {
      if (!want(name)) return;
      const r = await js(`(() => { try { ${pre} ${code}
        for (const a of g.match.actors) { a.character.root.visible = ${chars}; a.character.setVisible?.(${chars}); }
        const C = ${JSON.stringify(cam)}; g.settings.fov = C.fov;
        g.rig.cinematic(new THREE.Vector3(...C.from), new THREE.Vector3(...C.from), new THREE.Vector3(...C.look), new THREE.Vector3(...C.look), 99, () => {});
        g.hud?.setVisible?.(${hud}); g.menus?.show?.(null);
        document.querySelectorAll('.iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
        document.querySelectorAll('.iw-hud').forEach((e) => { e.style.visibility = ${hud ? "'visible'" : "'hidden'"}; });
        g.debug.step(1000 / 60); return { ...E.state(), mc: +(g.match.duration - g.match.time).toFixed(2) }; } catch (e) { return 'ERR ' + e.stack; } })()`);
      await wait(600);
      await js(`window.__inkwave.renderer ? 0 : 0; (window.__inkwave.R && window.__inkwave.R.render && window.__inkwave.R.render()), 0`); await wait(400);
      const f = `${OUT}/${name}.jpg`;
      if (frame) { let q = 82, buf = frame.toJPEG(q); while (buf.length > 290 * 1024 && q > 40) { q -= 8; buf = frame.toJPEG(q); } fs.writeFileSync(f, buf); }
      console.log('shot', name, fs.existsSync(f) ? fs.statSync(f).size : 0, JSON.stringify(r).slice(0, 240));
    };
    const at = (t) => js(`(() => { ${pre} tAt(${t}); return +E.S.clock.t.toFixed(2); })()`);
    const minimap = async (name) => {
      if (!want(name)) return;
      const url = await js(`(() => { const g = window.__inkwave, E = g.match.eras, mm = g.minimap; mm._band = 0; mm.update(0.2, true);
        const c = document.createElement('canvas'); c.width = mm.w; c.height = mm.h; const x = c.getContext('2d'); x.fillStyle = '#20242c'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(mm.base, 0, 0); if (mm.inkC) x.drawImage(mm.inkC, 0, 0); E.drawMap(x, mm, null, mm.s, null, 0.12); return c.toDataURL('image/jpeg', 0.86); })()`);
      const f = `${OUT}/${name}.jpg`; fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('shot', name, fs.statSync(f).size);
    };
    // the TAB map (the diorama): the map key held — the view swoops overhead with its pins (the live scene from above)
    const tabmap = async (name) => {
      if (!want(name)) return;
      await js(`(() => { const g = window.__inkwave; g.__sm0 = g.__sm0 || g.rig.setMap.bind(g.rig); g.rig.setMap = () => g.__sm0(true);
        for (const a of g.match.actors) { a.character.root.visible = true; a.character.setVisible?.(true); }
        g.hud?.setVisible?.(true); document.querySelectorAll('.iw-hud').forEach((e) => { e.style.visibility = 'visible'; });
        g.rig.follow?.(g.match.actors.find((a) => a.isLocal) || g.match.actors[0], true);
        for (let i = 0; i < 70; i++) g.debug.step(1000 / 60); return 1; })()`);
      await wait(700); await js(`window.__inkwave.debug.step(1000 / 60); 0`); await wait(400);
      const f = `${OUT}/${name}.jpg`; if (frame) fs.writeFileSync(f, frame.toJPEG(80)); console.log('shot', name, fs.existsSync(f) ? fs.statSync(f).size : 0);
      await js(`(() => { const g = window.__inkwave; g.rig.setMap = () => g.__sm0(false); for (let i = 0; i < 50; i++) g.debug.step(1000 / 60); g.rig.setMap = g.__sm0; return 1; })()`);
    };

    // ============================================================================ one continuous jump on the real schedule
    await start({ mapId: 'bluestone', duration: 180, time: 'day', mode: 'turf' });
    // some ink on the streets the pictures look at (both teams), so the ink travelling through time shows
    await js(`(() => { ${pre} const ink = (x, z, r, t) => P.splat(new THREE.Vector3(x, 0.3, z), r, t, { instant: true });
      for (let i = 0; i < 14; i++) ink(-21 + (i % 4) * 2.2, -45 + i * 1.6, 1.8, i & 1);
      for (let i = 0; i < 10; i++) ink(-8, -46 + i * 2.2, 1.7, 0);
      for (let i = 0; i < 8; i++) ink(-34.5 + (i % 2) * 2, -30 - i * 2, 1.5, 1);
      g.match.time = g.match.duration - 39.6; step(0.1); return 1; })()`);
    await at(40.35);
    await shot('prebell-phone', CAM.phone, { hud: true });
    await at(50.45);
    await shot('jump1-knee-J-10', CAM.knee, { hud: true });
    await shot('jump1-quay-J-10', CAM.quay, { hud: true });
    await shot('mural-hoki-era1', CAM.hoki);
    await minimap('minimap-era1-warn');
    await at(54.2);
    await shot('pulses-warn', CAM.pulses, { hud: true });
    await at(60.1);
    await shot('timelapse-sky-J+0.1', CAM.sky);
    await at(61.0);
    await shot('timelapse-sky-J+1.0', CAM.sky);
    await at(61.5);
    await shot('jump1-knee-J+1.5', CAM.knee, { hud: true });
    await shot('jump1-quay-J+1.5', CAM.quay, { hud: true });
    // (the final review 2, issue 3: the chip through the jump — "TIME JUMP!" dark on the white-gold chip; the frame and the
    //  chip's crop, 2×)
    await shot('fr2-jump1-knee-J+1.5', CAM.knee, { hud: true });
    if (want('fr2-chip') && frame) {
      const r = await js(`(() => { const c = document.querySelector('.er-chip'); if (!c) return null; const b = c.getBoundingClientRect(), d = window.devicePixelRatio || 1; return { x: b.left * d, y: b.top * d, w: b.width * d, h: b.height * d, text: c.textContent, cls: c.className }; })()`);
      if (r) { const pad = 24, sz = frame.getSize(), k = sz.width / W, x = Math.max(0, Math.round(r.x / (k || 1) * k - pad)), y = Math.max(0, Math.round(r.y - pad)); const img = frame.crop({ x, y, width: Math.min(sz.width - x, Math.round(r.w + pad * 2)), height: Math.min(sz.height - y, Math.round(r.h + pad * 2)) }); const big = img.resize({ width: img.getSize().width * 2, quality: 'best' }); fs.writeFileSync(`${OUT}/fr2-chip-J+1.5.jpg`, big.toJPEG(90)); console.log('shot fr2-chip-J+1.5', JSON.stringify(r)); }
    }
    await at(62.0);
    await shot('timelapse-sky-J+2.0', CAM.sky);
    await at(62.05);
    await shot('mural-hoki-J+2.05', CAM.hoki);
    await at(63.0);
    await shot('timelapse-sky-J+3.0', CAM.sky);
    const done1 = await js(`(() => { ${pre} return 60 + W.doneOff; })()`);
    // (the final review, issue 7: done + 0.5 — the opened lane outlined on the floor, the new pieces pulsing, the minimap's ping)
    await at(done1 + 0.5);
    await shot('fr1-jump1-lane-done+0.5', CAM.lane, { hud: true });
    await minimap('fr1-minimap-done+0.5');
    await at(done1 + 1.0);
    await shot('jump1-knee-done+1', CAM.knee, { hud: true });
    await shot('jump1-quay-done+1', CAM.quay, { hud: true });
    await shot('mural-hoki-era2', CAM.hoki);
    await minimap('minimap-era2');
    await tabmap('tabmap-era2');
    // jump 2 on the same clock
    await at(110.4);
    await shot('jump2-quay-J-10', CAM.quay, { hud: true });
    await at(122.0);
    await shot('jump2-quay-J+2', CAM.quay, { hud: true });
    await at(120 + done1 - 60 + 0.5);
    await shot('fr1-jump2-wagon-done+0.5', CAM.wagon, { hud: true });
    await minimap('fr1-minimap-era3-done+0.5');
    await at(120 + done1 - 60 + 1.0);
    await shot('jump2-quay-done+1', CAM.quay, { hud: true });
    await shot('mural-seams-era3', { from: [-23.4, 3.4, -45.5], look: [-26, 4.4, -37.5], fov: 56 });
    await minimap('minimap-era3');
    await tabmap('tabmap-era3');
    // a bot standing on the Halo (its perch in the 3000s)
    await shot('bot-on-halo', CAM.halo, { chars: true, js: `const N = __G.nav, b = g.match.actors.find((a) => a.bot && a.team === 0);
      const n = N.nodes.filter((q) => N.eraValid[2][q.id] && q.y > 5 && q.z < -5 && q.x < -5 && Math.hypot(q.x, q.z) > 11.5 && Math.hypot(q.x, q.z) < 14)[0];
      b.pos.set(n.x, n.y + 0.02, n.z); b.vel?.set(0, 0, 0); b.yaw = Math.atan2(-(0 - n.x), -(0 - n.z)); step(0.3);` });
    // the minimap and TAB map of era 1 (a fresh match)
    await start({ mapId: 'bluestone', duration: 180, time: 'day', mode: 'turf' });
    await minimap('minimap-era1');
    await tabmap('tabmap-era1');

    // ============================================================================ the rescue over the river (Practice's rewind)
    if (want('rescue')) {
      await start({ mapId: 'bluestone', practice: true, time: 'day' });
      const r = await js(`(() => { ${pre} const L = __G.level, kid = g.match.actors.find((a) => a.isLocal) || g.match.actors[0];
        E.S.clock.t = 176; E.seek(176, 'test'); step(0.2);
        const gd = L.blocks.find((b) => b.tag === 'floating-garden' && b.center.z < 0 && b.eraGroup === 'garden-01'), top = gd.center.y + gd.half.y;
        const J = E._info(E.nextAt(E.S.clock.t)), F = J.at + W.groups[gd.eraG].rg / W.speed;
        tAt(F - 0.5); kid.pos.set(gd.center.x, top + 0.05, gd.center.z); kid.vel?.set(0, 0, 0); step(0.3);
        window.__F = F; window.__kid = kid; return { F, at: [kid.pos.x, kid.pos.y, kid.pos.z] }; })()`);
      console.log('rescue setup', JSON.stringify(r));
      await shot('rescue-garden-before', CAM.rescue, { chars: true, js: `` });
      await js(`(() => { ${pre} tAt(window.__F + 0.12); return 1; })()`);
      await shot('rescue-garden-after', CAM.rescue, { chars: true, js: `` });
      console.log('rescue', JSON.stringify(await js(`(() => { const k = window.__kid, E = window.__inkwave.match.eras; return { rescues: E.stats.rescues, at: [k.pos.x, k.pos.y, k.pos.z].map((v) => +v.toFixed(2)), alive: k.alive }; })()`)));
    }

    // ============================================================================ the lightmap probe (needs the bake)
    if (want('lightmap-probe')) {
      await start({ mapId: 'bluestone', duration: 180, time: 'day', mode: 'turf' });
      const url = await js(`(() => { const g = window.__inkwave, L = __G.level, lm = g.levelMat?.userData?.uniforms?.uLight?.value; const img = lm && lm.image;
        if (!img) return null;
        const cr = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0);
        // the street face under / beside the crates: the top face of the block that holds the crates' foot
        const f = L.faces.find((f) => f.turf && f.light && Math.abs(f.origin.y) < 0.05 && cr.center.x > Math.min(f.origin.x, f.origin.x + f.u.x * f.su) && cr.center.x < Math.max(f.origin.x, f.origin.x + f.u.x * f.su) && cr.center.z > Math.min(f.origin.z, f.origin.z + f.v.z * f.sv) && cr.center.z < Math.max(f.origin.z, f.origin.z + f.v.z * f.sv));
        if (!f) return 'no face';
        const c0 = document.createElement('canvas'); c0.width = img.width; c0.height = img.height; const x0 = c0.getContext('2d'); x0.drawImage(img, 0, 0);
        const ppm = f.light.ppm, pad = f.light.pad, w = Math.ceil(f.su * ppm) + pad * 2, h = Math.ceil(f.sv * ppm) + pad * 2;
        // (the atlas is stored flipped: atlas row y is image row S − 1 − y)
        const S = img.height, d0 = x0.getImageData(f.light.x, S - (f.light.y + h), w, h).data, d = new Uint8ClampedArray(d0.length);
        for (let yy = 0; yy < h; yy++) d.set(d0.subarray((h - 1 - yy) * w * 4, (h - yy) * w * 4), yy * w * 4);
        const S = Math.max(2, Math.floor(560 / w)), c = document.createElement('canvas'); c.width = w * S * 3 + 40; c.height = h * S + 60; const x = c.getContext('2d');
        x.fillStyle = '#20242c'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#f4e9c8'; x.font = '18px sans-serif';
        ['R: era 1 (crates there)', 'G: era 2 (crates gone)', 'B: era 3'].forEach((t, k) => { x.fillText(t, 10 + k * (w * S + 20), 22);
          for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const v = d[(yy * w + xx) * 4 + k]; x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect(10 + k * (w * S + 20) + xx * S, 40 + yy * S, S, S); } });
        return c.toDataURL('image/jpeg', 0.88); })()`);
      if (url && url.startsWith('data:')) { const f = `${OUT}/lightmap-probe.jpg`; fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('shot lightmap-probe', fs.statSync(f).size); } else console.log('lightmap-probe', url);
    }
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} error line(s)`); for (const l of uniq.slice(0, 20)) console.log('  ' + l);
    app.quit();
  });
});
