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
import { items, sizeOf, SB, spotFor, predictFrom, near } from './bobber.js';

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3();
const wander = (x) => Math.sin(x) * 0.6 + Math.sin(x * 2.27 + 1.3) * 0.4;
const MELEE = { roller: true, brush: true }, CHARGES = { charger: true, spinner: true, splatling: true }, RELEASE = { ...CHARGES, bow: true, blade: true };
export const BOBBER_BOT = { setups: 0, grows: 0, lures: 0, scans: 0, engaged: 0, fired: 0, gaveUp: 0, deferred: 0, discs: 0, armed: 0, maxDiscs: 0, holds: 0, cands: 0,
  why: { calls: 0, ink: 0, hurt: 0, rolls: 0, spot: 0 } };   // (why: paint()'s answers — how often each condition said no)
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
// a spot to throw one at, on the floor at (x, z): ok to stand a bobber on? → { x, y, z } or null
const NO = BOBBER_BOT.no = { floor: 0, reach: 0, refused: 0, track: 0, line: 0, lob: 0 };
function okSpot(a, x, z, tower) {
  const gy = G.level.groundHeight(x, z, a.pos.y + 3);
  if (gy === -Infinity || gy < a.pos.y - 3) { NO.floor++; return null; }
  const d = Math.hypot(x - a.pos.x, z - a.pos.z);
  if (d < 2.5 || d > 10.5) { NO.reach++; return null; }
  spotFor(x, gy, z, 0, 1, 0, 'floor', -1, a.team, _spot);
  if (_spot.refused || _spot.base > gy + 0.05) { NO.refused++; return null; }   // (refused, or over the liquid: a dry floor only)
  if (tower && trackDist(tower, x, z) < (TOWER.platformR ?? 1.25) + 2.0 + 0.25) { NO.track++; return null; }
  if (!G.physics.los(_v.set(a.pos.x, a.pos.y + 1.6, a.pos.z), _v2.set(x, gy + 1.0, z))) { NO.line++; return null; }   // (a lob over a wall lands who knows where)
  return new V3(x, gy, z);
}
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
function layout(a, A, tower) {
  // (across: the perpendicular to the foes' way; by the tower: away from its line, so every link keeps its distance)
  let px = -A.dz, pz = A.dx;
  if (tower) { const o = awayFromTrack(tower, A.x, A.z); if (o) { px = o[0]; pz = o[1]; } }
  const L = [], shape = tower ? ALONG : ACROSS;
  for (const [u, v] of shape) {
    if (L.length >= 4) break;
    const x = A.x + px * u + A.dx * v, z = A.z + pz * u + A.dz * v;
    if (L.length && (L.some((q) => Math.hypot(q.x - x, q.z - z) < 2.4) || !L.some((q) => Math.hypot(q.x - x, q.z - z) <= 4.6))) continue;
    // (clear of the team's other chains — out of their blast's reach, so one going off doesn't take this one with it)
    if (items.some((o) => o.team === a.team && o.state === 'live' && Math.hypot(o.spot.x - x, o.spot.z - z) < 4.4)) continue;
    const at = okSpot(a, x, z, tower);
    if (at && (!L.length || Math.abs(at.y - L[0].y) < 1.5)) L.push(at);
  }
  return L.length >= 3 ? L : null;
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
// the mode's anchor for a new chain: { x, y, z, dx, dz } (dx, dz: the way foes walk there) or null (not now)
function modeAnchor(b) {
  const a = b.a, zp = zonePlan(), tp = zp ? null : towerPlan(), r = () => Math.random();
  const foeTeam = 1 - a.team;
  if (zp) {
    // Zone Control: an entry to its zone — where the foes' way in (from their pad, or from a spot round the zone on their
    // side, so not always the same door) crosses its edge, a metre or two outside it
    if (b.zZone < 0 || !zp.isActive(b.zZone)) return null;
    const z = zp.Z.zones[b.zZone], I = zp.info[b.zZone], c = z?.center; if (!c || !I) return null;
    if (Math.hypot(a.pos.x - c[0], a.pos.z - c[2]) > I.R + 9) return null;
    const [ex, ez] = zp.enemyDir(z, a.team), starts = [null];
    for (let i = 0; i < 6 && starts.length < 3; i++) {
      const id = I.far[(r() * I.far.length) | 0], q = G.nav.nodes[id]; if (!q) continue;
      const dx = q.x - c[0], dz = q.z - c[2], l = Math.hypot(dx, dz) || 1;
      if ((dx * ex + dz * ez) / l > 0.35) starts.push(q);
    }
    for (const st of starts.sort(() => r() - 0.5)) {
      let pts = foeRoute(foeTeam, _v.set(c[0], c[1], c[2]));
      if (st) { const nav = G.nav, s0 = nav.nearest(st, 1.2, true), g0 = nav.nearest(_v, 0.8); const P = s0 >= 0 && g0 >= 0 ? nav.path(s0, g0, foeTeam) : null; pts = P ? P.map((id) => nav.nodes[id]) : null; }
      if (!pts || pts.length < 3) continue;
      const A = entryOf(pts, c[0], c[2], I.R + 0.5, 1.2 + r() * 1.3);
      if (A && Math.hypot(A.x - a.pos.x, A.z - a.pos.z) <= 9.5) return A;
    }
    // (no door in throwing reach from where it stands: its zone's edge toward the foes' side, a few tries — a raised
    // zone's edge is often a drop — laid across their way in)
    for (let i = 0; i < 5; i++) {
      const side = (r() - 0.5) * I.R * 1.2, out = I.R - 0.5 + r() * 1.8, x = c[0] + ex * out - ez * side, z = c[2] + ez * out + ex * side;
      if (Math.hypot(x - a.pos.x, z - a.pos.z) > 9.5) continue;
      const gy = G.level.groundHeight(x, z, a.pos.y + 3);
      if (Number.isFinite(gy)) { BOBBER_BOT.edgeAnchors = (BOBBER_BOT.edgeAnchors || 0) + 1; return { x, y: gy, z, dx: -ex, dz: -ez }; }
    }
    return null;
  }
  if (tp) {   // Tower Command: by the track ahead of the tower (its next 24 m), 3.7–5.7 m off its line — within 6 m of it, never
    // in its swept body; the chain laid along the track (foes walk with the tower and round it)
    const T = tp.T, f = tp.fwdOf(a.team), C = [];
    for (let ds = 2; ds <= 24; ds += 1.5) {
      const p = tp.at(T.s + f * ds), q = tp.at(T.s + f * (ds + 1)), tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1;
      for (const sd of [-1, 1]) {
        const off = 3.7 + r() * 2, x = p.x - (tz / tl) * off * sd, z = p.z + (tx / tl) * off * sd, d = Math.hypot(x - a.pos.x, z - a.pos.z);
        if (d >= 3 && d <= 9.5) C.push({ x, y: p.y, z, dx: -tx / tl * f, dz: -tz / tl * f });
      }
    }
    return C.length ? C[(r() * C.length) | 0] : null;
  }
  // Turf: ground the team has seen foes walking lately (in throwing reach, where the sightings bunch) — else the way foes
  // come at this bot, the route from their pad to it, 5.5–8.5 m short of it; on the stretch of ground the front is on, not
  // deep in either base
  const pads = G.level.spawnPads; if (!pads?.[1]) return null;
  const total = pads[0].distanceTo(pads[1]), prog = 1 - Math.hypot(a.pos.x - pads[1 - a.team].x, a.pos.z - pads[1 - a.team].z) / total;
  if (prog < 0.3 || prog > 0.75) return null;
  const sa = seenAnchor(b);
  if (sa) { BOBBER_BOT.seenAnchors = (BOBBER_BOT.seenAnchors || 0) + 1; return sa; }
  const pts = foeRoute(foeTeam, a.pos);
  if (!pts || pts.length < 3) return null;
  const A = alongBack(pts, 5.5 + r() * 3);
  return A && Math.hypot(A.x - a.pos.x, A.z - a.pos.z) <= 9.5 ? A : null;
}
// the chain this bot is laying now (a burst: its links thrown one after another, the tank topped up between them)
function planOf(b) {
  const P = b._bobPlan;
  if (!P) return null;
  if (G.time - P.t0 > 14 || P.i >= P.pts.length || P.m !== G.match) { b._bobPlan = null; return null; }
  return P;
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
        const q = P.pts[P.i++], at = okSpot(a, q.x, q.z, tp);
        if (at) {
          b._bobberAt = at; BOBBER_BOT.grows++;
          if (P.i >= P.pts.length) {
            b._bobPlan = null; b.bombCd = 10 + Math.random() * 6; BOBBER_BOT.bursts = (BOBBER_BOT.bursts || 0) + 1;
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
    if (a.ink < 72) { W.ink++; return false; }
    if (G.time < (b._bobNoSpotT || 0) || Math.random() > (guard ? 0.1 : 0.02)) return false;
    W.rolls++;
    const A = modeAnchor(b), L = A && layout(a, A, tp);
    if (!L) { W.spot++; b._bobNoSpotT = G.time + 0.8 + Math.random() * 0.8; return false; }
    b._bobPlan = { pts: L, i: 1, t0: G.time, m: G.match, A };
    b._bobberAt = L[0];
    b.bombCd = 0.45 + Math.random() * 0.3;
    BOBBER_BOT.setups++;
    return true;
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
    if (t && t.alive && dist >= 5 && dist <= 11 && a.ink >= 82 && a.hp >= 50 && Math.random() < 0.025
      && !items.some((o) => o.team === a.team && o.state !== 'dead' && Math.hypot(o.spot.x - t.pos.x, o.spot.z - t.pos.z) < 3.5)) {
      const k = 0.8, px = t.pos.x + t.vel.x * k, pz = t.pos.z + t.vel.z * k, dx = px - a.pos.x, dz = pz - a.pos.z, l = Math.hypot(dx, dz) || 1;
      // (a metre short of it, toward us, 1.3 m either side of the line: both within a 2-chain's reach of it — R 2.2 − 0.3)
      const cx = px - (dx / l) * 1.0, cz = pz - (dz / l) * 1.0, ox = -dz / l * 1.3, oz = dx / l * 1.3, tp = zonePlan() ? null : towerPlan();
      const A = okSpot(a, cx + ox, cz + oz, tp), B = okSpot(a, cx - ox, cz - oz, tp);
      if (A && B) {
        b._bobPlan = { pts: [A, B], i: 1, t0: G.time, m: G.match, fight: true, A: { x: cx, y: A.y, z: cz, dx: dx / l, dz: dz / l } };
        b._bobberAt = A; b.bombCd = 0.3 + Math.random() * 0.15; BOBBER_BOT.fightPairs = (BOBBER_BOT.fightPairs || 0) + 1;
        return true;
      }
    }
    if (!t || !t.alive || dist < 3 || dist > 10 || Math.random() > 0.005) return false;
    const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, l = Math.hypot(dx, dz) || 1;
    if ((t.vel.x * dx + t.vel.z * dz) / l < 2) return false;   // (not coming at us)
    const at = okSpot(a, t.pos.x + (dx / l) * 1.6, t.pos.z + (dz / l) * 1.6, zonePlan() ? null : towerPlan());
    if (!at) return false;
    b._bobberAt = at; b.bombCd = 6 + Math.random() * 4; BOBBER_BOT.lures++;
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
function holdFire(b, a) {
  const w = a.weapon, melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee), pad = SB().hitR + 0.3;
  const idle = (o) => o.team === a.team && o.state === 'live' && o.chain && Math.abs(o.spot.y - a.pos.y - 1.0) < 1.6;
  // (right by it, whatever it holds: a blade's arc, a drum or a brush, a flick's splash, a fist's burst all land within a
  // couple of metres; a melee weapon's sweep reaches 4 m ahead, 1.6 m either side — of its aim or its body's facing)
  const fx = Math.sin(b.aimYaw), fz = Math.cos(b.aimYaw), bx = Math.sin(a.yaw), bz = Math.cos(a.yaw), M = melee ? 4.2 : 2.2;
  for (const o of near(a.pos.x - M, a.pos.z - M, a.pos.x + M, a.pos.z + M, _nr)) {
    if (!idle(o)) continue;
    const rx = o.spot.x - a.pos.x, rz = o.spot.z - a.pos.z;
    let hit = Math.hypot(rx, rz) < 2.0;
    if (!hit && melee) for (const [ux, uz] of [[fx, fz], [bx, bz]]) { const f = rx * ux + rz * uz, l = Math.abs(rx * uz - rz * ux); if (f > -0.3 && f < 4.0 && l < 1.6) { hit = true; break; } }
    if (hit && !foeIn(o.chain, a.team)) return o;
  }
  if (melee) return null;
  // (along the shot, as a capsule: out as far as anything it looses reaches — its range, a blade's wave, a fist — or the
  // foe it's fighting plus a splash; as wide as a bobber, the gun's spread at that distance, and the splash of anything
  // that bursts — a blaster's blob, a fist, an arrow, a slosher's glob, a blade's wave — wherever along the way it goes off)
  const cp = Math.cos(b.aimPitch), K = MAIN_KITS[w.kind], sr = Math.max(w.splashRadius || 0, w.burstRadius || 0, w.waveWidth || 0, K ? 1.4 : 0);
  _a.set(a.pos.x, a.pos.y + 1.15, a.pos.z); _d.set(fx * cp, Math.sin(b.aimPitch), fz * cp);
  let L = Math.max(weaponRange(w), w.waveRange || 0) * 1.05;
  if (b.mode === 'fight' && b.target) L = Math.min(L, Math.hypot(b.target.pos.x - a.pos.x, b.target.pos.z - a.pos.z) + 0.8 + sr);
  if (_d.y < -0.05) L = Math.min(L, (1.15 + 0.15) / -_d.y + sr);
  const spr = Math.tan(((a.weaponRunner?.spread || 0) * Math.PI) / 180), W = pad + sr + spr * L;
  const ex = _a.x + _d.x * L, ez = _a.z + _d.z * L;
  for (const o of near(Math.min(_a.x, ex) - W, Math.min(_a.z, ez) - W, Math.max(_a.x, ex) + W, Math.max(_a.z, ez) + W, _nr)) {
    if (o.team !== a.team || o.state !== 'live' || !o.chain) continue;
    const t0 = (o.spot.x - _a.x) * _d.x + (o.spot.y - _a.y) * _d.y + (o.spot.z - _a.z) * _d.z;
    if (t0 < -0.5) continue;   // (behind it)
    const t = clamp(t0, 0, L);
    const qx = _a.x + _d.x * t - o.spot.x, qy = _a.y + _d.y * t - o.spot.y, qz = _a.z + _d.z * t - o.spot.z, pt = pad + sr + spr * t;
    if (qx * qx + qy * qy + qz * qz > pt * pt) continue;
    if (!foeIn(o.chain, a.team)) return o;
  }
  return null;
}

// its own live chain still short of four (or none yet)
function webToBuild(a) {
  let newest = null;
  for (const it of items) if (it.owner === a && !it.ghost && it.state === 'live' && (!newest || it.seq > newest.seq)) newest = it;
  return !newest || (newest.chain?.n || 1) < 4;
}
// where each team's bots have seen foes go (every 0.5 s, the last 12 s: a foe one of them sees now, where it is and how it
// moves) — the ground foes have been walking, as the team saw it: a chain laid there meets them again
const SEEN = [[], []];
let _seenT = -1, _seenM = null;
function noteSightings() {
  if (_seenM !== G.match) { _seenM = G.match; SEEN[0].length = SEEN[1].length = 0; _seenT = -1; }
  if (G.time - _seenT < 0.5 && G.time >= _seenT) return;
  _seenT = G.time;
  for (let t = 0; t < 2; t++) {
    const L = SEEN[t];
    while (L.length && G.time - L[0].t > 12) L.shift();
    for (const e of G.actors) {
      if (e.team === t || !e.alive || e.superJumpState) continue;
      if (!G.actors.some((m) => m.team === t && m.bot && m.alive && m.bot.sight?.sees(e))) continue;
      L.push({ x: e.pos.x, y: e.pos.y, z: e.pos.z, vx: e.vel.x, vz: e.vel.z, t: G.time });
      if (L.length > 96) L.shift();
    }
  }
}
// (Turf, and a Zone Control bot off its zone's doors) an anchor on ground foes have been seen on lately: in throwing reach,
// where sightings bunch (a lane they use), across the way they were going → { x, y, z, dx, dz } or null
function seenAnchor(b) {
  const a = b.a, L = SEEN[a.team];
  let best = null, bs = 0;
  for (const p of L) {
    const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z);
    if (d < 3.5 || d > 9.5 || Math.abs(p.y - a.pos.y) > 2.5) continue;
    let n = 0, vx = 0, vz = 0;
    for (const q of L) if (Math.hypot(q.x - p.x, q.z - p.z) < 4) { n += 1 - (G.time - q.t) / 16; vx += q.vx; vz += q.vz; }
    if (n > bs) { bs = n; const vl = Math.hypot(vx, vz); best = { x: p.x, y: p.y, z: p.z, dx: vl > 0.5 ? vx / vl : (p.x - a.pos.x) / d, dz: vl > 0.5 ? vz / vl : (p.z - a.pos.z) / d }; }
  }
  return bs >= 1.5 ? best : null;
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
    const R = sizeOf(it.chain.n).R - 0.3;
    for (const e of G.actors) {
      if (e.team === it.team || !e.alive) continue;
      let dmin = Infinity; for (const o of it.chain.items) if (o.state === 'live' && Math.abs(e.pos.y + 0.7 - o.spot.y) < 1.6) dmin = Math.min(dmin, Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z));
      if (dmin < R + 3) BOBBER_BOT.foeNearS = (BOBBER_BOT.foeNearS || 0) + 0.25;
      if (dmin >= R) continue;
      any++;
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
  if (!S && it.fire && items.length) {
    // (asked every 3 frames a bot, the answer held between: its aim moves little in 0.05 s)
    let o = b._bobHF?.o;
    if (!b._bobHF || G.time - b._bobHF.t >= 0.05 || G.time < b._bobHF.t) { o = holdFire(b, a); b._bobHF = { t: G.time, o }; }
    if (o && o.state !== 'live') o = null;
    if (o) {
      // (a weapon that looses on the release — a charger, splatling, spinner, the bow, the blade's heavy cut — and was held
      // last frame: it keeps holding instead of letting go into the bobber)
      if (a._prevIntent?.fire && (RELEASE[a.weapon.kind] || MAIN_KITS[a.weapon.kind]?.bot?.charges)) it.fire = true; else it.fire = false;
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
  if (!S && a.sub?.kind === 'bobber' && !fighting && b.mode !== 'refill' && (P || (b.zRole === 'guard' && b.mode === 'paint' && webToBuild(a)))) {
    const low = a.ink < a.sub.inkCost + (P ? 6 : 42);
    if (low && b.groundSeen === 1) { if (P) { move.multiplyScalar(0.3); b.noProg = 0; } it.squid = true; it.fire = false; BOBBER_BOT.tops = (BOBBER_BOT.tops || 0) + 1; return null; }
    if (P && !low) { move.multiplyScalar(0.3); b.noProg = 0; }   // (dry ground under it: it paints on as usual, and dives once it's on its ink)
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
// (a ready bot, every 0.1 s) a foe it sees in that chain's reach now ('in'), still closing on it ('close'), or neither
function foeAt(b, ch) {
  const a = b.a, R = sizeOf(ch.n).R - 0.3;
  let st = null;
  for (const e of G.actors) {
    if (e.team === a.team || !e.alive || !b.sight?.sees(e)) continue;
    for (const o of ch.items) {
      if (o.state !== 'live' || Math.abs(e.pos.y + 0.7 - o.spot.y) >= 1.6) continue;
      const d = Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z);
      if (d < R) return 'in';
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
      if (d < R) { foeIn = true; if (e === better) tIn = true; break; }
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
    api.disc(d, o.spot.x, o.spot.y - o.hover, o.spot.z, S.dangerCore && core > 0 ? core + 0.2 : R + 0.3, core);   // (dangerCore: the A/B knob in config.js)
    d.yLo = o.spot.y - R - 1.2; d.yHi = o.spot.y + R;
    d.hit = 'bobber'; d.lethal = (o.chain?.n || 1) >= 3 ? 2 : 1; d.linger = true; d.vis = 'near';
    d.tIn = 0.3; d.tOut = Math.max(0.1, S.life - (G.time - o.born)); d.los = true; d.losY = o.hover;
    api.see(d, o.spot.x, o.spot.y, o.spot.z);
    n++;
  }
  BOBBER_BOT.discs = n; BOBBER_BOT.maxDiscs = Math.max(BOBBER_BOT.maxDiscs, n);
}
