# Bluestone Junction — engine phase, second half, after the final review's fix round 1 (LEAD-REPORT)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. This round answers the independent final review
(`LEAD-REVIEW.json`, verdict **redo** on two narrow points, eight issues) of the second half at 7468a1b8. The second
half's own report is `git show 7468a1b8:tools/botlab/jobs/batch5/stages/bluestone/LEAD-REPORT.md`; the first half's is at
d99607dd. Everything below the issue list is that report brought up to date (§1–§7).

How it ran: everything on this Mac. The task says the Mac mini is unavailable; COMMON.md in the worktree (uncommitted, the
lead's) says it is back. I followed the task: nothing pushed, nothing sent (§7). One Electron of mine at a time under the
shared SLOTS=3 lock. The machine was far busier than in earlier rounds: load averages 10–500 (most runs at 130–450; the full eras-jump run died at its watchdog after a GPU hang), so
every frame-time and wall-clock check below is a statement about this machine as much as about the code (§0, issue 5).
A previous fixer of this round was cut off by a usage limit; its uncommitted work (issues 1–3 in eras.js, the harness,
the tests) was read, kept where sound and finished (the zip test's spot moved off a kerb planter; the device pop given
the subs SPEC's ending; the deploy destroyer's shape corrected), then committed below.

Logs: `tools/botlab/jobs/batch5/bluestone/local-logs/fr1/` (`summary.txt` lists every run with its result; `load.txt`
the load averages). Pictures: `tools/botlab/jobs/batch5/stages/bluestone/out/engine/fr1-*.jpg` (looked at).

## 0. The final review's issues

### Issue 1 (major) — a Drip Curtain on a roof that vanishes stayed standing in the air. **Fixed.**
- **Cause, as the review said:** `StageEras._devices` popped an own device only through its face (`it.face`) or when its
  position was inside an appearing block. A curtain has no face, and a gate's roof and walls are `paint: false`, so a
  curtain (or any device stuck to an unpaintable gate face) outlived its piece.
- **Fix (`src/game/eras.js` `_devices`, 8a0197cf):** also pop each own placed or stuck device (`stuck`, `spray`,
  `curtain`, `mine`, `beacon`) whose surface went: a point 5 cm into the surface it sits on (−normal; a curtain: straight
  down) lies in a block that just went and in nothing still solid. A Skitter Bomb on the move and the clouds follow the
  ground or the air as before.
- **The ending, made consistent with the subs SPEC** (found while there): every era pop now sets `endWhy = 2` and plays
  `G.deploy.endLook(it, 2)`, so the owner's end record is `[2, gid, 2]` ("crushed: tower, mover, shell, era flip, lava",
  the subs SPEC's table) and every screen shows the crunch. Before, the record was a bare `[2, gid]`, on which a *ghost*
  Lurk Mine or Cling Charge **blasts** on the other screens while the owner's copy only popped. One `'device:down'`
  `{ how: 'flip' }` per pop, as the SPEC asks of every ending.
- **Integration bug fixed on the way:** the module called the one destroyer as `S.crushIn({ blocks: on /* ids */, gone,
  where }, 'flip')` and skipped its own walk once `G.deploy.crushIn` exists. int3's `crushIn` takes block *objects* (it
  would have thrown on the first flip with an appearing piece: `pointInBlock(number, …)`) and knows no `gone` key, and the
  final subs SPEC (§0.3, §0.6) leaves the subs items to Bluestone's own walk. Now: `S.crushIn({ blocks: [block objects] },
  'flip')` for the buoy and the kits' devices inside what came (0 on this branch), then the module's walk, always.
- **Proof:**
  - `tests/eras-jump.js` 'device' (3/3 with 'zip'): Drip Curtains thrown through the game's own `subs._throw` onto the
    Degrayling crates' roof (2.8 m, jump 1) and the goods wagon's (2.8 m, jump 2) land as curtains at 2.8 and are dead
    right after their piece's flip (popped resting 1 each); a control curtain on the street 2.9 m beside the crates stays.
  - **Negative control** (`nofix-devzip.log`): the same test with the old walk swapped in fails exactly these checks (the
    curtain still 'curtain' after each flip, 0 popped).
  - **Online** (`net-eras.cjs`, unlagged and lagged): the guest's sprinkler on the crates' wall *and* its Drip Curtain on
    their roof stand on both screens before the flip (precondition: the host has both ghosts) and are dead on both
    screens after it.

### Issue 2 (major) — `ERA=n` was silently ignored, so "tower-check clean in every era" was three era-1 runs. **Fixed; the report corrected.**
- **Fix (`tools/botlab/offscreen-boot.cjs`, 7d5ff94d):** `ERA=1|2|3` is `PAGEQ='era=n'` again (a `HARNESS ERA=n` line
  says so); any other `ERA` (`all`, `0`, a typo) or one that disagrees with `PAGEQ`'s era **stops the harness at boot**
  with a `HARNESS` line (the runner keeps those lines; the job then has no `RESULT`).
- **Guard against a repeat:** `StageEras.botReport()` now carries the era a match started in and whether the audit held
  it (`start`, `held`, `fixed`, `jumpsPlanned`, `cycle`); match.cjs and tower-match.cjs print it on the `ERAS` line
  ("era 3, started in era 3 (held there: ?era=3)" / "started in era 1, 2 jumps planned"), and tower-check prints its own
  `ERA` line.
- **The queued scripts:** JOB-4.sh and JOB-5.sh (never ran) and the scratch tools' usage lines (ink-regions,
  rc-ink-regions, halo-dominance, boss-check, goal-diag) say `PAGEQ='era=n'`; JOB-5's summaries keep the `ERAS` / `ERA`
  lines. tools/botlab/README.md and docs/STAGE-MODS.md document it.
- **Proof** (`local-logs/fr1/`):
  - `tc-ERA-all.log`: `HARNESS ERA=all is not 1, 2 or 3 …`, no run. `tc-ERA2-PAGEQ3.log`: `HARNESS ERA=2 disagrees with
    PAGEQ's era=3 …`, no run.
  - tower-check with `ERA=1`, `ERA=2`, `ERA=3` and `PAGEQ='era=3'`: each prints `ERA n (started in era n, held there:
    ?era=n; page ?autopilot&era=n)`; each is clean: 73.99 / 73.99 m, 0 holes, clearance clean, both rides a knockout.
    The era-2 top view shows the Iron Bridge; the era-3 run's first frame shows the float-tram and the light masts and
    the chip's 3000s lit (looked at).
  - A held Turf War (`PAGEQ='era=3'`, 60 s) prints "era 3, started in era 3 (held there: ?era=3)"; the normal matches
    print "started in era 1, 2 jumps planned".
- **What was mislabelled before:** only the engine-phase tower-check runs (`local-logs/engine2/tower-check-era{1,2,3}.log`,
  all era 1). The blockout rounds' per-era numbers (the Halo's 48 %, the cover maps, the ink regions) ran before the merge
  82d191da (2026-10-10 14:28) dropped the mapping, with the blockout's own `?era=` filter, so they stand. §1 and §4 below
  now cite the runs above.

### Issue 3 (minor) — a Zipline rider on a wall that vanishes stayed pinned in the air. **Fixed.**
- **Fix (`StageEras._zips`, 8a0197cf):** at each flip, on every screen, a Zipline whose anchor lies on or in a block that
  went ends at once: the owner's rider drops where it is (no impact: the zip never arrived; `zip`, `hang`, `body` off,
  horizontal speed zeroed), a remote rider's tether goes. For 2.5 s after a flip a per-frame pass also takes down a ghost
  tether that its owner's late `'zi'` record re-hung on the gone piece (the owner's zip landing just before *its* flip).
- **Proof:** eras-jump 'zip': a bot clinging to the crates' wall (latched 1 s before their flip, a 1.4 s hang) has
  `hang 0` right after the flip and lands on the street straight below (0.0 m from where it hung); a bot zipping at them
  (fired 0.15 s before the flip, 33 m/s) stops at once and lands 10.7 m short of the anchor; a ghost tether re-hung within
  2.5 s is down the next frame. The negative control fails all three (hang still 0.52 s after the flip; the re-hung
  tether at 1.37 s).

### Issue 4 (minor) — the lagged run was never part of the tests; at 150 ms the follower's clock sat 0.37–0.45 s behind; the device check was flaky. **Fixed: the lagged run, the clock, the device check. The < 0.4 s flip contract held where the frames held and missed at a load of ~400 (below): it needs the quiet machine.**
- **The margin taken back (`src/net/netmatch.js`, [b5-eras]):** the host's clock tick (`msg.c`, twice a second) now
  carries its match clock (and Practice's stage clock) as they will be when the tick reaches the relay: half the host's
  round trip taken off `time`. Each follower takes off its own half on arrival and moves halfway to that past a 0.05 s
  dead band (it was 0.2 s, with nothing added back). The round trip used is the lowest of the smoothed round trip's last
  20 readings (10 s), so a stalled frame that held a pong back does not push the clock ahead. This is the match clock, so
  the HUD timer, movers, pods and every stage module follow the host more closely too.
- **The lagged run is in the tests:** net-eras.cjs runs with `URLQ='wipstages&netlag=150&netjitter=50' NET_ARGS='only=turf'`
  (the header says so, JOB-6.sh runs it as its second invocation), with the same thresholds.
- **A real clock measure:** each screen logs every era update with the wall clock (both clients run in one process); the
  test compares the two stage clocks at the same wall time over the 26 s after jump 1 and asserts the median within
  0.15 s and the 90th percentile within 0.25 s. It also prints the per-second series and each screen's frames over 1/24 s
  (the game clock advances at most 1/24 s a frame: a stalled host loses clock time that its next tick takes back).
- **The device check made deterministic:** the guest is invulnerable from the throw to past the flip, and "both devices
  stand on both screens before the flip" is its own precondition check.
- **Proof** (`local-logs/fr1/net-eras*.log`):

  | Run (load average) | Result | Flip skew (max) | Stage clocks at the same wall time | Clock time lost to frames over 1/24 s (host / guest, in ~70 s) |
  |---|---|---|---|---|
  | unlagged, turf + host + practice (~150) | **14/14** | 0.045 s | median 0.033 s, p90 0.075 s | — (not logged yet) |
  | lagged, first try: the round-trip mean (~150) | 7/8 | 0.081 s | median 0.095 s, p90 **0.268 s** | — |
  | lagged, the round-trip floor (~130–280) | 7/8 | 0.201 s | median 0.071 s, p90 0.18 s, max 0.29 s | 7.6 / 6.8 s |
  | lagged, the round-trip floor (~400) | 7/8 | **0.50 s** (jump 1; 0.084 s jump 2) | median 0.115 s, p90 0.233 s | **38.7 / 34.6 s** |
  | unlagged, turf + host + practice (~400) | 12/14 | 0.349 s | median 0.169 s, p90 **1.83 s** (±1.5 s swings) | **29.6 / 24.6 s** |

  The review's lagged run (the old code, loads 13–88): flip skew 0.223 s, the follower 0.37 s behind.
  - **Reading them.** The game clock advances at most 1/24 s a frame. At loads of 130–280 the follower tracked the host
    within ~0.1 s (median) instead of trailing it by the trip, and every flip landed within 0.2 s. At ~400 both pages lost
    half their clock time to stalled frames, and a host stall right before a flip lets the follower run ahead by the
    stall (the third lagged run's jump 1: the guest's clock at its flip 31.26 s, the host's 30.87 s at that wall time),
    or, in the unlagged rerun, multi-second stalls swing the two clocks ±1.5 s apart. Those are this machine's stalls,
    not the network: the same runs' device, solid, nav, guard-window and results checks all pass. The one remaining miss
    of the second lagged run (one Iron Bridge cell of 368 differing once: a bot's splat in flight) is what the cells'
    retry now settles (third run: `differPerTry [0]`). The unlagged rerun's other miss: the new host's jump 2 fired at
    60.008 s on its clock (on time), but at half clock speed its done had not come within the test's 5 s wait.
  - **What remains:** the < 0.4 s flip contract under lag is met where the frames held and missed at a load of ~400; it
    needs JOB-6's lagged run on a quiet machine. If a real host's stalls prove to matter there, the next lever is the
    clock tick at the network tick's 20 Hz instead of 2 Hz (a stall's tail shortens from 0.5 s to 50 ms).
- `guard` stays 0.5 s (ENGINE §7 risk 4's fallback is not needed).

### Issue 5 (minor) — frame-time and load budgets unproven on a quiet machine. **Instrumented; still unproven on a quiet machine.**
- There was no quiet machine: the task keeps the Mac mini out, and this Mac ran at load averages of 130–450 for most of
  the round. I did not call the budgets met.
- **The split the review asked for:** eras-jump 'frames' now times every frame of the Bravo-viewer jump and the kept-world
  'theme' jump in three parts — the era update (the module's whole per-frame work), the render, and the rest — and asserts
  that the era update stays under 10 ms in every frame of both jumps. A spike then shows whose it is.
- **Results here** (eras-jump B, load ~250):
  - jump 1, J − 0.5 … done + 1.5 ('frames'): max 31.8 ms, p95 9 ms, era update max 5.8 ms — passes the 50 ms cap; the
    no-jump baseline on the same page peaked at 185.7 ms;
  - the Bravo viewer's 2 → 3 jump: worst frame 39 ms = era update 0.1 + render 9.6 + the rest 29.3; era update max 8.9 ms;
  - the kept world's 3 → 1 jump ('theme', the review's 130 / 119 / 101 ms case): worst frame **90 ms at J + 1.37 = era
    update 6.2 + render 29.9 + the rest 53.9 ms**; era update max 6.2 ms.

  So the new check (the era update under 10 ms in every frame) passes, and the old 50 ms cap fails on that one 90 ms
  frame, whose era update is 6.2 ms: the spikes are the render's and the rest of the frame's on this machine, not the
  module's. Whether the rest of that frame is a real cost at J + 1.37 of a rewind or this machine's stall can only be told
  on a quiet machine.
- **Shader programs** (the deterministic half): 'first' on a fresh page, through the real jump 1 from J − 21 to done +
  1.5: programs 151 → 151 in both runs, nothing compiled (the new done meshes of issue 7 included). Its warning-frame era
  update was 11.2 and 16.8 ms against the 10 ms cap at loads of ~270 and ~400 (5.8–8.9 ms was the worst era update of any
  frame in the B run's three jumps).
- JOB-6.sh (for the record) runs 'first' and 'frames' ×3 on fresh pages, the perf / load REPORTs alternated with Halyard,
  and now the lagged net-eras: the quiet-machine job for when the Mac mini is in use again.

### Issue 6 (minor) — ENGINE §5 rules without a check; the appear rule skipped prop colliders. **Fixed; one real finding.**
- **check-maps T2 (`src/world/eras-data.js`, d34dba7f)**, on the turf, tower, bazookarp, boss and zones builds:
  - 18: Tartar's tower (concourse, ramps, columns, clock beams and steps, drum, dome, lantern) carries no era, and no era
    piece meets it;
  - 21–22: an era piece whose underside is ≥ 3.4 m over everything walkable beneath is an overhead piece; over a route (a
    walkable top ≥ 2 m across both ways: not a cart's, a bollard's or a planter's top) its underside is ≥ 4.0 m and the
    deck ≤ 6 m wide;
  - 23: every edge of an overhead deck is continued by a floor within a step or guarded ≥ 0.9 m within 0.2 m; an open run
    up to 2.05 m is one of the design's drop gaps (the Halo's two 2 m inner gaps);
  - 26: era-3 walkable tops ≤ 9 m (the highest is 5.4);
  - 29–30: a swap's appearing piece lies inside what its group gives up wherever it could come down on someone (its
    underside < 3.4 m over the walkable top beneath), and swapped walkable tops are within ±0.02 m;
  - 39: ≤ 6 stage texlib slots (64 / 65 / 66) and ≤ 4 remaps (2).

  check-maps prints one summary line: 32 overhead pieces, 20 overhead decks with 12 open runs ≤ 2.05 m (the Halo's drop
  gaps, the landings' short edges), 12 swap groups.
- **The finding:** the Halo's 225° diagonal side (0.4 m thick, underside 4.9) passes **3.66 m** over the balcony
  stair's top corner, 0.34 m short of rule 22's 4.0 (check-maps' 0.25 m grid reads 3.75). It is the accepted blockout
  (DESIGN §3.6 #3 gives the Halo's smallest clearance as 3.8 m), so the layout lists it as `eras.accept.rule22` and
  check-maps prints it as `ACCEPTED` on every run. The lever, if the camera minds it there: the diagonal sides 0.2 m
  thick (underside 5.1), a collider change and a re-bake. **The lead's call.**
- **eras-static 23/23:** the stage passes; each new rule fails on its own planted violation (a box on the concourse, the
  dome given eras, a deck 3.6 m over Swimston, a 7 × 7 m overhead deck, an unrailed overhead deck, a 9.5 m era-3 top, a
  swap outside its old footprint, a 0.1 m swap step, five remaps, seven stage slots).
- **The live probe as a test** (eras-world part 3, 7aa5b49d): every nav node valid in the era before jumps 1 → 2 and
  2 → 3, prop colliders' tops included, against every appearing block in its body column (r 0.38 m, 0.1–3.35 m): 0 of
  4,808 nodes against 24 blocks, 0 of 4,958 against 120; a planted node under the café tables is caught.
- check-maps (every stage): bluestone ok; the repo's only failure is still halyard's 25.7° ramp.
- Rules 32–35 (routes per era) and 41 (backdrop draw calls) stay measured, not checked: they need the page and were last
  measured at the blockout (routes) and in eras-look (draw calls).

### Issue 7 (minor) — bots rarely use the Halo; half never find jump 1's new ground; no minimap ping at done. **The ping and the world pulse: fixed. The bots: measured, left to the balance pass.**
- **The ping (09015066):** for 3 s after a done, the minimap fills every piece that came and every footprint that opened
  in white-gold, fading, and two rings run out of each changed group's centre (`StageEras.pings()`, `drawEraMap`).
- **The opened ground pulses too** (the review: "in jump 1 the opened lane is shared ground and does not pulse at all"):
  at done, the floor under each piece that went is outlined in white-gold with a faint fill, pulsing with the new pieces
  and fading over the 4 s (`EraFx.setOpened`). It draws with two more instances of the hologram materials (the same
  programs: 'first' shows nothing compiled at done) and sits out of the GTAO pass.
- **Proof:** eras-hud 11/11 — at done + 0.5 the ping covers all 130 outlines and 44 groups of jump 2 in white-gold
  (62,766 px), nothing at done + 3.2; the world's 10 opened footprints are lit at done + 0.5 and gone at done + 4.2.
  Pictures: `fr1-jump1-lane-done+0.5` (Degrayling Lane: the crates' footprint outlined round the café tables, "NEW ROUTES
  OPEN"), `fr1-minimap-done+0.5` (rings over both Iron Bridges and the café groups), `fr1-jump2-wagon-done+0.5`,
  `fr1-minimap-era3-done+0.5`.
- **The bots: no change.** Not blocking, per the review. A pull toward the Halo pushes risk 16 (Halo dominance) the wrong
  way before the consolidated balance pass measures it. ENGINE §6 step 10's measure (every bot on era-3 ground within
  20 s of done, the median over the bots) holds in eras-bots (8.4 s, 8/8) and in four of this round's five Turf Wars
  (6.9, 8.5, 13.3, 13.3 s); the fifth was 22.1 s (Zone Control: 25.9 s, its bots hold zones). This round's numbers: the
  Halo 3.75 bot-s in eras-bots' era-3 window (the review saw 0.5, the builder 2.75: it varies run to run); jump 1's new
  ground within 30 s 3/8 (eras-bots), 6, 3, 6, 4 and 5 of 8 (Turf War), 5/8 (Zone Control). The lever for the balance
  pass: the ×2 fresh weight for objective modes' idle paint goals, and a perch score for the Halo once risk 16 is read.

### Issue 8 (minor) — Bazookarp: the carrier graph is still built from era 1's nodes on the karp branch. **Handed over.**
- I may not edit the karp worktree. The one line is a patch against b5-karp-bots (a087c391), checked with `git apply
  --check`: `tools/botlab/jobs/batch5/bluestone/karp-anyValid.patch` — `karpField.js` `_graph`: `nav.valid[i]` →
  `(nav.anyValid || nav.valid)[i]`.
- eras-karp part B (the real KarpField) and `bazookarp-check` with `PAGEQ='era=1/2/3'` run at integration; part A is
  5/5 here.

### Found while testing
- **One era shove in one Turf War** (turf-2: 1 bot inside an appearing piece at its flip, shoved out, `eraShoves 1`).
  The loiter check saw nobody in the box before the flip, and no nav node can stand there (issue 6's probe), so it was a
  body in the air (DESIGN §3.7 names an Ink Jet hovering or a jump off the balcony; the shove is the safety net). The
  `ERAS` line now names who, where, how high and whether it was in a special (`inAppearWho`). Three more Turf Wars at
  this code: 0 shoves.
- **Two eras-hud layout checks from review 2 are timing-sensitive under load** (code this round did not touch: EraHud).
  The first run passed 11/11; reruns at loads of 300–450 gave 9/11 and 10/11. In one, the era band was placed while the
  gameplay callout was still arriving and overlapped it by 32 px for the measured frame; in the other the band was
  already below an earlier callout before the test's gameplay callout came (its precondition, not the layout, failed:
  the band and the callout were apart). Reported, not loosened.
- **net-stagemods** read one screen's clock a round trip after the other's and compared the values: at loads of 150–200
  that is ~0.5 s and the check failed with the clocks in step. It now compares them at the same wall time (74515131):
  10/10.

## 1. What was built (the second half), against the user's words
The user: "a full map effect plays that simulates going forward to the current time, which changes how the map looks
and opens up new routes … 3000s … adds new areas"; Tartar "an old telephone".

**Bots (H16, H16b; `eras.js`, `match.cjs`, `tower-match.cjs`, `tests/eras-bots.js`).**
- **The danger layer** (first half) runs from the warning to done, with a control run (`E.noDanger`): four bots whose
  every paint goal is on the Halo stand on it when the rewind is warned; with the layer none is on it at its flip, without
  it all four are.
- **Replans at done** are counted. A route over a vanished piece is dropped; a street route is kept.
- **Fresh nodes ×2** as paint goals for 30 s after done; each bot's time to first stand on new ground is recorded per
  done (`botReport().visits`).
- **H16b, pre-position: built, but it only waits when waiting pays.** From J − 8 (looked at again until J − 0.5), a
  paint-mode bot within 14 m of a gate that opens takes the coming era's route through it and waits 3–6 m short of the
  gate, outside the danger layer, until the gate's own flip — only when the route through the gate gets there no later
  than the detour, give or take 1.5 s. On the Z the gates save only a few metres, so a bot waits only in the last second
  or so before a flip (the test: it waits and goes through, arriving at J + 3.61 against J + 3.73 for the detour; at J − 8
  it does not wait).
- **Perches: no new code.** The Halo's and the balconies' nodes are valid in their eras and chargers already score high
  ground (`clamp(y, 0, 5) × 1.6`).
- **Statistics** (`StageEras.stats.bots`, `botReport()`, the `ERAS` lines): at each flip, own squidkids on a vanishing top
  and inside an appearing piece (now with who and how); bot-seconds inside an appearing box before its flip (4 Hz); splats
  no weapon dealt within 4 m of a block that flipped in the last 2 s; replans and pre-positions; the era a match started
  in, and whether it was held (issue 2).

**Online (H11; `tests/net-eras.cjs`, docs/NET.md).** Nothing new on the wire from the eras; the host's clock tick now
carries its clock as at the relay (issue 4).
- **A follower's clock snapping forward across a done still fires that done once** (`era:done { snapped: true }`): the
  fresh weight, the pulse, the opened floor, the callout if ≤ 2 s old. A late join and a test seek do not.
- net-eras covers, with two clients and a third for the late join: the flip skew and the two stage clocks; solid flags
  and the nav era after each done; a sprinkler and a Drip Curtain on a vanishing piece; the Iron Bridge's cells through
  its guard window; the results; a host change between the jumps; Practice's clock; a late joiner in era 3; the rewind on
  all three screens; and the lagged run.
- Bluestone is a stage under construction, so the room lists it only with `?wipstages` (`URLQ=wipstages`).

**Every mode (`tests/eras-modes.js`, tower-check).**
- **Zone Control:** each zone's cells are identical (the same ids, all live) before and after each jump on the real
  5:00 schedule.
- **Overtime:** 40 s of stage clock past regulation with no event and no flip.
- **Boss Battle:** in era 2, with no event in 60 s. BossNav's ring is 352 m²; an era-3 BossNav built for the record walls
  the circus, so a change of `fixed` fails the test.
- **Practice's rewind:** a kid on the floating garden is rescued to the quay; a kid on the Halo drops alive to the circus.
- **The menu backdrop (attract):** a jump every 40 s through the rewind, with no chip, callout or era sound.
- **tower-check in every era** (this round, `ERA=1/2/3` and `PAGEQ='era=3'`, each printing the era it ran in): 73.99 m
  both sides, 0 holes, clearance clean, both rides a knockout. (The engine phase's "ERA=1/2/3 clean" runs were all era 1:
  issue 2.)

**Bazookarp (H21, 12b; the karp module is not merged).** On the era side:
- `StageEras.karpStates()` returns `[{ key: 1…3, nodeOk(id) }]`, forwarded as `G.match.stage.karpStates()`.
- `restMask(era)`: a node valid in the era in force and every later one. `danger(pos, 0)` covers the drop spot.
- `LAYOUT.bazookarp.statesAdvance = true`. The karp engine switches its field on `era:done`.
- `tests/eras-karp.js` part A drives a stand-in built and fed exactly as karpField builds and feeds its own (5/5); part B
  runs on the real KarpField once a bazookarp match builds `match.karp` (SKIP here; never run).
- **Integration:** `karp-anyValid.patch` (issue 8).

**The EraFx dressing (12c).**
- **Pre-bell (J − 20):** one distant ring (`era_bell`) that also shows: Tartar's single shake, the kiosks' bells. The clock
  rows count down (centre hands gold), the chip shows "TODAY in 20".
- **The warning:** the holograms are up within 0.6 s; the wire beads run along faint drawn wires out from the dome.
- **Done:** the new pieces pulse white-gold (the level shader); **the opened floor is outlined and pulses with them, and
  the minimap pings what changed** (issue 7).
- **Mural era masks:** `stages/bluestone/murals.js` draws 4 (the hour ring), 6 (the café mural, eras 2–3), 7 (Hoki Lane's
  street art, eras 2–3), 8 (the tram stop markings, era 2), 9 (the ghost sign, era 1), 11 (the 3000s' light seams, era 3).
  The front paints each in or out as it passes.
- **`eras.colors` on every highlight;** the warning's film tint is derived from `colors.vanish`'s hue.
- **The time-lapse** is tested (the sun swings, the clouds race, exposure and the grade held); the env map is rebuilt
  once at done + 0.7.

**The bake (T1).** `bake.cjs bluestone`: states 1, 2, 3, one RGB PNG (committed); stage-audit with `PAGEQ='era=1/2/3'`
says "lightmap applied" 3/3 in each; eras-bake 3/3 (R 166 under the crates against G 213). No collider changed this round
(the rule-22 acceptance is data, outside the layout hash), so the bake stands.

**Performance** (engine phase, Halyard measured on the same machine at the same time; on high): draw calls 268–339 against
Halyard's 330 / 400, triangles 0.64–0.87 M against 3.37–3.52 M, cpuRender 4.0–6.9 ms, loadMs within Halyard's on the same
machine (the review: +0.42 s mean against the +0.8 s allowance). Quiet-machine numbers: issue 5.

## 2. Decisions where the request left a gap
1. **H16b waits only when waiting pays** (arrival through the gate no later than the detour + 1.5 s), and it walks at the
   gate's own flip, not at done.
2. **Perches:** no new weight (risk 16).
3. **"Every bot … within 20 s (median)"** is the median over the bots; a bot that never reaches new ground counts as never.
4. **The pre-bell shows its ring** (Tartar's shake, the kiosks' bells) as well as playing it.
5. **Holograms at full strength 0.6 s into the warning.**
6. **Wires drawn under the pulses** (FX); the real overhead wires are the art pass's.
7. **The era band clears the HUD's banners.**
8. **A snapped done fires its event** (and now lights the opened floor).
9. **Murals on the Z's faces** (DESIGN §5.4 updated); 5 and 10 left to the art pass.
10. **The bake is committed** (one key); the art phase re-bakes all keys.
11. **`statesAdvance: true`** in the Bazookarp data.
12. **(This round) A device on a vanishing piece ends as the subs SPEC's "crushed" (`[2, gid, 2]`, the crunch),** not
    DESIGN §3.7's "shot-down pop": the SPEC is the later contract and names the era flip in its table; either look is a
    pop, and the crushed record keeps a ghost mine from blasting.
13. **(This round) The rule-22 check's "route"** is a walkable top ≥ 2 m across both ways; the one Halo clearance under
    4.0 m (3.66 m over the balcony stair's corner) is accepted in the layout's data and printed on every run, not hidden.
14. **(This round) Rule 23 applies to overhead decks** (it sits under ENGINE §5's "Overhead pieces"), with ≤ 2.05 m open
    runs counted as drop gaps; stair flights' sides are left to the stairs (the as-built lower superstop flight has none).
15. **(This round) The opened floor at done is outlined, not filled solid,** in the hologram materials, for the 4 s pulse.
16. **(This round) The clock compensation is in netmatch, for every mode** (the match clock), not in the era module only:
    every follower's timer, movers and stage modules follow the host by the same rule.

## 3. Online and bots
- **Online:** no records were added. The era state is a pure function of the host's stage clock.
  - **The clock:** the host's tick carries its clock as at the relay; each follower adds back its own half of the trip and
    corrects past a 0.05 s dead band (issue 4).
  - **Splats:** field 15 (the painter's time) from J − 1 to done + 1; every screen judges the guard at that time.
  - **Own actors:** each screen shoves, rescues and pops its own squidkids and devices; a device's end record is
    `[2, gid, 2]`; a Zipline on a gone piece ends on every screen at its own flip (issue 3).
  - **Followers:** a follower snaps to the host's clock (`seek('clock')`); a snap past a done fires that done.
  - **Late joiner:** applies the host's era on its first tick (`seek('late')`). **Host change:** the new host's clock runs on.

  docs/NET.md says so.
- **Bots** (local, this round):

| Match | Result | Stuck | Era shoves | Splats by a jump | New ground within 30 s (median) |
|---|---|---|---|---|---|
| Turf War 3:00 #1 | 37.3 / 27.4 % | 0.1 % | 0 | 0 | jump 1: 6/8 (8.3 s); jump 2: 6/8 (22.1 s) |
| Turf War 3:00 #2 | 38.4 / 22.5 % | 0 % | **1** (inside an appearing piece at its flip; see §0) | 0 | 3/8 (–); 7/8 (13.3 s) |
| Zone Control 5:00 | Alpha (neutralised), OT 5.6 s | 0.5 % | 0 | 0 | 5/8 (10.8 s); 4/8 (25.9 s) |
| Turf War 3:00 #3 | 22.7 / 38.1 % | 0.1 % | 0 | 0 | 6/8 (23.7 s); 8/8 (13.3 s) |
| Turf War 3:00 #4 | 18.6 / 46.2 % | 0.2 % | 0 | 0 | 4/8 (21.3 s); 6/8 (6.9 s) |
| Turf War 3:00 #5 | 20.9 / 43.4 % | 0 % | 0 | 0 | 5/8 (20.0 s); 8/8 (8.5 s) |
| Turf War 1:00, `PAGEQ='era=3'` | 18.4 / 26.9 % | — | 0 | 0 | held in era 3: no jumps |
  - At every flip of these matches: 0 bots on a vanishing top; inside an appearing piece 0, except the one above.
  - Bot-seconds in an appearing box before its flip: ≤ 0.27. eras-bots live (1:30): 0 / 0 / 0, era-3 median 8.4 s.

## 4. Tests (local, at the final code unless marked; `local-logs/fr1/`)

| Test | Result |
|---|---|
| eras-jump | in three runs (the full run died at the 900 s watchdog after a GPU hang at load ~250): **first** 0/1 twice — its deterministic half passes (programs 151 → 151, J − 21 … done + 1.5), its timing half missed (the warning frame's era update 11.2 / 16.8 ms against 10, at loads ~270 / ~400); **A** (sched, flip, fall, shove, rescue, device, zip, guard) 14/14; **B** (fx, frames, sky, modes) 9/10 — the miss is review fix 1's 50 ms cap (one 90 ms frame, 6.2 ms of it the era update); the negative control without this round's fixes: 1/3 |
| eras-hud | 11/11 (new: the done ping and the opened floor); reruns at loads 300–450: 9/11, 10/11 (review 2's two layout checks: §0) |
| eras-world | 18/19: new part 3 check passes; the miss is part 4's nav ×3 timing, 725 ms against 700 at load ~150 (engine phase 624–699) |
| eras-static | 23/23 (11 new: rules 18, 22 ×2, 23, 26, 29, 30, 39 ×2 planted, and the stage as built) |
| eras-look | 12/12 |
| eras-modes | 6/6 |
| eras-bots | 5/5 |
| eras-karp | 5/5 (B: SKIP) |
| net-eras | unlagged 14/14 (load ~150), 12/14 (load ~400); lagged 7/8 ×3 (issue 4's table) |
| tower-check `ERA=1/2/3`, `PAGEQ='era=3'` | clean, each in its own era (issue 2) |
| harness `ERA=all`, `ERA=2` + `PAGEQ='era=3'` | stop at boot with their HARNESS line |
| check-maps | bluestone ok (the new rules; one accepted, printed); the repo's only failure is halyard's 25.7° ramp |

Regressions (`local-logs/fr1/`):

| Test | Result |
|---|---|
| stage-mods | 36/36 |
| net-stagemods | 8/10, 9/10 with its old read-a-round-trip-apart measure (loads 150–200); 10/10 with the same-wall-time measure (load ~400) |
| net-stageclock | 3/3 |
| net-turf | 9/9 |
| net-practice (CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1) | 29/29 |

**Pictures** (`out/engine/`, all looked at): this round's `fr1-jump1-lane-done+0.5`, `fr1-minimap-done+0.5`,
`fr1-jump2-wagon-done+0.5`, `fr1-minimap-era3-done+0.5`; the second half's set (`prebell-phone`, `jump1-knee-*`,
`jump1-quay-*`, `pulses-warn`, `mural-hoki-*`, `mural-seams-era3`, `timelapse-sky-*`, `jump2-quay-*`, `minimap-era*`,
`tabmap-era*`, `bot-on-halo`, `rescue-garden-*`, `lightmap-probe`) is unchanged.

## 5. Commits; files
**This round:** 8a0197cf (issues 1, 3), 7d5ff94d (issue 2), d34dba7f (issue 6, check-maps), 09015066 (issue 7),
7aa5b49d (issue 6, eras-world), 389214df (issue 4), cb082883 (issue 5), 0b662a92 (the shove's who; the opened floor
brighter), 74515131 (net-stagemods' measure); scratch 81a60645 (pictures, the shots tool, the karp patch) and the commit
carrying this report and `local-logs/fr1/`. **The second half:** 5aa9068b, 59789c95, 0cd06847, 82b103ac, 3f91bc2b,
1cd31873, c2c676ce, 1d60e8f4, cd62e353, a764f6fe, 1cd5e1d7 (the bake), 268c007c; scratch cc6aa6ea, 74dc1672, 513a7533,
59ddfd12, 7468a1b8.

**Shared files, for the integrator (each change small and tagged):**
- `src/net/netmatch.js` **(new this round):** `_lead()` and the clock tick's two ends (`_sendTick`'s `msg.c`,
  `_hostClock`) [b5-eras].
- `src/game/stageMods.js`: `karpStates` in R_HOOKS plus one query method [b5-eras].
- `tools/botlab/offscreen-boot.cjs` **(this round):** the `ERA=` mapping and stop [b5-eras].
- `tools/botlab/match.cjs`, `tools/botlab/tower-match.cjs`: `RESULT_JSON.eras` and the `ERAS` lines (this round: the
  start era, who was inside an appearing piece) [b5-eras]; `tools/botlab/tower-check.cjs` **(this round):** its `ERA`
  line [b5-eras].
- `tools/botlab/tests/net-stagemods.cjs` **(this round):** its clocks compared at the same wall time [b5-eras].
- `docs/NET.md` (the eras paragraph, the clock's trip), `docs/STAGE-MODS.md` (H14, H17, PAGEQ / ERA),
  `tools/botlab/README.md` (ERA / PAGEQ).

**Module and stage files:** `src/game/eras.js`, `src/fx/eraFx.js`, `src/world/eras-data.js`;
`src/world/stages/bluestone/{layout.js (this round: eras.accept), murals.js}` — no geometry change;
`assets/lightmaps/bluestone.{png,json}`.

**Tests:** `tools/botlab/tests/eras-{world,look,jump,hud,bots,modes,karp,bake}.js`, `eras-static.mjs`, `net-eras.cjs`.

## 6. What the art phase must know
- **The module's API.**
  - The world `G.eraWorld` (EraWorld): `names`, `uniforms` (`uEra`, `uEraW`, `uEraTint`, `uEraRemap`, `uMurEra`, `uEraColA`,
    `uEraColV`, `uEraT`, `uEraFar`), `groups`, `meshes`, `propMeshes`, `fx` (EraFx: `setJump`, `setOpened`, `update`),
    `stats`; build hooks `prop`, `colliders`, `attachLevel`, `attachPaint`, `levelMaterial`, `levelFilter`, `afterMeshes`,
    `buildNav`, `attachMinimap`, `mapBlock`, `attachEnv`, `ready`; `apply(e)`, `looks`, `inkOk(b, et)`, `present`, `now`,
    `bakePasses()`, `bakeMode`, `dispose`.
  - The runtime `G.match.eras` (StageEras): state `sched`, `era`, `phase`, `next`, `front`, `fresh`; queries
    `eraAt(r, t)` / `eraAtPoint`, `eraInForce`, `jumps`, `present`, `inkOk`, `near`, `splatTime`, `dangerAt(pos, pad)` /
    `danger`, `outlines()`, **`pings()`**, `restMask(era)`, `karpStates()`; hooks `goalWeight(id)`, `botAct`, `drawMap`;
    `update`, `seek(t, why)`; tests and audits `state()`, `botReport()`, `debugJump(to, { inS, instant })`, `dispose`.
  - Events: `era:prebell / warn / ring / jump / flip { group, on, off, r } / done { era, snapped? } / set`; per device pop,
    `device:down { how: 'flip' }`.
  - Audit switch: `?era=n` (`PAGEQ='era=n'` or `ERA=n` on the harnesses). Test switches: `E.noDanger`, `E.noPrepos`.
  - Layout data this round: `eras.accept.rule22` (check-maps' accepted exceptions, printed every run).
- **Era meshes.** One level mesh per mask, `level:era<m>` (+ grate twins):

  | Mask | Eras | Pieces |
  |---|---|---|
  | 1 | 1 only | the Degrayling crates |
  | 3 | 1–2 | the cab-shelter top, the boat shed, the ferry booking office (2 halves), the goods wagon |
  | 4 | 3 only | the Halo (16 sides, 36 rails, 12 planters), the hotel / boat / river stairs, their landings and glass, the bike dock, the floating garden (12 tiles, 10 planters) |
  | 6 | 2–3 | the Iron Bridge (6 spans, 12 rails, the lamp), the café tables |

  The tram block is a shared hidden collider; its three looks are props.
- **Prop buckets** `props:<material>@e<mask>`; era props are static merged parts, ≤ 5 materials per mask (rule 40).
- **Material tags:** the level program key ends in `-eras`; era prop materials `…|era-aTag`; shadows `era-depth-aEra` /
  `era-depth-aTag`; backdrop era sets `|eraset`; `aEra` = (mask, r_g) on every level vertex; `aTag` on era props.
- **Highlight colours:** `eras.colors.appear #f4e9c8` (holograms, wires, beads, the outlines' dashes, the done pulse,
  **the opened floor, the minimap ping**, the front line, the bell glyph, the HUD chip and callouts); `eras.colors.vanish
  #a9a49a` (the hatching, the warning's film tint); the curtain's foot brass `#c79a4e` (jump 1) / pearl `#e9ecf2`; never a
  team ink.
- **Sound cues** (`src/audio/sfx-eras.js`): `era_bell`, `era_ring`, `era_kiosk`, `era_pickup`, `era_swell`, `era_front`
  (a loop riding the front), `era_pop`. `era_strike` is registered but unused (no striker clock prop yet).
- **Bake passes:** `W.bakePasses()` is `[apply(1), apply(2), apply(3)]` into R / G / B; keys `bluestone`,
  `bluestone.tower`, `bluestone.boss` (and `bluestone.bazookarp` once the karp kit adds its pieces). Re-bake after any
  collider change.
- **check-maps' new rules** (issue 6) will judge the dressing: rule 22's routes, rule 23's overhead deck edges (a gap
  over 2.05 m fails), rule 29's swaps, rule 39's slots. Dress the stage and run check-maps and eras-world part 3 (the nav
  nodes against appearing pieces, prop colliders included).
- **Left to the art pass:** jump 2's hexagonal-shard curtain; a softer dissolve than the 20 cm blocks; real overhead
  wires; murals 5 and 10; the striker clock's prop; era ambiences; the GPO clock; the curtain's brass foot against
  Tangerine ink.

## 7. Unfinished, flaky or uncertain
- **The Mac mini.** The task says unavailable; COMMON.md in the worktree (uncommitted, the lead's) says it is back. I
  followed the task: nothing pushed. JOB-6.sh (frames and 'first' ×3, the perf / load REPORTs beside Halyard, net-eras
  unlagged and lagged) is the quiet-machine job; JOB-4.sh and JOB-5.sh (blockout-era jobs, never ran) now say `PAGEQ`.
- **Frame-time and load budgets are still unproven on a quiet machine** (issue 5). This Mac ran at load averages of
  130–450; the timing halves of 'first' and 'frames' and eras-world part 4's nav timing missed their caps here while
  every deterministic half passed.
- **Rule 22's accepted exception** (the Halo's 225° side 3.66 m over the balcony stair's corner) is the lead's to keep or
  lever away.
- **The online clock under lag** (issue 4): flips within 0.08–0.2 s at loads of 130–280, 0.5 s at ~400 where both pages
  lost half their clock time to stalled frames. The compensation removes the follower's old trailing cushion, so a host
  stall now shows as the follower briefly ahead instead of always behind. JOB-6's lagged run on a quiet machine decides
  it; the next lever is the clock tick at 20 Hz.
- **Two eras-hud layout checks from review 2** fail intermittently at loads of 300–450 (§0); unchanged code.
- **One era shove** in five Turf Wars this round (§0, "Found while testing"); the next balance pass's `ERAS` lines name
  who and how.
- **Bazookarp part B has never run**; the karp package needs `karp-anyValid.patch`.
- **Bots on the Halo and on jump 1's new ground** vary widely run to run; no change this round (issue 7).
- **No balance sets were run** (the lead's consolidated pass); the Halo-dominance check is still risk 16.
- **The lightmap is baked for this geometry.** Any collider change makes it stale (the loader warns and skips it).
