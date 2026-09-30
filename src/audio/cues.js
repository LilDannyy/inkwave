// INKWAVE — the sub and special cue director (the sfx-cues job). Every sub and special can be followed by ear:
//
//   G.cues.sub(kind, phase, o)       a sub's one-shot at a phase: 'throw' · 'land' · 'warn' · 'boom' · 'end' · 'beep' ·
//                                    'use' (sounds per kind: SUB_CUE). o: { owner, team, at, vol, pitch, radius, target }
//   G.cues.one(name, o)              any cue one-shot with the mix rules (o.kind: throw | land | warn | boom | end | start)
//   G.cues.update(dt, { quiet })     per frame (main.js): the loops — gathered from the world, capped, reconciled
//   G.cues.clear()                   stop every cue loop (a match change does this by itself)
//
// Loops: every moving / live thing (a thrown sub in the air, a rolling Splat Bomb, a Skitter Bomb, a twister, a
// Tempest cloud, a Kraken, a Crab Rig, an Ink Jet …) holds exactly ONE positional loop per channel, keyed by the object,
// following it every frame. Each frame the director gathers what the world holds now (Projectiles.bombs / clouds,
// SubSystem.items, the kit subs' lists, SpecialSystem.world, the actors' running specials) and reconciles its loops
// against that: whatever is gone — dead, cleared, a quit, a new match — loses its loop that same frame, so nothing
// orphans. Loops run through the engine's loop bus, so a pause (audio.pauseLoops) hushes them with everything else.
//
// Mix rules:
//   - relation to you: own (you threw / started it) · ally (your team) · foe · none (the menus' backdrop match).
//     Your own throws and starts come from you (no position); your own transformation specials' body loops too.
//   - gains (MIX): foe ~1.1, ally ~0.8, own ~0.85 (warnings: foe 1.15, own 0.6, ally 0.55), backdrop ~0.4. Warnings
//     carry params.foe (1 = the harsher, brighter timbre for the enemy's) and, for the enemy's, a boost up to ×1.55 the
//     closer you are to its blast (and when it's after you) — never louder than the blast it warns of. An enemy warning
//     with you close to it dips the music a little (a big one — Slam, Strike, Cheer Orb, Howl Box, Stamp, Kraken dive —
//     a little more), so it stands out.
//   - audible in a fight (the realflow measurement, tools/botlab/sfx/realflow.cjs): cues carry further than ordinary
//     sounds (REF: the panner's reference distance, 5–6 m instead of 3), and LEVEL lifts the cues that measured weak
//     against the weapon fire and the music in a real match (dB per sound).
//   - caps: at most MAX.move moving loops and MAX.warn warning loops at once (the backdrop: fewer); the rest wait,
//     ranked warnings first, the enemy's first, then by closeness (distance to the listener, and to you for threats).
//   - Doppler-ish: each positional loop's pitch × 1 / (1 − v_r / 55) (clamped 0.84 … 1.22) and level × (1 + v_r / 40)
//     (0.85 … 1.25), v_r = its own speed toward the listener (the camera), smoothed. Only the source's motion counts:
//     swinging the camera round (the listener moving) never makes a standing sprinkler warble.
import { G, on, clamp } from '../core/ctx.js';
import { SUBS, SPECIALS } from '../config.js';
import { SUB_KITS } from '../game/kits/registry.js';

export const MAX = { move: 8, warn: 5, moveMenu: 3, warnMenu: 2 };
const C_EFF = 55;                // m/s: the "speed of sound" the Doppler factor uses (exaggerated so a pass-by reads)
const RANGE = { move: 42, warn: 55, one: { throw: 40, land: 40, warn: 55, boom: Infinity, end: 40, start: 45, beep: 32, use: 30 } };
export const MIX = {
  throw: { own: 0.75, ally: 0.8, foe: 1.1, none: 0.45 },
  start: { own: 0.9, ally: 0.8, foe: 1.1, none: 0.5 },
  land: { own: 0.85, ally: 0.8, foe: 1.1, none: 0.45 },
  beep: { own: 0.85, ally: 0.8, foe: 1.2, none: 0.4 },
  use: { own: 0.8, ally: 0.8, foe: 0.6, none: 0.4 },
  boom: { own: 0.85, ally: 0.75, foe: 1, none: 0.5 },
  end: { own: 0.8, ally: 0.8, foe: 0.9, none: 0.45 },
  move: { own: 1, ally: 0.9, foe: 1.05, none: 0.45 },
  warn: { own: 0.75, ally: 0.7, foe: 1.15, none: 0.35 },
};
// the panner's reference distance per cue class (m): full level inside it, the inverse roll-off beyond. Ordinary sounds
// use 3; cues carry further so a throw 10 m off, a fuse 6 m off, a jet across the lane are heard over a fight and the
// music (blasts keep their own: they're loud already)
export const REF = { throw: 5, start: 5, land: 5, beep: 5, use: 5, end: 5, move: 5, warn: 6 };
// per-sound level (dB) on top of the mix: measured in a real match from the local player's view (realflow.cjs) —
// each cue against the weapon fire and the music around it, lifted where it was buried, trimmed where it was harsh
export const LEVEL = {
  bomb_throw: 2, throw_burst: 9, throw_seeker: 10.5, throw_scan: 7, throw_sprinkler: 6, throw_shaker: 15, throw_waddle: 8, torpedo_throw: 2, tracer_zap: 3,
  boomerang_throw: 10, sub_fly: 2.5, bomb_beep: 4.5, seeker_land: 7.5, waddle_land: 2.5, waddle_beep: 10, boomerang_tick: 3, orb_land: -4.5, torpedo_transform: 3,
  fuse_sticky: -4.5, lock_tone: 1.5, seeker_run: 2, shaker_rattle: 5, torpedo_whirr: 3, boomerang_whirr: 5.5, boomerang_orbit: 4, slam_warn: 1.5,
  strike_mark: -4, orb_fuse: -1.5, orb_fly: 1.5, twister: 5, beam_lock: 1, curtain_drip: 8, tracer_hum: 4, strike_arm: 11, zooka_arm: 1.5,
  shell_whistle: 5, kraken_dive: 4, storm_rain: 6,
  crab_boot: 4.5, crab_move: 2, crab_roll: 2, zip_whizz: 3, zip_aura: 2, wail_hold: 4, strike_aim: 3, barrage_drum: 3, shield_hum: 2,
  sonar_blip: 6, blower_start: 1, jet_ignite: 1, kraken_off: 3, storm_fade: 2, vortex_end: 6, jet_boost: 2,
};
const lv = (name) => { const d = LEVEL[name]; return d ? Math.pow(10, d / 20) : 1; };
// a sub's one-shots by phase: [sound, volume]
export const SUB_CUE = {
  bomb: { throw: ['bomb_throw', 0.8], land: ['bomb_beep', 0.7], boom: ['bomb_explode', 1] },
  sticky: { throw: ['throw_sticky', 0.9], land: ['sticky_stick', 0.9], boom: ['sticky_explode', 1] },
  burst: { throw: ['throw_burst', 0.9], boom: ['pellet_pop', 1] },
  seeker: { throw: ['throw_seeker', 0.9], land: ['seeker_land', 0.9], boom: ['seeker_explode', 1] },
  scan: { throw: ['throw_scan', 0.9], boom: ['scan_burst', 0.9] },
  curtain: { throw: ['throw_curtain', 0.9], land: ['curtain_up', 0.9], end: ['curtain_down', 0.9] },
  sprinkler: { throw: ['throw_sprinkler', 0.9], land: ['sprinkler_stick', 0.9], end: ['sprinkler_break', 0.9] },
  mine: { throw: ['place_mine', 0.8], warn: ['mine_trip', 1], boom: ['mine_explode', 0.9] },
  beacon: { throw: ['place_beacon', 0.85], end: ['beacon_break', 0.9], use: ['beacon_use', 0.8] },
  mist: { throw: ['throw_mist', 0.9], boom: ['mist_burst', 0.9] },
  shaker: { throw: ['throw_shaker', 0.9], land: ['shaker_land', 0.9], boom: ['shaker_blast', 0.95] },
  waddle: { throw: ['throw_waddle', 0.9], beep: ['waddle_beep', 0.8], boom: ['waddle_explode', 1], end: ['waddle_pop', 0.9] },
  torpedo: { throw: ['torpedo_throw', 1], boom: ['torpedo_burst', 1] },
  boomerang: { beep: ['boomerang_tick', 0.8], boom: ['boomerang_blast', 1] },
  smash: { end: ['sub_smash', 0.9] },   // a device the Mega Stamp's guard smashed before it went off
};
// a special's start (on top of the shared special_activate); the ones missing here start with their own sound already
export const SPECIAL_START = { slam: 'slam_leap', storm: 'storm_throw', barrage: 'barrage_start', strike: 'strike_arm', zooka: 'zooka_arm', wail: 'wail_up',
  blower: 'blower_start', jetpack: 'jet_ignite', stamp: 'stamp_start', zipcaster: 'zip_cloak', crab: 'crab_boot' };
// pitch of the in-flight whoosh (sub_fly) per thrown kind
const FLY_PITCH = { bomb: 1, sticky: 0.85, burst: 1.5, seeker: 1.15, scan: 1.35, curtain: 0.7, sprinkler: 1.25, mist: 0.8, waddle: 1.05, storm: 0.6 };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const hs = (v) => (v ? Math.hypot(v.x, v.z) : 0);
const _ids = new WeakMap(); let _nid = 0;
const idOf = (o) => { let n = _ids.get(o); if (!n) _ids.set(o, (n = ++_nid)); return n; };

export class Cues {
  constructor() {
    this.slots = new Map();      // key → { key, sound, h, obj, ch, warn, rel, twoD, born, vol, pitch, dop, params, pos }
    this.tracks = new Map();     // key → { x, y, z, vx, vy, vz, ok } (the emitter's smoothed velocity, for the Doppler)
    this.want = [];
    this._keep = new Set();
    this._m = null;
    this._ccd = new WeakMap();   // Crab Rig specials → their mortar cooldown last frame (the reload cue)
    this._tracerEnd = new WeakMap();
    this._vanish = new Map();    // world objects whose disappearance has a sound (the vortex spinning down)
    this._sonarT = 0; this._duckT = -9;
    this.stats = { made: 0, stopped: 0, capped: 0, maxMove: 0, maxWarn: 0 };
    on('special:start', ({ actor, id }) => this._start(actor, id));
    on('special:use', ({ actor, id }) => { if (id === 'slam' || id === 'storm') this._start(actor, id); });
    on('special:end', ({ actor, id, reason }) => { if (id === 'kraken' && actor?.alive && reason !== 'splat') this.one('kraken_off', { at: actor.pos, owner: actor, kind: 'end' }); });
    on('storm:end', ({ pos, team, actor }) => this.one('storm_fade', { at: pos, team, owner: actor, kind: 'end', range: 50 }));
  }

  // ------------------------------------------------------------------------------------------------ mix helpers
  _me() { const m = G.match; return m && !m.attract ? m.local || null : null; }
  rel(owner, team) {
    const me = this._me();
    if (!me) return 'none';
    if (owner && owner === me) return 'own';
    return (team ?? owner?.team) === me.team ? 'ally' : 'foe';
  }
  // how close YOU are to a threat's blast (0 … 1): full inside ~1.4 m of its middle, fading out ~2.2 × its radius away
  close(pos, R = 3) {
    const me = this._me();
    if (!me || !me.alive || !pos) return 0;
    const d = dist(me.pos, pos);
    return clamp((2.2 * R + 2 - d) / (1.6 * R + 2), 0, 1);
  }
  boost(pos, R, target) { return 1 + 0.35 * this.close(pos, R) + (target && target === this._me() ? 0.2 : 0); }

  // ------------------------------------------------------------------------------------------------ one-shots
  one(name, o = {}) {
    const A = G.audio;
    if (!A || !A.ctx || !name) return null;
    const kind = o.kind || 'boom', rel = this.rel(o.owner, o.team ?? o.owner?.team);
    let pos = o.at;
    if ((kind === 'throw' || kind === 'start') && rel === 'own') pos = undefined;   // your own throw / start comes from you
    if (pos && A.L) { const r = o.range ?? RANGE.one[kind] ?? 40; if (r !== Infinity && dist(A.L, pos) > r) return null; }
    let g = (o.vol ?? 1) * (MIX[kind] || MIX.boom)[rel];
    if ((kind === 'warn' || kind === 'beep') && rel === 'foe') {
      g *= this.boost(o.at, o.radius, o.target);
      if (kind === 'warn' && this.close(o.at, o.radius) > 0.35) this._dip(0.25);
    }
    return A.play(name, { pos, volume: g * lv(name), pitch: o.pitch, ref: pos ? REF[kind] : undefined });
  }
  sub(kind, phase, o = {}) {
    const c = SUB_CUE[kind]?.[phase] || (phase === 'end' ? SUB_CUE.smash.end : null);
    if (!c) return null;
    const k = phase === 'use' ? 'use' : phase === 'beep' ? 'beep' : phase;
    return this.one(c[0], { ...o, kind: k, vol: (o.vol ?? 1) * c[1], radius: o.radius ?? SUBS[kind]?.radius });
  }
  _start(a, id) {
    if (!a) return;
    const kind = SPECIALS[id]?.kind || id, name = SPECIAL_START[kind];
    if (!name) return;
    this.one(name, { at: a.pos, owner: a, kind: 'start' });
  }

  // ------------------------------------------------------------------------------------------------ loops
  // want a loop this frame: one per (object, channel)
  _want(obj, ch, sound, o) {
    const w = this.want[this._n] || (this.want[this._n] = {});
    this._n++;
    w.key = idOf(obj) + ':' + ch; w.obj = obj; w.ch = ch; w.sound = sound;
    w.pos = o.pos || null; w.twoD = !!o.twoD; w.team = o.team ?? o.owner?.team; w.owner = o.owner || null;
    w.warn = !!o.warn; w.vol = o.vol ?? 1; w.pitch = o.pitch ?? 1; w.params = o.params || null;
    w.radius = o.radius || 3; w.target = o.target || null; w.big = !!o.big; w.range = o.range || (w.warn ? RANGE.warn : RANGE.move);
    w.prio = o.prio || 1;
    return w;
  }

  update(dt, opts = {}) {
    const A = G.audio;
    if (!A || !A.ctx) return;
    if (G.match !== this._m) { this.clear(); this._m = G.match; }
    this._n = 0;
    const m = G.match;
    // (quiet: the online lobby's set covers the backdrop match — nothing of it is simulated or heard; and once a round
    // is over — time's up, the judge, the results — its devices go silent with it)
    if (m && !opts.quiet && (m.attract || m.state === 'playing' || m.state === 'intro')) this._gather(m, dt);
    this.want.length = this._n;
    this._reconcile(dt, m);
    this._vanished(m);
    this._sonar(dt);
  }

  // what the world holds now → this.want
  _gather(m, dt) {
    const me = this._me(), P = G.projectiles, S = G.subs, SP = G.specials, K = SUB_KITS;
    // ---- Splat Bombs (and the Ink Tempest's ball) — weapons.js
    for (const b of P?.bombs || []) {
      const o = { pos: b.pos, team: b.team, owner: b.owner };
      if (b.kind === 'storm') { this._want(b, 'fly', 'sub_fly', { ...o, pitch: FLY_PITCH.storm, vol: 1 }); continue; }
      if (!(b.fuse >= 0)) { this._want(b, 'fly', 'sub_fly', { ...o, pitch: FLY_PITCH.bomb, vol: 0.9 }); continue; }
      this._want(b, 'fuse', 'fuse_bomb', { ...o, warn: true, radius: SUBS.bomb.radius,
        params: { k: clamp(1 - b.fuse / SUBS.bomb.fuse, 0, 1), roll: clamp((hs(b.vel) - 0.3) / 3.5, 0, 1) } });
    }
    // ---- Ink Tempest clouds
    for (const c of P?.clouds || []) {
      const fade = clamp((c.dur - c.t) / 0.6, 0, 1);
      this._want(c, 'rain', 'storm_rain', { pos: c.group.position, team: c.team, owner: c.owner, vol: 0.6 * fade, radius: SPECIALS.storm.radius, range: 50, prio: 1.5 });
    }
    // ---- the built-in subs — subs.js
    for (const it of S?.items || []) {
      const o = { pos: it.pos, team: it.team, owner: it.owner };
      switch (it.state) {
        case 'fly': this._want(it, 'fly', 'sub_fly', { ...o, pitch: FLY_PITCH[it.kind] || 1, vol: 0.85 }); break;
        case 'stuck': this._want(it, 'fuse', 'fuse_sticky', { ...o, warn: true, radius: it.sub.radius, params: { k: clamp(it.t / (it.fuse || 1), 0, 1) } }); break;
        case 'run': this._want(it, 'run', 'seeker_run', { ...o, warn: true, radius: it.sub.radius, target: it.target,
          params: { speed: 1, dash: it.dash ? 1 : 0, hunt: me && it.target === me ? 1 : 0 } }); break;
        case 'mist': this._want(it, 'mist', 'mist_hiss', { ...o, radius: it.sub.radius, range: 32, params: { life: 1 - clamp((it.t - (it.sub.mistTime - 0.8)) / 0.8, 0, 1) } }); break;
        case 'curtain': this._want(it, 'curtain', 'curtain_drip', { ...o, range: 26, params: { life: clamp(it.hp / it.sub.hp, 0, 1) } }); break;
        case 'spray': this._want(it, 'spray', 'sprinkler_spin', { ...o, range: 26, params: { fast: it.t < it.sub.sprayFade ? 1 : 0 } }); break;
        case 'beacon': this._want(it, 'beacon', 'beacon_hum', { ...o, range: 16 }); break;
        // (the Lurk Mine is silent while it lurks — hidden; tripped, it plays mine_trip; the Echo Orb's cloud is a one-shot)
      }
    }
    // ---- kit subs — kits/*.js
    for (const it of K.shaker?.items || []) {
      if (it.state === 'dead') continue;
      const k = it.fuse >= 0 ? 1 - it.fuse / it.sub.fuse : it.next > 0 ? 1 - it.next / it.sub.gap : 0;
      // (a warning from the throw on: its first blast is only half a second after it lands)
      this._want(it, 'rattle', 'shaker_rattle', { pos: it.pos, team: it.team, owner: it.owner, warn: true, radius: it.sub.radius,
        params: { k: clamp(k, 0, 1), armed: it.armed ? 1 : 0 } });
    }
    for (const it of K.waddle?.items || []) {
      const o = { pos: it.pos, team: it.team, owner: it.owner };
      if (it.state === 'fly') this._want(it, 'fly', 'sub_fly', { ...o, pitch: FLY_PITCH.waddle, vol: 0.85 });
      else if (it.state === 'wake' || it.state === 'walk') {
        const T = it.target && it.target.alive ? it.target : null;
        const cl = T ? clamp(1 - Math.hypot(T.pos.x - it.pos.x, T.pos.z - it.pos.z) / it.sub.senseRadius, 0, 1) : 0;
        this._want(it, 'walk', 'waddle_walk', { ...o, warn: true, radius: it.sub.radius, target: T, vol: 0.9, pitch: 1 + 0.45 * cl });
        if (me && T === me) this._want(it, 'hunt', 'hunt_alarm', { ...o, warn: true, radius: it.sub.radius, target: T, params: { close: cl } });
      }
    }
    for (const t of K.torpedo?._list || []) {
      if (t.state === 'dead') continue;
      const s = t.sub, o = { pos: t.pos, team: t.team, owner: t.owner };
      const lk = t.state === 'unfold' || t.state === 'launch';
      const p = t.state === 'launch' ? 1 + t.speed / 10 : t.state === 'unfold' ? 0.8 + 0.6 * clamp(t.t / s.unfoldTime, 0, 1) : 0.8;
      this._want(t, 'whirr', 'torpedo_whirr', { ...o, warn: lk, radius: s.radius, target: t.target, vol: lk ? 0.85 : 0.5, pitch: p });
      if (lk && me && t.target === me) {
        const k = t.state === 'unfold' ? 0.3 * clamp(t.t / s.unfoldTime, 0, 1) : 0.3 + 0.7 * clamp(1 - dist(t.pos, me.pos) / s.lockRange, 0, 1);
        this._want(t, 'lock', 'lock_tone', { ...o, warn: true, radius: s.radius, target: me, params: { k } });
      }
    }
    for (const b of K.tracer?._bolts || []) {
      const o = { team: b.team, owner: b.owner };
      if (b.state === 'fly') this._want(b, 'hum', 'tracer_hum', { ...o, pos: b.pos, vol: 0.45, pitch: 1.15 });
      else if (b.pts?.length) {
        let t0 = this._tracerEnd.get(b); if (t0 == null) this._tracerEnd.set(b, (t0 = G.time));
        const k = clamp(1 - (G.time - t0) / (b.sub.trailLife || 1), 0, 1);
        if (k > 0.02) this._want(b, 'hum', 'tracer_hum', { ...o, pos: b.pts[Math.floor(b.pts.length / 2)].p, vol: 0.45 * k, pitch: 0.85 + 0.2 * k });
      }
    }
    for (const it of K.boomerang?._items || []) {
      const o = { pos: it.pos, team: it.team, owner: it.owner, radius: it.sub.radius };
      switch (it.state) {
        case 'out': this._want(it, 'spin', 'boomerang_whirr', { ...o, vol: 0.55, pitch: 1.15 }); break;
        case 'hover': this._want(it, 'spin', 'boomerang_whirr', { ...o, vol: 0.75, pitch: 1.35 }); break;
        case 'back': this._want(it, 'spin', 'boomerang_whirr', { ...o, vol: 0.6, pitch: 1.2 }); break;
        case 'orbit': this._want(it, 'spin', 'boomerang_orbit', { ...o, vol: 0.7, pitch: 1 }); break;
        case 'armed': this._want(it, 'spin', 'boomerang_whirr', { ...o, warn: true, radius: it.sub.hitRadius, target: it.victim, vol: 0.85, pitch: 1.6 }); break;
      }
    }
    // ---- specials' world objects — specials.js
    const vanish = this._vanishNow || (this._vanishNow = new Set()); vanish.clear();
    for (const w of SP?.world || []) {
      const o = { team: w.team, owner: w.owner };
      switch (w.kind) {
        case 'missile': this._want(w, 'mark', 'strike_mark', { ...o, pos: w.to, warn: true, big: true, radius: SPECIALS.strike.radius, range: 70, prio: 1.5,
          params: { k: clamp(w.t / w.flight, 0, 1) } }); break;
        case 'tornado': {
          const d = SPECIALS.strike, grow = Math.min(1, w.t / 0.4), fade = clamp((w.dur - w.t) / 0.6, 0, 1);
          this._want(w, 'vortex', 'tornado', { ...o, pos: w.pos, radius: d.radius, range: 50, vol: 0.8 * fade, pitch: 1 + 0.2 * grow, prio: 1.5 });
          vanish.add(w); this._vanish.set(w, { name: 'vortex_end', t: w.t, dur: w.dur, pos: w.pos, owner: w.owner, team: w.team });
          break;
        }
        case 'twister': this._want(w, 'tw', 'twister', { ...o, pos: w.pos, warn: true, radius: 1.2, vol: 1 }); break;
        case 'speaker':
          if (w.phase === 'charge') {
            if (me && this.rel(w.owner, w.team) === 'foe' && this._inBeam(w, me)) this._want(w, 'lock', 'beam_lock', { ...o, pos: w.pos, warn: true, big: true, radius: 3, target: me, params: { k: clamp(w.t / SPECIALS.wail.charge, 0, 1) } });
          } else if (w.phase === 'blast') this._want(w, 'blast', 'wail_blast', { ...o, pos: w.pos, warn: true, radius: 3, range: 70, vol: 1 });
          break;
        case 'bubble':
          if (!w.held && !w.dead) {
            const c = clamp((w.charge || 0) / SPECIALS.blower.popDamage, 0, 1);
            this._want(w, 'drift', 'bubble_drift', { ...o, pos: w.pos, warn: c > 0.25, radius: w.r * SPECIALS.blower.blastMul, range: 34, params: { charge: c } });
          }
          break;
        case 'stamp': this._want(w, 'fly', 'stamp_fly', { ...o, pos: w.pos, warn: true, big: true, radius: SPECIALS.stamp.throwRadius }); break;
        case 'shell': this._want(w, 'whistle', 'shell_whistle', { ...o, pos: w.pos, warn: true, radius: SPECIALS.crab.cannonRadius, params: { vy: w.vel.y } }); break;
        case 'orb':
          if (w.phase === 'fly') this._want(w, 'fly', 'orb_fly', { ...o, pos: w.pos, warn: true, big: true, radius: SPECIALS.booyah.radius });
          else if (w.phase === 'fuse') this._want(w, 'fuse', 'orb_fuse', { ...o, pos: w.pos, warn: true, big: true, radius: SPECIALS.booyah.radius, range: 70, prio: 1.5,
            params: { k: clamp(w.t / SPECIALS.booyah.fuse, 0, 1) } });
          break;
      }
    }
    this._vanishSeen = vanish;
    // ---- the actors' running specials (and Bubble Guard shields)
    for (const a of G.actors || []) {
      if (!a.alive) continue;
      const own2D = !!me && a === me;
      const o = { pos: a.pos, team: a.team, owner: a, twoD: own2D };
      if (a.status?.shield > 0) this._want(a, 'shield', 'shield_hum', { ...o, range: 28 });
      const s = a.specialActive;
      if (!s) continue;
      const hv = hs(a.vel);
      switch (s.kind || s.id) {
        case 'slam': {
          const d = SPECIALS.slam, ph = s.phase === 'rise' ? 0 : s.phase === 'hang' ? 1 : 2;
          const k = ph === 0 ? s.t / d.rise : ph === 1 ? s.t / d.hang : s.t / 0.25;
          this._want(a, 'slam', 'slam_warn', { ...o, warn: true, big: true, radius: d.radius, range: 60, params: { phase: ph, k: clamp(k, 0, 1) } });
          break;
        }
        case 'barrage': this._want(a, 'drum', 'barrage_drum', { ...o, range: 36 }); break;
        case 'strike': if (own2D && s.aiming) this._want(a, 'aim', 'strike_aim', { ...o, prio: 2 }); break;
        case 'wail': this._want(a, 'hold', 'wail_hold', { ...o, range: 30 }); break;
        case 'kraken': {
          this._want(a, 'body', 'kraken_move', { ...o, params: { speed: clamp(hv / s.def.speed, 0, 1) } });
          if (s.attack && !a.grounded) {
            const k = clamp((s.def.attackVel - a.vel.y) / (s.def.attackVel + 14), 0, 1);
            this._want(a, 'dive', 'kraken_dive', { ...o, warn: true, big: true, radius: s.def.radius, params: { k } });
          }
          break;
        }
        case 'blower': if (s.cur) this._want(a, 'inflate', 'blower_inflate', { ...o, vol: 0.85, pitch: 1 + clamp(s.curT / s.def.inflate, 0, 1) }); break;
        case 'jetpack': this._want(a, 'jet', 'jet_loop', { ...o, vol: 0.8, range: 50 }); break;
        case 'stamp': this._want(a, 'carry', 'stamp_carry', { ...o, params: { speed: clamp(hv / s.def.moveSpeed, 0, 1) } }); break;
        case 'booyah': if (!s.thrown) this._want(a, 'charge', 'booyah_charge', { ...o, vol: 0.75, pitch: 1 + clamp(s.charge || 0, 0, 1), range: 50 }); break;
        case 'zipcaster':
          this._want(a, 'aura', 'zip_aura', { ...o, range: 22 });
          if (s.zip) this._want(a, 'zip', 'zip_whizz', { ...o, pitch: 1 });
          break;
        case 'crab': {
          this._want(a, 'crab', s.roll ? 'crab_roll' : 'crab_move', { ...o, vol: Math.min(1, hv / (s.roll ? 6 : 2)) * 0.7, pitch: 0.8 + hv * 0.08, range: 45 });
          // the mortar reloaded: a "ka-chunk" others can hear (its owner's copy only: a ghost's cooldown doesn't run)
          if (!s.ghost && s.ccd != null) {
            const prev = this._ccd.get(s);
            if (prev != null && prev > 0 && s.ccd <= 0 && !s.roll) this.one('crab_reload', { at: a.pos, owner: a, kind: 'warn', radius: SPECIALS.crab.cannonRadius, range: 36 });
            this._ccd.set(s, s.ccd);
          }
          break;
        }
      }
    }
  }
  // are you inside a Howl Box's line (the beam's radius, a little extra)?
  _inBeam(w, e) {
    const mx = w.mouth || w.pos, d = w.dir;
    const px = e.pos.x - mx.x, py = e.pos.y + 0.8 - mx.y, pz = e.pos.z - mx.z;
    const along = px * d.x + py * d.y + pz * d.z;
    if (along < -0.5 || along > (w.range || 72)) return false;
    const ox = px - d.x * along, oy = py - d.y * along, oz = pz - d.z * along;
    return Math.hypot(ox, oy, oz) < (w.radius || 1.5) + 1.2;
  }

  _reconcile(dt, m) {
    const A = G.audio, want = this.want, L = A.L, me = this._me();
    const menu = !me, capM = menu ? MAX.moveMenu : MAX.move, capW = menu ? MAX.warnMenu : MAX.warn;
    // score: warnings first, the enemy's first, then the closest (to the listener; for threats, to you)
    for (const w of want) {
      w.rel = this.rel(w.owner, w.team);
      w.d = w.twoD || !w.pos ? 0 : dist(L, w.pos);
      w.cl = w.warn && w.rel === 'foe' ? this.close(w.pos, w.radius) : 0;
      const had = this.slots.has(w.key) ? 1.25 : 1;
      w.score = w.d > w.range ? -1 : (w.warn ? 4 : 1) * (w.rel === 'foe' ? 2 : 1) * (1 + 2 * w.cl) * w.prio * had * (w.twoD ? 10 : 1) / (1 + w.d / 12);
    }
    want.sort((a, b) => b.score - a.score);
    const keep = this._keep; keep.clear();
    let nm = 0, nw = 0;
    for (const w of want) {
      if (w.score < 0) continue;
      if (w.warn ? nw >= capW : nm >= capM) { this.stats.capped++; continue; }
      if (w.warn) nw++; else nm++;
      keep.add(w.key);
      // Doppler: the emitter's own velocity (smoothed), along the line from it to the listener
      let dop = 1, dv = 1;
      if (!w.twoD && w.pos) {
        let tr = this.tracks.get(w.key);
        if (!tr) this.tracks.set(w.key, (tr = { x: w.pos.x, y: w.pos.y, z: w.pos.z, vx: 0, vy: 0, vz: 0 }));
        else if (dt > 0) {
          let vx = (w.pos.x - tr.x) / dt, vy = (w.pos.y - tr.y) / dt, vz = (w.pos.z - tr.z) / dt;
          const sp = Math.hypot(vx, vy, vz);
          if (sp > 60) { vx = vy = vz = 0; }   // (a jump in position, not a speed)
          const k = 1 - Math.exp(-12 * dt);
          tr.vx += (vx - tr.vx) * k; tr.vy += (vy - tr.vy) * k; tr.vz += (vz - tr.vz) * k;
          tr.x = w.pos.x; tr.y = w.pos.y; tr.z = w.pos.z;
        }
        const dx = L.x - w.pos.x, dy = L.y - w.pos.y, dz = L.z - w.pos.z, dl = Math.hypot(dx, dy, dz);
        if (dl > 0.5) {
          const vr = (tr.vx * dx + tr.vy * dy + tr.vz * dz) / dl;   // + = coming closer
          dop = clamp(1 / (1 - clamp(vr, -40, 40) / C_EFF), 0.84, 1.22);
          dv = clamp(1 + vr / 40, 0.85, 1.25);
        }
      }
      let vol = w.vol * MIX[w.warn ? 'warn' : 'move'][w.rel] * dv;
      if (w.warn && w.rel === 'foe') vol *= 1 + 0.35 * w.cl + (w.target && w.target === me ? 0.2 : 0);
      vol = Math.min(vol, 1.6);
      const gain = vol * lv(w.sound);
      const params = w.params ? (w.warn ? { ...w.params, foe: w.rel === 'foe' || w.rel === 'none' ? 1 : 0 } : w.params) : (w.warn ? { foe: w.rel === 'foe' ? 1 : 0 } : null);
      const pitch = w.pitch * dop, pos = w.twoD ? undefined : w.pos;
      let s = this.slots.get(w.key);
      if (s && (!s.h.playing || s.sound !== w.sound || s.twoD !== w.twoD)) { s.h.stop(0.08); this.stats.stopped++; this.slots.delete(w.key); s = null; }
      if (!s) {
        const h = A.loop(w.sound, { pos, volume: gain, pitch, params, ref: pos ? (w.warn ? REF.warn : REF.move) : undefined });
        if (!h || !h.playing) continue;
        s = { key: w.key, sound: w.sound, h, twoD: w.twoD, born: G.time };
        this.slots.set(w.key, s); this.stats.made++;
      } else s.h.set({ pos, volume: gain, pitch, params });
      Object.assign(s, { obj: w.obj, ch: w.ch, warn: w.warn, rel: w.rel, vol, gain, pitch, dop, params, pos: w.pos, d: w.d, cl: w.cl, seen: G.time });
      // a big threat of the enemy's, inside its reach: the music dips a little while it lasts
      if (w.warn && w.rel === 'foe' && w.cl > 0.35) this._dip(w.big && w.cl > 0.5 ? 0.35 : 0.2);
    }
    this.stats.maxMove = Math.max(this.stats.maxMove, nm); this.stats.maxWarn = Math.max(this.stats.maxWarn, nw);
    for (const [k, s] of this.slots) if (!keep.has(k)) { s.h.stop(s.warn ? 0.06 : 0.15); this.slots.delete(k); this.stats.stopped++; }
    for (const k of this.tracks.keys()) if (!keep.has(k)) this.tracks.delete(k);
  }

  // world objects that just went away: the ones that ended on their own play their end (a clear / quit doesn't)
  _vanished(m) {
    const seen = this._vanishSeen;
    for (const [obj, v] of this._vanish) {
      if (seen && seen.has(obj)) continue;
      this._vanish.delete(obj);
      if (m && v.t >= v.dur - 0.1) this.one(v.name, { at: v.pos, owner: v.owner, team: v.team, kind: 'end', range: 50 });
    }
  }

  // revealed by an enemy Deep Sonar: a quiet blip every 2 s while it lasts
  _sonar(dt) {
    const me = this._me(), st = me?.status;
    if (me && me.alive && st && st.reveal > 0 && st.revealTeam !== me.team && !G.match?.paused) {
      if ((this._sonarT -= dt) <= 0) { this._sonarT = 2; G.audio.play('sonar_blip', { volume: 0.8 * lv('sonar_blip') }); }
    } else this._sonarT = 1.2;
  }

  // an enemy warning close to you: the music dips a little (rate-limited; a pause's own duck is never lifted by it)
  _dip(amount) {
    if (G.match?.paused || G.time - this._duckT < 0.3) return;
    this._duckT = G.time; G.audio?.duck?.(amount, 0.35);
  }

  clear() {
    for (const s of this.slots.values()) { s.h.stop(0.1); this.stats.stopped++; }
    this.slots.clear(); this.tracks.clear(); this._vanish.clear(); this._vanishSeen = null;
    this.want.length = 0;
  }
  // (tests / tools) the live cue loops: [{ key, sound, ch, warn, rel, vol, pitch, dop, params, obj, pos }]
  live() { return [...this.slots.values()].filter((s) => s.h.playing); }
}

export const cues = new Cues();
