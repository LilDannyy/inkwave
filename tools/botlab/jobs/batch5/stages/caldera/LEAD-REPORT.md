# Highmark Foundry: the lava engine — fix round 9 (after review 9)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera, from e080bcdd + the lead's notes ef87685f.
I did the five "After review 9" items in their order, with their proofs.

- **Local runs**: one Electron of mine at a time under the shared SLOTS=3 lock (BOTLAB_OUT=inkwave-upstream/.botlab),
  WATCHDOG=900000. The local load was 9–108 all session (the user's own apps), so no online test ran locally.
- **The final code is 8af0f595.** Its last behaviour change is 6509d4c6 (item 4); 8af0f595 changes a comment only.
  Nothing in `src/` changed after it.
- **Mac mini**:
  - JOB-16 @ 458231a9 (the code of b083a41e);
  - JOB-17 @ 72d1b348;
  - JOB-18 @ 218bd500 (before 6509d4c6 and net-lava's fix);
  - **JOB-19 @ a51c7408, the final code: every check full** (net-lava 13/13, rule 47 all parts, lava.js 60/60 ×3,
    lava-bots 7/7, land9-rise 61/61).

**Read this first: four things go beyond the list's words.**
- **A Sponge Mitts leap reaches the cliff's ends.** Once the cliff was non-inkable, the corrected reach bar still found
  16 outer-wall tops a kid reaches, by leap. Steering back off them killed 18 kids at HIGH and 18 at r60. So
  `_roofLandWet` gained a check for the landing behind and beside a tall top's way off. This is the reviewer's
  alternative fix, widened.
- **The rescue waits for a node within 6 m.** With none in reach it holds on, up to 2 s in all, then falls back to 12 m.
  Measured from the kid's own move, race 3's boulder in the fall stood 6.02 m from both heads' nodes; the shelf beside it
  is bare within a second.
- **The middle hornito moved 0.64 m, not 0.2 m.** At 0.2 m its far corner would still be 6.19 m from the node.
- **A lava escape drops a Mitts leap charge.** That was F8c's in-suite cause: traced, reproduced, fixed.

## 1. What was built, item by item

### 1. The Slump cliff faces are non-inkable; rule 47 b with the reach bar corrected (b083a41e, 35cee2be)

- **layout.js**: the E_cliff wall is `calCliff` (`{ ...calWall(), paint: false }`), still a visible level block in the
  lava region.
  - The high mark's rind is the level shader's band (lavaFx `BASE`), not paint, so it still reads on the cliff.
  - Pictures `out/fix9/fix9-slump-cliff-rind-low` and `-high` (looked at): ink splatted all over the cliff's faces takes
    no hold, while the hornito beside it takes ink. The ash-white rind runs along the cliff at the high mark.
- **The reach bar** (lava-audit rule 47 b). A top counts as one a kid reaches if any of these holds:
  - **a hop**: ≤ 2.6 m over the dry floor within 6 m (review 8's bar);
  - **a squid climb**: an inkable side face rises to it from dry floor at its foot, whatever the height (review 9);
  - **a Sponge Mitts leap**: the kit's own predictor (`MITTS.predictLeap`) lands on it from a dry nav node (mine, §2).
  - Steering back runs on every top a kid reaches.
- **Part e** (review 9's probe-wall9 folded into the rule). A squid climbs every inkable face of every roof top beside
  the lava, every 0.5 m, at all six levels.
  - On top it stays idle or steers back against the slide: gated at 0 deaths.
  - Still pushing the climb's way and steering left or right are listed, as b's rule has listed them since round 8.
- **What the corrected check found** (local; ef87685f's code with the new test):

  | state | tops a kid reaches by climb / Mitts | rule 47 b deaths at HIGH and at r60 | part e deaths per level |
  |---|---|---|---|
  | cliff inkable | 6 / 10 | 18 and 18 | 28 (1 steering back) |
  | cliff non-inkable | 0 / **16** | **18 and 18** | 22 (0 steering back) |

  - The cliff's tops stay reachable non-inkable: a leap from the Rim Head (4.2) lands on its ends (#944/#953/#954 and
    twins). #907 and #943 (and twins) are other outer-wall ends, 7.0–8.0 m over the yard and the Rim Head.
  - Steering back off them came down in a 0.5 m lava slot between a wall and the 2.6 m floor (#907, trail in
    probe-back), or slid along the wall's face into the lake (#943, #954).
- **The engine fix** (actor.js `_roofLandWet`, [b5-caldera]):
  - A kid steering back off a tall top lands up to B = ½·20·t² − 0.85·v·t behind the way off; t is its fall to the
    exit's floor, v the slide's speed. The 0.85 is margin: B is a difference of two large numbers, and the push's ramp
    leaves the kid slower than the model's v.
  - A face it meets on the way down turns the steer along it.
  - So every point within B + 0.35 m of the exit where a body can stand must be over dry floor: under the body's middle,
    a seam ≤ 0.24 m bridged, now and 3 s on. If not, that way off is refused. Every way refused means the existing hold
    and rescue.
  - B ≤ 0.05 on low cover (1.1–1.3 m), so low cover is untouched.
- **After, at the final code: 0 deaths, 0 flings, 0 perches at every level, locally and on the Mac mini (JOB-19).**

  | b level | put-downs touched | held → rescued | farthest rescue (across the ground) |
  |---|---|---|---|
  | LOW | 11,610 | 2 | 1.73 m (the cliff's #952, rescued onto the shelf) |
  | HIGH | 15,390 | 2,018 | 5.8 m (the moved hornito) |
  | r30 | 11,086 | 940 | 5.8 m |
  | r60 | 14,683 | 2,058 | 5.99 m (race 3's boulder) |
  | r90 | 14,730 | 2,018 | 5.8 m |
  | f50 | 15,390 | 2,174 held, 1,930 rescued, 244 slid off dry as the lava fell | 5.8 m |

  - Part e at every level: 210–258 climbs reach a top, 0 deaths idle or steering back.
  - Steering across is listed: 13–14 deaths per level, on the Tide Boards (6 + 6) and the gauge machine house (1–2).

### 2. Rule 47 measures the rescue from the kid's own position, gated at ≤ 6 m (35cee2be, b083a41e, d615b39d, a01dc415)

- **The test.**
  - `look()` keeps the kid's position each frame. At the teleport (`netTp`) the distance is the kid's own move, from where
    it stood the frame before to where it stands.
  - **The gate is across the ground (≤ 6 m)**, as the engine's own radius is. The 3-D move is listed beside it
    (`rescueMaxM`): off a 7.75 m wall top the drop alone makes it 8.56 m.
  - The capped `rescueLog` is no longer read. The engine's uncapped `stats.rescueFar` is reported (`engine`).
- **A wrong claim from round 8, corrected.** Round 8 said "the 12 m fallback is never needed". It is needed for the outer
  walls' middles (#945–#950 and twins) at HIGH: up to 8.2 m across the ground, 290 rescues per HIGH level of b.
  - No kid reaches those tops: no hop, no climb, no leap.
  - **So their rescues are listed (`unreachRescue`), not gated.** Every rescue off a top a kid reaches is gated (§2).
- **The middle Slump hornito** (#862 / #1688) moved −157° → −155.8°, 0.64 m south along the cliff.
  - Measured from the kid's own move, a kid held at its far corner was 6.35 m from the south head's node.
  - 0.2 m would have left 6.19 m.
  - It is now 5.8 m in rule 47 b, 5.34 m in the reviewer's probe-far9, and 5.53 m worst in probe-held9 B.
- **Race 3's boulder in the fall.**
  - A kid held at its line-side face at the fall's 50 % stood 6.00 m from the island's node and 6.04 m from the north
    head's. Every nearer node was under the still-falling lava.
  - Narrowing and shifting the boulder 0.15 m gained 1 cm, so I reverted that.
  - **The rescue now holds on for a node within 6 m**, up to 2 s held in all (lava.js `RESCUE.wait`; the actor asks again
    every 0.25 s), then takes the nearest within 12 m.
  - **Rule 47 b's rise and fall levels now run the lava's clock with each trial's frames**, as in play and in the
    reviewer's probes; LOW and HIGH hold.
  - With both: the fall's farthest is 5.8 m and the rise's 5.99 m.
  - The outer walls' middles at HIGH wait the 2 s, then fall back.

### 3. `roofHeld` is cleared wherever the hold ends (b083a41e, 35cee2be)

- **actor.js `_roofOff()`** clears `roofT`, `roofDir`, `roofHeld` and `roofHeldSum` together. It is called:
  - in `_integrate`'s off-roof branch (which used to clear only `roofT` and `roofDir`);
  - in `update` when a super jump or a special that owns the body (`body`, `pin`, `hang`) takes over.
  - So the HUD line never sticks on NO FOOTING → rescued.
- **lava.js test G9** (review 9's probe-held9 A). The hornito, the mould stack and the ladle stand at HIGH, each held and
  then left three ways: a super jump, the Slam, or put off the top. G9 checks that:
  - `roofHeld` is 0 the frame it leaves;
  - no rescue follows;
  - 5 s on, the personal line is not NO FOOTING (`_mine`, and the shown DOM line);
  - in the next rise's warning, on a drowning floor, the line reads GET OFF THE LOW GROUND.
- **G9 fails on the old actor.js**: NO FOOTING is stuck 5 s on and at the warning (local `lavajs-oldactor`).
- It passes in every run at this round's code: local ×5, Mac mini JOB-16 ×3, JOB-17 ×3, JOB-18 ×3, JOB-19 ×3. (G9's
  first form failed once locally: it read a hidden line's leftover `is-rescue` class. It now reads a shown line.)

### 4. F8c records the trail; lava.js 3 runs clean; the in-suite state traced and fixed (35cee2be, fcfba0f0, 6509d4c6)

- **F8c keeps the trail** of a case not up or dead.
  - Its starting state: weapon, form, carry, roof slide, jump buffer, coyote, status, and the kit's own state (a Mitts
    charge / leap / cling).
  - Every 0.1 s: position, what it stands on, speed, the hold, the bot's mode / escape / stone step / jump cool-down /
    jump pressed, the lava's level, the kit's state.
  - PAGE_ARGS `w1=` gives F8c's bot a weapon (to reproduce).
- **The miss, traced.** JOB-16 lavajs-1: race 7, t0 39.6, node 4468, a Mitts bot, not up and dead 1.5 s in.
  - In isolation a Mitts bot passes all 76 cases (`probe-f8c-w`).
  - With a Mitts **charge left on the kit** before each case, 25 of 76 fail. The kit swallows the escape's hop while it
    charges, and the bot code lets the charge go as a pounce along its old aim: off the stone into the lava.
  - The suite's earlier sections can leave such a charge on F8c's bot.
- **The fix** (lava.js `botAct`): a lava escape drops a Mitts leap charge (`MAIN_KITS[kind].dropCharge`).
  - With the leftover charge: **0 of 76**, slowest 1.3 s.
  - It is a real bot gap too: a Mitts bot charging a pounce as its stone sinks.
- **lava.js at the final code: Mac mini JOB-19 60/60 ×3 (F8c with blade / bucket / bow).**
  - Local at the final code: 60/60, 59/60 (**F10**, §6), 60/60.
  - Earlier this round: local 60/60 ×2 (one with `w1=mitts`); JOB-16 59/60 (the F8c miss above), 60/60 ×2; JOB-17
    60/60 ×2, 59/60 (F10); JOB-18 59/60 (F10), 60/60 ×2.

### 5. The boss's roomiest-heading fallback is gated on `layout.boss.roamAfter` (b083a41e)

- **bossBrain.js `_walk`**: `if (by === null && RT)`. RT is `layout.boss.roamAfter > 0`, which only Highmark sets (grep).
  - Every other [b5-caldera] change in bossBrain and bossNav is already inert on other stages.
  - Each is gated on roamAfter or noGo, or keeps its old behaviour by default: `_turn`'s `dir` / `free`,
    `goalIds === planIds`, `lineOk`'s slack 0.3.
- **boss-check (Mac mini JOB-16)**, this code against int4's boss code (f687b4c2, swapped in for the baseline):

  | stage | this code | int4's boss code |
  |---|---|---|
  | calamari | 6/6 | 6/6 |
  | treehills | 4/6 (home ground 115 m², it roams 8 m) | **4/6** (the same two misses; 16 m) |
  | kelpline | 5/6 (it roams 12 m) | **5/6** (15 m) |

  - **Unchanged.** Treehills' and Kelpline's misses predate this branch's boss changes.
  - Highmark: **6/6 ×5 in JOB-16** (longest idle 4 / 6 / 3 / 3 / 8 s) and **6/6 ×5 in JOB-18** (4 / 3 / 4 / 4 / 3 s;
    the boss code is the same at the final code). Local at the final code: 6/6 (idle 3 s).
- **The two side views, re-shot with the kid in frame** (`out/fix9/`): `fix9-hornito-held-side`,
  `fix9-hornito-rescued-side`, `fix9-mould-stack-held-side`, `fix9-mould-stack-rescued-side`.
  - The kid is a teammate bot (fix8's side view was hidden by the local player's rescue vignette).
  - The camera is set from the cover and the rescue's node, so both stand in the frame with their rings.
  - Looked at: the kid on the hornito in the lava, then on the south head's coping 4.9 m off; on the mould stack, then
    on the coping beside it.

## 2. Decisions where the list left a gap

- **The reach bar counts a Mitts leap, not only a climb** (the lead's words were "so climbable tops are included").
  After the paint change the cliff tops are still reached by a leap, which is a kit's movement and not a special. A bar
  without it would have passed with 18 steer-back deaths there.
- **That led to an engine change in `_roofLandWet`**: the reviewer's own alternative ("fly the steer-back arc behind the
  exit too"), widened into a disc round the exit, because a face turns the steer along it. It applies to tall tops only.
  - Its cost: a few more holds at the margins: 59 on one outer wall in rule 47 d (#1803, each rescued ≤ 2.55 m), 2 on the
    cliff at LOW.
- **The 6 m is across the ground**, the engine's radius. The 3-D move is listed.
- **Rescues off tops no kid reaches are listed, not gated.** These are the outer walls' middles: ≤ 8.2 m, the 12 m
  fallback after the 2 s wait. Only a special lands there.
- **The rescue waits (≤ 2 s in all) instead of a geometry move at race 3's boulder.** The wait acts only when no node is
  within 6 m.
- **The middle hornito moved 0.64 m.** The lead's "0.2 m" left 6.19 m by the kid's own measure.
- **Rule 47 b at the rise's and the fall's levels runs the lava's clock** (as in play and in the reviewer's probes);
  LOW and HIGH stay static.
- **Part e gates idle and steering back.** Still pushing and steering across are listed, as b's rule does (the player's
  own route).
- **F8c got a fix, not only a trace** (the escape drops a Mitts charge): the trace showed a real bot death path.
- **net-lava.cjs** painted the Slump cliff to test ink across the waterline, so JOB-16 failed it 12/13: the host's HIGH
  paint took no hold. It now paints the island's lake face at θ 130–150°, which drops through both waterlines inside the
  region. JOB-19: 13/13.

## 3. Online behaviour and bots

- **Online.** No new record.
  - The hold, its end, the wait and the rescue all run on the actor's owner's screen. The rescue is a teleport (`netTp`)
    that every other screen snaps to. The landing check reads the lava from the synced clock.
  - docs/NET.md: the wait; a hold left by a super jump or a special ends on the owner's screen.
  - **net-lava 13/13 at the final code (JOB-19)**: the lava cells agree at the results screen (74,242 cells, 53 differ,
    ratio 0.99929). The late joiner's imported grid and the live guest's lava cells equal the host's, with the island's
    face painted across both waterlines.
- **Bots.**
  - They are held and rescued like anyone, and a lava escape drops a Mitts charge (item 4).
  - **lava-bots**: 7/7 with 0 deaths in 360 bot-trials in JOB-16, JOB-18, **JOB-19 (final code)** and locally at the
    final code. One local run at 25a2f380 was 5/7 (§6).
  - **Zone Control**: 7/7 ×2 in JOB-16, JOB-18 and locally at the final code. 0 lava deaths in all six matches; Organ L
    held 50–124 s.

## 4. Tests, pictures, balance

**Local** (one Electron of mine at a time):

| test @ head | result |
|---|---|
| check-maps, 8 caldera variants @ b083a41e | all ok (1,805 pieces; bazookarp 1,867; boss 1,674) |
| rule 47 b,e HIGH + r60 @ ef87685f code (before) | b 18 + 18 deaths; e 28 + 28 deaths |
| rule 47 b,e LOW + HIGH @ final code | **PASS**: b 11,610 / 15,390 touched, 0 deaths; e 0 idle / back deaths |
| rule 47 b r30 + r90, f50 + r60 (clock running) @ final code | **PASS**: 0 deaths / flings / perches, farthest 5.8 / 5.8 / 5.8 / 5.99 m |
| rule 47 e r30 / r90 / f50 | **PASS** (0 idle / back deaths) |
| rule 47 a,c,d @ 25a2f380 | **PASS** (as JOB-19 below) |
| lava.js @ final code | 60/60, 59/60 (F10), 60/60 |
| lava.js, earlier this round | 60/60 ×2 (one with `w1=mitts`); 59/60 once (G9's first form, fixed) |
| lava.js with the old actor.js swapped in | G9 fails (NO FOOTING stuck); F10 fails too |
| F8c repro (`probe-f8c-w`, a Mitts bot with a leftover charge) | 25/76 fail → **0/76** with the escape's drop |
| F10 repro (`probe-f10`, the claim from the pads N times) | random loadouts 16/16 pass; every bot a bow: **1/8 runs miss at the final code and 1/8 at the pre-round code**; no claimant held or rescued in any run |
| review 9's land9, the rise (alone) | **61/61** |
| lava-bots | **7/7** @ final code (5/7 once @ 25a2f380, §6) |
| Zone Control ×2 @ final code | 7/7, 7/7 |
| boss-check Highmark @ final code | 6/6 |

**Mac mini:**

| job @ head | result |
|---|---|
| JOB-16 @ 458231a9 (code b083a41e) | check-maps 8/8 ok |
| | **rule 44 LOW 23/23, HIGH 25/25**; audit rules 14 / 21 / 22 / 25 / 38 / 45 / 46 pass, rule 42 fails (art phase) |
| | rule 47 a,c,d 2/2; b,e LOW / HIGH / r30 2/2; b,e r60 / r90 / f50 1/2 (only race 3's 6.02 m rescue at f50, frozen clock; fixed since) |
| | lava.js 59/60 (F8c → item 4), 60/60 ×2; lava-bots 7/7; Zone Control 7/7 ×2 |
| | boss-check Highmark 6/6 ×5, the other stages as §1.5 |
| | held9 35/35 (C: no inkable face, no climb reaches a cliff top), far9 2/2, wall9 1/1 (0 rows), land9-high 13/13; land9-rise met the watchdog run beside land9-high |
| | lava-karp 10/10; net-lava 12/13 (the cliff paint → retargeted) |
| JOB-17 @ 72d1b348 | lava.js 60/60, 60/60, 59/60 (F10) |
| JOB-18 @ 218bd500 (before 6509d4c6 and net-lava's fix) | lava.js 59/60 (F10), 60/60 ×2; lava-bots 7/7; Zone Control 7/7 ×2; boss-check Highmark 6/6 ×5; held9 35/35, far9, wall9, land9-high 13/13 |
| | rule 47's three parts met the watchdog side by side (the clock-running b levels are slower); land9-rise again; net-lava 12/13 (old test) |
| **JOB-19 @ a51c7408 (the final code)** | **net-lava 13/13** |
| | **rule 47 PASS in five parts**: b LOW / HIGH, r30 / r60, r90 / f50; e all six levels; a,c,d (a 4,332 / 5,000 hop-ons; c Mitts 1,077, run 168, swim 318, rise hops 616; d 14,143 / 14,412). 0 deaths / flings / perches; every rescue off a reachable top ≤ 5.99 m; engine `rescueFar` 0 in a,c,d |
| | **lava.js 60/60 ×3**; **lava-bots 7/7** (0 deaths in 360); **land9-rise 61/61** (2,982 landings, farthest rescue 5.61 m) |

**Pictures** (`stages/caldera/out/fix9/`, looked at):
- `fix9-hornito-held-side`, `fix9-hornito-rescued-side`, `fix9-mould-stack-held-side`, `fix9-mould-stack-rescued-side`.
- `fix9-slump-cliff-rind-low`, `fix9-slump-cliff-rind-high`.

**Balance (informational)**: Zone Control 0 lava deaths in all six matches.

## 5. Commits and shared files

- **Code**:
  - b083a41e: the cliff, the hornito, `_roofOff`, the steer-back landing, the boss gate. actor.js is final there.
  - d615b39d: the rescue's wait.
  - 6509d4c6: the escape drops a Mitts charge.
  - 8af0f595: a comment.
- **Tests**:
  - 35cee2be: rule 47's reach bar, the measure, part e; G9; F8c's trail.
  - a01dc415: rule 47 b's clock; a far rescue's from-position.
  - fcfba0f0: F8c's kit state; `w1=`.
  - 01f7ea2b: net-lava's waterline paint.
- **Docs**: 94ee1421 and 453ed374 (STAGE-MODS, NET).
- **Scratch**:
  - jobs: JOB-16 458231a9; JOB-17 bc3ccfa3; JOB-18 0259f32a, 32ecb327, 8ef50054; JOB-19 a51c7408;
  - pictures 3c29cd86; DESIGN / ENGINE e6d14b65 and 25a2f380; probes de60b171;
  - the Mac mini's results, merged; this report.
- **Pushed**: only `fork botlab-b5-caldera`, fetched and merged first, never forced.

**Shared files** (all hunks tagged [b5-caldera]):
- `src/game/actor.js`:
  - `update`: the hold ends when a super jump or a body / pin / hang special takes over;
  - `_integrate`'s off-roof branch calls `_roofOff()`;
  - `_roofOff()` (new);
  - `_roofLandWet`: the steer-back landing behind and beside a tall top's way off.
- `src/boss/bossBrain.js`: `_walk`'s roomiest-heading fallback gated on roamAfter.
- `docs/STAGE-MODS.md` (the `wet` and `rescue` rows), `docs/NET.md` (the rescue's wait; the hold's end).

**Stage-own files:**
- `src/game/lava.js`: `rescue`'s wait and `RESCUE.wait`; `botAct`'s Mitts charge drop; the `MAIN_KITS` import.
- `src/world/stages/caldera/layout.js`: `calCliff`; the hornito.

**Tests**: `tools/botlab/tests/lava-audit.js`, `lava.js`, `net-lava.cjs`.

**Scratch files**:
- `jobs/batch5/caldera/`: JOB-16 to JOB-19 .sh, `sum47.cjs`, `f8c.cjs`, `rescue9-scenes.js`, `probe-cliff.js`,
  `probe-back.js`, `probe-f8c-w.js`, `probe-f10.js`, `rev9/` (review 9's probes);
- `stages/caldera/DESIGN.md`, `ENGINE.md`.

## 6. Unfinished, flaky, uncertain

- **lava.js F10 (the Organ lookout claim) missed 4 times in 19 runs this round** (JOB-17, JOB-18, local at the final
  code, and local with the old actor.js swapped in).
  - Each time the claimants fought, refilled or stalled (no 0.6 m in 5 s) and never got up.
  - **It is not this round's change.**
    - It failed with the old actor.js too.
    - With every bot on a bow, probe-f10 misses 1 run in 8 at the pre-round code (ef87685f's src swapped in) and 1 in 8
      at the final code.
    - With random loadouts, 16 of 16 pass.
    - No claimant was held or rescued in any of those runs.
  - So it is the claim's own sensitivity to loadout and fights; not fixed this round. In the one local trail at the
    final code, a bow claimant stood still 5 s on the island floor at (−9.1, 1.2, −4.7) in paint mode, then fought.
- **One local lava-bots run was 5/7** (25a2f380): 1 escape-counted death. A roller in fight mode, its escape over,
  rolled at 11 m/s along the north head's coping toward a Race stone's node at the fall warning, and off the edge.
  - That is bots.js' path following, not touched this round.
  - Four other lava-bots runs this round were 7/7 with 0 deaths, including JOB-19 and local at the final code.
- **The steer-back check is conservative.** It holds and rescues kids on a few tall tops where a slide used to go:
  59 holds on one outer wall in rule 47 d, 2 on the cliff at LOW. Every one was rescued ≤ 2.55 m.
- **Steering across the slide off the Tide Boards and the gauge machine house can still drop a kid in the lava** (part
  e's listed rows: 13–14 a level). It is the player's own steer, not gated, as since round 8.
- **Race 3's boulder at r60 rescues at 5.99 m**: under the bar by 1 cm.
- **The outer walls' middles at HIGH**: no kid reaches them. A special landing there is held 2.6 s, then rescued up to
  8.2 m off.
- The rind pictures are dark: Highmark has no lightmap yet.
- Rule 42 and the lavafall's side patch belong to the art phase, untouched.
