# Wave 2: every open item after integration (the lead's brief for the polish package, 2026-10-10)

The four subs and the Bazookarp rules engine are merged on `b5-int3` (b55f7472). Below, per package, the LAST independent review's verdict and its issues verbatim (the integrator already fixed some of them: its own list is at the end; check each item against the merged code before working on it), then the integrator's full report. The lead's orders are in the workflow prompt.

## sub-glide (Glide Bomb) — last review: **REDO**

Close, but I would not ship it tonight. All four round-2 fixes are real, and the parts that run hold up. What fails is the proof: the package's own page test failed in both of my full runs, and the failing check exposes a real bot behaviour.

**What I verified as fixed (round 2's issues):**
- **Wall collision.** The body's circle now meets walls. In my full run the 6°, 10° and 20° throws go at most −0.001 m into the wall, a slide 0.15 m off the face is pushed clear on its first step, and the wall-end and turned-crate grazes bounce away 0.281 m clear. The wall pictures agree.
- **Lava.** The order is now lava, then stage hazard, then liquid. Caldera's case gives one hiss and no plop; a module liquid alone still plops.
- **Net test.** `net-sub-glide.cjs` (default scene) passed 11/11 in my one run. B's clonk came from the [4] record ("by its [4]", 1 clonk), and the cook lags were 166–202 ms.
- **Bots and the sea.** Matches show 0 stones sunk.

**Other checks:**
- `node --check` passes on every changed file.
- The web build copies all of `src/`, so the new modules ship in both builds.
- Shared-file edits are short and tagged. This round touched no big shared file.
- No per-frame allocations worth flagging. The stone is 10 meshes (body, ink, 8 lamps), as the Shaker's pattern.
- Bots facing a stone: the stop-disc escape passed 4/4.
- Every picture: in the game's style and readable. The icon reads at chip and HUD size. The curling-stone model, the low carry, the 8 m view and the HUD at the guide shot all hold up. `glide-roll.jpg` still shows no roll (issue 3).

**What did not reproduce:** the builder's "sub-glide.js 59/59". My two full runs gave 54/56 and 53/55:
- The bots edge check failed in both runs, depending on the test bot's random main weapon (issue 1).
- Part `more` aborted with a HARNESS TypeError both times, at different throws, so its last checks never ran (issue 2).

**Not user-visible, so not listed as issues:**
- The `glide.js` header still documents `[4, gid, x, y, z, vx, vz, fuse]`, `[2, gid, why]` and `stage.sink`. `docs/NET.md` is current.
- Bots plan few fight throws in matches: 4 in 150 s with 8 melee bots.

**Paths** (scratchpad `/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rev3-glide/`):
- Full runs: `page.log`, `page-diag.log`
- `more` alone: `page-more.log`, `page-diag2.log`
- Probes: `probe-plant.js` / `probe-plant.log`, `probe-throw.log`
- Melee match: `match-melee.log`
- Net test: `net.log`

Worktree: `/Users/danielosling/Desktop/1/st-b5-sub-glide`. I edited no source and made no commits.

### [major] Bots keep closing in while cooking (the plant does not hold for the Cutlass or Mitts): full-cook point-blank throws, or a cooked stone that fizzles; the package's bots check fails whenever the test bot draws one of these weapons

**Evidence.** Where it comes from:
- The plant is `move.multiplyScalar(0.35)` in bots.js's fight branch (the `[b5-sub-glide]` line after the swim-in check).
- `BK.tactics` runs later in the same branch ("may override move, fire, squid and jump"), so the Cutlass and Mitts tactics drive straight at the foe during the cook.
- glide.js `botHold` re-solves the needed cook every frame from where the bot stands now. As it closes, the needed cook rises until it caps at full cook (1.8).

My probe (`probe-plant.js`: foe standing 10 m off, 3 rounds per weapon):

| Weapon | Walked while locked | Released at | Cook |
|---|---|---|---|
| Shooter | 2.3–2.8 m | 9.4–9.9 m | 1.25–1.33 |
| Blaster | about 3 m | about 8.4 m | about 1.5 |
| Cutlass | 7.0–7.7 m (peaks 9.8 m/s) | 1.5–2.9 m | 1.8 |
| Mitts | 4.7–10.6 m (peaks 11 m/s) | 0.65–2.8 m | 1.8 |
| Roller | 3.5–4.0 m | 1.5 / 5.65 / 7.8 m | full cook in 2 of 3 rounds |
| Brush | about 4 m | 2.5–5.5 m | 1.8 |

The package's own test, `sub-glide.js` 'bots', picks bot B's weapon at random:
- Run 1: the edge check gave 1 of 4 thrown (needs ≥ 2). B walked to x 24.2–26.8 (deck edge at 28), and the release check then refused every yaw (`cancel: 1`).
- Run 2 (B = mitts): 0 of 4 thrown.
- The builder's passing run had a planting weapon: B released from x 17.8–21.5.

The '10 m' fight check can't tell a 10 m throw from a point-blank one:
- Run 1: B released 1.3–1.5 m from the foe at full cook. The stone clonked off the foe's shins and stopped 1.8 m away, which passes the '≤ 2 m' test.
- Run 2 (mitts): 2 of 3 rounds passed the same way; round 3 stopped 5.94 m off.

In matches:
- My halyard Turf (Cutlass vs Mitts, all Glide): fight 4, cooked 3, held off 1, fizzles 1.
- The builder's Turf #2: fight 7, cooked 2, fizzles 3, held off 2.

The report's "Bots plant and don't dive while cooking" and "fight throws come mostly at 5–11 m" hold only for weapons without kit tactics. The user would see a bot charge them for about 2 s with a glowing stone and its weapon locked, then drop it at their feet.

**Fix.** Bot behaviour:
- Make the cook a real plant whatever the weapon: enforce it after kit tactics, e.g. in `_tail` beside the existing `mainLocked` squid line. While `runner.glide` cooks a fight plan, keep at most lateral strafing (no closing move, no lunge or leap), or have the Cutlass / Mitts tactics stand down while `runner.mainLocked`.
- Stop chasing a growing cook. Fix the cook at the plan (the distance when planned), or let go at the current cook once the foe is inside about 4 m, rather than cooking to full point-blank.

Tests:
- Pin B's main weapon (`setWeapon('shooter')`) in both bots checks so they are deterministic.
- Add Cutlass and Mitts rounds that require the release ≥ 5 m from the foe, or an early throw rather than a fizzle.
- In the 10 m check, assert the release distance (e.g. ≥ 6 m), not only the stop.

Then re-run 2 halyard Turf matches with melee weapons and report fight plans, cooked throws, fizzles and held-off counts.

### [major] sub-glide.js aborts with a HARNESS TypeError inside part 'more' in full runs (2 of 2), so 5–6 checks never run; the claimed 59/59 does not reproduce

**Evidence.** Run 1 (`page.log`), RESULT 54/56:
- `FAIL HARNESS TypeError: Cannot set properties of null (setting 'fuse') at :843` — `throwHeld(0.1)` returned no stone at the Drainbow throw.
- The Drainbow, Bubble Guard, roller / Tempest-rain and moving-floor checks never ran.

Run 2 (`page-diag.log`, a scratch copy with logging only), RESULT 53/55:
- `TypeError: Cannot read properties of null (reading 'p')` at the Mega Stamp throw (`s1.p`) — a different throw.
- This time 6 checks were skipped.

'more' run alone passes: `page-more.log` 9/9, and `page-diag2.log` 10/10 with the local kid on a brush.

What I ruled out and found:
- The kit can throw: my `probe-throw.log` makes a stone with every one of the 12 main weapons, fresh and after a splat and respawn.
- So it is an ordering or state dependence on earlier parts, which use random loadouts and real bot brains (the 'lock' part leaves `me.specialId = 'barrage'`; the 'bots' part frees real brains).
- The test crashes instead of reporting.

The builder's full log (`glide-r2/run-full.log`) passed 59/59, but no repeat is reported. COMMON.md asks for flaky checks to be fixed or reported.

**Fix.** - Find the order dependence: run `only=bots,stubs,lock,crush,boss,start,perf,more` and bisect.
- Make `throwHeld` fail its check with state (alive, ink, aimingSub, specialActive, items) instead of a TypeError, so one bad throw can't silently skip the rest of the part.
- Pin the local kid's and the foe's loadouts (weapon, sub, special) at the start of the test, and reset `specialId` after 'lock'.
- Run the full suite 3 times on this Mac and report each result.

### [minor] No picture shows the underhand roll (glide-roll.jpg still shows the stone already down beside a kid holding a blaster)

**Evidence.** `out/glide-roll.jpg`:
- The stone already sits on the deck in its lane.
- The kid's left hand is on the blaster.
- No arm swing and no stone leaving the hand.

Round 2 noted this, and the builder lists it as a carry-over ("glide-roll.jpg is ambiguous"). The roll (`character.js _poseRoll`) is the new throw the user will see every time, and nothing proves it reads as a roll.

**Fix.** Shoot the roll mid-swing: at about 0.06–0.13 s of the throw pose, side-on, with a one-handed main (Splattershot) so the free arm reads. Add a second frame of the stone just leaving the hand. Commit as `(scratch)`.

## sub-sentry (Scrap Sentry) — last review: **PASS**

Scrap Sentry (b5-sub-sentry, head d5d06e0) review, round 1. Verdict: pass. I would ship it tonight. Every rule in the user's words and in SPEC §B is in the code: placement and its refusal reasons, the spawn rules, the 0.6 s unfold, sight by the bots' rules, the 0.4 s lock with its tell, bursts with the drop solved, 120 hp under the wave-1 device rules, life and folding, the tower (crush and deck ride), movers, lava, era flips, the Bazookarp shell sight test and its crushIn sphere, the records and ghosts, dropOwner, the 'dh' attacker, the HUD reason line, SENTRY DOWN, the life ring, the minimap mark and the sounds. Shared-file edits are tagged [b5-subs] and stay within SPEC §0.2/§0.3/§F. No LEAD-REVIEW.json existed, so there were no earlier issues to re-check.

Runs I did myself, all local, one Electron at a time. Logs are in /private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rv-sentry/.
- Page and two-client tests: sub-sentry.js 46/46 (5th hit at 1.417 s); net-sub-sentry.cjs 12/12 (15 rounds and 15 replays; B's shots took A's sentry 84→48→12→down with by=B; a leaver's ghost was gone within the onLeave frame); only=tower 3/3; only=zones 1/1.
- Regressions the builder had not run, which cover the crush(T)→crushIn refactor: tower-rules 26/26 and surf-movers 11/11.

Probes:
- Frame cost: turretSees costs nothing measurable. 70 nodes in the disc at 0.0023 ms per sight line; frame p95 went from 3.7 to 4.2 ms.
- Live bots on Tower Command (saltpan), 120 s: 10 sentries, 5 on the deck, all set down by riders.
- Live bots on Zone Control (halyard): 6 sentries, 1 by a guard at the zone edge.
- Is it blind? No. In Zone Control, of 35 samples with a kid-form foe in reach and a clear line, it had a target in 33 and was locked in 24. Rounds hit 13 of 28.
- Low engagement in Turf comes from where bots set it down and from owners being splatted (folds). That is for the lead's balance pass, as the builder said.

Pictures: I looked at all 13 in out/, then re-rendered the builder's scenes at 960×600 and made my own guide pictures (ring/).
- CAN'T USE with its reason line, SENTRY DOWN and the life ring all read at 960×600.
- The 11 m guide ring does render. It shows as a faint arc from the play camera, but none of the builder's pictures show it.
- The model reads as a junk turret (can, cap feet, bottle head, copper barrel, tape, lamp, tag).

The builder's claims match what I found. One flaw in the proof: the "deterministic" tower and zone bot checks skip bots.js entirely. My live probe shows the real deck path does work.

Note for the integrator (not a fix for this package): st-b5-sub-bobber also adds its own crushIn, sightRay and dropOwner. The two versions must be merged into one.

### [minor] Bots throw away a third to half of their sentry decisions in Tower Command, and each one costs a 10–14 s cooldown

**Evidence.** My live probe, saltpan tower, 120 s, every bot on the sentry: SENTRY_STATS botUses 18 against uses 10, with 0 bot 'Can't use'. The builder's own saltpan match: botUses 29, uses 20. In zones and turf it is about 1:1 (6/6, 13/12). The cause is in sentry.js botGo (line 929). It sets b.bombCd = 10–14 s and counts botUses as soon as the spot checks out, before the press happens. On the tower the press is then cancelled by bots.js 2335 (a rider hiding in squid form sets it.sub=false and _bombAim=false) or by the threat control at 2619. So the bot pays the full cooldown and nothing is placed.

**Fix.** Start the cooldown only when a bot's sentry is actually placed. Set b.bombCd and SENTRY_STATS.botUses inside use() when a.bot is set. botGo can then hold a short 0.5 s retry gate instead. Add a check: a rider whose press is cancelled for one frame still places within its next decision.

### [minor] The Sentry's icon is drawn outside the sub-icon palette: it is the only multi-coloured glyph in the picker and blurs at HUD size

**Evidence.** picker.jpg: every other sub tile uses the roster palette (currentColor team ink, white, the light grey and the dark outline). Scrap Sentry is rust, teal, copper, red and grey, and it is smaller in its tile. life-badge.jpg and my 960×600 render (s960, sub badge about 25 px): the glyph reads as a muddy speck. In the SENTRY DOWN note (down.jpg) the icon is barely visible. The spec (B4) did ask for these colours, but COMMON.md asks for 'SVG glyphs in the existing style'.

**Fix.** Redraw SUB_ICONS.sentry in the roster palette: the can in currentColor, the bottle head light, the legs and barrel dark with the white highlight stroke. Keep the silhouette (three legs, can, bottle head, barrel to the right) and fill more of the 64 px box. Or have the lead confirm with the user that the coloured icon is wanted.

### [minor] The squid stencil on the scrap plate is buried in the plate and shows only as a yellow scrap at its lower-left edge

**Evidence.** standing.jpg, close: the team-ink squid appears as a small fragment at the plate's bottom-left corner, not as a stencil on the plate. In hubParts (sentry.js 116–120) the decal is lowered 9 mm below the plate's centre and set only 2.6 mm off it. The plate is a domed superEllipsoid (thickness 2.4 mm plus a ±0.8 mm dent wobble), so the middle of the decal sinks inside it and its bottom runs about 2 mm past the plate's lower edge.

**Fix.** Centre the stencil on the plate (drop the −0.009 y offset) and raise it above the dome (offset along pn by about 0.0036 or more, or conform it to the dome). Check it with a close-up picture.

### [minor] A Practice late joiner never sees sentries that are already out, but still gets shot by them for up to 15 s

**Evidence.** The ghost is built only from [0] (sentry.js ghost(): any other op for an unknown gid is ignored). netmatch's late-join path sends only the turf (inkreq/ink) and the stage modules, with no device snapshot. So for a joiner, a live sentry's rounds (recorded owner projectiles, applied on the victim's own screen) come from an invisible gun. Their shots pass through where it stands: there is no ghost on their screen, and on the owner's screen their ghost rounds are muted. This gap already exists for wave-1 devices, but the sentry is the first one that shoots players.

**Fix.** When a player joins ('pj'), have each owner re-record [0] (plus [4] if riding and [5] hp) for its live sentries, or give [6] enough to build a ghost. Otherwise list it as a known limit in NET.md and in the lead's report.

### [minor] Some checks cannot fail without the code they claim to cover, and spec G regressions were not run

**Evidence.** (a) The Tower rider and Zone guard checks in sub-sentry.js (lines 734–750, 775–804) call K.bot.paint() directly and inject the press with _int. Reverting the bots.js:1006 bot.rides exception (the !onT gate) leaves the suite green. My live probe shows the real path works (5 deck placements by riders in 120 s), but nothing guards it. (b) The 'a ghost from the records … flashes on [6]' check counts every G.fx.muzzle call while the owner's real sentry is also firing: 8 counted where 3 are needed, so it passes even with no [6] handling. net-sub-sentry.cjs does cover ghost bursts properly. (c) The roller-evade check passed 0.13 s after the lock because the roller was already 10 m out and walking away (its trace shows 9→10 m before the lock). (d) Not run by the builder: treehills-pods, sfx-cues (it has no sentry scene, so nothing checks that the idle loop follows the sentry and stops with it) and bot-sight (SPEC G). I ran tower-rules 26/26 and surf-movers 11/11 myself.

**Fix.** (a) Stage a real rider on the deck with its brain live and bombCd at 0, and assert that a sentry rides the tower within N s. Run it a few times on the Mac mini, or count deck placements in a scripted saltpan run. (b) Count only 'sentry:fire' events with ghost:true for that gid. (c) Start the roller inside 8 m, walking toward the owner. (d) Add a sentry scene to sfx-cues' SUB_STAGE and run sfx-cues alone, plus treehills-pods (turf, WATCHDOG 420000), when the Mac mini is back.

## sub-bobber (Chain Bobber) — last review: **REDO**

Verdict: redo. The parts a human player uses are solid: throwing, floating, tethers, triggering, disarming, the HUD and online play. The bots are not, and that is what the user will see. Round-2 issue 1 (bots get nothing from the sub) is still open, as the builder says. I also found a second, separate problem the user will hit directly: bot teammates blow up the user's own bobbers when no foe is in them.

What I ran, all at HEAD 19feccc, one Electron at a time under the shared lock. Logs are in scratchpad/rev3-bobber/.
- sub-bobber.js on testbox: 75/75, no console errors.
- net-sub-bobber.cjs (two clients): 11/11.
- only=zone on halyard: 2/2 (all three guards built a chain each time).
- perf-bobbers.js: 4/5. Phase 4 measured 12.2 ms vs 5.2 ms (allowed +3).
- My copy of perf-bobbers with each system timed: phase 4 passed at 6.3 vs 5.5 ms, with 53 chains set off in the window.
- bobber-web.js, clear variant (the script never sets the web off), on halyard Zone Control: 2 webs of 12 and 3 webs of 6.
- Two 180 s Turf matches with every bot on the bobber (halyard, saltpan).

Checked and fine:
- Every rule in the user's words, the spec and DECISIONS #20 is implemented, and a check that can fail covers it:
  - float heights and refusals;
  - tethers (5 m, at most 3 each, the tether list record);
  - breadth-first hops of 0.07 s;
  - the size table to 8 links (radius 3.8 m);
  - one explosion per victim;
  - disarm at 25 hp;
  - the 30 s life and the hidden 24-per-player guard;
  - crushIn, lavaSweep, era flips and movers;
  - one blast per chain on the boss and the shell;
  - the teammate glow, checked by reading the tether buffer back.
- Online: team fire on a ghost (bobberPop), the shooter credited, damage judged on the victim's screen, a leaver's bobbers dropped.
- The pictures read at a glance and look like the game. The model is a convincing team-capped float. The glow is obvious. The icon is readable at badge size. CHAIN ×N sits clear of the turf pops at 960×600.
- Shared-file edits are tagged.
- Every changed file passes node --check. The desktop and web builds ship all of src/.

Notes for the lead (not counted as issues):
1. **Performance phase 4 is not settled either way.** The "with" and "without" halves are two 30 s windows run one after the other on a shared machine, so a load change between them swings the result. My two runs gave +7.0 ms and +0.8 ms.
   - The timed copy put the extra time in the kit's own tick (p95 0.8 ms; 1.2 ms in the failing run) and the minimap (+0.4 ms with about 180 bobbers).
   - The spec's 0.5 ms limit on the kit's tick is only checked in the idle phase.
   - DECISIONS has a fallback (guard 16) if this test fails. It should be judged on a quiet machine or the Mac mini.
2. **Online cases not tested.** The two-client test has no host-leaving case (spec §G) and no online tower ride (the [4] ride record). The code paths look correct.
3. **Practice late joiners** get no copy of the bobbers already out. Every device has the same gap.
4. **Stale doc.** docs/STAGE-MODS.md line 519 still says crushIn is a no-op until the subs package adds it.
5. **Round-2 issue 3 is still open.** The shared hook-ins exist on both b5-sub-bobber and b5-sub-sentry. The lead has to pick one; the builder prepared the comparison.
6. **Bots spend part of each match holding fire.** In my matches they held for 3,762 and 5,609 frames, about 4–6 % of all bot frames (the builder saw up to 9 %). This is justified, because own bobbers absorb own shots.

The builder's claims against what I found:
- The test results reproduce.
- "Phase 4 fails because of machine load" is plausible but not proven (see note 1).
- The report is honest that issue 1 is not resolved and that the zone check passes 8–9 runs in 10.
- It misses that bot sub throws are not covered by hold-fire (issue 2).
- Two of its four remaining levers can be done inside the kit without a rule change:
  - (a) set a chain off on a foe the team knows about, not only one the bot sees itself;
  - (b) favour fight pairs and lures.

### [major] Bots still get almost nothing out of the Chain Bobber (round-2 issue 1 unresolved); in Turf at HEAD it is zero

**Evidence.** My two Turf matches at 19feccc (SUBS=all=bobber, 180 s; scratchpad/rev3-bobber/m-hal-turf.log, m-salt-turf.log):
- 146 bobbers thrown (about 5,800 ink): 96 expired, 25 disarmed.
- 1 chain set off, by a Zipcaster blast with no foe in it. 0 hits, 0 splats.
- Foes stood in a chain's reach for 2.0 s of 403 chain-seconds, and 4.0 s of 502.
- The Turf placement sources: troute 0.0–0.1 % of chain-seconds with a foe in reach, theat 0.0 %. Fight pairs: 6–8 %.
- Bots readied on a chain twice and fired 0 times.

The builder's 6 matches: 33 chains set off, 88 % wasted, 2 splats. Over 8 matches at or near HEAD that is 2 splats in total, against the spec's targets: wasted under 30 %, at least 40 % of chains catching a foe, splats per match in the roster's range.

The Turf set-up also sends a bot on a walk of up to 30 m and then keeps it near its chain for up to 18 s (bobber-bots.js, the trip and _bobHold blocks), so a bot holding this sub is passive as well as harmless.

**Fix.** The lead decides and tells the user. Either:
- accept area denial for bots and say so; or
- try the kit-local levers the builder named but didn't run: set a chain off on a foe the team knows is in reach (teamKnown, no wall-hack), and favour fight pairs and lures, the only placement with real foe time, over standing webs. Then drop or shorten the Turf trips and holds if they don't pay.

Prove it with 2 Turf and 2 Zone Control matches at the new HEAD: wasted well under the current 88 %, and at least one splat a match.

### [major] Bot teammates set off a human's own web with no foe in it — hold-fire doesn't cover bots' sub throws

**Evidence.** bobber-web.js, clear variant (the scripted player never sets the web off; teammates' aimed trigger is off, but their hold-fire is on), halyard Zone Control, zone layout:
- n=12: 2 of 2 webs set off 'by mate' at 16.5 s and 31.1 s, 0 splats (scratchpad/rev3-bobber/web-clear.log).
- n=6: 1 of 3 set off 'by mate' at 21.7 s, 0 splats (probe-web.log).
- So 3 of 5 webs were blown for nothing by the user's own teammates.

The stray log for the traced one: via 'blast:roller', the teammate in refill mode 9.3 m away, and hold-fire had said 'no hold' (hf0). That is a blast from the teammate's sub, not its main weapon.

Why it gets through: bots.js _tail presses the sub whenever _bombAim is set, and bobber-bots.js holdFire only clears it.fire and it.special. Zone bots also lob bombs onto enemy ink on the zone (bots.js _zoneBombAim, about line 1009), which is exactly where a guard's or a human's web sits. The report's lever (c) names only the Mitts fist, the blade's wave and the bucket's glob.

To the user: lay bobbers, and your own bots blow them up with nobody in them.

**Fix.** Before a bot throws any sub (zone ink lobs, tower lobs, fight bombs, paint subs, kit subs), predict where it lands. If the blast would reach an own-team idle chain (no foe the team knows within its reach), don't throw. botThrowOk / predictFrom already show how. Also close the kit weapons' paths the builder listed (fist, wave, glob).

Prove it with bobber-web.js clear variant, n=6 and n=12, zone and lane layouts, 3–4 webs each: no web set off by a teammate with no foe in reach. Add a check to sub-bobber.js that fails on today's code: a teammate bot's zone bomb lob is held while it would land on an own idle chain.

### [minor] Zone Control guards still miss a chain about 1 time in 18; round-2 asked for 10/10

**Evidence.** sub-bobber.js only=zone on halyard (all three guards held, rotation frozen):
- builder: 25/30 runs, 85/90 guards (8/10 at HEAD 19feccc);
- mine: 2/2 at HEAD.

The misses the builder names:
- a third guard on the small, ledgy raised zone where every anchor fails the lob check;
- a guard that drifted 2.6 m mid-burst, cause not found;
- one that fell into the water and respawned.

**Fix.** Fix or explain the mid-burst drift. Give the third guard a fallback on a raised zone, for example the zone's own ground or a stand spot below its lip. Then run only=zone 10 times at the new HEAD. If 10/10 isn't reachable, the lead should accept the remaining rate explicitly.

## sub-dash (Dash Pellet) — last review: **PASS**

I would ship it tonight. All five issues from round 1 are fixed and proven. I re-ran the package's tests at the final source and found nothing the user would hit in play. My two findings are minor and neither blocks the ship.

**Tests I ran myself (local, one Electron at a time under the shared lock, testbox):**
- `sub-dash.js`: 42/42, no console errors. The Torpedo trial, judged in our ink: 96 % clear with the dash against 11 % without, over 28 noticed trials. Splat Bomb at the feet: 20/20 dashed along the escape heading, 0/20 clear with the dash off.
- `net-sub-dash.cjs` (guest at netlag 150 + jitter 60): 7/7.
- **Online control.** I ran a copy of the net test with the guest ignoring `F.dash`. The wall check then fails (0.063 m past the face), so that check can fail without the fix. It only catches the Hermite bulge, though; the 180 ms overshoot never came up in its 6 dashes.
- **Bot matches, everyone on the dash, 0 console errors and 0 sea deaths after a dash in both:**
  - Tower Command on crossmarket: 26 dashes (dodge 9, break-off 10, gap close 5, rush 2), stuck 1.7 %.
  - Zone Control on lockgate: 41 dashes (dodge 9, break-off 9, gap close 21, rush 3), stuck 0.2 %.
- **960×600 HUD** (my own shots): the "CAN'T USE / Air dash used" callout, the tip and the picker tile all read. The AIR pip is tiny, but the greyed badge carries it.
- **The builder's logs agree with the report:** zipcheer 36/36, input-swim 8/8, sub-scale 72/72, bot-specials 19/19, sub-scaffold 15/15, sfx-cues 55/55, four Turf matches with 0 sea deaths. The every-node stage audit passes 26 of 26.

**Round 1 issues, all resolved:**
1. **Zipline.** `G.specials.ownsSub` takes the press silently, and a body phase now ends a running dash. Both checks fail with the fix removed.
2. **Boss Battle bots.** The random press skips `onPress` subs, and `botAct` now runs in the boss think with the telegraphs passed in.
3. **Stage audit fails.** The air dash stays 3.5 m. The builder's pictures prove Kelpline's boom and spreader perches are reachable on foot with no dash (a map matter, flagged TELL THE USER).
4. **Unproven audit.** It now covers every edge node on all 13 stages at 1/60 and 1/24, with measured height bars (1.92 / 1.88), dashes off a wall climb, and honest titles. The two baselines widened during the run are documented with evidence.
5. **Bot dodges.** The dodge fires on any frame of a noticed threat, and the Torpedo trial now tells the dash apart.

**The user's words and the spec:** every rule is implemented and tested: the press, ink, distances, no height gain, the substeps, the limits, the blast, the HUD, bots and online. Only parts that need packages not built yet (the Bobber, the Bazookarp, the three new stages) are left untested, and the report says so plainly.

**Checked and fine:**
- Late joiners, host migration and a disconnecting owner: nothing outlives the dash.
- Kit records play on the sender's timeline, so the pop and ribbon line up with the proxy.
- Every other place bots press the sub (zone, tower, memory and shield bombs) is gated on THROWN, so bots never dash at random.
- Per-frame cost is negligible: ribbons are pooled, and the pellet is two meshes for 0.08 s.
- Shared-file edits are tagged and in scope, and the docs (NET.md, EVENTS.md, STAGE-MODS.md, README) are current.

**The pictures:**
- The model is convincing: vents, chevron, pinstripe, swept fins.
- The icon reads at badge size, and the pop and ink are in the game's style.
- dash-held doesn't show the pellet, but it is never held in play.
- I also shot it from the player's own camera, which none of the builder's pictures show. The roll and pop read, but the ribbon disappears on a forward or backward dash (minor issue 2).

**Builder's claims against what I found:** they match. Every number I re-ran was in range, and the TELL THE USER notes are accurate (Kelpline perches reachable on foot; the real plain-hop reach is 1.90 m; the pop can shred a Brolly canopy).

My probes, logs and shots are in the scratchpad under rev2/. I edited and committed nothing in the worktree.

### [minor] The stage audit never tries a swim jump + air dash, or an air dash late in a long fall, which are the moves that reach furthest

**Evidence.** dash-reach.js only tries running jumps at kid run speed with the press at frames 4 / 18 / 30 (KINDS = ['g', 4, 18, 30]). Its climb dashes go along or away from the wall, never toward or over its top. My testbox probe (scratchpad rev2/reach-probe.js) measured the distance from take-off to the first landing.
- **Flat deck:** a running hop goes 3.80 m, and with a dash the audit's best is 7.01 m (its frames already find the best here). A plain swim jump goes 8.46 m. A swim jump plus an air dash goes 10.41 m at frame 30 and **11.28 m at frame 38**.
- **Off a 3 m ledge:** a plain running hop goes 5.30 m, and the audit's best (frame 30) is 8.81 m. The true best is 9.31 m at frame 41, because the vy clamp to −1.5 m/s arrests a fast fall.
- **Risk check:** I ran a swim-jump copy of the audit (frames 18–56, swim-jump baselines) on halyard, kelpline and saltpan at 1/60. It found 0 perch landings and 0 out-of-bounds landings. Its one stuck-on-a-roof hit (kelpline, an off-map roof at z −76) and its high landings did not repeat in clean replays (rev2/swim-trace.js), which landed level with no climbing. I put them down to the copy's own ink residue (the audit clears paint only every 20 starts) letting the held squid climb walls; I did not prove that.
- **Upshot:** no leak is shown, but 'no perch / roof / out-of-bounds spot becomes reachable' is unproven for the most common real approach: swim, jump, dash.

**Fix.** Add to dash-reach.js, and to JOB-1 for the consolidated Mac mini pass:
1. A swim-jump kind: start from own ink at swim speed, squid held until the press, presses at 18 / 30 / 38 / 46 / 56, and a plain swim jump as its baseline.
2. Late presses in long falls: every few frames until landing.
3. A climb dash toward the wall at the top.
4. Clear the kid's paint before every swim move so held-squid wall climbs can't pollute the results.

Run it on all 13 stages at 1/60 and 1/24 (the lead's pass).

### [minor] The speed ribbon disappears on a forward or backward dash from the player's own camera

**Evidence.** The ribbon is a vertical band in world space, with its top and bottom vertices at the same x and z (kits/dash.js ribbonTick). From the player's camera behind the kid (rev2/shotspov2/testbox-turf-day-pov-forward-mid.png), a forward dash shows the camera rush, the roll and the ink pop but no ribbon, because the band is seen edge-on. A strafe shows it (pov-strafe-mid.png), as do the builder's side-on pictures. A dash straight toward or away from an enemy also shows them no ribbon. Every picture in out/ is a side view, so none shows this.

**Fix.** Optional polish: make the ribbon face the camera (billboard each segment across the view direction), or add a short speed-line or FOV kick for the local dasher on the dash's first frames. Then add a player-camera forward-dash picture to out/.

## karp (Bazookarp WP1) — last review: **PASS**

I would ship WP1 (head fcd3a028) tonight, with the mode still hidden behind WIP_MODES. All six issues from round 2 are fixed: I read the code and re-ran the tests myself. Every test I ran passed with a clean console. I found one new minor issue: the builder's merge note for the integrator is wrong for one of the two other branches, and no test would catch the result.

**What I ran** (on this Mac, under the SLOTS=3 lock, one Electron instance at a time; logs are in my scratchpad folder rev3/):
- Page tests:
  - bazookarp-rules: 117/117. L11b, L12 and M1–M5 all pass.
  - karp-gun: 12/12.
  - karp-loop: 6/6.
- Two-client tests:
  - net-karp: 19/19. The ghost landings matched at 0.00 m, A's kid was hurt on A's own screen (37.96 hp left), and kx → u inside an overtime held.
  - net-karp-crush: 4/4.
- My own two-client probe of the boomerang's new [4, gid, x, y, z] record (the report said it was never tested online): 5/5.
  - On B's screen the boomerang stops and hovers 1.96 m from the shell's centre (radius 1.6). A's ghost of it does the same.
  - B's shred moved the host's meter from 0 to −135 (through kh).
  - A's kid, 0.9 m behind the shell, stayed at 100 hp. No page errors.
- One bot match on lockgate: Bravo won on no-pickup in overtime, first pop 14.3 s, 1 plant, 0 clamp rejections, 0 console lines, 0 frame errors.
- All nine HUD scenes rendered again at 960×600 (the committed set is 960×540).
- `npm run check`: syntax ok.

**Round 2's issues, checked:**
1. **Devices inside the shell.** `crushIn` now exists, and the shell crushes while it grows and while it stands. Thrown subs glance off. M1–M4 pass, and the online crush test passes.
2. **Tracer Bolt, Whirl Boomerang and Lurk Mine.** All three now count into the shell and stop on it. M5 passes: every sub counts more than 0, none is ever inside the shell, and the kid behind it is unhurt except by the Waddle, a walker that goes round it. My online probe agrees.
3. **The Carp Blast banner.** It now stays up and says where the Bazookarp went (L11b).
4. **The splat screen.** It names the mode's causes (L12).
5. **karp-field's load row.** It is split into two rows, each named after what it checks.
6. **carrier-foe.jpg.** It now shows Bravo's own 100 on the left and Alpha's 81 on the right with the carp tab. The badge cache is keyed by the viewer, which is a real fix in the game. No staging banners are left in the pictures.

The builder's logs of the old engine show these checks fail without the fixes (L + M 12/19, net-karp-crush 2/4). All source commits after b8f98b38 are comment-only tag lines; I checked the diff.

**Other modes and builds:**
- Every round-2 hook is behind `G.objTargets`, which is null outside the mode and is cleared on dispose.
- The tower's `crush(T)` is unchanged. `crushBuoy`'s new parameter defaults to 'crush'.
- The web build copies `src/`. The desktop package leaves out `tools/`, and nothing in `src` imports from `tools/`.
- Per-frame cost is small: the standing-shell crush allocates two closures a frame, and the hit paths clone only when something is hit.
- `docs/NET.md` and the botlab README are up to date.
- Six one-line shared edits are untagged: the actor.js and match.js import lines, bots.js 2965, subs.js 523, and the boomerang.js lines under a tagged comment. That only matters to the integrator.

**Pictures** (I looked at all nine, plus my nine at 960×600):
- They read at a glance and match the game's style. The status line and DON'T RETREAT! are clear.
- The carp glyph reads as a fish on the special orb, the marker and the badges. The HUD has no crowding at 960×600.
- **Not convincing:** the carried carp is still the SPEC's placeholder, a capsule plus a cone. It looks like a pink rocket. The weirs and Gate are plain posts. Both are WP2's finished face; the mode is hidden.
- weir-plant shows the opening 8-second prompt next to WEIR DOWN!. That is because of how the scene was staged (5 s into the match), not a game bug.

**Builder's claims vs what I found:** accurate, apart from the merge note in issue 1 below.

**Still WP2 / WP3, correctly flagged by the builder:**
- The results screen renders through the Tower layout.
- No carp icon on the minimap or TAB map.
- The real carp model and audio.
- The bots are weak.
- The latency (netlag) steps.
- net-karp-host was not re-run this round; no migration code changed.
- A Shaker thrown flat at the shell counts 0. It bounces off as it would off a wall; lobbed onto the shell it counts 64.

### [minor] The merge note tells the integrator to keep b5-sub-bobber's crushIn, which would crush Drip Curtains up to ~3.7 m from the shell; no test would catch it

**Evidence.** LEAD-REPORT.md line 76 says the two subs branches' crushIn are "supersets" and that this package's version "adds nothing they lack". Line 1053 says: "b5-sub-sentry's and b5-sub-bobber's crushIn supersede this one; keep theirs".

Sentry's version agrees with this branch: it tests the curtain's sheet against the sphere (`curtainSphere`, sampled along the sheet).

Bobber's version does not. `git show b5-sub-bobber:src/game/deployables.js` line 330 tests a curtain against a sphere as `inside(it.pos, it.sub.height, it.sub.width / 2)`: an upright cylinder of radius 1.7 m round the curtain's base point (the curtain is 3.4 m wide).

The shell calls crushIn every frame while it stands, at radius r − 0.3. With bobber's version, any Drip Curtain whose base is within 3.0 m of the shell's centre is destroyed. When the shell has swelled to 2.3 m, that becomes 3.7 m.

I replicated both tests (scratchpad rev3/curtain-calc.mjs). A curtain resting 2.21 m out, where M3's curtain comes to rest after glancing off:
- karp's and sentry's tests: never crushed;
- bobber's test: crushed at every shell size.

So after the merge, a curtain thrown in front of the shell to block enemy shots would crunch the moment it lands. That breaks this package's own decision in §2 #17 that a device merely beside the shell survives.

No check guards this:
- M3's curtain row passes when the curtain is gone, because `rest.every(...)` over an empty list is true and nothing was ever inside the shell;
- M4 tests only a beacon;
- M1 and M2 only check that devices are crushed.

**Fix.** 1. Correct the integration note: keep sentry's crushIn, or give bobber's version the sheet test (`curtainSphere`) for the sphere shape.
2. Remove the "supersets / adds nothing they lack" claim.
3. Add a rules check that fails on the over-eager version. For example, in M4: a Drip Curtain set down whole beside the standing shell, its sheet 0.5–1.0 m outside the surface, still stands after 1 s at rest and at 60 % of the meter, and is crushed once the swelling reaches it.
4. Re-run group M on the merged branch.

## The integrator's report (b5-int3 @ b55f7472)

b5-int3 has all five packages merged onto it (plus the scaffold), and it holds up: every new test, regression, online test and bot match passes, with three exceptions. One row is a flaky check that also fails on the untouched base, the bobber performance test fails as it did for its builder on this loaded machine, and the Glide's flaky final check (the review's HARNESS abort) failed 1 run in 11. The final head of b5-int3 is **b55f74725c0b432a3ca90c2ad305170c7c715efc** (b55f7472). Nothing was pushed, new-stages wasn't touched, and no balance sets were run.

## Merge log and conflicts (all --no-ff, with the COMMON.md author and trailer)
1. **6431a1a5 b5-subscaf**: clean.
2. **4ee1b0a7 b5-sub-glide**: clean.
3. **a5b4e1cf b5-sub-sentry**
   - `deployables.js`: the sentry's kit-device code replaces the Glide's narrower copy. I added the Glide's one line to `crushIn` so it skips `crushable === false` (the Glide is never crushed).
   - `registry.js` / `netmatch.js`: one `netHurt`/`sendDevHit` with the attacker, and `dropOwner` called once (it had been called twice).
   - `bots.js`: one "urgent" line serving both the Glide and the sentry. `botSpecials.js`: both danger loops kept. `cues`, docs, `match.cjs`, `sub-scale`: both sides kept.
4. **57c1ac6f b5-sub-bobber**
   - `crushIn`: kept the sentry's. The bobber's treated a Drip Curtain as a 1.7 m body round its base, so it would crush curtains ~3.7 m from the shell — the karp review's open point.
   - From the bobber I kept its `_lost` rule (a floating bobber always re-floats itself, so ghosts get told) and its capped `sightRay`.
   - **Decision for the lead:** I raised the kit sight-line cap from 6 to 8 per frame. A sentry look can need 8 lines (2 per foe, 4 foes), and over the cap it restarted every frame and never finished.
   - `deployables-bots` `live()` now handles both the sentry's and the bobber's device shapes.
5. **fef0e15d b5-sub-dash**
   - `weapons.js`: the Glide's main-weapon lock and held-press latch, plus the dash's `dropCharge`, busy-while-dashing and on-press skip.
   - One kit bot loop in the turf think. In Boss Battle the random sub press now skips on-press subs and asks a kit's boss hook.
   - `main.js`: the own sub's prompt is asked once a frame (the dash's tip needs the frame time). I removed a duplicate reticle-dim toggle.
6. **07d5bca3 b5-karp**
   - `deployables.js`: the sentry's `crushIn` with the karp's exact curtain-sheet test. The shell's re-form and the stage registry both reach it.
   - `actor.js`: the dash's movement merged with the carrier's rules (no roll or leap while carrying, the karp's roof test, the Carp Shot kick).
   - `bots.js`: the carrier's "never throws" guard now comes after the kit bot loop and also clears a queued bot throw.

## Interaction checks — new `tools/botlab/tests/int3.js`, all passing
- **Against the real Roe Shell (karpbox):**
  - The Glide bounces off it and its blast counts (96).
  - A dash at it is held outside every frame and its blast counts.
  - A thrown bobber settles 0.45 m out from the surface; a 3-chain counts into the shell exactly once.
  - A sentry never sees a foe straight behind the shell, and locks and fires once the foe moves past its edge.
- **The shell re-forming:** it crushes a sentry and a 2-chain (one `device:down` 'shell' each), never a resting Glide. A curtain whose sheet is 2.6 m away survives; the bobber's version would have crushed it.
- **The carrier:**
  - A sub press only gives the Bazookarp's "Can't use".
  - A dash ends at the pick-up.
  - A cooking Glide fizzles.
  - A sentry and bobbers already out keep working.
- **Tower:** it crushes a sentry and bobbers on its track (never left inside the platform). A sentry and a bobber on the deck ride it with zero drift.
- **Calamari railcar:** a bobber rides it 28.7 m. A sentry is refused on the roof. A sentry on the trackbed is never inside the car, but is shoved ahead of it the whole trip (26 m) — that is wave 1's existing push rule.
- **A dash into an enemy Drip Curtain** never crosses it, at 60 and 24 fps.
- **Picker, lobby and online:** `loadout-picker` shows every sub. I extended `net-lobbykit` so the guest picks the Dash Pellet and the host the Chain Bobber; both show on both screens and in the match (16/16).

## Fixes I made (each committed separately)
- **40da5abf, Glide bots:** Cutlass and Mitts tactics now wait while a Glide cooks, so the bot holds its ground. `only=bots` with the Cutlass 4/4 and with the Mitts 4/4; I didn't re-run the failing baseline.
- **6afe6c06, bobber bots:** a bot's own Splat Bomb, Cling Charge, Pop Pellet or Sprinkler throw that would land in an idle chain of its team (a human's included) is held. It still throws if a foe the team sees is in the chain. Other thrown subs are not covered.
- **865468c5, DECISIONS #22:** the Twinfire roll and the Mitts leap now move in the dash's ≤ 0.2 m substeps. At 24 fps a roll went through a 0.10 m wall with the rule off and stops at it with the rule on. The leap clung to the wall at 24 fps even with the rule off, so the leap half has no failing case.
- **9a18c168, sentry bots:** the 10–14 s cooldown now starts when the sentry is actually set down; a decision lost before the release costs 1.5 s. This answers the "thrown-away decisions in Tower Command" issue.
- **Test changes:**
  - **9e5621b4:** `bazookarp-rules` M5 now runs only the subs from before this wave (int3 covers the four new ones), and `sub-dash` allows the Bazookarp's own "Can't use".
  - **90b82366:** `int3.js`, plus `karp-match.cjs` now takes `SUBS=`.
  - **b55f7472:** the `net-lobbykit` extension, and `sub-glide`'s last check now reports a missing stone as a FAIL with its state instead of aborting.

## Test results (local, one Electron at a time)
- **Glide:** `sub-glide` 59/59 in 3 runs; in 1 run its last check got no stone (the review's HARNESS abort). Full-run probes 7/7. `net-sub-glide` 11/11, hostleave 5/5.
- **Sentry:** `sub-sentry` 46/46 (twice), tower 3/3 (twice), zones 1/1, boss 1/1. `net-sub-sentry` 12/12, tower 5/5.
- **Bobber:** `sub-bobber` 75/75, tower 2/2, zone 1/1, pod 1/1, boss 1/1. `net-sub-bobber` 11/11. `perf-bobbers` 4/5: phase 4 frame time was +5 ms against a +3 limit at load ~15; the bots' own sight deferrals stayed at 0.
- **Dash:** `sub-dash` 42/42 after the test fix (41/42 before). `net-sub-dash` 7/7.
- **Scaffold:** `sub-scaffold` 5/5, `net-subscaf` 4/4.
- **Bazookarp:** `bazookarp-rules` 117/117, `karp-gun` 12/12, `karp-loop` 6/6, `karp-two` 6/6, `karp-shell-dps` 36/36. `karp-field` 19/21 at load ~48, then 21/21. `net-karp` 19/19, `net-karp-crush` 4/4, `net-karp-host` 6/6 (bots) and 4/4 (cargo).
- **Regressions:**
  - Passing: `sub-tweaks` 29/29 (twice), `sub-scale` 83/83, `deployables` 34/34 (tower 11/11, rail 2/2, hedge 3/3), `bot-specials` 19/19 (tower 1/1), `tower-rules` 26/26, `hud-lead` 22/22 · 14/14 · 12/12, `loadout-picker` 23/23, `stage-mods` 36/36, `world-build` 5/5, `holds` 325/325, `net-practice` 29/29, `net-turf` 9/9, `net-deploy` 7/7.
  - `tuning`: 11/12, then 12/12 (a roller bot rolled 39 % of the time against a > 40 % bar).
  - `sub-tweaks2`: 22/23 in all 3 runs, always the Tideline Bow trail row. The untouched base fails the same row 2 runs in 6, so it predates this merge, though int3 failed it more often (5 of 6 bow-only runs).
  - `deployables`, `bot-specials`, `tower-rules` and `hud-lead` ran before the later bot and movement fixes and weren't re-run after them.
- **int3:** karpbox 10/10, tower 2/2, turf 4/4, rail 2/2.
- **Bot matches:** halyard, saltpan, calamari and treehills in Turf War, Zone Control and Tower Command (random weapons, two new subs per team), plus `karp-match` on karpbox and halyard — 14 matches, 0 console errors, 0 frame errors, stuck 0.1–1.1 %.
- **Audio, run last:** `sfx-cues` 58/58, `audio-pause` 10/10.

## Still open (reported, not fixed)
- **Bobber bots still get almost nothing** from the sub: 2 chains set off in 12 matches, both with no foe in them, 0 splats. Zone guard reliability was checked once (1/1), not ten times.
- **Glide:** the last check's missing-stone failure isn't root-caused (1 in 11 here). Bots mostly throw it to paint. There is still no picture of the underhand roll.
- **Sentry:** the icon palette, the buried squid stencil, the Practice late-joiner gap and the weak checks are untouched. It locked onto a target only 0–5 % of its life in matches.
- **Dash:**
  - The stage audit's missing moves (a swim jump then air dash, an air dash late in a long fall) weren't run.
  - The speed ribbon vanishes on a forward or backward dash from the player's own camera. It is a vertical strip seen edge-on, so it needs a different effect, not a tweak.
  - The full dash-reach audit wasn't re-run on the merged tree.

Logs and the run list are in `/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/int3/` (`results.txt`, `logs/`).
