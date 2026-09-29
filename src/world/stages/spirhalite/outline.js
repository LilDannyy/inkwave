// Spirhalite Islands — the landmass outline (pure data: imported by layout.js for the ground, by props.js for the shore
// dressing and by backdrop.js for the sandy banks under its edges). One point-symmetric outline round the whole arena:
// Alpha's half chain from the central sandbar's north shore round its half to the mirror of that point; the full outline
// is the chain + its mirror.
//
// The chain is an S (seen as the minimap shows it to Alpha: +x on the left). The middle stroke is the central sandbar
// under the Great Arch, running WSW–ENE through the centre; Alpha's half carries on west along the mid islet, bends
// south round its lagoon (the bend: an inlet from the sea spanned by the ancient causeway, a sandbar neck on the lagoon
// side) and runs back east along the bottom stroke (the camp islet, a sandbar pinch, the helipad islet) to the tail.
// From the tail two arms reach back north into the lagoon: the pillar headland (the cascade pillar's islet, tied to the
// tail by a broad sand tombolo — Alpha's side zone round the pillar; a log bridge from its tip to the central sandbar)
// and the Arch spit, a sandbar along the lagoon's mouth inside the Great Arch's leg (a second log bridge from its tip,
// under the arch, to the central sandbar's east end). Bravo's half is the same turned 180°.
import { symOutline, LEVELS } from './islands.js';

// the cascade pillar (Alpha's; Bravo's is the mirror): its centre, the plinth (1.3) and tier (2.5) octagons' circumradii,
// the headland's radius round it
export const PILLAR = { x: -1.5, z: -18.6, plinth: 3.8, tier: 2.2, isle: 6.6 };
const arc = (a0, a1, step) => { const out = []; for (let a = a0; a <= a1 + 1e-9; a += step) { const r = (a * Math.PI) / 180; out.push([+(PILLAR.x + Math.cos(r) * PILLAR.isle).toFixed(2), +(PILLAR.z + Math.sin(r) * PILLAR.isle).toFixed(2)]); } return out; };

export const CHAIN = [
  [1.0, 7.6], [-4.0, 5.6], [-8.0, 3.9], [-12.0, 2.6], [-16.0, 1.4], [-20.0, 0.6], [-24.0, 0.2], [-28.0, -0.4],   // mid islet: north shore
  [-31.6, -2.2], [-34.2, -5.6], [-35.2, -9.6], [-34.6, -13.2],                                                   // the bend's head
  [-32.0, -14.6], [-28.5, -15.0], [-24.6, -15.6], [-23.4, -18.6], [-24.6, -21.4], [-28.5, -22.6], [-32.6, -23.2], // the inlet under the causeway
  [-35.2, -26.8], [-35.4, -31.4], [-33.5, -35.9], [-29.4, -40.4], [-23.8, -43.4], [-17.0, -44.6], [-11.6, -44.2], // the camp islet
  [-9.4, -42.4], [-8.4, -39.8], [-7.0, -39.3], [-5.2, -40.3], [-4.2, -42.4], [-2.2, -44.0],                       // the pinch (an inlet from the south)
  [3.6, -44.8], [10.0, -44.6], [16.6, -43.6], [19.8, -39.6], [21.0, -35.4], [20.8, -30.6], [19.0, -26.8],        // the helipad islet, the tail
  [16.6, -24.4], [15.9, -20.0], [15.9, -14.2], [16.8, -11.4], [16.7, -8.6], [12.2, -8.4], [11.3, -10.0],        // the Arch spit: out along the leg …
  [10.9, -12.4], [10.9, -16.0], [10.7, -20.4],                                                                    // … and back down the east bay
  [9.4, -22.5], [7.2, -22.9], [5.4, -22.4],                                                                       // the east bay's head
  ...arc(-25, 205, 23),                                                                                           // the pillar headland
  [-7.4, -23.8], [-7.9, -26.2],                                                                                   // the west pool's beach
  [-8.5, -28.6], [-12.5, -28.4], [-15.8, -27.0], [-17.8, -24.4], [-18.4, -21.0], [-18.2, -17.0], [-17.4, -13.8], // the lagoon's shore, the neck
  [-15.0, -12.7], [-11.0, -11.5], [-7.0, -9.9], [-3.2, -8.4],                                                    // mid islet: lagoon shore
];
export const OUTLINE = symOutline(CHAIN);
// the wet-sand shelf bar's top on outline edge i (edges alternate; an odd chain wraps round on the third level)
export const barLevel = (i) => { const n = CHAIN.length, k = i % n; return n % 2 && k === n - 1 ? LEVELS[2] : LEVELS[k % 2]; };
// every shore with its bar level per edge: the backdrop's banks run under all of them
export const SHORES = [{ poly: OUTLINE, level: barLevel }];
