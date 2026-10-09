// [b5-karp] The Carp Field (Bazookarp, SPEC §3, §2.7): how far a carrier still has to WALK to each team's Dragon Gate,
// along the routes the stage really has — the score, the halfway line, retreat and the drop spot all come from it.
//
//   • the carrier graph: G.nav's valid nodes (spawn zones and carrierBlock volumes dropped) and its walk / jump / drop /
//     climb edges, plus the HOP edges a kid really makes (1.25–1.8 m up, ≤ 1.2 m across: nav.js stops at 1.25) and the
//     GAP edges across open air (1.2–3.0 m, ≤ 0.6 up, one-way down to 3.4 m): §3.2 step 1. Edge lengths per step 2.
//   • D[state][team][node]: a backwards Dijkstra from each Gate's trigger nodes (step 3); L[team] = the Pond's reading.
//   • fieldAt(team, pos): read through the carrier's OWN node (≤ 0.5 m of height, ≤ 0.9 m across, a clear waist line),
//     the minimum over it and its edges' ends, clamped to D[n0] ± |pos − n0| (so no spot reads closer than it is);
//     null with no own node (airborne, climbing, riding: the caller keeps its last value).
//   • states (§3.2 step 6): a stage that changes its routes gives a finite list; every array is precomputed at load and
//     setState swaps them (never a rebuild mid-match). karpbox's test-only second state comes from def.testStates.
//   • the drop spot (§2.7): restOk per state, wide (all 8 neighbour cells level, no water within 2.2 m), clear (lazy:
//     8 rays of 2.3 m at 1.3 m up), and an unbounded ring search on the decision's half.
//
// The layout data (LAYOUT.bazookarp, src/world/bazookarp-data.js) describes ALPHA's attack: its weirs and Gate stand on
// Bravo's half (+z) and its freeZones are Bravo's own; everything is mirrored 180° about the origin for the other team.
// Pure functions over G.nav, G.level and G.physics: the engine, the HUD bar, bots and the checker share one field.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { BAZOOKARP as K } from '../config.js';
import { Hit } from './physics.js';

const V3 = THREE.Vector3;
const _a = new V3(), _d = new V3();
const TYPES = { walk: 1, jump: 2, drop: 3, climb: 4, hop: 5, gap: 6, pipe: 7 };
export const EDGE_TYPES = TYPES;
const INF = Infinity;

// ---------------------------------------------------------------------------------------------- geometry helpers
export function inPoly(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
// a node (its floor height y) inside a { poly, y0, y1 } volume
const volNode = (v, x, y, z) => y >= (v.y0 ?? -50) - 0.25 && y <= (v.y1 ?? 50) + 0.25 && inPoly(v.poly, x, z);
// a player's feet inside one (a hop above the floor still counts)
const volFeet = (v, x, y, z) => y >= (v.y0 ?? -50) - 0.5 && y <= (v.y1 ?? 50) + 1.8 && inPoly(v.poly, x, z);
// the nearest point on a polygon's edge to (x, z) → [x, z, nx, nz] (n: the outward normal there)
function polyEdge(poly, x, z) {
  let best = INF, bx = x, bz = z, nx = 0, nz = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], az = poly[j][1], ex = poly[i][0] - ax, ez = poly[i][1] - az, l2 = ex * ex + ez * ez || 1e-9;
    const u = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2)), px = ax + ex * u, pz = az + ez * u;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) { best = d; bx = px; bz = pz; const l = Math.sqrt(l2); nx = ez / l; nz = -ex / l; }
  }
  // (the outward side: away from the polygon's inside)
  if (inPoly(poly, bx + nx * 0.02, bz + nz * 0.02)) { nx = -nx; nz = -nz; }
  return [bx, bz, nx, nz, best];
}
const mirP = (p) => (p.length === 3 ? [-p[0], p[1], -p[2]] : [-p[0], -p[1]]);
const mirVol = (v) => v && { ...v, poly: v.poly.map((q) => [-q[0], -q[1]]), signs: (v.signs || []).map((s) => [-s[0], -s[1], (s[2] ?? 0) + 180]) };
const xyz = (p) => (p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], y: NaN, z: p[1] });

// ---------------------------------------------------------------------------------------------- the data
// LAYOUT.bazookarp → both teams' pieces in world space. team t's Gate / weirs are the ones t carries to (on the other
// team's half); zones[t] are team t's OWN Carp-Free Zones (on t's half).
export function resolveKarp(def, level) {
  const floorAt = (p, hint) => {
    const y = Number.isFinite(p.y) ? level.groundHeight(p.x, p.z, p.y + 0.5) : level.groundHeight(p.x, p.z, hint);
    return Number.isFinite(y) && y > -50 ? y : Number.isFinite(p.y) ? p.y : 0;
   };
  const padY = level.spawnPads?.[0]?.y ?? 2.4;
  const st = xyz(def.start || [0, 0]);
  const pond = new V3(0, floorAt({ x: 0, y: st.y, z: 0 }, padY + 0.6), 0);
  const weirs = [[], []], zones = [[], []];
  (def.weirs || []).forEach((w, i) => {
    for (const t of [0, 1]) {
      const p = xyz(t === 0 ? w.at : mirP(w.at));
      const y = floorAt(p, padY + 3);
      weirs[t].push({ team: t, index: i, pos: new V3(p.x, y, p.z), yaw: ((w.yaw ?? (t ? 0 : 180)) + (t ? 180 : 0)) * Math.PI / 180, r: w.r || K.weirR });
    }
  });
  const gates = [0, 1].map((t) => {
    const p = xyz(t === 0 ? def.gate.at : mirP(def.gate.at));
    return { team: t, pos: new V3(p.x, floorAt(p, padY + 3), p.z), yaw: ((def.gate.yaw ?? 0) + (t ? 180 : 0)) * Math.PI / 180 };
  });
  for (const z of def.freeZones || []) { zones[1].push({ ...z, owner: 1 }); zones[0].push({ ...mirVol(z), owner: 0 }); }
  const both = (list) => { const out = []; for (const v of list || []) { out.push(v); out.push(mirVol(v)); } return out; };
  const veto = [];
  for (const v of def.hopVeto || []) { veto.push(v); veto.push([-v[0], v[1], -v[2], -v[3], v[4], -v[5]]); }
  return { def, pond, weirs, gates, zones, noRetreat: both(def.noRetreat), carrierBlock: both(def.carrierBlock), noRest: both(def.noRest), hopVeto: veto,
    placeholder: !!def.placeholder, testStates: def.testStates || null };
}

// A stage with no LAYOUT.bazookarp (§4.1): the Pond at the centre; the Gate on the nav route from it toward Bravo's pad,
// 4 m outside the barrier; one weir at half way; a 9 m Carp-Free Zone round each pad's deck (its signs are placed by
// the field at load, at each entrance: KarpField.autoSigns)
export function placeholderKarp(level) {
  const nav = G.nav, pad = level.spawnPads[1], R = (level.spawnBarrier || 4.2) + 4;
  let gate = [pad.x * 0.7, pad.z * 0.7], weir = [pad.x * 0.35, pad.z * 0.35];
  if (nav && nav.validIds?.length) {
    let c = -1, cd = INF, g = -1, gd = INF;
    for (const id of nav.validIds) {
      const n = nav.nodes[id];
      if (n.zone >= 0) continue;
      const dc = Math.hypot(n.x, n.z) + Math.max(0, n.y - 3) * 2;
      if (dc < cd) { cd = dc; c = id; }
      const dp = Math.hypot(n.x - pad.x, n.z - pad.z);
      if (dp >= R && n.wet !== 2) { const v = dp - R + Math.abs(n.y - pad.y) * 0.5; if (v < gd) { gd = v; g = id; } }
    }
    const ids = c >= 0 && g >= 0 ? nav.path(c, g, 0, 30000, true) || nav.path(c, g, 0, 30000, false) : null;
    if (ids && ids.length > 4) {
      const G1 = nav.nodes[ids[ids.length - 1]], W = nav.nodes[ids[Math.floor(ids.length / 2)]];
      gate = [+G1.x.toFixed(2), +G1.y.toFixed(2), +G1.z.toFixed(2)];
      weir = [+W.x.toFixed(2), +W.y.toFixed(2), +W.z.toFixed(2)];
    }
  }
  const circle = (cx, cz, r) => Array.from({ length: 16 }, (_, k) => [+(cx + Math.cos((k / 16) * Math.PI * 2) * r).toFixed(2), +(cz + Math.sin((k / 16) * Math.PI * 2) * r).toFixed(2)]);
  return { placeholder: true, start: [0, 0], weirs: [{ at: weir }], gate: { at: gate }, freeZones: [{ poly: circle(pad.x, pad.z, 9), y0: pad.y - 0.9, y1: pad.y + 6, auto: true }] };
}

// ---------------------------------------------------------------------------------------------- the field
class Heap {
  constructor(n) { this.ids = new Int32Array(Math.max(16, n)); this.pr = new Float32Array(Math.max(16, n)); this.n = 0; }
  push(id, p) {
    if (this.n >= this.ids.length) { const a = new Int32Array(this.ids.length * 2), b = new Float32Array(this.ids.length * 2); a.set(this.ids); b.set(this.pr); this.ids = a; this.pr = b; }
    const ids = this.ids, pr = this.pr; let i = this.n++;
    while (i > 0) { const j = (i - 1) >> 1; if (pr[j] <= p) break; ids[i] = ids[j]; pr[i] = pr[j]; i = j; }
    ids[i] = id; pr[i] = p;
  }
  pop() {
    const ids = this.ids, pr = this.pr, top = ids[0], lid = ids[--this.n], lp = pr[this.n];
    let i = 0; const n = this.n;
    while (n) { const l = 2 * i + 1, r = l + 1; let m = i, mp = lp; if (l < n && pr[l] < mp) { m = l; mp = pr[l]; } if (r < n && pr[r] < mp) { m = r; mp = pr[r]; } if (m === i) break; ids[i] = ids[m]; pr[i] = pr[m]; i = m; }
    if (n) { ids[i] = lid; pr[i] = lp; }
    return top;
  }
}

export class KarpField {
  // R: resolveKarp(...) of the layout; opts.states: [{ key, nodeOk(id) → bool }] (default: one state)
  constructor(R, opts = {}) {
    this.R = R;
    this.nav = G.nav; this.level = G.level; this.physics = G.physics;
    this.state = 0;
    this.stats = { buildMs: 0, hops: 0, gaps: 0, clearRays: 0, maxHopGain: 0 };
    const t0 = performance.now();
    this._graph(opts);
    this._dist();
    this._rest();
    this.stats.buildMs = +(performance.now() - t0).toFixed(1);
    this.signs = this.autoSigns();
  }

  // ---- the carrier graph (all states' union; per-state node masks)
  _graph(opts) {
    const nav = this.nav, N = nav.nodes.length, R = this.R;
    this.N = N;
    const ok = (this.ok = new Uint8Array(N));
    for (let i = 0; i < N; i++) {
      const n = nav.nodes[i];
      if (!nav.valid[i] || n.zone >= 0) continue;
      if (R.carrierBlock.some((v) => volNode(v, n.x, n.y, n.z))) continue;
      ok[i] = 1;
    }
    // states: 0 = the stage as built; more from the stage (opts.states) or karpbox's test-only list (def.testStates)
    const states = [{ key: 0, okN: ok }];
    for (const s of opts.states || []) { const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = ok[i] && s.nodeOk(i) ? 1 : 0; states.push({ key: s.key, okN: m }); }
    for (const ts of R.testStates || []) {
      const m = new Uint8Array(N);
      for (let i = 0; i < N; i++) { const n = nav.nodes[i]; m[i] = ok[i] && !(ts.remove || []).some((v) => volNode(v, n.x, n.y, n.z) || volNode(mirVol(v), n.x, n.y, n.z)) ? 1 : 0; }
      states.push({ key: ts.key ?? states.length, okN: m });
    }
    this.states = states;
    // forward edges (CSR): nav's own, then the hops and gaps
    const from = [], to = [], len = [], type = [];
    const push = (a, b, l, t) => { from.push(a); to.push(b); len.push(l); type.push(t); };
    for (let i = 0; i < N; i++) {
      if (!ok[i]) continue;
      const n = nav.nodes[i];
      for (const e of n.nb) {
        if (!ok[e.to]) continue;
        const m = nav.nodes[e.to], flat = Math.hypot(m.x - n.x, m.z - n.z), dy = m.y - n.y;
        let t = TYPES[e.type] || 0, l;
        if (t === TYPES.walk) l = Math.hypot(flat, dy);
        else if (t === TYPES.jump) l = flat + Math.abs(dy);
        else if (t === TYPES.drop) l = flat + 0.5 * Math.abs(dy);
        else if (t === TYPES.climb) l = flat + Math.max(0, dy);
        else if (t === TYPES.pipe) { if (!e.carp) continue; l = e.len || flat; }   // (aquarium: only legs open to carriers)
        else continue;
        push(i, e.to, l, t);
      }
    }
    this._extraEdges(push);
    const E = from.length;
    const fs = (this.fs = new Int32Array(N + 1)), ft = (this.ft = new Int32Array(E)), fl = (this.fl = new Float32Array(E)), fy = (this.fy = new Uint8Array(E));
    for (let k = 0; k < E; k++) fs[from[k] + 1]++;
    for (let i = 0; i < N; i++) fs[i + 1] += fs[i];
    const fill = fs.slice(0, N);
    for (let k = 0; k < E; k++) { const p = fill[from[k]]++; ft[p] = to[k]; fl[p] = len[k]; fy[p] = type[k]; }
    // reverse (for the backwards Dijkstra)
    const rs = (this.rs = new Int32Array(N + 1)), rt = (this.rt = new Int32Array(E)), rl = (this.rl = new Float32Array(E)), ry = (this.ry = new Uint8Array(E));
    for (let k = 0; k < E; k++) rs[to[k] + 1]++;
    for (let i = 0; i < N; i++) rs[i + 1] += rs[i];
    const rfill = rs.slice(0, N);
    for (let k = 0; k < E; k++) { const p = rfill[to[k]]++; rt[p] = from[k]; rl[p] = len[k]; ry[p] = type[k]; }
    this.E = E;
  }

  _veto(n, m) {
    for (const v of this.R.hopVeto) {
      const d1 = Math.hypot(v[0] - n.x, v[2] - n.z) + Math.abs(v[1] - n.y), d2 = Math.hypot(v[3] - m.x, v[5] - m.z) + Math.abs(v[4] - m.y);
      if (d1 < 0.7 && d2 < 0.7) return true;
    }
    return false;
  }
  _hasNav(n, mid) { for (const e of n.nb) if (e.to === mid) return true; return false; }
  // a nav node in cell (ix, iz) at about height y (−below … +above)
  _floorNode(ix, iz, y, below, above) {
    const nav = this.nav;
    if (ix < 0 || iz < 0 || ix >= nav.nx || iz >= nav.nz) return false;
    for (const id of nav.cells[iz * nav.nx + ix]) { const ny = nav.nodes[id].y; if (ny >= y - below && ny <= y + above) return true; }
    return false;
  }
  _rayClear(x0, y0, z0, x1, y1, z1) {
    _a.set(x0, y0, z0); _d.set(x1 - x0, y1 - y0, z1 - z0);
    const l = _d.length(); if (l < 1e-4) return true;
    _d.multiplyScalar(1 / l);
    return !this.physics.raycast(_a, _d, l, this._hit || (this._hit = new Hit()), false).hit;
  }
  // the hop and gap edges (§3.2 step 1): moves a carrier's real jump makes that nav.js has no edge for
  _extraEdges(push) {
    const nav = this.nav, ok = this.ok, H = K.hop, Gp = K.gap, L = this.level;
    const nodes = nav.nodes, nx = nav.nx;
    let hops = 0, gaps = 0;
    const near6 = new Map();   // node → Set of nodes within a 6 m nav walk (lazy, only for gap candidates)
    const walk6 = (id) => {
      let s = near6.get(id);
      if (s) return s;
      s = new Map([[id, 0]]);
      const q = [[id, 0]];
      while (q.length) {
        q.sort((a, b) => a[1] - b[1]);
        const [k, d] = q.shift();
        if (d > (s.get(k) ?? INF)) continue;
        const n = nodes[k];
        for (const e of n.nb) {
          if (!ok[e.to] || e.type === 'climb') continue;
          const m = nodes[e.to], nd = d + Math.hypot(m.x - n.x, m.z - n.z, m.y - n.y);
          if (nd > Gp.walkMin || nd >= (s.get(e.to) ?? INF)) continue;
          s.set(e.to, nd); q.push([e.to, nd]);
        }
      }
      near6.set(id, s);
      return s;
    };
    for (let i = 0; i < nodes.length; i++) {
      if (!ok[i]) continue;
      const n = nodes[i];
      // hops: an orthogonal neighbour cell's node 1.25–1.8 m up
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = n.ix + dx, jz = n.iz + dz;
        if (jx < 0 || jz < 0 || jx >= nx || jz >= nav.nz) continue;
        for (const mid of nav.cells[jz * nx + jx]) {
          if (!ok[mid]) continue;
          const m = nodes[mid], rise = m.y - n.y;
          if (rise < H.riseMin || rise > H.riseMax) continue;
          if (Math.hypot(m.x - n.x, m.z - n.z) > H.flatMax || this._hasNav(n, mid)) continue;
          if (nav._blocked(n, m, m.y)) continue;                                                   // the waist line
          if (!this._rayClear(n.x, n.y + 0.3, n.z, n.x, m.y + H.head, n.z)) continue;            // the head going up
          if (!this._rayClear(n.x, m.y + 1.0, n.z, m.x, m.y + 1.0, m.z)) continue;              // … and across
          if (this._veto(n, m)) continue;
          push(i, mid, Math.hypot(m.x - n.x, m.z - n.z) + rise, TYPES.hop); hops++;
        }
      }
      // gaps: across open air, 1.2–3.0 m
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) + Math.abs(dz) < 2) continue;
        const jx = n.ix + dx, jz = n.iz + dz;
        if (jx < 0 || jz < 0 || jx >= nx || jz >= nav.nz) continue;
        for (const mid of nav.cells[jz * nx + jx]) {
          if (!ok[mid]) continue;
          const m = nodes[mid], flat = Math.hypot(m.x - n.x, m.z - n.z), dy = m.y - n.y;
          if (flat <= Gp.flatMin || flat > Gp.flatMax || dy > Gp.upMax || dy < -Gp.downMax) continue;
          // open air somewhere along the line (cheap: nav cells first, then the floor itself)
          const steps = Math.floor(flat / 0.25);
          let open = false;
          for (let k = 1; k < steps; k++) {
            const u = (k * 0.25) / flat, x = n.x + (m.x - n.x) * u, z = n.z + (m.z - n.z) * u, y = n.y + Math.max(0, dy) * u + Math.min(0, dy) * Math.max(0, u - 0.5) * 2;
            const ix = Math.round((x - nav.x0) / nav.step), iz = Math.round((z - nav.z0) / nav.step);
            if (this._floorNode(ix, iz, y, Gp.airBelow, 0.3)) continue;
            if (L.groundHeight(x, z, y + 0.05) >= y - Gp.airBelow) continue;
            open = true; break;
          }
          if (!open) continue;
          if (nav._blocked(n, m, Math.max(n.y, m.y))) continue;
          if (walk6(i).has(mid)) continue;
          if (this._veto(n, m)) continue;
          push(i, mid, flat + 0.5 * Math.max(0, -dy), TYPES.gap); gaps++;
        }
      }
    }
    this.stats.hops = hops; this.stats.gaps = gaps;
  }

  // ---- distances: per state, per team, the walk to that team's Gate (reversed edges); L = the Pond's reading
  _seeds(t) {
    const g = this.R.gates[t].pos, nav = this.nav, out = [];
    for (let i = 0; i < this.N; i++) {
      if (!this.ok[i]) continue;
      const n = nav.nodes[i];
      if (Math.hypot(n.x - g.x, n.z - g.z) <= K.gateR && Math.abs(n.y - g.y) <= K.trigBand) out.push(i);
    }
    return out;
  }
  _dijkstra(okN, seeds, plain = false) {
    const N = this.N, D = new Float32Array(N).fill(INF), heap = new Heap(N);
    for (const s of seeds) if (okN[s]) { D[s] = 0; heap.push(s, 0); }
    const rs = this.rs, rt = this.rt, rl = this.rl, ry = this.ry;
    while (heap.n) {
      const u = heap.pop(), du = D[u];
      for (let k = rs[u]; k < rs[u + 1]; k++) {
        const v = rt[k];
        if (!okN[v] || (plain && ry[k] >= TYPES.hop && ry[k] <= TYPES.gap)) continue;
        const nd = du + rl[k];
        if (nd < D[v]) { D[v] = nd; heap.push(v, nd); }
      }
      void du;
    }
    return D;
  }
  _dist() {
    this.seeds = [this._seeds(0), this._seeds(1)];
    for (const s of this.states) s.D = [this._dijkstra(s.okN, this.seeds[0]), this._dijkstra(s.okN, this.seeds[1])];
    this.setState(0);
    const p = this.R.pond;
    this.L = [0, 1].map((t) => { const r = this.fieldAt(t, p); return r ? r.d : INF; });
    // the largest gain the hop and gap edges give (the field with them vs without them, both teams, the start state:
    // the checker's number; the tests read it). this.plainD: the field without them (the tests compare)
    this.plainD = [0, 1].map((t) => this._dijkstra(this.states[0].okN, this.seeds[t], true));
    for (let t = 0; t < 2; t++) {
      const D = this.states[0].D[t], P = this.plainD[t];
      for (let i = 0; i < this.N; i++) { const g = P[i] - D[i]; if (Number.isFinite(g) && g > this.stats.maxHopGain) { this.stats.maxHopGain = +g.toFixed(2); this.stats.maxHopAt = i; } }
    }
  }
  setState(s) {
    s = Math.max(0, Math.min(this.states.length - 1, s | 0));
    this.state = s;
    const S = this.states[s];
    this.okN = S.okN; this.D = S.D;
    this.restOk = S.restOk || null;
    this.halfOf = S.halfOf || null;
    return s;
  }
  stateKey() { return this.states[this.state].key; }
  // the state's index for a stage's key (an era number, 'low' / 'high')
  stateOf(key) { const i = this.states.findIndex((s) => s.key === key); return i < 0 ? 0 : i; }

  // ---- reading the field at a point (§3.2): { d, node } or null (no own node: keep the last value)
  ownNode(pos, state = this.state) {
    const nav = this.nav, okN = this.states[state].okN;
    const ix = Math.round((pos.x - nav.x0) / nav.step), iz = Math.round((pos.z - nav.z0) / nav.step);
    let best = -1, bd = INF;
    const cand = this._cand || (this._cand = []);
    cand.length = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const jx = ix + dx, jz = iz + dz;
      if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
      for (const id of nav.cells[jz * nav.nx + jx]) {
        if (!okN[id]) continue;
        const n = nav.nodes[id];
        if (Math.abs(n.y - pos.y) > K.field.n0Dy) continue;
        const h = Math.hypot(n.x - pos.x, n.z - pos.z);
        if (h > K.field.n0R) continue;
        cand.push(h, id);
      }
    }
    // nearest first, the first with a clear waist line
    for (let pass = 0; pass < cand.length / 2; pass++) {
      bd = INF; best = -1; let bk = -1;
      for (let k = 0; k < cand.length; k += 2) if (cand[k] < bd) { bd = cand[k]; best = cand[k + 1]; bk = k; }
      if (best < 0) break;
      const n = nav.nodes[best];
      if (bd < 0.05 || !nav._blocked(n, pos, Math.max(n.y, pos.y))) return best;
      cand[bk] = INF;
    }
    return -1;
  }
  fieldAt(t, pos, out = { d: 0, node: -1 }, state = this.state) {
    const n0 = this.ownNode(pos, state);
    if (n0 < 0) return null;
    const D = this.states[state].D[t], nav = this.nav, n = nav.nodes[n0];
    const d0 = Math.hypot(pos.x - n.x, pos.y - n.y, pos.z - n.z);
    let r = D[n0] + d0;
    const okN = this.states[state].okN;
    for (let k = this.fs[n0]; k < this.fs[n0 + 1]; k++) {
      const m = this.ft[k];
      if (!okN[m]) continue;
      const q = nav.nodes[m], v = D[m] + Math.hypot(pos.x - q.x, pos.y - q.y, pos.z - q.z);
      if (v < r) r = v;
    }
    if (Number.isFinite(D[n0])) r = Math.max(D[n0] - d0, Math.min(D[n0] + d0, r));
    out.d = r; out.node = n0;
    return out;
  }
  // progress of team t at d: L − d (0 at the Pond, L at the Gate)
  progress(t, d) { return this.L[t] - d; }
  count(t, d) { return Math.max(0, Math.min(K.count, Math.ceil((K.count * d) / this.L[t] - 1e-9))); }
  // whose own half (pos): team 0 when D_0 > D_1 (a longer walk to its target Gate than to its own), else 1; -1 unknown
  halfAt(pos) {
    const a = this.fieldAt(0, pos, this._fa || (this._fa = { d: 0, node: -1 })), b = a && this.fieldAt(1, pos, this._fb || (this._fb = { d: 0, node: -1 }));
    if (!a || !b) return -1;
    return a.d > b.d ? 0 : 1;
  }
  // D_0 − D_1 at pos (the half test's margin; NaN with no own node)
  halfMargin(pos) {
    const a = this.fieldAt(0, pos, this._fa || (this._fa = { d: 0, node: -1 })), b = a && this.fieldAt(1, pos, this._fb || (this._fb = { d: 0, node: -1 }));
    return a && b ? a.d - b.d : NaN;
  }
  nodeHalf(id) { const D = this.D; return D[0][id] > D[1][id] ? 0 : 1; }

  // ---- areas
  inFreeZone(team, p) { const zs = this.R.zones[team]; for (let i = 0; i < zs.length; i++) if (this._zoneOn(zs[i]) && volFeet(zs[i], p.x, p.y, p.z)) return i; return -1; }
  _zoneOn(z) { return !z.eras || z.eras.includes(this.stateKey()); }
  inNoRetreat(p) { return this.R.noRetreat.some((v) => volFeet(v, p.x, p.y, p.z)); }
  inCarrierBlock(p) { return this.R.carrierBlock.some((v) => volFeet(v, p.x, p.y, p.z)); }
  // a carrier whose feet are inside a carrierBlock volume: to the nearest point of its edge (+ 0.05 m), the inward
  // part of its velocity removed (others pass: the caller only asks for a carrier)
  pushOutBlock(a) {
    for (const v of this.R.carrierBlock) {
      if (!volFeet(v, a.pos.x, a.pos.y, a.pos.z)) continue;
      const [ex, ez, nx, nz] = polyEdge(v.poly, a.pos.x, a.pos.z);
      a.pos.x = ex + nx * 0.05; a.pos.z = ez + nz * 0.05;
      const vn = a.vel.x * nx + a.vel.z * nz;
      if (vn < 0) { a.vel.x -= nx * vn; a.vel.z -= nz * vn; }
      return true;
    }
    return false;
  }

  // ---- resting spots (§2.7)
  _rest() {
    const nav = this.nav, R = this.R, N = this.N, L = this.level, pads = L.spawnPads, nodes = nav.nodes;
    // whole mover corridors (every node a car can ever cover) and pod plots (+ 1 m)
    const swept = new Uint8Array(N);
    for (const car of G.match?.movers?.cars || []) for (const [, id] of car.nodes || []) swept[id] = 1;
    { const out = []; try { G.match?.stage?.sweeps?.(out); } catch { /* */ } for (const b of out) for (let i = 0; i < N; i++) { const n = nodes[i]; if (n.x >= b[0] && n.x <= b[2] && n.z >= b[1] && n.z <= b[3]) swept[i] = 1; } }
    for (const p of G.match?.pods?.pods || []) for (const id of p.nav || []) {
      const n = nodes[id];
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const jx = n.ix + dx, jz = n.iz + dz;
        if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const m of nav.cells[jz * nav.nx + jx]) if (Math.abs(nodes[m].y - n.y) < 1.2) swept[m] = 1;
      }
    }
    // wide: all 8 neighbour cells hold a node within 0.5 m of this one's height, and no open water within 2.2 m
    const wide = (this.wide = new Uint8Array(N));
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      if (n.wet) continue;
      let all = true;
      for (let dz = -1; dz <= 1 && all; dz++) for (let dx = -1; dx <= 1 && all; dx++) if ((dx || dz) && !this._floorNode(n.ix + dx, n.iz + dz, n.y, 0.5, 0.5)) all = false;
      wide[i] = all ? 1 : 0;
    }
    this.clearC = new Int8Array(N).fill(-1);
    const padR = K.rest.padR, inVol = (list, n) => list.some((v) => volNode(v, n.x, n.y, n.z));
    for (const S of this.states) {
      const ro = new Uint8Array(N), half = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        half[i] = S.D[0][i] > S.D[1][i] ? 0 : 1;
        if (!S.okN[i]) continue;
        const n = nodes[i];
        if (n.zone >= 0 || n.overWater || swept[i]) continue;
        if (pads.some((p) => Math.hypot(n.x - p.x, n.z - p.z) < padR)) continue;
        if (R.gates.some((g) => Math.hypot(n.x - g.pos.x, n.z - g.pos.z) < K.rest.gateR && Math.abs(n.y - g.pos.y) < K.rest.band)) continue;
        if (inVol(R.zones[0], n) || inVol(R.zones[1], n) || inVol(R.noRest, n) || inVol(R.carrierBlock, n)) continue;
        if (!Number.isFinite(S.D[0][i]) || !Number.isFinite(S.D[1][i])) continue;
        ro[i] = 1;
      }
      S.restOk = ro; S.halfOf = half;
    }
    // (bluestone: valid in the current state and every later one — states only advance in a match)
    if (R.def.statesAdvance) for (let s = this.states.length - 2; s >= 0; s--) { const a = this.states[s].restOk, b = this.states[s + 1].restOk; for (let i = 0; i < N; i++) a[i] = a[i] && b[i] ? 1 : 0; }
    this.setState(this.state);
  }
  // no solid geometry within 2.3 m in 8 directions at 1.3 m up (lazy, cached for the match)
  clear(id) {
    let c = this.clearC[id];
    if (c >= 0) return c === 1;
    const n = this.nav.nodes[id];
    c = 1;
    for (let k = 0; k < 8 && c; k++) {
      const a = (k / 8) * Math.PI * 2;
      this.stats.clearRays++;
      if (!this._rayClear(n.x, n.y + 1.3, n.z, n.x + Math.cos(a) * K.rest.clear, n.y + 1.3, n.z + Math.sin(a) * K.rest.clear)) c = 0;
    }
    this.clearC[id] = c;
    return c === 1;
  }
  // the drop spot from p on half h (§2.7): an unbounded ring search; dynOk(id) → false = a dynamic exclusion (a
  // standing weir, an era's danger); state: the rest flags to use (the coming one from a warning on). → node id or -1
  dropSpot(p, h, dynOk = null, state = this.state) {
    const nav = this.nav, S = this.states[state], ro = S.restOk, half = S.halfOf, nodes = nav.nodes;
    const ix0 = Math.round((p.x - nav.x0) / nav.step), iz0 = Math.round((p.z - nav.z0) / nav.step);
    const cands = [];
    let best = INF;
    const maxR = Math.max(nav.nx, nav.nz);
    for (let r = 0; r <= maxR; r++) {
      if ((r - 0.75) * nav.step > best + K.rest.near) break;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const jx = ix0 + dx, jz = iz0 + dz;
        if (jx < 0 || jz < 0 || jx >= nav.nx || jz >= nav.nz) continue;
        for (const id of nav.cells[jz * nav.nx + jx]) {
          if (!ro[id] || (h >= 0 && half[id] !== h)) continue;
          if (dynOk && !dynOk(id)) continue;
          const n = nodes[id], sc = Math.hypot(n.x - p.x, n.z - p.z) + 3 * Math.abs(n.y - p.y);
          cands.push(sc, id);
          if (sc < best) best = sc;
        }
      }
    }
    if (!cands.length) return -1;
    let bw = -1, bwS = INF, bb = -1, bbS = INF, bwc = -1, bwcS = INF;
    for (let k = 0; k < cands.length; k += 2) {
      const sc = cands[k], id = cands[k + 1];
      if (sc > best + K.rest.near) continue;
      if (sc < bbS) { bbS = sc; bb = id; }
      if (this.wide[id] && sc < bwS) { bwS = sc; bw = id; }
    }
    // the best wide and clear one (clear is lazy: test the wide ones from the best up)
    const wides = [];
    for (let k = 0; k < cands.length; k += 2) if (cands[k] <= best + K.rest.near && this.wide[cands[k + 1]]) wides.push([cands[k], cands[k + 1]]);
    wides.sort((a, b) => a[0] - b[0]);
    for (const [sc, id] of wides) if (this.clear(id)) { bwcS = sc; bwc = id; break; }
    void bwS; void bwcS; void bbS;
    return bwc >= 0 ? bwc : bw >= 0 ? bw : bb;
  }

  // ---- zone entrances (§4.4 #9): carrier-graph edges crossing into a zone's volume, chained within 3 m → [x, z]
  zoneEntrances(zone) {
    const nav = this.nav, out = [];
    for (let i = 0; i < this.N; i++) {
      if (!this.ok[i]) continue;
      const n = nav.nodes[i];
      if (volNode(zone, n.x, n.y, n.z)) continue;
      for (let k = this.fs[i]; k < this.fs[i + 1]; k++) {
        const m = nav.nodes[this.ft[k]];
        if (!volNode(zone, m.x, m.y, m.z)) continue;
        const x = m.x, z = m.z;
        const e = out.find((q) => Math.hypot(q.x - x, q.z - z) < 3);
        if (e) { e.pts.push([x, z]); } else out.push({ x, z, pts: [[x, z]] });
      }
    }
    return out.map((e) => { const c = e.pts.reduce((s, q) => [s[0] + q[0], s[1] + q[1]], [0, 0]); return [c[0] / e.pts.length, c[1] / e.pts.length]; });
  }
  // the NO CARP signs: the data's, or (a zone marked auto: the placeholder's) one at each entrance
  autoSigns() {
    const out = [];
    for (const t of [0, 1]) for (const z of this.R.zones[t]) {
      if (z.auto) for (const [x, zz] of this.zoneEntrances(z)) out.push({ team: t, x, z: zz, y: this.level.groundHeight(x, zz, (z.y1 ?? 5) + 0.5), auto: true });
      else for (const s of z.signs || []) out.push({ team: t, x: s[0], z: s[1], yaw: s[2], y: this.level.groundHeight(s[0], s[1], (z.y1 ?? 5) + 0.5) });
    }
    return out;
  }
  // nodes / edges for tests and the TAB map: the hop and gap edges
  extraEdgeList() {
    const out = [], nav = this.nav;
    for (let i = 0; i < this.N; i++) for (let k = this.fs[i]; k < this.fs[i + 1]; k++) {
      const t = this.fy[k];
      if (t !== TYPES.hop && t !== TYPES.gap) continue;
      const a = nav.nodes[i], b = nav.nodes[this.ft[k]];
      out.push({ type: t === TYPES.hop ? 'hop' : 'gap', a: [a.x, a.y, a.z], b: [b.x, b.y, b.z], from: i, to: this.ft[k], len: this.fl[k] });
    }
    return out;
  }
}
