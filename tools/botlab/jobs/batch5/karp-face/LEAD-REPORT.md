# Bazookarp WP2 (online and the finished face, key `karp-face`) — lead report, fix round 1

Worktree `/Users/danielosling/Desktop/1/st-b5-karp-face`, branch `b5-karp-face`, base `b5-int3` b55f7472. Nothing pushed.
The mode stays hidden behind `WIP_MODES` (`?wipmodes` / harness `WIPMODES=1`); its switch is untouched. Everything ran on
this Mac under the shared SLOTS=3 lock (load average 60–500 while I worked); the Mac mini was not used (my instructions
said it is unavailable; `COMMON.md` in the worktree was edited by someone else to say it is back — left uncommitted).

## Review round 1 (LEAD-REVIEW.json, verdict REDO): what I did about each issue, and the proof

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

## 1. What WP2 built (SPEC §11 WP2), with this round's changes folded in

### Netcode (SPEC §7): `NetWire` (src/game/karpWire.js) and the engine's net surface (src/game/bazookarp.js)
| item | how | proof |
|---|---|---|
| discrete records with `q`, sent at once (`bk`) | `_rec` takes `max(q, lastQ) + 1` (a new host never reuses a q) | host-bots, host-plant |
| snapshots `s` 10 Hz / `S` 1 Hz (`ks`) | a snapshot older than the last discrete record, or after the end, changes nothing (round 1); stamped with the host's wire clock, aged through `NetWire.hostNow(sender)` (round 1; `'ks'` hands netmatch's sender) | snap 17 / 17b / 18, lag 9c |
| claims with `ts` and `fs`, the hold, the race | first to touch on its own screen wins after a wait for claims in flight (round 1, issue 4); newest sample or any in the last 0.4 s | racefair 12/12, race7, face 3 / 4 / 5 |
| `kd`, `kx` / `u`, the window's grace | WP1's; a grant held open is decided when the grace runs out; a follower's `u` clears its shell copy | base 7 / 8, lag 15b / 15c |
| `kh` on the 20 Hz tick | WP1's | base 1 / 1b (B's own sends: peak 22/s) |
| `kr` / `kf` | WP1's; re-sent to a new host | lag 9 |
| `onSamples` from `_sample` | real samples only, scored in order | face 6c / 6d |
| Carp Shot blasts on victims' screens, `[3]`; `karp:shot` for a ghost launch | WP1 + round 0 | base 5–5d, face 7 / 7b |
| the fuse hold before a remote carrier's Carp Blast | ≤ 0.3 s, a death record that plays first wins | face 11, lag 9b |
| the carrier's ring (§7.2) | jumps forward at once, gives back ≤ 0.2 s/s; now on the wire clock | hud-karp D, lag 9b / 9c |
| a remote carrier's fuse on followers | read forward ≤ 0.6 s from the newest snapshot of THAT carrier, from the grant on | snap 17b, host-bots |
| `onLeave`'s order, the narrowed flush, the `'k'` case, `onHostChange`, disconnects | round 0 | host-bots / plant / shot / cargo / guestleave, net-tower, net-zones |
| results `karpM` / `karpPops`; late join (the locked room) | round 0 | face 16, full |

### The finished HUD (§6.1–6.5, src/ui/hud-karp.js)
Unchanged from round 0, apart from this round's fixes:
- world tags clear of the top bar and of live call-outs;
- the meter tag not under the status pill;
- our call-outs after, and under, a kill call-out;
- the short exit lift for both kinds of call-out in this mode;
- the big last-10-s digits.

Round 0 built the count badges, the Carp Line, the status pill, the over-head marker and its edge pin, the reticle
rings, DON'T RETREAT! / CARP-FREE ZONE!, the meter tag, the weir and Gate tags, the squad badge, the carp on the
special orb, prompts and call-outs, "Can't use" notes, the minimap / TAB layer, and hud-lead mode `karp`.

### Menus (§6.6, DECISIONS #10), looks (§6.7), the `sp_karp` model, sound (§6.8)
As round 0, plus this round's 960×600 fixes (How to Play's short-window layout, the five-card badges) and halyard's
bridge dressing gone in this mode.

## 2. Decisions where the request left a gap (the lead tells the user)
- **The race (round 1).** First to touch on its own screen wins, nearest on a tie (SPEC §7.3: nearest). The host waits
  up to 0.3 s for claims in flight when a guest is within about 7 m.
- **The ring's time base (round 1).** The host's wire clock through the peer offset plus a one-way estimate built from
  relay pings, instead of SPEC §7.2's "match clock". The ring now runs slightly short (≤ 0.3 s) instead of long.
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
- **Records.** The only new field on the wire is `fs` on `kc`. Snapshot `t` is now the host's wire clock; its meaning
  changed, its format did not.
- **Who judges what.** As SPEC §7.1, except the race order above.
- **Bots.** No bot code touched (WP3's). Offline the race change only matters when two of the host's own actors touch
  within the same window: the earlier toucher now wins instead of the nearest.
- docs/NET.md has the protocol: late snapshots, the race, the wire clock, the tests.

## 4. Tests (all on this Mac; net tests `Q0..Q2='autopilot&wipmodes'`). Final code = HEAD 6cbd0a15 unless noted
| test | result | notes |
|---|---|---|
| `net-karp part=snap` (new: 17, 17b, 18, 16) | **5/5** (snap2, final); pre-fix **2/5** | issues 1, 2 |
| `net-karp` base (21 checks, with 1b) | **21/21** (base2, final) | 1b: B's own sends peak 22 in any 1 s, 19.3/s mean |
| `net-karp part=face` (2–11, 16; step 5 alternating) | **16/16** (face3, final) | step 5: bot 5 / guest 5 |
| `net-karp part=lag` (netlag 150 + jitter 60, with 9c) | **9/9** (lag2, final) | 9c mean −0.26 s (8 pairs −0.20…−0.30); 9b worst rise 0, 0 s at the blast |
| `net-karp part=racefair` (new) | **12/12**; pre-fix **7/12** | issue 4's rule |
| `net-karp part=race` / `racekid` (16 rounds, alternating) | race7 **8/8**, racekid5 **8/8** | the −x side won every round, whoever stood there |
| `net-karp part=raceswap` / fixed sides (diagnosis) | host bot from −x 12/12; guest from −x 16/16 (×5, at 30 and 60 fps) | karpbox's Pond geometry |
| `net-karp-host part=bots` / `part=plant` | **6/6** / **4/4** | new host, the race and late snapshots |
| `net-karp-full.cjs` (3 clients, a real 5:00 match, the host leaves mid-match) | **11/11** (full1, final) | 22 bursts / 22 pick-ups / 34 Carp Shots on both remaining screens; the same result and results table; A turned away mid-match, rejoins in the lobby; relay peak 30/s, no kicks |
| `hud-karp.js` (I1–I6 new) | **33/33** at 960×600 (final HUD code), **33/33** at 1920×1080, 32/32 at 1512×945 | |
| `karp-menus.js` (H2, M3 new) | **14/14** at 960×600 and at the default size; pre-fix at 960×600 **12/14** | |
| `bazookarp-rules.js` | **118/118** (rules2, final) | M6 new, B4 updated |
| `karp-loop.js` (offline follower, late snapshots) | **6/6** | |

**Round 0 results that still stand.** This round didn't touch their code: `net-karp-host` shot 3/3, cargo 4/4,
guestleave 2/2; `net-tower` 5/5, `net-zones` 5/5; `net-practice` 29/29, `net-turf` 9/9; `hud-lead` bazookarp / turf /
zones / tower 13/13, 22/22, 14/14, 12/12; `sfx-cues` (alone) 58/58; `karp-two` 6/6, `karp-gun` 12/12,
`karp-shell-dps` 36/36, `int3` 10/10; `loadout-picker` 23/23; `wip-stages` 22/22 (± `?wipstages`); `net-lobbykit`
16/16.

Not re-run: `net-karp-crush`, `audio-pause`, `stage-audit` / `size-budget`.

## 5. Pictures (`tools/botlab/jobs/batch5/karp-face/out/`, JPEG < 300 KB, all looked at)
- **Re-taken this round, halyard day:**
  - at 1080 and 960×600: `hud-start`, `hud-shell`, `hud-burst`, `hud-weir`, `hud-gate`, `hud-ot`, `hud-fuse-low`,
    `menu-mode`, `menu-rules`;
  - at 1080 only: `look-resting`, `look-shell-3m`.
- **Evening:** `1080-lockgate-sunset-*` (TIME=dusk; 14: hud-foe, hud-retreat, hud-sunset-carry, map-tab and ten
  looks). The shot pair was dropped (the camera sat behind the shot). The Gate pair has a dark parapet across the
  bottom: the scene's cameras were tuned on halyard.
- **Removed:** the 16 `1080-halyard-sunset-*`, which were halyard's day.
- **The rest are round 0's:** the other HUD states, maps, menus, looks, `1080-lockgate-day-*` and
  `1080-karpbox-day-look-carrierblock`.

## 6. Commits (this round, oldest first) and the shared files touched
- **Code:**
  - 272df36b: late snapshots, the wire clock, the race order and wait;
  - 8853f091: HUD tags, call-outs, the last-10-s digits;
  - dc552d52: menus at 960×600;
  - a58841de: a sub's × 0.5;
  - aad2cdd5: NET.md, net-karp 1b / 9c;
  - 2a2addb5: halyard's bridge dressing, the burst scene;
  - 6260b919: our call-out after a kill call-out;
  - c3457171: the grant decision log, `part=race`;
  - 4e794721: the wait adds the playback delay;
  - dc561e2f: a fresh free phase claims at once;
  - 2a0cea97: rules B4, step 5 centred;
  - d6573e6f: `part=racekid`, `u` clears the shell;
  - baa8da65 / f16ce210 / 2ac4b9b5: the call-outs' anchor and exit lift;
  - 6c772a14: the touch timing;
  - 9a4ed977: frame rates in step 5;
  - 0d2440b0: NET.md;
  - f95ab463: tags clear of the ribbons;
  - 8a9ec01d: scenes, a HUD frame after call-outs;
  - 7f648c96: `part=racefair`;
  - 64cdeb77 / 47e399d6: `raceswap`, sides alternating;
  - 3d7e7dca: scenes, TIME=dusk;
  - 6cbd0a15: face step 11's bot.
- **Scratch:** 5eead489 (pictures) and this report.

Shared files this round, all hook-ins tagged `[karp-face]`:
- `src/net/netmatch.js`: one line, `'ks'` passes `from`.
- `src/config.js`: `claimWait`, `claimNear`.
- `src/game/objTargets.js` (WP1's module): `isSpecial` with the attacker, and the `barrage:throw` listener.
- `src/world/props-marina-vessels.js`: `ferry_bridge` `notIn`.
- `src/ui/menus.js`: the Overtime note's short span.
- `styles/ui.css`: the short-window How to Play rules and the five-card badges.
- Own modules: `bazookarp.js`, `karpWire.js`, `karpShell.js`, `hud-karp.js`.
- Tests: `net-karp.cjs`, `net-karp-steps.cjs`, `hud-karp.js`, `karp-menus.js`, `bazookarp-rules.js`,
  `scenes/karp-face.js`.
- Docs: `docs/NET.md`.

## 7. Unfinished, flaky, uncertain
- **The race in real play.** It is decided by each screen's own simulation. Whatever slows one side's run, a stage's
  geometry or (slightly) a much lower frame rate, now decides it, as it would offline.
- **The one-way estimate.** It is built from relay pings, and the guests' pings are updated only in the lobby. On a
  connection whose latency changes a lot mid-match, the ring's correction and the race's wait use stale numbers. Both
  fail safe: the ring short, the wait capped at 0.3 s.
- **Halyard's bridge-dressing change is in WP4b's file.** The integrator should keep it if WP4b moves the Pond.
- **Nobody has listened to `karp_hiss`** (as round 0).
- **This Mac was heavily loaded.** Every result above is from a single run unless several are listed.
