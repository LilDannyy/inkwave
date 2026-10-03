// INKWAVE — the Mystery Bomb Barrage's NEXT card [b5-sprules]. The HUD owns one (`hud.barrage = new BarrageHud(hud)`,
// driven by hud.update(dt, frame)); the special is src/game/sp-barrage.js.
//
// While your Mystery Bomb Barrage runs, a card by the crosshair (lower right of it, opposite the sub-aim chip) shows the
// bomb your next throw will be: NEXT, its icon in your ink, its name. Every throw draws a new one: the card spins
// through a few bombs like a slot reel (~0.3 s) and lands on it with a pop — the bomb in your hand, the sub badge on the
// special gauge and the hint line change with it. It reads the local player's running special directly (as the sub
// badge does from the frame); nothing on the wire (every screen draws its own player's). Other barrages: no card (their
// bomb never changes).
import { h } from './ui-util.js';
import { G } from '../core/ctx.js';
import { SUB_ICONS, SPECIAL_ICONS } from './ui-icons.js';

const SPIN = 0.3, TICK = 0.055;   // s the reel spins after a draw; s per bomb flashing past in it

export class BarrageHud {
  constructor(hud) {
    this.hud = hud;
    this.icon = h('i', { class: 'iw-bnext__i', html: SPECIAL_ICONS.mystery_bomb || SUB_ICONS.bomb });
    this.name = h('b', { class: 'iw-bnext__n' }, '');
    this.el = h('div', { class: 'iw-bnext' }, h('small', null, 'NEXT'), h('span', { class: 'iw-bnext__w' }, this.icon), this.name);
    (hud.xh || hud.el).appendChild(this.el);
    this.on = false; this.nb = -1; this.kind = null; this.spinT = 0; this.tickT = 0; this.shown = null;
  }
  // the local player's running Mystery Bomb Barrage (null: none)
  _special() {
    const a = this.hud._local?.() || G.match?.local;
    const s = a && a.alive && a.specialActive;
    return s && s.kind === 'barrage' && s.def?.mystery && s.bomb ? s : null;
  }
  _show(kind) {
    if (kind === this.shown) return;
    this.shown = kind;
    this.icon.innerHTML = SUB_ICONS[kind] || SUB_ICONS.bomb;
  }
  update(dt) {
    const s = this._special();
    const on = !!s;
    if (on !== this.on) { this.on = on; this.el.classList.toggle('is-on', on); if (!on) { this.nb = -1; this.spinT = 0; } }
    if (!s) return;
    if (s.nb !== this.nb) {
      const first = this.nb < 0;
      this.nb = s.nb; this.kind = s.bomb.kind;
      this.name.textContent = s.bomb.name;
      this.el.dataset.kind = this.kind;
      if (first) this._show(this.kind);
      else { this.spinT = SPIN; this.tickT = 0; this.el.classList.add('is-spin'); }
    }
    if (this.spinT > 0) {
      this.spinT -= dt; this.tickT -= dt;
      if (this.spinT <= 0) {
        this.el.classList.remove('is-spin');
        this._show(this.kind);
        this.el.classList.remove('is-land'); void this.el.offsetWidth; this.el.classList.add('is-land');
      } else if (this.tickT <= 0) {
        // (a bomb flashing past: any but the one it'll land on)
        this.tickT = TICK;
        const L = s.def.mystery.filter((k) => k !== this.kind && k !== this.shown);
        this._show(L[(Math.random() * L.length) | 0] || this.kind);
        this.icon.classList.remove('is-tick'); void this.icon.offsetWidth; this.icon.classList.add('is-tick');
      }
    }
  }
  // tests: what the card shows
  state() { return { on: this.on, kind: this.shown, name: this.name.textContent, spinning: this.spinT > 0, landing: this.kind, visible: this.on && getComputedStyle(this.el).opacity > 0.5 }; }
}
