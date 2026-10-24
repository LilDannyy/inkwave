# Beta fix round 1 (`b5-beta1`) — builder's report, after review 1

Worktree `/Users/danielosling/Desktop/1/st-b5-beta1`, branch `b5-beta1` from new-stages `632398c3` (= b5-int4). The round's
first report (head `194eeb75`) got a REDO (`LEAD-REVIEW.json`: 3 major, 4 minor). This report is the whole round as it now
stands: section 0 answers the review issue by issue; sections 1–6 are the first report updated (what review 1 changed is
marked **[r1]**). Every Electron run here went through `run.sh` with `SLOTS=3`, one at a time, `WATCHDOG=900000`+; the
heavy sets ran on the Mac mini (JOB-15 … JOB-20 on `botlab-b5-beta1`, the only branch pushed). Online and audio tests ran
there only (this Mac's load stayed at 4–13 all session, another builder sharing it).

## 0. Review 1, issue by issue

### 0.1 (major) The first-frame warm compiled the wrong shader variants and missed what is built on first use — fixed
The reviewer was right on every count. three r186 keys a program on the bound render target (none: the screen's sRGB +
tone mapping; a target: linear, untouched), and `_warmStage` / `PaintSystem.warm` compiled with none bound.
- **The render target.** `_warmStage` now binds the composer's read buffer around every compile (the scene's, the stand-ins'
  below); `PaintSystem.warm` binds the atlas (and gives the flood mesh a geometry with a position attribute — three keys
  `hasPositionAttribute`, so the empty geometry built a third wrong variant); the boss's warm and **the boot's compile**
  (`main.js` load, the same unbound call) bind the composer's target too. Hidden objects are no longer "shown" for the
  walk: `compile` walks hidden objects anyway (showing a hidden parent could also show a light and change every key).
  (`f6a9c039`, `cbb4b946`)
- **What is built on first use.** A discovery probe (every program compiled after the warm, with the object that runs it
  and the code that added it; 4 lineups covering the 12 weapons, 19 subs and 23 specials, specials charged at once) found
  5–27 programs a match compiled in play (6–163 ms frames on this Mac, warm caches), on top of the fists and sponge:
  - kits — `kits/registry.js` gains `warm(actors)`: a kit builds its pools into the scene hidden or hands back stand-ins
    (same materials, geometry attributes and object kind, compiled beside the scene in the composer's target and dropped,
    their materials never disposed so the programs stay cached): the Mitts' fists (+ the local leap preview), the
    Cutlass's slash pools, the Brolly's launched canopy, the bow's arrows, the tracer, boomerang, waddle, dash, bobber
    (both teams' instanced sets), glide, torpedo, shaker and sentry looks, and the local player's aim guides (boomerang,
    tracer, glide, sentry, bobber); kit **weapon models** that build parts on their first animation (the sponge, the
    Cutlass's edge and aura, the Brolly's gores) are animated once in `character.js warmAll` before its compile;
  - the charger's beam / sight ribbon, bombs and their caps, Splashdown's cloud (`Projectiles.warm`); the built-in subs'
    props, the Point Sensor / Murk cloud, the Drip Curtain's sheet and meter, the mine's see-through look, the Hop
    Beacon's lights and sonar (`SubSystem.warm`); the tracked / poisoned looks (`StatusFx.warm`); the lens-ink pass
    (`ScreenFX.warm`, into its own target); the specials' shared looks and their held weapons (Zooka, Blower, Ink Jet,
    Stamp) and each kind's own (`IMPL[kind].warm`: the Wave Breaker, the Drainbow with its post pass and, without GTAO,
    its depth pre-pass); a Bomb Barrage's bombs count as the thrower's subs (`subKindsOf`);
  - the mode's own looks (the tower, the zone markings, Bazookarp's shell / weirs / gates) were built by `m.start()` in the
    intro's first frame (a 69 ms frame on Bluestone Tower Command): `_warmStage` builds them first; the lava burn pass
    (`LavaWorld.warm`, into the atlas); a hidden Big Burst spout kept for the match (each spout's material was disposed
    when it faded, which released the shader: every burst recompiled — the Drainbow did the same; the kept stand-ins hold
    those shaders now). (`f6a9c039`, `96ca966f`, `cb9c1bd9`)
- **Proof.** The reviewer's own probes, after a match on Gulper Aquarium: scene materials with *only* a screen variant
  **0** (round code 9, shipped 4), hidden-only materials with no HDR-target program **0** (9 / 4), materials with a
  screen variant at all 3 (140 / 24); Bluestone 0 / 0. The paint atlas's four materials: one program each, all for the
  atlas (round code: splat 2, dry 2, floods screen-only). The discovery probe: **0** programs compiled after the warm in
  60–90 s matches with all specials charged on Halyard (4 lineups), Bluestone Tower, Highmark Foundry Zones and Gulper
  Aquarium Bazookarp. first-frames' first-use check (20 s of stepped play, every special charged) on all 16 stages: 16/16
  here on the final warm code (the three checks 47/48: one 243 ms wait on Crossmarket with no script in it, this Mac at load
  5–8), and on the Mac mini 16/16 twice, cold (JOB-17); the shipped code fails it on 15 of 15 (3–27
  programs a stage, JOB-15).

### 0.2 (major) The first-frames test did not fail on the base — now it does, and the cold case runs
- `first-frames.cjs` now has three checks a stage: frames and waits under 100 ms (as before); **no shader program
  compiled in the counted frames** — cache-independent, the thing a cold cache turns into 50–500 ms frames — with **a
  Sponge Mitts punch and a paint flood forced at the first frame of play** (the lineup always carries the Mitts; a turf
  face by the camera flooded as a Zone Control capture does); and none in 20 s more of stepped play with every special
  charged (the lineup turns with the stage, so the 16 carry every weapon, sub and special). `first-frames-cold.sh` runs
  each stage in its own Electron with `--disable-gpu-shader-disk-cache`. `TRACE=1` prints every main-thread task over
  50 ms from a Chrome trace; long animation frames are listed with their scripts. (`8886aab7`, `a1220569`)
- **Fails on the shipped code, passes on the fix.** JOB-15 (Mac mini, cold, 15 stages): b0cc406c **1/45** — 2–7 programs
  in the first frames of every stage, 3–27 in the 20 s after, gaps of 106–151 ms on 14; this branch **42/45** at
  `2dcb1350` (worst intro frame 14.5–27.9 ms, play 6.6–13.7 ms, worst gap 16.4–18.4 ms, 0 programs in the first frames
  everywhere; the three misses — a first use each on Kelp Line and Crater Fields, a flood the harness failed to place
  on Spirhalite — were fixed after it: the boomerang's and tracer's local aim guides, the flood's face choice).
  **JOB-17, the final warm code (`016c9e2c`), cold, 15 stages + Cargo, twice: 48/48 and 48/48** — worst intro frame
  13.2–26.4 ms, worst play frame 6.6–16.9 ms, worst gap 16.2–19 ms; 0 programs in the first frames and in the 20 s
  after, on every stage.
- **The unattributed 110–170 ms long task 30 ms into a match** (base and fix alike): a Chrome trace put it in a microtask
  checkpoint, the Long Animation Frames API in no script — it was **the lobby set's preload**: `main.js` starts it 2.5 s
  after boot while `G.mode` is `'menu'`, which it still is while a match loads, and its build (a squidkid, the decks, an
  environment bake, a compile of the set) ran in the promise continuations on top of the match's first frames. It is no
  longer started once a match has begun loading, and a preload a match overtakes waits for the menu (the loading fade
  down, no match on) unless the lobby is shown. 5 stages cold before / after: worst gap 112–202 ms on 4 of 5 → 15–20 ms.
  (`48373678`, `cb9c1bd9`) The shipped code's cold gaps (106–151 ms on 14 of 15) are this.
- **The user's 300–520 ms / 2 s / 4.9 s frames were not reproduced on either code** on this Mac or the Mac mini, warm or
  cold. What the fix proves is that no first frame of play compiles a program, uploads the world or runs the lobby's
  build any more, and that every stage's first frames are under 30 ms cold on the Mac mini. Whether that covers the
  user's numbers needs the user's next desktop log (section 6).
- Load time: the warm costs 170–360 ms more per stage on the Mac mini (cold: 1.0–2.4 s against 0.9–2.0 s shipped), behind
  the loading fade. The wasted compiles the reviewer measured are gone; what remains is the real ones.

### 0.3 (major) bot-stuck not green, its refill bar loosened — fixed at the cause, bar back to 6 s
- **The roller.** As the reviewer said: its tap had no floor-aim guard; a flick loosed level from 10 % landed out of the
  step's reach, ran it dry, the kid's refill brought it to a flick's 9, it flicked level again. Two more causes behind
  the 4–9 s refills of other kits: a step onto a puddle (`_inkStep`, up to 3.5 m) left the route's last node over 1.5 m
  away, so the bot counted as not arrived and neither walked nor painted (a kid refilling 4.8 s, or a squid on bare
  ground at half that rate, 6.5 s — the bow, the bucket); and `_inkStep`'s eight fixed ways (22.5° off the axes past
  1 m) missed a flick's stripe straight ahead. Now: no trigger at a bare refill spot before the aim is at the floor (every
  weapon; only a draw already going is exempt), a finished route is an arrival wherever it ends, `_inkStep` looks along
  the facing first. (`64ce5681`)
- **The tank.** Two causes: a single check that found the hopping bot over the rim (a node there) restarted the 1.5 s count
  — latched for 1 s now; and (JOB-15, 1 spot in 18) a bot that got up onto the rim found the rim's own nodes and was not
  stranded at all — `navCanLeave` (per nav: the nodes from which no edge of any kind leads back to a spawn deck: the
  tank's 108) makes a dead-end start node strand the bot too. (`64ce5681`, `3aa1c7b8`)
- **The bar**: refill back to **6 s** (the round had made it 10 s), plus a new check that no trigger is pulled at a bare
  refill spot with the aim not yet down (the pre-fix code fails it: 8 of 24 rows). bot-stuck here 7/7 ×4 (refill worst
  1.7 / 2.5 / 2.5 / 2.4 s, before 4.7–9.3 s or never; tank every spot out at 4.0 s, 36 of 36 in six tank-only runs);
  a 96-facing refill probe (8 starting yaws × 12 weapons): worst 4.6 s. Mac mini: JOB-15 7/7, 7/7, 6/7 (the rim case,
  fixed after); JOB-17 (`016c9e2c`) 6/7, 7/7, 6/7 and JOB-18 (the same bots) 7/7 ×5, 6/7 — every miss 'tank', a spot out
  at 9.6 s: the stranded bot had set off its special, and a special running holds off a super jump (a Kraken on the bed,
  caught in a trace). A stranded bot no longer starts one; and the bare-spot refill's shots wait for an aim within ~7° of
  the floor (at −0.7 a roller's flick still landed past the step's 3.5 m about one full run in ten) (`61ef76c6`). Here
  after it 7/7 ×6 (refill worst 1.9–4.2 s, tank 36 of 36 at 4.0 s); JOB-19 (`470fde1c`) **7/7 ×6** (refill worst
  2.4–5.0 s, 'tank' passed all six); on the final code here 7/7 ×2, JOB-20 (`3ef6e101`, the final code) **7/7 ×3** (refill worst 2.4–2.5 s, tank every spot at 4.0 s).
- **The attribution**: JOB-13's bot-stuck misses were 'refill' (runs 1–2, the roller) and 'tank' (run 3, JOB-13.txt);
  `a6f4c9c7` (the decaying count) touched only the tank and was reverted on the strength of the refill misses — the first
  report's attribution was wrong. Its idea (a count that a single off reading doesn't restart) is what the 1 s latch does.

### 0.4 (minor) karp-bots B(b2) 2–7 cm short — margins added, and the miss that remains is the shipped code's too
`karpRefillSpot`'s alternative spot sits 0.5 m inside the band (was 0.3) and the refill hold acts from 0.1 m inside the
inner edge (was 0.05 outside). B(b2) here: 16 runs of group B, min 2.93–3.07 m; Mac mini JOB-15: 3.05 / 3.02 / 3.10
(the shipped code 2.94 / 3.03 / 3.04). B(b2) now names who was closest, when and doing what (`34e59887`): never a bot at
the alternative spot. **Not closed:** JOB-20 (the final code) missed it once more, 2.83 m — a roller at its stand spot,
in paint mode, in the window's first frame, 1.5 s after being placed at 3.6 m: the melee stand's approach (which B(b)
bars at ≥ 2.9 m once settled, and passes), not a refill. Against the shipped code, 6 full runs each (JOB-21): this
branch 6 of 6; **the shipped code missed it once, the same way** (2.87 m, a roller at its stand spot in paint mode in
the window's first frame). So the remaining miss is the shipped melee stand's approach — about one full run in ten on
either code — not this round's refill; the bar was left as it is.

The other karp-bots misses, with base rates measured: **H** 14–19 of 20 on this branch in single runs (only-H here
16–19 ×7; full runs 14, 15 and JOB-19's 14), 17–19 on the pre-review code, 18 ×3 on the shipped code; then **6 full runs
each against the shipped code (JOB-21): H 16–20 here (mean 18.3), 16–19 shipped (mean 17.7) — not lower**. D (grabber
3.0–3.2 m) failed once in 3 here and once in 3 on the pre-review code; C (one touch in 20 bursts) on both codes (JOB-21:
once here, twice shipped); I(b) once in JOB-15 — that run's code let the pinned watch (0.5) take fighters, which can
carry a keeper off its weir; fights are out of it since.

### 0.5 (minor) The issue log showed a 60 s freeze as 5 s; the freeze itself — both fixed
- When a logged episode ends (the bot moves off, stops wanting to move, dies, leaves, or the match ends or is left), a
  `stuck-bot-end` row carries its whole length and why; `issues-summary.cjs` gains a LONGEST column. issue-log 10/10 (the
  new checks: a bot frozen 60 s → an end row of 60.75 s; ends at the match's end and when it is left). (`9f2baaa0`)
- **JOB-8's 60.75 s Bluestone freeze, found.** Every block within 1.6 m of (5.82, 0, 46.37) exists in every era: the eras
  play no part. It is a curb corner: a 0.66 m curb to the south with the route's first node behind it, a crate to the
  east, the canal to the west — so the stuck hop is never allowed (the hop guards keep 3 m off the water). A bot put
  there with a goal elsewhere never moved (9 of 9, 15 s). bots.js's stranded watch now also takes a bot **pinned**:
  asking to move (along a route, or with none), not fighting, not drawing, refilling in place or holding on purpose, in
  every one of 7 checks and within 0.6 m for 3 s (1.2 m since, and draws made walking count: below) — then the 1.5 s count and a super jump to a teammate (as for the tank).
  bot-stuck `pocket` (MAP=bluestone): 9 of 9 out at 5.5 s. Every match.cjs run prints its stranded / pinned jumps and
  why. (`d9f59e6a`, `3aa1c7b8`) Found on the way: a sticky spot on Halyard by (20.1, 2.6, −13.4), where the harness logs
  1.75–3.25 s episodes run after run (rollers, buckets, mitts, bows): the pinned jump takes those out at ~4.5 s; its cause
  is not fixed (section 6).
- **[after JOB-17] A second pocket, on Lockgate, and the watch's gaps it showed.** JOB-17's one episode over 5 s (Lockgate
  Turf War, 5.25 s at (10.1, 0, 15.1), 'paint'): the nav's lane node (9.5, 0, 15.05) — one the grid's nudge filled in —
  stands 0.09 m off a post 0.32 m wide and 0.68 m tall, inside the body: nav.js tests a ring of 8 points round a node,
  and the post sits between them. A route west along the canal's edge walks into it. Walkers were out by the pinned jump
  at ~5–5.5 s; a **bow or charger never was** (4 of 12 bot × goal rows not out in 10 s): it draws as it walks, the watch
  skipped every draw (and the unstick's count restarts at every draw), and the unstick's shake carried it 1–1.4 m off
  and back, which restarted the watch's 0.6 m. Now a draw counts while the bot walks a route (never a refill's floor
  shots), the 7 checks are within 1.2 m (the harness's own stuck test: under 1 m in 3 s), and a pin found holds the
  1.5 s count for 2 s while the bot stays within 2.5 m — not into a fight or a refill (`f6923094`). bot-stuck
  `lockpost` (MAP=lockgate; bow, charger, blaster, roller × 3 goals): 48 of 48 out by 4.6 s in four runs (the code
  before: 4 of 12 never); JOB-20 **1/1 ×3** (36 of 36 rows out by 4.6 s). The jump log names the weapon. The nav is left as it is: a body test
  round every node drops tens of nodes a stage, on stairs and by handrails (section 6).

### 0.6 (minor) Bobber stands hid some stuck time — unmarked, and both numbers reported
The low-ink mid-plan wait on bare ground (up to ~5 s of kid refill) is no longer marked a hold (the plan's stand with ink,
the stand spot and the ambush stay holds), and every match.cjs run prints the stuck share with every hold on purpose
counted beside the usual one. All-bobber Bluestone Turf War: JOB-16 — the shipped code 8.1 / 4.6 / 7.7 % stuck with 10 / 4 / 9
episodes over 5 s; this branch 0.2 / 0.3 / 0.2 % (3.9 / 5.7 / 2.2 % with every hold on purpose counted), 0 over 5 s.
(`23d625f8`)

### 0.7 (minor) The server trusted forwarding headers from any loopback peer — fixed
`issueBucket` trusts CF-Connecting-IP only with CF-Ray beside it (Cloudflare's edge sets both, cloudflared passes them;
a request without CF-Ray did not come through Cloudflare), X-Forwarded-For only with `--trust-proxy xff` and then its
last address (the one the operator's proxy added); `--trust-proxy none` trusts nothing. The bucket map is kept
least-recently-used first and capped at 5,000 (a flood costs O(1) a POST, no scan). issue-host 15/15; the old server
fails 4 and throws on the 5th; a flood of 20,000 made-up names keeps 5,000 buckets in 62 ms. (`4a8b788e`)

## 1. What was built, item by item

### 1a. Stuck bots — the desktop issue log's 40 stuck-bot rows, mapped to causes

The beta's rows carry no position (the old watch filled none), so they map to causes by stage and mode only.

| cause | where it showed | fix (commit) | check (fails without the fix) |
|---|---|---|---|
| **The issue log's own watch**: positions compared frame to frame (0.08 m a frame: a 3 m/s walker at 120 Hz read as stuck), counting on once `noProg` ticked, running in pauses, the intro and the results. 14 of the 40 rows are bursts of 2–4 bots in 0.2 s. **[r1]** and a row kept the length it had when written (5.25 s for a 60 s freeze) | every stage / mode | `issueLog.bots()` judges as the harnesses do (every 0.25 s of match time, wanting to move, < 1 m from every place in the last 3 s); one row past 5 s with position, mode, role, route step, next node, edge, goal (`9ff047b8`, `1378ceb2`); **[r1]** a `stuck-bot-end` row with the whole length when the episode is over (`9f2baaa0`) | `issue-log.js` 10/10 (old watch: the walker logged at 60 and 120 Hz, 4 of 5 holds logged, a paused lobby logged; **[r1]** no end rows) |
| **A route planned mid-hop began on the ledge the hop was reaching for** (Gulper Aquarium's Feeding Steps: 11.75 / 7 / 4.75 s) | aquarium Bazookarp (10), Zone Control (6) | an airborne bot's route starts from the floor under it, off lava stages (`f0d6126b`, `e55c1abe`, `c113de21`) | `bot-stuck` `step` |
| **A Chain Bobber bot run dry mid-chain stayed pinned by its plan**, and its deliberate stands read as stuck | Bluestone Turf War and Zone Control | the plan is dropped in refill mode off its own ink (`c0b8acdb`); its stands set `perchUntil` (`3762d42a`) — **[r1]** not the low-ink wait on bare ground (`23d625f8`) | `bot-stuck` `bobber`; all-bobber matches with and without the holds counted (0.6) |
| **A refilling charge weapon held its draw for good** | stands at a refill goal | released at the tank's cap or after 0.6 s (`3d56a43a`) | `bot-stuck` `refill` |
| **A refilling bot at a bare spot shot level, or stood off its node** **[r1]**: a roller / brush held its trigger, then flicked level (out of the step's reach: flick, dry, kid refill, flick); a step onto a puddle left the route's node > 1.5 m off (neither walking nor painting); `_inkStep` missed a stripe straight ahead | JOB-6 / JOB-13: a roller never refilled; 4–9 s refills | the roller / brush taps (`fcbefa25`); **[r1]** every shot there waits for a floor aim, a finished route is an arrival, the step looks along the facing first (`64ce5681`); the long step to 3.5 m off lava stages (`ce42771a`, `56b84448`) | `bot-stuck` `refill`: every weapon 40 % within **6 s** (worst 1.7–2.5 s), no trigger before the aim is down (pre-fix: 8 of 24 rows) |
| **A Bazookarp breaker was sent back to the refill spot it had just run dry at** | halyard Bazookarp (3) | `karpRefillSpot` skips band nodes within 3 m of a fresh `_refillBad`; its other spot well inside the band (`5017c365`, `d3748e2e`; **[r1]** 0.5 m in, the hold's inner edge with a margin, `34e59887`) | `bot-stuck` `karpspot`; karp-bots B(b2) |
| **Bots stranded on the Great Tank's sand bed** (its 108 nav nodes have no edge out) | aquarium Bazookarp (JOB-5: a 9.25 s episode) | no start node within reach at the floor under it for 1.5 s → a super jump to a teammate (`11798a24`, `aba7dbf5`, `27b7e13b`); **[r1]** the flag latched 1 s, and a start node that is a dead end of the graph (`navCanLeave`: the tank's rim too) strands it (`64ce5681`, `3aa1c7b8`); a stranded bot never starts its special (a running one holds off the jump, `61ef76c6`) | `bot-stuck` `tank`: 6 spots, out at 4.0 s (36 of 36 here; JOB-19 all six runs) |
| **[r1] A bot wedged where the nav says it can walk**: Bluestone's curb corner by (5.82, 0, 46.37) — JOB-8's 60.75 s freeze (curb, crate, canal: no stuck hop allowed there); Lockgate's post by (9.6, 0, 15.3), a nav lane node 0.09 m off it — JOB-17's 5.25 s episode, and a bow or charger there for good | Bluestone Turf War (JOB-8), Lockgate Turf War (JOB-17) | a bot pinned (asking to move along a route — drawing as it walks too — not fighting, not refilling in place, not holding, within 1.2 m for 3 s; held 2 s once found) super jumps out like a stranded one (`d9f59e6a`, `3aa1c7b8`, `f6923094`) | `bot-stuck` `pocket` (MAP=bluestone): 9 of 9 out at 5.5 s (before: none moved in 15 s); `lockpost` (MAP=lockgate): 12 of 12 out by 4.6 s, ×4 (before: the bow from every goal never) |

Not reproduced after JOB-1: a 5.25 s Tower Command rider on Bluestone with no path and a 5.25 s Bazookarp refill on a walk
edge on Lockgate.

### 1b. Highmark Foundry unlit; the mode variants' missing bakes (unchanged)

- Baked with `tools/botlab/bake.cjs` (`dad68b41`): `caldera`, `caldera.boss`, `bluestone.tower` (3 era passes), `bluestone.boss`.
  `caldera.tower` is not a world of its own: the `caldera` bake lights Tower Command too.
- A `<stage>.<mode>` world with no bake builds unlit with one `console.debug` line per key, no warning; a stage's own missing
  bake still warns (`2ad71e85`). `lightmaps.js` 4/4 (JOB-15 again); `stage-audit` caldera turf / zones / tower (JOB-2).
- Pictures: `out/caldera-lit/caldera-{day,dusk}-{spawnA,mid,aerialA,sideL}-before-after.jpg` (8; the reviewer looked at 5).

### 1c. Slow first frames **[r1: rebuilt]**

`main.js _warmStage()` (from `startMatch` and `_netStage`, behind the faded screen) does what a match's first frames did
for the first time: the stage modules' deferred work (`StageWorld.warm()`: eras' bases and programs, pipes' camera plans,
**[r1]** lava's burn pass), **[r1]** the mode's looks (tower, zone markings, Bazookarp), **[r1]** what the lineup's kits,
shots, subs, specials and screen effects build on first use (0.1), the minimap's first draw, every program the scene draws
**[r1] compiled for the composer's target** and the paint atlas's **for the atlas**, then one frame with nothing culled and
the FX / post passes on (every mesh's geometry and textures uploaded, the shadow map). **[r1]** The lobby set's preload no
longer lands in the first match's frames (0.2). Proof: section 0.1–0.2 and section 4.

### 1d. The hosted issue log (`tools/host/selfhost.cjs`)

`issues.log` and its rotations live at `<root>/../issues.log`; any GET / HEAD of `issues.log(.N)` answers 404 (`b6820f24`).
**[r1]** A player is named by CF-Connecting-IP only with CF-Ray (cloudflared), by the last X-Forwarded-For address only
with `--trust-proxy xff`; else the peer's address (200 a minute); the bucket map is capped LRU at 5,000 (`4a8b788e`).
`issue-host.cjs` 15/15.

### 1e. Section 3 — int4's unfinished proof

- JOB-7 (each alone at a load under 4) / JOB-9: net-lava, net-pipes, net-stagemods, net-lobbykit, net-practice, net-karp (2 and
  3 clients), lava-karp, both karp-match runs, sfx-cues (59/59, last) all full; net-eras 14/14 ×3 after one 13/14; eras-jump
  frames 4/4, 4/4, 3/4. **[r1]** again in JOB-16 (`28c4c5b9`: the final code but for
  bots.js), each alone at a load under 4: net-practice, net-karp (2 and 3 clients), net-stagemods, net-eras, net-lava,
  net-pipes, net-lobbykit, net-zones, net-tower, net-surf, net-drainbow, net-sub-bobber, net-mock, lava-karp, eras-jump
  frames, sfx-cues (last) — all full.
- net-karp 8c read late (`3aedbaf2`); the caldera matches' console lines were the bake and the issue log's IPC clone error
  (`d3e4f164`); lava 58/59 was F8's parking (`cc35cda8`); bot-specials 19/19 since.

## 2. Decisions where the brief or the review left a gap

- `caldera.tower` needs no bake of its own; `bluestone.tower` / `.boss` were baked because the int4 match's console line was theirs.
- The mid-hop route start, the stranded / pinned super jumps and the long ink step stay off stages with lava (its escapes own those bots).
- **[r1]** A stranded, dead-ended or pinned bot super jumps (what a player does) rather than the nav growing edges out of the
  tank or the curb corner, or losing the lane node by Lockgate's post; the pinned watch keeps out of fights, refills in
  place and draws made standing, and is as strict as the harnesses' own stuck test (under ~1 m in 3 s while trying). The
  Halyard sticky spot it catches is reported, not fixed. The nav's node test is not changed this late (section 6).
- **[r1]** The warm builds stand-ins rather than running the kits' own spawns at load (no sounds, records, paint or damage at
  load); a stand-in's material is never disposed, so its program stays in three.js's cache for the session (one per
  look, kilobytes) — which also ends the recompile at every use of a look whose material is disposed after use.
- **[r1]** Only what the lineup carries is warmed (its mains, its subs and its special's bombs, its specials, the local
  player's guides), plus what every match uses; a lineup change mid-session warms at the next match's load.
- **[r1]** The refill bar is 6 s: a kid's refill alone takes 0.9 + 34 / 9 ≈ 4.7 s, so the bar leaves room for one failed
  puddle and none for a loop.

## 3. Online and bots

Nothing new crosses the wire. The warm runs on every screen at load (`startMatch`, `_netStage`); the lobby fix is local.
Bots run on the owner's screen; a stranded / dead-end / pinned jump is an ordinary super jump (recorded as any). No
wall-hack: the stranded and pinned tests read the nav graph and the bot's own positions; the refill reads its own ink.

## 4. Tests and results

**The stuck set** (≤ 1 % stuck, no episode over 5 s; % per match, episodes over 5 s in brackets):

| stage / mode | JOB-4 | JOB-5 | JOB-6 | JOB-8 | JOB-11 | **[r1] JOB-16** (28c4c5b9) |
|---|---|---|---|---|---|---|
| Bazookarp aquarium | 0.3, 0.1 | **2.7 [1]**, 0.2 | 0, 0.4, 0.9, 0 | 0.1, 0.2, 0.9, 0.2 | 0.4, 0.1 | 0 over 5 s ×2 |
| Bazookarp bluestone | 0.1, 0.3 | 0.2, 0.5 | 0.2, 0.3 | 0.1, 0.2 | 0.4, 0.1 | 0 over 5 s ×2 |
| Bazookarp halyard | **1.0 [1]**, 0.3 | 0.5, 0.0, 0.4, 0.9 | 0.1, 0.5, 0.1, **0.8 [1]** | 0, 0.5, 0, 0.2 | 0.1, 0.6 | 0 over 5 s ×2 |
| Bazookarp lockgate | 0.8, 0.3 | 0, 0.1 | 0.5, 0.4 | 0, 0.6 | 0.1, 0.2 | 0 over 5 s ×2 |
| Zone Control aquarium | 0.2, 0.3 | 0.3, **1.0 [1]** | 0.1, 0.2 | 0.2, 0.5 | 0.1, 0.4 | 0.3, 0.3 |
| Zone Control bluestone | 0.3, 0.3 | 0.5, 0 | 0.2, 0.3 | **0.7 [1]**, 0.3 | 0.4, 0.2 | 0.5, 0.5 |
| Tower Command bluestone | 0.3, 0.2 | 0.2, 0 | 0.2, 0 | 0.2, 0.1 | 0.2, 0 | 0, 0 |
| Turf War bluestone | 0, 0 | 0.1, 0 | 0, 0 | 0, **4.4 [1]** | 0.3, 0, 0 | 0, 0.2, 0, 0.1, 0 |

JOB-16: 23 matches, no episode over 5 s, no issue-log stuck row (the karp harness prints episodes, not a share). Its code
still let the pinned watch take fighters (2 fight-mode jumps in 5 Bluestone Turf Wars); the final code keeps them out:
JOB-17 (`016c9e2c`; 17 matches read, the stages bots were pinned or stranded on, Zone Control, Tower Command, Bazookarp):
every one ≤ 1 % stuck; **one episode over 5 s** — Lockgate Turf War, 5.25 s at (10.1, 0, 15.1), 'paint': the post's
pocket, fixed after (`f6923094`, section 0.5). JOB-19 (`470fde1c`): 8 Turf Wars (Halyard, Gulper Aquarium, Bluestone,
Treehills, 2 each) ≤ 0.6 %, none over 5 s. Here, the pinned change's A/B before its latch (6 matches each,
all-bow / all-charger lineups and defaults on Lockgate, Halyard, Bluestone): ≤ 0.7 % stuck, none over 5 s, no jump
either side; on the final code 7 more (DIAG): ≤ 1 % stuck, none over 5 s; 8 jumps — 6 in one all-charger Bluestone match
by the canal-side quay at x 22–26.5, z −15…−19, y −0.18 (4 'stranded', 2 'pinned'; a charger stood a 5.0 s fight-mode
episode there in the same match), and 2 'pinned' bows. JOB-20 (the final code, 19 matches with DIAG): Lockgate Turf War ×4, all-bow (Lockgate, Halyard) and all-charger (Lockgate, Bluestone) lineups, Turf War on Halyard, Bluestone, Gulper Aquarium, Treehills and Nantai, Zone Control ×3, Tower Command, Bazookarp ×2 — **every one ≤ 0.6 % stuck, no episode over 5 s** (Lockgate's did not recur).

**All-bobber Bluestone Turf War** (review 1, issue 6), JOB-16: shipped code (no marks, no dry-plan fix) 8.1 / 4.6 / 7.7 %
with 10 / 4 / 9 episodes over 5 s; this branch 0.2 / 0.3 / 0.2 %, counting every hold on purpose 3.9 / 5.7 / 2.2 %, 0
episodes over 5 s. Here: shipped 1.9 / 8.5 % (1 / 8 over 5 s); this branch 0.9 / 0.1 / 0 % (4.4 / 2.5 / 3.1 % with the holds;
1 / 0 / 0 over 5 s — a Cutlass in a fight, 6.25 s, on a code with the bobber wait still marked).

**Page tests** (final code unless said):

| test | result |
|---|---|
| first-frames (16 stages; frames / programs in them / first use) | here (warm) 16/16 stages, 47/48 checks (one 243 ms wait on Crossmarket with no script in it); JOB-17 cold **48/48 ×2** (15 stages + Cargo); the shipped code cold 1/45 (JOB-15) |
| bot-stuck (aquarium: step, bobber ×2, refill ×2, tank) | 7/7 ×4 here; JOB-15 7/7, 7/7, 6/7 (tank, the rim case — fixed after); JOB-17 6/7, 7/7, 6/7 and JOB-18 7/7 ×5, 6/7 (tank: a stranded bot's special — fixed after, `61ef76c6`); here 7/7 ×6 after it and ×2 on the final code; JOB-19 **7/7 ×6**; JOB-20 (`3ef6e101`, the final code) **7/7 ×3** (refill worst 2.4–2.5 s, tank every spot at 4.0 s) |
| bot-stuck pocket (bluestone) / karpspot (halyard Bazookarp) / lockpost | 1/1 here ×4 / 1/1 here; JOB-15 1/1, 1/1; JOB-17 1/1, JOB-19 1/1, JOB-20 1/1 ×2; **lockpost** (lockgate): here 1/1 ×4 (48 of 48 out by 4.6 s; the commit before: 4 of 12 never), JOB-20 **1/1 ×3** (36 of 36 rows out by 4.6 s) |
| issue-log / issue-host / lightmaps | 10/10 / 15/15 / 4/4 (here and JOB-15) |
| karp-bots | here 42/42 and 40/42 (C one touch; D: the grabber at 3.5 m — the pre-review code fails D 1 in 3 too); JOB-15 41/42 (H 15 of 20), 42/42, 41/42 (I(b)); the shipped code 42/42 ×3 (H 18 ×3). B(b2) 3.02–3.10 m on the Mac mini. JOB-19 42/42, 41/42 (H 14); JOB-20 41/42 (B(b2): 2.83 m — a roller at its stand spot, in paint mode, in the window's first frame) and 42/42; H against the shipped code, 6 full runs each (JOB-21): this branch H 19, 20, 16, 18, 19, 18 of 20 — the shipped code 18, 19, 18, 16, 19, 16: **no lower** (every run passes ≥ 16 on both); full results 42/42 ×5 and 41/42 (C, one touch) here, 42/42 ×4, 41/42 (C) and 40/42 (B(b2), C) on the shipped code |
| lava-bots (the gate) | JOB-16: 7/7 ×4, the pre-review head 7/7 ×4 (alternating); JOB-19 7/7, 7/7, **5/7** (one escape death: Fizz, twins, the edges trial, 39.2 s; and one fight death); JOB-20 against 3aa1c7b8, alternating: the final code **7/7 ×4**; 3aa1c7b8 5/7, 7/7, 7/7, 7/7 (its run 1: one escape death, Pip, roller, the edges trial) — the escape deaths are not the refill's floor aim; here 7/7 ×3 on the final code |
| lava | 59/59 here; JOB-15 58/59 (F10: both claimants not up — failed once before in JOB-4, passing on the base) |
| bot-climb | JOB-15 6/7 ('charger mid', as JOB-4/5/6 and the base 1 in 2) |
| regressions of the warm and the bots (JOB-15) | stage-mods 36, world-build 5, eras-world 19, eras-modes 6, pipes 92, holds 325, loadout-picker 23, sub-bobber 84, sub-dash 48, sub-glide 65, sub-sentry 50, sub-tweaks2 23, deployables 34, bow-paint 16, surf 42, drainbow 44, sp-rules 45, zipcheer 36, ink-wipe 8, karp-loop 6, bazookarp-rules 119, hud-karp 43, tower-rules 26, tower-ink 11, bot-specials 19, beta-content 7: all full |
| online and audio (JOB-16, each alone, load 2.8–3.9) | net-practice 29/29, net-karp 22/22 (2 and 3 clients), net-stagemods 10/10, net-eras 14/14, net-lava 13/13, net-pipes 17/17, net-lobbykit 16/16, net-zones 5/5, net-tower 5/5, net-surf 13/13, net-drainbow 11/11, net-sub-bobber 11/11, net-mock 11/11, lava-karp 9/9, eras-jump frames 4/4, sfx-cues 59/59 (last) |

Pictures: `out/caldera-lit/` (8 before / after pairs), `out/before/`, `out/lm/` — nothing in review 1 changed a look.
Balance: no balance change intended; review 1's bot changes touch every mode (refill, the escape jumps); no balance set run.

## 5. Commits and shared files

The first report's commits (oldest first): `b4843cd5` harness probes · `9ff047b8`, `1378ceb2` the issue log's watch ·
`2ad71e85` quiet variant fallback · `b6820f24` selfhost · `c411ae3c` first-frames waits · `f0d6126b` mid-hop start ·
`f1bd507d` · `8f30396b` first frames warm at load · `4e456792`, `a937d0b9`, `68271c7d` docs · `d3e4f164` the caldera issue
log's clone error · `c0b8acdb`, `3762d42a` the Chain Bobber bots · `dad68b41` the bakes · `cc35cda8` lava.js F8 ·
`3aedbaf2` net-karp 8c · `e55c1abe`, `c113de21` the mid-hop start kept off lava · `3d56a43a` charge draw release ·
`5017c365` karpRefillSpot · `11798a24`, `aba7dbf5`, `27b7e13b` stranded bots · `ed242f20` refill bar · `fcbefa25` roller /
brush tap · `ce42771a` `_inkStep` to 3.5 m · `56b84448` not on lava stages · `d3748e2e` karpRefillSpot's other spot ·
`a6f4c9c7` reverted by `2b7eaa67`.

**[r1]** Review 1 (oldest first): `4a8b788e` selfhost trust / LRU cap · `9f2baaa0` issue log end rows · `f6a9c039` the
warm's render targets, the mode looks, kit warm hook, warmAll's animate · `96ca966f` first-use stand-ins · `48373678` the
lobby preload · `8886aab7` first-frames' checks, cold runner, TRACE · `64ce5681` refill floor aim / arrival / facing step,
stranded latch, bot-stuck bar 6 s · `34e59887` karp band margins, B(b2) minAt · `23d625f8` bobber wait unmarked, holds
counted · `d9f59e6a` the pinned escape, `pocket` · `f56fe4df` docs · `cbb4b946` the boot compile · `cb9c1bd9` local aim
guides, the lobby preload's whole wait · `a1220569` first-frames flood / solo stage · `3aa1c7b8` dead-end strand, pinned
out of fights · `61ef76c6` no special while stranded, the refill's floor aim within ~7° · `f6923094` the pinned watch:
draws made walking, 1.2 m, a 2 s hold; bot-stuck `lockpost`. Scratch: JOB-15 … JOB-21, their results, this report.

Shared files, every hunk tagged `[b5-beta1]`:
- `src/main.js`: `LIGHTMAP_QUIET` / `_loadLightmap`; the boot compile's target; the lobby preload's guard; `_warmStage()`
  (mode looks, the warm hooks, the composer's target, the paint, the post passes) and its two calls; the boss warm's target.
- `src/game/bots.js`: `STRAND_STATS`, `navCanLeave`, `_vStart`; `holdingOnPurpose()`; the stranded / dead-end / pinned super
  jump in `update()` and `reset()`; the fight and paint special triggers held while stranded; the refill block (draw release, floor aim for every shot, roller / brush tap, finished
  route = arrival); `_pathTo` (mid-hop start); `_inkStep` (3.5 m, the facing first).
- `src/game/botsKarp.js`: `karpRefillSpot`, the refill band's hold. `src/game/kits/bobber-bots.js`: dry plan, `perchUntil`.
- `src/game/kits/registry.js`: the `warm` hook's doc, `warmKits`, `subKindsOf`; a `warm` on `blade`, `bow`, `brolly`
  (`launchedLook` split out), `mitts`, `tracer`, `boomerang`, `waddle`, `dash` (`newRibbon` split out), `bobber`
  (+ `bobber-hud.js guideWarm`), `glide`, `torpedo`, `shaker`, `sentry`.
- `src/game/character.js` `warmAll` (the held weapon animated once); `src/game/weapons.js` `Projectiles.warm`;
  `src/game/subs.js` `SubSystem.warm`; `src/game/statusFx.js` `warm`; `src/game/specials.js` `SpecialSystem.warm`;
  `src/game/sp-surf.js`, `src/game/sp-drainbow.js` `IMPL.warm`; `src/fx/screenfx.js` `warm`; `src/fx/bazookarpFx.js` the kept
  spout; `src/game/lava.js` `warm` / `_ensureBurn`; `src/game/showcase.js` the lobby preload's wait.
- `src/core/issueLog.js`: `bots()`, `details()`, the IPC, end rows. `src/game/stageMods.js` `StageWorld.warm()`;
  `src/game/eras.js`, `src/game/pipes.js` `warm()`; `src/world/paint.js` `warm()`.
- `tools/host/selfhost.cjs`; `docs/STAGE-MODS.md`; `tools/botlab/README.md`; harnesses `match.cjs`, `tower-match.cjs`,
  `karp-match.cjs`, `first-frames.cjs` (new), `first-frames-cold.sh` (new), `issues-summary.cjs`; tests `bot-stuck.js` (new),
  `lightmaps.js` (new), `issue-log.js`, `lava.js`, `net-karp.cjs`, `issue-host.cjs`, `karp-bots.js`;
  `assets/lightmaps/{caldera,caldera.boss,bluestone.tower,bluestone.boss}.{json,png}`.

## 6. Unfinished, flaky or uncertain

**Not fixed, or not proven:**
- **The user's own slow frames** (300–520 ms on six stages, 2 s on Bluestone, 4.9 s on Gulper Aquarium) were never reproduced,
  on the shipped code or this one, warm or cold, here or on the Mac mini. This round removes every program compile, the
  world's uploads and the lobby set's build from a match's first frames and shows it stage by stage; it cannot show that
  this was the user's cost. Their next desktop log (its rows now carry position, era and world) is the check.
- **The Halyard sticky spot** by (20.1, 2.6, −13.4): rollers, buckets, Mitts and bows stand there 1.75–3.25 s (harness
  episodes) run after run; the pinned jump now takes them out at ~4.5 s. Its geometry was not looked at.
- **How bots get onto the Great Tank's sand bed** and **into the Bluestone curb corner** is not found; both now end in ~4–5.5 s.
- **The nav's node test misses things inside the body ring.** `_clear` (nav.js) tests 8 points on a 0.46 m ring round a
  node, not the disc inside it: Lockgate's lane node (9.5, 0, 15.05) — and its mirror (−9.5, 0, −15.05) — stand 0.09 m
  off a 0.32 m post. Bots routed there are now taken out by the pinned jump (≤ 4.6 s in bot-stuck `lockpost`), but the
  nodes are still there. Tests round every node (the kid's capsule, or the disc at knee height) flag 7–97 nudged nodes a
  stage, most on stairs and by handrails that bots walk fine (a step within the ring, the nudge's own lanes) — the
  right test needs its own round, with the stage audits and bot-climb, not this one's last day.
- **Bluestone's canal-side quay** (x 22–26.5, z −15…−19, y −0.18): in one all-charger match here 4 'stranded' and
  2 'pinned' jumps and a 5.0 s fight-mode episode there; with the usual lineups no bot was seen there.
- **Zone Control Bluestone 13 s roller** (JOB-8 #1) and **Halyard Bazookarp 6.25 s grabber** (JOB-6 #4) did not come back
  (JOB-11, JOB-16: 0 over 5 s); not fixed at a cause.
- **Load time**: the warm adds 170–360 ms per stage behind the fade (Mac mini, cold).
- **The first-use hunt's reach**: 16 stages × 20 s of stepped play with every special charged (plus the 4-lineup discovery
  runs); what only appears later in a match (overtime, the finish, the results) was not measured. (Online, every player's
  actor is in `m.actors` at `_netStage`'s warm, so their kits are warmed as the owner's are.)

**Flaky or uncertain:**
- karp-bots **H** (≥ 16 of 20 bots leave a Big Burst's disc): this branch 14–19 (three full runs at 14, 15 and 14 — JOB-19's
  the third), the pre-review code 17–19, the shipped code 18 ×3; 6 full runs each against the shipped code (JOB-21):
  this branch H 19, 20, 16, 18, 19, 18 of 20 — the shipped code 18, 19, 18, 16, 19, 16: **no lower** (every run passes ≥ 16 on both); full results 42/42 ×5 and 41/42 (C, one touch) here, 42/42 ×4, 41/42 (C) and 40/42 (B(b2), C) on the shipped code; **D** fails 1 run in 3 on this branch
  and on the pre-review code; **C** one touch now and then (also on the base); **I(b)** once (JOB-15, the code whose pinned
  watch took fighters).
- **first-frames' timing check** under this Mac's load (5–8): one 243 ms wait in 48 checks on Crossmarket — an animation frame
  with no blocking and no script (the compositor / GPU, not the page). The program checks do not depend on load.
- **karp-bots B(b2)**: the melee stand's approach puts a breaker 2–7 cm inside 2.9 m in the window's first frame about one
  full run in ten — on the shipped code too (JOB-21); not a refill.
- **The lava-bots gate** (0 escape deaths in 360 bot-trials): JOB-19 failed it once in 3 (Fizz, twins, the edges trial), after
  8 of 8 in JOB-16 on this branch and the pre-review head; nothing in the bots' changes since JOB-16 runs on a lava stage
  but the refill's floor aim. Against 3aa1c7b8 (before it), JOB-20: the final code **7/7 ×4**; 3aa1c7b8 5/7, 7/7, 7/7, 7/7 (its run 1: one escape death, Pip, roller, the edges trial) — the escape deaths are not the refill's floor aim; here 7/7 ×3 on the final code. In all: escape deaths in 2 of 22
  runs since JOB-16 (the final code 1 in 10, this branch before the floor aim 1 in 12), the shipped code 0 in 6 (JOB-10) — a rare flake on both, or a slightly
  higher rate here; not shown either way.
- **lava F10** (both claimants not up in time) and **bot-climb 'charger mid'**: once each in JOB-15, as before the review
  and on the base.
- **eras-jump frames step 8** (a ~300 ms frame in an era jump, 2 of 5 earlier Mac mini runs): 4/4 in JOB-16; cause not found.

**Not done:** no balance set (the bots' refill, the escape jumps and the karp refill spot touch every mode). The `.bazookarp`
variants stay unbaked (the brief).
