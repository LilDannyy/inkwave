// Gulper Aquarium — geometry helpers for layout.js (pure data: no three.js, importable in Node).
//
//   frames      the blade frame (s along Alpha's swept spawn wing, w across it): W(s, w) → [x, z], toBlade(x, z),
//               bladeBox() = an obox turned −30° (DESIGN.md §0); polar helpers pol(), bearing(), radBox()
//   bands       arcBand (a convex arc band: exact outer chords, neighbours overlap at their inner corners, so their
//               tops alternate) · arcBandIn (a concave band: exact inner chords, wedge joints behind, one top) ·
//               chainBand (a band inside a polyline, its outer face on each segment)
//   tiles       tileRegion(): a raster of cells (0 = no floor, 1 = floor needed, 2 = may be floor: hidden under
//               something standing on it) tiled with as few big rectangles as it takes (greedy largest rectangle),
//               in the world frame or the blade frame. Curved / diagonal edges are always hidden under a band, a
//               wall or a higher piece, so the staircase of cells never shows.
//   cover       Cover: a spatial index of opaque pieces standing through a height (what hides a cell)
import { B, O, R } from '../../mapkit.js';

export const DEG = Math.PI / 180;
export const C30 = Math.cos(30 * DEG);
export const r3 = (v) => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------------------------------------------- frames
// Alpha's spawn wing is a blade swept 30° off the z-axis: s runs along it, u = (0.5, −0.866), from H0 = (0, −32.5);
// w runs across it, l = (0.866, 0.5) (+ = Alpha's left, east). An obox with rotY −30 has local x = l, local z = −u.
export const H0 = [0, -32.5];
export const W = (s, w) => [0.5 * s + C30 * w, H0[1] - C30 * s + 0.5 * w];
export const toBlade = (x, z) => { const dz = z - H0[1]; return [0.5 * x - C30 * dz, C30 * x + 0.5 * dz]; };
export function bladeBox(s0, s1, w0, w1, y0, y1, o = {}) {
  const [cx, cz] = W((s0 + s1) / 2, (w0 + w1) / 2);
  return O(r3(cx), r3(cz), r3(w1 - w0), r3(s1 - s0), y0, y1, -30, o);
}
// a ramp along the blade (s from sLow to sHigh at the given w centre)
export function bladeRamp(sLow, yLow, sHigh, yHigh, wc, width, o = {}) {
  const a = W(sLow, wc), b = W(sHigh, wc);
  return R([r3(a[0]), yLow, r3(a[1])], [r3(b[0]), yHigh, r3(b[1])], width, o);
}
export const pol = (a, r, c = [0, 0]) => [c[0] + r * Math.cos(a * DEG), c[1] + r * Math.sin(a * DEG)];
export const bearing = (x, z, c = [0, 0]) => Math.atan2(z - c[1], x - c[0]) / DEG;
export const dist = (x, z, c = [0, 0]) => Math.hypot(x - c[0], z - c[1]);
// is bearing a inside [a0, a1] (degrees, a0 < a1, any winding)
export function inArc(a, a0, a1) { let t = a; while (t < a0) t += 360; while (t > a0 + 360) t -= 360; return t <= a1; }
// a box set radially: centred on bearing a (from c), r0 → r1 along the radius, wd across it
export function radBox(a, r0, r1, wd, y0, y1, o = {}, c = [0, 0]) {
  const [cx, cz] = pol(a, (r0 + r1) / 2, c);
  return O(r3(cx), r3(cz), r3(wd), r3(r1 - r0), y0, y1, r3(90 - a), o);
}
// a box along a segment P → Q (its centre line), wd wide
export function segBox(P, Q, wd, y0, y1, o = {}) {
  const dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz), a = Math.atan2(dz, dx) / DEG;
  return O(r3((P[0] + Q[0]) / 2), r3((P[1] + Q[1]) / 2), r3(L), r3(wd), y0, y1, r3(-a), o);
}
// a radial ramp: on bearing a from c, low end at rLow (yLow), high end at rHigh (yHigh)
export function radRamp(a, rLow, yLow, rHigh, yHigh, width, o = {}, c = [0, 0]) {
  const L = pol(a, rLow, c), H = pol(a, rHigh, c);
  return R([r3(L[0]), yLow, r3(L[1])], [r3(H[0]), yHigh, r3(H[1])], width, o);
}

// ---------------------------------------------------------------------------------------------------- bands
const top2 = (tops, i) => (Array.isArray(tops) ? tops[i % tops.length] : tops);
// convex arc band r1 → r2 round c from a0 to a1 (degrees) in n segments: each segment's outer face is the chord of
// r2 (the outline is exact), its inner face touches r1; neighbours overlap at their inner corners (tops alternate)
export function arcBand(c, r1, r2, a0, a1, n, y0, tops, o = {}) {
  const out = [], da = (a1 - a0) / n, h = (Math.abs(da) * DEG) / 2;
  const dOut = r2 * Math.cos(h), L = 2 * r2 * Math.sin(h);
  for (let i = 0; i < n; i++) out.push(radBox(a0 + da * (i + 0.5), Math.min(r1, dOut - 0.05), dOut, L, y0, top2(tops, i), typeof o === 'function' ? o(i) : o, c));
  return out;
}
// concave arc band (visible from the centre side): inner face on the chords of r1, segments meet at their inner
// corners, so they never overlap (thin wedge joints behind, toward r2); one top
export function arcBandIn(c, r1, r2, a0, a1, n, y0, top, o = {}) {
  const out = [], da = (a1 - a0) / n, h = (Math.abs(da) * DEG) / 2;
  const dIn = r1 * Math.cos(h), L = 2 * r1 * Math.sin(h);
  for (let i = 0; i < n; i++) out.push(radBox(a0 + da * (i + 0.5), dIn, r2, L, y0, top2(top, i), typeof o === 'function' ? o(i) : o, c));
  return out;
}
// a band of thickness t inside the polyline pts (side = +1: the band lies to the left of each segment's direction,
// −1: to the right). Each box's outer face is the segment; at a reflex joint both boxes run on far enough to close
// the wedge (they overlap there and at convex joints: tops alternate)
export function chainBand(pts, t, side, y0, tops, o = {}, closed = false) {
  const out = [], n = pts.length, m = closed ? n : n - 1;
  const dir = (i) => { const a = pts[i % n], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L, L]; };
  for (let i = 0; i < m; i++) {
    const [ux, uz, L] = dir(i), nx = -uz * side, nz = ux * side;   // inward normal (left of travel for side +1)
    let e0 = 0, e1 = 0;
    const ext = (j) => { // joint j between segment j-1 and j
      if (!closed && (j <= 0 || j >= n - 1)) return 0;
      const [px, pz] = dir((j - 1 + m) % m), [qx, qz] = dir(j % m);
      const cross = px * qz - pz * qx, turn = Math.acos(Math.max(-1, Math.min(1, px * qx + pz * qz)));
      return cross * side < 0 ? t * Math.tan(turn / 2) + 0.02 : 0;   // turning away from the band's side: reflex
    };
    e0 = ext(i); e1 = ext(i + 1);
    const a = pts[i], b = pts[(i + 1) % n];
    const P = [a[0] - ux * e0 + nx * t / 2, a[1] - uz * e0 + nz * t / 2], Q = [b[0] + ux * e1 + nx * t / 2, b[1] + uz * e1 + nz * t / 2];
    out.push(segBox(P, Q, t, y0, top2(tops, i), typeof o === 'function' ? o(i) : o));
  }
  return out;
}
// points along an arc (degrees), n segments
export const arcPts = (c, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => pol(a0 + ((a1 - a0) * i) / n, r, c));

// ---------------------------------------------------------------------------------------------------- pieces as shapes
// the top of a piece over (x, z) (null = not over it), as level.js builds it; bottom too
export function topOf(d, x, z) {
  if (d.kind === 'box') return x < d.min[0] || x > d.max[0] || z < d.min[2] || z > d.max[2] ? null : d.max[1];
  if (d.kind === 'obox') {
    const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2];
    const u = dx * c - dz * s, v = dx * s + dz * c;   // level.js: axes[0] = (c, 0, −s), axes[2] = (s, 0, c)
    return Math.abs(u) > d.size[0] / 2 || Math.abs(v) > d.size[2] / 2 ? null : d.center[1] + d.size[1] / 2;
  }
  const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high;
  const fx = hx - lx, fz = hz - lz, run = Math.hypot(fx, fz), ux = fx / run, uz = fz / run;
  const dx = x - lx, dz = z - lz, along = dx * ux + dz * uz, lat = -dx * uz + dz * ux;
  if (Math.abs(lat) > d.width / 2 || along < -0.6 || along > run) return null;
  return ly + (along * (hy - ly)) / run;
}
export const bottomOf = (d) => (d.kind === 'box' ? d.min[1] : d.kind === 'obox' ? d.center[1] - d.size[1] / 2 : -9);
function aabbOf(d) {
  if (d.kind === 'box') return [d.min[0], d.max[0], d.min[2], d.max[2]];
  let pts;
  if (d.kind === 'obox') {
    const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), hx = d.size[0] / 2, hz = d.size[2] / 2;
    pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => [d.center[0] + c * hx * i + s * hz * k, d.center[2] - s * hx * i + c * hz * k]);
  } else {
    const [lx, , lz] = d.low, [hx, , hz] = d.high, L = Math.hypot(hx - lx, hz - lz), ux = (hx - lx) / L, uz = (hz - lz) / L, w = d.width / 2;
    const a = [lx - ux * 0.6, lz - uz * 0.6];
    pts = [[a[0] - uz * w, a[1] + ux * w], [a[0] + uz * w, a[1] - ux * w], [hx - uz * w, hz + ux * w], [hx + uz * w, hz - ux * w]];
  }
  return [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
}
// what hides a floor cell at height y: opaque (drawn) pieces standing from at or below y to at least y + 0.08
export class Cover {
  constructor(pieces, y, cell = 2) {
    this.y = y; this.cell = cell; this.map = new Map(); this.list = [];
    for (const d of pieces) {
      if (d.hidden || d.rail || d.solid === false) continue;
      if (d.kind !== 'ramp' && (bottomOf(d) > y + 0.01)) continue;
      this.list.push(d);
      const [x0, x1, z0, z1] = aabbOf(d);
      for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) for (let j = Math.floor(z0 / cell); j <= Math.floor(z1 / cell); j++) {
        const k = i * 8192 + j; let l = this.map.get(k); if (!l) this.map.set(k, (l = [])); l.push(d);
      }
    }
  }
  at(x, z) {
    for (const d of this.map.get(Math.floor(x / this.cell) * 8192 + Math.floor(z / this.cell)) || []) {
      const t = topOf(d, x, z); if (t != null && t >= this.y + 0.079) return true;
    }
    return false;
  }
  sig() { if (this._sig == null) this._sig = fnv(this.y + JSON.stringify(this.list.map((d) => [d.kind, d.min, d.max, d.center, d.size, d.rotY, d.low, d.high, d.width]))); return this._sig; }
  // the whole square (centre x, z, half size h) hidden
  square(x, z, h) { return this.at(x, z) && this.at(x - h, z - h) && this.at(x + h, z - h) && this.at(x - h, z + h) && this.at(x + h, z + h); }
}

// ---------------------------------------------------------------------------------------------------- raster tiler
// cell(x, z, h) → 0 | 1 | 2 for the cell centred (x, z) of half size h, in the raster's own frame. Greedy cover of
// every needed cell with non-overlapping rectangles of needed / optional cells (largest first).
export function tileRegion(x0, x1, z0, z1, res, cell) {
  const nx = Math.round((x1 - x0) / res), nz = Math.round((z1 - z0) / res), N = nx * nz, s = new Uint8Array(N);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) s[j * nx + i] = cell(x0 + (i + 0.5) * res, z0 + (j + 0.5) * res, res / 2);
  const avail = new Uint8Array(N);
  let need = 0;
  for (let k = 0; k < N; k++) { avail[k] = s[k] ? 1 : 0; if (s[k] === 1) need++; }
  const out = [], h = new Int32Array(nx), st = new Int32Array(nx + 1);
  for (let guard = 0; need > 0 && guard < 6000; guard++) {
    let best = 0, bi0 = 0, bi1 = 0, bj0 = 0, bj1 = 0;
    h.fill(0);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) h[i] = avail[j * nx + i] ? h[i] + 1 : 0;
      let top = 0;
      for (let i = 0; i <= nx; i++) {
        const hi = i < nx ? h[i] : 0;
        while (top > 0 && h[st[top - 1]] >= hi) {
          const hh = h[st[--top]], left = top > 0 ? st[top - 1] + 1 : 0, a = hh * (i - left);
          if (a > best) { best = a; bi0 = left; bi1 = i; bj0 = j - hh + 1; bj1 = j + 1; }
        }
        st[top++] = i;
      }
    }
    if (!best) break;
    let cnt = 0;
    for (let j = bj0; j < bj1; j++) for (let i = bi0; i < bi1; i++) if (s[j * nx + i] === 1) cnt++;
    for (let j = bj0; j < bj1; j++) for (let i = bi0; i < bi1; i++) { const k = j * nx + i; if (cnt && s[k] === 1) need--; avail[k] = 0; }
    if (cnt) out.push({ x0: r3(x0 + bi0 * res), x1: r3(x0 + bi1 * res), z0: r3(z0 + bj0 * res), z1: r3(z0 + bj1 * res) });
  }
  return out;
}
// tiles of a region as level pieces. frame 'world' (x, z) → B; 'blade' (raster in (w, s)) → bladeBox.
//   inside(x, z) — world coordinates; cover: a Cover (or null); the cell is needed when its centre is inside and it
//   is not wholly hidden; optional when wholly hidden (or opt(x, z) says so)
//   clip(x, z) — optional: no cell outside it at all (keeps hidden-merged cells off neighbouring boxes)
//   key — names the layer in the baked tile cache (baked.js, written by bake-tiles.mjs): the greedy tiler is slow
//   (≈ 0.35 s for the stage), so a layer whose fingerprint (its parameters, its cover's pieces and its cells sampled
//   on a 1-in-16 sub-grid) matches the baked one reuses the baked rectangles; any change misses and recomputes
let BAKED = {};
export const BAKE_OUT = {};
export function useBaked(b) { BAKED = b || {}; }
export function fnv(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); }
export function layer({ key, frame = 'world', rect, res = 0.25, inside, cover = null, opt = null, clip = null, y0, y1, o = {} }) {
  const [a0, a1, b0, b1] = rect;
  const toW = frame === 'blade' ? (w, s) => W(s, w) : (x, z) => [x, z];
  const cell = (a, b, h) => {
    const [x, z] = toW(a, b);
    if (clip && !clip(x, z)) return 0;
    const hid = cover && cover.square(x, z, h * 1.42);
    if (inside(x, z)) return hid ? 2 : 1;
    if (hid || (opt && opt(x, z))) return 2;
    return 0;
  };
  let probe = '';
  const nx = Math.round((a1 - a0) / res), nz = Math.round((b1 - b0) / res);
  for (let j = 1; j < nz; j += 4) for (let i = 1; i < nx; i += 4) probe += cell(a0 + (i + 0.5) * res, b0 + (j + 0.5) * res, res / 2);
  const sig = fnv([frame, rect, res, y0, y1, cover ? cover.sig() : '', probe].join('|'));
  const hit = !globalThis.__AQ_REGEN && BAKED[key] && BAKED[key].sig === sig;
  if (key && !hit && !globalThis.__AQ_REGEN && Object.keys(BAKED).length) console.warn(`[aquarium] tile cache stale for ${key}: run node src/world/stages/aquarium/bake-tiles.mjs`);
  const cells = hit ? BAKED[key].r.map(([x0, x1, z0, z1]) => ({ x0, x1, z0, z1 })) : tileRegion(a0, a1, b0, b1, res, cell);
  if (key) BAKE_OUT[key] = { sig, r: cells.map((c) => [c.x0, c.x1, c.z0, c.z1]) };
  return cells.map((r) => (frame === 'blade' ? bladeBox(r.z0, r.z1, r.x0, r.x1, y0, y1, o) : B(r.x0, r.x1, y0, y1, r.z0, r.z1, o)));
}

// ---------------------------------------------------------------------------------------------------- polygons
export function inPoly(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
// a regular n-gon with apothem a round c, its first edge's normal at bearing a0 (degrees): vertices
export function ngon(c, n, a, a0 = 0) {
  const R0 = a / Math.cos(Math.PI / n);
  return Array.from({ length: n }, (_, i) => pol(a0 + (360 / n) * (i + 0.5), R0, c));
}
// inside a regular n-gon (apothem a, edge normals at a0 + k·360/n)
export function inNgon(c, n, a, a0, x, z, inset = 0) {
  for (let k = 0; k < n; k++) { const t = (a0 + (360 / n) * k) * DEG; if ((x - c[0]) * Math.cos(t) + (z - c[1]) * Math.sin(t) > a - inset) return false; }
  return true;
}

// ---------------------------------------------------------------------------------------------------- the touch pools' panels
// (fix round 3, dressing only: dress.js frames them, looks.js draws what is seen through them.) Alpha's pool block
// (layout.js 'touch-pool': x −11.5 … −6.5, z −15.6 … −13.0, y 1.0 … 2.0) in its own frame: origin the block's foot centre
// (−9.0, 1.0, −14.3), local x along it, local +z its court face (north; the twin turns it). Viewing panels on the long
// faces (cx along x, the window w × h from y0), a porthole in each end; every part of them stands within 8 cm of a face
export const TOUCH = {
  pos: [-9.0, 1.0, -14.3], w: 5.0, d: 2.6, h: 1.0,
  win: { w: 1.33, h: 0.48, y0: 0.14 }, frame: { w: 1.45, h: 0.6 },
  // [face (+1 the court face, −1 the arch face), window centre along x, what is pressed to its glass: [kind, u, v] with u
  // across the window from its centre and v up from its foot — every face shows a sea star, an urchin and an anemone]
  panels: [
    [1, -1.55, [['star', -0.32, 0.27], ['anemone', 0.38, 0.1]]], [1, 1.55, [['urchin', 0.22, 0.12], ['star', -0.4, 0.33]]],
    [-1, -1.25, [['anemone', -0.28, 0.1], ['urchin', 0.36, 0.3]]], [-1, 1.25, [['star', 0.1, 0.24]]],
  ],
  port: { r: 0.24, y: 0.45 },
};

// ---------------------------------------------------------------------------------------------------- fix round 4 dressing
// (dressing and shaders only: the blocks are layout.js's, unchanged; these repeat their numbers for floorart.js, which
// draws on their faces under the ink, and for the props on their edges.) Alpha's half; the twins are turned 180°.
// The Sea Promenade's Lookout (radBox(−141.5, r 21.4 → 24.4, 3.6 wide, top 3.6) with its court balustrade (r 21.4 →
// 21.8, top 4.5)) and the telescope bay (radBox(−145, r 27.6 → 31.0, 6.4 wide, top 3.0)); the promenade is at 2.4
export const LOOKOUT = { a: -141.5, r0: 21.4, r1: 24.4, rb: 21.8, half: 1.8, top: 3.6, bal: 4.5, floor: 2.4 };
export const TBAY = { a: -145, r0: 27.6, r1: 31.0, half: 3.2, top: 3.0, kiosk: 1.28 };
// the planters dressed as Deco planters (cast cream stone, a granite plinth, faience speed lines, a moulded coping,
// planted with sea holly; the fish topiary's bed clipped into a fish): the round ones are layout.js rnd() pieces — four
// spokes (0°, 45°, 90°, 135°) of apothem r whose tops step down 9 cm each from `top` — the others blade boxes
export const PLANTERS = {
  oct: [
    { c: W(27.4, -2.4), r: 1.0, top: 1.2, fish: true },        // the fish topiary on the ferry plaza
    { c: [-8.5, -33.5], r: 0.9, top: 1.3 },                      // the Gate Terrace's two bollard planters
    { c: [11.0, -36.6], r: 0.9, top: 1.3 },
  ],
  box: [
    { s: [28.1, 28.9], w: [1.2, 3.6], y0: 0, top: 1.3 },        // the queue-barrier planter
    { s: [34, 36], w: [9.5, 11.5], y0: 3.38, top: 4.5 },        // the spawn deck's two planters
    { s: [34, 36], w: [-11.5, -9.5], y0: 3.38, top: 4.5 },
  ],
};

// ---------------------------------------------------------------------------------------------------- fix round 5 dressing
// (the complete eye-level sweep; dressing and shaders only: the blocks are layout.js's, unchanged.) Their numbers again,
// for floorart.js (faces and tops under the ink) and the props on their edges. Alpha's half; the twins are turned 180°.
// Penguin Point: the rock terrace's three blade boxes and the upper rock ([s0, s1, w0, w1, top]; feet at the floor), the
// basking rock and the ice pile (world boxes [x0, x1, z0, z1], their tops; the basking rock straddles the terrace's
// plaza edge, the ice pile stands on it), the PENGUIN POINT plaque on the upper rock's plaza face (+w)
export const PENGUIN = {
  rocks: [[-16, -3, -17.0, -10, 1.2], [-3, 10, -17.8, -10, 1.2], [10, 13, -17.0, -10, 1.2]],
  upper: [13, 21, -17.0, -12, 2.4],
  basking: { b: [-8.2, -7.0, -40.5, -39.3], top: 2.2 },
  ice: { b: [-7.7, -6.3, -49.2, -47.8], top: 2.2, foot: 1.2 },
  plaque: { s: 16.6, w: -12, y: 1.5 },
};
// the Pump Hall's two pump sets (layout.js 'pump-set': a world box and a blade box against the bund), tops 1.0
export const PUMPS = { box: [17.05, 18.55, -42.0, -40.0], blade: { s: [18.7, 20.2], w: [11.0, 13.0] }, top: 1.0 };
// the touch pool's dais (1.0) and its step (0.5) on the court side (layout.js 'touch-dais', 'touch-step'): world boxes
export const DAIS = { b: [-12, -6, -16.0, -12.6], top: 1.0, step: [-12, -6, -12.6, -11.8], stepTop: 0.5 };
// the Ticket Hall's block (layout.js 'ticket-hall', 1.2): its plaza (south), west and east faces (the north one carries the
// ALL WATER IS BEHIND GLASS board, murals.js 5)
export const TICKET = { b: [2.0, 10.0, -46.0, -39.0], top: 1.2 };
