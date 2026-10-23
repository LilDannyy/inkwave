# Highmark Foundry: the lava engine — fix round 6 (after review 6)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera, from 4faa8d6f + the lead's notes e8b2aa21.
The "After review 6" list was done in its order: the checks first (until they reproduced review 6's finds at 4faa8d6f's
geometry), then Organ L's launch pad, the stone corners, the carrier decision, F10 / F8b, the boss, net-lava. Local runs
one Electron of mine at a time under the shared SLOTS=3 lock (BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000; the
heavy repeats on the Mac mini through the runner (JOB-5 … JOB-8, scratch branch botlab-b5-caldera only, fetched and
merged before each push, never forced). **The final code is 19233cab: the Mac mini's job at it (JOB-8) and the one before
(JOB-7, at 27a0398c) ran everything full.** The load average here was 4.5–10 all session (another builder shares the Mac).

## 1. What was built, item by item

### 1. The checks first — they now reproduce review 6

- **lava-audit rule 44's march** (a65b0a37). The far floor is any standable floor across the lava down to the lava itself
  (was: within 1.3 m below the take-off); take-offs whose edge drops onto a dry strip (≤ 3 m) before the lava count; run-ups
  of 2.6, 1.5 and 0.8 m; a crossing is any flight over lava that comes down alive on floor past it, its gain measured from
  where it landed (nearest node within 0.6, then 1.4 m); an unmeasured gain fails the gate; the 15 m margin is part of the
  gate. **At 4faa8d6f it finds review 6's numbers**: HIGH 24 running jumps over 20 m, the largest 38.57 m (Organ L's HIGH
  top); LOW the largest 15.9 m. `PAGE_ARGS rules=21,44` runs only those rules; `full=1` dumps every crossing.
- **Rule 21** (a65b0a37, 56cac510). On top of the straight march: every stone's outline every 0.1 m, corners included,
  fanned ±67.5° every 7.5° over a 0.05 m map of the static tops and riders, the foot's 0.24 m support counted; a pinch is a
  top within 2.5 m reached after an unsupported stretch over 0.3 m (walking, a kid is 0.1 s unsupported and drops 0.13 m of
  the 0.30 m to the kill height). **At 4faa8d6f it finds exactly races 4, 6 and 7, both halves (review 6)**, plus race 2's
  head coping at 2.39 m, which this round also closed.
- **lava-notch.js** gains the diagonal set (the reviewer's probe-notch6 rebuilt: stones at HIGH, Organs at HIGH and LOW,
  outline every 7.5°, normal and ±22.5/45/67.5°, walk / run / swim off and back on; the "back on" walk only from where a kid
  can stand, and no trial from inside a crown pipe). **At 4faa8d6f: 136 deaths in the gaps** (race 4: 13, race 6: 15,
  race 7: 42 per half), as the review.

### 2. Organ L's HIGH top: no launch pad (53b3110c)

A parapet a kid can't run-jump over would also hide the lake, so the lookout's lava-facing rim carries a **crown of 12
basalt pipes** (rider parts, `CROWN` in the stage's lava.js): hexagonal, 0.26 m across, 2.0 / 2.1 / 2.2 m tall (over the
kid's ~1.8 m reach), clear gaps ≤ 0.52 m (a kid is 0.76 m wide), yawed square to the rim, un-inked; from the middle of
the north-west edge round the west, south-west, south (the stub fills its middle), south-east edges to the middle of the
north-east edge. The north flat (the climb from B) stays open. **Sightlines: 62 % of the crown's band is open** (rule 25
now measures it as a screen: ≥ 60 % open, no gap a kid fits, pipes ≤ 0.3 m, ≥ 2.0 m; the cover rule is unchanged without
it: 7 %, 1.0 m, 5 open sides). lavaFx draws them as hex pipes with a cap; lavaCore passes `pipe` through. The LOW 15.9 m was
a nudged nav node in a Ladle Road pocket: a walk link (`lava.walks`), walked by a kid. The deck-corner walk link stays.
**Rule 44 now: largest 14.15 m (HIGH; LOW 13.55), none over 15** (numbers in §4).

### 3. The stone corners: every gap a seam or open lava (a1fd7d13, 76a954e7, 039b8cb6)

- **Race 7** (the island end): the landing is a pier the stone's width + 0.2 m a side, 2.5 m long (geo.js `PIER_W 1.7`,
  `PIER_IN 13.7`); beside it the island's edge stands back at r ≤ 13.7, past where a walk off the stone at up to 67.5°
  reaches in 2.5 m (the face had run 0.7 / 1.1 m past the stone). Boss Battle keeps the island's old faces (`ISLAND_BOSS`,
  onlyIn 'boss': the bays would cut its home ground to 786 m²; it stays 818).
- **Race 6** (the north head): fix round 5's kerb is gone with the head's corner by the landing (`CUT6`, 2.35 m out along
  the Race's line) and the Ladle Road's corner over it (`BITE6`, 0.15 m past the walks' reach); the lava region runs
  0.5–0.6 m under both. The vent hood moved 2.5° round the Road to (23.4 m, 160°): its old place shut the lane past the
  bitten corner (a nav pocket; rule 44 read 18–19 m jumps from it).
- **Race 4**: the north head's south-west corner cut back in one straight edge (`CUT4`), the shelf running on under it (dry
  at LOW, drowned at HIGH). **Race 2**: the south head's north-west tip chamfered off (`CHAMF2`), the shelf under it; the
  shelf edge's coping keeps its 1.1 m hop, the chamfer's coping 1.3.
- Found on the way: lava.js `_exits` kept distances in a Float32Array, which rounded a queued distance below the stored
  one so the heap's stale test skipped nodes (two shelf nodes a half read "no way out" in rule 14 once the corner moved):
  now Float64Array. The carrier field: 9 new hop / gap pairs (18 edges) in karpVeto.js (201 pairs), from lava-karp K8.
- **Proof**: rule 21 **0 pinches in 27,978 fan walks** (1,432 fans); lava-notch diagonals **0 deaths in a gap in 3,481
  trials** (16 runs off a narrow far floor listed, not gated: race 4 two a half as before, race 7's pier one a half — new —,
  Organ L at LOW five a half, was 31).

### 4. Bazookarp carriers (5915a3da, 46dcb269)

DESIGN §3.5 rewritten with the lead's decision: a carrier swims its own ink (SPEC S21), so its swim and dash jumps over the
lava are skill movement like anyone's; what a carrier may bypass is judged per stage by the Bazookarp checker's shortcut
probes (#7d) when Highmark's Bazookarp layout is built (Pond, weirs and Gate placed so no carrier jump saves over 20 m on
the carrier field or skips a weir, with rails where it must). lava-audit's information row says so (no more "a carrier
makes neither"), and a **carrier row** tries every swim crossing saving > 10 m again with `actor.carry` set. **The list for
the layout builder**: `karp-stages/caldera-carrier-crossings.json` (LOW 72 crossings, 50 over 20 m, max 51.63; HIGH 85,
42 over 20 m, max 37.08); every crossing in `stages/caldera/out/fix6/rule44-crossings.json`.

### 5. lava.js F10 / F8b (4afb9c54, 4c6b0217, f0aee8b7)

- **F8b case A traced**: a stale `guardOff`. F8's escaping crew set the module's per-frame ask in botAct, the brain was
  frozen before bots.js read it, and the next frame's asked hop skipped the lava check (probe: 6/6 hops at 0.033 s with a
  stale guardOff). bots.js now clears the module's per-frame asks (`guardOff`, `hopAt`, `hopCheck`) right before the stage's
  botAct (probe: 0/20). F8b gains case D (asked with a stale guardOff on purpose).
- **F10**: once the top is climbable, a claimant busy below it (fight, retreat, refill) for over `LOOK_BUSY` = 3 s lets the
  claim go and is passed over 8 s; the plan hands it to the team's next kit (log 'busy', `stats.lookBusyOuts`). **Second
  step, after the Mac mini's JOB-5** (one run of three failed F10 with 3 busy outs, nobody up): the first cut counted a
  claimant *walking its claim's route in a fight* (the route is walked in a fight) — in 2 of 3 local runs a team's claimant
  was walking its route in fight mode, its route index rising (one already 3.3 m up Organ L's climb), when the claim went. Busy time now counts only
  after `LOOK_PROG` = 1 s without headway (a new best distance to the top by 0.4 m, or a waypoint of its claim's route
  passed). First run after: 59/59, both teams up (50.1 / 51.6 s), 0 busy outs.

### 6. The boss (9ec64cb1, ed26f71c)

- On roamAfter stages the brain keeps the half it stands on and since when; after `HALF_AFTER` = 25 s on one half its goal
  picks weigh the fight distance at 0.3 and the other half's goals gain a pull growing from +8 to +20 (at 65 s).
- **Second step, after JOB-5** (2 whole rounds of 5 on one half with the bias alone): a crossing once picked is kept
  (re-pathed) until the boss stands on the other half, `CROSS_FOR` = 14 s at most — re-picked every 3–5.5 s and at each
  retarget, a goal over the line lost to one near its mark before it got there.
- **A wedge found on the way** (boss-check 87 s at the Lower Surge Steps' foot (−7.7, −27.7), and 105 s at (−2.2, −23.3)
  earlier this round; camps 8, 8–9 back-outs): a move's end left the boss in a heading where neither the turn toward its
  waypoint nor a step fit, and a step is only tried facing the waypoint (probe: from yaw 0 there it never moved in 25 s).
  Now a turn that makes no headway for `TURN_STUCK` = 1 s goes the long way round (5 s), then through (3 s, claws clip for
  a moment); a heading the turn's rule refuses where it stands (a claw in a wall) first turns to the nearest one it takes;
  no new move is chosen meanwhile. Probe (`bosstrap`): every one of 8 headings at both spots leaves, at most 5 s still.

### 7. net-lava.cjs

Run once locally (13/13, at a load of 4.69 — over the rule's 4) and alone on the Mac mini three times (JOB-5, JOB-6,
JOB-7: 13/13 each; the live guest's non-lava cells 0.9991 ≥ 0.999, the lava cells 0.99959–0.99963). Rule 42 from the bridge and the
lavafall's side patch stay on the art-phase list, untouched.

### Also: the Zone Control lava death (f0aee8b7)

My first local Zone Control pair had one lava death (zones-2, 218.8 s: Sprinkle, a charger, on Bravo's drowning shelf in a
rise, escaping). The trail: in a fight, a zone guard's hold-ground (`_zoneHoldGround`) dropped `b.path` every frame, the
module re-planned the escape only each 0.05–0.25 s, so the fight's strafes backed the bot away from its exit for 1 s until
the rise had it. The module now sets **`b.stageRoute`** while a bot escapes, and bots.js's fight navigation leaves the
route alone (no hold-ground drop, no chase re-plan). STAGE-MODS.md lists the field.

### Also: an escape's footwork, and the air guard (27a0398c, 19233cab)

A local lava-bots run at f0aee8b7 drew a roster the earlier runs had not, and had 3 escape deaths and 1 fight death: a
Chain Bobber bot laying its chain held still and dove to top up its tank on the drowning shelf (the kit's botAct holds a
layer short of a fight, before it looks at `busy`, and an escape returns no aim), and a charger on a sinking stone, hunting
a lost foe, charged shots at an enemy device for 8 s (devShootAim) until the stone sank. While `b.stageRoute` the device
shooting is skipped, the kits are told busy, and the move, the dive and a trigger the module let go are put back after the
danger guard and the kits. The fight death was a Mitts bot letting go of a wall by the new bay at race 7's pier: the air
guard steered it "back" toward its last foot — a stone across the bay. The guard now flies its candidates in the brain's
flight model (the way back, no steer, the 8 headings) and keeps the first that comes down dry. Probes and runs in §3–4.

## 2. Decisions where the list left a gap

- **The crown, not a parapet or trimmed landings**: a parapet low enough to see over is cleared by the run-jump; trimming
  the landings would have cut race 1 and the causeway. 12 pipes, 62 % open, the north flat (the climb from B) open. It
  changes Organ L's look and its sightlines (a lookout seen through a screen of pipes) — the lead may want to see
  `fix6-lookout-to-*` / `fix6-crown-*` before the art phase.
- **LAVA.maxParts 40 → 64** (60 rider parts with the crowns; Treehills already runs ~60): ENGINE §1.3 / R30 updated. Every
  query scans the dynamic list linearly; no measured frame cost here, but the integrator should know.
- **Rule 21's tolerance** (0.3 m unsupported stretch) is mine, from the physics (0.1 s, 0.13 m of the 0.30 m drop).
- **Race 7's pier** leaves a new narrow far floor that a run off the stone at a slant can overrun (lava-notch: 1 per half,
  listed not gated, as the probe's own rule).
- **Boss Battle keeps the old island** (no bays) to hold its home ground at 818 m² (≥ 800, the round-3 gate); the bays are
  only where the second Race runs (not in boss).
- **F10's headway rule and the boss's crossing / wedge turns** go beyond the list's words ("released when busy over 3 s";
  "widen the bias"), because the first cuts failed on the Mac mini in the ways described; both are tagged and explained in
  their commits.
- **`b.stageRoute`** is a new generic bot field (a stage module owns the route while it says so), not lava-specific.

## 3. Online behaviour and bots

- **Online.** Nothing new is recorded. The crown pipes are rider parts like the stubs: pure functions of the synced lava
  clock, built the same on every screen, un-inked (rule 25's screen is geometry only). The geometry (piers, cuts, chamfer)
  is static level data. The bot and boss changes run where the brains run (the host); guests see the results as before.
  net-lava.cjs: 13/13 on the Mac mini at three heads (JOB-5, JOB-6, JOB-7: lava cells 0.99959–0.99963, the live guest's
  other cells 0.9991 ≥ 0.999).
- **Bots, what changed this round** (all tagged [b5-caldera]):
  - bots.js clears the module's per-frame asks (`guardOff`, `hopAt`, `hopCheck`) before the stage's botAct (F8b case A).
  - `b.stageRoute` while the lava's escape runs: the brain's fight navigation leaves the route alone (the Zone Control
    death); device shooting is skipped, the kits are told `busy`, and the move, the dive and a trigger the module let go
    are put back after the danger guard and the kits (a Chain Bobber layer held still on the shelf; a charger shooting a
    device on a sinking stone). Probe: kits forced to hold every bot still: 20 escape deaths in 48 trials without this,
    0 in 96 with it.
  - The air guard flies its candidates in the flight model (a Mitts bot's let-go steered "back" at a stone across the
    new bay). Probe: 2 of 40 airborne starts died without it, 0 with it.
  - The lookout claim's busy release (F10) counts only time without headway.
  - The boss: the half pull, the kept crossing, the wedge turns.

## 4. Tests, pictures, balance

**Local** (one Electron of mine at a time — except one ~15 s overlap of a probe with my own Zone Control match at 07:05,
my slip; load 4.5–11):

| test | result |
|---|---|
| lava-audit (rules=21,44 / full=1), at 4faa8d6f | reproduces review 6: rule 44 HIGH 24 jumps over 20 m, max 38.57; LOW 15.9; rule 21 races 4 / 6 / 7 both halves (+ race 2's coping 2.39 m); lava-notch diagonals 136 gap deaths |
| lava-audit full=1, final geometry | **42/43** — only rule 42 (far scenery, art phase: 62 of 1,152 rays from the Spillway Bridge). Rule 21: 0 pinches in 27,978 fan walks. Rule 44: largest **14.15 m** (HIGH; LOW 13.55), none over 15; running crossings LOW 1,100 (340 over 5 m, 38 over 10, 0 over 15), HIGH 1,435 (377 / 40 / 0). Skill routes (listed): LOW 1,092 (352 over 20 m, max 56.5), HIGH 1,981 (416 over 20, max 41.2). Carrier row: LOW 72 (50 over 20, max 51.63), HIGH 85 (42 over 20, max 37.08). Rule 14 worst 9.83 m; 25 crown 62 % open; 45, 46 pass |
| lava-notch.js | 3/3: diagonals **0 deaths in a gap in 3,481 trials** (16 runs off a narrow far floor listed) |
| lava-karp.js | 10/10 (K8 after the 9 vetoes) |
| check-maps | all 8 caldera variants ok (1,795 pieces; bazookarp 1,857; boss 1,674) |
| lava.js | 59/59 at 619d972a x3; after the F10 headway rule 59/59 (s1); at the final escape code 59/59 x2 (s2, s3); with the air guard 58/59 once (s4: **F8b case A**, below), without it 59/59 (s5), with it 59/59 x2 (s6, s7); F10 passed in every run, 0 busy outs since the headway rule; both teams up in s1–s4 and s6, one team in s5 and s7 (the test asks one) |
| boss-check.js | with the bias alone 6 in a row 6/6 (halves 94/26, 46/74, 62/58, 95/25, 96/24, 110/10); with the kept crossing 4/4 then one stall (k5: 87 s, 4/6) → the wedge turns → **5 in a row 6/6** (73/47, 64/56, 111/9, 63/57, 46/74); probe: every heading at both stall spots leaves (≤ 5 s still) |
| lava-bots.js | 7/7 0/360 (619d972a); edges-only 40 trials 0/240; 30 trials at the two new pits 0/180 (twice); 4/7 at f0aee8b7 (3 escape + 1 fight deaths: the kits' hold, the device shooting, a Mitts let-go — all fixed); **7/7 0/360** at 27a0398c and **7/7 0/360** at the final head |
| Zone Control (lava-match) | at 619d972a 7/7 and 6/7 (the escape death, fixed by stageRoute); at f0aee8b7 **7/7, 7/7** (0 lava deaths; lookouts used 53/61 s and 45/2 s a team) |
| net-lava.cjs | 13/13 (at a load of 4.69, over the rule's 4) |
| probes (scratch) | f8b stale guardOff 6/6 hops → 0/20; kit hold 20/48 → 0/96; air guard 2/40 → 0/40; bosstrap 8/8 headings out |

**Mac mini** (runner; fetched and merged before every push):

| job @ head | result |
|---|---|
| JOB-5 @ 85c101e3 (c6060c0b) | lava-audit 42/43 (rule 42); lava-notch 3/3; lava-karp 10/10; boss 6/6 x5 (halves 120/0, 83/37, 115/5, 72/48, 120/0); net-lava 13/13; ZC 7/7 x2; lava.js 58/59, 57/59, 58/59 (G8 — a stale probe point, fixed in 619d972a — and F10 once: 3 busy outs, nobody up); **lava-bots 6/7: 2 fight deaths in 360** (Nori, brolly, by race 6's cut at HIGH; Moxie, Mitts, by race 7's pier at LOW) |
| JOB-6 @ 3ef569c4 (f0aee8b7) | **everything full**: lava.js 59/59 x3 (F10 all pass), boss 6/6 x5 (halves 55/65, 51/69, 110/10, 86/34, 49/71: no one-half round), lava-bots 7/7 x2 (1 fight death in 720), net-lava 13/13, ZC 7/7 x2, Turf War 7/7 |
| JOB-7 @ 80b3d640 (27a0398c) | **everything full**: lava.js 59/59 x3 (F10 both teams up in all 3), lava-bots 7/7 x2 (0 lava deaths in 720), ZC 7/7 x2, Turf War 7/7 (0 lava deaths), lava-karp 10/10, net-lava 13/13 |
| JOB-8 @ 25329fb1 (19233cab, the final code) | **everything full**: lava-bots 7/7 x2 (0 lava deaths in 720), lava.js 59/59 x3 (F10 both teams up in all 3), ZC 7/7 x2, Turf War 7/7 (0 lava deaths; Organ L held 77, 87, 26 s) |

**Pictures** (`stages/caldera/out/fix6/`, HIGH and LOW each): `fix6-lookout-to-race1-*`, `fix6-lookout-to-causeway-*`
(review 6's drop-off views from Organ L's top), `fix6-crown-from-island-*`, `fix6-crown-from-lake-*`,
`fix6-race7-pier-above-*`, `fix6-race7-pier-oblique-*`, `fix6-race6-cut-above-*`, `fix6-race6-cut-oblique-*`,
`fix6-race4-corner-above-*`, `fix6-race2-corner-above-*`.

**Balance (informational)**: 0 lava deaths in all 11 matches since the stageRoute fix (8 Zone Control, 3 Turf War, local
and Mac mini; perBotPer3min 0); Organ L's lookout held 26–114 s a match; Slump crossings 0–6 a match.

## 5. Commits and shared files

Code: a65b0a37, 56cac510 (lava-audit / lava-notch), 53b3110c (crown, walks link), a1fd7d13 (stone corners, _exits
float64), 76a954e7 (boss island), 039b8cb6, 46dcb269 (karpVeto, STAGE-MODS), 4afb9c54 (F8b), 4c6b0217, f0aee8b7 (F10,
stageRoute), 9ec64cb1, ed26f71c (boss), 619d972a (lava.js G8), 27a0398c (escape footwork), 19233cab (air guard).
Scratch: 5915a3da (DESIGN §3.5, ENGINE R30, carrier list), fd2c6de5 (pictures), cfcd8879 (DESIGN §4.5), c6060c0b /
60f457a5 / 640efffa / 51869f74 (JOB-5…8), 3ef569c4 / bd28ade2 (merges of the runner's results), and this report.
Pushed: only `fork botlab-b5-caldera` (never forced).

Shared files (all hunks tagged [b5-caldera]):
- `src/game/bots.js` — the per-frame asks cleared before the stage's botAct; `stageRoute` in the fight navigation, the
  device shooting, and around the danger guard and the kits' botAct (`_escMv`); the air guard's candidates (`_airDry`).
- `src/game/lava.js` — `_exits` in Float64Array; `LOOK_BUSY` / `LOOK_PROG` (the busy release with headway); sets
  `b.stageRoute`.
- `src/game/lavaCore.js` — `LAVA.maxParts` 40 → 64; a part's `pipe` flag passed through.
- `src/fx/lavaFx.js` — pipe parts drawn as hex columns with a cap.
- `src/boss/bossBrain.js` — `HALF_AFTER`, `CROSS_FOR`, `TURN_STUCK`; `_roam`'s half, `_pickGoal`'s pull and kept
  crossing, `_walk`'s turn time-out and claw-out turn, `_turn(want, dt, dir, free)`; only on roamAfter stages.
- `docs/STAGE-MODS.md` — the botAct row (asks cleared, `b.stageRoute`), the walks note.
- Stage-own: `src/world/stages/caldera/{geo,layout,lava,karpVeto}.js`; tests `tools/botlab/tests/{lava-audit,lava-notch,
  lava}.js`; docs `stages/caldera/{DESIGN,ENGINE}.md`, `karp-stages/caldera-carrier-crossings.json`.

## 6. Unfinished, flaky, uncertain

- **lava.js F8b case A flaked once** (local s4 of 11 runs this round; the Mac mini 0 of 12): all four case-A asks hopped
  (0.07–0.2 s) with a Twinfire bot as `bots[0]`. The review-6 cause (a stale guardOff) is fixed and proven; this one is
  something F8 leaves behind — case A alone, twins included, never hops (probe f8bA). Not found.
- **lava-bots' fight-death gate failed once on the Mac mini** (JOB-5, 2 in 360; both near this round's new pits: race 6's
  cut, race 7's pier). JOB-5 printed no trails; the local Mitts death at race 7's pier was the air guard (fixed). Since
  the escape-footwork fix (27a0398c): 0 lava deaths in 2,340 bot-trials (JOB-7, JOB-8, two local runs, the pit-focused
  run); JOB-6 before it: 1 fight death in 720.
- **Rule 42** (far scenery from the bridge) and the lavafall's side patch: on the art-phase list, untouched.
- **The crown** changes Organ L's look and its sightlines (62 % open; a screen of 2 m pipes on the lava-facing rim). The
  lead may want to judge the pictures before the art phase. `LAVA.maxParts` is 64 now (60 used).
- **Race 7's pier** adds a narrow far floor a slanted run off the stone can overrun (lava-notch, listed, 1 a half).
- **The boss**: one-half rounds are rarer, not gone (110/10, 111/9 in 10 runs at the final code; no gate). Its "turn
  through" clips the claws through a wall for up to ~3 s, only out of a wedge.
- **F10**: passes in every run since the headway rule (7 local, 9 Mac mini); in 3 of them only one team's claimant got up
  (the test asks one; the per-match lookout use is lava-match's, used in every match).
- **net-lava** locally ran above the load rule (4.69); the Mac mini runs are the proof.
- I overlapped two Electrons of mine for ~15 s once (a probe started while my Zone Control match was finishing).
