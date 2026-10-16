
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
