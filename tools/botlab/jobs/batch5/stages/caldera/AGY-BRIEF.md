# Highmark Foundry, the art phase (a brief for Antigravity from the batch lead, 2026-10-25)

You are building the PLACE of **Highmark Foundry** (`caldera`), INKWAVE's volcano stage: a foundry inside a breathing
volcano whose lava rises and falls. Its play geometry and its lava engine are finished and accepted after ten reviews;
today it is a grey blockout with a working gimmick. Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`
(branch `b5-caldera-art`, from `new-stages` 8082e99a: the public beta with the engine in). Work only here.

Read first, completely, in this order:
1. `tools/botlab/jobs/batch5/COMMON.md` (the standing orders: how Electron runs under the shared lock, git identity,
   what never to touch, the Mac mini runner protocol for bakes and picture sets).
2. `tools/botlab/jobs/batch5/REQUEST.md`, the "stages:" paragraph on the volcano: every clause is a requirement, and
   "it should be very obvious when the lava is falling or rising".
3. `tools/botlab/jobs/batch5/stages/STAGE-RULES.md`: the user's standing rules (Halyard Marina is the bar; never an empty
   stage; every structure is something; no bare boxes at eye level; mid matters most; off-limits tops; kid reach 1.8 m)
   and "It should look spectacular and still leave team ink the loudest colour on screen: lava is orange and so are inks".
4. `tools/botlab/jobs/batch5/stages/caldera/DESIGN.md` §5 (the look: the foundry's architecture building by building,
   props, surfaces, murals and signage, the far backdrop, env, day and dusk) and §3 for what the engine already draws
   (the lava's crust and seams, the stain line and the painted HIGH MARK dashes, the Surge Gauge, beacons, embers and
   steam, the stones, the Organ Pipes as riders).
5. `tools/botlab/jobs/batch5/stages/caldera/LEAD-NOTES.md` (the lead's decisions, every section; the art-phase items:
   rule 42's void past the lips from the Spillway Bridge and the Horn Step, the lavafall's side patch, the Organ Pipes'
   plain look) and `LEAD-REPORT.md` (the engine's report: the module's API and "what the art phase must know": the
   lava's palette, the lavafalls, the heat-shimmer hooks, which pieces are riders and must not be dressed with colliders).
6. `docs/STAGE-MODS.md` (the registry), then the stage's files `src/world/stages/caldera/*` and the module
   `src/game/lava*.js` (read only; the engine is not yours to change).
7. The finished example at the bar: Gulper Aquarium, `src/world/stages/aquarium/` (kit.js, arch.js, dress.js,
   floorart.js, looks.js, props.js: how a stage is dressed with batched prop types, shader faces under the ink, props
   within 8.5 cm of a face, nothing on walkable tops, no colliders) and its `stages/aquarium/LEAD-NOTES.md` (what ten
   reviews demanded at eye level), plus Halyard's `src/world/stages/halyard/`.
8. `tools/botlab/README.md`: the harness, and `tools/botlab/stage-sweep.cjs` (every structure shot at eye level into
   contact sheets: run it on this stage at LOW and HIGH, day and dusk, before you start and before you report).

## What you build
The foundry as a real place at the bar: the works' buildings (casting floor, pour floor and ladle stand, mould stacks,
the Slump shelves and hornitos, the Rim Head, Customs-style sheds, the gauge house, the Organ Pipes as industrial
columns with their step links readable as climbable), iron and brick and basalt surfaces, signage (HIGH MARK, SURGE,
the works' names), props (cranes, chains, crucibles, slag heaps, rails, lamps), murals, the far backdrop (the crater
rim, smoke, the void past the lips closed so rule 42 passes from the bridge and the Horn Step), the lavafall finished
(no seam, no patch), day and dusk with the lava's glow managed so team ink stays the loudest colour at LOW and HIGH
(prove it with ink in frame in every palette). Then the nine-pass bake for caldera and its variants
(`tools/botlab/run.sh tools/botlab/bake.cjs caldera`; stage-audit per mode says "lightmap applied"), and the stage-art
cards (`assets/stages/caldera-{day,dusk}{,-sm}.webp`) from a hero camera that shows the lava and the works.

## Hard limits
- **Play geometry is frozen**: no collider, layout, nav or rider change. Props within 8.5 cm of a face, nothing on a
  walkable top, nothing on the Pumice stones or inside the Organ Pipes' rider parts, nothing in the lava's region that
  the engine does not know about. check-maps piece counts, climb-audit, cover-map, spawn-mid, tower-check and
  lava-audit must be unchanged before and after.
- The engine's tests must still pass: lava.js, lava-audit.js (all rules incl. 42 now), lava-bots.js, lava-karp.js,
  stage-mods, world-build, check-maps every caldera variant, and two bot matches (Turf War, Zone Control) with 0 lava
  deaths.
- Performance: level with Halyard on draw calls and cpuRender at LOW and HIGH (the fixed-view probe
  `tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js`, run alternately); triangles within +15 %; and GPU time
  within 1.2× Halyard measured on the Mac mini (push the scratch branch `botlab-b5-caldera-art` with a JOB-<n>.sh that
  calls the GPU timer `tools/botlab/jobs/batch5/bluestone/gpu-time.sh` from branch botlab-b5-bluestone, see its header;
  compare only within one job).
- Pictures (JPEG < 300 KB, committed) in `tools/botlab/jobs/batch5/stages/caldera/out/art/`: the sweep sheets at LOW and
  HIGH, day and dusk; the eight places (casting floor, pour floor, the Slump, the Rim Head, the gauge, the Organ Pipes
  from the island, the lavafall from the bridge, the spawn) before / after; a rise from the shelf with ink in frame; the
  cards. Look at every picture before you claim it reads.

## Rules
Electron only through `tools/botlab/run.sh` with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab
SLOTS=3` (two other builders share this Mac: queue patiently; `WATCHDOG=900000`; run lava-audit in parts). Never
`npm start`; never touch `/Users/danielosling/Desktop/1/inkwave` or any `dist/`; never kill a process you did not start;
never the deployed relay or the live tunnel; no audio files; nothing under `.botlab/` committed. Commit small and often,
author `LilDannyy <94884334+LilDannyy@users.noreply.github.com>`, messages ending with a `Co-Authored-By:` line naming
your model. Push only `b5-caldera-art` and the scratch `botlab-b5-caldera-art`, never `new-stages` or a PR. Report in
COMMON.md's format to `tools/botlab/jobs/batch5/stages/caldera/LEAD-REPORT-ART.md` (what you built building by building,
decisions where the design left a gap, every check with its result, the performance table, the pictures, what is
unfinished). When done, message the lead's session (`Inkwave local setup`) with one paragraph: the head commit, the
sweep's result, the performance numbers, the report path. If the brief is impossible or contradictory somewhere,
message the lead before working around it. An independent reviewer judges the result against the bar, with the sweep
tool; expect to be asked to redo things.
