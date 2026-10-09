// Dash Pellet (kit sub 'dash') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §D.
//
// [b5-subscaf] A STUB. The kind is registered end to end: SUBS.dash, SUB_ORDER and SUB_VIEW_SCALE in config.js; this
// file's placeholder model (registerSubModel) and icon (SUB_ICONS); SUB_KITS.dash. So the loadout picker, the lobby
// chips, the HUD badge and a kid holding it all work. Using it is refused through the runner's "Can't use" path:
// blocked() is always true, so no ink is paid, the HUD shows its callout and bonk, and the console says
// '[dash] not built yet' (at most once a second). use() refuses the same way, refunding the ink, for any caller that
// skips blocked(). Bots never use it (bot.fight / bot.paint return false). Nothing goes on the wire. The dash builder
// replaces this whole file (and drops `stub`, which the tests key on; the real one is an `onPress` kit, SPEC §0.5).
import * as THREE from 'three';
import { emit } from '../../core/ctx.js';
import { PLAYER } from '../../config.js';
import { SUB_KITS } from './registry.js';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { superEllipsoid } from '../character-geo.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const KIND = 'dash';
const { Parts, C, M, at, latheZ, orient } = GEO_KIT;
const V3 = THREE.Vector3;

// ---- placeholder model (prop space: origin at the bottom centre, +Y up, +Z forward): the Pop Pellet's capsule lying
// along Z — cream shells, a team-ink core band, four dark exhaust vents round the nose, swept tail fins, and the knurled
// tail stub the fist holds (the Pop Pellet's grip)
function buildDash() {
  const P = new Parts(), I = new Parts();
  const yc = 0.0345, Z = (g) => at(g, 0, yc, 0);
  P.add(Z(latheZ([[0, -0.047], [0.017, -0.045], [0.028, -0.038], [0.0334, -0.026], [0.0334, -0.018], [0, -0.018]], 20)), C.cream, M.gloss);
  I.add(Z(latheZ([[0, -0.019], [0.0322, -0.019], [0.0322, 0.027], [0, 0.027]], 20)));
  P.add(Z(latheZ([[0, 0.026], [0.0334, 0.026], [0.0334, 0.034], [0.029, 0.044], [0.021, 0.051], [0.012, 0.055], [0, 0.056]], 20)), C.cream, M.gloss);
  for (const z of [-0.0185, 0.0265]) P.add(Z(latheZ([[0, z - 0.0034], [0.0345, z - 0.0034], [0.0345, z + 0.0034], [0, z + 0.0034]], 20)), C.dark, M.gloss);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2, n = new V3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.83);
    P.add(orient(superEllipsoid(0.0058, 0.0028, 0.0058, 1, 1, 10, 5), n, new V3(Math.cos(a) * 0.017, yc + Math.sin(a) * 0.017, 0.051)), C.darker, M.satin);
  }
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2;
    const fin = superEllipsoid(0.0022, 0.012, 0.015, 0.6, 0.6, 4, 5, (q) => { q.z -= 0.6 * (q.y + 0.012) * 0.5; });
    fin.rotateZ(a - Math.PI / 2); P.add(Z(at(fin, Math.cos(a) * 0.031, Math.sin(a) * 0.031, -0.032)), C.cream, M.gloss);
  }
  P.add(Z(latheZ([[0, -0.0745], [0.0112, -0.074], [0.0126, -0.0695], [0.0122, -0.06], [0.0126, -0.051], [0.0118, -0.0465], [0, -0.046]], 12)), C.rubber, M.rubber);
  P.add(Z(latheZ([[0, -0.0785], [0.0082, -0.0785], [0.0104, -0.0768], [0.0106, -0.0738], [0, -0.0738]], 12)), C.metal, M.metal);
  return { kind: KIND, body: P.build(), ink: I.build(), grip: { pos: new V3(0, yc, -0.0625), handZ: new V3(0, 0, -1), handY: new V3(0.3, -1, 0.1) } };
}
registerSubModel(KIND, buildDash);

// ---- placeholder icon (the roster style: dark outline, light fills, team colour = currentColor): the pellet tilted up to
// the right, a curved motion arrow sweeping from behind it, a four-point burst at its tail
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const ARC = 'M4 61 Q4.5 45 14.5 38.5';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="7.5" stroke-linecap="round"><path d="${ARC}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="${ARC}"/></g>
    <path d="M18 35 L20.6 42.4 L28 45 L20.6 47.6 L18 55 L15.4 47.6 L8 45 L15.4 42.4 Z" fill="#fff" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>
    <g transform="rotate(-38 41 26)"><g ${O}>
      <path d="M20.5 20 L16 15 L24.5 18.5 Z M20.5 32 L16 37 L24.5 33.5 Z" fill="${LT}"/>
      <rect x="15" y="22" width="7.5" height="8" rx="2.5" fill="${DK}"/>
      <path d="M31 14.5 L28 14.5 Q21 14.5 21 26 Q21 37.5 28 37.5 L31 37.5 Z" fill="${LT}"/>
      <rect x="30" y="14.5" width="15" height="23" fill="currentColor"/>
      <path d="M44 14.5 L48 14.5 Q61 14.5 61 26 Q61 37.5 48 37.5 L44 37.5 Z" fill="${LT}"/>
      <rect x="28.5" y="13" width="4" height="26" rx="1.8" fill="${DK}"/>
      <rect x="42.5" y="13" width="4" height="26" rx="1.8" fill="${DK}"/>
    </g>
    <circle cx="57" cy="21.5" r="1.7" fill="${DK}"/><circle cx="57" cy="30.5" r="1.7" fill="${DK}"/>
    <path d="M33 19.5 L41 19.5" stroke="#fff" stroke-opacity=".6" stroke-width="2.8" stroke-linecap="round"/></g>
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
  bot: { fight: () => false, paint: () => false },  // bots never use it
};
