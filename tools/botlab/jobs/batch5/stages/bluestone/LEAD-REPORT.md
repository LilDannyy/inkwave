# Bluestone Junction — the art phase: the place, in three eras (LEAD-REPORT, after fix round 1)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. The engine phase's report is in git history (this file at
`12a57cc7`); the art phase's first report at `f2e8c182`. The lead's brief: `LEAD-NOTES.md`, "The art phase
(2026-10-25)", six binding items. The independent review of that head (`LEAD-REVIEW.json`) said **redo**: this report
answers it issue by issue first (fix round 1, below), then gives the whole art phase as it now stands. The stage stays
**BETA** (item 6: `config.js` keeps `beta: true`; nothing here touches it).

**Summary.** The grey blockout is a city in three looks of the same streets, drawn mostly in the level shader under the
ink (every building face, kerb, cover block and small structure per era, keyed by block and by the fragment's own era, so
the front rewrites a facade along a clean line as it passes) plus ~240 dressing placements. Fix round 1 made the stage's
heart and its 3000s new ground reach the bar: **Commander Tartar is a cream-and-brass cradle telephone**, the 3000s'
**glass is clear**, the Halo's underside coffered, **rooms with depth and trades stand behind every shop window, booth
and shelter** (the arcade's chocolatier, toy shop and barber; the Tide Pavilion; the floating garden's glasshouse; the
ferryman's route map in light), **the per-era dusks apply** (a violet twilight, a pink-violet sunset, a violet 3000s dusk:
non-ink Tangerine-like pixels at dusk down from 13–23 % to 0–10 %, Halyard 30–41 %), the hotel repainted per era with
TODAY's umbrellas, Hoki Lane's street art turned to light in the 3000s, and the warning's old film reads (8.6/255).
Play geometry is frozen and proven so (check-maps counts, climb-audit, cover-map, spawn-mid, tower-check per era; the
lightmaps still apply). On the quiet Mac mini the engine's suite passes at the final head (JOB-16: eras-look 18/18 … — but one of
nine 'frames' runs at the final code went 3/4, see the unfinished list),
eras-hud 12/12 ×4 (it flaked before), the jump's worst frame 30–42 ms (under the 50 ms limit in 8 of 9 runs at the final code;
the margin is thinner than at JOB-12's head, 13–34 ms), and perf against Halyard: calls ×0.77–0.95, triangles ×0.36–0.38,
cpuRender ×0.77–0.87. Open: Bluestone's frames cost ×1.4–1.9 Halyard's **GPU** time (JOB-15, JOB-17) (a measure the brief did not set; the level material's,
from the engine and art phases, not this round's), and the items the brief left out of this round (§ fix round 1,
issue 8).

## Fix round 1 (2026-10-25): the independent review's REDO, issue by issue

The review (`LEAD-REVIEW.json`, at `f2e8c182`) found the street-level rewrite real but the stage's heart and its 3000s
new ground below the bar: Tartar still the blockout box, the 3000s' glass opaque slabs, blank hero buildings and
structures, the per-era dusk looks never applied, the hotel and Hoki Lane barely changing, the warning's flicker
invisible, two flaky tests. Every fix is dressing, shader or the engine's art-phase code; **no collider or layout
change** (check-maps piece counts identical: 712 / 706 / 712 / 762 / 710, per era 568 / 590 / 700; the lightmaps still
apply, not stale). Pictures: `out/fix1/` (sheets `out/fix1/sheets/`, the eight places `out/fix1/places/`), all looked at.

### Review issue 1 (major) — the 3000s' glass is opaque; the Halo's underside a bare slab
- **Fix** (`dec4ac74`): `dress.js` `kind: 'glass'` rails (the Halo, the three glass stairs, the Iron Bridge in the 3000s)
  are now clear panels in a new **'glass' era bucket** (`eras.js _glassMat`: ~22 % pale tint, a fresnel edge to ~70 %,
  `depthWrite: false`, double-sided, no shadow, out of the GTAO override pass) between **slim pearl posts every ~1.5 m**,
  under a pearl handrail with the **white-gold light rail** on top and a pearl foot with a light line. Era 3's prop
  materials: gloss, glow, metal, rubber, glass = 5 (rule 40 holds: eras-look step 7). The decks' **undersides**
  (level art DECK, faces with normal −y): the Halo and the 3000s' landings as **pearl coffers with white-gold seams** and
  a soft light in each coffer; the timber decks' undersides show joists.
- **Proof:** `sheets/issue1-glass-{day,dusk}.jpg` (the review's cameras haloeye, halounder, bridge, halotop in every era:
  the bridge, the stairs and the Halo seen through their rails; the coffered underside from the balcony landing);
  eras-look 18/18 (step 7 lists `props:glass@e4`).

### Review issue 2 (major) — Commander Tartar is still the blockout box
- **Fix** (`71297b01`, `df8489ee`): `props.js` `D.bluestone_tartar` rebuilt as a **cream-and-brass cradle telephone**,
  the same three parts EraFx animates: **body** — a tapered rounded body (a superellipse loft) on a moulded base with a
  brass band and a shoulder bead, on each face (Alpha's and Bravo's) a brass bezel, a cream number plate and a **finger
  stop**; the **two-forked cradle** on top; the **curly cord** from the mouthpiece down his end; **two domed brass bells
  with a striker** under him (the face players on the circus floor see); the **coiled cord he hangs by** from a brass
  rose on the drum's ceiling (y 8; the drum is solid from 8 to 10, so DESIGN's 7 m to the crown is out of sight).
  **dial** — on each face a brass finger wheel with **ten finger holes** and their numbers, the warm-lit centre card
  (still the warmest light under the dome), spinning about (0, 6.6) as before. **handset** — an earpiece and a
  mouthpiece cup on a curved grip, resting in the forks. The pickup animation fits the new model: the handset lifts
  0.16 m off its forks and tilts 0.18 rad about its own middle (it rose 0.45 m about the pivot into the ceiling).
  7 draw calls (was 6).
- **Proof:** `sheets/issue2-tartar-{day,dusk}.jpg` (the review's tartarside / tartar cameras and a close-up, every era);
  `sheets/issue2-tartar-ring-pickup-dial.jpg`, `issue2-tartar-pickup.jpg` (J − 15 ringing, J − 0.6 the receiver up,
  J + 0.2 dialling); eras-jump 'fx' now also checks the receiver lifts ≥ 0.12 m and its vertices stay under the ceiling
  (0.15 m, top 7.97 m): 3/3; eras-look (e) the intro ring 1/1.

### Review issue 3 (major) — hero buildings and the 3000s' new pieces read as blank panels and boxes
- **Fix** (`6d016212`, `ffd9dd73`, `5d6ae632`, `234383a8`): **rooms behind the glass** — the level art traces the view
  ray into a box room behind each pane (interior mapping: back wall, side walls receding, floor, ceiling, lit by their
  own light, brighter at dusk — `gBsRoom`, not the flat cream add):
  - **(a) the shopfronts**, every era: each shop a trade — the arcade's run in order **a chocolatier** (boxes with gold
    ribbons), **a toy shop** (blocks and teddies), **a barber** (white tiles, a long mirror over bottles, two red barber's
    chairs), a café, books and papers, a florist, a clothier; TODAY a **glazed door with a brass push plate** and a kick
    plate and the sky's reflection by the view angle (lighter up top); the 3000s the same rooms seen **through pearl glass
    at about half** under each shop's light sign; the 1880s gas-lit behind the small panes.
  - **(b) the 3000s Boathouse — the Tide Pavilion:** clear glazing between white mullions every ~1.2 m on a pearl sill,
    a light seam at the eaves, inside one room the face's length: the **rowing eights racked** along a timber wall with
    oars, planting in pots along the floor.
  - **(c) the floating garden's 2.6 m piece is a glasshouse:** `levelArtOf` gives `garden-planter` blocks over 2 m tall
    their own style (the piece, its tag and its collider unchanged): a pearl frame, glazing bars every 0.6 m and a
    transom, benches of potted plants and hanging greenery inside, a white-gold light along the eaves and the roof's
    ridge, the roof glazed over the plants (its planting bed on top removed).
  - **(d) the 3000s' small structures each with their function:** the **ferryman's box** — on each face the river's
    route in light (the line and its four stops) over the timetable; the **news kiosk** — hologram headlines scrolling in
    light; the **tram shelter** — its seat with a moss top under the timetable screen; the **cab shelters** — a wide
    window onto their bench, route map and light. And in the 1880s and TODAY too, rooms behind every small structure's
    window (the shelters' benches, the news kiosk's papers on shelves, the ferry office's charts, the boat shed's boats)
    and behind the **ticket booths' windows** (the booking clerk's office) — they were flat lit panes at dusk (the
    builder's own open item, "the forecourt booth"); the 1880s boathouse's **boat doors** drawn as doors (boards, a
    ledge-and-brace Z, strap hinges, matte and solid).
  - **From this round's sweeps** (JOB-13 by day, JOB-14 at dusk, every era, all 30 pages looked at — `bluestone/out/
    sweep/fix1/{day,dusk}/`): rooms behind the **civic arches** (the GPO's public hall, the hotel's bar, the boiler
    house) and the **engine hall** behind the Engine House's great arches (the winding wheels), in the 3000s seen through
    pearl glass at about half — they were flat cream / orange panes at dusk or blank pale arches; the 3000s' **horse
    troughs** joined the pearl family (they stayed granite boxes) and the tram museum's **coal bin** stands in a pearl
    vitrine (a black box at eye level). `f1896455`, `4616da47`, `616c3480`, `97cc76f4`, `4b5e2fc6`; the trace runs only
    where a pane shows it (`f2972104`).
- **Proof:** `sheets/issue3-shops-{day,dusk}.jpg` (the review's arcadeshops, the arcade's Swimston front, boathouseE3,
  glasshouse cameras in every era), `issue3-struct-{day,dusk}.jpg` (ferry box, news kiosk, tram shelter, cab shelter),
  `issue3-huts-rooms.jpg`, `issue3-booth-room.jpg`, `issue3-sweepfix-*.jpg`, `issue3-sweep-fixes-trough-coalbin.jpg`;
  the sweeps (JOB-13 / JOB-14): the same view and cluster counts as JOB-9 / JOB-10 (511 / 523 / 582 views of 155 / 157 /
  171 clusters), console 0; the 30 pages looked at — what they showed is the list above (taken before those fixes).

### Review issue 4 (major) — the per-era dusk looks never apply
- **Cause, as the review found:** `eras.look[1].theme.dusk` — the environment asks for the theme's name, `sunset`
  (config.js bluestone `times: { dusk: 'sunset' }`), and `sun:` is not a THEMES key; era 3's sky in `all` washed the
  sunset.
- **Fix** (`f122b1ba`): `layout.js` `ERAS.look` keyed by theme names with real THEMES keys. **1880s** `sunset`: a violet
  twilight (zenith #3f3766, horizon #a996c2, lilac-grey clouds, a pale warm key `sunColor` #ffe6c8 at 3.0 instead of the
  base #ffac4c at 4.6, a violet sky fill, warm-neutral highlights); its haze in `all`, its warm horizon by `day`.
  **TODAY** `sunset`: a pink-violet sunset (horizon #f4a0b4, pink glow and clouds, key #ffd4bc at 3.9). **3000s**: its
  bright sky moved to `day`; `sunset` a cool violet dusk (zenith #3a3080, lilac horizon #ccc0ec, key #efe8ff, a clear
  haze).
- **Measured** (`sheets/issue4-dusk-ink-*.jpg`, the review's ink cameras, the lemon-grape palette so no Tangerine is on
  screen; share of Tangerine-like pixels — hue 10–45°, saturation ≥ 0.5, value ≥ 0.3 — the same metric on the review's
  pictures and on Halyard's):

  | at dusk | e1 before → after | e2 before → after | e3 before → after |
  |---|---|---|---|
  | Swimston | 20.3 → **6.8 %** | 22.8 → **4.0 %** | 12.8 → **0.1 %** |
  | the knee | 19.6 → **9.5 %** | 16.0 → **3.3 %** | 9.9 → **0.2 %** |
  | Hoki Lane | 13.4 → **5.0 %** | 11.2 → **2.5 %** | 5.9 → **0.0 %** |
  | the circus | 4.9 → **0 %** | 0.2 → **0 %** | 2.6 → **0 %** |

  (after: the final head `0aeea997`; before: the reviewer's own pictures re-measured with this metric — the review's
  21.9 % for Swimston e1 is the same picture by its own threshold)

  Halyard at dusk, the same metric: 30.4–40.6 %. The hotel wall at the knee at e1 dusk against Tangerine ink: before
  (29°, 0.85, 0.58) vs ink (29°, 0.93, 0.62) — the same colour; after (29°, **0.56, 0.47**) vs ink (25°, 0.98, 0.61).
  What is left in the 1880s is warm material (brick, timber, gas-lit windows), DESIGN §5's sepia from materials.
- **Check added:** eras-look part 5 **(f)**: every `eras.look` key is a theme name or a THEMES key (the old data fails it:
  `1.dusk`, `1.dusk.sun`), and at dusk the three skies differ (the same camera up at the sky: mean change e1↔e2 10.1,
  e2↔e3 11.9, e1↔e3 11.4 /255, threshold 6) with the 1880s' zenith in force: PASS.
- `sheets/issue4-dusk-before-after.jpg` (the quay and Hoki Lane at dusk, the reviewed head and now), `places-*-dusk`.

### Review issue 5 (minor) — upper storeys barely change 1880s → TODAY; Hoki Lane barely changes TODAY → 3000s
- **Fix** (`460b305c`, `0f2ad377`): the **Young & Jackfish** repainted per era in the level art, not only tinted: the
  1880s a **bluestone ashlar ground storey under grey-ochre render**; TODAY **cream render with ochre dressings** (string
  course, cornice, window surrounds, quoins) and **gold lettering on green fascias** with a gilt bead; the 3000s pale
  pearl. TODAY's **beer-garden umbrellas** (cream and maroon, `dress.js` `bluestone_umbrella`) stand in the balcony's two
  roof-top planters, the canopies' rims 2.65 m over the balcony floor. **Hoki Lane's street art in the 3000s** turned
  to slow-moving light (DESIGN §5.1): `murals.js` draws the 3000s version from the pieces before their chalk wear (an edge
  filter on a blurred copy: the shapes' outlines in white-gold over a faint pale ghost, 480 px under the mural in the
  atlas); the level art samples it in era 3 (still under mural 7's era mask) and runs the light slowly along the lines.
- **Proof:** `sheets/issue5-hotel-hoki-{day,dusk}.jpg` (the quay, the hotel from the circus, the viaduct wall, every
  era), `issue5-hoki-light.jpg`; eras-look 12c (mural masks) PASS with Hoki's era-3 change 26.4/255 (was the same mural).

### Review issue 6 (minor) — the warning's sepia flicker does not read
- **Fix** (`5bd102f2`): what is about to vanish (level pieces and era props alike) goes to **sepia rising with the warning
  to full at its peak** (warnK 1 in the last 3 s), under a **projector's flicker** — the whole piece ±20–25 % at 9 Hz
  (`eraFlick`) — with a little grain. The 1880s' **paper on shared walls** (the arcade's hoardings, the bills on the
  viaduct, in the lane and on the poster column) flickers with them in jump 1's warning (it too is rewritten).
- **Check raised:** eras-look (b) — ≥ **8/255** over the vanishing pieces' own pixels (was ≥ 1.5 over a box: 2.45
  measured): **8.62** (frames 7.4–8.6), red/blue toward the film tone, the street beside them 0; and the hoardings
  ≥ 4/255: **6.25**. `sheets/issue6-flicker.jpg` (before the warning, three warning frames).

### Review issue 7 (minor) — frame budget and HUD layout unproven; eras-hud flaky
- **The Mac mini at this round's head (JOB-12, `7ac4bf62`, quiet: load 2.3):** eras-jump 'frames' **4/4 ×3** — the jump's
  worst frame 34.3 / 33.9 / 32.4 ms (J + 1.5), the Bravo 2 → 3 and sunset 3 → 1 jumps' worst 12–13 ms, nothing after
  done over 13 ms (the review's 0.5 s post-done stalls do not repeat on a quiet machine; locally under load 7–100 I saw
  the same kind once, 427 ms in the render at J + 4.32, with a no-jump baseline max of 254 ms on the same page); 'first'
  1/1 ×3 (no program compiled from J − 20 to done + 1.5); the GPU probe 9/9. Locally at the final head 'first' failed
  once at load 34 (the warning frame's update 28 ms, 17 of it the callout's DOM; no program compiled) and passed on the
  re-run (7.2 ms).
- **The Mac mini at the final head (JOB-16, `a42cdc70`, load 2.0):** 'first' 1/1 ×2, 'frames' 4/4 ×2 (the jump's worst
  frame 41.8 / 37.1 ms — JOB-12 had 32–34) and then **3/4 once** inside the art-tests run (the check that failed is not in
  the returned lines). The whole suite otherwise full: eras-static 23/23, eras-world 12/12, 7/7, 3/3, **eras-look 18/18**,
  eras-jump a / b / c / e 8/8, 7/7, 3/3, 6/6, eras-hud 12/12, eras-modes 6/6, stage-mods 36/36, world-build 5/5 ×2,
  climb-audit / cover-map / spawn-mid 1/1 and tower-check clean per era, check-maps unchanged, eras-bake 3/3, stage-audit
  turf e1–e3 "lightmap applied (not stale)". **JOB-17** (`b41ff37a`, the final code): 'frames'
  4/4 ×3 at the head and 4/4 ×3 at JOB-12's src (`7ac4bf62`), alternating — the jump frame's worst **30.3 / 31.7 / 37.7 ms
  at the head against 13.1 / 17.1 / 31.6 at JOB-12's src**: the round's later shader work (the rooms behind the huts,
  booths, civic arches and engine hall) costs the jump frame ~5–15 ms; still under the 50 ms limit in 8 of the 9 runs at
  the final code, one 3/4 unexplained. The static views' GPU time is unchanged by it (gpu-time.sh, the same job: head
  44.5 / 46.0 / 46.1 ms against 44.6 / 45.7 / 45.7, eras 1 / 2 / 3; Halyard 25.5–32.6 in that job: ×1.36–1.42).
- **eras-hud** (`ca80d0b6`): the cause was the test — the era band's 0.18 s move is a CSS transition on wall time, which
  the frozen, stepped page does not always advance: the two failing runs measured it 83 % and 91 % of the way (291, 298
  for a settled 307). The layout checks now read it with the transition off after two stepped frames and boxes
  unchanged across two animation frames, and assert the band's own margin (1.2 % of the HUD) under what it clears.
  EraHud also watches the size of what it clears (a ResizeObserver per new child) and re-places in the next frame.
  Locally 12/12 ×3 at load 6–7 (2 of 3 failed before the transition fix); Mac mini 12/12 ×3.
- **perf6 against Halyard (Mac mini JOB-12, fresh default profile, 3 runs, medians):** calls ×0.77–0.95, triangles
  ×0.36–0.38, cpuRender ×0.77–0.87, every era, day and dusk (the review's local ×1.05–1.17 at dusk was the loaded Mac).
- **GPU time — a finding the brief's measure does not cover** (JOB-15, Mac mini; `gpu-views.js`: the GPU's own time per
  frame by timer query, median of 24 frames at perf6's eight views, the default settings, high quality): **this round
  adds ≤ 2 %** (the reviewed head's src → this round's, ×2 each: day e1 43.3 → 43.6–44.3 ms, e2 44.2–44.6 → 45.3, e3
  45.3–45.5 → 45.1–46.2; dusk e1 46.4–47.4 → 45.6–46.8, e2 46.7–47.8 → 46.8–47.0, e3 46.6–47.4 → 47.5–47.8). But
  **Bluestone's frames cost ×1.6–1.9 Halyard's GPU time** there (Halyard 24.3–28.2 ms) and ×1.45 locally (32 vs 22 ms,
  the same session) — fewer calls and a third of the triangles, so it is fragment cost. A local A/B with the level art
  switched off: 32.0–32.4 → 26.5–26.8 ms, so **the level-art shader is ~5.5 ms (~17 %) of a Bluestone frame**; without
  it the stage is ~×1.2 Halyard. Hiding parts of the scene in turn (`gpu-attr.js`, locally, the same page): Bluestone
  37–40 ms → **20.4 ms with the level meshes hidden** (props −2, backdrop −2, sky / water −3); Halyard 21.5–23.6 → 21.3
  with its level hidden. So **Bluestone's level material costs ~17–19 ms of GPU a frame where Halyard's costs ~1–2**:
  of it the art chunk ~4.5–5.5 ms and the era re-skin (`eras.remap`) ~1.6 ms (local A/Bs: 34.4 → 32.8 without the
  remap → 28.3 without the art too); ~10 ms is not yet attributed (the era extension's other work, the stage's own
  surface slots, the level's shadow / GTAO passes). This
  predates the round (the engine and art phases' level material); the review's perf probe (calls, triangles, CPU
  render time) could not see it. Levers, not pulled: profile the era chunk (its texlib re-skin, the per-fragment era
  bit) and the stage's own surface slots; a quality-scaled art chunk (the rooms and the finer patterns off on low);
  early-outs by distance. **The lead decides whether the bar covers GPU time — I would profile it before the stage
  leaves BETA.**

### Review issue 8 (minor) — carried: the end-of-match beat, the timetabled tram, bots on jump 1's new ground
Not built in this round, by the brief ("dressing, shaders and the engine's art-phase items only"): §3.10's beat is the
lead's to keep or cut (to be recorded in LEAD-NOTES), the tram's timetable is DESIGN's "if the budget allows", and the
bots' fresh-ground goal is the balance pass's lever. Measured this round (local, Turf War 3:00 / Zone Control 5:00 at
dusk): jump 1's new ground 4/8 and 2/8 bots within 30 s, jump 2's 8/8 (median 6.4 s) and 4/8; both ERAS lines clean
(shoves 0, rescues 0, 52 flips, 0 on a vanishing top or inside an appearing piece, 0 splats by a jump), console 0.

### The round's other changes
- The stage-select **cards re-rendered** at this art (`4a112ad4`, again at the final head `0aeea997`): day = jump 1 (TODAY inside the curtain with the
  hotel's umbrellas and Tartar the telephone), dusk = jump 2 under TODAY's pink-violet sunset with the 3000s inside.
- New files: `tools/botlab/jobs/batch5/bluestone/gpu-views.js`, `gpu-attr.js` (scratch probes), JOB-12 … JOB-17; the
  Mac mini helper added `gpu-time.sh` (JOB-15's measure as a reusable job step).

## 0. The merge (first)
- `git merge new-stages` at `1150bf38`: no conflicts (the beta, the beta fixes, Gulper Aquarium's finished art with
  `tools/botlab/stage-sweep.cjs`, Highmark's engine). After it: check-maps `bluestone`, `.tower`, `.zones`,
  `.bazookarp`, `.boss` ok in eras 1–3 (712 / 706 / 712 / 762 / 710 pieces; #1 568, #2 590, #3 700); eras-world parts
  1–2 12/12, 3–4 7/7. The lead's uncommitted COMMON.md edit (the Mac mini is back) was identical to new-stages' and came
  in with the merge.
- new-stages moved by two commits during the round (Highmark's re-bake `8082e99a`, beta-content.js `c3e7f7f3`):
  merged again at `66cfe6ed`, no conflicts.

## 1. What I built, item by item against the brief and the user's words

### Item 4a first (LEAD-NOTES: "the art phase's first commit"): superJumpLanding — `b9c6208f`
`StageEras.superJumpLanding(a, s)` (the registry's charge → flight hook): if the era piece under the landing is absent
at touchdown and the floor then left is water or a bare roof, the landing moves to the nearest node (≤ 12 m) whose floor
stands at touchdown and that is valid in the era the jump goes to (valid in the era in force as well first — the
rescue's own order); none: the jumper's pad. `_floorAtT` reads the floor among the blocks standing at stage time t.
`tests/eras-jump.js 'sjland'` runs the reviewer's probe (Practice rewind; bridge-2, bridge-3, garden-11; touchdown 0.3 s
after the flip): with the hook 3/3 alive on the punt, one redirect each; the control with the hook off 3/3 splat.

### Item 1 — three looks of the same streets ("old trams and buildings and design" → today → "super futuristic")
**The level art** (`src/world/stages/bluestone/levelart.js`, new, 1,205 lines; `LAYOUT.levelArt` / `levelArtOf`).
Every block carries `aArt = (style, ±(param + 1))` through the era engine's `level.geomAttrs` (the sign is the half:
Bravo's twins are drawn in Alpha's frame). The era module splices the art's fragment chunk **between** its own two
halves: the era bit (`eraOneHot`: shared surfaces by their side of the front, era pieces by their own era) and the
re-skins first, then the art paints the bare surface, then the era's tint, the warning's sepia flicker, the done pulse
and the front's cut act on what it painted. Everything is under the ink; no geometry, collider or paint cell changes.
- **Buildings** (DESIGN §5.1; 13 entries in `BLDS`: family, bays, storeys, wall top, plinth, street fronts): a bluestone
  plinth course, string courses and a cornice line in every era; per era —
  - the **1880s**: timber shopfronts (panelled stall risers, small panes in slender bars, gilt-lettered fascias on
    green / maroon / navy), sash windows in four lights lit by gas at dusk, the GPO's rusticated ground floor with
    arched windows and keystones, the Royal Arcade **under construction** (its Swimston front in timber hoardings with
    bill posters and the GRAND OPENING 1889 banner, its upper walls raw brick in a scaffold of poles and ledgers, its
    floor boards and builders' dust), the viaduct's arches as **stables with boarded doors** and bills pasted on its
    piers, the Boathouse's green-and-cream rowing shed with boat doors;
  - **TODAY**: plate glass in slim dark frames with goods on shelves, tiled stall risers, painted fascias with sign
    panels, the hotel repainted cream and ochre, the arcade's mosaic floor (black and white diamonds, a red border, brass
    stars), blind arcading with the shops' name panels, tags and gig posters in the lanes, the Boathouse café's windows;
  - the **3000s**: pearl glass shopfronts with their interiors (light shelves, a display, planting), white-gold light
    seams at the string courses, cornices and corners, the Customs House's farm wall and storey seams, **living walls**
    (planting modules in pearl frames) on the piers, the columns, the arcade and the lanes, the Boathouse as a glass
    pavilion (fix round 1: until then a flat white wall with a faint grid — now clear glazing between mullions with the
    rowing club's room inside).
- **Cover** (every cover block: crates, bins, bollard blocks, troughs, benches, planters, ring beds, carts, the fountain,
  the statue plinth, the café tables, the museum's coal bin and buffer stop, mooring posts, the bike dock): each its own
  material and trim per era — ash barrels / green wheelie bins / white recycling pods; a granite mounting block with
  hitching rings / a slatted bench with bike hoops / a pearl bench with a moss seat; a costermonger's barrow of produce /
  an espresso cart / a hover cart; a horse trough with water / planted / a light planter; flower beds in cast-iron
  edging / grasses and lilies / white flowers round a light line; the 3000s' street furniture one pearl family (shadow
  gap, light at the foot, fluted faces, an engraved roundel, a moss or oak seat).
- **Small structures**: phone kiosks (unchanged in every era: Tartar's), ticket booths (timber / glass with a lit info
  screen / smart glass with the timetable in light), the poster column (theatre bills / gig posters / light adverts),
  the cab shelters, news kiosk, tram shelter, ferry office, boat shed and ferryman's box (timber huts with fascias,
  windows and doors per era), the goods wagon (V.R. timber / the heritage siding's red), the 1880s produce stacks, the grip
  car, the arcade's kiosk and flower stall (stacked bricks and lime sacks → a newsagent and buckets of flowers → a pearl
  kiosk and a plant stall).
- **Streets**: bluestone kerbstones and gutters along Swimston's carriageway, dish drains down Hoki and Degrayling Lanes,
  the **tram tracks per era** on both lines (cable slot rails → grooved rails with lane lines and a yellow no-standing
  line → a pale light-rail guideway with a white-gold line), a zebra crossing TODAY, light lines in the 3000s; mural 10
  (the forecourt's turntable ring and the depot tracks) and mural 5 (the concourse's inlaid dial) as floor art.
- **The station**: the columns' sandstone pedestals (moulded, panelled), the iron shafts fluted green (1880s) / cream and
  gold (TODAY) / white with living walls and lit flutes (3000s), the drum's render and lettering band per era, the clock
  beam.
- **Light**: windows lit at dusk (gas-warm / warm white / pearl), the 3000s' seams on their own brighter accumulator, lamp
  pools on the floors under the six lamp spots in each era's lamp colour.

**The dressing** (`kit.js`, `arch.js`, `dress.js` new; `props.js` placements; ≤ 5 materials per era mask, rule 40 —
eras-look 7: `metal`, `wood`, `gloss`, `glow`, `rubber`; era 3 since fix round 1: `gloss`, `glow`, `metal`, `rubber`, `glass`):
**Commander Tartar** (fix round 1: the cream-and-brass cradle telephone, above), the station's iron (capitals, the eight iron arches under the
drum, the drum's cornice and pilasters), the **dome per era** (fresh copper with gilt ribs / weathered verdigris / white
under the lattice of light to 22 m), **FLOUNDERS STREET STATION on the drum in every era's lettering** (gilt / gold lit at
dusk / letters of light), the **clock row per era** (timber cases with Roman numerals / lit opal dials / rings of light)
with the destination plates (INKOPOLIS, THE CAPE, SALTWATER, NORTH QUAY, KELP HILL), cornices with dentils and coped
parapets on every building, the GPO's balustrade and **its clock on the parapet under the dome's line** (DESIGN §8.3),
the hotel's pediment (1868) and urns, the buildings' words per era (POST OFFICE / GPO · SHOPS / THE G.P.O. GARDENS;
YOUNG & JACKFISH, HOTEL, SKY HOTEL; OPENING 1889 / ROYAL ARCADE; H.M. CUSTOMS · BONDED / CUSTOMS HOUSE · GALLERY ·
LOFTS / FARM 03 · VERTICAL FARM; CABLE TRAMWAY ENGINE HOUSE 1885 / TRAM MUSEUM · DEPOT / FLOAT-TRAM DOCK; ROWING CLUB /
BOATHOUSE CAFE / TIDE PAVILION), the rooftops per era (the arcade's ROYAL ARCADE frame and catenary gantries and a big
screen TODAY; the planted pergola of light, the maglev tube, the Customs House's sky-bridge and farm, the chimney's beam
in the 3000s; DESIGN §5.2's towers and spires kept), the arcade's iron-and-glass vault (half glazed under builders'
planks in the 1880s) and the **striker clock with its two fish-folk giants** over the north mouth, the Young &
Jackfish's iron lace (frieze and post brackets), enamel street plates (SWIMSTON ST, CUSTOMS LANE, HOKI LANE, DEGRAYLING
LANE, FLOUNDERS ST, PROW PLACE, THE QUAY), the kiosks' TELEPHONE plates and domes, hanging shop signs per era (carved
emblems / lit blade signs / light panels), **lamps per era** on the six shared spots (a fluted gas lamp with a square
lantern / a heritage street light / a white light mast with a ring of light), wall lamps in the lanes per era, a railing
for every rail collider by kind (iron lace, gallery rail, timber, rope, the Iron Bridge's lattice TODAY and glass in the
3000s, glass on the Halo and the stairs — fix round 1: clear panels between pearl posts; they were opaque slabs), the 1880s' telephone wires on roof poles and TODAY's tram catenary on span
wires with rosettes, planting per era on every roof-top planter, the 3000s' floating café pods over Degrayling Lane and
drones over Swimston, cast-iron bollards on the mooring blocks, rowing eights on the Boathouse's racks.

**The backdrop** (`backdrop.js`): one city mesh per era with the far scenery's own facade shader (HZ_CITY: window rows by
day, lit windows at dusk) plus one plain set (≤ 2 draw calls a set; the cap is 6); the 1880s' terraces, cathedral, shot
tower, exhibition dome, gasometers, smoking chimneys, tall ships and a paddle steamer; TODAY's glass towers, the gold
crown, the shot tower's cone, the lattice spire, stadium lights and an observation wheel; the 3000s' arcologies with
hanging gardens and sky-bridges, the bells over the shot tower and the dome, floating gardens, the sea wall across the
river's mouths, the orbital ring's arc and the storm bank. The city now stands on land (north and south of the river,
banks east and west, quay walls; nothing in the channel) — before, the boxes floated in the water (seen on the first
stage card).

**Surfaces** (`surfaces.js`, the three reserved slots): `bluestone` basalt pitchers (225 × 112 mm, vesicles, polished
crowns, gritty joints — the constant), `granite` road setts (the 1880s carriageways; eras.remap keeps asphalt / pavers),
`sandstone` coursed ashlar with a drafted margin and batting (on walls; flags on tops), tinted by each block's colour so
the Customs House, the engine house and the viaduct read as bluestone ashlar.

**Proof (item 1).** The same camera in all three eras at the eight places, day and dusk (`out/art/places-*`, sheets
`sheet-places-{a,b}-{day,dusk}.jpg`); `tests/eras-look.js` part 5 (a): at four places the facades render differently in
every era (mean change between eras 12.6–88.8/255); the sweep in each era (below).

### Item 2 — the Halyard bar everywhere (the sweep in each era, day and dusk)
- Run on this Mac first (eras 1, 2, 3 by day, `scratchpad` overviews) — what they showed was fixed: the Customs House
  had shopfronts (now civic arches only), the 1880s stairs had TODAY's yellow nosings (iron / stone treads now), flat
  ring beds (flower beds), a purple fountain (granite), the arcade's kiosk and flower stall undressed, the ferry office
  bare above its windows (a fascia and a door), the rowing racks bare (eights), the 3000s' cover were bare white boxes
  (the pearl family), green blotches for gardens (living-wall modules), 28 grid lines drawn inverted (see §6).
- The final sweeps on the Mac mini (JOB-9 by day, JOB-10 at dusk, eras 1–3; 511 / 523 / 582 views of 155 / 157 / 171
  clusters; the clusters with no eye-level view are the overhead or absent pieces: the drum, the dome, the lantern, the
  clock beam, the turret, the arcade's roof, the chimney, and the pieces absent in that era) came back as 30 overview
  pages (`tools/botlab/jobs/batch5/bluestone/out/sweep/{day,dusk}/`, each cluster's first view, 35 per page). Fixed from
  them: the rowing eights stood upright like bottles; the 3000s' ticket booths and arcade kiosk were blank white (smart
  glass with the timetable in light). Bravo's twins: JOB-11 (§4).
- Signage, iron lace, bluestone kerbs, the station's clocks and dome per era, FLOUNDERS STREET STATION on the drum in
  every era's lettering: item 1's list.

### Item 3 — the jump's look
- **The clean sweeping edge** (`eraFx.js`): the 20 cm block dissolve is gone. During a live jump an era piece of either
  era stays up and each fragment takes its era from its own side of the front — level pieces, era props and their
  shadows (the depth material discards by the front too) — so one line rewrites shared facades, era pieces and props
  together, with the Roman-numeral curtain riding it. A frozen still keeps each piece whole on its group's side (the
  engine's stage-art rule). Proof: eras-look part 5 (c): points on the Degrayling crates' top, the front held through
  their middle: drawn exactly beyond the front (2.1 % off, all on the line's pixels).
- The holograms, the wire beads, the time-lapse sky: the engine's, unchanged; the **wire pulses now run along real
  wires** (Tartar's wires: `levelart.js` WIRES — from the drum to the parapets and roof poles: up Swimston, Prow Place and
  Hoki Lane, the quay, the punt crossing, the knee's river walk; `eras.pulses` follow them; black wire in the 1880s and
  TODAY, a light filament in the 3000s).
- Pictures: `out/art/jump{1,2}-{swimston,knee}-{J-10,J+0,J+1.5,J+3,done+1}-day.jpg` and their sheets; the stage-art
  cards (`out/art/card-day-1to2-r30.jpg`, `card-dusk-2to3-r30.jpg`; installed as `assets/stages/bluestone-{day,dusk}
  [-sm].webp`): day is jump 1 frozen at r 30 (TODAY inside the curtain, the 1880s outside), dusk jump 2 (the 3000s
  inside — the Halo, the white dome under its lattice, the glass stairs — TODAY outside).

### Item 4 — the engine's art-phase list
1. superJumpLanding: above.
2. **Lamps per era** (ENGINE rule 42): `decor.lamps` holds six spots per half (DESIGN §5.7's spots were drawn for the X —
   four stand in the river or on a walkable deck on the Z — so each now stands in a roof-top planter where the street
   needs light); the era module sets the decor glass's light from `eras.look[e].lamps` and blends it through the
   time-lapse; the decor's iron bodies are hidden (each era's own lamp props stand on the spots, built round the decor's
   light). eras-look part 5 (d).
3. **Tartar rings once in the intro fly-in** (DESIGN §3.5): at 0.7 s into the intro (the ring's look runs on the intro's
   own clock; `stats.introRing`). eras-look part 5 (e).
4. **The sepia flicker pixel check**: first strengthened to 45 % film tone (2.45/255 — the review: still unreadable);
   fix round 1: full sepia at the warning's peak under a ±20–25 % projector flicker, the 1880s' paper on shared walls
   flickering too; eras-look (b) ≥ 8/255 over the vanishing pieces' pixels: 8.62, the hoardings 6.25, the street 0.
5. **Rule 22's accept text** reads the measured 3.75 m.
6. **Every jump picture re-shot** with `eras-shots2.cjs` (`out/engine/`, the current HUD): §4.

### Item 5 — play geometry frozen; the bake; performance
- **No collider, no layout geometry change.** check-maps every variant in every era: the same piece counts as after the
  merge (712 / 706 / 712 / 762 / 710; per era 568 / 590 / 700 …); the union nav graph identical before and after the art
  (5,952 nodes, per-era valid 4,808 / 4,958 / 5,844, 36,602 edges); cover-map floorCells 5,006 / 5,166 / 5,688, within
  5 m 99.6 / 99.6 / 99.5 %, largest open circle 7 m (DESIGN §8.8's numbers); spawn → mid 6.13 / 6.46 s every era;
  climb-audit 144 climbs, 0 barred, every era (the union graph's: since the engine, `?era=n` no longer filters the
  layout, so the blockout's 130 / 130 / 144 is the union's 144 in each); tower-check 73.99 / 73.99 m, no holes,
  clearance clean, both rides a knockout, every era. Dressing on faces stays within 8.5 cm; nothing on a walkable top
  (lamps and planting stand on roof-top planters, poles on roof tops; overhead pieces ≥ 2.6 m over a route).
- **The nine-pass bake** (Mac mini JOB-7: `bluestone`, `bluestone.tower`, `bluestone.boss`, era 1/2/3 into R/G/B): the
  three PNGs came back **byte-identical** to the committed ones (the art adds no collider; the layout hashes 22885,
  506dab2b, d472b6af unchanged), so assets/lightmaps is unchanged; stage-audit with the bakes: turf / zones / tower ×
  eras 1–3 and boss era 2 all full ("lightmap applied").
- **Performance against Halyard per era** (the reviewer's fixed-view probe perf6.js, a fresh default profile, day and
  dusk, 3 runs alternating; medians, Bluestone ÷ Halyard). At fix round 1's head (Mac mini JOB-12, `7ac4bf62`):

  | | calls | triangles | cpuRender |
  |---|---|---|---|
  | day e1 / e2 / e3 | ×0.77 / ×0.81 / ×0.79 | ×0.37 / ×0.36 / ×0.37 | ×0.77 / ×0.81 / ×0.86 |
  | dusk e1 / e2 / e3 | ×0.93 / ×0.95 / ×0.86 | ×0.37 / ×0.37 / ×0.38 | ×0.83 / ×0.85 / ×0.87 |

  (Halyard: 245–267 calls, 3.27–3.33 M triangles, 8.12–8.19 ms; the art phase's JOB-8 measured calls ×0.83–0.90,
  cpuRender ×0.79–0.84.) The GPU's own frame time: fix round 1's JOB-15 (§ fix round 1, issue 7). eras-jump 'frames' on
  the Mac mini ×3 at this head: the jump frame's 32–34 ms is the worst, nothing over 13 ms after done.

## 2. Decisions where the brief left a gap (for the lead)
1. **The art lives mostly in the level shader** (under the ink, per block and per era), not in props: it is the only way
   every face changes at street level along the front's line without a collider, a draw call or a triangle per face.
   Props carry what must stand off a face (signs, lamps, wires, iron, the dome).
2. **The level art goes between the era chunk's two halves** (`eraLevelExt(U, grate, art)`), so the era tint, the
   flicker, the done pulse and the cut act on painted facades (they were overwritten when the art ran after them).
3. **The clean edge for era pieces is per fragment during a live jump**; collision still flips per group at r_g (the
   visual and the collider differ by at most half a group, ≤ 4 m, ≤ 0.16 s at 25 m/s — the 0.3 s dissolve's own window).
   A frozen still keeps the per-group rule.
4. **The sepia flicker strengthened** to 45 % film tone and a ±7 % brightness flicker (it was invisible on warm pieces).
5. **Lamp spots moved onto the Z** (DESIGN §5.7's were the X's): six roof-top planters per half.
6. **Murals 5 and 10 are floor art** in the shader, not atlas murals (no layout field added; the eras.murals entries
   stay).
7. **Tartar's wires**: five per half from the drum, anchored on parapets and roof poles at ≥ 4.5 m over routes; the
   pulses follow them in every era (a light filament in the 3000s).
8. **The backdrop city stands on land**: the river runs east–west through the arena's corners; land north and south,
   banks east and west.
9. **The stage cards** are installed (`assets/stages/bluestone-*.webp`, as the other stages'); the stage keeps its BETA
   badge. Fix round 1 re-rendered both.
10. (fix round 1) **Rooms behind windows by interior mapping in the level shader** — no geometry, no draw call, a room
   per pane that moves with the view; the trades are assigned in order along the arcade (a chocolatier, a toy shop, a
   barber, a café, books, a florist, a clothier), elsewhere by a hash.
11. (fix round 1) **The glass rails get their own transparent era bucket** ('glass', built by the era module): era 3's
   props now use gloss, glow, metal, rubber and glass (5); no other era uses glass.
12. (fix round 1) **Tartar hangs by a short coiled cord from the drum's ceiling** (y 8: the drum is solid 8–10, so
   DESIGN's 7 m cord to the crown cannot be seen); his bells hang under him (the face the circus floor sees), the cord
   he hangs by is set behind the handset so the pickup clears it; the pickup lifts the handset 0.16 m (not 0.45).
13. (fix round 1) **The floating garden's 2.6 m piece is drawn as a glasshouse** without changing its tag or collider:
   `levelArtOf` picks `garden-planter` blocks taller than 2 m; its planting bed on top is removed.
14. (fix round 1) **The dusk palette per era** (DESIGN §5.6 / §5.7 gave the 1880s' colours; TODAY's pink-violet and the
   3000s' violet dusk are mine, with pale key lights so no era paints the facades orange).

## 3. Online and bots
- **Online:** nothing new crosses the wire. The art is a pure function of the era state each screen already derives from
  the shared stage clock (the level shader's era bit, the era props' buckets, the backdrop sets, the lamps' colour);
  superJumpLanding runs on the jumper's own screen at launch and the existing 'superjump' record carries the moved
  landing to every screen (as the lava's does). No record, no field added; docs/NET.md unchanged.
- **Bots:** no nav input changed (the union graph is identical); the bots' danger layer, pre-positioning and fresh-ground
  goals are the engine's. Matches: §4.

## 4. Tests, pictures, balance
**Local (this Mac, shared, one Electron at a time; `local-logs/art/`):** eras-static 23/23; eras-world 12/12, 7/7, 3/3
(part 5: the other stages build with no era world); eras-look 16/16 (with part 5 (a)–(d)), then part 5 again with (e) the intro ring: 5/5; eras-jump first 1/1, sched/flip/fall/shove 8/8, rescue/sjland/device/zip 7/7, guard/fx 3/3,
frames 4/4, sky/freeze/modes 6/6; eras-hud 12/12; eras-modes 6/6; stage-mods 36/36; world-build halyard 5/5, bluestone
5/5; check-maps every stage (only Halyard's old 25.7° ramp, as before) and every Bluestone variant in every era ok;
climb-audit / cover-map / spawn-mid 1/1 each in every era; tower-check clean in every era.
**Bot matches (local, at the art's head; `local-logs/art/match-*.txt`), the ERAS lines clean in both:**
- Turf War 3:00: `ERAS shoves 0 rescues 0 flips 52 | at a flip: on a vanishing top 0, inside an appearing piece 0 | in an
  appearing box before its flip 0 bot-s | splats by a jump 0 | era 3, started in era 1, 2 jumps`; stuck 0 %, no episode
  over 5 s; turf 34.4 / 22.8 %; new ground within 30 s: jump 1 2/8, jump 2 5/8 (median 9.9 s).
- Zone Control 5:00: the same ERAS line (shoves 0, rescues 0, 52 flips, 0 on a vanishing top or in an appearing piece,
  0 splats by a jump); stuck 0.4 % (0.9 % with holds on purpose), no episode over 5 s; Bravo on time, 57 – 57 (penalty);
  new ground within 30 s: jump 1 1/8, jump 2 5/8 (the engine's issue 7, the balance pass's lever).
**Mac mini:** JOB-7 (the bake, stage-audit per mode and era: all full; lightmaps.js 3/4 — Highmark's worlds unlit at that
head, since fixed by the second merge with its re-bake), JOB-8 (perf, above), JOB-9 / JOB-10 (the sweeps), JOB-11
(Bravo's twins by day in eras 1–3: the same view and cluster counts as Alpha's, console 0, 15 pages under `out/sweep/twin/`).
**Pictures (all JPEG < 300 KB except the Mac mini's sweep pages ≤ 1 MB):** `stages/bluestone/out/art/` — places
(8 × 3 eras × day/dusk) and their four sheets, the jump sequences (2 jumps × 2 views × 5 moments) and their sheets, the
two cards; `bluestone/out/sweep/{day,dusk}/` (30 pages); `stages/bluestone/out/engine/` — 35 pictures re-shot with eras-shots2.cjs at the art's head (the run's last section, the lightmap probe, throws on a duplicate `const S` in that old probe and the harness ends on its watchdog after every picture is written; not fixed: scratch).
Looked at: every places sheet, both jump sheets, both cards, the engine's pulses picture, the sweep pages e1 day 1–5,
e2 day 1 and 3, e3 day 1 and 3, e1 dusk 1, e3 dusk 2, the twins' e2 day 3 (and the three local day sweeps' full
overviews before the fixes). Not looked at one by one: the other 18 Mac mini pages and 14 twin pages.
**Fix round 1:** on the Mac mini at `7ac4bf62` (JOB-12): eras-jump first 1/1 ×3, frames 4/4 ×3, the GPU probe 9/9,
eras-hud 12/12 ×3, the whole art-tests.sh suite (eras-static 23/23, eras-world 12/12, 7/7, 3/3, eras-jump a–e 8/8, 7/7,
3/3, 4/4, 6/6, eras-hud 12/12, eras-modes 6/6, stage-mods 36/36, world-build 5/5 ×2, climb-audit / cover-map / spawn-mid
per era 1/1, tower-check clean per era), eras-bake 3/3, stage-audit turf e1–e3 "lightmap applied (not stale)";
eras-look 17/18 there — 12c, the mural masks, fixed in `0f2ad377` and 18/18 locally at the head. Locally at the head:
eras-look 18/18, eras-static 23/23, eras-jump guard/fx 3/3, sky/freeze/modes 6/6, eras-modes 6/6, eras-hud 12/12 ×3,
check-maps identical to the reviewed head; a Turf War 3:00 and a Zone Control 5:00 at dusk with clean ERAS lines and
console 0 (§ fix round 1, issue 8). Sweeps: JOB-13 / JOB-14 (§ fix round 1). Pictures: `out/fix1/`.
**Balance:** none run (the consolidated pass's); the art changes no play.

## 5. Commits; files
**Code:** `b9c6208f` (superJumpLanding + eras-jump 'sjland'), `f6b3407e` (the first art pass: levelart, kit, arch, dress,
surfaces, backdrop, layout, eras.js hooks, era prop colours), `d9e60328` (the clean edge, the flicker, the art between the
era halves, Tartar's wires, the 3000s' walls and furniture, land under the backdrop; eras-look part 5), `8d5c45a1` (28
grid lines un-inverted), `974f12e7`, `ad2fa3cf` (from the sweeps), `4edc9d9d` (the stage cards), `343c6919` (eras-look (e), the STAGE-MODS row).
**Merges:** `1150bf38`, `66cfe6ed` (new-stages); `269d5234` and later merges of `botlab-b5-bluestone` (the Mac mini's results).
**Fix round 1:** `f122b1ba` (the dusk looks, eras-look (f)), `dec4ac74` (the glass, the undersides), `71297b01` (Tartar),
`6d016212`, `ffd9dd73`, `5d6ae632`, `234383a8` (rooms behind the glass, the pavilion, the glasshouse, the 3000s' small
structures, the huts and booths, the boat doors), `460b305c`, `0f2ad377` (the hotel per era, the umbrellas, Hoki Lane's
light), `5bd102f2` (the warning's old film, eras-look (b)), `ca80d0b6` (eras-hud, EraHud's size watch), `df8489ee`
(Tartar's pickup, eras-jump 'fx'), `97cc76f4`, `4b5e2fc6`, `f1896455`, `4616da47`, `616c3480` (from the round's sweeps:
the troughs and coal bin, the boat doors, the engine hall, the civic arches, the 3000s' arches), `f2972104` (the room
trace only behind panes), `4a112ad4`, `0aeea997` (the cards); scratch: JOB-12 … JOB-15, their results, `c1023ecf` and the
later picture commits, this report.
**Scratch:** `3376402e` (tools), `7fcb79cf` (pictures), `5f000a2d` (the engine pictures, the logs), JOB-7 … JOB-11 and
their results, this report.
**Shared files: none.** Every change is in the stage's own folder (`src/world/stages/bluestone/*`), its module (`src/game/
eras.js`, `src/fx/eraFx.js`), its tests (`tools/botlab/tests/eras-look.js`, `eras-jump.js`, fix round 1 also
`eras-hud.js`), `assets/stages/bluestone-*`
and one doc row (`docs/STAGE-MODS.md` H8c: the level-art splice). For the integrator: the level program key on Bluestone
is now `inkwave-level-v8-eras-bsart` (eras-look accepts it).

## 6. Unfinished, flaky or uncertain
- **The end-of-match beat** (DESIGN §3.10: the dead future, "…So that is how it ends.", the inward rewind, "Returning to
  the Professor.") is not built — not on the brief's list; still the lead's to keep or cut.
- **Not done from the engine's "left to the art pass" list:** jump 2's hexagonal-shard curtain (the curtain is the
  engine's, pearl in jump 2), era ambiences (sound), a check of the curtain's brass foot against Tangerine ink; the tram
  still waits at its stop (no timetable).
- **Dusk glass:** fixed in fix round 1 (rooms behind the shops, booths and huts).
- **The sweep pages** I did not look at one by one: 18 of the 30 Mac mini pages and 14 of the 15 twin pages.
- **The 28 inverted grid lines** (fixed in `8d5c45a1`) mean the earliest local pictures in the scratchpad show darker
  joints than the stage has; the committed pictures are after the fix.
- **Frame time:** repeated on the quiet Mac mini at fix round 1's head (JOB-12): the jump frame 32–34 ms, nothing after
  done over 13 ms, ×3.
- **(fix round 1) GPU time — the biggest open item:** Bluestone's frames cost ×1.4–1.9 Halyard's GPU time on the Mac
  mini (~45 ms a frame at 1600×900, high quality: ~22 fps of GPU) and ×1.45 locally; the level material is ~17–19 ms of
  a frame (Halyard's ~1–2), the art chunk ~5.5 of that; this round adds ≤ 2 %. Not in the brief's measure; not
  addressed (levers in § fix round 1, issue 7). The lead's call; I would profile it before the stage leaves BETA.
- **(fix round 1) Not built, by the brief:** the end-of-match beat (§3.10), the tram's timetable, the bots' fresh-ground
  goal on jump 1 (the balance pass) — review issue 8; jump 2's hexagonal-shard curtain; era ambiences.
- **(fix round 1) Tartar's coiled cord** is short (from the drum's ceiling at y 8, which the drum's solid 8–10 m hides
  above); DESIGN's 7 m cord to the crown cannot be seen from play.
- **(fix round 1) Upper-floor windows** still light as flat warm panes at dusk (a deliberate city-at-night read; the
  shopfronts, booths, huts, civic arches and the engine hall have rooms).
- **(fix round 1) eras-jump 'first'** failed once locally at load 34 (a 28 ms warning frame, the callout's DOM; no shader
  compiled) and passed on the re-run, ×3 on the Mac mini (JOB-12) and ×2 at the final head (JOB-16).
- **(fix round 1) The jump frame's margin:** at the final code its worst frame is 30–42 ms (JOB-16 / JOB-17), against
  13–34 at JOB-12's head — the later rooms (huts, booths, civic arches, engine hall) cost the jump frame ~5–15 ms; 'frames'
  passed 8 of 9 runs, one 3/4 inside JOB-16's suite with the failing check not returned. Lever if the lead wants the
  margin back: drop the rooms from the small structures (keep the shopfronts', the pavilion's and the glasshouse's), or
  one room path instead of eleven inlined calls.
- **Climb-audit 144 vs DESIGN §8.8's 130 in eras 1–2:** the audit now counts the union graph in every era (unchanged by
  the art); not a regression.
- The stage stays BETA until the lead accepts the art.
