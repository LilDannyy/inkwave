# Caldera (Highmark Foundry): the lava engine — the final contract

The engine contract for the `caldera` stage as designed in `DESIGN.md` (Highmark Foundry). It is the engine
programmer's draft (kept unchanged as `engine-draft.md`) revised by the lead for exactly that design: same structure,
same decisions, with the parts this design needs changed and the parts it does not need cut. Paper design, 2026-10-04.
Nothing here is built yet. Every file, function and line number below was read in
`/Users/danielosling/Desktop/1/st-b5-design`. The numbers in §1.3 were measured with read-only Node runs of the real
`Level`, `Physics` and `NavGraph`.

**What the lead changed from the draft (all driven by DESIGN.md):**
1. **The worked example is now the real stage** (§3.3, §3.4): LOW −1.6, HIGH +0.8, 10 s warnings and smoothstep moves,
   Highmark's schedules, region, riders, gauges, cascades and vents.
2. **No leap gaps.** The design's stones sit on 0.25 m seams and the Organ columns on 0.20 m seams, so the riskiest
   piece of the draft (bot `leap` edges, `steerLeap`, the 200-leap test and its fallback) is **not built in v1**. The
   gap cut stays (no nav edge may cross more than 0.3 m of nothing).
3. **Hex riders**: a rider may be `shape: 'hex'` (three turned boxes sharing one deck paint, §3.3, §4.1).
4. **Sink stones surface and sink at the ledges' kill height**, so the ledges and the stones are never open together.
5. **Rule 6 now exempts stairs and ramps** (a stair from a ledge at 0 to a tier at 2.4 must cross the high mark).
6. **Three small new hooks**: H21 (BossNav sees riders at a held pose), H22 (`env.sea: false`), T2 (`art.lava` for the
   stage art). Boss Battle is offered, with the lava held at LOW.
7. **Callout wording per stage** (`def.text`) and a personal warning line in the gauge chip.
8. Performance is judged **side by side with Halyard** in the same run (Halyard grew in the Long Stages round).

**Revision 2 (2026-10-04), with DESIGN.md revision 2, after the advocate's and the engineer's reviews:**
1. **New worked numbers:** LOW −0.6 (molten lava 0.6 m under the ledges all match), HIGH +0.8; the region is a set of
   polygons (a 96-vertex lake plus four bays) drawn **0.5 m inside every bank**, so no wall lies on the outline (§4.1,
   rule 45).
2. **Sink stones** surface and sink on a 2.4 s linear ease timed so they become solid exactly when the ledges become
   deadly and deadly exactly when the ledges are dry (§3.1, §4.2, rule 41); never both, never neither, ≤ 0.6 m/s.
3. **Explicit `steps` links** join every rider seam a route uses (island → Organ A → B → L, head → stones → head), so no
   climb depends on the 1 m nav grid's offset (§4.3, rule 46); rider nodes pay no "near water" cost.
4. **The Organ lookout stands in the lake** (`inLake`), and the Organs travel 0.95 / 1.7 / 2.35 m (rule 15's new clause).
5. **`falls` polygons** (the chutes past both Spillway lips) make a fall there report `lava`; no fall on the stage
   reports `water` (H3, rule 43).
6. **Shared APIs:** `G.level.liquidY(x, z)` (H23) for the subs, the device sweep through `G.deploy.crushIn` (H17;
   `destroyWhere` is gone), `restMask(level)` for Bazookarp's field (SPEC §5.5).
7. **Errata fixed:** hex side paint uses the boxes' short faces (§4.1); riders get no rind; Practice and the menu find
   their own schedules (H24) and are exempt from rule 3; H19 is mandatory for kits that roll or walk along floors or deal
   damage; the lava's palette at rest is warm charcoal-maroon with ≥ 35 % lit seams (§7 R1).

**Decision in one paragraph.** The lava is a stage set piece in the same family as the movers and the pods. It is not
part of the environment. Its level is a pure function of the synced stage clock, so nothing new goes over the wire
during a match. The lake under it is **void**: there is no level block under the lava. Every existing "no floor here
means death" check in the engine (bots, shoves, sight guesses, super-jump landings, nav water costs) already treats
the lake as deadly. The only new rule for actors is one kill check: inside the lava region, feet lower than 0.15 m above
the surface splat you, with cause `lava`. Floors the lava drowns stay normal static blocks, and a small `covers()` API
tells bots and shoves that they are under lava. Rocks that float and platforms that rise are **riders**: dynamic level
blocks moved vertically each frame (`Level.moveDynamic`), with their height a linear function of the lava level.
The nav graph is built twice, once with the riders at their low pose and once at their high pose, and the two are
merged, so rider tops get real nav nodes. Each node gets a time window, and A* checks it at the bot's estimated
arrival time. Ink is **burned** off ground as the lava rises over it, and nothing can be inked under lava. The rule is
exact online because splat records carry the painter's stage-clock time. A world-space band in the level shader draws
the stain line at the high mark, the heat glow and the warning pulse. The work lives in one new module family,
`src/game/lava.js` + `src/fx/lavaFx.js` + `src/audio/sfx-lava.js` (the `sp-surf` / `surfFx` / `sfx-surf` pattern), plus
about 20 short hook-ins tagged `[b5-lava]`.

The contract keeps ranges (so a later lava stage can use it), but every worked number is Highmark Foundry's:
- LOW −0.6, HIGH +0.8 (range 1.4 m), 10 s warnings, 10 s smoothstep moves (peak 0.21 m/s).
- About 575 m² of ledge floor at 0 (about 10 % of the floor) that drowns: two Slump shelves, two Spillways, two Casting
  Floors; everything at 1.2 or above never does.
- 10 sink stones (the Pumice Race: five per Slump bay, a zig-zag of turned boxes on 0.25 m seams), top = L + 0.45
  while up, solid exactly while the shelf beside them is deadly.
- 2 clusters of 3 hexagonal Organ columns (lookouts) with linear tops (1.4 → 2.35, 1.8 → 3.5, 2.3 → 4.65), 0.20 m seams,
  each column one ≤ 1.15 m hop from the next at every pose; the lookout column stands in the lake.
- 30 rider parts, 4 gauges (with twins), 2 cascades, 8 vents, 2 `falls` polygons, 48 drifting pumice (cosmetic).

Lava kills at L + 0.15, the same as the sea. There is no grace hop.

---

## 1. Findings

### 1.1 What in the engine already helps

| Where | What it gives us |
|---|---|
| `src/game/stageKit.js` `StageClock.tick(m, dt)` | Play time = `duration − time`, which followers already track to about ±0.2 s (`netmatch._hostClock` nudges `m.time`). It snaps when off by more than 1.5 s, and runs on by frame time in overtime, Practice and the menu backdrop. Online Practice followers ride `G.netm.stageSync`. A set piece that is a pure function of this clock needs no records. `movers.js` proves it, and `tools/botlab/tests/net-stageclock.cjs` tests it. |
| `src/game/movers.js` `moverPhase(tt, T)` | A pure, eased (smoothstep) timetable function with `toGo` and warning windows. The lava timetable is the same shape: rest, warning, eased move, rest. |
| `stageKit.js` `navClaim` / `navCommit` / `navRelease` / `navNodesInBox` | A layer of `nav.blocked`: +40 route cost, never a goal (`NavGraph.nearest` skips blocked nodes when `start` is false), and routes that run into newly blocked nodes are re-planned. Used here for "under lava now or within 8 s". |
| `stageKit.js` `shoveActor` / `floorFor` / `clearLine` / `shovable` | Shoves only where the body fits, over floor, never into the sea. `floorFor` already refuses void (`gh > PLAYER.waterY + 0.4`). One hook makes it also refuse drowning floor. |
| `src/world/level.js` `addDynamic` / `moveDynamic` / `clearDynamic` | Moving collision boxes that every query sees (`queryBlocks` scans `this.dyn`). `moveDynamic` keeps `b.dp` (the move it just made), so devices on a moving floor ride it (sp-fixes rule, `sp-surf.js`). A rider is one of these. |
| `src/game/actor.js` `_resolve` (grounded branch: `groundProbe(… up = stepUp 0.35, down = stepDown 0.45 …)`) | A grounded kid is snapped to a support that moved by less than 0.35 m up or 0.45 m down this frame. A block moving vertically therefore carries whoever stands on it, with no carry code. Pods already rely on this ("anyone on top is lowered with it", `pods.js` header). At Highmark's fastest rider move (a sinking stone, 0.585 m/s) and dt 0.1 s the step is 5.9 cm. |
| `src/game/towerPaint.js` `BoxPaint` (+ pods' `PartPaint`, deck-only faces) | Ink on a moving box. `Actor._surface` / `_dynPaint` already reads `block.inkPaint`, so a rider's deck becomes ground you swim, refill and hide in. `Paint.splat` already forwards every splat (`G.match?.tower?.paint?.splat`, `G.match?.pods?.onSplat`, `paint.js` lines 522–524). |
| `src/world/paint.js` `flood(region, -1)`, `startWipe`, `_wipeBand`, `wipeFx`, `exportGrid` / `importGrid` | Precedents for clearing cells and texels by world-space rules (radial front, polygon + height range), a sample of cleared cells for steam, and the late-joiner turf copy. The burn front reuses their shape: a sorted cell list, a GPU quad per face, and `NoBlending` writes into `paint.rt`. |
| `paint.js` PAINT_FS `vW` varying, `aMask` attribute | Every splat texel already knows its world position, and quads already carry a per-quad mask. "Never draw below the lava" is one more per-quad float. |
| `src/net/netmatch.js` `recSplat` / `_play` case `'s'` (wave tag, record fields 14–15 played as `e[14]`, `e[15]`) | Splat records already carry a tag that lets every screen ink or skip each cell by the same rule (the Practice wipe). The painter's stage-clock time (`e[16]`) is the same idea. Bluestone's H11 adds the same field, and one implementation serves both. |
| `src/world/levelMaterial.js` `WAVE_FRAGMENT` (`uWave`, `uWaveT`), `onBeforeCompile` chunks, `customProgramCacheKey = 'inkwave-level-v8'` | A uniform-driven world-space effect injected into the level shader at `opaque_fragment`. The stain line, heat glow and warning pulse are three more chunks of that kind behind a `LAVA` define. |
| `src/world/environment.js` `layout.env` (`backdrop(kit)` + `animate(t)`, `theme`, `edge: 'none'`, `boats: false`) | The volcano's far scenery, ash sky and dusk glow. The backdrop's `animate` can read `G.match?.lava?.state()` to puff the cone at each rise. |
| `src/game/specials.js` `body()` ("the sea still wins", line 356), `actor.js` sea check (line 400) | The pattern for a liquid death: owner-side, cause string, attacker credited if hit in the last 4 s (`this.lastDamage < 4 ? this.lastAttacker : null`). The cause string crosses the wire unchanged (`netmatch.packEvent` passes strings through). |
| `src/ui/hud.js` `splatCause` / `ENV_CAUSES` / `SEA_ICON`, `_bindBus` + `_callout`, `src/fx/screenfx.js` splat flood (`cause === 'water' ? SEA`) | Where a new environmental cause gets its card, icon, flood colour and callouts. |
| `src/game/minimap.js` `_compose` (zones, tower drawn in the live layer) | A per-frame live layer. The lava overlay is one more call there. |
| `src/game/botSpecials.js` `dangerCost` / `goalOk`, bots' `_pathTo(…, this.sp.cost())` | Bots already plan round time-limited dangers they know about. Lava uses the nav windows below instead, because it is known to everyone from the HUD and the clock. |
| `src/world/variants.js` `inMode` | Per-mode filtering. The lava's rider and region items accept `onlyIn` / `notIn`. |

### 1.2 What assumes otherwise (and what it would break)

| Where | Assumption | Consequence (fix in §3.5) |
|---|---|---|
| `src/config.js` `PLAYER.waterY = -1.6`, `fallDeathY = -1.45`; `environment.js` `WATER_Y`, one infinite `Sea` mesh at that height | There is exactly one liquid, at one fixed height, everywhere. `waterY` is read 48 times in 23 files outside `environment.js` and `config.js` (projectiles, bombs, kits, FX, bots, cues, boss). | Moving the sea or adding a second sea to the environment would touch all of them. The lava is a separate system (option E). Most of those 48 checks are only "is it gone into the water"; §3.5 H16–H19 adds the lava to the few that matter. |
| `actor.js` `update()` sea check: `pos.y < fallDeathY && groundHeight(...) === -Infinity` | Below −1.45 with no floor means the sea. | Inside the region the lava's kill height (L + 0.15 ≥ −0.45 at Highmark's LOW) is always above the death plane, and the lava check runs first (H3). Outside it, a fall off an edge would say "Fell in the sea": Highmark walls every edge but the two Spillway lips, and the chutes past the lips are `falls` polygons that report `lava` (H3, rule 43). |
| `actor.js` body-special branch (`_updateSpecial` → `G.specials.body`), slam / storm in `_updateSpecial` | Only `specials.body` checks the sea. Slam and storm do not. | One lava check after `_updateSpecial` covers every special (H3). |
| `level.js` `addDynamic`: forces `paint: false, hidden: true` | Dynamic blocks are never inked or drawn. | Riders draw their own mesh (`lavaFx`). A float's deck takes ink through `BoxPaint`. A stone is bare crust, like a perch. |
| `level.js` `queryBlocks`: every query scans all of `this.dyn` linearly | A few moving blocks. | Measured cost in §1.3. Rider parts are capped at 40 (§5 R30). A submerged rider is parked out of every query (moved 50 m down, `solid = false`). |
| `nav.js` `NavGraph._build`: built once from what is solid when `main._buildWorldNow` calls it; `blocked` is soft (+40) | Static geometry. Movers only ever block. | Rider tops need nodes, and a rider top that isn't there must be hard-closed. The graph is built at both rider poses and merged (H1, `LavaWorld.buildNav`), and `path()` gets time windows (H4). |
| `nav.js` edges join neighbouring 1 m cells by height difference and a waist-height ray (`_blocked`). They never check that there is floor between the cells. | No gaps narrower than a cell. | Two nodes on either side of a lava gap wider than a seam would get a `walk` edge, and a bot would walk into the lava. `buildNav` removes every edge that crosses more than 0.3 m of nothing inside the region (§4.3). Highmark has no such gap on purpose (seams 0.25 / 0.20 / 0.15 m), so v1 builds **no** `leap` edges. |
| `nav.js` jump edges join only orthogonal cells (line 104: `!(dx && dz)`, 0.5 < dy ≤ 1.25); `_clear` drops nodes within 0.46 m of a taller block; nodes sit at `bounds.min + 0.5` | A step up exists wherever the grid happens to put a node on each side. | Across a 0.20 m seam to a column 1.15 m higher, the lower node must lie 0.56–0.90 m from the seam for its orthogonal neighbour to land on the higher column: a 0.34 m window per seam, so a climb exists or not by the grid's offset (the engineer measured 7 of 16 offsets for revision 1's cluster). **Explicit `steps` links** (§4.3) add the edge pair across each listed seam whatever the offset. |
| `nav.js` `wet` (line 77–87): +0.5 / +2 per node within 2.2 / 1.2 m of void | Void means the sea's edge. | Every stone node is within 1.2 m of void and would pay +2 per node (+10–25 per crossing), so bots would shun the Race. `buildNav` sets `wet = 0` on rider nodes (§4.3). |
| `bots.js` `_wet`, `_avoidWater`, `_squidWouldDrop`, `_edgeGuard` (via `_wet`) | "Wet" means no floor under the point (`groundHeight === -Infinity`). | Over the void lake this already works. Over a drowned floor the floor is still there, so bots would stroll into lava on a flank. A one-line `covers()` test fixes each (H5). |
| `paint.js` `_initGrid`: `live`, `dead`, `turfTotal` fixed at load; `splat()` inks any face it reaches | Faces are always exposed. | Cells always under LOW would count as turf nobody can ink. The module retires them (H7 `retireCells`). Splats must not ink under the current lava (H7 gate), and ink must burn as the lava covers it (H7 `clearCells` / `drawInto`). |
| `netmatch.js` `_sendTick`: the Practice stage clock comes only from `movers` or `pods` | A stage with a clock has movers or pods. | A stage with only lava would send no clock in Practice (H10). |
| `cameraRig.js` lens lift: `groundHeight(cam.position…)`, line 389 | The lowest thing under the lens is floor or sea. | The lens could dip under the lava surface over the lake. One `max` with the lava surface fixes it (H9). |
| `main.js` `_footprint(level)`: blocks with a top ≤ 0.01 and bottom < −1 are "deck slabs" for the sea (pilings, foam) | Low floors are piers over the sea. | Ledge floors at 0 reaching down below −1 would grow pilings through the lava. The stage sets `env.edge: 'none'` (§5 R37) and `env.sea: false` (H22): no sea mesh, no foam, no reflection pass. |
| Prop materials (`PropKit._makeMaterials`: `paint`, `gloss`, `metal`, `wood`, `rubber` …) | Static looks. | The stain must appear on props below the high mark too. `LavaWorld.patchProps` chains an `onBeforeCompile` onto five kit materials when the stage has lava. No change to `props.js`. |
| `bossNav.js` `_build`: a cell is a drop where the ground is more than 0.55 m below the main floor | — | The void lake is a drop: the boss will not walk into it. Highmark's ledges are 1.2 m below the boss's floor (1.2), so they are drops too. Riders are added at the first playing frame, after BossNav builds, so the Organ mounds would be invisible to it: H21 adds them first. Boss Battle runs with the lava held at LOW (§4.6). |

### 1.3 Measurements (Node, the real `Level` / `Physics` / `NavGraph`, layouts without prop colliders)

| Stage | blocks | `groundHeight` per call | nav nodes / build | raycast, 0 → 20 dynamic blocks | `queryBlocks`, 0 → 20 dynamic blocks |
|---|---|---|---|---|---|
| halyard | 168 | 0.46 µs | 4,954 / 119 ms | 0.99 → 1.52 µs | 0.111 → 0.166 µs |
| calamari | 240 | 0.29 µs | 7,134 / 143 ms | 1.03 → 1.44 µs | 0.090 → 0.154 µs |
| treehills | 669 | 0.26 µs | 6,798 / 124 ms | 1.81 → 1.93 µs | 0.099 → 0.155 µs |

- **Load-time rasters are cheap.** A 0.25 m raster over a 100 × 160 m region is 256,000 `groundHeight` calls, about
  0.1 s.
- **Dynamic blocks cost about 0.06 µs per query and 0.1–0.5 µs per raycast for 20 of them.** Treehills already ships
  about 60 dynamic blocks: 16 pod bulbs, 12 wall plants, and 4 canopies of 8 parts each (`pods.js` `plantParts`).
  A cap of 40 rider parts is well inside what runs today.

---

## 2. Options weighed

| | (A) Make the sea rise (move `PLAYER.waterY`) | (B) A second liquid in `environment.js` | (C) Lava as a big lethal dynamic block | (D) Generalise every water check into a `liquids` API | **(E) A stage-owned lava module (chosen)** |
|---|---|---|---|---|---|
| **What it is** | One liquid at a time-varying height | `Environment` owns a second plane at a moving height | Boxes filling the basin, top at L, with a lethal flag | Replace all 48 `waterY` reads with `liquidAt(pos)` | Clock-driven state, void lake, explicit `covers` / `under` API, riders, nav windows, paint burn, shader band |
| **Correctness** | Floods the whole outside world and every stage edge. Every `waterY` constant becomes a live value. | Environment is looks only (`update(dt, camera)`, no match, no rules). The rules would live elsewhere anyway. | Everything treats it as floor: bombs bounce and rest on it, Waddles walk on it, bots path onto it (`groundHeight` finds it). It needs special cases everywhere. | Right, but touches 24 files at once. | Lake = void, so existing sea logic is right for it. Drowned floors get explicit hooks. |
| **Shots** | — | — | Stop at the surface (nice) | Fizzle via `liquidAt` | Fizzle via `under()` at the 3 places that matter (H16, H17). Kits optional. |
| **Merge risk this batch** | Very high | Medium | High (physics) | Very high (other builders are in those files) | About 20 tagged one- to ten-line hooks |
| **Cost** | — | — | Big dynamic boxes in every raycast | — | ≤ 40 small dynamic blocks; O(1) checks |

**Chosen: E.** A and D break or touch too much while eight builders share these files. B puts rules in a looks module.
C makes lava a floor, and then every object needs an exception. D is the right long-term refactor: flagged for after
this batch (§7, R12).

Sub-decisions inside E:

| Question | Options | Chosen, and why |
|---|---|---|
| **Cycle** | fixed timetable from the stage clock · host-driven events with records (pods) · driven by the score · random | **Fixed timetable from the stage clock**, written per mode. It is learnable, the same on every screen with no records, readable from a gauge, and fair: it never favours the team that is ahead. Random or score-driven cycles can't be learned and snowball. |
| **What touching lava does** | instant splat · damage over time + bounce-out | **Instant splat, the sea's rule**: kill at L + 0.15 m, cause `lava`, attacker credited if they hit you in the last 4 s. The two liquids then work the same way, and so do online authority (the victim's owner decides), bots and the HUD. A bounce-out over a void lake just drops you back in. Fairness comes from the warning, not from forgiveness. |
| **The lake bed** | a solid bed block under the lava · void | **Void.** About 20 existing "no floor" checks then treat the lake as deadly with no hooks (bots' `_wet` / `_avoidWater` / `_squidWouldDrop` / `_swimDrop`, `stageKit.floorFor`, `botSight` guess run-on, `botSpecials` knock-off, `nav.js` `wet` costs, super-jump landing ray). A bed would make every one of them think the lake is walkable ground. |
| **Ink under lava** | burn · keep hidden and counted · keep hidden, not counted | **Burn.** Ink is cleared as the lava covers it (steam puffs in that ink's colour). Nothing can be inked under lava, and revealed ground is blank. That reads naturally ("the lava scorched it"), and Highmark makes it the final 30 s ledge scramble. Hidden-but-counted is invisible turf. Hidden-not-counted needs liveness flips and brings old ink back as if it survived lava. |
| **Floating rocks** | gap-free rafts only · stepping stones with gaps | **Seams only (≤ 0.3 m), in v1.** They are walkable with no special code, bots cross them with no failure mode (with `steps` links), and they still read as stepping stones: each stone is a turned box of its own size, offset across the line in a zig-zag, its facing ends parallel (so every seam is a constant 0.25 m), dressed with an irregular boulder mesh that tilts and bobs on the mesh only. Leap gaps (0.3–1.6 m, `leap` edges and a jump routine) were the draft's riskiest item; Highmark doesn't need them, so they are not built. A later stage that wants them adds them with `engine-draft.md` §4.3 step 5 and its 200-leap test. |
| **Reaching a risen platform** | walk / hop from adjacent ground · climb its inked side · ride only | **Walk or hop, ≤ 1.25 m up for bots (nav.js jump edges), at the pose where it is used, over explicit `steps` links.** Bots' climb code checks ink on static faces only (`bots._inkAt` reads `h.face`), so a hop route is always required, and the links make it independent of the nav grid's offset. Highmark's lookouts are **self-stepped**: each Organ cluster is three columns in a line whose tops are ≤ 1.15 m apart at every pose (island 1.2 → A → B → L: 0.2 / 0.4 / 0.5 at LOW, 1.15 / 1.15 / 1.15 at HIGH). The lookout column also takes ink on its sides (`ink: 'all'`) for humans to swim up: `Actor._wallInk` already reads a dynamic block's `BoxPaint`. Ride-only lookouts are unreachable high ground for whoever is late, so they are banned. |
| **Bots** | soft nav layer only · rebuild nav per lava state · time windows in A* | **Time windows in A* + the soft layer.** A rider node that isn't there must be impossible to enter, which needs a hard rule inside `path()`. Once that hook exists, evaluating it at the arrival time costs one multiply. A rebuild hitches and invalidates cached node ids (pods, movers, zone plans). |
| **Stain line** | world-space band in the shader · baked into textures or vertex colours · decal meshes | **Shader band** keyed by a region mask texture and one height. It is crisp on every face at any angle, needs no geometry splits, and is one texture tap. |

---

## 3. The contract

### 3.1 Words

- **L(t)**: the lava surface height (m) at stage-clock time t (s of play). **LOW** and **HIGH** are its two rest
  heights. HIGH is the stain line.
- **Region**: the xz outlines where lava exists. Inside it, anything below L is lava.
- **e(t)** = (L(t) − LOW) / (HIGH − LOW), 0 at LOW, 1 at HIGH.
- **Move**: a rise (LOW → HIGH) or a fall (HIGH → LOW) over `rise` / `fall` seconds, eased with smoothstep (default)
  or linear (`timing.ease`).
- **Warn**: the `warn` seconds before each move.
- **Rider**: one or more dynamic blocks moving as one, whose top is `top(t) = top0 + (top1 − top0) · e(t)`. top0 is
  its top at LOW and top1 its top at HIGH. **Stone**: a rider with a bare top (it stands like a perch and is never
  inked). **Float**: a rider with an inkable deck (`BoxPaint`; `ink: 'all'` inks its sides too, for humans to swim
  up). A rider is one box by default, or `parts` (a deck plus bulwarks), or **`shape: 'hex'`**: a hexagonal column of
  circumradius `r` built as three turned boxes (r × √3·r at yaw 0°, 60°, 120°, corners on the rider's ±x) that move
  as one and share **one** deck paint (§4.1). Extra `parts` on a hex rider (a stub on its deck) ride with it.
- **Sink stone**: a stone with `sink: { at, ease, rel: [lo, hi] }`. Its top is L + `rel[1]` while up and below the
  surface while down. Each surfacing or sinking is a linear run of the top, relative to the lava, from `rel[0]` to
  `rel[1]` (or back) over `ease` seconds, **timed so the top crosses L + `kill` (the kill height above the lava) at the
  instant L crosses `at`**: on a rise it is solid from the moment the ledges become deadly, on a fall it reaches the
  kill height (and stops being solid) the moment they are dry. Highmark: `at` −0.15 (the ledges' kill height), `ease`
  2.4 s, `rel` [−0.45, 0.45]; the run starts 1.6 s before the ledges turn deadly and ends 0.8 s after (a fall: 0.8 s
  before they dry, 1.6 s after). A stone is solid exactly while its top ≥ L + `kill`; below that it is parked.
- **Steps**: explicit nav links across rider seams, `[from, to]`, each end a rider id or an [x, z] point (the static
  node nearest it). `buildNav` turns each into edge pairs at every pose where both ends exist (§4.3).
- **Falls**: polygons (`falls.polys` / `falls.half`) outside the region where a fall below the death plane reports
  cause `lava` instead of `water` (the chutes past a Spillway lip).
- **In-lake rider** (`inLake: true`): a rider standing in open lava rather than in a socket; its bottom stays ≥ 0.3 m
  under the surface at every pose (rule 15).
- **Kill height**: L + 0.15 (`LAVA.kill`). Feet below it, inside the region, splat. This matches the sea: fallDeathY −
  waterY = 0.15.

### 3.2 The module family

**`src/game/lava.js`** (rules, clock, nav, bots, paint glue; about 900 lines):

```js
export const LAVA = {
  kill: 0.15,        // m above the surface where feet splat (the sea's 0.15)
  navLead: 0.35,     // a floor node is shut from when L reaches node.y − navLead (bots stay that far ahead of it)
  soft: 60,          // route cost to enter a node shut at arrival (a floor under lava): only as the way out
  sPerM: 1 / 7,      // seconds per metre of route, for a bot's arrival time (between running 6 and swimming 11.8 m/s)
  goalLook: 8,       // s: goals skip floor nodes the lava reaches within this long (the nav layer)
  poseTol: 0.3,      // m: a rider node is open while the rider's top is within this of the pose it was built at
  seamMax: 0.3,      // m: the widest gap a nav edge may cross (a seam); wider gaps are cut. No leap edges in v1
  minFree: 0.35,     // m: a rider's top is never closer than this above L (a `sink` stone: while surfaced)
  maxParts: 40,      // dynamic blocks for all riders together, twins included
};
export function lavaSchedule(def, mode, duration)  // → Sched: { kind: 'moves' | 'loop' | 'fixed', … } (§3.3), or null ('off')
export function lavaAt(t, S)                       // → { y, e, phase: 'low'|'rise'|'high'|'fall', dir: 1|-1|0, v, toGo, next, warn }
export function lavaMax(t0, t1, S)                 // max of L over [t0, t1] (exact: monotone within each phase)
export function riderTop(r, y, S)                  // a rider's top for lava height y

export class LavaWorld {                // per world build (main._buildWorldNow): geometry-derived, persists with the world
  static create(layout, level)          // null without layout.lava
  def; low; high
  box                                   // { x0, z0, nx, nz, res: 0.25 } over the region's AABB + 2 m
  mask                                  // Uint8Array nx × nz: 1 inside the region (polygon test at each texel centre)
  map                                   // THREE.DataTexture RGBA8 (R inside, soft 1-texel edge · G/B 16-bit "solid at
                                        // height band k" for k = 0..15 across LOW…HIGH · A floor top, LOW−1 … HIGH+3)
  uniforms                              // { uLavaMap, uLavaBox, uLavaK, uLavaK2 }: shared objects, read by the level,
                                        // grate, prop, paint and lava-surface materials
  riders                                // defs with twins: { id, kind: 'stone'|'float', shape?: 'hex', r?, x, z, yaw,
                                        // top0, top1, ink, sink?, single, parts: [{ x, z, hx, hz, yaw, y0, y1, ink }]
                                        // (y from its top; a hex rider's three column boxes come first) }
  inRegion(x, z)                        // mask lookup (outside the box: false)
  fallsIn(x, z)                         // inside a `falls` polygon (twins included): a fall here is `lava` (H3)
  attachPaint(paint)                    // faces with cells in the region below HIGH get f.lava = 1; cells below LOW are
                                        // retired (paint.retireCells); the lava cells sorted by height for the burn front
  patchProps(kit)                       // the stain chunk into kit.mat.{paint, gloss, metal, wood, rubber}
  buildNav(level, physics) → NavGraph   // two builds (riders at their LOW pose, then at their HIGH pose), merged (§4.3);
                                        // then the `steps` links, kinds, wet = 0 on rider nodes, gap cuts (no leap
                                        // edges in v1), exits; throws if a link yields no edge pair at a pose it needs
  buildLook(scene)                      // lavaFx.LavaLook: surface, embers, rider meshes, gauges, cascades
  setY(y, s)                            // push the height and state into the uniforms and the surface mesh (menus too)
  dispose()
}

export class StageLava {                // per match (match.js, like StageMovers / StagePods)
  static create(match)                  // null without G.lavaWorld, or when the mode's schedule is 'off'
  clock                                 // a StageClock
  S                                     // the schedule in force
  y; e; dir; phase; warn                // this frame
  next                                  // { to: 'high'|'low', at, inS } or null: the HUD countdown and the bots' knowledge
  update(dt)                            // Match.update, before movers / pods / actors
  now()                                 // this.clock.t
  yAt(t)                                // L at stage time t (pure)
  surfaceAt(x, z)                       // y inside the region, −Infinity outside (G.level.liquidY wraps it, H23)
  under(p, depth = 0)                   // inside the region and p.y < y + LAVA.kill − depth
  covers(x, z, gy, ahead = 0)           // inside, and feet on a floor at gy would splat now or within `ahead` s
  burns(actor)                          // the kill test: alive, not super-jumping, under(actor.pos)
  safeLanding(to, dur)                  // a super jump's landing point: unchanged, or the nearest node dry at landing
  inkClip(et)                           // height below which ink may not land in the region, for a splat painted at
                                        // stage time et (§4.1): et < now ? lavaMax(et, now) : yAt(et)
  tagSplat(c, r)                        // true: this splat's record carries the painter's stage time
  onSplat(c, r, team, opts)             // floats' deck ink; the sizzle where a splat lands in lava
  riderState                            // [{ id, block, top, solid, parked, paint? }]
  win                                   // nav windows, also set as G.nav.lava: kind[], shut(id, t), now(), …
  reach                                 // Uint8Array over nav nodes: 1 = lava covers it at HIGH, or it is a rider node
  closedNow(id)                         // shut at this moment
  restMask(level)                       // 'low' | 'high' → Uint8Array over nav nodes, 1 = standable at that rest: unaffected
                                        // floor always; lava-reachable floor only at LOW; a rider node only where its rider
                                        // sits at that rest (sunk stones 0). Pure (from yAt and the rest poses), callable
                                        // at load: the Bazookarp field's two states (SPEC §5.5)
  bot(b, dt, it, move, vis)             // bots.js: escape a drowning floor, get off a rider before it goes; null
  drawMap(ctx, minimap)                 // minimap live layer
  hud()                                 // { e, dir, phase, inS, warn, mine } for the gauge; `mine` is the local
                                        // player's own line: { text, arrow } when they stand on a floor node that shuts
                                        // within 14 s ("GET OFF THE LOW GROUND → 6 m", the arrow to `exitOf`), or on a
                                        // stone that turns deadly within 16.5 s ("THE STONES ARE SINKING → 4 m")
  state()                               // test snapshot (§6)
  hold(phase) / debugT(t)               // audits (?lava=low|high|rise|fall) and tests
  placeRiders()                         // add the rider parts at the current pose now (idempotent; H21 calls it before
                                        // BossNav builds; `_goLive` calls it otherwise)
  sweepDevices()                        // the owner's 4 Hz device sweep while L rises or a rider changes:
                                        // G.deploy.crushIn({ where: (p) => this.under(p, -0.05) }, 'lava') (H17)
  dispose()
}
```

**`src/fx/lavaFx.js`** (looks; about 700 lines):
- `LAVA_GLSL = { pars, base, emissive, line }`: level-shader chunks.
- `patchStain(mat, uniforms)`: the same chunk for prop materials.
- `class LavaLook`: the surface mesh, embers, rider meshes (instanced stones, float hulls, deck ink overlays), gauge
  needles, cascades, burn steam, sizzles, and the drifting pumice (`def.flotsam`: instanced, no collider, riding L,
  drifting slowly, kept `keepOff` m from every walkable edge so it never reads as a step). Rider meshes never get
  `patchStain` (they move: a world-space rind on them would show the wrong high mark).
- Heat shimmer: there is no refraction pass to bend the scene behind the lava. ScreenFX's existing swim wobble is
  reused instead, scaled by `uHeat` (0–1). `uHeat` is set from how close the camera is to the surface (within 6 m)
  and is doubled while the lava moves. Quality ≥ high only, off with reduced motion (H13).
- `lavaGauge(hud)`: the HUD chip, and under it (bottom centre) the personal line from `hud().mine`.

**`src/audio/sfx-lava.js`** registers its sounds in `SFX` (as `movers.js` registers `crossing_bell`):

| Sound | Kind | What it is |
|---|---|---|
| `lava_rumble` | loop, global | sub-bass 28–45 Hz plus filtered noise. Level 0.15 at rest, swells to 0.9 over a warn-rise and the rise, 0.5 on a fall. |
| `lava_erupt` | one-shot | at each rise start |
| `lava_hiss` | one-shot | at each fall start |
| `lava_drain` | loop | gurgle, during falls |
| `lava_bubble` | positional loop | at most 4, at the vents nearest the listener |
| `lava_sizzle` | one-shot | ink burned (8 a second at most), an item fizzled, a lava splat |
| `lava_pop` | positional | a stone breaking the surface |
| `lava_lock` | positional | a float reaching its pose |
| `lava_tick` | one-shot | the countdown's last 3 seconds |
| `lava_bell` | one-shot, global | the Surge Bell: at warn-rise, 3 slow tolls then 6 fast (a bronze partial stack, 1.6 m bell) |
| `lava_siren_up` | one-shot, global | a hand-siren winding **up** in pitch over the 10 s rise (two-tone, 3 cycles) |
| `lava_siren_down` | one-shot, global | the same siren winding **down** over the 10 s fall |
| `lava_whistle` | one-shot, global | two short steam-whistle blasts at warn-fall; one long low all-clear at rest-low |

Rising and falling never share a sound: bell + rising siren + erupt + rumble swell for a rise; whistle + falling siren +
hiss + drain for a fall.

### 3.3 What a stage layout gives it (exact format)

All heights are metres, all times are seconds of play. Rider, region, falls and steps items accept `onlyIn` / `notIn`
(`variants.js`). This is Highmark Foundry's data, exactly as `DESIGN.md` §3.2 gives it (Alpha's half; `mirror: true`);
the helpers `P`, `arc`, `rot`, `ch`, `sp`, `S0`, `S1`, `FACE`, `S_MOUTH`, `S_LIP` are DESIGN.md §2.3's.

```js
// src/world/stages/caldera/layout.js   (stays importable in Node: plain data and plain helpers only)
const LAKE_HALF = [
  ...arc(23.5, -90, -62.6), ch(Math.sqrt(23.5 ** 2 - 6 ** 2), -6), ch(S_MOUTH, 0),
  ...[P(22.1, 148), P(21.5, 150), ...arc(21.5, 152.5, 177.5),
      sp(S1, 0.5, FACE), sp(S1, 0.5, -FACE), sp(S0, -0.5, -FACE), sp(S0, -0.5, FACE),
      ...arc(23.5, -137, -92.5)].map(rot),
];
const LAKE = [...LAKE_HALF, ...LAKE_HALF.map(rot)];                                       // 96 vertices, self-symmetric
const SPILL = [ch(S_MOUTH - 1.5, -6), ch(S_LIP, -6), ch(S_LIP, 6), ch(S_MOUTH - 1.5, 6)];
const SLUMP = [sp(S0, -0.5, FACE), sp(S0, -0.5, -FACE), P(32, -144.4), ...arc(32, -147, -175),
               P(32, -177.6), sp(S1, 0.5, -FACE), sp(S1, 0.5, FACE)];
const CHUTE = [ch(S_LIP, -6), ch(S_LIP + 12, -7), ch(S_LIP + 12, 7), ch(S_LIP, 6)];
const STONES = [[-18.94, -12.46, 2.6, 2.4], [-20.70, -10.11, 2.3, 2.7], [-20.82, -7.13, 2.8, 2.5],
                [-22.54, -4.76, 2.4, 2.6], [-22.59, -1.86, 2.6, 2.43]];             // [cx, cz, across, along]

export const LAVA = {
  low: -0.6,                 // the surface at rest, low. Range −1.6 … 0.0
  high: 0.8,                 // the surface at rest, high = the stain line. HIGH − LOW: 1.2 … 3.0 (here 1.4)
  region: {                  // where lava exists: a union of simple polygons, 0.5 m inside every bank (rule 45)
    polys: [LAKE],           // used as given (self-symmetric)
    half: [SPILL, SLUMP],    // Alpha's pieces that get a 180° twin
  },
  falls: { half: [CHUTE] },  // past each Spillway lip: a fall below the death plane here reports `lava` (H3, rule 43)
  timing: { warn: 10, rise: 10, fall: 10, ease: 'smooth' }, // warn 6–10 s; rise / fall 6–12 s; peak 1.5 × 1.4 / 10 = 0.21 m/s
  schedule: {                // per match: flags first (practice, attract), then `${mode}:${duration}`, then `${mode}`
    'turf:180': { moves: [35, 70, 110, 140] },              // the stage times moves START: rise, fall, rise, fall
    'turf:90':  { moves: [30, 55] },
    zones:      { loop: { first: 35, high: 35, low: 35 }, overtime: 'hold' },   // rise at 35, hold 35, fall, hold 35, …
    tower: 'zones', bazookarp: 'zones',
    practice:   { loop: { first: 20, high: 35, low: 35 } }, // chosen by m.practice (H24), not by the mode string
    attract:    { loop: { first: 8, high: 15, low: 15 } },  // chosen by m.attract (H24)
    boss: 'low',             // held at LOW: ledges dry, stones sunk, Organs at their LOW pose (H21)
  },
  mirror: true,              // riders, gauges, cascades, vents, falls, steps: each gets its 180° twin, yaw + π
  riders: [
    // the Pumice Race: sink stones (turned boxes, engine yaw −19.0°: local z along the line S0 → S1), bare pumice
    ...STONES.map(([x, z, w, d], i) => ({ id: 'race' + (i + 1), kind: 'stone', pos: [x, z], size: [w, d], yaw: -19.0,
      top: [-0.15, 1.25], depth: 0.9, sink: { at: -0.15, ease: 2.4, rel: [-0.45, 0.45] },
      look: { type: 'caldera_pumice', variant: i, chain: [-21.2, -19.6] } })),
    // the Organ Pipes: three hexagonal columns per cluster (corners on ±x) in a line along z, seams 0.20 m
    { id: 'organL', kind: 'float', shape: 'hex', pos: [-10, -12.80], r: 2.5, top: [2.3, 4.65], depth: 4.2, ink: 'all',
      inLake: true, parts: [{ x: 0, z: -1.4, w: 1.2, d: 1.2, y0: 0, y1: 0.7, ink: false }],   // the stub on its lake side
      look: { type: 'caldera_organ', role: 'lookout' } },
    { id: 'organB', kind: 'float', shape: 'hex', pos: [-10, -9.14], r: 1.5, top: [1.8, 3.5], depth: 3.7, ink: 'deck',
      look: { type: 'caldera_organ' } },
    { id: 'organA', kind: 'float', shape: 'hex', pos: [-10, -6.34], r: 1.5, top: [1.4, 2.35], depth: 3.3, ink: 'deck',
      look: { type: 'caldera_organ' } },
  ],
  steps: [                   // explicit nav links (§4.3): [from, to]; an [x, z] end is the static node nearest it
    [[-10, -4.45], 'organA'], ['organA', 'organB'], ['organB', 'organL'],
    [[-18.74, -14.40], 'race1'], ['race1', 'race2'], ['race2', 'race3'], ['race3', 'race4'], ['race4', 'race5'],
    ['race5', [-23.64, -0.19]],
  ],
  gauges: [                  // markers the module drives (the boards themselves are the stage's props)
    { kind: 'bar', pos: [0, 8.0, -2.5], yaw: Math.PI, h: 7.0, single: true },    // the Surge Gauge's south board (to Alpha)
    { kind: 'bar', pos: [0, 8.0, 2.5], yaw: 0, h: 7.0, single: true },           //   and its north board (to Bravo)
    { kind: 'bar', pos: [-19.5, 6.2, -53.6], yaw: Math.PI, h: 1.8 },             // the Surge Board on the Surge Office (twin)
  ],
  cascades: [                // lavafalls shown while L is over their lip: each Spillway overtopping
    { lip: [[18.81, -28.81], [26.69, -21.72]], y: 0.0, drop: 14 },
  ],
  vents: [[-9.5, -0.6, -18.5], [17.0, -0.6, -5.0], [10.0, 0, -15.0], [23.27, 0, -22.11]],   // pools and floor drains (8 with twins)
  flotsam: { count: 48, size: [0.3, 0.9], keepOff: 1.0 },   // drifting pumice on the open lava (cosmetic, no collider)
  look: { crust: 'ember', cone: [230, 0, 150] },            // crust preset (§7 R1); the backdrop cone that puffs at each rise
  text: {                    // the callouts (§4.5); {n} = the countdown
    warnRise: ['LAVA RISING', 'Off the low ground: {n}'],
    rise:     ['SURGE!', 'The Pumice Race is coming up'],
    high:     ['HIGH MARK', 'Race up · Organ Pipes up'],
    warnFall: ['LAVA FALLING', 'The stones sink in {n}'],
    low:      ['EBB', 'Slump shelf, Spillway and casting floor open'],
    hold:     ['LAVA HOLDS', ''],
  },
};
// in LAYOUT: lava: LAVA, env: { …, sea: false, edge: 'none', boats: false, bay: false }
```

What the numbers give:

| rider | LOW top | HIGH top | travel | peak speed | parts | footprint | depth check |
|---|---|---|---|---|---|---|---|
| race1–5 (×2) | sunk | 1.25 (L + 0.45) | 0.95 while up (L −0.15 → 0.8) | lava 0.21 + ease 0.375 = **0.585 m/s** | 1 each → 10 | 2.3–2.8 × 2.4–2.7, turned | 0.9 ≥ top − L + 0.3 at the surfacing pose (0.45 + 0.3) ✓ |
| organL (×2), in the lake | 2.3 | 4.65 | 2.35 | 0.35 m/s | 3 + stub → 8 | hex r 2.5 (16.2 m² deck) | 4.2 ≥ 2.3 + 0.6 + 0.3 ✓; bottom vs surface: L − (top − 4.2) = 1.3 − 0.95·e ≥ 0.35 at every pose ✓ |
| organB (×2) | 1.8 | 3.5 | 1.7 | 0.26 m/s | 3 → 6 | hex r 1.5 (5.8 m²) | 3.7 ≥ 2.7 ✓ (bottom at HIGH −0.2, inside the socket) |
| organA (×2) | 1.4 | 2.35 | 0.95 | 0.14 m/s | 3 → 6 | hex r 1.5 | 3.3 ≥ 2.3 ✓ |
| **total** | | | | | **30** (cap 40) | | |

At HIGH the hops are island 1.2 → A 2.35 → B 3.5 → L 4.65 (1.15 each); at LOW 1.2 → 1.4 → 1.8 → 2.3 (walk edges,
≤ 0.5). The stones sit 0.25 m from each other and from both Slump heads' tip faces (each pair of facing ends parallel);
consecutive stones overlap by ≥ 1.4 m across the line. The Organ columns sit 0.20 m apart flat to flat, in a notch
cut 0.15 m larger than the cluster.

**Schedule rules.**
- `moves: [t0, t1, …]`: the start of each move, alternating rise, fall, rise, …, starting from LOW. Each move after the
  first starts at least `rise` (or `fall`) + 15 s after the one before it.
- `loop: { first, high, low }`: the first rise at `first`, then a HIGH hold of `high`, a fall, a LOW hold of `low`, a
  rise, and so on. The period is `rise + high + fall + low`. In a match with a clock, a loop schedules no move whose
  warning would begin in the last `warn + 2` s of regulation: the lava rests through time-up. (Zone Control's loop
  above would rise again at 300 with its warning at 290; that rise is never scheduled.)
- `overtime: 'hold' | 'continue'` (default `'hold'`): when the mode's overtime begins, a move already running finishes
  and the lava then holds at that rest. A warning that has not reached its move is cancelled, and the HUD says "LAVA
  HOLDS". The schedule itself must not start a move within the last `warn + 2` s of regulation, so every screen agrees
  even with overtime arriving 0.3 s late.
- `fixed` (`'low'` / `'high'`): held there, with no moves.

Each move runs `L = LOW + (HIGH − LOW) · f(s)` (rise) or the mirror (fall), with s = elapsed / duration and f = smoothstep
(`ease: 'smooth'`, the default) or f(s) = s (`'linear'`).
`warn` is true during the `warn` seconds before each move. Highmark's tables come out as:

| Mode | Duration | Rises start at | Falls start at | Time-up state | Overtime |
|---|---|---|---|---|---|
| Turf War 3:00 | 180 | 35, 110 | 70, 140 | LOW since 150 (30 s) | — |
| Turf War 1:30 | 90 | 30 | 55 | LOW since 65 (25 s) | — |
| Zone Control, Tower Command, Bazookarp 5:00 | 300 | 35, 125, 215 | 80, 170, 260 | LOW since 270 (30 s) | LOW, held |
| Practice | ∞ | 20, then every 90 | 65, then every 90 | — | — |
| Menu backdrop | ∞ | 8, then every 50 | 33, then every 50 | — | — |
| Boss Battle | — | — | — | held LOW (`'low'`) | — |

Checks against §5 rules 2–5 (matches only; Practice and the menu backdrop are exempt from rule 3, they are not
matches): first move ≥ 25 s (30 and 35); holds ≥ 15 s HIGH (20, 25, 35) and ≥ 25 s LOW (25, 30, 35); Turf War ends LOW
≥ 25 s (drownable turf about 10 % < 15 %); the 5:00 loop's fourth rise (305 s, warning 295 s) falls in the last 12 s
and is never scheduled.

**Per-match lookup.** `lavaSchedule(def, mode, duration, flags = {})` tries `schedule.attract` when `flags.attract`,
then `schedule.practice` when `flags.practice`, then `schedule[mode + ':' + duration]`, then `schedule[mode]`, then
`schedule.turf`. match.js sets the mode string to `'turf'` for Practice and the menu backdrop (line 26), so without
the flags they would get Turf War's timetable; `StageLava.create` passes `{ practice: !!m.practice, attract:
!!m.attract }` (H24). A schedule naming another key is resolved once. A missing entry for a new mode (say a future one)
uses Zone Control's loop, and the console warns once.

**Debug.** `?lava=low|high|rise|fall` holds the lava there for audits (`spawn-mid.js`, `cover-map.js`, `shoot.cjs`,
`stageart.cjs` take `LAVA=…` and append it).

### 3.4 Timeline of one rise and fall (Highmark, the 3:00 Turf War's first surge, rise at t = 35)

| Stage clock | What happens (each screen from its own clock) |
|---|---|
| 25.0 (warn) | `lava:warn` `{ to: 'high', at: 35, inS: 10 }`. Callout "LAVA RISING" / "Off the low ground: 10"; the gauge's ▲ blinks and counts down. `lava_bell` (3 slow tolls, then fast), `lava_rumble` swells, the Surge Gauge's beacons flash red, the Casting Floor's drains and the hornitos spit sparks and smoke, the vents bubble. The rind (stain line) pulses dull red on every surface. The minimap hatches everything below HIGH. The bots' nav layer marks ledge nodes the lava reaches by t + 8 s. Players on a ledge see "GET OFF THE LOW GROUND → N m". The Bazookarp field switches to its HIGH state. |
| 32–34 | `lava_tick` at 3, 2, 1. The surface agitates: seams widen, bubbles pop. |
| **35.0** | **The rise starts.** `lava:move` `{ dir: 1, from: −0.6, to: 0.8, dur: 10 }`. `lava_erupt`, `lava_siren_up`; the Bellows Vent in the backdrop puffs an ash column, camera shake 0.25 (settings permitting). Embers stream upward. A glow band climbs the walls with the surface. The Organ columns start to grind up, shedding rubble; the Surge Gauge's needle climbs. |
| 37.2 | L = −0.43: the stones begin to surface in each Slump bay (top L − 0.45 → rising 0.375 m/s relative to the lava); the chains go taut. Not solid yet. |
| **38.8** | L = −0.15: **the ledges are deadly** (anyone still on them splats; 13.8 s after the warning); **the stones' tops reach L + 0.15 and they become solid**: `lava:rider` `{ up: true }` ×10, `lava_pop`. Ink on the ledges burns from here as the surface crosses it: steam in that ink's colour. |
| 39.5 | L = 0: the ledges are awash; both Spillways start pouring over their lips (the cascades). |
| 39.6 | The stones reach L + 0.45 and ride with the lava. |
| 42.0 | L = 0.5: the stones are within 0.3 m of their HIGH pose: their nav nodes open. |
| **45.0** | **HIGH.** `lava:rest` `{ level: 'high', y: 0.8 }`. The Organs lock (`lava_lock`); callout "HIGH MARK" / "Race up · Organ Pipes up". The rumble settles to the spillways' roar. |
| 60.0 | Fall warning: `lava:warn { to: 'low' }`, `lava_whistle` (two blasts), beacons flash white, callout "LAVA FALLING" / "The stones sink in 16" (to the moment they turn deadly). Players on a stone see "THE STONES ARE SINKING". The Bazookarp field switches to LOW (ledge nodes stay dropped until they are dry: SPEC §3.2). |
| 70.0 | The fall starts: `lava_hiss`, `lava_siren_down`, `lava_drain`. The surface crusts over in dark plates; white steam billows off every face it leaves; a hot band just above the falling surface reads as descending. The stones ride down with the lava. |
| 73.0 | L = 0.5: the stones' nav nodes close. |
| 75.4 | L = 0.01: the stones begin to sink (relative 0.375 m/s); the cascades stop at 75.5. |
| **76.2** | L = −0.15: **the ledges are dry** (16.2 s after the fall warning); **the stones' tops pass L + 0.15**: they stop being solid and anyone still on one splats; `lava:rider` `{ up: false }` ×10. The shelves, Spillways and Casting Floors are bare, glazed, steaming; the pig beds glow and cool over 10 s. |
| 77.8 | The stones are 0.45 m under the surface and parked (out of every query). |
| 80.0 | LOW. `lava:rest` `{ level: 'low' }`. Callout "EBB" / "Slump shelf, Spillway and casting floor open"; the long low all-clear whistle. |

### 3.5 Hook-ins in shared files (each short and tagged `[b5-lava]`)

| # | File, function | Change |
|---|---|---|
| H1 | `src/main.js` `_buildWorldNow` (lines 258–309) | (1) At the top: `G.lavaWorld?.dispose(); G.lavaWorld = null;`. (2) After `const level = (G.level = new Level(layout, colliders));`: `G.lavaWorld = LavaWorld.create(layout, level); G.lavaWorld?.patchProps(this.props);` (the props are already built above). (3) After `G.paint = new PaintSystem(…)`: `G.lavaWorld?.attachPaint(G.paint);`. (4) Both `createLevelMaterial` calls get `lava: G.lavaWorld` in their opts. (5) The nav: `G.nav = G.lavaWorld ? G.lavaWorld.buildNav(level, G.physics) : new NavGraph(level, G.physics);` (bluestone edits the same line for its eras: `G.eraWorld?.buildNav(…) ?? G.lavaWorld?.buildNav(…) ?? new NavGraph(…)`). (6) After `this.decor = …`: `G.lavaWorld?.buildLook(scene);`. About 8 lines. |
| H2 | `src/game/match.js` `setup()`, `_setupRoster()`, `update()`, `dispose()` | Both setup paths: `this.lava = StageLava.create(this);` before `this.movers = …`. `update()`: `this.lava?.update(dt);` before `this.movers?.update(dt)` (the lava moves its riders before anyone moves, as the tower does). `dispose()`: `this.lava?.dispose(); this.lava = null;`. |
| H3 | `src/game/actor.js` | New method `_lavaCheck() { if (G.match?.lava?.burns(this)) { this.splat(this.lastDamage < 4 ? this.lastAttacker : null, 'lava'); return true; } return false; }`. Called (a) in `update()` immediately before "fall into the sea" (line 398): `if (this._lavaCheck()) return;`; (b) in the body-special branch (line 282): `if (spx && spx.body) { this._updateSpecial(dt); if (this.alive) this._lavaCheck(); if (this.alive) this._finishFrame(dt); return; }`. (c) In `_updateSuperJump`, after `s.dur = …` (line 840) and only when `!s.tower`: `G.match?.lava?.safeLanding(s.to, s.dur);`. (d) In the sea check itself (line 400), the cause: `G.lavaWorld?.fallsIn(this.pos.x, this.pos.z) ? 'lava' : 'water'` (a fall over a Spillway lip into the chute; rule 43). |
| H4 | `src/game/nav.js` | Constructor: `this.lava = null;`. `path()`: when `this.lava` is set, keep a second array `this._tg` (metres walked without penalties, reset like `_g`). In the edge loop: `if (LW && LW.kind[e.to]) { const s = LW.shut(e.to, T0 + (tg[cur] + e.cost) * LW.sPerM); if (s === 2) continue; lx = s ? LW.soft : 0; }`, add `lx` to `ng`, and set `tg[e.to] = tg[cur] + e.cost` with `g`. `nearest()`: skip ids with `LW.kind[id] === 2 && LW.shut(id, LW.now()) === 2` (start and goal). |
| H5 | `src/game/bots.js` | `_wet(x, z, y)`: `const gh = G.level.groundHeight(x, z, y + 0.6); return gh === -Infinity \|\| !!G.match?.lava?.covers(x, z, gh, 0.5);`. `_avoidWater` `safe()` and `_squidWouldDrop`: the same `covers` test on the height they find. After the pods hook (line 1046): `if (!thrAim && G.match?.lava) thrAim = G.match.lava.bot(this, dt, it, move, enemyVisible) \|\| null;`. (No `leap` steering in v1: Highmark has no leap gaps.) |
| H6 | `src/game/stageKit.js` `floorFor` | `&& !G.match?.lava?.covers(x, z, gh, 1)`. Shoves (movers, pods, the lava's own) never put anyone on drowning floor. |
| H7 | `src/world/paint.js` | (a) `_initGPU`: one attribute `aClip` (float). PAINT_VS passes it on; PAINT_FS gains `uniform sampler2D uLavaMap; uniform vec4 uLavaBox;` (shared objects from `G.lavaWorld`, or a 1×1 dummy) and, after the wipe-mask line: `if (vW.y < vClip && texture2D(uLavaMap, (vW.xz - uLavaBox.xy) * uLavaBox.zw).r > 0.5) discard;`. (b) `splat()`, after the pods hook: `if (!cosmetic) G.match?.lava?.onSplat(center, radius, team, opts); this._clip = !cosmetic && G.match?.lava ? G.match.lava.inkClip(opts.et) : -1e9;`, and the growth record keeps `et`. (c) `_cpuSplat`: for `f.lava` faces, skip a cell whose centre is in the region and below `this._clip`. (d) `_pushQuad`: `aClip = f.lava ? this._clip : -1e9` (`importGrid` stamps pass −1e9). (e) `_emitGrowth`: recompute `this._clip` from `g.et` at each redraw (the clip rises as the lava does). (f) Three small generic methods: `retireCells(ids)` (dead, not live, `turfTotal` / `turfArea` down), `clearCells(ids, from, to, sample)` (zero, `counts` down, `version++`, fill a sample like `wipeFx`), `drawInto(scene)` (render a scene into `this.rt` with `this.cam`, `autoClear` off: the `_wipeBand` pattern). About 35 lines. |
| H8 | `src/world/levelMaterial.js` `createLevelMaterial(…, opts)` | With `opts.lava`: `defines.LAVA = 1`; merge `opts.lava.uniforms` (shared objects); inject `LAVA_GLSL.pars` into the fragment `common`, `LAVA_GLSL.base` just before `${INK_COLOR}` (line 665: it acts on the bare surface), `LAVA_GLSL.emissive` after `${INK_EMISSIVE}`, `LAVA_GLSL.line` just before `${WAVE_FRAGMENT}`. Cache key: `'inkwave-level-v8' + (opts.grate ? '-grate' : '') + (opts.lava ? '-lava' : '')`. Without `opts.lava` the program is byte-identical to today. |
| H9 | `src/game/cameraRig.js` (line 389) | `const ly = G.match?.lava?.surfaceAt(cam.position.x, cam.position.z) ?? -Infinity;` then use `Math.max(gy, ly + 0.15)` where `gy` is used. The lens never dips under the surface. |
| H10 | `src/net/netmatch.js` | `_sendTick`: `this.match.movers?.clock?.t ?? this.match.pods?.clock?.t ?? this.match.lava?.clock?.t`. This is the same line bluestone edits: merge both into `m.stageClockT()` (§7, R9). `recSplat`: when `G.match?.lava?.tagSplat(c, radius)` (or bluestone's equivalent), pad to field 15 (pod 0, wave `[0, 9999]` when absent: exactly equivalent to no tag, since `_wipeGate(0, 9999)` is what an untagged replay already gets) and push `r2(stageTime)`. `_play` case `'s'`: `if (e[16] !== undefined) opts.et = e[16];`. |
| H11 | `src/ui/hud.js` | `ENV_CAUSES.lava = 'Burned in the lava'`; `splatCause` returns `LAVA_ICON` for it, and "Knocked into the lava" with an attacker. `_bindBus`: `lava:warn`, `lava:move`, `lava:rest`, `lava:hold` → `_callout(text, sub)` (wording in §4.5). The gauge chip is the module's own DOM (`lavaGauge(hud)`, appended to `hud.root`): no other HUD code changes. |
| H12 | `src/main.js` `on('splatted')` (lines 562–563) | `cause === 'water' \|\| cause === 'lava'` → `by` null; `byColor` `#ff5a2a` for lava. |
| H13 | `src/fx/screenfx.js` splat flood (line ~695); the distortion block | `cause === 'lava' ? LAVA : …` (a deep red `#a3121a`, not orange), with the sea's clear-flood path. Heat shimmer: one uniform `uHeat`, added to the `uSwim` wobble term's strength in the geometric-distortion block (the pass already turns itself off when idle). |
| H14 | `src/game/minimap.js` `_compose` | After the tower path: `G.match?.lava?.drawMap(c, this);`. |
| H15 | `src/world/mapThumb.js` | When `layout.lava`: fill the region (and twins) in `#4a1012` under the blocks. Stage select and `check-maps --svg` then show the lake. |
| H16 | `src/game/weapons.js` `Projectiles._step` (line 1695) and `_updateBombs` (line 1801) | `\|\| G.match?.lava?.under(p.pos)` next to the sea test. A projectile fizzles with no splat; a bomb sinks with no blast. Both call `G.match.lava.fizzle(pos)` for the hiss and steam. |
| H17 | `src/game/subs.js` `_fly` (line ~420); the device sweep | Thrown subs: the same as H16. Devices: no new destroyer. `StageLava.sweepDevices()` calls wave 1's shared `G.deploy.crushIn({ where: (p) => this.under(p, -0.05) }, 'lava')` (subs SPEC §0.3), which walks every live subs item, the buoy and every kit descriptor of this screen's owner, ends each once with the crunch path (a sizzle for `'lava'`) and its owner's end record. Kits need no `lavaSweep`. (Revision 1's `destroyWhere` is gone; the subs SPEC's `{ liquid }` shape was dropped in its revision 3 in favour of `{ where }`.) |
| H18 | `src/game/sp-surf.js` (line 254) | `\|\| G.match?.lava?.under(this.pos)` → `'lost'` (the buoy pops, its existing end path). |
| H19 | kits (one line each) | **Mandatory for every kit item that rolls or walks along floors or deals damage:** `torpedo.js` 344/352/421, `waddle.js` 348/546, `shaker.js` 448, `tracer.js` 306, and batch 5's Glide Bomb (its sink test reads `G.level.liquidY`, H23): `\|\| G.match?.lava?.under(pos)` → the item sinks with a hiss, no blast, no ink. Without it a Waddle or a Glide would walk along a drowned ledge under the lava and explode there. Optional (cosmetic only, the paint gate H7 already stops their ink): `bow.js` 323, `boomerang.js` 413, `brolly.js` 330, `mitts.js` 235/336 (the leap preview). Kit devices (the sentry, the bobbers) are ended by `crushIn` (H17); a bobber floats over the lava through `liquidY`. |
| H20 | `build/check-maps.mjs` | A lava section with the static checks of §5 (a tool, not engine). |
| H21 | `src/game/bossNav.js` `_build` (or its caller in the boss mode's setup) | When the match holds the lava (`'low'` / `'high'`): `G.match?.lava?.placeRiders()` first, so the Organ columns at the held pose are in `level.dyn` when the boss grid is rasterised (walls to the boss where they stand ≥ 0.55 m over its floor). One line; no other boss hook. |
| H22 | `src/world/environment.js` (where `this.sea` is created, line ~1810) | `if (this._stageEnv()?.sea === false) this.sea.visible = false;` (and skip its reflection pass and foam). The death plane (`PLAYER.waterY`) is untouched: only the mesh goes. The backdrop draws Highmark's far ocean far below. Default unchanged for every other stage. |
| H23 | `src/world/level.js` (one default method) | `liquidY(x, z) { return PLAYER.waterY; }` on `Level`; `LavaWorld.create` overrides it on the level instance: `level.liquidY = (x, z) => { const y = G.match?.lava?.surfaceAt(x, z) ?? -Infinity; return y > -Infinity ? y : PLAYER.waterY; }`. Inside the lava region the surface L, outside it the sea's −1.6. This is the subs SPEC's level hook (§0.5): the Glide sinks below it, a bobber floats 1.0 m over it, a sentry can't be placed under it. One shared answer to "where is the liquid here". |
| H24 | `src/game/match.js` (`StageLava.create(this)`) | `lavaSchedule(def, mode, duration, { practice: !!this.practice, attract: !!this.attract })` (§3.3), so Practice and the menu backdrop get their own loops although their mode string is `'turf'`. |
| T1 | `tools/botlab/shoot.cjs`, `stageart.cjs`, `tests/spawn-mid.js`, `tests/cover-map.js`, `tests/size-budget.js` | `LAVA=low\|high\|rise\|fall` appends `?lava=…`. |
| T2 | `tools/botlab/stageart.cjs` | `layout.art.lava` (`'high'` for Highmark) is appended as `?lava=…` when no `LAVA=` is given, so the stage-select art shows the stage at HIGH. |
| D1 | `docs/NET.md`, `docs/EVENTS.md` | A "Lava" paragraph (no records, splat field 15, the Practice clock) and the events of §3.6. |

### 3.6 Events (the bus)

| Event | Payload | When |
|---|---|---|
| `lava:warn` | `{ to: 'high' \| 'low', at, inS }` | `warn` s before each move |
| `lava:move` | `{ dir: 1 \| -1, from, to, dur, at }` | a move starts |
| `lava:rest` | `{ level: 'high' \| 'low', y }` | a move ends (Bazookarp rebuilds its Carp Field here) |
| `lava:hold` | `{ level, why: 'overtime' }` | overtime froze the schedule |
| `lava:set` | `{ y, phase, why: 'start' \| 'clock' \| 'late' \| 'debug' }` | the state re-derived at once: match start, a stage-clock snap over 1.5 s, a Practice late joiner, `hold()` |
| `lava:rider` | `{ id, up: bool }` | a stone with `sink` surfaces or sinks (Highmark: ×10 at L = −0.15 on every rise and fall: `lava_pop`, the stones blink on the map, the bots' windows change); a float locks at a pose |
| `splatted` | `{ victim, attacker, cause: 'lava' }` | the existing event, new cause |

---

## 4. What it means for each system

### 4.1 The paint grid and turf counting

**At load (`attachPaint`):**
- A face is a lava face (`f.lava = 1`) if any of its cell centres is inside the region and below HIGH + 0.05. Because
  the region is drawn 0.5 m inside every bank (rule 45), a wall that faces the lava is wholly inside the mask (well
  clear of its soft 1-texel edge): the rind, the glow and the burn are defined across its whole face. The strip of bank
  top inside the region is above HIGH + 0.3, so nothing new drowns and `under()` never fires there.
- Cells inside the region with centres below LOW − 0.02 are retired (`retireCells`). They are never turf and never
  counted, so `turfTotal` covers only ground that can ever be dry.
- Lava cells (inside, between LOW and HIGH) go into one list sorted by cell-centre height: `{ ids: Uint32Array, y:
  Float32Array }`.
- Designers keep the atlas from wasting space below LOW by making bank faces below LOW `paint: false` (§5 R11).

**Burn front (each frame while the lava rises):**
- The module advances a pointer through the sorted list from the last burned height to the current L.
- `paint.clearCells` zeroes those cells, lowers `counts`, does `version++`, and samples up to 96 inked ones. LavaLook
  puffs steam in each one's team colour (the wipe's look).
- GPU: one draw into the atlas through `paint.drawInto`. It uses a mesh of one quad per lava face covering its atlas
  rect, carrying world positions like `_wipeBand`. The shader discards outside the region mask or outside the height
  band (y0, y1] and writes zero with `NoBlending`.
- When the lava falls nothing happens, and the pointer resets to LOW at the next rise.
- A whole flat floor crosses in one frame: about 6,400 cells for 400 m², under 0.5 ms once. At Highmark all ~575 m² of
  ledge floor (at 0) cross in the one frame where L passes −0.15 + cell offset: about 9,200 cells, so the burn is
  **spread over up to 2 frames** (a per-frame cap of 6,000 cells, the rest the next frame; nobody can paint them in
  between, since the gate already refuses them).

**The gate (no ink under lava).** A splat painted at stage time `et` may ink a lava-face cell only if the cell centre is
above `clip`, where `clip = et < now ? lavaMax(et, now) : yAt(et)` (local splats use et = now, so clip = L now). The
CPU checks every cell of a lava face (one mask lookup, one compare). The GPU discards texels with the same height and
the same mask, through `aClip`. Redraws while a splat spreads or drips re-evaluate the clip, so no texel is drawn under
lava that rose meanwhile.

**Why it is exact online.** A cell ends up inked if and only if no lava covered it between the moment it was painted and
now, on every screen, whatever order splats arrive in:

| Case | Receiver | Clip | Result |
|---|---|---|---|
| rising, receiver ahead | painted cell already covered on the receiver's clock | `lavaMax(et, now)` = L now | rejected; the painter burns it at that same stage time |
| rising, receiver behind | covered later | L(et) | accepted; the receiver's own burn front clears it at the same stage time |
| falling, receiver ahead | uncovered earlier | L(et) | accepted |
| falling, receiver behind | still under its lava for ≤ 0.3 s | L(et) | accepted and drawn under the opaque surface; revealed as the lava falls (nothing burns on a fall) |

**Turf.**
- `coverage()` stays counts / turfTotal. Drowned ground is blank for both teams.
- The Turf War judge counts at time-up. The schedule always ends a Turf War on LOW: Highmark has 30 s of it (3:00) and
  25 s (1:30). The freshly scorched ledges are the final scramble.
- Floats' deck ink (`BoxPaint`) never counts as turf, like the tower. Stones are never inked.
- **Hex riders' deck paint**: one `BoxPaint` per hex rider over the hex's bounding square (r × √3·r … 2r × √3·r), with
  the cells outside the hexagon (and under the stub) dead; the three column boxes' `block.inkPaint` all point at it, so
  ink on the deck is one surface with no overlap. With `ink: 'all'`, each column box's two **short** faces carry a side
  `PartPaint`: for a box r × √3·r with corners on ±x, the short faces (length r, at z = ±√3·r/2) are two opposite faces of
  the hexagon, while its long faces (at x = ±r/2) lie inside the hexagon and are never painted. Six hex riders × (1 deck
  + up to 6 side faces): about 0.5 MB in all.
- **No rind on riders.** The world-space stain at 0.8 is not applied to rider meshes (`patchStain` skips them): a
  socketed column's faces below the island are hidden, and the lake-standing lookout rises 0.95 m faster than the lava,
  so its visible faces are never submerged at any pose. Riders show weathering above the island and heat-glaze near the
  lava instead.
- Zone Control floods (`paint.flood`) and Practice's wipe (`startWipe`) are untouched: zones never touch lava (§5 R26).
- A late joiner's `importGrid` copies the host's grid, which already has no ink under lava. Its stamps skip the clip.

### 4.2 Colliders, physics, players, devices

- **The lake** is void: no block, no collider. The kill check is `under(pos)`: inside the region and `pos.y < L +
  0.15`. It runs on the victim owner's screen, in `actor.update` before the sea check and after every body special
  (H3). The splat is the sea's: no armour, Kraken, Bubble Guard or invulnerability exception. Remote proxies are
  judged by their owners (`netmatch` forwards `splatted` with the cause).
- **Drowned floors** stay solid static blocks. Under lava you are dead before you stand on them.
- **Riders** are dynamic blocks, one per part (`addDynamic({ tag: 'lava:' + id + ':' + part, perch: kind ===
  'stone' })`), added at the first playing frame as movers do (`_goLive`), or earlier by `placeRiders()` (H21). A hex
  rider's three column boxes are turned 0°, 60°, 120° about its centre and move together; `moveDynamic` keeps all three
  within 1 mm of each other. Each frame, while L moves, every part is
  placed with `moveDynamic` relative to the rider's top `top0 + (top1 − top0) · e`. The default single part is a box
  from `top − depth` to `top`.
  - Riders carry their riders with no code: `Actor._resolve`'s stick (≤ 0.35 m up / 0.45 m down per frame) follows a
    top moving at ≤ 0.6 m/s.
  - Devices on them ride by the sp-fixes rule (`b.dp`).
  - A float's deck has `block.inkPaint = BoxPaint` (deck only, a 0.15 m bare rim). `Actor._surface` already reads it.
    With `ink: 'all'` its sides take ink too, and `Actor._updateClimb` / `_wallInk` already swim up a dynamic block's
    inked wall (the tower's). That is for humans: bots never plan a climb onto a rider (no climb edges), so rule 23's
    hop route is still required.
  - A stone with `sink: { at, ease, rel }`: its top relative to the lava runs linearly between `rel[0]` and `rel[1]`
    over `ease` seconds, timed so it crosses L + `kill` exactly when L crosses `at` (§3.1). It is solid exactly while
    its top ≥ L + `kill`; below that it is `solid = false`, and once it is `rel[0]` under the surface it is parked 50 m
    down (out of every query). Nobody alive can be where it surfaces, because that space is lava until the stone is
    solid; anyone airborne over it lands on it. Highmark: `at` −0.15, `ease` 2.4 s, `rel` [−0.45, 0.45]: the stones
    are solid from the instant the shelves turn deadly (38.8 s in §3.4) and reach the kill height again the instant the
    shelves are dry (76.2 s); anyone still on one then splats (warned for 16.2 s). Speed: 0.375 m/s relative + the
    lava's ≤ 0.21 = 0.585 m/s (rule 17).
- **Nothing appears inside a player.** Stones and floats only move vertically. Above them is clear sky (§5 R22). Beside
  them is a seam ≤ 0.3 m, or a gap with lava below it (§5 R20): anyone who slips into a gap meets the lava, and nobody
  can be pinned between a rider and a floor. A player whose foot-ring overhangs a rising rider is lifted onto it. One
  standing on a descending rider near a static ledge steps onto the ledge.
- **Shoves.** None needed for vertical riders. The lava's escape-on-snap (`lava:set` with `why: 'clock'` putting
  someone's floor under lava instantly) is a shove: `shoveActor` toward the nearest node dry for 8 s, floor and line
  checks on, else they die as they would have.
- **Super jumps.**
  - In flight you are above everything and invulnerable.
  - At the charge → flight moment, `safeLanding(to, dur)` asks whether the landing point will be lava, or on a rider
    that won't be there, when you arrive. If so, it moves the landing to the nearest node open at arrival (≤ 8 m by
    the graph, else the jumper's spawn pad).
  - Beacon jumps, Ink Jet and Zipline returns (`superJump(origin, { home: true })`) and the respawn's queued jump all go
    through it.
- **Shots and objects.**
  - Projectiles, bombs and thrown subs that reach the surface fizzle with no splat and no blast (H16, H17). Kits that
    are not hooked fall to the void (H19).
  - Ray weapons (chargers) pass into the lava; their splat on hidden ground is gated (H7).
- **Devices** (sprinkler, beacon, Drip Curtain, Lurk Mine, Surf N' Turf buoy, kit deployables: the Scrap Sentry, Chain
  Bobbers):
  - The owner's screen sweeps its own at 4 Hz while L rises, or when a rider changes: `sweepDevices()` →
    `G.deploy.crushIn({ where: (p) => under(p, -0.05) }, 'lava')` (H17).
  - They are destroyed with a sizzle, no blast, no ink. The owner's end record pops the ghosts everywhere.
  - A Chain Bobber floats 1.0 m over `G.level.liquidY` and rides the lava up and down (subs SPEC C1.2); it is ended only
    if the lava reaches its sphere's bottom.
  - Special fields (Ink Tempest's cloud, Drainbow's bubble, Booyah) are not devices and are untouched.

### 4.3 The nav graph and bots

**Rider nodes and step links** (`LavaWorld.buildNav`, at world build):
1. Every rider's parts are added as dynamic blocks at the LOW pose (top0), and graph A is built: `new NavGraph(level,
   physics)`. `NavGraph._build` sees dynamic blocks through `queryBlocks`, so rider tops get ordinary nodes, edges to
   their neighbours, `_clear` headroom and `_prune` reachability. A `sink` stone is left out of this build.
2. The parts are moved to the HIGH pose (top1) and graph B is built. Its nodes standing on a rider part, and their edges
   to static nodes, are copied into A:
   - B's static nodes map to A's by (cell `ix, iz`, height within 0.15 m);
   - copied nodes get new ids after A's and go into `A.cells`;
   - then `A._prune()` re-runs for `valid` / `exitable` / `validIds`.

   Two full builds work for any travel (Highmark's Organ A moves only 0.95 m, so its LOW and HIGH nodes share cells at
   different heights: the merge keys on height too). Measured cost: one more build, 119–143 ms on today's stages
   (§1.3), plus about 20 ms to merge. Highmark's sink stones are in build B only (their only pose in play).
3. Every node then gets a `kind`:
   - 0: unaffected.
   - 1: a floor node the lava can reach: in the region and `n.y − LAVA.navLead < HIGH`.
   - 2: a rider node, with its rider and pose.
   It precomputes per floor node its shut height `n.y − 0.35`. Per node it also finds the nearest node of kind 0 by the
   graph (`exitOf`, metres `escD`), and keeps `reach` for Bazookarp.
4. It **removes every edge that crosses a gap**: an edge whose straight line inside the region has more than 0.3 m with
   no floor within 0.5 m below. The line is sampled every 0.05 m against the rider parts at that edge's pose and the
   static blocks.
5. **No `leap` edges in v1.** Every gap Highmark puts beside a rider is a seam (0.25 m between stones and at their
   ends, 0.20 m between Organ columns, 0.15 m round the Organ socket), so step 4 keeps those edges and cuts nothing a bot
   needs. (The draft's leap edges, `steerLeap` and their 200-leap test are deferred to a stage that needs them.)
5a. **Step links** (`def.steps`). The grid's own edges across a seam exist only by luck of its offset (nav.js makes
   jump edges between orthogonal 1 m cells, and `_clear` keeps nodes 0.46 m from a taller column, so across a 0.20 m
   seam the window for an orthogonal pair is 0.34 m wide). For each link `[from, to]` and each pose where both ends
   exist (a stone: its HIGH pose; a column: both), `buildNav` finds the nodes on each side within 1.6 m of the seam (an
   `[x, z]` end: the static nodes within 1.6 m of that point), takes the closest pair (and a second pair ≥ 0.8 m from the
   first when the seam is wider than 2 m), and adds both directions: `walk` where |dy| ≤ 0.5, else `jump` up (cost flat
   + 2.5) and `drop` down (flat + 0.8), if the waist ray (`_blocked` at the higher top + 0.6) is clear. A link that
   yields no pair at a pose it needs **throws** (the audit fails loudly). Rider-to-rider pairs carry the rider window of
   both ends. After the links, `A._prune()` and step 3's kinds, `exitOf` and `reach` are recomputed, so a rider top
   reached only by a link stays valid.
5b. **No wet cost on riders.** Rider nodes get `wet = 0` (nav.js would charge +2 per node within 1.2 m of void: +10–25
   per Race crossing), and so do the two static nodes at each end of a link.
6. It removes the rider parts again (`level.clearDynamic()`: nothing else is dynamic at build time). The match adds
   them back at its first playing frame.

**Time windows** (`StageLava.win`, set as `G.nav.lava` by the match, cleared at dispose):
- `shut(id, t)` returns 0 (open), 1 (soft) or 2 (hard).
  - A floor node is soft when `L(t) ≥ y − 0.35` or `L(t + 2) ≥ y − 0.35`. It is never hard: the floor is there, and a
    bot standing on it must be able to walk out.
  - A rider node is hard when the rider's top at t is more than 0.3 m from the node's pose, or the rider is sunk. It is
    soft when that will be true within 2 s.
- In `path()` (H4): arrival time = now + metres walked × `sPerM` (1/7 s per metre). Hard → the edge is skipped. Soft →
  +60.
  - A bot never plans across a flank the lava reaches before it gets there.
  - It uses the Pumice Race only when its stones will be within 0.3 m of their HIGH pose as it arrives (L ≥ 0.5: from
    7.0 s into a rise until 3.0 s into a fall).
  - A bot already on a soft node finds the shortest way out (every neighbour is soft).
- **The nav layer** (`navClaim(this)`) marks floor nodes the lava reaches within `goalLook` = 8 s, and rider nodes that
  will be hard within 4 s.
  - It is refreshed at most 4 times a second, only when the set changes.
  - `nearest()` skips those for goals, and `navCommit` re-plans every bot whose route runs into a newly marked node.
- **Cost:** A* evaluates `lavaAt` (a few flops) only for kind > 0 nodes. That is ≤ 30 % of the edges a search relaxes,
  under 0.1 ms on a stage-crossing route.

**How a bot knows.** It knows what every player knows: the schedule and the clock (the HUD gauge and the countdown).
It never reads anything a player can't see.

**How a bot behaves** (`lava.bot(b, dt, it, move, vis)`, every 0.25 s):
- **Escape.**
  - When the bot's node is kind 1 and the time until it shuts is under `escD / 5 + 2.5` s, the bot routes to `exitOf`.
  - Until it is out, `move` follows that route: swimming where it's on its own ink, still firing at a visible target
    (the brain's aim is kept).
  - Duels on a drowning flank therefore end with the bot backing out, not standing in the lava.
- **Riders.** On a rider whose window closes within 4 s (`sink` stones, and floats leaving a pose), the bot steps off
  to the landing its window graph gives.
- **Stats**: each bot counts `lavaDeaths`, `slumpCrossings` (shelf or Race) and `lookoutSeconds` (for the Mac mini
  targets in §6).
- **Edges.** `_wet`, `_avoidWater`, `_squidWouldDrop` and `_edgeGuard` refuse drowning floor (H5). A bot riding a float
  down never walks off it onto lava.
- **Lookouts.** Charge weapons already value height in `_pickPaintGoal` (`score += clamp(n.y, 0, 5) * 1.6`), so
  chargers go to an Organ's HIGH-pose nodes (4.65, the highest floor at mid) when they're open, climbing its three
  1.15 m hops over the step links. No new goal code.
- **Not in v1:** riding a float up on purpose (a `ride` edge type), and placing devices with the schedule in mind.
  Measure first (§6 step 8); add them only if bots under-use the lookouts.

**Bazookarp** (`../../bazookarp/SPEC.md` §3.2 step 6, §5.5, §9.4):
- The Carp Field has two states, LOW and HIGH, precomputed at load from `restMask('low')` and `restMask('high')`; it
  switches at `lava:warn { to }` (never a rebuild).
- Its drop spot avoids `reach` nodes.
- `lava:warn` tells it to move a resting Bazookarp before the lava gets there.
- Last footing is on static floor only. A lava death is a fall (S25 / S26).

### 4.4 The camera

- **Lens lift (H9).** The lens never goes below the surface + 0.15 m. Over the lake `groundHeight` is −Infinity, so
  without H9 the lens could sink into the lava when you stand at the shore looking down.
- **Floats** move at a peak of ≤ 0.6 m/s (§5 R17). The follow camera's pivot rides with the player and the boom's soft probe
  handles the passing ledges.
- **Riders vs the boom.** `cameraProbe` sees dynamic blocks. A float rising between the lens and the player pulls the
  boom in, as any wall does, and the see-through window keeps the player visible.
- **Shake.** 0.25 at each rise start, through `emit('shake')`, so `settings.cameraShake` and reduced motion are
  respected.
- **TAB map.** The diorama renders the scene from above, so it shows the lava, the stones and the floats as they are.
- **Splat cam.** After a lava death it uses the victim's position and the existing spectate code. Checked with a
  picture in §6 step 5.

### 4.5 The HUD and the maps

- **Gauge chip** (`lavaGauge`, the module's own DOM under the timer):
  - A 28 × 84 px dark-glass tube. Deep red lava fills it to e (0 at LOW, 1 at the ash-white stain tick at the top).
  - ▲ (red) or ▼ (cool grey) while moving. The countdown digits during a warning.
  - An SVG glyph (a lava wave under a line) in the HUD's icon style.
  - Its colours are crimson and white-hot, never mid-orange, so it never looks like a team colour.
- **Callouts** (H11):

  | When | Callout (Highmark's `def.text`) | Sub-line | Size |
  |---|---|---|---|
  | warn-rise | "LAVA RISING" | "Off the low ground: N" (N counts down) | big |
  | move, rise | "SURGE!" | "The Pumice Race is coming up" | small |
  | rest-high | "HIGH MARK" | "Race up · Organ Pipes up" | small |
  | warn-fall | "LAVA FALLING" | "The stones sink in N" (N to the moment they turn deadly: 16 → 1) | big |
  | rest-low | "EBB" | "Slump shelf, Spillway and casting floor open" | small |
  | overtime | "LAVA HOLDS" | — | small |

  Each is shown once per event, from the event (so identical on every screen). Without `def.text` the draft's generic
  wording applies ("Low ground floods in N", "STONE PATHS UP", "LOW GROUND OPEN").
- **The personal line** (bottom centre, from `hud().mine`, only for the local player): "GET OFF THE LOW GROUND → N m"
  with an arrow toward `exitOf`, from the warning until they are off; "THE STONES ARE SINKING → N m" on a stone from the
  fall warning, the arrow to the nearer Slump head. It never shows on a bot's or a spectated player's behalf.
- **Splat card:** "Burned in the lava" or "Knocked into the lava", with a lava-wave icon. Splat flood: deep red.
- **Minimap** (`drawMap`):
  - The region filled in lava red with a crust texture wherever the floor top is below L. This comes from a 2 px/m
    offscreen canvas, rebuilt when L crosses a 0.1 m step: at most 24 times per move, each under 1 ms.
  - During a warn-rise or rise, a pulsing red hatch over everything below HIGH.
  - Stones drawn as small dark tiles while they're up (they blink during the fall warning). Organ clusters as hexes
    with ▲ when risen.
- **World:** the stain line pulses during warnings, the gauges' needles move (`def.gauges`), and the backdrop cone
  erupts.
- **Stage select / `check-maps --svg`:** the region drawn as lava (H15).

### 4.6 The lightmap bake and stage variants per mode

- **The bake** (`bake.cjs`, `build/bake-ao.cjs`) sees only static blocks. The rider parts used for the nav builds are
  added and removed inside `_buildWorldNow` before the bake reads the level. The lava changes no static geometry, so the
  lava needs **no** lightmap of its own. Highmark has two lightmaps for its modes: `caldera`, and `caldera.bazookarp`
  (the Bazookarp kit's weir and Gate pieces and the stage's `onlyIn: 'bazookarp'` Ladle Gantry, SPEC §4.2).
- **Rider meshes** carry their own baked vertex AO. The lava's light on surfaces is the shader's glow term, not baked.
- **Mode differences** are mostly schedule only (§3.3), with no geometry and no new bake. A mode-only piece (a Tower
  Command track pier, a Bazookarp Gate approach) is an `onlyIn` / `notIn` block as on every stage and gets its own
  world and bake. Rider, region, gauge and cascade items take `onlyIn` / `notIn` too.
- **Boss Battle: `'low'`** (Highmark offers it).
  - The lake is void, so `BossNav` treats it as a drop; the ledges (0) are 1.2 m below the boss's floor (`boss.floorY:
    1.2`), so they are drops too. Drowning floors are dry and the stones are sunk.
  - The Organs stand at their LOW pose (1.4 / 1.8 / 2.3). H21 adds them before `BossNav` builds, so the boss treats the
    columns standing ≥ 0.55 m over its floor (B and L) as walls and steps round them; L stands half in the lake, a drop
    to the boss anyway.
  - HULLBREAKER never meets the lava. No other boss hook.

### 4.7 Online

- **No new records in a match.**
  - Everything (L, riders, warnings, events, nav windows, the burn) is a pure function of the stage clock. Followers
    track it to about ±0.2 s (`StageClock.tick` + `netmatch._hostClock`).
  - A snap over 1.5 s re-derives everything at once (`lava:set`, `why: 'clock'`). Cells crossed upward burn. Riders
    jump to their new tops. Own squidkids whose floor is now under lava are escape-shoved (§4.2).
- **Splat records** carry the painter's stage time in field 15 (H10) when they can reach the region below HIGH:
  `tagSplat` checks the splat's AABB (radius × 3) against the region's AABB and `c.y − 3r < HIGH + 0.1`. That is 5
  bytes per such splat. The same field serves bluestone (its H11); build it once.
- **Who decides what.**
  - Victims decide their own lava deaths (cause `lava`, forwarded like `water`).
  - Owners destroy their own devices.
  - Shooters decide hits.
  - The host's count is the result, as today.
- **Practice.**
  - The host's tick carries the stage clock (H10).
  - A late joiner's lava comes from its first tick (`lava:set`, `why: 'late'`), its turf from `importGrid`. The burn
    pointer starts at the joiner's current L without burning, because the imported grid is already right.
- **Host change.** `m.time` continues on the new host, so the next move happens on time. Nothing to hand over.
- **Tolerance.** Two screens' L differ by at most the rise speed × clock skew: 0.21 m/s × 0.2 s = 4 cm (a stone in its ease: 0.585 × 0.2 = 12 cm, inside the 0.35 m stick). Kills, rider
  tops and the burn are each decided per screen. Ink converges exactly (§4.1). `net-lava.cjs` asserts it (§6).

### 4.8 Performance against Halyard (judged side by side in the same run)

Halyard grew in the Long Stages round: after it, `shoot.cjs` at load read 312–379 draw calls, 3.63–3.86 M triangles,
5.2–6.1 ms cpuRender and loadMs 8.1–8.9 s (the draft quoted the older 334 / 3.0 M / 3.75 ms / 6.8 s). The lava's own
cost, Highmark's numbers:

| Item | Steady state | During a move |
|---|---|---|
| Draw calls | Lava surface 1, embers 1, stones 1 instanced (10 boulders, 5 variants), drifting pumice 1 instanced (48), Organ columns 1 instanced (6 hexes + 2 stubs) + deck ink 1 (one overlay mesh for the 6 hex decks) + side ink 1, gauge needles 1 instanced, cascades 1: **≤ +10**; shadow pass: Organs ≤ +1 | the same |
| Triangles | surface ≤ 2 k, stones 10 × 800, pumice 48 × 60, Organs 6 × 1.5 k, needles, cascades: **≤ 25 k** | the same |
| CPU per frame | clock + phase O(1); kill checks ≤ 8 own actors (one mask lookup each); `under()` per live projectile; nav layer ≤ 4 Hz × ≤ 4,000 kind-1 nodes; device sweep 4 Hz; uniforms: **≤ 0.1 ms** | `moveDynamic` × ≤ 40; burn ≤ 0.2 ms (≤ 0.5 ms the frame a whole floor drowns); minimap redraw ≤ 1 ms at most 3 times a second: **≤ 0.4 ms** |
| Dynamic-block tax on every query | ≤ 40 rider parts: about +0.12 µs per query and +0.2–1.0 µs per ray (§1.3 doubled); sunk stones parked out of it | the same |
| GPU | Lava surface ≈ 70 ALU + 5 taps per pixel on the ≤ 35 % of the screen it covers; level and prop fragments in the region +1 tap +≈ 25 ALU behind `#ifdef LAVA` | the same, plus the burn draw (one quad per lava face) |
| Load | Region mask and lava map ≤ 0.15 s (256 k samples × ≤ 0.46 µs, plus block rasterisation); `attachPaint` ≤ 30 ms; nav: a second build and the merge, +140–180 ms; shader programs +3 (level-lava, grate-lava, lava surface) and +5 patched prop programs ≈ 0.2–0.5 s of compiles behind the stage card | — |
| Memory | lava map 1 MB GPU + 1.3 MB CPU; lava cell list ≤ 0.5 MB; float decks' `BoxPaint` 2 × ≈ 0.5 MB; nav windows ≈ 0.1 MB | — |

- **Target:** in one `shoot.cjs` run with Halyard beside it (same machine, same quality, day), at `LAVA=low` and at
  `LAVA=high`: Highmark's draw calls ≤ Halyard's, triangles ≤ Halyard's, cpuRender ≤ Halyard's, and loadMs ≤ Halyard's
  + 0.8 s (the second nav build is 0.12–0.16 s of it). The stage builder keeps everything but the lava ≥ 10 calls under
  Halyard. With `env.sea: false` (H22) Highmark also skips the sea's planar reflection pass, which Halyard pays for.
- **Quality presets:**
  - *low*: no embers, one noise octave on the surface, no glow spill.
  - *medium*: 300 embers.
  - *high*: 600 embers.

---

## 5. Rules for the level designer (hard limits)

`check-maps` checks the ones marked (C). The page audit `lava-audit.js` checks those marked (A).

**Heights and timing**
1. LOW is between −1.6 and 0.0. HIGH − LOW is between 1.2 and 3.0. HIGH ≤ 2.0. (C)
2. Every move is 6–12 s, with a peak speed ≤ 0.47 m/s (smoothstep peaks at 1.5 × (HIGH − LOW) / duration; linear at
   1 ×). Warnings are 6–10 s. (C)
3. The first move starts ≥ 25 s after play starts. Holds are ≥ 15 s at HIGH and ≥ 25 s at LOW. The `practice` and
   `attract` schedules are exempt (they are not matches). (C)
4. Turf War ends at LOW, held for ≥ 25 s; ≥ 45 s if drownable turf is over 15 %. (C)
5. Modes with overtime start no move in the last `warn + 2` s of regulation. (C)
6. Inside the region, no static **flat** walkable top lies within 0.3 m of LOW or of HIGH. Stairs and ramps (sloped
   tops) may cross both: the kill line then simply crosses them (Highmark's eight 2.4 m stairs from the ledges). (C)
7. Drownable floors (tops between LOW + 0.3 and HIGH − 0.3) are ≥ LOW + 0.5. Then the lowest one gets ≥ 2.4 s of rise
   after its 6–10 s warning. (C)

**The region and the lake**
8. The region and every rider, gauge, cascade and vent are 180°-symmetric (a twin within 0.05 m). (C)
9. The lake is void: no block with a top below LOW + 0.3 inside the region, except bank and island sides that reach
   down to ≤ LOW − 0.5 (Highmark: −1.1), so no bottom edge shows at LOW. (C)
10. No sealed pits: every point of drownable floor connects to the open lake at the same level. The region contains
    every place lava flows, plus a strip 0.5 m into every bank that bounds it (rule 45). (A)
11. Bank and island faces below LOW are `paint: false` (split the block at LOW). (C, warning)
12. No grate floors inside the region below HIGH + 2.0. Railings (`rail`) are fine. (C)
13. Drownable turf is ≤ 25 % of the stage's turf. Each half's is equal. (C)
14. Every point of drownable floor is ≤ 12 m walking from a floor that never drowns (top ≥ HIGH + 0.3), and the way
    there never drops below that point (6.3 s even through enemy ink). Highmark paper: ≤ 10.0 m. (A)

**Riders** (stones and floats)
15. Footprints are 1.6–5.5 m a side. The depth (hull below the top) is ≥ top − LOW + 0.3 at the LOW pose, so the
    bottom never shows. An `inLake` rider (standing in open lava, not in a socket) also keeps its bottom ≥ 0.3 m under
    the surface at every pose (Highmark's lookout: L − bottom = 1.3 − 0.95·e ≥ 0.35). (C)
16. Every rider's top is ≥ L + 0.35 at both poses (and so at every moment between); a `sink` stone only while it is
    surfaced. A float used as a lookout is ≥ L + 1.0. (C)
17. A rider's peak speed is ≤ 0.6 m/s (its travel × the ease's peak factor / the move's duration; a sink stone's
    surfacing and sinking ease included: relative speed + the lava's speed at that moment). (C)
18. Travel top1 − top0 is ≥ 0.6 m; anything that moves less should be static. (C)
19. Under every rider's footprint there is no static walkable top within 1.6 m below its LOW-pose bottom: only lava,
    void, or its own pit floor, which it rests on. (C)
20. Beside a rider, where its footprint meets anything static, there is either a seam ≤ 0.3 m to static geometry or
    another rider (walkable), or a gap with lava or void below it (open lava). A gap beside a rider never has dry floor
    below it, so nobody is ever caught between a rider and a floor. A rider standing in a socket cut into a floor
    (Highmark's Organs: 0.15 m round the cluster, 0.20 m between columns) meets this with its socket's seam; the space
    above the floor beside a rising column is open air, not a gap. (C)
21. **No leap gaps in v1.** Every gap beside a rider that a route uses is a seam ≤ 0.3 m; every other gap is open lava
    ≥ 2.5 m wide (never a route). (Leap gaps of 0.3–1.6 m need `engine-draft.md` §4.3 step 5, `steerLeap` and its 200-leap
    test, which are not built.) (A)
22. Clear sky over every rider: nothing static within 2.2 m above its HIGH-pose top, or anywhere over its travel. (C)
23. Every rider top that is in play at a pose is reachable at that pose by walking or hopping (≤ 1.25 m up for bots:
    `nav.js` makes jump edges only to 1.25 m; ≤ 1.8 m for kids) from floor dry at that pose, and you can get off the
    same way, **over a `steps` link** (rule 46). Nobody can be stranded on a rider, and no lookout is ride-only.
    Highmark's Organ clusters are their own stairs: island → A → B → L is 0.2 / 0.4 / 0.5 m at LOW and 1.15 / 1.15 /
    1.15 m at HIGH; the stones are flush (0.05 m) with the Slump heads at HIGH and are not in play below it (sunk, or
    outside their nav window). (A)
24. Stones are bare. Float decks take ink (≤ 30 m² each, never counted as turf). A float's sides are bare unless
    `ink: 'all'` (humans may swim up them; bots never plan to, rule 23). (by construction)
25. A float used as a lookout has cover at most 1.0 m tall along at most half its edge, and at least two open sides.
    It is within 22 m of dry floor of both teams at HIGH, and its HIGH top is ≤ 4.6 m above the floor anyone reaches
    it from (Highmark: 3.45 m over the island). (A)

**Objectives and spawns**
26. Zone floors (`y0`) are ≥ HIGH + 0.3. Zones are never on a rider. (C)
27. The tower track's floor under the whole 2.5 m platform is ≥ HIGH + 0.3. The track's swept volume plus its 3.72 m
    headroom stays ≥ 1.0 m from every rider's travel. (C)
28. Bazookarp: the Pond, weirs, Gates and Carp-Free Zones are not on lava-reachable ground. No Carp-Free Zone lies on a
    route only the lava opens (SPEC §9.4). (A)
29. Spawn pads, the spawn deck and the first 15 m of every route out of it never drown, and are ≥ 10 m (xz) from the
    region. (C)

**Counts**
30. ≤ 40 rider parts (dynamic blocks) in total, twins included. Highmark: 30 (10 stones; 6 hex columns × 3 boxes; 2
    stubs). (C)
31. ≤ 4 gauges, ≤ 4 cascades, ≤ 12 vents, twins included. (C)
32. Props below HIGH inside the region use the kit's `paint`, `gloss`, `metal`, `wood` or `rubber` buckets (they get
    the stain). No foliage, cloth, flags, inflatables or custom materials there. (A: a render scan)

**Routes, both at LOW and at HIGH** (`spawn-mid.js`, `cover-map.js` and route counts run with `LAVA=low` and
`LAVA=high`)
33. 2–4 flank routes on each side in each state.
34. Spawn to mid swim time is 5.4–6.6 s in each state.
35. Cover every 6–10 m in each state.
36. A route that exists only at HIGH (stone paths, a lookout) is never a shortcut into a base (Bazookarp entrance rule).
    No state removes a route without another way to the same place.

**Environment and looks**
37. `env.edge: 'none'` and `env.boats: false`. No pilings or boats inside the crater.
38. Surfaces in the region are mid-value rock, never black: the surface colour's sRGB luminance is ≥ 0.35 (`#5f5f5f` or
    lighter; Highmark's basalt `#5f636b` and glaze `#6e6862`). Below the mark the stain darkens them to about 0.7×,
    which is what makes "the dark glazed floor floods" readable, and ink must stay the loudest colour. (A: palette
    pictures)
39. The lava's colours are the engine's (§7, R1). A stage chooses only the crust preset (`'ember'`, the default:
    warm charcoal-maroon with ≥ 35 % lit seams at rest; `'basalt'`; `'ash'`). (A: the seam share is measured)

**Shapes and swaps (new for this design)**
40. A `shape: 'hex'` rider is three boxes r × √3·r at yaw 0°, 60°, 120° about its centre, corners on its ±x; its socket
    in the floor is the same hexagon (or cluster outline) 0.15 m larger; its columns in one cluster sit ≤ 0.3 m apart
    flat to flat. (C)
41. A sink-stone path that replaces a drowning route lies **in the same bay as that route** (≥ 2.5 m of open lava from
    it, never over it: rule 19), sets `sink.at` to that route's ledge top − 0.15 and `rel[1]` ≥ 0.35, so the stones
    become solid exactly as the ledges become deadly and turn deadly exactly as they come back (Highmark: the Slump
    shelf at 0, `at` −0.15, `rel` [−0.45, 0.45], the Race 2.6–3.6 m lakeward of the shelf). (A)
42. With `env.sea: false` the stage's backdrop covers every view out of the arena down to at least 20 m below the
    deck, so no void shows through a notch or over a wall (Highmark: the outer flanks, the lavafall chutes, the sea far
    below). (A: shoot.cjs side and aerial pictures)
43. **No fall reports the sea.** Every outer edge of walkable floor is a wall (≥ 3 m over the floor, `roof`) except
    where an open drop is intended; every intended drop lands in the region or in a `falls` polygon, so its cause is
    `lava` (Highmark: the two chutes past the Spillway lips). (A: `lava-rules.js` drops a kid off every edge segment)
44. **No unplanned jumps across lava.** Every open-lava gap between two standable floors is either a seam (≤ 0.3 m) or
    ≥ 4.5 m wide level (Highmark's narrowest: the south head's tip to the island, 4.5 m); the dash-reach audit (subs
    SPEC D10.6: a hop plus the Dash Pellet's air dash) runs at LOW and at HIGH and lists every connection the nav graph
    lacks with a gain over 10 m. (A)
45. **No wall on the outline.** The region's outline lies ≥ 0.5 m inside every bank, cliff and island face it meets
    (never along a face), and that strip is solid bank whose top is ≥ HIGH + 0.3. Every face that meets the lava is
    then wholly inside the mask: the rind and the burn are defined on all of it. (C: the region's edge is tested against
    every block face within 0.6 m)
46. **Every rider climb is linked.** Each seam a route crosses onto or off a rider (column to column, ground to column,
    head to stone, stone to stone) is listed in `def.steps`; `buildNav` throws if a link yields no edge pair at a pose it
    needs, and `lava-nav.js` rebuilds with the bounds shifted 0.25 m and 0.5 m to prove no climb depends on the grid's
    offset. (A)

---

## 6. Build plan (each step ends with a test that fails without it)

**Fixture.** Until the stage exists, the engine is built on **`lavabox`**, a test-only stage (never shipped) in
`tools/botlab/tests/lavabox.js`. Page tests import it, install it into `MAPS` and `MAP_LAYOUTS` the way
`tower-match.cjs` installs `towerbox`, and start a match on it. On a 56 × 120 m deck it has:
- spawn decks at z = ±52 (4.8 m) and terraces at 2.4;
- a void lake 30 × 44 m with a drownable crust (0) and a ford (0.3), LOW −0.6, HIGH 0.8 (Highmark's), plus a second
  schedule entry with LOW −1.6 so the deep case stays tested;
- one Highmark-style Slump per half: a 4.5 m shelf at 0 along a cliff between two 1.2 m heads, and five sink stones in a
  zig-zag 2.6 m lakeward of it (turned boxes of different sizes, `yaw` −19°, 0.25 m seams, `sink: { at: -0.15, ease:
  2.4, rel: [-0.45, 0.45] }`), with their `steps` links (so the swap of rule 41 and the links of rule 46 are tested);
- one Organ cluster per half: three hex columns in a line (r 2.5 / 1.5 / 1.5; tops 2.3 → 4.65, 1.8 → 3.5, 1.4 → 2.35;
  0.20 m seams) in a 0.15 m notch at the edge of a 1.2 m island, the lookout `inLake` with a stub part and
  `ink: 'all'`, with its `steps` links;
- a `falls` polygon past a lip with a lip fence, and an open edge elsewhere (for rule 43's test);
- a bank wall exactly 0.5 m outside the region's edge (rule 45's rind and burn test);
- one float per half built as a 3-part lift (deck + two 0.9 m bulwarks), kept as the generic multi-part test;
- a second schedule entry with `ease: 'linear'` for the easing tests;
- a long flank shelf (14 m, exit at one end);
- walls in the lake for stain pictures;
- a dry zone, and a tower track on a bridge.

Page tests run with `MAP=lavabox PAGE=tools/botlab/tests/<name>.js tools/botlab/run.sh tools/botlab/page.cjs`.

| # | Step | Test (`tools/botlab/tests/`) |
|---|---|---|
| 1 | **The pure core**: `lavaSchedule`, `lavaAt`, `lavaMax`, `riderTop`; schedule lookup, loops, `moves`, overtime 'hold'; check-maps lava section (H20); mapThumb (H15). | `lava-cycle.js`: Highmark's tables come out exactly (§3.3, to 0.01 s), including the never-scheduled fourth 5:00 rise; L is continuous; smoothstep peaks at 1.5 × the average speed; `lavaMax` equals a brute-force maximum on 10,000 random intervals; overtime 'hold' finishes a running move and cancels a warning. `node build/check-maps.mjs` stays "ok" on every stage; a broken copy of the fixture trips each (C) rule. |
| 2 | **`LavaWorld`**: region mask, lava map, the surface mesh (`lavaFx`), `patchProps`, `buildLook`, H1 (world-build chain). | `lava-world.js`: the mask matches a polygon test on 5,000 random points; the map's solid bits match `level.pointInside` on 2,000 samples; `shoot.cjs` pictures at LOW / HIGH (`LAVA=`); loadMs with and without lava (≤ +0.8 s). |
| 3 | **`StageLava` runtime**: clock, phases, events, the kill check (H3, with `falls`), camera (H9), projectiles / bombs / subs (H16, H17), the device sweep through `crushIn`, `safeLanding`, buoy (H18), `liquidY` (H23), the schedule flags (H24), `restMask`. | `lava-rules.js`: a kid and a squid standing on the crust splat with cause `lava` within one frame of L passing feet − 0.15, not before; a kid mid-jump over the lake splats at L + 0.15; with LOW = −1.6 (the second schedule) the cause is `lava`, never `water`; **a kid dropped over the lip fence splats with cause `lava`, a kid dropped off the open edge with `water`, and on `caldera` a kid dropped off every edge segment never reports `water`**; a sprinkler, beacon, mine, buoy, Scrap Sentry and Chain Bobber chain on the crust are gone when covered (one `device:down` each, no blast); a bobber over open lava rides 1.0 m over it; bombs, a Waddle, a Glide and shots into the lake sink or fizzle with no paint; a super jump to a teammate on a stone that will be under by landing lands on the nearest dry node; the lens is never below L + 0.15 in a 360° orbit at the shore; the `lava:*` events fire at the right stage times; `liquidY` returns L inside the region and −1.6 outside; Practice and attract matches get their own loops; `restMask('low')` / `('high')` match a node-by-node check of the rest poses. |
| 4 | **Riders**: dynamic blocks, poses, multi-part riders, **hex riders and their shared deck paint** (the boxes' short faces carry the side paint), carrying, `sink` (the timed ease, solid exactly while top ≥ L + 0.15, park), float decks and `ink: 'all'` sides (`BoxPaint`), `inLake`, linear and smooth easing, `placeRiders()`. | `lava-riders.js`: a hex rider's three boxes stay within 1 mm of each other and a splat across their joins inks one continuous deck (pixel read, no seam, no double), and a splat on each of the six sides inks that side; the stones become solid the same frame the ledge shelf's kill starts and turn deadly the same frame it stops, never both open and never neither, never faster than 0.6 m/s; the `inLake` lookout's bottom is never above L − 0.3; a kid on each Organ column, stone and float rides a full rise and fall (never airborne over 0.1 s, never more than 2 cm inside a part); a multi-part lift's parts stay within 1 mm of each other; a kid overhanging a rising float is lifted, never inside it; a `sink` stone is not solid and is out of `level.dyn` queries while sunk; swimming on a float deck in your own ink refills; a squid swims up an `ink: 'all'` float's side during a rise and pops onto its deck; no rider top is ever under L + 0.35 while in play; no rider mesh carries the stain chunk. |
| 5 | **Paint**: `attachPaint` (retire below LOW), the burn front (CPU + `drawInto`), the gate (H7), the splat time tag (H10). | `lava-paint.js` (one paint system, the `ink-wipe.js` method): cells below LOW are not in `turfTotal`; a rise clears every inked lava cell it passes (grid, counts, and an atlas pixel read back), **including every cell of the bank wall 0.5 m outside the region's edge, up to the waterline**; a splat on the crust while it's under lava claims nothing and draws nothing (pixel read); a splat across the waterline inks only above it; three simulated screens (painter, receiver 0.3 s ahead, receiver 0.3 s behind), replaying 400 splats with their `et` through a rise and a fall, end with identical grids. A death picture from the splat cam. |
| 6 | **Looks**: level-shader chunks (H8), prop patch, lava surface, embers, cascades, gauges, steam, the colour rules. | `lava-look.js`: pictures at LOW, warn-rise, mid-rise, HIGH and mid-fall, for each of the 5 team palettes and the colour-blind one, from four cameras (the stain line on walls, ink beside the lava). It also measures the mean hue, value and coverage of the lava's bright pixels against each palette's inks (§7, R1 targets) and draw calls / triangles from `renderer.info`. Non-lava stages' level program key is unchanged. |
| 7 | **Nav**: `buildNav` (two builds, merge, `steps` links, kinds, wet = 0 on riders, gap cuts, exits; no leap edges), windows (H4), nav layer. | `lava-nav.js`: every Organ column and float has nodes at each pose, every stone at its HIGH pose; **with the bounds as given and shifted by 0.25 m and 0.5 m in x and in z, the full climb island → A → B → L exists at both poses and the full chain head → five stones → head exists at HIGH, by the `steps` links**; a link removed from the data makes `buildNav` throw; rider nodes have `wet` 0; the Organ cluster's LOW and HIGH nodes are distinct; on 200 random node pairs, path costs in the merged graph with the lava held at LOW equal a fresh `NavGraph` built with the riders at LOW (±1 %), and likewise at HIGH; no edge crosses a gap > 0.3 m and every 0.25 m stone seam and 0.20 m column seam keeps its walk edge; no leap edge exists; a route across the flank shelf is refused when it would drown before arrival and taken when it would not; routes use the stone path only at HIGH; `nearest()` never returns a hard-shut rider node; a path from a drowning node exits by the shortest way; A* time on 200 stage-crossing routes is within 10 % of the same without lava. |
| 8 | **Bots**: H5, `lava.bot`, H6. | `lava-bots.js`: 50 scripted crossings of the stone path at random times: 0 lava deaths, and none started outside the stones' window; a charger bot reaches the lookout at HIGH and leaves it as the fall begins, 20 of 20; a bot fighting on the flank shelf at warn-rise is off it before it drowns in 20 of 20 trials; a bot on a stone at the fall warning is off it before it sinks in 20 of 20; bots never walk off a descending column onto lava. Mac mini: 12 Turf War, 6 Zone Control and 6 Tower Command matches on `lavabox`, then the stage. Targets: ≤ 0.25 lava deaths per bot per 3:00, stuck % ≤ the stage average, the Slumps crossed (shelf or stones) ≥ 4 times per match, a lookout used by a long-range bot ≥ once per match. |
| 9 | **HUD, minimap, audio**: gauge, callouts (H11, H12), flood colour (H13), minimap (H14), the sounds. | `lava-hud.js`: the gauge's fill matches e within 2 %; countdown digits at warn − 10 … −1; callouts appear on the events (DOM); the splat card says "Burned in the lava"; the minimap's lava pixels track L (a pixel hash at LOW, HIGH and mid-rise differs). Audio presence in `sfx-cues.js`'s style, run alone. |
| 10 | **Online**: H10 and NET.md / EVENTS.md (D1). | `net-lava.cjs` (below), plus `node tools/net-test.mjs --net "netlag=150&netjitter=50"` with a skew report. |
| 11 | **Every mode**: zones, tower, Bazookarp hooks (events, `reach`, `closedNow`, `restMask`), Practice, menu backdrop, Boss `'low'` (H21), `env.sea: false` (H22), `art.lava` (T2). | `lava-modes.js`: zone cells and the tower track never touch lava at any phase; Zone Control overtime holds; a Practice session loops; the menu backdrop loops; in Boss the lava never moves, the Organs are in `level.dyn` before `BossNav` builds and the boss never enters a column's footprint; with `sea: false` no Sea mesh is drawn and a fall still splats at −1.45; the stage art renders at HIGH. Mac mini Zone Control / Tower Command matches as in step 8. |
| 12 | **The stage audit** (when `caldera` exists): rules marked (A). | `lava-audit.js` on `caldera`: sealed pits, exit distances (Highmark paper: ≤ 10.0 m), rider reachability and strandedness over the links (rules 23, 46), no leap gaps, the rule-41 swap in the same bay, lookout exposure, Bazookarp reach, props in the region, rule 42's views, rule 43's edges, rule 44's gaps (with the dash-reach audit at LOW and HIGH), rule 45's region inset (every face within 0.6 m of the region's edge), and a HIGH picture of every boundary wall with its rind. `spawn-mid.js`, `cover-map.js`, `stage-audit.js`, `size-budget.js` with `LAVA=low` and `LAVA=high`. |
| 13 | **Regressions** | `world-build.js`, `movers.js`, `pods.js`, `treehills-pods.js`, `ink-wipe.js`, `surf-movers.js`, `bot-climb.js`, `stage-audit.js` on halyard / calamari / treehills; `net-practice.cjs`, `net-stageclock.cjs`, `net-turf.cjs`, `net-surf.cjs`; `node build/check-maps.mjs` (all stages). |

**`net-lava.cjs`** (`CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`; both
clients install `lavabox` before `start()`):
1. A 1:30 Turf War with bots (Highmark's schedule: rise at 30, fall at 55). Each client samples L every 0.5 s; the two agree within 0.1 m
   throughout.
2. The guest stands on the crust and waits. It splats with cause `lava` on both screens, and the host's feed shows it.
3. The guest plants a sprinkler on the crust before the rise. It is gone on both screens after the lava covers it.
4. The guest paints across the waterline from rise − 2 s to HIGH + 2 s, and again through the fall. After 2 s of
   settling, `exportGrid` limited to the lava cells is identical on both screens.
5. The host's final counts show on both results screens.
6. A second run: the host leaves at 35 s. The new host's fall starts at 55 ± 0.4 s on its screen, and the stones turn
   deadly (the ledges dry) at 61.2 ± 0.4 s on both remaining screens.
7. Practice: a third client joins mid-HIGH. Its L matches within 0.1 m within 2 s of its first tick, its
   `importGrid` succeeds, and its lava cells match the host's grid.

---

## 7. Risks and unknowns (and how to find out)

1. **Lava against ink: orange next to orange, and lava that must still look molten.** Tangerine `#ff8a14` and cherry
   `#ff4150` sit close to a lava glow, but a lake that is mostly black reads as tar by day (the advocate's review of
   revision 1: "a dull, black lake and a grey stage by day").
   - *Plan (the `'ember'` crust preset, Highmark's):*
     - At rest the crust is **warm charcoal-maroon** (`#3b1f1a` … `#4a2219`, value 0.18–0.25, never under 0.15) broken
       by a net of lit seams covering **≥ 35 %** of the lake's pixels away from the shore (≤ 55 % moving); smoke wisps
       and heat shimmer on.
     - Seam hue runs crimson `#a3121a` → scarlet → white-hot, through orange only in a thin band.
     - It is matte, while ink is glossy.
     - The glow it throws onto rock is multiplied by (1 − 0.8 × ink coverage), so ink keeps its own hue.
     - Only white-hot cores exceed the 2.4 HDR bloom threshold.
     - **Full orange-gold is spent only where no ink can be**: the cascades (lavafalls), the backdrop's mountain channel
       and the Bellows Vent (`#ff8a1e` … `#ffc84a`).
   - *Find out:* step 6 pictures per palette, plus the hue / value report and the lit-seam share; the stage's day picture
     from each spawn beside Halyard's ("is this obviously molten lava?"). Then the lead and the user look at them.
   - *Fix:* shift the seam ramp redder or the crust darker per palette (never below value 0.15). Per palette (Highmark's
     request): when either team's ink is orange or red (Tangerine, Cherry, the colour-blind Sun), drop the orange band
     entirely (crimson straight to white-gold).
2. **Bots on the Organ stairs and the Pumice Race** (replaces the draft's "bots and leaps": there are no leaps). The
   Organ hops are 1.15 m jump edges (inside nav.js's 1.25 m) onto 2.6–4.3 m-deep hex tops moving at ≤ 0.35 m/s; a bot
   that jumps as a column starts to rise lands a few centimetres lower than planned (inside the stick). A bot on a stone
   when the shelf dries dies. The step links remove the grid-offset risk (rule 46), not the execution risk.
   - *Find out:* step 8's climbing and stone tests and the Mac mini lava-death rate.
   - *Fix:* widen `poseTol` for columns (0.3 → 0.5 m, they never vanish) and start stone windows closing 1 s earlier.
3. **Ink convergence online.** The gate depends on the painter's time (field 15). Clock skew over 0.5 s, or a lost
   record, could leave a cell different on two screens.
   - *Find out:* `net-lava.cjs` step 4 under `netlag=150&netjitter=50`.
   - *Fix:* the host's count already decides the result. If visible drift shows, a slow host-driven `lava cells` resync
     (`exportGrid` of the lava cells, every 10 s at HIGH rest, ≈ 1–3 KB).
4. **Shader limits on weak GPUs.** The level shader already uses about 300 uniform vectors and 7+ samplers (`uPaint`,
   `uMural`, `uLight`, `uGhost`, `tAlbedo`, `tNormal`, `tOrm`, plus three's). The lava adds one sampler and two vec4.
   The paint shader adds one sampler.
   - *Find out:* compile the web build on an Intel / ANGLE laptop and read `renderer.capabilities`.
   - *Fix:* pack the region mask into the lightmap's spare channel, or test the region by polygon in the vertex shader.
5. **GTAO and bloom at the lava edge.** The opaque lava surface writes depth. GTAO may darken its glowing shore, and
   bloom may haze it.
   - *Find out:* step 6 pictures at high and ultra.
   - *Fix:* keep the surface out of the GTAO pass with the `aoGate` pattern (`environment.js`), and lower the crack
     HDR.
6. **The sea under the lava.** Highmark's LOW is −0.6, well above the sea plane, and `env.sea: false` (H22) removes the
   Sea mesh anyway. The lava material keeps `polygonOffset` (−2, −2) and draws at max(L, −1.56) for any later stage
   that keeps its sea and a LOW near −1.6.
   - *Risk that replaces it:* with no sea, any view out of the arena that the backdrop doesn't cover shows void (rule 42).
   - *Find out:* step 2 pictures at LOW from low angles; the stage's side and aerial pictures through both notches.
7. **Dynamic-block cost in a real match.** §1.3 is per query, without prop colliders. The real number of queries per
   frame is unknown.
   - *Find out:* `shoot.cjs` `cpuRender` and the sim cost in a `match.cjs` run on `lavabox`, with 40 rider parts against 0.
   - *Fix:* fewer riders (merge a stone path's stones into fewer blocks), or a coarse grid for `level.dyn`.
8. **Riders and frame hitches.** A 100 ms hitch moves a float 5 cm, inside the ground stick. A stage-clock snap (over
   1.5 s) can move it metres.
   - *Plan:* on `lava:set`, riders on a snapped rider are re-seated on its top, and any whose floor went under are
     escape-shoved (§4.2).
   - *Find out:* `lava-riders.js` with a forced `debugT` jump of ±3 s.
9. **Merge conflicts.** `paint.js`, `netmatch.js` (`_sendTick`'s clock line, `recSplat` field 15), `levelMaterial.js`,
   `main.js` `_buildWorldNow`, `match.js`, `hud.js` and `minimap.js` are also edited by `bluestone` (eras), `aquarium`
   (pipes) and the Bazookarp engine.
   - *Mitigate:* land one shared "stage gimmick" integration commit first: `m.stageClockT()` (movers ?? pods ?? eras ??
     lava ?? pipes), the field-15 painter time with `opts.et` read by both eras and lava, and `paint.clearCells` /
     `drawInto` (bluestone's `clearFaces` can be built on them). Then the per-gimmick hooks.
10. **Overtime arriving late on a follower.** Follower overtime flags come from host records ≤ 0.3 s late.
    - *Plan:* rule 5 keeps any move away from regulation's end, and 'hold' finishes a running move, so every screen
      holds at the same level.
    - *Find out:* `lava-modes.js` with overtime forced at random times, plus `net-lava` with a zones match.
11. **Readability for a first-timer.** Will a new player read the stain line as "this will flood"?
    - *Find out:* a 60 s capture of warn → rise → HIGH → fall for the lead and the user, then the user plays it.
    - *Tune:* stain pulse strength, callout wording, gauge size, rumble level.
12. **Long-term debt.** The game now has two liquids with separate code paths (48 `waterY` reads plus `under()`).
    *After this batch:* a `liquids` API (option D) that both the sea and the lava register with. Not now: too many
    files shared with other builders.
13. **The `deploy` package's API.** Settled: wave 1's `G.deploy.crushIn(shape, how)` with `{ where }` and
    `how: 'lava'` (subs SPEC revision 3 §0.3) is the device sweep (H17); `destroyWhere` is not built.
    - *Find out:* read its diff before step 3; if `crushIn` is late, a temporary local sweep with the same signature
      stands in and is deleted when it lands.
14. **Fairness per mode.** Does flooding swing Turf War (about 10 % of Highmark's floor drowns, burned twice in a 3:00
    match)? Do the Race or the lookouts favour a side? Is the own-rim flank (89–97 m) used at all?
    - *Find out:* Mac mini sweeps comparing turf at time-up, win rates by side and knockouts, at Highmark's schedule and
      at variants (HIGH 25 → 35 s; the 3:00 Turf War with one surge `moves: [50, 110]`).
    - *Tune:* the schedule only (it is data), never geometry, first.
15. **Crescent symmetry.** A single horseshoe is not 180°-symmetric. Highmark is two crescents in a pinwheel; its
    region is a self-symmetric lake plus four bays that come in 180° pairs (rule 8 holds by construction).
16. **The whole ledge floor drowns in one instant.** All of Highmark's ledges sit at 0, so about 9,200 paint cells
    cross the burn front within a frame or two of L = −0.15. The burn is capped at 6,000 cells a frame (§4.1); the
    GPU clear is one draw regardless.
    - *Find out:* `lava-paint.js` frame times on the stage with every ledge inked.
17. **Hex riders' shared paint.** Three dynamic blocks pointing at one `BoxPaint` is new: `Actor._surface` and the
    splat forwarders must not count a hit twice where the boxes overlap.
    - *Find out:* step 4's join test (pixel read), and swimming across a join keeps the swim state.

---

## Review log (revision 2)

The engine-side items of the two reviews of revision 1 (DESIGN.md's Review log has every item; the ids match it).

| # | issue | what changed here |
|---|---|---|
| A3 | At LOW the volcano barely showed; the lava at rest ≥ 65 % near-black | LOW −0.6 (§3.3); the `'ember'` crust preset: warm charcoal-maroon, ≥ 35 % lit seams at rest, smoke and shimmer, full orange only on the cascades, the mountain channel and the Vent (§7 R1, rule 39); drifting pumice (`flotsam`, §3.2). |
| A4 | The floating rocks were a second centre lane | The stones are a sink-stone path in each Slump bay beside the drowning shelf (rule 41 now requires the same bay); turned boxes with `yaw`, irregular meshes (§2, §3.3). |
| A5 | The lookouts barely rose | Poses 1.4 → 2.35, 1.8 → 3.5, 2.3 → 4.65; `inLake` riders and rule 15's new clause; speeds re-checked (§3.3). |
| A6 | Stain line and burn undefined on walls on the outline | The region is drawn 0.5 m inside every bank (rule 45, §4.1); a boundary-wall burn test (§6 step 5) and rind pictures (step 12). |
| A15 | API mismatch with the subs spec | `G.level.liquidY` (H23); the device sweep is `G.deploy.crushIn({ where }, 'lava')` (H17); the dash-reach audit is rule 44. |
| A16 | The rind on the Organ columns was ill-defined | Riders get no rind; `patchStain` skips rider meshes (§4.1, §3.2). |
| E2 | The Organ climb existed by luck of the nav grid | Explicit `steps` links, wet cost 0 on rider nodes (§4.3 steps 5a–5b, rule 46); `lava-nav.js` rebuilds with the bounds shifted 0.25 m and 0.5 m (§6 step 7). |
| E6 | Falls off edges reported the sea | `falls` polygons and H3 (d); rule 43; `lava-rules.js` drops a kid off every edge segment (§6 step 3). |
| E9 | Hex side paint backwards | The boxes' **short** faces carry the side paint (§4.1). |
| E9 | Practice and menu schedules not found | `lavaSchedule(def, mode, duration, flags)` and H24 (§3.3). |
| E9 | Rule 3 failed the stage's own practice and attract entries | Rule 3 exempts them (§5). |
| E9 | H19 was optional | Mandatory for kits that roll or walk along floors or deal damage (H19). |
| E9 | "Never neither" was not exact; the ease broke rule 17 | Sink stones run a 2.4 s linear ease timed to the kill height on both moves: solid exactly while the ledges are deadly, ≤ 0.585 m/s (§3.1, §4.2, rule 17, rule 41). |
| E9 | Wet costs made the Race crossing target unlikely | Rider nodes and link ends pay no wet cost (§4.3 step 5b); the target now counts both Slump crossings (§6 step 8). |
| — | Bazookarp's field needs per-state standability (SPEC §5.5) | `restMask(level)` (§3.2); the field switches at `lava:warn` (§4.3). |
