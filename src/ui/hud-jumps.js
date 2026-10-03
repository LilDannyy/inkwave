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
//                    you: the alert has it). On a return beacon it stands in for the beacon's own floating icon badge
//                    (hidden; ring + pillar stay)
//       minimap      on the spot over the map's own landing ring / return badge (the corner map and the strike map)
//       TAB map      on the floor at the spot (diorama.js), under the pins (a label never covers one)
//     Two marks often share a spot: a jump to an Ink Jet / Zipline user comes down by their return mark, and two
//     teammates jumping to one teammate land a metre apart. Each view lays its tags out so none covers another, in the
//     order the marks appeared (an older tag keeps its place): the world view stacks a tag above any tag or teammate's
//     name tag it would cover; the minimap keeps one ring on a shared spot and stacks the names over it; the TAB map
//     puts a second disc beside the first and moves a label above / beside its disc when below it would cover a pin
//     (badge, key or name) or another tag.
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
}

// one tag (world / minimap / TAB map): a disc with the icon and the countdown ring, the name and seconds under it
function makeTag(cls) {
  const icon = h('i', { class: 'iw-jt__icon' }), name = h('b', { class: 'iw-jt__name' }), sec = h('em', { class: 'iw-jt__sec' });
  const lab = h('span', { class: 'iw-jt__tag' }, name, sec);
  const el = h('div', { class: 'iw-jt ' + cls }, h('span', { class: 'iw-jt__disc', html: RING }, icon), lab);
  el.style.display = 'none';
  return { el, icon, name, sec, lab, ring: el.querySelector('.f'), on: false, key: '', ko: '', st: '', tf: '', mark: null, named: false, foe: false,
    mKey: '', lw: 0, lh: 0, lx: '', ly: '', occl: false, merged: false, x: 0, y: 0 };
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
    this._wObs = new Boxes(); this._mRings = new Boxes(); this._mLabs = new Boxes();
    this._jal = { on: false, top: '', bot: '' };
  }

  update(dt, f) {
    const me = this.hud._local(), live = this.hud._live() && !this.hud.lab;
    const marks = live ? landingMarks() : [];
    this._world(marks, me, f && f.markers);
    this._alerts(dt, live && me && me.alive ? incomingJumps(me, this._in) : [], me);
    if (!f || !f.map) this._mapOff();
  }
  // the marks in the order they appeared: an older tag keeps its place, a newer one moves clear of it
  _sorted(marks) { const o = this._ord; o.length = 0; for (const r of marks) o.push(r); return o.sort(byBirth); }

  // ---- world view: a tag floating over each landing spot, sized by distance. Not your own jump (you're on your way
  // there) nor one coming down on you (the alert says it). A tag that would cover a teammate's name tag (a jump lands
  // 1.1 m from the teammate it's aimed at; markers: the HUD frame's ally tags, main.js) or an older tag (two jumps to one
  // teammate; a jump to an Ink Jet / Zipline user, by their return mark) stacks straight up above it.
  _world(marks, me, markers) {
    const cam = G.camera, W = innerWidth, H = innerHeight, u = uOf(W, H), g = JUMP_UI.gap;
    const obs = this._wObs.clear();
    if (markers) for (const q of markers) {
      if (!q.onScreen) continue;
      const mhw = 16 + String(q.name || '').length * 4.6;   // (.iw-mk__tag: the weapon icon + the name, 9 px over the anchor)
      obs.add(q.x - mhw, q.y - 34, q.x + mhw, q.y - 6);
    }
    let n = 0;
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
      measure(t, u.toFixed(2));
      const x = (_v.x * 0.5 + 0.5) * W, sc = clamp(1.15 - dist / 70, 0.55, 1);
      let y = (0.5 - _v.y * 0.5) * H;
      // the tag's box round its anchor (the disc's centre): the ring (and its beat), the label under it
      const d = (t.foe ? 2.2 : 2.7) * u, R = 0.83 * d;   // (the ring, as it beats)
      const hw = Math.max(R, t.lw / 2) * sc, top = R * sc, bot = (t.named ? 0.5 * d + 0.62 * u + t.lh : R) * sc;
      if (!occl) {
        for (let k = 0; k < 16; k++) { const o = obs.hit(x - hw, y - top, x + hw, y + bot, g, null); if (!o) break; y = o.t - g - bot; }
        obs.add(x - hw, y - top, x + hw, y + bot);
      }
      place(t, x, y, sc);
    }
    for (let i = n; i < this.worldTags.length; i++) show(this.worldTags[i], false);
  }

  /** hud._updMap → the minimap's tags at its current size (bw × bh px). */
  map(bw, bh) {
    const mm = G.game?.minimap, me = this.hud._local();
    const marks = this.hud._live() && !this.hud.lab && mm ? landingMarks() : [];
    const tc = this._tc || (this._tc = { x: 0, y: 0 });
    const u = uOf(), exp = this.hud.map.classList.contains('is-expanded'), g = 2;
    const d = (exp ? 2.4 : 1.5) * u, near = 0.72 * d, rr = 0.6 * d, nb = 0.66 * d;   // (.iw-jt.is-map: the ring, the name's bottom over it)
    const rings = this._mRings.clear(), labs = this._mLabs.clear();
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
      measure(t, `${u.toFixed(2)}|${exp ? 1 : 0}`);
      if (!t.lw) { setLabel(t, 0, 0); continue; }
      // the name over its ring, kept inside the map's frame; above an older name (or another spot's ring) it would
      // cover; under its ring if that runs off the top
      const l = bw > t.lw + 2 ? clamp(x - t.lw / 2, 1, bw - 1 - t.lw) : x - t.lw / 2, rgt = l + t.lw;
      let b = y - nb;
      for (let k = 0; k < 12; k++) {
        const o = labs.hit(l, b - t.lh, rgt, b, g, null) || rings.hit(l, b - t.lh, rgt, b, g, t);
        if (!o) break;
        b = o.t - g;
      }
      if (b - t.lh < 0) {
        b = y + rr + 1 + t.lh;
        for (let k = 0; k < 12; k++) {
          const o = labs.hit(l, b - t.lh, rgt, b, g, null) || rings.hit(l, b - t.lh, rgt, b, g, t);
          if (!o) break;
          b = o.b + g + t.lh;
        }
      }
      labs.add(l, b - t.lh, rgt, b);
      setLabel(t, l - (x - t.lw / 2), b - (y - nb));
    }
    for (let i = n; i < this.mapTags.length; i++) show(this.mapTags[i], false);
    this._mapOn = true;
  }
  _mapOff() { if (!this._mapOn) return; this._mapOn = false; for (const t of this.mapTags) show(t, false); }

  // ---- "NAME is jumping to you!" (only on the screen of the player being jumped to)
  _alerts(dt, inc, me) {
    const A = this.alerts;
    for (const al of A) al.live = false;
    for (const r of inc) {
      let al = A.find((x) => x.actor === r.actor && !x.out);
      if (!al) {
        if (A.filter((x) => !x.out).length >= JUMP_UI.alerts) continue;
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
    // the row's place (before .has-jal: the announcements below it read --jal-b)
    const on = A.length > 0;
    if (on) this._placeAlerts();
    if (on !== this._jal.on) { this._jal.on = on; this.hud.el.classList.toggle('has-jal', on); }
    void me;
  }
  // under the top bar at 10.2 u, or lower: under whatever hangs below it in this mode and the status badges (their boxes
  // as drawn this frame, the ones across the row's width)
  _placeAlerts() {
    const hud = this.hud, u = uOf(), J = this._jal;
    const r0 = hud.el.getBoundingClientRect(), cx = r0.left + r0.width / 2, half = 30 * u;
    let y = 10.2 * u;
    for (const el of this._furniture()) {
      const b = el.getBoundingClientRect();
      if (b.height < 1 || b.width < 1 || b.right < cx - half || b.left > cx + half) continue;
      y = Math.max(y, b.bottom - r0.top + 0.6 * u);
    }
    const top = y.toFixed(1) + 'px', bot = (y + 4.1 * u).toFixed(1) + 'px';   // (a pill: 3.8 u + its outline)
    if (top !== J.top) { J.top = top; this.aLayer.style.top = top; }
    if (bot !== J.bot) { J.bot = bot; hud.el.style.setProperty('--jal-b', bot); }
  }
  // what hangs at the top middle: the roster + timer, Zone Control's chip (overtime, zone shift), Tower Command's track
  // (overtime, status), Boss Battle's health bar and emblem, the TRACKED / POISONED badges, the LEAD tags
  _furniture() {
    const hud = this.hud, f = this._f || (this._f = []);
    f.length = 0;
    for (const el of [hud.top, hud.zo, hud.tw, hud.boss && hud.boss.bar, hud.boss && hud.boss.emb]) if (el) f.push(el);
    for (const el of hud.statusEl ? hud.statusEl.children : []) f.push(el);
    for (const el of hud.el.querySelectorAll('.iw-lead.is-on .iw-lead__tag')) f.push(el);
    return f;
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
const DIO = { pool: [], layer: null, of: null, cur: [], discs: new Boxes(), obs: new Boxes(), names: new WeakMap(), key: null };
export function dioJumpTags(dio, cam, W, H, me) {
  if (DIO.of !== dio) {
    DIO.of = dio; DIO.pool = [];
    DIO.layer = h('div', { class: 'iw-dio__jts' });
    const pins = dio.pins[0] && dio.pins[0].el.parentNode;
    // (under the pins: they're what you pick to jump, and a label never sits on one, so names on both stay readable)
    dio.el.insertBefore(DIO.layer, pins && pins.parentNode === dio.el ? pins : dio.cursor);
  }
  const m = G.match;
  const marks = m && !m.attract ? landingMarks() : [];
  const u = uOf(W, H), g = JUMP_UI.gap, scope = u.toFixed(2);
  // 1 · each disc on its spot; one that would sit on an older disc (two marks on one spot) goes beside it
  const discs = DIO.discs.clear(), cur = DIO.cur;
  cur.length = 0;
  const ord = DIO.ord || (DIO.ord = []);
  ord.length = 0; for (const r of marks) ord.push(r); ord.sort(byBirth);
  let n = 0;
  for (const r of ord) {
    _v.set(r.x, r.y + 0.08, r.z).project(cam);
    if (_v.z > 1) continue;
    const t = grab(DIO.pool, DIO.layer, 'is-dio', n++);
    fillTag(t, r, me);
    show(t, true);
    measure(t, scope);
    const x0 = (_v.x * 0.5 + 0.5) * W, y = (0.5 - _v.y * 0.5) * H;
    const d = (t.foe ? 1.7 : 2.1) * u, R = 0.83 * d, D = 2 * R + 0.35 * u;   // (R: the ring, as it beats)
    let x = x0;
    for (const k of [0, 1, -1, 2, -2]) { x = x0 + k * D; if (!discs.hit(x - R, y - R, x + R, y + R, g, null)) break; }
    t.d = d; t.R = R;
    discs.add(x - R, y - R, x + R, y + R, t);
    place(t, x, y, 0);
    cur.push(t);
  }
  for (let i = n; i < DIO.pool.length; i++) show(DIO.pool[i], false);
  // 2 · each name label where it covers no pin (its badge, key or name) and no other tag: the first free place, nearest
  // first — under its disc, nudged sideways, over it, beside it, then a row further out; where every place covers
  // something, the one that covers least
  const obs = DIO.obs.clear();
  if (cur.some((t) => t.named)) pinBoxes(dio, u, obs);
  for (const t of cur) {
    if (!t.named) { setLabel(t, 0, 0); continue; }
    const { x, y, R, d, lw, lh } = t, s = 0.25 * u;
    const l0 = x - lw / 2, t0 = y + 0.5 * d + 0.55 * u;   // (.iw-jt.is-dio .iw-jt__tag: under the disc)
    const up = y - R - s - lh, dn2 = t0 + lh + g, up2 = up - lh - g, mid = y - lh / 2, h2 = lw / 2, far = lw / 2 + R;
    let bl = l0, bt = t0, best = Infinity;
    for (const [dx, tp] of [[0, t0], [h2, t0], [-h2, t0], [0, up], [lw / 2 + R + s, mid], [-(lw / 2 + R + s), mid], [h2, up], [-h2, up],
      [far, t0], [-far, t0], [far, up], [-far, up], [0, dn2], [h2, dn2], [-h2, dn2], [0, up2], [h2, up2], [-h2, up2]]) {
      const l = l0 + dx;
      let c = obs.cover(l - 2, tp - 2, l + lw + 2, tp + lh + 2, null) + discs.cover(l - 2, tp - 2, l + lw + 2, tp + lh + 2, t);
      if (l < 0 || tp < 0 || l + lw > W || tp + lh > H) c += lw * lh;
      if (c < best - 0.5) { best = c; bl = l; bt = tp; if (c <= 0) break; }
    }
    obs.add(bl, bt, bl + lw, bt + lh);
    setLabel(t, bl - l0, bt - t0);
  }
}
// the TAB map's pins as boxes (diorama.js _pin, styles/hud.css .iw-pin: the badge on its 2.2 u stem, the key at its
// top right, the name over it)
function pinBoxes(dio, u, out) {
  const st = 2.2 * u, planning = dio.el.classList.contains('is-planning');
  for (const p of dio.pins) {
    if (!p.vis) continue;
    const c = p.el.classList, self = c.contains('iw-pin--self');
    if (self && planning) continue;
    const s = (self ? 3.3 : c.contains('iw-pin--home') ? 2.5 : 2.9) * u * (c.contains('is-hover') ? 1.22 : 1), x = p.x, y = p.y, o = (self ? 0.42 : 0.36) * u;
    out.add(x - s / 2 - o, y - st - s - o, x + s / 2 + o, y - st + o);   // (with its white + dark outline)
    if (!self) {
      let kw = DIO.key;
      if (!kw || kw.u !== u) { const ke = p.el.querySelector('.iw-pin__key'); kw = DIO.key = { u, w: ke ? ke.offsetWidth : 0, h: ke ? ke.offsetHeight : 0 }; }
      if (kw.w) out.add(x + 0.34 * s, y - st - 0.62 * s - kw.h, x + 0.34 * s + kw.w, y - st - 0.62 * s);
    }
    const txt = p.name.textContent, sz = DIO.names.get(p.el);
    let nm = sz;
    if (!nm || nm.txt !== txt || nm.u !== u) DIO.names.set(p.el, (nm = { txt, u, w: p.name.offsetWidth, h: p.name.offsetHeight }));
    if (nm.w) out.add(x - nm.w / 2, y - st - s - 0.45 * u - nm.h, x + nm.w / 2, y - st - s - 0.45 * u);
  }
}
