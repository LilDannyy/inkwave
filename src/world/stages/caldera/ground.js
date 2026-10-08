// Highmark Foundry — the ground kit: curved floors as boxes (DESIGN.md §2.3). Ported from nantai/ground.js `fill`.
//
// A floor is a simple polygon filled at one height: axis-aligned columns (x-slabs between its vertices, split so a
// slanted edge wanders less than its cover across one slab), and along every slanted edge either
//   • a coping (`ledge`): an O-box from the floor's foot up to a lip a little above it (0.1 / 0.2 / 0.3, coloured so no
//     two that overlap share one), laid inward along the edge: it is the bank face and covers the columns' stepped edge;
//   • a tuck (`poke`): where a higher floor or a wall stands beyond the edge, no coping — the columns reach the edge's
//     far side under the neighbour's coping (no kerb at the foot of a tier wall, no gap);
// Axial edges need neither (the columns end exactly on them). Pieces of equal height that meet are one polygon.
// The edge kinds are found automatically: a few points 0.35 m outside each slanted edge are tested against every other
// floor and wall (both halves) — anything there higher than this floor makes the edge a tuck.
import { B, O } from '../../mapkit.js';
import { area2, inPoly, r3 } from './geo.js';

const INSET = 0.18, LIPS = [0.1, 0.2, 0.3, 0.4], DEG = 180 / Math.PI;
const axial = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6;
// drop repeated points (and a closing repeat), keep the ring counter-clockwise (x right, z up)
export function ring(P0) {
  const P = [];
  for (const p of P0) { const q = P[P.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.015) P.push([p[0], p[1]]); }
  while (P.length > 2 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) <= 0.015) P.pop();
  return area2(P) < 0 ? P.reverse() : P;
}
function interior(P, i) {
  const n = P.length, a = P[(i - 1 + n) % n], v = P[i], b = P[(i + 1) % n];
  const d1 = [v[0] - a[0], v[1] - a[1]], d2 = [b[0] - v[0], b[1] - v[1]];
  return 180 - Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]) * DEG;
}

// fill(P, o): o = { y0, top, mk(xc, zc) → block opts, edge(a, b) → { kind: 'ledge' | 'poke' | 'skip', w, y0?, mk? } }
export function fill(P0, o) {
  const P = ring(P0), n = P.length, edges = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], slant = !axial(a, b);
    edges.push({ i, a, b, slant, L: slant ? o.edge(a, b) : null });
  }
  // --- columns
  const xs = [...new Set(P.map((p) => +p[0].toFixed(4)))].sort((p, q) => p - q);
  const cols = [];
  for (let k = 0; k < xs.length - 1; k++) {
    const X0 = xs[k], X1 = xs[k + 1];
    if (X1 - X0 < 0.02) continue;
    const xm = (X0 + X1) / 2;
    const cross = edges.filter((e) => Math.min(e.a[0], e.b[0]) < xm && Math.max(e.a[0], e.b[0]) > xm);
    let wMax = 4;
    for (const e of cross) {
      if (!e.slant) continue;
      const s = Math.abs((e.b[1] - e.a[1]) / (e.b[0] - e.a[0])), w = e.L && e.L.w ? e.L.w : 0.6;
      wMax = Math.min(wMax, Math.max(0.25, ((w - INSET - 0.12) * Math.sqrt(1 + s * s)) / s));
    }
    const m = Math.ceil((X1 - X0) / wMax - 1e-6);
    for (let j = 0; j < m; j++) {
      const xa = X0 + ((X1 - X0) * j) / m, xb = X0 + ((X1 - X0) * (j + 1)) / m, xc = (xa + xb) / 2;
      const zOf = (e, x) => e.a[1] + ((e.b[1] - e.a[1]) * (x - e.a[0])) / (e.b[0] - e.a[0]);
      const hits = cross.map((e) => ({ e, zc: zOf(e, xc), za: zOf(e, xa), zb: zOf(e, xb) })).sort((p, q) => p.zc - q.zc);
      for (let h = 0; h + 1 < hits.length; h += 2) {
        const lo_ = hits[h], hi_ = hits[h + 1];
        const pl = lo_.e.slant && lo_.e.L && lo_.e.L.kind === 'poke', ph = hi_.e.slant && hi_.e.L && hi_.e.L.kind === 'poke';
        const lo = pl ? Math.min(lo_.za, lo_.zb) : Math.max(lo_.za, lo_.zb) + (lo_.e.slant ? INSET : 0);
        const hi = ph ? Math.max(hi_.za, hi_.zb) : Math.min(hi_.za, hi_.zb) - (hi_.e.slant ? INSET : 0);
        if (hi - lo > 0.08) cols.push(B(r3(xa), r3(xb), o.y0, o.top, r3(lo), r3(hi), o.mk(xc, (lo + hi) / 2)));
      }
    }
  }
  // --- copings
  const rects = [];
  for (const e of edges) {
    if (!e.L || e.L.kind !== 'ledge') continue;
    const [ax, az] = e.a, [bx, bz] = e.b, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const nx = -uz, nz = ux, w = e.L.w;
    // ends: reach past a reflex corner to close the wedge against the next coping (none needed where the next edge has
    // no coping: its columns end exactly there), pull back from an acute one (never poke into the lava)
    const coped = (k) => { const q = edges[(k + n) % n]; return q.L && q.L.kind === 'ledge'; };
    const endAdj = (vi, nb) => { const a = interior(P, vi); if (a > 181) return coped(nb) ? w * Math.tan(((a - 180) * Math.PI) / 360) + 0.06 : 0; if (a < 89) return -w / Math.tan((a * Math.PI) / 180); return 0; };
    const e0 = endAdj(e.i, e.i - 1), e1 = endAdj((e.i + 1) % n, e.i + 1);
    const len = L + e0 + e1, off = (e1 - e0) / 2;
    if (len < 0.05) continue;
    rects.push({ e, cx: (ax + bx) / 2 + ux * off + (nx * w) / 2, cz: (az + bz) / 2 + uz * off + (nz * w) / 2, len, w, ux, uz, rot: -Math.atan2(uz, ux) * DEG });
  }
  const corners = (r) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => [r.cx + r.ux * (r.len / 2) * i - r.uz * (r.w / 2) * k, r.cz + r.uz * (r.len / 2) * i + r.ux * (r.w / 2) * k]);
  const overlap = (A, Bq) => {
    const ca = corners(A), cb = corners(Bq);
    for (const [px, pz] of [[A.ux, A.uz], [-A.uz, A.ux], [Bq.ux, Bq.uz], [-Bq.uz, Bq.ux]]) {
      const pa = ca.map((c) => c[0] * px + c[1] * pz), pb = cb.map((c) => c[0] * px + c[1] * pz);
      if (Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)) < 1e-3) return false;
    }
    return true;
  };
  // lips: colour the overlap graph so no two overlapping copings share a top (3 lips; a 4th only if 3 can't)
  const nb = rects.map((r, k) => rects.map((q, j) => (j !== k && overlap(q, r) ? j : -1)).filter((j) => j >= 0));
  const colour = (C) => {
    const order = rects.map((_, k) => k).sort((p, q) => nb[q].length - nb[p].length);
    const lip = new Array(rects.length).fill(-1);
    let steps = 0;
    const go = (i) => {
      if (i === order.length) return true;
      if (++steps > 20000) return false;
      const k = order[i];
      for (let c = 0; c < C; c++) {
        if (nb[k].some((j) => lip[j] === c)) continue;
        lip[k] = c; if (go(i + 1)) return true;
      }
      lip[k] = -1; return false;
    };
    return go(0) ? lip : null;
  };
  const lips = colour(3) || colour(4) || rects.map((_, k) => k % 3);
  rects.forEach((r, k) => { r.lip = lips[k]; });
  // the last coping closes the ring: it may meet the first one with the same lip
  // a coping over open lava or void stands proud (a rim); one over a lower floor is sunk below the floor by the same
  // steps (a gutter), so the face it tops stays a 1.2 m hop (nav.js jump edges reach 1.25 m) and a 0.6 m walk-up
  const ledges = rects.map((r) => O(r3(r.cx), r3(r.cz), r3(r.len), r.w, r.e.L.y0 ?? o.y0, r3(o.top + (r.e.L.sink ? -1 : 1) * LIPS[r.lip]), r3(r.rot), (r.e.L.mk || o.ledgeMk || o.mk)(r.cx, r.cz)));
  return { cols, ledges, ring: P };
}

// the edge kinds of one floor among the others: { poly, top, wall? } (both halves; `self` excluded)
export function edgeKinds(self, all, ledge = () => ({ kind: 'ledge', w: 1.0 })) {
  const others = all.filter((f) => f !== self);
  const above = (x, z) => others.some((f) => (f.wall || f.top > self.top + 0.05) && inPoly(f.poly, x, z));
  const same = (x, z) => others.some((f) => !f.wall && Math.abs(f.top - self.top) <= 0.05 && inPoly(f.poly, x, z));
  const lower = (x, z) => others.some((f) => !f.wall && f.top < self.top - 0.05 && inPoly(f.poly, x, z));
  const lowTop = (x, z) => { let t = Infinity; for (const f of others) if (!f.wall && f.top < self.top - 0.05 && inPoly(f.poly, x, z)) t = Math.min(t, f.top); return t; };
  return (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L;   // outward (right of a CCW ring)
    let up = 0, eq = 0, lo = 0, floorTop = Infinity, open = 0;
    for (const t of [0.2, 0.5, 0.8]) {
      const x = a[0] + dx * t + nx * 0.35, z = a[1] + dz * t + nz * 0.35;
      if (above(x, z)) up++; else if (same(x, z)) eq++; else if (lower(x, z)) { lo++; floorTop = Math.min(floorTop, lowTop(x, z)); } else open++;
    }
    if (eq >= 2 && L > 0.2 && self.warn !== false) console.warn(`[caldera] ground: ${self.id} meets a floor of its own height at`, a, b);
    if (up >= 2) return { kind: 'poke', w: 1.0 };
    const k = ledge(a, b);
    if (L < 0.35 && k.kind === 'ledge') return { kind: 'poke', w: k.w };
    // the coping's foot: down to the lower floor beyond it, or to the lake's depth (−1.1) over open lava / void
    const foot = open ? -1.1 : (Number.isFinite(floorTop) ? floorTop : -1.1);
    return k.kind === 'ledge' ? { ...k, sink: lo >= 2, y0: k.y0 ?? Math.min(foot, self.top - 0.5) } : k;
  };
}

// caldera walls along polylines: one O-box per segment, laid on the side away from the floor (`inside(x, z)` tells
// which side has floor), overlapping its neighbours at the corners with tops stepped 0 / 0.15 / 0.3 so none z-fight
export function walls(pts, o, inside) {
  const out = [], feet = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    const ux = dx / L, uz = dz / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    let nx = uz, nz = -ux;                                   // right of travel
    if (inside(mx + nx * 0.4, mz + nz * 0.4) && !inside(mx - nx * 0.4, mz - nz * 0.4)) { nx = -nx; nz = -nz; }
    const ext = i === 0 ? (o.ext0 ?? 0.3) : 0.3, ext1 = i === pts.length - 2 ? (o.ext1 ?? 0.3) : 0.3;
    const len = L + ext + ext1, off = (ext1 - ext) / 2, t = o.t;
    const cx = mx + ux * off + (nx * t) / 2, cz = mz + uz * off + (nz * t) / 2;
    const top = o.top + [0, 0.15, 0.3][i % 3];
    out.push(O(r3(cx), r3(cz), r3(len), t, o.y0, r3(top), r3(-Math.atan2(uz, ux) * DEG), o.mk()));
    const hl = len / 2, ht = t / 2;
    feet.push([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i2, k]) => [cx + ux * hl * i2 + nx * ht * k, cz + uz * hl * i2 + nz * ht * k]));
  }
  return { blocks: out, feet };
}

// Where a lower floor tucks under a higher one, its columns may overlap the higher floor's columns (their slabs
// differ). Cut the lower floor's columns round every higher column they meet: split at the blocker's x bounds and
// trim the overlapping part's z range back to the blocker's face (the bigger side kept). No gap is left: the blocker
// itself fills what was cut.
const BX = (a, x0, x1, z0, z1) => ({ ...a, min: [r3(x0), a.min[1], r3(z0)], max: [r3(x1), a.max[1], r3(z1)] });
export function cutColumns(cols, blockers) {
  let out = cols.slice();
  for (const b of blockers) {
    const next = [];
    for (const a of out) {
      const e = 1e-4;
      if (a.max[0] <= b.min[0] + e || a.min[0] >= b.max[0] - e || a.max[2] <= b.min[2] + e || a.min[2] >= b.max[2] - e || a.max[1] <= b.min[1] + e || a.min[1] >= b.max[1] - e) { next.push(a); continue; }
      let x1 = Math.max(a.min[0], b.min[0]), x2 = Math.min(a.max[0], b.max[0]);
      if (x1 - a.min[0] <= 0.02) x1 = a.min[0];
      if (a.max[0] - x2 <= 0.02) x2 = a.max[0];
      if (x1 > a.min[0]) next.push(BX(a, a.min[0], x1, a.min[2], a.max[2]));
      if (x2 < a.max[0]) next.push(BX(a, x2, a.max[0], a.min[2], a.max[2]));
      let z0 = a.min[2], z1 = a.max[2];
      if (b.min[2] - z0 >= z1 - b.max[2]) z1 = Math.min(z1, b.min[2]); else z0 = Math.max(z0, b.max[2]);
      if (z1 - z0 > 0.02) next.push(BX(a, x1, x2, z0, z1));
    }
    out = next;
  }
  return out;
}
export const rotBox = (d) => ({ ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] });

// recolour columns by region: each column is split where `inside` changes along its centre line (0.25 m steps), so a
// region of one floor (the Rim Head inside the yard's polygon) gets its own surface. Same top, the pieces only touch.
export function splitColumns(cols, inside, mkIn) {
  const out = [];
  for (const c of cols) {
    const xc = (c.min[0] + c.max[0]) / 2, z0 = c.min[2], z1 = c.max[2], n = Math.max(1, Math.ceil((z1 - z0) / 0.25));
    const st = []; for (let i = 0; i < n; i++) st.push(inside(xc, z0 + ((i + 0.5) * (z1 - z0)) / n));
    if (st.every((v) => v === st[0])) { out.push(st[0] ? { ...c, ...mkIn(c) } : c); continue; }
    let a = 0;
    for (let i = 1; i <= n; i++) {
      if (i < n && st[i] === st[a]) continue;
      const za = z0 + (a * (z1 - z0)) / n, zb = z0 + (i * (z1 - z0)) / n;
      const piece = { ...c, min: [c.min[0], c.min[1], r3(za)], max: [c.max[0], c.max[1], r3(zb)] };
      out.push(st[a] ? { ...piece, ...mkIn(piece) } : piece);
      a = i;
    }
  }
  return out;
}
