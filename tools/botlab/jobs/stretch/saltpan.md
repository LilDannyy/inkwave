# Saltpan Basin (`saltpan`): the Long Stages stretch

Branch `stretch-c`. Pictures in `out/saltpan/`.

## The cut and Δ

- **Δ = 24 m** on each half, along Z (the spawn axis is straight: spawns at x ±2).
- **The cut** (Alpha's half; Bravo's is the mirror) follows the seams, not a straight line
  (`layout.js` `STRETCH.cut`):
  - west of x −18: z −26, the shed quay's back edge;
  - x −18 … 14: z −30, the back pan's back edge;
  - east of x 14: z −41, behind the conveyor's tail hopper. The conveyor gantry stays with its heap, and its hopper now
    sits in the slice.
- **The base moves out as a unit.** It keeps its original numbers in `BASE` and moves by `back()`, in both `layout.js`
  and `props.js`:
  - the Salt Store, the loading gallery and its stair and ramp, the store yard with its rail line and wagons;
  - the office quay, the tidal creek (all its timber edges) and the causeway;
  - the pond field and flamingos behind the store.
- **Pieces that crossed the cut:**
  - The dock spur is 24 m longer. It runs across the slice past the pump house.
  - The loft stair stays with the shed. Its foot lands on the new intake quay.
  - The gantry incline stays with its heap.
  - The conveyor stage's old chamfer and edges are gone. The hopper yard continues from it.
- The spawn pads move to z ±66 and the bounds to z ±70.

## The slice: the evaporation terraces and the brine pump house

The works' story carries on toward the base. Sea water comes in at an **intake bay** on the west edge. The
**No. 2 Pumping Station** lifts it onto the top terrace. The brine then works down a flight of four **evaporation
ponds**, greyer and fresher at the top and pinker as it concentrates, to the crystallising pans at mid.

Alpha's slice, from west to east:

- **The intake quay** (x −30 … −18):
  - the intake bay, a timber-revetted notch of sea;
  - the pump house's suction pipe and strainer dropping into the bay;
  - two salt cones, one fresh and one under a tyre-weighted tarp (roof-flagged: you slide off);
  - the loft stair's foot, drums and a tool rack;
  - the causeway landing from the creek.
- **The pump house.**
  - A buff-brick engine house with stone quoins, round-arched iron windows and a slate roof, lettered
    PUMPING STATION No 2 · 1902 over an oculus.
  - A tall square chimney stack rises through the roof. It is the slice's landmark from mid.
  - The ground floor is inkable up to its string course. Everything above takes no ink and slides you off.
  - The rising main crosses the spur on a steel post to the header tank.
- **The rail spur** (x −13.5). It runs from the store yard across the slice to the turntable. Two loaded tipper
  wagons stand against the loading platform and an empty one further back.
- **The loading platform, "BRINE STAGE"** (1.5 m, x −12.5 … −4, z −44 … −37). **This is the strategic point.**
  - The header tank, the hand crane over the spur, sack pallets and a scale stand on it.
  - Ways up from the mid side:
    - a 3 m timber stair from the pump dyke (north);
    - open steps from the causeway (east).
  - Ways up from the base side:
    - a cleated ramp from the pump yard (south);
    - the wagons on the spur as steps;
    - squid climbs on every face.
  - It looks straight up the terraces and the pans to the wind pump.
- **The causeway** (x −4 … 0) is the straight way from the gallery stair to the pump dyke. It runs between the
  platform and the terraces.
- **The evaporation terraces** (x 0 … 13): four ponds, each with a mud bund and a timber revetment on every riser.
  - Floor heights: −0.3, 0, +0.3, +0.6. The 0.3 m steps are walkable, a carrier's way too. A cleated ramp goes up to
    the top pond from the yard.
  - Sluice headstocks sit on the bunds, staggered.
  - Pond boards POND 1–4, gauges and marker stakes.
  - Raked salt cones and windrows are the cover in the ponds.
- **The pump dyke** (z −33 … −30). It is the first link across the slice, along the back pan: brine launders on
  trestles with a gap at the plank ramp, a lamp and sack pallets.
- **The hopper yard and the cone yard** (x 13 … 26):
  - the tipping siding off the yard line up to the conveyor's tail hopper, with a wagon tipped into the hopper and two
    loaded ones;
  - the weigh house;
  - a slipway notch in the east edge;
  - two salt cones, and a radial stacker (the "second conveyor") building the second one;
  - a chamfered corner.

**Routes through the slice** (≥ 3 in, 2 across):

- the rail spur and the intake quay past the pump house (west);
- the causeway and the terraces (centre);
- the hopper yard and the cone yard (east);
- across: the pump dyke, and the platform itself (the spur to the causeway).

**Spawn depth.** The store yard, 16 m deep, is the defenders' apron. It keeps the rail line, its wagons and the sack
pallets as cover. The spawn keeps its three ways out: the stair, the side ramp and the west drop.

**Silhouette.** The stage stays a long, jagged tidal-flat band. The new land gets its own notches: the intake bay on
the west and the slipway on the east, plus a chamfered corner.

## Every mode

- **Zone Control.** Nothing changes in the zones: the centre zones are the Great Pan and the side zone is the shed
  roof. The shed's back wall takes no ink now. It faces the intake quay instead of the creek, and a squid swimming up
  it beside the loft stair surfaced under the handrail (a 9.75 s bot stall).
- **Tower Command.** The track is 88.3 → 179.2 m; the target was 176.6 ± 4 %.
  - It keeps every drawn run up to the back-pan boardwalk. From there it switchbacks up the terraces, one step at a
    time (tower-data.js coordinates, on the pushed-into half):
    - along the lowest pond (z 35.5), up a step, and back along the second (z 40.5);
    - across the causeway, up onto the loading platform (checkpoint 2), and off its base-side edge;
    - back along the third pond (z 45.5), up onto the top pond (z 51);
    - down the causeway to the goal in the store yard, 12 m short of the pad.
  - [1.3, 45.5] is a straight-through point. It pins the third terrace's step where the platform reaches it, so the
    step isn't smeared into a 19 m ramp.
  - The back-pan boardwalk is flush with the dykes in this mode, because the track now runs past its end.
  - Terrace cover that would stand on the lanes is `notIn: 'tower'`. The sluices stand on the bunds, off every lane.
- **Boss Battle.** The home ground grows from 183 to 620 m² (Bravo's slice and yard). See the numbers below.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint:** the loading platform, (−8.25, 1.5, −40.5).
  - It is the one raised spot in the slice, between the rail spur and the terraces, with cover on it and round it:
    the tank, crane, sacks, wagons and the engine house behind.
  - It has two ways up from each side and a clear view up the terraces to mid.
  - The attackers must take it to get past the terraces or the spur. The defenders hold it from the ramp and the
    wagons behind it.
- **Goal:** the store yard at the gallery stair's foot, (−2.5, 0, −53.5). It is one level below the spawn gallery,
  which looks straight down on it. It is reached:
  - down the causeway (north);
  - along the yard from the rail spur (west);
  - from the terraces' ramp and the hopper yard (east).
- **Routes from mid to the goal** (nav path lengths, `out/saltpan/routes.js`, team 1 pushing into Alpha's base):

  | route | length | swim time |
  |---|---|---|
  | centre: boardwalks, pump dyke, causeway | 63.1 m | 5.35 s |
  | over the platform | 71.0 m | 6.02 s |
  | west: dock yard, shed quay, intake quay, the spur | 98.9 m | 8.39 s |
  | east: mid jetty, heap wharf, hopper yard, cone yard | 92.3 m | 7.83 s |

- **High ground a carrier could hide on:** none unreachable in the slice.
  - The platform (1.5) is the checkpoint itself.
  - The engine house, the cones, the header tank, the weigh house, the hopper and the stacker are all roof-flagged
    (slide off, no ink).
  - The wagons (1.3) are cover you can stand on in plain view.
  - Mid-side high ground is unchanged and reached by stairs: the shed roof, the heap ridge and the conveyor catwalk.

## The numbers (before → after)

Before = `new-stages` 0cd3945 (a scratch worktree of it, same harnesses); after = this branch.

| | before (0cd3945) | after |
|---|---|---|
| spawn → mid (`spawn-mid.js`, t0 / t1, avg) | 3.80 / 4.60 s, avg 4.20 | 5.99 / 6.79 s, avg **6.39** (1.52×) |
| tower track (per side) | 88.3 m | **179.2 m** (target 176.6, +1.5 %), 2.24 m/s at one rider |
| tower checkpoints (`tower-len.js`) | at ≈ 26 m (the dock-yard corner) and ≈ 66 m (the sluice dyke) | at 26.2 m (10 s) and 130.8 m (10 s, the loading platform); **100 s** to the goal |
| tower-check | — | 0 holes, clearance clean; 1 climb (onto the platform), 2 drops (off the platform, off the top pond), 5 inclines (the 0.3 m terrace steps, pinned); both rides a knockout after 83.4 s, nobody knocked off, no stalls |
| cover map (≤ 5 m of cover) | 90.0 % of 3818 cells | **92.8 %** of 6052 cells (the largest open circle is the heap ridge at mid, unchanged) |
| bots, turf 120 s: stuck | 0.4 % (longest 1.25 s) | **0.1 %** (longest 0.5 s) |
| bots, zones (full match): stuck | — | **0.5 %** (longest 2.5 s); Alpha won on time, 76 vs 81 (a 9.75 s stall behind the shed on the first run: fixed, see Zone Control) |
| tower match (all bots) | — | Bravo won on time (count 38 vs 96), best push 117.5 m, one checkpoint cleared; stuck 0.1 % |
| boss (`out/saltpan/boss-check.js`) | home 183 m²; idle ≤ 4 s; walked 30 m (the "roams" check failed) | home **620 m²**; idle ≤ 5 s; plays charge / barrage / slam / crablets; walked 10 m ("roams" still fails, as before) |
| lightmap rows (turf / zones / tower) | 488 | 703 / 708 / 708 of 2048 |
| size budget: nav nodes, A* cap needed | 3930, 6000 / 6000 | 6070, 6000 / 6000 |
| perf at load (shoot.cjs REPORT, day; mean of 3 alternating runs on a heavily loaded Mac, load average 85–130) | tris 2.07 M, calls 303, cpuRender median 8.7 ms, loadMs ≈ 9.5 s | tris **2.65 M (1.28×)**, calls 337 (1.11×), cpuRender median 6.4 ms, loadMs ≈ 9.0 s |
| climb audit | clean | clean (99 climb edges) |
| check-maps | ok | ok (saltpan, .zones, .tower) |

## Files

`src/world/stages/saltpan/layout.js` (STRETCH, BASE / SLICE), `props.js` (new builders `saltpan_pumphouse`,
`saltpan_stage`, `saltpan_cone`, `saltpan_stacker`; the header tank roof-flagged; MID / BASE / SLICE placements),
`src/world/tower-data.js` (saltpan), `assets/lightmaps/saltpan*`, `assets/stages/saltpan-*`.
