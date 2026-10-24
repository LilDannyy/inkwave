# Highmark Foundry: the lava engine — fix round 8 (after review 8)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera, from b8e755ef + the lead's notes b2eb0723.
The "After review 8" list was done in its order: the rescue (cover in drowned ground), the landing check with air braking
and the Tide Boards, rule 47 widened into the gate, rule 44's steered margin, the boss's idle; then the proofs. Local runs
one Electron of mine at a time under the shared SLOTS=3 lock (BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000; the
load here was 3.5–20 (other builders). **The final code is 788ee76a** (actor / lava / stageMods / lavaFx 6f419a99, the boss
2874e139, rule 44 + the geometry 788ee76a); 4c61604c after it is test-only (rule 47 b's reach bar). Mac mini: JOB-11 at
6d012b1e, JOB-12 at 0fbd4b1d (net-lava at the final code), JOB-13 at b6996b52 (the audit's rules 44 / 47 at the final
test), JOB-14 at ae885c9d, JOB-15 at 0194dd37 — see §4.

## 1. What was built, item by item

### 1. Cover standing in drowned ground: rescued, never a perch, never a fling (6f419a99)

- **The rule as the lead wrote it.** A kid on an off-limits top whose every way off lands in the lava is **held 0.6 s where
  it stands** (no slide, no walking: the player sees it stop), **then rescued**: placed on the nearest dry nav node within
  6 m with a brief invulnerability, never splatted, never thrown. The HUD's personal line reads **NO FOOTING → rescued**
  from the hold until 1.8 s after the move (dark chip, no arrow; `lavaFx.js` `.lv-mine.is-rescue`).
- **actor.js** (tagged [b5-caldera]): `_roofHold` now starts the hold; `_roofHeldStep` runs it — **the slide's clock stays
  at its start while held** (`roofT` 1e-3: a re-check judges, and any later slide launches, at the slow push 3 m/s), every
  0.25 s the ways off are looked at again (a dry one now: the slide starts along it at 3 m/s), and after 0.6 s held in all on
  that top it asks the stage (`G.match.stage.rescue(a)`, retried every 0.25 s until one answers). So a held kid is never
  flung: the reviewer's 7–9 m/s launch came from `roofT` counting on while held.
- **stageMods.js**: a `rescue` hook (R_HOOKS + `StageRun.rescue`), documented in docs/STAGE-MODS.md.
- **lava.js** `rescue(a)`: the nearest valid nav node (static floor — no rider node —, standing (groundHeight within 0.3 m),
  over the sea, not reached by the lava within 8 s, the body fitting) within **6 m** (a 12 m fallback, counted in
  `stats.rescueFar`; never needed in any run); `netTp++` (a teleport every screen snaps to), velocity zeroed, **invulnerable
  1.0 s**, rings at both ends (`G.fx.ring`, ash white), `stats.rescues` / `rescueLog`.
- **reset() clears the slide** (`roofT`, `roofDir`, the hold): a spawn / teleport onto a roof kept the previous slide's
  direction and slid the kid that way unchecked — this is what killed kids "dropped" on the gauge machine house in the
  reviewer's probe-roof8 (its trials re-spawn the same kid; 4 of its HIGH idle deaths).

### 2. The landing check with air braking; the Tide Boards (6f419a99)

`_roofLandWet` (called by `_roofExitDist` for each way off):
- **The earliest landing is the steer-back arc** x(t) = v·t − ½·20·t² (airAccel; never behind the exit, falling at 30 m/s²,
  downhill off a pitched top), **the latest the fast arc** (6.5 m/s kept — v = max(√(w² + 28 s), 6.5) — at 22 m/s²); the
  idle brake (½·4·t²) lies between them. **Dry floor is required from the earliest landing to 0.6 m past the latest**, the
  floor under the footprint (a seam the feet span is no gap), **now and 3 s on** (a rise: no slide onto floor about to
  drown), and it must be floor at all (no slide over the outer wall into the void).
- Three faults the probes outside the checks found, fixed in the same function: **a lip over the fast arc** (a face 0.35 m
  over it, the body meets it and is turned) refuses the way; **the floor near the exit leaves out the slide's own top**
  (groundHeight and over()'s ray disagree at an edge: a vent hood's corner "landed" on the hood itself 0.15 m past its exit
  and the lava beyond was never looked at — 2 of 12,966 Mitts landings); **the slide's height at the way off** (`ry`) is
  the top it leaves from, and on a hazard stage the wall rays start there and also look at a 0.37 m lip (a chain of
  7.6–7.9 m wall tops walked a kid into a 0.4 m lip that turned it over the outer wall).
- **The Tide Boards: 0 of the reviewer's 738 Mitts landings into the lava at LOW and at HIGH** (probe-hold8 D, both boards,
  locally and on the Mac mini; it was 54 / 53 and 21 / 20).

### 3. Rule 47 widened into the gate (6f419a99, 788ee76a, 4c61604c)

lava-audit rule 47 now watches every trial for a **death** after touching the top, a **fling** (held, then off the top without
the rescue, dying or launched over 3.6 m/s), a **perch** (alive on an off-limits top 3 s after touching it) and the
**rescues** (how far). Gate: 0 deaths, 0 flings, 0 perches, every rescue within 6 m, in every part:
- **a** the hop-on probe (review 7's probe-roofslide7b, as before, its first part): LOW and HIGH.
- **b** (review 8's probe-roof8) every point of every roof top beside the lava (≤ 4 × 4 points a top), put down still or
  drifting at 6.5 m/s in 8 headings with the stick idle, or drifting along its 4 axes and **steering back against the slide**
  (on the top and in the air off it; not on tops no kid reaches — over 2.6 m above every dry floor within 6 m, the reviewer's
  own bar: the outer caldera walls); at **LOW, HIGH, the first rise's 30 / 60 / 90 % and the first fall's 50 %**.
- **c** (review 8's probe-hold8 / probe-perch8) every way onto the tops that hold: Sponge Mitts leaps (the kit's predictLeap
  aimed at the top from every dry node within 14 m, up to 120 that land on it), plain running jumps and swim jumps out of own
  ink (dry nodes within 9.5 m, steered at the top in the air, up to 60 each), walk / hop off higher floor, and for cover on
  drowning floor a hop onto it every 0.05 s from 1.2 s before its floor turns deadly; idle until 3 s after touching it.
- **d** Mitts leaps onto every tall top beside the lava (1.8–3.6 m over the floor round it: the Tide Boards, the gauge
  machine house, the firebrick store, the winch house, outer wall ends), up to 800 a top, idle, LOW and HIGH.
- PAGE_ARGS `r47=a,b,c,d`, `r47lv=…` (the whole rule runs ~25 min locally, so the proofs run it in parts).

### 4. Rule 44's steered margin (788ee76a)

- **The check first.** The steered march (0 / ±45 / ±90° at **4, 8 and 12 frames**, `sfx=`) now flies off **every
  take-off** — every valid static nav node within 3.5 m of lava, 16 headings (22.5°), the take-off where its floor ends
  within 3 m else the node itself (no straight jump then), the first run-up of 2.6 / 1.5 / 0.8 m that fits — as well as the
  rider tops; then **round the 4 most-saving a finer look** (start ±0.3 m, heading ±9° in 3°, the stick ±15 … ±90° in 15° at
  4 / 8 / 12 frames). The gate gains **every steered running jump under 14 m** (the 20 m bar and the 15 m largest stand).
- **What it found.** Review 8's spot (the island's coping past the second Race's landing → race 7: 14.96 m) and, with the
  finer look, a new one: **north off the Ladle Road's corner by the second Race, steered 45–60° left, onto race 7: 16.3 m**
  (review 8's probe-steer8 saw it at 14.46 m's level: its headings and steers missed the line).
- **The geometry** (layout.js, both halves): the coping past the stump was a dead end — the organ stump stood 0.3 m off the
  island's lava edge, so the walk to the pier went round the deck, 18.7 m — **the stump moved 0.6 m toward the deck and 0.1 m
  slimmer** ((∓12.3, ∓2.7), r 0.8): a 1.2 m walk opens past it, 10.4 m round (that jump now saves 6.7 m); and **a 1.0 m
  parapet (cover, `ladle-parapet`) along the Ladle Road's corner by the second Race** (its west face and the first 1.6 m of
  its north face, on the coping; not in Boss Battle, which holds the lava LOW).
- **After** (JOB-13, the Mac mini): **the steered largest 13.13 m at LOW and at HIGH** (off the Lakefront by the Tide
  Board onto the causeway, steered 15° at 12 frames; 190,788 / 178,790 flights off 16,048 / 15,056 take-off headings, 6,993
  in the finer look a level), the straight largest still Organ B's 14.74 m seam flight; 37/37. Review 8's probe-steer8:
  12.5 m at either level (was 14.46); probe-steer8-local 6.72 m (was 14.96).

### 5. The boss's idle at the causeway's south end (2874e139)

- **Recorded**: boss-idle.js now records the walk's own state at an idle (the turn time-out `_tl` / `_tw`, the waypoint and
  the heading to it, speed, goal time, the pose / turn fit and which of 8 headings turn). A new probe, **boss-foot.js**, puts
  the boss down round the causeway's south end (x −3 / 0 / 3.6, z −25.2 / −24, 8 headings; JOB-10's recorded state; the
  reviewer's spot in 8 headings), its walk state cleared as a move's end leaves it, 15 s each: on the old code **12 of 57
  states idled 6 s or more, 3 of them 10–12 s** — (3.6, −24) facing north at the causeway's edge: no step fits, no fitting
  heading closes on the waypoint, so it re-pathed to the same goal and backed out where no pose fits behind it; and
  (3.6, −25.2), a corner where 1 heading of 8 turns.
- **Broken (bossBrain.js, roamAfter stages only)**: when no step fits and no fitting heading closes on the waypoint, the
  walk takes the fitting heading with the most room 1.5 m on (wall + floor clearance), for ≤ 2 s, out of the edge first.
  boss-foot locally: 3 → 2 states ≥ 10 s, worst 12 → 11 s (the (3.6, −24) case gone); on the Mac mini 3 states ≥ 10 s,
  worst 12 s (the corner). Two other tries made it worse and were dropped (a 4 s no-headway watchdog that re-picked
  goals and sidled — it cut the old 6 s back-out short: 15 s at the corner).
- **boss-check five in a row on the Mac mini (JOB-12): 6/6 ×5, the longest idle 6 / 4 / 4 / 3 / 5 s**; three more (JOB-14):
  6/6 ×3, 4 / 6 / 4 s.

## 2. Decisions where the list left a gap

- **The rescue's invulnerability: 1.0 s**; its line shows from the hold to 1.8 s after; no new sound (the rings, the line
  and the invulnerability flash say it). The 12 m fallback exists so a kid is never left perched; no run needed it (max
  rescue 5.53 m).
- **"Dry" for the slide is "dry now and 3 s on"** (`wet(…, 3)`): during a rise a slide onto floor about to drown is
  refused, so the kid is rescued to ground that stays (the reviewer's hop onto a hornito as the shelf drowns now ends on
  rule 47 c's 616 rise hops: all rescued, 0 perches, 0 deaths).
- **A held kid stands still** (the hold zeroes its velocity every frame) — before, it could walk off; with the rescue at
  0.6 s it is moved instead.
- **Steering back in rule 47 b is against the slide's way off** (a steer across the slide is the player's own route, like
  the reviewer's "push" rows, information only), and **not on tops no kid reaches** (> 2.6 m over every dry floor within
  6 m: 10 tops at LOW, 28 at HIGH, all outer caldera walls; still and drifting put-downs run there too, 0 deaths).
- **probe-hold8's own window**: its Mitts leaps stop 200 frames after the leap starts, which is 0.2 s after some landings —
  inside the 0.6 s hold — so it reports "held and alive" for the hornitos (FAIL, both runs); `rev8/probe-hold8w.js` is the
  same probe watching 3 s after landing as its header says: **PASS** (no perch, Tide Boards 0/738). Its A list (tops that
  hold for 0.5 s) is by design the tops the rescue serves.
- **Rule 44's margin: the geometry fix at the root** — the stump made a dead-end pocket; opening it shortens the dry way
  round rather than closing the corner with a wall; the Ladle Road corner gets a parapet (a jump off it lands 6 m away on
  race 7: no amount of walk shortening helps there).
- **The finer look is my addition** to the lead's "probe-steer8, 22.5° headings, steer frames 4–12": without it the gate
  would have passed with the Ladle corner at 14.4 m and a 16.3 m line next to it.

## 3. Online behaviour and bots

- **Online.** No new record. The hold and the rescue run where the actor is simulated (a player's own screen, the host for
  bots); the rescue is a teleport (`netTp`): every other screen snaps the ghost; its invulnerability is judged by the owner
  (damage is the victim's owner's). The HUD line is the owner's. The landing check reads the lava's level from the synced
  clock. docs/NET.md says so. **net-lava 13/13 on the Mac mini at the final code (JOB-12)**: the lava cells agree at the
  results screen (76,102 cells, 17 differ), the late joiner's grid equals the host's.
- **Bots** are held and rescued like anyone (none hops onto cover); **lava-bots 7/7 with 0 lava deaths in 360 bot-trials on
  the Mac mini** (locally 7/7, 0 escape deaths, 1 fight death ≤ 1). The boss walk change is for roamAfter stages only.

## 4. Tests, pictures, balance

**Local** (one Electron of mine at a time):

| test | result |
|---|---|
| review 8's probe-roof8, all six levels | review 8: the mould stack 98 / 144, the ladle stands 84–86 / 144 into the lava at mid-fall, hornitos and ladle stands held at HIGH; this round's first engine pass still HIGH 4 / r30 1 / r60 4 / r90 4 / f50 4 idle deaths (the outer wall chain, the machine house) → **0 at every level** (and on the Mac mini, JOB-11: 2/2, holdsReach 0) |
| review 8's probe-hold8 | Tide Boards D **0 / 738 at LOW and HIGH ×2 boards**; B / C (perches): see §2 (its 0.2 s window); **probe-hold8w 2/2** (0 perches) |
| review 8's probe-perch8 | **1/1**: 84 replays of the audit's HIGH rows onto cover, 0 perched (each rescued onto the north head or a coping) |
| lava-audit rule 47 (a,c,d) | a: LOW 3,908 / HIGH 4,572 landings, 0 deaths; c: Mitts 1,085 onto the holders, run 130, swim 312, rise hops 616 — 0 deaths, 0 flings, 0 perches, all rescued; d: 12,966 / 13,441 Mitts landings on 12 tall tops, **0 deaths** (the Tide Boards 0 / 738 each); rescues ≤ 5.53 m |
| lava-audit rule 47 b, LOW + HIGH (with the reach bar) | 11,184 + 14,772 put-downs touched, **0 deaths, 0 flings, 0 perches**, 1,998 rescues (≤ 2.83 m) |
| lava-audit rule 44 HIGH, before the parapet → after | steered largest 16.32 m (the Ladle corner) → **13.13 m**; straight largest 14.74 m (B's seam flight) |
| boss-foot.js (57 states), old code → final | ≥ 10 s: 3 → 2, worst 12 → 11 s |
| lava.js | **59/59 ×3** |
| lava-bots | 7/7, 0 escape deaths, 1 fight death (≤ 1) |
| check-maps | all 8 caldera variants ok (1,805 pieces; bazookarp 1,867; boss 1,674) |

**Mac mini:**

| job @ head | result |
|---|---|
| JOB-11 @ 6d012b1e (final code) | check-maps 8/8 ok; lava-audit rules 14/21/22/25/38/42/45/46 **8/9** (rule 42 only, art phase); **rule 44 37/37** (the 14 m steered gate at LOW and HIGH); rule 47 a,c,d **2/2** (40,032 touched, 0 deaths / flings / perches, 1,847 rescues ≤ 5.53 m); rule 47 b 1/2 ×2 (the outer-wall steer-backs, before 4c61604c — see JOB-13); **probe-roof8 2/2, probe-perch8 1/1, probe-hold8w 2/2**, probe-hold8 1/2 (§2); **probe-steer8 HIGH 12.5 m / LOW 12.5 m, probe-steer8-local 6.72 m**; lava-leap 3/3; lava-notch 3/3 |
| JOB-12 @ 0fbd4b1d (final code) | **lava-bots 7/7** (0 deaths in 360); **lava.js 59/59, 58/59** (F8c: race 7, 1 node of 76 not up within 4 s, no death — §6); **Zone Control 7/7 ×2** (0 lava deaths; Organ L held 124.5 / 58 s); **lava-karp 10/10** (K8: 0 crossings); **boss-check 6/6 ×5** (longest idle 6 / 4 / 4 / 3 / 5 s); boss-foot 2/3 (3 of 57 states ≥ 10 s, worst 12 s); **net-lava 13/13** |
| JOB-13 @ b6996b52 (the final test) | **rule 44 37/37**: largest 14.74 m, **steered largest 13.13 m at LOW and HIGH**; **rule 47 all parts pass**: a 4,336 / 5,000 hop-ons (the parapets add tops), b 11,184 / 14,772 / 11,184 / 14,772 / 14,772 / 14,620 put-downs at LOW / HIGH / rise 30 / 60 / 90 % / fall 50 %, c Mitts 1,083, run 128, swim 310, rise hops 616, d 14,147 / 14,412 Mitts landings on the tall tops (the Ladle and terrace parapets among them) — **0 deaths, 0 flings, 0 perches**, 11,039 rescues, the farthest 5.53 m |
| JOB-14 @ ae885c9d | **boss-check 6/6 ×3** (idle 4 / 6 / 4 s); lava.js 59/59, 59/59, 58/59 (F8b — §6) |
| JOB-15 @ 0194dd37 | lava.js **59/59 ×3**, F8b / F8c case by case: no hop in 0.3 s, no death, every stone up (slowest 1.27–1.3 s) |

**Pictures** (`stages/caldera/out/fix8/`): `fix8-hornito-held-hud` / `fix8-hornito-rescued-hud` and
`fix8-mould-stack-held-hud` / `fix8-mould-stack-rescued-hud` (the player's view: held with **NO FOOTING → rescued**, then on
the node 3.2 / 2.6 m away), `fix8-hornito-held-side` / `-rescued-side`, `fix8-mould-stack-held-side` / `-rescued-side`
(from the side, no HUD: the kid on the cover in the lava, then on the coping with the rescue's rings). Looked at: the line
reads at the bottom centre; the rings mark both ends; the mould-stack rescue lands on the Casting Floor's edge coping.

**Balance (informational)**: Zone Control 0 lava deaths in both matches; Organ L held 124.5 / 58 s.

## 5. Commits and shared files

Code: 6f419a99 (the rescue, the landing check, rule 47 widened), 2874e139 (boss walk; boss-foot.js; docs), 788ee76a (rule 44
off every take-off; the stump; the Ladle parapet), 4c61604c (rule 47 b's reach bar, test only). Scratch: JOB-11 6d012b1e,
JOB-12 5f3382b1, pictures b2819bca, JOB-13 ebed288b, JOB-14 ae4f2155, JOB-15 2146f2f9, DESIGN 0efe2edb, the merges of the
Mac mini's results,
and this report. Pushed: only `fork botlab-b5-caldera` (fetched and merged first, never forced).

Shared files (all hunks tagged [b5-caldera]):
- `src/game/actor.js` — `reset()`: the roof slide's state cleared; `_roofSlide`: the hold's step; `_roofHold` /
  `_roofHeldStep` (new: the hold, the re-check, the rescue call); `_roofExitDist`: `ry`, the hazard stage's wall rays
  (`_RX_WH`); `_roofLandWet`: rewritten (the braked arcs, the lip, the own-top floor, ahead 3 s).
- `src/game/stageMods.js` — `rescue` in R_HOOKS and `StageRun.rescue(a)`.
- `src/boss/bossBrain.js` — `_walk`'s stuck detour: the roomiest fitting heading when none closes on the waypoint.
- `src/fx/lavaFx.js` — the personal line's rescue look.
- Stage-own: `src/game/lava.js` (`rescue`, `RESCUE`, `_mine`), `src/world/stages/caldera/layout.js` (the stump, the
  parapet); tests `tools/botlab/tests/lava-audit.js`; docs `docs/STAGE-MODS.md`, `docs/NET.md`, `stages/caldera/{DESIGN,
  ENGINE}.md`; scratch probes `jobs/batch5/caldera/{boss-foot,boss-idle,rescue-scenes,nums}.js`, `rev8/` (review 8's
  probes, copied; probe-hold8w).

## 6. Unfinished, flaky, uncertain

- **boss-foot.js still finds the corner at the causeway's south-east foot** ((3.6, −25.2), where 1 heading of 8 turns):
  3 of 57 put-down states idle 10–12 s on the Mac mini (11 s locally). boss-check's own gate (< 12 s) held in all 8 Mac-mini
  runs (≤ 6 s: JOB-12 ×5, JOB-14 ×3); the probe's 10 s bar is mine and stricter. Not fixed further: the two broader changes
  I tried made it worse.
- **lava.js: 2 single misses in 13 runs this round** (8 on the Mac mini, 5 local): F8c once (JOB-12: race 7, one node of
  76 not up within 4 s, no death) and F8b once (JOB-14: a route hop from a stone toward a column; the runner cut the row
  before the failing case). Both are bot-escape checks this round's code does not touch (the roof slide only acts on
  off-limits tops; the stump moved away from race 7's pier); JOB-15 printed both case by case three times: all pass. The
  previous rounds' runs (6) had no miss, so I cannot rule out that something here shifts them: uncertain, not chased.
- **probe-hold8 as written FAILs** (its 0.2 s window sees the first part of the 0.6 s hold); the 3 s variant passes.
- **Rule 47 b's steer-back stops at reachable tops**: kids put on the outer caldera walls (no way up) and steering back
  against the slide can still fall in (JOB-11, before the reach bar: 34 / 54 such rows); idle and drifting put-downs
  there: 0 deaths.
- Rule 42 and the lavafall's side patch: the art phase's, untouched. The crown's look: unchanged.
- Rule 47's full run is ~25 min locally (the proofs split it); rule 44's every-take-off march adds ~4 min a level.
- No other stage was re-run: the engine changes act only with a `wet` hook (Highmark), except `reset()` clearing the roof
  slide (any stage) and the boss walk's fallback (roamAfter stages: Highmark).
