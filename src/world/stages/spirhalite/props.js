// Spirhalite Islands — stage prop pack + placements (owner: the spirhalite stage; see layout.js for the folder contract).
//
// register(D, H): adds this stage's prop builders to the PropKit definition table D (H = the kit helpers + THREE; every
// type is prefixed 'spirhalite_'). The builders live in props-*.js next to this file, sharing kit.js.
// PLACEMENTS: this stage's set dressing — the half list: every entry is mirrored (x, z) → (−x, −z) with rotY + π unless
// it says `mirror: false`. Solid props hand the level collision boxes (roof / rail flags as noted).
// Conventions (as props.js): metres, Y up, `pos` = base point, rotY turns local +Z (the "front").
import { makeKit } from './kit.js';
import { registerRuins, ARCH } from './props-ruins.js';
import { registerCamp } from './props-camp.js';
import { registerFlora } from './props-flora.js';

const P = Math.PI;

export function register(D, H) {
  const X = makeKit(H);
  registerRuins(D, H, X);
  registerCamp(D, H, X);
  registerFlora(D, H, X);
}

export const PLACEMENTS = [
  // ================= the ruins
  { type: 'spirhalite_arch', pos: [0, 0, 0], rotY: ARCH.rotY, mirror: false, oboxCols: true },
  { type: 'spirhalite_pillar', pos: [-12.5, 0, -15], rotY: 0 },
  { type: 'spirhalite_causeway', pos: [-19, 0, -15.75], rotY: 0, len: 18.5, w: 4.2, top: 1.3,
    posts: [[-7.4, -1], [-2.2, 1], [3.4, -1], [8.4, -1]], slabs: [[-4.5, 1, 0.3, 0.25], [5.5, -1, -0.4, -0.3]],
    rubble: [[-2.4, -11.2, 0.7], [2.6, -10.8, 0.5]] },

  // ================= spawn: the helipad (dressing for the level's pad; stairs: foot → top, width), the helicopter behind
  { type: 'spirhalite_helipad', pos: [0, 0, -42.5], rotY: 0, R: 5.9, base: 1.3, top: 3.2, open: [1, 7],
    stairs: [[0, 9.9, 0, 5.45, 3], [9.9, 0, 5.45, 0, 2.4]] },
  { type: 'spirhalite_rearpad', pos: [0, 0, -54.2], rotY: 0, w: 12, d: 10, y: 1.0 },
  { type: 'spirhalite_helicopter', pos: [0.6, 1.0, -54.4], rotY: 0.08 },

  // ================= Deep Cut's camp in the dune hollow (Alpha's side zone: x −19…−10.5, z −36.5…−29)
  { type: 'spirhalite_tent', pos: [-20.4, 0, -31.2], rotY: P / 2, w: 2.6, d: 3.4, h: 2.0 },
  { type: 'spirhalite_tent', pos: [-20.1, 0, -35.3], rotY: P / 2 - 0.35, w: 2.2, d: 2.8, h: 1.7, variant: 1 },
  { type: 'spirhalite_tarp', pos: [-16.4, 0, -35.2], rotY: 0.05, w: 3.6, d: 3.0, h: 2.35 },
  { type: 'spirhalite_table', pos: [-16.4, 0, -35.3], rotY: 0.05 },
  { type: 'spirhalite_crates', pos: [-14.0, 0, -30.8], rotY: 0.2, layout: [[0, 0, 0, 0], [1.02, 0.06, 0, 0.05], [0.5, 0.02, 1, 0.12]] },
  { type: 'spirhalite_generator', pos: [-18.3, 0, -28.9], rotY: 0.3, cable: [[0.6, 0], [1.2, -0.6], [1.6, -1.6]] },
  { type: 'spirhalite_mast', pos: [-22.6, 0, -33.8], rotY: 0.4, h: 7.5 },
  { type: 'spirhalite_lantern', pos: [-17.6, 0, -29.6], rotY: 0, to: [5.2, -0.3] },
  { type: 'spirhalite_lantern', pos: [-12.4, 0, -29.9], rotY: P },
  { type: 'spirhalite_survey', pos: [-11.2, 0, -31.8], rotY: 0.7 },
  { type: 'spirhalite_flagpole', pos: [-22.2, 0, -28.6], rotY: 0, h: 4.4 },

  // ================= cover: driftwood, a stranded crate stack, the rowing boat, washed-up debris
  { type: 'spirhalite_crates', pos: [1.1, 0, -8.7], rotY: -0.25, layout: [[0, 0, 0, 0], [0, 0.85, 0, 0.1], [0.05, 0.4, 1, -0.1]] },
  { type: 'spirhalite_driftwood', pos: [-6.9, 0, -19.8], rotY: 1.45, L: 3.4, seed: 4 },
  { type: 'spirhalite_driftwood', pos: [-2.3, 0, -5.2], rotY: 0.25, L: 3.0, seed: 9 },
  { type: 'spirhalite_rowboat', pos: [10.5, 0, -17.4], rotY: 1.35 },
  { type: 'spirhalite_debris', pos: [17.6, 0, -27.2], rotY: 0.4 },
  { type: 'spirhalite_float', pos: [-21.5, 0, -5.3], rotY: 0, r: 0.42 },
  { type: 'spirhalite_buoy', pos: [22.0, 0, -28.2], rotY: 2.2, variant: 0 },
  { type: 'spirhalite_buoy', pos: [-7.4, 0, -23.0], rotY: 0.5, variant: 1 },

  // ================= flora: monstera palms, cushion shrubs, pompom flowers, dune grass
  { type: 'spirhalite_palm', pos: [-22.3, 0, -38.3], rotY: 0, h: 4.4, lean: 1.3, seed: 3 },
  { type: 'spirhalite_palm', pos: [19.3, 0, -43.6], rotY: 0, h: 3.8, lean: 1.0, seed: 8 },
  { type: 'spirhalite_palm', pos: [21.4, 0, -19.3], rotY: 0, h: 3.5, lean: 1.2, seed: 12 },
  { type: 'spirhalite_palm', pos: [-14.9, 0, -18.7], rotY: 0, h: 3.2, lean: 0.8, seed: 5 },
  { type: 'spirhalite_palm', pos: [3.6, 0, -13.6], rotY: 0, h: 3.6, lean: 1.1, seed: 21 },
  { type: 'spirhalite_palm', pos: [13.2, 1.3, -39.4], rotY: 0, h: 3.4, lean: 0.9, seed: 17 },
  { type: 'spirhalite_palm', pos: [11.8, 0, -4.6], rotY: 0, h: 4.0, lean: 1.4, seed: 25 },
  { type: 'spirhalite_shrub', pos: [-12.2, 0, -46.2], rotY: 0, w: 2.2, h: 1.2, seed: 3 },
  { type: 'spirhalite_shrub', pos: [11.8, 0, -46.4], rotY: 0.5, w: 1.8, h: 1.0, seed: 6 },
  { type: 'spirhalite_shrub', pos: [-23.3, 0, -30.2], rotY: 0.5, w: 1.6, h: 1.0, seed: 9 },
  { type: 'spirhalite_shrub', pos: [21.6, 0, -11.8], rotY: 0.5, w: 1.5, h: 0.9, seed: 4 },
  { type: 'spirhalite_pompoms', pos: [-21.6, 0, -37.0], n: 8, seed: 1 },
  { type: 'spirhalite_pompoms', pos: [-10.3, 0, -19.0], n: 6, seed: 2 },
  { type: 'spirhalite_pompoms', pos: [-15.9, 0, -11.6], n: 7, seed: 3 },
  { type: 'spirhalite_pompoms', pos: [20.6, 0, -22.3], n: 9, seed: 4 },
  { type: 'spirhalite_pompoms', pos: [9.3, 0, -9.8], n: 5, seed: 5 },
  { type: 'spirhalite_pompoms', pos: [3.4, 0, -21.2], n: 6, seed: 6 },
  { type: 'spirhalite_pompoms', pos: [-17.0, 0, -44.6], n: 8, seed: 7 },
  { type: 'spirhalite_pompoms', pos: [14.8, 1.3, -40.2], n: 7, seed: 8 },
  { type: 'spirhalite_pompoms', pos: [-12.3, 0, -3.3], n: 5, seed: 9 },
  { type: 'spirhalite_pompoms', pos: [22.3, 0, -34.0], n: 7, seed: 10 },
  { type: 'spirhalite_grass', pos: [-20.8, 0, -24.8], n: 6, r: 1.0, seed: 1 },
  { type: 'spirhalite_grass', pos: [-8.1, 0, -12.8], n: 5, r: 0.7, seed: 2 },
  { type: 'spirhalite_grass', pos: [13.8, 0, -21.6], n: 5, r: 0.8, seed: 3 },
  { type: 'spirhalite_grass', pos: [21.5, 0, -15.5], n: 6, r: 0.9, seed: 4 },
  { type: 'spirhalite_grass', pos: [-24.0, 0, -33.5], n: 7, r: 1.0, seed: 5 },
  { type: 'spirhalite_grass', pos: [4.0, 0, -18.2], n: 4, r: 0.6, seed: 6 },
  { type: 'spirhalite_grass', pos: [16.3, 0, -46.0], n: 6, r: 1.0, seed: 7 },
  { type: 'spirhalite_grass', pos: [-18.5, 0, -45.0], n: 6, r: 1.0, seed: 8 },
  { type: 'spirhalite_grass', pos: [-21.8, 0, -1.8], n: 4, r: 0.5, seed: 9 },
  { type: 'spirhalite_grass', pos: [8.6, 0, -13.5], n: 5, r: 0.7, seed: 10 },

  // ================= the sea round the islands: the strange vanes (out of bounds)
  { type: 'spirhalite_vane', pos: [-31.5, 0, -21], rotY: 0.4, h: 4.6, speed: 0.3 },
  { type: 'spirhalite_vane', pos: [30.5, 0, -37], rotY: -0.3, h: 5.2, speed: 0.22 },
  { type: 'spirhalite_vane', pos: [-33, 0, 9], rotY: 1.2, h: 3.8, speed: 0.4 },
];
