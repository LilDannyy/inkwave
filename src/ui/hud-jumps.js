// INKWAVE — super-jump landings and Ink Jet / Zipline return points on screen (b5-jumpui, 2026-10-04). The HUD owns one:
// `hud.jumps = new JumpHud(hud)`, driven by hud.update(dt, frame). The minimap part is placed from hud._updMap (map()),
// and the TAB map's part from diorama.js (dioJumpTags). Every view reads the same list, game/jumpMarks.js landingMarks().
//
// The user asked for "an on screen alert when a teammate is jumping to you and their name, as well as a name around
// the super jump icon, and an indicator for when they're landing"; and, for Zipline / Ink Jet, "an indicator when they
// start using the special so players know where they'd super jump to, and where the player will jump back when it ends".
//   · The alert (only on the screen of the player being jumped to): a pill under the top bar with the jumper's name,
//     "is jumping to you!", the jump icon in a ring that drains to touchdown, and the seconds left. A chime plays
//     (sj_incoming). It goes when they land, or when the jump is called off. Up to three, side by side in one row.
//     The row sits under whatever hangs below the top bar in this mode (Zone Control's chip, Tower Command's track and
//     status, Boss Battle's health bar, the LEAD tags) and under the TRACKED / POISONED badges; while it is up, the
//     announcements that share that band (streak callouts, zone callouts, the one-minute banner, the last-ten count)
//     drop below it (styles/hud-jumps.css, .iw-hud.has-jal).
//   · A tag on every landing mark. It shows the mark's icon in a disc: the super-jump glyph, or for a return mark the
//     special's own icon. Round the disc runs a countdown ring in the jumper's ink, full when the mark appears and empty
//     at touchdown. Under the disc are the name and the seconds left. A return mark's ring runs through the special's
//     time left, then the flight home.
//       world view   floating over the spot, through walls (your team's: the other team's only where you could see the
//                    spot, JUMP_UI.foeThroughWalls), smaller with distance (not your own jump, nor one coming down on
//                    you: the alert has it) — but its name and seconds no smaller than the teammates' own name tags
//                    get (JUMP_UI.labelMin). On a return beacon it stands in for the beacon's own floating icon badge
//                    (hidden; ring + pillar stay)
//       minimap      on the spot over the map's own landing ring / return badge (the corner map and the strike map)
//       TAB map      on the floor at the spot (diorama.js), under the pins (a label never covers one)
//     Every name is at least the game's 11 px (--fs-xs) on any window, the far world tag's at 0.82 of it.
//     Two marks often share a spot: a jump to an Ink Jet / Zipline user comes down by their return mark, and two
//     teammates jumping to one teammate land a metre apart. Each view lays its tags out so none covers another, in the
//     order the marks appeared (an older tag keeps its place): the world view stacks a tag above any tag or teammate's
//     name tag it would cover — or below it, where above would run into what hangs at the top middle (the top bar,
//     a mode's chip / track, the boss bar, the status badges, the alerts) or off the screen; the minimap keeps one ring
//     on a shared spot and stacks the names over it; the TAB map slides a disc the shortest way off an older disc (two
//     side by side) or off a zone / tower chip's text, and moves a label above / beside its disc when below it would
//     cover a pin (badge, stem, key or name), a zone / tower chip or another tag (where every place covers something:
//     the cheapest, and a pin or a name only if nothing else will do).
//     Per frame these only write transforms / a few dirty-checked styles, and read the layout only when a tag's label
//     or a name tag changes its text or the window its size; what hangs at the top middle is read a few times a second
//     (_furn).
//     Who sees what follows the marker it labels. The super-jump reticle and the return beacon are seen by both teams
//     (the other side can camp them), so their ring and icon are shown to everyone. The name and seconds go only to the
//     jumper's own team, as with the ally tags and the death markers. The user, on tracked foes: "dont show their name".
//     That is JUMP_UI.foeNames.
import * as THREE from 'three';
import { h, clamp, colorVars, toHex } from './ui-util.js';
import { specialIcon } from './ui-icons.js';
import { G } from '../core/ctx.js';
import { SFX } from '../audio/audio.js';
import { landingMarks, incomingJumps } from '../game/jumpMarks.js';

export const JUMP_UI = {
  lift: 2.3,          // m over the landing spot: the world tag's disc
  foeNames: false,    // the other team's marks show their ring and icon only (no name / seconds)
  // the other team's world tags only while you could see the spot or the tag's place from the camera: the old reticle
  // and the return beacon are in-world marks that walls hide (their light pillars still show over a wall). true: through
  // walls at any distance, like your own team's
  foeThroughWalls: false,
  alerts: 3,          // most "jumping to you" alerts at once
  gap: 3,             // px between tags laid out round each other
  // the world tag shrinks with distance (1.15 − m / 70, kept in 0.55…1), but its name and seconds no further than the
  // teammates' own name tags do (styles/hud.css .iw-mk__tag: 1 − .18 far), so a far name stays readable
  labelMin: 0.82,
  furnDt: 0.25,       // s between reads of what hangs at the top middle (or at once when it changes: _furn)
};
const K = '#15121c';
// the super-jump glyph (hud.js SJ_ICON, the splat screen's plan chip): an arc onto a landing ring
export const SJ_GLYPH = `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="42" cy="50" rx="15" ry="6" fill="none" stroke="${K}" stroke-width="7"/><ellipse cx="42" cy="50" rx="15" ry="6" fill="none" stroke="currentColor" stroke-width="3.6"/><path d="M8 52 C9 22 30 6 42 36" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M8 52 C9 22 30 6 42 36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M33 31 L42.5 40 L47.5 27.5" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 31 L42.5 40 L47.5 27.5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const RING = '<svg class="iw-jt__ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="b" cx="24" cy="24" r="20.5"/><circle class="f" cx="24" cy="24" r="20.5" pathLength="100"/></svg>';
// "a teammate is jumping to you": a whistle coming down, then a bright two-note "here!"
if (!SFX.sj_incoming) SFX.sj_incoming = {
  gain: 0.24, max: 1, jitter: 0, reverb: 0.08, minGap: 0.35,
  build(v, p) {
    v.tone({ t: 0, type: 'triangle', f: 1700 * p, f1: 700 * p, sw: 0.14, a: 0.008, d: 0.13, peak: 0.2 });
    for (const [t, f] of [[0.12, 1046.5], [0.2, 1568]]) {
      v.tone({ t, f: f * 0.5 * p, f1: f * p, sw: 0.018, a: 0.002, d: 0.22, peak: 0.5 });
      v.tone({ t, type: 'triangle', f: f * 2 * p, a: 0.001, d: 0.08, peak: 0.09 });
    }
  },
};

const _v = new THREE.Vector3(), _a = new THREE.Vector3();
const hexOf = (t) => toHex(G.teamHex?.[t], t ? '#2f5bff' : '#ff8a14');
const secs = (s) => (s >= 9.95 ? String(Math.ceil(s)) : Math.max(0, s).toFixed(1));
const uOf = (W = innerWidth, H = innerHeight) => Math.min(W / 100, (H * 1.7778) / 100);   // the CSS --u (styles/ui.css)
const byBirth = (a, b) => a.born - b.born;   // (stable: same-frame marks keep landingMarks' order)
const NONE = Object.freeze([]);

// ---- boxes (px) for laying tags out round each other: a small reusable list
class Boxes {
  constructor() { this.a = []; this.n = 0; }
  clear() { this.n = 0; return this; }
  add(l, t, r, b, own = null) { const x = this.a[this.n] || (this.a[this.n] = {}); this.n++; x.l = l; x.t = t; x.r = r; x.b = b; x.own = own; return x; }
  // the box among these that a box (l, t, r, b) touches (within g) with the highest top, or null
  hit(l, t, r, b, g, own) {
    let o = null;
    for (let i = 0; i < this.n; i++) { const q = this.a[i]; if (q.own !== null && q.own === own) continue; if (l < q.r + g && q.l < r + g && t < q.b + g && q.t < b + g && (!o || q.t < o.t)) o = q; }
    return o;
  }
  // how much of a box (l, t, r, b) these cover (px²)
  cover(l, t, r, b, own) {
    let s = 0;
    for (let i = 0; i < this.n; i++) { const q = this.a[i]; if (q.own !== null && q.own === own) continue; s += Math.max(0, Math.min(r, q.r) - Math.max(l, q.l)) * Math.max(0, Math.min(b, q.b) - Math.max(t, q.t)); }
    return s;
  }
  copy(o) { this.n = 0; for (let i = 0; i < o.n; i++) { const q = o.a[i]; this.add(q.l, q.t, q.r, q.b, q.own); } return this; }
}

// a teammate's name tag as drawn (hud.js _updMarkers, styles/hud.css .iw-mk__tag): 9 px over the anchor, scaled from its
// bottom by 1 − far × .18, its 2 px outline, the pointer under it. Its size is read once per name and window size.
const MK_SIZE = new WeakMap();
function allyBox(el, q, u, out) {
  const nm = q.name || '';
  let sz = el && MK_SIZE.get(el);
  if (el && (!sz || sz.name !== nm || sz.u !== u)) {
    const tg = el.firstChild;
    sz = { name: nm, u, w: tg ? tg.offsetWidth : 0, h: tg ? tg.offsetHeight : 0 };
    if (sz.w) MK_SIZE.set(el, sz);
  }
  const w = sz && sz.w ? sz.w : 32 + nm.length * 9.2, hh = sz && sz.w ? sz.h : 22;   // (not laid out yet: about that)
  const s = 1 - (q.dist != null ? clamp((q.dist - 14) / 20, 0, 1) : 0) * 0.18;
  out.add(q.x - (w * s) / 2 - 2, q.y - 9 - hh * s - 2, q.x + (w * s) / 2 + 2, q.y - 3);
}
// a world tag's place up or down its column (dir −1 / 1) from y: past every teammate's name tag and older tag in the way
// (obs), and never into the top middle (top) going up; null when it would leave the screen (or meet the top middle)
const EPS = 0.01;
function stackY(obs, top, x, y, hw, tp, bt, g, dir, H) {
  for (let k = 0; k < 24; k++) {
    const l = x - hw, t = y - tp, r = x + hw, b = y + bt;
    if (dir < 0 ? t < 0 : b > H) return null;
    const f = top.hit(l, t, r, b, g, null);
    if (f && dir < 0) return null;
    const o = obs.hit(l, t, r, b, g, null) || f;
    if (!o) return y;
    y = dir < 0 ? o.t - g - bt - EPS : o.b + g + tp + EPS;   // (EPS: past it for sure, not back on its edge by a rounding)
  }
  return null;
}

// one tag (world / minimap / TAB map): a disc with the icon and the countdown ring, the name and seconds under it
function makeTag(cls) {
  const icon = h('i', { class: 'iw-jt__icon' }), name = h('b', { class: 'iw-jt__name' }), sec = h('em', { class: 'iw-jt__sec' });
  const lab = h('span', { class: 'iw-jt__tag' }, name, sec);
  const el = h('div', { class: 'iw-jt ' + cls }, h('span', { class: 'iw-jt__disc', html: RING }, icon), lab);
  el.style.display = 'none';
  return { el, icon, name, sec, lab, ring: el.querySelector('.f'), on: false, key: '', ko: '', st: '', tf: '', mark: null, named: false, foe: false,
    mKey: '', lw: 0, lh: 0, lx: '', ly: '', lk: '', occl: false, merged: false, x: 0, y: 0 };
}
// the label's size (px, before any scale), read when its look changes (`scope`: the view's size)
function measure(t, scope) {
  const k = t.key + '|' + scope;
  if (k === t.mKey) return;
  t.mKey = k;
  t.lw = t.named ? t.lab.offsetWidth : 0; t.lh = t.named ? t.lab.offsetHeight : 0;
  if (t.named && !t.lw) t.mKey = '';   // (not laid out yet, e.g. the HUD hidden: again next frame)
}
function setLabel(t, lx, ly) {   // the label moved from where the CSS puts it (--lx / --ly)
  const a = lx.toFixed(1), b = ly.toFixed(1);
  if (a !== t.lx) { t.lx = a; t.el.style.setProperty('--lx', a + 'px'); }
  if (b !== t.ly) { t.ly = b; t.el.style.setProperty('--ly', b + 'px'); }
}
function place(t, x, y, sc) {
  t.x = x; t.y = y;
  const tf = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)` + (sc ? ` scale(${sc.toFixed(3)})` : '');
  if (tf !== t.tf) { t.tf = tf; t.el.style.transform = tf; }
}
// the other team's mark seen from the camera: its spot or the tag's place in the open (walls hide the old reticle)
function inSight(r, cam) {
  const P = G.physics;
  if (!P || !P.los) return true;
  if (P.los(cam.position, _a.set(r.x, r.y + 0.3, r.z))) return true;
  return P.los(cam.position, _a.set(r.x, r.y + JUMP_UI.lift, r.z));
}
// fill a tag from a mark (dirty-checked)
function fillTag(t, r, me) {
  const team = me ? me.team : 0, own = r.team === team;
  const named = !!(r.actor && r.actor !== me && (own || JUMP_UI.foeNames));
  const key = `${r.kind}|${r.icon}|${r.team}|${named ? r.actor.name : ''}|${own ? 1 : 0}|${r.actor === me ? 1 : 0}`;
  if (key !== t.key) {
    t.key = key;
    t.named = named; t.foe = !own;
    colorVars(t.el, 'c', hexOf(r.team));
    t.icon.innerHTML = r.icon === 'sj' ? SJ_GLYPH : specialIcon(r.icon);
    t.name.textContent = named ? r.actor.name : '';
    t.el.classList.toggle('is-named', named);
    t.el.classList.toggle('is-foe', !own);
    t.el.classList.toggle('is-self', r.actor === me);
    t.el.classList.toggle('is-return', r.kind === 'return');
  }
  t.el.classList.toggle('is-home', r.phase === 'home');
  t.el.classList.toggle('is-charge', r.phase === 'charge');
  const k = r.total > 0 ? clamp(r.left / r.total, 0, 1) : 0;
  const ko = (100 * (1 - k)).toFixed(1);
  if (ko !== t.ko) { t.ko = ko; t.ring.style.strokeDashoffset = ko; }
  const st = secs(r.left);
  if (st !== t.st) { t.st = st; t.sec.textContent = st; }
  t.mark = r;
}
function show(t, on) { if (on !== t.on) { t.on = on; t.el.style.display = on ? '' : 'none'; if (!on) t.mark = null; } }
function grab(pool, layer, cls, i) { while (pool.length <= i) { const t = makeTag(cls); layer.appendChild(t.el); pool.push(t); } return pool[i]; }

export class JumpHud {
  constructor(hud) {
    this.hud = hud;
    this.wLayer = h('div', { class: 'iw-jts' });                 // world tags (under the ally tags)
    hud.el.insertBefore(this.wLayer, hud.markerLayer);
    this.mLayer = h('div', { class: 'iw-map__jts' });            // minimap tags (over the dots, under the gloss)
    hud.mapFrame.insertBefore(this.mLayer, hud.mapFrame.lastChild);
    this.aLayer = h('div', { class: 'iw-jal' });                 // "jumping to you" alerts
    hud.el.insertBefore(this.aLayer, hud.callouts);
    this.worldTags = []; this.mapTags = []; this.alerts = [];
    this._in = []; this._ord = [];
    this._mapOn = false;
    this._wObs = new Boxes(); this._wTop = new Boxes(); this._mRings = new Boxes(); this._mLabs = new Boxes();
    this._jal = { on: false, top: '', bot: '', y0: 0, y1: 0 };
    this._F = { boxes: new Boxes(), t: Infinity, w: 0, h: 0, zo: '', tw: '', st: '', boss: false, nal: -1, els: null, cx: 0, rowHalf: 0 };
  }

  update(dt, f) {
    const me = this.hud._local(), live = this.hud._live() && !this.hud.lab;
    const marks = live ? landingMarks() : NONE;
    this._alerts(dt, live && me && me.alive ? incomingJumps(me, this._in) : NONE);
    // what hangs at the top middle: the alerts' row goes under it, the world tags keep out of it (a cached read)
    const F = marks.length || this.alerts.length ? this._furn(dt) : null;
    if (this.alerts.length) this._placeAlerts(F);
    this._world(marks, me, f && f.markers, F);
    if (!f || !f.map) this._mapOff();
  }
  // the marks in the order they appeared: an older tag keeps its place, a newer one moves clear of it
  _sorted(marks) { const o = this._ord; o.length = 0; for (const r of marks) o.push(r); return o.sort(byBirth); }

  // ---- world view: a tag floating over each landing spot, sized by distance. Not your own jump (you're on your way
  // there) nor one coming down on you (the alert says it). A tag that would cover a teammate's name tag (a jump lands
  // 1.1 m from the teammate it's aimed at; markers: the HUD frame's ally tags, main.js) or an older tag (two jumps to one
  // teammate; a jump to an Ink Jet / Zipline user, by their return mark) stacks straight up above it — unless that
  // would take it into what hangs at the top middle (the top bar, a mode's chip / track, the boss bar, the status
  // badges, the alerts) or off the screen: then straight down below them instead (and sideways only if the whole
  // column is full).
  _world(marks, me, markers, F) {
    const cam = G.camera, W = innerWidth, H = innerHeight, u = uOf(W, H), g = JUMP_UI.gap;
    const obs = this._wObs.clear(), top = this._wTop.clear();
    if (marks.length) {
      const mk = this.hud.markers;
      if (markers) for (let i = 0; i < markers.length; i++) if (markers[i].onScreen) allyBox(mk && mk[i], markers[i], u, obs);
      if (F) {
        top.copy(F.boxes);
        const J = this._jal;
        if (J.on && F.rowHalf) top.add(F.cx - F.rowHalf, J.y0, F.cx + F.rowHalf, J.y1);
      }
    }
    let n = 0;
    const scope = u.toFixed(2);
    if (cam) for (const r of this._sorted(marks)) {
      // a return beacon's own floating icon badge (specials.js ReturnMarker) would sit doubled behind this tag's disc:
      // the tag takes its place (with the name and the countdown); its ring and light pillar stay
      if (r.kind === 'return' && r.key.badge && r.key.badge.visible) r.key.badge.visible = false;
      if (r.kind === 'jump' && (r.actor === me || (me && r.target === me))) continue;
      _v.set(r.x, r.y + JUMP_UI.lift, r.z);
      const dist = _v.distanceTo(cam.position);
      _v.project(cam);
      if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
      const t = grab(this.worldTags, this.wLayer, 'is-world', n++);
      fillTag(t, r, me);
      show(t, true);
      const occl = t.foe && !JUMP_UI.foeThroughWalls && !inSight(r, cam);
      if (occl !== t.occl) { t.occl = occl; t.el.classList.toggle('is-occl', occl); }
      measure(t, scope);
      let x = (_v.x * 0.5 + 0.5) * W;
      const y0 = (0.5 - _v.y * 0.5) * H, sc = clamp(1.15 - dist / 70, 0.55, 1), ls = Math.max(sc, JUMP_UI.labelMin);
      // the label kept at ls (its own scale, from its top middle, inside the tag's sc)
      const lk = (ls / sc).toFixed(3);
      if (lk !== t.lk) { t.lk = lk; t.lab.style.transform = lk === '1.000' ? '' : `scale(${lk})`; }
      // the tag's box round its anchor (the disc's centre): the ring (and its beat), the label under it
      const d = (t.foe ? 2.2 : 2.7) * u, R = 0.83 * d;   // (the ring, as it beats)
      const hw = Math.max(R * sc, (t.lw / 2) * ls), tp = R * sc, bt = t.named ? (0.5 * d + 0.62 * u) * sc + t.lh * ls : R * sc;
      let y = y0;
      if (!occl) {
        let at = stackY(obs, top, x, y0, hw, tp, bt, g, -1, H);
        if (at === null) at = stackY(obs, top, x, y0, hw, tp, bt, g, 1, H);
        for (let k = 1; at === null && k <= 4; k++) {   // (the column full: the nearest free one beside it)
          const xs = x + (k & 1 ? 1 : -1) * Math.ceil(k / 2) * (2 * hw + g);
          at = stackY(obs, top, xs, y0, hw, tp, bt, g, -1, H);
          if (at === null) at = stackY(obs, top, xs, y0, hw, tp, bt, g, 1, H);
          if (at !== null) x = xs;
        }
        if (at !== null) y = at;
        obs.add(x - hw, y - tp, x + hw, y + bt);
      }
      place(t, x, y, sc);
    }
    for (let i = n; i < this.worldTags.length; i++) show(this.worldTags[i], false);
  }

  /** hud._updMap → the minimap's tags at its current size (bw × bh px). */
  map(bw, bh) {
    const mm = G.game?.minimap, me = this.hud._local();
    const marks = this.hud._live() && !this.hud.lab && mm ? landingMarks() : NONE;
    const tc = this._tc || (this._tc = { x: 0, y: 0 });
    const u = uOf(), exp = this.hud.map.classList.contains('is-expanded'), g = 2;
    const d = (exp ? 2.4 : 1.5) * u, near = 0.72 * d, rr = 0.6 * d, nb = 0.66 * d;   // (.iw-jt.is-map: the ring, the name's bottom over it)
    const rings = this._mRings.clear(), labs = this._mLabs.clear(), scope = this._mScope(u, exp, bw);
    let n = 0;
    for (const r of this._sorted(marks)) {
      mm.toCanvas(r.x, r.z, tc);
      const t = grab(this.mapTags, this.mLayer, 'is-map', n++);
      fillTag(t, r, me);
      const x = clamp(tc.x / mm.w) * bw, y = clamp(tc.y / mm.h) * bh;
      place(t, x, y, 0);
      show(t, true);
      // one ring per spot: a mark on (about) the spot of an older one keeps its name, not a second ring on the first
      let merged = false;
      for (let i = 0; i < rings.n; i++) { const o = rings.a[i]; if (Math.hypot((o.l + o.r) / 2 - x, (o.t + o.b) / 2 - y) < near) { merged = true; break; } }
      if (merged !== t.merged) { t.merged = merged; t.el.classList.toggle('is-merged', merged); }
      if (!merged) rings.add(x - rr, y - rr, x + rr, y + rr, t);
      measure(t, scope);
      if (!t.lw) { setLabel(t, 0, 0); continue; }
      // the name over its ring, kept inside the map's frame; above an older name (or another spot's ring) it would
      // cover; under its ring if that runs off the top
      const l = bw > t.lw + 2 ? clamp(x - t.lw / 2, 1, bw - 1 - t.lw) : x - t.lw / 2, rgt = l + t.lw;
      let b = y - nb;
      for (let k = 0; k < 12; k++) {
        const o = labs.hit(l, b - t.lh, rgt, b, g, null) || rings.hit(l, b - t.lh, rgt, b, g, t);
        if (!o) break;
        b = o.t - g - EPS;
      }
      if (b - t.lh < 0) {
        b = y + rr + 1 + t.lh;
        for (let k = 0; k < 12; k++) {
          const o = labs.hit(l, b - t.lh, rgt, b, g, null) || rings.hit(l, b - t.lh, rgt, b, g, t);
          if (!o) break;
          b = o.b + g + t.lh + EPS;
        }
      }
      labs.add(l, b - t.lh, rgt, b);
      setLabel(t, l - (x - t.lw / 2), b - (y - nb));
    }
    for (let i = n; i < this.mapTags.length; i++) show(this.mapTags[i], false);
    this._mapOn = true;
  }
  // the minimap labels' measuring scope: the window's size, the expanded map, the map's width — a name wider than the map
  // (11 px at least: a long online name on a narrow map) is cut to it with an ellipsis (--jt-mw), not clipped by the frame
  _mScope(u, exp, bw) {
    const w = Math.max(0, Math.floor(bw - 4));
    if (this._msU !== u || this._msX !== exp || this._msW !== w) {
      this._msU = u; this._msX = exp; this._msW = w; this._ms = `${u.toFixed(2)}|${exp ? 1 : 0}|${w}`;
      this.mLayer.style.setProperty('--jt-mw', w + 'px');
    }
    return this._ms;
  }
  _mapOff() { if (!this._mapOn) return; this._mapOn = false; for (const t of this.mapTags) show(t, false); }

  // ---- "NAME is jumping to you!" (only on the screen of the player being jumped to)
  _alerts(dt, inc) {
    const A = this.alerts;
    for (const al of A) al.live = false;
    for (const r of inc) {
      let al = null, live = 0;
      for (const x of A) if (!x.out) { live++; if (x.actor === r.actor) al = x; }
      if (!al) {
        if (live >= JUMP_UI.alerts) continue;
        al = this._newAlert(r.actor);
        this.hud._snd('sj_incoming', { volume: 0.8 });
      }
      al.live = true;
      const k = r.total > 0 ? clamp(r.left / r.total, 0, 1) : 0, ko = (100 * (1 - k)).toFixed(1);
      if (ko !== al.ko) { al.ko = ko; al.ring.style.strokeDashoffset = ko; }
      const st = secs(r.left);
      if (st !== al.st) { al.st = st; al.sec.textContent = st; }
      al.landing = r.left < 0.45;
    }
    for (let i = A.length - 1; i >= 0; i--) {
      const al = A[i];
      if (al.out) { al.t -= dt; if (al.t <= 0) { al.el.remove(); A.splice(i, 1); } continue; }
      al.el.classList.toggle('is-landing', !!al.landing);
      if (!al.live) { al.out = true; al.t = 0.32; al.el.classList.add('is-out'); }
    }
    // (.has-jal: the announcements below the row read --jal-b, set by _placeAlerts)
    const on = A.length > 0;
    if (on !== this._jal.on) { this._jal.on = on; this.hud.el.classList.toggle('has-jal', on); }
  }
  // the row under the top bar at 10.2 u, or lower: under whatever hangs below it in this mode and the status badges (the
  // ones across the row's width)
  _placeAlerts(F) {
    const u = uOf(), J = this._jal, B = F.boxes, cx = F.cx, half = Math.max(30 * u, F.rowHalf + u);
    let y = 10.2 * u;
    for (let i = 0; i < B.n; i++) { const b = B.a[i]; if (b.r < cx - half || b.l > cx + half) continue; y = Math.max(y, b.b + 0.6 * u); }
    J.y0 = y; J.y1 = y + 4.1 * u;   // (a pill: 3.8 u + its outline)
    const top = y.toFixed(1) + 'px', bot = J.y1.toFixed(1) + 'px';
    if (top !== J.top) { J.top = top; this.aLayer.style.top = top; }
    if (bot !== J.bot) { J.bot = bot; this.hud.el.style.setProperty('--jal-b', bot); }
  }
  // What hangs at the top middle, as boxes in the HUD's frame: the roster + timer, Zone Control's chip (overtime, zone
  // shift), Tower Command's track (overtime, status), Boss Battle's health bar and emblem, the TRACKED / POISONED badges,
  // the LEAD tags; and the alerts' row's half-width. Read from the layout (which forces it) at most every
  // JUMP_UI.furnDt s, or at once when what they hang on changes: the window's size, the mode's state classes, the status
  // badges, the boss bar coming on or off, an alert added or gone. Every other frame reads this cache.
  _furn(dt) {
    const hud = this.hud, F = this._F, bar = hud.boss && hud.boss.bar;
    F.t += dt;
    const zo = hud.zo ? hud.zo.className : '', tw = hud.tw ? hud.tw.className : '', st = hud.statusEl ? hud.statusEl.className : '';
    const boss = !!bar && !bar.classList.contains('is-off'), nal = this.alerts.length;
    if (F.t < JUMP_UI.furnDt && innerWidth === F.w && innerHeight === F.h && zo === F.zo && tw === F.tw && st === F.st && boss === F.boss && nal === F.nal) return F;
    F.t = 0; F.w = innerWidth; F.h = innerHeight; F.zo = zo; F.tw = tw; F.st = st; F.boss = boss; F.nal = nal;
    if (!F.els) F.els = [hud.top, hud.zo, hud.tw, bar, hud.boss && hud.boss.emb].filter(Boolean);
    const r0 = hud.el.getBoundingClientRect(), B = F.boxes.clear();
    F.cx = r0.width / 2;
    const add = (el) => { const b = el.getBoundingClientRect(); if (b.width >= 1 && b.height >= 1) B.add(b.left - r0.left, b.top - r0.top, b.right - r0.left, b.bottom - r0.top); };
    for (const el of F.els) add(el);
    if (hud.statusEl) for (const el of hud.statusEl.children) add(el);
    for (const el of hud.el.querySelectorAll('.iw-lead.is-on .iw-lead__tag')) add(el);
    // the row's width as laid out (not as its pills scale in)
    let w = 0;
    for (const al of this.alerts) w += al.el.offsetWidth;
    F.rowHalf = nal ? (w + (nal - 1) * 0.7 * uOf()) / 2 : 0;   // (.iw-jal's gap)
    return F;
  }
  _newAlert(a) {
    const icon = h('i', { class: 'iw-jal__icon', html: SJ_GLYPH });
    const sec = h('em', { class: 'iw-jal__sec' });
    const el = h('div', { class: 'iw-jal__i' },
      h('span', { class: 'iw-jal__disc', html: RING }, icon),
      h('span', { class: 'iw-jal__txt' }, h('b', { class: 'iw-jal__name iw-display' }, a.name || ''), h('small', null, 'is jumping to you!')),
      sec);
    colorVars(el, 'c', hexOf(a.team));
    this.aLayer.appendChild(el);
    const al = { el, actor: a, ring: el.querySelector('.f'), sec, ko: '', st: '', live: true, out: false, t: 0, landing: false };
    this.alerts.push(al);
    return al;
  }

  /** What's on screen (tests): the alerts, and the visible tags of each view with their name / seconds / place. */
  state() {
    const tags = (pool) => pool.filter((t) => t.on && t.mark && !t.occl).map((t) => ({ kind: t.mark.kind, actor: t.mark.actor.name, team: t.mark.team, name: t.name.textContent, sec: +t.st, k: t.mark.total > 0 ? t.mark.left / t.mark.total : 0, tf: t.tf, lx: +t.lx || 0, ly: +t.ly || 0, merged: t.merged }));
    return { alerts: this.alerts.filter((x) => !x.out).map((x) => ({ name: x.actor.name, sec: +x.st })), world: tags(this.worldTags), map: tags(this.mapTags), dio: tags(DIO.pool) };
  }
}

// ---- the TAB map (diorama.js update → dioJumpTags): a pin on each landing spot, the same tag
const DIO = { pool: [], layer: null, of: null, cur: [], ord: [], discs: new Boxes(), chips: new Boxes(), pins: new Boxes(), stems: new Boxes(), labs: new Boxes(), names: new WeakMap(), key: null };
// a disc that would sit on an older disc (two marks on one spot) or hide a zone / tower chip's text slides off it the
// shortest way, to a place clear of the pins' badges, keys and names too (drawn over the discs; a pin's thin stem may
// cross a disc — it points at the spot): right, left, down, up or a diagonal (a tie: in that order — so two discs on one
// spot sit side by side)
const D45 = Math.SQRT1_2, SLIDE = [1, 0, -1, 0, 0, 1, 0, -1, D45, D45, -D45, D45, D45, -D45, -D45, -D45];
// how far a box (hw × hh round x, y) slides along (ux, uy) (a unit vector) until it covers nothing in A, B or C
// (Infinity: it would leave the frame first). Each step goes just past the box it covers, on whichever axis frees it first
function slide(A, B, C, x, y, hw, hh, g, ux, uy, W, H) {
  let s = 0;
  for (let k = 0; k < 24; k++) {
    const cx = x + ux * s, cy = y + uy * s, l = cx - hw, t = cy - hh, r = cx + hw, b = cy + hh;
    if (l < 0 || t < 0 || r > W || b > H) return Infinity;
    const o = A.hit(l, t, r, b, g, null) || B.hit(l, t, r, b, g, null) || C.hit(l, t, r, b, g, null);
    if (!o) return s;
    const sx = ux > 0 ? (o.r + g + hw - x) / ux : ux < 0 ? (o.l - g - hw - x) / ux : Infinity;
    const sy = uy > 0 ? (o.b + g + hh - y) / uy : uy < 0 ? (o.t - g - hh - y) / uy : Infinity;
    s = Math.min(sx, sy) + EPS;
  }
  return Infinity;
}
// a label's places round its disc, as (sideways, row) pairs indexing DX / ROW (filled per tag in dioJumpTags), nearest
// first: under the disc, nudged sideways, over it, beside it, a row further out; then beside it a row up / down, a
// whole label-width aside, and up to three rows out
//   DX   0 · 1 +½ label · 2 −½ · 3 + beside (½ label + ring + .25 u) · 4 − beside · 5 +(½ label + ring) · 6 − · 7 +1 label
//        · 8 −1 · 9 +(label + ring + .25 u) · 10 −
//   ROW  0 under the disc · 1 over it · 2 level with it (beside only) · 3 / 5 one / two rows under row 0 · 4 / 6 one / two
//        rows over row 1 · 7 / 8 a row over / under level
const LAB_AT = [0, 0, 1, 0, 2, 0, 0, 1, 3, 2, 4, 2, 1, 1, 2, 1, 5, 0, 6, 0, 5, 1, 6, 1, 0, 3, 1, 3, 2, 3, 0, 4, 1, 4, 2, 4,
  3, 7, 4, 7, 3, 8, 4, 8, 5, 3, 6, 3, 5, 4, 6, 4, 7, 0, 8, 0, 7, 1, 8, 1, 9, 2, 10, 2, 0, 5, 1, 5, 2, 5, 0, 6, 1, 6, 2, 6,
  7, 3, 8, 3, 7, 4, 8, 4, 9, 7, 10, 7, 9, 8, 10, 8, 5, 5, 6, 5, 5, 6, 6, 6, 9, 0, 10, 0, 9, 1, 10, 1, 7, 5, 8, 5, 7, 6, 8, 6];
const DX = new Float64Array(11), ROW = new Float64Array(9);
// what a label may cover, as a cost per px² covered. A pin (its badge, stem, key or name) or another tag's label: a name
// hidden, so never while any place is free of them. A zone / tower chip's text, the screen's edge, another disc: less.
const COST = { hard: 100, edge: 20, chip: 10, disc: 1 };
export function dioJumpTags(dio, cam, W, H, me) {
  if (DIO.of !== dio) {
    DIO.of = dio; DIO.pool = [];
    DIO.layer = h('div', { class: 'iw-dio__jts' });
    const pins = dio.pins[0] && dio.pins[0].el.parentNode;
    // (under the pins: they're what you pick to jump, and a label never sits on one, so names on both stay readable)
    dio.el.insertBefore(DIO.layer, pins && pins.parentNode === dio.el ? pins : dio.cursor);
  }
  const m = G.match;
  const marks = m && !m.attract ? landingMarks() : NONE;
  const u = uOf(W, H), g = JUMP_UI.gap, scope = u.toFixed(2);
  // 1 · each disc on its spot. One that would sit on an older disc (two marks on one spot) goes beside it; one that
  // would hide a zone / tower chip's text goes just clear of the chip (the shortest way: SLIDE)
  const discs = DIO.discs.clear(), chips = DIO.chips.clear(), pins = DIO.pins.clear(), stems = DIO.stems.clear(), labs = DIO.labs.clear(), cur = DIO.cur, ord = DIO.ord;
  cur.length = 0; ord.length = 0;
  for (let i = 0; i < marks.length; i++) ord.push(marks[i]);
  ord.sort(byBirth);
  if (ord.length) { chipBoxes(dio, u, chips); pinBoxes(dio, u, pins, stems); }
  let n = 0;
  for (let i = 0; i < ord.length; i++) {
    const r = ord[i];
    _v.set(r.x, r.y + 0.08, r.z).project(cam);
    if (_v.z > 1) continue;
    const t = grab(DIO.pool, DIO.layer, 'is-dio', n++);
    fillTag(t, r, me);
    show(t, true);
    measure(t, scope);
    const x0 = (_v.x * 0.5 + 0.5) * W, y0 = (0.5 - _v.y * 0.5) * H;
    const d = (t.foe ? 1.7 : 2.1) * u, R = 0.83 * d;   // (R: the ring, as it beats)
    let x = x0, y = y0;
    if (discs.hit(x0 - R, y0 - R, x0 + R, y0 + R, g, null) || chips.hit(x0 - R, y0 - R, x0 + R, y0 + R, g, null)) {
      let best = Infinity, bx = 0, by = 0;
      for (let k = 0; k < SLIDE.length; k += 2) {
        const sl = slide(discs, chips, pins, x0, y0, R, R, g, SLIDE[k], SLIDE[k + 1], W, H);
        if (sl < best - 0.5) { best = sl; bx = SLIDE[k]; by = SLIDE[k + 1]; }
      }
      if (best < Infinity) { x = x0 + bx * best; y = y0 + by * best; }
    }
    t.d = d; t.R = R;
    discs.add(x - R, y - R, x + R, y + R, t);
    place(t, x, y, 0);
    cur.push(t);
  }
  for (let i = n; i < DIO.pool.length; i++) show(DIO.pool[i], false);
  // 2 · each name label where it covers nothing: the first free place in LAB_AT (nearest first); where every place
  // covers something, the one that costs least (COST: a pin or another label only if nothing else will do)
  for (let i = 0; i < cur.length; i++) {
    const t = cur[i];
    if (!t.named) { setLabel(t, 0, 0); continue; }
    const x = t.x, y = t.y, R = t.R, d = t.d, lw = t.lw, lh = t.lh, s = 0.25 * u, rh = lh + g;
    const l0 = x - lw / 2, t0 = y + 0.5 * d + 0.55 * u;   // (.iw-jt.is-dio .iw-jt__tag: under the disc)
    const up = y - R - s - lh, mid = y - lh / 2;
    ROW[0] = t0; ROW[1] = up; ROW[2] = mid; ROW[3] = t0 + rh; ROW[4] = up - rh; ROW[5] = t0 + 2 * rh; ROW[6] = up - 2 * rh; ROW[7] = mid - rh; ROW[8] = mid + rh;
    const h2 = lw / 2, side = h2 + R + s, far = h2 + R, wide = lw + R + s;
    DX[0] = 0; DX[1] = h2; DX[2] = -h2; DX[3] = side; DX[4] = -side; DX[5] = far; DX[6] = -far; DX[7] = lw; DX[8] = -lw; DX[9] = wide; DX[10] = -wide;
    let bl = l0, bt = t0, best = Infinity;
    for (let k = 0; k < LAB_AT.length; k += 2) {
      const l = l0 + DX[LAB_AT[k]], tp = ROW[LAB_AT[k + 1]];
      const L = l - 2, T = tp - 2, Rt = l + lw + 2, B = tp + lh + 2;
      let c = COST.hard * (pins.cover(L, T, Rt, B, null) + stems.cover(L, T, Rt, B, null) + labs.cover(L, T, Rt, B, null)) + COST.chip * chips.cover(L, T, Rt, B, null) + COST.disc * discs.cover(L, T, Rt, B, t);
      if (l < 0 || tp < 0 || l + lw > W || tp + lh > H) c += COST.edge * lw * lh;
      if (c < best - 0.5) { best = c; bl = l; bt = tp; if (c <= 0) break; }
    }
    labs.add(bl, bt, bl + lw, bt + lh);
    setLabel(t, bl - l0, bt - t0);
  }
}
// Zone Control's zone chips and Tower Command's tower chip on the TAB map (diorama.js _zones / _tower: centred on
// their transform's point), their size read once per text, look and window size
const _tf = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/;
function chipBoxes(dio, u, out) {
  const zt = dio.ztags;
  if (zt) for (let i = 0; i < zt.length; i++) chipBox(zt[i], u, out);
  if (dio.ttag) chipBox(dio.ttag, u, out);
}
function chipBox(tg, u, out) {
  if (!tg || !tg.vis || tg.el.style.display === 'none') return;
  const q = _tf.exec(tg.el.style.transform || ''), box = tg.el.firstChild;
  if (!q || !box) return;
  const txt = tg.label ? tg.label.textContent : '', cls = tg.el.className;
  let sz = DIO.names.get(box);
  if (!sz || sz.txt !== txt || sz.cls !== cls || sz.u !== u) DIO.names.set(box, (sz = { txt, cls, u, w: box.offsetWidth, h: box.offsetHeight }));
  const x = +q[1], y = +q[2], o = 3;   // (its 2.5 px ink outline)
  if (sz.w) out.add(x - sz.w / 2 - o, y - sz.h / 2 - o, x + sz.w / 2 + o, y + sz.h / 2 + o);
}
// the TAB map's pins as boxes (diorama.js _pin, styles/hud.css .iw-pin: the badge on its 2.2 u stem, the key at its
// top right, the name over it); the stems into their own list
function pinBoxes(dio, u, out, stems) {
  const st = 2.2 * u, planning = dio.el.classList.contains('is-planning');
  for (const p of dio.pins) {
    if (!p.vis) continue;
    const c = p.el.classList, self = c.contains('iw-pin--self');
    if (self && planning) continue;
    const s = (self ? 3.3 : c.contains('iw-pin--home') ? 2.5 : 2.9) * u * (c.contains('is-hover') ? 1.22 : 1), x = p.x, y = p.y, o = (self ? 0.42 : 0.36) * u;
    out.add(x - s / 2 - o, y - st - s - o, x + s / 2 + o, y - st + o);   // (with its white + dark outline)
    stems.add(x - 3, y - st, x + 3, y);   // the stem, from the badge down to the spot (3 px + its 1.5 px outline)
    if (!self) {
      let kw = DIO.key;
      if (!kw || kw.u !== u) { const ke = p.el.querySelector('.iw-pin__key'); kw = DIO.key = { u, w: ke ? ke.offsetWidth : 0, h: ke ? ke.offsetHeight : 0 }; }
      if (kw.w) out.add(x + 0.34 * s, y - st - 0.62 * s - kw.h, x + 0.34 * s + kw.w, y - st - 0.62 * s);
    }
    const txt = p.name.textContent;
    let nm = DIO.names.get(p.el);
    if (!nm || nm.txt !== txt || nm.u !== u) DIO.names.set(p.el, (nm = { txt, u, w: p.name.offsetWidth, h: p.name.offsetHeight }));
    if (nm.w) out.add(x - nm.w / 2, y - st - s - 0.45 * u - nm.h, x + nm.w / 2, y - st - s - 0.45 * u);
  }
}
