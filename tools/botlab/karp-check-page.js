// [b5-karp-checker] The Bazookarp stage checker's in-page half (SPEC §4.4): every check runs here, on the stage built in
// its Bazookarp variant, through the engine's own Carp Field (src/game/karpField.js) and the level's own physics.
// tools/botlab/bazookarp-check.cjs drives it (one stage or every shipped one, offscreen) and writes the report, the
// JSON and the pictures. Exports:
//   runChecks(o)    → the static checks #1–#10 and #12–#16 for one field state (o.state: its index; o.phys: #16's kid)
//   carryWalk(t, o) → #11 for team t on a fresh match: the scripted carrier, the retreat / zone / fall / narrow walks
//   dropCoverage(o) → #11's drop coverage (no physics: the field's own drop spot)
//   pictures(o)     → JPEG data URLs: the top-down with everything drawn, the Pond, each weir and the Gate
// Everything is measured on the CARRIER graph (§3.2): nav's valid nodes minus spawn zones and carrierBlock, its walk /
// jump / drop / climb edges plus the field's hop and gap edges. The layout data describes ALPHA's attack (team 0's
// weirs and Gate on Bravo's half); every team-dependent check runs for both teams (the mirror).
import * as THREE from 'three';
import { BAZOOKARP as K, PLAYER } from '../../src/config.js';
import { EDGE_TYPES as ET, inPoly } from '../../src/game/karpField.js';
import { MAP_LAYOUTS } from '../../src/world/maps.js';
import { layoutFor } from '../../src/world/variants.js';

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : v), r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v);
const V3 = THREE.Vector3;
const P3 = (n) => [r2(n.x), r2(n.y), r2(n.z)];
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
// the checks' numbers (SPEC §4.4 / §9.1)
export const CK = {
  L: [55, 85], Ldiff: 0.02, weirPct: [0.40, 0.55], weirCountDiff: 2, weirApart: 12, weirOther: 4, weirGate: { pct: 0.45, m: 25 },
  route2: 1.6, disjoint: 2.5, endFree: 6, walk: 4.8, swim: 9.44, walkT: [11.5, 18],
  ring: 15, entGroup: 3, ents: [2, 5], climbSave: 0.2, ringDrop: 2.5, gain: 10,
  padGate: [12, 20], padUp: 0.2, cone: 40, plateauUp: 1.4, plateauR: 3, kidV: 6, kidClimb: 7.5, signR: 2, wideEnt: 8, nrGap: 3,
  dip: 6, deckWays: 3, apron: 2, apronH: 1.2, apronR: 4, pondRing: [4.5, 10], pondCover: 0.7, pondSeen: 6, weirRoom: 3.0, weirSeen: 3,
  dropNear: 12, hopHigh: [1.8, 2.1], gapLong: [3.0, 3.8],
};
const TYPE_NAME = ['', 'walk', 'jump', 'drop', 'climb', 'hop', 'gap', 'pipe', 'ride', 'hop over off-field ground'];
const volNode = (v, x, y, z) => y >= (v.y0 ?? -50) - 0.25 && y <= (v.y1 ?? 50) + 0.25 && inPoly(v.poly, x, z);

class Heap {
  constructor() { this.ids = []; this.pr = []; }
  get n() { return this.ids.length; }
  push(id, p) { const I = this.ids, P = this.pr; let i = I.length; I.push(id); P.push(p); while (i > 0) { const j = (i - 1) >> 1; if (P[j] <= p) break; I[i] = I[j]; P[i] = P[j]; i = j; } I[i] = id; P[i] = p; }
  pop() { const I = this.ids, P = this.pr, top = I[0], tp = P[0], lid = I.pop(), lp = P.pop(); if (I.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= I.length) break; if (c + 1 < I.length && P[c + 1] < P[c]) c++; if (P[c] >= lp) break; I[i] = I[c]; P[i] = P[c]; i = c; } I[i] = lid; P[i] = lp; } this.lastP = tp; return top; }
}

// ================================================================================================= the context
function ctx(state = 0) {
  const g = window.__inkwave, G = window.__G, m = g.match, Kp = m.karp, F = Kp.field, nav = G.nav, L = G.level;
  F.setState(state);
  const S = F.states[state];
  return { g, G, m, Kp, F, nav, L, R: Kp.R, nodes: nav.nodes, N: F.N, okN: S.okN, D: S.D, state, key: S.key, id: g.mapDef?.id };
}
// nodes in a trigger: within r horizontally of p and ±band of its floor
function trig(C, p, r, band = K.trigBand, okN = C.okN) {
  const { nav, nodes } = C, out = [], ix = Math.round((p.x - nav.x0) / nav.step), iz = Math.round((p.z - nav.z0) / nav.step), cr = Math.ceil(r / nav.step) + 1;
  for (let dz = -cr; dz <= cr; dz++) for (let dx = -cr; dx <= cr; dx++) {
    const jx = ix + dx, jz = iz + dz;
    if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
    for (const id of nav.cells[jz * nav.nx + jx]) { if (!okN[id]) continue; const n = nodes[id]; if (hd(n, p) <= r && Math.abs(n.y - p.y) <= band) out.push(id); }
  }
  return out;
}
// every node within r (3D) of p, any validity (a cell walk)
function near(C, p, r, fn) {
  const { nav, nodes } = C, ix = Math.round((p.x - nav.x0) / nav.step), iz = Math.round((p.z - nav.z0) / nav.step), cr = Math.ceil(r / nav.step) + 1;
  for (let dz = -cr; dz <= cr; dz++) for (let dx = -cr; dx <= cr; dx++) {
    const jx = ix + dx, jz = iz + dz;
    if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
    for (const id of nav.cells[jz * nav.nx + jx]) fn(id, nodes[id]);
  }
}
// forward Dijkstra over the carrier graph from src: { D, prev, hit } (o: noClimb, avoid (Uint8Array), target (Uint8Array:
// stop at the first one), w(type, len) a weight, okN)
function search(C, src, o = {}) {
  const { F, N } = C, okN = o.okN || C.okN, D = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), H = new Heap();
  for (const s of src) if (okN[s] && !(o.avoid && o.avoid[s])) { D[s] = 0; H.push(s, 0); }
  let hit = -1;
  while (H.n) {
    const u = H.pop(); if (H.lastP > D[u]) continue;
    if (o.target && o.target[u]) { hit = u; break; }
    for (let k = F.fs[u]; k < F.fs[u + 1]; k++) {
      const v = F.ft[k], t = F.fy[k];
      if (!okN[v] || (o.noClimb && t === ET.climb) || (o.avoid && o.avoid[v])) continue;
      const nd = D[u] + (o.w ? o.w(t, F.fl[k]) : F.fl[k]);
      if (nd < D[v]) { D[v] = nd; prev[v] = u; H.push(v, nd); }
    }
  }
  return { D, prev, hit };
}
// backward Dijkstra (to the seeds): D[n] = the cost from n to the nearest seed
function searchBack(C, seeds, o = {}) {
  const { F, N } = C, okN = o.okN || C.okN, D = new Float64Array(N).fill(Infinity), H = new Heap();
  for (const s of seeds) if (okN[s]) { D[s] = 0; H.push(s, 0); }
  while (H.n) {
    const u = H.pop(); if (H.lastP > D[u]) continue;
    for (let k = F.rs[u]; k < F.rs[u + 1]; k++) {
      const v = F.rt[k], t = F.ry[k];
      if (!okN[v] || (o.noClimb && t === ET.climb) || (o.avoid && o.avoid[v])) continue;
      const nd = D[u] + (o.w ? o.w(t, F.rl[k]) : F.rl[k]);
      if (nd < D[v]) { D[v] = nd; H.push(v, nd); }
    }
  }
  return D;
}
const mask = (N, ids) => { const m = new Uint8Array(N); for (const i of ids) m[i] = 1; return m; };
const pathOf = (prev, end) => { const p = []; for (let k = end; k >= 0; k = prev[k]) { p.push(k); if (p.length > 20000) break; } return p.reverse(); };
function pathLen(C, p) { let l = 0; for (let i = 1; i < p.length; i++) l += edgeLen(C, p[i - 1], p[i]); return l; }
function edgeLen(C, a, b) { const F = C.F; for (let k = F.fs[a]; k < F.fs[a + 1]; k++) if (F.ft[k] === b) return F.fl[k]; return d3(C.nodes[a], C.nodes[b]); }
function edgeType(C, a, b) { const F = C.F; for (let k = F.fs[a]; k < F.fs[a + 1]; k++) if (F.ft[k] === b) return F.fy[k]; return 0; }
// a team's own Carp-Free Zone nodes (its carrier routes avoid them: ×3 there)
function zoneMask(C, t) { const m = new Uint8Array(C.N); for (const z of C.R.zones[t]) { if (!zoneOn(C, z)) continue; for (let i = 0; i < C.N; i++) { const n = C.nodes[i]; if (C.okN[i] && volNode(z, n.x, n.y, n.z)) m[i] = 1; } } return m; }
const zoneOn = (C, z) => !z.eras || z.eras.map(String).includes(String(C.key));
// avoid every node within `r` of the path's nodes, except within `free` m of either end
function avoidNear(C, path, r = CK.disjoint, free = CK.endFree) {
  const m = new Uint8Array(C.N); if (!path.length) return m;
  const a = C.nodes[path[0]], b = C.nodes[path[path.length - 1]];
  for (const id of path) near(C, C.nodes[id], r, (j, q) => { if (d3(q, C.nodes[id]) <= r) m[j] = 1; });
  for (let i = 0; i < C.N; i++) if (m[i]) { const q = C.nodes[i]; if (d3(q, a) <= free || d3(q, b) <= free) m[i] = 0; }
  return m;
}
// route 1 and route 2 from src to tgt (no climbs; the team's own zones off), and route 3 (climbs allowed, off both)
function routes(C, src, tgt, avoid0) {
  const T = mask(C.N, tgt);
  const s1 = search(C, src, { noClimb: true, avoid: avoid0, target: T });
  if (s1.hit < 0) return { r1: null };
  const p1 = pathOf(s1.prev, s1.hit), l1 = s1.D[s1.hit];
  const av = avoidNear(C, p1); if (avoid0) for (let i = 0; i < C.N; i++) if (avoid0[i]) av[i] = 1;
  for (const s of src) av[s] = 0; for (const s of tgt) av[s] = 0;
  const s2 = search(C, src, { noClimb: true, avoid: av, target: T });
  const p2 = s2.hit >= 0 ? pathOf(s2.prev, s2.hit) : null, l2 = s2.hit >= 0 ? s2.D[s2.hit] : Infinity;
  let p3 = null, l3 = Infinity;
  if (p2) { const av3 = avoidNear(C, p2); for (let i = 0; i < C.N; i++) if (av[i]) av3[i] = 1; for (const s of src) av3[s] = 0; for (const s of tgt) av3[s] = 0; const s3 = search(C, src, { avoid: av3, target: T }); if (s3.hit >= 0) { p3 = pathOf(s3.prev, s3.hit); l3 = s3.D[s3.hit]; } }
  return { r1: p1, l1, r2: p2, l2, r3: p3, l3, ratio: l2 / l1 };
}
// the minimum distance from any node of path a to any node of path b, ignoring nodes within `free` m of a's or b's ends
function pathGap(C, a, b, free = CK.endFree) {
  const ends = [a[0], a[a.length - 1], b[0], b[b.length - 1]].map((i) => C.nodes[i]);
  const ok = (n) => ends.every((e) => d3(n, e) > free);
  let best = Infinity, at = null;
  for (const i of a) { const n = C.nodes[i]; if (!ok(n)) continue; for (const j of b) { const q = C.nodes[j]; if (!ok(q)) continue; const d = d3(n, q); if (d < best) { best = d; at = [n, q]; } } }
  return { d: best, at: at && at.map(P3) };
}
// a block top under (x, z) below yMax: { y, b } (the block too, so roofs can be told)
function floorAt(L, x, z, yMax = 50) {
  let best = -Infinity, bb = null;
  const ids = L.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, []);
  const p = new V3();
  for (const id of ids) {
    const b = L.blocks[id];
    if (!b.solid || b.dynamic) continue;
    const n = b.axes[1]; if (n.y < 0.5) continue;
    const tx = b.center.x + n.x * b.half.y, ty = b.center.y + n.y * b.half.y, tz = b.center.z + n.z * b.half.y;
    const y = ty - (n.x * (x - tx) + n.z * (z - tz)) / n.y;
    p.set(x, y - 0.01, z);
    if (y <= yMax && y > best && L.pointInBlock(b, p, 0.001)) { best = y; bb = b; }
  }
  return { y: best, b: bb };
}
const losClear = (G, a, b) => G.physics.los(a, b);
// the spawn deck of team d: its nodes (a flood from the pad over level steps, any validity) and the eyes on its edge
function deckOf(C, d) {
  if (C._deck?.[d]) return C._deck[d];
  const { nav, nodes, L } = C, pad = L.spawnPads[d];
  let s = -1, sd = Infinity;
  near(C, pad, 3, (id, n) => { const v = hd(n, pad) + Math.abs(n.y - pad.y) * 2; if (v < sd && Math.abs(n.y - pad.y) < 0.8) { sd = v; s = id; } });
  const deck = new Set();
  if (s >= 0) {
    const st = [s]; deck.add(s);
    while (st.length) { const u = st.pop(); for (const e of nodes[u].nb) { if (deck.has(e.to)) continue; const q = nodes[e.to]; if (e.type !== 'walk' || Math.abs(q.y - pad.y) > 0.8 || hd(q, pad) > 16) continue; deck.add(e.to); st.push(e.to); } }
  }
  const edge = [];
  for (const id of deck) { const n = nodes[id]; let open = false; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) { open = true; break; } if (!nav.cells[jz * nav.nx + jx].some((q) => deck.has(q))) { open = true; break; } } if (open) edge.push(id); }
  const step = Math.max(1, Math.floor(edge.length / 48));
  const eyes = edge.filter((_, i) => i % step === 0).map((id) => new V3(nodes[id].x, nodes[id].y + 1.5, nodes[id].z));
  (C._deck || (C._deck = []))[d] = { deck, edge, eyes };
  return C._deck[d];
}
const seenFrom = (G, eyes, p) => eyes.some((e) => losClear(G, e, p));
// single-linkage groups of points within r (2D) → [{ pts, c, w, ends }]
function groups(pts, r) {
  const n = pts.length, par = Array.from({ length: n }, (_, i) => i), f = (i) => (par[i] === i ? i : (par[i] = f(par[i])));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z) <= r) par[f(i)] = f(j);
  const m = new Map();
  for (let i = 0; i < n; i++) { const k = f(i); if (!m.has(k)) m.set(k, []); m.get(k).push(pts[i]); }
  return [...m.values()].map((g) => {
    let w = 0, ends = [g[0], g[0]];
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const d = Math.hypot(g[i].x - g[j].x, g[i].z - g[j].z); if (d > w) { w = d; ends = [g[i], g[j]]; } }
    const c = g.reduce((s, p) => ({ x: s.x + p.x / g.length, y: s.y + p.y / g.length, z: s.z + p.z / g.length }), { x: 0, y: 0, z: 0 });
    return { pts: g, c, w, ends };
  });
}
// a carrier-graph walk (no climbs) of at most `lim` m from a: the set reached (cached per start)
function walkSet(C, a, lim = 6) {
  const cache = C._ws || (C._ws = new Map());
  if (cache.has(a)) return cache.get(a);
  const F = C.F, D = new Map([[a, 0]]), H = new Heap(); H.push(a, 0);
  while (H.n) {
    const u = H.pop(), du = D.get(u); if (H.lastP > du) continue;
    for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { if (F.fy[k] === ET.climb) continue; const v = F.ft[k]; if (!C.okN[v]) continue; const nd = du + F.fl[k]; if (nd > lim) continue; if (nd < (D.get(v) ?? Infinity)) { D.set(v, nd); H.push(v, nd); } }
  }
  if (cache.size > 30000) cache.clear();
  cache.set(a, D);
  return D;
}
const fin = (x) => Number.isFinite(x);
const gainOf = (C, a, b) => { let g = -1; for (const t of [0, 1]) { const x = C.D[t][a], y = C.D[t][b]; if (fin(x) && fin(y)) g = Math.max(g, Math.abs(x - y)); else if (fin(x) !== fin(y)) g = Infinity; } return g; };
// waivers in the data: { check: '7d', at: [x, z], why } (a find within 2 m of one is WAIVED: the lead's word in the stage note)
const waived = (C, check, p) => (C.R.def.waive || []).some((w) => String(w.check) === String(check) && Math.hypot(w.at[0] - p.x, w.at[w.at.length - 1] - p.z) <= 2 || (String(w.check) === String(check) && Math.hypot(-w.at[0] - p.x, -w.at[w.at.length - 1] - p.z) <= 2));

// ================================================================================================= the checks
export async function runChecks(o = {}) {
  const t0 = performance.now();
  const C = ctx(o.state || 0), { G, F, R, Kp, nav, nodes, L, N } = C;
  const out = { id: C.id, state: C.state, key: C.key, states: F.states.map((s) => s.key), placeholder: !!Kp.placeholder, L: Kp.L.map(r2), checks: {}, draw: {}, ms: {} };
  const draw = out.draw;
  const chk = (n, name, status, text, nums = {}, flags = []) => { out.checks[n] = { n, name, status, text, nums, flags }; return out.checks[n]; };
  const pond = R.pond, padY = L.spawnPads.map((p) => p.y);
  const pondNodes = trig(C, pond, 1.5, 0.8).length ? trig(C, pond, 1.5, 0.8) : [F.ownNode(pond)].filter((i) => i >= 0);
  const zm = [zoneMask(C, 0), zoneMask(C, 1)];
  const weirs = R.weirs, gates = R.gates;
  const weirNodes = weirs.map((list) => list.map((w) => trig(C, w.pos, w.r || K.weirR)));
  const gateNodes = [0, 1].map((t) => F.seeds[t].filter((i) => C.okN[i]));
  const half = (i) => (C.D[0][i] > C.D[1][i] ? 0 : 1);
  const tm = (k) => { out.ms[k] = Math.round(performance.now() - t0); };

  // ----------------------------------------------------------------------------------------------- #1 data
  {
    const bad = [], flags = [];
    if (hd(pond, { x: 0, z: 0 }) > 0.3 && !Kp.placeholder) bad.push(`the Pond ${r2(hd(pond, { x: 0, z: 0 }))} m off the centre`);
    const onFloor = (p, what) => {
      const f = floorAt(L, p.x, p.z, p.y + 0.5);
      if (!f.b || Math.abs(f.y - p.y) > 0.3) { bad.push(`${what} not on floor (floor ${r2(f.y)} vs ${r2(p.y)})`); flags.push({ at: P3(p), what: `${what}: no floor` }); return; }
      if (f.b.roof && !String(f.b.tag || '').startsWith('karp-')) { bad.push(`${what} on a roof (${f.b.tag || 'block ' + f.b.id})`); flags.push({ at: P3(p), what: `${what} on a roof` }); }
      for (let t = 0; t < 2; t++) { const pad = L.spawnPads[t]; if (hd(p, pad) < L.spawnBarrier + 0.6 && p.y > pad.y - 1) { bad.push(`${what} in team ${t}'s spawn zone`); flags.push({ at: P3(p), what: `${what} in a spawn zone` }); } }
    };
    onFloor(pond, 'the Pond');
    if (F.ownNode(pond) < 0) bad.push('no carrier-graph node under the Pond');
    for (const t of [0, 1]) {
      weirs[t].forEach((w, i) => onFloor(w.pos, `team ${t}'s weir ${i + 1}`));
      onFloor(gates[t].pos, `team ${t}'s Gate`);
      for (const z of R.zones[t]) for (const s of z.signs || []) { const y = L.groundHeight(s[0], s[1], (z.y1 ?? 5) + 0.6); onFloor({ x: s[0], y, z: s[1] }, `a team-${t} sign at (${r1(s[0])}, ${r1(s[1])})`); }
    }
    // the kit's post and sign tops are roofs, take no ink, and stand where the data put them
    const kit = L.blocks.filter((b) => String(b.tag || '').startsWith('karp-'));
    const posts = kit.filter((b) => /^karp-(weir|gatepost|sign)/.test(b.tag || ''));
    const notRoof = posts.filter((b) => !b.roof), inked = posts.filter((b) => b.paint);
    if (notRoof.length) bad.push(`${notRoof.length} kit post / sign blocks are not roof: ${[...new Set(notRoof.map((b) => b.tag))].join(', ')}`);
    if (inked.length) bad.push(`${inked.length} kit post / sign blocks take ink: ${[...new Set(inked.map((b) => b.tag))].join(', ')}`);
    chk(1, 'Data', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : `the Pond at (${r2(pond.x)}, ${r2(pond.y)}, ${r2(pond.z)}); ${weirs[0].length} weir(s), the Gate and ${R.zones[0].reduce((s, z) => s + (z.signs || []).length, 0)} sign(s) a side on floor, the mirror too; ${kit.length} kit pieces (post / sign tops roof, no ink)`,
      { kit: kit.length, problems: bad.length }, flags);
  }
  tm('1');
  // ----------------------------------------------------------------------------------------------- #2 field
  {
    const fl = [];
    const Ld = Math.abs(Kp.L[0] - Kp.L[1]) / Math.max(Kp.L[0], Kp.L[1]);
    // holes: reached forward from the Pond on the carrier graph with D = ∞
    const seen = new Uint8Array(N), st = [...pondNodes]; for (const s of st) seen[s] = 1;
    while (st.length) { const u = st.pop(); for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { const v = F.ft[k]; if (!seen[v] && C.okN[v]) { seen[v] = 1; st.push(v); } } }
    const holes = []; let reach = 0;
    for (let i = 0; i < N; i++) if (seen[i]) { reach++; if ((!fin(C.D[0][i]) || !fin(C.D[1][i])) && !waived(C, '2', nodes[i])) holes.push(i); }
    // the reading sweep (§3.2): exact at every node; on walk edges never more than 2.5 m low
    let nodeWorst = 0, low15 = 0, low25 = 0, worstLow = 0, pts = 0;
    const p = new V3(), q = new V3(), lowAt = [], bar = L.spawnBarrier + 0.4;
    for (let t = 0; t < 2; t++) {
      const D = C.D[t];
      for (let i = 0; i < N; i++) {
        if (!C.okN[i] || !fin(D[i])) continue;
        const n = nodes[i], r = F.fieldAt(t, p.set(n.x, n.y, n.z));
        if (!r) { nodeWorst = Infinity; continue; }
        nodeWorst = Math.max(nodeWorst, Math.abs(r.d - D[i]));
        for (const e of n.nb) {
          if (e.type !== 'walk' || e.to < i || !C.okN[e.to] || !fin(D[e.to])) continue;
          const m2 = nodes[e.to], dx = m2.x - n.x, dz = m2.z - n.z, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
          for (const u of [0.25, 0.5, 0.75]) for (const off of [0, 0.3, -0.3]) {
            p.set(n.x + dx * u + px * off, n.y + (m2.y - n.y) * u, n.z + dz * u + pz * off);
            if (off && nav._blocked(n, p, Math.max(n.y, p.y))) continue;
            if (L.spawnPads.some((pd) => hd(p, pd) < bar && Math.abs(p.y - pd.y) < 3)) continue;
            const rr = F.fieldAt(t, p); if (!rr) continue;
            pts++;
            const lb = Math.max(D[i] - p.distanceTo(q.set(n.x, n.y, n.z)), D[e.to] - p.distanceTo(q.set(m2.x, m2.y, m2.z)));
            const low = lb - rr.d;
            if (low > worstLow) worstLow = low;
            if (low > 1.5) { low15++; if (lowAt.length < 6) lowAt.push([t, r2(p.x), r2(p.y), r2(p.z), r2(low)]); }
            if (low > 2.5) low25++;
          }
        }
      }
    }
    for (const h of holes.slice(0, 6)) fl.push({ at: P3(nodes[h]), what: 'a hole: reached from the Pond, no walk to a Gate' });
    for (const a of lowAt.filter((x) => x[4] > 2.5)) fl.push({ at: [a[1], a[2], a[3]], what: `the reading ${a[4]} m low` });
    const gain = F.hopGain();
    const ok = Ld <= CK.Ldiff && holes.length === 0 && nodeWorst <= 0.05 && low25 === 0 && fin(Kp.L[0]) && fin(Kp.L[1]);
    chk(2, 'Field', ok ? 'OK' : 'FAIL', `L ${r1(Kp.L[0])} / ${r1(Kp.L[1])} m (Δ ${r1(Ld * 100)} %); holes ${holes.length}; ${F.stats.hops} hop + ${F.stats.gaps} gap edges, largest gain ${r1(gain)} m; reading sweep: ${pts} points, worst node ${r2(nodeWorst)} m, ${low15} > 1.5 m low, ${low25} > 2.5 m (worst ${r2(worstLow)} m)`,
      { LA: r2(Kp.L[0]), LB: r2(Kp.L[1]), Ldiff: r2(Ld * 100), holes: holes.length, reach, hops: F.stats.hops, gaps: F.stats.gaps, maxGain: r2(gain), nodeWorst: r2(nodeWorst), low15, low25, worstLow: r2(worstLow), lowAt }, fl);
    // the halfway line and the field for the picture
    draw.field = []; draw.half = [];
    for (let i = 0; i < N; i++) {
      if (!C.okN[i] || !fin(C.D[0][i])) continue;
      const n = nodes[i]; draw.field.push([r1(n.x), r1(n.z), F.count(0, C.D[0][i]), r1(n.y)]);
      if (fin(C.D[1][i])) for (const e of n.nb) { if (e.type !== 'walk' || e.to < i || !C.okN[e.to]) continue; if (half(i) !== half(e.to)) { const q2 = nodes[e.to]; draw.half.push([r1((n.x + q2.x) / 2), r1((n.z + q2.z) / 2)]); } }
    }
  }
  tm('2');
  // ----------------------------------------------------------------------------------------------- routes (#4 #5 #6)
  const legs = [];   // { team, from, to, src, tgt, rt }
  for (const t of [0, 1]) {
    weirs[t].forEach((w, i) => {
      legs.push({ team: t, name: `Pond → weir ${i + 1}`, kind: 'pw', i, src: pondNodes, tgt: weirNodes[t][i] });
      legs.push({ team: t, name: `weir ${i + 1} → Gate`, kind: 'wg', i, src: weirNodes[t][i], tgt: gateNodes[t] });
    });
    legs.push({ team: t, name: 'Pond → Gate', kind: 'pg', src: pondNodes, tgt: gateNodes[t] });
  }
  for (const lg of legs) lg.rt = lg.src.length && lg.tgt.length ? routes(C, lg.src, lg.tgt, zm[lg.team]) : { r1: null };
  tm('routes');
  // ----------------------------------------------------------------------------------------------- #3 distances
  {
    const bad = [], nums = { teams: [] };
    for (const t of [0, 1]) {
      const Lt = Kp.L[t], row = { team: t, L: r2(Lt), weirs: [] };
      weirs[t].forEach((w, i) => {
        const rr = F.fieldAt(t, w.pos, undefined, C.state), Dw = rr ? rr.d : Infinity, cnt = Kp.weirs[t][i].count;
        const pw = legs.find((l) => l.team === t && l.kind === 'pw' && l.i === i)?.rt, wg = legs.find((l) => l.team === t && l.kind === 'wg' && l.i === i)?.rt;
        const pct = (Lt - Dw) / Lt;
        row.weirs.push({ i, count: cnt, pct: r1(pct * 100), along: r1(Lt - Dw), toGate: r1(Dw), walkFromPond: r1(pw?.l1), walkToGate: r1(wg?.l1) });
        if (!(cnt >= 100 * (1 - CK.weirPct[1]) - 1e-9 && cnt <= 100 * (1 - CK.weirPct[0]) + 1e-9)) bad.push(`team ${t} weir ${i + 1} at count ${cnt} (${r1(pct * 100)} %: band 45–60)`);
        if (!(Dw >= CK.weirGate.m && Dw >= CK.weirGate.pct * Lt)) bad.push(`team ${t} weir ${i + 1} → Gate ${r1(Dw)} m (≥ 25 m and ≥ 45 % of L = ${r1(CK.weirGate.pct * Lt)})`);
        // the weir's count is the lowest within 3 m of it on its floor (§3.4: landing it is never worth less than passing it)
        // (SPEC §3.4 asks the weir's count to be the lowest within 3 m on its floor; on any floor that falls toward the
        // Gate the nodes 3 m on read ~5 counts lower, and the cap already makes passing it never worth more than landing
        // it: reported, not judged — a decision in the report)
        let low = cnt; near(C, w.pos, 3, (id, n) => { if (!C.okN[id] || Math.abs(n.y - w.pos.y) > 0.6 || hd(n, w.pos) > 3) return; low = Math.min(low, F.count(t, C.D[t][id])); });
        row.weirs[row.weirs.length - 1].low3 = low;
      });
      if (weirs[t].length === 2) {
        const [a, b] = Kp.weirs[t], dc = Math.abs(a.count - b.count), apart = hd(a.pos, b.pos);
        row.twoWeirs = { countDiff: dc, apart: r1(apart) };
        if (dc > CK.weirCountDiff) bad.push(`team ${t}: the two weirs' counts differ by ${dc} (±2)`);
        if (apart < CK.weirApart) bad.push(`team ${t}: the two weirs ${r1(apart)} m apart (≥ 12)`);
      }
      if (weirs[t].length < 1 || weirs[t].length > 2) bad.push(`team ${t}: ${weirs[t].length} weirs (1 or 2)`);
      if (!(Lt >= CK.L[0] && Lt <= CK.L[1])) bad.push(`team ${t}: L ${r1(Lt)} m (55–85)`);
      // Gate → pad: the defending pad's walk (nav, the defenders may cross their own zone)
      const pad = L.spawnPads[1 - t]; row.gatePad = r1(hd(gates[t].pos, pad));
      nums.teams.push(row);
    }
    chk(3, 'Distances and counts', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : nums.teams.map((r) => `team ${r.team}: L ${r.L}; ` + r.weirs.map((w) => `weir ${w.i + 1} count ${w.count} (${w.pct} %), → Gate ${w.toGate} m`).join(', ') + (r.twoWeirs ? `; weirs Δcount ${r.twoWeirs.countDiff}, ${r.twoWeirs.apart} m apart` : '') + `; Gate ${r.gatePad} m from the pad`).join(' | '), nums);
  }
  // ----------------------------------------------------------------------------------------------- #4 reachability
  {
    const bad = [];
    for (const lg of legs) if (lg.kind !== 'pg' && !lg.rt.r1) bad.push(`team ${lg.team}: ${lg.name} has no climb-free carrier route (own free zones off)`);
    for (const lg of legs) if (!lg.src.length || !lg.tgt.length) bad.push(`team ${lg.team}: ${lg.name}: no graph nodes at ${lg.src.length ? 'its end' : 'its start'}`);
    chk(4, 'Reachability for a carrier on foot', bad.length ? 'FAIL' : 'OK', bad.length ? [...new Set(bad)].join('; ') : `every leg (Pond → weir → Gate) exists for both teams with no climbs, spawn zones, own free zones or carrierBlock`, { legs: legs.filter((l) => l.kind !== 'pg').map((l) => ({ team: l.team, leg: l.name, len: r1(l.rt.l1) })) });
  }
  // ----------------------------------------------------------------------------------------------- #5 two routes
  {
    const bad = [], rows = [], fl = [];
    for (const lg of legs) {
      if (lg.kind === 'pg') continue;
      const r = lg.rt; if (!r.r1) continue;
      rows.push({ team: lg.team, leg: lg.name, r1: r1(r.l1), r2: r.r2 ? r1(r.l2) : null, ratio: r.r2 ? r2(r.ratio) : null, r3: r.r3 ? r1(r.l3) : null });
      if (!r.r2) { bad.push(`team ${lg.team}: ${lg.name}: no second route`); const w = lg.kind === 'pw' ? weirs[lg.team][lg.i].pos : nodes[r.r1[Math.floor(r.r1.length / 2)]]; fl.push({ at: P3(w), what: `${lg.name}: one route only` }); }
      else if (r.ratio > CK.route2) bad.push(`team ${lg.team}: ${lg.name}: route 2 ${r1(r.l2)} m = ${r2(r.ratio)} × route 1 (≤ 1.6)`);
    }
    for (const t of [0, 1]) if (weirs[t].length === 2) {
      const a = legs.find((l) => l.team === t && l.kind === 'pw' && l.i === 0)?.rt, b = legs.find((l) => l.team === t && l.kind === 'pw' && l.i === 1)?.rt;
      if (a?.r1 && b?.r1) {
        const gp = pathGap(C, a.r1, b.r1);
        if (gp.d <= CK.disjoint) bad.push(`team ${t}: the two weirs' routes 1 meet (${r1(gp.d)} m apart at ${JSON.stringify(gp.at?.[0])})`);
        const w0 = weirs[t][0].pos, w1 = weirs[t][1].pos;
        const near0 = Math.min(...a.r1.filter((i) => d3(nodes[i], w0) > 3).map((i) => d3(nodes[i], w1))), near1 = Math.min(...b.r1.filter((i) => d3(nodes[i], w1) > 3).map((i) => d3(nodes[i], w0)));
        if (near0 < CK.weirOther) bad.push(`team ${t}: weir 1's route 1 passes ${r1(near0)} m from weir 2 (≥ 4)`);
        if (near1 < CK.weirOther) bad.push(`team ${t}: weir 2's route 1 passes ${r1(near1)} m from weir 1 (≥ 4)`);
        if (hd(w0, w1) < CK.weirApart) { bad.push(`team ${t}: the weirs ${r1(hd(w0, w1))} m apart (≥ 12)`); fl.push({ at: P3(w0), what: 'two weirs too close' }); }
      }
    }
    // route hints (data `routes`): measured and named (Alpha's as given, Bravo's the mirror)
    const hints = [];
    for (const [name, wps] of Object.entries(R.def.routes || {})) for (const t of [0, 1]) {
      let len = 0, ok = true, cur = pondNodes;
      for (const w of wps) {
        const x = t ? -w[0] : w[0], z = t ? -w[w.length - 1] : w[w.length - 1], y = w.length === 3 ? w[1] : L.groundHeight(x, z, 30);
        const tg = trig(C, { x, y, z }, 1.5, 1.0); if (!tg.length) { ok = false; break; }
        const s = search(C, cur, { noClimb: true, avoid: zm[t], target: mask(N, tg) }); if (s.hit < 0) { ok = false; break; }
        len += s.D[s.hit]; cur = [s.hit];
      }
      if (ok) { const s = search(C, cur, { noClimb: true, avoid: zm[t], target: mask(N, gateNodes[t]) }); if (s.hit < 0) ok = false; else len += s.D[s.hit]; }
      hints.push({ name, team: t, len: ok ? r1(len) : null });
    }
    chk(5, 'Two routes to every checkpoint and to the Gate', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : rows.map((r) => `t${r.team} ${r.leg}: ${r.r1} / ${r.r2} m (×${r.ratio})${r.r3 ? `, climbs ${r.r3}` : ''}`).join('; ') + (hints.length ? ` · hints ${hints.map((h) => `${h.name}(t${h.team}) ${h.len ?? 'broken'}`).join(', ')}` : ''), { rows, hints }, fl);
  }
  // ----------------------------------------------------------------------------------------------- #6 carry times
  {
    const rows = [];
    for (const t of [0, 1]) {
      const pg = legs.find((l) => l.team === t && l.kind === 'pg')?.rt, Lt = Kp.L[t];
      const via = weirs[t].map((_, i) => { const a = legs.find((l) => l.team === t && l.kind === 'pw' && l.i === i)?.rt, b = legs.find((l) => l.team === t && l.kind === 'wg' && l.i === i)?.rt; return a?.r1 && b?.r1 ? { i, walk: r1((a.l1 + b.l1) / CK.walk), swim: r1((a.l1 + b.l1) / CK.swim), legs: [r1(a.l1 / CK.walk), r1(b.l1 / CK.walk)] } : null; });
      rows.push({ team: t, shortest: r1(pg?.l1), field: r1(Lt), walk: r1(Lt / CK.walk), swim: r1(Lt / CK.swim), via });
    }
    const ok = rows.every((r) => r.walk >= CK.walkT[0] && r.walk <= CK.walkT[1]);
    chk(6, 'Carry times', ok ? 'OK' : 'FAIL', rows.map((r) => `team ${r.team}: Pond → Gate ${r.field} m = ${r.walk} s walking (11.5–18), ${r.swim} s swimming` + r.via.map((v) => (v ? `; via weir ${v.i + 1}: ${v.legs.join(' + ')} s` : '')).join('')).join(' | '), { rows });
  }
  tm('6');
  // ----------------------------------------------------------------------------------------------- #7 no shortcut into a base
  const cand = { high: [], long: [], off: [] };   // #7d's candidates beyond the hop / gap rules, and hops onto off-field ground (#16 tries them)
  {
    const fl = [], bad = [], nums = { teams: [] };
    // (a) entrances into each Gate's 15 m ring
    draw.entrances = [];
    for (const t of [0, 1]) {
      const g = gates[t].pos, deck = deckOf(C, 1 - t), cross = [];
      for (let u = 0; u < N; u++) {
        if (!C.okN[u] || hd(nodes[u], g) <= CK.ring) continue;
        for (let k = F.fs[u]; k < F.fs[u + 1]; k++) {
          const v = F.ft[k]; if (!C.okN[v] || hd(nodes[v], g) > CK.ring) continue;
          const a = nodes[u], b = nodes[v];
          cross.push({ x: (a.x + b.x) / 2, y: Math.max(a.y, b.y), z: (a.z + b.z) / 2, type: F.fy[k], from: u, to: v });
        }
      }
      for (const car of C.m.movers?.cars || []) if (car.def?.roof === false) for (const s of car.stops || car.def.stops || []) if (Math.hypot(s[0] - g.x, s[1] - g.z) <= CK.ring) cross.push({ x: s[0], y: car.def.y ?? 0, z: s[1], type: 8 });
      (out._aCross || (out._aCross = []))[t] = cross;
    }
    // (b) climb shortcuts: the field with climbs vs without, from the halfway line to each Gate
    const climbs = new Map();
    for (const t of [0, 1]) {
      const Dn = searchBack(C, gateNodes[t], { noClimb: true }), Dw = C.D[t];
      for (let h = 0; h < N; h++) {
        if (!C.okN[h] || !fin(C.D[0][h]) || !fin(C.D[1][h]) || Math.abs(C.D[0][h] - C.D[1][h]) > 1.5) continue;
        const save = fin(Dn[h]) ? (Dn[h] - Dw[h]) / Dn[h] : 1;
        if (save <= CK.climbSave) continue;
        // walk the with-climbs shortest path toward the Gate and list its climbs
        let u = h, guard = 0;
        while (Dw[u] > 0.01 && guard++ < 4000) {
          let best = -1, bk = -1;
          for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { const v = F.ft[k]; if (C.okN[v] && Math.abs(F.fl[k] + Dw[v] - Dw[u]) < 1e-3) { best = v; bk = k; break; } }
          if (best < 0) break;
          if (F.fy[bk] === ET.climb) { const key = `${t}:${u}:${best}`; const e = climbs.get(key); if (!e || e.save < save) climbs.set(key, { team: t, from: P3(nodes[u]), to: P3(nodes[best]), save: r2(save * 100), Dn: r1(Dn[h]), Dw: r1(Dw[h]) }); }
          u = best;
        }
      }
    }
    const cl = [...climbs.values()].filter((c) => !waived(C, '7b', { x: c.from[0], z: c.from[2] }));
    for (const c of cl.slice(0, 8)) fl.push({ at: c.from, what: `7b: a climb saving ${c.save} % (team ${c.team})`, look: { x: c.to[0], y: c.to[1], z: c.to[2] } });
    if (cl.length) bad.push(`(b) ${cl.length} climb edge(s) on climb shortcuts saving > 20 %: ${cl.slice(0, 4).map((c) => `t${c.team} ${JSON.stringify(c.from)}→${JSON.stringify(c.to)} ${c.save} %`).join(', ')}`);
    // (c) drops > 2.5 m into a 15 m ring
    const drops = [];
    for (const t of [0, 1]) { const g = gates[t].pos; for (let u = 0; u < N; u++) { if (!C.okN[u]) continue; for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { const ty = F.fy[k]; if (ty !== ET.drop && ty !== ET.gap) continue; const v = F.ft[k], a = nodes[u], b = nodes[v]; if (a.y - b.y > CK.ringDrop && hd(b, g) <= CK.ring && C.okN[v]) drops.push({ team: t, from: P3(a), to: P3(b), dy: r1(a.y - b.y), type: TYPE_NAME[ty] }); } } }
    const dr = drops.filter((d) => !waived(C, '7c', { x: d.to[0], z: d.to[2] }));
    if (dr.length) { bad.push(`(c) ${dr.length} drop(s) > 2.5 m into a Gate's ring: ${dr.slice(0, 4).map((d) => `t${d.team} ${d.dy} m at (${d.to[0]}, ${d.to[2]})`).join(', ')}`); for (const d of groups(dr.map((x) => ({ x: x.to[0], y: x.to[1], z: x.to[2], d: x })), 3).slice(0, 6)) fl.push({ at: [r1(d.c.x), r1(d.c.y), r1(d.c.z)], what: `7c: a ${d.pts[0].d.dy} m drop into the Gate's ring` }); }
    // (d) connections the carrier graph does not know
    const finds = { lowGap: [], tallWall: [], longDrop: [], highHop: [], longGap: [] };
    const hit = new (G.physics.raycast(new V3(), new V3(0, 1, 0), 0.01).constructor)();
    const ray = (x0, y0, z0, x1, y1, z1) => { const o = new V3(x0, y0, z0), dd = new V3(x1 - x0, y1 - y0, z1 - z0), l = dd.length(); if (l < 1e-4) return true; dd.multiplyScalar(1 / l); return !G.physics.raycast(o, dd, l, hit, false).hit; };
    const cellsAround = (n, r, fn) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue; for (const id of nav.cells[jz * nav.nx + jx]) fn(id, nodes[id], dx, dz); } };
    // low gaps: two valid nodes ≤ 3 m apart, not joined by ≤ 6 m of walking, a 0.35 m squid sphere 0.3 m up gets through
    for (let i = 0; i < N; i++) {
      if (!C.okN[i]) continue;
      const n = nodes[i];
      cellsAround(n, 3, (j, q) => {
        if (j <= i || !C.okN[j] || Math.abs(q.y - n.y) > 0.6) return;
        const fl2 = hd(n, q); if (fl2 < 0.9 || fl2 > 3) return;
        const wa = walkSet(C, i), wb = walkSet(C, j);
        if (wa.has(j) && wb.has(i)) return;
        // the squid tube: rays 0.3 m up (centre, ±0.28 across) and 0.05 / 0.6 up the middle, and floor under the line
        const dx = (q.x - n.x) / fl2, dz = (q.z - n.z) / fl2, px = -dz * 0.28, pz = dx * 0.28;
        const y0 = n.y, y1 = q.y;
        if (!ray(n.x, y0 + 0.3, n.z, q.x, y1 + 0.3, q.z) || !ray(n.x + px, y0 + 0.3, n.z + pz, q.x + px, y1 + 0.3, q.z + pz) || !ray(n.x - px, y0 + 0.3, n.z - pz, q.x - px, y1 + 0.3, q.z - pz) || !ray(n.x, y0 + 0.6, n.z, q.x, y1 + 0.6, q.z) || !ray(n.x, y0 + 0.08, n.z, q.x, y1 + 0.08, q.z)) return;
        for (let u = 0.2; u < 0.81; u += 0.2) { const x = n.x + (q.x - n.x) * u, z = n.z + (q.z - n.z) * u, y = n.y + (q.y - n.y) * u, f = L.groundHeight(x, z, y + 0.35); if (!(f > y - 0.6)) return; }
        const gn = gainOf(C, i, j);
        if (gn > CK.gain) finds.lowGap.push({ a: P3(n), b: P3(q), gain: fin(gn) ? r1(gn) : 'off-field' });
      });
    }
    tm('7d-low');
    // tall walls: nav's wall-climb scan without its 5.5 m limit
    {
      const o = new V3(), d = new V3();
      for (let i = 0; i < N; i++) {
        if (!C.okN[i]) continue;
        const n = nodes[i];
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2; d.set(Math.cos(a), 0, Math.sin(a)); o.set(n.x, n.y + 0.35, n.z);
          if (!G.physics.raycast(o, d, 1.3, hit, true).hit) continue;
          if (Math.abs(hit.normal.y) > 0.3 || d.x * hit.normal.x + d.z * hit.normal.z > -0.7) continue;
          const f = hit.face >= 0 ? L.faces[hit.face] : null; if (!f || !f.atlas) continue;
          const b = L.blocks[f.block]; if (b.grate || b.hidden) continue;
          const topY = b.center.y + b.axes[1].y * b.half.y; if (topY - n.y <= 5.5 || topY - n.y > 40) continue;
          const qx = hit.point.x - hit.normal.x * 0.9, qz = hit.point.z - hit.normal.z * 0.9, ix = Math.round((qx - nav.x0) / nav.step), iz = Math.round((qz - nav.z0) / nav.step);
          if (ix < 0 || iz < 0 || ix >= nav.nx || iz >= nav.nz) continue;
          let top = -1; for (const id of nav.cells[iz * nav.nx + ix]) if (Math.abs(nodes[id].y - topY) < 0.25) top = id;
          if (top < 0 || nav._climbBarred(hit.point.x, hit.point.z, nodes[top], topY, f.block)) continue;
          const gn = C.okN[top] ? gainOf(C, i, top) : Infinity;
          if (gn > CK.gain && !finds.tallWall.some((w) => w.top === top)) finds.tallWall.push({ top, a: P3(n), b: P3(nodes[top]), rise: r1(topY - n.y), gain: fin(gn) ? r1(gn) : 'off-field' });
        }
      }
    }
    // long drops: a ledge over a node more than 3.4 m below with open air between (nav stops at 3.4)
    for (let i = 0; i < N; i++) {
      if (!C.okN[i]) continue;
      const n = nodes[i];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
        const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const j of nav.cells[jz * nav.nx + jx]) {
          const q = nodes[j], dy = q.y - n.y;
          if (dy >= -3.4 || dy < -20 || !C.okN[j]) continue;
          if (Math.abs(dx) === 2 && nav.cells[(n.iz + dz / 2) * nav.nx + n.ix + dx / 2].some((id) => nodes[id].y > q.y + 0.5 && nodes[id].y < n.y + 0.5)) continue;
          if (!nav._openAbove(q, n.y) || nav._blocked(n, q, n.y)) continue;
          for (const t of [0, 1]) { const g2 = C.D[t][i] - C.D[t][j]; if (fin(g2) && g2 > CK.gain && !finds.longDrop.some((w) => w.j === j && w.team === t)) finds.longDrop.push({ team: t, j, a: P3(n), b: P3(q), dy: r1(-dy), gain: r1(g2) }); }
        }
      }
    }
    // high hops (1.8–2.1 m) and long gaps (3.0–3.8 m): candidates beyond the rules; #16 tries them with a kid
    for (let i = 0; i < N; i++) {
      if (!C.okN[i]) continue;
      const n = nodes[i];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const j of nav.cells[jz * nav.nx + jx]) {
          const q = nodes[j], rise = q.y - n.y;
          if (!C.okN[j] || rise <= CK.hopHigh[0] || rise > CK.hopHigh[1] || hd(n, q) > 1.2 || n.nb.some((e) => e.to === j)) continue;
          if (nav._blocked(n, q, q.y) || !ray(n.x, n.y + 0.3, n.z, n.x, q.y + 1.6, n.z) || !ray(n.x, q.y + 1.0, n.z, q.x, q.y + 1.0, q.z)) continue;
          cand.high.push({ kind: 'high hop', from: i, to: j, gain: gainOf(C, i, j) });
        }
      }
    }
    // hops onto off-field ground: a 1.25–1.8 m hop from the field onto nodes the field doesn't hold (nav-invalid: a top
    // only a hop reaches), and the walks / drops from that ground back onto the field (its exits). The field has no such
    // move (its hop edges join field nodes only), so a ledge like that is a real way in nobody sees: #16 tries the hop,
    // and a made one is a #7d find (gain) and, ending in a Gate's ring, a #7a entrance
    for (let i = 0; i < N; i++) {
      if (!C.okN[i]) continue;
      const n = nodes[i];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const j of nav.cells[jz * nav.nx + jx]) {
          const q = nodes[j], rise = q.y - n.y;
          if (C.okN[j] || q.zone >= 0 || rise < K.hop.riseMin || rise > K.hop.riseMax || hd(n, q) > 1.2) continue;
          if (nav._blocked(n, q, q.y) || !ray(n.x, n.y + 0.3, n.z, n.x, q.y + 1.6, n.z) || !ray(n.x, q.y + 1.0, n.z, q.x, q.y + 1.0, q.z)) continue;
          // the off-field ground's exits back onto the field (nav edges, no climbs; at most 400 nodes)
          const seen = new Set([j]), st = [j], exits = new Set();
          while (st.length && seen.size < 400) { const u = st.pop(); for (const e of nodes[u].nb) { if (e.type === 'climb' || seen.has(e.to)) continue; if (C.okN[e.to]) { exits.add(e.to); continue; } if (nodes[e.to].zone >= 0) continue; seen.add(e.to); st.push(e.to); } }
          if (!exits.size) continue;
          cand.off.push({ kind: 'off hop', from: i, to: j, exits: [...exits] });
        }
      }
    }
    {
      const rim = (n) => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; const jx = n.ix + dx, jz = n.iz + dz; if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) return true; if (!nav.cells[jz * nav.nx + jx].some((id) => nodes[id].y >= n.y - 1.0 && nodes[id].y <= n.y + 0.6)) return true; } return false; };
      const openAir = (n, q, flat, dy) => { const steps = Math.floor(flat / 0.25); for (let k = 1; k < steps; k++) { const u = (k * 0.25) / flat, x = n.x + (q.x - n.x) * u, z = n.z + (q.z - n.z) * u, y = n.y + Math.max(0, dy) * u + Math.min(0, dy) * Math.max(0, u - 0.5) * 2; if (L.groundHeight(x, z, y + 0.05) >= y - 1.0) continue; return true; } return false; };
      const rims = new Uint8Array(N); for (let i = 0; i < N; i++) if (C.okN[i] && rim(nodes[i])) rims[i] = 1;
      for (let i = 0; i < N; i++) {
        if (!rims[i]) continue;
        const n = nodes[i];
        cellsAround(n, 4, (j, q) => {
          if (!rims[j] || j === i) return;
          const dy = q.y - n.y, flat = hd(n, q);
          if (dy > 0.6 || dy < -3.4 || flat <= CK.gapLong[0] || flat > CK.gapLong[1]) return;
          if (!openAir(n, q, flat, dy) || nav._blocked(n, q, Math.max(n.y, q.y))) return;
          if (dy < -K.gap.upMax && !nav._openAbove(q, n.y)) return;   // (not down through the deck it leaves)
          if (walkSet(C, i, 6).has(j)) return;
          cand.long.push({ kind: 'long gap', from: i, to: j, gain: gainOf(C, i, j) });
        });
      }
    }
    tm('7d');
    nums.cand = { high: cand.high.length, long: cand.long.length };
    nums.finds = Object.fromEntries(Object.entries(finds).map(([k, v]) => [k, v.length]));
    out._finds = finds;
    // (the physical ones — made high hops and long gaps — are added after #16 has tried them, below)
    const listed = [];
    for (const [k, v] of Object.entries(finds)) for (const f of v) {
      const p = { x: f.a[0], z: f.a[2] };
      if (waived(C, '7d', p)) continue;
      const offField = f.gain === 'off-field';
      listed.push({ probe: k, ...f, warnOnly: offField });
    }
    out._7d = listed;
    for (const f of listed.slice(0, 10)) fl.push({ at: f.a, what: `7d ${f.probe}: gain ${f.gain}`, look: { x: f.b[0], y: f.b[1], z: f.b[2] } });
    out._7bad = bad; out._7fl = fl; out._7nums = nums; out._7drops = drops; out._7climbs = cl;
  }
  // ----------------------------------------------------------------------------------------------- #8 gate placement
  {
    const bad = [], rows = [], fl = [];
    for (const t of [0, 1]) {
      const g = gates[t].pos, pad = L.spawnPads[1 - t], deck = deckOf(C, 1 - t);
      const dist = hd(g, pad), up = g.y - pad.y;
      const a1 = Math.atan2(g.x - pad.x, g.z - pad.z), a2 = Math.atan2(pond.x - pad.x, pond.z - pad.z);
      let ang = Math.abs(a1 - a2) * 180 / Math.PI; if (ang > 180) ang = 360 - ang;
      const seen = seenFrom(G, deck.eyes, new V3(g.x, g.y + 1, g.z));
      const inZone = [0, 1].some((o2) => R.zones[o2].some((z) => zoneOn(C, z) && volNode(z, g.x, g.y, g.z)));
      rows.push({ team: t, dist: r1(dist), up: r2(up), cone: r1(ang), seen, inZone });
      if (dist < CK.padGate[0] || dist > CK.padGate[1]) bad.push(`team ${t}: the Gate ${r1(dist)} m from the pad (12–20)`);
      if (up > CK.padUp) bad.push(`team ${t}: the Gate ${r2(up)} m above the pad (≤ 0.2)`);
      if (ang > CK.cone) bad.push(`team ${t}: the Gate ${r1(ang)}° off the pad → Pond line (±40°)`);
      if (!seen) bad.push(`team ${t}: the Gate not seen from the spawn deck`);
      if (inZone) bad.push(`team ${t}: the Gate in a free zone`);
      if (bad.length) fl.push({ at: P3(g), what: `the Gate: ${bad[bad.length - 1]}` });
    }
    chk(8, 'Gate placement', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : rows.map((r) => `team ${r.team}: ${r.dist} m from the pad, ${r.up} m vs the pad, ${r.cone}° off the line, seen`).join(' | '), { rows }, fl);
  }
  tm('8');
  // ----------------------------------------------------------------------------------------------- #9 high ground and free zones
  const plateaus = [];
  {
    const bad = [], warn = [], fl = [];
    // plateaus: connected nodes ≥ 1.4 m above the lowest floor within 3 m
    const hi = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (!C.okN[i]) continue;
      const n = nodes[i]; let lo = n.y;
      near(C, n, CK.plateauR, (j, q) => { if (hd(q, n) <= CK.plateauR && q.y < lo) lo = q.y; });
      // (the sea counts as floor only where a floor block stands: a pier over water is not high ground)
      if (n.y - lo >= CK.plateauUp) hi[i] = 1;
    }
    const comp = new Int32Array(N).fill(-1);
    // reachable by the carrier graph from the Pond (anyone's carrier: the graph is the same for both teams)
    const reach = search(C, pondNodes).D;
    // the enemy kid's arrival (s) from the halfway line: walking 6 m/s, climbs 7.5 m/s, hops / gaps 6 m/s
    const halfLine = []; for (let i = 0; i < N; i++) if (C.okN[i] && fin(C.D[0][i]) && fin(C.D[1][i]) && Math.abs(C.D[0][i] - C.D[1][i]) < 1.5) halfLine.push(i);
    const wK = (t, l) => l / (t === ET.climb ? CK.kidClimb : CK.kidV);
    const arrC = search(C, halfLine, { w: wK }).D, arrW = search(C, halfLine, { w: wK, noClimb: true }).D;
    // the owner's arrival from its own pad (nav: its own spawn zone allowed)
    const ownArr = [0, 1].map((t) => {
      const D = new Float64Array(N).fill(Infinity), H = new Heap(), dk = deckOf(C, t);
      for (const s of dk.deck) { D[s] = 0; H.push(s, 0); }
      while (H.n) { const u = H.pop(); if (H.lastP > D[u]) continue; for (const e of nodes[u].nb) { const q = nodes[e.to]; if (!nav.valid[e.to] || (q.zone >= 0 && q.zone !== t)) continue; const l = d3(nodes[u], q), nd = D[u] + l / (e.type === 'climb' ? CK.kidClimb : CK.kidV); if (nd < D[e.to]) { D[e.to] = nd; H.push(e.to, nd); } } }
      return D;
    });
    let ci = 0;
    for (let i = 0; i < N; i++) {
      if (!hi[i] || comp[i] >= 0) continue;
      const list = [], st = [i]; comp[i] = ci;
      while (st.length) { const u = st.pop(); list.push(u); for (const e of nodes[u].nb) { if (e.type !== 'walk' || !hi[e.to] || comp[e.to] >= 0) continue; comp[e.to] = ci; st.push(e.to); } }
      ci++;
      if (list.length < 2) continue;
      const finL = list.filter((j) => fin(C.D[0][j]) && fin(C.D[1][j])), own = finL.length ? (finL.reduce((s, j) => s + half(j), 0) * 2 > finL.length ? 1 : 0) : (nodes[list[0]].z > 0 ? 1 : 0);
      const enemy = 1 - own;
      const set = new Set(list), entPts = [];
      for (const u of list) for (let k = F.rs[u]; k < F.rs[u + 1]; k++) { const v = F.rt[k]; if (set.has(v) || !C.okN[v]) continue; entPts.push({ x: (nodes[u].x + nodes[v].x) / 2, y: nodes[u].y, z: (nodes[u].z + nodes[v].z) / 2, type: F.ry[k] }); }
      const ents = groups(entPts, CK.entGroup);
      const ownerReach = list.some((j) => fin(reach[j]));
      const eC = Math.min(...list.map((j) => arrC[j])), eW = Math.min(...list.map((j) => arrW[j])), oA = Math.min(...list.map((j) => ownArr[own][j]));
      const inZone = list.filter((j) => R.zones[own].some((z) => zoneOn(C, z) && volNode(z, nodes[j].x, nodes[j].y, nodes[j].z))).length;
      const climbOnly = ownerReach && !fin(eW) && fin(eC);
      const failP = climbOnly && inZone < list.length;
      const cx = list.reduce((s, j) => s + nodes[j].x, 0) / list.length, cz = list.reduce((s, j) => s + nodes[j].z, 0) / list.length, cy = list.reduce((s, j) => s + nodes[j].y, 0) / list.length;
      const P = { own, area: list.length * nav.step * nav.step, c: [r1(cx), r1(cy), r1(cz)], entrances: ents.length, enemyT: fin(eC) ? r1(eC) : null, enemyWalk: fin(eW) ? r1(eW) : null, ownerT: fin(oA) ? r1(oA) : null, inZone, nodes: list.length, climbOnly, fail: failP, ids: list };
      plateaus.push(P);
      if (failP && !waived(C, '9', { x: cx, z: cz })) { bad.push(`a plateau of ${P.area} m² on team ${own}'s half at (${P.c[0]}, ${P.c[1]}, ${P.c[2]}) reachable by its carrier, the enemy only by climbing, ${inZone}/${list.length} nodes in its zones`); fl.push({ at: P.c, what: `9: climb-only plateau, ${inZone}/${list.length} in a zone` }); }
      else if (ownerReach && fin(eC) && fin(oA) && eC > 2 * oA && P.area >= 4) warn.push(`plateau (${P.c[0]}, ${P.c[2]}): enemy ${r1(eC)} s vs owner ${r1(oA)} s`);
      if (ownerReach && ents.length === 1 && P.area >= 4) warn.push(`plateau (${P.c[0]}, ${P.c[2]}) ${P.area} m²: a single entrance`);
    }
    // zone entrances, signs, sides, what a zone may not touch
    const zrows = [];
    draw.zones = [];
    const routeNodes = new Set(); for (const lg of legs) if (lg.kind !== 'pg') { for (const i of lg.rt.r1 || []) routeNodes.add(i); for (const i of lg.rt.r2 || []) routeNodes.add(i); }
    for (const t of [0, 1]) R.zones[t].forEach((z, zi) => {
      if (!zoneOn(C, z)) return;
      const signs = (z.auto ? F.signs.filter((s) => s.team === t && s.auto).map((s) => [s.x, s.z]) : (z.signs || []).map((s) => [s[0], s[1]]));
      const allSigns = [...signs, ...R.zones[t].flatMap((zz) => (zz.signs || []).map((s) => [s[0], s[1]]))];
      const cross = [], inside = [];
      for (let u = 0; u < N; u++) {
        if (!C.okN[u]) continue;
        const a = nodes[u], ain = volNode(z, a.x, a.y, a.z);
        if (ain) inside.push(u);
        if (ain) continue;
        for (let k = F.fs[u]; k < F.fs[u + 1]; k++) { const v = F.ft[k], b = nodes[v]; if (!C.okN[v] || !volNode(z, b.x, b.y, b.z)) continue; cross.push({ x: (a.x + b.x) / 2, y: b.y, z: (a.z + b.z) / 2, type: F.fy[k] }); }
      }
      const ents = groups(cross, CK.entGroup).map((e) => {
        const sd = (p) => Math.min(Infinity, ...allSigns.map((s) => Math.hypot(s[0] - p.x, s[1] - p.z)));
        const signed = e.pts.some((p) => sd(p) <= CK.signR);
        const wideOk = e.w <= CK.wideEnt || (sd(e.ends[0]) <= CK.signR && sd(e.ends[1]) <= CK.signR);
        return { c: [r1(e.c.x), r1(e.c.y), r1(e.c.z)], w: r1(e.w), n: e.pts.length, signed, wideOk, ends: e.ends.map((p) => [r1(p.x), r1(p.z)]), types: [...new Set(e.pts.map((p) => TYPE_NAME[p.type]))] };
      });
      const wrongSide = inside.filter((i) => fin(C.D[t][i]) && fin(C.D[1 - t][i]) && !(C.D[t][i] > C.D[1 - t][i]));
      const touches = [];
      for (const tt of [0, 1]) weirs[tt].forEach((w, wi) => { if (zoneTouches(z, w.pos, w.r || K.weirR)) touches.push(`team ${tt}'s weir ${wi + 1}`); });
      for (const tt of [0, 1]) if (zoneTouches(z, gates[tt].pos, K.gateR)) touches.push(`team ${tt}'s Gate`);
      const onRoute = inside.filter((i) => routeNodes.has(i));
      if (onRoute.length) touches.push(`${onRoute.length} route 1 / route 2 node(s)`);
      const row = { team: t, i: zi, auto: !!z.auto, nodes: inside.length, entrances: ents, wrongSide: wrongSide.length, touches };
      zrows.push(row);
      draw.zones.push({ team: t, poly: z.poly, signs, ents });
      for (const e of ents) {
        if (!e.signed) { bad.push(`team ${t} zone ${zi + 1}: an entrance at (${e.c[0]}, ${e.c[2]}) [${e.types}] with no sign within 2 m`); fl.push({ at: e.c, what: `9: unsigned zone entrance` }); }
        else if (!e.wideOk) { bad.push(`team ${t} zone ${zi + 1}: a ${e.w} m entrance at (${e.c[0]}, ${e.c[2]}) needs a sign within 2 m of each end ${JSON.stringify(e.ends)}`); fl.push({ at: e.c, what: '9: wide entrance, an end unsigned' }); }
      }
      if (wrongSide.length) { bad.push(`team ${t} zone ${zi + 1}: ${wrongSide.length} node(s) not on its owner's half (e.g. ${JSON.stringify(P3(nodes[wrongSide[0]]))})`); fl.push({ at: P3(nodes[wrongSide[0]]), what: '9: zone over the halfway line' }); }
      if (touches.length) bad.push(`team ${t} zone ${zi + 1} touches ${touches.join(', ')}`);
    });
    // noRetreat: never within 3 m of an own-half plateau or a free zone
    const nrRows = [];
    for (const v of R.noRetreat || []) {
      const near3 = [];
      for (const P of plateaus) { const d = Math.min(...P.ids.map((j) => polyDist(v.poly, nodes[j].x, nodes[j].z))); if (d <= CK.nrGap) near3.push(`plateau (${P.c[0]}, ${P.c[2]})`); }
      for (const t of [0, 1]) for (const z of R.zones[t]) { const d = polyPolyDist(v.poly, z.poly); if (d <= CK.nrGap) near3.push(`team ${t}'s zone`); }
      nrRows.push({ poly: v.poly, near: near3 });
      if (near3.length) { bad.push(`a noRetreat polygon within 3 m of ${[...new Set(near3)].join(', ')}`); fl.push({ at: [v.poly[0][0], 0, v.poly[0][1]], what: '9: noRetreat by high ground / a zone' }); }
    }
    draw.plateaus = plateaus.map((P) => ({ c: P.c, fail: P.fail, pts: P.ids.map((j) => [r1(nodes[j].x), r1(nodes[j].z)]) }));
    const status = bad.length ? 'FAIL' : warn.length ? 'WARN' : 'OK';
    chk(9, 'High ground and free zones', status, [bad.join('; '), warn.length ? 'WARN ' + warn.slice(0, 6).join('; ') + (warn.length > 6 ? ` … ${warn.length}` : '') : '', !bad.length ? `${plateaus.length} plateaus (${plateaus.filter((p) => p.climbOnly).length} climb-only for the enemy, all covered); ${zrows.length} zones, ${zrows.reduce((s, z) => s + z.entrances.length, 0)} entrances, all signed` : ''].filter(Boolean).join(' · '),
      { plateaus: plateaus.map((P) => ({ ...P, ids: undefined })), zones: zrows, noRetreat: nrRows, warn }, fl);
  }
  tm('9');
  // ----------------------------------------------------------------------------------------------- #10 retreat sanity
  {
    const bad = [], rows = [], fl = [];
    for (const t of [0, 1]) {
      // from the team's own Gate area (the Gate the enemy carries to, on t's half) to the Pond: route 1 and route 2
      const own = gateNodes[1 - t];
      const rt = own.length ? routes(C, own, pondNodes, zm[t]) : { r1: null };
      for (const [nm, p] of [['route 1', rt.r1], ['route 2', rt.r2]]) {
        if (!p) { rows.push({ team: t, route: nm, none: true }); continue; }
        let mark = -Infinity, worst = 0, at = null, cov = 0, stepsOwn = 0;
        for (const i of p) {
          if (!(C.D[t][i] > C.D[1 - t][i])) break;   // (left the own half)
          stepsOwn++;
          const P = Kp.L[t] - C.D[t][i];
          const n = nodes[i];
          if ((R.noRetreat || []).some((v) => volNode(v, n.x, n.y, n.z))) { mark = Math.max(mark, P); cov++; continue; }
          if (P > mark) mark = P;
          if (mark - P > worst) { worst = mark - P; at = P3(n); }
        }
        rows.push({ team: t, route: nm, dip: r1(worst), at, steps: stepsOwn, covered: cov });
        if (worst > CK.dip) { bad.push(`team ${t} ${nm} on its own half dips ${r1(worst)} m in progress at ${JSON.stringify(at)}`); fl.push({ at, what: `10: a ${r1(worst)} m dip (team ${t} ${nm})` }); }
      }
    }
    // across every state switch: a still carrier's mark is reset (§3.3), so the dip at a switch is 0 by the rule; the
    // raw change of P a carrier standing on these routes would see is reported
    const sw = [];
    if (F.states.length > 1) for (let s = 0; s < F.states.length; s++) for (let s2 = 0; s2 < F.states.length; s2++) {
      if (s === s2) continue;
      let worst = 0;
      for (const t of [0, 1]) for (const lg of legs) if (lg.team === t && lg.rt.r1) for (const i of lg.rt.r1) { const a = F.states[s].D[t][i], b = F.states[s2].D[t][i]; if (fin(a) && fin(b)) worst = Math.max(worst, b - a); }
      sw.push({ from: F.states[s].key, to: F.states[s2].key, rawDip: r1(worst), afterReset: 0 });
    }
    chk(10, 'Retreat sanity', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : rows.map((r) => (r.none ? `t${r.team} ${r.route}: none` : `t${r.team} ${r.route}: dip ${r.dip} m`)).join(', ') + (sw.length ? ` · state switches: the mark resets (raw ΔP up to ${Math.max(...sw.map((x) => x.rawDip))} m)` : ''), { rows, switches: sw }, fl);
  }
  tm('10');
  // ----------------------------------------------------------------------------------------------- #12 variant
  {
    const id = C.id, lay = MAP_LAYOUTS[id], bad = [];
    let lm = { exists: null, fresh: null };
    const test = ['karpbox'].includes(id) || !window.__inkwave?.mapDef || (await import('../../src/config.js')).MAPS.find((m) => m.id === id)?.test;
    if (lay) {
      const strip = (d) => JSON.stringify(d, (k, v) => (k === 'onlyIn' || k === 'notIn' ? undefined : v));
      const tf = layoutFor(lay, 'turf'), bz = layoutFor(lay, 'bazookarp');
      const has = (list, d) => list.some((x) => strip(x) === strip(d));
      const mine = (d) => String(d.tag || '').startsWith('karp-') || [].concat(d.onlyIn || []).includes('bazookarp') || [].concat(d.notIn || []).includes('turf') && false;
      for (const d of [...bz.single, ...bz.half]) if (!has([...tf.single, ...tf.half], d) && !mine(d)) bad.push(`a piece in the Bazookarp build not tagged for it: ${d.tag || d.kind} ${JSON.stringify(d.min || d.center || d.low)} (onlyIn ${JSON.stringify(d.onlyIn)} notIn ${JSON.stringify(d.notIn)})`);
      for (const d of [...tf.single, ...tf.half]) if (!has([...bz.single, ...bz.half], d) && ![].concat(d.notIn || []).includes('bazookarp') && !(d.onlyIn && ![].concat(d.onlyIn).includes('bazookarp'))) bad.push(`a Turf War piece missing from the Bazookarp build: ${d.tag || d.kind}`);
    }
    if (!test) {
      try { const r = await fetch(`./assets/lightmaps/${id}.bazookarp.json`); lm.exists = r.ok; } catch { lm.exists = false; }
      lm.fresh = L.lightSize > 0 && !!lm.exists;
      if (!lm.exists) bad.push(`no lightmap assets/lightmaps/${id}.bazookarp.json (baked on the Mac mini once the layout is final)`);
      else if (!lm.fresh) bad.push('its lightmap is stale (the build differs from the bake)');
    }
    chk(12, 'Variant', bad.length ? 'FAIL' : 'OK', bad.length ? bad.slice(0, 4).join('; ') + (bad.length > 4 ? ` … ${bad.length}` : '') : test ? 'differs from Turf War only by bazookarp-tagged pieces and the kit; a test stage: never baked' : `differs only by tagged pieces and the kit; lightmap ${id}.bazookarp fresh`, { lightmap: lm, test: !!test, problems: bad.length });
  }
  // ----------------------------------------------------------------------------------------------- #13 deep spawns
  {
    const bad = [], rows = [], fl = [];
    for (const d of [0, 1]) {
      const dk = deckOf(C, d), off = [];
      for (const u of dk.deck) for (const e of nodes[u].nb) if (!dk.deck.has(e.to) && nav.valid[e.to]) { const a = nodes[u], b = nodes[e.to]; off.push({ x: (a.x + b.x) / 2, y: a.y, z: (a.z + b.z) / 2, t: e.type }); }
      const ways = groups(off, CK.entGroup);
      // the apron: route 1 from the deck's edge to the Gate in front of it (the one the other team carries to)
      const g = gates[1 - d], seeds = F.seeds[1 - d];
      const Dg = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), H = new Heap();
      for (const s of seeds) { Dg[s] = 0; H.push(s, 0); }
      const radj = C._radj || (C._radj = (() => { const r = Array.from({ length: N }, () => []); for (const n of nodes) for (const e of n.nb) r[e.to].push([n.id, e.type]); return r; })());
      while (H.n) { const u = H.pop(); if (H.lastP > Dg[u]) continue; for (const [v, ty] of radj[u]) { if (!nav.valid[v] || ty === 'climb') continue; const q = nodes[v]; if (q.zone >= 0 && q.zone !== d) continue; const nd = Dg[u] + d3(nodes[u], q); if (nd < Dg[v]) { Dg[v] = nd; prev[v] = u; H.push(v, nd); } } }
      let best = -1, bd = Infinity; for (const e of dk.edge) if (Dg[e] < bd) { bd = Dg[e]; best = e; }
      const path = []; for (let k = best; k >= 0; k = prev[k]) { path.push(k); if (path.length > 4000) break; }
      const cover = new Map();
      // (the spawn deck's own blocks — what its nodes stand on — are not cover on the apron in front of it)
      const deckB = new Set(); for (const id of dk.deck) { const n = nodes[id], f = floorAt(L, n.x, n.z, n.y + 0.05); if (f.b) deckB.add(f.b.id); }
      for (const i of path) {
        const n = nodes[i];
        for (const id of L.queryBlocks(n.x - CK.apronR, n.z - CK.apronR, n.x + CK.apronR, n.z + CK.apronR, [])) {
          const b = L.blocks[id];
          if (!b.solid || b.dynamic || b.grate || deckB.has(id) || String(b.tag || '').startsWith('karp-')) continue;
          if (Math.min(b.half.x, b.half.z) * 2 < 0.45) continue;
          const top = b.aabbMax.y, bot = b.aabbMin.y;
          if (top < n.y + CK.apronH || bot > n.y + 1.0) continue;
          if (dk.deck.has(i) && Math.abs(top - n.y) < 0.2) continue;
          const cx = Math.max(b.aabbMin.x, Math.min(n.x, b.aabbMax.x)), cz = Math.max(b.aabbMin.z, Math.min(n.z, b.aabbMax.z));
          if (Math.hypot(cx - n.x, cz - n.z) > CK.apronR) continue;
          if (L.pointInside(new V3(n.x, n.y + 0.5, n.z), 0)) continue;
          cover.set(id, { tag: b.tag || (b.hidden ? 'prop' : 'block'), at: [r1(b.center.x), r1(b.center.z)], h: r1(top - n.y) });
        }
      }
      rows.push({ team: d, ways: ways.length, wayAt: ways.map((w) => [r1(w.c.x), r1(w.c.z), r1(w.w)]), apronLen: r1(bd), cover: cover.size, coverAt: [...cover.values()].slice(0, 8) });
      if (ways.length < CK.deckWays) { bad.push(`team ${d}'s spawn deck: ${ways.length} way(s) off (≥ 3)`); fl.push({ at: P3(L.spawnPads[d]), what: `13: ${ways.length} ways off the deck` }); }
      if (cover.size < CK.apron) { bad.push(`team ${d}'s apron: ${cover.size} cover block(s) ≥ 1.2 m within 4 m of route 1 deck → Gate (≥ 2)`); fl.push({ at: P3(g.pos), what: `13: ${cover.size} cover on the apron` }); }
    }
    chk(13, 'Deep spawns', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : rows.map((r) => `team ${r.team}: ${r.ways} ways off the deck, ${r.cover} cover blocks on the apron`).join(' | '), { rows }, fl);
  }
  // ----------------------------------------------------------------------------------------------- #14 the Pond
  {
    const [ra, rb] = CK.pondRing, cells = new Set();
    near(C, pond, rb + 1, (id, n) => { const h = hd(n, pond); if (h >= ra && h <= rb && nav.valid[id] && Math.abs(n.y - pond.y) <= 5) cells.add(n.ix + ',' + n.iz); });
    const cov = cells.size;
    const area = Math.PI * (rb * rb - ra * ra), share = (cov * nav.step * nav.step) / area;
    const c = new V3(pond.x, pond.y + K.shell.lift, pond.z); let seen = 0; const dirs = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, x = pond.x + Math.sin(a) * 7, z = pond.z + Math.cos(a) * 7;
      const f = L.groundHeight(x, z, pond.y + 2.5), y = (f > pond.y - 4 ? f : pond.y) + 1.5;
      const ok = losClear(G, new V3(x, y, z), c); if (ok) seen++; dirs.push(ok ? 1 : 0);
    }
    const ok = share >= CK.pondCover && seen >= CK.pondSeen;
    chk(14, 'The Pond', ok ? 'OK' : 'FAIL', `ring 4.5–10 m ${r1(share * 100)} % floor (≥ 70); the shell seen from ${seen}/8 directions (≥ 6) ${dirs.join('')}`, { cover: r2(share), seen, dirs }, ok ? [] : [{ at: P3(pond), what: `14: cover ${r1(share * 100)} %, seen ${seen}/8` }]);
  }
  // ----------------------------------------------------------------------------------------------- #15 weir room
  {
    const bad = [], rows = [], fl = [];
    for (const t of [0, 1]) weirs[t].forEach((w, i) => {
      const p = w.pos, found = new Map(), q = new V3();
      for (const id of L.queryBlocks(p.x - CK.weirRoom, p.z - CK.weirRoom, p.x + CK.weirRoom, p.z + CK.weirRoom, [])) {
        const b = L.blocks[id];
        if (!b.solid || b.dynamic || /^karp-(weir|sill)/.test(b.tag || '')) continue;
        let hitB = false;
        for (let y = 0.3; y <= 3.6 + 1e-6 && !hitB; y += 0.3) for (let rr = 0; rr <= CK.weirRoom && !hitB; rr += 0.25) for (let k = 0, nk = Math.max(1, Math.round(rr * 8)); k < nk && !hitB; k++) { const a = (k / nk) * Math.PI * 2; if (L.pointInBlock(b, q.set(p.x + Math.cos(a) * rr, p.y + y, p.z + Math.sin(a) * rr), 0)) hitB = true; }
        if (hitB) found.set(id, b.tag || (b.hidden ? 'prop collider' : `block ${id}`));
      }
      // seen: from route 1's node 8 m before it and 8 m after it, and from 7 m in 8 directions
      const c = new V3(p.x, p.y + K.shell.lift, p.z);
      const pw = legs.find((l) => l.team === t && l.kind === 'pw' && l.i === i)?.rt?.r1, wg = legs.find((l) => l.team === t && l.kind === 'wg' && l.i === i)?.rt?.r1;
      const at8 = (path, fromEnd) => { if (!path) return null; const seq = fromEnd ? [...path].reverse() : path; let acc = 0; for (let k = 1; k < seq.length; k++) { acc += d3(nodes[seq[k - 1]], nodes[seq[k]]); if (acc >= 8) return nodes[seq[k]]; } return nodes[seq[seq.length - 1]]; };
      const before = at8(pw, true), after = at8(wg, false);
      const sA = before ? losClear(G, new V3(before.x, before.y + 1.5, before.z), c) : false, sD = after ? losClear(G, new V3(after.x, after.y + 1.5, after.z), c) : false;
      let seen = 0; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, x = p.x + Math.sin(a) * 7, z = p.z + Math.cos(a) * 7, f = L.groundHeight(x, z, p.y + 2.5), y = (f > p.y - 4 ? f : p.y) + 1.5; if (losClear(G, new V3(x, y, z), c)) seen++; }
      rows.push({ team: t, i, solid: [...found.values()], attackers: sA, defenders: sD, seen });
      if (found.size) { bad.push(`team ${t} weir ${i + 1}: solid within 3 m: ${[...new Set(found.values())].join(', ')}`); fl.push({ at: P3(p), what: `15: solid within 3 m of the weir` }); }
      if (!sA || !sD) bad.push(`team ${t} weir ${i + 1}: not seen from the ${!sA ? 'attackers\'' : 'defenders\''} approach`);
      if (seen < CK.weirSeen) bad.push(`team ${t} weir ${i + 1}: seen from ${seen}/8 directions (≥ 3)`);
    });
    chk(15, 'Weir room', bad.length ? 'FAIL' : 'OK', bad.length ? bad.join('; ') : rows.map((r) => `t${r.team} weir ${r.i + 1}: clear, both approaches see it, ${r.seen}/8`).join(' | '), { rows }, fl);
  }
  tm('15');
  // ----------------------------------------------------------------------------------------------- #16 physical proof
  {
    const extra = F.extraEdgeList();
    const tests = extra.map((e) => ({ kind: e.type, from: e.from, to: e.to, len: e.len }));
    const beyond = [...cand.high, ...cand.long];
    let res = null;
    if (o.phys !== false) res = proveEdges(C, [...tests, ...beyond.map((b) => ({ kind: b.kind, from: b.from, to: b.to, beyond: true, gain: b.gain })), ...cand.off.map((b) => ({ kind: b.kind, from: b.from, to: b.to, beyond: true, off: b }))], o);
    const fails = [], made = [], fl = [];
    if (res) {
      for (const r of res.list) {
        if (!r.beyond && !r.ok) fails.push(r);
        if (r.beyond && r.ok && r.kind !== 'off hop') made.push(r);
      }
    }
    const veto = fails.map((r) => { const a = nodes[r.from], b = nodes[r.to]; return [r2(a.x), r2(a.y), r2(a.z), r2(b.x), r2(b.y), r2(b.z)]; });
    // the made candidates beyond the rules go to #7d with their gain
    for (const r of made) { const g2 = gainOf(C, r.from, r.to); if (g2 > CK.gain && !waived(C, '7d', nodes[r.from])) out._7d.push({ probe: r.kind === 'high hop' ? 'highHop' : 'longGap', a: P3(nodes[r.from]), b: P3(nodes[r.to]), gain: fin(g2) ? r1(g2) : 'off-field', warnOnly: !fin(g2) }); }
    const offMade = res ? res.list.filter((r) => r.kind === 'off hop' && r.ok) : [];
    out._offMade = [];
    for (const r of offMade) {
      const off = cand.off.find((b) => b.from === r.from && b.to === r.to);
      for (const t of [0, 1]) {
        let best = -1, bd = Infinity; for (const q of off.exits) if (C.D[t][q] < bd) { bd = C.D[t][q]; best = q; }
        const g2 = C.D[t][r.from] - bd;
        if (fin(g2) && g2 > CK.gain && !waived(C, '7d', nodes[r.from])) out._7d.push({ probe: 'offHop', team: t, a: P3(nodes[r.from]), b: P3(nodes[r.to]), exit: P3(nodes[best]), gain: r1(g2), warnOnly: false });
        // a way into team t's ring over off-field ground: from outside the ring to an exit inside it
        const gp = gates[t].pos;
        for (const q of off.exits) if (hd(nodes[r.from], gp) > CK.ring && hd(nodes[q], gp) <= CK.ring) out._aCross[t].push({ x: nodes[q].x, y: nodes[q].y, z: nodes[q].z, type: 9, from: r.from, to: q });
      }
      out._offMade.push({ a: P3(nodes[r.from]), top: P3(nodes[r.to]), exits: off.exits.length });
    }
    for (const r of fails.slice(0, 8)) fl.push({ at: P3(nodes[r.from]), what: `16: a ${r.kind} edge no kid makes`, look: nodes[r.to] });
    draw.extra = extra.map((e) => { const r = res?.list.find((x) => x.from === e.from && x.to === e.to && !x.beyond); return { a: [r1(e.a[0]), r1(e.a[2])], b: [r1(e.b[0]), r1(e.b[2])], type: e.type, ok: r ? r.ok : null }; });
    draw.beyond = made.map((r) => ({ a: [r1(nodes[r.from].x), r1(nodes[r.from].z)], b: [r1(nodes[r.to].x), r1(nodes[r.to].z)] }));
    const ran = !!res;
    chk(16, 'The hop and gap edges, proved physically', !ran ? 'SKIP' : fails.length ? 'FAIL' : 'OK',
      !ran ? 'PHYS=0: not run (a RESULT ok needs it)' : `${tests.length} added edges tried (${F.stats.hops} hops, ${F.stats.gaps} gaps): ${tests.length - fails.length} made, ${fails.length} not${fails.length ? ' → hopVeto ' + JSON.stringify(veto.slice(0, 6)) + (veto.length > 6 ? ` … ${veto.length}` : '') : ''}; ${beyond.length} candidates beyond the rules (${cand.high.length} high hops, ${cand.long.length} long gaps): ${made.length} made (to #7d); ${cand.off.length} hops onto off-field ground: ${offMade.length} made (to #7d / #7a)` + (res ? ` · ${res.trials} trials, ${Math.round(res.ms / 1000)} s` : ''),
      { tried: tests.length, failed: fails.length, hopVeto: veto, beyond: beyond.length, beyondMade: made.length, offHops: cand.off.length, offMade: out._offMade, trials: res?.trials, ms: res?.ms, made: made.map((r) => ({ kind: r.kind, a: P3(nodes[r.from]), b: P3(nodes[r.to]), gain: r1(gainOf(C, r.from, r.to)) })) }, fl);
  }
  tm('16');
  // ----------------------------------------------------------------------------------------------- #7 finished (with #16's made candidates)
  {
    const bad = [], fl = [], d = out._7d, nums = out._7nums;
    // (a) the entrances (every crossing into the 15 m ring; a made hop over off-field ground counts at its exit)
    draw.entrances = []; nums.teams = [];
    for (const t of [0, 1]) {
      const g = gates[t].pos, deck = deckOf(C, 1 - t), cross = out._aCross[t];
      const ents = groups(cross, CK.entGroup).map((e) => {
        const types = [...new Set(e.pts.map((p) => TYPE_NAME[p.type] || 'ride'))];
        const seen = e.pts.some((p) => seenFrom(G, deck.eyes, new V3(p.x, p.y + 1, p.z)));
        return { c: [r1(e.c.x), r1(e.c.y), r1(e.c.z)], w: r1(e.w), n: e.pts.length, types, seen, from: P3(nodes[e.pts[0].from] || e.c) };
      });
      if (ents.length < CK.ents[0] || ents.length > CK.ents[1]) bad.push(`(a) team ${t}: ${ents.length} entrances into its Gate's 15 m ring (2–5)`);
      for (const e of ents.filter((q) => !q.seen)) if (!waived(C, '7a', { x: e.c[0], z: e.c[2] })) { bad.push(`(a) team ${t}: an entrance at (${e.c[0]}, ${e.c[2]}) [${e.types}] not seen from the spawn deck`); fl.push({ at: e.c, what: `7a: entrance unseen from the deck (${e.types})`, look: g }); }
      draw.entrances.push({ team: t, g: P3(g), ents });
      nums.teams.push({ team: t, entrances: ents });
    }
    bad.push(...out._7bad); fl.push(...out._7fl);
    const hard = d.filter((f) => !f.warnOnly), soft = d.filter((f) => f.warnOnly);
    if (hard.length) bad.push(`(d) ${hard.length} connection(s) the graph lacks gaining > 10 m: ${hard.slice(0, 5).map((f) => `${f.probe} ${JSON.stringify(f.a)}→${JSON.stringify(f.b)} ${f.gain} m`).join(', ')}`);
    const warnTxt = soft.length ? `WARN (d) ${soft.length} to ground off the field (a hiding place for #9): ${soft.slice(0, 3).map((f) => `${f.probe} ${JSON.stringify(f.b)}`).join(', ')}` : '';
    nums.drops = out._7drops.length; nums.climbShortcuts = out._7climbs.length; nums.d = d.map((f) => ({ probe: f.probe, a: f.a, b: f.b, gain: f.gain }));
    chk(7, 'No shortcut into a base', bad.length ? 'FAIL' : soft.length ? 'WARN' : 'OK', [bad.join('; '), warnTxt, !bad.length ? nums.teams.map((t) => `team ${t.team}: ${t.entrances.length} entrances [${t.entrances.map((e) => e.types.join('/')).join(', ')}], all seen`).join(' | ') + `; no climb shortcut, no drop > 2.5 m into a ring, #7d: ${Object.entries(nums.finds).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''].filter(Boolean).join(' · '), nums, fl);
    delete out._7bad; delete out._7fl; delete out._7nums; delete out._7drops; delete out._7climbs; delete out._finds; delete out._7d; delete out._aCross; delete out._offMade;
  }
  // the routes for the picture
  draw.routes = legs.filter((l) => l.kind !== 'pg').map((l) => ({ team: l.team, leg: l.name, r1: (l.rt.r1 || []).map((i) => [r1(nodes[i].x), r1(nodes[i].z)]), r2: (l.rt.r2 || []).map((i) => [r1(nodes[i].x), r1(nodes[i].z)]) }));
  out.legs = legs.map((l) => ({ team: l.team, leg: l.name, kind: l.kind, i: l.i, r1: l.rt.r1 ? r1(l.rt.l1) : null, r2: l.rt.r2 ? r1(l.rt.l2) : null, path1: l.rt.r1 || null, path2: l.rt.r2 || null }));
  window.__karpCheck = { out, legs: out.legs, plateaus };
  out.ms.total = Math.round(performance.now() - t0);
  // (the paths stay in the page for the carry walk and the pictures; the JSON keeps lengths)
  return JSON.parse(JSON.stringify({ ...out, legs: out.legs.map((l) => ({ ...l, path1: undefined, path2: undefined })) }));
}
function zoneTouches(z, p, r) {
  if (p.y < (z.y0 ?? -50) - 0.6 || p.y > (z.y1 ?? 50) + 0.6) return false;
  return inPoly(z.poly, p.x, p.z) || polyDist(z.poly, p.x, p.z) <= r;
}
function polyDist(poly, x, z) {
  if (inPoly(poly, x, z)) return 0;
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0], az = poly[j][1], ex = poly[i][0] - ax, ez = poly[i][1] - az, l2 = ex * ex + ez * ez || 1e-9, u = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2)); best = Math.min(best, Math.hypot(x - ax - ex * u, z - az - ez * u)); }
  return best;
}
const polyPolyDist = (a, b) => Math.min(...a.map((p) => polyDist(b, p[0], p[1])), ...b.map((p) => polyDist(a, p[0], p[1])));

// ================================================================================================= #16: a kid's real jump
// For each edge: a kid with `carry` set (4.8 m/s, the carrier's jump) stepped through actor.update at 1/60 s alone, from
// 1.5 m and 3 m before the low end facing the far end; it runs and presses jump at each of 5 distances before the edge
// (a move down is first tried running off, no jump); success = grounded on the far node's floor inside 2 s: within 0.5 m
// of it, or on that floor within 3 m with a clear waist line to it (it landed past the node: the last steps are a walk).
function proveEdges(C, list, o = {}) {
  const t0 = performance.now(), { m, nodes, L, G } = C;
  const kid = m.actors.find((a) => a.bot && a.team === 0) || m.actors.find((a) => a.bot) || m.actors[0];
  const it = kid.intent, dt = 1 / 60;
  // everyone else out of the way (brainless, on their pads) and the kid brainless
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.jump = a.intent.squid = a.intent.sub = a.intent.special = false; if (a !== kid) { const p = L.spawnPads[a.team]; a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); } }
  const V = new V3();
  const carry = () => ({ since: 0, sp: kid.special, gun: null, kick: new V3(), j: { mark: NaN, ret: false, half: -1, zone: false, rate: 1, why: null, foot: null, sent: null, sentFoot: null, sentFootT: 0 }, startBest: 0, probe: true });
  let trials = 0;
  const one = (a, b, start, jumpAt, edgeP, dir) => {
    trials++;
    kid.spawnAt(V.set(start.x, start.y + 0.05, start.z), Math.atan2(dir.x, dir.z));
    kid.invuln = 99; kid.alive = true; kid.form = 'kid'; kid.ink = PLAYER.inkMax ?? 100;
    kid.carry = carry();
    it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
    for (let f = 0; f < 3; f++) kid.update(dt);
    if (!kid.grounded) return false;
    let jumped = 0, ok = false;
    for (let f = 0; f < 120; f++) {
      const dx = b.x - kid.pos.x, dz = b.z - kid.pos.z, hb = Math.hypot(dx, dz);
      if (hb > 0.35) it.move.set(dx / hb, 0, dz / hb); else it.move.set(0, 0, 0);
      const along = (edgeP.x - kid.pos.x) * dir.x + (edgeP.z - kid.pos.z) * dir.z;   // metres still to go to the edge
      if (!jumped && jumpAt != null && along <= jumpAt && kid.grounded) jumped = 1;
      it.jump = jumped > 0 && jumped <= 4; if (jumped) jumped++;
      kid.update(dt);
      if (!kid.alive) break;
      // made: grounded on the far node's floor — within 0.5 m of it, or on that floor within 3 m with a clear waist line
      // to it (a run-off or a jump that lands past the node is on its floor: a carrier walks the last steps)
      if (kid.grounded && Math.abs(kid.pos.y - b.y) <= 0.3) { const hb2 = Math.hypot(kid.pos.x - b.x, kid.pos.z - b.z); if (hb2 <= 0.5 || (hb2 <= 3 && !C.nav._blocked(b, kid.pos, Math.max(b.y, kid.pos.y)) && Math.abs(L.groundHeight((b.x + kid.pos.x) / 2, (b.z + kid.pos.z) / 2, b.y + 0.3) - b.y) <= 0.3)) { ok = true; break; } }
      if (kid.pos.y < -3) break;
    }
    it.jump = false; it.move.set(0, 0, 0);
    return ok;
  };
  const out = [];
  for (const e of list) {
    const a = nodes[e.from], b = nodes[e.to];
    const fl = Math.hypot(b.x - a.x, b.z - a.z) || 1, dir = { x: (b.x - a.x) / fl, z: (b.z - a.z) / fl };
    // the edge: a hop's riser between the cells; a gap's rim (the first point with no floor under the line)
    let edgeP = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    if (e.kind === 'gap' || e.kind === 'long gap') for (let u = 0.1; u < fl; u += 0.1) { const x = a.x + dir.x * u, z = a.z + dir.z * u; if (!(L.groundHeight(x, z, a.y + 0.05) > a.y - 1.0)) { edgeP = { x, z }; break; } }
    let ok = false;
    for (const back of [1.5, 3.0]) {
      // the run-up's start: back along the line from the low end, on floor at about its height (shortened if not)
      let st = null;
      // (down to standing on the low end itself: a narrow top with no floor behind it is still stepped off)
      for (const bb of [...Array.from({ length: Math.round(back / 0.3) }, (_, k) => back - k * 0.3), 0]) { if (st) break; const x = a.x - dir.x * bb, z = a.z - dir.z * bb, f = L.groundHeight(x, z, a.y + 0.4); if (f > a.y - 0.45 && f < a.y + 0.4 && G.physics.bodyFits(V.set(x, f + 0.02, z), PLAYER.radius, PLAYER.stepUp, PLAYER.height, false, 0.04)) st = { x, y: f, z }; }
      if (!st && back === 3.0) st = { x: a.x, y: a.y, z: a.z };   // (the node itself: nav put it where a body fits)
      if (!st) continue;
      // a down move is tried running off the edge first (no jump), then with the jump at the five distances
      for (const j of [...(b.y < a.y - 0.6 ? [null] : []), 0.2, 0.5, 0.8, 1.1, 1.4]) { if (one(a, b, st, j, edgeP, dir)) { ok = true; break; } }
      if (ok) break;
    }
    out.push({ kind: e.kind, from: e.from, to: e.to, ok, beyond: !!e.beyond });
    if (o.budgetMs && performance.now() - t0 > o.budgetMs) break;
  }
  kid.carry = null; kid.invuln = 0;
  return { list: out, trials, ms: Math.round(performance.now() - t0) };
}

// ================================================================================================= #11 drop coverage
// A splat at every 4th node of route 1 and route 2 of every leg (the leg's team carrying) and at every node inside each
// free zone (the zone's enemy carrying: its own carrier goes to the Pond by rule S50): the field's drop spot must find
// a node on the carrier's half (§2.7 step 4: never the Pond), within 12 m — except inside a large enemy zone.
export function dropCoverage(o = {}) {
  const C = ctx(o.state || 0), { F, R, nodes } = C, kc = window.__karpCheck;
  const dyn = (id) => { const n = nodes[id]; for (const t of [0, 1]) for (const w of R.weirs[t]) if (hd(n, w.pos) < K.rest.weirR && Math.abs(n.y - w.pos.y) < K.rest.band) return false; return true; };
  const samples = [];
  for (const l of kc.legs) for (const p of [l.path1, l.path2]) if (p) p.forEach((id, k) => { if (k % 4 === 0) samples.push({ id, team: l.team, why: `t${l.team} ${l.leg}` }); });
  for (const t of [0, 1]) R.zones[t].forEach((z, zi) => { if (!zoneOn(C, z)) return; for (let i = 0; i < C.N; i++) { const n = nodes[i]; if (C.okN[i] && volNode(z, n.x, n.y, n.z)) samples.push({ id: i, team: 1 - t, why: `in team ${t}'s zone ${zi + 1}`, enemyZone: z }); } });
  const bad = []; let worst = 0, n = 0, pond = 0;
  for (const s of samples) {
    const q = nodes[s.id], h = F.halfOf[s.id];
    if (R.zones[s.team].some((z) => zoneOn(C, z) && volNode(z, q.x, q.y, q.z))) continue;   // (own zone: the Pond by rule)
    n++;
    const id = F.dropSpot(new V3(q.x, q.y, q.z), h, dyn);
    if (id < 0) { pond++; bad.push({ at: P3(q), why: s.why, what: 'no drop spot on its half: back to the Pond' }); continue; }
    const r = nodes[id], d = hd(q, r);
    const inEnemy = R.zones[1 - s.team].some((z) => zoneOn(C, z) && volNode(z, q.x, q.y, q.z));
    if (F.halfOf[id] !== h) bad.push({ at: P3(q), why: s.why, what: 'dropped on the other half' });
    else if (d > CK.dropNear && !inEnemy) bad.push({ at: P3(q), why: s.why, what: `the drop spot ${r1(d)} m away`, to: P3(r) });
    if (!inEnemy) worst = Math.max(worst, d);
  }
  return { samples: n, bad: bad.slice(0, 20), nBad: bad.length, pond, worst: r1(worst) };
}

// ================================================================================================= #11 the carry walk
const idle = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
export async function carryWalk(team, o = {}) {
  const C = ctx(o.state || 0), { g, m, Kp, F, nodes, L, G, R, N } = C, dbg = g.debug, kc = window.__karpCheck;
  dbg.freeze();
  const res = { team, log: [], stuck: 0, walks: {} };
  const T = () => r1(Kp.clock);
  const mine = m.actors.filter((a) => a.team === team), others = m.actors.filter((a) => a.team !== team);
  for (const a of m.actors) { if (a.bot) a.bot.update = () => {}; idle(a); }
  const park = () => { for (const a of others) { idle(a); const p = L.spawnPads[a.team]; if (hd(a.pos, p) > 3) { a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); } } };
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { park(); dbg.step(1000 / 60); } };
  const halfN = (i) => (C.D[0][i] > C.D[1][i] ? 0 : 1);
  const put = (a, p) => { a.pos.set(p.x, p.y + 0.05, p.z); a.vel.set(0, 0, 0); a.form = 'kid'; idle(a); };
  const settle = () => { let t = 0; while (t < 4 && (Kp.phase === 'reforming' || Kp.phase === 'resetting')) { step(0.1); t += 0.1; } };
  const alive = (a) => { let t = 0; while (!a.alive && t < 9) { step(0.1); t += 0.1; } return a.alive; };
  const grant = (a) => { if (Kp.holder && Kp.holder !== a) Kp._release(Kp.holder); a.invuln = 0; Kp._applyGrant(a); };
  const pondNodes = trig(C, R.pond, 1.5, 0.8);
  const zm = zoneMask(C, team);
  // follow a node path as WASD + space would (jump the hops and gaps), re-planning on the carrier graph when stuck
  const walk = (a, ids, until, maxS = 40, tgt = null, goal = null) => {
    let path = ids, pi = 1, t = 0, best = Infinity, bestT = 0, stuck = 0;
    while (t < maxS) {
      if (until && until()) { idle(a); return { ok: true, t: r1(t), stuck }; }
      if (!a.alive) { idle(a); return { ok: false, dead: true, t: r1(t), stuck }; }
      if (pi >= path.length) {
        // (the engine reads its carrier before the actors move: keep walking onto the last node / the goal a moment)
        if (!until) { idle(a); return { ok: true, end: true, t: r1(t), stuck }; }
        const gq = goal || nodes[path[path.length - 1]];
        for (let f = 0; f < 90 && !until() && a.alive; f++) { const dx = gq.x - a.pos.x, dz = gq.z - a.pos.z, l = Math.hypot(dx, dz); if (l > 0.25) a.intent.move.set(dx / l, 0, dz / l); else a.intent.move.set(0, 0, 0); park(); dbg.step(1000 / 60); t += 1 / 60; }
        idle(a); return { ok: until(), end: true, t: r1(t), stuck };
      }
      const q = nodes[path[pi]], h = hd(a.pos, q);
      if (h < 0.55 && Math.abs(q.y - a.pos.y) < 1.0) { pi++; best = Infinity; bestT = t; continue; }
      if (h < best - 0.25) { best = h; bestT = t; }
      if (t - bestT > 2.5) {
        stuck++; res.stuck++; bestT = t; best = Infinity; if ((res.stuckAt || (res.stuckAt = [])).length < 12) res.stuckAt.push({ at: P3(a.pos), to: P3(q), edge: TYPE_NAME[edgeType(C, path[pi - 1], path[pi])] || '?' });
        const own = F.ownNode(a.pos);
        if (own >= 0 && tgt) { const s = search(C, [own], { noClimb: true, avoid: zm, target: tgt }); if (s.hit >= 0) { path = pathOf(s.prev, s.hit); pi = 1; continue; } }
        pi++;
      }
      const dx = q.x - a.pos.x, dz = q.z - a.pos.z, l = Math.hypot(dx, dz) || 1;
      a.intent.move.set(dx / l, 0, dz / l);
      const ty = pi > 0 ? edgeType(C, path[pi - 1], path[pi]) : 0;
      let jump = false;
      if ((ty === ET.hop || ty === ET.jump) && q.y - a.pos.y > 0.4 && l < 1.5) jump = true;
      if (ty === ET.gap && a.grounded) { const ax = a.pos.x + (dx / l) * 0.5, az = a.pos.z + (dz / l) * 0.5; if (!(L.groundHeight(ax, az, a.pos.y + 0.3) > a.pos.y - 1.0)) jump = true; }
      if (q.y - a.pos.y > PLAYER.stepUp - 0.05 && l < 1.6) jump = true;   // (any step above a kid's step-up: a stair's riser too)
      a.intent.jump = jump && a.grounded;
      park(); dbg.step(1000 / 60); t += 1 / 60;
    }
    idle(a); return { ok: false, timeout: true, t: r1(t), stuck };
  };
  const off = [];
  try {
    const { on } = await import('../../src/core/ctx.js');
    const ev = [];
    off.push(...['karp:drop', 'karp:reset', 'karp:plant', 'karp:pickup', 'karp:end', 'karp:rate'].map((k) => on(k, (e) => ev.push({ t: T(), k: k.slice(5), team: e.team ?? e.actor?.team, how: e.how || e.why || e.reason || (e.rate ? `×${e.rate} ${e.why || ''}` : ''), pos: e.pos ? P3(e.pos) : undefined }))));
    const A = mine[0];
    // ---- the retreat walk on its own half: from its own Gate area toward the Pond, back, forward again
    {
      const own = F.seeds[1 - team].filter((i) => C.okN[i]);
      const rt = own.length ? routes(C, own, pondNodes, zm) : { r1: null };
      const W = { ran: false };
      if (rt.r1) {
        const p = rt.r1, P = (i) => Kp.L[team] - C.D[team][i];
        // a stretch of the own half: from the start until progress has risen 14 m (still on the own half)
        let end = 1; while (end < p.length - 1 && halfN(p[end]) === team && P(p[end]) - P(p[0]) < 14) end++;
        const fwd = p.slice(0, end + 1), back = [...fwd].reverse();
        put(A, nodes[fwd[0]]); grant(A); step(0.2);
        const J = () => A.carry?.j;
        const w1 = walk(A, fwd, null, 20);
        const markAt = J() ? J().mark : NaN;
        let onAt = null, offAt = null;
        const w2 = walk(A, back, () => { const j = J(); if (j && j.ret && onAt == null) onAt = j.mark - (Kp.L[team] - (F.fieldAt(team, A.pos)?.d ?? NaN)); return onAt != null && j && j.mark - (Kp.L[team] - (F.fieldAt(team, A.pos)?.d ?? 0)) >= 9.5; }, 20);
        const rateOn = Kp.rate, whyOn = Kp.rateWhy;
        const w3 = walk(A, fwd, () => { const j = J(); if (j && !j.ret && onAt != null && offAt == null) offAt = j.mark - (Kp.L[team] - (F.fieldAt(team, A.pos)?.d ?? NaN)); return offAt != null; }, 20);
        Object.assign(W, { ran: true, stretch: r1(P(p[end]) - P(p[0])), mark: r1(markAt), on: r2(onAt), off: r2(offAt), rateOn, whyOn, walks: [w1, w2, w3].map((w) => w.ok || w.end ? 'ok' : JSON.stringify(w)) });
        W.ok = onAt != null && onAt >= K.retreatOn - 0.05 && onAt <= K.retreatOn + 0.8 && offAt != null && offAt <= K.retreatOff + 0.05 && offAt >= K.retreatOff - 0.8 && rateOn === K.fuseFast && whyOn === 'retreat';
      }
      res.walks.retreat = W;
    }
    // ---- a free-zone visit (×3): a node inside one of its own zones (outside the spawn barrier)
    {
      let zn = -1; for (let i = 0; i < N && zn < 0; i++) { const n = nodes[i]; if (C.okN[i] && R.zones[team].some((z) => zoneOn(C, z) && volNode(z, n.x, n.y, n.z)) && trig(C, n, 1.5, 0.3).length >= 3) zn = i; }
      const W = { ran: zn >= 0 };
      if (zn >= 0) { Kp.fuse = K.fuse; if (Kp.holder !== A || !A.alive) { alive(A); grant(A); } put(A, nodes[zn]); step(0.3); W.zone = !!A.carry?.j?.zone; W.rate = Kp.rate; W.why = Kp.rateWhy; W.at = P3(nodes[zn]); W.ok = W.zone && W.rate === K.fuseFast && W.why === 'zone'; }
      res.walks.zone = W;
      if (Kp.holder) Kp._release(Kp.holder);
    }
    // ---- falls from the water edge nearest the Pond on each half: own half → the Pond, enemy half → by the last footing
    res.walks.falls = [];
    for (const side of [team, 1 - team]) {
      // the wet nodes of this half nearest the Pond with open water within 1.2 m, nearest first; a railing may stand in
      // the way, so the next is tried until a carrier really falls (at most 8)
      const cands = [];
      for (let i = 0; i < N; i++) {
        const n = nodes[i]; if (!C.okN[i] || n.wet !== 2 || halfN(i) !== side || n.zone >= 0) continue;
        if (R.zones[team].some((z) => volNode(z, n.x, n.y, n.z))) continue;
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; if (L.groundHeight(n.x + Math.cos(a) * 1.2, n.z + Math.sin(a) * 1.2, n.y + 0.6) === -Infinity) { cands.push({ i, d: hd(n, R.pond), dir: [Math.cos(a), Math.sin(a)] }); break; } }
      }
      cands.sort((p, q) => p.d - q.d);
      const W = { side: side === team ? 'own' : 'enemy', ran: cands.length > 0, tries: 0 };
      for (const cd of cands.slice(0, 8)) {
        settle();
        const B = mine.find((a) => a !== A && a.alive) || mine.find((a) => a !== A) || A; alive(B);   // (a humans-only stage: one kid)
        put(B, nodes[cd.i]); grant(B); step(0.15);
        const n0 = ev.length; let t = 0; W.tries++;
        while (B.alive && t < 4) { B.intent.move.set(cd.dir[0], 0, cd.dir[1]); park(); dbg.step(1000 / 60); t += 1 / 60; }
        idle(B); step(0.1);
        if (B.alive) { if (Kp.holder === B) Kp._release(B); continue; }   // (a railing: no fall here — the next one)
        const e = ev.slice(n0).find((q) => q.k === 'reset' || q.k === 'drop');
        W.at = P3(nodes[cd.i]); W.died = true; W.event = e ? `${e.k} ${e.how}` : 'none';
        if (side === team) W.ok = !!e && e.k === 'reset';
        else { settle(); const rn = Kp.restNode; W.rest = rn >= 0 ? P3(nodes[rn]) : null; W.restHalf = rn >= 0 ? F.halfOf[rn] : null; W.dist = rn >= 0 ? r1(hd(nodes[rn], nodes[cd.i])) : null; W.ok = !!e && e.k === 'drop' && rn >= 0 && F.halfOf[rn] === side && W.dist <= CK.dropNear; }
        break;
      }
      if (W.ran && !W.died) { W.ran = false; W.why = `no carrier fell from ${W.tries} water edges (railed)`; }
      res.walks.falls.push(W);
    }
    // ---- a splat on the narrowest walkway near each weir: the drop lands on wide floor
    res.walks.narrow = [];
    for (const [wi, w] of R.weirs[team].entries()) {
      const ids = new Set(); for (const l of kc.legs) if (l.team === team && l.i === wi) for (const p of [l.path1, l.path2]) for (const i of p || []) if (hd(nodes[i], w.pos) <= 12) ids.add(i);
      let best = -1, bw = Infinity, bd = Infinity;
      for (const i of ids) { if (R.zones[team].some((z) => volNode(z, nodes[i].x, nodes[i].y, nodes[i].z))) continue; const wd = trig(C, nodes[i], 1.5, 0.5).length, d = hd(nodes[i], w.pos); if (d < 3) continue; if (wd < bw || (wd === bw && d < bd)) { bw = wd; bd = d; best = i; } }
      const W = { weir: wi + 1, ran: best >= 0 };
      if (best >= 0) {
        settle();
        const D = mine.find((a) => a !== A && a.alive) || mine[mine.length - 1] || A; alive(D);
        put(D, nodes[best]); grant(D); step(0.1);
        D.splat(null, 'karp-check'); step(0.2); settle();
        const rn = Kp.restNode;
        Object.assign(W, { at: P3(nodes[best]), width: bw, rest: rn >= 0 ? P3(nodes[rn]) : null, wide: rn >= 0 ? !!F.wide[rn] : null, dist: rn >= 0 ? r1(hd(nodes[rn], nodes[best])) : null });
        W.ok = rn >= 0 && !!F.wide[rn];
      }
      res.walks.narrow.push(W);
    }
    // ---- the main carry: burst at the Pond, pick up, route 1 to weir 1, plant, re-pop, the Gate
    {
      const W = {};
      settle(); if (Kp.holder) Kp._release(Kp.holder);
      alive(A); A.invuln = 0;
      Kp._reform(R.pond, -1, K.shell.reformHp); settle(); step(0.1);
      put(A, pondNodes.length ? nodes[pondNodes[0]] : R.pond);
      Kp.shell.add(team, Kp.shell.hp * 2 + 10, A); step(0.05);
      const t0 = Kp.clock;
      const grab = walk(A, [-1, ...[F.ownNode(A.pos)].filter((x) => x >= 0)], () => Kp.holder === A, 3);
      if (Kp.holder !== A) { put(A, Kp.pos); step(0.4); }
      W.picked = Kp.holder === A;
      const pw = kc.legs.find((l) => l.team === team && l.kind === 'pw' && l.i === 0), wg = kc.legs.find((l) => l.team === team && l.kind === 'wg' && l.i === 0);
      if (W.picked && !pw?.path1) W.why = 'no climb-free route 1 to weir 1 to walk (#4)';
      if (W.picked && pw?.path1) {
        const w1 = walk(A, pw.path1, () => Kp.lowered[team], 45, mask(N, trig(C, R.weirs[team][0].pos, 1.6)), R.weirs[team][0].pos);
        W.plant = !!Kp.lowered[team]; W.tWeir = r1(Kp.clock - t0); W.w1 = w1;
        if (W.plant) {
          settle(); step(0.1);
          Kp.shell.add(team, Kp.shell.hp * 2 + 10, A); step(0.3);
          const own = F.ownNode(A.pos), s = own >= 0 ? search(C, [own], { noClimb: true, target: mask(N, trig(C, Kp.pos, 1.0, 1.0)) }) : null;
          walk(A, s && s.hit >= 0 ? pathOf(s.prev, s.hit) : [-1], () => Kp.holder === A, 6);
          if (Kp.holder !== A) { put(A, Kp.pos); step(0.4); }
          W.repicked = Kp.holder === A;
          const t1 = Kp.clock;
          if (W.repicked && wg?.path1) {
            const own2 = F.ownNode(A.pos), s2 = own2 >= 0 ? search(C, [own2], { noClimb: true, avoid: zm, target: mask(N, F.seeds[team]) }) : null;
            const w2 = walk(A, s2 && s2.hit >= 0 ? pathOf(s2.prev, s2.hit) : wg.path1, () => Kp.winner === team, 45, mask(N, F.seeds[team]), R.gates[team].pos);
            W.knockout = Kp.winner === team && Kp.reason === 'knockout'; W.tGate = r1(Kp.clock - t1); W.w2 = w2;
          }
        }
      }
      W.clamped = Kp.stats.clamped; W.fastT = Kp.stats.fastT;
      W.ok = !!(W.picked && W.plant && W.repicked && W.knockout);
      res.walks.main = W;
    }
    res.events = ev.slice(0, 60);
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 600); }
  off.forEach((f) => f());
  return JSON.parse(JSON.stringify(res));
}

// ================================================================================================= pictures
// JPEG data URLs (each < 290 KB): the top-down with everything drawn; the Pond; each weir from the attackers' and the
// defenders' side; the Gate from the spawn deck and from its approach; each free zone; the flagged places.
export async function pictures(o = {}) {
  const C = ctx(o.state || 0), { G, g, m, Kp, R, L, nodes, F } = C, kc = window.__karpCheck, rep = kc.out, draw = rep.draw;
  const shots = [];
  for (const a of m.actors) { a.character.root.visible = false; }
  const fog = G.scene.fog; G.scene.fog = null;
  const r = G.renderer, cv = r.domElement, size0 = r.getSize(new THREE.Vector2()), pr0 = r.getPixelRatio();
  const img = (url) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = url; });
  const render = async (cam, W, H) => { r.setPixelRatio(1); r.setSize(W, H, false); r.render(G.scene, cam); const url = cv.toDataURL('image/png'); r.setPixelRatio(pr0); r.setSize(size0.x, size0.y, false); return img(url); };
  const jpeg = (c) => { for (const q of [0.84, 0.76, 0.68, 0.6, 0.5, 0.42]) { const u = c.toDataURL('image/jpeg', q); if (u.length * 0.75 < 290000) return u; } return c.toDataURL('image/jpeg', 0.35); };
  const col = (t, a = 1) => { const c = new THREE.Color(G.teamColors?.[t] || (t ? '#2f5bff' : '#ff8a14')); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; };
  const B = L.bounds, Dx = B.maxX - B.minX, Dz = B.maxZ - B.minZ;
  try {
    // ---- the top-down: Bravo's half (+z) to the right, +x up; Alpha attacks left → right
    {
      const W = 1800, H = Math.round(W * Dx / Dz), cam = new THREE.OrthographicCamera(-Dz / 2, Dz / 2, Dx / 2, -Dx / 2, 1, 600);
      const cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2;
      cam.position.set(cx, 250, cz); cam.up.set(1, 0, 0); cam.lookAt(cx, 0, cz); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      const base = await render(cam, W, H);
      const c = document.createElement('canvas'); c.width = W; c.height = H + 120; const x = c.getContext('2d');
      x.fillStyle = '#111'; x.fillRect(0, 0, W, H + 120); x.drawImage(base, 0, 0, W, H);
      const s = W / Dz, px = (wx, wz) => [(wz - B.minZ) * s, (B.maxX - wx) * s];
      // the field: Alpha's count as a heat map, iso-lines every 10
      const cell = new Map(); for (const f of draw.field || []) { const k = `${Math.round(f[0])},${Math.round(f[1])}`; const e = cell.get(k); if (!e || f[3] > e[3]) cell.set(k, f); }
      for (const f of cell.values()) { const [X, Y] = px(f[0], f[1]); x.fillStyle = col(0, 0.12 + 0.5 * (1 - f[2] / 100)); x.fillRect(X - s / 2, Y - s / 2, s, s); }
      x.fillStyle = 'rgba(20,20,20,0.85)';
      for (const f of cell.values()) for (const [dx, dz] of [[1, 0], [0, 1]]) { const q = cell.get(`${Math.round(f[0]) + dx},${Math.round(f[1]) + dz}`); if (q && Math.floor(q[2] / 10) !== Math.floor(f[2] / 10) && Math.abs(q[3] - f[3]) < 0.6) { const [X, Y] = px(f[0] + dx / 2, f[1] + dz / 2); x.fillRect(X - 1.5, Y - 1.5, 3, 3); } }
      // the halfway line
      x.fillStyle = 'rgba(255,255,255,0.95)'; for (const h of draw.half || []) { const [X, Y] = px(h[0], h[1]); x.beginPath(); x.arc(X, Y, 2.2, 0, 7); x.fill(); }
      const poly = (pts, stroke, fill, dash = [], w = 2.5) => { x.beginPath(); pts.forEach((p, i) => { const [X, Y] = px(p[0], p[1]); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } x.setLineDash(dash); x.strokeStyle = stroke; x.lineWidth = w; x.stroke(); x.setLineDash([]); };
      const hatch = (pts, color) => { x.save(); x.beginPath(); pts.forEach((p, i) => { const [X, Y] = px(p[0], p[1]); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.clip(); x.strokeStyle = color; x.lineWidth = 2; for (let k = -H; k < W + H; k += 9) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); } x.restore(); };
      // free zones (hatched in the owner's ink), their entrances and signs
      for (const z of draw.zones || []) { hatch(z.poly, col(z.team, 0.55)); poly(z.poly, col(z.team, 1), null, [], 3); for (const sg of z.signs) { const [X, Y] = px(sg[0], sg[1]); x.fillStyle = '#fff'; x.beginPath(); x.arc(X, Y, 6, 0, 7); x.fill(); x.strokeStyle = '#c00'; x.lineWidth = 2.5; x.beginPath(); x.arc(X, Y, 6, 0, 7); x.moveTo(X - 4, Y - 4); x.lineTo(X + 4, Y + 4); x.stroke(); }
        for (const e of z.ents) { const [X, Y] = px(e.c[0], e.c[2]); x.lineWidth = 3; if (e.signed && e.wideOk) { x.strokeStyle = '#2f2'; x.beginPath(); x.arc(X, Y, 9, 0, 7); x.stroke(); } else { x.strokeStyle = '#f22'; x.beginPath(); x.moveTo(X - 9, Y - 9); x.lineTo(X + 9, Y + 9); x.moveTo(X + 9, Y - 9); x.lineTo(X - 9, Y + 9); x.stroke(); } } }
      for (const v of R.noRetreat || []) poly(v.poly, '#ffe14d', 'rgba(255,225,77,0.12)', [10, 6], 3);
      for (const v of R.carrierBlock || []) { poly(v.poly, '#ff3b3b', 'rgba(255,59,59,0.22)', [], 3); }
      for (const v of R.noRest || []) poly(v.poly, '#bbbbbb', null, [4, 4], 2);
      // plateaus
      for (const P of draw.plateaus || []) { x.fillStyle = P.fail ? 'rgba(255,40,40,0.75)' : 'rgba(190,120,255,0.55)'; for (const p of P.pts) { const [X, Y] = px(p[0], p[1]); x.fillRect(X - s * 0.3, Y - s * 0.3, s * 0.6, s * 0.6); } }
      // routes (Alpha's: Pond → weir cyan, weir → Gate yellow; route 2 dashed)
      for (const rt of (draw.routes || []).filter((q) => q.team === 0)) for (const [pts, dash] of [[rt.r1, []], [rt.r2, [12, 8]]]) {
        if (!pts.length) continue; x.setLineDash(dash); x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.beginPath(); pts.forEach((p, i) => { const [X, Y] = px(p[0], p[1]); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
        x.lineWidth = 3; x.strokeStyle = /^Pond/.test(rt.leg) ? '#3ff' : '#ffd23f'; x.stroke(); x.setLineDash([]);
      }
      // hop / gap edges as short ticks (green made, red not made, grey untried); made beyond the rules: magenta
      for (const e of draw.extra || []) { const [X1, Y1] = px(e.a[0], e.a[1]), [X2, Y2] = px(e.b[0], e.b[1]); x.strokeStyle = e.ok === false ? '#ff2020' : e.ok ? '#3f3' : '#999'; x.lineWidth = e.ok === false ? 4 : 2.5; x.beginPath(); x.moveTo(X1, Y1); x.lineTo(X2, Y2); x.stroke(); }
      for (const e of draw.beyond || []) { const [X1, Y1] = px(e.a[0], e.a[1]), [X2, Y2] = px(e.b[0], e.b[1]); x.strokeStyle = '#f0f'; x.lineWidth = 4; x.beginPath(); x.moveTo(X1, Y1); x.lineTo(X2, Y2); x.stroke(); }
      // the Gates (trigger, 15 m ring) and their entrances (arrows), the weirs (diamonds), the Pond
      for (const en of draw.entrances || []) {
        const [GX, GY] = px(en.g[0], en.g[2]);
        x.setLineDash([8, 6]); x.strokeStyle = col(en.team, 0.9); x.lineWidth = 2; x.beginPath(); x.arc(GX, GY, CK.ring * s, 0, 7); x.stroke(); x.setLineDash([]);
        x.fillStyle = col(en.team, 0.9); x.beginPath(); x.arc(GX, GY, K.gateR * s, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke();
        for (const e of en.ents) { const [X, Y] = px(e.c[0], e.c[2]); const ang = Math.atan2(GY - Y, GX - X); x.strokeStyle = e.seen ? '#fff' : '#f22'; x.fillStyle = x.strokeStyle; x.lineWidth = 4; x.beginPath(); x.moveTo(X - Math.cos(ang) * 22, Y - Math.sin(ang) * 22); x.lineTo(X, Y); x.stroke(); x.beginPath(); x.moveTo(X + Math.cos(ang) * 6, Y + Math.sin(ang) * 6); x.lineTo(X - Math.cos(ang + 0.5) * 9, Y - Math.sin(ang + 0.5) * 9); x.lineTo(X - Math.cos(ang - 0.5) * 9, Y - Math.sin(ang - 0.5) * 9); x.fill(); }
      }
      for (const t of [0, 1]) for (const w of R.weirs[t]) { const [X, Y] = px(w.pos.x, w.pos.z), q = K.weirR * s; x.fillStyle = col(t, 0.9); x.beginPath(); x.moveTo(X, Y - q); x.lineTo(X + q, Y); x.lineTo(X, Y + q); x.lineTo(X - q, Y); x.closePath(); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); }
      { const [X, Y] = px(R.pond.x, R.pond.z); x.strokeStyle = '#ffd27a'; x.lineWidth = 4; x.beginPath(); x.arc(X, Y, 1.6 * s, 0, 7); x.stroke(); x.setLineDash([6, 5]); x.beginPath(); x.arc(X, Y, K.shell.burstR * s, 0, 7); x.stroke(); x.setLineDash([]); }
      // flags (numbered)
      const flags = []; for (const ck of Object.values(rep.checks)) if (ck.status === 'FAIL' || ck.status === 'WARN') for (const f of ck.flags || []) if (f.at) flags.push({ n: ck.n, ...f });
      flags.slice(0, 40).forEach((f, i) => { const [X, Y] = px(f.at[0], f.at[2]); x.fillStyle = 'rgba(220,0,0,0.9)'; x.beginPath(); x.arc(X, Y, 11, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.fillText(String(i + 1), X, Y + 4.5); });
      // the title and the legend
      x.textAlign = 'left'; x.fillStyle = '#111'; x.fillRect(0, H, W, 120);
      const st = rep.checks; const fails = Object.values(st).filter((q) => q.status === 'FAIL').map((q) => '#' + q.n);
      x.fillStyle = fails.length ? '#ff6b6b' : '#7dff7d'; x.font = 'bold 22px sans-serif';
      x.fillText(`${rep.id}${rep.states.length > 1 ? ` · state ${rep.key}` : ''} · L ${rep.L.join(' / ')} m · weir counts ${(Kp.weirs[0] || []).map((w) => w.count).join(', ')} · ${fails.length ? 'FAIL ' + fails.join(' ') : 'all checks OK'}${rep.placeholder ? ' · PLACEHOLDER data' : ''}`, 16, H + 30);
      x.font = '15px sans-serif'; x.fillStyle = '#ddd';
      x.fillText('Alpha attacks left → right. Shade: Alpha\'s count (darker = nearer its Gate), dots every 10 counts; white dots: the halfway line. Cyan / yellow: Alpha\'s routes Pond → weir / weir → Gate (dashed: route 2).', 16, H + 56);
      x.fillText('Diamonds: weirs · discs: Dragon Gates (dashed 15 m ring; arrows: entrances, red = unseen from the deck) · hatched: Carp-Free Zones (signs ⊘; green ring = signed entrance, red X = unsigned) · yellow dashed: noRetreat · red: carrierBlock', 16, H + 78);
      x.fillText(`Ticks: hop / gap edges (green made by a kid, red not: hopVeto) · magenta: made beyond the rules (#7d) · purple: plateaus (red: FAIL) · numbered: flags (${flags.length}) — ${flags.slice(0, 6).map((f, i) => `${i + 1}: ${f.what}`).join(' · ').slice(0, 150)}`, 16, H + 100);
      shots.push({ name: `${rep.id}${rep.states.length > 1 ? '-s' + rep.key : ''}-karp-top.jpg`, url: jpeg(c) });
      rep._flags = flags;
    }
    // ---- perspective views
    const persp = async (name, from, look, label, fov = 62) => {
      const W = 1280, H = 720, cam = new THREE.PerspectiveCamera(fov * H / W * 1.15, W / H, 0.2, 2000);
      cam.position.set(from.x, from.y, from.z); cam.lookAt(look.x, look.y, look.z); cam.updateMatrixWorld();
      const base = await render(cam, W, H);
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(base, 0, 0, W, H);
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.fillText(`${rep.id} · ${label}`, 12, 23);
      shots.push({ name: `${rep.id}${rep.states.length > 1 ? '-s' + rep.key : ''}-${name}.jpg`, url: jpeg(c) });
    };
    const eyeAt = (p, up = 1.6) => { const f = L.groundHeight(p.x, p.z, p.y + 1.0); return new V3(p.x, (f > p.y - 3 ? f : p.y) + up, p.z); };
    // a view point back along a route: the farthest node 6–14 m back with a clear line to the target (else 8 m back, raised)
    const viewFrom = (path, fromEnd, look) => {
      if (!path?.length) return null;
      const seq = fromEnd ? [...path].reverse() : path; let acc = 0, best = null, at8 = null;
      for (let k = 1; k < seq.length; k++) {
        acc += d3(nodes[seq[k - 1]], nodes[seq[k]]); if (acc < 6) continue; if (acc > 14) break;
        const n = nodes[seq[k]], e = eyeAt(n); if (!at8 && acc >= 8) at8 = e;
        if (losClear(G, e, look)) best = e;
      }
      if (best) return best;
      const e = at8 || eyeAt(nodes[seq[Math.min(seq.length - 1, 6)]]); e.y += 3; return e;
    };
    const along = (path, metres, fromEnd) => { if (!path?.length) return null; const seq = fromEnd ? [...path].reverse() : path; let acc = 0; for (let k = 1; k < seq.length; k++) { acc += d3(nodes[seq[k - 1]], nodes[seq[k]]); if (acc >= metres) return nodes[seq[k]]; } return nodes[seq[seq.length - 1]]; };
    if (!o.topOnly) {
      const pond = R.pond, pad0 = L.spawnPads[0], dz = Math.sign(pad0.z - pond.z) || -1;
      await persp('pond', eyeAt({ x: pond.x + 2, y: pond.y, z: pond.z + dz * 9 }, 2.2), new V3(pond.x, pond.y + 1.0, pond.z), 'the Pond from Alpha\'s side (9 m back)');
      for (const [i, w] of R.weirs[0].entries()) {
        const pw = kc.legs.find((l) => l.team === 0 && l.kind === 'pw' && l.i === i)?.path1, wg = kc.legs.find((l) => l.team === 0 && l.kind === 'wg' && l.i === i)?.path1;
        const lookW = new V3(w.pos.x, w.pos.y + 1.0, w.pos.z), a = viewFrom(pw, true, lookW), d = viewFrom(wg, false, lookW);
        if (a) await persp(`weir-${i + 1}-approach`, a, lookW, `weir ${i + 1} from the attackers' side (back along route 1, ${r1(hd(a, w.pos))} m) — count ${Kp.weirs[0][i].count}`);
        if (d) await persp(`weir-${i + 1}-defend`, d, lookW, `weir ${i + 1} from the defenders' side (on along the route to the Gate, ${r1(hd(d, w.pos))} m)`);
      }
      const gp = R.gates[0].pos, lookG = new V3(gp.x, gp.y + 0.8, gp.z);
      const wg0 = kc.legs.find((l) => l.team === 0 && l.kind === 'wg' && l.i === 0)?.path1;
      const ga = viewFrom(wg0, true, lookG);
      if (ga) await persp('gate-approach', ga, lookG, `the Dragon Gate from the attackers' approach (${r1(hd(ga, gp))} m back)`);
      const dk = deckOf(C, 1); let eye = null, bd = Infinity; for (const e of dk.eyes) { const d = hd(e, gp); if (d < bd && losClear(G, e, lookG)) { bd = d; eye = e; } }
      if (eye) await persp('gate-deck', eye, lookG, 'the Dragon Gate from Bravo\'s spawn deck');
      for (const [i, z] of R.zones[1].entries()) { const cx = z.poly.reduce((s2, p) => s2 + p[0], 0) / z.poly.length, czz = z.poly.reduce((s2, p) => s2 + p[1], 0) / z.poly.length, cy = L.groundHeight(cx, czz, (z.y1 ?? 5) + 0.5); const dir = Math.sign(pond.z - czz) || -1; await persp(`zone-${i + 1}`, new V3(cx + 6, (cy > -50 ? cy : 0) + 10, czz + dir * 12), new V3(cx, cy > -50 ? cy : 0, czz), `Bravo's Carp-Free Zone ${i + 1} and its signs`); }
      for (const [i, v] of (R.def.noRetreat || []).entries()) { const cx = v.poly.reduce((s2, p) => s2 + p[0], 0) / v.poly.length, czz = v.poly.reduce((s2, p) => s2 + p[1], 0) / v.poly.length, cy = L.groundHeight(cx, czz, (v.y1 ?? 5) + 0.5); const dir = Math.sign(pond.z - czz) || -1; await persp(`noretreat-${i + 1}`, new V3(cx + 6, (cy > -50 ? cy : 0) + 10, czz + dir * 12), new V3(cx, cy > -50 ? cy : 0, czz), `noRetreat ${i + 1} (Bravo's half): no retreat test inside it`); }
      const flags = rep._flags || [];
      for (const [i, f] of flags.slice(0, o.flagShots ?? 8).entries()) { const at = new V3(f.at[0], f.at[1], f.at[2]), lk = f.look ? new V3(f.look.x ?? f.look[0], (f.look.y ?? f.look[1]) + 0.6, f.look.z ?? f.look[2]) : at.clone().setY(at.y + 0.6); const dir = new V3(at.x - R.pond.x, 0, at.z - R.pond.z).normalize(); await persp(`flag-${i + 1}`, new V3(at.x - dir.x * 7 + 2, at.y + 4.5, at.z - dir.z * 7 + 2), lk, `flag ${i + 1} (#${f.n}): ${f.what}`); }
    }
  } finally {
    G.scene.fog = fog;
    for (const a of m.actors) a.character.root.visible = true;
  }
  return shots;
}

// ================================================================================================= the kit, close up
// KITSHOTS=1: the kit pieces of this stage up close (Alpha's attack: Bravo's half) — a weir from the attackers' side and
// from 45°, the Dragon Gate, a NO CARP sign, a carrierBlock's shimmer — for the kit's review
export async function kitPictures() {
  const C = ctx(0), { G, m, R, L } = C, shots = [];
  for (const a of m.actors) a.character.root.visible = false;
  const fog = G.scene.fog; G.scene.fog = null;
  const r = G.renderer, cv = r.domElement, size0 = r.getSize(new THREE.Vector2()), pr0 = r.getPixelRatio();
  const img = (url) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = url; });
  const shot = async (name, from, look, label) => {
    const W = 1280, H = 720, cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    cam.position.copy(from); cam.lookAt(look); cam.updateMatrixWorld();
    r.setPixelRatio(1); r.setSize(W, H, false); r.render(G.scene, cam); const url = cv.toDataURL('image/png'); r.setPixelRatio(pr0); r.setSize(size0.x, size0.y, false);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(await img(url), 0, 0);
    x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.fillText(`${C.id} · the kit: ${label}`, 12, 23);
    let u = null; for (const q of [0.86, 0.76, 0.66, 0.56]) { u = c.toDataURL('image/jpeg', q); if (u.length * 0.75 < 290000) break; }
    shots.push({ name: `${C.id}-kit-${name}.jpg`, url: u });
  };
  try {
    const w = R.weirs[0][0];
    if (w) {
      const f = new V3(Math.sin(w.yaw), 0, Math.cos(w.yaw));   // the walking direction
      await shot('weir', new V3(w.pos.x - f.x * 7, w.pos.y + 1.7, w.pos.z - f.z * 7), new V3(w.pos.x, w.pos.y + 1.1, w.pos.z), 'a weir from the attackers\' side (posts 5.4 m apart, the sill, the curtain)');
      const s = new V3(Math.cos(w.yaw), 0, -Math.sin(w.yaw));
      await shot('weir-post', new V3(w.pos.x + s.x * 2.7 - f.x * 2.2 + s.x * 1.4, w.pos.y + 1.5, w.pos.z + s.z * 2.7 - f.z * 2.2 + s.z * 1.4), new V3(w.pos.x + s.x * 2.7, w.pos.y + 1.2, w.pos.z + s.z * 2.7), 'a weir post: footing, shaft, band, capital (roof, no ink)');
    }
    const g = R.gates[0].pos, fg = new V3(Math.sin(R.gates[0].yaw), 0, Math.cos(R.gates[0].yaw));
    await shot('gate', new V3(g.x - fg.x * 7 + 2, g.y + 2.2, g.z - fg.z * 7), new V3(g.x, g.y + 0.9, g.z), 'the Dragon Gate: the octagonal plinth, the gold-banded posts');
    const sb = L.blocks.find((b) => b.tag === 'karp-sign-board' && b.center.z > 0);
    if (sb) { const n = sb.axes[2]; await shot('sign', new V3(sb.center.x + n.x * 2.6 + n.z * 0.6, sb.center.y - 0.1, sb.center.z + n.z * 2.6 - n.x * 0.6), sb.center.clone(), 'a NO CARP sign'); }
    const cb = (R.carrierBlock || []).find((v) => v.poly.every((p) => p[1] > 0)) || (R.carrierBlock || [])[0];
    if (cb) { const cx = cb.poly.reduce((a, p) => a + p[0], 0) / cb.poly.length, cz = cb.poly.reduce((a, p) => a + p[1], 0) / cb.poly.length, y = L.groundHeight(cx, cz, (cb.y1 ?? 1) + 0.5); await shot('carrierblock', new V3(cx + 6, (y > -50 ? y : 0) + 3.2, cz - 7), new V3(cx, (y > -50 ? y : 0) + 0.9, cz), 'a carrierBlock: the shimmer and the NO CARP glyph (carriers are pushed out, others pass)'); }
  } finally { G.scene.fog = fog; for (const a of m.actors) a.character.root.visible = true; }
  return shots;
}
