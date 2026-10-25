# Bluestone Junction — the art phase: the place, in three eras (LEAD-REPORT, after fix round 2)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. The engine phase's report is in git history (this file at
`12a57cc7`); the art phase's first report at `f2e8c182`; fix round 1's at `8188097a`. The lead's brief: `LEAD-NOTES.md`,
"The art phase (2026-10-25)", six binding items, and "GPU time is a gate". The second independent review of fix round 1's
head (`LEAD-REVIEW.json`, at `8188097a`) said **redo** with eight issues: this report answers them one by one first (fix
round 2, below), then fix round 1 as it was answered, then the whole art phase as it now stands. The stage stays **BETA**
(item 6: `config.js` keeps `beta: true`; nothing here touches it).

**Summary of fix round 2.** Dressing, shaders and the engine's art-phase code only: no collider or layout change
(check-maps 712 pieces, per era 568 / 590 / 700, as before; the layout file's only edits are the era looks and one texlib
flag). **The GPU gate (issue 1) is met by the lead's corrected method** — the timer query the gate used reads about six
times the GPU's real frame time on the Mac mini and does not keep the ratio (JOB-22, my finding; the lead's ruling in
LEAD-NOTES "The GPU gate, corrected"); by the GPU's throughput (`gpu-sustained.js` C: 30 renders back to back and a fence)
Bluestone costs **×0.85–0.95 Halyard** in every era, day and dusk, at this round's first cut (×0.95–1.03 before it); the cut
— static level programs per era at rest, a depth prepass, lighter generic shader paths, no hex anti-tiling — saves about a
tenth of the stage's real GPU time and is proven to change no pixel (eras-look (h), idcheck.js). **The dusks read**
(issue 2): shoot.cjs's 'mid' at dusk 16 / 22 / 44 → **43.5 / 47.7 / 49.9** (Halyard 49), the streets lifted from 7–22 to
29–69, team ink still the loudest (Tangerine-like background 2–3.5 %, Halyard 31 %). **The trams** (issue 3): TODAY a
white-and-graphite low-floor tram with panes, a lit saloon, doors with yellow edges and the destination blind 11 FLOUNDERS
ST; the 3000s a glass float-tram over a glowing magnetic plinth with a lit saloon behind the glass. **The cards** (issue 4)
re-rendered over a dressed backdrop (roofs, quays with avenues, parks, wharf sheds, ships with sails; today's towers lit
with a gold crown; the Customs House's 3000s vertical farm). **The drum's ceiling** (issue 5) coffered per era, the
sky-coloured seam closed. **The 3000s dusk** (issue 6) no longer tints the city into Cobalt's hue: Cobalt-hue background
14.8 % → 0.8 %, Cobalt against its ground ΔE 51.7 → 68.9. **The 3000s furniture and the carried pieces** (issue 7): the
hover cart, the café pods and the recycling pods each their own trade, the statue plinth a monument with a per-era relief
and wreath, a fountain and a buffer of light, the wharf rails per era. Issue 8 is the lead's to decide (unchanged).

## Fix round 2 (2026-10-25): the second independent review's REDO, issue by issue

Pictures: `out/fix2/` (all looked at), the stage cards `out/fix2/cards/`, the eye-level sweeps at this round's head
`bluestone/out/sweep/fix2/{day,dusk}/` (Mac mini JOB-23 / JOB-24; all 30 pages looked at). Probes and jobs (scratch, in
`tools/botlab/jobs/batch5/bluestone/`): `gpu-ab.js`, `gpu-sustained.js`, `idcheck.js`, `idle.js`, `gshoot.cjs`; JOB-20 … JOB-26.

### Review issue 1 (blocker) — the GPU gate
**What the timer was.** I attributed the gap first with the gate's own timer (JOB-20: `gpu-ab.js`, one page per config,
every variant measured beside the base): the level's material was the one big lever (a plain material −9.6 to −13 ms on
Bluestone, −1.3 to −3.9 on Halyard), every part of it 1–3 ms and none dominant; the art per style −0.5 to −1.7 each (a
'skip:N' row runs the same program but skips style N's branch for its fragments: shader work, the same fragments). The
first cut (below) saved 2–4 ms by that timer (JOB-21: ×1.54–1.64 Halyard after, ×1.65–1.72 before). Its readings then
stopped making physical sense — 'off' switches that made frames SLOWER (bloom off +6 to +12 ms on Bluestone, GTAO off and
the sea hidden slower on Halyard), an empty scene at 15 ms, attribution rows that never added up — so I timed the same
`R.render` three ways (JOB-22, quiet Mac mini, perf6's eight views, 2 rounds, this head and review 2's src):

| GPU ms per frame | A: the gate's timer (a query per frame, gl.finish after each) | C: 30 renders back to back + a fence (the GPU's throughput) |
|---|---|---|
| Halyard day / dusk | 25.5 / 25.8 | 7.35 / 7.33 |
| Bluestone e1 day / dusk | 40.8 / 42.5 (×1.60 / ×1.65) | **6.28 / 6.61 (×0.85 / ×0.90)** |
| Bluestone e2 day / dusk | 41.8 / 42.8 (×1.64 / ×1.66) | **6.37 / 6.73 (×0.87 / ×0.92)** |
| Bluestone e3 day / dusk | 42.5 / 44.4 (×1.66 / ×1.72) | **6.56 / 6.94 (×0.89 / ×0.95)** |
| review 2's src e1 / e2 / e3, day | 42.6 / 44.5 / 47.4 | 6.96 / 7.19 / 7.33 (×0.95 / ×0.98 / ×1.00) |
| review 2's src e1 / e2 / e3, dusk | 46.0 / 46.6 / 47.0 | 7.35 / 7.44 / 7.57 (×1.00 / ×1.02 / ×1.03) |

C is a wall-clock measure that cannot be out by more than the CPU's issue time (0.8–1.0 ms a frame on both stages): 30
frames that each "cost 44 ms" by the timer finish in 0.2 s. Locally three more tests point the same way: the timer round
the render alone with no sim step (A2) reads Bluestone ×1.03 Halyard where A reads ×1.32; an idle gap of 4–16 ms before
each timed frame halves the timer's reading on both stages (it counts queueing behind earlier GPU work, not the frame's
own execution: `idle.js`); and **bloom off reads +11.5 ms by the timer but −0.5 to −1.4 ms by C** — the bloom-off "anomaly"
the review asked me to find is the timer's, not a double draw (no extra pass exists: the composer skips the disabled pass).
The lead ruled (LEAD-NOTES "The GPU gate, corrected"): **the gate's method is C; by it the gate is met at the head
(×0.85–0.95) and was met at review 2's src (×0.95–1.03); issue 1 is closed; no further GPU work this round**; the first cut
stays if it changes no picture and the prepass shows no fault.

**JOB-26** (Mac mini at `35381026`, this round's code; 2 rounds; e2 and Halyard; ms per frame):

| | C, the GPU's throughput: day / dusk | ÷ Halyard | A, the old timer: day / dusk | A2, the timer round the render alone |
|---|---|---|---|---|
| Halyard as is | 7.05 / 7.14 | ×1.00 | 26.9 / 27.5 | 17.1 / 17.6 |
| Bluestone e2 as built | **6.18 / 6.62** | **×0.88 / ×0.93** | 41.3 / 42.5 (×1.53 / ×1.55) | 16.9 / 18.5 (×0.99 / ×1.05) |
| … the full program at rest, no prepass (the level as before the cut) | 7.25 / 7.55 | ×1.03 / ×1.06 | 46.0 / 48.6 | 20.4 / 21.1 |
| … no prepass (static programs only) | 6.47 / 7.00 | ×0.92 / ×0.98 | 42.2 / 44.7 | 18.2 / 19.7 |
| … bloom off | 5.45 / 5.73 (−0.7 / −0.9) | ×0.77 / ×0.80 | **56.6 / 58.6 (+15 / +16)** | 18.4 / 19.4 |
| Halyard bloom off | 6.17 / 6.18 (−0.9 / −1.0) | ×0.87 | 28.9 / 29.8 (+2.0 / +2.3) | 16.1 / 16.5 |

So by the GPU's own throughput the cut saves 1.07 ms by day and 0.93 at dusk on e2 (15 % / 12 % of the frame's real GPU time): the
static programs ~0.8 / 0.55, the prepass 0.3 / 0.4. Bloom off makes the frame cheaper on both stages by C and dearer by
the timer — the "anomaly" is the timer's. The timer round the render alone (A2) puts Bluestone at ×0.99–1.05 Halyard; with
a CPU-side gap of 8–16 ms before each timed frame the timer reads 7.8–8.5 ms on both stages instead of 17–18 (`idle.js`):
it counts waiting behind earlier GPU work.

**The first cut** (`2d4f7a6b`, `dbe15f36`, `d5077600`) — what it does and its proof:
- **Static level programs at rest** (`eras.js` `_staticMat` / `_levelProgram`; `eraFx.js` and `levelart.js` under
  `ERA_STATIC` / `ERA_NOW`): while no front, warning, done pulse or frozen still is on, the level meshes draw with a program
  per era in which the era is a compile-time constant — no per-fragment era, front band, flicker, pulse or cut, and the
  level art folds to that era's code alone; the full program from the warning to the pulse's end. All four programs are
  compiled at load (`_precompile` renders a frame with each: 12 programs, 0.4–3.4 s at load on this loaded Mac); eras-jump
  'first' finds no program compiled from J − 20 to done + 1.5 (Mac mini JOB-21 1/1 ×2; JOB-25 1/1 ×2).
- **A depth prepass** at rest: per level mesh a twin sharing its position / aEra buffers, colour off, drawn first, polygon
  offset, absent pieces collapsed, out of the shadow and GTAO passes, the see-through window round the local player left
  out with a margin (the twins set its feet height themselves, `dbe15f36`: with last frame's height a few pixels of the
  window could lag — the check below caught it, max 21/255).
- **The generic level shader** (`levelMaterial.js`, 4 lines tagged `[b5-bluestone]`, the only shared file this round): on
  the texlib path the 4-octave noise and the fine noise are computed only where they are read (murals, Halyard's drain) and
  the coping's stone only where the coping shows. The same picture on every stage.
- **No hex anti-tiling on Bluestone's level** (`LAYOUT.levelTexlib.hex = false`: render, asphalt and rubber take the grid
  mode's per-tile flips; its own material's uniforms only; `W._hexOff` keeps what was there).
- **Proof that no picture changed:** eras-look part 5 **(h)** (new): at rest every prepass twin shows exactly with its level
  mesh and the level draws with its era's static program; in the warning, the jump and the done pulse no twin shows and
  the program is the full one; with and without the prepass the frame is identical at five places in every era (max 0) and
  through the see-through window round the local player standing behind the Swimston cart (max 0–2/255; the window open:
  mean change 9.5–11.3/255) — locally 8/8 in part 5. The static program against the full one at rest: max 0–1/255 (three
  cameras × three eras). `idcheck.js`: the generic shader patched back to its original code gives the same frame (max 0–1/255
  at four places in every era; two identical renders 0–2); hex on against off: mean 0–0.9/255, the noise placed
  differently, no repeat at eye level (`out/fix2/gpu-hex-on-left-off-right-e2.jpg`, looked at).
- Not pursued after the lead's ruling: one program per art style, a baked art atlas, LOD by distance, the lamp loops (their
  rows by the old timer are in JOB-20 / JOB-21).

### Review issue 2 (major) — the 1880s and TODAY dusks were murk
- **Fix** (`4f34e405`, layout.js `ERAS.look`): the hues kept, the fill raised. **1880s** sunset: hemi 0.62 → **2.1**, env
  0.44 → **1.2**, a lighter lilac-grey ground bounce (#b8a8b8), the violet fill a little less saturated (#8a84b8), key 3.0 →
  **3.5**, exposure **1.2** and a softer shadow tint. **TODAY** sunset: hemi 0.6 → **2.2** with a less saturated blue-lilac
  fill (#8c8cb8; at env 1.1 the pink-violet sky's reflections made the streets Grape-like, so env stays **0.75**), ground
  bounce #b8a4b0, exposure **1.08**.
- **Measured** (the review's method: the median of the lower two thirds of the frame, Rec.601; no ink):

  | at dusk | shoot.cjs 'mid' (1600 × 900) | the knee | Hoki Lane | the quay | Swimston |
  |---|---|---|---|---|---|
  | 1880s before → after | 15.9 → **43.5** | 12.7 → 53.2 | 7.4 → 36.0 | 20.0 → 54.3 | 22.2 → 63.3 |
  | TODAY before → after | 22.7 → **47.7** | 13.0 → 45.0 | 12.2 → 36.1 | 21.2 → 47.1 | 39.0 → 69.2 |
  | 3000s before → after | 45.2 → **49.9** | 48.9 → 60.1 | 24.8 → 29.0 | 41.3 → 47.8 | 72.2 → 81.1 |

  (Halyard's 'mid' at dusk: 49.) The ink stays the loudest (the review's ink pairs at the final head): the non-ink
  Tangerine-like background at dusk **2.3 / 3.5 / 0.1 %** (Halyard 30.9 %); Grape-like 6.5 / 10.3 / 0.2 % (Halyard 16.0 %);
  background as saturated as the ink ≤ 0.4 % (one 3000s Hoki view with under 2,000 low-chroma 'Grape' pixels reads 33 % —
  an artefact of a near-empty ink mask; the other 3000s views 0 %); every team ink against its ground ΔE 67.8–111.5.
- **Check added:** eras-look part 5 **(g)**: from the 'mid' camera at dusk the lower frame's median ≥ 34/255 in the page's own
  frame in every era (it reads ~4 lower than shoot.cjs's 1600 × 900 shot of a match started at dusk: 40.0 / 42.7 / 48.4 at
  this head; the reviewed look 13.7 / 19.6 / 43.0 fails it — run at that look before committing) and the 3000s' Cobalt-hue
  share ≤ 5 %.
- **Pictures:** `out/fix2/issue2-dusk-before-after.jpg` (the mid preset, the knee, Hoki Lane and the quay: the 1880s and
  TODAY before / after, the 3000s after) — the concourse, the booths, cover faces, kerbs and setts read under the violet
  sky; the dusk sweep (JOB-24): cover faces, not silhouettes, in every era. One thing the dusk sweep shows: on the Boathouse
  deck looking west (deck-rail.0) the low sun's glint on the planks is bright in the 1880s (the key light raised to 3.5).

### Review issue 3 (major) — the trams were blank slabs
- **Fix** (`a85f6179`, props.js; era props only, the 2.6 × 6 × 3.2 m collider covered as before):
  - **TODAY** (DESIGN §5.2): a low-floor tram, white and graphite, a thin yellow band; graphite skirts over the bogies; the
    glazing from 1.25 to 2.6 m in separate panes in black frames with the lit saloon behind (a ceiling strip, seat backs,
    passengers' heads, a grab pole, the sky in the upper glass); two pairs of doors per side, their leaves glazed, yellow
    edges where they meet and at the jambs, a door button; at each end a raked windscreen with the driver and his desk
    behind it under the lit destination blind **11 FLOUNDERS ST**, the fleet number **6012** on the dash, headlights;
    air-conditioning pods and a single-arm pantograph on the roof. Era 2's buckets only.
  - **3000s** (DESIGN §2.10): a pearl lower body hovering over the light-rail plinth on a sheet of light (the gap glows:
    nothing is seen through the cover), a rounded clear-glass capsule (era 3's glass bucket) over a lit saloon — a pearl
    frame of ribs and posts, moss-green seats on pearl bases, standing passengers, a ceiling of light — with an opaque
    partition along its middle (a decision: the tram is cover, and see-through cover would show players behind it), a
    pearl roof with white-gold seams, FLOUNDERS ST in light along its flanks.
- **Pictures:** `out/fix2/issue3-trams-e123.jpg` (the side, the end and the west kerb in every era, day and dusk); the
  sweeps' tram rows (tram.0 in e2 / e3, day and dusk).

### Review issue 4 (major) — the stage-select cards showed a blockout backdrop
- **Fix** (`29705647`, `0ffc37c6`): **the backdrop dressed** (backdrop.js): the land the far city stands on with a stone
  promenade and an avenue of trees along every quay, parks with trees, streets between the blocks (every era: the
  constant); the 1880s terraces under pitched roofs in slate or red tile (the card looks down on them: no bare grey tops);
  **wharf sheds** along the river banks east and west in the 1880s and mid-rise apartments with roof gardens on the same
  banks TODAY; the tall ships with a pointed bow, a raked stern, a white strake, a bowsprit and **sails set**; the paddle
  steamer with a bow and a rubbing strake. **Today's office towers** (props.js `bluestone_glasstower`): blue-grey curtain
  walls between mullions every ~1 m, floor bands, offices lit behind the glass in an irregular pattern (pale by day, lit at
  dusk), the Customs House's with a **stepped gold crown**, a lit band and a mast — the "near-black box" on the dusk card
  was this tower at dusk (a raycast on the card's camera: an era-2 prop at (−27.3, 13–18, −7.4)). **The Customs House's
  3000s vertical farm** (`bluestone_farmtower`, DESIGN §5.2's green-glass louvres and planting) instead of a spire: a pearl
  frame round a green-glass core, louvres across every face, planting over every slab, white-gold seams, a ring of light
  on its roof; the sky-bridge now leaves from its north face.
- **Re-rendered** with stageart.cjs (ERA_FROM=1 ERA_TO=2 FRONT=30 by day, ERA_FROM=2 ERA_TO=3 FRONT=30 at dusk, SS 2),
  installed as `assets/stages/bluestone-{day,dusk}[-sm].webp`. **Pictures:** `out/fix2/cards/card-{day,dusk}.jpg`,
  `cards-vs-halyard.jpg` (looked at beside Halyard's at the same size): the top third is a city on land now — roofs, trees,
  quays, sheds, a tall ship under sail by day; at dusk lit terraces and towers and today's gold-crowned tower. It is not
  Halyard's painted skyline across open water (the camera looks down into a city), but nothing reads as blockout.

### Review issue 5 (minor) — the drum's ceiling over mid
- **Fix** (`f351342c`, props.js `bluestone_drumceiling`, a centre prop, era buckets, no collider): an octagonal plate just
  under the drum (y 7.98–8.0, inset 5 cm from its faces) closes the sky-coloured seam between the drum's OCT pieces; under
  it, within 8.5 cm, coffers — eight radial ribs and two octagonal rings, bosses at the crossings, a moulded rim and a rose
  round Tartar's: the 1880s coffered timber with gilt bosses, TODAY cream coffers with a gold rim, the 3000s white coffers
  with light seams.
- **Pictures:** `out/fix2/issue5-drum-ceiling-e123.jpg` (the review's Ccircusw camera and one straight up under Tartar, every
  era, day and dusk): no seam, the coffers per era.

### Review issue 6 (minor) — the 3000s violet dusk tinted the city into Cobalt's hue
- **Fix** (`4f34e405`): the 3000s sunset's fill and sky middle a neutral lilac-grey (#a29eb6 / #8a84b0), a warm white key
  (#fff2e2), env 0.3 with the fill at 0.8, a softer shadow tint (0.95, 0.96, 1.05), the era tint white-gold (1.0, 0.99, 0.97
  instead of a blue cast), and the 3000s paving a warm pale stone (levelart GROUND, era 3) — the Cobalt ink stood on a
  blue-grey ground of nearly its own hue.
- **Measured** (the review's ink pairs, the 3000s at dusk): Cobalt-hue background **14.8 % → 0.8 %**; Cobalt against the
  ground it covers **ΔE 51.7 → 68.9** (target ≥ 65; Halyard 87.6); eras-look (g) holds the Cobalt share.
- **Picture:** `out/fix2/issue6-cobalt-e3-dusk-before-after.jpg`.

### Review issue 7 (minor) — the 3000s furniture, the statue plinth, the pieces that never changed
- **Fix** (`1779f17c`; the tops of all these pieces are walkable, so everything is level art or within 8.5 cm of a face):
  - the **hover cart**: a canopy in sage and cream stripes over a display of goods (muted: the ink stays loudest), the body
    riding on a gap of light (a dark recess over a white-gold strip at its foot), its goods in crates on top;
  - the **café pods**: a glass band onto the lit counter (cups, the machine), a light ring at the brim and a **parasol of
    light** on top (eight ribs of light from the centre and their glow);
  - the **recycling pods**: a **sorting lid** in three colours with marks of light and the same three as bands down the faces;
  - the **statue plinth** as a monument in every era (no figure: its top is walkable): a base course, a cornice of two
    mouldings, a **bronze relief per era** in a moulded frame — the lord mayor in his chain and top hat, a tram conductor
    with his cap and ticket machine, the time traveller holding a light — its inscription, and a **wreath** against its
    circus face per era (`bluestone_wreath`, within 8 cm: laurel, flowers and a ribbon; white flowers round a ring of light);
  - the **drinking fountain** a fountain of light in the 3000s (arcs of light up a pearl drum, rings running out across the
    bowl; granite in the 1880s and TODAY: a heritage fountain);
  - the **buffer stop** a buffer of light in the 3000s (a ring and a bar of light on pearl);
  - the **wharf decks' timber rails** (the Customs dock's, the Boathouse deck's) per era: timber (1880s), painted steel
    (TODAY, a new `steel` rail kind), glass (3000s).
- **Pictures:** `out/fix2/issue7-furniture-e123-{day,dusk}.jpg` (cart, café, bins, fountain, statue, buffer, rails in every
  era); the day sweep's e3 pages (cart.0 / 1, bins.0, cafe.0, fountain.0, statue-plinth.0, buffer.0, customs-dock.0,
  dock-stair.0, deck-rail.0) and e1 / e2 (the timber and steel rails). Left as they were: the bike dock and the benches
  (the pearl family with moss seats), the mooring posts (bluestone with iron bollards in every era).

### Review issue 8 (minor) — carried: the end-of-match beat, the timetabled tram, bots on jump 1's new ground
Not built: outside this round's brief (dressing, shaders and the engine's art-phase items). LEAD-NOTES records no decision
on DESIGN §3.10 or the tram's timetable; both remain the lead's to build or cut. The bots' fresh-ground lever
(`_pickPaintGoal` from `E.fresh` for 30 s after done) is the balance pass's; no balance set was run this round.

### The round's tests
- **Local** (this Mac, one Electron at a time, load 7–35): eras-look 19/19, then part 5 8/8 with (h); eras-static 23/23;
  check-maps (bluestone 712, per era 568 / 590 / 700, as before); eras-jump guard/fx 3/3, sky/freeze/modes 6/6, frames 4/4
  (the jump frame 48 ms at J + 1.47 at load 7), 'first' 0/1 once at load 10–18 (no program compiled; the warning frame's era
  update 12.8 ms over its 10 ms bound — the callout's DOM 5.3, audio 3.8, the ring 3.6: the CPU-load failure fix round 1 also
  saw once); world-build bluestone 5/5 and halyard 5/5; eras-world part 5 3/3.
- **Mac mini:** JOB-20 / JOB-21 (attribution by the old timer; JOB-21 also eras-jump first 1/1 ×2 and frames 4/4 + 3/4),
  JOB-22 (the timer against throughput), JOB-23 (the day sweep: 511 / 523 / 582 views of 155 / 157 / 171 clusters, console 0;
  15 pages looked at), JOB-24 (the dusk sweep: the same counts, console 0; 15 pages looked at), JOB-25 (the suite, the bake,
  online, perf6: below), JOB-26 (the cut by throughput: issue 1).
- **JOB-25** (Mac mini at `413d5a09`, this round's code incl. `dbe15f36`; load 2.7): the whole suite — eras-static 23/23,
  eras-world 12/12, 7/7, 3/3, **eras-look 20/20** (with (g) and (h)), eras-jump first 1/1, a 8/8, b 7/7, c 3/3, d (frames)
  4/4, e 6/6, eras-hud 12/12, eras-modes 6/6, stage-mods 36/36, world-build halyard 5/5 and bluestone 5/5, climb-audit /
  cover-map / spawn-mid 1/1 in every era, tower-check 73.99 m, no holes, clearance clean in every era; check-maps unchanged
  (bluestone 712, per era 568 / 590 / 700); eras-jump 'frames' three more runs 4/4, 4/4 and **3/4** (one frame of 421.7 ms at
  J + 0.93 with the era update 0.1 ms and the render 1.4 ms: the stall sits outside both, the same unmeasured kind as JOB-16's
  422 ms and JOB-21's 379.5 ms; the jump frame itself 33–36 ms) and 'first' 1/1; **eras-bake 3/3**, stage-audit turf / zones /
  tower in eras 1–3 and boss in era 2 all "lightmap applied (baked for this build, not stale)"; **net-eras 14/14, lagged 8/8**;
  **perf6** against Halyard (3 runs, medians): calls ×0.84 / ×0.86 / ×0.95 by day and ×0.93 / ×0.83 / ×0.85 at dusk,
  triangles ×0.39–0.45, cpuRender ×0.81 / ×0.83 / ×0.86 and ×0.73 / ×0.76 / ×0.76.
- **Online / bots:** nothing new crosses the wire (the trams, ceilings, wreaths, rails and looks are era props and level art
  keyed by the era every screen derives; the static programs and the prepass are per screen); no nav input changed.

### The round's commits and files
**Code:** `4f34e405` (the dusks, eras-look (g)), `2d4f7a6b` (the GPU cut), `a85f6179` (the trams), `f351342c` (the drum's
ceiling), `29705647` (the backdrop, the towers, the farm), `1779f17c` (the furniture, the monument, fountain, buffer, rails),
`0ffc37c6` (the cards), `dbe15f36` (the prepass's feet height, eras-look (h)), `d5077600` (`_hexOff`).
**Scratch:** JOB-20 … JOB-26 and the probes, `fc4f5227` (the cards' pictures), `fd514118` and `c6a310f8` (the pictures), this
report. **Shared files:** `src/world/levelMaterial.js` (4 lines tagged `[b5-bluestone]`, the same picture: big / fine / the
coping's stone computed only where read); the rest is the stage's own folder, its module (`src/game/eras.js`,
`src/fx/eraFx.js`), `tools/botlab/tests/eras-look.js` and `assets/stages/bluestone-*`. Program keys on Bluestone: the level's
full program `inkwave-level-v8-eras-bsart`, at rest `…-bsart-static1` / `-static2` / `-static3`.

## Fix round 1 (2026-10-25): the independent review's REDO, issue by issue

(As answered then. Its GPU-time paragraphs (issue 7, § 6) use the timer query that fix round 2 showed does not measure
the GPU's time: see fix round 2, issue 1, for the corrected numbers.)

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
stage card). Fix round 2: the land dressed (stone promenades with avenues of trees along the quays, parks, streets), pitched
roofs on the 1880s terraces, wharf sheds (1880s) and apartments (TODAY) on the river banks, the tall ships under sail.

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
  [-sm].webp`; re-rendered at fix round 2, `out/fix2/cards/`): day is jump 1 frozen at r 30 (TODAY inside the curtain, the 1880s outside), dusk jump 2 (the 3000s
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
  cpuRender ×0.79–0.84. Fix round 2, JOB-25: calls ×0.83–0.95, triangles ×0.39–0.45, cpuRender ×0.73–0.86.) The GPU's own frame time: fix round 1's JOB-15 (§ fix round 1, issue 7). eras-jump 'frames' on
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

15. (fix round 2) **The dusk palette's fill per era**: the hues of fix round 1 kept, the hemisphere fill and environment
   raised and a per-era exposure (1880s 1.2, TODAY 1.08) until the 'mid' preset reads ≥ 40/255 like Halyard's; TODAY's env
   held at 0.75 (more mirrored the pink-violet sky into the streets as Grape-like purple). The 3000s dusk neutral lilac-grey
   with a warm white key, a white-gold era tint and warm pale paving (Cobalt contrast).
16. (fix round 2) **The dusk check's threshold in eras-look (g) is 34 in the page's own frame** (1512 × 945, the theme switched
   in place), which reads ~4 under shoot.cjs's 1600 × 900 shot of a match started at dusk (the review's ≥ 40 acceptance is
   measured there: 43.5 / 47.7 / 49.9).
17. (fix round 2) **The float-tram's glass hides an opaque partition**: it is cover; clear glass all through would show
   players behind it (the collider blocks shots and ink either way).
18. (fix round 2) **The 3000s furniture and the statue plinth stay level art** (their tops are walkable: no canopy, parasol
   or statue may stand on them; the wreath is the one prop, within 8 cm of a face). The plinth is a monument with a relief
   per era, not a statue.
19. (fix round 2) **The wharf decks' timber rails change per era** (timber / painted steel / glass: a new `steel` kind), and
   the Customs House's 3000s rooftop is DESIGN §5.2's vertical farm instead of a spire (the sky-bridge re-anchored to it).
20. (fix round 2) **The GPU cut**: static level programs per era at rest (four level programs compiled at load), a depth
   prepass at rest, the shared level shader's noise / coping computed only where read (`levelMaterial.js`, the same
   picture), no hex anti-tiling on Bluestone's level. The gate is measured by throughput (the lead's ruling).

## 3. Online and bots
- **Online:** nothing new crosses the wire. The art is a pure function of the era state each screen already derives from
  the shared stage clock (the level shader's era bit, the era props' buckets, the backdrop sets, the lamps' colour);
  superJumpLanding runs on the jumper's own screen at launch and the existing 'superjump' record carries the moved
  landing to every screen (as the lava's does). No record, no field added; docs/NET.md unchanged.
- **Bots:** no nav input changed (the union graph is identical); the bots' danger layer, pre-positioning and fresh-ground
  goals are the engine's. Matches: §4.

## 4. Tests, pictures, balance
**Fix round 2:** § fix round 2, "The round's tests" (local, and the Mac mini's JOB-20 … JOB-26: the suite, the sweeps by
day and at dusk, the bake and audits, online, perf6, the GPU by throughput). Earlier rounds below.
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
**Fix round 2:** `4f34e405`, `2d4f7a6b`, `a85f6179`, `f351342c`, `29705647`, `1779f17c`, `0ffc37c6`, `dbe15f36`, `d5077600`;
scratch JOB-20 … JOB-26, `fc4f5227`, `fd514118`, `c6a310f8`, this report.
**Shared files: `src/world/levelMaterial.js` since fix round 2** (4 lines tagged `[b5-bluestone]`, the same picture on every
stage); before it none. Every other change is in the stage's own folder (`src/world/stages/bluestone/*`), its module (`src/game/
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
- **(fix round 2) GPU time — closed by the lead's ruling:** the ×1.4–1.9 of fix round 1 was the timer query's, not the
  GPU's (fix round 2, issue 1); by throughput Bluestone is ×0.85–0.95 Halyard at fix round 2's cut, ×0.95–1.03 before it.
  The timer's mechanism on WebGL-over-Metal is not fully explained (it reads queueing behind earlier GPU work: an idle gap
  before each frame halves it); gpu-time.sh is no longer a gate method.
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
- **(fix round 2) eras-jump 'frames'**: one run in four on the Mac mini still meets a single stall of 380–420 ms early in the
  jump (J + 0.85–0.93) with the era update and the render both under 2 ms — outside the stage's code as measured, the same
  as JOB-16's before this round; not explained. Every other frame of the jump ≤ 36 ms.
- **(fix round 2) eras-jump 'first' locally** failed once at load 10–18 on its 10 ms bound for the warning frame's era
  update (12.8 ms: the callout's DOM, audio, the ring; no program compiled); on the quiet Mac mini 1/1 ×4.
- **(fix round 2) The cards** read as a city on land now, but not as Halyard's painted skyline: the art camera looks down
  into the city, so the backdrop is roofs, trees and quays rather than a horizon (DESIGN §5.8's camera kept).
- **(fix round 2) TODAY's river at dusk** mirrors the pink-violet sky strongly (Grape-like background 10 %, Halyard 16 %);
  the Boathouse deck looking west shows a bright sun glint on its planks at dusk in the 1880s (the key raised to 3.5).
- **(fix round 2) Left as they were in the 3000s:** the bike dock and the benches (the pearl family with moss seats), the
  mooring posts (bluestone with iron bollards in every era), the phone kiosks (Tartar's, by design).
- **(fix round 2) Review issue 8** (the end-of-match beat, the tram's timetable, the bots' fresh-ground lever): the lead's.
- The stage stays BETA until the lead accepts the art.
