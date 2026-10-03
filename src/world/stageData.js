// Stage-module data hooks for the tools that read layouts without three.js: the stage-select thumbnail
// (mapThumb.js) and build/check-maps.mjs. Three-free (Node imports it). A stage module's data file
// (src/world/<key>-data.js) registers itself; stageDataList.js imports them all. [b5-stagehooks] docs/STAGE-MODS.md
//
// registerStageData(key, {
//   thumbBlock?(d) → 'skip' | 'dashed' | null     a layout piece in the thumbnail: leave it out / dashed outline / as usual
//   thumbBelow?(layout, api) → svg string           drawn under the blocks (lava: the region)
//   thumb?(layout, api) → svg string                drawn over the blocks, under the spawns (pipes: the legs)
//                                                   api = { X(z) → svg x, Y(x) → svg y, s (px per m), theme, W, H }
//   overlapOk?(a, b) → bool                         check-maps: true = this pair of pieces may overlap (eras: no common era)
//   check?(layout, api) → string[]                  check-maps: the module's own static rules (api = { id, mode, defs,
//                                                   solids, shape, corners, overlap2D })
// })
const DATA = new Map();
export function registerStageData(key, hooks) { DATA.set(key, { key, ...hooks }); }
export function stageDataFor(layout) {
  if (!DATA.size || !layout) return [];
  const out = [];
  for (const h of DATA.values()) if (layout[h.key] != null) out.push(h);
  return out;
}
