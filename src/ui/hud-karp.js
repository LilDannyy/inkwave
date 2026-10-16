// [b5-karp] Bazookarp on the HUD ([karp-face] the finished one: SPEC §6.1–6.5). The HUD owns one: hud.karp = new
// KarpHud(hud), driven by hud.update(dt, frame) with frame.karp (bazookarp.js state() + viewer / carrying).
//   the score       Zone Control's count badges (your team left, 100 → 0, filling toward the timer; a carp tab on the team
//                   holding it) and the Carp Line under the timer: their Gate at the left end (on your half), yours at the
//                   right (on theirs), the Pond in the middle; diamonds for each team's weirs at their counts (grey once
//                   lowered), each team's best as a notch in its ink, padlocks on sealed Gates, the carp marker where the
//                   Bazookarp is (by the field: 0.5 ± 0.5 × P / L), wearing the fuse while carried; overtime turns the frame
//                   gold with the pick-up window draining under it. A status pill under it (WE CARRY · 42 s ×3 …)
//   the carrier     the over-head marker (the carp + the fuse's seconds, red and beating under 10, ×3 while fast) for both
//                   teams — hidden from the enemy while the carrier swims (S31); off screen it is pinned to the edge with
//                   an arrow and the distance. The carrier's own screen has the reticle instead: a fuse ring round the
//                   crosshair with the seconds, the charge ring, the full-charge flash (the arc preview is bazookarpFx's);
//                   its special orb shows the carp (SPECIAL_ICONS.karp); the carrier's squad icon wears a carp badge
//   the bottom      DON'T RETREAT! / CARP-FREE ZONE! on the carrier's own screen with the ×3 ring, the moment its own
//                   screen judges the rate (§3.3)
//   the objects     a meter tag over the shell (two-colour pill, its tip at the meter, within 45 m); the count each of your
//                   standing weirs would give, GATE over your risen Gate
//   call-outs       hud._zCall on the events; a call-out within 1.5 s of the last replaces it; "Can't use" notes
//   the maps        drawKarpMap (minimap.js, both the corner map and the TAB map): free zones hatched in the owner's ink,
//                   weirs, Gates (padlocked / pulsing), the Bazookarp (gold with the shell ring and the meter pie; held: the
//                   carrier's ink with a fuse arc, hidden from the enemy while it swims; resetting: a dotted arc to the
//                   Pond), the halfway line (the TAB map only)
//   sound           the KarpCues director (src/audio/sfx-karp.js)
// hud.karp.state() reports what is showing (tests).
import { h } from './ui-util.js';
import { G, on } from '../core/ctx.js';
import { BAZOOKARP as K } from '../config.js';
import { SPECIAL_ICONS } from './ui-icons.js';
import { KarpCues } from '../audio/sfx-karp.js';

// the carp, side on, facing right: a big forked tail and a dorsal fin so it reads as a fish at 16–24 px; the eye, a barbel
const KP = {
  tail: 'M10 16 L1.5 7.5 Q4.2 16 1.5 24.5 Z', fin: 'M12.5 10.8 Q16.5 3.8 22.5 8.6 Z',
  body: 'M8 16 Q14 8.4 23 9.4 Q29.4 10.8 30.5 16 Q29.4 21.2 23 22.6 Q14 23.6 8 16 Z',
};
export const KARP_GLYPH = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${KP.tail}" fill="currentColor" stroke="#15121c" stroke-width="2" stroke-linejoin="round"/><path d="${KP.fin}" fill="currentColor" stroke="#15121c" stroke-width="2" stroke-linejoin="round"/><path d="${KP.body}" fill="currentColor" stroke="#15121c" stroke-width="2.2" stroke-linejoin="round"/><path d="M21.6 11.6 Q19.6 16 21.6 20.4" fill="none" stroke="#15121c" stroke-width="1.6" stroke-linecap="round"/><circle cx="25.6" cy="14.2" r="1.7" fill="#15121c"/><path d="M29.6 17.6 Q30.8 20.2 28.6 21.8" fill="none" stroke="#15121c" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7 V5 a3.5 3.5 0 0 1 7 0 V7" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="2.5" y="6.8" width="11" height="8" rx="2" fill="currentColor"/></svg>';

// the carp on a carrier's special gauge (S35: frame.specialId is 'karp' while carrying)
SPECIAL_ICONS.karp = KARP_GLYPH;

// what the splat screen says splatted you (hud.js splatCause): a Carp Shot's blast (cause 'karp', its shooter credited),
// the Roe Shell's burst ('karp-burst', the bursting team's last hitter credited) and the Carp Blast ('karp-fuse': nobody
// credited — main.js shows "SPLATTED!", never "by enemy ink")
export const KARP_CAUSES = {
  karp: { kind: 'special', name: 'Carp Shot', tag: 'BAZOOKARP', icon: KARP_GLYPH },
  'karp-burst': { kind: 'special', name: 'Roe Shell burst', tag: 'BAZOOKARP', icon: KARP_GLYPH },
  'karp-fuse': { kind: 'special', name: 'The Bazookarp blew up', tag: '', icon: KARP_GLYPH, nobody: true },
};

const CSS = `
/* the TAB map's jump bubble of the carrier: the carp rides on it (the bubble covers the map's carp icon) */
.iw-bcn__karp { display: none; position: absolute; left: calc(var(--bs) * -.05); top: calc(var(--bs) * -1.12); width: calc(var(--bs) * .78); height: calc(var(--bs) * .78); color: #ffd27a; pointer-events: none;
  filter: drop-shadow(0 0 2px #15121c) drop-shadow(0 2px 0 rgba(0,0,0,.35)); animation: iw-bcn-karp 1.1s ease-in-out infinite alternate; }
.iw-bcn__karp svg { width: 100%; height: 100%; }
.iw-bcn.is-karp .iw-bcn__karp { display: block; }
@keyframes iw-bcn-karp { to { translate: 0 -12%; rotate: -8deg; } }
.iw-hud.is-karp .iw-zc { display: block; }
.iw-hud.is-karp .iw-timer__drip { display: none; }
.iw-hud.is-karp .iw-hud__top { gap: calc(var(--u) * 1.05); }
.iw-zc__hold svg { width: 100%; height: 100%; }
/* the Carp Line */
.iw-kl { display: none; position: absolute; left: 50%; top: calc(100% + var(--u) * .9); translate: -50% 0; flex-direction: column; align-items: center; gap: calc(var(--u) * .35); pointer-events: none; --tc: #ffd27a; }
.iw-hud.is-karp .iw-kl { display: flex; }
.iw-kl[data-side="mine"] { --tc: var(--self); }
.iw-kl[data-side="theirs"] { --tc: var(--enemy); }
.iw-kl__track { position: relative; width: calc(var(--u) * 23); height: calc(var(--u) * .8); border-radius: 99px; background: var(--k, #15121c); box-shadow: 0 0 0 2px var(--k, #15121c), 0 2px 0 3px rgba(0,0,0,.25); transition: box-shadow .3s; }
.iw-kl.is-ot .iw-kl__track { box-shadow: 0 0 0 2px var(--k, #15121c), 0 0 0 4px #ffd27a, 0 0 12px 4px rgba(255, 210, 122, .55); }
.iw-kl__half { position: absolute; top: 3px; bottom: 3px; border-radius: 99px; opacity: .55; }
.iw-kl__half.is-l { left: 3px; right: 50%; background: var(--enemy-dark, #444); }   /* your half: their progress runs left */
.iw-kl__half.is-r { right: 3px; left: 50%; background: var(--self-dark, #444); }     /* their half: yours runs right */
.iw-kl__run { position: absolute; top: 3px; bottom: 3px; border-radius: 99px; transition: left .3s var(--out), right .3s var(--out), width .3s var(--out); }
.iw-kl__run.is-r { left: 50%; background: var(--self); }
.iw-kl__run.is-l { right: 50%; background: var(--enemy); }
.iw-kl__mid { position: absolute; left: 50%; top: -5px; bottom: -5px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: #fff; opacity: .9; }
.iw-kl__gate { position: absolute; top: 50%; width: calc(var(--u) * 1.5); height: calc(var(--u) * 1.5); margin-top: calc(var(--u) * -.75); border-radius: 50%; display: grid; place-items: center;
  box-shadow: 0 0 0 2px var(--k, #15121c), 0 0 0 4px #fff; color: #15121c; }
.iw-kl__gate i { display: block; width: 62%; height: 62%; }
.iw-kl__gate i svg { width: 100%; height: 100%; }
.iw-kl__gate.is-l { left: calc(var(--u) * -.8); background: var(--enemy); }
.iw-kl__gate.is-r { right: calc(var(--u) * -.8); background: var(--self); }
.iw-kl__gate.is-up i { display: none; }
.iw-kl__gate.is-up { animation: iw-kl-gate 1s ease-in-out infinite; }
@keyframes iw-kl-gate { 50% { box-shadow: 0 0 0 2px var(--k, #15121c), 0 0 0 5px #fff, 0 0 14px 6px currentColor; } }
.iw-kl__gate.is-r.is-up { color: var(--self); } .iw-kl__gate.is-l.is-up { color: var(--enemy); }
.iw-kl__weir { position: absolute; left: calc(var(--x) * 100%); top: 50%; width: calc(var(--u) * .62); height: calc(var(--u) * .62); margin: calc(var(--u) * -.31) 0 0 calc(var(--u) * -.31);
  rotate: 45deg; border-radius: 2px; box-shadow: 0 0 0 2px var(--k, #15121c); transition: background .4s; z-index: 1; }
.iw-kl__weir.is-mine { background: var(--self); } .iw-kl__weir.is-theirs { background: var(--enemy); }
.iw-kl__weir.is-low { background: #6b6f7a; }
.iw-kl__best { position: absolute; left: calc(var(--x, .5) * 100%); top: -6px; bottom: -6px; width: 3px; margin-left: -1.5px; border-radius: 2px; transition: left .4s var(--out); z-index: 1; }
.iw-kl__best.is-mine { background: var(--self-light, #fff); } .iw-kl__best.is-theirs { background: var(--enemy-light, #fff); }
.iw-kl__carp { position: absolute; left: calc(var(--x, .5) * 100%); top: 50%; width: calc(var(--u) * 2.5); height: calc(var(--u) * 2.5); translate: -50% -64%; z-index: 2; transition: left .14s linear; }
.iw-kl__carp > i { display: block; width: 100%; height: 100%; color: var(--tc); filter: drop-shadow(0 2px 0 rgba(0,0,0,.35)); transition: color .25s; }
.iw-kl__carp > i svg { width: 100%; height: 100%; }
.iw-kl__carp b { position: absolute; left: 50%; top: 100%; translate: -50% 0; font: 900 calc(var(--u) * .85) / 1 'Rubik', sans-serif; color: #fff; padding: .12em .38em; border-radius: 99px;
  background: rgba(14, 11, 22, .88); box-shadow: 0 0 0 1.5px var(--tc); display: none; white-space: nowrap; }
.iw-kl__carp.is-held b { display: block; }
.iw-kl__carp.is-red b { color: #ff5a4a; }
.iw-kl__carp.is-moving > i { animation: iw-kl-swim .5s ease-in-out infinite alternate; }
@keyframes iw-kl-swim { to { translate: 0 -8%; rotate: -6deg; } }
.iw-kl__win { position: absolute; left: 3px; right: 3px; bottom: -7px; height: 3px; border-radius: 2px; background: rgba(255, 210, 122, .25); display: none; overflow: hidden; }
.iw-kl.is-win .iw-kl__win { display: block; }
.iw-kl__win i { display: block; height: 100%; width: calc(var(--w, 1) * 100%); background: #ffd27a; border-radius: 2px; }
.iw-kl__ot { display: none; }
.iw-kl.is-ot .iw-kl__ot { order: -1; display: flex; padding: calc(var(--u) * .3) calc(var(--u) * 1) calc(var(--u) * .35); border-radius: calc(var(--u) * .9); margin-bottom: calc(var(--u) * .4);
  background: rgba(14, 11, 22, .86); box-shadow: 0 0 0 2px #ffd27a; }
.iw-kl__ot .iw-display { font-size: calc(var(--u) * 1.5); letter-spacing: .06em; color: #ffe27a; -webkit-text-stroke: 0; text-shadow: none; }
.iw-kst { margin-top: calc(var(--u) * .95); white-space: nowrap; pointer-events: none; font: 800 calc(var(--u) * .92) / 1 'Rubik', sans-serif; letter-spacing: .08em; color: #fff;
  padding: calc(var(--u) * .3) calc(var(--u) * .8); border-radius: 99px; background: rgba(14, 11, 22, .84); box-shadow: 0 0 0 2px var(--tc, #ffd27a); }
.iw-kst:empty { display: none; }
.iw-kst.is-fast { color: #ff5a4a; }
/* the over-head marker */
.iw-kmk { position: absolute; left: 0; top: 0; width: 0; height: 0; display: none; pointer-events: none; z-index: 3; --kc: #ffd27a; }
.iw-kmk.is-on { display: block; }
.iw-kmk__pill { position: absolute; left: 0; top: 0; translate: -50% -100%; display: flex; align-items: center; gap: .22em; padding: .18em .55em .18em .28em; border-radius: 99px;
  background: rgba(14, 11, 22, .86); box-shadow: 0 0 0 2.5px var(--kc), 0 3px 0 2px rgba(0,0,0,.3); font: 900 calc(var(--u) * 1.3) / 1 'Rubik', sans-serif; color: #fff; white-space: nowrap; }
.iw-kmk__pill > i { display: block; width: 1.65em; height: 1.65em; color: var(--kc); }
.iw-kmk__pill > i svg { width: 100%; height: 100%; }
.iw-kmk__pill em { font-style: normal; font-size: .62em; padding: .15em .35em; border-radius: 99px; background: #ff5a4a; color: #fff; display: none; }
.iw-kmk.is-fast .iw-kmk__pill em { display: block; }
.iw-kmk.is-red .iw-kmk__pill b { color: #ff5a4a; }
.iw-kmk.is-beat .iw-kmk__pill { animation: iw-kmk-beat .32s var(--spring2, ease-out); }
@keyframes iw-kmk-beat { 30% { scale: 1.22; } }
.iw-kmk__d { position: absolute; left: 0; top: calc(var(--u) * .5); translate: -50% 0; display: none; font: 800 calc(var(--u) * .8) / 1 'Rubik', sans-serif; color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000; }
.iw-kmk.is-pin .iw-kmk__pill { translate: -50% -50%; }
.iw-kmk.is-pin .iw-kmk__d { display: block; top: calc(var(--u) * 1.35); }
.iw-kmk__arrow { display: none; position: absolute; left: 0; top: 0; width: 0; height: 0; rotate: var(--rot, 0rad); }
.iw-kmk__arrow::before { content: ''; position: absolute; left: calc(var(--u) * 2.1); top: calc(var(--u) * -.6); border: calc(var(--u) * .6) solid transparent; border-left: calc(var(--u) * .9) solid var(--kc); filter: drop-shadow(0 0 1px #000); }
.iw-kmk.is-pin .iw-kmk__arrow { display: block; }
.iw-hud.is-mapopen .iw-kmk, .iw-hud.is-mapopen .iw-kshell, .iw-hud.is-mapopen .iw-ktag { opacity: 0; }
/* the carrier's reticle */
.iw-kret { position: absolute; left: 50%; top: 50%; width: calc(var(--u) * 7.4); height: calc(var(--u) * 7.4); translate: -50% -50%; display: none; pointer-events: none; --fc: #fff; }
.iw-hud.is-karpcarry .iw-kret { display: block; }
.iw-hud.is-karpcarry .iw-ret { opacity: 0; }
.iw-kret svg { width: 100%; height: 100%; overflow: visible; }
.iw-kret__track { fill: none; stroke: rgba(14, 11, 22, .55); stroke-width: 4.5; }
.iw-kret__fuse { fill: none; stroke: var(--fc); stroke-width: 3.2; stroke-linecap: round; transform: rotate(-90deg); transition: stroke .2s; filter: drop-shadow(0 0 1.5px rgba(0,0,0,.6)); }
.iw-kret.is-red { --fc: #ff5a4a; }
.iw-kret.is-fast .iw-kret__fuse { stroke-dasharray: none; animation: iw-kret-fast .25s steps(2) infinite; }
@keyframes iw-kret-fast { 50% { opacity: .55; } }
.iw-kret__charge { fill: none; stroke: #fff; stroke-width: 2.6; stroke-linecap: round; transform: rotate(-90deg); opacity: .95; }
.iw-kret__ctrack { fill: none; stroke: rgba(255,255,255,.18); stroke-width: 2.6; }
.iw-kret.is-full .iw-kret__charge { stroke: var(--self); filter: drop-shadow(0 0 3px var(--self)); }
.iw-kret__dot { fill: #fff; stroke: #15121c; stroke-width: 1.2; }
.iw-kret b { position: absolute; left: 50%; top: 100%; translate: -50% -20%; font: 900 calc(var(--u) * 1.15) / 1 'Rubik', sans-serif; color: var(--fc); text-shadow: 0 1px 0 #000, 0 0 3px #000; }
.iw-kret em { position: absolute; left: 88%; top: 6%; translate: 0 -50%; font: 900 calc(var(--u) * .85) / 1 'Rubik', sans-serif; font-style: normal; color: #fff; background: #ff5a4a;
  padding: .2em .4em; border-radius: 99px; display: none; }
.iw-kret.is-fast em { display: block; }
.iw-kret.is-flash svg { animation: iw-kret-flash .35s ease-out; }
/* [karp-face] the last 10 s: big beating digits under the ring (the small number read as 8 px at 960×600) and a bolder ring */
.iw-kret.is-red b { font: 400 calc(var(--u) * 3.3) / 1 'Titan One', 'Rubik', sans-serif; -webkit-text-stroke: .13em #15121c; paint-order: stroke fill; text-shadow: 0 .06em 0 rgba(0,0,0,.45); translate: -50% 4%; }
.iw-kret.is-red .iw-kret__fuse { stroke-width: 5; }
.iw-kret.is-red .iw-kret__track { stroke-width: 6.5; }
.iw-kret.is-beat b { animation: iw-kret-beat .42s cubic-bezier(.34,1.8,.64,1); }
@keyframes iw-kret-beat { 0% { scale: 1.45; } }
@keyframes iw-kret-flash { 0% { scale: 1.25; filter: drop-shadow(0 0 8px #fff); } }
/* the bottom line */
.iw-kbot { position: absolute; left: 50%; bottom: calc(var(--u) * 11.5); translate: -50% 0; display: none; align-items: center; gap: calc(var(--u) * .9); pointer-events: none; }
.iw-kbot.is-on { display: flex; animation: iw-kbot-in .3s var(--spring2, ease-out); }
@keyframes iw-kbot-in { from { scale: .6; opacity: 0; } }
.iw-kbot__ring { position: relative; width: calc(var(--u) * 3.6); height: calc(var(--u) * 3.6); border-radius: 50%; display: grid; place-items: center; background: #ff4a3a;
  box-shadow: 0 0 0 3px #15121c, 0 0 0 5px #fff; font: 400 calc(var(--u) * 1.5) / 1 'Titan One', 'Rubik', sans-serif; color: #fff; -webkit-text-stroke: .1em #15121c; paint-order: stroke fill; }
.iw-kbot__ring::after { content: ''; position: absolute; inset: -18%; border-radius: 50%; border: 3px dashed #ff4a3a; animation: iw-kbot-spin 1s linear infinite; }
@keyframes iw-kbot-spin { to { rotate: 360deg; } }
.iw-kbot__txt { display: flex; flex-direction: column; align-items: flex-start; gap: calc(var(--u) * .35); }
.iw-kbot b { font: 400 calc(var(--u) * 3.1) / 1 'Titan One', 'Rubik', sans-serif; color: #ff5a4a; -webkit-text-stroke: .14em #15121c; paint-order: stroke fill; letter-spacing: .03em; animation: iw-kbot-pulse .5s ease-in-out infinite alternate; }
@keyframes iw-kbot-pulse { to { scale: 1.04; } }
.iw-kbot span { font: 800 calc(var(--u) * 1.05) / 1 'Rubik', sans-serif; color: #fff; letter-spacing: .06em; text-shadow: 0 1px 0 #000; }
.iw-kno { position: absolute; left: 50%; bottom: calc(var(--u) * 16); translate: -50% 0; display: none; pointer-events: none;
  font: 800 calc(var(--u) * 1.2) / 1 'Rubik', sans-serif; color: #fff; padding: .45em .9em; border-radius: 99px; background: rgba(14, 11, 22, .88); box-shadow: 0 0 0 2px #ff5a4a; }
.iw-kno.is-on { display: block; animation: iw-pop .35s var(--spring2, ease-out) backwards; }
/* the shell's meter tag, weir / Gate tags */
.iw-kshell, .iw-ktag { position: absolute; left: 0; top: 0; pointer-events: none; display: none; z-index: 2; }
.iw-kshell.is-on, .iw-ktag.is-on { display: block; }
.iw-kshell__pill { position: absolute; left: 0; top: 0; translate: -50% -100%; width: calc(var(--u) * 6.4); height: calc(var(--u) * 1.05); border-radius: 99px; overflow: hidden;
  background: var(--enemy); box-shadow: 0 0 0 2px #15121c, 0 0 0 3.5px rgba(255,255,255,.85); }
.iw-kshell__pill i { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--m, .5) * 100%); background: var(--self); }
.iw-kshell__pill b { position: absolute; left: calc(var(--m, .5) * 100%); top: -2px; bottom: -2px; width: 3px; margin-left: -1.5px; background: #fff; box-shadow: 0 0 3px #000; }
.iw-kshell__lbl { position: absolute; left: 0; top: calc(var(--u) * -1.15); translate: -50% -100%; font: 900 calc(var(--u) * .78) / 1 'Rubik', sans-serif; color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000; white-space: nowrap; display: flex; gap: .3em; align-items: center; }
.iw-kshell__lbl i { display: block; width: 1.4em; height: 1.4em; color: #ffd27a; } .iw-kshell__lbl i svg { width: 100%; height: 100%; }
.iw-kshell.is-warn .iw-kshell__pill { animation: iw-kshell-warn .2s steps(2) infinite; }
@keyframes iw-kshell-warn { 50% { box-shadow: 0 0 0 2px #15121c, 0 0 0 4px #fff, 0 0 10px #fff; } }
.iw-ktag__pill { position: absolute; left: 0; top: 0; translate: -50% -100%; padding: .22em .55em; border-radius: 99px; background: var(--self); color: #fff;
  font: 400 calc(var(--u) * 1.05) / 1 'Titan One', 'Rubik', sans-serif; -webkit-text-stroke: .12em #15121c; paint-order: stroke fill; box-shadow: 0 0 0 2px #15121c; white-space: nowrap; }
.iw-ktag.is-gate .iw-ktag__pill { animation: iw-kl-gate 1s ease-in-out infinite; }
/* [karp-face] a world tag that would sit on a live call-out fades out of its way */
.iw-kshell, .iw-ktag { transition: opacity .15s; }
.iw-kshell.is-under, .iw-ktag.is-under { opacity: 0; }
/* [karp-face] while a kill call-out (WIPEOUT! …) is live, ours sit under it (at 960×600 the two layers overlapped) */
.iw-hud.is-karp.has-kcall .iw-zcalls { top: max(33%, calc(var(--jal-b, 0px) + var(--u) * .9), var(--kcb, 0px)); }
/* the carrier's squad badge */
.iw-sq.is-karp::after { content: ''; position: absolute; right: -16%; bottom: -10%; width: 52%; height: 52%; border-radius: 50%; pointer-events: none; z-index: 2;
  background: #ffd27a url("data:image/svg+xml;utf8,${encodeURIComponent(KARP_GLYPH.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/currentColor/g, '#ffffff'))}") center / 86% no-repeat;
  box-shadow: 0 0 0 2px #15121c, 0 0 0 3.5px #ffd27a, 0 0 8px #ffd27a; animation: iw-sq-karp 1.1s ease-in-out infinite; }
.iw-squad--a .iw-sq.is-karp::after { background-color: var(--self); box-shadow: 0 0 0 2px #15121c, 0 0 0 3.5px #fff, 0 0 8px var(--self); }
.iw-squad--b .iw-sq.is-karp::after { background-color: var(--enemy); box-shadow: 0 0 0 2px #15121c, 0 0 0 3.5px #fff, 0 0 8px var(--enemy); }
@keyframes iw-sq-karp { 50% { scale: 1.12; } }
`;

export class KarpHud {
  constructor(hud) {
    this.hud = hud;
    if (!document.getElementById('iw-karp-css')) { const css = document.createElement('style'); css.id = 'iw-karp-css'; css.textContent = CSS; document.head.appendChild(css); }
    // ---- the Carp Line (under the timer)
    this.lRun = [h('i', { class: 'iw-kl__run is-l' }), h('i', { class: 'iw-kl__run is-r' })];
    this.lGate = [h('span', { class: 'iw-kl__gate is-l' }, h('i', { html: LOCK })), h('span', { class: 'iw-kl__gate is-r' }, h('i', { html: LOCK }))];
    this.lBest = [h('i', { class: 'iw-kl__best is-theirs' }), h('i', { class: 'iw-kl__best is-mine' })];
    this.lWeirs = h('span', { class: 'iw-kl__weirs' });
    this.lCarp = h('span', { class: 'iw-kl__carp' }, h('i', { html: KARP_GLYPH }), h('b'));
    this.lWin = h('span', { class: 'iw-kl__win' }, h('i'));
    this.lTrack = h('span', { class: 'iw-kl__track' }, h('i', { class: 'iw-kl__half is-l' }), h('i', { class: 'iw-kl__half is-r' }), ...this.lRun, h('i', { class: 'iw-kl__mid' }),
      this.lWeirs, ...this.lBest, ...this.lGate, this.lCarp, this.lWin);
    this.status = h('div', { class: 'iw-kst' });
    this.line = h('div', { class: 'iw-kl' }, h('div', { class: 'iw-kl__ot' }, h('span', { class: 'iw-display' }, 'OVERTIME')), this.lTrack, this.status);
    hud.timer?.appendChild(this.line);
    // ---- the marker, the reticle, the bottom line, the note, the shell tag, the weir / Gate tags
    this.mk = h('div', { class: 'iw-kmk' }, h('i', { class: 'iw-kmk__arrow' }), h('span', { class: 'iw-kmk__pill' }, h('i', { html: KARP_GLYPH }), h('b'), h('em', null, '×3')), h('span', { class: 'iw-kmk__d' }));
    const C1 = 2 * Math.PI * 34, C2 = 2 * Math.PI * 25;
    this.ret = h('div', { class: 'iw-kret', html: `<svg viewBox="-40 -40 80 80" aria-hidden="true"><circle r="34" class="iw-kret__track"/><circle r="34" class="iw-kret__fuse" style="stroke-dasharray:${C1.toFixed(2)};stroke-dashoffset:0"/>
      <circle r="25" class="iw-kret__ctrack"/><circle r="25" class="iw-kret__charge" style="stroke-dasharray:${C2.toFixed(2)};stroke-dashoffset:${C2.toFixed(2)}"/><circle r="2.6" class="iw-kret__dot"/>
      <path d="M0 -14 L0 -8 M14 0 L8 0 M0 14 L0 8 M-14 0 L-8 0" stroke="#fff" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 1px #000)"/></svg><b></b><em>×3</em>` });
    this._C1 = C1; this._C2 = C2; this._fuseEl = this.ret.querySelector('.iw-kret__fuse'); this._chEl = this.ret.querySelector('.iw-kret__charge');
    (hud.xh || hud.el).appendChild(this.ret);
    this.bot = h('div', { class: 'iw-kbot' }, h('span', { class: 'iw-kbot__ring' }, '×3'), h('span', { class: 'iw-kbot__txt' }, h('b'), h('span')));
    this.no = h('div', { class: 'iw-kno' });
    this.shellTag = h('div', { class: 'iw-kshell' }, h('span', { class: 'iw-kshell__lbl' }, h('i', { html: KARP_GLYPH }), h('span')), h('span', { class: 'iw-kshell__pill' }, h('i'), h('b')));
    this.tags = h('div', { class: 'iw-ktags' });
    hud.el.append(this.mk, this.bot, this.no, this.shellTag, this.tags);
    this.on = false; this._noT = 0; this._tagEls = [];
    this.show = { status: '', marker: null, bottom: null, no: null, call: null, line: null, reticle: null, shell: null, tags: [] };
    this.cues = new KarpCues();
    const me = () => G.match?.local?.team ?? 0;
    this._unsubs = [
      on('sub:cantuse', ({ actor, kind }) => { if (kind === 'karp' && actor === G.match?.local) this._note("Can't use your kit while carrying"); }),
      on('karp:refuse', ({ actor, why }) => { if (actor === G.match?.local && why === 'special') this._note('Finish your special first'); }),
      on('karp:burst', ({ team }) => this._call(team, 'SHELL BURST!', 'GRAB THE BAZOOKARP!', 'THEY BURST THE SHELL!', 'STOP THE GRAB!')),
      on('karp:pickup', ({ actor, team }) => { if (actor === G.match?.local) this._call(team, "YOU'VE GOT THE BAZOOKARP!", '60 s to land it — go!'); else this._call(team, "WE'VE GOT THE BAZOOKARP!", null, "THEY'VE GOT THE BAZOOKARP!", 'SPLAT THE CARRIER!'); }),
      on('karp:drop', ({ team, how }) => { if (how !== 'moved' && team >= 0 && !this._boomed(how)) this._call(team, 'WE LOST THE BAZOOKARP!', null, 'CARRIER DOWN!', null); }),
      on('karp:plant', ({ team }) => this._call(team, 'WEIR DOWN!', 'Their Dragon Gate is open!', 'THEY TOOK A WEIR!', 'Our Dragon Gate is open — defend it!')),
      // the Carp Blast's banner says where it goes next; the drop / reset that follows it at once no longer replaces it
      on('karp:explode', ({ actor, own }) => { if (!actor) return; this._boomT = performance.now(); this._call(actor.team, 'IT BLEW UP ON US!', own ? 'Back to the Pond' : 'It lies where it blew — get it back!', 'THEIR BAZOOKARP BLEW UP!', own ? 'Back to the Pond' : 'It lies where it blew — grab it!'); }),
      on('karp:reset', ({ why }) => this.hud._zLive?.() && !this._boomed(why) && this._say('BACK TO THE POND!', { small: true, icon: KARP_GLYPH })),
      on('karp:overtime', ({ losing }) => {
        if (!this.hud._zLive?.()) return;
        this.hud._zOvertime?.();
        const held = !!G.match?.karp?.holder && G.match.karp.holderTeam === losing;
        this._say('OVERTIME!', { team: me() === losing ? me() : 1 - me(), sub: me() === losing ? (held ? 'Carry it past their count!' : 'Grab it within 10 s!') : 'Stop them — 10 s to hold!', icon: KARP_GLYPH });
      }),
      on('karp:end', ({ reason }) => this.hud._zEnd?.({ reason })),
      on('karp:full', ({ actor }) => { if (actor === G.match?.local) this.hud._restart?.(this.ret, 'is-flash'); }),
      on('match:state', ({ state, match }) => {
        if (state === 'intro' || state === 'playing') this._gateCall = false;
        // the match start (SPEC §1.1): both teams get the same call-out
        if (state === 'playing' && match?.karp && !match.attract) setTimeout(() => { if (G.match === match && match.karp && match.karp.clock < 6 && this.hud._zLive?.()) this._say('BURST THE ROE SHELL!', { sub: 'Then carry the Bazookarp to their Dragon Gate', icon: KARP_GLYPH }); }, 900);
      }),
    ];
  }
  _note(t) { this.no.textContent = t; this.no.classList.remove('is-on'); void this.no.offsetWidth; this.no.classList.add('is-on'); this._noT = 1.6; this.show.no = t; }
  // a drop / reset the fuse caused, right after the Carp Blast's own banner (which already says where it went)
  _boomed(why) { return why === 'fuse' && performance.now() - (this._boomT ?? -1e9) < 1500; }
  // a call-out: ours (us) / theirs (them) by the event's team
  _call(team, us, usSub, them, themSub) {
    if (!this.hud._zLive?.()) return;
    const me = G.match?.local?.team ?? 0, mine = team === me;
    if (!mine && !them) return;
    this._say(mine ? us : them, { team, sub: mine ? usSub : themSub, kind: mine ? '' : 'bad', icon: KARP_GLYPH });
  }
  // Bazookarp's events come in bursts (SHELL BURST! then YOU'VE GOT THE BAZOOKARP! 0.25 s later; a plant's WEIR DOWN!
  // with the re-form): a call-out within 1.5 s of the last one replaces it instead of stacking under it
  _say(text, opts) {
    const H = this.hud, now = performance.now();
    // ([karp-face] a kill call-out still popping in — a burst's WIPEOUT! comes the same frame as its SHELL BURST! — goes
    // first: ours follows once its pop is over, below it — has-kcall — so neither is drawn over the other)
    const kc = H.callouts?.querySelector('.iw-call'), kAge = kc ? kc.getAnimations?.()[0]?.currentTime ?? 1e9 : 1e9;
    if (kAge < 380) { this.show.call = text; clearTimeout(this._sayLater); this._sayLater = setTimeout(() => this._say(text, opts), 380 - kAge); return; }
    if (now - (this._sayT || -1e9) < 1500 && H.zcalls) for (const el of [...H.zcalls.children]) el.remove();
    this._sayT = now; this.show.call = text;
    H._zCall(text, opts);
  }
  // screen point of a world point (null off the camera's front), in CSS px
  _proj(x, y, z) {
    const cam = G.rig?.gameCam || G.camera;
    if (!cam) return null;
    const p = this.hud._project ? this.hud._project(cam, x, y, z) : null;
    if (!p) return null;
    const W = this.hud.el.clientWidth || innerWidth, Hh = this.hud.el.clientHeight || innerHeight;
    return { x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * Hh, nx: p.x, ny: p.y, behind: p.z > 1, W, H: Hh };
  }

  update(dt, f) {
    const on = !!f, el = this.hud.el;
    if (on !== this.on) { this.on = on; el.classList.toggle('is-karp', on); if (on) { this.hud._L.zc0 = this.hud._L.zc1 = null; this._weirKey = null; } }
    if (this._noT > 0 && (this._noT -= dt) <= 0) { this.no.classList.remove('is-on'); this.show.no = null; }
    this.cues.update(dt, f);
    if (!on) { for (const e of [this.mk, this.bot, this.shellTag]) e.classList.remove('is-on'); el.classList.remove('is-karpcarry'); this._tags([], null); return; }
    const me = f.viewer === 0 || f.viewer === 1 ? f.viewer : 0, them = 1 - me, L = this.hud._L;
    // ---- the count badges (Zone Control's)
    for (let t = 0; t < 2; t++) {
      const b = this.hud.zc[t ^ me];
      if (!b) continue;
      if (!b._num) { b._num = b.querySelector('.iw-zc__num'); b._pb = b.querySelector('.iw-zc__pb'); }
      const cnt = f.count[t], hold = f.holderTeam === t, key = `k${cnt}|${hold ? 1 : 0}|${me}`, lk = 'zc' + t;
      if (L[lk] === key) continue;
      const prev = L[lk] && L[lk][0] === 'k' ? +L[lk].slice(1).split('|')[0] : null;
      L[lk] = key;
      b._num.textContent = String(cnt);
      b.classList.remove('has-pen');
      b.style.setProperty('--p', Math.max(0, Math.min(1, (100 - cnt) / 100)).toFixed(3));
      b.style.setProperty('--q', '0');
      b.classList.toggle('is-hold', hold);
      b.classList.toggle('is-hot', cnt <= 15);
      const hi = b.querySelector('.iw-zc__hold'); if (hi && !hi._karp) { hi._karp = 1; hi.innerHTML = KARP_GLYPH; }
      if (prev != null && cnt < prev) {
        b._num.animate([{ transform: 'translateY(-12%) scale(1.14)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.34,1.8,.64,1)' });
        if (cnt <= 15 && cnt > 0) this.hud._snd?.('zone_tick', { volume: t === me ? 0.5 : 0.38, pitch: t === me ? 1.12 : 0.9 });
      }
    }
    this._line(f, me, them);
    this._beacons();
    // ---- [karp-face] what world tags keep clear of: the top bar (down to the status pill's bottom) and live call-outs
    if (!(this._topT > 0)) {
      const er = el.getBoundingClientRect(); this._ox = er.left; this._oy = er.top;
      let r = this.status.getBoundingClientRect(); if (!(r.height > 0)) r = this.line.getBoundingClientRect();
      this._topY = r.height > 0 ? r.bottom - this._oy : 0; this._stL = r.left - this._ox; this._stR = r.right - this._ox; this._topT = 30;
    }
    this._topT--;
    const calls = this._callRects();
    // ---- the status pill
    const tn = (t) => (t === me ? 'OURS' : 'THEIRS');   // (the pause strip's and the meter tag's words)
    let st = '', fast = false;
    if (f.phase === 'carried' && f.holder) { const s = Math.max(0, Math.ceil(f.carrying ? f.fuseShown : f.fuse)); fast = f.rate > 1; st = `${f.carrying ? 'YOU CARRY' : f.holder.team === me ? 'WE CARRY' : 'THEY CARRY'} · ${s} s${fast ? ' ×3' : ''}`; }
    else if (f.phase === 'shielded') { const k = f.hp > 0 ? f.meter / f.hp : 0, lead = k > 0.004 ? 0 : k < -0.004 ? 1 : -1; st = lead < 0 ? 'SHELL' : `SHELL · ${Math.round(Math.abs(k) * 100)}% ${tn(lead)}`; }
    else if (f.phase === 'reforming') st = 'SHELL RE-FORMING';
    else if (f.phase === 'free') st = 'FREE — GRAB IT!';
    else if (f.phase === 'resetting') st = 'BACK TO THE POND';
    if (st !== this.show.status) { this.show.status = st; this.status.textContent = st; }
    this.status.classList.toggle('is-fast', fast);
    // ---- the marker over the carrier (its team always; the enemy while it isn't swimming); not over your own head
    const H = G.match?.karp?.holder, local = G.match?.local;
    let mk = null;
    if (H && H.alive && H !== local && !(H.team !== me && f.holder?.hidden) && !el.classList.contains('is-mapopen')) {
      const p = this._proj(H.pos.x, H.pos.y + (H.form === 'squid' ? 1.15 : 2.4), H.pos.z);
      if (p) {
        let x = p.x, y = p.y;
        const inside = !p.behind && x > 40 && x < p.W - 40 && y > 70 && y < p.H - 40;
        let rot = 0;
        if (!inside) {
          let dx = x - p.W / 2, dy = y - p.H / 2; if (p.behind) { dx = -dx; dy = -dy; if (Math.abs(dx) + Math.abs(dy) < 1) dy = 1; }
          rot = Math.atan2(dy, dx);
          const k = Math.min((p.W / 2 - 56) / Math.max(1e-3, Math.abs(Math.cos(rot))), (p.H / 2 - 64) / Math.max(1e-3, Math.abs(Math.sin(rot))));
          x = p.W / 2 + Math.cos(rot) * k; y = p.H / 2 + Math.sin(rot) * k;
        }
        const secs = Math.max(0, Math.ceil(f.fuse)), dist = local ? Math.round(H.pos.distanceTo(local.pos)) : 0;
        mk = { x: +x.toFixed(1), y: +y.toFixed(1), secs, fast: f.rate > 1, onScreen: inside, dist, team: H.team };
        this.mk.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        this.mk.style.setProperty('--kc', G.teamHex?.[H.team] || '#ffd27a');
        this.mk.style.setProperty('--rot', `${rot.toFixed(3)}rad`);
        const pill = this.mk.children[1];
        if (pill.children[1].textContent !== String(secs)) {
          pill.children[1].textContent = String(secs);
          if (secs <= 10) { this.mk.classList.remove('is-beat'); void this.mk.offsetWidth; this.mk.classList.add('is-beat'); }
        }
        this.mk.children[2].textContent = inside ? '' : `${dist}m`;
        this.mk.classList.toggle('is-red', secs <= 10);
        this.mk.classList.toggle('is-fast', mk.fast);
        this.mk.classList.toggle('is-pin', !inside);
      }
    }
    this.mk.classList.toggle('is-on', !!mk);
    this.show.marker = mk;
    // ---- the carrier's own reticle (fuse ring, seconds, charge ring)
    const carry = !!f.carrying && !!local?.alive;
    el.classList.toggle('is-karpcarry', carry);
    if (carry) {
      const fs = Math.max(0, f.fuseShown), secs = Math.ceil(fs), g = local.carry?.gun, c = g && (g.charging || g.tap) ? g.c : 0;
      this._fuseEl.style.strokeDashoffset = (this._C1 * (1 - Math.min(1, fs / K.fuse))).toFixed(2);
      this._chEl.style.strokeDashoffset = (this._C2 * (1 - c)).toFixed(2);
      const b = this.ret.querySelector('b');
      if (b.textContent !== String(secs)) { b.textContent = String(secs); if (secs <= 10) this.hud._restart?.(this.ret, 'is-beat'); }
      this.ret.classList.toggle('is-red', secs <= 10);
      this.ret.classList.toggle('is-fast', f.rate > 1);
      this.ret.classList.toggle('is-full', c >= 1);
      this.show.reticle = { secs, charge: +c.toFixed(2), fast: f.rate > 1 };
    } else this.show.reticle = null;
    // ---- the carrier's own bottom line
    let bt = null;
    if (carry && f.rate > 1) bt = f.why === 'zone' ? ['CARP-FREE ZONE!', 'Fuse burning 3× — get out'] : ["DON'T RETREAT!", 'Fuse burning 3× — turn around'];
    if ((bt && bt[0]) !== (this.show.bottom && this.show.bottom[0])) {
      this.show.bottom = bt;
      if (bt) { const tx = this.bot.children[1]; tx.children[0].textContent = bt[0]; tx.children[1].textContent = bt[1]; this.bot.classList.remove('is-on'); void this.bot.offsetWidth; }
    }
    this.bot.classList.toggle('is-on', !!bt);
    // ---- the shell's meter tag
    let sh = null;
    if (f.shell === 'intact' && f.shellC && !el.classList.contains('is-mapopen')) {
      const cam = G.rig?.gameCam || G.camera, cp = cam?.position;
      const d = cp ? Math.hypot(cp.x - f.shellC[0], cp.y - f.shellC[1], cp.z - f.shellC[2]) : 99;
      const p = d <= 45 ? this._proj(f.shellC[0], f.shellC[1] + f.shellR + 0.55, f.shellC[2]) : null;
      const u = p ? Math.min(p.W / 100, (p.H * 1.7778) / 100) : 0, sc = Math.max(0.6, Math.min(1.15, 22 / Math.max(1, d))), hw = 3.4 * u * sc;
      // (never up in the top bar: below the Carp Line's status pill — a raised Pond put it over the line; [karp-face]
      // and not at all where it would sit right under that pill, which already says the same: SHELL · 66% OURS)
      const lim = this._topY > 0 ? this._topY + 2.9 * u * sc : 0;
      const tucked = !!p && p.y < lim && p.x + hw > this._stL && p.x - hw < this._stR;
      if (p && !tucked && !p.behind && p.x > 0 && p.x < p.W && p.y > 0 && p.y < p.H) {
        if (lim) p.y = Math.max(p.y, lim);
        const k = f.hp > 0 ? f.meter / f.hp : 0, mine = me === 0 ? k : -k;   // > 0: your team's way
        const m = 0.5 + 0.5 * Math.max(-1, Math.min(1, mine));
        this.shellTag.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        this.shellTag.style.setProperty('--m', m.toFixed(3));
        const lbl = Math.abs(k) < 0.005 ? 'ROE SHELL' : `${Math.round(Math.abs(k) * 100)}% ${mine > 0 ? 'OURS' : 'THEIRS'}`;
        const ls = this.shellTag.firstChild.lastChild; if (ls.textContent !== lbl) ls.textContent = lbl;
        this.shellTag.classList.toggle('is-warn', Math.abs(k) >= 0.75);
        const under = this._hits(calls, p.x - hw, p.x + hw, p.y - 2.9 * u * sc, p.y);
        this.shellTag.classList.toggle('is-under', under);
        sh = { m: +m.toFixed(3), label: lbl, x: +p.x.toFixed(1), y: +p.y.toFixed(1), under };
      }
    }
    this.shellTag.classList.toggle('is-on', !!sh);
    this.show.shell = sh;
    // ---- tags: the count each of your standing weirs gives; GATE over your risen Gate
    const want = [];
    if (!el.classList.contains('is-mapopen') && G.match?.state === 'playing') {
      for (const w of f.weirs[me] || []) if (!w.lowered) want.push({ key: `w${w.index}`, pos: w.pos, y: 3.1, text: String(w.count), gate: false });
      const g = f.gates[me]; if (g && g.up) want.push({ key: 'g', pos: g.pos, y: 6.4, text: 'GATE', gate: true });
    }
    this._tags(want, calls);
    // ---- THEY'RE AT THE GATE! (their carrier ≤ 15 from our open Gate), once per carry
    if (f.holder && f.holderTeam === them && f.gates[them]?.up && f.count[them] <= 15) { if (!this._gateCall) { this._gateCall = true; this._call(them, null, null, "THEY'RE AT THE GATE!", 'DEFEND IT!'); } }
    else if (!f.holder) this._gateCall = false;
  }
  // the Carp Line
  _line(f, me, them) {
    const S = this.show.line || (this.show.line = {});
    // weirs: once per match (their counts are fixed); their lowered state each frame
    const key = `${me}|${f.weirs[0].length}|${f.weirs[1].length}`;
    if (this._weirKey !== key) {
      this._weirKey = key;
      this.lWeirs.replaceChildren();
      for (const t of [me, them]) for (const w of f.weirs[t]) {
        const d = h('i', { class: 'iw-kl__weir ' + (t === me ? 'is-mine' : 'is-theirs') });
        d.style.setProperty('--x', (t === me ? 0.5 + 0.5 * (1 - w.count / 100) : 0.5 - 0.5 * (1 - w.count / 100)).toFixed(4));
        d._t = t; d._i = w.index; this.lWeirs.appendChild(d);
      }
    }
    for (const d of this.lWeirs.children) d.classList.toggle('is-low', !!f.weirs[d._t]?.[0]?.lowered);
    // best notches and the runs from the Pond
    const xMe = 0.5 + 0.5 * (1 - f.count[me] / 100), xThem = 0.5 - 0.5 * (1 - f.count[them] / 100);
    this.lBest[1].style.setProperty('--x', xMe.toFixed(4)); this.lBest[0].style.setProperty('--x', xThem.toFixed(4));
    this.lRun[1].style.width = `calc(${((xMe - 0.5) * 100).toFixed(2)}% - 3px)`; this.lRun[0].style.width = `calc(${((0.5 - xThem) * 100).toFixed(2)}% - 3px)`;
    this.lRun[1].style.display = xMe > 0.505 ? '' : 'none'; this.lRun[0].style.display = xThem < 0.495 ? '' : 'none';
    this.lGate[1].classList.toggle('is-up', !!f.gates[me]?.up); this.lGate[0].classList.toggle('is-up', !!f.gates[them]?.up);
    // the carp marker: where the Bazookarp is, by the field (10 Hz)
    if ((this._lT = (this._lT || 0) - (1 / 60)) <= 0) {
      this._lT = 0.1;
      const Kp = G.match?.karp, F = Kp?.field;
      const P = Kp?.holder ? Kp.holder.pos : Kp?.pos;
      if (F && P && f.phase !== 'resetting' && !(f.holder && f.holder.hidden && f.holder.team !== me)) {   // ([karp-face] held still while their carrier swims hidden, S31)
        const rm = F.fieldAt(me, P), rt = F.fieldAt(them, P);
        if (rm && rt && Number.isFinite(rm.d) && Number.isFinite(rt.d)) {
          const pm = f.len[me] - rm.d, pt = f.len[them] - rt.d;
          this._cx = pm >= 0 && pm >= pt ? 0.5 + 0.5 * Math.min(1, pm / Math.max(1, f.len[me])) : 0.5 - 0.5 * Math.min(1, Math.max(0, pt) / Math.max(1, f.len[them]));
        }
      } else if (f.phase === 'resetting') this._cx = 0.5;
    }
    const cx = this._cx ?? 0.5;
    this.lCarp.style.setProperty('--x', cx.toFixed(4));
    const side = f.holder ? (f.holder.team === me ? 'mine' : 'theirs') : 'neutral';
    if (this.line.dataset.side !== side) this.line.dataset.side = side;
    const held = f.phase === 'carried' && !!f.holder, secs = held ? Math.max(0, Math.ceil(f.carrying ? f.fuseShown : f.fuse)) : 0;
    this.lCarp.classList.toggle('is-held', held);
    this.lCarp.classList.toggle('is-moving', held);
    this.lCarp.classList.toggle('is-red', held && secs <= 10);
    const b = this.lCarp.lastChild, bt = held ? `${secs}${f.rate > 1 ? ' ×3' : ''}` : '';
    if (b.textContent !== bt) b.textContent = bt;
    // overtime: the gold frame, the window draining
    this.line.classList.toggle('is-ot', !!f.overtime);
    const win = f.overtime && f.window >= 0;
    this.line.classList.toggle('is-win', win);
    if (win) this.lWin.style.setProperty('--w', Math.max(0, Math.min(1, f.window / K.otPick)).toFixed(3));
    Object.assign(S, { carp: +cx.toFixed(3), best: [+xThem.toFixed(3), +xMe.toFixed(3)], held, secs, ot: !!f.overtime, win: win ? +f.window.toFixed(2) : -1, gates: [!!f.gates[them]?.up, !!f.gates[me]?.up],
      weirs: [...this.lWeirs.children].map((d) => ({ mine: d._t === me, x: +d.style.getPropertyValue('--x'), low: d.classList.contains('is-low') })) });
  }
  // [karp-face] the TAB map's jump bubbles: the carrier's wears the carp (an ally carrier's bubble sits on its map icon)
  _beacons() {
    const H = this.hud, bs = H.beacons;
    if (!bs) return;
    const open = H.el.classList.contains('is-mapopen'), Kh = G.match?.karp?.holder || null;
    const tg = open && Kh ? H._beaconTargets?.() : null;
    for (let i = 0; i < bs.length; i++) {
      const on = !!(tg && tg[i] && tg[i].actor === Kh), el = bs[i];
      if (on && !el._karp) { el._karp = h('i', { class: 'iw-bcn__karp', html: KARP_GLYPH }); el.appendChild(el._karp); }
      if (el.classList.contains('is-karp') !== on) el.classList.toggle('is-karp', on);
    }
  }
  // [karp-face] the live call-outs' boxes (hud px): the kill call-out's measured once when it appears (its scale
  // animation aside it stands still) — and while it is live ours sit under it (has-kcall, --kcb); ours each frame
  _callRects() {
    const H = this.hud, out = [], kc = H.callouts?.querySelector('.iw-call') || null;
    if (kc !== this._kc) { this._kc = kc; if (kc) { this._kcH = kc.offsetHeight / 2; this._kcW = kc.offsetWidth / 2; } H.el.classList.toggle('has-kcall', !!kc); }
    if (kc) {   // (its anchor each frame: the jump alerts' row moves the layer down while it is up — has-jal)
      const a = H.callouts.getBoundingClientRect(), x = a.left - (this._ox || 0), y = a.top - (this._oy || 0), hh = this._kcH, hw = this._kcW;
      const u = Math.min(H.el.clientWidth / 100, (H.el.clientHeight * 1.7778) / 100), b = Math.round(y + hh + 0.6 * u);
      this._kcR = { l: x - hw, r: x + hw, t: y - hh, b: y + hh };
      if (b !== this._kcb) { this._kcb = b; H.el.style.setProperty('--kcb', `${b}px`); }
    }
    if (kc) out.push(this._kcR);
    if (H.zcalls) for (const z of H.zcalls.children) { const r = z.getBoundingClientRect(); if (r.width > 0) out.push({ l: r.left - (this._ox || 0), r: r.right - (this._ox || 0), t: r.top - (this._oy || 0), b: r.bottom - (this._oy || 0) }); }
    this.show.calls = out.length;
    return out;
  }
  _hits(rs, l, r, t, b) { for (const q of rs) if (r > q.l && l < q.r && b > q.t && t < q.b) return true; return false; }
  _tags(want, calls = []) {
    const box = this.tags;
    const els = this._tagEls;
    while (els.length < want.length) { const e = h('div', { class: 'iw-ktag' }, h('span', { class: 'iw-ktag__pill' })); box.appendChild(e); els.push(e); }
    const shown = [];
    els.forEach((e, i) => {
      const w = want[i];
      let on = !!w, p = null;
      if (on) { p = this._proj(w.pos[0], w.pos[1] + w.y, w.pos[2]); on = !!p && !p.behind && p.x > 0 && p.x < p.W && p.y > 0 && p.y < p.H; }
      e.classList.toggle('is-on', on);
      if (!on) return;
      const cam = G.rig?.gameCam || G.camera, cp = cam.position, d = Math.hypot(cp.x - w.pos[0], cp.y - w.pos[1], cp.z - w.pos[2]);
      const sc = Math.max(0.55, Math.min(1.1, 26 / Math.max(1, d)));
      e.classList.toggle('is-gate', w.gate);
      if (e.firstChild.textContent !== w.text) { e.firstChild.textContent = w.text; e._w = 0; }
      if (!e._w) { e._w = e.firstChild.offsetWidth || 40; e._h = e.firstChild.offsetHeight || 20; }
      // ([karp-face] never up in the top bar — the GATE tag covered the match timer as you carried it in; and out of
      // the way of a live call-out: a weir's 45 sat on BURST THE ROE SHELL! and OVERTIME! at 960×600)
      const hw = (e._w * sc) / 2, hh = e._h * sc;
      let y = p.y;
      if (this._topY > 0) y = Math.max(y, this._topY + 4 + hh);
      const under = this._hits(calls, p.x - hw, p.x + hw, y - hh, y);
      e.classList.toggle('is-under', under);
      e.style.transform = `translate(${p.x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      shown.push(w.text);
      (this.show.tagBoxes || (this.show.tagBoxes = []))[shown.length - 1] = { text: w.text, l: +(p.x - hw).toFixed(1), r: +(p.x + hw).toFixed(1), t: +(y - hh).toFixed(1), b: +y.toFixed(1), under };
    });
    this.show.tags = shown;
    if (this.show.tagBoxes) this.show.tagBoxes.length = shown.length;
  }
  state() { return { on: this.on, ...this.show, cues: this.cues.played.slice(-12) }; }
  dispose() { clearTimeout(this._sayLater); this._unsubs.forEach((u) => u()); this.cues.dispose(); for (const e of [this.line, this.mk, this.ret, this.bot, this.no, this.shellTag, this.tags]) e.remove(); }
}

// ================================================================================================ the maps (minimap.js)
// layer 'under': the free zones (hatched in the owner's ink), the halfway line (TAB map only), weirs, Gates.
// layer 'over': the Bazookarp itself (on top of everything). c: the map's 2D context; mm: the Minimap (toCanvas,
// viewerTeam, flip); s: pixels per metre; hex: the team colours; t: its clock.
const _P = {};
function karpPath() { if (!_P.body) { _P.body = new Path2D(KP.body); _P.tail = new Path2D(KP.tail); _P.fin = new Path2D(KP.fin); } return _P; }
function drawCarp(c, x, y, R, fill, rot = 0) {
  const P = karpPath(), k = (R * 2) / 32;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.translate(-16, -16);
  c.lineJoin = 'round'; c.lineWidth = 2.6 / Math.max(0.6, k * 0.5); c.strokeStyle = '#15121c'; c.fillStyle = fill;
  for (const p of [P.tail, P.fin, P.body]) { c.fill(p); c.stroke(p); }
  c.fillStyle = '#15121c'; c.beginPath(); c.arc(25.6, 14.2, 1.9, 0, Math.PI * 2); c.fill();
  c.restore();
}
function hatch(c, hex) {
  const key = 'h' + hex;
  if (!_P[key]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 12;
    const x = cv.getContext('2d'); x.strokeStyle = hex; x.lineWidth = 3.2; x.globalAlpha = 0.85;
    x.beginPath(); x.moveTo(-3, 15); x.lineTo(15, -3); x.moveTo(-3, 3); x.lineTo(3, -3); x.moveTo(9, 15); x.lineTo(15, 9); x.stroke();
    _P[key] = c.createPattern(cv, 'repeat');
  }
  return _P[key];
}
export function drawKarpMap(c, mm, tc, s, hex, t, layer = 'under') {
  const Kp = G.match && !G.match.attract ? G.match.karp : null;
  if (!Kp) return;
  const TAU = Math.PI * 2;
  const big = G.game?.hud?.el?.classList.contains('is-mapopen') ? 1.3 : 1;   // ([karp-face] the TAB map's marks a touch bigger)
  c.save();
  if (layer === 'under') {
    // free zones
    if (mm._kzFor !== Kp || mm._kzFlip !== mm.flip) {
      mm._kzFor = Kp; mm._kzFlip = mm.flip;
      mm._kz = [0, 1].map((tm) => Kp.R.zones[tm].map((z) => { const p = new Path2D(); z.poly.forEach(([x, zz], i) => { mm.toCanvas(x, zz, tc); if (i) p.lineTo(tc.x, tc.y); else p.moveTo(tc.x, tc.y); }); p.closePath(); return p; }));
      // the halfway line: nodes where the two walks are nearly equal (the field's own line)
      const F = Kp.field, D0 = F.D?.[0], D1 = F.D?.[1], pts = [];
      if (D0 && D1 && G.nav) for (const id of G.nav.validIds || []) { const a = D0[id], b = D1[id]; if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.9) { const n = G.nav.nodes[id]; mm.toCanvas(n.x, n.z, tc); pts.push(tc.x, tc.y); } }
      mm._kHalf = pts;
    }
    for (const tm of [0, 1]) for (const p of mm._kz[tm]) {
      c.globalAlpha = 0.2; c.fillStyle = hex[tm]; c.fill(p);
      c.globalAlpha = 0.55; c.fillStyle = hatch(c, hex[tm]); c.fill(p);
      c.globalAlpha = 0.9; c.lineWidth = 0.4 * s; c.strokeStyle = hex[tm]; c.setLineDash([0.9 * s, 0.6 * s]); c.stroke(p); c.setLineDash([]);
    }
    if (big > 1 && mm._kHalf?.length) {
      c.globalAlpha = 0.75; c.fillStyle = '#ffffff';
      const r = Math.max(1.2, 0.42 * s);
      for (let i = 0; i < mm._kHalf.length; i += 2) { c.beginPath(); c.arc(mm._kHalf[i], mm._kHalf[i + 1], r, 0, TAU); c.fill(); }
    }
    // weirs: diamonds in the attacking team's ink, grey once lowered
    for (const list of Kp.weirs) for (const w of list) {
      mm.toCanvas(w.pos.x, w.pos.z, tc);
      const r = 1.05 * s * big;
      c.globalAlpha = 1; c.fillStyle = Kp.lowered[w.team] ? '#8a8d96' : hex[w.team]; c.strokeStyle = '#15121c'; c.lineWidth = 0.4 * s;
      c.beginPath(); c.moveTo(tc.x, tc.y - r); c.lineTo(tc.x + r, tc.y); c.lineTo(tc.x, tc.y + r); c.lineTo(tc.x - r, tc.y); c.closePath(); c.fill(); c.stroke();
    }
    // Gates: a ring; a padlock while sealed; filled and pulsing once risen
    for (const g of Kp.gates) {
      mm.toCanvas(g.pos.x, g.pos.z, tc);
      const up = Kp.gateUp[g.team], R = 1.7 * s * big, pulse = 0.5 + 0.5 * Math.sin(t * 4 + g.team);
      if (up) { c.globalAlpha = 0.3 + 0.3 * pulse; c.fillStyle = hex[g.team]; c.beginPath(); c.arc(tc.x, tc.y, R * (1.4 + 0.3 * pulse), 0, TAU); c.fill(); }
      c.globalAlpha = 1; c.lineWidth = 0.75 * s; c.strokeStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y, R, 0, TAU); c.stroke();
      c.lineWidth = 0.4 * s; c.strokeStyle = up ? '#ffffff' : hex[g.team]; c.stroke();
      if (up) { c.fillStyle = hex[g.team]; c.beginPath(); c.arc(tc.x, tc.y, R * 0.62, 0, TAU); c.fill(); }
      else {   // the padlock
        const k = R * 0.5;
        c.fillStyle = '#15121c'; c.fillRect(tc.x - k * 0.75, tc.y - k * 0.1, k * 1.5, k * 1.05);
        c.lineWidth = 0.28 * s; c.strokeStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y - k * 0.1, k * 0.48, Math.PI, 0); c.stroke();
      }
    }
  } else {
    // the Bazookarp
    const H = Kp.holder, me = mm.viewerTeam ?? G.match?.local?.team ?? 0;
    const R = 1.75 * s;
    if (Kp.phase === 'resetting') {
      mm.toCanvas(Kp.from.x, Kp.from.z, tc); const fx = tc.x, fy = tc.y;
      mm.toCanvas(Kp.R.pond.x, Kp.R.pond.z, tc);
      c.globalAlpha = 0.9; c.strokeStyle = '#ffd27a'; c.lineWidth = 0.55 * s; c.setLineDash([0.8 * s, 0.7 * s]); c.lineDashOffset = -t * 6 * s;
      const mx = (fx + tc.x) / 2, my = (fy + tc.y) / 2 - Math.hypot(tc.x - fx, tc.y - fy) * 0.25;
      c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(mx, my, tc.x, tc.y); c.stroke(); c.setLineDash([]);
    }
    if (H) {
      if (H.alive && (H.team === me || !Kp.hidden(H))) {
        mm.toCanvas(H.pos.x, H.pos.z, tc);
        const col = hex[H.team], left = Math.max(0, Math.min(1, (H === G.match?.local ? Kp.hud.fuseShown : Kp.fuse) / K.fuse));
        c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 6); c.fillStyle = col; c.beginPath(); c.arc(tc.x, tc.y, R * 1.9, 0, TAU); c.fill();
        c.globalAlpha = 1; c.lineWidth = 0.7 * s; c.strokeStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y, R * 1.45, 0, TAU); c.stroke();
        c.lineWidth = 0.45 * s; c.strokeStyle = Kp.fuse <= 10 ? '#ff5a4a' : '#ffffff'; c.beginPath(); c.arc(tc.x, tc.y, R * 1.45, -Math.PI / 2, -Math.PI / 2 + left * TAU); c.stroke();
        // (the carp rides above the carrier's own marker, which the big map draws on top: a tether down to it)
        const ox = tc.x + R * 1.1, oy = tc.y - R * 2.1;
        c.lineWidth = 0.35 * s; c.strokeStyle = '#15121c'; c.beginPath(); c.moveTo(tc.x, tc.y); c.lineTo(ox, oy); c.stroke();
        drawCarp(c, ox, oy, R * 1.25, col);
      }
    } else if (Kp.phase !== 'done') {
      mm.toCanvas(Kp.pos.x, Kp.pos.z, tc);
      const sh = Kp.shell, ring = sh.state !== 'none';
      if (ring) {
        const k = sh.hp > 0 ? sh.meter / sh.hp : 0;
        c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(tc.x, tc.y, R * 1.55, 0, TAU); c.fill();
        if (Math.abs(k) > 0.01) { c.fillStyle = hex[k > 0 ? 0 : 1]; c.beginPath(); c.moveTo(tc.x, tc.y); c.arc(tc.x, tc.y, R * 1.55, -Math.PI / 2, -Math.PI / 2 + Math.abs(k) * TAU); c.closePath(); c.fill(); }
        c.lineWidth = 0.5 * s; c.strokeStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y, R * 1.55, 0, TAU); c.stroke();
        c.lineWidth = 0.3 * s; c.strokeStyle = '#ffffff'; c.stroke();
      } else if (Kp.phase === 'free') { c.globalAlpha = 0.45 + 0.3 * Math.sin(t * 8); c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(tc.x, tc.y, R * 1.8, 0, TAU); c.fill(); c.globalAlpha = 1; }
      drawCarp(c, tc.x, tc.y, R, '#ffd27a');
    }
  }
  c.restore();
}
