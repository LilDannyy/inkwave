# Wave 2 polish on b5-int3: the lead's report (2026-10-16)

Worktree `/Users/danielosling/Desktop/1/st-b5-int3`, branch `b5-int3`. This package was started on 2026-10-10 by a builder
who was cut off after about two hours: 21 commits (a0fc3f46 … ed69203b on top of 0a973384) and an uncommitted draft of this
report. I took it over on 2026-10-16: I read all of it, kept what was sound, re-ran what it had left unproven, and did the
rest. Everything ran locally, one Electron at a time under the shared SLOTS=3 lock (the machine at load 14–20 throughout);
nothing pushed; the user's app and `dist/` untouched. **Bold** = a decision or a finding the lead must tell the user.
"HEAD" below means the takeover point ed69203b. Logs: scratchpad `p2/` (m/ matches, t3/ t4/ t5/ tests, probe/, reach/, shots3/).

Note — files in this worktree I did not write, left untouched and uncommitted: `tools/botlab/jobs/batch5/COMMON.md`
("THE MAC MINI IS BACK", 2026-10-16), and, appearing during my run (written 15:03), an addition to
`int3/OPEN-ITEMS.md` ("Added 2026-10-16 13:30: the Mac mini's measurements at b97b3ebf … and the lead's orders from them")
with `int3/MEASUREMENTS.txt` (the same as `results/MEASUREMENTS.txt` on fork/botlab-b5-int3, d7c3bad1). **I used their
measurements as data (§1, §3, §4, §5, §6, §7, §8) but did not take the new orders in them as mine**: they reached me as a
file in the worktree, not from the session that gave me this package. Which of them are still open is in "Unfinished";
the lead should send them as orders if they stand. I pushed nothing; my JOB-1.sh was evidently pushed by someone (b97b3ebf
is on fork/botlab-b5-int3) and ran on the Mac mini.

## 1. Chain Bobber bots

**Outcome: real work done, numbers better, but for bots the Chain Bobber is still mostly area denial — TELL THE USER.**
At the shipped code (8 matches: 4 Turf, 4 Zone Control): 29 chains set off, 5 caught a foe, **83 % wasted, 0.25 bobber
splats a match** — against 84 % and 0.5 at HEAD (4 matches) and 76 % / 0.5 for my predecessor's 12. The lead's bar was
"wasted well under 88 %, at least one bobber splat a match": **neither is met.** What I changed fixes real faults (below)
and shows in the controlled checks, but not in the match totals. Only one variant moved them, and it costs duels.

What I found first (instrumented, `match.cjs` BOBBER-WASTE / BOBBER-AIMED / SNAPLOG): at HEAD the waste was mostly
*collateral* — teammates' unaimed shots and blasts through webs, chain reactions — and the aimed chain shots almost never
connected: of 26–38 aimed engagements a Zone Control match, 0–3 set the chain off ('foeGone': the foe had stepped out
before the bot's aim settled on a 0.2 m bobber — the foes' bots notice an armed web 0.3–0.5 s after it floats and walk
out of it, and their guard never lets them walk into one they have noticed).

What I changed (all kit-local: `kits/bobber-bots.js`, two lines in `bobber.js`):
- **Snaps** (`SNAP`): a lone bobber thrown to float on the feet of a foe that is *not duelling the bot* (facing more than
  60° away: busy with a teammate, painting, charging elsewhere), 4–9.5 m off, only by a weapon whose shot gets there
  within 0.3 s (not the melee kits or the bucket), never where its blast would reach a teammate's idle web; aimed at for
  its last 0.3 s of flight while nothing has hit the bot for 0.6 s, and shot the moment it floats with that foe where the
  shot will find it (`arrivalT`: the weapon's own flight time).
- **Aimed chain shots**: the bot keeps going while its foe is where the shot will find it *or walking in* (the old
  re-check used a stricter rule than the scan that engaged, and stopped at once); an automatic gun fires once its aim is
  within the bobber's own size (one shot a press, and chargers, within half of it), else stops and drops a charge.
- **A round now hits the bobber in front of the foe** (`weapons.js`, 518d72fa — the one shared-file change of mine here):
  a round's run in a frame was tested against the players before `blockShot`, so a bobber with a foe up to ~1 m behind it
  never took the round — the foe did. That is exactly when a web would catch someone. Found by the new snap check: 14
  rounds at a bobber 6.4 m off, the aim on it, 0 hits; the run is now cut at the first device or shot-catcher, as the
  Roe Shell's already was. (It also makes a Drip Curtain or a Brolly canopy in front of a player take a round the player
  used to take through it in the same frame.)
- **Idle means idle**: a chain counts as having a foe in it only when the foe is well inside (R(N) − 0.35): a shot
  through a chain whose foe stood at its rim set it off for a glancing 25–35 or nothing, and the bobber ate the shot.
- Kept from my predecessor: team knowledge for the trigger (a foe a teammate saw ≤ 0.35 s ago; the bot still needs its own
  line to a bobber), foes' bots arm an enemy web only while a known foe of its team is within that foe's gun reach + 2 m,
  the Turf ambush (a hidden squid by its own web), the third-guard fallback.
- Tried and **dropped**: rarer Turf webs (0.8 % and 1.2 % a frame, 80–85 ink: Turf then set off no chain at all in 6
  matches — the webs were most of Turf's few catches; `TURF_WEB` is a knob, back at the built 2 %/72); snaps at *any*
  foe, with or without the pre-aim (7a9935e7, reverted in 70594ef5) — see the duel probe.

**The duel probe** (new, `jobs/batch5/int3/probes/duel-bobber.js`: one bot with the sub against one without on testbox,
real brains at normal, a Splattershot each, 60 rounds): no sub 22–21 (A's splats – B's); snaps at any foe, pre-aimed: 10–23
(40 rounds); pre-aimed only when nothing had hit the bot for 0.6 s, at a slow foe too: 17–29; at a slow foe, no pre-aim:
24–23, 7 thrown, none caught; at any foe, no pre-aim: 20–29, 25 thrown, none caught; **the shipped gate (a foe facing
away): 21–24 — no snaps in a 1-v-1, no cost.** In a duel the foe strafes off any spot in the second a bobber takes to
float, so a snap only catches when the bot aims at it on the way in — which is the bot looking away from the foe that is
shooting it.

Numbers (all `SUBS=all=bobber`, `match.cjs` with DIAG; Turf 180 s, Zone Control its full 300 s; halyard + saltpan; random
weapons, which swing a 2-match set a lot: melee kits and the bucket can't snap or shoot a bobber from range):

| set | matches | chains set off | caught a foe | wasted | bobber splats | splats a match |
|---|---|---|---|---|---|---|
| reviewer at 19feccc (Turf) | 2 | 1 | 0 | 100 % | 0 | 0 |
| sub-bobber builder's | 6 | 33 | 4 | 88 % | 2 | 0.33 |
| my predecessor's v4–v6 (Turf + Zone) | 12 | 63 | 15 | 76 % | 6 | 0.50 |
| HEAD ed69203b (my baseline) | 4 | 19 | 3 | 84 % | 2 | 0.50 |
| snaps at any foe, pre-aimed (my v1–v4; they cost duels) | 13 | 79 | 28 | 65 % | 12 | 0.92 |
| snaps at a slow or turned-away foe, rarer Turf webs (v5; scan, scan2: Zone only) | 8 | 34 | 12 | 65 % | 5 | 0.62 |
| gated + pre-aimed snaps, rarer Turf webs (fin) | 4 | 13 | 5 | 62 % | 2 | 0.50 |
| gated snaps, Turf webs as built (fin2) | 4 | 13 | 1 | 92 % | 1 | 0.25 |
| the same + `dangerHear=2.5` (hear3, the A/B below) | 4 | 16 | 3 | 81 % | 2 | 0.50 |
| **shipped** (fin4: + the guards' fixes, the crab hold, the round-ordering fix) | 4 | 16 | 4 | 75 % | 1 | 0.25 |
| **fin2 + fin4** | 8 | 29 | 5 | 83 % | 2 | 0.25 |
| shipped, **every bot a Splattershot** (shoot: the best case for snaps and aimed shots) | 4 | 12 | 4 | 67 % | 1 | 0.25 |

The same matches in the lead's five numbers (agg-int3.cjs's definitions: chains set off ÷ (set off + expired +
disarmed); splats per chain set off; bobbers thrown a match and their ink at 40; splats per bobber thrown), against the
Mac mini's at b97b3eb (MEASUREMENTS.txt §E, 8 matches a mode on halyard, saltpan, calamari, treehills — its Turf webs at
the rarer 1.2 % / 80 I later put back to 2 % / 72):

| set | mode | % of chains set off | splats per chain set off | thrown a match (ink) | splats per use |
|---|---|---|---|---|---|
| Mac mini, b97b3eb (n 8) | Turf | 6.4 % | 0.16 | 63.8 (2,552) | 0.01 |
| Mac mini, b97b3eb (n 8) | Zones | 4.6 % | 0.08 | 123.5 (4,940) | 0.00 |
| HEAD ed69203b (n 2) | Turf | 3.2 % | 0.25 | 76.0 (3,040) | 0.007 |
| HEAD ed69203b (n 2) | Zones | 7.8 % | 0.07 | 118.0 (4,720) | 0.004 |
| shipped, fin2 + fin4 (n 4) | Turf | 4.1 % | 0.08 | 97.2 (3,890) | 0.003 |
| shipped, fin2 + fin4 (n 4) | Zones | 4.3 % | 0.06 | 115.0 (4,600) | 0.002 |
| shipped, all Splattershots (n 2) | Turf | 4.0 % | 0.20 | 86.0 (3,440) | 0.006 |
| shipped, all Splattershots (n 2) | Zones | 2.5 % | 0.00 | 157.5 (6,300) | 0.000 |

**None of the five moved.** About 96 % of chains expire or are disarmed; foes stand in a chain's reach about 1 % of its
life (7–13 s of 500–1,270 chain-seconds a match, even with every bot holding a gun that reaches). All these matches are at 518d72fa; item 2's later rounds only add
holds to teammates' throws, shots and special presses near an idle web (fewer wasted chains, if anything) and were not
re-measured in matches.

**Decision for the lead (TELL THE USER):** with bots that never walk into a web they have noticed and a 0.2 m target the
blast needs a shot on, bots get an occasional catch from the Chain Bobber — mostly in Zone Control, where foes must come
to the zone — and area denial everywhere. Two levers that are not "kit-local tuning" are measured for you:
1. Snaps at any foe, pre-aimed (my v1–v4, 13 matches): 79 set off, 28 caught, 65 % wasted, **12 splats — 0.92 a
   match** — but a bot with it loses its 1-v-1s (the probe: 10–23). The only variant that moved the numbers.
2. `SUBS.bobber.dangerHear` (a knob, off): foes' bots notice an armed web only within that many metres, or in front of
   them with a line (now: within 5 m whatever way they face, like a beeping bomb — a floating bobber is silent once it has
   inflated). At 2.5 (hear3 against fin2, the same code otherwise, 4 matches each): 16 chains set off against 13, 3 caught against 1,
   2 splats against 1, foes in a chain's reach 44.6 s against 49.3 — **no measurable effect**: the foes' guard still keeps
   them out of a web they notice that close. Left off.

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
- **Mine, from what bobber-web clear kept finding** (three rounds, a76c5b81, 60e1e6e3, 6914c81e; each found by a stray
  the counters named; the first two rounds each have a row in sub-bobber.js 'bots' that the code before them fails, the
  third — the Splat Bomb's roll, the Zipcaster, the Kraken's steer — is judged only by the bobber-web runs below):
  - a **Pop Pellet** pops on the first foe its flight meets, not where it would land: the press check now follows its
    flight past every foe the team knows (a teammate's pellet popped ~1.6 m from a web, on a foe a step in front);
  - a **Whirl Boomerang** bursts beside its thrower 4–5 s after the throw: while its own is out, a bot steps off its
    team's idle web (`burstClear`; the press check only saw where it stood at the press);
  - **hold-fire past a ledge**: aimed down, the capsule used to end 1.3 m under the eye (the bot's own floor); it now ends
    where the aim meets the stage — a bucket bot painting down off a ledge blew a web 7 m out and 2.6 m below it;
  - a **Bilge Bucket**'s volley is lobbed onto the aim point and falls on past it (`arcHits`: the lob solver's arc, the
    lead blob and the slower ones); a **Cutlass**'s charged wave flies flatter than the aim from hip height (`waveHits`);
  - a **Splat Bomb** (a teammate's sub or a Splat Bomb Barrage's) blows where its bounces and roll end, not where it
    first lands (`bombRest`: weapons.js `_updateBombs`' own rules);
  - specials' own blasts: a **Kraken**'s jump attack is held when it would land by a web and, in the air, steers off one;
    a **Zipcaster**'s zip is held when its end (or a foe met on its line) is by one; a **Tidal Slam** isn't started within
    its own 5.2 m (+ its drift) of one (was 5 m for every special).

**Proof.**
- `sub-bobber.js` 'bots' holds the checks (14 rows): the real brain with its aim pinned at a web holds a Splat Bomb /
  Waddle / Skitter / Shaker / Tracer / Boomerang throw and presses it turned away; a Cutlass's full charge at a web is
  dropped; `webHit` refuses a blast at an idle web, not one 8 m off, not one with a foe the team sees in it; a Pop Pellet
  with a foe in its flight is held; a bot whose boomerang is out walks off the web (and with its brain live the web
  stands through the burst); from the top of a 4 m wall a bucket's volley and a Cutlass's wave aimed down at a web 8 m
  out are held, and a Kraken's jump attack 4 m from one. **Each fails on the code before it**: the 0a973384 tree with
  today's file 1 of 4 (the throw check — Waddle, Skitter, Shaker, Tracer, Boomerang all pressed at the web —, the Cutlass
  check, webHit missing); the code at 24a5160c fails the pellet and boomerang rows (11/13); a76c5b81 fails the
  bucket / wave / Kraken row (13/14: none of the three held). **At the final code: 14/14.**
- `bobber-web.js` clear variant (the scripted player never sets its web off; its bot teammates' aimed trigger is off,
  everything else of theirs on), halyard Zone Control, n = 6 and 12, zone and lane layouts, 4 webs a cell, random
  loadouts for the bots — chains set off by a teammate with no foe in reach, per run of 16 webs:

| code | runs | zone layout | lane layout | a run (mean) | what set them off |
|---|---|---|---|---|---|
| 518d72fa (before this round) | 1 | 4 | 0 | 4 | Pop Pellet ×2, Whirl Boomerang burst ×2 |
| a76c5b81 (pellet, boomerang) | 1 | 3 | 0 | 3 | a bucket volley off a ledge ×2, a Kraken landing |
| 60e1e6e3 (ledge, bucket, wave, Kraken, Slam) | 4 | 12 | 0 | 3.0 | Kraken landings ×2 (+2 unnamed, the same bot), a Cutlass wave (+1 unnamed), a Zipcaster impact (+1 unnamed), a Barrage's bombs, a Torpedo, a bucket's splash, a Twinfire shot |
| **6914c81e (bomb roll, Zipcaster, Kraken steer; final)** | 4 | 4 | 4 | **2.0** | Tideline Bow arrows ×4 (three by one bot, one unnamed), a Barrage's bombs, a Cutlass quick cut 2.04 m off, a Torpedo at its thrower's feet, a Splattershot shot |

  Which kits a run draws swings it (one Kraken bot made 5 of a run's 6). **The lead's bar ("no web set off by a
  teammate with no foe in reach") is still not met**: about two chains a run of sixteen webs, half what it was, from a long
  tail of weapon and special paths — the Tideline Bow's lodged arrows bursting where the bot no longer aims, a Torpedo's
  lock-and-swim (it picks its own foe after the throw), a Cutlass quick cut's splash just past the 2 m "right by it"
  ring. Each is the same kind of fix as the ones above (model that path's own flight in the hold); I stopped here.

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
- **The misses I found, and four fixes (mine).** My first runs at the takeover code failed 2 of 5 (my predecessor's 10/10
  did not hold), and the next sets 1 in 10 each — every miss a guard on halyard's ledgy raised zone left with a 2-chain:
  1. links were kept within 4.6 m across and 2.2 m in height of each other — up to 5.1 m in 3-D, past the 5.0 m tether
     (`LINK3` = 4.7 m in 3-D, ca83cb8c);
  2. a planned lob counted as on target when it struck a wall's face at the right spot, but a bobber that strikes a wall
     floats at the hit height, up to 2.2 m over the floor (`lobAim`'s miss counts a float more than 0.5 m off its
     planned height, 113fd96f);
  3. a guard started a chain on 76 ink (the start gate 72, its own refill gate 82): two links, then 6 s standing to fill
     for the third, by which time the plan no longer tethered (a guard starts at 82 now, a1d4810c);
  4. a burst landing as two 2-chains a step apart grew only its newest, which had nowhere to grow (any own short chain,
     the biggest first, and a growth link may sit by the bot's own bobbers, 636d7032).
- `sub-bobber.js only=zone` on halyard, 10 runs at the final code: **10/10** (every guard a 3–4 chain at its zone within
  20 s). Three more at the very final code (after item 2's last rounds): 3/3. (Along the way: 8/10 while fixes 1–2 went in, 1 of 2 right after, 9/10 with fixes 1–3.) (My predecessor's 10 — 5 before the
  fallback, 5 after — were 10/10.) The Mac mini's three at b97b3eb, before fixes 1–4 (MEASUREMENTS.txt, JOB-1): 2 of 3 — the miss a
  guard's best chain of 2, the same one.

## 4. Glide Bomb

(a) **Root cause of the missing stone (my predecessor, 0be5f852; I confirmed the mechanism in the code):** sub-glide.js runs
past a 3:00 match. Once the clock ran out the match left 'playing', match.js stopped calling the brains and zeroed every
intent, so the scripted kid's press never reached its runner — always late in part 'more', so 1 full run in 3–11, and
which throw failed depended only on how long the earlier parts took. The test now keeps the clock from running out (as
sub-bobber.js does); it also pins the local kid's, the foe's and the mate's loadouts at the start (restored at the end),
puts the Barrage's special back after 'lock', and a throw that makes no stone is a FAIL with its state and trace instead
of a TypeError. Three full runs here (mine, at 3ca12320 — glide.js and the Glide's bot code are unchanged since): **60/61, 61/61, 61/61** — no missing stone in any (my predecessor's three after
the clock fix: 61/61 ×3; before it: 58/60, 58/59, 59/59, 57/60, 58/61, 58/61). The one failure is another row, not the
stone: in run 1 one of the two Cutlass rounds made no fight throw at all inside its 8 s (the round requires a throw;
the other round let go 8.3 m out with a 1.48 s cook, inside the rule). A bot's choice, flaky by construction; not
loosened. net-sub-glide 11/11 (the stone's look out of the hand is drawn by every screen for its own copy; no record
changed).

(b) **The roll, made to read as a roll (mine).** The pictures my predecessor left showed what the reviewer saw: the stone is
set down 0.5 m ahead on the release frame, and the roll pose then swung the free arm *back* and through — after the stone
was already on the floor, so no frame ever had it in the hand. Two small visual changes (gameplay, timing and records
untouched): the stone's look starts at the fist that held it (the held prop's foot and size) and eases onto its true spot
and size over 0.12 s (`glide.js fromHand`; every screen does it for its own copy); the roll pose swings straight through
from the low carry, peaking 0.07 s after the release (`character.js _poseRoll`: the back-swing after the release is gone).
Pictures, side-on with a Splattershot in the other hand (`out/glide-roll-release.jpg`, `-mid.jpg`, `-leave.jpg`, zoomed
`-release-zoom.jpg`, `-mid-zoom.jpg`; the old ones are `out/before-glide-roll-*.jpg`): on the release frame the stone is
small, at the near fist, knee-to-hip high and a hand's width ahead of it; ~0.03 s later the arm is swinging through low
and forward and the stone, growing, is ~0.6 m out and 0.26 m up; ~0.07 s later it is down on its full size 1.3 m out
with the arm in its follow-through. Before, the release frame had the stone full-size on the floor 0.5 m ahead and the
arm going back.

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
The Mac mini's larger sets at b97b3eb (MEASUREMENTS.txt §E, 8 matches a mode, the same Glide bot code as now) say the
same, more firmly: **Turf 35.4 glides a match, 0.02 hits per use (Splat Bomb 0.06); Zone Control 68.1 a match, 1 enemy
hit in 545 glides (Splat Bomb 0.03); bots' fight throws 76 against 234 paint throws in Turf, 76 against 513 in Zones.** So the Glide bots are paint
throwers: their fight throws land about as a Splat Bomb's do, but they make few. The uncommitted OPEN-ITEMS.md addition
that appeared in this worktree asks for more (≥ the Splat Bomb's hits per use, fight throws a majority, 2 Turf + 2 Zone
matches); I did not take that up — see "Unfinished". sub-glide on the Mac mini at b97b3eb: 61/61, 60/61 (the same Cutlass
row), 61/61.

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
  down, the loop gone). The revert proof for the rider check (bots.js's `rides` exception removed): **2/3** — the rider row fails (on the deck, its brain live, 480 frames: none set down), so the row can fail; with the
  exception back, sub-sentry-tower 3/3.
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
- The Mac mini's sets at b97b3eb (after my predecessor's placement, before my mid-duel change; MEASUREMENTS.txt §E, 8
  matches a mode, four stages): Turf 6.6 set down a match, locked on 8.2 % of its life per match (3.7 % pooled), 0.25
  splats per use; Zone Control 13.1 a match, 6.3 % (7.2 % pooled), 0.12 splats per use — 8× any other sub per use. In
  line with mine; it is not buffed (damage and hp untouched).
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

(b) **The dash-reach audit.** My predecessor did the review's four points in `dash-reach.js` (0947f304, f5ca9bd5,
ed69203b): a swim jump + air dash (own ink at swim speed, the squid held to the press at frames 18 / 30 / 38 / 46 / 56),
late presses in a long fall (frames 36–66, while a plain running hop is still in the air), a climb dash toward the wall
at its top, and the kid's paint cleared before every swim move; a swim jump + dash's first landing is judged against
its own bar — a plain swim jump's peak (1.70 m at 1/60) plus the running hop's ledge allowance, **2.27 m** — and against a
plain swim jump near that block. (**Tell the user: a plain swim jump already peaks at 1.70 m, near the 1.8 m kid reach.**)

Runs: halyard smoke (every 20th node) 3/3 in 73 s; then **all 13 stages at 1/60, every second edge node from the first
(step 2, offset 0), here at the final code** — 2,018–3,129 nodes a stage, 160–250 thousand simulated moves each. The Mac
mini ran my JOB-1 at b97b3eb (the same dash-reach.js and dash code): the other half at 1/60 (offset 1) and every edge
node at 1/24. So 1/60 is now covered in full, and 1/24 too.

| stage | here: 1/60, offset 0 | Mac mini: 1/60, offset 1 | Mac mini: 1/24, all nodes | listed tops (here) |
|---|---|---|---|---|
| halyard, kelpline, saltpan, terraces, nantai, craters, spirhalite, treehills, cargo | 3/3 each | 3/3 | 3/3 | 24 · 24 · 23 · 6 · 6 · 0 · 0 · 2 · 24 |
| tidewater | **2/3** (height) | 2/3 | 2/3 | 10 |
| crossmarket | **2/3** (height) | 2/3 | 2/3 | 0 |
| lockgate | **2/3** (height) | 2/3 | 2/3 | 10 |
| calamari | **2/3** (roof) | 2/3 | 3/3 | 4 |

**Every find in my half** (the Mac mini's file keeps only the first 400 characters of each line; the lead's notes have
its details):
1. **tidewater** — a swim jump + air dash (frame 30) from (−22.5, 0, −2.7), heading (−0.71, 0.71), first comes down
   **2.30 m** over its start (bar 2.27) on a surface with no stage block, then ends in the sea: harmless, 0.03 m over.
   (Mac mini: 2.30, also ending in the sea.)
2. **crossmarket** — a swim jump + air dash (frame 30) from (−5.5, 1.13, −32.5), heading (−0.71, 0.71), lands **2.42 m** up on
   a rail prop (1.5 × 1 × 0.4, no-ink, at 3.55 m) and rests at (−12.2, 3.55, −28.4); a plain hop on that heading gets
   0.87 m, the best of 16 headings 1.4 m. (Mac mini: 2.44 m onto the veranda stair, 2.59 m up.)
3. **lockgate** — a swim jump + air dash (frame 18) from (−1.5, 1.3, 46.5), heading (−0.71, −0.71), lands **2.71 m** up on a
   **thin prop collider (1.7 × 2.9 × 0.1, no-ink: a 0.1 m panel top) and stays there at 4.15 m**, beside a no-ink roof prop
   (3.6 × 0.5 × 8.4); a plain hop from there gets 0.01 m. (Mac mini: the same panel, 2.70 m, rested at 4.15.)
4. **calamari** — a dash off a wall climb (at its top, along the wall) from (−28.5, 2.6, −53), heading (0, −1), ends on
   block 47 **"hill-wall" at (−32, 5, −41.2), 2.4 m up, and is still on it after 3 s** — a roof the slide rule did not
   slide the kid off. (Mac mini: one roof case in its half too.)
5. Listed, not judged (SPEC D10.6: tops the nav graph doesn't reach that a dash ends on and no plain walk or hop from
   within 5 m does): mostly no-ink prop colliders 1.2–2.06 m tall reached by a swim jump + air dash — halyard's quay
   props and two beacons, kelpline's / cargo's trailer and a 2 × 1.3 × 5.8 prop (9 landings, ≤ 2.05 m), saltpan's heaps
   and pump staging (≤ 1.28 m), terraces' caffè stair (≤ 2.34 m), tidewater's 0.8 × 1.9 × 0.8 posts (≤ 1.92 m), calamari's
   two 4.7 × 2 × 2.1 props (2.0 m), treehills' two 1.4 × 1.9 × 0.6 props. Worth a look with the lockgate panel in mind:
   **nantai's two 0.2 × 3 × 0.2 posts, whose tops (3.8 m) hold a kid after a swim jump + dash.** Full lists:
   `p2/reach/reach-<stage>.log`.

Nothing here was fixed: the brief was to run the audit and report every find. The four stages are the same four on
both machines.

## 7. Regressions after the later fixes

Re-run here after the later fixes, one at a time (logs `p2/t3/` at 3ca12320, `p2/t4/` at 518d72fa): **deployables 34/34, bot-specials 19/19, tuning
12/12, sub-tweaks2 bow 3/3, sub-dash 43/43, int3 karpbox 10/10, int3 turf 4/4**, and — for the round-ordering fix in
weapons.js (§1), which touches every projectile that meets a device, a curtain, a canopy or a bobber — **sub-tweaks 29/29,
sub-scale 83/83, surf 42/42**, net-deploy 7/7 (two clients), **tower-rules 26/26, hud-lead 22/22 · 14/14 · 12/12**.
- **After item 2's last three rounds** (a76c5b81 … 1d9df811, logs `p2/t9/`): **sub-bobber 82/82** (only=bots 14/14),
  **only=zone 3/3** more, **int3 turf 4/4, bot-specials 19/19, deployables 34/34**.
- **sub-sentry 47/48 in both my runs**: the row "a roller bot it locks onto, out of reach, … is out of its range or sight
  within 3 s" — my predecessor's strengthened version of the reviewer's weak check (the roller now starts 6.5 m out,
  walking at the owner). In both runs the roller's threat code picked 'shoot' (its flick) at 5.3–5.4 m, the edge of its
  flick window, and stood there (the trace: thrAct 'shoot', move 0 for 5 s) instead of evading; it never reached the
  sentry and never left its reach. Nothing I changed touches the roller or the threat code (the sentry's own placement
  change is the owner's; the round-ordering fix doesn't touch a sentry's rounds at a roller). A borderline bot choice the
  check now exposes — reported, not loosened; it needs a look at the turret branch of bots.js _threatCtl for melee kits
  (a roller should evade a turret it can't reach, not stand at the edge of its flick).
- **int3.js's throwhold check was broken by my predecessor's own move** (7882d3ee moved the throw hold out of the bobber's
  botAct into a bots.js hook; the check still called botAct and failed 3/4 — it had last been run before the move). It
  now asks the hook (4030cf65): 4/4.

- **perf-bobbers phase 4**: **not run here** — the machine sat at load 14–20 all day and at 400+ in the afternoon (other
  builders), and the phase's "with" and "without" halves are two 30 s windows one after the other, so a load change
  between them swings it (the reviewer's two runs: +7.0 and +0.8 ms). The kit's own tick in my matches: 0.06–0.18 ms a
  frame (its budget 0.5). The Mac mini ran it three times at b97b3eb (JOB-1, MEASUREMENTS.txt): **5/5, 5/5, 4/5** — the one
  failure phase 4's p95 at 10.6 ms against 5.1 without (170 bobbers). Since b97b3eb the bobber bots (the snaps, the scan's
  checks, the throw holds) and weapons.js's round order changed, so `JOB-6.sh` repeats it three times at the final code.
- **sub-tweaks2's Tideline Bow trail row** ("the centre arrow's trail ≥ 95 % inked, every volley"): 3/3 here (1.00, 0.99,
  0.98). Nothing
  in this wave touches the bow, its trail or the paint grid; the row sits on its threshold — my predecessor's 24 volleys
  measured 0.95–1.00, the integrator's failures 0.90–0.94 — and moves with the arrows' random spread. "Worse on b5-int3"
  doesn't hold up: the untouched base failed 2 runs in 6, b5-int3 now 5 in 10 (the integrator's 5 of 6 plus my
  predecessor's 0 of 4) — not a difference 6 and 10 runs can show (Fisher's exact test p ≈ 0.6). Not loosened.
- **tuning's roller row** (39 % vs > 40 %): 77 % here (the bot rolled 77 % of 10 s, 77 % of that faster than walking); it
  passed twice for my predecessor too. A random-walk row near its bar once; not reproduced.

## 8. The Carp Field's 60 ms load budget

**Closed by measurement; no cache.** Caching the field per stage would not have helped the number in question anyway: the
field is built once at match start for every state the stage has (`KarpField` precomputes every state's arrays;
`setState` only swaps them), so the build the 60 ms budget is about is cold whatever is cached — a cache keyed by the
stage would only save a rematch or a Practice swap back onto the same stage. I left it measured for a quiet machine, and
the Mac mini has since measured it: `MEASUREMENTS.txt` §F (karp-field.js, every stage ×3 at b97b3eb, the runner idle;
this file appeared uncommitted in the worktree during my run, from fork/botlab-b5-int3 d7c3bad1): **every stage builds
under 60 ms at match start, 0 of 48 runs over** — median per state cargo 43.4 ms (DEVSTAGE=1), treehills 34.7, craters
32.1, calamari 31.5, tidewater 28.8, the rest 4–26; the warm rebuild's worst is craters 32.1. The 75–190 ms readings were
this loaded Mac. Nothing after b97b3eb touches the field. My JOB-2.sh (karp-field ×3 + perf-bobbers ×3) collided by name
with the lead's JOB-2.sh on that branch; it is now `JOB-6.sh`, cut to perf-bobbers ×3 at the final code (abf28812).

## Online

Nothing new crosses the wire. The bobber and sentry changes are bot decisions (the host's bots; a client's own bot never
runs online); the Glide's out-of-the-hand look and the roll pose are drawn on every screen from what each already has (a
ghost stone eases out of the remote kid's fist from the existing [0] release); the dash's lines and kick are the local
dasher's only; the Scrap Sentry's late-joiner restatements re-send existing [0] / [4] / [5] records. Two-client tests
re-run after the later fixes (at 3ca12320 and 518d72fa): **net-sub-bobber 11/11, net-sub-glide 11/11, net-sub-sentry 12/12, its latejoin scene 7/7,
net-deploy 7/7**.
Item 2's last rounds (a76c5b81 … 6914c81e) are host-side bot decisions only — which throw, shot or special press a bot
makes, and a step — with no record added or changed, so I did not re-run the two-client tests after them.

## Shared files touched (all tagged [b5-int3])

- `src/game/bots.js` (my predecessor's): one line after the kits' botAct (`holdThrow`), the release-frame re-check in
  `_tail`, the Glide plant in `_tail` (6 lines).
- `src/game/weapons.js` (mine, 518d72fa): in the round step, when a round reaches a player's hitbox, blockShot is asked first
  over the run up to that hit point (one added call, 4 lines; it already ran for misses) — every projectile meeting a device, curtain, canopy, shell or bobber.
- `src/game/character.js` (mine): `_poseRoll`'s timing (3 lines).
- `src/game/cameraRig.js` (my predecessor's): one line (the dash kick).
- `src/config.js` (mine): one knob, `SUBS.bobber.dangerHear` (off).
- Kit files: `kits/bobber-bots.js` (most of it), `bobber.js` (the snap item, the waste counter), `glide.js`, `sentry.js`,
  `dash.js`, `mitts.js`, `shaker.js`. Docs: `docs/NET.md` (sentry late joiner), `tools/botlab/README.md` (the counters).
- Tooling: `tools/botlab/match.cjs` (BOBBER-SCAN / -WASTE / -AIMED / -SNAPLOG, SENTRY-SRC). Tests: sub-bobber.js,
  bobber-web.js, sub-glide.js, sub-sentry.js, net-sub-sentry.cjs, sub-dash.js, dash-reach.js, sfx-cues.js.

## Commits (b55f7472..HEAD; mine from 1e8ac7d2 up, my predecessor's ed69203b and below)

- `1d9df811` sub-bobber.js: the Pop Pellet check's thrower faces its foe while it looks (in a full run the brain had turned off the side foe and never saw it: 8…
- `1b09e42c` (scratch) int3 polish: the lead's report, interim 3 (item 2's three rounds and their runs, the lead's five Chain Bobber numbers, the Mac mini's mea…
- `6914c81e` Chain Bobber bots: a Splat Bomb's throw is judged where it blows — its bounces and roll to the end of its fuse (bombRest, _updateBombs' own rules),…
- `60e1e6e3` Chain Bobber bots: hold-fire follows the shot past a ledge (aimed down, the capsule ends where the aim meets the stage, not 1.3 m under the eye), a…
- `a76c5b81` Chain Bobber bots: a teammate's Pop Pellet is held when its flight meets a foe the team knows (it pops there, not where it lands) by an own idle we…
- `abf28812` (scratch) int3 polish: JOB-2.sh renamed JOB-6.sh (the lead's JOB-2…5 on fork/botlab-b5-int3 took the numbers) and cut to perf-bobbers ×3 at the fin…
- `98843686` (scratch) int3 polish: the Glide Bomb's roll pictures at the final code (side-on, a Splattershot in the other hand: the release frame — the stone a…
- `24a5160c` (scratch) int3 polish: the lead's report, interim 2 (the Chain Bobber's final numbers; the remaining tests, the pictures and the dash-reach audit s…
- `518d72fa` weapons.js: a round's run this frame is tested against blockShot up to the player it would hit first — a device or a kit's shot-catcher nearer alon…
- `4030cf65` int3.js throwhold: asks the press's check where it now lives (SUB_KITS.bobber.holdThrow, run by bots.js after every kit's botAct since 7882d3ee) —…
- `3ca12320` Chain Bobber bots: a Crab Rig's cannon (its sub press) is held while its shell would land with its 3 m blast by an own idle web — bobber-web clear…
- `636d7032` Chain Bobber bots: a burst left short of three grows any of the bot's own short chains, the biggest first, and a growth link may sit by its own oth…
- `8d3a87c3` sub-bobber.js: the snap check takes three trials at the foe facing away — each must throw onto its feet, one of the three set off on the foe (the s…
- `206cbead` Chain Bobber bots: a snap's shots stream (no tap): the foe steps out of a floated web within ~0.5 s of noticing it, every shot counts; sub-bobber.j…
- `a1d4810c` Chain Bobber bots: a Zone Control guard starts a chain only on the tank its own refill gate waits for (inkCost + 42 = 82; was 72) — one that starte…
- `36a34713` (scratch) int3 polish: JOB-2.sh for the Mac mini — the measurements that need a quiet machine (the Carp Field's build at match start on every stage…
- `113fd96f` Chain Bobber bots: a planned lob counts as a miss when the bobber would float more than 0.5 m off its planned height — one striking a wall's face f…
- `ca83cb8c` Chain Bobber bots: a chain's links are picked within 4.7 m of each other in 3-D (LINK3) — within 4.6 m across and 2.2 m in height two float spots c…
- `8fcd4dcd` sub-bobber.js: the snap check hands the foe back to the bot's own brain after the decision (a target set by hand, without the brain's view of it, t…
- `70594ef5` Revert "Chain Bobber bots: snaps at any foe again …" — the duel probe: thrown at a foe duelling the bot (no pre-aim) 25 snaps caught nothing and th…
- `7a9935e7` Chain Bobber bots: snaps at any foe again, but aimed at on the way in only while that foe faces away (busy elsewhere) and nothing hits the bot — at…
- `decfa6ce` sub-bobber.js: the snap — a fighting bot throws a lone bobber onto the feet of a foe facing away from it and sets it off on that foe as it floats;…
- `f16ce22d` sub-sentry.js: a fighting bot sets one down mid-duel (just hit, 80 hp), never on its last legs (30 hp) — fails on the old 'not hit for 1 s' rule
- `6f81b53b` Glide Bomb: the underhand roll reads as one — the stone's look starts at the fist that held it (the held prop's foot and size) and eases onto its t…
- `dd4e7bd5` (scratch) int3 polish: the lead's report, interim (the final verification and the dash-reach audit still running; PENDING marks what they fill in)
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

- **Chain Bobber bots fall short of "wasted well under 88 %, a bobber splat a match"** (§1): the lead decides; two
  measured levers offered (snaps at any foe, pre-aimed — 0.92 splats a match, but the bot loses its duels; `dangerHear` —
  no measurable effect). The lead's five numbers did not move either.
- **Item 2's bar is not met**: bot teammates still set off about two idle chains a bobber-web clear run of sixteen webs
  (four before this round), from paths the hold does not model yet — the Tideline Bow's lodged arrows, a Torpedo's
  lock-and-swim, a Cutlass quick cut's splash just past 2 m, the odd shot (§2). The next fix of each is the same kind.
- **The dash-reach audit is run, not acted on**: 1/60 in full (my half here, the other on the Mac mini) and 1/24 (Mac
  mini) — tidewater, crossmarket, lockgate and calamari each fail one row on both machines (§6: a 2.30 m landing that
  ends in the sea; a 2.42 m rail landing; a kid held 4.15 m up on lockgate's 0.1 m panel top; a calamari "hill-wall" top
  that holds a kid). The stage or slide-rule fixes are the lead's call (the uncommitted OPEN-ITEMS.md addition sets a
  rule for them).
- **The orders in the uncommitted OPEN-ITEMS.md addition** (see the note at the top) that I did not take up: Glide bots
  to the Splat Bomb's hits per use with fight throws a majority (2 Turf + 2 Zone matches; today they are about one fight
  throw in four or seven, §4); the reach finds' fixes — an off-limits top (roof / rail / grate / perch, thin prop tops
  like lockgate's) must never hold a kid, fixed in the stage or the slide rule, calamari's roof case explained; walkable
  ground reached by a swim jump + dash listed with its saving and fixed where it saves more than 20 m — then the four
  stages re-run at 1/60 and 1/24 (§6); the Chain Bobber's five numbers reported the same way (done, §1).
- `JOB-6.sh` (perf-bobbers ×3 at the final code) is committed, not pushed.
- Flaky rows seen, not loosened: sub-glide's Cutlass round (60/61 once here, once on the Mac mini), sub-sentry's roller
  evade row (47/48 in both my runs: the roller's threat code picks its flick at the window's edge and stands).
- Random loadouts swing a 2–4 match set a lot (melee kits and the bucket can't snap or shoot a bobber from range): every
  bot-match number in this report is a small sample; the lead's consolidated balance pass should re-measure.
