// [b5-karp] karpbox — the Bazookarp test stage (never shipped; SPEC §10.1). An ES module the harness imports in the game
// page (testmaps.cjs: MAP=karpbox, every harness; net-karp injects it into every client). Everything is drawn for BRAVO's
// half (+z) as `half` pieces (the Level mirrors them for Alpha's), so each feature exists once per half:
//   the deck        40 × 112 m (x −20…20, z −56…56), spawn decks 2.4 m up at z ±56…65 (pads at z ±60)
//   the Pond        the origin, with a 2.5 m wall at x −3.3…−3.0 (z ±1.5) between it and a test spot (a `single`)
//   weir A          a 1.2 m platform at z 26…30 (x ±4) with ramps both ways — the default weir, at (0, 1.2, 28)
//   weir B (deck)   a thin deck 2.5 m up at x 7…11, z 26…30 with ramps; the floor runs on under it (pick-ups and plants
//                   from underneath); the second weir of the two-weir data (KARPBOX_TWO) at (9, 2.5, 28)
//   the Gate        (0, 0, 48) on the floor (12 m from the pad)
//   flank lane      x −20…−14.5, z 6…28 behind a 3 m wall (no ink: the lane is reached at its ends); across it at
//                   z 14…17 a 1.5 m non-inkable step (the HOP: its top otherwise reached the long way round, down its
//                   ramp on the far side, z 17…23); state 1 (testStates) takes the lane's nodes away, and a band of the
//                   main floor at z 18…20 (x −14…14)
//   the alley       x 6…13.7, z 4…20: a dead end behind a 0.3 m thin wall at x 5.7…6 (both sides' walks differ by > 20 m)
//   the channel     open water x 14…17, z 6…44 (falls), crossed by a 2 m pier at z 36…38; the strip beyond it x 17…20
//   the GAP         two 1 m platforms off the east strip over the sea, 2.6 m of open air between them (x 20…21.6 and
//                   24.2…26.2, z 12…16): the first up a ramp from the strip, the second the long way round (a landing
//                   at z 19…21 and two 0.5 m steps) — a gap edge joins them
//   a climb box     x −12…−8, z 8…10, 3 m, inkable (the climbable wall; climbing keeps the last field value)
//   the plateau     x 10…18, z 48…56, 4 m up beside the spawn deck, reached only by a squid climb (a free zone's reason)
//   free zones      (Bravo's) the big one x −20…−6, z 30…56 (14 × 26 m: drop-outside), the spawn deck, the plateau
//   carrierBlock    x −13.5…−8, z 24…28.5
//   a mover         one car on a 12 m track along the east strip (x 18.5, z 10…22), Bravo's half only
//   a pod plot      a canopy at (−11, 0, 20), Bravo's half only
export const KARPBOX_DEF = {
  start: [0, 0],
  weirs: [{ at: [0, 1.2, 28], yaw: 0 }],
  gate: { at: [0, 0, 48], yaw: 0 },
  freeZones: [
    { poly: [[-20, 30], [-6, 30], [-6, 56], [-20, 56]], y0: -0.3, y1: 0.3, signs: [[-6.4, 30.4, 90], [-6.4, 44, 90], [-6.4, 52.4, 90], [-19.4, 30.4, 180]] },
    { poly: [[-8, 56], [8, 56], [8, 65], [-8, 65]], y0: 2.1, y1: 2.7, signs: [] },
    { poly: [[10, 48], [18, 48], [18, 56], [10, 56]], y0: 3.7, y1: 4.3, signs: [] },
  ],
  carrierBlock: [{ poly: [[-13.5, 24], [-8, 24], [-8, 28.5], [-13.5, 28.5]], y0: -0.3, y1: 0.5 }],
  noRest: [],
  noRetreat: [],
  // a test-only second field state (karp-rules J): the flank lane's nodes gone (both halves: mirrored)
  // and a band across the main floor at z 18…20 (x −14…14): a still carrier just behind it on its own half sees its walk
  // grow by far more than 8 m at the switch (the mark's reset is what keeps it off ×3)
  testStates: [{ key: 1, remove: [{ poly: [[-20, 6], [-14.5, 6], [-14.5, 28], [-20, 28]], y0: -0.5, y1: 2.0 }, { poly: [[-14, 18], [14, 18], [14, 20], [-14, 20]], y0: -0.5, y1: 0.5 }] }],
};
// the two-weir data (KARP_DEF in the tests): weir A on the platform and weir B on the raised deck, ≥ 9 m apart
export const KARPBOX_TWO = { ...KARPBOX_DEF, weirs: [{ at: [0, 1.2, 28], yaw: 0 }, { at: [9, 2.5, 28], yaw: 0 }] };

const B = (x0, x1, y0, y1, z0, z1, o = {}) => ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color: '#d8d2c4', pattern: 3, ...o });
const RP = (low, high, width, o = {}) => ({ kind: 'ramp', low, high, width, thickness: 0.4, color: '#c8c2b4', pattern: 3, ...o });
const NOINK = { paint: false, color: '#b9b2a4' };
const WALL = { paint: false, roof: true, color: '#b9b2a4' };

export function karpboxLayout() {
  const half = [
    // the deck (west of the channel / south and north of it / the strip beyond it), the pier
    B(-20, 14, -1.2, 0, 0, 56), B(14, 20, -1.2, 0, 0, 6), B(14, 20, -1.2, 0, 44, 56), B(17, 20, -1.2, 0, 6, 44), B(14, 17, -1.2, 0, 36, 38, { color: '#b89a74', pattern: 2 }),
    // the spawn deck
    B(-8, 8, -1.2, 2.4, 56, 65),
    // weir A's platform + ramps
    B(-4, 4, 0, 1.2, 26, 30), RP([0, 0, 20], [0, 1.2, 26], 8), RP([0, 0, 36], [0, 1.2, 30], 8),
    // weir B's raised deck (a thin slab: the floor runs on under it) + ramps
    B(7, 11, 2.3, 2.5, 26, 30), RP([9, 0, 20.5], [9, 2.5, 26], 4), RP([9, 0, 35.5], [9, 2.5, 30], 4),
    // the flank lane's wall, its hop step and the step's ramp down on the far side
    B(-14.5, -14, 0, 3, 6, 28, WALL), B(-20, -14.5, 0, 1.5, 14, 17, NOINK), RP([-17.25, 0, 23], [-17.25, 1.5, 17], 5.5, NOINK),
    // the alley behind the thin wall
    B(5.7, 6, 0, 3, 4, 20, WALL), B(5.7, 14, 0, 3, 20, 20.4, WALL), B(13.7, 14, 0, 3, 4, 20.4, WALL),
    // the climbable box, the plateau beside the spawn deck
    B(-12, -8, 0, 3, 8, 10), B(10, 18, 0, 4, 48, 56),
    // the GAP: two 1 m platforms off the east strip over the sea, 2.6 m of air between them (the second reached the
    // long way: a landing at z 19…21, then 0.5 m steps up)
    B(20, 21.6, -1.2, 1, 12, 16, NOINK), B(24.2, 26.2, -1.2, 1, 12, 16, NOINK), B(24.2, 26.2, -1.2, 0.5, 16, 19, NOINK), B(20, 26.2, -1.2, 0, 19, 21, NOINK),
    RP([20.8, 0, 9], [20.8, 1, 12], 1.6, NOINK),
  ];
  return {
    id: 'karpbox', bounds: { minX: -30, maxX: 30, minZ: -66, maxZ: 66 }, spawnPads: [[0, 2.4, -60], [0, 2.4, 60]], spawnBarrier: 4.2,
    single: [B(-3.3, -3.0, 0, 2.5, -1.5, 1.5, WALL)],
    half,
    decor: { lamps: [], palms: [], flags: [] },
    bazookarp: KARPBOX_DEF,
    movers: { mirror: false, timetable: { first: 8, dwell: 8, move: 3, warn: 2, horn: 1 }, cars: [{ id: 'kcar', stops: [[18.5, 10], [18.5, 22]], y: 0, size: [4, 1.6, 2.4] }] },
    pods: { mirror: false, planter: true, list: [{ id: 'kpod', kind: 'canopy', pos: [-11, 0, 20], rotY: 0 }] },
  };
}

// register karpbox in the game's stage lists (idempotent); def: a LAYOUT.bazookarp to use instead (KARP_DEF)
export async function defineKarpbox(def = null) {
  const { MAPS } = await import('../../src/config.js');
  const { MAP_LAYOUTS } = await import('../../src/world/maps.js');
  if (!MAPS.find((m) => m.id === 'karpbox')) MAPS.push({ id: 'karpbox', name: 'Karp Box', blurb: '', theme: 'day', times: { day: 'day', dusk: 'sunset' } });
  MAP_LAYOUTS.karpbox = karpboxLayout();
  if (def) MAP_LAYOUTS.karpbox.bazookarp = def;
  return true;
}
