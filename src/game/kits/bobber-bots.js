// [b5-subs] Chain Bobber: the bots (SPEC.md C7). Bots never cheat: everything below reads only what a player could know —
// their own team's bobbers (yours are on your HUD and your map), foes they see (botSight.js rules) or their team saw a
// moment ago, and sight lines through botSight's shared per-frame budget (sightRay).
//
// USING THEM (SUB_KITS.bobber.bot):
//   paint — setting a chain up while painting (bots.js _paintSub, behind bombCd): not hurt for 1.5 s, ink ≥ 60, a 2 %
//     chance a frame, at the mode's spot — Zone Control: a guard, on its zone's edge toward the enemy; Tower Command: by
//     the track ahead (within 6 m of it) but more than TOWER.platformR + 2.0 = 3.25 m off its centre line (nearer would be
//     crushed); Turf: on the front line (its progress 0.45–0.65), a few metres ahead — the next one 3–5 m from its newest
//     live bobber (to grow the chain), never past a 4-chain; then 1.5–3 s between links and 10–16 s once a chain is done.
//     The throw lands where it picked (use() turns the lob onto the spot, as the Waddle's does onto its foe).
//   fight — rarely (0.5 % a frame): a lone one just in front of a foe chasing it, for a teammate to shoot.
// SETTING THEM OFF (botAct, every bot, on its team's bobbers — the trigger): scanned every 0.1 s (staggered), nothing
//   else owning the aim (busy): a foe it sees within R(N) − 0.3 m of a bobber of a chain (±1.6 m in height), a line to a
//   bobber of that chain within its reach, and no better shot under way (its own target not in its sights) → it turns to
//   that bobber (the usual aim error × 0.7) and fires until the chain blows or 0.6 s pass. THREAT_STATS.chainShots /
//   chainWasted (a chain that blew with no foe in reach) count them.
// FACING ENEMY BOBBERS: wave 1's device shooting (deployables-bots.js) lists them, picked by distance × prefer(bot):
//   0.7 within 4 m of this bot's route ahead (its path through the next 3 nodes) or within R(N) of where it stands, 1.0
//   otherwise. specialDangers (botSpecials.js, the kit's `dangers` hook): every ARMED enemy chain — one its team's bots
//   know a foe of (seen, or seen within 1.5 s) within 20 m of with a line to one of its bobbers — a disc per bobber,
//   R(N) + 0.3, lethal 2 from N = 3 (1 below), lingering (a route cost), its blast needing a sight line (cover counts),
//   tIn 0.3 (a bot inside steps out); at most 48 discs in all (those nearest a bot of the other team).
import * as THREE from 'three';
import { G, clamp, angleDiff } from '../../core/ctx.js';
import { TOWER, weaponRange } from '../../config.js';
import { THREAT_STATS, zonePlan, towerPlan } from '../bots.js';
import { sightRay, teamKnown } from '../botSight.js';
import { MAIN_KITS } from './registry.js';
import { items, sizeOf, SB, spotFor, predictFrom, near, srcStat, lobAim } from './bobber.js';

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3();
const wander = (x) => Math.sin(x) * 0.6 + Math.sin(x * 2.27 + 1.3) * 0.4;
const MELEE = { roller: true, brush: true }, CHARGES = { charger: true, spinner: true, splatling: true }, RELEASE = { ...CHARGES, bow: true, blade: true };
export const BOBBER_BOT = { setups: 0, grows: 0, lures: 0, scans: 0, engaged: 0, fired: 0, gaveUp: 0, deferred: 0, discs: 0, armed: 0, maxDiscs: 0, holds: 0, cands: 0,
  why: { calls: 0, ink: 0, hurt: 0, rolls: 0, spot: 0 } };   // (why: paint()'s answers — how often each condition said no)
// (tests / probes: BOBBER_BOT.logOn = true keeps a short log of the bots' set-up decisions in BOBBER_BOT.log)
const blog = (b, ev, o) => { if (BOBBER_BOT.logOn && BOBBER_BOT.log.length < 400) BOBBER_BOT.log.push({ t: Math.round(G.time * 100) / 100, who: b.a.name, ev, ...o }); };
BOBBER_BOT.log = [];
export const botLog = (a, ev, o) => { if (BOBBER_BOT.logOn && a?.bot) blog(a.bot, ev, o); };
export function resetBobberBot() { for (const k in BOBBER_BOT) { const v = BOBBER_BOT[k]; if (v && typeof v === 'object') { for (const j in v) v[j] = 0; } else BOBBER_BOT[k] = 0; } THREAT_STATS.chainShots = 0; THREAT_STATS.chainWasted = 0; }
THREAT_STATS.chainShots = THREAT_STATS.chainShots || 0; THREAT_STATS.chainWasted = THREAT_STATS.chainWasted || 0;

// ---- prefer(brain): wave 1's pick multiplier for this bot (§0.2)
export function preferFor(it, b) {
  if (!b || !b.a) return 1;
  const a = b.a, R = sizeOf(it.chain?.n || 1).R, sx = it.spot.x, sz = it.spot.z;
  if (Math.hypot(sx - a.pos.x, sz - a.pos.z) < R) return 0.7;
  const P = b.path, nav = G.nav;
  if (P && nav && b.pi >= 0) {
    let px = a.pos.x, pz = a.pos.z;
    for (let i = b.pi; i < Math.min(P.length, b.pi + 3); i++) {
      const n = nav.nodes[P[i]]; if (!n) break;
      if (segDist(sx, sz, px, pz, n.x, n.z) < 4) return 0.7;
      px = n.x; pz = n.z;
    }
  }
  return 1;
}
function segDist(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L > 1e-9 ? clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1) : 0;
  return Math.hypot(ax + dx * t - x, az + dz * t - z);
}

// ---- using them
const mine = (a) => items.filter((it) => it.owner === a && !it.ghost && it.state === 'live');
const _spot = { x: 0, y: 0, z: 0, hover: 0, base: 0, block: -1, refused: false, kind: '' };
// a spot to throw one at, on the floor at (x, z): ok to stand a bobber on? → { x, y, z } or null. `from`: where the bot
// will throw from (where it stands, or the stand spot of a set-up it walks to first)
const NO = BOBBER_BOT.no = { floor: 0, reach: 0, refused: 0, track: 0, line: 0, lob: 0 };
let _noWhy = '';
function okSpot(a, x, z, tower, from = a.pos, lob = true) {
  const gy = G.level.groundHeight(x, z, from.y + 3);
  if (gy === -Infinity || gy < from.y - 3.2) { NO.floor++; _noWhy = 'floor'; return null; }
  const d = Math.hypot(x - from.x, z - from.z);
  if (d < 2.5 || d > 10.5) { NO.reach++; _noWhy = 'reach'; return null; }
  spotFor(x, gy, z, 0, 1, 0, 'floor', -1, a.team, _spot);
  if (_spot.refused || _spot.base > gy + 0.05) { NO.refused++; _noWhy = 'refused:' + _spot.why; return null; }   // (refused, or over the liquid: a dry floor only)
  if (tower && trackDist(tower, x, z) < (TOWER.platformR ?? 1.25) + 2.0 + 0.25) { NO.track++; _noWhy = 'track'; return null; }
  // (a lob over a wall lands who knows where: a clear line from its eye to the float spot — or, over a lip or a low rail
  // a lob clears, from a little above its eye down to just over the spot)
  if (!G.physics.los(_v.set(from.x, from.y + 1.6, from.z), _v2.set(x, gy + 1.0, z)) && !G.physics.los(_v.set(from.x, from.y + 2.6, from.z), _v2.set(x, gy + 1.5, z))) { NO.line++; _noWhy = 'line'; return null; }
  // (and a lob from there really settles there: the throw's own flight, within 1.2 m — a ledge's lip, a rail, a slope)
  const at = new V3(x, gy, z);
  if (lob && !lobOk(a, at, from)) return null;
  return at;
}
function lobOk(a, at, from) {
  if (lobAim(from, at, a.team, SB().throwSpeed, _la).miss <= 1.2) return true;
  NO.lob++; _noWhy = 'lob' + Math.round(_la.miss * 10) / 10; return false;
}
// a chain at anchor A, thrown from `from` (Zone Control, Turf): floor spots round A — across the foes' way first, then
// along it — that stand from there; the first, then each next one 2.4–4.6 m from one already picked with a clear line
// between their float spots (so they tether) and ≥ 2.4 m from the rest; the lob's own flight checked for each one picked
// (at most 10 checks) → [V3 …] (3–4) or null
const RING = (() => { const o = [[0, 0]]; for (const [r, n] of [[1.7, 6], [3.3, 8], [4.6, 10]]) for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2 + r; o.push([Math.cos(t) * r, Math.sin(t) * r]); } return o; })();
function buildChain(a, A, tp, from = a.pos) {
  const px = -A.dz, pz = A.dx, C = [];
  for (const [u, v] of RING) {
    const x = A.x + px * u + A.dx * v, z = A.z + pz * u + A.dz * v;
    if (items.some((o) => o.team === a.team && (o.state === 'live' || o.state === 'open') && Math.hypot(o.spot.x - x, o.spot.z - z) < 3.4)) continue;
    const at = okSpot(a, x, z, tp, from, false);
    if (at) C.push({ at, sc: Math.abs(v) + Math.abs(u) * 0.25 + Math.abs(at.y - A.y) * 0.5, bad: false });
  }
  C.sort((p, q) => p.sc - q.sc);
  const L = [];
  let checks = 0;
  const fits = (c) => L.every((q) => Math.hypot(q.x - c.at.x, q.z - c.at.z) >= 2.4) && L.some((q) => Math.hypot(q.x - c.at.x, q.z - c.at.z) <= 4.6 && Math.abs(q.y - c.at.y) < 2.2 && G.physics.los(_v.set(q.x, q.y + 1.0, q.z), _v2.set(c.at.x, c.at.y + 1.0, c.at.z)));
  while (L.length < 4 && checks < 10) {
    const c = C.find((q) => !q.bad && !L.includes(q.at) && (!L.length || fits(q)));
    if (!c) break;
    checks++;
    if (lobOk(a, c.at, from)) L.push(c.at); else c.bad = true;
  }
  return L.length >= 3 ? L : null;
}
const _la = { yaw: 0, pitch: 0, miss: Infinity };
// how far (x, z) is from the tower track's centre line (its metre points)
function trackDist(P, x, z) {
  let best = Infinity;
  const pts = P.pts;
  for (let i = 1; i < pts.length; i++) { const d = segDist(x, z, pts[i - 1].x, pts[i - 1].z, pts[i].x, pts[i].z); if (d < best) best = d; }
  return best;
}
// (bobber.js use, a bot's throw at the release) where it will float is fine for a bot: not refused, and in Tower Command
// not within TOWER.platformR + 2.0 of the track's centre line (the tower would crush it)
const _ps = { x: 0, y: 0, z: 0 };
export function botThrowOk(a, pos, vel) {
  const tp = zonePlan() ? null : towerPlan();
  const s = predictFrom(pos, vel, a.team, _ps);
  if (!s) return true;
  if (s.refused) return false;
  return !tp || trackDist(tp, s.x, s.z) >= (TOWER.platformR ?? 1.25) + 2.0;
}
// ---- where foes walk (SPEC C7; the review: "place chains where foes walk — zone entries, flank chokes, the path foes
// take to the bot's front — not on the bot's own firing line"). A route is the nav path the foes' team would take from
// its spawn pad (no wall-hack: the map and their pad are common knowledge), cached a few seconds.
const _routes = new Map();
function foeRoute(foeTeam, to) {
  const nav = G.nav, pad = G.level?.spawnPads?.[foeTeam];
  if (!nav || !pad) return null;
  const s = nav.nearest(pad, 1.2, true), g = nav.nearest(to, 0.8);
  if (s < 0 || g < 0) return null;
  const key = foeTeam + ':' + s + ':' + g, c = _routes.get(key);
  if (c && c.m === G.match && G.time - c.t < 5 && G.time >= c.t) return c.pts;
  const P = nav.path(s, g, foeTeam);
  const pts = P ? P.map((id) => nav.nodes[id]) : null;
  if (_routes.size > 64) _routes.clear();
  _routes.set(key, { t: G.time, m: G.match, pts });
  BOBBER_BOT.routes = (BOBBER_BOT.routes || 0) + 1;
  return pts;
}
// the point `back` metres (along the route) before its end, and the way foes walk there (unit x, z) → { x, y, z, dx, dz }
function alongBack(pts, back) {
  let acc = 0;
  for (let i = pts.length - 1; i > 0; i--) {
    const A = pts[i - 1], B = pts[i], L = Math.hypot(B.x - A.x, B.z - A.z);
    if (acc + L >= back && L > 1e-6) { const u = (back - acc) / L; return { x: B.x + (A.x - B.x) * u, y: B.y + (A.y - B.y) * u, z: B.z + (A.z - B.z) * u, dx: (B.x - A.x) / L, dz: (B.z - A.z) / L }; }
    acc += L;
  }
  return null;
}
// where the route first comes within r of (cx, cz) — the entry — `out` metres before it → { x, y, z, dx, dz }
function entryOf(pts, cx, cz, r, out) {
  let k = -1;
  for (let i = 0; i < pts.length; i++) if (Math.hypot(pts[i].x - cx, pts[i].z - cz) <= r) { k = i; break; }
  if (k <= 0) return null;
  return alongBack(pts.slice(0, k + 1), out);
}
// a chain laid across the foes' way at an anchor (along it for the tower: across would be in its track): the first spot
// that stands, then each next one 2.4–4.6 m from one already picked (so they tether: linkRange 5) and ≥ 2.4 m from all
// → [V3 …] (up to 4) or null (fewer than 3 stand)
const ACROSS = [[1.6, 0], [-1.6, 0], [4.6, 0], [-4.6, 0], [0, -2.8], [1.6, 2.8], [-1.6, 2.8], [3.2, -2.6], [-3.2, -2.6], [0, 2.8], [4.6, 2.8], [-4.6, 2.8]];
const ALONG = [[0, 0], [0, 3.1], [0, -3.1], [0, 6.2], [0, -6.2], [1.4, 1.6], [1.4, -1.6], [1.4, 4.7], [1.4, -4.7]];
function layout(a, A, tower, from = a.pos) {
  // (across: the perpendicular to the foes' way; by the tower: away from its line, so every link keeps its distance)
  let px = -A.dz, pz = A.dx;
  if (tower) { const o = awayFromTrack(tower, A.x, A.z); if (o) { px = o[0]; pz = o[1]; } }
  const L = [], shape = tower ? ALONG : ACROSS;
  for (const [u, v] of shape) {
    if (L.length >= 4) break;
    const x = A.x + px * u + A.dx * v, z = A.z + pz * u + A.dz * v;
    if (L.length && (L.some((q) => Math.hypot(q.x - x, q.z - z) < 2.4) || !L.some((q) => Math.hypot(q.x - x, q.z - z) <= 4.6))) continue;
    // (clear of the team's other chains — out of a 4-chain's blast and a bobber's size, 3.0 + 0.2 + 0.2 m, so one going off
    // doesn't take this one with it; three guards' webs share one zone's edge)
    if (items.some((o) => o.team === a.team && (o.state === 'live' || o.state === 'open') && Math.hypot(o.spot.x - x, o.spot.z - z) < 3.4)) continue;
    const at = okSpot(a, x, z, tower, from);
    // (links within 2.2 m of the first one's height — a zone's edge often drops a step or two — and with a clear line from
    // its float spot to one already picked within linking reach: the relink's own test, so they tether)
    if (at && (!L.length || (Math.abs(at.y - L[0].y) < 2.2 && L.some((q) => Math.hypot(q.x - at.x, q.z - at.z) <= 4.6 && G.physics.los(_v.set(q.x, q.y + 1.0, q.z), _v2.set(at.x, at.y + 1.0, at.z)))))) L.push(at);
  }
  return L.length >= 3 ? L : null;
}
// a stand spot `back` metres from anchor A toward (tx, tz) (on the nav), for a set-up the bot walks to first → V3 | null
function standFor(A, tx, tz, back) {
  const dx = tx - A.x, dz = tz - A.z, l = Math.hypot(dx, dz) || 1, nav = G.nav;
  for (const k of [back, back - 1.5, back + 1.5, back - 3]) {
    if (k < 3) continue;
    const id = nav?.nearest(_v.set(A.x + (dx / l) * k, A.y + 0.5, A.z + (dz / l) * k), 1.6);
    if (id >= 0) { const n = nav.nodes[id]; if (Math.hypot(n.x - A.x, n.z - A.z) <= 9.0) return new V3(n.x, n.y, n.z); }
  }
  return null;
}
// (x, z)'s way out from the tower's track: the unit horizontal from its nearest point on the centre line
function awayFromTrack(P, x, z) {
  let best = Infinity, o = null;
  for (let i = 1; i < P.pts.length; i++) {
    const p = P.pts[i - 1], q = P.pts[i], dx = q.x - p.x, dz = q.z - p.z, L = dx * dx + dz * dz, t = L > 1e-9 ? clamp(((x - p.x) * dx + (z - p.z) * dz) / L, 0, 1) : 0;
    const cx = p.x + dx * t, cz = p.z + dz * t, d = Math.hypot(x - cx, z - cz);
    if (d < best && d > 1e-6) { best = d; o = [(x - cx) / d, (z - cz) / d]; }
  }
  return o;
}
// the mode's anchors for a new chain, in the order to try them: [{ x, y, z, dx, dz (the way foes walk there), src (the
// counters' placement source), tx, tz, trip (a set-up out of reach from here: a stand spot on the (tx, tz) side of it, at
// most `trip` m off — the bot walks there first) }]
function anchors(b, tp) {
  const a = b.a, zp = zonePlan(), r = () => Math.random();
  const foeTeam = 1 - a.team;
  if (zp) {
    // Zone Control: the doors of its zone — where the foes' way in (from their pad, or from spots round the zone on their
    // side, so not always the same door) crosses its edge, a metre or two outside it — and spots along its edge toward
    // the foes' side; nearest first (a guard anywhere on its zone walks over to the far ones)
    if (b.zZone < 0 || !zp.isActive(b.zZone)) return [];
    const z = zp.Z.zones[b.zZone], I = zp.info[b.zZone], c = z?.center; if (!c || !I) return [];
    if (Math.hypot(a.pos.x - c[0], a.pos.z - c[2]) > I.R + 9) return [];
    const [ex, ez] = zp.enemyDir(z, a.team), starts = [null], C = [], trip = I.R * 2 + 6;
    for (let i = 0; i < 8 && starts.length < 4; i++) {
      const id = I.far[(r() * I.far.length) | 0], q = G.nav.nodes[id]; if (!q) continue;
      const dx = q.x - c[0], dz = q.z - c[2], l = Math.hypot(dx, dz) || 1;
      if ((dx * ex + dz * ez) / l > 0.35) starts.push(q);
    }
    for (const st of starts) {
      let pts = null;
      if (!st) pts = foeRoute(foeTeam, _v.set(c[0], c[1], c[2]));
      else { const nav = G.nav, s0 = nav.nearest(st, 1.2, true), g0 = nav.nearest(_v.set(c[0], c[1], c[2]), 0.8); const P = s0 >= 0 && g0 >= 0 ? nav.path(s0, g0, foeTeam) : null; pts = P ? P.map((id) => nav.nodes[id]) : null; }
      if (!pts || pts.length < 3) continue;
      const A = entryOf(pts, c[0], c[2], I.R + 0.5, 1.2 + r() * 1.3);
      if (A && !C.some((q) => Math.hypot(q.x - A.x, q.z - A.z) < 2.5)) C.push({ ...A, src: 'zdoor', tx: c[0], tz: c[2], trip });
    }
    // (the zone's edge from the foes' side round to its flanks, across the way in there — a raised zone's edge is often a
    // drop: just inside it too)
    for (let i = 0; i < 9; i++) {
      const th = Math.atan2(ez, ex) + (i / 8 - 0.5) * 3.5 + (r() - 0.5) * 0.25, ux = Math.cos(th), uz = Math.sin(th), out = I.R - 1.2 + r() * 2.4, x = c[0] + ux * out, zz = c[2] + uz * out;
      const gy = G.level.groundHeight(x, zz, Math.max(a.pos.y, c[1]) + 3);
      if (Number.isFinite(gy) && gy > c[1] - 4) C.push({ x, y: gy, z: zz, dx: -ux, dz: -uz, src: 'zedge', tx: c[0], tz: c[2], trip });
    }
    // (on the zone itself, its foes' half — a small raised zone's edge is all drop: foes taking it stand in the web)
    for (let i = 0; i < 3; i++) {
      const th = Math.atan2(ez, ex) + (i - 1) * 0.9, k = I.R * (0.25 + r() * 0.3), x = c[0] + Math.cos(th) * k, zz = c[2] + Math.sin(th) * k;
      const gy = G.level.groundHeight(x, zz, Math.max(a.pos.y, c[1]) + 3);
      if (Number.isFinite(gy) && gy > c[1] - 4) C.push({ x, y: gy, z: zz, dx: -ex, dz: -ez, src: 'zin', tx: c[0], tz: c[2], trip });
    }
    const dOf = (q) => Math.hypot(q.x - a.pos.x, q.z - a.pos.z), rank = { zdoor: -3, zedge: 0, zin: 2.5 };
    return C.sort((p, q) => rank[p.src] - rank[q.src] + dOf(p) - dOf(q));   // (a door a few metres farther before an edge spot, the zone's own ground last)
  }
  if (tp) {   // Tower Command: by the track ahead of the tower (its next 24 m), 3.7–5.7 m off its line — within 6 m of it, never
    // in its swept body; the chain laid along the track (foes walk with the tower and round it)
    const T = tp.T, f = tp.fwdOf(a.team), C = [];
    for (let ds = 2; ds <= 24; ds += 1.5) {
      const p = tp.at(T.s + f * ds), q = tp.at(T.s + f * (ds + 1)), tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1;
      for (const sd of [-1, 1]) {
        const off = 3.7 + r() * 2, x = p.x - (tz / tl) * off * sd, z = p.z + (tx / tl) * off * sd, d = Math.hypot(x - a.pos.x, z - a.pos.z);
        if (d >= 3 && d <= 9.5) C.push({ x, y: p.y, z, dx: -tx / tl * f, dz: -tz / tl * f, src: 'tower' });
      }
    }
    return C.length ? [C[(r() * C.length) | 0]] : [];
  }
  // Turf: where its team has seen foes go in the last 20 s — the busiest patches of it on the contested stretch (not deep
  // in their base), anywhere within 28 m (the bot walks over, to a stand spot on our side of it) — laid across the way
  // they were going there; else the foes' route from their pad to the bot, 7–11 m short of it
  const pads = G.level.spawnPads; if (!pads?.[1]) return [];
  const C = heatAnchors(b, pads);
  const pts = foeRoute(foeTeam, a.pos);
  const A = pts && pts.length >= 3 ? alongBack(pts, 7 + r() * 4) : null;
  if (A && progOf(A, pads, a.team) > 0.25 && progOf(A, pads, a.team) < 0.8) C.push({ ...A, src: 'troute', tx: a.pos.x, tz: a.pos.z, trip: 14 });
  return C;
}
// how far (x, z) is from team t's pad toward the other's (0 at its own pad, 1 at theirs)
const progOf = (p, pads, t) => 1 - Math.hypot(p.x - pads[1 - t].x, p.z - pads[1 - t].z) / Math.max(1, pads[0].distanceTo(pads[1]));
// (Turf) the busiest patches of ground the team has seen foes on lately: up to 3, ≥ 5 m apart, each with ≥ 2 sightings'
// worth (a sighting weighs less as it ages), best first
function heatAnchors(b, pads) {
  const a = b.a, L = SEEN[a.team], out = [], noR = (G.level.spawnBarrier ?? 4.2) + 4;
  const cand = [];
  for (let i = L.length - 1, k = 0; i >= 0 && k < 48; i--, k++) {
    const p = L[i], d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z), pr = progOf(p, pads, a.team);
    if (d < 3.5 || d > 28 || Math.abs(p.y - a.pos.y) > 3.5 || pr < 0.25 || pr > 0.8) continue;
    if (Math.hypot(p.x - pads[1 - a.team].x, p.z - pads[1 - a.team].z) < noR) continue;
    let n = 0, vx = 0, vz = 0;
    for (const q of L) if (Math.hypot(q.x - p.x, q.z - p.z) < 4 && Math.abs(q.y - p.y) < 1.5) { const w = 1 - (G.time - q.t) / 24; n += w; vx += q.vx * w; vz += q.vz * w; }
    if (n < 2) continue;
    const vl = Math.hypot(vx, vz), fx = p.x - pads[1 - a.team].x, fz = p.z - pads[1 - a.team].z, fl = Math.hypot(fx, fz) || 1;
    cand.push({ x: p.x, y: p.y, z: p.z, dx: vl > 0.8 ? vx / vl : fx / fl, dz: vl > 0.8 ? vz / vl : fz / fl, n, src: 'theat', tx: a.pos.x, tz: a.pos.z, trip: 30 });
  }
  cand.sort((p, q) => q.n - p.n);
  for (const c of cand) { if (out.length >= 3) break; if (!out.some((o) => Math.hypot(o.x - c.x, o.z - c.z) < 5)) out.push(c); }
  return out;
}
// a chain to lay now: the first anchor with a layout that stands — from here when it's in reach, else from a stand spot
// on our side of it (a set-up the bot walks to first) → { A, L, stand } | null
function planChain(b, tp) {
  const a = b.a, C = anchors(b, tp), why = BOBBER_BOT.logOn ? [] : null;
  let n = 0;
  for (const A of C) {
    if (n >= 6) break;
    const d = Math.hypot(A.x - a.pos.x, A.z - a.pos.z);
    const lay = (from) => (tp ? layout(a, A, tp, from) : buildChain(a, A, tp, from));
    if (d <= 9.5) { n++; const L = lay(a.pos); if (L) return { A, L, stand: null }; why?.push(A.src + '@' + d.toFixed(1) + ':nolay'); }
    if (!A.trip) continue;
    const S = standFor(A, A.tx, A.tz, 5.5);
    if (!S || Math.hypot(S.x - a.pos.x, S.z - a.pos.z) > A.trip || Math.hypot(S.x - a.pos.x, S.z - a.pos.z) < 1.2) { why?.push(A.src + '@' + d.toFixed(1) + ':nostand'); continue; }
    n++;
    const L = lay(S);
    if (L) return { A, L, stand: S };
    why?.push(A.src + '@' + d.toFixed(1) + ':nolayS');
  }
  if (why) blog(b, 'noplan', { cands: C.length, why: why.join(' '), no: JSON.stringify(NO) });
  return null;
}
// the set-up this bot is walking to (its stand spot, then the chain from there)
function tripOf(b) {
  const T = b._bobTrip;
  if (!T) return null;
  if (G.time - T.t0 > 10 || T.m !== G.match || (T.zone != null && T.zone !== b.zZone)) { b._bobTrip = null; BOBBER_BOT.tripsLost = (BOBBER_BOT.tripsLost || 0) + 1; return null; }
  return T;
}
// the chain this bot is laying now (a burst: its links thrown one after another, the tank topped up between them)
function planOf(b) {
  const P = b._bobPlan;
  if (!P) return null;
  if (G.time - P.t0 > 14 || P.i >= P.pts.length || P.m !== G.match) { b._bobPlan = null; return null; }
  return P;
}
// (a burst's chain left short of three) the links that grow this bot's newest chain to three: each 3.2–4.2 m from one of
// its bobbers with a clear line to it (so they tether), ≥ 2.4 m from the rest, clear of the team's other chains → [V3] | null
function growPlan(b, tp) {
  const a = b.a;
  let nw = null;
  for (const it of items) if (it.owner === a && !it.ghost && it.state === 'live' && it.chain && (!nw || it.seq > nw.seq)) nw = it;
  if (!nw || nw.chain.n >= 3) return null;
  const C = nw.chain.items.filter((o) => o.state === 'live'), need = 3 - C.length, pts = [];
  for (const o of C) {
    for (let k = 0; k < 8 && pts.length < need; k++) {
      const th = (k * Math.PI) / 4 + Math.random() * 0.4, rr = 3.2 + Math.random(), x = o.spot.x + Math.cos(th) * rr, z = o.spot.z + Math.sin(th) * rr;
      if (C.some((q) => Math.hypot(q.spot.x - x, q.spot.z - z) < 2.4) || pts.some((q) => Math.hypot(q.x - x, q.z - z) < 2.4)) continue;
      if (items.some((q) => q.team === a.team && (q.state === 'live' || q.state === 'open') && !C.includes(q) && Math.hypot(q.spot.x - x, q.spot.z - z) < 3.4)) continue;
      const at = okSpot(a, x, z, tp);
      if (!at || Math.abs(at.y + 1.0 - o.spot.y) > 2.0 || !G.physics.los(o.spot, _v.set(at.x, at.y + 1.0, at.z))) continue;
      pts.push(at);
    }
  }
  return pts.length >= need ? pts : null;
}
// (a burst's next link whose planned spot no longer stands) a spot near it, or 3.2–4.2 m from one of the burst's links,
// that stands from here, ≥ 2.4 m from the burst's other links, within 4.6 m of one of them with a clear line (they
// tether), clear of the team's other chains → V3 | null
function linkNear(b, P, q, tp) {
  const a = b.a, T = P.thrown || [P.pts[0]];
  const ok = (x, z) => {
    if (T.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4) || !T.some((t) => Math.hypot(t.x - x, t.z - z) <= 4.6)) return null;
    if (items.some((o) => o.team === a.team && (o.state === 'live' || o.state === 'open') && Math.hypot(o.spot.x - x, o.spot.z - z) < 3.4 && !T.some((t) => Math.hypot(t.x - o.spot.x, t.z - o.spot.z) < 1.5))) return null;
    const at = okSpot(a, x, z, tp);
    if (!at || !T.some((t) => Math.hypot(t.x - at.x, t.z - at.z) <= 4.6 && Math.abs(t.y - at.y) < 2.2 && G.physics.los(_v.set(t.x, t.y + 1.0, t.z), _v2.set(at.x, at.y + 1.0, at.z)))) return null;
    return at;
  };
  for (const rr of [1.0, 1.8, 2.6]) for (let k = 0; k < 8; k++) { const th = (k * Math.PI) / 4 + rr; const at = ok(q.x + Math.cos(th) * rr, q.z + Math.sin(th) * rr); if (at) return at; }
  for (const t of T) for (let k = 0; k < 8; k++) { const th = (k * Math.PI) / 4 + 0.3, rr = 3.4 + (k % 2) * 0.7; const at = ok(t.x + Math.cos(th) * rr, t.z + Math.sin(th) * rr); if (at) return at; }
  return null;
}
// the first link of a chain laid now; the rest follow it in a burst (paint → planOf)
function startChain(b, A, L) {
  blog(b, 'chain', { src: A.src, n: L.length, at: [Math.round(A.x), Math.round(A.z)], d: Math.round(Math.hypot(A.x - b.a.pos.x, A.z - b.a.pos.z) * 10) / 10, ink: Math.round(b.a.ink) });
  b._bobPlan = { pts: L, i: 1, t0: G.time, m: G.match, A, from: b.a.pos.clone() }; b._bobSrc = A.src || 'mode';
  b._bobberAt = L[0];
  b.bombCd = 0.45 + Math.random() * 0.3;
  BOBBER_BOT.setups++;
  return true;
}
export const botKit = {
  paint(b) {
    const a = b.a, W = BOBBER_BOT.why;
    if (b._bobRollT === G.time) return false;   // (one roll a frame: bots.js _paintSub and botAct both ask)
    b._bobRollT = G.time;
    W.calls++;
    if (a.lastDamage < 1.5) { W.hurt++; return false; }
    const tp = zonePlan() ? null : towerPlan();
    let P = planOf(b);
    if (P) {   // the next link of the chain under way (a link that no longer stands from here is skipped)
      if (a.ink < a.sub.inkCost + 2) { W.ink++; return false; }
      while (P.i < P.pts.length) {
        const q = P.pts[P.i++];
        // (the planned spot no longer stands from here — the bot dived, refilled, was pushed — then the nearest one that
        // still tethers to this burst's links)
        let at = okSpot(a, q.x, q.z, tp);
        if (!at) { const why = _noWhy; at = linkNear(b, P, q, tp); blog(b, at ? 'moved' : 'skip', { i: P.i - 1, d: Math.round(Math.hypot(q.x - a.pos.x, q.z - a.pos.z) * 10) / 10, why, moved: P.from ? Math.round(P.from.distanceTo(a.pos) * 10) / 10 : -1 }); }
        if (at) {
          b._bobberAt = at; BOBBER_BOT.grows++; (P.thrown || (P.thrown = [P.pts[0]])).push(at);
          if (P.i >= P.pts.length) {
            b._bobPlan = null; b.bombCd = 10 + Math.random() * 6; BOBBER_BOT.bursts = (BOBBER_BOT.bursts || 0) + 1;
            // (once its last link has landed and linked: a chain left short of three — a link skipped, one that didn't tether
            // — is grown at once, twice at most; a fight's pair is left be)
            if (!P.fight && (P.grow || 0) < 2) { b._bobGrow = { at: G.time + 1.7, n: (P.grow || 0) + 1, A: P.A, m: G.match }; }
            // (Turf: it keeps within reach of its chain while it lasts — the foes it waits for come at it through there)
            if (!zonePlan() && !towerPlan()) { let cx = 0, cz = 0; for (const q of P.pts) { cx += q.x; cz += q.z; } cx /= P.pts.length; cz /= P.pts.length; b._bobHold = { x: cx, y: P.pts[0].y, z: cz, dx: P.A.dx, dz: P.A.dz, until: G.time + 18, m: G.match, t: -9 }; }
          }
          else b.bombCd = 0.45 + Math.random() * 0.3;
          return true;
        }
      }
      b._bobPlan = null; b.bombCd = 4 + Math.random() * 3;
      return false;
    }
    // a new chain: ink for a link or two now (the rest after a dive), a 2 % chance a frame (a Zone Control guard on its zone:
    // 10 %), not right after a failed look for a spot
    const guard = b.zRole === 'guard';
    if (guard) W.g = (W.g || 0) + 1;
    // (a set-up under way: at its stand spot, the chain from here — a fresh look at its anchor; on its way: nothing yet)
    const T = tripOf(b);
    if (T) {
      if (Math.hypot(a.pos.x - T.S.x, a.pos.z - T.S.z) > 1.6 && G.time - T.t0 < 8) return false;
      if (a.ink < 72) { W.ink++; return false; }
      b._bobTrip = null;
      const L = tp ? layout(a, T.A, tp) : buildChain(a, T.A, tp);
      if (!L) { W.spot++; BOBBER_BOT.tripsNo = (BOBBER_BOT.tripsNo || 0) + 1; b._bobNoSpotT = G.time + 0.5; blog(b, 'tripNo', { d: Math.round(Math.hypot(a.pos.x - T.S.x, a.pos.z - T.S.z) * 10) / 10, no: JSON.stringify(NO) }); return false; }
      BOBBER_BOT.tripsDone = (BOBBER_BOT.tripsDone || 0) + 1;
      return startChain(b, T.A, L);
    }
    if (a.ink < 72) { W.ink++; return false; }
    // (a bot with a dozen of its own out already doesn't start another chain: past the hidden guard each throw would only
    // retire its oldest — its web is big enough, and every throw, relink and fizzle costs the frame)
    if (mine(a).length >= 12) { W.many = (W.many || 0) + 1; return false; }
    if (G.time < (b._bobNoSpotT || 0) || Math.random() > (guard ? 0.1 : 0.02)) return false;
    W.rolls++;
    const pl = planChain(b, tp);
    if (!pl) { W.spot++; b._bobNoSpotT = G.time + 0.8 + Math.random() * 0.8; return false; }
    // (out of reach from here: walk to its stand spot first — botAct takes it there; the chain is planned again on arrival)
    if (pl.stand) blog(b, 'trip', { src: pl.A.src, d: Math.round(Math.hypot(pl.stand.x - a.pos.x, pl.stand.z - a.pos.z) * 10) / 10 });
    if (pl.stand) { b._bobTrip = { S: pl.stand, A: pl.A, t0: G.time, m: G.match, zone: zonePlan() ? b.zZone : null, pt: -9 }; BOBBER_BOT.trips = (BOBBER_BOT.trips || 0) + 1; return false; }
    return startChain(b, pl.A, pl.L);
  },
  // in a fight: a pair laid across the foe's feet (where it will be in a moment), shot as soon as they tether with it still
  // in their reach (scan: the target standing in a chain of two is the better shot — and the fight's own shots at it
  // pass through them); else, rarely, a lone one just in front of a foe chasing us, for a teammate to shoot
  fight(b, dist) {
    const a = b.a, t = b.target;
    const P = planOf(b);
    if (P) {   // (the pair's second)
      if (a.ink < a.sub.inkCost + 2) return false;
      while (P.i < P.pts.length) { const q = P.pts[P.i++], at = okSpot(a, q.x, q.z, zonePlan() ? null : towerPlan()); if (at) { b._bobberAt = at; BOBBER_BOT.grows++; if (P.i >= P.pts.length) { b._bobPlan = null; b.bombCd = 6 + Math.random() * 4; } else b.bombCd = 0.3 + Math.random() * 0.15; return true; } }
      b._bobPlan = null; b.bombCd = 3; return false;
    }
    if (t && t.alive && dist >= 5 && dist <= 11 && a.ink >= 82 && a.hp >= 50 && Math.random() < 0.025 && mine(a).length < 12
      && !items.some((o) => o.team === a.team && o.state !== 'dead' && Math.hypot(o.spot.x - t.pos.x, o.spot.z - t.pos.z) < 3.5)) {
      const k = 0.8, px = t.pos.x + t.vel.x * k, pz = t.pos.z + t.vel.z * k, dx = px - a.pos.x, dz = pz - a.pos.z, l = Math.hypot(dx, dz) || 1;
      // (a metre short of it, toward us, 1.3 m either side of the line: both within a 2-chain's reach of it — R 2.2 − 0.3)
      const cx = px - (dx / l) * 1.0, cz = pz - (dz / l) * 1.0, ox = -dz / l * 1.3, oz = dx / l * 1.3, tp = zonePlan() ? null : towerPlan();
      const A = okSpot(a, cx + ox, cz + oz, tp), B = okSpot(a, cx - ox, cz - oz, tp);
      // (both clear of its own swing and its own shots' splash where it stands: a melee weapon's reach and then some)
      const minD = MELEE[a.weapon.kind] || MAIN_KITS[a.weapon.kind]?.bot?.melee ? 4.5 : 3.5;
      if (A && B && Math.hypot(A.x - a.pos.x, A.z - a.pos.z) >= minD && Math.hypot(B.x - a.pos.x, B.z - a.pos.z) >= minD) {
        b._bobPlan = { pts: [A, B], i: 1, t0: G.time, m: G.match, fight: true, A: { x: cx, y: A.y, z: cz, dx: dx / l, dz: dz / l } };
        b._bobberAt = A; b._bobSrc = 'pair'; b.bombCd = 0.3 + Math.random() * 0.15; BOBBER_BOT.fightPairs = (BOBBER_BOT.fightPairs || 0) + 1;
        return true;
      }
    }
    if (!t || !t.alive || dist < (MELEE[a.weapon.kind] || MAIN_KITS[a.weapon.kind]?.bot?.melee ? 6.5 : 5.5) || dist > 10 || Math.random() > 0.005) return false;   // (landing 1.6 m short of the foe: clear of its own swing)
    const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, l = Math.hypot(dx, dz) || 1;
    if ((t.vel.x * dx + t.vel.z * dz) / l < 2) return false;   // (not coming at us)
    const at = okSpot(a, t.pos.x + (dx / l) * 1.6, t.pos.z + (dz / l) * 1.6, zonePlan() ? null : towerPlan());
    if (!at) return false;
    b._bobberAt = at; b._bobSrc = 'lure'; b.bombCd = 6 + Math.random() * 4; BOBBER_BOT.lures++;
    return true;
  },
};

// ---- holding fire through our own idle bobbers (the review: "bots should hold fire, and avoid their own blasts, through an
// own-team bobber whose chain has no foe within R(N)"): the shot this bot is about to fire — along its aim, as far as its
// range or the foe it's fighting, or down to the floor for a paint shot — passes within a hand of one of its team's live
// bobbers (or ends with its splash on one: a blaster) whose chain has no foe known to the team (seen, or seen within a
// second) in its reach → it holds the trigger
// (a player sees their team's bobbers on screen). A chain with a foe in it is fair game: that shot sets it off on them.
const _a = new V3(), _d = new V3(), _nr = [];
function foeIn(ch, team) {
  // (held 0.15 s a chain and team: every firing bot of the team asks, every few frames)
  const c = ch._fi || (ch._fi = [-9, false, -9, false]), k = team * 2;
  if (G.time - c[k] < 0.15 && G.time >= c[k]) return c[k + 1];
  c[k] = G.time;
  return (c[k + 1] = foeInNow(ch, team));
}
function foeInNow(ch, team) {
  const R = sizeOf(ch.n).R;
  for (const e of G.actors) {
    if (e.team === team || !e.alive) continue;
    const k = teamKnown(team, e, 1.0); if (!k) continue;
    for (const o of ch.items) if (o.state === 'live' && Math.hypot(k.pos.x - o.spot.x, k.pos.z - o.spot.z) < R && Math.abs(k.pos.y + 0.7 - o.spot.y) < 1.8) return true;
  }
  return false;
}
// (our team's bobbers on their way: in flight to a bot's pick, or popping open at their spot — a shot into where one is
// about to float sets it off the moment it's live; the hash holds only live ones)
const _pend = [];
function pendingOwn(team) {
  _pend.length = 0;
  for (const it of items) if (it.team === team && (it.state === 'open' || (it.state === 'fly' && it.planned))) _pend.push(it);
  return _pend;
}
const posOf = (o) => (o.state === 'fly' ? o.planned : o.spot);
function idleNow(o, team) {
  if (o.state === 'live') return !!o.chain && !foeIn(o.chain, team);
  // (one on its way: idle unless a foe the team knows of stands within a lone one's reach of where it will float)
  const p = posOf(o), R = sizeOf(1).R;
  for (const e of G.actors) { if (e.team === team || !e.alive) continue; const k = teamKnown(team, e, 1.0); if (k && Math.hypot(k.pos.x - p.x, k.pos.z - p.z) < R && Math.abs(k.pos.y + 0.7 - p.y) < 1.8) return false; }
  return true;
}
// what a weapon's shot covers besides its line (config numbers, a per-draw [ring, full] pair read as its larger): the
// splash or burst where it goes off (a kit weapon's at least 1.4 m), its cone in degrees (the bow's fan, the Brolly's
// pellets, the Twinfire's spread), the side-by-side arrows' gap, and whether it goes off at the end of its flight
const _ws = new Map(), big = (v) => (Array.isArray(v) ? Math.max(0, ...v) : +v || 0);
function wSpec(w) {
  let o = _ws.get(w);
  if (!o) {
    const K = MAIN_KITS[w.kind], sr = Math.max(big(w.splashRadius), big(w.burstRadius), big(w.waveWidth), big(w.impactRadius), K ? 1.4 : 0);
    o = { sr, cone: Math.max(big(w.fanTap), big(w.fanRing), big(w.spreadDeg), big(w.spreadGround), big(w.swipeSpreadDeg) / 2), gap: big(w.fanGap), bursts: !!(w.burstRadius || w.fuseFull || w.kind === 'blaster') };
    _ws.set(w, o);
  }
  return o;
}
function holdFire(b, a) {
  const w = a.weapon, melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee), pad = SB().hitR + 0.3;
  const P = pendingOwn(a.team);
  // (right by it, whatever it holds: a blade's arc, a drum or a brush, a flick's splash, a fist's burst all land within a
  // couple of metres; a melee weapon's sweep reaches 4 m ahead, 1.6 m either side — of its aim or its body's facing)
  const fx = Math.sin(b.aimYaw), fz = Math.cos(b.aimYaw), bx = Math.sin(a.yaw), bz = Math.cos(a.yaw), M = melee ? 4.2 : 2.2;
  const nearHit = (o) => {
    const p = posOf(o);
    if (o.team !== a.team || Math.abs(p.y - a.pos.y - 1.0) >= 1.6) return false;
    const rx = p.x - a.pos.x, rz = p.z - a.pos.z;
    if (Math.hypot(rx, rz) < 2.0) return true;
    if (melee) for (const [ux, uz] of [[fx, fz], [bx, bz]]) { const f = rx * ux + rz * uz, l = Math.abs(rx * uz - rz * ux); if (f > -0.3 && f < 4.0 && l < 1.6) return true; }
    return false;
  };
  for (const o of near(a.pos.x - M, a.pos.z - M, a.pos.x + M, a.pos.z + M, _nr)) if (o.state === 'live' && o.chain && nearHit(o) && idleNow(o, a.team)) return o;
  for (const o of P) if (nearHit(o) && idleNow(o, a.team)) return o;
  // (along the shot, as a capsule: out as far as anything it looses reaches — its range, a blade's wave, a fist, a roller's
  // or a brush's flick — or the foe it's fighting plus a splash and a miss's carry; as wide as a bobber, the gun's spread at
  // that distance, and the splash of anything that bursts — a blaster's blob, a fist, an arrow, a slosher's glob, a blade's
  // wave — wherever along the way it goes off)
  const cp = Math.cos(b.aimPitch), ws = wSpec(w);
  const sr = ws.sr;
  _a.set(a.pos.x, a.pos.y + 1.15, a.pos.z); _d.set(fx * cp, Math.sin(b.aimPitch), fz * cp);
  let L = Math.max(weaponRange(w), w.waveRange || 0) * 1.05;
  // (the foe it's fighting plus a miss's carry — but a shot that lodges or bursts at the end of its flight, an arrow or a
  // blaster's blob, goes off wherever a miss ends: its whole reach)
  if (b.mode === 'fight' && b.target && !ws.bursts) L = Math.min(L, Math.hypot(b.target.pos.x - a.pos.x, b.target.pos.z - a.pos.z) + 2.5 + sr);
  if (_d.y < -0.05) L = Math.min(L, (1.15 + 0.15) / -_d.y + sr);
  // (as wide as the gun's spread now, its pellets' or arrows' fan, the side-by-side arrows' gap)
  const spr = Math.tan((((a.weaponRunner?.spread || 0) + ws.cone) * Math.PI) / 180), W = pad + sr + ws.gap + spr * L;
  const ex = _a.x + _d.x * L, ez = _a.z + _d.z * L;
  const along = (o) => {
    const p = posOf(o);
    const t0 = (p.x - _a.x) * _d.x + (p.y - _a.y) * _d.y + (p.z - _a.z) * _d.z;
    if (t0 < -0.5) return false;   // (behind it)
    const t = clamp(t0, 0, L);
    const qx = _a.x + _d.x * t - p.x, qy = _a.y + _d.y * t - p.y, qz = _a.z + _d.z * t - p.z, pt = pad + sr + ws.gap + spr * t;
    return qx * qx + qy * qy + qz * qz <= pt * pt;
  };
  for (const o of near(Math.min(_a.x, ex) - W, Math.min(_a.z, ez) - W, Math.max(_a.x, ex) + W, Math.max(_a.z, ez) + W, _nr)) {
    if (o.team !== a.team || o.state !== 'live' || !o.chain) continue;
    if (along(o) && idleNow(o, a.team)) return o;
  }
  for (const o of P) if (along(o) && idleNow(o, a.team)) return o;
  return null;
}

// its own live chain still short of four (or none yet)
function webToBuild(a) {
  let newest = null;
  for (const it of items) if (it.owner === a && !it.ghost && it.state === 'live' && (!newest || it.seq > newest.seq)) newest = it;
  return !newest || (newest.chain?.n || 1) < 4;
}
// where each team's bots have seen foes go (every 0.5 s, the last 20 s: a foe one of them sees now, where it is and how it
// moves) — the ground foes have been walking, as the team saw it: a chain laid there meets them again
const SEEN = [[], []];
let _seenT = -1, _seenM = null;
function noteSightings() {
  if (_seenM !== G.match) { _seenM = G.match; SEEN[0].length = SEEN[1].length = 0; _seenT = -1; }
  if (G.time - _seenT < 0.5 && G.time >= _seenT) return;
  _seenT = G.time;
  for (let t = 0; t < 2; t++) {
    const L = SEEN[t];
    while (L.length && G.time - L[0].t > 20) L.shift();
    for (const e of G.actors) {
      if (e.team === t || !e.alive || e.superJumpState) continue;
      if (!G.actors.some((m) => m.team === t && m.bot && m.alive && m.bot.sight?.sees(e))) continue;
      L.push({ x: e.pos.x, y: e.pos.y, z: e.pos.z, vx: e.vel.x, vz: e.vel.z, t: G.time });
      if (L.length > 160) L.shift();
    }
  }
}
// (counters, every 0.25 s: how long foes stood in a chain's reach — R(N) − 0.3 — at all, and seen by a bot of its team)
let _expT = -1;
function exposure() {
  if (G.time - _expT < 0.25 && G.time >= _expT) return;
  _expT = G.time;
  let any = 0, seen = 0, chains = 0;
  const done = new Set();
  for (const it of items) {
    if (it.state !== 'live' || !it.chain || done.has(it.chain)) continue;
    done.add(it.chain);
    if (it.chain.n >= 2) chains++;
    const R = sizeOf(it.chain.n).R - 0.3, ss = srcStat(it.chain.items[0]?.src || it.src || '-');
    ss.chainS += 0.25;
    for (const e of G.actors) {
      if (e.team === it.team || !e.alive) continue;
      let dmin = Infinity; for (const o of it.chain.items) if (o.state === 'live' && Math.abs(e.pos.y + 0.7 - o.spot.y) < 1.6) dmin = Math.min(dmin, Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z));
      if (dmin < R + 3) { BOBBER_BOT.foeNearS = (BOBBER_BOT.foeNearS || 0) + 0.25; ss.nearS += 0.25; }
      if (dmin >= R) continue;
      any++; ss.inS += 0.25;
      if (G.actors.some((m) => m.team === it.team && m.bot && m.alive && m.bot.sight?.sees(e))) seen++;
    }
  }
  BOBBER_BOT.foeInS = (BOBBER_BOT.foeInS || 0) + any * 0.25; BOBBER_BOT.foeInSeenS = (BOBBER_BOT.foeInSeenS || 0) + seen * 0.25; BOBBER_BOT.chainS = (BOBBER_BOT.chainS || 0) + chains * 0.25;
}
// ---- setting them off: botAct (bots.js, just before _tail; busy: a threat / canopy / pod / escape owns the aim)
const _aim = { yaw: 0, pitch: 0, dist: 6 };
export function botAct(b, dt, it, move, busy) {
  const a = b.a;
  if (a.sub?.kind === 'bobber') noteSightings();   // (only when some bot holds the sub: nothing else reads them)
  if (items.length) exposure();
  if (!a.alive || a.specialActive || a.superJumpState || a.climbing) { b._bob = null; return null; }
  let S = b._bob;
  // (it blew — done; 0.6 s of shots from the moment its aim settled on it went by, or 1.8 s in all — leave it a moment;
  // ready on a chain a foe was closing on: every 0.1 s, the foe in it now → fire; gone off, or 3 s → stand down)
  if (S && S.ready && S.it.state === 'live' && G.time - (S.chk || 0) >= 0.1) {
    S.chk = G.time;
    const st = foeAt(b, S.it.chain);
    if (st === 'in') { S.ready = false; S.t0 = G.time; S.fire0 = null; S.acqK = null; BOBBER_BOT.readyFired = (BOBBER_BOT.readyFired || 0) + 1; THREAT_STATS.chainShots++; }
    else if (!st || G.time - S.t0 > 3) { b._bobSkip = S.it.chain; b._bobSkipT = G.time + 0.5; S = b._bob = null; }
  }
  if (S && S.it && (S.it.state !== 'live' || (!S.ready && ((S.fire0 != null && G.time - S.fire0 > 0.6) || G.time - S.t0 > 1.8)))) {
    if (S.it.state === 'live') { BOBBER_BOT.gaveUp++; b._bobSkip = S.it.chain; b._bobSkipT = G.time + 1.5; }
    S = b._bob = null;
  }
  // (every bot, whatever its sub: its shot is about to go through one of its team's idle bobbers — hold it; in a duel,
  // step aside after a moment to clear the line)
  // (asked while it would fire, and while what it loosed is still going — a spinner's or a splatling's burst, a draw or a
  // charge, a roller's or a brush's flick winding up — whatever its sub)
  const wr0 = a.weaponRunner, going = !!wr0 && (wr0.charging || wr0.burstT > 0 || wr0.streaming || wr0.flick >= 0 || wr0.slosh >= 0);
  if (!S && (it.fire || going) && items.length) {
    // (asked every 3 frames a bot, the answer held between: its aim moves little in 0.05 s)
    let o = b._bobHF?.o;
    if (!b._bobHF || G.time - b._bobHF.t >= 0.05 || G.time < b._bobHF.t) { o = holdFire(b, a); b._bobHF = { t: G.time, o }; }
    if (o && o.state !== 'live' && o.state !== 'open' && o.state !== 'fly') o = null;
    if (o) {
      // (no shot: and what it had going is let go of without loosing it — a charge or a draw dropped (no shot, no ink), a
      // burst or a stream stopped, a wind-up undone — as a player swimming out of it would: the bow lets a stalled draw
      // go by itself, a spinner's burst runs on after the release, a flick comes out once wound up)
      it.fire = false;
      if (going && !wr0.aimingSub) { wr0.cancelForSwim(); BOBBER_BOT.dropped = (BOBBER_BOT.dropped || 0) + 1; }
      BOBBER_BOT.holds++;
      b._bobHoldT = (b._bobHoldT || 0) + dt;
      if (b.mode === 'fight' && b._bobHoldT > 0.35) { const sd = (b._bobHoldSd ||= Math.random() < 0.5 ? -1 : 1); move.set(Math.cos(b.aimYaw) * sd, 0, -Math.sin(b.aimYaw) * sd); }
    } else { b._bobHoldT = 0; b._bobHoldSd = 0; }
  }
  // (nor a special started right by them: a Splashdown, a Bomb Barrage, an Inkjet's first shots go off around it — it
  // waits until it has moved off its team's idle chain)
  if (it.special && !a.specialActive && items.length) {
    for (const o of near(a.pos.x - 5, a.pos.z - 5, a.pos.x + 5, a.pos.z + 5, _nr)) if (o.team === a.team && o.state === 'live' && o.chain && Math.hypot(o.spot.x - a.pos.x, o.spot.z - a.pos.z) < 5 && !foeIn(o.chain, a.team)) { it.special = false; BOBBER_BOT.spHolds = (BOBBER_BOT.spHolds || 0) + 1; break; }
  }
  if (busy) return null;
  const P = a.sub?.kind === 'bobber' ? planOf(b) : null, fighting = !!(b.target && b.seeTimer > 0);
  // laying a chain: hold about where it stands (its links are picked in reach of here) and, short of ink for the next one,
  // a quick dive in its own ink (42 ink/s) — a Zone Control guard with its web to build does the same before it starts
  // (a burst's chain left short of three: its growth, straight away — the links thrown by paint, bombCd waived)
  const Gr = b._bobGrow;
  if (Gr && G.time >= Gr.at && !P && !fighting) {
    b._bobGrow = null;
    const pts = Gr.m === G.match && a.sub?.kind === 'bobber' && a.alive ? growPlan(b, zonePlan() ? null : towerPlan()) : null;
    if (pts) { b._bobPlan = { pts, i: 0, t0: G.time, m: G.match, A: Gr.A, grow: Gr.n }; b.bombCd = 0; BOBBER_BOT.growPlans = (BOBBER_BOT.growPlans || 0) + 1; }
    blog(b, 'grow', { pts: pts ? pts.length : 0, n: Gr.n });
  }
  // (a set-up under way: on to its stand spot — the goal logic held off meanwhile, so it doesn't pick another)
  const T = a.sub?.kind === 'bobber' ? tripOf(b) : null;
  if (T && !S && !fighting && b.mode === 'paint') {
    b.goalTimer = Math.max(b.goalTimer, 1.5); b.goalCheckT = Math.max(b.goalCheckT || 0, 1.2); b.zHoldUntil = Math.max(b.zHoldUntil || 0, b.t + 0.6);
    const d = Math.hypot(a.pos.x - T.S.x, a.pos.z - T.S.z);
    // (no headway for 3 s — a route that ends short of it, a ledge — re-route; still far after 7 s: give it up)
    if (T.bestD == null || d < T.bestD - 1) { T.bestD = d; T.bestT = G.time; }
    if (d > 4 && G.time - T.t0 > 7) { b._bobTrip = null; BOBBER_BOT.tripsLost = (BOBBER_BOT.tripsLost || 0) + 1; blog(b, 'tripLost', { d: Math.round(d * 10) / 10 }); }
    else if (d > 1.2 && (!b.path || b.pi >= b.path.length || G.time - T.pt > 2.5 || G.time - T.bestT > 3)) { T.pt = G.time; if (G.time - T.bestT > 3) T.bestT = G.time; if (!b._pathTo(T.S, 0.9)) { b._bobTrip = null; BOBBER_BOT.tripsNoPath = (BOBBER_BOT.tripsNoPath || 0) + 1; blog(b, 'tripNoPath', { d: Math.round(d * 10) / 10 }); } }
    else if (d <= 1.2) { move.multiplyScalar(0.2); b.noProg = 0; }
  }
  const atStand = !!T && Math.hypot(a.pos.x - T.S.x, a.pos.z - T.S.z) <= 1.6;
  if (!S && a.sub?.kind === 'bobber' && !fighting && b.mode !== 'refill' && (P || atStand || (b.zRole === 'guard' && b.mode === 'paint' && webToBuild(a)))) {
    const low = a.ink < a.sub.inkCost + (P ? 6 : 42);
    // (short of ink for the chain: no painting with it — on its own ink a quick dive where it stands; off it, low, it goes
    // and refills, as bots.js does under 12 %, the plan kept)
    if (low) {
      it.fire = false;
      if (b.groundSeen === 1) { if (P || atStand) { move.multiplyScalar(0.05); b.noProg = 0; } it.squid = true; BOBBER_BOT.tops = (BOBBER_BOT.tops || 0) + 1; return null; }
      if (a.ink < (P ? 30 : 40) && b.mode === 'paint') { b.mode = 'refill'; b.refillUntil = 0.9; b.path = null; BOBBER_BOT.refills = (BOBBER_BOT.refills || 0) + 1; return null; }
    }
    if (P && !low) { move.multiplyScalar(0.05); b.noProg = 0; }   // (its links were picked from here: it stands while it lays them)
  }
  // (Turf: after laying a chain it keeps within reach of it while it lasts — a few metres behind it, its own side — so the
  // foes who come at it come through the chain, and it's there with a line to it; any fight comes first)
  const H = b._bobHold;
  if (H && (G.time > H.until || H.m !== G.match || !items.some((o) => o.owner === a && o.state === 'live' && Math.hypot(o.spot.x - H.x, o.spot.z - H.z) < 6))) b._bobHold = null;
  else if (H && !S && !fighting && b.mode === 'paint' && G.time - H.t > 1.5 && Math.hypot(a.pos.x - H.x, a.pos.z - H.z) > 9) {
    H.t = G.time;
    if (b._pathTo(_v.set(H.x - H.dx * 5.5, H.y, H.z - H.dz * 5.5), 0.6)) { b.goalTimer = 2.5; BOBBER_BOT.holdMoves = (BOBBER_BOT.holdMoves || 0) + 1; }
  }
  // (a fight's pair: its second straight after the first — bots.js asks a fighting bot's sub only with 8 ink to spare)
  if (!S && P?.fight && fighting && b.bombCd <= 0 && a.ink >= a.sub.inkCost + 2 && !b._bombAim && !b._releaseBomb && !a.weaponRunner?.aimingSub
    && botKit.fight(b, Math.hypot(b.target.pos.x - a.pos.x, b.target.pos.z - a.pos.z))) { b._bombAim = true; return null; }
  // setting one up outside the paint branch too (an escort by the tower, a guard on its zone, a bot on its way, the next
  // link of a burst): the same rules as bot.paint, never mid-fight, refilling, on the tower or with a throw under way
  if (!S && a.sub?.kind === 'bobber' && b.bombCd <= 0 && b.mode !== 'refill' && !fighting && !b._bombAim && !b._releaseBomb && !a.weaponRunner?.aimingSub
    && a.ink >= a.sub.inkCost + 2 && !G.match?.tower?.riderList?.includes(a) && botKit.paint(b)) { it.fire = false; b._bombAim = true; BOBBER_BOT.actSetups = (BOBBER_BOT.actSetups || 0) + 1; return null; }
  if (!S) {
    if (b.noBobberTrigger) return null;   // (tools/botlab/tests/bobber-web.js: the script's teammates leave its web to it)
    if ((b._bobScanT = (b._bobScanT ?? Math.random() * 0.1) - dt) > 0) return null;
    b._bobScanT = 0.1;
    S = scan(b);
    if (!S) return null;
    b._bob = S; BOBBER_BOT.engaged++; if (!S.ready) THREAT_STATS.chainShots++;
  }
  // turn to it (the usual aim error × 0.7 — its slow wander settling as it holds still on a still target) and fire by the
  // weapon's own trigger
  const w = a.weapon, kind = w.kind, KB = MAIN_KITS[kind]?.bot, melee = !!(MELEE[kind] || KB?.melee);
  const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z, p = S.it.spot;
  const dx = p.x - ex, dy = p.y - ey, dz = p.z - ez, dh = Math.hypot(dx, dz), d3 = Math.hypot(dh, dy);
  const idealYaw = Math.atan2(dx, dz), idealPitch = kind === 'roller' ? Math.min(-0.1, Math.atan2(dy, Math.max(0.5, dh))) : Math.atan2(dy, Math.max(0.5, dh));
  // (the acquisition error is a turn's overshoot: as big as the turn onto it asks — none to speak of when it already
  // looks that way, the full one from a quarter turn off)
  if (S.acqK == null) S.acqK = clamp((Math.abs(angleDiff(b.aimYaw, idealYaw)) + Math.abs(b.aimPitch - idealPitch)) / 0.35, 0.15, 1);
  const e = (b.diff.aimError ?? 0.05) * 0.7, acq = Math.exp(-(G.time - S.t0) / Math.max(0.12, (b.diff.reaction ?? 0.3) * 0.9)), settle = 0.35 + 0.65 * acq;
  _aim.yaw = idealYaw + e * (0.7 * settle * wander(b.t * 1.7 + (b.ph1 || 0)) + 2.2 * acq * S.acqK * S.sy);
  _aim.pitch = idealPitch + e * 0.6 * (0.7 * settle * wander(b.t * 2.1 + (b.ph2 || 0)) + 1.5 * acq * S.acqK * S.sp);
  _aim.dist = Math.max(1, d3);
  const off = Math.hypot(angleDiff(b.aimYaw, idealYaw), b.aimPitch - idealPitch), tol = Math.max(0.035, Math.atan2(0.2, Math.max(0.5, d3))) * 1.6;
  it.squid = false; it.sub = false; b._bombAim = false;
  a.fireFacing = Math.max(a.fireFacing || 0, 0.25);
  const wr = a.weaponRunner;
  // (the trigger once its aim is well inside the bobber — half its own size, hitR, at that distance: the gun's spread
  // does the rest; its wander has settled to a hundredth of a radian by then, so it waits a moment at most)
  const tf = Math.max(0.008, 0.55 * Math.atan2(SB().hitR, Math.max(0.5, d3)));
  if (S.ready) it.fire = !!(CHARGES[kind] && wr.charging);   // (ready: the trigger held — a charge kept up)
  else if (kind === 'charger') it.fire = wr.charging ? !(off < tol && wr.charge >= 0.12) : off < tol * 4 && !(wr.cooldown > 0);
  else it.fire = b._devTrigger ? b._devTrigger(d3, off < tf, off < tol * 4, S.lo, S.hi) : off < tf;
  // (a small target: a steady-trigger gun taps — lets its spread settle back to the first shot's between shots, as a
  // player would; it costs no rate: a Spritzer's bloom is back under 0.05 before its next shot is due)
  if (it.fire && !melee && !(MAIN_KITS[kind]?.bot?.charges) && kind !== 'charger' && (wr.bloom ?? 0) > 0.05) it.fire = false;
  // (the 0.6 s count starts once its aim has settled on the bobber)
  if (!S.ready && off < tf && S.fire0 == null) S.fire0 = G.time;
  // (feet planted: no hop while it lines up, and nothing loosed in the air — a jump throws the aim and doubles the spread)
  it.jump = false;
  if (it.fire && !a.grounded && !melee && !(CHARGES[kind] && wr.charging)) it.fire = false;
  if (it.fire) BOBBER_BOT.fired++;
  // (far off, it closes in a little while it lines up — only when it was walking anyway: its route keeps it off edges)
  if (!melee && dh > 9 && move.lengthSq() > 0.01) move.set(dx / dh, 0, dz / dh).multiplyScalar(0.5); else move.multiplyScalar(0.3);
  b.noProg = 0;   // (standing to line up a shot isn't being stuck: no unstick hop — a hop throws the aim and the spread out)
  return _aim;
}
// a foe in a bobber's reach R (R(N) − 0.3) for a shot now, by where it will be when the blast gets there (about 0.35 s:
// the shot's flight and the hops): in it and not on its way out fast, or walking into it from just outside
function inReach(e, o, d, R) {
  const px = e.pos.x + e.vel.x * 0.35, pz = e.pos.z + e.vel.z * 0.35, dp = Math.hypot(px - o.spot.x, pz - o.spot.z);
  return (d < R && dp < R + 0.3) || (dp < R - 0.2 && d < R + 1.2);
}
// (a ready bot, every 0.1 s) a foe it sees in that chain's reach now ('in'), still closing on it ('close'), or neither
function foeAt(b, ch) {
  const a = b.a, R = sizeOf(ch.n).R - 0.3;
  let st = null;
  for (const e of G.actors) {
    if (e.team === a.team || !e.alive || !b.sight?.sees(e)) continue;
    for (const o of ch.items) {
      if (o.state !== 'live' || Math.abs(e.pos.y + 0.7 - o.spot.y) >= 1.6) continue;
      const d = Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z);
      if (inReach(e, o, d, R)) return 'in';
      if (d < R + 3.6) st = 'close';
    }
  }
  return st;
}
// a chain of our team with a foe we see in its reach, and a line to one of its bobbers in our reach → { it, t0, … }
function scan(b) {
  const a = b.a, sight = b.sight;
  if (!sight) return null;
  BOBBER_BOT.scans++;
  const X = BOBBER_BOT.sx || (BOBBER_BOT.sx = { better: 0, noFoe: 0, noChain: 0, noLos: 0 });
  // (a better shot under way: our own target in our sights — unless it stands in a chain of two or more, whose blast is
  // the better shot: checked per chain below)
  const T = b.target;
  let better = null;
  if (T && b.mode === 'fight' && b.seeTimer > 0) {
    const tx = T.pos.x - a.pos.x, tz = T.pos.z - a.pos.z;
    if (Math.abs(angleDiff(b.aimYaw, Math.atan2(tx, tz))) < 0.15 && Math.hypot(tx, tz) < weaponRange(a.weapon) * 0.95) better = T;
  }
  const foes = [];
  for (const e of G.actors) if (e.team !== a.team && e.alive && sight.sees(e)) foes.push(e);
  if (!foes.length) { X.noFoe++; return null; }
  const w = a.weapon, melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
  const win = melee && b._meleeWindow ? b._meleeWindow(w, { ground: false, state: 'still' }) : [0, weaponRange(w) * 0.95];
  const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z;
  const seen = new Set();
  let best = null, bd = Infinity, bestReady = false;
  for (const it of items) {
    if (it.team !== a.team || it.state !== 'live' || !it.chain || seen.has(it.chain)) continue;
    const ch = it.chain;
    seen.add(ch);
    if (b._bobSkip === ch && G.time < (b._bobSkipT || 0)) continue;
    const R = sizeOf(ch.n).R - 0.3;
    let foeIn = false, tIn = false, close = null, cd = Infinity;
    for (const e of foes) for (const o of ch.items) {
      if (o.state !== 'live' || Math.abs(e.pos.y + 0.7 - o.spot.y) >= 1.6) continue;
      const d = Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z);
      if (inReach(e, o, d, R)) { foeIn = true; if (e === better) tIn = true; break; }
      if (d < R + 3.2 && d < cd) { cd = d; close = e; }
    }
    // (a foe closing on a chain of two or more, not yet in it: ready — aimed at the chain, the trigger held — as a player
    // watching one walk at their web would; not while it's in a duel of its own)
    let ready = false;
    if (!foeIn) { if (!close || ch.n < 2 || better || (b.mode === 'fight' && b.seeTimer > 0) || a.lastDamage < 0.8) continue; ready = true; }
    if (better && !(tIn && ch.n >= 2)) { X.better++; continue; }
    // a bobber of it in our reach with a line: the nearest first (rays from the shared budget)
    const cand = ch.items.filter((o) => o.state === 'live').map((o) => ({ o, d: Math.hypot(o.spot.x - ex, o.spot.y - ey, o.spot.z - ez) })).filter((c) => c.d >= win[0] && c.d <= win[1]).sort((x, y) => x.d - y.d);
    // (one sight line a chain a scan: its nearest bobber in reach — the biggest target — unless that one had no line a
    // moment ago, then the next)
    const c = cand.find((q) => !(b._bobNoLos === q.o && G.time - (b._bobNoLosT || 0) < 0.4)) || cand[0];
    if (c && (c.d < bd || (bestReady && !ready))) {
      const r = sightRay(_v.set(ex, ey, ez), c.o.spot);
      if (r === null) { BOBBER_BOT.deferred++; b._bobScanT = 0; return null; }   // (its share of this frame's rays is spent: next frame)
      // (a chain with a foe in it outranks one a foe is only closing on)
      if (r) { if (!best || !ready || bestReady) { best = c.o; bd = c.d; bestReady = ready; } } else { b._bobNoLos = c.o; b._bobNoLosT = G.time; X.noLos++; }
    }
  }
  if (!best) { X.noChain++; return null; }
  if (bestReady) BOBBER_BOT.readies = (BOBBER_BOT.readies || 0) + 1;
  return { it: best, t0: G.time, lo: win[0], hi: win[1], ready: bestReady, sy: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), sp: (Math.random() - 0.5) * 1.2 };
}

// ---- dangers (botSpecials.js specialDangers → SUB_KITS.bobber.dangers(api)): armed enemy chains, ≤ dangerCap discs
let pick = [], pickT = -1, pickM = null;
const armT = new WeakMap();   // chain → { t, armed: [team 0's bots know it's armed, team 1's] }
function armedFor(ch, team) {
  // team: the bots facing it (the other team); armed when they know a foe of the chain's team (in sight, or seen within
  // 1.5 s) within armRange of one of its bobbers with a line to it (re-checked every 0.25 s; a spent ray budget keeps the
  // last answer)
  // (one sight line a check at most — the nearest known foe to its nearest bobber; none when no foe is known near it)
  let s = armT.get(ch);
  if (!s) { s = { t: -9 + Math.random() * 0.25, armed: false }; armT.set(ch, s); }
  if (G.time - s.t < 0.25) return s.armed;
  s.t = G.time;
  const S = SB(), chainTeam = 1 - team;
  let best = null, bo = null, bd = Infinity;
  for (const e of G.actors) {
    if (e.team !== chainTeam || !e.alive) continue;
    const k = teamKnown(team, e, 1.5);
    if (!k) continue;
    for (const o of ch.items) { if (o.state !== 'live') continue; const d = o.spot.distanceTo(k.pos); if (d < bd) { bd = d; bo = o; best = k; } }
  }
  if (!best || bd > S.armRange) { s.armed = false; return false; }
  const r = sightRay(_v.set(best.pos.x, best.pos.y + 1.3, best.pos.z), bo.spot);
  if (r === null) { s.t -= 0.2; return s.armed; }   // (its share of this frame's rays is spent: again next frame)
  s.armed = r;
  return r;
}
export function botDangers(api) {
  if (!items.length) return;
  const m = G.match;
  if (m !== pickM) { pickM = m; pick = []; pickT = -1; }
  const S = SB();
  if (G.time - pickT >= 0.25 || G.time < pickT) {
    pickT = G.time;
    const cands = [];
    let armedN = 0;
    const done = new Set();
    for (const it of items) {
      if (it.state !== 'live' || !it.chain || done.has(it.chain)) continue;
      done.add(it.chain);
      const team = 1 - it.team;
      if (!G.actors.some((e) => e.team === team && e.bot && e.alive)) continue;   // (no bots on the other side: nobody reads it)
      if (!armedFor(it.chain, team)) continue;
      armedN++;
      for (const o of it.chain.items) {
        if (o.state !== 'live') continue;
        let nd = Infinity;
        for (const e of G.actors) if (e.team === team && e.bot && e.alive) nd = Math.min(nd, Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z));
        cands.push({ o, nd });
      }
    }
    cands.sort((x, y) => (x.nd - y.nd) || (x.o.gid - y.o.gid));
    pick = cands.slice(0, S.dangerCap).map((c) => c.o);
    BOBBER_BOT.armed = armedN; BOBBER_BOT.cands = cands.length;
  }
  let n = 0;
  for (const o of pick) {
    if (o.state !== 'live') continue;
    const sz = sizeOf(o.chain?.n || 1), R = sz.R, d = api.D(api.keyOf(o), 'bobber', o.team, o.owner);
    // (its lethal core: where the blast still does ≥ 100 to a full-health kid)
    const kk = Math.sqrt(Math.max(0, (100 - sz.dmin) / Math.max(1, sz.dmax - sz.dmin))), core = sz.dmax >= 100 ? 0.8 + (1 - kk) * (R - 0.8) : 0;
    // (dangerCore 1: only its heavy part is the danger — the lethal core where a full-health kid takes ≥ 100, or for a
    // chain of 1–2, which has none, where it takes ≥ 50 — and 0.2 m round it: the outer ring's 25–50 a foe walks through,
    // as a player would past a lone pellet)
    const k50 = Math.sqrt(Math.max(0, (50 - sz.dmin) / Math.max(1, sz.dmax - sz.dmin))), heavy = core > 0 ? core : 0.8 + (1 - k50) * (R - 0.8);
    api.disc(d, o.spot.x, o.spot.y - o.hover, o.spot.z, S.dangerCore ? heavy + 0.2 : R + 0.3, core);   // (dangerCore: the knob in config.js)
    d.yLo = o.spot.y - R - 1.2; d.yHi = o.spot.y + R;
    d.hit = 'bobber'; d.lethal = (o.chain?.n || 1) >= 3 ? 2 : 1; d.linger = true; d.vis = 'near';
    d.tIn = 0.3; d.tOut = Math.max(0.1, S.life - (G.time - o.born)); d.los = true; d.losY = o.hover;
    api.see(d, o.spot.x, o.spot.y, o.spot.z);
    n++;
  }
  BOBBER_BOT.discs = n; BOBBER_BOT.maxDiscs = Math.max(BOBBER_BOT.maxDiscs, n);
}
