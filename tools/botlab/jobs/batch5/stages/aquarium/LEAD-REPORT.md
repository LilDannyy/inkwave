# Gulper Aquarium, art phase: report after fix round 4

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`. The round started at b87b4256 (code
1efc3dab) and answers review 4 (`LEAD-REVIEW.json`, verdict redo: one major, two minors). The code head is **32b6c316**,
the pictures a13b357c.

How it ran:
- Everything ran locally, one Electron at a time under the shared SLOTS=3 lock (`BOTLAB_OUT` in inkwave-upstream),
  WATCHDOG=900000 on the page tests. The Mac mini was not needed. The machine's load average was 10–30.
- This round is dressing and shaders only, as the review asks: **no collider, no layout.js line, no face moved, no
  re-bake, nothing on a walkable top.** `check-maps` counts the same pieces and both lightmaps still apply (1557 / 1553
  rows, not stale).
- `wip` is still on. The uncommitted "Mac mini is back" edit to `tools/botlab/jobs/batch5/COMMON.md` and the untracked
  `LEAD-REVIEW.json` / `LEAD-REVIEWS-ALL.json` are not mine; I left them alone.

## 0. Fix round 4: each issue, what I did, and the proof

All pictures are in `tools/botlab/jobs/batch5/stages/aquarium/out/art/`, each a JPEG under 300 KB:
- `r4-pair-*` puts the round's starting head (left, b87b4256) and the result (right) side by side, from the same camera;
- `r4-*` is the result at full size; `r4-before-*` the start, for the cameras the review names;
- `-B` / `B` names are Bravo's twin, `dusk-` the dusk set; `r4-ink-*` the ink proof (below).

I looked at every one. **One thing about the pictures first.** Under this machine's load, `shoot.cjs` wrote the
*previous* shot's frame under the next shot's name (it waits a fixed 1.5 s for the frozen game's next paint): my first
after-set had five byte-identical files under different names. Every picture of this round was taken with a scratch copy
(`scratchpad/aqfix4/tools/shoot2.cjs`) that steps the frozen game and waits for that frame's paint, twice, per shot; no
two files of a set are identical and none logged as stale. The before pictures were taken the same way from a clean
copy of b87b4256 (`git archive`), not from the working tree. `tools/botlab/shoot.cjs` itself is shared and unchanged;
the fix is worth porting (section 10).

### 1. Major: the Sea Promenade Lookouts and telescope bays (both halves)

**Diagnosis.** The Lookout (layout `radBox(−141.5, r 21.4 → 24.4, 3.6 wide, top 3.6)`) and the telescope bay
(`radBox(−145, r 27.6 → 31.0, 6.4 wide, top 3.0)`) are teak blocks. The teak surface draws its walls as render
(`surfaces.js`: teak `onWall: 69`) tinted with the block's teak brown, and their speed lines fall at 0.62–0.90 m and
4.62 m over the foundations (−2.0), so the 1.2 m and 0.6 m faces above the promenade had none: one near-black brown
slab. **They are inkable cover** (no `noPaint`), so dressing them with props a few cm proud would hide the ink on them.
I drew them **under the ink** in the level shader instead, as round 2 did for the deck stair's flanks.

**What I built** (`floorart.js`, from `geo.js` `LOOKOUT` / `TBAY`; both halves through the shader's Alpha frame):
- **The Lookout's sea face and both sides:** a raised Streamline deck — white render over a black-granite skirting
  (16 cm) with a brass line; three faience speed lines wrapping all three faces; the teak deck's own rounded edge (the
  level's 13 cm bevel) as a fascia board over a brass nosing strip; two portholes into the Jelly Gallery on the sea face
  and one on each side (a moon jelly and a fish, lit from within at dusk like the stair flanks').
- **A LOOKOUT plate** on the sea face between its portholes (navy enamel, brass letters; a prop 6 cm proud, the only
  prop on these faces).
- **The court face under SEA PROMENADE** (the balustrade block, r 21.4 → 21.8, top 4.5): a porthole of the balustrades'
  size (Ø 0.6 + ring), three speed lines under the letters running round its sides and its back over the Lookout's deck
  (with a skirting at that foot), the shadow under its cap; props: **render pilasters** at both ends and a **render
  coping cap** under the brass handrail, the balustrades' own pieces (2.5 cm proud, the cap on its off-limits top).
- **The telescope bay's 0.6 m riser:** a granite kerb with a brass line, a render riser with one speed line, the teak
  edge over a brass nosing strip.
- **The bevels** (30°–75° off the vertical, which neither the top nor the wall branch drew) as the teak edge.

**Proof** (the review's cameras, both halves, day and dusk):

| View | Pictures |
|---|---|
| lookoutN (−23.0, 4.1, −9.0) → (−17.9, 3.0, −14.3) | `r4-pair-lookoutN`, `r4-pair-lookoutN-B`, `r4-pair-dusk-lookoutN`, `r4-pair-dusk-lookoutN-B` |
| lookoutS (−11.8, 4.1, −19.6) → (−17.9, 3.0, −14.3) | `r4-pair-lookoutS`, `r4-pair-lookoutS-B`, `r4-pair-dusk-lookoutS` |
| prom-along (−24.5, 4.1, −4.5) → (−10.6, 4.0, −22.7) | `r4-pair-prom-along`, `r4-pair-prom-along-B`, `r4-pair-dusk-prom-along` |
| the grand stair's foot looking up at SEA PROMENADE | `r4-pair-stairfoot-up`, `r4-pair-stairfoot-up-B`, `r4-pair-dusk-stairfoot-up` |
| the Lookout's side from 3 m, its sea face (LOOKOUT plate), standing on it | `r4-pair-lookout-close(-B)`, `r4-pair-lookout-sea(-B)`, `r4-pair-lookout-top(-B)` |
| the telescope bay's riser | `r4-pair-bay-side`, `r4-pair-bay-side-B`, `r4-pair-dusk-bay-side` |

- **Under the ink:** `r4-ink-lookout-close`, `r4-ink-lookoutN`, `r4-ink-lookout-sea`, `r4-ink-bay-side` — both teams'
  ink splatted on the faces (a PRE scene, `scratchpad/aqfix4/tools/inkproof.js`) covers the art.
- **The art test** (section 8, below): the sea face reads render [192, 175, 151] over a skirting [32, 33, 39] (Alpha,
  sunlit) and [55, 69, 87] over [1, 12, 26] (Bravo, shaded); at b87b4256 it read [119, 90, 58] over [115, 87, 54], one
  slab. Ink splatted on it moves the pixel by 205 / 244 (of 765). The bay's riser reads render over its kerb (it read one slab).
- No prop of the promenade builder stands more than 8.2 cm out of the Lookout or the bay, or on their walkable tops (the
  8.2 cm is round 2's coping joint pilaster at the Lookout's corner).

### 2. Minor: the planters in front of both spawns

**Diagnosis.** The fish topiary (`rnd()`: four spokes stepping down 9 cm each), the queue-barrier planter and the
spawn decks' two planters are also **inkable** cover, drawn with the mapkit's planter pattern (a grass rectangle per top
face inside a 0.24 m rim — hence the topiary's "two green rectangles split by a seam" — and the block's colour on the
faces: the deck planters' `#9aa57a` made them green boxes). The topiary's existing FISH TOPIARY plate (round 1) stood at
0.83π, across its −45° face: half sunk into it, its other end 9.5 cm proud (the new art test caught it).

**What I built** (the faces and tops in `floorart.js`, from `geo.js` `PLANTERS`; the props in `dress.js`
`aquarium_planterdeco`; both halves). I gave the Gate Terrace's two bollard planters (the same `rnd()` pieces, plates
SEA HOLLY) the same treatment, so the stage's planters match:
- **Faces:** cast cream stone in ashlar courses over a black-granite plinth with a brass line; two faience speed lines
  round the body; a smooth, lighter **coping band** whose upper part is the block's own rounded edge (the level bevels it
  5–13 cm) with a groove and its shadow under it — the "moulded coping" without a prop over the ink.
- **Tops:** one planted bed across all of a round planter's stepped spokes (world-space, so no seam), inside a cast-stone
  rim: sea holly — two layers of glaucous leaves in clumps over dark soil and steel-blue thistle heads in their ruffs; the
  spokes' risers inside the bed are drawn as the planting's side. **The fish topiary's bed is clipped into a box-hedge
  fish** (a darker, rounded clipped fish with a forked tail, fins, a gill line and an eye) on its top step: the plate is
  true. The bevels between tops and faces are drawn as the coping.
- **Props** (`aquarium_planterdeco`): cascades of trailing leaves spilling over the coping and down every face (three
  strands a spot, 1–3 spots a face; every leaf within 5.8 cm of its face and under the walkable top), a sea-holly head
  in a ruff on every other spot; brass plates — SEA HOLLY on the deck planters' faces toward the pad and toward mid,
  SEA HOLLY and FERRY QUEUE on the queue-barrier planter. The topiary's plate moved square onto its −45° face.

**Proof:**

| View | Pictures |
|---|---|
| topiary / topiaryB (cams2.json) | `r4-pair-topiary`, `r4-pair-topiaryB`, `r4-pair-dusk-topiary` |
| topiaryUp (the bed and its fish from above) | `r4-pair-topiaryUp` |
| queuePlanter / queuePlanterB | `r4-pair-queuePlanter`, `r4-pair-queuePlanterB` |
| plazaWide / plazaWideB | `r4-pair-plazaWide`, `r4-pair-plazaWideB`, `r4-pair-dusk-plazaWide` |
| the spawn deck's planters close | `r4-pair-deckplanter`, `r4-pair-deckplanterB`, `r4-pair-deckplanterL`, `r4-pair-dusk-deckplanter` |
| the play camera (Alpha's pad) | `r4-pair-play`, `r4-pair-dusk-play` |
| from behind each pad toward its gate (both halves) | `r4-pair-spawnview`, `r4-pair-spawnviewB`, dusk the same |

- **Under the ink:** `r4-ink-topiary`, `r4-ink-topiaryUp`, `r4-ink-queuePlanter`, `r4-ink-deckplanter`.
- **The art test:** the deck planters read cast stone over a dark plinth and not green, both halves (at b87b4256: green
  over green, [29, 58, 37] over [18, 45, 27]); every prop of these builders within 6.4 cm of a planter's face, nothing on
  a top.
- **The play camera from Bravo's pad:** `shoot.cjs`'s `play` follows the local player, who is Alpha's. For Bravo I used a
  fixed camera from behind its pad (`spawnviewB`, and its Alpha twin `spawnview`), which has the deck planter in frame.

### 3. Minor: the touch pools' rockery

**What I built** (`dress.js` `aquarium_touchpool`, both halves; the pool block is off-limits, so props are right here):
- **The skin is cast rockwork:** courses of rounded stones (a jittered running bond, about 0.42 × 0.28 m) domed up to
  7.8 cm proud, deep dark crevices between them, the stones' tops lit as ledges and their undersides shaded, easing flat
  round the windows, portholes and sign; trimmed to its face (round 3's ran 3.5 cm past the corners).
- **The corners:** a rounded boulder pair wraps each vertical corner over both faces — a squircle column centred inside
  the block (reaching 1.23× further along the diagonal than across, so it covers the corner while standing at most
  7.8 cm out of either face), split by a crevice, domed 0.22–0.25 m over the rim. The four thin fins are gone.
- **The rim:** ten heavier boulders, three on each long face and two on each end, each placed by its own measured reach
  to stand 7.8 cm proud, their tops 0.27–0.29 m over the rim (round 3: 0.12–0.15).
- **The low chips** (ten flat boulders on the faces) are dropped. The handrails stop short of the corner boulders.

**Proof:**

| View | Pictures |
|---|---|
| court-pool-E / court-poolB-W (the ends from the court floor) | `r4-pair-court-pool-E`, `r4-pair-court-poolB-W`, dusk the same |
| the lead's NE-eye camera and its Alpha twin (0.5 m from the end) | `r4-pair-court-NE-eye`, `r4-pair-court-SW-eye`, `r4-pair-dusk-court-NE-eye` |
| tp-arch / tpB-arch | `r4-pair-tp-arch`, `r4-pair-tpB-arch`, `r4-pair-dusk-tp-arch` |
| the deck stair's foot, the promenade's foot, the arch face, from above, at child height | `r4-pair-tp-stair(-B)`, `r4-pair-tp-prom(-B)`, `r4-pair-tp-south`, `r4-pair-tp-top`, `r4-pair-tp-child` |
| the corners close (fov 50) | `r4-pair-tp-corner-SE`, `r4-pair-tp-corner-NE`, `r4-pair-tpB-corner` |

- **The art test:** every corner, both halves, has rock 7.2–8.3 cm out of both faces and rising 0.22–0.25 m over the
  rim; the rim's rocks rise 0.27–0.29 m over it on all eight sides (at b87b4256: 0.12–0.15, and two corners rose 0.09);
  the farthest dressing vertex is still within 8.5 cm of the block (0.084, the rail's ball end).
- **Two things I fixed on the way,** both caught in my own pictures and tests: a thin vertical line down each corner
  boulder (the polygon's chord between two vertices cut the squircle's corner and the block's corner showed; a column of
  vertices now runs down the diagonal itself, and the crevice is cut everywhere but over the corner), and the boulders
  reaching 8.6 cm (the profile's swell and the lumps together; the art test's 8.5 cm guard).
- **What is left:** at 0.5 m (the NE-eye camera) a corner boulder fills the frame as one smooth, mottled rock: the
  stage's props are untextured, so close up it is a big soft boulder, not a detailed one. In the fov-50 corner
  close-ups the boulders' self-shadows show as angular patches (the shadow map's resolution); at play distance they
  read as mottling.

### 4. Re-run (what this round could have broken)

| Check | Result |
|---|---|
| `node build/check-maps.mjs aquarium aquarium.tower` | ok / ok, 1776 / 1768 pieces (unchanged) |
| tests/aquarium-art.js | **28/28** at the code head (the 22 old checks and section 8's 6); 162 programs link, glError 0, no console errors |
| the same section 8 at b87b4256 (scratch copy with the round's numbers inlined) | 23/28: the Lookouts, the bays, the deck planters, the stand-off (the topiary's sunk plate) and the rockery fail there; the ink check is a guard and passes on a plain face too |
| climb-audit | 144 climbs, 0 barred (unchanged) |
| stage-audit turf | 3/3: lightmap applied (1557 rows, not stale); spawn → mid 6.53 / 6.75 s |
| stage-audit tower | 4/4: 1553 rows, 155 m, 100 s to the goal |
| Tower Command, Zone Control and Boss Battle builds | load and draw the new art; 0 console warnings or errors in each |
| dusk | the Lookouts' portholes glow like the stair flanks' (accepted in round 2); nothing else new lights up |

Not re-run, because nothing they measure changed (no collider, no layout, no nav, no pipe, no net code): cover-map, the
boss check, pipes / pipes-audit / net-pipes, tower-check and tower-match, bot matches, balance sets, the dusk glow probe.

**Performance.** No draw call added: every new prop rides an existing material bucket (`propMeshes` 6 before and after),
the rest is the level shader (a few position tests per wall / top fragment, the leaf pattern only on planter tops).
Triangles, counted exactly with a headless build of the stage's whole dressing
(`scratchpad/aqfix4/tools/proptris.js`, both halves):

| | b87b4256 | now | Δ |
|---|---|---|---|
| all props | 394,770 | 414,034 | +19,264 (+4.9 %) |
| touch pools | 23,288 | 30,584 | +7,296 |
| planters (the new builder) | 0 | 11,140 | +11,140 |
| the promenade builder (LOOKOUT plate, pilasters, cap) | 16,516 | 17,344 | +828 |

That is about 1.2 % of a high-mode frame (1.5–1.6 M). I trimmed it once (the skin's grid from 7.5 to 8.5 cm, the corner
columns from 18 to 16 sides, the in-pool rocks to icosahedron detail 1). The rest of the planters' cost is mostly the
plates' letters. The lead's call; the triangles were already 6–12 % over Halyard's (round 3).

## 5. What I built, against the user's words ("Halyard is the bar", "every structure is something")

The whole stage, rounds 1–4, lives in `src/world/stages/aquarium/`: `kit.js`, `arch.js`, `dress.js`, `looks.js`,
`far.js`, `floorart.js`, `props.js`, `surfaces.js`, `murals.js`, `backdrop.js`, `layout.js`, `geo.js`, `baked.js`,
`tubeway.js`. There is one hook in the package's own engine module (`src/game/pipes.js` `levelMaterial`), from round 1.

Round 4 turns the last bare pieces the review found at eye level into something:
- **The Lookouts** are raised Streamline decks over the Jelly Gallery, the **telescope bays** render risers on granite
  kerbs, the **SEA PROMENADE face** one of the balustrades;
- **the planters** are Deco planters of sea holly, the fish topiary has its fish;
- **the touch pools** are rockeries of cast stones and boulders round their brass-framed windows.

Everything from rounds 1–3 stands as their reports described it: the gatehouses, the gantry and Bathysphere No. 1, the
gulper heads, the Great Tank, the dressed deck-stair flanks, the Reef Hall and its lit reef, the kelp drums, the
promenades with their closed balustrade joints, the Ticket Hall, the Pump Hall, Penguin Point, the piers, the Fin
Pavilion's fascia; the water and the swimmers in one draw call (eagle rays, white-bellied blacktips), the traced jelly
columns, the kelp with bladders; the surfaces (67–69), murals 4–11, the floor art; the dusk set (the Deep Dome tube dim);
the stage art (accepted in review 3).

## 6. Decisions where the request left a gap

1. **The Lookouts', bays' and planters' faces are drawn under the ink, not dressed with props.** They are inkable cover;
   props a few cm proud would hide the ink on them (and on the walls squids swim up). The review's "within about 8 cm"
   props are kept to what has to stand off a face: the LOOKOUT and planter plates, the balustrade's pilasters and cap
   (the balustrades' own), and the trailing leaves. The ink proof pictures and the art test show the ink covers the art.
2. **The "brass nosing at the deck edge" is painted, not a bar.** The Lookout's and bay's top edges are the level's 13 cm
   rounded bevel: a bar at the edge would float in front of the curve. The teak edge is drawn over a brass strip.
3. **The planters' "moulded coping band" is the block's own rounded edge plus a painted band and groove,** for the same
   reason as 1.
4. **The fish topiary keeps its name:** its bed is clipped into a fish (under the ink, as floorart does), the review's
   first option. A fish standing above the walkable top would hide players without blocking shots.
5. **The Gate Terrace's two bollard planters got the same dressing,** though the review did not list them: they are the
   same `rnd()` pieces and would otherwise be the last plain ones.
6. **Bravo's play camera** is a fixed camera from behind its pad (section 2).
7. **The touch pools' rim boulders rise to 0.29 m over the rim** (round 3: 0.15), as the review's "more mass above the
   off-limits top" asks. They sit on the off-limits top in lumps with gaps; a player on the dais behind the pool shows
   over them, one on the court floor is hidden by the 2.0 m block anyway.

## 7. Online and bots

- No record, wire format, rule or collider changed. Everything new is built from the layout on every screen (the shader
  from `geo.js`'s numbers, the props from the placements), so every client draws the same.
- Bots and the boss see the same stage: no nav input changed.

## 8. Tests

As section 4. The new checks, `tests/aquarium-art.js` section 8:
- **The Lookouts' sea faces are dressed** (render over a granite skirting, faience speed lines), both halves.
- **Ink splatted on a Lookout's face shows over its dressing** (the art is under the ink).
- **The telescope bays' risers are dressed** (render over a granite kerb), both halves.
- **The spawn decks' planters are dressed and not green** (cast stone over a granite plinth), both halves.
- **The props of the promenade and planter builders** (a headless build of those placements alone, both halves) stand
  within 8.5 cm of the Lookout's, the bay's and every planter's faces, and nothing stands on their walkable tops.
- **The touch pools' rockery wraps every corner** (≥ 4 cm out of both faces, ≥ 0.15 m over the rim) **and rises ≥ 0.2 m
  over the rim on every side**, both halves.

## 9. Commits and files

**Round 4 commits:**

| Commit | What |
|---|---|
| 9aa59606 | The Lookouts, their court faces, the telescope bays and the planters' faces and beds in the level shader (floorart.js, geo.js numbers); the LOOKOUT plate, the balustrade's pilasters and cap (arch.js) |
| 7cdb9dbf | The planters' trailing planting and plates (dress.js, props.js); the touch pools' rockwork skin, corner boulders and rim boulders |
| a45f96d2 | The corner boulders held to 7.8 cm; lighter skin and columns; the topiary's plate square on its face |
| 87d5ec63 | Tests: aquarium-art.js section 8 |
| 32b6c316 | The corner boulders' vertex column on the diagonal (no thin line down the corner) |
| a13b357c | (scratch) pictures |

- This report is committed as (scratch).
- **Shared files touched:** none. Everything is in `src/world/stages/aquarium/` (`floorart.js`, `geo.js`, `arch.js`,
  `dress.js`, `props.js`) and `tools/botlab/tests/aquarium-art.js`.
- **For the integrator:** `assets/stages/manifest.json` still has no aquarium entry; the game doesn't read it.

## 10. Unfinished, uncertain, worth knowing

- **Triangles +19.3 k** (props, both halves; about 1.2 % of a frame), on top of round 3's 6–12 % over
  Halyard. No draw call added. The lead's call.
- **`tools/botlab/shoot.cjs` writes stale frames under load** (section 0). Pictures in earlier rounds taken on a busy
  machine may carry a neighbour's frame under their name (review 4's "cameras that landed inside geometry" may be this).
  My scratch copy's two-step wait is a small change to port into the shared tool; I did not touch it.
- **The stage art card** (accepted in review 3) still shows the old Lookout at its left edge as a dark block. Not re-made: it was accepted and the review did not ask. One `shoot.cjs` + `cwebp`
  run if the lead wants it.
- **The grand stair's top tread:** the promenade's teak cells zigzag over it (`r4-pair-stairfoot-up`, bottom left), the
  defect round 1 fixed on the Penguin Steps with a granite nosing block. That needs a layout block and a re-bake, which
  this round forbids; not in the review.
- **The corner boulders close up** are smooth soft rocks, and the shadow map draws angular patches on them (section 3).
- **The planters' trailing leaves and plates** are the only things over the ink on those faces: a few leaves and a plate
  per face hide the ink under them.
- **Kept from earlier rounds:** the bathysphere's plaque is blank; there is no Gulper rider in the stage art; the boss
  check's "home ground is the Ocean Court" (the lead's call) and, in some runs, "stays on its home ground" (fight
  variance, round 3); camping 2.05× the base rate in round 3's one match (the Mac mini's larger sample is still owed).
