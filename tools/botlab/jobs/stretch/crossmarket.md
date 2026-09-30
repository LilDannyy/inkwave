# Crossroads Market (`crossmarket`): the Long Stages stretch

Branch `stretch-c`. Pictures in `out/crossmarket/`.

## The cut and Δ

- **Δ = 24 m** on each half, along Market Street (Z). The spawn axis is straight: spawns at x 0.
- **The cut** runs straight across at z −29 (Alpha's half; `layout.js` `STRETCH`). That is between the feet of the
  spawn stairs and the fronts of the butcher's, the bakery and the roof terrace.
- **The base moves out as a unit.** It keeps its original numbers in `BASE` and moves by `back()`, in both
  `layout.js` and `props.js`:
  - Exchange Square;
  - the Corn Exchange and its spawn terrace with the grand stair and side flights;
  - the two corner buildings (the ironmonger's and tea rooms, the smokehouse and chandler's);
  - the square's café tables, lamps, bins and festoons;
  - the town across the channel behind the Exchange.
- **The Fish Lane arcade, the Parade and the roof terrace stay with mid.** Their base-side stairs now come down into
  the new block.
- **The Arcade Gallery** used to run from the spawn terrace to the hall end. Carried through, it would have been a
  40 m high road from the spawn to mid over the whole new block, the kind of shortcut the Rainmaker reworks closed.
  - It now runs from the butcher's corner (z −29) to the hall end.
  - A new iron stair comes down its south end into the new square.
  - The spawn terrace gets a west flight where the gallery used to leave it, so it still has three stairs out.
- The spawn pads move to z ±64.2 and the bounds to z ±68. The far quays across the harbour channels are 72 m long
  now, not 48.

## The slice: the Butter Cross

The next block of Market Street, between the fountain and Exchange Square, is the square where the farm wives sold
butter, eggs and cheese. The spec below is Alpha's slice (z −53 … −29).

- **The open band** (z −39 … −29). It is the old square's southern side, in front of the butcher's, the bakery and the
  roof terrace, whose stairs land in it.
  - Stalls, crates and sacks, a bench and a tub tree, a lamp and café tables.
  - The gallery's new south stair, with a boarded store under its treads.
  - It is the first link across the slice.
- **The Butter Cross square** (x −8 … 8, z −53 … −39). **The cross is the strategic point.**
  - An open stone loggia on a raised floor (1.2 m), with a flight of stone steps with balustrades to the east and to
    the west.
  - Eight Tuscan columns carry an entablature lettered BUTTER CROSS / A.D. 1683.
  - A stone-slate pyramid roof with an open lantern and a gilt ball-and-cross finial (roof-flagged: nobody stands on
    it).
  - Two stone butter tables inside, with crocks, butter pats and egg baskets. They are cover on the floor.
  - Round it: a cheese stall and a flower stall, crates, casks, a bench, bollards, lamps and a FRESH BUTTER A-board.
- **The west range** (x −15 … −8), in ochre render:
  - the apothecary and the tobacconist on the square, the chocolatier on the band, the clockmaker on Exchange Square;
  - **Herring Passage** through its middle at street level: a 4 m vault under the upper floors, with portals, lanterns
    and bills. It links Fish Lane to the square.
- **The east range** (x 8 … 15):
  - Butter & Eggs and a tea merchant on the dairy's blue-render building;
  - the cheesemonger's and the dairy in rose ashlar;
  - **Butter Row**, an open alley between them from the square to the flank street.
- **The Butter Market** (x 19.4 … 24). An arcaded range on the harbour, the flank street's covered side. It mirrors
  the Fish Lane arcade across the stage: six piers, a creamery counter, casks and crates under the arches.
- **The Fish Lane side** (x −24 … −19.4):
  - the brick net loft and the smoked-fish shop;
  - between them, a gap onto the harbour steps (a railing gate, a bollard, lobster pots).

**Routes through the slice** (3 in, 2 across):

- Fish Lane (west);
- Market Street round either side of the cross (centre);
- the flank street past the Butter Market (east);
- across: the open band, and Herring Passage → over the cross → Butter Row.

Short sightlines and corners stay the stage's character. Every building's ground floor is inkable, and the upper
storeys and roofs are off-limits as before.

**Spawn depth.** Exchange Square, 7 m deep, is the defenders' apron: café tables, a flower barrow, lamps, a bench, a
post box. The spawn has three stairs out: the grand stair and the two side flights.

**Silhouette.** The stage stays a band cut by the diagonal tramway, with its piers and dock basins at mid. The new
block adds the harbour gap on Fish Lane.

## Every mode

- **Zone Control.** Nothing changes in the zones: the hall floor is the centre and the tram pier the side zone. The
  goods landing stays on the pier.
- **Tower Command.** The track is 99.9 → 201.6 m; the target was 199.8 ± 4 %.
  - It keeps every drawn run to the flank street, then goes round the new block:
    - back along the open band (z −37.4 in Alpha's half) to Fish Lane, and down Fish Lane;
    - back east through Herring Passage, up the cross's west steps, across the floor (checkpoint 2 until the
      revision below: now on the band in front of the cross, 61 %), down its east steps and along Butter Row;
    - down the flank street and along Exchange Square to the goal, 13 m short of the pad.
  - Tower-only changes:
    - The Exchange footbridge is gone. It only made sense with the old goal, and the terrace stairs, side flight and
      café tables are back in this mode.
    - Clutter on the new lanes moves aside (`notIn: 'tower'` plus moved copies).
    - Herring Passage's lanterns hang to one side of the tower's headroom.
- **Boss Battle.** The home ground was 75 m² on the dock basin by the tram pier before, and is 83 m² on the open
  band by the cross after: below the check's 150 m² both times. See the numbers below (`noBoss` recommended).

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint:** the Butter Cross floor, (0, 1.2, −45.2).
  - It is the middle of the slice, on Market Street between the two ranges.
  - Ways up: the east and west steps (Butter Row and Herring Passage end on them), plus a hop (1.2 < a jump) or a
    squid climb on the north and south faces.
  - Cover: the columns and butter tables on it, the stalls round it, the gallery overhead to the north.
  - It looks straight up Market Street past the fountain to the hall.
- **Goal:** the square's south end in front of the grand stair, (0, 0, −51.8). It is one level below the spawn
  terrace, which looks straight down on it. It is reached:
  - round either side of the cross;
  - from Fish Lane and the flank street through Exchange Square.
- **Routes from mid to the goal** (nav path lengths, `out/crossmarket/routes.js`, team 1 pushing into Alpha's base):

  | route | length | swim time |
  |---|---|---|
  | Market Street, east of the cross | 72.3 m | 6.12 s |
  | Market Street, west of the cross (under the gallery) | 69.7 m | 5.91 s |
  | over the cross | 81.9 m | 6.94 s |
  | Fish Lane | 100.7 m | 8.53 s |
  | the flank street | 114.6 m | 9.71 s |

- **High ground a carrier could hide on:** none unreachable.
  - The cross floor (1.2) is the checkpoint.
  - The Arcade Gallery (2.6) is reached by its two iron stairs and the fish court's stair.
  - The roof terrace (2.6) and the Parade (1.2) are reached by their stairs.
  - The cross's roof and every upper storey and roof are roof-flagged.

## The numbers (before → after)

Before = `new-stages` 0cd3945 (a scratch worktree of it, same harnesses); after = this branch.

| | before (0cd3945) | after |
|---|---|---|
| spawn → mid (`spawn-mid.js`, t0 / t1, avg) | 4.14 / 4.35 s, avg 4.25 | 6.45 / 6.66 s, avg **6.56** (1.54×) |
| tower track (per side) | 99.9 m | **201.6 m** (target 199.8, +0.9 %), 2.52 m/s at one rider |
| tower checkpoints (`tower-len.js`) | at ≈ 25 m (the tram line) and ≈ 75 m (the tall row's front) | at 25.3 m (10 s) and 166.3 m (10 s, the Butter Cross floor); **100 s** to the goal |
| tower-check | — | 0 holes, clearance clean; no climbs or drops (the cross by its steps: two 22–23° inclines); both rides a knockout after 83.3 s, nobody knocked off, no stalls |
| cover map (≤ 5 m of cover) | 92.8 % of 3006 cells | **95.4 %** of 4650 cells (open spots: the spawn terraces and the tram piers, as before) |
| bots, turf 120 s: stuck | 0 % | **0.1 %** (longest 0.5 s) |
| bots, zones (full match): stuck | — | **0.1 %** (longest 0.5 s); Alpha won on time, 56 vs 93 |
| tower match (all bots) | — | Bravo won by knockout at 2:35 (both checkpoints cleared), Alpha's best 34.2 m; stuck 0.3 % |
| boss (`out/saltpan/boss-check.js`) | home 75 m² (fails ≥ 150), walked 11 m, plays charge / barrage / slam | home 83 m² (fails ≥ 150; now the open band by Bravo's cross), walked 5 m, played barrage + crablets only in 120 s. **Recommend `noBoss: true`**: the stage was already below the boss's home-ground floor before the stretch, and the new block is close quarters by design |
| lightmap rows (turf / zones / tower) | 521 | 802 / 808 / 784 of 2048 |
| size budget: nav nodes, A* cap needed | 2992, 1500 / 1500 | 4590, 6000 / 6000 |
| perf at load (shoot.cjs REPORT, golden; mean of 3 alternating runs on a heavily loaded Mac, load average 85–130) | tris 2.92 M, calls 326, cpuRender median 7.5 ms, loadMs ≈ 9.9 s | tris **3.73 M (1.28×)**, calls 324 (0.99×), cpuRender median 6.0 ms, loadMs ≈ 10.1 s (the new block was trimmed from 1.34× before the bake: four shopfronts on the less-seen fronts became doors and windows, the kiosk a bench, a stall and a barrow crates and pots, one fingerpost gone, the cross's lettering painted flat) |
| climb audit | clean | clean |
| check-maps | ok | ok (crossmarket, .zones, .tower) |

## Files

- `src/world/stages/crossmarket/layout.js`: STRETCH, BASE / SLICE, the gallery's new south stair and the boarded
  stores under both gallery stairs.
- `props.js`: MID / BASE / SLICE / TOWER placements.
- `cross.js`: new, the Butter Cross.
- `buildings.js`: `name` and `lampX` on the passage, `name` on the arcade.
- `src/world/tower-data.js` (crossmarket), `assets/lightmaps/crossmarket*`, `assets/stages/crossmarket-*`.

## Revision (the lead's review): checkpoint 2 earlier

Checkpoint 2 on the cross's floor sat at 82 % of the track (166.3 of 201.6 m). It can't come earlier on the cross, so
it moved to the nearest good spot: **the open band where Market Street enters the Butter Cross square, 5 m in front of
the cross's north colonnade, (0, 37.4) on Bravo's side: 123.8 m, 61 %** (`tower-data.js` crossmarket). The track is
unchanged (201.6 m, +0.9 %, 100 s). The user's drawn section and checkpoint 1 are untouched.

Why not the cross:
- The tower only reaches the cross's floor along Herring Passage / Butter Row, between Fish Lane and the flank street.
  The Butter Cross square round the cross is 2.3 m wide between the ranges and the steps' balustrades, and the
  columns bar its north and south faces.
- The drawn track arrives down the flank street. The only other link between the flank street and Fish Lane is the
  open band: Exchange Square is split by the Corn Exchange's three stairs, and the Butter Market arcade is 2.8 m high.
- So either the band's run to Fish Lane comes first and the cross after it (at least 166 m in), or the cross comes
  first and only Fish Lane and the square's far corner are left after it: about 180 m in all, 10 % short.

The new spot is on the square's axis, looking at the cross. Its floor (1.2), columns and butter tables overlook it,
and so does the gallery overhead to the north. The attackers arrive from the flank street; the defenders come up
Market Street past either side of the cross, or round by Fish Lane.

| | before | after |
|---|---|---|
| checkpoints | 25.3 / 166.3 m (13 / 82 %) | 25.3 / **123.8 m (13 / 61 %)**, 10 s each; **100 s** to the goal |
| stage-audit (tower) | — | 4/4: lightmap applied (crossmarket.tower, 784 rows; no geometry change, no rebake), spawn → mid 6.13 / 6.38 s, 100 s |
| tower-check | 0 holes, clean, rides knockout | 201.6 m; 0 holes, clearance clean; rides: both a knockout after 83.3 s, nobody knocked off, no stalls |
| tower-match | Bravo by knockout at 2:35 | Alpha by knockout at 3:44, both checkpoints cleared (the band at 1:37), stuck 0 % |

Picture: `out/crossmarket/tower-top.jpg`.

