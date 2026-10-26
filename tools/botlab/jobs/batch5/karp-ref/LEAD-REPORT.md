# WP4b karp-ref: the takeover from Codex — report to the lead (2026-10-26)

Branch `b5-karp-ref`, worktree `/Users/danielosling/Desktop/1/st-b5-karp-ref`. Took over at 44b357d6 with Codex's
uncommitted edits; about four hours of work, then the lead's 90-minute Halyard finish (§7). **Both reference layouts pass
all 16 checks** (PHYS and CARRY on); every #7d row is classed (7d=0/0/0 on both); both teams of both stages have exactly
their five declared Gate entrances, all seen; `halyard.bazookarp` is baked (hash 592dc01).

## RESULT lines (full runs: PHYS on, CARRY on, pictures on)

| | baseline (Codex's edits committed, before any change of mine) | now |
|---|---|---|
| halyard | `fail L=55.43/55.3 weir=48 gate=12.2 routes=2/2 zones=2 hops=65+4554 walks=8/8+6/10 swim=fail 7d=10/40/59 FAIL=7,12,16` | `ok L=55.43/55.3 weir=48 gate=12.2 routes=2/2 zones=2 hops=63+4403 walks=8/8+10/10 swim=fail 7d=0/0/0` |
| lockgate | `fail L=55.86/55.73 weir=49 gate=13.1 routes=2/2 zones=2 hops=62+3893 walks=8/8+8/8 swim=fail 7d=0/0/14 FAIL=7` | `ok L=55.86/55.73 weir=49 gate=13.1 routes=2/2 zones=2 hops=62+3893 walks=8/8+8/8 swim=fail 7d=0/0/0` |

Lockgate's baseline failed only because Codex's uncommitted checker change (kept: it is right) narrowed the 20 m #7d
allowance to moves the field really models; 14 swim-jumps off the Pond deck then counted against the 10 m bar. They are
now a tolerated class (below). `MAP=all`: the full-physics baseline was stopped after two stages (it holds the one local
Electron for about an hour); the summary run at the end is quick mode (PHYS=0 CARRY=0 SHOTS=0), see §4.

## 1. What was done, rule by rule (the lead's nine rulings)

**Step 1 — Codex's uncommitted edits (7 files, ~3,900 lines) reviewed and committed in four pieces, all kept:**
16ef7101 the field's `gapClasses`; c832c513 the checker (1.5× reach clause, declared entrances, the free-zone walk,
class counts, the narrowed 20 m allowance); f14f9e37 Halyard's data and three Bazookarp-only gangways; bd156219
Lockgate's pieces, data and bake. The two `hopVeto` lists (885 / 457 entries: one 30 KB line and one number per line)
were reformatted to four entries a row, numbers unchanged. Then fixed in my own commits: Codex's free-zone walk had
dropped the run-up and the crossing from *every* entrance walk (ruling 8 only covers landings inside a zone) — restored;
the per-class L table ran 14 Dijkstras at every match start — now on demand; a debug filter limited to one Halyard box —
removed. **Found and fixed a base-layout change:** Codex's dfd50f69 had widened Halyard's fuel-dock gangway for every mode;
the base piece is back (`notIn: 'bazookarp'`), the wide one Bazookarp-only. `karp-layout-diff` against the branch point:
Turf / Zones / Tower / Boss build byte-identical on every stage.

| ruling | what it is now |
|---|---|
| 1 nodes absolute, edges by class | every #7d row of both stages is in a class with one outcome (tables below) |
| 2 one rule per class, #16 the proof, > 50 % vetoed = wrong bounds | `gapClasses` (Codex) + `carrierField.tolerate` (new, same box shape); #16 FAILs a class losing > half |
| 3 L protected | the field measures Pond → Gate **and spawn → Pond** (new) per class, cumulatively; #16 FAILs a modelled class, #7 a tolerated one, past 10 % of L; the driver prints the table under RESULT. No class moved either route by even 0.01 m |
| 4 the 1.5× reach clause | Codex's, kept |
| 5 no modelled move over 20 m | no modelled or tolerated move is longer than 11.15 m; the spawn north-edge crossings (gains to 24.1 m) are blocked, not split |
| 6 the west cluster blocked, roofs first | the trailer and the mast rack get off-limits tops (new placement flag `roofCols`), a timber hoarding closes the alley for the vaults; pictured |
| 7 declared entrances | Halyard `entrances: 5`, Lockgate `entrances: 5`; both stages, both teams: 5 / 5, all seen (§7) |
| 8 entrance walk from the zone boundary | done properly now (nearest carrier node outside every zone, ≤ 6 m); Halyard's four spawn-deck walks pass |
| 9 vetoes, then #7 re-run | Codex's 885 / 457 vetoes kept; every run since: 0 edges not made |

### Halyard: the class table at the first report (Alpha's half; every class mirrored; the final one is in §7)

L = Pond → Gate 55.43 / 55.30, spawn → Pond 69.42 / 70.84 (teams 0 / 1); 10 % of L = 5.54 / 5.53 m.

| class | outcome | generated / kept / vetoed (or moves) | longest | Pond → Gate before → after | spawn → Pond before → after |
|---|---|---|---|---|---|
| Long Pier mid-edge hop | model (hop) | 16 / 8 / 8 | 7.17 m | 55.43/55.30 → same | 69.42/70.84 → same |
| Long Pier south transfer gangway | model (one-way gangway) | 6 / 6 / 0 | 7.34 m | same | same |
| mid transfer / north risers / south risers gangways | modelled by geometry: Codex's three physical gangways give nav walk edges, the classes had 0 candidates and were deleted | – | – | same | same |
| south spawn swim crossing | deleted: 0 candidates once the access pontoon is gone | – | – | same | same |
| houseboat sun deck → fuel dock (kid, over the porch rail) | tolerate | 6 moves | 6.02 m | same | same |
| boatyard edge swim → yard walkway | tolerate | 2 | 7.81 m | same | same |
| Long Pier plank head swim → car-deck apron | tolerate | 8 | 9.27 m | same | same |
| over the ferry bulwark onto the car-deck apron (locker roof, gangway head, side corridor) | tolerate | 22 | 6.5 m | same | same |
| pontoon gangway foot → fuel dock (kid, rising) | tolerate | 8 | 5.15 m | same | same |
| loading deck swim → fuel dock (outside the ring) | tolerate | 4 | 11.15 m | same | same |
| tug alley: vaults over the drums (gains 10.1 / 28.7 / 32.1 m) | **block**: 2.4 m boarded hoarding, off-limits top (`karp-yard-hoarding`) | 3 rows gone | 3.2 m | same | same |
| tug alley: hops onto the dinghy trailer (37.7–39.2 m) | **block**: roof rule, trailer `roofCols` | 6 gone | 2.7 m | same | same |
| yard edge: hops onto the mast rack (10.8 m) | **block**: roof rule, rack `roofCols` | 4 gone | 2.1 m | same | same |
| Gate-side access pontoon: swim / kid rises onto the Gate apron (14.8–24.1 m) | **block**: the pontoon and its gangway not built in Bazookarp (the quay returns already stood on its gangway's landing: a dead end inside the ring) | 39 gone | 9.1 m | same | same |
| Long Pier root → that pontoon, swim drop into the ring, unseen (13.7–16.6 m) | **block**: same removal | 7 gone | 8.1 m | same | same |

### Halyard: the entrance table at the first report (team 0 / team 1; the final one is in §7)

| # | entrance | how | seen | outcome |
|---|---|---|---|---|
| 1 | main street, fuel dock from the weir (-3.9, 42.3) / (4, -42.3) | walk, jumps | plain yes; a swim landing at (∓4.5, ±43.5) from the slip plank / yard edge is **unseen** | declared; the swim-jump onto it still to block — **open** |
| 2 | east spine pontoon (8.7, 41.8) / (-9.1, -41.7) | walk, gaps | yes | declared |
| 3 | loading-deck ramp (-11, 45.4) / (11, -45.4) | walk | yes | declared |
| 4 | spawn-deck side walk (-6.4, 66.3) / (6.4, -66.3) | walk (from the zone boundary) | yes | declared, walked |
| 5 | spawn-deck drop (6.5, 68) / (-6.5, -68) | drop | yes | declared |
| 6 | LADY GREY's deck (15.8, 49.2) / (-15.8, -49.2) | walk + gaps off a moored yacht | yes | undeclared; team 1's walk falls in the water — **open** (block: the berth's colliders as off-limits tops) |
| 7 | MORWENNA's deck → fuel dock (3.5, 41.5) / (-3.5, -43) | kid long gap | yes | undeclared — **open** (block the same way) |
| 8 | loading deck → quay (-4.1, 49.9) / (4.1, -49.9) | kid long gap via a boat | yes | undeclared — **open** |
| 9 | slip plank swim (team 1 only: 3.5, -43.5; team 0's merges into #1) | swim-jump | **no** | undeclared — **open** (same fix as #1) |
| – | the access pontoon (team 1: -12.1, -52.1, 10 moves, unseen) | swim / kid | no | **blocked** (removed) |

### Lockgate: classes and entrances

L 55.86 / 55.73, spawn → Pond 69.38 / 69.97. Two tolerated classes, nothing modelled, nothing blocked by me:
`Pond deck corner swim-jump to the towpath` (12 moves, ≤ 10.2 m) and `towpath swim-vault onto the bridge stair`
(2 moves, 3.6 m); neither moves either route at all. Entrances: 5 / 5 against `entrances: 5`, all seen, all walked
(8/8 + 8/8). Codex's pieces are unchanged: the 15 m Pond deck, the spawn leap barrier and catch apron, the lock catch
deck, the stables 2 m east, the pound boats and the weigh house's Bazookarp copy removed; the bake is fresh (#12 OK).

**"swim=fail"** in the RESULT line is the checker's `KARP_SWIM` mode: moves only the carrier swimming in its own ink makes
(swim-jumps, swum squid tubes) are judged as hard #7 finds, like the kid's. It is the default (`CK.swim`) and what the
lead's D34 asks us to build against; `KARP_SWIM=warn` would list them as WARNs. It does not mean anything failed.
**#9's WARN** is advisory: it lists plateaus (raised floor ≥ 1.4 m up) that the enemy reaches much later than the owner
("enemy 11.6 s vs owner 0 s": the perches round the spawn) or that have a single entrance (dead-end perches: the lock
walkways, the stables' loft). #9 FAILs only a climb-only plateau outside its owner's zone or an unsigned zone entrance:
"49 plateaus (2 climb-only for the enemy, all covered); 4 zones, 10 entrances, all signed".

## 2. Decisions where the rulings left a gap
- **Tolerate is weighed, not waived.** A tolerated class's moves go into the graph as extra one-way edges (cost: flat +
  rise + half the drop, as the field's gaps), cumulatively after the modelled classes, both routes for both teams.
- **spawn → Pond** is read from the carrier-valid floor within (spawn barrier + 3 m) of the team's own pad, plus the
  distance to the pad: the spawn zone itself holds no carrier node.
- **Removing a piece is a block.** The access pontoon's removal (Bazookarp only) is the cleanest block: the quay returns
  had made it a dead end. The alley hoarding follows the Zone Control / Tower precedent (they moved the trailer out of
  that alley for the same dead-end reason).
- **The stage card** (`mapThumb.js`) now leaves Bazookarp-only pieces out (SPEC #13: unchanged cards); halyard and
  lockgate cards are back to the branch point's. **This also takes caldera's Bazookarp-only pieces off caldera's card**
  (karp-layout-diff: caldera thumbDay / thumbSunset differ from the branch point) — the integrator should know.
- `WATCHDOG` was raised above 900000 only for the multi-stage runs (MAP=all, the four-match PLAN run), which cannot finish
  in 15 minutes; every single-stage page run used 900000.
- I did not push to `botlab-b5-karp-ref` (your instruction: push only `b5-karp-ref`), so nothing went to the Mac mini.

## 3. Online, bots
No new records or wire traffic: the field, the checker and the layouts only. `roofCols` is a build-time prop flag (both
clients build the same colliders). Bots: no new hooks; they use the same field.

**Bot matches (karp-match.cjs, normal):**

| stage | result | ko | counts | pops | carries | stuck > 5 s |
|---|---|---|---|---|---|---|
| halyard 1 | A, stopped (OT held) | – | 3 / 43 | 18 / 9 | 27 | 0 (carrier 1.75 s max) |
| halyard 2 | A, knockout | 69.1 s | 0 / 100 | 2 / 3 | 5 | 0 (carrier 2.25 s) |
| lockgate 1 | A, knockout | 139.2 s | 0 / 88 | 13 / 6 | 19 | 0 |
| lockgate 2 | B, knockout | 153.4 s | 100 / 0 | 5 / 12 | 17 | **1**: a bucket bot in refill mode, 5.25 s (issue log) / 7 s (harness) at (-9.5, -25.4) |
| lockgate 3 (re-run, DIAG=1) | A, knockout | 71.7 s | 0 / 100 | 5 / 1 | 6 | 0 |
| lockgate 4 (re-run, DIAG=1) | B, time | – | 26 / 22 | 12 / 14 | 26 | 0 |

No console errors, no clamp rejections, no carrier-retreat fallbacks. Two knockouts before 1:15 (halyard 69 s, lockgate
72 s) — the §9.1 early-knockout target is the lead's balance pass, but six matches show it twice.

## 4. Tests and pictures
- `bazookarp-check.cjs`: the lines above (JSON in `out/<id>-karp.json`). check-maps: `halyard.bazookarp`, `lockgate`,
  `lockgate.bazookarp` ok; `halyard` (base) has one issue, `half[41] ramp is 25.7° (max 24)` — the base tug ramp, the
  same at the branch point (not ours, not changed: the base must not change).
- `karp-layout-diff.mjs` vs the branch point 8082e99a: 94/96 same; the two left are caldera's cards (§2).
- `MAP=all` quick summary (PHYS=0 CARRY=0 SHOTS=0, so #11 / #16 SKIP and no RESULT can be ok in this mode): the eleven
  stages without a layout fail as before (placeholders); halyard `FAIL=7,12`, lockgate `FAIL=7`. Lockgate's quick-mode #7
  was the declared-entrance comparison counting 4 graph entrances against 5 declared without the kid's physical moves;
  fixed (with PHYS=0 only *more* entrances than declared fail) and re-run: lockgate quick `7d=0/0/0 SKIP=11,16`, #7 OK.
  The full lines:

```
RESULT tidewater fail L=57.02/55.45 weir=100 gate=18.3 routes=0/2 zones=1 hops=6+108 swim=fail 7d=57/13/0 FAIL=2,3,4,5,7,12,15 SKIP=11,16
RESULT kelpline fail L=51.96/51.95 weir=50 gate=20 routes=2/2 zones=1 hops=40+1674 swim=fail 7d=12/0/0 FAIL=3,5,6,7,9,12,15 SKIP=11,16
RESULT halyard fail L=55.43/55.3 weir=48 gate=12.2 routes=2/2 zones=2 hops=65+4537 swim=fail 7d=0/0/0 FAIL=7,12 SKIP=11,16
RESULT saltpan fail L=83.48/81.06 weir=50 gate=8.5 routes=2/2 zones=1 hops=91+186 swim=fail 7d=47/0/0 FAIL=2,7,8,9,12,13,15 SKIP=11,16
RESULT crossmarket fail L=65.13/65.4 weir=49 gate=8.4 routes=1/2 zones=1 hops=0+173 swim=fail 7d=0/0/0 FAIL=5,8,9,12,13,14,15 SKIP=11,16
RESULT lockgate fail L=55.86/55.73 weir=49 gate=13.1 routes=2/2 zones=2 hops=62+3893 swim=fail 7d=0/0/0 FAIL=7 SKIP=11,16   (before the PHYS=0 fix)
RESULT terraces fail L=66.01/61.2 weir=48 gate=8 routes=2/2 zones=1 hops=145+641 swim=fail 7d=10/0/0 FAIL=2,7,8,9,12,13,15 SKIP=11,16
RESULT nantai fail L=72.85/72.99 weir=50 gate=8.5 routes=2/2 zones=1 hops=99+323 swim=fail 7d=18/0/0 FAIL=7,8,9,12,13,15 SKIP=11,16
RESULT craters fail L=69.39/69.26 weir=50 gate=8.5 routes=2/2 zones=1 hops=317+1376 swim=fail 7d=40/0/0 FAIL=7,8,9,12,13,15 SKIP=11,16
RESULT calamari fail L=64.82/64.82 weir=48 gate=8.4 routes=2/2 zones=1 hops=74+239 swim=fail 7d=4/0/0 FAIL=7,8,9,12,13 SKIP=11,16
RESULT spirhalite fail L=80.25/79.54 weir=50 gate=8.2 routes=2/2 zones=1 hops=84+622 swim=fail 7d=16/0/0 FAIL=5,7,8,12,13,14,15 SKIP=11,16
RESULT treehills fail L=70.93/70.48 weir=52 gate=8.2 routes=2/2 zones=1 hops=197+200 swim=fail 7d=16/0/0 FAIL=7,8,9,12,13,15 SKIP=11,16
RESULT cargo fail L=51.96/51.95 weir=50 gate=20 routes=2/2 zones=1 hops=40+1674 swim=fail 7d=12/0/0 FAIL=3,5,6,7,9,12,15 SKIP=11,16
```
- Pictures (`out/`, JPEG < 300 KB, looked at): `halyard-gate-ring-aerial`, `-gate-ring-east` (the access pontoon gone),
  `-gate-ring-main-swim` (the open swim landing), `-gate-approach`, `-gate-deck`, `-gangway-north`,
  `-gangway-mid-transfer`, `-barrier-yard-hoarding` (with the off-limits trailer), `-roof-mastrack`, `-pond`,
  `-pond-aerial`, `-karp-top`, `-flag-1…5`; `lockgate-gate-ring-aerial`, `-gate-approach`, `-gate-deck`,
  `-barrier-spawn-leap`, `-catch-apron`, `-lock-catch-deck`, `-pond`, `-pond-aerial`, `-karp-top`, the weirs and zones.

## 5. Commits and shared files
16ef7101, c832c513, f14f9e37, bd156219 (Codex's work), 13292626, 0fbdff4b, 8a86f040, 2247ceae (scratch pictures), plus
this report. Shared files: `src/game/karpField.js` (gapClasses, routeLengths / classLengths), `src/world/props.js`
(`roofCols`, one line, `[b5-karp-ref]`), `src/world/mapThumb.js` (Bazookarp-only pieces off the card, `[b5-karp-ref]`),
`src/world/maps.js` (Halyard: Bazookarp-only pieces, the base gangway restored), `props-marina-slice.js` /
`props-marina-vessels.js` (Bazookarp-only copies), `tools/botlab/karp-check-page.js`, `bazookarp-check.cjs`. The rulings
are in `tools/botlab/jobs/batch5/karp-stages/BUILDER.md` (the brief named `tools/botlab/karp-stages/BUILDER.md`, which
does not exist) and `docs/BAZOOKARP.md`.

## 6. Unfinished, uncertain
- Nothing the lead listed is open. Notes for the integrator / the balance pass:
- **Early knockouts** (input to the balance pass): of the bot matches here, halyard 63.6 s and 69.1 s, lockgate 71.7 s.
- **Lockgate's 5.25 s stuck bot** at the refill point: a known beta round 2 item (the lead's ruling), not a gate.
- **The stage-card change** (`mapThumb.js`): Bazookarp-only pieces are left off every card; caldera's card loses its
  Bazookarp-only pieces against the branch point (accepted by the lead; for the integrator).
- The base `halyard` check-maps line (`half[41] ramp is 25.7°`, the tug ramp) is pre-existing and stays (the lead's ruling).
- `size-budget.js` was not run for the new `halyard.bazookarp` bake (249 KB PNG, 878/2048 rows; lockgate's is in the tree
  already).
- Codex's mid-transfer gangway (a steel ramp onto a lifejacket locker's roof) works but is a design choice to revisit;
  the spine pontoon's float dressing shows a join where the removed access pontoon was (minor).
- `MAP=all` with full physics was not run (an hour of the shared Electron); the quick summary is in §4.

## 7. The Halyard finish (the lead's 90 minutes, 2026-10-26)

**Final:** `RESULT halyard ok L=55.43/55.3 weir=48 gate=12.2 routes=2/2 zones=2 hops=63+4403 walks=8/8+10/10 swim=fail 7d=0/0/0`
(all 16 checks, #9 WARN only; #12 `lightmap halyard.bazookarp fresh`). Lockgate re-run at the same code:
`RESULT lockgate ok L=55.86/55.73 weir=49 gate=13.1 routes=2/2 zones=2 hops=62+3893 walks=8/8+8/8 swim=fail 7d=0/0/0`.
check-maps: `halyard.bazookarp 216 pieces ok`; base `halyard` unchanged (its one pre-existing tug-ramp line);
karp-layout-diff vs the branch point: Turf / Zones / Tower / Boss byte-identical on every stage (94/96; the two are
caldera's cards).

**The blocks (Bazookarp only, each pictured):**
- **LADY GREY and MORWENNA** (moored inside the ring) are Bazookarp copies with off-limits tops — the yacht props' own
  `col: 'roof'` (no ink, a kid slides off); the base berths get `notIn: 'bazookarp'`. Closes entrances 6 and 7 and the
  #16 walk that fell off LADY GREY's stern. (`out/halyard-roof-lady-grey-morwenna.jpg`)
- **The loading-deck → quay long gap** used no boat: #16's trace (`PROBE`) shows the kid running off the loading deck's
  south-west corner, south of the deck ramp, down onto the fuel dock. Closed by the **fuel-dock spill screen**: a 2.4 m
  boarded timber screen with an off-limits top on the fuel dock's channel edge, two lengths either side of the deck ramp
  (z −52.4…−48.4 and −44.4…−38.5 on Alpha's half). The northern length also removes **the slip-plank / yard-edge
  swim-jump landing on #1** for both teams (unseen from the deck; a separate entrance only on team 1 because team 0's
  copy merged into #1). I walled the landing rather than removing the plank: the plank's removal alone left the same
  swim-jump from the yard's edge beside it. The ice chest that stood on that edge goes in Bazookarp, so the Gate's
  route 2 keeps its 3 m from route 1 (it ran 1.87× route 1 without that). (`out/halyard-barrier-fuel-screen.jpg`)
- **A 1.3 m timber parapet on the loading deck's channel edge** (top 2.6 m over the yard): with the screen in, a
  swim-jump from the yard's edge across the channel's corner up onto the deck showed as a sixth entrance; gone.
  (`out/halyard-barrier-deck-parapet.jpg`)
- From the first report: the tug-alley hoarding, the off-limits trailer and mast rack, the access pontoon removed.

**Final class table** (L = Pond → Gate 55.43 / 55.30, spawn → Pond 69.42 / 70.84; no class moves either by 0.01 m):

| class | outcome | generated / kept / vetoed (or moves) | longest | Pond → Gate | spawn → Pond |
|---|---|---|---|---|---|
| Long Pier mid-edge hop | model (hop) | 16 / 8 / 8 | 7.17 m | unchanged | unchanged |
| Long Pier south transfer gangway | model (one-way gangway) | 6 / 6 / 0 | 7.34 m | unchanged | unchanged |
| houseboat sun deck → fuel dock | tolerate | 14 moves | 6.87 m | unchanged | unchanged |
| boatyard edge swim → yard walkway | tolerate | 2 | 7.81 m | unchanged | unchanged |
| Long Pier plank head swim → car-deck apron | tolerate | 10 | 9.27 m | unchanged | unchanged |
| over the ferry bulwark onto the car-deck apron | tolerate | 22 | 6.5 m | unchanged | unchanged |
| Long Pier → visitor spine past LADY GREY (new: LADY GREY's deck had carried it) | tolerate | 48 | 10.85 m | unchanged | unchanged |
| tug alley vaults / trailer hops / mast rack hops | block (hoarding, roof tops) | 13 rows gone | 3.2 m | unchanged | unchanged |
| access pontoon swims and rises (gain to 24.1 m) | block (pontoon removed) | 46 rows gone | 9.1 m | unchanged | unchanged |
| yacht decks, loading-deck corner, plank / yard-edge swim, yard → deck swim (the ring) | block (roof tops, screen, parapet) | entrances 6–9 + the #1 landing gone | – | unchanged | unchanged |

Deleted as dead data: the 'pontoon gangway foot → fuel dock' tolerate class (its moves were off MORWENNA's deck) and
'loading deck swim → fuel dock' (closed by the screen); a trial 'visitor pontoon west gangway' class generated nothing
(the gangway lies under the move, the class generator wants open air) and was replaced by the tolerated class above.

**Final entrance table (both teams identical, mirrored; all seen from the spawn deck, all walked by #16):**

| # | entrance | team 0 at | team 1 at | how |
|---|---|---|---|---|
| 1 | main street, the fuel dock from the weir | (-1.5, 39.4) | (1.5, -39.4) | walk |
| 2 | the visitor spine pontoon | (11.2, 43.1) | (-11.2, -43.1) | walk, gaps, a long gap (the tolerated Long Pier jumps land here) |
| 3 | the loading-deck ramp | (-11, 45.4) | (11, -45.4) | walk, climb |
| 4 | the spawn-deck side walk | (-6.4, 66.3) | (6.4, -66.3) | walk, proved from the free-zone boundary |
| 5 | the spawn-deck drop | (6.5, 68) | (-6.5, -68) | drop |
| – | LADY GREY's deck, MORWENNA → fuel dock, loading-deck corner, slip plank / yard-edge swim, yard → deck swim, the access pontoon | – | – | **blocked** |

**Bake:** `assets/lightmaps/halyard.bazookarp.{json,png}`, hash **592dc01** (29 s, 2048², 878 rows), on the final ring
geometry; #12 fresh.

**Matches at the final head (normal):**
- `RESULT karp halyard win=B reason=knockout ko=298.2 c=98/0 pops=10/20 carries=30 blasts=0 ot=no` — stuck > 5 s: 0, carrier stuck 0 s
- `RESULT karp halyard win=B reason=knockout ko=63.6 c=91/0 pops=3/5 carries=8 blasts=0 ot=no` — stuck > 5 s: 0, carrier stuck 0 s

No console errors (the missing-lightmap warning is gone). The 63.6 s knockout is another early one for the balance pass.

**BUILDER.md refined:** the boats-and-props rule now names the fixes used (a prop's own off-limits collider option, e.g.
the yachts' `col: 'roof'`, before `roofCols`), "trace a find before you block it" (the loading-deck long gap used no
boat), and "check a block against the routes it crosses" (the screen pushed route 2 off the dock edge until the ice
chest went).
