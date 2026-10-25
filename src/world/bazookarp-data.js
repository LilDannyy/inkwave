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
//              shellHp (a per-stage override, balance only), waive ([{ check: '7d', at: [x, z], why, probe?, r? }]: a checker
//              find the lead accepted in the stage note — bazookarp-check.cjs reports a find of that check (of that probe)
//              within max(2, r) m as waived, and for #7d every find of its numbered flag with it [b5-karp-checker fix4])
//              (eras on a zone are matched strictly against the stage's state keys, as karpField does; the engine ignores
//              eras on noRetreat / carrierBlock / noRest, and the checker FAILs them there)
// A stage with no entry plays on a placeholder (karpField.js placeholderKarp): Pond at the centre, the Gate on the nav
// route toward Bravo's pad, one weir half way, a free zone round each spawn deck.
//
// WP1 (karp-engine) first cuts for the two reference stages, from SPEC §9.3 (weirs moved toward mid, Gates where the
// stretch notes put them, the spawn decks as free zones). They only have to load and run; WP4b (karp-ref) redesigns
// both until the checker passes.
export const BAZOOKARP_DEFS = {
  halyard: {
    // The ferry's car deck is the central, open fight space. Bazookarp clears the cabin so the Pond has a walkable ring.
    start: [0, 1.3, 0],
    carrierField: { swimJump: [[[-24, -36], [-17, -36], [-17, -25], [-24, -25]], [[-12, -20], [-7, -20], [-7, -10], [-12, -10]]] },   // [b5-karp-ref] inked boat/canal crossings, mirrored by the Carp Field
    weirs: [{ at: [-1.5, 0, 27.5], yaw: 0 }],          // the Long Pier / boatyard junction (§9.3)
    gate: { at: [2.5, 0, 54.1], yaw: 0 },                 // in front of Bravo's spawn, centered on the landing lane
    freeZones: [
      { poly: [[-10, 62], [10, 62], [10, 69.4], [-10, 69.4]], y0: 2.0, y1: 4.6, signs: [[-11.2, 65.9, 90], [11.2, 65.9, 270], [-4.8, 61.5, 0], [4.8, 61.5, 180], [-8.3, 64.7, 90], [8.3, 64.7, 270]] },   // deck free zone; entrance signs stand outside it
      { poly: [[-24, 11], [-11, 11], [-11, 26], [-24, 26]], y0: 2.2, y1: 4.5, signs: [[-17.5, 13, 0]] },
    ],
    hopVeto: [
      [-15.5, 2.9, -18.5, -17.5, 0.7, -17.5], [-15.5, 2.9, -17.5, -17.5, 0.7, -17.5], [-14.5, 2.9, -17.5, -17.5, 0.7, -17.5],
      [14.5, 2.9, 17.5, 17.5, 0.7, 17.5], [15.5, 2.9, 17.5, 17.5, 0.7, 17.5], [15.5, 2.9, 18.5, 17.5, 0.7, 17.5],
    ],
  },
  lockgate: {
    // The Pond sits on the centre of the humpback bridge (3.3 m); its Bazookarp plaza widens the approaches.
    start: [0, 3.45, 0],
    carrierField: { swimJump: [[[-23, -18], [-15, -18], [-15, -8], [-23, -8]]] },   // [b5-karp-ref] inked boat/canal crossing, mirrored by the Carp Field
    weirs: [{ at: [-2.2, 0, 24], yaw: 0 }],             // the weigh-house yard, at the middle-side end of the dry dock
    gate: { at: [2, 0, 51.5], yaw: 0 },                 // in front of Bravo's spawn (12.4 m from the pad)
    freeZones: [
      { poly: [[-12, 58], [4, 58], [4, 70], [-12, 70]], y0: 2.0, y1: 3.2, signs: [[-11.6, 58.4, 180], [3.6, 58.4, 180], [4, 64.2, 0], [-12, 63.5, 180], [-1.8, 59, 180], [-6.3, 59, 180]] },   // the spawn deck
    ],
  },
};
