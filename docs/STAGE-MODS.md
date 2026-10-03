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
| 3 | `W.prop(it)` per dressing item → the item PropKit gets | tag a prop (eras: `eraMask`, `bucketTag`) |
| 4 | `W.colliders(it, cols)` → the colliders the Level gets | tag its colliders (eras: `{ eras, eraGroup }`) |
| 5 | `W.extraColliders()` → more collider defs | pipe glass `{ kind: 'seg', … }` |
| 6 | `new Level(layout, colliders)`, then `W.attachLevel(level)` | groups, keys, `level.geomAttrs`, flags on blocks |
| 7 | `W.attachPaint(paint)` | per-cell masks, `retireCells`, `paint.setClip(...)` |
| 8 | `W.levelMaterial({ grate })` → level-material extension(s) | shader uniforms and chunks |
| 9 | `W.levelFilter()` → the main level mesh's block filter | eras: only shared blocks |
| 10 | `W.afterMeshes({ scene, level, size, levelMat, grateMat, levelMesh, grateMesh })` | era meshes, pipe glass, lava surface |
| 11 | `W.navEdges(level)` → special edge specs; `W.buildNav(level, physics)` → a graph or nothing; `W.attachNav(nav)` | pipe edges; merged era / pose graphs |
| 12 | `W.attachMinimap(mm)` | `mm.setBase(...)` per state |
| 13 | `W.attachEnv(env)` (now, and at boot once the Environment exists) | extra surfaces, theme overlay |
| 14 | `W.ready()` | the world rests in its starting state (eras: `apply(1, { instant })`) |

`W` lives until the next world build. It survives matches on the same stage.

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
  banners: `G.hud._callout(text, sub, big)`, `G.hud.banner(kind, text)`, from your own `on('lava:warn', …)` listeners.
- Causes: `registerCause(id, { name, knocked, icon, flood, clear, byColor })` (the splat card, the feed, the screen flood).

### Queries (anyone, any time)

| query | answered by | default |
|---|---|---|
| `G.level.liquidY(x, z)` | W / R `liquidY` | −1.6 (the sea) |
| `G.level.noPlace(p, r)` | W / R `noPlace` | false |
| `G.match.stage?.under(p, depth)` | R `under` | false (projectiles, bombs, thrown subs, the buoy sink there) |
| `G.match.stage?.restMask(state)` | R `restMask` | null (Bazookarp: `Uint8Array` over nav nodes, 1 = standable in that state) |
| `G.match.stage?.danger(pos, pad)` | R `danger` | false (Bazookarp drop spot, bots) |
| `G.match.stage?.crushIn(shape, how)` | `G.deploy.crushIn` (subs SPEC §0.3) | **0: a no-op until the deploy package's `crushIn` is on this branch** |
| `G.match.stage?.state()` | R `state` | `{ t, keys }` (tests) |

### Tools

- `build/bake-ao.cjs`: `__G.stageWorld?.bakeMode(true)` around the trace (W `bakeMode(on)`: pipe glass, `bakeClear`
  blocks out of the AO); per-state bakes: see the eras table, T1.
- `src/world/mapThumb.js`, `build/check-maps.mjs`: the three-free data registry `src/world/stageData.js`:
  `registerStageData(key, { thumb(layout, api), check(layout, api) → problems[], overlapOk(a, b) })`, imported by
  `src/world/stageDataList.js` (stub files `eras-data.js`, `pipes-data.js`, `lava-data.js`).

## Hook-ins in shared files

Every one is tagged `[b5-stagehooks]` (grep for it). They call the registry and nothing else.

| file | where | hook |
|---|---|---|
| `src/main.js` | imports; `_buildWorldNow` (14 steps above); boot (`attachEnv`); `on('splatted')`; prompts; frame | world chain, causes, `R.prompt`, `frame.stage` |
| `src/game/match.js` | both setup paths; `update` (twice); `dispose`; soft push | `StageRun.create`, ticks, `noPush` |
| `src/net/netmatch.js` | `F.stage`; `recSplat`; `recStage`; `_sendTick`; `applyRemote`; `_play` `'s'` / `'sm'`; `_hostClock`; `onLeave`; `_adopt`; `packActor` | online |
| `src/net/session.js` | `_practiceJoin` | the late joiner's snapshot |
| `src/game/actor.js` | `reset`, `update` (×3), `damage`, `jumpAnchor`, `canSuperJump`, `_updateSuperJump` | actors |

(The table grows as the remaining hook-ins land; see the commit log.)

## Contract tables

`served` = the registry hook that serves the contract's hook-in; `module-private` = the stage's own files, no shared
edit; **one line** = the only shared-file edit the stage engineer still makes, tagged with their own key.

*(filled in below)*

## Testing

`tools/botlab/tests/stage-mods.js` (testbox, a dummy module registered only in the test) and
`tools/botlab/tests/net-stagemods.cjs` (two clients and a late joiner).

## Cost

A stage without a registered key: `StageWorld.plan` loops over the registered keys once per world build, and every
per-frame hook-in is a null check on `G.stageWorld` / `match.stage`.
