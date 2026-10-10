# Bluestone Junction — engine phase, first half: the era engine's world and the jump (LEAD-REPORT)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. Merged `new-stages` (5546ea0d) first (82d191da; the one
conflict, `tools/botlab/offscreen-boot.cjs`, took new-stages' `PAGEQ`). All local (the Mac mini is down), one Electron
instance at a time under the shared lock. ENGINE.md §6 steps 1–5 and 7–9 are built through the stage-module registry;
**no shared engine file was edited** (level.js, paint.js, nav.js, levelMaterial.js, props.js, minimap.js,
environment.js, main.js, match.js, netmatch.js, hud.js are untouched): every ENGINE hook-in is served by a registry hook,
as docs/STAGE-MODS.md says. The only shared doc touched is docs/NET.md (one paragraph).

## 1. What was built, step by step (the user: "a full map effect plays that simulates going forward to the current time,
which changes how the map looks and opens up new routes … then … 3000s … adds new areas"; Tartar "an old telephone")

**Step 1, the data and the Level.** `era.js`: `ERA_DEFAULT` is the union; `?era=n` (PAGEQ='era=2') no longer filters
the layout — the engine starts in era n and never jumps. `src/game/eras.js` registers the `eras` / `eraGroup` block
fields (presence: era 1 = 1, 2 = 2, 3 = 4, shared 0; `presenceAll` 7), so face hiding, grounded bottoms and bevels ask
only blocks present in every era of the face's block. Groups are keyed `eraGroup + :a/:b` by the side of the block's
centre; r_g = distance from Tartar (0, 0) to the centre of the members' union AABB. Every vertex carries
`aEra = (mask, r_g)` (registry `geomAttrs`). On the Z as built: **52 groups**; jump 1 changes **4 / 4 groups per half,
26 blocks**; jump 2 **22 / 22, 130 blocks**; era-only blocks **21.9 %**; 156 era blocks of 712; **R_max 84.5 m + 2 →
done = J + 3.96 s** (the Z's numbers replace ENGINE's X numbers). `src/world/eras-data.js` (three-free) gives
check-maps T2: overlaps only between pieces that share an era; `bluestone#1/#2/#3` (568 / 590 / 700 pieces); rules 3–7;
the appear check (19–20, 19b as restated: blocked space must be an old solid of the same group; a piece on a remaining
roof must cover it ≥ 0.08 m) and the vanish check (27) in the turf build and the tower / bazookarp / boss / zones
variants; the 2 m strip test per era (0 strips over 25 m in each era; a collision-only block counts as cover). The
checks catch planted violations (an era-3 deck 1 m over Swimston, a 9 m group, a 3.5 m vanishing deck, the forecourt
stripped of cover: a 62 m strip).

**Step 2, paint.** Per cell `cellPres` = its face's eras minus the eras of any block burying its sample point; per group
its own faces' cells and the cells it buries, re-tested at its flip against the blocks as they stand (mid-jump the city
is part one era, part the next); `apply(e)` recounts in one pass. Turf: **87,974 / 90,362 / 106,486 cells** in eras
1 / 2 / 3. A splat on an absent or guarded block claims nothing (the registry's block gate, `inkOk(b, et)` with the
painter's time). Appearing pieces are cleared (grid + atlas) at the warning; vanished pieces' faces are zeroed at
done + 1 s; shared ground keeps its ink.

**Step 3, nav.** Three `NavGraph`s (one per era's solidity) merged into one union graph: nodes by (cell, height ±0.15),
edges keyed (from, to, type, cost) with `e.em`; per-era `valid` / `exitable` / `validIds` / wet / overWater columns;
`nav.edgeMask` = the era in force; `edge()` honours the mask. **5,952 nodes** (valid 4,808 / 4,958 / 5,844), 36,602
edges; merge **6.6–16 ms**. Union path costs equal fresh per-era graphs on 200 random pairs per era: **worst 0 %**.
Degrayling Lane: Swimston → the quay at mid-leg **21.96 → 13.16** from era 2. The Halo's nodes valid only in era 3.

**Step 4, load.** Nav ×3 **599–700 ms** in seven loads on this loaded Mac (one outlier run 793; the test judges the lower
of two builds: 667), merge 7–16 ms, paint masks 28–52 ms, era meshes 5–21 ms. World build 950–1,560 ms with the engine,
380–700 without (the union, all solid). **Match loadMs 7,238 / 7,489 ms** (eras-shots, start → playing). Under 700 ms,
so no dirty-region rebuild (4b) was built; it is the lever if the Mac mini's numbers say otherwise.

**Step 5, looks.** One level mesh per era mask present (1, 3, 4, 6), built while every block is solid, shown only in
its eras (both eras' during a jump; the coming era's from the warning, collapsed). The level-shader extension
(`src/fx/eraFx.js`): each fragment's era (shared ground by its side of the front, a piece by its own flip); the era
tint and the re-skins (granite → asphalt → pavers, planks → glasstile) on the bare surface; the mural masks
(`uMurEra`); the AO channel of that era (`dot(rgb, eraOneHot)`); the 0.3 s dissolve; the sepia flicker on what will
go; the 4 s white-gold pulse on what is new; the front's white-gold line with minute ticks. Era meshes and era prop
buckets cast shadows through depth materials that collapse absent pieces and sit out the GTAO pass while both eras
are up. **No ghosts: the frame where an absent piece stands is pixel-identical (max diff 0) to the frame with its mesh
removed from the scene, GTAO on, at rest (the era-1 crates in era 2) and mid-jump after the flip (the booking
office).** Draw calls from the spawn camera on high (shadows, GTAO): **96 / 99 / 97** in eras 1 / 2 / 3 and **115**
mid-jump (budget 334 / 390); 162–171 k triangles.

**Step 7, props and backdrop.** Era props are tagged buckets (`bucketTag 'e' + mask`, an era material clone and depth
material): the era-slot kit's tram (a cable tram / a tram / a float-tram over one shared collider: **exactly one tram
type visible per era**), lamps (gas lamp / street light / light mast) in the kerb planters, today's glass towers and
the 3000s' spires on three roofs, the 3000s' light lattice over the dome; ≤ 4 materials per era mask. One skyline per
era (`backdrop.js` `sets: {1, 2, 3}`: the 1880s' terraces, cathedral, shot tower, chimneys; today's glass towers and the
gold crown; the 3000s' arcologies with light seams, sky-bridges and the storm bank) swapped by the horizon run (a
radial clip from R_max outward over 1.3 s as the front leaves the arena). Tartar is three animated parts.

**Step 8, the runtime (StageEras).** The schedule is a pure function of the host stage clock: Turf War 3:00 jumps at
60 / 120 s, 1:30 at 30 / 60, the five-minute modes (and Bazookarp) at 100 / 200 (never in overtime), Boss Battle fixed
in era 2 (applied in `def.match`, before BossMode), Practice every 60 s with the rewind 3 → 1, the menu backdrop every
40 s, `?era=n` held. Events: pre-bell (J − 20: one distant ring, the chip's small countdown, the clock hands start),
warn (J − 10: Tartar's ring + the two nearest kiosks, "TIME JUMP / 1880s → TODAY in 10", holograms of every appearing
block in white-gold, the wire beads, appearing faces cleared, the bots' danger layer), rings at J − 5, −3, −2, the
pickup at J − 1 (receiver, dial, the beam, Tartar's credited line), J (the swell, a 0.25 shake, the curtain of clock
light riding the front with drifting Roman numerals and gears — brass in jump 1, pearl in jump 2 and the rewind — the
front loop, the time-lapse sky: sun swing 60°, clouds ×20, exposure untouched), each group's flip at J + r_g / 25
(collision, looks, ink guard; `era:flip { group, on, off, r }`), done (nav era, danger layer released, bots replan,
minimap base, "NEW ROUTES OPEN" / "NEW AREAS!" / "BACK TO THE 1880s", fresh nodes ×2 as paint goals for 30 s), the
look settled at done + 0.7 (the new theme's uniforms + one PMREM rebuild: 0.6–0.9 ms, not a full setTheme), the
vanished faces zeroed at done + 1. Shove (straight up when the feet are within 0.8 m under the top; else 16 directions
× 0.5–4 m over floor; else the nearest valid node standing now; `stats.eraShoves`), rescue (over water, or on a roof
with nothing walkable within 3.4 m below), devices on a vanishing piece / inside an appearing one destroyed
(`S.crushIn` first; until `G.deploy.crushIn` exists, the module-private walk of `G.subs.items`). Sounds synthesized in
`src/audio/sfx-eras.js` (era_bell, era_ring, era_kiosk, era_strike, era_pickup, era_swell, era_front, era_pop).

**Step 9, HUD and maps.** The era chip under the clock (docked under Zone Control's / Tower Command's HUD in those
modes): the three names with the current one lit, a bar to the next jump, "TODAY in 20" from the pre-bell, the big
countdown 10 … 1 with Tartar's ringing phone glyph, "TIME JUMP!" during the jump. Callouts as above. The minimap's
base per era (three rasters, built in idle time, swapped at done) and the outlines from the warning to done (white-gold
dashes appearing, warm-grey hatching vanishing). The thumbnail: era 1 as usual, the 78 later pieces dashed in the
layout's colours. The TAB map (the diorama) shows the live scene, holograms included. Colours: only `eras.colors`
(#f4e9c8 / #a9a49a) and white light — 0 cyan and 0 amber pixels in the outline test.

**Names.** Flounders Street Station everywhere: DESIGN.md's 24 Flathead / FLATHEAD mentions and `surfaces.js` now read
Flounders (LEAD-NOTES keeps the retirement note; `concept-play.md`, the round-A concept, is left as written).

## 2. Decisions where the contract left a gap
1. **The tram block became collision-only** (`hidden: true, paint: false`; its top was a roof and never turf): the
   era-slot kit as DESIGN §2.10 describes it, so one tram look shows per era. Collision, nav and turf are unchanged;
   the strip test counts collision-only blocks as cover. The only data change to the frozen blockout.
2. **`nav.validIds` is per era** (docs/STAGE-MODS.md suggests the union for ZonePlan's ring). The bots' random goal
   picks read `validIds` without a validity test, so a union list would send them to the Halo in era 1. Zone rings sit
   on ground no era changes (rule 15), so they lose nothing.
3. **The rescue / shove fallback picks only a node whose floor stands now** (the nav keeps the era before until done:
   the test caught a rescue back onto a vanished garden node).
4. **The coming era's meshes are drawn collapsed from the warning** (out of the GTAO pass) and every era program is
   compiled at load by one real frame, so no shader compiles mid-jump (a 900 ms compile at J before the fix).
5. **The look settles without `setTheme`** (risk 10): uniforms + one PMREM rebuild at done + 0.7. Instant applies
   (start, seek, debug) still use `setTheme`.
6. **The guard is per block** (a member of a changing group that exists in both eras keeps taking ink).
7. **Kiosks:** the two nearest the camera ring aloud (six full gongs cost ~1,000 audio nodes in one frame).
8. **Callout texts** for the rewind ("THE CLOCK RUNS BACK", "Back to the beginning. Again.") are mine.
9. **Lamps stand in the kerb planters** (roof tops nobody stands on), so they need no colliders.

## 3. Online and bots
Nothing new on the wire: the state is a pure function of the stage clock on every screen, a clock snap calls
`seek` (`era:set`); `R.splatTime` stamps field 15 only from J − 1 to done + 1; each screen shoves / rescues / pops its
own (docs/NET.md). **No two-client test yet** (net-eras.cjs is step 11). Bots: the danger layer from the warning
(+40, never a goal; bots standing in it drop their goal), replans at done, fresh nodes ×2 for 30 s (`goalWeight`).
Two local all-bot Turf Wars through both jumps: turf 40.2 / 20.4 % and 35.2 / 31.1 %, **stuck 0.1 % / 0 %**, no console
error besides the known "no lightmap". eras-bots.js and the sweeps are step 10 (not done).

## 4. Tests (local, final code; logs in `tools/botlab/jobs/batch5/bluestone/local-logs/engine/`)
- `eras-world.js` **19/19** (parts 1–5; part 5: halyard / calamari / treehills build with the level program key
  `inkwave-level-v8`, no aEra, no presence).
- `eras-look.js` **9/9**. `eras-hud.js` **7/7**.
- `eras-jump.js` **15 checks** (the roof branch of the rescue added last): the final full run is **14/15** (only the
  frames check failed); an earlier full run was 14/14 (before the roof check), the last subset run 3/3. The
  frames check (no frame > 50 ms from J − 0.5 to done + 1.5) passed at **max 10.3 ms** on a quiet machine (no-jump
  baseline 3.1 ms) and at 22.7 ms in another run; it failed in two runs on the loaded Mac — one 625 ms and one 58.6 ms
  frame — while the same runs' no-jump baselines had 442–649 ms frames; the era update never took more than 8.3 ms
  (1.2 ms when quiet). The recurring loaded-machine frame near J + 1.6 allocates ~3.6 MB outside the era update (the
  minimap's ordinary ink redraw after the flips bump the paint version, I believe; unproven). Flaky here: re-run on
  the Mac mini.
- check-maps: every stage ok except halyard's half[41] ramp 25.7° (also on new-stages; not mine).
- stage-mods **36/36**, world-build **5/5**, ink-wipe **8/8**, movers **17/17**, pods **39/39**, stage-audit halyard /
  calamari / treehills **3/3** each (lightmap applied).
- Each era test fails without this work (no `G.eraWorld` / `match.eras`; the toy-level presence check fails untagged).
- No balance sets (the lead's consolidated pass).

## 5. Pictures (`out/engine/`, JPEG 49–131 KB)
`era{1,2,3}-spawn`, `-circus`, `-top`; `jump-swimston-J-10`, `jump-phone-J+0`, `jump-swimston-J+1.5`, `-J+3`,
`-done+1`; `jump2-circus-J-5`, `-J+0.6`, `-done+1` (the Halo from the knee); `vanish-halo-inked-before`,
`vanish-halo-after-flip`; `appear-bridge-before`, `appear-bridge-after`; `minimap-era{1,2,3}`, `minimap-warn-jump1/2`;
`gtao-probe-era1/2`. Looked at: the warning reads (chip, callout, bells, beads, the cable tram, gas lamps); the front's
band and the curtain read at J + 1.5 with today's towers rising behind; the Halo inked then gone in the rewind; the
minimap outlines. Weak spots: the wire beads float without wires (blockout), the 0.3 s dissolve looks blocky on props,
the Swimston camera is half blocked by a news kiosk.

## 6. Commits; files
2b0dd6c1 (static rules), f00a30c2 (the engine), aed8aff2 (eras-world), 81f88b12 (runtime fixes, eras-look, eras-jump),
67444e02 (eras-hud), eb52adff (curtain), c0977466 (Flounders), 2c3cef62 (NET.md, part 5), 4d70601a; scratch 06569ead
(pictures), 729fc6d9 (logs), c536e29c (the roof-rescue check), d5afd821 and the next commit (this report). Files: new `src/fx/eraFx.js`, `src/audio/sfx-eras.js`,
`tools/botlab/tests/eras-{world,look,jump,hud}.js`; the stubs `src/game/eras.js`, `src/world/eras-data.js` replaced;
stage files `era.js`, `layout.js` (tram collision-only, `ERAS.source`), `props.js`, `backdrop.js`, `surfaces.js`;
docs/NET.md (one paragraph, [b5-eras]).

## 7. Unfinished, flaky or uncertain
- **Not in this phase:** step 6 (`W.bakePasses()` is implemented, never baked), 10 (eras-bots.js, sweeps, H16b),
  11 (net-eras.cjs: two clients, late join, host change), 12 (eras-modes.js: zones / tower per era, the era-3 BossNav
  record, Bazookarp H21 against a stub), 12c (no stage murals exist yet to probe `uMurEra`).
- The frames check is flaky on the loaded Mac (above). Nav ×3 sits near the 700 ms line here (599–793 ms).
- The roof rescue is tested only by a direct call (no garden-on-roof on the Z). The striker clock's `era_strike` exists but
  nothing plays it (no striker prop on the Z). Era ambiences and the end-of-match cosmetic (§3.10) are not built.
- A re-skinned face loses its mural (none today; DESIGN's mural 8 was on the X's carriageway).
- `stats.eraShoves` is not in match.cjs's RESULT_JSON (the two matches can't show it).
