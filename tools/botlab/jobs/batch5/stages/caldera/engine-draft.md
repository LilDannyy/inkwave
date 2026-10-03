# Caldera: the lava engine (a liquid that rises and falls, and the things that ride it)

Engine design for the `caldera` stage gimmick. Paper design, 2026-10-04. Nothing here is built yet. Every file, function
and line number below was read in `/Users/danielosling/Desktop/1/st-b5-design`. The numbers in §1.3 were measured
with read-only Node runs of the real `Level`, `Physics` and `NavGraph`.

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
arrival time. Ink is **burned** off ground as the lava rises over it, and nothing can be inked under lava. The rule is exact online because splat records
carry the painter's stage-clock time. A world-space band in the level shader draws the stain line at the high mark,
the heat glow and the warning pulse. The work lives in one new module family, `src/game/lava.js` + `src/fx/lavaFx.js` +
`src/audio/sfx-lava.js` (the `sp-surf` / `surfFx` / `sfx-surf` pattern), plus about 20 short hook-ins tagged
`[b5-lava]`.

The contract has ranges, not one stage's numbers. All three caldera concepts written beside this file can be built
from it:
- `concept-play.md` is the worked example in §3.3: EBB −1.6, FLOOD +0.8, 10 s warnings and moves, pumice stones with
  0.5–1.0 m gaps, lookout floats in berths.
- `concept-gimmick.md` needs a lava range of only 1.3 m (−1.6 → −0.3), stones that surface only at high, rising steps
  that travel just 1.0–1.6 m, and lookouts with inkable sides.
- `concept-place.md` needs linear moves (a steady 0.3125 m/s), 5 × 5 m lifts with 0.9 m bulwarks (several blocks moving
  as one), and pumice stones in a fenced slot.

One reading is overridden. Lava kills at L + 0.15, the same as the sea (concept-place reads it as 0.05 m below the
surface).

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
| `src/game/actor.js` `_resolve` (grounded branch: `groundProbe(… up = stepUp 0.35, down = stepDown 0.45 …)`) | A grounded kid is snapped to a support that moved by less than 0.35 m up or 0.45 m down this frame. A block moving vertically therefore carries whoever stands on it, with no carry code. Pods already rely on this ("anyone on top is lowered with it", `pods.js` header). At 0.36 m/s and dt 0.1 s the step is 3.6 cm. |
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
| `actor.js` `update()` sea check: `pos.y < fallDeathY && groundHeight(...) === -Infinity` | Below −1.45 with no floor means the sea. | With LOW = −1.6 (concept-play's EBB) the sea check would fire first and say "Fell in the sea" in a lava lake. The lava check runs first, and inside the region its kill height (L + 0.15 ≥ −1.45) always wins (H3). |
| `actor.js` body-special branch (`_updateSpecial` → `G.specials.body`), slam / storm in `_updateSpecial` | Only `specials.body` checks the sea. Slam and storm do not. | One lava check after `_updateSpecial` covers every special (H3). |
| `level.js` `addDynamic`: forces `paint: false, hidden: true` | Dynamic blocks are never inked or drawn. | Riders draw their own mesh (`lavaFx`). A float's deck takes ink through `BoxPaint`. A stone is bare crust, like a perch. |
| `level.js` `queryBlocks`: every query scans all of `this.dyn` linearly | A few moving blocks. | Measured cost in §1.3. Rider parts are capped at 40 (§5 R30). A submerged rider is parked out of every query (moved 50 m down, `solid = false`). |
| `nav.js` `NavGraph._build`: built once from what is solid when `main._buildWorldNow` calls it; `blocked` is soft (+40) | Static geometry. Movers only ever block. | Rider tops need nodes, and a rider top that isn't there must be hard-closed. The graph is built at both rider poses and merged (H1, `LavaWorld.buildNav`), and `path()` gets time windows (H4). |
| `nav.js` edges join neighbouring 1 m cells by height difference and a waist-height ray (`_blocked`). They never check that there is floor between the cells. | No gaps narrower than a cell. | Two nodes on either side of a 0.5–1.0 m lava gap (concept-play's stones) get a `walk` edge, and a bot walks into the lava. `buildNav` removes every edge that crosses a gap over 0.3 m inside the region, and adds `leap` edges where a bot can jump it (§4.3). |
| `bots.js` `_wet`, `_avoidWater`, `_squidWouldDrop`, `_edgeGuard` (via `_wet`) | "Wet" means no floor under the point (`groundHeight === -Infinity`). | Over the void lake this already works. Over a drowned floor the floor is still there, so bots would stroll into lava on a flank. A one-line `covers()` test fixes each (H5). |
| `paint.js` `_initGrid`: `live`, `dead`, `turfTotal` fixed at load; `splat()` inks any face it reaches | Faces are always exposed. | Cells always under LOW would count as turf nobody can ink. The module retires them (H7 `retireCells`). Splats must not ink under the current lava (H7 gate), and ink must burn as the lava covers it (H7 `clearCells` / `drawInto`). |
| `netmatch.js` `_sendTick`: the Practice stage clock comes only from `movers` or `pods` | A stage with a clock has movers or pods. | A stage with only lava would send no clock in Practice (H10). |
| `cameraRig.js` lens lift: `groundHeight(cam.position…)`, line 389 | The lowest thing under the lens is floor or sea. | The lens could dip under the lava surface over the lake. One `max` with the lava surface fixes it (H9). |
| `main.js` `_footprint(level)`: blocks with a top ≤ 0.01 and bottom < −1 are "deck slabs" for the sea (pilings, foam) | Low floors are piers over the sea. | Crust floors at 0 reaching down below −1 would grow pilings through the lava. The stage sets `env.edge: 'none'` (§5 R37). Sea foam drawn under the lava is hidden. |
| Prop materials (`PropKit._makeMaterials`: `paint`, `gloss`, `metal`, `wood`, `rubber` …) | Static looks. | The stain must appear on props below the high mark too. `LavaWorld.patchProps` chains an `onBeforeCompile` onto five kit materials when the stage has lava. No change to `props.js`. |
| `bossNav.js` `_build`: a cell is a drop where the ground is more than 0.55 m below the main floor | — | The void lake is a drop: the boss will not walk into it. A drowning crust floor at the main floor height would be walkable. Boss Battle runs with the lava held at LOW or is not offered (§4.6). |

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
| **Ink under lava** | burn · keep hidden and counted · keep hidden, not counted | **Burn.** Ink is cleared as the lava covers it (steam puffs in that ink's colour). Nothing can be inked under lava, and revealed ground is blank. That reads naturally ("the lava scorched it"), and concept-play makes it the final-minute painting race. Hidden-but-counted is invisible turf. Hidden-not-counted needs liveness flips and brings old ink back as if it survived lava. |
| **Floating rocks** | gap-free rafts only · stepping stones with gaps | **Both.** Seams ≤ 0.3 m are walkable with no special code. Gaps of 0.3–1.6 m get `leap` nav edges and a bot jump routine (§4.3). Concept-play's 0.5–1.0 m stones need it. If the bot leap test fails its bar (§6 step 8), the fallback is seams only. |
| **Reaching a risen platform** | walk / hop from adjacent ground · climb its inked side · ride only | **Walk or hop, ≤ 1.25 m up for bots (nav.js jump edges), at the pose where it is used.** Bots' climb code checks ink on static faces only (`bots._inkAt` reads `h.face`), so a hop route is always required. A float may also take ink on its sides (`ink: 'all'`, concept-gimmick's Organs) for humans to swim up: `Actor._wallInk` already reads a dynamic block's `BoxPaint`. Ride-only lookouts are unreachable high ground for whoever is late, so they are banned. |
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
  up). A rider is one box by default, or `parts` (a deck plus bulwarks, a hex as up to three turned boxes).
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
  leapMin: 0.3, leapMax: 1.6,   // m: gaps bots jump (narrower: a walkable seam; wider: humans only)
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
  riders                                // defs with twins: { id, kind: 'stone'|'float', x, z, yaw, top0, top1, ink,
                                        // sink?, single, parts: [{ x, z, hx, hz, yaw, y0, y1, ink }] (y from its top) }
  inRegion(x, z)                        // mask lookup (outside the box: false)
  attachPaint(paint)                    // faces with cells in the region below HIGH get f.lava = 1; cells below LOW are
                                        // retired (paint.retireCells); the lava cells sorted by height for the burn front
  patchProps(kit)                       // the stain chunk into kit.mat.{paint, gloss, metal, wood, rubber}
  buildNav(level, physics) → NavGraph   // two builds (riders at their LOW pose, then at their HIGH pose), merged (§4.3);
                                        // then kinds, gap cuts, leap edges, exits
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
  surfaceAt(x, z)                       // y inside the region, −Infinity outside
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
  closedNow(id)                         // shut at this moment (Bazookarp's Carp Field rebuilds)
  bot(b, dt, it, move, vis)             // bots.js: escape a drowning floor, get off a rider before it goes; null
  steerLeap(b, edge, out)               // bots.js _steer: run-up speed and take-off for a leap edge
  drawMap(ctx, minimap)                 // minimap live layer
  hud()                                 // { e, dir, phase, inS, warn } for the gauge
  state()                               // test snapshot (§6)
  hold(phase) / debugT(t)               // audits (?lava=low|high|rise|fall) and tests
  dispose()
}
```

**`src/fx/lavaFx.js`** (looks; about 700 lines):
- `LAVA_GLSL = { pars, base, emissive, line }`: level-shader chunks.
- `patchStain(mat, uniforms)`: the same chunk for prop materials.
- `class LavaLook`: the surface mesh, embers, rider meshes (instanced stones, float hulls, deck ink overlays), gauge
  needles, cascades, burn steam, sizzles.
- Heat shimmer: there is no refraction pass to bend the scene behind the lava. ScreenFX's existing swim wobble is
  reused instead, scaled by `uHeat` (0–1). `uHeat` is set from how close the camera is to the surface (within 6 m)
  and is doubled while the lava moves. Quality ≥ high only, off with reduced motion (H13).
- `lavaGauge(hud)`: the HUD chip.

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

### 3.3 What a stage layout gives it (exact format)

All heights are metres, all times are seconds of play. Rider and region items accept `onlyIn` / `notIn`
(`variants.js`). Worked example: concept-play's numbers for Charr Caldera.

```js
// src/world/stages/caldera/layout.js   (stays importable in Node: plain data and plain helpers only)
const ellipse = (rx, rz, n = 32) => Array.from({ length: n }, (_, i) => [rx * Math.cos((i / n) * 2 * Math.PI), rz * Math.sin((i / n) * 2 * Math.PI)]);

export const LAVA = {
  low: -1.6,                 // the surface at rest, low (EBB). Range −1.6 … 0.0
  high: 0.8,                 // the surface at rest, high (FLOOD) = the stain line. HIGH − LOW: 1.8 … 3.0
  region: {                  // where lava exists: xz outlines (any convex or concave simple polygons)
    polys: [ellipse(18.4, 40.4)],                          // used as given: must be 180°-symmetric as a set
    half: [                                                // Alpha's (z < 0); each gets its 180° twin
      [[-30, -14], [-16, -14], [-16, -6], [-30, -6]],      //   the west breach (spillway ford)
      [[-21.5, -44], [-15, -44], [-15, -16], [-21.5, -16]],//   the short horn's strand
    ],
  },
  timing: { warn: 10, rise: 10, fall: 10, ease: 'smooth' }, // warn 6–10 s; rise / fall 6–12 s; ease 'smooth' | 'linear'
  schedule: {                // per match: key `${mode}:${duration}` first, then `${mode}`; a string = "same as that key"
    'turf:180': { moves: [50, 110] },                      // the stage times moves START: rise, fall, rise, …
    'turf:90':  { moves: [25, 50] },
    zones:      { loop: { first: 30, high: 40, low: 30 }, overtime: 'hold' },   // rise at 30, hold 40, fall, hold 30, …
    tower: 'zones', bazookarp: 'zones',
    practice:   { loop: { first: 20, high: 40, low: 30 } },
    attract:    { loop: { first: 10, high: 15, low: 15 } },
    boss: 'off',             // 'off': no StageLava (rest at LOW, riders at their LOW pose) · 'low' | 'high': held there
  },
  mirror: true,              // riders, gauges, cascades, vents: each gets its 180° twin (x, z) → (−x, −z), yaw + π
  riders: [
    // stones: bare tops (pumice), riding the lava at L + 0.6: −1.0 at EBB (a 1 m foxhole in the crust), 1.4 at FLOOD
    { id: 'shore1', kind: 'stone', pos: [12.2, -27.4], size: [1.8, 1.8], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'shore2', kind: 'stone', pos: [11.9, -25.0], size: [1.8, 1.8], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'isle1',  kind: 'stone', pos: [5.6, -12.8],  size: [2.0, 2.0], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'isle2',  kind: 'stone', pos: [5.8, -15.6],  size: [2.0, 2.0], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'isle3',  kind: 'stone', pos: [6.0, -18.4],  size: [2.0, 2.0], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'rim1',   kind: 'stone', pos: [-13, -22],    size: [2.0, 2.0], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'rim2',   kind: 'stone', pos: [-10, -22],    size: [2.0, 2.0], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'cross1', kind: 'stone', pos: [1.97, -23],   size: [1.8, 1.8], top: [-1.0, 1.4], depth: 1.4 },
    { id: 'cross2', kind: 'stone', pos: [-0.46, -23],  size: [1.8, 1.8], top: [-1.0, 1.4], depth: 1.4 },
    // a float: an inkable steel deck in a berth cut into the plaza corner: flush (1.3) at EBB, a lookout (3.7) at FLOOD
    { id: 'floatA', kind: 'float', pos: [-9.8, -6], size: [4.4, 4.4], top: [1.3, 3.7], depth: 3.4,
      look: { type: 'caldera_float', piles: [[-12.6, -6], [-7.0, -6]] } },
  ],
  // optional: a stone that sinks out of sight while L is below `sink` (it surfaces as the lava passes it on a rise)
  //   { id, kind: 'stone', …, top: [-1.3, 1.15], sink: 0.0 }
  // optional: a rider of several parts (concept-place's Ladle Lift: a 5 × 5 m deck with a 0.9 m bulwark on two sides).
  //   Parts are in the rider's frame (x across, z along its yaw), y measured from its top; `ink` per part
  //   { id: 'ladle', kind: 'float', pos: [16.5, -3.5], top: [1.3, 3.8], ink: 'deck', parts: [
  //       { x: 0, z: 0, w: 5.0, d: 5.0, y0: -3.6, y1: 0 },                 // the pontoon (its top is the deck)
  //       { x: 0, z: -2.25, w: 5.0, d: 0.5, y0: 0, y1: 0.9, ink: false },  // south bulwark
  //       { x: 2.25, z: 0.25, w: 0.5, d: 4.5, y0: 0, y1: 0.9, ink: false } ] }   // east bulwark
  gauges: [                  // needles / markers the module drives (the dial faces and boards are the stage's own props)
    { kind: 'dial', pos: [0, 12, -2.05], yaw: Math.PI, r: 1.8, single: true }, // the derrick dial: the face toward Alpha (−z)
    { kind: 'dial', pos: [0, 12, 2.05], yaw: 0, r: 1.8, single: true },        //   and the face toward Bravo (+z)
    { kind: 'bar', pos: [6, 5.2, -61.6], yaw: Math.PI, h: 2.4 },            // the Overlook's LAVA LEVEL board
  ],
  cascades: [                // lavafalls shown while L is over their lip: the breach overtopping at FLOOD
    { lip: [[-30, -13.6], [-30, -6.4]], y: 0.0, drop: 9 },
  ],
  vents: [[12.2, -0.5, -27.4], [-11.5, 0, -24]],           // steam / sparks during warnings, bubbling loops (≤ 6 per half)
  look: { crust: 'basalt', cone: [0, 46, 140] },           // crust preset; the backdrop cone that puffs at each rise
};
// in LAYOUT: lava: LAVA, env: { …, edge: 'none', boats: false, bay: false }
```

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
`warn` is true during the `warn` seconds before each move. Concept-play's tables come out as:

| Mode | Duration | Rises start at | Falls start at | Time-up state | Overtime |
|---|---|---|---|---|---|
| Turf War 3:00 | 180 | 50 | 110 | LOW since 120 (60 s) | — |
| Turf War 1:30 | 90 | 25 | 50 | LOW since 60 (30 s) | — |
| Zone Control, Tower Command, Bazookarp 5:00 | 300 | 30, 120, 210 | 80, 170, 260 | LOW since 270 | LOW, held |
| Practice | ∞ | 20, then every 90 | 70, then every 90 | — | — |
| Menu backdrop | ∞ | 10, then every 50 | 35, then every 50 | — | — |
| Boss Battle | — | — | — | not offered (`'off'`) | — |

**Per-match lookup.** `lavaSchedule(def, mode, duration)` tries `schedule[mode + ':' + duration]`, then
`schedule[mode]`, then `schedule.turf`. A schedule naming another key is resolved once. A missing entry for a new mode
(say a future one) uses Zone Control's loop, and the console warns once.

**Debug.** `?lava=low|high|rise|fall` holds the lava there for audits (`spawn-mid.js`, `cover-map.js`, `shoot.cjs`,
`stageart.cjs` take `LAVA=…` and append it).

### 3.4 Timeline of one rise (concept-play, the 3:00 Turf War's rise at t = 50)

| Stage clock | What happens (each screen from its own clock) |
|---|---|
| 40.0 (warn) | `lava:warn` `{ to: 'high', at: 50, inS: 10 }`. HUD callout "LAVA RISING" (sub "Low ground floods in 10"); the gauge's ▲ blinks and counts down. `lava_rumble` swells, the cone in the backdrop starts to smoke, and vents spit sparks. The stain line pulses red on every surface. The minimap hatches everything below HIGH. The bots' nav layer marks floor nodes the lava reaches by t + 8 s. |
| 47–49 | `lava_tick` at 3, 2, 1. The surface agitates: cracks widen, bubbles pop. |
| **50.0** | **The rise starts.** `lava:move` `{ dir: 1, from: −1.6, to: 0.8, dur: 10 }`. `lava_erupt`; the cone in the backdrop erupts (ash plume), camera shake 0.25 (settings permitting). Embers stream upward. A glow band climbs the walls with the surface. Stones and floats start to rise. |
| 53.3 | L = −1.0: lava wells up the stone pits. |
| 56.1 | L = 0: the crust floods (sheeting outward from the dished vent rows, which sit lower). Ink on it burns: steam in that ink's colour. Anyone still on it splats as L passes their feet − 0.15. |
| **60.0** | **HIGH.** `lava:rest` `{ level: 'high', y: 0.8 }`. Floats lock (`lava_lock`). The stone paths and the lookouts are in play. The rumble settles. |
| 100.0 | Fall warning: "LAVA FALLING" (sub "Stones sink, get off"). Floats' strobes flash. |
| 110.0 | The fall starts (`lava_hiss`, `lava_drain`). The surface crusts over and darkens. A hot band glows on the walls just above the falling surface, so it reads as descending. |
| 113.9 / 115.6 | The crust breaks the surface (blank, scorched). The stones drop back below the crust into their pits. |
| 120.0 | LOW. `lava:rest` `{ level: 'low' }`. Callout "LOW GROUND OPEN". |

### 3.5 Hook-ins in shared files (each short and tagged `[b5-lava]`)

| # | File, function | Change |
|---|---|---|
| H1 | `src/main.js` `_buildWorldNow` (lines 258–309) | (1) At the top: `G.lavaWorld?.dispose(); G.lavaWorld = null;`. (2) After `const level = (G.level = new Level(layout, colliders));`: `G.lavaWorld = LavaWorld.create(layout, level); G.lavaWorld?.patchProps(this.props);` (the props are already built above). (3) After `G.paint = new PaintSystem(…)`: `G.lavaWorld?.attachPaint(G.paint);`. (4) Both `createLevelMaterial` calls get `lava: G.lavaWorld` in their opts. (5) The nav: `G.nav = G.lavaWorld ? G.lavaWorld.buildNav(level, G.physics) : new NavGraph(level, G.physics);` (bluestone edits the same line for its eras: `G.eraWorld?.buildNav(…) ?? G.lavaWorld?.buildNav(…) ?? new NavGraph(…)`). (6) After `this.decor = …`: `G.lavaWorld?.buildLook(scene);`. About 8 lines. |
| H2 | `src/game/match.js` `setup()`, `_setupRoster()`, `update()`, `dispose()` | Both setup paths: `this.lava = StageLava.create(this);` before `this.movers = …`. `update()`: `this.lava?.update(dt);` before `this.movers?.update(dt)` (the lava moves its riders before anyone moves, as the tower does). `dispose()`: `this.lava?.dispose(); this.lava = null;`. |
| H3 | `src/game/actor.js` | New method `_lavaCheck() { if (G.match?.lava?.burns(this)) { this.splat(this.lastDamage < 4 ? this.lastAttacker : null, 'lava'); return true; } return false; }`. Called (a) in `update()` immediately before "fall into the sea" (line 398): `if (this._lavaCheck()) return;`; (b) in the body-special branch (line 282): `if (spx && spx.body) { this._updateSpecial(dt); if (this.alive) this._lavaCheck(); if (this.alive) this._finishFrame(dt); return; }`. (c) In `_updateSuperJump`, after `s.dur = …` (line 840) and only when `!s.tower`: `G.match?.lava?.safeLanding(s.to, s.dur);`. |
| H4 | `src/game/nav.js` | Constructor: `this.lava = null;`. `path()`: when `this.lava` is set, keep a second array `this._tg` (metres walked without penalties, reset like `_g`). In the edge loop: `if (LW && LW.kind[e.to]) { const s = LW.shut(e.to, T0 + (tg[cur] + e.cost) * LW.sPerM); if (s === 2) continue; lx = s ? LW.soft : 0; }`, add `lx` to `ng`, and set `tg[e.to] = tg[cur] + e.cost` with `g`. `nearest()`: skip ids with `LW.kind[id] === 2 && LW.shut(id, LW.now()) === 2` (start and goal). |
| H5 | `src/game/bots.js` | `_wet(x, z, y)`: `const gh = G.level.groundHeight(x, z, y + 0.6); return gh === -Infinity \|\| !!G.match?.lava?.covers(x, z, gh, 0.5);`. `_avoidWater` `safe()` and `_squidWouldDrop`: the same `covers` test on the height they find. After the pods hook (line 1046): `if (!thrAim && G.match?.lava) thrAim = G.match.lava.bot(this, dt, it, move, enemyVisible) \|\| null;`. In `_steer` where jump edges set `_needJump` (line 3154): `else if (et === 'leap') G.match?.lava?.steerLeap(this, nav.edge(…), out);`. `_edgeGuard`: `if (this._leapT > 0) return;` (a committed leap is not stopped at the gap). |
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
| H17 | `src/game/subs.js` `_fly` (line ~420) and a new `destroyWhere(pred, why)` next to `damageArea` (line 1007) | Thrown subs: the same as H16. `destroyWhere`: own, non-ghost items whose `pos` passes `pred` → `_destroy(it)` (the owner's existing end record pops the ghosts everywhere), then `SUB_KITS[k].lavaSweep?.(pred)` for kit devices. If the `deploy` package lands a tower-crush API of this shape first, use that and skip this one. |
| H18 | `src/game/sp-surf.js` (line 254) | `\|\| G.match?.lava?.under(this.pos)` → `'lost'` (the buoy pops, its existing end path). |
| H19 | kits (one line each; optional for v1) | `torpedo.js` 344/352/421, `waddle.js` 348/546, `bow.js` 323, `boomerang.js` 413, `shaker.js` 448, `tracer.js` 306, `brolly.js` 330, `mitts.js` 235/336 (the leap preview): `\|\| G.match?.lava?.under(pos)`. Without these the items fall through the lava plane to the void and die at −1.6 as today: cosmetic only, because the paint gate (H7) never lets them ink under lava. Kit deployables (and batch 5's new turret and floating bomb) implement `lavaSweep(pred)`. |
| H20 | `build/check-maps.mjs` | A lava section with the static checks of §5 (a tool, not engine). |
| T1 | `tools/botlab/shoot.cjs`, `stageart.cjs`, `tests/spawn-mid.js`, `tests/cover-map.js` | `LAVA=low\|high\|rise\|fall` appends `?lava=…`. |
| D1 | `docs/NET.md`, `docs/EVENTS.md` | A "Lava" paragraph (no records, splat field 15, the Practice clock) and the events of §3.6. |

### 3.6 Events (the bus)

| Event | Payload | When |
|---|---|---|
| `lava:warn` | `{ to: 'high' \| 'low', at, inS }` | `warn` s before each move |
| `lava:move` | `{ dir: 1 \| -1, from, to, dur, at }` | a move starts |
| `lava:rest` | `{ level: 'high' \| 'low', y }` | a move ends (Bazookarp rebuilds its Carp Field here) |
| `lava:hold` | `{ level, why: 'overtime' }` | overtime froze the schedule |
| `lava:set` | `{ y, phase, why: 'start' \| 'clock' \| 'late' \| 'debug' }` | the state re-derived at once: match start, a stage-clock snap over 1.5 s, a Practice late joiner, `hold()` |
| `lava:rider` | `{ id, up: bool }` | a stone with `sink` surfaces or sinks; a float locks at a pose |
| `splatted` | `{ victim, attacker, cause: 'lava' }` | the existing event, new cause |

---

## 4. What it means for each system

### 4.1 The paint grid and turf counting

**At load (`attachPaint`):**
- A face is a lava face (`f.lava = 1`) if any of its cell centres is inside the region and below HIGH + 0.05.
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
- A whole flat floor crosses in one frame: about 6,400 cells for 400 m², under 0.5 ms once.

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
- The Turf War judge counts at time-up. The schedule always ends a Turf War on LOW: concept-play has 60 s of it. Freshly
  scorched ground is a painting race, as concept-play intends.
- Floats' deck ink (`BoxPaint`) never counts as turf, like the tower. Stones are never inked.
- Zone Control floods (`paint.flood`) and Practice's wipe (`startWipe`) are untouched: zones never touch lava (§5 R26).
- A late joiner's `importGrid` copies the host's grid, which already has no ink under lava. Its stamps skip the clip.

### 4.2 Colliders, physics, players, devices

- **The lake** is void: no block, no collider. The kill check is `under(pos)`: inside the region and `pos.y < L +
  0.15`. It runs on the victim owner's screen, in `actor.update` before the sea check and after every body special
  (H3). The splat is the sea's: no armour, Kraken, Bubble Guard or invulnerability exception. Remote proxies are
  judged by their owners (`netmatch` forwards `splatted` with the cause).
- **Drowned floors** stay solid static blocks. Under lava you are dead before you stand on them.
- **Riders** are dynamic blocks, one per part (`addDynamic({ tag: 'lava:' + id + ':' + part, perch: kind ===
  'stone' })`), added at the first playing frame as movers do (`_goLive`). Each frame, while L moves, every part is
  placed with `moveDynamic` relative to the rider's top `top0 + (top1 − top0) · e`. The default single part is a box
  from `top − depth` to `top`.
  - Riders carry their riders with no code: `Actor._resolve`'s stick (≤ 0.35 m up / 0.45 m down per frame) follows a
    top moving at ≤ 0.6 m/s.
  - Devices on them ride by the sp-fixes rule (`b.dp`).
  - A float's deck has `block.inkPaint = BoxPaint` (deck only, a 0.15 m bare rim). `Actor._surface` already reads it.
    With `ink: 'all'` its sides take ink too, and `Actor._updateClimb` / `_wallInk` already swim up a dynamic block's
    inked wall (the tower's). That is for humans: bots never plan a climb onto a rider (no climb edges), so rule 23's
    hop route is still required.
  - A stone with `sink`: while L is below `sink`, its top eases to L − 0.45 over 1.2 s. Once its top is 0.3 m under the
    surface it is `solid = false` and parked 50 m down (out of every query). It surfaces the same way. Nobody alive can
    be where it surfaces, because that space is lava. Anyone airborne over it lands on it.
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
- **Devices** (sprinkler, beacon, Drip Curtain, Lurk Mine, Surf N' Turf buoy, kit deployables):
  - The owner's screen sweeps its own at 4 Hz while L moves, or when a rider changes: `destroyWhere(p => under(p,
    -0.05))`.
  - They are destroyed with a sizzle, no blast, no ink. The owner's end record pops the ghosts everywhere.
  - Special fields (Ink Tempest's cloud, Drainbow's bubble, Booyah) are not devices and are untouched.

### 4.3 The nav graph and bots

**Rider nodes** (`LavaWorld.buildNav`, at world build):
1. Every rider's parts are added as dynamic blocks at the LOW pose (top0), and graph A is built: `new NavGraph(level,
   physics)`. `NavGraph._build` sees dynamic blocks through `queryBlocks`, so rider tops get ordinary nodes, edges to
   their neighbours, `_clear` headroom and `_prune` reachability. A `sink` stone is left out of this build.
2. The parts are moved to the HIGH pose (top1) and graph B is built. Its nodes standing on a rider part, and their edges
   to static nodes, are copied into A:
   - B's static nodes map to A's by (cell `ix, iz`, height within 0.15 m);
   - copied nodes get new ids after A's and go into `A.cells`;
   - then `A._prune()` re-runs for `valid` / `exitable` / `validIds`.

   Two full builds work for any travel (concept-gimmick's steps move only 1.0–1.6 m). Measured cost: one more build,
   119–143 ms on today's stages (§1.3), plus about 20 ms to merge.
3. Every node then gets a `kind`:
   - 0: unaffected.
   - 1: a floor node the lava can reach: in the region and `n.y − LAVA.navLead < HIGH`.
   - 2: a rider node, with its rider and pose.
   It precomputes per floor node its shut height `n.y − 0.35`. Per node it also finds the nearest node of kind 0 by the
   graph (`exitOf`, metres `escD`), and keeps `reach` for Bazookarp.
4. It **removes every edge that crosses a gap**: an edge whose straight line inside the region has more than 0.3 m with
   no floor within 0.5 m below. The line is sampled every 0.05 m against the rider parts at that edge's pose and the
   static blocks.
5. It **adds `leap` edges**, both ways, between nodes on facing edges across a gap:
   - the gap is 0.3–1.6 m;
   - the landing is within +0.3 / −0.8 m of the take-off height;
   - nothing is solid at 0.45 and 0.9 m on the line;
   - there is a 1.0 m straight run-up on the take-off top;
   - the landing top is at least 1.8 m deep along the jump.
   Cost: gap + 2.5. Each edge stores `gap` and the take-off point.
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
  - It uses the stone paths only when they will be up as it arrives.
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
- **Leaps** (`steerLeap`, from `_steer`):
  - The bot runs at the target node with its speed capped to `gap / 0.62 + 0.8` m/s, so it lands about 0.5 m past the
    far edge.
  - It jumps when within 0.45 m of the take-off point, grounded, not on enemy ink, and at ≥ 85 % of that speed.
  - While committed (0.9 s), `_edgeGuard` does not stop it (H5).
  - If the conditions fail for 1.5 s, it re-plans with leaps off for 4 s.
  - Its own stats count `leaps`, `leapFails` and `lavaDeaths`.
- **Edges.** `_wet`, `_avoidWater`, `_squidWouldDrop` and `_edgeGuard` refuse drowning floor (H5). A bot riding a float
  down never walks off it onto lava.
- **Lookouts.** Charge weapons already value height in `_pickPaintGoal` (`score += clamp(n.y, 0, 5) * 1.6`), so
  chargers go to a float's HIGH-pose nodes when they're open. No new goal code.
- **Not in v1:** riding a float up on purpose (a `ride` edge type), and placing devices with the schedule in mind.
  Measure first (§6 step 8); add them only if bots under-use the lookouts.

**Bazookarp** (`../../bazookarp/SPEC.md` §9.4):
- The Carp Field rebuilds on `lava:rest` and `lava:move`, using `closedNow(id)`.
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

  | When | Callout | Sub-line |
  |---|---|---|
  | warn-rise | "LAVA RISING" | "Low ground floods in N" |
  | warn-fall | "LAVA FALLING" | "Stones sink in N", or "Lookouts lower in N" |
  | rest-high | "STONE PATHS UP" | (the stage may rename it with `def.text.high`) |
  | rest-low | "LOW GROUND OPEN" | — |
  | overtime | "LAVA HOLDS" | — |

  Each is shown once per event, from the event (so identical on every screen).
- **Splat card:** "Burned in the lava" or "Knocked into the lava", with a lava-wave icon. Splat flood: deep red.
- **Minimap** (`drawMap`):
  - The region filled in lava red with a crust texture wherever the floor top is below L. This comes from a 2 px/m
    offscreen canvas, rebuilt when L crosses a 0.1 m step: at most 24 times per move, each under 1 ms.
  - During a warn-rise or rise, a pulsing red hatch over everything below HIGH.
  - Stones drawn as small dark tiles while they're up. Floats as squares with ▲ when risen.
- **World:** the stain line pulses during warnings, the gauges' needles move (`def.gauges`), and the backdrop cone
  erupts.
- **Stage select / `check-maps --svg`:** the region drawn as lava (H15).

### 4.6 The lightmap bake and stage variants per mode

- **The bake** (`bake.cjs`, `build/bake-ao.cjs`) sees only static blocks. The rider parts used for the nav builds are
  added and removed inside `_buildWorldNow` before the bake reads the level. The lava changes no static geometry, so a stage has **one
  lightmap** whatever the lava does.
- **Rider meshes** carry their own baked vertex AO. The lava's light on surfaces is the shader's glow term, not baked.
- **Mode differences** are mostly schedule only (§3.3), with no geometry and no new bake. A mode-only piece (a Tower
  Command track pier, a Bazookarp Gate approach) is an `onlyIn` / `notIn` block as on every stage and gets its own
  world and bake. Rider, region, gauge and cascade items take `onlyIn` / `notIn` too.
- **Boss Battle:** `'off'` (concept-play does not offer it), or `'low'`.
  - With `'low'` the lake is void, so `BossNav` treats it as a drop. Drowning floors are dry.
  - HULLBREAKER never meets the lava. No boss hooks.

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
- **Tolerance.** Two screens' L differ by at most the rise speed × clock skew: 0.36 m/s × 0.2 s = 7 cm. Kills, rider
  tops and the burn are each decided per screen. Ink converges exactly (§4.1). `net-lava.cjs` asserts it (§6).

### 4.8 Performance against the Halyard budget (≈ 334 draw calls / 3.0 M tris / 3.75 ms cpuRender, loadMs ≈ 6.8 s)

| Item | Steady state | During a move |
|---|---|---|
| Draw calls | Lava surface 1, embers 1, stones 1 instanced (≤ 2 variants), float hulls ≤ 2 merged + deck ink ≤ 2, gauge needles 1 instanced, cascades 1: **≤ +10**; shadow pass: floats ≤ +2 | the same |
| Triangles | surface ≤ 2 k, stones ≤ 20 × 600, floats ≤ 2 × 3 k, needles, cascades: **≤ 25 k** | the same |
| CPU per frame | clock + phase O(1); kill checks ≤ 8 own actors (one mask lookup each); `under()` per live projectile; nav layer ≤ 4 Hz × ≤ 4,000 kind-1 nodes; device sweep 4 Hz; uniforms: **≤ 0.1 ms** | `moveDynamic` × ≤ 40; burn ≤ 0.2 ms (≤ 0.5 ms the frame a whole floor drowns); minimap redraw ≤ 1 ms at most 3 times a second: **≤ 0.4 ms** |
| Dynamic-block tax on every query | ≤ 40 rider parts: about +0.12 µs per query and +0.2–1.0 µs per ray (§1.3 doubled); sunk stones parked out of it | the same |
| GPU | Lava surface ≈ 70 ALU + 5 taps per pixel on the ≤ 35 % of the screen it covers; level and prop fragments in the region +1 tap +≈ 25 ALU behind `#ifdef LAVA` | the same, plus the burn draw (one quad per lava face) |
| Load | Region mask and lava map ≤ 0.15 s (256 k samples × ≤ 0.46 µs, plus block rasterisation); `attachPaint` ≤ 30 ms; nav: a second build and the merge, +140–180 ms; shader programs +3 (level-lava, grate-lava, lava surface) and +5 patched prop programs ≈ 0.2–0.5 s of compiles behind the stage card | — |
| Memory | lava map 1 MB GPU + 1.3 MB CPU; lava cell list ≤ 0.5 MB; float decks' `BoxPaint` 2 × ≈ 0.5 MB; nav windows ≈ 0.1 MB | — |

- **Target:** the whole stage ≤ 334 draw calls and ≤ 3.0 M triangles in `shoot.cjs` with lava at LOW and at HIGH.
  Designers therefore keep everything else at ≤ 324 calls.
- **Load:** loadMs ≤ 7.6 s (Halyard + 0.8 s; the second nav build is 0.12–0.16 s of it).
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
3. The first move starts ≥ 25 s after play starts. Holds are ≥ 15 s at HIGH and ≥ 25 s at LOW. (C)
4. Turf War ends at LOW, held for ≥ 25 s; ≥ 45 s if drownable turf is over 15 %. (C)
5. Modes with overtime start no move in the last `warn + 2` s of regulation. (C)
6. Inside the region, no static walkable top lies within 0.3 m of LOW or of HIGH. (C)
7. Drownable floors (tops between LOW + 0.3 and HIGH − 0.3) are ≥ LOW + 0.5. Then the lowest one gets ≥ 2.4 s of rise
   after its 6–10 s warning. (C)

**The region and the lake**
8. The region and every rider, gauge, cascade and vent are 180°-symmetric (a twin within 0.05 m). (C)
9. The lake is void: no block with a top below LOW + 0.3 inside the region, except bank and island sides that reach
   down to ≤ LOW − 0.5, so no bottom edge shows at LOW. (C)
10. No sealed pits: every point of drownable floor connects to the open lake at the same level. The region outline is
    exactly where lava flows. (A)
11. Bank and island faces below LOW are `paint: false` (split the block at LOW). (C, warning)
12. No grate floors inside the region below HIGH + 2.0. Railings (`rail`) are fine. (C)
13. Drownable turf is ≤ 25 % of the stage's turf. Each half's is equal. (C)
14. Every point of drownable floor is ≤ 12 m walking from a floor that never drowns (top ≥ HIGH + 0.3), and the way
    there never drops below that point (6.3 s even through enemy ink). (A)

**Riders** (stones and floats)
15. Footprints are 1.6–5.5 m a side. The depth (hull below the top) is ≥ top − LOW + 0.3 at the LOW pose, so the
    bottom never shows. (C)
16. Every rider's top is ≥ L + 0.35 at both poses (and so at every moment between); a `sink` stone only while it is
    surfaced. A float used as a lookout is ≥ L + 1.0. (C)
17. A rider's peak speed is ≤ 0.6 m/s (its travel × the ease's peak factor / the move's duration). (C)
18. Travel top1 − top0 is ≥ 0.6 m; anything that moves less should be static. (C)
19. Under every rider's footprint there is no static walkable top within 1.6 m below its LOW-pose bottom: only lava,
    void, or its own pit floor, which it rests on. (C)
20. Beside a rider, at every height it passes, there is either a seam ≤ 0.3 m to static geometry or another rider
    (walkable), or a gap with lava or void below it: a leap gap (rule 21) or open lava. A gap beside a rider never has
    dry floor below it, so nobody is ever caught between a rider and a floor. (C)
21. Leap gaps that bots must use are 0.3–1.6 m. The landing is +0.3 / −0.8 m from the take-off. There is a 1.0 m
    straight run-up, and the landing top is ≥ 1.8 m deep along the jump. Wider gaps (to 2.3 m) are humans-only
    shortcuts: there must be another route there. (A)
22. Clear sky over every rider: nothing static within 2.2 m above its HIGH-pose top, or anywhere over its travel. (C)
23. Every rider top that is in play at a pose is reachable at that pose by walking or hopping (≤ 1.25 m up for bots:
    `nav.js` makes jump edges only to 1.25 m; ≤ 1.8 m for kids) from floor dry at that pose, and you can get off the
    same way. Nobody can be stranded on a rider, and no lookout is ride-only. Concept-play's 1.3 m hop from the pipe
    walk (2.4) onto a risen float (3.7) needs the float's FLOOD top at 3.6 or less. (A)
24. Stones are bare. Float decks take ink (≤ 30 m² each, never counted as turf). A float's sides are bare unless
    `ink: 'all'` (humans may swim up them; bots never plan to, rule 23). (by construction)
25. A float used as a lookout has cover at most 1.0 m tall along at most half its edge, and at least two open sides.
    It is within 22 m of dry floor of both teams at HIGH, and its HIGH top is ≤ 4.6 m above the floor anyone reaches
    it from. (A)

**Objectives and spawns**
26. Zone floors (`y0`) are ≥ HIGH + 0.3. Zones are never on a rider. (C)
27. The tower track's floor under the whole 2.5 m platform is ≥ HIGH + 0.3. The track's swept volume plus its 3.72 m
    headroom stays ≥ 1.0 m from every rider's travel. (C)
28. Bazookarp: the Pond, weirs, Gates and Carp-Free Zones are not on lava-reachable ground. No Carp-Free Zone lies on a
    route only the lava opens (SPEC §9.4). (A)
29. Spawn pads, the spawn deck and the first 15 m of every route out of it never drown, and are ≥ 10 m (xz) from the
    region. (C)

**Counts**
30. ≤ 40 rider parts (dynamic blocks) in total, twins included: concept-play needs about 22, concept-place 14 (two
    3-part lifts, 8 stones), concept-gimmick about 30 if each hex is one turned box. (C)
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
38. Surfaces in the region are mid-value rock (albedo ≥ 0.25), never black: below the mark the stain darkens them to
    about 0.7×, and ink must stay the loudest colour. (A: palette pictures)
39. The lava's colours are the engine's (§7, R1). A stage chooses only the crust preset (`'basalt'`, `'ash'`).

---

## 6. Build plan (each step ends with a test that fails without it)

**Fixture.** Until the stage exists, the engine is built on **`lavabox`**, a test-only stage (never shipped) in
`tools/botlab/tests/lavabox.js`. Page tests import it, install it into `MAPS` and `MAP_LAYOUTS` the way
`tower-match.cjs` installs `towerbox`, and start a match on it. On a 56 × 120 m deck it has:
- spawn decks at z = ±52 (4.8 m) and terraces at 2.4;
- a void lake 30 × 44 m with a drownable crust (0) and a ford (0.3), LOW −1.6, HIGH 0.8;
- one stone path per half (four 2.0 m stones at L + 0.6 with 0.8 m leap gaps, from a 1.3 m landing to a 1.3 m rock);
- one float per half in a 0.3 m berth (top 1.3 → 3.7), built as a 3-part lift (deck + two 0.9 m bulwarks);
- a second schedule entry with `ease: 'linear'` for the easing tests;
- one `sink` stone;
- a long flank shelf (14 m, exit at one end);
- walls in the lake for stain pictures;
- a dry zone, and a tower track on a bridge.

Page tests run with `MAP=lavabox PAGE=tools/botlab/tests/<name>.js tools/botlab/run.sh tools/botlab/page.cjs`.

| # | Step | Test (`tools/botlab/tests/`) |
|---|---|---|
| 1 | **The pure core**: `lavaSchedule`, `lavaAt`, `lavaMax`, `riderTop`; schedule lookup, loops, `moves`, overtime 'hold'; check-maps lava section (H20); mapThumb (H15). | `lava-cycle.js`: concept-play's tables come out exactly (§3.3, to 0.01 s); L is continuous; smoothstep peaks at 1.5 × the average speed; `lavaMax` equals a brute-force maximum on 10,000 random intervals; overtime 'hold' finishes a running move and cancels a warning. `node build/check-maps.mjs` stays "ok" on every stage; a broken copy of the fixture trips each (C) rule. |
| 2 | **`LavaWorld`**: region mask, lava map, the surface mesh (`lavaFx`), `patchProps`, `buildLook`, H1 (world-build chain). | `lava-world.js`: the mask matches a polygon test on 5,000 random points; the map's solid bits match `level.pointInside` on 2,000 samples; `shoot.cjs` pictures at LOW / HIGH (`LAVA=`); loadMs with and without lava (≤ +0.8 s). |
| 3 | **`StageLava` runtime**: clock, phases, events, the kill check (H3), camera (H9), projectiles / bombs / subs (H16, H17), device sweep, `safeLanding`, buoy (H18). | `lava-rules.js`: a kid and a squid standing on the crust splat with cause `lava` within one frame of L passing feet − 0.15, not before; a kid mid-jump over the lake splats at L + 0.15; with LOW = −1.6 the cause is `lava`, never `water`; a sprinkler, beacon, mine and buoy on the crust are gone when covered, with no blast; bombs and shots into the lake fizzle with no paint; a super jump to a teammate on a stone that will be under by landing lands on the nearest dry node; the lens is never below L + 0.15 in a 360° orbit at the shore; the `lava:*` events fire at the right stage times. |
| 4 | **Riders**: dynamic blocks, poses, multi-part riders, carrying, `sink` (surface, sink, park), float decks and `ink: 'all'` sides (`BoxPaint`), linear and smooth easing. | `lava-riders.js`: a kid on each stone and float rides a full rise and fall (never airborne over 0.1 s, never more than 2 cm inside a part); a multi-part lift's parts stay within 1 mm of each other; a kid overhanging a rising float is lifted, never inside it; a `sink` stone is not solid and is out of `level.dyn` queries while sunk; swimming on a float deck in your own ink refills; a squid swims up an `ink: 'all'` float's side during a rise and pops onto its deck; no rider top is ever under L + 0.35 while in play. |
| 5 | **Paint**: `attachPaint` (retire below LOW), the burn front (CPU + `drawInto`), the gate (H7), the splat time tag (H10). | `lava-paint.js` (one paint system, the `ink-wipe.js` method): cells below LOW are not in `turfTotal`; a rise clears every inked lava cell it passes (grid, counts, and an atlas pixel read back); a splat on the crust while it's under lava claims nothing and draws nothing (pixel read); a splat across the waterline inks only above it; three simulated screens (painter, receiver 0.3 s ahead, receiver 0.3 s behind), replaying 400 splats with their `et` through a rise and a fall, end with identical grids. A death picture from the splat cam. |
| 6 | **Looks**: level-shader chunks (H8), prop patch, lava surface, embers, cascades, gauges, steam, the colour rules. | `lava-look.js`: pictures at LOW, warn-rise, mid-rise, HIGH and mid-fall, for each of the 5 team palettes and the colour-blind one, from four cameras (the stain line on walls, ink beside the lava). It also measures the mean hue, value and coverage of the lava's bright pixels against each palette's inks (§7, R1 targets) and draw calls / triangles from `renderer.info`. Non-lava stages' level program key is unchanged. |
| 7 | **Nav**: `buildNav` (two builds, merge, kinds, gap cuts, leap edges, exits), windows (H4), nav layer. | `lava-nav.js`: every stone and float has nodes at each pose; on 200 random node pairs, path costs in the merged graph with the lava held at LOW equal a fresh `NavGraph` built with the riders at LOW (±1 %), and likewise at HIGH; no edge crosses a gap > 0.3 m; leap edges exist for exactly the fixture's 0.8 m gaps; a route across the flank shelf is refused when it would drown before arrival and taken when it would not; routes use the stone path only at HIGH; `nearest()` never returns a hard-shut rider node; a path from a drowning node exits by the shortest way; A* time on 200 stage-crossing routes is within 10 % of the same without lava. |
| 8 | **Bots**: H5, `lava.bot`, `steerLeap`, H6. | `lava-bots.js`: 200 scripted leaps across the fixture's gaps at random approach angles, ≥ 95 % land and 0 lava deaths from leaps (else ship the seams-only fallback, §2); a bot fighting on the flank shelf at warn-rise is off it before it drowns in 20 of 20 trials; bots never walk off a descending float onto lava. Mac mini: 12 Turf War, 6 Zone Control and 6 Tower Command matches on `lavabox`, then the stage. Targets: ≤ 0.25 lava deaths per bot per 3:00, stuck % ≤ the stage average, a stone path crossed ≥ 4 times per match, a lookout used by a charger ≥ once per match. |
| 9 | **HUD, minimap, audio**: gauge, callouts (H11, H12), flood colour (H13), minimap (H14), the sounds. | `lava-hud.js`: the gauge's fill matches e within 2 %; countdown digits at warn − 10 … −1; callouts appear on the events (DOM); the splat card says "Burned in the lava"; the minimap's lava pixels track L (a pixel hash at LOW, HIGH and mid-rise differs). Audio presence in `sfx-cues.js`'s style, run alone. |
| 10 | **Online**: H10 and NET.md / EVENTS.md (D1). | `net-lava.cjs` (below), plus `node tools/net-test.mjs --net "netlag=150&netjitter=50"` with a skew report. |
| 11 | **Every mode**: zones, tower, Bazookarp hooks (events, `reach`, `closedNow`), Practice, menu backdrop, Boss 'off'. | `lava-modes.js`: zone cells and the tower track never touch lava at any phase; Zone Control overtime holds; a Practice session loops; the menu backdrop loops; Boss shows no lava rules. Mac mini Zone Control / Tower Command matches as in step 8. |
| 12 | **The stage audit** (when `caldera` exists): rules marked (A). | `lava-audit.js` on `caldera`: sealed pits, exit distances, rider reachability and strandedness, leap geometry, lookout exposure, Bazookarp reach, props in the region. `spawn-mid.js`, `cover-map.js`, `stage-audit.js`, `size-budget.js` with `LAVA=low` and `LAVA=high`. |
| 13 | **Regressions** | `world-build.js`, `movers.js`, `pods.js`, `treehills-pods.js`, `ink-wipe.js`, `surf-movers.js`, `bot-climb.js`, `stage-audit.js` on halyard / calamari / treehills; `net-practice.cjs`, `net-stageclock.cjs`, `net-turf.cjs`, `net-surf.cjs`; `node build/check-maps.mjs` (all stages). |

**`net-lava.cjs`** (`CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`; both
clients install `lavabox` before `start()`):
1. A 1:30 Turf War with bots (rise at 25, fall at 50). Each client samples L every 0.5 s; the two agree within 0.1 m
   throughout.
2. The guest stands on the crust and waits. It splats with cause `lava` on both screens, and the host's feed shows it.
3. The guest plants a sprinkler on the crust before the rise. It is gone on both screens after the lava covers it.
4. The guest paints across the waterline from rise − 2 s to HIGH + 2 s, and again through the fall. After 2 s of
   settling, `exportGrid` limited to the lava cells is identical on both screens.
5. The host's final counts show on both results screens.
6. A second run: the host leaves at 30 s. The new host's fall starts at 50 ± 0.4 s on its screen.
7. Practice: a third client joins mid-HIGH. Its L matches within 0.1 m within 2 s of its first tick, its
   `importGrid` succeeds, and its lava cells match the host's grid.

---

## 7. Risks and unknowns (and how to find out)

1. **Lava against ink: orange next to orange.** Tangerine `#ff8a14` and cherry `#ff4150` sit close to a lava glow.
   - *Plan:*
     - The surface is mostly dark crust: ≥ 65 % of its pixels at value under 0.15 at rest, cracks ≤ 25 % (≤ 40 %
       moving).
     - Crack hue runs crimson `#a3121a` → scarlet → white-hot, so it passes through orange only in a thin band.
     - It is matte, while ink is glossy.
     - The glow it throws onto rock is multiplied by (1 − 0.8 × ink coverage), so ink keeps its own hue.
     - Only white-hot cores exceed the 2.4 HDR bloom threshold.
   - *Find out:* step 6 pictures per palette, plus the hue / value report. Then the lead and the user look at them.
   - *Fix:* raise crust coverage, shift the crack ramp redder, or tint the crust per palette.
2. **Bots and leaps.** A missed jump is a death. Bots' speed control in the air is weak (`airDecel` 4 m/s²).
   - *Find out:* step 8's 200-leap test and the Mac mini lava-death rate.
   - *Fix:* tune the speed cap and take-off distance. Failing that, the seams-only fallback (§2), which the concept
     designers must then accept (gaps ≤ 0.3 m).
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
6. **The sea under the lava at LOW = −1.6.** The two meshes meet at one height, and the sea's swell is ±3.5 cm near
   decks. They will z-fight.
   - *Plan:* the lava material uses `polygonOffset` (−2, −2) and is drawn at max(L, −1.56).
   - *Find out:* step 2 pictures at LOW from low angles.
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
13. **The `deploy` package's API.** Wave 1 may land a tower-crush that does what `destroyWhere` does, under another
    name.
    - *Find out:* read its diff before step 3.
    - *Fix:* use its function and drop H17's second half.
14. **Fairness per mode.** Does flooding swing Turf War (20 % of turf drowns in concept-play)? Do stone paths or
    lookouts favour a side?
    - *Find out:* Mac mini sweeps comparing turf at time-up, win rates by side and knockouts, at concept-play's schedule
      and at a variant with the flood shifted 20 s.
    - *Tune:* the schedule only, never geometry, first.
15. **Crescent symmetry.** A single horseshoe is not 180°-symmetric. Concept-play solves it with two crescents. The
    engine requires symmetry (rule 8). Any other concept must too.
