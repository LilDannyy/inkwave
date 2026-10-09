// The Tubeway's ride camera (aquarium ENGINE.md §3.6 "for the rider", DESIGN.md §3.2), driven by src/game/pipes.js
// through the registry's camera hooks (R.cam / R.camAfter, docs/STAGE-MODS.md): the module places the lens itself for
// the whole ride, so it never shows the inside of a housing, a pylon or a gulper head, and it never jams against the
// rider's head at the pop. Four shots, chosen per directed leg from the built level (planned once, lazily, per leg):
//   • ENTRY: the lens holds where the player's own camera was when the mouth took them, watching the suck, until the
//     rider is out of the end run's housing and far enough along for the chase;
//   • CHASE: the lens rides the tube's own corridor, `back` metres of path behind the rider and `lift` off its axis (up,
//     or on a riser off it on the side the rider came from), so it sees through clear glass, water and nothing else:
//     around the bends, up the kelp drum (kept clear of fronds round the riser), across the open-air spans;
//   • HOLD: (a stretch where the chase lens would be blocked) the lens stays where it last was, watching the rider;
//   • EXIT: from the moment the chase can't follow any more (the rider enters the far housing), and at least the last
//     0.3 s of the ride, the lens sits over the OUT mouth looking out along the pop heading (and the steer), so the
//     player sees the landing and whoever waits there while the steer window is open; it holds through the pop (the
//     rider flies out under and away from it, ≥ 1.6 m off) and blends into the normal follow camera after touchdown.
// Between shots the lens blends (0.35 s) when the straight move between them is clear, and cuts when it isn't (a cut
// never drags the lens through stone). Planning checks every lens against the real level: never inside an opaque block
// (anything solid but pipe glass and the stage's bakeClear glass / water), with the rider (or, in the exit shot, the
// landing) in line of sight.
import * as THREE from 'three';
import { G, clamp, damp, dampAngle } from '../core/ctx.js';
import { legAt } from '../world/pipes-data.js';

export const RIDECAM = {
  step: 0.25,                     // m between planned track samples
  back: 3.5,                      // m of path the chase lens rides behind the rider
  ease: 1.0,                      // m: the chase lens eases off its first spot (no jerk when it starts to follow)
  lift: [1.0, 0.8, 0.6, 0.4, 0.2, 0],   // m off the axis, the first that is clear (then smoothed along the track; 0: on the
                                  //   axis, inside the glass, which fades round the lens: where a tube passes under a crown)
  liftSlope: 0.6,                 // m of lift change per m of track at most
  pad: 0.3,                       // m the lens keeps from any opaque block
  near: 1.5,                      // m: the chase starts once the rider is this far past the lens's first spot
  run: 1.0,                       // m: … and the chase stays good for at least this much ride
  ahead: 1.6,                     // m: the chase looks at a point this far ahead of the rider
  exitMin: 0.3,                   // s: the exit shot shows the landing at least this long before the pop
  blend: 0.35,                    // s: a lens move between shots (when the way between is clear)
  after: 0.45,                    // s: the exit shot → the follow camera, after touchdown
  look: 16,                       // look damping rate (the lens and its target both ride smooth paths: this only smooths)
  pitch: [-1.0, 1.1],             // the look's pitch limits (player.js clamps the rig to −1.05 … 1.15)
};

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _o = new THREE.Vector3();
const _q = {}, _ids = [];
const ease = (k) => k * k * (3 - 2 * k);

// ------------------------------------------------------------------------------------------------ what the lens may see
// opaque to the eye: anything solid except pipe glass, the stage's clear glass / water (bakeClear) and grates / railings
// (the follow camera's own probe passes those too); the gulper heads (camHollow) are bronze: opaque
const opaque = (b) => b.solid && !b.pipe && !b.bakeClear && !b.grate;
// p is at least `pad` clear of every opaque block
export function lensClear(L, p, pad = RIDECAM.pad) {
  L.queryBlocks(p.x - pad - 0.01, p.z - pad - 0.01, p.x + pad + 0.01, p.z + pad + 0.01, _ids);
  for (const id of _ids) { const b = L.blocks[id]; if (opaque(b) && L.pointInBlock(b, p, pad)) return false; }
  return true;
}
// the entry t (0 when a is inside) of segment a→b against block bl, or −1
function segHit(bl, a, d, len) {
  _o.copy(a).sub(bl.center);
  let tmin = -Infinity, tmax = Infinity;
  for (let k = 0; k < 3; k++) {
    const ax = bl.axes[k], oo = _o.dot(ax), dd = d.dot(ax), h = k === 0 ? bl.half.x : k === 1 ? bl.half.y : bl.half.z;
    if (Math.abs(dd) < 1e-9) { if (oo < -h || oo > h) return -1; continue; }
    let t1 = (-h - oo) / dd, t2 = (h - oo) / dd; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }
  if (tmax < 0 || tmin > len) return -1;
  return Math.max(0, tmin);
}
// nothing opaque between a and b (the last `skipEnd` metres before b are not tested: the target's own surroundings)
export function sightClear(L, a, b, skipEnd = 0.05) {
  const d = _d.subVectors(b, a), len = d.length();
  if (len < 1e-4) return true;
  d.multiplyScalar(1 / len);
  L.queryBlocks(Math.min(a.x, b.x) - 0.01, Math.min(a.z, b.z) - 0.01, Math.max(a.x, b.x) + 0.01, Math.max(a.z, b.z) + 0.01, _ids);
  for (const id of _ids) { const bl = L.blocks[id]; if (opaque(bl) && segHit(bl, a, d, len - skipEnd) >= 0) return false; }
  return true;
}

// ------------------------------------------------------------------------------------------------ planning (per world)
// the rider's centreline point and travel frame at ride distance u on a directed leg (dir +1: A → B)
function frameAt(leg, dir, u, o) {
  const s = dir > 0 ? u : leg.len - u;
  legAt(leg, Math.max(0, Math.min(leg.len, s)), _q);
  o.x = _q.x; o.y = _q.y; o.z = _q.z; o.tx = _q.tx * dir; o.ty = _q.ty * dir; o.tz = _q.tz * dir;
  return o;
}

// the planned track for one directed leg: the chase lens at every rail position w (the lens rides the rider's own path,
// `lift` off it), where the chase may run (u from uIn to uExit), and the holes in between (none on Gulper Aquarium)
export function planLeg(W, leg, dir) {
  const key = leg.i * 2 + (dir > 0 ? 0 : 1);
  const cache = W._camPlans || (W._camPlans = new Map());
  if (cache.has(key)) return cache.get(key);
  const L = W.level, R = RIDECAM, n = Math.floor(leg.len / R.step) + 1;
  const C = new Float32Array(n * 3), N = new Float32Array(n * 3), lift = new Float32Array(n), lens = new Float32Array(n * 3), ok = new Uint8Array(n);
  const entry = leg.ends[dir > 0 ? 0 : 1];
  let hx = -entry.out[0], hz = -entry.out[2];   // the last horizontal heading (a vertical run's "behind" is −it: up, +it: down)
  const f = {};
  for (let i = 0; i < n; i++) {
    frameAt(leg, dir, Math.min(leg.len, i * R.step), f);
    C[i * 3] = f.x; C[i * 3 + 1] = f.y; C[i * 3 + 2] = f.z;
    const hl = Math.hypot(f.tx, f.tz);
    if (hl > 0.2) { hx = f.tx / hl; hz = f.tz / hl; }
    // the tube's "up": world up with its along-path part taken out (continuous round a bend onto a riser: there it
    // turns into −heading going up, +heading going down)
    let nx = -f.ty * f.tx, ny = 1 - f.ty * f.ty, nz = -f.ty * f.tz;
    const nl = Math.hypot(nx, ny, nz);
    if (nl > 0.08) { nx /= nl; ny /= nl; nz /= nl; } else { const sg = f.ty > 0 ? -1 : 1; nx = sg * hx; ny = 0; nz = sg * hz; }
    N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz;
  }
  // the lift at each rail spot: the highest that is clear and sees the rider `back` metres on (else the highest clear one)
  const bi = Math.round(R.back / R.step);
  for (let i = 0; i < n; i++) {
    const j = Math.min(n - 1, i + bi);
    _c.set(C[j * 3], C[j * 3 + 1], C[j * 3 + 2]);
    let clear = -1, sees = -1;
    for (const h of R.lift) {
      _a.set(C[i * 3] + N[i * 3] * h, C[i * 3 + 1] + N[i * 3 + 1] * h, C[i * 3 + 2] + N[i * 3 + 2] * h);
      if (!lensClear(L, _a)) continue;
      if (clear < 0) clear = h;
      if (sightClear(L, _a, _c)) { sees = h; break; }
    }
    lift[i] = sees >= 0 ? sees : clear;
  }
  // smooth the lift (never above what each sample allows: a slope-limited lower envelope), then the final lens and its check
  const hs = new Float32Array(n);
  for (let i = 0; i < n; i++) { let m = Math.max(0, lift[i]); for (let j = 0; j < n; j++) { const v = Math.max(0, lift[j]) + R.liftSlope * Math.abs(i - j) * R.step; if (v < m) m = v; } hs[i] = m; }
  for (let i = 0; i < n; i++) {
    const h = hs[i];
    _a.set(C[i * 3] + N[i * 3] * h, C[i * 3 + 1] + N[i * 3 + 1] * h, C[i * 3 + 2] + N[i * 3 + 2] * h);
    lens[i * 3] = _a.x; lens[i * 3 + 1] = _a.y; lens[i * 3 + 2] = _a.z;
    ok[i] = lift[i] >= 0 && lensClear(L, _a) ? 1 : 0;
  }
  // the lens's first spot: the first rail position clear for `run` metres
  const runN = Math.ceil(R.run / R.step);
  let i0 = -1;
  for (let i = 0; i < n && i0 < 0; i++) { let good = true; for (let j = i; j < Math.min(n, i + runN); j++) if (!ok[j]) { good = false; break; } if (good) i0 = i; }
  const P = { leg: leg.i, dir, n, C, N, lens, ok, wMin: i0 < 0 ? Infinity : i0 * R.step, len: leg.len, speed: leg.speed };
  // where the chase may run: u past the first spot by `near`, the rail lens clear and the rider in sight from it
  const good = new Uint8Array(n);
  if (i0 >= 0) for (let i = 0; i < n; i++) {
    const u = i * R.step;
    if (u < P.wMin + R.near) continue;
    const w = railW(P, u), j = Math.min(n - 1, Math.round(w / R.step));
    if (!ok[j]) continue;
    lensAt(P, w, _b); _c.set(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]);
    if (sightClear(L, _b, _c)) good[i] = 1;
  }
  let iIn = -1;
  for (let i = 0; i < n && iIn < 0; i++) { if (!good[i]) continue; let g = true; for (let j = i; j < Math.min(n, i + runN); j++) if (!good[j]) { g = false; break; } if (g) iIn = i; }
  let iT = n;   // the trailing stretch the chase can't follow (the far housing)
  while (iT > 0 && !good[iT - 1]) iT--;
  P.uIn = iIn < 0 ? Infinity : iIn * R.step;
  P.uExit = Math.min(iIn < 0 ? 0 : iT * R.step, leg.len - R.exitMin * leg.speed);
  P.holes = 0;
  if (iIn >= 0) for (let i = iIn; i < n && i * R.step < P.uExit; i++) if (!good[i]) P.holes++;
  P.good = good;
  cache.set(key, P);
  return P;
}
// the chase lens's rail position for the rider at u: `back` behind it, eased off its first spot
export function railW(P, u) {
  const x = u - RIDECAM.back - P.wMin, k = RIDECAM.ease;
  return P.wMin + (x >= k ? x : x <= -k ? 0 : ((x + k) * (x + k)) / (4 * k));
}
export function lensAt(P, w, out) {
  const f = Math.max(0, Math.min(P.n - 1, w / RIDECAM.step)), i = Math.min(P.n - 2, Math.floor(f)), k = f - i, L = P.lens;
  if (P.n < 2) return out.set(L[0], L[1], L[2]);
  return out.set(L[i * 3] + (L[i * 3 + 3] - L[i * 3]) * k, L[i * 3 + 1] + (L[i * 3 + 4] - L[i * 3 + 1]) * k, L[i * 3 + 2] + (L[i * 3 + 5] - L[i * 3 + 2]) * k);
}
const goodAt = (P, u) => !!P.good[Math.max(0, Math.min(P.n - 1, Math.round(u / RIDECAM.step)))];

// the exit shot of an OUT end: a lens over the mouth (close to the wall it is set in, about 3 m over its floor) looking
// out along the pop, clear of every opaque block, ≥ 1.6 m from a level or a high pop's flight, the landing in sight
export function exitShot(W, e) {
  const cache = W._camExits || (W._camExits = new Map());
  if (cache.has(e.i)) return cache.get(e.i);
  const L = W.level, o = e.out, sx = -o[2], sz = o[0], fy = e.floorY;
  const land = _c.set(e.land[0], e.land[1] + 0.4, e.land[2]);
  const flight = [];
  for (const [vo, vu] of [[6.5, 6.0], [7.0, 8.5]]) for (let t = 0; t <= 0.5; t += 0.05) {
    const d = 0.45 + vo * t, y = e.pos[1] - 0.3 + 0.5 + vu * t - 12.5 * t * t;
    flight.push([e.pos[0] + o[0] * d, Math.max(y, e.land[1] + 0.5), e.pos[2] + o[2] * d]);
  }
  let best = null, bs = -Infinity;
  for (const d of [0.35, 0.6, 0.9, 1.3, 1.8, 2.4]) for (const hh of [3.0, 2.8, 2.6, 3.2, 2.4]) for (const sd of [0, -0.7, 0.7]) {
    const p = _a.set(e.pos[0] + o[0] * d + sx * sd, fy + hh, e.pos[2] + o[2] * d + sz * sd);
    if (!lensClear(L, p)) continue;
    let dmin = Infinity; for (const q of flight) dmin = Math.min(dmin, Math.hypot(p.x - q[0], p.y - q[1], p.z - q[2]));
    if (dmin < 1.6) continue;
    if (!sightClear(L, p, land, 0.3)) continue;
    const score = -Math.abs(d - 0.5) - 0.6 * Math.abs(hh - 2.9) - 0.4 * Math.abs(sd);
    if (score > bs) { bs = score; best = p.clone(); }
  }
  const ok = !!best;
  if (!best) best = new THREE.Vector3(e.pos[0] + o[0] * 2.4, fy + 2.8, e.pos[2] + o[2] * 2.4);   // (never on this stage: the test reports it)
  const hd = Math.hypot(e.land[0] - best.x, e.land[2] - best.z);
  const pitch = clamp(-Math.atan2(best.y - (e.land[1] + 0.3), hd) + 0.22, -0.95, -0.15);
  const X = { end: e.i, pos: best, pitch, ok };
  cache.set(e.i, X);
  return X;
}

// ------------------------------------------------------------------------------------------------ the camera (per match)
export class RideCam {
  constructor(R) { this.R = R; this.st = null; this.lens = new THREE.Vector3(); this.on = false; }
  get W() { return this.R.W; }

  // R.cam: the shot this frame; sets the rig's yaw / pitch (the look) and keeps the lens for after()
  cam(rig, a, dt) {
    const p = a.pipe, R = RIDECAM;
    let st = this.st;
    if (st && (st.a !== a || (p && st.p !== p))) st = this.st = null;
    if (!p) {
      // touched down (or the ride ended some other way): the exit shot blends into the follow camera, then lets go
      if (!st || !a.alive) { this.reset(); return null; }
      st.landed = st.landed === undefined ? 0 : st.landed + dt;
      if (st.landed >= R.after) { this.reset(); return null; }
    }
    if (!st) st = this.st = this._new(rig, a, p);
    const P = st.plan;
    let mode, want = null, yawT = null, pitchT = null;
    const u = p ? (p.phase === 'suck' ? 0 : p.u || 0) : P.len;
    if (!p) mode = 'after';
    else if (p.phase === 'pop' || u >= P.uExit) mode = 'exit';
    else if (u < P.uIn) mode = 'entry';
    else mode = goodAt(P, u) ? 'chase' : 'hold';
    // the lens this frame
    const tgt = _b.set(a.pos.x, a.pos.y + 0.3, a.pos.z);
    if (mode === 'entry') want = st.hold;
    else if (mode === 'chase') { want = lensAt(P, railW(P, u), st.chase); st.last.copy(want); frameAt(this.R.legs[P.leg], P.dir, u, _q); tgt.x += _q.tx * R.ahead; tgt.y += _q.ty * R.ahead; tgt.z += _q.tz * R.ahead; }
    else if (mode === 'hold') want = st.last;
    else if (mode === 'exit') {
      want = st.exit.pos;
      const e = this.R.ends[st.exitEnd];
      let yaw = p && p.phase === 'pop' && p.popYaw !== undefined ? p.popYaw : Math.atan2(e.out[0], e.out[2]);
      if (p && p.phase !== 'pop' && p.steerOn) { const w = Math.atan2(p.steerX, p.steerZ); let d = w - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; yaw += clamp(d, -Math.PI / 4, Math.PI / 4); }
      yawT = yaw; pitchT = st.exit.pitch;
    }
    // shot changes: blend when the straight move is clear, else cut (the look snaps on a cut)
    if (mode !== st.mode) {
      const from = st.mode;
      st.mode = mode;
      if (mode === 'after') { st.blendT = 0; st.blendDur = R.after; st.from.copy(this.lens); }
      else if (from && want) {
        const clearMove = this.lens.distanceTo(want) < 14 && sightClear(this.W.level, this.lens, want, 0);
        if (clearMove) { st.blendT = 0; st.blendDur = R.blend; st.from.copy(this.lens); } else { st.blendT = Infinity; st.cut = true; }
      }
    }
    // the look
    if (mode !== 'after') {
      if (yawT === null) {
        const base = st.blendT < st.blendDur ? _c.copy(st.from).lerp(want, ease(st.blendT / st.blendDur)) : _c.copy(want);
        const d = _d.subVectors(tgt, base), l = d.length() || 1;
        yawT = Math.atan2(d.x, d.z); pitchT = Math.asin(clamp(d.y / l, -1, 1));
      }
      pitchT = clamp(pitchT, R.pitch[0], R.pitch[1]);
      if (st.cut || st.fresh) { rig.yaw = yawT; rig.pitch = pitchT; st.cut = false; st.fresh = false; }
      else { const r = mode === 'exit' ? 10 : R.look; rig.yaw = dampAngle(rig.yaw, yawT, r, dt); rig.pitch = damp(rig.pitch, pitchT, r, dt); }   // (mouse input is pulled back at this rate)
    } else {
      // after touchdown: keep the rider in the frame while the lens slides back behind it, then the follow camera's pitch
      const d = _d.subVectors(_c.set(a.pos.x, a.pos.y + 0.9, a.pos.z), this.lens), l = d.length() || 1, kk = ease(clamp(st.landed / R.after, 0, 1));
      rig.pitch = damp(rig.pitch, Math.asin(clamp(d.y / l, -1, 1)) * (1 - kk) - 0.14 * kk, 10, dt);
    }
    st.want = want;
    st.dt = dt;
    this.on = true;
    const k = mode === 'after' ? clamp(st.landed / R.after, 0, 1) : 0;
    return { glide: mode !== 'after', boom: mode === 'after' ? 0 : 0.8, fov: 6 * (1 - k), skip: 'pipe' };
  }

  _new(rig, a, p) {
    const leg = this.R.legs[p.leg], dir = p.dir;
    const plan = planLeg(this.W, leg, dir), exitEnd = p.exit, exit = exitShot(this.W, this.R.ends[exitEnd]);
    // the entry hold: where this camera was when the mouth took the rider (or, if that is in a block, over the IN mouth)
    const hold = (G.camera?.position || rig.camera.position).clone();
    if (!lensClear(this.W.level, hold, 0.05)) hold.copy(exitShot(this.W, this.R.ends[p.entry]).pos);
    this.lens.copy(G.camera?.position || hold);
    return { a, p, plan, exit, exitEnd, hold, chase: new THREE.Vector3(), last: hold.clone(), from: new THREE.Vector3(), mode: null, blendT: Infinity, blendDur: 1, cut: false, fresh: !!(p.u0 > 0), landed: undefined };
  }

  // R.camAfter: put the lens where the shot wants it (the rig draws it at pivot − forward × curDist, + 0.15 up)
  after(rig, a, o) {
    const st = this.st;
    if (!st) return;
    const fwd = rig.forward(_a), dt = st.dt || 1 / 60;
    let lens;
    if (st.mode === 'after') {
      // the follow camera's own lens (its boom recovering fast: the wall it popped from is behind it), blended in
      this._recover(rig, o, dt);
      const nat = _c.copy(rig.pivot).addScaledVector(fwd, -rig.curDist); nat.y += 0.15;
      lens = _d.copy(st.from).lerp(nat, ease(clamp(st.landed / RIDECAM.after, 0, 1)));
    } else {
      const w = st.want || st.hold;
      if (st.blendT < st.blendDur) {
        st.blendT += dt;
        lens = _d.copy(st.from).lerp(w, ease(clamp(st.blendT / st.blendDur, 0, 1)));
        if (!lensClear(this.W.level, lens, 0.1)) { st.blendT = Infinity; lens.copy(w); }   // (the target moved behind something: cut)
      } else lens = _d.copy(w);
    }
    this.lens.copy(lens);
    rig.curDist = 3.0;
    rig.pivot.copy(lens).addScaledVector(fwd, 3.0); rig.pivot.y -= 0.15; rig.pivotY = rig.pivot.y;
    rig.shoulder = 0;
    const V = this.W.inWater(lens);
    this.R.camInWater = !!V;
    this.W.looks?.underwater(V || null);
  }
  // the follow camera's boom comes back out quickly once the way behind is clear (its own ease-out is for walking)
  _recover(rig, o, dt) {
    if (!rig.boom || rig.wantDist <= rig.boom.x + 0.05) return;
    const pr = this._pr || (this._pr = { soft: 0 });
    const back = rig.forward(_b).negate();
    G.physics.skip = (o && o.skip) || 'pipe';
    try { G.physics.cameraProbe(rig.pivot, back, rig.wantDist, 0.62, pr); } finally { G.physics.skip = null; }
    if (pr.soft > rig.boom.x) { rig.boom.x = Math.min(pr.soft, rig.boom.x + 10 * dt); rig.curDist = rig.boom.x; }
  }
  reset() { this.st = null; this.on = false; }
}
