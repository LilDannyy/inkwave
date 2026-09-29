// Tower Command paths per stage (src/game/tower.js reads layout.tower). Drawn by hand on the stage top-downs.
// Coordinates are world metres. The path runs from the centre (where the tower starts) to Alpha's goal, on Bravo's side
// of the stage (Alpha pushes the tower along it); Bravo's half is its 180° mirror, like the stages themselves.
//   path:           [[x, z] | [x, y, z], …]   centre → goal: the corners of straight runs (the track is straight lines
//                            only; it follows the floor, climbs straight up a wall / box it meets and straight down a
//                            drop — tower.js builds that). A y forces that height at that corner.
//   checkpoints:    [[x, z] | m, …]   spots on Alpha's side (Bravo's are the mirror), or metres from the centre (or
//                            fractions of the length, ≤ 1) — default TOWER.checkpoints
//   checkpointTime: [s, s]   optional, per checkpoint (default: its share of the checkpoint points at TOWER.pointRate)
// The tower's speed on a stage comes from its path length: the whole track is TOWER.trackPoints (60) of the 100 points,
// or 80 on a stage with two checkpoints (TOWER.twoCheckpoints: 10 s each; its track is twice as long as the first
// drawing, with detour loops, so the tower runs 1.5× as fast and still takes 100 s to the goal — the user, 2026-09-30).
// A stage with no entry gets a stand-in route (tower.js placeholderPath: the walkable route from the centre toward
// Bravo's base).
// Drawn by the user on the stage top-downs (2026-09-28).
export const TOWER_DEFS = {
  tidewater: {
    // (fitted: the loop round the flower border 0.24 / 0.11 m in, clear of the promenade's kerb; the goal run 0.89 m
    //  nearer the bandstand, clear of the fountain's basin — Tower Command's build of the stage, see its layout.js TW)
    path: [[0, 0], [-19.51, 0], [-19.51, 4.66], [-15.39, 4.66], [-15.39, 12.49], [7.11, 12.49], [7.11, 8.36], [15.55, 8.36], [15.55, 15.25], [3.53, 15.25], [3.52, 14.73], [-0.06, 14.73], [-0.06, 27.55], [-4.41, 27.55]],
    checkpoints: [[-14.97, 12.81], [-0.03, 21.38]],
  },
  kelpline: {
    // on the berth's 35° grid (layout.js ROT; berth-local x across the pier, z along it — corners (0, 0), (−17.9, 0),
    // (−17.9, 5.6), (−7.3, 5.6), (−7.3, 15.9), (−12.3, 15.9), (−12.3, 21.3), (−6.6, 21.3), (−6.6, 17.6), (12.2, 17.6),
    // (12.2, 36)): out under the crane portal, back along the stack ends, up onto Block 4A, down into the lane and on
    // along the ground: through the reefer rack's aisle (layout.js AISLE; checkpoint 3 in it), down row 1's empty slot
    // to the base apron
    path: [[0, 0], [-14.66, 10.27], [-11.45, 14.85], [-2.77, 8.77], [3.14, 17.21], [-0.96, 20.08], [2.14, 24.5], [6.81, 21.23], [4.69, 18.2], [20.09, 7.42], [30.64, 22.49]],
    checkpoints: [[-6.92, 11.68], [-0.87, 20.02], [16.82, 9.71]],
  },
  halyard: {
    // (the Long Stages stretch: from the boatyard the track carries on through the slice — east along the yard's front
    //  between the tug's bow ramp and the travel-lift dock's hoist, round the slip's head and down the hardstanding past
    //  the laid-up yacht to the goal by the quay, 24 m further out like the spawn; props-marina-slice.js)
    path: [[0, 0], [17.64, 0], [17.64, 7.85], [11.68, 7.85], [11.68, 17.4], [-12.9, 17.4], [-12.9, 32.2], [-21.9, 32.2], [-21.9, 54.4]],
    checkpoints: [[17.76, 2.14], [11.29, 17.8], [-6.91, 17.79]],
  },
  saltpan: {
    // starts on the pump staging (0.08; the wind pump stands on a trestle overhead in this mode), steps onto the ±X
    // boardwalk's centre line (z 1.7, as drawn) and runs flat along the dykes: the mid dyke, the front dyke (its centre,
    // z 9), the dock yard, the sluice dyke (z 18.5), then down the back-pan boardwalk (x 2.7) to the yard
    path: [[0, 0.08, 0], [0, 1.7], [-17.38, 1.7], [-17.38, 9], [13.03, 9], [13.03, 18.5], [2.7, 18.5], [2.7, 30.22]],
    checkpoints: [[-17.37, 8.83], [13.45, 18.81]],
  },
  crossmarket: {
    path: [[0, 0], [21.06, 12.32], [21.06, 17.77], [16.21, 17.77], [16.21, 19.5], [0.41, 19.5], [0.4, 10.23], [-17.39, 10.24], [-17.39, 30.86]],
    checkpoints: [[21.41, 13.25], [-12.77, 9.98]],
    yaw: 0,   // square to the streets (the drawn runs' average, -4.6°, sat skew to every street; only the first run is diagonal)
  },
  lockgate: {
    // ([-1.25, 1.25] is a straight-through point on the drawn diagonal, not a turn: it ends the level run over the
    // bridge's crown where the platform leaves it, so the track follows the hump down instead of cutting into it)
    path: [[0, 0], [-1.25, 1.25], [-11.46, 11.46], [-11.46, 17.52], [17.1, 17.52], [17.1, 22.67], [10.32, 22.67], [10.32, 30.44]],
    checkpoints: [[-11.68, 17.81], [17.39, 17.85]],
  },
  terraces: {
    // (starts at the sagrato's top, under San Vito's dome — the chapel's roof is over it; the platform square to the
    // stage; runs shifted ≤ 1.1 m from the drawing to clear the funicular's balustrade, the Limonaia's terrace wall and the
    // Scalinata's foot)
    path: [[0, 1.2, 0], [0, 7.71], [12.35, 7.71], [15.57, 20.66], [11.7, 20.66], [11.7, 19.11], [6.06, 19.11], [-6.3, 22.7], [-6.3, 37.38]],
    checkpoints: [[13.02, 8.35], [6.85, 19.89], [-6.3, 26.16]],
    yaw: 0,
  },
};
