// Glide Bomb (kit sub 'glide') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §A.
//
// [b5-subscaf] A STUB. The kind is registered end to end: SUBS.glide, SUB_ORDER and SUB_VIEW_SCALE in config.js; this
// file's placeholder model (registerSubModel) and icon (SUB_ICONS); SUB_KITS.glide. So the loadout picker, the lobby
// chips, the HUD badge and a kid holding it all work. Using it is refused through the runner's "Can't use" path:
// blocked() is always true, so no ink is paid, the HUD shows its callout and bonk, and the console says
// '[glide] not built yet' (at most once a second). use() refuses the same way, refunding the ink, for any caller that
// skips blocked(). Bots never throw it (bot.fight / bot.paint return false; the other bot throw paths need THROWN.glide).
// Nothing goes on the wire. The glide builder replaces this whole file (and drops `stub`, which the tests key on).
import * as THREE from 'three';
import { emit } from '../../core/ctx.js';
import { PLAYER } from '../../config.js';
import { SUB_KITS } from './registry.js';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { lathe } from '../character-geo.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const KIND = 'glide';
const { Parts, C, M, hring, gripSleeve } = GEO_KIT;
const V3 = THREE.Vector3;

// ---- placeholder model (prop space: origin at the bottom centre, +Y up, +Z forward): a curling stone — rubber skirt,
// cream body, dark band, team-ink dome, a knob on top for the left fist (the Splat Bomb's hold)
function buildGlide() {
  const P = new Parts(), I = new Parts();
  P.add(lathe([[0, 0], [0.086, 0], [0.094, 0.005], [0.094, 0.012], [0, 0.012]], 32), C.rubber, M.rubber);
  P.add(lathe([[0, 0.01], [0.09, 0.01], [0.097, 0.024], [0.095, 0.039], [0.09, 0.045], [0, 0.045]], 32), C.cream, M.satin);
  P.add(hring(0.093, 0.0045, 0.045, 6, 32), C.dark, M.gloss);
  I.add(lathe([[0, 0.044], [0.089, 0.044], [0.08, 0.057], [0.055, 0.067], [0.02, 0.071], [0, 0.0715]], 32));
  P.add(lathe([[0, 0.068], [0.016, 0.068], [0.017, 0.073], [0, 0.074]], 16), C.dark, M.gloss);
  P.add(gripSleeve(0.072, 0.102), C.rubber, M.rubber);
  return { kind: KIND, body: P.build(), ink: I.build(), grip: { pos: new V3(0, 0.087, 0), handZ: new V3(0, 1, 0), handY: new V3(0.3, 0.1, -1) } };
}
registerSubModel(KIND, buildGlide);

// ---- placeholder icon (the roster style: dark outline, light fills, team colour = currentColor): the stone side on,
// speed lines behind it, a lane of ink under it
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const SL = 'M2.5 31 L9 31 M4.5 39 L9.5 39 M2.5 47 L8 47';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <path d="M12 58 L60 58" stroke="currentColor" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="${K}" stroke-width="6.5" stroke-linecap="round"><path d="${SL}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${SL}"/></g>
    <path d="M37 24 L37 15 Q37 11.5 40.5 11.5 L52 11.5" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/>
    <path d="M37 24 L37 15 Q37 11.5 40.5 11.5 L52 11.5" fill="none" stroke="${DK}" stroke-width="3.5" stroke-linecap="round"/>
    <g ${O}>
      <path d="M15 40 L59 40 Q61.5 50 54 54 L20 54 Q12.5 50 15 40 Z" fill="${LT}"/>
      <path d="M16 37 Q19 23 37 23 Q55 23 58 37 Z" fill="currentColor"/>
      <rect x="12.5" y="35" width="49" height="6.5" rx="3.2" fill="${DK}"/>
    </g>
    <circle cx="27" cy="38.2" r="1.7" fill="#fff"/><circle cx="37" cy="38.2" r="1.7" fill="#fff"/><circle cx="47" cy="38.2" r="1.7" fill="#fff"/>
    <path d="M23 31 Q26.5 27 33 26" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// ---- the kit: refuses until it's built
let warnT = -Infinity;
function notBuilt() {
  const t = performance.now();
  if (t - warnT >= 1000) { warnT = t; console.warn(`[${KIND}] not built yet`); }
}
SUB_KITS[KIND] = {
  stub: true,
  noArc: true,                                     // (no bomb-arc preview while held: nothing will fly)
  blocked() { notBuilt(); return true; },          // the runner's "Can't use": no ink paid, the HUD callout and bonk
  blockedWhy: () => 'Not built yet',
  use(subs, a, sub) {                              // (a caller that skipped blocked(): refund the ink and refuse the same way)
    notBuilt();
    if (a && sub && a.specialActive?.kind !== 'barrage') a.ink = Math.min(PLAYER.inkMax, a.ink + (sub.inkCost || 0));
    emit('sub:cantuse', { actor: a, kind: KIND });
  },
  bot: { fight: () => false, paint: () => false },  // bots never throw it
};
