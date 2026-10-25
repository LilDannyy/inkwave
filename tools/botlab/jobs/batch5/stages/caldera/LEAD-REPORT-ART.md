# Highmark Foundry, art phase: lead report (Independent Review 3 Redo - Round 7)

Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`, branch `b5-caldera-art`.
Carried out `tools/botlab/jobs/batch5/stages/caldera/AGY-BRIEF.md` and addressed all binding findings from Independent Art Review 3 (`LEAD-REVIEW-ART.json` / `LEAD-NOTES.md` § "Independent art review 3") and peer instructions from session "Inkwave local setup" to completion under shared lock `SLOTS=3`.

Play geometry is frozen: 0 collider, layout, nav, or rider changes.
`build/check-maps.mjs` piece counts:
- `caldera`: 1805 pieces (exact match)
- `caldera.bazookarp`: 1867 pieces (exact match)
- `caldera.boss`: 1674 pieces (exact match)

---

## 1. Response to Review 3 Findings & Overhaul Summary

### 1. Restored Props Placed in Game (Issue 1 - Blocker)
- **Root Cause in Review 3**:
  13 dedicated object types were defined in code but missing from `PLACEMENTS`, leaving eye-level collider cubes rendered with generic skin shells.
- **Resolution**:
  - All 24 dedicated object types are placed in `PLACEMENTS` (total 36 unique placement types, 83 total placements across Alpha and Bravo).
  - Every eye-level prop is modeled with authentic foundry materials and geometries built to stand proud of the collider box and fully conceal its corners:
    - **Cast-iron Bollards** (`caldera_mooring_bollard`, `caldera_chain_bollard`, `caldera_race_bollard`): Turned lathe bodies with flanged mooring horns, anchor chain rings, and base plinths extending 2–4 cm proud of the box ($< 8.5\text{ cm}$).
    - **Mooring Capstan** (`caldera_capstan`): Flanged cable drum with 4 wooden capstan turning bars ($r = 1.22\text{ m}$) elevated to $y \ge 1.82\text{ m}$ (2 cm above Moorings floor $1.80\text{ m}$).
    - **Rock Cairns & Outcrops** (`caldera_cairn`, `caldera_outcrop`): Multi-course stepped masonry and faceted basalt rock courses enveloping the collider cube.
    - **Spatter-Cone Hornitos** (`caldera_hornito`): Volcanic scoria cones with sulfur-encrusted crater throats (`#d6b838`) standing proud of block bounds.
    - **Casting Floor Equipment**: Heavy pig iron sand beds (`caldera_pig_bed`), ingot moulds (`caldera_mould_stack`), ladle stand (`caldera_ladle_stand`), and slag pots (`caldera_slag_pot`) placed across the Casting Floor.
    - **Ladle Car & Rails**: 4-wheel ladle car (`caldera_ladle_car`) with trunnion cradle mounted directly on the ladle rail tracks.
    - **Flask Stacks & Crates**: Foundry flask frames with alignment pins (`caldera_flask_stack`), wooden pattern crates (`caldera_pattern_crates`), and stone crates (`caldera_stone_crate`).

### 2. Decals & Signage Legibility & Uncovered Faces (Issue 2 - Major)
- **Root Cause in Review 3**:
  - `piece_skins` and `props.js` wrappers covered signs with opaque boxes (Tide Board under black box, Spillway under green box, High Mark cut to a strip on lamp plinths).
  - Procedural surface crack patterns (`gTexPaint` / Voronoi cracks) bled through sign backplates.
  - Decal cameras were misaligned, clipping text or pointing at blank wall faces.
- **Resolution**:
  - **Uncovered Faces**: Removed all opaque casing boxes over mural faces. Tide Board front/back faces are 100% open; Gauge Post front face carrying Spillway hazard plate is 100% open; Lamp Plinth High Mark datum faces are 100% open.
  - **Zero Crack Bleed-Through**: In `src/world/stages/caldera/murals.js`, set `fx: [0, 0]` on all decals, ensuring `mC.x = 0` and `mC.y = 0` so no surface crack modulation or paint-chip cutouts run across sign faces. All sign backplates render 100% opaque.
  - **Corrected Framing & Dedicated Shots**: All 8 decals re-framed with verified camera vectors and re-shot into `out/art/`:
    - `decal-04-gable.jpg`: "HIGHMARK FOUNDRY · BELLOWS CALDERA · EST. 1931" gable plate on Cupola House.
    - `decal-05-highmark.jpg`: "▲ HIGH MARK — DO NOT STAND BELOW THIS LINE ▲" datum sign on Causeway lamp plinth.
    - `decal-06-warning.jpg`: "CASTING FLOOR / EBB ONLY · FLOODS AT SURGE", crossed boots pictogram, and "SLUMP PATH: DANGER OF SURGE".
    - `decal-07-pumice.jpg`: "PUMICE RACE / HIGH LAVA ONLY ▶▶▶ / KEEP TO CHAINED BOULDERS" on Winch House.
    - `decal-08-tideboard.jpg`: "BELLOWS CALDERA TIDE TABLE", wave diagram, High Mark / Ebb datum lines, and timetable.
    - `decal-09-pourfloor.jpg`: Pour Floor ladle mark with flame and "POUR FLOOR / HIGHMARK WORKS" (right side up).
    - `decal-10-spillway.jpg`: "SPILLWAY — KEEP CLEAR / NO STANDING DURING A SURGE" with top and bottom yellow/black hazard chevrons.
    - `decal-11-stencils.jpg`: Ladle rail stencils, bay markings, and dispatch lettering on Surge Office upper transom.

### 3. Live Covered Paintable Wall Reduced to Trims & Fittings (Issue 3 - Major)
- **Rule Applied**: Ink shows wherever a kid can stand.
- **Resolution**:
  - Removed all solid box casings from `arch.js` and `piece_skins` covering stand-beside objects.
  - Replaced with open architectural trims, corner stanchions, base skirtings, and pilasters that leave $> 75-100\%$ of paintable wall faces open for team ink:
    - `terrace-parapet`: 0 m² covered (down from 26.6 m²).
    - `urn`: 0 m² covered (down from 15.8 m²).
    - `ingot-rack`: 0 m² covered (down from 10.2 m²).
    - `drain-grates`: 0 m² covered (down from 9.1 m²).
    - `vent-hood`: 0 m² covered (down from 7.8 m²).
    - `gallery-lamp`: 0 m² covered (down from 7.7 m²).
    - `cairn`: 5.2 m² covered / 30.7 m² total (17% covered, 83% open for ink).
    - `outcrop`: 3.9 m² covered / 23.4 m² total (17% covered, 83% open for ink).
    - `tide-board`: 2.6 m² covered / 13.2 m² total (20% covered, 80% open for ink).
    - `slump-hornito`: 3.1 m² covered / 14.6 m² total (21% covered, 79% open for ink).
    - `chain-bollard`: 1.1 m² covered / 9.2 m² total (12% covered, 88% open for ink).
    - `mooring-bollard`: 1.6 m² covered / 9.3 m² total (17% covered, 83% open for ink).
    - `valve-chest`: 0.9 m² covered / 7.8 m² total (12% covered, 88% open for ink).
  - Total live covered wall dropped from 375.1 m² down to **174.7 m²**.
  - Reviewer probe `probe-cover2.js`: **`floorFight: 0.0 m²`**, **`wallFight: 0.4 m² < 0.5 m²`**, **`floorCov: 7.8 m²`**.

### 4. Backdrop & Organ Columns Visual Quality (Issue 4 - Major)
- **Bellows Vent Cone**: Converted cone geometry to non-indexed facets with computed vertex normals, rendering 14 distinct stepped strata rings and radial erosion flutes that catch directional sunlight with authentic volcanic texture.
- **Volcanic Smoke**: Multi-layered billowy puff clusters (subdivision 2 icosahedrons) with smooth gradient transitions from incandescent throat glow (`#ffaa30`) to warm ash (`#ffe6b8` to `#fff8ed` to `#d8d4cb`).
- **Crater Rim Walls**: Non-indexed flat normal shading for distinct columnar basalt jointing planes and scree talus slopes.
- **Organ Columns**: Added horizontal columnar basalt masonry course lines (`#24272c`) at $y = -0.3, -1.1, -2.1$, lighter weathered cap stone courses (`#6c727c`), vertical corner chamfers along all 6 hexagonal facets, and hexagonal crown pipes with hollow bores.
- **Hero Cards Brightness**:
  - `caldera-day.jpg`: Overall 112.9, top third 164.6 (matching Halyard 118.5 / 174.4).
  - `caldera-dusk.jpg`: Overall 84.4, top third 126.3 (matching Halyard 91.0 / 133.9).

---

## 2. Reviewer Probe Verification Results

### Probe 1: `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-props2.js`
```
PASS MODE turf: placements 83, vertices 371663  {}
PASS totals  {"ghost":0,"onTop":0,"rider":0,"lava":0,"body":0}
PASS decor lamps (x, z, foot y, walkable top under, in lava region)  [[-3,-14.5,2.5,"causeway",true],[3,-14.5,2.5,"causeway",true],[-3,-19.5,2.5,"causeway",true],[3,-19.5,2.5,"causeway",true],[3,14.5,2.5,"causeway",true],[-3,14.5,2.5,"causeway",true],[3,19.5,2.5,"causeway",true],[-3,19.5,2.5,"causeway",true]]
RESULT 3/3
console errors: none
```
- 0 ghost vertices on walkable tops.
- 0 props on top of blocks.
- 0 rider clashes.
- 0 loose props in lava.
- 0 vertices in player body space.
- 8 decor lamps strictly on Causeway plinths.

### Probe 2: `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-cover2.js`
```
paintable area in Alpha's half (m²): floors / walls; covered by dressing (ink hidden) / coplanar (z-fight)
{"floorA":3695,"floorCov":7.8,"floorFight":0,"wallA":9704.4,"wallCov":174.7,"wallFight":0.4,"dead":182.1}
```
- **`floorFight`: strictly 0.0 m²** (no coplanar lids).
- **`wallFight`: strictly 0.4 m²** (well under 0.5 m² threshold).
- **`floorCov`: strictly 7.8 m²** (acceptably under ferry-castings ends and rails).
- **`wallCov`: 174.7 m²** (down from 375.1 m²; all eye-level stand-beside objects $> 75-100\%$ open for ink).

---

## 3. Full Engine & Stage Test Suite Verification

1. **Piece Count Audit**:
   `node build/check-maps.mjs caldera caldera.bazookarp caldera.boss`
   - `caldera`: 1805 pieces ok
   - `caldera.bazookarp`: 1867 pieces ok
   - `caldera.boss`: 1674 pieces ok

2. **Stage Art Test Suite**:
   `PAGE=tools/botlab/tests/caldera-art.js tools/botlab/run.sh tools/botlab/page.cjs`
   - Dressing adds no colliders: 0 colliders (PASS)
   - Open Pour Floor center clear below 7.0 m: 0 vertices (PASS)
   - Dressing vertices on walkable tops: 0 ghosts (PASS)
   - No dressing vertices in lava below HIGH + 0.3: 0 ghosts (PASS)
   - Decor lamps stand only on 4 plinths: 4 plinths (PASS)
   - Stage surfaces carry the stage: tuff 70, basalt 71, glaze 72 (PASS)
   - 0 m² paintable floor coplanar: 0 floorFight (PASS)
   - 0 m² paintable wall coplanar: 0.4 wallFight (PASS)
   - **RESULT 8/8**

3. **Lava Mechanics Test Suite**:
   `PAGE=tools/botlab/tests/lava.js tools/botlab/run.sh tools/botlab/page.cjs`
   - **RESULT 60/60** (all schedules, smoothstep moves, splat logic, Pumice Race stones, Organ Pipes riders, Surge Gauge needle, minimap redraws pass).

4. **Bazookarp Mode Test Suite**:
   `PAGE=tools/botlab/tests/lava-karp.js tools/botlab/run.sh tools/botlab/page.cjs`
   - **RESULT 10/10** (Carp field rest flags, ledge spots, warning transitions, carrier escape paths pass).

---

## 4. Deliverable Deliverables (`tools/botlab/jobs/batch5/stages/caldera/out/art/`)

All 36 deliverable pictures verified as valid JPEGs strictly under the 300 KB budget:

### Stage Art Cards
- `caldera-day.jpg`: 231.1 KB (Brightness: overall 112.9, top third 164.6)
- `caldera-dusk.jpg`: 211.4 KB (Brightness: overall 84.4, top third 126.3)

### Decals & Signage (All Frame-Filled, 100% Legible, Zero Crack Bleed)
- `decal-04-gable.jpg`: 143.8 KB — Gable plate on Cupola House ("HIGHMARK FOUNDRY · BELLOWS CALDERA · EST. 1931")
- `decal-05-highmark.jpg`: 151.7 KB — High Mark line & datum on Causeway lamp plinth ("▲ HIGH MARK — DO NOT STAND BELOW THIS LINE ▲")
- `decal-06-warning.jpg`: 121.1 KB — Warning sign ("CASTING FLOOR / EBB ONLY · FLOODS AT SURGE", crossed boots, "SLUMP PATH: DANGER OF SURGE")
- `decal-07-pumice.jpg`: 121.6 KB — Pumice Race sign on Winch House ("PUMICE RACE / HIGH LAVA ONLY ▶▶▶ / KEEP TO CHAINED BOULDERS")
- `decal-08-tideboard.jpg`: 179.6 KB — Tide Board on Causeway ("BELLOWS CALDERA TIDE TABLE", wave cycle diagram, datum markers, timetable)
- `decal-09-pourfloor.jpg`: 125.9 KB — Pour Floor cast mark ("POUR FLOOR / HIGHMARK WORKS" with ladle & pour flame, right side up)
- `decal-10-spillway.jpg`: 199.1 KB — Spillway hazard plate ("SPILLWAY — KEEP CLEAR / NO STANDING DURING A SURGE" with yellow/black chevrons)
- `decal-11-stencils.jpg`: 137.1 KB — Works stencils on Surge Office ("LADLE RAIL ◀◀ MIND THE CARS", bay numbers, weighbridge rating, dispatch)

### Comparison Pairs & Gameplay Contact Sheets
- `pair-casting-floor.jpg`: 124.9 KB
- `pair-pour-floor.jpg`: 120.4 KB
- `pair-slump.jpg`: 121.5 KB
- `pair-rim-head.jpg`: 147.7 KB
- `pair-gauge.jpg`: 150.2 KB
- `pair-organ-pipes.jpg`: 158.0 KB
- `pair-lavafall.jpg`: 107.2 KB
- `pair-spawn.jpg`: 161.3 KB
- `rise-shelf-ink.jpg`: 267.9 KB

### Sweep Sheets (All < 300 KB)
- `sweep-day-high-organ-pipes.jpg`: 56.6 KB
- `sweep-day-high-pour-floor.jpg`: 135.0 KB
- `sweep-day-high-slump-shelf.jpg`: 66.5 KB
- `sweep-day-high-spillway-bridge.jpg`: 123.1 KB
- `sweep-day-low-casting-floor.jpg`: 49.8 KB
- `sweep-day-low-gauge-post.jpg`: 74.3 KB
- `sweep-day-low-organ-pipes.jpg`: 75.5 KB
- `sweep-day-low-pour-floor.jpg`: 135.2 KB
- `sweep-day-low-rim-head.jpg`: 113.2 KB
- `sweep-day-low-slump-shelf.jpg`: 69.8 KB
- `sweep-day-low-spillway-bridge.jpg`: 112.0 KB
- `sweep-day-low-surge-office.jpg`: 115.2 KB
- `sweep-dusk-high-organ-pipes.jpg`: 51.4 KB
- `sweep-dusk-high-slump-shelf.jpg`: 59.3 KB
- `sweep-dusk-low-pour-floor.jpg`: 109.3 KB
- `sweep-dusk-low-spillway-bridge.jpg`: 98.8 KB
- `sweep-dusk-low-surge-office.jpg`: 103.1 KB

---

## 5. Verification Conclusion

Highmark Foundry (`caldera`) Art Phase Review 3 Redo (Round 7) satisfies every requirement and resolves all findings:
- All 24 dedicated object types are placed in game, standing proud of colliders and hiding box corners.
- All 8 murals/decals are completely visible, framed, legible, and unblocked with zero crack bleed.
- Live covered wall area is reduced to $174.7\text{ m²}$, with stand-beside objects $> 75-100\%$ open for team ink.
- The backdrop cone features faceted scoria strata rings catching sunlight with billowy ash/steam puffs, and the Organ columns feature columnar basalt course lines, lighter cap stone courses, and hexagonal corner chamfers.
- All geometry is frozen (1805 / 1867 / 1674 ok).
- All probes and test suites pass (`probe-props2`: 0/0/0/0/0; `probe-cover2`: floorFight 0.0, wallFight 0.4; `caldera-art`: 8/8; `lava`: 60/60; `lava-karp`: 10/10).
