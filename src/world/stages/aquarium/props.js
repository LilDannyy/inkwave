// Gulper Aquarium — stage props (prop types prefixed 'aquarium_') and set dressing (PLACEMENTS: the half list, mirrored).
// BLOCKOUT: only what the play geometry needs drawn — the sea rails and railings (their level blocks are see-through
// `rail` colliders, never drawn) and Bathysphere No. 1 hanging from the gantry. The dressing comes with the art pass.
import { LAYOUT } from './layout.js';

const DEG = Math.PI / 180;

export function register(D, H) {
  // a railing along local x: posts every ~1.4 m, a top rail and a mid rail (rise = the far end's height over the near
  // end, for the stairs' rails)
  D.aquarium_rail = {
    desc: 'blockout railing: posts, a top rail and a mid rail along local x (len, h, rise)',
    build(B, o) {
      const L = o.len, h = o.h ?? 1.0, rise = o.rise ?? 0, n = Math.max(1, Math.round(L / 1.4)), c = '#d8d2c2';
      for (let i = 0; i <= n; i++) B.box('metal', c, 0.07, h, 0.07, -L / 2 + (L * i) / n, rise * (i / n - 0.5) + h / 2, 0, { r: 0.02 });
      const a = Math.atan2(rise, L), Lr = Math.hypot(L, rise);
      for (const y of [h - 0.03, h * 0.5]) B.box('metal', c, Lr, 0.06, 0.06, 0, y, 0, { rz: a, r: 0.02 });
    },
  };
  // Bathysphere No. 1: the steel diving ball (Ø 2.9, centre 14.5 m) on two cables from the gantry's cross-beam
  D.aquarium_bathysphere = {
    desc: 'Bathysphere No. 1 on its cables (pos = the ball centre)',
    build(B) {
      B.sph('metal', '#6d7a80', 1.45, 0, 0, 0, { ws: 24, hs: 16 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B.cyl('glow', '#f3ead8', 0.18, 0.06, Math.cos(a) * 1.42, 0.15, Math.sin(a) * 1.42, { rz: Math.PI / 2, ry: -a, seg: 12 }); }
      B.cyl('metal', '#4a5357', 0.55, 0.3, 0, 1.55, 0, { seg: 16 });
      for (const x of [-0.45, 0.45]) B.cyl('metal', '#30363a', 0.035, 2.3, x, 1.7 + 1.15, 0, { seg: 6 });
    },
  };
}

// ================================================================================================ placements
// a rail prop for every railing collider in the half list (box / obox / ramp)
function railFor(d) {
  if (d.kind === 'box') {
    const dx = d.max[0] - d.min[0], dz = d.max[2] - d.min[2], alongX = dx >= dz;
    return { type: 'aquarium_rail', pos: [(d.min[0] + d.max[0]) / 2, d.min[1], (d.min[2] + d.max[2]) / 2], rotY: alongX ? 0 : -Math.PI / 2, len: alongX ? dx : dz, h: d.max[1] - d.min[1] };
  }
  if (d.kind === 'obox') {
    const alongX = d.size[0] >= d.size[2], a = d.rotY * DEG;
    return { type: 'aquarium_rail', pos: [d.center[0], d.center[1] - d.size[1] / 2, d.center[2]], rotY: alongX ? a : a - Math.PI / 2, len: alongX ? d.size[0] : d.size[2], h: d.size[1] };
  }
  // a ramp-shaped rail (the pavilion stairs' outer sides): its top runs low → high; 1.0 m of railing over the stair
  const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, L = Math.hypot(hx - lx, hz - lz);
  return { type: 'aquarium_rail', pos: [(lx + hx) / 2, (ly + hy) / 2 - 1.0, (lz + hz) / 2], rotY: -Math.atan2(hz - lz, hx - lx), len: L, h: 1.0, rise: hy - ly };
}
export const PLACEMENTS = [
  ...LAYOUT.half.filter((d) => d.rail).map(railFor),
  ...LAYOUT.single.filter((d) => d.rail).map(railFor).map((p) => ({ ...p, mirror: false })),
  { type: 'aquarium_bathysphere', pos: [0, 14.5, 0], mirror: false },
];
