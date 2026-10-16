// [b5-karp] Bazookarp's mode-only pieces, built from a stage's LAYOUT.bazookarp (SPEC §4.2): added to the `half` list
// only by variants.js layoutFor(layout, 'bazookarp') — never pushed into layout.half (the stage-card thumbnails and
// module-level piece indexes read the raw lists). Half pieces: mirrored for Bravo's attack like everything else.
// [b5-karp-checker] The final kit (WP4a): every piece is dressed stone in the game's chunky bevelled style, never a bare
// box; everything a kid could stand on but shouldn't is `roof` (slides you off) and takes no ink (the Halyard bar).
//   weir   two stone posts 5.4 m apart (centre to centre) across the walking direction, each a 0.72 m footing
//          (0.3 m), a 0.5 m shaft and a 0.64 m capital (2.4 m in all, the carp-head caps that sink when it lowers are
//          bazookarpFx's), a dark band where the curtain's frame meets the shaft; between them a 0.12 m stone sill the
//          curtain falls onto (walk-over, it takes ink: it is floor). The shafts' inner faces (2.45 m out) and the
//          footings / capitals stay outside the shell's full 2.3 m swell at their heights (its `clear` rule holds).
//   Gate   an octagonal plinth 3.4 m across the flats and 0.15 m high (a step-up; floor, takes ink) with a 0.06 m rim
//          step round it, between two posts 4.4 m apart (0.6 m shafts on 0.8 m footings, a gold band and a capital:
//          3.2 m in all). The arch, the lid and the light column are bazookarpFx's.
//   sign   a NO CARP post: a 0.3 m foot, a 0.15 m post, a 0.75 × 0.5 m board facing the sign's yaw (1.9 m to its top);
//          the board's NO CARP glyph and the carrierBlock shimmer are drawn by src/fx/karpKitFx.js.
// Heights: a spot's y when the data gives [x, y, z]; else the highest box / obox / ramp top of the layout under it.
const STONE = '#a29b8e', STONE_D = '#8a8377', STONE_L = '#b8b1a3', SILL = '#8f887b', PLINTH = '#968e80', RIM = '#7f786c', GOLD = '#c9a24a', SIGN = '#6f6a63', BOARD = '#e9e3d6';
const P_STONE = 3, P_PAVE = 16, P_WOOD = 6;

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

// a turned box: centre (cx, cz), w × d footprint (local x across, local z along), from y0 to y1
const ob = (cx, cz, w, d, y0, y1, yaw, o) => ({ kind: 'obox', center: [cx, (y0 + y1) / 2, cz], size: [w, y1 - y0, d], rotY: yaw, pattern: P_STONE, ...o });
// a dressed post: footing, shaft, (band), capital — every part roof and ink-free; the shaft carries the post's own tag
// (one `karp-weir` / `karp-gatepost` piece per post, as the first kit had: tests count posts by it), the rest
// <tag>-base / -band / -cap
function post(out, cx, cz, y, yaw, tag, s) {
  const R = { roof: true, paint: false };
  out.push(ob(cx, cz, s.foot, s.foot, y - 0.05, y + s.footH, yaw, { ...R, color: STONE_D, tag: `${tag}-base` }));
  out.push(ob(cx, cz, s.w, s.w, y + s.footH, y + s.h - s.capH, yaw, { ...R, color: STONE, tag }));
  if (s.band) out.push(ob(cx, cz, s.w + 0.06, s.w + 0.06, y + s.band[0], y + s.band[1], yaw, { ...R, color: s.bandColor || STONE_D, pattern: 0, tag: `${tag}-band` }));
  out.push(ob(cx, cz, s.cap, s.cap, y + s.h - s.capH, y + s.h, yaw, { ...R, color: STONE_L, tag: `${tag}-cap` }));
}
const WEIR_POST = { foot: 0.72, footH: 0.3, w: 0.5, cap: 0.64, capH: 0.25, h: 2.4, band: [1.55, 1.68] };
const GATE_POST = { foot: 0.8, footH: 0.35, w: 0.6, cap: 0.76, capH: 0.3, h: 3.2, band: [2.45, 2.6], bandColor: GOLD };

export function karpKitPieces(def, layout) {
  if (!def) return [];
  const out = [], fl = (p, hint = 6) => (p.length === 3 ? p[1] : layoutFloor(layout, p[0], p[1], hint));
  const xz = (p) => (p.length === 3 ? [p[0], p[2]] : [p[0], p[1]]);
  for (const w of def.weirs || []) {
    const [x, z] = xz(w.at), y = fl(w.at), yawD = w.yaw ?? 0, yaw = (yawD * Math.PI) / 180;
    const px = Math.cos(yaw), pz = -Math.sin(yaw);   // across the walking direction (its local x)
    for (const s of [-1, 1]) post(out, x + px * 2.7 * s, z + pz * 2.7 * s, y, yawD, 'karp-weir', WEIR_POST);
    // the sill between the footings (the curtain falls onto it): floor, a 0.12 m step
    out.push(ob(x, z, 4.62, 0.36, y, y + 0.12, yawD, { color: SILL, pattern: P_PAVE, tag: 'karp-sill' }));
  }
  if (def.gate) {
    const [x, z] = xz(def.gate.at), y = fl(def.gate.at), yawD = def.gate.yaw ?? 0, yaw = (yawD * Math.PI) / 180;
    // the octagonal plinth, 3.4 m across the flats, built as mapkit's OCT in the Gate's own frame (a plus of three slabs
    // 0.15 m high, its four 45° corners a 0.05 m step: no two pieces share a top)
    const c = Math.cos(yaw), sn = Math.sin(yaw), at = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
    const A = 1.7, hs = A * Math.tan(Math.PI / 8), Rc = A / Math.cos(Math.PI / 8);
    const P = { color: PLINTH, pattern: P_PAVE, tag: 'karp-gate' };
    out.push(ob(x, z, 2 * A, 2 * hs, y, y + 0.15, yawD, P));
    for (const s of [-1, 1]) { const [qx, qz] = at(0, s * (hs + A) / 2); out.push(ob(qx, qz, 2 * hs, A - hs, y, y + 0.15, yawD, P)); }
    const depth = A - hs * Math.SQRT2 + Math.min(0.3, 0.12 * Rc), k = (A - depth / 2) / Math.SQRT2;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const [qx, qz] = at(sx * k, sz * k); out.push(ob(qx, qz, 2 * hs, depth, y, y + 0.05, yawD + (sx * sz > 0 ? 45 : -45), { color: RIM, pattern: P_STONE, tag: 'karp-gate-rim' })); }
    const px = Math.cos(yaw), pz = -Math.sin(yaw);
    for (const s of [-1, 1]) post(out, x + px * 2.2 * s, z + pz * 2.2 * s, y, yawD, 'karp-gatepost', GATE_POST);
  }
  for (const z of def.freeZones || []) for (const s of z.signs || []) {
    const y = layoutFloor(layout, s[0], s[1], (z.y1 ?? 5) + 0.5), yawD = s[2] ?? 0, R = { roof: true, paint: false };
    out.push(ob(s[0], s[1], 0.3, 0.3, y - 0.05, y + 0.12, yawD, { ...R, color: STONE_D, tag: 'karp-sign-foot' }));
    out.push(ob(s[0], s[1], 0.15, 0.15, y + 0.12, y + 1.42, yawD, { ...R, color: SIGN, pattern: P_WOOD, tag: 'karp-sign' }));   // (one `karp-sign` per sign)
    out.push(ob(s[0], s[1], 0.75, 0.07, y + 1.4, y + 1.9, yawD, { ...R, color: BOARD, pattern: 0, tag: 'karp-sign-board' }));
  }
  return out;
}
