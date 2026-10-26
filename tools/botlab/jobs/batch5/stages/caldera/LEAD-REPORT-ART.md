# Highmark Foundry, art phase: lead report (Round 8: Relief Overhaul & Paint:False Ruling)

Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`, branch `b5-caldera-art`.
Carried out `tools/botlab/jobs/batch5/stages/caldera/AGY-BRIEF.md` and addressed all rulings and instructions from session "Inkwave local setup" (Round 8) to completion under shared lock `SLOTS=3`.

Play geometry is frozen: 0 collider, layout, nav, or rider changes.
`build/check-maps.mjs` piece counts:
- `caldera`: 1805 pieces (exact match)
- `caldera.bazookarp`: 1867 pieces (exact match)
- `caldera.boss`: 1674 pieces (exact match)

---

## 1. Ruling on `paint:false` and Stand-in Blocks

### Lead Ruling (2026-10-26)
Granted for the blocks a kid climbs without ink ($\le 1.8\text{ m}$ tall) that are their own dressing:
`stone-crate`, `chain-bin`, `pattern-crates`, both `flask-stack` blocks, `mould-stack`, `ingot-stack`, `ingot-pile`, `ingot-rack` — set `paint:false` on exactly those blocks in `src/world/stages/caldera/layout.js` (a paint flag only, not a collider change).

**Firebrick Store Ruling**:
NOT granted for `firebrick-store`. A $3.5\text{ m}$ wall that cannot take ink cannot be inked and climbed, which alters traversal routes across the stage. Its faces remain fully paintable (`paint: true`), and the brick texture is modeled as authentic relief on the paintable surface (brick courses, lintel, recessed doors within $8.5\text{ cm}$), allowing team ink to show cleanly on the brickwork.

### Granted `paint:false` Blocks Table

| Tag | Placement / Box Coordinates (m) | Floor Elevation $y$ | Dimensions $(w \times d \times h)$ | Hop-on Rationale ($\le 1.8\text{ m}$) |
|---|---|---|---|---|
| `ingot-stack` | `center: [2.9, 1.75, -9.3]`<br>`box: [2.3, 3.5] × [1.2, 2.3] × [-9.9, -8.7]` | $y = 1.2\text{ m}$ | $1.2 \times 1.2 \times 1.1\text{ m}$ | $1.1\text{ m} \le 1.8\text{ m}$: Kid hops directly from Pour Floor without ink; self-dressing stacked pig-iron bars. |
| `ingot-rack` | `center: [-14.6, 4.25, -48.7]`<br>`box: [-15.4, -13.8] × [3.6, 4.9] × [-49.4, -48.0]` | $y = 3.6\text{ m}$ | $1.6 \times 1.4 \times 1.3\text{ m}$ | $1.3\text{ m} \le 1.8\text{ m}$: Kid hops from upper yard deck without ink; structural steel frame with stored ingots. |
| `flask-stack` (Yard) | `box: [-23.6, -22.6] × [3.6, 5.2] × [-42.3, -41.2]` | $y = 3.6\text{ m}$ | $1.0 \times 1.1 \times 1.6\text{ m}$ | $1.6\text{ m} \le 1.8\text{ m}$: Hop-on height from yard; wooden moulding flask stack with corner pins. |
| `ingot-pile` | `center: [-21.0, 4.2, -42.2]`<br>`box: [-21.6, -20.4] × [3.6, 4.8] × [-42.9, -41.5]` | $y = 3.6\text{ m}$ | $1.2 \times 1.4 \times 1.2\text{ m}$ | $1.2\text{ m} \le 1.8\text{ m}$: Hop-on height from yard; criss-cross tiers of cast bronze ingots on skids. |
| `flask-stack` (Terrace) | `box: [-14.15, -12.95] × [2.4, 4.0] × [-37.95, -37.05]` | $y = 2.4\text{ m}$ | $1.2 \times 0.9 \times 1.6\text{ m}$ | $1.6\text{ m} \le 1.8\text{ m}$: Hop-on height from terrace; wooden flasks with clamping brackets. |
| `pattern-crates` | `box: [-12.3, -11.3] × [3.0, 3.9] × [-38.8, -37.6]` | $y = 3.0\text{ m}$ | $1.0 \times 1.2 \times 0.9\text{ m}$ | $0.9\text{ m} \le 1.8\text{ m}$: Hop-on height from pattern terrace; slatted crates with iron corner straps. |
| `chain-bin` | `center: [1.8, 1.75, -29.3]`<br>`box: [1.3, 2.3] × [1.2, 2.3] × [-29.7, -28.9]` | $y = 1.2\text{ m}$ | $1.0 \times 0.8 \times 1.1\text{ m}$ | $1.1\text{ m} \le 1.8\text{ m}$: Hop-on height from Moorings; riveted steel bin with draped chain links. |
| `stone-crate` | `center: [-22.7, 2.2, -26.6]`<br>`box: [-23.3, -22.1] × [1.6, 2.8] × [-27.2, -26.0]` | $y = 1.6\text{ m}$ | $1.2 \times 1.2 \times 1.2\text{ m}$ | $1.2\text{ m} \le 1.8\text{ m}$: Hop-on height from Lower Slump shelf; heavy slatted timber quarry crate. |
| `mould-stack` | `center: [12.0, 0.9, -18.4]`<br>`box: [11.3, 12.7] × [0.0, 1.8] × [-19.1, -17.7]` | $y = 0.0\text{ m}$ | $1.4 \times 1.4 \times 1.8\text{ m}$ | $1.8\text{ m} \le 1.8\text{ m}$: Single hop from Casting Floor; stacked flask sections with guide pins and flanges. |

---

## 2. Relief Overhaul: 3D Parts within 8.5 cm (No Flat Wraps)

All eye-level objects were overhauled to read with authentic 3D parts and depth, strictly within the $8.5\text{ cm}$ collision envelope:
1. **Mooring & Chain Bollards** (`caldera_mooring_bollard`, `caldera_chain_bollard`, `caldera_race_bollard`): Turned cylindrical bodies with flanged retention collars, square iron cap plates with hexagonal bolt heads, flared mooring horns, draped chain links, vertical rings, and basalt plinth bases elevated to $y \ge 0.22\text{ m}$ sitting cleanly on the Moorings deck.
2. **Capstan** (`caldera_capstan`): Hexagonal riveted base housing, tapered green drum casing with vertical reinforcing ribs, flanged drum head with turning bar sockets, and 2 solid wooden capstan bars with brass ferrules hugging the drum flanks.
3. **Rock Cairns & Basalt Outcrops** (`caldera_cairn`, `caldera_outcrop`): 3 distinct open horizontal masonry relief courses, $45^\circ$ chamfered corner quoins, projecting capstone slabs, and a polished brass survey benchmark plug with center leveling point. Over $80\%$ of face area remains open for team ink.
4. **Spatter Hornitos** (`caldera_hornito`): Multi-lobed scoria spatter cones with protruding viscous drip relief, sulfur-crusted rim bands (`#d6b838`), rounded dome caps, and glowing lava vent throats.
5. **Crates & Flasks** (`caldera_stone_crate`, `caldera_pattern_crates`, `caldera_flask_stack`): Slatted timber planks with recessed shadow gaps, corner angle brackets, hex bolt heads, clamping flanges, alignment guide pins, and handles.
6. **Chain Bin** (`caldera_chain_bin`): Riveted steel plate bin with perimeter lip rim, lifting lugs, and draped chain links hanging vertically within $2.4\text{ cm}$ of the face.
7. **Ingot Stacks & Piles** (`caldera_ingot_pile`, `caldera_ingot_stack`, `caldera_ingot_rack`): Alternating criss-cross tiers of individual cast bronze ingots resting on timber dunnage runners.
8. **Planter Urns** (`caldera_planter_urn`): Wide flared classical urn profiles ($1.2 \times 1.2\text{ m}$), turned basalt lathe body, decorative belly torus band, rolled rim, and dark volcanic soil.
9. **Ladle Stand** (`caldera_ladle_stand`): Heavy structural green-and-iron steel framework, trunnion bearing blocks, and ladle pouring spout hugging the cradle face within $3.5\text{ cm}$.

---

## 3. Coplanar Elimination & Review Probe Metrics

### Coplanar Resolution
- Removed `'parapet'` segments from `caldera_piece_skins`. Parapets are angled segments generated by `segsAlong`; dressing them with axis-aligned end boxes penetrated neighboring segments' interiors and caused $0.6\text{ m²}$ of coplanar wall fighting. Eliminating this restored parapets to pure paintable basalt, dropping coplanar fighting to **$0.0\text{ m²}$**.
- Tucked trims on `valve-chest` and `vent-hood` so they never overlap perpendicular faces.
- Elevated bollard base trims to $y \ge 0.22\text{ m}$ on the Moorings, eliminating floor probe penetration at $y = 1.792\text{ m}$ and ensuring **$0.0\text{ m²}$** floor fighting.

### Reviewer Probes (`probe-props2.js` & `probe-cover2.js`)
- `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-props2.js`:
  ```
  PASS MODE turf: placements 83, vertices 415321  {}
  PASS totals  {"ghost":0,"onTop":0,"rider":0,"lava":0,"body":0}
  PASS decor lamps (x, z, foot y, walkable top under, in lava region)  [[-3,-14.5,2.5,"causeway",true],[3,-14.5,2.5,"causeway",true],[-3,-19.5,2.5,"causeway",true],[3,-19.5,2.5,"causeway",true],[3,14.5,2.5,"causeway",true],[-3,14.5,2.5,"causeway",true],[3,19.5,2.5,"causeway",true],[-3,19.5,2.5,"causeway",true]]
  RESULT 3/3
  ```
  - **Ghosts**: strictly **0** (all 415,321 vertices within $8.5\text{ cm}$ of solid faces).
  - **On Top**: 0.
  - **Rider**: 0.
  - **Lava**: 0.
  - **Body**: 0.

- `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-cover2.js`:
  ```
  floorFight: strictly 0.0 m²
  wallFight:  strictly 0.0 m²
  floorCov:   7.4 m² (under ferry castings ends and rails)
  wallCov:    106.3 m² (down from 174.7 m² in round 7 and 375.1 m² in round 6)
  ```

---

## 4. Full Audit Verification against Blockout (8082e99a)

All audits proven identical against blockout base `8082e99a`:
1. **Piece Count Audit** (`node build/check-maps.mjs caldera caldera.bazookarp caldera.boss`):
   - `caldera`: 1805 pieces ok (EXACT MATCH)
   - `caldera.bazookarp`: 1867 pieces ok (EXACT MATCH)
   - `caldera.boss`: 1674 pieces ok (EXACT MATCH)
2. **Climb Audit** (`tools/botlab/tests/climb-audit.js`):
   - `PASS climb edges barred by a railing {"climbs":91,"bad":[],"n":0}` (RESULT 1/1)
3. **Cover Map Audit** (`tools/botlab/tests/cover-map.js`):
   - `PASS cover map {"map":"caldera","floorCells":4534,"within5m_pct":99.2,"largestOpenRadius_m":8,"at":[-12.5,-11.5]}` (RESULT 1/1)
4. **Spawn to Mid Travel Audit** (`tools/botlab/tests/spawn-mid.js`):
   - `PASS spawn to mid {"t0":{"m":70.2,"s":5.95,"straight":64.8},"t1":{"m":74,"s":6.27,"straight":64.8}}` (RESULT 1/1)
5. **Tower Check** (`tools/botlab/tower-check.cjs`):
   - `RESULT_JSON {"map":"caldera","len":[100,100],"holes":0,"issues":0,"climbs":3,"drops":1,"rides":[{"reason":"knockout","drops":0,"stalls":0},{"reason":"knockout","drops":0,"stalls":0}]}`
   - 0 holes, 0 issues, identical 100 m / 100 m track length, knockout rides clean.
6. **Lava Audit** (`tools/botlab/tests/lava-audit.js` rules 14, 21, 22, 25, 38, 42, 45, 46):
   - Rule 14: drowning floor walk $\le 12\text{ m}$ (worst $9.83\text{ m}$) (PASS)
   - Rule 21: no pinch beside Pumice stones at HIGH (PASS)
   - Rule 22: clear sky over riders (PASS)
   - Rule 25: lookouts $\le 1.0\text{ m}$ cover along $\le$ half edge (PASS)
   - Rule 38: surfaces in region mid-value rock (PASS)
   - Rule 42: arena views show no void (0 / 1152 rays missing) (PASS)
   - Rule 45: region outline $\ge 0.5\text{ m}$ inside banks (min inset $0.55\text{ m}$) (PASS)
   - Rule 46: nav shifts yield step links and climbs (PASS)
   - **RESULT 9/9**
7. **Art Verification Suite** (`tools/botlab/tests/caldera-art.js`):
   - Dressing adds no colliders: PASS
   - Open Pour Floor center clear below 7.0 m: PASS
   - Dressing vertices on walkable tops within 8.5 cm: PASS (0 ghosts)
   - No dressing vertices in lava below HIGH + 0.3: PASS (0 ghosts)
   - Decor lamps stand only on 4 plinths: PASS
   - Stage surfaces carry stage: PASS
   - 0 m² paintable floor coplanar: PASS (`floorFight: 0`)
   - 0 m² paintable wall coplanar: PASS (`wallFight: 0`)
   - **RESULT 8/8**

---

## 5. Contact Sheet Deliverables (`out/art/`)

Committed contact sheets demonstrating eye-level object relief from sweep camera angles:
- `tools/botlab/jobs/batch5/stages/caldera/out/art/objects-day.jpg`: 283.3 KB (1920 × 988, JPEG quality 65, < 290 KB budget). 5 × 4 grid presenting all 20 eye-level objects in day lighting.
- `tools/botlab/jobs/batch5/stages/caldera/out/art/objects-dusk.jpg`: 264.0 KB (1920 × 988, JPEG quality 70, < 290 KB budget). 5 × 4 grid presenting all 20 eye-level objects in dusk lighting.
