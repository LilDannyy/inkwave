// [b5-karp] Bazookarp stage data: LAYOUT.bazookarp per stage (maps.js merges it, as TOWER_DEFS). SPEC §4.1.
// CONVENTION: it describes ALPHA's attack — its weirs and its Dragon Gate stand on BRAVO's half (the half holding
// spawnPads[1], +z on every stage), and freeZones are BRAVO's own Carp-Free Zones. The engine mirrors everything 180°
// about the vertical through the origin for Bravo's attack and Alpha's zones (like `half` pieces and Tower paths).
// (The Long Stages notes give their spots on Alpha's half: negate x and z to enter them here — SPEC §9.3.)
//
//   start:     [0, 0] (or [0, y, 0]: a raised Pond) — always the exact centre
//   weirs:     [{ at: [x, z] | [x, y, z], yaw (° the carrier walks through it; 0 = +z), r }]  1, or 2 on different
//              routes at the same count (±2)
//   gate:      { at, yaw }   in front of Bravo's spawn or a level below
//   freeZones: [{ poly: [[x, z] …], y0, y1, signs: [[x, z, yaw°]], eras }]   wholly on Bravo's half; a sign at every entrance
//   optional:  noRetreat, carrierBlock, noRest ([{ poly, y0, y1 }]), hopVeto ([[x, y, z, x, y, z]]), routes ({ name: [[x, z] …] }),
//              shellHp (a per-stage override, balance only)
// A stage with no entry plays on a placeholder (karpField.js placeholderKarp): Pond at the centre, the Gate on the nav
// route toward Bravo's pad, one weir half way, a free zone round each spawn deck.
//
// WP1 (karp-engine) first cuts for the two reference stages, from SPEC §9.3 (weirs moved toward mid, Gates where the
// stretch notes put them, the spawn decks as free zones). They only have to load and run; WP4b (karp-ref) redesigns
// both until the checker passes.
export const BAZOOKARP_DEFS = {
  halyard: {
    start: [0, 0],
    weirs: [{ at: [-8.5, 0, 28.0], yaw: 0 }],
    gate: { at: [0, 0, 52.5], yaw: 0 },
    freeZones: [
      { poly: [[-9, 59], [9, 59], [9, 72], [-9, 72]], y0: 2.0, y1: 3.2, signs: [[-8.6, 59.4, 180], [8.6, 59.4, 180]] },
    ],
  },
  lockgate: {
    start: [0, 0],
    weirs: [{ at: [8.0, 0, 30.0], yaw: 0 }],
    gate: { at: [2, 0, 57.5], yaw: 0 },
    freeZones: [
      { poly: [[-13, 62], [5, 62], [5, 74], [-13, 74]], y0: 2.0, y1: 3.2, signs: [[-12.6, 62.4, 180], [4.6, 62.4, 180]] },
    ],
  },
};
