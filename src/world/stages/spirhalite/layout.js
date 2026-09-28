// Spirhalite Islands — stage layout (src/world/stages/spirhalite/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, env (this file)   props.js    prop pack + placements
//   surfaces.js  stage surface materials (texlib)                       murals.js   stage decals / signage
//   backdrop.js  the far archipelago (layout.env.backdrop)
import { PATTERN, B, R, O, OCT } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { symOutline, shelfBars, reflexPatches, coreRects, coreBoxes, LEVELS } from './islands.js';

// Spirhalite Islands — a remote archipelago raised out of the sea by a tectonic shift, reached only by helicopter.
// Deep Cut's expedition camp investigates the ruins: a colossal stone arch over the central sandbar and ancient tiered
// pillars with water pouring down their drums. BLOCK-OUT (v1): plain pieces, heights and lanes.
// Heights: 0 sand · 1.3 dunes / causeway / pillar plinth · 2.5 pillar tier · 3.2 helipads.
const H1 = 1.3, H2 = 2.5, HP = 3.2, BOT = -2.4;
const K = { sand: '#e9e3d6', wet: '#d9d1c1', dune: '#efe9dc', stone: '#c9c4b8', stoneDk: '#aaa498', steel: '#8d979e', pad: '#dcdcd6', moss: '#9aa878' };
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

// ---- the landmass: one point-symmetric outline round the whole arena (Alpha's half chain, from the west tip of its
// sandbar spit round its half to the mirror of that point). Islands.js lays the wet-sand shelf along it and the dry
// sand cores inside it.
const CHAIN = [
  [-22.5, -0.6], [-22.6, -3.6], [-21.9, -6.6],                                        // spit (under the causeway's end)
  [-16.4, -7.2], [-13.2, -6.6], [-9.5, -6.4], [-8.2, -8.2], [-8.4, -10.8],            // north lagoon's shore
  [-10.0, -10.6], [-12.5, -10.1], [-15.0, -10.8], [-16.6, -12.6], [-17.1, -15.0],     // the pillar islet
  [-16.6, -17.4], [-15.0, -19.2], [-12.5, -19.9], [-10.0, -19.3], [-8.4, -19.6],
  [-8.3, -21.8], [-10.5, -23.2], [-14.5, -22.7], [-17.5, -23.0], [-21.5, -23.6],      // south lagoon, camp hollow shore
  [-24.0, -26.0], [-25.0, -30.5], [-24.6, -35.5], [-22.6, -40.0], [-19.0, -44.0],     // the base island's back
  [-13.5, -46.8], [-6.5, -48.0], [4.0, -48.0], [10.5, -47.2], [15.5, -44.8],
  [19.5, -41.5], [22.3, -37.5], [23.4, -32.0], [22.2, -27.2], [19.6, -24.4],          // left islet (L1)
  [15.8, -23.7], [11.2, -24.0], [8.2, -25.2], [5.4, -24.4],                           // the bay at the east channel's end
  [4.3, -22.0], [4.6, -16.5], [4.1, -11.0], [4.5, -7.0], [6.3, -6.2],                 // mid sandbar's east shore
  [8.0, -7.4], [8.2, -9.2], [7.8, -14.0], [8.4, -19.2], [10.0, -20.8],                // islet L2
  [13.5, -21.0], [17.5, -20.4], [21.0, -18.6], [22.6, -15.0], [22.2, -11.0],
  [20.0, -8.6], [16.5, -7.6], [13.4, -6.8], [13.6, -4.0], [14.3, 0.2], [18.8, 0.2],   // L2 neck, the sandbar's east end
];
export const OUTLINE = symOutline(CHAIN);
const NC = CHAIN.length;
// Alpha's bars: the chain's edges (the last one wraps into the mirror chain: a third level where the count is odd)
const BARS = shelfBars(OUTLINE, { only: (i) => i < NC, level: (i) => (NC % 2 && i === NC - 1 ? LEVELS[2] : LEVELS[i % 2]), opts: { tag: 'shore', color: K.wet, pattern: SURF.dune } });
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
  env: { backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, buoys: false },
  single: [
    // ================= the central sandbar under the Great Arch (the arch's legs stand in the sea at x ±24)
    ...coreBoxes(CENTRE, sand({ tag: 'sandbar' })),
  ],
  half: [
    // ================= base island (helipad on its high dune, the camp hollow on the right, the left islet beyond)
    ...BARS,
    ...PATCHES,
    ...coreBoxes(CORES.rects, sand({ tag: 'sand' })),
    // the high dune the helipad stands on (1.3), and the ridge closing the camp hollow's south side
    B(-9, 12, 0, H1, -47, -31.3, sand({ tag: 'base-dune', color: K.dune })),
    B(-19, -9, 0, H1, -42, -37, sand({ tag: 'hollow-ridge', color: K.dune })),
    // sand slopes off the high dune: to mid (the spine), to the left islet, into the hollow; off the ridge into the hollow
    R(rise(-1, -28.1, 0, -1, -31.3, H1), [-1, H1, -31.3], 8, sand({ tag: 'spine-slope', color: K.dune })),
    R(rise(15.2, -35, 0, 12, -35, H1), [12, H1, -35], 4, sand({ tag: 'dune-slope', color: K.dune })),
    R(rise(-12.2, -34, 0, -9, -34, H1), [-9, H1, -34], 3, sand({ tag: 'dune-slope', color: K.dune })),
    R(rise(-15, -33.8, 0, -15, -37, H1), [-15, H1, -37], 3, sand({ tag: 'dune-slope', color: K.dune })),

    // ================= spawn: the expedition helipad (steel deck on stilts, 1.9 m over the high dune)
    ...OCT(0, -42.5, 5.9, H1, HP, { tag: 'helipad', color: K.pad, pattern: PATTERN.spawn, noPaint: OCTSIDES }),
    R([0, H1, -32.6], [0, HP, -37.05], 3, { tag: 'helipad-stair', color: K.steel, pattern: PATTERN.treads }),
    R([9.9, H1, -42.5], [5.45, HP, -42.5], 2.4, { tag: 'helipad-stair', color: K.steel, pattern: PATTERN.treads }),

    // ================= right lane: the ancient causeway (stone slabs at 1.3) from the base to the sandbar's spit
    B(-21.1, -16.9, BOT, H1, -25, -6.5, stone({ tag: 'causeway' })),
    R(rise(-19, -3.3, 0, -19, -6.5, H1), [-19, H1, -6.5], 4, stone({ tag: 'causeway-steps', pattern: PATTERN.stonestep })),
    // side steps down from the causeway's base end into the camp hollow (its end itself is a broken 1.3 m drop)
    R(rise(-13.9, -24.1, 0, -17, -24.1, H1), [-17, H1, -24.1], 2.0, stone({ tag: 'causeway-steps', pattern: PATTERN.stonestep })),

    // ================= the cascade pillar's islet in the lagoon between the causeway and the mid sandbar
    ...OCT(-12.5, -15, 3.2, 0, H1, stone({ tag: 'pillar-plinth' })),
    ...OCT(-12.5, -15, 2.2, H1, H2, stone({ tag: 'pillar-tier' })),
    ...OCT(-12.5, -15, 1.2, H2, 9, stone({ tag: 'pillar-drum', roof: true, noPaint: OCTSIDES })),
    B(-17, -15.2, 0.8, H1 - 0.2, -16.2, -13.8, stone({ tag: 'pillar-spur' })),           // broken slab: causeway ↔ plinth
    B(-12.9, -11.7, H1, 1.9, -17.6, -16.6, stone({ tag: 'fallen-drum' })),              // a step up onto the tier
    B(-9.54, -8.5, 0, 0.65, -15.6, -14.4, stone({ tag: 'fallen-drum' })),               // a step up onto the plinth

    // ================= mid lane: the spine sandbar from the high dune's slope to the central sandbar
    ...dune(-2.5, -16, 5, 1.1, 90),
    ...dune(2.0, -10.5, 3.5, 0.8, 20),

    // ================= left lane: islets and a driftwood-log bridge
    B(12, 13.5, -0.3, 0.25, -25.0, -19.6, { tag: 'log-bridge', color: '#a78c6c', pattern: PATTERN.wood }),
    ...dune(16, -14.5, 4, 1.2, 0),
    ...dune(11, -29.5, 3, 0.9, 90),

    // ================= camp hollow (side zone): low cover
    ...dune(-15.5, -33.5, 3, 0.8, 0),
  ],
  // Zone Control: the sandbar under the arch; the camp hollow (Alpha's)
  zones: {
    center: [{ poly: [[-5.5, -4.5], [5.5, -4.5], [5.5, 4.5], [-5.5, 4.5]], y0: -0.3, y1: 0.3 }],
    side: { poly: [[-19, -36.5], [-10.5, -36.5], [-10.5, -29], [-19, -29]], y0: -0.3, y1: 0.3 },
  },
  // Tower Command (authored on Bravo's side, z > 0: Alpha pushes along it): along the sandbar to the spit, up the
  // causeway's steps, along the causeway, off its broken end into the camp hollow, across it, up the spine to the goal
  tower: {
    path: [[0, 0], [0, 2.2], [19, 2.2], [19, 26.5], [3, 26.5], [3, 32.5]],
    checkpoints: [[19, 2.2], [12, 26.5]],
  },
  intro: { from: [14, 14, 6], lookFrom: [0, 3, -4], toBack: 3.0 },
  art: { from: [34, 24, -46], look: [-4, 1, 2], fov: 58 },
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = SPIRHALITE;
