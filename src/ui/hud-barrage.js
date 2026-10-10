// INKWAVE — the Mystery Bomb Barrage's NEXT card [b5-sprules]. The HUD owns one (`hud.barrage = new BarrageHud(hud)`,
// driven by hud.update(dt, frame)); the special is src/game/sp-barrage.js.
//
// While your Mystery Bomb Barrage runs, a card by the crosshair (lower right of it, opposite the sub-aim chip) shows the
// bomb your next throw will be: NEXT, its icon in your ink, its name. Every throw draws a new one and the card shows it
// in that same frame — the new icon drops into the window like a reel stopping, with a pop and a flash — so it reads
// long before the next throw is allowed (the shortest wait, a Pop Pellet's, is 0.2 s; fix round 1: the card used to
// spin through other bombs for 0.3 s first, still spinning when the next throw was already allowed). The bomb in your
// hand, the sub badge on the special gauge and the hint line change with it. It reads the local player's running special directly (as the sub
// badge does from the frame); nothing on the wire (every screen draws its own player's). Other barrages: no card (their
// bomb never changes).
import { h } from './ui-util.js';
import { G } from '../core/ctx.js';
import { SUB_ICONS, SPECIAL_ICONS } from './ui-icons.js';


export class BarrageHud {
  constructor(hud) {
    this.hud = hud;
    this.icon = h('i', { class: 'iw-bnext__i', html: SPECIAL_ICONS.mystery_bomb || SUB_ICONS.bomb });
    this.name = h('b', { class: 'iw-bnext__n' }, '');
    this.el = h('div', { class: 'iw-bnext' }, h('small', null, 'NEXT'), h('span', { class: 'iw-bnext__w' }, this.icon), this.name);
    (hud.xh || hud.el).appendChild(this.el);
    this.on = false; this.nb = -1; this.kind = null; this.shown = null; this.draws = 0;
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
    if (on !== this.on) { this.on = on; this.el.classList.toggle('is-on', on); if (!on) this.nb = -1; }
    if (!s || s.nb === this.nb) return;
    const first = this.nb < 0;
    this.nb = s.nb; this.kind = s.bomb.kind;
    this.name.textContent = s.bomb.name;
    this.el.dataset.kind = this.kind;
    this._show(this.kind);
    if (first) return;
    // a new draw: the icon drops in (a reel stopping) and the card pops — the bomb itself is already the right one
    this.draws++;
    for (const [e, c] of [[this.icon, 'is-drop'], [this.el, 'is-land']]) { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); }
  }
  // tests: what the card shows (kind / name: the icon and the name on it now; popped: draws marked with the drop + pop)
  state() { return { on: this.on, kind: this.shown, name: this.name.textContent, popped: this.draws, visible: this.on && getComputedStyle(this.el).opacity > 0.5 }; }
}
