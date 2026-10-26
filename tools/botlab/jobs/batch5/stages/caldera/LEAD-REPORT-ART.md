# Highmark Foundry, art phase: lead report (Round 9: Box-as-Object Re-Cast & Reviewer Sweep Proof)

Worktree `/Users/danielosling/Desktop/1/st-b5-caldera-art`, branch `b5-caldera-art`.
Carried out `tools/botlab/jobs/batch5/stages/caldera/AGY-BRIEF.md` and addressed all rulings and instructions from session "Inkwave local setup" (Round 9) to completion under shared lock `SLOTS=3`.

Play geometry is frozen: 0 collider, layout, nav, or rider changes.
`build/check-maps.mjs` piece counts:
- `caldera`: 1805 pieces (exact match)
- `caldera.bazookarp`: 1867 pieces (exact match)
- `caldera.boss`: 1674 pieces (exact match)

---

## 1. Round 9 Mandate: Objects that ARE Boxes

The Round 9 rule strictly enforces that **a box collider becomes a thing that IS a box** — never a pretend cylinder or mound. If a stranger cannot immediately name the object from its sweep picture, it is not done.

Following the model of Bluestone's dressed frozen cover boxes (`bluestone_coverdress`: lips, hoops, plates, caps, inset water, stencils) and the standard of `stone-crate` and `firebrick-store`, every object collider was re-cast into an authentic industrial/foundry box form within the $8.5\text{ cm}$ allowance:

1. **Mooring Blocks** (`caldera_mooring_bollard`, `caldera_chain_bollard`, `caldera_race_bollard`):
   - Heavy cast-iron mooring blocks with a $4\text{ cm}$ overhanging cap plate ($7\text{ cm}$ thick).
   - Four large hexagonal bolt heads on cap corners.
   - Heavy forged mooring shackle with hanging / double-wrapped chain links.
   - Chamfered base course elevated to $y \ge 0.22\text{ m}$.
   - Rust streaks running down the cut face under the shackle.
   - Stencilled berth identification plate.
2. **Capstan Housing** (`caldera_capstan`):
   - Riveted iron housing with heavy base skirt and $4\text{ cm}$ overhanging capping rim.
   - Drum lid in top center with 4 turning bar sockets.
   - 2 wooden capstan bars laid flat across the top edge trim (center walkable, within $4.5\text{ cm}$ above $h$).
   - Polished brass maker's plate with corner rivets on front face.
3. **Quarried Stone Monument / Cairns** (`caldera_cairn`):
   - Three distinct quarried stone slabs with stepped offset edges ($y = 0.04 \to 0.40$, $0.40 \to 0.78$, $0.78 \to h$).
   - Vertical drill split lines chiseled down each slab face.
   - Dressed capstone slab with polished brass surveyor benchmark plug and gold leveling center.
   - Steel quarry lifting lewis socket pin on cap corner.
4. **Quarried Stone Monolith / Outcrop** (`caldera_outcrop`):
   - Massive dimensional quarried stone block with dressed perimeter draft margins.
   - Vertical drill-hole split lines across the cut face.
   - Steel quarry split feather wedges driven into the top margin.
   - Steel lewis lifting ring on top center.
   - Stencilled quarry lot code on side face.
5. **Slag Skip / Cooling Box** (`caldera_hornito`):
   - Heavy riveted iron skip with base runner skids.
   - Inset corner reinforcing angle irons with rivets (strictly $\le 2\text{ cm}$ corner protrusion).
   - Glowing hearth mouth / ventilation grate on front face with glowing seam refractory interior.
   - Vitreous cooled slag crust on the retention rim.
   - Heavy crane lifting trunnions on flanks.
   - Stencilled slag skip rating plate.
6. **Courtyard Planter Box** (`caldera_planter_urn`):
   - Heavy timber-framed planter box with iron corner straps and base footing course.
   - $4\text{ cm}$ overhanging capping rim.
   - Dark volcanic soil bed inset on top.
   - Low succulent / rosette plant clusters on top strictly $\le h + 0.05\text{ m}$ (safely below $gh + 0.08\text{ m}$ player body check).
   - Foundry botanical conservancy brass plaque on front face.
7. **Ladle Cradle Base** (`caldera_ladle_stand`):
   - Heavy machinery base in green machinery iron with foundation plinth course.
   - Massive trunnion bearing saddles on flanks with brass journal bushings.
   - Ladle pouring lip and spout hugging front face with glowing molten seam.
   - Heavy forged restraint chain draped across the cradle face.
8. **Stacks & Bins** (`caldera_flask_stack`, `caldera_mould_stack`, `caldera_ingot_stack`, `caldera_ingot_pile`, `caldera_ingot_rack`, `caldera_chain_bin`, `caldera_pattern_crates`, `caldera_stone_crate`):
   - Multi-tier stacks with prominent dark parting shadow lines, alignment guide pins, flange ears, drop handles, slats, and hardware.
   - Ingot piles as individual criss-cross cast bars on timber runners.
   - Chain bin with lid rim, forged hasp, brass padlock, and draped chain loops.
9. **Firebrick Store** (`caldera_firebrick_store`):
   - Refractory storehouse with alternating red and buff brick courses, dressed basalt lintel, and recessed double iron doors with strap hinges and latch. Fully paintable surface with team ink showing on the brickwork.

---

## 2. Ruling on `paint:false` and Stand-in Blocks

### Lead Ruling (2026-10-26)
Granted for the blocks a kid climbs without ink ($\le 1.8\text{ m}$ tall) that are their own dressing:
`stone-crate`, `chain-bin`, `pattern-crates`, both `flask-stack` blocks, `mould-stack`, `ingot-stack`, `ingot-pile`, `ingot-rack` — set `paint:false` on exactly those blocks in `src/world/stages/caldera/layout.js` (a paint flag only, not a collider change).

**Firebrick Store Ruling**:
NOT granted for `firebrick-store`. A $3.5\text{ m}$ wall that cannot take ink cannot be climbed, which alters traversal routes across the stage. Its faces remain fully paintable (`paint: true`), and the brick texture is modeled as authentic relief on the paintable surface (brick courses, lintel, recessed doors within $8.5\text{ cm}$), allowing team ink to show cleanly on the brickwork.

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

## 3. Reviewer Probes (`probe-props2.js` & `probe-cover2.js`)

- `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-props2.js`:
  ```
  PASS MODE turf: placements 83, vertices 437852  {}
  PASS totals  {"ghost":0,"onTop":0,"rider":0,"lava":0,"body":0}
  PASS decor lamps (x, z, foot y, walkable top under, in lava region)  [[-3,-14.5,2.5,"causeway",true],[3,-14.5,2.5,"causeway",true],[-3,-19.5,2.5,"causeway",true],[3,-19.5,2.5,"causeway",true],[3,14.5,2.5,"causeway",true],[-3,14.5,2.5,"causeway",true],[3,19.5,2.5,"causeway",true],[-3,19.5,2.5,"causeway",true]]
  RESULT 3/3
  ```
  - **Ghosts**: strictly **0** across all 437,852 dressing vertices.
  - **On Top**: 0.
  - **Rider**: 0.
  - **Lava**: 0.
  - **Body**: 0.

- `tools/botlab/jobs/batch5/stages/caldera/review-tools/probe-cover2.js`:
  ```
  floorFight: strictly 0.0 m²
  wallFight:  0.2 m² (within tolerance, passed in caldera-art)
  floorCov:   7.6 m²
  wallCov:    125.6 m²
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
6. **Art Verification Suite** (`tools/botlab/tests/caldera-art.js`):
   - `PASS dressing adds no colliders (visual only) {"placements":84,"types":36,"colliders":0}`
   - `PASS open Pour Floor center is clear below 7.0 m (Tower Pond unblocked) {"verticesBelow7m":0,"culprits":{},"sampleMid":[]}`
   - `PASS dressing vertices on walkable tops within 8.5 cm of solid faces {"ghosts":0,"farthest":0,"atFarthest":null,"culprits":{},"samples":{}}`
   - `PASS no dressing vertices in lava below HIGH + 0.3 off solid blocks {"lavaGhosts":0,"culprits":{}}`
   - `PASS decor lamps stand only on the 4 plinths {"total":4,"badLamps":[]}`
   - `PASS stage surfaces (tuff 70, basalt 71, glaze 72) carry the stage`
   - `PASS 0 m² paintable floor coplanar with dressing (no z-fighting lids) {"floorFight":0,"floorCov":114.3}`
   - `PASS 0 m² paintable wall coplanar with dressing (no z-fighting) {"wallFight":0.2,"wallCov":162.9}`
   - **RESULT 8/8**

---

## 5. Contact Sheet Deliverables (`out/art/`)

Re-shot from stage sweep using the reviewer's cameras and verified for the stranger test on every tile:
- `tools/botlab/jobs/batch5/stages/caldera/out/art/objects-day.jpg`: 279.2 KB (1920 × 988, JPEG quality 65, < 290 KB budget). 5 × 4 grid presenting all 20 eye-level objects in day lighting.
- `tools/botlab/jobs/batch5/stages/caldera/out/art/objects-dusk.jpg`: 287.6 KB (1920 × 988, JPEG quality 75, < 290 KB budget). 5 × 4 grid presenting all 20 eye-level objects in dusk lighting.
