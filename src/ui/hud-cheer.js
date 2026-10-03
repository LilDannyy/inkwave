// [b5-zipcheer] INKWAVE — the Cheer Orb on the HUD. The HUD owns one: `hud.cheer = new CheerHud(hud)`, driven by
// hud.update(dt, frame). The game side is src/game/sp-cheer.js (G.cheerOrb).
//
//   the prompt   while a TEAMMATE of yours (never you, never the other team) is charging a Cheer Orb, a big pill at the
//                bottom middle of the screen: the cheer key as a big keycap (C, or the d-pad's up arrow once you're on a
//                pad), "CHEER!", whose orb it is and a bar with its charge. It pulses to catch the eye, jumps when you
//                cheer (a cheer that helps lights it up), reads CHARGED! once the orb is full, and goes when the orb is
//                thrown. Off while the map is open, while you're splatted, outside play.
//   the wisp     a cheer that tops up your gauge sends a wisp of energy from you on screen up into your special gauge
//                (top right) along a curve; it lands as the gauge gains (sp-cheer.js applies the gain at that moment): a
//                ring bursts round the gauge and a "+4%" pops beside it.
// hud.cheer.state() reports what's showing (tests: tools/botlab/tests/zipcheer.js).
import { h } from './ui-util.js';
import { G, on } from '../core/ctx.js';
import { specialIcon } from './ui-icons.js';

const CSS = `
.iw-cheerp { position: absolute; left: 50%; bottom: calc(var(--u) * 5.2); translate: -50% 0; display: flex; align-items: center; gap: calc(var(--u) * 1);
  padding: calc(var(--u) * .62) calc(var(--u) * 1.7) calc(var(--u) * .62) calc(var(--u) * .62); border-radius: calc(var(--u) * 3);
  background: rgba(14, 11, 22, .9); box-shadow: inset 0 0 0 calc(var(--u) * .22) var(--self), 0 0 calc(var(--u) * 1.6) rgba(var(--self-rgb), .55), 0 calc(var(--u) * .3) 0 rgba(0, 0, 0, .4);
  color: #fff; font: 800 calc(var(--u) * 1.05) / 1 'Rubik', sans-serif; white-space: nowrap; pointer-events: none;
  opacity: 0; scale: .6; transition: opacity .18s, scale .35s cubic-bezier(.34, 1.8, .64, 1), translate .3s cubic-bezier(.2, .8, .3, 1); }
.iw-cheerp.is-on { opacity: 1; scale: 1; animation: iw-cheerp-pulse 1.1s ease-in-out infinite; }
@keyframes iw-cheerp-pulse { 50% { box-shadow: inset 0 0 0 calc(var(--u) * .22) var(--self-light), 0 0 calc(var(--u) * 2.6) rgba(var(--self-rgb), .85), 0 calc(var(--u) * .3) 0 rgba(0, 0, 0, .4); } }
.iw-cheerp__key { position: relative; display: grid; place-items: center; width: calc(var(--u) * 3.5); height: calc(var(--u) * 3.5); border-radius: calc(var(--u) * .9);
  background: #fff; color: #15121c; font: 900 calc(var(--u) * 2.3) / 1 'Rubik', sans-serif; box-shadow: 0 calc(var(--u) * .34) 0 var(--self-dark), 0 0 0 calc(var(--u) * .16) #15121c;
  translate: 0 calc(var(--u) * -.17); }
.iw-cheerp__key svg { width: 76%; height: 76%; }
.iw-cheerp.is-on .iw-cheerp__key { animation: iw-cheerp-key 1.1s ease-in-out infinite; }
@keyframes iw-cheerp-key { 0%, 70%, 100% { translate: 0 calc(var(--u) * -.17); box-shadow: 0 calc(var(--u) * .34) 0 var(--self-dark), 0 0 0 calc(var(--u) * .16) #15121c; }
  80% { translate: 0 calc(var(--u) * .1); box-shadow: 0 calc(var(--u) * .07) 0 var(--self-dark), 0 0 0 calc(var(--u) * .16) #15121c; } }
.iw-cheerp__body { display: flex; flex-direction: column; gap: calc(var(--u) * .38); min-width: calc(var(--u) * 13); }
.iw-cheerp__t { font-family: 'Titan One', 'Rubik', sans-serif; font-weight: 400; font-size: calc(var(--u) * 2.5); letter-spacing: .03em; color: #fff;
  -webkit-text-stroke: .16em #15121c; paint-order: stroke fill; text-shadow: 0 .08em 0 #15121c; }
.iw-cheerp__s { display: flex; align-items: center; gap: .4em; font-size: calc(var(--u) * .95); letter-spacing: .1em; color: var(--self-light); text-transform: uppercase; }
.iw-cheerp__s i { display: inline-block; width: 1.5em; height: 1.5em; color: var(--self); }
.iw-cheerp__s i svg { width: 100%; height: 100%; }
.iw-cheerp__bar { position: relative; height: calc(var(--u) * .62); border-radius: 99px; background: rgba(255, 255, 255, .14); overflow: hidden; box-shadow: 0 0 0 1.5px rgba(0, 0, 0, .5); }
.iw-cheerp__bar i { position: absolute; inset: 0; transform-origin: left center; transform: scaleX(var(--p, 0)); border-radius: inherit;
  background: linear-gradient(180deg, #fff 0%, var(--self-light) 45%, var(--self) 100%); transition: transform .2s ease-out; }
.iw-cheerp.is-hit { animation: iw-cheerp-hit .38s cubic-bezier(.34, 1.8, .64, 1); }
@keyframes iw-cheerp-hit { 0% { scale: 1.16; filter: brightness(1.6); } 100% { scale: 1; filter: none; } }
.iw-cheerp.is-hit .iw-cheerp__key { animation: none; translate: 0 calc(var(--u) * .12); box-shadow: 0 calc(var(--u) * .05) 0 var(--self-dark), 0 0 0 calc(var(--u) * .16) #15121c; }
.iw-cheerp.is-full .iw-cheerp__key { background: #c9c4d6; }
.iw-cheerp.is-full .iw-cheerp__t { color: var(--self-light); }
.iw-hud.is-mapopen .iw-cheerp, body.iw-dio-on .iw-cheerp { opacity: 0; transition: opacity .12s; }
.iw-hud.has-cards .iw-cheerp { translate: -50% calc(var(--u) * -3.4); }
.iw-cwisp { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; display: none; }
.iw-cwisp.is-on { display: block; }
.iw-cwisp i { position: absolute; left: 0; top: 0; width: calc(var(--u) * 2.2); height: calc(var(--u) * 2.2); margin: calc(var(--u) * -1.1) 0 0 calc(var(--u) * -1.1); border-radius: 50%;
  background: radial-gradient(circle, #fff 0 24%, var(--self-light) 40%, rgba(var(--self-rgb), .7) 58%, rgba(var(--self-rgb), 0) 72%); will-change: transform; }
.iw-cwisp i:first-child { width: calc(var(--u) * 3.8); height: calc(var(--u) * 3.8); margin: calc(var(--u) * -1.9) 0 0 calc(var(--u) * -1.9);
  box-shadow: 0 0 calc(var(--u) * 1.8) rgba(var(--self-rgb), .95), 0 0 calc(var(--u) * .5) #fff; background: radial-gradient(circle, #fff 0 30%, var(--self-light) 44%, rgba(var(--self-rgb), .85) 60%, rgba(var(--self-rgb), 0) 72%); }
.iw-cgain { position: absolute; left: 0; top: 0; pointer-events: none; display: none; }
.iw-cgain.is-on { display: block; }
.iw-cgain b { position: absolute; left: 0; top: 0; translate: -50% -50%; padding: .3em .6em .32em; border-radius: 99px; background: #fff; color: #15121c;
  font: 900 calc(var(--u) * 1.15) / 1 'Rubik', sans-serif; box-shadow: 0 0 0 2px var(--self), 0 0 calc(var(--u) * 1) rgba(var(--self-rgb), .9); }
.iw-cgain i { position: absolute; left: 0; top: 0; width: calc(var(--u) * 7.8); height: calc(var(--u) * 7.8); translate: -50% -50%; border-radius: 50%;
  border: calc(var(--u) * .4) solid var(--self-light); box-shadow: 0 0 calc(var(--u) * 1.2) rgba(var(--self-rgb), .9); }
.iw-cgain.is-on b { animation: iw-cgain-up .9s cubic-bezier(.2, .8, .3, 1) both; }
.iw-cgain.is-on i { animation: iw-cgain-ring .55s ease-out both; }
@keyframes iw-cgain-up { 0% { opacity: 0; transform: translateY(calc(var(--u) * 1.2)) scale(.6); } 18% { opacity: 1; transform: none; } 75% { opacity: 1; } 100% { opacity: 0; transform: translateY(calc(var(--u) * -1.6)); } }
@keyframes iw-cgain-ring { 0% { opacity: 1; scale: .55; } 100% { opacity: 0; scale: 1.45; border-width: 1px; } }
@media (prefers-reduced-motion: reduce) { .iw-cheerp.is-on, .iw-cheerp.is-on .iw-cheerp__key { animation: none; } }
`;
const TRAIL = 8;
// the d-pad, its up arm lit (a pad's cheer button)
const DPAD_UP = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" fill="#9b95aa" stroke="#15121c" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 3 H15 V9.5 H9 Z" fill="var(--self)" stroke="#15121c" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 4.6 L14 7.4 H10 Z" fill="#fff"/></svg>`;

export class CheerHud {
  constructor(hud) {
    this.hud = hud;
    if (!document.getElementById('iw-cheer-css')) { const css = document.createElement('style'); css.id = 'iw-cheer-css'; css.textContent = CSS; document.head.appendChild(css); }
    this.key = h('span', { class: 'iw-cheerp__key' }, 'C');
    this.title = h('b', { class: 'iw-cheerp__t' }, 'CHEER!');
    this.whose = h('span', null, '');
    this.barI = h('i');
    this.el = h('div', { class: 'iw-cheerp' }, this.key,
      h('span', { class: 'iw-cheerp__body' }, this.title, h('small', { class: 'iw-cheerp__s' }, h('i', { html: specialIcon('booyah') }), this.whose), h('span', { class: 'iw-cheerp__bar' }, this.barI)));
    this.wisps = Array.from({ length: 4 }, () => h('div', { class: 'iw-cwisp' }, Array.from({ length: TRAIL }, () => h('i'))));
    this.gainEl = h('div', { class: 'iw-cgain' }, h('i'), h('b', null, '+4%'));
    hud.el.append(this.el, ...this.wisps, this.gainEl);
    this.el.addEventListener('animationend', (e) => { if (e.animationName === 'iw-cheerp-hit') this.el.classList.remove('is-hit'); });
    this.L = { on: false, name: '', full: null, pad: null, p: -1 };
    this._calls = [];
    this._start = new Map();   // gauge wisp id → its start on screen
    this.st = { on: false, name: null, charge: 0, full: false, key: 'C', wisps: 0, gains: 0, lastGain: null };
    on('actor:cheer', (e) => { if (e.actor && e.actor === this.hud._local() && !e.remote && this.L.on) this._restart(this.el, 'is-hit'); });
    on('cheer:gain', (e) => { if (e.actor && e.actor === this.hud._local()) this._gain(e.frac); });
  }

  _restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  update(dt, f) {
    const me = this.hud._local(), m = G.match, L = this.L, st = this.st;
    // ---- the prompt
    let show = false, call = null;
    if (me && me.alive && m && m.state === 'playing' && G.cheerOrb && !this.hud.lab) {
      const calls = G.cheerOrb.calls(me, this._calls);
      // (the least charged first: the one a cheer helps most)
      for (const c of calls) if (!call || (c.s.charge || 0) < (call.s.charge || 0)) call = c;
      show = !!call;
    }
    if (show !== L.on) { L.on = show; this.el.classList.toggle('is-on', show); if (!show) this.el.classList.remove('is-hit'); }
    st.on = show;
    if (show) {
      const o = call.actor, s = call.s, ch = Math.max(0, Math.min(1, s.charge || 0)), full = ch >= 0.999;
      const name = `${o.name || 'Teammate'}'s Cheer Orb`;
      if (name !== L.name) { L.name = name; this.whose.textContent = name; }
      if (full !== L.full) { L.full = full; this.el.classList.toggle('is-full', full); this.title.textContent = full ? 'CHARGED!' : 'CHEER!'; }
      if (Math.abs(ch - L.p) > 0.004) { L.p = ch; this.barI.style.setProperty('--p', ch.toFixed(3)); }
      const pad = G.input?.lastDevice === 'pad';
      if (pad !== L.pad) { L.pad = pad; if (pad) this.key.innerHTML = DPAD_UP; else this.key.textContent = 'C'; }
      st.name = o.name; st.charge = ch; st.full = full; st.key = pad ? 'dpad-up' : 'C';
    } else { st.name = null; st.charge = 0; st.full = false; }
    // ---- the gauge wisps (the local player's, in flight)
    const list = G.cheerOrb ? G.cheerOrb.gauge : [];
    let n = 0, hr = null;   // (the HUD's box: read only while a wisp of ours flies — no layout read every frame)
    for (const w of list) {
      if (n >= this.wisps.length || !me || w.owner !== me) continue;
      hr = hr || this.hud.el.getBoundingClientRect();
      let s0 = this._start.get(w.id);
      if (!s0) { s0 = this._from(me, hr); this._start.set(w.id, s0); }
      const sp = this.hud.sp.getBoundingClientRect(), ex = sp.left + sp.width / 2 - hr.left, ey = sp.top + sp.height / 2 - hr.top;
      const k = Math.max(0, Math.min(1, w.t / w.dur));
      const el = this.wisps[n++];
      el.classList.add('is-on');
      const kids = el.children;
      for (let i = 0; i < TRAIL; i++) {
        const kk = Math.max(0, k - i * 0.04), e = kk * kk * (3 - 2 * kk);
        // up first, then across into the gauge (a quadratic curve through (start x, gauge y)), with a little sway
        const cx = s0.x + (ex - s0.x) * 0.12, cy = ey + (s0.y - ey) * 0.08, u = 1 - e;
        const x = u * u * s0.x + 2 * u * e * cx + e * e * ex + Math.sin(kk * 9 + w.id) * 10 * (1 - kk);
        const y = u * u * s0.y + 2 * u * e * cy + e * e * ey;
        const sc = (1 - i / TRAIL) * (0.75 + 0.25 * Math.sin(kk * 30));
        kids[i].style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
        kids[i].style.opacity = (k > 0.97 ? 1 - (k - 0.97) / 0.03 : 1) * (1 - i / (TRAIL + 1)) + '';
      }
    }
    for (let i = n; i < this.wisps.length; i++) this.wisps[i].classList.remove('is-on');
    if (this._start.size > 8) for (const id of [...this._start.keys()]) if (!list.some((w) => w.id === id)) this._start.delete(id);
    st.wisps = n;
    void dt; void f;
  }
  // where the local player is on screen (its chest), relative to the HUD
  _from(me, hr) {
    const cam = G.camera, W = hr.width || innerWidth, H = hr.height || innerHeight;
    if (!cam || !me.pos) return { x: W / 2, y: H * 0.62 };
    const v = cam.position.clone().set(me.pos.x, me.pos.y + 1.0, me.pos.z).project(cam);
    if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) return { x: W / 2, y: H * 0.62 };
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
  }
  // the wisp landed: a ring round the gauge, "+4%" beside it
  _gain(frac) {
    const hr = this.hud.el.getBoundingClientRect(), sp = this.hud.sp.getBoundingClientRect();
    const x = sp.left + sp.width / 2 - hr.left, y = sp.top + sp.height / 2 - hr.top;
    this.gainEl.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    this.gainEl.lastChild.textContent = `+${Math.max(1, Math.round((frac || 0) * 100))}%`;
    this.gainEl.lastChild.style.left = `${(-sp.width * 0.95).toFixed(0)}px`;
    this.gainEl.lastChild.style.top = `${(sp.height * 0.45).toFixed(0)}px`;
    this._restart(this.gainEl, 'is-on');
    this.st.gains++; this.st.lastGain = { frac, t: performance.now() };
  }
  state() { return { ...this.st }; }
}
