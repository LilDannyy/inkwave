// Turf War Craters — the stage's own far scenery (layout.env.backdrop; see the top of src/world/environment.js). Gets the
// environment's SCENERY_KIT (+ THREE, bounds, runs, rnd) — imports nothing, so layout.js stays importable in Node.
export function buildBackdrop(kit) {
  return { static: [], terrain: [], instances: [] };
}
