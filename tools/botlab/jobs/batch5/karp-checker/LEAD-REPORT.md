# Bazookarp WP4a: the checker and the stage kit (key `karp-checker`): lead report

## At a glance

- **Review 3's verdict (REDO) is answered: all 4 issues are fixed, each with proof** (§0). Review 2's six (§0.2) and
  review 1's eight (§0.3) stay fixed; every one of their cases passes.
- **The checker now models the carrier both ways SPEC §2.4 allows: running as a kid, and swimming in its own ink.** It
  also sees vaults over low walls and rails, and squids slipping through rails. The reviewer's five planted faults (V5,
  V5h, RL, H20, G5) now FAIL #7, and so does a 2.6 m rail only a squid passes. All ten of the review's real-stage
  crossings are now #7d finds with both ends exact.
- **Self-test: 72/72 (run twice), no console errors** (review 3's run was 54/58). The clean box passes every check.
- **Measured: a swim-jump from your own ink, letting go of squid form at the top, lands on a 2.2 m ledge** and clears
  about 7.4 m of air on the level. Nothing reaches 2.25 m. The kid on dry floor reaches 1.8 m and 4.0 m.
- **What that does to the stages:** with the swimming carrier modelled, #7d floods on the real stages, from 100 finds
  (saltpan) to 4 546 (nantai), many of them swim-jumps across water. lockgate's lock canal alone carries about 1 500.
  These are real moves, but no stage can be built against them as the briefs stand. **The lead has to choose** (§3,
  D34): build every barrier and moat against the swim-jump (2.3 m, wider than 8 m), shorten the carrier's swim-jump in
  the engine, or judge #7d on the kid alone and report the swim finds as WARN.
- **TELL THE LEAD** items are marked in §0 and §3:
  - the swim-jump reach (game-wide);
  - the field lacks vault and squid-through-rail edges;
  - D33's 6.2 m saving;
  - SPEC #16's "a kid";
  - review 2's two (on-field hops off the grid, and SPEC's long-gap band).
- Nothing was pushed and nothing ran on the Mac mini.

**Where and how this ran.**

- Worktree `st-b5-karp-checker`, branch `b5-karp-checker` from `b5-int3` b55f7472.
- Everything ran locally, as my task required: the Mac mini was unavailable. One Electron instance at a time under the
  shared SLOTS=3 lock.
- Load average: 250–540 this round (230–760 at the first build, 20–225 in fix round 1).

**How the work got here.**

- **The first builder (2026-10-10)** wrote the checker, the self-test box, the kit, the stage-state hook, the README
  section and the builders' brief.
- **A takeover (2026-10-16 morning)** finished it.
- **Review 1 (REDO) and fix round 1:** rising jumps, hopped climbs, exact weir room, kit footings, numbered flags (§0.3).
- **Review 2 (REDO) and fix round 2:** off-grid hops, measured windows, squid-climb tops, movers, flag pictures (§0.2).
  Fix round 2 was interrupted before it committed.
- **Review 3 (REDO)** read fix round 2's uncommitted tree.
- **Fix round 3** committed fix round 2 and wrote the vaults and the swimming carrier. A usage limit cut it off while it
  was calibrating the swimming windows.
- **I took over fix round 3** from its partial work. I measured the swim-jump to its ceiling and fixed the two #11 cases
  and one vault gap the real stages showed (§0), then re-ran everything.

**[r1]**, **[r2]** and **[r3]** mark what each fix round changed. **[r3b]** marks this takeover's own changes.

## 0. Review 3 (verdict REDO): each issue, what was done, the proof

Review 3 ran on the working tree over HEAD 0ba0bded, with fix round 2 still uncommitted. Fix round 3 answers it in two
hands:

- **The first fixer** committed fix round 2 (0cd9479b), rebuilt the clean box (92b6a972), wrote the vault probe and
  the swimming carrier (c0cd3a3b), the review's cases (a536364c) and the docs (90e65be9). A usage limit cut it off
  while it was calibrating the swimming windows. Its last run (22:19–22:29) was 5/8: `reachs`, `x11f` and `x11z`
  failed.
- **I took over from there** (8695f630 on). I read its uncommitted edits (REACH.swim and the swimming rows, half
  done), kept the method, measured the swim-jump to its ceiling and finished the windows. I fixed the two #11 cases,
  then re-ran everything.

All runs are local: one Electron at a time under SLOTS=3, at load average 22–540.

### Issue 1 (blocker): no probe saw a vault over a low wall or rail, or a squid slipping through a rail. FIXED

**What changed** (c0cd3a3b, karp-check-page.js #7d / #7a / #16):

- **A vault probe in #7d.** It takes field node pairs ≤ 3.5 m apart (flat) where:
  - the far end is from 3.4 m below to 1.8 m above the near end;
  - no 6 m of walking joins them;
  - the waist line is blocked: by nav's own test, or (**[r3b]** e1d4ae4a) by anything a ray meets 0.3 or 0.6 m over the
    higher end, grates and rails included;
  - the obstacle's top along the line is at most 2.25 m over the higher end (**[r3b]** was 2.2; see issue 2), with
    1.5 m of air above it;
  - there is floor under the whole line (otherwise it is a gap, and the gap probes cover it).

  Rails count at any height up to that top. Candidates are kept only when they can matter (worth > 10 m, or from
  outside a Gate's ring to inside it), at most two per takeoff and one per 1.5 m of the same place. #16 tries each one,
  both as the running kid and as the swimming carrier. The run-up is timed off the obstacle's near face. A made vault is
  a #7d find (`vault`). Into a ring it is a #7a entrance with its own line of sight.
- **lowGap's squid tube now passes grates and rails**, as `physics.collideBody` lets a squid through them. It no longer
  stands on a grate, because a squid drops through one. A squid gap into a ring that saves more than 3 m on the field's
  own way in is a #7a entrance with its own sight line.
- **A made move that drops more than 2.5 m into a ring is a #7c drop**, like the field's own drop edges.

**Proof:**

- **The reviewer's three faults, and a fourth of fix round 3's, are must-FAIL #7 cases. All PASS, each for its planted
  reason** (§2.1):
  - **v5**: the ring's NW stretch is a 1.4 m roof wall. #7d finds 4 vaults, each gaining 18.7 m, two a side, e.g.
    (−15.5, 0, 53.5) → (−12.5, 0, 52.5) beside the reviewer's (−16.5, 0, 54.5) → (−12.5, 0, 52.5).
  - **v5h**: the same stretch at 1.7 m. #7d finds 2 vaults, 18.7 m.
  - **rl**: the west opening is closed by a 1.2 m `rail` behind f7's screen. #7a finds two unseen entrances a side, at
    (−14.5, 46.5) and its mirror: a squid gap and a vault.
  - **rlh** (fix round 3's): the same opening with a 2.6 m rail. Only the squid gap is an entrance, unseen.
- **The clean box stays clean.** #16 tries 22 vault candidates (and 32 long gaps) beyond the rules, worth > 10 m or
  into a ring, and makes none: the ring wall is 3 m.
- **The reviewer's real-stage crossings:** all ten (the six the review listed, and its scan's top finds on tidewater,
  halyard, kelpline and crossmarket's mirror) are now #7d finds with both ends exact, each flagged (table in §2.3).
  - Nine were found as soon as the vault probe existed.
  - **[r3b]** The tenth, calamari's (15.95, −0.1, −38) → (17.5, −0.1, −36), 10.4 m, was not. A debug run showed its
    pair failing the candidate's "waist line blocked" test: nav's own test sees nothing at its waist line, while the
    reviewer's rays 0.3 / 0.6 m up meet something lower that keeps nav's nodes off the line. The test now takes either
    (e1d4ae4a), and the pair is a kid-made vault find, flag 26.

**TELL THE LEAD (WP0).** The field itself has no vault or squid-through-rail edge, so D is wrong across every low
barrier on every stage. The checker now finds and FAILs these moves; the engine still doesn't read them.

### Issue 2 (blocker): only a running kid was modelled; a carrier swimming in its own ink jumps much further. FIXED

**What changed** (c0cd3a3b, and **[r3b]** 8695f630):

- **#16 has a second mover: the carrier swimming in its own ink** (SPEC §2.4: "kid or squid freely"). It runs when the
  kid doesn't make a move and the takeoff's floor takes ink.
  - The run-up is inked in the kid's team colour straight into the paint grid. The old values are put back at the end;
    there is no splat, no stage hook and nothing recorded.
  - The same kid dives, swims at 9.44 m/s from 2 m and 4 m back, and jumps at the kid's distances. On a gap it also
    jumps at the rim and 0.3 / 0.6 / 0.9 m past it (the coyote jump at its speed).
  - For a rise of 1.4 m or more it is also tried **letting go of squid form at the top of the jump**. The kid's 0.35 m
    ledge assist then beats the squid's 0.24 m step-up.
  - Success is the kid's rule, or standing on the far node's floor within 7 m along unbroken floor (a swim-jump lands
    well past the node).
  - A move made either way counts, and the text says which (`(swim-jump)`).
- **The windows grow to the swimming reach.** Any takeoff whose floor takes ink gets `REACH.swim`, the larger of the two
  tables. High hops, off-field hops and vaults reach 2.25 m up (was 2.1).
- **[r3b] The swimming reach measured to its ceiling.** The first fixer's table held 2.2 m up at 0.5 m of air, but its
  own run made a 2.2 m rise from 3.5 m of air. That landing was outside the window, so `reachs` FAILed. I ran the rows
  out to the ceiling: 2.2 m up at 3.0 / 4.0 / 4.5 / 5.0 m of air, and 2.25 / 2.3 / 2.4 / 2.5 m up at 3.0–5.0 m of air
  (one probe run, `kcfix4/p1.log`).

  | rise | made (air, rim to rim) | not made | how |
  |---|---|---|---|
  | 2.5 / 2.4 / 2.3 / 2.25 m | none | 3.0–5.0 m | – |
  | 2.2 m | 3.0, 3.5, 4.0, 4.5 m | 0.3, 1.0, 2.5, 5.0 m | letting go of squid form at the top (0.3–2.5 m: the squid meets the face still rising) |
  | 2.1 m | 3.5–4.5 m | 0.3, 1.5, 2.5, 5.0, 5.5 m | letting go at the top |
  | 2.0 m | 0.3–5.0 m | 5.5 m | squid form; 5.0 m letting go |
  | 1.8 m | 3.0–4.8 m | 5.6 m | squid form |
  | 1.5 / 1.2 m | to 5.6 / 5.8 m | 6.2 / 6.4 m | squid form |
  | 0.6 m / level | to 6.8 / 7.4 m | 7.4 / 8.0 m | squid form |
  | 1.2 m / 3.4 m down | to 8.4 / 9.6 m | 9.0 / 10.4 m | squid form |

  The kid's own reach is about half: 4.0 m of air level, 2.1 m at 1.8 m up, nothing at 2.0 m.

  So `REACH.swim` holds, as `REACH.air` does, the first gap not made beyond the last made one at each rise: 2.2 and
  2.1 m up 5.0 m, 2.0 m up 5.5. `CK.hopHigh` and the vault's top go to 2.25 m, the first rise never made. The swimming
  rows now include 2.3 and 2.25 m up (the ceiling, never made) and run 2.2 / 2.1 m up out to 5.0 / 5.5 m of air.

**Proof:**

- **The reviewer's two faults are must-FAIL #7 cases. Both PASS** (§2.1):
  - **h20**: f7's ledge at 2.0 m, no ink, screened. #7a finds unseen entrances by "hop over off-field ground
    (swim-jump)", and #7d an offHop (swim-jump) worth 13.1 m. The kid alone makes none of it.
  - **g5**: a 5.0 m moat of open water through the west opening, inkable on both sides. #7d finds 98 long gaps
    (swim-jump), gaining 12.9–18.7 m.
- **`reachs` PASSES** (both of this round's full runs, and the focused one): every pair the kid or the swimming
  carrier makes lies inside both windows at its rise, and each window's edge lies beyond the last made gap at the worst grid alignment. `reach` (the kid alone) still
  PASSES.
- **The clean box stays clean**: from its 72 takeoffs whose floor takes ink the swimming carrier makes nothing the kid
  didn't (796 swim trials), and every one of the 34 added edges is made.

**TELL THE LEAD (and the user: this is game-wide).**

- SPEC §4.4 #16 says "a kid". The checker reads it as the carrier in either form SPEC §2.4 allows.
- **The 1.8 m reach rule that stage briefs build barriers and roofs on is 2.2 m for anyone who swim-jumps from their own
  ink and lets go of squid form at the top**, and a level swim-jump clears about 7.4 m of air. I measured it on the
  carrier (9.44 m/s). A player without the Bazookarp swims faster (11.8 m/s) with the same jump, so it reaches at least
  as high and further; that is not measured. The rule the stages were built to ("kids climb ~1.8 m; roofs not
  jumpable") holds only for a kid on dry floor. A roof edge at 2.0–2.2 m above inkable floor is reachable today in every mode.
- **On the real stages, most #7d finds are now swim-jumps** (§2.3), and the lead must decide what the carrier may do
  (D34: keep it and rebuild the barriers, shorten the carrier's swim-jump, or judge #7d on the kid alone).

### Issue 3 (blocker): fix round 2 was unfinished and uncommitted, the self-test red, the report stale. FIXED

- **Committed, in small steps.** Fix round 2 is 0cd9479b. The clean box is 92b6a972. Fix round 3 is c0cd3a3b,
  a536364c, 90e65be9, 8695f630, c62b4153, eb1f357e, 2fdb592d and e1d4ae4a. The pictures and this report are separate `(scratch)`
  commits. The working tree holds nothing of mine uncommitted. COMMON.md's edit is not mine (§6).
- **The clean box** (92b6a972). The rail that fix round 2 put at z 38–44 stood in the SE opening's mouth and left it
  under nav's 0.92 m. Now a 2.6 m rail runs on the channel's west edge from the alley's wall to the pier (z 20.4–36),
  and the pier is widened into a bridge over the channel's north end (z 36–44). Nothing pinches the SE way in. The
  rail beats both the kid's 1.8 m and the swim-jump's 2.2 m.
  - **clean PASSES** every check: L 61.6 / 61.5 m (Δ 0.2 %), weir count 60, 2 routes on every leg, walks 8/8 + 8/8,
    the carry knocks out both ways.
  - **x9c and x7h** plant their faults again: x9c FAILs #9 ("not on its owner's half"), x7h FAILs #7d highHop.
- **x7p4** expects the reason it really fails: #7c's 6 m drop off the tower top into the ring and #7d's tallWall. That
  is the review's first option. It PASSES.
- **Self-test: 72/72 with no console errors, run twice** (§2.1). The review's run was 54/58.
- **The report:** §0.2 answers review 2's six issues with their proof, and D28–D37 are written up (§3). **D33 goes to the
  lead** (§3): a move the field lacks is a #7d find when it lands more than 10 m nearer a Gate *and* that gain beats the
  move's own length by more than 6.2 m. It is marked TELL THE LEAD, with what it costs: lockgate's two boat-frame jumps
  (10.8 / 12.5 m in review 2) are not finds under it.
- **The all-stages table's rising-gap column** now reads `tried / made` from #16's own counts (`n16.rise`), in 0cd9479b.
  The review's `undefined` came from the old `rise.cand` field. Every row of §2.3 has numbers.
- **Re-run after the issue 1 and issue 2 changes** (§2.4): the self-test, `MAP=all` (13 stages), check-maps (every build
  and every `.bazookarp` build) and karp-layout-diff (96/96 same).

### Issue 4 (minor): the self-test never planted #8's distance, height or sight rules, or #11's falls, narrow walk and zone ×3. FIXED

Seven must-FAIL cases (a536364c; **[r3b]** x11f and x11z corrected in c62b4153). All PASS, each for its own reason
(the texts are this round's final run):

| case | check | the fault | what it FAILs on |
|---|---|---|---|
| x8n | #8 | the Gate 10 m from the pad (z 50) | "the Gate 10 m from the pad (12–20)" |
| x8f | #8 | the Gate 22 m from the pad (z 38) | "… 22 m from the pad (12–20)" |
| x8u | #8 | the Gate on a 3.4 m dais up a ramp: 1 m above the pad | "the Gate 1.15 m above the pad (≤ 0.2)" |
| x8s | #8 | a 4.6 m screen across the apron between the deck and the Gate | "the Gate not seen from the spawn deck" |
| x11f | #11 | a noRest polygon (x 1…27, z 0…22) round Bravo's water edge nearest the Pond | "team 0: a fall on the enemy half → drop fall rest [0.5, 0, 6.5] (14 m)" (12 m the rule) |
| x11w | #11 | open water across the main floor at z 6…20, a 1 m causeway on route 1 | "a splat on the narrow walk by weir 1 rested on narrow floor" |
| x11z | #11 | the spawn-deck zone's eras written as strings (`['0']`): the engine never applies it | "in its own zone the fuse ran ×3 (retreat)": no zone flag |

**[r3b] The two that failed in the first fixer's last run:**

- **x11f** planted nothing. Its polygon x 1…20 left the east strip's rim at x 20.5 as a rest 6.7 m from the fall, inside
  the 12 m rule, so #11 stayed OK. With x 1…27 the nearest rest outside the polygon is ≥ 13.5 m away: Alpha's carrier
  falling there is dropped 14 m off, at (0.5, 0, 6.5), and #11 FAILs.
- **x11z** FAILed for a reason its pattern didn't expect. The carrier stood in the zone at ×3, but by the *retreat* rule:
  the deck lies behind its mark. The engine never set the zone flag, which is the fault. The pattern now matches "ran ×N
  (not zone)", and the case's text says why.

## 0.2 Review 2 (verdict REDO, on 68fa97bc): fix round 2

Fix round 2 was interrupted mid-round. Review 3 read its uncommitted working tree, and fix round 3 committed it as
0cd9479b; its cases are 0ba0bded. Review 3 found issues 1, 2, 4, 5 and 6 fixed and issue 3 caught, but not by the
pattern its case expected. Every case below PASSES in this round's self-test (§2.1).

| # | review 2's issue | what changed (0cd9479b) | proof |
|---|---|---|---|
| 1 (blocker) | A hop onto off-field ground into a ring was invisible when the ledge's face missed the 1 m grid | Hops onto off-field ground are taken from up to **two cells** out, diagonals included (0.5–2.25 m up, ≤ 2.3 m flat), with the hop rule's waist and head tests (D28) | **x7m2 / x7m4 / x7m6 / x7m8**: f7's ledge from x −17.2 / −17.4 / −17.6 / −17.8, and **x7m45**, the ledge turned 45°: each FAILs #7a as an unseen "hop over off-field ground" entrance |
| 2 (blocker) | The windows (riseGap ≤ 3.0 m, longGap / offGap ≤ 3.8 m) stopped short of what #16's kid makes | Every probe of a move the kid makes takes node pairs out to its **measured reach** (`REACH.air`, through `reachWin` / `probeWin`), with the coyote jump tried at and past the rim (D29). Fix round 3 adds the swimming carrier's reach (§0, issue 2) | **x7p2**: P2's 4 m rising gap into the ring FAILs #7a. **reach**: 55 platform pairs over the sea; every jump the kid makes lies inside the windows at the worst grid alignment |
| 3 (major) | A squid climb over 5.5 m onto off-field ground was only a WARN, its way down never followed | The top's exits are followed, as an off-hop's are. A drop of more than 2.5 m into a ring is #7c; an exit more than 10 m nearer a Gate is #7d. Only a top with no exit is a WARN (D30) | **x7p4**: P4's 6 m inkable tower through the ring wall FAILs #7c (the 6 m drop off its top) and #7d (tallWall) |
| 4 (minor) | A weir, Gate or Pond on a mover's track was not flagged | #1 FAILs a kit piece in a mover's swept volume, and #15 a weir's 3 m room (D31) | **x15m**: Wc, the weir where the car parks, FAILs #15 ("a mover sweeps within 3 m: kcar") and #1 ("in a mover's path") |
| 5 (minor) | The noRetreat-to-zone distance read crossing polygons as far apart | `polyPolyDist` is 0 when two edges cross or one polygon holds a vertex of the other | **x9n**: a 0.4 m noRetreat strip across an open-floor zone FAILs #9 ("within 3 m of team N's zone") |
| 6 (minor) | Flag pictures didn't mark the flagged move; some FAILs carried no flag | Every FAIL with a place carries a flag (#2–#6, #11, #12). `-flag-<n>` draws the move from → to with an arrow and its gain. The pictures come after #11, so its flags are numbered with the rest (D32) | The self-test's driver now FAILs a case whose target FAIL has no flag (that is how `x11f` showed up). Review 3 checked the arrows (e.g. `halyard-flag-23`); this round's are in §2.3 |

**TELL THE LEAD, from review 2:**

- **The field's own hop edges** (karpField: orthogonal neighbours only) have the same alignment hole for ledges *on* the
  field. Today the riseGap probe and the walk crossings catch them; the engine does not (WP0).
- **SPEC §4.4's long-gap band (3.0–3.8 m) undershoots the kid**, which clears 4.0 m of air level (its rim nodes up to
  ~6 m apart). The checker uses the measured reach; the band's words are kept only as the field's own gap rule.

## 0.3 Review 1 (verdict REDO, on 4387bed6): fix round 1

Fix round 1 answered all eight issues; the full section is in this report at a880d442. In short:

| # | review 1's issue | fix | proof (cases, all PASS now) |
|---|---|---|---|
| 1 (blocker) | #7 missed rising jumps across open air | the riseGap probe; jumps onto off-field ground across a real gap; a kid's move into a ring is a #7a entrance with its own sight line | x7r, x7rb, x7rq (H2p, H2bp, H2q) |
| 2 (major) | inkable 1.3–1.8 m steps counted as climb-only | climbs of ≤ 1.8 m the kid hops count as hops in every no-climb search | w4 (#4 / #9 must not fail) |
| 3 (major) | #15 sampled points and missed thin solids | each block measured exactly (its box clipped to the band, projected) | x15t (T1) |
| 4 (minor) | kit posts could float off a ledge | #1 FAILs a kit footing not resting on floor | x1 (W5) |
| 5 (minor) | the carrierBlock glyph drew on a cream square | the glyph is drawn on a transparent background again (`drawNoCarp` had turned `bg: null` into cream) | `out/kit-carrierblock.jpg` |
| 6 (minor) | the top-down's flags couldn't be decoded | numbered discs placed apart, a key panel, `-flag-<n>` | every top-down in `out/` |
| 7 (minor) | one sub-rule per check | 23 more cases | x3, x5b, x7a, x7c, x7t, x7l, x7h, x7g, x9d–x9g, x13, x14, x15a, x11, x11r |
| 8 (minor) | docs stale about the Mac mini | README, BUILDER.md, JOB-1 / JOB-2 | – |

## 1. What was built

### 1.1 `tools/botlab/bazookarp-check.cjs`: the checker (SPEC §4.4)

```
MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs      one stage
MAP=all  …   every shipped stage (the twelve and Cargo) in one go, then the table   (WIP=1 adds bluestone, aquarium, caldera)
MAPS=a,b …   some stages
KARP_SELFTEST=1 … the self-test on karpbox (CASES=clean,f7,… picks cases)
PROBE='[x,y,z,x,y,z]' MAP=<id> …   one move traced: #16's kid frame by frame on the node pair nearest those points, and
                                   the blocks (pieces, prop colliders) where each trial stopped
PROBE='walk:<text>' MAP=<id> …     one of #16's walks (the one whose name holds <text>) again, every frame, with its path
env: OUT=dir (default .botlab/karp-check)   KARP_DEF='{…}' trial data   SHOTS=0 / CARRY=0 / PHYS=0 (quick; a RESULT ok
     needs all three)   DEVSTAGE=1 (Cargo; MAP=all adds ?devstage for Cargo itself)   ERA=1|2|3 / LAVA=low|high /
     KSTATE=<key> one stage state, else every state in turn   FLAGSHOTS=n   KITSHOTS=1 (the kit up close)
```

Always run it with `BOTLAB_OUT=…/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=…`.

**What it prints and writes:**

- One line per check: `OK`, `WARN`, `FAIL` or `SKIP`, with its numbers.
- Then the result line:

  ```
  RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=… walks=<routes ok/n>+<entrances ok/n> [FAIL=… SKIP=…]
  ```

- The numbered flags. Every flagged place, in the same numbering as the top-down's discs and key,
  the `-flag-<n>.jpg` pictures and the JSON's `flags`.
- `<id>-karp.json`: every check's numbers and flagged places, the flags, the walks, the carry walks and the drop
  coverage.
- The pictures.

`RESULT ok` needs all sixteen checks OK or WARN, with the physical proof and the carry walk run. One stage takes 40 s –
4 min here.

**Where the checks run:** in the game page (`tools/botlab/karp-check-page.js`), on the engine's own Carp Field
(`src/game/karpField.js`) and the level's own physics:

- the carrier graph is nav's valid nodes minus the spawn zones and carrierBlock volumes;
- its edges are nav's walk, jump, drop and climb edges plus the field's hop and gap edges.

Every team-dependent check runs for both teams. The data describes Alpha's attack; Bravo's attack is the mirror.

**"No climbs" (#4, #5, #7b, #9, #13, #16's walks, the carry walk) means no squid climb.** A climb edge of at most 1.8 m
that #16's kid hops counts as a hop (`climbHops`, review 1).

**How each check judges.** The numbers are SPEC §4.4 / §9.1's. A \* marks my reading where the spec left a gap (§3).
**[r1]**, **[r2]** and **[r3]** mark what fix rounds 1, 2 and 3 changed.

| # | check | judged |
|---|---|---|
| 1 | Data | FAIL any of: the Pond > 0.3 m off (0, 0); the Pond, any weir, either Gate or any sign (both teams) with no floor within 0.3 m under it, on a `roof` block, or inside a spawn zone (barrier + 0.6 m, above the pad − 1 m); no carrier-graph node under the Pond; a kit post / sign block (`karp-weir*`, `karp-gatepost*`, `karp-sign*`) that is not `roof` or takes ink.\* **[r1]** A kit piece that stands on the floor (each post's footing, the Gate's plinth and rim, the sill, each sign's foot) with floor more than 0.1 m below its bottom at any of 3 × 3 points over its footprint, both teams, each flagged.\* (The sill and the plinth are floor and take ink.) **[r2]** A kit piece, the Pond, a weir or a Gate trigger inside a mover's swept volume (D31). |
| 2 | Field | FAIL any of: \|L_A − L_B\| > 2 %; a hole (a node reached on the carrier graph from the Pond with D = ∞ for a team, unless the data waives it\*); \|fieldAt − D\| > 0.05 m at any node; any sweep point (¼, ½, ¾ of every walk edge, ±0.3 m across where the waist line is clear) more than 2.5 m below its proven lower bound. Reported: the hop / gap edges added, the largest gain across one, the points > 1.5 m low. The halfway line is drawn. |
| 3 | Distances and counts | FAIL any of: a weir's count outside 45–60 (40–55 % of L); a weir with no field reading at all; weir → Gate < 25 m or < 45 % of L; two weirs > 2 counts apart or < 12 m apart; 0 or > 2 weirs; L outside 55–85 m. Reported: Pond → weir → Gate along the field and on route 1; the Gate's distance from its pad; the lowest count within 3 m of each weir (reported, not judged: D1). |
| 4 | Reachability | FAIL: no carrier route for Pond → each weir or weir → Gate, either team, without squid climbs, spawn zones, the team's own free zones or carrierBlock. |
| 5 | Two routes | Route 1 is the shortest no-climb route. Route 2 is the shortest one avoiding every node within 2.5 m (3D\*) of route 1, except within 6 m of either end. Route 3 (squid climbs allowed, off both) is reported. FAIL: a leg with no route at all, no route 2, or route 2 > 1.6 × route 1, for every weir both ways, both teams. With two weirs, also FAIL when: their routes 1 meet (≤ 2.5 m apart outside 6 m of the ends); either route 1 passes within 4 m of the other weir; or the weirs are < 12 m apart. `routes` hints are measured and named. |
| 6 | Carry times | FAIL: Pond → Gate (L) outside 11.5–18 s at 4.8 m/s. Reported per leg via each weir, walking and swimming (9.44 m/s). |
| 7 | No shortcut into a base | **(a)** Every carrier-graph edge crossing into the Gate's 15 m ring, grouped single-linkage within 3 m. Also counted: a roof-less car's stop in the ring; every move #16 really makes from outside the ring to inside it (a high hop, long gap, rising gap or **[r3]** vault beyond the rules; a hop or jump onto off-field ground with an exit in the ring; **[r3]** a squid gap, through rails and grates too), at its landing, when it saves more than 3 m on the field's own way in (D33). FAIL: outside 2–5 entrances, or an entrance none of whose crossings is seen from 1.5 m above any edge node of the defenders' spawn deck (to 1 m above the crossing); a move into the ring needs its own line of sight (to its landing or an exit of it in the ring). **(b)** The field without squid climbs vs with, from every halfway-line node. FAIL: a with-climbs path saving > 20 % (its climb edges are listed; a climb the kid hops is not one). **(c)** FAIL: a drop or down-gap edge of > 2.5 m ending inside a ring; **[r2]** a squid-climb top's drop into the ring; **[r3]** a made move that ends in the ring more than 2.5 m below where it left. **(d)** The probes; each find is flagged (finds of one probe within 3 m are one flag) and pictured. FAIL when the find gains > 10 m and **[r2]** beats its own length by > 6.2 m (D33); WARN when one end is off the field with no exit (a hiding place, D3 / D30). The static probes measure \|ΔD\| as SPEC words it: low gaps (a 0.35 m squid tube 0.3 m up, between nodes ≤ 3 m apart not joined by ≤ 6 m of walking; **[r3]** through grates and rails, never standing on a grate); tall walls (nav's climb scan over 5.5 m; **[r2]** the top's exits followed); long drops (> 3.4 m with open air; signed). The moves #16 really makes are measured in their own direction: high hops (1.8–2.25 m up), long gaps, rising gaps (0.6–1.8 m up across open air, no 6 m walk), **[r3]** vaults (D35), hops onto off-field ground (**[r2]** up to two cells out, diagonals included: D28) and jumps onto off-field ground across a real gap (D21), whose gain is to their best exit. **[r2/r3]** Every one of them takes node pairs out to the mover's measured reach at its rise (D29): the kid's `REACH.air`, and from a takeoff whose floor takes ink the swimming carrier's `REACH.swim`. A move is tried when it can matter (worth > 10 m, or into a ring). A find within 2 m of a `waive` entry of that check is waived.\* |
| 8 | Gate placement | FAIL any of: not 12–20 m from the defending pad (horizontal); more than 0.2 m above the pad; outside ±40° of the pad → Pond line; not seen from the deck; inside any free zone. |
| 9 | High ground and free zones | **Plateaus:** connected carrier-graph nodes ≥ 1.4 m above the lowest node within 3 m (≥ 2 nodes\*), on the half most of their nodes are on. FAIL a plateau the owner's carrier reaches (any carrier route from the Pond) and the enemy kid reaches only by a squid climb (no no-climb route from the halfway line, one with), unless every node is inside the owner's zones. **Zone entrances:** every carrier-graph edge (climbs included) into a zone's polygon and band; the crossings (edge midpoints\*) chained within 3 m. FAIL an entrance with no sign (of any of the owner's zones\*) within 2 m of a crossing, or one wider than 8 m without a sign within 2 m of each end (its two farthest crossings). **Also FAIL:** a zone node with D_owner ≤ D_other (both finite\*); a zone touching a weir trigger, a Gate trigger, or a route 1 / route 2 node of any leg; a `noRetreat` polygon within 3 m of a plateau or a zone (**[r2]** 0 when the polygons cross or one holds a vertex of the other). **WARN:** enemy arrival (walk 6 m/s, climb 7.5) > 2 × the owner's (from its deck), or a single entrance (plateaus ≥ 4 m²\*). |
| 10 | Retreat sanity | Route 1 and route 2 from each team's own Gate area to the Pond, on its own half. FAIL a dip of P (= L − D) below its running best of > 6 m outside `noRetreat`. Across every state switch the carrier's mark resets (§3.3), so the dip is 0 by rule; the raw change of P a still carrier would see on the routes is reported. |
| 11 | Carry walk | A fresh match per team, bots out, a scripted carrier (WASD + space): it picks the Bazookarp up at the Pond, walks route 1 to weir 1 (re-planning on the carrier graph after 2.5 s without progress: a stuck episode, logged with its place and edge, **[r1]** and flagged), plants, re-pops and walks to the Gate. Then four more walks: a retreat on its own half (×3 on at 8 m back, off at 3 m, measured from its own `mark`); a visit to its own zone (×3); a fall into the water from the wet node nearest the Pond on each half (own half → the Pond; enemy half → dropped by the last footing on that half, ≤ 12 m; up to 8 edges tried when a railing stops the fall); a splat on the narrowest walk near each weir (must rest on `wide` floor). **Drop coverage:** the field's drop spot at every 4th node of route 1 and route 2 of every leg, and at every node inside each zone (its enemy carrying). Each must land on the carrier's half, ≤ 12 m away except inside an enemy zone, never at the Pond. FAIL any of these. |
| 12 | Variant | FAIL any of: a piece in the Bazookarp build that Turf War lacks and that is neither the kit nor tagged `onlyIn: 'bazookarp'`; a Turf War piece missing without `notIn: 'bazookarp'`; no `assets/lightmaps/<id>.bazookarp.json`, or a stale one (the level applied none). A test stage (karpbox) is never baked. |
| 13 | Deep spawns | **Ways off the deck** (a level flood from the pad, ≤ 16 m): nav edges leaving it, chained within 3 m; FAIL < 3. **The apron:** route 1 from the deck's edge to the Gate in front of it; FAIL < 2 solid static blocks (≥ 0.45 m across, prop colliders count, not the kit, not the deck's own blocks) rising ≥ 1.2 m above a route node within 4 m of it. |
| 14 | The Pond | FAIL: < 70 % of the 4.5–10 m ring is floor (nav cells at any level within ±5 m of the Pond\*), or the shell's centre (1.3 m up) is seen from fewer than 6 of 8 points 7 m out (1.5 m above their floor). |
| 15 | Weir room | FAIL any of: **[r1]** a solid block nearer than 3.0 m to the weir's axis between 0.3 and 3.6 m above its floor, measured exactly (the block's box clipped to that band, projected down: its hull's distance; any weir's own posts and sill excepted; the block and its distance named); no route to look along; its centre not seen from 1.5 m above route 1's node 8 m before it or 8 m after it; seen from fewer than 3 of 8 points 7 m out.; **[r2]** a mover's swept volume within 3 m (D31). |
| 16 | Proved physically | **(i) The edges.** Tried: every hop and gap edge the field added; every #7d candidate beyond the rules that can matter (high hops, long gaps, rising gaps, **[r3]** vaults); the hops and jumps onto off-field ground that can matter; and, before any route is searched, every climb edge of at most 1.8 m that passes the hop rule's tests (`climbHops`: a made one counts as a hop in every no-climb search). A kid with `carry` set (4.8 m/s, the carrier's jump, both spawn barriers, carrierBlock) is stepped through `actor.update` at 1/60 s, alone (everyone else parked). It starts 1.5 m and 3 m before the low end, shortened toward it until it stands on floor (D11). It faces the far end and steers to it; a move down is first tried as a run-off; jump is pressed 0.2 / 0.5 / 0.8 / 1.1 / 1.4 m before the edge (a hop: its riser; a climb hop: the wall nav found; a gap: the rim, **[r2]** and the coyote jump at and past it; **[r3]** a vault: the obstacle's near face). Made = grounded on the far node's floor within 0.5 m of it inside 2 s (or on that floor ≤ 3 m away with a clear waist line). **[r3] The second mover:** when the kid fails and the takeoff's floor takes ink, the carrier swims in its own ink (the run-up inked into the paint grid, put back after) at 9.44 m/s from 2 m and 4 m back and swim-jumps at the same distances (a gap also at the rim and 0.3 / 0.6 / 0.9 m past it; a rise of 1.4 m or more also letting go of squid form at the top); made as the kid's, or on the far node's floor within 7 m (D34). A move made either way counts; `(swim-jump)` marks one only the swim made. **(ii) The walks.** The same kid walks every route 1 and route 2 of every leg, both teams, and goes through every entrance into each Gate's ring: one crossing per entrance with an 8 m run-up from the Pond side, then on to the Gate (squid climbs, rides and the moves proved apart excepted). It steers at the next node. It jumps on a jump, hop or climb-hop edge within 1.6 m of the node; on a walk edge only at a real riser; at a rim; and after 0.8 s without progress. A grounded kid whose own node is one of the next 8 path nodes has reached it. A hop, gap, climb-hop or nav jump edge it doesn't make on the way is decided by that edge's own trial. **FAIL:** an added edge never made (printed as `hopVeto` entries to paste, by kind); a walk stuck 2.5 s, fallen off or out of time (its place printed and drawn: ⊗). A walk stuck against a dynamic block is reported, not judged. Made candidates beyond the rules go to #7d / #7a with their gain. |

**Pictures** (JPEG < 290 KB; the page encodes them):

- **`<id>-karp-top.jpg`**: the whole stage from above, Alpha attacking left → right. **[r1]** The camera bounds now
  hold both Gates' rings. It shows:
  - Alpha's count as a heat map, with dots every 10 counts, and the halfway line;
  - Alpha's routes Pond → weir and weir → Gate (route 2 dashed);
  - both Gates with their 15 m rings and entrance arrows (red = unseen); weirs as diamonds; the Pond and its burst
    ring;
  - the free zones hatched in the owner's ink, with their signs and entrances (green ring = signed, red X = not);
  - `noRetreat` / `carrierBlock` / `noRest` outlined; plateaus (red = FAIL);
  - hop / gap edges as ticks: made faint green **[r1]**, not made thick red. Moves made beyond the rules (high hops,
    long gaps, rising gaps, jumps onto off-field ground) are faint magenta, bold when they are a #7d find;
  - #16's failed walks as ⊗;
  - **[r1]** every flag as a numbered red disc on a leader (moved round its place until it covers no other), and
    **a key panel** under the map that lists every flag: its number, check, what it is and where.
- **The rest:**
  - `-pond`;
  - `-weir-<i>-approach` / `-defend` (from the farthest clear point 6–14 m back / on along the route, preferring open
    floor);
  - `-gate-approach`, `-gate-deck`, `-zone-<i>`, `-noretreat-<i>`;
  - **[r1]** `-flag-<n>`: one for every #7 flag, then the first FLAGSHOTS others, at most 40. The n is the flag's own
    number;
  - with `KITSHOTS=1`, the kit up close.

### 1.2 Stage states, generically

A stage module offers its field states through `R.karpStates() → [{ key, nodeOk(id), query }]`.
`G.match.stage.karpStates()` is new in `src/game/stageMods.js` (the first module offering any); it is the call the
engine already made. `query` is the page query of the module's own audit switch (`era=2`, `lava=high`).

- The checker lists the field's states. Without ERA / LAVA / KSTATE it checks each in turn, each on a page loaded with
  its `query`, so the world is in that state for the sight lines, the kid and the carry walk; the field is switched to
  it.
- `ERA=2` loads `?era=2` and checks the state keyed 2.
- docs/STAGE-MODS.md has the row, and T4 is marked served.

**Proof:** the self-test's `states` case. A test-only module, `tools/botlab/karp-check-states.js`, raises a wall 2.6 m
from the weir in its state `w` only. #15 passes in state 0 and FAILs in state `w`, built from `?kcstate=w`. karpbox's
own test-only state (`testStates`) is checked as a field state on the same page.

On this base `eras.js`, `lava.js` and `pipes.js` are 6-line placeholders that register nothing, so no shipped stage has
states yet.

### 1.3 The kit in final form (`src/world/bazookarp-kit.js`, `src/fx/karpKitFx.js`)

- **Weir:** two dressed stone posts, 5.4 m apart centre to centre across the walking direction. Each post is a 0.72 m
  footing (0.3 m high), a 0.5 m shaft, a dark band at 1.55–1.68 m and a 0.64 m capital: 2.4 m in all. Every part is
  `roof` and takes no ink. Between them is a 0.12 m stone sill for the curtain to fall onto; it is floor and takes ink.
  The shafts' inner faces are 2.45 m out, so the footings and capitals clear the shell's full 2.3 m swell at their
  heights.
- **Dragon Gate:** an octagonal plinth 3.4 m across the flats, 0.15 m high. It is built as mapkit's OCT in the Gate's
  own frame: a plus of slabs with its four corners a 0.05 m step, and no shared tops. Two posts stand 4.4 m apart: a
  0.8 m footing, a 0.6 m shaft, a gold band and a capital, 3.2 m in all. The posts are `roof` with no ink.
- **NO CARP sign:** a stone foot, a 0.15 m wooden post and a 0.75 × 0.5 m board facing the sign's yaw, 1.9 m tall in all;
  every part `roof`, no ink. `karpKitFx` puts the crossed-out carp over "NO CARP" in the owning team's ink on both faces of
  the board.
- **Tags:** each post's shaft and each sign's post carry the plain tag (`karp-weir`, `karp-gatepost`, `karp-sign`: one
  per post, as bazookarp-rules L7 counts them). The other parts are suffixed (`-base`, `-band`, `-cap`, `-foot`,
  `-board`).
- **carrierBlock shimmer** (`karpKitFx`): a faint wall on each polygon edge, from the volume's floor up 2.4 m. Diagonal
  bands drift upward, brightest at the floor, with the NO CARP glyph (a dark violet carp) mid-wall. Everyone sees it.
  **[r1]** The glyph is drawn on a transparent background again. `drawNoCarp` read `bg` with `??`, so the shimmer's
  `{ bg: null }` became the board's cream square.
- `karpKitFx` is its own module, built and cleared on `match:state` and animated in `onBeforeRender`, so WP2's rebuild of
  `bazookarpFx.js` doesn't collide with it.

Pictures (`out/`):

- `kit-weir.jpg`, `kit-weir-post.jpg`, `kit-gate.jpg`, `kit-sign.jpg`, and `kit-carrierblock.jpg` (**[r1]** re-taken:
  no cream squares) on karpbox;
- `halyard-kit-*.jpg` and `lockgate-kit-*.jpg` on the real stages.

The kit pieces read as dressed stone and wood in the game's chunky style, and every perchable top is `roof` with no ink.
The curtain and the Gate's ring are bazookarpFx's placeholders, WP2's to finish.

### 1.4 `karp-field.js` in the regression set; the builder's template

- `tools/botlab/README.md`: the checker, its self-test (with `notFail` cases), `PROBE=`, **[r1]** the moves a kid makes,
  the climbs it hops and the numbered flags. Its Bazookarp regression set:
  - karp-field.js on karpbox and every stage;
  - the rules, gun and loop tests when the engine moves;
  - the checker's self-test and per-stage runs;
  - check-maps and karp-layout-diff for the other modes.

  **[r1]** It now runs locally or as a job on the Mac mini's runner, per COMMON.md.
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`: the per-stage builder's brief, pointing at SPEC §9:
  - the eight deliverables of §9.2 and their format;
  - the checker's usage and what to fix per check;
  - waivers, stage states and the regressions;
  - the NOTE.md template.

  **[r1]** Its Mac mini rows (the bake, the bot matches) point at COMMON.md's runner protocol. It now covers #1's kit
  footings, the climbs a kid hops (#4), #7's moves and entrances, #15's exact room and the numbered flags.

## 2. Tests and results (all local)

### 2.1 The checker's self-test (karpbox): 72/72

`KARP_SELFTEST=1` runs every case below. Each planted fault must FAIL its own check, and the check's text must match the
case's `expect` pattern, so the fault is caught for the reason it plants and not by a knock-on. Its target FAIL must
carry a flag (**[r2]**), and its `also` checks must FAIL too. A `notFail` case must leave its checks unfailed. The REACH
cases must hold every jump their mover makes inside the windows. The clean karpbox must pass every check, including the
carry walk and #16's trials and walks.

**Result: 72/72, no console errors**, on e1d4ae4a (the final checker; 2fdb592d and later change only comments and
scratch). It ran in four chunks of 18 cases (`CASES=`), one Electron at a time: 37 min, 01:03–01:41, at load 23–90.

- **The run before**, on eb1f357e (before the vault fix), was also 72/72, 61 min at load 250–540.
  - Its chunk C logged one console error, "The AudioContext encountered an error from the audio device or the WebAudio
    renderer". The checker plays no sound; the game page opens an AudioContext, and the shared audio device was busy.
    The same 18 cases re-ran 18/18 with none.
- **The focused runs** while fixing: `reachs` + x11f + x11z 3/3 on the new windows; the ceiling probe (2.2–2.5 m up);
  calamari alone for the vault fix (§0).

| case | check | the fault | result | checks failing |
|---|---|---|---|---|
| clean | – | the clean box | PASS | (none) |
| f1 | #1 | a NO CARP sign standing in the spawn zone | PASS | #1 |
| f2 | #2 | a wall on Bravo's half only (a `single`): Alpha's walk 50 % longer | PASS | #2 #15 |
| f3 | #3 | the weir at 85 % of the way (count ≈ 15) | PASS | #3 #15 |
| f4 | #4 | the weir on a 3 m box only a climb reaches | PASS | #3 #4 #5 #9 #15 |
| f5 | #5 | the weir at the end of a 3 m dead-end corridor | PASS | #1 #3 #5 #15 |
| f6 | #6 | a third ring opening, straight in from the south: Pond → Gate ≈ 10 s | PASS | #3 #6 |
| f7 | #7 | a 1.5 m non-inkable ledge through the ring wall that only a hop climbs, screened from the deck | PASS | #7 |
| f8 | #8 | the Gate 45° off the pad → Pond line | PASS | #3 #5 #6 #8 |
| f9 | #9 | a free-zone entrance with no sign | PASS | #9 |
| f10 | #10 | low walls either side of the Pond: the own-half route walks back | PASS | #10 |
| f11 | #11 | a noRest polygon over 26 m of the routes | PASS | #11 |
| f12 | #12 | a crate tagged notIn: 'turf' | PASS | #12 |
| f13 | #13 | the apron's crates gone | PASS | #13 |
| f14 | #14 | two 3 m walls 5.5 m out from the Pond: seen from 3 of 8 | PASS | #14 |
| f15 | #15 | a pillar 2 m from the weir | PASS | #15 |
| f16 | #16 | an awning over the flank lane's 1.5 m step: the field adds the hop, no kid makes it | PASS | #16 |
| f16w | #16 | a thin fence's 0.5 m slot on route 1: the graph walks through, no body fits | PASS | #16 |
| x5 | #5 | two weirs 8 m apart | PASS | #3 #5 #15 |
| x7b | #7 | a climb shortcut (an inkable stretch of ring wall, the opening far round) | PASS | #3 #5 #6 #7 #9 #10 |
| x7d | #7 | a squid-only gap (0.7 m headroom) through the ring wall | PASS | #7 |
| x9a | #9 | a climb-only 3 m plateau with a zone over half of it | PASS | #9 |
| x9b | #9 | a noRetreat polygon over the spawn deck's zone | PASS | #9 |
| states | #15 | a stage module's state `w` (its world on ?kcstate=w) raises a wall 2.6 m from the weir | PASS | #15 in `w` only |
| x9c | #9 | a free zone poking 2 m over the halfway line | PASS | #9 |
| x7r | #7 | **H2p** (review 1): a 2.0 m moat, a 1.0 m landing just inside the ring off the field, f7's screen | PASS | #7 |
| x7rb | #7 | **H2bp**: a 1.3 m moat, a 1.5 m landing off the field | PASS | #7 |
| x7rq | #7 | **H2q**: the moat in front of an on-field landing with a ramp into the ring, screened (a rising gap) | PASS | #7 |
| x7a | #7a | two more ring openings on the deck side: 6 entrances | PASS | #7 |
| x7c | #7c | a 3 m deck outside a west opening, up a ramp: 3 m drops into the ring | PASS | #7 |
| x7t | #7d | a 5.8 m inkable platform up a long ramp (tallWall) | PASS | #7 |
| x7l | #7d | a 4 m platform up a long ramp (longDrop) | PASS | #7 |
| x7h | #7d | a 1.83 m ledge in a ring opening, a ramp into the ring, the SW opening closed (highHop) | PASS | #5 #7 |
| x7g | #7d | the GAP's far platform 1 m on and 0.5 m down: 3.6 m of air (longGap) | PASS | #7 |
| x3 | #3 | the weir past its platform, 13 m from the ring (weir → Gate 10 m) | PASS | #3 #15 |
| x5b | #5 | a wall across the deck with a 3 m gap on route 1: route 2 round by the flank lane (2.23 ×) | PASS | #5 |
| x9d | #9 | a free zone over the weir's platform | PASS | #9 #15 |
| x9e | #9 | a free zone on the floor across the Pond → weir routes | PASS | #9 |
| x9f | #9 | an open-floor zone signed at one corner only: a 10 m entrance, an end unsigned | PASS | #9 |
| x9g | #9 | a free zone over the Gate | PASS | #8 #9 |
| x13 | #13 | two of the parapet's three openings closed: 1 way off | PASS | #13 |
| x14 | #14 | open water x 3…14, z 0…10 beside the Pond (mirrored): 65.5 % floor | PASS | #14 |
| x15t | #15 | **T1**: a 0.2 m lamp post 2.2 m from the weir (2.1 m to its corner) | PASS | #15 |
| x15a | #15 | the weir in the alley behind a chicane: its approach can't see it | PASS | #3 #5 #15 |
| x1 | #1 | **W5**: the weir at x 2 on its 8 m platform: a post off the edge | PASS | #1 |
| x11 | #11 | f16w's slot on route 1: the scripted carrier sticks (16 episodes), no plant | PASS | #11 |
| x11r | #11 | a noRetreat over each whole half: "retreat ×3 on at null m" | PASS | #9 #11 |
| w4 | #4 #9 must NOT fail | **W4**: the weir's platform a 1.5 m inkable box, no ramps (92 of 92 climbs hopped) | PASS | (none) |
| x7m2 | #7a | f7's ledge from x −17.2 (its west face off the 1 m grid: floor and top nodes two cells apart) | PASS | #7 |
| x7m4 | #7a | f7's ledge from x −17.4 (review 2's P1a) | PASS | #7 |
| x7m6 | #7a | f7's ledge from x −17.6 | PASS | #7 |
| x7m8 | #7a | f7's ledge from x −17.8 | PASS | #7 |
| x7m45 | #7a | f7's ledge turned 45°: every floor / top pair diagonal | PASS | #7 |
| x7p2 | #7a | P2: a 2.6 m moat before a 0.8 m landing in the ring, nodes 4.0 m apart (past the old 3.0 m window) | PASS | #7 |
| x7p4 | #7c #7d | P4: a 6 m inkable tower through the ring wall: squid up, drop 6 m into the ring | PASS | #7 |
| x15m | #15 #1 | Wc: the weir where the car parks (a mover's swept volume) | PASS | #1 #5 #15 |
| x9n | #9 | a 0.4 m noRetreat strip across an open-floor zone (crossing polygons) | PASS | #9 |
| reach | REACH | the kid: platform pairs over the sea, every made jump inside the windows | PASS | – |
| v5 | #7d | **V5** (review 3): the ring's NW stretch a 1.4 m roof wall: a kid vaults it | PASS | #7 |
| v5h | #7d | **V5h**: the same stretch 1.7 m | PASS | #7 |
| rl | #7a | **RL**: the west opening closed by a 1.2 m rail behind f7's screen: a vault and a squid gap | PASS | #7 |
| rlh | #7a | the same opening closed by a 2.6 m rail: only a squid slips through | PASS | #7 |
| h20 | #7a #7d | **H20**: f7's ledge 2.0 m high: only the swim-jump lands on it | PASS | #7 |
| g5 | #7d | **G5**: a 5.0 m moat through the west opening, inkable both sides: only the swim-jump clears it | PASS | #7 |
| reachs | REACH | the swimming carrier: inkable near platforms, 2.5 m down to 3.4 m down, every made jump inside the windows | PASS | – |
| x8n | #8 | the Gate 10 m from the pad | PASS | #8 |
| x8f | #8 | the Gate 22 m from the pad | PASS | #7 #8 |
| x8u | #8 | the Gate on a 3.4 m dais: 1 m above the pad | PASS | #1 #3 #7 #8 |
| x8s | #8 | a 4.6 m screen across the apron: the Gate unseen from the deck | PASS | #8 |
| x11f | #11 | a noRest polygon round the enemy half's water edge nearest the Pond: the fall dropped ≥ 13.5 m off | PASS | #11 |
| x11w | #11 | open water across the main floor, a 1 m causeway on route 1: the splat rests on narrow floor | PASS | #5 #11 #14 |
| x11z | #11 | the spawn-deck zone's eras as strings: the engine never applies it (no zone ×3) | PASS | #11 |

**The clean box** (D37's channel rail and bridge, since 92b6a972):

- L 61.58 / 61.45 m, weir count 60;
- 10 hop and 24 gap edges, all made;
- walks 8/8 routes and 8/8 entrances;
- 54 moves beyond the rules worth trying (32 long gaps, 22 vaults), none made by the kid;
- the swimming carrier makes nothing the kid didn't, from 72 inkable takeoffs (796 swim trials);
- the carry knocks out both ways (weir 5.9 + Gate 7.5 s, and 5.7 + 7.4 s), stuck 0;
- retreat ×3 on at 8.14 / 8.22 m, off at 2.9 m;
- 248 drop splats fine.

**Pictures** (`out/`):

- `self-clean-*`, the clean set;
- the top-downs of the cases: review 1's (`self-x7r` … `self-x11`), review 2's (`self-x7m2/4/6/8/45`, `x7p2`, `x7p4`,
  `x15m`, `x9n`) and review 3's (`self-v5`, `v5h`, `rl`, `rlh`, `h20`, `g5`, `x8n/f/u/s`, `x11f/w/z`);
- `self-reach.json`, `self-reachs.json` (every row with its trial) and `selftest.json`.

The top-downs read at a glance. For example, `self-rl-karpbox-s0-karp-top.jpg` shows flags 1–4 on the railed west
opening of each ring, both unseen arrows red, and the key below: "#7a a squid gap into the ring, unseen from the deck"
and "#7a a vault over a low wall or rail into the ring".

### 2.2 The honest report: halyard's and lockgate's first-cut data (the final checker)

Both still fail, as expected. Since fix round 1, the field-level numbers (L, counts, routes, #9–#15) are unchanged. What
moved is #7 and #16, under the windows (D29), the swimming carrier (D34) and the vaults (D35). `out/halyard-*` and
`out/lockgate-*` hold the full sets: a `-flag-<n>` for the #7 flags, up to 40, and the JSON.

**Halyard** (first cut: weir at (−8, 27.5), Gate at (0, 52.5)). L 54.8 / 54.7 m.
FAIL #3 #5 #6 #7 #9 #10 #12 #13 #14 #16, the same checks as before.

- **#3 / #5 / #6 / #9 / #10 / #12 / #13 / #14:** as in fix round 1. L is 54.8 m (< 55), weir → Gate is 24.4 m, route 2
  is 1.81 ×, 11.4 s walking, the deck's wings are only partly zoned, route 1 dips 6.6 m, there is no lightmap, the apron
  has 1 cover block, and 47.9 % of the Pond's ring is floor.
- **#7:**
  - (a) **10 / 9 entrances** (was 6). Every one is seen. The new ones are long gaps and rising gaps into the ring off the
    quays, e.g. (±4.5, ±49.5) and (−2.5, 58.5).
  - (c) 40 drops of 3.2 m off the spawn deck's edge into the ring (D4).
  - (d) **2 007 finds** (was 300): 1 115 made only by the swimming carrier, 876 by the kid, 16 static.
    - Long gaps and off-field gaps, mostly swim-jumps: by the slips and the moored boats at x ±19.5…21.5, z ±29.5
      (flags 23, 25, 39, 41), and across the yard at (±10.5, ±18.5…20.5) (flags 30, 35). Each flag holds 196–325 pairs,
      gaining up to 24 m.
    - Vaults: the review's (22.5, 0, −23.5) → (19.5, 0, −24.5), 34.7 m (flag 55).
    - The off-field tops at x ±23.5…24 (flags 56–58), one gaining 41.8 m, as before.
- **#16:** 6 of 546 added edges not made (was 12: the swimming carrier makes six the kid didn't). The 24 climbs of
  ≤ 1.8 m are all hopped. Walks 8/8 routes, 10/10 entrances.
- **Passes:** #1, #2 (Δ 0.2 %, no holes), #4, #8, #11 (knockout both ways, stuck 0, flags right, 204 drop splats fine),
  #15.

**Lockgate** (first cut: weir at (0, 24), Gate at (0, 52)). L 58.0 / 57.9 m. FAIL #5 #7 #9 #11 #12 #14 #15 #16, the
same checks as before.

- **#5 / #9 / #11 / #12 / #14 / #15:** as in fix round 1. Route 2 is 2.55 ×, there is a climb-only 14 m² plateau and
  four unsigned zone entrances a side, the narrow-walk splat rests on narrow floor, there is no lightmap, the Pond's
  ring is 63.9 % floor and seen from 4 of 8, and the office stands 1.5 m from the weir.
- **#7:**
  - (a) **8 / 8 entrances** (was 4), all seen. The new ones are long gaps into the ring, vaults joining two walk entrances, and a
    jump onto off-field ground at (±3.5, ±42.5).
  - (c) 22 drops of 3.1–3.3 m into the ring.
  - (d) **1 650 finds** (was 4): 1 641 by the swimming carrier, 5 by the kid, 4 static. **About 1 500 of them are one
    move: a swim-jump across the lock canal**, from either quay to the other, gaining 13.6–28.2 m (flags 18, 21, 23, 26).
    `lockgate-karp-top.jpg` shows it as four magenta fans over the diagonal canal; the field's way round is by the
    bridges.
    - The rest are highHop / riseGap / vault swim-jumps at the lock steps (±19.5, −0.6, ±12; flags 10–16), kid vaults at
      (±9.5, 2.4, ±62.5) (flags 29 / 30), and two low gaps.
    - Review 2's two boat-frame jumps (10.8 / 12.5 m) are not finds: D33's saving rule (§3).
- **#16:** 10 of 492 added edges not made (gaps down from the office's edge; was 13). Walks 8/8, 8/8.
- **Passes:** #1, #2, #3 (count 50, weir → Gate 29.0 m), #4, #6 (12.1 s), #8, #10, #13.

**For WP4b, the canal is the main thing:** its swim-jump is about 1 500 finds on its own. Either the canal's quays get a
2.3 m barrier or the canal is wider than 8 m, or the lead takes D34's (b) or (c).

### 2.3 Every shipped stage (`MAP=all`, the final checker)

`MAP=all` ran every shipped stage in one Electron on the final checker (e1d4ae4a): 25 min (01:40–02:05) at load 22–75,
no harness errors, no console errors. The run before, on eb1f357e, matched it row for row except the vault columns of
terraces (29 → 33 tried), craters (17 → 19) and calamari (9 → 11), which is the widened vault test (§0, issue 1).

Only halyard and lockgate have data. The other eleven run on the engine's placeholder data and fail by design
(DECISIONS #10). For those, what the stage itself holds (edges, proof, finds, climbs) is real, but what depends on the
Pond, weir and Gate spots is the placeholder's.

| stage | L (m) | weir counts | result | failing checks | hop + gap edges | #16 made / not made (hopVeto) | #16 walks: routes, entrances | beyond the rules made | rising gaps: tried / made | vaults: tried / made | made only by the swimming carrier | climbs ≤ 1.8 m hopped | #7d finds (gain > 10 m) | entrances A/B | s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tidewater (placeholder) | 57.02 / 55.45 | 100 | fail | #2 #3 #4 #5 #7 #11 #12 #15 #16 | 6 + 108 | 106 / 8 (h 0, g 0, g↓ 8) | 0/0, 12/12 | 1689 of 1741 | 3 / 3 | 66 / 66 | 614 (2 edges, 579 beyond, 33 off-field) | 11 of 11 | 1771: lowGap 84, longDrop 13, longGap 1553, riseGap 3, vault 60, offHop 14, offGap 44 | 6/9 | 111 |
| kelpline (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1708 / 6 (h 0, g 2, g↓ 4) | 8/8, 6/6 | 2052 of 2127 | 77 / 77 | 25 / 25 | 1061 (1 edges, 813 beyond, 247 off-field) | 52 of 52 | 1336: lowGap 10, climbOff 2, highHop 5, longGap 747, riseGap 57, vault 21, offHop 23, offGap 471 | 5/5 | 88 |
| halyard | 54.8 / 54.68 | 45 | fail | #3 #5 #6 #7 #9 #10 #12 #13 #14 #16 | 16 + 530 | 540 / 6 (h 0, g 0, g↓ 6) | 8/8, 10/10 | 1683 of 2135 | 379 / 181 | 3 / 3 | 1394 (6 edges, 1236 beyond, 152 off-field) | 24 of 24 | 2007: lowGap 16, longGap 1166, riseGap 134, vault 3, offHop 34, offGap 654 | 10/9 | 121 |
| saltpan (placeholder) | 83.48 / 81.06 | 50 | fail | #2 #7 #8 #9 #11 #12 #13 #15 | 91 + 186 | 277 / 0 | 8/8, 4/4 | 65 of 89 | 9 / 8 | 25 / 23 | 70 (16 edges, 54 beyond, 0 off-field) | 58 of 58 | 100: lowGap 47, longGap 24, riseGap 8, vault 21 | 3/3 | 71 |
| crossmarket (placeholder) | 65.13 / 65.4 | 49 | fail | #5 #7 #8 #9 #11 #12 #13 #14 #15 #16 | 0 + 173 | 167 / 6 (h 0, g 0, g↓ 6) | 6/6, 8/8 | 498 of 511 | 42 / 36 | 38 / 38 | 139 (0 edges, 139 beyond, 0 off-field) | 0 of 0 | 370: highHop 15, longGap 291, riseGap 34, vault 30 | 6/6 | 77 |
| lockgate | 58.03 / 57.9 | 50 | fail | #5 #7 #9 #11 #12 #14 #15 #16 | 66 + 426 | 482 / 10 (h 0, g 0, g↓ 10) | 8/8, 8/8 | 1666 of 2070 | 174 / 85 | 18 / 12 | 1660 (3 edges, 1653 beyond, 4 off-field) | 90 of 94 | 1650: lowGap 4, highHop 26, longGap 1528, riseGap 84, vault 8 | 8/8 | 131 |
| terraces (placeholder) | 66.01 / 61.2 | 48 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 145 + 641 | 780 / 6 (h 2, g 2, g↓ 2) | 8/8, 10/10 | 872 of 1032 | 871 / 742 | 33 / 30 | 91 (0 edges, 89 beyond, 2 off-field) | 408 of 410 | 750: lowGap 11, longGap 60, riseGap 645, vault 24, offHop 4, offGap 6 | 8/10 | 84 |
| nantai (placeholder) | 72.85 / 72.99 | 50 | fail | #7 #8 #9 #12 #13 #15 | 99 + 323 | 422 / 0 | 8/8, 4/4 | 4524 of 5438 | 206 / 130 | 21 / 21 | 4232 (2 edges, 4228 beyond, 2 off-field) | 371 of 371 | 4546: lowGap 18, longGap 4373, riseGap 130, vault 21, offHop 4 | 2/2 | 215 |
| craters (placeholder) | 69.39 / 69.26 | 50 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 317 + 1376 | 1583 / 110 (h 2, g 2, g↓ 106) | 8/8, 2/2 | 513 of 580 | 409 / 392 | 19 / 18 | 239 (38 edges, 200 beyond, 1 off-field) | 226 of 226 | 506: lowGap 40, highHop 4, longGap 53, riseGap 373, vault 18, offHop 11, offGap 7 | 3/3 | 66 |
| calamari (placeholder) | 64.82 / 64.82 | 48 | fail | #7 #8 #9 #11 #12 #13 #16 | 74 + 239 | 311 / 2 (h 0, g 0, g↓ 2) | 8/8, 12/12 | 479 of 532 | 218 / 165 | 11 / 11 | 265 (0 edges, 265 beyond, 0 off-field) | 138 of 138 | 465: lowGap 4, highHop 2, longGap 271, riseGap 165, vault 9, offHop 14 | 8/7 | 96 |
| spirhalite (placeholder) | 80.25 / 79.54 | 50 | fail | #5 #7 #8 #11 #12 #13 #14 #15 | 84 + 622 | 706 / 0 | 8/8, 2/2 | 574 of 746 | 198 / 166 | 27 / 24 | 273 (0 edges, 273 beyond, 0 off-field) | 284 of 284 | 562: lowGap 16, highHop 41, longGap 331, riseGap 152, vault 18, offHop 4 | 2/1 | 80 |
| treehills (placeholder) | 70.93 / 70.48 | 52 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 197 + 200 | 393 / 4 (h 0, g 0, g↓ 4) | 8/8, 6/6 | 296 of 327 | 206 / 178 | 8 / 6 | 67 (0 edges, 67 beyond, 0 off-field) | 91 of 91 | 312: lowGap 16, longGap 112, riseGap 178, vault 6 | 3/3 | 61 |
| cargo (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1708 / 6 (h 0, g 2, g↓ 4) | 8/8, 6/6 | 2052 of 2127 | 77 / 77 | 25 / 25 | 1061 (1 edges, 813 beyond, 247 off-field) | 52 of 52 | 1336: lowGap 10, climbOff 2, highHop 5, longGap 747, riseGap 57, vault 21, offHop 23, offGap 471 | 5/5 | 95 |

Reading it (the columns that are new or changed since fix round 1):

- **#16 made / not made:** fewer not-made edges than before (halyard 12 → 6, lockgate 13 → 10, craters 148 → 110,
  saltpan 16 → 0, nantai 2 → 0). The swimming carrier makes some edges the kid can't (D34), and a move made either way
  counts. So saltpan and nantai no longer FAIL #16.
- **Beyond the rules made:** the 1.8–2.25 m hops, long gaps, rising gaps and vaults worth trying that either mover
  makes. The windows now reach the measured reach (D29), so these are hundreds to thousands per stage.
- **Rising gaps: tried / made.** This is the column the review saw print `undefined`; it now reads #16's own counts.
- **[r3] Vaults: tried / made.** The kid or the swimming carrier makes nearly every vault worth trying.
- **[r3] Made only by the swimming carrier:** with the added edges, the beyond-the-rules moves and the off-field moves
  among them.
- **#7d finds:** **the swimming carrier dominates.** Its long gaps are most of nantai's 4 546, lockgate's 1 650 and
  halyard's 2 007. The kid alone still has hundreds on several stages: tidewater 1 120, kelpline 793, terraces 649,
  halyard 876. Those come from the measured windows (review 2's issue 2). The full list, with both ends and `by`, is in
  each stage's JSON (`checks.7.nums.d`). `out/all-stages.json` keeps the counts.
- **Entrances A / B:** a move into the ring that saves more than 3 m is an entrance (D33). Halyard 10 / 9, lockgate
  8 / 8, tidewater 6 / 9 (3 of Bravo's unseen), kelpline 5 / 5 (1 / 2 unseen); spirhalite's 2 / 1 sits on the
  placeholder's Gate spot.

**Review 3's real-stage crossings** (its read-only `vault.js` scan; each one MADE by the checker's own kid). Every one
is now a #7d find with both ends exact, and flagged within 0.1 m:

| stage | crossing | gain | the final checker |
|---|---|---|---|
| crossmarket | (9.5, 0.72, -55.5) → (6.5, 1.13, -56.5) | 34.4 m | vault (the kid), gain 34.4 m; flag 16 |
| crossmarket | (-9.5, 0.72, 55.5) → (-7.5, 1.13, 56.5) | 34.4 m | vault (the kid), gain 34.4 m; flag 27 |
| tidewater | (-11.5, 0, -55.7) → (-11.5, 0, -52.7) | 18.8 m | vault (the kid), gain 18.8 m; flag 26 |
| tidewater | (5.5, 2.4, -58.7) → (3.5, 2.4, -56.7) | 28.9 m | lowGap (static), gain 28.9 m; flag 32 |
| terraces | (2.5, 2.4, -35.5) → (3.5, 2.4, -37.5) | 11.9 m | vault (the kid), gain 11.9 m; flag 12 |
| craters | (-14.5, 0, 30.5) → (-13.5, 0, 33.5) | 11.3 m | vault (the kid), gain 11.3 m; flag 13 |
| treehills | (-12, 0.3, 22.05) → (-13, 0, 19.5) | 10.9 m | vault (the kid), gain 10.9 m; flag 42 |
| calamari | (15.95, -0.1, -38) → (17.5, -0.1, -36) | 10.4 m | vault (the kid), gain 10.4 m; flag 26 **[r3b]** e1d4ae4a |
| halyard | (22.5, 0, -23.5) → (19.5, 0, -24.5) | 34.7 m | vault (the kid), gain 34.7 m; flag 55 |
| kelpline | (15.5, 0, 62.5) → (15.5, 0, 59.5) | 13.7 m | vault (the kid), gain 13.7 m; flag 73 |

(The tidewater pair at (5.5, 2.4, −58.7) is a squid gap, lowGap, and it is also inside flag 32's group of ten vaults.)

**Pictures:**

- `out/<id>-karp-top.jpg` for all 13 stages, each with its flag key;
- the full sets (pond, weirs, Gate, zone, a `-flag-<n>` for the #7 flags) for halyard and lockgate.

Most come from the eb1f357e run. Terraces', craters' and calamari's top-downs, every JSON and `all-stages.json` come
from the final run.

I looked at `lockgate-karp-top.jpg` (the canal's four fans, 52 flags keyed) and `lockgate-flag-18.jpg`. The flag
picture's camera stands behind the bridge's arch, so the move's "from" end is drawn over the brickwork. The arrow and
caption read, but the scene doesn't: a camera that avoids occluders is a polish left open (§6).

### 2.4 Regressions (what this round could have broken)

This round changed only the checker (`tools/botlab/`), its docs and scratch: `git diff 0ba0bded..HEAD -- src assets docs`
is empty, as it was for fix round 2.

- **The checker's self-test:** 72/72, twice (§2.1).
- **`MAP=all`:** 13 stages, no harness or console errors, twice: on eb1f357e (31 min at load 250–470) and on the final
  checker e1d4ae4a (§2.3).
- **check-maps** (`node build/check-maps.mjs`, run on this tree and on b55f7472 unpacked):
  - every stage's default build: output **identical to base b55f7472**, and to review 3's run;
  - every `<id>.bazookarp` build: identical to review 3's run. halyard has 155 pieces with its known 25.7° ramp;
    lockgate has 258 with its known weir-cap z-fight inside the office, which #15 already FAILs.
- **karp-layout-diff** against b55f7472: **RESULT same (96/96 builds and thumbnails identical)**.
- **Not re-run, because nothing they test changed:** karp-field.js, bazookarp-rules.js, karp-loop.js, karp-gun.js, the
  sfx and net tests. `src/` is untouched since fix round 1's one-line `karpKitFx` fix, which bazookarp-rules (117/117)
  covered then.

## 3. Decisions where the spec left a gap (for the lead)

- **D1. #3's "each weir's count is the lowest within 3 m of it on its floor" is reported, not judged.**
  - On any floor that falls toward the Gate, the nodes 3 m on read about 5 counts lower, so the literal rule fails every
    placement (the clean box's weir: count 60, 55 within 3 m).
  - Its purpose ("landing it is never worth less than walking past it") already holds through the cap (§3.4): until the
    plant, the count stops at the highest weir count, and a plant sets the planted weir's.
  - The JSON keeps `low3` per weir. **TELL THE LEAD.**
- **D2. Hops onto off-field ground are a #7d probe, and #7a counts them.**
  - The field's hop edges join field nodes only, and nav keeps only nodes it can walk to and back from. So a ledge top
    that only a hop reaches is outside the field: no field edge, no entrance, no reading.
  - SPEC §4.4's own self-test fault (f7) is that case.
  - **[r1]** This is extended to jumps across a real gap (D21).
  - The engine could take such tops into the field (WP0's / the lead's call). **TELL THE LEAD.**
- **D3. A #7d find with one end off the field** (D = ∞) is a WARN, a hiding place, not a FAIL: its gain has no number.
- **D4. #7c counts drops off the defenders' own spawn deck into the ring**, as the spec's words say.
- **D5. Waivers live in the data:** `waive: [{ check: '7d', at: [x, z], why }]` (Alpha's attack, mirrored). A find of
  that check within 2 m of the spot is reported as waived.
- **D6. The self-test box is karpbox plus a clean variant** (`karp-check-box.js`). karpbox itself is left untouched,
  because the rules tests rely on it.
- **D7. The self-test.**
  - One fault per check, plus SPEC §4.4's own list.
  - **[r1]** One case per sub-rule that had none, and the reviewer's faults (§2.1): 48 cases.
  - `notFail` cases prove a false FAIL gone.
- **D8. #9's plateau WARNs** apply to plateaus of 4 m² or more. The FAIL rule is the spec's, for any size.
- **D9. #13's "ways off the deck"** are nav edges of any type leaving a level flood of the deck, chained within 3 m. The
  deck's own blocks are not apron cover.
- **D10. #14 counts floor at any level within ±5 m of the Pond.**
- **D11. #16's run-up:** when 1.5 m or 3 m back is not floor at the low end's height, the start moves toward the edge in
  0.3 m steps. With no start at all, the edge counts as not made.
- **D12. #11's falls** use the wet node nearest the Pond on each half. "The narrowest walkway near each weir" is the
  route node within 12 m of the weir (≥ 3 m from it) with the fewest nodes within 1.5 m.
- **D13. The kit's looks live in their own module** (`karpKitFx.js`).
- **D14. Stage states carry a `query`**, so one generic checker builds each state's world.
- **D15. One tagged line in the Carp Field (`src/game/karpField.js`, WP0's code): a one-way gap edge down needs open air
  over its landing below the ledge it leaves** (nav's drop rule).
  - Without it, deck tops had "gap" edges down to the floor under that same deck. Removing them took crossmarket from
    443 to 173 gap edges, calamari from 804 to 239 and lockgate from 684 to 426.
  - **TELL THE LEAD.**
- **D16. The self-test checks the reason, not only the check number:** each case carries an `expect` pattern on its
  check's text.
- **D17. #16's walks** run the routes and entrances the graph claims with a real body. The walker's habits were tuned
  on traces, not guessed.
- **D18. Craters' not-made gap edges are real:** thin balustrades the field's level waist line passes over. A down-gap
  waist line that follows the fall would drop most of them at the source (WP0). **TELL THE LEAD.**
- **D19. #5 FAILs a leg with no route at all.**

New in fix round 1 (review 1):

- **D20. Rising gaps** use the reviewer's definition:
  - rim pairs 1.2–3.0 m apart (flat), the far one 0.6–1.8 m up;
  - "open air" somewhere under the line (no floor within 1 m below it);
  - a clear waist line;
  - no 6 m carrier-graph walk joining them, so a step a kid can walk to and hop is no candidate.

  **Which ones #16 tries:** only those that can change a verdict, i.e. worth more than 10 m, or from outside a Gate's
  ring to inside it. The rest are counted (`candidates / tried / made` in the table). Their gain is in the move's own
  direction (D23).
- **D21. Jumps onto off-field ground:**
  - from a field rim node to an off-field rim node (nav-invalid, not a spawn zone, not a carrierBlock);
  - 1.2–3.8 m flat, from 3.4 m down to 1.8 m up;
  - across a **real gap**: somewhere along the line, no floor within 1 m below the lower end.

  The real-gap test is stricter than D20's. Measured against the rising line itself, a running jump onto a box across
  its own floor counted as "air". Kelpline had 56 such pairs onto one box by its spawn, and f7 had 26 onto its ledge.
  Those are the off-hop from the box's foot (D2) seen from further back.

  **An off-field top's exits** are nav's own edges off it, plus stepping or dropping off its edge: field floor up to 2
  cells out and 0.3–3.4 m lower, open above, with a clear waist line. Nav has no node right beside a ledge where a body
  doesn't fit against it, so H2p's landing had no nav exit at all.

  **Tried** when its best exit is more than 10 m nearer a Gate, or it has an exit inside a ring entered from outside.
- **D22. #7a's moves.**
  - A move #16's kid makes from outside a Gate's ring to inside it is an entrance at its landing (or, onto off-field
    ground, at the landing if that is in the ring, else its first exit in the ring).
  - It joins the entrance with a graph crossing nearest it within 3 m, so a jump beside a doorway does not add a sixth
    entrance. Otherwise it groups with the other moves.
  - It never chains two separate entrances into one (d5795858; at 69abedc0 tidewater's Bravo side lost one so).
  - It is never "seen" through that entrance's walk crossings. It needs its own line of sight, to its landing or to any
    of its exits in the ring.
- **D23. The gain of a one-way move** (a high hop, a long gap, a rising gap; the off-field moves already were) is
  measured in its own direction: D(from) − D(to), for the team it helps.
  - **Why:** #16 proves each move one way, and a move that lands further from both Gates is no shortcut. H2q's long gap
    back out of the ring went 14.8 m the wrong way.
  - The static probes keep SPEC's "differs" (\|ΔD\|): a squid gap goes both ways, and a tall wall's top is read
    through the drop off it.
  - **TELL THE LEAD** if SPEC's word should rule there too.
- **D24. Climbs a kid hops** (issue 2).
  - **What counts:** a nav climb edge of at most 1.8 m between field nodes that passes the hop rule's own tests (waist
    line, head over the foot, head across), and that #16's kid makes (its jump timed off the wall nav found). It counts
    as a hop in every no-climb search; #7b doesn't list it.
  - **What doesn't change:** the field's own D (a climb and a hop are the same length).
  - **PHYS=0:** the geometry alone decides, and the text says "unproven".
  - The climb edges above 1.8 m stay squid climbs.
- **D25. #1's kit footings.**
  - The check samples 3 × 3 points at ±80 % of each footing, plinth slab, sill and sign foot.
  - Floor (any solid non-kit top) must be at most 0.1 m below the piece's bottom. Buried is fine.
  - **The kit is not changed** to build each post at its own floor: a post sunk silently to the ground below a ledge
    would hide a weir spot the builder must move. It FAILs instead.
- **D26. The flags.**
  - One numbering for the picture, its key, the `-flag-<n>` pictures, the JSON and the console.
  - A check's flags of one kind (the text without its numbers) within 2 m of each other are one; #7d's finds of one
    probe within 3 m are one.
  - There are pictures for every #7 flag, then FLAGSHOTS others, at most 40.
- **D27. #15 excepts any weir's own posts and sill** (the `karp-weir*` / `karp-sill` tags). Gate posts and NO CARP signs
  count.

New in fix round 2 (review 2):

- **D28. Hops onto off-field ground from up to two cells out.** nav keeps a floor node at least 0.46 m from a face, so
  where a ledge's face falls just past a cell centre, the floor node and the top node stand two cells apart or on a
  diagonal. The off-hop takes every off-field top node within 2.3 m (flat) and 0.5–2.25 m up, diagonals included,
  with the hop rule's waist and head tests (the reviewer's first option; D21's real-gap test stays for the jumps across
  air).
- **D29. The windows are the mover's measured reach,** not SPEC's bands. `REACH.air` (the kid) and `REACH.swim` (the
  swimming carrier) hold, per rise, the first gap of the self-test's REACH rows not made beyond the last made one. A
  window adds a 0.3 m margin and a cell's worth at each rim (a rim node stands up to 0.95 m back from its edge). The
  `reach` and `reachs` cases prove every made jump lies inside, at the worst grid alignment. A wider window only costs
  trials: a candidate becomes a find only when #16 makes it.
- **D30. A squid climb onto off-field ground** (a tall wall's top) is followed through the top's exits, as the off-hop's
  tops are: nav's edges off it and stepping or dropping off its edge, down to the 20 m `dropMax`. Only a top with no exit
  at all is a WARN (a hiding place).
- **D31. Movers.** #1 FAILs a kit piece standing in a mover's swept volume (`movers.js` `sweepRect`, and
  `G.match.stage.sweeps()`); #15 FAILs a weir whose 3 m room it crosses. A Gate or Pond trigger in one FAILs #1 too.
- **D32. Every FAIL with a place carries a flag** (#2–#6, #11, #12 as well as #7). A route-ratio FAIL is flagged at the
  leg's far end. `-flag-<n>` draws a flagged move from → to with an arrow and its gain in the caption.
- **D33. When a move the field lacks is a find.** SPEC: "D differs by more than 10 m". The checker: the move lands more
  than 10 m nearer a Gate, in its own direction (D23), **and** that gain beats the move's own length by more than
  10 − 3.8 = 6.2 m (`SAVE_FIND`). Into a ring, a move is an entrance when it saves more than 3 m (`CK.entGroup`) on the
  field's own way in.
  - **Why:** inside SPEC's windows (≤ 3.8 m flat) the second condition follows from the first, so nothing changes there.
    The windows now reach 8 m for the kid and 16 m for the swimmer (D29). A long run-and-jump off a deck onto floor 6 m
    out gains as much D as the drop and walk the field already has, and is no shortcut.
  - **What it costs:** lockgate's two boat-frame jumps (10.8 / 12.5 m in review 2, at (±20.5, 1.08, ±38.5)) are not
    finds under it: each saves less than 6.2 m over its own length. Under SPEC's literal words they would be.
  - **TELL THE LEAD.** Choose between SPEC's literal 10 m and this. The switch is one constant.

New in fix round 3 (review 3):

- **D34. #16's second mover is the carrier swimming in its own ink** (§0, issue 2). It is tried only when the kid fails
  and the takeoff's floor takes ink (`inkFloor`: a paintable face right under the node). The ink is written into the
  paint grid only, never splatted, and put back after. Letting go of squid form at the top of the jump is tried for
  rises of 1.4 m or more. A move made only by the swim is marked `(swim-jump)`.
  - **What it costs:** on the real stages most #7d finds are now swim-jumps (§2.3): nantai 4 230 of 4 546, lockgate
    about 1 640 of 1 650 (its lock canal), halyard 1 115 of 2 007. They are real moves for a carrier who inks its
    run-up, but the stage briefs were built on the kid's 1.8 m / 4 m reach.
  - **TELL THE LEAD: choose one.**
    - (a) Keep it. Every barrier and moat beside inkable floor must beat the swim-jump: 2.3 m high, or wider than 8 m
      of air on the level. That is a rebuild brief for every stage.
    - (b) Shorten the carrier's swim-jump in the engine (WP0/WP1). For example, a carrier in the air keeps the squid's
      dry speed rather than its swim speed. The checker's windows follow from the self-test's `reachs` rows: re-run them
      and paste the new table.
    - (c) Judge #7d on the kid alone and report the swim finds as a WARN. The trial already has the switch
      (`o.kidOnly`); one line in the find rule would make it so.

    I have not chosen, because it changes what SPEC §2.4 lets a carrier do. As it stands the checker FAILs on (a).
- **D35. Vaults** (§0, issue 1): node pairs ≤ 3.5 m apart across a waist-high obstacle whose top is at most 2.25 m over
  the higher end, with 1.5 m of air above it and floor under the whole line; at most two per takeoff and one per 1.5 m.
  **The squid tube passes grates and rails**, as `collideBody` lets a squid through them, and never stands on a grate.
- **D36. The rise ceiling is 2.25 m** (`CK.hopHigh[1]`, the vault's top). The swim-jump letting go at the top lands on
  2.2 m and never on 2.25, 2.3, 2.4 or 2.5 m (§0, issue 2). 2.25 is the first rise measured as never made, so ledges
  between 2.2 and 2.25 m are still tried.
- **D37. The clean box's channel** is closed by a 2.6 m rail on its west edge (z 20.4–36), and its pier is widened into a
  bridge over the channel's north end (z 36–44). Review 2's #16 kid jumped the 3 m channel, gaining 14 m round by the
  pier, so the channel had to close; this way it no longer pinches the SE opening (review 3, issue 3). karpbox itself, the
  rules tests' stage, is unchanged.

## 4. Online, bots

Nothing crosses the wire:

- the checker is a tool;
- the kit pieces are static level pieces built the same on every screen, from the data, in `layoutFor`;
- `karpKitFx` is local looks;
- `G.match.stage.karpStates()` is a query.

No bot code changed. Bots walk nav, not the carrier graph, so D15 doesn't touch them. The checker's new findings
(rising gaps, off-field jumps, hopped climbs) are measurements, not engine changes.

**[r3]** The swimming carrier's trials write ink straight into the local paint grid of the offscreen check and put it back;
nothing is splatted, recorded or sent. Bots are untouched. The swim-jump's reach (2.2 m up, ~7.4 m of air level)
is something bot carriers could use; that is the bots package's call (karp-bots).

## 5. Commits and shared files

**By the first builder (2026-10-10):** f9066b54, d076d897, f5d9cfa6, 41b3af85, 67fc76a0, 1fa1d0cf, 8a7bd6ca, da478a62.

**The takeover (2026-10-16 morning):** 6423a8b7, 8f19bfc0, ec272051, 3ecb30b6, e84f4669, cff56eaf, 49894ea9, d7f07321,
3f1ec4a7, 8c19a918, a51212ef. Scratch commits: 4d8e193a, 50ad9e2c, 746fe97e, 4387bed6.

**Fix round 1 (review 1):**

- ef762c16 karpKitFx: the carrierBlock glyph's background is transparent again (issue 5)
- 4cabc0db bazookarp-check (review 1):
  - #7 sees the moves no edge holds: rising gaps and jumps onto off-field ground;
  - kid moves into a ring are #7a entrances;
  - off-field exits by stepping off the edge;
  - climbs of ≤ 1.8 m the kid hops count as hops;
  - #15 is exact;
  - #1 checks the kit footings;
  - the numbered flags, the key and the padded bounds.

  (Issues 1, 2, 3, 4 and 6.)
- 5770f4db bazookarp-check.cjs: the flags printed and in the JSON; the self-test's notFail cases
- 5eb949cb README / karp-stages BUILDER.md: the Mac mini lines and the new rules (issue 8)
- bab228f5 (scratch) JOB-1.sh split into JOB-1 / JOB-2 (issue 8)
- 248405e8 bazookarp-check self-test: 23 more cases, 48 in all (issue 7)
- 98a679a4 bazookarp-check MAP=all table: rising gaps and hopped climbs per stage
- 2591cc21 (scratch) out/kit-carrierblock.jpg re-taken (issue 5)
- ab1e9afc bazookarp-check #7d: one-way moves gain in their own direction (D23)
- 3693a126 bazookarp-check #7d: a jump onto off-field ground needs a real gap (D21)
- 69abedc0 bazookarp-check flags: only flags of one kind merge
- deef4377 bazookarp-check pictures: under 290 KB by quality, then size
- ef4782a5 (scratch) out/: every stage's top-down, halyard's and lockgate's full sets, the self-test's pictures,
  selftest.json
- d5795858 bazookarp-check #7a: a kid's move joins the nearest entrance and never chains two (D22)
- 0398e735 (scratch) out/ on the final checker: MAP=all's top-downs and every stage's JSON, halyard's and lockgate's full
  sets, the self-test's entrance cases re-taken
- a880d442, 68fa97bc (scratch) the report

**Fix round 2 (review 2):**

- 0ba0bded bazookarp-check self-test (review 2): the reviewer's faults as cases before the fixes (x7m*, x7p2, x7p4, x15m,
  x9n, REACH), and the driver checks a case's `also` checks and that its target FAIL carries a flag
- 0cd9479b bazookarp-check fix round 2, committed by fix round 3 from the interrupted fixer's working tree: off-field
  hops from two cells out (D28), the measured windows (D29), squid-climb tops followed (D30), movers (D31),
  `polyPolyDist`, a flag for every FAIL with a place and the move drawn on `-flag-<n>` (D32), D33, the table's
  rising-gap column

**Fix round 3 (review 3):**

- 92b6a972 the self-test box: the channel closed by a 2.6 m rail and the pier widened into a bridge (D37); x7p4 expects
  its real reasons (issue 3)
- c0cd3a3b bazookarp-check: #16's swimming carrier (D34), the vault probe (D35), the squid tube through rails and grates,
  made moves dropping > 2.5 m into a ring as #7c; the table's vault and swim columns (issues 1, 2)
- a536364c the self-test: v5, v5h, rl, rlh, h20, g5, reachs; x8n, x8f, x8u, x8s, x11f, x11w, x11z (issues 1, 2, 4)
- 90e65be9 README / karp-stages BUILDER.md: the swimming carrier, vaults, squid gaps through rails
- **(takeover)** 8695f630 the swimming reach measured to its ceiling: REACH.swim, `hopHigh` and the vault's top 2.25 m,
  the ceiling rows (D36; issue 2)
- **(takeover)** c62b4153 the self-test: x11f's polygon to x 27, x11z's real reason (issue 4)
- **(takeover)** eb1f357e README / BUILDER.md: the swim-jump's measured ceiling
- **(takeover)** 2fdb592d comments on the vault and off-hop probes (no change in behaviour)
- **(takeover)** cdb87475 (scratch) out/ on eb1f357e: MAP=all's top-downs, every stage's JSON, halyard's and lockgate's
  full sets; the self-test's clean set and the new cases' top-downs, selftest.json
- **(takeover)** e1d4ae4a bazookarp-check #7d vaults: the waist line blocked by nav's test or a ray 0.3 / 0.6 m up
  (review 3's calamari crossing; issue 1)
- **(takeover)** 8165118f (scratch) out/ on e1d4ae4a: every stage's JSON and all-stages.json, terraces' / craters' /
  calamari's top-downs, selftest.json (72/72)
- **(takeover)** this report: one `(scratch)` commit after these

**Shared files touched** (each hook tagged `[b5-karp-checker]`):

- `src/game/karpField.js`: one condition in the gap scan (D15, the first builder's). It is untouched since.
- `src/game/stageMods.js`: `'karpStates'` in `R_HOOKS`, and `StageRun.karpStates()`.
- `src/main.js`: the import of `KarpKitFx` and one constructor line.
- `src/world/bazookarp-kit.js`: the kit, rewritten (WP0's file).
- `src/world/bazookarp-data.js`: the `waive` field documented in its header.
- `src/fx/karpKitFx.js` (new; **[r1]** one line in `drawNoCarp`).
- `docs/STAGE-MODS.md`: the `karpStates` row, and T4 served.
- `tools/botlab/README.md`: the checker, PROBE and the regression set (**[r1]**; **[r3]** the swimming carrier, vaults, squid gaps through rails, the measured ceiling).
- New files:
  - `tools/botlab/bazookarp-check.cjs`, `karp-check-page.js`, `karp-check-box.js` and `karp-check-states.js`;
  - `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`.

## 6. Unfinished, uncertain

- **The field itself still lacks these moves** (TELL THE LEAD, WP0). The checker finds and FAILs them; the engine does
  not read them:
  - rising gaps and jumps onto off-field ground;
  - hop edges where nav already has a climb edge, and on-field hops whose ledge face misses the grid (review 2);
  - **[r3] vaults over low walls and rails, and squid gaps through rails and grates**;
  - **[r3] the swimming carrier's reach** (about twice the kid's, up to 2.2 m).

  A carrier who makes one of these reads the far side at once, which the continuity clamp may reject. A carrier on an
  off-field top keeps its last value.
- **[r3] The swim-jump's 2.2 m is measured on the carrier only** (9.44 m/s). A player without the Bazookarp swims at
  11.8 m/s with the same jump velocity. It should reach at least as high and further, but that is not measured. If the
  lead wants the game-wide number, it is one more REACH run without `carry`.
- **[r3] The vault probe tries a pruned set:** at most two candidates per takeoff (the best gains) and one per 1.5 m of
  the same place. A wall is tried where it gains most, not at every node along it. The squid gap counts as an entrance
  only when it saves more than 3 m on the field's own way in (D33).
- **[r3] The swimming carrier swims only from floor that takes ink**, inked straight in its own colour. It doesn't model
  half-inked run-ups or an enemy's ink in the way. It is the best case, which is the right case for a shortcut check.
- **Moves worth 10 m or less, not into a ring, are not tried.** They could not change a verdict; the table counts them.
- **An off-field top's exits are not proved physically.** The kid proves the jump onto the top. An exit is a step or
  drop off its edge with a clear waist line, which only a rail at waist height would stop.
- **D23 and D33 read SPEC's "differs by more than 10 m"** as the move's own direction, beating its own length by 6.2 m.
  The lead may want SPEC's literal \|ΔD\| back (§3).
- **Halyard's boat finds are real moves**, a yacht's deck bridging a slip, but they are many. For WP4b: `roof` boat
  tops, a carrierBlock, or a waiver.
- **#16 tries a fixed set of moves.** It steers straight at the far node from fixed run-ups with fixed jump timings. A
  move that needs another line could read as not made. A builder should run `PROBE=` on a listed edge before pasting its
  hopVeto.
- **COMMON.md was changed in this worktree, not by me** (uncommitted: "THE MAC MINI IS BACK", 2026-10-16). My task says
  the Mac mini is unavailable and to push nothing, so everything ran locally and the file is left as I found it. JOB-1 /
  JOB-2 (committed, not pushed) are ready for the runner once the lead pushes `botlab-b5-karp-checker`.
- **The 60 ms field budget is still unmeasured on a quiet machine** (JOB-1). karpField is untouched since the first
  builder.
- **The gimmick stages have no states yet on this base.** The generic state path is proved only with the test module
  and karpbox's test state.
- **A `-flag-<n>` camera can stand behind an occluder.** `lockgate-flag-18.jpg` looks through the bridge's arch, so the
  move's "from" end is drawn over brickwork. The arrow, ends and caption are right; the scene is not readable. The
  camera does not search for a clear view.
- **The kit's look was judged from pictures only, with no lightmap.** Review 3 noted that the Gate plinth still reads as
  a plus of two-tone slabs with a centre seam, and two carrierBlock glyphs overlap at one corner. Neither is changed this
  round. WP2 owns the moving parts.
