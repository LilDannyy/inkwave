// [b5-beta1] The first frames of a match, stage by stage: every stage started from a fresh page (the player's first match
// on it after the app starts: the beta's issue log showed 300–520 ms frames at the start of Turf War on six stages, 2 s on
// Bluestone and 4.9 s on Gulper Aquarium), measured in real time (the game's own requestAnimationFrame loop, not stepped)
// from the first frame the match is on screen (G.mode 'match': where src/core/issueLog.js starts counting slow frames)
// through the intro and the first 3 s of play. A stage passes when every one of those frames is under BAR ms (100), and
// no wait between two of them is (idle callbacks, GC: not in the issue log's frame time, a hitch on screen all the same).
//   tools/botlab/run.sh tools/botlab/first-frames.cjs                 (every stage in MAPS; DEVSTAGE=1 adds Cargo Terminal)
//   STAGES=aquarium,bluestone MODE=turf BAR=100 PLAY=3 tools/botlab/run.sh tools/botlab/first-frames.cjs
// Per stage it prints the load time (startMatch → on screen), the frames counted, the worst frame of the intro and of
// play, and for each frame over BAR its parts (the probes below: sim, render, paint flush, HUD, env, minimap …), the
// shader programs, textures and geometries new in that frame. Then PASS / FAIL lines and RESULT n/m.
const { app } = require('electron');
require(process.env.S + '/offscreen-boot.cjs');
const BAR = +(process.env.BAR || 100), PLAY = +(process.env.PLAY || 3), MODE = process.env.MODE || 'turf';
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 900000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// in the page: probes on the frame and its parts, then the match
const PROBE = (mapId, mode, play) => `(async () => {
  const g = window.__inkwave, G = window.__G, R = G.renderer, info = R.info;
  const parts = {}; let cur = null;
  const wrap = (obj, key, name) => {
    if (!obj || typeof obj[key] !== 'function' || obj[key].__ff) return;
    const f = obj[key], w = function (...a) { const t = performance.now(); try { return f.apply(this, a); } finally { if (cur) cur.parts[name] = (cur.parts[name] || 0) + performance.now() - t; } };
    w.__ff = true; obj[key] = w;
  };
  const probes = () => {
    const m = g.match;
    wrap(m, 'update', 'sim'); wrap(m, 'updateController', 'controller'); wrap(g.R, 'render', 'render'); wrap(G.paint, 'flush', 'paintFlush');
    wrap(g, '_updateHud', 'hud'); wrap(G.env, 'update', 'env'); wrap(g.rig, 'update', 'camera'); wrap(g.decor, 'update', 'decor');
    wrap(g.props, 'update', 'props'); wrap(G.fx, 'update', 'fx'); wrap(g.showcase, 'update', 'showcase'); wrap(g.showcase, 'render', 'showcaseRender');
    wrap(G.cues, 'update', 'cues'); wrap(G.projectiles, 'update', 'projectiles'); wrap(G.subs, 'update', 'subs'); wrap(G.specials, 'update', 'specials');
    wrap(g.diorama, 'update', 'diorama'); wrap(g.screenfx, 'update', 'screenfx'); wrap(g.inkWipe, 'update', 'inkWipe'); wrap(g.swimWake, 'update', 'swimWake');
    wrap(g.menus, 'update', 'menus'); wrap(g, '_updateLocalLoops', 'loops'); wrap(g, '_updateAmbience', 'ambience'); wrap(g.minimap, 'update', 'minimap');
    wrap(g.minimap, 'draw', 'minimapDraw'); wrap(g.towerFx, 'update', 'towerFx'); wrap(g.karpFx, 'update', 'karpFx'); wrap(G.projectiles, 'updateArc', 'arc');
    wrap(g.hud, 'update', 'hudUpdate');
  };
  const frames = []; let playAt = 0, onAt = 0, done = false, lastEnd = 0;
  const f0 = g._frame;
  g._frame = function (dt) {
    const counting = G.mode === 'match' && g.match && !g.match.attract && !g.match.loading;
    if (!counting || done) return f0.call(this, dt);
    probes();
    const p0 = info.programs ? info.programs.length : 0, tx0 = info.memory.textures, ge0 = info.memory.geometries;
    cur = { t: 0, parts: {}, state: g.match.state };
    const t = performance.now();
    try { return f0.call(this, dt); } finally {
      const end = performance.now();
      cur.ms = end - t; cur.gap = lastEnd ? t - lastEnd : 0; lastEnd = end;   // (gap: the wait since the last frame ended — idle callbacks, GC, the browser's own work)
      cur.programs = (info.programs ? info.programs.length : 0) - p0; cur.textures = info.memory.textures - tx0; cur.geometries = info.memory.geometries - ge0;
      if (!onAt) onAt = t; cur.t = t - onAt;
      if (g.match.state === 'playing' && !playAt) playAt = t;
      frames.push(cur); cur = null;
      if (playAt && t - playAt > ${play * 1000}) done = true;
    }
  };
  const t0 = performance.now();
  await g.api.startMatch({ mapId: '${mapId}', mode: '${mode}', duration: 180 });
  const loadMs = performance.now() - t0;
  for (let i = 0; i < 600 && !done; i++) await new Promise((r) => setTimeout(r, 50));
  g._frame = f0;
  return { loadMs: Math.round(loadMs), got: g.mapDef && g.mapDef.id, worldKey: g.worldKey, done, frames: frames.map((f) => ({ ...f, ms: +f.ms.toFixed(1), gap: +f.gap.toFixed(1), t: Math.round(f.t),
    parts: Object.fromEntries(Object.entries(f.parts).filter(([, v]) => v >= 2).map(([k, v]) => [k, +v.toFixed(1)])) })) };
})()`;

let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  const errs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level)) || /TypeError|ReferenceError/.test(m)) errs.push(m.slice(0, 300)); });
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    const js = (c) => win.webContents.executeJavaScript(c, true);
    let pass = 0, total = 0;
    try {
      // the stage list: STAGES, else every stage in MAPS (an online-only one only with DEVSTAGE=1: ?devstage)
      await win.loadURL('app://inkwave/index.html?autopilot');
      for (let i = 0; i < 160 && !(await js('!!window.__inkwave?.api')); i++) await wait(250);
      const all = await js(`import('./src/config.js').then((C) => C.MAPS.filter((m) => ${process.env.DEVSTAGE === '1'} || !m.onlineOnly).map((m) => m.id))`);
      const stages = process.env.STAGES ? process.env.STAGES.split(',') : all;
      for (const id of stages) {
        // a fresh page: the player's first match on this stage after the app starts
        await win.loadURL('app://inkwave/index.html?autopilot');
        for (let i = 0; i < 160 && !(await js(`!!window.__inkwave?.api && window.__G?.mode === 'menu'`)); i++) await wait(250);
        await js('window.__inkwave._onPointerUnlock = () => {}; 0');
        await wait(1500);   // (the menu's own first frames settle)
        const r = await js(PROBE(id, MODE, PLAY));
        if (r.got !== id) { console.log(`MAP MISMATCH: asked for ${id}, the game built ${r.got}`); total++; continue; }
        const F = r.frames, intro = F.filter((f) => f.state !== 'playing'), play = F.filter((f) => f.state === 'playing');
        const worst = (L) => L.reduce((w, f) => (!w || f.ms > w.ms ? f : w), null);
        const wi = worst(intro), wp = worst(play), over = F.filter((f) => f.ms >= BAR);
        const wg = F.reduce((w, f) => (!w || f.gap > w.gap ? f : w), null), gaps = F.filter((f) => f.gap >= BAR);   // (between frames: not in the issue log's frame time, but a hitch all the same)
        console.log(`== ${id} [${MODE}, world ${r.worldKey}]: load ${r.loadMs} ms | ${F.length} frames (${intro.length} intro, ${play.length} play) | worst intro ${wi ? wi.ms + ' ms @' + wi.t : '-'} | worst play ${wp ? wp.ms + ' ms @' + wp.t : '-'} | over ${BAR} ms: ${over.length} | worst gap between frames ${wg ? wg.gap + ' ms @' + wg.t : '-'} (over ${BAR}: ${gaps.length})${r.done ? '' : ' | (play not reached / not 3 s long)'}`);
        for (const f of F.filter((x) => x.ms >= Math.min(BAR, 50) || x.gap >= BAR).slice(0, 12)) console.log(`   frame @${f.t} ms [${f.state}] ${f.ms} ms (after a ${f.gap} ms gap) | programs +${f.programs} textures +${f.textures} geometries +${f.geometries} | ${JSON.stringify(f.parts)}`);
        { const n = F.slice(0, 3); console.log(`   first frames: ${n.map((f) => `${f.ms} ms (programs +${f.programs}, textures +${f.textures}) ${JSON.stringify(f.parts)}`).join(' · ')}`); }
        const ok = r.done && over.length === 0 && gaps.length === 0;
        console.log(`${ok ? 'PASS' : 'FAIL'} ${id} first frames under ${BAR} ms, and no gap between them over ${BAR} ms  ${JSON.stringify({ worstIntro: wi && wi.ms, worstPlay: wp && wp.ms, over: over.length, worstGap: wg && wg.gap, gaps: gaps.length, loadMs: r.loadMs })}`);
        pass += ok; total++;
      }
      console.log(`RESULT ${pass}/${total}`);
    } catch (e) { console.log('HARNESS ERROR', e.message, e.stack); }
    console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 5).join(' || ') : 'none');
    app.quit();
  });
});
