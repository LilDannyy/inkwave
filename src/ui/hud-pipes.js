// The Tubeway's HUD (src/game/pipes.js; aquarium ENGINE.md §3.6, §3.10, §4.5): module DOM in the HUD layer
// (G.hud.el, shown only in a match), styled here (its own <style>, as hud-cheer.js does).
//   • the ride chip, bottom middle while riding: "→ S. PROMENADE", a progress bar, and on a player's first three rides
//     "Hold a direction to aim your pop · JUMP: high pop" (the reticle and the sub chip hide: frame.stage.noReticle)
//   • the cooldown ring on the ink tank (2.5 s after a touchdown)
//   • the tide line, bottom middle above the prompt: "KELP LINES GOING DOWN IN 10" counting down from T − 10, then
//     "KELP LINES DOWN: dive from your promenade" (or UP: lift from your Reef Hall) from T + 1; at match start "TUBEWAY:
//     walk into a pipe to ride · ⇄ both ways · ▶ one way · Kelp Lines UP"
//   • the tide pill under the match clock (G.hud.timer): two tube glyphs with ▲ / ▼ and a thin 90 s bar
import { h } from './ui-util.js';
import { G } from '../core/ctx.js';

const CSS = `
.iw-pp-line { position: absolute; left: 50%; bottom: calc(var(--u) * 6.6); translate: -50% 0; display: flex; align-items: center; gap: .55em; padding: .48em 1.15em .5em;
  border-radius: 999px; background: rgba(14, 11, 22, .82); color: #fff; font: 800 var(--fs-m, 15px) / 1 'Rubik', sans-serif; letter-spacing: .02em; white-space: nowrap;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .12), 0 3px 0 rgba(0, 0, 0, .35); pointer-events: none; opacity: 0; transition: opacity .25s, translate .3s; }
.iw-pp-line.is-on { opacity: 1; translate: -50% 0; }
.iw-pp-line.is-warn { background: rgba(120, 18, 30, .9); box-shadow: inset 0 0 0 2px rgba(255, 210, 120, .55), 0 3px 0 rgba(0, 0, 0, .35); animation: iw-pp-throb 1s ease-in-out infinite; }
.iw-pp-line.is-flip { animation: iw-pp-flip .6s cubic-bezier(.34, 1.56, .64, 1); }
.iw-pp-line b { font-variant-numeric: tabular-nums; color: #ffd66b; min-width: 1.4em; text-align: center; }
.iw-pp-line i { font-style: normal; display: inline-grid; place-items: center; width: 1.5em; height: 1.5em; border-radius: 50%; background: #f4f1e8; color: #15121c; font-weight: 900; }
@keyframes iw-pp-throb { 50% { scale: 1.06; } }
@keyframes iw-pp-flip { 0% { scale: .6; } 100% { scale: 1; } }
.iw-pp-ride { position: absolute; left: 50%; bottom: calc(var(--u) * 10.5); translate: -50% 0; display: flex; flex-direction: column; align-items: center; gap: calc(var(--u) * .45);
  pointer-events: none; opacity: 0; transition: opacity .18s; }
.iw-pp-ride.is-on { opacity: 1; }
.iw-pp-ride__chip { display: flex; align-items: center; gap: .5em; padding: .5em 1.2em .55em; border-radius: 999px; background: #f4f1e8; color: #15121c;
  font: 900 calc(var(--u) * 1.7) / 1 'Rubik', sans-serif; letter-spacing: .03em; box-shadow: 0 0 0 3px var(--self, #fff), 0 0 calc(var(--u) * 1.6) var(--self, #fff), 0 4px 0 rgba(0, 0, 0, .35); }
.iw-pp-ride__bar { width: calc(var(--u) * 16); height: calc(var(--u) * .55); border-radius: 99px; background: rgba(14, 11, 22, .7); overflow: hidden; box-shadow: 0 0 0 2px rgba(255, 255, 255, .25); }
.iw-pp-ride__bar i { display: block; height: 100%; width: 0; background: var(--self, #fff); border-radius: 99px; }
.iw-pp-ride__hint { padding: .35em .9em; border-radius: 999px; background: rgba(14, 11, 22, .75); color: #fff; font: 700 calc(var(--u) * 1.1) / 1 'Rubik', sans-serif; }
.iw-pp-ride__hint:empty { display: none; }
.iw-pp-cd { position: absolute; inset: -18%; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .2s;
  background: conic-gradient(rgba(244, 241, 232, .95) calc(var(--k, 0) * 360deg), transparent 0); -webkit-mask: radial-gradient(closest-side, transparent 78%, #000 80%, #000 98%, transparent 100%);
  mask: radial-gradient(closest-side, transparent 78%, #000 80%, #000 98%, transparent 100%); }
.iw-pp-cd.is-on { opacity: 1; }
.iw-pp-pill { position: absolute; left: 50%; top: calc(100% + var(--u) * .55); translate: -50% 0; display: flex; flex-direction: column; align-items: stretch; gap: calc(var(--u) * .25);
  padding: calc(var(--u) * .35) calc(var(--u) * .7) calc(var(--u) * .4); border-radius: calc(var(--u) * .9); background: rgba(14, 11, 22, .8); color: #fff;
  font: 900 calc(var(--u) * 1.0) / 1 'Rubik', sans-serif; letter-spacing: .06em; white-space: nowrap; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .12); pointer-events: none; }
.iw-pp-pill__row { display: flex; align-items: center; gap: .45em; }
.iw-pp-pill__tube { display: inline-grid; place-items: center; width: 1.7em; height: 1.05em; border-radius: 99px; border: 2px solid #dff6f8; color: #dff6f8; font-size: .9em; }
.iw-pp-pill__bar { height: calc(var(--u) * .3); border-radius: 99px; background: rgba(255, 255, 255, .18); overflow: hidden; }
.iw-pp-pill__bar i { display: block; height: 100%; width: 0; background: #dff6f8; }
.iw-pp-pill.is-warn { background: rgba(120, 18, 30, .92); }
.iw-hud.is-zones .iw-pp-pill, .iw-hud.is-tower .iw-pp-pill { top: calc(100% + var(--u) * 6.2); }   /* (under Zone Control's / Tower Command's own chip) */
.iw-pp-pill.is-warn .iw-pp-pill__bar i { background: #ff5a4a; }
.iw-pp-pill.is-shut .iw-pp-pill__tube { opacity: .45; border-style: dashed; }
`;

const TEXT = {
  start: 'TUBEWAY: walk into a pipe to ride · ⇄ both ways · ▶ one way · Kelp Lines UP',
  warn: (up) => `KELP LINES GOING ${up ? 'UP' : 'DOWN'} IN`,
  now: (up) => (up ? 'KELP LINES UP: lift from your Reef Hall' : 'KELP LINES DOWN: dive from your promenade'),
};

export class PipesHud {
  constructor(R) {
    this.R = R;
    const hud = G.hud;
    this.ok = !!(hud && hud.el && typeof document !== 'undefined');
    if (!this.ok) return;
    if (!document.getElementById('iw-pipes-css')) { const css = document.createElement('style'); css.id = 'iw-pipes-css'; css.textContent = CSS; document.head.appendChild(css); }
    this.line = h('div', { class: 'iw-pp-line', role: 'status' });
    this.rideName = h('span', null, '');
    this.rideBar = h('i');
    this.rideHint = h('div', { class: 'iw-pp-ride__hint' });
    this.ride = h('div', { class: 'iw-pp-ride' }, h('div', { class: 'iw-pp-ride__chip' }, this.rideName), h('div', { class: 'iw-pp-ride__bar' }, this.rideBar), this.rideHint);
    hud.el.appendChild(this.line); hud.el.appendChild(this.ride);
    this.cd = h('div', { class: 'iw-pp-cd' });
    if (hud.tank) hud.tank.appendChild(this.cd);
    this.pill = null;
    if (R.flowLeg && hud.timer) {
      this.pillArrow = h('span', { class: 'iw-pp-pill__tube' }, '▲');
      this.pillTxt = h('span', null, 'KELP UP');
      this.pillBar = h('i');
      this.pill = h('div', { class: 'iw-pp-pill' }, h('div', { class: 'iw-pp-pill__row' }, this.pillArrow, this.pillTxt), h('div', { class: 'iw-pp-pill__bar' }, this.pillBar));
      hud.timer.appendChild(this.pill);
    }
    this.L = {};          // last values written (no per-frame DOM churn)
    this.msg = null;      // { text, until, kind }
  }
  start() { if (this.ok && !this.R.m.attract) this._say(TEXT.start, 6, 'info'); }
  // the tide's moments (each screen from its own clock): the countdown from T − 10, the new direction from T + 1
  flow(phase, s) {
    if (!this.ok) return;
    const up = s.dir === 'ab';
    if (phase === 'warn' || phase === 'close') this.msg = { kind: 'warn', until: Infinity, up: !up };
    else if (phase === 'flip') { this.msg = { kind: 'flip', until: performance.now() / 1000 + 1.2, text: `KELP LINES ${up ? 'UP' : 'DOWN'}` }; this._flash(); }
    else if (phase === 'open') this._say(TEXT.now(up), 5, 'info');
  }
  _say(text, secs, kind) { this.msg = { kind, text, until: performance.now() / 1000 + secs }; }
  _flash() { const el = this.line; el.classList.remove('is-flip'); void el.offsetWidth; el.classList.add('is-flip'); }

  update(o, a) {
    if (!this.ok) return;
    const L = this.L, t = performance.now() / 1000;
    // the ride chip
    const riding = !!o.riding;
    if (riding !== L.riding) { L.riding = riding; this.ride.classList.toggle('is-on', riding); }
    if (riding) {
      const col = G.teamHex?.[a.team] || '#fff';
      if (col !== L.col) { L.col = col; this.ride.style.setProperty('--self', col); }
      const name = '→ ' + o.name;
      if (name !== L.name) { L.name = name; this.rideName.textContent = name; }
      const w = (o.k * 100).toFixed(1) + '%';
      if (w !== L.w) { L.w = w; this.rideBar.style.width = w; }
      if (o.hint !== L.hint) { L.hint = o.hint; this.rideHint.textContent = o.hint || ''; }
    }
    // the cooldown ring on the ink tank
    const cdOn = o.cd > 0.01;
    if (cdOn !== L.cdOn) { L.cdOn = cdOn; this.cd.classList.toggle('is-on', cdOn); }
    if (cdOn) { const k = (o.cd / (o.cdMax || 2.5)).toFixed(3); if (k !== L.cdK) { L.cdK = k; this.cd.style.setProperty('--k', k); } }
    // the tide line
    const f = o.tide;
    let text = '', kind = '';
    const m = this.msg;
    if (m && m.kind === 'warn' && f && f.phase !== 'run' && Number.isFinite(f.left) && f.left > 0) {
      text = `${TEXT.warn(f.dir !== 'ab')} <b>${Math.ceil(f.left)}</b>`; kind = 'warn';
    } else if (m && m.kind === 'warn') this.msg = null;
    else if (m && t < m.until) { text = m.text; kind = m.kind; }
    else if (m) this.msg = null;
    if (riding) text = '';   // (the ride chip owns the bottom middle while riding)
    if (text !== L.text) { L.text = text; if (text) this.line.innerHTML = text; this.line.classList.toggle('is-on', !!text); }
    if (kind !== L.kind) { L.kind = kind; this.line.classList.toggle('is-warn', kind === 'warn'); }
    // the tide pill
    if (this.pill && f) {
      const up = f.dir === 'ab', arrow = up ? '▲' : '▼', txt = `KELP ${up ? 'UP' : 'DOWN'}`;
      if (arrow !== L.arrow) { L.arrow = arrow; this.pillArrow.textContent = arrow; }
      if (txt !== L.ptxt) { L.ptxt = txt; this.pillTxt.textContent = txt; }
      const ph = f.phase;
      if (ph !== L.ph) { L.ph = ph; this.pill.classList.toggle('is-warn', ph === 'warn' || (ph === 'shut' && Number.isFinite(f.left) && f.left < 10)); this.pill.classList.toggle('is-shut', ph === 'shut'); }
      const every = this.R.flowLeg.flip.every;
      const k = Number.isFinite(f.left) ? (1 - Math.max(0, Math.min(every, f.left)) / every) : 1;
      const w = (k * 100).toFixed(1) + '%';
      if (w !== L.pw) { L.pw = w; this.pillBar.style.width = w; }
    }
  }
  dispose() {
    if (!this.ok) return;
    this.line.remove(); this.ride.remove(); this.cd.remove(); this.pill?.remove();
    this.ok = false;
  }
}
