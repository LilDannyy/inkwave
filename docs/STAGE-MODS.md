# Stage modules (`src/game/stageMods.js`)

One home for stage gimmicks that need the engine: Bluestone Junction's eras, Gulper Aquarium's pipes, Highmark
Foundry's lava, and whatever comes next. A gimmick is **one module file that registers itself**; the shared engine
files call the registry from **one generic hook-in each**, tagged `[b5-stagehooks]`. A stage engineer writes the
module and its stage files and does not edit the shared files (the per-contract tables at the end say so line by line;
today no contract line needs a shared-file edit).

The existing set pieces keep their own hook-ins: `movers.js` (Calamari's trains) and `pods.js` (Treehills' pods) are not
routed through the registry. A stage without a registered key gets no stage world and no stage run: every hook-in is
one null check (see *Cost* below).

- [The API in one screen](#the-api-in-one-screen)
- [Lifecycle](#lifecycle)
- [Extension points](#extension-points) (world build, level, nav, paint, level material, props, minimap, environment,
  match runtime, actors, online, bots, camera, HUD, queries, tools)
- [Hook-ins in shared files](#hook-ins-in-shared-files)
- [Contract tables](#contract-tables): bluestone (eras), aquarium (pipes), caldera (lava), the subs SPEC and Bazookarp
- [Testing](#testing) and [Cost](#cost)

## The API in one screen

```js
// src/game/lava.js (the stage engineer's file; src/game/stageModList.js already imports it)
import { registerStageMod, registerCause } from './stageMods.js';
import { emit } from '../core/ctx.js';

registerStageMod({
  key: 'lava',              // LAYOUT.lava switches it on (any layout carrying the key, mode variants included)
  order: 20,                // build hooks, ticks and queries run in this order (eras 10, lava 20, pipes 30)
  worldAs: 'lavaWorld',     // also publish W as G.lavaWorld (optional; the contracts' names)
  matchAs: 'lava',          // also publish R as match.lava (default: the key)
  liquid: true,             // G.level.liquidY asks this module (needed when only R answers liquidY; W.liquidY implies it)
  world: (ctx) => new LavaWorld(ctx),          // W: per world build; ctx = { key, data: LAYOUT.lava, layout, layoutId,
                                               //   worldKey, mode, dressing, scene }. Return null to sit this world out
  match: (m, W, S) => StageLava.create(m, W, S),   // R: per match; S = the StageRun (S.clock = the stage clock).
                                                   //   Return null to sit this match out (a mode that turns it 'off')
});
registerCause('lava', { name: 'Burned in the lava', knocked: 'Knocked into the lava', icon: LAVA_ICON, flood: '#a3121a', clear: true, byColor: '#ff5a2a' });
// events: the contract's own names, emitted by the module — emit('lava:warn', { to, at, inS }), emit('era:flip', …),
// emit('pipe:pop', …). (stageEmit(prefix, name, payload) is emit(`${prefix}:${name}`): its prefix is the EVENT's —
// 'era' / 'pipe' / 'lava' — not the module key: stageEmit('eras', 'flip') would emit 'eras:flip', which nobody hears.)
```

- `G.stageWorld`: the `StageWorld` (all modules' W for the current world), or `null`.
- `G.match.stage`: the `StageRun` (all modules' R for the current match, plus `S.clock`), or `null`.
- `G.<worldAs>` / `G.match.<matchAs>`: your own W / R. **Keep the contracts' names on them**: other packages call them
  directly — the subs read `G.match.lava.surfaceAt / under / covers`, Bazookarp reads `G.match.eras.dangerAt` and
  `G.match.lava.restMask`, both read the actor field `a.pipe` (the [subs / Bazookarp table](#the-subs-spec-and-bazookarp-interfaces-one-home-each)).
- Every hook below is **optional**: implement a method of that name on W or R and the registry calls it.
- Code that must not know any stage asks the registry's queries (`G.level.liquidY`, `G.level.noPlace`,
  `G.match.stage.restMask(...)`, `.danger(...)`, `.under(...)`, `.sink(...)`).

## Lifecycle

**World** (`main.js _buildWorldNow`, which every stage build goes through: boot, the menu backdrop, a match start, a
mode variant, a Practice stage swap). In order:

| step | call | what the module does there |
|---|---|---|
| 1 | old world: `SW.dispose()` → `W.dispose()` | free meshes, textures, listeners (before the prop kit goes); the registry then clears `G.env.themeOverlay` |
| 2 | `StageWorld.plan(layout, ctx)` → `def.world(ctx)` | read `ctx.data`; precompute what needs no Level |
| 3 | `W.prop(it, kit)` per dressing item → the item PropKit gets | tag a prop (eras: `bucketTag`); set `kit.tagMaterial` |
| 4 | `W.colliders(it, cols, kit)` → the colliders the Level gets | tag its colliders (eras: `{ eras, eraGroup }`) |
| 5 | `W.extraColliders()` → more collider defs | pipe glass `{ kind: 'seg', … }` |
| 6 | `new Level(layout, colliders)`, then `W.attachLevel(level)` | groups, keys, `level.geomAttrs`, flags on blocks |
| 7 | `W.attachPaint(paint)` | per-cell masks, `retireCells`, `paint.setClip(...)` |
| 8 | `W.levelMaterial({ grate })` → level-material extension(s) | shader uniforms and chunks |
| 9 | `W.levelFilter()` → the main level mesh's block filter | eras: only shared blocks |
| 10 | `W.afterMeshes({ scene, level, size, levelMat, grateMat, levelMesh, grateMesh, props })` | era meshes, pipe glass, lava surface, prop material patches (`props` = the PropKit) |
| 11 | `W.navEdges(level)` → special edge specs; `W.buildNav(level, physics)` → a graph or nothing; `W.attachNav(nav)` | pipe edges; merged era / pose graphs |
| 12 | `W.attachMinimap(mm)` | `mm.setBase(...)` per state |
| 13 | `W.attachEnv(env)` (now, and at boot once the Environment exists) | extra surfaces, theme overlay, backdrop sets |
| 14 | `W.ready()` | the world rests in its starting state (eras: `apply(1, { instant })`) |

`W` lives until the next world build. It survives matches on the same stage. At boot the first world is built before
`G.game` and `G.env` exist: use the kit handed to `prop` / `colliders` / `afterMeshes` (`o.props.buildPart`), not
`G.game.props` or `stageKit.buildLook` (which return an empty group then), and wait for `attachEnv` for the environment.

**One W serves every mode that shares a world key.** A mode gets its own world (and lightmap) only when a `single` /
`half` piece or a dressing item differs in it (`variants.js` `variantKey` / `hasVariant`). `ctx.layout` is
`layoutFor(layout, mode)` (those two lists filtered); `ctx.data` (`LAYOUT[key]`) is passed as it is. A module item
carrying `onlyIn` / `notIn` (the lava's riders, steps, falls) is the module's to filter with `inMode(it, mode)`
(`variants.js`): per match, from `m.mode` in `def.match`, for anything the match builds (dynamic blocks); and at world
build only for what the world key already separates (a world-level difference that no `single` / `half` piece makes
needs one such piece, or the nav must cover every mode's set).

**Match** (`match.js`, both `setup()` and `_setupRoster()`, offline and online, Practice and the menu backdrop):

| when | call |
|---|---|
| setup, after the actors stand on their pads, **before** Zone Control / Tower Command / Boss Battle, the movers and the pods | `StageRun.create(match)` → `def.match(match, W, S)` |
| every frame, before the movers, pods and actors | `S.update(dt)`: ticks `S.clock`; a jump of > 1 s calls `R.seek(t, 'clock')`; then `R.update(dt, t)` |
| every frame, after the pods | `R.lateUpdate(dt, t)` |
| match end, Practice stage swap, menu | `R.dispose()` (first in `Match.dispose`, before the movers clear dynamic blocks); the registry then clears `nav.ext` and the heat shimmer |

While `def.match` runs, `G.match` is still the previous match (or null), and `m.zones`, `m.tower`, `m.bossMode`,
`m.movers`, `m.pods` don't exist yet: use the `m` you are given, and read those from `update`. The match's first actors
were made (and reset) before R existed, so `R.actorReset` isn't called for them: set your per-actor fields for
`m.actors` in `def.match` (later respawns, and actors added in online Practice, do get `actorReset`).

`S.clock` is a `StageClock` (`stageKit.js`): the host's match clock (`duration − time`) that every follower tracks,
carried on by frame time in overtime, Practice and the menu backdrop; online Practice followers ride the host's
`stageSync`. Build anything time-driven as a **pure function of `S.clock.t`** and implement `R.seek(t, why)` to re-derive
it at once (`why`: `'clock'` a follower's snap, `'late'` a late joiner): then a late joiner, a follower after a hitch
and a new host all agree with no records. The clock stands still outside `'playing'` (the intro, the finish).

## Extension points

Each with the smallest example. "W." hooks are on your world object, "R." hooks on your match runtime.

### World build

```js
prop(it, kit) {   // kit = the PropKit being filled (G.game may not exist yet at boot)
  kit.tagMaterial ||= (key, tag, base) => eraMaterial(base);
  return it.eras ? { ...it, bucketTag: 'e' + eraMask(it.eras), bucketVec: [eraMask(it.eras), eraR(it)] } : it;
}
colliders(it, cols, kit) { return it.eras ? cols.map((c) => ({ ...c, eras: it.eras, eraGroup: it.eraGroup })) : cols; }
extraColliders() { return pipeColliderDefs(this.layout); }      // [{ kind: 'seg', a, b, w, h, pipe, glass, roof }]
levelFilter() { return (b) => !b.grate && b.presence === 0; }  // the main mesh: shared blocks only
afterMeshes({ scene, level, size, levelMat, grateMat, props }) { this.meshes = buildEraMeshes(scene, level, size, levelMat, grateMat); this.tagProps(props); }
ready() { this.apply(1, { instant: true }); }
```

### Level (`src/world/level.js`)

- **Block fields**: `Level.blockField(key, (b, d, level) => {})`. When a layout def or a prop collider carries `key`,
  the function runs at the end of `Level._addBlock` (prop colliders forward every registered field). Register it at
  module load. **Only blocks that carry the key get the call**: an untagged block has no `b.eras`, `b.eraG` … — read
  `b.presence || 7`, or give every block its defaults in `W.attachLevel`.
  ```js
  Level.blockField('eras', (b, d, level) => { b.eras = eraMask(d.eras); b.presence = b.eras === 7 ? 0 : b.eras; level.presenceAll = 7; });
  Level.blockField('eraGroup', (b, d) => { b.eraGroup = d.eraGroup; });
  Level.blockField('bakeClear', (b) => { b.bakeClear = true; });
  ```
- **Block kinds**: `Level.blockKind('seg', { build(b, d) { …center, half, axes, aligned… }, mirror(d) { return {…} } })`.
  A prop collider or a `W.extraColliders()` def with `kind: 'seg'` is built by it. Keep custom kinds there, **not in
  `LAYOUT.single` / `half`**: the Level would build them (and mirror `half` ones), but `mapThumb.js` and
  `build/check-maps.mjs` read layout defs as box / obox / ramp only (draw yours with the `thumb` hook).
- **Presence** (`b.presence`: a bit mask of the states the block exists in, 0 = every state; `level.presenceAll`: the
  full mask, e.g. 7, set from the block field so it is known before the faces are built):
  `pointInside(p, pad, exclude, need)` skips blocks whose presence lacks `need`; face hiding, the grounded-bottom test
  and the bevel test pass the block's own presence (a shared block: `presenceAll`), so a face pressed against a block of
  another era keeps its faces. Stages without it: 0 everywhere, nothing changes.
- **Colliders that move or come and go** (the existing `Level` API, which every query already sees):
  `G.level.addDynamic({ tag, roof, perch })` → a block, `moveDynamic(b, center, half, yaw)` (it keeps `b.dp`, the move it
  just made: what a moving block did last frame, which riders, devices and the buoy follow), `b.solid = false` to take
  one out (park it far below to leave every query, as pods / lava do), `clearDynamic()` at match end (the movers / pods
  do it too, after `R.dispose`). Static pieces that switch (eras) stay hash blocks: toggle `b.solid` (+ `b.absent`).
- **Absent** (`b.absent = true` with `b.solid = false`): a block a module took out of play. The nav climb-bar test and
  `paint.regionStats` skip it (they don't read `solid` alone).
- **Geometry attributes**: `level.geomAttrs = [{ name: 'aEra', size: 2, value: (b) => [b.presence || 7, b.eraR || 0] }]`
  adds a per-vertex attribute to every `buildGeometry` from then on (set it in `W.attachLevel`).
- **Queries**: `level.liquidY(x, z)` (the liquid surface there; default the sea's −1.6) and `level.noPlace(p, r)` (no
  device may be placed in that disc; default false). On a stage with modules, `liquidY` is answered by `W.liquidY` /
  `R.liquidY` (installed when a W has `liquidY` or the def says `liquid: true`; the highest wins, never below the sea)
  and `noPlace` by `W.noPlace`, then `R.noPlace` (any one saying "no place" wins).
- **Special edges**: `level.extraEdges` (set from `W.navEdges()` before the graph is built).

### Nav (`src/game/nav.js`)

- **Special edges**: `W.navEdges(level)` → `[{ a: [x, y, z], b: [x, y, z], cost, type: 'pipe', key, len, …any }]`.
  `NavGraph._extraEdges` links the nearest node within 0.8 m (xz) and 0.6 m (y) of each end; specs that don't resolve
  go to `nav.edgeProblems`. Edges keep every extra field. `nav.hScale` (= min(1, cost ÷ straight distance) over the
  special edges) scales A*'s heuristic so a cheap long edge is never skipped; 1 on every other stage.
- **A whole graph**: `W.buildNav(level, physics)` → your own `NavGraph` (eras: three builds merged; lava: two poses
  merged). Without it, `new NavGraph(level, physics)`. `W.attachNav(nav)` either way. It runs after the paint system
  (climb edges need `f.atlas`).
- **Edge mask**: `nav.edgeMask = bit` skips every edge with `e.em !== undefined && !(e.em & bit)` (eras' `e.em`). It lives
  on the graph (the world): set it at match start too.
- **Per-match rules**: `R.navEdge(e, toId, metres)` → extra cost, or `Infinity` to forbid it, on every edge `path()`
  relaxes, climbs included (a climb's own penalty is added to yours) (pipes: `pipeShut`, per-bot cost; lava: time
  windows at the arrival time `now + metres × sPerM`, with `R.navTimed = true` so `path()` keeps the metres walked
  without penalties). `R.navNode(id, start)` → false: `nearest()` never returns it (start and goal).
  ```js
  navEdge(e, to, metres) { if (e.type !== 'pipe') return 0; const k = e.key; return this.shut[k] ? Infinity : this.botX ? this.botX[k] : 0; }
  ```
- **Layers**: the existing `stageKit` `navClaim(owner) / navCommit(actors) / navRelease(owner)` (+40 to enter, never a
  goal, bots replan) work for modules too. To make bots replan after your own rule changed (a pipe shut, an era done),
  drop the paths that use it: `for (const a of m.actors) if (a.bot?.path && uses(a.bot.path)) { a.bot.path = null; a.bot.repath = 0; }`.

### Paint (`src/world/paint.js`)

- **Every splat**: `R.onSplat(center, radius, team, opts)` (local and replayed, after the pods; not cosmetic ones).
- **Block gate**: `W.inkOk(block, et)` → false: that block's faces take no ink from this splat. `et` is the painter's
  stage time (`opts.et`; local splats: `G.match.stage.t`).
- **Painter's time on the wire**: `R.splatTime(center, radius)` → a stage time, or undefined. When defined, the splat
  record carries it as field 15 and every screen replays with `opts.et` = it.
- **Clip**: `paint.setClip({ map, box, faceOn(f), clipAt(et), inside(x, z) })`: cells of faces with `faceOn(f)` whose
  centre is `inside` and below `clipAt(et)` take no ink, and the atlas draw discards the same texels (`map`: a
  DataTexture whose R > 0.5 marks inside, `box` = Vector4(x0, z0, 1/w, 1/d)). `faceOn` is read once, when `setClip` is
  called (mark your faces first: `f.lava`). Growing splats re-evaluate the clip. `paint.setClip(null)` removes it (and
  the shader define).
- **Generic edits**: `paint.clearCells(ids, sample?, max = 96)` (zero cells, counts down; `sample` gathers up to `max`
  pairs `[cell, team]` of the inked ones, for steam; returns how many were inked — pass a range of a sorted list as
  `ids.subarray(from, to)`), `paint.retireCells(ids)` (never turf: dead, not live, `turfTotal` / `turfArea` down),
  `paint.clearFaces(faceIds)` (grid cells and atlas rects to zero), `paint.drawInto(scene)` (render your own quads into
  the atlas, `_wipeBand`-style), `paint.cellWorld(k, out)` (a cell's centre).

### Level material (`src/world/levelMaterial.js`)

`W.levelMaterial({ grate })` → one extension or a list; `createLevelMaterial(…, { ext })` applies them. Without any, the
program is byte-identical to today's (and its cache key too).

```js
levelMaterial({ grate }) {
  return { key: 'lava', uniforms: this.uniforms, defines: { LAVA: 1 },
    fragPars: LAVA_GLSL.pars,        // fragment, global scope (after our own globals): uniforms, varyings, globals
    fragBase: LAVA_GLSL.base,        // before the wet-ink block: acts on the bare surface (`base`)
    fragEmissive: LAVA_GLSL.emissive,// after the ink emissive
    fragFinal: LAVA_GLSL.line };     // before the clear-ink wave term (outgoingLight)
}
```

Slots: `vertPars` (vertex, global scope: attributes, varyings), `vertMain` (after `#include <project_vertex>`),
`fragPars`, `fragBase`, `fragMural` (right after the mural texel `mc` is read; `mi` is the mural id: eras' mural masks),
`fragEmissive`, `fragFinal`, and `aoSample` (a GLSL expression replacing `texture2D(uLight, vLightUv).r` in the baked-AO
term: eras' AO channel). A value `fragBase` computes for a later slot (eras' `eraOneHot` for `aoSample`) must be a
global declared in `fragPars` (`fragBase` sits inside a block). `uniforms` are shared objects (merged by reference). The
cache key gets `-<key>` per extension. The page test proves every slot lands at its anchor exactly once.

### Props (`src/world/props.js`)

A placement may carry `bucketTag: 'e3'` (and `bucketVec: [a, b]`): its parts go to their own merged meshes
(`material@tag`, with a per-vertex `aTag` = bucketVec), named `props:<material>@<tag>`, `mesh.userData.tag` = tag. Set
`kit.tagMaterial = (key, tag, base) => material` before `kit.build()` to give those meshes their own material (eras: a
clone with the era vertex collapse). Untagged placements are merged exactly as today. Only merged parts are tagged
(spinners, blinkers, flags and cloth stay untagged: the eras' rule 40). The kit's materials (`kit.mat.*`) are its own
(one kit per world), so a module may patch them in `afterMeshes` (the lava's stain), before the first render.

### Minimap (`src/game/minimap.js`)

- `W.mapBlock(b)` → false: that block is left out of the base raster (pipes: glass; eras: absent blocks). The base's
  block test is then `b.solid && every module's mapBlock(b)`.
- `mm.setBase(key, present?)`: switch the base raster to a cached one for `key`, built the first time with `present(b)`
  as the whole block test (solidity included: eras' "present in era e", whether solid now or not; null = the default
  test above). Key the first base yourself (`setBase(1, p1)` in `W.ready`); build the others in idle time
  (`setBase(2, p2); setBase(3, p3); setBase(1)`: ~0.1–0.3 s each), then swap at done (free). The viewer's side flip
  rebuilds the current base with the default test (keep `mapBlock` true to the live state: `!b.absent`) and drops the
  cached ones, which the next `setBase` of their key rebuilds.
- Live layer: `R.drawMap(c, mm, tc, s, hex, t, me)` every frame, after the zones / tower / devices, before the
  specials (the corner map, and the expanded map while aiming a strike).
- The TAB map is the diorama (`ui/diorama.js`): the live scene from overhead, so the module's world looks show there as
  they are. For pins or labels over it: `R.diorama(root, cam, W, H, k)` each frame while it is open (`root` = its
  overlay element: add your own elements once, place them by projecting with `cam`; `k` = how far it is open).

### Environment (`src/world/environment.js`)

- `LAYOUT.env.sea: false` hides the sea mesh (and with it its planar reflection pass: the sea's `onBeforeRender`). The
  death plane is unchanged.
- `G.env.addSurface(obj)` → a remove function (call it in `W.dispose`): a liquid surface or any big look of yours, added
  to the environment root with its GTAO gate (transparent meshes sit out the override pass), frustum culling off.
  `G.env.U` are the sky / sun / fog uniforms to read (`uSunDir` …), `G.env.sun` the sun light, `G.env.grade` the grade
  (the renderer re-applies it when the object changes), `G.env.sceneryMaterial(flags, params)` the backdrop kit's
  material. Opaque meshes of yours that must sit out GTAO (era meshes mid-jump): `mesh.onBeforeRender = (r, s, c, g) => {
  g.drawRange.count = s.overrideMaterial ? 0 : Infinity; }` (drainbowFx.js's `noAO`).
- `G.env.themeOverlay = (name) => overrides | null`: layered after the stage's `env.theme` when a theme is applied
  (`setTheme`; `G.env.setTheme(G.env.theme)` re-applies it). The registry clears it with your world. Cheap mid-match
  blends (eras' look per era) write `G.env.U` uniforms directly.
- Backdrop sets: a stage backdrop may return `sets: { key: { static, plain, terrain, instances, objects } }` beside its
  main set (the eras contract calls it `eras: { 1: …, 2: …, 3: … }`: name it `sets`). Each is built like the main set
  into `G.env.stageSets[key]` (a Group, hidden; it exists by `attachEnv` / `ready`); a module shows / hides them (eras'
  skyline per era).

### Match runtime: actors (`src/game/actor.js`, `match.js`)

| hook on R | called | return |
|---|---|---|
| `actorReset(a)` | `Actor.reset` (respawn, every reset after R exists) | — (clear your fields on the actor) |
| `ownsBody(a, dt)` | `Actor.update`, right after the dead branch | true = you moved the actor; the frame finishes there (a pipe ride). False after forcing intents off is fine (the pop phase) |
| `damageGuard(a, amount, attacker, source)` | `Actor.damage` after invuln (the victim's owner); `applyHit` before its `'hit'` event (**the shooter's screen**: `a` may be a proxy — answer from what that screen knows: `a.pipe` set by your `carryRemote`, the `F.stage` flag) | true = drop it |
| `canSuperJump(a)` | `Actor.canSuperJump` | false = refuse |
| `jumpAnchor(a)` | `Actor.jumpAnchor` | a Vector3 (where teammates land), or null |
| `kill(a)` | `Actor.update` before the sea check, and after a body special's update (the owner's actors) | true = you splatted it: `a.splat(a.lastDamage < 4 ? a.lastAttacker : null, 'lava')` (the sea's credit rule) |
| `fallCause(a)` | the sea check's cause | a cause id (`'lava'` in a chute), or null (`'water'`) |
| `superJumpLanding(a, s)` | charge → flight, not on the tower | — (move `s.to`) |
| `noPush(a)` | the soft push between actors | true = skip this actor |
| `noShove(a)` | `stageKit.shovable`, `subs.blockActor` | true = never shove it |

### Online (`src/net/netmatch.js`)

- **Stage clock in Practice**: the host's tick carries `S.clock.t` when there are no movers or pods (followers' clocks
  ride it). Nothing to do.
- **Records**: `S.rec(key, data)` → `['sm', key, data]` on the sender's timeline; every other screen calls
  `R.netEvent(data, from)`. The host records host-run state (`!match.follower`); an owner may record its own actor's
  state. Owner-simulated objects can also use the kits' `KIT_GHOSTS[kind]` + `recKit` path unchanged (the pipes' rides).
- **Late join** (Practice): `R.netSnapshot()` on the host → the joiner's start config → `R.netRestore(data, t)` once the
  joiner's stage clock is the host's, then `R.seek(t, 'late')`. Put absolute stage times in the snapshot.
- **An actor flag**: `R.netFlag(a)` → true sets tick flag bit 22 (`F.stage`; aquarium's `F.pipe`; the subs' `F.dash` is
  bit 23); every other screen gets `R.carryRemote(a, flag, dt)` after the sample is applied (flags, form, yaw set),
  before the frame finishes.
- `R.adopt(a)` (this screen took over a squidkid: `_adopt`), `R.hostChanged(isHost)`.
- **Painter's time**: `R.splatTime` (above).

### Bots (`src/game/bots.js`, `botSight.js`, `stageKit.js`)

| hook on R | where | use |
|---|---|---|
| `botHold(b)` | `BotBrain.update`'s super-jump early return | true = the bot does nothing this frame (riding) |
| `edgeTypes: ['pipe']` + `botSteer(b, edge, out)` | `_steer`, after the waypoint advance, when the next edge's type is yours (and the ledge-replan exception) | return `out` (the move) or null |
| `beforePath(b)` | `_pathTo`, before `nav.path` | set your per-bot nav rule state (`this.botX = …`) |
| `botAct(b, dt, it, move, vis)` | after the pods' bot hook | an aim (Vector3) to take over, or null |
| `wet(x, z, gy, ahead)` | `_wet`, `_avoidWater`, `_squidWouldDrop` (ahead 0.5), `stageKit.floorFor` (ahead 1) | true = feet on that floor would be in your hazard (now or within `ahead` s) |
| `goalWeight(id)` | `_pickPaintGoal` | × on a paint goal's score (eras' fresh nodes ×2) |
| `sightLanding(e)` | `botSight` `check` / `recheck` | a Vector3: remember this enemy there (`src: 'jump'`), never target it |

`ZonePlan` skips ring / far nodes that are not `nav.valid` now (eras swap `valid`). Its ring is built from
`nav.validIds` when the match starts: a merged graph's `validIds` should list the nodes valid in any state.

### Camera (`src/game/cameraRig.js`)

`R.cam(rig, a, dt)` → null, or `{ glide, boom, fov, skip }`: `glide` follows like super-jump flight (no strafe
look-ahead), `boom` / `fov` are added, `skip` names a block flag the boom probe ignores (`'pipe'`; reset after the probe
whatever happens). You may set `rig.yaw` / `rig.pitch` yourself. `R.camAfter(rig, a, o)` runs after the probe (the water
clamp: shorten `rig.curDist` / `rig.boom.x`). The lens never dips under a module's liquid (`G.level.liquidY` + 0.15).

### HUD (`src/ui/hud.js`, `main.js`, `screenfx.js`)

- `R.prompt(a)` → a prompt string for the local player (after a running special's).
- `R.hud(a)` → your object at `frame.stage[key]` (called every frame: a cheap place to update your own DOM too);
  `noReticle: true` on it hides the reticle and the sub chip.
- Your own DOM goes in **`G.hud.el`** (the HUD layer: shown only in a match, hidden in menus, with the team colours as
  CSS variables, as `hud-boss.js` does), or **`G.hud.timer`** for a chip under the match clock (Zone Control's and Tower
  Command's sit there: the era chip, the tide pill). Remove it at `R.dispose()`. Callouts and banners:
  `S.callout(text, sub, big)` / `S.banner(kind, text)` (skipped on the menu backdrop), from your own `on('lava:warn', …)`
  listeners.
- Causes: `registerCause(id, { name, knocked, icon, flood, clear, byColor })` (the splat card, the feed, the screen flood).
- Heat shimmer: `G.game.screenfx.heat = k` (0..1, on the swim wobble); the registry sets it back to 0 at match end.

### Queries (anyone, any time)

| query | answered by | default |
|---|---|---|
| `G.level.liquidY(x, z)` | W / R `liquidY` | −1.6 (the sea) |
| `G.level.noPlace(p, r)` | W `noPlace`, then R `noPlace` | false |
| `G.match.stage?.under(p, depth)` | R `under` | false |
| `G.match.stage?.sink(p, what)` | R `under`, then R `fizzle(p, what)` | false (shots, bombs, thrown subs, the buoy, the Shaker / Torpedo / Tracer / Waddle sink there: no splat, no blast) |
| `G.match.stage?.sweeps(out)` | R `sweeps(out)` | [] (Bazookarp rest flags: the boxes a module's moving pieces cover over their whole travel) |
| `G.match.stage?.restMask(state)` | R `restMask` | null (Bazookarp: `Uint8Array` over nav nodes, 1 = standable in that state) |
| `G.match.stage?.danger(pos, pad)` | R `danger` | false (Bazookarp drop spot, bots) |
| `G.match.stage?.crushIn(shape, how)` | `G.deploy.crushIn` (subs SPEC §0.3) | **0: a no-op until the subs package adds `G.deploy.crushIn` (no batch-5 branch has it yet)** |
| `G.match.stage?.state()` | R `state` | `{ t, keys }` (tests) |

### Tools

- `PAGEQ='era=2'` (or `'lava=high'` …) on any botlab harness (page, shoot, stageart, match, bake, tower-check, netpage):
  every game page loads with that query too (`tools/botlab/offscreen-boot.cjs`). A module reads its audit switch from
  `location.search` itself. This is the contracts' `ERA=` / `LAVA=` (bluestone T3, caldera T1 / T2). It holds for the
  whole run (stageart loads the page once for all its `STAGES`).
- **Per-state bakes**: `W.bakePasses()` → up to three functions, each putting the world in one state (eras:
  `[() => this.apply(1, { instant: true }), () => this.apply(2, …), () => this.apply(3, …)]`). `build/bake-ao.cjs` and
  `tools/botlab/bake.cjs` then trace once per state into its own channel of an RGB PNG (colour type 2; the JSON gets
  `channels: 3`) instead of the gray one; `W.bakeMode(false)` afterwards puts the world back. `W.bakeMode(on)` round the
  trace either way (pipe glass, `bakeClear` blocks out of the AO).
- `src/world/mapThumb.js`, `build/check-maps.mjs`: the three-free data registry `src/world/stageData.js`:
  `registerStageData(key, { thumbBlock(d), thumbBelow(layout, api), thumb(layout, api), check(layout, api) → problems[],
  overlapOk(a, b) })`, imported by `src/world/stageDataList.js` (stub files `eras-data.js`, `pipes-data.js`, `lava-data.js`).

## Hook-ins in shared files

Every one is tagged `[b5-stagehooks]` (`grep -rn b5-stagehooks src build tools`). They call the registry, or apply a
generic extension that does nothing until a module sets it.

| file | where | what |
|---|---|---|
| `src/main.js` | imports (+ `stageModList.js`); boot (`attachEnv`); `_buildWorldNow` (the 14 steps); `on('splatted')`; prompts; frame | the world chain, causes, `R.prompt`, `frame.stage` |
| `src/game/match.js` | both setup paths (before the modes); `update` (early / late); `dispose` (first); soft push | `StageRun`, ticks, `noPush` |
| `src/net/netmatch.js` | `F.stage` (bit 22); `packActor`; `recSplat` (field 15); `recStage`; `_sendTick` (clock); `applyRemote` (`carryRemote`); `_play` `'s'` (`opts.et`) and `'sm'`; `_hostClock` (late restore); `onLeave` (`hostChanged`); `_adopt` | online |
| `src/net/session.js` | `_practiceJoin` | the late joiner's snapshot (`stage`) |
| `src/game/actor.js` | `reset`; `update` (body, kill ×2, fall cause); `damage`; `jumpAnchor`; `canSuperJump`; `_updateSuperJump` | actors |
| `src/world/level.js` | `Level.blockField` / `blockKind`; extras forward fields / kinds; `presence` in `pointInside`, face hiding, grounded bottom, bevels; `geomAttrs`; `liquidY` / `noPlace` defaults | the level |
| `src/game/nav.js` | `ext` / `edgeMask` / `hScale`; `_extraEdges`; `path()` (mask, rule, metres, heuristic; the climb rule adds to the rule's cost); `nearest()` (node rule); `_climbBarred` (`absent`) | nav |
| `src/game/physics.js` | `skip` in `raycast` | the ride camera's probe |
| `src/world/paint.js` | `onSplat`, `blockGate`, `et`, clip (shader `#ifdef CLIP`, CPU cells, growth, quads, import); `regionStats` (`absent`); `setClip`, `cellWorld`, `clearCells`, `retireCells`, `clearFaces`, `drawInto` | paint |
| `src/world/levelMaterial.js` | `opts.ext` (uniforms, defines, slots, cache key) | the level shader |
| `src/world/props.js` | `bucketTag` / `bucketVec` (`_push`, `add`, `mergeParts` `aTag`, `build` + `tagMaterial`) | prop buckets |
| `src/game/minimap.js` | `blockOk` in `_build`; `setBase`; the cache on a side flip / theme change; `drawMap` in `_compose` | maps |
| `src/world/environment.js` | `env.sea`; `themeOverlay`; `out.sets` → `stageSets` (with instances: the shared instance builder); `addSurface`; `sceneryMaterial` | environment |
| `src/game/cameraRig.js` | `cam` / `camAfter`; `glide`, `boom`, `fov`, `skip`; the lens over a module's liquid | camera |
| `src/game/bots.js` | `botHold`; `botAct`; `wet` in `_wet` / `_avoidWater` / `_squidWouldDrop`; `beforePath`; `goalWeight`; `edgeTypes` + `botSteer` in `_steer`; ZonePlan `valid` | bots |
| `src/game/botSight.js` | `sightLanding` in `check` / `recheck` | bot sight |
| `src/game/stageKit.js` | `shovable` (`noShove`); `floorFor` (`wet`) | shoves |
| `src/game/weapons.js` | `applyHit` (`damageGuard`); `_step`, `_updateBombs` (`sink`) | shots |
| `src/game/subs.js` | `_fly` (`sink`); `blockActor` (`noShove`) | subs |
| `src/game/sp-surf.js` | the buoy's lost test (`under`) | the buoy |
| `src/game/kits/shaker.js`, `torpedo.js` (×3), `tracer.js`, `waddle.js` (×2) | beside each sea test (`sink`) | kit items |
| `src/ui/hud.js` | `splatCause` (env causes); `noReticle` | HUD |
| `src/ui/diorama.js` | `update` (`R.diorama`) | the TAB map |
| `src/fx/screenfx.js` | the flood (env causes); `uHeat` (`screenfx.heat`) | screen FX |
| `src/core/envCauses.js` (new) | `registerCause` / `envCause` | causes |
| `src/world/mapThumb.js`, `build/check-maps.mjs` | `stageDataFor` (`src/world/stageData.js`, new) | tools |
| `build/bake-ao.cjs`, `tools/botlab/bake.cjs` | `stageWorld.bakeMode` round the trace; `bakePasses` (one trace per state, an RGB PNG) | bake |
| `tools/botlab/offscreen-boot.cjs` | `PAGEQ` | harness |

New files: `src/game/stageMods.js`, `src/game/stageModList.js`, `src/game/eras.js` / `pipes.js` / `lava.js` (stubs:
the engineers replace them), `src/world/stageData.js`, `src/world/stageDataList.js`, `src/world/eras-data.js` /
`pipes-data.js` / `lava-data.js` (stubs), `src/core/envCauses.js`.

## Contract tables

One row per hook-in of each stage's `ENGINE.md` (its numbering). **served** = the registry hook that serves it; the
module implements it in its own file. **module-private** = no shared edit at all (the module uses an existing API).
**by hand** = a shared-file edit the stage engineer still makes. **No contract line is "by hand" today.**

Three conventions the contracts did not use, used here:
- An era-masked or absent block is `b.absent = true` with `b.solid = false` (the contract's `b.eraOff`): nav's climb
  bar and `paint.regionStats` read `absent`.
- The presence mask is `b.presence` (the contract's `b.eras`, with 7 written as 0): set it in the `eras` block field.
- Pipe glass colliders are `{ kind: 'seg', … }` (the contract's `{ seg: true, … }`), built by a registered `seg` kind.

### Bluestone Junction: eras (`stages/bluestone/ENGINE.md` §3.5)

| # | hook-in | served by |
|---|---|---|
| H1 | `Level._addBlock`: `eras`, `eraGroup`, `eraG`, `eraR`, `eraOff` | **served**: `Level.blockField('eras', …)` / `('eraGroup', …)` (set `b.eras`, `b.presence`, `level.presenceAll = 7`); `eraG` / `eraR` in `W.attachLevel`; `eraOff` → `b.absent`. Untagged blocks get no field call: give every block its defaults in `W.attachLevel` (`eras 7, eraG −1, eraR 0`) or read `b.presence \|\| 7` |
| H2 | `Level._build`: forward `eras` / `eraGroup` from prop colliders | **served**: registered fields ride prop colliders (`W.colliders(it, cols)` tags them) |
| H3 | `pointInside(…, need)`; `_faceHidden`, `groundedBottom`, `bevelled` pass the block's mask | **served**: `b.presence` (0 = every era) + `level.presenceAll` |
| H4 | `buildGeometry`: `aEra` per vertex | **served**: `level.geomAttrs = [{ name: 'aEra', size: 2, value: (b) => [b.presence \|\| 7, b.eraR \|\| 0] }]` in `W.attachLevel` |
| H5 | `paint.splat` block loop `inkOk(b, et)`; `regionStats` skips `eraOff` | **served**: `W.inkOk(b, et)` (the block gate; `et` = `opts.et ?? S.t`); `b.absent` |
| H6 | `paint.clearFaces(faceIds)` | **served**: `paint.clearFaces` |
| H7 | `NavGraph.path` `eraBit` mask; `_climbBarred` skips `eraOff` | **served**: `nav.edgeMask = bit` (edges with `e.em`; set it at match start, it lives on the graph); `b.absent` |
| H8 | `createLevelMaterial(…, { eras })`: uniforms, `aEra`, `fragBase`, `fragAO`, `fragFront`, key `-eras` | **served**: `W.levelMaterial()` → `{ key: 'eras', uniforms, defines: { ERAS: 1 }, vertPars (attribute aEra, varyings), vertMain (ERA_GLSL.vert), fragPars (+ the global vec3 eraOneHot), fragBase (sets eraOneHot), aoSample: 'dot(texture2D(uLight, vLightUv).rgb, eraOneHot)', fragFinal (fragFront) }` |
| H8b | mural era masks `uMurEra[12]` | **served**: the `fragMural` slot (`mc.a *= …` with `mi`), the uniform in `uniforms` |
| H9 | `main._buildWorldNow` chain | **served**: `W.prop` / `colliders` / `attachLevel` / `attachPaint` / `levelMaterial` / `levelFilter` (`(b) => !b.grate && !b.presence`) / `afterMeshes` (`buildMeshes` while every block is solid) / `buildNav` (three builds merged, after the paint) / `attachMinimap` / `ready` (`apply(1, { instant })`, after `rebuildForArena`) |
| H10 | `match.js`: create before the modes, update before the movers, dispose | **served** (`def.match`, `R.update`, `R.dispose`); boss `fixed` era is applied in `def.match`, before `BossMode` |
| H11 | `netmatch`: the Practice clock, splat field 15, `opts.et` | **served**: the clock (nothing to do), `R.splatTime(c, r)` (return `S.t` when `near(t)`) |
| H12 | `PropKit` era buckets, `eraMaterial`, depth material, `userData.eraMask` | **served**: `W.prop(it, kit)` → `{ …it, bucketTag: 'e' + mask, bucketVec: [mask, eraR] }` and `kit.tagMaterial = (key, tag, base) => eraMaterial(base)`; depth material and visibility on the tagged meshes in `W.afterMeshes({ props })` (`props._meshes`, `userData.tag`). Spinners / blinkers stay static (rule 40) |
| H13 | environment: `_stageTheme(name, era)`, era backdrop sets, `setEra` blend, time-lapse | **served**: `G.env.themeOverlay` (cleared with the world); the backdrop's `eras: {…}` returned as `sets: { 1: {…}, 2: {…}, 3: {…} }` (static, plain, terrain, instances, objects) → `G.env.stageSets[e]`; the blend / time-lapse write `G.env.U` (sky, haze, fog, `uSunDir`), `G.env.sun`, `G.env.grade` (module-private); the far clip by `length(vW.xz)` on a set: put those meshes in the set's `objects` with the module's own materials (`G.env.sceneryMaterial(flags)` + an `onBeforeCompile`); the env map at done: `G.env.setTheme(G.env.theme)` (re-applies with the overlay) |
| H14 | minimap: `_build(present)`, per-era bases, `setEra`, outlines | **served**: `W.mapBlock` (`!b.absent`), `mm.setBase(era, present)` (its `present` is the whole test: "present in era e", not `solid`), three bases in idle time, `R.drawMap` (outlines) |
| H15 | HUD: era events → callouts / banner, the era chip | **module-private**: the module's own `on('era:warn', …)` → `S.callout` / `S.banner`; the chip is its own DOM in `G.hud.timer` (under the clock); the events are `emit('era:warn', …)` with the contract's names (§3.7) |
| H16 | bots: `fresh` ×2 paint goals; ZonePlan skips invalid ids | **served**: `R.goalWeight(id)`; ZonePlan (done: it skips `!nav.valid[id]` at pick time; its ring comes from `nav.validIds` at match start, so the merged graph's `validIds` must hold every era's nodes) |
| H16b | (optional) pre-position, perches | **served**: `R.botAct` (pre-position), `R.goalWeight` (perches) |
| H17 | subs items on a flipped block, the buoy | **module-private** (no subs.js line): in the module's own flip code, on each screen, for `it` of `G.subs.items` with `!it.ghost && it.state !== 'dead'` (this screen's own): `(it.face >= 0 && off.includes(G.level.faces[it.face].block)) \|\| on.some((id) => G.level.pointInBlock(G.level.blocks[id], it.pos, 0.15))` (`on` / `off`: the flip's block ids) → `G.subs._destroy(it)` (the Mega Stamp in specials.js does the same; SubSystem's update then sends the owner's `[2, gid]` end record, which ends the ghosts). The buoy needs nothing: it re-tests its floor every frame (`sp-surf.js _floor`), drops when the block goes non-solid and anchors again. Once the subs package adds `G.deploy.crushIn`, `S.crushIn({ where }, 'flip')` may replace the walk; the sentry and the bobber listen to `era:flip` themselves (subs SPEC §0.6), so the event payload `{ group, on, off, r }` (block ids) is an interface: keep it |
| H18 | movers parking per era | not needed on Bluestone (the contract says so) |
| H19 | `mapThumb`: era 1, later eras dashed | **served**: `registerStageData('eras', { thumbBlock: (d) => … 'skip' / 'dashed' })` in `src/world/eras-data.js` |
| H20 | none | — |
| H21 | Bazookarp `karpField.setState(era)` at `era:done`, `dangerAt` | the Bazookarp side listens to `era:done` and calls `G.match.eras.dangerAt(node)` itself (its SPEC §2.7): keep `dangerAt(pos, pad)` on R (`matchAs: 'eras'`), and `R.danger` → `this.dangerAt` for the generic query. Per-era `valid` arrays: expose them on W (the Bazookarp builder reads your name) |
| T1 | bake ×3 into R / G / B | **served**: `W.bakePasses()` → `[() => apply(1, { instant: true }), () => apply(2, …), () => apply(3, …)]`; the bake writes an RGB PNG (channel e−1 = era e) and `channels: 3` in the JSON (the contract's `eras: 3`); `W.bakeMode(false)` returns to era 1. The loader takes an RGB PNG as it is |
| T2 | `check-maps`: era-aware overlaps, per-era builds, the static rules | **served**: `registerStageData('eras', { overlapOk(a, b), check(layout, api) })` (`api` = `{ id, mode, defs, solids, shape, corners, overlap2D }`: build `bluestone#1…#3` there) |
| T3 | `ERA=` in shoot / stageart / tests; `ERA_FROM` / `ERA_TO` / `FRONT` | **served**: `PAGEQ='era=2'` (or `'erafrom=1&erato=2&front=30'`), read by the module from `location.search` |
| T4 | `bazookarp-check.cjs ERA=` | the Bazookarp checker (`PAGEQ` serves it too) |

Nothing by hand.

### Gulper Aquarium: pipes (`stages/aquarium/ENGINE.md` §3.7)

| # | hook-in | served by |
|---|---|---|
| H1 | `Level`: `seg` kind, `pipe`, `glass` | **served**: `Level.blockKind('seg', { build, mirror })`, `Level.blockField('pipe' / 'glass' / 'bakeClear', …)`; the glass comes from `W.extraColliders()` (built with `paint: false, hidden: true`, `roof` from the def) |
| H2 | `Physics.raycast` `skipPipes` | **served**: `physics.skip = 'pipe'`, set only by the camera override's `skip: 'pipe'` |
| H3 | `actor.js`: reset, the ride, the damage guard, `canSuperJump`, `jumpAnchor` | **served**: `R.actorReset`, `R.ownsBody` (the pop phase: force `fire / sub / special` off, `_prevIntent.sub = false`, return false), `R.damageGuard`, `R.canSuperJump`, `R.jumpAnchor`. Keep the actor field **`a.pipe`** (the subs' `trySubPress` and Bazookarp's pick-up and instant splats read it) |
| H4 | `match.js`: create, update after the pods, dispose, soft push | **served**: `def.match` (it runs before the pods are made: read `m.pods` from `update` if ever needed), `R.lateUpdate` (after the pods), `R.dispose`, `R.noPush` |
| H5 | `main.js`: colliders, `PipeNet.build`, `level.extraEdges`, prompts, frame, dispose | **served**: `W.extraColliders`, `W.attachLevel` / `afterMeshes`, `W.navEdges`, `R.prompt`, `R.hud` (→ `frame.stage.pipes`, the contract's `frame.pipe`), `W.dispose` |
| H6 | `nav.js`: `_extraEdges`, pipe cost / `pipeShut`, `hScale` | **served**: `W.navEdges` (resolved by `_extraEdges`, `hScale` computed there), `R.navEdge(e)` (shut / per-bot cost) |
| H7 | `bots.js`: the early return, `_steer`, the replan exception, `_pathTo` | **served**: `R.botHold`, `R.edgeTypes = ['pipe']` + `R.botSteer`, `R.beforePath` (the bot's cost row for `navEdge`) |
| H8 | `botSight.js` | **served**: `R.sightLanding(e)` |
| H9 | `weapons.js applyHit` | **served**: `R.damageGuard` (source `'hit'`, before the `'hit'` event, on the shooter's screen: a proxy rider is known by the `a.pipe` your `carryRemote` sets) |
| H10 | `netmatch`: `F.pipe`, `packActor`, `carryRemote` (after the flags and yaw), `_adopt`, the Practice clock | **served**: `F.stage` (bit 22) via `R.netFlag(a)`, `R.carryRemote(a, flag, dt)`, `R.adopt(a)`, the clock (E2, the tide). The ride records go through `KIT_GHOSTS.pipe` + `recKit` (module-private, as the contract says) |
| H11 | `cameraRig._follow`: the ride camera, the probe skip, the water clamp | **served**: `R.cam` → `{ glide: true, boom: 0.8, fov: 6, skip: 'pipe' }` (yaw / pitch set on the rig), `R.camAfter` (the clamp: shorten `rig.curDist` / `rig.boom.x`) |
| H12 | `minimap.js`: skip glass; draw the network | **served**: `W.mapBlock(b) → !b.pipe`, `R.drawMap` |
| H13 | `mapThumb.js` | **served**: `registerStageData('pipes', { thumb })` in `src/world/pipes-data.js` (the contract's three-free data file) |
| H14 | `hud.js`: the ride chip, hide the reticle and sub chip, the cooldown ring | **served**: `noReticle: true` on `R.hud(a)`; the chip and the ring are module DOM in `G.hud.el` (the tide pill in `G.hud.timer`) |
| H15 | `bake-ao.cjs`: `bakeMode`, `bakeClear` | **served**: `W.bakeMode(on)` (glass and `bakeClear` blocks non-solid) |
| H16 | `check-maps.mjs` | **served**: `registerStageData('pipes', { check: checkPipes })` |
| H17 | `stageKit.shovable` | **served**: `R.noShove` |
| H18 | `subs.blockActor` | **served**: `R.noShove` |
| D1 | docs | the engineer's |
| — | `registerReveal('pipe', …)`, `KIT_GHOSTS.pipe`, SFX, the events (`emit('pipe:enter', …)`, §3.8) | module-private (existing APIs) |

Nothing by hand. One open point for the lead: DECISIONS.md #24 says "aquarium device aprons through `G.level.noPlace`:
yes", while this ENGINE.md (§1.4, §3.10) and the subs SPEC (rev 3 §0.5) dropped the aprons. The registry offers it
either way (`W.noPlace` → `G.level.noPlace`); the subs' placement code has to call it for it to matter.

### Highmark Foundry: lava (`stages/caldera/ENGINE.md` §3.5)

| # | hook-in | served by |
|---|---|---|
| H1 | `main.js`: create / dispose, `patchProps`, `attachPaint`, material `lava`, `buildNav`, `buildLook` | **served**: `def.world` / `W.attachLevel` (the contract's `LavaWorld.create(layout, level)`) / `W.dispose`, `W.afterMeshes({ props })` (patch `props.mat.*`: the kit is this world's, nothing has rendered yet), `W.attachPaint`, `W.levelMaterial`, `W.buildNav` (two poses merged, steps, cuts), `W.afterMeshes` / `W.ready` (the look) |
| H2 | `match.js`: create before the movers, update before the movers, dispose | **served**: `def.match`, `R.update`, `R.dispose` |
| H3 | `actor.js`: `_lavaCheck` (before the sea, after a body special), `safeLanding`, the fall cause | **served**: `R.kill(a)` (both places; splat with `a.splat(a.lastDamage < 4 ? a.lastAttacker : null, 'lava')`), `R.superJumpLanding(a, s)`, `R.fallCause(a)` (`'lava'` over a `falls` polygon) |
| H4 | `nav.js`: time windows in `path()`, `nearest()` skips hard-shut riders | **served**: `R.navTimed = true` + `R.navEdge(e, to, metres)` (arrival `now + metres × sPerM`; 2 → Infinity, 1 → soft; climbs included), `R.navNode(id, start)` |
| H5 | `bots.js`: `_wet`, `_avoidWater`, `_squidWouldDrop`, `lava.bot` | **served**: `R.wet(x, z, gy, ahead)` (= `covers`), `R.botAct` |
| H6 | `stageKit.floorFor` | **served**: `R.wet` |
| H7 | `paint.js` (a)–(f): the clip, the gate, `retireCells`, `clearCells`, `drawInto` | **served**: `paint.setClip({ map, box, faceOn: (f) => f.lava, clipAt: (et) => inkClip(et), inside })` (mark `f.lava` first), `R.onSplat`, `paint.retireCells` / `clearCells(ids, sample, max)` (the contract's `(ids, from, to, sample)`: pass `cells.subarray(from, to)`) / `drawInto` |
| H8 | `levelMaterial`: the `LAVA` chunks | **served**: `W.levelMaterial()` → `{ key: 'lava', uniforms, defines: { LAVA: 1 }, fragPars, fragBase, fragEmissive, fragFinal }` |
| H9 | `cameraRig`: the lens over the lava | **served**: the lens stays over `surfaceY + 0.15` (`liquid: true` + `R.liquidY`) |
| H10 | `netmatch`: clock, field 15, `opts.et` | **served**: `R.splatTime(c, r)` (= `tagSplat ? S.t : undefined`) |
| H11 | `hud.js`: cause, callouts, gauge | **served**: `registerCause('lava', …)`; callouts from the module's own `on('lava:warn', …)` → `S.callout`; the gauge is module DOM in `G.hud.el` |
| H12 | `main.js on('splatted')` | **served**: `registerCause` (`byColor`) |
| H13 | `screenfx.js`: flood colour, heat shimmer | **served**: `registerCause` (`flood: '#a3121a', clear: true`), `G.game.screenfx.heat = k` (reset at match end) |
| H14 | `minimap` | **served**: `R.drawMap` |
| H15 | `mapThumb` | **served**: `registerStageData('lava', { thumbBelow })` |
| H16 | `weapons.js` projectiles / bombs | **served**: `R.under` + `R.fizzle` (`sink`) |
| H17 | `subs._fly`; the device sweep | **served**: `sink` for thrown subs. The device sweep is **module-private until the subs package adds `G.deploy.crushIn`**: the module's own 4 Hz sweep walks `G.subs.items` (`!it.ghost && it.state !== 'dead'`, placed or stuck, `R.under(it.pos, -0.05)`) → `G.subs._destroy(it)` (the owner's end record ends the ghosts); the buoy is `H18`. After that: `S.crushIn({ where: (p) => R.under(p, -0.05) }, 'lava')`, which also ends the sentries and bobbers with `'device:down'` |
| H18 | `sp-surf.js` the buoy | **served**: `under` → `'lost'` |
| H19 | kits: torpedo, waddle, shaker, tracer (mandatory), Glide | **served**: `sink` beside each sea test (done, the mandatory ones). Not hooked: the optional cosmetic ones (`bow.js`, `boomerang.js`, `brolly.js`, `mitts.js`: the paint clip already stops their ink). The batch-5 subs read `G.match.lava.surfaceAt / under / covers` (subs SPEC rev 3 §0.5–0.6): keep those names and signatures on R |
| H20 | `check-maps` lava section | **served**: `registerStageData('lava', { check })` |
| H21 | `placeRiders()` before `BossNav` | **served**: `def.match` runs before `BossMode` (call `placeRiders()` there when `m.mode === 'boss'`) |
| H22 | `env.sea: false` | **served** (stage data) |
| H23 | `G.level.liquidY` | **served**: `liquid: true` + `R.liquidY(x, z)` (or `W.liquidY`); "no device under it": `R.noPlace(p, r)` → `G.level.noPlace` |
| H24 | schedule flags (practice, attract) | module-private (`m.practice`, `m.attract` in `def.match`) |
| T1 | `LAVA=` in the tools | **served**: `PAGEQ='lava=high'` |
| T2 | `art.lava` in `stageart.cjs` | **served by `PAGEQ`**: run the art as its own run, `STAGES=caldera PAGEQ='lava=high' … stageart.cjs` (stageart loads the page once per run, so a per-stage query from `art.lava` would need a reload per stage: not done; `art.lava` is then unused) |
| D1 | docs | the engineer's |

Mode data: the riders', steps' and falls' `onlyIn` / `notIn` are the module's to filter ([Lifecycle](#lifecycle)).
Nothing by hand.

### The subs SPEC and Bazookarp interfaces (one home each)

| ask | home |
|---|---|
| subs §0.3: one destroyer `G.deploy.crushIn(shape, how)` for the tower, the shell, era flips, lava | stage modules call `G.match.stage.crushIn(shape, how)`, which forwards to `G.deploy.crushIn`: a no-op returning 0 until the subs package adds it (wave 1's `deployables.js` on b5-deploy has no `crushIn` either). Until then eras H17 and lava H17 use the module-private walk of `G.subs.items` above |
| subs §0.5–0.6 (rev 3): `liquidTop(x, z) = max(PLAYER.waterY, G.match?.lava?.surfaceAt?.(x, z) ?? -Infinity)`; the Glide's `G.match?.lava?.under(pos)`; the sentry's `G.match?.lava?.covers(x, z, floorY, 1)` | the lava module's R published as `G.match.lava` (`matchAs` default) with `surfaceAt(x, z)`, `under(p, depth)`, `covers(x, z, gy, ahead)` under exactly those names. The generic `G.level.liquidY` / `G.match.stage.sink` answer the same for code that doesn't name the lava |
| subs §0.6: `era:flip` listeners (sentry, bobber) | the eras module emits `emit('era:flip', { group, on: [blockIds], off: [blockIds], r })` (its §3.7): an interface, keep the payload |
| subs §0.5 / DECISIONS #24: `G.level.noPlace` (aquarium device aprons) | `G.level.noPlace(p, r)`, answered by `W.noPlace` / `R.noPlace` (false on every other stage). Whether the aquarium uses it and the subs call it: the lead's (see the pipes table) |
| subs §0.2 / §0.4 (deployables, `F.dash` bit 23) | not stage-side; `F.stage` keeps bit 22 |
| Bazookarp §5.5 bluestone: one union nav with `e.em`, per-era `valid`, `era:warn` / `era:done { era }`, `G.match.eras.dangerAt(pos)` | the eras module: `nav.edgeMask`; per-era `valid` on its W; the events; `dangerAt` on R (`G.match.eras`); generic `G.match.stage.danger(pos, pad)` / `restMask(era)` for stage-agnostic code |
| Bazookarp §5.5 caldera: merged LOW + HIGH nav, `reach`, `G.match.lava.restMask(level)` (pure, callable at match start), `lava:warn { to }` | `restMask(level)` on R (`G.match.lava`; `G.match.stage.restMask(state)` asks the same); `reach` on R; the event |
| Bazookarp §5.5 aquarium: `modes.bazookarp.carp`, `'pipe'` edges with `len`, riders `a.pipe` | edges keep every extra field of `W.navEdges` specs (`len`, `key`, `leg`); `a.pipe` on the actor; carp refusal in the module's `canEnter` |
| Bazookarp: movers' whole paths | the railcars: `movers.js sweepRect(car)` (Bazookarp's own hook); stage modules' moving pieces: `G.match.stage.sweeps(out)` |
| Bazookarp: the mode's own setup | build it in `match.js` **after** `this.stage = StageRun.create(this)` (as Zone Control / Tower Command are), so `restMask` / `dangerAt` exist at its load |

## Testing

- `MAP=testbox PAGE=tools/botlab/tests/stage-mods.js tools/botlab/run.sh tools/botlab/page.cjs`: a dummy module
  (`tools/botlab/tests/stage-mods-dummy.js`, registered only by the tests) through the whole lifecycle — the world
  chain's order, the environment (a backdrop set with instances, a theme overlay, `env.sea`, `addSurface`), a block kind
  and fields, a tagged prop, the material extension with every slot at its anchor, a special edge that opens and closes
  on the clock, a rule's cost on climb edges, a moving collider, `noPlace` (world and runtime), `liquidY` / `under`,
  presence (a shared face kept against a state-only block), a clock snap → `seek`, an actor the module carries (body,
  damage guard, super jump, anchor, the camera override), a kill in its hazard with its own cause on the splat card, wet
  floor for bots and shoves, `sink`, the minimap layer and per-state bases (`mapBlock`, `setBase`), `frame.stage`,
  snapshot / restore, `bakeMode`, `bakePasses`, disposal and cleanup; and a stage without the key has no stage world,
  run, nav rule or extension (33 checks).
- `MAP=testbox PAGE=tools/botlab/tests/stage-mods-bake.js PAGE_ARGS='old=.botlab/bake-old.cjs' …page.cjs` (with
  `git show 9f2cdef:tools/botlab/bake.cjs > .botlab/bake-old.cjs`): the bake's page code with no module is byte-identical
  to the base commit's; with the dummy's two states it writes one channel each of an RGB image (6 checks).
- `CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`: the dummy online
  (Practice on halyard): the stage clock and a pure function of it agree; host records; field 15; `F.stage`; a late
  joiner's restore; a host change (10 checks).
- `MAP=halyard PAGE=tools/botlab/tests/stage-mods-perf.js …`: the cost on a stage without a module (run on this branch
  and on the base commit, `tools/botlab/jobs/batch5/stages/regress.sh perf`).
- A module of your own: copy the dummy's shape; build your engine on a fixture (the contracts' `eras-fixture.js`,
  `pipes-fixture.js`, `lavabox`) by mutating a copy of a layout in the page, then `__inkwave.worldKey = null` and start a
  match (that is what the tests do).

## Cost

On a stage without a module key (every existing stage):
- the world build: `StageWorld.plan` checks each registered key once (`layout[key] == null`);
- per frame: every hook-in is `G.match?.stage` / `G.stageWorld` / `nav.ext` / `paint.clip` / `physics.skip` read as
  null or 0 (no function call); `NavGraph.path` adds three local reads per call and one `if` per edge relaxation
  (`EM &&`, `XE &&`); `Physics.raycast` one `if` per block tested; the paint shader has no `CLIP` define and no extra
  attribute; the level program and its cache key are today's;
- `tools/botlab/tests/stage-mods-perf.js` measures raycasts, `pointInside`, `groundHeight`, `nav.path`, `nearest`,
  splats, `regionStats`, the minimap and 600 simulated match frames on halyard, on this branch and on the base commit
  9f2cdef alternately. On the Mac mini (JOB-1, at 6172e3d, three runs each, ms; median of three):

  | | raycast ×20k | pointInside ×20k | groundHeight ×20k | nav.path ×300 | nearest ×5k | splat ×1500 | regionStats ×5k | minimap ×200 | frame median / p90 |
  |---|---|---|---|---|---|---|---|---|---|
  | this branch | 8.5 | 2.1 | 2.9 | 62.6 | 0.6 | 13.0 | 4.0 | 0.4 | 1.1 / 2.4 |
  | base 9f2cdef | 9.3 | 2.4 | 3.3 | 59.2 | 0.5 | 13.4 | 4.5 | 0.4 | 1.2 / 2.5 |

  Every column is within the run-to-run spread of the other side except `nav.path`, 5–6 % slower on this branch in
  each pairing (61.8 / 63.7 / 62.6 against 58.9 / 60.5 / 59.2): the per-edge mask and rule tests, about 10 µs per path.
  Since then `path()` tests both behind one guard per edge (`XR`) with one heuristic closure: in Node (the real `Level`,
  `Physics` and `NavGraph`, no props; 300 random paths, the minimum of 40 alternated runs) that is +0.7 % and +4.1 % on
  halyard and −2.0 % on calamari against 9f2cdef (the earlier hook-in: +3.0 %, +4.3 %, +0.4 %), the same paths, on a
  machine whose noise is about ±3 %. A bot plans a path every 0.8–1.2 s, so even 10 µs per path is under 0.1 ms a second
  for eight bots; the 600-frame match median and p90 are unchanged. A local run at the final code (2026-10-09, this
  Mac, shared with other builders: about twice the Mac mini's times and noisy; head vs 9f2cdef in alternated pairs):
  `nav.path` 111 / 105 / 151 ms against 138 / 107 / 164, every other column within noise
  (`tools/botlab/jobs/batch5/stages/LOCAL-2026-10-09.txt`; JOB-3 repeats it on the Mac mini once its runner is back).
