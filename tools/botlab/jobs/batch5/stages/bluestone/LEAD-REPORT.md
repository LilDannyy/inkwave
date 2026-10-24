# Bluestone Junction — the art phase: the place, in three eras (LEAD-REPORT)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. The engine phase's report is in git history (this file at
`12a57cc7`). The lead's brief: `LEAD-NOTES.md`, "The art phase (2026-10-25)", six binding items — done in that order
after the merge and the engine's first art-phase item (superJumpLanding). The stage stays **BETA** (item 6:
`config.js` keeps `beta: true`; nothing here touches it).

**Summary.** The grey blockout is now a city in three looks of the same streets, drawn mostly in the level shader under
the ink (every building face, kerb, cover block and small structure per era, keyed by block and by the fragment's own
era, so the front rewrites a facade along a clean line as it passes) plus ~230 dressing placements (the station's iron,
the dome / drum lettering / clock faces / signs / lamps / wires / planting / rails per era). Play geometry is frozen and
proven so (check-maps counts, the union nav graph, cover-map, spawn-mid, climb-audit, tower-check per era unchanged; the
Mac mini's nine-pass bake came back **byte-identical** to the committed lightmaps). Every engine test passes locally;
performance is under Halyard in every era (calls ×0.83–0.90, triangles ×0.35–0.37, cpuRender ×0.79–0.84).

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
    pavilion.
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
eras-look 7: `metal`, `wood`, `gloss`, `glow`, `rubber`): the station's iron (capitals, the eight iron arches under the
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
3000s, glass on the Halo and the stairs), the 1880s' telephone wires on roof poles and TODAY's tram catenary on span
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
4. **The sepia flicker pixel check**: it did not read — at 15 % film tone the warm crates changed < 1/255 — so it is
   strengthened (up to 45 % film tone plus a projector flicker in the brightness), and eras-look part 5 (b) renders the
   same frame with the flicker off and on: the crates change 2.45/255 toward the film tint (red over blue 2.98 → 2.89,
   the film's 1.58), the shared street 0.
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
- **Performance against Halyard per era** (Mac mini JOB-8, the reviewer's fixed-view probe perf6.js, a fresh default
  profile, day and dusk, 3 runs alternating; medians, Bluestone ÷ Halyard):

  | | calls | triangles | cpuRender |
  |---|---|---|---|
  | day e1 / e2 / e3 | ×0.90 / ×0.90 / ×0.83 | ×0.37 / ×0.35 / ×0.37 | ×0.82 / ×0.82 / ×0.81 |
  | dusk e1 / e2 / e3 | ×0.87 / ×0.84 / ×0.86 | ×0.36 / ×0.36 / ×0.37 | ×0.84 / ×0.79 / ×0.84 |

  (Halyard: 247–263 calls, 3.29–3.30 M triangles, 8.06–8.38 ms; Bluestone ~1.2 M triangles a view.) eras-jump 'frames'
  passes locally (no frame over 50 ms from J − 0.5 to done + 1.5; worst 47 ms at J + 1.45, the jump frame, on a loaded
  shared machine — the Mac mini's idle measure before the art was 35 ms).

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
   badge.

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
**Balance:** none run (the consolidated pass's); the art changes no play.

## 5. Commits; files
**Code:** `b9c6208f` (superJumpLanding + eras-jump 'sjland'), `f6b3407e` (the first art pass: levelart, kit, arch, dress,
surfaces, backdrop, layout, eras.js hooks, era prop colours), `d9e60328` (the clean edge, the flicker, the art between the
era halves, Tartar's wires, the 3000s' walls and furniture, land under the backdrop; eras-look part 5), `8d5c45a1` (28
grid lines un-inverted), `974f12e7`, `ad2fa3cf` (from the sweeps), `4edc9d9d` (the stage cards), `343c6919` (eras-look (e), the STAGE-MODS row).
**Merges:** `1150bf38`, `66cfe6ed` (new-stages); `269d5234` and later merges of `botlab-b5-bluestone` (the Mac mini's results).
**Scratch:** `3376402e` (tools), `7fcb79cf` (pictures), `5f000a2d` (the engine pictures, the logs), JOB-7 … JOB-11 and
their results, this report.
**Shared files: none.** Every change is in the stage's own folder (`src/world/stages/bluestone/*`), its module (`src/game/
eras.js`, `src/fx/eraFx.js`), its tests (`tools/botlab/tests/eras-look.js`, `eras-jump.js`), `assets/stages/bluestone-*`
and one doc row (`docs/STAGE-MODS.md` H8c: the level-art splice). For the integrator: the level program key on Bluestone
is now `inkwave-level-v8-eras-bsart` (eras-look accepts it).

## 6. Unfinished, flaky or uncertain
- **The end-of-match beat** (DESIGN §3.10: the dead future, "…So that is how it ends.", the inward rewind, "Returning to
  the Professor.") is not built — not on the brief's list; still the lead's to keep or cut.
- **Not done from the engine's "left to the art pass" list:** jump 2's hexagonal-shard curtain (the curtain is the
  engine's, pearl in jump 2), era ambiences (sound), a check of the curtain's brass foot against Tangerine ink; the tram
  still waits at its stop (no timetable).
- **Dusk glass:** large windows lit at dusk read pale cream rather than as interiors in a few places (the arcade's shops
  TODAY, the forecourt booth); toned down once, not finished.
- **The sweep pages** I did not look at one by one: 18 of the 30 Mac mini pages and 14 of the 15 twin pages.
- **The 28 inverted grid lines** (fixed in `8d5c45a1`) mean the earliest local pictures in the scratchpad show darker
  joints than the stage has; the committed pictures are after the fix.
- **Frame time:** the jump frame reaches 47 ms on this loaded Mac (limit 50); the art's shader is heavier than the
  blockout's — the Mac mini's quiet-machine JOB-6 should be repeated at this head if the lead wants the margin.
- **Climb-audit 144 vs DESIGN §8.8's 130 in eras 1–2:** the audit now counts the union graph in every era (unchanged by
  the art); not a regression.
- The stage stays BETA until the lead accepts the art.
