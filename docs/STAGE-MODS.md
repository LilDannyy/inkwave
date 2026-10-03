# Stage modules (`src/game/stageMods.js`)

One home for stage gimmicks that need the engine: Bluestone Junction's eras, Gulper Aquarium's pipes, Highmark
Foundry's lava, and whatever comes next. A gimmick is **one module file that registers itself**; the shared engine
files call the registry from **one generic hook-in each**, tagged `[b5-stagehooks]`. A stage engineer writes the
module and its stage files and does not edit the shared files again (the per-contract tables at the end name the few
exceptions, with the exact line).

The existing set pieces keep their own hook-ins: `movers.js` (Calamari's trains) and `pods.js` (Treehills' pods) are not
routed through the registry. A stage without a registered key gets no stage world and no stage run: every hook-in is
one null check (see *Cost* below).

- [The API in one screen](#the-api-in-one-screen)
- [Lifecycle](#lifecycle)
- [Extension points](#extension-points) (world build, level, nav, paint, level material, props, minimap, environment,
  match runtime, actors, online, bots, camera, HUD, queries, tools)
- [Hook-ins in shared files](#hook-ins-in-shared-files)
- [Contract tables](#contract-tables): bluestone (eras), aquarium (pipes), caldera (lava)
- [Testing](#testing) and [Cost](#cost)

## The API in one screen

```js
// src/game/lava.js (the stage engineer's file; src/game/stageModList.js already imports it)
import { registerStageMod, registerCause } from './stageMods.js';

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
```

- `G.stageWorld`: the `StageWorld` (all modules' W for the current world), or `null`.
- `G.match.stage`: the `StageRun` (all modules' R for the current match, plus `S.clock`), or `null`.
- `G.<worldAs>` / `G.match.<matchAs>`: your own W / R, for code that only cares about yours.
- Every hook below is **optional**: implement a method of that name on W or R and the registry calls it.
- New sub weapons, kits and the Bazookarp mode ask stage gimmicks through the registry's queries
  (`G.level.liquidY`, `G.level.noPlace`, `G.match.stage.restMask(...)`, `.danger(...)`, `.under(...)`), so they never
  import a stage module.

## Lifecycle

**World** (`main.js _buildWorldNow`, which every stage build goes through: boot, the menu backdrop, a match start, a
mode variant, a Practice stage swap). In order:

| step | call | what the module does there |
|---|---|---|
| 1 | old world: `SW.dispose()` → `W.dispose()` | free meshes, textures, listeners (before the prop kit goes) |
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
| 13 | `W.attachEnv(env)` (now, and at boot once the Environment exists) | extra surfaces, theme overlay |
| 14 | `W.ready()` | the world rests in its starting state (eras: `apply(1, { instant })`) |

`W` lives until the next world build. It survives matches on the same stage. At boot the first world is built before
`G.game` and `G.env` exist: use the kit handed to `prop` / `colliders` / `afterMeshes` (`o.props.buildPart`), not
`G.game.props` or `stageKit.buildLook` (which return an empty group then), and wait for `attachEnv` for the environment.

**Match** (`match.js`, both `setup()` and `_setupRoster()`, offline and online, Practice and the menu backdrop):

| when | call |
|---|---|
| setup, after the actors stand on their pads, **before** Zone Control / Tower Command / Boss Battle | `StageRun.create(match)` → `def.match(match, W, S)` |
| every frame, before the movers, pods and actors | `S.update(dt)`: ticks `S.clock`; a jump of > 1 s calls `R.seek(t, 'clock')`; then `R.update(dt, t)` |
| every frame, after the pods | `R.lateUpdate(dt, t)` |
| match end, Practice stage swap, menu | `R.dispose()` (first in `Match.dispose`, before the movers clear dynamic blocks) |

`S.clock` is a `StageClock` (`stageKit.js`): the host's match clock (`duration − time`) that every follower tracks,
carried on by frame time in overtime, Practice and the menu backdrop; online Practice followers ride the host's
`stageSync`. Build anything time-driven as a **pure function of `S.clock.t`** and implement `R.seek(t, why)` to re-derive
it at once (`why`: `'clock'` a follower's snap, `'late'` a late joiner): then a late joiner, a follower after a hitch
and a new host all agree with no records.

## Extension points

Each with the smallest example. "W." hooks are on your world object, "R." hooks on your match runtime.

### World build

```js
prop(it) { return it.eras ? { ...it, bucketTag: 'e' + eraMask(it.eras), bucketVec: [eraMask(it.eras), 0] } : it; }
colliders(it, cols) { return it.eras ? cols.map((c) => ({ ...c, eras: it.eras, eraGroup: it.eraGroup })) : cols; }
extraColliders() { return pipeColliderDefs(this.layout); }      // [{ kind: 'seg', a, b, w, h, pipe, glass, roof }]
levelFilter() { return (b) => !b.grate && b.presence === 0; }  // the main mesh: shared blocks only
afterMeshes({ scene, level, size, levelMat }) { this.meshes = buildEraMeshes(scene, level, size, levelMat); }
ready() { this.apply(1, { instant: true }); }
```

### Level (`src/world/level.js`)

- **Block fields**: `Level.blockField(key, (b, d, level) => {})`. When a layout def or a prop collider carries `key`,
  the function runs at the end of `Level._addBlock` (prop colliders forward every registered field). Register it at
  module load:
  ```js
  Level.blockField('eras', (b, d) => { b.eras = eraMask(d.eras); b.presence = b.eras === 7 ? 0 : b.eras; });
  Level.blockField('eraGroup', (b, d) => { b.eraGroup = d.eraGroup; });
  Level.blockField('bakeClear', (b) => { b.bakeClear = true; });
  ```
- **Block kinds**: `Level.blockKind('seg', { build(b, d) { …center, half, axes, aligned… }, mirror(d) { return {…} } })`.
  A layout def or a prop collider with `kind: 'seg'` is built by it (`mirror` for `half` pieces).
- **Presence** (`b.presence`: a bit mask of the states the block exists in, 0 = every state): `pointInside(p, pad,
  exclude, need)` skips blocks whose presence lacks `need`; face hiding, the grounded-bottom test and the bevel test pass
  the block's own presence, so a face pressed against a block of another era keeps its faces. Stages without it: 0
  everywhere, nothing changes.
- **Colliders that move or come and go** (the existing `Level` API, which every query already sees):
  `G.level.addDynamic({ tag, roof, perch })` → a block, `moveDynamic(b, center, half, yaw)` (it keeps `b.dp`, the move it
  just made: what a moving block did last frame, which riders, devices and the buoy follow), `b.solid = false` to take
  one out (park it far below to leave every query, as pods / lava do), `clearDynamic()` at match end (the movers / pods
  do it too, after `R.dispose`). Static pieces that switch (eras) stay hash blocks: toggle `b.solid` (+ `b.absent`).
- **Absent** (`b.absent = true` with `b.solid = false`): a block a module took out of play. The nav climb-bar test and
  `paint.regionStats` skip it (they don't read `solid` alone).
- **Geometry attributes**: `level.geomAttrs = [{ name: 'aEra', size: 2, value: (b) => [b.presence || 7, b.eraR || 0] }]`
  adds a per-vertex attribute to every `buildGeometry` from then on.
- **Queries**: `level.liquidY(x, z)` (the liquid surface there; default the sea's −1.6) and `level.noPlace(p, r)` (no
  device may be placed in that disc; default false). Answered by `W.liquidY / W.noPlace` and `R.liquidY / R.noPlace`
  (any module saying "no place" wins; the highest liquid wins).
- **Special edges**: `level.extraEdges` (set from `W.navEdges()` before the graph is built).

### Nav (`src/game/nav.js`)

- **Special edges**: `W.navEdges(level)` → `[{ a: [x, y, z], b: [x, y, z], cost, type: 'pipe', key, len, …any }]`.
  `NavGraph._extraEdges` links the nearest node within 0.8 m (xz) and 0.6 m (y) of each end; specs that don't resolve
  go to `nav.edgeProblems`. Edges keep every extra field. `nav.hScale` (= min(1, cost ÷ straight distance) over the
  special edges) scales A*'s heuristic so a cheap long edge is never skipped; 1 on every other stage.
- **A whole graph**: `W.buildNav(level, physics)` → your own `NavGraph` (eras: three builds merged; lava: two poses
  merged). Without it, `new NavGraph(level, physics)`. `W.attachNav(nav)` either way.
- **Edge mask**: `nav.edgeMask = bit` skips every edge with `e.em !== undefined && !(e.em & bit)` (eras' `e.em`).
- **Per-match rules**: `R.navEdge(e, toId, metres)` → extra cost, or `Infinity` to forbid it (pipes: `pipeShut`,
  per-bot cost; lava: time windows at the arrival time `now + metres × sPerM`, with `R.navTimed = true` so `path()`
  keeps the metres walked without penalties). `R.navNode(id, start)` → false: `nearest()` never returns it.
  ```js
  navEdge(e, to, metres) { if (e.type !== 'pipe') return 0; const k = e.key; return this.shut[k] ? Infinity : this.botX ? this.botX[k] : 0; }
  ```
- **Layers**: the existing `stageKit` `navClaim(owner) / navCommit(actors) / navRelease(owner)` (+40 to enter, never a
  goal, bots replan) work for modules too.

### Paint (`src/world/paint.js`)

- **Every splat**: `R.onSplat(center, radius, team, opts)` (local and replayed, after the pods; not cosmetic ones).
- **Block gate**: `W.inkOk(block, et)` → false: that block's faces take no ink from this splat. `et` is the painter's
  stage time (`opts.et`; local splats: `G.match.stage.t`).
- **Painter's time on the wire**: `R.splatTime(center, radius)` → a stage time, or undefined. When defined, the splat
  record carries it as field 15 and every screen replays with `opts.et` = it.
- **Clip**: `paint.setClip({ map, box, faceOn(f), clipAt(et), inside(x, z) })`: cells of faces with `faceOn(f)` whose
  centre is `inside` and below `clipAt(et)` take no ink, and the atlas draw discards the same texels (`map`: a
  DataTexture whose R > 0.5 marks inside, `box` = Vector4(x0, z0, 1/w, 1/d)). Growing splats re-evaluate the clip.
  `paint.setClip(null)` removes it (and the shader define).
- **Generic edits**: `paint.clearCells(ids, sample?)` (zero cells, counts down, a sample of inked ones for steam),
  `paint.retireCells(ids)` (never turf: dead, not live, `turfTotal` / `turfArea` down), `paint.clearFaces(faceIds)`
  (grid cells and atlas rects to zero), `paint.drawInto(scene)` (render your own quads into the atlas, `_wipeBand`-style).

### Level material (`src/world/levelMaterial.js`)

`W.levelMaterial({ grate })` → one extension or a list; `createLevelMaterial(…, { ext })` applies them. Without any, the
program is byte-identical to today's (and its cache key too).

```js
levelMaterial({ grate }) {
  return { key: 'lava', uniforms: this.uniforms, defines: { LAVA: 1 },
    fragPars: LAVA_GLSL.pars,        // after #include <common> (fragment)
    fragBase: LAVA_GLSL.base,        // before the wet-ink block: acts on the bare surface (`base`)
    fragEmissive: LAVA_GLSL.emissive,// after the ink emissive
    fragFinal: LAVA_GLSL.line };     // before the clear-ink wave term (outgoingLight)
}
```

Slots: `vertPars` (after `#include <common>`, vertex), `vertMain` (after `#include <project_vertex>`), `fragPars`,
`fragBase`, `fragMural` (right after the mural texel `mc` is read; `mi` is the mural id: eras' mural masks),
`fragEmissive`, `fragFinal`, and `aoSample` (a GLSL expression replacing `texture2D(uLight, vLightUv).r`: eras' AO
channel). `uniforms` are shared objects (merged by reference). The cache key gets `-<key>` per extension.

### Props (`src/world/props.js`)

A placement may carry `bucketTag: 'e3'` (and `bucketVec: [a, b]`): its parts go to their own merged meshes
(`material@tag`, with a per-vertex `aTag` = bucketVec), named `props:<material>@<tag>`, `mesh.userData.tag` = tag. Set
`kit.tagMaterial = (key, tag, base) => material` before `kit.build()` to give those meshes their own material (eras: a
clone with the era vertex collapse). Untagged placements are merged exactly as today.

### Minimap (`src/game/minimap.js`)

- `W.mapBlock(b)` → false: that block is left out of the base raster (pipes: glass; eras: absent blocks).
- `mm.setBase(key, present?)`: switch the base raster to a cached one for `key` (built with `present(b)` as the
  block test the first time; the viewer's side flips clear the cache). Eras build `1`, `2`, `3` in idle time and swap at
  done.
- Live layer: `R.drawMap(c, mm, tc, s, hex, t, me)` every frame, after the zones / tower / devices, before the
  specials. It serves the corner map and the TAB map (the same canvas). The TAB diorama renders the real scene.

### Environment (`src/world/environment.js`)

- `LAYOUT.env.sea: false` hides the sea mesh (and with it its planar reflection pass). The death plane is unchanged.
- `G.env.addSurface(obj)` → a remove function: a liquid surface or any big look of yours, added to the environment
  root with its GTAO gate (transparent meshes sit out the override pass), frustum culling off. `G.env.U` are the sky /
  sun / fog uniforms to read, `G.env.sceneryMaterial(flags, params)` the backdrop kit's material.
- `G.env.themeOverlay = (name) => overrides | null`: layered after the stage's `env.theme` when a theme is applied
  (`setTheme`). Cheap mid-match blends (eras' look per era) write `G.env.U` uniforms directly.
- Backdrop sets: a stage backdrop may return `sets: { key: { static, plain, terrain, instances, objects } }` beside its
  main set. Each is built like the main set into `G.env.stageSets[key]` (a Group, hidden); a module shows / hides them
  (eras' skyline per era).

### Match runtime: actors (owner side, `src/game/actor.js`, `match.js`)

| hook on R | called | return |
|---|---|---|
| `actorReset(a)` | `Actor.reset` | — (clear your fields on the actor) |
| `ownsBody(a, dt)` | `Actor.update`, right after the dead branch | true = you moved the actor; the frame finishes there (a pipe ride). False after forcing intents off is fine (the pop phase) |
| `damageGuard(a, amount, attacker, source)` | `Actor.damage` after invuln; `applyHit` before its `'hit'` event | true = drop it |
| `canSuperJump(a)` | `Actor.canSuperJump` | false = refuse |
| `jumpAnchor(a)` | `Actor.jumpAnchor` | a Vector3 (where teammates land), or null |
| `kill(a)` | `Actor.update` before the sea check, and after a body special's update | true = you splatted it (`a.splat(attacker, 'lava')`) |
| `fallCause(a)` | the sea check's cause | a cause id (`'lava'` in a chute), or null (`'water'`) |
| `superJumpLanding(a, s)` | charge → flight, not on the tower | — (move `s.to`) |
| `noPush(a)` | the soft push between actors | true = skip this actor |
| `noShove(a)` | `stageKit.shovable`, `subs.blockActor` | true = never shove it |

### Online (`src/net/netmatch.js`)

- **Stage clock in Practice**: the host's tick carries `S.clock.t` when there are no movers or pods (followers' clocks
  ride it). Nothing to do.
- **Records**: `S.rec(key, data)` → `['sm', key, data]` on the sender's timeline; every other screen calls
  `R.netEvent(data, from)`. The host records host-run state (`!match.follower`); an owner may record its own actor's
  state. Owner-simulated objects can also use the kits' `KIT_GHOSTS[kind]` + `recKit` path unchanged.
- **Late join** (Practice): `R.netSnapshot()` on the host → the joiner's start config → `R.netRestore(data, t)` once the
  joiner's stage clock is the host's, then `R.seek(t, 'late')`. Put absolute stage times in the snapshot.
- **An actor flag**: `R.netFlag(a)` → true sets tick flag bit 22 (`F.stage`; aquarium's `F.pipe`); every other screen
  gets `R.carryRemote(a, flag, dt)` after the sample is applied (flags, form, yaw set), before the frame finishes.
- `R.adopt(a)` (this screen took over a squidkid: `_adopt`), `R.hostChanged(isHost)`.
- **Painter's time**: `R.splatTime` (above).

### Bots (`src/game/bots.js`, `botSight.js`, `stageKit.js`)

| hook on R | where | use |
|---|---|---|
| `botHold(b)` | `BotBrain.update`'s super-jump early return | true = the bot does nothing this frame (riding) |
| `edgeTypes: ['pipe']` + `botSteer(b, edge, out)` | `_steer`, when the next edge's type is yours | return `out` (the move) or null |
| `beforePath(b)` | `_pathTo`, before `nav.path` | set your per-bot nav rule state (`this.botX = …`) |
| `botAct(b, dt, it, move, vis)` | after the pods' bot hook | an aim (Vector3) to take over, or null |
| `wet(x, z, gy, ahead)` | `_wet`, `_avoidWater`, `_squidWouldDrop`, `stageKit.floorFor` | true = feet on that floor would be in your hazard (now or within `ahead` s) |
| `goalWeight(id)` | `_pickPaintGoal` | × on a paint goal's score (eras' fresh nodes ×2) |
| `sightLanding(e)` | `botSight` `check` / `recheck` | a Vector3: remember this enemy there (`src: 'jump'`), never target it |

`ZonePlan` skips ring / far nodes that are not `nav.valid` now (eras swap `valid`).

### Camera (`src/game/cameraRig.js`)

`R.cam(rig, a, dt)` → null, or `{ glide, boom, fov, skip }`: `glide` follows like super-jump flight (no strafe
look-ahead), `boom` / `fov` are added, `skip` names a block flag the boom probe ignores (`'pipe'`; reset after the probe
whatever happens). You may set `rig.yaw` / `rig.pitch` yourself. `R.camAfter(rig, a, o)` runs after the probe (the water
clamp). The lens never dips under `G.level.liquidY` + 0.15.

### HUD (`src/ui/hud.js`, `main.js`, `screenfx.js`)

- `R.prompt(a)` → a prompt string for the local player (after a running special's).
- `R.hud(a)` → your object at `frame.stage[key]`; `noReticle: true` on it hides the reticle and the sub chip.
- Your own DOM: append to `G.hud.root` (the gauge chip, the ride chip) and remove it at `R.dispose()`. Callouts and
  banners: `S.callout(text, sub, big)` / `S.banner(kind, text)` (skipped on the menu backdrop), from your own
  `on('lava:warn', …)` listeners; `stageEmit(key, name, payload)` emits `key:name` on the bus.
- Causes: `registerCause(id, { name, knocked, icon, flood, clear, byColor })` (the splat card, the feed, the screen flood).

### Queries (anyone, any time)

| query | answered by | default |
|---|---|---|
| `G.level.liquidY(x, z)` | W / R `liquidY` | −1.6 (the sea) |
| `G.level.noPlace(p, r)` | W / R `noPlace` | false |
| `G.match.stage?.under(p, depth)` | R `under` | false |
| `G.match.stage?.sink(p, what)` | R `under`, then R `fizzle(p, what)` | false (shots, bombs, thrown subs, the buoy, the Shaker / Torpedo / Tracer / Waddle sink there: no splat, no blast) |
| `G.match.stage?.sweeps(out)` | R `sweeps(out)` | [] (Bazookarp rest flags: the boxes a module's moving pieces cover over their whole travel) |
| `G.match.stage?.restMask(state)` | R `restMask` | null (Bazookarp: `Uint8Array` over nav nodes, 1 = standable in that state) |
| `G.match.stage?.danger(pos, pad)` | R `danger` | false (Bazookarp drop spot, bots) |
| `G.match.stage?.crushIn(shape, how)` | `G.deploy.crushIn` (subs SPEC §0.3) | **0: a no-op until the deploy package's `crushIn` is on this branch** |
| `G.match.stage?.state()` | R `state` | `{ t, keys }` (tests) |

### Tools

- `PAGEQ='era=2'` (or `'lava=high'` …) on any botlab harness (page, shoot, stageart, match, bake, tower-check):
  every game page loads with that query too (`tools/botlab/offscreen-boot.cjs`). A module reads its audit switch from
  `location.search` itself. This is the contracts' `ERA=` / `LAVA=` (bluestone T3, caldera T1 / T2).
- `build/bake-ao.cjs`: `__G.stageWorld?.bakeMode(true)` around the trace (W `bakeMode(on)`: pipe glass, `bakeClear`
  blocks out of the AO); per-state bakes: see the eras table, T1.
- `src/world/mapThumb.js`, `build/check-maps.mjs`: the three-free data registry `src/world/stageData.js`:
  `registerStageData(key, { thumb(layout, api), check(layout, api) → problems[], overlapOk(a, b) })`, imported by
  `src/world/stageDataList.js` (stub files `eras-data.js`, `pipes-data.js`, `lava-data.js`).

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
| `src/game/nav.js` | `ext` / `edgeMask` / `hScale`; `_extraEdges`; `path()` (mask, rule, metres, heuristic); `nearest()` (node rule); `_climbBarred` (`absent`) | nav |
| `src/game/physics.js` | `skip` in `raycast` | the ride camera's probe |
| `src/world/paint.js` | `onSplat`, `blockGate`, `et`, clip (shader `#ifdef CLIP`, CPU cells, growth, quads, import); `regionStats` (`absent`); `setClip`, `cellWorld`, `clearCells`, `retireCells`, `clearFaces`, `drawInto` | paint |
| `src/world/levelMaterial.js` | `opts.ext` (uniforms, defines, slots, cache key) | the level shader |
| `src/world/props.js` | `bucketTag` / `bucketVec` (`_push`, `add`, `mergeParts` `aTag`, `build` + `tagMaterial`) | prop buckets |
| `src/game/minimap.js` | `blockOk` in `_build`; `setBase`; the cache on a side flip / theme change; `drawMap` in `_compose` | maps |
| `src/world/environment.js` | `env.sea`; `themeOverlay`; `out.sets` → `stageSets`; `addSurface`; `sceneryMaterial` | environment |
| `src/game/cameraRig.js` | `cam` / `camAfter`; `glide`, `boom`, `fov`, `skip`; the lens over a module's liquid | camera |
| `src/game/bots.js` | `botHold`; `botAct`; `wet` in `_wet` / `_avoidWater` / `_squidWouldDrop`; `beforePath`; `goalWeight`; `edgeTypes` + `botSteer` in `_steer`; ZonePlan `valid` | bots |
| `src/game/botSight.js` | `sightLanding` in `check` / `recheck` | bot sight |
| `src/game/stageKit.js` | `shovable` (`noShove`); `floorFor` (`wet`) | shoves |
| `src/game/weapons.js` | `applyHit` (`damageGuard`); `_step`, `_updateBombs` (`sink`) | shots |
| `src/game/subs.js` | `_fly` (`sink`); `blockActor` (`noShove`) | subs |
| `src/game/sp-surf.js` | the buoy's lost test (`under`) | the buoy |
| `src/game/kits/shaker.js`, `torpedo.js` (×3), `tracer.js`, `waddle.js` (×2) | beside each sea test (`sink`) | kit items |
| `src/ui/hud.js` | `splatCause` (env causes); `noReticle` | HUD |
| `src/fx/screenfx.js` | the flood (env causes); `uHeat` (`screenfx.heat`) | screen FX |
| `src/core/envCauses.js` (new) | `registerCause` / `envCause` | causes |
| `src/world/mapThumb.js`, `build/check-maps.mjs` | `stageDataFor` (`src/world/stageData.js`, new) | tools |
| `build/bake-ao.cjs`, `tools/botlab/bake.cjs` | `stageWorld.bakeMode` round the trace | bake |
| `tools/botlab/offscreen-boot.cjs` | `PAGEQ` | harness |

New files: `src/game/stageMods.js`, `src/game/stageModList.js`, `src/game/eras.js` / `pipes.js` / `lava.js` (stubs:
the engineers replace them), `src/world/stageData.js`, `src/world/stageDataList.js`, `src/world/eras-data.js` /
`pipes-data.js` / `lava-data.js` (stubs), `src/core/envCauses.js`.

## Contract tables

One row per hook-in of each stage's `ENGINE.md` (its numbering). **served** = the registry hook that serves it; the
module implements it in its own file. **module-private** = no shared edit at all. **by hand** = the only shared-file edit
the stage engineer still makes: one tagged line (with their own key) in the named file.

Three conventions the contracts did not use, used here:
- An era-masked or absent block is `b.absent = true` with `b.solid = false` (the contract's `b.eraOff`): nav's climb
  bar and `paint.regionStats` read `absent`.
- The presence mask is `b.presence` (the contract's `b.eras`, with 7 written as 0): set it in the `eras` block field.
- Pipe glass colliders are `{ kind: 'seg', … }` (the contract's `{ seg: true, … }`), built by a registered `seg` kind.

### Bluestone Junction: eras (`stages/bluestone/ENGINE.md` §3.5)

| # | hook-in | served by |
|---|---|---|
| H1 | `Level._addBlock`: `eras`, `eraGroup`, `eraG`, `eraR`, `eraOff` | **served**: `Level.blockField('eras', …)` / `('eraGroup', …)` (set `b.eras`, `b.presence`); `eraG` / `eraR` in `W.attachLevel`; `eraOff` → `b.absent` |
| H2 | `Level._build`: forward `eras` / `eraGroup` from prop colliders | **served**: registered fields ride prop colliders (`W.colliders(it, cols)` tags them) |
| H3 | `pointInside(…, need)`; `_faceHidden`, `groundedBottom`, `bevelled` pass the block's mask | **served**: `b.presence` (0 = every era) |
| H4 | `buildGeometry`: `aEra` per vertex | **served**: `level.geomAttrs = [{ name: 'aEra', size: 2, value: (b) => [b.eras, b.eraR] }]` in `W.attachLevel` |
| H5 | `paint.splat` block loop `inkOk(b, et)`; `regionStats` skips `eraOff` | **served**: `W.inkOk(b, et)` (the block gate; `et` = `opts.et ?? S.t`); `b.absent` |
| H6 | `paint.clearFaces(faceIds)` | **served**: `paint.clearFaces` |
| H7 | `NavGraph.path` `eraBit` mask; `_climbBarred` skips `eraOff` | **served**: `nav.edgeMask = bit` (edges with `e.em`); `b.absent` |
| H8 | `createLevelMaterial(…, { eras })`: uniforms, `aEra`, `fragBase`, `fragAO`, `fragFront`, key `-eras` | **served**: `W.levelMaterial()` → `{ key: 'eras', uniforms, defines: { ERAS: 1 }, vertPars, vertMain, fragPars, fragBase, aoSample: 'dot(texture2D(uLight, vLightUv).rgb, eraOneHot)', fragFinal }` (`eraOneHot` a global set in `fragBase`) |
| H8b | mural era masks `uMurEra[12]` | **served**: the `fragMural` slot (`mc.a *= …` with `mi`) |
| H9 | `main._buildWorldNow` chain | **served**: `W.prop` / `colliders` / `attachLevel` / `attachPaint` / `levelMaterial` / `levelFilter` (`(b) => !b.grate && !b.presence`) / `afterMeshes` (`buildMeshes` while every block is solid) / `buildNav` (three builds merged) / `attachMinimap` / `ready` (`apply(1, { instant })`) |
| H10 | `match.js`: create before the modes, update before the movers, dispose | **served** (`def.match`, `R.update`, `R.dispose`); boss `fixed` era is applied in `def.match`, before `BossMode` |
| H11 | `netmatch`: the Practice clock, splat field 15, `opts.et` | **served**: the clock (nothing to do), `R.splatTime(c, r)` (return `S.t` when `near(t)`) |
| H12 | `PropKit` era buckets, `eraMaterial`, depth material, `userData.eraMask` | **served**: `W.prop(it, kit)` → `{ …it, bucketTag: 'e' + mask, bucketVec: [mask, eraR] }` and `kit.tagMaterial = (key, tag, base) => eraMaterial(base)`; depth material and visibility on the tagged meshes in `W.afterMeshes({ props })` (`props._meshes`, `userData.tag`). Spinners / blinkers stay static (rule 40) |
| H13 | environment: `_stageTheme(name, era)`, era backdrop sets, `setEra` blend, time-lapse | **served**: `G.env.themeOverlay`; backdrop `sets: { 1: {…}, 2: {…}, 3: {…} }` → `G.env.stageSets[e]`; the blend / time-lapse write `G.env.U` (sky, haze, fog, `uSunDir`), `G.env.sun`, `G.env.grade` (module-private); the far clip by `length(vW.xz)` on a set: put those meshes in the set's `objects` with the module's own materials (`G.env.sceneryMaterial(flags)` + an `onBeforeCompile`); the env map at done: `G.env.setTheme(G.env.theme)` (re-applies with the overlay) |
| H14 | minimap: `_build(present)`, per-era bases, `setEra`, outlines | **served**: `W.mapBlock`, `mm.setBase(era, present)`, `R.drawMap` |
| H15 | HUD: era events → callouts / banner, the era chip | **module-private**: the module's own `on('era:warn', …)` → `G.hud._callout` / `banner`; the chip is its own DOM in `G.hud.root` |
| H16 | bots: `fresh` ×2 paint goals; ZonePlan skips invalid ids | **served**: `R.goalWeight(id)`; ZonePlan (done) |
| H16b | (optional) pre-position, perches | **served**: `R.botAct` (pre-position), `R.goalWeight` (perches) |
| H17 | subs items on a flipped block, the buoy | **served once the deploy package is merged**: `S.crushIn({ blocks: onBlocks }, 'flip')` and `S.crushIn({ where: (p) => offBlocks.some((b) => level.pointInBlock(b, p, 0.15)) }, 'flip')`. **Today `crushIn` is a no-op** (no `G.deploy.crushIn` on this branch): until it lands, **by hand**: one line in `src/game/subs.js`'s constructor, `on('era:flip', (e) => G.match?.eras?.popItems?.(this, e)); // [b5-eras]`. The buoy needs nothing: its floor turning non-solid drops it and it anchors again (sp-surf's own physics) |
| H18 | movers parking per era | not needed on Bluestone (the contract says so) |
| H19 | `mapThumb`: era 1, later eras dashed | **served**: `registerStageData('eras', { thumbBlock: (d) => … 'skip' / 'dashed' })` in `src/world/eras-data.js` |
| H20 | none | — |
| H21 | Bazookarp `karpField.setState(era)` at `era:done`, `dangerAt` | the Bazookarp side listens to `era:done`; it asks `G.match.stage.restMask(era)` and `.danger(pos)` (implement `R.restMask`, `R.danger`) |
| T1 | bake ×3 into R / G / B | **by hand (tools)**: `build/bake-ao.cjs` and `tools/botlab/bake.cjs` trace once per era into one channel each and write an RGB PNG (about 20 lines each). `bakeMode` exists; a generic "bake passes" hook was not built |
| T2 | `check-maps`: era-aware overlaps, per-era builds, the static rules | **served**: `registerStageData('eras', { overlapOk(a, b), check(layout, api) })` |
| T3 | `ERA=` in shoot / stageart / tests; `ERA_FROM` / `ERA_TO` / `FRONT` | **served**: `PAGEQ='era=2'` (or `'erafrom=1&erato=2&front=30'`), read by the module from `location.search` |
| T4 | `bazookarp-check.cjs ERA=` | the Bazookarp checker (`PAGEQ` serves it too) |

### Gulper Aquarium: pipes (`stages/aquarium/ENGINE.md` §3.7)

| # | hook-in | served by |
|---|---|---|
| H1 | `Level`: `seg` kind, `pipe`, `glass` | **served**: `Level.blockKind('seg', { build, mirror })`, `Level.blockField('pipe' / 'glass' / 'bakeClear', …)`; the glass comes from `W.extraColliders()` |
| H2 | `Physics.raycast` `skipPipes` | **served**: `physics.skip = 'pipe'`, set only by the camera override's `skip: 'pipe'` |
| H3 | `actor.js`: reset, the ride, the damage guard, `canSuperJump`, `jumpAnchor` | **served**: `R.actorReset`, `R.ownsBody` (the pop phase: force `fire / sub / special` off, `_prevIntent.sub = false`, return false), `R.damageGuard`, `R.canSuperJump`, `R.jumpAnchor` |
| H4 | `match.js`: create, update after the pods, dispose, soft push | **served**: `def.match`, `R.lateUpdate`, `R.dispose`, `R.noPush` |
| H5 | `main.js`: colliders, `PipeNet.build`, `level.extraEdges`, prompts, frame, dispose | **served**: `W.extraColliders`, `W.attachLevel` / `afterMeshes`, `W.navEdges`, `R.prompt`, `R.hud` (→ `frame.stage.pipes`), `W.dispose` |
| H6 | `nav.js`: `_extraEdges`, pipe cost / `pipeShut`, `hScale` | **served**: `W.navEdges` (resolved by `_extraEdges`, `hScale` computed there), `R.navEdge(e)` (shut / per-bot cost) |
| H7 | `bots.js`: the early return, `_steer`, the replan exception, `_pathTo` | **served**: `R.botHold`, `R.edgeTypes = ['pipe']` + `R.botSteer`, `R.beforePath` (the bot's cost row for `navEdge`) |
| H8 | `botSight.js` | **served**: `R.sightLanding(e)` |
| H9 | `weapons.js applyHit` | **served**: `R.damageGuard` (called with source `'hit'` before the `'hit'` event) |
| H10 | `netmatch`: `F.pipe`, `packActor`, `carryRemote` (after the flags and yaw), `_adopt`, the Practice clock | **served**: `F.stage` (bit 22) via `R.netFlag(a)`, `R.carryRemote(a, flag, dt)`, `R.adopt(a)`, the clock. The ride records go through `KIT_GHOSTS.pipe` + `recKit` (module-private, as the contract says) |
| H11 | `cameraRig._follow`: the ride camera, the probe skip, the water clamp | **served**: `R.cam` → `{ glide: true, boom: 0.8, fov: 6, skip: 'pipe' }` (yaw / pitch set on the rig), `R.camAfter` (the clamp: shorten `rig.curDist` / `rig.boom.x`) |
| H12 | `minimap.js`: skip glass; draw the network | **served**: `W.mapBlock(b) → !b.pipe`, `R.drawMap` |
| H13 | `mapThumb.js` | **served**: `registerStageData('pipes', { thumb })` in `src/world/pipes-data.js` (the contract's three-free data file) |
| H14 | `hud.js`: the ride chip, hide the reticle and sub chip, the cooldown ring | **served**: `noReticle: true` on `R.hud(a)`; the chip and the ring are module DOM |
| H15 | `bake-ao.cjs`: `bakeMode`, `bakeClear` | **served**: `W.bakeMode(on)` (glass and `bakeClear` blocks non-solid) |
| H16 | `check-maps.mjs` | **served**: `registerStageData('pipes', { check: checkPipes })` |
| H17 | `stageKit.shovable` | **served**: `R.noShove` |
| H18 | `subs.blockActor` | **served**: `R.noShove` |
| D1 | docs | the engineer's |
| — | `registerReveal('pipe', …)`, `KIT_GHOSTS.pipe`, SFX | module-private (existing APIs) |

Nothing by hand.

### Highmark Foundry: lava (`stages/caldera/ENGINE.md` §3.5)

| # | hook-in | served by |
|---|---|---|
| H1 | `main.js`: create / dispose, `patchProps`, `attachPaint`, material `lava`, `buildNav`, `buildLook` | **served**: `def.world` / `W.dispose`, `W.afterMeshes({ props })` (patch `props.mat.*`), `W.attachPaint`, `W.levelMaterial`, `W.buildNav` (two poses merged, steps, cuts), `W.afterMeshes` / `W.ready` (the look) |
| H2 | `match.js`: create before the movers, update before the movers, dispose | **served**: `def.match`, `R.update`, `R.dispose` |
| H3 | `actor.js`: `_lavaCheck` (before the sea, after a body special), `safeLanding`, the fall cause | **served**: `R.kill(a)` (both places), `R.superJumpLanding(a, s)`, `R.fallCause(a)` (`'lava'` over a `falls` polygon) |
| H4 | `nav.js`: time windows in `path()`, `nearest()` skips hard-shut riders | **served**: `R.navTimed = true` + `R.navEdge(e, to, metres)` (arrival `now + metres × sPerM`; 2 → Infinity, 1 → soft), `R.navNode(id, start)` |
| H5 | `bots.js`: `_wet`, `_avoidWater`, `_squidWouldDrop`, `lava.bot` | **served**: `R.wet(x, z, gy, ahead)` (= `covers`), `R.botAct` |
| H6 | `stageKit.floorFor` | **served**: `R.wet` |
| H7 | `paint.js` (a)–(f): the clip, the gate, `retireCells`, `clearCells`, `drawInto` | **served**: `paint.setClip({ map, box, faceOn: (f) => f.lava, clipAt: (et) => inkClip(et), inside })`, `R.onSplat`, `paint.retireCells` / `clearCells` / `drawInto` |
| H8 | `levelMaterial`: the `LAVA` chunks | **served**: `W.levelMaterial()` → `{ key: 'lava', uniforms, defines: { LAVA: 1 }, fragPars, fragBase, fragEmissive, fragFinal }` |
| H9 | `cameraRig`: the lens over the lava | **served**: the lens stays over `surfaceY + 0.15` (`liquid: true` + `R.liquidY`) |
| H10 | `netmatch`: clock, field 15, `opts.et` | **served**: `R.splatTime(c, r)` (= `tagSplat ? S.t : undefined`) |
| H11 | `hud.js`: cause, callouts, gauge | **served**: `registerCause('lava', …)`; callouts from the module's listeners; the gauge is module DOM |
| H12 | `main.js on('splatted')` | **served**: `registerCause` (`byColor`) |
| H13 | `screenfx.js`: flood colour, heat shimmer | **served**: `registerCause` (`flood: '#a3121a', clear: true`), `G.game.screenfx.heat = k` |
| H14 | `minimap` | **served**: `R.drawMap` |
| H15 | `mapThumb` | **served**: `registerStageData('lava', { thumbBelow })` |
| H16 | `weapons.js` projectiles / bombs | **served**: `R.under` + `R.fizzle` (`sink`) |
| H17 | `subs._fly`; the device sweep | **served**: `sink`; the sweep calls `S.crushIn({ where: (p) => R.under(p, -0.05) }, 'lava')` — **a no-op until the deploy / subs `crushIn` lands** (then served, with no further edit) |
| H18 | `sp-surf.js` the buoy | **served**: `under` → `'lost'` |
| H19 | kits: torpedo, waddle, shaker, tracer (mandatory), Glide | **served**: `sink` beside each sea test (done); the Glide (batch-5 subs) reads `G.level.liquidY` / `G.match.stage.sink` in its own code |
| H20 | `check-maps` lava section | **served**: `registerStageData('lava', { check })` |
| H21 | `placeRiders()` before `BossNav` | **served**: `def.match` runs before `BossMode` (call `placeRiders()` there when `m.mode === 'boss'`) |
| H22 | `env.sea: false` | **served** (stage data) |
| H23 | `G.level.liquidY` | **served**: `liquid: true` + `R.liquidY(x, z)` (or `W.liquidY`) |
| H24 | schedule flags (practice, attract) | module-private (`m.practice`, `m.attract` in `def.match`) |
| T1 | `LAVA=` in the tools | **served**: `PAGEQ='lava=high'` |
| T2 | `art.lava` in `stageart.cjs` | **by hand (tools)**: one line in `tools/botlab/stageart.cjs` appending `layout.art.lava` to the page query |
| D1 | docs | the engineer's |

### The subs SPEC and Bazookarp interfaces (one home each)

| ask | home |
|---|---|
| subs §0.3: one destroyer `G.deploy.crushIn(shape, how)` for the tower, the shell, era flips, lava | stage modules call `G.match.stage.crushIn(shape, how)`, which forwards to `G.deploy.crushIn`; a no-op returning 0 until the deploy / subs code is merged here |
| subs §0.5 / DECISIONS #24: `G.level.noPlace` (aquarium device aprons) | `G.level.noPlace(p, r)`, answered by `W.noPlace` / `R.noPlace` (false on every other stage) |
| subs §0.5 / caldera H23: `G.level.liquidY` (`liquidTop`) | `G.level.liquidY(x, z)`: a module's surface where it has one, the sea's −1.6 elsewhere |
| subs §0.6: `era:flip` listeners, `lavaSweep` | the module's own events; `crushIn` replaces `lavaSweep` (caldera H17) |
| Bazookarp §5.5: lava `restMask(level)`; eras' per-era validity; ground an era removes | `G.match.stage.restMask(state)` → `Uint8Array` over nav nodes (first module that answers) |
| Bazookarp: `dangerAt(pos)` (eras, warn → done) | `G.match.stage.danger(pos, pad)` |
| Bazookarp: movers' whole paths | the railcars: `movers.js sweepRect(car)` (Bazookarp's own hook); stage modules' moving pieces: `G.match.stage.sweeps(out)` |
| Bazookarp: pipes refuse carriers, riders skip instant splats | `a.pipe` (module state) and the module's `canEnter`; nothing shared |

## Testing

- `MAP=testbox PAGE=tools/botlab/tests/stage-mods.js tools/botlab/run.sh tools/botlab/page.cjs`: a dummy module
  (`tools/botlab/tests/stage-mods-dummy.js`, registered only by the tests) through the whole lifecycle — the world
  chain's order, a block kind and fields, a tagged prop, the material extension, a special edge that opens and closes on
  the clock, a moving collider, `noPlace`, `liquidY` / `under`, a clock snap → `seek`, the minimap layer, `frame.stage`,
  snapshot / restore, `bakeMode`, disposal; and a stage without the key has no stage world, run, nav rule or extension.
- `CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`: the dummy online
  (Practice on halyard): the stage clock and a pure function of it agree; host records; field 15; `F.stage`; a late
  joiner's restore; a host change.
- `MAP=halyard PAGE=tools/botlab/tests/stage-mods-perf.js …`: the cost on a stage without a module (run on this branch
  and on the base commit, `tools/botlab/jobs/batch5/stages/regress.sh perf`).
- A module of your own: copy the dummy's shape; build your engine on a fixture (the contracts' `eras-fixture.js`,
  `pipes-fixture.js`, `lavabox`) by mutating a copy of a layout in the page, then `__inkwave.worldKey = null` and start a
  match (that is what the two tests do).

## Cost

On a stage without a module key (every existing stage):
- the world build: `StageWorld.plan` checks each registered key once (`layout[key] == null`);
- per frame: every hook-in is `G.match?.stage` / `G.stageWorld` / `nav.ext` / `paint.clip` / `physics.skip` read as
  null or 0 (no function call); `NavGraph.path` adds three local reads per call and one `if` per edge relaxation
  (`EM &&`, `XE &&`); `Physics.raycast` one `if` per block tested; the paint shader has no `CLIP` define and no extra
  attribute;
- `tools/botlab/tests/stage-mods-perf.js` measures raycasts, `pointInside`, `groundHeight`, `nav.path`, `nearest`,
  splats, `regionStats`, the minimap and 600 simulated match frames on halyard, on this branch and on the base commit
  alternately (the numbers are in the batch's job results).
