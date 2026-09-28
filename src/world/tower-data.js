// Tower Command paths per stage (src/game/tower.js reads layout.tower). Drawn by hand on the stage top-downs.
// Coordinates are world metres. The path runs from the centre (where the tower starts) to Alpha's goal, on Bravo's side
// of the stage (Alpha pushes the tower along it); Bravo's half is its 180° mirror, like the stages themselves.
//   path:           [[x, z] | [x, y, z], …]   centre → goal; y is optional (the floor under each point is used)
//   checkpoints:    [m, m]   metres along the path from the centre (or fractions of its length, ≤ 1) — default
//                            TOWER.checkpoints
//   checkpointTime: [s, s]   optional, per checkpoint (default TOWER.checkpointTime)
// A stage with no entry gets a stand-in route (tower.js placeholderPath: the walkable route from the centre toward
// Bravo's base).
export const TOWER_DEFS = {
};
