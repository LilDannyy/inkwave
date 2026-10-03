// Surf N' Turf (2026-10-02). The user: "you hold out a modified buoy machine that you click to throw down. this buoy
// shoots a pulsating ribbon that is used for the mark/location effect in a circle, growing from the buoy. each wave
// shoots further and further. if you get hit from the wave, you take 40 damage and get marked, and each covers turf as
// goes. completely covering the ground each pulse from a few meters away from the buoy but the ground gets less and less
// covered the further it goes. you can jump over the ribbon to avoid getting marked and damage. (if you force a player to
// jump, that causes a short delay in the background to count splatting that player as an assist.)"
//
// HOW IT PLAYS (numbers: config SPECIALS.surf)
//   · start: the buoy machine comes up in your hand (the sub-throw pose) with the throw-arc preview; you walk at
//     moveSpeed, no swimming; click to throw (holdTime: it throws itself). It flies like a bomb (gravity 24), bounces
//     off walls, and anchors upright where it lands on a floor (into the sea: lost).
//   · rings: `anchor` s after landing the first ring leaves the buoy, then one every `gap` s — `pulses` of them, reaching
//     rMin … rMax (linear: 8, 12.8, 17.6, 22.4, 27.2, 32 m) at `speed` m/s from r0. Each is a knee-high ribbon (`height`)
//     draped over the ground it runs on (POLAR below), stopped by anything taller than it can climb (a step of more than
//     stepUp, a wall at its height) and by drops of more than stepDown / the sea.
//   · a foe the front passes (once per ring, judged where the front crosses their body): feet at or under the ribbon's
//     top → `damage` and marked for `markTime` s (the mark flies in from the buoy's beacon: statusFx.js); in the air with
//     their feet over it (a jump, a squid hop, off a wall they're climbing; within 2.2 m of its top with nothing in
//     between, not a super jump) → nothing, a whoosh, and the owner gets an assist window on them (assists.js
//     `jumpAssist` s); on a floor above it, below it, behind a wall → not involved.
//   · ink: each ring paints as its front travels (the owner's copy only; replicated splat-for-splat like any paint):
//     candidate spots every paintStep m radially and round each circle; every one to `solid` m, then a share falling
//     off exponentially (paintFall) toward paintFar — a spot already ours is skipped (no wasted splats on the wire).
//   · the buoy has `hp`; enemy shots / beams / blasts hurt it (a hit flash), and at 0 it pops: the rings stop.
//   · moving things (the user: "the surf n turf doesnt follow gravity such as moving blocks (like the tower)"): it
//     follows gravity on whatever it lands on, the same rule for every moving level block (Level.addDynamic: Tower
//     Command's tower, Calamari's railcars, the pods' plants …), no per-object cases — on a block's standable top it
//     rides it (kept at the same spot of the block, its top's height: along, up a wall, down a drop, a hedge rising or
//     sinking); a block rising under it lifts it onto its top; one driving into it from the side shoves it out (out
//     of its front the way it's going, or its nearer side; never into a wall — nowhere to go: crushed, it pops); an
//     off-limits top (a railcar's roof, the tower's pillar) slides it off, carried by its motion; and when its floor
//     goes (a block moving or drawing in from under it, parked away, a shove over a drop) it falls with gravity, with
//     the motion it had, to whatever is below and anchors there again (the sea: lost, as in flight). While it's in the
//     air no new ring leaves (the rings' clock waits); rings already out keep going round the spot each one left from
//     — every ring is centred where it was emitted (its own POLAR map from there: fair, and what the ribbon drapes
//     over), the buoy riding on.
//
// ONLINE (docs/NET.md): the special's start / end go through the specials' records (specials.js rec / _startGhost: the
// held buoy on everyone's screen); the buoy itself through this kit kind's records (kits/registry.js netRec → KIT_GHOSTS
// .surf.ghost on every other screen): [0, gid, from, vel] thrown · [3, gid, x, y, z] anchored (the owner's word: every
// screen's rings are timed from it; + lx, lz: where on the moving block it rides, when it does) · [4, gid] popped ·
// [5, gid, x, y, z, T (+ lx, lz)] anchored again (after a fall, or once a shove has settled: where, and its ring clock)
// · [6, gid, i, x, y, z] ring i left from here (sent when that's not where it last anchored: it rode there). A ride itself sends nothing: every screen carries its copy on its own copy of the
// block (the movers run on the synced match clock; the tower follows the host's), and falls / shoves run on every
// screen alike — the owner's [5] / [6] are the word that settles where it is and where each ring is centred (a ghost's
// ring re-centres to it). Hits and dodges are judged on each screen for its OWN players
// only (the victim's owner: where their position is authoritative — the same rule as the tornado / speaker damage), from
// that screen's copy of the rings; the victim's owner applies the damage + mark there (the mark rides the actor tick
// like every other) and records [1, gid, ring] hit / [2, gid, ring] dodge on the victim — other screens play the hit
// (the mark's ribbon from the buoy, the hit marker for the owner) / the dodge's whoosh. A shot at a remote player's buoy
// goes to its owner (netHurt → KIT_GHOSTS.surf.netHurt). Assists are judged where the splat is (assists.js).
import * as THREE from 'three';
import { G, emit, clamp, lerp } from '../core/ctx.js';
import { SPECIALS, PLAYER } from '../config.js';
import { Physics, Hit } from './physics.js';
import { registerSpecial } from './specials.js';
import { KIT_GHOSTS, netRec, netId, netHurt, netMuted } from './kits/registry.js';
import { SPECIAL_ICONS } from '../ui/ui-icons.js';
import { makeBuoy, disposeBuoy, BUOY, RingRibbon, RING_N } from '../fx/surfFx.js';
import '../audio/sfx-surf.js';
import { SPECIAL_START } from '../audio/cues.js';

const D = SPECIALS.surf;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const _h = new Hit(), _h2 = new Hit(), _res = { t: 0, dist: 0 };
const _st = { own: 0, enemy: 0, empty: 0, n: 0 };
const r2 = (x) => Math.round(x * 100) / 100;
const v3 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
const near = (p, r = 40) => !!G.camera && G.camera.position.distanceToSquared(p) < r * r;
const play = (name, o) => G.audio?.play(name, { cue: true, ...o });
export const HIT_R = 0.3;          // m: a body this far past the front is reached (a kid's radius, less the shoulders)
export const BREAK_T = 0.38;       // s: a ring at its last reach ripples and sinks away
export const GRAV = 24;            // the throw (the arc preview's / a bomb's gravity)
const DODGE_UP = 2.2;              // m over the ribbon's top a player in the air still counts as jumping it
const LIFT = 0.7;                  // m: a moving block's top this far over its base, rising into it, lifts it on (more: a shove)
const FLOOR_GAP = 0.08;            // m under its base its floor may drop away before it falls (a block sinking slowly: it rides)
const DOWN = new THREE.Vector3(0, -1, 0);
const A_N = 480, STEP = 0.4;       // the polar map: angles (480: about 0.42 m apart at the 32 m last reach), radial step (m)
// counters (tests / tools/botlab/match.cjs)
export const SURF_STATS = { uses: 0, throws: 0, lands: 0, rings: 0, hits: 0, dodges: 0, marks: 0, kills: 0, splats: 0, turf: 0, popped: 0, lost: 0,
  rides: 0, lifts: 0, shoves: 0, crushed: 0, falls: 0, reanchors: 0 };   // (moving things)
export function resetSurfStats() { for (const k in SURF_STATS) SURF_STATS[k] = 0; }

// a small seeded random (each ring's ink pattern; tests repeat)
function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
// ring i's farthest reach (m)
export const ringReach = (i) => lerp(D.rMin, D.rMax, D.pulses > 1 ? i / (D.pulses - 1) : 0);
// The ink: how much of the ground r m from the buoy ends up ours once every ring has been by — all of it out to `solid`
// m, then falling off toward paintFar at the rings' last reach (paintFall: its e-fold, m)
export function inkCover(r) { return r <= D.solid ? 1 : D.paintFar + (1 - D.paintFar) * Math.exp(-(r - D.solid) / D.paintFall); }
// … and the share of candidate spots each ring takes there: n(r) rings go by r (the inner ground is passed by them all),
// a ring's splats cover 1 − e^(−INK_K·f) of the ground for a share f of the spots (INK_K: a splat's area over a
// spot's, overlaps and all — measured: tools/botlab/tests/surf.js 'turf'), so every ring takes −ln(1 − cover) / (n·K)
const INK_K = 2.1;
export function inkDensity(r) {
  const c = inkCover(r);
  if (c >= 0.999) return 1;
  let n = 0; for (let i = 0; i < D.pulses; i++) if (ringReach(i) >= r - 0.3) n++;
  return clamp(-Math.log(1 - c) / (Math.max(1, n) * INK_K), 0, 1);
}

// ------------------------------------------------------------------------------------------------ the polar map
// Where the rings can go round an anchored buoy: A_N headings out from it, each walked out in STEP m steps following
// the ground (G.level.groundHeight, never higher than stepUp over the last step); a heading ends where the ground drops
// more than stepDown (or is the sea), or where something stands in the way at the ribbon's height (a ray STEP long at
// 0.25 m over the higher of the two floors — a wall, a crate, a tall step: the user's "cover matters"). Every screen
// builds the same map from the same anchor (the owner's record), lazily, as far as the rings have got.
export class Polar {
  constructor(cx, cy, cz, maxR) {
    this.cx = cx; this.cy = cy; this.cz = cz;
    this.n = Math.ceil(maxR / STEP) + 2;
    this.ys = new Float32Array(A_N * this.n).fill(NaN);
    this.reach = new Float32Array(A_N).fill(Infinity);
    this.done = new Int16Array(A_N).fill(1);
    for (let a = 0; a < A_N; a++) this.ys[a * this.n] = cy;
    this.upto = 0;
  }
  ensure(r) {
    const k = Math.min(this.n - 1, Math.ceil(r / STEP) + 1);
    if (k <= this.upto) return;
    for (let a = 0; a < A_N; a++) this._march(a, k);
    this.upto = k;
  }
  _march(a, k) {
    if (this.reach[a] < Infinity) return;
    const th = (a / A_N) * TAU, sx = Math.sin(th), sz = Math.cos(th), n = this.n, Y = this.ys;
    let i = this.done[a];
    while (i <= k) {
      const y0 = Y[a * n + i - 1], r0 = (i - 1) * STEP, r1 = i * STEP;
      const gy = G.level.groundHeight(this.cx + sx * r1, this.cz + sz * r1, y0 + D.stepUp + 0.05);
      if (gy === -Infinity || gy < y0 - D.stepDown) { this.reach[a] = r0 + STEP * 0.5; break; }
      const hy = Math.max(y0, gy) + 0.25;
      if (G.physics.raycast(_p.set(this.cx + sx * r0, hy, this.cz + sz * r0), _d.set(sx, 0, sz), STEP, _h, true).hit) { this.reach[a] = r0 + _h.dist; break; }
      Y[a * n + i] = gy; i++;
    }
    this.done[a] = i;
  }
  idx(th) { return ((Math.round((th / TAU) * A_N) % A_N) + A_N) % A_N; }
  reachAt(th) { return this.reach[this.idx(th)]; }
  // the ground the ribbon runs on at heading th, r m out (its last sample past where it's been worked out / stopped)
  groundAt(th, r) {
    const a = this.idx(th), n = this.n, last = this.done[a] - 1;
    const f = clamp(r / STEP, 0, last), i0 = Math.floor(f), i1 = Math.min(last, i0 + 1), k = f - i0;
    const y0 = this.ys[a * n + i0], y1 = this.ys[a * n + i1];
    return y0 + (y1 - y0) * k;
  }
}

// ------------------------------------------------------------------------------------------------ the buoy
export class Buoy {
  constructor(owner, from, vel, ghost = false, gid = 0) {
    this.kind = 'surf'; this.owner = owner; this.team = owner.team; this.ghost = ghost; this.gid = gid;
    this.pos = from.clone(); this.prev = from.clone(); this.vel = vel.clone();
    this.phase = 'fly'; this.t = 0; this.T = 0; this.hp = D.hp; this.dead = false; this.flash = 0; this.lampK = 0;
    this.rings = []; this.polar = null; this.turf = 0; this.splats = 0; this.restT = 0;
    // moving things: the dynamic block it rides ({ b, lx, lz }: where on it), falling after it anchored, s in the air,
    // where it last anchored on the wire ([3] / [5]), a shove's settle record pending, the owner's ring centres (a ghost)
    this.on = null; this.fall = false; this.airT = 0; this.recP = null; this.pushT = -9; this.pushRec = false; this.ringAt = null;
    this.look = makeBuoy(this.team);
    this.look.group.position.copy(this.pos);
    this.spinA = 0; this.tumble = new THREE.Vector3(Math.random() * 6, 0, Math.random() * 6);
    G.specials.scene.add(this.look.group);
  }
  get lamp() { return _v2.set(this.pos.x, this.pos.y + BUOY.lampY, this.pos.z); }   // (scratch: copy it)
  beacon() { return new THREE.Vector3(this.pos.x, this.pos.y + BUOY.lampY, this.pos.z); }
  get live() { return this.phase === 'live'; }

  update(dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 5);
    if (this.phase === 'fly') return this._fly(dt);
    if (this.phase === 'rest') { if ((this.restT += dt) > 1.5) this.land(this.pos); else this._support(dt); this._pose(dt); return true; }   // (a ghost with no word yet)
    if (this.phase === 'pop') return false;
    if (this.phase === 'sink') {
      const k = Math.min(1, (this.t - this.sinkT) / 0.6);
      this.look.group.position.set(this.pos.x, this.pos.y - k * 0.9, this.pos.z);
      this.look.group.scale.setScalar(1 - 0.5 * k);
      return k < 1;
    }
    // live: what it stands on (riding / pushed / its floor gone: falling), then the rings — no new one while it's in the
    // air (the rings' clock waits); those already out run on their own clocks round the spot each left from
    if (this.fall) { if (!this._fall(dt)) return false; }
    else this._support(dt);
    if (this.phase === 'pop') return false;
    if (!this.fall) this.T += dt;
    let left = 0;
    for (const R of this.rings) {
      if (R.state === 'wait' && this.T >= R.t0 && !this.fall) this._startRing(R);
      if (R.state === 'travel') {
        R.age += dt; R.rPrev = R.r;
        if (R.fresh) R.fresh = false; else R.tr += dt;   // (its own clock — the same as T − t0 while the buoy's never in the air)
        R.r = Math.min(R.R, D.r0 + D.speed * R.tr);
        R.spin += (dt * 1.6) / (TAU * Math.max(0.6, R.r));
        R.polar.ensure(R.r + 0.6);
        this._judge(R);
        if (!this.ghost) this._paint(R);
        if (R.r >= R.R - 1e-4) { R.state = 'break'; R.bt = 0; }
        this._draw(R, 0);
      } else if (R.state === 'break') {
        R.bt += dt; R.age += dt;
        if (R.bt >= BREAK_T) { R.ribbon?.dispose(); R.ribbon = null; R.state = 'done'; }
        else this._draw(R, R.bt / BREAK_T);
      }
      if (R.state !== 'done') left++;
    }
    this._pose(dt);
    if (!left && !this.fall) { this.phase = 'sink'; this.sinkT = this.t; if (near(this.pos, 30)) G.fx?.burst(_v.copy(this.pos).setY(this.pos.y + 0.4), UP, G.teamColors[this.team], { count: 8, speed: 2.5, size: 0.07 }); }
    return true;
  }
  // in flight: a lob (the arc preview's gravity), off walls, onto a floor; the sea takes it
  _fly(dt) {
    this.airT = this.t;
    const r = this._air(dt);
    if (r === 'lost') {
      if (!this.ghost) { SURF_STATS.lost++; if (this.gid) netRec(this.owner, 'surf', [4, this.gid]); }
      if (near(this.pos)) G.fx?.burst(_v.copy(this.pos), UP, G.teamColors[this.team], { count: 10, speed: 3, size: 0.08 });
      return false;
    }
    if (r) {
      if (this.ghost) { this.phase = 'rest'; this.vel.set(0, 0, 0); this.restT = 0; this._attach(r.block); }
      else { this.land(this.pos, r.block); if (this.gid) netRec(this.owner, 'surf', [3, this.gid, ...this._where()]); }
      return true;
    }
    const g = this.look.group;
    g.position.copy(this.pos);
    g.rotation.set(this.tumble.x + this.t * 7, 0, this.tumble.z + this.t * 5);
    return true;
  }
  // a step through the air (the flight, a fall): gravity, off walls; onto a floor → that floor's hit (pos on it); an
  // off-limits top (a roof: nobody stands there) — it slides off toward the nearest edge, as a kid would, carried by the
  // top's own motion when it moves (a railcar's roof); the sea (or too long in the air) → 'lost'; else null
  _air(dt) {
    this.prev.copy(this.pos);
    this.vel.y -= GRAV * dt;
    this.pos.addScaledVector(this.vel, dt);
    const h = G.physics.segment(this.prev, this.pos, _h, true);
    if (h.hit) {
      const blk = h.block >= 0 ? G.level.blocks[h.block] : null;
      if (h.normal.y > 0.6 && blk && blk.roof) {
        this.pos.copy(h.point).addScaledVector(h.normal, 0.03);
        this._slide(blk, h.point, dt);
        this.look.group.position.copy(this.pos);
        return null;
      }
      if (h.normal.y > 0.6) { this.pos.copy(h.point); return h; }
      // a wall (or a ceiling): bounce off it, losing most of its speed, and drop
      this.pos.copy(h.point).addScaledVector(h.normal, 0.25);
      const vn = this.vel.dot(h.normal);
      if (vn < 0) this.vel.addScaledVector(h.normal, -1.3 * vn);
      this.vel.x *= 0.35; this.vel.z *= 0.35; if (h.normal.y < -0.5) this.vel.y = Math.min(0, this.vel.y);
    }
    if (this.pos.y < PLAYER.waterY - 1 || this.airT > 5) return 'lost';
    return null;
  }
  // off an off-limits top: toward its nearest edge (down its slope), at ≥ 6 m/s, plus the top's own motion
  _slide(blk, at, dt) {
    const n = blk.axes[1], d = _d;
    if (n.y < 0.995) d.set(n.x, 0, n.z).normalize();
    else {
      const ax = blk.axes[0], az = blk.axes[2], dx = at.x - blk.center.x, dz = at.z - blk.center.z;
      const lx = dx * ax.x + dz * ax.z, lz = dx * az.x + dz * az.z;
      if (blk.half.x - Math.abs(lx) < blk.half.z - Math.abs(lz)) d.set(ax.x, 0, ax.z).multiplyScalar(Math.sign(lx) || 1); else d.set(az.x, 0, az.z).multiplyScalar(Math.sign(lz) || 1);
    }
    const mv = blk.dynamic && blk.dp && dt > 0 ? blk.dp : null, bx = mv ? mv.x / dt : 0, bz = mv ? mv.z / dt : 0;
    const along = (this.vel.x - bx) * d.x + (this.vel.z - bz) * d.z;
    this.vel.set(d.x * Math.max(6, along) + bx, 0, d.z * Math.max(6, along) + bz);
  }

  // ---- moving things (the same rule for every moving level block: Level.addDynamic)
  // standing on block id: a moving block's standable top → ride it (where on it); anything else → not riding
  // (rel: [lx, lz] — the owner's word for where on the block, a ghost's record: its copy of the block may lag a little)
  _attach(bid, rel) {
    const b = bid >= 0 ? G.level.blocks[bid] : null;
    if (!b || !b.dynamic || b.roof || b.solid === false) { this.on = null; return; }
    const dx = this.pos.x - b.center.x, dz = this.pos.z - b.center.z;
    this.on = rel ? { b, lx: rel[0], lz: rel[1] } : { b, lx: dx * b.axes[0].x + dz * b.axes[0].z, lz: dx * b.axes[2].x + dz * b.axes[2].z };
    if (rel) this.pos.set(b.center.x + b.axes[0].x * rel[0] + b.axes[2].x * rel[1], 0, b.center.z + b.axes[0].z * rel[0] + b.axes[2].z * rel[1]);
    this.pos.y = b.center.y + b.half.y;
    SURF_STATS.rides++;
  }
  // a ghost placed by a record at p: the block under it (or, with the owner's word that it rides one, the moving block
  // whose top is at p's height round there — this screen's copy of it may be a step behind)
  _carrierAt(p, riding) {
    const g = G.physics.raycast(_p.set(p.x, p.y + 0.3, p.z), DOWN, 0.6, _h2, true);
    if (g.hit && (!riding || (g.block >= 0 && G.level.blocks[g.block].dynamic))) return g.block;
    if (!riding) return -1;
    for (const b of G.level.dyn) {
      if (b.solid === false || b.roof || Math.abs(b.center.y + b.half.y - p.y) > 0.25) continue;
      const dx = p.x - b.center.x, dz = p.z - b.center.z;
      if (Math.abs(dx * b.axes[0].x + dz * b.axes[0].z) < b.half.x + 0.8 && Math.abs(dx * b.axes[2].x + dz * b.axes[2].z) < b.half.z + 0.8) return b.id;
    }
    return -1;
  }
  // the owner's word on where it's anchored: its spot, and where on the block when it rides one
  _where() { return this.on ? [...v3(this.pos), r2(this.on.lx), r2(this.on.lz)] : v3(this.pos); }
  // per frame while anchored (and a ghost at rest): ride what it's on; a moving block pushing into it; its floor
  _support(dt) {
    const L = G.level;
    if (this.on) {
      const o = this.on, b = o.b;
      if (b.solid === false || !L.dyn.includes(b) || Math.abs(o.lx) > b.half.x + 0.05 || Math.abs(o.lz) > b.half.z + 0.05) { this._drop('gone'); return; }   // (parked / its top drew in)
      const x = b.center.x + b.axes[0].x * o.lx + b.axes[2].x * o.lz, z = b.center.z + b.axes[0].z * o.lx + b.axes[2].z * o.lz, y = b.center.y + b.half.y;
      const dx = x - this.pos.x, dy = y - this.pos.y, dz = z - this.pos.z, m2 = dx * dx + dy * dy + dz * dz;
      if (m2 > 9) { this._drop('gone'); return; }          // (it jumped away: parked)
      if (dt > 0) this.vel.set(dx / dt, dy / dt, dz / dt);
      if (m2 > 1e-12) { this.pos.set(x, y, z); this.rideD = (this.rideD || 0) + Math.sqrt(m2); }
    } else this.vel.set(0, 0, 0);
    if (this._pushed(dt)) return;
    if (!this.on) this._floor(dt);
    // (a shove that has settled: the owner's word on where it is now)
    if (this.pushRec && G.time - this.pushT > 0.2) { this.pushRec = false; this._anchorRec(); }
  }
  // a moving block (not the one it rides) pushing into its body: rising under it → onto its top (it rides it; an
  // off-limits top slides it off); from the side → shoved out (its front the way it's going, or its nearer side; only
  // where it fits — nowhere: crushed); true when it moved
  _pushed(dt) {
    const L = G.level, p = this.pos, BR = BUOY.hitR * 0.8, BH = BUOY.hitH;
    for (const b of L.dyn) {
      if (b.solid === false || (this.on && this.on.b === b)) continue;
      if (p.x < b.aabbMin.x - BR || p.x > b.aabbMax.x + BR || p.z < b.aabbMin.z - BR || p.z > b.aabbMax.z + BR || p.y + BH < b.aabbMin.y || p.y > b.aabbMax.y - 0.04) continue;
      const ax = b.axes[0], az = b.axes[2], dx = p.x - b.center.x, dz = p.z - b.center.z;
      const lx = dx * ax.x + dz * ax.z, lz = dx * az.x + dz * az.z;
      const ex = b.half.x + BR - Math.abs(lx), ez = b.half.z + BR - Math.abs(lz);
      if (ex <= 0 || ez <= 0) continue;
      const top = b.center.y + b.half.y;
      if (top - p.y <= LIFT && Math.abs(lx) < b.half.x && Math.abs(lz) < b.half.z) {
        // rising under it (a hedge growing, a platform coming up): onto its top
        p.y = top;
        if (b.roof) { this.vel.set(0, 0, 0); this._slide(b, p, dt); this._drop('roof', true); }
        else { this._attach(b.id); SURF_STATS.lifts++; }
        return true;
      }
      // from the side: out of its front (the way it moves) or its nearer side
      const mv = b.dp, mx = mv ? mv.x * ax.x + mv.z * ax.z : 0, mz = mv ? mv.x * az.x + mv.z * az.z : 0;
      const tries = [];
      const out = (ux, uz, dist) => tries.push({ ux, uz, dist });
      if (Math.abs(mx) > 1e-5 || Math.abs(mz) > 1e-5) {
        if (Math.abs(mx) >= Math.abs(mz)) out(ax.x * Math.sign(mx), ax.z * Math.sign(mx), b.half.x + BR + 0.03 - Math.sign(mx) * lx);
        else out(az.x * Math.sign(mz), az.z * Math.sign(mz), b.half.z + BR + 0.03 - Math.sign(mz) * lz);
      }
      const sx = Math.sign(lx) || 1, sz = Math.sign(lz) || 1;
      if (ex < ez) { out(ax.x * sx, ax.z * sx, ex + 0.03); out(az.x * sz, az.z * sz, ez + 0.03); }
      else { out(az.x * sz, az.z * sz, ez + 0.03); out(ax.x * sx, ax.z * sx, ex + 0.03); }
      tries.sort((a, c) => a.dist - c.dist);
      for (const t of tries) {
        const nx = p.x + t.ux * t.dist, nz = p.z + t.uz * t.dist;
        _v.set(p.x, p.y + 0.3, p.z); _v2.set(nx, p.y + 0.3, nz);
        if (G.physics.segment(_v, _v2, _h2, true).hit && _h2.block !== b.id) continue;   // (a wall that way)
        p.x = nx; p.z = nz;
        if (this.on) this.on = null;
        SURF_STATS.shoves++;
        this.pushT = G.time; this.pushRec = !this.ghost;
        if (dt > 0 && mv) this.vel.set(mv.x / dt, 0, mv.z / dt);
        this._floor(dt);
        return true;
      }
      // nowhere to go: crushed (the owner's copy pops it; a ghost waits for that word)
      if (!this.ghost) { SURF_STATS.crushed++; if (this.gid) netRec(this.owner, 'surf', [4, this.gid]); this.pop(); }
      return true;
    }
    return false;
  }
  // not riding: still a floor under it? A moving block that has come under it → ride it; an off-limits top → off it;
  // none → it falls
  _floor(dt) {
    const g = G.physics.raycast(_p.set(this.pos.x, this.pos.y + 0.6, this.pos.z), DOWN, 0.6 + FLOOR_GAP, _h2, true);
    if (!g.hit || g.normal.y < 0.6) { this._drop('floor'); return; }
    const blk = g.block >= 0 ? G.level.blocks[g.block] : null;
    if (blk && blk.roof) { this.pos.y = g.point.y + 0.03; this._slide(blk, g.point, dt); this._drop('roof', true); return; }
    if (g.point.y < this.pos.y - 0.02 || g.point.y > this.pos.y + 0.02) this.pos.y = g.point.y;
    if (blk && blk.dynamic) this._attach(g.block);
  }
  // its floor's gone: it falls (with the motion it had: the ride's, a slide's)
  _drop(why, keepVel = false) {
    if (this.fall || this.phase === 'pop' || this.phase === 'sink') return;
    this.on = null;
    if (this.phase === 'rest') { this.phase = 'fly'; this.airT = 0; return; }   // (a ghost not yet anchored: back to its flight)
    this.fall = true; this.airT = 0; this.dropWhy = why;
    if (!keepVel) this.vel.y = Math.max(0, this.vel.y);
    SURF_STATS.falls++;
    emit('surf:fall', { buoy: this, why });
  }
  // in the air after it anchored: gravity to whatever is below → anchored there again (the owner's word: [5])
  _fall(dt) {
    this.airT += dt;
    const r = this._air(dt);
    if (r === 'lost') {
      if (!this.ghost) { SURF_STATS.lost++; if (this.gid) netRec(this.owner, 'surf', [4, this.gid]); }
      if (near(this.pos)) G.fx?.burst(_v.copy(this.pos), UP, G.teamColors[this.team], { count: 10, speed: 3, size: 0.08 });
      return false;
    }
    if (r) {
      this.fall = false; this.vel.set(0, 0, 0);
      this._attach(r.block);
      SURF_STATS.reanchors++;
      if (near(this.pos, 40)) G.fx?.burst(_v.copy(this.pos).setY(this.pos.y + 0.15), UP, G.teamColors[this.team], { count: 8, speed: 2.5, size: 0.07 });
      emit('surf:reanchor', { buoy: this, pos: this.pos.clone() });
      this._anchorRec();
    }
    return true;
  }
  // the owner's word on where it's anchored now (after a fall / a shove) and its ring clock
  _anchorRec() {
    if (this.ghost) return;
    (this.recP || (this.recP = new THREE.Vector3())).copy(this.pos);
    if (this.gid) netRec(this.owner, 'surf', [5, this.gid, ...v3(this.pos), r2(this.T), ...(this.on ? [r2(this.on.lx), r2(this.on.lz)] : [])]);
  }
  // a ghost: the owner's word — anchored again here at ring clock T (rel: where on the block it rides, if it does)
  reanchor(p, T, rel) {
    if (this.phase !== 'live') { this.land(p, undefined, rel); return; }
    this.fall = false; this.vel.set(0, 0, 0); this.pos.copy(p); this.T = T;
    (this.recP || (this.recP = new THREE.Vector3())).copy(p);
    this.on = null;
    this._attach(this._carrierAt(p, !!rel), rel);
  }
  // a ghost: the owner's word — ring i left from p
  ringFrom(i, p) {
    (this.ringAt || (this.ringAt = []))[i] = p.clone();
    const R = this.rings[i];
    if (R && R.c && (R.state === 'travel' || R.state === 'break') && R.c.distanceToSquared(p) > 1e-6) { R.c.copy(p); R.polar = this._polarAt(p); }
  }
  // the polar map round c (shared with the last one when it's the same spot)
  _polarAt(c) {
    const P = this.polar;
    if (P && Math.abs(P.cx - c.x) < 0.05 && Math.abs(P.cy - c.y) < 0.05 && Math.abs(P.cz - c.z) < 0.05) return P;
    return (this.polar = new Polar(c.x, c.y, c.z, D.rMax + 1));
  }
  // anchored where it landed (the owner decides where; a ghost snaps to that)
  // (bid: the block it landed on — a moving one's standable top: it rides it; a ghost's record: found under p)
  land(p, bid, rel) {
    if (this.phase === 'live' || this.phase === 'pop' || this.phase === 'sink') return;
    this.pos.copy(p); this.vel.set(0, 0, 0);
    this.phase = 'live'; this.T = 0; this.landT = this.t; this.fall = false;
    this.recP = p.clone();
    if (bid === undefined) bid = this._carrierAt(p, !!rel);
    this.on = null;
    this._attach(bid, rel);
    this.polar = new Polar(this.pos.x, this.pos.y, this.pos.z, D.rMax + 1);
    this.rings = [];
    for (let i = 0; i < D.pulses; i++) this.rings.push({ i, t0: D.anchor + i * D.gap, R: ringReach(i), state: 'wait', r: 0, rPrev: 0, age: 0, tr: 0, bt: 0, spin: 0, ribbon: null, judged: null, pk: 0, rnd: null, c: null, polar: null });
    SURF_STATS.lands++;
    if (!this.ghost) {
      paintAt(this.owner, _v.copy(p).setY(p.y + 0.25), 1.5, this.team, Math.random(), this);
    }
    if (near(p, 45)) {
      play('surf_deploy', { pos: p, volume: 0.9 });
      G.fx?.burst(_v.copy(p).setY(p.y + 0.15), UP, G.teamColors[this.team], { count: 14, speed: 3.5, size: 0.08 });
      G.fx?.ring?.(_v.copy(p).setY(p.y + 0.06), UP, G.teamColors[this.team], { radius: 1.6, life: 0.5 });
    }
    emit('shake', { pos: p.clone(), amount: 0.25 });
    emit('surf:land', { buoy: this, pos: p.clone() });
  }
  // the buoy's look: settling on landing, bobbing and swaying, the emitter turning, the beacon (a flash at each ring,
  // a slow blink between), a white flash when hit
  _pose(dt) {
    const g = this.look.group, k = Math.min(1, (this.t - (this.landT ?? this.t)) / 0.35);
    const settle = this.phase === 'live' ? (1 - k) * Math.sin(k * Math.PI * 2.5) * 0.18 : 0;
    const bob = Math.sin(this.t * 2.2) * 0.035, sway = 0.07 * Math.min(1, k);
    g.position.set(this.pos.x, this.pos.y + bob * Math.min(1, k) + settle, this.pos.z);
    g.rotation.set(Math.sin(this.t * 1.7) * sway, 0, Math.cos(this.t * 1.3) * sway);
    const sq = 1 + 0.12 * this.flash;
    g.scale.set(sq, 1 - 0.08 * this.flash, sq);
    this.spinA += dt * (1.2 + 3 * this.lampK);
    this.look.emitter.rotation.y = this.spinA;
    this.lampK = Math.max(0, this.lampK - dt * 2.2);
    const blink = 0.5 + 0.5 * Math.sin(this.t * 3.1);
    this.look.lampMat.emissiveIntensity = 0.7 + 0.6 * blink + 3.2 * this.lampK + 2 * this.flash;
    this.look.glowMat.emissiveIntensity = 1.1 + 1.6 * this.lampK + 2 * this.flash;
  }
  _startRing(R) {
    R.state = 'travel'; R.r = D.r0; R.rPrev = D.r0; R.age = 0; R.spin = Math.random();
    R.tr = this.T - R.t0; R.fresh = true;   // (its own clock: from the moment it was due; a fall after it left doesn't hold it)
    // centred where it leaves from (a ghost: the owner's word for it when that's come, else where its copy is)
    R.c = (this.ghost && this.ringAt && this.ringAt[R.i] ? this.ringAt[R.i] : this.pos).clone();
    R.polar = this._polarAt(R.c);
    if (!this.ghost && this.gid && this.recP && R.c.distanceTo(this.recP) > 0.05) netRec(this.owner, 'surf', [6, this.gid, R.i, ...v3(R.c)]);
    R.judged = new Set(); R.pk = 0; R.rnd = rng((this.gid || 7) * 31 + R.i * 977 + 13);
    R.ribbon = new RingRibbon(G.specials.scene, this.team, { arrows: 2 + (R.i >> 1), height: D.height });
    this.lampK = 1;
    SURF_STATS.rings++;
    if (near(this.pos, 55)) play('surf_pulse', { pos: this.lamp.clone(), volume: 0.75 + 0.05 * R.i, params: { n: R.i } });
    emit('surf:pulse', { buoy: this, i: R.i });
  }
  // the ribbon this frame: draped (the polar map), cut off where it struck a wall (it fades out there), rising as it
  // leaves the buoy, throbbing as it goes; k > 0: its last reach — it ripples and sinks away
  _draw(R, k) {
    const rb = R.ribbon; if (!rb) return;
    const P = R.polar, N = RING_N, cx = R.c.x, cz = R.c.z;
    const rad = this._rad || (this._rad = new Float32Array(N)), gy = this._gy || (this._gy = new Float32Array(N)), top = this._top || (this._top = new Float32Array(N));
    const al = this._al || (this._al = new Float32Array(N)), fy = this._fy || (this._fy = new Float32Array(N));
    const rise = Math.min(1, R.age / 0.14), H = D.height * (0.25 + 0.75 * rise) * (1 + 0.05 * Math.sin(R.age * 18)) * (1 - 0.8 * k);
    const foamW = Math.min(1.3, Math.max(0.2, R.r * 0.45));
    for (let c = 0; c < N; c++) {
      const th = (c / N) * TAU, reach = P.reachAt(th), rr = Math.min(R.r, reach);
      rad[c] = rr; gy[c] = P.groundAt(th, rr); fy[c] = P.groundAt(th, Math.max(0, rr - foamW));
      top[c] = H + (k > 0 ? 0.14 * k * Math.sin(th * 9 - R.bt * 16) : 0);
      al[c] = R.r > reach ? Math.max(0, 1 - (R.r - reach) / 1.4) : 1;
    }
    rb.set(cx, cz, rad, gy, top, al, foamW, fy);
    rb.look({ radius: R.r, spin: R.spin, alpha: Math.min(1, R.age / 0.08) * (1 - k * k), pulse: 0.5 + 0.5 * Math.sin(R.age * 14), time: G.time, height: Math.max(0.05, H) });
  }

  // ---- hits: this screen's own players only (the victim's owner judges — see the header)
  _judge(R) {
    for (const e of G.actors) {
      if (!e.alive || e.team === this.team || e.remote || R.judged.has(e)) continue;
      const dx = e.pos.x - R.c.x, dz = e.pos.z - R.c.z, d = Math.hypot(dx, dz);
      if (d - HIT_R > R.r) continue;                   // the front isn't there yet
      R.judged.add(e);
      if (d + HIT_R < R.rPrev - 0.35) continue;        // (already inside when it went by: a landing super jump, a respawn)
      this._cross(R, e, d, Math.atan2(dx, dz));
    }
  }
  // what the front does to e as it crosses them: 'hit' | 'dodge' | null (not involved) — d, th: from ring R's centre
  // (none given: the last ring's / the anchor's). For tests / bots too (sp-surf-bots.js surfDodge)
  judgeAt(e, d, th, R) {
    const P = (R && R.polar) || this.polar, reach = P.reachAt(th);
    if (reach < d - HIT_R) return null;                // a wall (or a drop) between: it never got to them
    const g = P.groundAt(th, Math.min(d, reach)), feet = e.pos.y, top = g + D.height;
    if (feet < g - 1.2) return null;                   // on a floor below it
    if (feet <= top) return 'hit';
    if ((e.grounded && !e.climbing) || e.superJumpState || feet > top + DODGE_UP) return null;   // on a floor above it / flying by
    if (!G.physics.los(_p.set(e.pos.x, top + 0.05, e.pos.z), _d.set(e.pos.x, feet + 0.05, e.pos.z))) return null;   // (a floor between)
    return 'dodge';
  }
  _cross(R, e, d, th) {
    const what = this.judgeAt(e, d, th, R);
    if (!what) return;
    // (a ghost's update runs with paint muted; what it does to this screen's own player is this screen's real word —
    // a splat's burst of ink included: unmuted for it)
    const nm = G.netm, m0 = nm ? nm.mute : 0;
    if (nm) nm.mute = 0;
    try { if (what === 'hit') this._hit(R, e); else this._dodge(R, e); } finally { if (nm) nm.mute = m0; }
  }
  _hit(R, e) {
    const hurtable = !(e.invuln > 0);
    const dmg = G.drainbow?.live ? G.drainbow.cut(this.owner, e, D.damage, null, this.pos) : D.damage;   // [drainbow] (a ring reaching someone in an enemy Drainbow: half)
    const killed = e.damage(dmg, this.owner, 'surf');
    SURF_STATS.hits++;
    if (killed) SURF_STATS.kills++;
    emit('hit', { attacker: this.owner, victim: e, damage: dmg, killed, weaponId: 'surf' });
    if (hurtable && e.alive) { G.subs?.track(e, this.team, D.markTime, this.beacon()); SURF_STATS.marks++; }
    hitLook(this, e);
    emit('surf:hit', { buoy: this, victim: e, ring: R.i, killed });
    if (G.netm && !e.remote && this.gid) netRec(e, 'surf', [1, this.gid, R.i]);
  }
  _dodge(R, e) {
    SURF_STATS.dodges++;
    G.assists?.noteJump(e, this.owner);
    dodgeLook(this, e);
    emit('surf:dodge', { buoy: this, actor: e, ring: R.i });
    if (G.netm && !e.remote && this.gid) netRec(e, 'surf', [2, this.gid, R.i]);
  }

  // ---- ink (the owner's copy)
  _paint(R) {
    const step = D.paintStep;
    while (R.pk * step <= R.r + 1e-6) { this._paintCircle(R, R.pk * step); R.pk++; }
  }
  _paintCircle(R, rk) {
    const P = R.polar, C = R.c, rnd = R.rnd, team = this.team;
    if (rk < 0.5) {
      if (G.paint.regionStats(C.x, C.y, C.z, 1.0, team, _st).own < 0.9) paintAt(this.owner, _v.copy(C).setY(C.y + 0.25), 1.35, team, rnd(), this);
      return;
    }
    const n = Math.max(4, Math.round((TAU * rk) / D.paintStep)), ph = rnd(), dens = inkDensity(rk);
    for (let j = 0; j < n; j++) {
      const take = rnd() < dens, jit = rnd();
      if (!take) continue;
      const th = ((j + ph + (jit - 0.5) * 0.5) / n) * TAU;
      if (P.reachAt(th) < rk - 0.3) continue;
      const y = P.groundAt(th, rk);
      if (!Number.isFinite(y)) continue;
      const x = C.x + Math.sin(th) * rk, z = C.z + Math.cos(th) * rk;
      if (G.paint.regionStats(x, y, z, 0.6, team, _st).own > 0.85) continue;   // (already ours: no splat on the wire)
      paintAt(this.owner, _v.set(x, y + 0.25, z), D.paintR * (0.9 + 0.25 * rnd()), team, rnd(), this);
    }
  }

  // ---- getting shot: enemy shots / beams / blasts (specials.js shotHit / rayHit / areaHit hooks)
  _base() { return _p.set(this.pos.x, this.pos.y, this.pos.z); }
  hitShot(prev, pos, team, dmg, owner) {
    if (team === this.team || this.phase !== 'live') return false;
    Physics.segmentCapsuleDist(prev, pos, this._base(), BUOY.hitR, BUOY.hitH, _res);
    if (_res.dist >= BUOY.hitR) return false;
    this._shot(dmg, owner);
    return true;
  }
  hitRay(from, dir, len, team, dmg, owner) {
    if (team === this.team || this.phase !== 'live') return len;
    // the buoy's axis (a vertical segment) against the ray, roughly: closest approach in the horizontal plane
    const dx = this.pos.x - from.x, dz = this.pos.z - from.z, hl = Math.hypot(dir.x, dir.z) || 1e-6;
    const t = (dx * dir.x + dz * dir.z) / (hl * hl);
    if (t <= 0 || t > len) return len;
    const px = from.x + dir.x * t - this.pos.x, pz = from.z + dir.z * t - this.pos.z, py = from.y + dir.y * t;
    if (Math.hypot(px, pz) > BUOY.hitR || py < this.pos.y - 0.1 || py > this.pos.y + BUOY.height) return len;
    this._shot(dmg, owner);
    return Math.max(0.1, t - BUOY.hitR * 0.5);
  }
  hitArea(c, radius, dmg, team, owner) {
    if (team === this.team || this.phase !== 'live') return;
    _v.set(this.pos.x, clamp(c.y, this.pos.y, this.pos.y + BUOY.hitH), this.pos.z);
    if (_v.distanceTo(c) < radius + BUOY.hitR) this._shot(dmg, owner);
  }
  _shot(dmg, by) {
    this.flash = Math.min(1, this.flash + 0.5);
    if (near(this.pos, 30) && G.time - (this._pingT || 0) > 0.09) { this._pingT = G.time; G.audio?.play('crab_hit', { pos: this.lamp.clone(), volume: 0.35, pitch: 1.35 }); }
    if (netMuted() || !(dmg > 0)) return;              // (a ghost's shot: its owner's copy of the shot reports the hit)
    if (this.ghost) { netHurt(this.owner, 'surf', this.gid, dmg); return; }
    this.hurt(dmg, by);
  }
  hurt(dmg, by) {
    if (this.phase !== 'live' || this.ghost) return;
    this.hp -= dmg;
    this.flash = 1;
    if (this.hp <= 0) { if (this.gid) netRec(this.owner, 'surf', [4, this.gid]); this.pop(by); }
  }
  // shot down: the rings stop (any still going sink at once)
  pop() {
    if (this.phase === 'pop') return;
    this.phase = 'pop'; this.dead = true;
    SURF_STATS.popped++;
    const c = this.lamp.clone().setY(this.pos.y + 0.7);
    G.fx?.explosion(c, G.teamColors[this.team], 1.6);
    if (near(c, 50)) play('surf_pop', { pos: c, volume: 0.9 });
    emit('surf:pop', { buoy: this, pos: c });
  }

  // ---- the minimap: the buoy and its rings going out (both teams see it)
  drawMap(c, mm, tc, s, col) {
    if (this.phase !== 'live') return;
    c.lineWidth = 2.5; c.strokeStyle = col;
    for (const R of this.rings) {
      if (R.state !== 'travel' && R.state !== 'break') continue;
      mm.toCanvas(R.c.x, R.c.z, tc);
      c.globalAlpha = R.state === 'break' ? 0.6 * (1 - R.bt / BREAK_T) : 0.75;
      c.beginPath(); c.arc(tc.x, tc.y, Math.max(1, R.r * s), 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    mm.toCanvas(this.pos.x, this.pos.z, tc);
    c.fillStyle = '#15121c'; c.beginPath(); c.arc(tc.x, tc.y, s * 1.05, 0, TAU); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(tc.x, tc.y, s * 0.78, 0, TAU); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = '#ffffff'; c.stroke();
  }
  // for the bots (botSpecials / sp-surf-bots): the reach of the biggest ring still to come or going (0: none), the s
  // until the next one leaves, the s left in all
  reachLeft() { let m = 0; for (const R of this.rings) if (R.state === 'wait' || R.state === 'travel') m = Math.max(m, R.R); return m; }
  nextIn() { for (const R of this.rings) { if (R.state === 'travel') return 0; if (R.state === 'wait') return Math.max(0, R.t0 - this.T); } return 99; }
  timeLeft() { const L = this.rings[this.rings.length - 1]; return L ? Math.max(0, L.t0 + (L.R - D.r0) / D.speed - this.T) : 0; }

  dispose() {
    for (const R of this.rings) { R.ribbon?.dispose(); R.ribbon = null; }
    G.specials?.scene.remove(this.look.group);
    disposeBuoy(this.look);
  }
}
// special ink: turf for its owner, never the special meter (specials.js paint())
function paintAt(owner, pos, r, team, seed, buoy) {
  const area = G.paint.splat(pos, r, team, { seed });
  if (area > 0) { owner?.addTurfNoSpecial?.(area); owner.stats.surfTurf = (owner.stats.surfTurf || 0) + area; }
  if (buoy) { buoy.turf += area; buoy.splats++; }
  SURF_STATS.turf += area; SURF_STATS.splats++;
  return area;
}
function hitLook(b, e) {
  const col = G.teamColors[b.team];
  if (near(e.pos, 40)) {
    G.fx?.burst(_v.copy(e.pos).setY(e.pos.y + 0.35), UP, col, { count: 10, speed: 3.5, size: 0.08 });
    play('surf_hit', { pos: e.isLocal ? undefined : e.pos.clone(), volume: e.isLocal ? 0.8 : 0.6 });
  }
}
function dodgeLook(b, e) {
  if (e.isLocal) play('surf_dodge', { volume: 0.75 });
  else if (near(e.pos, 25)) play('surf_dodge', { pos: e.pos.clone(), volume: 0.45 });
  if (near(e.pos, 35)) G.fx?.burst(_v.copy(e.pos).setY(e.pos.y - 0.1), UP, G.teamColors[b.team], { count: 6, speed: 2.4, size: 0.06, ring: true });
}

// ------------------------------------------------------------------------------------------------ the special
// held: the buoy machine in the left hand (the sub-throw pose — `raise`), the throw-arc preview (`showArc` + `bomb`:
// weapons.js updateArc, main.js), the special's own gauge stays full until it's thrown
const HELD_SCALE = 0.34;
function heldOn(a, s) {
  const hand = a.character?.bones?.handL;
  const look = makeBuoy(a.team);
  look.group.scale.setScalar(HELD_SCALE);
  const g = new THREE.Group();
  g.position.set(-0.02, -0.05, 0.02);
  look.group.position.set(0, -0.19, 0);   // (its middle in the palm; heldTick keeps it upright, facing the aim)
  g.add(look.group);
  if (hand) hand.add(g); else G.specials.scene.add(g);
  g.visible = false;
  s.held = { look, g, hand };
}
function heldOff(a, s) {
  const H = s.held; if (!H) return;
  H.g.parent?.remove(H.g);
  disposeBuoy(H.look);
  s.held = null;
}
const _hq = new THREE.Quaternion(), _wq = new THREE.Quaternion(), _we = new THREE.Euler();
function heldTick(a, s, dt) {
  const H = s.held; if (!H) return;
  const ch = a.character;
  H.g.visible = !s.thrown && a.alive && a.form !== 'squid' && (ch.wSub === undefined || ch.wSub > 0.2);
  // upright in the world, its control panel toward the aim, whatever the hand's own turn (the hand's world turn as
  // last drawn: one frame behind, unseen)
  if (H.hand) {
    H.hand.getWorldQuaternion(_hq);
    _wq.setFromEuler(_we.set(0.18 * Math.sin(s.t * 5), a.aimYaw, 0));
    H.g.quaternion.copy(_hq.invert()).multiply(_wq);
  }
  H.look.emitter.rotation.y += dt * 4;
  H.look.lampMat.emissiveIntensity = 0.8 + 0.8 * (0.5 + 0.5 * Math.sin(s.t * 7));
}
export const IMPL = {
  start(a, s) {
    Object.assign(s, { speed: D.moveSpeed, noSquid: true, aimFace: true, raise: true, showArc: true, bomb: { kind: 'surf', throwSpeed: D.throwSpeed, inkCost: 0 }, dur: 0, thrown: false });
    a.character.subPropHidden = true;
    heldOn(a, s);
    SURF_STATS.uses++;   // (its start sound, surf_ready, comes from the cue director: SPECIAL_START below)
  },
  // click to throw (bots: when their aim is on the spot they picked — sp-surf-bots.js surfOwnAim sets botGo / botVel)
  weapon(a, s, dt, inp) {
    if (s.thrown) return true;
    const go = a.bot ? !!s.botGo || s.t >= 2.2 : (inp.firePressed && s.t > 0.2) || s.t >= D.holdTime;
    if (go) IMPL.throwIt(a, s);
    return true;
  },
  tick(a, s, dt) { heldTick(a, s, dt); },
  throwIt(a, s) {
    s.thrown = true; s.raise = false;
    const from = a.pos.clone().setY(a.pos.y + 1.35);
    const vel = a.bot && s.botVel ? s.botVel.clone() : G.projectiles.throwVelocity(a, D.throwSpeed, new THREE.Vector3());
    const gid = netId(a);
    const b = new Buoy(a, from, vel, false, gid);
    G.specials.world.push(b);
    if (gid) netRec(a, 'surf', [0, gid, ...v3(from), ...v3(vel)]);
    SURF_STATS.throws++;
    a.character.trigger('throw');
    if (a.isLocal) play('surf_throw', { volume: 0.8 }); else if (near(a.pos, 35)) play('surf_throw', { pos: a.pos.clone(), volume: 0.6 });
    emit('surf:throw', { actor: a, buoy: b });
    G.specials.end(a, 'throw');
  },
  end(a, s) { heldOff(a, s); a.character.subPropHidden = false; },
  prompt(a, s) { return s.thrown ? null : 'Aim · click to throw the buoy'; },
};
// another player's: the buoy in their hand (their arc is theirs)
const GHOST = {
  start(a, s) {
    Object.assign(s, { noSquid: true, raise: true, dur: 0, thrown: false });
    a.character.subPropHidden = true;
    heldOn(a, s);
  },
  tick(a, s, dt) { heldTick(a, s, dt); },
};
registerSpecial('surf', IMPL, GHOST);
// its start sound through the cue director (src/audio/cues.js: yours from you, theirs where they are, on top of the
// shared special_activate)
SPECIAL_START.surf = 'surf_ready';

// ------------------------------------------------------------------------------------------------ online
const findBuoy = (gid, ghost) => (G.specials?.world || []).find((w) => w.kind === 'surf' && w.gid === gid && (ghost === undefined || !!w.ghost === ghost));
KIT_GHOSTS.surf = {
  // another screen's record (a: the recording player — the buoy's owner, or for a hit / dodge the player it happened to)
  ghost(a, d) {
    switch (d[0]) {
      case 0: {   // thrown
        if (findBuoy(d[1])) return;
        const b = new Buoy(a, new THREE.Vector3(d[2], d[3], d[4]), new THREE.Vector3(d[5], d[6], d[7]), true, d[1]);
        G.specials.world.push(b);
        break;
      }
      case 3: { const b = findBuoy(d[1], true); if (b) b.land(new THREE.Vector3(d[2], d[3], d[4]), undefined, d.length > 5 ? [d[5], d[6]] : undefined); break; }   // anchored (its rings run from now)
      case 4: { const b = findBuoy(d[1], true); if (b) { if (b.phase === 'fly' || b.phase === 'rest' || b.fall) b.phase = 'pop', b.dead = true; else b.pop(); } break; }   // popped / lost
      case 5: { const b = findBuoy(d[1], true); if (b) b.reanchor(new THREE.Vector3(d[2], d[3], d[4]), d[5], d.length > 6 ? [d[6], d[7]] : undefined); break; }   // anchored again (a fall, a shove)
      case 6: { const b = findBuoy(d[1], true); if (b) b.ringFrom(d[2], new THREE.Vector3(d[3], d[4], d[5])); break; }   // ring i left from there
      case 1: {   // a hit on a, judged on a's owner's screen
        const b = findBuoy(d[1]);
        if (!b || !a.alive) break;
        G.subs?.track(a, b.team, D.markTime, b.beacon());   // (the mark's ribbon flies in from the beacon here too)
        emit('hit', { attacker: b.owner, victim: a, damage: D.damage, killed: false, weaponId: 'surf' });
        hitLook(b, a);
        emit('surf:hit', { buoy: b, victim: a, ring: d[2], remote: true });
        break;
      }
      case 2: { const b = findBuoy(d[1]); if (b) { dodgeLook(b, a); emit('surf:dodge', { buoy: b, actor: a, ring: d[2], remote: true }); } break; }
    }
  },
  // a hit on one of our buoys made on another screen
  netHurt(gid, dmg) { const b = findBuoy(gid, false); if (b) b.hurt(dmg, null); },
};

// ------------------------------------------------------------------------------------------------ icon
// the HUD / loadout icon: the buoy (keel, float collar, cream hull, mast, beacon) on a ring going out round it, the
// ring's squid-arrow head at its front
SPECIAL_ICONS.surf = (`<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
  <path d="M5.5 47 A26.5 8.5 0 0 1 58.5 47" fill="none" stroke="#15121c" stroke-width="8"/>
  <path d="M5.5 47 A26.5 8.5 0 0 1 58.5 47" fill="none" stroke="currentColor" stroke-width="3.6" stroke-opacity=".75"/>
  <g stroke="#15121c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M23 43 Q23 51 32 52.5 Q41 51 41 43 Z" fill="#2b2735"/>
    <path d="M24.5 34 Q24.5 22.5 32 21.5 Q39.5 22.5 39.5 34 Z" fill="#f2ede1"/>
    <rect x="17" y="32.5" width="30" height="11" rx="5.5" fill="currentColor"/>
    <rect x="29.6" y="12.5" width="4.8" height="9.5" fill="#2b2735"/>
    <circle cx="32" cy="11.5" r="5.2" fill="#fff"/>
    <path d="M26 7.5 Q32 2.2 38 7.5 Z" fill="#2b2735"/>
  </g>
  <path d="M5.5 47 A26.5 8.5 0 0 0 58.5 47" fill="none" stroke="#15121c" stroke-width="8"/>
  <path d="M5.5 47 A26.5 8.5 0 0 0 58.5 47" fill="none" stroke="currentColor" stroke-width="3.6"/>
  <path d="M47 51.5 L57.5 50 L52.5 58.5 Z" fill="currentColor" stroke="#15121c" stroke-width="2.4" stroke-linejoin="round"/>
  <circle cx="52.4" cy="53" r="1.4" fill="#fff"/>
  <path d="M21.5 9.5 L18.5 7.5 M42.5 9.5 L45.5 7.5 M21 14.5 L17.5 14.5 M43 14.5 L46.5 14.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M21 36 L29 36" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M27.5 27 Q28.5 24.5 31 24" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`).replace(/\n\s*/g, '');

// (tests / match.cjs)
export const SURF = { D, IMPL, Buoy, Polar, findBuoy, ringReach, inkDensity, SURF_STATS, resetSurfStats, HIT_R, BREAK_T };
G.surf = SURF;
