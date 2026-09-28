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
import { registerBridges } from './props-bridges.js';
import { LAYOUT } from './layout.js';
import { ISLE, OUTLINE } from './outline.js';
import { inPoly } from './islands.js';

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
  registerBridges(D, H, X);
}

const RAW = [
  // ================= the ruins
  { type: 'spirhalite_arch', pos: [0, 0, 0], rotY: ARCH.rotY, mirror: false, oboxCols: true },
  { type: 'spirhalite_pillar', pos: [0, 0, -16.5], rotY: -Math.PI / 2 },
  { type: 'spirhalite_causeway', pos: [-29, 0, -18], rotY: 0, len: 16, w: 4.2, top: 1.3,
    posts: [[-4.8, -1], [-4.8, 1], [3.4, -1], [3.4, 1], [6.9, -1]], slabs: [[-1.0, -1, 0.3, 0.25], [1.8, 1, -0.4, -0.3]],
    rubble: [] },
  // the expedition's ropes on a kerb of fallen blocks along both edges over the inlet, between the carved posts
  { type: 'spirhalite_ropefence', pos: [-30.8, 1.3, -25.7], rotY: -Math.PI / 2, L: 2.6, seed: 30 },
  { type: 'spirhalite_ropefence', pos: [-30.8, 1.3, -22.5], rotY: -Math.PI / 2, L: 7.6, seed: 31 },
  { type: 'spirhalite_ropefence', pos: [-27.2, 1.3, -22.5], rotY: -Math.PI / 2, L: 7.6, seed: 32 },
  { type: 'spirhalite_ropefence', pos: [-26.6, 1.3, -12.35], rotY: 0, L: 1.55, seed: 33 },                  // the bastion's inlet edge

  // ================= the log bridges across the lagoon (dressing for the level's decks) and rope-fence wings along the
  // shore either side of every landing (rails: nobody steps off the beach beside a bridge into the lagoon)
  { type: 'spirhalite_logbridge', pos: [0, 0, -24.25], rotY: 0, len: 5.9, w: 3.0, top: 0.25, seed: 11 },
  { type: 'spirhalite_logbridge', pos: [0, 0, -8.65], rotY: 0, len: 5.7, w: 3.0, top: 0.25, seed: 13 },
  { type: 'spirhalite_ropefence', pos: [-1.55, -0.12, -26.9], rotY: Math.atan2(1.0, -3.35), L: 3.5, seed: 20 },
  { type: 'spirhalite_ropefence', pos: [1.55, -0.12, -6.1], rotY: Math.atan2(-2.0, 5.05), L: 5.43, seed: 25 },
  { type: 'spirhalite_ropefence', pos: [-1.55, -0.12, -7.3], rotY: Math.atan2(1.55, -5.35), L: 5.57, seed: 26 },

  // ================= spawn: the helipad (dressing for the level's pad; stairs: foot → top, width), the helicopter behind
  { type: 'spirhalite_helipad', pos: [6, 0, -36], rotY: 0, R: 5.9, base: 1.3, top: 3.2, open: [1, 3],
    stairs: [[0, 9.9, 0, 5.45, 3], [-9.9, 0, -5.45, 0, 3]] },
  { type: 'spirhalite_rearpad', pos: [8, 0, -51.8], rotY: 0.12, w: 12, d: 10, y: 1.0 },
  { type: 'spirhalite_helicopter', pos: [8.5, 1.0, -52.0], rotY: 0.2 },

  // ================= the sea round the islands: the strange vanes (out of bounds)
  { type: 'spirhalite_vane', pos: [-41, 0, -21], rotY: 0.4, h: 4.6, speed: 0.3 },
  { type: 'spirhalite_vane', pos: [34, 0, -44], rotY: -0.3, h: 5.2, speed: 0.22 },
];

// driftwood washed up along the shore where the beach is narrow or the fighting runs along it: logs lying on the
// waterline (0.25 m in from the shore, along it) — kerbs over the step-up height, so nobody walks off into the lagoon
function kerb(a, b, seed, o = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  let nx = -dz / L, nz = dx / L;
  if (!inPoly(OUTLINE, mx + nx * 0.6, mz + nz * 0.6)) { nx = -nx; nz = -nz; }   // (n: toward the land)
  const d = o.in ?? 0.3;
  RAW.push({ type: 'spirhalite_driftwood', pos: [+(mx + nx * d).toFixed(3), 0, +(mz + nz * d).toFixed(3)], rotY: Math.atan2(-dz, dx), L: +(L * (o.k ?? 1.05)).toFixed(2), seed, two: !!o.two });
}
for (const [a, b, seed, o] of [
  [[-17.4, -13.8], [-15.0, -12.0], 4],             // the lagoon beach under the Spine Crest
  [[-15.0, -12.0], [-11.0, -10.6], 9, { two: true }],
  [[-11.0, -10.6], [-7.0, -9.2], 14],
  [[-18.2, -17.0], [-17.4, -13.8], 5],             // the neck: its lagoon side …
  [[-18.4, -21.0], [-18.2, -17.0], 6],
  [[-24.6, -15.6], [-23.4, -18.6], 7],             // … and its inlet side
  [[-23.4, -18.6], [-24.6, -21.4], 8],
  [[-24.6, -21.4], [-26.9, -22.1], 19, { k: 1.0 }],   // the inlet's beaches either side of the causeway
  [[-31.4, -22.85], [-32.6, -23.2], 17, { k: 1.1 }],
  [[6.6, -4.2], [12.0, -2.6], 22, { two: true }],     // the central sandbar's shore east of the bridge
  [[-26.9, -15.3], [-24.6, -15.6], 27, { k: 1.0 }],   // the beach under the bastion
  [[-15.8, -27.0], [-17.8, -24.4], 33],                // the lagoon's shore round the camp islet and the neck
  [[-17.8, -24.4], [-18.4, -21.0], 39],
  [[-12.5, -28.4], [-15.8, -27.0], 40],
  [[-8.5, -28.6], [-12.5, -28.4], 41, { two: true }],
  [[-5.4, -27.6], [-8.5, -28.6], 42],
  [[-31.1, -14.7], [-34.6, -13.2], 43],                // the bend's head over the inlet, west of the causeway
  [[10.0, -44.6], [15.6, -43.0], 34],                  // the tail's back beach under the high dune
  [[15.6, -43.0], [19.4, -39.8], 35],
  [[-8.0, 3.9], [-12.0, 2.6], 36],                     // the middle stroke's north shore (the other lagoon's mouth)
  [[-12.0, 2.6], [-16.0, 1.4], 37, { two: true }],
  [[-16.0, 1.4], [-20.0, 0.6], 38],
  [[-9.4, -42.4], [-8.4, -39.8], 28],                  // round the pinch inlet
  [[-8.4, -39.8], [-7.0, -38.6], 29, { k: 1.1 }],
  [[-7.0, -38.6], [-5.0, -39.4], 30, { k: 1.1 }],
  [[-5.0, -39.4], [-3.8, -41.8], 31],
  [[-3.8, -41.8], [-2.2, -44.0], 32],
  [[-23.8, -43.4], [-17.0, -44.6], 24],              // the camp's south beach under the crest
  [[-17.0, -44.6], [-11.6, -44.2], 26],
]) kerb(a, b, seed, o);

// the pillar islets' rope ring: the islet's shore 0.55 m in, round from one bridge landing to the other (both sides)
{
  const n = ISLE.length, cx = 0, cz = -16.5, ring = ISLE.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz); return [x - (dx / l) * 0.55, z - (dz / l) * 0.55]; });
  const gap = ([x, z]) => Math.abs(x) < 1.75;   // the bridge landings (both at x ≈ 0)
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    if (gap(a) || gap(b)) continue;
    RAW.push({ type: 'spirhalite_ropefence', pos: [a[0], -0.12, a[1]], rotY: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), L: +Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2), seed: 40 + i });
  }
  // close each landing: from the ring's last post to the bridge's handrail
  for (const [zs, zb] of [[-21.6, -21.3], [-11.4, -11.5]]) for (const sx of [-1, 1]) {
    const k = ring.findIndex((p, i) => !gap(p) && Math.sign(p[0]) === sx && Math.abs(p[1] - zs) < 2.2 && ring.every((q) => gap(q) || Math.sign(q[0]) !== sx || Math.abs(q[1] - zs) >= 2.2 || Math.abs(q[0]) >= Math.abs(p[0])));
    if (k < 0) continue;
    const a = ring[k], b = [sx * 1.5, zb];
    RAW.push({ type: 'spirhalite_ropefence', pos: [a[0], -0.12, a[1]], rotY: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), L: +Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2), seed: 60 + k });
  }
}

// snap the ground-standing dressing onto the real ground (pos[1] is the hint: 0 = the sand, 1.3 = a dune top …)
export const PLACEMENTS = RAW.map((it) => (SNAP.test(it.type) && !it.nosnap ? { ...it, pos: [it.pos[0], groundAt(it.pos[0], it.pos[2], it.pos[1]), it.pos[2]] } : it));
