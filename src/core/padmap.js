// Gamepad layouts. The game reads every pad through a STANDARD-layout view (the W3C "standard" mapping: buttons 0 bottom,
// 1 right, 2 left, 3 top face button, 4 / 5 bumpers, 6 / 7 triggers, 8 select, 9 start, 10 / 11 stick clicks, 12–15 d-pad
// up / down / left / right, 16 home; axes 0 / 1 left stick, 2 / 3 right stick), so the rest of the game keeps using
// standard indices whatever the browser reports.
//
// A pad the browser already maps ('standard': Xbox / PlayStation / Switch Pro in Chrome, Edge, Safari, the desktop app) is
// passed through untouched. A non-standard pad (mapping '') gets, in order of preference:
//   custom  a layout the player made in Settings › Controller setup (settings.padMaps[pad.id])
//   known   a table entry for its vendor / product (HORI, PowerA, PDP Switch pads; Switch Pro and PlayStation pads when a
//           browser doesn't map them): Switch-licensed wired pads all use the same HID report (Y B A X L R ZL ZR − + LS RS
//           Home Capture, a hat, sticks on X / Y and Z / Rz), which Chrome and Edge place by HID usage: the right stick on
//           axes 2 and 5, the d-pad hat on axis 9 (−1 … 1 in 8 steps, ≈ 1.29 centred). SDL's gamecontrollerdb agrees
//           (HORIPAD / Pokkén pads: a:b1 b:b2 x:b0 y:b3, rightx:a2 righty:a5, d-pad on hat 0).
//   guess   a heuristic for anything else (PadMapper.probe watches the axes: a hat, triggers resting at −1, which axes
//           are live) — see autoLayout.
//
// Layout sources are short strings, so a custom layout persists as plain JSON:
//   'b3'  raw button 3            'a2' raw axis 2 ('-a2' inverted)        'a4+' / 'a4-' one half of raw axis 4 as a button
//   't4'  raw axis 4 as a trigger (rests at −1 → 0 … 1)                   'h9u' hat on raw axis 9, direction u / d / l / r
//   'p4u' a hat as an axis pair (x = 4, y = 5; −1 / 0 / 1 each)          ''    nothing
//   'b6,t3' several sources for one button (the strongest wins)

export const STD_BUTTONS = 17, STD_AXES = 4;
// what each standard slot is, for the setup screen
export const STD_BUTTON_NAMES = ['Bottom (A)', 'Right (B)', 'Left (X)', 'Top (Y)', 'L bumper', 'R bumper', 'L trigger', 'R trigger',
  'Select', 'Start', 'L stick click', 'R stick click', 'D-pad up', 'D-pad down', 'D-pad left', 'D-pad right', 'Home'];

const U = 1, D = 2, L = 4, R = 8;
const HAT8 = [U, U | R, R, D | R, D, D | L, L, U | L];   // Chrome's hat axis: −1 + 2k/7 for k = 0 (up) … 7 (up-left)
const DIRS = { u: U, d: D, l: L, r: R };

/** The 8-way hat on one axis → a u/d/l/r bitmask (0 = centred, or a value that is no hat step: a gap axis reads 0). */
export function hatDirs(v) {
  if (!(v >= -1.02 && v <= 1.02)) return 0;
  const k = (v + 1) * 3.5, r = Math.round(k);
  return Math.abs(k - r) > 0.3 ? 0 : HAT8[r & 7];
}

/** pad.id → { vendor, product, name, format }. Chrome / Edge: "HORIPAD S (Vendor: 0f0d Product: 00c1)"; Firefox (and
 *  WebKit's HID pads): "0f0d-00c1-HORIPAD S"; anything else: no ids, the name only. */
export function parsePadId(id = '') {
  const s = String(id || '');
  let m = /Vendor:\s*([0-9a-f]{1,4})\s*Product:\s*([0-9a-f]{1,4})/i.exec(s);
  if (m) {
    const name = s.replace(/\s*\([^()]*Vendor:[^()]*\)\s*$/i, '').replace(/\s*\(?STANDARD GAMEPAD\)?/i, '').trim();
    return { vendor: m[1].toLowerCase().padStart(4, '0'), product: m[2].toLowerCase().padStart(4, '0'), name: name || 'Controller', format: 'chrome' };
  }
  m = /^\s*([0-9a-f]{1,4})-([0-9a-f]{1,4})-(.*)$/i.exec(s);
  if (m) return { vendor: m[1].toLowerCase().padStart(4, '0'), product: m[2].toLowerCase().padStart(4, '0'), name: m[3].trim() || 'Controller', format: 'firefox' };
  return { vendor: null, product: null, name: s.replace(/\s*\([^()]*\)\s*$/, '').trim() || 'Controller', format: 'other' };
}

// face buttons etc. in DirectInput order (HORI / PowerA / PDP Switch pads, PlayStation pads, Logitech Dual Action and most
// generic USB pads): b0 left, b1 bottom, b2 right, b3 top, b4 / b5 bumpers, b6 / b7 triggers, b8 select, b9 start,
// b10 / b11 stick clicks, b12 home
const FACE_DI = { 0: 'b1', 1: 'b2', 2: 'b0', 3: 'b3', 4: 'b4', 5: 'b5', 6: 'b6', 7: 'b7', 8: 'b8', 9: 'b9', 10: 'b10', 11: 'b11', 16: 'b12' };
// the Switch Pro controller's own HID report: B A Y X L R ZL ZR − + LS RS Home Capture — already positional
const FACE_PRO = { 0: 'b0', 1: 'b1', 2: 'b2', 3: 'b3', 4: 'b4', 5: 'b5', 6: 'b6', 7: 'b7', 8: 'b8', 9: 'b9', 10: 'b10', 11: 'b11', 16: 'b12' };
// the Switch HID report in Chrome / Edge (axes by HID usage: X 0, Y 1, Z 2, Rz 5, hat 9)
const SWITCH_HID = { face: FACE_DI, usage: { axes: ['a0', 'a1', 'a2', 'a5'], hat: 9 } };
const KNOWN = [
  // HORI (0f0d): HORIPAD for Nintendo Switch / HORIPAD S / mini / wired Pokkén pads (00c1, 0092, 00dc, 00f6, 00aa …). Any
  // HORI pad that reaches us non-standard (Chrome maps its Xbox / some PS4 pads itself) uses this report.
  { label: 'HORIPAD', test: (v) => v === '0f0d', ...SWITCH_HID },
  { label: 'HORIPAD', test: (v, p, n) => !v && /hori/i.test(n) && /switch|horipad|pok/i.test(n), ...SWITCH_HID },
  // PowerA (20d6) wired Switch pads (a7xx) and PDP (0e6f) Switch pads (018x): the same report
  { label: 'PowerA', test: (v, p) => v === '20d6' && /^a7/.test(p), ...SWITCH_HID },
  { label: 'PDP', test: (v, p) => v === '0e6f' && /^018/.test(p), ...SWITCH_HID },
  // the Switch Pro controller over plain HID (Chrome / Firefox / Safari map it themselves; this is the fallback)
  { label: 'Switch Pro', test: (v, p) => v === '057e' && p === '2009', face: FACE_PRO },
  // PlayStation pads over plain HID (Square Cross Circle Triangle …; L2 / R2 also as axes resting at −1): the fallback
  // when a browser doesn't map them
  { label: 'DualShock 4', test: (v, p) => v === '054c' && /^(05c4|09cc|0ba0)$/.test(p), face: { ...FACE_DI, 17: 'b13' } },
  { label: 'DualSense', test: (v, p) => v === '054c' && /^(0ce6|0df2)$/.test(p), face: { ...FACE_DI, 17: 'b13' } },
  { label: 'PlayStation', test: (v) => v === '054c', face: FACE_DI },
];

export function knownPad(ids) {
  for (const k of KNOWN) if (k.test(ids.vendor, ids.product || '', ids.name || '')) return k;
  return null;
}

// ---- what the axes do: learnt from what they report (the guess, and the known pads outside Chrome's usage layout) ----
const REST_POLLS = 24;   // the first polls after a pad appears: the axes' rest values (≈ 0.4 s)
export class AxisProbe {
  reset(n) {
    this.n = n; this.polls = 0; this.ver = 0;
    this.ev = Array.from({ length: n }, () => ({ hat: false, trig: false, nz: false, analog: false, step: false, s: [], calm: 0 }));
  }
  /** One poll. Returns true when what we know about an axis changed (the layout is rebuilt then). */
  feed(axes) {
    if (!this.ev || axes.length !== this.n) this.reset(axes.length);
    let ch = false;
    this.polls++;
    for (let i = 0; i < this.n; i++) {
      const v = +axes[i] || 0, e = this.ev[i], a = Math.abs(v);
      if (e.hat) continue;
      if (a > 1.05) { e.hat = true; e.trig = false; ch = true; continue; }   // a hat at rest (Chrome: ≈ 1.29)
      if (this.polls <= REST_POLLS) {   // rest value = the median so far: resting at ≈ −1 is a trigger
        e.s.push(v);
        const s = [...e.s].sort((x, y) => x - y), med = s[s.length >> 1];
        const t = med < -0.85;
        if (t !== e.trig) { e.trig = t; ch = true; }
        if (this.polls === REST_POLLS) e.s = null;
      } else if (e.trig) {   // a "trigger" that sits near 0 for a second was a stick held at the start
        e.calm = a < 0.12 ? e.calm + 1 : 0;
        if (e.calm > 60) { e.trig = false; ch = true; }
      }
      if (!e.nz && a > 1e-6) { e.nz = true; ch = true; }                 // a live axis (a gap in the layout reads 0)
      if (!e.analog && !e.trig && a > 0.2 && a < 0.9) { e.analog = true; ch = true; }   // moved through the middle: a stick
      if (!e.step && a > 0.99) { e.step = true; ch = true; }
    }
    if (ch) this.ver++;
    return ch;
  }
}

/** The automatic layout for a non-standard pad: { axes: [4 codes], buttons: [17+ codes], usage }. */
export function autoLayout(raw, ids, probe, known) {
  const nA = raw.axes.length, nB = raw.buttons.length, ev = probe.ev || [];
  const usage = nA >= 10 || !!(ev[9] && ev[9].hat);   // Chrome / Edge: axes placed by HID usage (hat at 9)
  const buttons = new Array(STD_BUTTONS).fill('');
  const face = (known && known.face) || FACE_DI;
  for (const k in face) if (+face[k].slice(1) < nB) buttons[k] = face[k];
  let axes, hat = -1;
  if (known && known.usage && usage) { axes = known.usage.axes.slice(); hat = known.usage.hat; }
  else {
    // right stick: the two best axes past the left stick that are neither a hat nor a trigger — an axis seen moving
    // through the middle beats a live one beats a silent one (a gap reads exactly 0); ties go by the usual places
    // (Chrome's usage layout: Z then Rz / Rx / Ry; compact layouts: in order)
    const order = usage ? [2, 5, 3, 4, 6, 7, 8] : [2, 3, 4, 5, 6, 7, 8];
    for (let i = 9; i < nA; i++) if (!order.includes(i)) order.push(i);
    const cands = order.filter((i) => i < nA && ev[i] && !ev[i].hat && !ev[i].trig);
    const score = (i) => (ev[i].analog ? 4 : 0) + (ev[i].nz ? 2 : 0);
    const pick = cands.map((i, r) => ({ i, k: score(i) * 100 - r })).sort((x, y) => y.k - x.k).slice(0, 2).map((x) => x.i).sort((x, y) => x - y);
    axes = ['a0', nA > 1 ? 'a1' : '', pick[0] != null ? 'a' + pick[0] : '', pick[1] != null ? 'a' + pick[1] : ''];
    // d-pad: a hat axis (prefer 9)
    if (ev[9] && ev[9].hat) hat = 9; else hat = ev.findIndex((e) => e.hat);
    if (hat < 0) {
      // a hat as two axes (Linux): the last adjacent pair that only ever stepped to ±1, not used by the sticks
      const used = new Set(pick);
      for (let i = nA - 2; i >= 2; i--) {
        const a = ev[i], b = ev[i + 1];
        if (a.step && b.step && !a.analog && !b.analog && !a.trig && !b.trig && !used.has(i) && !used.has(i + 1)) {
          buttons[12] = `p${i}u`; buttons[13] = `p${i}d`; buttons[14] = `p${i}l`; buttons[15] = `p${i}r`; break;
        }
      }
    }
    // triggers that rest at −1: L then R, on top of any digital trigger buttons
    const trig = [];
    for (let i = 2; i < nA; i++) if (ev[i] && ev[i].trig && !ev[i].hat) trig.push(i);
    if (trig.length >= 2) { buttons[6] = [buttons[6], 't' + trig[0]].filter(Boolean).join(','); buttons[7] = [buttons[7], 't' + trig[1]].filter(Boolean).join(','); }
  }
  if (hat >= 0 && hat < nA) { buttons[12] = `h${hat}u`; buttons[13] = `h${hat}d`; buttons[14] = `h${hat}l`; buttons[15] = `h${hat}r`; }
  else if (!buttons[12] && ids.format === 'firefox' && nB >= 16) {
    // Firefox turns a hat into four buttons after the pad's own: up, down, left, right
    buttons[12] = 'b' + (nB - 4); buttons[13] = 'b' + (nB - 3); buttons[14] = 'b' + (nB - 2); buttons[15] = 'b' + (nB - 1);
    for (const k of [16, 17]) if (buttons[k] && +buttons[k].slice(1) >= nB - 4) buttons[k] = '';
  }
  return { axes, buttons, usage };
}

export function identityLayout(raw) {
  const nB = Math.max(STD_BUTTONS, raw ? raw.buttons.length : STD_BUTTONS);
  return { axes: ['a0', 'a1', 'a2', 'a3'], buttons: Array.from({ length: nB }, (_, i) => (!raw || i < raw.buttons.length ? 'b' + i : '')) };
}

// ---- compiled sources ----
function one(c) {
  let m;
  if ((m = /^b(\d+)$/.exec(c))) return { k: 0, i: +m[1] };
  if ((m = /^(-?)a(\d+)$/.exec(c))) return { k: 1, i: +m[2], s: m[1] ? -1 : 1 };
  if ((m = /^a(\d+)([+-])$/.exec(c))) return { k: 2, i: +m[1], s: m[2] === '-' ? -1 : 1 };
  if ((m = /^t(\d+)$/.exec(c))) return { k: 3, i: +m[1] };
  if ((m = /^h(\d+)([udlr])$/.exec(c))) return { k: 4, i: +m[1], d: DIRS[m[2]] };
  if ((m = /^p(\d+)([udlr])$/.exec(c))) return { k: 5, i: +m[1], d: DIRS[m[2]] };
  return null;
}
export function compileSource(code) {
  if (!code) return null;
  const parts = String(code).split(',').map((c) => one(c.trim())).filter(Boolean);
  return parts.length ? parts : null;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function srcValue(raw, s) {
  const ax = raw.axes;
  switch (s.k) {
    case 0: { const b = raw.buttons[s.i]; return b ? (typeof b === 'object' ? (b.value || (b.pressed ? 1 : 0)) : +b) : 0; }
    case 1: case 2: return clamp01(s.s * (+ax[s.i] || 0));
    case 3: { const v = ax[s.i]; return v == null ? 0 : clamp01((+v + 1) / 2); }
    case 4: return hatDirs(+ax[s.i]) & s.d ? 1 : 0;
    case 5: {
      const x = +ax[s.i] || 0, y = +ax[s.i + 1] || 0;
      const m = (y < -0.5 ? U : 0) | (y > 0.5 ? D : 0) | (x < -0.5 ? L : 0) | (x > 0.5 ? R : 0);
      return m & s.d ? 1 : 0;
    }
    default: return 0;
  }
}
function srcPressed(raw, s, v) {
  if (s.k === 0) { const b = raw.buttons[s.i]; return !!(b && (typeof b === 'object' ? b.pressed : b > 0.5)); }
  if (s.k === 3) return v > 0.12;   // (Chrome's own trigger threshold, ≈ 30 / 255)
  return v > 0.5;
}

/** Turns the raw pad the browser gives into a standard-layout view (or the raw pad itself when it is standard). */
export class PadMapper {
  constructor() {
    this.probe = new AxisProbe();
    this.info = null;
    this._key = null;
    this._view = null;
  }
  _reset(raw) {
    this._key = raw.index + '|' + raw.id;
    this.ids = parsePadId(raw.id);
    this.known = raw.mapping === 'standard' ? null : knownPad(this.ids);
    this.probe.reset(raw.axes.length);
    this._custom = undefined; this._probeVer = -1; this._nA = -1; this._nB = -1;
    this.info = null;
  }
  /** settings.padMaps[pad.id] (a custom layout) or null */
  customFor(id, settings) { const m = settings && settings.padMaps; const c = m && m[id]; return c && Array.isArray(c.axes) && Array.isArray(c.buttons) ? c : null; }

  view(raw, settings) {
    if (!raw) { this.info = null; return null; }
    if (this._key !== raw.index + '|' + raw.id) this._reset(raw);
    const custom = this.customFor(raw.id, settings);
    const std = raw.mapping === 'standard';
    let dirty = custom !== this._custom || raw.axes.length !== this._nA || raw.buttons.length !== this._nB;
    if (!std) { this.probe.feed(raw.axes); if (!custom && this.probe.ver !== this._probeVer) dirty = true; }   // (fed under a custom layout too: auto() stays current)
    if (std && !custom) {
      if (dirty || !this.info) {
        this._custom = custom; this._nA = raw.axes.length; this._nB = raw.buttons.length;
        this.info = { id: raw.id, name: this.ids.name, vendor: this.ids.vendor, product: this.ids.product, format: this.ids.format,
          status: 'standard', label: 'Standard', layout: identityLayout(raw), raw: false };
      }
      return raw;   // a standard pad is read as it is (unchanged)
    }
    if (dirty || !this.info) this._build(raw, custom);
    this._fill(raw);
    return this._view;
  }
  /** The automatic layout for this pad as it is now (what Controller setup starts from and resets to). */
  auto(raw) {
    if (!raw) return null;
    if (this._key !== raw.index + '|' + raw.id) this._reset(raw);
    if (raw.mapping === 'standard') return identityLayout(raw);
    const lay = autoLayout(raw, this.ids, this.probe, this.known);
    while (lay.buttons.length < STD_BUTTONS) lay.buttons.push('');
    return { axes: lay.axes, buttons: lay.buttons };
  }
  _build(raw, custom) {
    this._custom = custom; this._nA = raw.axes.length; this._nB = raw.buttons.length; this._probeVer = this.probe.ver;
    let lay, status, label;
    if (custom) {
      lay = { axes: custom.axes.slice(0, STD_AXES), buttons: custom.buttons.slice() };
      status = 'custom'; label = 'Custom';
    } else {
      lay = autoLayout(raw, this.ids, this.probe, this.known);
      status = this.known ? 'known' : 'guess'; label = this.known ? this.known.label : 'Guessed';
    }
    while (lay.axes.length < STD_AXES) lay.axes.push('');
    while (lay.buttons.length < STD_BUTTONS) lay.buttons.push('');
    this._ca = lay.axes.map(compileSource);
    this._cb = lay.buttons.map(compileSource);
    if (!this._view || this._view.buttons.length !== lay.buttons.length) {
      this._view = { id: raw.id, index: raw.index, connected: true, mapping: 'standard', timestamp: 0, raw: null, vibrationActuator: null,
        axes: new Array(STD_AXES).fill(0), buttons: lay.buttons.map(() => ({ pressed: false, touched: false, value: 0 })) };
    }
    this.info = { id: raw.id, name: this.ids.name, vendor: this.ids.vendor, product: this.ids.product, format: this.ids.format,
      status, label, layout: { axes: lay.axes.slice(), buttons: lay.buttons.slice() }, raw: true };
  }
  _fill(raw) {
    const v = this._view;
    v.id = raw.id; v.index = raw.index; v.connected = raw.connected !== false; v.timestamp = raw.timestamp || 0;
    v.raw = raw; v.vibrationActuator = raw.vibrationActuator || null;
    for (let k = 0; k < STD_AXES; k++) {
      const src = this._ca[k];
      let x = 0;
      if (src) { const s = src[0]; x = s.k === 1 ? Math.max(-1, Math.min(1, s.s * (+raw.axes[s.i] || 0))) : srcValue(raw, s); }
      v.axes[k] = x;
    }
    for (let k = 0; k < v.buttons.length; k++) {
      const src = this._cb[k], b = v.buttons[k];
      let val = 0, pr = false;
      if (src) for (const s of src) { const x = srcValue(raw, s); if (x > val) val = x; if (srcPressed(raw, s, x)) pr = true; }
      b.value = val; b.pressed = pr; b.touched = pr || val > 0;
    }
  }
}
