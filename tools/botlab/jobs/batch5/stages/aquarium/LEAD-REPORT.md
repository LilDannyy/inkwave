# Gulper Aquarium, art phase: report after fix round 3

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`. The round started at 45057f27 (+ the
lead's notes, 62d5f4d1); the code head is **1efc3dab**, the pictures 4fb9325f.

How it ran:
- Everything ran locally, one Electron at a time under the shared SLOTS=3 lock (`BOTLAB_OUT` in inkwave-upstream),
  WATCHDOG=900000 on the page tests. The Mac mini was not needed. The machine's load average was 20–45.
- This round is dressing and shaders only (LEAD-NOTES round 3): **no collider changed, no face moved, no re-bake, nothing
  on a walkable top.** The lightmaps still apply (1557 / 1553 rows).
- `wip` is still on. The uncommitted "Mac mini is back" edit to `tools/botlab/jobs/batch5/COMMON.md` is not mine; I left
  it alone.
- The review-3 JSON was not in the worktree (`LEAD-REVIEW.json` there is review 2's). I read review 3 from its workflow
  output and worked from the lead's notes and that text.

## 0. Fix round 3: each item, what I did, and the proof

All pictures are in `tools/botlab/jobs/batch5/stages/aquarium/out/art/`. Each is a JPEG under 300 KB.
- `r3-before-*` is the round's head, 45057f27.
- `r3-*` is after.
- `r3-pair-*` puts before and after side by side.

I looked at every one.

### 1. Major: the touch pools (both halves)

**Diagnosis.** The pool block (layout `touch-pool`: 5.0 × 2.6, 1.0 → 2.0 on the 1.0 dais) was dressed with four
round-cornered dark slabs. Its top is above eye height, so from the court floor nothing of the pool showed.

**What I built** (`dress.js` `aquarium_touchpool`; the panel spec is `TOUCH` in `geo.js`):
- **A faux-rock rockery skin.**
  - A cast-rock surface over every face: a displaced, mottled plane, 0.8–4.3 cm proud.
  - Its corners are square, and the long faces' skins run past the corners over the ends.
  - 14 boulders in pale penguin-rock and granite greys:
    - four tall corner boulders;
    - three long ones along each long face's rim;
    - one on each end's rim, two low ones beside each porthole and two low ones on the arch face.
  - The rim boulders break the top line by up to +0.15 m (tops from 0.86 to 1.15 m over the dais).
- **Viewing panels at child height.**
  - Two per long face, in brass frames (1.45 × 0.6, window 1.33 × 0.48, world height 1.08–1.68 m), each with a sill and
    four bolts.
  - A brass-ringed porthole (Ø 0.48) in each end.
- **What the panels show** (`looks.js` `buildExhibits`, traced in the shader). The eye ray runs into a 2.2 m-deep box of
  the pool's clear water:
  - a sand floor with pebbles, sea stars, urchins and anemones;
  - rock walls with weed low down;
  - the bright, rippling surface seen from below;
  - caustics, and water that thickens with distance;
  - a faint acrylic sheen with a diagonal highlight.
- **Pressed to each face's glass:** a sea star, an urchin and an anemone, as geometry.
- **The acrylic.** I dropped the house glass from the panels: at child height it mirrored the bright sky and washed the
  water out (`r3` work pictures, not kept). The sheen now lives in the shader.
- **A brass handrail** along the rim, 6 cm out at 0.86 m, on brackets about every metre, with ball ends. On the court face
  it breaks round the sign.
- **The sign.** "TOUCH POOL / TWO FINGERS, / PLEASE" on a navy board in a brass frame (1.42 × 0.7), between the court
  face's panels. TOUCH POOL is in 0.17 m brass letters; the rest is in 0.15 m cream letters.
- **The limit.** Every part stays within 8.5 cm of the pool block or over its off-limits top. Nothing reaches out over the
  walkable dais. There is no collider.

**Proof.**
- **From the three places, both halves (day):**

  | Viewpoint | Alpha | Bravo |
  |---|---|---|
  | South Arch's mouth | `r3-pair-tp-arch` | `r3-pair-tpB-arch` |
  | Deck stair's foot | `r3-pair-tp-stair` | `r3-pair-tpB-stair` |
  | Promenade's foot | `r3-pair-tp-prom` | `r3-pair-tpB-prom` |

- **Other views:**
  - the arch face: `r3-pair-tp-south`;
  - from above, the deck stair: `r3-tp-top`;
  - at dusk: `r3-pair-dusk-tp-arch`, `r3-dusk-tp-stair` (the panels read as lit windows).
- **The art test**, new check: farthest dressing vertex 0.084 m from the block (the rail's ball end), with nothing out on
  the dais. Its first run caught long boulders turned off their faces (0.49 m out), and I fixed that.

### 2. Minor: the corners' z-fighting comb

- **Fix.** The skin's square corners overlap round the block's corners. The old rim boxes were round-cornered, and the
  block's sharp corner poked through them. Corner boulders sit over the skin.
- **Proof.**
  - Pictures: `r3-pair-tp-corner-SE`, `r3-pair-tp-corner-NE`, and Bravo's corner `r3-tpB-corner`.
  - The comb strip is gone. What is left is a clean corner line.

### 3. Minor: the rays (rebuilt as eagle rays)

**Built** (`looks.js` `rayGeo` / `eagleWing`):
- **Body.** A kite whose wings sweep back to pointed tips (span 2.0 against a 0.81 body), with a convex leading edge and a
  falcate trailing edge.
- **Head and tail.** A duck-bill head lobe before the wings, and a thin tapering whip tail, 1.9 × the body.
- **Colour.** A dark slate back, a little lighter toward the tips, and a white belly. (Commit fec1ebed calls them
  "spotted"; I dropped the spots.)
- **Kept.** The wing flex is kept, and the rays are still in the swimmers' one draw call: 528 vertices, about the old
  sphere's cost.
- **The blacktips** were checked from below in the same shots. Their bellies are now white too: the body is white,
  darkened up the flanks to the grey back.

**Proof.**
- Pictures: `r3-pair-tunnel-ray`, `r3-pair-tunnel-up`, `r3-pair-shark-tunnel`, and `r3-rays-up` (straight up under the
  Arch Tank).
- The art test: span / body 2.0 / 0.81, belly luminance 0.75.

### 4. Minor: the Reef Window, filled with a real reef

**Built** (`looks.js` `reefPlan` + `buildExhibits`; the old reef props moved out of `arch.js`). Everything stands on the
sand and is drawn in DESIGN §5.4's half-saturated coral family.

| Row | Where | What |
|---|---|---|
| Back | to 1.6 m | Rock heaps crowned with tall sea fans (lace webs with veins), staghorn thickets and tube sponges |
| Middle | r 31.3 … 31.55 | Staghorn, table and brain corals, sponges |
| Front | the near half of the sand, r 30.8 … 31.25 | Brain and table corals, staghorn, sponges, and anemones |

- **The anemones** have two or three clownfish each, circling in the exhibits' vertex shader.
- **Live rock**, crusted with coralline pinks, lilacs and ochres.
- **Also inside:** the moray in its pipe, the octopus in its den, a rippled sand floor, a painted-deep back wall and a warm
  lamp strip under the lid.
- **More reef fish:** ten more per window, 44 instead of 34. Each is a swimmer, and each swimmer runs every kind's
  vertices, so I kept the number modest.
- **Light.**
  - The reef is lit from the window's lid: brightest near the top and on what faces up, with a soft caustic play.
  - At dusk it glows warm-white from within.
  - The glow is the material's `userData.glow`, which the glow probe switches off to measure it.

**Proof.**
- **Pictures:**
  - day: `r3-pair-reefwin-close`, `r3-pair-reefwin`, `r3-pair-reef-hall`, `r3-reef-near`;
  - Bravo's window: `r3-reefB`;
  - dusk: `r3-pair-dusk-reefwin-close`, `r3-pair-dusk-reefwin`, `r3-pair-dusk-reef-hall`, `r3-dusk-reef-near`.
- **The 60 % cap** (`scenes/aquarium-glow.js PRE_ARGS=pal`, at the code head):
  - **The probe fix first.** I fixed the probe's Reef Window view: both splats now in frame, on a fixed fov 70. One
    splat used to read off the frame's foot, and then a coral sculpture's plinth.
  - **The share.** The reef's own glow is 0.0205 of a pixel's luminance. Against the brighter fresh splat it is:

    | Palette | Glow / brighter splat |
    |---|---|
    | tangerine-cobalt | 0.078 |
    | bubblegum-mint | 0.082 |
    | lemon-grape | 0.043 |
    | aqua-cherry | 0.061 |
    | lime-magenta | 0.047 |

  - Against the dimmer splat it is at most 0.31. The hue is 22–41, warm and never cyan or green.
  - The view is in `r3-dusk-glow-probe-reef`.
- **The art test:** the reef, its clownfish and the pools' traced water are one mesh for both halves, `aq-exhibits`. That
  is one draw call: 50.9k triangles, unshadowed.

### 5. Minor: the Deep Dome tube at dusk

- **Built** (`far.js`):
  - The tube's glass is unlit (glow 0, was 0.15) and a little greyer.
  - A small warm lamp (Ø 0.34) sits on each of its nine brass collars.
  - Those lamps and the travelling streak are all that light it at dusk.
- **Proof.**
  - Pictures: `r3-pair-dusk-tube-wide`, `r3-pair-dusk-tube-from-pad` (from Alpha's pad) and `r3-pair-dusk-play`. The white
    bar is gone; the tube reads as a dim pipe with lamp dots.
  - The art test: tube glow 0, 9 lamps.

### 6. The two faces the lead saw

**(a) `aquarium-day-court-NE-eye.jpg`.**
- **What it was:** I raycast the frame. The flat dark face was the **Bravo touch pool's end face**, seen from 0.5 m:
  - hit (11.56, 1.72, 13.76) on `props:paint`, the old rim slab;
  - behind it, the level's `touch-pool` block at x 11.5.

  It is the same pool as item 1.
- **What it got:** what its neighbours have — the rock skin, a boulder, the handrail and, on the face's middle, a
  porthole.
- **Proof:** `r3-pair-court-NE-eye` and `r3-pair-dusk-court-NE-eye`, the same camera (12, 1.7, 14) → (0, 2.5, 0). At
  0.5 m it is still a near face, but a rocky one with a rail.

**(b) `aquarium-day-plaza-sea.jpg`.**
- **What it was:** the raycast hits sit at blade s = 31.0. The "long plain tiled wall" is the **Fin Pavilion's
  glass-block fascia**, the spawn deck's 26 m front (non-inkable).
- **What it got** (`arch.js` `aquarium_fintower`, both halves):
  - a black-granite skirting with a brass line;
  - seven fluted render pilasters dividing it into six bays, three faience speed lines wrapping each one's head;
  - a render frieze with three speed lines under the deck's edge, its top at 3.32, under the walkable 3.38;
  - two lit portholes into the foyer in each outer bay;
  - an enamel FIN PAVILION roundel in each middle bay.

  All of it is 4–8 cm proud, with no collider.
- **Proof.**
  - Pictures: `r3-pair-plaza-sea`, `r3-pair-fascia-front`, and at dusk `r3-pair-dusk-plaza-sea`, `r3-dusk-fascia-front`.
    The after pictures were taken without the play camera, so the bots have not inked the plaza.
  - The art test: within 7.3 cm, top 3.32.

### 7. The boss check, run four times with the boss's trail

`boss-check.js` now reports the trail: every sample's position, whether it is on its planned cells, the move it plays and
how far off them it is. It also reports the planned cells. The picture is `r3-boss-trails` (four runs).

| Run | Result | Off the planned cells | How far off them |
|---|---|---|---|
| 1 | 8/9 | 0 / 300 | — |
| 2 | 7/9 | 104 / 300 | median 0.4 m, max 0.4 m (42 between moves, 54 in barrages) |
| 3 | 7/9 | 119 / 300 | median 0.3 m, max 1.2 m (69 barrage, 42 idle) |
| 4, at the round's head | 8/9 | 15 / 300 | median 1.4 m, max 1.5 m |

**Reading.**
- **It is fight variance, not navigation.** The home ground is still 271 m² on Bravo's ferry plaza in every run, the same
  as the reviewer's.
- **The ground's shape.** It is a narrow ring of planned cells round the Ticket Hall's twin, with necks.
- **What the boss does.** It never leaves it by more than 1.5 m. The off samples are where it stands barraging from the
  ring's edge (the 0.5 m-cell plan keeps 2.9 m from walls; the boss's own pose test allows a little more), or where it
  walks a string-pulled leg through a neck.
- **No input changed.** Nothing this round touched its inputs: no collider, and the round-2 blocks are under its 1.35 m
  stride.
- **Still the lead's call:** "its home ground is the Ocean Court" fails in every run, as in review 2.

### 8. Performance (shoot.cjs REPORT at load, alternating, at the code head)

| Run | Aquarium calls / tris / cpuRender / load | Halyard calls / tris / cpuRender / load |
|---|---|---|
| day 1 | 175 / 1.54 M / 2.13 ms / 8.8 s | 170 / 1.45 M / 2.31 ms / 7.7 s |
| day 2 | 131 / 1.13 M / *24.0 ms / 38.6 s* (a machine stall) | 166 / 1.45 M / 2.38 ms / 10.3 s |
| day 3 | 180 / 1.60 M / 3.41 ms / 7.2 s | 111 / 0.98 M / 2.94 ms / 10.0 s |
| dusk 1 | 168 / 1.55 M / 2.81 ms / 7.1 s | 134 / 1.01 M / 3.46 ms / 8.6 s |
| dusk 2 | 180 / 1.60 M / 2.59 ms / 7.0 s | 168 / 1.46 M / 2.21 ms / 7.9 s |
| dusk 3 | 160 / 1.55 M / 2.71 ms / 8.0 s | 184 / 1.47 M / 3.80 ms / 10.1 s |

- **cpuRender** is level: the median is 2.71 ms for Aquarium (five runs, the stall left out) against 2.66 ms for Halyard
  (six runs).
- **Load:** Aquarium 7.0–8.8 s against Halyard 7.7–10.3 s.
- **Draw calls**, mode for mode, are level. The high mode is 160–180 against 166–184; the low mode is 131 against 111–134.
  The round added one draw call: `aq-exhibits`. The panels, the reef, the clownfish and the rays all batch.
- **Triangles are over Halyard's**, mode for mode:
  - about +6–9 % in the high mode (1.54–1.60 M against 1.45–1.47 M);
  - about +12 % in the one low-mode run (1.13 M against 0.98–1.01 M).
- **Where the extra triangles come from:**
  - the reef and the pools' water, 50.9k, no shadow;
  - the touch pools' and the fascia's props, which cast shadows;
  - the swimmer union.
- **What I already cut.** My first perf set counted about 1.2 M in the low mode. Every swimmer runs every kind's vertices,
  so the clownfish moved out of the swimmers into the exhibits mesh, the eagle ray dropped from 1056 to 528 vertices, I
  added ten reef fish per window instead of eighteen, and the fans and brains got fewer segments.
- **The lead's call** whether the remaining triangles are acceptable. The next levers are the touch pool boulders at
  icosahedron detail 1 (−7k plus their shadow pass) and the penguins' and turtle's vertices in the swimmer union.

## 1. What I built, against the user's words ("Halyard is the bar", "every structure is something")

The whole stage, rounds 1–3, lives in `src/world/stages/aquarium/`:
- `kit.js`, `arch.js`, `dress.js`, `looks.js`, `far.js`, `floorart.js`;
- `props.js`, `surfaces.js`, `murals.js`, `backdrop.js`, `layout.js`, `geo.js`, `baked.js`, `tubeway.js`.

There is one hook in the package's own engine module (`src/game/pipes.js` `levelMaterial`), from round 1.

Round 3 turns the last bare pieces at eye level in mid and on the plaza into something:
- **The touch pools** are 1930s touch pools: rockery, viewing panels into the water, a handrail and a sign.
- **The Fin Pavilion's plaza fascia** is a Deco glass-block front.
- **The Reef Windows** hold a lit reef.
- **The rays** are eagle rays.
- **The Deep Dome's tube** no longer outshines the stage at dusk.

Everything from rounds 1–2 stands as the round-2 report described it. The parts:
- the gatehouses, the gantry and Bathysphere No. 1;
- the gulper heads, the Great Tank, the dressed deck-stair flanks;
- the Reef Hall, the kelp drums, the promenades with their closed balustrade joints;
- the Ticket Hall, the Pump Hall, Penguin Point, the piers;
- the water and the swimmers in one draw call, the traced jelly columns, the kelp with bladders;
- the surfaces (67–69), murals 4–11, the floor art;
- the dusk set, and the stage art (accepted in review 3).

## 2. Decisions where the request left a gap

1. **The panels' water is traced in a shader, not a see-through hole.** The pool block is a visible, baked level block.
   Making it hidden would change the lightmap, and the round forbids a re-bake.
2. **No real acrylic over the panels.** The house glass mirrored the sky at child height and washed the water out, so the
   acrylic is a sheen in the trace shader.
3. **"Within about 5–8 cm"** is read as ≤ 8.5 cm, checked by the art test. The worst parts:
   - the rail's ball ends, 8.4 cm;
   - the touch pool's skin, rail and boulders, and the fascia's skirting, which sit on the floor or the dais within that
     band, as the old rim slabs did. Players can clip a few centimetres into them, with no collider (as before).
4. **The sign sits on the court face, between the panels, on three lines.** At 0.15 m letters, "TOUCH POOL · TWO FINGERS,
   PLEASE" on one line is 3.3 m long. The face holds 1.4 m between its panels. I left out a sign standing above the rim:
   with no collider it would hide players visually without blocking shots.
5. **The reef, the pools' water and the clownfish are one new mesh with its own unlit material** (one draw call for both
   halves). This is the lead's "batch like the fish".
   - The material lights the reef from the window's lid, so it reads the same through the glass by day and glows warm at
     dusk.
   - The reef no longer takes the sun's shadow: it is inside a lidded tank.
6. **The reef's dusk glow is modest:** 4–8 % of the brighter splat, against the Great Tank's water at about 26–56 %. The reef
   reads lit in the pictures. It could be raised a lot within the 60 % cap.
7. **The NE-eye face** is the touch pool (item 1). It got the rockery, not a new kind of dressing.
8. **The fascia's lettering** is FIN PAVILION, the pavilion's name in DESIGN §5.1. No new brand or text was invented.

## 3. Online and bots

- No record, wire format or rule changed.
- Everything new is built from the layout on every screen.
  - The clownfish circle and the caustics play on the shared house clock (`uFT`), the same one the swimmers use.
  - The trace runs per screen and needs nothing from the network.
- No collider changed, so bots and the boss see the same stage.

**One Turf War match at the round's head** (PAGEQ=pipestats; 38f3f4bb, before the last looks-only commit):

| Measure | Value |
|---|---|
| Turf | 43.6 / 29.8 % |
| Stuck | 0.1 %: three 0.25 s episodes, two at the Bravo touch dais's west corner (5.6, 0, 12.8) and one on Bravo's promenade (18.3, 3.0, 9.7). Existing geometry; no collider changed |
| giveUps | 0 |
| Longest push at a mouth | 0.6 s |
| Rides | 0.75 per bot-minute |
| High-ground arrivals by pipe | 20.6 % (7 / 34) |
| Camping | 2 deaths in 18 landings = 0.111 against a base rate of 0.054 per 2 s per actor: 2.05× (DESIGN ≤ 2×; small sample: round 2 had 1.7–2×, review 3 had 1.1–1.2×) |
| Splats | 39 |
| Console errors | none |

## 4. Tests

| Check | Result |
|---|---|
| `node build/check-maps.mjs aquarium aquarium.tower` | ok / ok, 1776 / 1768 pieces (unchanged) |
| tests/aquarium-art.js | **22/22** at 1efc3dab: 165 programs link, no GL error, no console errors. The 5 new checks are section 7 below |
| stage-audit turf | 3/3: lightmap applied (1557 rows, not stale); spawn → mid 6.53 / 6.75 s; no climb barred |
| stage-audit tower | 4/4: 1553 rows, 155 m, 100 s to the goal |
| climb-audit | 144 climbs, 0 barred (no new climbs) |
| cover-map | 98 % of 5226 floor cells within 5 m; largest open circle 12.2 m at (7.5, −67.5): unchanged |
| tests/pipes.js | 91/92 once, then 92/92 twice at the same head (below) |
| Turf War ×1 (pipestats) | §3 |
| boss-check.js ×4 | §0 item 7 |
| Dusk glow (aquarium-glow.js PRE_ARGS=pal) | §0 item 4 |
| Performance | §0 item 8 |

The new checks in tests/aquarium-art.js (section 7):
- **The touch pools' dressing.** It stays within 8.5 cm of the pool block or over it.
  - This is a guard, and it also passes on the old rim.
  - It caught the turned boulders during the round.
- **The exhibits.** The reef and the pools' water are one mesh for both halves: a reef in both windows, its clownfish,
  eight panels and four portholes traced, the lid lamps, its own glow. It fails at 45057f27: there is no such mesh.
- **The rays are eagle rays.** It fails at 45057f27: the old ray's span equalled its length.
- **The Deep Dome's tube** is unlit, with nine collar lamps. It fails at 45057f27: glow 0.15, no lamps.
- **The Fin Pavilion's fascia** is dressed within 8.5 cm, below the deck's top. It fails at 45057f27: nothing there.

The "fails at 45057f27" verdicts are reasoned from the code; I did not run the test there.

`pipes.js` 91/92: the failing check was the ride camera's "rider in view on ≥ 90 % of the frames" on the Gulper Run, at
0.868.
- 19 frames were unseen: frames 32–38 on the entry, and frames 150–160 after landing with the rider out of frame.
- The ride camera and that check use only level geometry (`pipesCam.js sightClear`), which this round did not touch.
- The two re-runs at the same head passed 92/92, so it is flaky under load. It is worth watching.

**Not re-run this round:**
- tower-check, tower-match and Zone Control: no collider, track or zone changed;
- pipes-audit and net-pipes: no pipe or net code changed;
- the Bazookarp checker;
- balance sets.

**Pictures:** 91 `r3-*` files in `out/art/` (§0). Also look at the before / after pairs `r3-pair-*`.

## 5. Commits and files

**Round 3 commits:**

| Commit | What |
|---|---|
| fec1ebed | Eagle rays, white shark bellies |
| d77cfd6d | The Deep Dome tube unlit, collar lamps |
| ce4936c5 | The Fin Pavilion's plaza fascia |
| 1bf2d087 | The touch pools (rockery, panels, traced water, rail, sign) and the Reef Window's reef: the exhibits mesh |
| 536e6c1a | Tests: art test section 7, the glow probe, the boss trail |
| 38f3f4bb | Collar lamps larger |
| 1efc3dab | Lighter on the counters: clownfish into the exhibits, slimmer ray, fewer extra reef fish, lighter fans and brains |
| 4fb9325f | (scratch) pictures |

- This report is committed as (scratch).
- **Shared files touched:** none. Everything is in `src/world/stages/aquarium/`, plus the stage's own scratch and test
  files.
- **Files changed this round:**
  - `src/world/stages/aquarium/{arch, backdrop, dress, far, geo, looks}.js`
  - `tools/botlab/tests/aquarium-art.js`
  - `tools/botlab/scenes/aquarium-glow.js`
  - `tools/botlab/jobs/batch5/stages/aquarium/boss-check.js`
- **For the integrator:** `assets/stages/manifest.json` still has no aquarium entry; the game doesn't read it.

## 6. Unfinished, uncertain, worth knowing

- **Triangles are about 6–12 % over Halyard's**, mode for mode (§0 item 8). Calls and cpuRender are level and load is
  under. This is the lead's call; the levers are listed there.
- **pipes.js's ride-camera visibility check** failed once (0.868) and passed twice at the same head. It is level-only and
  untouched this round, so it is flaky under load.
- **The boss check** still fails "home ground is the Ocean Court" (the lead's call) and, in some runs, "stays on its home
  ground" (fight variance, §0 item 7).
- **Camping** is 2.05× the base rate in the one match (the bar is ≤ 2×). It is a small sample; the Mac mini's larger
  sample is still needed.
- **The reef's dusk glow** is modest (4–8 % of the brighter splat), though it reads lit. It can be raised.
- **The NE-eye camera** stands 0.5 m from the pool's end, so even dressed, the frame is half rock face.
- **The traced pool water is the same idea in every panel** (a seed varies it). From a steep side angle it reads as a
  painted box, not as depth.
- **Commit fec1ebed's message says "spotted" eagle rays.** I left the spots out; the back is plain slate, lighter toward
  the tips.
- **Kept from earlier rounds:** the bathysphere's plaque is blank; there is no Gulper rider in the stage art.
- **Not run:** net-pipes, the Bazookarp checker, tower-check / tower-match, Zone Control, pipes on/off balance.
