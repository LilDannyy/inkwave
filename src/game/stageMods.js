// Stage modules: one home for stage gimmicks that need the engine (batch 5: Bluestone's eras, Gulper Aquarium's pipes,
// Highmark Foundry's lava; later stages likewise). A module registers itself once (registerStageMod); a stage layout
// switches it on by carrying the module's key (LAYOUT.eras / LAYOUT.pipes / LAYOUT.lava …). The registry builds the
// module with the world, ticks it with the match, and calls its hooks from ONE generic hook-in per shared file (each
// tagged [b5-stagehooks]). docs/STAGE-MODS.md is the manual: the API, the lifecycle, every extension point, and which
// hook serves which line of each stage's ENGINE.md.
//
// Two objects per module:
//   W  the module's world (one per world build: main._buildWorldNow, Practice stage swaps and mode variants included):
//      geometry-derived data that persists across matches on that stage — G.stageWorld holds them all
//   R  the module's match runtime (one per Match: match.js setup, both the offline and the online path) — match.stage
//      (a StageRun) holds them all; it carries the shared stage clock
// Every hook is optional. A layout without any registered key gets no StageWorld (G.stageWorld = null) and no StageRun
// (match.stage = null): each shared hook-in is then one null check, nothing else (the existing twelve stages).
//
// The existing set pieces (movers.js, pods.js) keep their own hook-ins and are not routed through here.
import { G, emit } from '../core/ctx.js';
import { StageClock } from './stageKit.js';
import { NavGraph } from './nav.js';

// ------------------------------------------------------------------------------------------------ registry
const DEFS = new Map();
let SORTED = [];

/**
 * registerStageMod(def) — def = {
 *   key: 'lava',               REQUIRED: the layout key that switches it on (LAYOUT[key] != null)
 *   order: 50,                 lower runs first (build hooks, ticks, queries); suggested: eras 10, lava 20, pipes 30
 *   worldAs: 'lavaWorld',      optional: also publish W as G[worldAs] (the contracts' G.eraWorld / G.pipes / G.lavaWorld)
 *   matchAs: 'lava',           optional: also publish R as match[matchAs] (G.match.eras / .pipes / .lava); default: key
 *   world(ctx) → W | null      at the start of a world build, BEFORE the props and the Level: ctx = { key, data (= layout[key]),
 *                              layout (the mode variant's), layoutId, worldKey, mode, dressing, scene }
 *   match(match, W, S) → R | null   in Match setup, after the actors are placed and BEFORE Zone Control / Tower Command /
 *                              Boss Battle are built (zone cells, the tower and BossNav see the starting state). S = the
 *                              StageRun (S.clock is the shared stage clock)
 * }
 * Re-registering a key replaces it (hot reload, tests).
 */
export function registerStageMod(def) {
  if (!def || typeof def.key !== 'string' || !def.key) throw new Error('registerStageMod: a key is required');
  DEFS.set(def.key, { order: 50, ...def });
  SORTED = [...DEFS.values()].sort((a, b) => a.order - b.order || (a.key < b.key ? -1 : 1));
}
export function unregisterStageMod(key) { DEFS.delete(key); SORTED = SORTED.filter((d) => d.key !== key); }
export const stageModKeys = () => SORTED.map((d) => d.key);

// ------------------------------------------------------------------------------------------------ environmental causes
// A splat cause that isn't a weapon (the sea is built in): the splat card, the feed's "by", the screen flood.
// registerCause('lava', { name: 'Burned in the lava', knocked: 'Knocked into the lava', icon: '<svg…>', flood: '#a3121a',
//   clear: true, byColor: '#ff5a2a' })   (hud.js splatCause, main.js 'splatted', screenfx.js flood read it)
export { registerCause, envCause } from '../core/envCauses.js';

// ------------------------------------------------------------------------------------------------ helpers
const call = (o, name, args) => { const f = o && o[name]; return typeof f === 'function' ? f.apply(o, args) : undefined; };
function guarded(label, fn) {
  try { return fn(); } catch (e) { console.error(`[stage-mods] ${label}`, e); return undefined; }
}

// ================================================================================================ the world
/**
 * One per world build (G.stageWorld), or null. main.js calls, in order (H = the [b5-stagehooks] line there):
 *   StageWorld.plan(layout, ctx)       → modules' world(ctx)
 *   SW.prop(it) / SW.colliders(it, cols)   each dressing item / its prop colliders, before PropKit.add / new Level
 *   SW.extraColliders()                collider defs a module adds (pipe glass: { kind: 'seg', … })
 *   SW.attachLevel(level)              after new Level (block fields / kinds are already applied by Level itself)
 *   SW.attachPaint(paint)              after new PaintSystem
 *   SW.materialExt(grate)              level-material extensions (createLevelMaterial opts.ext)
 *   SW.levelFilter()                   the main level mesh's block filter (undefined = the default)
 *   SW.afterMeshes(o)                  { scene, level, size, levelMat, grateMat, levelMesh, grateMesh }
 *   SW.buildNav(level, physics)        a module's own graph (merged builds), or new NavGraph — with navEdges() first
 *   SW.attachMinimap(mm)
 *   SW.ready()                         the world is complete (and SW.attachEnv(env) whenever an Environment exists)
 *   SW.dispose()                       at the next world build (stage swap, mode variant, menu backdrop change)
 * W hooks of the same names are called on each module in `order`; W.prop / W.colliders chain.
 */
export class StageWorld {
  static plan(layout, ctx = {}) {
    let mods = null;
    for (const def of SORTED) {
      const data = layout?.[def.key];
      if (data == null) continue;
      const W = guarded(`${def.key}.world`, () => (def.world ? def.world({ ...ctx, key: def.key, data, layout }) : {}));
      if (!W) continue;
      (mods || (mods = [])).push({ key: def.key, def, W });
    }
    return mods ? new StageWorld(layout, ctx, mods) : null;
  }

  constructor(layout, ctx, mods) {
    this.layout = layout; this.ctx = ctx; this.mods = mods;
    this.level = null; this.paint = null; this.nav = null; this.minimap = null;
    for (const m of mods) if (m.def.worldAs) G[m.def.worldAs] = m.W;
  }
  get keys() { return this.mods.map((m) => m.key); }
  world(key) { const m = this.mods.find((x) => x.key === key); return m ? m.W : null; }
  _each(name, ...args) { for (const m of this.mods) guarded(`${m.key}.${name}`, () => call(m.W, name, args)); }
  _first(name, ...args) {
    for (const m of this.mods) { const v = guarded(`${m.key}.${name}`, () => call(m.W, name, args)); if (v !== undefined && v !== null) return v; }
    return undefined;
  }

  // ---- build chain
  prop(it, kit) { for (const m of this.mods) if (m.W.prop) it = m.W.prop(it, kit) || it; return it; }
  colliders(it, cols, kit) { for (const m of this.mods) if (m.W.colliders) cols = m.W.colliders(it, cols, kit) || cols; return cols; }
  extraColliders() { const out = []; for (const m of this.mods) { const c = guarded(`${m.key}.extraColliders`, () => call(m.W, 'extraColliders', [])); if (c?.length) out.push(...c); } return out; }
  attachLevel(level) {
    this.level = level;
    level.stageWorld = this;
    // shared queries the level answers for everyone (subs, kits, bots): installed only when a module answers them
    this.liquid = this.mods.some((m) => m.W.liquidY || m.def.liquid);   // (def.liquid: only the match runtime answers)
    if (this.liquid) level.liquidY = (x, z) => this.liquidY(x, z);
    if (this.mods.some((m) => m.W.noPlace)) level.noPlace = (p, r) => this.noPlace(p, r);
    this._each('attachLevel', level);
  }
  attachPaint(paint) {
    this.paint = paint;
    this._each('attachPaint', paint);
    // the splat block gate (eras: an absent / guarded block takes no ink): (block, et) → bool
    const gates = this.mods.filter((m) => m.W.inkOk).map((m) => m.W);
    if (gates.length) paint.blockGate = gates.length === 1 ? (b, et) => gates[0].inkOk(b, et) : (b, et) => gates.every((w) => w.inkOk(b, et));
  }
  // createLevelMaterial(…, { ext }): [{ key, uniforms, defines, vertPars, vertMain, fragPars, fragBase, fragMural, fragEmissive,
  // fragFinal, aoSample }] (levelMaterial.js applyLevelExt). Undefined when no module extends it: the program is today's.
  materialExt(grate = false) {
    const out = [];
    for (const m of this.mods) { const e = guarded(`${m.key}.levelMaterial`, () => call(m.W, 'levelMaterial', [{ grate }])); if (e) out.push(...[].concat(e)); }
    return out.length ? out : undefined;
  }
  levelFilter() { return this._first('levelFilter'); }
  afterMeshes(o) { this._each('afterMeshes', o); }
  buildNav(level, physics) {
    const specs = [];
    for (const m of this.mods) { const e = guarded(`${m.key}.navEdges`, () => call(m.W, 'navEdges', [level])); if (e?.length) specs.push(...e); }
    level.extraEdges = specs.length ? specs : null;
    let nav = null;
    for (const m of this.mods) if (!nav && m.W.buildNav) nav = guarded(`${m.key}.buildNav`, () => m.W.buildNav(level, physics)) || null;
    if (!nav) nav = new NavGraph(level, physics);
    this.nav = nav;
    this._each('attachNav', nav);
    return nav;
  }
  attachMinimap(mm) {
    this.minimap = mm;
    const pres = this.mods.filter((m) => m.W.mapBlock).map((m) => m.W);
    if (pres.length) mm.blockOk = (b) => pres.every((w) => w.mapBlock(b));
    this._each('attachMinimap', mm);
  }
  attachEnv(env) { if (env && this._env !== env) { this._env = env; this._each('attachEnv', env); } }
  ready() { if (G.env) this.attachEnv(G.env); this._each('ready'); }
  dispose() {
    this._each('dispose');
    for (const m of this.mods) if (m.def.worldAs && G[m.def.worldAs] === m.W) G[m.def.worldAs] = null;
    if (this.level?.stageWorld === this) this.level.stageWorld = null;
    if (G.stageWorld === this) G.stageWorld = null;
  }

  // ---- queries any code may ask while this world stands (match or not). The match runtime answers first.
  // the modules' own liquid surface at (x, z), −Infinity where they have none
  surfaceY(x, z) {
    const S = G.match?.stage;
    let y = S ? S.liquidY(x, z) : -Infinity;
    for (const m of this.mods) if (m.W.liquidY) { const v = m.W.liquidY(x, z); if (v > y) y = v; }
    return y;
  }
  liquidY(x, z) { return Math.max(this.surfaceY(x, z), -1.6); }   // (never below the sea: PLAYER.waterY)
  noPlace(p, r = 0) { for (const m of this.mods) if (m.W.noPlace && m.W.noPlace(p, r)) return true; return !!G.match?.stage?.noPlace(p, r); }
  // bake-ao: modules take their own pieces out of the AO trace (pipe glass, tank water) and put them back
  bakeMode(on) { this._each('bakeMode', on); }
}

// ================================================================================================ the match
// Hook names looked up on each module's match runtime R (precomputed per match: a hook nobody implements costs nothing).
const R_HOOKS = ['update', 'lateUpdate', 'seek', 'dispose',
  // actors (this screen's own: the owner decides)
  'actorReset', 'ownsBody', 'damageGuard', 'canSuperJump', 'jumpAnchor', 'kill', 'fallCause', 'superJumpLanding', 'noPush', 'noShove',
  // online
  'netEvent', 'netSnapshot', 'netRestore', 'netFlag', 'carryRemote', 'adopt', 'hostChanged', 'splatTime',
  // paint
  'onSplat',
  // nav + bots
  'navEdge', 'navNode', 'beforePath', 'botHold', 'botSteer', 'botAct', 'wet', 'goalWeight', 'sightLanding',
  // queries
  'under', 'fizzle', 'liquidY', 'noPlace', 'restMask', 'danger', 'sweeps', 'state',
  // looks / HUD / camera
  'drawMap', 'diorama', 'prompt', 'hud', 'cam', 'camAfter'];

/**
 * One per Match (match.stage), or null. Created in both setup paths before the modes; updated from Match.update
 * (update: before the movers / pods / actors; lateUpdate: after the pods); disposed with the match.
 * S.clock is the shared stage clock (stageKit StageClock: the host's match clock, carried on in overtime / Practice /
 * the menu backdrop; online Practice followers ride netmatch's stageSync). A clock snap of more than 1.5 s (a follower
 * catching up, a late joiner) calls R.seek(t, 'clock'); a late joiner's restore calls R.seek(t, 'late').
 */
export class StageRun {
  static create(match) {
    const SW = G.stageWorld;
    if (!SW) return null;
    const S = new StageRun(match, SW);
    for (const m of SW.mods) {
      const R = guarded(`${m.key}.match`, () => (m.def.match ? m.def.match(match, m.W, S) : null));
      if (!R) continue;
      S.mods.push({ key: m.key, def: m.def, W: m.W, R });
      match[m.def.matchAs || m.key] = R;
    }
    if (!S.mods.length) return null;
    S._index();
    return S;
  }

  constructor(match, SW) {
    this.match = match; this.world = SW; this.mods = [];
    this.clock = new StageClock();
    this.h = {};
    for (const n of R_HOOKS) this.h[n] = [];   // (a module's factory may already ask a query)
    this.edgeTypes = new Set();          // special nav edge types a module steers itself ('pipe' …): bots.js _steer
    this._navSet = false;
  }
  _index() {
    for (const n of R_HOOKS) this.h[n] = this.mods.filter((m) => typeof m.R[n] === 'function').map((m) => m.R);
    for (const m of this.mods) for (const t of [].concat(m.R.edgeTypes || [])) this.edgeTypes.add(t);
    // nav rules for this match (nav.ext: path() / nearest()) — only when a module has any
    const nav = G.nav;
    if (nav && (this.h.navEdge.length || this.h.navNode.length)) {
      const E = this.h.navEdge, N = this.h.navNode;
      nav.ext = {
        timed: this.mods.some((m) => m.R.navTimed),
        edge: E.length === 1 ? (e, to, mt) => E[0].navEdge(e, to, mt) : (e, to, mt) => { let c = 0; for (const R of E) { const x = R.navEdge(e, to, mt); if (x === Infinity) return Infinity; c += x || 0; } return c; },
        node: N.length ? (id, start) => { for (const R of N) if (R.navNode(id, start) === false) return false; return true; } : null,
      };
      this._navSet = true;
    }
  }
  run(key) { const m = this.mods.find((x) => x.key === key); return m ? m.R : null; }
  get t() { return this.clock.t; }
  now() { return this.clock.t; }

  // ---- ticks (Match.update)
  update(dt) {
    const t0 = this.clock.t;
    const t = this.clock.tick(this.match, dt);
    if (Math.abs(t - t0 - (this.match.state === 'playing' ? dt : 0)) > 1.0) for (const R of this.h.seek) R.seek(t, 'clock');
    for (const R of this.h.update) R.update(dt, t);
  }
  lateUpdate(dt) { for (const R of this.h.lateUpdate) R.lateUpdate(dt, this.clock.t); }
  dispose() {
    for (const R of this.h.dispose) guarded('dispose', () => R.dispose());
    if (this._navSet && G.nav?.ext) G.nav.ext = null;
    for (const m of this.mods) { const k = m.def.matchAs || m.key; if (this.match[k] === m.R) this.match[k] = null; }
    this.mods.length = 0;
    for (const n of R_HOOKS) this.h[n] = [];
  }
  // the Practice stage clock netmatch sends (no match clock there)
  clockT() { return this.clock.t; }

  // ---- actors: this screen's own squidkids (actor.js)
  actorReset(a) { for (const R of this.h.actorReset) R.actorReset(a); }
  // a module owns the body this frame (a pipe ride): it moved the actor itself; Actor.update finishes the frame
  ownsBody(a, dt) { for (const R of this.h.ownsBody) if (R.ownsBody(a, dt)) return true; return false; }
  // true = drop this damage (untouchable inside a pipe)
  damageGuard(a, amount, attacker, source) { for (const R of this.h.damageGuard) if (R.damageGuard(a, amount, attacker, source)) return true; return false; }
  canSuperJump(a) { for (const R of this.h.canSuperJump) if (R.canSuperJump(a) === false) return false; return true; }
  jumpAnchor(a) { for (const R of this.h.jumpAnchor) { const p = R.jumpAnchor(a); if (p) return p; } return null; }
  // an environmental kill (the lava): the module splats the actor itself and returns true
  kill(a) { for (const R of this.h.kill) if (R.kill(a)) return true; return false; }
  fallCause(a) { for (const R of this.h.fallCause) { const c = R.fallCause(a); if (c) return c; } return null; }
  superJumpLanding(a, s) { for (const R of this.h.superJumpLanding) R.superJumpLanding(a, s); }
  noPush(a) { for (const R of this.h.noPush) if (R.noPush(a)) return true; return false; }
  noShove(a) { for (const R of this.h.noShove) if (R.noShove(a)) return true; return false; }

  // ---- online (netmatch.js)
  // A module record: anyone may send one (the host for host-run state, an owner for its own actor's state); every other
  // screen gets R.netEvent(data, from) on the sender's timeline. Offline: nothing is sent.
  rec(key, data) { if (G.netm && G.netm.match === this.match) G.netm.recStage?.(key, data); }
  netEvent(key, data, from) { const R = this.run(key); if (R && R.netEvent) R.netEvent(data, from); }
  // a late joiner's copy (Practice: the host's start config carries it): absolute stage times only — it is restored
  // when the joiner's first host clock arrives, maybe seconds later
  netSnapshot() {
    let m = null;
    for (const x of this.mods) if (x.R.netSnapshot) { const d = guarded(`${x.key}.netSnapshot`, () => x.R.netSnapshot()); if (d !== undefined) (m || (m = {}))[x.key] = d; }
    return { t: +this.clock.t.toFixed(3), m };
  }
  netRestore(snap, st) {
    const t = Number.isFinite(st) ? st : +snap?.t || 0;
    this.clock.t = t;
    for (const x of this.mods) {
      if (x.R.netRestore && snap?.m && snap.m[x.key] !== undefined) guarded(`${x.key}.netRestore`, () => x.R.netRestore(snap.m[x.key], t));
      if (x.R.seek) guarded(`${x.key}.seek`, () => x.R.seek(t, 'late'));
    }
  }
  netFlag(a) { for (const R of this.h.netFlag) if (R.netFlag(a)) return true; return false; }
  carryRemote(a, flag, dt) { for (const R of this.h.carryRemote) R.carryRemote(a, flag, dt); }
  adopt(a) { for (const R of this.h.adopt) R.adopt(a); }
  hostChanged(isHost) { for (const R of this.h.hostChanged) R.hostChanged(isHost); }
  // the painter's stage time for a splat record (field 15), or undefined (not near anything that needs it)
  splatTime(c, radius) { for (const R of this.h.splatTime) { const t = R.splatTime(c, radius); if (t !== undefined && t !== null) return t; } return undefined; }

  // ---- paint (paint.js splat: every splat, local and replayed, after the pods)
  onSplat(c, r, team, opts) { for (const R of this.h.onSplat) R.onSplat(c, r, team, opts); }

  // ---- bots (bots.js)
  botHold(b) { for (const R of this.h.botHold) if (R.botHold(b)) return true; return false; }
  botSteer(b, edge, out) { for (const R of this.h.botSteer) { const r = R.botSteer(b, edge, out); if (r) return r; } return null; }
  beforePath(b) { for (const R of this.h.beforePath) R.beforePath(b); }
  botAct(b, dt, it, move, vis) { for (const R of this.h.botAct) { const r = R.botAct(b, dt, it, move, vis); if (r) return r; } return null; }
  // would feet on a floor at height gy at (x, z) be in a hazard now, or within `ahead` s (drowning floor)?
  wet(x, z, gy, ahead = 0) { for (const R of this.h.wet) if (R.wet(x, z, gy, ahead)) return true; return false; }
  goalWeight(id) { let w = 1; for (const R of this.h.goalWeight) w *= R.goalWeight(id) ?? 1; return w; }
  // botSight: an enemy a module carries out of reach (a pipe rider) is remembered where it will land, never targeted
  sightLanding(e) { for (const R of this.h.sightLanding) { const p = R.sightLanding(e); if (p) return p; } return null; }

  // ---- queries
  under(p, depth = 0) { for (const R of this.h.under) if (R.under(p, depth)) return true; return false; }
  // something sank there (a shot, a bomb, a thrown sub): the module's hiss and steam
  fizzle(p, what) { for (const R of this.h.fizzle) R.fizzle(p, what); }
  // under() and, if so, fizzle(): the one call a projectile / bomb / kit item makes beside its sea test
  sink(p, what) { if (!this.h.under.length || !this.under(p)) return false; this.fizzle(p, what); return true; }
  liquidY(x, z) { let y = -Infinity; for (const R of this.h.liquidY) { const v = R.liquidY(x, z); if (v > y) y = v; } return y; }
  noPlace(p, r = 0) { for (const R of this.h.noPlace) if (R.noPlace(p, r)) return true; return false; }
  // Bazookarp: 1 = standable at that rest / era / state, per nav node (Uint8Array) — the first module that answers
  restMask(state) { for (const R of this.h.restMask) { const m = R.restMask(state); if (m) return m; } return null; }
  danger(pos, pad = 0.5) { for (const R of this.h.danger) if (R.danger(pos, pad)) return true; return false; }
  // the volumes a module's moving pieces cover over their whole travel ({ x, z, hx, hz, yaw, y0, y1 } boxes pushed into
  // out): Bazookarp's rest flags, like movers.js sweepRect(car) for the railcars
  sweeps(out = []) { for (const R of this.h.sweeps) R.sweeps(out); return out; }
  // the one device destroyer (subs SPEC §0.3: G.deploy.crushIn(shape, how)). Until the deploy package's crushIn lands on
  // this branch it is a no-op that returns 0 — the call sites are final.
  crushIn(shape, how) { const D = G.deploy; return D && typeof D.crushIn === 'function' ? D.crushIn(shape, how) : 0; }

  // ---- warnings on the HUD (every screen from its own clock / events; not on the menu backdrop)
  callout(text, sub, big = false) { if (!this.match.attract) G.hud?._callout?.(text, sub, big); }
  banner(kind, text) { if (!this.match.attract) G.hud?.banner?.(kind, text); }

  // ---- looks
  drawMap(c, mm, tc, s, hex, t, me) { for (const R of this.h.drawMap) R.drawMap(c, mm, tc, s, hex, t, me); }
  // the TAB map (the diorama: the live scene from above, ui/diorama.js) while it is open: root = its overlay element (add
  // your own pins / labels there once, move them each call: project with cam), k = how far it is open (0..1)
  diorama(root, cam, W, H, k) { for (const R of this.h.diorama) R.diorama(root, cam, W, H, k); }
  prompt(a) { for (const R of this.h.prompt) { const p = R.prompt(a); if (p) return p; } return null; }
  // frame.stage for the HUD: each module's own object under its key ({ pipes: {…}, lava: {…} }); flags any module sets
  // on its object that the HUD reads generically: noReticle (hide the reticle and the sub chip)
  hud(a) {
    let out = null;
    for (const m of this.mods) if (m.R.hud) { const v = m.R.hud(a); if (v) { (out || (out = {}))[m.key] = v; if (v.noReticle) out.noReticle = true; } }
    return out;
  }
  // the follow camera's override this frame (cameraRig._follow): null, or { glide (flight-style follow), boom (+m),
  // fov (+deg), skip (a block flag the boom probe ignores) } — the module may also set rig.yaw / rig.pitch itself
  cam(rig, a, dt) { for (const R of this.h.cam) { const o = R.cam(rig, a, dt); if (o) return o; } return null; }
  camAfter(rig, a, o) { for (const R of this.h.camAfter) R.camAfter(rig, a, o); }

  // test / audit snapshot
  state() { const o = { t: +this.clock.t.toFixed(3), keys: this.mods.map((m) => m.key) }; for (const m of this.mods) if (m.R.state) o[m.key] = m.R.state(); return o; }
}

// a stage-module event on the bus, with the module's key in front: stageEmit('lava', 'warn', {…}) → 'lava:warn'
export const stageEmit = (key, name, payload) => emit(`${key}:${name}`, payload);
