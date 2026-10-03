// Gamepad layouts (src/core/padmap.js through src/core/input.js): every pad is read as a STANDARD layout.
//   MAP=testbox PAGE=tools/botlab/tests/pad-mapping.js tools/botlab/run.sh tools/botlab/page.cjs
// The Gamepad API is faked (navigator.getGamepads returns scripted pads) and the real PlayerController runs on the local
// kid with a stand-in camera rig, so the look / jump / fire it produces is the game's own reading of the pad.
//   standard  an Xbox pad ('standard') is read exactly as before (the browser's own object, no toast)
//   hori      a HORIPAD S as Chrome / Edge report it (mapping '', the right stick on axes 2 / 5, the d-pad hat on axis 9,
//             Switch button order): looks up / down (invert respected), buttons, hat, menus, triggers, one toast
//   guess     unknown non-standard pads: the heuristic (axis 2 + 5, a hat; triggers resting at −1; Firefox's compact
//             layout with the hat as 4 buttons)
//   ids       Chrome / Firefox / bare pad.id parsing
//   setup     Settings › Controller setup: the link, the status, the live test, the guided re-map of a pad the guess gets
//             wrong (scripted raw inputs, a flipped axis, a skip, an idle auto-skip), saved per pad id and applied
// PAGE_ARGS='only=hori,guess' runs some parts. Settings it touches are put back at the end (the setup part leaves its saved
// layout for one fake pad id behind for the reload pass, which removes it):
//   PAGE_ARGS2='phase=2' (tools/botlab/page.cjs reloads the page and runs this again): the saved layout applies after a
//   reload; RESET TO AUTOMATIC removes it.
(async () => {
  const g = window.__inkwave, inp = g.input, dbg = g.debug, M = g.menus;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const args = String(window.__pageArgs || ''), only = /only=([\w,]+)/.exec(args), phase2 = /phase=2/.test(args);
  const want = (k) => (phase2 ? k === 'reload' : !only || only[1].split(',').includes(k));
  const WEIRD = 'Weird Pad (Vendor: 3333 Product: 0001)';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  dbg.freeze();
  const PM = await import('./src/core/padmap.js');
  const { PlayerController } = await import('./src/game/player.js');
  const S = g.settings;
  const keep = { padMaps: S.padMaps, padNoticed: S.padNoticed, invertY: S.invertY, padSensitivity: S.padSensitivity };
  if (phase2) { const m = { ...(S.padMaps || {}) }; keep.padMaps = { ...m }; delete keep.padMaps[WEIRD]; g._setSettings({ padMaps: m, invertY: false, padSensitivity: 1 }); }
  else g._setSettings({ padMaps: {}, padNoticed: [], invertY: false, padSensitivity: 1 });
  let leave = null;   // (the setup part: its saved layout, left for the reload pass)

  // ---- the fake Gamepad API
  let pads = [];
  Object.defineProperty(navigator, 'getGamepads', { value: () => pads, configurable: true, writable: true });
  const mkPad = (id, mapping, axes, nB) => ({ id, index: 0, connected: true, mapping, timestamp: 0, axes: axes.slice(), _rest: axes.slice(),
    buttons: Array.from({ length: nB }, () => ({ pressed: false, touched: false, value: 0 })), vibrationActuator: null });
  const btn = (p, i, on = true, v) => { const b = p.buttons[i]; b.pressed = on; b.touched = on; b.value = v ?? (on ? 1 : 0); };
  const neutral = (p) => { p.axes = p._rest.slice(); p.buttons.forEach((b) => { b.pressed = b.touched = false; b.value = 0; }); };
  const use = (p, polls = 30) => { pads = p ? [p] : []; for (let i = 0; i < polls; i++) inp.pollPad(); };   // (the rest window: ~24 polls)
  const toasts = [];
  const toast0 = M.toast;
  M.toast = function (t, o) { toasts.push(String(t)); return toast0.call(this, t, o); };

  // ---- the game's own controller on the local kid, a stand-in rig
  const rig = { yaw: 0, pitch: 0 };
  const pc = new PlayerController(g.match.local, rig, inp);
  const run = (p, set, secs = 0.3) => {   // hold an input for secs (60 Hz polls + controller updates); → the rig's turn + last intent
    rig.yaw = 0; rig.pitch = 0; pc.padLook.x = pc.padLook.y = 0;
    set(p);
    let it = null;
    for (let i = 0; i < Math.round(secs * 60); i++) { inp.pollPad(); pc.enabled = true; pc.update(1 / 60); it = { ...pc.a.intent, move: pc.a.intent.move.length() }; }
    neutral(p); inp.pollPad();
    return { pitch: +rig.pitch.toFixed(3), yaw: +rig.yaw.toFixed(3), it };
  };
  const pressed = (p, set) => { set(p); inp.pollPad(); const r = { held: [...Array(17).keys()].filter((i) => inp.padButton(i)), edges: [...inp.padPressed].sort((a, b) => a - b) }; neutral(p); inp.pollPad(); return r; };

  try {
    // ================================================================ standard (Xbox in Chrome / the desktop app)
    if (want('standard')) {
      const x = mkPad('Xbox 360 Controller (XInput STANDARD GAMEPAD)', 'standard', [0, 0, 0, 0], 17);
      const n0 = toasts.length;
      use(x);
      R('standard: the browser\'s own pad object is read (no remap), status Standard', inp.pad === x && inp.padInfo.status === 'standard', { status: inp.padInfo.status, same: inp.pad === x });
      const up = run(x, (p) => { p.axes[3] = -1; }), right = run(x, (p) => { p.axes[2] = 1; });
      R('standard: right stick up looks up, right turns right (axes 2 / 3 as before)', up.pitch > 0.2 && Math.abs(up.yaw) < 0.01 && right.yaw < -0.2, { up, right: { yaw: right.yaw } });
      const jump = run(x, (p) => btn(p, 0), 0.05).it, fire = run(x, (p) => btn(p, 7, true, 1), 0.05).it, swim = run(x, (p) => btn(p, 6, true, 1), 0.05).it, sub = run(x, (p) => btn(p, 5), 0.05).it, sp = run(x, (p) => btn(p, 3), 0.05).it;
      R('standard: A jumps, RT fires, LT swims, RB sub, Y special (unchanged)', jump.jump && fire.fire && swim.squid && sub.sub && sp.special, { jump: jump.jump, fire: fire.fire, squid: swim.squid, sub: sub.sub, special: sp.special });
      R('standard: no toast for a standard pad', toasts.length === n0, toasts.slice(n0));
      use(null, 2);
    }

    // ================================================================ HORIPAD S, Chrome / Edge (mapping '')
    if (want('hori')) {
      // HID usage layout: X 0, Y 1, Z 2, Rz 5 (8-bit sticks centred ≈ ±0.004), gaps read 0, the hat on 9 (centred ≈ 1.2857);
      // buttons Y B A X L R ZL ZR − + LS RS Home Capture
      const REST = [0.0039, -0.0039, 0.0039, 0, 0, -0.0039, 0, 0, 0, 9 / 7];
      const hp = mkPad('HORIPAD S (Vendor: 0f0d Product: 00c1)', '', REST, 14);
      const n0 = toasts.length;
      use(hp);
      const info = inp.padInfo;
      R('hori: read through a standard view, status Known: HORIPAD', inp.pad !== hp && inp.pad.mapping === 'standard' && info.status === 'known' && info.label === 'HORIPAD',
        { status: info.status, label: info.label, name: info.name, axes: info.layout.axes, buttons: info.layout.buttons.slice(0, 17) });
      R('hori: layout = right stick a2 / a5, d-pad hat 9, Switch face order (B bottom, A right, Y left, X top)',
        info.layout.axes.join() === 'a0,a1,a2,a5' && info.layout.buttons.slice(0, 4).join() === 'b1,b2,b0,b3' && info.layout.buttons.slice(12, 16).join() === 'h9u,h9d,h9l,h9r', info.layout);
      const up = run(hp, (p) => { p.axes[5] = -1; }), down = run(hp, (p) => { p.axes[5] = 1; }), right = run(hp, (p) => { p.axes[2] = 1; });
      const old = (() => { hp.axes[5] = -1; const v = hp.axes[3]; neutral(hp); return v; })();
      R('hori: right stick UP looks up, DOWN looks down (axis 5; the old reading of axis 3 saw nothing)', up.pitch > 0.2 && down.pitch < -0.2 && Math.abs(up.yaw) < 0.01 && old === 0, { up, down, axis3WhenUp: old });
      R('hori: right stick right turns right (axis 2)', right.yaw < -0.2 && Math.abs(right.pitch) < 0.01, right);
      g._setSettings({ invertY: true });
      const upInv = run(hp, (p) => { p.axes[5] = -1; });
      g._setSettings({ invertY: false });
      R('hori: Invert vertical look flips it (stick up looks down)', upInv.pitch < -0.2, upInv);
      const mv = run(hp, (p) => { p.axes[1] = -1; }, 0.1);
      R('hori: left stick moves (axes 0 / 1)', mv.it.move > 0.5 && Math.abs(mv.pitch) < 0.01, { move: +mv.it.move.toFixed(2) });
      // buttons → intents (positional: the bottom button jumps)
      const it = (i) => run(hp, (p) => btn(p, i), 0.05).it;
      const B = it(1), Y = it(0), A = it(2), X = it(3), ZR = it(7), ZL = it(6), Rb = it(5);
      R('hori: B (bottom) jumps, X (top) special, ZR fires, ZL swims, R sub; A / Y do none of those',
        B.jump && !B.fire && X.special && ZR.fire && ZL.squid && Rb.sub && !A.jump && !A.fire && !Y.jump && !Y.special,
        { B: B.jump, X: X.special, ZR: ZR.fire, ZL: ZL.squid, R: Rb.sub, A: [A.jump, A.fire, A.special], Y: [Y.jump, Y.special] });
      const map = { Y: pressed(hp, (p) => btn(p, 0)).held, B: pressed(hp, (p) => btn(p, 1)).held, A: pressed(hp, (p) => btn(p, 2)).held, X: pressed(hp, (p) => btn(p, 3)).held,
        L: pressed(hp, (p) => btn(p, 4)).held, minus: pressed(hp, (p) => btn(p, 8)).held, plus: pressed(hp, (p) => btn(p, 9)).held, LS: pressed(hp, (p) => btn(p, 10)).held, RS: pressed(hp, (p) => btn(p, 11)).held, home: pressed(hp, (p) => btn(p, 12)).held };
      R('hori: buttons land on the standard slots (Y→2 B→0 A→1 X→3 L→4 −→8 +→9 LS→10 RS→11 Home→16)',
        map.Y + '' === '2' && map.B + '' === '0' && map.A + '' === '1' && map.X + '' === '3' && map.L + '' === '4' && map.minus + '' === '8' && map.plus + '' === '9' && map.LS + '' === '10' && map.RS + '' === '11' && map.home + '' === '16', map);
      const hat = (v) => pressed(hp, (p) => { p.axes[9] = v; }).held;
      const H = { up: hat(-1), upRight: hat(-5 / 7), right: hat(-3 / 7), down: hat(1 / 7), left: hat(5 / 7), upLeft: hat(1), centre: hat(9 / 7) };
      R('hori: the hat on axis 9 is the d-pad (12 up, 13 down, 14 left, 15 right, diagonals both, centred none)',
        H.up + '' === '12' && H.upRight + '' === '12,15' && H.right + '' === '15' && H.down + '' === '13' && H.left + '' === '14' && H.upLeft + '' === '12,14' && H.centre.length === 0, H);
      const tdown = pressed(hp, (p) => btn(p, 7));
      R('hori: ZR reaches the trigger slot as a full press (padValue(7) = 1, an edge on 7)', tdown.held.includes(7) && tdown.edges.includes(7), tdown);
      // the d-pad hat and the face buttons in a menu
      M.show('settings');
      await wait(250);
      const fid = () => M._focus && M._focus.dataset.id;
      const nav = (set) => { set(hp); inp.pollPad(); g._padMenus(); neutral(hp); inp.pollPad(); g._padMenus(); return fid(); };
      const f0 = fid();
      const f1 = nav((p) => { p.axes[9] = 1 / 7; });   // hat down
      const f2 = nav((p) => { p.axes[9] = -1; });      // hat up
      let steps = 0; while (fid() !== 'set-invertY' && steps < 8) { nav((p) => { p.axes[9] = 1 / 7; }); steps++; }
      const inv0 = !!S.invertY;
      nav((p) => btn(p, 1));   // B (bottom) = accept: toggles the focused row
      const inv1 = !!S.invertY;
      nav((p) => btn(p, 1));
      R('hori: the d-pad hat moves the menu focus; B (bottom) accepts (toggled Invert vertical look)', f1 && f1 !== f0 && f2 === f0 && fid() === 'set-invertY' && inv1 === !inv0 && !!S.invertY === inv0, { f0, f1, f2, at: fid(), inv0, inv1 });
      // left stick as menu nav (through the view's axis 1)
      M._setFocus(document.querySelector('[data-id="set-sensitivity"]'), { snap: true });
      g._stickT = 0;
      hp.axes[1] = 0.95; inp.pollPad(); g._padMenus(); const fs = fid(); neutral(hp); inp.pollPad(); g._stickT = 0;
      R('hori: the left stick navigates menus too', fs && fs !== 'set-sensitivity', { after: fs });
      const cur0 = M.current;
      nav((p) => btn(p, 2));   // A (right) = back
      await wait(400);
      R('hori: A (right) backs out of the menu', cur0 === 'settings' && M.current !== 'settings', { before: cur0, after: M.current });
      if (M.current) { M.show(null); await wait(200); }
      // one toast, ever
      const tHori = toasts.slice(n0);
      use(null, 3); use(hp, 3); use(null, 3); use(hp, 3);
      const persisted = (() => { try { return JSON.parse(localStorage.getItem('inkwave.settings')).padNoticed; } catch { return null; } })();
      R('hori: one toast "Controller detected: HORIPAD — using a fitted layout … Settings › Controller setup", not again on reconnect',
        tHori.length === 1 && /Controller detected: HORIPAD — using a fitted layout/.test(tHori[0]) && /Settings › Controller setup/.test(tHori[0]) && toasts.length === n0 + 1 && Array.isArray(persisted) && persisted.includes(hp.id),
        { toasts: toasts.slice(n0), persisted });
      use(null, 2);
    }

    // ================================================================ unknown non-standard pads: the heuristic
    if (want('guess')) {
      // 1) a DirectInput pad in Chrome (usage layout: Z / Rz sticks, gaps 0, hat 9), 12 buttons
      const u1 = mkPad('USB Gamepad (Vendor: 0079 Product: 0006)', '', [0.0039, 0.0039, 0.0039, 0, 0, 0.0039, 0, 0, 0, 9 / 7], 12);
      const n0 = toasts.length;
      use(u1);
      const i1 = inp.padInfo;
      const up1 = run(u1, (p) => { p.axes[5] = -1; }), hat1 = pressed(u1, (p) => { p.axes[9] = 1 / 7; }).held, jump1 = run(u1, (p) => btn(p, 1), 0.05).it;
      R('guess: unknown DirectInput pad → Guessed: right stick a2 + a5, hat 9 → d-pad, b1 jumps', i1.status === 'guess' && i1.layout.axes.join() === 'a0,a1,a2,a5' && up1.pitch > 0.2 && hat1 + '' === '13' && jump1.jump,
        { status: i1.status, axes: i1.layout.axes, up: up1.pitch, hatDown: hat1, jump: jump1.jump });
      const t1 = toasts.slice(n0);
      R('guess: its toast says the layout is guessed', t1.length === 1 && /Controller detected: USB Gamepad — using a guessed layout/.test(t1[0]), t1);
      // 2) PlayStation-style DI pad: L2 / R2 also as axes 3 / 4 resting at −1 → triggers, not the right stick
      const u2 = mkPad('Mystery Pad (Vendor: 1234 Product: 5678)', '', [0.002, -0.002, 0.002, -1, -1, 0.002, 0, 0, 0, 9 / 7], 13);
      use(u2);
      const i2 = inp.padInfo;
      const up2 = run(u2, (p) => { p.axes[5] = -1; }), rest2 = [inp.padValue(6), inp.padValue(7)];
      const fire2 = run(u2, (p) => { p.axes[4] = 1; }, 0.05).it, swim2 = run(u2, (p) => { p.axes[3] = 0.6; }, 0.05).it;
      R('guess: axes resting at −1 are triggers (0 … 1 on slots 6 / 7: fire / swim), the right stick skips them (a2 + a5)',
        i2.layout.axes.join() === 'a0,a1,a2,a5' && /t3/.test(i2.layout.buttons[6]) && /t4/.test(i2.layout.buttons[7]) && rest2[0] === 0 && rest2[1] === 0 && fire2.fire && swim2.squid && up2.pitch > 0.2,
        { axes: i2.layout.axes, b6: i2.layout.buttons[6], b7: i2.layout.buttons[7], rest: rest2, fire: fire2.fire, squid: swim2.squid, up: up2.pitch });
      // 3) a Linux-style compact layout (X Y Z Rz, hat as an axis pair 4 / 5): the live axis 3 beats the silent hat axis
      const u3 = mkPad('Other Pad (Vendor: 2222 Product: 0001)', '', [0.004, 0.004, 0.004, 0.004, 0, 0], 12);
      use(u3);
      const before3 = inp.padInfo.layout.axes.join();
      u3.axes[5] = 1; inp.pollPad(); u3.axes[5] = 0; inp.pollPad(); u3.axes[4] = -1; inp.pollPad(); u3.axes[4] = 0; inp.pollPad();
      const after3 = inp.padInfo.layout;
      const dn3 = pressed(u3, (p) => { p.axes[5] = 1; }).held, up3 = run(u3, (p) => { p.axes[3] = -1; });
      R('guess: compact layout (no hat axis at rest): right stick a2 + a3; an axis pair stepping to ±1 becomes the d-pad', before3 === 'a0,a1,a2,a3' && after3.axes.join() === 'a0,a1,a2,a3' && after3.buttons[13] === 'p4d' && dn3 + '' === '13' && up3.pitch > 0.2,
        { before: before3, after: after3.axes, dpad: after3.buttons.slice(12, 16), downHeld: dn3, up: up3.pitch });
      // 4) Firefox: a HORIPAD in Firefox's compact layout (X Y Z Rz → 0 1 2 3) with the hat as 4 buttons after the pad's own
      const ff = mkPad('0f0d-00c1-HORI CO.,LTD. HORIPAD S', '', [0.0039, -0.0039, 0.0039, -0.0039], 18);
      use(ff);
      const i4 = inp.padInfo;
      const up4 = run(ff, (p) => { p.axes[3] = -1; }), dpad4 = ['u', 'd', 'l', 'r'].map((d, k) => pressed(ff, (p) => btn(p, 14 + k)).held + ''), jump4 = run(ff, (p) => btn(p, 1), 0.05).it;
      R('guess: Firefox HORIPAD id "0f0d-00c1-…" → Known: HORIPAD; right stick a2 / a3 (compact); d-pad = its last 4 buttons; B jumps',
        i4.status === 'known' && i4.label === 'HORIPAD' && i4.vendor === '0f0d' && i4.product === '00c1' && i4.layout.axes.join() === 'a0,a1,a2,a3' && up4.pitch > 0.2 && dpad4.join('|') === '12|13|14|15' && jump4.jump,
        { status: i4.status, label: i4.label, axes: i4.layout.axes, dpad: i4.layout.buttons.slice(12, 16), up: up4.pitch, dpadHeld: dpad4, jump: jump4.jump });
      use(null, 2);
    }

    // ================================================================ pad.id parsing
    if (want('ids')) {
      const P = (s) => PM.parsePadId(s);
      const a = P('HORIPAD S (Vendor: 0f0d Product: 00c1)'), b = P('0f0d-00c1-HORIPAD S'), c = P('Xbox 360 Controller (XInput STANDARD GAMEPAD)'),
        d = P('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)'), e = P('f0d-c1-HORIPAD S'), f = P('HORIPAD S');
      R('ids: Chrome "(Vendor: 0f0d Product: 00c1)" and Firefox "0f0d-00c1-…" parse to the same vendor / product + a clean name',
        a.vendor === '0f0d' && a.product === '00c1' && a.name === 'HORIPAD S' && a.format === 'chrome' && b.vendor === '0f0d' && b.product === '00c1' && b.name === 'HORIPAD S' && b.format === 'firefox'
        && e.vendor === '0f0d' && e.product === '00c1', { a, b, e });
      R('ids: "STANDARD GAMEPAD" ids and bare names', c.vendor === null && c.name === 'Xbox 360 Controller' && d.vendor === '057e' && d.product === '2009' && d.name === 'Pro Controller' && f.vendor === null && f.name === 'HORIPAD S', { c, d, f });
      const k = (id) => (PM.knownPad(P(id)) || {}).label || null;
      R('ids: known table — HORI by vendor, by name with no ids (Safari-style), PowerA / PDP Switch pads; unknowns stay unknown',
        k('HORIPAD S (Vendor: 0f0d Product: 00c1)') === 'HORIPAD' && k('0f0d-0092-POKKEN CONTROLLER') === 'HORIPAD' && k('HORIPAD S') === 'HORIPAD' && k('HORI Fighting Commander for Nintendo Switch') === 'HORIPAD'
        && k('Core (Plus) Wired Controller (Vendor: 20d6 Product: a711)') === 'PowerA' && k('0e6f-0185-PDP Wired Fight Pad Pro') === 'PDP' && k('USB Gamepad (Vendor: 0079 Product: 0006)') === null,
        { hori: k('HORIPAD S (Vendor: 0f0d Product: 00c1)'), safari: k('HORIPAD S'), powera: k('Core (Plus) Wired Controller (Vendor: 20d6 Product: a711)'), pdp: k('0e6f-0185-PDP Wired Fight Pad Pro'), generic: k('USB Gamepad (Vendor: 0079 Product: 0006)') });
    }

    // ================================================================ Settings › Controller setup
    // a pad the guess gets wrong: Xbox-order face buttons (b0 bottom …), the right stick on Rx / Ry (axes 2 / 4) beside a
    // live dial on 5, the left stick's Y flipped (up = +1), the hat on 9
    const weird = () => mkPad(WEIRD, '', [0.004, 0.004, 0.004, 0, 0.004, 0.004, 0, 0, 0, 9 / 7], 12);
    if (want('setup')) {
      const W = weird();
      use(W);
      const guessed = inp.padInfo.layout.axes.join(), up0 = run(W, (p) => { p.axes[4] = -1; });
      R('setup: the guess gets this pad wrong (right stick a2 + a5, so up on axis 4 does nothing) — a job for the setup', inp.padInfo.status === 'guess' && guessed === 'a0,a1,a2,a5' && Math.abs(up0.pitch) < 0.01, { guessed, pitch: up0.pitch });
      // the link in Settings › Controls, under Invert vertical look
      M.show('settings'); await wait(250);
      const rows = [...document.querySelectorAll('.iw-row')].map((r) => r._key);
      M._setFocus(document.querySelector('[data-id="set-_padsetup"]'), { snap: true });
      M.nav('accept'); await wait(450);
      const scr = M._scr;
      const status = () => document.querySelector('.iw-pads__status')?.textContent, name = () => document.querySelector('.iw-pads__name')?.textContent;
      const drive = (n = 1, set) => { for (let i = 0; i < n; i++) { if (set) set(W); inp.pollPad(); g._padMenus(); scr.tick(1 / 60); } };
      drive(2);
      R('setup: "Controller setup" sits under Invert vertical look and opens the screen: pad name + GUESSED',
        rows.indexOf('_padsetup') === rows.indexOf('invertY') + 1 && M.current === 'padsetup' && name() === 'Weird Pad' && status() === 'GUESSED', { rows, screen: M.current, name: name(), status: status() });
      // live test: the right stick's dot, the trigger bar, a lit chip (what the game reads: the guessed view)
      drive(8, (p) => { p.axes[2] = 1; p.axes[5] = -1; btn(p, 1); btn(p, 7); });
      const dot = document.querySelectorAll('.iw-pads__dot')[1], chips = [...document.querySelectorAll('.iw-pads__btn')];
      const liveT = { x: dot.style.getPropertyValue('--x'), y: dot.style.getPropertyValue('--y'), rt: document.querySelectorAll('.iw-pads__bar i')[1].style.getPropertyValue('--v'),
        on: chips.map((c, i) => (c.classList.contains('is-on') ? i : null)).filter((x) => x !== null), raw: document.querySelector('.iw-pads__raw').textContent };
      neutral(W); drive(2);
      R('setup: the live test shows the sticks, triggers and buttons as the game reads them (+ the raw values)', liveT.x === '1.000' && liveT.y === '-1.000' && liveT.on.includes(0) && liveT.on.includes(7) && /raw buttons 1 7/.test(liveT.raw), liveT);
      // start the guided setup with the pad (its bottom button under the guess = raw b1 → accept on GUIDED SETUP)
      M._setFocus(document.querySelector('[data-id="pad-remap"]'), { snap: true });
      drive(1, (p) => btn(p, 1)); neutral(W); drive(1);
      const g0 = scr._guide();
      R('setup: the pad\'s accept starts the guided setup; the pad stops driving the menus meanwhile', g0 && g0.i === 0 && inp.padCapture === true && document.querySelector('.iw-pads').classList.contains('is-guide'), { guide: g0, capture: inp.padCapture });
      drive(30);   // hands off: the rest values
      const firstPrompt = document.querySelector('.iw-pads__gtext').textContent;
      const STEP = [
        (p) => { p.axes[4] = -1; }, (p) => { p.axes[2] = 1; }, (p) => { p.axes[1] = 1; }, (p) => { p.axes[0] = 1; },   // RS up, RS right, LS up (flipped), LS right
        (p) => btn(p, 0), (p) => btn(p, 1), (p) => btn(p, 2), (p) => btn(p, 3), (p) => btn(p, 4), (p) => btn(p, 5), (p) => btn(p, 6, true, 1), (p) => btn(p, 7, true, 1),
        (p) => { p.axes[9] = -1; }, (p) => { p.axes[9] = 1 / 7; }, (p) => { p.axes[9] = 5 / 7; }, (p) => { p.axes[9] = -3 / 7; },
      ];
      const prompts = [];
      let menuMoved = false; const f0 = M._focus;
      for (let k = 0; k < STEP.length; k++) {
        prompts.push(document.querySelector('.iw-pads__gtext').textContent);
        drive(3, STEP[k]); neutral(W); drive(3);
        if (M._focus !== f0 || M.current !== 'padsetup') menuMoved = true;
      }
      const mid = scr._guide();
      R('setup: prompts in order — the RIGHT stick UP first, then RIGHT, the left stick, JUMP (bottom face button) …; inputs don\'t move the menus',
        firstPrompt === 'Push the RIGHT stick UP' && prompts[1] === 'Push the RIGHT stick RIGHT' && prompts[4] === 'Press JUMP — the BOTTOM face button' && !menuMoved && mid.i === 16 && mid.got.every(Boolean),
        { prompts: prompts.slice(0, 6), at: mid.i, got: mid.got, menuMoved });
      // SELECT: skipped with the SKIP button (keeps the automatic one); START: nothing pressed for 10 s skips it and saves
      const selPrompt = document.querySelector('.iw-pads__gtext').textContent;
      scr._skip(); drive(3);
      const startPrompt = document.querySelector('.iw-pads__gtext').textContent;
      drive(Math.round(10.3 * 60));
      const saved = (S.padMaps || {})[WEIRD];
      R('setup: SKIP keeps the automatic slot; a prompt left alone 10 s skips itself; then the layout is saved under the pad id',
        /SELECT/.test(selPrompt) && /START/.test(startPrompt) && !scr._guide() && inp.padCapture === false && !!saved,
        { selPrompt, startPrompt, guide: scr._guide(), saved });
      const want0 = 'a0,-a1,a2,a4', wantB = 'b0,b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,h9u,h9d,h9l,h9r,';   // (12 buttons: no b12 for home)
      R('setup: saved = sticks a0 / −a1 (flipped) / a2 / a4, faces b0–b3, bumpers, triggers, the hat as the d-pad, skipped slots automatic',
        saved && saved.axes.join() === want0 && saved.buttons.slice(0, 17).join() === wantB, saved && { axes: saved.axes.join(), buttons: saved.buttons.join() });
      inp.pollPad(); drive(2);
      const upC = run(W, (p) => { p.axes[4] = -1; }), lsUp = run(W, (p) => { p.axes[1] = 1; }, 0.1), jumpC = run(W, (p) => btn(p, 0), 0.05).it, fireC = run(W, (p) => btn(p, 7, true, 1), 0.05).it;
      drive(2);
      const persisted = (() => { try { return !!JSON.parse(localStorage.getItem('inkwave.settings')).padMaps[WEIRD]; } catch { return false; } })();
      R('setup: applied at once — status CUSTOM; right stick up looks up, the flipped left stick walks forward, b0 jumps, b7 fires; in localStorage',
        inp.padInfo.status === 'custom' && status() === 'CUSTOM' && upC.pitch > 0.2 && lsUp.it.move > 0.5 && jumpC.jump && fireC.fire && persisted,
        { status: inp.padInfo.status, chip: status(), up: upC.pitch, move: +lsUp.it.move.toFixed(2), jump: jumpC.jump, fire: fireC.fire, persisted });
      // Esc / B mid-setup cancels without saving
      scr._start(); drive(30); drive(3, (p) => { p.axes[4] = -1; }); neutral(W); drive(3);
      M.nav('back'); drive(2);
      const afterCancel = (S.padMaps || {})[WEIRD];
      R('setup: Back mid-setup cancels it (nothing saved, the screen stays, the pad drives the menus again)', !scr._guide() && M.current === 'padsetup' && inp.padCapture === false && afterCancel && afterCancel.axes.join() === want0, { guide: scr._guide(), screen: M.current, capture: inp.padCapture });
      leave = saved;
      M.show(null); await wait(200);
      use(null, 2);
    }

    // ================================================================ after a reload (PAGE_ARGS2='phase=2')
    if (want('reload')) {
      const W = weird();
      const stored = (S.padMaps || {})[WEIRD];
      use(W);
      const info = inp.padInfo;
      const up = run(W, (p) => { p.axes[4] = -1; }), jump = run(W, (p) => btn(p, 0), 0.05).it;
      R('reload: the saved layout applies after a reload (status Custom, right stick up on axis 4 looks up, b0 jumps)',
        !!stored && info.status === 'custom' && info.layout.axes.join() === 'a0,-a1,a2,a4' && up.pitch > 0.2 && jump.jump, { stored: !!stored, status: info.status, axes: info.layout.axes, up: up.pitch, jump: jump.jump });
      M.show('settings'); await wait(250);
      M._setFocus(document.querySelector('[data-id="set-_padsetup"]'), { snap: true });
      M.nav('accept'); await wait(450);
      const scr = M._scr;
      inp.pollPad(); scr.tick(1 / 60);
      const chip0 = document.querySelector('.iw-pads__status')?.textContent;
      scr._reset();
      inp.pollPad(); scr.tick(1 / 60);
      const chip1 = document.querySelector('.iw-pads__status')?.textContent;
      R('reload: the screen says CUSTOM; RESET TO AUTOMATIC removes the saved layout (back to GUESSED)',
        chip0 === 'CUSTOM' && chip1 === 'GUESSED' && inp.padInfo.status === 'guess' && !(S.padMaps || {})[WEIRD], { chip0, chip1, status: inp.padInfo.status });
      M.show(null); await wait(200);
      use(null, 2);
    }
  } catch (e) {
    R('HARNESS ERROR ' + e.message, false, String(e.stack).slice(0, 600));
  } finally {
    pads = [];
    try { inp.pollPad(); } catch { /* ignore */ }
    delete navigator.getGamepads;
    M.toast = toast0;
    g._setSettings(keep);
    if (leave) g._setSettings({ padMaps: { ...(S.padMaps || {}), [WEIRD]: leave } });
  }
  return out;
})();
