# Bluestone Junction: the lead's decisions (read before the engine and art phases)

## After the round-C blockout passed (2026-10-10)

The lead looked at the reviewer's top-downs (one camera, one scale: Crossroads Market, Bluestone era 1, era 3) and the
walkable masks. The kinked Z reads: spawns in opposite corners, offset legs, the dome on the crossbar, a harbour basin in
each re-entrant corner. It cannot be mistaken for Crossroads Market. **The blockout is accepted. Its geometry is frozen
for the engine phase:** the era engine serves the layout as built (`DESIGN.md` §8), and no geometry changes are made
in the engine phase unless an engine rule forces one (say so in the report).

Decisions on the review's open items:

1. **The Halo (era 3).** Accept the measured mean (48 % over 25 runs since fix 1; 3 runs under 30 %). Do NOT build the
   builder's proposed reversed river stair before art. The Halo is re-checked in the consolidated balance pass when the
   Mac mini is back (ENGINE.md §7 risk 16 lists the layout levers if it needs them).
2. **The knee's far apron** (208 m² per team behind the Customs House). Carried to the balance pass with the reviewer's
   target: era-3 mean ≥ 40 %, no run under 25 %. If it misses there, put the apron on a route (the Customs House ground
   floor as a colonnade from the cab rank through to the apron), not more cover, and mind the era-3 margin (+10.1 % over
   era 2; any floor added to every era is taken from the apron or matched in era 3). The art phase may give the apron a
   purpose and dressing (a goods yard, a customs shed's loading bay) but adds no floor.
3. **The size measure.** The directive's floor numbers are `cover-map`'s floorCells (top floor per column). The
   every-level count (5,711 / 5,856 / 6,904 m²) is recorded in DESIGN.md §8.8 for the record; no change.
4. **Names.** The station is **Flounders Street Station** everywhere (the user's name). "Flathead Street" is retired: a
   station takes its street's name, so the old river road / the crossbar street is **Flounders Street**. Fix every
   remaining mention in DESIGN.md (the identity paragraph, §1, §2, the lettering in the look table: "FLOUNDERS STREET
   STATION" on the drum), ENGINE.md, the code comments, `surfaces.js`, and any signage data. Swimston Street, Degrayling
   Lane, Hoki Lane, Centre Plaice, the Young & Jackfish, the Yabby stay.

## For the engine phase (`src/game/eras.js` through the stage-module registry)

- `ENGINE.md` is the contract (revision 2, written for the X layout); `DESIGN.md` §8.6 is the era set on the Z as
  built; `docs/STAGE-MODS.md` "Bluestone Junction: eras" says which registry hook serves each ENGINE.md item. Where
  ENGINE.md names a hook-in in a shared file that the registry already serves, use the registry. Where the X-era
  numbers in ENGINE.md (bounds, R_max, group counts) differ from the Z, the Z wins: re-measure and record.
- The schedule per mode stays as designed (jumps at 1/3 and 2/3 of the clock; Boss Battle fixed in era 2; Practice
  cycles with the rewind and its rescue; overtime never jumps).
- The jump is the showpiece. The user loved the Practice clear-ink wave and asked for "a full map effect". The order of
  events must be readable by a first-time player: Tartar's phone rings (the pre-bell at J − 20), the clock rows count
  down, the HUD countdown, wire pulses from the dome outward, holograms of what appears, then the radial front from the
  telephone at 25 m/s rewriting the city as it passes, the time-lapse sky, the done callout ("TODAY" / "3000s"). Neutral
  highlight colours (white-gold / warm grey), never a team ink.
- Fair: nobody inside an appearing piece (shove), nobody dropped into the river (rescue), the guard window, ink kept on
  ground that exists in both eras, pieces that vanish take their ink, pieces that appear arrive blank. Nothing a team
  relies on is taken away without the warning.
- Bazookarp: wave 2's `karp-engine` is not merged yet. Build H21's hook (`karpField.setState(era)` at done, the drop
  spot's danger rule) against the registry's query surface and a stub, with a test that runs once the karp module is
  present; the per-era Bazookarp checks run at integration.
- The lightmap: implement the per-era bake passes (`W.bakePasses()`, three per key) and prove them with one bake of
  one key; the full nine-pass bake belongs to the art phase, when the stage is final.
- Bots and online are not optional (COMMON.md). Locally: 2–4 bot matches per era schedule and mode, not the Mac mini's
  six.

## The era engine PASSED its final review (2026-10-17, head 2833d04b). What carries forward

The engine is accepted: both halves built, the final review found no era shove, no splat caused by a jump in a match,
no desync, no doubled or skipped jump, no floating device, no stuck bot; the jump reads in order. The reviewer's six
minors go to these owners:
1. **The art phase's first commit (an engine item, small):** `superJumpLanding(a, s)` in StageEras: at launch, if the
   group under the landing will be absent at touchdown and the floor below is then water or a bare roof, move the
   landing to the rescue's own choice (the nearest node valid in the era in force); a check in eras-jump with the
   reviewer's probe (Practice rewind, bridge-2 / bridge-3 / garden-11, touchdown 0.3 s after the flip: 3 of 3 died).
2. **The art phase also:** per-era lamp colours (ENGINE rule 42, `eras.look[e].lamps` applied to `decor.lamps` and
   blended in the time-lapse) once lamps exist; Tartar ringing once in the intro fly-in (DESIGN §3.5); a pixel check
   on the warning's sepia flicker; the rule-22 accept text to the measured 3.75 m; every jump picture re-shot with
   eras-shots2.cjs so the set the user sees shows the current HUD. And the art's real job, the reviewer's words: "the
   shared city barely changes as the front passes" and "the 20 cm blocky dissolve still reads as a digital glitch":
   the era re-skins, props, murals and tint must make the front rewrite the city, not only the skyline.
3. **The Mac mini:** the frame budget on a quiet machine (the branch's JOB-6 with a real-time rAF-paced frame check
   beside the stepped one), and the bots' use of jump 1's new ground per mode (the balance pass; the lever is
   `_pickPaintGoal` drawing from `E.fresh` for 30 s after done).
4. **The integrator:** the karp `anyValid` one-liner (`tools/botlab/jobs/batch5/bluestone/karp-anyValid.patch`) when
   b5-stage-bluestone merges with the Bazookarp packages, then `eras-karp.js` part B and `bazookarp-check.cjs
   ERA=1/2/3` on the merged head.
The art phase waits for the weekly usage reset (Friday 2026-10-23 06:00).
- **The frame budget: CLOSED (2026-10-17, the Mac mini's JOB-6 at 986f1af9, idle machine, ×3).** Worst frame from
  J − 0.5 to done + 1.5: 35.4 / 32.0 / 32.1 ms (the jump frame at about J + 1.5 s), p95 4.6–5.0 ms, era update
  ≤ 2.5 ms; the Bravo viewer's 2→3 and the sunset 3→1 jumps peak at 10–16 ms; 'first' 3/3 with no shader compiled
  during a jump. net-eras and the lagged run passed there too. One aside for the engine in general, not this stage:
  the first inking frame of any match is 160–260 ms (a paint-atlas first-use cost).

## The art phase (2026-10-25): the place, in three eras

The era engine is accepted. The reviewer's words on the engine pictures are the art phase's brief: "the shared city
barely changes as the front passes" and "the 20 cm blocky dissolve still reads as a digital glitch". The art must make
the FRONT REWRITE THE CITY at street level, not only the skyline. Binding:
1. **Three looks of the same streets** (DESIGN.md §5 and its per-building table): every building face, kerb, lamp,
   tram, sign, cart and mural has its 1880s, TODAY and 3000s version through the engine's era re-skins (surfaces,
   murals with era masks, era props, tint, the backdrop sets, `eras.look[e].lamps`), so that a player standing anywhere
   sees the era change around them. Prove it with the same camera in all three eras at eight places (the circus, the
   knee, Swimston, the quay, Hoki Lane, the arcade, the forecourt, the Halo) and the sweep tool in each era.
2. **The Halyard bar everywhere** (`tools/botlab/stage-sweep.cjs` in each era, day and dusk, TWIN=1): no bare box at
   eye level in any era; every structure is something; signage, props, iron lace, bluestone kerbs, the station's
   clocks and dome dressed per era; Flounders Street Station named on the drum in every era's lettering.
3. **The jump's look**: the front's dissolve becomes the showpiece (the Practice clear-ink wave is the reference: a
   clean sweeping edge with the Roman-numeral curtain, no 20 cm blocks), the holograms and wire pulses in the
   highlight colours, the time-lapse sky; a jump picture sequence from Swimston and the knee at J − 10, J + 0, J + 1.5,
   J + 3, done + 1, and the hero shot for the stage art (day and dusk cards) showing the three eras' identity.
4. **The engine's art-phase list** (LEAD-NOTES "The era engine PASSED"): superJumpLanding in Practice's rewind; lamps
   per era; Tartar ringing once in the intro fly-in; the sepia-flicker pixel check; the rule-22 accept text; every jump
   picture re-shot.
5. **Play geometry is frozen**: no collider or layout change (check-maps piece counts, climb-audit, cover-map,
   spawn-mid, tower-check per era unchanged); dressing within 8.5 cm of faces, nothing on walkable tops; the bake
   (nine passes: three keys × three eras) at the end, on the Mac mini or locally; performance against Halyard per era
   with the fixed-view probe (calls and cpuRender level; triangles within +15 %).
6. The stage stays BETA until the lead accepts the art.

## Added 2026-10-25 (the lead, during the art phase): GPU time is a gate

The Mac mini's bluestone JOB-15 (`results/JOB-15.txt` on botlab-b5-bluestone, head 272f53a3) measures Bluestone's GPU
time at 43–48 ms per frame in every era and every one of its 8 fixed views, against Halyard's 24–28 ms: 1.7–1.9×, at a
third of Halyard's triangles, flat across views, so the cost is per-pixel / full-screen, not geometry. The perf6
CPU / calls / triangles probe cannot see it. **Gate for this phase: GPU time within 1.2× Halyard in every era, by the
Mac mini's method (JOB-15's timer), day and dusk.** Suspects, in order: the level shader's era chunks (the per-fragment
era one-hot, mural masks, the front, the per-era AO channel sample: are they compiled into every stage's program or
only Bluestone's, and are they cheap when no jump runs?), the paint atlas of the union world (density, size), GTAO
settings or era meshes left in the GTAO pass, the hologram / curtain / time-lapse materials drawn full-screen outside
a jump, the backdrop sets all drawn at once, the water. Measure each by elimination (toggle one, re-time), fix the
cause, and record the before / after per era in the report. The art builder does this before the cards; the reviewer
re-measures.
- **The GPU timer is a job step now:** `tools/botlab/jobs/batch5/bluestone/gpu-time.sh` on botlab-b5-bluestone (c495086b):
  `SETS="bluestone:1 bluestone:2 bluestone:3" TIMES="day dusk" ROUNDS=2 BASE=<sha> bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh`
  from a JOB-<n>.sh gives before / after against BASE with Halyard as the reference (gpu.txt: medians, ÷ Halyard).
  Compare only within one job (an overlapping job inflated Halyard to 41 ms). Fetch and merge botlab-b5-bluestone to get it.
- **JOB-18's diagnostic (2026-10-25, review 2's head 8188097a):** day 44.3 / 44.9 / 46.0 ms (×1.46–1.51 Halyard's 30.4),
  dusk 46.4 / 47.3 / 47.8 ms (×1.68–1.73 Halyard's 27.7): the gate FAILS. **With the whole level hidden Bluestone still
  costs 37.0 ms against Halyard's 21.8**, so about 15 ms of the gap is OUTSIDE the level geometry; the art, the rooms,
  the re-skin loop and the discard save at most 2.6 ms each. Look first, by elimination with the timer, at: the three
  era backdrop sets (`G.env.stageSets`: are the two hidden sets still rendered, updated or shadow-casting; their
  `onBeforeCompile` materials; the far clip by `length(vW.xz)`), the env root (the time-lapse sky and clouds, the env
  map rebuild, exposure), the water, the shadow map size, GTAO or post passes touching era meshes, the holograms /
  curtain / wire-bead FX kept alive outside a jump, full-screen quads. Find the 15 ms before touching the level.
- **JOB-19's attribution (supersedes JOB-18's reading):** an empty scene costs ~15 ms on BOTH stages, so the whole gap is
  in what is drawn. Bluestone's level with a plain material costs ~19 ms over empty against Halyard's ~10: Bluestone
  draws FIVE level meshes (level + era1 / era3 / era4 / era6) where Halyard draws one, so **check whether the inactive
  eras' meshes are drawn every frame** (they should be hidden or culled outside a jump: `visible = false` on the sets
  not in the current era, and out of the shadow and GTAO passes). The real level material adds ~11 ms more on top
  (the era chunks per fragment: make the era one-hot / mural-mask / front work cheap or skipped when no jump runs).
  GTAO −5 ms; shadows, EraFx and transparents ≤ 2–4 ms each. Bloom OFF makes Bluestone SLOWER (53–62 ms): find why (a
  fallback path drawing twice?).
- **JOB-20's attribution (fix round 2, head 2310eed9, BEFORE the fix; `results/JOB-20.txt`, the per-config `ab.txt` in
  `JOB-20.raw.txt` on botlab-b5-bluestone):** bases e1 day 42.6, e2 day 44.3 / dusk 46.3, e3 day 44.6 / dusk 46.7 ms against
  Halyard 25.7 / 28.0 (×1.66–1.73; the gate wants ≤ 30.8 day / ≤ 33.6 dusk). **The one big lever is the level's MATERIAL:**
  drawn plain, Bluestone saves 9.6–13.0 ms (e1 42.6 → 33.0, e3 dusk 46.7 → 33.7) where Halyard saves 1.3–3.9. No single part
  of it dominates: at e2 day the generic parts (fine −2.2, cope −1.9, hex −2.3, murals −1.7), the era chunks (−2.9), 'no art'
  (−3.1) and each art style skipped alone (−0.5 to −1.7; the eight sum to −10.8, so the skips are NOT additive with 'no art':
  the builder who wrote gpu-ab.js must say what skip:N removes — the style's shader branch or its pieces — because that decides
  whether the lever is shader work or fragments). **The lead's reading:** the level covers a comparable share of the screen
  on both stages (Halyard 60 % style 0; Bluestone 72 % styles 1–8), yet every per-fragment part costs ~2 ms on Bluestone
  against ~0 on Halyard — the signature of MORE SHADED FRAGMENTS PER PIXEL (the five level meshes, inactive-era meshes drawn
  outside a jump, hidden faces) and/or a shader every one of whose parts runs for every fragment; the depth prepass saving
  (−2.6 / −3.6 against Halyard's −0.8 / −1.3) points at overdraw too. Even plain, Bluestone is ×1.35 Halyard-plain, so the
  fill side alone is ~8 ms. Two levers, BOTH needed to reach the gate: (1) cut the shaded fragments — the inactive eras' meshes
  hidden outside a jump (`visible = false`, out of the shadow and GTAO passes), the active era one mesh drawn once, front-to-back
  or the prepass if it pays; (2) make the Bluestone-only shader work vanish when no jump runs — the era one-hot, murals and art
  styles behind a uniform early-out, or a second program (`defines`) for the static era so the generic program is what Halyard
  pays. Lamps (−1.4 / −4.3 at dusk) and LOD 25 m (−2.0 / −2.5) are the next 2–4 ms if still short. NOT allowed for the gate:
  GTAO, bloom, shadows or the sea turned off (same quality settings as Halyard). The 'off' switches whose sign flips (bloom off
  +5.7 / +7.6 SLOWER on Bluestone; GTAO off and sea off slower on Halyard) change what the frame draws, so they are not savings;
  the bloom-off anomaly still wants its cause found — it may be the same double draw as the overdraw above. After the fix:
  re-run gpu-ab.js's base rows (JOB-21) and record before / after per era in the report.
- **JOB-21 (the first cut, 2d4f7a6b — static level programs at rest, the depth prepass, lighter generic paths — against
  2310eed9):** e1/e2/e3 day 40.6 / 41.0 / 42.6, dusk 42.4 / 43.2 / 45.1 against 44.1 / 44.4 / 45.1 and 46.5 / 45.3 / 47.4:
  **the cut saves 2–4 ms; ×1.54–1.64 Halyard (26.2 / 27.5); the gate (~31–33 ms) is still 8–12 ms away, and the
  plain-material lever is UNCHANGED at −9 to −10 ms at the head.** So compiling the era out of the program at rest did not
  remove the material's cost: what is left in the static program — the art per style (the procedural facades; 'skip' rows)
  and the generic parts (fine / cope / hex / murals, each ~2 ms here against ~0 on Halyard) — is the 9–10 ms, and the
  reading of non-additive savings (every part removed helps a little, all removed helps a lot) is a program bound by its
  size: registers / occupancy, every style's code carried by every fragment. **The lead's direction:** the level material at
  rest must cost what Halyard's does — ≤ 4 ms over plain. Candidate shapes, the builder picks by measurement: one program
  per art style (the level split into style groups with `defines`, so a fragment carries one facade's code; +8 calls per
  era is nothing), the procedural facades baked once per era into a texture the shader samples (the art render target is
  already there — 'artrt' −2.4 / −3.7), constant work moved to the vertex stage, noise octaves cut with distance (the
  histogram puts 60 % of the level's pixels in the first bin). Measure with gpu-ab.js `pre=plain` (what remains beyond
  the material: props, backdrop, transparents) AND at the head; the fix lands only with a before / after per era.
- **Lead's decision on the gate and the budget (2026-10-25 17:20):** the gate stands for review 3. If review 3 fails on the
  GPU gate ALONE (every art item passed) the stage ships as PUBLIC BETA with the GPU gap written into the beta round 2 brief
  (DECISIONS #33: playable but unfinished ships BETA); the art is not held hostage to it, and the GPU work resumes after the
  reset of 2026-10-30. The reviewer writes the per-era numbers either way.

## The GPU gate, corrected (the lead, 2026-10-25 17:50): the timer query was never the GPU's time

JOB-22 (`results/JOB-22.txt`, head d68d1c1f; the Mac mini's correction b7be2e8d on botlab-b5-bluestone) timed the same
`R.render` three ways at perf6's eight views: A, the gate's timer query with `gl.finish` after each frame (JOB-15's method and
gpu-time.sh's): Bluestone 40.8–44.4 ms, ×1.60–1.72 Halyard; B, 24 queried frames back to back: the same as A; **C, the
render 30× back to back with a fence after the last, the wall time until the GPU is really done: Bluestone 6.28–6.94 ms per
frame at the head (6.96–7.57 at review 2's src), HALYARD 7.35 / 7.33; the CPU issues a frame in 0.8–1.0 ms on both.** C is a
physical measure that cannot be out by more than the CPU's issue time; if a frame really cost 44 ms, 30 of them would take
1.3 s, not 0.2 s — and the stage runs at 60 fps at rest on that Mac. **So on this Mac (M4, WebGL on Metal) the
EXT_disjoint_timer_query reads about six times the frame's real GPU cost and does not even keep the ratio (Halyard ×3.6,
Bluestone ×6.7); every GPU number in JOB-15 and JOB-18–21 is void, as an absolute and as a ratio.** Lead's rulings:
1. **The gate's method is C** (`tools/botlab/jobs/batch5/bluestone/gpu-sustained.js`, the 'done / frame' column): Bluestone
   ≤ 1.2× Halyard in every era, day and dusk. **By it the gate is MET at the head (×0.85–0.95) and was met at review 2's src
   (×0.95–1.03).** Review 2's issue 1 is closed; no further GPU work in this round. gpu-time.sh is not a gate method any more
   (its header says so); the reviewer re-measures with gpu-sustained.js C only, on the Mac mini or locally.
2. The first cut (2d4f7a6b: static programs at rest, the depth prepass, the lighter noise paths, hex anti-tiling off) saves
   about a tenth by C too, so it STAYS — on the condition the reviewer's pictures are unchanged (static vs full program at rest
   0–1/255 is shown; the hex-off and the coping / noise paths want the eye-level check) and the prepass shows no fault: no
   holes or z-fighting from the polygon offset, the era pieces that appear / vanish matching their prepass twins in every era
   and during a jump, the see-through window round the local player intact, the river and the backs still correct where they
   show. A fault in the prepass → revert the prepass alone, keep the static programs.
3. Lesson for the harness, recorded in COMMON.md's spirit: a WebGL timer query on Apple silicon measures something other
   than GPU execution; time GPU cost by throughput (N renders + a fence), and corroborate any 'GPU-bound' claim with the
   frame interval at rest before acting on it. The ×1.5–1.9 'gap' cost two jobs' worth of fixes chasing an artefact; the
   LOD / lamp / backdrop ideas above are not needed for the gate.
- **JOB-25 (fix round 2's head, the full set; `results/JOB-25.txt`):** art-tests.sh, eras-jump first, frames ×2 of 3,
  eras-bake 3/3, stage-audit turf / zones / tower × e1–e3 (lightmap applied, not stale: JOB-7's lightmaps still match this
  build, so no new PNG / JSON), net-eras 14/14 and lagged 8/8, check-maps clean; perf6 against Halyard calls ×0.83–0.95,
  tris ×0.39–0.45, cpuRender ×0.73–0.86. **One miss: frames run 3 had a 421.7 ms frame at J + 0.93 s** whose measured parts
  total ~1.5 ms (era update 0, render 0.1) and nothing compiled — the same unmeasured stall as JOB-16 and JOB-21, one run in
  three or four. Lead's ruling: pre-existing (JOB-16 predates the art), so NOT a gate for the art's acceptance; it goes to
  the beta round 2 brief as a named item with the hypotheses to test there: a texture or lightmap first bound in the new
  era and uploaded inside the draw (warm every era's textures at load as the programs are), a GC pause (the jump's
  allocations), the lightmap swap. The reviewer notes it, does not fail on it.
- **JOB-26 (method C, confirming; `results/JOB-26.txt`):** e2 as built 6.18 ms day / 6.62 dusk = ×0.88 / ×0.93 Halyard
  (7.05 / 7.14); the round's static programs + prepass are worth ~1.0 ms (7.25 / 7.55 without them). Bloom costs 0.8–0.9 ms on
  both stages, so the "bloom-off slower" anomaly was the timer's and is CLOSED. idle.js explains the timer: it reads 17–18 ms
  back to back but 7.8–8.5 ms with an idle gap before each frame — it counts the wait behind the previous frame. Nothing more
  to do on GPU time in this stage.
- **JOB-27 (art review 3's job; `results/JOB-27.txt`):** the GPU gate by method C is MET in every era, day and dusk: e1 6.16 /
  6.56, e2 6.36 / 6.58, e3 6.47 / 6.92 ms against Halyard 7.12 / 7.27 (×0.86–0.95). Suite, frames ×2, first, bake, stage-audit
  10/10, net-eras lagged all pass; **net-eras 13/14**: the guest's Iron Bridge splats around a flip leave 2 of 368 cells
  different on the two screens — THE SAME 2 CELLS in each of 6 tries (the Mac mini's correction), so this is deterministic,
  not flaky (beta1's JOB-7 saw 1 cell once, JOB-9 passed 3/3). Lead's ruling: a reproducible online paint divergence in the
  flip window, pre-existing and not art, NOT an art-acceptance gate; it goes to the beta round 2 brief as
  a named item (make splats that land inside the flip window reconcile deterministically on both screens: the host's
  authoritative paint for cells touched during the flip, or hold the guest's splats until the flip's paint is applied). The
  reviewer notes it, does not fail on it.
