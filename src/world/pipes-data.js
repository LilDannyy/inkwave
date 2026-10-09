// LAYOUT.pipes's three-free data: the Tubeway's geometry (tools/botlab/jobs/batch5/stages/aquarium/ENGINE.md §3.2–3.3,
// §5) and its tool hooks (the stage-select thumbnail, build/check-maps.mjs). No three.js here: Node reads it
// (build/check-maps.mjs, src/world/mapThumb.js), and so does the engine (src/game/pipes.js).
//
//   expandPipes(layout)   → { label, enter, speed, cooldown, modes, legs, ends, water, aprons, pieces, problems } | null
//   legAt(leg, s, out)    → out = { x, y, z, tx, ty, tz, sx, sz }: the centreline, its unit tangent (A → B) and the
//                           horizontal side vector (the right of A → B travel) at arc length s
//   nearestOnLeg(leg, p)  → { s, d }
//   pipeColliderDefs(layout) → [{ kind: 'seg', a, b, w, h, pipe, glass, roof }]: the glass, as oriented boxes
//   tideAt(flip, t, end)  → { dir: 'ab'|'ba', phase: 'run'|'warn'|'shut', next, prev, left, n }: the E2 schedule, a pure
//                           function of the stage clock (end = the regulation length: changes in its last quietEnd s hold)
//   helix(...)            → points for a spiral run (kept for later stages; this one rises straight)
//   checkPipes(layout)    → string[]: the §5 rules that need no Level
// A leg: one glass tube from mouth A (pts[0]) to mouth B (pts[n−1]); straight runs between the points, a circular fillet
// of radius `bend` at every interior corner. `mirror: true` gives every leg its 180° twin ((x, z) → (−x, −z), id + '~')
// except `single` legs (their own twin, checked).
import { registerStageData } from './stageData.js';

export const PIPE = {
  rIn: 0.80, rOut: 0.88, box: 1.60, speed: 18, speedMin: 12, speedMax: 24, bendMin: 1.5,
  lenMin: 12, lenLift: 3, rideMax: 3.5,     // m; m for one-way legs ending in an up / down nozzle; s of ride
  mouthY: 0.80, endStraight: 0.5, lut: 0.1, piece: 4.0, arcPiece: 1.2,
  landOut: 3.45, approachOut: 1.0,          // m out of the mouth plane: the no-input level landing (measured on the real
                                            // actor: 3.46 m; ENGINE.md §1.3's estimate was 3.1), the approach point
  maxDefs: 6, maxEnds: 24, maxLen: 360, maxPieces: 200, maxTop: 11.0,
};
export const FLIP_DEFAULTS = { every: 90, first: 'ab', warn: 10, close: 3, reopen: 1, quietEnd: 15 };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const r3 = (v) => Math.round(v * 1000) / 1000;
const turn = ([x, y, z]) => [-x, y, -z];

// ------------------------------------------------------------------------------------------------ the centreline
// segments: { kind: 'line', a, b, s0, len, t } | { kind: 'arc', c, u, w, r, phi, s0, len }; runs: per input run, its
// length and the fillets' need (tangent lengths at either end)
function buildPath(pts, bend) {
  const n = pts.length, tan = new Array(n).fill(0), corner = new Array(n).fill(null);
  for (let i = 1; i < n - 1; i++) {
    const a = nrm(sub(pts[i - 1], pts[i])), b = nrm(sub(pts[i + 1], pts[i]));
    const th = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));   // the angle between the two runs at the corner
    if (Math.PI - th < 1e-4) continue;                            // (no turn)
    const t = bend / Math.tan(th / 2);
    tan[i] = t;
    const A = add(pts[i], a, t), Bp = add(pts[i], b, t), C = add(pts[i], nrm(add(a, b)), bend / Math.sin(th / 2));
    const u = nrm(sub(A, C)), v = nrm(sub(Bp, C)), uv = dot(u, v), w = nrm(sub(v, [u[0] * uv, u[1] * uv, u[2] * uv]));
    corner[i] = { A, B: Bp, C, u, w, r: bend, phi: Math.PI - th };
  }
  const segs = [], runs = [];
  let s = 0, from = pts[0];
  for (let i = 1; i < n; i++) {
    const runLen = len3(sub(pts[i], pts[i - 1]));
    runs.push({ len: runLen, need: tan[i - 1] + tan[i], i });
    const to = corner[i] ? corner[i].A : pts[i];
    const L = len3(sub(to, from));
    if (L > 1e-6) { segs.push({ kind: 'line', a: from, b: to, s0: s, len: L, t: nrm(sub(to, from)) }); s += L; }
    if (corner[i]) {
      const c = corner[i], L2 = c.r * c.phi;
      segs.push({ kind: 'arc', c: c.C, u: c.u, w: c.w, r: c.r, phi: c.phi, s0: s, len: L2 });
      s += L2;
      from = c.B;
    }
  }
  return { segs, runs, len: s, tan };
}
function segAt(sg, s, o) {
  const k = Math.max(0, Math.min(sg.len, s - sg.s0));
  if (sg.kind === 'line') {
    o.x = sg.a[0] + sg.t[0] * k; o.y = sg.a[1] + sg.t[1] * k; o.z = sg.a[2] + sg.t[2] * k;
    o.tx = sg.t[0]; o.ty = sg.t[1]; o.tz = sg.t[2];
    return o;
  }
  const al = k / sg.r, ca = Math.cos(al), sa = Math.sin(al);
  o.x = sg.c[0] + sg.r * (sg.u[0] * ca + sg.w[0] * sa); o.y = sg.c[1] + sg.r * (sg.u[1] * ca + sg.w[1] * sa); o.z = sg.c[2] + sg.r * (sg.u[2] * ca + sg.w[2] * sa);
  o.tx = -sg.u[0] * sa + sg.w[0] * ca; o.ty = -sg.u[1] * sa + sg.w[1] * ca; o.tz = -sg.u[2] * sa + sg.w[2] * ca;
  return o;
}
// the LUT: every PIPE.lut m, 8 floats a sample (x, y, z, tx, ty, tz, sx, sz): sx / sz the horizontal right of A → B
// travel (on a vertical run: the last non-vertical one's)
function buildLut(path) {
  // uniform spacing (≈ PIPE.lut, exactly L / (n − 1)) so legAt's index is exact to the last sample
  const n = Math.max(2, Math.ceil(path.len / PIPE.lut - 1e-9) + 1), st = path.len / (n - 1), lut = new Float32Array(n * 8);
  const o = {};
  let si = 0, psx = 1, psz = 0;
  for (let i = 0; i < n; i++) {
    const s = Math.min(path.len, i * st);
    while (si < path.segs.length - 1 && s > path.segs[si].s0 + path.segs[si].len) si++;
    segAt(path.segs[si], s, o);
    let sx = psx, sz = psz;
    const h = Math.hypot(o.tx, o.tz);
    if (h > 0.05) { sx = -o.tz / h; sz = o.tx / h; psx = sx; psz = sz; }   // t × up, horizontal
    lut.set([o.x, o.y, o.z, o.tx, o.ty, o.tz, sx, sz], i * 8);
  }
  lut.step = st;
  return lut;
}

// ------------------------------------------------------------------------------------------------ expand
const CACHE = new WeakMap();
export function expandPipes(layout) {
  const P = layout && layout.pipes;
  if (!P || !P.legs || !P.legs.length) return null;
  const hit = CACHE.get(P);
  if (hit && hit.layout === layout) return hit.X;
  const problems = [];
  const legs = [], ends = [];
  const mkLeg = (L, twin, defIdx) => {
    const pts = twin ? L.pts.map(turn) : L.pts.map((p) => p.slice());
    const speed = L.speed || P.speed || PIPE.speed, bend = L.bend || PIPE.bendMin;
    const path = buildPath(pts, bend);
    const way = L.way && typeof L.way === 'object' && L.way.flip ? 'tide' : L.way === 'one' ? 'one' : 'two';
    const flip = way === 'tide' ? { ...FLIP_DEFAULTS, ...L.way.flip } : null;
    const names = (twin && L.twinNames) || L.names || [L.id + ' A', L.id + ' B'];
    const look = { tint: 'clear', collars: way === 'two' ? 'brass' : 'steel', chevrons: way !== 'two', ...(L.look || {}) };
    if (twin && look.deckLight) { const [x0, x1, z0, z1, y] = look.deckLight; look.deckLight = [-x1, -x0, -z1, -z0, y]; }
    const leg = { i: legs.length, def: defIdx, id: L.id + (twin ? '~' : ''), twin: -1, isTwin: !!twin, single: !!L.single, way, flip, speed, bend,
      pts, path, len: path.len, lut: buildLut(path), names, look, hide: (L.hide || []).map((h) => h.slice()), ends: null,
      ride: path.len / speed };
    leg.n = leg.lut.length / 8; leg.lutStep = leg.lut.step;
    // the ends: k = 0 is A (pts[0]), k = 1 is B; out = horizontal unit out of the mouth
    leg.ends = [0, 1].map((k) => {
      const m = k ? pts[pts.length - 1] : pts[0], q = k ? pts[pts.length - 2] : pts[1];
      const nz = (L.ends && L.ends[k] && L.ends[k].nozzle) || 'level';
      const o = nrm([m[0] - q[0], 0, m[2] - q[2]]), fy = r3(m[1] - PIPE.mouthY);
      const e = { i: ends.length, leg: leg.i, k, pos: m.slice(), out: o, nozzle: nz, name: names[k] || '', floorY: fy,
        approach: [r3(m[0] + o[0] * PIPE.approachOut), fy, r3(m[2] + o[2] * PIPE.approachOut)],
        land: [r3(m[0] + o[0] * PIPE.landOut), fy, r3(m[2] + o[2] * PIPE.landOut)],
        // which tide state makes it the IN end: two-way 'both', one-way A only, tidal A in 'ab' and B in 'ba'
        inWhen: way === 'two' ? 'both' : way === 'one' ? (k ? 'never' : 'always') : (k ? 'ba' : 'ab') };
      ends.push(e);
      return e;
    });
    legs.push(leg);
    return leg;
  };
  P.legs.forEach((L, d) => {
    const a = mkLeg(L, false, d);
    if (P.mirror && !L.single) { const b = mkLeg(L, true, d); a.twin = b.i; b.twin = a.i; } else a.twin = a.i;
  });
  // the water volumes (looks only: the ride camera's grade), mirrored (one on the centre is its own twin)
  const water = [];
  for (const v of P.water || []) {
    water.push(v);
    const c = v.cyl ? Math.hypot(v.cyl[0], v.cyl[1]) < 1e-6 : Math.abs(v.box[0] + v.box[1]) < 1e-6 && Math.abs(v.box[2] + v.box[3]) < 1e-6;
    if (P.mirror && !c) water.push(v.cyl ? { ...v, cyl: [-v.cyl[0], -v.cyl[1], v.cyl[2]] } : { ...v, box: [-v.box[1], -v.box[0], -v.box[3], -v.box[2]] });
  }
  // extra no-place areas the stage asks for (DECISIONS #24; LEAD-NOTES 2026-10-09): [{ box: [x0, x1, z0, z1] | poly, y: [y0, y1], why }]
  const aprons = [];
  for (const a of P.aprons || []) {
    aprons.push(a);
    if (P.mirror && !a.single) aprons.push(a.poly ? { ...a, poly: a.poly.map(([x, z]) => [-x, -z]) } : { ...a, box: [-a.box[1], -a.box[0], -a.box[3], -a.box[2]] });
  }
  const X = { label: P.label || 'PIPES', enter: P.enter === 'squid' ? 'squid' : 'any', speed: P.speed || PIPE.speed,
    cooldown: Math.max(1.5, Math.min(4, P.cooldown ?? 2.5)), modes: P.modes || {}, legs, ends, water, aprons, problems,
    totalLen: legs.reduce((s, l) => s + l.len, 0) };
  X.pieces = colliderPieces(X).length;
  CACHE.set(P, { layout, X });
  return X;
}

// ------------------------------------------------------------------------------------------------ queries
export function legAt(leg, s, out = {}) {
  const lut = leg.lut, n = leg.n, f = Math.max(0, Math.min(n - 1, s / leg.lutStep));
  let i = Math.floor(f); if (i >= n - 1) i = n - 2;
  const k = Math.min(1, f - i), a = i * 8, b = a + 8;
  out.x = lut[a] + (lut[b] - lut[a]) * k; out.y = lut[a + 1] + (lut[b + 1] - lut[a + 1]) * k; out.z = lut[a + 2] + (lut[b + 2] - lut[a + 2]) * k;
  let tx = lut[a + 3] + (lut[b + 3] - lut[a + 3]) * k, ty = lut[a + 4] + (lut[b + 4] - lut[a + 4]) * k, tz = lut[a + 5] + (lut[b + 5] - lut[a + 5]) * k;
  const l = Math.hypot(tx, ty, tz) || 1; out.tx = tx / l; out.ty = ty / l; out.tz = tz / l;
  out.sx = k < 0.5 ? lut[a + 6] : lut[b + 6]; out.sz = k < 0.5 ? lut[a + 7] : lut[b + 7];
  return out;
}
export function nearestOnLeg(leg, p) {
  const lut = leg.lut;
  let best = Infinity, bi = 0;
  for (let i = 0; i < leg.n; i++) { const dx = lut[i * 8] - p.x, dy = lut[i * 8 + 1] - p.y, dz = lut[i * 8 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
  return { s: Math.min(leg.len, bi * leg.lutStep), d: Math.sqrt(best) };
}
// is s inside one of the leg's `hide` ranges (housings, heads, pylons: no glass drawn there)
export function hiddenAt(leg, s) { for (const h of leg.hide) if (s >= h[0] && s <= h[1]) return true; return false; }
// is (x, y, z) inside one of the water volumes (the ride camera's grade)? A volume's optional `open` (m) is water open to
// the sky at its top: the grade starts that far below it (`graded`; a lens just under an open surface looks out at the
// open air: LEAD-REVIEW round 2, item 4 — the kelp drum's top tinted the whole promenade teal)
export function inWaterVol(v, x, y, z, pad = 0, graded = false) {
  if (y < v.y[0] + pad || y > v.y[1] - pad - (graded ? v.open || 0 : 0)) return false;
  if (v.cyl) return Math.hypot(x - v.cyl[0], z - v.cyl[1]) <= v.cyl[2] - pad;
  return x >= v.box[0] + pad && x <= v.box[1] - pad && z >= v.box[2] + pad && z <= v.box[3] - pad;
}

// ------------------------------------------------------------------------------------------------ the tide (E2)
export function tideAt(flip, t, end = Infinity) {
  const F = flip || FLIP_DEFAULTS, E = F.every;
  const nMax = Number.isFinite(end) ? Math.max(0, Math.floor((end - F.quietEnd) / E + 1e-9)) : Infinity;
  const nPast = Math.min(Math.max(0, Math.floor(t / E + 1e-9)), nMax);
  const dir = (nPast % 2 === 0) === (F.first !== 'ba') ? 'ab' : 'ba';
  const prev = nPast > 0 ? nPast * E : -Infinity, next = nPast + 1 <= nMax ? (nPast + 1) * E : Infinity;
  let phase = 'run';
  if (t >= next - F.close) phase = 'shut'; else if (t >= next - F.warn) phase = 'warn';
  if (t < prev + F.reopen) phase = 'shut';
  return { dir, phase, next, prev, left: next - t, n: nPast };
}
// an end takes riders in this tide state (ignoring the shut windows): its IN-ness
export function endIsIn(e, dir) { return e.inWhen === 'both' || e.inWhen === 'always' || e.inWhen === dir; }

// ------------------------------------------------------------------------------------------------ colliders
// straight runs in pieces ≤ PIPE.piece, fillets as chords ≤ PIPE.arcPiece of arc (each chord a little long, so the
// outer corners between neighbours close)
function colliderPieces(X) {
  const out = [];
  for (const leg of X.legs) {
    for (const sg of leg.path.segs) {
      if (sg.kind === 'line') {
        const n = Math.max(1, Math.ceil(sg.len / PIPE.piece - 1e-9));
        for (let i = 0; i < n; i++) out.push({ leg: leg.i, a: add(sg.a, sg.t, (sg.len * i) / n), b: add(sg.a, sg.t, (sg.len * (i + 1)) / n) });
      } else {
        const n = Math.max(1, Math.ceil(sg.len / PIPE.arcPiece - 1e-9)), d = sg.phi / n, ext = Math.min(0.3, (PIPE.box / 2) * Math.tan(d / 2));
        const o = {};
        for (let i = 0; i < n; i++) {
          segAt(sg, sg.s0 + (sg.len * i) / n, o); const a = [o.x, o.y, o.z];
          segAt(sg, sg.s0 + (sg.len * (i + 1)) / n, o); const b = [o.x, o.y, o.z];
          const u = nrm(sub(b, a));
          out.push({ leg: leg.i, a: add(a, u, -ext), b: add(b, u, ext) });
        }
      }
    }
  }
  return out;
}
export function pipeColliderDefs(layout) {
  const X = expandPipes(layout);
  if (!X) return [];
  return colliderPieces(X).map((p) => ({ kind: 'seg', a: p.a.map(r3), b: p.b.map(r3), w: PIPE.box, h: PIPE.box, pipe: p.leg + 1, glass: true, roof: true, tag: 'pipe-glass' }));
}

export function helix(c, r, y0, y1, turns, a0Deg, stepDeg = 30) {
  const out = [], n = Math.max(2, Math.ceil((turns * 360) / stepDeg));
  for (let i = 0; i <= n; i++) { const a = ((a0Deg + (i / n) * turns * 360) * Math.PI) / 180; out.push([r3(c[0] + r * Math.cos(a)), r3(y0 + ((y1 - y0) * i) / n), r3(c[1] + r * Math.sin(a))]); }
  return out;
}

// ------------------------------------------------------------------------------------------------ the static rules (§5)
const distSegPt = (ax, az, bx, bz, px, pz) => {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(ax + dx * t - px, az + dz * t - pz);
};
const inPoly = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
export const polyDist = (poly, x, z) => { if (inPoly(poly, x, z)) return 0; let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, distSegPt(poly[j][0], poly[j][1], poly[i][0], poly[i][1], x, z)); return d; };

export function checkPipes(layout) {
  const X = expandPipes(layout);
  if (!X) return [];
  const out = [], P = layout.pipes, f2 = (v) => v.toFixed(2);
  const defs = P.legs;
  if (defs.length > PIPE.maxDefs) out.push(`pipes rule 1: ${defs.length} leg definitions (≤ ${PIPE.maxDefs})`);
  if (X.ends.length > PIPE.maxEnds) out.push(`pipes rule 1: ${X.ends.length} ends (≤ ${PIPE.maxEnds})`);
  if (!X.legs.some((l) => l.way === 'two') || !X.legs.some((l) => l.way !== 'two')) out.push('pipes rule 1: at least one one-way and one two-way leg ("some … some")');
  if (X.totalLen > PIPE.maxLen + 1e-6) out.push(`pipes rule 2: total ${f2(X.totalLen)} m (≤ ${PIPE.maxLen})`);
  if (X.pieces > PIPE.maxPieces) out.push(`pipes rule 6: ${X.pieces} collider pieces (≤ ${PIPE.maxPieces})`);
  if ((X.label || '').length > 14) out.push(`pipes rule 29: label "${X.label}" over 14 characters`);
  const pads = (layout.spawnPads || []).map((p) => [p[0], p[2]]);
  const zones = [];
  if (layout.zones) {
    for (const z of [].concat(layout.zones.center || [])) zones.push(z.poly, z.poly.map(([x, zz]) => [-x, -zz]));
    if (layout.zones.side) zones.push(layout.zones.side.poly, layout.zones.side.poly.map(([x, zz]) => [-x, -zz]));
  }
  const gates = [];
  const BZ = layout.bazookarp;
  if (BZ && BZ.gate) { const g = BZ.gate.at; gates.push([g[0], g[2]], [-g[0], -g[2]]); }
  const shut = new Set((P.modes && P.modes.bazookarp && P.modes.bazookarp.shut) || []);
  for (const leg of X.legs) {
    const id = leg.id, v = leg.speed;
    if (leg.isTwin) continue;   // (a twin is the exact turn of its leg: checked once, on the leg; rules 19–22 below check both)
    const lift = leg.ends.some((e) => e.nozzle !== 'level');
    if (leg.len < (lift && leg.way !== 'two' ? PIPE.lenLift : PIPE.lenMin)) out.push(`pipes rule 2: ${id} is ${f2(leg.len)} m (≥ ${PIPE.lenMin})`);
    if (leg.ride > PIPE.rideMax + 1e-6) out.push(`pipes rule 2: ${id} rides ${f2(leg.ride)} s (≤ ${PIPE.rideMax})`);
    if (v < PIPE.speedMin || v > PIPE.speedMax) out.push(`pipes rule 5: ${id} at ${v} m/s (12–24)`);
    const bendNeed = Math.max(PIPE.bendMin, (v * v) / 220);
    if (leg.bend < bendNeed - 1e-6) out.push(`pipes rule 4: ${id} bend ${leg.bend} m < ${f2(bendNeed)} at ${v} m/s`);
    leg.path.runs.forEach((r, j) => {
      const end = j === 0 || j === leg.path.runs.length - 1, need = r.need + (end ? PIPE.endStraight : 0.1);
      if (r.len < need - 1e-6) out.push(`pipes rule 4: ${id} run ${j + 1} is ${f2(r.len)} m, its fillets need ${f2(need)}`);
    });
    if (v > 18) for (const e of leg.ends) { const d = Math.hypot(e.pos[0], e.pos[2]); if (d < 25) out.push(`pipes rule 5: ${id} at ${v} m/s has an end ${f2(d)} m from mid (≥ 25)`); }
    for (const e of leg.ends) {
      const p = leg.pts, q = e.k ? p[p.length - 2] : p[1];
      if (e.nozzle === 'level' && Math.abs(q[1] - e.pos[1]) > 1e-6) out.push(`pipes rule 7: ${id} ${e.k ? 'B' : 'A'}'s end run isn't level`);
      if ((e.name || '').length > 14) out.push(`pipes rule 29: name "${e.name}" over 14 characters`);
    }
    if (leg.look.tint && leg.look.tint !== 'clear') out.push(`pipes rule 29: ${id} tinted "${leg.look.tint}" (team-like hues are the riders' own)`);
    let top = -Infinity; for (let i = 0; i < leg.n; i++) top = Math.max(top, leg.lut[i * 8 + 1] + PIPE.rOut);
    if (top > PIPE.maxTop + 1e-6) out.push(`pipes rule 16: ${id}'s glass top at ${f2(top)} m (≤ ${PIPE.maxTop})`);
    if (leg.single) {   // its own 180° twin: reversed and turned, the same points
      const tw = leg.pts.slice().reverse().map(turn);
      if (tw.some((p, i) => len3(sub(p, leg.pts[i])) > 0.01)) out.push(`pipes rule 23: ${id} is single but not its own 180° twin`);
    }
    if (leg.flip) {
      const F = leg.flip;
      if (F.warn < 10 || F.close < 3 || F.quietEnd < 15) out.push(`pipes rule 34: ${id}'s tide warns ${F.warn} s / closes ${F.close} s / holds the last ${F.quietEnd} s (≥ 10 / 3 / 15)`);
    }
  }
  for (const leg of X.legs) {
    const id = leg.id;
    for (const e of leg.ends) {
      const ein = e.inWhen !== 'never', tag = `${id} ${e.k ? 'B' : 'A'}`;
      for (const [px, pz] of pads) {
        const d = Math.hypot(e.pos[0] - px, e.pos[2] - pz), dl = Math.hypot(e.land[0] - px, e.land[2] - pz);
        if (ein && d < 6) out.push(`pipes rule 19: ${tag} (IN) ${f2(d)} m from a pad (≥ 6)`);
        if (ein && d < 15) {
          const o = leg.ends[1 - e.k], away = Math.hypot(o.pos[0] - px, o.pos[2] - pz) > d;
          if (leg.way === 'two' || e.inWhen !== 'always' || !away) out.push(`pipes rule 19: ${tag} (IN) ${f2(d)} m from a pad must be one-way and lead away`);
        }
        if (e.inWhen !== 'always' && dl < 22) out.push(`pipes rule 19: ${tag}'s landing ${f2(dl)} m from a pad (≥ 22)`);
      }
      for (const poly of zones) {
        const d = polyDist(poly, e.pos[0], e.pos[2]), dl = polyDist(poly, e.land[0], e.land[2]);
        if (d < 3) out.push(`pipes rule 20: ${tag} ${f2(d)} m from a zone (≥ 3)`);
        if (e.inWhen !== 'always' && dl < 3) out.push(`pipes rule 20: ${tag}'s landing ${f2(dl)} m from a zone (≥ 3)`);
      }
      for (const [gx, gz] of gates) {
        const d = Math.hypot(e.pos[0] - gx, e.pos[2] - gz), dl = Math.hypot(e.land[0] - gx, e.land[2] - gz);
        if (d < 15) out.push(`pipes rule 22: ${tag} ${f2(d)} m from a Gate (≥ 15)`);
        if (e.inWhen !== 'always' && dl < 15 && !shut.has(leg.id.replace('~', ''))) out.push(`pipes rule 22: ${tag}'s landing ${f2(dl)} m from a Gate and not in modes.bazookarp.shut`);
      }
    }
  }
  // rule 24: ends of different legs ≥ 6 m apart (xz) unless their floors are ≥ 2.4 m apart
  for (let i = 0; i < X.ends.length; i++) for (let j = i + 1; j < X.ends.length; j++) {
    const a = X.ends[i], b = X.ends[j];
    if (a.leg === b.leg) continue;
    const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
    if (d < 6 && Math.abs(a.floorY - b.floorY) < 2.4) out.push(`pipes rule 24: ${X.legs[a.leg].id} and ${X.legs[b.leg].id} ends ${f2(d)} m apart (≥ 6)`);
  }
  // rule 30: centrelines ≥ 2.5 m apart where legs pass each other
  const samp = X.legs.map((leg) => { const o = [], q = {}; for (let s = 0; s <= leg.len; s += 1) { legAt(leg, s, q); o.push([q.x, q.y, q.z]); } return o; });
  for (let i = 0; i < X.legs.length; i++) for (let j = i + 1; j < X.legs.length; j++) {
    let best = Infinity;
    for (const p of samp[i]) for (const q of samp[j]) best = Math.min(best, len3(sub(p, q)));
    if (best < 2.5) out.push(`pipes rule 30: ${X.legs[i].id} and ${X.legs[j].id} pass ${f2(best)} m apart (≥ 2.5)`);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ tool hooks
// the stage-select thumbnail and check-maps --svg: legs as pale double lines, arrowheads on one-way legs (tidal ones in
// their first state, dashed), a dot at each end of a two-way leg
function thumb(layout, api) {
  const X = expandPipes(layout);
  if (!X) return '';
  const { X: SX, Y: SY, s } = api, out = [], q = {};
  for (const leg of X.legs) {
    const pts = [];
    for (let d = 0; d <= leg.len; d += 0.8) { legAt(leg, Math.min(d, leg.len), q); pts.push(`${SX(q.z).toFixed(1)},${SY(q.x).toFixed(1)}`); }
    legAt(leg, leg.len, q); pts.push(`${SX(q.z).toFixed(1)},${SY(q.x).toFixed(1)}`);
    const dash = leg.way === 'tide' ? ' stroke-dasharray="3 1.6"' : '';
    out.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#1b2a44" stroke-opacity=".45" stroke-width="${(s * 1.9).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    out.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#eaf8fb" stroke-opacity=".95" stroke-width="${(s * 1.1).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
    if (leg.way === 'two') for (const e of leg.ends) out.push(`<circle cx="${SX(e.pos[2]).toFixed(1)}" cy="${SY(e.pos[0]).toFixed(1)}" r="${(s * 1.1).toFixed(2)}" fill="#fff" stroke="#1b2a44" stroke-opacity=".6" stroke-width=".8"/>`);
    else for (let d = 6; d < leg.len - 3; d += 12) {
      legAt(leg, d, q);
      const x = SX(q.z), y = SY(q.x), dx = q.tz, dy = -q.tx, l = Math.hypot(dx, dy);
      if (l < 0.2) continue;
      const ux = dx / l, uy = dy / l, k = s * 1.5;
      out.push(`<path d="M${(x + ux * k).toFixed(1)} ${(y + uy * k).toFixed(1)} L${(x - ux * k - uy * k * 0.8).toFixed(1)} ${(y - uy * k + ux * k * 0.8).toFixed(1)} L${(x - ux * k + uy * k * 0.8).toFixed(1)} ${(y - uy * k - ux * k * 0.8).toFixed(1)}Z" fill="#1b2a44" fill-opacity=".75"/>`);
    }
  }
  return out.join('');
}
registerStageData('pipes', { thumb, check: (layout) => checkPipes(layout).map((p) => `${layout.id}: ${p}`) });
