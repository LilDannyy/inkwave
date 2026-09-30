# Mount Nantai (`nantai`) — the Long Stages stretch

Branch `stretch-e` (st-e). Files: `src/world/stages/nantai/stretch.js` (the cut and the shift), `slice.js` (the new
land), `slice-props.js` (its prop builders and dressing), and edits in `layout.js`, `ground.js`, `props.js`,
`backdrop.js`, `obs.js`, `murals.js`. No shared files touched.

## The cut and Δ

- **Δ = 24 m per half** (z). The brief's band is 18.5–22, but Nantai had the shortest spawn → mid of the set (3.61 s,
  marked "aim 6.0"); 24 m lands it at 5.85 s.
- **The cut: z −31.5** on Alpha's half (+31.5 on Bravo's) — the rehearsal hollow's back wall.
  - Stays (mid's): the lawn, both brooks and their crossings, the bank, the hollow with Pearl's rock (the side zone,
    unchanged), the bastion and the west flight, the first terrace's and the stargazing terrace's fronts, the shelf,
    the ridge nose and its lookout, the shore trail's front and its switchback.
  - Moves out 24 m (the base's): the control building with the forecourt, the dome, the grand stair (its centre is
    at −33.35), the east yard and its stair, the ridge root with the weather hut, the shore stair, roll-off hut no. 2,
    the crag behind.
  - Split on the cut: the first terrace (two blocks) and the stargazing terrace — their fronts stay, their backs go with
    the building. Carried on: the ridge's cliff and the shore trail's shoreline (new outline points in `ground.js`).
- How: `stretch.js` exports `ST = { cut: −31.5, d: 24 }`, `sz()` for a z, `shiftDef()` for a layout piece (by its
  centre), `shiftPlacement()` for a prop. `layout.js` / `props.js` keep the drawing before the stretch and map it
  through those, so every number still reads as it was designed; the slice is its own module. The backdrop's crag,
  Little Nantai and the knolls behind the domes move out with the ends (`buildBackdrop(kit, { d })`).

## The slice: the observatory's shoulder (z −31.5 … −55.5)

The observatory's older instruments stand on the shoulder between the rehearsal hollow and the control building.

- **The Solar Tower (1954)** on the shoulder behind the hollow: a white render house with granite quoins, its shaft
  rising to the coelostat deck (two mirrors on a fork, the rolled-back hood, a railing). House and shaft are off limits
  (`roof`); the ridge path passes west of it. A landmark from mid and from the spawn.
- **The rock garden**, sunk 1.3 m into the shoulder between the ridge and the stargazing terrace: a rockery bed (1.95,
  you can stand on it) with cushion plants and a dwarf pine, a pool with a spout, boulders, heather. Three stairs in:
  from the shoulder (north), from the ridge (west), from the shoulder's back (south).
- **The Dish Knoll — the strategic point.** A granite knoll (2.6) in the middle of the slice, joined to the stargazing
  terrace, with the 5.6 m radio dish on its concrete pedestal (dish and pedestal off limits). Four ways up: the front
  steps (north, toward mid), level from the stargazing terrace (west), a gravel ramp (east), the back steps (south,
  onto the apron in front of the grand stair). A stone parapet along its front, control cabinets, cable drums. The
  tower climbs onto it and stops there (checkpoint 2).
- **The receiver hut** on the first terrace beside the knoll (off-limits roof): door, louvres, air-con, roof antenna.
- **Roll-off hut no. 1** on the first terrace's front (between the tower's two runs across it), where the terrace lost
  no. 2 to the base's move.
- **The shore meadow** (0) where the first terrace falls to the shore trail: a turf knoll, boulders, a pine, a cairn,
  a fingerpost, a bench; a stair down from the terrace's edge and a gravel ramp from the strip by the knoll.
- Carried on: **the ridge** (2.6: pines, an outcrop, a bench over the tarn, a cairn), **the stargazing terrace** (2.6,
  telescope piers, planters on the garden's edge), **the first terrace** (1.3), **the shore trail** (0; a stair up to
  the terrace at its narrows).
- Heights in the slice: 0 shore / meadow · 0.65 meadow knoll · 1.3 first terrace, rock garden · 1.95 rockery · 2.6
  ridge, shoulder, stargazing terrace, the knoll · off limits: the Solar Tower (6 m + shaft), the hut, the dish.
- Two more heritage lamps (the Solar Tower's forecourt, the apron); telescope piers, tree planters, crates and
  bollards across the terraces.

### Routes through the slice (Alpha's half; Bravo's the mirror)

1. **The ridge** (2.6) along the tarn cliff past the Solar Tower to the ridge root and the stargazing terrace's back.
2. **The shoulder / stargazing terrace** (2.6): the high road straight to the forecourt's drop and the tower's goal;
   the rock garden (1.3) sunk beside it as a lower, covered way through.
3. **The first terrace** (1.3): up the knoll's front steps and over it (the strategic point) or round its east side
   past the receiver hut, down to the apron in front of the grand stair.
4. **The shore trail** (0): the narrows, the meadow, then up the gravel ramp or the stair onto the terrace, or on to
   the shore stair and the east yard.
   Links across the slice: the knoll (level with the stargazing terrace), the rock garden's stairs, the terrace's
   width in front of and behind the knoll, the shore stair up to the terrace.
The spawn keeps its three exits (the grand stair, the drop onto the stargazing terrace, the east stair to the east
yard); the apron in front of the grand stair is the defenders' re-forming ground (cover: the knoll's back, planters,
cable drums, roll-off hut no. 2).

## Modes

- **Turf War**: the base game; more land (cover-map floor cells 3724 → 5732).
- **Zone Control**: zones unchanged (centre on the lawn; the side zone at Pearl's rock stays where it was).
- **Tower Command** (two checkpoints: the track 80 of the 100 points): 72.1 → **140.2 m** (target 144.2 ± 4 %:
  −2.8 %). The user's drawing is kept to its old goal (the stargazing terrace at z 31); from there the detour loop: on
  down the stargazing terrace, down onto the first terrace and east across it past the knoll's front steps, south along
  the terrace's edge past the receiver hut, back west up onto the Dish Knoll (**checkpoint 2 on its top, by the dish**)
  and across it onto the stargazing terrace, down it to the goal below the forecourt (10 m short of the pad, as
  before). Checkpoint 1 stays at the bank after the Old Stone Bridge. (Revised: the loop turned round so checkpoint 2
  comes at 67 %; see "Revision: checkpoint 2 earlier" below.)
- **Boss Battle**: the stretch's 2.6 m ground out-covers the lawn, so HULLBREAKER picked a home on the shoulder near
  Bravo's spawn; `LAYOUT.boss = { floorY: 0 }` pins it back to the lawn (as Treehills does). Check passes.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint in the slice: the Dish Knoll top, (3, −41, 2.6).** It sits on the axis between mid and the grand stair,
  every route through the slice passes within a few metres of it (the terrace runs round both its sides, the stargazing
  terrace joins it level), it looks down the first terrace toward the bridge, and the spawn's forecourt overlooks it
  from 16 m — the attackers must take it, the defenders can reach it in seconds. Four ways up, cover round it (the
  parapet, the cabinets, the drums, the pedestal).
- **Goal in front of the spawn: the apron below the grand stair, (6, −53, 1.3)** — a level below the forecourt (3.8),
  13 m from the pad, seen from the whole forecourt edge. Reached by the knoll's back steps, the strip east of the knoll
  (from the first terrace and the shore meadow's ramp), and the drop off the stargazing terrace.
- **Routes mid → goal** (nav, metres, each forced through its waypoints; `out/nantai/routes.js`):
  - over the knoll (the bridge, the first terrace, the knoll's front steps, its top, its back steps): **62.4**
  - the east terrace (past the receiver hut, the strip east of the knoll): **65.6**
  - the stargazing terrace (the west flight, the terrace, the drop to the apron): **69.6**
  - the ridge (the weir, the boardwalk, the ridge past the Solar Tower, the shoulder's back): **103.7**
  - the shore trail (the log bridge, the shore, the meadow, the gravel ramp): **≈ 93** over the log bridge (the bots'
    nav doesn't take the log bridge — it was like that before the stretch — so the measured path is 144.7)
  - the shortest nav path mid → goal is 60.2; mid → the checkpoint on the knoll 43.5.
- **High ground a carrier could hide on:** none. The Solar Tower, its shaft, the receiver hut, roll-off huts, the dish
  and its pedestal are `roof` (slide off, no ink). Every other high spot in the slice (the knoll 2.6, the ridge and the
  shoulder 2.6, the rockery 1.95) is reached by stairs or ramps from the ground and is open to fire from lower ground
  and the forecourt. The forecourt itself (3.8) is inside the spawn barrier's reach — a later "no carrier" rule for the
  spawn deck is the only one needed.

## Numbers (before = `new-stages` 0cd3945 as measured today; after = this branch)

| | before | after |
|---|---|---|
| spawn → mid (spawn-mid.js) | 3.44 / 3.78 s, avg 3.61 | 5.68 / 6.02 s, **avg 5.85 (1.62×)** |
| straight spawn → mid | 41.0 m | 65.0 m |
| tower track (tower-len.js) | 72.1 m | **140.2 m**, 1.75 m/s, checkpoints at 24.8 / 120.0 m, **100 s to the goal** |
| tower-check | clean | 0 holes, clearance clean, both rides knockout, nobody knocked off |
| cover (cover-map.js, ≤ 5 m) | 90.9 % (largest open 12 m) | **93.6 %** (largest open 11.2 m, the lawn's east end) |
| turf bots stuck | 0.5 % (120 s) | 0.2 % (180 s), longest 2.5 s |
| zones match | — | Alpha on time 48 vs 52, stuck 0.2 % |
| tower match | — | Alpha on time, best pushes 92.3 / 24.8 m, stuck 0.6 %, longest 5 s (at mid) |
| boss check | pass | pass (after `boss.floorY: 0`) |
| climb audit | — | 0 barred climbs (338) |
| lightmap rows (size-budget) | 718 / 2048 | 1150 / 2048 |
| paint atlas density | 27.6 ppm | 21.5 ppm |
| nav nodes / A* cap needed | 3619 / 1500 | 5563 / 1500 |
| perf at load, day turf (shoot.cjs; calls / tris / cpuRender / loadMs) | 309–380 / 2.22–2.40 M / 6.8–8.8 ms / 7.9–14.4 s | 309–317 / 2.77–2.85 M (≤ 1.25×) / 6.0–7.9 ms / 8.1–8.8 s |
| perf at load, day tower | 459–524 / 2.20–2.41 M / 7.4–9.1 ms / 7.6–12.0 s | 459–499 / 2.73 M (≤ 1.24×) / 7.5–8.8 ms / 7.4–10.0 s |

(Perf: the old tree (`git archive 0cd3945`) and this branch shot alternately, twice each, while four other agents were
running bots — cpuRender and loadMs swing with the load; the ranges are the paired runs. Calls stay put, triangles
+18–25 %.)

Known issues: the log bridge isn't in the bots' nav (unchanged from the last round); the tower track is 2.8 % under
the doubled length (inside the ± 4 %); the paint atlas density dropped to 21.5 ppm with the bigger stage (it packs to
fit, as the brief expected).

## Pictures (`out/nantai/`)

`top-before.jpg` / `top-after.jpg`, `top-tower-before.jpg` / `top-tower-after.jpg` (the loop through the slice),
`slice-from-mid.jpg`, `slice-from-spawn.jpg`, `slice-west.jpg` (the Solar Tower, the rock garden), `slice-east.jpg`
(the receiver hut, the shore meadow), `strategic-point.jpg` (from the knoll toward mid), `rock-garden.jpg`,
`spawn-play.jpg` / `spawn-play-dusk.jpg` (the player's camera at the spawn), `cover-before.jpg` / `cover-after.jpg`.
Stage art: `assets/stages/nantai-{day,dusk}{,-sm}.webp` from the reframed `art` camera.

## Revision (the lead's review): checkpoint 2 earlier

Checkpoint 2 on the knoll sat at 86 % of the track (120.0 of 140.2 m): a long run without a stop, then one just
before the goal. The loop is turned round so the knoll comes first and part of the detour runs after it
(`layout.js` TOWER, Bravo's side):
- the drawn track to the stargazing terrace (z 31) and on to z 34, as before;
- east down onto the first terrace, only as far as the knoll's front steps (x −3), then **up the front steps** (5 m
  wide: an 18° incline for the 2.5 m platform) onto the knoll: **checkpoint 2 on its top by the dish, (−2, 2.6, 43.5)**;
- back west across the knoll onto the stargazing terrace and down it past the rock garden (the old goal run);
- then round the shoulder: west along its front (z 52.25), south past the Solar Tower garden's stair, east along the
  terrace's back under the control building (z 59), and north to the **goal at (5.75, 56)**, 1 m further out than
  before, 11 m from the pad, still below the forecourt's west drop.
The old runs along the first terrace's east edge (past the receiver hut) and across the knoll's east half are gone.
Square corners, straight runs; 2 climbs and 1 drop (the drawn ones), 3 inclines (the bridge's two, the front steps).

Tower-only: the loop's front and back runs pass through two telescope piers (the stargazing terrace's back and its
front by the garden). In Tower Command they stand inside the loop instead, beside the STARGAZING TERRACE board
(`slice-props.js`, `props.js`: `notIn` / `onlyIn: 'tower'`). That gives Nantai a Tower build: `nantai.tower` baked
(hash c5d9b1b, 1150 of 2048 rows). Turf and zones are untouched (same bake).

| | before | after |
|---|---|---|
| tower track | 140.2 m, checkpoints 24.8 / 120.0 m (18 / 86 %) | **142.6 m** (target 144.2: −1.1 %), 1.78 m/s, checkpoints 24.8 / 95.9 m (**17 / 67 %**), **100 s** to the goal |
| stage-audit (tower) | — | 4/4: lightmap applied (nantai.tower, 1150 rows), spawn → mid 5.68 / 6.02 s, no barred climbs, 100 s |
| tower-check | clean | 0 holes, clearance clean; rides: both a knockout after 83.4 s, nobody knocked off, no stalls |
| tower-match | Alpha on time, pushes 92.3 / 24.8 m | (1) Bravo on time 80 : 46, pushes 79.9 / 24.8 m, stuck 0.4 %; (2) Alpha by knockout at 4:20, both checkpoints cleared (the knoll at 1:34), stuck 0.1 % |

Picture: `out/nantai/tower-top.jpg` (Alpha's track runs into Bravo's half, on the right; the loop is round the dish).

