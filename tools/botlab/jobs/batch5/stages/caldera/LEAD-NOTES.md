
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
