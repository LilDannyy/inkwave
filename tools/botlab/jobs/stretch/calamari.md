# Calamari County (`calamari`): the Long Stages stretch

Branch `stretch-calamari` (from `new-stages` 0cd3945). Pictures in `out/calamari/`.

## The cut and Δ

- **Δ = 20.5 m per half** (half the straight spawn → mid distance, 41.3 m): the spawn now sits 61.8 m from mid (× 1.50).
- **The cut** (Alpha's frame, Bravo's is the mirror): the back street's south edge, z −30.5 (T2's front, the loading
  dock's front, the co-op yard), and on the hillside column (x < −25.5) T1's end, z −28.5. No building is cut.
- **Moved out as a unit** (`src/world/stages/calamari/stretch.js`: `STRETCH = { d, cut, cutHill }` and `moveOut()`, used
  by layout.js, props.js and backdrop.js): the Fishermen's Co-op with the spawn deck, the pad, the grand stair, the
  loading dock and its stair, the net store, the co-op yard and quay (with its quay ramp and clutter), T2 with the
  welcome mural, its stair, the Cuttlefish cottage, the hill walls and hill houses behind, the tower goal. The base
  pieces keep their original numbers in `P` and are drawn in one `BASE = moveOut([...])` list (props: `BASE_*`), so the
  file still reads as the original drawing.
- **Carried across the cut**: the basin quay's edge runs on south along the same line (one straight run past the fish
  market, with a boat notch cut into it), T1 carries on as the lower allotments, the hillside road carries on, the
  backdrop's land behind the co-op (`ZB`), the hill houses' slope and the village beyond follow the base.
- Unchanged: mid (the railway cut, the island, the overpasses and their one-way drops, the railcars' timetable), the
  station, the square (the side zone), the bath house, the store, T1, the north quay and slipway.
- `bounds` z ±48 → ±68.5.

## The slice: the village high street

The concept (the village high street between the square and the co-op) kept, with one change: **the fire-watch
tower's terrace instead of shrine steps**, because the stage's design brief asked for a secular village ("no shrines or
gates") and the hanshō fire lookout was already the stage's landmark (it stood out of play on the hill; it is now the
slice's strategic point, in play, and the hill copy is gone). From the hill to the harbour (Alpha's half, z −30.5 …
−51):

- **The allotments** (hillside flank): T1 carried on at 1.3 (the lower beds: leeks, daikon, a scarecrow, a bamboo
  frame, a straw stook), stone steps up to the **upper allotments at 2.6** (cabbages, compost bays, straw, the potting
  shed) running straight into T2's west end — a raised flank route into the base, reachable by stairs all the way.
- **The hillside road** carried on (0) to the co-op forecourt, with a **chicane** at its north end: the inn's boiler
  house juts into it, a kei truck is parked across its west half and the yaki-imo cart stands at the inn's corner
  (the road's long view is broken; 1.8 m and 2.9 m passages).
- **Ikayu Inn** (the bath house's onsen inn, across the back street from it: noren with the hot-spring mark, a
  souvenir shop on the High Street) and **its garden, raised 0.9 m** (the steaming rock pool, bamboo screens, a
  lantern, a pine; steps down to the High Street), the onsen lane between them.
- **The High Street** (setts) between the inn and the terrace, nobori banners, a vending machine, snowbanks, bicycles.
- **The fire-watch terrace** (1.3, 10 × 10 m, granite coping): the hanshō tower on its north-east corner (open at the
  foot; its legs are cover), the "MIND THE FIRE" stone by the steps, the fire brigade's hand-drawn pump cart and
  buckets, a bench facing mid. Stairs up from the back street (north) and down its two south corners (into the High
  Street and the fire lane); a hop-up (1.3) from anywhere.
- **The fire lane** and **the post office** (its sign, a sorting dock at 1.0 with parcel cages, the red post van in
  its yard, a hydrant).
- **The basin quay carried on** with **the fish market**: a raised auction floor (0.5) across the quay and jutting
  into the basin, its shed (roof off-limits), the chiller room and the stacked boxes (the quay's long view is broken:
  you step up onto the floor and round the chiller), and **a boat notch** cut into the quay edge south of it (the outline
  stays jagged: the market's bump out, the notch in).
- **The co-op forecourt**: the apron in front of the base (the grand stair's foot, T2's mural wall, snowbanks, the dock).

Heights added: 0.5 (auction floor), 0.9 (garden), 1.0 (sorting dock), 1.3 (terrace, lower allotments), 2.6 (upper
allotments). Every high spot is reached by stairs or a hop; the inn, post office, boiler house, potting shed, chiller,
market shed and the stall's roofs are off-limits (`roof`).

### Routes through the slice (Alpha's half, into the base)

Five ways in: the upper allotments (2.6, stairs), the hillside road (0), the High Street (0), over the terrace (1.3,
stairs both ways), the fire lane (0), the quay over the fish market (0.5, steps) — crossed by three east–west links:
the back street, the onsen lane (road → High Street → terrace → fire lane), the forecourt.

## Every mode

- **Turf War**: more land, all of it inkable (walls of the terrace, garden and allotments included).
- **Zone Control**: unchanged zones (centre on the island, the side zone on the square: the same distance from mid).
- **Tower Command** (two checkpoints: `TOWER.twoCheckpoints`): the user's drawing kept to the back street (off the
  island onto Bravo's track, along the rails to the level crossing — checkpoint 1 —, up the hillside road, along the back
  street), then a loop through the slice: down the fire lane beside the terrace, back west along the onsen lane **up
  onto the fire-watch terrace (checkpoint 2)** and down into the High Street, past the inn to the hillside road, down
  the road to the forecourt, along it to the loading dock (the goal, moved out with the base, 10.4 m short of the pad).
  82.0 → **163.6 m** (target 164 ± 4 %), 1.025 → 2.045 m/s, **100 s** to the goal. Square corners, two climbs (the
  terrace, the dock), two drops (the island, the terrace), no clutter on the lanes (the slice's dressing is placed off
  them).
- **Boss Battle**: the boss's home ground is the railway cut and the streets round it (unchanged mid); the check passes.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint**: the fire-watch terrace, **(0, −39, y 1.3)**. Contested: it is the raised middle of the slice, the
  first thing past the back street; attackers come up its north stair from the square, defenders up its south-corner
  stairs from the High Street and the fire lane (and everyone hops up its 1.3 m walls); cover on it (the tower's four
  legs, the fire stone, the pump cart, buckets, the bench) and round it (the inn, the garden's wall, the post office,
  the vending machine and snowbanks along its walls); it sees mid over the square (the overpasses, the side platform)
  and the base's front.
- **Goal**: the co-op forecourt at the grand stair's foot, **(0, −48, y 0)** — a level below the spawn deck (3.4), in
  view of the deck, T2 (2.6) and the dock (1.0). Routes into it: the High Street, the terrace's south stairs, the fire
  lane, the hillside road (the forecourt's west end), the post office yard (its east end).
- **Routes mid → goal** (nav, from the side platform's edge over Alpha's track to the goal, `out/calamari/routes.js`):
  | route | m | s (swim) |
  |---|---|---|
  | centre: the square, the terrace's north stair, over the terrace, down its SW stair | 57.6 | 4.9 |
  | the High Street past the inn | 54.1 | 4.6 |
  | the fire lane beside the terrace | 50.8 | 4.3 |
  | east: the store's corner, the basin quay, over the fish market, the post yard | 79.7 | 6.8 |
  | west: the hillside road through the chicane | 104.3 | 8.8 |
  | west high: T1, the allotment steps, the upper allotments, T2, down the T2 stair | 99.7 | 8.4 |
  | (shortest) | 46.7 | |
- **High ground a carrier could hide on**: none out of reach. The upper allotments (2.6) and T2 are reached by stairs
  from both sides (a flank route, in view of the spawn deck); the terrace (1.3) is the checkpoint itself. Roofs, the
  fire tower (legs' tops), the market shed, the chiller, the stall and the kei trucks' cabs are off-limits. The spawn
  deck (3.4) is behind the spawn barrier. A "no-carrier" zone isn't needed.

## Numbers (before = 0cd3945, after = this branch)

| | before | after |
|---|---|---|
| straight spawn → mid | 41.3 m | **61.8 m (× 1.50)** |
| nav to the side platform's edge over the own track (just off the island), t0 / t1 | 40.4 / 41.4 m · 3.42 / 3.51 s | 66.4 / 63.9 m · **5.63 / 5.42 s (× 1.65 / 1.54, avg × 1.59)** |
| `spawn-mid.js` (to the island's centre), t0 / t1 | 5.99 / 6.09 s (70.6 / 71.9 m) | 6.12 / 6.08 s (72.2 / 71.8 m) |
| nav to the trackbed just off the island, t0 / t1 | 5.76 / 5.87 s | 5.87 / 5.66 s |
| tower-len | 82.0 m · 1.025 m/s · cps at 28 / 64.9 m · 100 s | **163.6 m · 2.045 m/s · cps at 28 / 100.3 m · 100 s** |
| tower-check | clean | `{"len":[163.6,163.6],"holes":0,"issues":0,"climbs":2,"drops":2,"rides":[knockout, 0 off, 0 stalls] × 2}` |
| cover (floor within 5 m of cover) | 89.4 % of 4315 cells | **92.9 %** of 6071 cells (block-out: 90.9 %) |
| longest open line: hillside road / basin quay | 23.8 / 20.8 m (block-out 44.2 / 41.4) | **29.2 / 28.6 m** |
| check-maps | ok (108 pieces) | ok (166 pieces) |
| climb audit | 0 barred / 93 climbs | 0 barred / 174 climbs |
| size budget: lightmap rows (8 ppm, 2048²) | 652 | 850 (all three bakes) |
| paint atlas | 30 ppm | 25.4 ppm |
| nav nodes · A* cap spawn → far side | 4332 · 6000 / 6000 | 6152 · 6000 / 6000 |
| turf 180 s: stuck %, longest episode | 0.2 %, 0.75 s | **0.5 %, 3.25 s** (an earlier run 0.3 %, 2 s) |
| zones 300 s | stuck 0.5 % (2.5 s); 8 captures, 7 rotations; Bravo 71–54 | **stuck 0.6 % (1.5 s); 7 captures, 6 rotations; Bravo 79–79 on penalties** (an earlier run: 1 % (5.75 s by the square's post box, old land); 8 captures, 6 rotations; Alpha 23–87) |
| tower match | Bravo 85–28 (retake), best pushes 16.2 / 63.9 m, checkpoints cleared 0 / 1, stuck 0.2 % | **Bravo 57–56 (comeback), best pushes 67.7 / 69.5 m, OT 28 s, stuck 0.4 %**; a second run Bravo 79–10, best push 144.7 m (both checkpoints cleared), stuck 0.3 % |
| boss check | 1122 m², walked 61.3 m, 5 / 5 | 1121 m², walked 43.5 m, never stuck, 5 / 5 |
| perf at load (shoot REPORT, day; medians of alternating runs under the same shared-machine load) | 317 calls · 2.00 M tris · cpuRender 3.6 ms (a quiet run: 303 · 2.0 M · 2.6 ms) | **342 calls (× 1.08) · 2.59 M tris (× 1.30) · cpuRender 4.5 ms (× 1.26)** |
| loadMs | 5.9 s (quiet run 6.6 s) | 6.3 s |
| prop triangles (both halves) | 358 k | 556 k |

**spawn-mid on this stage.** The stretch brief's "6 s today is a detour" was right twice over: besides the one-way drops,
the old path to the island went round the station building (x −19.5) because at the old nav grid's alignment the side
platform's edge had no drop edge onto the track. The new bounds shift the grid by 0.5 m and the drop exists now, so
`spawn-mid.js` reads about the same (6.1 s) on a stage 20.5 m longer. Judged as the brief says, by the straight distance
(× 1.50) and to a node just off the island (the side platform's edge: × 1.59).

### The lead's notes on the block-out (2026-09-30)

1. **Height and cover in the new land, cover ≥ 92 %**: 89.4 % before → 90.9 % block-out → **92.9 %**; heights added: the
   garden 0.9, the sorting dock 1.0, the auction floor 0.5 (the terrace 1.3 and the allotments 1.3 / 2.6 were in the
   block-out). `cover-before.jpg`, `cover-after.jpg`.
2. **The long flank runs** (`out/calamari/sightlines.js`, lines every 0.5 m across the lane at chest height): the
   hillside road 44.2 m (block-out) → **29.2 m** (the chicane: the inn's boiler house, the kei truck parked across, the
   yaki-imo cart); the basin quay 41.4 m → **28.6 m** (up onto the auction floor, round the chiller room and the
   stacked boxes). The original stage's were 23.8 / 20.8 m end to end. `road-chicane.jpg`, `quay-fish-market.jpg`.
3. **The outline**: the fish market's floor juts 5 m into the basin and a boat notch (3.6 × 3 m, a skiff moored in it,
   a ladder) is cut into the quay south of it. `harbour-notch.jpg`, `after-top.jpg`.
4. **Views**: the spawn `play` view looks down the forecourt to the terrace and the fire-watch tower, the inn and the
   post office either side, the station beyond (`spawn-play.jpg`, `spawn-play-dusk.jpg`). From the terrace (its bench,
   eye height) you see over the square to the station, both overpasses, the trains and the side platform
   (`terrace-view-to-mid.jpg`); the station building hides the island's middle from the terrace's centre, the
   overpasses (mid's high ground) are in view. Cover up there: the tower's four legs, the fire stone, the pump cart,
   the buckets, the bench.

## Shared files

None changed. No shared change needed.

## Known issues

- Perf is within 1.35 × but the triangle ratio (1.30) leaves little room: another building's worth of props would reach
  it. cpuRender numbers are noisy on this shared machine (2.4 … 4.9 ms for the same build); the medians compared were
  taken alternately under the same load.
- The terrace's centre doesn't see the island's middle (the station building is in the way); the overpasses and the side
  platform are in view. Moving the station would change mid, so it stays.
- The quay's longest open line (28.6 m, from the north quay to the chiller room) is longer than the original quay's
  (20.8 m): it is broken once in the slice, as asked, not twice.
- One tower match was one-sided (79–10, random loadouts); the other was 57–56 with overtime. Both pushed past
  checkpoint 1; one cleared both and got within 19 m of the goal.
- The mid's open circle (12.2 m, the railway cut) is unchanged: the cover map doesn't count the movers.

## Pictures (`out/calamari/`)

- `before-top.jpg`, `after-top.jpg` (turf), `after-top-zones.jpg`, `after-top-tower.jpg` (the track lit), the
  checkpoint picture `blockout-top.jpg` / `blockout-top-tower.jpg`
- the slice from three angles: `slice-west.jpg` (the allotments, the road's chicane, the inn), `slice-east.jpg` (the
  post office, the fish market), `slice-from-base.jpg` (the forecourt, the terrace, the fire-watch tower); dusk:
  `slice-from-base-dusk.jpg`, `slice-east-dusk.jpg`; `aerial.jpg`
- the spawn: `spawn-play.jpg`, `spawn-play-dusk.jpg`; the terrace: `terrace-view-to-mid.jpg`,
  `tower-checkpoint2-terrace.jpg`
- the lead's notes: `cover-before.jpg`, `cover-after.jpg`, `road-chicane.jpg`, `quay-fish-market.jpg`,
  `harbour-notch.jpg`
- stage art: `assets/stages/calamari-{day,dusk}{,-sm}.webp`
- scratch tools: `spawn-mid-off.js` (spawn → just off the island), `sightlines.js`, `routes.js` (the Bazookarp routes),
  `boss-check.js`, `combine.cjs` (glues page scripts into one PAGE)
