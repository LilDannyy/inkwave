# Gulper Aquarium, art phase: report after fix round 9 (review 9's list: the riser shafts and the minors)

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`, from 4df530c8 plus the lead's notes
(d451daac). The round answers LEAD-NOTES "After review 9" (binding) and `LEAD-REVIEW.json` (review 9), item by item.
Code head **7008e792** (tool f87aa075, art b0012310, test 7008e792), pictures 8ce49fca.

How it ran:
- **Where:** all local, one Electron at a time under SLOTS=3, WATCHDOG=900000 on page tests, load 3–7.9 (mostly 4–6).
  No Mac mini job, nothing pushed. No online or audio test (nothing crosses the wire; the load was over 4 most of the time).
- **Before / after:** "before" is a clean `git archive` of 4df530c8 (`scratchpad/aqr10/before`) with this round's sweep
  tool and test copied in; "after" is the code head. Same cameras, same tool, same settings.
- **Untouched:** the lead's untracked `LEAD-REVIEW*.json`; no layout, collider, nav, pipe or lightmap change (layoutHash
  fe6fba15, 1936 blocks, 4778 nav nodes in every sweep, before and after).

## 1. Review 9's list, item by item

| Item | What it is now | Proof (out/art/) |
|---|---|---|
| **1. The riser shafts** (major; 4 shafts, x ±6.15 … ±8.5, z −28.25 … −26.0, 0 … 8.4) | **Walls, floor, lid** (floorart.js, the review's first option: the faces themselves, under nothing, 0 triangles): **white glazed tile** in 0.15 m squares (a glazed white with each tile's own tone, a pillowed edge, 4 mm grey joints, a joint at every corner), the hall's **black-granite skirting 0 → 0.16 with a brass line**, the **faience speed lines** at 0.62 / 0.76 / 0.90 (the review's) **and** at 2.62 / 2.76 / 2.90 and 6.62 / 6.76 / 6.90, the hall wall's own heights, so its lines run on through the glass; the **floor a brass grille plate** (2.8 cm bars, 2.2 cm slots, a brass frame) **with a round drain** (a dark well under a radial brass grate) toward the glass; **the lid's underside tiled**. **Parts** (new prop `aquarium_shafts`, Alpha's frame, placed twice, the second turned π so Bravo's plates read N.): a **brass service ladder** in the back wall's wing-side corner (rails 6 cm off the wall at z −27.90 / −28.20, rungs every 0.3 m, stand-offs every 1.5 m, floor to lid) with a **cage of hoops every metre from 2.2 m** and three bars; **brass guide brackets** on the back wall round the riser at a 2 m pitch (a curved shoe 0.17–0.30 m clear of the glass on two arms and bolted wall plates): east 3.6 / 5.6, west 5.35 / 6.5; the **navy and brass ARCH LINE · RISER plate** facing the glass over **→ S. REEF HALL** (east, 2.3 – 2.74 m) or **→ S. PROMENADE** (west, 1.4 – 1.84 m), Bravo's **→ N. REEF HALL / → N. PROMENADE**; a **caged bulkhead lamp** (brass base, glow dome, brass ring and cross bars) on each side wall at **2.4 and 7.6 m** toward the back corner, lit at dusk with a warm light pool on the tile, floor and lid (a fifth of it by day). **Clearance:** every vertex ≥ **1.06 m** from the riser's centreline (its glass r 0.88: ≥ 0.18 m clear; the rule asks 1.03), ≥ 0.168 m from the riser's brass collars' vertices; all inside the shafts; **no collider**; only the `metal`, `paint` and `glow` buckets the dressing already has, so **no draw call added** for all four. | `r9-named-*-000-x9-shaft` (the review's x9-shaft-0…4), `-002-xs-shaftnear` (mine: close up and looking up the riser), day / dusk / Bravo day / Bravo dusk; `r9-sweep-*-037-shaft-glass.0`, `-038-shaft-glass.1`, `-151-pipe-glass.1` |
| **2a. The Kelp Balcony's inner metre** (minor, the shader gate) | floorart.js R5B_FACES and R5B_BEVELS: the bearing window **193 … 257 → 182 … 268**, as the review specified. The end faces are render with the skirting, speed lines and teak fascia to the drum end on both halves. The plant-room wall above is unchanged: the sweep's 061 / 062-plant-room move 0.2 / 0.6 % (day), 0.1 / 0.2 % (dusk). | `r9-named-*-001-x9-balc`; `r9-sweep-*-149-kelp-balcony.0`, `-059-drum-glass.1`, `-061/062-plant-room` |
| **2b. The Reef Window's plain jambs** (nit) | Both of the review's options, on all three jambs (α −70, −67, −58): a **1.5 cm renderSh groove either side of the rib**, a **brass strip up the rib's face**, and a **brass-ringed porthole** (r 0.3, dark glass, eight bolts) at 1.6 m into the reef, on the window side of the rib; its ring flattened so the farthest vertex is 8.0 cm off the block's end (section 12(d)'s 8.5 cm still holds: 0.082 farthest, the round-8 skirting). | `r9-named-*-003-xg-gate`, `-005-xr-jamb58`; `r9-sweep-*-053/054-reef-window`, `-051-window-kerb.0` |
| **2c. The Express IN stop** (nit) | New prop `aquarium_stopinfaces`, the OUT stop's pass at floor 0, cap 3.2: on both long faces a black-granite skirting 0 → 0.16 with a brass line (round the back too, not across the mouth face), a fluted 0.18 m render pilaster at each corner up to the cap, the three faience speed lines at 0.62 / 0.76 / 0.90 now 4.5 cm deep and across the pilasters (they moved out of `aquarium_stops`), a brass-ringed porthole either side of the TUBEWAY roundel (±1.42, 1.9). Within 7.9 cm of the block, under its top. | `r9-named-*-006-xs-in`; `r9-sweep-*-130-express-stop-in.0`, `-132-sea-coping.0` |
| **2d. The sweep tool's near-face cameras** (nit) | `stage-sweep.cjs`: the review's two rules (a wall counts within **1.5 m**; the centre ray may not meet another piece's wall under **0.5 × the target's distance**), plus two fixes they needed: the nine rays now cross the frame the view really shoots (toward its look point; a small cluster's view looks at its middle, the rays went to its nearest point), and an eye whose nine rays meet **nothing of the piece and six another piece's opaque wall within 1 m past the target** is dropped (drum-glass.0.2 / .1.4 looked past the drum's curve, their target the box's corner in open air: neither of the review's rules catches that). Re-run: **25 of 515 cameras move, 3 drop (512 views), the same 169 clusters and 14 with no eye-level view.** Of the five: drum-glass.0.2, pump-housing.0.0, whale-bench.0.2 moved and frame their piece; pipe-glass.3.1 dropped (its cluster keeps its other views); drum-glass.1.4 moved 2 m and shows the drum but still has the deep Kelp stop's mouth across most of the frame. README updated. | `r9-sweep-nudged-cameras` (old \| new, Bravo dusk) |

**Picture names.** `r9-named-<day|dusk|dayB|duskB>-<nnn>-<group>.jpg`: the review's x9 cameras (x9-shaft-0…4, x9-balc-0…2)
plus mine (`xs-shaftnear-0…3` close up and up the riser, round 8's `xg-gate` / `xr-west` / `xr-jamb58`, `xs-in-0…2` on the
IN stop), each sheet BEFORE (4df530c8) over AFTER with every view's changed share. `r9-sweep-<day|dusk|duskB>-<nnn>-<cluster>.jpg`:
the sweep's own sheets for the shafts, the balcony and plant room, the Reef Window, the IN stop, and the clusters that see
them; `r9-sweep-<set>-clusters.txt` the three full lists. `r9-card-check-<day|dusk>`: the art camera. The full sets
(512 views × day / dusk / Bravo dusk, before and after) are in `scratchpad/aqr10/sweep/{b,a}-*`.

## 2. Decisions where the list left a gap

1. **The shafts' walls, floor and lid are drawn in the level shader** (the review's "a floorart.js branch for faces inside
   that box"), the parts in a prop. The tile is the wall's own surface: it runs up to where the riser dives into the back
   wall without cut-outs or z-fighting, costs no triangle, and is how floorart.js dresses every other face on the stage.
   The lead's "a batched prop type inside the void" holds for everything with depth.
2. **Speed lines at both heights.** The hall wall's lines are at 2.62 / 2.76 / 2.90, not 0.62: the pylon's render cells
   stand on y 0, not on the −2 foundations (surfaces.js puts them 2.62 m over a wall's foot). The shaft carries those on
   through the glass (and 6.62 … up the shaft) and also the review's 0.62 / 0.76 / 0.90 over the skirting.
3. **"Clear of the riser tube" is measured from its glass** (r 0.88, the engine's `PIPE.rOut`): ≥ 1.03 m from the
   centreline (the densified tubeway.js path, both twins). The parts keep ≥ 1.06; the collars (r 0.95) are ≥ 0.168 m off.
4. **The brackets do not touch the tube.** A bracket that held the glass would break the 0.15 m rule, so each is a guide
   shoe: an arc concentric with the riser at the least radius (from 1.06 m, by the build itself) that keeps 1.06 m. Their
   heights follow the riser, not the review's numbers where those fall in a bend: **east 3.6 / 5.6** (1.5 lies in the bend
   diving into the back wall, 0.83 m from it; 3.5 would sit 6 cm over the collar at 3.37), **west 5.35 / 6.5** (4.5 lies in
   the lower bend, which leans to 1.1 m from the wall: a shoe would need r 1.22, past the wall).
5. **The east plate is at 2.3 m, behind the riser.** At 1.4 – 1.9 the east bend fills the back wall (a plate there would be
   0.47 m from the centreline). Every height of the east back wall is behind the riser from the hall: the plate is read
   through the clear tube. The west plate is where the review put it, centred at 1.4 – 1.84 (the review's pixel read).
6. **The ladder stands in the wing-side back corner** in both shafts: the court-side corner is the east bend's below 1.9 m.
   Its cage is shallow (0.26 m) to keep clear of the riser; it starts at 2.2 m as cages do.
7. **The lamps** sit toward the back corner (x ±7.95): at the wall's middle a 0.11 m lamp would be 1.0 m from the riser.
   They light the tile, floor and lid round them (a warm pool, the stage's `gAqWin` path) at dusk, a fifth of it by day.
8. **The test reads the shafts with their glass hidden** (the hall's glass, the riser's tube and collars). Through them
   every value is lifted 40–100 by the glass's tint and the sun's reflection (a navy plate reads 102 against a tile's 129
   on Bravo's sunlit west shaft), so no threshold holds on both halves; the pictures show the shafts with the glass.
9. **The IN stop's court face** gets the same pass, but it stands over the Pump Hall's 1.2 m bund and 1.5 m behind the
   third sand filter, so only the plaza face is read (and pictured).
10. **The jambs took both options** (the rib's grooves and brass strip, and the porthole): the porthole is what makes 4.4 m
    of render read at eye level; the strip makes the rib read at a distance.
11. **The sweep's fourth rule** (the frame shows nothing of the piece) goes beyond the review's suggestion; without it two
    of its five cameras would not move. It moves 25 cameras, not 516-wide churn: a nearest-block aim I tried moved 63 and
    looked steeply up at the pipe glass, so I dropped it.
12. **The cards were not re-made**: the art camera (1920 × 1080) changes 0.0 % (day) / 0.3 % (dusk) of its frame, animated
    water only (`r9-card-check-*`).

## 3. Online and bots

- **Nothing crosses the wire.** Every new piece is a prop or a shader branch built from layout numbers on every screen. No
  record, rule, collider, nav edge, pipe or mode changed.
- **Bots:** their world is the same (section 1: 296 placements, this round's 4 among them, 0 colliders). In the match below
  stuck was 0 %, giveUps 0.

## 4. Tests and results (all local)

| Check | Result |
|---|---|
| tests/aquarium-art.js at the head, **3 runs** | **60/60, 60/60, 60/60**: the 54 earlier checks and section 13's 6. Programs link, 0 console errors. |
| The same test on the clean 4df530c8 copy | **54/60**: exactly section 13's six checks fail. |
| tests/pipes.js | **92/92**, console errors none (the ride camera passes through the shafts) |
| Turf War ×1, 180 s, PAGEQ=pipestats | See below |
| The sweep, before / after | 512 views, day / dusk / Bravo dusk; CHANGED 20 / 20 / 20 (below); 0 console lines |
| The named cameras, before / after | 25 views, 7 groups × 4 sets; CHANGED 6 of 7 in every set (xr-west, looking at the short run's outer face, does not see the α −70 jamb's porthole) |
| The art camera | 0.0 % (day) / 0.3 % (dusk); the tool's CHANGED 0 |

**Section 13's reads (both halves; run 3):**
- **(a) The shafts** (glass hidden): the plate's median luminance 15–16 against the tile under it 82–86, blue (b − r 40–42);
  the skirting 18–27 against the tile over it 90–104; a column across two tile joints dips to 0.70–0.72 of its median. At
  4df530c8: plate spot = tile (90–92 / 88–91), skirting 46–124 against 94–110 (the render's own contact shadow), joints
  0.97–1.00.
- **(b) The parts:** 2 placements, 37,012 vertices; nearest to the riser's centreline **1.060 m**; 1,524 vertices between
  1.03 and 1.10 (the shoes); nearest to a collar vertex 0.168 m; 0 outside the shafts; buckets `metal`, `paint`, `glow`,
  none new. At 4df530c8 there are no placements.
- **(c) The Kelp Balcony** at u 5.0: [65, 79, 98] / [69, 81, 95] against u 6.6's [63, 77, 96] / [66, 78, 93] (ratio 1.03 /
  1.04, render). At 4df530c8: [28, 23, 20] / [33, 26, 19] (teak, ratio 0.32 / 0.36).
- **(d) The IN stop's plaza face:** portholes 26–31 against the render beside them 108–137, skirting 0 against 91–122. At
  4df530c8 the porthole spots read the render (107–137). (The skirting spot reads 0 there too: the block's foot is dark
  at the plaza; the portholes are what fails.)
- **(e) The jambs' portholes:** glass 26–29 against the render over them 101–116 (α −67, −58). At 4df530c8 the glass spots
  read the render (101–119).
- **(f) The IN-stop parts:** 2 placements, 2,680 vertices, farthest 7.9 cm from the block, none over its top.

**Turf War ×1, 180 s, PAGEQ=pipestats:**
- Turf 41.9 / 29.8. Stuck 0 %. Splats 43. Frame errors 0.
- Rides 21 (0.875 per bot-minute), giveUps 0, longest push at a mouth 0.5 s.
- High-ground arrivals by pipe 22.2 % (8/36), inside the 10–35 % target.
- Camping: 2 deaths within 2 s of 21 landings, 0.095 per landing against a base of 0.060 (the exit cooldown of 3.5 s
  lands at integration).
- The only console lines are the 7 pipestats lines.

**The sweep's CHANGED list** (day / dusk / Bravo dusk, 20 each) is this round's pieces and the clusters whose views see them:
both shaft-glass clusters (4.2 / 2.2 % by day, 12.1 / 8.2 % at dusk, the lamps), the pylon, the shark bench, pipe-glass.1
and .2 (the riser), the penguin glass and rocks (one view each from the Gate Terrace into the east shaft); the Kelp
Balcony and drum-glass.1 (its end face); the Reef Window, its kerb and the clam (the jambs); the IN stop, the sea coping,
the bund, the third sand filter and the pump set (the IN stop). Under 2 %, the animated water named in the tool's header:
the bubble column, the drums' glass, the tank glass and the deck nosing (Bravo dusk).

**Triangles.** A headless count of every placement, both halves: 562,340 at 4df530c8, **597,392 now (+35,052, +6.2 %)**:
the shafts 27,924 (four shafts: the plates' lettering, the ladders' 70 hoop rods and rungs, the lamps), the jambs +4,536,
the IN stop's faces 2,736 (its old lines −144). Still 6 material buckets: no draw call added. Only the hall's views and
the ride see the shafts.

## 5. Commits and files

| Commit | What |
|---|---|
| f87aa075 | `tools/botlab/stage-sweep.cjs`: the near-face rules (rays toward the look point, 1.5 m, the centre ray, the frame showing the piece); README "Stages" entry |
| b0012310 | The art: `floorart.js` (the shafts' tile, skirting, speed lines, grille floor, lid and lamp light; the Kelp Balcony's gate 182 … 268 in R5B_FACES and R5B_BEVELS), `arch.js` (`aquarium_shafts`, `aquarium_stopinfaces`, the jambs' grooves, brass strip and porthole; the IN stop's old lines removed from `aquarium_stops`; imports `tubeway.js`'s centreline), `props.js` (three placements) |
| 7008e792 | `tests/aquarium-art.js`: section 13 |
| 8ce49fca | (scratch) The 70 r9- pictures and the three cluster lists |
| this report's commit | (scratch) This report |

**Files, for the integrator.**
- **Shared files touched:** `tools/botlab/stage-sweep.cjs` and `tools/botlab/README.md` (its entry). No game shared file.
- **Everything else:** `src/world/stages/aquarium/` (`arch.js`, `props.js`, `floorart.js`) and `tools/botlab/tests/aquarium-art.js`.

## 6. Unfinished, uncertain, worth knowing

- **By day, from the hall, the shafts read through a pale haze**: the shaft glass (backdrop.js's glass material, tint and
  sun reflection) lifts everything behind it, most on the sunlit east shaft (Alpha) and west shaft (Bravo). The tile,
  ladder and plates read; at dusk, with the lamps, the shafts read strongly (`r9-named-dusk*-000/002`). I did not touch
  the stage's shared glass look.
- **The east plate is behind the riser** (decision 5), so from straight on it reads through two layers of glass; it is
  clearest from x9-shaft-1 / -2's angles and close up (`xs-shaftnear-0`).
- **Two brackets per shaft, not the review's three east**; their heights moved off the bends (decision 4).
- **drum-glass.1.4** still has the deep Kelp stop's mouth across most of its frame after its 2 m move (its sector has no
  better eye). The art there is seen from the drum's other views.
- **The west riser's drawn glass ends inside the shaft** (at the leg's hide range, s 25.4, 0.6 m short of the back wall),
  as before this round; nothing may stand within 0.15 m of it to sleeve that end. Not in review 9's list.
- **Triangles +6.2 %** (the performance probe in LEAD-NOTES was closed with Aquarium 18 % under Halyard; not re-probed).
- **Not re-run:** check-maps, climb-audit, cover-map, stage-audit, the boss check and the net tests. No layout, collider,
  nav, pipe or lightmap changed.
