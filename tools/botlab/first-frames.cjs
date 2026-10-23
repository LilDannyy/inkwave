// [b5-beta1] The first frames of a match, stage by stage: every stage started from a fresh page (the player's first match
// on it after the app starts: the beta's issue log showed 300–520 ms frames at the start of Turf War on six stages, 2 s on
// Bluestone and 4.9 s on Gulper Aquarium), measured in real time (the game's own requestAnimationFrame loop, not stepped)
// from the first frame the match is on screen (G.mode 'match': where src/core/issueLog.js starts counting slow frames)
// through the intro and the first 3 s of play. Per stage, three checks:
//   frames    every one of those frames under BAR ms (100), and no wait between two of them over BAR (idle callbacks, GC:
//             not in the issue log's frame time, a hitch on screen all the same) — a timing, so it depends on the
//             machine, its load and its shader caches (first-frames-cold.sh: each stage in its own Electron with the GPU
//             shader disk cache off, the player's first run after an update);
//   programs  no shader program compiled in any of those frames — whatever the caches, a program compiled in a frame
//             is that frame's work (on a cold cache, 50–500 ms each). The first frame of play also forces what kits and
//             stages build on first use: a Sponge Mitts punch (the lineup always carries the Mitts) and a paint flood
//             (a turf face beside the camera inked as a Zone Control capture does);
//   first use then EXTRA s (20) more of play, stepped, every special charged at once and every 10 s: no program
//             compiled there either (the lineup turns with the stage, so the 16 stages carry every weapon, sub and
//             special: LINEUP=0 keeps the match's own random one).
// review 1 (2026-10-24): the programs / first-use checks fail on the shipped code (b0cc406c) and pass on the fix; the
// frames check alone did not tell them apart on this Mac (its warm shader caches).
//   tools/botlab/run.sh tools/botlab/first-frames.cjs                 (every stage in MAPS; DEVSTAGE=1 adds Cargo Terminal)
//   STAGES=aquarium,bluestone MODE=turf BAR=100 PLAY=3 EXTRA=20 tools/botlab/run.sh tools/botlab/first-frames.cjs
//   tools/botlab/first-frames-cold.sh                                 (each stage in its own Electron, shader disk cache off)
//   TRACE=1: a Chrome trace of each stage's match; every main-thread task over 50 ms from the match's first frame through
//   play is printed with what it spent its time in (the 'unknown' long tasks the page's own observer can't attribute)
// Per stage it prints the load time (startMatch → on screen), the frames counted, the worst frame of the intro and of
// play, and for each frame over BAR its parts (the probes below: sim, render, paint flush, HUD, env, minimap …), the
// shader programs (and who uses them), textures and geometries new in that frame. Then PASS / FAIL lines and RESULT n/m.
const { app, contentTracing } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const BAR = +(process.env.BAR || 100), PLAY = +(process.env.PLAY || 3), MODE = process.env.MODE || 'turf', EXTRA = +(process.env.EXTRA ?? 20), LINEUP = process.env.LINEUP !== '0';
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 900000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// in the page: probes on the frame and its parts, then the match
const PROBE = (mapId, mode, play, idx) => `(async () => {
  const g = window.__inkwave, G = window.__G, R = G.renderer, info = R.info;
  // the lineup: turns with the stage's index (8 kids × 16 stages: every weapon, sub and special several times over), the
  // Sponge Mitts always in it (the forced punch); set before the match's warm, as a lobby's loadouts are
  const lineup = [];
  if (${LINEUP}) {
    const C = await import('./src/config.js'), MP = (await import('./src/game/match.js')).Match.prototype, setup0 = MP.setup;
    MP.setup = function (...x) {
      const r = setup0.apply(this, x);
      this.actors.forEach((a, j) => { const k = ${idx} * 8 + j; a.setWeapon(j === Math.min(1, this.actors.length - 1) ? 'mitts' : C.WEAPON_ORDER[k % C.WEAPON_ORDER.length]); a.setSub(C.SUB_ORDER[k % C.SUB_ORDER.length]); a.setSpecial(C.SPECIAL_ORDER[k % C.SPECIAL_ORDER.length]); });
      MP.setup = setup0;
      return r;
    };
  }
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
    wrap(g.hud, 'update', 'hudUpdate'); wrap(m?.stage, 'update', 'stageMods'); wrap(m?.stage, 'lateUpdate', 'stageModsLate'); wrap(m?.movers, 'update', 'movers'); wrap(m?.pods, 'update', 'pods');
    wrap(m?.zones, 'update', 'zones'); wrap(m?.tower, 'update', 'tower'); wrap(m?.karp, 'update', 'karp'); wrap(G.paint, 'splat', 'splat'); wrap(G.paint, '_drawQuads', 'paintDraw');
  };
  const frames = []; let playAt = 0, onAt = 0, done = false, lastEnd = 0;
  // between frames: every idle callback and timer the page runs from now on, timed (what lands in the gaps)
  const between = [], t00 = performance.now();
  const label = (fn) => String(fn).replace(/\s+/g, ' ').slice(0, 90);
  const ric0 = window.requestIdleCallback, st0 = window.setTimeout;
  window.requestIdleCallback = function (fn, o) { return ric0.call(window, function (d) { const t = performance.now(); try { return fn(d); } finally { const ms = performance.now() - t; if (ms >= 8) between.push({ at: Math.round(t - t00), ms: +ms.toFixed(1), what: 'idle: ' + label(fn) }); } }, o); };
  window.setTimeout = function (fn, ms0, ...rest) { if (typeof fn !== 'function') return st0.call(window, fn, ms0, ...rest); return st0.call(window, function (...x) { const t = performance.now(); try { return fn(...x); } finally { const ms = performance.now() - t; if (ms >= 8) between.push({ at: Math.round(t - t00), ms: +ms.toFixed(1), what: 'timer: ' + label(fn) }); } }, ms0, ...rest); };
  const raf0 = window.requestAnimationFrame;
  window.requestAnimationFrame = function (fn) { const l = label(fn); if (/_loop/.test(l)) return raf0.call(window, fn); return raf0.call(window, function (ts) { const t = performance.now(); try { return fn(ts); } finally { const ms = performance.now() - t; if (ms >= 8) between.push({ at: Math.round(t - t00), ms: +ms.toFixed(1), what: 'raf: ' + l }); } }); };
  const BP = (await import('./src/game/bots.js')).BotBrain.prototype; wrap(BP, 'update', 'bots');
  // the load's last steps, between frames (timed like the idle callbacks)
  const timed = (obj, key, name) => { if (!obj || typeof obj[key] !== 'function') return; const f = obj[key]; obj[key] = function (...a) { const t = performance.now(); try { return f.apply(this, a); } finally { const ms = performance.now() - t; if (ms >= 8 && !cur) between.push({ at: Math.round(t - t00), ms: +ms.toFixed(1), what: name }); } }; };
  const MP = (await import('./src/game/match.js')).Match.prototype; timed(MP, 'start', 'match.start'); timed(MP, 'setState', 'match.setState');
  timed(g, '_fade', 'fade'); timed(g.hud, 'setVisible', 'hud.setVisible'); timed(g.menus, 'show', 'menus.show'); timed(G.music, 'play', 'music.play'); timed(g, '_warmStage', 'warmStage (sync part)');
  // main-thread long tasks (> 50 ms) from now on: a gap with one is the page's own work; without, the browser's / GPU's
  const longs = []; let lto = null;
  try { lto = new PerformanceObserver((l) => { for (const e of l.getEntries()) longs.push({ at: Math.round(e.startTime - t00), ms: Math.round(e.duration), what: e.attribution?.[0]?.name || e.name }); }); lto.observe({ entryTypes: ['longtask'] }); } catch (e) { /* */ }
  // (long animation frames: the scripts in each, with what started them — a promise's continuation, a timer, a frame
  // callback — and where: the long tasks' attribution is 'unknown')
  let loaf = null;
  try { loaf = new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.duration < 80) continue; const sc = (e.scripts || []).filter((x) => x.duration >= 15).slice(0, 4).map((x) => Math.round(x.duration) + ' ms ' + x.invokerType + ':' + x.invoker + ' ' + String(x.sourceURL || '').split('/').slice(-2).join('/') + ':' + (x.sourceFunctionName || '?') + '@' + x.sourceCharPosition); longs.push({ at: Math.round(e.startTime - t00), ms: Math.round(e.duration), what: 'animation frame (block ' + Math.round(e.blockingDuration || 0) + ' ms, render ' + Math.round(e.renderStart ? e.startTime + e.duration - e.renderStart : 0) + ' ms): ' + (sc.join(' ; ') || 'no script over 15 ms') }); } }); loaf.observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { /* */ }
  // who uses a fresh program: the objects (in the scene, or a scene drawn this frame) whose material runs it
  const drawn = new Set(), rnd0 = R.render;
  R.render = function (sc, cam) { if (sc) drawn.add(sc); return rnd0.call(this, sc, cam); };
  const whoUses = (fresh) => {
    const who = [], P = R.properties, path = (o) => { const n = []; for (let x = o; x && n.length < 3; x = x.parent) n.push(x.name || x.type); return n.join('<'); };
    for (const sc of [G.scene, ...drawn]) sc.traverse((o) => { if (who.length >= 6) return; const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const mt of ms) { const pr = P.get(mt)?.currentProgram; if (pr && fresh.has(pr)) { who.push((sc === G.scene ? '' : '[own pass] ') + path(o) + ':' + (mt.name || mt.type) + (o.visible ? '' : '(hidden)')); break; } } });
    return who;
  };
  // the forced first uses, at the first frame of play: a Sponge Mitts punch (its trigger held 0.4 s) and a paint flood
  const forced = { punched: 0, flood: false, fistsSeen: 0 };
  const MITTS = (await import('./src/game/kits/mitts.js')).MITTS;
  const force = () => {
    const m = g.match, mitts = m.actors.find((a) => a.weapon?.kind === 'mitts' && a.bot);
    if (mitts) { let t = 0.4; const bu = mitts.bot.update; mitts.bot.update = function (dt) { const r = bu.call(this, dt); if (t > 0) { t -= dt; mitts.intent.fire = true; mitts.intent.squid = false; mitts.intent.special = false; mitts.intent.sub = false; } else mitts.bot.update = bu; return r; }; forced.punched = 1; }
    if (!mitts && !m.actors.some((a) => a.bot)) forced.punched = -1;   // (a stage with no bots: DEVSTAGE's Cargo Terminal walk)
    const cam = G.camera.position, L = G.level, P = G.paint;
    // (the turf faces nearest the camera, a floor's first: the first whose live cells a flood takes)
    const faces = L.faces.filter((f) => f.turf && f.atlas && f.nu * f.nv >= 4).map((f) => ({ f, d: Math.hypot(f.origin.x - cam.x, f.origin.z - cam.z) - (f.normal?.y > 0.7 ? 1e3 : 0) })).sort((x, y) => x.d - y.d);
    for (const { f } of faces.slice(0, 40)) {
      if (!P?.flood || forced.flood) break;
      const cells = [], xs = [], zs = [];
      for (let j = 0; j < f.nv; j++) for (let i = 0; i < f.nu; i++) { const k = f.grid + j * f.nu + i; if (!P.dead?.[k] && P.live?.[k] !== 0) cells.push(k); const s = (i + 0.5) * f.cu, t2 = (j + 0.5) * f.cv; xs.push(f.origin.x + f.u.x * s + f.v.x * t2); zs.push(f.origin.z + f.u.z * s + f.v.z * t2); }
      if (cells.length < 4) continue;
      const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, z0 = Math.min(...zs) - 1, z1 = Math.max(...zs) + 1;
      const region = { cells: Int32Array.from(cells), polys: [[[x0, z0], [x1, z0], [x1, z1], [x0, z1]]], y0: f.origin.y - 50, y1: f.origin.y + 50 };
      forced.flood = !!P.flood(region, 0, { center: [(x0 + x1) / 2, (z0 + z1) / 2], y: f.origin.y, dur: 0.4 });
    }
  };
  const f0 = g._frame;
  g._frame = function (dt) {
    const counting = G.mode === 'match' && g.match && !g.match.attract && !g.match.loading;
    if (!counting || done) return f0.call(this, dt);
    probes();
    const p0 = info.programs ? info.programs.length : 0, tx0 = info.memory.textures, ge0 = info.memory.geometries, pset = new Set(info.programs || []);
    cur = { t: 0, parts: {}, state: g.match.state };
    const t = performance.now();
    try { return f0.call(this, dt); } finally {
      const end = performance.now();
      cur.ms = end - t; cur.gap = lastEnd ? t - lastEnd : 0; lastEnd = end;   // (gap: the wait since the last frame ended — idle callbacks, GC, the browser's own work)
      cur.programs = (info.programs ? info.programs.length : 0) - p0; cur.textures = info.memory.textures - tx0; cur.geometries = info.memory.geometries - ge0;
      if (cur.programs > 0) {
        const fresh = new Set((info.programs || []).filter((q) => !pset.has(q)));
        cur.progNames = [...fresh].map((q) => q.name || q.type).slice(0, 6);
        cur.progWho = whoUses(fresh);   // (who uses them: name, or the parents' names)
      }
      drawn.clear();
      if (MITTS?.fists?.length) forced.fistsSeen = Math.max(forced.fistsSeen, MITTS.fists.length);
      cur.at = Math.round(t - t00);
      if (!onAt) { onAt = t; try { performance.mark('ff-on'); } catch (e) { /* */ } } cur.t = t - onAt;
      if (g.match.state === 'playing' && !playAt) { playAt = t; force(); }
      frames.push(cur); cur = null;
      if (playAt && t - playAt > ${play * 1000}) done = true;
    }
  };
  const t0 = performance.now();
  await g.api.startMatch({ mapId: '${mapId}', mode: '${mode}', duration: 180 });
  const loadMs = performance.now() - t0;
  for (let i = 0; i < 600 && !done; i++) await new Promise((r) => setTimeout(r, 50));
  g._frame = f0; window.requestIdleCallback = ric0; window.setTimeout = st0; window.requestAnimationFrame = raf0;
  try { lto?.disconnect(); loaf?.disconnect(); } catch (e) { /* */ }   // (the stepped phase below runs frames in batches: its long tasks are ours)
  // first use: EXTRA s more of play, stepped (our own frames, each rendered), every special charged now and every 10 s
  const later = [];
  if (${EXTRA} > 0 && g.match && g.match.state === 'playing') {
    const charge = () => { for (const a of g.match.actors) if (a.special < a.specialCost() * 0.5) a.special = a.specialCost(); };
    charge();
    const end = G.time + ${EXTRA}; let k = 0;
    while (G.time < end && g.match.state === 'playing') {
      const pset = new Set(info.programs || []);
      try { g._frame(1 / 60); } catch (e) { later.push({ at: +(G.time - end + ${EXTRA}).toFixed(2), n: 0, frameError: String(e && e.message || e).slice(0, 160) }); if (later.length > 40) break; }
      const fresh = new Set((info.programs || []).filter((q) => !pset.has(q)));
      if (fresh.size) later.push({ at: +(G.time - end + ${EXTRA}).toFixed(2), n: fresh.size, names: [...fresh].map((q) => q.name || q.type).slice(0, 4), who: whoUses(fresh) });
      drawn.clear();
      if (MITTS?.fists?.length) forced.fistsSeen = Math.max(forced.fistsSeen, MITTS.fists.length);
      if (++k % 20 === 0) await new Promise((r) => setTimeout(r, 0));
      if (k % 600 === 0) charge();
    }
  }
  R.render = rnd0;
  const on0 = frames.length ? frames[0].at : 0;
  try { lto?.disconnect(); } catch (e) { /* */ }
  for (const x of longs) if (x.at >= on0 - 50) between.push({ at: x.at, ms: x.ms, what: 'longtask ' + x.what });
  return { later, forced, lineup: g.match ? g.match.actors.map((a) => [a.weapon?.kind, a.sub?.kind, a.specialId].join('/')) : [], warmMs: g.warmMs,
    between: between.filter((x) => x.at >= on0 - 50).map((x) => ({ ...x, at: x.at - on0 })), before: between.filter((x) => x.at < on0 - 50).length, loadMs: Math.round(loadMs), got: g.mapDef && g.mapDef.id, worldKey: g.worldKey, done, frames: frames.map((f) => ({ ...f, ms: +f.ms.toFixed(1), gap: +f.gap.toFixed(1), t: Math.round(f.t),
    parts: Object.fromEntries(Object.entries(f.parts).filter(([, v]) => v >= 2).map(([k, v]) => [k, +v.toFixed(1)])) })) };
})()`;

// TRACE=1: the renderer main thread's long tasks from the match's first frame on, each with its innermost long parts
function traceReport(file, r) {
  const T = JSON.parse(fs.readFileSync(file, 'utf8')), ev = T.traceEvents || T;
  const tn = new Map(); for (const e of ev) if (e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name);
  const on = ev.find((e) => e.name === 'ff-on');
  if (!on) { console.log('TRACE no first-frame mark'); return; }
  const span = ((r.frames.length ? r.frames[r.frames.length - 1].t : 0) + 200) * 1000;
  const main = ev.filter((e) => tn.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ph === 'X' && e.ts + (e.dur || 0) > on.ts - 50000 && e.ts < on.ts + span);
  const big = main.filter((e) => e.dur > 50000), tops = big.filter((e) => !big.some((o) => o !== e && o.ts <= e.ts && o.ts + o.dur >= e.ts + e.dur && (o.ts < e.ts || o.dur > e.dur))).sort((a, b) => a.ts - b.ts);   // (outermost)
  for (const t of tops.slice(0, 12)) {
    const inner = main.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.dur > 0.2 * t.dur).sort((a, b) => a.dur - b.dur).slice(0, 5);
    const d = (e) => { const x = e.args?.data || {}; return x.functionName ? `(${x.functionName} ${String(x.url || '').split('/').pop()}:${x.lineNumber})` : x.url ? `(${String(x.url).split('/').pop()})` : ''; };
    console.log(`   TRACE task @${Math.round((t.ts - on.ts) / 1000)} ms ${(t.dur / 1000).toFixed(1)} ms ${t.name} ${t.args?.src_func || ''}: ${inner.map((e) => `${(e.dur / 1000).toFixed(1)} ${e.name}${d(e)}`).join(' | ')}`);
  }
  if (!tops.length) console.log('   TRACE no main-thread task over 50 ms from the first frame through play');
  if (process.env.TRACE_KEEP) { try { fs.copyFileSync(file, process.env.TRACE_KEEP + '/trace-' + r.got + '.json'); } catch (e) { /* */ } }
  try { fs.unlinkSync(file); } catch (e) { /* */ }
}
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
        const idx = Math.max(0, all.indexOf(id));   // (the lineup turns with the stage's place in MAPS, however it is run)
        // a fresh page: the player's first match on this stage after the app starts
        await win.loadURL('app://inkwave/index.html?autopilot');
        for (let i = 0; i < 160 && !(await js(`!!window.__inkwave?.api && window.__G?.mode === 'menu'`)); i++) await wait(250);
        await js('window.__inkwave._onPointerUnlock = () => {}; 0');
        await wait(1500);   // (the menu's own first frames settle)
        if (process.env.TRACE === '1') await contentTracing.startRecording({ included_categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'blink.user_timing', 'v8', 'gpu', 'cc', 'toplevel', 'media', '__metadata', 'disabled-by-default-v8.cpu_profiler'] });
        const r = await js(PROBE(id, MODE, PLAY, idx));
        if (process.env.TRACE === '1') { try { traceReport(await contentTracing.stopRecording(), r); } catch (e) { console.log('TRACE ERROR', e.message); } }
        if (r.got !== id) { console.log(`MAP MISMATCH: asked for ${id}, the game built ${r.got}`); total++; continue; }
        const F = r.frames, intro = F.filter((f) => f.state !== 'playing'), play = F.filter((f) => f.state === 'playing');
        const worst = (L) => L.reduce((w, f) => (!w || f.ms > w.ms ? f : w), null);
        const wi = worst(intro), wp = worst(play), over = F.filter((f) => f.ms >= BAR);
        const wg = F.reduce((w, f) => (!w || f.gap > w.gap ? f : w), null), gaps = F.filter((f) => f.gap >= BAR);   // (between frames: not in the issue log's frame time, but a hitch all the same)
        console.log(`== ${id} [${MODE}, world ${r.worldKey}]: load ${r.loadMs} ms | ${F.length} frames (${intro.length} intro, ${play.length} play) | worst intro ${wi ? wi.ms + ' ms @' + wi.t : '-'} | worst play ${wp ? wp.ms + ' ms @' + wp.t : '-'} | over ${BAR} ms: ${over.length} | worst gap between frames ${wg ? wg.gap + ' ms @' + wg.t : '-'} (over ${BAR}: ${gaps.length})${r.done ? '' : ' | (play not reached / not 3 s long)'}`);
        for (const f of F.filter((x) => x.ms >= Math.min(BAR, 50) || x.gap >= BAR).slice(0, 12)) console.log(`   frame @${f.t} ms [${f.state}] ${f.ms} ms (after a ${f.gap} ms gap) | programs +${f.programs}${f.progNames ? ' ' + JSON.stringify(f.progNames) + ' used by ' + JSON.stringify(f.progWho || []) : ''} textures +${f.textures} geometries +${f.geometries} | ${JSON.stringify(f.parts)}`);
        for (const x of r.between.slice(0, 10)) console.log(`   between frames @${x.at} ms: ${x.ms} ms in ${x.what}`);
        { const n = F.slice(0, 3); console.log(`   first frames: ${n.map((f) => `${f.ms} ms (programs +${f.programs}, textures +${f.textures}) ${JSON.stringify(f.parts)}`).join(' · ')}`); }
        console.log(`   lineup ${r.lineup.join(' ')} | warm ${r.warmMs} ms | forced: punch ${r.forced.punched === -1 ? 'none (no bots)' : r.forced.punched ? 'held' : 'NO MITTS'} (fists seen ${r.forced.fistsSeen}), flood ${r.forced.flood ? 'on' : 'NONE'}`);
        const ok = r.done && over.length === 0 && gaps.length === 0;
        console.log(`${ok ? 'PASS' : 'FAIL'} ${id} first frames under ${BAR} ms, and no gap between them over ${BAR} ms  ${JSON.stringify({ worstIntro: wi && wi.ms, worstPlay: wp && wp.ms, over: over.length, worstGap: wg && wg.gap, gaps: gaps.length, loadMs: r.loadMs })}`);
        pass += ok; total++;
        const progF = F.filter((f) => f.programs > 0), nProg = progF.reduce((n, f) => n + f.programs, 0);
        const okP = r.done && nProg === 0 && (r.forced.fistsSeen > 0 || r.forced.punched === -1) && r.forced.flood;
        console.log(`${okP ? 'PASS' : 'FAIL'} ${id} no shader program compiled in the first frames (a Mitts punch and a flood forced at the first frame of play)  ${JSON.stringify({ programs: nProg, inFrames: progF.length, punched: r.forced.fistsSeen > 0, flood: r.forced.flood, first: progF.slice(0, 3).map((f) => ({ at: f.t, state: f.state, ms: f.ms, n: f.programs, who: (f.progWho || []).slice(0, 3) })) })}`);
        pass += okP; total++;
        if (EXTRA > 0) {
          const nL = r.later.reduce((n, x) => n + x.n, 0), errs = r.later.filter((x) => x.frameError);
          if (errs.length) console.log(`FRAME ERRORS ${id}: ${errs.length} in the stepped play, the first: ${errs[0].frameError}`);
          console.log(`${nL === 0 && !errs.length ? 'PASS' : 'FAIL'} ${id} no shader program compiled in ${EXTRA} s more of play, every special charged (first use of every kit, sub and special in the lineup)  ${JSON.stringify({ programs: nL, frameErrors: errs.length, first: r.later.filter((x) => x.n).slice(0, 4) }).slice(0, 1400)}`);
          pass += nL === 0 && !errs.length; total++;
        }
      }
      console.log(`RESULT ${pass}/${total}`);
    } catch (e) { console.log('HARNESS ERROR', e.message, e.stack); }
    console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 5).join(' || ') : 'none');
    app.quit();
  });
});
