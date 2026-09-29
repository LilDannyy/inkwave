# Kelpline Terminal (`kelpline`) — the Long Stages stretch

Scratch job note (never merged). Pictures: `out/kelpline/`. Code: `src/world/stages/kelpline/` (layout.js `STRETCH`,
`SLICE`, `slicePieces()`; props.js `BERTH_PLACEMENTS` / `SLICE_PLACEMENTS` and the new builders `kelpline_rtg`,
`kelpline_tp`, `kelpline_store`, `kelpline_wbhut`, `kelpline_blocksign`, `kelpline_flatstack`, `kelpline_barge`;
murals.js), `src/world/tower-data.js` (kelpline), `assets/lightmaps/kelpline*`, `assets/stages/kelpline-*`.

## The cut and Δ

- The berth is authored in its local frame (x across the pier, z along it) and turned 35°: the spawn axis is local z,
  so the stretch runs along the pier's axis and the skewed silhouette is kept.
- **Δ = 23 m per half.** Straight spawn → mid 43.6 → 66.6 m (× 1.53).
- **The cut:** local z = −31.6, the stacks' base end (Block 4A / Reefer rack R2 start there; the base apron, the Terminal
  Operations building, the truck gate and the reefer yard lie beyond it), plus the reefer-side wing (x < −24: the
  empties / reefer depot belongs to the base). `beyondCut(x, z)` in layout.js.
- Everything beyond the cut is authored where it always stood and moved out by `stretch()` (layout pieces) /
  `moved()` (placements): base apron, ops building + control tower, spawn pad and flags, truck gate, reefer yard,
  depot wing and its kit, back wall, the terminal behind it (backyard), the next crane K6, the gangway, the Tower-only
  cage by the goal.
- Pieces that cross the cut grow at their base end (`grow`): the lane slab, both yard slabs, both aprons; the crane rails
  and the quay edges along the aprons are drawn at their new length (`final`). The mural slabs were redrawn for the new
  lengths (their centres now sit near the cut, so old features' twins land in the slice: Block 4A's slot rows repeat
  under Block 4B, the lane's zebra doubles across the cut, the power strip's twin is RTG 41's runway edge; the lane's
  arrow / roundel moved a little so their twins land beside the transfer platform and at its stair foot).
- Mid, both side zones and the centre zone are untouched. Bounds 52 × 55 → 65 × 73 (world AABB of the turned berth).

## The slice: Block 4B and the RTG lane (local z −54.6 … −31.6, each half)

The container yard carries on one more block: the same working terminal, one block further from the quay crane.

- **Cross aisle C** (z −37 … −31.6): a straddle / truck aisle right across the pier, apron to apron — the link across
  the slice. The old stacks' base-end stairs (4A, R2) now land in it; the transfer platform's mid stair lands in it; a
  twistlock bin, barrier, cones, a lashing cage and block-id signs (4A / 4B).
- **The RTG lane** (x −8.5 … 8.5): the truck lane carried on under **RTG 41**, a rubber-tyred gantry parked across it
  (same livery as the backyard's RTG 22). Its sills sit in painted runways against Block 4B and the store dock
  (1.3 m, walkable, cover, and a double hop onto 4B), its legs are tall cover, its top frame is off limits (roof); the
  trolley is parked to one side so the map shows what's under the portal.
- **The transfer platform (the strategic point)** under RTG 41's portal, in the middle of the lane: a 6 × 5.6 m steel
  deck at 2.4 m (the Landing's top height), plated climbable sides, a 3 m stair up from each end (the mid stair's foot
  in cross aisle C, the base stair toward the forecourt), corner handrails with the long sides open in the middle (drop
  off either way). On the deck: the lashers' booth (cover), a lashing-bar stillage (cover, a step), a twistlock bin.
  The lane passes on both sides (4.6 m gaps between the deck and RTG 41's sills). It looks straight down the lane to
  the Landing, under K7.
- **Block 4B** (+X, rows 1–3 of 4A's grid carried on; row 0's strip is RTG 41's runway): a 2.6 m stack plateau with a
  stair up from each end (one from the forecourt, one from cross aisle C), a 2-high 40' wall along the apron with a 10'
  on top (cover up there), a 10' at the mid end, a pocket at the base end.
- **The lashing store** (−X): a steel shed (roof off limits) with a 1.2 m loading dock along the lane side (steps at the
  mid end, pallets of lashing bars as cover, shutters under a cantilevered canopy), its yard facing cross aisle C with
  **Weighbridge 2**'s office (read-out board, signal) and a twistlock bin.
- **Aprons:** the ship side gets a stack of hatch covers (1.2 / 2.4 m, "No. 9"), a light tower, bollards / fenders /
  a ladder on the longer quay edge; the reefer side (no ship) gets folded flat racks (1.3 m), a parked forklift, a
  light tower, and **EBB RUNNER**, a container barge moored along the free quay between the mid bulge and the depot
  (visual; its hull and cargo are off limits). TIDEBANK (110 m) already runs the length of the stretched berth.

Heights in the slice: 0 · 1.2 dock / hatch · 1.3 sills / flat racks · 2.4 transfer platform / upper hatch · 2.6 Block
4B · 5.2 4B's wall (climb).

### Routes (each half), mid → base

1. The lane: under K7, past the trailer and the reach stacker, then either side of the transfer platform (between its
   deck and RTG 41's sills) or over it (stairs), to the forecourt.
2. Ship-side apron along TIDEBANK (hatch-cover stack, light tower), into the forecourt past the gate.
3. Block 4A's plateau (the side zone) → down its base stair into cross aisle C → up Block 4B's mid stair → along 4B →
   down its base stair to the forecourt (or across onto RTG 41's sill and down into the lane).
4. Reefer side: R2's catwalk / alley → cross aisle C → the store yard → up onto the dock → along the dock to the
   forecourt.
5. Reefer-side apron behind the store, past the barge, onto the depot wing and the reefer yard.

Spawn: unchanged (ops roof deck, a stair and two drops out). Goal-ready base front: the forecourt below the spawn deck
(x ±9, 7.8 m deep), reached from the lane, 4B's base stair / the gate side and the dock / reefer side.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint:** the transfer platform's deck, berth-local (x 0, z −42.4, y 2.4) = **world x −24.32, z −34.73,
  y 2.4**. Contested: it sits on the main lane both teams use, 23 m from the side zone and 20 m from the forecourt, overlooked by Block 4B and
  the spawn deck; up by two stairs from opposite ends plus climbable sides; cover on it (booth, stillage) and round it
  (RTG 41's legs + sills, the dock, 4B).
- **Goal:** the forecourt beside the ops stair on the gate side, berth-local (x 6.4, z −58.0, y 0) = **world x −28.03,
  z −51.18, y 0**, 10.7 m from the pad, a level below the spawn deck (the defenders see it from the deck edge). Routes in: the lane's +X
  gap past the platform, over the platform, Block 4B's base stair, the ship-side apron through the gate, the dock /
  reefer side across the forecourt.
- **Routes mid → goal** (nav, Bravo attacking): the lane past the platform 58.6 m, over the platform 60.8 m, the reefer
  side via R2's catwalk and the store dock 87.3 m, the ship-side apron and Block 4B 93.6 m (details under Numbers).
- **High ground a carrier could hide on:** none in the slice. RTG 41's top frame, the store roof, the booth and the
  4B 10' on the wall are off limits (slide off). Block 4B's 5.2 m wall top (and 4A's, as before) is reached by swimming
  up the inked container sides: open, exposed to the platform and the forecourt, not a hiding place — no no-carrier
  zone needed. (K7's girders at mid remain the specials-only perch the user asked for.)

## Numbers (before = new-stages 0cd3945 + the DEVSTAGE commit; after = this branch)

| | before | after |
|---|---|---|
| `check-maps` | 185 pieces, ok | 283 pieces, ok |
| spawn → mid, straight | 43.6 m | 66.6 m (× 1.53) |
| spawn-mid.js t0 / t1 | 47.6 m 4.04 s / 50.5 m 4.28 s | 73.2 m 6.20 s / 76.0 m 6.44 s |
| spawn-mid avg | 4.16 s | **6.32 s (× 1.52; band 6.03–6.66)** |
| cover map (≥ 90 %) | 92.3 % of 4514 cells, largest open circle 10.5 m (Block 4A's plateau) | **94.5 %** of 6372 cells, same largest circle |
| climb-audit | 424 climbs, 0 barred | 520 climbs, 0 barred |
| size-budget: lightmap rows (of 2048) | 730 (kelpline) | 1007 (kelpline), 1001 (kelpline.tower) |
| paint atlas density / nav nodes / A* cap | 30 ppm / 4508 / 1500 | 25.4 ppm / 6118 / 3000 (≤ 6000) |
| bots, turf (stuck %) | 2.6 % (120 s) | 0.8 % (120 s), 0.3 % and 0.9 % (180 s, final); longest episode 2.25 s |
| Zone Control match | — | Bravo 77–75 by time, 4 captures, 6 rotations, stuck 0.7 % (an earlier run: Bravo 100–64, stuck 0.2 %) |
| tower track (3 checkpoints) | 109.0 m / side, 1.82 m/s, 100 s to the goal | **135.5 m / side**, 2.26 m/s, 100 s to the goal; checkpoints unchanged at 31.4 / 54.3 / 86.6 m |
| tower-check | — | 0 holes, clearance clean, 1 climb + 3 drops (as drawn), both rides knockout, 0 knocked off, no stalls |
| tower-match | — | Alpha knockout at 116.8 s (the full 135.5 m, 3 checkpoints), stuck 0 % (an earlier run: Bravo by time 56–8, best push 117.9 m, stuck 1.2 %) |
| boss check | home ground 175 m², max idle 3 s, roams 7 m / 3 cells (FAIL) | home ground 175 m², max idle 4 s, roams 15 m / 4 cells (FAIL, as before: HULLBREAKER keeps to the mid bulge here) |
| perf at load (shoot.cjs REPORT, day) | 266–316 calls, 2.06–2.19 M tris, cpuRender 3.75 ms, loadMs 6.6 s | 259–310 calls, 2.37–2.44 M tris (× 1.13), cpuRender 3.08 ms, loadMs 6.4 s |

Perf: four samples each, before and after alternating, on a machine shared by five agents (load average 50–110): the
timings are the best (least loaded) sample of each side; draw calls and triangles are the steady numbers (calls within
the same spread, triangles × 1.13 — RTG 41, the transfer platform, the store, the barge and Block 4B per half).

Routes mid → goal (nav, Bravo attacking, forced through the waypoints; `out/kelpline/routes.js`): the lane past the
platform 58.6 m; over the transfer platform 60.8 m; the reefer side (R2's catwalk → cross aisle C → the store dock)
87.3 m; the ship-side apron → Block 4B's plateau → its base stair 93.6 m. (Straight from the centre: 58.4 m.)

## Known issues

- The boss check's "roams" item fails before and after (HULLBREAKER keeps round the mid bulge on this stage; 7 → 15 m
  walked in 120 s); home ground and idling pass. Nothing in the slice changes that — noBoss stays the lead's call.
- The lane / yard slabs are 47.6 m long now: their markings sit at ~21 px/m along the pier (31 before) in the shared
  2048 × 1008 mural region (repacked: every stage mural id 4–11 is used).
- RTG 41's top frame (15–17 m) is over the transfer platform; its trolley is parked to one side and the portal beams
  miss the deck, so the map / top views still show the deck.
- Δ is 23 m (the brief's guide: 18.5–22): at 22 m the projected average sat at the band's floor (≈ 6.0 s); 23 m puts it
  mid-band (6.32 s).
- Fixed on the way (pre-existing, both stages): the truck gate's boom-barrier colliders were declared inside a pushed
  frame, so they stood as an invisible 1.05 m post at the gate's origin instead of at the barriers.
