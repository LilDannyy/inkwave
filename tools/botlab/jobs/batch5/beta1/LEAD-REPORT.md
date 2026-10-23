# Beta fix round 1 (`b5-beta1`) — builder's report

Worktree `/Users/danielosling/Desktop/1/st-b5-beta1`, branch `b5-beta1` from new-stages `632398c3` (= b5-int4). Every
fix is in the module that owns the behaviour, each with a check that fails without it, each in its own commit. Proof ran
here (one Electron at a time through `run.sh`, `SLOTS=3`, `WATCHDOG=900000`) and on the Mac mini (JOB-1 … JOB-11 on
`botlab-b5-beta1`, the only branch pushed).

## 1. What was built, item by item

### 1a. Stuck bots — the desktop issue log's 40 stuck-bot rows, mapped to causes

The beta's rows carry no position (the old watch filled none), so they map to causes by stage and mode only.

| cause | where it showed | fix (commit) | check (fails without the fix) |
|---|---|---|---|
| **The issue log's own watch**: positions compared frame to frame (0.08 m a frame: a 3 m/s walker at 120 Hz read as stuck), counting on once `noProg` ticked, running in pauses, the intro and the results. 14 of the 40 rows are bursts of 2–4 bots in 0.2 s (06:13:31, 06:28:15, 06:31:43–44, 06:35:29, 06:53:29–31). | every stage / mode | `issueLog.bots()` judges as the harnesses do: every 0.25 s of match time, wanting to move (alive, playing, not super jumping / charging / pinned / riding the tower / `BotBrain.holdingOnPurpose()`), under 1 m from every place in the last 3 s; one row past 5 s with position, mode, role, route step, next node, edge, goal (`9ff047b8`, `1378ceb2`) | `issue-log.js` 8/8 (old watch: the walker logged at 60 and 120 Hz, 4 of 5 holds logged, a paused lobby logged). Every harness prints `STUCK episodes over 5 s` beside `ISSUELOG`: equal in every run since |
| **A route planned mid-hop began on the ledge the hop was reaching for** (Gulper Aquarium's Feeding Steps: a walk edge on along the deck, no hop asked for; the bot pressed into the step's 1.2 m face: 11.75 / 7 / 4.75 s). | aquarium Bazookarp (10), Zone Control (6) | an airborne bot's route starts from the floor under it (`f0d6126b`) — not on stages with lava (`e55c1abe`, `c113de21`, 1c) | `bot-stuck` `step`: 12 mid-hop routes start on the step, a jump next (base: all on the deck); on the deck within 1.2 s from 12 spots (0.43–0.5 s; base up to 1.9 s) |
| **A Chain Bobber bot run dry mid-chain stayed pinned by its plan** (a squid on bare ground at 4.5 ink/s for the plan's 14 s), and **its deliberate stands read as stuck**. | Bluestone Turf War (2) and the Bluestone rows; an all-bobber Turf War 3.9 % / 8.3 % | the plan is dropped in refill mode off its own ink (`c0b8acdb`); its stands set `perchUntil` (`3762d42a`) | `bot-stuck` `bobber` (base: held 6.75–7.5 s; laying 0 of 90 frames on purpose). All-bobber Bluestone Turf War after: 0.2 / 0.2 % (here), 0.1 % (JOB-4) |
| **A refilling charge weapon held its draw for good** at what the tank allows (no shot, no puddle; a held trigger stops the kid's refill). | the stand-at-refill-goal episodes | released at that cap or after 0.6 s (`3d56a43a`) | `bot-stuck` `refill`: charger 6 / 10 % refills (base: never) |
| **A Bazookarp breaker was sent back, pick after pick, to the refill spot it had just run dry at** — its stand spot on an upper deck's lip, its puddle landing 1.1 m below: it hovered at ~3 % (DIAG: arrived, kid form, no move, trigger on and off; 4.75–25.5 s). `karpRefillSpot` ignored bots.js's `_refillBad`. | halyard Bazookarp (3) | `karpRefillSpot` skips band nodes within 3 m of a fresh `_refillBad`, else the band's nearest other node well inside the band, else none (`5017c365`, `d3748e2e`) | `bot-stuck` `karpspot` (halyard): 20 picks, never within 3 m (base: the same spot all 20) |
| **Bots stranded on the Great Tank's sand bed** (inside its glass, under the Feeding Deck's lid): its 108 nav nodes have no edge out, so a route started at a rim node 0.6–1 m up and walked on; mid-bed, no route at all. | aquarium Bazookarp (JOB-5 #1: 2.7 %, a 9.25 s episode; one blade bot in there from 169 s to 223 s) | a bot with no start node within 3 m at or below the floor under it, for 1.5 s, super jumps out to the nearest teammate over 6 m off (else its spawn), as a player would; not on a stage with lava (`11798a24`, `aba7dbf5`, `27b7e13b`) | `bot-stuck` `tank`: 6 spots, out in 4.1–4.6 s (base: all 6 still in after 10 s). 9 live matches on 9 stages: 0 stranded jumps (none false) |
| **A refilling roller / brush held its trigger**: its drum rolled in place (weapons.js: `lastFire = 0` every frame while rolling), put no ink down and held off the kid's refill for good. | JOB-6: a roller at 6 % never refilled | it taps — a flick each, only with a flick's ink (`fcbefa25`); and a refilling bot steps onto its own puddle up to 3.5 m off, where a flick or a Mitts punch lands it — 2.05 m on a stage with lava (`ce42771a`, `56b84448`) | `bot-stuck` `refill`: a roller / brush never holds its trigger without a flick's ink (base: roller 10 % never refilled, 6 % held dry); every weapon 40 % within 10 s |

Not reproduced after JOB-1 (the shipped code): a 5.25 s Tower Command rider on Bluestone with no path (0 in 10 later
Bluestone Tower matches) and a 5.25 s Bazookarp refill on a walk edge on Lockgate (0 in 9 later).

### 1b. Highmark Foundry unlit; the mode variants' missing bakes

- Baked here with `tools/botlab/bake.cjs` (`dad68b41`): `caldera` (112 s), `caldera.boss` (225 s), `bluestone.tower`
  (339 s, 3 era passes, per-era RGB), `bluestone.boss` (321 s). `caldera.tower` is not a world of its own (no tower-only
  piece in `variants.js`): the `caldera` bake lights Tower Command too.
- A `<stage>.<mode>` world with no bake builds unlit with one `console.debug` line per key per session, no warning; a
  stage's own missing bake still warns (`2ad71e85`). `lightmaps.js` 4/4: all 40 reachable worlds lit, the 5 Bazookarp
  variants unbaked and quiet, a stage's own miss still warns. JOB-2: `stage-audit` caldera turf 3/3, zones 3/3, tower 4/4.
- Pictures: `out/caldera-lit/caldera-{day,dusk}-{spawnA,mid,aerialA,sideL}-before-after.jpg` (8, side by side; the
  'before' JPEGs from JOB-2 in `out/before/`). After: the AO darkens the feet of the crates, walls and stair edges.

### 1c. Slow first frames

`first-frames.cjs` (each stage's first match from a fresh page, in real time: every frame through the intro and 3 s of
play and the waits between them, with probes) found first-time work in the first frames: the world's programs compiled
and its textures / geometry uploaded in the first frame, the minimap's first full draw (14–60 ms), the paint atlas's
first splat pass (a 113 ms flush), the screen FX pass compiled as the intro ended, Bluestone's era bases + precompile in
an idle callback 0.8 s into the intro, and 100–550 ms waits between frames. `main.js _warmStage()` does it at load behind
the faded screen — `StageWorld.warm()` (new hook: eras builds its bases and programs, pipes its ride-camera plans),
`PaintSystem.warm()`, the minimap's first draw, `compileAsync` of every program (hidden objects shown for the walk), one
frame drawn with nothing culled and the FX pass on — from `startMatch` and `_netStage` (`8f30396b`; STAGE-MODS.md step 15).
**Mac mini, 16 stages × 2 (JOB-4): 16/16 twice** — worst intro frame 40.1 ms, worst play frame 19 ms, worst gap 89.7 ms
(JOB-1, the shipped code: worst intro 87.2 ms, worst play 93.9 ms on caldera; no gap measure then). Here (load 8–16):
12 of 16 under 100 ms on the first pass, the misses unattributed long tasks under load (before: 0 of 4).

### 1d. The hosted issue log (`tools/host/selfhost.cjs`, `b6820f24`)

`issues.log` and its rotations live at `<root>/../issues.log`; any GET / HEAD of `issues.log(.N)` answers 404 (even one
an older server left in the root). A loopback peer's request is keyed on `CF-Connecting-IP`, then the first
`X-Forwarded-For` address (20 a minute each); no header, or a peer that isn't loopback (whose headers anyone could forge),
keys on the peer's address with 200 a minute. `issue-host.cjs` 13/13 (the old server fails 9), header-keyed cases added.

### 1e. Section 3 — int4's unfinished proof

- **JOB-7 (Mac mini, each alone, every one started at a 1-min load of 2.3–3.9)**: net-lava 13/13, net-pipes 17/17,
  net-stagemods 10/10, net-lobbykit 16/16, net-practice 29/29, net-karp 22/22 with 2 clients and 22/22 with 3, lava-karp
  9/9, karp-match karpbox and halyard (halyard 0.1 % stuck), sfx-cues 59/59 (last); **net-eras 13/14** (the guest's
  Iron Bridge splats: 1 cell of 368 differing) — **14/14 three times in JOB-9**; **eras-jump frames 3/4** (step 8: a
  301 ms frame in a jump) — **4/4, 4/4, 3/4 (306 ms) in JOB-9** (section 6). JOB-3 had run them all one at a time too,
  but at 4.2–6.9 (net-karp-host 7/7 with 3 clients there).
- **net-karp 8c** was the test reading late: on a quiet machine the decline and the host's undo came back inside the 2
  frames the read waited, and the undo had already swapped the call-out (the HUD did right). It now reads in its own
  listener at the pick-up and the undo (`3aedbaf2`): 22/22 with 2 and 3 clients (JOB-4, JOB-7).
- **The caldera matches' console lines**: 'no lightmap for caldera' (all three: the bake) and two FRAME ERRORS 'An object
  could not be cloned' (Turf War, Zone Control): `issueLog.details()` put the lava runtime's `state` method in every row
  and the desktop IPC can't clone a function, so every caldera row threw out of the frame and was lost (the user's log has
  none from caldera matches). Now era / lava phase / world key as plain values, the IPC gets plain JSON in a try
  (`d3e4f164`). JOB-4: 0 console lines, 0 frame errors in all three caldera matches.
- **The Bluestone Tower line** was 'no lightmap for bluestone.tower' (baked); its 1.5 % stuck did not come back:
  0–0.6 % in 10 later Bluestone Tower matches.
- **lava 58/59**: F8 put its three parked bots inside the Surge Gauge's deck (built after the check was written); they
  were pushed out under the island and drowned. They now stand on the floor that is there (`cc35cda8`): 59/59 here.
- **bot-specials 18/19** (the Bubble Blower counter-play check) did not repeat: 19/19 in JOB-3 and JOB-4 ×2. Not touched.

## 2. Decisions where the brief left a gap

- `caldera.tower` needs no bake of its own; `bluestone.tower` / `.boss` were baked because the int4 Bluestone Tower
  match's console line was theirs.
- The mid-hop route start applies on stages without lava only: on caldera it met lava-bots escape deaths; the lava
  module's escapes and fights were tuned to the old start.
- A stranded bot super jumps (what a player does) rather than the nav growing an edge out of the tank; how bots get
  onto the sand bed is not found (section 6).
- `bot-stuck` `refill`'s bar is 10 s (12 s watched): most kits take 1.1–2.5 s, a roller / brush / Mitts 4–8.2 s (the
  kid's refill to a flick's ink, then the flick), a few draws now and then 4–7.5 s; the bug it is for was 'never'.

## 3. Online and bots

Nothing new crosses the wire. Bots run on the owner's screen; the stranded jump is an ordinary super jump (recorded as
any). The first-frame warm-up runs on every screen at load (`startMatch` and `_netStage`). The hosted log server is
hosting only. No wall-hack: the stranded test reads the nav graph at the bot's own feet, the refill picks its own ink.

## 4. Tests and results

**The stuck set on the Mac mini** (≤ 1 % stuck, no episode over 5 s; % per match, episodes over 5 s in brackets):

| stage / mode | JOB-4 (5ef7adab) | JOB-5 (bfed37c0) | JOB-6 (c2a5457c) | JOB-8 (457afc6e) | JOB-11 (a6bf6059) |
|---|---|---|---|---|---|
| Bazookarp aquarium | 0.3, 0.1 | **2.7 [1]** (sand bed), 0.2 | 0, 0.4, 0.9, 0 | 0.1, 0.2, 0.9, 0.2 | 0.4, 0.1 |
| Bazookarp bluestone | 0.1, 0.3 | 0.2, 0.5 | 0.2, 0.3 | 0.1, 0.2 | 0.4, 0.1 |
| Bazookarp halyard | **1.0 [1]**, 0.3 | 0.5, 0.0, 0.4, 0.9 | 0.1, 0.5, 0.1, **0.8 [1]** | 0, 0.5, 0, 0.2 | 0.1, 0.6 |
| Bazookarp lockgate | 0.8, 0.3 | 0, 0.1 | 0.5, 0.4 | 0, 0.6 | 0.1, 0.2 |
| Zone Control aquarium | 0.2, 0.3 | 0.3, **1.0 [1]** | 0.1, 0.2 | 0.2, 0.5 | 0.1, 0.4 |
| Zone Control bluestone | 0.3, 0.3 | 0.5, 0 | 0.2, 0.3 | **0.7 [1]**, 0.3 | 0.4, 0.2 |
| Tower Command bluestone | 0.3, 0.2 | 0.2, 0 | 0.2, 0 | 0.2, 0.1 | 0.2, 0 |
| Turf War bluestone | 0, 0 | 0.1, 0 | 0, 0 | 0, **4.4 [1]** | 0.3, 0, 0 |

**JOB-11 (56b84448: the final code but `d3748e2e`'s karp band tweak): 21 matches, every one ≤ 0.6 % stuck, no episode
over 5 s.** JOB-13 (with `d3748e2e`): Bazookarp aquarium 0 % (the second's line not kept), halyard 0.4 % and **1.6 %** (no harness
episode over 5 s; one issue-log row, section 6). Episodes over 5 s since JOB-6, what they were: halyard (JOB-6 #4) a blaster grabber by the shell in paint mode, its
move zeroed 0.9 m from its next node, 6.25 s; Zone Control bluestone (JOB-8 #1) a roller painting the zone with ink 100,
its goals alternating between two nodes 1 m apart, standing 13 s; Turf War bluestone (JOB-8 #2) a blaster at
(5.82, 0, 46.37) — 0.34 m above its nearest node — not moving at all for 60.75 s from ~117 s (the 2 → 3 era jump is at
120 s). None fixed (section 6). Caldera (JOB-4): Turf War 0.2 %, Zone Control 0.2 %, Tower Command 2.4 % (no episode
over 5 s: a perch charger standing 2.25 s at a time on its perch, path unfinished — as int4's / JOB-1's 1.5 %).

**Page tests** (here, then the Mac mini), the final code unless said:

| test | result |
|---|---|
| bot-stuck (aquarium: step, bobber ×2, refill, tank) | 6/6 here (final); JOB-6 4/6, JOB-8 5/6 ×2 (refill: roller / Mitts never at 40 %; tank: one spot not out) → `ce42771a`, `27b7e13b`; JOB-11 6/6, 5/6, 6/6; JOB-13 5/6 ×3 (with `a6f4c9c7`, reverted in `2b7eaa67`); **JOB-14 (final) 6/6, 5/6, 6/6** — the miss each time 'tank': one spot's jump late (out at 8.67 s; here once too) |
| bot-stuck karpspot (halyard Bazookarp) | 1/1 here (final), JOB-6, JOB-8, JOB-11, JOB-13 |
| issue-log | 8/8 (here, JOB-4, JOB-6, JOB-8) |
| issue-host (node) | 13/13 (JOB-4) |
| lightmaps / stage-mods / world-build / eras-world / pipes | 4/4 · 36/36 · 5/5 · 19/19 · 92/92 (JOB-4); eras-world, pipes again here and JOB-6/8 |
| holds / sub-bobber / beta-content | 325/325 · 84/84 · 7/7 (here, JOB-4/5/6/8) |
| karp-bots | 42/42 (JOB-4, JOB-5, JOB-6 #1, JOB-11 #1, here on the final code); 41/42 (JOB-6 #2: H 15 of 20), 41/42 · 40/42 (JOB-8: H; B(b2) min 2.88 m; C one touch), 41/42 (JOB-11 #2: B(b2) 2.83 m) → `d3748e2e` (B(b2) here: 3.05 m); C one touch twice here; JOB-13 42/42, 42/42, 40/42; **JOB-14 (final) 41/42 (B(b2) 2.87 m), 41/42 (H)** — section 6 |
| lava-bots (the gate) | The gate is 0 escape deaths and ≤ 1 fight death in 360 bot-trials. Here: 3 of 3 after `c113de21`; 3 of 4 on the JOB-8 code; 2 of 3 on 56b84448; the base (1378ceb2 + the clone fix) 2 of 3 here (lbB-3: an escape death at 38.8 s, as the others'), 3 of 3 earlier. Mac mini: JOB-6 2/2, JOB-8 2/2; **JOB-10: the code with `ce42771a` 3 of 6 (an escape death; 4 and 1 fight deaths), the base 6 of 6** → `56b84448` (the long ink step off lava stages); **JOB-12 (56b84448 vs the base, alternating): 6 of 6 against the base's 5 of 6** (the base's miss: an escape death at 76.25 s and 2 fight deaths) |
| lava | 59/59 here; JOB-4 58/59 (F10: both claimants chargers, neither up in time), JOB-6 58/59 (F8c: 1 of 72 not up) and 59/59; the base JOB-6 58/59 ×2 (F8, its parking bug) with F10 passing |
| bot-climb | 7/7 here (×4); Mac mini 6/7 in JOB-4/5/6 ×2 ('charger mid' forced climb over 4 s) — the base 1378ceb2 fails the same in 1 of 2 (JOB-6): not this round's |
| bobber-web (halyard zones) | 93/99 (JOB-4); the base 92/99 — not this round's |
| bot-specials | 19/19 (JOB-3, JOB-4 ×2) |
| first-frames (16 stages) | 16/16 ×2 (JOB-4) |
| online / audio (section 3) | JOB-7 (each at a load under 4) / JOB-9 above: net-eras 13/14 then 14/14 ×3; eras-jump frames 3/4, then 4/4, 4/4, 3/4 |

Pictures: `tools/botlab/jobs/batch5/beta1/out/caldera-lit/` (8 before / after pairs), `out/before/` (8), `out/lm/` (the
bakes as the Mac mini made them). Balance: no balance change intended; the bots' refills and the stranded jump touch every
mode (no balance set was run this round).

## 5. Commits and shared files

Commits (oldest first): `b4843cd5` harness probes (DIAG plans, STUCK vs ISSUELOG, first-frames.cjs) · `9ff047b8`,
`1378ceb2` the issue log's watch · `2ad71e85` quiet variant fallback · `b6820f24` selfhost · `c411ae3c` first-frames
waits · `f0d6126b` mid-hop start · `f1bd507d` · `8f30396b` first frames warm at load · `4e456792` STAGE-MODS.md ·
`a937d0b9` · `68271c7d` README · `d3e4f164` the caldera issue log's clone error · `c0b8acdb`, `3762d42a` the Chain Bobber
bots · `dad68b41` the bakes · `cc35cda8` lava.js F8 · `3aedbaf2` net-karp 8c · `e55c1abe`, `c113de21` the mid-hop start
kept off lava · `3d56a43a` charge draw release · `5017c365` karpRefillSpot · `11798a24`, `aba7dbf5`, `27b7e13b` stranded
bots · `ed242f20` refill bar · `fcbefa25` roller / brush tap · `ce42771a` _inkStep to 3.5 m · `56b84448` not on lava stages ·
`d3748e2e` karpRefillSpot's other spot well inside the band · `a6f4c9c7` the stranded count decays, reverted by `2b7eaa67`.
Scratch: the brief, JOB-1 … JOB-14 and their results, the pictures (`943ad40f`), the probes folder (`probes/tankwatch.js`), this report.

Shared files, all hunks tagged `[b5-beta1]`:
- `src/game/bots.js`: `STRAND_STATS` export (top); `_vStart`; `holdingOnPurpose()`; the stranded super jump in
  `update()` (before the super-jump / botHold early return); the refill block (draw release, roller / brush tap);
  `_pathTo` (mid-hop start, off lava stages); `INK_STEP_R` / `_FAR` and `_inkStep` (3.5 m, 2.05 m on lava stages).
- `src/game/botsKarp.js`: `karpRefillSpot` (honours `_refillBad`). `src/game/kits/bobber-bots.js`: dry plan, `perchUntil`.
- `src/core/issueLog.js`: `bots()`, `details()`, the IPC. `src/main.js`: `LIGHTMAP_QUIET` / `_loadLightmap`; `_warmStage()`
  and its two calls. `src/game/stageMods.js`: `StageWorld.warm()`. `src/game/eras.js`: `warm()`. `src/game/pipes.js`:
  `warm()`. `src/world/paint.js`: `warm()`.
- `tools/host/selfhost.cjs`; `docs/STAGE-MODS.md`; `tools/botlab/README.md`; harnesses `match.cjs`, `tower-match.cjs`,
  `karp-match.cjs`, `first-frames.cjs` (new); tests `bot-stuck.js` (new), `lightmaps.js` (new), `issue-log.js`, `lava.js`,
  `net-karp.cjs`, `issue-host.cjs`; `assets/lightmaps/{caldera,caldera.boss,bluestone.tower,bluestone.boss}.{json,png}`.

## 6. Unfinished, flaky or uncertain

**Not fixed (found, cause not pinned):**
- **Bluestone Turf War, a 60.75 s episode** (JOB-8 #2): a blaster at (5.82, 0, 46.37), 0.34 m above its nearest node,
  not moving at all from ~117 s to the end (the 2 → 3 era jump is at 120 s) — refilling and painting in place, every
  route's first walk edge unmade. Likely an era piece caught it; not reproduced (JOB-11: 3 Bluestone Turf Wars, 0–0.3 %,
  none over 5 s). The stranded jump does not cover it (a start node exists 0.34 m below).
- **Zone Control on Bluestone, 13 s** (JOB-8 #1): a roller painting the zone with ink 100, its goals alternating between
  two nodes 1 m apart, not firing — most likely a needy patch it cannot ink. Keeping a roller's / brush's zone goal 2 m
  off was tried, but the scene I built did not make the base stand either, so it was dropped (no check, no fix).
- **Halyard Bazookarp, 6.25 s** (JOB-6 #4): a blaster grabber by the shell in paint mode, its move zeroed 0.9 m from its
  next node. Not seen again (JOB-8 ×4, JOB-11 ×2). Zone Control aquarium 6.25 s (JOB-5 #2, a bow fighting, role 'stage')
  likewise.
- **How bots get onto the Great Tank's sand bed** is not found. One entry was caught (JOB-6's tank watch: the bot was
  mid super jump just before); 1,064 super jumps to a teammate on / round the tank (here) landed none inside, 1,800
  hops from the Feeding Steps none, the lid has no hole. The stranded jump takes them out in ~4 s.
- **Tower Command on caldera** 1.5–2.4 % stuck (a perch charger standing 2.25 s at a time with its path unfinished; no
  episode over 5 s) — not on this round's list.

**Flaky or uncertain:**
- **karp-bots B(b2)** (melee breakers refilling at 75 % stay ≥ 2.9 m from the shell's centre): 2.83–2.88 m in 3 Mac mini
  runs (JOB-8, JOB-11, JOB-14) since `5017c365` sends a breaker that ran dry at its stand spot to another band spot or to
  the usual search; never before it (JOB-4/5/6 and here). `d3748e2e` keeps the other spot well inside the band; JOB-14
  still met 2.87 m once — this round's, by 2–7 cm, not fixed.
- **bot-stuck 'tank'**: the stranded jump comes late now and then (out at 8.67 s in JOB-14, 1 run of 3; once here): a
  check that finds the hopping bot off the bed restarts the 1.5 s count. A decaying count (`a6f4c9c7`) was tried and
  reverted (JOB-13: bot-stuck 5/6 ×3 with it, which check not kept).
- JOB-13's halyard #2: 1.6 % stuck, no harness episode over 5 s but one issue-log row (5.25 s, an interceptor in a fight
  at (-10.5, 1.3, 0.4), its next node a 1.1 m jump up) — the two watches part by a frame or two there.
- **The lava-bots gate** (section 4's row): JOB-10 had the code with `ce42771a` at 3 of 6 against the base's 6 of 6;
  `56b84448` takes the long ink step off lava stages, and then the only behaviour this round changes on Highmark Foundry
  is the refill's (the charge draw let go, the roller / brush tap). Escape deaths at 38.8 s (the floor turning deadly)
  happen on the base too (lbB-3 here). JOB-12, after `56b84448`: 6 of 6, the base 5 of 6 — the regression was the long step;
  the gate stays a noisy one (the base misses 1 run in 6–12).
- **karp-bots C** (one touch in 20 bursts) failed twice here and once in JOB-8; **H** (15 of 20, the bar 16) in JOB-6
  and JOB-8 ×2. This round's changes there are the refill's; their base rate is not measured.
- **eras-jump frames step 8**: a ~300 ms frame in an era jump in 2 of 5 Mac mini runs (JOB-7, JOB-9 #3; JOB-3 4/4), and
  a 160–218 ms first inking frame in its baseline; cause not found.
- **net-eras** 13/14 once (1 cell of 368 on the Iron Bridge), 14/14 in the four other runs.
- **bot-climb 'charger mid'** fails on the Mac mini (JOB-4/5/6 ×2; the base 1378ceb2 too, 1 of 2), never here.
  **lava F10** failed once (JOB-4: both claimants chargers, neither up in time); passed in the four runs since and on the
  base. **lava F8c** 1 of 72 not up once (JOB-6). **bobber-web** 93/99 (the base 92/99).
- At a bare refill spot a roller / brush / Mitts still mostly stands kid-refilling 4–8 s (no longer for ever).
- first-frames here under load (8–16) misses on some stages (unattributed long tasks); the Mac mini's two passes are the
  judgement.

**Not done:** no balance set (the bots' refill, karp refill spot and stranded jump touch every mode; no balance change is
intended). The `.bazookarp` variants stay unbaked (the brief).
