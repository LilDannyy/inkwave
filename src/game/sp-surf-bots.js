// Bots and Surf N' Turf (src/game/sp-surf.js). Kept apart from it (no import of specials.js / sp-surf.js: bots.js and
// botSpecials.js load this before the specials do) — it reads the live buoys out of G.specials.world.
//   using it    _wantSpecial (bots.js): a foe in reach, or — painting — foes the team knows of within a throw and a
//               ring (surfWant); on a zone / the tower (the bots' objective rules). Holding it, surfOwnAim (BotSpecials.act) picks the spot — the thickest knot of the foes its team
//               knows about (seen, located, seen lately: botSight.js teamKnown — no wall-hacks) in throwing range, else
//               the live zone / the tower, else the most enemy / unclaimed ink a throw away — turns to it and throws
//               (the launch solved for that spot: the throw's own speed and gravity) once its aim has come round.
//   jumping     surfDodge (BotSpecials.act): an enemy ring coming at us (it'll reach us, no wall between) → a jump timed
//               so our feet are over its top as the front goes by. A bot notices a ring after its reaction time from
//               when the ring left the buoy (it's big and loud: anyone looking or not); by difficulty it now and then
//               misses one altogether, and its timing is off by a little (MISS / ERR).
//   shooting it surfShootAim (BotSpecials.act): with no foe in sight, an enemy buoy in range and in sight is shot down.
// SURF_BOT counts it all (match.cjs / tests).
import * as THREE from 'three';
import { G, angleDiff } from '../core/ctx.js';
import { SPECIALS, weaponRange } from '../config.js';
import { teamKnown } from './botSight.js';

const D = SPECIALS.surf;
export const SURF_BOT = { throws: 0, atFoes: 0, atObj: 0, atTurf: 0, noticed: 0, missed: 0, jumps: 0, shots: 0 };
export function resetSurfBot() { for (const k in SURF_BOT) SURF_BOT[k] = 0; }
const MISS = { easy: 0.4, normal: 0.22, hard: 0.08 };   // chance a ring goes unjumped (didn't react in time)
const ERR = { easy: 0.2, normal: 0.12, hard: 0.05 };    // ± s off the right moment
const JUMP_AT = 0.3;                                     // s before the front reaches us: our feet clear its top 0.08 … 0.6 s after
const GRAV = 24, FROM_Y = 1.35;
const _st = { own: 0, enemy: 0, empty: 0, n: 0 };
const _p = new THREE.Vector3(), _q = new THREE.Vector3();
const STEADY = { shooter: true, blaster: true, dualies: true, twins: true, slosher: true, bucket: true, splatling: true };

// should a bot pop its Surf N' Turf now? (bots.js _wantSpecial: fight — dist to its target, vis in sight)
// It's at its best on foes (the marks, the forced jumps): kept for a fight, or — out of one — for when the team knows
// of foes within a throw and a ring's reach (it goes on them: pickSpot); never to ink an empty patch
export function surfWant(b, mode, dist, vis) {
  if (mode === 'fight') return dist > 2.5 && dist < 15 && (vis || Math.random() < 0.05);
  const a = b.a;
  for (const e of G.actors) {
    if (e.team === a.team || !e.alive) continue;
    const k = teamKnown(a.team, e, 3);
    if (k && k.pos && Math.hypot(k.pos.x - a.pos.x, k.pos.z - a.pos.z) < 24 && Math.abs(k.pos.y - a.pos.y) < 4) return true;
  }
  return false;
}

// the launch velocity that lands a throw from `from` at `to` (speed v, gravity GRAV), the low arc; out of reach: the
// farthest throw that way (45°)
function solve(from, to, v, out) {
  const dx = to.x - from.x, dz = to.z - from.z, dh = Math.hypot(dx, dz) || 1e-3, dy = to.y - from.y, v2 = v * v;
  const disc = v2 * v2 - GRAV * (GRAV * dh * dh + 2 * dy * v2);
  const th = disc >= 0 ? Math.atan((v2 - Math.sqrt(disc)) / (GRAV * dh)) : Math.PI / 4;
  const c = Math.cos(th);
  return out.set((dx / dh) * v * c, v * Math.sin(th), (dz / dh) * v * c);
}
// where to throw it (a fresh look each throw)
function pickSpot(a) {
  const R = Math.min(13, (D.throwSpeed * D.throwSpeed) / GRAV + 2.5);
  // 1. the thickest knot of foes the team knows about, in reach
  const known = [];
  for (const e of G.actors) {
    if (e.team === a.team || !e.alive) continue;
    const k = teamKnown(a.team, e, 3);
    if (k && k.pos) { const d = Math.hypot(k.pos.x - a.pos.x, k.pos.z - a.pos.z); if (d > 2.5 && d < 24) known.push(k.pos); }
  }
  let best = null, bs = 0;
  for (const p of known) {
    let n = 0, cx = 0, cz = 0, cy = 0;
    for (const q of known) if (Math.hypot(q.x - p.x, q.z - p.z) < 7) { n++; cx += q.x; cy += q.y; cz += q.z; }
    if (n > bs) { bs = n; best = { x: cx / n, y: cy / n, z: cz / n, why: 'foes' }; }
  }
  // 2. the live zone / the tower
  const m = G.match;
  if (!best && m && m.zones && m.zones.active) {
    for (const z of m.zones.active.zones || []) {
      const c = z.def?.center || z.center; if (!c) continue;
      const d = Math.hypot(c[0] - a.pos.x, c[2] - a.pos.z);
      if (d < R + 6 && (!best || d < best.d)) best = { x: c[0], y: c[1] ?? a.pos.y, z: c[2], d, why: 'obj' };
    }
  }
  if (!best && m && m.tower && m.tower.pos) {
    const T = m.tower.pos, d = Math.hypot(T.x - a.pos.x, T.z - a.pos.z);
    if (d < R + 6) best = { x: T.x, y: T.y, z: T.z, why: 'obj' };
  }
  // 3. the most enemy / unclaimed ink a throw away
  if (!best) {
    let bv = -1;
    const nodes = G.nav && G.nav.nodes;
    for (let k = 0; k < 20 && nodes && nodes.length; k++) {
      const n = nodes[(Math.random() * nodes.length) | 0], d = Math.hypot(n.x - a.pos.x, n.z - a.pos.z);
      if (d < 5 || d > R || Math.abs(n.y - a.pos.y) > 3) continue;
      const st = G.paint.regionStats(n.x, n.y, n.z, 5, a.bot?.inkTeam ?? a.team, _st);
      const v = st.n ? st.enemy * 1.5 + st.empty : -1;
      if (v > bv) { bv = v; best = { x: n.x, y: n.y, z: n.z, why: 'turf' }; }
    }
  }
  if (!best) { const y = a.aimYaw; best = { x: a.pos.x + Math.sin(y) * 9, y: a.pos.y, z: a.pos.z + Math.cos(y) * 9, why: 'turf' }; }
  // (out of reach: as far as it goes that way; and onto ground — never into the sea or off an edge: back along the
  // line toward us to the first floor near our height)
  const dx = best.x - a.pos.x, dz = best.z - a.pos.z, d = Math.hypot(dx, dz) || 1;
  let r = Math.min(d, R);
  for (; r > 1.5; r -= 0.75) {
    const x = a.pos.x + (dx / d) * r, z = a.pos.z + (dz / d) * r, gy = G.level.groundHeight(x, z, Math.max(best.y, a.pos.y) + 3);
    if (gy > -Infinity && gy > a.pos.y - 4 && gy < a.pos.y + 4) { best.x = x; best.z = z; best.y = gy; return best; }
  }
  best.x = a.pos.x + (dx / d) * 2; best.z = a.pos.z + (dz / d) * 2; best.y = a.pos.y;   // (nothing better: at our feet)
  return best;
}
// holding our own buoy: the aim to hold ({ yaw, pitch, dist }) and, once it's on the spot, the throw (s.botGo / botVel)
export function surfOwnAim(b) {
  const a = b.a, s = a.specialActive;
  if (!s || s.kind !== 'surf' || s.thrown || s.ghost || !a.alive) return null;
  if (!s.plan) {
    s.plan = pickSpot(a);
    SURF_BOT.throws++;
    if (s.plan.why === 'foes') SURF_BOT.atFoes++; else if (s.plan.why === 'obj') SURF_BOT.atObj++; else SURF_BOT.atTurf++;
    s.planT = 0.25 + b.diff.reaction * (0.6 + Math.random() * 0.6);
  }
  const P = s.plan, ex = a.pos.x, ez = a.pos.z, dh = Math.hypot(P.x - ex, P.z - ez) || 1;
  const yaw = Math.atan2(P.x - ex, P.z - ez), pitch = Math.atan2(P.y + 0.5 - (a.pos.y + 1.2), dh) + 0.12;
  if (s.t >= s.planT && Math.abs(angleDiff(b.aimYaw, yaw)) < 0.14) {
    // the launch from where we stand now, along the way we're actually facing (it lands where the body throws it)
    const yw = a.aimYaw, from = _p.set(ex, a.pos.y + FROM_Y, ez), to = _q.set(ex + Math.sin(yw) * dh, P.y, ez + Math.cos(yw) * dh);
    s.botVel = solve(from, to, D.throwSpeed, s.botVel || new THREE.Vector3());
    s.botGo = true;
  }
  return { yaw, pitch, dist: dh };
}

// the enemy rings coming at us: jump them (per ring, decided once: noticed after the reaction time, maybe missed)
export function surfDodge(sense, it) {
  const b = sense.b, a = b.a;
  if (!a.alive || a.superJumpState || a.climbing) return;
  const S = sense._surf || (sense._surf = new Map());
  if (S.size > 24) for (const [R] of S) if (R.state !== 'travel') S.delete(R);
  for (const w of G.specials?.world || []) {
    if (w.kind !== 'surf' || w.team === a.team || w.phase !== 'live') continue;
    const dx = a.pos.x - w.pos.x, dz = a.pos.z - w.pos.z, d = Math.hypot(dx, dz);
    for (const R of w.rings) {
      if (R.state !== 'travel' || d > R.R + 0.5) continue;
      const gap = d - 0.3 - R.r;
      if (gap < -0.15) continue;                                   // gone by
      let k = S.get(R);
      if (!k) {
        const diff = b.diff.id;
        k = { at: G.time - R.age + b.diff.reaction * (0.6 + Math.random() * 0.5), miss: Math.random() < (MISS[diff] ?? 0.22), err: (Math.random() * 2 - 1) * (ERR[diff] ?? 0.12), done: false, noted: false };
        S.set(R, k);
      }
      if (k.done || G.time < k.at) continue;
      if (!k.noted) { k.noted = true; SURF_BOT.noticed++; if (k.miss) SURF_BOT.missed++; }
      if (k.miss) continue;
      const tIn = gap / D.speed;
      if (tIn > JUMP_AT + k.err || !a.grounded) continue;
      // (it'll really reach us: no wall between, our floor is the one it runs on)
      if (w.judgeAt(a, d, Math.atan2(dx, dz)) !== 'hit') { k.done = true; continue; }
      it.jump = true; it.squid = false;
      if (b.jumpCd !== undefined) b.jumpCd = 0.5;
      k.done = true; SURF_BOT.jumps++;
      return;
    }
  }
}

// no foe in sight: an enemy buoy in range and in sight gets shot down (steady-trigger weapons; the aim to hold, or null)
export function surfShootAim(sense, dt, it) {
  const b = sense.b, a = b.a;
  if (b.mode === 'refill' || a.climbing || a.specialActive || a.ink < 6 || !STEADY[a.weapon.kind]) { sense._buoy = null; return null; }
  if (b.target && b.seeTimer > 0) { sense._buoy = null; return null; }
  let w = sense._buoy;
  if (w && (w.phase !== 'live' || w.dead)) w = sense._buoy = null;
  if (!w) {
    if ((sense._buoyT = (sense._buoyT || 0) - dt) > 0) return null;
    sense._buoyT = 0.35;
    const range = weaponRange(a.weapon) * 0.95, ey = a.pos.y + 1.1;
    let bd = range;
    for (const o of G.specials?.world || []) {
      if (o.kind !== 'surf' || o.team === a.team || o.phase !== 'live') continue;
      const dd = Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z);
      if (dd > bd || Math.abs(o.pos.y - a.pos.y) > 4) continue;
      if (!G.physics.los(_p.set(a.pos.x, ey, a.pos.z), _q.set(o.pos.x, o.pos.y + 0.6, o.pos.z))) continue;
      bd = dd; w = o;
    }
    if (!w) return null;
    sense._buoy = w; SURF_BOT.shots++;
  }
  const dx = w.pos.x - a.pos.x, dy = w.pos.y + 0.6 - (a.pos.y + 1.1), dz = w.pos.z - a.pos.z, dh = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz), pitch = Math.atan2(dy, Math.max(0.5, dh));
  it.squid = false;
  it.fire = Math.abs(angleDiff(b.aimYaw, yaw)) < Math.atan2(0.5, Math.max(0.5, dh)) + 0.03 && Math.abs(b.aimPitch - pitch) < 0.2;
  return { yaw, pitch, dist: Math.max(1, Math.hypot(dh, dy)) };
}

// the danger the bots' model holds for a live buoy (botSpecials.js specialDangers): its rings' reach, until they're
// done — light (a ring is 40, and the answer is a jump, not a run: d.jump keeps the escape out of it), so routes go
// round it when they can
export function surfDanger(w) {
  if (w.kind !== 'surf' || w.phase !== 'live') return null;
  const R = w.reachLeft();
  return R > 0 ? { R, tIn: w.nextIn(), tOut: w.timeLeft() } : null;
}
