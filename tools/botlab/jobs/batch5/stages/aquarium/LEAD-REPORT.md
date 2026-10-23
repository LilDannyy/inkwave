# Gulper Aquarium, art phase: report after fix round 7 (review 7's list)

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`, from de3bd111 plus the lead's notes
(30bb0f77). The round answers LEAD-NOTES "After review 7" (binding, done in its order) and `LEAD-REVIEW.json` (review 7).
Code head **207796cf** (art c6ef92de + 1fba49ff, test bdc942bd, cards 207796cf), pictures 22c302ee.

How it ran:
- **Order kept:** the sweep became a repo tool first (ea8915fd), then the booth glazing (1fba49ff), then the kiosks and
  the scale (c6ef92de), then the proofs (test bdc942bd, the cards, the pictures).
- **Where it ran:** all local, under SLOTS=3, WATCHDOG=900000 on page tests, load 5 to 55. No Mac mini job; nothing pushed.
- **One slip:** for about ten minutes two of my Electron instances overlapped (a determinism check of the sweep tool while
  a background re-shoot was still finishing). Both ran clean. Every committed picture comes from the last set, which ran
  strictly one at a time.
- **Before / after:** "before" is a clean `git archive` of de3bd111 (`scratchpad/aqr8/before`, with the new tool and test
  copied in); "after" is the code head. Same cameras, same tool, same settings.
- **Untouched:** the lead's untracked `LEAD-REVIEW*.json`. `wip` still on. No layout, collider, nav or lightmap change.

## 1. Review 7's list, item by item

| Item | What it is now | Proof (out/art/) |
|---|---|---|
| **1. The sweep as a repo tool** | `tools/botlab/stage-sweep.cjs` (MAP=, TIME=, OUT=), documented in `tools/botlab/README.md` under "Stages". The reviewer's algorithm is unchanged: tagged blocks of Alpha's half, same-tag clusters by gaps under 1 m, 3–8 eye positions per cluster 1.7 m over walkable nav nodes 1–8 m off, line of sight checked. **New:** one contact sheet per cluster (in the page, no Python); `clusters.txt` lists the clusters with NO EYE-LEVEL VIEW first; `VIEWS=` re-shoots a run's cameras and `BEFORE=` pairs before over after with each view's changed share; a CHANGED list; `TWIN=1` (Bravo); `SHEETS_ONLY=1`. **Made deterministic** so before / after means something: one team palette, the bots' brains off from the start (a sprinkler laid in the first second had inked views), effects cleared per view, the match / environment / Tubeway-looks clocks set per view, and the page's `performance.now` standing still while shooting. Two runs of one tree now differ by 0.6 % of a frame at most, except the animated water (below). On this stage it finds review 7's numbers: **516 views of 155 clusters, and the same 14 clusters with no eye-level view** (gantry beam, winch house, bathysphere, arch tank, five vault ribs, two drum crowns, a drum foot, the ticket canopy, the pump roof). | `r7-sweep-<day/dusk/dayB>-clusters.txt` (all 169 clusters, the no-view list, the CHANGED list) |
| **2. The booth's glazing** (bug) | `arch.js`: the glass is now **1.88 × 1.2 × 2.08**, so 4 cm proud of every face of its block (it was 1.96 deep, 2 cm inside the z faces). The mullions sit at z −42.05 / −39.95 and x 8.16 / 9.1 / 10.04, 3.5 cm proud of the glass. The TICKETS letters at z −42.17 / −39.83 stay in front. The TODAY'S FEEDINGS board moved from x 8.18 to 8.155 so it stays in front of the new glass on the x face. Both halves (the hall is mirrored). | `r7-named-<day/dusk/dayB/duskB>-002-booth-z`, `-003-booth-z2`, `-009-ring-booth`; `r7-sweep-*-087-ticket-booth.0` |
| **3a. The ice-cream kiosks** (major) | **Every face** (new prop `aquarium_kioskfaces`, same blocks, same frames): a black-granite skirting with a brass line round the foot; a square render corner pilaster on each corner (0.18 wide, 2 cm proud of the body) with a fluted line up each outer face; a render frieze under the cornice with **three faience speed lines** round every face and across the pilasters. **Back** (the Penguin Steps' centrepiece): the flavours board in the cart's GELATO style, 1.9 × 0.92 m at 1.06–1.98 m. It has cream ICE CREAM over CORNETS · WAFERS · 2 SCOOPS on sea-green in a brass frame, a painted cone roundel and five coloured scoops. **Each side:** a closed roller shutter (ten stripes in the awning's cream and faience, slat lines, a render box over it, steel guide rails, a brass bottom rail and pull). | `r7-named-*-000-psteps-head`, `-001-psteps-foot`, `-004-icek-back`, `-005-ring-icekiosk`; `r7-sweep-*-077-kiosk.1`, `-081-penguin-steps.0`, `-082-penguin-nosing.0` |
| **3b. The other kiosks' backs** (minor) | The same skirting, pilasters, frieze and speed lines on every face. **Souvenir kiosks** (S. Promenade and ferry plaza): on the back a framed GULPER AQUARIUM / GIFTS poster on sea-blue with a plush shark in low relief (grey, white belly, fins, eye). **Ferry kiosk:** on the back the FERRY TO INKOPOLIS / SAILINGS EVERY 20 MINUTES route board in the Ticket Hall plate's navy and brass (a route line, AQUARIUM and INKOPOLIS stops, a ferry on it). On its free side (local −x; the timetable pillar covers the front of the other) a navy porthole service door: brass ring, glass, kick plate, handle, hinges, STAFF ONLY. On its front the window reaches into the frieze, so there the speed lines run only across the pilasters. | `r7-named-*-006-ring-souvkiosk`, `-010-ring-psouv`, `-008-ring-ferryk`; `r7-sweep-*-076-kiosk.0`, `-129-souvenir-kiosk.0`, `-120-ferry-kiosk.0`, `-121-timetable.0`, `-122-trolleys.0` |
| **3c. The luggage scale** (minor) | **Under the ink** (`floorart.js`, Alpha's frame, both halves): a recessed riveted panel on every face (a raised frame 9 cm wide above the kick plate, the recess's shadow line and lit edge, rivets every 10 cm down the frame's middle). On the two long faces, **LUGGAGE / WEIGH HERE / MAX 25 KG** in a 5 × 7 stencil letter (a small int-array font in the shader, 12.6 / 8.4 / 8.4 cm tall, at 1.72–2.13 m). **Props** (`aquarium_scaletrim`): a brass kick plate with rivets along every face's foot and the maker's plate (INKOPOLIS SCALE CO. / EST. 1936 · NO. 47) on the back; 1.4 cm proud at most, under 2.4. | `r7-named-*-011-ring-lscale`; `r7-sweep-*-088-luggage-scale.0`, `-090-turnstile.0`, `-092-canopy-column.1` |
| **4. Proofs** | The review's named cameras re-shot before / after, day and dusk, both halves; aquarium-art.js section 11 (pixel reads that fail at de3bd111); pipes.js; one Turf War match. **The cards were re-made**, because the card view changed: the S. Promenade's two kiosks sit at its left edge, and their pilasters, frieze and the ice-cream shutter show. | §4 below; `r7-card-pair-day/-dusk` (old \| new), `r7-card-crop-day/-dusk` (the left edge, 2×), `r7-card-check` (the art camera at DEFAULT_SETTINGS, changed pixels in red) |

**Picture names.** `r7-sweep-<time>-<nnn>-<cluster>.jpg` is the sweep's own sheet for one cluster: every view BEFORE
(de3bd111) over AFTER, each labelled with its eye position and changed share. `r7-named-<time>-<nnn>-<view group>.jpg`
is the same for review 7's named cameras: the x3 set (psteps-head/foot, booth-z/z2, icek-back) and its rings
(ice-cream, S. Promenade souvenir, whale bench, ferry, booth, plaza souvenir, luggage scale). `dayB` / `duskB` are Bravo's
twins. The full sets (155 sheets × day / dusk / Bravo day, before and after) are in
`scratchpad/aqr8/sweep/{b3,a3}-sweep-*`; the tool re-makes them in about 5 minutes per set.

## 2. Decisions where the list left a gap

1. **The corner pilasters are 0.18 m square, not 0.12.** The kiosk body is a box with 18 cm chamfers on every edge, and
   the block's own darker cream showed at every corner, foot and head (the "frame" in review 7's pictures). A 0.18 square
   pilaster covers the chamfer and the block's corner, and stands 2 cm proud of the body as asked (5 cm from the block).
   The skirting and the frieze cover the foot and head chamfers the same way.
2. **The speed lines sit on a frieze** under the cornice: three faience lines, 3.5 cm each, the top one 3 cm under the
   cornice. They wrap every face and cross the pilasters. The kiosks' existing knee bands are kept.
3. **The ice-cream sides took the shutter**, not the poster. The souvenir backs took the poster, not a third shelf. The
   ferry kiosk's back took the route board and its free side the porthole door, as the review offered.
4. **The ferry kiosk's front:** its serving window (1.1–2.0 m on a 2.4 m kiosk) reaches into the frieze band, so the front
   has no frieze. Its speed lines run across the two front pilasters only.
5. **The stencil reads MAX 25 KG**, upper case: a stencil face has no lower case, and the 5 × 7 letter is upper-case
   only. The maker's plate is a prop on the back (the review's optional dress.js item), not a floorart line. The riveted
   panel is drawn on all four faces, so the dial face matches.
6. **The new pieces are their own prop types** (`aquarium_kioskfaces`, `aquarium_scaletrim`), placed in the same frames as
   the kiosks and the scale. Section 11 can then check this round's parts alone for the 8.5 cm and cornice rules, as
   rounds 5 and 6 did.
7. **The cards.** The art camera's before / after showed the left-edge kiosks changed, so the cards were re-made the
   round-6 way: the same hero scene, quality low, 3840 × 2160, cwebp -q 86 at 1920 × 1080 and 480 × 270. Elsewhere the
   card differs only where the scene animates (gulls, the drums' bubbles and fish, the sea).
8. **The sweep's change measure** is the share of a frame whose pixels moved by more than 20/255 at 320 × 180. The mean
   difference hid the scale's stencil. CHANGE defaults to 1 %.

## 3. Online and bots

- **Nothing crosses the wire.** Every new piece is a prop or a shader face built from layout numbers on every screen. No
  record, rule, collider, nav edge or pipe changed. The scale's faces are the same inkable faces; the art is under the ink
  (section 11 inks one).
- **Bots:** no collider changed, so their world is the same. The match below: stuck 0.4 %, giveUps 0.
- **Not touched:** the Zone Control tank-rim bot bug (LEAD-NOTES: the beta fix round).

## 4. Tests and results (all local)

| Check | Result |
|---|---|
| tests/aquarium-art.js at the code head | **50/50**: the 43 earlier checks and section 11's 7. Programs link, 0 console errors. |
| The same test file on the clean de3bd111 copy | **44/50**: section 11's six new checks fail (booth, kiosk boards, frieze lines, shutters / doors, the scale, this round's props). The seventh is the ink guard on the scale, which passes on a plain face too. |
| tests/pipes.js | **92/92** |
| Turf War ×1, 180 s, PAGEQ=pipestats | See below |
| The sweep, before / after (b3 → a3) | Day 38 clusters over 1 %, dusk 38, Bravo day 37. See below. |

**Section 11's reads:**
- **(a) The booth:** both TICKETS faces at 2.8 m read the teal glass, darker than the render base under it and blue, both
  halves: [3, 33, 51] against a base of [90, 103, 121]. At de3bd111 they read the block's render, [89, 98, 104].
- **(b) Every kiosk's back:** its board is darker than the render pilaster at its corner. The board's median against the
  pilaster: ice cream 53 / 183, souvenir 60 / 185, ferry 19 / 114, plaza 38 / 112, with Bravo's in shade. At de3bd111:
  206 / 200.
- **(c) The frieze's speed lines** on every back are greener than the render between them.
- **(d) The ice-cream shutters** swing between cream and faience along a row (span 27–36). The ferry doors are navy and
  dark against the pilaster.
- **(e) The scale's long faces:** the LUGGAGE line's darkest letter is under half its brightest panel, and the back's
  frame is lighter than its panel (95 / 81 and 45 / 38).
- **(f)** Ink splatted on the scale shows over it (moved 227).
- **(g) This round's props:** 10 placements, 39,364 vertices; farthest 8.3 cm from their blocks, 0 over a kiosk's
  cornice or the scale's top.

**Turf War ×1, 180 s, PAGEQ=pipestats:**
- Turf 43 / 33.4. Stuck 0.4 %: the longest episode is 2.25 s, a shooter at the Pump Hall (15.4, 0, −35.1), nowhere near
  this round's pieces. Splats 34. Frame errors 0.
- Rides 22 (0.92 per bot-minute). giveUps 0, longest push at a mouth 0.42 s.
- High-ground arrivals by pipe 29.7 % (11/37).
- Camping 0.045 per landing against a base of 0.047, so 0.96×.
- The only console lines are the 7 pipestats lines.

**The sweep, before / after.** What changed is the kiosk family and the clusters whose views look at it: the two
promenade kiosks, the Penguin Steps and their nosing, the Lookout, the telescope bay, the balustrade, the grand stair, the
deep Kelp stop, the booth, the scale, the turnstiles, the canopy columns, the Ticket Hall's stair and queue, the ferry
kiosk, the timetable, the trolleys, the plaza souvenir kiosk, the A-boards, the spawn deck's fascia and coping. On Bravo's
half the Great Tank's glass and the Feeding Step (1.2–1.7 %) are in the list too: their views see a kiosk board through
the tank.

Three clusters are animated water: the bubble column 1.4–2.8 %, the kelp drums 1.1–1.3 % and one Tubeway glass 1.5–1.8 %.
Their bubbles keep a phase from the boot that the tool cannot reach, so they drift between any two runs. The proof is
`r7-sweep-day-drift-039-bubble-column.0` and `-058-drum-glass.0`, and the README says so. Every other unchanged cluster
moved under 1 %.

**Triangles.** A headless count of every placement, both halves:

| Props | Triangles |
|---|---|
| de3bd111 | 510,088 |
| Now | 539,596 |
| **Change** | **+29,508 (+5.8 %)** |

The +29,508 is the kiosks' faces 24,868 (mostly the boards' letters) and the scale's trim 4,640. No new material bucket,
so no draw call added. Performance was closed at 18 % under Halyard on triangles.

## 5. Commits and files

| Commit | What |
|---|---|
| ea8915fd, 7bc1113a, 77f17ca4, dd4d953c, 85d7a0c9, b2350001 | `tools/botlab/stage-sweep.cjs` and its README entry: the tool, then its fixes and determinism |
| 1fba49ff | The booth's glazing (`arch.js`) |
| c6ef92de | The kiosks and the scale (`dress.js`, `props.js`, `floorart.js`) |
| bdc942bd | `tests/aquarium-art.js` section 11 |
| 207796cf | The stage art cards (`assets/stages/aquarium-{day,dusk}{,-sm}.webp`) |
| 22c302ee | (scratch) The 94 r7- pictures and lists |
| this report's commit | (scratch) This report |

**Files, for the integrator.**
- **Shared files touched:** `tools/botlab/README.md` (one new entry under "Stages") and the new `tools/botlab/stage-sweep.cjs`.
  No game shared file.
- **Everything else:** `src/world/stages/aquarium/` (`arch.js`, `dress.js`, `props.js`, `floorart.js`),
  `tools/botlab/tests/aquarium-art.js` and `assets/stages/aquarium-*.webp`.

## 6. Unfinished, uncertain, worth knowing

- **The scale's change is small at sweep distance:** 1.3–1.6 % of its views, about the animated water's drift. It shows
  plainly in the named rings (`r7-named-*-011-ring-lscale`) and in section 11. In Bravo's dusk named set it stays under
  1 %, so that set's CHANGED list omits it.
- **The sweep is not fully deterministic** on this stage's animated water (above). A stage with similar wall-clock
  animation will show the same drift. The README names it.
- **The ferry kiosk's free side** stands behind a luggage trolley: from the plaza the door's lower half and kick plate are
  hidden (`r7-named-*-008-ring-ferryk`, rings 4 and 5). The route board on the back reads clear over the trolleys
  (rings 6 and 7).
- **The shutter's guide rails** read darker than steel (the metal bucket's reflection).
- **Not re-run:** check-maps, climb-audit, cover-map, stage-audit, the boss check and the net tests. No layout, collider,
  nav or lightmap changed.
- **The two overlapping Electron instances** (above) are the one place this round broke the one-at-a-time rule.
