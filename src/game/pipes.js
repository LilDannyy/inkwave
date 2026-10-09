// The pipe engine: Gulper Aquarium's Tubeway (tools/botlab/jobs/batch5/stages/aquarium/ENGINE.md, DESIGN.md §3). Clear
// pipes that suck you in at one mouth and pop you out at the other: two-way legs, one-way legs, and tidal one-way legs
// that reverse on the stage clock (extension E2). A stage module (src/game/stageMods.js, docs/STAGE-MODS.md): the
// layout's `pipes` key switches it on, and every hook it needs is one the registry already serves (no shared-file edit).
//
//   W = PipeNet (G.pipes, per world): the expanded network (src/world/pipes-data.js), the glass colliders (kind 'seg',
//       roof, hidden, never inked), the nav edges (type 'pipe'), the looks (src/fx/pipesFx.js), the minimap rule, the
//       device aprons (G.level.noPlace), the water volumes (the ride camera's grade), the bake switch.
//   R = StagePipes (match.pipes, per match): captures, rides, pops, touchdowns and cooldowns of the actors this screen
//       owns; the drawn rider on every other screen (from the owner's two records); the tide; the HUD; bots; camera.
//
// A ride is an actor state, a.pipe = { leg, k, dir, phase: 'suck'|'ride'|'pop', t0, T, u0, rebased, p0, v, … }, owned
// and simulated by the rider's own screen, like a super jump: the module owns the body while it sucks and rides
// (R.ownsBody), the glass and the damage guard keep the rider untouchable from the end of the suck to the touchdown of
// the pop (at most 0.8 s airborne), and the rider pops out on a short steerable arc. Online the owner records [0] at the
// capture and [1] at the pop (kit kind 'pipe', KIT_GHOSTS); every other screen draws the rider exactly on the path at
// the owner's timeline time from [0] (R.carryRemote), never extrapolating off the tube.
import * as THREE from 'three';
import { G, emit, on, clamp } from '../core/ctx.js';
import { PLAYER } from '../config.js';
import { SFX } from '../audio/audio.js';
import { registerStageMod } from './stageMods.js';
import { Level } from '../world/level.js';
import { registerReveal } from './reveal.js';
import { KIT_GHOSTS, netRec } from './kits/registry.js';
import { Hit } from './physics.js';
import { expandPipes, legAt, nearestOnLeg, pipeColliderDefs, tideAt, endIsIn, inWaterVol, polyDist, PIPE as PD } from '../world/pipes-data.js';
import { PipeLooks } from '../fx/pipesFx.js';
import { PipesHud } from '../ui/hud-pipes.js';
import { RideCam } from './pipesCam.js';

export const PIPES = {
  suck: 0.25,                          // s, can be hit
  capture: { r: 0.75, depth: 0.9, below: 0.3, above: 1.0, push: 0.5, cone: 45, hold: 0.08, window: 0.2 },
  pop: { out: 6.5, up: 6.0, highOut: 7.0, highUp: 8.5, start: 0.45, steer: 45, steerWin: 0.5, shieldMax: 0.8,
         upNozzle: { up: 10.5, side: 2.5 }, downNozzle: { down: 2.0 }, fan: 30, fanWin: 0.4 },
  cooldown: 2.5,                       // s after touchdown (data: pipes.cooldown, 1.5–4)
  chime: 1.0,                          // s before a pop: the exit's chime and faster pulse
  splat: 1.2,                          // m, the touchdown splat (addTurfNoSpecial)
  lane: 0.28,                          // m right of travel: opposite riders pass side by side
  carpMul: 0.8,                        // a carrier on a carp-open leg
  costRun: 6.0, costFixed: 2.0,        // nav: (suck + L/v + pop) × 6.0 m/s + 2.0
  popT: { level: 0.5, up: 0.6, down: 0.5 },
  refuseShow: 1.5,                     // s a refusal line stays up
  promptR: 2.5,                        // m: "Walk in to ride → …" within this of an open IN end, facing it
  apron: { deep: 2.0, wide: 2.4, land: 1.5 },   // the device aprons: the IN apron in front of each mouth, a disc on each landing
  bot: { seen: 20, ink: 8, bad: 60, badT: 5, push: 2.0, seenT: 3, seenR: 7,
         trip: 13, tripKelp: 20, tripR: 9, tripGain: 10, tripW: 1.7, tripWKelp: 2.4,   // (paint goals across a pipe: goalWeight)
         errand: 30, popLook: 12 },                                                                   // (the tide's errand: _errands)
};
export const REFUSE = {
  oneway: 'One way: this end is the exit',
  shut: 'Closed in this mode',
  tide: 'Closed: the Kelp Lines are turning',
  carp: "Can't ride with the Bazookarp",
  special: "Can't ride during a special",
  cooldown: 'Pipe cooldown',
  form: 'Swim in as a squid',
};

const UP = new THREE.Vector3(0, 1, 0);
// PAGEQ='pipestats' (any botlab harness): at the match's end the module prints its counters as console warnings, which
// match.cjs lists — the rides per leg and team, refusals, bots at mouths, deaths just after a touchdown (the camping metric)
const STATS_Q = typeof location !== 'undefined' && /[?&]pipestats\b/.test(location.search || '');
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = {}, _q2 = {};
const now = () => performance.now() / 1000;
const r3 = (v) => Math.round(v * 1000) / 1000;
const ease = (k) => k * k;

// ================================================================================================ level: the glass
// a box from a to b (w × h across): the pipe glass, built from W.extraColliders' defs ({ kind: 'seg', a, b, w, h, … })
Level.blockKind('seg', {
  build(b, d) {
    const a = _v.set(d.a[0], d.a[1], d.a[2]), e = _w.set(d.b[0], d.b[1], d.b[2]);
    const s = new THREE.Vector3().subVectors(e, a), L = s.length();
    s.multiplyScalar(1 / (L || 1));
    const side = Math.abs(s.y) > 0.999 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3().crossVectors(UP, s).normalize();
    const n = new THREE.Vector3().crossVectors(s, side).normalize();
    b.axes = [side, n, s];
    b.half.set(d.w / 2, d.h / 2, L / 2);
    b.center.addVectors(a, e).multiplyScalar(0.5);
    b.aligned = false;
  },
  mirror(d) { return { ...d, a: [-d.a[0], d.a[1], -d.a[2]], b: [-d.b[0], d.b[1], -d.b[2]] }; },
});
Level.blockField('pipe', (b, d) => { b.pipe = d.pipe | 0; b.camSkip = true; });
Level.blockField('glass', (b, d) => { b.glass = !!d.glass; });
// the stage's own glass and water (tanks, drums, the Arch Tanks): out of the AO trace; the ride camera passes through it
// while the rider is inside a water volume (the clamp then keeps the lens in that volume)
Level.blockField('bakeClear', (b) => { b.bakeClear = true; b.camSkip = true; });
// a solid housing a leg runs through (the Gulper Run's bronze heads): hollow to the ride camera in a water volume
Level.blockField('camHollow', (b) => { b.camSkip = true; });

// riders give their position away: a dot moving along the line on everyone's map, and bots locate them
registerReveal('pipe', (e) => !!(e.pipe || e.pipeNet));
// the owner's ride records → every other screen's drawn rider
KIT_GHOSTS.pipe = { ghost: (a, d) => G.match?.pipes?.net(a, d) };

// ================================================================================================ the world (W)
export function pipeColliders(layout) { return pipeColliderDefs(layout); }

export class PipeNet {
  static build(layout, scene, level) { const W = new PipeNet({ layout, data: layout.pipes }); if (!W.X) return null; if (level) W.attachLevel(level); if (scene) W.afterMeshes({ scene }); return W; }
  constructor(ctx) {
    this.ctx = ctx; this.layout = ctx.layout;
    this.X = expandPipes(ctx.layout);
    this.looks = null; this.level = null; this.nav = null;
    this._bake = null;
  }
  get legs() { return this.X.legs; }
  get ends() { return this.X.ends; }
  get label() { return this.X.label; }
  get enter() { return this.X.enter; }

  extraColliders() { return pipeColliderDefs(this.layout); }
  attachLevel(level) {
    this.level = level;
    // the landing / approach floors as built: the floor under each point (the pop region's floor may sit below the mouth's)
    for (const e of this.X.ends) {
      for (const p of [e.approach, e.land]) {
        const gy = level.groundHeight(p[0], p[2], e.floorY + 0.6);
        if (gy > -Infinity && gy > e.floorY - 3.6) p[1] = r3(gy);
      }
    }
    this.pieces = level.blocks.filter((b) => b.pipe).map((b) => b.id);
  }
  afterMeshes(o) {
    this.looks?.dispose();
    this.looks = new PipeLooks(o.scene, this);
  }
  // one directed spec per IN end → OUT end (a tidal leg: both directions, the closed one masked by R.navEdge)
  navEdges() { return this.navSpecs(); }
  navSpecs() {
    const out = [];
    for (const leg of this.X.legs) {
      for (const k of [0, 1]) {
        const from = leg.ends[k], to = leg.ends[1 - k];
        if (from.inWhen === 'never') continue;
        const popT = PIPES.popT[to.nozzle] ?? 0.5;
        const cost = (PIPES.suck + leg.len / leg.speed + popT) * PIPES.costRun + PIPES.costFixed;
        out.push({ a: from.approach, b: to.land, cost: +cost.toFixed(3), len: +leg.len.toFixed(2), type: 'pipe', key: leg.i * 2 + k, leg: leg.i, end: from.i, out: to.i });
      }
    }
    return out;
  }
  attachNav(nav) {
    this.nav = nav;
    this.edgeKeys = new Map();   // key → { from node, edge }
    for (const n of nav.nodes) for (const e of n.nb) if (e.type === 'pipe') this.edgeKeys.set(e.key, { from: n.id, e });
    this.navProblems = (nav.edgeProblems || []).filter((p) => p.spec?.type === 'pipe');
  }
  // the minimap's base raster leaves the glass out (the module draws the network itself)
  mapBlock(b) { return !b.pipe; }
  // device aprons (DECISIONS #24, LEAD-NOTES 2026-10-09): nothing is placed on a mouth's IN apron or a landing, nor on the
  // areas the stage lists (pipes.aprons: the spawn decks' stair landings)
  noPlace(p, r = 0) {
    const A = PIPES.apron;
    for (const e of this.X.ends) {
      const dy = p.y - e.floorY;
      if (dy < -0.6 || dy > 2.4) continue;
      const rx = p.x - e.pos[0], rz = p.z - e.pos[2], along = rx * e.out[0] + rz * e.out[2], side = -rx * e.out[2] + rz * e.out[0];
      if (along > -r && along < A.deep + r && Math.abs(side) < A.wide / 2 + r) return true;
      if (Math.hypot(p.x - e.land[0], p.z - e.land[2]) < A.land + r && Math.abs(p.y - e.land[1]) < 1.5) return true;
    }
    for (const a of this.X.aprons) {
      if (a.y && (p.y < a.y[0] || p.y > a.y[1])) continue;
      if (a.box ? p.x > a.box[0] - r && p.x < a.box[1] + r && p.z > a.box[2] - r && p.z < a.box[3] + r : polyDist(a.poly, p.x, p.z) <= r) return true;
    }
    return false;
  }
  // p inside one of the layout's water volumes (the ride camera's grade); callers pass the rider's centreline point
  inWater(p) { for (const v of this.X.water) if (inWaterVol(v, p.x, p.y, p.z)) return v; return null; }
  // bake-ao: the glass and the stage's bakeClear blocks leave the AO trace
  bakeMode(on) {
    const L = this.level;
    if (!L) return;
    if (on) { this._bake = []; for (const b of L.blocks) if ((b.pipe || b.bakeClear) && b.solid) { b.solid = false; this._bake.push(b); } }
    else if (this._bake) { for (const b of this._bake) b.solid = true; this._bake = null; }
  }
  dispose() { this.looks?.dispose(); this.looks = null; }
}

// ================================================================================================ the match (R)
export class StagePipes {
  static create(m, W, S) { if (!W || !W.X) return null; return new StagePipes(m, W, S); }

  constructor(m, W, S) {
    this.m = m; this.W = W; this.S = S; this.X = W.X;
    this.edgeTypes = ['pipe'];
    const X = this.X;
    this.legs = X.legs; this.ends = X.ends;
    // the mode's rules: 'off' (every leg shut, still drawn and solid), legs shut by id, legs a carrier may ride
    const rule = X.modes[m.mode];
    this.off = rule === 'off';
    const ids = (list) => new Set((list || []).flatMap((id) => this.legs.filter((l) => l.id === id || l.id === id + '~').map((l) => l.i)));
    this.modeShut = ids(rule && rule !== 'off' && rule !== 'open' ? rule.shut : null);
    this.carpOpen = ids(rule && typeof rule === 'object' ? rule.carp : null);
    // the regulation length (the tide holds in its last quietEnd s and in overtime): timed modes only
    this.regEnd = !m.practice && !m.attract && m.mode !== 'boss' && Number.isFinite(m.duration) ? m.duration : Infinity;
    this.tidal = this.legs.filter((l) => l.flip);
    this.tide = new Map();   // leg index → { dir, phase, … } (twins share their state: the same clock tick)
    this.nKeys = this.legs.length * 2;
    this.keyShut = new Uint8Array(this.nKeys);
    this.botX = null;
    this.lit = this.ends.map(() => ({ n: 0, team: 0, fast: false, by: null }));
    this.lastPop = new Float32Array(this.ends.length).fill(-1e9);
    this.cap = new Map();        // actor → { e, hist: [[dt, ok]…] } (intent-gated capture)
    this.refused = new Map();    // actor → { why, end, t }
    this.badKey = new Map();     // bot brain → Map(key → until)
    this.push = new Map();       // bot brain → { key, t }
    this.rides = 0; this.t = 0; this.clockT = 0;
    this.stats = { rides: {}, team: [0, 0], refusals: {}, pops: 0, aborts: 0, landings: [], flips: [], firstRides: 0 };
    for (const l of this.legs) this.stats.rides[l.id] = [0, 0, 0, 0];   // [A→B team 0, A→B team 1, B→A team 0, B→A team 1]
    this.events = [];            // (tests) [t, name, payload summary]
    for (const a of m.actors) { a.pipe = null; a.pipeCd = 0; a.pipeNet = false; }
    this.started = false;
    this._tideSync(S.clock.t, true);
    this.hudUi = m.attract ? null : new PipesHud(this);
    this.lastLand = new Map();   // actor → this.t of its last touchdown (the camping metric)
    Object.assign(this.stats, { deaths: 0, deathsAfterLand: 0, pushMax: 0, giveUps: 0, botRides: 0, playT: 0 });
    this.unsubs = [
      on('actor:removed', (e) => this._removed(e && e.actor)),
      on('splatted', (e) => { const v = e && e.victim; if (!v || !this.m.playing()) return; this.stats.deaths++; const lt = this.lastLand.get(v); if (lt !== undefined && this.t - lt < 2) { this.stats.deathsAfterLand++; const x = this.lastExit?.get(v); if (x !== undefined) { const pe = this.stats.perExit || (this.stats.perExit = {}); (pe[x] || (pe[x] = [0, 0]))[1]++; } } }),
    ];
    this.loops = new Map();      // actor → ride whoosh loop
    this.rideCam = new RideCam(this);
  }

  // ------------------------------------------------------------------------------------------------ the clock and tide
  get flowLeg() { return this.tidal[0] || null; }
  // the tide pill and banners: { dir: 'ab'|'ba', phase: 'run'|'warn'|'shut', left, next, n, up: bool } | null
  flow() {
    const L = this.flowLeg;
    if (!L) return null;
    const s = this.tide.get(L.i);
    return { dir: s.dir, phase: s.phase, left: s.left, next: s.next, n: s.n, up: s.dir === 'ab' };
  }
  _tideSync(t, silent) {
    const changed = [];
    for (const leg of this.tidal) {
      const s = tideAt(leg.flip, t, this.regEnd);
      const was = this.tide.get(leg.i);
      this.tide.set(leg.i, s);
      if (!was || silent) continue;
      if (was.dir !== s.dir) changed.push([leg, 'flip', s]);
      if (was.phase !== s.phase) {
        if (s.phase === 'warn') changed.push([leg, 'warn', s]);
        else if (s.phase === 'shut' && was.dir === s.dir) changed.push([leg, 'close', s]);
        else if (s.phase === 'run' && was.phase === 'shut') changed.push([leg, 'open', s]);
      }
    }
    this._keys();
    if (!silent) for (const [leg, phase, s] of changed) this._flowEvent(leg, phase, s);
  }
  _flowEvent(leg, phase, s) {
    const ev = { leg: leg.i, id: leg.id, phase, dir: s.dir, t: +this.S.clock.t.toFixed(2) };
    this.events.push(['pipe:flow', ev]);
    if (!leg.isTwin) this.stats.flips.push(ev);
    emit('pipe:flow', ev);
    this.W.looks?.setFlow(leg.i, s.dir, s.phase, phase);
    if (leg.isTwin || this.m.attract) return;   // (one cue for the pair)
    const au = G.audio;
    if (phase === 'warn') au?.play('pipe_hoot', { volume: 0.85 });
    else if (phase === 'close') for (const l of [leg, this.legs[leg.twin]]) au?.play('pipe_clunk', { pos: _v.fromArray(l.ends[s.dir === 'ab' ? 0 : 1].pos), volume: 0.9 });
    else if (phase === 'flip') au?.play('pipe_whump', { volume: 0.9 });
    this.hudUi?.flow(phase, s);
  }
  // which nav keys are shut now (mode, schedule): one bit per directed key; bots whose route uses a newly shut one replan
  _keys() {
    const prev = this._prevShut || (this._prevShut = new Uint8Array(this.nKeys));
    prev.set(this.keyShut);
    for (const leg of this.legs) for (const k of [0, 1]) this.keyShut[leg.i * 2 + k] = this.open(leg.ends[k]) ? 0 : 1;
    let newly = false;
    for (let i = 0; i < this.nKeys; i++) if (this.keyShut[i] && !prev[i]) newly = true;
    if (newly && G.nav) {
      for (const a of this.m.actors) {
        const b = a.bot;
        if (!b || !b.path) continue;
        for (let i = Math.max(1, b.pi | 0); i < b.path.length; i++) {
          const e = G.nav.edge(b.path[i - 1], b.path[i]);
          if (e && e.type === 'pipe' && this.keyShut[e.key]) { b.path = null; b.repath = 0; break; }
        }
      }
    }
  }
  // the end takes riders now: IN-ness (the tide), the mode, the tide's shut windows
  open(e) {
    if (this.off) return false;
    const leg = this.legs[e.leg];
    if (this.modeShut.has(leg.i)) return false;
    if (leg.flip) { const s = this.tide.get(leg.i); return endIsIn(e, s.dir) && s.phase !== 'shut'; }
    return e.inWhen !== 'never';
  }
  _isInNow(e) { const leg = this.legs[e.leg]; return leg.flip ? endIsIn(e, this.tide.get(leg.i).dir) : e.inWhen !== 'never'; }
  // '' | 'oneway' | 'shut' | 'carp' | 'special' | 'cooldown' | 'form' (the refusal string: REFUSE[why], 'tide' for 'shut' by the tide)
  canEnter(a, e) {
    if (!this._isInNow(e)) return 'oneway';
    if (!this.open(e)) return 'shut';
    if (a.carry && !this.carpOpen.has(e.leg)) return 'carp';
    if ((a.specialActive && !a.specialActive.free) || a.superJumpState || this.m.tower?.riderList?.includes(a)) return 'special';
    if (a.pipeCd > 0) return 'cooldown';
    if (this.X.enter === 'squid' && a.form !== 'squid') return 'form';
    return '';
  }
  _refuseText(why, e) {
    if (why === 'shut' && e && this.legs[e.leg].flip && !this.off && !this.modeShut.has(e.leg)) return REFUSE.tide;
    return REFUSE[why] || why;
  }
  seek(t) {
    this._tideSync(t, true);
    for (const leg of this.tidal) { const s = this.tide.get(leg.i); this.W.looks?.setFlow(leg.i, s.dir, s.phase, null); }
    const f = this.flowLeg && this.tide.get(this.flowLeg.i);
    if (f) this.hudUi?.seek(f);   // (inside the warning: the countdown line too, not only the red pill)
  }

  // ------------------------------------------------------------------------------------------------ per frame
  update(dt, t) {
    this.t += dt;
    this._tideSync(t, false);
    if (!this.started && this.m.state === 'playing') { this.started = true; this.hudUi?.start(); }
    if (this.m.state === 'playing') this.stats.playT += dt;
    if ((this._errT = (this._errT || 0) - dt) <= 0) { this._errT = 1; this._errands(); }
    if (STATS_Q && !this._reported && this.started && this.m.state !== 'playing' && this.m.state !== 'intro') { this._reported = true; this._report(); }
    // (the grade only while the ride camera runs: it sets it each frame from its lens)
    if (this.W.looks?.rideVol && !this.rideCam.st) { this.camInWater = false; this.W.looks.underwater(null); }
  }
  lateUpdate(dt) {
    const m = this.m;
    for (const a of m.actors) {
      const p = a.pipe;
      if (a.remote) continue;
      if (p) {
        if (!a.alive) { this._abort(a, 'splat'); continue; }
        if (p.phase === 'pop') this._popTick(a, p, dt);
        continue;
      }
      if (a.pipeCd > 0) a.pipeCd = Math.max(0, a.pipeCd - dt);
      if (a.alive && m.playing()) this._capture(a, dt);
    }
    // the looks (riders' glow, lit exits, fans, flaps, signs) and the HUD
    const L = this.W.looks;
    if (L) {
      const list = [], self = G.game?.rig?.target || G.local;
      for (const a of m.actors) {
        const p = a.pipe;
        if (!p || p.phase === 'pop' || !a.alive) continue;
        // (the glow is the telegraph for everyone else: on the rider's own screen, through its own ride camera, it is dimmed)
        list.push({ leg: p.leg, s: p.s ?? 0, team: a.team, dir: p.dir, x: a.pos.x, z: a.pos.z, on: (p.phase === 'ride' ? 1 : 0.4) * (a === self ? 0.35 : 1) });
      }
      L.setRiders(list);
      for (let i = 0; i < this.lit.length; i++) L.lightEnd(i, this.lit[i].n > 0 ? this.lit[i].team : -1, this.lit[i].fast);
      L.update(dt, this);
    }
    this._loopsTick();
  }

  // ------------------------------------------------------------------------------------------------ capture
  _capture(a, dt) {
    const C = PIPES.capture, squid = a.form === 'squid', cy = a.pos.y + (squid ? 0.3 : 0.5);
    let hit = null;
    for (const e of this.ends) {
      const rx = a.pos.x - e.pos[0], rz = a.pos.z - e.pos[2];
      if (rx * rx + rz * rz > 4) continue;
      const along = rx * e.out[0] + rz * e.out[2];
      if (along < -0.05 || along > C.depth) continue;
      const lx = rx - e.out[0] * along, lz = rz - e.out[2] * along, ly = cy - e.pos[1];
      if (lx * lx + lz * lz + ly * ly > C.r * C.r) continue;
      const fy = a.pos.y - e.floorY;
      if (fy < -C.below || fy > C.above) continue;
      hit = e; break;
    }
    let c = this.cap.get(a);
    if (!hit) { if (c) c.hist.length = 0; return; }
    if (!c) this.cap.set(a, (c = { e: -1, hist: [] }));
    if (c.e !== hit.i) { c.e = hit.i; c.hist.length = 0; }
    const mv = a.intent.move, mm = Math.hypot(mv.x, mv.z);
    const ok = mm >= C.push && -(mv.x * hit.out[0] + mv.z * hit.out[2]) / mm >= Math.cos((C.cone * Math.PI) / 180);
    c.hist.push([dt, ok]);
    let tot = 0; for (let i = c.hist.length - 1; i >= 0; i--) { tot += c.hist[i][0]; if (tot > C.window) { c.hist.splice(0, i); break; } }
    let held = 0; for (const [d, k] of c.hist) if (k) held += d;
    if (held + 1e-6 < C.hold) return;
    const why = this.canEnter(a, hit);
    c.hist.length = 0;
    if (why) { this._refuse(a, hit, why); return; }
    this._start(a, hit);
  }
  _refuse(a, e, why) {
    const r = this.refused.get(a), t = this.t;
    if (r && r.end === e.i && r.why === why && t - r.t < PIPES.refuseShow) return;
    this.refused.set(a, { why, end: e.i, t, text: this._refuseText(why, e) });
    this.stats.refusals[why] = (this.stats.refusals[why] || 0) + 1;
    this.events.push(['pipe:refuse', { end: e.i, why }]);
    emit('pipe:refuse', { actor: a, end: e.i, why });
    if (a.bot) this._markBad(a.bot, e);
    if (a.isLocal || this._near(a.pos, 14)) G.audio?.play('pipe_tok', { pos: _v.fromArray(e.pos), volume: 0.8 });
    this.W.looks?.rattle(e.i);
  }
  _near(p, r) { const c = G.camera?.position; return !!c && c.distanceTo(p) < r; }

  // start a ride from end e now (owner side). opts.u0: a re-based ride (an adopted one: no suck), opts.t0
  _start(a, e, opts = {}) {
    const leg = this.legs[e.leg], dir = e.k === 0 ? 1 : -1, exit = leg.ends[1 - e.k];
    const carp = !!a.carry && this.carpOpen.has(leg.i);
    a.weaponRunner?.reset?.();
    const it = a.intent; it.fire = it.sub = it.special = it.jump = false;
    if (a._prevIntent) { a._prevIntent.sub = false; a._prevIntent.fire = false; }
    a.fireBuffer = 0; a.jumpBuffer = 0;
    a.form = 'squid'; a.climbing = false;
    const rebased = (opts.u0 || 0) > 0 || !!opts.noSuck;
    const p = { leg: leg.i, k: e.k, dir, phase: rebased ? 'ride' : 'suck', t0: opts.t0 ?? now(), T: 0, u0: opts.u0 || 0, rebased, p0: a.pos.clone(),
      v: leg.speed * (carp ? PIPES.carpMul : 1), steerX: 0, steerZ: 0, steerOn: false, high: false, chimed: false, lit: false,
      entry: e.i, exit: exit.i, remote: false, owner: a.owner, s: dir > 0 ? opts.u0 || 0 : leg.len - (opts.u0 || 0), u: opts.u0 || 0, camYaw: null };
    a.pipe = p; a.pipeNet = true;
    netRec(a, 'pipe', [0, leg.i, e.k, r3(p.t0), r3(p.u0)]);
    if (!rebased) {
      this.stats.rides[leg.id][(dir > 0 ? 0 : 2) + (a.team ? 1 : 0)]++;
      this.stats.team[a.team ? 1 : 0]++;
      if (leg.flip) { const n = this.tide.get(leg.i)?.n ?? 0, kp = this.stats.kelpPhase || (this.stats.kelpPhase = []); (kp[n] || (kp[n] = [0, 0]))[a.team ? 1 : 0]++; }
      this.rides++;
      if (a.isLocal) { this.stats.firstRides++; this.myRides = (this.myRides || 0) + 1; }
      if (a.bot && this._errandKey(a.bot) === leg.i * 2 + e.k) this.stats.errandRides = (this.stats.errandRides || 0) + 1;
      if (a.bot) { this.stats.botRides++; const pp = this.push.get(a.bot); if (pp) { if (G.time - pp.last < 0.5) this.stats.pushMax = Math.max(this.stats.pushMax, G.time - pp.t0); this.push.delete(a.bot); } }   // (a push record left over from an earlier visit is not this push)
      G.audio?.play('pipe_suck', { pos: _v.fromArray(e.pos), volume: a.isLocal ? 0.9 : 0.6 });
    } else this._light(p, a);
    this.events.push(['pipe:enter', { nid: a.nid, leg: leg.i, k: e.k, rebased }]);
    emit('pipe:enter', { actor: a, leg: leg.i, k: e.k, to: exit.i, eta: this._eta(p) });
  }
  // seconds from the ride's start (its time base) to the pop
  _popAt(p) { return (p.rebased ? 0 : PIPES.suck) + (this.legs[p.leg].len - p.u0) / p.v; }
  _eta(p) { return Math.max(0, this._popAt(p) - this._T(p)); }
  // the ride's time base: the owner's performance clock online (its records are stamped with it), the frame time offline;
  // a proxy reads its owner's playback clock
  _T(p) {
    if (p.remote) { const peer = G.netm?._peer?.(p.owner); return peer && peer.tr !== undefined && !p.proj ? peer.tr - p.t0 : p.T; }
    return G.netm ? now() - p.t0 : p.T;
  }

  // ------------------------------------------------------------------------------------------------ the ride (owner)
  // R.ownsBody (Actor.update, right after the dead branch): true while the module moves the actor (suck, ride); in the pop
  // phase the actor's own physics runs with fire / sub / special forced off
  ownsBody(a, dt) {
    const p = a.pipe;
    if (!p || p.remote) return false;
    if (p.phase === 'pop') {
      const it = a.intent; it.fire = it.sub = it.special = false;
      if (a._prevIntent) a._prevIntent.sub = false;
      a.fireBuffer = 0;
      p.popT += dt;
      return false;
    }
    p.T += dt;
    this._statusTick(a, dt);
    a.invuln = Math.max(0, a.invuln - dt);
    this._place(a, p, this._T(p), dt, true);
    return true;
  }
  ride(a, dt) { return this.ownsBody(a, dt); }
  // set the rider's pose on its path at ride time T (owner and proxies alike); own = this screen simulates it
  _place(a, p, T, dt, own) {
    const leg = this.legs[p.leg], L = leg.len;
    if (p.phase === 'suck') {
      const k = clamp(T / PIPES.suck, 0, 1), e = this.ends[p.entry], m = _w.set(e.pos[0], e.pos[1] - 0.3, e.pos[2]);
      a.pos.copy(p.p0).lerp(m, ease(k));
      a.vel.subVectors(m, p.p0).multiplyScalar(2 * k / PIPES.suck);
      this._pose(a, k, 0, null);
      p.s = p.dir > 0 ? 0 : L;
      if (T >= PIPES.suck) { p.phase = 'ride'; this._light(p, a); }
      else { this._noBody(a); return; }
    }
    // the ride: constant speed along the centreline, 0.28 m right of travel, the body on the axis (feet 0.3 m below it)
    const u = Math.min(L, p.rebased ? p.u0 + T * p.v : p.u0 + Math.max(0, T - PIPES.suck) * p.v);
    p.u = u;
    const s = p.dir > 0 ? u : L - u;
    p.s = s;
    legAt(leg, s, _q);
    const tx = _q.tx * p.dir, ty = _q.ty * p.dir, tz = _q.tz * p.dir;
    const lane = PIPES.lane * p.dir;
    a.pos.set(_q.x + _q.sx * lane, _q.y - 0.3, _q.z + _q.sz * lane);
    a.vel.set(tx * p.v, ty * p.v, tz * p.v);
    if (Math.hypot(tx, tz) > 0.3) { a.yaw = Math.atan2(tx, tz); p.camYaw = a.yaw; }
    a.yawVel = 0;
    this._pose(a, 1, -Math.asin(clamp(ty, -1, 1)), null);
    this._noBody(a);
    const left = (L - u) / p.v;
    // the steer window: the move input held in the last 0.5 s picks the pop heading (±45°), jump held a high pop
    if (own && left <= PIPES.pop.steerWin) {
      if (a.bot && !p.botAimed) { p.botAimed = true; this._botPop(a, p); }
      const mv = a.intent.move, mm = Math.hypot(mv.x, mv.z);
      if (mm > 0.3) { p.steerX = mv.x / mm; p.steerZ = mv.z / mm; p.steerOn = true; }
      if (a.intent.jump) p.high = true;
    }
    if (own) { a.intent.move.set(0, 0, 0); a.intent.jump = false; }
    if (!p.chimed && left <= PIPES.chime) { p.chimed = true; this._chime(p, a); }
    if (u >= L - 1e-6) {
      if (own) this._pop(a, p);
      else {   // (a proxy at the end before the owner's [1]: held in the mouth; its exit goes dark now, as on the owner's screen)
        if (!p.held) { p.held = true; this._unlight(p); }
        const e = this.ends[p.exit]; a.pos.set(e.pos[0], e.pos[1] - 0.3, e.pos[2]); a.vel.set(0, 0, 0);
      }
    }
  }
  // no ground, no swim, no climb while the module carries the body (the anim reads these)
  _noBody(a) { a.grounded = false; a.submerged = false; a.climbing = false; a.form = 'squid'; a.groundTeam = 0; a.onEnemy = false; }
  // statuses ride along: their timers keep running (the actor's own countdown doesn't run while the module owns the body)
  _statusTick(a, dt) {
    const st = a.status;
    if (!st) return;
    if (st.track > 0) st.track = Math.max(0, st.track - dt);
    if (st.reveal > 0) st.reveal = Math.max(0, st.reveal - dt);
    if (st.poison > 0) st.poison = Math.max(0, st.poison - dt);   // (the Bubble Guard's shield is the specials' to count down)
  }
  // sucked and stretched: the root pitched along the tangent (rotation order YXZ), scale (0.85, 0.85, 1.25)
  _pose(a, k, pitch) {
    const r = a.character?.root;
    if (!r) return;
    if (r.rotation.order !== 'YXZ') r.rotation.order = 'YXZ';
    r.rotation.x = pitch;
    r.scale.set(1 - 0.15 * k, 1 - 0.15 * k, 1 + 0.25 * k);
  }
  _unpose(a) { const r = a.character?.root; if (r) { r.rotation.x = 0; r.rotation.z = 0; r.scale.set(1, 1, 1); } }
  _light(p, a) {
    if (p.lit) return;
    p.lit = true;
    const L = this.lit[p.exit];
    L.n++; L.team = a.team; L.by = a; L.fast = false;
    this.events.push(['pipe:exit-lit', { nid: a.nid, end: p.exit, team: a.team }]);
    emit('pipe:exit-lit', { actor: a, end: p.exit, team: a.team });
  }
  _unlight(p) {
    if (!p.lit) return;
    p.lit = false;
    const L = this.lit[p.exit];
    L.n = Math.max(0, L.n - 1);
    if (!L.n) { L.by = null; L.fast = false; }
  }
  _chime(p, a) {
    const e = this.ends[p.exit];
    this.lit[p.exit].fast = true;
    _v.fromArray(e.pos);
    if (G.camera && G.camera.position.distanceTo(_v) < 30) G.audio?.play('pipe_chime', { pos: _v, volume: 0.9 });
    emit('pipe:chime', { actor: a, end: e.i, pos: _v.clone() });
  }
  // the pop: out of the OUT mouth 0.45 m past its plane, 6.5 out + 6.0 up (high: 7.0 / 8.5), steered ±45°, fanned 30°
  // right when another rider just popped here and this one holds no direction
  _pop(a, p) {
    const e = this.ends[p.exit], P = PIPES.pop;
    let hx = e.out[0], hz = e.out[2];
    const base = Math.atan2(hx, hz);
    let yaw = base;
    if (p.steerOn) {
      const want = Math.atan2(p.steerX, p.steerZ);
      let d = want - base; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      yaw = base + clamp(d, (-P.steer * Math.PI) / 180, (P.steer * Math.PI) / 180);
    } else if (this.t - this.lastPop[e.i] < P.fanWin) yaw = base - (P.fan * Math.PI) / 180;   // (30° to the right of the out axis)
    hx = Math.sin(yaw); hz = Math.cos(yaw);
    this.lastPop[e.i] = this.t;
    let vx = hx * (p.high ? P.highOut : P.out), vz = hz * (p.high ? P.highOut : P.out), vy = p.high ? P.highUp : P.up;
    if (e.nozzle === 'up') { vx = hx * P.upNozzle.side; vz = hz * P.upNozzle.side; vy = P.upNozzle.up; }
    else if (e.nozzle === 'down') { vx = 0; vz = 0; vy = -P.downNozzle.down; }
    a.pos.set(e.pos[0] + e.out[0] * P.start, e.pos[1] - 0.3, e.pos[2] + e.out[2] * P.start);
    a.vel.set(vx, vy, vz);
    a.yaw = yaw; a.yawVel = 0;
    a.grounded = false; a.kidT = -9; a.hardLand = 0;
    p.phase = 'pop'; p.popT = 0; p.popYaw = yaw;
    this._unpose(a);
    this._unlight(p);
    netRec(a, 'pipe', [1, r3(yaw), p.high ? 1 : 0]);
    this._popFx(a, e, yaw, p.high);
    this.stats.pops++;
    this.events.push(['pipe:pop', { nid: a.nid, end: e.i, high: p.high, yaw: r3(yaw), steer: p.steerOn }]);
    emit('pipe:pop', { actor: a, end: e.i, pos: a.pos.clone(), dir: yaw, high: p.high });
  }
  _popFx(a, e, yaw, high) {
    this.W.looks?.pop(e.i, a.team);
    _v.fromArray(e.pos);
    if (G.camera && G.camera.position.distanceTo(_v) < 40) G.audio?.play('pipe_pop', { pos: _v, volume: a.isLocal ? 1 : 0.75 });
    G.fx?.burst?.(_w.set(e.pos[0] + e.out[0] * 0.5, e.pos[1], e.pos[2] + e.out[2] * 0.5), _v.set(e.out[0], 0.4, e.out[2]), a.color, { count: 12, speed: 4.5, size: 0.09 });
  }
  _popTick(a, p, dt) {
    // touchdown: the ride ends, the cooldown starts, a 1.2 m splat of the rider's ink (turf, no special charge)
    if ((a.grounded && p.popT > 0.04) || a.climbing || p.popT > 4) this._land(a, p);
  }
  _land(a, p) {
    a.pipe = null; a.pipeNet = false;
    a.pipeCd = this.X.cooldown ?? PIPES.cooldown;
    a.kidT = 0; a.hardLand = 0;
    if (G.paint && a.alive) {
      const area = G.paint.splat(_v.set(a.pos.x, a.pos.y + 0.3, a.pos.z), PIPES.splat, a.team, { seed: Math.random() });
      a.addTurfNoSpecial?.(area);
    }
    this.stats.landings.push([+this.t.toFixed(2), a.nid ?? -1, a.team, r3(a.pos.x), r3(a.pos.y), r3(a.pos.z), p.exit]);
    this.lastLand.set(a, this.t);
    (this.lastExit || (this.lastExit = new Map())).set(a, p.exit);
    { const pe = this.stats.perExit || (this.stats.perExit = {}); (pe[p.exit] || (pe[p.exit] = [0, 0]))[0]++; }
    this.events.push(['pipe:land', { nid: a.nid, end: p.exit }]);
    emit('pipe:land', { actor: a, pos: a.pos.clone() });
  }
  _abort(a, why) {
    const p = a.pipe;
    if (!p) return;
    this._unlight(p);
    this._unpose(a);
    a.pipe = null; a.pipeNet = false;
    this.stats.aborts++;
    this.events.push(['pipe:abort', { nid: a.nid, why }]);
    emit('pipe:abort', { actor: a, why });
  }
  _removed(a) { if (a && a.pipe) this._abort(a, 'removed'); if (a) { this.cap.delete(a); this.refused.delete(a); this._stopLoop(a); } }

  // ------------------------------------------------------------------------------------------------ actors (registry)
  actorReset(a) { if (a.pipe) this._abort(a, 'reset'); a.pipe = null; a.pipeCd = 0; a.pipeNet = false; this._unpose(a); }
  // untouchable from the end of the suck to the touchdown (the pop's shield: at most 0.8 s in the air); on a shooter's
  // screen a proxy rider is known by the a.pipe its records and flag set
  damageGuard(a) {
    const p = a.pipe;
    if (!p) return !!(a.remote && a.pipeNet);
    if (p.phase === 'suck') return false;
    if (p.phase === 'ride') return true;
    return (p.popT ?? 0) <= PIPES.pop.shieldMax && !a.grounded;
  }
  canSuperJump(a) { return !a.pipe; }
  jumpAnchor(a) {
    const p = a.pipe;
    if (!p || p.phase === 'pop') return null;
    const e = this.ends[p.exit];
    return (this._anchorV || (this._anchorV = new THREE.Vector3())).set(e.land[0], e.land[1], e.land[2]);
  }
  anchor(a) { return this.jumpAnchor(a) || a.pos; }
  noPush(a) { return !!(a.pipe || a.pipeNet); }
  noShove(a) { return !!(a.pipe || a.pipeNet); }
  // where enemy rider e will land (botSight: remembered there, never a target), for the ride and the shielded pop
  sightLanding(e) {
    const p = e.pipe;
    if (!p && !(e.remote && e.pipeNet)) return null;
    if (p && p.phase === 'suck') return null;
    const end = p ? this.ends[p.exit] : null;
    if (!end) return e.pos;
    return (this._slV || (this._slV = new THREE.Vector3())).set(end.land[0], end.land[1], end.land[2]);
  }
  landing(e) { return this.sightLanding(e); }

  // ------------------------------------------------------------------------------------------------ online
  netFlag(a) { return !!a.pipe; }
  // the owner's records on every other screen: [0, leg, k, t0, u0] the capture (u0 > 0: a re-based ride, no suck),
  // [1, yaw, high] the pop
  net(a, d) {
    if (!a || !Array.isArray(d)) return;
    if (d[0] === 0) {
      const leg = this.legs[d[1]];
      if (!leg) return;
      const k = d[2] ? 1 : 0, dir = k ? -1 : 1, u0 = +d[4] || 0, rebased = u0 > 0;
      const was = a.pipe;
      if (was && !rebased) this._unlight(was);
      const p = { leg: leg.i, k, dir, phase: rebased ? 'ride' : 'suck', t0: +d[3], T: 0, u0, rebased, p0: a.pos.clone(), v: leg.speed * (a.carry && this.carpOpen.has(leg.i) ? PIPES.carpMul : 1),
        chimed: false, lit: false, entry: leg.ends[k].i, exit: leg.ends[1 - k].i, remote: true, owner: a.owner, s: dir > 0 ? u0 : leg.len - u0, u: u0, proj: false };
      if (was && was.lit && rebased && was.exit === p.exit) { p.lit = true; was.lit = false; }   // (an adopted ride carries its lit exit on)
      else if (was) this._unlight(was);
      if (was && was.chimed && rebased) p.chimed = true;
      a.pipe = p;
      if (rebased && !p.lit) this._light(p, a);
      if (!rebased) {
        this.stats.rides[leg.id][(dir > 0 ? 0 : 2) + (a.team ? 1 : 0)]++;
        if (this._near(a.pos, 30)) G.audio?.play('pipe_suck', { pos: _v.fromArray(leg.ends[k].pos), volume: 0.6 });
      }
      this.events.push(['pipe:enter', { nid: a.nid, leg: leg.i, k, rebased, remote: true }]);
      emit('pipe:enter', { actor: a, leg: leg.i, k, to: p.exit, eta: this._eta(p) });
    } else if (d[0] === 1) {
      const p = a.pipe;
      if (!p) return;
      const e = this.ends[p.exit];
      this._unlight(p);
      p.phase = 'pop'; p.popT = 0; p.held = false;
      this._unpose(a);
      this.lastPop[e.i] = this.t;
      this._popFx(a, e, +d[1], !!d[2]);
      this.events.push(['pipe:pop', { nid: a.nid, end: e.i, remote: true }]);
      emit('pipe:pop', { actor: a, end: e.i, pos: a.pos.clone(), dir: +d[1], high: !!d[2] });
    }
  }
  // a proxy: drawn on its path at its owner's timeline time from [0] (after the sample is applied: flags, form, yaw set)
  carryRemote(a, flag, dt) {
    a.pipeNet = !!flag;
    let p = a.pipe;
    if (p && !p.remote) return;
    if (!flag) {
      if (p) { p.off = (p.off || 0) + dt; if (p.phase === 'pop' || p.off > 0.3) this._endRemote(a, p); }
      if (!a.pipe) return;
      p = a.pipe;
      if (p.phase === 'pop') return;
    } else if (p) p.off = 0;
    if (!p) {
      // a late joiner (or a missed [0]): project the sampled position onto the nearest leg within 1.2 m and ride on from there
      const c = _w.set(a.pos.x, a.pos.y + 0.3, a.pos.z);
      let best = null;
      for (const leg of this.legs) { const r = nearestOnLeg(leg, c); if (r.d <= 1.2 && (!best || r.d < best.r.d)) best = { leg, r }; }
      if (!best) return;
      legAt(best.leg, best.r.s, _q);
      const dir = a.vel.x * _q.tx + a.vel.y * _q.ty + a.vel.z * _q.tz >= 0 ? 1 : -1, k = dir > 0 ? 0 : 1;
      const u = dir > 0 ? best.r.s : best.leg.len - best.r.s;
      p = a.pipe = { leg: best.leg.i, k, dir, phase: 'ride', t0: 0, T: 0, u0: u, rebased: true, p0: a.pos.clone(), v: best.leg.speed, chimed: false, lit: false,
        entry: best.leg.ends[k].i, exit: best.leg.ends[1 - k].i, remote: true, owner: a.owner, s: best.r.s, u, proj: true };
      this._light(p, a);
      this.events.push(['pipe:project', { nid: a.nid, leg: best.leg.i, u: r3(u) }]);
    }
    if (p.phase === 'pop') { p.popT += dt; return; }
    // a host change mid-ride: the old t0 belongs to the old owner's clock — ride on at the leg's speed from where it was
    // drawn until the new owner's re-based [0] arrives
    if (p.owner !== a.owner && !p.proj) { p.proj = true; p.rebased = true; p.u0 = p.u || 0; p.T = 0; p.phase = 'ride'; }
    p.T += dt;
    const T = this._T(p);
    this._place(a, p, T, dt, false);
  }
  _endRemote(a, p) {
    this._unlight(p);
    this._unpose(a);
    a.pipe = null;
  }
  // this screen took over a squidkid mid-ride (host change, disconnect): the ride goes on from where it was drawn, on our
  // clock, re-recorded so every other screen re-bases on it
  adopt(a) {
    const p = a.pipe;
    if (!p || !p.remote) return;
    if (p.phase === 'pop') { p.remote = false; p.popT = p.popT || 0; a.pipeCd = 0; return; }
    const leg = this.legs[p.leg], u = clamp(p.u || 0, 0, leg.len - 0.01), chimed = p.chimed;
    this._unlight(p);
    a.pipe = null;
    this._start(a, leg.ends[p.k], { u0: Math.max(0.001, u), t0: now() });   // (re-based: no suck, its exit lit again)
    if (a.pipe) a.pipe.chimed = chimed;
    this.events.push(['pipe:adopt', { nid: a.nid, leg: leg.i, u: r3(u) }]);
  }
  hostChanged() {}

  // ------------------------------------------------------------------------------------------------ nav + bots
  navEdge(e) {
    if (e.type !== 'pipe') return 0;
    if (this.keyShut[e.key]) return Infinity;
    const X = this.botX;
    return X && this._botXAt === G.time ? X[e.key] : 0;
  }
  // the bot's own costs per key (from what it saw: no wall-hacks): enemies near the landing, enemy ink there, a mouth it
  // just failed to get into; Infinity where it would be refused
  beforePath(b) {
    const a = b.a, X = this.botX && this.botX.length === this.nKeys ? this.botX : (this.botX = new Float32Array(this.nKeys));
    X.fill(0);
    this._botXAt = G.time;
    const B = PIPES.bot, tnow = G.time, mem = b.sight?.mem, bad = this.badKey.get(b);
    for (const leg of this.legs) for (const k of [0, 1]) {
      const key = leg.i * 2 + k, from = leg.ends[k], to = leg.ends[1 - k];
      if (from.inWhen === 'never') continue;
      if ((a.carry && !this.carpOpen.has(leg.i)) || this.m.tower?.riderList?.includes(a)) { X[key] = Infinity; continue; }
      let c = 0;
      if (mem) for (const [e, kn] of mem) { if (!e.alive || tnow - kn.t > B.seenT) continue; if (Math.hypot(kn.pos.x - to.land[0], kn.pos.z - to.land[2]) < B.seenR) c += B.seen; }
      c += this._inkDanger(to, a.team);
      const until = bad && bad.get(key);
      if (until && until > tnow) c += B.bad;
      c += this._tactic(b, leg, k);
      X[key] = c;
    }
  }
  _inkDanger(e, team) {
    const cache = this._ink || (this._ink = new Map()), key = e.i * 2 + team, hit = cache.get(key);
    if (hit && G.time - hit.t < 1) return hit.c;
    let c = 0;
    if (G.paint?.regionStats) {
      const r = G.paint.regionStats(e.land[0], e.land[1], e.land[2], 2.5, team, this._rs || (this._rs = { own: 0, enemy: 0, empty: 0, n: 0 }));
      const tot = r.own + r.enemy + r.empty;
      if (tot > 0 && r.enemy / tot > 0.5) c = PIPES.bot.ink;
    }
    cache.set(key, { t: G.time, c });
    return c;
  }
  // the stage's tactic weights (DESIGN.md §3.8, ENGINE step 9b), by leg kind: a chased low-hp bot near a mouth takes it (an
  // escape); in a tidal leg's dive (its B → A run) a bot already on its own promenade prefers it a little; a bot on its
  // own base side (its plaza, defending) prefers its one-way express a little
  _tactic(b, leg, k) {
    const a = b.a, from = leg.ends[k];
    const d = Math.hypot(a.pos.x - from.approach[0], a.pos.z - from.approach[2]);
    let c = 0;
    if (a.hp < PLAYER.hp * 0.45 && a.lastDamage < 1.5 && d < 6) c -= 6;
    if (leg.flip && d < 12) c -= 3;   // (a Kelp Line from close by, whichever way the tide runs: UP from the Reef Hall, DOWN from the promenade)
    if (leg.way === 'one' && d < 12 && Math.sign(a.pos.z) === Math.sign(G.level?.spawnPads?.[a.team]?.z || 0)) c -= 3;
    // DESIGN.md §3.8: a bot holding its side zone prefers the Arch Line to reach its promenade (and back): in Zone Control,
    // a two-way leg of its own half (not the Gulper Run under mid) from close by
    if (this.m.mode === 'zones' && leg.way === 'two' && !leg.single && d < 10 && Math.sign(from.pos[2]) === Math.sign(G.level?.spawnPads?.[a.team]?.z || 0)) c -= 4;
    if (this._errandKey(b) === leg.i * 2 + k) c -= 6;   // (the tide's errand)
    return c;
  }
  // the tide's errand (DESIGN.md §3.8; LEAD-REVIEW round 1: the Kelp Lines went almost unridden): while a team has not
  // ridden its open Kelp Line in this tide phase, its free painting bot nearest that IN end (within 30 m) is sent to the
  // line's landing, which A* reaches by the Kelp Line (the errand's key also costs 6 less); after 12 s without a ride the
  // errand passes to another bot. Host side (bots are the host's); nothing goes on the wire.
  _errands() {
    if (!this.tidal.length || !this.m.playing() || this.m.attract || this.m.mode === 'tower' || !G.nav) return;
    const now = G.time, kp = this.stats.kelpPhase || [], E = this._errand || (this._errand = [null, null]);
    for (const team of [0, 1]) {
      const pad = G.level?.spawnPads?.[team];
      const e = pad && this.ends.find((x) => this.legs[x.leg].flip && this.open(x) && Math.sign(x.pos[2]) === Math.sign(pad.z));
      const s = e && this.tide.get(e.leg);
      if (!e || (kp[s.n]?.[team] || 0) > 0) { E[team] = null; continue; }
      const cur = E[team];
      if (cur && cur.e === e && cur.until > now && cur.b.a.alive && !cur.b.a.pipe) {
        // (still on it: back on the way if a fight or a refill took it off, once it paints again)
        if (cur.b.mode === 'paint' && !this._pathUses(cur.b, cur.key)) { const to = this.legs[e.leg].ends[1 - e.k]; cur.b._pathTo?.(_v.set(to.land[0], to.land[1], to.land[2]), 0.6); cur.b.goalTimer = 9; }
        continue;
      }
      let best = null, bd = PIPES.bot.errand;
      for (const a of this.m.actors) {
        const b = a.bot;
        if (!b || a.remote || a.team !== team || !a.alive || a.pipe || a.carry || (a.specialActive && !a.specialActive.free) || a.pipeCd > 0 || b.mode !== 'paint') continue;
        if (cur && cur.b === b && cur.e === e) continue;   // (the last one didn't make it: someone else)
        if (this._landWatched(b, this.legs[e.leg].ends[1 - e.k])) continue;   // (not into enemies it saw there)
        const d = Math.hypot(a.pos.x - e.approach[0], a.pos.z - e.approach[2]);
        if (d < bd && Math.abs(a.pos.y - e.floorY) < 3) { bd = d; best = b; }
      }
      if (!best) { if (cur && cur.until <= now) E[team] = null; continue; }
      const to = this.legs[e.leg].ends[1 - e.k];
      E[team] = { b: best, e, key: e.leg * 2 + e.k, until: now + 12 };
      this.stats.errands = (this.stats.errands || 0) + 1;
      (this.stats.errandLog || (this.stats.errandLog = [])).push([+this.S.clock.t.toFixed(0), team, +bd.toFixed(0)]);
      best._pathTo?.(_v.set(to.land[0], to.land[1], to.land[2]), 0.6);
      best.goalTimer = 9;
    }
  }
  // this bot saw (or located) an enemy within 7 m of end `to`'s landing in the last 3 s (its own sight memory only)
  _landWatched(b, to) {
    const mem = b.sight?.mem, B = PIPES.bot, tnow = G.time;
    if (mem) for (const [e, kn] of mem) { if (!e.alive || tnow - kn.t > B.seenT) continue; if (Math.hypot(kn.pos.x - to.land[0], kn.pos.z - to.land[2]) < B.seenR) return true; }
    return false;
  }
  _pathUses(b, key) {
    const P = b.path, nav = G.nav;
    if (!P || !nav) return false;
    for (let i = Math.max(1, b.pi | 0); i < P.length; i++) { const e = nav.edge(P[i - 1], P[i]); if (e && e.type === 'pipe' && e.key === key) return true; }
    return false;
  }
  _errandKey(b) { const E = this._errand; if (!E) return -1; const x = E[b.a.team ? 1 : 0]; return x && x.b === b && x.until > G.time ? x.key : -1; }
  _markBad(b, e) {
    let m = this.badKey.get(b);
    if (!m) this.badKey.set(b, (m = new Map()));
    m.set(e.leg * 2 + e.k, G.time + PIPES.bot.badT);
  }
  // a riding bot's pop (the steer window opens): it looks out of the exit as a player's exit shot does — enemies standing
  // within 12 m of the landing in plain sight of the mouth — and steers the pop (±45°) to the side farthest from them,
  // high when one is within 5 m of the plain landing; nobody in sight: the plain pop onto the landing node (its path
  // continues from wherever it lands)
  _botPop(a, p) {
    const e = this.ends[p.exit], L = G.level, B = PIPES.bot;
    const eye = _w.set(e.pos[0] + e.out[0] * 0.6, e.floorY + 2.2, e.pos[2] + e.out[2] * 0.6), seen = [];
    for (const o of this.m.actors) {
      if (o.team === a.team || !o.alive || o.pipe || o.pipeNet) continue;
      if (Math.hypot(o.pos.x - e.land[0], o.pos.z - e.land[2]) > B.popLook || Math.abs(o.pos.y - e.land[1]) > 4) continue;
      _v.set(o.pos.x, o.pos.y + 0.8, o.pos.z);
      if (G.physics && G.physics.segment(eye, _v, this._hit || (this._hit = new Hit()), true).hit) continue;
      seen.push([o.pos.x, o.pos.z]);
    }
    this.stats.botPopLooks = (this.stats.botPopLooks || 0) + 1;
    if (!seen.length) return;
    const base = Math.atan2(e.out[0], e.out[2]);
    let best = base, bs = -Infinity, near = Infinity;
    for (const dy of [-45, -22, 0, 22, 45]) {
      const yaw = base + (dy * Math.PI) / 180, lx = e.pos[0] + Math.sin(yaw) * 3.6, lz = e.pos[2] + Math.cos(yaw) * 3.6;
      if (L && L.groundHeight(lx, lz, e.floorY + 1) < e.floorY - 3.4) continue;   // (never off an edge)
      let m = Infinity; for (const [x, z] of seen) m = Math.min(m, Math.hypot(x - lx, z - lz));
      if (dy === 0) near = m;
      if (m - Math.abs(dy) * 0.01 > bs) { bs = m - Math.abs(dy) * 0.01; best = yaw; }
    }
    p.steerX = Math.sin(best); p.steerZ = Math.cos(best); p.steerOn = best !== base;
    if (near < 5) p.high = true;
    this.stats.botPopSteers = (this.stats.botPopSteers || 0) + 1;
  }
  // hold the bot while it rides and pops (bots never steer a pop: they land on the predicted landing node). (BotBrain.update
  // asks this first every frame: the bot it asks for is the one whose paint goal goalWeight() is about to weigh)
  botHold(b) { this._gwBot = b; this._gwT = G.time; return !!b.a.pipe; }
  // a reason to ride in Turf War (LEAD-REVIEW, round 1: 0.08–0.21 rides per bot-minute): a paint goal near the landing of
  // an open pipe whose IN end is close to this bot, and far enough from the bot that walking there is the long way, is
  // worth more (×1.7; a Kelp Line's ×2.4 and from further off: the tide's lift and dive are the stage's signature). The
  // bot then plans its path there and the pipe edge is the cheap way (no wall-hacks: the network and the ink are what it
  // sees)
  goalWeight(id) {
    const b = this._gwBot, n = G.nav?.nodes?.[id];
    if (!b || this._gwT !== G.time || !n || !b.a.alive) return 1;
    let T = this._trips;
    if (!T || T.b !== b || T.t !== G.time) T = this._trips = this._tripsFor(b);
    const a = b.a, B = PIPES.bot;
    let w = 1;
    for (const tr of T.list) {
      const dl = Math.hypot(n.x - tr.land[0], n.z - tr.land[2]);
      if (dl > B.tripR || Math.abs(n.y - tr.land[1]) > 2.5) continue;
      if (Math.hypot(n.x - a.pos.x, n.z - a.pos.z) < dl + B.tripGain) continue;   // (near enough to walk)
      if (tr.w > w) w = tr.w;
    }
    return w;
  }
  _tripsFor(b) {
    const a = b.a, list = [], B = PIPES.bot, bad = this.badKey.get(b);
    if (!(a.carry || this.m.tower?.riderList?.includes(a) || a.pipeCd > 1.5 || this.m.mode === 'tower')) {
      for (const e of this.ends) {
        const key = e.leg * 2 + e.k;
        if (!this.open(e) || this.keyShut[key] || (bad && bad.get(key) > G.time)) continue;
        const leg = this.legs[e.leg], reach = leg.flip ? B.tripKelp : B.trip, to = leg.ends[1 - e.k];
        if (Math.hypot(a.pos.x - e.approach[0], a.pos.z - e.approach[2]) > reach || Math.abs(a.pos.y - e.floorY) > 2.5) continue;
        if (this._landWatched(b, to)) continue;   // (it saw enemies by that landing: no reason to go there by pipe)
        list.push({ land: to.land, w: leg.flip ? B.tripWKelp : B.tripW });
      }
    }
    return { b, t: G.time, list };
  }
  // a 'pipe' edge is next: walk to the approach point, then straight in along the mouth's axis; give up after 2 s
  botSteer(b, edge, out) {
    const a = b.a, from = this.ends[edge.end];
    if (!from) return null;
    const rx = a.pos.x - from.pos[0], rz = a.pos.z - from.pos[2], along = rx * from.out[0] + rz * from.out[2];
    const side = -rx * from.out[2] + rz * from.out[0];
    // not at this mouth (the ride is done: we are at the landing; or we slid away): the normal walk to the next node
    if (Math.hypot(rx, rz) > 3.2 || along < -0.5 || Math.abs(a.pos.y - from.floorY) > 1.6) { this.push.delete(b); return null; }
    if (!this.open(from) || this.keyShut[edge.key]) { b.path = null; b.repath = 0; this.push.delete(b); return out.set(0, 0, 0); }
    let pp = this.push.get(b);
    if (!pp || pp.key !== edge.key || G.time - pp.last > 0.5) this.push.set(b, (pp = { key: edge.key, t0: G.time, last: G.time }));
    pp.last = G.time;
    // (this push keeps its own watchdog: the brain's displacement one would wiggle the path away first, unmarked)
    b.dispT = 0; b.moveAcc = 0; b.snap?.copy(a.pos);
    if (G.time - pp.t0 > PIPES.bot.push) {   // pushing for 2 s without a capture (a body, a curtain): drop the path, the key is bad for 5 s
      this._markBad(b, from); this.push.delete(b); b.path = null; b.repath = 0; this.stats.giveUps++;
      this.stats.pushMax = Math.max(this.stats.pushMax, G.time - pp.t0);
      return out.set(0, 0, 0);
    }
    if (Math.abs(side) > 0.45 && along > 0.3) out.set(from.approach[0] - a.pos.x, 0, from.approach[2] - a.pos.z).normalize().addScaledVector(_v.set(-from.out[0], 0, -from.out[2]), 0.3).normalize();
    else out.set(-from.out[0] - side * 0.6 * -from.out[2], 0, -from.out[2] + side * 0.6 * -from.out[0]).normalize();
    return out;
  }

  // ------------------------------------------------------------------------------------------------ camera
  // the ride camera (src/game/pipesCam.js): the module places the lens for the whole ride — the entry hold, the chase
  // along the tube's own corridor, the exit shot over the OUT mouth through the pop, the blend back after touchdown
  cam(rig, a, dt) { return this.rideCam.cam(rig, a, dt); }
  camAfter(rig, a, o) { this.rideCam.after(rig, a, o); }

  // ------------------------------------------------------------------------------------------------ HUD + maps
  prompt(a) {
    if (a.pipe) return null;
    const r = this.refused.get(a);
    if (r && this.t - r.t < PIPES.refuseShow) return r.text;
    if (!this.m.playing() || this.off) return null;
    const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    for (const e of this.ends) {
      const rx = e.pos[0] - a.pos.x, rz = e.pos[2] - a.pos.z, d = Math.hypot(rx, rz);
      if (d > PIPES.promptR || Math.abs(a.pos.y - e.floorY) > 1.2) continue;
      if ((rx * fx + rz * fz) / (d || 1) < 0.5) continue;
      if (!this.open(e)) continue;
      const to = this.ends[this.legs[e.leg].ends[1 - e.k].i];
      return `${this.X.enter === 'squid' ? 'Swim in' : 'Walk in'} to ride → ${to.name}`;
    }
    return null;
  }
  hud(a) {
    const p = a.pipe, f = this.flow();
    const o = { riding: !!(p && p.phase !== 'pop'), noReticle: !!(p && p.phase !== 'pop'), cd: a.pipeCd || 0, cdMax: this.X.cooldown, tide: f };
    if (o.riding) {
      const leg = this.legs[p.leg], to = this.ends[p.exit];
      o.name = to.name; o.k = clamp((p.u || 0) / leg.len, 0, 1); o.eta = this._eta(p); o.leg = leg.id;
      o.hint = (this.myRides || 0) <= 3 ? 'Hold a direction to aim your pop · JUMP: high pop' : '';
      // the chip sits in the top band, clear of the rider; while the rider is high on the screen (looking up a riser) it
      // drops to the bottom instead (with a margin either way, so it doesn't flicker)
      const cam = G.camera;
      if (cam && a === (G.game?.rig?.target || a)) {
        const v = _w.set(a.pos.x, a.pos.y + 0.4, a.pos.z).project(cam), hi = v.z < 1 && Math.abs(v.x) < 0.7 ? v.y : -1;
        this._chipLow = this._chipLow ? hi > 0.08 : hi > 0.22;
      }
      o.chipLow = !!this._chipLow;
    } else this._chipLow = false;
    this.hudUi?.update(o, a);
    return o;
  }
  // the minimap and the expanded map: legs as pale double lines, moving arrowheads on one-way legs (a tidal leg's flip with
  // the tide, dashed while shut), a dot at each end of a two-way leg, each lit exit a pulsing ring in its rider's colour
  drawMap(c, mm, tc, s, hex, t) {
    const pts = this._mapPts || (this._mapPts = this.legs.map((leg) => { const o = []; for (let d = 0; d <= leg.len; d += 1.0) { legAt(leg, Math.min(d, leg.len), _q); o.push([_q.x, _q.z]); } legAt(leg, leg.len, _q); o.push([_q.x, _q.z]); return o; }));
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const leg of this.legs) {
      const P = pts[leg.i];
      const shut = (leg.flip && this.tide.get(leg.i).phase === 'shut') || this.off || this.modeShut.has(leg.i);
      c.beginPath();
      for (let i = 0; i < P.length; i++) { mm.toCanvas(P[i][0], P[i][1], tc); if (i) c.lineTo(tc.x, tc.y); else c.moveTo(tc.x, tc.y); }
      c.setLineDash(shut ? [s * 1.2, s * 0.9] : []);
      c.globalAlpha = shut ? 0.45 : 0.85;
      // (wide enough to read on the corner map, ~ a fifth of this canvas's size: a dark casing, a white tube, a fine core)
      c.lineWidth = s * 1.9 + 3; c.strokeStyle = '#15121c'; c.stroke();
      c.lineWidth = s * 1.3; c.strokeStyle = '#ffffff'; c.stroke();
      c.lineWidth = Math.max(1, s * 0.3); c.strokeStyle = '#7d9aa3'; c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
      if (leg.way === 'two') {
        for (const e of leg.ends) { mm.toCanvas(e.pos[0], e.pos[2], tc); c.beginPath(); c.arc(tc.x, tc.y, s * 1.15 + 2, 0, Math.PI * 2); c.fillStyle = '#15121c'; c.fill(); c.beginPath(); c.arc(tc.x, tc.y, s * 1.15, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill(); }
      } else if (!shut) {
        const dir = leg.flip ? (this.tide.get(leg.i).dir === 'ab' ? 1 : -1) : 1, step = 7, ph = ((t * 6) % step + step) % step;
        for (let d = 2; d < leg.len - 1; d += step) {
          const u = dir > 0 ? d + ph : leg.len - d - ph;
          if (u < 1.5 || u > leg.len - 1.5) continue;
          legAt(leg, u, _q);
          const hx = _q.tx * dir, hz = _q.tz * dir, hl = Math.hypot(hx, hz);
          if (hl < 0.3) continue;
          mm.toCanvas(_q.x, _q.z, tc); const x0 = tc.x, y0 = tc.y;
          mm.toCanvas(_q.x + hx / hl, _q.z + hz / hl, tc);
          let ux = tc.x - x0, uy = tc.y - y0; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
          const k = s * 1.3;
          c.beginPath(); c.moveTo(x0 + ux * k, y0 + uy * k); c.lineTo(x0 - ux * k - uy * k * 0.75, y0 - uy * k + ux * k * 0.75); c.lineTo(x0 - ux * k + uy * k * 0.75, y0 - uy * k - ux * k * 0.75); c.closePath();
          c.fillStyle = '#15121c'; c.fill();
        }
      }
    }
    // lit exits: a pulsing ring in the rider's colour (faster in the last second)
    for (let i = 0; i < this.lit.length; i++) {
      const L = this.lit[i];
      if (!L.n) continue;
      const e = this.ends[i]; mm.toCanvas(e.pos[0], e.pos[2], tc);
      const k = (t * (L.fast ? 3 : 1.4)) % 1;
      c.beginPath(); c.arc(tc.x, tc.y, s * (1.1 + 1.6 * k), 0, Math.PI * 2);
      c.lineWidth = Math.max(1.5, s * 0.45); c.strokeStyle = hex[L.team] || '#fff'; c.globalAlpha = 1 - k * 0.8; c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
  }

  // ------------------------------------------------------------------------------------------------ sounds
  // a hollow glassy whoosh at each rider (the nearest 3), the intake hum at the 2 nearest open one-way IN ends within 12 m
  _loopsTick() {
    const au = G.audio, cam = G.camera?.position;
    if (!au || !cam || this.m.attract) { this._stopLoops(); return; }
    for (const [a, h] of this.loops) h?.set?.({ pos: a.pos });   // (the whoosh follows its rider every frame; who gets one, 6× a second)
    if (((this._loopN = (this._loopN || 0) + 1) % 10) !== 1) return;
    const riders = this.m.actors.filter((a) => a.pipe && a.pipe.phase === 'ride' && a.alive).sort((x, y) => x.pos.distanceToSquared(cam) - y.pos.distanceToSquared(cam)).slice(0, 3);
    for (const [a, h] of this.loops) if (!riders.includes(a)) { h?.stop?.(0.25); this.loops.delete(a); }
    for (const a of riders) {
      let h = this.loops.get(a);
      if (!h) { h = au.loop?.('pipe_ride', { pos: a.pos.clone(), volume: 0 }) || null; this.loops.set(a, h); }
      h?.set?.({ pos: a.pos, volume: a.isLocal ? 0.55 : 0.85, params: { own: a.isLocal ? 1 : 0 } });
    }
    const fans = this.ends.filter((e) => this.legs[e.leg].way !== 'two' && this.open(e)).map((e) => [e, _w.fromArray(e.pos).distanceTo(cam)]).filter(([, d]) => d < 12).sort((x, y) => x[1] - y[1]).slice(0, 2);
    const fm = this._fans || (this._fans = new Map());
    for (const [e, h] of fm) if (!fans.some(([f]) => f === e)) { h?.stop?.(0.3); fm.delete(e); }
    for (const [e] of fans) if (!fm.has(e)) fm.set(e, au.loop?.('pipe_fan', { pos: new THREE.Vector3().fromArray(e.pos), volume: 0.7 }) || null);
  }
  _stopLoop(a) { const h = this.loops.get(a); if (h) { h.stop?.(0.2); this.loops.delete(a); } }
  _stopLoops() { for (const h of this.loops.values()) h?.stop?.(0.2); this.loops.clear(); if (this._fans) { for (const h of this._fans.values()) h?.stop?.(0.2); this._fans.clear(); } }

  // the counters for match.cjs (PAGEQ='pipestats'): one console line each, under its 300-character cut
  _report() {
    const S = this.stats, mins = Math.max(1e-6, S.playT / 60), bots = this.m.actors.filter((a) => a.bot).length || 1;
    const legs = Object.fromEntries(Object.entries(S.rides).map(([k, v]) => [k, v]));
    console.warn('[pipes] STATS rides ' + JSON.stringify({ total: S.team[0] + S.team[1], team: S.team, perBotMin: +(S.botRides / bots / mins).toFixed(3), mins: +mins.toFixed(2) }));
    console.warn('[pipes] STATS legs [A→B t0, A→B t1, B→A t0, B→A t1] ' + JSON.stringify(legs));
    console.warn('[pipes] STATS mouths ' + JSON.stringify({ pushMaxS: +S.pushMax.toFixed(2), giveUps: S.giveUps, refusals: S.refusals, pops: S.pops, aborts: S.aborts, botPops: [S.botPopLooks || 0, S.botPopSteers || 0], errands: S.errands || 0, errandRides: S.errandRides || 0, errandLog: (S.errandLog || []).slice(0, 12) }));
    const rate = S.deaths / Math.max(1, S.playT / 2) / Math.max(1, this.m.actors.length);
    console.warn('[pipes] STATS camping ' + JSON.stringify({ deaths: S.deaths, landings: S.landings.length, deathsWithin2sOfTouchdown: S.deathsAfterLand, perLanding: +(S.deathsAfterLand / Math.max(1, S.landings.length)).toFixed(3), basePer2sPerActor: +rate.toFixed(4) }));
    console.warn('[pipes] STATS perExit [landings, deaths ≤ 2 s] ' + JSON.stringify(Object.fromEntries(Object.entries(S.perExit || {}).map(([i, v]) => [`${this.legs[this.ends[i].leg].id}:${this.ends[i].k ? 'B' : 'A'}`, v]))));
    console.warn('[pipes] STATS tide ' + JSON.stringify(S.flips.filter((f) => f.phase === 'flip').map((f) => [f.t, f.dir])) + ' kelp rides per tide phase [team0, team1] ' + JSON.stringify(Array.from(S.kelpPhase || [], (x) => x || [0, 0])));
  }

  // ------------------------------------------------------------------------------------------------ tests
  state() {
    return {
      rides: this.m.actors.filter((a) => a.pipe).map((a) => ({ nid: a.nid, team: a.team, leg: this.legs[a.pipe.leg].id, k: a.pipe.k, phase: a.pipe.phase, s: r3(a.pipe.s ?? 0), remote: !!a.pipe.remote, proj: !!a.pipe.proj })),
      open: this.ends.map((e) => this.open(e)), lit: this.lit.map((L) => (L.n ? L.team : -1)), keyShut: [...this.keyShut],
      cooldowns: this.m.actors.map((a) => r3(a.pipeCd || 0)), flow: this.flow(), stats: this.stats,
    };
  }
  debugRide(a, legId, k = 0) {
    const leg = this.legs.find((l) => l.id === legId);
    if (!leg || a.pipe) return false;
    this._start(a, leg.ends[k]);
    return true;
  }
  dispose() {
    for (const a of this.m.actors) { if (a.pipe) { this._unpose(a); a.pipe = null; } a.pipeNet = false; }
    for (const f of this.unsubs) f();
    this.unsubs.length = 0;
    this._stopLoops();
    this.hudUi?.dispose(); this.hudUi = null;
    this.rideCam.reset();
    this.W.looks?.setRiders([]);
    this.W.looks?.underwater(null);
    for (let i = 0; i < this.lit.length; i++) this.W.looks?.lightEnd(i, -1, false);
  }
}

registerStageMod({
  key: 'pipes', order: 30, worldAs: 'pipes', matchAs: 'pipes',
  world: (ctx) => { const W = new PipeNet(ctx); return W.X ? W : null; },
  match: (m, W, S) => StagePipes.create(m, W, S),
});

// ================================================================================================ sounds
// (synthesised like every other: src/audio/audio.js voices)
// the suck-in: a rising filtered "shloop"
if (!SFX.pipe_suck) SFX.pipe_suck = {
  gain: 0.45, max: 4, jitter: 0.06, reverb: 0.2,
  build(v, p) {
    const T = v.t, g = v.gain(0, v.out), bp = v.filter('bandpass', 260 * p, 1.6, g);
    bp.frequency.setValueAtTime(260 * p, T); bp.frequency.exponentialRampToValueAtTime(1900 * p, T + 0.26);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.9, T + 0.05); g.gain.linearRampToValueAtTime(0, T + 0.3);
    v.noise('pink', T, T + 0.32, bp);
    v.tone({ type: 'sine', f: 180 * p, f1: 620 * p, sw: 0.26, a: 0.01, d: 0.22, peak: 0.35 });
  },
};
// riding: a hollow glassy whoosh (the rider's own copy low-passed)
if (!SFX.pipe_ride) SFX.pipe_ride = {
  gain: 0.28, max: 3, jitter: 0, reverb: 0.15, oneShot: 1.2,
  loop(v, p) {
    const T = v.t, amp = v.gain(0.6, v.out), lp = v.filter('lowpass', 2400, 0.7, amp), bp = v.filter('bandpass', 700 * p, 2.2, lp);
    v.noise('pink', T, null, bp);
    const g2 = v.gain(0.12, lp); v.osc('sine', 330 * p, T, null, g2); v.osc('sine', 497 * p, T, null, g2);
    v.lfo(5.5, 0.25, amp.gain, T, null, 'sine');
    return { params(o, t) { if (o && o.own !== undefined) lp.frequency.setTargetAtTime(o.own ? 900 : 2400, t, 0.05); } };
  },
};
// the exit's chime: two rising notes, 1.0 s before the pop
if (!SFX.pipe_chime) SFX.pipe_chime = {
  gain: 0.4, max: 4, jitter: 0, reverb: 0.35, minGap: 0.2,
  build(v, p) {
    v.tone({ type: 'sine', f: 880 * p, a: 0.004, h: 0.08, d: 0.3, peak: 0.6 });
    v.tone({ t: 0.16, type: 'sine', f: 1318.5 * p, a: 0.004, h: 0.1, d: 0.4, peak: 0.6 });
    v.tone({ t: 0.16, type: 'triangle', f: 2637 * p, a: 0.004, d: 0.18, peak: 0.12 });
  },
};
// the pop: a cork pop and a splash
if (!SFX.pipe_pop) SFX.pipe_pop = {
  gain: 0.5, max: 4, jitter: 0.08, reverb: 0.15,
  build(v, p) {
    v.tone({ type: 'sine', f: 520 * p, f1: 140 * p, sw: 0.06, a: 0.002, d: 0.09, peak: 0.9 });
    v.nz({ kind: 'white', f: 3200 * p, f1: 900 * p, sw: 0.25, q: 0.8, a: 0.005, d: 0.3, peak: 0.55 });
    v.nz({ t: 0.04, kind: 'pink', f: 900 * p, q: 1.2, a: 0.01, d: 0.2, peak: 0.35 });
  },
};
// a refusal: a glass knock
if (!SFX.pipe_tok) SFX.pipe_tok = {
  gain: 0.35, max: 3, jitter: 0.05, reverb: 0.1, minGap: 0.12,
  build(v, p) {
    v.tone({ type: 'triangle', f: 1350 * p, f1: 1100 * p, sw: 0.05, a: 0.001, d: 0.09, peak: 0.7 });
    v.tone({ t: 0.07, type: 'triangle', f: 1180 * p, f1: 980 * p, sw: 0.05, a: 0.001, d: 0.08, peak: 0.45 });
  },
};
// a one-way IN end's intake fan: a soft hum and a rush of air
if (!SFX.pipe_fan) SFX.pipe_fan = {
  gain: 0.16, max: 2, jitter: 0, reverb: 0.1, oneShot: 1.5,
  loop(v, p) {
    const T = v.t, amp = v.gain(0.5, v.out), lp = v.filter('lowpass', 900, 0.6, amp);
    v.osc('sawtooth', 96 * p, T, null, lp); v.osc('sine', 192 * p, T, null, lp);
    const air = v.gain(0.35, v.out); v.noise('pink', T, null, v.filter('bandpass', 1200, 0.8, air));
    v.lfo(18, 0.15, amp.gain, T, null, 'sine');
  },
};
// the tide: the PA hoot at T − 10 (two tones), the valve clunk at T − 3, the deep pneumatic WHUMP at the flip
if (!SFX.pipe_hoot) SFX.pipe_hoot = {
  gain: 0.42, max: 2, jitter: 0, reverb: 0.55, minGap: 1,
  build(v, p) {
    for (const [t, f] of [[0, 392], [0.62, 293.7]]) {
      v.tone({ t, type: 'sawtooth', f: f * p, a: 0.04, h: 0.42, d: 0.2, peak: 0.28, to: v.filter('lowpass', 1400, 0.8, v.out) });
      v.tone({ t, type: 'sine', f: f * 2 * p, a: 0.04, h: 0.42, d: 0.2, peak: 0.18 });
    }
  },
};
if (!SFX.pipe_clunk) SFX.pipe_clunk = {
  gain: 0.5, max: 4, jitter: 0.04, reverb: 0.25, minGap: 0.05,
  build(v, p) {
    v.tone({ type: 'square', f: 110 * p, f1: 70 * p, sw: 0.08, a: 0.002, d: 0.16, peak: 0.6, to: v.filter('lowpass', 700, 0.9, v.out) });
    v.nz({ kind: 'white', f: 2400, q: 1.4, a: 0.001, d: 0.05, peak: 0.4 });
    v.tone({ t: 0.09, type: 'triangle', f: 330 * p, f1: 300 * p, sw: 0.04, a: 0.002, d: 0.08, peak: 0.25 });
  },
};
if (!SFX.pipe_whump) SFX.pipe_whump = {
  gain: 0.6, max: 2, jitter: 0, reverb: 0.5, minGap: 1,
  build(v, p) {
    v.tone({ type: 'sine', f: 70 * p, f1: 34 * p, sw: 0.45, a: 0.01, d: 0.7, peak: 1.0 });
    v.tone({ type: 'triangle', f: 140 * p, f1: 60 * p, sw: 0.3, a: 0.005, d: 0.35, peak: 0.4 });
    const T = v.t, g = v.gain(0, v.out), bp = v.filter('bandpass', 300, 0.7, g);
    bp.frequency.setValueAtTime(300, T); bp.frequency.exponentialRampToValueAtTime(2200, T + 0.6); bp.frequency.exponentialRampToValueAtTime(600, T + 1.4);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.7, T + 0.1); g.gain.linearRampToValueAtTime(0.25, T + 0.8); g.gain.linearRampToValueAtTime(0, T + 1.5);
    v.noise('pink', T, T + 1.52, bp);   // the bubble curtain roaring through the drums
  },
};
