# Eco-Forest Treehills (`treehills`): the Long Stages stretch

Branch `stretch-treehills` (from `new-stages` 0cd3945). The brief is `BRIEF.md` in this folder. Pictures are in
`out/treehills/` (JPG, each under 300 KB). The scratch scripts sit there too: `dump.mjs` + `plan.py` (plans),
`navpath.js` (the spawn→mid route node by node), `bazookarp.js` (the route lengths below), `pods-check.js` (18 pods)
and `boss-check.js`.

## The cut and Δ

- **Δ = 22 m per half.** The straight spawn→mid distance goes from 42.5 to 64.5 m (× 1.52).
- **The cut is a straight line across the whole stage at |z| = 26.** It follows the seam between the garden's
  hardstanding (the old base terrace's north wings, which frame the garden) and the old base terrace, so no building is
  cut. Everything beyond it moves out by Δ: the research station and its stairs, the base terrace (its greenhouse,
  cargo module, crates, mast, landing-pad ring and the tower goal on it), the lobe's tip, the north strip's end, the
  spawn pads, the barrier and the flags.
- **One transform in code.** `plan.js` has `STRETCH = { cut: 26, d: 22 }` and `mz(z)`, which moves a z that lies
  beyond the cut. The base's numbers stay written where they always were (`STATION.z0 = mz(-47)`,
  `R([0, T1, mz(-32.1)] …)`), and `props.js` sends the hand placements through `mv()`. Only the ground regions that
  cross the cut were redrawn: the old apron split into the hardstanding (`HARD`), the nursery's lanes and plots, the
  channel and the base terrace (`BASE`), and the lobe and the strip got new outer edges.
- `bounds` z ±47 → ±69. The environment footprint slabs follow the regions. The backdrop sits 200 m+ out and needed
  nothing, apart from a third pair of rotors for the nursery turbines.
- **The side zone** sat on the old base terrace, beyond the cut. It is redrawn at the same distance from mid, in the
  nursery's east: x 8 … 18.5, z −26.5 … −36.5 (105 m² as before). Its centre is 34.2 m from mid, against 32.7 m before.
  It sits on flat lawn beside the potting deck, which is the high ground over it. Ways in: from the hardstanding (north),
  the middle walk and the deck's side stair (west), the lobe's lane (east) and the cloche row's ends (south).

## The slice: the nursery terraces

This is the research station's seedling nursery, where the biome raises the trees for its hills. It fills the 22 m
between the garden's south wall and the station's base terrace, x −28 … 24.5.

- **Ground.** Gravel service lanes with twin wheel tracks and a grass strip between, edged in timber, run between lawn
  plots: the front lane along the hardstanding (z −28), the middle walk up to the deck (x 4) and the bank lane along
  the channel (z −44.3). Tower Command's loop runs on these lanes. Flower strips, lamps and stepping-stone trails
  complete the ground.
- **The strategic point is the potting deck** (2.62, x −4 … 8, z −33 … −41). It is timber decking on a green steel
  frame, with the potting shed and its glazed lean-to over a potting bench, a bench along the back, a planter and a pot
  stack. It has broad front steps toward mid (4.4 m), a back stair, a side stair down to the zone and a flight from the
  seedbed terrace. Where the tower climbs and drops there are "lift gates": steel shutters that take no ink, so nobody
  climbs there. From the deck you see down the middle walk and the garden stair to the plaza under the Solar Canopy.
  - Reachable from the mid side by the front steps, and by the terrace's north stair → the terrace → the flight.
  - Reachable from the base side by the back stair, and by the terrace's south stair → the terrace → the flight.
  - Reachable from the zone by the side stair.
  - Its 1.32 m faces are squid-climbable everywhere except the lift gates.
- **The seedbed terrace** (1.95, x −14 … −4) steps up from the nursery (1.3) to the deck (2.62). It carries raised
  seedbeds: hooped fleece rows, a cold frame and a long bed down its middle. It has stairs on its front, back and outer
  side.
- **East.** The side zone (a seedbed, a plant trolley, a water tank inside it; a row of glass bell cloches along its
  south edge), sapling standing beds (potted young cypress in rows), the propagation polytunnel and a pod.
  - **The landmark: the nursery's wind turbine**, standing in a bay of the lobe with its transformer kiosk. The hub is
    15.5 m up, the rotor turns, and it can be seen from both spawns.
  - The lobe's lane (x 15 … 21) runs past it with its stepping-stone trail and groves along the reservoir edge.
- **West: the orchard bank** (1.95) on the strip, against the reservoir. It gives the outer band height (the lead's
  review) and holds groves, bee hives, a water tank and saplings. Two flights come down its inner side to the strip's
  lane and trail.
- **South: the irrigation channel.** Its bed is at 1.0 (0.3 deep: you wade it, no pit) and it runs along the base
  terrace's front. The intake pump house at its west end spouts into it and a sluice closes its east end. The
  footbridge is on the axis, with stepping stones on either side.
- **Base terrace** (the old apron, moved). This is the station's forecourt and the goal-ready spot. It keeps the
  landing-pad ring (Tower Command's goal), gets a planter and a plant trolley as cover to re-form behind (the lead's
  review), and the cargo module moved 3.6 m east because the pump house took its corner.
- **Pods.** Two more per half (18 in all):
  - `nursery-w` stands in front of the seedbed terrace, between its stair and the deck's front steps: a hedge across
    the way up to the deck from mid.
  - `nursery-e` stands between the zone's cloche row and the tunnel: a hedge across the corridor from the deck's side
    stair to the lobe.
  - Neither is in a zone or on the track. Neither seals a route: each has ≥ 1.1 m and a full lane round it.

**Routes, mid → base (Alpha's half):**
1. **Centre:** the garden stair → the middle walk → up the deck's front steps and down its back stair, or round the
   deck through the terrace → the footbridge.
2. **West:** the west band / upper tier → down the strip's lane past the orchard bank (or over it) → the base
   terrace's west.
3. **East:** the band / the lobe → the lobe's trail past the zone and the turbine → the channel's east end → the base
   terrace's east.

The front lane and the bank lane cross the whole slice and link the three. There is no hidden shortcut: every route
walks the full 22 m, and the channel only has 0.3 m sides.

**Outline.** The diamond and pinwheel stay. The nursery keeps the old outline's width where it meets mid (the strip
x −28, the lobe x 21 with the turbine's bay out to 24.5). Toward the station both sides step in at the geodesic
angles:
- the strip at 60° to x −23, then 30° onto the base terrace's corner;
- the lobe in one long 60° facet from the bay, then a 30° one;
- so the stage narrows from 71 m at mid to about 49 m through the nursery, 41 m at the channel and 30 m at the
  station (out/treehills: top-before.jpg → top-blockout.jpg → top-after.jpg).

**Changes from the concept, and why:**
- The terraces are one stepped block (1.3 → 1.95 → 2.62) with the deck on top, not a flight of flat terraces. The
  strategic point gets a gradual climb from both sides, and the central route bends round or over it, so spawn→mid
  lands on 6 s without any route games.
- The channel runs along the base terrace's front, not across the middle. It frames the goal-ready forecourt without
  cutting the lanes, and it is wadeable, so bots can't get stuck in a pit.
- The turbine stands in a bay of the lobe, so the lane beside it stays 5 m wide.
- Two concept pieces grew: the "row of glass cloches" became real line cover (1 m bells over seedlings on a sill), and
  sapling standing beds and plant trolleys were added. They are nursery-typical cover and tie the nursery to the
  forests on the hills.
- The orchard bank and the taper came from the lead's review.

## Tower Command

The authored side (Bravo's half):

`[0,1.3,0] → [24,0] → [24,28] → [−4,28] → [−4,44.3] → [20.5,44.3] → [20.5,53] → [6,53]`, checkpoints `[24,8]` and
`[−4,37]`.

- The existing section is kept: out across the meadow, up the band and the upper tier, along it and down onto the
  strip. So is the final jog along Bravo's terrace to the goal.
- The rest is the nursery loop:
  - along the front lane;
  - down the middle walk and over the potting deck (it climbs the deck's front lift gate and drops off its back one;
    the second checkpoint is on the deck);
  - back along the channel's bank lane to the strip's lane (x 20.5, moved in from the edge so the outline can taper);
  - down to the terrace.
- The two tracks sit in different halves and never meet.

## Numbers before → after

| | before (0cd3945) | after |
|---|---|---|
| spawn→mid (t0 / t1 / avg) | 3.59 / 3.84 / 3.72 s (42.4 / 45.4 m) | 5.92 / 6.17 / **6.05 s** (69.8 / 72.8 m) |
| straight spawn→mid | 42.5 m | 64.5 m |
| tower-len | 78.2 m, 0.978 m/s, cps 35.9 / 66.2 m, 100 s | **151.8 m** (−2.9 % of 156.4), 1.898 m/s, cps 35.9 / 95.5 m, **100 s** |
| tower-check | clean | 0 holes, 0 issues, 3 climbs / 3 drops, both rides knockout (0 drops, 0 stalls) |
| cover (≤ 5 m of cover ≥ 0.9 m) | 99.9 % of 3872 cells, largest open circle 5.0 m | **99.8 %** of 5508 cells (+42 %), largest open circle 5.4 m |
| turf match (180 s) | stuck 0 % | stuck 0.1 % (longest 1.25 s); an earlier run 0 % |
| zones match | Bravo on time 76 / 47, stuck 0.5 % (longest 4.5 s), bots in the active zone 55.5 % | Bravo knockout at 250 s, stuck 0.5 % (longest 0.5 s), in the active zone 57 %; an earlier run: Bravo 65 / 36 after 26.6 s OT, stuck 0.2 %, 59.8 % |
| tower-match | Bravo retake 64 / 19, best push 35.8 / 66.2 m, stuck 0.4 % | Alpha on time 48 / 51, best push 79.8 / 75.6 m, stuck 0.5 % (longest 2.25 s, none by the tower); an earlier run: Bravo knockout 100 / 0 at 299 s, stuck 0 % |
| boss check | 9/9 | 9/9 (home ground 195.8 m², the lowland) |
| pods | 14; turf 10/10 · tower 7/7 · boss 8/8 | 18; turf 10/10 · tower 7/7 · boss 8/8; podbox pods.js 27/27 |
| climb-audit | 0 | 0 (144 climbs) |
| lightmap rows (8 ppm, 2048; size-budget) | 922 | 1298 (rebaked, hash 2fc7961f) |
| paint atlas | 25.4 ppm | 19.8 ppm |
| nav nodes / A* cap | 3708 / 1500 | 5434 / 3000 |
| perf at load, shoot.cjs day, mean of 2 back-to-back runs each (calls / tris / cpuRender / loadMs) | 361 / 3.00 M / 3.58 ms / 5805 ms | 349 / 3.44 M / 3.65 ms / 5880 ms (× 0.97 / 1.15 / 1.02 / 1.01) |

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint spot: the potting deck, (4, 2.62, −37)**, which is Tower Command's second checkpoint too. It's
  contested because:
  - it is the slice's high ground on the central route, 1.32 m over the nursery, with a view down the middle walk to
    the garden stair and the plaza;
  - both teams reach it by at least two ways (see above);
  - it has cover round it: the shed, the benches, the planter, the terrace's beds, the saplings and cloches below;
  - it overlooks the side zone.
- **Goal spot: the base terrace's landing-pad ring, (−5.5, 1.3, −51.5)**, in front of the deck stair and a level below
  the spawn deck (3.9), 13 m from the pad and outside the barrier. The defenders see it straight ahead from the spawn.
  It is reached:
  - over the footbridge (the centre);
  - down the strip's lane and along the terrace (the west);
  - past the channel's east end (the east);
  - across the stepping stones, or by wading the channel anywhere.
- **Routes mid → goal (nav lengths, `bazookarp.js`):**
  - shortest (the centre, round the deck through the terrace): 59.7 m;
  - the centre over the potting deck: 61.6 m;
  - the west down the strip's lane: 69.9 m (over the orchard bank: 81.3 m);
  - the east down the lobe past the zone and the turbine: 81.6 m.
- **High ground a carrier could hide on.** None out of reach:
  - The deck (2.62), the terrace and the orchard bank (1.95), and the hills' tiers are all walkable up stairs or ramps.
  - Everything taller is off-limits (`roof`): the shed, the tunnels, the cloches, the saplings, the tank, the
    transformer, the pump house, the turbine's plinth.
  - The trolleys (1.9 m) are above a jump with nothing higher near them.
  - A carrier could climb its own team's hedge top (1.8 m; the other team can't ink it). The top is reachable by that
    team and wilts in 20 s, so it's fine. If it ever matters, pods could sit Bazookarp out the way they already can per
    mode (`LAYOUT.pods.modes`).

## Pictures (`out/treehills/`)

- **The outline**, before / after: `top-before.jpg` (0cd3945), `top-blockout.jpg` (the first stretched block-out,
  full width to the stations: the lead's note), `top-after.jpg` (tapered). Tower: `tower-blockout.jpg` → `tower-top.jpg`.
  Zones: `zones-top.jpg`.
- **The slice from three angles**:
  - `nursery-west.jpg` (+ `nursery-west-dusk.jpg`): the stage-select camera over the orchard bank, the terrace, the
    deck and mid.
  - `nursery-east.jpg`: from over the turbine's corner across the deck to the canopy.
  - `nursery-from-mid.jpg`: from the garden looking back.
- **The strategic point**: `deck-view.jpg` and `deck-view-dusk.jpg`, from the potting deck toward mid.
- **The outer band's height**: `bank.jpg` and `bank-side.jpg`, the orchard bank from the strip's lane.
- **The forecourt**: `forecourt.jpg`, the station's forecourt with its new cover.
- **The zone**: `zone.jpg`.
- **Spawn `play`**: `play-day.jpg`, `play-dusk.jpg`.
- **Cover maps**: `cover-before.jpg`, `cover-after.jpg`.
- **Stage art**: `assets/stages/treehills-{day,dusk}{,-sm}.webp`.

## The lead's review of the block-out (2026-09-30), point by point

1. **Silhouette.** The outline tapers toward each station again: the strip and the lobe step in at 60° and 30° from the
   middle of the nursery. The tower's return up the strip's lane had to move in from the edge (x 24 → 20.5, the loop's
   far leg x 2 → 4, the deck rebuilt round its lift gate) to allow it. Pictures: `top-blockout.jpg` → `top-after.jpg`.
2. **The outer lawn bands** are now the orchard bank: 1.95, 0.65 m over the strip's lane, planted, with two flights down
   to the lane. The strip's lane beside it runs 4.5 m wide with a stepping-stone trail. Pictures: `bank.jpg`,
   `bank-side.jpg`.
3. **The forecourt** keeps its goal area open and gets a planter and a plant trolley either side of the footbridge's
   landing. There is also a planter on the deck's front ledge and two at the garden stair's head (cover gaps the move
   had opened). Picture: `forecourt.jpg`.
4. **Views.** Pictures: `play-day.jpg`, `play-dusk.jpg`, `deck-view.jpg`, `deck-view-dusk.jpg`.

Re-checked after these changes:
- cover 99.8 % / 5.4 m;
- spawn→mid 6.05 s;
- tower 151.8 m / 100 s;
- tower-check clean;
- climb-audit 0;
- stuck ≤ 0.5 % in every mode, no episode over 2.25 s;
- size-budget passes;
- pods turf 10/10, tower 7/7, boss 8/8.

## Shared files

None changed, and no requests. Everything is in `src/world/stages/treehills/` (new: `nursery.js`), the lightmap and the
stage art.

## Known issues

- On podbox, `tools/botlab/tests/pods.js` failed its "fighting from the top … off after the foe is gone" case once
  (26/27). Every later run passed 27/27, as the lead's did at 0cd3945. The test is flaky and engine-side.
- The tower track is 151.8 m, −2.9 % of the 156.4 m target and inside the ± 4 % band. The return lane moved in 3.5 m
  for the taper.
- The side zone's centre is 34.2 m from mid (32.7 m before). It has to clear the potting deck and the tower's middle
  walk. It is still the nearer half of the way from mid to the spawn.
- The band's ground decal is 12 px/m now (was 16), so the longer band column fits the stage's atlas region.
- The pods are placed for this stretch only. The lead's pods overhaul will re-place them.
