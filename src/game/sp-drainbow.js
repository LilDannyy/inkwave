// Drainbow (special): a big soap-film bubble with a slightly rainbow sheen, set down at your feet — you're free at once.
// Numbers: config SPECIALS.drainbow. Looks: src/fx/drainbowFx.js. Sounds: src/audio/sfx-drainbow.js.
//
//   shots      an enemy shot whose path touches the bubble loses half its damage (shotMul), once a shot however often it
//              crosses: projectiles, flung / rolled ink, beams (chargers, the bow), thrown subs and special projectiles
//              are flagged as they pass (pass() / rayShot(): obj.dbw) and halved when they land (Projectiles.applyHit's
//              shot); a blast's splash is halved when its way to the victim (from its centre) crosses the film; anything
//              else (melee, rollers, devices …) when the line from the attacker does; and whatever reaches someone
//              INSIDE the bubble came through the film: always halved. The shot fizzles at the film (sparks, a fizz, a
//              small ripple). The shooter's screen decides, like every hit (netmatch: the halved damage is what's sent).
//   inside     foes inside are drained — ink inkDrain / s (and no refill), special specialDrain × a full meter / s — by
//              their own screen (each player owns their ink and meter; the host its bots), and you and your teammates
//              inside gain: ink and special at drain × (foes inside) / (your team inside — its owner counted while
//              within ownerNear m of the film), every screen from its own view of where everyone is (synced
//              positions). None in it: nobody gains.
//   ink        it lands with a splash of the owner's ink over paintFoot of its footprint, and when its time runs out the
//              film rains down over paintPop of it (special ink: turf, never meter; the owner's screen paints).
//   the owner  your Drainbow is your running special while it stands (actor.specialActive, flagged `free`: it holds
//              neither your body nor your weapon), so your meter doesn't charge — painting, zones, the tower, cheers all
//              skip a running special. Your share of the drained special turns into bubble time instead
//              (extendPerMeter s per full meter, total life ≤ maxLife), shown on the bubble (it brightens and swirls
//              faster), with a chime, and on your HUD gauge (remaining() reads the longer life). Your ink share is
//              ink as usual. It pops when its time runs out, when you're splatted (popOnOwnerSplat; your meter then
//              restarts from the splat share, as for any special cut short) or you change loadout.
//   your view  inside an enemy's: the clear-ink wave's look sweeps the colour out of your view from where you crossed,
//              everything goes grey and your hearing is muffled (master low-pass + dip); out again, the wave sweeps the
//              colour back (drainbowFx.js DrainView). Under the same front both teams' ink turns one shade (the user: "make
//              all ink appear the same colour" — src/world/inkOne.js: the floors and walls, the tower's / hedges' ink,
//              shots, ink drops, the minimap's turf), so in there you can't tell whose turf is whose. Others see a stream
//              of your ink pulled out of you to its middle.
//   anyone     crossing the film: a dimple and a ring spreading over the film from the crossing point, a bloop and a
//              chime (every screen, from its own view).
//
// Online: the owner records the bubble as its special's moments — ['k', nid, 'sp', [4, 'p', x, y, z, r, life]] right
// after the start record, [4, 'x', life] when its life grows (throttled), the end record [1, reason] pops it — and
// every other screen builds a ghost bubble from those (GHOST.drainbow). A ghost never drains or feeds anyone on its
// own: each screen runs the drain / gain for the players it owns against every bubble it shows, ghost or not.
//
// Bots: botSpecials.js reads a live enemy bubble as a light lingering area (routes round it, out of it unless holding
// the objective) and prefers a foe not behind one (targetBias); inside an enemy one a bot's hearing shrinks and it
// sees a little less far (botSight.js — its own screen goes grey for nobody), and it can't tell its own ink from
// theirs (the user: "bots cant tell if its their ink or not so they cover everything as they go" — API.blind(); bots.js
// BotBrain.inkTeam / groundSeen): none of the ink reads as its own, so it paints everything it passes, walks rather than
// swims, and a refill sends it out of the bubble first (botSpecials.js lets it keep painting on its way out; botBlind 0:
// off). Its own: botWants() sets it down with the
// fight in its weapon's reach (bots.js also: ON the zone, by the tower), and botHold() (SpecialSense.act) keeps a bot
// fighting from inside its team's bubble — sliding along the film rather than stepping out — while its target is in
// reach from in there (botHold: 0 turns that off for an A/B).
import * as THREE from 'three';
import { G, emit, clamp } from '../core/ctx.js';
import { SPECIALS, PLAYER, weaponRange } from '../config.js';
import { registerSpecial } from './specials.js';
import { netRec, netId } from './kits/registry.js';
import { SPECIAL_ICONS } from '../ui/ui-icons.js';
import { SPECIAL_START } from '../audio/cues.js';
import { Hit } from './physics.js';
import { BubbleLook, DrainView, drainStream, inflow, fizzle, popSpray } from '../fx/drainbowFx.js';

const D = () => SPECIALS.drainbow;
const TAU = Math.PI * 2;
const POP = 0.42;                 // s: the film tearing open
const r2 = (x) => Math.round(x * 100) / 100;
const V = (d, i) => new THREE.Vector3(d[i], d[i + 1], d[i + 2]);
const rec = (a, d) => netRec(a, 'sp', d);
const DOWN = new THREE.Vector3(0, -1, 0);
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _f = new THREE.Vector3(), _n = new THREE.Vector3(), _vc = new THREE.Vector3(), _va = new THREE.Vector3();
const _hit = new Hit();
const near = (p, r = 34) => !!G.camera && G.camera.position.distanceToSquared(p) < r * r;

// counters (tests / botlab)
export const DRAIN_STATS = { placed: 0, passes: 0, cuts: 0, crossings: 0, fizzles: 0, pops: 0, extended: 0, holds: 0 };   // (holds: bot-frames held inside)

// where a squidkid's body is (its middle): what's inside / outside a bubble
function chest(a, out) { return out.set(a.pos.x, a.pos.y + (a.smoothY || 0) + (a.form === 'squid' ? 0.35 : 0.9), a.pos.z); }
// the segment p → q against the sphere (c, r): the share along it where it first touches (0: starts inside), else −1
function segSphere(p, q, c, r) {
  const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, fx = p.x - c.x, fy = p.y - c.y, fz = p.z - c.z;
  const cc = fx * fx + fy * fy + fz * fz - r * r;
  if (cc <= 0) return 0;
  const a = dx * dx + dy * dy + dz * dz;
  if (a < 1e-10) return -1;
  const b = 2 * (fx * dx + fy * dy + fz * dz), disc = b * b - 4 * a * cc;
  if (disc < 0) return -1;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : -1;
}

// ================================================================================================ the bubble
const B = [];                     // every bubble this screen shows (the owner's and ghosts), popping ones too
const API = {
  live: false,                    // any bubble halving shots right now (a cheap check for the hot paths)
  bubbles: B,
  stats: DRAIN_STATS,
  view: null,
  pass, rayShot, cut, botWants: (a, dist) => botWants(a, dist), botHold: (b, move) => botHold(b, move),
  // the enemy bubble a is inside (null: none) — bots, tests
  inEnemy(a) { for (const b of B) if (b.live && b.team !== a.team && b.in.get(a)) return b; return null; },
  // a's own team's bubble a is inside
  inOwn(a) { for (const b of B) if (b.live && b.team === a.team && b.in.get(a)) return b; return null; },
  // a bot inside an enemy bubble can't tell its own ink from theirs (bots.js BotBrain.inkTeam / groundSeen): the enemy
  // bubble it's in, or null (botBlind 0: never)
  blind(a) { return API.live && D().botBlind !== 0 ? API.inEnemy(a) : null; },
};
G.drainbow = API;
const refresh = () => { API.live = B.some((b) => b.live); };

class Drainbow {
  constructor(sys, owner, c, r, life, ghost) {
    this.sys = sys; this.kind = 'drainbow'; this.owner = owner; this.team = owner.team; this.ghost = !!ghost;
    this.pos = c.clone(); this.r = r; this.life = life; this.t = 0; this.dead = false;
    this.popT = -1; this.orphan = false;
    this.in = new Map();          // actor → inside (with a little hysteresis at the film)
    this.boostK = 0; this.boostT = 0; this.drainK = 0; this.share = 0; this.nE = 0; this.nG = 0;
    this.sentLife = life; this.sentT = G.time; this.fizzT = -1; this.gainT = 0; this.extT = 0;
    const g = G.physics.raycast(_p.set(c.x, c.y + 0.1, c.z), DOWN, r + 4, _hit, true);
    this.ground = g.hit ? g.point.y : -Infinity;
    this.look = new BubbleLook(sys.scene, G.teamColors[this.team]);
    B.push(this); refresh();
    DRAIN_STATS.placed++;
  }
  get live() { return !this.dead && this.popT < 0; }
  // blown up with a wobble over `inflate` s
  scale() {
    const x = this.t / D().inflate;
    if (x >= 1) return 1;
    return Math.max(0.02, 1 - Math.exp(-5.5 * x) * Math.cos(x * 7.5));
  }
  radius() { return this.r * this.scale(); }
  // the owner's running special is this bubble (else it runs on its own clock)
  owned() { const s = this.owner.specialActive; return !this.ghost && !!s && s.bubble === this; }

  update(dt) {
    const d = D();
    this.t += dt;
    if (this.popT >= 0) {
      this.popT += dt;
      this._draw(dt);
      if (this.popT >= POP) { this.dead = true; return false; }
      return true;
    }
    if (this.ghost && this.t > this.life + 3) { this.pop('lost'); return true; }           // (its owner's end never came)
    if (!this.ghost && !this.owned() && this.t >= this.life) { this.pop('time'); return true; }   // (orphaned)
    const R = this.radius();
    // ---- who's in it (every screen); a crossing ripples the film
    const foes = this._foes || (this._foes = []), mates = this._mates || (this._mates = []);
    foes.length = 0; mates.length = 0;
    for (const a of G.actors) {
      if (!a.alive || (a.superJumpState && a.superJumpState.phase === 'flight')) { this.in.delete(a); continue; }
      const dd = chest(a, _p).distanceTo(this.pos), was = this.in.get(a);
      const now = was ? dd < R + 0.08 : dd < R - 0.08;
      if (was !== undefined && was !== now && this.t > d.inflate * 0.8) this._cross(a, now, _p);
      this.in.set(a, now);
      if (now) (a.team === this.team ? mates : foes).push(a);
    }
    // (the owner close outside the film still takes its share: its life grows while it fights by it)
    const o = this.owner;
    if (!this.ghost && d.ownerNear > 0 && o.alive && !mates.includes(o) && this.owned() && chest(o, _p).distanceTo(this.pos) < R + d.ownerNear) mates.push(o);
    this.nE = foes.length; this.nG = mates.length;
    const share = this.share = this.nE && this.nG ? this.nE / this.nG : 0;
    // ---- the drain (the players this screen owns), the gain (split across the team inside)
    let extending = false;
    for (const e of foes) {
      e._dbT = G.time;
      if (e.remote) continue;
      // (no refill in there: whatever the tank gained since the drain last frame goes too — a special's own refill aside)
      if (e._dbInk !== undefined && G.time - e._dbInkT < 0.1 && e.ink > e._dbInk && !e.specialActive) e.ink = e._dbInk;
      e.ink = Math.max(0, e.ink - d.inkDrain * dt);
      e._dbInk = e.ink; e._dbInkT = G.time;
      if (!e.specialActive) e.special = Math.max(0, e.special - d.specialDrain * e.specialCost() * dt);
    }
    if (share > 0) {
      for (const g of mates) {
        g._dbG = G.time;
        if (g.remote) continue;
        g.ink = Math.min(PLAYER.inkMax, g.ink + d.inkDrain * share * dt);
        const sp = d.specialDrain * share * dt;   // (a share of a full meter)
        if (g === this.owner && this.owned()) extending = this._extend(sp * d.extendPerMeter) || extending;
        else if (!g.specialActive) {
          const was = g.specialReady();
          g.special = Math.min(g.specialCost(), g.special + sp * g.specialCost());
          if (!was && g.specialReady()) emit('special:ready', { actor: g });
        }
        if (g.isLocal && (this.gainT -= dt) <= 0) { this.gainT = 0.75; G.audio?.play('drainbow_gain', { volume: 0.55, pitch: 0.95 + Math.random() * 0.12 }); }
      }
    }
    if (extending) this.boostT = 0.5;
    // (the last bit of a growth the throttle held back: sent once it stops growing)
    else if (this.gid && !this.ghost && this.life !== this.sentLife && G.time - this.sentT > 0.25) { rec(this.owner, [4, 'x', r2(this.life)]); this.sentLife = this.life; this.sentT = G.time; }
    this.boostT -= dt; this.extT -= dt;
    // ---- the streams (every screen: drained foes' ink pulled to the middle, flowing on to the team inside)
    if (near(this.pos, 45)) {
      for (const e of foes) drainStream(chest(e, _p), this.pos, e.color || G.teamColors[e.team], 22, dt);
      if (share > 0) for (const g of mates) inflow(this.pos, chest(g, _p), g.color || G.teamColors[g.team], 18 * Math.min(2, share), dt, this.t);
    }
    this._draw(dt);
    return true;
  }
  // the owner's share of the drained special, as bubble time (≤ maxLife in all); true while it grows
  _extend(sec) {
    const d = D(), before = this.life;
    this.life = Math.min(d.maxLife, this.life + sec);
    const s = this.owner.specialActive;
    if (s && s.bubble === this) s.dur = this.life;
    if (this.life <= before + 1e-7) return false;
    DRAIN_STATS.extended = Math.round((DRAIN_STATS.extended + this.life - before) * 100) / 100;
    // (others' screens: its new life, a few times a second while it grows)
    if (this.gid && (this.life - this.sentLife >= 0.2 || this.life >= d.maxLife) && G.time - this.sentT > 0.25) { rec(this.owner, [4, 'x', r2(this.life)]); this.sentLife = this.life; this.sentT = G.time; }
    if (this.owner.isLocal && this.extT <= 0) { this.extT = 0.9; G.audio?.play('drainbow_extend', { volume: 0.7, pitch: 0.9 + 0.3 * clamp((this.life - d.duration) / Math.max(1, d.maxLife - d.duration), 0, 1) }); }
    return true;
  }
  _draw(dt) {
    const d = D(), pop = this.popT >= 0 ? clamp(this.popT / POP, 0, 1) : 0;
    this.boostK += ((this.boostT > 0 ? 1 : 0) - this.boostK) * Math.min(1, dt * 5);
    this.drainK += ((this.nE > 0 && this.popT < 0 ? 1 : 0) - this.drainK) * Math.min(1, dt * 4);
    const R = this.popT >= 0 ? this.r : this.radius(), hy = this.ground > -Infinity ? this.pos.y - this.ground : R;
    const foot = hy < R ? Math.sqrt(R * R - hy * hy) : 0;
    // its last second: a gentle flicker (the owner's own end cue is the HUD gauge running out)
    const left = this.life - this.t, alpha = this.popT >= 0 ? 1 - pop * pop : left < 1.2 ? 0.75 + 0.25 * Math.cos(this.t * 16) : 1;
    this.look.update(dt, { t: this.t, r: R * (1 + pop * 0.08), c: this.pos, alpha: Math.min(1, this.t / 0.12) * alpha, pop, wob: 1, boost: this.boostK, drain: this.drainK, groundY: this.ground, foot });
  }
  // someone passing through the film: a dimple and a spreading ring where they crossed, a bloop and a chime
  _cross(a, inNow, p) {
    _n.copy(p).sub(this.pos); if (_n.lengthSq() < 1e-6) _n.set(0, 1, 0); _n.normalize();
    this.look.ripple(_n, inNow ? 1 : -1, 1);
    DRAIN_STATS.crossings++;
    const at = _f.copy(this.pos).addScaledVector(_n, this.radius());
    if (near(at, 30)) G.cues?.one('drainbow_cross', { at, owner: this.owner, team: this.team, kind: 'land', vol: a.isLocal ? 0.9 : 0.7, pitch: (inNow ? 1 : 0.84) * (0.97 + Math.random() * 0.06) });
    emit('drainbow:cross', { actor: a, bubble: this, inside: inNow });
  }
  // an enemy shot losing half its ink at the film point `at` (outward n): sparks, a fizz, a small ripple
  fizzle(at, n) {
    DRAIN_STATS.fizzles++;
    if (G.time - this.fizzT < 0.035) return;
    this.fizzT = G.time;
    this.look.ripple(n, 1, 0.35);
    if (!near(at, 40)) return;
    fizzle(at, n, G.teamColors[this.team]);
    G.cues?.one('drainbow_fizz', { at, owner: this.owner, team: this.team, kind: 'land', vol: 0.6 });
  }
  pop(reason = 'time') {
    if (this.popT >= 0 || this.dead) return;
    this.popT = 0; this.popReason = reason;
    refresh();
    // its time up (not splatted / lost): the film rains down as the owner's ink (the owner's screen paints; it replicates)
    if (!this.ghost && reason === 'time' && D().paintPop > 0) inkFoot(this.owner, this, D().paintPop, 10);
    DRAIN_STATS.pops++;
    if (near(this.pos, 60)) {
      popSpray(this.pos, this.r, G.teamColors[this.team], this.ground);
      G.cues?.one('drainbow_pop', { at: this.pos, owner: this.owner, team: this.team, kind: 'end', vol: 1 });
    }
    // a few ripples bursting out as it goes
    for (let k = 0; k < 3; k++) { const a = Math.random() * TAU; this.look.ripple(_n.set(Math.cos(a), 0.3 + Math.random() * 0.5, Math.sin(a)).normalize(), -1, 1); }
    emit('drainbow:pop', { bubble: this, reason });
  }
  dispose() {
    this.dead = true;
    const i = B.indexOf(this); if (i >= 0) B.splice(i, 1);
    refresh();
    this.look.dispose();
    this.in.clear();
  }
  // the minimap (specials.js drawMap: col its team's colour): its footprint in that colour, a rainbow rim turning
  drawMap(c, mm, tc, s, col, t) {
    if (this.popT >= 0) return;
    mm.toCanvas(this.pos.x, this.pos.z, tc);
    const r = Math.max(2, this.radius() * s);
    col = col || '#fff';
    c.globalAlpha = 0.24; c.fillStyle = col; c.beginPath(); c.arc(tc.x, tc.y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.lineWidth = 2.5;
    for (let k = 0; k < 6; k++) {
      c.strokeStyle = `hsl(${(k * 60 + t * 40) % 360} 90% 70%)`;
      c.beginPath(); c.arc(tc.x, tc.y, r, (k / 6) * TAU + t * 0.6, ((k + 1) / 6) * TAU + t * 0.6); c.stroke();
    }
    c.lineWidth = 1.5; c.strokeStyle = '#ffffff'; c.globalAlpha = 0.8; c.beginPath(); c.arc(tc.x, tc.y, r + 1.5, 0, TAU); c.stroke(); c.globalAlpha = 1;
  }
  // its hum (src/audio/cues.js gathers the specials' world: one positional loop while it stands)
  cueLoops(dir, o) {
    if (this.popT >= 0 || this.t < 0.3) return;
    dir._want(this, 'hum', 'drainbow_hum', { ...o, pos: this.pos, radius: this.r, range: 34, vol: 0.85, params: { boost: this.boostK } });
  }
}

// ================================================================================================ shots
const SHOT = Object.freeze({ dbw: 1 });
// a shot's step prev → pos: does it touch an enemy bubble? Flags obj.dbw (once) and fizzles at the film
function pass(obj, prev, pos, team) {
  for (const b of B) {
    if (!b.live || b.team === team) continue;
    const R = b.radius(), t = segSphere(prev, pos, b.pos, R);
    if (t < 0) continue;
    obj.dbw = 1;
    DRAIN_STATS.passes++;
    // (where it met the film; a shot fired from inside: where it's heading out)
    if (t > 0) _f.copy(prev).lerp(pos, t); else _f.copy(pos);
    _n.copy(_f).sub(b.pos); if (_n.lengthSq() < 1e-6) _n.set(0, 1, 0); _n.normalize();
    b.fizzle(_q.copy(b.pos).addScaledVector(_n, R), _n);
    return true;
  }
  return false;
}
// a beam m → m + dir·len (a charger's line to its victim): the flagged shot when it touches an enemy bubble, else null
function rayShot(m, dir, len, team) {
  _va.copy(m).addScaledVector(dir, len);
  const o = {};
  return pass(o, m, _va, team) ? SHOT : null;
}
// the damage that gets through (Projectiles.applyHit, the specials' continuous damage, the Tempest's rain)
function cut(attacker, victim, dmg, shot, from) {
  if (!(dmg > 0) || !attacker || !victim || !API.live) return dmg;
  const k = D().shotMul;
  if (shot && shot.dbw) { DRAIN_STATS.cuts++; return dmg * k; }
  chest(victim, _vc);
  for (const b of B) {
    if (!b.live || b.team === attacker.team) continue;
    const R = b.radius();
    let hit = _vc.distanceToSquared(b.pos) < R * R;
    if (!hit && !shot) hit = segSphere(from || chest(attacker, _va), _vc, b.pos, R) >= 0;
    if (!hit) continue;
    DRAIN_STATS.cuts++;
    // (no projectile to fizzle on its way: at the film between where it came from and them)
    if (!shot) {
      _n.copy(from || chest(attacker, _va)).sub(b.pos); if (_n.lengthSq() < 1e-6) _n.copy(_vc).sub(b.pos); if (_n.lengthSq() < 1e-6) _n.set(0, 1, 0); _n.normalize();
      b.fizzle(_q.copy(b.pos).addScaledVector(_n, R), _n);
    }
    return dmg * k;
  }
  return dmg;
}

// ================================================================================================ your screen
// One controller in the specials' world while there's a bubble (or the grey is still easing out): whether the local
// player is inside an enemy bubble → the wave, the grey, the muffle (DrainView), the drain loop under it all.
const VIEW = API.view = new DrainView();
let CTL = null;
class Ctl {
  constructor(sys) { this.sys = sys; this.kind = 'drainbowView'; this.k = 0; }
  update(dt) {
    const me = G.local, m = G.match;
    let at = null;
    if (me && me.alive && m && !m.attract && (m.state === 'playing' || m.state === 'intro')) {
      for (const b of B) if (b.live && b.team !== me.team && b.in.get(me)) { at = b; break; }
    }
    if (!!at !== VIEW.inside) {
      // the wave starts where you crossed (or where you are, when it popped round you)
      const b = at || this.last;
      if (me) chest(me, _p); else _p.set(0, 0, 0);
      if (b && b.live) { _n.copy(_p).sub(b.pos); if (_n.lengthSq() < 1e-6) _n.set(0, 1, 0); _n.normalize(); _p.copy(b.pos).addScaledVector(_n, b.radius()); }
      VIEW.set(!!at, _p);
    }
    if (at) this.last = at;
    VIEW.update(dt);
    this.k += ((at ? 1 : 0) - this.k) * Math.min(1, dt * 3);
    if (!B.length && !VIEW.active && this.k < 0.01) return false;
    return true;
  }
  cueLoops(dir) { if (this.k > 0.02) dir._want(this, 'drain', 'drainbow_drain', { twoD: true, vol: this.k * 0.9 }); }
  dispose() { VIEW.reset(); if (CTL === this) CTL = null; }
}
function ensureCtl(sys) {
  if (CTL && sys.world.includes(CTL)) return;
  CTL = new Ctl(sys);
  sys.world.push(CTL);
}

// ================================================================================================ the special
// set down at your feet (the floor under you; in the air over nothing: where you are)
function placeAt(a) {
  const d = D(), g = G.physics.raycast(_p.set(a.pos.x, a.pos.y + 0.4, a.pos.z), DOWN, 6, _hit, true);
  return new THREE.Vector3(a.pos.x, (g.hit ? g.point.y : a.pos.y) + d.lift, a.pos.z);
}
function build(sys, a, s, c, r, life, ghost) {
  const b = new Drainbow(sys, a, c, r, life, ghost);
  sys.world.push(b);
  s.bubble = b; s.dur = b.life;
  ensureCtl(sys);
  emit('drainbow:place', { actor: a, bubble: b });
  return b;
}
registerSpecial('drainbow', {
  start(a, s) {
    s.free = true;   // (not holding the body or the weapon: actor / bots / camera treat you as unhindered)
    const d = s.def, c = placeAt(a);
    const b = build(this, a, s, c, d.radius, d.duration, false);
    b.gid = netId(a);
    if (d.paintFoot > 0) inkFoot(a, b, d.paintFoot);
    rec(a, [4, 'p', r2(c.x), r2(c.y), r2(c.z), r2(b.r), r2(b.life)]);
  },
  tick(a, s) { if (s.bubble) s.dur = s.bubble.life; },
  end(a, s, reason) {
    const b = s.bubble;
    if (!b) return;
    s.bubble = null;
    if (reason === 'splat' && !D().popOnOwnerSplat) { b.orphan = true; return; }   // (runs out on its own clock)
    b.pop(reason);
  },
  prompt(a, s) {
    const left = Math.max(0, Math.ceil((s.dur || 0) - s.t)), b = s.bubble;
    if (b && b.boostT > 0) return `Drainbow ${left}s — draining them keeps it up!`;
    return `Drainbow up · ${left}s — foes inside drain into your team`;
  },
}, {
  start(a, s) { s.free = true; },
  tick(a, s) { if (s.bubble) s.dur = s.bubble.life; },
  event(a, s, d) {
    if (d[1] === 'p' && !s.bubble) build(this, a, s, V(d, 2), d[5], d[6], true);
    else if (d[1] === 'x' && s.bubble) { s.bubble.life = d[2]; s.dur = d[2]; s.bubble.boostT = 0.6; }
  },
});

// ================================================================================================ bots
// pop it now? fight: a foe close with a teammate near (or ourselves low), a duel at mid range now and then;
// an objective: the zone / tower plans ask with fighting = true there (bots.js)
function botWants(a, dist) {
  const d = D(), reach = Math.min(13, Math.max(d.radius + 1.5, weaponRange(a.weapon || {}) + 1.5));
  if (!(dist < reach + 3)) return false;
  // (the fight is here: the target within its weapon's reach — it'll fight from inside; or low on ink / hurt and close)
  return dist < reach || a.ink < 25 || a.hp < 60;
}

// a splash of the owner's ink over `k` of its footprint (special ink: turf, never meter): set down, and its film raining
// down when its time runs out
function inkFoot(a, b, k, n = 7) {
  if (!(b.ground > -Infinity) || !G.paint) return;
  const hy = b.pos.y - b.ground, foot = Math.sqrt(Math.max(0, b.r * b.r - hy * hy)) * k;
  if (foot < 0.5) return;
  let area = G.paint.splat(_p.set(b.pos.x, b.ground + 0.1, b.pos.z), foot * 0.55, b.team, { seed: Math.random() });
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + Math.random() * 0.4, r = foot * (0.55 + Math.random() * 0.3);
    const g = G.physics.raycast(_p.set(b.pos.x + Math.cos(ang) * r, b.pos.y, b.pos.z + Math.sin(ang) * r), DOWN, b.r + 2, _hit, true);
    if (g.hit) area += G.paint.splat(_q.copy(g.point).setY(g.point.y + 0.1), foot * (0.3 + Math.random() * 0.12), b.team, { seed: Math.random() });
  }
  a.addTurfNoSpecial?.(area);
}

// a bot fighting near its team's bubble: hold inside it (slide along the film rather than step out; come back in from
// just outside) while its target is within its reach of the bubble — enemy fire from outside is halved in there
// (botSpecials.js SpecialSense.act, after the danger checks; move is the bot's wanted step)
function botHold(b, move) {
  const a = b.a, d = D(), T = b.target;
  if (!d.botHold || !a.alive || b.mode !== 'fight' || !T || !T.alive) return;
  let w = null, bd = 1e9;
  for (const x of B) { if (!x.live || x.team !== a.team) continue; const h = Math.hypot(a.pos.x - x.pos.x, a.pos.z - x.pos.z); if (h < bd) { bd = h; w = x; } }
  if (!w) return;
  const R = w.radius(), dy = a.pos.y + 0.9 - w.pos.y;
  if (Math.abs(dy) > R - 0.5) return;
  const foot = Math.sqrt(R * R - dy * dy);
  if (bd > foot + 4) return;
  if (Math.hypot(T.pos.x - w.pos.x, T.pos.z - w.pos.z) > foot + weaponRange(a.weapon || {}) + 1) return;   // (the fight's out of reach from in there)
  const ux = bd > 1e-3 ? (a.pos.x - w.pos.x) / bd : 0, uz = bd > 1e-3 ? (a.pos.z - w.pos.z) / bd : 0;
  const out = move.x * ux + move.z * uz;
  if (bd < foot - 0.9) {
    if (out > 0 && bd > foot - 1.8) { move.x -= ux * out; move.z -= uz * out; }   // (along the film, not out of it)
  } else {
    move.x -= ux * (Math.max(0, out) + 0.8); move.z -= uz * (Math.max(0, out) + 0.8);   // (back in)
    const l = Math.hypot(move.x, move.z); if (l > 1) { move.x /= l; move.z /= l; }
  }
  DRAIN_STATS.holds++;
}

// ================================================================================================ registration
SPECIAL_START.drainbow = 'drainbow_blow';   // (cues.js plays it as the special starts, for everyone)
SPECIAL_ICONS.drainbow = (() => {
  const K = '#15121c';
  return `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="currentColor" fill-opacity=".2" stroke="${K}" stroke-width="7.5"/>
    <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" stroke-width="3"/>
    <g fill="none" stroke-linecap="round">
      <path d="M13.5 37 A18.5 18.5 0 0 1 50.5 37" stroke="${K}" stroke-width="13.5"/>
      <path d="M13.5 37 A18.5 18.5 0 0 1 50.5 37" stroke="#ff6f91" stroke-width="3.2"/>
      <path d="M17.1 37 A14.9 14.9 0 0 1 46.9 37" stroke="#ffd45c" stroke-width="3.2"/>
      <path d="M20.7 37 A11.3 11.3 0 0 1 43.3 37" stroke="#5fe0ff" stroke-width="3.2"/>
    </g>
    <path d="M32 31.5 C35.5 37 39 40.5 39 45 C39 49 35.9 52 32 52 C28.1 52 25 49 25 45 C25 40.5 28.5 37 32 31.5 Z" fill="currentColor" stroke="${K}" stroke-width="3"/>
    <path d="M28.6 45.5 Q28.8 42.4 31 40.6" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M12 24 Q16 13 27 9.5" stroke="#fff" stroke-opacity=".85" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <circle cx="49.5" cy="46.5" r="2.3" fill="#fff" fill-opacity=".8"/>
  </svg>`;
})();
// (a new match / stage: SpecialSystem.clear() disposes the world — the bubbles and the view's controller, which resets it)
