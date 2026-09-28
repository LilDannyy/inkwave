// Spirhalite Islands — the landmass outline (pure data: imported by layout.js for the ground and by backdrop.js for the
// sandy banks under its edges). One point-symmetric outline round the whole arena: Alpha's half chain from the central
// sandbar's north shore round its half to the mirror of that point; the full outline is the chain + its mirror.
//
// The chain is an S (seen as the minimap shows it to Alpha: +x on the left). The middle stroke is the central sandbar
// under the Great Arch, running WSW–ENE through the centre; Alpha's half carries on west along the mid islet, bends
// south round its lagoon (the bend: an inlet from the sea spanned by the ancient causeway, a sandbar neck on the lagoon
// side) and runs back east along the bottom stroke (the camp islet, a sandbar pinch, the helipad islet) to the tail.
// Bravo's half is the same turned 180°. In each lagoon, between the tail and the central sandbar, stands the cascade
// pillar's islet (ISLE: its own outline, joined to both by log bridges).
import { symOutline, LEVELS } from './islands.js';

export const CHAIN = [
  [1.0, 7.6], [-4.0, 5.6], [-8.0, 3.9], [-12.0, 2.6], [-16.0, 1.4], [-20.0, 0.6], [-24.0, 0.2], [-28.0, -0.4],   // mid islet: north shore
  [-31.6, -2.2], [-34.2, -5.6], [-35.2, -9.6], [-34.6, -13.2],                                                   // the bend's head
  [-32.0, -14.6], [-28.5, -15.0], [-24.6, -15.6], [-23.4, -18.6], [-24.6, -21.4], [-28.5, -22.6], [-32.6, -23.2], // the inlet under the causeway
  [-35.2, -26.8], [-35.4, -31.4], [-33.5, -35.9], [-29.4, -40.4], [-23.8, -43.4], [-17.0, -44.6], [-11.6, -44.2], // the camp islet
  [-9.4, -42.4], [-8.4, -39.8], [-7.0, -38.6], [-5.0, -39.4], [-3.8, -41.8], [-2.2, -44.0],                       // the pinch (an inlet from the south)
  [3.6, -44.8], [10.0, -44.6], [15.6, -43.0], [19.4, -39.8], [21.0, -35.4], [20.8, -30.6], [19.0, -26.8],        // the helipad islet, the tail
  [16.0, -24.6], [11.6, -23.6], [7.0, -23.8], [3.6, -25.0], [0.4, -26.1], [-3.0, -26.6], [-5.4, -27.6],          // the tail's lagoon shore
  [-8.5, -28.6], [-12.5, -28.4], [-15.8, -27.0], [-17.8, -24.4], [-18.4, -21.0], [-18.2, -17.0], [-17.4, -13.8], // the lagoon's shore, the neck
  [-15.0, -12.0], [-11.0, -10.6], [-7.0, -9.2], [-3.0, -8.2],                                                     // mid islet: lagoon shore
];
export const OUTLINE = symOutline(CHAIN);
// the wet-sand shelf bar's top on outline edge i (edges alternate; an odd chain wraps round on the third level)
export const barLevel = (i) => { const n = CHAIN.length, k = i % n; return n % 2 && k === n - 1 ? LEVELS[2] : LEVELS[k % 2]; };
// the cascade pillar's islet (Alpha's; Bravo's is the mirror): round, its east shore ~5 m out from the pillar so the
// cascade pours off it into the lagoon
export const ISLE = [[5.1, -16.5], [4.73, -14.22], [3.15, -12.55], [1.18, -11.33], [-1.16, -11.43], [-3.12, -12.59], [-4.73, -14.22], [-5.15, -16.5], [-4.78, -18.8], [-3.15, -20.45], [-1.16, -21.57], [1.13, -21.47], [3.27, -20.6], [4.5, -18.67]];
export const isleLevel = (i) => (ISLE.length % 2 && i === ISLE.length - 1 ? LEVELS[2] : LEVELS[i % 2]);
// every shore (the S and both islets) with its bar level per edge: the backdrop's banks run under all of them
export const SHORES = [{ poly: OUTLINE, level: barLevel }, { poly: ISLE, level: isleLevel }, { poly: ISLE.map(([x, z]) => [-x, -z]), level: isleLevel }];
