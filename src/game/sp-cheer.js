// [b5-zipcheer] Cheer Orb (special `booyah`: the orb itself, its charge and throw are src/game/specials.js IMPL.booyah) —
// the batch-5 rework (2026-10-04, the user: "Using Cheer Orb rises you up in the air and you are stuck there while
// charging. Teammates get a bigger prompt bottom middle to cheer. When they do cheer, send a wisp of energy to the Orb
// and also to their special meter to charge it a little bit."). Numbers: config SPECIALS.booyah.
//
//   the lift    using it lifts you `lift` m (2.2) into the air over liftTime s (an ease-out; less under a ceiling, none
//               under a low one) and holds you there (special.pin: actor.js leaves the body where this module puts it) —
//               no walking, swimming or jumping; you still turn and aim — until the orb is thrown or the special ends
//               (a splat, a loadout swap). Started on a moving block (Tower Command's tower, a railcar, a pod's hedge)
//               you hang over the same spot of it as it moves. Let go, you drop back down. lift 0: the old way (walking
//               slowly at moveSpeed).
//   the cheer   a "Yeah!" (C / d-pad up: player.js intent.cheer, bots too) while a teammate's orb is still charging (not
//               thrown, not full) sends a wisp of energy from the cheerer to each such orb — on arrival (cheerFly s, a
//               little longer from far off) the orb takes +cheer of a full charge and pulses — and a second wisp into the
//               cheerer's own special gauge on their HUD (src/ui/hud-cheer.js draws it), which gains cheerGain (4 %) of
//               their full gauge as it lands (cheerGaugeFly s; none while their own special runs, nothing past full).
//               One cheer per 0.4 s. Your own orb can't be cheered by you. A cheer with no orb to help is still a "Yeah!"
//               (the bubble over your head and the voice), as before.
//   the prompt  teammates (only) of a player charging an orb get a big bottom-middle prompt to cheer it (hud-cheer.js).
//
// Online: the cheerer's owner (each player; the host for its bots) records ['k', nid, 'cheer', [gain, nid …]] — whether
// its own gauge gains, and the orbs it sent wisps to (their users' net ids). Every other screen plays the "Yeah!" and the
// same wisps from it (KIT_GHOSTS.cheer). An orb's charge is its user's owner's to keep: the screen that owns the orb's
// user adds the cheer when ITS wisp reaches the orb (the charge then reaches everyone through the user's tick:
// specials.js specialNetState); a ghost orb only pulses. The gauge gain is the cheerer's own screen's (it owns its
// gauge). The lift needs nothing on the wire: the user's position and pose ride its tick.
import * as THREE from 'three';
import { G, emit, on, clamp } from '../core/ctx.js';
import { SPECIALS, PLAYER } from '../config.js';
import { ZC_STATS } from './specials.js';
import { KIT_GHOSTS, netRec } from './kits/registry.js';
import { Hit } from './physics.js';
import '../audio/sfx-cheer.js';

export { ZC_STATS };
const D = () => SPECIALS.booyah;
const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1);
const _hit = new Hit();
const rand = Math.random;
const near = (p, r = 40) => !!G.camera && G.camera.position.distanceToSquared(p) < r * r;
const play = (name, o) => G.audio?.play(name, o);
const hearable = (a) => a.isLocal || (a._nearCamera && a._nearCamera());
const G_SOFT = 0, G_STAR = 10, G_HALO = 30;   // (fx.js glow sprite kinds)

// an orb a cheer can still help: a teammate's (not the cheerer's own), held up, not full
const helpable = (a, o) => {
  const s = o.specialActive;
  return o !== a && o.team === a.team && o.alive && !!s && s.id === 'booyah' && !s.thrown && !s.ended && (s.charge || 0) < 1;
};
// where an orb is drawn (the ball over its user's head), else over the head
function orbPos(o, s, out) {
  if (s && s.ball) return out.copy(s.ball.position);
  return out.set(o.pos.x, o.pos.y + PLAYER.height + 0.8, o.pos.z);
}
function chest(a, out) { return out.set(a.pos.x, a.pos.y + (a.smoothY || 0) + (a.form === 'squid' ? 0.4 : 1.1), a.pos.z); }

// ================================================================================================ wisps
// A cheer's wisp of energy flying from the cheerer to an orb: a bright head in the cheerer's colour with a comet tail
// and a few sparkles spiralling round its path, on an arc up and over into the ball (it homes on the ball as it moves).
// At the orb: a sparkle burst and a halo, the orb pulses — and on the screen that owns the orb's user, the charge.
class OrbWisp {
  constructor(sys, from, to) {
    this.sys = sys; this.kind = 'cheerwisp'; this.owner = from; this.team = from.team; this.dead = false;
    this.to = to; this.s = to.specialActive;
    this.p0 = chest(from, new THREE.Vector3());
    this.pos = this.p0.clone(); this.prev = this.p0.clone();
    const d = this.p0.distanceTo(orbPos(to, this.s, _p));
    this.dur = D().cheerFly * clamp(0.7 + d / 30, 0.8, 1.6);
    this.side = (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.9);   // (which way it bows: two wisps at once don't overlap)
    this.lift = 1.1 + d * 0.22;
    this.t = 0; this.spark = 0;
    this.col = from.color.clone().lerp(WHITE, 0.35);
  }
  // where it is at k (0 … 1) on its arc (a quadratic Bézier, the far end on the ball's live position)
  at(k, out) {
    const p1 = orbPos(this.to, this.s, _q), p0 = this.p0;
    const mx = (p0.x + p1.x) / 2, mz = (p0.z + p1.z) / 2, my = Math.max(p0.y, p1.y) + this.lift;
    const dx = p1.x - p0.x, dz = p1.z - p0.z, l = Math.hypot(dx, dz) || 1;
    const cx = mx - (dz / l) * this.side, cz = mz + (dx / l) * this.side;
    const u = 1 - k;
    return out.set(u * u * p0.x + 2 * u * k * cx + k * k * p1.x, u * u * p0.y + 2 * u * k * my + k * k * p1.y, u * u * p0.z + 2 * u * k * cz + k * k * p1.z);
  }
  update(dt) {
    this.t += dt;
    const k = clamp(this.t / this.dur, 0, 1), e = k * k * (1.6 - 0.6 * k);   // (eases off the hand, speeds into the orb)
    this.prev.copy(this.pos);
    this.at(e, this.pos);
    const gone = this.to.specialActive !== this.s || !this.to.alive;   // (thrown / ended on the way: it just fades out)
    this._draw(dt, gone ? 1 - k : 1);
    if (k < 1 && !(gone && this.t > 0.12)) return true;
    if (!gone) this._arrive();
    return false;
  }
  _draw(dt, fade) {
    const fx = G.fx;
    if (!fx || !fx._sprite || !near(this.pos, 60)) return;
    const q = fx.q ?? 1, P = this.pos, Q = this.prev, c = _c.copy(this.col).multiplyScalar(3.2 * fade);
    // the head: a soft hot core (two frames' worth overlap into a steady blob) with a white heart
    fx._sprite(fx.glows, P.x, P.y, P.z, 0, 0, 0, c, 0.62, 0.5, 0.05, 1, 0, 0, G_SOFT + 2.2, 0.0, 0);
    // the tail: soft blobs laid along the frame's travel, shrinking and fading behind it
    const n = Math.max(1, Math.round(3 * q));
    for (let i = 0; i < n; i++) {
      const f = (i + rand()) / n;
      _c2.copy(this.col).multiplyScalar(2.2 * fade);
      fx._sprite(fx.glows, Q.x + (P.x - Q.x) * f, Q.y + (P.y - Q.y) * f, Q.z + (P.z - Q.z) * f, (rand() - 0.5) * 0.4, (rand() - 0.3) * 0.4, (rand() - 0.5) * 0.4, _c2, 0.34, 0.03, 0.32 + rand() * 0.12, 0.9, 1.5, 0, G_SOFT + 0.6, 0.02, 0);
    }
    // sparkles spiralling round its path
    this.spark -= dt;
    if (this.spark <= 0) {
      this.spark = 0.035 / q;
      const a = this.t * 22, r = 0.22;
      _c2.copy(this.col).lerp(WHITE, 0.5).multiplyScalar(2.6 * fade);
      fx._sprite(fx.glows, P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, P.z + Math.sin(a * 0.7) * r, Math.cos(a) * 0.6, 0.5, Math.sin(a) * 0.6, _c2, 0.2, 0.05, 0.4, 1, 1.2, 0, G_STAR + 1.2, 0.04, 2);
    }
  }
  _arrive() {
    const o = this.to, s = this.s, d = D();
    s.cheered = 0.35;   // (the orb pulses on every screen)
    const at = orbPos(o, s, _p);
    // the charge: the orb's user's owner's (here only when this screen owns the user)
    if (!o.remote && !s.ghost && !s.thrown) {
      const was = s.charge || 0;
      s.charge = Math.min(1, was + d.cheer);
      ZC_STATS.orbCharge += s.charge - was;
    }
    emit('cheer:orb', { actor: this.owner, target: o, pos: at.clone() });
    if (near(at, 45)) play('cheer_orb', { pos: at.clone(), volume: 0.8, pitch: 0.95 + 0.25 * clamp(s.charge || 0, 0, 1) });
    const fx = G.fx;
    if (fx && fx._sprite && near(at, 60)) {
      const q = fx.q ?? 1, n = Math.max(3, Math.round(8 * q));
      for (let i = 0; i < n; i++) {
        const u = rand() * 2 - 1, a = rand() * Math.PI * 2, w = Math.sqrt(1 - u * u), sp = 2 + rand() * 2.5;
        _c2.copy(this.col).lerp(WHITE, 0.4).multiplyScalar(2.6);
        fx._sprite(fx.glows, at.x, at.y, at.z, Math.cos(a) * w * sp, u * sp, Math.sin(a) * w * sp, _c2, 0.24, 0.04, 0.35 + rand() * 0.2, 1, 3, 0, G_STAR + 1.5, 0.02, 3);
      }
      _c2.copy(this.col).multiplyScalar(2.4);
      fx._sprite(fx.glows, at.x, at.y, at.z, 0, 0, 0, _c2, 0.5, 1.9, 0.32, 0.9, 0, 0, G_HALO + 1, 0.02, 0);
    }
  }
  dispose() { this.dead = true; }
}

// A cheer's wisp into the cheerer's own special gauge: nothing in the world — the HUD draws it (hud-cheer.js reads
// API.gauge) from the cheerer up into the gauge — and the gauge gains as it lands. On the cheerer's own screen only.
class GaugeWisp {
  constructor(sys, a) {
    this.sys = sys; this.kind = 'cheergauge'; this.owner = a; this.team = a.team; this.dead = false;
    this.t = 0; this.dur = D().cheerGaugeFly; this.id = ++API._n;
    API.gauge.push(this);
  }
  update(dt) {
    this.t += dt;
    if (this.t < this.dur) return true;
    const a = this.owner, d = D();
    if (a.alive && !a.specialActive && !a.remote) {
      const was = a.specialReady(), cost = a.specialCost();
      const add = Math.max(0, Math.min(cost - a.special, d.cheerGain * cost));
      if (add > 0) {
        a.special += add;
        ZC_STATS.gains++; ZC_STATS.gainPts += add;
        emit('cheer:gain', { actor: a, amount: add, frac: add / cost });
        if (a.isLocal) play('cheer_gain', { volume: 0.7 });
        if (!was && a.specialReady()) emit('special:ready', { actor: a });
      }
    }
    return false;
  }
  dispose() { this.dead = true; const i = API.gauge.indexOf(this); if (i >= 0) API.gauge.splice(i, 1); }
}

// the "Yeah!" itself on this screen: the bubble over the cheerer (main.js → hud.js), the voice, the wisps
function show(a, targets, gain) {
  const sys = G.specials;
  if (!sys) return;
  if (hearable(a)) play('booyah_cheer', { pos: a.isLocal ? undefined : a.pos, volume: a.isLocal ? 0.7 : 0.5, pitch: 0.95 + rand() * 0.15 });
  sys.cheers.push({ a, t: 0 });
  for (const o of targets) sys.world.push(new OrbWisp(sys, a, o));
  if (targets.length && hearable(a)) play('cheer_wisp', { pos: a.isLocal ? undefined : chest(a, new THREE.Vector3()), volume: a.isLocal ? 0.55 : 0.4 });
  if (gain) sys.world.push(new GaugeWisp(sys, a));
}

// ================================================================================================ API
const API = {
  _n: 0,
  gauge: [],             // the gauge wisps in flight on this screen (hud-cheer.js draws the local player's)
  stats: ZC_STATS,
  helpable,
  // a local player's / bot's cheer (specials.js SpecialSystem.update → cheer(a) on intent.cheer)
  cheer(a) {
    if (!a.alive || G.time - (a._cheerT || -9) < 0.4) return;
    a._cheerT = G.time;
    const targets = (G.actors || []).filter((o) => helpable(a, o));
    const gain = targets.length > 0 && !a.specialActive && a.special < a.specialCost();
    ZC_STATS.cheers++; if (targets.length) ZC_STATS.helped++;
    show(a, targets, gain);
    netRec(a, 'cheer', [gain ? 1 : 0, ...targets.map((o) => (o.nid ?? -1))]);
    emit('actor:cheer', { actor: a, helped: targets.length > 0, targets: targets.length });
  },
  // the special starting on its owner's screen: up into the air (specials.js IMPL.booyah.start)
  lift(a, s) {
    const d = s.def;
    ZC_STATS.orbs++;
    if (!(d.lift > 0)) return;
    // under a ceiling: only as high as leaves room for the kid and the orb over its head
    let H = d.lift;
    const g = G.physics.raycast(_p.set(a.pos.x, a.pos.y + 0.3, a.pos.z), UP, d.lift + 2.7, _hit, true);
    if (g.hit) H = clamp(g.dist - 2.4, 0, d.lift);
    s.pin = true;
    s.pinVel = new THREE.Vector3();
    const L = s.lift = { x: a.pos.x, y0: a.pos.y, z: a.pos.z, H, t: 0, b: null, lx: 0, ly: 0, lz: 0 };
    // standing on a moving block: hang over the same spot of it (its local frame)
    const bid = a.grounded && a.ground && a.ground.hit ? a.ground.block : -1;
    const b = bid >= 0 ? G.level.blocks[bid] : null;
    if (b && b.dynamic) {
      const dx = a.pos.x - b.center.x, dz = a.pos.z - b.center.z;
      L.b = b; L.lx = dx * b.axes[0].x + dz * b.axes[0].z; L.lz = dx * b.axes[2].x + dz * b.axes[2].z; L.ly = a.pos.y - b.center.y;
    }
    a.vel.set(0, 0, 0);
    if (H > 0.05) { ZC_STATS.lifted++; ZC_STATS.liftM += H; }
    if (hearable(a)) play('orb_lift', { pos: a.isLocal ? undefined : a.pos, volume: a.isLocal ? 0.7 : 0.5 });
    if (G.fx && near(a.pos)) G.fx.burst(_p.set(a.pos.x, a.pos.y + 0.1, a.pos.z), UP, a.color, { count: 10, speed: 3, size: 0.08, ring: true });
    emit('cheer:lift', { actor: a, height: H });
  },
  // each frame on its owner's screen, before the body moves (specials.js IMPL.booyah.move): where the lift has the body
  hold(a, s, dt) {
    const L = s.lift;
    if (!L || !s.pin || !a.alive) return;
    L.t += dt;
    const d = s.def, k = clamp(L.t / Math.max(0.01, d.liftTime), 0, 1), e = 1 - (1 - k) * (1 - k) * (1 - k);
    let x = L.x, y = L.y0, z = L.z;
    const b = L.b;
    if (b && G.level.blocks[b.id] === b) {
      x = b.center.x + b.axes[0].x * L.lx + b.axes[2].x * L.lz;
      z = b.center.z + b.axes[0].z * L.lx + b.axes[2].z * L.lz;
      y = b.center.y + L.ly;
    }
    y += L.H * e + (k >= 1 ? Math.sin((L.t - d.liftTime) * 2.6) * 0.05 : 0);   // (a slow bob once up)
    s.pinVel.set((x - a.pos.x) / Math.max(dt, 1e-3), (y - a.pos.y) / Math.max(dt, 1e-3), (z - a.pos.z) / Math.max(dt, 1e-3));
    a.pos.set(x, y, z);
    a.grounded = false; a.jumpBuffer = 0; a.coyote = 0;
    if (G.time - (L.sparkT || 0) > 0.09 && G.fx && near(a.pos, 30)) { L.sparkT = G.time; G.fx.specialSparkle?.(_p.set(x, y - 0.4, z), a.color, 0.6); }
  },
  // the special over (thrown, splatted, swapped): let go — down you come
  release(a, s, reason) {
    if (reason === 'throw') ZC_STATS.thrown++;
    if (!s.pin) return;
    s.pin = false;
    if (reason === 'splat' && s.lift && s.lift.H > 0.05) ZC_STATS.splatHeld++;
    if (a.alive) { a.vel.set(0, 0, 0); a.grounded = false; }
  },
  // the teammate orbs the local player could cheer right now (hud-cheer.js): [{ actor, s }]
  calls(me, out = []) {
    out.length = 0;
    if (!me) return out;
    for (const o of G.match?.actors || G.actors || []) {
      const s = o.specialActive;
      if (o === me || o.team !== me.team || !o.alive || !s || s.id !== 'booyah' || s.thrown || s.ended) continue;
      out.push({ actor: o, s });
    }
    return out;
  },
};
G.cheerOrb = API;

// online: a remote player's / bot's cheer, from its owner's record (netmatch plays it on that sender's timeline)
KIT_GHOSTS.cheer = {
  ghost(a, d) {
    if (!a || !Array.isArray(d)) return;
    const byNid = G.netm?.byNid, targets = [];
    for (let i = 1; i < d.length; i++) {
      const o = byNid ? byNid.get(d[i]) : null, s = o && o.specialActive;
      if (o && o.alive && s && s.id === 'booyah' && !s.thrown && !s.ended && o.team === a.team) targets.push(o);
    }
    ZC_STATS.cheers++;
    show(a, targets, false);
    emit('actor:cheer', { actor: a, helped: targets.length > 0, targets: targets.length, remote: true });
  },
};

// counters: the specials started on their owners' screens; damage taken while held up
on('special:start', (e) => { if (e.actor && !e.actor.remote && e.id === 'zipcaster') ZC_STATS.zipUses++; });
on('damage', (e) => { const s = e.victim && e.victim.specialActive; if (s && s.pin) ZC_STATS.dmgHeld += e.amount || 0; });
