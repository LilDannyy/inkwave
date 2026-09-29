# Spirhalite Islands (`spirhalite`): the Long Stages stretch

Branch `stretch-spirhalite` (from `new-stages` 0cd3945). Code: `src/world/stages/spirhalite/` — `outline.js` (the S and
the stretch), `layout.js`, `props.js`, the new `props-slice.js`; `props-ruins.js` (the causeway's posts). Pictures and
scratch scripts: `out/spirhalite/`.

## The cut and Δ

- **Δ = 22 m along the spawn axis** (mid → Alpha's pad (8.5, −36), 13° off −z): the shift is (5.06, −21.41)
  (`outline.js` `STRETCH` / `SHIFT` / `sh(x, z)`). Alpha's pad moves from (8.5, −36) to (13.56, −57.41); the straight
  spawn → mid distance from 37.0 to 59.0 m. (21 m first: the tower's detours came out 5 m short and spawn-mid at the
  band's floor; 22 fixed both.)
- **The cut** follows the S: everything on the **bottom stroke and the tail** moves as a unit — the camp islet (Deep
  Cut's camp, its crest), the pinch, the helipad islet (the pad dune, the shoulder, the helipad, the helicopter's rear
  pad), their shores, kerbs and dressing, the tower's goal. It runs just south of the side zone (the zone's south edge
  at z −25.6, the shoulder's old north edge at −26), round the causeway's broken south end (−26.2) and the Arch spit's
  root (−24.4). Everything north of it stays: the central sandbar and the Great Arch, both mid islets, the bend's
  causeway and neck, the pillar islet (the side zone, unchanged, still 20.5 m from mid) and the Arch spit.
- In code the base's pieces and placements are **written where they stood before** and wrapped in `moved([...])` (or
  `sh(x, z)` for outline points), so the old plan still reads in the numbers. The slice's new shores are named
  (`DIG_SEA`, `DIG_LAGOON`, `TIDE_E/W`, `FORD_E/W`, `PILLAR_S`, `SPIT_SEA/BAY`) and the shore kerbs are laid along the
  same points.
- **The S is kept**: each half's bowl is 22 m taller, so the stage now reads as two long lobes joined by the arch's
  sandbar, the S still drawn by the band (middle stroke → bend → bottom stroke → the spit back up the lagoon's mouth).
  Land 3552 → 5103 m² (+44 %, the bridges not counted); bounds ±37 × ±46.5 → ±37 × ±67.

## The slice (each half, between the side zone and the base)

**The tide-pool islet** (the concept's islet, in the bend of the S between the camp and the arch sandbar): a rock islet
on a sand tombolo from the helipad islet, in the lagoon south of the pillar islet. On its rocks stands the watch-post's
old stone terrace (the **shelf**, 1.3 m, 7.4 × 8.1 m) and on that the **ruined watch-post** (its floor at 2.5, broken
parapets on the north and east, a blocked doorway and a band of glyph roundels, the old beacon bowl in the parapet's
corner with Deep Cut's storm lantern in it — the post's light at dusk). The upper storey's north-east corner still
stands as a **broken tower stub to 8.8 m** with an arched window and the expedition's pennant on top: the landmark,
seen from mid past the cascade pillar (`out/spirhalite/mid-to-watchpost.jpg`). Rock pools on its west beach, on the
shelf and by the bay head (glossy water, weed, anemones, a starfish), boulders along the shelf's foot at the water.
**The strategic point** is the shelf and the post on it: every route through the centre crosses it or passes under it,
it looks back at mid, the post's parapet is cover facing mid and the east bay, and it is one step from the base's
front (the defenders re-form on the tombolo behind it).

**Its crossings** — the concept's two ways across, from the pillar islet (the side zone):
- the **rope bridge** over the notch, a plank walkway on sagging rope handrails (rails) that climbs from the pillar
  islet's south beach straight onto the shelf (the high route, 1.3 m at the top);
- the **sandbar ford** on the west, a 3 m neck of wet sand the tide runs over, with worn stepping stones and a rope on
  driftwood stakes along both edges (the low route, onto the islet's beach under the shelf).
Plus two **log bridges** (the expedition's, like the two at mid) that I added: the **dig bridge** across the lagoon
from the bend's lane to the islet's west beach (12 m, a mossy boulder beside its middle), and the **east bay bridge**
from the Arch spit's bay side to the pillar islet's south-east shore (7 m).

**The dig** (the bend's new ground, between the causeway's broken end and the camp): Deep Cut follow the causeway
under the sand — a 3.5 m trench, 1 m deep, its floor the old paving exposed, timber shoring on its walls, a ramp at
each end; spoil heaps (dug, damp sand with shovels in them) and a sieve on trestles on the strips either side, a
barrow, the **finds shelter** (tarp and table) at its north end by the causeway's landing, work lights aimed into it,
lanterns and path lights; a spoil mound (1.3) at its south-west corner with crates and a work light on it; rock pools
and a palm on its sea shore.

**The spit's root**: the Arch spit carried 20 m on to the tail — a low dune, Deep Cut's **supply drop** (a pallet of
crates in its cargo net, the orange-and-white parachute collapsed behind it), a mossy rock outcrop and a rock pool on
the sea side, a palm, driftwood, a life ring.

**The base's front**: blocks fallen from the watch-post dragged onto the camp islet's north beach, camp crates and fuel
drums along the camp's edge, Deep Cut's cargo lashed round the helipad's rim (clear of the spawn circle and both stairs),
grass and flowers on the tombolo.

### Why these changes to the concept

- **The islet is tied to the base by a tombolo**, not free in the lagoon: the defenders re-form on it (the brief's
  spawn depth and back area), and the strategic point sits on the centre route every carrier takes, not beside it.
- **The two crossings are different**: the rope bridge is the high road straight onto the shelf, the ford the low road
  under it — attackers pick their height.
- **The two log bridges** are the brief's "link across the slice" and the lead's "a lobe isn't a dead end": the stretch
  put water between the side zone and the tail (the old zone had the tombolo's beaches to the east bay's head and the
  lagoon's south shore); the east bay bridge gives the zone back its way in from the spit lane, the dig bridge gives the
  bend's lane the strategic point without the long way round. In the first zones match after the stretch, before the
  east bay bridge, one team never got into the other's side zone (shares A 3 / B 100); with it both teams took both
  side zones (below).
- **The dig**: one islet only fills the centre; the bend and the spit also grew 20 m. The dig carries the causeway's
  story on under the sand, and the trench gives the tower a detour that is a place, not a loop drawn on sand.

## Routes (Alpha's half; nav lengths from `out/spirhalite/routes-goal.js`, mid → the Bazookarp goal spot)

| route | m | s (swim) |
|---|---|---|
| centre: pillar bridge → the pillar islet → the rope bridge → the shelf → the tombolo → the shoulder | 66.0 | 5.6 |
| centre: … → the ford → the tide-pool islet → the shoulder | 66.9 | 5.7 |
| east: the spit bridge → the Arch spit → its root → the shoulder's east slope | 82.8 | 7.0 |
| west: the mid islet → the neck → the dig → the dig bridge → the tide-pool islet | 98.0 | 8.3 |
| west, outer: the causeway → the dig → the camp islet → the pinch → the base | 124.9 | 10.6 |

Cross links in the slice: the dig bridge (bend ↔ the islet), the east bay bridge (spit ↔ the pillar islet), the ford and
the rope bridge (the pillar islet ↔ the islet), the camp islet's north beach (the dig ↔ the tombolo). The spawn keeps
its two stairs (north onto the shoulder, west onto the arm) and the rim's drops.

## Every mode

- **Turf War**: bots 0 % stuck in both 180 s matches (longest episode 0.25 s); water splats 1–5 per 180 s
  (`water-log.js`: sporadic, mostly fights on the old middle stroke's shores; the new shores' kerb gaps it found — the
  east bay's head, the east bay bridge's landings, the ford's corner — are closed).
- **Zone Control**: centre and side zones unchanged (the side zone round the cascade pillar, 20.5 m from mid). Final
  full zones match: Bravo on time 74 vs 70, the side zone contested (sideA shares A 76 / B 45, A 100 / B 60,
  A 93 / B 52), stuck 0.4 %, water 2. (Before the east bay bridge one match had a side zone nobody but its owner ever
  entered, A 3 / B 100; see above.)
- **Tower Command** (two checkpoints): the track keeps the user's drawing — along the central sandbar and the mid islet's
  north shore, climb the causeway's sheer end (checkpoint 1 at its foot, unchanged at 37 m), along it, drop off its
  broken end — then its detour loops: round the dig in three legs (out along the sea shore, back up **through the
  trench** down its ramp and up the other, down the lagoon shore), along the camp islet's north beach between the
  fallen blocks and the camp, up the tide-pool islet's west side and **climb onto the shelf**, along it under the
  watch-post (**checkpoint 2 on the shelf**, the strategic point) and drop off its south face to the goal at the
  islet's foot, 13.6 m from the pad. Square corners, two climbs and two drops (the ramps into and out of the trench are
  inclines). **174.0 m / side** (target 176.2, −1.2 %), speed 1.101 → 2.175 m/s, **100 s to the goal**; tower-check:
  0 holes, 0 issues, both rides a knockout with nobody knocked off. Tower match: Bravo (neutralised in overtime), counts 69 vs 24, best
  pushes A 46.5 m / B 144.9 m, both teams cleared a checkpoint, stuck 0.4 %, 0 s stuck by the tower (an earlier match:
  Alpha on time 25 vs 42, pushes 143.1 / 105.2 m). Pictures: `tower-plan.jpg` (the loops), `tower-rail-top.jpg`,
  `top-tower.jpg`.
- **Boss Battle**: HULLBREAKER's home ground 478 m² on the base islet, walked 34 m in 150 s, never stuck, never off
  its floor, plays its moves (charges included) (`out/spirhalite/boss-check.js`).

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint**: the tide-pool islet's shelf in front of the watch-post's steps, **(0.4, −39.8), y 1.3**. Contested:
  it is the hinge of the centre route (mid → shelf 48.8 m), reached from the mid side by the rope bridge (onto the
  shelf itself), the ford (under its west face) and the dig bridge (the islet's west beach), from the base side by the
  tombolo and the shelf's south sand slope; the watch-post (2.5) and its parapet stand over it, the pillar islet and
  the notch in front of it, the view runs back to mid past the cascade pillar. Tower Command's checkpoint 2 is on the
  same shelf, 3 m east.
- **Goal**: the shoulder in front of the helipad's north stair, **(9.8, −49.5), y 1.3** (8.8 m from the pad's centre,
  below the deck's edge, in the defenders' view from the pad). Routes: from the tide-pool islet's tombolo up the
  shoulder's west slope; from the spit's root up its east slope; from the camp islet and the pinch along the pad dune's
  arm and round the north stair's foot.
- **Routes mid → goal**: see the table above — 66.0 (rope bridge), 66.9 (ford), 82.8 (spit), 98.0 (dig bridge), 124.9 m
  (causeway round the bend).
- **High ground**: none a carrier can hide on out of reach. The heights are the shelf (1.3) and the watch-post's floor
  (2.5, steps from the shelf, its 1.2 m faces jumpable), the spoil mound (1.3, a sand slope), the dunes and crests
  (1.3 / 2.5, all with slopes), the pillar's plinth and tier (steps), the causeway (1.3, steps off its bastion), the
  helipad (3.2, behind the spawn barrier). The stub, the parapets' tops, the tents, the tarps and the arch are `roof`.
  If Bazookarp ever needs one, a "no-carrier" zone could cover the watch-post's floor (2.5) so a carrier can't sit on
  the checkpoint's high ground — it's reachable, so I'd leave it open.

## Numbers before (0cd3945) → after

| | before | after |
|---|---|---|
| spawn → mid, nav (t0 / t1) | 3.88 / 4.55 s (avg 4.22) | 6.07 / 6.36 s (avg 6.22, × 1.47) |
| straight spawn → mid | 37.0 m | 59.0 m |
| tower track / side | 88.1 m, 1.101 m/s, cps at 37 / 62.6 m, 100 s | 174.0 m, 2.175 m/s, cps at 37 / 162.8 m, 100 s |
| tower-check | clean | 0 holes, 0 issues, rides: knockout / knockout, 0 knocked off |
| cover (≤ 5 m, `cover-map.js`) | 81.4 % of 3104 cells (largest open 17 m: the camp's crest) | 94.9 % of 4408 cells (largest open 14.2 m: the centre zone's sandbar) |
| climb-audit | — | 265 climbs, 0 barred |
| bots turf (stuck / water) | — | 0 % / 1–5 |
| boss home ground | — | 478 m², walked 34 m, never stuck |
| lightmap rows (8 ppm / 2048) | 654 | 964 (baked, hash 3adb5294) |
| nav nodes / A* cap needed (size-budget) | 3201 / 3000 | 4445 / 6000 (the engine's cap: max(6000, 3 × nodes)) |
| paint atlas | 27.6 ppm | 21.5 ppm |
| perf at load (turf day, `top`) | 278 calls, 1.63 M tris, 3.26 ms cpuRender, loadMs 6181 | 297 calls (× 1.07), 1.82–1.84 M tris (× 1.13), 2.35–2.46 ms (the baseline ran under more load), loadMs 5683–5778 |

## Pictures (`out/spirhalite/`)

- Top before / after: `top-before.jpg`, `top-after.jpg` (dusk: `top-after-dusk.jpg`), the block-out `blockout-top.jpg`;
  zones `top-zones.jpg`, tower `top-tower.jpg`, `tower-rail-top.jpg`, `tower-plan.jpg`.
- The slice: from mid toward the watch-post `mid-to-watchpost.jpg` (dusk `mid-to-watchpost-dusk.jpg`), from the base
  `slice-from-base.jpg`, the shelf `slice-shelf.jpg`, the dig bridge (the lagoon crossing) `slice-dig-bridge.jpg`, the
  dig `slice-dig.jpg` (dusk `slice-dig-dusk.jpg`), the spit's root `slice-spit-root.jpg`, the east bay bridge
  `slice-east-bay-bridge.jpg`.
- Spawn: `spawn-play.jpg`, `spawn-play-dusk.jpg`, the helipad after the move `helipad.jpg`; the intro's first frame
  `intro.jpg`; stage art `art-day.jpg`, `art-dusk.jpg` (also `assets/stages/spirhalite-{day,dusk}{,-sm}.webp`).
- Cover maps: `cover-before.jpg`, `cover-after.jpg`.

## Scripts (`out/spirhalite/`)

- `boss-check.js` (the new-stages check, home ground ≥ 150 m²), `routes-goal.js` (the Bazookarp route lengths).
- The new-stages scratch scripts (`tools/botlab/jobs/new-stages/out/spirhalite/`: `water-log.js`, `nav-check.js`,
  `dump.mjs` …) still run on the stretched stage.

## Shared files

None changed. (Nothing needed: the stretch lives in the stage's own folder, its lightmap and its art.)

## Known issues

- spawn-mid lands at × 1.47, in the band but under the 6.3 s aim: the east bay bridge (added for the side zone) gave
  Bravo a slightly shorter way in (6.66 → 6.36 s). Δ 23 would add ~0.1 s if the lead wants it higher.
- The tower's second checkpoint sits at 162.8 of 174 m (93 %): the strategic point is the base's last stand, and the
  detour loops (the dig) come before it. A checkpoint in the middle of the loops would split the long run after the
  first one; I kept the brief's "on the slice's strategic point".
- Water splats stay sporadic (1–5 a match), most on the old middle stroke's shores in fights.
- The mist's far banks show as pale wedges in the corners of the high art shot (as before the stretch).
