// [karp-face] Which stages Bazookarp offers (DECISIONS #10): a stage with no Bazookarp layout of its own
// (LAYOUT.bazookarp, from its stage module or BAZOOKARP_DEFS) is hidden in this mode — an intermediate state until every
// stage has one; with ?wipstages (harness: WIPSTAGES=1) it shows, tagged PREVIEW, and plays on the placeholder layout.
import { MAP_LAYOUTS } from './maps.js';
import { SHOW_WIP } from '../config.js';

export const karpLayoutReady = (id) => !!MAP_LAYOUTS[id]?.bazookarp;
export const karpStageListed = (id) => karpLayoutReady(id) || SHOW_WIP;
export const karpPreview = (id) => !karpLayoutReady(id);
