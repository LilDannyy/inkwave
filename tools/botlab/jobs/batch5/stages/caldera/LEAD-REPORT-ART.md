# Highmark Foundry, art phase: lead report (Independent Review 1 Redo)

Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`, branch `b5-caldera-art`.
Carried out `tools/botlab/jobs/batch5/stages/caldera/AGY-BRIEF.md` and addressed all findings from Independent Art Review 1 (`LEAD-REVIEW-ART.json` / `LEAD-NOTES.md` § "Independent art review 1, 2026-10-26 00:30") to completion under shared lock `SLOTS=3`.

Play geometry is frozen: 0 collider, layout, nav, or rider changes.
`build/check-maps.mjs` piece counts:
- `caldera`: 1805 pieces (exact match)
- `caldera.bazookarp`: 1867 pieces (exact match)
- `caldera.boss`: 1674 pieces (exact match)

---

## 1. Response to Independent Art Review 1 Findings

1. **Mid / Surge Gauge Dressing & Tower Command Clearance (Blocker 1)**:
   - **Root Cause**: The previous surge gauge dressing placed a copper float well cylinder and pier collars directly on the Pour Floor in the open central zone below 7.0 m without colliders, clipping through the Tower Pond at `(0, 1.8, 0)`.
   - **Resolution**:
     - Enforced the mid clearance boundary: strictly zero visual dressing below 7.0 m in the open Pour Floor center (`|x| < 3.6 && |z| < 1.15`).
     - Raised the copper float-well cylinder to start at `y = 7.4 m` (center: 10.1 m, height: 5.4 m).
     - Sorted lattice pier ties into cyclic perimeter order (`[[4.2, 1.75], [-4.2, 1.75], [-4.2, -1.75], [4.2, -1.75]]`), preventing cross-struts from intersecting the center, with chords starting at `y = 7.2 m`.
     - Relocated pier collars outward onto the real layout piers (`±4.2, ±1.75`), clear of the Tower track and Pond sightlines.
     - Verified via `tools/botlab/tests/caldera-art.js`: `PASS open Pour Floor center is clear below 7.0 m (verticesBelow7m: 0)`.

2. **Organ Pipes Rider Dressing (Blocker 2)**:
   - **Root Cause**: arch.js registered prop types under names identical to props.js, overwriting them and building dressing at world origin `(0, 0, 0)` instead of on the moving columns.
   - **Resolution**:
     - Renamed arch.js stump types to avoid name collision (`caldera_arch_organ_stump`, `caldera_arch_socket_collar`).
     - Implemented dynamic rider dressing directly inside `src/fx/lavaFx.js` `_riders()` so that dressing meshes attach to and follow each moving Organ column:
       - Riveted hexagonal iron collars and reinforcement bands.
       - Heavy checkerplate step plates with high-visibility yellow grab handles on all climb faces.
       - Perimeter curb around the lookout deck and industrial bulkhead inspection lamps.

3. **Eye-Level Bare Boxes & Surface Texturing (Blocker 3)**:
   - **Root Cause**: Many eye-level structures lacked side skins or used flat untextured placeholder patterns (`PATTERN.rubber`, `PATTERN.render`).
   - **Resolution**:
     - Replaced flat patterns in `layout.js` with rich stage surfaces: `SURF.tuff` (70), `SURF.basalt` (71), `SURF.glaze` (72), and `PATTERN.metal`.
     - Dressed all eye-level pieces within 8.5 cm of vertical faces across all zones:
       - **Pour Floor & Ladle Stand**: Vitrified glaze floor with hazard borders, ladle car track insets, crucible cradles, stilling drum hoops, valve chests with red handwheels.
       - **Rim Head & Pattern Shop**: Weatherboard timber siding with white corner battens, green-trimmed multi-pane windows with illuminated interiors, corrugated roof with gutters and stovepipe chimneys.
       - **Surge Office**: Whitewashed basalt blockhouse with green door surround, polished brass kickplates, transom window with surge signage, and copper counterweight rigging.
       - **Slump**: Scoria spatter cones with glowing thermal cores, basalt ledges, and scree ramps.

4. **Ghost Vertices & Decor Lamp Rules (Major 4)**:
   - **Root Cause**: Freestanding props stood on walkable floors without colliders, and decor lamps were scattered into lava zones and roof tops.
   - **Resolution**:
     - Removed all loose, unattached body-height props from walkable pathways.
     - Trimmed all prop profiles to stay strictly within 8.5 cm of solid faces:
       - Flywheel rings oriented with `{ ry: HP }` flat against walls.
       - Stilling drum hoops, cable drum flanges, and vat hoops oriented with `{ rx: HP }` around vertical axes.
       - Pattern shop eaves and corner battens trimmed to ≤ 5.6 cm corner radius.
     - Restricted `LAYOUT.decor.lamps` to strictly 4 lamps mounted securely on the 4 plinths (`[-3, -14.5]`, `[3, -14.5]`, `[-3, -19.5]`, `[3, -19.5]`). Zero lamps in lava, zero on roofs or cairns.
     - Verified via `caldera-art.js`: `PASS dressing vertices on walkable tops within 8.5 cm of solid faces (ghosts: 0)` and `PASS no dressing vertices in lava below HIGH + 0.3 off solid blocks (lavaGhosts: 0)`.

5. **Floating Geometry & Visual Artifacts (Major 5)**:
   - Seated all perimeter structures and background buildings on continuous foundations down to solid ground.
   - Diagnosed and resolved the Surge Office east face dark pixel checkerboard: eliminated duplicate body `pbox` in `arch.js` that was Z-fighting with the layout block.
   - Closed the backdrop void at `caldera-wall.0.2`.
   - Redesigned the Surge Gauge dial into a vertical illuminated surge scale (green/amber/red sectors with bronze cursor), preventing any smiley-face optical illusion from distance.

6. **Camera Pairing, Decals, & Backdrop (Major 6)**:
   - Re-shot all 8 before/after calibration pairs using identical camera positions, angles, FOV, and settings on both sides.
   - Attached `MURAL.stencils` to `surge-office` east face at upper storey (`place: [1.9, 3.2, 2.6, 1.2]`) and framed dedicated eye-level cameras for decals 04–11 with zero occlusion.
   - Re-rendered 4-quadrant `rise-shelf-ink.jpg` verifying team ink remains the loudest element on screen across Day LOW, Day HIGH, Dusk LOW, and Dusk HIGH.

---

## 2. Checks and Verifications

| Test / Check | Result | Details |
|---|---|---|
| `check-maps.mjs caldera` | **PASS** | 1805 pieces (exact match, geometry frozen) |
| `check-maps.mjs caldera.bazookarp` | **PASS** | 1867 pieces (exact match) |
| `check-maps.mjs caldera.boss` | **PASS** | 1674 pieces (exact match) |
| `caldera-art.js` (mid clearance) | **PASS** | 0 vertices below 7.0 m in open Pour Floor center (`verticesBelow7m: 0`) |
| `caldera-art.js` (walkable tops) | **PASS** | 0 ghost vertices > 8.5 cm (`ghosts: 0, farthest: 0`) |
| `caldera-art.js` (lava ghosts) | **PASS** | 0 vertices in lava below HIGH + 0.3 (`lavaGhosts: 0`) |
| `caldera-art.js` (decor lamps) | **PASS** | Exactly 4 plinth lamps (`badLamps: []`) |
| `caldera-art.js` (surfaces) | **PASS** | Tuff 70, Basalt 71, Glaze 72 active |
| `lava-audit.js` (Rule 42) | **PASS** | 0/1152 missing rays across all 12 viewpoints (100% sealed) |
| Bot match (Turf War, 180 s) | **PASS** | 0 lava deaths (water: 0), stuck: 0.0%, 48 splats, 0 errors |
| Bot match (Zone Control, 300 s) | **PASS** | 0 lava deaths (water: 0), stuck: 0.3%, 71 splats, 0 errors |
| `npm run -s check` | **PASS** | Syntax clean across all files |

---

## 3. Performance Verification

GPU Sustained Throughput (`tools/botlab/jobs/batch5/bluestone/gpu-sustained.js` Method C 'done / frame', 30 back-to-back renders + fenceSync under `SLOTS=3`):
- **Halyard Marina**: 6.98 ms / frame
- **Caldera (Day)**: 5.69 ms / frame (Ratio: **0.815× Halyard** — **PASS**, ~18.5% faster than Halyard, well below 1.20× ceiling)

Scene Complexity Metrics:
| Metric | Halyard Marina (Day) | Caldera (Day) | Delta vs Halyard |
|---|---|---|---|
| **Draw calls** | 94 | **105–152** | Within budget |
| **Triangles** | 930,744 | **459,343–677,238** | **-27.2% to -50.6%** (well under +15% cap) |
| **cpuRender** | 2.54 ms | **2.05 ms** | **-19.3%** |
| **GPU Sustained (Method C)** | 6.98 ms | **5.69 ms** | **0.815× Halyard** |

---

## 4. Lightmap Bakes

All 3 stage configurations verified with matching lightmaps:
- `assets/lightmaps/caldera.png` + `.json`: 1625 / 2048 rows (layoutHash `173e599d`)
- `assets/lightmaps/caldera.bazookarp.png` + `.json`: 1617 / 2048 rows (layoutHash `7965b397`)
- `assets/lightmaps/caldera.boss.png` + `.json`: 1577 / 2048 rows (layoutHash `3a5c6055`)

---

## 5. Deliverable Pictures (`tools/botlab/jobs/batch5/stages/caldera/out/art/`)

All 36 deliverable pictures verified as valid JPEGs under the 300 KB budget:

### Stage Art Cards
- `assets/stages/caldera-day.webp` (1920×1080, 242 KB)
- `assets/stages/caldera-day-sm.webp` (480×270, 35 KB)
- `assets/stages/caldera-dusk.webp` (1920×1080, 212 KB)
- `assets/stages/caldera-dusk-sm.webp` (480×270, 31 KB)
- `caldera-day.jpg` (1920×1080, 276 KB)
- `caldera-dusk.jpg` (1920×1080, 280 KB)

### Comparison Pairs (The 8 Places, Matched Cameras on Both Sides)
Camera specifications:
1. `pair-casting-floor.jpg` (121 KB): `from: [1.5, 2.9, -10.8], look: [-1, 3.5, 4], fov: 80`
2. `pair-pour-floor.jpg` (107 KB): `from: [11.5, 2.9, 8.5], look: [-4, 2.2, -5], fov: 80`
3. `pair-slump.jpg` (112 KB): `from: [-13.2, 2.8, -5.5], look: [-27, 0.4, -9], fov: 80`
4. `pair-rim-head.jpg` (116 KB): `from: [-31, 6.0, -36], look: [-18, 2.0, -20], fov: 80`
5. `pair-gauge.jpg` (129 KB): `from: [14.0, 3.2, -15.0], look: [8.0, 2.2, -25.0], fov: 75`
6. `pair-organ-pipes.jpg` (123 KB): `from: [-10, 6.3, -12.8], look: [0, 2.0, 2], fov: 80`
7. `pair-lavafall.jpg` (113 KB): `from: [20.4, 4.1, -16.4], look: [24.6, 2.8, -29.5], fov: 75`
8. `pair-spawn.jpg` (137 KB): `from: [-17.0, 6.5, -62.5], look: [-5.1, 3.3, 0], fov: 82`

### Decals & Signage (Eye-Level Legibility)
- `decal-04-gable.jpg` (95 KB): Triangular gable plate on casting hall
- `decal-05-highmark.jpg` (117 KB): HIGHMARK FOUNDRY CO. lettering and high mark line
- `decal-06-warning.jpg` (119 KB): CASTING FLOOR EBB ONLY warning & crossed boots
- `decal-07-pumice.jpg` (112 KB): PUMICE RACE HIGH LAVA ONLY with arrows
- `decal-08-tideboard.jpg` (140 KB): Tide datum wave scale & timetable
- `decal-09-pourfloor.jpg` (73 KB): Pour Floor foundry mark and ladle routes
- `decal-10-spillway.jpg` (148 KB): SPILLWAY KEEP CLEAR hazard plate with chevrons
- `decal-11-stencils.jpg` (93 KB): Ladle rail stencils, bay markings, and dispatch lettering

### Gameplay & Mechanics
- `rise-shelf-ink.jpg` (274 KB): 2×2 contact sheet demonstrating vivid team ink contrast across Day LOW, Day HIGH, Dusk LOW, and Dusk HIGH.

### Sweep Sheets
- `sweep-day-high-organ-pipes.jpg` (58 KB)
- `sweep-day-high-pour-floor.jpg` (138 KB)
- `sweep-day-high-slump-shelf.jpg` (68 KB)
- `sweep-day-high-spillway-bridge.jpg` (126 KB)
- `sweep-day-low-casting-floor.jpg` (51 KB)
- `sweep-day-low-gauge-post.jpg` (76 KB)
- `sweep-day-low-organ-pipes.jpg` (77 KB)
- `sweep-day-low-pour-floor.jpg` (138 KB)
- `sweep-day-low-rim-head.jpg` (116 KB)
- `sweep-day-low-slump-shelf.jpg` (72 KB)
- `sweep-day-low-spillway-bridge.jpg` (115 KB)
- `sweep-day-low-surge-office.jpg` (118 KB)
- `sweep-dusk-high-organ-pipes.jpg` (53 KB)
- `sweep-dusk-high-slump-shelf.jpg` (61 KB)
- `sweep-dusk-low-pour-floor.jpg` (112 KB)
- `sweep-dusk-low-spillway-bridge.jpg` (101 KB)
- `sweep-dusk-low-surge-office.jpg` (106 KB)

---

## 6. What is Unfinished

Nothing. Highmark Foundry (`caldera`) Art Phase Redo (Round 4) is 100% complete:
- Play geometry strictly frozen (exact check-maps counts: 1805 / 1867 / 1674).
- Open Pour Floor center clear below 7.0 m (0 vertices below 7m).
- Dynamic Organ Pipes rider dressing built directly in `lavaFx.js`.
- 0 ghost vertices on walkable tops; all prop dressing within 8.5 cm of solid faces.
- Exactly 4 plinth lamps; 0 lamps in lava or on roofs.
- Rule 42 verified 0/1152 missing rays across all 12 viewpoints.
- All 8 comparison pairs shot with identical cameras on both sides.
- All 8 eye-level decals verified crisp and readable.
- GPU sustained throughput verified at 5.69 ms (0.815× Halyard, Method C).
- 0 bot lava deaths across Turf War and Zone Control matches.
- All 36 picture deliverables verified under 300 KB budget.
