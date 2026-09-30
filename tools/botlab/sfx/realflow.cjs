// Botlab: the sub / special cues as the PLAYER hears them, through the real menus (trusted input, like
// tools/botlab/quit-check.cjs — no api.startMatch). An AnalyserNode taps the master output and every voice's own output
// (after its distance roll-off and panning: what reaches the mix), so each cue's audible level can be compared with the
// ordinary weapon fire and splats around it, in dB.
//   BOTLAB_OUT=… SLOTS=4 tools/botlab/run.sh tools/botlab/sfx/realflow.cjs            (OUT=file.json: the numbers)
// Flow: title → (a key: the first gesture starts the audio) → main → PLAY → TURF WAR → START! → the match; staged
// scenes from the local player's view (you throw each sub; an enemy 7 m off throws each sub at you; enemy specials near
// you), each over a busy fight (you firing, an enemy firing at you); then pause / resume, quit to the menu, a second
// match, practice and its loadout screen — in each: the cue director updating (not quiet), the loop bus open, the
// listener set, the cue voices' gains live.
// Then the regression bars: per cue family, the median audible level (a voice's loudest 43 ms, after its roll-off and
// panning) against your own weapon fire, and against the music; the enemy's warnings standing out; nothing painful.
// (The first fix, 2026-10-01: the cues had been 8–18 dB under the gun and the music — played, but masked.)
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const R = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 900000));

// ---- the page-side probe: master + per-voice analysers, the cue director's pulse
const PROBE = `(() => {
  if (window.__probe) return true;
  const G = __G, A = G.audio, ctx = A.ctx;
  if (!ctx) return false;
  const mk = () => { const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; return an; };
  const buf = new Float32Array(2048);
  const lvl = (an) => { an.getFloatTimeDomainData(buf); let s = 0, p = 0; for (let i = 0; i < buf.length; i++) { s += buf[i] * buf[i]; const a = Math.abs(buf[i]); if (a > p) p = a; } return [Math.sqrt(s / buf.length), p]; };
  const master = mk(); (A.limiter || A.master).connect(master);
  const music = mk(); A.duckG.connect(music);   // the music after its volume and any duck (before the master, like each voice)
  const P = { taps: [], done: [], masterMax: 0, masterSum: 0, masterN: 0, music: {},  cue: { calls: 0, quiet: 0, lastQuiet: null, live: 0, maxLive: 0 }, voiceBad: [] };
  let cur = null;
  const oPlay = A.play.bind(A), oLoop = A.loop.bind(A), oVoice = A._voice.bind(A);
  A._voice = (def, t, pos, vol, withFade, ref) => {
    const v = oVoice(def, t, pos, vol, withFade, ref);
    try {
      const node = v.panner || v.fade || v.out, an = mk(); node.connect(an);
      if (!(vol > 0) || !Number.isFinite(vol)) P.voiceBad.push({ name: cur, vol });
      P.taps.push({ name: cur, an, node, v, t0: performance.now(), g0: G.time, pos: pos ? { x: pos.x, y: pos.y, z: pos.z } : null, vol, loop: !!withFade, max: 0, peak: 0, sum: 0, n: 0,
        d: pos ? Math.hypot(pos.x - A.L.x, pos.y - A.L.y, pos.z - A.L.z) : 0, scene: P.scene || null });
    } catch (e) { /* */ }
    return v;
  };
  // voices the engine had to steal (over its caps) — by name, and whether it was a cue's
  P.stolen = {}; const names = new WeakMap(); const oSteal = A._steal.bind(A);
  A._steal = (voice, now) => { if (voice && !voice.stolen && !(voice.v && voice.v.dead)) { const n = names.get(voice) || '?'; P.stolen[n] = (P.stolen[n] || 0) + 1; } return oSteal(voice, now); };
  const oVoice2 = A._voice; A._voice = (...args) => { const v = oVoice2(...args); names.set(v, cur); return v; };
  A.play = (n, o) => { cur = n; try { return oPlay(n, o); } finally { cur = null; } };
  A.loop = (n, o) => { cur = n; try { return oLoop(n, o); } finally { cur = null; } };
  if (G.cues && !G.cues.__probed) {
    G.cues.__probed = true;
    const up = G.cues.update.bind(G.cues);
    G.cues.update = (dt, o) => { P.cue.calls++; if (o && o.quiet) P.cue.quiet++; P.cue.lastQuiet = !!(o && o.quiet); up(dt, o); P.cue.live = G.cues.live().length; P.cue.maxLive = Math.max(P.cue.maxLive, P.cue.live); };
  }
  const poll = () => {
    const now = performance.now();
    const [mr] = lvl(master); P.masterMax = Math.max(P.masterMax, mr); if (mr > 1e-5) { P.masterSum += mr * mr; P.masterN++; }
    if (P.scene) { const [qr] = lvl(music); const M = P.music[P.scene] || (P.music[P.scene] = { sum: 0, n: 0 }); M.sum += qr * qr; M.n++; }
    for (let i = P.taps.length - 1; i >= 0; i--) {
      const tp = P.taps[i]; const [r, p] = lvl(tp.an);
      if (r > tp.max) tp.max = r; if (p > tp.peak) tp.peak = p; if (r > 1e-5) { tp.sum += r * r; tp.n++; }
      if (tp.v.v.dead || tp.v.done || (!tp.loop && now - tp.t0 > 4000) || (tp.loop && now - tp.t0 > 20000)) {
        try { tp.node.disconnect(tp.an); } catch (e) { /* */ }
        P.done.push({ name: tp.name, scene: tp.scene, max: tp.max, peak: tp.peak, mean: tp.n ? Math.sqrt(tp.sum / tp.n) : 0, loop: tp.loop, pos: !!tp.pos, d: tp.d, vol: tp.vol, g0: tp.g0 });
        P.taps.splice(i, 1);
      }
    }
  };
  P.flush = () => { for (const tp of P.taps) P.done.push({ name: tp.name, scene: tp.scene, max: tp.max, peak: tp.peak, mean: tp.n ? Math.sqrt(tp.sum / tp.n) : 0, loop: tp.loop, pos: !!tp.pos, d: tp.d, vol: tp.vol, g0: tp.g0, open: true }); };
  setInterval(poll, 12);
  window.__probe = P;
  return true;
})()`;

let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load', async () => {
    const js = (c) => win.webContents.executeJavaScript(c, true);
    const errs = [];
    win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level)) || /TypeError|ReferenceError/.test(m)) errs.push(m.slice(0, 300)); });
    try {
      for (let i = 0; i < 160; i++) { if (await js('!!(window.__inkwave && window.__inkwave.menus && window.__inkwave.menus.current)')) break; await wait(250); }
      for (let i = 0; i < 80; i++) { if (await js(`window.__inkwave.menus.current === 'title'`)) break; await wait(250); }
      await wait(800);
      // trusted input
      const KC = { Enter: 'Return', Escape: 'Escape', KeyL: 'L', KeyE: 'E' };
      const key = async (k) => { win.webContents.sendInputEvent({ type: 'keyDown', keyCode: KC[k] || k }); await wait(50); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: KC[k] || k }); await wait(50); };
      const click = async (sel, re) => {
        const r = await js(`(() => { const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 4 && b.height > 4 && getComputedStyle(e).visibility !== 'hidden'; });
          const e = ${re ? `els.find((x) => ${re}.test(x.textContent))` : 'els[0]'}; if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
        if (!r) return false;
        win.webContents.sendInputEvent({ type: 'mouseMove', x: r.x, y: r.y });
        await wait(40);
        win.webContents.sendInputEvent({ type: 'mouseDown', x: r.x, y: r.y, button: 'left', clickCount: 1 });
        await wait(70);
        win.webContents.sendInputEvent({ type: 'mouseUp', x: r.x, y: r.y, button: 'left', clickCount: 1 });
        return true;
      };
      const screen = () => js('window.__inkwave.menus.current');
      // the "What's New" card (first main menu of an update) sits over the menu: close it as a player would
      const dismiss = async () => {
        for (let i = 0; i < 3; i++) {
          if (!(await js(`!!document.querySelector('.iw-modal:not(.is-leaving)')`))) return;
          await key('Escape'); await wait(700);
          if (await js(`!!document.querySelector('.iw-modal:not(.is-leaving)')`)) { await click('.iw-modal .iw-btn'); await wait(700); }
        }
      };
      const until = async (cond, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(cond)) return true; await wait(150); } return false; };
      // the state of the audio path right now
      const audioState = () => js(`(() => { const G = __G, A = G.audio, g = window.__inkwave, P = window.__probe, m = G.match;
        const cam = (g.rig && g.rig.gameCam) || G.camera;
        return { ctx: A.ctx ? A.ctx.state : 'none', vol: { ...A.vol }, settings: { master: g.settings.master, music: g.settings.music, sfx: g.settings.sfx },
          master: A.master ? +A.master.gain.value.toFixed(3) : null, sfxBus: A.sfxBus ? +A.sfxBus.gain.value.toFixed(3) : null, sfxIn: A.sfxIn ? +A.sfxIn.gain.value.toFixed(3) : null,
          loopIn: A.loopIn ? +A.loopIn.gain.value.toFixed(3) : null, loopsPaused: !!A.loopsPaused, duck: A.duckG ? +A.duckG.gain.value.toFixed(3) : null,
          listenerOff: cam ? +Math.hypot(A.L.x - cam.position.x, A.L.y - cam.position.y, A.L.z - cam.position.z).toFixed(2) : null,
          cue: P ? { ...P.cue } : null, cueLive: G.cues ? G.cues.live().length : null, screen: g.menus.current, mode: G.mode,
          match: m ? { attract: !!m.attract, state: m.state, paused: !!m.paused, practice: !!m.practice } : null, fullFrame: !!(g.showcase && g.showcase.fullFrame),
          stored: (() => { try { return JSON.parse(localStorage.getItem('inkwave.settings') || localStorage.getItem('inkwave_settings') || 'null'); } catch (e) { return 'err'; } })() }; })()`);

      // ---- 1) title: the first gesture (a key) starts the audio
      R('boot: the title screen', (await screen()) === 'title');
      await key('Enter'); await wait(1500);
      const okProbe = await js(PROBE);
      let st = await audioState();
      R('the first key starts the audio: the context runs, the buses are open', okProbe && st.ctx === 'running' && st.master > 0.3 && st.sfxBus > 0.3 && st.loopIn > 0.95, st);
      R('defaults: master 0.8 / music 0.6 / sfx 0.85 in the settings and the engine', st.settings.master === 0.8 && st.settings.music === 0.6 && st.settings.sfx === 0.85 && st.vol.master === 0.8 && st.vol.sfx === 0.85, { settings: st.settings, vol: st.vol });
      for (let i = 0; i < 20 && (await screen()) !== 'main'; i++) await wait(250);
      await wait(1200); await dismiss();
      R('on the main menu', (await screen()) === 'main', await screen());
      st = await audioState();
      R('main menu: the cue director runs (the backdrop match)', st.cue && st.cue.calls > 10, st.cue);

      // ---- 2) PLAY → TURF WAR → START! (trusted clicks)
      await click('[data-id="play"]'); await until(`window.__inkwave.menus.current === 'mode'`, 8000); await wait(700);
      await click('.iw-mode--turf'); await until(`window.__inkwave.menus.current === 'setup'`, 8000); await wait(1200);
      const stage = await js(`(window.__inkwave.menus._setup && window.__inkwave.menus._setup.mapId) || null`);
      await js('window.__inkwave._onPointerUnlock = () => {}; 0');   // (an offscreen window can't hold the pointer: a lost lock mustn't pause)
      await click('[data-id="start"]');
      const began = await until(`!!(__G.match && !__G.match.attract && __G.match.state === 'playing')`, 60000);
      R('PLAY → TURF WAR → START! reaches a live match', began, { stage, screen: await screen() });
      await wait(1500);
      st = await audioState();
      R('in the match: the director updates (not quiet), the loop bus is open, the listener is on the camera, the context runs',
        st.cue.calls > 0 && st.cue.lastQuiet === false && st.loopIn > 0.95 && st.listenerOff < 0.05 && st.ctx === 'running' && st.duck > 0.5, st);

      // ---- 3) staged scenes from the local player's view, over a busy fight
      const scenes = await js(`(async () => {
        const g = window.__inkwave, G = __G, m = G.match, P = window.__probe, A = G.audio;
        const { SUBS, SPECIALS, PLAYER } = await import('./src/config.js');
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const me = m.local, foes = m.actors.filter((a) => a.team !== me.team), mates = m.actors.filter((a) => a.team === me.team && a !== me);
        const E = foes[0], E2 = foes[1];
        const idle = () => {};
        for (const a of [E, E2]) if (a.bot) { a._bu = a.bot.update; a.bot.update = idle; }
        const tank = setInterval(() => { for (const a of [me, E, E2]) { if (!a.alive) a.respawn(); a.hp = 1e6; a.ink = PLAYER.inkMax; } }, 100);
        // a clear run of deck: a direction from a nav node with 12 m of floor and no wall
        const V3 = me.pos.constructor, Gl = G.level;
        // (deterministic: the nav nodes nearest the stage's middle first; the run needs 3 m of floor either side too)
        let spot = null;
        const nodes = ((G.nav && G.nav.nodes) || []).slice().sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
        for (const n of nodes) {
          for (let a = 0; a < 8 && !spot; a++) {
            const yaw = a * Math.PI / 4, dx = Math.sin(yaw), dz = Math.cos(yaw);
            let ok = true;
            for (let s = -5; s <= 17 && ok; s += 1) for (const side of [-3, 0, 3]) { const x = n.x + dx * s + dz * side, z = n.z + dz * s - dx * side, gy = Gl.groundHeight(x, z, n.y + 1.2); if (gy === -Infinity || Math.abs(gy - n.y) > 0.3) { ok = false; break; } }
            if (ok && !G.physics.los(new V3(n.x, n.y + 1.2, n.z), new V3(n.x + dx * 16, n.y + 1.2, n.z + dz * 16))) ok = false;
            if (ok) spot = { x: n.x, y: n.y, z: n.z, dx, dz, yaw };
          }
          if (spot) break;
        }
        if (!spot) return { error: 'no clear spot' };
        const at = (s, side = 0) => ({ x: spot.x + spot.dx * s + spot.dz * side, y: spot.y, z: spot.z + spot.dz * s - spot.dx * side });
        const place = (a, p) => { a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); a.grounded = false; };
        const faceAt = (a, p) => { const y = Math.atan2(p.x - a.pos.x, p.z - a.pos.z); a.yaw = a.aimYaw = y; };
        const lob = (e, p, speed, grav = 24, from = 1.35) => {
          const d = Math.hypot(p.x - e.pos.x, p.z - e.pos.z); let best = 0, be = 1e9;
          for (let q = -0.6; q <= 0.8; q += 0.005) { const tp = Math.min(1.1, Math.max(-0.3, q + 0.28)), vx = Math.cos(tp) * speed, vy = Math.sin(tp) * speed + 1.5, disc = vy * vy + 2 * grav * from; const err = Math.abs((vx * (vy + Math.sqrt(disc))) / grav - d); if (err < be) { be = err; best = q; } }
          e.yaw = e.aimYaw = Math.atan2(p.x - e.pos.x, p.z - e.pos.z); e.aimPitch = best; e.aimPoint.set(p.x, p.y + 0.5, p.z);
        };
        // you, at the start of the run, the camera behind you looking down it
        const settle = async () => { place(me, at(0)); g.rig.yaw = spot.yaw; g.rig.pitch = -0.12; await wait(400); };
        await settle();
        // the busy fight: you firing, an enemy 8 m off (to the side) firing at you
        place(E2, at(8, 3)); faceAt(E2, me.pos); E2.aimPitch = 0; E2.aimPoint.set(me.pos.x, me.pos.y + 1, me.pos.z);
        const fight = (on) => { g.debug.fire(on); E2.intent.fire = on; };
        // each scene starts with you back at the start of the run, the camera behind you (a vortex's pull, a slam's
        // shove mustn't carry into the next one)
        const scene = async (name, ms, fn) => { place(me, at(0)); g.rig.yaw = spot.yaw; g.rig.pitch = -0.12; await wait(250); P.scene = name; await fn(); await wait(ms); P.scene = null; };
        const kinds = ['bomb', 'sticky', 'burst', 'seeker', 'scan', 'curtain', 'sprinkler', 'mine', 'beacon', 'mist', 'shaker', 'waddle', 'torpedo', 'tracer', 'boomerang'];
        const throwBy = (a, k) => { a.setSub(k); a.ink = PLAYER.inkMax; if (k === 'bomb') G.projectiles.throwBomb(a); else G.subs.use(a, SUBS[k]); };
        const clearWorld = () => { G.projectiles.bombs.length && G.projectiles.bombs.splice(0).forEach((b) => G.scene.remove(b.mesh)); };
        fight(true);
        await scene('fight', 2500, async () => {});
        // (a) you throw each sub, 6 m down the run
        for (const k of kinds) {
          await scene('own:' + k, k === 'sticky' || k === 'mist' ? 3200 : 2400, async () => { place(me, at(0)); const p = at(6); lob(me, p, SUBS[k].throwSpeed || 13); if (k === 'tracer' || k === 'boomerang') { me.aimPitch = -0.05; me.aimPoint.set(p.x, p.y + 1, p.z); } throwBy(me, k); });
        }
        // (b) an enemy 7 m off throws each sub at you (landing ~1.5 m in front of you)
        place(E, at(7)); faceAt(E, me.pos);
        for (const k of kinds) {
          await scene('foe:' + k, k === 'sticky' || k === 'mist' || k === 'waddle' || k === 'seeker' ? 3600 : 2600, async () => {
            // (your stream would shoot a Torpedo / Waddle down before it gets going: hold fire for those two)
            g.debug.fire(!(k === 'torpedo' || k === 'waddle'));
            place(me, at(0)); place(E, k === 'mine' || k === 'beacon' ? at(3) : at(7)); const p = at(1.5); lob(E, p, SUBS[k].throwSpeed || 13);
            if (k === 'tracer' || k === 'boomerang') { E.aimPitch = 0; E.aimPoint.set(me.pos.x, me.pos.y + 1, me.pos.z); }
            throwBy(E, k);
            if (k === 'mine') setTimeout(() => place(me, at(2.4)), 1200);   // walk onto it
          });
        }
        g.debug.fire(true);
        // (c) enemy specials near you
        const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
        const endSp = (e) => { if (e.specialActive) { try { G.specials.end(e, 'time'); } catch (x) { /* */ } } };
        const sp = {
          slam: async () => { place(E, at(3)); start(E, 'slam'); },
          strike: async () => { place(E, at(12)); const s = start(E, 'strike'); s.target.set(me.pos.x, 0, me.pos.z + 0.5); s.confirm = true; },
          booyah: async () => { place(E, at(9)); const s = start(E, 'booyah'); s.charge = 0.97; await wait(300); lob(E, at(1), SPECIALS.booyah.throwSpeed); E.intent.fire = true; await wait(60); E.intent.fire = false; },
          kraken: async () => { place(E, at(6)); start(E, 'kraken'); E.intent.move.set(-spot.dx, 0, -spot.dz); await wait(700); E.intent.move.set(0, 0, 0); E.intent.fire = true; await wait(60); E.intent.fire = false; },
          crab: async () => { place(E, at(7)); start(E, 'crab'); faceAt(E, me.pos); E.intent.move.set(-spot.dx * 0.5, 0, -spot.dz * 0.5); await wait(900); E.intent.move.set(0, 0, 0); E.aimPitch = 0.1; E.intent.sub = true; await wait(60); E.intent.sub = false; await wait(800); E.intent.fire = true; },
          zooka: async () => { place(E, at(16, 1.2)); start(E, 'zooka'); await wait(300); faceAt(E, at(-8)); E.aimPitch = 0; E.aimPoint.set(at(-8).x, at(-8).y + 1.2, at(-8).z); E.intent.fire = true; await wait(1200); E.intent.fire = false; },
          storm: async () => { place(E, at(8)); lob(E, at(1), SPECIALS.storm.throwSpeed, 24, 1.45); start(E, 'storm'); },
        };
        for (const [id, fn] of Object.entries(sp)) { await scene('sp:' + id, id === 'storm' ? 5500 : 3800, fn); E.intent.fire = false; E.intent.move.set(0, 0, 0); endSp(E); await wait(300); }
        fight(false);
        clearInterval(tank);
        for (const a of [E, E2]) if (a.bot && a._bu) a.bot.update = a._bu;
        return { spot, stage: G.level.layout && G.level.layout.id, voices: P.done.length };
      })()`);
      R('staged scenes ran (a clear run of deck on the stage)', scenes && !scenes.error, scenes);
      await wait(1500);
      const P = await js(`(() => { const P = window.__probe; P.flush(); const A = __G.audio;
        return { done: P.done.filter((d) => d.scene), voiceBad: P.voiceBad.slice(0, 10), masterMax: P.masterMax, sfxBus: A.sfxBus.gain.value, stolen: P.stolen, counts: { ...A.counts },
          music: Object.fromEntries(Object.entries(P.music).map(([k, v]) => [k, v.n ? Math.sqrt(v.sum / v.n) : 0])) }; })()`);
      // ---- 4) the pause, the quit, a second match, practice + its loadout
      await key('Escape'); await wait(900);
      st = await audioState();
      R('pause (Escape): the loop bus hushes', st.match && st.match.paused && st.loopIn < 0.05, st);
      await key('Escape'); await wait(900);
      st = await audioState();
      R('resume (Escape): the loop bus is back, the director updates', st.match && !st.match.paused && st.loopIn > 0.95 && st.cue.lastQuiet === false, st);
      await key('Escape'); await wait(900);
      const quitOk = await click('.iw-btn', '/QUIT|LEAVE|MAIN MENU/');
      await wait(900);
      await click('.iw-modal .iw-btn', '/QUIT|LEAVE|YES/');
      await until(`window.__inkwave.menus.current === 'main'`, 12000); await wait(1500);
      st = await audioState();
      R('quit to the menu (the pause menu): back on main, the loop bus open, nothing ducked', quitOk && st.screen === 'main' && st.loopIn > 0.95 && st.duck > 0.95, st);
      await dismiss();
      await click('[data-id="play"]'); await until(`window.__inkwave.menus.current === 'mode'`, 8000); await wait(700);
      await click('.iw-mode--turf'); await until(`window.__inkwave.menus.current === 'setup'`, 8000); await wait(1200);
      await click('[data-id="start"]');
      const began2 = await until(`!!(__G.match && !__G.match.attract && __G.match.state === 'playing')`, 60000);
      await wait(1500);
      const second = await js(`(async () => { const G = __G, m = G.match, P = window.__probe, me = m.local; const { SUBS } = await import('./src/config.js');
        const E = m.actors.find((a) => a.team !== me.team); E.pos.set(me.pos.x + 4, me.pos.y + 0.05, me.pos.z); E.hp = 1e6; if (E.bot) E.bot.update = () => {};
        const n0 = P.done.length + P.taps.length; P.scene = 'second'; E.setSub('bomb'); E.aimPitch = 0.2; G.projectiles.throwBomb(E); await new Promise((r) => setTimeout(r, 2200)); P.scene = null;
        P.flush(); return P.done.filter((d) => d.scene === 'second' && /bomb|fly|fuse/.test(d.name)).map((d) => [d.name, +(20 * Math.log10(d.max + 1e-9)).toFixed(1)]); })()`);
      st = await audioState();
      R('a second match from the menus: the director updates, the loop bus open, the cues sound (Splat Bomb 4 m off)', began2 && st.cue.lastQuiet === false && st.loopIn > 0.95 && second.some(([n, db]) => n === 'fuse_bomb' && db > -60), { st: { loopIn: st.loopIn, cue: st.cue, duck: st.duck }, second });
      // practice: pause → quit, main → LOADOUT → PRACTICE
      await key('Escape'); await wait(900);
      await click('.iw-btn', '/QUIT|LEAVE|MAIN MENU/'); await wait(900); await click('.iw-modal .iw-btn', '/QUIT|LEAVE|YES/');
      await until(`window.__inkwave.menus.current === 'main'`, 12000); await wait(1200);
      await click('[data-id="loadout"]'); await until(`window.__inkwave.menus.current === 'loadout'`, 8000); await wait(900);
      st = await audioState();
      R('the loadout screen (from the main menu): the loop bus open, nothing ducked, the director running', st.screen === 'loadout' && st.loopIn > 0.95 && st.duck > 0.95 && st.cue.lastQuiet === false, { screen: st.screen, loopIn: st.loopIn, duck: st.duck, cue: st.cue });
      await click('[data-id="practice"]');
      const began3 = await until(`!!(__G.match && !__G.match.attract && __G.match.practice && __G.match.state === 'playing')`, 60000);
      await wait(1500);
      st = await audioState();
      R('practice (LOADOUT → PRACTICE): the director updates, the loop bus open', began3 && st.cue.lastQuiet === false && st.loopIn > 0.95, st);
      await key('KeyL'); await wait(1000);
      const inLoadout = (await screen()) === 'loadout';
      st = await audioState();
      const hushed = st.loopIn < 0.05;
      await key('Escape'); await wait(1200);
      st = await audioState();
      R('practice loadout (L) hushes the loops; leaving it (Escape) opens them again', inLoadout && hushed && !st.match.paused && st.loopIn > 0.95, st);
      R('no console errors', errs.length === 0, errs.slice(0, 5));
      // ---- how loud each cue reaches the mix, against your weapon fire and the music around it (per-voice max RMS)
      const db = (x) => 20 * Math.log10(x + 1e-9);
      const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
      const S = med(P.done.filter((d) => /^shoot_/.test(d.name) && !d.pos).map((d) => db(d.max)));    // your shots (no position)
      const Mu = med(Object.values(P.music).map(db)), SB = db(P.sfxBus);                                // the music (after its volume)
      // each scene's own cues (the sub / special it stages), per family
      const OWN = { bomb: 'bomb_throw sub_fly bomb_beep fuse_bomb bomb_explode', sticky: 'throw_sticky sub_fly sticky_stick fuse_sticky sticky_explode', burst: 'throw_burst sub_fly pellet_pop',
        seeker: 'throw_seeker sub_fly seeker_land seeker_run seeker_explode', scan: 'throw_scan sub_fly scan_burst', curtain: 'throw_curtain sub_fly curtain_up curtain_drip curtain_down',
        sprinkler: 'throw_sprinkler sub_fly sprinkler_stick sprinkler_spin', mine: 'place_mine mine_trip mine_explode', beacon: 'place_beacon beacon_hum', mist: 'throw_mist sub_fly mist_burst mist_hiss',
        shaker: 'throw_shaker shaker_rattle shaker_land shaker_blast', waddle: 'throw_waddle sub_fly waddle_land waddle_beep waddle_walk hunt_alarm waddle_explode',
        torpedo: 'torpedo_throw torpedo_whirr torpedo_transform lock_tone torpedo_burst', tracer: 'tracer_zap tracer_hum tracer_hit', boomerang: 'boomerang_throw boomerang_whirr boomerang_tick boomerang_blast',
        slam: 'slam_leap slam_warn special_slam', strike: 'strike_arm strike_launch strike_mark strike_whistle strike_impact tornado', booyah: 'booyah_charge booyah_throw orb_fly orb_land orb_fuse booyah_blast',
        kraken: 'kraken_on kraken_move kraken_jump kraken_dive kraken_slam', crab: 'crab_boot crab_move crab_roll crab_cannon shell_whistle shell_boom crab_reload', zooka: 'zooka_arm zooka_fire twister twister_burst',
        storm: 'storm_throw sub_fly storm_thunder storm_rain' };
      // [family, scene group, names, median ≥ (dB vs your shots), each ≥]
      const FAM = [
        ['enemy throws / placings (~10 m)', 'foe', /^(bomb_throw|throw_\w+|torpedo_throw|boomerang_throw|place_\w+|tracer_zap)$/, -6, -14],
        ['enemy subs in the air', 'foe', /^sub_fly$/, -9, -14],
        ['enemy landings / arming', 'foe', /^(bomb_beep|sticky_stick|seeker_land|shaker_land|curtain_up|sprinkler_stick|waddle_land|waddle_beep|boomerang_tick|torpedo_transform)$/, -5, -12],
        ['enemy sub warnings', 'foe', /^(fuse_bomb|fuse_sticky|mine_trip|hunt_alarm|lock_tone|seeker_run|shaker_rattle|waddle_walk|torpedo_whirr|boomerang_whirr)$/, 1, -4],
        ['enemy device loops', 'foe', /^(curtain_drip|sprinkler_spin|beacon_hum|mist_hiss|tracer_hum)$/, -8, -14],
        ['enemy sub blasts', 'foe', /^(bomb_explode|sticky_explode|pellet_pop|seeker_explode|scan_burst|mist_burst|mine_explode|shaker_blast|waddle_explode|torpedo_burst|boomerang_blast|tracer_hit)$/, 2, -8],
        ['enemy special starts', 'sp', /^(slam_leap|storm_throw|strike_arm|zooka_arm|crab_boot|crab_reload|zooka_fire|kraken_on|booyah_throw|strike_launch)$/, -6, -12],
        ['enemy special warnings', 'sp', /^(slam_warn|strike_mark|strike_whistle|kraken_dive|orb_fuse|orb_fly|orb_land|shell_whistle|twister)$/, 2, -6],
        ['enemy special body loops', 'sp', /^(kraken_move|crab_move|crab_roll|booyah_charge|storm_rain|tornado)$/, -5, -12],
        ['your throws (from you)', 'own', /^(bomb_throw|throw_\w+|torpedo_throw|boomerang_throw|place_\w+|tracer_zap)$/, -3, -8],
        ['your devices, fuses and flight', 'own', /^(sub_fly|fuse_bomb|fuse_sticky|seeker_run|shaker_rattle|curtain_drip|sprinkler_spin|beacon_hum|mist_hiss|waddle_walk|torpedo_whirr|boomerang_whirr|tracer_hum|bomb_beep|sticky_stick|seeker_land|shaker_land|curtain_up|sprinkler_stick|waddle_land|waddle_beep)$/, -11, -18],
      ];
      const best = {};
      for (const d of P.done) {
        if (!d.scene || !d.scene.includes(':')) continue;
        const [grp, k] = d.scene.split(':'); if (!OWN[k] || !OWN[k].split(' ').includes(d.name)) continue;
        const key = d.scene + '|' + d.name, v = db(d.max);
        if (!best[key] || v > best[key].v) best[key] = { v, d: d.d, grp, peak: db(d.peak) };
      }
      console.log(`REF your shots ${S.toFixed(1)} dBFS (per voice) · the music ${Mu.toFixed(1)} dBFS · sfx bus ${SB.toFixed(1)} dB`);
      const famMed = {};
      for (const [fam, grp, re, mBar, eBar] of FAM) {
        const xs = Object.entries(best).filter(([k, b]) => b.grp === grp && re.test(k.split('|')[1])).map(([k, b]) => [k, +(b.v - S).toFixed(1), +b.d.toFixed(1)]);
        const m = med(xs.map((x) => x[1])), low = xs.filter((x) => x[1] < eBar);
        famMed[fam] = m;
        R(`audible: ${fam} — median ${m.toFixed(1)} dB vs your weapon fire (${(m + S + SB - Mu).toFixed(1)} vs the music), bar ≥ ${mBar} (each ≥ ${eBar})`, xs.length >= 2 && m >= mBar && !low.length,
          { n: xs.length, below: low, quietest: xs.sort((a, b) => a[1] - b[1]).slice(0, 3) });
      }
      R('the enemy\'s warnings stand out: 3 dB+ over the enemy throws and over the music', famMed['enemy sub warnings'] - famMed['enemy throws / placings (~10 m)'] >= 3 && famMed['enemy sub warnings'] + S + SB - Mu >= 0,
        { warnings: famMed['enemy sub warnings'], throws: famMed['enemy throws / placings (~10 m)'], vsMusic: +(famMed['enemy sub warnings'] + S + SB - Mu).toFixed(1) });
      const loudest = Object.entries(best).sort((a, b) => b[1].peak - a[1].peak).slice(0, 3).map(([k, b]) => [k, +b.peak.toFixed(1)]);
      R('nothing painful: no cue voice peaks over 0 dBFS, the master\'s loudest 43 ms stays under −4 dBFS (the limiter never pinned)', loudest.every((x) => x[1] <= 0) && db(P.masterMax) <= -4,
        { loudestCuePeaks: loudest, masterMaxRms: +db(P.masterMax).toFixed(1) });
      const bad = (P.voiceBad || []).filter((b) => !/^(roll|enemy_ink_sizzle|swim|climb|crab_move|crab_roll)$/.test(b.name) || !Number.isFinite(b.vol));
      R('no cue voice starts with a zero / NaN gain (only the speed-scaled loops may start silent)', !bad.length, bad.slice(0, 5));
      if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({ results, voices: P.done, masterMax: P.masterMax, voiceBad: P.voiceBad, scenes, music: P.music, sfxBus: P.sfxBus, stolen: P.stolen, counts: P.counts }, null, 1));
    } catch (e) { console.log('HARNESS ERROR', e.stack || e.message); }
    console.log(`RESULT ${results.filter((r) => r.ok).length}/${results.length}`);
    app.quit();
  });
});
