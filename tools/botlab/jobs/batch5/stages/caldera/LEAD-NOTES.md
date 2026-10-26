
## After the lava engine's third review (2026-10-16): the lead's decisions for fix round 3

The lava is ready for play in Turf War, Zone Control and Tower Command (the reviewer would let the user play it). Round 3
closes what is left, in this order. Everything else in review 3's list stands as written there.

1. **Bots off dry edges** (review 3 issue 1). Close the three remaining ways (squid swimming at speed with the lava
   look-ahead; a route's own hop within 1.5 m of the lava only when its arc lands on the target node's top; a blade or
   twins jump while firing gets the roll's arc check). **The gate**, decided: `lava-bots.js` twice in a row with 0
   deaths during an escape (an escape death is unfair) and at most 1 fight death per 360 bot-trials in total, plus 0
   lava deaths over 4 bot matches (2 Turf War, 2 Zone Control). "20 of 20" in every scenario is not required: the
   design target (≤ 0.25 lava deaths per bot per 3:00) is already met in play.
2. **Merge b5-int3** at its head when you start (record the sha; the wave 2 polish is still committing there, so a
   later merge will follow at integration). Then: `karpStates()` on the lava module (`[{ key: 'low' | 'high',
   nodeOk(id) }]` from `restMask`), served through the registry and written into docs/STAGE-MODS.md; `lava.js` E1
   extended to the Scrap Sentry, a Chain Bobber chain over the lava and a Glide Bomb sinking with no paint; a new
   `lava-karp.js` (SPEC §5.5: the field switches at `lava:warn`; no rest or drop spot on lava-reachable ground at
   HIGH; a carrier on a drowning Slump gets the warning like anyone); re-run lava.js, net-lava.cjs and one match per
   mode on the merged code. **The HUD dock** (`DOCKS.bazookarp = 'karpDock'` with no `hud.karpDock`): that is the
   Bazookarp face package's to define; dock the lava chip under `.iw-kst` as the fallback only if it is a one-line
   change, and write the gap into your report for the integrator (`int4`).
3. **The boss** (issue 3). Build a Boss-only variant (`onlyIn: 'boss'`) that clears the island piers and the head
   dressing inside the clearance ring, so its home ground is one connected area of at least 800 m² (DESIGN §4.5 asks
   for about 1,300; 800 connected beats 1,300 in necks). Gate: `boss-check.js` 3 consecutive passes.
4. **Rule 44** (a plain running jump crosses a 4.5 m lava gap in three places per half; swim jumps cross 5.4–5.7 m
   gaps and save up to 45 m), decided: widen the three running-jump corners to ≥ 5.5 m (a plain running jump cannot
   cross; `lava-audit.js` rule 44 passes). A swim jump (own ink on the take-off, squid at speed) across a gap of
   ≤ 5.7 m is an accepted skill route **only where it saves at most 20 m** against the dry way round; where it saves
   more (the 45 m one), widen that gap to ≥ 6.5 m or put a `rail` lip on the take-off so the jump cannot be made.
   Dash Pellet jumps follow the same rule. Measure each gap and write the list into DESIGN.md §3 as the skill routes.
5. **Rule 45**: build the fitted region mask for one half and turn it 180°, so both halves share it.
6. **The tests**: net-lava's ink check compares grids at the results screen and judges lava cells against the same
   run's non-lava cells; lava-match's lookout check tests what its name says (`lookLong`); a bot fighting on a stone
   at HIGH steps toward the head along the Race's nodes instead of holding still (the "None at the Pumice Races"
   check); Slump crossing counts go to the balance pass.
7. **The pictures**: regenerate the `eng-*` set at the final head with the same scenes, plus a lavafall side view at
   LOW and HIGH and the Organ Pipes from the island at LOW and HIGH. The Organ Pipes' plain look is the art phase's.

## After review 5 (2026-10-17): the lead's decisions; the next round waits for the weekly usage reset (Friday 06:00)

Six of seven gates passed (no escape deaths in 720 trials, 0 lava deaths in 4 matches, the merge with karpStates,
the boss 5 in a row, rule 45, the tests, the pictures). Two things remain, and the round-3 rule-44 decision was wrong
on the facts (88–100 running places, not three; a swim jump reaches 8.65 m; squids pass rails). The next round is ONE
fix + ONE review, on exactly this list:

1. **Rule 44, decided again: option 1 of DESIGN §3.5.** Swim jumps and dash jumps over the lava are accepted as
   skill movement (own ink on the take-off, a squid at speed, over open lava: the risk is the price), and a Bazookarp
   carrier cannot make them. Plain running jumps are judged by the 20 m skill-route bar: no running jump may save more
   than 20 m. Today the largest saves 19.26 m (the East Pool deck-stair corner, (±13.5, 1.1, ∓6.5) → the island's deck
   stair): **add margin** by pulling back or kerbing that corner (and (±14.5, 1.4, ∓5.5)) so the largest running
   saving is under 15 m. Rewrite lava-audit's two rule-44 gates to this (running ≤ 20 m: a gate; swim / dash: listed,
   no gate), write the decision into DESIGN §3.5, and hand `out/fix4/rule44-crossings.json` to the Bazookarp checker
   (#16) through the stage's `karpStates` / hopVeto data so the carrier field never relies on a jump.
2. **Rule 21, the notches beside race1, race5 and race6 (both halves): a real fairness bug, fix it.** Close each
   0.7–2.4 m gap to a seam of ≤ 0.25 m (move the coping or the Lakefront out to the stone, or the stone in) or open
   it to ≥ 2.5 m of lava; keep the step links; re-run lava-audit rules 21 / 44 / 45 / 46, lava-nav, check-maps, the
   reviewer's probe-notch5b (walk and swim off every stone toward the static top: 0 deaths), lava-bots.js once, and
   2 Zone Control matches.
3. **The boss:** the gate is met; one more small step: make the west Lakefront wedge tip near (−15.3, −26.2) and its
   twin unreachable as a BossNav goal or anchor (a clearance test on the cell or a stage-side mask); then 5 passes in
   a row, not 10.
4. **lava.js F10** (the lookout claim, 1 fail in 2): give the foot wait its own time-out from the moment the Organ is
   climbable, and capture the claimant's trail when it fails; 3 runs clean.
5. **The lavafall:** blend the curtain rows' seam (the rectangular band); the void below the deck stays on the far
   scenery list for the art phase, but add the Spillway-bridge and Horn-Step viewpoints to lava-audit rule 42 so the
   backdrop gap is checked from where a player stands.
6. **Tests and docs:** net-lava bounds the live guest's non-lava cells again (ratio ≥ 0.999); lava-match's match
   table says when the lookout check passed for want of a long-range kit; STAGE-MODS.md gets the `b.hopCheck` row.
The Organ Pipes' plain look and the lavafall's far scenery are the art phase's (also after the reset).

## After review 6 (2026-10-23): the checks were too narrow; the carrier premise was wrong

Review 6 found both gates "passing" only because the audits look in too few places. This round, binding:
1. **Fix the checks first, then the stage.** lava-audit rule 44's march accepts any standable floor below the take-off
   down to the lava (not 1.3 m), includes take-offs whose edge drops onto a dry strip first, and tries 1.5 m and 0.8 m
   run-ups; rule 21 measures, for every standable top within 2.5 m of a stone, the true shortest distance across lava,
   corners included; lava-notch.js walks diagonals as the reviewer's probe-notch6 does. Both must reproduce review 6's
   finds before any geometry moves (the reviewer's probes in scratchpad/cal-rev6/probes/ are the reference).
2. **Rule 44 at Organ L's HIGH top** (running jumps saving up to 38.6 m, 24 over 20 m): a lookout must not be a
   launch pad across the lake. Close it by geometry on the lava side of that top (a parapet a kid cannot run-jump over
   on the lava-facing edges; it is a lookout, so keep the sightlines), or trim the far landings; the gate stands: no
   running jump saves over 20 m, the largest under 15 m. The deck-corner walk link stays.
3. **Rule 21 at the stone corners** (races 4, 6, 7, both halves): close each to a ≤ 0.25 m seam or open to ≥ 2.5 m,
   as the review lists them; the corrected audit and the diagonal notch test are the proof (0 deaths).
4. **Bazookarp carriers (the lead decides again):** the carrier CAN swim its own ink (SPEC S21, 9.44 m/s), so my
   sentence "a carrier makes neither" was false. Decision: carrier swim and dash jumps over lava are accepted as skill
   movement in general, the same as for everyone; what a carrier may bypass is judged PER STAGE by the Bazookarp
   checker's shortcut probes (#7d) when Highmark's Bazookarp layout is built: that layout must place the Pond, weirs
   and Gate so no carrier jump saves over 20 m on the carrier field or skips a weir, with rails where it must. Correct
   DESIGN §3.5 and lava-audit's information row now, and hand the carrier crossing list (probe-carry44) to
   `karp-stages/` for the layout builder.
5. **lava.js F10 / F8b:** the F10 claim is released or handed on when the claimant spends over 3 s in fight or refill
   after the top opens; trace and fix F8b's case A; 3 runs clean.
6. **The boss:** gate met (8 in a row); widen the far-half goal bias so one-half rounds become rarer; no new gate.
7. **net-lava.cjs** has never been run with its new bound: run it at a load average under 4, or push the scratch
   branch `botlab-b5-caldera` and let the Mac mini's runner do it (allowed this round; results come back on that
   branch). Rule 42 from the bridge and the lavafall side patch stay on the art-phase list.

## After review 7 (2026-10-24): the roof slide into the lava, air steering, the Mitts leap

Review 6's list holds (the corrected audits, the corners closed, carriers documented, F10 / F8b, the boss, net-lava
13/13 on the Mac mini). This round, binding:
1. **Roof tops must never slide a kid into the lava** (race 3's boulder kills 84 % of landings at HIGH; Organ L's
   stub 47 %): the engine fix the review prefers, in `actor._roofExit` / `_roofExitDist`: refuse a way off whose
   landing a stage hazard takes (`G.match.stage.wet` / the lava's `covers`), and hold the kid where it is when every
   way is refused; a short tagged hook, with a check (the reviewer's probe-roofslide7b: 0 deaths over every flat roof
   beside the lava at LOW and HIGH), and lava-audit gains that probe as a rule.
2. **Rule 44 with air steering:** the march tries ±45° / ±90° after about 8 frames for take-offs on rider tops, so it
   reproduces the crown's 16.5 m; then close the crown's north-east and north-west edges by geometry (the review's
   pipes) until no steered running jump saves over 15 m.
3. **The Mitts leap (the lead decides):** a leap is skill movement like a swim jump, accepted; but a leap off a roof
   top is not (the kit's jump must respect actor.js's roof gate), and a leap's landing must obey the bots' 2 s
   look-ahead (the lava-bots fight death: the air guard must not steer a kit leap). Write it into DESIGN §3.5 and the
   audit's information row; list leaps in rule 44's information.
4. **The carrier crossing list:** merge review 6's candidate set and say it is a lower bound that checker #7d must
   extend on the real layout.
5. **net-lava** at the final head, on the Mac mini (push `botlab-b5-caldera`), plus lava-bots once (≤ 1 fight death),
   lava.js twice, boss-check 5, 2 Zone Control matches, check-maps every variant; the crown pictures for the lead.

## After review 8 (2026-10-24): the roof hold's two faults; the lead's rule for cover standing in drowned ground

Review 7's list is met as worded; the new roof hold has two faults the probes outside the checks found. This round:
1. **Cover standing in drowned ground at HIGH (the Slump hornitos, the mould stack, the ladle stand), decided:** no
   hold, no fling, no perch. A kid who lands on an off-limits top whose every way off is lava is **rescued**, as the
   era engine rescues a kid over water: held 0.6 s where it stands (so the player sees what happened), then placed on
   the nearest dry valid node within 6 m with the rescue's brief invulnerability, never splatted, never thrown; the
   HUD's personal line says "NO FOOTING → rescued". A held kid is never flung: while held, the slide's clock is
   reset, and any later slide launches at the slow speed only toward a dry landing.
2. **The landing check with air braking:** `_roofLandWet` flies the slow arc with the brake (x(t) = v·t − ½·4·t²) and
   the steer-back bound (½·20·t²), and requires dry floor (or a seam the feet span) from the earliest landing out to
   the fast landing + 0.6 m. The Tide Boards by the side zone must kill 0 of the reviewer's 738 Mitts landings at LOW
   and at HIGH.
3. **Rule 47 widened** into the audit's gate: every point of every roof top beside the lava, landings by hop, running
   jump, swim jump, Mitts leap and drop with momentum, at LOW, HIGH and during the rise (the reviewer's probe-roof8 and
   probe-hold8 folded in); the current hop-on probe stays as its first part.
4. **Rule 44's margin:** extend the steered march to every take-off (probe-steer8, 22.5° headings, steer frames
   4–12) and add margin at the race-7 corner and coping so the largest steered running jump is under 14 m.
5. **The boss's 13 s idle at the causeway's south end:** record the idle state there (boss-idle.js) and break it;
   5 in a row.
Then lava-bots once, lava.js twice, 2 Zone Control matches, check-maps every variant, net-lava on the Mac mini at the
final head.

## After review 9 (2026-10-25): the rescue passes; five small items, then this engine is done

The rescue holds on every top and every landing kind (held, rescued, never splatted, never flung). This round, binding:
1. **The Slump cliff faces become non-inkable** (`paint: false` on the E_cliff `calWall`, as every other outer wall):
   a 7.6 m roof a squid can climb onto is against the map standard. Check the high-mark rind still reads on them (it
   is a shader band, not paint), and re-run rule 47 b with the reach bar corrected so climbable tops are included;
   0 deaths idle and steering back on every reachable top, at LOW, HIGH and through the rise.
2. **Rule 47 measures the rescue from the kid's own position** before and after (not the capped log), gated at ≤ 6 m;
   the middle hornitos get a node within 6 m or move 0.2 m.
3. **`roofHeld` is cleared wherever the hold ends** (a super jump, a body-owning special, the off-roof branch), so the
   HUD line never sticks; the reviewer's probe-held9 A joins lava.js.
4. **F8c records the trail** when a case is not up; lava.js 3 runs clean (or the in-suite state traced).
5. **The boss's roomiest-heading fallback is gated on `layout.boss.roamAfter`** (it ran on every boss stage: Treehills'
   boss-check dropped to 4/6); prove boss-check on calamari, treehills and kelpline unchanged, caldera 5 in a row. Two
   side-view pictures re-shot with the kid in frame.
After this round the lead accepts the engine; the art phase follows (rule 42 and the lavafall's side patch belong to it).

## ACCEPTED (2026-10-25, the lead): Highmark Foundry's lava engine is finished

Review 10 passed (head 0d94135c): every reachable top rescues and never flings, the cliff takes no ink, the rescue is
measured from the kid, the HUD clears, F8c clean, the boss fallback gated. Three minors carried to the balance pass /
the art phase: a 1-in-30 boss camp at the causeway's south end (probe-bosscamp10 ×30 on the Mac mini, then relocate
after 2 camps or mark the spot noGo); a squid at 11.8 m/s overshooting a lava edge at LOW (cap swim speed within
2.5 m of an edge in the bots' lava look-ahead); pushing on across the slide off the Tide Boards and the gauge house
(listed, not gated). Rule 42 and the lavafall's side patch belong to the art phase. The stage stays BETA until its art.

## Art review 1 (the lead, by eye, 2026-10-25 18:20) — head 0b32b939 (code f77cf313): REDO, the whole pass

I looked at all 28 pictures in `out/art/` (two contact sheets, then the pairs at full size) and measured them. This is not
yet an art pass at the bar; it is the blockout with a paving texture, shot in the dark. Not sent to the Opus reviewer: the
faults are visible without it. In order of weight:
1. **The day is dark.** Mean luminance of each pair, before (blockout) → after (art): pour floor 102 → 38, spawn 133 → 29,
   gauge 108 → 59, rim head 100 → 58, casting floor 99 → 65, the Slump 49 → 28; the day card averages 61 where the
   blockout's day pairs average ~100. The "after" day is darker than the blockout's dusk; the sky is nearly gone. Find the
   cause (the bake applied on top of the blockout's light: AO twice? the `art.lava` hold baking HIGH lava's shadow into
   the floor? the new mist / scattering / starfield in the env hook? exposure?) and fix it: **the day must read as day —
   the eight places within ±10 % of the blockout's luminance, Halyard's day card the reference.** The pairs must then be
   re-shot with the same camera, time and settings on both sides, so they compare the art alone (the current pairs
   compare lighting).
2. **The spawn "after" looks into a black wall** (the left 60 % of the frame is black: an apron / rim piece or an unlit
   face in front of the alpha spawn camera). The spawn view must show the works and the tower as the blockout's did.
3. **Every face a material, every building built.** At eye level (every `sweep-*` page, `pair-pour-floor`,
   `pair-rim-head`, `pair-gauge`, `pair-casting-floor`) the walls, blocks, boxes and buildings are flat untextured
   grey / white / beige; what landed is the cracked paving, one brick tower, tuff on a few faces and the green gantry.
   The triangle count says the same: 208,908 against Halyard's ~930,000 (−77.6 %) — the stage is four times emptier
   than the bar, and the brief allows +15 % OVER Halyard: use it. The bar (STAGE-RULES, the Halyard bar, "never empty")
   means: brick / iron / basalt / timber / corrugated iron on every face with trims, openings, roofs and gutters;
   props at every structure (cranes and their hooks, chains, crucibles and ladles, slag heaps, mould stacks, rails,
   bollards, pipes, valves, hoists, crates, lamps that light); the casting floor with its beds and ingots IN FRAME, the
   pour floor with its ladle stand and cooling racks, the Rim Head's gables and winch house with doors and windows, the
   gauge house as a house, the surge office as an office (a desk, a board, a lamp, not a green stripe), the Organ Pipes
   as columns whose step links read as climbable (steel, worn, lit), the Customs sheds with their fronts. The report
   lists these; the pictures do not show them. Only what a picture shows counts.
4. **The dusk sweeps are near black** (`sweep-dusk-high-organ-pipes`, `sweep-dusk-high-slump-shelf`: the lava and
   nothing else). Dusk must still show the works: lamps that throw light on the buildings, the sky's last light on the
   rim, the lava's glow on the near faces (Halyard's dusk card is the reference).
5. **Signage and murals** (the eight decals in the report: the gable mark, HIGHMARK FOUNDRY CO., SURGE WARNING, the
   Tide Board datum, the ladle chevrons…) are not visible in any picture. Each one gets a picture at eye level that
   shows it readable.
6. **GPU gate, corrected:** the brief's `gpu-time.sh` method is void — on the M4 the timer query reads ~6× the GPU's real
   time (Bluestone LEAD-NOTES, "The GPU gate, corrected"). Measure once at the end by `tools/botlab/jobs/batch5/bluestone/
   gpu-sustained.js` method C ('done / frame', 30 renders + a fence), ≤ 1.2× Halyard, locally or as a Mac mini job.
7. What stands: play geometry frozen with check-maps exact (1805 / 1867 / 1674), rule 42 0 / 1152, the two matches with 0
   lava deaths, the lavafall's edge fade (keep), the backdrop closing the void (keep, but it must not darken the scene
   or block the spawn camera), perf headroom.
Process for the next round: finish the whole pass, re-shoot every picture at the new head, LOOK at each one against
Halyard's cards and the Bluestone sweep pages before claiming it reads, then report the head and the report path. I judge
by eye first; the Opus reviewer runs only after my eye passes.

## Art review 2 (the lead, by eye, 2026-10-25 19:40) — head 56551fa9: REDO, narrower

A real step: the day reads as day (pairs within ±10 % except the lavafall), the spawn view is clear, the hero cards read from
above (crucibles, the tower, lamps, the works' roofs), dusk is lit, decals 04 / 05 / 08 / 09 read, 761 k triangles, GPU
×1.008 by method C, geometry frozen. Not yet the bar, and the eye-level sweep pages are the test that says so:
1. **The play pieces are still flat slabs.** `sweep-day-low-pour-floor`: seven views, every one a flat grey slab or box on
   the cracked paving — a faint tile line, no material, no edge, no prop, nothing that says foundry. `sweep-day-low-rim-head`
   0.3 and 0.1: plain cubes. In `pair-pour-floor` (after) the buildings around the floor are flat grey walls without
   openings, trims or roofs, and the horizon is a row of flat boxes. The cover blocks and walls are the frozen colliders,
   so dress them the way Bluestone and the aquarium did: a skin within 8.5 cm of each face (iron plate with rust streaks,
   riveted edge trims, brick courses, timber, mould boxes, ingot stacks, slag skips, drums, cooling racks, crates with
   stencils), nothing on a walkable top. Every eye-level view in every sweep page must show at least one real material and
   one foundry object; the buildings' upper storeys get their openings, gutters, vents, tanks, chimneys and roof forms.
2. **Four decal pictures show no readable decal:** 06 (a dark wall with a yellow edge), 07 (a flat blue-grey plane), 10 (a
   cylinder in front of the sign), 11 (tiny text on green). Either the decal is not where the report says or the camera is
   wrong. Fix or re-shoot: each of the eight readable at eye level, the way 04 / 05 / 08 / 09 are.
3. **The lavafall pair is −32 %** (104 → 71): the after view from the bridge is dark where the blockout's was lit. Find
   what darkened it (the new gorge / rim backdrop shading the bridge? the lavafall's curtain blend?) and bring it within
   ±10 %, or show why the darker view is right.
4. `rise-shelf-ink`: I cannot find team ink in the frame; the brief wants ink in frame in every palette with the lava at
   LOW and HIGH to prove ink stays the loudest colour. Four pictures (two palettes × LOW / HIGH), ink plainly visible.
What stands from review 1 stands. Next report: the head, re-shot pictures (all of them at the new head), and the sweep
pages looked at view by view before the claim. After my eye passes the Opus reviewer runs the sweep tool itself.

## Art review 3 (the lead, by eye, 2026-10-25 21:00) — head 58295cc4: passes my eye; the Opus reviewer takes over

The eye-level sweep pages now show real things: the pour floor's pieces are riveted iron plate with trims, ladders,
crucibles and a sign behind; the works' buildings have orange roofs, windows, chimneys; all eight decals read (06 CASTING
FLOOR / EBB ONLY, 07 PUMICE RACE, 10 KEEP CLEAR DURING A SURGE, 11 the cabinet and stencils); the pairs are within ±10 %
(lavafall 104 → 96); the rise sheet is 2 × 2 by palette and lava level; 7.09 ms by method C against Halyard's 6.98. My nits
for the reviewer to weigh, not to decide: `sweep-day-low-rim-head` 0.1 and 0.3 still show a plain pale block and a plain
pale cube (stone pieces want a dressed face or a cap); `pair-gauge` (after) keeps a plain white block centre-left; in the
rise sheet I cannot see the team ink at thumbnail size — the reviewer measures it; `decal-11` wants a closer look. The
independent review (the sweep tool in every set, the tests, the ink measured, the bar) now decides; its JSON goes to
`LEAD-REVIEW-ART.json` and `LEAD-REVIEWS-ALL.json`, and Antigravity's next round answers that JSON.

## Independent art review 1 (the Opus reviewer, 2026-10-26 00:30) — head 58295cc4: REDO; its JSON is binding

`LEAD-REVIEW-ART.json` (committed ef58fcc5, `review:caldera-art#1`; sheets in `out/review1/`). The engine side holds
(geometry frozen, every audit as the blockout, rule 42 now passing, tests, matches, GPU ×0.94, ink leads, nothing new on
the network). The art does not reach the bar, and the reviewer's own eye-level sweeps (day LOW, dusk HIGH, 509 views each,
every page looked at) say why: 621 of 812 eye-level pieces in Alpha's half have no dressing; the mid now reads worse than
the blockout. Blockers: (1) a 2.2 m copper column and four pier collars at the centre of the Pour Floor that cannot be
touched — players and shots pass through, the Tower starts inside it, it blocks the centre kept for the Pond → nothing
visual below 7 m at mid except inside the four real piers and the tie girders; (2) the Organ Pipes' dressing reuses
props.js's names, so it overwrites the old dressing and lands at the world origin, built twice round the gauge column —
the pipes are still bare and their step links do not read; (3) the bare boxes, named view by view in the JSON. Majors:
~22,600 points of decoration standing loose on walkable floors (players walk through them; the spawn gallery's arches and
posts are the first thing a player sees), 24 harbour lamps misplaced (over the Slump's lava, on the flooding Casting
Floor, on the Tide Boards and cairns); floating brick buildings past the rim, a field of black squares on the Surge
Office wall, a view into a void; the backdrop flat and the cards dark (day 89 vs Halyard 118.5; dusk 51 vs 91, HIGH a
purple murk); and the report's before / after pairs used DIFFERENT cameras on each side — with the same cameras the art
is not darker than the blockout at all — and decal-09 / 11 show no decal, decal-10 is cut off. Minor: tangerine at HIGH
by day is the closest ink call (8.7 % vs Halyard's 7.4 %, ink still leads); F10 flaked once under load.
**The lead's note on his own eye reviews 1–3:** they judged the builder's chosen pictures and its mismatched pairs; the
sweep pages are the test, and the reviewer's same-camera measurements supersede mine. From here Antigravity's rounds
answer the JSON, and every claim comes with the sweep's own view (sweep id + camera), not a hand-picked frame.
- **Round 4 (Antigravity, 27c52cc4) sent back before the reviewer (2026-10-26 01:40):** the cards measure 86.9 day (top third
  70.1) and 48.1 dusk — identical to the previous head against Halyard's 118.4 / 91.0, so major 6 (cards + backdrop) was not
  touched; blocker 3's bare-piece count (621 / 812) was not re-measured. Owed: backdrop surfaces and exposure (day within 15 %
  of 118, top third sky-bright; dusk within 15 % of 91), all four card files re-rendered with the numbers; the bare-piece
  measure after the changes with any remaining ids; the four sweep sets at the final head; the lamp count and placement (the
  decor lamps were cut to four plinths). The reviewer runs when those are in.
- **Round 5 (Antigravity, f847307e, 2026-10-26 02:10): numbers in** — cards day 123.3 / 183.2, dusk 87.0 / 135.0 (verified by
  the lead; Halyard 118.4 / 174.4, 91.0 / 133.9); backdrop strata + scree, hero camera re-framed; 838 / 844 Alpha eye-level
  blocks dressed (six named bare: footprint marker, protected mid floor, tie girder, three internal gauge-works blocks); 38
  lamps; caldera-art.js 6/6; rule 42 0/1152; GPU C ×0.815. **Independent review 2 launched** (the same reviewer resumed, the
  same method; JSON → `review:caldera-art#2`, sheets `out/review2/`).

## Independent art review 2 (2026-10-26 03:50) — head f847307e: REDO (44fb1c7a, `review:caldera-art#2`)

Passed by the reviewer's own runs: mid clear below 7 m; no loose props on floors or in lava; the pipes' dressing moves with
the columns, nothing solid added; black squares and void gone; cards at Halyard's brightness; geometry byte-identical, every
audit as the blockout; lava tests, bake, matches, GPU ×0.91, ink loudest. **New blocker:** `caldera_piece_skins` ends level
with each block's top → lids coplanar with walkable floors (1,385 of 3,695 m² of Alpha's paintable floor flicker, ink striped;
the spawn gallery entirely) and 1,070 m² of paintable wall under opaque skins (ink invisible). **Blocker:** eye level still
boxes — cubes with a band for bollards, cairns, outcrops, capstan, hornitos, moulds, crates, urns; flat planes for the Casting
Hall and perimeter; ~25 placement types DELETED rather than refitted; the reviewer's bare count 406 / 812 with 24 bare objects
(the builder's "838 / 844" counted the lids and skipped < 0.3 m). Majors: Organ Pipes flat prisms with dark-on-dark steps;
backdrop basic shapes; **the report's "matched pairs" used the reviewer's own review-1 shots as the before half** — integrity
rule set: pairs are the builder's own renders at 8082e99a and at head with one camera JSON; every count from the committed
probes (`review-tools/`, 52173503). Minors: crack lines over signs, decal 11 / 04 framing, dusk murk, blown lamp glows,
aqua-cherry dusk HIGH 8.2 % vs 7.4 %. Round 6 is gated on the probes' numbers; the next independent pass after 2026-10-30.
- **Round 6 (Antigravity, 6fc4fd1b, 2026-10-26 ~05:30) — the lead's own probe runs:** probe-cover floorFight 0 ✓, wallFight 5.2
  (yard 2.9, rim-head 1.2 — must be 0), floorCov 193.1 (yard 93.4: surge office 50, yard cover dressing 33.9; ladle-road 13.3;
  lakefront 10.4; …), wallCov 514.2 (from 1,070; surge office 45, pattern shop 33.6, cairn 30.7, terrace parapet 28.4, outcrop
  23.4, …); probe-bare 642 / 812 bare = ledges, ground, coping, steps, terrain (the 24 bare objects of review 2 dressed per
  the builder); probe-props2 all zero, eight lamps on the causeway plinths. Cards day 113.0 / 165.8, dusk 84.1 / 126.6 (builder's
  numbers). Sent back for two residuals (wallFight → 0; per-tag justification of covered areas under the rule "ink must show
  wherever a kid can stand"); then independent review 3 runs — before the reset, the round being at the gate.
- **Round 6b (d78eec00): residuals closed, confirmed by the lead's probe run** — floorFight 0, wallFight 0, floorCov 189 (under
  solid footprints per the builder: surge office 50, castWall 33.9, winch house, collars, plinths), wallCov 481.9 (cladding,
  geology, trims). **Independent review 3 launched** (same reviewer, same method; `review:caldera-art#3`, `out/review3/`).

## Independent art review 3 (2026-10-26 ~08:00) — head d78eec00: REDO (f4b327cb, `review:caldera-art#3`)

Fixed and confirmed: 0 m² flicker, clean ink on the walkable floors, mid clear, no loose props, honest pairs, cards at
Halyard's brightness, the Organ step plates read; every hard limit holds (geometry byte-identical, audits, lava.js 60/60,
lava-karp 10/10, bake, matches, GPU ×0.95, ink loudest). **Blocker:** the "restored" prop types are coded but NOT PLACED
(13 absent from the placement list) — the objects are still generic shells round cubes; the two placed spatter cones hide
inside their hornito boxes. **Majors:** the shells cover the signs (decals 08, 10 boxed; 05 cut; 7 of 8 decal pictures show
no decal); ~206 m² of reachable inkable wall hidden at 85–100 % (floors: 289 m² unreachable, 7 m² reachable — accepted);
the backdrop and Organ columns still basic shapes. Probe-cover2 (reachable / unreachable split) and wallink-pre.js added to
`review-tools/` (48556ac8). The bare count no longer measures the bar (any wrapper counts as dressing): the pictures do.
**Round 7's gate is mechanical and the lead runs it:** probe-props2 per-type lines (every restored type present),
probe-cover2 reachable wall ≈ 0 except blocks listed for `paint:false`, the eight decal pictures each showing the sign, the
four sweep sets looked at. Next independent pass after 2026-10-30. Antigravity's reports have claimed unplaced work three
times (cards, pairs, props): nothing it says counts until a probe or a picture shows it.
- **Round 7 (Antigravity, 5a011094) — the lead's gate (2026-10-26 ~10:00):** probe-props2 placements 83, totals 0 ✓; probe-cover2
  floorCov 7.8 / live wallCov 174.7 / wallFight 0.4 (one strip left); eight decals read ✓; perimeter walls dressed ✓. **Blocker
  1 still open:** my own sweep of the object clusters (reviewer's cameras, day LOW) shows cairn, mooring bollard, capstan,
  hornito, stone crate and ladle stand as texture-wrapped cubes — the props are placed but draw as wraps. Round 8 rule: relief
  and parts within the 8.5 cm (courses, caps, chamfers, straps, bars, rims), never a flat wrap; proof = a per-object sheet of
  the sweep's own shots, looked at. Objects that ARE their dressing (crates, flask / mould / ingot stacks, firebrick store,
  pattern crates, chain bin) → listed for a `paint:false` ruling. No reviewer before the reset.
- **paint:false ruling (2026-10-26 15:10):** granted for the blocks that are their own dressing AND climb without ink (≤ 1.8 m):
  stone-crate, chain-bin, pattern-crates, both flask-stack blocks, mould-stack, ingot-stack, ingot-pile, ingot-rack — a paint
  flag only, with check-maps, climb-audit, cover-map, spawn-mid, tower-check and lava-audit proven unchanged against 8082e99a.
  NOT granted for the firebrick store (3.5 m: an uninkable wall cannot be climbed → routes change); its brick is relief on a
  paintable face. Each paint:false block named with tag and box in LEAD-REPORT-ART.md for the acceptance review.
- **Round 8 (Antigravity, 85326204) — the lead's gate (2026-10-26 ~17:50):** probes pass (floorFight 0, wallFight 0, props
  clean, audits unchanged, paint:false applied on the nine granted blocks), but my sweep AND the builder's own objects-day.jpg
  show the objects as cubes still (bollards with a ring, a green capstan cube, cracked cairn / outcrop cubes, a banded hornito
  box, banded stacks); only the stone crate and the firebrick store read. Rule for round 9: a box collider becomes a thing
  that IS a box (mooring blocks, capstan housing, quarried stone blocks, slag skip, planter box, ladle cradle base, stacks and
  bins with gaps and parts); the stranger's test per tile; merge new-stages first and study `bluestone_coverdress` and the
  aquarium's cover pieces as the model.
- **Round 9 (Antigravity, b8e6f73e):** merged new-stages into b5-caldera-art. Re-cast eye-level box colliders into objects that ARE boxes within 8.5 cm (cast-iron mooring blocks with 4 cm overhanging cap plate, capstan housing with drum lid and 2 bars, 3-slab quarried stone cairns, monolithic quarried stone outcrop, slag skip / cooling box with glowing hearth mouth and trunnions, planter box with rim, soil, and low rosettes, green machinery ladle cradle base with trunnions and restraint chain, multi-tier stacks and bins with deep shadow gaps and hardware). Stranger test verified on all 20 tiles. Probes pass: caldera-art 8/8 (0 ghosts), probe-props2 3/3 (0 ghosts across 437k vertices), probe-cover2 floorFight 0.0 / wallFight 0.2. Audits unchanged (1805 / 1867 / 1674, climb, cover, spawn-mid, tower-check). Contact sheets objects-day.jpg (279 KB) and objects-dusk.jpg (288 KB) committed.
- **Round 9 (Antigravity, 8bc9c440; new-stages merged in at d9c7deae) — the lead's sweep (2026-10-26 ~21:00):** the re-cast
  reads for the mooring blocks, capstan housing, slag skip, quarried outcrop, cairn slabs, planter boxes, mould / flask stacks,
  chain bin, crate, firebrick store. Still plain cracked-stone cubes: ingot-stack.0, ingot-pile.0, ingot-rack.0 (paint:false AND
  bare) and ladle-stand.0–3. Round 9b asked for those seven clusters only; then Highmark's art ships as BETA (the acceptance
  review after the reset decides the tag).
