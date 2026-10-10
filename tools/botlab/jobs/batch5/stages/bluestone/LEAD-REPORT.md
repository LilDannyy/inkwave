Bluestone Junction is still the **dog-leg, a kinked Z** of round C. Each team's Swimston Street runs up from its spawn, and the two legs are offset 43 m sideways. Flounders Street Station's concourse runs across between them as the crossbar, and the river fills the Z's two re-entrant corners.

The fix-1 review passed the shape again ("Bluestone's Z cannot be mistaken for Crossroads Market from above") and sent the blockout back on three narrow points. **Round C fix 2** answers all three. All the geometry is in `layout.js`:

1. **The knee flight is rebuilt at 23.2°.** It was 32.3°, so `check-maps` failed in every build. It now prints `ok` in all 15 builds (5 variants × 3 eras).
2. **The era-1 punt is 5 m wide, with a 7 × 7 m ferry landing stage at its corner.** Its ink went from about 20 % to a mean of 54 % over 8 runs (lowest 45 %).
3. **The Halo was measured again:** 8 era-3 runs, mean 48 %. One run read 24 %, so as the review asks, I give the full set and propose one geometry change below for the lead to decide.

At the final source (5aa4b5f7):
- Floor is 5,006 / 5,166 / 5,688 m², with 99.5–99.6 % within 5 m of cover. Era 3 is +10.1 % over era 2.
- Spawn → mid is 6.13 / 6.46 s, and 0 of 36,100 deck-to-deck sightlines are clear.
- appear-check reads 0, climb-audit has 0 barred climbs, and the strip test finds 0 strips over 25 m.
- tower-check is clean in every era.

Everything ran on this Mac, one Electron at a time under the shared lock. The Mac mini is down, so I ran no balance set. **From now on every report lists `check-maps` with the other checks** (the review's request).

## The review's issues, one by one

### 1. check-maps failed in every build: the knee flight was 32.3° (minor)

**What I changed** (d3bac0e7). I took the review's option (a): I rebuilt the flight at ≤ 24°, and no waiver is needed.
- **Why it had to grow east.** The foot cannot move west: Alpha's tower lane is x −20.75 … −18.25 (the track's mirror is at x −19.5), and the foot is already 0.45 m off it. So the flight now runs from x −17.8 (0) east to **x −12.2 (2.4)**, over z −18.5 … −15.5.
  - That is 5.6 m of run for its 2.4 m rise, **23.2°**.
  - It is 3 m wide, the balcony's full depth.
- **The balcony gives up its west 1.8 m.** It now runs x −12.2 … −5, and the flight's top walks straight onto it.
- **The landing opens off the flight's north side** (x −14 … −12.2 at z −15.5). From the flight's upper half a kid steps up 0–0.7 m onto the landing. In the 3000s the hotel stair is then one step west off the landing.
- **What moved for it:**
  - The cab shelter's south end moves from z −15.8 to −15.5 to meet the flight.
  - The landing's planter stands back against the landing's north balustrade (x −12.9 … −11.9, z −13.8 … −13.0). That leaves 1 m clear of the balcony stair's head and of the hotel stair's side, and keeps the landing's south half a clear junction.
  - A second planter stands on the balcony behind its balustrade (x −8.6 … −7.4): cover for shooting into the circus.
  - The kerb planter under the balcony's west end, now inside the flight, is gone. A balcony post moved 0.15 m north.
  - Both planters' tops are roofs.

**Proof:**
- **check-maps prints `ok` for `bluestone`, `.tower`, `.zones`, `.bazookarp` and `.boss` in eras 1, 2 and 3** (`local-logs/rcf2/node-checks.txt`, "check-maps"). The flight was half[112] / half[115] at 32.3°.
- **tower-check**, every era, with both rides:
  - 73.99 / 73.99 m, 0 holes, clearance clean, 1 drop;
  - both rides a knockout at 83.4 s, no rider knocked off, no stalls.
  - The flight's foot did not move, so it is still 0.45 m off the lane.
- **The bots' paths** (`rcf1-paths.mjs`):
  - Era 3, pad → the Halo's 270° side is **69.7 m**, by Swimston → the flight → the landing's south-west corner → the hotel stair. It was 69.1 in fix 1 and 81.2 before the flight.
  - Swimston's knee → the balcony is 14.6 m (was 15.4).
- **Bazookarp:** `rc-weir.py` finds nothing solid or changing within 3 m of either weir, either Gate or the Pond. The flight's mirror stands 3.2 m from the weir.
- **The other checks:**
  - appear-check: 0 violations in the turf, tower, Bazookarp and boss builds.
  - climb-audit: 130 / 130 / 144 climbs, 0 barred. Fewer climb edges than fix 1's 146 / 146 / 160: the longer flight replaced hops.
  - The boss check: home ground 555 m², overhang worst 0.04 m (the landing).
- **Pictures:**
  - `r4-era1-knee-flight`, `-knee-flight-side`, `-knee-flight-top`, `-knee-flight-down`, `-knee-flight-landing`, and the same five in era 3;
  - `r4-era3-knee-flight-to-halo` and `r4-era3-hotel-stair-from-flight`;
  - `r4-era{1,3}-zones-sidezone-from-balcony`, now taken from the flight's top.
  - The flight reads as an ordinary iron stair up the hotel's north face.

### 2. The era-1 punt was the barest floor on the stage (minor)

**What I changed** (b9fef3ce, 5aa4b5f7):
- **Both legs widen to 5 m on the open-river side.** The basin side, the Iron Bridge and the garden are unchanged.
  - The east leg runs x −6 … 11, z −46 … −41 (was z −44 … −41).
  - The north leg runs x 11 … 16 (was 11 … 14). Its last 4 m (z −24 … −20) are 3.5 m wide (x 11 … 14.5), running up against the Boathouse's west wall.
- **Why 5 m and not the review's 4.5.** The bots' nav makes a path pay for every node with open water (or a wall) within 1.2 m (+2.0) or within 2.2 m (+0.5) (`nav.js`'s wet rule). Its nodes sit on a 1 m grid at the half metres.
  - At 3 m every node on the punt was wet.
  - At 4.5 m the middle rows would still be wet (+0.5).
  - At 5 m, between edges on whole metres, the middle row of each leg is 2.5 m from the water both ways, so it is dry.
- **A ferry landing stage, 7 × 7 m, at the L's corner** (x 11 … 18, z −48 … −41). It stands 2 m proud of both legs on the river side.
  - On it are the **ferryman's box** (2 × 1.8 m, 2.2 m tall, `roof`) against its south rail, and **a crate stack** (1.2 m) against its east rail.
  - It looks west along the east leg to the quay and north along the north leg to the Boathouse's flank.
  - I put it outside the corner rather than at the review's x 8 … 14, z −44 … −38. That spot is inside the basin, so the era-3 garden would have lost a tile.
- **Cover** stands along the edges, so the middle rows stay dry: crates and mooring posts on alternate sides, 6–9 m apart. The north leg's two posts leave 1.85 m between their faces (5aa4b5f7). With the landing stage, a 2 m strip had run 26 m from the ferryman's box to the circus, which the strip test flags.
- **Rails** run along every open-river edge, including the landing's four outer edges.
- The quay's bollards moved 1.6 m south, off the widened foot.

**Proof:**
- **Era-1 ink-regions, 8 runs at the fix-2 source: the river crossings read 45, 51, 62, 51, 54, 62, 52, 56 %.** The mean is **54.1 %** and the lowest 45 %. Target: a mean ≥ 35 % and no run under 25 %.
  - Before: the review's 25 / 36 %, fix 1's 21 / 16 / 24 / 18 %.
  - Runs 1–4 ran at b9fef3ce's source, before the posts moved; runs 5–8 at 5aa4b5f7.
  - The region's floor grew from 284 to 493 m² (both halves folded), so this is more ink on more floor.
- **On the bots' nav** (`rcf2-punt-wet.mjs`, era 1):
  - The punt's nodes are **25 % dry** (102 of 401). Before, 2 % were dry (4 of 212).
  - The A* surcharge for the quay → the landing fell **from 23.5 to 0**.
  - The bots' own quay → the circus at 5 o'clock now takes the punt (46.8 m). Before, it went under the hotel's arch.
- **The size rules:**
  - Floor is 5,006 / 5,166 / 5,688 m² (+188 in every era).
  - Era 1 stays under 5,500.
  - **Era 3 is +10.1 % over era 2** (the floor is +10 %) and +13.6 % over era 1 (the ceiling is +15 %). This margin is why the punt could not grow more without adding era-3 floor too.
- **The other checks:**
  - Cover within 5 m: 99.6 / 99.6 / 99.5 %. The largest open circle is still the side zone's fountain (7 m).
  - The strip test: 0 strips over 25 m in every era's Turf War build.
  - appear-check: 0. The garden is untouched.
  - Gate ring: the moved bollards stand on its quay side, which now has 24 nav edges instead of 30. Still 3 attacker entrances (`rc-karp-ring.mjs`).
  - Two era-1 Turf War matches: stuck 0 %, 66.7 / 55.3 % inked.
- **The top-down still reads as the Z** (the user's worry):
  - The crossings stay an orthogonal L with a square landing at its knuckle, never a diagonal jetty.
  - Outline overlap with Crossroads (`rcf2-overlap.py`: best IoU over flips and whole-metre shifts, 1 m cells) is 0.42 on walkable floor and 0.47 on the footprint, against 0.40 / 0.45 at fix 1. Crossroads and Halyard, two band stages, overlap 0.65 / 0.79.
  - `r4-shape-sheet.jpg` is re-made.
- **Pictures:**
  - the reviewer's views, re-taken: `r4-era1-punt-east-leg`, `-punt-north-leg`, `-river-corner-high`;
  - `r4-era{1,2,3}-punt-landing-high`, `-landing-to-quay`, `-landing-to-boathouse`, `-quay-to-punt`, `-punt-to-mid`;
  - the tops of every era and mode.

### 3. The Halo still dropped under 30 % in some runs (minor)

**What I changed:** no Halo geometry. The review's instruction was to measure again after issue 1's change and, if a run is still under 30 %, give the lead the full set and the mean and propose one change. Issue 1 did change the route: flight → landing → hotel stair, 69.7 m from the pad.

**Proof: 8 era-3 ink-regions runs at the fix-2 source.**
- The Halo reads **42, 57, 71, 43, 51, 24, 46, 52 %**: mean **48.2 %**, median 48.5 %, **1 of 8 under 30 %**.
- The first four (b9fef3ce's source) were all ≥ 42 %. Run 6 (5aa4b5f7) read 24 %, in the lowest-inked match of the eight (56.7 % total).

**All the Halo runs since fix 1, together:**

| Set | Runs | Mean | Under 30 % |
|---|---|---|---|
| Fix 1, the builder's | 59, 52, 33, 48, 44, 26, 55, 52, 46, 53, 66, 33 | 47.2 % | 1 (26) |
| The fix-1 review | 22, 68 | 45 % | 1 (22) |
| Fix 2 | 42, 57, 71, 43, 51, 24, 46, 52 | 48.2 % | 1 (24) |
| **All 22** | | **47.4 %** (sd 13) | **3** |

**My reading:** the mean has sat at 47–48 % through three changes of the route (81 → 69 → 70 m). The low runs come about once in seven matches, in matches that ink little overall. That looks like the spread of an all-bot Turf War more than a route problem.

**The proposal, for the lead to decide.** Aim it at the attackers' quay route: reverse the 3000s river stair, so its foot is at the hotel arch's exit at 6:30.
- **Where the river stair stands now:** inside the ferry booking office (x −2.4 … 9.6, z −20 … −17), rising west from x 9.6 to x −2.4. Its landing is over the arch's exit.
- **Reversed:** it would rise east from x −2.4 (0) to x 9.6 (5.3), in the same footprint and the same two 6 m groups (ENGINE rule 19). The landing would move to the east end: x 9.6 … 12.6 at 4.9–5.3, north from z −20 onto the Halo's 135° side.
  - That landing is about 10 m long, so it needs two groups.
  - It stands more than 3.4 m over the ring, so appear-check stays clean.
  - It is 9 m clear of the tower's track, which runs along z 0.
- **What the nav shows today** (`rcf2-halo-ways.mjs`, era 3):
  - Out of the arch, the nearest way up is the balcony stair → the landing → the hotel stair, 29.2 m to the 270° side. The 180° side is 35.4 m, by the river stair's far foot.
  - Reversed, the foot would be about 3 m from the arch's exit: roughly 15 m to the Halo.
- **The cost:** the punt's end at 5 o'clock, now 25.8 m from the 180° side by that foot, would go up by the boat stair instead.

## The full report

### The shape and the directive (the user: "from the top down it looks familiar")

The outline is unchanged from round C. Alpha's chain is (−22, 20) → (−37, 5) → (−37, −76) → (−6, −76) → (−6, −20), plus its 180° twin.
- The legs are x −37 … −6 (Alpha) and x 6 … 37 (Bravo).
- The crossbar is x −37 … 37 by z −20 … 20, with each knee's outer corner chamfered at 45°.

**Proof that it reads differently from Crossroads:**
- `r4-shape-sheet.jpg`, re-made at 5aa4b5f7: Bluestone's three eras beside `crossmarket-top.webp` and Halyard at one scale, with the walkable masks. Bluestone era 1 is 5,384 m² (raster), Crossroads 5,326 m².
- The overlap numbers are under issue 2.
- The fix-2 change sits in the river corners. From above it is a wider L-shaped pier with a square landing. The Z's stroke and the two framed harbour basins still carry the read.

**The rest of the directive:**
- **Sightlines:** 0 of 36,100 deck-to-deck kid sightlines are clear, in every era.
- **Mid is as built:** the dome, the clock rows, the 1.3 m concourse with eight ways up, Tartar's telephone, the balcony (now x −12.2 … −5), the Boathouse decks and, in era 3, the Halo. `r4-mid-vs-crossmarket.jpg` is re-made.
- **The river corner per era:** the punt crossing with its landing stage (every era), the Iron Bridge (eras 2–3), the floating garden (era 3).
- **The routes each jump changes:**
  - Degrayling Lane, era 2: 22.4 → 11.7 m;
  - the Iron Bridge, era 2: the quay → the punt's north leg 43.4 → 20.0 m (it was 49.3 before the punt widened);
  - the garden, era 3: 20.1 → 15.5 m;
  - the Halo, era 3: 69.7 m from the pad.

### The numbers at the final source (5aa4b5f7)

| | Era 1 | Era 2 | Era 3 | Halyard | Crossroads |
|---|---|---|---|---|---|
| **check-maps** (5 variants) | **ok ×5** | **ok ×5** | **ok ×5** | | |
| Walkable floor (cover-map floorCells) | **5,006** | 5,166 (+3.2 %) | **5,688** (+13.6 % on era 1, **+10.1 % on era 2**) | 4,252 | 4,690 |
| Within 5 m of cover | **99.6 %** | 99.6 % | 99.5 % | 96.4 % | 95.4 % |
| Largest open circle | 7 m (the fountain's top, in the side zone) | 7 m | 7 m | 17 m | 12.7 m |
| Spawn → mid | **6.13 / 6.46 s** | 6.13 / 6.46 s | 6.13 / 6.46 s | | |
| climb-audit | 130 climbs, 0 barred | 130, 0 | 144, 0 | | |
| size-budget (lightmap rows used, paint ppm, nav nodes) | 1,038, 12.9, 4,845 | 1,041, 12.9, 4,995 | 1,115, 11.9, 5,886 | | |

**Node checks** (`local-logs/rcf2/node-checks.txt`):
- holes 0 and ground misses 0 in every era;
- paint area 11,029 / 11,194 / 12,386 m²;
- appear-check 0 in the Turf War, Tower Command, Bazookarp and Boss builds;
- the union: 52 groups, 0 failures. Jump 1 changes 4 groups per half (26 blocks) and jump 2 changes 22 (130 blocks). Era-only blocks are 21.9 %, and union lightmap rows 1,142;
- strip test: 0 strips over 25 m in every era's Turf War build;
- the deck-to-deck sightlines as above;
- `props.js` imports.
- **The Tower Command build** has 7 strips over 25 m, all on or beside the tower's own lane, which §6.1 #2 allows (fix 1 had 6). The new one is 37 m at x ±18.5. The old, steeper flight already stood 0.19 m high at the strip's edge, more than the test's 0.15 m tier tolerance, and that broke it. The gentler flight is 0.13 m high there.

**Page tests per era** (spawn-mid, size-budget, climb-audit, cover-map): pass. stage-audit (turf, tower) fails only "lightmap applied", because there is no bake yet, as in every blockout round.

**Tower Command, "the tower takes the tram line":** the track is unchanged.
- tower-check, eras 1–3, the full run (the text-only checks plus both rides): 73.99 / 73.99 m, **0 holes, clearance clean**, 1 drop, both rides a knockout at 83.4 s with no rider knocked off.
- I did not re-run tower-match: nothing on or beside the track changed.

**Bazookarp** (nav-measure, `rc-weir.py`, `rc-karp-ring.mjs`):
- L is 63.8 / 63.7 m in era 1 and 64.3 in era 3.
- Pond → weir is 30.3 m; weir → Gate is 42.5 / 41.6 m.
- Every second route is at most 1.16× its first.
- The Gate is 12.2 m from the pad.
- 3 attacker entrances into the Gate's ring: the street front, the quay side (24 edges), and the one-edge graze at (36.5, 57). Plus the defenders' two.
- Nothing solid or era-changing stands within 3 m of the weirs, the Gates or the Pond.

**Boss Battle, era 2: 6/7.** "It roams" fails, as on every stage. It played 6 move kinds (barrage, slam, charge, crablets, sweep, frenzy), with 2 stuns. Home ground is 555 m² (352 on the ring), and the overhang worst is 0.04 m (the landing).

**Zone Control** (the side zone is unchanged):
- era 1: Alpha by knockout, 0–90;
- era 3: Bravo (neutralised), 79–57.
- Stuck 0.4 / 0.3 %, no stuck episode of 2 s or more.

**Turf War, era 1:** 66.7 and 55.3 % of turf inked, stuck 0 %.

**Ink by region at the fix-2 source** (8 runs per era; `local-logs/rcf2/ink-regions-summary.txt`):

| Region | Era 1: runs | Era 1 mean | Era 3: runs | Era 3 mean |
|---|---|---|---|---|
| Total inked | 70 67 67 72 63 77 69 65 | 68.8 % | 69 58 70 68 71 57 62 69 | 65.5 % |
| River crossings | 45 51 62 51 54 62 52 56 | **54.1 %** | 59 47 52 74 63 51 56 66 | 58.5 % |
| The Halo | | | 42 57 71 43 51 24 46 52 | **48.2 %** |
| The garden | | | 70 53 65 77 75 62 50 77 | 66.1 % |
| The knee's far apron | 66 23 48 59 31 59 48 44 | 47.2 % | 44 39 56 41 39 28 22 32 | 37.6 % |
| Circus | | 75.5 % | | 74.9 % |
| Knee | | 63.5 % | | 58.1 % |

**Performance** (`shoot.cjs` REPORT at load, day; the picture runs, two per era):

| | Load | Blocks | Nav nodes | Draw calls | Triangles | CPU render | CPU sim |
|---|---|---|---|---|---|---|---|
| Bluestone era 1 | 5.9–6.9 s | 568 | 4,845 | 91–102 | 165–189k | 1.57–2.74 ms | 1.62–3.09 ms |
| Bluestone era 2 | 6.0–6.2 s | 590 | 4,995 | 123–137 | 296–304k | 1.69–1.99 ms | 1.64–2.02 ms |
| Bluestone era 3 | 6.1–6.5 s | 700 | 5,886 | 76–118 | 166–280k | 1.86–2.0 ms | 1.76–1.81 ms |
| Halyard (round C's run) | 8.0 s | 511 | 4,289 | 156 | 1,447k | 2.42 ms | 2.12 ms |

### Design departures (for the lead to tell the user)

**New in fix 2:**
- **The knee flight is 5.6 m long, and the balcony is 1.8 m shorter.** The landing is now the junction of the flight, the balcony, the balcony stair and (in the 3000s) the hotel stair.
- **The landing's planter** stands against the landing's north balustrade, and a second planter is on the balcony.
- **The punt is 5 m wide,** not the review's 4.5, so the bots' nav finds a dry middle row.
- **The ferry landing stage is 7 × 7 m, outside the corner** rather than inside it, so the era-3 garden keeps every tile. It carries the ferryman's box and crates.
- **Era 3 is now +10.1 % over era 2.** Any later floor added to every era needs era-3 floor with it.

**Kept from fix 1:** the side zone at the knee, the customs loading dock and its gangway, and the boss's 555 m² home ground.

**Kept from round C:**
- no Flathead diagonal;
- the superstop's glass stair on the river (inside the ferry booking office);
- the Halo's third way up by the boat stair;
- the arcade open in every era, and the level-crossing wagon clearing in the 3000s;
- the GPO without its clock tower;
- the spawn pad at (∓18, 3.3, ∓64.5);
- the hotel closing the Z's throat;
- Prow Place as a 1.0 m terrace;
- planter, post and crate tops are roofs.

### Pictures

All are in `tools/botlab/jobs/batch5/stages/bluestone/out/blockout/`, each under 300 KB, taken at 5aa4b5f7's source. I looked at every picture this round changes.

**New in fix 2:**
- `r4-era{1,3}-knee-flight-side`, `-knee-flight-down`, `-knee-flight-landing`;
- `r4-era{1,2,3}-punt-landing-high`, `-landing-to-quay`, `-landing-to-boathouse`, `-punt-east-leg`, `-punt-north-leg`;
- `r4-era2-tower-check-rail` (fix 1 had only eras 1 and 3).

**Re-taken:**
- the sheets: `r4-shape-sheet`, `r4-mid-vs-crossmarket`, `r4-cover-maps-eras-and-halyard`, `r4-eraN-cover-map`;
- `r4-era{1,2,3}-{top,aerialA,aerialB,sideL,sideR,play}`, mid from four angles, the places (including `-river-corner-high`, `-quay-to-punt`, `-punt-to-mid`), the era-3 extras;
- `r4-era{1,3}-knee-flight`, `-knee-flight-top`, `r4-era3-knee-flight-to-halo`, `r4-era3-hotel-stair-from-flight`;
- `r4-era{1,3}-top-zones` and the side-zone views, `r4-era1-top-tower`;
- `r4-era{1,2,3}-tower-check-rail`, `r4-era3-tower-check-views`;
- `r4-era{1,3}-ink-play20-{top,aerialA}`.

**Not re-taken,** because nothing in them changed: the dock views (`-knee-pocket*`, `-dock-*`), `r4-shape-phase1` and `r4-set-shapes`.

### Commits (branch b5-stage-bluestone; nothing pushed)

**Geometry** (`src/world/stages/bluestone/layout.js` only; no shared file touched):
- d3bac0e7: the knee flight at 23.2°, the balcony's west end, the shelter, the planters and the post;
- b9fef3ce: the 5 m punt, the ferry landing stage, its cover and rails, the quay's bollards, the landing's planter;
- 5aa4b5f7: the north leg's posts (the strip test), plus the Node checks' runner.

**Scratch:**
- 7de724a2: `rcf2-views.sh`, `rcf2-punt-wet.mjs`;
- 9ef9e620: `rcf2-overlap.py` and the sheets' titles;
- d82db420: the pictures;
- 42d1da29: the local logs (`local-logs/rcf2/`), `rcf2-regsum.py`, `rcf2-halo-ways.mjs`;
- d1aaef95: DESIGN.md (my hunks only: §8's intro, §8.1, §8.2, §8.5, §8.6, §8.7, §8.8);
- plus this report's commit.

Your pending DESIGN (the Flounders rename), COMMON and STAGE-RULES hunks are still uncommitted, and so are the review files.

## What is unfinished or uncertain

- **The Halo's weak tail is still there:** 1 of 8 fix-2 runs read 24 %, and 3 of 22 since fix 1 are under 30 %. The mean is steady at 47–48 %. The proposal above is unbuilt and needs the lead's call.
- **The era-3 size margin is thin:** +10.1 % over era 2. The punt took most of the room.
- **The knee's far apron:**
  - Era 1 averages 47 % over 8 runs, about as in fix 1 (46.8 %), but one run read 23 % and one 31 %.
  - Era 3 averages 38 %, with two runs under 30 (28, 22). Fix 1's era 3 was 35.5 % over 4 runs, and it was never a target.
  - The punt now draws traffic that once went elsewhere, which may be part of it. I have not separated that from noise.
- **Noisy bots, small counts, and no balance set** (the Mac mini is down):
  - 8 ink-regions runs per era, 2 Zone Control matches, 2 Turf War matches, 1 boss check.
  - No tower-match: the track's surroundings did not change.
- **Two sets of 4 ink runs ran at slightly different sources** (the posts on the north leg, 0.15–0.25 m apart). Both are reported, and the local logs' README maps each run to its source.
- **Each leg is still a plain 31 × 56 m rectangle with long straight sides.** The art pass should break those edges up.
