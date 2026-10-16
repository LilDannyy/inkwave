# Bluestone Junction — engine phase, second half, after the final review 2's fix round 2 (LEAD-REPORT)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. This round answers the independent final review 2
(`LEAD-REVIEW.json`, verdict **redo** on one narrow point — the online clock — and six minors) of the second half at
09f67e9e. Round 1's report is `git show 09f67e9e:tools/botlab/jobs/batch5/stages/bluestone/LEAD-REPORT.md`; the second
half's own is at 7468a1b8, the first half's at d99607dd. Everything below the issue list is the report brought up to
date (§1–§7).

How it ran: everything on this Mac, one Electron of mine at a time under the shared SLOTS=3 lock, at load averages of
10–290 (most runs at 10–40: quieter than round 1). The task says the Mac mini is unavailable; COMMON.md in the worktree
(uncommitted, the lead's, dated 10-16) says it is back. I followed the task: nothing pushed, nothing sent; JOB-6.sh (for
the record) now also carries this round's clock test and GPU probe (§7). The task also said a previous fixer of this
round had been cut off with uncommitted edits on top of 8768f720: the worktree held none (head 09f67e9e, clean but for
the lead's COMMON.md), so there was nothing to recover; this round starts from 09f67e9e.

Logs: `tools/botlab/jobs/batch5/bluestone/local-logs/fr2/` (`summary.txt` lists every run with its start load and
result). Pictures: `tools/botlab/jobs/batch5/stages/bluestone/out/engine/fr2-*.jpg` (all looked at).

## 0. The final review 2's issues

### Issue 1 (major) — a follower's match timer stepped backwards on a laggy connection; the final countdown could fire a second twice. **Fixed.**
- **Cause, as the review said:** round 1's `_hostClock` moved a follower's `m.time` halfway to the host's (trip added
  back) past a 0.05 s band, in both directions. The trip's jitter alone crossed the band, so the clock stepped *up*
  several times a minute; across a whole second the HUD showed it again and, inside the last 10 s, `match.js` re-fired
  `match:count` (`c !== lastCount`).
- **Fix (`src/net/netmatch.js` `_hostClock`, `src/game/match.js`, 71254eaf; [b5-eras]):** the match clock only ever runs
  on.
  - Behind the host: a step halfway forward, as before (a step forward never re-shows a second).
  - A little ahead (≤ 1.5 s: the jitter, a stall on this screen, a stalled host): no step back. `_hostClock` sets
    `match.clockSlew` to the error and `match.js` gives it back by running the countdown slow, at `1 − min(0.5, 0.1 +
    err)` (0.9× for a tiny error, 0.5× for 0.4 s and more), recomputed on every tick.
  - Only a resync of more than 1.5 s ahead (a long host stall) steps it back.
  - `match.js`: `match:count` fires only for a second below the last one, so even a resync never repeats a number.
  - Found on the way: once the host's clock runs out (overtime holds it at 0), the trip taken off pushed a follower's
    clock below 0 (Zone Control / Tower Command overtime; the HUD clamps it and the stage clock ignores a clock at 0, so
    it was harmless, but wrong). The correction now stops when the host's time is 0 (0a848ffd).
- **The test (`tools/botlab/tests/net-clock.cjs`, new, the review's probe made a test):** two clients, a 1:30 Turf War on
  Halyard at `netlag=150&netjitter=50`. Each screen logs, every frame, its match clock with the wall clock, each count and
  each change of the HUD timer's text. On the guest, right after its 6, a host tick saying it is 0.3 s ahead is injected
  (the review's case, made certain). Four checks: the guest's clock never goes up between frames; the HUD's second never
  goes up; 10 … 1 once each, in order, on both screens; the guest within 0.15 s (median) and 0.25 s (p90) of the host
  at the same wall time.

  | Run | Result | Steps up | HUD / countdown | Guest vs host (median / p90 / max) |
  |---|---|---|---|---|
  | fixed, no injection (load ~15) | **4/4** | 0 in 5,410 frames | 91 seconds shown, none twice; 10 … 1 | 0.014 / 0.041 / 0.224 s |
  | fixed, with the injection | **4/4** | 0 in 5,394 frames (the injected tick: 5.996 → 5.996, slew 0.3 s) | 10 … 1 | 0.019 / 0.056 / 0.229 s |
  | fixed + the overtime guard, with the injection | **4/4** | 0 in 5,384 frames | 10 … 1 | 0.021 / 0.073 / 0.476 s |
  | fixed, clean link, with the injection | **4/4** | 0 in 5,444 frames | 10 … 1 | 0.012 / 0.045 / 0.202 s |
  | **the code before**, no injection | 2/4 | 24 (up to 0.25 s) | **0:19 → 0:20** | 0.025 / 0.114 / 1.33 s |
  | **the code before**, with the injection | 2/4 | 15 | **10 9 8 7 6 7 6 5 4 3 2 1** | 0.021 / 0.047 / 0.22 s |
- **Re-run** (all after the fix and the guard, loads 9–25): **net-eras 14/14** (flip skew max 0.03 s; the stage clocks
  at the same wall time median 0.04 s, p90 0.08 s); **net-eras lagged 8/8** — its first clean lagged run (flip skew max
  0.029 s; clocks median 0.024 s, p90 0.041 s, max 0.106 s; the review's: 7/8, p90 0.257 s through a 1 s host stall);
  net-turf 9/9, net-stageclock 3/3, net-stagemods 10/10, net-practice 29/29.

### Issue 2 (minor) — Practice's rewind rescued a kid onto pieces that vanished a moment later (hops across the river). **Fixed.**
- **Cause, as the review said:** `_rescue` took the nearest node valid in the era *in force* (until done, the era before)
  whose floor stood now — a span or tile the front had not reached yet.
- **Fix (`StageEras._rescue` / `_shove`, 9919c37f):** `_flip` passes the group's new era. The rescue takes the nearest node
  within 10 m whose floor stands now and that is **valid both in the era in force and in the new era** — ground no flip
  of this jump takes away; failing that, one valid in the new era with the body fitting now; failing that, the old rule.
  Candidates are tested nearest first, so the ground probe runs on a handful of nodes (it ran on every node closer than
  the best so far). `_shove`'s nav fallback takes nodes of the new era too (ground that stays first).
- **Proof (`tests/eras-jump.js` 'rescue', the review's probe as a check):** a kid on each of Alpha's 9 Iron Bridge spans
  and floating-garden tiles, put there 0.12 s before its flip in the rewind: **9/9 rescued once**, alive, on dry land, on
  a node valid in era 1 (rescue part 4/4 with shove and the roof branch). **The rule before** (negative control, the same
  test): 3/9 once, 6 rescued 2–4 times (garden-11: four hops, −28.5 → −33.5).

### Issue 3 (minor) — the chip's "TIME JUMP!" was white-gold on white-gold for the whole jump. **Fixed.**
- **Fix (`src/fx/eraFx.js` CSS, 0a1c57fa):** under `.er-chip.is-jump` the label is `#2a2418` at full opacity, the unlit era
  names and dots dark brown, the bar a dark track with a dark fill.
- **Proof:** `tests/eras-hud.js` (new check): at J + 0.3 the label's colour against the chip's settled background is
  **12.71 : 1** (≥ 4.5), opacity 1, the bar 12.71 : 1 — 12/12 twice. The CSS before: **1 : 1**, opacity 0.9 (fails). The
  check reads the chip with its 0.2 s background transition off (a stepped test does not wait for wall-clock
  transitions; the first try read the dark chip mid-transition).
- **Pictures** (looked at): `fr2-jump1-knee-J+1.5.jpg` (the jump 1 frame with the HUD: the chip under the clock reads
  "1880s · TODAY · 3000s ━━ TIME JUMP!" dark on cream, the big "TODAY" banner below) and `fr2-chip-J+1.5.jpg` (the chip
  cropped, 2×).

### Issue 4 (minor) — frame budget unproven; render spikes recur at the same moments; the rewind's era update reached 21 ms. **The spikes traced to the test's set-up and the minimap's swap at done; the module's own work under 8.4 ms everywhere; the quiet-machine run still owed (JOB-6, for the record).**
- **The Mac mini:** not used (the task). JOB-6.sh now also runs net-clock lagged and the GPU probe.
- **What the review asked for, run here** (`tools/botlab/jobs/batch5/bluestone/probe-gpu.js`, `probe-gpu.log` at load
  30–75, `probe-gpu2.log` at ~8): every rendered frame of jump 1 and of the kept world's 3 → 1 at sunset, timed on the
  wall clock with `gl.finish()` after it (CPU + GPU, synchronous) and with a GPU timer query, as is and with the curtain
  hidden, the holograms hidden, the env rebuild skipped.
  - **The GPU timer is not usable here:** ANGLE / Metal on a GPU shared with other Electrons reports more than the
    finished wall time (no-jump baseline: 2.8–3.7 ms median finished, 17.5 ms "GPU"), and back-to-back PMREM rebuilds read
    13.6, 23.5, 32.2, 40.8, 49.4 ms — a counter, not a cost. The finished wall time is the measure below.
  - **The PMREM rebuild at done + 0.7 is cheap:** `env._rebuildEnvMap()` alone, finished, 0.3–0.7 ms; the next frame
    3.1–4.9 ms. Frames from done + 0.6 to done + 0.9: ≤ 10.8 ms in every run (one 17.2 ms frame once, 12 ms of it era
    update; 0.5–0.8 ms in the 3 → 1 runs).
  - **Synchronised, the curtain and the holograms cost nothing visible:** frames J + 1.0 … 1.6 ≤ 8.1 ms as is (probe-gpu2:
    ≤ 6.8 ms in all four variants). Spikes over 40 ms in the first probe landed at different moments in each variant,
    each with one suspect removed. (A 300–530 ms frame at J ± 0.03 in all four 3 → 1 variants follows the probe's own
    switch of the time of day in mid-page, which a match never does.)
- **The recurring spikes, traced** (`probe-spike.js`, `local-logs/fr2/probe-spike-*.log`: 'frames' set-up replayed, each
  draw call timed):
  - Each spike is **one draw call blocked for 50–580 ms — on any object** (a plastic prop, a kid's cloth or eyes, ink, the
    level), with **no program compiled and no texture or geometry uploaded** in the frame, and no flip in it. The
    callouts off, or the HUD hidden, leave them (6 runs).
  - They come from the **set-up**: it rebuilds the minimap's era bases (~0.1 s of 2D raster each: the Bravo side flip,
    the time-of-day change) and the jump started in the same breath, with no warning; the jump's draws then queue behind
    the GPU process's backlog. As is, 3 of 4 runs spiked (Bravo 2 → 3: 19–80 ms at J + 0.25–0.45, the review's J + 0.35;
    3 → 1: 22–62 ms at J + 1.0–1.45, the review's J + 1.37–1.5). **With 1 s of play and 1.5 s of wall time between
    set-up and jump, 4 of 4 runs had no frame over 11.2 ms.** In a match the bases are rebuilt while it loads ('modes'
    holds that) and every jump comes after a 20 s pre-bell, so 'frames' now waits like that (4d704933): its two jumps
    3/3 (worst 13.8–32.3 ms; era update ≤ 8.0 ms).
  - **What remains — the frames after done:** jump 1's own check (unchanged) passed in 2 of 3 runs (worst 35.2 / 19.9 ms);
    the third had three frames of 121–196 ms at done + 0.17–0.36 (era update ≤ 0.1 ms in them), like the review's three
    after done. With the minimap's era work switched off (no base swap at done, no ping) the done + 0.2 … 0.6 window was
    2.3–3.2 ms in 4 of 4 runs, against 2.2–11.2 ms with it (elsewhere in those runs the machine's own spikes still came:
    343 ms once at J + 1.43). The minimap's cached swap (`minimap.js setBase`, the
    stagehooks package's file) sets `version = −1`, which forces a full-canvas ink redraw (a 588 × 1120 `putImageData`)
    in the same frame as the new base; banding it like the ordinary ink updates is the lever — a one-line change in a
    shared file, for the integrator or the quiet-machine run to decide. I did not change it.
- **The era update (the module's whole per-frame work):** 'first' on a fresh page (cd15a047 prints its five costliest
  frames): the warning frame 8.3 ms (callout 3.0, ring 2.5, sound 2.6), J 4.8 ms, nothing else over 2.4 ms; 'frames'
  ≤ 8.0 ms; the probes' 3 → 1 runs ≤ 5.2 ms. The review's 21.2 ms did not repeat in 13 measured rewinds (max 8.0 ms); the rescue's
  ground probe now runs on a handful of nodes (issue 2).
- **Programs:** 149 → 149 through the first jump ('first'); 0 compiled in any spike frame.

### Issue 5 (minor) — STAGE-MODS.md said the frozen-front stage-art switch existed; it did not. **Built.**
- **Fix (`src/game/eras.js` `auditFront` / `StageEras.freeze`, `tools/botlab/offscreen-boot.cjs`; 99cea4d9, 26960f05):**
  - `?erafrom=a&erato=b&front=r` starts the match in era a and holds it mid-jump: every group with r_g ≤ r in era b, the
    rest in era a (solidity and paint cells as that era's), the shader's front at r (`uEra` = a, b, r), both eras' meshes
    up, the curtain and the holograms at r. Each frame re-applies it and runs nothing else (no event, flip or jump); a
    clock snap re-freezes; `debugJump` lets it go. `StageEras.freeze({ from, to, front })` does the same from a script.
  - **From the pictures:** the first shots caught two groups inside the 0.3 s dissolve band as pixel towers; a still now
    holds the dissolve width at 0.01 m, each piece whole on its side of the front.
  - The sky stays era a's (no time-lapse: the art's light is its time of day's).
  - The harness: `ERA_FROM=a ERA_TO=b FRONT=r` is `PAGEQ='erafrom=a&erato=b&front=r'` (a `HARNESS` line says so); not all
    three, a = b, a bad number, or with `ERA` / a `PAGEQ` era stops it at boot.
  - docs/STAGE-MODS.md T3 and tools/botlab/README.md say how.
- **Proof:** `tests/eras-jump.js` 'freeze': 38 groups inside r 30 in era 2, 14 outside in era 1, all solid as their era;
  `uEra` (1, 2, 30); the curtain at r 30; 5 s of clock and a clock snap change nothing (0 flips); `debugJump` lets it go —
  2/2 by the call, 2/2 twice with `ERA_FROM=1 ERA_TO=2 FRONT=30` (the page loaded frozen). `ERA_FROM=1 ERA_TO=1` and `ERA=2`
  with `ERA_FROM` stop at boot.
- **Pictures** (stageart.cjs, the layout's `art` camera, looked at): `fr2-stageart-day-1to2-r30.jpg` (DESIGN §5.8's day
  art: the brass-footed curtain ring at r 30 round the dome, the boardwalk and the bridge inside) and
  `fr2-stageart-dusk-2to3-r30.jpg` (the dusk art: the Halo, the light masts and the stairs inside the pearl ring, the
  holograms of the floating garden still outside it). Blockout geometry: the art phase dresses it and picks the final
  framing (`STAGES=bluestone ERA_FROM=1 ERA_TO=2 FRONT=30 … stageart.cjs` keeps the day picture, `2 → 3` the dusk one).

### Issue 6 (minor) — the end-of-match beat (DESIGN §3.10) is neither built nor listed. **Listed for the art phase (§6), with what it needs.**
- Not built; the lead's to keep or cut (it touches no play and can be cut with no other change, DESIGN says). What it
  needs, so the art phase can cost it: a hook at the whistle while the results camera still shows the stage (`match:state`
  'finish' → 'judge'; the stage clock stops at 'finish', so the beat runs on its own 2 s timeline); a fourth look, the
  dead future (the sea at the rooftops: the water's height is environment.js's, shared, and a dead-sky theme overlay); an
  *inward* rewind wave (the shader's front runs outward only: an inward front needs the side test flipped); Tartar's two
  lines ("…So that is how it ends." / "Returning to the Professor.") through the module's own callouts. Today the
  Professor's lore reaches a player only in the pickup lines and the blurb.

### Issue 7 (minor) — bots rarely take jump 1's new routes. **Left to the balance pass, as the review says; the cause measured.**
- **Why jump 1 and not jump 2:** the fresh ×2 weight multiplies a paint goal's score, but a bot's paint goal is the best of
  **28 random draws** from `nav.validIds` within 38 m (`bots.js _pickPaintGoal`). Jump 1 makes **150 of 4,958** valid
  nodes fresh (3.0 %): a 28-draw sample holds even one of them 58 % of the time, and it must then win on paint and
  distance. Jump 2 makes 952 of 5,844 fresh (16 %): 99 %. That matches the review's numbers (jump 1: 2–3 of 8 within 30 s;
  jump 2: 7–8 of 8) better than the weight does (`probe-gpu.log`, its first row).
- **The lever for the balance pass:** draw a few of the 28 from the fresh nodes for the 30 s after done (a registry hook
  beside `goalWeight`, one small [b5-eras] line in `_pickPaintGoal`), or the review's goal bias toward `J.vanish`'s
  footprints. Not changed here: bots.js is the bots package's, and the review carries it to the lead's consolidated pass.

### Found while testing
- **The overtime clock** (issue 1's last bullet): a follower's clock went below 0 in overtime since round 1's trip
  compensation. Guarded (`time > 0`, 0a848ffd).
- **eras-bots' live era-3 check** failed once in four runs (4 of 8 bots on era-3 ground, so the median over the bots is
  "never"); the other three: 8/8, medians 6.1, 7.7 and 11.6 s, the Halo 13.8–31.5 bot-s. Bot variance (issue 7's
  measure); no code this round touches bot goals.
- **eras-bots' pre-position control** failed once: the control bot went round by the GPO terrace as it should and walked
  through the opened lane 5.6 s after reaching the quay, on its next errand. The check now takes the lane only on the way
  (49a38128); 5/5 and 1/1 since.
- **eras-hud's two layout checks from review 2** (review fix 5's and review 2 issue 3's) each failed once in five runs
  (the first at load ~100–290, the other in the old CSS's control run): the era band was measured during its own 0.18 s
  `top` transition, overlapping the gameplay callout. Unchanged code; reported, not loosened.

## 1. What was built (the second half), against the user's words
The user: "a full map effect plays that simulates going forward to the current time, which changes how the map looks
and opens up new routes … 3000s … adds new areas"; Tartar "an old telephone".

**Bots (H16, H16b; `eras.js`, `match.cjs`, `tower-match.cjs`, `tests/eras-bots.js`).**
- **The danger layer** (first half) runs from the warning to done, with a control run (`E.noDanger`): four bots whose
  every paint goal is on the Halo stand on it when the rewind is warned; with the layer none is on it at its flip, without
  it all four are.
- **Replans at done** are counted. A route over a vanished piece is dropped; a street route is kept.
- **Fresh nodes ×2** as paint goals for 30 s after done; each bot's time to first stand on new ground is recorded per
  done (`botReport().visits`). Why it rarely bites at jump 1: issue 7.
- **H16b, pre-position: built, but it only waits when waiting pays.** From J − 8 (looked at again until J − 0.5), a
  paint-mode bot within 14 m of a gate that opens takes the coming era's route through it and waits 3–6 m short of the
  gate, outside the danger layer, until the gate's own flip — only when the route through the gate gets there no later
  than the detour, give or take 1.5 s.
- **Perches: no new code.** The Halo's and the balconies' nodes are valid in their eras and chargers already score high
  ground (`clamp(y, 0, 5) × 1.6`).
- **Statistics** (`StageEras.stats.bots`, `botReport()`, the `ERAS` lines): at each flip, own squidkids on a vanishing top
  and inside an appearing piece (with who and how); bot-seconds inside an appearing box before its flip (4 Hz); splats
  no weapon dealt within 4 m of a block that flipped in the last 2 s; replans and pre-positions; the era a match started
  in, and whether it was held.

**Fair (this round).** A squidkid left over the river is rescued once, onto ground no flip of the jump takes away
(issue 2); a shove's last resort takes a node of the new era.

**Online (H11; `tests/net-eras.cjs`, `tests/net-clock.cjs`, docs/NET.md).** Nothing new on the wire from the eras; the
host's clock tick carries its clock as at the relay, and a follower's match clock only ever runs on (issue 1).
- **A follower's clock snapping forward across a done still fires that done once** (`era:done { snapped: true }`): the
  fresh weight, the pulse, the opened floor, the callout if ≤ 2 s old. A late join and a test seek do not.
- net-eras covers, with two clients and a third for the late join: the flip skew and the two stage clocks; solid flags
  and the nav era after each done; a sprinkler and a Drip Curtain on a vanishing piece; the Iron Bridge's cells through
  its guard window; the results; a host change between the jumps; Practice's clock; a late joiner in era 3; the rewind on
  all three screens; and the lagged run. net-clock: the match clock under lag in any mode.
- Bluestone is a stage under construction, so the room lists it only with `?wipstages` (`URLQ=wipstages`).

**Every mode (`tests/eras-modes.js`, tower-check).**
- **Zone Control:** each zone's cells are identical (the same ids, all live) before and after each jump on the real
  5:00 schedule.
- **Overtime:** 40 s of stage clock past regulation with no event and no flip.
- **Boss Battle:** in era 2, with no event in 60 s. BossNav's ring is 352 m²; an era-3 BossNav built for the record walls
  the circus, so a change of `fixed` fails the test.
- **Practice's rewind:** a kid on the floating garden is rescued to the quay once; a kid on the Halo drops alive to the
  circus.
- **The menu backdrop (attract):** a jump every 40 s through the rewind, with no chip, callout or era sound.
- **tower-check in every era** (round 1, `ERA=1/2/3` and `PAGEQ='era=3'`, each printing the era it ran in): 73.99 m both
  sides, 0 holes, clearance clean, both rides a knockout; the review re-ran it clean in each era.

**Bazookarp (H21, 12b; the karp module is not merged).** On the era side:
- `StageEras.karpStates()` returns `[{ key: 1…3, nodeOk(id) }]`, forwarded as `G.match.stage.karpStates()`.
- `restMask(era)`: a node valid in the era in force and every later one. `danger(pos, 0)` covers the drop spot.
- `LAYOUT.bazookarp.statesAdvance = true`. The karp engine switches its field on `era:done`.
- `tests/eras-karp.js` part A drives a stand-in built and fed exactly as karpField builds and feeds its own (5/5); part B
  runs on the real KarpField once a bazookarp match builds `match.karp` (SKIP here; never run).
- **Integration:** `karp-anyValid.patch` (round 1's issue 8; still not on b5-karp-bots).

**The EraFx dressing (12c).**
- **Pre-bell (J − 20):** one distant ring (`era_bell`) that also shows: Tartar's single shake, the kiosks' bells. The clock
  rows count down (centre hands gold), the chip shows "TODAY in 20".
- **The warning:** the holograms are up within 0.6 s; the wire beads run along faint drawn wires out from the dome.
- **The jump:** the chip turns white-gold with "TIME JUMP!" dark on it (issue 3).
- **Done:** the new pieces pulse white-gold (the level shader); the opened floor is outlined and pulses with them, and
  the minimap pings what changed.
- **Mural era masks:** `stages/bluestone/murals.js` draws 4 (the hour ring), 6 (the café mural, eras 2–3), 7 (Hoki Lane's
  street art, eras 2–3), 8 (the tram stop markings, era 2), 9 (the ghost sign, era 1), 11 (the 3000s' light seams, era 3).
  The front paints each in or out as it passes.
- **`eras.colors` on every highlight;** the warning's film tint is derived from `colors.vanish`'s hue.
- **The time-lapse** is tested (the sun swings, the clouds race, exposure and the grade held); the env map is rebuilt
  once at done + 0.7.
- **The frozen front for the stage art** (issue 5): `?erafrom=a&erato=b&front=r` / `ERA_FROM` `ERA_TO` `FRONT`.

**The bake (T1).** `bake.cjs bluestone`: states 1, 2, 3, one RGB PNG (committed); stage-audit with `PAGEQ='era=1/2/3'`
says "lightmap applied" 3/3 in each; eras-bake 3/3. No collider changed this round, so the bake stands.

**Performance** (engine phase, Halyard measured on the same machine at the same time; on high): draw calls 268–339 against
Halyard's 330 / 400, triangles 0.64–0.87 M against 3.37–3.52 M, cpuRender 4.0–6.9 ms; load 7,186 / 7,550 ms against
Halyard's 8,778 / 8,005 ms (the review, alternated). Quiet-machine frame times: issue 4.

## 2. Decisions where the request left a gap
1. **H16b waits only when waiting pays** (arrival through the gate no later than the detour + 1.5 s), and it walks at the
   gate's own flip, not at done.
2. **Perches:** no new weight (risk 16).
3. **"Every bot … within 20 s (median)"** is the median over the bots; a bot that never reaches new ground counts as never.
4. **The pre-bell shows its ring** (Tartar's shake, the kiosks' bells) as well as playing it.
5. **Holograms at full strength 0.6 s into the warning.**
6. **Wires drawn under the pulses** (FX); the real overhead wires are the art pass's.
7. **The era band clears the HUD's banners.**
8. **A snapped done fires its event** (and lights the opened floor).
9. **Murals on the Z's faces** (DESIGN §5.4 updated); 5 and 10 left to the art pass.
10. **The bake is committed** (one key); the art phase re-bakes all keys.
11. **`statesAdvance: true`** in the Bazookarp data.
12. **A device on a vanishing piece ends as the subs SPEC's "crushed"** (`[2, gid, 2]`, the crunch).
13. **The rule-22 check's "route"** is a walkable top ≥ 2 m across both ways; the one Halo clearance under 4.0 m (3.66 m)
    is accepted in the layout's data and printed on every run.
14. **Rule 23 applies to overhead decks**, with ≤ 2.05 m open runs counted as drop gaps.
15. **The opened floor at done is outlined, not filled solid.**
16. **The clock compensation is in netmatch, for every mode** (the match clock), not in the era module only.
17. **(This round) The clock runs slow to give time back, never back:** at 0.9× for a hair, down to 0.5× for 0.4 s or
    more (a timer second lasting up to 2 s for about a second, after a host stall); only a resync over 1.5 s steps back;
    the countdown never repeats a number even then.
18. **(This round) A rescue prefers ground valid before and after the jump** over the nearest node of the new era alone
    (a node of the new era can still stand inside a piece the front has yet to take).
19. **(This round) The frozen front is a still:** pieces whole on their side (no mid-dissolve), the sky the earlier era's,
    the curtain and holograms shown; the clock never moves it.
20. **(This round) The end-of-match beat (§3.10) is not built;** it is on the art phase's list for the lead to keep or cut.
21. **(This round) Bots' jump-1 lever not pulled:** the cause is measured (issue 7), the change is the bots package's and
    the balance pass's.

## 3. Online and bots
- **Online:** no records were added. The era state is a pure function of the host's stage clock.
  - **The clock:** the host's tick carries its clock as at the relay; each follower adds back its own half of the trip,
    steps forward when behind and runs slow when ahead (issue 1); no correction once the host's clock has run out.
  - **Splats:** field 15 (the painter's time) from J − 1 to done + 1; every screen judges the guard at that time.
  - **Own actors:** each screen shoves, rescues and pops its own squidkids and devices; a device's end record is
    `[2, gid, 2]`; a Zipline on a gone piece ends on every screen at its own flip.
  - **Followers:** a follower snaps to the host's clock (`seek('clock')`); a snap past a done fires that done.
  - **Late joiner:** applies the host's era on its first tick (`seek('late')`). **Host change:** the new host's clock runs on.

  docs/NET.md says so.
- **Bots** (local, this round; 3:00 Turf Wars at this round's code):

| Match | Result | Stuck | Era shoves | Splats by a jump | New ground within 30 s (median) |
|---|---|---|---|---|---|
| Turf War 3:00 #1 | 25.2 / 43.8 % | 0 % | 0 | 0 | jump 1: 3/8 (–); jump 2: 8/8 (3.2 s) |
| Turf War 3:00 #2 | 28.3 / 36.6 % | 0 % | 0 | 0 | jump 1: 1/8 (–); jump 2: 8/8 (9.9 s) |

  - At every flip of both: 0 bots on a vanishing top, 0 inside an appearing piece, 0 bot-s in an appearing box before its
    flip; 0 rescues. eras-bots (four runs): era-3 new ground 8/8 (medians 6.1, 7.7, 11.6 s) in three, 4/8 in one; the
    Halo 0–31.5 bot-s; jump 1's new ground 2–6 of 8 (issue 7).

## 4. Tests (local, at this round's code; `local-logs/fr2/`)

| Test | Result |
|---|---|
| net-clock (new) | lagged 4/4 ×3 (no step up in 5,384–5,410 frames; median 0.014–0.021 s), clean link 4/4; the code before 2/4 ×2 |
| eras-jump A (sched, flip, fall, shove, rescue, device, zip, guard) | **15/15** (new: the rewind chain, 9/9 spots rescued once); the rescue rule before: 2/3 |
| eras-jump B (fx, frames, sky, freeze, modes) | 11/12 before the settle (the Bravo / kept-world timing: 368 / 538 ms, the set-up's backlog: issue 4) |
| eras-jump 'frames', settled | 4/4, 4/4, 3/4 (the miss: jump 1's three frames after done, 121–196 ms; issue 4) |
| eras-jump 'first' | **1/1** (load 11): programs 149 → 149, the warning frame 8.3 ms |
| eras-jump 'freeze' (new) | 2/2 by the call; 2/2 ×2 with `ERA_FROM=1 ERA_TO=2 FRONT=30` |
| harness `ERA_FROM=1 ERA_TO=1 …`, `ERA=2` with `ERA_FROM` | stop at boot with their HARNESS line |
| eras-hud | **12/12** ×2 (new: the jump chip's contrast 12.71 : 1); the CSS before 11/12, 10/12 (1 : 1); a first run 10/12 (the check read the chip mid-transition — fixed in the check — and a review-2 layout check) |
| eras-world | **19/19** (part 4's nav ×3 timing passed) |
| eras-modes | 6/6 |
| eras-bots | 4/5, 5/5, 4/5, 5/5 (the misses: the live era-3 median once, the pre-position control once — §0 "Found while testing"); prepos 1/1 after its fix |
| eras-look | 12/12 |
| eras-karp | 5/5 (B: SKIP) |
| eras-bake | 3/3 |
| eras-static | 23/23 |
| net-eras | **14/14**; lagged **8/8** |
| stageart `ERA_FROM=1 ERA_TO=2 FRONT=30` / `2 → 3` | the day and dusk pictures (issue 5) |

Regressions (`local-logs/fr2/`):

| Test | Result |
|---|---|
| stage-mods | 36/36 |
| net-stagemods | 10/10 |
| net-stageclock | 3/3 |
| net-turf | 9/9 |
| net-practice (CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1) | 29/29 |

check-maps and tower-check were not re-run: no layout, collider or era data changed this round (eras-static, which runs
check-maps' era rules in Node, 23/23).

**Pictures** (`out/engine/`, all looked at): this round's `fr2-jump1-knee-J+1.5`, `fr2-chip-J+1.5`,
`fr2-stageart-day-1to2-r30`, `fr2-stageart-dusk-2to3-r30`; round 1's `fr1-*` and the second half's set are unchanged
(the chip in `jump1-knee-J+1.5`, `jump-swimston-J+3` and the others taken before this round shows the old ghost label;
`zones-warn-callouts.jpg` predates 268c007c, as the review notes — stale, not re-shot).

## 5. Commits; files
**This round:** 71254eaf (issue 1: the clock runs on; net-clock), 9919c37f (issue 2: the rescue), 99cea4d9 and 26960f05
(issue 5: the frozen front), 0a1c57fa (issue 3: the chip), cd15a047 (issue 4: 'first' prints the costliest era-update
frames), 0a848ffd (the overtime clock), 4d704933 (issue 4: 'frames' settles after its set-up), 49a38128 (eras-bots'
pre-position control); scratch: the pictures and tools (fr2-*, eras-shots2.cjs's ONLY=fr2, probe-gpu.js,
JOB-6.sh) and the commit carrying this report and `local-logs/fr2/`. **Round 1:** 8a0197cf, 7d5ff94d, d34dba7f, 09015066,
7aa5b49d, 389214df, cb082883, 0b662a92, 74515131. **The second half:** 5aa9068b, 59789c95, 0cd06847, 82b103ac, 3f91bc2b,
1cd31873, c2c676ce, 1d60e8f4, cd62e353, a764f6fe, 1cd5e1d7 (the bake), 268c007c.

**Shared files, for the integrator (each change small and tagged):**
- `src/game/match.js` **(new this round):** `clockSlew` (constructor), the countdown's decrement gives it back, and
  `match:count` only for a second below the last one [b5-eras].
- `src/net/netmatch.js`: `_lead()` and the clock tick's two ends (`_sendTick`'s `msg.c`, `_hostClock`: this round the
  slew, the 1.5 s resync and the `time > 0` guard) [b5-eras].
- `src/game/stageMods.js`: `karpStates` in R_HOOKS plus one query method [b5-eras].
- `tools/botlab/offscreen-boot.cjs`: the `ERA=` mapping and stop; **this round** `ERA_FROM` / `ERA_TO` / `FRONT` [b5-eras].
- `tools/botlab/match.cjs`, `tools/botlab/tower-match.cjs`: `RESULT_JSON.eras` and the `ERAS` lines [b5-eras];
  `tools/botlab/tower-check.cjs`: its `ERA` line [b5-eras].
- `tools/botlab/tests/net-stagemods.cjs`: its clocks compared at the same wall time [b5-eras].
- `docs/NET.md` (the eras paragraph; this round: the clock only runs on), `docs/STAGE-MODS.md` (H14, H17, PAGEQ / ERA;
  this round T3 and the tools paragraph), `tools/botlab/README.md` (ERA / PAGEQ; this round ERA_FROM).

**Module and stage files:** `src/game/eras.js`, `src/fx/eraFx.js`, `src/world/eras-data.js`;
`src/world/stages/bluestone/{layout.js, murals.js}` — no geometry change; `assets/lightmaps/bluestone.{png,json}`.

**Tests:** `tools/botlab/tests/eras-{world,look,jump,hud,bots,modes,karp,bake}.js`, `eras-static.mjs`, `net-eras.cjs`,
**`net-clock.cjs` (new)**.

## 6. What the art phase must know
- **The module's API.**
  - The world `G.eraWorld` (EraWorld): `names`, `uniforms` (`uEra`, `uEraW`, `uEraTint`, `uEraRemap`, `uMurEra`, `uEraColA`,
    `uEraColV`, `uEraT`, `uEraFar`), `groups`, `meshes`, `propMeshes`, `fx` (EraFx: `setJump`, `setOpened`, `update`),
    `stats`, `audit`, **`frozen`**; build hooks `prop`, `colliders`, `attachLevel`, `attachPaint`, `levelMaterial`,
    `levelFilter`, `afterMeshes`, `buildNav`, `attachMinimap`, `mapBlock`, `attachEnv`, `ready`; `apply(e)`, `looks`,
    `inkOk(b, et)`, `present`, `now`, `bakePasses()`, `bakeMode`, `dispose`.
  - The runtime `G.match.eras` (StageEras): state `sched`, `era`, `phase`, `next`, `front`, `fresh`; queries
    `eraAt(r, t)` / `eraAtPoint`, `eraInForce`, `jumps`, `present`, `inkOk`, `near`, `splatTime`, `dangerAt(pos, pad)` /
    `danger`, `outlines()`, `pings()`, `restMask(era)`, `karpStates()`; hooks `goalWeight(id)`, `botAct`, `drawMap`;
    `update`, `seek(t, why)`; tests, audits and the stage art `state()`, `botReport()`, `debugJump(to, { inS, instant })`,
    **`freeze({ from, to, front })`**, `dispose`.
  - Events: `era:prebell / warn / ring / jump / flip { group, on, off, r } / done { era, snapped? } / set`; per device pop,
    `device:down { how: 'flip' }`.
  - Switches: `?era=n` (`PAGEQ='era=n'` or `ERA=n`); **`?erafrom=a&erato=b&front=r` (`ERA_FROM` / `ERA_TO` / `FRONT`)**.
    Test switches: `E.noDanger`, `E.noPrepos`.
  - Layout data: `eras.accept.rule22` (check-maps' accepted exceptions, printed every run).
- **The stage-select art (DESIGN §5.8):** `STAGES=bluestone ERA_FROM=1 ERA_TO=2 FRONT=30 … tools/botlab/stageart.cjs` and keep
  the day picture; `ERA_FROM=2 ERA_TO=3` and keep the dusk one (stageart shoots both times of day per run). This round's
  blockout shots: `out/engine/fr2-stageart-*`.
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
- **Highlight colours:** `eras.colors.appear #f4e9c8` (holograms, wires, beads, the outlines' dashes, the done pulse, the
  opened floor, the minimap ping, the front line, the bell glyph, the HUD chip and callouts); `eras.colors.vanish
  #a9a49a` (the hatching, the warning's film tint); the curtain's foot brass `#c79a4e` (jump 1) / pearl `#e9ecf2`; the
  jump chip's text `#2a2418` (not a layout colour: dark on whatever `appear` is); never a team ink.
- **Sound cues** (`src/audio/sfx-eras.js`): `era_bell`, `era_ring`, `era_kiosk`, `era_pickup`, `era_swell`, `era_front`
  (a loop riding the front), `era_pop`. `era_strike` is registered but unused (no striker clock prop yet).
- **Bake passes:** `W.bakePasses()` is `[apply(1), apply(2), apply(3)]` into R / G / B; keys `bluestone`,
  `bluestone.tower`, `bluestone.boss` (and `bluestone.bazookarp` once the karp kit adds its pieces). Re-bake after any
  collider change.
- **check-maps' rules** will judge the dressing: rule 22's routes, rule 23's overhead deck edges (a gap over 2.05 m
  fails), rule 29's swaps, rule 39's slots. Dress the stage and run check-maps and eras-world part 3.
- **Left to the art pass:** jump 2's hexagonal-shard curtain; a softer dissolve than the 20 cm blocks; real overhead
  wires; murals 5 and 10; the striker clock's prop; era ambiences; the GPO clock; the curtain's brass foot against
  Tangerine ink; **the stage-select art itself** (dressed, with the frozen front above); **the end-of-match beat
  (DESIGN §3.10), or the lead's decision to cut it** — the dead future at the whistle (the sea at the rooftops, a dead
  sky), Tartar's "…So that is how it ends.", an inward rewind wave to the 1880s and "Returning to the Professor." (issue
  6 lists what each part needs; the Professor reaches a player nowhere else).

## 7. Unfinished, flaky or uncertain
- **The Mac mini.** The task says unavailable; COMMON.md in the worktree (uncommitted, the lead's) says it is back. I
  followed the task: nothing pushed. JOB-6.sh (for the record, never run): 'first' and 'frames' ×3 on fresh pages, the
  perf / load REPORTs beside Halyard, net-eras unlagged and lagged, and now net-clock lagged and probe-gpu.
- **Frame time on a quiet machine** (issue 4): not proven. Here: the module's per-frame work ≤ 8.3 ms in every frame
  measured; the recurring render spikes were the test's own set-up (gone when settled); what remains is a frame or three
  after done in some runs (up to 196 ms once, here), which the minimap's swap at done precedes — its full-canvas ink
  redraw is the lever (shared `minimap.js`), not changed.
- **Rule 22's accepted exception** (the Halo's 225° side 3.66 m over the balcony stair's corner) is the lead's to keep or
  lever away.
- **The online clock under lag:** fixed for the timer and the countdown (issue 1); a follower's timer can run at down to
  half speed for about a second after a host stall over 0.4 s — the price of never running backwards.
- **eras-hud's two review-2 layout checks** stay timing-sensitive under load (the band measured during its 0.18 s
  transition); **eras-bots' live era-3 median** failed once in four runs (bot variance).
- **Bazookarp part B has never run**; the karp package needs `karp-anyValid.patch`.
- **Bots on jump 1's new ground** (issue 7): the cause is measured, the lever is the balance pass's.
- **The end-of-match beat** (issue 6): not built; listed.
- **No balance sets were run** (the lead's consolidated pass); the Halo-dominance check is still risk 16.
- **The lightmap is baked for this geometry.** Any collider change makes it stale (the loader warns and skips it).
