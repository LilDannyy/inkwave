// INKWAVE — super-jump landings and Ink Jet / Zipline return points on screen (b5-jumpui, 2026-10-04). The HUD owns one:
// `hud.jumps = new JumpHud(hud)`, driven by hud.update(dt, frame). The minimap part is placed from hud._updMap (map()),
// and the TAB map's part from diorama.js (dioJumpTags). Every view reads the same list, game/jumpMarks.js landingMarks().
//
// The user asked for "an on screen alert when a teammate is jumping to you and their name, as well as a name around
// the super jump icon, and an indicator for when they're landing"; and, for Zipline / Ink Jet, "an indicator when they
// start using the special so players know where they'd super jump to, and where the player will jump back when it ends".
//   · The alert (only on the screen of the player being jumped to): a pill under the top bar with the jumper's name,
//     "is jumping to you!", the jump icon in a ring that drains to touchdown, and the seconds left. A chime plays
//     (sj_incoming). It goes when they land, or when the jump is called off. Up to three stack.
//   · A tag on every landing mark. It shows the mark's icon in a disc: the super-jump glyph, or for a return mark the
//     special's own icon. Round the disc runs a countdown ring in the jumper's ink, full when the mark appears and empty
//     at touchdown. Under the disc are the name and the seconds left. A return mark's ring runs through the special's
//     time left, then the flight home.
//       world view   floating over the spot, through walls, smaller with distance, stacked above a teammate's name
//                    tag it would cover (not your own jump, nor one coming down on you: the alert has it). On a
//                    return beacon it stands in for the beacon's own floating icon badge (hidden; ring + pillar stay)
//       minimap      on the spot over the map's own landing ring / return badge (the corner map and the strike map)
//       TAB map      on the floor at the spot (diorama.js), drawn over the teammates' pins: a jump comes down by
//                    its target's pin, and under it the label (the name, the seconds) would be lost
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
  alerts: 3,          // most "jumping to you" alerts at once
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

const _v = new THREE.Vector3();
const hexOf = (t) => toHex(G.teamHex?.[t], t ? '#2f5bff' : '#ff8a14');
const secs = (s) => (s >= 9.95 ? String(Math.ceil(s)) : Math.max(0, s).toFixed(1));

// one tag (world / minimap / TAB map): a disc with the icon and the countdown ring, the name and seconds under it
function makeTag(cls) {
  const icon = h('i', { class: 'iw-jt__icon' }), name = h('b', { class: 'iw-jt__name' }), sec = h('em', { class: 'iw-jt__sec' });
  const el = h('div', { class: 'iw-jt ' + cls }, h('span', { class: 'iw-jt__disc', html: RING }, icon), h('span', { class: 'iw-jt__tag' }, name, sec));
  el.style.display = 'none';
  return { el, icon, name, sec, ring: el.querySelector('.f'), on: false, key: '', ko: '', st: '', tf: '', mark: null };
}
// fill a tag from a mark (dirty-checked)
function fillTag(t, r, me) {
  const team = me ? me.team : 0, own = r.team === team;
  const named = !!(r.actor && r.actor !== me && (own || JUMP_UI.foeNames));
  const key = `${r.kind}|${r.icon}|${r.team}|${named ? r.actor.name : ''}|${own ? 1 : 0}|${r.actor === me ? 1 : 0}`;
  if (key !== t.key) {
    t.key = key;
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
    this._in = [];
    this._mapOn = false;
  }

  update(dt, f) {
    const me = this.hud._local(), live = this.hud._live() && !this.hud.lab;
    const marks = live ? landingMarks() : [];
    this._world(marks, me, f && f.markers);
    this._alerts(dt, live && me && me.alive ? incomingJumps(me, this._in) : [], me);
    if (!f || !f.map) this._mapOff();
  }

  // ---- world view: a tag floating over each landing spot (through walls), sized by distance. Not your own jump (you're
  // on your way there) nor one coming down on you (the alert says it). A jump lands 1.1 m from the teammate it's aimed
  // at, so its tag would sit on that teammate's name tag: it stacks above any ally tag it would cover (markers: the
  // HUD frame's ally tags, main.js).
  _world(marks, me, markers) {
    const cam = G.camera, W = innerWidth, H = innerHeight, u = Math.min(W / 100, (H * 1.7778) / 100);
    let n = 0;
    if (cam) for (const r of marks) {
      // a return beacon's own floating icon badge (specials.js ReturnMarker) would sit doubled behind this tag's disc:
      // the tag takes its place (seen through walls, with the name and the countdown); its ring and light pillar stay
      if (r.kind === 'return' && r.key.badge && r.key.badge.visible) r.key.badge.visible = false;
      if (r.kind === 'jump' && (r.actor === me || (me && r.target === me))) continue;
      _v.set(r.x, r.y + JUMP_UI.lift, r.z);
      const dist = _v.distanceTo(cam.position);
      _v.project(cam);
      if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
      const t = grab(this.worldTags, this.wLayer, 'is-world', n++);
      fillTag(t, r, me);
      const x = (_v.x * 0.5 + 0.5) * W, sc = clamp(1.15 - dist / 70, 0.55, 1);
      let y = (0.5 - _v.y * 0.5) * H;
      if (markers) {
        const named = t.el.classList.contains('is-named'), top = 2.1 * u * sc, bot = (named ? 3.7 : 2.1) * u * sc, hw = (named ? 3.8 : 2.1) * u * sc;
        for (const q of markers) {
          if (!q.onScreen) continue;
          const mhw = 16 + String(q.name || '').length * 4.6;   // (.iw-mk__tag: the weapon icon + the name, 9 px over the anchor)
          if (Math.abs(x - q.x) < hw + mhw && y + bot > q.y - 34 && y - top < q.y - 6) y = q.y - 34 - bot - 3;
        }
      }
      const tf = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      if (tf !== t.tf) { t.tf = tf; t.el.style.transform = tf; }
      show(t, true);
    }
    for (let i = n; i < this.worldTags.length; i++) show(this.worldTags[i], false);
  }

  /** hud._updMap → the minimap's tags at its current size (bw × bh px). */
  map(bw, bh) {
    const mm = G.game?.minimap, me = this.hud._local();
    const marks = this.hud._live() && !this.hud.lab && mm ? landingMarks() : [];
    const tc = this._tc || (this._tc = { x: 0, y: 0 });
    let n = 0;
    for (const r of marks) {
      mm.toCanvas(r.x, r.z, tc);
      const t = grab(this.mapTags, this.mLayer, 'is-map', n++);
      fillTag(t, r, me);
      const x = clamp(tc.x / mm.w) * bw, y = clamp(tc.y / mm.h) * bh;
      const tf = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      if (tf !== t.tf) { t.tf = tf; t.el.style.transform = tf; }
      show(t, true);
      // the name over the ring, kept inside the map's frame (its width read once per name)
      if (t.nwKey !== t.key) { t.nwKey = t.key; t.nw = t.name.textContent ? t.name.parentNode.offsetWidth : 0; }
      const lx = t.nw && bw > t.nw + 2 ? clamp(x - t.nw / 2, 1, bw - 1 - t.nw) - (x - t.nw / 2) : 0, lk = lx.toFixed(1);
      if (lk !== t.lx) { t.lx = lk; t.el.style.setProperty('--lx', lk + 'px'); }
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
    void me;
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
    const tags = (pool) => pool.filter((t) => t.on && t.mark).map((t) => ({ kind: t.mark.kind, actor: t.mark.actor.name, team: t.mark.team, name: t.name.textContent, sec: +t.st, k: t.mark.total > 0 ? t.mark.left / t.mark.total : 0, tf: t.tf }));
    return { alerts: this.alerts.filter((x) => !x.out).map((x) => ({ name: x.actor.name, sec: +x.st })), world: tags(this.worldTags), map: tags(this.mapTags), dio: tags(DIO.pool) };
  }
}

// ---- the TAB map (diorama.js update → dioJumpTags): a pin on each landing spot, the same tag
const DIO = { pool: [], layer: null, of: null };
export function dioJumpTags(dio, cam, W, H, me) {
  if (DIO.of !== dio) {
    DIO.of = dio; DIO.pool = [];
    DIO.layer = h('div', { class: 'iw-dio__jts' });
    const pins = dio.pins[0] && dio.pins[0].el.parentNode;
    dio.el.insertBefore(DIO.layer, pins && pins.parentNode === dio.el ? pins.nextSibling : dio.cursor);   // (over the pins, under the cursor)
  }
  const m = G.match;
  const marks = m && !m.attract ? landingMarks() : [];
  let n = 0;
  for (const r of marks) {
    _v.set(r.x, r.y + 0.08, r.z).project(cam);
    if (_v.z > 1) continue;
    const t = grab(DIO.pool, DIO.layer, 'is-dio', n++);
    fillTag(t, r, me);
    const tf = `translate3d(${((_v.x * 0.5 + 0.5) * W).toFixed(1)}px,${((0.5 - _v.y * 0.5) * H).toFixed(1)}px,0)`;
    if (tf !== t.tf) { t.tf = tf; t.el.style.transform = tf; }
    show(t, true);
  }
  for (let i = n; i < DIO.pool.length; i++) show(DIO.pool[i], false);
}
