# Wave 2 polish on b5-int3: the lead's report (2026-10-16)

Worktree `/Users/danielosling/Desktop/1/st-b5-int3`, branch `b5-int3`. This package was started on 2026-10-10 by a builder
who was cut off after about two hours: 21 commits (a0fc3f46 … ed69203b on top of 0a973384) and an uncommitted draft of this
report. I took it over on 2026-10-16: I read all of it, kept what was sound, re-ran what it had left unproven, and did the
rest. Everything ran locally, one Electron at a time under the shared SLOTS=3 lock (the machine at load 14–20 throughout);
nothing pushed; the user's app and `dist/` untouched. **Bold** = a decision or a finding the lead must tell the user.
"HEAD" below means the takeover point ed69203b. Logs: scratchpad `p2/` (m/ matches, t2/ tests, probe/, reach/, shots/).

Note: `tools/botlab/jobs/batch5/COMMON.md` in this worktree carries an uncommitted edit I did not make (2026-10-16: "THE
MAC MINI IS BACK"). I left it untouched and uncommitted and, as my instructions say, pushed nothing: `JOB-1.sh` is
committed for the record and runs when the lead pushes the branch.

## 1. Chain Bobber bots

**Outcome: real work done, numbers better, but for bots the Chain Bobber is still mostly area denial — TELL THE USER.**
At the shipped code: PENDING-FINLINE. The lead's bar was "wasted well under 88 %, at least one bobber splat a match":
the waste bar is met PENDING-WASTEMET; the splat bar is not PENDING-SPLATMET.

What I found first (instrumented, `match.cjs` BOBBER-WASTE / BOBBER-AIMED / SNAPLOG): at HEAD the waste was mostly
*collateral* — teammates' unaimed shots and blasts through webs, chain reactions — and the aimed chain shots almost never
connected: of 26–38 aimed engagements a Zone Control match, 0–3 set the chain off ('foeGone': the foe had stepped out
before the bot's aim settled on a 0.2 m bobber — the foes' bots notice an armed web 0.3–0.5 s after it floats and walk
out of it, and their guard never lets them walk into one they have noticed).

What I changed (all kit-local: `kits/bobber-bots.js`, two lines in `bobber.js`):
- **Snaps** (`SNAP`): a lone bobber thrown to float on the feet of a foe that is *not duelling us* (facing more than 60°
  away: busy with a teammate, painting, charging elsewhere), only by a weapon whose shot gets there within 0.3 s, never
  where its blast would reach a teammate's idle web; aimed at for its last 0.3 s of flight while nothing hits the bot,
  and shot the moment it floats with that foe where the shot will find it (`arrivalT`: the weapon's own flight time).
- **Aimed chain shots**: the bot keeps going while its foe is where the shot will find it *or walking in* (the old
  re-check used a stricter rule than the scan that engaged, and stopped at once); an automatic gun fires once its aim is
  within the bobber's own size (one shot a press, and chargers, within half of it), else stops and drops a charge.
- **Idle means idle**: a chain counts as having a foe in it only when the foe is well inside (R(N) − 0.35): a shot
  through a chain whose foe stood at its rim set it off for a glancing 25–35 or nothing, and the bobber ate the shot.
- Kept from my predecessor: team knowledge for the trigger (a foe a teammate saw ≤ 0.35 s ago; the bot still needs its own
  line to a bobber), foes' bots arm an enemy web only while a known foe of its team is within that foe's gun reach + 2 m,
  the Turf ambush (a hidden squid by its own web), the third-guard fallback.
- Tried and **dropped**: rarer Turf webs (0.8 % and 1.2 % a frame, 80–85 ink: Turf then set off no chain at all in 6
  matches — the webs were most of Turf's few catches; `TURF_WEB` is a knob, back at the built 2 %/72); snaps at *any*
  foe — see the duel probe.

**The duel probe** (new, `jobs/batch5/int3/probes/duel-bobber.js`: one bot with the sub against one without on testbox,
real brains at normal, a Splattershot each, 60 rounds): no sub 22–21 (A's splats – B's); snaps at any foe, pre-aimed: 10–23
(40 rounds); snaps at a slow foe: 17–29; snaps at any foe without the pre-aim: 24–23 but they caught nothing; **the
shipped gate (a foe facing away): 21–24, no cost.** The pre-aim is what makes a snap catch, and in a duel it is also what
loses the duel: the bot looks away from the foe that is shooting it.

Numbers (all `SUBS=all=bobber`, `match.cjs` with DIAG; Turf 180 s, Zone Control its full 300 s; halyard + saltpan; random
weapons, which swing a 2-match set a lot: melee kits and the bucket can't snap or shoot a bobber from range):

| set | matches | chains set off | caught a foe | wasted | bobber splats | splats a match |
|---|---|---|---|---|---|---|
| reviewer at 19feccc (Turf) | 2 | 1 | 0 | 100 % | 0 | 0 |
| sub-bobber builder's | 6 | 33 | 4 | 88 % | 2 | 0.33 |
| my predecessor's v4–v6 (Turf + Zone) | 12 | 63 | 15 | 76 % | 6 | 0.50 |
| HEAD ed69203b (my baseline) | 4 | 19 | 3 | 84 % | 2 | 0.50 |
| snaps at any foe, pre-aimed (my v2–v4; they cost duels) | 12 | 76 | 25 | 67 % | 10 | 0.83 |
| gated snaps, no pre-aim, rarer Turf webs (v5, 2 scan sets) | 8 | 34 | 12 | 65 % | 5 | 0.62 |
| gated + pre-aimed snaps, rarer Turf webs (fin) | 4 | 13 | 5 | 62 % | 2 | 0.50 |
| **shipped** (fin2) | 4 | PENDING | | | | |
| shipped + `dangerHear=2.5` (hear3, the A/B below) | 4 | PENDING | | | | |

**Decision for the lead (TELL THE USER):** with bots that never walk into a web they have noticed and a 0.2 m target the
blast needs a shot on, bots get an occasional catch from the Chain Bobber — mostly in Zone Control, where foes must come
to the zone — and area denial everywhere. Two levers that are not "kit-local tuning" are measured for you:
1. Snaps at any foe (pre-aimed): ~0.8 bobber splats a match and 67 % waste, but bots lose their 1-v-1s (the probe).
2. `SUBS.bobber.dangerHear` (a knob, off): foes' bots notice an armed web only within that many metres, or in front of
   them with a line (now: within 5 m whatever way they face, like a beeping bomb — a floating bobber is silent once it has
   inflated). At 2.5: PENDING-HEAR. It also makes a *human's* webs catch bots more often.

## 2. Bot teammates and a human's webs

What stops a bot teammate from blowing a web (a human's or anyone's) with no foe in it — my predecessor's work, which I
checked and extended:
- **Every bot sub throw** goes through one press path in bots.js, and one tagged line after the kits' botAct asks
  `SUB_KITS.bobber.holdThrow` (7882d3ee): it predicts where the throw goes off — a lob's landing by the bomb-arc preview's
  own flight (`throwVelocity`, the same 60 Hz integrator: Splat Bomb, Cling Charge, Pop Pellet, Sprinkler, Shaker and its
  hops; a homing sub — Skitter, Waddle, Torpedo — on the foe the team knows nearest the landing within its sense reach), a
  Tracer Bolt's line, a Whirl Boomerang's run, hover and burst — and holds the throw 1.2 s if the blast would reach an own
  idle chain (no foe the team knows in it). That covers zone ink lobs, tower lobs, fight bombs, paint subs, memory and
  shield lobs, a Bomb Barrage's bombs and kit subs. The press is checked again on its release frame (9513e5bb: a fight lob
  turns onto its target in between), and a held Shaker checks its own release (6895c9ff).
- **Kit paths** ask `webHit` themselves: the Glide's release (a slide stopping by an idle web is treated like a sunk one),
  the Dash Pellet's pop, the Mitts leap's landing smash (`landingOk`) — and, mine (1e8ac7d2), a Mitts wall leap's landing.
- **Kit weapons**: hold-fire counts a kit weapon's own charge as "going" and drops it (letting go of the trigger used to
  loose the Cutlass's charged cut and wave straight into the web), clears a Cutlass's buffered tap, gives the Mitts' fist
  its whole reach in the capsule, and runs during a special too (92c1faae: a teammate's Zipcaster shots blew webs).
- Mine (69280303, b97b3ebf): a snap is never thrown where its lone blast would reach a teammate's idle web (it would
  take that web with it), and a chain counts as idle unless a foe is well inside it (R(N) − 0.35, ±1.6 m): a shot through
  a chain whose foe stood at its rim set it off for a glancing 25–35 or nothing, and the bobber ate the shot.

(pending)

## 3. Zone Control guards' chains

- **The third guard's fallback** (my predecessor, 6d00381c): when a guard's look finds no chain (a small, ledgy raised zone
  whose edge two teammates' webs already hold — the misses the builder named), it looks once more with anchors all round
  its zone's own ground, not only the foes' half, and a teammate's web kept 2.3 m off instead of 2.8 (out of a lone
  bobber's reach of it, so one blowing still doesn't take the other) — `planChain`'s `_relax`, counted in
  `BOBBER_BOT.fallbacks`.
- **The mid-burst drift, explained (not reproduced):** mid-burst a bot's move is damped to 5 % unless it is fighting; the
  only undamped movers are a fight (a foe in sight) and a respawn (a fall in the water) — the builder's three misses were a
  ledgy raised zone, a 2.6 m drift and a fall into the water. The burst's later links re-pick their spots from wherever the
  bot is (`linkNear`), with up to two growth plans after, so a drift costs a link, not the chain. In only=zone the guards
  face nobody, so a drift there can only come from a respawn; none happened in my runs.
- `sub-bobber.js only=zone` on halyard, 10 runs at the final code: PENDING-ZONE10. (My predecessor's 10 — 5 before the
  fallback, 5 after — were 10/10.)

## 4. Glide Bomb

(a) **Root cause of the missing stone (my predecessor, 0be5f852; I confirmed the mechanism in the code):** sub-glide.js runs
past a 3:00 match. Once the clock ran out the match left 'playing', match.js stopped calling the brains and zeroed every
intent, so the scripted kid's press never reached its runner — always late in part 'more', so 1 full run in 3–11, and
which throw failed depended only on how long the earlier parts took. The test now keeps the clock from running out (as
sub-bobber.js does); it also pins the local kid's, the foe's and the mate's loadouts at the start (restored at the end),
puts the Barrage's special back after 'lock', and a throw that makes no stone is a FAIL with its state and trace instead
of a TypeError. Three full runs at the final code: PENDING-GLIDE3 (the predecessor's three before my changes: 61/61, 61/61,
61/61; before the clock fix it had 58/60, 58/59, 59/59, 57/60, 58/61, 58/61).

(b) **The roll, made to read as a roll (mine).** The pictures my predecessor left showed what the reviewer saw: the stone is
set down 0.5 m ahead on the release frame, and the roll pose then swung the free arm *back* and through — after the stone
was already on the floor, so no frame ever had it in the hand. Two small visual changes (gameplay, timing and records
untouched): the stone's look starts at the fist that held it (the held prop's foot and size) and eases onto its true spot
and size over 0.12 s (`glide.js fromHand`; every screen does it for its own copy); the roll pose swings straight through
from the low carry, peaking 0.07 s after the release (`character.js _poseRoll`: the back-swing after the release is gone).
Pictures, side-on with a Splattershot in the other hand: PENDING-GLIDEPICS.

(c) The `glide.js` header documents the records the code writes ([4] with the bounce's kind and who; [2, gid, 0, hot] /
[2, gid, 1] / [2, gid, 2]; the lava → stage hazard → liquid order, `stage.under`) — my predecessor, a0fc3f46.

(d) Bots' fight throws (my predecessor, f6d5bf3f, on top of the integrator's 40da5abf): a real plant while a fight cook is
held whatever set the move (bots.js `_tail`: no step toward the target, half pace, no hop), the cook fixed at the plan
(+0.3 s at most), a foe inside 4 m gets what is cooked now, fight throws twice as likely at a foe facing ≥ 60° away and a
fifth as likely past 11 m; sub-glide 'bots' pins B's weapon and adds Cutlass and Mitts rounds (≥ 5 m out or let go short
of a full cook, never a fizzle). Hits per use against the Splat Bomb, 2 Turf matches each (halyard, saltpan, 180 s):


| all on one sub, Turf 180 s | uses | enemy hits | hits a use | damage | splats | bots' fight / paint throws |
|---|---|---|---|---|---|---|
| Glide Bomb, halyard | 31 | 2 | 0.065 | 180 | 2 | 9 / 24 (5 cooked) |
| Glide Bomb, saltpan | 30 | 0 | 0 | 0 | 0 | 4 / 32 (2 cooked) |
| **Glide, my 2** | 61 | 2 | **0.033** | 180 | 2 | 13 / 56 |
| Splat Bomb, halyard | 26 | 2 | 0.077 | 222 | 2 | |
| Splat Bomb, saltpan | 43 | 3 | 0.070 | 181 | 1 | |
| **Splat Bomb, my 2** | 69 | 5 | **0.072** | 403 | 3 | |
| (my predecessor's 1 each) | Glide 35 / Bomb 21 | 2 / 0 | 0.057 / 0 | 128 / 0 | 1 / 0 | Glide 5 / 31 |

Pooled over the three matches each: the Glide 0.042 hits a use (4 in 96, 3 splats), the Splat Bomb 0.056 (5 in 90, 3
splats). **For the balance pass: bots throw the Glide mostly to paint (about four in five), and a fight throw lands about
as often as a Splat Bomb does.** A further kit-local bias would only move the share of fight throws, not their aim; I
left it at my predecessor's (fight throws twice as likely at a foe facing ≥ 60° away, a fifth as likely past 11 m).

## 5. Scrap Sentry

The review's minors, each done by my predecessor (0eeec751, b7a07f89, 3b775bc8, f83e9dda); I looked at the pictures and
re-ran the tests at the final code (below):
- **Icon** redrawn in the roster palette (team-colour can, light bottle head, dark legs, barrel and tape, white highlight;
  the same silhouette, filling the 64 px box): `out/sentry-picker.jpg` (beside the other subs in the picker),
  `out/sentry-life.jpg` (on the HUD badge with its life ring).
- **Stencil** centred on the scrap plate and lifted clear of its dome: `out/sentry-stencil.jpg` (the team-ink squid now
  reads whole on the plate).
- **Practice late joiner**: every owner restates its live sentries ([0] where it stands, [4] where it rides, [5] its hp)
  at 1.5, 4, 8, 15, 25 and 40 s after a join (a joiner's stage takes tens of seconds to build). New two-client scene
  `net-sub-sentry.cjs scene=latejoin`. docs/NET.md updated. **Wave 1's devices and the Chain Bobber keep the late-joiner
  gap (a known limit, in NET.md).**
- **Checks that could not fail**: the Tower rider check runs the rider's live brain on the moving deck; the ghost-burst
  check counts only that ghost's own 'sentry:fire' ghost events; the roller starts inside 8 m walking at the owner; a fight
  placement needs a known foe; sfx-cues has a Scrap Sentry scene (set down, unfolded, its idle loop following it, shot
  down, the loop gone). The revert proof for the rider check (bots.js's `rides` exception removed): PENDING-NORIDES.
- **"Per-step devices() polling"**: none left — the Glide gathers the sentry descriptors once a frame and once at the
  start of a prediction run (`glide.js gatherBumpers`, "never per step"); wave 1's device pick runs every 0.35 s a bot.

**The lock-on share.** Measured per placement (`SENTRY_STATS.src`: the bot's reason, its seconds standing, the seconds a
foe was in its arc — any foe within 11 m with a clear line from its eye — and the seconds locked; match.cjs SENTRY-SRC):

| set (all=sentry; halyard Turf, saltpan Turf, halyard Zone, saltpan Zone) | set down | locked | foe in its arc | its splats | its damage |
|---|---|---|---|---|---|
| before my predecessor's placement change (its numbers) | 9–29 a match | 5 / 3 / 12 / 5 % | 3 / 4 / 9 / 5 % | — | — |
| HEAD ed69203b (my baseline) | 4 / 5 / 11 / 12 | 0 / 2 / 11 / 10 % (7.3 % pooled) | 1 / 2 / 14 / 11 % (8.7 %) | 0 / 0 / 3 / 1 | 506 |
| **after** (mid-duel placement, below) | 12 / 16 / 20 / 20 | 6 / 3 / 11 / 4 % (6.4 % pooled) | 10 / 6 / 13 / 5 % (8.5 %) | 5 / 4 / 3 / 3 | 1,210 |

- Where bots put it, at HEAD: almost only in fights (the Turf rule — on the contested stretch toward a foe the team knows
  it would see — fired 0 times in 2 Turf matches; the zone rule once in 2 Zone matches: a guard with a foe near is in
  fight mode, so its fight rule places it). And the fight rule only set it down **when the bot had not been hit for 1 s**
  — which a duel never is: 4–5 sentries a Turf match.
- The change (3b182596): mid-duel too, not below 40 hp (it folds when its owner goes). The duel probe (new,
  `probes/duel-sentry.js`, 60 rounds of 8 s): set down 9 times and 26 duels won to 23 before; 18 times and **36 to 18**
  after (no sub: 20 to 29). A turret beside you splits the foe's attention: its bots strafe across its line or shoot it.
- **The share itself barely moves, and that is the foes' bots, not the placement:** botSpecials routes them round a
  turret's sight (a lingering danger over every node it has a line on) and its threat code strafes or shoots it, so a
  foe stays in its arc only while it is busy fighting there. In Zone Control (foes must come to the zone) it holds a target
  ~11 % of its life; in Turf they leave. What the change bought is use: twice the sentries, ~4× its splats, 2.4× its damage.
- The human's side (my predecessor, 0eeec751): **the 11 m guide ring is now a visibility outline** — 48 sight lines from
  its eye height; the bright edge and fill stop at the first wall, the full 11 m shows faint past it — so the preview
  tells you where it will see: `out/sentry-guide.jpg`.

## 6. Dash Pellet

(a) **Done by my predecessor (f74b1731), checked by me.** The local dasher now gets feedback that reads from behind: the
speed ribbon faces the camera (each point's width taken across both the trail and the line of sight, so a forward or
backward dash no longer shows a band edge-on); speed lines streak in from the screen's edges for 0.3 s; and a +7°
vertical FOV kick eases out over 0.35 s (`G.dashKick`, one tagged line in cameraRig.js). All three are for the local
dasher only, and none of them crosses the wire. sub-dash 'look' measures 8,288 px² of ribbon strip from behind on a 960×540
view, against 15 px² for the old vertical band. Pictures (I looked at all three): `out/dash-pov-fwd.jpg` (~0.1 s in: the
lines, the kick, the pop), `out/dash-pov-fwd-late.jpg` (~0.17 s), `out/dash-pov-back.jpg`.

(pending)

## 7. Regressions after the later fixes

(pending)

## 8. The Carp Field's 60 ms load budget

Not done: **caching the field per stage state would not help the number that is over.** The field is built once at match
start, for every state the stage has (`KarpField` precomputes every state's arrays; `setState` only swaps them), so the
build the 60 ms budget is about is cold whatever is cached; a cache keyed by the stage would only save a rematch or a
Practice swap back onto the same stage. Where the time goes, measured here (karp-field.js, this busy Mac):
PENDING-KARP. The quiet-machine measurement is in JOB-1's list for the Mac mini (and now that it is back, the lead can
push it).

## Online

Nothing new crosses the wire. The bobber and sentry changes are bot decisions (the host's bots; a client's own bot never
runs online); the Glide's out-of-the-hand look and the roll pose are drawn on every screen from what each already has (a
ghost stone eases out of the remote kid's fist from the existing [0] release); the dash's lines and kick are the local
dasher's only; the Scrap Sentry's late-joiner restatements re-send existing [0] / [4] / [5] records. Two-client tests
re-run at the final code: PENDING-NET.

## Shared files touched (all tagged [b5-int3])

- `src/game/bots.js` (my predecessor's): one line after the kits' botAct (`holdThrow`), the release-frame re-check in
  `_tail`, the Glide plant in `_tail` (6 lines).
- `src/game/character.js` (mine): `_poseRoll`'s timing (3 lines).
- `src/game/cameraRig.js` (my predecessor's): one line (the dash kick).
- `src/config.js` (mine): one knob, `SUBS.bobber.dangerHear` (off).
- Kit files: `kits/bobber-bots.js` (most of it), `bobber.js` (the snap item, the waste counter), `glide.js`, `sentry.js`,
  `dash.js`, `mitts.js`, `shaker.js`. Docs: `docs/NET.md` (sentry late joiner), `tools/botlab/README.md` (the counters).
- Tooling: `tools/botlab/match.cjs` (BOBBER-SCAN / -WASTE / -AIMED / -SNAPLOG, SENTRY-SRC). Tests: sub-bobber.js,
  bobber-web.js, sub-glide.js, sub-sentry.js, net-sub-sentry.cjs, sub-dash.js, dash-reach.js, sfx-cues.js.

## Commits (b55f7472..HEAD; mine from 1e8ac7d2 up, my predecessor's ed69203b and below)

- `d485e090` botlab README: the new Chain Bobber counters on match.cjs (BOBBER-WASTE, BOBBER-AIMED, the snaps; SNAPLOG=1) and the dangerHear A/B knob
- `8ad535c0` (scratch) int3 polish: the duel probes (a bot with the Chain Bobber or the Scrap Sentry against one without, testbox, real brains: who wins the due…
- `3b182596` Scrap Sentry bots: set down mid-duel too (it was only when not hit for 1 s, which a duel never is), not below 40 hp (it folds when its owner goes)…
- `c49e1887` Chain Bobber bots: Turf webs back at the rate as built (TURF_WEB 0.02 / 72 ink, a knob for the balance pass) — made rarer, the Turf matches set off…
- `7af5e7a3` Chain Bobber bots: a snap only at a foe facing away from us (busy with a teammate, painting, charging elsewhere), never at one duelling us — gated…
- `69280303` Chain Bobber bots: an aimed chain shot keeps going while its foe is where the shot will find it or walking in (the re-check used a stricter rule th…
- `b97b3ebf` Chain Bobber bots: snaps — a lone one thrown onto a foe that isn't strafing a duel with us (slower than 2.5 m/s, or facing away), aimed at for its…
- `1e8ac7d2` mitts.js: a bot's wall leap is checked against own idle Chain Bobber webs at its release too (a wall landing smashes as a ground one does: landRadi…
- `ed69203b` dash-reach.js: a swim jump + dash's first landing has its own bar — a plain swim jump's peak (1.70 m at 1/60, a running hop's 1.35) plus the runnin…
- `49913196` bots.js: the release-frame check skips held subs (a Glide Bomb's cook, a Shaker's shake: their kits check their own release)
- `9513e5bb` bots.js: a bot's sub throw is checked again on its release frame (the press was checked with the frame before's aim; a fight lob turns onto its tar…
- `6895c9ff` Shaker bots: the release is checked too (held a second or more, the aim moves after the press was checked) — a throw that would go off by an own id…
- `da1fb05f` (scratch) int3 polish: pictures — the Dash Pellet from the dasher's own camera (forward ~0.1 s and ~0.17 s in, backward: speed lines, the FOV kick,…
- `0be5f852` sub-glide.js: the missing stone's root cause — the file runs past a 3:00 match, and once the clock ran out match.js stopped calling the brains and…
- `2f96d96a` sub-dash.js 'look': the follow camera put behind the kid first (in a full run the earlier sections left it side-on, where the old band shows too: 4…
- `92c1faae` Chain Bobber bots: hold-fire runs during a special too (a teammate's Zipcaster shots and blasts blew the clear-variant webs: botAct returned before…
- `f83e9dda` sfx-cues.js: a Scrap Sentry scene — set down, unfolded, its idle loop following it, shot down: the loop gone with it (the sub-sentry review)
- `f6d5bf3f` Glide Bomb bots: a real plant while a fight cook is held — bots.js _tail strips any step toward the target from whatever set the move (sidesteps on…
- `3b775bc8` NET.md: the Scrap Sentry's restatements for a Practice late joiner (and the gap wave 1's devices and the Chain Bobber still have)
- `b7a07f89` sentry.js: a late joiner's restatements at 1.5, 4, 8, 15, 25 and 40 s after the join (a joiner's stage takes tens of seconds to build: the first th…
- `f5ca9bd5` dash-reach.js: a swim jump + dash's first landing is judged against a plain swim jump near that block too (a top a swim jump reaches is not the das…
- `6d00381c` Chain Bobber bots: a Zone Control guard whose look finds no chain tries once more with a fallback — anchors all round its zone's own ground and a t…
- `0eeec751` Scrap Sentry: the review's minors and the bots' placement — the icon redrawn in the roster palette (team-colour can, light bottle head, dark legs /…
- `6eeab949` Chain Bobber bots: a chain is shot only with the foe well inside its reach when the blast gets there (R − 0.35 at 0.35 s: rim shots were the wasted…
- `0947f304` dash-reach.js: the moves that reach furthest — a swim jump + air dash (own ink at swim speed, squid held to the press at 18/30/38/46/56, judged aga…
- `f74b1731` Dash Pellet: the dasher's own camera reads a forward or backward dash — the speed ribbon faces the camera (each point's width across the trail and…
- `7882d3ee` Chain Bobber bots: teammates never blow an idle web — every bot sub throw (one press path: zone / tower lobs, fight, paint, memory and kit subs, a…
- `a0fc3f46` glide.js: the header's records as the code writes them — [4] with the bounce's kind and who, [2, gid, 0, hot] / [2, gid, 1] / [2, gid, 2], the lava…
- `0a973384` (scratch) Wave 2: every open item after integration, per package (the last reviews verbatim and the integrator's report), for the polish package

## Unfinished / uncertain

- **Chain Bobber bots fall short of "a bobber splat a match"** (see §1): the lead decides; two measured levers offered.
- The dash-reach audit at 1/60 ran here on half of every stage's edge nodes (step=2, off=0): PENDING-REACHSTATUS. The other
  half (off=1) and the whole 1/24 pass are in `JOB-1.sh` for the Mac mini (which COMMON.md now says is back — I pushed
  nothing).
- perf-bobbers phase 4 and the Carp Field's 60 ms budget need a quiet machine; this one never was (load 14–20): the numbers
  here are the busy machine's, the quiet ones are JOB-1's.
- Random loadouts swing a 2–4 match set a lot (melee kits and the bucket can't snap or shoot a bobber from range): every
  bot-match number in this report is a small sample; the lead's consolidated balance pass should re-measure.
