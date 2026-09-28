// Tower Command paths per stage (src/game/tower.js reads layout.tower). Drawn by hand on the stage top-downs.
// Coordinates are world metres. The path runs from the centre (where the tower starts) to Alpha's goal, on Bravo's side
// of the stage (Alpha pushes the tower along it); Bravo's half is its 180° mirror, like the stages themselves.
//   path:           [[x, z] | [x, y, z], …]   centre → goal: the corners of straight runs (the track is straight lines
//                            only; it follows the floor, climbs straight up a wall / box it meets and straight down a
//                            drop — tower.js builds that). A y forces that height at that corner.
//   checkpoints:    [[x, z] | m, …]   spots on Alpha's side (Bravo's are the mirror), or metres from the centre (or
//                            fractions of the length, ≤ 1) — default TOWER.checkpoints
//   checkpointTime: [s, s]   optional, per checkpoint (default: its share of TOWER.checkpointPoints at TOWER.pointRate)
// The tower's speed on a stage comes from its path length: the whole track is TOWER.trackPoints (60) of the 100 points.
// A stage with no entry gets a stand-in route (tower.js placeholderPath: the walkable route from the centre toward
// Bravo's base).
// Drawn by the user on the stage top-downs (2026-09-28).
export const TOWER_DEFS = {
  tidewater: {
    path: [[0, 0], [-19.51, 0], [-19.51, 4.66], [-15.39, 4.66], [-15.39, 12.49], [7.11, 12.49], [7.11, 8.36], [15.79, 8.36], [15.79, 15.36], [3.53, 15.36], [3.52, 14.73], [-0.06, 14.73], [-0.06, 28.44], [-4.41, 28.44]],
    checkpoints: [[-14.97, 12.81], [-0.03, 21.38]],
  },
  kelpline: {
    path: [[0, 0], [-14.83, 11.11], [-9.56, 16.38], [-2.86, 9.68], [2.9, 17.36], [-1.21, 20.44], [2.88, 24.54], [6.64, 20.78], [5.14, 19.28], [19.44, 8.56], [30.13, 22.82]],
    checkpoints: [[-6.73, 11.95], [-1.03, 19.8], [16.91, 9.84]],
  },
  halyard: {
    path: [[0, 0], [17.64, 0], [17.64, 7.85], [11.68, 7.85], [11.68, 17.4], [-12.9, 17.4], [-12.9, 30.4]],
    checkpoints: [[17.76, 2.14], [11.29, 17.8], [-6.91, 17.79]],
  },
  saltpan: {
    path: [[0, 0], [-17.38, 0], [-17.38, 8.64], [13.03, 8.64], [13.03, 18.44], [2.87, 18.44], [2.87, 30.22]],
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
    path: [[0, 0], [0, 7.71], [12.81, 7.71], [15.63, 20.96], [10.87, 20.96], [10.87, 19.11], [6.06, 19.11], [-5.24, 22.39], [-5.23, 37.38]],
    checkpoints: [[13.02, 8.35], [6.85, 19.89], [-5.38, 26.16]],
  },
};
