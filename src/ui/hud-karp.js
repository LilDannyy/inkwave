// [b5-karp] Bazookarp on the HUD — the WP1 PLACEHOLDER (WP2, karp-face, builds the finished one: SPEC §6.1–6.5). The
// HUD owns one: hud.karp = new KarpHud(hud), driven by hud.update(dt, frame) with frame.karp (bazookarp.js state()).
//   the counts        Zone Control's badges (.iw-zc): your team's count left, 100 → 0, a carp mark on the team holding
//   the status line   under the clock: CARRIER 42 s ×3 · SHELL 62% THEM · FREE · BACK TO THE POND · OVERTIME 7
//   the marker        the carp glyph + the fuse's whole seconds over the carrier's head, for both teams — hidden from the
//                     enemy while the carrier swims (S31); off screen: pinned to the edge with an arrow and the distance
//   the bottom line   DON'T RETREAT! / BAZOOKARP-FREE ZONE! on the carrier's own screen, the moment its rate changes
//   call-outs         hud._zCall on the events (shell burst, pick-ups, weirs, the Carp Blast, overtime)
//   "Can't use"       a carrier's sub / special press (sub:cantuse kind 'karp'): "Can't use your kit while carrying"
// hud.karp.state() reports what is showing (tests).
import { h } from './ui-util.js';
import { G, on } from '../core/ctx.js';
import { SPECIAL_ICONS } from './ui-icons.js';

export const KARP_GLYPH = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16 Q11 7 21 10 Q26 12 28 16 Q26 20 21 22 Q11 25 4 16 Z" fill="currentColor" stroke="#15121c" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 16 L1 11 M4 16 L1 21" stroke="#15121c" stroke-width="2.4" stroke-linecap="round"/><circle cx="22.5" cy="14.5" r="1.7" fill="#15121c"/><path d="M28 16 L31 16" stroke="#15121c" stroke-width="2.4" stroke-linecap="round"/></svg>`;

// the carp on a carrier's special gauge (S35: frame.specialId is 'karp' while carrying)
SPECIAL_ICONS.karp = KARP_GLYPH;

const CSS = `
.iw-hud.is-karp .iw-zc { display: block; }
.iw-hud.is-karp .iw-timer__drip { display: none; }
.iw-kst { position: absolute; left: 50%; top: 100%; translate: -50% calc(var(--u) * .35); white-space: nowrap; pointer-events: none; display: none;
  font: 800 calc(var(--u) * .95) / 1 'Rubik', sans-serif; letter-spacing: .08em; color: #fff; padding: calc(var(--u) * .3) calc(var(--u) * .8);
  border-radius: 99px; background: rgba(14, 11, 22, .82); box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .18); }
.iw-hud.is-karp .iw-kst { display: block; }
.iw-kst.is-fast { color: #ff5a4a; }
.iw-kst.is-ot { box-shadow: 0 0 0 2px #ffd27a; }
.iw-kmk { position: absolute; left: 0; top: 0; translate: -50% -100%; display: none; align-items: center; gap: .25em; pointer-events: none;
  padding: .2em .55em .2em .3em; border-radius: 99px; color: #fff; background: rgba(14, 11, 22, .85); box-shadow: 0 0 0 2.5px var(--kc, #ffd27a);
  font: 900 calc(var(--u) * 1.3) / 1 'Rubik', sans-serif; }
.iw-kmk.is-on { display: flex; }
.iw-kmk i { display: block; width: 1.6em; height: 1.6em; color: var(--kc, #ffd27a); }
.iw-kmk i svg { width: 100%; height: 100%; }
.iw-kmk.is-red b { color: #ff5a4a; }
.iw-kmk.is-pin { translate: -50% -50%; }
.iw-kmk em { font-style: normal; font-size: .7em; color: #ffd27a; }
.iw-kbot { position: absolute; left: 50%; bottom: calc(var(--u) * 11.5); translate: -50% 0; display: none; flex-direction: column; align-items: center; gap: calc(var(--u) * .4); pointer-events: none; }
.iw-kbot.is-on { display: flex; }
.iw-kbot b { font: 400 calc(var(--u) * 3.1) / 1 'Titan One', 'Rubik', sans-serif; color: #ff5a4a; -webkit-text-stroke: .14em #15121c; paint-order: stroke fill; letter-spacing: .03em; }
.iw-kbot span { font: 800 calc(var(--u) * 1.05) / 1 'Rubik', sans-serif; color: #fff; letter-spacing: .06em; text-shadow: 0 1px 0 #000; }
.iw-kno { position: absolute; left: 50%; bottom: calc(var(--u) * 16); translate: -50% 0; display: none; pointer-events: none;
  font: 800 calc(var(--u) * 1.2) / 1 'Rubik', sans-serif; color: #fff; padding: .45em .9em; border-radius: 99px; background: rgba(14, 11, 22, .88); box-shadow: 0 0 0 2px #ff5a4a; }
.iw-kno.is-on { display: block; }
.iw-sq.is-karp::after { content: ''; position: absolute; inset: -14%; border-radius: 50%; box-shadow: 0 0 0 3px #ffd27a, 0 0 10px #ffd27a; pointer-events: none; }
`;

export class KarpHud {
  constructor(hud) {
    this.hud = hud;
    if (!document.getElementById('iw-karp-css')) { const css = document.createElement('style'); css.id = 'iw-karp-css'; css.textContent = CSS; document.head.appendChild(css); }
    this.status = h('div', { class: 'iw-kst' });
    hud.timer?.appendChild(this.status);
    this.mk = h('div', { class: 'iw-kmk' }, h('i', { html: KARP_GLYPH }), h('b'), h('em'));
    this.bot = h('div', { class: 'iw-kbot' }, h('b'), h('span'));
    this.no = h('div', { class: 'iw-kno' });
    hud.el.append(this.mk, this.bot, this.no);
    this.on = false; this._noT = 0; this.show = { status: '', marker: null, bottom: null, no: null };
    this._unsubs = [
      on('sub:cantuse', ({ actor, kind }) => { if (kind === 'karp' && actor === G.match?.local) this._note("Can't use your kit while carrying"); }),
      on('karp:refuse', ({ actor, why }) => { if (actor === G.match?.local && why === 'special') this._note('Finish your special first'); }),
      on('karp:burst', ({ team }) => this._call(team, 'SHELL BURST!', 'GRAB THE BAZOOKARP!', 'THEY BURST THE SHELL!', 'STOP THE GRAB!')),
      on('karp:pickup', ({ actor, team }) => { if (actor === G.match?.local) this._call(team, "YOU'VE GOT THE BAZOOKARP!", '60 s to land it — go!'); else this._call(team, "WE'VE GOT THE BAZOOKARP!", null, "THEY'VE GOT THE BAZOOKARP!", 'SPLAT THE CARRIER!'); }),
      on('karp:drop', ({ team, how }) => { if (how !== 'moved' && team >= 0) this._call(team, 'WE LOST THE BAZOOKARP!', null, 'CARRIER DOWN!', null); }),
      on('karp:plant', ({ team }) => this._call(team, 'WEIR DOWN!', 'Their Dragon Gate is open!', 'THEY TOOK A WEIR!', 'Our Dragon Gate is open — defend it!')),
      on('karp:explode', ({ actor }) => actor && this._call(actor.team, 'IT BLEW UP ON US!', null, 'THEIR BAZOOKARP BLEW UP!', null)),
      on('karp:reset', () => this.hud._zLive?.() && this.hud._zCall?.('BACK TO THE POND!', { small: true, icon: KARP_GLYPH })),
      on('karp:overtime', ({ losing }) => { const me = G.match?.local?.team ?? 0; this.hud._zLive?.() && this.hud._zCall?.('OVERTIME!', { sub: me === losing ? 'Grab it within 10 s!' : 'Stop them — 10 s to hold!', icon: KARP_GLYPH }); }),
    ];
  }
  _note(t) { this.no.textContent = t; this.no.classList.add('is-on'); this._noT = 1.6; this.show.no = t; }
  // a call-out: ours (us) / theirs (them) by the event's team
  _call(team, us, usSub, them, themSub) {
    const H = this.hud;
    if (!H._zLive?.()) return;
    const me = G.match?.local?.team ?? 0, mine = team === me;
    if (!mine && !them) return;
    H._zCall(mine ? us : them, { team, sub: mine ? usSub : themSub, kind: mine ? '' : 'bad', icon: KARP_GLYPH });
  }

  update(dt, f) {
    const on = !!f;
    if (on !== this.on) { this.on = on; this.hud.el.classList.toggle('is-karp', on); if (on) this.hud._L.zc0 = this.hud._L.zc1 = null; }
    if (this._noT > 0 && (this._noT -= dt) <= 0) { this.no.classList.remove('is-on'); this.show.no = null; }
    if (!on) { this.mk.classList.remove('is-on'); this.bot.classList.remove('is-on'); return; }
    const me = f.viewer === 0 || f.viewer === 1 ? f.viewer : 0, L = this.hud._L;
    // ---- the counts (Zone Control's badges)
    for (let t = 0; t < 2; t++) {
      const el = this.hud.zc[t ^ me];
      if (!el) continue;
      if (!el._num) { el._num = el.querySelector('.iw-zc__num'); el._pb = el.querySelector('.iw-zc__pb'); }
      const cnt = f.count[t], hold = f.holderTeam === t, key = `k${cnt}|${hold ? 1 : 0}`, lk = 'zc' + t;
      if (L[lk] === key) continue;
      L[lk] = key;
      el._num.textContent = String(cnt);
      el.classList.remove('has-pen');
      el.style.setProperty('--p', Math.max(0, Math.min(1, (100 - cnt) / 100)).toFixed(3));
      el.style.setProperty('--q', '0');
      el.classList.toggle('is-hold', hold);
      el.classList.toggle('is-hot', cnt <= 15);
      const hi = el.querySelector('.iw-zc__hold'); if (hi && !hi._karp) { hi._karp = 1; hi.innerHTML = KARP_GLYPH; }
    }
    // ---- the status line
    const them = (t) => (t === me ? 'US' : 'THEM');
    let st = '', fast = false;
    if (f.phase === 'carried' && f.holder) { const s = Math.max(0, Math.ceil(f.carrying ? f.fuseShown : f.fuse)); fast = f.rate > 1; st = `${f.holder.team === me ? 'WE CARRY' : 'THEY CARRY'} · ${s} s${fast ? ' ×3' : ''}`; }
    else if (f.phase === 'shielded') { const k = f.hp > 0 ? f.meter / f.hp : 0, lead = k > 0 ? 0 : k < 0 ? 1 : -1; st = lead < 0 ? 'SHELL' : `SHELL ${Math.round(Math.abs(k) * 100)}% ${them(lead)}`; }
    else if (f.phase === 'reforming') st = 'SHELL RE-FORMING';
    else if (f.phase === 'free') st = 'FREE — GRAB IT';
    else if (f.phase === 'resetting') st = 'BACK TO THE POND';
    if (f.overtime) st = `OVERTIME${f.window >= 0 ? ' ' + Math.ceil(f.window) : ''} · ${st}`;
    if (st !== this.show.status) { this.show.status = st; this.status.textContent = st; }
    this.status.classList.toggle('is-fast', fast); this.status.classList.toggle('is-ot', !!f.overtime);
    // ---- the marker over the carrier (its team always; the enemy while it isn't swimming)
    const H = G.match?.karp?.holder, cam = G.camera;
    let mk = null;
    if (H && H.alive && cam && !(H.team !== me && f.holder?.hidden)) {
      const v = (this._v || (this._v = H.pos.clone())).set(H.pos.x, H.pos.y + (H.form === 'squid' ? 1.2 : 2.35), H.pos.z).project(cam);
      const W = innerWidth, Hh = innerHeight, behind = v.z > 1;
      let x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * Hh;
      const onScreen = !behind && x > 30 && x < W - 30 && y > 30 && y < Hh - 30;
      if (!onScreen) {
        let dx = x - W / 2, dy = y - Hh / 2; if (behind) { dx = -dx; dy = -dy; }
        const a = Math.atan2(dy, dx), k = Math.min((W / 2 - 50) / Math.max(1e-3, Math.abs(Math.cos(a))), (Hh / 2 - 50) / Math.max(1e-3, Math.abs(Math.sin(a))));
        x = W / 2 + Math.cos(a) * k; y = Hh / 2 + Math.sin(a) * k;
      }
      const secs = Math.max(0, Math.ceil(H === G.match.local ? f.fuseShown : f.fuse));
      const dist = G.match.local ? Math.round(H.pos.distanceTo(G.match.local.pos)) : 0;
      mk = { x, y, secs, fast: f.rate > 1, onScreen, dist };
      this.mk.style.left = x + 'px'; this.mk.style.top = y + 'px';
      this.mk.style.setProperty('--kc', G.teamHex?.[H.team] || '#ffd27a');
      this.mk.children[1].textContent = String(secs);
      this.mk.children[2].textContent = (mk.fast ? '×3 ' : '') + (onScreen ? '' : `${dist}m`);
      this.mk.classList.toggle('is-red', secs <= 10);
      this.mk.classList.toggle('is-pin', !onScreen);
    }
    this.mk.classList.toggle('is-on', !!mk);
    this.show.marker = mk;
    // ---- the carrier's own bottom line
    let bt = null;
    if (f.carrying && f.rate > 1) bt = f.why === 'zone' ? ['BAZOOKARP-FREE ZONE!', 'Fuse burning 3× — get out'] : ["DON'T RETREAT!", 'Fuse burning 3× — turn around'];
    if ((bt && bt[0]) !== (this.show.bottom && this.show.bottom[0])) { this.show.bottom = bt; if (bt) { this.bot.children[0].textContent = bt[0]; this.bot.children[1].textContent = bt[1]; } }
    this.bot.classList.toggle('is-on', !!bt);
  }
  state() { return { on: this.on, ...this.show }; }
  dispose() { this._unsubs.forEach((u) => u()); this.status.remove(); this.mk.remove(); this.bot.remove(); this.no.remove(); }
}
