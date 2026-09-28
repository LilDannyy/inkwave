// Spirhalite Islands — the landmass outline (pure data: imported by layout.js for the ground and by backdrop.js for the
// sandy banks under its edges). One point-symmetric outline round the whole arena: Alpha's half chain from the west
// tip of its sandbar spit round its half to the mirror of that point; the full outline is the chain + its mirror.
import { symOutline, LEVELS } from './islands.js';

export const CHAIN = [
  [-21.7, -0.5], [-21.9, -3.6], [-21.6, -6.6],                                        // spit (under the causeway's end)
  [-16.4, -7.2], [-13.2, -6.6], [-9.5, -6.4], [-8.2, -8.2], [-8.4, -10.8],            // north lagoon's shore
  [-10.0, -10.6], [-12.5, -10.1], [-15.0, -10.8], [-16.6, -12.6], [-17.1, -15.0],     // the pillar islet
  [-16.6, -17.4], [-15.0, -19.2], [-12.5, -19.9], [-10.0, -19.3], [-8.4, -19.6],
  [-8.3, -21.8], [-10.5, -23.2], [-14.5, -22.7], [-17.5, -23.0], [-21.5, -23.6],      // south lagoon, camp hollow shore
  [-24.0, -26.0], [-25.0, -30.5], [-24.6, -35.5], [-22.6, -40.0], [-19.0, -44.0],     // the base island's back
  [-13.5, -46.8], [-6.5, -48.0], [4.0, -48.0], [10.5, -47.2], [15.5, -44.8],
  [19.5, -41.5], [22.3, -37.5], [23.4, -32.0], [22.2, -27.2], [19.6, -24.4],          // left islet (L1)
  [15.8, -23.7], [11.2, -24.0], [8.2, -25.2], [5.4, -24.4],                           // the bay at the east channel's end
  [4.3, -22.0], [4.6, -16.5], [4.1, -11.0], [4.5, -7.0], [6.3, -6.2],                 // mid sandbar's east shore
  [8.0, -7.4], [8.2, -9.2], [7.8, -14.0], [8.4, -19.2], [10.0, -20.8],                // islet L2
  [13.5, -21.0], [17.5, -20.4], [21.0, -18.6], [22.6, -15.0], [22.2, -11.0],
  [20.0, -8.6], [16.5, -7.6], [13.4, -6.8], [13.6, -4.0], [14.3, 0.2], [18.6, 0.2],   // L2 neck, the sandbar's east end
];
export const OUTLINE = symOutline(CHAIN);
// the wet-sand shelf bar's top on outline edge i (edges alternate; an odd chain wraps round on the third level)
export const barLevel = (i) => { const n = CHAIN.length, k = i % n; return n % 2 && k === n - 1 ? LEVELS[2] : LEVELS[k % 2]; };
