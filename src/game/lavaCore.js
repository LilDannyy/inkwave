// The lava's pure core (Highmark Foundry: tools/botlab/jobs/batch5/stages/caldera/ENGINE.md §3): the schedule, the level
// as a pure function of the stage clock, the sink stones' ease, and the layout data expanded with its 180° twins.
// Three-free and import-free: src/game/lava.js (the engine) and src/world/lava-data.js (check-maps, the thumbnail) both
// read it, in the page and in Node.
export const LAVA = {
  kill: 0.15,        // m above the surface where feet splat (the sea's: fallDeathY − waterY)
  navLead: 0.35,     // a floor nav node is shut from when L reaches node.y − navLead
  soft: 60,          // route cost to enter a node shut at arrival (a floor under lava: only as the way out)
  sPerM: 1 / 5,      // s per metre of route, for a bot's arrival time (a bot painting its way along walks ~5 m/s)
  floorAhead: 4,     // s: a floor node is soft from this long before L reaches node.y − navLead at the arrival time
  escape: [4, 3.5],  // a bot on a floor the lava shuts within escD / [0] + [1] s walks the way out
  goalLook: 8,       // s: goals skip floor nodes the lava reaches within this long
  poseTol: 0.3,      // m: a rider node is open while its rider's top is within this of the pose it was built at
  seamMax: 0.3,      // m: the widest gap a nav edge may cross
  minFree: 0.35,     // m: a rider's top is never closer than this above L (a sink stone: while surfaced)
  maxParts: 40,      // dynamic blocks for all riders together, twins included
  gone: 0.05,        // m: a flat floor whose whole top is this far under the surface is out of play (its collider off)
};
const DEG = Math.PI / 180;
export const smooth = (s) => (s <= 0 ? 0 : s >= 1 ? 1 : s * s * (3 - 2 * s));
const dsmooth = (s) => (s <= 0 || s >= 1 ? 0 : 6 * s * (1 - s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function timingOf(def) { return { warn: 10, rise: 10, fall: 10, ease: 'smooth', ...((def && def.timing) || {}) }; }
const FIXED = new Set(['low', 'high', 'off']);
const warned = new Set();

// ---------------------------------------------------------------------------------------------------- the schedule
// lavaSchedule(def, mode, duration, flags) → Sched | null (the mode turns it off). Lookup: schedule.attract (the menu
// backdrop) / schedule.practice by the flags, then `${mode}:${duration}`, then `${mode}`, else Zone Control's loop.
// A string entry names another entry (resolved once) or is 'low' / 'high' (held) / 'off'.
// Sched: { low, high (the levels), T, key, kind: 'fixed', level } | { …, kind: 'moves', moves: [{ t0, dir, dur }] } |
//   { …, kind: 'loop', first, holdHigh, holdLow, period }
// In a match with a clock a loop is laid out as moves up to time-up: no move whose warning would begin in the last
// warn + 2 s, nothing moving in the last 12 s, and it ends at LOW (ENGINE §3.3, DESIGN §3.3).
export function lavaSchedule(def, mode, duration, flags = {}) {
  const S = (def && def.schedule) || {}, T = timingOf(def);
  let s, key;
  if (flags.attract && S.attract != null) { s = S.attract; key = 'attract'; }
  else if (flags.practice && S.practice != null) { s = S.practice; key = 'practice'; }
  else if (S[mode + ':' + duration] != null) { s = S[mode + ':' + duration]; key = mode + ':' + duration; }
  else if (S[mode] != null) { s = S[mode]; key = mode; }
  else {
    s = S.zones ?? S.turf ?? 'low'; key = S.zones != null ? 'zones' : 'turf';
    if (!warned.has(mode)) { warned.add(mode); try { console.warn(`[lava] no schedule for mode '${mode}': using ${key}'s`); } catch (e) { /* node */ } }
  }
  for (let k = 0; k < 4 && typeof s === 'string' && !FIXED.has(s) && S[s] != null; k++) s = S[s];
  const base = { T, low: def.low, high: def.high, key };
  if (s === 'off' || s == null) return null;
  if (s === 'low' || s === 'high') return { ...base, kind: 'fixed', level: s };
  const overtime = s.overtime || 'hold';
  const clocked = Number.isFinite(duration) && duration > 0 && !flags.practice && !flags.attract;
  if (s.moves) return { ...base, kind: 'moves', moves: buildMoves(s.moves, T), overtime };
  if (s.loop) {
    const L = s.loop, P = T.rise + L.high + T.fall + L.low;
    if (clocked) {
      const t0s = [];
      for (let t = L.first, dir = 1; t < duration - 2 && t0s.length < 400; dir = -dir) { t0s.push(t); t += dir > 0 ? T.rise + L.high : T.fall + L.low; }
      const durOf = (i) => (i % 2 ? T.fall : T.rise);
      while (t0s.length && t0s[t0s.length - 1] + durOf(t0s.length - 1) > duration - 12) t0s.pop();
      if (t0s.length % 2) t0s.pop();
      return { ...base, kind: 'moves', moves: buildMoves(t0s, T), overtime, loop: L };
    }
    // (the holds as holdHigh / holdLow: `high` / `low` on a Sched are the LEVELS)
    return { ...base, kind: 'loop', first: L.first, holdHigh: L.high, holdLow: L.low, period: P, overtime };
  }
  return { ...base, kind: 'fixed', level: 'low' };
}
function buildMoves(list, T) { return list.map((t0, i) => ({ t0, dir: i % 2 ? -1 : 1, dur: i % 2 ? T.fall : T.rise })); }

// the moves of a schedule round [t0, t1] (a loop's are generated), sorted
function movesIn(S, t0, t1) {
  if (S.kind === 'moves') return S.moves;
  if (S.kind !== 'loop') return [];
  const T = S.T, out = [], P = S.period;
  const k0 = Math.max(0, Math.floor((t0 - S.first) / P) - 1), k1 = Math.max(0, Math.floor((t1 - S.first) / P) + 1);
  for (let k = k0; k <= k1; k++) { const b = S.first + k * P; out.push({ t0: b, dir: 1, dur: T.rise }, { t0: b + T.rise + S.holdHigh, dir: -1, dur: T.fall }); }
  return out;
}

// the state at stage time t (otAt: when overtime began — a move not started by then never comes)
// → { y, e, phase: 'low'|'rise'|'high'|'fall', dir, v (m/s), toGo, next: { to, at, inS, dir, dur } | null, warn, move }
export function lavaAt(t, S, otAt = Infinity, held = null) {
  const lo = S.low, hi = S.high, T = S.T;
  if (held) return { ...held, toGo: Infinity, next: null, warn: false, v: 0 };
  if (S.kind === 'fixed') { const H = S.level === 'high'; return { y: H ? hi : lo, e: H ? 1 : 0, phase: H ? 'high' : 'low', dir: 0, v: 0, toGo: Infinity, next: null, warn: false, move: null }; }
  const M = movesIn(S, t - 20, t + 20);
  let lvl = 0;
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    if (m.t0 > otAt) break;
    if (t < m.t0) {
      const next = { to: m.dir > 0 ? 'high' : 'low', at: m.t0, inS: m.t0 - t, dir: m.dir, dur: m.dur };
      return { y: lvl ? hi : lo, e: lvl, phase: lvl ? 'high' : 'low', dir: 0, v: 0, toGo: m.t0 - t, next, warn: t >= m.t0 - T.warn, move: null };
    }
    if (t < m.t0 + m.dur) {
      const s = (t - m.t0) / m.dur, lin = T.ease === 'linear', f = lin ? s : smooth(s), df = lin ? 1 : dsmooth(s);
      const e = m.dir > 0 ? f : 1 - f;
      return { y: lo + (hi - lo) * e, e, phase: m.dir > 0 ? 'rise' : 'fall', dir: m.dir, v: (m.dir * (hi - lo) * df) / m.dur, toGo: m.t0 + m.dur - t,
        next: { to: m.dir > 0 ? 'high' : 'low', at: m.t0, inS: 0, dir: m.dir, dur: m.dur }, warn: false, move: m };
    }
    lvl = m.dir > 0 ? 1 : 0;
  }
  return { y: lvl ? hi : lo, e: lvl, phase: lvl ? 'high' : 'low', dir: 0, v: 0, toGo: Infinity, next: null, warn: false, move: null };
}
// L at t, without the object (A*'s per-edge windows)
export function lavaY(t, S, otAt = Infinity, held = null) {
  if (held) return held.y;
  const lo = S.low, hi = S.high;
  if (S.kind === 'fixed') return S.level === 'high' ? hi : lo;
  const M = S.kind === 'moves' ? S.moves : movesIn(S, t - 20, t + 20);
  let lvl = 0;
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    if (m.t0 > otAt || t < m.t0) break;
    if (t < m.t0 + m.dur) { const s = (t - m.t0) / m.dur, f = S.T.ease === 'linear' ? s : smooth(s); return lo + (hi - lo) * (m.dir > 0 ? f : 1 - f); }
    lvl = m.dir > 0 ? 1 : 0;
  }
  return lvl ? hi : lo;
}
// the maximum of L over [t0, t1] (exact: L is monotone between move boundaries)
export function lavaMax(t0, t1, S, otAt = Infinity, held = null) {
  if (held) return held.y;
  if (t1 < t0) { const x = t0; t0 = t1; t1 = x; }
  let m = Math.max(lavaY(t0, S, otAt), lavaY(t1, S, otAt));
  if (m >= S.high) return m;
  for (const mv of movesIn(S, t0, t1)) for (const b of [mv.t0, mv.t0 + mv.dur]) if (b > t0 && b < t1) m = Math.max(m, lavaY(b, S, otAt));
  return m;
}
// the stage time within move m at which L crosses y (null if it never does)
export function crossTime(m, y, S) {
  const lo = S.low, hi = S.high, e = (y - lo) / (hi - lo);
  if (e <= 0 || e >= 1) return null;
  const want = m.dir > 0 ? e : 1 - e, lin = S.T.ease === 'linear';
  let a = 0, b = 1;
  for (let k = 0; k < 40; k++) { const c = (a + b) / 2; if ((lin ? c : smooth(c)) < want) a = c; else b = c; }
  return m.t0 + ((a + b) / 2) * m.dur;
}
// a sink stone's top relative to the surface at time t (st = lavaAt(t)): rel[0] sunk … rel[1] up. Its 2.4 s linear run
// crosses the kill height exactly when L crosses sink.at (ENGINE §3.1): on a rise it is solid from the moment the ledge
// beside it is deadly; on a fall it stops being solid the moment the ledge is dry
export function stoneRel(r, t, S, st) {
  const k = r.sink, kill = LAVA.kill, r0 = k.rel[0], r1 = k.rel[1], span = r1 - r0;
  if (st.phase === 'high') return r1;
  if (st.phase === 'low' || !st.move) return r0;
  const mv = st.move, ck = 'tc' + k.at, tc = mv[ck] !== undefined ? mv[ck] : (mv[ck] = crossTime(mv, k.at, S));   // (cached on the move)
  if (tc === null) return st.phase === 'rise' ? r0 : r1;
  if (st.phase === 'rise') { const ts = tc - ((kill - r0) / span) * k.ease; return clamp(r0 + (span * (t - ts)) / k.ease, r0, r1); }
  const ts = tc - ((r1 - kill) / span) * k.ease;
  return clamp(r1 - (span * (t - ts)) / k.ease, r0, r1);
}
// a rider's top at lava height y (a float), or for a stone at its relative height
export function riderTop(r, y, S, rel = 0) { if (r.sink) return y + rel; const e = clamp((y - S.low) / (S.high - S.low), 0, 1); return r.top0 + (r.top1 - r.top0) * e; }

// ---------------------------------------------------------------------------------------------------- the data
// LAYOUT.lava with its twins: riders (with their collider parts), steps, gauges, cascades, vents, region and falls
// polygons. `inMode(it)` filters onlyIn / notIn items (the caller's variants.js; Node: none)
export function expandLava(def, inMode = () => true) {
  const mir = !!def.mirror, rot = ([x, z]) => [-x, -z];
  const polys = [...((def.region && def.region.polys) || [])], falls = [...((def.falls && def.falls.polys) || [])];
  for (const p of (def.region && def.region.half) || []) { polys.push(p); if (mir) polys.push(p.map(rot)); }
  for (const p of (def.falls && def.falls.half) || []) { falls.push(p); if (mir) falls.push(p.map(rot)); }
  const riders = [];
  for (const d of def.riders || []) {
    if (!inMode(d)) continue;
    for (const twin of mir && !d.single ? [0, 1] : [0]) {
      const yaw = (d.yaw || 0) * DEG + (twin ? Math.PI : 0);
      const x = twin ? -d.pos[0] : d.pos[0], z = twin ? -d.pos[1] : d.pos[1];
      const r = { id: d.id + (twin ? '~' : ''), base: d.id, twin, kind: d.kind || 'float', shape: d.shape || 'box', x, z, yaw, r: d.r || 0,
        top0: d.top[0], top1: d.top[1], depth: d.depth || 1, sink: d.sink || null, ink: d.ink || (d.kind === 'stone' ? false : 'deck'), inLake: !!d.inLake,
        look: d.look || {}, parts: [] };
      if (r.shape === 'hex') for (const a of [0, 60, 120]) r.parts.push({ ox: 0, oz: 0, hx: r.r / 2, hz: (Math.sqrt(3) * r.r) / 2, yaw: a * DEG, y0: -r.depth, y1: 0, body: true });
      else r.parts.push({ ox: 0, oz: 0, hx: d.size[0] / 2, hz: d.size[1] / 2, yaw: 0, y0: -r.depth, y1: 0, body: true });
      for (const p of d.parts || []) r.parts.push({ ox: p.x || 0, oz: p.z || 0, hx: (p.w || 1) / 2, hz: (p.d || 1) / 2, yaw: (p.yaw || 0) * DEG, y0: p.y0 || 0, y1: p.y1 ?? 1, body: false, roof: p.roof !== false });
      riders.push(r);
    }
  }
  const idx = new Map(riders.map((r, i) => [r.id, i]));
  const end = (e, twin) => (typeof e === 'string' ? { rider: idx.get(e + (twin ? '~' : '')) ?? -1, id: e + (twin ? '~' : '') } : { pt: twin ? rot(e) : [e[0], e[1]] });
  const steps = [];
  for (const s of def.steps || []) { if (!inMode(s)) continue; for (const twin of mir ? [0, 1] : [0]) steps.push({ a: end(s[0], twin), b: end(s[1], twin), twin }); }
  const twinPos = (p, twin) => (twin ? [-p[0], p[1], -p[2]] : [...p]);
  const gauges = [];
  for (const g of def.gauges || []) for (const twin of mir && !g.single ? [0, 1] : [0]) gauges.push({ ...g, pos: twinPos(g.pos, twin), yaw: (g.yaw || 0) + (twin ? Math.PI : 0), twin });
  const cascades = [];
  for (const c of def.cascades || []) for (const twin of mir && !c.single ? [0, 1] : [0]) cascades.push({ ...c, lip: c.lip.map((p) => (twin ? rot(p) : [...p])), twin });
  const vents = [];
  for (const v of def.vents || []) for (const twin of mir ? [0, 1] : [0]) vents.push(twinPos(v, twin));
  return { polys, falls, riders, steps, gauges, cascades, vents };
}
// a part's world placement for its rider at top `top`: { cx, cy, cz, hx, hy, hz, yaw }
export function partPose(r, p, top, out = {}) {
  const c = Math.cos(r.yaw), s = Math.sin(r.yaw);
  out.cx = r.x + p.ox * c + p.oz * s; out.cz = r.z - p.ox * s + p.oz * c;
  out.cy = top + (p.y0 + p.y1) / 2; out.hy = (p.y1 - p.y0) / 2; out.hx = p.hx; out.hz = p.hz; out.yaw = r.yaw + p.yaw;
  return out;
}
// is (x, z) inside a rider's footprint (its body parts)?
export function inRider(r, x, z, pad = 0) {
  for (const p of r.parts) {
    if (!p.body) continue;
    const q = partPose(r, p, 0, _pp), dx = x - q.cx, dz = z - q.cz, c = Math.cos(q.yaw), s = Math.sin(q.yaw);
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) <= q.hx + pad && Math.abs(lz) <= q.hz + pad) return true;
  }
  return false;
}
const _pp = {};
export function pointInPoly(P, x, z) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, zi] = P[i], [xj, zj] = P[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
