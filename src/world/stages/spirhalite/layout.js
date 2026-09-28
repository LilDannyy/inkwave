// Spirhalite Islands — stage layout (src/world/stages/spirhalite/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, env (this file)   props.js    prop pack + placements
//   surfaces.js  stage surface materials (texlib)                       murals.js   stage decals / signage
//   backdrop.js  the far archipelago (layout.env.backdrop)
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { shelfBars, reflexPatches, coreRects, coreBoxes, LEVELS } from './islands.js';
import { CHAIN, OUTLINE, barLevel } from './outline.js';
export { OUTLINE };

// Spirhalite Islands — a remote archipelago raised out of the sea by a tectonic shift, reached only by helicopter.
// Deep Cut's expedition camp investigates the ruins: a colossal stone arch over the central sandbar and ancient tiered
// pillars with water pouring down their drums. BLOCK-OUT (v1): plain pieces, heights and lanes.
// Heights: 0 sand · 1.3 dunes / causeway / pillar plinth · 2.5 pillar tier · 3.2 helipads.
const H1 = 1.3, H2 = 2.5, HP = 3.2, BOT = -2.4;
const K = { sand: '#e6dfcf', wet: '#d8cfbd', dune: '#ebe4d4', stone: '#c9c4b8', stoneDk: '#aaa498', steel: '#8d979e', steelDk: '#59626a', pad: '#dcdcd6', moss: '#9aa878' };
const sand = (o = {}) => ({ color: K.sand, pattern: SURF.dune, ...o });
const wet = (o = {}) => ({ color: K.wet, pattern: SURF.dune, ...o });
const moss = (o = {}) => ({ color: K.dune, pattern: SURF.moss, ...o });
const stone = (o = {}) => ({ color: K.stone, pattern: SURF.ruin, ...o });
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
const OCTSIDES = [...SIDES, [0.7071, 0, 0.7071], [0.7071, 0, -0.7071], [-0.7071, 0, 0.7071], [-0.7071, 0, -0.7071]];

// a ramp whose slab's 0.6 m low-end extension ends exactly on the low edge (dune slopes, stone steps)
const rise = (x0, z0, y0, x1, z1, y1) => { const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(y1 - y0, L); return [x0 + (dx / L) * 0.6 * Math.cos(a), y0 + 0.6 * Math.sin(a), z0 + (dz / L) * 0.6 * Math.cos(a)]; };
// dune ridge: a flat crest (w wide, len long, height h) along the direction deg (0 = along +x), sand slopes (≤ 23°) both sides
function dune(cx, cz, len, h, deg, o = {}) {
  const a = (deg * Math.PI) / 180, ux = Math.cos(a), uz = -Math.sin(a), nx = -uz, nz = ux;   // along, across
  const w = o.crest ?? 1.0, run = h / Math.tan((22.5 * Math.PI) / 180);
  const out = [O(cx, cz, len, w, 0, h, deg, sand({ tag: 'dune', color: K.dune, ...o.opts }))];
  for (const s of [-1, 1]) {
    const hx = cx + nx * s * (w / 2), hz = cz + nz * s * (w / 2), lx = hx + nx * s * run, lz = hz + nz * s * run;
    out.push(R([lx, 0, lz], [hx, h, hz], len, sand({ tag: 'dune-slope', color: K.dune, ...o.opts })));
  }
  return out;
}

const NC = CHAIN.length;
// Alpha's bars: the chain's edges (the last one wraps into the mirror chain: a third level where the count is odd)
const BARS = shelfBars(OUTLINE, { only: (i) => i < NC, level: barLevel, opts: { tag: 'shore', color: K.wet, pattern: SURF.dune } });
const PATCHES = reflexPatches(OUTLINE, { only: (i) => i < NC, opts: { tag: 'shore', color: K.wet, pattern: SURF.dune } });
const ALL_BARS = [...BARS, ...PATCHES].flatMap((b) => [b, { ...b, center: [-b.center[0], b.center[1], -b.center[2]] }]);
// the dry sand: the centre slab (single, symmetric) first, then Alpha's half (z ≤ 0) greedily
const CENTRE = [[-13, 13, -5.5, 5.5]];
const CORES = coreRects(OUTLINE, ALL_BARS, { x0: -27, x1: 27, z0: -48.5, z1: 0 }, CENTRE);
export const CORE_MISS = CORES.miss;

const SPIRHALITE = {
  id: 'spirhalite',
  bounds: { minX: -27, maxX: 27, minZ: -48, maxZ: 48 },
  spawnPads: [[0, HP, -42.5], [0, HP, 42.5]],
  spawnBarrier: 4.2,
  // the world round it: no Inkopolis bay — more of the archipelago in the mist (backdrop.js); a pale jade-turquoise sea,
  // mist banks drifting between the far islets, a soft silvery late-morning light and a hazy pink-orange sunset
  env: {
    backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, buoys: false, gulls: true, stars: true,
    weather: { mist: { count: 90, height: 2.6, size: 30, reach: 95, opacity: 0.5 } },
    theme: {
      all: { seaDeep: '#1f666c', seaShallow: '#4bb3a6', seaCrest: '#a2e3d3', foam: '#fbfffd', waveStrength: 0.7 },
      golden: {
        sunAz: 196, sunEl: 38, sunColor: '#fff2df', sunIntensity: 2.9, skySun: 2.6,
        hemiSky: '#c3d4df', hemiGround: '#e6dac4', hemiGroundK: 2.0, hemiIntensity: 0.56, envK: 0.55,
        zenith: '#5f88ad', skyMid: '#9ebccd', horizon: '#e2eaea', ground: '#7d9ba2',
        horizonGlow: '#fff1d8', horizonGlowK: 0.16, glowColor: '#fff0d2', glow: [520, 1.2, 5.0, 0.16],
        cloudLit: '#f7f8f6', cloudShade: '#a9b7c3', cloud: [0.46, 1.0, 0.85, 0.5], cloudCov: 0.5,
        haze: [1 / 620, 0.95, 150], fog: [22, 520],
        grade: { uExposure: 0.97, uSat: 0.98, uVib: 0.08, uContrast: 1.03, uLift: 0.015, uVignette: 0.2, uShadowTint: [0.95, 1.0, 1.07], uHighTint: [1.025, 1.0, 0.965] },
      },
      sunset: {
        horizon: '#ffae8c', skyMid: '#b27aa0', zenith: '#3b3f7e', horizonGlow: '#ff9a6a', glowColor: '#ffbd86',
        seaDeep: '#243f68', seaShallow: '#4a7f98', seaCrest: '#9fb8d2', foam: '#ffe4d6',
        haze: [1 / 950, 0.9, 190], fog: [30, 700],
      },
    },
  },
  single: [
    // ================= the central sandbar under the Great Arch (the arch's legs stand in the sea at x ±24)
    ...coreBoxes(CENTRE, sand({ tag: 'sandbar', mural: [{ n: [0, 1, 0], id: 4 }] })),
  ],
  half: [
    // ================= base island (helipad on its high dune, the camp hollow on the right, the left islet beyond)
    ...BARS,
    ...PATCHES,
    ...coreBoxes(CORES.rects, sand({ tag: 'sand' })),
    // ================= base island: the high dune the helipad stands on (1.3), joined on the left by the L1 dune
    // (1.3, a 2.5 crest at its back), and the ridge closing the camp hollow's south side (1.3, a 2.5 crest at its west end)
    B(-9, 12, 0, H1, -48, -31.3, sand({ tag: 'base-dune', color: K.dune })),
    B(12, 19.5, 0, H1, -40.5, -33, moss({ tag: 'l1-dune' })),
    B(16, 19, H1, H2, -40, -37, sand({ tag: 'l1-crest', color: K.dune })),
    R(rise(17.5, -34.1, H1, 17.5, -37, H2), [17.5, H2, -37], 3, sand({ tag: 'dune-slope', color: K.dune })),
    R(rise(15.75, -29.9, 0, 15.75, -33, H1), [15.75, H1, -33], 7.5, sand({ tag: 'dune-slope', color: K.dune })),
    B(-20.5, -9, 0, H1, -41.5, -37, moss({ tag: 'hollow-ridge' })),
    B(-20, -16.5, H1, H2, -41, -38, sand({ tag: 'hollow-crest', color: K.dune })),
    R(rise(-13.6, -39.5, H1, -16.5, -39.5, H2), [-16.5, H2, -39.5], 3, sand({ tag: 'dune-slope', color: K.dune })),
    // sand slopes: off the high dune to mid (the spine); off the ridge down into the camp hollow
    R(rise(-1, -28.1, 0, -1, -31.3, H1), [-1, H1, -31.3], 8, sand({ tag: 'spine-slope', color: K.dune })),
    R(rise(-7, -28.2, 0, -7, -31.3, H1), [-7, H1, -31.3], 3.6, sand({ tag: 'dune-slope', color: K.dune })),
    R(rise(4.6, -28.2, 0, 4.6, -31.3, H1), [4.6, H1, -31.3], 2.8, sand({ tag: 'dune-slope', color: K.dune })),
    R(rise(-11, -33.8, 0, -11, -37, H1), [-11, H1, -37], 3, sand({ tag: 'dune-slope', color: K.dune })),

    // ================= spawn: the expedition helipad (steel deck on stilts, 1.9 m over the high dune)
    // (a steel frame body R 5.75, the deck plate R 5.9 overhanging it: props.js dresses both)
    ...OCT(0, -42.5, 5.75, H1, 3.0, { tag: 'helipad-frame', color: K.steelDk, pattern: PATTERN.metalpanel, noPaint: OCTSIDES }),
    ...OCT(0, -42.5, 5.9, 2.95, HP, { tag: 'helipad', color: K.pad, pattern: PATTERN.spawn, noPaint: OCTSIDES }).map((d, i) => (i === 1 ? { ...d, mural: [{ n: [0, 1, 0], id: 7 }] } : d)),   // (its front arm: SPIRHALITE / DC-1)
    R([0, H1, -32.6], [0, HP, -37.05], 3, { tag: 'helipad-stair', color: K.steel, pattern: PATTERN.treads }),
    R([9.9, H1, -42.5], [5.45, HP, -42.5], 2.4, { tag: 'helipad-stair', color: K.steel, pattern: PATTERN.treads }),

    // ================= right lane: the ancient causeway (stone slabs at 1.3) from the base to the sandbar's spit. Its
    // mid end is a sheer 1.3 m face (the tower climbs it); kids take the steps off the bastion beside it. Its base end is
    // broken off (a 1.3 m drop into the camp hollow), with side steps down from it
    B(-21.1, -16.9, BOT, H1, -25, -6.5, stone({ tag: 'causeway', mural: [{ n: [0, 1, 0], id: 5 }, { n: [1, 0, 0], id: 6 }, { n: [-1, 0, 0], id: 6 }] })),
    B(-16.9, -14.6, BOT, H1, -10.2, -6.5, stone({ tag: 'causeway-bastion' })),
    R(rise(-15.75, -3.3, 0, -15.75, -6.5, H1), [-15.75, H1, -6.5], 2.3, stone({ tag: 'causeway-steps', pattern: PATTERN.stonestep })),
    R(rise(-13.9, -24.1, 0, -17, -24.1, H1), [-17, H1, -24.1], 2.0, stone({ tag: 'causeway-steps', pattern: PATTERN.stonestep })),

    // ================= the cascade pillar's islet in the lagoon between the causeway and the mid sandbar
    ...OCT(-12.5, -15, 3.2, 0, H1, stone({ tag: 'pillar-plinth' })).map((d, i) => (i === 0 ? { ...d, mural: [{ n: [1, 0, 0], id: 10 }, { n: [-1, 0, 0], id: 10 }] } : i < 3 ? { ...d, mural: [{ n: [0, 0, 1], id: 10 }, { n: [0, 0, -1], id: 10 }] } : d)),
    ...OCT(-12.5, -15, 2.2, H1, H2, stone({ tag: 'pillar-tier' })),
    ...OCT(-12.5, -15, 1.2, H2, 4.4, stone({ tag: 'pillar-drum', roof: true, noPaint: OCTSIDES })),   // (the column above: props.js)
    B(-17, -15.2, 0.8, H1 - 0.2, -16.2, -13.8, stone({ tag: 'pillar-spur' })),           // broken slab: causeway ↔ plinth
    B(-11.0, -9.9, H1, 1.9, -15.6, -14.4, stone({ tag: 'fallen-drum' })),               // a step up onto the tier
    B(-9.54, -8.5, 0, 0.65, -15.6, -14.4, stone({ tag: 'fallen-drum' })),               // a step up onto the plinth

    // ================= mid lane: the spine sandbar, broken by the Spine Crest (a 2.5 m dune: a long slope up from the
    // base side, a 1.3 shoulder and slope toward mid) and staggered low ridges in the lanes either side of it
    B(-4.2, 0.2, 0, H2, -17.6, -14.4, sand({ tag: 'spine-crest', color: K.dune })),
    R(rise(-2, -23.5, 0, -2, -17.6, H2), [-2, H2, -17.6], 4.4, sand({ tag: 'dune-slope', color: K.dune })),
    B(-4.2, 0.2, 0, H1, -14.4, -12.2, moss({ tag: 'spine-shoulder' })),
    R(rise(-2, -9.1, 0, -2, -12.2, H1), [-2, H1, -12.2], 4.4, sand({ tag: 'dune-slope', color: K.dune })),
    ...dune(2.3, -19.2, 3.0, 0.8, 0),
    ...dune(-6.3, -10.4, 2.6, 0.8, 0),

    // ================= left lane: the log bridge L1 → L2; L2's dune (1.3, a 2.5 crest on its seaward side)
    B(12, 13.5, -0.3, 0.25, -25.0, -19.6, { tag: 'log-bridge', color: '#a78c6c', pattern: PATTERN.wood }),
    B(15, 21.2, 0, H1, -18.4, -11, moss({ tag: 'l2-dune' })),
    R(rise(11.9, -14.7, 0, 15, -14.7, H1), [15, H1, -14.7], 7.4, sand({ tag: 'dune-slope', color: K.dune })),
    B(18.4, 21.2, H1, H2, -17.6, -13.8, sand({ tag: 'l2-crest', color: K.dune })),
    R(rise(15.5, -15.7, H1, 18.4, -15.7, H2), [18.4, H2, -15.7], 3.8, sand({ tag: 'dune-slope', color: K.dune })),
    ...dune(11.2, -10.6, 2.4, 0.8, 90),

    // ================= the camp's sign board (planks on two posts, props.js): SPIRHALITE ISLANDS · DEEP CUT EXPEDITION
    B(-16.9, -14.3, 0.7, 1.8, -28.62, -28.5, { tag: 'camp-sign', color: '#a88963', pattern: PATTERN.wood, noPaint: [...SIDES, [0, 1, 0]], mural: [{ n: [0, 0, 1], id: 8 }] }),

    // ================= the sandbar under the arch: blocks fallen from the arch (cover round the centre zone)
    O(-7.5, -5.0, 2.4, 1.3, 0, 1.4, 15, stone({ tag: 'arch-block' })),
    O(4.5, -3.8, 1.3, 1.1, 0, 0.9, -10, stone({ tag: 'arch-block' })),
    O(9.5, -2.5, 2.2, 2.0, 0, 2.0, 35, stone({ tag: 'arch-block' })),
    O(-13.5, -5.0, 1.2, 1.0, 0, 0.8, 20, stone({ tag: 'arch-block' })),
  ],
  // Zone Control: the sandbar under the arch; the camp hollow (Alpha's)
  zones: {
    center: [{ poly: [[-5.5, -4.5], [5.5, -4.5], [5.5, 4.5], [-5.5, 4.5]], y0: -0.3, y1: 0.3 }],
    side: { poly: [[-19, -36.5], [-10.5, -36.5], [-10.5, -29], [-19, -29]], y0: -0.3, y1: 0.3 },
  },
  // Tower Command (authored on Bravo's side, z > 0: Alpha pushes along it): along the sandbar under the arch to the spit,
  // CLIMB the causeway's sheer end (checkpoint 1 at its foot), along the causeway, DROP off its broken far end into the
  // camp hollow, across the whole front of the base past the camp (checkpoint 2) and the spine's foot, then CLIMB onto
  // the high dune to the goal beside the helipad
  tower: {
    path: [[0, 0], [0, 2.2], [19, 2.2], [19, 26.7], [-8, 26.7], [-8, 33.5]],
    checkpoints: [[19, 2.2], [13, 26.7]],
  },
  // match intro: opens under the Great Arch's crown looking along it at the cascade pillar, then pulls back to your pad
  intro: { from: [9, 5.5, 7], lookFrom: [-10, 6.5, -12], toBack: 3.0 },
  // stage-select picture: high behind Alpha's helipad and its helicopter — the arch framing the centre, both cascades
  art: { from: [-22, 21, -60], look: [2, 3, -4], fov: 56 },
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = SPIRHALITE;
