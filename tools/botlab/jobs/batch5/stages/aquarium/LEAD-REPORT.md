# Gulper Aquarium, art phase: report after fix round 5 (the last art round)

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`. The round started at 9c0dd38b
(code 32b6c316) and answers review 5 (`LEAD-REVIEW.json`, verdict redo) under LEAD-NOTES "After review 5". The code head
is **aec8c0e1**, the stage art cards 938a2458, the pictures beb4cb23 and 0ada5d71.

How it ran:
- Everything ran locally, one Electron at a time under the shared SLOTS=3 lock (`BOTLAB_OUT` in inkwave-upstream),
  WATCHDOG=900000 on the page tests. The load average was 15–540 during the round.
- The lightmap bake also ran locally (the lead allowed "locally or on the Mac mini"). Nothing was pushed and no Mac mini
  job was sent.
- `wip` is still on. The uncommitted edits to `COMMON.md` and `LEAD-NOTES.md` and the untracked `LEAD-REVIEW*.json` are
  not mine; I left them alone. LEAD-NOTES gained a "Mac mini pipes on / off set" section during the round. I did not act
  on its Zone Control bot item: it says that belongs to a bots round after this one.
- Every picture was taken with a scratch copy of `shoot.cjs` (`scratchpad/aqr5/tools/shoot2.cjs`, round 4's). It waits
  for each stepped frame's paint, so no picture holds a stale frame, and its PRE script turns the bots' brains off.
- Before pictures come from a clean `git archive` copy of 9c0dd38b. After pictures come from the working tree.

## 0. The sweep, area by area: what was bare, what it is now

**How the sweep was done.**
- I listed every structure of Alpha's half from `layout.js` (a script dumps every tag with its bounds; the twins follow).
- Each one was shot at 1.7 m over the floor a player walks past it from, day | dusk side by side: 99 views in 9 areas.
- Each view is marked BARE (red frame) or ok on its row of the contact sheet.
- Before: `out/art/r5-sweep-<area>[-n].jpg`. After: `out/art/r5-sweep-after-<area>[-n].jpg`, the same 99 views.
- **40 views were BARE before; 0 are after.**
- Everything marked was dressed in one pass. The review's list was the minimum; the sweep found more.
- Before / after pairs: `r5-pair[-dusk]-<view>.jpg`, plus `-B` for Bravo's twin of every BARE view.

| Area | Bare before (the sweep's marks) | Now |
|---|---|---|
| **mid** (17 views, 7 bare) | The touch pool's **dais and step**: maroon slabs (review). The **helmet bed**: a plain bronze box. The four **viewing steps** round the Great Tank: cream slabs. | Dais and step: coral-cream cast stone in courses over a granite plinth with a brass line (two speed lines on the dais), flags on top with a brass strip at the edge, an **EXHIBIT · PLEASE KEEP OFF THE ROCKS** plate on each end. Helmet bed: cast stone round a bed of sea-worn pebbles, a DIVING HELMET · STANDARD DRESS · 1934 plate. Viewing steps: polished black-granite risers under a brass nosing, stone treads, a PLEASE DO NOT TAP THE GLASS plate on each riser (DESIGN §5.5 item 8). |
| **gate** (12, 2) | The **shark-viewing bench**: a teak block. The Gate Terrace's west view: Penguin Point behind it. | The bench has teak slats between brass end posts, brass Deco ends and a SHARK WATCH plate. Penguin Point: below. |
| **reef** (10, 1) | The Service Gate view: the pump sets. | Pump sets: below. Everything else in the Reef Hall read as dressed. |
| **prom** (14, 6) | The **grand stair's flanks** (bare grey) and its **head's sawtooth** (review). The **deckchair stack**: a coral box. The W drum's **Kelp Balcony** face: a dark teak slab. The **Penguin Steps' flanks**: grey triangles. | Stair flanks (the grand stair, the Penguin Steps): white render in the deck stair's language, with a granite skirting and brass line, three faience speed lines down the rake, a brass string-course (props) and a lit porthole into the Jelly Gallery near the grand stair's head. The head has a **granite nosing** (layout, re-bake: §1). Deckchairs: eight folded chairs in layers, teak rails under muted striped canvas, the top chair's sling. Kelp Balcony: a raised deck face in the Lookouts' language (render, skirting, speed lines, a teak fascia over a brass nosing). |
| **penguin** (13, 11) | Review 5's major: the **rock terrace's** faces and top, the **upper rock's** faces and top, the **basking rock**, the **ice pile**. Also the **keeper's hut's** three blank sides. | §1 (Penguin Point). The hut has a four-pane window with sea-green shutters on each side, and the PENGUIN FEEDS board and a hose reel on its back. |
| **ticket** (8, 6) | The Ticket Hall's **plaza** (review), **west** and **east** faces: plain render. **Its stair's flank.** The **queue step**. | Faces: the render family (granite skirting, brass line, three faience speed lines). A **FERRY TO INKOPOLIS · SAILINGS EVERY 20 MINUTES** plate over the plaza bench and a TICKET HALL plate on the west face. Stair: a render flank with a string-course. Queue step: cast stone over granite. |
| **pump** (7, 4) | Both **pump sets** (review): blue-grey boxes. | Painted machinery: a granite foot, a hazard band, a bolted sea-green bedplate, the motor's drum along each long face (cooling ribs, bolted flanges, a brass nameplate), a flanged end with a bolt circle and hub on the short faces, checker-plate covers. Props: a flanged pipe stub on each free end, a red handwheel and a pressure gauge on the aisle side. |
| **plaza** (10, 1) | The **queue terrace's** face: a plain step. | Cast stone over a granite plinth. The rest (kiosks, trolleys, forklift, the Express stop, round 4's planters) read as dressed. |
| **deck** (8, 2) | The Fin Pavilion's **flank wall beside each stair**: a bare 3.4 m wall, found during the sweep. | A raised deck face in the Lookouts' language, with a lit porthole into the foyer. |

## 1. LEAD-NOTES after review 5, item by item

### Item 1: the complete sweep, then Penguin Point and the review's list (one pass)

**Penguin Point** (review 5's major, both halves).
- **How it is drawn.** All of it is inkable cover, so it is drawn in the level shader under the ink, as round 4 drew
  the Lookouts.
- **Where.** In `floorart.js`, from `geo.js` `PENGUIN`, through the shader's Alpha frame.
- **The relief.** It goes through the level's own normal path (`gTexN`, as the texture library's relief does), so it
  lights like real relief and flattens under ink.

| Piece | What it is now |
|---|---|
| The rock terrace's 1.2 m faces and the upper rock's 2.4 m faces | Cast faux-Antarctic rockwork in DESIGN §5.4's penguin rock (#8d8a84 … #bfc5c7): rounded stones in wandering courses, dark crevices, ledges lit and undersides shaded. A granite foot. A snow lip with icicles along every top edge. A few guano streaks and lichen spots. |
| The upper rock's plaza face | The **PENGUIN POINT** plaque (a prop, 4 cm proud): a navy board in a stepped brass frame, the name, FEEDS 11:00 · 15:00, an emperor penguin in enamel. |
| The tops | Pale rock slabs with wandering cracks, snow drifted toward the glass and into the cracks, guano splashes, and four trails of penguin footprints to the glass. The rounded edges are snow. |
| The basking rock | A rounded boulder: big weathered stones, its faces turning away toward their corners and over its top, strata, lichen. Props: a boulder pair wrapping each corner (7.8 cm out at most, below its 2.2 m top) and four low lumps at its foot. |
| The ice pile | Stacked ice blocks: blue-white, deeper blue toward each block's middle, frosted edges, dark seams, a fracture and bubbles, pillowed relief. Its top is frosted blocks. |

**The rest of the review's list:** the pump sets, the dais and step, and the Ticket Hall's plaza face, as in §0.

Proof (both halves, day and dusk):

| | Pictures |
|---|---|
| Review 5's cameras | `r5-pair-rv-penguin-face(-B)`, `-rv-upperrock(-B)`, `-rv-basking(-B)`, `-rv-icepile(-B)`, `-rv-gate-terraceW`, `-rv-penguin-terrace(-B)`, `-rv-pumpset(-B)`, `-rv-court-pool-E`, `-rv-tp-prom`, `-rv-ticket-front(-B)`, with dusk pairs `r5-pair-dusk-rv-*` |
| The sweep's views | `r5-pair-penguin-face`, `-penguin-faceN`, `-upperrock(-S, -N)`, `-upper-top`, `-penguin-terrace`, `-basking`, `-icepile`, `-hut(-2)`, `-pumpset(2)`, `-pump-aisle`, `-pump-south`, `-pool-E`, `-dais-N/-S/-W`, `-ticket-front/-S/-W/-E`, all with `-B` and `dusk` |
| Ink over the art | `r5-ink-*`: both teams' ink splatted on the rockwork, the terrace top, the ice pile, a pump set, the dais, the Ticket Hall, the grand stair's flank and the deckchairs, day and dusk, both halves. The ink covers the art. |
| Other modes | `r5-modes-tower-*`, `r5-modes-zones-*`: the Tower Command and Zone Control builds draw the new art, with 0 console warnings. |

### Item 2: the nits

| Nit | What I did | Measured |
|---|---|---|
| **The Lookout portholes' dusk glow** | At dusk the glow is now warm white: the porthole picture's own luminance, lit warm. Before, it was the picture's blue-green times the lamp. The stair flanks', the Lookouts' and every new porthole share the term. | Brightest half of the glass at dusk: hue 177–189 and saturation 0.24–0.28 before; hue 32 and saturation 0.31 after (lookoutN, and the deck stair's against the grand stair's). `r5-pair-dusk-lookoutN`, `r5-pair-dusk-deckstair-E`. |
| **The topiary's spokes** | The spokes' risers inside the bed and their rounded edges are now drawn as the bed's own planting at its tone. Before, they were dark soil under a darker leaf and a flat dark green: straight cuts across the bed. | `r5-pair-topiaryUp`. From above, the steps now read as one bed with soft shadow lines, not dark cuts. A faint line remains where the 9 cm steps meet. |

### Item 3: the grand stair's granite nosing (the lead's call) and the re-bake

**The block** (`layout.js`, both halves): `radBox(−152, r 20.95 → 21.5, 5.99 wide, top 2.485)`, stone, `paint: false`.

| Number | Why |
|---|---|
| r 20.95 | The promenade cells' corners reach r 20.96 in the stair's mouth. |
| 5.99 wide | It fits between the balustrade and the coping and touches neither: their inner corners stand at ±3.0 off the axis and their sides diverge from it. |
| Top 2.485 (8.5 cm proud) | It stays ≥ 8 cm off the cells' and the ramp's 2.4, check-maps' z-fight rule. |
| 0.27 m lip over the ramp at r 20.95 | Under `PLAYER.stepUp` (0.35). climb-audit is unchanged. |

**What it does.** The cells under the nosing now merge, so check-maps counts 1774 / 1766 pieces (were 1776 / 1768).
The grand stair's flank art ends under it.

**Re-bakes:**
- `baked.js` (bake-tiles.mjs: the promenade and ground layers changed).
- The AO lightmaps (`bake.cjs`, locally):

| Lightmap | Hash | Rows | Time |
|---|---|---|---|
| aquarium | 5938d1d0 | 1554 / 2048 | 91.7 s |
| aquarium.tower | d2b73cc2 | 1552 / 2048 | 166.9 s |

**Re-runs** (§2): check-maps ok / ok; climb-audit 144 / 0; stage-audit turf 3/3 and tower 4/4, both "lightmap applied",
not stale; cover-map unchanged.

**The sawtooth is gone** (pictures):
- `r5-pair-rv-court-promwall`, `r5-pair-rv-stairtopB`, `r5-pair-rv-stairfoot-up(-B)`, by day and at dusk;
- also `r5-pair-stairtop` (from the promenade), `r5-pair-promwall`, `r5-pair-dusk-lookoutN`.

### Item 4: the stage art cards (last)

**How they were made.** `assets/stages/aquarium-{day,dusk}{,-sm}.webp` were re-made after everything above:
- the same hero camera (`layout.art`) and scene as round 2 (`scenes/aquarium-hero.js`: tangerine-cobalt, a Bravo rider
  up the W drum's Kelp Line, an Alpha rider on its run over the promenade);
- 3840 × 2160 on the re-baked lightmaps, then `cwebp -q 86` at 1920 × 1080 and 480 × 270.

**What changed in frame.** The old card's round-2 touch pool and dark Lookout are gone; the rockery, the dressed Lookout,
the helmet bed and the deckchairs show.

**Pictures:**
- `r5-card-day`, `r5-card-dusk`: the new cards;
- `r5-card-pair-day/-dusk`: the old card left, the new right;
- `r5-card-crops`: both riders read as squids in their glows and GULPER AQUARIUM is clear, by day and at dusk.

### Items 5–7

| Item | Status |
|---|---|
| 5. Exit camping | Not this round's (the lead's Mac mini set). This round's one Turf War match reads 2.9× (below). |
| 6. Triangles | Accepted before this round; this round's addition is in §2. |
| 7. The boss | Accepted; not re-run (no nav, collider or boss input changed except the nosing, which is far from the boss's ground). |

## 2. Re-runs at the code head

| Check | Result |
|---|---|
| `node build/check-maps.mjs aquarium aquarium.tower` | ok / ok, **1774 / 1766** pieces (the nosing's cells merged; were 1776 / 1768) |
| tests/aquarium-art.js | **36/36**: the 28 earlier checks and section 9's 8. 136 programs link, glError 0. |
| Section 9 at 9c0dd38b (a copy of the head with only geo.js's new numbers added) | **29/36**: 7 of the 8 new checks fail there (rockwork, the terrace top, the ice / pumps, the dressed faces, the deckchairs, this round's props, the nosing). The ink check is a guard and passes on a plain face too. |
| stage-audit turf | **3/3**: lightmap applied (aquarium, 1554 rows, not stale); spawn → mid 6.53 / 6.75 s (unchanged); no climb barred |
| stage-audit tower | **4/4**: lightmap applied (1552 rows, not stale); 155 m, 100 s to the goal |
| climb-audit | 144 climbs, 0 barred (unchanged) |
| cover-map | 98 %, largest open circle 12.2 m at (7.5, −67.5) (unchanged) |
| tests/pipes.js | **91/92**. See the next row. |
| The failing pipes check: "cam: the rider is in view on ≥ 90 %" | The Gulper Run reads 0.868 in both directions (seen 92, landing 33, hidden 17, unseen 19). **It reads exactly the same at 9c0dd38b** (`only=cam` run on the clean copy: 0.868, the same frame counts), so it predates this round. The unseen frames are frame 0 of the suck, frames 32–38 of the entry ride (in frame, sight line blocked) and the last 11 frames after landing. Round 4 did not run pipes.js; I have not traced which earlier round moved it. |
| Turf War ×1, 180 s, PAGEQ=pipestats | Turf 32.2 / 37.2. Stuck 0.1 % (longest 0.75 s). Splats 38. Rides 14 (0.58 per bot-minute). giveUps 0, longest push at a mouth 0.68 s. High-ground arrivals by pipe 20 % (6/30, inside 10–35 %). Camping 0.154 per landing against a base of 0.0528, so 2.9×: 2 deaths of 13 landings, at arch~:B and kelp~:A; the lead's cooldown step is due at integration. The only console lines are the 7 pipestats lines. |
| shoot.cjs REPORT (at load) | See the next table. |

| shoot.cjs at load | calls | tris | cpuRender | loadMs |
|---|---|---|---|---|
| Aquarium, day | 110 | 1.10 M | 2.73 ms | 7.0 s |
| Halyard, day | 169 | 1.49 M | 2.28 ms | 7.7 s |
| Aquarium, dusk | 107 | 1.09 M | 2.66 ms | 7.7 s |
| Halyard, dusk | 151 | 1.44 M | 2.26 ms | 7.8 s |

- Each stage's REPORT is from its own load camera, so it only compares like with like loosely. cpuRender varied ±20 %
  on this shared machine.
- `propMeshes` is 6, as before: **no draw call added.** Everything new is in the level shader or rides an existing prop
  material bucket.

**Triangles.** Counted with a headless build of every placement, before and after:

| Props, both halves | 9c0dd38b | now | Δ |
|---|---|---|---|
| all | 414,034 | 463,078 | **+49,044 (+11.8 % of the props)** |
| the plates (14 per half; mostly their letters) | 0 | 29,104 | +29,104 |
| the keeper's hut (windows, shutters, board, reel) | 3,196 | 7,628 | +4,432 |
| the basking rock's lumps | 0 | 5,920 | |
| the pumps' pipework | 0 | 4,840 | |
| the PENGUIN POINT plaque | 0 | 4,364 | |
| the stairs' string-courses | 0 | 384 | |

That is about 3 % of a high-mode frame (1.5–1.6 M), on top of the accepted +6–12 % over Halyard. If the lead wants it
back, the cheapest lever is the eight viewing-step plates, about 8 k triangles; I left them in.

## 3. Decisions where the notes left a gap

1. **Pieces the review did not list were dressed** where the sweep marked them: the viewing steps, the helmet bed, the
   shark bench, the deckchairs, the Kelp Balconies, the stairs' flanks, the Ticket Hall's west / east faces and its stair,
   the queue step and terrace, the hut's sides, the pavilion's flank walls. The notes say "dress everything marked".
2. **Everything on inkable cover is drawn under the ink** (round 4's rule). Props stand only where something has to be
   proud of a face: plates, the plaque, the basking rock's lumps, the pumps' stubs and wheel, the string-courses, and the
   hut's windows (the hut is off-limits).
3. **The basking rock is a boulder "read" on a square block.** The shader turns its faces' normals away toward the corners
   and over its top, and corner boulders stand 7.8 cm proud. Its outline from the side is still a rounded square pillar
   2.2 m tall, not a free-form rock; changing that needs a collider change, which the notes forbid. No sunning-penguin
   silhouette (optional in the review).
4. **The ice pile's "translucency"** is a tint (deeper blue toward each block's middle, bubbles and a fracture inside), not
   real see-through: it is a solid inkable block.
5. **The pump sets' detail is painted** (drum, flanges, nameplate in the shader). A modelled drum would sit over inkable
   faces. Only the stubs, handwheel and gauge are props.
6. **The grand stair's nosing** is the review's first option (a block, like penguin-nosing), not clipping the cells. It is
   0.5 m deep (r 20.95 → 21.5), so its court edge sits where the cells ran out.
7. **The deck ramp also got the stairs' string-course** for consistency, though the sweep marked its timber skirting ok.
8. **The Kelp Balcony's** dressed faces are its outer face and its segments' sides, as the promenade sees them.

## 4. Online and bots

- **Nothing that crosses the wire changed.** No record, rule or pipe changed. The one level block added (the nosing) is in
  the layout every client builds. The new art is built from geo.js numbers and placements on every screen.
- **Bots** see the nosing as a 0.27 m lip at the stair's head, under stepUp. Nav and climb-audit are unchanged, spawn →
  mid is unchanged, and the match ran with stuck 0.1 %.
- **Not touched:** LEAD-NOTES' new Zone Control bot item (bots wedged at the Great Tank's rim, pipes on). Its notes put it
  in a bots round after this one.

## 5. Commits and files

| Commit | What |
|---|---|
| cd0e9bf0, 0ada5d71 | (scratch) The before sweep sheets `r5-sweep-*` (99 views, 40 BARE; the second adds two views found during the sweep). |
| 1398523c | The sweep's bare pieces drawn under the ink (`floorart.js`, `geo.js` numbers), and both nits. |
| 4182e840 | The props (`dress.js`: plate, PENGUIN POINT plaque, basking lumps, pump pipework, rake trim, the hut's windows; `props.js` placements). |
| b471f9d4 | The grand stair's granite nosing (`layout.js`), `baked.js`, both AO lightmaps re-baked. |
| aec8c0e1 | `tests/aquarium-art.js` section 9. Its message says 10 checks; it is 8. |
| 938a2458 | The stage art cards. |
| beb4cb23 | (scratch) The pictures. |

**Files, for the integrator.**
- **Shared files touched: none.** Everything is in `src/world/stages/aquarium/` (`floorart.js`, `geo.js`, `layout.js`,
  `baked.js`, `dress.js`, `props.js`), `assets/lightmaps/aquarium{,.tower}.{png,json}`,
  `assets/stages/aquarium-*.webp` and `tools/botlab/tests/aquarium-art.js`.
- `assets/stages/manifest.json` still has no aquarium entry; the game doesn't read it.

## 6. Unfinished, uncertain, worth knowing

- **tests/pipes.js 91/92**: the Gulper Run's ride camera keeps the rider in view on 86.8 % of frames (bar 90 %). It is
  identical at the round's starting head, so it predates this round, but someone should own it before merge.
- **Triangles +49 k** (props, about 3 % of a frame, mostly the plates' letters). No draw call added. The lead's call.
- **Camping 2.9×** in this round's one match (single-match noise; the lead's 2.5 → 3.5 s cooldown is due at integration).
- **The basking rock's outline** stays square (decision 3).
- **The topiary's steps** still show a faint line where the 9 cm steps meet, now inside one bed.
- **Not re-run:** the boss check, tower-check / tower-match, net tests and the dusk glow probe. Nothing they measure
  changed beyond the nosing.
- **The ink-proof camera on the pavilion's flank wall** missed its splat (the splat point fell inside the block). The
  rockwork, dais, Ticket Hall, stair flanks, pump sets, ice pile and deckchairs show the ink over the art, and section 9
  checks it on the rockwork by pixel.
- **`tools/botlab/shoot.cjs`** still writes stale frames under load. Round 4's two-step wait is in the scratch copy; the
  shared tool is unchanged.
- Kept from earlier rounds: the bathysphere's plaque is blank; the boss check's "home ground is the Ocean Court" (the
  lead's call).
