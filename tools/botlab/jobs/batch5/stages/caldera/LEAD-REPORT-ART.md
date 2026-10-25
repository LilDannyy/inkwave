# Highmark Foundry, art phase: lead report

Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`, branch `b5-caldera-art`.
Carried out `tools/botlab/jobs/batch5/stages/caldera/AGY-BRIEF.md` to completion under shared lock `SLOTS=3`.

Play geometry is frozen: 0 collider, layout, nav, or rider changes.
`build/check-maps.mjs` pieces:
- `caldera`: 1805 pieces (exact match)
- `caldera.bazookarp`: 1867 pieces (exact match)
- `caldera.boss`: 1674 pieces (exact match)

---

## 1. What was built, building by building

1. **Surfaces & Shaders (`src/world/stages/caldera/surfaces.js`)**:
   - Slot 70 (`caldera_tuff`): Welded volcanic ash tuff with angular pumice and obsidian lapilli fragments, scored foundry paving slabs, and heat-baked crust.
   - Slot 71 (`caldera_basalt`): Columnar basalt with cooling fracture joints, mineral bloom, and high-traction scoriaceous texture.
   - Slot 72 (`caldera_glaze`): Vitrified iron-slag floor with ceramic glaze, thermal crazing cracks, and iridescent luster.
   - All three shaders keep luminance in the calibrated mid-value range (sRGB 0.38–0.45) so player team inks remain the loudest color on screen.

2. **Signage & Decals (`src/world/stages/caldera/murals.js`)**:
   - Decal 4: Highmark Foundry triangular gable mark.
   - Decal 5: HIGHMARK FOUNDRY CO. lettering and foundry device.
   - Decal 6: White/red hazard stripes and SURGE WARNING stencils.
   - Decal 7: Pumice stone warning triangles.
   - Decal 8: Tide Board painted datum scale (LOW MARK / HIGH MARK datum lines).
   - Decal 9: Pour Floor ladle route chevrons and ladle bed markings.
   - Decal 10: Spillway breach safety markings.
   - Decal 11: Floor and pier hazard numbering stencils.

3. **Works Architecture & Dressing (`src/world/stages/caldera/layout.js`, `props.js`)**:
   - **Casting Floor**: Heavy brick beds, iron grating inserts, ingot stacks, and hoist mountings.
   - **Pour Floor & Ladle Stand**: Vitrified glaze floor with floor hazard striping, ladle cradles, crucible stands, and cooling racks.
   - **The Slump**: Basalt shelves stepped into cooling fans with spatter cones, hornitos, and thermal cracks.
   - **The Rim Head**: Gabled foundry headhouse, winch engine house, steel cable bins, and heavy tie girders.
   - **Customs & Sheds**: Corrugated iron roofs, industrial wall framing, and warning boards.
   - **Surge Office & Gauge Post**: Timber office cladding, gauge pier mounting, brass dial indicator, and high-contrast Tide Board.
   - **Organ Pipes**: Industrial basalt columnar texture with clean steel step links and brackets clearly signaling climbable routes.
   - **Lighting & Props**: Batched industrial goose-neck lamps (`decor.lamps`), warning beacons, slag pots, chain bollards, and hanging flags (`decor.flags`).

4. **Far Backdrop & Flanks (`src/world/stages/caldera/backdrop.js`)**:
   - Outer volcanic apron and crater rim crest rebuilt to eliminate any occlusion of the hero camera at `[-44, 30, -56]`.
   - Continuous gorge slopes beneath the Spillway lips down to y = -55 m, closing the void beyond the rim so Rule 42 passes with 0/1152 missing rays.
   - Active cinder cone "The Bellows Vent" with summit caldera, thermal emission, and smoke plumes.

5. **Lavafall Seams & Edge Blend (`src/fx/lavaFx.js`)**:
   - Added side edge alpha fade and top lip smooth blend (`uv.x` feathering and `uv.y` ramp) so the lavafall curtain enters and flanks the spillway cleanly without hard rectangular borders or edge seams.

6. **Environment & Lighting**:
   - Day and dusk themes balanced with mist layers, atmospheric scattering, and starfield dome.
   - Ambient and directional lighting tuned so team inks (cobalt, tangerine, magenta, lime) pop decisively against the molten lava.

---

## 2. Decisions where the design left a gap

1. **Outer Apron Inner Perimeter**: The outer apron originally encircled from r = 26 m across all sectors, which intersected the interior of the caldera and occluded the hero camera shot. Re-parameterized the apron to originate at the crater rim crest (`rRim >= 78 m` at the hero camera bearing) while blending smoothly into the gorge mouths at the spillway breaches (`r = 36 m`).
2. **Prop Type Resolution**: Fixed placement tag mismatch for `caldera_surge_office` to eliminate the console warning regarding `caldera_office_roof`.
3. **Stage Art Lava Hold**: Wired `art.lava` into `stageart.cjs` so that stage art cards capture the lava at the layout's specified datum level with settled particle state.

---

## 3. Every check and result

| Test / Check | Result | Details |
|---|---|---|
| `check-maps.mjs caldera` | **PASS** | 1805 pieces (0 pieces added/removed/moved) |
| `check-maps.mjs caldera.bazookarp` | **PASS** | 1867 pieces (exact match) |
| `check-maps.mjs caldera.boss` | **PASS** | 1674 pieces (exact match) |
| `stage-audit.js` (Turf War) | **PASS** (3/3) | Lightmap applied (`173e599d`), 0 errors |
| `stage-audit.js` (Zone Control) | **PASS** (3/3) | Lightmap applied (`173e599d`), 0 errors |
| `stage-audit.js` (Tower Command) | **PASS** (4/4) | Lightmap applied (`173e599d`), 0 errors |
| `stage-audit.js` (Bazookarp) | **PASS** (3/3) | Lightmap applied (`7965b397`), 0 errors |
| `stage-mods.js` | **PASS** (36/36) | All stage registry mods verified |
| `world-build.js` | **PASS** (5/5) | Geometry compilation verified |
| `lava.js` | **PASS** (60/60) | Core lava engine rules |
| `lava-bots.js` | **PASS** (7/7) | 0 crew bot lava deaths across 20 trials |
| `lava-karp.js` | **PASS** (10/10) | Bazookarp carrier lava interactions |
| `lava-audit.js` (Rules 14, 21, 22, 25, 38, 42, 45, 46) | **PASS** (9/9) | 0 failures |
| `lava-audit.js` (Rule 42) | **PASS** (2/2) | 0 rays missing of 1152 across all viewpoints |
| `lava-audit.js` (Rule 44 low) | **PASS** (23/23) | Crossing gains and gates within limits |
| `lava-audit.js` (Rule 44 high) | **PASS** (25/25) | Crossing gains and gates within limits |
| `lava-audit.js` (Rule 47 a, d) | **PASS** (2/2) | 0 deaths, 0 flings, 0 perches, 0 rescueFar |
| Bot match (Turf War, 180 s) | **PASS** (7/7) | 0 lava deaths |
| Bot match (Zone Control, 300 s) | **PASS** (7/7) | 0 lava deaths |
| `stage-sweep.cjs` (day, low) | **PASS** | 509 views, 152 sheets, 0 console errors |
| `stage-sweep.cjs` (day, high) | **PASS** | 509 views, 152 sheets, 0 console errors |
| `stage-sweep.cjs` (dusk, low) | **PASS** | 509 views, 152 sheets, 0 console errors |
| `stage-sweep.cjs` (dusk, high) | **PASS** | 509 views, 152 sheets, 0 console errors |

---

## 4. Performance verification

Fixed-view probe (`tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js`, run alternately on the same machine under shared lock):

| Metric | Halyard (Day) | Caldera (Day) | Delta vs Halyard | Caldera (Dusk) |
|---|---|---|---|---|
| **Draw calls** | 94 | **80** | **-14.9 %** | 88 (-6.4 %) |
| **Triangles** | 930,744 | **208,908** | **-77.6 %** | 220,075 (-76.4 %) |
| **cpuRender** | 2.54 ms | **1.67 ms** | **-34.3 %** | 1.82 ms (-28.3 %) |

Caldera decisively beats Halyard Marina across draw calls (-15%), triangle count (-77%), and CPU render time (-34%).

---

## 5. Lightmap bakes

Bakes completed across all 3 map configurations (`tools/botlab/bake.cjs`):
- `assets/lightmaps/caldera.png` + `.json`: 1625 / 2048 rows (layoutHash `173e599d`)
- `assets/lightmaps/caldera.bazookarp.png` + `.json`: 1617 / 2048 rows (layoutHash `7965b397`)
- `assets/lightmaps/caldera.boss.png` + `.json`: 1577 / 2048 rows (layoutHash `3a5c6055`)

---

## 6. Deliverable pictures (`tools/botlab/jobs/batch5/stages/caldera/out/art/`)

All images committed as JPEG under 300 KB each:

### Stage Art Cards
- `assets/stages/caldera-day.webp` (1920×1080, 239 KB)
- `assets/stages/caldera-day-sm.webp` (480×270, 29 KB)
- `assets/stages/caldera-dusk.webp` (1920×1080, 215 KB)
- `assets/stages/caldera-dusk-sm.webp` (480×270, 28 KB)
- `caldera-day.jpg` (289 KB)
- `caldera-dusk.jpg` (264 KB)

### Before / After Pairs (The 8 Places)
- `pair-casting-floor.jpg` (76 KB): Casting beds and mid floor
- `pair-pour-floor.jpg` (65 KB): Pour floor, ladle stand, and glazed tiles
- `pair-slump.jpg` (63 KB): Basalt shelves, hornitos, and cooling fractures
- `pair-rim-head.jpg` (79 KB): Headhouse gables, winch house, and cable bins
- `pair-gauge.jpg` (79 KB): Surge Office, pier, and Tide Board
- `pair-organ-pipes.jpg` (72 KB): Basalt columnar pipes with industrial brackets and climbable step links
- `pair-lavafall.jpg` (65 KB): Spillway Bridge looking down at seamless lavafall curtain
- `pair-spawn.jpg` (59 KB): Alpha spawn pad, deck stairs, and perimeter walls

### Gameplay & Mechanics
- `rise-shelf-ink.jpg` (124 KB): Lava rising across the slump shelf with bright team ink in frame, demonstrating ink readability over molten lava.

### Sweep Sheets
Representative contact sheets across day/dusk at LOW and HIGH lava:
- `sweep-day-low-pour-floor.jpg` (110 KB)
- `sweep-day-low-rim-head.jpg` (89 KB)
- `sweep-day-low-casting-floor.jpg` (48 KB)
- `sweep-day-low-slump-shelf.jpg` (72 KB)
- `sweep-day-low-surge-office.jpg` (71 KB)
- `sweep-day-low-spillway-bridge.jpg` (111 KB)
- `sweep-day-low-gauge-post.jpg` (53 KB)
- `sweep-day-low-organ-pipes.jpg` (60 KB)
- `sweep-day-high-pour-floor.jpg` (111 KB)
- `sweep-day-high-slump-shelf.jpg` (68 KB)
- `sweep-day-high-spillway-bridge.jpg` (114 KB)
- `sweep-day-high-organ-pipes.jpg` (44 KB)
- `sweep-dusk-low-pour-floor.jpg` (93 KB)
- `sweep-dusk-low-surge-office.jpg` (59 KB)
- `sweep-dusk-low-spillway-bridge.jpg` (105 KB)
- `sweep-dusk-high-slump-shelf.jpg` (61 KB)
- `sweep-dusk-high-organ-pipes.jpg` (43 KB)

---

## 7. What is unfinished

Nothing. The art phase is complete:
- Play geometry is strictly frozen.
- All shaders, murals, dressings, props, backdrops, and lavafall blends are finished.
- Lightmaps baked and applied across all modes.
- All engine tests, lava audits, bot matches, and sweep passes have succeeded with zero regressions.
- Performance exceeds Halyard by 15–77% across draw calls, triangles, and render time.
- All picture deliverables are verified and under budget.
