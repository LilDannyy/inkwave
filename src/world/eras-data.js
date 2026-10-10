// LAYOUT.eras's three-free data and tool hooks (Bluestone Junction's era engine: tools/botlab/jobs/batch5/stages/bluestone/
// ENGINE.md). Node imports it (build/check-maps.mjs through mapThumb.js), and so does the page (src/game/eras.js): pure
// functions only, no three.js.
//   • the era masks and groups (ENGINE §3.1): eraMask, groupKey, eraGroups(layout)
//   • the schedule per mode (ENGINE §3.3): eraSchedule(eras, mode, duration), jumpDone(...)
//   • the stage-select thumbnail (H19): era 1 drawn as usual, the pieces that only exist later dashed in the layout's
//     neutral colours (eras.colors: white-gold / warm grey)
//   • check-maps (T2): overlaps only between pieces that share an era; each era's build (`<id>#1` … `#3`); the static
//     rules of ENGINE §5 that need no Level — groups (3–6), era-only share (7), appearing pieces against every walkable
//     top beneath them in the era before (19–20, 19b as restated in rev 2), vanishing walkable tops (27), and the 2 m
//     strip test (DESIGN.md §6.1 #2), per mode variant
import { registerStageData } from './stageData.js';
import { inMode } from './variants.js';

// ------------------------------------------------------------------------------------------------ masks and groups
const MASK = { 1: 1, 12: 3, 2: 2, 23: 6, 3: 4 };
// '1' | '12' | '2' | '23' | '3' | undefined → 1 | 3 | 2 | 6 | 4 | 7 ('13' → error)
export function eraMask(s) {
  if (s === undefined || s === null || s === '' || s === '123' || s === 7) return 7;
  if (typeof s === 'number' && s >= 1 && s <= 7 && s !== 5) return s;
  const m = MASK[s];
  if (!m) throw new Error(`eras: bad era tag '${s}' (one of '1', '12', '2', '23', '3')`);
  return m;
}
export const eraBit = (e) => 1 << (e - 1);
export const hasEra = (mask, e) => (mask & eraBit(e)) !== 0;
// a piece's group key: its eraGroup on its half (mirrored twins are separate groups); an untagged era piece is its own
export const groupKey = (group, cz, fallback) => (group || '#' + fallback) + (cz < 0 ? ':a' : ':b');

// footprint and heights of a layout def (box / obox / ramp), mirrored when asked
export function defShape(d, mir = false) {
  const f = (x, z) => (mir ? [-x, -z] : [x, z]);
  if (d.kind === 'box') {
    const [x0, y0, z0] = d.min, [x1, y1, z1] = d.max;
    return { k: 'b', poly: [f(x0, z0), f(x1, z0), f(x1, z1), f(x0, z1)], y0, y1 };
  }
  if (d.kind === 'obox') {
    const a = (d.rotY * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), [cx, cy, cz] = d.center, hw = d.size[0] / 2, hh = d.size[1] / 2, hd = d.size[2] / 2;
    return { k: 'b', poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => f(cx + c * hw * i + s * hd * j, cz - s * hw * i + c * hd * j)), y0: cy - hh, y1: cy + hh };
  }
  if (d.kind === 'ramp') {
    const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, dx = hx - lx, dz = hz - lz, h = Math.hypot(dx, dz) || 1;
    const sx = (-dz / h) * d.width / 2, sz = (dx / h) * d.width / 2;
    return { k: 'r', poly: [f(lx + sx, lz + sz), f(hx + sx, hz + sz), f(hx - sx, hz - sz), f(lx - sx, lz - sz)], lo: f(lx, lz), hi: f(hx, hz), ly, hy,
      thick: d.thin ? (d.thickness || 0.4) * 1.15 : 1.0, y0: Math.min(ly, hy) - 0.6, y1: Math.max(ly, hy) };
  }
  return null;   // (a module's own kind: not drawn, not checked here)
}
const centre = (poly) => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];

// every era piece of a layout as built (both halves; the half list mirrored) with its group: [{ d, name, mask, key, poly,
// y0, y1, k, … }] and the groups { key → { key, members, x0, x1, z0, z1, rg, mask } } (rg: the xz distance from (0, 0)
// to the centre of the members' union AABB: the front reaches it rg / speed s after the jump starts)
export function eraPieces(layout) {
  const out = [];
  const push = (d, name, mir) => {
    const s = defShape(d, mir); if (!s) return;
    const mask = eraMask(d.eras), [cx, cz] = centre(s.poly);
    out.push({ d, name, mask, key: mask === 7 ? null : groupKey(d.eraGroup, cz, name), cx, cz, ...s,
      roof: !!d.roof, rail: !!d.rail, hidden: !!d.hidden || !!d.rail, solid: d.solid !== false, tag: d.tag || '', grp: d.eraGroup || '' });
  };
  layout.single.forEach((d, i) => push(d, `single[${i}]`, false));
  layout.half.forEach((d, i) => { push(d, `half[${i}]`, false); push(d, `half[${i}]'`, true); });
  return out;
}
export function eraGroups(pieces) {
  const G = new Map();
  for (const p of pieces) {
    if (!p.key) continue;
    let g = G.get(p.key);
    if (!g) G.set(p.key, (g = { key: p.key, members: [], x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, mask: 0 }));
    g.members.push(p); g.mask |= p.mask;
    for (const [x, z] of p.poly) { g.x0 = Math.min(g.x0, x); g.x1 = Math.max(g.x1, x); g.z0 = Math.min(g.z0, z); g.z1 = Math.max(g.z1, z); }
  }
  for (const g of G.values()) g.rg = Math.hypot((g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2);
  return G;
}

// ------------------------------------------------------------------------------------------------ the schedule
// The jumps of a match from its mode (ENGINE §3.3; DESIGN.md §3.3): [{ from, to, at }] in stage-clock seconds, plus
// { fixed } when the mode holds one era (Boss Battle: era 2) and { cycle } for Practice / the menu backdrop (1 → 2 → 3,
// then a rewind 3 → 1, every `cycle` s, generated on demand: jumpsUpTo). `audit` (?era=n) holds era n: no jumps.
// Timed modes jump at eras.at shares of regulation time; overtime never jumps (the jumps all fall inside regulation).
export function eraSchedule(E, { mode = 'turf', duration = 180, practice = false, attract = false, audit = 0 } = {}) {
  if (audit) return { start: audit, fixed: audit, jumps: [] };
  const M = E.modes || {};
  const key = attract ? 'attract' : practice ? 'practice' : mode;
  const rule = M[key] || (practice ? M.practice : null) || null;
  if (rule && rule.fixed) return { start: rule.fixed, fixed: rule.fixed, jumps: [] };
  if (rule && rule.cycle) return { start: 1, cycle: rule.cycle, jumps: [] };
  if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) return { start: 1, jumps: [] };
  const at = E.at || [1 / 3, 2 / 3];
  return { start: 1, jumps: at.map((s, i) => ({ from: i + 1, to: i + 2, at: +(s * duration).toFixed(3) })) };
}
// a cycling schedule's jumps from its start up to time t + ahead (1 → 2 → 3 → 1 …)
export function cycleJumps(cycle, t, ahead = 60) {
  const out = [];
  for (let k = 1; k * cycle <= t + ahead; k++) out.push({ from: ((k - 1) % 3) + 1, to: (k % 3) + 1, at: k * cycle });
  return out;
}

// ------------------------------------------------------------------------------------------------ geometry helpers
const RES = 0.25;
function inPoly(P, x, z) {   // convex quads (both windings)
  let pos = false, neg = false;
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], c = (bx - ax) * (z - az) - (bz - az) * (x - ax);
    if (c > 1e-9) pos = true; else if (c < -1e-9) neg = true;
    if (pos && neg) return false;
  }
  return true;
}
function bbox(P) { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0, x1, z0, z1]; }
function topAt(p, x, z) {   // [top, bottom] of a piece at (x, z)
  if (p.k === 'r') {
    const [lx, lz] = p.lo, [hx, hz] = p.hi, dx = hx - lx, dz = hz - lz, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - lx) * dx + (z - lz) * dz) / L2)), top = p.ly + t * (p.hy - p.ly);
    return [top, top - p.thick];
  }
  return [p.y1, p.y0];
}
function cellsOf(P, res = RES) {
  const [x0, x1, z0, z1] = bbox(P), out = [];
  for (let x = Math.floor(x0 / res) * res + res / 2; x < x1; x += res) for (let z = Math.floor(z0 / res) * res + res / 2; z < z1; z += res) if (inPoly(P, x, z)) out.push(x, z);
  return out;
}
const near = (a, b) => !(b.bb[1] < a.bb[0] || b.bb[0] > a.bb[1] || b.bb[3] < a.bb[2] || b.bb[2] > a.bb[3]);

// ------------------------------------------------------------------------------------------------ the static rules
// Appearing pieces (ENGINE rules 19–20, 19b as restated in rev 2), per jump of a match (1 → 2, 2 → 3): a piece that exists
// in the new era and not the old must never occupy the 3.4 m above a place a kid can STAND in the old era (a walkable
// top — solid, not roof / rail / hidden — with nothing solid of the old era in the 1.45 m above it). A piece inside an
// old solid (rule 19) is fine only if that solid goes in the same group; one standing on an old roof that stays (19b)
// must cover it at least 0.08 m higher (or the roof swaps to a walkable top at the same height in its group).
export function appearCheck(pieces) {
  const out = [];
  for (const p of pieces) p.bb = p.bb || bbox(p.poly);
  for (const [ea, eb] of [[1, 2], [2, 3]]) {
    const old = pieces.filter((q) => hasEra(q.mask, ea) && q.solid);
    const walk = old.filter((q) => !q.roof && !q.rail && !q.hidden);
    const roofs = old.filter((q) => q.roof && hasEra(q.mask, eb));
    const fresh = pieces.filter((p) => hasEra(p.mask, eb) && !hasEra(p.mask, ea) && p.solid);
    const found = new Map();
    for (const p of fresh) {
      const C = cellsOf(p.poly);
      const candW = walk.filter((q) => near(p, q)), candO = old.filter((q) => near(p, q)), candR = roofs.filter((q) => near(p, q));
      for (let i = 0; i < C.length; i += 2) {
        const x = C[i], z = C[i + 1], [pt, pb] = topAt(p, x, z);
        for (const q of candW) {
          if (!inPoly(q.poly, x, z)) continue;
          const [qt] = topAt(q, x, z);
          if (!(pb < qt + 3.4 && pt > qt + 0.02)) continue;
          // what fills the kid's space above that top in the old era
          let blocker = null;
          for (const o of candO) {
            if (o === q || !inPoly(o.poly, x, z)) continue;
            const [ot, ob] = topAt(o, x, z);
            if (ob < qt + 1.45 && ot > qt + 0.05) { blocker = o; break; }
          }
          if (!blocker) { const k = `${ea}${eb}:${p.name}>${q.name}`; if (!found.has(k)) found.set(k, `jump ${ea}→${eb}: ${p.tag} [${p.key}] appears over ${q.tag} (top ${qt.toFixed(2)}) at (${x.toFixed(1)}, ${z.toFixed(1)}), ${Math.max(0, pb - qt).toFixed(2)} m above it (rules 19–20)`); }
          else if (!hasEra(blocker.mask, eb) && blocker.key !== p.key) { const k = `${ea}${eb}:${p.name}~${blocker.name}`; if (!found.has(k)) found.set(k, `jump ${ea}→${eb}: ${p.tag} [${p.key}] appears inside ${blocker.tag} [${blocker.key}], another group (rule 19: same group)`); }
        }
        for (const r of candR) {   // 19b: standing on a roof that stays
          if (!inPoly(r.poly, x, z)) continue;
          const [rt] = topAt(r, x, z);
          if (!(pb <= rt + 0.05 && pt > rt + 0.01 && pb > rt - 0.6)) continue;
          if (pt >= rt + 0.08 - 1e-6) continue;
          const k = `${ea}${eb}:${p.name}^${r.name}`; if (!found.has(k)) found.set(k, `jump ${ea}→${eb}: ${p.tag} [${p.key}] stands on the roof ${r.tag} with its top ${(pt - rt).toFixed(2)} m above it (rule 19b: ≥ 0.08)`);
        }
      }
    }
    out.push(...found.values());
  }
  return out;
}
// Vanishing walkable tops in a match jump (rule 27): every point ≤ 2.6 m above a floor that exists in the new era
export function vanishCheck(pieces) {
  const out = [];
  for (const p of pieces) p.bb = p.bb || bbox(p.poly);
  for (const [ea, eb] of [[1, 2], [2, 3]]) {
    const gone = pieces.filter((p) => hasEra(p.mask, ea) && !hasEra(p.mask, eb) && p.solid && !p.roof && !p.rail && !p.hidden);
    const floors = pieces.filter((q) => hasEra(q.mask, eb) && q.solid && !q.rail);
    for (const p of gone) {
      const C = cellsOf(p.poly, 0.5), cand = floors.filter((q) => near(p, q));
      let worst = 0, at = null;
      for (let i = 0; i < C.length; i += 2) {
        const x = C[i], z = C[i + 1], [pt] = topAt(p, x, z);
        let best = -Infinity;
        for (const q of cand) { if (q === p || !inPoly(q.poly, x, z)) continue; const [qt] = topAt(q, x, z); if (qt < pt - 0.05 && qt > best) best = qt; }
        const drop = pt - best;
        if (drop > worst) { worst = drop; at = [x, z]; }
      }
      if (worst > 2.6) out.push(`jump ${ea}→${eb}: ${p.tag} [${p.key}] vanishes ${worst === Infinity ? 'over nothing' : worst.toFixed(2) + ' m'} above the floor below at (${at[0].toFixed(1)}, ${at[1].toFixed(1)}) (rule 27: ≤ 2.6)`);
    }
  }
  return out;
}
// Groups (rules 3–6) and the era-only share (7)
export function groupCheck(pieces) {
  const out = [], G = eraGroups(pieces), info = {};
  for (const g of G.values()) {
    const side = Math.max(g.x1 - g.x0, g.z1 - g.z0);
    if (side > 8.05) out.push(`group ${g.key}: ${side.toFixed(2)} m on its longest side (rule 3: ≤ 8)`);
    const half = g.key.endsWith(':a') ? -1 : 1;
    for (const p of g.members) if (Math.sign(p.cz || 1e-9) !== half && Math.abs(p.cz) > 1e-6) out.push(`group ${g.key}: ${p.tag} has its centre on the other side of z = 0 (rule 4)`);
    if (g.members.length > 12) out.push(`group ${g.key}: ${g.members.length} blocks (rule 5: ≤ 12)`);
    const tw = G.get(g.key.slice(0, -2) + (half < 0 ? ':b' : ':a'));
    if (tw && half < 0) {
      const gx = Math.max(tw.x0 - g.x1, g.x0 - tw.x1), gz = Math.max(tw.z0 - g.z1, g.z0 - tw.z1);
      if (Math.max(gx, gz) < 2) out.push(`group ${g.key}: within 2 m of its mirror twin (rule 4)`);
    }
  }
  for (const [ea, eb] of [[1, 2], [2, 3]]) {
    const gs = { a: new Set(), b: new Set() }; let blocks = 0;
    for (const p of pieces) if (p.key && hasEra(p.mask, ea) !== hasEra(p.mask, eb)) { blocks++; gs[p.key.endsWith(':a') ? 'a' : 'b'].add(p.key); }
    info[`jump${ea}${eb}`] = { groups: [gs.a.size, gs.b.size], blocks };
    if (gs.a.size > 24 || gs.b.size > 24) out.push(`jump ${ea}→${eb}: ${gs.a.size} / ${gs.b.size} groups per half (rule 6: ≤ 24)`);
    if (blocks > 160) out.push(`jump ${ea}→${eb}: ${blocks} blocks change (rule 6: ≤ 160)`);
  }
  const eraOnly = pieces.filter((p) => p.mask !== 7).length;
  info.eraShare = +(eraOnly / Math.max(1, pieces.length)).toFixed(3);
  if (info.eraShare > 0.35) out.push(`era-only blocks are ${(info.eraShare * 100).toFixed(1)} % of all (rule 7: ≤ 35 %)`);
  info.groups = G.size;
  return { problems: out, info };
}

// The 2 m strip test (DESIGN.md §6.1 #2; ENGINE T2): in one era, every straight 2 m-wide strip of floor along four
// directions (N–S, E–W and the two diagonals of the Z's chamfers): its length while all of it is floor of one tier (within
// 0.15 m) with no free-standing object of 0.9 m or more in it (a solid piece under 40 m², ≥ 0.9 m tall, not a tier, kerb
// or base). Walls, buildings, railings, edges and tier steps end a strip. Returns the strips longer than `lim` (one per
// place, longest first).
const TIERS = new Set(['street', 'terrace', 'kerb', 'terrace-kerb', 'circus', 'carriageway', 'alley', 'alley-kerb']);
export function stripCheck(pieces, era, bounds, lim = 25) {
  const R = 0.1, X0 = bounds.minX - 1, Z0 = bounds.minZ - 1, nx = Math.ceil((bounds.maxX - bounds.minX + 2) / R), nz = Math.ceil((bounds.maxZ - bounds.minZ + 2) / R);
  const floor = new Float32Array(nx * nz).fill(-9), obj = new Uint8Array(nx * nz), wall = new Uint8Array(nx * nz);
  for (const p of pieces) {
    if (!hasEra(p.mask, era) || !p.solid || p.hidden && !p.rail) continue;
    const [bx0, bx1, bz0, bz1] = bbox(p.poly);
    const i0 = Math.max(0, Math.floor((bx0 - X0) / R)), i1 = Math.min(nx - 1, Math.ceil((bx1 - X0) / R)), j0 = Math.max(0, Math.floor((bz0 - Z0) / R)), j1 = Math.min(nz - 1, Math.ceil((bz1 - Z0) / R));
    let area = 0; for (let i = 0; i < p.poly.length; i++) { const [ax, az] = p.poly[i], [cx, cz] = p.poly[(i + 1) % p.poly.length]; area += ax * cz - cx * az; } area = Math.abs(area) / 2;
    const h = p.y1 - p.y0, base = p.tag.includes('base');
    const kind = p.rail ? 'wall' : p.roof ? (p.y0 > 3.1 ? null : area < 40 ? 'obj' : 'wall') : p.y1 > 20 ? null : p.k !== 'r' && area < 40 && h >= 0.9 && !base && !TIERS.has(p.tag) ? 'obj' : 'floor';
    if (!kind) continue;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = X0 + (i + 0.5) * R, z = Z0 + (j + 0.5) * R;
      if (!inPoly(p.poly, x, z)) continue;
      const k = j * nx + i;
      if (kind === 'wall') wall[k] = 1; else if (kind === 'obj') obj[k] = 1;
      else { const [t] = topAt(p, x, z); if (t > floor[k]) floor[k] = t; }
    }
  }
  const F = (x, z) => { const i = Math.floor((x - X0) / R), j = Math.floor((z - Z0) / R); if (i < 0 || j < 0 || i >= nx || j >= nz) return NaN; const k = j * nx + i; return floor[k] > -1 && !wall[k] && !obj[k] ? floor[k] : NaN; };
  const rows = [], STEP = 0.1, L = 2 * Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2, NS = Math.floor(L / STEP);
  const lines = [new Float32Array(NS), new Float32Array(NS), new Float32Array(NS), new Float32Array(NS), new Float32Array(NS)];
  for (const ang of [0, 90, 45, 135]) {
    const a = (ang * Math.PI) / 180, ux = Math.sin(a), uz = Math.cos(a), vx = Math.cos(a), vz = -Math.sin(a);
    for (let t = -L / 2; t < L / 2; t += 0.25) {
      let any = 0;
      for (let li = 0; li < 5; li++) { const d = t + (li - 2) * 0.5, A = lines[li]; for (let s = 0; s < NS; s++) { const S = -L / 2 + s * STEP; A[s] = F(ux * S + vx * d, uz * S + vz * d); } }
      const ok = (s) => { let lo = Infinity, hi = -Infinity; for (let li = 0; li < 5; li++) { const v = lines[li][s]; if (v !== v) return false; if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo < 0.15; };
      for (let s = 0; s < NS; s++) if (ok(s)) any++;
      if (any * STEP <= lim) continue;
      let k0 = 0;
      while (k0 < NS) {
        if (!ok(k0)) { k0++; continue; }
        let k1 = k0 + 1;
        const c0 = lines[2][k0];
        while (k1 < NS && ok(k1) && Math.abs(lines[2][k1] - c0) < 0.15) { let step = true; for (let li = 0; li < 5; li++) if (Math.abs(lines[li][k1] - lines[li][k1 - 1]) >= 0.15) { step = false; break; } if (!step) break; k1++; }
        const run = (k1 - k0) * STEP;
        if (run > lim) {
          const S0 = -L / 2 + k0 * STEP, S1 = -L / 2 + (k1 - 1) * STEP, cx = ux * (S0 + S1) / 2 + vx * t, cz = uz * (S0 + S1) / 2 + vz * t;
          rows.push({ run: +run.toFixed(1), ang, tier: +c0.toFixed(2), from: [+(ux * S0 + vx * t).toFixed(1), +(uz * S0 + vz * t).toFixed(1)], to: [+(ux * S1 + vx * t).toFixed(1), +(uz * S1 + vz * t).toFixed(1)], key: `${Math.round(cx / 6)},${Math.round(cz / 6)},${ang}` });
        }
        k0 = k1;
      }
    }
  }
  rows.sort((a, b) => b.run - a.run);
  const seen = new Set();
  return rows.filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
}

// ------------------------------------------------------------------------------------------------ the registry hooks
const filterMode = (src, mode) => ({ single: src.single.filter((d) => inMode(d, mode)), half: src.half.filter((d) => inMode(d, mode)) });
registerStageData('eras', {
  // the thumbnail: era 1 as usual; a piece that only exists later is left to `thumb` (dashed, the layout's colours)
  thumbBlock(d) { return d.eras && !hasEra(eraMask(d.eras), 1) ? 'skip' : null; },
  thumb(layout, api) {
    const C = layout.eras?.colors || {}, out = [];
    for (const p of eraPieces(layout)) {
      if (hasEra(p.mask, 1) || p.hidden) continue;
      const pts = p.poly.map(([x, z]) => `${api.X(z).toFixed(1)},${api.Y(x).toFixed(1)}`).join(' ');
      out.push(`<polygon points="${pts}" fill="${C.appear || '#f4e9c8'}" fill-opacity=".45" stroke="${C.vanish || '#a9a49a'}" stroke-width="1.3" stroke-dasharray="3 2"/>`);
    }
    return out.join('');
  },
  // check-maps: two pieces with no era in common never stand together (they may overlap)
  overlapOk(a, b) { return (eraMask(a.eras) & eraMask(b.eras)) === 0; },
  check(layout, api) {
    const out = [], E = layout.eras;
    const pieces = eraPieces(layout);
    const counts = [1, 2, 3].map((e) => pieces.filter((p) => hasEra(p.mask, e)).length);
    // each era's build: its own ramps (rule 24) are the union's; the pieces present
    const gc = groupCheck(pieces);
    out.push(...gc.problems);
    out.push(...appearCheck(pieces), ...vanishCheck(pieces));
    // the other mode variants of the same stage (rules 19–22 and 27 hold in every mode's build)
    if (api.mode === 'turf' && E?.source) {
      for (const m of ['tower', 'bazookarp', 'boss', 'zones']) {
        const v = eraPieces({ ...layout, ...filterMode(E.source, m) });
        for (const s of [...appearCheck(v), ...vanishCheck(v)]) out.push(`[${m}] ${s}`);
      }
    }
    const strips = [];
    for (const e of [1, 2, 3]) {
      const S = stripCheck(pieces, e, layout.bounds);
      strips.push(S.length);
      // a mode variant's own lanes: reported, not failed (ENGINE T2)
      if (api.mode === 'turf') for (const r of S.slice(0, 5)) out.push(`#${e} a 2 m strip of ${r.run} m (dir ${r.ang}°, tier ${r.tier}) from (${r.from}) to (${r.to}) with no free-standing cover (DESIGN §6.1 #2: ≤ 25)`);
      else if (S.length) console.log(`   (#${e}: ${S.length} strip(s) over 25 m in the ${api.mode} build, longest ${S[0].run} m: reported, not failed)`);
    }
    for (const e of [1, 2, 3]) console.log(`${(api.id + '#' + e).padEnd(12)} ${counts[e - 1]} pieces  (strips over 25 m: ${strips[e - 1]})`);
    console.log(`   eras: ${gc.info.groups} groups; jump 1→2 ${gc.info.jump12.groups.join(' / ')} groups per half, ${gc.info.jump12.blocks} blocks; jump 2→3 ${gc.info.jump23.groups.join(' / ')}, ${gc.info.jump23.blocks}; era-only ${(gc.info.eraShare * 100).toFixed(1)} %`);
    return out;
  },
});
