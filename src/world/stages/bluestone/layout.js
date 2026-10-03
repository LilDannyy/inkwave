// Bluestone Junction — stage layout (src/world/stages/bluestone/). A placeholder deck until the stage is built: the stage owns every
// file in this folder (layout.js, props.js, surfaces.js, murals.js, backdrop.js).
import { PATTERN, B } from '../../mapkit.js';
import { buildBackdrop } from './backdrop.js';

const LAYOUT_BLUESTONE = {
  id: 'bluestone',
  bounds: { minX: -24, maxX: 24, minZ: -44, maxZ: 44 },
  spawnPads: [[0, 2.4, -40], [0, 2.4, 40]],
  spawnBarrier: 4.2,
  env: { backdrop: buildBackdrop },
  single: [B(-20, 20, -2, 0, -36, 36, { color: '#c9ccd2', pattern: PATTERN.concrete })],
  half: [B(-8, 8, -2, 2.4, -44, -36, { color: '#dfe2e8', pattern: PATTERN.spawn }), B(6, 10, 0, 1.2, -18, -12, { color: '#aeb4bf' })],
  decor: { lamps: [], palms: [], flags: [] },
};

export const LAYOUT = LAYOUT_BLUESTONE;
