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
import { items, sizeOf, SB, spotFor } from './bobber.js';

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3();
const wander = (x) => Math.sin(x) * 0.6 + Math.sin(x * 2.27 + 1.3) * 0.4;
const MELEE = { roller: true, brush: true };
export const BOBBER_BOT = { setups: 0, grows: 0, lures: 0, scans: 0, engaged: 0, fired: 0, gaveUp: 0, deferred: 0, discs: 0, armed: 0, maxDiscs: 0 };
export function resetBobberBot() { for (const k in BOBBER_BOT) BOBBER_BOT[k] = 0; THREAT_STATS.chainShots = 0; THREAT_STATS.chainWasted = 0; }
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
function okSpot(a, x, z, tower) {
  const gy = G.level.groundHeight(x, z, a.pos.y + 3);
  if (gy === -Infinity || gy < a.pos.y - 3) return null;
  const d = Math.hypot(x - a.pos.x, z - a.pos.z);
  if (d < 2.5 || d > 10.5) return null;
  spotFor(x, gy, z, 0, 1, 0, 'floor', -1, a.team, _spot);
  if (_spot.refused || _spot.base > gy + 0.05) return null;   // (refused, or over the liquid: a dry floor only)
  if (tower && trackDist(tower, x, z) < (TOWER.platformR ?? 1.25) + 2.0 + 0.25) return null;
  if (!G.physics.los(_v.set(a.pos.x, a.pos.y + 1.6, a.pos.z), _v2.set(x, gy + 1.0, z))) return null;   // (a lob over a wall lands who knows where)
  return new V3(x, gy, z);
}
// how far (x, z) is from the tower track's centre line (its metre points)
function trackDist(P, x, z) {
  let best = Infinity;
  const pts = P.pts;
  for (let i = 1; i < pts.length; i++) { const d = segDist(x, z, pts[i - 1].x, pts[i - 1].z, pts[i].x, pts[i].z); if (d < best) best = d; }
  return best;
}
// the mode's spot for a new chain (null: not now)
function modeSpot(b) {
  const a = b.a, zp = zonePlan(), tp = zp ? null : towerPlan(), r = () => Math.random();
  if (zp) {
    if (b.zRole !== 'guard' || b.zZone < 0) return null;
    const z = zp.Z.zones[b.zZone], I = zp.info[b.zZone]; if (!z || !I) return null;
    const [ex, ez] = zp.enemyDir(z, a.team), side = (r() - 0.5) * I.R * 1.2, out = I.R - 0.5 + r() * 1.8;
    return okSpot(a, z.center[0] + ex * out - ez * side, z.center[2] + ez * out + ex * side, null);
  }
  if (tp) {
    const T = tp.T, f = tp.fwdOf(a.team), p = tp.at(T.s + f * (2 + r() * 6)), q = tp.at(T.s + f * (2 + r() * 6) + 1);
    const tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1, s = r() < 0.5 ? -1 : 1, off = 3.7 + r() * 2;
    return okSpot(a, p.x - (tz / tl) * off * s, p.z + (tx / tl) * off * s, tp);
  }
  const pads = G.level.spawnPads; if (!pads?.[1]) return null;
  const total = pads[0].distanceTo(pads[1]), prog = 1 - Math.hypot(a.pos.x - pads[1 - a.team].x, a.pos.z - pads[1 - a.team].z) / total;
  if (prog < 0.45 || prog > 0.65) return null;
  const yaw = a.aimYaw + (r() - 0.5) * 0.9, d = 5 + r() * 3;
  return okSpot(a, a.pos.x + Math.sin(yaw) * d, a.pos.z + Math.cos(yaw) * d, null);
}
export const botKit = {
  paint(b) {
    const a = b.a;
    if (a.ink < 60 || a.lastDamage < 1.5 || Math.random() > 0.02) return false;
    const L = mine(a);
    let newest = null; for (const it of L) if (!newest || it.seq > newest.seq) newest = it;
    if (newest && (newest.chain?.n || 1) >= 4) {   // a chain done: a long breather (once per chain), then a new one
      if (newest.chain && !newest.chain.botDone) { newest.chain.botDone = true; b.bombCd = 10 + Math.random() * 6; }
      newest = null;
      if (b.bombCd > 0) return false;
    }
    const tp = zonePlan() ? null : towerPlan();
    let at = null;
    if (newest) {   // grow it: 3–5 m from the newest, toward the front / along the line
      for (let i = 0; i < 6 && !at; i++) {
        const ang = a.aimYaw + (Math.random() - 0.5) * 2.4, d = 3.2 + Math.random() * 1.6;
        at = okSpot(a, newest.spot.x + Math.sin(ang) * d, newest.spot.z + Math.cos(ang) * d, tp);
      }
      if (at) BOBBER_BOT.grows++;
    } else { at = modeSpot(b); if (at) BOBBER_BOT.setups++; }
    if (!at) return false;
    b._bobberAt = at;
    b.bombCd = 1.5 + Math.random() * 1.5;
    return true;
  },
  // a lone one just in front of a foe chasing us: a teammate can shoot it
  fight(b, dist) {
    const a = b.a, t = b.target;
    if (!t || !t.alive || dist < 3 || dist > 10 || Math.random() > 0.005) return false;
    const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, l = Math.hypot(dx, dz) || 1;
    if ((t.vel.x * dx + t.vel.z * dz) / l < 2) return false;   // (not coming at us)
    const at = okSpot(a, t.pos.x + (dx / l) * 1.6, t.pos.z + (dz / l) * 1.6, null);
    if (!at) return false;
    b._bobberAt = at; b.bombCd = 6 + Math.random() * 4; BOBBER_BOT.lures++;
    return true;
  },
};

// ---- setting them off: botAct (bots.js, just before _tail; busy: a threat / canopy / pod / escape owns the aim)
const _aim = { yaw: 0, pitch: 0, dist: 6 };
export function botAct(b, dt, it, move, busy) {
  const a = b.a;
  if (!a.alive || a.specialActive || a.superJumpState || a.climbing) { b._bob = null; return null; }
  let S = b._bob;
  if (S && S.it && (S.it.state !== 'live' || G.time - S.t0 > 0.6)) {   // it blew (or 0.6 s went by): done / leave it a moment
    if (S.it.state === 'live') { BOBBER_BOT.gaveUp++; b._bobSkip = S.it.chain; b._bobSkipT = G.time + 1.5; }
    S = b._bob = null;
  }
  if (busy) return null;
  if (!S) {
    if ((b._bobScanT = (b._bobScanT ?? Math.random() * 0.1) - dt) > 0) return null;
    b._bobScanT = 0.1;
    S = scan(b);
    if (!S) return null;
    b._bob = S; BOBBER_BOT.engaged++; THREAT_STATS.chainShots++;
  }
  // turn to it (the usual aim error × 0.7) and fire by the weapon's own trigger
  const w = a.weapon, kind = w.kind, KB = MAIN_KITS[kind]?.bot, melee = !!(MELEE[kind] || KB?.melee);
  const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z, p = S.it.spot;
  const dx = p.x - ex, dy = p.y - ey, dz = p.z - ez, dh = Math.hypot(dx, dz), d3 = Math.hypot(dh, dy);
  const idealYaw = Math.atan2(dx, dz), idealPitch = kind === 'roller' ? Math.min(-0.1, Math.atan2(dy, Math.max(0.5, dh))) : Math.atan2(dy, Math.max(0.5, dh));
  const e = (b.diff.aimError ?? 0.05) * 0.7, acq = Math.exp(-(G.time - S.t0) / Math.max(0.12, (b.diff.reaction ?? 0.3) * 0.9));
  _aim.yaw = idealYaw + e * (0.7 * wander(b.t * 1.7 + (b.ph1 || 0)) + 2.2 * acq * S.sy);
  _aim.pitch = idealPitch + e * 0.6 * (0.7 * wander(b.t * 2.1 + (b.ph2 || 0)) + 1.5 * acq * S.sp);
  _aim.dist = Math.max(1, d3);
  const off = Math.hypot(angleDiff(b.aimYaw, idealYaw), b.aimPitch - idealPitch), tol = Math.max(0.035, Math.atan2(0.2, Math.max(0.5, d3))) * 1.6;
  it.squid = false; it.sub = false; b._bombAim = false;
  a.fireFacing = Math.max(a.fireFacing || 0, 0.25);
  if (kind === 'charger') { const wr = a.weaponRunner; it.fire = wr.charging ? !(off < tol && wr.charge >= 0.12) : off < tol * 4 && !(wr.cooldown > 0); }
  else it.fire = b._devTrigger ? b._devTrigger(d3, off < tol, off < tol * 4, S.lo, S.hi) : off < tol;
  if (it.fire) BOBBER_BOT.fired++;
  move.multiplyScalar(0.3);
  return _aim;
}
// a chain of our team with a foe we see in its reach, and a line to one of its bobbers in our reach → { it, t0, … }
function scan(b) {
  const a = b.a, sight = b.sight;
  if (!sight) return null;
  BOBBER_BOT.scans++;
  // (a better shot under way: our own target in our sights)
  const T = b.target;
  if (T && b.mode === 'fight' && b.seeTimer > 0) {
    const tx = T.pos.x - a.pos.x, tz = T.pos.z - a.pos.z;
    if (Math.abs(angleDiff(b.aimYaw, Math.atan2(tx, tz))) < 0.15 && Math.hypot(tx, tz) < weaponRange(a.weapon) * 0.95) return null;
  }
  const foes = [];
  for (const e of G.actors) if (e.team !== a.team && e.alive && sight.sees(e)) foes.push(e);
  if (!foes.length) return null;
  const w = a.weapon, melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
  const win = melee && b._meleeWindow ? b._meleeWindow(w, { ground: false, state: 'still' }) : [0, weaponRange(w) * 0.95];
  const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z;
  const seen = new Set();
  let best = null, bd = Infinity;
  for (const it of items) {
    if (it.team !== a.team || it.state !== 'live' || !it.chain || seen.has(it.chain)) continue;
    const ch = it.chain;
    seen.add(ch);
    if (b._bobSkip === ch && G.time < (b._bobSkipT || 0)) continue;
    const R = sizeOf(ch.n).R - 0.3;
    let foeIn = false;
    for (const e of foes) { for (const o of ch.items) if (o.state === 'live' && Math.hypot(e.pos.x - o.spot.x, e.pos.z - o.spot.z) < R && Math.abs(e.pos.y + 0.7 - o.spot.y) < 1.6) { foeIn = true; break; } if (foeIn) break; }
    if (!foeIn) continue;
    // a bobber of it in our reach with a line: the nearest first (rays from the shared budget)
    const cand = ch.items.filter((o) => o.state === 'live').map((o) => ({ o, d: Math.hypot(o.spot.x - ex, o.spot.y - ey, o.spot.z - ez) })).filter((c) => c.d >= win[0] && c.d <= win[1]).sort((x, y) => x.d - y.d);
    for (const c of cand.slice(0, 3)) {
      if (c.d >= bd) break;
      const r = sightRay(_v.set(ex, ey, ez), c.o.spot);
      if (r === null) { BOBBER_BOT.deferred++; b._bobScanT = 0; return null; }   // (this frame's rays are spent: next frame)
      if (r) { best = c.o; bd = c.d; break; }
    }
  }
  if (!best) return null;
  return { it: best, t0: G.time, lo: win[0], hi: win[1], sy: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), sp: (Math.random() - 0.5) * 1.2 };
}

// ---- dangers (botSpecials.js specialDangers → SUB_KITS.bobber.dangers(api)): armed enemy chains, ≤ dangerCap discs
let pick = [], pickT = -1, pickM = null;
const armT = new WeakMap();   // chain → { t, armed: [team 0's bots know it's armed, team 1's] }
function armedFor(ch, team) {
  // team: the bots facing it (the other team); armed when they know a foe of the chain's team (in sight, or seen within
  // 1.5 s) within armRange of one of its bobbers with a line to it (re-checked every 0.25 s; a spent ray budget keeps the
  // last answer)
  let s = armT.get(ch);
  if (!s) { s = { t: -9 + Math.random() * 0.25, armed: false }; armT.set(ch, s); }
  if (G.time - s.t < 0.25) return s.armed;
  s.t = G.time;
  const S = SB(), chainTeam = 1 - team;
  let armed = false, spent = false;
  for (const e of G.actors) {
    if (e.team !== chainTeam || !e.alive) continue;
    const k = teamKnown(team, e, 1.5);
    if (!k) continue;
    let nearest = null, nd = Infinity;
    for (const o of ch.items) { if (o.state !== 'live') continue; const d = o.spot.distanceTo(k.pos); if (d < nd) { nd = d; nearest = o; } }
    if (!nearest || nd > S.armRange) continue;
    const r = sightRay(_v.set(k.pos.x, k.pos.y + 1.3, k.pos.z), nearest.spot);
    if (r === null) { spent = true; continue; }
    if (r) { armed = true; break; }
  }
  if (spent && !armed) { s.t -= 0.2; return s.armed; }   // (try again next frame)
  s.armed = armed;
  return armed;
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
    BOBBER_BOT.armed = armedN;
  }
  let n = 0;
  for (const o of pick) {
    if (o.state !== 'live') continue;
    const sz = sizeOf(o.chain?.n || 1), R = sz.R, d = api.D(api.keyOf(o), 'bobber', o.team, o.owner);
    // (its lethal core: where the blast still does ≥ 100 to a full-health kid)
    const kk = Math.sqrt(Math.max(0, (100 - sz.dmin) / Math.max(1, sz.dmax - sz.dmin))), core = sz.dmax >= 100 ? 0.8 + (1 - kk) * (R - 0.8) : 0;
    api.disc(d, o.spot.x, o.spot.y - o.hover, o.spot.z, R + 0.3, core);
    d.yLo = o.spot.y - R - 1.2; d.yHi = o.spot.y + R;
    d.hit = 'bobber'; d.lethal = (o.chain?.n || 1) >= 3 ? 2 : 1; d.linger = true; d.vis = 'near';
    d.tIn = 0.3; d.tOut = Math.max(0.1, S.life - (G.time - o.born)); d.los = true; d.losY = o.hover;
    api.see(d, o.spot.x, o.spot.y, o.spot.z);
    n++;
  }
  BOBBER_BOT.discs = n; BOBBER_BOT.maxDiscs = Math.max(BOBBER_BOT.maxDiscs, n);
}
