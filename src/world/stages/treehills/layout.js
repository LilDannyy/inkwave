// Eco-Forest Treehills — stage layout (src/world/stages/treehills/). The stage owns every file in this folder:
//   layout.js    level geometry, zones, tower track, sprout pods, environment (this file)
//   plan.js      the tier regions' outlines + key numbers (shared with the props)   geo.js  the ground kit
//   props.js     prop pack + placements (set dressing)        surfaces.js  stage surface materials (texlib)
//   murals.js    stage decals / signage (mural atlas)         backdrop.js  the far scenery (the dome, the cavern, the forest)
import { PATTERN, B, R, O } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';
import { SURF } from './surfaces.js';
import { MURAL } from './murals.js';
import { fill, kerbs, FL } from './geo.js';
import { G0, T1, T2, T3, SP, STATION, PAD, CORE, GARDEN_N, RILL, GARDEN_S, RILL_Y, PLAZA, MOUNDS, APRON, LOBE, STRIP, UPPER, CROWN, TRACK, ZONE_C, ZONE_S, bounds, GROVES, BED_H, TRAILS, TRAIL_H } from './plan.js';

// ------------------------------------------------------------------------------------------------------------
// Eco-Forest Treehills — a tiered forest biome under the mountain in Alterna. Alpha at −Z (the half list), Bravo is the
// 180° twin. The playable ground is a pinwheel diamond in the biome's reservoir: widest across the middle (the two
// tree-hills' crowns, x ±34.5), narrowing to the research stations at the ends (x ±9 … 15).
// Heights: 0 the lowland (meadow + gardens) · 1.3 the terraces · 2.6 the hills' upper tiers · 3.9 their crowns ·
//          3.9 the spawn deck (the station's roof).
//   • spawn: the roof deck of the research station (3.9: one storey of modules on the base terrace): the front stair to
//     the base terrace, side stairs down both ends from the back corners, a drop over the front edge
//   • base terrace (1.3) across the station's front: the greenhouse pod, the side zone east of the stair
//   • centre: the central stair down into the seed-bank garden (0) → the Commons Meadow (30 × 28 m of open lawn)
//   • left lane (+X for Alpha): the east tree-hill's south lobe (1.3, evergreens) → the hill ramp up to its upper tier
//     (2.6) → the crown (3.9) with the turbine; or the band (1.3) along the meadow's east side
//   • right lane (−X): the west tree-hill's service strip (1.3) → the stair up to its upper tier (2.6), the Tower
//     Command route; or the band along the meadow's west side
// ------------------------------------------------------------------------------------------------------------
const K = {
  lawn: '#98b381', hill: '#a2b47e', upper: '#91ad7a', crown: '#88a773', apron: '#9fb0a6', wall: '#95a29a', spawn: '#e1e6d8',
  station: '#56806a', stair: '#a9b3ad',
};
const lawn = (o = {}) => ({ color: K.lawn, pattern: SURF.lawn, ...o });
const deck = (o = {}) => ({ color: K.apron, pattern: SURF.chequer, ...o });
const wall = (o = {}) => ({ color: K.wall, pattern: SURF.panels, ...o });
const steps = (o = {}) => ({ color: K.stair, pattern: PATTERN.treads, ...o });

// ============================================================================================================
// The ground: the tier regions (plan.js) filled as columns with a retaining wall + coping along every slanted edge
// ============================================================================================================
const OUTER = { w: 0.8, outer: true, mk: () => wall({ tag: 'retaining' }) };
const INNER = { w: 0.7, extend: true, mk: () => wall({ tag: 'coping' }) };
const byEdge = (outer) => (i, a, b) => (outer(a, b) ? OUTER : INNER);
const same = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
// edges shared with another region (the rest face the reservoir)
const INNER_EDGES = [[[15, -21], [8, -25]], [[-8, -25], [-15, -14]]];
const isInner = (a, b) => INNER_EDGES.some(([p, q]) => (same(a, p) && same(b, q)) || (same(a, q) && same(b, p)));

export const GROUND = {
  gardenN: fill(GARDEN_N, { y0: FL, top: G0, mk: () => lawn({ tag: 'garden' }), ledge: () => INNER }),
  rill: fill(RILL, { y0: FL, top: RILL_Y, mk: () => ({ color: '#6f8f86', pattern: PATTERN.pavers, tag: 'rill' }), ledge: () => INNER }),
  gardenS: fill(GARDEN_S, { y0: FL, top: G0, mk: () => lawn({ tag: 'garden' }), ledge: () => INNER }),
  apron: fill(APRON, { y0: FL, top: T1, mk: () => deck({ tag: 'apron' }), ledge: byEdge((a, b) => !isInner(a, b)) }),
  lobe: fill(LOBE, { y0: FL, top: T1, mk: () => lawn({ tag: 'lobe', color: K.hill }), ledge: () => OUTER }),
  strip: fill(STRIP, { y0: FL, top: T1, mk: () => lawn({ tag: 'strip', color: K.hill }), ledge: () => OUTER }),
  upper: fill(UPPER, { y0: FL, top: T2, colMax: 7.5, mk: () => lawn({ tag: 'upper', color: K.upper }), ledge: () => OUTER }),
  crown: fill(CROWN, { y0: FL, top: T3, mk: () => lawn({ tag: 'crown', color: K.crown }), ledge: () => OUTER }),
};
const GROUNDS = Object.values(GROUND);
// the signage painted on the ground's faces (murals.js): the name along the upper tier's wall over the meadow, the biome
// stencil on the band's low wall (walls: a mirrored wall's decal turns with it)
const near = (a, b) => Math.abs(a - b) < 0.02;
const paint = (cols, pred, m) => { const c = cols.find(pred); if (c) c.mural = [...(c.mural || []), m]; };
paint(GROUND.upper.cols, (c) => near(c.min[0], 19.5) && c.min[2] < -9 && c.max[2] > 19, { n: [-1, 0, 0], id: MURAL.sign });
paint(GROUND.strip.cols, (c) => near(c.min[0], 15) && c.min[2] < -20, { n: [-1, 0, 0], id: MURAL.biome });

// every coping's footprint (props.js treehills_foot: hidden slabs so the environment's deck outline follows the true
// edge of the raised tiers, whose tops sit above the deck level it reads)
export const FEET = GROUNDS.flatMap((g) => g.feet);
// the band's column (x 15 … 19 along the meadow's east side) carries the band's ground decal on its top. A mirrored
// piece's top decal is moved, not turned (level.js mirrorDef), so this column leaves the half list: it and its twin go in
// as single pieces, the twin with the decal turned 180° (murals.js bandW)
const BAND_COL = GROUND.strip.cols.find((c) => near(c.min[0], 15) && near(c.max[0], 19));
// the same for the upper tier's column (x 19.5 … 26.5: its walking strip and the Tower Command route)
const twin = (c, murals) => ({ ...c, min: [-c.max[0], c.min[1], -c.max[2]], max: [-c.min[0], c.max[1], -c.min[2]], mural: murals });
const flip = (ms) => (ms || []).map((m) => ({ ...m, n: [-m.n[0], m.n[1], -m.n[2]] }));
const UPPER_COL = GROUND.upper.cols.find((c) => near(c.min[0], 19.5) && near(c.max[0], 26.5));
const UPPER_PAIR = [{ ...UPPER_COL, mural: [...(UPPER_COL.mural || []), { n: [0, 1, 0], id: MURAL.upperE }] }, twin(UPPER_COL, [...flip(UPPER_COL.mural), { n: [0, 1, 0], id: MURAL.upperW }])];
const BAND_PAIR = [
  { ...BAND_COL, mural: [...(BAND_COL.mural || []), { n: [0, 1, 0], id: MURAL.bandE }] },
  { ...BAND_COL, min: [-BAND_COL.max[0], BAND_COL.min[1], -BAND_COL.max[2]], max: [-BAND_COL.min[0], BAND_COL.max[1], -BAND_COL.min[2]],
    mural: [...(BAND_COL.mural || []).map((m) => ({ ...m, n: [-m.n[0], m.n[1], -m.n[2]] })), { n: [0, 1, 0], id: MURAL.bandW }] },
];

// the Seed Vault Plaza (single: self-symmetric): stone top, green-grey panel sides with a chequer rim on the slanted
// faces (the rim lowest at the stair heads); it sits on the meadow (from 0)
const STAIR_FACES = [[[3.9, -6.75], [7.3, -2.1]], [[-3.9, 6.75], [-7.3, 2.1]]];
const onFace = (a, b, F) => F.some(([p, q]) => (same(a, p) && same(b, q)) || (same(a, q) && same(b, p)));
export const PLAZA_G = fill(PLAZA, { y0: G0, top: T1, mk: () => ({ color: '#c9ccc2', pattern: PATTERN.pavers, tag: 'plaza' }),
  ledge: (i, a, b) => ({ w: 0.8, y0: G0, lip: onFace(a, b, STAIR_FACES) ? 0 : undefined, mk: () => deck({ tag: 'plaza-rim', color: '#9aa9a0' }) }) });
// a grass mound: a turned bank (w × d, its lawn top at `top`) with a broad ramp up each long side (run), panel walls
// at its ends (the boulders and shrubs that dress them are props)
function mound(m) {
  const a = (m.deg * Math.PI) / 180, ux = Math.cos(a), uz = -Math.sin(a), nx = Math.sin(a), nz = Math.cos(a);   // local x, local z in world
  const o = lawn({ tag: 'mound', color: '#9fbd84' });
  const out = [O(m.x, m.z, m.w, m.d, G0, m.top, m.deg, o)];
  for (const s of [-1, 1]) {
    const hx = m.x + nx * s * (m.d / 2), hz = m.z + nz * s * (m.d / 2), lx = hx + nx * s * m.run, lz = hz + nz * s * m.run;
    out.push(R([lx, G0, lz], [hx, m.top, hz], m.w, lawn({ tag: 'mound-ramp', color: '#9fbd84' })));
  }
  void ux; void uz;
  return out;
}

// ============================================================================================================
// Pieces (Alpha's half + the whole east tree-hill)
// ============================================================================================================
// coping kerbs along the axis-aligned tier edges (over a lower tier or the reservoir): not at stair heads, not where
// the tower's track climbs or drops (x 15 / 19.5 at |z| < 2, z 20 at x 21.6 … 26.4)
const LOW = [[GARDEN_N, G0], [RILL, RILL_Y], [GARDEN_S, G0]];
const REGIONS = [[APRON, T1], [LOBE, T1], [STRIP, T1], [UPPER, T2], [CROWN, T3]];
const rot = (P) => P.map(([x, z]) => [-x, -z]);
const CORE_P = [[-CORE.x, -CORE.z], [CORE.x, -CORE.z], [CORE.x, CORE.z], [-CORE.x, CORE.z]];
const ST_P = [[STATION.x0, STATION.z0], [STATION.x1, STATION.z0], [STATION.x1, STATION.z1], [STATION.x0, STATION.z1]];
const ALL = [...[...LOW, ...REGIONS].flatMap(([P, top]) => [{ P, top }, { P: rot(P), top }]), { P: CORE_P, top: G0 }, { P: ST_P, top: SP }, { P: rot(ST_P), top: SP }];
const KERB_SKIP = [
  [-3.6, 3.6, -25.6, -24.4], [-3.2, 3.2, -38.6, -37.4], [9, 13, -47.2, -46.3],   // stair heads: garden stair, deck stairs
  [20.3, 25.7, -10.6, -9.4], [27.8, 30.8, -10.6, -9.4], [28.1, 31.1, -4.6, -3.4], [28.0, 30.8, 13.4, 14.6], [19.6, 22.4, 19.4, 20.6],
  [14.4, 15.6, 5.4, 8.6], [14.4, 15.6, -17.1, -13.9],   // band stairs
  [14.4, 20.1, -2, 2], [21.6, 26.4, 19.4, 20.6],   // the tower's climbs onto the band and the upper tier, its drop onto the strip
];
const KERBS = kerbs(REGIONS.map(([P, top]) => ({ P, top, mk: () => ({ color: '#c3cbc4', pattern: PATTERN.concrete, tag: 'kerb' }) })), ALL, { skip: KERB_SKIP, feet: GROUNDS.flatMap((g) => g.feet) });

const HALF = [
  ...GROUNDS.flatMap((g) => [...g.cols, ...g.ledges]).filter((c) => c !== BAND_COL && c !== UPPER_COL),
  ...KERBS,

  // ---------------- the research station: its roof deck is the spawn
  B(STATION.x0, STATION.x1, FL, SP - 0.2, STATION.z0, STATION.z1, { color: K.station, pattern: PATTERN.container, tag: 'station' }),
  B(STATION.x0, STATION.x1, SP - 0.2, SP, STATION.z0, STATION.z1, { color: K.spawn, pattern: PATTERN.spawn, tag: 'spawn-deck' }),
  R([0, T1, -32.1], [0, SP, -38], 6, steps({ tag: 'deck-stair' })),
  // side stairs down both ends of the station, from the deck's back corners forward to the base terrace
  R([11, T1, -40.7], [11, SP, -46.9], 3.6, steps({ tag: 'deck-side-stair' })),
  R([-11, T1, -40.7], [-11, SP, -46.9], 3.6, steps({ tag: 'deck-side-stair' })),

  // the deck's back parapet (solid: cover on the spawn, the reservoir behind it)
  B(STATION.x0, STATION.x1, SP, SP + 1.1, STATION.z0, STATION.z0 + 0.3, { color: K.station, pattern: PATTERN.container, tag: 'deck-parapet', roof: true }),

  // ---------------- centre: the central stair down into the seed-bank garden; the Seed Vault Plaza's broad ramp (its
  //                  south face, straight up from the garden) and its stair (the south-east face)
  R([0, G0, -21.9], [0, T1, -25], 7, steps({ tag: 'garden-stair' })),
  R([0, G0, -10.95], [0, T1, -6.75], 6, { color: '#bfc3b8', pattern: PATTERN.pavers, tag: 'plaza-ramp' }),
  R([8.02, G0, -6.2], [5.6, T1, -4.425], 4, steps({ tag: 'plaza-stair' })),
  // ---------------- the meadow rolls: grass mounds with ramps all round (octagons, eight ramps each)
  ...MOUNDS.flatMap((m) => mound(m)),

  // ---------------- the east tree-hill: the hill ramp (south lobe → upper tier), stairs round the crown, the north
  //                  strip's stair up to the upper tier (beside the tower's route), the band's stairs from the meadow
  R([23, T1, -16], [23, T2, -10], 5, lawn({ tag: 'hill-ramp', color: '#9db27c' })),
  R([29.3, T1, -13.1], [29.3, T2, -10], 2.8, steps({ tag: 'lobe-stair' })),
  R([29.6, T2, -7.1], [29.6, T3, -4], 2.8, steps({ tag: 'crown-stair' })),
  R([29.4, T2, 17.1], [29.4, T3, 14], 2.6, steps({ tag: 'crown-stair' })),
  R([21, T1, 23.1], [21, T2, 20], 2.6, steps({ tag: 'strip-stair' })),
  R([12, G0, 7], [15, T1, 7], 3, steps({ tag: 'band-stair' })),
  R([12, G0, -15.5], [15, T1, -15.5], 3, steps({ tag: 'band-stair' })),

  // ---------------- the forest floor: the groves' beds (bark mulch or moss, 12 cm proud of the lawn: paintable, walkable;
  //                  props.js plants them) and the south lobe's stepping stones (8 cm)
  ...GROVES.filter((g) => g.bed).map((g) => O(g.x, g.z, g.w, g.d, g.y, g.y + BED_H, g.deg, g.bed === 'moss'
    ? lawn({ tag: 'bed', color: '#7f9c5c' }) : { tag: 'bed', color: '#7c5f47', pattern: PATTERN.rubber })),
  ...TRAILS.map((t) => O(t.x, t.z, 1.0, 0.8, t.y, t.y + TRAIL_H, t.deg, { tag: 'stone', color: '#c9c3b3', pattern: PATTERN.concrete })),
  // the ranger shelter's clearing on the upper tier: a gravel pad (8 cm) the shelter stands on
  O(23.2, -4.7, 4.0, 5.0, T2, T2 + TRAIL_H, 0, { tag: 'gravel', color: '#c4b797', pattern: PATTERN.asphalt }),
];

// ============================================================================================================
// Modes
// ============================================================================================================
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const ZONES = {
  center: [{ poly: ZONE_C, y0: 1.0, y1: 2.3 }],
  side: { poly: rect(...ZONE_S), y0: 1.0, y1: 2.1 },
};
// Tower Command (authored on Bravo's side, z > 0): across the meadow, up onto the band and the upper tier, along the
// upper tier past the crown, down onto the north strip, along Bravo's terrace to the goal
const TOWER = {
  path: [[0, T1, 0], [TRACK.x, 0], [TRACK.x, TRACK.z], [TRACK.goalX, TRACK.z]],
  checkpoints: [[TRACK.x, 8], [18, TRACK.z]],
};

// ============================================================================================================
// The sprout pods (the stage's gimmick; src/game/pods.js runs them): seed bulbs in low planters that grow a hedge when
// inked — the team that fills its meter first owns it: tinted in its ink, climbable in that ink, high ground on top,
// a wall across the lane for everyone. Alpha's half, mirrored. The planters (0.9 × 0.5 × 0.9, the engine's default
// `col`) are the stage's props; the engine draws the bulbs (on the soil: bulbY 0.46) and the hedges (props.js types).
// ============================================================================================================
const HEDGE = [3.0, 1.8, 0.9];
const pod = (id, x, y, z, rotY, size = HEDGE) => ({ id, pos: [x, y, z], rotY, size, pod: { type: 'treehills_pod' }, hedge: { type: 'treehills_hedge' } });
export const PODS = {
  mirror: true,
  timing: { last: 20, wilt: 1.0, recharge: 6 },
  bulbY: 0.46,
  modes: { boss: 'on' },
  list: [
    pod('meadow-w', -6.3, G0, -7.6, 0),                 // between the plaza's climbable face and the greenhouse pod
    pod('meadow-e', 5.3, G0, -11.8, Math.PI / 2),       // east of the plaza's ramp, facing the mound
    pod('garden-w', -2.6, G0, -19.6, Math.PI / 2),      // the garden's central path, beside the footbridge
    pod('garden-e', 3.2, G0, -20.2, Math.PI / 2),
    pod('band-e', 17.25, T1, -17, Math.PI / 2),         // the east band, over the meadow
    pod('terrace-e', 15.5, T1, -25.5, Math.PI / 6),     // the base terrace, beside the side zone
    pod('strip-w', -18, T1, -25, 0),                    // the west strip (off the tower's route)
  ],
};

const LAYOUT_TREEHILLS = {
  id: 'treehills',
  bounds,
  spawnPads: [PAD, [-PAD[0], PAD[1], -PAD[2]]],
  spawnBarrier: 4.2,
  // match intro: high over the meadow's far side, looking at the east tree-hill (its name along the wall, the turbine on
  // the crown), then down onto your deck
  intro: { from: [-10, 12, 12], lookFrom: [22, 6, 2], toBack: 3.0 },
  // stage-select picture: from over Alpha's west terrace across the meadow to the tree-hill, Bravo's station and the
  // dome's grid over the simulated sky
  art: { from: [-21, 10, -41], look: [9, 5.5, 4], fov: 64 },
  water: 'marina',   // the reservoir: calm, clean engineered water (the marina water mode: no sea spray)
  env: {
    backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false,
    // the reservoir: clean teal-green, glass-calm; the dome's simulated sky: a slightly too-perfect clean blue with a
    // soft sun, the cavern's air a touch hazy toward the rock walls
    theme: {
      all: { seaDeep: '#0e4744', seaShallow: '#2b8a7a', seaCrest: '#8fd6c2', foam: '#eef8f3', waveStrength: 0.28, seaAmbientK: 0.64,
        marina: { channel: '#0f4c46', shade: '#061714', calm: 0.35, lap: 0.6, caustic: 1.7, wet: 0.45 } },
      day: { zenith: '#2474d6', skyMid: '#62aef0', horizon: '#cde9f8', haze: [1 / 2400, 0.85, 300], fog: [30, 1400], sunIntensity: 3.1 },
      // the dome plays a warm sunset: a little more fill than an open-air dusk (the cavern's screens light it)
      sunset: { hemiIntensity: 0.74, envK: 0.5, grade: { uExposure: 1.07, uSat: 1.07 } },
    },
  },
  zones: ZONES,
  tower: TOWER,
  pods: PODS,
  // Boss Battle: HULLBREAKER's floor is the meadow (0) — its home ground the whole lowland (≈ 870 m²). The terraces (1.3)
  // cover more ground than the lowland, so without the hint the boss nav's "most common ground level" would be theirs
  boss: { floorY: G0 },
  single: [B(-CORE.x, CORE.x, FL, G0, -CORE.z, CORE.z, lawn({ tag: 'meadow', mural: [{ n: [0, 1, 0], id: MURAL.meadow }] })), ...PLAZA_G.cols, ...PLAZA_G.ledges, ...BAND_PAIR, ...UPPER_PAIR],
  half: HALF,
  decor: { lamps: [], palms: [], flags: [[-7.6, SP, -46.4], [7.6, SP, -46.4]] },
};

export const LAYOUT = LAYOUT_TREEHILLS;
