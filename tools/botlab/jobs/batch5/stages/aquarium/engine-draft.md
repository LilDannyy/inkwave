# Aquarium: the pipe engine (clear pipes that suck you in and pop you out)

Engine design for the `aquarium` stage gimmick. The user's words: "clear pipes that can suck you in one end and pop you
out the other, similar to Super Mario 3D World. Some pipes are bi-directional, and some are one way only."

This is a paper design dated 2026-10-04, and nothing in it is built yet. I read every file and function named below in
`/Users/danielosling/Desktop/1/st-b5-design`. The measurements in §1.3 came from read-only Node runs of the real
`Level`, `Physics` and `NavGraph`. Two stage concepts already exist next to this file: `concept-play.md` (the Siphon
Line) and `concept-place.md` (the Tubeway). This engine supports both, and §1.4 says how.

**Decision in one paragraph.** A ride is an actor state, `actor.pipe`, owned and simulated by the rider's own client,
following the same pattern as a super jump.
- **Path.** The rider moves along a precomputed centreline: straight runs joined by circular fillets, sampled every
  0.1 m. Speed is constant, 18 m/s by default.
- **Inside the tube.** The rider is a squid behind glass that stops shots and blasts, so they cannot be hurt. Everyone
  can see them: their team colour glows in the tube where they are, and the exit mouth lights up for the whole ride.
- **Entering.** A rider enters by pushing into an open mouth. The suck-in takes 0.25 s, and the rider can still be hit
  during it.
- **Leaving.** The rider pops out on a short arc of about 3 m that they can steer. While that arc is in the air they are
  shielded. They land in a 1.2 m splat of their own ink and then wait out a 2.5 s cooldown before entering again.
- **One-way pipes.** These have a current: an intake fan at the IN end and a check-valve flap at the OUT end. The OUT end
  is a closed glass flap that nobody can enter.
- **Online.** Each ride sends one record when it starts. Every other screen then draws the rider exactly on the path at
  the owner's timeline time; it does not extrapolate from the actor ticks, which would leave the tube on bends (§1.3).
- **Building blocks.** The glass is a chain of oriented level boxes: hidden, `roof`, never inked. Each pipe is a typed
  nav edge with a cost.
- **Code.** There is one engine module, `src/game/pipes.js`. It comes with a three-free data file,
  `src/world/pipes-data.js`, and a look file, `src/fx/pipesFx.js`. These follow the precedents tower.js + tower-data.js
  and sp-drainbow.js + drainbowFx.js. The shared files get about 70 lines of hook-ins, each tagged `[b5-pipes]`.

---

## 1. Findings

### 1.1 What in the engine already helps

| Where | What it gives us |
|---|---|
| `src/game/actor.js` `Actor.update` → `_updateSuperJump` | This is the precedent for a state that owns the body. The super-jump branch runs before any movement or weapon code, moves `pos` itself and returns after `_finishFrame`. `superJump()` calls `weaponRunner.reset()` and forces squid form. A pipe ride is the same shape of code. |
| `Actor.jumpAnchor()` | Teammates super jumping to a player who is "up somewhere" already land where that player will come down (the Ink Jet / Zipline origin, or a super jump's landing). A rider's anchor is its pipe's landing point. |
| `Actor.damage` and `invuln` | `damage()` is where every hit and every continuous damage lands: `applyHit`, `tickDamage` in specials.js, the slam, the bubble shove. One guard there protects a rider from every source on the screen that owns them. |
| `src/game/specials.js` `IMPL.zipcaster.body` / `fire` / `impact`, `GHOST.zipcaster.event` | The Zipline moves an actor along a path while the camera follows it with no special handling. Ghosts get only the tether and the impact as records ("the zip itself is the owner's movement"). This is the model for owner-simulated travel. |
| `src/game/cameraRig.js` `CameraRig._follow` | During a super jump flight the rig already swings its yaw toward the landing (`dampAngle(… 3.5)`), pitches down, raises the boom by 1.2 m and turns the strafe look-ahead off. A ride camera is that branch with a different target. It snaps only when the target is more than 6 m from the follow springs; a rider moves 0.3 m per frame at 18 m/s, so it never snaps. |
| `src/game/physics.js` `Physics.raycast` | Blocks are oriented boxes with any three axes: ramps are pitched, oboxes are yawed. A pitched and yawed box per straight piece needs no new shape. `raycast` ignores a block that contains the ray's origin (`tmin < 0`), so a ray cast from inside the tube passes out through the piece it starts in. |
| `src/world/level.js` block flags `hidden`, `roof`, `paint: false` | A hidden block is collision only: it has no faces, no paint cells and no lightmap rects, so it does not enter `layoutHash`. A `roof` top slides anyone off it (`Actor._roofSlide`) and holds no nav nodes (`NavGraph._build` skips `b.roof`). Pipe colliders are exactly this. |
| `src/game/movers.js` / `src/game/pods.js` (`StageMovers.create`, `StagePods.create`, `podColliders`, `PodLooks`) | These show how a stage gimmick is registered by `LAYOUT.<key>`: colliders are pushed in `main._buildWorldNow`, a per-world look object is built there, and a per-match object is made in `Match` setup and updated in `Match.update` before anyone moves. |
| `src/game/stageKit.js` `StageClock`, `navClaim` / `navCommit`, `shoveActor`, `buildLook` | `StageClock` is the synced clock for scheduled pipes (extension E2). The nav layers handle replanning. `buildLook` builds PropKit meshes. |
| `src/net/netmatch.js` `recKit` / `_play` case `'k'` → `KIT_GHOSTS[kind].ghost` | A module can register `KIT_GHOSTS.pipe` and send records `['k', nid, 'pipe', data]` with **no change to `_play`**. Records are timestamped with the owner's `performance.now()` and played on the owner's timeline, in step with the rider's actor ticks. |
| `NetMatch.applyRemote` → `this.match?.tower?.carryRemote?.(a, …)` | There is already a hook where a stage object may change a proxy's drawn position after the sample is applied. A pipe hook goes beside it. |
| `src/game/nav.js` typed edges (`walk`, `jump`, `drop`, `climb`) and `path(a, b, team, maxIter, noClimb, avoid, cost)` | Edges carry a type and a cost. `path()` already takes per-call cost options, and a climb edge is a precedent for an edge with a rise and a cost. |
| `src/game/bots.js` `BotBrain.update` (the `superJumpState` early return at line 698), `_steer` (the `'jump'` / `'climb'` exceptions), `_pathTo` | Each of these has a single place for one more edge type. |
| `src/game/botSight.js` `Sight.check` / `recheck` | An enemy in super-jump flight is "in the sky (and untouchable): the landing marker says where it'll be". The memory is set to the landing with `src: 'jump'` and is never a target. A rider is the same case. |
| `src/game/reveal.js` `registerReveal(id, test)` | Its comment says it is meant for "a stage gimmick … that gives a player's position away". Both the map dots (`main.js`) and bot perception read it. |
| `src/game/minimap.js` `_compose` → `G.specials.drawMap(...)`, `_jumpLines`, `superJumpInfo` | This is a live layer where a module draws itself, plus a style for travel lines and landing rings. |
| `src/game/character-mats.js` `getGlassMaterial()` (the ink tank) | This is the house look for glass: `MeshPhysicalMaterial`, opacity 0.14 plus a fresnel rim up to 0.6, `depthWrite: false`. |
| `src/fx/drainbowFx.js` `BubbleLook` | A transparent film drawn in a back-face pass and a front-face pass, kept out of the GTAO override pass by `noAO` (`geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity`). The glass tube needs the same three things. |
| `src/game/kits/registry.js` `netRec`, `netId`, `ghostMute` | Record helpers that need no edit to netmatch.js. |

### 1.2 What assumes otherwise (and what it would break)

| Where | Assumption | Consequence for pipes (fixed in §3.7) |
|---|---|---|
| `src/game/physics.js` | There are no trigger volumes at all. Every other "zone" in the game is ad hoc: zone cells, the spawn barrier, tower riders. | The mouth capture test is the module's own code: a cylinder test per own actor per mouth, about 200 tests a frame at most. |
| `src/world/level.js` `Level._build` (extra colliders) | Prop colliders are `box` (axis-aligned) or `obox` (yaw only). Ramps are pitched, but their slab is offset under the top and extended 0.6 m past the low end. | A pipe piece needs an exact box from point a to point b. One small new def kind, `seg`, is cleaner than misusing ramps (H1). |
| `src/net/netmatch.js` `_pathAt` | When the sample buffer runs dry it extrapolates in a straight ballistic line for up to 0.18 s, with gravity, because a rider is not grounded. | On a bend this draws the rider **1.55–2.76 m outside the glass** (§1.3), then the correction pulls it back through the wall. A proxy rider must be drawn from the path instead (H10). |
| `NetMatch` `packActor` | 24 fields; flags use bits 0–21. | One more flag bit, `F.pipe` (bit 22), so a late joiner or an adopting host knows who is in a pipe (H10). |
| `src/game/weapons.js` `_step` | Projectiles test **actors before the world** inside one frame's segment. | A shot whose 0.3–0.5 m frame step crosses the glass can register on the rider inside it. The guards in `applyHit` and `Actor.damage` drop it (H3, H9). With 93 `for (const e of G.actors)` loops across the game, guarding at the two places every hit passes through is the only practical choice. |
| `src/game/match.js` `update` (the soft push between actors) | Any two actors within 0.65 m horizontally and 1.2 m vertically push apart. | A rider passing over someone's head would be shoved off its path. Riders are skipped (H4). |
| `src/game/cameraRig.js` `_follow` → `physics.cameraProbe` | The boom probe hits every solid. | With the pivot inside the tube, the next pipe piece pulls the boom in to 0.45 m. The ride camera probes with pipe pieces skipped (H2, H11). |
| `src/game/minimap.js` `_build` | It rasterises every solid block top. It skips hidden roof blocks only when they are more than 3 m up. | Low pipe pieces at the mouths would draw as dark slabs. They are skipped, and the module draws the network itself (H12). |
| `build/bake-ao.cjs` `PAGE_BAKE` | The AO tracer uses `P.raycast(…, true)` and `L.pointInside`, and hidden colliders count. | Glass would bake hard occlusion under every pipe. Pipes leave the bake (H15). |
| `src/boss/bossNav.js` `_build` | A cell is a wall where `pointInside` hits at the boss floor plus 0.6, 2.6, 3.8 or 5.2 m. | Pipe pieces lower than 5.3 m over the boss floor are walls to HULLBREAKER. That is correct physically, but it limits where low pipes may run on a boss stage (§5, rule 33). |
| `src/net/netmatch.js` `_sendTick` | In Practice, the stage clock is sent only from `movers` or `pods`. | Pipes on a schedule (extension E2) would have no clock in online Practice. This needs one token (H10e), and only if E2 is used. |
| `src/game/bots.js` `_steer` | A waypoint more than 0.9 m above the bot within 1.2 m horizontally means "can't get there", and the bot replans unless the edge is `'jump'` or `'climb'`. | Lift pipes (exit right above the entry) would replan forever. `'pipe'` joins the exceptions (H7). |
| Super-jump consumers (minimap `_jumpLines`, the `superjump` events, the batch-5 `jumpui` alerts, the TAB map) | `superJumpState` means a super jump. | This is why a ride must **not** reuse `superJumpState`. Every jump UI would announce a pipe ride as a jump (option D, §2). |

### 1.3 Measurements I took (read-only Node runs; numbers in metres and seconds)

**Remote drawing: Hermite between ticks vs. extrapolation, on a circular bend** (netmatch's own `hermite()` formula, the
owner's velocities as tangents):

| bend radius | speed | gap between samples | Hermite error | 0.18 s extrapolation leaves the axis by |
|---|---|---|---|---|
| 2.0 m | 18 m/s | 0.05 s (one tick) | 0.02 cm | 1.81 m |
| 2.0 m | 18 m/s | 0.15 s (two ticks late) | 1.7 cm | 1.81 m |
| 2.0 m | 24 m/s | 0.15 s | 5.2 cm | 2.76 m |
| 2.6 m | 18 m/s | 0.25 s | 5.8 cm | 1.55 m |

Interpolation stays inside the 0.80 m glass by a wide margin. Extrapolation, which runs whenever a packet is late, does
not. That decides option (ii) in §2.2.

**Collider cost** (halyard: `new Level(layout, colliders)`, `NavGraph`, 20,000 random 8 m rays at 0.5–5.5 m height):

| | blocks | nav nodes | nav build | ray cost |
|---|---|---|---|---|
| halyard | 168 | 4,954 | 99–102 ms | 0.73–0.78 µs |
| + 4 pipes ×2 twins, 132 collider pieces (≈ 260 m of pipe) | 300 | 4,924 | 84–99 ms | 0.88–0.90 µs (+13–23 %) |
| + 8 pipes ×2 twins, 264 pieces (≈ 520 m) | 432 | 4,844 | 77 ms | 1.14 µs (+56 %) |

The nav build does not get slower (pipe pieces only remove a few nodes). Ray cost grows with the number of pieces,
because rays at pipe heights pay the slab test. Hence the budget of 200 pieces (§5, rule 6).

**Pop arcs** (the actor's own air physics: gravity 25, fall ×1.2, apex ×0.82 within ±1.6 m/s; air decel 4 with no input):

| pop | landing | no input | stick held out |
|---|---|---|---|
| level 6.5 out / 6.0 up | same floor | 0.48 s, 2.7 m out, apex +0.72 m | 3.1 m |
| level | 1.3 m lower | 0.63 s, 3.3 m | 4.1 m |
| level | 3.4 m lower | 0.79 s, 3.9 m | 5.1 m |
| high (jump held) 7.0 / 8.5 | same floor | 0.67 s, 3.8 m, apex +1.44 m | 4.7 m |
| up nozzle 2.5 / 10.5 | a ledge 2.0 m higher | 0.56 s, 1.4 m across, apex +2.19 m | — |
| down nozzle, 2 m/s down | 4.2 m below | 0.47 s, lands at 16 m/s (above `hardLandSpeed` 11.5: suppressed, §3.6) | — |

The pop starts 0.45 m outside the mouth plane, so a level pop with no input lands **3.1 m from the mouth**. That point
is the "landing point" used for nav, bots and super jumps.

### 1.4 The two stage concepts, and what the engine covers

Both concepts want the same core: two-way and one-way pipes, kid or squid entry, untouchable riders, a telegraphed exit,
a pop splat, a cooldown, no carrier, and nothing riding but squidkids (play) or squidkids plus bombs (place). They differ
in the details. The engine takes these as data, with the defaults below; the lead picks the concept.

| Feature | concept-play (Siphon Line) | concept-place (Tubeway) | Engine |
|---|---|---|---|
| Speed | 18; express 24 | 18 | **core:** 18 default, 12–24 per leg |
| Who enters | kid or squid, pushing in | squid only (kids bump a grille) | **core:** `enter: 'any' \| 'squid'` (default `'any'`) |
| Suck | 0.3 s, can be hit | 0.25 s | **core:** 0.25 s, can be hit |
| Pop | 6 out + 5 up, ≈ 2 m; no shield; fire after 0.2 s | 3.0 m out; 0.45 s shield while airborne | **core:** 6.5 + 6.0, ≈ 3.1 m; shield while airborne (≤ 0.8 s); weapons 0.07 s after touchdown |
| Steer / high pop | — | — | **core:** ±45° steer, jump = high pop (my addition against camping) |
| Cooldown | 2.5 s | 3 s | **core:** 2.5 s default (1.5–4) |
| Telegraph | exit ring lit for the whole ride | the rider visible, exits known | **core:** exit ring in the rider's colour for the whole ride, chime 1.0 s before the pop |
| Lifts (pop up) / the Drop (pop down) | yes | — | **core:** `nozzle: 'up' \| 'down'` on one-way OUT ends |
| Junctions (branch choice) | Halo Line's Exchange → the Drop | Kelp Line junction | **E1** (optional): 3-way junctions, steered choice, one record |
| Clock-driven pipes | the Drop opens in the last 60 s | Kelp Lines flip every 90 s | **E2** (optional): `open` windows and `flip`, from `StageClock` |
| Spirals | — | 1.5 turns in the kelp drum | **core:** `helix()` helper in pipes-data.js produces the points |
| Turning back | — | hold back 0.3 s, once, two-way only | **E6** (optional, not recommended for v1): one record |
| Bomb mail (thrown subs ride) | no | yes | **not supported** (§2.4) |
| One rider per mouth per 0.7 s; landing-circle shove; device aprons | aprons (play); spacing + shove (place) | — | **not supported:** needs cross-client arbitration or hooks in every placement path. The automatic pop fan and shootable deployables (batch-5 `deploy`) do the job. |
| `glass` level flag (bot sight passes) | — | §2.8 | Pipe pieces carry `glass: true`. If the stage's general glass flag lands, pipes are covered by it. The pipe engine does not need it. |

---

## 2. Options weighed

### 2.1 What a ride is

| | (A) Actor state, owner-simulated, path-driven (**recommended**) | (B) Host-authoritative rides | (C) A moving block per rider (movers style) | (D) Reuse `superJumpState` with a path | (E) Teleport + a fake visual |
|---|---|---|---|---|---|
| Control feel | Instant: the rider's own screen decides at the mouth | One round trip of input lag at every mouth for guests | Instant | Instant | Instant |
| Fits "each player simulates themselves" | Yes | No | Yes | Yes | Yes |
| Curved paths | Exact (LUT) | Exact | `moveDynamic` is yaw-only; every query scans every dynamic block | Exact | n/a |
| What others see | Exact, from one record per ride (§2.2) | Host snapshots | Samples (leave the tube on late packets) | Samples, and every super-jump UI fires | A fake squid; the real actor is "at the exit" for minimap, bots and assists |
| Cost | One module and about 70 hook lines | Rewrites ownership | Per-query cost and still a ride state | Breaks `_jumpLines`, jump alerts, the TAB map and botSight's jump memory | Every system lies for 1–4 s |

(A) copies the super jump's *pattern* (owner-simulated, body-owning branch, landing known to all) without its *state*.

### 2.2 How other screens draw a rider

- (i) **Actor ticks only:** Hermite interpolation is fine, but the 0.18 s extrapolation leaves the tube by 1.55–2.76 m on
  bends (§1.3).
- (ii) **The path, from the entry record (recommended):** `[0, leg, end, t0, s0]` gives the start on the owner's
  timeline. Each proxy frame computes `T = peer.tr − t0` and draws `legAt(s)` exactly. This adds no per-frame traffic
  and survives late packets, bad Wi-Fi and the playback clock's ±25 % steering.
- (iii) **A pipe field in every tick:** this works but costs every actor bytes in every tick, all the time.

### 2.3 What the glass is

- (i) **Solid to bodies, shots, ink, bombs and the camera, and never inked (recommended).** It reads the way it looks:
  "I can see him but I can't shoot him". Riders are safe for a physical reason, not by a hidden rule. Blasts stop at it,
  because `physics.los` is blocked.
- (ii) **Rail-like:** shots and ink pass, only bodies are stopped, and riders are immune by rule. Shots would fly
  through visible glass and hit players behind it. Rejected.
- (iii) **Riders hittable:** the glass doesn't stop shots. A rider on a fixed, telegraphed path at 18 m/s is a free
  kill, so pipes become death traps. That is not the Super Mario 3D World feel. Rejected.

**Collider shape.** A square of 1.60 × 1.60 m around a round tube of 0.88 m outer radius:
- the flats sit 8 cm inside the glass surface;
- the corners stick out 25 cm, at 45° only;
- bodies pressing on a side clip the glass by at most 8 cm.

A balanced alternative, 1.46 m, gives ±15 cm either way. It is a one-constant change if the 45° corners read badly
(§7, risk 6). A capsule primitive in `Physics` was rejected: every query is box-only.

### 2.4 What may ride

| Candidate | Decision | Why |
|---|---|---|
| Kid, squid (players and bots) | **Yes** (`enter: 'any'`; a stage may set `'squid'`) | The user's request. Kids walking in is the Super Mario 3D World feel; intent-gated capture (§3.6) stops accidental entries. |
| A player in a body-owning or transforming special (Zipline, Ink Jet, Crab, Kraken, Stamp, Zooka …), super jumping, or dead | **No.** The mouth is glass to them. | The same test as `canSuperJump()`: `!specialActive \|\| specialActive.free`. A special's timers and props have no meaning inside a tube. |
| Statuses (tracked, poisoned, Bubble Guard shield) | **Ride along**, and their timers keep running | The glass stops damage only. A rider is already in plain sight, so a mark changes nothing. |
| The Bazookarp carrier | **No by default.** A pipe may be opened to carriers per mode (`modes.bazookarp.carp`). | The mode's rule is "distance to the goal matters most". An untouchable pipe ride at 18 m/s against walking at 4.8 m/s is a shortcut. The SPEC (§9.4) leaves the choice to this design: refused carriers stay refused at the mouth, with "Can't ride with the Bazookarp". If a pipe is opened to carriers, the carrier rides at 0.8× speed, the fuse keeps burning and the marker stays visible. |
| The Bazookarp itself, devices (sprinkler, beacon, curtain, buoy, the new turret), thrown bombs, shots, special objects | **No.** They splash or bounce on the glass like on any wall. | Thrown subs and bombs are simulated separately on every screen as visual ghosts (`'b'` / `'k'` records carry only the throw). A ghost bomb would enter on one screen and bounce on another. Bomb mail would need hooks in subs.js `_fly`, weapons.js `_updateBombs`, each kit's flight (waddle, torpedo, boomerang …) and the four new batch-5 subs, plus a correction record. It also mails area denial into bases. |
| The tower | **No.** Pipes stay clear of its track (§5). | — |
| HULLBREAKER | **No.** Low pipes are walls to it (BossNav). | — |

---

## 3. The contract

### 3.1 Words used below

- **Leg**: one glass tube from mouth A (`pts[0]`) to mouth B (`pts[n−1]`). It is one-way or two-way.
- **Mirroring**: with `mirror: true` every leg has a 180° twin (`(x, z) → (−x, −z)`) with id `id + '~'`. A `single` leg
  is its own twin.
- **End**: one mouth of a leg. `k = 0` is A and `k = 1` is B.
  - **IN** end: takes riders now.
  - **OUT** end: riders leave from it.
  - **Two-way leg**: both ends are IN and OUT.
  - **One-way leg**: A is IN and B is OUT, unless a flip (E2) swaps them.
- **s**: arc length along the leg from A, 0…L metres. A ride from B runs `s = L → 0`.
- **Mouth plane**: the disc where the tube ends, centred on the end point. The **mouth floor** is the walkable surface
  the mouth opens onto.
- **Approach point**: the mouth floor 1.0 m out along the end's outward axis.
- **Landing point**: where a level pop with no input lands (§1.3): 3.1 m out, on the floor below. An `up` nozzle uses
  its `land` point, and a `down` nozzle the floor straight below it.
- **Ride phases**:
  - `suck`: 0.25 s, can be hit;
  - `ride`: L / v, untouchable;
  - `pop`: airborne after leaving the mouth, shielded, at most 0.8 s;
  - then **cooldown**: 2.5 s before any mouth takes this player again.

### 3.2 Files and public API

```js
// ---- src/world/pipes-data.js (NEW, three-free: imported by pipes.js, build/check-maps.mjs, src/world/mapThumb.js)
export const PIPE = { rIn: 0.80, rOut: 0.88, box: 1.60, speed: 18, speedMin: 12, speedMax: 24, bendMin: 1.5,
                      lenMin: 12, lenLift: 3, rideMax: 3.5,   // m; m for one-way legs ending in an up / down nozzle; s of ride
                      mouthY: 0.80, endStraight: 0.5, lut: 0.1, piece: 4.0, arcPiece: 0.8 };
export function expandPipes(layout)    // → { label, enter, legs: Leg[], ends: End[], junctions, problems: string[] } | null
//   Leg = { i, id, twin (index of its 180° twin or −1), way: 'one'|'two'|{flip…}, speed, len, lut: Float32Array
//           (every 0.1 m: x, y, z, tx, ty, tz), ends: [End, End], hide: [[s0, s1]…], look, single }
//   End = { leg, k: 0|1, pos: [x,y,z] (mouth centre), out: [x,y,z] (unit, out of the mouth), nozzle: 'level'|'up'|'down',
//           name, floorY, approach: [x,y,z], land: [x,y,z], in: bool, outOk: bool }
export function legAt(leg, s, out)     // out = { x, y, z, tx, ty, tz }: centre and unit tangent (A → B) at arc length s
export function nearestOnLeg(leg, p)   // → { s, d }: the closest centreline point to p
export function pipeColliderDefs(layout)   // → [{ seg: true, a, b, w: 1.6, h: 1.6, pipe: legIndex + 1, roof: true, glass: true }]
                                           //   straight runs in pieces ≤ 4.0 m, fillets in pieces ≤ 0.8 m of arc
export function helix(c, r, y0, y1, turns, a0Deg, stepDeg = 30)   // → [[x, y, z]…]: points for a spiral run
export function checkPipes(layout)     // → string[]: the §5 rules that need no Level (counts, lengths, bends, mouth levels,
                                       //   symmetry, distances to pads, zones, the tower track, Bazookarp gates)

// ---- src/game/pipes.js (NEW: the engine)
export const PIPES = {                 // runtime numbers (data defaults may override the marked ones)
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
};
export function pipeColliders(layout)  // = pipeColliderDefs (main._buildWorldNow pushes them with the prop colliders)
export class PipeNet {                 // per world → G.pipes (built and disposed with the world, like PodLooks)
  static build(layout, scene, level)   // → PipeNet | null; expands the data, builds the looks (pipesFx), sets level.extraEdges
  legs; ends; label; enter
  navSpecs()                           // → [{ a, b, cost, len, type: 'pipe', key, leg, end }] (one per IN end → OUT end)
  drawMap(c, mm, tc, s, hex, t, me)    // the network (static Path2D per flip) + riders + lit exits, on the minimap and TAB map
  bakeMode(on)                         // build/bake-ao.cjs: pipe pieces non-solid while the AO is traced
  dispose()
}
export class StagePipes {              // per match → match.pipes (like StageMovers / StagePods)
  static create(match)                 // → StagePipes | null (null only without G.pipes; 'off' = every leg shut, still drawn)
  clock                                // a StageClock (stageKit.js), read only by E2 schedules
  update(dt)                           // Match.update after pods: captures (own actors), touchdowns, lights, sounds, E2 schedules
  ride(a, dt)                          // Actor.update while a.pipe is in 'suck' / 'ride' (the owner's rider)
  carryRemote(a, flag, dt)             // NetMatch.applyRemote: draws a proxy rider on its path at its owner's timeline time
  adopt(a)                             // NetMatch._adopt: a proxy mid-ride becomes ours; re-records [0] with s0
  net(a, d)                            // KIT_GHOSTS.pipe.ghost: the owner's records (§3.9)
  canEnter(a, end)                     // → '' | 'oneway' | 'shut' | 'carp' | 'special' | 'cooldown' | 'form'
  open(end)                            // → bool: this end takes riders now (mode, schedule)
  anchor(a)                            // → Vector3: Actor.jumpAnchor while riding (its exit's landing point)
  landing(e)                           // → Vector3 | null: botSight, where enemy rider e will land
  cam(rig, a, dt)                      // → bool: CameraRig._follow, the ride camera (true = it set yaw / pitch / boom)
  botSteer(brain, edge, out)           // → out: BotBrain._steer on a 'pipe' edge
  botCost(brain)                       // → Float32Array | null: extra cost per pipe edge key (Infinity = refused)
  prompt(a)                            // → string | null: main.js prompts
  hud(a)                               // → { riding, name, k, eta, hint } | null: frame.pipe
  state()                              // test snapshot: { rides: [...], open: [...], lit: [...], cooldowns }
  debugRide(a, legId, k)               // tests: start a ride from end k now
  dispose()
}

// ---- src/fx/pipesFx.js (NEW: looks only, imported by pipes.js)
export class PipeLooks {               // glass (back + front pass), collars, brackets, fans, flaps, mouth rings, signs
  constructor(scene, net); setRiders(list); lightEnd(end, team, k); pop(end, team); flap(end, open); update(dt); dispose()
}
```

**The actor's state** (`actor.pipe`, null when not riding):
`{ leg, k (entry end), phase: 'suck'|'ride'|'pop', t0, T, s0, p0: Vector3, v, dir: ±1, steer: yaw|null, high, chimed,
remote, pop0 }`, plus `actor.pipeCd` (seconds of cooldown left) and, on proxies, `actor.pipeNet` (the tick flag).

The module also synthesises its sounds, registered like `movers.js` does (`if (!SFX.x) SFX.x = …`):
- `pipe_suck`: a rising filtered "shloop", 0.3 s;
- `pipe_ride`: a hollow glassy whoosh loop at the rider (the rider's own copy low-passed), at most 3 voices;
- `pipe_chime`: two rising notes at the exit, 30 m range;
- `pipe_pop`: a cork pop and splash;
- `pipe_tok`: a glass knock, for refusals;
- `pipe_fan`: the intake hum of one-way IN ends, the 2 nearest within 12 m.

It registers `registerReveal('pipe', (e) => !!(e.pipe || e.pipeNet))` and `KIT_GHOSTS.pipe = { ghost: (a, d) =>
G.match?.pipes?.net(a, d) }`.

### 3.3 What a stage layout gives it (exact format)

```js
// src/world/stages/aquarium/layout.js
export const LAYOUT = {
  // …
  pipes: {
    label: 'SIPHON LINE',          // the HUD's name for the network (≤ 14 characters)
    mirror: true,                  // every leg gets its 180° twin (id + '~'), except `single: true` legs
    enter: 'any',                  // 'any' (kid or squid) | 'squid' (a kid bumps the mouth like a wall)
    speed: 18,                     // m/s, the default for every leg (12–24)
    cooldown: 2.5,                 // s (1.5–4)
    modes: {                       // per match mode; omitted = every leg as listed
      bazookarp: { shut: ['halo'], carp: [] },   // shut: closed for everyone (the twin too); carp: open to a carrier
      boss: 'open',                // 'open' | 'off' (every leg shut, still drawn and solid)
    },
    legs: [
      { id: 'kelp',                // unique; its twin is 'kelp~'
        way: 'one',                // 'two' | 'one' (A → B only) | { flip: … } (E2)
        names: ['KELP FOREST', 'JELLY HALL'],    // A's, B's (≤ 14 characters each); "→ JELLY HALL" is shown at A
        pts: [[-24.0, 0.8, -40.0], [-24.0, 0.8, -37.5], [-24.0, 6.6, -37.5], [-12.0, 6.6, -22.0],
              [-12.0, 0.8, -22.0], [-14.5, 0.8, -22.0]],
        bend: 2.0,                 // fillet radius at every interior corner (m; ≥ max(1.5, speed² / 220))
        speed: 18,                 // optional per leg (an express: up to 24)
        ends: [{ nozzle: 'level' }, { nozzle: 'level' }],   // 'level' | 'up' (+ heading, land) | 'down' (OUT ends only)
        hide: [],                  // optional [[s0, s1]…]: arc-length ranges inside walls / floors (no glass drawn there)
        look: { tint: 'aqua', collars: 'brass' },           // 'clear' | 'aqua'; 'brass' | 'steel' (looks only)
      },
      { id: 'halo', way: 'two', single: true,               // a centre leg that is its own twin (checked)
        names: ['KELP BALCONY', 'REEF BALCONY'],
        pts: [[-19.6, 3.2, -5.0], [-17.1, 3.2, -5.0], [-17.1, 8.8, -5.0], [17.1, 8.8, 5.0], [17.1, 3.2, 5.0], [19.6, 3.2, 5.0]],
        bend: 2.0 },
    ],
    // junctions: [ … ]   (E1, §3.10)
  },
};
```

**How the points are read:**
- `pts[0]` is end A's mouth centre, and `pts[1] − pts[0]` is A's inward axis. For a `level` end that first run is
  level (`pts[0].y === pts[1].y`), long enough for 0.5 m of straight tube before its fillet starts (≥ bend + 0.5 m),
  and the mouth centre sits 0.80 m above A's mouth floor.
- The last point is end B's mouth centre, and `pts[n−1] − pts[n−2]` is B's outward axis.
- Between them the path is the polyline with a circular fillet of radius `bend` at every interior corner. Each run must
  be long enough for its two fillets plus 0.1 m.
- An `up` nozzle's last run is vertical and rises through a floor to a nozzle at floor level. It needs `heading` (the
  yaw of the 2.5 m/s sideways pop) and `land` (the ledge point it lands on).
- A `down` nozzle's last run is vertical and points down. It lands straight below, at most 4.5 m down.

**What the worked example produces** (computed the way `expandPipes` will):

| leg | length | ride at 18 m/s | suck + ride + pop | ends (Alpha's half; twins mirrored) | nav edge cost |
|---|---|---|---|---|---|
| `kelp` (one-way) | runs 2.5 + 5.8 + 19.6 + 5.8 + 2.5 = 36.2 m; 4 fillets of 90° at r 2.0 each save 0.86 m → **32.8 m** | 1.82 s | 2.55 s | IN at (−24.0, 0.8, −40.0) facing −z; OUT at (−14.5, 0.8, −22.0) facing −x, landing ≈ (−17.6, 0, −22.0) | 2.55 × 6 + 2 = **17.3** |
| `kelp~` | the same, mirrored | | | IN (24.0, 0.8, 40.0); OUT (14.5, 0.8, 22.0) | 17.3 |
| `halo` (two-way, single) | 2.5 + 5.6 + 35.6 + 5.6 + 2.5 = 51.8 m, 4 fillets → **48.4 m** | 2.69 s | 3.42 s | A (−19.6, 3.2, −5.0) on a 2.4 m balcony, facing −x; B its mirror, facing +x | 3.42 × 6 + 2 = 22.5, each way |

The halo's middle run passes over the centre at y 8.8 (bottom 7.92), above everything on a mid at or below 5.2 m. It is
mirror-symmetric: reversing its points and turning them 180° gives the same list, and the checker verifies that. These
coordinates are a format example, not a layout. The stage designer places the real ones with `pipes-audit.js` (§6).

### 3.4 One ride, second by second (the `kelp` example, entered at A)

| Time from capture | The owner's screen | Every other screen (from record `[0]`, on the owner's timeline) |
|---|---|---|
| 0 | Capture (§3.6). `a.pipe = { phase: 'suck', … }`, `weaponRunner.reset()`, the previous intents cleared, form squid. Record `[0, leg, 0, t0, 0]`. `pipe:enter`. `pipe_suck`. | The proxy gets `pipe = { remote, phase: 'suck' }` and is drawn on the suck curve. `pipe:enter`. |
| 0 … 0.25 | Suck: drawn from `p0` to the mouth centre (ease-in), squashing into the tube. **Can be hit** (the damage guard skips `suck`). Splatted here → the ride is cancelled and the splat is normal. | The same curve. A splat event cancels it. |
| 0.25 | `phase: 'ride'`. The exit ring lights in the rider's team colour (`pipe:exit-lit`). | Same, at the same timeline moment. |
| 0.25 … 2.07 | `s = (T − 0.25) × 18`. `pos = legAt(s)` plus the lane offset, minus 0.3 m in y (so the squid's body is on the axis). `vel = tangent × 18`. Yaw from the tangent. Status timers tick; no regen, no refill. `ride()` reads the move and jump intents (for the steer window), then clears `intent.move`, so the facing spring in `_finishFrame` follows the velocity, not the stick. | `carryRemote` draws the identical point (`T = peer.tr − t0`). If `T` passes the end before record `[1]`, the proxy holds at the mouth. |
| 1.57 (0.5 s before the end) | The steer window opens: move input picks the pop heading (±45°), jump held makes a high pop. | — |
| 1.07 (1.0 s before) | `pipe_chime` at the exit, and the ring pulses faster. | The same, from each screen's own copy. |
| 2.07 | Pop: `pos` = OUT mouth + out × 0.45, `vel` = heading × 6.5 + up × 6.0 (high: 7.0 / 8.5), `phase: 'pop'`, `kidT = −9` (no fire). Record `[1, yaw, high]`. `pipe:pop`. The flap swings, `pipe_pop` plays. Normal physics from here, with the shield on. | The override ends and the drawing returns to actor ticks (the owner's pop is in them). `[1]` plays the flap and the splash. |
| ≈ 2.55 | Touchdown (`StagePipes.update` sees `grounded`): `pipe = null`, `pipeCd = 2.5`, `kidT = 0`, `hardLand = 0`, a 1.2 m splat (`addTurfNoSpecial`), `pipe:land`. | The flag goes off in the next tick and `pipe` is cleared (0.3 s timeout). The splat arrives as the usual splat record. |
| ≈ 5.05 | The cooldown ends. | — |

**Time base.** Online, the owner's `T` is `performance.now()/1000 − t0`, the same clock its records are stamped with, so
owner and ghosts agree exactly. Offline (no `G.netm`) `T` is the sum of the frame `dt`, so pausing and page-test
stepping stay exact.

### 3.5 The rules of riding (what the module enforces)

1. **Capture** happens when all of these hold, tested each frame in `StagePipes.update` for the actors this screen owns
   (the local player and, on the host, its bots):
   - the actor is alive, has no `pipe` and `pipeCd ≤ 0`, is not super jumping, and has no running special other than a
     `free` one;
   - its body centre (feet + 0.5 m for a kid, + 0.3 m for a squid) is inside the capture cylinder: radius 0.75 m around
     the end's axis, from the mouth plane to 0.9 m out, with the feet between the mouth floor − 0.3 m and + 1.0 m;
   - its move intent (`a.intent.move`, world space) has magnitude ≥ 0.5 and points within 45° of the inward axis, for at
     least 0.08 s of the last 0.2 s;
   - the end is open (mode, schedule) and is an IN end;
   - with `enter: 'squid'`, the actor is in squid form.

   Walking into a mouth captures you about 0.08 s after you touch it. Strafing past, standing beside it or shooting
   near it never does.
2. **Refusals.** When everything holds except the gate, the end refuses:
   - The OUT flap rattles, `pipe_tok` plays, and a prompt shows for 1.5 s:
     - `oneway`: "One way: this end is the exit"
     - `shut`: "Closed in this mode"
     - `carp`: "Can't ride with the Bazookarp"
     - `special`: "Can't ride during a special"
     - `cooldown`: "Pipe cooldown"
     - `form`: "Swim in as a squid"
   - The actor just stands against the glass, which is a wall.
   - `pipe:refuse` fires on the owner's screen only.
3. **Untouchable inside.** For `phase` `ride` and `pop` (while airborne): `Actor.damage` returns false and
   `applyHit` returns before its `'hit'` event, so there is no false hit marker. During the pop the actor cannot fire,
   throw or start a special, because those intents are forced off. The `suck` phase takes damage.
4. **The pop.**
   - **Level ends:** out 6.5 m/s along the heading plus 6.0 m/s up.
   - **Heading:** the outward axis, turned toward the move input held in the last 0.5 s, by at most 45°. With no input
     and another rider popped from this OUT end within the last 0.4 s (as this screen knows), it turns 30° to the right
     instead, so two arrivals don't stack.
   - **High pop:** jump held in the last 0.5 s gives 7.0 out and 8.5 up.
   - **`up` nozzle:** 10.5 m/s up and 2.5 m/s toward its `heading`. **`down` nozzle:** 2.0 m/s down.
   - **The shield** lasts while airborne, at most 0.8 s. Touchdown ends it: weapons work 0.07 s later (`emergeDelay`),
     and no hard-landing recovery applies.
5. **Touchdown splat.** A 1.2 m splat of the rider's ink lands at the touchdown point. It counts as turf but does not
   charge the special (`addTurfNoSpecial`), so ping-ponging cannot farm the special.
6. **Cooldown.** 2.5 s from touchdown, for every mouth. The HUD shows a small ring on the ink tank.
7. **Any number ride at once.** No queue, no mouth locking, no rider-to-rider collision. Riders keep 0.28 m to the right
   of their direction of travel, so opposite riders in a two-way leg pass side by side. The soft push between actors
   skips riders.
8. **Splatted in the suck:** the ride is cancelled and the death is normal, at the mouth. **Disconnected or adopted
   mid-ride:** the new owner finishes the ride (§4.7). **Practice leaver removed:** the ride goes with the actor.
   **Match end:** riders keep riding and pop; `dispose()` clears everything.
9. **The Bazookarp carrier.** Refused unless the leg is in `modes.bazookarp.carp`. A carrier on such a leg rides at
   0.8× speed, the fuse burns as normal and the marker stays.
10. **What one-way means physically.** A one-way leg is a pneumatic line with a current.
    - The IN end has an intake fan behind a bell mouth: it spins and hums, and dust motes stream in.
    - The OUT end has a check-valve flap: hinged clear glass that opens outward for a pop and swings shut. It is part of
      the glass wall, so nobody can enter there.
    - Chevrons etched in the glass light in sequence in the flow direction, all the time.
    - A two-way leg has an identical flap at both ends and plain glass with brass bands. Its chevrons light only while
      someone rides, flowing the way they ride.

    Signs carry the meaning before colour does:
    - a roundel over each end: "▶ IN", "OUT ONLY" with a bar, or "⇄";
    - on the minimap, one-way legs have moving arrowheads and two-way legs a dot at each end.

    Nothing on a pipe is tinted in a team hue except the rider's own glow.

### 3.6 How it looks, for the rider and for everyone else

**For everyone** (`pipesFx.js`):
- **Glass:** one merged tube geometry for all legs (20 radial segments, rings every 0.25 m on fillets and every 2 m on
  straights; attributes `aS` (arc length) and `aLeg`), drawn twice: a back-face pass, then a front-face pass. Both are
  transparent with `depthWrite: false`. The rim alpha comes from the ink-tank glass recipe: 0.06 face-on rising to 0.5
  at grazing angles.
  - It stays out of GTAO with the `noAO` trick from drainbowFx.js. It casts no shadow and receives none.
  - The glass is not drawn in the `hide` ranges.
- **The rider glow:** the shader reads `uRide[8] = vec4(leg, s, team, k)` for up to 8 riders. It lights the glass in the
  rider's team colour, 2.4 m long around the rider with a 6 m fading trail behind, so a rider is visible from across the
  map.
- **The rider:** drawn in squid form on the axis. The character root gets rotation order `'YXZ'` with pitch along the
  tangent, and scale (0.85, 0.85, 1.25): sucked and stretched. Both are restored at the pop and on any cancel. The
  showcase already uses `'YXZ'` on character roots.
- **Mouths:**
  - collars (brass or steel rings 0.3 m long at outer radius 1.0) and hangers or brackets on overhead runs, merged into
    one opaque mesh;
  - IN-end fans as one `InstancedMesh`, spinning;
  - OUT flaps as one `InstancedMesh`, hinged and animated;
  - the end rings as one instanced mesh with instance colours: white idle, the rider's team colour while lit, faster
    pulsing in the last 1.0 s;
  - the roundel signs as one instanced quad set on a small canvas atlas: "▶ IN", "OUT ONLY", "⇄", plus the end's name.

**For the rider (the camera):** `StagePipes.cam` makes `_follow` behave as in super-jump flight (horizontal ω 20, no
strafe look-ahead) and sets:
- **yaw:** `dampAngle` toward the travel heading at rate 3.5 (the last heading is kept on vertical runs). In the last
  0.6 s, toward the pop heading at rate 8, so the player lands facing out and sees who waits there.
- **pitch:** toward −0.30, and −0.15 in the last 0.6 s.
- **boom:** +0.8 m (5.3 m); FOV kick +6°.
- **probe:** run with `G.physics.skipPipes = true`, inside `try/finally`. Other pipes and the rider's own glass never pull
  the boom in; real walls and tank glass do. When the tube runs through a tank wall, the lens comes in close and the
  player sees through the tube's own glass.

Mouse input still turns the camera; the damping pulls it back gently. The HUD hides the reticle and shows a chip:
"→ JELLY HALL" with a progress bar. On a player's first three rides it adds "Hold a direction to aim your pop · JUMP:
high pop".

### 3.7 Hook-ins in shared files (each short, tagged `[b5-pipes]`)

| # | File, function | Change |
|---|---|---|
| H1 | `src/world/level.js` `Level._build` (the `extra` → def mapping) and `_addBlock` | Forward `{ seg, a, b, w, h, pipe, glass }` as `kind: 'seg'` (`paint: false, hidden: true, roof`). In `_addBlock`: `s = norm(b − a)`; `side = |s.y| > 0.999 ? (1, 0, 0) : norm(UP × s)`; `n = s × side`; `axes = [side, n, s]`; `half = (w/2, h/2, |b − a|/2)`; `center = (a + b)/2`; `aligned = false`. Copy `b.pipe = d.pipe \| 0` and `b.glass = !!d.glass`. About 12 lines. Other stages are untouched. |
| H2 | `src/game/physics.js` `Physics.raycast` | In the block loop: `if (this.skipPipes && b.pipe) continue;` One line; only the ride camera sets it. |
| H3 | `src/game/actor.js` | (a) `reset()`: `this.pipe = null; this.pipeCd = 0;`. (b) `update()`, right after the `!this.alive` block: `const pp = this.pipe; if (pp) { if (pp.phase !== 'pop') { G.match.pipes.ride(this, dt); this._finishFrame(dt); return; } const it = this.intent; it.fire = it.sub = it.special = false; this._prevIntent.sub = false; }`. (c) `damage()` after the invuln line: `if (this.pipe && this.pipe.phase !== 'suck') return false;`. (d) `canSuperJump()`: `&& !this.pipe`. (e) `jumpAnchor()` first line: `if (this.pipe) return G.match?.pipes?.anchor(this) ?? this.pos;`. About 6 lines. |
| H4 | `src/game/match.js` | Both setup paths: `this.pipes = StagePipes.create(this);` after the pods. `update`: `this.pipes?.update(dt);` after `this.pods?.update(dt)`. `dispose`: `this.pipes?.dispose(); this.pipes = null;`. Soft push loop: `if (a.pipe \|\| b.pipe) continue;`. 5 lines. |
| H5 | `src/main.js` `_buildWorldNow`, the prompts block, the frame | `colliders.push(...pipeColliders(layout));` next to `podColliders`. After `new Level`: `this.pipeNet?.dispose(); this.pipeNet = G.pipes = PipeNet.build(layout, scene, level);`, which also sets `level.extraEdges`, before `new NavGraph`. Prompts, after the specials line: `prompt = m.pipes?.prompt(a) ?? prompt;`. Frame: `pipe: m.pipes?.hud(a) ?? null`. Dispose with the world, as `podLooks` is. About 6 lines. |
| H6 | `src/game/nav.js` | (a) `_build`, after `this._climbEdges()`: `this._extraEdges();` (new method, about 10 lines). For each `level.extraEdges` spec, find the nearest node within 0.8 m horizontally and 0.6 m vertically of `a` and of `b`, then push `{ to, cost, type: spec.type, key, len }`. A spec that doesn't resolve is reported (`this.edgeProblems`). (b) `path()`, in the edge loop: `if (e.type === 'pipe') { const pc = this.pipeCost ? this.pipeCost[e.key] : 0; if (pc === Infinity \|\| (this.pipeShut && this.pipeShut[e.key])) continue; cx += pc; }`. About 14 lines. |
| H7 | `src/game/bots.js` | (a) `update()`: `if (a.superJumpState \|\| a.pipe)` in the existing early return. (b) `_steer()`, after the waypoint advance: `if (this.pi > 0) { const pe = nav.edge(this.path[this.pi - 1], this.path[this.pi]); if (pe && pe.type === 'pipe') return G.match.pipes.botSteer(this, pe, out); }`, and add `'pipe'` to the `['jump', 'climb']` exception list. (c) `_pathTo()`, before `nav.path`: `G.nav.pipeCost = G.match?.pipes?.botCost(this) ?? null;`. About 5 lines. |
| H8 | `src/game/botSight.js` `Sight.check` and `recheck` | Treat a rider like super-jump flight: `const pl = (e.pipe \|\| e.pipeNet) && G.match?.pipes?.landing(e);`. If `pl`, the memory goes to `pl` with `src: 'jump'`, `seen = false`, `continue`. In `recheck`, add `&& !pl` beside the flight test. 2 lines. |
| H9 | `src/game/weapons.js` `applyHit` | First line: `if (victim.pipe && victim.pipe.phase !== 'suck') return;`. One line. |
| H10 | `src/net/netmatch.js` | (a) `F.pipe = 4194304` (bit 22). (b) `packActor`: `if (a.pipe) f \|= F.pipe;`. (c) `applyRemote`, just before `a.character.root.visible = true; a._finishFrame(dt);`, after every flag, the form and the yaw have been applied from the sample: `this.match?.pipes?.carryRemote(a, S.f & F.pipe, dt);`. It must sit there and not beside the tower's `carryRemote`: there `const f` isn't declared yet, and `a.yaw = S.yaw` would overwrite the path's yaw. (d) `_adopt`: `this.match?.pipes?.adopt(a);`. (e) E2 only: `_sendTick` stage clock `?? this.match.pipes?.clock?.t`. 4–5 lines. |
| H11 | `src/game/cameraRig.js` `_follow` | `const piped = !!a.pipe && a.pipe.phase !== 'pop' && G.match?.pipes?.cam(this, a, dt);`. Use `flying \|\| piped` for ω and the look-ahead. Around `cameraProbe`: `G.physics.skipPipes = piped; try { … } finally { G.physics.skipPipes = false; }`. About 4 lines. |
| H12 | `src/game/minimap.js` | `_build` step 1: `if (b.pipe) continue;`. `_compose`, before `G.specials?.drawMap`: `G.pipes?.drawMap(c, this, tc, s, hex, t, me);`. 2 lines. |
| H13 | `src/world/mapThumb.js` | Draw `expandPipes(layout)` legs as pale lines with arrowheads (stage select, `check-maps --svg`). About 8 lines; three-free through pipes-data.js. |
| H14 | `src/ui/hud.js` | `frame.pipe?.riding` hides the reticle and the sub chip and shows the ride chip (name, progress, hint). The cooldown ring on the ink tank. About 10 lines. |
| H15 | `build/bake-ao.cjs` `PAGE_BAKE` | `__G.pipes?.bakeMode?.(true)` before tracing and `(false)` after. 2 lines. |
| H16 | `build/check-maps.mjs` | `checkPipes(layout)` problems are counted like overlaps. 3 lines. |
| H17 | `src/game/stageKit.js` `shovable` | `&& !a.pipe`: movers and pods never shove a rider (no effect on the aquarium; a guard for later stages). One token. |
| D1 | `docs/NET.md`, `docs/EVENTS.md` | A "Pipes" paragraph (records, flag, who decides) and the events table. |

These are not in shared engine files but are owed to other batch-5 packages:
- **Bazookarp:** the Carp Field's carrier graph keeps `'pipe'` edges only for carp-open legs, with `len` as their
  length. The Carp Blast and shell-burst instant splats skip riders (`a.pipe && a.pipe.phase !== 'suck'`). The carrier
  refusal reads `a.carry`, the SPEC's field, so no hook is needed for it.
- **Deploy (the tower crushes devices):** pipes are static; nothing to do.

### 3.8 Events (the bus: `emit` in `core/ctx.js`)

| Event | Payload | When, where |
|---|---|---|
| `pipe:enter` | `{ actor, leg, k, to: endIndex, eta }` | capture; owner, and proxies from `[0]` |
| `pipe:refuse` | `{ actor, end, why }` | owner's screen only |
| `pipe:exit-lit` | `{ actor, end, team }` | suck done; every screen |
| `pipe:chime` | `{ actor, end, pos }` | 1.0 s before the pop; every screen |
| `pipe:pop` | `{ actor, end, pos, dir, high }` | the pop; owner, and proxies from `[1]` |
| `pipe:land` | `{ actor, pos }` | touchdown; owner, and proxies when the flag clears |
| `pipe:abort` | `{ actor, why: 'splat' \| 'removed' \| 'dispose' }` | every screen |
| `pipe:junction` | `{ actor, junction, leg }` | E1 |
| `pipe:flow` | `{ leg, phase: 'warn' \| 'close' \| 'flip' \| 'open', dir }` | E2; every screen, from `StageClock` |

### 3.9 Online records (kit kind `'pipe'`, through `KIT_GHOSTS`, no change to `_play`)

| Record (`['k', nid, 'pipe', data]`) | data | Meaning |
|---|---|---|
| entry | `[0, leg, k, t0, s0]` | Capture at `t0` (the owner's `performance.now()/1000`, r3) from end k. `s0` = 0, or the arc position when a new owner re-bases an adopted ride (no suck then). |
| pop | `[1, yaw, high]` | The pop heading (radians, r3) and high 0/1: the flap, the splash, the fan cue. |
| junction | `[2, leg]` | E1: the branch taken, recorded 0.6 s before the junction. |
| turn back | `[3, T]` | E6 only. |

The tick carries `F.pipe` while `pipe` is set (suck, ride, pop).

### 3.10 Optional extensions (the lead decides; build only after the core passes step 10)

**E1: junctions.** A leg end may be `{ junction: 'exchange' }` instead of a mouth. Format:

```js
junctions: [{ id: 'exchange', at: [0, 9.5, 0],
  next: { 'halo:0': ['halo-w:0', 'drop:0'],      // arriving on leg 'halo' from its end A side → default, alternative
          'halo-w:1': ['halo:1', 'drop:0'] },
  pick: 'steer' | 'squid',                        // the alternative: move input toward it, or the squid button held
  window: 0.6 }]                                  // s before the junction in which the choice is read
```

- **Data rules:** a junction joins exactly 3 leg ends at one point, and each leg's fillet ends at the junction point.
- **Rides:** at most one junction per ride. The choice is recorded as `[2, leg]` when the window closes, so it reaches
  other screens before their copy of the rider gets there. The rider then carries on along the chosen leg at the same
  speed, and a 0.6 s circle at the junction (the Siphon Line's Exchange) is just an extra arc in the path.
- **Exits:** the exit ring of the chosen branch lights when the choice is made. Before that, both possible exits pulse
  white.
- **Nav:** one edge per IN end → reachable OUT end, so a bot's chosen edge is its branch and bots never need the steer.
- **Cost:** about 120 lines in pipes.js and one record. The risk is moderate: a third leg end on every assumption about
  "end A / end B".

**E2: clock-driven flow.** A leg's `way` may be one of:
- `{ flip: { every: 90, first: 'ab', warn: 10, close: 3, reopen: 1, quietEnd: 15 } }`: the Tubeway's Kelp Lines.
- `{ open: { fromLeft: 60, warn: 10 } }`: open only once at most 60 s of regulation are left, then through overtime (the
  Siphon Line's Drop).

How it runs:
- Everything is a pure function of `StageClock`: match time played, or the host's stage clock in Practice (H10e).
  Nothing goes on the wire.
- `pipe:flow` events drive the HUD banner (10 s countdown), the PA chime, the fans and flaps swapping ends, and the
  signs.
- IN ends close `close` s before a change. Riders already inside finish the old way.
- `nav.pipeShut` changes at close and reopen, and bots whose route uses a newly shut key replan, the same way
  `stageKit.navCommit` replans for movers.
- Twins change together, and nothing changes in the last 15 s or in overtime (rule 34).
- **Cost:** about 100 lines and the H10e token. The risk is low: the movers' clock is proven by `net-stageclock.cjs`.

**E6: turning back** (two-way legs only, once per ride, not recommended for v1). The rider holds back (move input against
the travel direction) for 0.3 s. The rider decelerates and reverses over 0.3 s, which is recorded as `[3, T]`. The other
exit lights, and the steer window applies at the new exit. Ship it only if step 7's camping metric fails after the
§7 risk-1 tuning.

**Not supported:**
- *Bomb mail* (§2.4).
- *One rider per mouth per 0.7 s*, *landing-circle shoves*, *device aprons*: these need cross-client arbitration or hooks
  in every placement path. The automatic pop fan, soft push and shootable deployables do the job.

---

## 4. What it means for each system

### 4.1 The paint grid and turf counting

- **Glass is never inked.** Pipe pieces are `hidden` blocks with no faces, so no paint cells, no atlas rects and no
  `turfTotal` change.
- **Floor buried under a pipe piece is dead turf.** `_initGrid` already marks cells whose sample point is inside a solid
  block. This affects only floor-level end runs; mouths set flush into walls bury nothing. Rule 14 caps the loss.
- **Shots on glass:**
  - they splat at the hit point as on any non-paintable wall, so a nearby floor within the splat radius takes ink as
    usual;
  - a shot hitting a low run can ink the floor under the glass, but those cells are dead and count for nothing;
  - the glass shows a cosmetic white bead that runs and fades in 1.0 s (an FX burst, looks only).
- **Pops** add a 1.2 m splat that counts as turf but doesn't charge the special.
- **Nothing is covered, revealed or removed over time.** Pipes are static, E2 included: a flip changes the flow, not the
  geometry.
- **Practice "Clear all ink"** is unaffected.

### 4.2 Colliders and physics

- About 4 pieces per 10 m of straight run and 2–3 per 90° fillet. The worked example is about 30 pieces per leg, about
  120 for 4 legs with twins. The budget is ≤ 200 pieces (§5, rule 6).
- They are static hash blocks, never `addDynamic`: dynamic blocks are scanned by every query. Ray cost was measured in
  §1.3.
- Bodies and squids stop at the glass. The tops slide anyone off (`roof`). Nothing climbs glass, because it is never
  inked. Bombs and devices bounce or stick as on any wall.
- **During a ride the actor runs no physics**: `pos` is set from the path. At the pop it re-enters physics 0.45 m
  outside the mouth plane, clear of the end piece (body radius 0.38).
- **Blasts:** `physics.los` from a blast to a rider is blocked by the glass, and the damage guard backs it up.
- **No triggers are added to physics.js.** The capture cylinder is the module's own maths.
- **`Physics.skipPipes`** is a single flag, set only inside the ride camera's `try/finally`.

### 4.3 The nav graph and bots

**Graph:**
- `PipeNet.navSpecs()` gives one directed spec per (IN end → OUT end) of each open leg: from the approach point to the
  landing point, with `cost = (0.25 + L/v + popT) × 6.0 + 2.0`, where `popT` = 0.5 for level, 0.6 for up, 0.5 for down.
  A two-way leg gives two specs and a one-way leg one.
- `NavGraph._extraEdges` turns them into `'pipe'` edges that carry `key` and `len`, before `_prune`.
- Rule 25 makes sure no area is reachable only by pipe, so `valid` and `exitable` don't depend on pipes.
- `nav.pipeShut` (one bit per key) is set by `StagePipes.create` from the mode, and by E2 schedules, which call
  `navCommit`-style replanning for bots whose route uses a newly shut key.

**How a bot knows** (no wall-hacks):
- The edges are static stage knowledge, like the floor.
- An enemy rider's landing comes from what every player sees: the rider and the lit exit (the reveal plus botSight's
  `'jump'` memory, H8).
- Exit danger comes only from the bot's own sight memory, in `botCost`:
  - +20 per enemy the bot itself saw or located within 7 m of that OUT end's landing point in the last 3 s;
  - +8 when the landing area is mostly enemy ink (`paint.regionStats` within 2.5 m, enemy share above 0.5);
  - +60 for 5 s on a key where this bot just failed to get in;
  - `Infinity` for refused keys (a carrier, `enter: 'squid'` that the bot won't satisfy).

**How a bot rides** (`botSteer`):
1. Walk to the approach point. Within 0.6 m of it, or inside the capture cylinder, steer straight along the inward axis.
   With `enter: 'squid'`, swim as well.
2. Capture happens through the same test as for players, and the early return holds the bot during the ride. Bots never
   steer a pop, so they land on the predicted landing node and the path's next waypoint is reached at once.
3. If the bot pushes at a mouth for 2.0 s without capture (blocked by a body or a curtain): drop the path and mark the
   key bad for 5 s.

**What follows from existing behaviour:** A* takes pipes when they are cheaper, including in retreat and refill routes.
Defenders treat an enemy rider like a super-jump landing: memory there, aim there, maybe a lob there. In Zone Control,
the zone plan's paths include pipes automatically.

**Optional tactics (step 9b)**, each a few lines in `botSteer` / `botCost`:
- a low-hp bot being chased gets −6 cost on keys within 6 m;
- a respawned bot whose spawn exit it saw camped (2+ enemies) gets −8 on one-way legs leaving its deck.

### 4.4 The camera

Described in §3.6. Rules 9 and 11 keep it comfortable:
- overhead runs over routes sit 3.4–9.0 m up;
- a fillet's yaw rate at 18 m/s and r 2.0 is 9 rad/s, damped to at most about 3.5 rad/s of camera turn.

Other players' cameras collide with pipe glass as with any wall, which is consistent with tank glass. The TAB map
diorama renders the real scene, so riders and glows show there with no extra work.

### 4.5 The HUD and the maps

**Prompts** (`StagePipes.prompt`):
- At an open IN end, within 2.5 m and facing it: "Walk in to ride → JELLY HALL" (or "Swim in to ride → …" with
  `enter: 'squid'`).
- The refusal lines from §3.5, rule 2.
- While riding, the ride chip.
- At match start: one 6 s line, "SIPHON LINE: walk into a pipe to ride · ⇄ both ways · ▶ one way".

**Minimap and TAB map** (`PipeNet.drawMap`):
- legs as pale double lines, with moving arrowheads on one-way legs and end dots on two-way legs;
- E2 flips animate the arrows;
- each rider as a dot moving along the line in its team colour, for everyone, because riders are revealed;
- each lit exit as a pulsing ring in the rider's colour;
- a shut leg dimmed and dashed.

**Stage select thumbnail and `check-maps --svg`:** legs drawn as lines (H13).

**Name plates:** teammates keep their markers while riding. The batch-5 super-jump alerts work unchanged: a jump to a
riding teammate lands at that teammate's exit through `jumpAnchor`.

### 4.6 The lightmap bake and stage variants per mode

- Pipe pieces have no faces, so `layoutHash` and the lightmap layout don't change. The AO bake treats pipes as
  non-solid through `bakeMode` (H15). Glass casts no AO, and floors under glass bake lit. Bake once after the last pipe
  or collider change, as usual. It is a Mac mini job.
- **No mode variants for pipes.** Per-mode differences are `modes.<mode>.shut` and `carp`, which are runtime state: same
  geometry, same world key, one bake. `layoutFor` passes `LAYOUT.pipes` through untouched. Do not tag pipes with
  `onlyIn` / `notIn`; the format has no such keys.

### 4.7 Online

**Who decides what:**
- **The rider's owner** decides capture, refusal, the ride, the pop and the touchdown.
- **Nobody else can change a ride:** riders take no damage, are never shoved and never collide.
- **The host** decides nothing about pipes. Pipes have no clock, except E2 schedules, which run on `StageClock`, the same
  on every screen.

**Records and wire cost:**
- Two records per ride, `[0]` and `[1]`, plus the flag bit. That is about 60 bytes per ride, and nothing per frame.

**Drawing:**
- **Proxies:** see §2.2. If `T` passes the end before `[1]` arrives, the rider is held at the mouth.
- **The exit light and chime** run on each screen from its own copy, so they appear in step with what that screen draws:
  about 100 ms after the owner's real time, the same lag as every remote action.
- **Damage on other screens:** a shot at a rider is dropped by the shooter's `applyHit` (proxy `pipe` set from `[0]` or
  `pipeNet`). If it gets through on a timing edge, the owner's `damage()` drops it.

**Late join** (Practice only; rooms lock during matches):
- The joiner sees `F.pipe` on a proxy with no `[0]` record.
- `carryRemote` projects the sampled position onto the nearest leg within 1.2 m (`nearestOnLeg`, with the direction
  from `vel · tangent`) and draws from there at the leg's speed.
- Rule 30 keeps legs 2.5 m apart, so the projection can't pick the wrong leg.

**Host change or disconnect mid-ride:**
1. The new owner's `_adopt` calls `pipes.adopt(a)`.
2. It turns the proxy ride into an owned ride at the proxy's current `s`, sets `t0 = now − T`, and records `[0, leg, k,
   t0, s]`.
3. Every other screen re-bases on the new owner's timeline. A proxy ride stores its owner's id. When `onLeave` hands
   the actor to a new owner, `carryRemote` switches to projection (as for a late joiner) until the re-based `[0]`
   arrives, because the old `t0` belongs to the old owner's clock. The netmatch handoff offset smooths the 0–0.1 m step.
4. The ride finishes and pops on time.
5. A proxy that was already in `pop` just carries on: physics, shield until touchdown.

**Practice leaver** (removed, not adopted): `actor:removed` clears its lights. **Stage swap:** a new world, new pipes.
**No new message types** reach the relay.

### 4.8 Performance against the Halyard budget (334 draw calls / 3.0 M tris / 3.75 ms cpuRender, loadMs ≈ 6.8 s)

| Item | Cost |
|---|---|
| Draw calls | Glass back + front (2), collars and brackets (1), fans (1), flaps (1), end rings (1), signs (1): **≤ 7**. Riders are characters already counted. |
| Triangles | Glass: ≤ 360 m of centreline × about 1 ring/m × 40 tris × 2 passes ≈ 29 k. Hardware ≤ 40 k. **Total ≤ 70 k** (budget cap 120 k). |
| Per-frame CPU | Captures: ≤ 8 own actors × ≤ 24 ends, about 200 cylinder tests (≈ 10 µs). Rides: one LUT lookup per rider. Uniforms: 32 floats. Fans and flaps: ≤ 24 instance matrices. **≤ 0.1 ms**, plus the ray cost below. |
| Ray cost | +13–23 % per random ray at 132 pieces, +56 % at 264 (§1.3). Capped at 200 pieces, so expect +20–35 % on rays at pipe heights. Floor-level probes mostly skip pipe pieces by their y range. **Prove it:** `shoot.cjs PLAY=20` perf on the fixture vs halyard, sim time ≤ +0.3 ms. |
| Load | Expand and LUT < 1 ms. Tube geometry < 5 ms. ≤ 200 more blocks: Level build +0 ms; nav build unchanged (77–102 ms measured, run noise). Minimap unchanged. **≤ +15 ms.** |
| Memory | LUTs ≈ 6 floats × 10 / m × 360 m ≈ 86 KB. Geometry < 1 MB. Canvas sign atlas 512² (1 MB). |
| GPU | Two transparent passes over the tube's screen area; cheap fragments (fresnel, 8-slot loop). Inside a tube the camera sees the whole glass at once: check the frame time in a 50 m ride shot on the web build. |

---

## 5. Rules for the level designer (hard limits)

**Counts and sizes**
1. **6 leg definitions at most** (12 legs with twins), and **at most 24 ends**. At least one one-way and one two-way
   leg, because the user said "some … some".
2. Leg length:
   - at least 12 m; a one-way leg ending in an `up` or `down` nozzle (a lift or a drop) may be as short as 3 m;
   - at most 3.5 s of ride: 63 m at 18 m/s, 84 m at 24 m/s;
   - total centreline at most 360 m. The Siphon Line concept totals ≈ 290 m and the Tubeway ≈ 310 m.
3. The bore is fixed: inner diameter 1.60 m, outer 1.76 m. The collider is a 1.60 m square.
4. Fillet radius `bend` ≥ max(1.5, speed²/220): 1.5 m at 18 m/s, 2.6 m at 24 m/s. Each run is at least the length of
   its two fillets plus 0.1 m.
5. Speed per leg is 12–24 m/s. Above 18 m/s only on legs with no end within 25 m of mid (expresses).
6. At most **200 collider pieces** in total (`pipe-audit` prints the count) and at most 120 k triangles for pipes and
   their hardware.

**Ends**
7. **Level ends:** the end run is level, with ≥ 0.5 m of straight tube before its fillet. The mouth centre is 0.80 m
   (±0.05) above the mouth floor. The axis is horizontal.
8. **In front of every IN end:** walkable, inkable, flat floor (±0.1 m), 2.0 m deep × 2.4 m wide, with nothing solid
   from 0 to 2.2 m above it. A nav node within 0.8 m of the approach point.
9. **The pop fan of every OUT end** is a sector of radius 7.0 m, ±60° around the outward axis:
   - walkable floor at most 3.4 m below the mouth floor (never water, void or roof);
   - no block taller than 0.5 m within 4.5 m along the axis ±30°;
   - headroom ≥ 3.2 m above the mouth floor over the whole sector;
   - a nav node within 0.8 m of the landing point.
10. An OUT-only level end may sit up to 3.4 m above its landing floor (a drop). Two-way ends sit on their floor.
11. **`up` nozzles** (OUT only): the last run is vertical and ≥ 1.0 m long. The nozzle is flush with a walkable floor.
    The `land` point is ≤ 2.0 m above the nozzle and 1.0–2.0 m from it along `heading`.
    **`down` nozzles** (OUT only): the floor below is ≤ 4.5 m down, and the 2 m circle under it is walkable.
12. **Exit protection geometry:** within 4 m of every landing point there is cover ≥ 1.0 m tall, and at least two walking
    ways off, leaving in directions at least 90° apart. Every exit is overlooked from somewhere, so a camper is exposed
    too.
13. Every IN end's mouth ring is in line of sight from 10 m out along its axis: no hidden mouths.

**Where pipes may run**
14. At walkable floor level **only within 4.0 m of an end**. Floor buried under pipes ≤ 1 % of turf. Prefer mouths set
    flush into walls, tank fronts or tier fronts, with the end run buried in them.
15. Everywhere else, the glass bottom is either ≥ 3.4 m above every walkable surface beneath it (a swim-jump apex of
    1.77 m plus a 1.45 m kid plus margin), or buried in or behind solid geometry (mark the buried arc with `hide`).
16. Overhead runs and junctions are at most 11.0 m up (their top), so the ride camera and the TAB map read.
17. Glass is ≥ 1.0 m from any walkable top beside it horizontally, unless that top is ≥ 1.9 m below the glass bottom
    (no stepping onto pipes; they are `roof` anyway).
18. No glass inside a tank's water volume unless the tank's own glass is a solid block around it (the rider is seen
    through two layers: fine).

**Distances from objectives** (xz, from any end or landing point)
19. Spawns:
    - No IN end within 6.0 m of either spawn pad (outside the 4.2 m barrier plus a margin).
    - An IN end within 15 m of a pad is one-way and leads away from it.
    - No landing point within 22 m of either pad (the spawn deck and its first exits stay pipe-free, so nobody pops
      into a spawn or out of one).
20. **Zone Control:** no end within 3.0 m of a zone outline, and no landing point within 3.0 m of it, at any height.
21. **Tower Command:** glass ≥ 1.0 m from the platform's swept volume (2.5 m square plus 3.72 m headroom along the
    whole track). Pop fans ≥ 2.0 m off the track.
22. **Bazookarp:**
    - No end within 15 m of a Gate.
    - A leg whose landing point is within 15 m of a Gate is listed in `modes.bazookarp.shut`.
    - `carp` legs must pass bazookarp-check's entrance rule, with a pipe exit counted as an entrance.
    - No weir, Gate or Pond inside a pop fan.

**Routes**
23. Symmetry: `mirror: true`. A `single` leg is its own 180° twin (checked).
24. Ends of different legs are ≥ 6 m apart (xz) unless their floors are ≥ 2.4 m apart in height, so mouths never cluster
    into one ambiguous spot.
25. **Pipes are shortcuts, never the only way.** Both ends of every leg are connected on foot both ways (nav path with
    pipe edges off).
26. A leg's suck + ride + pop time is 0.35–1.0 × the swim time (11.8 m/s) of the shortest walking route between its
    approach and landing points. It is never slower than swimming there (or nobody rides) and never a teleport. The
    Tubeway concept sits near 1.0 on purpose (its value is safety and new routes, not speed); the Siphon Line near
    0.6–0.8.
27. With pipes, the fastest spawn-to-mid time is ≥ 4.5 s. The Long Stages standard is 6 s ± 10 % on foot; pipes may cut
    it by at most 25 %.
28. Each half keeps 2–4 flank routes with pipes shut (they are measured both ways).

**Looks and readability**
29. Names are ≤ 14 characters. Signs, fans and flaps come from the engine. Nothing on a pipe is tinted in a team-like
    hue.
30. Leg centrelines are ≥ 2.5 m apart wherever they pass each other, except at an E1 junction. This keeps late-join
    projection unambiguous and two glows readable.
31. Pipe hardware (collars, brackets, fans) never forms cover. Real cover near pipes is stage props with colliders.

**Modes**
32. Pipes are open in every mode unless listed. Boss Battle: `'open'` (default) or `'off'`.
33. On a boss stage, no glass bottom below 5.3 m over the boss floor inside HULLBREAKER's home region. BossNav reads it
    as a wall. Otherwise set `noBoss` or `modes.boss: 'off'`; the glass still stands.
34. **E2 schedules:**
    - nothing opens, closes or flips in the last 15 s of regulation or in overtime (it holds);
    - a 10 s warning before every change, and IN ends close 3 s before it;
    - both twins change together (symmetry at every moment).

---

## 6. Build plan (each step ends with a test that fails without it)

**The fixture.** `tools/botlab/tests/pipes-fixture.js` mutates a copy of `MAP_LAYOUTS.halyard` in the page and forces a
rebuild (`worldKey = null`), the same approach as bluestone's eras fixture. It adds:
- `fx-west`, one-way, on Alpha's half: IN on the west boardwalk near (−22.5, 0.8, −40) facing −z, rising to y 5.6 and
  coming down to an OUT end near (−13.5, 0.8, −13) facing +z. The twin is mirrored.
- `fx-mid`, two-way, `single`: ends near (−15, 0.8, −10) and (15, 0.8, 10), both facing the centre, crossing mid at
  y 7.5.

The step-1 builder tunes the points until `pipes-audit.js` passes on the fixture.

Page tests run through `MAP=halyard PAGE=tools/botlab/tests/<name>.js tools/botlab/run.sh tools/botlab/page.cjs`
(`WATCHDOG=900000`). Electron runs only through `run.sh`.

| # | Step | Test (in `tools/botlab/tests/`) |
|---|---|---|
| 1 | **pipes-data.js:** expand, mirror, fillets, LUT, `helix`, `checkPipes`. check-maps hook (H16), mapThumb (H13). | `pipes-world.js` part 1. Arc length matches the analytic length within 1 cm. The tangent is continuous (≤ 2° between LUT steps). A twin's points are the exact 180° turn. A `single` that isn't symmetric is reported. Each §5 static rule gets one deliberately broken leg that must be reported. `node build/check-maps.mjs` still prints "ok" for all 13 stages. |
| 2 | **Colliders** (H1, H2), `PipeNet.build` without looks. | `pipes-world.js` part 2. Rays from 16 directions at the tube stop between 0.80 and 1.13 m from the axis. A kid walking into a side stops with its centre ≥ 1.18 m from the axis. A squid can't pass. No nav node inside a piece. `layoutHash` is identical with and without pipes. `skipPipes` lets a ray through only while set. Piece count reported. |
| 3 | **Nav edges** (H6). | `pipes-world.js` part 3. One edge per open IN→OUT pair (one-way 1, two-way 2), with the expected cost (±0.1). `path()` takes the pipe when it is cheaper and walks when `pipeShut` is set. `_prune` counts are equal with pipes on and off (rule 25 on the fixture). |
| 4 | **Ride core** (H3, H4, H9): capture, suck, ride, pop, shield, touchdown, cooldown, refusals, statuses, offline time base. | `pipes-ride.js`. Strafing past or standing still never captures. Pushing in captures within 0.08–0.12 s. OUT end, carrier stub, special, cooldown and squid-only each refuse with their own `why`. The ride takes L/v ± 1 frame. Every frame `pos` is within 0.02 m of the centreline + lane − 0.3 m. `damage()` is false and no `'hit'` event fires during ride and pop. The suck does take damage, and a splat there cancels the ride. A level pop with no input lands 2.9–3.3 m from the mouth on the fixture floor, a high pop ≥ 4.3 m, a steered pop within 45°. No fire, sub or special until touchdown, and a sub held through the ride is not thrown at the pop. Touchdown splat; cooldown 2.5 s; no `hardLand`. Soft push skips riders. |
| 5 | **Looks** (pipesFx). | `pipes-look.js`. Pictures: a rider mid-pipe from outside at 5 / 15 / 40 m; the glow; one-way vs two-way ends; flaps; signs, day and dusk. Draw calls `renderer.info` delta ≤ 7. A GTAO pixel probe under a pipe shows no darkening at high quality. A rider inside the glass is visible (pixel colour in the rider's ink at its projected point). |
| 6 | **Camera** (H11). | `pipes-cam.js`. During a ride the boom is never < 2.5 m because of pipe pieces. The yaw is within 15° of the pop heading at the pop. `skipPipes` is false after every frame, including after a thrown error. Pictures from the rider's view at the start, mid-fillet and 0.3 s before the exit. |
| 7 | **Bots** (H7, H8), `botSteer`, `botCost`. | `pipes-bots.js`. A bot with a forced goal at a landing point uses the pipe, arriving within ride time + 3 s. A bot that saw 2 enemies at an exit walks instead. A blocked mouth (a body in front) is given up within 2.5 s and marked bad. An enemy rider gives botSight a `'jump'` memory at its landing and is never `target`. **Mac mini:** 6 Turf War matches on the fixture vs 6 without pipes, reporting stuck % (≤ baseline), rides per bot-minute (≥ 0.3), bots pushing at a mouth > 3 s (0), and deaths within 2 s of a touchdown vs the match's deaths per 2 s of play (the camping metric). |
| 8 | **HUD and maps** (H5, H12, H14), reveal. | `pipes-hud.js`. Each prompt string appears in the DOM in its case. The reticle is hidden while riding. The minimap draws the legs (pixel hash differs from no-pipes). A rider's dot is on the enemy's map. The exit ring pulse runs from suck end to pop. |
| 9 | **Online** (H10), records, adopt, late join. | `net-pipes.cjs`, below. Plus `node tools/net-test.mjs --net "netlag=80&netjitter=40"`: no kink reports on riders. |
| 9b | Optional bot tactics (escape, spawn-camp exit). | `pipes-bots.js` part 2, and a Mac mini A/B against step 7's numbers. |
| 10 | **Modes:** zones, tower, bazookarp `shut` / `carp`, boss `'off'` / `'open'`, attract, Practice. | `pipes-modes.js`. A shut end refuses and its nav keys are skipped. A carrier is refused unless `carp`. A boss match on the fixture starts. The attract backdrop's bots ride. Practice rides. `tower-check.cjs` on the stage shows no clearance hit from glass. |
| 11 | **E1 junctions, E2 schedules** (only if the lead takes them). | `pipes-sched.js`. With a short schedule, flips happen at the scheduled times ± 1 frame offline and ±0.4 s across two clients (`net-pipes.cjs` part 2). Ends close 3 s before. Riders inside finish the old way. Bots replan off newly shut keys. A junction choice by steer is recorded and drawn on both screens. |
| 12 | **The stage audit** on the real `aquarium` blockout. | `pipes-audit.js` (`MAP=aquarium`): every §5 rule that needs the Level, nav or paint (approach floors, pop fans, headroom, cover near landings, walking alternatives and the 0.35–0.8 ratio, spawn-to-mid with pipes, flank counts with pipes shut, buried turf %, piece count, line of sight to mouths). |
| 13 | **Bake and regressions.** | Mac mini: `tools/botlab/run.sh tools/botlab/bake.cjs aquarium`, then `stage-audit.js` reports "lightmap applied". Regressions: `world-build.js`, `movers.js`, `pods.js`, `treehills-pods.js`, `stage-audit.js` on halyard / calamari / treehills, `net-turf.cjs`, `net-practice.cjs`, `net-stageclock.cjs`, `net-surf.cjs`, `node build/check-maps.mjs`. No stage without `LAYOUT.pipes` gets a block, an edge, a flag bit or a draw call (asserted in `world-build.js`). |

**`net-pipes.cjs`** (`CLIENTS=2 Q0=autopilot Q1='autopilot&netlag=80&netjitter=40'
NET=tools/botlab/tests/net-pipes.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`; both clients run the fixture before
`start()`):
1. Online Practice on halyard with 2 host bots; A (host) and B (guest) on opposite teams.
2. **B rides `fx-west`.** B is teleported to the approach point and pushes in for 0.3 s. On A's screen, B's drawn
   position is within 0.05 m of centreline + lane every frame of the ride. On B's own screen, `pos` matches the path
   exactly.
3. **A's exit ring** for that end is lit from B's suck end to B's pop. Mapped to B's timeline, the times differ by
   ≤ 0.15 s.
4. **A's bot fires at B mid-ride:** B's hp is unchanged and A records no `'hit'` event with B as victim. After B's
   touchdown, A's bot hits B and damage applies.
5. **Two-way traffic:** B and A's bot ride `fx-mid` in opposite directions at once. Each pops at the right end on both
   screens, 0.56 m apart laterally while passing.
6. **Host change:** A's bot enters `fx-mid` and A leaves. B becomes host and adopts the bot mid-ride. It pops within
   ±0.3 s of the expected time. On a third client C (opened with `open(2, …)`), the drawn rider stays within 0.1 m of the
   centreline across the handoff.
7. **Late join:** C joins Practice while a bot is 1 s into `fx-mid`. C draws it within 0.3 m of the centreline, and C's
   `applyHit` drops a forced shot at it.
8. The turf around both landings is equal on A and B (`exportGrid` diff limited to those cells = 0).

---

## 7. Risks and unknowns (and how to find out)

1. **Exit camping or escape abuse.** Pipes could become death traps (campers kill every arrival) or free escapes
   (untouchable, then gone).
   - *Find out:* the step 7 camping metric (deaths within 2 s of a touchdown against the match's base rate), rides per
     bot-minute, and the user playing it.
   - *Tune in this order:* the pop shield cap (0.8 s), the steer angle (45°), the high pop, cooldown (2.5 s), the suck
     window. If none suffice, ship E6 (turn back once on two-way legs, one record).
2. **"Glass you can see through but can't shoot through" confuses players.**
   - *Find out:* the user's first match; watch for shots wasted on glass.
   - *Fix:* the glass bead FX and the `pipe_tok` on shot hits make it obvious. As a last resort, `glass` could pass
     shots, which is a one-line flag change, but riders would then need the rule guards only.
3. **Remote drawing under bad connections and handoffs.**
   - *Find out:* `net-pipes.cjs` with `netlag=80&netjitter=40` and with `netspike=0.02`, then `net-test.mjs` kink and path
     error on riders.
   - *Fix:* hold-at-mouth on a missing `[1]`, and re-basing on adopt, both already designed.
4. **Motion comfort and clipping of the ride camera** at 18–24 m/s through fillets and tank walls.
   - *Find out:* step 6 pictures and a short video for the lead and the user.
   - *Tune:* yaw rate 3.5, minimum bend 2.0 m on legs that cross mid, the 0.6 s exit framing.
5. **Ray cost.** 200 pieces could cost more than the +20–35 % estimate on stages full of bots.
   - *Find out:* step 2 prints pieces; `shoot.cjs PLAY=20` perf and `match.cjs` frame times on the fixture vs halyard.
   - *Fix:* longer straight pieces (6 m), fewer fillet pieces, or a per-piece `high` flag that body queries skip.
6. **Collider corners (25 cm at 45°)** stop a grazing shot in the air beside the glass.
   - *Find out:* a raycast grid around a tube in `pipes-world.js`, and pictures of shots splashing at 45°.
   - *Fix:* collider 1.46 m (±15 cm both ways). It is one constant.
7. **Transparent sorting.** Pipe glass, tank water and glass, the Drainbow film and riders' own ink tanks could flicker
   or disappear behind each other.
   - *Find out:* step 5 pictures through a tank, inside a Drainbow, and at dusk.
   - *Fix:* fixed `renderOrder` bands (tanks < pipe back < pipe front < films), and the back pass drawn only from
     inside tubes if needed.
8. **Bots at mouths.** They could approach off-axis, oscillate at the approach node, or overuse pipes into telegraphed
   deaths.
   - *Find out:* step 7 sweeps and the camping metric for bots.
   - *Tune:* `costFixed`, the danger terms, the 0.6 m axis snap.
9. **Interactions with other batch-5 work.**
   - The Bazookarp Carp Blast and its instant splats must skip riders.
   - The Zipline tether can latch onto glass, which is allowed and looks odd: decide with pictures.
   - Cheer Orb rising, and Ink Jet users hovering near mouths, are refused because they are specials.
   - The new subs (dash bomb, turret) hitting glass need no hooks.
   - *Find out:* step 10 and the integrator's regression list after each merge.
10. **Late-join projection with legs close together**, and E1 junctions.
    - *Find out:* `net-pipes.cjs` step 7 on the real stage, and the rule 30 audit.
11. **Readability for a first-time player.** Will they read one-way vs two-way, and know where a pipe goes?
    - *Find out:* pictures of each end type, then the user playing the blockout.
    - *Tune:* the signs, the flap rattle, the chevrons and the first-match hint.
12. **Merge conflicts.** `actor.js`, `bots.js`, `netmatch.js`, `match.js`, `main.js` and `level.js` are also touched by
    bluestone (eras), caldera (lava), Bazookarp, zipcheer and jumpui.
    - *Mitigate:* every hook is ≤ 6 lines and tagged `[b5-pipes]`.
    - Land H1–H4 and H10 as one integration commit early.
    - The flag bit (22) and any new tick field are assigned by the integrator; Bazookarp uses `specialNetState`, not a
      new bit.
    - Run the step 13 regressions after each merge.
13. **Spawn-to-mid and route rules interact with the stage's macro shape** (a ring of galleries). Pipes across the tanks
    could make the ring's far side too close.
    - *Find out:* `spawn-mid.js` with pipes on and off, and the rule 26–28 audit on the blockout before any detailing.
