// [b5-karp] Bazookarp's mode-only pieces, built from a stage's LAYOUT.bazookarp (SPEC §4.2): added to the `half` list
// only by variants.js layoutFor(layout, 'bazookarp') — never pushed into layout.half (the stage-card thumbnails and
// module-level piece indexes read the raw lists). Half pieces: mirrored for Bravo's attack like everything else.
//   weir   two stone posts (0.5 × 0.5 × 2.4 m) 5.4 m apart (centre to centre) across the walking direction, a 0.12 m
//          walk-over sill between them. The posts' inner faces (2.45 m out) stay outside the shell's full 2.3 m swell.
//   Gate   a plinth 0.15 m high and 3.4 m across (a step-up) between two posts (0.6 × 0.6 × 3.2 m) 4.4 m apart
//   sign   a NO CARP post 0.15 m thick, 1.9 m tall (its board: bazookarpFx)
// Posts and signs are `roof` (their tops are off-limits) and take no ink (nobody climbs them). Everything that moves —
// curtains, caps, the arch, the shell — is bazookarpFx's and never collides.
// Heights: a spot's y when the data gives [x, y, z]; else the highest box / obox / ramp top of the layout under it.
const STONE = '#9d978c', SILL = '#857f74', PLINTH = '#8c8478';

function topOf(d, x, z) {
  if (d.kind === 'box') return x >= d.min[0] && x <= d.max[0] && z >= d.min[2] && z <= d.max[2] ? d.max[1] : -Infinity;
  if (d.kind === 'obox') {
    const a = (d.rotY * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2];
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    return Math.abs(lx) <= d.size[0] / 2 && Math.abs(lz) <= d.size[2] / 2 ? d.center[1] + d.size[1] / 2 : -Infinity;
  }
  if (d.kind === 'ramp') {
    const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, ux = hx - lx, uz = hz - lz, L = Math.hypot(ux, uz) || 1;
    const t = ((x - lx) * ux + (z - lz) * uz) / (L * L), off = Math.abs((x - lx) * (-uz / L) + (z - lz) * (ux / L));
    return t >= 0 && t <= 1 && off <= d.width / 2 ? ly + (hy - ly) * t : -Infinity;
  }
  return -Infinity;
}
const mirror = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] }
  : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : d.kind === 'ramp' ? { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] } : d);
export function layoutFloor(layout, x, z, yMax = 30) {
  let best = -Infinity;
  const all = [...(layout?.single || []), ...(layout?.half || []), ...(layout?.half || []).map(mirror)];
  for (const d of all) { const y = topOf(d, x, z); if (y <= yMax && y > best) best = y; }
  return best > -Infinity ? best : 0;
}

const post = (cx, cz, y, w, h, yawDeg, o = {}) => ({ kind: 'obox', center: [cx, y + h / 2, cz], size: [w, h, w], rotY: yawDeg, roof: true, paint: false, color: STONE, pattern: 3, tag: 'karp-kit', ...o });

export function karpKitPieces(def, layout) {
  if (!def) return [];
  const out = [], fl = (p, hint = 6) => (p.length === 3 ? p[1] : layoutFloor(layout, p[0], p[1], hint));
  const xz = (p) => (p.length === 3 ? [p[0], p[2]] : [p[0], p[1]]);
  for (const w of def.weirs || []) {
    const [x, z] = xz(w.at), y = fl(w.at), yaw = ((w.yaw ?? 0) * Math.PI) / 180;
    const px = Math.cos(yaw), pz = -Math.sin(yaw);   // across the walking direction (sin, cos)
    for (const s of [-1, 1]) out.push(post(x + px * 2.7 * s, z + pz * 2.7 * s, y - 0.05, 0.5, 2.45, w.yaw ?? 0, { tag: 'karp-weir' }));
    out.push({ kind: 'obox', center: [x, y + 0.06, z], size: [4.9, 0.12, 0.3], rotY: w.yaw ?? 0, color: SILL, pattern: 3, tag: 'karp-sill' });
  }
  if (def.gate) {
    const [x, z] = xz(def.gate.at), y = fl(def.gate.at), yawD = def.gate.yaw ?? 0, yaw = (yawD * Math.PI) / 180;
    out.push({ kind: 'obox', center: [x, y + 0.075, z], size: [3.4, 0.15, 3.4], rotY: yawD, color: PLINTH, pattern: 3, tag: 'karp-gate' });
    const px = Math.cos(yaw), pz = -Math.sin(yaw);
    for (const s of [-1, 1]) out.push(post(x + px * 2.2 * s, z + pz * 2.2 * s, y - 0.05, 0.6, 3.25, yawD, { tag: 'karp-gatepost' }));
  }
  for (const z of def.freeZones || []) for (const s of z.signs || []) {
    const y = layoutFloor(layout, s[0], s[1], (z.y1 ?? 5) + 0.5);
    out.push(post(s[0], s[1], y - 0.05, 0.15, 1.95, s[2] ?? 0, { tag: 'karp-sign' }));
  }
  return out;
}
