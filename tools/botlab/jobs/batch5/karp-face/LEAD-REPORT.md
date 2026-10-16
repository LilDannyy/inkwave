# Bazookarp WP2 (online and the finished face, key `karp-face`) — lead report, fix round 3

Worktree `/Users/danielosling/Desktop/1/st-b5-karp-face`, branch `b5-karp-face`, base `b5-int3` b55f7472. Nothing pushed.
The mode stays hidden behind `WIP_MODES` (`?wipmodes` / harness `WIPMODES=1`); its switch is untouched. Everything ran on
this Mac under the shared SLOTS=3 lock, one Electron instance of mine at a time. The load average was 400–600 all
evening, and pages often ran at 12–30 fps with stalls of up to 2 s; that matters for every timing number below. The
Mac mini was not used, because my instructions said it is unavailable. `COMMON.md` in the worktree was edited by
someone else to say it is back; I left that edit uncommitted.

This round had two fixers. The first was cut off by a usage limit after 13 commits (fd65845a … 50141168). Its run
queue was still going, and its runner had already restored its last A/B file swap. I took over: I read every commit,
kept them all, and finished the work (the pictures, the race measurement, the regression runs, this report). I added:
- the race's lateness reading;
- the halfway line's joined pieces;
- three test-timing fixes;
- the scenes' leftover-note fix.

"Pre-fix" runs swap in fd65845a's file(s) (round 2's final code) for that one run only, and put the fixed ones back
afterwards.

## Review round 3 (LEAD-REVIEW.json, verdict REDO): each issue, what was done, the proof

Every issue was real; I disagree with none.

### 1. MAJOR: the carrier's over-head marker on the call-outs and in the top bar — fixed (ff5582da, 10eda873)
- **Fading.** The marker now follows the world tags' rules. It fades (`is-under`, 0.15 s) while its box overlaps a live
  call-out, the kill call-out or the centre banner.
  - The banner's box is the union of the banner, its word and our instruction as drawn. Rotated, OVERTIME! reaches past
    the banner's own box, and the marker sat on the word's top edge outside it.
- **The top bar.** A marker whose point would sit above the status pill's bottom is pinned under the pill like an
  off-screen one, its arrow up and the distance shown. It is never drawn over the Carp Line.
- **Proof: hud-karp K1–K3.** They pass at 1920×1080 (hud1080b / hud1080d **43/43**) and at 960×600 (hud600c-e). With
  round 2's hud-karp.js (hudold600c) they **fail**:
  - K1: the marker was drawn at y 89.9, over the bar, whose pill ends at 99. Fixed: pinned at 132.8, its box 120–159.
  - K2: on the 'Stop them — 10 s to hold!' sub line (231–243) at full opacity. Fixed: `is-under`, opacity 0, back once
    the call-out is gone.
  - K3: on the banner's word at full opacity. Fixed: opacity 0.03.
- **Pictures, all looked at:**
  - **`hud-ot-foe` / `-after`** (new scenes): a Bravo carrier holds it at time-up while Alpha leads, so we see 'Stop
    them — 10 s to hold!'.
    - On halyard the carrier stands on the raised Pond, above the dock we look up from. Its marker is pinned under the
      status pill.
    - The marker is faded under the banner (0.6 s in) and under our call-out (2.9 s in). The instruction reads clearly
      in both, at 1080 and at 960×600.
  - **`hud-ot-ally` / `-after`:** an Alpha teammate (Drip) walks up the gangway in full view, 'Carry it past their
    count!'. Its marker would sit on the call-out; it is faded, and only the name tag shows above the ribbon.
  - **`1080-lockgate-sunset-hud-foe`:** the review's own case, a carrier on lockgate's raised Pond bridge seen from
    below. The marker is pinned under `THEY CARRY · 48 s`, arrow up, `10m`. The Carp Line and its carp are clear.
  - **`-hud-ot-foe` / `-after`:** the same on lockgate in overtime.

### 2. MAJOR: round 2 not wrapped up — done
- **docs/NET.md.** Round 2's paragraphs were committed (fd65845a), and round 3's (d320f7b1, a0c7d4db).
- **The staged deletion** of `1080-lockgate-sunset-look-shot-flight` was committed (6d375b03).
- **Pictures** (3d4ba8e8, scratch). The halyard day set was re-taken with the final scenes at 1080 (every scene) and
  at 960×600 (24 HUD / map / results scenes). This includes hud-ot, hud-ot-after, hud-nojump, hud-nospawn, hud-ally and
  hud-foe-pin. In hud-ally and hud-foe-pin, LEAD is on the leading team at both sizes.
  - The first 960×600 hud-ot / -after were stale frames under load: 0:01 and no banner, while the scene's own readout
    said overtime. They were re-taken and show the banner with its instruction, then our call-out.
- **The report.** Round 2 is reported below with its numbers, and this round's too.

### 3. minor: a Carp Shot's blast judged twice when its shooter's client leaves — fixed (5641d1bf)
- **The departed peer's queued records.** `KarpGun.adopt` now reads the departed peer's queued records; netmatch hands
  them over.
  - A shot whose `[2]` is still queued is not taken: the queued record blows it on every screen.
  - A shot whose `[1]` is queued waits for that landing, then is the adopter's to blow.
- **Each gid is judged at most once on every screen** (`blown`).
- **Gids are unique across an adoption.** A gid is the shooter's own count (nid × 1e5 + its shots). Every screen learns
  it from the launches it plays, and an adopter carries it on. netId's per-client count had restarted on a new host,
  which reused the old host's gids.
- **Proof: `net-karp-host part=dbl` (new).** Three clients. The old host's Alpha bot fires a non-lethal Big Burst at
  the two Bravo kids, and the host leaves the moment it blew on its own screen. The old host's queued `[2]` is held back
  `hold` s, so the race happens every time.

  | run | hold | result | judgements per screen |
  |---|---|---|---|
  | dbl1 / dbl2 | 0.25 s | **3/3**, 3/3 | 1 each (dmg 88.4, kids alive) |
  | dbl3 | 0 | **3/3** | 1 each |
  | dbl4 | 0.6 s | **3/3** | 1 each |
  | dblold (pre-fix) | 0.25 s | **1/3** | the new host 2 (88.5 twice), the other guest 2; both kids splatted by a hit that cannot kill; the new host sent its own `[2]` |
  | dblold2 (pre-fix) | 0.6 s | **1/3** | the same |

  The third check also failed pre-fix: the new host's next shots for the adopted bot must have gids past the old
  host's, and the other guest must fly them. Pre-fix they reused gids 1 and 2, and the other guest dropped the launch.
- I did not re-run the reviewer's 4-client rv3-dbl.cjs (1 round in 5 pre-fix). `part=dbl` forces its race every run.

### 4. minor: the results screen's OVERTIME +m:ss differed between host and guests — fixed (88707eb7)
- The host rounds its overtime played to 0.01 s, keeps that number itself, and sends it in `'e'`. Followers take it.
- **Proof: `net-karp part=ottag` (new).** The S38 'held' overtime is stopped just past a whole second of the host's
  overtime clock.
  - ottag1: **3/3**, both screens 3.06, both `OVERTIME +0:04`.
  - Pre-fix (ottagold): **1/3**, 3.05 against 2.915, `+0:04` against `+0:03`.
- Step 16, every result compare, now includes the overtime played. `net-karp-full` compares the overtime played and its
  tag on both remaining screens (ed01bf64).
- **It found one more case, now fixed (a558b03d, mine).** full1 was **10/11**: the new host's results said 1.64 s of
  overtime and the other guest's 1.62 (both tags +0:02).
  - Cause: an end decided earlier in the same frame (here a retake in `_grant`; also a comeback or knockout in
    `_carried`) got one more frame of overtime added after its `'e'` had gone out.
  - The host's overtime clock now stops once the match has ended.
  - New rules check G10e: the `'e'` record's overtime equals the engine's own, for a retake and a comeback. With the
    fix 1.32 / 1.32 and 1.82 / 1.82, rules **119/119**. With the previous bazookarp.js (rulesold) **118/119**: kept 1.337
    / 1.837 against the 1.32 / 1.82 sent.
  - full2 after the fix: **11/11**, but that match ended on time without overtime, so the proof is G10e.

### 5. minor: running-start races went to the guest under lag — fixed in two steps; measured with and without lag
**The first fixer (0f4c04a0).** A guest's claim says how much its player was already running in when it went free
(`fr` 0–1, from its own last ~0.1 s of positions) and how late it heard of the burst (`fl`). The host adds `fr × fl`
to its `since`. A standing racer (`fr` 0) is timed as before. Its runs:
- racerunlag1 (netlag 80 + jitter 30): bot 6 / guest 6; the review had guest 12 / 12;
- racerun1 (no added lag): **bot 12 / guest 0**; the review had bot 8 / 4.

That 12 / 0 looked like an over-correction, so I took it apart:
- **The test hid a bias.** Guest B set off and timed its touch on its own estimate of the host's clock (`hostNow`),
  the very clock the claims are judged by, so any bias in that estimate vanished from the reported touch gap.
  - `part=racerun` now times both racers on the machine's clock (`performance.timeOrigin + now()`: one clock for every
    page here; the two pages agreed within 0.2–12 ms).
  - It reads three ways of judging on the same rounds: no correction, the first cut's, and mine.
- **The first cut's `fl` ran high.** It read `hostNow(host) − tb` at the record's arrival. hostNow adds a one-way
  estimate built from relay round trips, which carry each page's event-loop wait: 10–100 ms high here. So the host's
  bot took every dead heat.
- **Mine (636fe301).** `fl` is read on the floor of the clock offset (receive − send at its fastest), at the frame the
  guest's `freeT0` belongs to; a `bk` lands between frames.
  - The claim carries the guest's floor offset `fo`. The host adds back half of `fo` + its own floor offset to that
    guest: the two fastest one-way trips, both ways alike.
  - The result may be slightly negative (to −0.1 s), when the guest's frame began before the burst.
- **Paired readings, 12 rounds each.** Error = judged gap − real touch gap (> 0 favours the host's bot). Dead heats
  are rounds within 15 ms on the machine's clock.

  | run | no correction | first cut (hostNow) | mine (floor offsets) | wins as judged by mine |
  |---|---|---|---|---|
  | racerunN2, no added lag | median −0.002 s, mean abs 0.049, dead heats bot 1 : B 6 | +0.154, 0.146, **7 : 0** | +0.057, 0.099, 3 : 4 | bot 8 / B 4 |
  | racerunN3, no added lag | −0.027, 0.052, 2 : 9 | +0.064, 0.084, **10 : 1** | **−0.011, 0.041**, 3 : 8 | bot 4 / B 8 |
  | racerunlagN2, netlag 80 + jitter 30 | −0.126, 0.133, **0 : 8** | +0.059, 0.092, **8 : 0** | **−0.022, 0.055**, 3 : 5 | bot 6 / B 6 |
  | racerunlagN3, netlag 80 + jitter 30 | −0.097, 0.146, 1 : 5 (4 wrong) | +0.086, 0.148, 6 : 0 | **+0.019, 0.084**, 6 : 0 (2 wrong) | bot 12 / B 0 |

  ("wrong": a round where one side touched ≥ 15 ms first and the other won.)
  - Mine has the smallest median error in all four runs, and the smallest mean error in three.
  - The first cut leans to the host every time (+0.06 … +0.15 s).
  - No correction leans to the guest under lag (−0.10 … −0.13 s).
  - On this machine every reading also carries ±0.1–0.4 s from page stalls: some rounds had touch gaps of 0.4–1.9 s,
    excluded above 0.3 s. So 12 rounds still swing (lagN3's 12 / 0 has a median error of +0.019).
- **Standing starts** (`fr` 0, unchanged): racefair under netlag 80 + jitter 30 **12/12** before my change
  (racefairlag1) and **11/12** after it (racefairlagN1). The one miss: B touched first, but its claim was not in within
  the 0.3 s wait cap under this load.
- TELL THE USER: a running start is now judged as if the guest had heard of the burst when the host's actors did. On
  a loaded machine the judging of a near tie is noise of up to a tenth of a second either way.

### 6. minor: a declined grant ('u') left the pick-up call-out up — fixed (ff5582da)
- `karp:undo` takes back a live or waiting `…GOT THE BAZOOKARP!` call-out and says a small `FREE — GRAB IT!`.
- **Proof:**
  - hud-karp K4: pass; pre-fix (hudold600c) fail, the call-out stayed up.
  - net-karp 8c: after the `u`, no pick-up call-out on either screen. base1 / base2 pass it; pre-fix (base8old) it
    **fails**, with THEY'VE GOT THE BAZOOKARP! still live on the host.

### 7. minor: net-karp base flaky under netlag 40 + jitter 20 — fixed (ff5582da, cd57576f)
- Step 5 waits for each shot's blast on both screens (`until`) instead of a fixed 1.9 s.
- Step 1 had the same kind of read: at load 150 its fixed 400 ms read B's meter from before the host's clamp (−1728
  against −636, base1 21/22). It now reads until the guest's meter has followed the host's, at most 3 s.
- **Proof:** base2 (no lag) **22/22**; netlag 40 + jitter 20, three runs: **22/22**, **22/22**, **22/22** (baselag40a–c).

### 8. minor: the TAB map's halfway line invisible on halyard — fixed (ff5582da, 903fc9fd)
- The line is the field's own D0 = D1 line, traced with marching squares over the nav grid and chained into
  polylines. A square across a step of more than 1.2 m has none, so the line never runs along a cliff.
- Pieces whose ends are within 2.5 grid steps are joined (903fc9fd, mine), and pieces under 2.5 steps dropped.
- It is drawn as a dashed white line in a dark casing, on the TAB map only.
- **Proof:**
  - hud-karp G4: 1 line, 56 points, through the Pond (0.54 m), across 0.88 of the map, at both sizes. Pre-fix it fails
    (there was no traced line).
  - A synthetic grid with two 1-step holes in the line: 3 pieces with 50141168's code, 1 line with 903fc9fd's.
  - Pictures `1080-` / `600-halyard-day-map-tab`: a dashed line runs across the Pond's top deck.
  - **Lockgate** (`1080-lockgate-day-map-tab`, `-sunset-map-tab`): the line shows as several short dashed pieces round
    the Pond's diagonal bridge. The canals (no floor) and the bridge's steps break it, so it is faint there.

### Found on the way (this round)
- **J4 timed from the banner's first frame** (a96d7869). hud600c failed J4 by 16 ms (first readable at 516 ms after
  the emit): on a loaded page the banner's first frame came late.
  - J4 now times "readable within 0.5 s" from the banner's CSS animations' start, and reports both.
  - hud600d: the banner's first frame 952 ms after the emit, readable 217 ms after it; 43/43.
- **I4 / K2 / K3 read boxes once the pop-in has settled** (889daeb8). hud1080c failed I4 / K2: their fixed waits read a
  call-out mid pop-in, at twice its size. After: hud1080d 43/43, hud600g 43/43.
- **The scenes' leftover note** (b8b2d94c). map-mini showed hud-nospawn's 'You can't take it into a spawn' with nobody
  carrying. The scene reset clears it; map-mini re-taken at both sizes without it.
- **net-karp step 1's meter read** (cd57576f, issue 7).

## Review round 2 (verdict REDO; never reported until now)
The fixes are in 184edcc2, bece2e24, 6b5d8e41, 96994f51 and 7039b09c.

1. **The OVERTIME! instruction was never readable** (the stock centre banner covered our call-out for its whole life)
   — fixed.
   - The banner now carries the instruction under its word, on the losing team's ribbon. Our call-out follows as the
     banner fades.
   - hud-karp J4 (real time): first readable at 124 ms, readable 3.83 s of the first 7 (1.71 s in the banner, 2.12 s
     in our call-out), never under the opaque banner.
   - Pre-fix: first readable at 1.96 s, 0.29 s in all, and our call-out came up under the banner.
2. **Two of SPEC §1.1's four "Can't use" lines were missing** — built.
   - "Can't super jump with the Bazookarp": a TAB-map row clicked, or the map's number keys.
   - "You can't take it into a spawn": the spawn barrier shoving a carrier, at most once per 3 s.
   - Proof: hud-karp J1–J3 pass; pre-fix J1 and J2 fail. Pictures hud-nojump / hud-nospawn.
3. **At a host change the carried fuse stepped UP** — fixed. The new host reads the fuse, the overtime clock and the
   window forward from the old host's last snapshot (≤ 0.6 s on the old host's clock), instead of taking them raw. A
   carrier on its own screen never gets back time its ring has shown spent.
   - net-karp-host under netlag 100 + jitter 40: ring who=1 **2/2**, ring who=2 **2/2**, bots **7/7**. The largest
     rise between frames was −0.033 s, i.e. none.
   - Pre-fix: ring who=1 1/2 and who=2 1/2 (the new host's fuse rose 0.13 s), bots 6/7 (rose 0.22 s).
4. **bazookarp-rules L11 / L11b were order-dependent** — fixed. Our call-outs' waits run on the HUD's play clock, not a
   CSS clock or setTimeout, which stood still in the stepped test. The reviewer ran rules 118/118 twice; here 118/118
   (rules1) and, with this round's G10e, 119/119 (rules2).
5. **The race's `since` bias for running starts** — measured. `part=racerun` was added (96994f51) and NET.md got the
   paragraph; the fix is issue 5 above.
6. **Pictures that misrepresented, scratch-folder inconsistencies** — fixed.
   - hud-ot is overtime as the engine calls it at time-up, with the stock banner.
   - The LEAD badge settles to the scene's counts.
   - hud-nojump / hud-nospawn were added.
   - These were committed only now (issue 2 above).
- Also in round 2 (6b5d8e41): a call-out still waiting when the match ends is dropped.
- hud-karp at the end of round 2: **38/38**; pre-fix 34/38.

## Review round 1 (as reported then)


Every issue was real; I disagree with none. Two diagnoses were incomplete, noted under issues 4 and 7a. "Pre-fix" runs
swap in base commit a93ec8cc's file(s) for that one run only, and put the fixed ones back afterwards.

### 1. BLOCKER: a guest carrier's ring took the previous carry's leftover fuse — fixed (272df36b)
- `_applySnap` now returns before it touches anything (counts, fuse, rate, overtime clock, window) when the snapshot's
  `q` is below the last discrete record applied, or once there is a winner. The fuse and rate are read only from a
  snapshot whose holder is this screen's holder. A follower reads a fresh carrier's fuse forward from the grant
  (`_fz` at grant = 60 s now), never from an older snapshot's.
- Proof: new `net-karp NET_ARGS=part=snap`. It runs the reviewer's repro as checks:
  - 17: the host's fuse is left at 7 s (once at 0, a Carp Blast's), then B grabs. B's own ring must start at 60 and
    stay within 1 s of the host's for 1.5 s, in 5 grabs.
  - 17b: another screen's view of a fresh carrier's fuse (B's marker over A) never shows the leftover, in 5 grabs.
  - Fixed: **5/5**. Every ring minimum was 58.3–58.6 against the host's 58.4–58.8; B's view of A's fuse ≥ 58.9.
  - Pre-fix (snapold): **2/5**. B's ring sat at 5.3 s in 4 grabs and at 0 after the blast, while the host had 58.4;
    B's view of A's fuse was 6.5 in 3 of 5 grabs.

### 2. MAJOR: a knockout's count went back up on the guests — fixed (same change)
- Proof: `part=snap` 18. A's kid plants Alpha's weir, grabs again and walks into Bravo's Gate. B's counts are sampled
  every 8 ms for 2.3 s after `karp:end`.
  - Fixed: 269 samples, all `[0, 100]`; the badge reads 0.
  - Pre-fix: the count was 2 from 61 ms after the end, and the badge read `['100', '2']`.

### 3. MAJOR: world tags over the timer and the call-outs; the meter tag repeating the status pill — fixed (8853f091, f95ab463)
- Weir and Gate tags never ride up into the top bar. They are clamped below the Carp Line's status pill, as the meter
  tag already was.
- They fade (`is-under`, 0.15 s) where they would sit on a live call-out: the kill call-out's box, or ours with its
  ribbon and 4 px round it.
- The meter tag is not drawn where it would sit right under the status pill, which already says
  `SHELL · 66% OURS`. Lower on the screen it is drawn as before.
- Proof: `hud-karp.js` I1–I3, **pass at 1920×1080, 960×600 and 1512×945**. Each check records the raw projection that
  would have put the tag in the wrong place, so it fails without the fix:
  - I1: the GATE tag's own point projects at y 91 against the pill's bottom at 99 (960×600); the tag is drawn from 103.
  - I2: a weir tag on the ray through a live call-out's middle is `is-under`, and is back once the call-out is gone.
  - I3: the meter tag is null where its point is at 96 under the pill's 99, and drawn at 465.
- Pictures:
  - `1080-` and `600-halyard-day-hud-gate`: GATE sits under `YOU CARRY · 20 s`, clear of the timer.
  - `-hud-shell`: the meter tag is gone under the pill.
  - `-hud-ot`: no `45` on OVERTIME!.
  - `-hud-start`: re-taken with a HUD frame after the call-out. The scene's frozen clock had held the tags; the first
    re-take still showed the `45` on SHELL.

### 4. MAJOR: grab races went to the host's actors — fixed; it took four changes, and part of step 5's tilt was the stage
The reviewer's fix is built: a common time base and a short wait for claims still in flight. Measuring it turned up
two more causes, and showed that some of step 5's tilt was geometry.

1. **The order (272df36b).** Every claim carries `since`: how long after the Bazookarp went free on the claimant's own
   screen it touched it (a guest's `kc` gains `fs`). The host grants the smallest `since`. A touch inside the 0.25 s
   hold counts as the hold's end, so SPEC §7.3's nearest-wins stays for those. Equal `since` → the nearest.
2. **The wait (4e794721).** Once a claim is in, the host holds the grant open for claims in flight. The wait is the
   relay round trip (its own plus the guest's lobby ping), plus that peer's playback delay (jitter and tick spacing),
   plus a frame. It applies only for guests that haven't claimed yet but stand within `pickR + 6 m` at their newest
   sample, and is at most 0.3 s. With nobody remote near, the grant is at once (offline, lone grabs).
   - A remote claimant is valid at its newest sample or any it sent in the last 0.4 s (SPEC's wording; the code only
     read the newest).
   - When an S39b window's grace runs out with a grant held open, it is decided then.
   - race1, round-trip wait only: every decision held one claim. B's equally quick claims landed after the 0.083 s
     wait.
3. **A claim held back (dc561e2f).** A guest's 0.3 s re-send clock carried over from its previous claim, so the round
   after a guest carried, its first claim waited up to 0.3 s.
   - race1/race2: the guest never claimed in every other round. This was already in WP1's code and was part of the
     10/0.
   - A fresh free phase now claims at once.
4. **The touch time (6c772a14).** The engine runs before the actors move, so its clock is a frame ahead of the
   positions it reads. A touch is now timed at the positions' time, less the overshoot past `pickR` at the toucher's
   speed. Without that, a 20 fps page touched a frame "late".

Then the measurement itself:
- **karpbox's Pond is not symmetric.** From its +x side a racer touches it 0.063 s later (sim time) than from −x. Step 5
  always put the host's bot on +x and the guest on −x.
- With the fixes, the −x side won every race whoever stood there:
  - guest on −x: race4, race5, racekid2/3 **16/16** each; at 60 fps on both pages (racekid4fps60) 16/16, and
    race6fps60 15/16;
  - host bot on −x (raceswap1): **12/12**.
- Even from the faster side, the guest lost 10 of 10 under the old code (the review's run).
- Step 5 and `part=race` / `racekid` now alternate the sides and report wins by side.
  - race7: **bot 8 / guest 8**; the −x side won all 16.
  - racekid5 (the host's own player against the guest, alternating): **8 / 8**.
  - face3 (step 5, 10 rounds, final code): **bot 5 / guest 5**.
  - Each time the −x side won every round, and the guest's claim was in at every decision where it was second.

The rule itself, free of the run's physics: `part=racefair` (7f648c96).
- A host bot and B each step onto the Bazookarp 0.30 s / 0.36 s after it went free on their own screens. The host's
  racer goes first in even rounds, B's in odd ones. The earlier one must win.
- Fixed: **12/12**. When the bot was first, the host waited 0.12–0.13 s, B's later claim was in, and B correctly lost.
- Pre-fix (racefairold): **7/12**. B, first by 0.06 s, won 1 of its 6 rounds.

TELL THE USER / the lead: this changes SPEC §7.3's tie rule from "nearest wins" to "first to touch on its own screen
wins, nearest on a tie". A host grab can wait up to 0.3 s when a guest is within about 7 m.

### 5. MINOR: the burst call-out on the kill call-out at 960×600 — fixed (8853f091, 6260b919, f16ce210, 2ac4b9b5)
- A burst's WIPEOUT! and SHELL BURST! come in the same frame. Ours now waits out the kill call-out's pop-in (0.38 s)
  and sits under it: `has-kcall` pushes `.iw-zcalls` below its box, re-read each frame because the jump alerts' row
  moves it.
- The new pictures showed two more overlaps, both fixed:
  - The stock exit drifts a call-out up by 60 % of its height. WIPEOUT!'s ribbon rode onto `FREE — GRAB IT!`, and our
    call-out drifted into WIPEOUT!'s sub line. In this mode both now leave with a short lift (−14 %).
  - The kill call-outs anchor no higher than the status pill's bottom plus that lift.
- Proof:
  - hud-karp I4: ours appears 0.40–0.46 s after the kill call-out and wholly below it, including its sub line. At
    960×600: kill 127–197, ours 201–247. At 1920×1080: kill 235–361, ours 372–451.
  - hud-karp I6: the kill call-out, sampled through its life, never rises onto the pill. Minimum top 121 vs pill 99 at
    960×600; 223 vs 198 at 1920×1080.
  - 1080 hud-burst was re-taken on the burst frame: the scene bursts in `set()`. The old one caught the frame before.
    The pictures show WIPEOUT! above SHELL BURST!, both readable, and the pill clear.

### 6. MINOR: the carrier's fuse too small in its last seconds — fixed (8853f091)
- Under 10 s the reticle's seconds turn into big red Titan digits (3.3 u: 32 px at 960×600, 63 px at 1080) that beat
  each second, with a bolder ring.
- Proof:
  - hud-karp I5: 31.7 px at 8.5 s against 11 px at 30 s (960×600).
  - Pictures `1080-` and `600-halyard-day-hud-fuse-low` show a large red `3` under the ring.

### 7. Smaller open points
- **a. Fuse ring under lag — fixed (272df36b).**
  - The review's numbers had the ring LONG: it showed 0.2–0.6 s *more* than the host had, growing.
  - Cause: snapshots were aged by the match clock. On a guest that clock trails the host's by the one-way delay, and is
    only corrected outside a ±0.2 s dead band.
  - Snapshots are now stamped with the host's wire clock (its tick clock). A follower reads their age as
    `now − peer.off + oneWay` (`NetWire.hostNow`): the peer offset netmatch already keeps, plus half its own relay
    round trip and half the host's lobby ping.
  - Proof: new check lag 9c under netlag 150 + jitter 60. B − host over 8 pairs: **mean −0.26 s**, steady between −0.20
    and −0.30. The ring is now slightly *short* (safe), by the ×3 change's own trip (the host hears `kr` one way
    late), which is SPEC's expected ~0.25. 9b still holds: worst rise 0, 0 s at the blast.
- **b. A sub thrown by hand during your own non-barrage special counted × 0.5 — fixed (a58841de).**
  - In `objTargets.isSpecial` a sub's `sp` flag now counts only while its owner's special is a barrage, or with none
    running within 6 s of a barrage throw. Its last bombs go off after it ends; the `barrage:throw` event is recorded
    per actor.
  - Proof: rules M6, real throws. Plain 106; during a Bubble Guard 106 (it was × 0.5); a Bomb Barrage's 53.
  - Rules B4 (a synthetic `sp` bomb) now explodes with its thrower's barrage running; rulesB 16/16.
- **c. Step 1's per-guest message rate — added (aad2cdd5).**
  - net-karp 1b: B fires at the shell for 5 s while its transport's sends are counted.
  - **Peak 22 in any 1 s, mean 20.7/s** (ticks and pings; `kh` adds none). base 21/21.
- **d. Menus at 960×600 — fixed (dc552d52).**
  - How to Play: the Bazookarp cards are tighter on a short window (smaller art), and the Overtime note uses a short
    wording there.
  - Five-card row: the NEW! badge stays inside the gap, and the Boss card's PUBLIC BETA sits under its kicker.
  - Proof: karp-menus H2 / M3 at 960×600 **14/14**. Pre-fix (menus600old) **12/14**: the notes ran to y 628 under the
    key bar at 548, and the Bazookarp card's glare covered both badges.
  - Pictures `600-halyard-day-menu-rules` / `-menu-mode` and the 1080 pair.

### 8. Halyard's Pond, and sunset pictures that looked like day — fixed in this branch
- **Halyard (2a2addb5).** The ferry's wheelhouse dressing (`ferry_bridge`: windows, doors, funnel collider, mast) is no
  longer built in Bazookarp, as its wheelhouse block already wasn't. This is a one-line `notIn` in
  `props-marina-vessels.js`, in WP4b's area.
  - `1080-halyard-day-look-resting` / `-shell-3m`: the shell stands on a clean cabin roof.
- **Sunset.** The "sunset" set was day because `TIME=sunset` isn't a stage time: `mapTheme` falls back to the stage's
  own look. The halyard set from round 0 was halyard's day.
  - Re-taken on lockgate with `TIME=dusk`: `1080-lockgate-sunset-*`, 14 pictures (the HUD, carrier, shell, weirs,
    Gate, wake, TAB map). It now reads as evening.
  - Dropped the two shot pictures there: the scene's camera sat right behind the Carp Shot on lockgate.
  - The Gate pair has a dark parapet across the bottom half; those cameras were tuned on halyard.
  - The 16 mislabelled `1080-halyard-sunset-*` were removed.


## 1. What WP2 built (SPEC §11 WP2), with rounds 1–3 folded in

### Netcode (SPEC §7): `NetWire` (src/game/karpWire.js) and the engine's net surface (src/game/bazookarp.js)
| item | how | proof |
|---|---|---|
| discrete records with `q`, sent at once (`bk`) | `_rec` takes `max(q, lastQ) + 1` (a new host never reuses a q); `'b'` carries its host wire time `tb`, `'e'` the overtime played (round 3) | host-bots, host-plant, ottag |
| snapshots `s` 10 Hz / `S` 1 Hz (`ks`) | a snapshot older than the last discrete record, or after the end, changes nothing (round 1); stamped with the host's wire clock, aged through `NetWire.hostNow(sender)` | snap 17 / 17b / 18, lag 9c |
| claims with `ts` and `fs`, the hold, the race | first to touch on its own screen wins after a wait (≤ 0.3 s) for claims in flight (round 1); a running start's lateness `fr` / `fl` / `fo` added to its `since` (round 3) | racefair, racerun, face 3 / 4 / 5 |
| `kd`, `kx` / `u`, the window's grace | WP1's; a grant held open is decided when the grace runs out; a follower's `u` clears its shell copy and takes back the pick-up call-out (round 3) | base 7 / 8 / 8c, lag 15b / 15c |
| `kh` on the 20 Hz tick | WP1's | base 1 / 1b (B's own sends: peak 22/s) |
| `kr` / `kf` | WP1's; re-sent to a new host | lag 9 |
| `onSamples` from `_sample` | real samples only, scored in order | face 6c / 6d |
| Carp Shot blasts on victims' screens, `[3]`; `karp:shot` for a ghost launch; adoption | a gid judged once per screen, an adopter leaves a shot whose `[2]` is queued to it, gids = the shooter's own count (round 3) | base 5–5d, face 7 / 7b, host-dbl |
| the fuse hold before a remote carrier's Carp Blast | ≤ 0.3 s; a death record that plays first wins | face 11, lag 9b |
| the carrier's ring (§7.2) | jumps forward at once, gives back ≤ 0.2 s/s, on the wire clock | hud-karp D, lag 9b / 9c |
| a remote carrier's fuse on followers | read forward ≤ 0.6 s from the newest snapshot of THAT carrier, from the grant on | snap 17b, host-bots |
| a host change | the new host reads the fuse, overtime clock and window forward from the old host's last snapshot (round 2) | host ring / bots under lag |
| `onLeave`'s order, the narrowed flush, the `'k'` case, `onHostChange`, disconnects | round 0 | host-bots / plant / shot / cargo / guestleave, net-tower, net-zones |
| results `karpM` / `karpPops` / overtime played; late join (the locked room) | round 0; the overtime played from `'e'` (round 3) | face 16, ottag, full |

### The finished HUD (§6.1–6.5, src/ui/hud-karp.js)
Round 0 built:
- the count badges, the Carp Line, the status pill;
- the over-head marker and its edge pin, the reticle rings;
- DON'T RETREAT! / CARP-FREE ZONE!;
- the meter tag, the weir and Gate tags, the squad badge, the carp on the special orb;
- prompts and call-outs, "Can't use" notes;
- the minimap / TAB layer, and hud-lead mode `karp`.

Since then:
- **Round 1:** world tags clear of the top bar and live call-outs; the meter tag not under the status pill; our
  call-outs after and under a kill call-out; the short exit lift; the big last-10-s digits.
- **Round 2:** OVERTIME!'s instruction carried by the banner, then our call-out; all four "Can't use" lines; call-out
  waits on the play clock; no call-out after the end.
- **Round 3:**
  - the marker fades under call-outs, the kill call-out and the centre banner, and is pinned under the status pill
    instead of drawn in the top bar;
  - `u` takes back the pick-up call-out;
  - the TAB map's halfway line traced, joined and cased.

### Menus (§6.6, DECISIONS #10), looks (§6.7), the `sp_karp` model, sound (§6.8)
As round 0, plus round 1's 960×600 fixes (How to Play's short-window layout, the five-card badges) and halyard's bridge
dressing gone in this mode. Rounds 2 and 3 did not touch them.

## 2. Decisions where the request left a gap (the lead tells the user)
- **The race (rounds 1 and 3).** First to touch on its own screen wins, nearest on a tie (SPEC §7.3: nearest). The
  host waits up to 0.3 s for claims in flight when a guest is within about 7 m. A guest already running in when it
  went free is timed from the host's burst (its lateness added), a standing one from its own "free".
- **The ring's time base (round 1).** The host's wire clock through the peer offset plus a one-way estimate built from
  relay pings, instead of SPEC §7.2's "match clock". The ring runs slightly short (≤ 0.3 s) instead of long.
- **OVERTIME!'s instruction (round 2).** It rides the stock centre banner under its word, then our call-out. The stock
  banner and its sound stay.
- **The marker (round 3).**
  - It fades while it would cover a call-out or the banner; the Carp Line's carp still shows where the carrier is.
  - It is never drawn in the top bar: pinned under the status pill with an up arrow and the distance.
- **The overtime played (round 3).** It is the host's, to 0.01 s, on every results screen.
- **Gids (round 3).** nid × 1e5 + the shooter's own shot count, instead of netId's per-client count.
- **A sub's × 0.5 (round 1).** A sub item counts as a special's only while its owner's barrage runs, or within 6 s of
  a barrage throw.
- **Halyard's bridge dressing (round 1).** Not built in Bazookarp (WP4b's file; one line).
- **Call-outs in this mode (round 1).** They leave with a short lift instead of the stock 60 % drift, and ours waits
  0.38 s behind a kill call-out that pops in the same frame.
- **Round 0's choices stand:**
  - a follower reads a remote carrier's fuse forward at most 0.6 s;
  - no marker over your own head (your fuse rides your reticle);
  - the Carp Line's carp holds still while an enemy carrier swims hidden;
  - everyone near hears the last-3-s hiss.

## 3. Online and bots
- **Records.** New fields since WP1:
  - `fs` on `kc` (round 1);
  - `fr` / `fl` / `fo` on `kc` (round 3);
  - `tb` on `'b'`;
  - the overtime played on `'e'`.
  Snapshot `t` is the host's wire clock (round 1). Older clients' records still parse, with the missing fields
  defaulted.
- **Who judges what.** As SPEC §7.1, except the race order above. A Carp Shot's blast is judged once per screen, also
  across a host change.
- **Bots.** No bot code touched (WP3's). Offline the race change only matters when two of the host's own actors touch
  within the same window: the earlier toucher wins instead of the nearest.
- docs/NET.md has the protocol: late snapshots, the race and its lateness reading, the wire clock, adoption, the tests.

## 4. Tests (all on this Mac at load 400–600; net tests `Q0..Q2='autopilot&wipmodes'`). Final code = HEAD unless noted
| test | result | notes |
|---|---|---|
| `hud-karp.js` (K1–K4 new, G4 new) | 1920×1080 **43/43** (hud1080b, hud1080d); 960×600 **43/43** (hud600d, hud600e) and **43/43** (hud600g, final) | hud600f 40/43: the page at 12 fps with 1–2 s stalls (I4 / I6 found the kill call-out already gone, J4 read every ~1 s); pre-fix (hudold600c) 38/43: G4, K1–K4 |
| `net-karp` base (22 checks, with 8c) | **22/22** (base2) | lag 40 + 20 ×3: **22/22** ×3 |
| `net-karp part=face` | **16/16** (face2, final race code; face1 before it 16/16) | step 5: bot 5 / guest 5 both times |
| `net-karp part=racerun` (machine clock, paired readings) | see issue 5 | no lag ×2, lag 80 + 30 ×2 |
| `net-karp part=racefair` (lag 80 + 30) | **12/12** (before my change), **11/12** (after) | the miss: B's claim not in within the 0.3 s cap |
| `net-karp part=ottag` (new) | **3/3**; pre-fix 1/3 | issue 4 |
| `net-karp part=snap` | **5/5** (snap2); snap1 4/5: 17b's values were all ≥ 58.9 (never the leftover) but one grab reached B's screen so late that B took only 3 samples (the check wants > 20) | round 1's blocker |
| `net-karp part=lag` (netlag 150 + jitter 60) | **9/9** (lag2: 9c mean −0.30, pairs −0.04 … −0.58); lag1 8/9: 9c mean −0.35 against its 0.3 limit (the ring short, the safe side; round 1 had −0.26) | |
| `net-karp-host part=dbl` (new) | **3/3** ×4 (hold 0, 0.25 ×2, 0.6); pre-fix 1/3 ×2 | issue 3 |
| `net-karp-host part=shot` / `bots` (netlag 100 + 40) / `plant` | **3/3** / **7/7** / **4/4** | round 2: ring who=1 / who=2 under netlag 100 + 40, 2/2 each |
| `net-karp-full.cjs` (3 clients, a real 5:00 match, the host leaves) | full1 **10/11** (the overtime played 1.64 / 1.62: fixed in a558b03d), full2 **11/11** (ended on time, no overtime) | now compares the overtime played and its tag |
| `bazookarp-rules.js` | **119/119** (rules2, with G10e); rules1 118/118 before G10e; pre-fix for G10e 118/119 | |
| `karp-gun` / `karp-two` / `karp-loop` | **12/12** / **6/6** / **6/6** | |
| `hud-lead.js` MODE=bazookarp | **13/13** | |
| `net-tower` / `net-zones` | **5/5** / **5/5** | shared netmatch change (`_adopt`'s queued records) |

Not re-run this round: `karp-menus`, `loadout-picker`, `net-lobbykit`, `net-practice`, `net-turf`, `sfx-cues`,
`karp-shell-dps`, `int3`, `wip-stages`, the reviewer's rv3-dbl / rv3-ottag scripts, and `net-karp-host part=ring` /
`cargo` / `guestleave`. Their code was not touched in round 3, apart from netmatch's one line for `cargo` /
`guestleave`, which `dbl`, `shot` and `full` cover.

Their last results:
- **The review of round 2's head:** karp-menus 14/14, loadout-picker 23/23, net-lobbykit 16/16, host cargo 4/4,
  guestleave 2/2.
- **Round 2:** ring who=1 / who=2 under netlag 100 + 40, 2/2 each.
- **Round 0:** net-practice 29/29, net-turf 9/9, hud-lead turf / zones / tower 22/22, 14/14, 12/12, sfx-cues (alone)
  58/58, karp-shell-dps 36/36, int3 10/10, wip-stages 22/22.

## 5. Pictures (`tools/botlab/jobs/batch5/karp-face/out/`, JPEG < 300 KB, all looked at)
- **Re-taken this round, halyard day:**
  - at 1080: every scene except the day-lit `hud-sunset-carry`;
  - at 960×600: hud-start, -shell, -burst, -free, -carry, -retreat, -zone, -foe, -foe-pin, -ally, -weir, -gate, -ot,
    -ot-after, -ot-foe(-after), -ot-ally(-after), -fuse-low, -nojump, -nospawn, map-tab, map-mini, menu-results.
- **New scenes:** `hud-ot-after`, `hud-ot-foe` / `-after`, `hud-ot-ally` / `-after`, `hud-nojump`, `hud-nospawn`, and
  `1080-halyard-day-look-carrierblock`.
- **Lockgate:**
  - `1080-lockgate-sunset-*` (TIME=dusk): hud-foe, hud-ot-foe / -after and map-tab re-taken; the other ten from round 1;
  - `1080-lockgate-day-hud-foe` and `-map-tab` new.
- **What to look at for this round:**
  - `hud-ot-foe-after` / `hud-ot-ally-after`: the instruction clear, no marker on it;
  - `1080-lockgate-sunset-hud-foe`: the marker pinned under the pill, not on the Carp Line;
  - `map-tab`: the dashed halfway line;
  - `600-halyard-day-hud-ot` / `-after`: the banner, then our call-out.
- **The rest are round 0's / round 1's:** `1080-lockgate-day-hud-shell` / `-zone` / `-look-*`, menu-lobby / -setup /
  -pause at 960×600, `1080-karpbox-day-look-carrierblock`, `1080-wipstages-*`.

## 6. Commits (rounds 2 and 3, oldest first) and the shared files touched
- **Round 2:**
  - 184edcc2: the OVERTIME! instruction, the "Can't use" lines, play-clock waits;
  - bece2e24: the fuse at a host change;
  - 6b5d8e41: no call-out after the end;
  - 96994f51: `part=racerun`;
  - 7039b09c: scenes.
- **Round 3, first fixer:**
  - fd65845a: NET.md round 2;
  - 6d375b03: scratch, the stale picture removed;
  - 5641d1bf: the double judgement and gids;
  - 88707eb7: `'e'`'s overtime played;
  - ff5582da: the marker, `u`'s call-out, the halfway line, step 5's waits;
  - 0f4c04a0: the running-start credit;
  - d320f7b1: NET.md;
  - ed01bf64: tests;
  - cd57576f: step 1's read;
  - 10eda873: the banner's union box;
  - e2dcdfe7: the overtime-with-carrier scenes;
  - 50141168: tests.
- **Round 3, mine:**
  - 636fe301: the race's lateness on floor offsets, racerun on the machine clock with paired readings;
  - a0c7d4db: NET.md;
  - a96d7869: J4 from the banner's first frame;
  - 903fc9fd: the halfway line's pieces joined;
  - b8b2d94c: scenes, the leftover note;
  - 889daeb8: I4 / K2 / K3 after the pop-in;
  - 3d4ba8e8: scratch, the pictures;
  - a558b03d: the overtime clock stops at the end, rules G10e;
  - this report: scratch.

Shared files in rounds 2–3, all hook-ins tagged `[karp-face]`:
- `src/net/netmatch.js`: `_adopt` passes the departed peer's queued records to `KarpGun.adopt`.
- `src/game/actor.js`: `_padBarrier` returns whether it pushed; a carrier's push says "You can't take it into a spawn".
  The barriers themselves are unchanged.
- `src/game/player.js`: a carrier's map number keys → "Can't super jump".
- `src/ui/hud.js`: `_jumpTo` refuses for a carrier.
- WP1's modules: `src/game/karpGun.js` (adoption, gids, judged once), `bazookarp.js`, `karpWire.js`.
- Own modules: `hud-karp.js`.
- Tests: `hud-karp.js`, `net-karp.cjs`, `net-karp-steps.cjs`, `net-karp-host.cjs`, `net-karp-full.cjs`,
  `scenes/karp-face.js`.
- Docs: `docs/NET.md`.

## 7. Unfinished, flaky, uncertain
- **The race on a real link.** Mine is the closest of the three readings here, but this machine's page stalls put
  ±0.1–0.4 s of noise on every round, and 12 rounds still swing (lagN3 bot 12 / 0 at a median error of +0.019). Nobody
  has measured it between two real machines.
- **The halfway line on lockgate** is a few short dashed pieces round the Pond's bridge, broken by the canals and the
  bridge's steps. On halyard it is one line across the Pond deck.
- **Timing tests on this machine.** hud-karp's real-time checks (I4, I6, J4) fail when a page runs at 12 fps with 1–2 s
  stalls (hud600f). They pass when it is merely slow (hud600d: the banner's first frame came 952 ms late).
- **The one-way estimate** (relay pings) still drives the ring's correction and the race's wait: it fails safe (the
  ring short, the wait capped at 0.3 s) but runs high on a loaded machine.
- **Halyard's bridge-dressing change** is in WP4b's file; the integrator should keep it if WP4b moves the Pond.
- **Nobody has listened to `karp_hiss`** (as round 0).

