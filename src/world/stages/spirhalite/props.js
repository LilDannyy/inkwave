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
import { LAYOUT } from './layout.js';

const P = Math.PI;

// Ground height under (x, z) from the layout's pieces (boxes, turned boxes, ramps; the half list mirrored): the highest
// top no more than `hint` + 0.3 m — so flora and debris sit on the wet-sand shelf (9–27 cm under the dry sand) or the
// dune they stand on instead of floating.
const PIECES = [...LAYOUT.single, ...LAYOUT.half, ...LAYOUT.half.map((d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] }))]
  .filter((d) => !d.rail && d.solid !== false);
function topAt(d, x, z) {
  if (d.kind === 'box') return x >= d.min[0] && x <= d.max[0] && z >= d.min[2] && z <= d.max[2] ? d.max[1] : -Infinity;
  if (d.kind === 'obox') {
    const a = (d.rotY * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2];
    return Math.abs(dx * c - dz * s) <= d.size[0] / 2 && Math.abs(dx * s + dz * c) <= d.size[2] / 2 ? d.center[1] + d.size[1] / 2 : -Infinity;
  }
  const lx = d.high[0] - d.low[0], lz = d.high[2] - d.low[2], L2 = lx * lx + lz * lz, t = ((x - d.low[0]) * lx + (z - d.low[2]) * lz) / L2;
  const side = Math.abs((x - d.low[0]) * lz - (z - d.low[2]) * lx) / Math.sqrt(L2);
  return t >= 0 && t <= 1 && side <= d.width / 2 ? d.low[1] + (d.high[1] - d.low[1]) * t : -Infinity;
}
export function groundAt(x, z, hint = 0) {
  let best = -Infinity;
  for (const d of PIECES) { const y = topAt(d, x, z); if (y <= hint + 0.3 && y > best) best = y; }
  return best === -Infinity ? hint : +best.toFixed(3);
}
const SNAP = /^spirhalite_(palm|pompoms|grass|shrub|rock|float|buoy|debris|driftwood|rowboat|crates|table|tent|tarp|generator|mast|lantern|survey|flagpole|signposts|worklight|stakes|kelp|pathlights|drums)$/;

export function register(D, H) {
  const X = makeKit(H);
  registerRuins(D, H, X);
  registerCamp(D, H, X);
  registerFlora(D, H, X);
}

const RAW = [
  // ================= the ruins
  { type: 'spirhalite_arch', pos: [0, 0, 0], rotY: ARCH.rotY, mirror: false, oboxCols: true },
  { type: 'spirhalite_pillar', pos: [0, 0, -16.5], rotY: -Math.PI / 2 },
  { type: 'spirhalite_causeway', pos: [-29, 0, -18], rotY: 0, len: 16, w: 4.2, top: 1.3,
    posts: [[-6.6, -1], [-2.0, 1], [2.6, -1], [6.4, 1]], slabs: [[-1.0, -1, 0.3, 0.25], [1.8, 1, -0.4, -0.3]],
    rubble: [] },

  // ================= spawn: the helipad (dressing for the level's pad; stairs: foot → top, width), the helicopter behind
  { type: 'spirhalite_helipad', pos: [6, 0, -36], rotY: 0, R: 5.9, base: 1.3, top: 3.2, open: [1, 3],
    stairs: [[0, 9.9, 0, 5.45, 3], [-9.9, 0, -5.45, 0, 3]] },
  { type: 'spirhalite_rearpad', pos: [8, 0, -51.8], rotY: 0.12, w: 12, d: 10, y: 1.0 },
  { type: 'spirhalite_helicopter', pos: [8.5, 1.0, -52.0], rotY: 0.2 },

  // ================= the sea round the islands: the strange vanes (out of bounds)
  { type: 'spirhalite_vane', pos: [-41, 0, -21], rotY: 0.4, h: 4.6, speed: 0.3 },
  { type: 'spirhalite_vane', pos: [34, 0, -44], rotY: -0.3, h: 5.2, speed: 0.22 },
];

// snap the ground-standing dressing onto the real ground (pos[1] is the hint: 0 = the sand, 1.3 = a dune top …)
export const PLACEMENTS = RAW.map((it) => (SNAP.test(it.type) && !it.nosnap ? { ...it, pos: [it.pos[0], groundAt(it.pos[0], it.pos[2], it.pos[1]), it.pos[2]] } : it));
