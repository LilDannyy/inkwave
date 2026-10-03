// Bluestone Junction — the ground built from outline polygons (imported by layout.js and props.js; pure data, no three).
//
// The level is boxes, and two boxes may overlap only where their tops differ by ≥ 8 cm (check-maps: equal tops
// z-fight). A ground region is an outline polygon [[x, z], …] with a top height:
//   • cores — axis-aligned slabs on a raster (CELL), laid greedily (the largest free rectangle that still covers a cell
//             that needs covering, again and again) until every needed cell is covered. They never overlap each other,
//             a hard hole (same top: the circus slab) or a box tier; they may tuck under an oriented tier's edge.
//   • bars  — along the region's DIAGONAL edges (axis edges on the raster are met exactly by the cores): a kerb bar
//             BARW wide inside the edge, its top a few cm under the region's (BLUESTONE's kerbs), so the cores can stay
//             INSET back from a diagonal and the bar fills the saw-tooth. Bar tops alternate per edge.
//   • patches — a square under the wedge two bars leave at a reflex (inward) corner, lower still.
// (Spirhalite's islands.js is the model; this is its own copy with a linear-time rectangle search, so the whole
// 126 × 170 m stage lays out at module load in a few tens of ms.)
import { B, O } from '../../mapkit.js';

export const CELL = 0.5, BARW = 1.5, INSET = 0.45, BOT = -1.8;

export const polyArea = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, z0] = p[i], [x1, z1] = p[(i + 1) % p.length]; a += x0 * z1 - x1 * z0; } return a / 2; };
export function inPoly(p, x, z) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; }
  return c;
}
export function segDist(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
  return Math.hypot(x - ax - t * dx, z - az - t * dz);
}
export function edgeDist(p, x, z, only = null) {
  let d = Infinity;
  for (let i = 0; i < p.length; i++) { if (only && !only(i)) continue; const a = p[i], b = p[(i + 1) % p.length]; d = Math.min(d, segDist(x, z, a[0], a[1], b[0], b[1])); }
  return d;
}
export const symOutline = (chain) => [...chain, ...chain.map(([x, z]) => [-x, -z])];
export const rectPoly = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// an oriented rectangle's corners: centre, size w (local x) × d (local z), turned deg (local z's bearing, as mapkit O)
export function oPoly(cx, cz, w, d, deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => [cx + c * (w / 2) * i + s * (d / 2) * k, cz - s * (w / 2) * i + c * (d / 2) * k]);
}
const axisEdge = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6;

// Raster cover of a region. Returns { rects: [[x0, x1, z0, z1], …], miss: [[x, z], …] (needed cells left uncovered) }.
//   poly   the region (any orientation), win {x0, x1, z0, z1} the raster window (multiples of cell)
//   inset  (i) => edge i keeps the cores INSET back (default: every diagonal edge)
//   hard   [[x0, x1, z0, z1]] rectangles the cores never overlap (same-top slabs; on the raster)
//   soft   [poly] tiers the cores never need to cover (a cell wholly inside one is never used; one partly inside may be)
export function coverRects(poly, win, { cell = CELL, inset = null, hard = [], soft = [], mask = null } = {}) {
  const ins = inset || ((i) => !axisEdge(poly[i], poly[(i + 1) % poly.length]));
  const nx = Math.round((win.x1 - win.x0) / cell), nz = Math.round((win.z1 - win.z0) / cell), N = nx * nz;
  const X = (i) => win.x0 + i * cell, Z = (j) => win.z0 + j * cell, e = 1e-6;
  const ok = new Uint8Array(N), need = new Uint8Array(N);
  const softBox = soft.map((p) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0, x1, z0, z1]; });
  const inSoft = (x, z) => { for (let k = 0; k < soft.length; k++) { const b = softBox[k]; if (x > b[0] && x < b[1] && z > b[2] && z < b[3] && inPoly(soft[k], x, z)) return true; } return false; };
  if (mask) for (let k = 0; k < N; k++) ok[k] = need[k] = mask[k];
  else for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const cx = X(i + 0.5), cz = Z(j + 0.5), k = j * nx + i;
    if (hard.some((r) => cx > r[0] && cx < r[1] && cz > r[2] && cz < r[3])) continue;
    const cs = [[X(i) + e, Z(j) + e], [X(i + 1) - e, Z(j) + e], [X(i + 1) - e, Z(j + 1) - e], [X(i) + e, Z(j + 1) - e]];
    if (cs.every(([x, z]) => inSoft(x, z))) continue;
    if (cs.every(([x, z]) => inPoly(poly, x, z) && edgeDist(poly, x, z, ins) >= INSET - 1e-6)) ok[k] = 1;
    if (inPoly(poly, cx, cz) && edgeDist(poly, cx, cz, ins) >= BARW - 0.4 && !inSoft(cx, cz)) need[k] = 1;
  }
  const used = new Uint8Array(N), rects = [];
  const ps = new Int32Array((nx + 1) * (nz + 1)), h = new Int32Array(nx), st = new Int32Array(nx + 1);
  for (let guard = 0; guard < 4000; guard++) {
    let left = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const v = need[j * nx + i] && !used[j * nx + i] ? 1 : 0; left += v;
      ps[(j + 1) * (nx + 1) + i + 1] = v + ps[j * (nx + 1) + i + 1] + ps[(j + 1) * (nx + 1) + i] - ps[j * (nx + 1) + i];
    }
    if (!left) break;
    const cnt = (i0, i1, j0, j1) => ps[(j1 + 1) * (nx + 1) + i1 + 1] - ps[j0 * (nx + 1) + i1 + 1] - ps[(j1 + 1) * (nx + 1) + i0] + ps[j0 * (nx + 1) + i0];
    // every maximal rectangle of free cells shows up as a stack pop on some row (histogram method): keep the largest
    // one that covers at least one still-needed cell
    let best = null, bestA = 0;
    h.fill(0);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) h[i] = ok[j * nx + i] && !used[j * nx + i] ? h[i] + 1 : 0;
      let sp = 0;
      for (let i = 0; i <= nx; i++) {
        const hi = i < nx ? h[i] : 0;
        while (sp > 0 && h[st[sp - 1]] >= hi) {
          const top = st[--sp], ht = h[top];
          if (!ht) continue;
          const i0 = sp > 0 ? st[sp - 1] + 1 : 0, i1 = i - 1, a = (i1 - i0 + 1) * ht;
          if (a > bestA && cnt(i0, i1, j - ht + 1, j) > 0) { bestA = a; best = [i0, i1, j - ht + 1, j]; }
        }
        st[sp++] = i;
      }
    }
    if (!best) break;
    const [i0, i1, j0, j1] = best;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) used[j * nx + i] = 1;
    rects.push([+X(i0).toFixed(3), +X(i1 + 1).toFixed(3), +Z(j0).toFixed(3), +Z(j1 + 1).toFixed(3)]);
  }
  const miss = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (need[j * nx + i] && !used[j * nx + i]) miss.push([X(i + 0.5), Z(j + 0.5)]);
  return { rects, miss };
}

// plain raster cover: every cell whose centre passes test(x, z) is covered by the greedy rectangles (no inset, no
// bars: for collider-only masses such as the railyard embankment)
export function rasterRects(test, win, cell = CELL) {
  const nx = Math.round((win.x1 - win.x0) / cell), nz = Math.round((win.z1 - win.z0) / cell);
  const poly = rectPoly(win.x0, win.x1, win.z0, win.z1);
  const keep = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) keep[j * nx + i] = test(win.x0 + (i + 0.5) * cell, win.z0 + (j + 0.5) * cell) ? 1 : 0;
  return coverRects(poly, win, { cell, inset: () => false, mask: keep });
}

// kerb bars inside the edges `only(i)` of `poly`, `w` wide, tops level(i), from y0
export function bars(poly, { only, level, w = BARW, y0 = BOT, opts = {} }) {
  const s = polyArea(poly) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < poly.length; i++) {
    if (!only(i)) continue;
    const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length];
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz * s, nz = ux * s;   // (n: inward)
    const cx = (x0 + x1) / 2 + (nx * w) / 2, cz = (z0 + z1) / 2 + (nz * w) / 2;
    const deg = (Math.atan2(dx, dz) * 180) / Math.PI;   // the bar's long side (local z) along the edge
    out.push(O(+cx.toFixed(4), +cz.toFixed(4), w, +L.toFixed(4), y0, level(i), +deg.toFixed(4), { ...opts, kerb: [x0, z0, x1, z1], noPaint: [[+(-nx).toFixed(4), 0, +(-nz).toFixed(4)]] }));   // (its outer face: the quay wall over the water, out of reach)
  }
  return out;
}
// reflex (inward) corners `only(i)` between two barred edges: a square along the inward bisector, top `top`
export function reflexPatches(poly, { only, top, size = 1.3, y0 = BOT, opts = {} }) {
  const s = polyArea(poly) > 0 ? 1 : -1, n = poly.length, out = [];
  for (let i = 0; i < n; i++) {
    if (!only(i)) continue;
    const [px, pz] = poly[(i + n - 1) % n], [vx, vz] = poly[i], [qx, qz] = poly[(i + 1) % n];
    const ax = vx - px, az = vz - pz, bx = qx - vx, bz = qz - vz;
    if ((ax * bz - az * bx) * s >= -1e-9) continue;   // convex: the bars meet
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    let nx = (-az / la - bz / lb) * s, nz = (ax / la + bx / lb) * s; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    const deg = (Math.atan2(nx, nz) * 180) / Math.PI;
    out.push(O(+(vx + (nx * size) / 2).toFixed(4), +(vz + (nz * size) / 2).toFixed(4), size, size, y0, top, +deg.toFixed(4), { ...opts, patch: true }));
  }
  return out;
}
// junction patches: where a barred edge meets a square (unbarred) edge the cores keep INSET back from the bar's end
// too; a square under that corner, along the square edge, at the bar's level, fills it (only patches whose centre is
// inside the region: at a convex corner the one past the bar's end would stand outside it)
export function junctionPatches(poly, { barred, level, size = 1.2, y0 = BOT, opts = {} }) {
  const s = polyArea(poly) > 0 ? 1 : -1, n = poly.length, out = [];
  for (let i = 0; i < n; i++) {
    const ePrev = (i + n - 1) % n, eNext = i;   // vertex i joins edge i − 1 and edge i
    for (const [bar, sq, dir] of [[ePrev, eNext, 1], [eNext, ePrev, -1]]) {
      if (!barred(bar) || barred(sq)) continue;
      const a = poly[sq], b = poly[(sq + 1) % n], v = poly[i];
      const ux = (b[0] - a[0]) * dir, uz = (b[1] - a[1]) * dir, L = Math.hypot(ux, uz);   // along the square edge, away from v
      const tx = ux / L, tz = uz / L, ex = b[0] - a[0], ez = b[1] - a[1], el = Math.hypot(ex, ez);
      const nx = (-ez / el) * s, nz = (ex / el) * s;                                      // the square edge's inward normal
      const cx = v[0] + (tx + nx) * size / 2, cz = v[1] + (tz + nz) * size / 2;
      if (inPoly(poly, cx, cz)) out.push(O(+cx.toFixed(4), +cz.toFixed(4), size, size, y0, +(level(bar) - 0.1).toFixed(3), +((Math.atan2(tx, tz) * 180) / Math.PI).toFixed(4), { ...opts, patch: true }));
      // and one just past the bar's own end, inside it (the cores keep INSET back from that end in every direction)
      const c = poly[bar], d = poly[(bar + 1) % n], bl = Math.hypot(d[0] - c[0], d[1] - c[1]);
      const fx = ((d[0] - c[0]) / bl) * dir, fz = ((d[1] - c[1]) / bl) * dir;          // along the bar, away from it past v
      const mx = (-(d[1] - c[1]) / bl) * s, mz = ((d[0] - c[0]) / bl) * s;            // the bar's inward normal
      const qx = v[0] + (fx * 0.9 + mx) * size / 2, qz = v[1] + (fz * 0.9 + mz) * size / 2;
      if (inPoly(poly, qx, qz)) out.push(O(+qx.toFixed(4), +qz.toFixed(4), size, size, y0, +(level(bar) - 0.2).toFixed(3), +((Math.atan2(fx, fz) * 180) / Math.PI).toFixed(4), { ...opts, patch: true }));
    }
  }
  return out;
}
export const coreBoxes = (rects, y1, opts, y0 = BOT) => rects.map(([x0, x1, z0, z1]) => B(x0, x1, y0, y1, z0, z1, opts));
// a raised core: a base below the street (not inkable: its sides are buried or under water) and the tier above it, so
// the paint atlas only holds what shows
// (the base stops 0.7 under the street so it never shares a top with the street, its kerb bars or patches; the street's
// own cores are laid the same way, so a core's side shows only its top 0.7 m where a kerb bar runs beside it)
export const TIER_Y = -0.7;
export const tierBoxes = (rects, y1, opts, base = {}) => rects.flatMap(([x0, x1, z0, z1]) => [B(x0, x1, BOT, TIER_Y, z0, z1, { ...opts, ...base, paint: false, tag: (opts.tag || 'tier') + '-base' }), B(x0, x1, TIER_Y, y1, z0, z1, opts)]);
