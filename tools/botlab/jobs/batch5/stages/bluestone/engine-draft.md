# Bluestone: the era engine (how the city travels through time)

Engine design for the `bluestone` stage gimmick: one stage whose geometry, colliders, look, nav graph and paint surface
change twice during a match (era 1 "1880s" → era 2 "TODAY" opens routes; era 2 → era 3 "3000s" adds new areas), with a
full-map sweeping front that Commander Tartar (the old telephone) starts. Paper design, 2026-10-04. Nothing here is
built yet. Every file and function named below was read in `/Users/danielosling/Desktop/1/st-b5-design`.

**Decision in one paragraph.** Build one *union world* that holds every era's pieces at once. Each piece carries the
eras it exists in. Everything that is derived from geometry (paint cell liveness, the nav graph, the AO lightmap, the
minimap) is precomputed for all three eras at load, so a jump is a set of cheap switches and never a rebuild. A jump is
driven only by the synced stage clock (nothing new on the wire in a match). A front runs out from Tartar at (0, 0) at
25 m/s, and each piece switches whole (its looks, collision, ink and nav agree) at the moment the front reaches its
centre. Ink on ground that exists in both eras stays. Pieces that vanish take their ink with them, and pieces that
appear arrive blank. One new module, `src/game/eras.js`, does this, with about 20 small tagged hook-ins (`[b5-eras]`).

---

## 1. Findings

### 1.1 What in the engine already helps

| Where | What it gives us |
|---|---|
| `src/world/level.js` block flag `solid` | Every collision query honours it: `Physics.raycast`, `collideCapsule`, `collideBody`, `bodyFits`, `groundProbe`, `cameraProbe` (`src/game/physics.js`), `Level.pointInside`, `Level.groundHeight`, `NavGraph._build` (`src/game/nav.js`), `Minimap._build`, `tower.js column()`. Setting `b.solid = false` removes a block from play completely. `src/game/pods.js` already does exactly this to its plants (`q.blk.solid = false`). |
| `Level.buildGeometry(atlasSize, filter)` | It already builds a mesh from any subset of blocks (grates use it). One mesh per era mask comes for free. |
| `Level.layoutLightmap` / `layoutHash` | The hash is over the faces' rectangles only. A union world has one face set, so it has one hash and one atlas layout for all three eras. Three AO bakes of the same layout fit in one texture (R, G, B). |
| `src/world/variants.js` (`onlyIn` / `notIn`, `layoutFor`, `variantKey`) | Mode variants filter pieces before the world is built. Era tags are orthogonal to them: a `bluestone.tower` world is also a union of three eras. |
| `src/game/stageKit.js` `StageClock` | Match time played (`duration − time`), which every follower already tracks to about ±0.2 s. In Practice it is carried by the host's tick (`netmatch.stageSync`). `movers.js` proves the pattern: a set piece that is a pure function of this clock needs no network records. `tools/botlab/tests/net-stageclock.cjs` tests it. |
| `stageKit.js` nav layers (`navClaim`, `navCommit`, `navRelease`, `navNodesInBox`) | Several owners mark nav nodes "blocked" (+40 route cost, never a goal), and bots whose route enters a newly blocked node replan. We use this for "a piece here is about to change". |
| `stageKit.js` `shoveActor`, `floorFor`, `clearLine`, `shovable` | Pushing a squidkid out of a piece only where its body fits over floor. Each client shoves only its own squidkids. |
| `src/world/paint.js` `startWipe` / `_wipePrep` / `_wipeGate` and `src/fx/inkWipeFx.js` | A world-space front over the whole stage, with a curtain mesh, sound riding the front, and steam. Splat records carry the painter's wave tag so every screen inks or clears each cell by the same rule (fields 14–15 in `netmatch.recSplat`). We copy that idea: splat records near a jump carry the painter's stage-clock time. |
| `src/world/levelMaterial.js` `WAVE_FRAGMENT` (`uWave`, `uWaveT`) | The level shader already draws a uniform-driven front per fragment. The era front is a second chunk of the same kind. |
| `src/world/environment.js` `layout.env` (`backdrop(kit)`, `theme` overrides, `_stageTheme`) | Each stage has its own skyline and theme. We extend it with one set per era. |
| `src/game/minimap.js` `_build` | It rasterises whatever is solid. With a "present" predicate it can rasterise any era. |
| The TAB map diorama (`src/game/cameraRig.js` `_diorama`) | It renders the real scene from overhead, so it shows the current era with no extra work. |
| `src/net/netmatch.js` `exportGrid` / `importGrid` (Practice late join) | The grid is checked by length (`data.n !== this.grid.length`). A union world has the same grid length in every era, so a late joiner's import works whatever era it is. |
| `src/ui/hud.js` `banner`, `_callout`, `_bindBus` | A HUD that listens to bus events. The era chip and callouts hang off it. |
| `src/audio` SFX registry (`movers.js` registers `crossing_bell` itself) | The module synthesises its own sounds. No shared audio file is touched. |

### 1.2 What assumes the world is static (and what it would break)

| Where | Assumption | Consequence for eras (fix in §3.5) |
|---|---|---|
| `Level._buildFaces` → `_faceHidden` | A face is dropped when every point just outside it lies inside *any* solid block. | In a union world an era-1 wall pressed against an era-3 block would lose that face in every era: a hole you can see and can't ink. Face hiding must ask only about blocks present in *all* the eras of the face's own block (H3). |
| `Level.buildGeometry` | One merged mesh. The bevel test checks all solids. Blocks with `!b.solid && !b.render` are skipped at build time. | Era pieces need their own meshes (one per era mask) so they can be hidden. The meshes must be built while every block is still solid (H4, H9). |
| `Level._buildHash` / `addDynamic` | Static blocks sit in the spatial hash. Dynamic ones are scanned linearly by *every* query. | Era pieces must be static hash blocks switched with `solid`, never `addDynamic` (200 dynamic blocks would tax every raycast). |
| `PaintSystem._layout` | The atlas is packed once over all paintable faces. | That is fine: the union packs once. But the atlas density drops as union area grows (measured in §1.3), so union area is a hard limit (§5). |
| `PaintSystem._initGrid` | `dead`, `live`, `turfTotal` are computed once against all solids. `counts` assume a fixed `turfTotal`. | Floor under an era-3 block would be dead in era 1 too. Liveness has to be per era and flipped per piece, with `turfTotal` and `counts` kept in step (§4.1). |
| `PaintSystem.splat` / `regionStats` | Every face of every block near the splat can take ink. Solidity is never checked. | An absent piece would still be inked. The block loop must skip absent and guarded era blocks (H5). |
| `NavGraph` constructor | Built once (`_build` → `_climbEdges` → `_prune`). `valid`, `exitable`, `validIds` are fixed. `blocked` layers are sized `N`. Consumers keep node ids: `bots.js` ZonePlan (`ring`, `far`), `movers.js` `car.nodes`, `pods.js` `p.nav`, `tower.js` `placeholderPath`. | A graph cannot be swapped for another one with different ids. One union graph with an era bit on every edge and per-era `valid` arrays keeps every cached id meaningful (§4.3). |
| `main.js` `_buildWorld` → `_buildWorldNow` | The only way to change geometry is a full rebuild: props, Level, lightmap fetch, new PaintSystem (all ink lost), meshes, decor, nav, minimap, environment. It freezes the simulation (`_building`). Practice's stage swap hides it behind a ≥ 0.9 s card (`practiceSwapStage`). | This rules out option (b) mid-match (§2). |
| `Minimap` | The base raster is built once per layout and viewer side, "~0.1–0.3 s" (its own comment). | Building at a jump would hitch. Three bases are built at load (H14). |
| `environment.js` `rebuildForArena`, `_footprint` (main.js), `_buildStageLook`, `setTheme` | Deck footprint, pilings and the sea's deck field are built once per stage. The backdrop is cached per layout. `setTheme` re-bakes clouds, rebuilds the PMREM env map and the far reflection. | Era-only "deck slabs" at the waterline would show foam in the wrong eras (forbidden in §5). The skyline needs per-era sets. The look must blend cheap uniforms rather than call `setTheme` mid-match (H13). |
| `PropKit.build` (`src/world/props.js`) | Static props are merged into one mesh per material bucket. There is no per-prop visibility. | Era props need their own buckets (material × era mask) with a per-prop flip in the vertex shader (H12). |
| `zones.js` `zoneCells`, `bots.js` `ZonePlan` | Zone cells and bot zone plans are computed once at match start from `P.dead` and `nav.validIds`. | Zones must sit on ground that no era changes (§5). |
| `src/core/renderer.js` GTAO and the sun's shadow map | GTAO draws the scene with `scene.overrideMaterial`, and shadows use the default depth material. Neither runs our shader code. | Geometry hidden only in the shader would still darken GTAO and still cast shadows. Era meshes are hidden with `visible = false` outside a jump. During a jump they get a depth material with the same collapse, and they sit out the GTAO pass (H4, H12). |
| `bake.cjs` / `build/bake-ao.cjs` | One grayscale bake per world key, using the solidity of the moment. | AO from era-1 crates would darken empty ground in era 2. There must be one bake per era, into three channels (T1). |
| `netmatch._sendTick` | Practice's stage clock is sent only from `movers` or `pods`. | A stage with eras but no movers or pods would send no clock in Practice (H11). |

### 1.3 Measurements I took (read-only Node runs of the real `Level`, `Physics` and `NavGraph`; no prop colliders)

| Stage | blocks | nav nodes | nav build | paint atlas ppm at 4096 / 2048 | lightmap rows at 8 ppm in 2048 |
|---|---|---|---|---|---|
| halyard | 168 | 4,954 | 115 ms | 25.4 / 11.9 | 846 |
| calamari | 240 | 7,134 | 160 ms | 23.4 / 10.9 | 904 |
| treehills | 669 | 6,798 | 131 ms | 19.8 / 7.8 | 1,298 |
| nantai | 599 | 5,926 | 110 ms | 21.5 / 8.5 | 1,152 |
| terraces | 610 | 4,816 | 154 ms | 14.2 / 6.1 | 1,999 |

- **Union paint area.** If a stage's paintable area grows by a third, its 4096 atlas density drops about 15 % (calamari
  23.4 → 19.8 ppm; halyard 25.4 → 23.4).
- **A three-era nav prototype.** I tagged about 1/6 of the blocks era-1-only or era-3-only, built three graphs by toggling
  `solid`, and merged them by (cell, height):

  | Stage | 3 builds | merge | union nodes vs one era | union edges vs one era |
  |---|---|---|---|---|
  | halyard | 734 ms (first run, includes JIT warm-up) | 22 ms | +3–5 % | +3–6 % |
  | calamari | 464 ms | 26 ms | +9 % | +9 % |
  | treehills | 445 ms | 18 ms | +3 % | +4 % |

  In the game, prop colliders add blocks, so expect **0.5–1.0 s of extra load for the nav alone**.

---

## 2. Options weighed

| | (a) One union world, tagged per era | (b) Rebuild the world at each jump (as Practice's stage swap does) | (c) Three prebuilt worlds, pointers swapped | (d) Era pieces as dynamic blocks (the pods / movers machinery) |
|---|---|---|---|---|
| **Hitch at the jump** | None if everything derived is precomputed. A jump is flag flips plus a few small GPU clears. | 1–3 s with the simulation frozen (`_building`), on every client at a different moment. Unacceptable mid-match. | None for the swap itself. | None, but every raycast and capsule test loops over every dynamic block (`Level.queryBlocks` `this.dyn` scan). |
| **Ink persistence** | Exact. Shared ground keeps its cells and atlas texels because it is the same face. | Lost. A new PaintSystem is made. Moving the ink across needs a world-space remap of the grid and the atlas. | Needs a GPU blit per shared face between three atlases, plus a cell remap. Complex and error-prone. | Exact on the static ground. Era pieces need BoxPaint (`towerPaint.js`) per block: a second ink system with its own rules. |
| **Nav per era** | One union graph with era-masked edges. Every cached node id stays valid. | Rebuilt (150–400 ms) at the jump. Every cached id (pods, movers, zone plans, bot paths) is invalidated. | Three graphs. Consumers keep ids from the wrong graph. | Blocked layers only. New areas cannot be represented (no nodes on pieces that didn't exist). |
| **Lightmap per era** | One layout hash. Three AO channels in one RGB texture, so GPU memory is the same as today. | One bake per era (three hashes, three textures). | Three textures. | AO baked without the pieces (dark ghosts). |
| **Memory** | Union geometry (+20–35 %), nav +3–10 %, three minimap bases (~18 MB), per-cell era masks (<1 MB). | Lowest at rest, but peak during the rebuild. | Paint atlas ×3 (4096² RGBA with mips ≈ 85 MB each, so +170 MB), level ×3, nav ×3. | Low. |
| **Online agreement** | A pure function of the stage clock. No records. Splats near a jump carry the painter's clock time, so acceptance is exact. | Every client rebuilds at its own speed. The players freeze out of step. | Clock-driven, but ink transfer could differ per client. | Clock-driven. |
| **Fits the engine** | Uses `solid`, `buildGeometry(filter)`, `StageClock`, nav layers, the variants pattern. | Uses the existing swap path. | Fights `G.level` / `G.paint` / `G.nav` singletons everywhere. | Wrong tool: dynamic blocks are for moving things. |

**Recommendation: (a), done properly.** One union world. Era-masked pieces. All per-era derived data built at load. Each
piece switches as a whole when a clock-driven radial front from (0, 0) reaches its centre, so its looks, collision, ink
and nav all change at the same instant. (b) is out because of the freeze and the lost ink. (c) is out because of memory
and ink transfer. (d) is out because of per-query cost and the missing nav for new areas.

Why switch *per piece at its centre* rather than cut pieces per fragment along the front: what you see is always what
collides. A wall is never half-drawn but fully solid. The front still sweeps per fragment over the shared ground (its
light band, the surface re-skin, the era tint and the AO channel), which is what reads as "the city being rewritten as it
passes". Designers split long era pieces into ≤ 8 m segments (§5) so that a sky-walk builds itself segment by segment
behind the front.

---

## 3. The contract

### 3.1 Words used below

- **Era**: 1, 2 or 3. Its **bit** is 1, 2 or 4.
- **Mask**: the eras a piece exists in. Written in layouts as a string: `'1'`, `'12'`, `'2'`, `'23'`, `'3'`. No tag means
  `'123'` (mask 7, "shared").
- **Piece**: a level block (layout box, ramp or obox, or a prop's collider) or a prop placement with a mask other than 7.
- **Group**: the pieces that switch together. Pieces with the same `eraGroup` string on the same half of the stage form a
  group: the key is `eraGroup + (centre z < 0 ? ':a' : ':b')`, so mirrored twins are separate groups. An untagged era
  block is its own group.
- **r_g**: the xz distance from (0, 0) to the centre of the union AABB of a group's members.
- **Jump j**: from era `f` to era `t`, starting at stage-clock time `J`.
- **Front**: radius `25 · (T − J)` metres around (0, 0).
- **Flip**: group g switches at `F = J + r_g / 25`. It **changes** in jump j if its mask has bit f but not bit t
  (it vanishes), or bit t but not bit f (it appears).
- **Guard**: 0.5 s either side of a changing group's flip, during which its faces take no ink.
- **Warn**: the 10 s before `J`.
- **Done**: `J + R_max / 25 + 0.5`, where `R_max` is the farthest paint-face corner or `r_g` from (0, 0), plus 2 m. That
  is about J + 3.7 s on an 80 m stage.

### 3.2 The module: `src/game/eras.js` (new)

```js
// ---- build time (main.js _buildWorldNow); everything here persists with the world
export function eraMask(s)                  // '1' | '12' | '2' | '23' | '3' | undefined → 1 | 3 | 2 | 6 | 4 | 7 ('13' → error)
export function planEras(layout, dressing, mode) → EraWorld | null   // null when layout.eras is absent

export class EraWorld {
  names                                     // ['1880s', 'TODAY', '3000s'] (layout.eras.names)
  uniforms                                  // shared uniform objects read by the level, grate, prop and backdrop
                                            // materials: uEra, uEraK, uEraAO, uEraTint, uEraMap (see §3.5 H8)
  prop(item) → item                         // a dressing item with { eraMask, eraR } added (for PropKit.add)
  colliders(item, cols) → cols              // its prop colliders tagged with { eras, eraGroup } (for new Level)
  attachLevel(level)                        // groups, keys, r_g, b.eraG, b.eraR; level.eraCount = 3 (all still solid)
  attachPaint(paint)                        // per-cell era masks; per-group own / under cell lists
  buildMeshes(scene, level, atlasSize, levelMat, grateMat)   // one level (and grate) mesh per era mask present
  buildNav(level, physics) → NavGraph       // three builds (solidity per era) merged into one era-masked graph
  attachMinimap(minimap)                    // three base rasters, built in the minimap's idle pass
  apply(era, { instant: true })             // put the whole world in one era at once (no animation)
  flipGroup(g, on)                          // one group present / absent now (solid, paint, devices, shove)
  present(block, t) → bool                  // was this block present at stage-clock time t (pure function)
  inkOk(block, t) → bool                    // may this block's faces take ink at time t (present and not guarded)
  near(t) → bool                            // is t inside [J − 1, done + 1] of some jump (splats then carry t)
  now() → number                            // the current match's stage clock (G.match?.eras?.clock.t ?? 0)
  dispose()
}

// ---- per match (match.js, like StageMovers / StagePods)
export class StageEras {
  static create(match) → StageEras | null   // null without G.eraWorld; applies the starting era instantly
  clock                                     // a StageClock (stageKit.js)
  update(dt)                                // Match.update, before movers / pods / actors
  get era()                                 // 1..3: the era in force once the current jump is done
  eraAt(x, z) → 1..3                        // the era in force at a point right now (front-aware)
  phase                                     // 'idle' | 'warn' | 'jump'
  next                                      // { from, to, at, inS } or null (the HUD's countdown, the bots' knowledge)
  front                                     // current front radius (m), or -1
  dangerAt(pos, pad = 0.5) → bool           // on / in a group that changes in the coming or running jump
  outlines()                                // [{ x, z, hx, hz, yaw, appear: bool }] changing pieces (minimap, warn → done)
  fresh                                     // Uint8Array over nav nodes new in this era (30 s after a done), or null
  state()                                   // test snapshot: { era, phase, from, to, t, next, front, flips, navEra, turfTotal }
  debugJump(to, { instant = false } = {})   // tests and audits only
  dispose()
}

export const ERA_GLSL = { vertPars, vert, fragPars, fragBase, fragAO, fragFront }   // injected by levelMaterial (H8)
export function eraMaterial(mat) → Material          // a clone of a prop / scenery material with the era vertex collapse
export function eraDepthMaterial() → MeshDepthMaterial   // shadows of era meshes collapse the same way
```

Internally the module also owns `EraFx`: the curtain mesh, glyph particles, the "construction holograms" of appearing
pieces, Tartar's part (built with `stageKit.buildLook`), and the synthesised sounds `era_ring`, `era_pickup`,
`era_swell`, `era_front` (loop riding the front, like `ink_wipe_fizz`) and `era_pop`. It reads `?era=1|2|3` from
`location.search` for audits: start in that era and never jump.

### 3.3 What a stage layout gives it (exact format)

```js
// src/world/stages/bluestone/layout.js
export const LAYOUT = {
  id: 'bluestone',
  bounds: { minX: -40, maxX: 40, minZ: -72, maxZ: 72 },   // must contain EVERY era's pieces
  spawnPads: [[0, 2.4, -66], [0, 2.4, 66]], spawnBarrier: 4.2,
  eras: {
    names: ['1880s', 'TODAY', '3000s'],                    // HUD labels (≤ 8 characters)
    at: [1 / 3, 2 / 3],                                    // jumps start at these shares of regulation time
    warn: 10, speed: 25, guard: 0.5,                       // s, m/s, s (the defaults; change only with the lead)
    modes: {                                               // per mode: omit = 'at'; { fixed: e } = one era, no jumps;
      boss: { fixed: 3 },                                  //   { cycle: s } = a jump every s seconds, 1→2→3→1 …
      practice: { cycle: 60 },
      attract: { cycle: 40 },
    },
    tartar: { type: 'bluestone_tartar', pos: [0, 9.6, 0], rotY: 0 },   // the telephone (a PropKit type the stage
                                                                       //   registers); x = z = 0 is required
    tint: { 1: [1.05, 0.99, 0.90, 0.30], 2: [1, 1, 1, 0], 3: [0.96, 1.00, 1.05, 0.12] },   // shared surfaces:
                                                                       //   rgb multiplier, desaturation 0..1
    remap: [{ base: 'setts', eras: ['setts', 'asphalt', 'lumitile'] }],  // ≤ 4 surface re-skins (stage surface names)
    look: {                                                // environment per era, applied over the time of day
      1: { theme: { all: { haze: [0.55, 0.012, 1.2], fog: [40, 230] } }, lamps: '#ffb35c' },
      2: { lamps: '#ffd9a8' },
      3: { theme: { all: { horizon: '#bfe6ff' } }, lamps: '#9ff3ff' },
    },
  },
  single: [ /* mid pieces; may carry eras / eraGroup */ ],
  half: [
    // ---- era 1 only: the boarded-up arcade entrance closes the arcade lane (era 2 opens it)
    B(9.0, 13.0, 0, 3.6, -21.3, -20.9, { tag: 'arcade-boards', eras: '1', eraGroup: 'arcade-door',
      color: '#8a6a48', pattern: PATTERN.planks }),
    // ---- era 1 only: crates filling a laneway (standable top 1.6 m: a drop when it goes, never over water)
    B(-15.5, -12.5, 0, 1.6, -34.0, -30.0, { tag: 'lane-crates', eras: '1', eraGroup: 'lane-crates',
      color: '#a7855c', pattern: PATTERN.wood }),
    // ---- era 2 only: the construction hoarding on the site of the era-3 sky-walk stair. Solid, 2.4 m, roof top,
    //      not inkable, so nobody can be inside the stair's footprint when it appears
    B(17.9, 21.1, 0, 2.4, -44.9, -33.2, { tag: 'skywalk-site', eras: '2', eraGroup: 'skywalk-stair',
      roof: true, paint: false, color: '#d8c9a8' }),
    // ---- era 3 only: the stair (23.9°: 4.6 m up over 10.4 m) on that site, same group: it appears as the hoarding goes.
    //      A thin flight (thin: true): a thick ramp slab reaches 1.8 m past its top edge underneath (level.js ramp
    //      thickness) and would hang a sloped wall under the deck. Its footprint (x 18.3…20.7, z −44.6…−33.5) lies
    //      inside the hoarding's
    R([19.5, 0, -44.0], [19.5, 4.6, -33.6], 2.4, { tag: 'skywalk-stair', eras: '3', eraGroup: 'skywalk-stair',
      thin: true, thickness: 0.3, pattern: PATTERN.treads }),
    // ---- era 3 only: sky-walk deck in 4 m segments (underside 4.2, top 4.6), each its own group so it builds
    //      segment by segment behind the front
    B(17.9, 21.1, 4.2, 4.6, -33.6, -29.6, { tag: 'skywalk', eras: '3', eraGroup: 'skywalk-1' }),
    B(17.9, 21.1, 4.2, 4.6, -29.6, -25.6, { tag: 'skywalk', eras: '3', eraGroup: 'skywalk-2' }),
    // (its railings: rail blocks with the same eras / eraGroup as the deck segment they belong to)
  ],
  env: { bay: false, backdrop: buildBackdrop /* returns { static, …, eras: { 1: {…}, 2: {…}, 3: {…} } } */ },
};

// src/world/stages/bluestone/props.js: placements take the same two keys
export const PLACEMENTS = [
  { type: 'bluestone_gaslamp',     pos: [-8, 0, -24], eras: '1' },
  { type: 'bluestone_streetlight', pos: [-8, 0, -24], eras: '2' },
  { type: 'bluestone_lightmast',   pos: [-8, 0, -24], eras: '3' },
  // a swap group: the same spot holds a cable tram, then a tram, then a hover tram (each new footprint fits inside the old)
  { type: 'bluestone_cabletram', pos: [-4, 0, -14], rotY: 0.52, eras: '1', eraGroup: 'tram-a' },
  { type: 'bluestone_tram',      pos: [-4, 0, -14], rotY: 0.52, eras: '2', eraGroup: 'tram-a' },
  { type: 'bluestone_hovertram', pos: [-4, 0, -14], rotY: 0.52, eras: '3', eraGroup: 'tram-a' },
];

// src/world/stages/bluestone/backdrop.js: the skyline per era
export function buildBackdrop(kit) {
  return {
    static: [/* river banks, hills: every era */], terrain: [/* … */],
    eras: {
      1: { static: [/* low 1880s skyline: domes, spires, chimneys */], instances: [/* … */] },
      2: { static: [/* glass towers behind old facades */] },
      3: { static: [/* spires, sky-bridges */], objects: [/* floating trams, animate via the main animate() */] },
    },
    animate(t) {},
  };
}
```

The jump times that follow from `at: [1/3, 2/3]`:

| Mode | Regulation | Jump 1 (1 → 2) starts | Jump 2 (2 → 3) starts | Notes |
|---|---|---|---|---|
| Turf War 3:00 | 180 s | 60 s played (2:00 left) | 120 s played (1:00 left) | Era 3 is the last minute (with `match:oneminute`'s music). |
| Turf War 1:30 | 90 s | 30 s | 60 s | |
| Zone Control, Tower Command | 300 s | 100 s | 200 s | No jumps in overtime: the world stays in era 3. |
| Bazookarp | its duration (spec pending) | 1/3 | 2/3 | |
| Boss Battle | — | — | — | `fixed: 3`. The era is applied before `BossMode` builds its own nav. |
| Practice (online and offline) | — | every 60 s | | 1→2→3, then a "rewind" jump 3→1 with the same warning. |
| Menu backdrop (attract, `duration: 99999`) | — | every 40 s | | |

### 3.4 Timeline of one jump (jump 1 of a 3:00 Turf War; `R_max` ≈ 80 m)

| Stage clock | What happens (identical on every screen, from its own clock) |
|---|---|
| 50.0 s (`J − 10`) | **Warn.** Tartar's first ring (`era_ring`, the phone prop shakes). HUD callout "TIME JUMP" / "1880s → TODAY in 10", the era chip pulses. Holograms (wireframe boxes, 25–45 % opacity, pulsing 2 Hz, in era colour) show every group that will appear. Groups that will vanish get a 15 % sepia flicker. The minimap outlines both kinds. The bots' danger layer goes on. Appearing faces' atlas rects and grid cells are cleared. `era:warn` |
| 55.0 s | Second ring. |
| 57–59 s | Short rings each second. The vanishing flicker strengthens. |
| 59.0 s | Tartar picks up (`era_pickup`); a beam rises from the phone. |
| **60.0 s (`J`)** | **The front leaves (0, 0) at 25 m/s.** Curtain (10 m tall), `era_swell`, a 0.25 screen shake, the environment look starts blending. `era:jump` |
| 60 + r_g/25 s | **Group g flips**: blocks `solid` on or off, ink guard ±0.5 s, cells re-counted, own squidkids shoved or rescued, own devices on vanished blocks popped. The visual dissolves in or out over 0.3 s. `era:flip` |
| 63.2 s (`J + R_max/25`) | The front leaves the arena. The "horizon run" (1.3 s) sweeps the backdrop sets. |
| **63.7 s (done)** | Nav switches to era 2, the danger layer is released, bots whose route uses an edge gone in era 2 replan. Minimap base swapped. HUD "NEW ROUTES OPEN" (1→2), "NEW AREAS!" (2→3), "BACK TO THE 1880s" (rewind). `era:done` |
| 64.5 s | Environment blend complete (env map rebuilt once if the era's sky differs). |
| 64.7 s (done + 1) | Vanished faces' atlas rects and grid cells cleared (all late splat replays have landed). |

### 3.5 Hook-ins in shared files (each short and tagged `[b5-eras]`)

| # | File, function | Change |
|---|---|---|
| H1 | `src/world/level.js` `Level._addBlock` | Copy `b.eras = eraMask(d.eras)` (default 7) and `b.eraGroup = d.eraGroup ?? null`. Add `b.eraG = -1`, `b.eraR = 0`, `b.eraOff = false`. |
| H2 | `level.js` `Level._build` (the `extra` → def mapping) | Forward `eras` and `eraGroup` from prop colliders. |
| H3 | `level.js` `pointInside(p, pad, exclude, need = 0)` | Skip blocks with `need && (b.eras & need) !== need`. `_faceHidden` and the `groundedBottom` test pass `need = this.blocks[f.block].eras`. `buildGeometry`'s `bevelled()` passes `b.eras`. Stages without eras: every mask is 7, so nothing changes. |
| H4 | `level.js` `buildGeometry` | When `this.eraCount`: write a `vec2` attribute `aEra = (b.eras, b.eraR)` per vertex. |
| H5 | `src/world/paint.js` `splat` (block loop) and `regionStats` (block loop) | `const E = G.eraWorld, et = E ? (opts.et ?? E.now()) : 0;` then per block `if (E && b.eraG >= 0 && !E.inkOk(b, et)) continue;`. In `regionStats`: `if (b.eraOff) continue;`. |
| H6 | `paint.js` new `clearFaces(faceIds)` (~25 lines) | Zero the faces' grid cells (decrementing `counts` for live ones), draw zero into their atlas rects (a quad per face, `NoBlending`, like `_wipeBand`), `version++`. |
| H7 | `src/game/nav.js` `NavGraph.path` and `_climbBarred` | In `path`: `const EB = this.eraBit \| 0;` and in the edge loop `if (EB && e.em !== undefined && !(e.em & EB)) continue;`. In `_climbBarred`: `if (b.eraOff) continue;`. |
| H8 | `src/world/levelMaterial.js` `createLevelMaterial(…, opts)` | With `opts.eras`: `defines.ERAS = 1`, merge `opts.eras.uniforms` (shared objects), inject `ERA_GLSL.vert` after `#include <project_vertex>`, `fragBase` before `${INK_COLOR}` (remap and tint act on the bare surface only), `fragAO` in the `aomap_fragment` replacement (`dot(texture2D(uLight, vLightUv).rgb, eraOneHot)`), and `fragFront` next to `WAVE_FRAGMENT`. Program key `+ '-eras'`. Without `opts.eras`, the program is byte-identical to today. |
| H9 | `src/main.js` `_buildWorldNow` | The chain in §3.6. About 12 lines. |
| H10 | `src/game/match.js` both setup paths, `update`, `dispose` | Add `this.eras = StageEras.create(this)` *before* `ZoneControl`, `TowerCommand` and `BossMode` (zone cells and the boss nav must see the starting era). Call `this.eras?.update(dt)` before `this.movers?.update(dt)`. Dispose it. |
| H11 | `src/net/netmatch.js` `_sendTick`, `recSplat`, `_play` case `'s'` | `_sendTick`: the Practice stage clock becomes `movers ?? pods ?? eras` clock. `recSplat`: when `G.eraWorld?.near(t)`, pad the pod field (0) and the wave tag (the real one, or `[0, 9999]`: equivalent to no tag, see `_wipeGate`), then push `r2(t)` as field 15. `_play`: `if (e[16] !== undefined) opts.et = e[16];`. |
| H12 | `src/world/props.js` `PropKit.add`, `_push`, `build`; new `eraMeshes()` | When `o.eraMask` is not 7: the bucket key becomes `material + '\|e' + mask`. Its parts carry `aEra = (mask, o.eraR)`. In `build()`, those buckets get `eraMaterial(this.mat[key])`, `customDepthMaterial = eraDepthMaterial()` and `userData.eraMask`. Era props are static merged parts only (no spinners, blinkers, flags, banners or cloth). |
| H13 | `src/world/environment.js` `_stageTheme`, `_buildStageLook`, `patchScenery`, new `setEra(from, to, k, farR)` | `_stageTheme(name, era)` layers `env.eras.look[era].theme` after the time of day. `_buildStageLook` builds `out.eras[e]` like the main set into `this.eraSets[e]` with `patchScenery(…, { era: bit })`. That flag injects a clip by `length(vW.xz)` against `uEraFar` (from mask, to mask, radius, on). `setEra` lerps the cheap theme uniforms (sky, haze, fog, sun, hemi), assigns a blended `this.grade` (the renderer re-applies a grade when its object changes), toggles the sets, and rebuilds the env map once at k = 1 if the sky differs. |
| H14 | `src/game/minimap.js` `_build(present = (b) => b.solid)`, new `setEra(e)`, live layer | Use the predicate in step 1 (block tops) and step 2 (turf faces: `present(blocks[f.block])`). Cache `{ base canvas, pixCell, pixFx, pixFy, pixSx, pixSy }` per era (built in the existing idle pass and on `setViewerTeam`). `setEra` swaps them and sets `version = -1`. Draw `G.match?.eras?.outlines()` in the live layer: appearing pieces as dashed cyan, vanishing ones as amber hatch. |
| H15 | `src/ui/hud.js` `_bindBus`, timer area | Map `era:warn`, `era:jump`, `era:done` and `era:set` to `_callout` / `banner`. Add an era chip under the clock (name, and the countdown during warn from `G.match.eras.next.inS`). |
| H16 | `src/game/bots.js` `_pickPaintGoal`; `ZonePlan` | For 30 s after a done, nodes in `G.match.eras.fresh` weigh ×2 as paint goals. ZonePlan skips `ring` / `far` ids with `!nav.valid[id]` at pick time. |
| H17 | `src/game/subs.js` constructor; `src/game/sp-surf.js` | `on('era:flip', …)`: an own (non-ghost) item whose `it.face` belongs to a block in `off`, or whose `pos` is inside a block in `on`, is `_destroy`ed. Its existing end record pops it on every screen. The buoy (`sp-surf.js`) whose anchor block is in `off` does `_drop('gone')` (falls and anchors again). |
| H18 (optional) | `src/game/movers.js` `_place` / `_navMark` | Moving trams per era: a car whose def has `eras` and whose era at its position is absent is parked off (block `solid = false`, mesh hidden, nothing marked). |
| H19 | `src/world/mapThumb.js` | Draw the era-1 layout; era-3-only pieces as dashed outlines (stage select, `check-maps --svg`). |
| T1 | `tools/botlab/bake.cjs`, `build/bake-ao.cjs` | If `__G.eraWorld`: for e = 1..3, `__G.eraWorld.apply(e)`, bake, write the result into channel e−1. Write an RGB PNG (colour type 2; a gray PNG for other stages) and add `eras: 3` to the JSON. One hash. |
| T2 | `build/check-maps.mjs` | Skip overlap pairs whose masks don't intersect. Check each era's build as `bluestone#1`, `#2`, `#3`. Check the §5 limits that can be checked statically (group size, deck slabs, fenced footprints, spawn and objective distances, union area, lightmap rows). |
| T3 | `tools/botlab/shoot.cjs`, `stageart.cjs`, `tests/spawn-mid.js`, `cover-map.js`, `size-budget.js`, `stage-audit.js` | An `ERA=1\|2\|3` variable: `G.eraWorld.apply(n)` / `?era=n` before measuring or shooting. |

### 3.6 The world-build chain with eras (`main.js` `_buildWorldNow`, in this order)

```js
const plan = planEras(MAP_LAYOUTS[layoutId], dressing, mode);            // [b5-eras] null for every other stage
for (const it of dressing) { … const r = this.props.add(it.type, plan ? plan.prop(it) : it);
  if (r?.colliders) colliders.push(...(plan ? plan.colliders(it, r.colliders) : r.colliders)); }
const level = (G.level = new Level(layout, colliders));                  // blocks carry eras / eraGroup (H1–H3)
G.eraWorld = plan ? plan.attachLevel(level) : null;                      // groups, r_g; every block still solid
G.physics = new Physics(level);
const lightmap = await this._loadLightmap(level, worldKey);              // unchanged: an RGB PNG loads the same
G.paint = new PaintSystem(…);                                            // the atlas covers the union
G.eraWorld?.attachPaint(G.paint);
this.levelMat = createLevelMaterial(…, { lightmap, texlib, eras: G.eraWorld });   // (grate likewise)
this.levelMesh = new THREE.Mesh(level.buildGeometry(size, G.eraWorld ? (b) => !b.grate && b.eras === 7 : undefined), …);
G.eraWorld?.buildMeshes(scene, level, size, this.levelMat, this.grateMat);
this.decor = new Decor(scene, level);
G.nav = G.eraWorld ? G.eraWorld.buildNav(level, G.physics) : new NavGraph(level, G.physics);
this.minimap = new Minimap(level, G.paint); G.eraWorld?.attachMinimap(this.minimap);
G.env.rebuildForArena(…);                                                // the union footprint (§5 bans era deck slabs)
G.eraWorld?.apply(1, { instant: true });                                 // the world rests in era 1
```

`buildNav` needs the paint atlas (climb edges require `f.atlas`), so it runs after the paint system. It sets each era's
solidity in turn, builds a `NavGraph`, merges, and restores era 1.

### 3.7 Events (the bus, `emit` from `core/ctx.js`)

| Event | Payload | When |
|---|---|---|
| `era:warn` | `{ from, to, at, inS: 10, names }` | `J − 10` |
| `era:ring` | `{ n, pos }` | each ring (Tartar's animation, sound) |
| `era:jump` | `{ from, to, t0, speed, origin: [0, 0], reach: R_max }` | `J` |
| `era:flip` | `{ group, on: [blockIds], off: [blockIds], r }` | each group's flip |
| `era:done` | `{ era }` | done |
| `era:set` | `{ era, instant: true, why: 'start' \| 'late' \| 'clock' \| 'debug' }` | instant apply: match start, Practice late join, a stage-clock snap > 1.5 s, debug |

---

## 4. What it means for each system

### 4.1 The paint grid and turf counting

- **At load** (`attachPaint`), for every paint cell k: `faceMask` is the eras of its face's block. `buriedMask` is the OR
  of the eras of every other block containing the cell's sample point (centre + 0.06 m along the normal, the same point
  `_initGrid` uses). `deadE[k] = (~faceMask | buriedMask) & 7`, so the cell is live in era e when its face is turf and bit
  e is clear.
- **Per group**, the module keeps two cell lists: its own faces' cells, and the "under" cells of other faces whose sample
  points lie inside one of its blocks.
- **`apply(e)`** writes `P.dead` and `P.live` from the bits. It recounts `P.counts`, `P.turfTotal` and `P.turfArea` in one
  pass (about 300–650 k cells, a few ms), then does `version++`.
- **On a flip**, only that group's two cell lists are re-evaluated with the current solidity (`level.pointInside`). Counts
  are adjusted cell by cell: a live inked cell that dies is subtracted, a dead inked cell that comes alive is added.

**What happens to ink:**

| Surface | Rule |
|---|---|
| Ground and walls in every era (mask 7), re-skinned or not | The ink stays. It "travels through time". The surface under it may change texture (remap) or tint. |
| A piece that vanishes | Its ink goes with it: its cells stop counting at its flip. Its grid cells and atlas rects are zeroed at done + 1 s, so it would come back blank (Practice rewind). |
| Ground revealed under a vanishing piece | It becomes turf and counts as it lies. It is usually blank. Any ink that seeped under its edges before (`_cpuSplat` writes dead cells too) counts, and it is the same on every screen. |
| A piece that appears | It arrives blank: its faces are cleared at warn. It takes no ink until 0.5 s after its flip. |
| Ground covered by an appearing piece | It stops counting. Its ink stays in the grid, unseen, and only matters if the piece vanishes again (Practice). |
| Turf % | Always out of the turf that exists *now* (`coverage()` uses the live `turfTotal`). The Turf War result is counted on era 3. The host's count is the result on every screen, as today. |

**The ink guard is exact across screens.** `inkOk(b, t)` is a pure function of time: the block's group is present at t and
t is not within 0.5 s of its flip. A local splat uses its own clock. A replayed splat uses the painter's clock (`opts.et`,
H11), so every screen accepts or rejects it the same way. The arithmetic: if the painter's clock leads the receiver's by s
and the playback delay is d (85–300 ms), an accepted splat lands on the receiver with the face present as long as
`|s − d| ≤ 0.5 s`. Clearing appearing faces at warn rather than at flip means a replay that arrives "early" on a lagging
screen is not wiped by that screen's later flip.

**Practice "Clear all ink"** (`startWipe`) clears every union face, absent ones included, on every screen alike. The
era front and the wipe have separate uniforms and can run together.

### 4.2 Colliders, physics, players and devices

- Collision is `b.solid`. Nothing in `physics.js` changes. Era blocks are static blocks in the spatial hash, so absent
  ones cost one skipped `solid` check per query. Era-only blocks are capped at 35 % of all blocks (§5).
- **A piece that appears**: by the layout rules (§5) nobody can stand in its footprint. As a safety net, on its flip each
  client checks its own squidkids (`shovable`). Anyone whose body overlaps the piece (`Physics.bodyFits` false) is pushed
  with `shoveActor` to the first fitting spot outside the footprint: 16 directions × [0.5, 1, 1.5, 2, 3, 4] m, `floor` and
  `line` on. Failing that, they go to the nearest valid nav node within 8 m outside the danger box, and `netTp` is bumped
  so others cut instead of glide. Every shove is counted in `stats.eraShoves`; the bot-match audit expects 0.
- **A piece that vanishes under someone**: they fall. The layout rules keep every vanishing walkable top ≤ 2.6 m above a
  floor that exists in the new era, and never over water. If the floor under an own squidkid is water after a flip
  (Practice's 3→1 rewind can drop era-3 floors over the river), it is *rescued*: moved to the nearest valid node within
  10 m, with a puff.
- **Squids on a vanishing wall** drop. Their wall probe finds nothing.
- **Devices** (H17): the owner's screen pops any of its sprinklers, beacons, curtains, mines or cling bombs stuck to a
  vanished block, or caught inside an appeared one. The owner's existing end record pops the ghosts everywhere. The buoy
  falls and anchors again (`sp-surf.js _drop('gone')`). Thrown or moving things (Waddle, Torpedo, shots) just collide
  with whatever is solid at that moment.
- **Shots and hits** are decided on the shooter's screen against its own world, as always. Near a flipping piece the
  screens disagree for at most the clock skew (≈ 0.2 s).
- **Spawn pads, the spawn terrace and the first 15 m of every route out of it never change** (§5). A super jump that lands
  on a teammate who stood on a vanished piece lands where they were, and physics resolves it.

### 4.3 The nav graph and bots

**One union graph** (`buildNav`):
1. Three `NavGraph`s are built, one per era's solidity.
2. Nodes are merged by (cell `ix, iz`, height within 0.15 m). Each union node gets `em` (its eras), plus `wetE` and
   `overWaterE` per era (water proximity changes when the river platform appears).
3. Edges are the union of the three graphs, keyed (from, to, type), each with `em`. Climb edges keep their per-era
   `rise` / `wallP` / `topY`.
4. Each era's `_prune` result is mapped to union ids: `validE[e]`, `exitableE[e]`, `validIdsE[e]`.

Measured: union ≈ 1.03–1.09 × one era's nodes and edges. Merge ≈ 20–30 ms.

**Switching era** (at done, or in `apply`): set `nav.eraBit`, point `nav.valid` / `nav.exitable` / `nav.validIds` at the
era's arrays, copy each node's `wet` / `overWater` from the era columns (≈ 7 k nodes, < 1 ms). Then every bot whose
remaining path uses an edge without the new bit gets `path = null, repath = 0`. `nearest()` needs no change: absent nodes
are not `valid` in that era. `path()` needs one mask check (H7). Every cached id stays meaningful: movers' and pods'
layers, zone plans, `blocked`.

**How a bot knows**: from what the HUD shows everyone, never from hidden data. `G.match.eras.next` gives the coming jump
and its countdown. `dangerAt(pos)` says whether a point is on or in a piece that is about to change.

**How a bot plans:**
- From warn to done, a nav layer (`navClaim(eras)`) marks every changing group's footprint (`navNodesInBox` over each
  block, pad 0.6 m, heights from block bottom − 1.0 to top + 0.3). Routes pay +40 to enter, and goals skip those nodes.
- At warn, every bot whose nearest node is marked drops its goal (`goal = -1, path = null`) and leaves. Bots stop
  loitering on vanishing crates or inside future stair sites.
- During the jump, the nav still describes the old era, but every changing spot is marked. Bots neither walk into an
  appearing piece nor take an opening route early.
- At done, the nav switches, bots replan, and the layer is released. For 30 s after a done, nodes new in this era
  (`fresh`) weigh ×2 as paint goals (H16). They are blank anyway, so bots head for the new areas.
- Bots use era-2 shortcuts and era-3 stairs, ramps, climbs and sky-walks automatically, because the graph has them.

**Boss**: `fixed` era, applied before `BossMode` is constructed (H10 ordering). Its own nav never sees a change.

### 4.4 The camera

`cameraProbe` raycasts against solids, so the boom reacts to whatever is present. The rules keep it comfortable:
- Overhead era decks have their underside ≥ 4.0 m above the walkable ground below and are ≤ 6 m wide where they cross a
  route. The pivot is 1.85 m above the feet and the boom 4.5 m, so the lens stays under or beside them.
- A piece appearing between the lens and the player pulls the boom in on the next frame. The existing see-through window
  keeps the player visible.
- The jump adds a 0.25 shake (`emit('shake')`).
- The TAB diorama renders the scene, so it shows the era, the holograms and the curtain as they are.

### 4.5 The HUD and the maps

- **Era chip** under the timer: "1880s" / "TODAY" / "3000s". During warn it shows the countdown 10…1 with Tartar's phone
  glyph (an SVG in the HUD's style).
- **Callouts**:
  - at warn: "TIME JUMP" with the sub-line "1880s → TODAY";
  - at the jump: a big banner with the new era's name for 1.2 s;
  - at done: "NEW ROUTES OPEN" (1→2), "NEW AREAS!" (2→3) or "BACK TO THE 1880s" (rewind).
- **Minimap**: three base rasters, swapped at done (H14). From warn to done the live layer outlines changing pieces:
  dashed cyan for appearing, amber hatch for vanishing.
- **Stage select thumbnail and `check-maps --svg`**: era 1, with era-3 additions dashed (H19).
- **Stage art**: the designers' call; `stageart.cjs` takes `ERA=n` (T3).

### 4.6 The lightmap bake and mode variants

- **One union world per world key** (`bluestone`, and `bluestone.zones` / `.tower` / `.bazookarp` only if that mode
  needs its own pieces). Each key has one layout hash and one RGB lightmap: R = era-1 AO, G = era 2, B = era 3 (T1).
  - The level shader picks the channel per fragment: shared ground by front side, era meshes by their piece's era.
  - The GPU texture is the same size as today's gray maps (the loader makes RGBA either way).
  - The PNG grows from about 1× to 2–3× its compressed size.
- **Bake time** is ×3 per key: a Mac mini job.
- **The hash lock still works.** Bake once after the last geometry or collider change, and `stage-audit.js` proves the
  bake applies ("lightmap applied").
- **Prefer one layout for every mode** (STAGE-RULES rule 8). Every mode variant multiplies bakes by three and adds a world
  to verify per era.

### 4.7 Online

- **No new records in a match.** The era state is a pure function of the stage clock (`duration − time`), which
  followers already track (`netmatch._hostClock` nudges `m.time`; `StageClock` follows with ±0.2 s, snapping beyond
  1.5 s). On a snap, the module re-derives the state for the new time and applies it at once (`era:set`, `why: 'clock'`).
- **Practice.** The host's tick carries the stage clock (H11, one line), and followers' `StageClock.tick` already reads
  `stageSync`.
- **Splats near a jump** carry the painter's stage-clock time (H11, field 15, only inside `[J − 1, done + 1]`). The ink
  guard is evaluated with it, so the same cells are inked on every screen.
- **Late join** (rooms lock during matches, so only Practice): the joiner's era comes from the host's clock on its first
  tick and is applied instantly (`era:set`, `why: 'late'`). The turf copy (`importGrid`) has the same length in every
  era. If it lands before the era is applied, the era apply recounts.
- **Host change**: the clock moves with the host (`m.time` continues), so the next jump happens on time. Nothing to hand
  over.
- **Who decides what**: each screen flips its own world, shoves and rescues its own squidkids, and pops its own
  devices. Shooters decide hits. The host's count is the result.
- **Tolerance**: flip times differ between screens by the clock skew. `net-eras.cjs` asserts < 0.4 s with
  `netlag=150&netjitter=50`.

### 4.8 Performance against the Halyard budget (334 draw calls / 3.0 M triangles / 3.75 ms cpuRender, loadMs ≈ 6.8 s)

| Item | Steady state (any era) | During a jump (≈ 4.5 s) |
|---|---|---|
| Level draws | Shared mesh + ≤ 3 era meshes (masks containing the era among 1, 3, 2, 6, 4) + their grate twins: ≤ +6 | The other era's meshes too: ≤ +6 more |
| Prop draws | ≤ 3 masks × ≤ 5 materials: ≤ +15 | ≤ +15 more |
| Backdrop draws | One era set ≤ 6 | Two sets ≤ 12 |
| FX | 0 | Curtain 1, glyph particles 1, holograms 1 |
| **Target** | **≤ 334 calls, ≤ 3.0 M tris** | **≤ 390 calls, ≤ 3.6 M tris** |
| CPU per frame | O(1): the clock and the next jump | Flips (a few groups per frame, each ≤ ~2 k cells re-evaluated), uniforms, fizz loop: ≤ 0.5 ms |
| GPU per frame | Level shader: uniform branches only (`uEra.w`) | Front band, dissolve, holograms: like the Practice wipe |
| Load | Nav ×3 + merge (+0.5–1.0 s, scaled up from the Node prototype in §1.3), paint masks (+50–100 ms), era meshes, minimap ×3 (0.3–0.9 s, in the idle pass after load) | — |
| **Load target** | **loadMs ≤ 7.6 s (Halyard + 0.8 s)**. Above that, step 4b: rebuild eras 2–3 only in cells within 3 m of a changing piece. | — |
| Memory | Union geometry +20–35 %, nav +3–10 %, per-cell masks < 1 MB, group cell lists < 0.5 MB, minimap bases ≈ 18 MB, env maps (only if era skies differ) up to 3 PMREM targets | — |

No hitch at the jump: every rebuild-class job is done at load.

---

## 5. Rules for the level designer (hard limits)

**Tags**
1. `eras` is one of `'1'`, `'12'`, `'2'`, `'23'`, `'3'`. Never `'13'`; untagged means all three. Mode tags (`onlyIn` /
   `notIn`) may be combined with it.
2. `layout.bounds` contains every era's pieces.

**Groups**
3. The union AABB of a group's members is ≤ 8 m on its longest horizontal side. Split long pieces (sky-walks, hoardings)
   into ≤ 8 m segments, one group each.
4. A group never crosses z = 0 (the mirror line). A single mid piece on the line is its own group.
5. At most 12 blocks and 12 props per group.
6. At most 48 groups change in one jump (24 per half) and at most 160 level blocks (prop colliders included).

**Budgets**
7. Era-only blocks are ≤ 35 % of all blocks.
8. The union's paintable area is ≤ 20,000 m² (atlas ≥ ~22 ppm on high). Era-only paintable area is ≤ 25 % of that.
9. The union lightmap fits `layoutLightmap(8, 2048)` with ≤ 1,800 rows used (Terraces uses 1,999; Halyard 846).
10. Every era's visible scene (shoot.cjs `ERA=n`) is within 334 draw calls and 3.0 M triangles.

**Turf**
11. Era 2's turf area is within ±10 % of era 1's.
12. Era 3's turf is ≥ era 2's and ≤ 1.25 × era 2's. Era 3 adds, it never takes away turf.
13. The inkable area that vanishes in one jump is ≤ 8 % of that era's turf.

**Never changes**
14. Nothing changes within 12 m (xz) of a spawn pad, on the spawn terrace, or on the first 15 m of every route out of it.
15. Nothing changes within 2 m of a zone outline (at any height).
16. Nothing changes within 1.0 m of the tower track's swept platform plus its 3.72 m headroom.
17. Nothing changes within 3 m of a Bazookarp pedestal, checkpoint or goal (when that spec lands, its Rainmaker-free
    zones may carry `eras`).
18. Tartar's tower at (0, 0) never changes.

**Appearing pieces** — a piece whose bottom is < 3.4 m above a walkable surface beneath it (3.4 m = a swim-jump apex of
1.77 m + a 1.45 m kid + margin) may only appear where:
19. its footprint lies entirely inside a solid of the era before, in the same group: a hoarding, a crate stack, an older
    tram. The old solid's walls ≥ 1.9 m high must be non-inkable (`paint: false`) with a `roof` top, so nobody climbs in;
    or
20. it is over water or void (no floor beneath within 3.4 m).

**Overhead pieces**
21. Pieces with their bottom ≥ 3.4 m above everything walkable beneath need no fence.
22. Over walkable routes the underside is ≥ 4.0 m and the deck ≤ 6 m wide (camera).
23. Open deck edges have rail blocks ≥ 0.9 m.
24. Stairs and ramps ≤ 24°.
25. Every walkable era-3 top is reachable on foot (stair, ramp, ≤ 1.8 m step, or an inkable wall ≤ 5.5 m for squids).
    Otherwise it is a `roof`.
26. Era-3 walkable tops are ≤ 9 m above the street.

**Vanishing pieces**
27. Every point of a vanishing walkable top is ≤ 2.6 m above a floor that exists in the new era.
28. Nothing vanishes from under a route over water or void: bridges and walkways over the river are mask 7.

**Swaps** (the same group vanishing and appearing at once)
29. Each new footprint lies inside the old.
30. Walkable tops that swap are within ±0.02 m of each other.
31. For floors that persist, prefer `remap` re-skins over swaps: re-skins keep ink, swaps reset it.

**Routes in every era** (spawn-mid, cover-map and route counts measured with `ERA=n`)
32. 2–4 flank routes on each side.
33. Spawn to mid swim time is 5.4–6.6 s (the Long Stages 6 s ± 10 %).
34. Cover every 6–10 m.
35. An era never removes a route without leaving another way to the same place.

**Water**
36. No era-only block is a waterline "deck slab" (top ≤ 0.01 m and bottom < −1.0 m: environment.js `_footprint`). An era
    platform over the river stands with its bottom above −1.0 m, on prop columns.

**Front**
37. The front starts at (0, 0) and runs at 25 m/s. The arena reaches ≤ 85 m from (0, 0), so a sweep takes ≤ 3.4 s.
    (Swimming is 11.8 m/s: nobody outruns it.)

**Looks**
38. ≤ 12 mural ids in total across all eras (`uMurA[12]`). More signage goes on props.
39. ≤ 6 texlib slots for the stage (its 3 plus 3 era alternates; the lead assigns numbers) and ≤ 4 `remap` entries.
40. Era props are static merged parts (no spinners, blinkers, flags, banners or cloth: those only on shared props), with
    ≤ 5 materials per era mask.
41. One backdrop set per era, each ≤ 6 draw calls. Shared scenery goes in the main set.
42. `decor.lamps` positions are shared (≤ 12). Their colour per era comes from `look[e].lamps`.

**Movers (optional trams)**
43. Tracks are mask 7.
44. A tram never runs from `J − 10` to done. Its timetable is parked in that window.

---

## 6. Build plan (each step ends with a test that fails without it)

Until the stage exists, the engine is built and tested on a **fixture**: `tools/botlab/tests/eras-fixture.js` mutates a
copy of `MAP_LAYOUTS.halyard` and its dressing in the page, then forces a rebuild (`worldKey = null`). It adds:
- an era-1 hoarding across the boardwalk (z −12.4…−10.4, closing that route);
- an era-1 crate stack (top 1.6 m) on the fuel dock;
- an era-2 construction hoarding (2.4 m, roof, `paint: false`), and in the same group an era-3 stair inside its footprint;
- two era-3 sky-walk segments (underside 4.2 m) from the stair toward the ferry sun deck;
- a few era props (a gas lamp → street light → light mast swap).

Page tests run through `MAP=halyard PAGE=tools/botlab/tests/<name>.js tools/botlab/run.sh tools/botlab/page.cjs`.

| # | Step | Test (in `tools/botlab/tests/`) |
|---|---|---|
| 1 | **Data and Level** (H1–H4): masks, groups, era-aware face hiding and bevels, the `aEra` attribute. `check-maps` era-aware (T2). | `eras-world.js` part 1. A face pressed against an era-3 block exists. Its cells are live in eras 1–2 and dead in era 3. Mirrored twins are separate groups with equal r_g. `node build/check-maps.mjs halyard` is still "ok". |
| 2 | **`EraWorld.attachPaint` / `apply`** and paint hooks (H5, H6). | `eras-world.js` part 2. `turfTotal` and `counts` per era equal a brute-force recount. A splat on an absent piece claims nothing. `clearFaces` zeroes grid and atlas (read back a pixel). |
| 3 | **Nav merge** and `path` mask (H7). | `eras-world.js` part 3. On 200 random node pairs per era, union-graph path costs in era e equal a fresh `NavGraph` built in era e (±1 %). The route behind the era-1 hoarding is long in era 1 and direct in era 2. Sky-walk nodes are valid only in era 3. Merge < 60 ms. |
| 4 | **Load measurement.** Time `_buildWorldNow` with eras on the fixture. If nav ×3 > 700 ms, add 4b (dirty-region rebuild of eras 2–3). | `eras-world.js` prints `loadMs` (with and without eras). |
| 5 | **Looks**: era meshes and visibility, the level-shader chunks (H8), depth material, GTAO gate, AO channel. | `eras-look.js`. Pictures of eras 1/2/3 and mid-jump at T = J + 1.5 s. A pixel probe where an absent era-1 crate stood shows no GTAO darkening and no shadow. Draw calls per era from `renderer.info`. |
| 6 | **Bake** (T1). | Mac mini job: `tools/botlab/run.sh tools/botlab/bake.cjs bluestone` (once the stage exists). `stage-audit.js` with `ERA=1/2/3`: "lightmap applied". A channel probe under a crate is darker in R than in G. |
| 7 | **Props and backdrop per era** (H12, H13). | `eras-look.js` part 2. Era prop meshes visible only in their eras. Swap group: exactly one tram type visible outside jumps. Backdrop set swap with the horizon run. Steady-state draw calls ≤ the budget, jump ≤ +56. |
| 8 | **`StageEras` runtime**: schedule per mode, warn, flips, guard, shove and rescue, devices (H10, H17), sounds, FX. | `eras-jump.js` (offline, `debugJump` and short `at`). Each group flips at J + r_g/25 ± 1 frame. A ray through the hoarding hits before its flip and misses after. A player on the crate top falls and lands. A player forced into the stair site is shoved out with the body fitting. A sprinkler on the hoarding is destroyed. A splat in the guard window claims nothing. No frame > 50 ms during the jump (`performance.now()` deltas). |
| 9 | **HUD, minimap, thumbnail** (H14, H15, H19). | `eras-hud.js`. Chip text per era, countdown at J − 10 … J − 1, callouts at jump and done (DOM). Minimap bases differ per era (pixel hash). Outlines present during warn. |
| 10 | **Bots** (danger layer, replans, `fresh`; H16). | `eras-bots.js`, then Mac mini sweeps: 6 Turf War matches per era schedule (`match.cjs MAP=bluestone`). Stuck % ≤ the stage average. 0 bots on vanishing tops at their flip. Every bot visits an era-3 area within 20 s of done (median). `stats.eraShoves` = 0. |
| 11 | **Online** (H11): Practice clock, splat time tag. | `net-eras.cjs` (`CLIENTS=2`, then a third for the late join) — see below. Plus `node tools/net-test.mjs --net "netlag=150&netjitter=50"` skew report. |
| 12 | **Every mode**: zones, tower, boss fixed, Practice cycle and rewind, attract. | `eras-modes.js`: zone cells are identical before and after each jump. `tower-check.cjs` with `ERA=1/2/3`: 0 holes and no clearance hits in every era. A boss match starts in era 3 and never jumps. Practice rewinds 3→1 and rescues anyone over the river. Plus Mac mini zones / tower matches. |
| 13 | **Regressions.** | `world-build.js`, `ink-wipe.js`, `movers.js`, `pods.js`, `treehills-pods.js`, `stage-audit.js` on halyard / calamari / treehills, `net-practice.cjs`, `net-stageclock.cjs`, `net-turf.cjs`, `node build/check-maps.mjs` (all stages). Non-era stages' level program is unchanged (cache key without `-eras`). |

**`net-eras.cjs`** (`CLIENTS=2 NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`; both
clients run the fixture mutation before `start()`):
1. Start a 1:30 Turf War with bots. Jumps are at 30 s and 60 s.
2. Each client records its `era:flip` times. The same group's flip times differ by < 0.4 s. After each done, the two
   clients agree on `solid` for every era block and on `nav.eraBit`.
3. The guest plants a sprinkler on the hoarding before jump 1. It is gone on both screens after its flip.
4. The guest fires at the stair site from J + r/25 − 0.4 s to + 0.6 s. Grid cells on the stair faces are equal on both
   screens (`exportGrid` diff limited to those faces = 0).
5. The host's final counts are shown on both results screens.
6. In a second run, the host leaves after jump 1. The new host's jump 2 starts at 60 ± 0.4 s on its screen.
7. Practice: a third client joins in era 3. Its era is 3 within 2 s of its first tick, its `importGrid` succeeds, and
   its `turfTotal` equals the host's.

---

## 7. Risks and unknowns (and how to find out)

1. **Load time.** Nav ×3 measured 445–734 ms in Node without props; in game with prop colliders it may be 0.8–1.5 s.
   Minimap ×3 adds 0.3–0.9 s in the idle pass. *Find out:* step 4 on the fixture, then on the blockout (`shoot.cjs`
   REPORT `loadMs`). *If over 7.6 s:* step 4b (dirty-region nav rebuild for eras 2–3), and minimap bases for eras 2–3
   built in row slices during era 1.
2. **Ghost darkening from GTAO or shadows during a jump.** Override and depth passes ignore the material patch.
   *Find out:* step 5 mid-jump pictures at high and ultra, and a pixel probe. *Fallback:* era meshes out of GTAO during
   jumps (already planned). If the depth material patch is wrong, set `castShadow` off on outgoing meshes at their flip.
3. **Paint and lightmap capacity.** The union may push atlas density below ~20 ppm or the lightmap past 2,048 rows.
   *Find out:* `G.paint.ppm` and `G.level.lightUsed` at blockout; `check-maps` prints both. *Fix:* rules 8–9 (cut era
   faces, make hidden sides `paint: false`).
4. **Clock skew on bad connections.** Followers' clocks are not latency-compensated; skew could exceed 0.3 s and push
   flip times and the guard arithmetic past 0.5 s. *Find out:* `net-test.mjs --net "netlag=150&netjitter=50"` and the
   `net-eras` skew assertion. *Fix:* raise `guard` to 0.75 s, or have the host add half its measured RTT to `c` ticks.
5. **Nav merge corner cases.** Nudged nodes may sit at different x/z per era; climb edges with different rises; `_prune`
   differences. *Find out:* step 3's equivalence test (union path cost = fresh-graph path cost on 200 pairs per era).
   *Fix:* key nudged nodes by the cell centre and keep per-era coordinates.
6. **Bots in a changed city**: stuck on new geometry, ignoring new areas, or loitering in danger boxes. *Find out:* Mac
   mini sweeps per era and mode (stuck %, visits to fresh nodes, eraShoves). *Fix:* tune the `fresh` weight and the
   danger pad.
7. **Someone ends up inside an appearing piece anyway** (a layout mistake, a dolphin jump onto a hoarding top).
   *Find out:* `stats.eraShoves` in every bot match must be 0, and `check-maps` checks rules 19–20 statically. *Fix:*
   the layout (raise hoardings, mark tops `roof`).
8. **Prop shader patching.** Era buckets must chain with existing `onBeforeCompile` users and get distinct program keys.
   *Find out:* step 7 renders all era materials, including the paint atlas material's `alphaTest`. Check the console
   for program errors on the web build.
9. **Uniform budget on weak GPUs.** The level shader already uses ~300 fragment uniform vectors (TL slots ×3, wakes,
   lamps, murals); eras add ~12 plus 3–6 slots. *Find out:* compile on the web build on an Intel / ANGLE laptop and read
   `renderer.capabilities`. *Fix:* fold `uEraTint` / `uEraMap` into a small data texture.
10. **Environment blend cost.** The PMREM env-map rebuild at the end of a jump may hitch (unknown: 2–20 ms). *Find out:*
    time `_rebuildEnvMap` on the stage. *Fix:* precompute one env map per era at load (≈ 6 MB each), or keep one env map
    if the eras' skies are close.
11. **Readability.** Will a first-time player understand what changed and where? *Find out:* pictures and a short video
    of a jump for the lead and the user (the warn, the holograms, the front, the done callout), then the user plays it.
    Tune hologram opacity, the flicker and the callout wording from that.
12. **Fairness per mode across eras.** Route lengths, sightlines from era-3 decks over mid, Bazookarp distance to goal
    per era. *Find out:* `spawn-mid.js`, `cover-map.js` and `tower-check.cjs` with `ERA=1/2/3`, plus zones / tower /
    turf sweeps on the Mac mini comparing win rates and knockouts by era. The Bazookarp spec's own per-era checks once it
    exists.
13. **Merge conflicts.** `levelMaterial.js`, `paint.js`, `main.js`, `match.js` and `netmatch.js` will also be touched by
    `caldera` (lava stain line, lava clock), `aquarium` (pipes) and the Bazookarp engine. *Find out / mitigate:* keep
    every hook tagged and small, land the era hooks early as one integration commit, and run the regression list after
    each merge.
14. **The movers comment says "the lightmap bake runs during the intro"**, but the game now loads baked PNGs
    (`main._loadLightmap`); the comment is stale. If any path still bakes at runtime it would bake only the current
    era. *Find out:* grep for runtime bakes before step 6 (none found in `src/`).
15. **Practice rewind (3→1) drops era-3 floors over the river.** It is covered by the rescue rule. *Find out:* step 12
    puts a bot on the river platform at the rewind and asserts it was rescued, not splatted.
