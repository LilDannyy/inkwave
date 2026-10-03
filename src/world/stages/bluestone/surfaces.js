// Bluestone Junction — stage surface materials (texlib layers `bluestone:<name>`) on this stage's reserved PATTERN slots 64–66
// (stages/surfaces.js STAGE_SLOTS). See src/world/stages/cargo/surfaces.js for the contract.
//
// BLOCKOUT: the slots are named (layout.js and the era engine's `eras.remap` use them) but carry no material yet, so the
// level shader draws them as concrete tinted by each block's colour (levelMaterial.js: "concrete where a slot is unused").
// The three materials are the art pass (DESIGN.md §5.3):
//   bluestone  dark blue-grey basalt setts #57606b, paler joints, a dished gutter: lanes, the circus, kerbs, the terrace
//   granite    grey granite setts #8a8478 with cable-tram slot rails: Swimston and Flathead carriageways (1880s; remapped
//              to PATTERN.asphalt today and PATTERN.pavers in the 3000s)
//   sandstone  pale sandstone flags #b5a990: the concourse, the GPO terrace and steps
export const SURF = { bluestone: 64, granite: 65, sandstone: 66 };
export const SURFACES = [];
