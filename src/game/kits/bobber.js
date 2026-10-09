// Chain Bobber (kit sub 'bobber') — see kits/registry.js and tools/botlab/jobs/batch5/subs/SPEC.md §C.
//
// [b5-subscaf] A STUB. The kind is registered end to end: SUBS.bobber, SUB_ORDER and SUB_VIEW_SCALE in config.js; this
// file's placeholder model (registerSubModel) and icon (SUB_ICONS); SUB_KITS.bobber. So the loadout picker, the lobby
// chips, the HUD badge and a kid holding it all work. Using it is refused through the runner's "Can't use" path:
// blocked() is always true, so no ink is paid, the HUD shows its callout and bonk, and the console says
// '[bobber] not built yet' (at most once a second). use() refuses the same way, refunding the ink, for any caller that
// skips blocked(). Bots never throw it (bot.fight / bot.paint return false; the other bot throw paths need
// THROWN.bobber). Nothing goes on the wire. The bobber builder replaces this whole file (and drops `stub`, which the
// tests key on; and `noArc`: the real one throws with the standard arc).
import * as THREE from 'three';
import { emit } from '../../core/ctx.js';
import { PLAYER } from '../../config.js';
import { SUB_KITS } from './registry.js';
import { registerSubModel, GEO_KIT } from '../character-weapons.js';
import { lathe, smoothProfile } from '../character-geo.js';
import { SUB_ICONS } from '../../ui/ui-icons.js';

const KIND = 'bobber';
const { Parts, C, M, at, torus, hring, gripSleeve } = GEO_KIT;
const V3 = THREE.Vector3;

// ---- placeholder model (prop space: origin at the bottom centre, +Y up, +Z forward): a fishing bobber — a keel spike,
// a cream lower half, a dark band, a team-ink upper half, a stem (the fist's grip) and a metal eye-ring on top
function buildBobber() {
  const P = new Parts(), I = new Parts();
  const R = 0.05, cy = 0.072;
  P.add(lathe([[0, 0], [0.004, 0.003], [0.009, 0.024], [0, 0.026]], 10), C.rubber, M.rubber);
  P.add(lathe([[0, cy - R]].concat(smoothProfile([[0.012, cy - R + 0.001], [R * 0.72, cy - R * 0.7], [R, cy - 0.002]], 10), [[0, cy - 0.002]]), 28), C.cream, M.gloss);
  P.add(hring(R + 0.001, 0.0042, cy, 6, 28), C.dark, M.gloss);
  I.add(lathe([[0, cy + 0.002]].concat(smoothProfile([[R, cy + 0.002], [R * 0.72, cy + R * 0.7], [0.012, cy + R - 0.001]], 10), [[0, cy + R]]), 28));
  P.add(gripSleeve(cy + R - 0.003, cy + R + 0.026, 0.0105), C.dark, M.satin);
  const ring = torus(0.0105, 0.0026, 6, 18); P.add(at(ring, 0, cy + R + 0.037, 0), C.metal, M.metal);
  return { kind: KIND, body: P.build(), ink: I.build(), grip: { pos: new V3(0, cy + R + 0.012, 0), handZ: new V3(0, 1, 0), handY: new V3(0.3, 0.1, -1) } };
}
registerSubModel(KIND, buildBobber);

// ---- placeholder icon (the roster style: dark outline, light fills, team colour = currentColor): two bobbers, the right
// one higher, joined by a wavy tether with a spark in the middle
{
  const K = '#15121c', DK = '#2b2735', LT = '#e4e8ef';
  const O = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const bob = (x, y) => `
      <path d="M${x - 1.8} ${y + 9} L${x} ${y + 14.5} L${x + 1.8} ${y + 9} Z" fill="${DK}"/>
      <path d="M${x} ${y - 10} L${x} ${y - 14.5}" fill="none"/>
      <circle cx="${x}" cy="${y - 17}" r="2.4" fill="none"/>
      <path d="M${x - 10} ${y} A10 10 0 0 0 ${x + 10} ${y} Z" fill="${LT}"/>
      <path d="M${x - 10} ${y} A10 10 0 0 1 ${x + 10} ${y} Z" fill="currentColor"/>
      <rect x="${x - 11.5}" y="${y - 2.3}" width="23" height="4.6" rx="2.3" fill="${DK}"/>`;
  const TETHER = 'M20.2 25.5 Q25 13.5 31.5 18.5 Q38 23.5 42.8 11.5';
  SUB_ICONS[KIND] = `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"><path d="${TETHER}"/></g>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${TETHER}"/></g>
    <g ${O}>${bob(18, 44)}${bob(45, 30)}</g>
    <path d="M31.5 12.5 L33.1 16.9 L37.5 18.5 L33.1 20.1 L31.5 24.5 L29.9 20.1 L25.5 18.5 L29.9 16.9 Z" fill="#fff" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 40.5 Q13.5 36.5 17 35.5" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M39 26.5 Q40.5 22.5 44 21.5" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
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
