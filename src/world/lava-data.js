// LAYOUT.lava's three-free tool hooks (tools/botlab/jobs/batch5/stages/caldera/ENGINE.md §5, H15 / H20): the stage-select
// thumbnail draws the lava region under the blocks; build/check-maps.mjs checks the static (C) rules of ENGINE.md §5.
// No three.js here (Node reads it).
import { registerStageData } from './stageData.js';
import { LAVA, lavaSchedule, expandLava, pointInPoly } from '../game/lavaCore.js';
import { inMode } from './variants.js';

const r2 = (v) => Math.round(v * 100) / 100;
function distToPoly(P, x, z) {
  let d = Infinity;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [ax, az] = P[j], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return pointInPoly(P, x, z) ? 0 : d;
}

export function checkLava(layout, api = {}) {
  const def = layout.lava, out = [], mode = api.mode || 'turf';
  if (!def) return out;
  const lo = def.low, hi = def.high, X = expandLava(def, (it) => inMode(it, mode));
  const inR = (x, z) => X.polys.some((P) => pointInPoly(P, x, z));
  // 1–2: heights and timing
  if (!(lo >= -1.6 && lo <= 0)) out.push(`lava rule 1: LOW ${lo} outside −1.6 … 0`);
  if (!(hi - lo >= 1.2 && hi - lo <= 3.0) || hi > 2.0) out.push(`lava rule 1: HIGH ${hi} (range ${r2(hi - lo)}): range 1.2 … 3.0, HIGH ≤ 2`);
  const T = { warn: 10, rise: 10, fall: 10, ease: 'smooth', ...(def.timing || {}) };
  for (const k of ['rise', 'fall']) {
    if (T[k] < 6 || T[k] > 12) out.push(`lava rule 2: ${k} ${T[k]} s outside 6 … 12`);
    const pk = ((T.ease === 'linear' ? 1 : 1.5) * (hi - lo)) / T[k];
    if (pk > 0.47) out.push(`lava rule 2: ${k} peaks at ${r2(pk)} m/s (max 0.47)`);
  }
  if (T.warn < 6 || T.warn > 10) out.push(`lava rule 2: warning ${T.warn} s outside 6 … 10`);
  // 3–5: the schedules of the matches (Practice and the menu backdrop are exempt from 3)
  const MODES = [['turf', 180], ['turf', 90], ['zones', 300], ['tower', 300], ['bazookarp', 300], ['boss', 300]];
  for (const [m, dur] of MODES) {
    const S = lavaSchedule(def, m, dur, {});
    if (!S || S.kind !== 'moves') continue;
    const M = S.moves;
    if (M.length && M[0].t0 < 25) out.push(`lava rule 3: ${m}:${dur} first move at ${M[0].t0} s (≥ 25)`);
    for (let i = 0; i + 1 < M.length; i++) {
      const hold = M[i + 1].t0 - (M[i].t0 + M[i].dur), atHigh = M[i].dir > 0;
      if (hold < (atHigh ? 15 : 25)) out.push(`lava rule 3: ${m}:${dur} holds ${r2(hold)} s at ${atHigh ? 'HIGH' : 'LOW'} after the move at ${M[i].t0}`);
    }
    if (M.length % 2) out.push(`lava rule 4: ${m}:${dur} does not end at LOW`);
    const last = M.length ? M[M.length - 1].t0 + M[M.length - 1].dur : 0;
    if (m === 'turf' && dur - last < 25) out.push(`lava rule 4: ${m}:${dur} ends with ${r2(dur - last)} s of LOW (≥ 25)`);
    if (m !== 'turf' && M.some((x) => x.t0 > dur - (T.warn + 2))) out.push(`lava rule 5: ${m}:${dur} starts a move in the last warn + 2 s`);
  }
  // 6, 9, 12: the static floors in the region
  for (const { d, s } of api.solids || []) {
    if (!inR(s.c[0], s.c[1]) || d.hidden) continue;
    const top = s.y1;
    if (d.grate && top < hi + 2.0) out.push(`lava rule 12: ${d._n} is a grate in the region below HIGH + 2`);
    if (Math.abs(top - lo) < 0.3 || Math.abs(top - hi) < 0.3) out.push(`lava rule 6: ${d._n} (${d.tag || ''}) has a flat top at ${r2(top)} within 0.3 of LOW / HIGH`);
    if (top < lo + 0.3) out.push(`lava rule 9: ${d._n} (${d.tag || ''}) tops at ${r2(top)} in the lake (void below LOW + 0.3)`);
  }
  // 15–18, 30: riders
  let parts = 0;
  for (const r of X.riders) {
    parts += r.parts.length;
    const w = r.shape === 'hex' ? 2 * r.r : 2 * r.parts[0].hx, dd = r.shape === 'hex' ? Math.sqrt(3) * r.r : 2 * r.parts[0].hz;
    if (Math.min(w, dd) < 1.6 || Math.max(w, dd) > 5.5) out.push(`lava rule 15: ${r.id} footprint ${r2(w)} × ${r2(dd)} (1.6 … 5.5)`);
    if (r.sink) {
      const [a, b] = r.sink.rel;
      if (b < LAVA.minFree) out.push(`lava rule 16: ${r.id} stands ${b} over the lava while up (≥ ${LAVA.minFree})`);
      if (r.depth < b + 0.3) out.push(`lava rule 15: ${r.id} depth ${r.depth} < top − L + 0.3`);
      const pk = (1.5 * (hi - lo)) / T.rise + (b - a) / r.sink.ease;
      if (pk > 0.6) out.push(`lava rule 17: ${r.id} peaks at ${r2(pk)} m/s (max 0.6)`);
      if (Math.abs(r.sink.at - (0 - LAVA.kill)) > 0.3 && r.sink.at > hi) out.push(`lava rule 41: ${r.id} sink.at ${r.sink.at}`);
    } else {
      if (r.top0 < lo + LAVA.minFree || r.top1 < hi + LAVA.minFree) out.push(`lava rule 16: ${r.id} tops ${r.top0} / ${r.top1} closer than ${LAVA.minFree} over the lava`);
      if (r.look?.role === 'lookout' && (r.top0 < lo + 1 || r.top1 < hi + 1)) out.push(`lava rule 16: lookout ${r.id} under L + 1.0`);
      if (r.depth < r.top0 - lo + 0.3) out.push(`lava rule 15: ${r.id} depth ${r.depth} < ${r2(r.top0 - lo + 0.3)}`);
      if (r.inLake) { for (const e of [0, 0.5, 1]) { const y = lo + (hi - lo) * e, top = r.top0 + (r.top1 - r.top0) * e; if (y - (top - r.depth) < 0.3) out.push(`lava rule 15: in-lake ${r.id}'s bottom shows at e ${e}`); } }
      const tr = r.top1 - r.top0, pk = (1.5 * tr) / Math.min(T.rise, T.fall);
      if (tr < 0.6) out.push(`lava rule 18: ${r.id} travels ${r2(tr)} (≥ 0.6)`);
      if (pk > 0.6) out.push(`lava rule 17: ${r.id} peaks at ${r2(pk)} m/s (max 0.6)`);
    }
  }
  if (parts > LAVA.maxParts) out.push(`lava rule 30: ${parts} rider parts (max ${LAVA.maxParts})`);
  // 8: the region and the twins are 180°-symmetric
  for (const P of (def.region && def.region.polys) || []) for (const [x, z] of P) if (!P.some(([a, b]) => Math.hypot(a + x, b + z) < 0.05)) { out.push(`lava rule 8: region vertex (${r2(x)}, ${r2(z)}) has no 180° twin`); break; }
  // 31: counts
  if (X.gauges.length > 4) out.push(`lava rule 31: ${X.gauges.length} gauges (max 4)`);
  if (X.cascades.length > 4) out.push(`lava rule 31: ${X.cascades.length} cascades (max 4)`);
  if (X.vents.length > 12) out.push(`lava rule 31: ${X.vents.length} vents (max 12)`);
  // 26: zones never on lava-reachable ground; 29: spawns ≥ 10 m from the region
  const Z = layout.zones;
  if (Z && mode === 'zones') for (const z of [...(Z.center || []), ...(Z.side ? [Z.side] : [])]) if (z.y0 < hi + 0.3 && z.poly.some(([x, zz]) => inR(x, zz))) out.push(`lava rule 26: a zone floor at ${z.y0} in the region (≥ HIGH + 0.3)`);
  for (const [x, , z] of layout.spawnPads || []) { const d = Math.min(...X.polys.map((P) => distToPoly(P, x, z))); if (d < 10) out.push(`lava rule 29: spawn pad (${x}, ${z}) ${r2(d)} m from the region (≥ 10)`); }
  // 37: no sea dressing in the crater
  if (layout.env && (layout.env.edge !== 'none' || layout.env.boats)) out.push(`lava rule 37: env.edge 'none' and env.boats false`);
  // the steps' rider ends exist
  for (const s of X.steps) for (const e of [s.a, s.b]) if (e.rider !== undefined && e.rider < 0) out.push(`lava: a step link names a rider that isn't there (${e.id})`);
  return out;
}

registerStageData('lava', {
  // the region under the blocks: the lake and its bays in lava red (the stage select, check-maps --svg)
  thumbBelow(layout, api) {
    const X = expandLava(layout.lava);
    return X.polys.map((P) => `<polygon points="${P.map(([x, z]) => `${api.X(z).toFixed(1)},${api.Y(x).toFixed(1)}`).join(' ')}" fill="#4a1012" stroke="#a3121a" stroke-width="1.2"/>`).join('');
  },
  check: (layout, api) => checkLava(layout, api),
});
