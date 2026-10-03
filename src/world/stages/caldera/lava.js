// Highmark Foundry — the Bellows' breath: the lava's data in ENGINE.md §3.3's exact format (DESIGN.md §3.2), plus the
// BLOCKOUT's stand-in for the engine (which is not built yet).
//
// LAVA (exported, in LAYOUT.lava) is pure data for src/game/lava.js (`LavaWorld.create(layout)` once it exists).
//
// The blockout stand-in (until the lava engine lands; then set BLOCKOUT_LAVA = false and nothing below it is used):
// the stage is built at ONE lava level, chosen by the page's `?lava=low|high` (the harness: LAVA=low|high, see
// tools/botlab/offscreen-boot.cjs) or, in Node (check-maps), by the LAVA env var; default LOW. At that level
//   • the Organ Pipes are static hexagonal columns at that level's pose (LOW 1.4 / 1.8 / 2.3, HIGH 2.35 / 3.5 / 4.65),
//   • the Pumice Race's stones are static perches (top 1.25) at HIGH, absent at LOW,
//   • at HIGH every floor the lava covers (the Slump shelves, the Spillways, the Casting Floors: tops at 0) is left out
//     of the build, so the nav, the cover map, spawn-mid and the bots see it as gone,
//   • props.js draws a placeholder lava surface at the level over the whole region.
import { P, ch, sp, rot, S0, S1, FACE, S_LIP, LAKE, SPILL, SLUMP, CHUTE, STONES, STONE_YAW, ORG, POSE, DEPTH } from './geo.js';

export const BLOCKOUT_LAVA = true;
export const LAVA_VIEW = (() => {
  let v = null;
  try { if (typeof location !== 'undefined' && location.search) v = new URLSearchParams(location.search).get('lava'); } catch (e) { /* no page */ }
  try { if (!v && typeof process !== 'undefined' && process.env) v = process.env.LAVA || null; } catch (e) { /* no node */ }
  return v === 'high' ? 'high' : 'low';
})();
export const LAVA_Y = LAVA_VIEW === 'high' ? 0.8 : -0.6;

export const LAVA = {
  low: -0.6,
  high: 0.8,                                     // the high mark: the stain line (rind) at 0.8 on every face in the region
  region: { polys: [LAKE], half: [SPILL, SLUMP] }, // union; the set is 180°-symmetric
  falls: { half: [CHUTE] },                      // a fall below the death plane here reports cause 'lava' (ENGINE H3)
  timing: { warn: 10, rise: 10, fall: 10, ease: 'smooth' },
  schedule: {
    'turf:180': { moves: [35, 70, 110, 140] },   // rise, fall, rise, fall
    'turf:90': { moves: [30, 55] },
    zones: { loop: { first: 35, high: 35, low: 35 }, overtime: 'hold' },
    tower: 'zones', bazookarp: 'zones',
    practice: { loop: { first: 20, high: 35, low: 35 } },   // looked up by m.practice (ENGINE H24)
    attract: { loop: { first: 8, high: 15, low: 15 } },     // looked up by m.attract
    boss: 'low',
  },
  mirror: true,
  riders: [
    // the Pumice Race: sink stones; top = L + 0.45 while up; solid while top ≥ L + 0.15; surface / sink timed to the shelf
    ...STONES.map(([x, z, w, d], i) => ({ id: 'race' + (i + 1), kind: 'stone', pos: [x, z], size: [w, d], yaw: STONE_YAW,
      top: [-0.15, 1.25], depth: 0.9, sink: { at: -0.15, ease: 2.4, rel: [-0.45, 0.45] },
      look: { type: 'caldera_pumice', variant: i, chain: [-21.2, -19.6] } })),
    // the Organ Pipes (Alpha's cluster, SSW): hexagonal basalt columns, corners on ±x, in a line along z
    { id: 'organL', kind: 'float', shape: 'hex', pos: [-10, -12.80], r: 2.5, top: [2.3, 4.65], depth: 4.2, ink: 'all',
      inLake: true, parts: [{ x: 0, z: -1.4, w: 1.2, d: 1.2, y0: 0, y1: 0.7, ink: false }],   // the stub on its lake side
      look: { type: 'caldera_organ', role: 'lookout' } },
    { id: 'organB', kind: 'float', shape: 'hex', pos: [-10, -9.14], r: 1.5, top: [1.8, 3.5], depth: 3.7, ink: 'deck',
      look: { type: 'caldera_organ' } },
    { id: 'organA', kind: 'float', shape: 'hex', pos: [-10, -6.34], r: 1.5, top: [1.4, 2.35], depth: 3.3, ink: 'deck',
      look: { type: 'caldera_organ' } },
  ],
  steps: [   // explicit nav links across every rider seam (ENGINE §4.3): [from, to]; a point is static floor nearest it
    [[-10, -4.45], 'organA'], ['organA', 'organB'], ['organB', 'organL'],
    [[-18.74, -14.40], 'race1'], ['race1', 'race2'], ['race2', 'race3'], ['race3', 'race4'], ['race4', 'race5'],
    ['race5', [-23.64, -0.19]],
  ],
  gauges: [
    { kind: 'bar', pos: [0, 8.0, -2.5], yaw: Math.PI, h: 7.0, single: true },    // the Surge Gauge's south board (to Alpha)
    { kind: 'bar', pos: [0, 8.0, 2.5], yaw: 0, h: 7.0, single: true },           //   and its north board (to Bravo)
    { kind: 'bar', pos: [-19.5, 6.2, -53.6], yaw: Math.PI, h: 1.8 },             // the Surge Board on the Surge Office (twin)
  ],
  cascades: [{ lip: [[18.81, -28.81], [26.69, -21.72]], y: 0.0, drop: 14 }],      // Alpha's Spillway lip (twin: Bravo's)
  vents: [[-9.5, -0.6, -18.5], [17.0, -0.6, -5.0], [10.0, 0, -15.0], [23.27, 0, -22.11]],   // pools and floor drains (8 with twins)
  flotsam: { count: 48, size: [0.3, 0.9], keepOff: 1.0 },  // cosmetic pumice drifting on the open lava, no collider
  look: { crust: 'ember', cone: [230, 0, 150] },           // warm charcoal-maroon crust, lit seams (§5.3); the Bellows Vent
  text: {
    warnRise: ['LAVA RISING', 'Off the low ground: {n}'],
    rise: ['SURGE!', 'The Pumice Race is coming up'],
    high: ['HIGH MARK', 'Race up · Organ Pipes up'],
    warnFall: ['LAVA FALLING', 'The stones sink in {n}'],
    low: ['EBB', 'Slump shelf, Spillway and casting floor open'],
    hold: ['LAVA HOLDS', ''],
  },
};
// (the steps' static ends, for the record: the island's socket collar just north of A's north flat; the south head
// 0.45 m behind its tip face; the north head 0.45 m behind its tip face)
export const STEP_ENDS = { island: [-10, -4.45], south: sp(S0, -0.45, 0), north: sp(S1, 0.45, 0) };
void P; void ch; void rot; void FACE; void S_LIP;

// ---------------------------------------------------------------------------------------------- the blockout stand-ins
// hexagonal column (corners on ±x) as three boxes turned 0 / 60 / 120°: the middle one carries the deck, the turned
// pair sit 0.1 / 0.2 m lower so no two tops z-fight (a static stand-in: the engine's riders are dynamic blocks)
const DEGR = Math.PI / 180;
function hexBlocks(cx, cz, r, top, depth, o) {
  const w = r, d = Math.sqrt(3) * r, y0 = top - depth;
  return [0, 60, 120].map((a, i) => ({ kind: 'obox', center: [cx, (y0 + top - 0.1 * i) / 2, cz], size: [w, top - 0.1 * i - y0, d], rotY: -a, ...o(i) }));
}
// the riders at this build's level, as static layout pieces (Alpha's half; the half list mirrors them)
export function riderStandIns(mk) {
  const e = LAVA_VIEW === 'high' ? 1 : 0, out = [];
  for (const k of ['L', 'B', 'A']) {
    const [x, z, r] = ORG[k], top = POSE[k][0] + (POSE[k][1] - POSE[k][0]) * e;
    out.push(...hexBlocks(x, z, r, top, DEPTH[k], (i) => mk('organ', { tag: 'organ-' + k + i })));
    if (k === 'L') out.push({ kind: 'box', min: [x - 0.6, top, z - 1.4 - 0.6], max: [x + 0.6, top + 0.7, z - 1.4 + 0.6], ...mk('organ-stub', { tag: 'organ-stub', paint: false }) });
  }
  if (e === 1) {
    STONES.forEach(([x, z, w, d], i) => out.push({ kind: 'obox', center: [x, (0.35 + 1.25) / 2, z], size: [w, 0.9, d], rotY: STONE_YAW, ...mk('stone', { tag: 'race' + (i + 1), perch: true }) }));
  }
  void DEGR;
  return out;
}
