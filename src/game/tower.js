// Tower Command: the rules engine (no UI). A match with opts.mode === 'tower' owns one of these (match.tower); its
// look (tower mesh, light pillar, path glow, checkpoint beacons) is src/fx/towerFx.js.
//
// A tower stands at the centre of a mirrored path that runs through the stage to a goal on each side (the path comes
// from the stage layout, see TOWER_FORMAT; its far end on Bravo's side is Alpha's goal). Position is one number, `s`:
// metres along the path from the centre, positive toward Alpha's goal (Bravo's half), negative toward Bravo's.
//
//   • riding: a player standing on the platform rides it. Riders of one team only → that team controls the tower and
//     it moves toward that team's goal, faster with more riders (TOWER.mult: 1 / 1.2 / 1.33 / 1.43 ×). Its speed on a
//     stage comes from the points (below): the whole track is TOWER.trackPoints at TOWER.pointRate. Riders of both
//     teams → it stops (contested). An enemy on a tower whose riders fell off / were splatted → the enemy claims it.
//   • empty: 5 s with nobody on it and the team in control loses it (neutral); a neutral tower rolls back toward the
//     centre (TOWER.returnK × its one-rider speed).
//   • checkpoints: each side has checkpoints (TOWER.checkpoints). Pushing into enemy territory the tower stops at the
//     next uncleared one until its timer runs out (cleared faster by more riders); cleared ones don't stop it again.
//     Lose control there (enemy claim, or neutral) for TOWER.checkpointGrace s and its timer refills; regain control
//     sooner and it carries on where it was.
//   • score: 100 points to win. Riding the tower the whole track into enemy territory is TOWER.trackPoints (60) of them,
//     in proportion to the distance; clearing that side's checkpoints the rest (TOWER.checkpointPoints, 40, split evenly,
//     earned as each one's timer runs). A team's score is the most it has ever had, shown as a count from 100 down to 0;
//     reaching the goal is a knockout. At time up the lower count wins; equal counts → the team that
//     reached that count second drops a point (no draws). Nobody pushed at all → sudden death.
//   • overtime: at time up, if the team behind controls the tower, play on until it takes the lead (it wins), the other
//     team retakes the tower (one of theirs on it with none of the team behind), or the tower goes neutral (the team
//     ahead wins), or TOWER.overtimeMax.
//   • special gauges: the team in control fills at TOWER.gaugeHeld p/s (riding or not); while neutral, the team behind
//     fills at TOWER.gaugeNeutral. Each client fills its own players (online a remote player's meter is its owner's).
//
// Online the host runs the rules and records every decision (control, checkpoints, overtime, the end) plus a snapshot
// (TOWER.snapHz) on its event timeline; everyone else follows (netEvent), easing the tower onto the host's position.
// Each client carries its own players standing on the platform as it moves.
//
// Events:
//   tower:control { owner, prev }            owner -1 = neutral
//   tower:contest { on }                     riders of both teams on it (it stopped) / not any more
//   tower:checkpoint { team, index, state }  state 'reach' | 'clear' | 'refill'
//   tower:return {}                          a neutral tower started rolling back
//   tower:overtime { losing }  ·  tower:end { winner, reason, counts }
//
// TOWER_FORMAT (layout.tower, src/world/tower-data.js): { path: [[x, z] | [x, y, z], …] centre → Alpha's goal,
//   checkpoints?: [m | fraction, …], checkpointTime?: [s, …] }
import * as THREE from 'three';
import { G, emit, clamp } from '../core/ctx.js';
import { TOWER, PLAYER } from '../config.js';

const V3 = THREE.Vector3;
const r3 = (x) => Math.round(x * 1000) / 1000;
const STEP = 0.5;                       // path resample spacing (m)
const _v = new V3(), _d = new V3(), _p0 = new V3();

// ---------------------------------------------------------------------------------------------- the path
// One side: points from the centre outward, cumulative lengths
class Side {
  constructor(pts) {
    this.pts = pts;
    this.cum = [0];
    for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    this.len = this.cum[this.cum.length - 1];
  }
  // index of the segment holding distance d (binary search)
  _seg(d) {
    const c = this.cum;
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= d) lo = m; else hi = m; }
    return lo;
  }
  at(d, out) {
    d = clamp(d, 0, this.len);
    const i = this._seg(d), a = this.pts[i], b = this.pts[Math.min(i + 1, this.pts.length - 1)];
    const L = this.cum[i + 1] - this.cum[i] || 1;
    return out.copy(a).lerp(b, (d - this.cum[i]) / L);
  }
  dir(d, out) {   // unit XZ direction of increasing d
    d = clamp(d, 0, this.len);
    const i = Math.min(this._seg(d), this.pts.length - 2), a = this.pts[i], b = this.pts[i + 1];
    out.set(b.x - a.x, 0, b.z - a.z);
    const l = Math.hypot(out.x, out.z);
    return l > 1e-6 ? out.multiplyScalar(1 / l) : out.set(0, 0, 1);
  }
}

// floor height under (x, z), nearest to yHint (a path can run under a bridge)
function floorAt(x, z, yHint) {
  const L = G.level;
  let y = L.groundHeight(x, z, yHint + 1.2);
  if (y === -Infinity || y < yHint - 3) { const y2 = L.groundHeight(x, z, yHint + 3); if (y2 !== -Infinity) y = y2; }
  return y === -Infinity ? yHint : y;
}
// raw points → evenly spaced points on the floor (a step up / down becomes a short ramp)
function resample(raw) {
  const out = [];
  let prevY = raw[0].y;
  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[i], b = raw[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / STEP));
    for (let k = 0; k < n; k++) {
      const u = k / n, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u;
      const yh = a.y + (b.y - a.y) * u;
      const y = floorAt(x, z, Number.isFinite(yh) ? yh : prevY);
      out.push(new V3(x, y, z)); prevY = y;
    }
  }
  const e = raw[raw.length - 1];
  out.push(new V3(e.x, floorAt(e.x, e.z, Number.isFinite(e.y) ? e.y : prevY), e.z));
  // a little vertical smoothing (curbs read as ramps; stairs stay stairs)
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < out.length - 1; i++) {
    const m = (out[i - 1].y + out[i + 1].y) / 2;
    if (Math.abs(m - out[i].y) < 0.3) out[i].y = (out[i].y + m) / 2;
  }
  return out;
}

// A stage without a drawn path: the walkable route from the centre toward Bravo's base (its goal a few metres outside
// the spawn barrier), straightened a little. Bravo's side is the mirror, as always.
export function placeholderPath(level) {
  const nav = G.nav, pad = level.spawnPads[1], R = (level.spawnBarrier || 4.2) + 4;
  if (nav && nav.validIds && nav.validIds.length) {
    let c = -1, cd = Infinity, g = -1, gd = Infinity;
    for (const id of nav.validIds) {
      const n = nav.nodes[id];
      if (n.zone >= 0) continue;
      const dc = Math.hypot(n.x, n.z) + Math.max(0, n.y - 3) * 2;   // (the floor, not a crane top over the centre)
      if (dc < cd) { cd = dc; c = id; }
      const dp = Math.hypot(n.x - pad.x, n.z - pad.z);
      if (dp >= R && n.wet !== 2) { const v = dp - R + Math.abs(n.y - pad.y) * 0.5; if (v < gd) { gd = v; g = id; } }
    }
    const ids = c >= 0 && g >= 0 ? nav.path(c, g, 0, 30000, true) || nav.path(c, g, 0, 30000, false) : null;   // (a climb if it must)
    if (ids && ids.length > 4) {
      // keep turning points only (straight runs collapse), then the exact centre in front
      const pts = ids.map((id) => nav.nodes[id]);
      const keep = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const a = keep[keep.length - 1], b = pts[i + 1], p = pts[i];
        const abx = b.x - a.x, abz = b.z - a.z, L = Math.hypot(abx, abz) || 1;
        const off = Math.abs((p.x - a.x) * abz - (p.z - a.z) * abx) / L;
        if (off > 0.9 || Math.abs(p.y - a.y) > 0.6) keep.push(p);
      }
      keep.push(pts[pts.length - 1]);
      const path = keep.map((n) => [+n.x.toFixed(2), +n.y.toFixed(2), +n.z.toFixed(2)]);
      if (Math.hypot(path[0][0], path[0][2]) > 0.5) path.unshift([0, path[0][1], 0]);
      return { placeholder: true, path };
    }
  }
  const y = level.groundHeight(0, 0, 4);
  return { placeholder: true, path: [[0, y === -Infinity ? 0 : y, 0], [pad.x * 0.8, pad.y, pad.z * 0.8]] };
}

export class TowerPath {
  constructor(def) {
    const raw = def.path.map((p) => (p.length === 3 ? new V3(p[0], p[1], p[2]) : new V3(p[0], NaN, p[1])));
    if (!Number.isFinite(raw[0].y)) raw[0].y = floorAt(raw[0].x, raw[0].z, 30);
    for (let i = 1; i < raw.length; i++) if (!Number.isFinite(raw[i].y)) raw[i].y = floorAt(raw[i].x, raw[i].z, raw[i - 1].y);
    const a = resample(raw);
    // the mirror (180° about the vertical through the origin), floors re-read (a mirrored stage has the same heights)
    const b = resample(raw.map((p) => new V3(-p.x, p.y, -p.z)));
    this.sides = [new Side(a), new Side(b)];   // [toward Alpha's goal (s > 0), toward Bravo's goal (s < 0)]
    this.len = [this.sides[0].len, this.sides[1].len];
  }
  // world point at s (m from the centre; + toward Alpha's goal)
  at(s, out = new V3()) { return s >= 0 ? this.sides[0].at(s, out) : this.sides[1].at(-s, out); }
  // unit XZ direction of increasing s
  dir(s, out = new V3()) { return s >= 0 ? this.sides[0].dir(s, out) : this.sides[1].dir(-s, out).negate(); }
  // evenly spaced points from Bravo's goal (s = -len1) to Alpha's (s = +len0), for the path glow / minimap
  line(step = 0.75) {
    const out = [];
    for (let s = -this.len[1]; s < this.len[0]; s += step) out.push({ s, p: this.at(s) });
    out.push({ s: this.len[0], p: this.at(this.len[0]) });
    return out;
  }
}

// ---------------------------------------------------------------------------------------------- the rules
export class TowerCommand {
  constructor(match) {
    this.match = match;
    const def = (G.level.layout && G.level.layout.tower) || placeholderPath(G.level);
    this.placeholder = !!def.placeholder;
    this.def = def;
    this.path = new TowerPath(def);
    this.s = 0;                          // position along the path (m; + toward Alpha's goal)
    this.pos = this.path.at(0);          // the tower's base (on the path's floor)
    this.yaw = Math.atan2(this.path.dir(0.01).x, this.path.dir(0.01).z);
    this.owner = -1;                     // team in control (-1 neutral)
    this.riders = [0, 0];
    this.riderList = [];
    this.contested = false;
    this.emptyT = 0;                     // s with nobody on it
    this.moving = 0;                     // this frame: -1 / 0 / 1 (toward Bravo's goal / stopped / toward Alpha's)
    this.returning = false;              // a neutral tower rolling back
    this.best = [0, 0];                  // furthest each team has ridden it (m into enemy territory)
    this.count = [TOWER.count, TOWER.count];
    this.reachT = [0, 0];                // match clock when each team's count last went down (the tie-break)
    this.clock = 0;
    // checkpoints: Alpha's on the + side, Bravo's (the mirror) on the − side
    const cps = def.checkpoints || TOWER.checkpoints;
    // speed + checkpoint times from the points: the track = trackPoints, the checkpoints = checkpointPoints (even split)
    const cpPts = cps.length ? TOWER.checkpointPoints / cps.length : 0;
    this.cpPoints = cpPts;
    this.speed = this.path.len.map((L) => L / (TOWER.trackPoints / TOWER.pointRate));
    this.cps = [];
    for (let team = 0; team < 2; team++) cps.forEach((c, i) => {
      const L = this.path.len[team], d = c <= 1 ? c * L : Math.min(c, L - 1);
      const dur = def.checkpointTime ? def.checkpointTime[Math.min(i, def.checkpointTime.length - 1)] : cpPts / TOWER.pointRate;
      this.cps.push({ team, index: i, d, dur, left: dur, cleared: false, lost: 0, at: false });
    });
    this.points = [0, 0];                // each team's best points so far (of 100)
    this.overtime = false; this.overtimeT = 0; this.otLosing = -1;
    this.winner = null; this.reason = null;
    this.log = [];
    this.snapT = 0;
    this.net = null;                     // follower: the host's latest snapshot { s, t }
    // the collider: a square platform, turned along the path (the mesh is round and a touch smaller)
    this.half = new V3(TOWER.platformR, TOWER.platformH / 2, TOWER.platformR);
    this.block = G.level.addDynamic({ tag: 'tower' });
    this._place(1);
  }

  get follower() { return !!this.match.follower; }
  _net(e) { if (!this.follower) G.netm?.recTower?.(e); }
  dispose() { G.level?.clearDynamic?.(); }

  get top() { return this.pos.y + TOWER.platformH; }
  // the team currently behind (higher count after the tie-break), or -1 when nobody has pushed at all (sudden death)
  losing() {
    const [a, b] = this.count;
    if (a === b) {
      if (a >= TOWER.count) return -1;
      return this.reachT[0] <= this.reachT[1] ? 1 : 0;   // the one that got there second drops a point
    }
    return a > b ? 0 : 1;
  }
  // the counts as scored (the tie-break's point applied)
  scores() {
    const c = [...this.count], L = this.losing();
    if (c[0] === c[1] && L >= 0) c[L] = Math.min(TOWER.count, c[L] + 1);
    return c;
  }

  // ---- riders: players on the platform (feet over it, from just below its top to a hop above)
  _scanRiders() {
    const n = [0, 0], list = this.riderList;
    list.length = 0;
    const R = TOWER.platformR - 0.05, top = this.top;
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    for (const a of this.match.actors) {
      if (!a.alive || a.superJumpState || a.team > 1) continue;
      const dy = a.pos.y - top;
      if (dy < -0.3 || dy > TOWER.riderUp) continue;
      const dx = a.pos.x - this.pos.x, dz = a.pos.z - this.pos.z;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) > R || Math.abs(lz) > R) continue;
      n[a.team]++; list.push(a);
    }
    this.riders = n;
    return n;
  }

  _setOwner(o) {
    const prev = this.owner;
    if (o === prev) return;
    this.owner = o;
    this.returning = false;
    this._net(['o', o]);
    this.log.push({ t: this.clock, owner: o, s: r3(this.s) });
    emit('tower:control', { owner: o, prev });
  }

  // the next uncleared checkpoint ahead for a team pushing into enemy territory
  _nextCp(team) {
    const dir = team === 0 ? 1 : -1, here = this.s * dir;
    let best = null;
    for (const c of this.cps) if (c.team === team && !c.cleared && c.d >= here - 1e-4 && (!best || c.d < best.d)) best = c;
    return best;
  }

  // ---- per frame while the match is playing (and through overtime)
  update(dt) {
    if (this.winner != null) return;
    this.clock += dt;
    const before = this.s;
    const n = this._scanRiders();
    for (const a of this.riderList) a.stats.towerRide = (a.stats.towerRide || 0) + dt;   // (results / XP)
    if (this.follower) this._follow(dt);
    else this._rules(dt, n);
    this._place(dt);
    this._carry(before);
    this._score();
    this._fillSpecials(dt);
    if (this.follower) { if (this.overtime) this.overtimeT += dt; return; }
    if (this.overtime) this._overtime(dt);
    if ((this.snapT -= dt) <= 0) {
      this.snapT = 1 / TOWER.snapHz;
      this._net(['s', r3(this.s), this.owner, n[0], n[1], r3(this.emptyT), this.contested ? 1 : 0, ...this.cps.map((c) => (c.cleared ? -1 : r3(c.left)))]);
    }
  }

  _rules(dt, n) {
    const both = n[0] > 0 && n[1] > 0;
    if (both !== this.contested) { this.contested = both; emit('tower:contest', { on: both }); }
    let push = -1;
    if (both) this.emptyT = 0;
    else if (n[0] || n[1]) {
      const t = n[0] ? 0 : 1;
      this.emptyT = 0;
      this._setOwner(t);
      push = t;
    } else {
      this.emptyT += dt;
      if (this.owner >= 0 && this.emptyT >= TOWER.idleNeutral) this._setOwner(-1);
    }
    // checkpoints: progress for the team in control at one, the grace / refill for the rest
    let hold = null;
    for (const c of this.cps) {
      if (c.cleared) continue;
      const cs = c.team === 0 ? c.d : -c.d, here = Math.abs(this.s - cs) < 1e-3;
      c.at = here;
      if (this.owner === c.team) {
        c.lost = 0;
        if (here && push === c.team) {
          hold = c;
          this.s = cs;                                    // (exactly on it)
          if (!c.reached) {
            c.reached = true;
            this._net(['c', this.cps.indexOf(c), 1]);
            emit('tower:checkpoint', { team: c.team, index: c.index, state: 'reach' });
          }
          c.left -= dt * TOWER.mult[Math.min(4, n[c.team])];
          if (c.left <= 0) {
            c.cleared = true; c.left = 0; hold = null;
            this._net(['c', this.cps.indexOf(c), 2]);
            emit('tower:checkpoint', { team: c.team, index: c.index, state: 'clear' });
          }
        }
      } else if (c.left < c.dur) {
        c.lost += dt;
        if (c.lost >= TOWER.checkpointGrace) {
          c.left = c.dur; c.lost = 0; c.reached = false;
          this._net(['c', this.cps.indexOf(c), 3]);
          emit('tower:checkpoint', { team: c.team, index: c.index, state: 'refill' });
        }
      }
    }
    // movement
    this.moving = 0;
    if (push >= 0 && !hold) {
      const dir = push === 0 ? 1 : -1, cp = this._nextCp(push);
      const end = cp ? dir * cp.d : dir * this.path.len[push];
      const step = this.speed[push] * TOWER.mult[Math.min(4, n[push])] * dt;
      const s1 = dir > 0 ? Math.min(end, this.s + step) : Math.max(end, this.s - step);
      if (s1 !== this.s) { this.s = s1; this.moving = dir; }
      if (cp && Math.abs(this.s - end) < 1e-6 && !cp.reached) {
        cp.reached = true;
        this._net(['c', this.cps.indexOf(cp), 1]);
        emit('tower:checkpoint', { team: cp.team, index: cp.index, state: 'reach' });
      }
      if (!cp && Math.abs(this.s - end) < 1e-6) return this._end(push, 'knockout');
    } else if (this.owner === -1 && this.s !== 0 && !both && !(n[0] || n[1])) {
      if (!this.returning) { this.returning = true; emit('tower:return', {}); }
      const step = TOWER.returnK * this.speed[this.s > 0 ? 0 : 1] * dt;
      this.s = this.s > 0 ? Math.max(0, this.s - step) : Math.min(0, this.s + step);
      this.moving = this.s > 0 ? -1 : this.s < 0 ? 1 : 0;
    }
  }

  // follower: ease onto the host's position (its snapshots ride the host's timeline, in step with its players)
  _follow(dt) {
    const N = this.net;
    if (!N) return;
    N.age += dt;
    // dead-reckon between snapshots (the tower moves at a steady speed), then ease
    const target = N.s + N.v * Math.min(N.age, 0.25);
    const k = 1 - Math.exp(-10 * dt);
    const s0 = this.s;
    this.s += (target - this.s) * k;
    this.moving = this.s > s0 + 1e-5 ? 1 : this.s < s0 - 1e-5 ? -1 : 0;
  }

  // the tower's base, heading and collider at s
  _place(dt) {
    this.path.at(this.s, this.pos);
    const d = this.path.dir(this.s, _d);
    const want = Math.atan2(d.x, d.z);
    // turn smoothly (the path has corners); a U-turn never flips the platform
    let dy = want - this.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    if (Math.abs(dy) > Math.PI / 2) dy -= Math.sign(dy) * Math.PI;   // a square platform: 180° is the same shape
    this.yawPrev = this.yaw;
    this.yaw += dy * (dt >= 1 ? 1 : 1 - Math.exp(-7 * dt));
    _v.copy(this.pos); _v.y += TOWER.platformH / 2;
    G.level.moveDynamic(this.block, _v, this.half, this.yaw);
  }

  // this client's own players standing on the platform go with it (turning round its centre too)
  _carry(sBefore) {
    if (this.s === sBefore && this.yaw === this.yawPrev) return;
    const p1 = this.pos;
    this.path.at(sBefore, _p0);
    const dyaw = this.yaw - (this.yawPrev ?? this.yaw), c = Math.cos(dyaw), sn = Math.sin(dyaw);
    for (const a of this.match.actors) {
      if (a.remote || !a.alive || !a.grounded || !a.ground || a.ground.block !== this.block.id) continue;
      const rx = a.pos.x - _p0.x, rz = a.pos.z - _p0.z;
      a.pos.x = p1.x + rx * c + rz * sn;
      a.pos.z = p1.z - rx * sn + rz * c;
      a.pos.y += p1.y - _p0.y;
    }
  }

  // points now: the distance into enemy territory (trackPoints over the whole track) + that side's checkpoints (each
  // cpPoints, earned as its timer runs); a team keeps the most it has had
  pointsNow(t) {
    const d = Math.max(0, t === 0 ? this.s : -this.s);
    let p = TOWER.trackPoints * Math.min(1, d / this.path.len[t]);
    for (const c of this.cps) if (c.team === t) p += c.cleared ? this.cpPoints : this.cpPoints * clamp(1 - c.left / (c.dur || 1), 0, 1);
    return Math.min(TOWER.count, p);
  }
  _score() {
    for (let t = 0; t < 2; t++) {
      const d = t === 0 ? this.s : -this.s;
      if (d > this.best[t]) this.best[t] = d;
      const p = this.pointsNow(t);
      if (p > this.points[t]) {
        this.points[t] = p;
        const c = Math.max(0, Math.ceil(TOWER.count - p - 1e-6));
        if (c < this.count[t]) { this.count[t] = c; this.reachT[t] = this.clock; }
      }
    }
  }

  _fillSpecials(dt) {
    let team = -1, rate = 0;
    if (this.owner >= 0) { team = this.owner; rate = TOWER.gaugeHeld; }
    else { team = this.losing(); rate = TOWER.gaugeNeutral; }
    if (team < 0) return;
    for (const a of this.match.actors) {
      if (a.team !== team || !a.alive || a.specialActive || a.remote) continue;
      const was = a.specialReady();
      a.special = Math.min(a.specialCost(), a.special + rate * dt);
      if (!was && a.specialReady()) emit('special:ready', { actor: a });
    }
  }

  // ---- time's up. Returns true when the match should end now; false = overtime has begun.
  timeUp() {
    const L = this.losing();
    if (L < 0 || this.owner === L) {
      this.overtime = true; this.overtimeT = 0; this.otLosing = L;
      this._net(['t', L]);
      emit('tower:overtime', { losing: L });
      return false;
    }
    this._end(1 - L, 'time');
    return true;
  }

  _overtime(dt) {
    this.overtimeT += dt;
    const L = this.otLosing;
    if (L < 0) {                                          // sudden death: the first to get ahead
      const l = this.losing();
      if (l >= 0) return this._end(1 - l, 'sudden-death');
      if (this.overtimeT >= TOWER.overtimeMax) return this._end(Math.random() < 0.5 ? 0 : 1, 'overtime-cap');
      return;
    }
    const W = 1 - L;
    if (this.losing() === W) return this._end(L, 'comeback');      // the team behind took the lead
    if (this.owner === W) return this._end(W, 'retake');
    if (this.owner === -1) return this._end(W, 'neutralised');
    if (this.overtimeT >= TOWER.overtimeMax) return this._end(W, 'overtime-cap');
  }

  _end(winner, reason) {
    if (this.winner != null) return;
    const sc = this.scores();
    this._net(['e', winner, reason, sc[0], sc[1], r3(this.best[0]), r3(this.best[1])]);
    this.winner = winner; this.reason = reason;
    emit('tower:end', { winner, reason, counts: sc });
    this.match.endTower?.(winner, reason);
  }

  // ---- online: a follower replays the host's records (netmatch 'tw', on the host's event timeline)
  netEvent(e) {
    if (!Array.isArray(e) || !this.follower || this.winner != null) return;
    switch (e[0]) {
      case 'o': {
        const o = e[1], prev = this.owner;
        if (o === prev) break;
        this.owner = o; this.returning = false;
        emit('tower:control', { owner: o, prev });
        break;
      }
      case 'c': {
        const c = this.cps[e[1]];
        if (!c) break;
        const st = e[2] === 1 ? 'reach' : e[2] === 2 ? 'clear' : 'refill';
        if (st === 'clear') { c.cleared = true; c.left = 0; }
        if (st === 'refill') { c.left = c.dur; c.reached = false; }
        if (st === 'reach') c.reached = true;
        emit('tower:checkpoint', { team: c.team, index: c.index, state: st });
        break;
      }
      case 's': {
        const [, s, owner, n0, n1, emptyT, contested] = e;
        const N = this.net;
        const v = N && N.age > 0 ? clamp((s - N.s) / Math.max(0.05, N.age), -2, 2) : 0;
        this.net = { s, v: Math.abs(s - (N ? N.s : s)) < 1e-4 ? 0 : v, age: 0 };
        if (!N) { this.s = s; }
        this.owner = owner; this.emptyT = emptyT;
        this.hostRiders = [n0, n1];
        const on = !!contested;
        if (on !== this.contested) { this.contested = on; emit('tower:contest', { on }); }
        const ret = owner === -1 && Math.abs(s) > 1e-3 && !n0 && !n1;
        if (ret && !this.returning) emit('tower:return', {});
        this.returning = ret;
        for (let i = 0; i < this.cps.length; i++) {
          const v2 = e[7 + i];
          if (v2 === undefined) continue;
          if (v2 < 0) { this.cps[i].cleared = true; this.cps[i].left = 0; } else this.cps[i].left = v2;
        }
        break;
      }
      case 't': this.overtime = true; this.overtimeT = 0; this.otLosing = e[1]; emit('tower:overtime', { losing: e[1] }); break;
      case 'e': {
        const [, winner, reason, c0, c1, b0, b1] = e;
        if (b0 != null) { this.best = [b0, b1]; this.count = [c0, c1]; }
        this._end(winner, reason);
        break;
      }
    }
  }

  // snapshot for the HUD / results / tests
  state() {
    const sc = this.scores(), n = this.follower && this.hostRiders ? this.hostRiders : this.riders;
    const next = this.owner >= 0 ? this._nextCp(this.owner) : null;
    return {
      s: this.s, len: [...this.path.len], owner: this.owner, riders: [...n], contested: this.contested,
      count: [...this.count], score: sc, best: [...this.best], emptyT: this.emptyT, returning: this.returning,
      moving: this.moving,
      checkpoints: this.cps.map((c) => ({ team: c.team, index: c.index, d: c.d, dur: c.dur, left: c.left, cleared: c.cleared, at: !!c.at })),
      next: next ? { team: next.team, index: next.index, d: next.d, left: next.left, dur: next.dur, at: Math.abs(this.s - (next.team === 0 ? next.d : -next.d)) < 0.05 } : null,
      pos: [this.pos.x, this.pos.y, this.pos.z], top: this.top,
      overtime: this.overtime, overtimeT: +this.overtimeT.toFixed(1), losing: this.losing(),
      winner: this.winner, reason: this.reason, placeholder: this.placeholder,
    };
  }
}
