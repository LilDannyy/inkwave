# Lockgate Canals — the Long Stages stretch (st-d)

## The cut and Δ

- **Cut** z = −32.2 on Alpha's half (Bravo's is the mirror), just behind the canal-side row: the lock-keeper's cottage
  (south face z −32), the office stair's foot (z −32), the office / stables backs. Everything beyond it moves out by
  **Δ = 22 m along −Z**: the back yard, the loading stage + its three exits, LOCKGATE WHARF, the SW notch and chamfer,
  the back-yard walls, their props, the flags, the spawn pads, the tower goal.
- Pure −Z, not the 5° spawn axis: every building is on the x / z street grid, and a skewed move would have knocked the
  whole base 1.9 m sideways off it.
- How it's written (`src/world/stages/lockgate/layout.js`): `LS = { cut, d }`. The base is drawn in its old
  coordinates as `BASE` and moved by `base()`. `props.js` moves every placement beyond the cut with `outP()`; a
  placement marked `stay` doesn't move (the east yard wall's coping). The slice is new land, in final coordinates
  (`DOCK`, `DOCK_PLACEMENTS`). Pieces that crossed the cut were split at it. The setts columns and side yards now end at
  the cut, and their strip beyond it went into the back yard.
- The stage grows 56 × 92 → 56 × 136 (bounds z ±68). The Z-shaped canal, the locks, the bridge, the side zones and
  mid are untouched.

## The slice: the dry dock (between the wharf and the lock)

The canal company's **dry dock** runs across the west of the slice, fed from the upper pound by a dock arm through an
arch in the west wall.
- The dock: a drained brick chamber, floor −1.9 (below the sea, safe like the lock chambers, whose blocks also mask the
  sea). An altar ledge at −0.95 runs along each side (jump-up routes and ladders). Broad head steps, the full floor
  width, lead down at the east end. A working boat sits up on keel blocks, black hull and sheeted hold, both
  slide-off.
- Mitre gates with balance beams close the mouth. The beams are waist-high cover on both docksides. The gates' walkway
  lies flush with the docksides: that's the **west flank crossing**. The arm's water leaks through the gates into the
  dock.
- Beyond the arch the arm runs off past DOCK STORES and the smithy, under a humped footbridge, into a boathouse.

The **crane staging** is the slice's **strategic point**. It's a timber deck (1.3) on trestles standing on the altars,
spanning the dock, with a landing and a flight on each dockside. A hand crane on it swings its jib over the boat. The
staging overlooks the dock floor (which passes under it), the lane by the dock head, and the yard up between the
cottage and the office toward the basin and the bridge.

East of the dock head stands the **boatbuilder's shed** (J. PEARCE & SONS), roof off-limits. Its **loading bay**
(1.3, canopy on two posts) faces the dock, with two stone flights down to the lane. The dock road and the back road
wrap round the shed. At the head of the yard, where the bridge street comes out of the canal-side row, stands the
**weigh house** with its weighbridge. It breaks the old straight sightline from the bridge to the loading stage.
Cover everywhere:
- timber stacks (stickered boards, elm butts, a board rack);
- a steam chest with its boiler;
- a day boat on the stocks;
- a tar kettle, casks, crates, a dray;
- the dockmaster's hut, bollards, capstans, lamps, a fingerpost;
- the CANAL CARRYING Co. wall and the saw mill beyond the east wall.

The walls and backdrop grew with it: the west wall and its arch, the east yard wall carried on, DOCK STORES, the
smithy, terraces along the arm, the boathouse, PEARCE & SONS SAW MILLS behind the east wall. The cooperage, the
chamfer terrace, the roofs and the spire moved out with the base.

**Routes through the slice** (per half): three lanes, plus two links across.
- **West**: the dock gate walkway at the mouth.
- **Centre**: over the crane staging, or the lane between the dock head and the loading bay.
- **East**: the lane along the east yard wall.
- **Links**: the dock road (north) and the back road (south).

The dock floor is a sunken lane with the head steps, climbable walls and altar hops (squid and jump extras). The spawn
keeps its three exits (grand stair, west stair, cart ramp). The back yard in front of the loading stage is the
defenders' apron.

**Tower Command** (`tower-data.js`): the drawn track is kept to [10.32, 22.67]. It then runs on down the yard past the
office stair and goes round the shed: along the dock road, down the east lane, back along the back road. It ends at a
goal in front of the loading stage (Alpha's goal at (3, 54.6) on Bravo's side, 11.6 m from the pad). Checkpoint 2 is
on the east lane beside the shed (revised: now on the dock road in front of the loading bay, 61 %; see the end). The track doesn't cross the staging, which is too narrow once its flights are
counted. Every prop keeps off the track's lanes, so all modes share one dressing: no new Tower-only pieces.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint**: the crane staging, (−12.5, −43, y 1.3).
  - It's the only raised crossing of the dock, between the three lanes, over the dock floor route.
  - Flights from both docksides; the crane plinth and casks give cover on the deck.
  - It looks up the yard toward the basin and the bridge.
- **Goal**: the back yard at the foot of the loading stage, (−2, −57.5, y 0), between the west stair and the grand
  stair. The back road reaches it from the west (the dock's south side) and the east (the east lane), and the dock-head
  lane from the centre. Defenders see it from the stage (2.4) and the grand stair.
- **Routes, mid → goal** (nav, Alpha's team, `route-len.js`):

  | route | via | length | swim time |
  |---|---|---|---|
  | centre | bridge street, weigh house, lane by the dock head | 73.3 m | 6.2 s |
  | east | loading bank, east yard, east lane, back road | 85.9 m | 7.3 s |
  | staging | yard past the office stair, over the crane staging | 98.6 m | 8.4 s |
  | west | cottage garden, dock gate walkway, south dockside | 123.2 m | 10.4 s |

  The nav's own shortest route is 70.4 m.
- **High ground**:
  - The staging and the loading bay (1.3) are open decks up stairs, not hides.
  - The shed, weigh house, hut and boat are `roof`; so are the crane and capstans.
  - Timber stacks and the steam chest (≈1.35 m) can be jumped onto. They stand in the open, so no no-carrier zone is
    needed.

## Numbers, before → after

| | before (0cd3945) | after |
|---|---|---|
| spawn → mid (nav, t0 / t1 / avg) | 4.43 / 4.70 / 4.57 s | 6.68 / 6.88 / **6.78 s (×1.48)**; straight 42.1 → 64.0 m (×1.52) |
| tower track (tower-len) | 72.7 m / side | **143.4 m** (target 145.4 ± 4 %), 1.79 m/s, cps at 22.9 + 112.2 m (10 s), **100 s** to the goal |
| tower-check | — | 0 holes, clearance clean (1 drop, the drawn one), both rides knockout, 0 knocked off |
| cover map (≤ 5 m) | 98.4 % (largest open 7.1 m) | **99.0 %** (7.1 m, the same spot in the bridge street) |
| bots turf, stuck % | 0.7 % | 0.2 / 0.8 / 0.4 / 0.6 % (4 × 180 s), longest episode 3 s |
| bots zones (full 300 s) | — | 0.2 % stuck |
| tower-match | — | Bravo 27 : 23 on time; both teams cleared checkpoint 1 and reached checkpoint 2 (112.2 m); stuck 0.1 % |
| boss (boss-check.js) | home 77 m², roamed 1 m | home **153 m²**, roamed 17 m, max idle 3 s, all moves played |
| perf at load (shoot, day, median of 3 paired runs) | 302 calls, 2.16 M tris, 3.85 ms, 6.37 s | 321 (×1.06), 2.71 M (×1.25), 4.15 ms (×1.08), 6.51 s (×1.02) |
| size budget | — | lightmap 879 rows (tower 910) of 2048; A* reach 6000 / 6000; nav nodes 2976 → 4672 |
| climb audit | — | clean (138 climbs) |

Fixes found in play: the dock's first head steps were 3 m wide, with railings. They left pockets beside the flight,
and a bot tried the head-wall climb there and hung on a railing and a capstan (13 s). The steps now fill the floor's
width, the railings are gone, and the capstans stand back from the edge.

Rebaked: `lockgate`, `lockgate.tower`. Stage art re-rendered (the art and intro cameras still frame the bridge well; DOCK
STORES now fills the skyline behind the mill). Checked by day and at dusk.

Pictures (`out/lockgate/`): `top-before`, `top-after`, `tower-top`, `play` (spawn), `slice-aerial`, `slice-dock`,
`slice-staging`, `slice-frommid`, `slice-flank`.

## Revision (the lead's review): checkpoint 2 earlier

Checkpoint 2 on the east lane sat at 78 % of the track (112.2 of 143.4 m). It moved back along the loop to **the dock
road where the lane to the dock head leaves it, in front of the loading bay's north flight, (0, 35.4) on Bravo's
side: 88.0 m, 61 %** (`tower-data.js` lockgate). The track is unchanged (143.4 m, −1.4 %, 100 s). The user's drawn
section and checkpoint 1 are untouched.

- **The crane staging (the strategic point) still can't take the track.** Its two flights are offset (north x 12–15,
  south x 10–13, Bravo's side), and a lane onto the north one would clip the cottage's corner.
- **The loop round the shed can't be turned the other way.** It must end on the back road for the goal. Any loop
  that goes down the dock-head lane first comes back up it or shuts itself in north of the shed.
- **So the checkpoint moves along the loop, to the stretch of it nearest the staging.** The spot is 13 m off the
  staging's north flight, at the crossroads of the yard, the dock road and the lane to the dock head. The loading
  bay (1.3) is right beside it, the weigh house is behind it and the staging is across the dock head. Defenders reach
  it up that lane from the back yard or along the dock road; attackers come down the yard.

| | before | after |
|---|---|---|
| checkpoints | 22.9 / 112.2 m (16 / 78 %) | 22.9 / **88.0 m (16 / 61 %)**, 10 s each; **100 s** to the goal |
| stage-audit (tower) | — | 4/4: lightmap applied (lockgate.tower, 910 rows; no geometry change, no rebake), spawn → mid 6.50 / 6.71 s, 100 s |
| tower-check | 0 holes, clean, rides knockout | 143.4 m; 0 holes, clearance clean (1 drop, the drawn one); rides: both a knockout after 83.3 s, nobody knocked off, no stalls |
| tower-match | Bravo 27 : 23 on time | Bravo by a retake in overtime, 41 : 38; both teams pushed to checkpoint 2 (88 m), Bravo cleared checkpoint 1 and half of checkpoint 2 (it refilled), Alpha cleared checkpoint 1; stuck 0 % |

Picture: `out/lockgate/tower-top.jpg` (re-shot).

