# Gulper Aquarium, art phase: report after fix round 8 (review 8's list)

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`, from a2f28b8d plus the lead's notes
(26f2c715). The round answers LEAD-NOTES "After review 8" (binding) and `LEAD-REVIEW.json` (review 8), item by item.
Code head **b9940483** (tool 184cef7e, art de2be81b, test b9940483), pictures 5477a9f2.

How it ran:
- **Where:** all local, one Electron at a time under SLOTS=3, WATCHDOG=900000 on page tests, load 3–26 (mostly 4–8).
  No Mac mini job, nothing pushed. No online or audio test was needed (nothing crosses the wire).
- **Before / after:** "before" is a clean `git archive` of a2f28b8d (`scratchpad/aqr9/before`) with this round's sweep
  tool and test copied in; "after" is the code head. Same cameras, same tool, same settings.
- **Untouched:** the lead's untracked `LEAD-REVIEW*.json`, `wip` still on, no layout, collider, nav or lightmap change
  (layoutHash fe6fba15, 1936 blocks, 4778 nav nodes, before and after).

## 1. Review 8's list, item by item

| Item | What it is now | Proof (out/art/) |
|---|---|---|
| **1. The Express OUT stop** (major, a bug) | Its long-face speed lines were drawn at 0.62 m in the foundations' frame, inside Penguin Point's 1.2 m rock terrace. They now stand **0.62 m over the stop's own floor (1.82 / 1.96 / 2.10)**, 4.5 cm deep, and run across the corner pilasters. The kiosk pass is on **both long faces**: a black-granite skirting 1.2 → 1.36 with a brass line (round the back too, not across the mouth face where the nozzle is); a **0.18 m square render pilaster at each of the four corners**, 2 cm proud of both faces, fluted, capped under the roof cap; a **brass-ringed porthole either side of the TUBEWAY roundel** (r 0.27, dark glass); and a **framed navy ARRIVALS / FROM FERRY PLAZA plate** over the roundel (3.74–4.16). New prop `aquarium_stopfaces`. The OUT block in `aquarium_stops` keeps its cap, collar and roundels; its old lines are gone. | `r8-named-*-000-xs-out-court`, `-001-xs-out-wide`, `-004-xs-out-glass` (day, dusk, Bravo day, Bravo dusk); `r8-sweep-*-131-express-stop-out.0`, `-112-keeper-hut.0` |
| **2a. The Ticket Hall booth's render base** (minor) | A black-granite skirting 1.2 → 1.34 with a brass line. A **fluted 0.16 m render pilaster at each corner**, up to the glazing. **Three faience speed lines** (1.90 / 1.97 / 2.04) round all four faces and across the pilasters; they replace its one teal band. On **both TICKETS faces**: a brass counter ledge under the glass (2.16) with a speaking grille on the glass, and the navy and brass price plate **ADULTS 2 SHELLS / CHILDREN 1 SHELL** (1.47–1.83). On both x faces a recessed panel line; on the plaza face (+x, on the hall's edge) a **TICKET OFFICE / FERRIES · TUBEWAY · EXHIBITS** plate in it. New prop `aquarium_boothbase`. | `r8-named-*-002-xs-booth-base`; `r8-sweep-*-087-ticket-booth.0`, `-084-ticket-hall.0`, `-085-ticket-stair.0`, `-092-canopy-column.1` |
| **2b. The Reef Window's short west run and the Service face** (minor) | **The short run's outer face** (r 32.55, the Gate Terrace's side) takes the pylon wing face's language: a granite skirting 0 → 0.16 with a brass line, the three faience speed lines at its 0.62 / 0.76 / 0.90, a **render pilaster at both its corners** (α −70 as asked, and −67), and a **REEF HALL / ← SERVICE GATE** plate. **The jambs:** the window's ends were open, and the reef showed in section through them: at α −70 beside the pylon and at the Service Gate's −67 and −58. Each end is now a **render jamb over a granite foot**, with the speed lines across it, a brass line, and a fluted rib up its middle as on the wing face. The −58 corner has its pilaster and the metre of outer face the pump wall leaves open. New prop `aquarium_reefjambs`. **The reef behind:** rocks and corals planted near an end reached up to 0.3 m past it and stood out into the gate. A coral by the −58 jamb showed through the outer wall's corner. `looks.js` now presses every reef vertex flat onto its end chord's plane and keeps it inside r 32.28 (the outer wall starts at 32.3). Only vertices move; the triangle count is the same. | `r8-named-*-005-xg-gate`, `-006-xr-west`, `-007-xr-jamb58`; `r8-sweep-*-035-pylon.0`, `-051-window-kerb.0`, `-053-reef-window.0`, `-054-reef-window.1`, `-055-coral.0`, `-057-clam.0` |
| **3. aquarium-art.js 8(c)** (flaky) | Section 8 now runs with the bots' brains off (as sections 9–11 do) and clears their projectiles, subs and specials. Each planter view clears the paint and hides the actors' bodies, then restores them. The threshold is unchanged. **3 runs clean at the head:** Bravo's planter body [100, 100, 99] and plinth [5, 16, 30] in all three. It passes at a2f28b8d too. | §4 |
| **4a. Nit: the dusk sheet titles** | The r7 dusk sheets said "day" because a `SHEETS_ONLY=1` re-draw took `TIME`'s default. The tool now writes `OUT/run.json` when it shoots, and a re-draw titles its sheets with that time of day. Proof: the before dusk set, re-drawn with no `TIME`, says "dusk". | `r8-title-check-sheetsonly-dusk`; every `r8-named-dusk*` / `r8-sweep-dusk-*` title |
| **4b. Nit: the three sweep cameras against a face** | `stage-sweep.cjs` drops an eye whose frame is walled by another piece. Nine rays cross the frame's middle (±20° yaw, ±12° pitch). An eye is dropped if three or more meet another block's wall within 1.2 m, or four or more meet one nearer than 0.8 × the target's distance. Floors don't count. On this stage the rule moves **13 of 516 cameras** and drops one. **sea-coping.0.1** moves 2 m off the IN stop's face. **pipe-glass.4.2** moves off the Lookout balustrade. **drum-glass.1.5** looked into the pump housing 1 m in front of it and had no other eye in its sector, so drum-glass.1 keeps 5 views. The set is now 515 views of the same 169 clusters, the same 14 with no eye-level view. README updated. | `r8-sweep-nudged-cameras` (review 8's shot \| the nudged one) |

**Picture names.** `r8-named-<day|dusk|dayB|duskB>-<nnn>-<group>.jpg`: the review's x8 + x9 cameras plus four of mine
(`xr-west-0…2` on the short run's outer face and α −70 corner, `xr-jamb58-0` into the −58 jamb), each sheet BEFORE
(a2f28b8d) over AFTER with every view's changed share. `r8-sweep-<time>-<nnn>-<cluster>.jpg`: the sweep's own sheets for
the clusters this round changed, and the three nudged ones. The full sets (155 sheets × day / dusk / Bravo day) are in
`scratchpad/aqr9/sweep/{b,a}-sweep-*`.

## 2. Decisions where the list left a gap

1. **The OUT stop took both the portholes and the plate** (the review offered either). The portholes flank the roundel at
   eye level from the terrace. The plate sits over the roundel, under the render's own 4.62 m lines; under it there was
   no room between the speed lines and the roundel.
2. **The OUT stop's speed lines are 4.5 cm deep and run across the pilasters** (to ±2.33 m), as on the kiosks' friezes.
   The review's `speed(B, -2.2, 2.2, 1.82)` would have stopped them 6 cm into the pilasters' fronts. They moved into the
   new `aquarium_stopfaces` so section 12 checks them with the rest. The skirting stops at the mouth face's corners: the
   nozzle's ring is there.
3. **The booth's three speed lines replace its one band** (at 2.0). Two band styles on 1 m of base would have clashed. The
   grille sits on the glass above the ledge, the only place a speaking grille works. It reaches 2.6 m, under the
   block's 3.7 top.
4. **The Reef Window's ends became jambs** (the review named the −67 jamb, the −58 for symmetry and the −70 corner). In
   section, all three ends were open views into the reef, so all three are closed the same way. The jambs carry a fluted
   rib so 4.4 m of render does not read bare. The short run's outer face got a plate (REEF HALL / ← SERVICE GATE), per
   the lead's "a plate"; the arrow points through the gate.
5. **The reef pieces are pressed flat at the window's ends** rather than re-planted. Re-planting (`reefPlan`) would move
   every piece after the first change in the seeded plan. Flattening moves only the vertices past an end, and the jamb
   now covers that plane.
6. **The 8.5 cm budget on the Reef Window is measured from the window's block** (its chord faces). The outer wall slab
   from art round 1 already stands 6.1–6.9 cm off it, so the new skirting, lines and plate are 0.8–1.8 cm thick. The
   farthest vertex of the round is 8.2 cm off its block.
7. **New prop types** (`aquarium_stopfaces`, `aquarium_boothbase`, `aquarium_reefjambs`), as in rounds 5–7, so section 12
   checks this round's parts alone.
8. **The nudge is a rule in the tool, not three hand-moved cameras.** Every later stage review runs the same rule. The
   one-line explanation for each moved camera is the frame-walling count; `r8-sweep-nudged-cameras` shows the three.
9. **The cards were not re-made.** The art camera's before / after (`r8-card-check`, 1920 × 1080, DEFAULT_SETTINGS) moves
   0.30 % of its pixels by day and 0.19 % at dusk. All of them are bubbles, fish and jellies; none of this round's
   pieces is in the card's view.

## 3. Online and bots

- **Nothing crosses the wire.** Every new piece is a prop built from layout numbers on every screen. No record, rule,
  collider, nav edge or pipe changed. The reef's change is in a looks mesh.
- **Bots:** their world is the same (0 colliders added: 292 placements, 0 colliders). In the match below stuck was 0 %,
  giveUps 0.

## 4. Tests and results (all local)

| Check | Result |
|---|---|
| tests/aquarium-art.js at the head, **3 runs** | **54/54, 54/54, 54/54**: the 50 earlier checks and section 12's 4. Programs link, 0 console errors. |
| The same test on the clean a2f28b8d copy | **50/54**: exactly section 12's four checks fail (OUT stop lines, booth plates and skirting, Reef Window lines on the face and jambs, this round's props). 8(c) passes there too. |
| tests/pipes.js | **92/92** |
| Turf War ×1, 180 s, PAGEQ=pipestats | See below |
| The sweep, before / after | 515 views, day / dusk / Bravo day; CHANGED 34 / 36 / 37 (below) |
| The named cameras, before / after | 23 views, 8 groups × 4 sets; CHANGED 7 of 8 in every set (the bund end, not touched, is the 8th) |
| The art camera | 0.30 % (day) / 0.19 % (dusk) of pixels moved, all animated water life; the tool's CHANGED 0 |

**Section 12's reads (both halves; values from run 3):**
- **(a) The OUT stop's middle line** (1.96) against the render gap (1.89), green minus red, on the court face from 2.6 m and
  on the glass face from the 0.8 m strip: d 23–44 at the head. At a2f28b8d d is −2…2 (render on both).
- **(b) The booth:** the price plates' median luminance 15 against the pilaster's 85–88, blue (b − r 41–42), on both
  TICKETS faces. The plaza face's skirting reads 12 against 87–90. At a2f28b8d plate = pilaster = 101–102 (the base's
  render).
- **(c) The Reef Window:** the short run's outer-face line d 26–33. The −67 and −58 jambs' line d 25–44. At a2f28b8d the
  outer face reads 0, and the jambs read −9…2 (the reef behind the open ends).
- **(d) This round's props:** 6 placements, 31,256 vertices; farthest 8.2 cm from their blocks (OUT stop 8.0, booth 7.8,
  window 8.2); 0 over a block's top. At a2f28b8d there are no placements.

**Turf War ×1, 180 s, PAGEQ=pipestats:**
- Turf 39.8 / 29.6. Stuck 0 %. Splats 37. Frame errors 0.
- Rides 17 (0.71 per bot-minute). giveUps 0, longest push at a mouth 1.05 s.
- High-ground arrivals by pipe 15.9 % (7/44), inside the 10–35 % target.
- Camping: 3 deaths within 2 s of 17 landings, 0.176 per landing against a base of 0.051. That is 3 events in one match
  (r7's match: 0.96×), and the lead's open item, the exit cooldown of 3.5 s, lands at integration.
- The only console lines are the 7 pipestats lines.

**The sweep's CHANGED list.** It is this round's pieces and the clusters whose views see them:
- the pylon's wing face, window kerb and Reef Window, and the corals and clam seen through the glass at the window's ends;
- the Ticket Hall with its stair, queue step, booth, scale, turnstiles, canopy column, ticket machines and A-board;
- the keeper's hut, the OUT stop, Penguin Point's rocks and glass, the Penguin Steps, the planters, the ice-cream cart and
  the Pump Hall's salt crates and truss column (they see the stop or the booth).

Under 2 %, the list also holds the animated water named in the tool's header: the bubble column, the kelp drums' glass,
the Tubeway glass, and in Bravo's day the Feeding Step and a gulper neck (1.3–1.4 %, views through the tank's water).

**Triangles.** A headless count of every placement, both halves:

| Props | Triangles |
|---|---|
| a2f28b8d | 539,596 |
| Now | 562,340 |
| **Change** | **+22,744 (+4.2 %)** |

There are still 6 material buckets, so no draw call was added. The reef mesh's triangle count is unchanged (only
vertices moved).

## 5. Commits and files

| Commit | What |
|---|---|
| 184cef7e | `tools/botlab/stage-sweep.cjs`: the frame-walling rule, the SHEETS_ONLY titles; README "Stages" entry |
| de2be81b | The art: `arch.js` (`aquarium_stopfaces`, `aquarium_boothbase`, `aquarium_reefjambs`; the OUT stop's old lines and the booth's band removed), `props.js` (three placements), `looks.js` (the reef pressed inside the window's ends) |
| b9940483 | `tests/aquarium-art.js`: section 8's bots off and paint cleared; section 12 |
| 5477a9f2 | (scratch) The 83 r8- pictures and the three cluster lists |
| this report's commit | (scratch) This report |

**Files, for the integrator.**
- **Shared files touched:** `tools/botlab/stage-sweep.cjs` and `tools/botlab/README.md` (its entry). No game shared file.
- **Everything else:** `src/world/stages/aquarium/` (`arch.js`, `props.js`, `looks.js`) and `tools/botlab/tests/aquarium-art.js`.

## 6. Unfinished, uncertain, worth knowing

- **The camera rule changes the sweep's camera set:** 13 cameras moved and 1 dropped, against review 7 / 8's 516. A
  reviewer comparing with review 8's own sheets will see those 14 views differ. Everything in this round's before / after
  used the new set on both sides.
- **pipe-glass.4.2 still looks over the grand stair's nosing.** It moved 1 m and the balustrade no longer walls its right
  side. Its target is the box corner of a big diagonal cluster (the Tubeway pipe's glass), and that corner lies in open
  air. A look-at-the-nearest-block rule would fix that class, but it would move many more cameras; I left it.
- **The −58 jamb's outer metre** (between the jamb and the pump wall) has skirting and lines. Beyond it the long run's
  outer face is behind the pump wall, unseen.
- **The OUT stop's portholes read bright at dusk** in Bravo's set (`r8-named-duskB-001`): the glass is gloss and catches
  the sky. They are not lit.
- **The camping number in the one match** (3 of 17 landings) is noise-sized. The camping question is the consolidated
  balance pass's.
- **Not re-run:** check-maps, climb-audit, cover-map, stage-audit, the boss check and the net tests. No layout, collider,
  nav or lightmap changed.
