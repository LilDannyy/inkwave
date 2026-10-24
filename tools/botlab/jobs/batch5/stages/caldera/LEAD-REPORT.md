# Highmark Foundry: the lava engine — fix round 7 (after review 7)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera, from a70b91a6 + the lead's notes 2dfaf219.
The "After review 7" list was done in its order: the roof slide (engine fix, the probe as audit rule 47), rule 44's march
with air steering and then the crown closed by geometry, the Mitts leap, the carrier list, then the proofs (net-lava and
the regressions on the Mac mini). Local runs one Electron of mine at a time under the shared SLOTS=3 lock
(BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000; the load here was 3.4–54 (another builder). **The final code is
24549489** (karpVeto; the code before it, c29fd5b9, is what JOB-9 ran). Mac mini: JOB-9 at 1ef49940 (code c29fd5b9), JOB-10
at 6153c5f7 (code 24549489) — see §4.

## 1. What was built, item by item

### 1. Roof tops never slide a kid into the lava — the engine fix (ecb52b26)

- **actor.js** (tagged [b5-caldera], ~30 lines): `_roofExitDist` now asks `_roofLandWet` before it accepts a way off: the
  kid's fall from the way's exit at the slide's speed there (√(w² + 28 s): the push w now plus 14 m/s² over the s metres to
  the exit) and at a run's (6.5 m/s), every 0.15 m the floor under its footprint (the max of the centre and four points at
  the 0.24 m foot radius — a seam the feet span is no gap), in the air the slow arc's height, from where it lands the floor,
  out to 0.6 m past where the fast arc lands, each tested with `G.match.stage.wet(x, z, gy, 0)`. A way whose landing the
  lava takes is no way off (`_rxHz` set). **Every way refused → `_roofHold`**: no slide, the landing's speed zeroed, the
  kid walks off by itself (no jump from a roof, as before); re-checked every 0.25 s like the old stall rule. On a stage with
  a `wet` hook the slide **owns the move** along the way it checked (`roofHz`: at its push speed or a run's along it,
  nothing across it). Stages without a `wet` hook: byte-for-byte the old behaviour (`_roofLandWet` returns at once).
- **Why the third part**: with the refusal alone (run roofslide-a) deaths fell 460 → 112; with the hold and no wall shortcut
  in the landing march 112 → 8 (roofslide-b); the last 8 were the ladle stand: a kid landing with a sideways drift (its
  jump's) slid along the checked line but 0.46 m off it, past the end of a 0.5 m coping into the lake. With the slide owning
  the move: 0 (roofslide-c). A wall test in the landing march was dropped too: a ray at 0.5 m over the arc hit a pipe (or a
  prop) the body passes beside and called the way safe — the march is now conservative (it may refuse a way the kid would
  survive; the worst case is a hold).
- **lava-audit rule 47** = the reviewer's probe-roofslide7b (every flat roof block with lava within 3 m that a kid can hop
  onto from floor 0.4–1.7 m below: 16 sides × 3 lateral offsets × 2 run-ups, hop on, then idle or steer back 2.5 s): **0
  deaths in 3,908 landings at LOW and 4,572 at HIGH, 0 kids held** (100 / 118 roof blocks near the lava, 36 / 40 reachable).
  On the old actor.js the same rule reads **176 / 284 deaths** — review 7's numbers exactly (race 3's boulder 42/50, the
  stub 30/64). ENGINE.md gains rule 47; STAGE-MODS.md lists the new `wet` caller.
- **probe-stub7** (the reviewer's, hopping onto the stub from the lookout top): 0 deaths in 24 landings a level and half
  (was 18 of 24).

### 2. Rule 44 with air steering, then the crown closed (1fa00557, c29fd5b9)

- **The check first.** lava-audit rule 44 now flies, from **every rider-top node** (the Organs, the stones) and 16 headings
  whatever lies past the edge, running jumps with the stick turned **0 / ±45 / ±90° 8 frames after the jump** (the first
  run-up of 2.6 / 1.5 / 0.8 m that fits, the most-saving steer counts), and **the Organ tops finer**, as probe-crown7c: every
  point of a 0.3 m grid 0.25–1.15 m in from the rim (not in a part), every 7.5° that leaves the top within 1.2 m, run-ups
  0.8 / 1.5 / 2.6 m. A steered crossing has **over 0.35 m where the kid's whole footprint is over lava**, then comes down
  alive past it, not on its own rider. These go **into the gate** with the straight running jumps. Flights over lava only
  where the feet span it (the notch's 0.15–0.2 m seams) are listed as **seam flights**, no gate. Iteration switches:
  `r44=steer`, `lv=high`, `fine=<m>,<deg>`, `sf=<frames,...>`.
- **It reproduces review 7** at fix round 6's crown (audit44-b): Organ L's HIGH top onto the causeway **16.89 m** (from
  (−8.5, 4.65, −11.9) heading 45°, steered −90° — review 7's 16.92 on the twin), **26 crossings over 15 m**, 0 over 20.
- **The review's pipes were not enough.** One pipe a quarter of the way from the north flat on each of the north-east and
  north-west edges (audit44-crownA): 14.32 m with the steer at 8 frames — but with the steer at 6 / 8 / 10 frames
  (audit44-sf) **16.12 m** (through the 0.45 m left by the corner, steered at 10 frames). So **both edges are crowned whole**
  like the others (stage lava.js `CROWN`: `full()` on all five lake-and-island edges, 4 pipes an edge, 0.51 m clear): only
  the north flat (the climb from B) is open. **Still 14 pipes a lookout** (the quarter pipes' count), **64 rider parts** =
  `LAVA.maxParts` (all used; ENGINE R30 updated).
- **After** (audit44-crownD, HIGH, steer at 6 / 8 / 10 frames): **no steered running jump off Organ L at all**; the steered
  largest is 14.15 m (race 7's straight one from fix round 6). **Finer** (audit44-fine: 0.15 m grid, 3.75°, 1,214 Organ-top
  points): the same — none off Organ L, the largest 14.15 m.
- **Rule 25** (rule 25's crown screen picked its "open side" as the largest angular step between pipes; with both flats now
  a 60° step it could pick the stub's flat — it now takes the step the stub does not stand in): **crown 65 % open**, widest
  gap 0.52 m (≤ 0.62), pipes 0.26 m, ≥ 2.0 m; cover 7 %, 1.0 m, 5 open sides — pass.
- **The full audit at the final geometry** (audit-full-b, `full=1`): **46/47 — only rule 42** (far scenery, art phase).
  Rule 44's gate: **largest 14.74 m, none over 15** (numbers in §4). The 14.74 m is new and is a seam flight by the straight
  march's centre-line count: off Organ B's HIGH top toward L, the kid meets the closed north-east crown and drops onto the
  island's coping past the 0.2 m seams — a kid walks it (off B's island side, ~4 m). DESIGN §3.5 has the table.
- **The 17–18 m flights review 7 discounted by hand** still show in its centre-line probe-crown7c at the final crown
  (HIGH max 17.75 / 17.8 m, every one landing on the island, the socket collar, the coping or the organ stump with a
  centre-line lava run ≤ 1.0 m; **none reaches the causeway or race 1 any more**). probe-dropnotch shows what they are: at
  HIGH a kid **walks** off the lookout's north flat onto B (3.1 m) and off B onto the island / collar / coping / stump / A
  in 20 of 24 headings (the 4 dead are B's lake side) — the "gain" is the nav's missing drop links, not lava.

### 3. The Mitts leap — decided and written (66403fac, c29fd5b9)

- **The lead's decision, written into DESIGN §3.5 and the audit's information rows**: a leap over the lava is skill
  movement like a swim jump (listed, no gate); never off a roof top; a bot's leap obeys its 2 s look-ahead.
- **No leap off a roof**: actor.js computes `onRoof` before the kit's jump hook and does not ask the kit on a roof (the roof
  gate holds for any kit's jump); mitts.js `startCharge` refuses on a roof (a bot's `botLeap` goes through it too) and a
  charge on a roof is dropped. Wall cling / let-go is untouched (not grounded).
- **A bot's leap flies as planned**: bots.js — while `runner.kit.leaping` is airborne the stick holds along the leap and
  the air guard never steers it. Its landing already passed `landingOk` (dry now and in 2 s, and 0.8–2.4 m on along its
  line) at the release (`botReleaseOk`).
- **lava-leap.js** (new page test): **A** fire + jump on the stub and on race 3's boulder at HIGH: no charge, no jump while
  on the roof (9 frames each); on the lookout's own top the same press charges (control). **B** a Mitts bot leaps from the
  causeway (−4.65, 1.2, −15.5) over 13 m of lava to (−17.85, 1.3, −17.49) with an enemy 4 m behind it: every one of 55
  frames in the air its stick holds along the leap (min dot 1.0), not slid, it lands alive 0.38 m from the plan, LOW and
  HIGH. **On the old code: A and B fail** (charges on both roofs; the stick wanders, min dot −1).
- **Rule 44 (information) lists the leaps**: from every edge of the march at half and full charge, aim level, by the kit's
  own `predictLeap`: LOW 2,201 crossings (702 over 20 m, max 57.9), HIGH 2,693 (441, 43.3).

### 4. The carrier crossing list — merged, a lower bound (1ef49940)

`karp-stages/caldera-carrier-crossings.json` now merges lava-audit's carrier row with review 6's probe-carry44 run over
review 6's candidate set (805 LOW / 362 HIGH) and review 7's rebuild (242 / 279), all at the fix-round-7 geometry:
**LOW 133 crossings, 87 over 20 m, max 55.9 m; HIGH 144, 87 over 20 m, max 40.6 m** (the audit's row alone: 75 / 53 / 55.9
and 79 / 46 / 37.1; the probe alone: 128 / 84 / 52.0 and 126 / 75 / 40.6). Deduplicated by take-off (0.1 m) and heading
(22.5°), each entry with its `src`. Its `about` says it is **a lower bound that checker #7d must extend by probing the
Bazookarp layout itself**, and that a carrier makes no dash jump and no Mitts leap. DESIGN §3.5 says so too. Every rule-44
crossing of the final geometry: `stages/caldera/out/fix7/rule44-crossings.json`.

### 5. The proofs (JOB-9, JOB-10; local runs)

In §4. JOB-9 found two things, both handled: **lava-karp K8** — the crown's closed edges moved Organ L's top nodes and the
carrier field gained 4 gap pairs over the notch (24549489 pastes them into KARP_VETO; 10/10 locally), and **one boss-check
of five stood still 46 s** (§6).

## 2. Decisions where the list left a gap

- **The slide owns the move on a stage with a hazard** (not just the refusal the review proposed): needed for 0 deaths (a
  landing's sideways drift and a steer across the slide threw kids off narrow copings). On Highmark a kid on cover cannot
  steer across its slide (0.1–0.3 s on a cover piece); other stages unchanged.
- **The hold** zeroes the landing's horizontal speed once and then lets the kid walk; it never happened in 8,480 audit
  landings (every reachable roof beside the lava has a safe way), so it is a backstop.
- **The landing march is conservative**: two speeds bound the landing, the footprint's floors count, no wall shortcut.
- **Steered crossings and seam flights use the footprint** (over 0.35 m with the whole 0.24 m footprint over lava); the
  straight march keeps its centre-line count (comparable with fix round 6), which is why B's 14.74 m seam flight is in the
  gate.
- **The crown: whole north-east and north-west edges** instead of one pipe a quarter of the way (the quarter pipe failed at
  a 10-frame steer, 16.1 m). The lookout is now screened on every side but the north flat (65 % open); the north flat stays
  the climb and the way down to B.
- **Leaps listed by the kit's own predictor** (`predictLeap`, the arc the preview ring shows), not stepped physics, at half
  and full charge with the aim level; a leap landing on a roof (e.g. a ladle stand) is counted as it comes down.
- **Bots hold the stick along a kit leap** (more than "the air guard must not steer it": the brain's own fight steering bent
  the leap too, minDot −1 on the old code).
- **The carrier list's dedupe key** (0.1 m take-off, 22.5° heading) and its max gain over the searches.

## 3. Online behaviour and bots

- **Online.** Nothing new is recorded. The roof slide runs where the actor is simulated (the owner: a player's own screen,
  the host for bots); its hazard test reads the lava's level from the synced clock (`covers`), the same on every screen.
  The crown's pipes are rider parts like before (pure functions of the synced clock, un-inked). The Mitts gate is the
  owner's (the kit's jump hook, `startCharge`); bot leaps are the host's. **net-lava.cjs 13/13 on the Mac mini at the code
  JOB-9 ran** (at the results screen the lava cells agree 0.99905, the same run's other cells 0.99809; the late joiner's
  grid and the live guest's lava cells equal the host's, its other cells ≥ 0.999), and in JOB-10 at the final head (§4).
- **Bots**: the kit-leap hold in bots.js (above). Bots never hop onto cover; lava-bots 7/7 with 0 lava deaths in 360
  bot-trials locally and on the Mac mini; both Zone Control matches there 0 lava deaths, the lookouts used 56.8 / 101.3 s.

## 4. Tests, pictures, balance

**Local** (one Electron of mine at a time; load 3.4–54):

| test | result |
|---|---|
| probe-roofslide7b (the reviewer's) | old code 460 deaths in 8,472 landings → refusal 112 → hold, no wall shortcut 8 → the slide owns the move **0** |
| lava-audit rules=47, with / without the actor.js change | **0 / 0** deaths (3,900 LOW, 4,564 HIGH landings) / **176 / 284** (review 7's) |
| lava-audit rule 44, steered, fix round 6's crown | reproduces review 7: Organ L → causeway **16.89 m**, 26 over 15 m |
| …the review's quarter pipes | 14.32 m (steer at 8 frames); **16.12 m** with steers at 6 / 8 / 10 frames |
| …the whole NE / NW edges (final) | steers 6 / 8 / 10: max **14.15 m**, none off Organ L; finer 0.15 m / 3.75°: the same |
| lava-audit `full=1` (all rules, final geometry) | **46/47**, only rule 42 (art phase). Rule 44 largest **14.74 m** (none over 15); rule 47 0/0; rule 25 crown 65 % open; rule 21 0 pinches in 27,978 fan walks; rule 14 worst 9.83 m; 45, 46, 22 pass |
| probe-crown7c (the reviewer's) at the final crown | no landing on the causeway or race 1; HIGH max 17.75 / 17.8 m, all onto the island / collar / coping / stump with centre-line lava ≤ 1.0 m (seam flights) |
| probe-dropnotch (mine) | HIGH: L's north flat walks down onto B; off B 20 of 24 headings alive on the island / collar / coping / stump / A |
| probe-stub7 (the reviewer's) | 0 deaths in 24 landings each level and half (was 18 / 24) |
| lava-leap.js, with / without the Mitts changes | **3/3** / 1/3 (A and B fail on the old code) |
| lava.js | 59/59 ×2 (F10 passed both) |
| lava-notch.js | 3/3; diagonals 0 gap deaths in 3,496 trials |
| probe-drop44 (review 6) | none over 15 m (LOW 14.03, HIGH 12.39) |
| lava-bots.js | **7/7, 0 lava deaths in 360 bot-trials** |
| Zone Control (lava-match) | 7/7 ×2, 0 lava deaths; Organ L used 119.8 and 94.7 s (both teams' long kits up: 34 / 85.8 s in the first) |
| boss-check | **14 runs** (4 plain, 10 with the idle spot recorded), **all 6/6**, the longest idle 10 s (the south-west Lakefront wedge, walked on) |
| lava-karp.js | 9/10 at c29fd5b9 (K8, as JOB-9) → **10/10** with the 4 vetoes |
| check-maps | all 8 caldera variants ok (1,795 pieces; bazookarp 1,857; boss 1,674) |
| carrier merge probe | LOW 128 carrier crossings (84 over 20 m, 52.0), HIGH 126 (75, 40.6) |

**Mac mini:**

| job @ head (code) | result |
|---|---|
| JOB-9 @ 1ef49940 (c29fd5b9) | check-maps 8/8 ok; lava-audit 45/46 (rule 42 only; rule 44, 47, 25, 21 pass); lava-leap 3/3; lava-notch 3/3; **lava-bots 7/7 (0 deaths in 360)**; **lava.js 59/59 ×2** (F10 passed both); **boss-check 6/6 ×4, 5/6 once (idle 46 s)**; **Zone Control 7/7 ×2** (0 lava deaths); lava-karp 9/10 (K8, fixed in 24549489); **net-lava 13/13** |
| JOB-10 @ 6153c5f7 (24549489, the final code) | **lava-karp 10/10** (K8: 0 crossings, 560 vetoes); **boss-check (with the idle spot recorded) 6/6 ×10**, the longest idle 8 s (spots in §6); **net-lava 13/13** (results screen: lava cells 0.99947, the same run's other cells 0.99875; the late joiner's grid and the live guest's lava cells equal the host's; the new host's fall at 55.01 s on both screens) |

**Pictures** (`stages/caldera/out/fix7/`, HIGH and LOW): `fix7-lookout-to-causeway-*`, `fix7-lookout-to-race1-*`,
`fix7-lookout-north-*` (the open north flat between the two closed edges), `fix7-crown-from-island-*`,
`fix7-crown-from-lake-*`, `fix7-crown-from-ne-*`, and `fix7-race3-boulder-high`. Looked at: the crown now rings the top
but for the north flat; from the north-east it reads as a cage round the lookout (the look call stays the lead's).

**Balance (informational)**: 0 lava deaths in this round's matches (4 Zone Control: 2 local, 2 Mac mini); Organ L's lookout
held 56.8–119.8 s a match.

## 5. Commits and shared files

Code: ecb52b26 (actor roof slide, rule 47), 1fa00557 (rule 44 steering, the crown), 66403fac (Mitts: roof gate, bot leap;
lava-leap.js), c29fd5b9 (rule 44 leaps; ENGINE), 24549489 (karpVeto), 8c5c9ba5 (STAGE-MODS). Scratch: 1ef49940 (JOB-9, the
carrier list, every crossing), bd0fa01a (pictures), 62549554 (DESIGN §3.5), 98eaf180 / 76492d5e / 21ea61f8 (JOB-9's results
merged), 6153c5f7 (JOB-10), 678bcc40 / 0b748030 (JOB-10's results, fast-forwarded), and this report. Pushed: only `fork botlab-b5-caldera` (fetched and merged first, never forced).

Shared files (all hunks tagged [b5-caldera]):
- `src/game/actor.js` — `update`: `onRoof` computed before the kit's jump hook, the hook not asked on a roof; `_roofSlide`:
  `_rxHz` / `roofHz`, the hold (`_roofHold`), the slide owning the move on a hazard stage; `_roofExitDist`: the landing
  refusal; new `_roofLandWet`, `_roofHold`.
- `src/game/bots.js` — the kit-leap hold before the air guard; the guard skips a kit leap.
- `src/game/kits/mitts.js` — `onRoof()`; `startCharge` refuses on a roof; a charge on a roof is dropped.
- `docs/STAGE-MODS.md` — `wet`'s new caller.
- Stage-own: `src/world/stages/caldera/{lava,karpVeto}.js`; tests `tools/botlab/tests/{lava-audit,lava-leap}.js`; docs
  `stages/caldera/{DESIGN,ENGINE}.md`, `karp-stages/caldera-carrier-crossings.json`.

## 6. Unfinished, flaky, uncertain

- **boss-check: one 46 s idle in JOB-9's five Mac-mini runs** (boss-4); 14 local runs never over 10 s. No trail came
  back. JOB-10 runs it ten times with the idle spot recorded (state, goal, path, wedge / detour / crossing, the
  distance to Organ L — the crown's closed edges are the one new obstacle near the boss's ground): **10 of 10 pass**, the
  longest idle 8 s. Every idle over 5 s this round (JOB-10's three, three local) stood in the old wedge logic (fix round 4's
  back-out, fix round 5's detour) at the south-west Lakefront (−20.0, −24.6; −18.6, −25.5), the causeway's south end
  (0.0, −25.2) and Bravo's ends (−2.2, 24.2; 2.7, 25.7) — 15–17 m from Organ L, none near the crown — and walked on within
  10 s. This round's boss tally:
  **28 of 29** (JOB-9 4/5, JOB-10 10/10, local 14/14); the 46 s one is unexplained and unreproduced. No boss code changed
  this round.
- **Rule 44's margin is thin**: the largest is 14.74 m (B's seam flight by the straight march's centre-line count), 0.26 m
  under 15. Every steered or straight crossing that actually crosses lava saves ≤ 14.15 m.
- **Review 7's centre-line probe still reads 17–18 m** off the lookout (onto the island past the notch); they are seam flights
  (the walk-off probe), the audit lists them, no gate. The reviewer may want to judge that reading.
- **The slide owns the move** on Highmark's roofs: no steering across a slide on cover (feel change, Highmark only).
- **`LAVA.maxParts` is full** (64/64): any new rider part needs the cap raised.
- **The crown's look**: a screen of pipes on five of six sides of the lookout (65 % open). Rule 42 and the lavafall's side
  patch: the art phase's, untouched.
- Leaps are listed from the kit's predictor, not stepped; carrier list a lower bound by design.
- The audit now takes ~6.5 min locally (was ~2.2: the steered Organ pass, 50,000 flights a level).
- net-lava was not run locally (load over 4 most of the session); the Mac mini runs are the proof.
