// Scrap Sentry (kit sub 'sentry') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §B.
//
// [b5-subscaf] A STUB. The kind is registered end to end: SUBS.sentry, SUB_ORDER and SUB_VIEW_SCALE in config.js; this
// file's placeholder model (registerSubModel) and icon (SUB_ICONS); SUB_KITS.sentry. So the loadout picker, the lobby
// chips, the HUD badge and a kid holding it all work. Using it is refused through the runner's "Can't use" path:
// blocked() is always true, so no ink is paid, the HUD shows its callout and bonk, and the console says
// '[sentry] not built yet' (at most once a second). use() refuses the same way, refunding the ink, for any caller that
// skips blocked(). Bots never place it (bot.fight / bot.paint return false). Nothing goes on the wire. The sentry
// builder replaces this whole file (and drops `stub`, which the tests key on).
import * as THREE from 'three';
import { emit } from '../../core/ctx.js';
import { PLAYER } from '../../config.js';
import { SUB_KITS } from './registry.js';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { lathe, superEllipsoid } from '../character-geo.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const KIND = 'sentry';
const { Parts, C, M, at, orient, latheZ, gripSleeve } = GEO_KIT;
const V3 = THREE.Vector3;
const RUST = '#b4623a', TEAL = '#5fb3a8', COPPER = '#c8793e', TAPE = '#9aa0a6';

// ---- placeholder model (prop space: origin at the bottom centre, +Y up, +Z forward): three splayed legs with red cap
// feet, a rusty can, a teal bottle head with a team-ink window and a copper barrel forward, a knob on top for the fist
function buildSentry() {
  const P = new Parts(), I = new Parts();
  for (let k = 0; k < 3; k++) {
    const az = Math.PI / 3 + k * (Math.PI * 2 / 3), out = new V3(Math.sin(az), 0, Math.cos(az));
    const top = new V3(out.x * 0.018, 0.062, out.z * 0.018), foot = new V3(out.x * 0.058, 0.006, out.z * 0.058);
    const d = foot.clone().sub(top), len = d.length();
    P.add(orient(superEllipsoid(0.0035, len / 2, 0.0035, 1, 1, 6, 4), d, top.clone().addScaledVector(d, 0.5)), C.gunmetal, M.metal);
    P.add(at(lathe([[0, 0], [0.0085, 0], [0.009, 0.004], [0.007, 0.0065], [0, 0.0065]], 12), foot.x, 0, foot.z), C.red, M.gloss);
  }
  P.add(lathe([[0, 0.056], [0.028, 0.056], [0.03, 0.06], [0.03, 0.108], [0.028, 0.112], [0, 0.112]], 20), RUST, M.satin);
  P.add(lathe([[0, 0.11], [0.008, 0.11], [0.008, 0.122], [0, 0.122]], 10), C.dark, M.gloss);
  P.add(at(superEllipsoid(0.022, 0.021, 0.042, 0.8, 1, 16, 10), 0, 0.142, 0), TEAL, M.gloss);
  I.add(at(superEllipsoid(0.0232, 0.016, 0.022, 0.8, 1, 16, 10), 0, 0.14, -0.008));
  P.add(at(superEllipsoid(0.0236, 0.0225, 0.005, 0.7, 1, 14, 6), 0, 0.142, 0.018), TAPE, M.satin);
  P.add(at(latheZ([[0, 0.04], [0.0065, 0.04], [0.0065, 0.072], [0.0085, 0.073], [0.0085, 0.079], [0, 0.079]], 12), 0, 0.142, 0), COPPER, M.metal);
  P.add(lathe([[0, 0.16], [0.0105, 0.16], [0.0105, 0.165], [0, 0.166]], 12), C.dark, M.gloss);
  P.add(gripSleeve(0.163, 0.191), C.rubber, M.rubber);
  return { kind: KIND, body: P.build(), ink: I.build(), grip: { pos: new V3(0, 0.177, 0), handZ: new V3(0, 1, 0), handY: new V3(0.3, 0.1, -1) } };
}
registerSubModel(KIND, buildSentry);

// ---- placeholder icon (the roster style: dark outline, light fills, team colour = currentColor): three splayed legs on
// red cap feet, a rust can, the teal bottle head pointing right with its copper barrel and tape band, the cap lamp in
// team colour, an ink drop leaving the muzzle
{
  const K = '#15121c', DK = '#2b2735';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const LEGS = 'M27 44 L12 56 M32 45 L32 58 M37 44 L52 56';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="6.5" stroke-linecap="round"><path d="${LEGS}"/></g>
    <g fill="none" stroke="#8f98a6" stroke-width="2.6" stroke-linecap="round"><path d="${LEGS}"/></g>
    <g ${O}>
      <ellipse cx="11" cy="57.5" rx="5" ry="3" fill="#ff3b30"/><ellipse cx="32" cy="59" rx="5" ry="3" fill="#ff3b30"/><ellipse cx="53" cy="57.5" rx="5" ry="3" fill="#ff3b30"/>
      <rect x="21" y="29" width="22" height="17" rx="2.5" fill="${RUST}"/>
      <rect x="44" y="18.5" width="13" height="7" rx="1.5" fill="${COPPER}"/>
      <rect x="9" y="12" width="37" height="18" rx="9" fill="${TEAL}"/>
      <rect x="25" y="11" width="6" height="20" rx="1.5" fill="${TAPE}"/>
      <circle cx="17" cy="6.5" r="4" fill="currentColor"/>
    </g>
    <path d="M14 17 Q17 14.5 22 14.5" stroke="#fff" stroke-opacity=".6" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M24 34 L40 34 M24 39.5 L40 39.5" stroke="${DK}" stroke-opacity=".45" stroke-width="2"/>
    <path d="M60.5 16.5 Q63 21.5 60.5 23.5 Q58 21.5 60.5 16.5 Z" fill="currentColor" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
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
  noArc: true,                                     // (SUBS.sentry.placed hides the bomb arc too)
  blocked() { notBuilt(); return true; },          // the runner's "Can't use": no ink paid, the HUD callout and bonk
  blockedWhy: () => 'Not built yet',
  use(subs, a, sub) {                              // (a caller that skipped blocked(): refund the ink and refuse the same way)
    notBuilt();
    if (a && sub && a.specialActive?.kind !== 'barrage') a.ink = Math.min(PLAYER.inkMax, a.ink + (sub.inkCost || 0));
    emit('sub:cantuse', { actor: a, kind: KIND });
  },
  bot: { fight: () => false, paint: () => false },  // bots never place it
};
