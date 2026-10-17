# Bazookarp WP3 (karp-bots) — lead report, fix round 1

Worktree `/Users/danielosling/Desktop/1/st-b5-karp-bots`, branch `b5-karp-bots`. Nothing pushed. Everything ran on this Mac,
one Electron instance at a time under the shared `SLOTS=3` lock (`BOTLAB_OUT=…/inkwave-upstream/.botlab`), load average
20–70 all evening; nothing on the Mac mini (this round's instructions: unavailable, push nothing — the uncommitted
"Mac mini is back" edit to `COMMON.md` in the worktree is not mine and is left as found). `JOB-1.sh` is ready for it.

This round answers review 1 (verdict REDO, `LEAD-REVIEW.json`, at dd4be8cc / code 3620384a). §0 takes the issues one by
one with their proof; §1–§7 are the full report, the previous round's corrected where the review showed it wrong.

## 0. The review's issues, one by one

### 0.1 MAJOR — defenders read a hidden carrier's live position. Fixed (017beb3d). The reviewer was right.
`defendObj` (`at = k ? k.pos : this.restPos()`), `perchSpot` (`P.ahead(H.team, 10)`: the enemy's own route at its live
index), `_deal`'s interceptor choice (`cp = … this.restPos()`) and `karpEngage`'s default (`hd(t.pos, P.restPos()) < 12`) all
read `Kp.pos`, which bazookarp.js copies from the holder every frame. The previous report's "every karp decision reads
`k.guess` only" was false for the plan (it held for the interceptor goal alone).
- **`carSeen[t]`**: per team, what it knows of the enemy carrier — seeded at the pick-up with the spot the Bazookarp lay on
  (public: it lay there marked, in plain view), moved only by a look one of its bots had (`teamKnown`'s `k.guess`).
  **`karpAt(t)`**: the resting / free spot, or with the other team carrying, `carSeen[t]` — never `Kp.pos`.
- **`expRoute(t)` / `expAhead(t, m)`**: "the route the plan expects it to take" (SPEC §8.5), from the last known spot to the
  nearest enemy target on the enemy's static masks, cached per sighting; never `route[enemy]`.
- `defendObj`: the known spot, else the last known, else the weir it held. `_deal`: interceptors by the known / last known
  spot. **`karpPerchLook`** (exported): the shell; the known carrier; else 10 m along the expected route. `karpEngage`: by
  `karpAt`. Interceptors start from the team's last known spot, not only their own. (`tick()` still routes a *human*
  carrier: read by its own team's escorts only.)

| karp-bots W (new) | old code (3620384a, a scratch copy) | fixed |
|---|---|---|
| W(a) the plan, Alpha asleep: a carrier picked up in the alley (−10, −12), then hidden in the lane (17, −10), never seen — the defended weir, the perch's look, the interceptor (easy: one), a perch's fight 8 m from it | **FAIL**: w11 → w10, interceptor P1 → Fizz, fight false → true | PASS: w11, (−5.5, −3.5), P1, false at both spots |
| W(b) Alpha awake: picked up in the alley (b1) / seen there in kid form (b2), then hidden in the lane 8 s, unseen (480 unknown frames each) | **FAIL**: the weir flips mid-way (w11 218 frames, w10 262), the keeper ends on w10's spot | PASS: w11 all 480 frames, the keeper on w11's spot |

W(b2) is the review's "I(b) with a hidden carrier": seen at one weir, hidden by the other, the keeper stays where it was seen.

### 0.2 MAJOR — B failed most runs; melee bots died to bursts. Fixed (02616427, c1a4def2). The reviewer was right.
A probe that logs each bot outside its band (the test's own B, 6 runs on 3620384a: **1 of 6 passed**) put every failure in
**refill mode** at 75 % of ours: a brush or Mitts breaker low on ink went to the stock refill search's nearest own ink
(4.5–6.5 m out) or, finding none, to its spawn pad (one was 13 m out when sampled). `karpGoal` isn't consulted in refill mode.
The review's other cases — a melee bot fighting a foe that stands by the shell, burst victims fighting / refilling 3.2–3.7 m
out — are the same gap in other modes, and the matches showed a third: the meter jumps (one charger shot is 160 of a
500 hp shell), so the 70 % danger had stood for 0–0.45 s when the burst came.
- **The refill band** (`karpRefillSpot`, hooked first in `_pickRefill`): a breaker by the shell refills inside its band —
  closing in, its close spot … 4.5 m; on the ring, 5.8–9 m; the grabber at ≥ 85 % of ours, 2.95–3.4 m — on our ink there, else
  on its own stand spot (the stock refill paints a puddle there and swims in it). `karpMove` holds a refilling breaker inside
  that band (a squid slides on its puddle; the step onto own ink can be a step inward).
- **The keep-out**: once the other side is ≥ 50 %, no bot of ours steps in past 5.1 m (the burst's 4.5 + 0.6), judged 0.25 s
  ahead at its speed — fighting a foe by the shell (theirs is safe from its own burst), refilling, walking past; a Cutlass lunge
  or a Mitts landing that would end inside 4.9 m is refused (`karpShellIn`). Melee-only first; matches then showed ranged
  fighters dying the same way (twins, bow, bucket, a charger perch), so it covers every bot.
- **The swell seen coming** (`KARP_AI.swellAhead` = 1 s): the shell swells with the meter for all to see. The shell danger
  also stands once the other side's rate over the last half second would burst it within 1 s, and a melee breaker closing in
  moves out to the ring once that rate would carry the other side past 50 % within the second.
- Re-forming / resetting: everyone to the ring — SPEC §8.1's last row was missing (melee breakers stood 2.6–2.9 m from the
  Pond while it flew back and re-formed).

Proof:
- **B ×10 on c1a4def2's breaker code (nothing since touches B): 10 / 10** (minOut 6.33–6.53, maxOut ≤ 7.05; minIn 3.31–4.01, maxIn 4.12–4.24). On 3620384a:
  the reviewer's 2 / 5, my probe's 1 / 6. The B check's bounds are unchanged.
- New checks, each with a teeth run (the feature off; the check must then fail): **B(b2)** refills stay in the band, drained
  every second at 75 % of ours — maxR 3.8, minR 3.05 m (teeth: 17.6–20.3 m out); **B(d)** at 60 % of theirs a melee breaker
  fights a foe standing 3.4 m from the centre from ≥ 4.6 m — 4.74–4.86 m (teeth: 2.76–2.97 m); **A(c)** with Bravo at 72 % ranged
  bots on the far side walk round to their own ring outside 5.3 m — 5.51–5.55 (teeth, the danger and the keep-out off: 3.1 m);
  **A(d)** the swell-rate danger stands at 50 % while the meter climbs 60 %/s, not when it is still (teeth: none); **R(d)**
  re-forming: spots 6.5–7.1 m, nobody inside 6.3 m (teeth: spots 2.55 m, a bot 1.76 m from the centre).
- Matches (karp-match now logs every burst victim: weapon, role, mode, distance, whether it had noticed the danger, how long the
  danger had stood). **Burst splats per 100 pops: 3.8–9.1 on 3620384a's sets** (the reviewer's 9.0); this round 9.1 with the
  melee-only keep-out (mX: 12 victims, 7 ranged fighters), 5.1 with the keep-out for every bot and the swell danger (mX2: 5,
  all melee grabbers closing in), **0.8 and 1.8 with the melee swell rule (mX3: 1 victim in 129 pops; mX4: 2 in 110)**.

B(d)'s bound is 4.6 m, not my first 4.8: the burst splats a player whose chest (1.0 m up) is within 4.5 m of the shell's centre
(1.3 m up), i.e. 4.49 m out on the same floor (bazookarp.js `_burst`); one run read 4.74 m. That is my own new check's margin,
not a bound the review set.

### 0.3 minor — the match numbers. Agreed: reported with the spread; two of the three levers tried.
The previous report presented one 16-match set's knockout rate as a PASS. Every set I have (all-bot, `karp-agg.py`; the builder's two 16-match sets
mix normal and hard 10 / 6, the reviewer's has one hard, mine are all normal):

| set | code | n | KOs (early < 1:15) | first pop median | carries: splat ≤ 2.5 s / no new ground | halyard: fallback / ×3 retreat s a match | burst splats / 100 pops |
|---|---|---|---|---|---|---|---|
| builder "final" | 3168aebf+ | 16 | 7 (3) | 11.4 s | 47 % / 66 % | 3.2 / 9.0 (n 5) | 7.1 |
| builder "final2" (the old report's) | 3620384a | 16 | 8 (0) | 12.5 s | 49 % / 56 % | 3.6 / 8.5 (n 5) | 3.8 |
| builder "head check" | 3620384a | 4 | 2 (2) | 9.9 s | 49 % / 55 % | 3.0 / 6.7 (n 2) | 3.2 |
| reviewer | 3620384a | 6 | 0 (0) | 12.1 s | 44 % / 71 % | 6.0 / 12.7 (n 3) | 9.0 |
| mX | 02616427 + fallback steps | 6 | 3 (0) | 10.6 s | 46 % / 58 % | 3.0 / 6.5 | 9.1 |
| mZ — `clearAt` 0.85 | same | 6 | 3 (1) | 13.6 s | 55 % / 62 % | 3.0 / 10.1 | 6.5 |
| mY — fallback steps off | same | 3 (halyard) | 2 (1) | 10.3 s | 51 % / 57 % | 4.0 / 5.4 | 2.0 |
| mX2 | + keep-out for all, swell danger | 6 | 4 (1) | 10.9 s | 52 % / 58 % | 3.3 / 7.7 | 5.1 |
| mX3 | + melee swell rule (c1a4def2 less the keeper fix) | 6 | 3 (1) | 10.1 s | 51 % / 66 % | 5.0 / 11.8 | 0.8 |
| mX4 | c1a4def2 (the final code less the Bubble Guard run and the hard grab's 0.1 s) | 6 | 3 (1) | 12.7 s | 45 % / 60 % | 3.3 / 6.8 | 1.8 |

Each set is 2–3 matches a stage; none is a balance answer (§9.1's targets are for ≥ 16 a stage). Pooled: on 3620384a 10
knockouts in 26 matches (38 %), 5 of them before 1:15; on this round's last two sets 6 in 12 (50 %), 2 before 1:15 (38 s on
karpbox, 60 s); first pop medians 9.9–13.6 s; half the carries die within 2.5 s of the pick-up and 55–71 % make no new ground
in every set; no carrier stuck > 3 s, no clamp rejection, no own-zone second, 0 console lines in any.

The levers the old report named:
- **"Clear the ring before our burst"** (`KARP_AI.clearAt`: from 85 % of ours the breakers fight every foe in range): worse —
  carries splatted within 2.5 s 55 % vs 46 %, first pop 13.6 vs 10.6 s, a knockout at 30.6 s (mZ vs mX, same code). Left in,
  **off**, for the balance pass.
- **The fallback "the shortest way back to forward ground"**: a carrier with no forward path now loosens its route rules least
  first — the retreat mark's slack 6 → 7.5 m (a dip the engine forgives: its ×3 starts at 8 m), then 11 m, then none, then
  through its own zone — instead of dropping the retreat mask at once. A 7.5 m pass is no ×3 and is counted apart (`fbSoft`,
  1–9 a halyard match). Fallbacks a halyard match: 3.0–5.0 with it (5 sets, 15 matches), 4.0 without (3); the ×3 retreat seconds did
  **not** drop (5.4 without, 6.5–11.8 with: noise at n 3). Kept (it can never add a ×3); **not a fix**. Every halyard fallback is
  on the ferry's side corridors behind the cabin — `fbAt` (x, y, z) in every set: (−5…3.9, 1.3, ±3.1…5.1), plus (7.8, 1.3,
  3.1), (8.1, 1.3, −3.8), (11.4, 2.5, 1.9), (−6.6, 1.3, −3.5), (−7, 1.3, 3.7) once each: **WP4b's** (§9.1 #11: a `noRetreat`
  there, or a forward way off the corridor). karpbox and lockgate: 0 in every set.
- **A pre-keeper**: not tried. Early knockouts are 0–2 in 6 a set; judging them needs ≥ 16-match sets. It is the next lever.

### 0.4 minor — roles and difficulty rows without checks; A passed without the danger. Fixed (02616427, c1a4def2).
Every new check has a **teeth** run: `PAGE_ARGS='teeth=1'` runs it again with its feature off (through `KARP_AI` or the
difficulty rows) and requires the failure. Results from the full runs (§5.1):

| check | what | result | teeth (feature off) |
|---|---|---|---|
| R(a) escorts | lead 8–14 m ahead on the route inking it; flank 3–8 m beside it on the known threat's side; anchor ≤ 15 m | lead 11.2 m ahead, route ink 0.78–0.92; flank 4.4 m on the threat's side; anchor 8.3 m | lead 0.1 m, flank 0.4 m, anchor 19.3 m |
| R(b) the perch | a charger 10–22 m from the shell with a line (shell phase); 10–22 m from the known enemy carrier with a line | 11.6–15.6 m / 12.8–17.7 m | it grabs / intercepts |
| R(c) the free phase | the grabber makes for it; the rest fight 3–8 m out on their side | grabber 0.05–0.2 m; fighters 4.7–5.3 m | fighters 9–11 m |
| R(d) re-forming | §0.2 | | |
| S(a) breakers' bombs | a barrage held at 30 % of ours, thrown at 45 % | held / thrown | not thrown |
| S(b) escorts' specials | held while nobody threatens the carrier; free once a known foe is within 15 m of it | false / null (the usual rules) | false under threat |
| S(c) interceptors' | a Vortex Strike held while the carrier is unknown, fired once it is known | held / fired | (two-sided) |
| S(d) the Bubble Guard's share | an escort's bubble held while calm; under threat it runs to the carrier and pops it, the carrier inside | 65–122 frames inside | not popped, 0 |
| Y(a) interceptors | easy 1 (the rest keep), normal ≥ 2, hard ≥ 2 from both sides | 1 / 3 / 3 at ±1 | easy 2 |
| Y(b) grab delay | easy 0.3–0.6 s after the hold, hard ≤ 0.1 s (normal: D) | easy 0.37 s, hard 0.03 s (§7: two late reads before the aims moved) | easy 0.03 s |
| Y(c) easy's no-lob | easy never charges at a located foe it can't see; normal lobs | 0 / 132–141 frames | easy 123–128 |
| Y(d) hard's lead | hard leads a foe crossing at 4 m/s; normal aims at it (hard > 0.15 rad, normal < 0.1, apart > 0.15) | 0.25–0.34 rad / 0.00–0.06 | 0.03 |
| Y(e) re-pick | easy 3 s, normal 1.5 s, hard 1 s | 3.02 / 1.52 / 1.02 s | normal 3.02 |
| A(c), A(d), B(b2), B(d) | §0.2 | | |

Bugs these checks found, fixed: in the free phase **every fighter became a grabber** (walking round to its spot it passed
within 6 m of the Bazookarp and was re-dealt "grab"); a perch kept its shell-phase spot for 6 s after the other team picked
up (it re-picks now when the situation changes or what it watches moves > 6 m); a lead escort with a Bubble Guard was often too
far ahead for the 5 m the share needs (S(d) failed once) (it now runs to a threatened carrier first); a keeper fighting a foe near its spot held
wherever it stood, 14 m off its weir (I(b) failed once: never more than 6 m off its spot now); a test-isolation leak (S's
charged barrage fired during Y(b)'s wait). The review's "A passes even without the danger area" was right: A(c) walks bots
round the shell and fails without the ring rules.

### 0.5 minor — Big Bursts from the carrier's usual range. Left as numbers: the lead's balance decision, with data.
The Carp Shot is the mode's offence and carries already die young (§0.3), so I changed nothing. H is now named for what it
is: it passes **from 18 m** (17–18 / 20 in the four full runs), the range it happens to pass at — §11's "≥ 16 of 20" is **not met at
the carrier's usual 12–15 m**. Its report rows over four full runs: **12 m: 1–3 of 10; 15 m: 3–7 of 10.** What it would
take at 15 m (`hwhat=1`, 10 trials each, four runs): **swell 0.45 → 0.6 s: 5–6 of 10; → 0.75 s: 7–9 of 10; the Big Burst's
radius 4.0 → 3.5 m: 4, 6, 10, 10 of 10** (10 trials are noisy). TELL THE USER: a Big Burst from under ~15 m is close to unavoidable for a kid on dry
ground; a ~0.3 s longer swell or a 0.5 m smaller blast would change that.

### 0.6 minor — JOB-1.sh. Fixed (a9d9fd5b).
The default fits COMMON's cap: `TOTAL=8` matches a difficulty **summed over its stages** (karpbox 2, halyard 3, lockgate 3 at
normal; halyard 4, lockgate 4 at hard). `N` (a stage) is marked LEAD ONLY, for the consolidated pass. `SUBS` is passed to each
karp-match explicitly. A stage builder copies it into **its own key's folder**. A dry run with stub tools: 2 / 3 / 3 and 4 / 4
matches, `SUBS=all=dash` reaching each, `N=2` overriding.

### 0.7 minor — two sight / danger gaps. Fixed (017beb3d).
- The wake reaches `min(20 m, the bot's awareness)`: J(a)'s new 18 m case — normal notices, **easy (16 m) does not**; on
  3620384a easy did (FAIL there).
- A remote (guest) carrier's last 3 s of fuse are a danger to the host's bots on its team, from the host's own fuse and the
  rate the guest's `kr` sent. L(b): FAIL on 3620384a, PASS now. NET.md says so.

## 1. What was built, rule by rule (SPEC §8, §11 WP3)

Everything is in `src/game/botsKarp.js` (~1 400 lines), wired by short tagged hooks (`[b5-karp-bots]`) in `bots.js`,
`botSpecials.js`, `botSight.js`, `subs.js`, `kits/waddle.js`, `kits/blade.js`, `kits/mitts.js`. `KARP_AI.enabled = false`
(karp-match `KARP_AI=0`) plays WP1's minimal set, for an A/B. Its numbers and switches are in `KARP_AI`.

### 1.1 The team plan (`karpPlan()`, §8.1)
One plan per match engine, re-dealt twice a second and at once on every karp event (`burst / pickup / drop / reset / plant /
phase / field`). Per team, by situation:

| situation | roles |
|---|---|
| `shell` (shielded / re-forming / resetting) | the **perch** (a charger, while there's another bot to grab); the **grabber** (nearest the shell, no special running — its own Bubble Guard is fine — hp ≥ 60); the rest **break**. Re-forming / resetting: everyone on the ring round the resting point / the Pond |
| `free` | the grabber (nearest, not mid-special; none if a human teammate is within 3 m and closer, §8.3) and anyone within 6 m as it comes free **grab**; the rest **fight** 5.5 m out toward their side, and stay fighters |
| `ours` | **carry**, **lead** (11 m ahead on the carrier's route, inking it), **flank** (5 m beside it, on the known threat's side), **anchor** (9 m behind); a 5th+ bot flanks |
| `theirs` | **keeper** ×1 (×2 when the carrier is known within 25 m by the field of our open Gate, or its count within 10 of its weir's), **perch** (a charger, unless 2 keepers), **intercept** ×2 (×1 easy; hard from two sides, ±0.9 rad); leftovers intercept (easy: keep) |

Humans fill the role whose spot is nearest them. Hysteresis: a bot keeps its role unless another is clearly nearer (3 m; 6 m
for escorts and defenders). **What a team knows** (§3): foes through `teamKnown` at the last look's spot; the enemy carrier
through `carSeen` (its pick-up, then the team's looks); its route through `expRoute`.

### 1.2 Breakers and the burst (§8.2)
- **Ranged breakers** stand on the 5.5–9 m ring (a 7 m spot, spread by slot on our side, with a kid's-eye line to the shell's
  centre) and strafe there while they shoot (`karpAim`).
- **Melee breakers** (roller, brush, blade, mitts) close in to `max(2.5, r' + 0.88) + 0.3` m (r' the radius a little ahead of
  the meter) while the other side is under 50 % — and its rate wouldn't carry it past 50 % within a second — and stand on the
  ring otherwise. They never swing from closer than 0.6 m outside touch range.
- **The danger** (≥ 70 % of theirs normal, ≥ 60 % hard, none easy; also once the rate would burst it within 1 s): a botSpecials
  area of 5.5 m. **The keep-out** (≥ 50 % of theirs): nobody of ours in past 5.1 m. **Refills** inside the breaker's band.
- **The grabber**: at ≥ 85 % of ours it closes to 3.12 m (a charger, bow or splatling holds its fire there); after the burst it
  times its run to arrive early inside its difficulty's window (easy 0.43 s after the 0.25 s hold, normal 0.1 s, hard 0.1 s
  early),
  swimming in through its team's burst ink.
- **Never a touch**: routes clear of the full swell (rMax + 0.6 = 2.9 m) unless a melee breaker or already close; a footwork
  guard judged 0.3 s ahead; no Cutlass lunge or Mitts landing into the sting (`karpShellIn`, bot-only, Bazookarp-only).
- **The shell first**: in the shell phase a breaker fights only a foe within min(0.75 × range, 10 m) or inside the ring; the
  grabber only one within 6 m. More than 18 m out they don't paint on the way in and swim our ink.
- **Specials**: a bomb-type special (barrages, Cheer Orb, Vortex Strike) kept for the shell, thrown at ≥ 40 % of ours.

### 1.3 The carrier (§8.4)
- **Routes**: up to 3 candidates per target (its standing weirs, each its own target, then its Gate) on `G.nav`, no climbs,
  its avoid mask: the layout's `routes` hints (the only candidates when the stage has any), else the shortest path and
  k-disjoint alternatives. Re-picked every 3 / 1.5 / 1 s by difficulty (hard also when the known threat changes) by cost
  (what's left + 6 m per known foe within 10 m of the next 25 m + 0.3 × enemy-ink metres on the next 20 m + the dangers), with
  8 m of hysteresis. It walks the pick (a node 12 m on).
- **`_pathTo`** is carrier-aware at every call site (both spawns, its own free zones, carrierBlock, the shell, nodes the field
  state removes, its retreat mark − 6 m on its own half; a Float32 cost: dangers, off-corridor, near known foes, its zone's
  edge), built per field state. **No path**: the rules loosened least first (§0.3), each step counted.
- Never `refill` / `retreat` mode; kid to charge; a squid through our ink when no foe is known within 12 m; dives first after
  a pick-up; never steers across its own zone.
- **Shots** (`karpCarrierAct`, the only writer of `it.fire` while carrying): no shots by its target · the knockback push
  (normal / hard) · hard: a Splash out of a focus · a foe within 6 m: a Splash at its feet, then a step back · a known foe
  6–22 m: a charged shot by the arc solver (the low arc; easy only with a line, always full; hard leads) · an enemy Waddle /
  Torpedo within 8 m: a Splash · enemy ink ahead and nobody within 15 m: a full charge 15 m ahead. Never a shot whose kick
  would carry it off a ledge or into water.
- **Fuse**: on its own half, short of time at 85 % of its pace, it heads 2 m past the halfway line first.

### 1.4 Escorts, defenders, interceptors (§8.1, §8.5)
- **Lead** 11 m ahead inking the route; **flank** 5 m to the known threat's side; **anchor** 9 m behind. Escorts fight within
  20 m of the carrier and never chase past it; specials only while the carrier is threatened (a known foe within 15 m); a
  Bubble Guard holder runs to the threatened carrier and pops it within 5 m (sprules' pass-on).
- **Keeper**: a hold spot 4–9 m in front of the defended weir (two weirs: the one nearer where the carrier is known, else last
  known) or our risen Gate, on the attackers' side, with a line to the objective and the approach, in cover; it fights from
  there and is never more than 6 m off it; it inks the approach.
- **Interceptors**: at the carrier while the team knows where it is (from 7.5 m; melee straight in; hard from two sides);
  hidden, to the team's last known spot, then along the expected route 8 m at a time.
- **Perch**: a charger on high ground 10–22 m from what it watches (§0.1), re-picked every 6 s or when that moves.
- **Super jumps**: a respawned bot jumps to our carrier ≥ 35 m away (else the anchor); defenders stay home while they carry.

### 1.5 Dangers and sight (§8.6)
`botSpecials.specialDangers()` calls `karpDangers()`: an enemy Carp Shot in flight (a disc at its predicted landing, drawn
0.8 m back toward the shooter, plus its way in below head height as an obstacle line) and landed; our carrier's last 3 s of
fuse (teammates only; a guest carrier's too); the shell about to burst (§1.2). `botSight`: a submerged enemy carrier's wake,
noticed with a clear line out to min(20 m, the bot's awareness), never through a wall.

### 1.6 Walkers round the shell
Waddle Bombs route round the shell's nodes (`karpShellAvoid()`); Skitter Bombs steer for the nearer tangent (`subs.js
shellRound`). This affects humans' thrown subs too, in Bazookarp only (WP1's hand-over).

### 1.7 Difficulty (§8.8, `KARP_AI.diff`)

| | easy | normal | hard |
|---|---|---|---|
| carrier shots | always full, only with a line, no lead | full / by range, lobs at a remembered spot | + leads a moving target |
| knockback push | never | enemy ink with a foe ≤ 10 m; fuse < 6 s and target ≤ 12 m | + a Splash out of a focus |
| route re-pick | 3 s | 1.5 s | 1 s + on a new threat |
| breakers' danger | none | ≥ 70 % (or about to burst within 1 s) | ≥ 60 % (or within 1 s) |
| interceptors | 1 | 2 | 2, from two sides |
| grab after the hold | aimed 0.43 s (window 0.6) | aimed 0.1 s (window 0.2) | 0.1 s early (0 s) |

## 2. Decisions where the SPEC left a gap (for the lead)
1. A Carp Shot is not a "fast" projectile for botSpecials' miss chance (a lob, read like a thrown bomb).
2. Our carrier's fuse danger is `vis 'big'`, heard within 10 m (bots keep sight memory of foes only), `d.not` the carrier.
3. The shell danger's threshold is the threatened team's difficulty.
4. Normal bots also push when the fuse is short.
5. A layout's `routes` hints are the only candidates when the stage has any.
6. The retreat mask's "own half" comes from the field; a level-2 fallback goes through the carrier's own zone when that is the
   only way on. **(new)** The fallback loosens the retreat slack in steps (7.5 m, 11 m, none) before that.
7. **(corrected)** What a team knows of the enemy carrier: its pick-up spot (public), then its own bots' looks — never its live
   position, never its own route. The expected route is the team's guess from the last known spot.
8. The shell first in the shell phase.
9. The grabber swims in, aiming inside its difficulty's window; **(new)** early in it (easy 0.43 s, hard 0.1 s early): a run
   now and then lands ~0.15 s after its estimate.
10. A fresh carrier dives first.
11. Keepers: 2 when the carrier is close; an easy team's leftovers keep. **(new)** A keeper is never more than 6 m off its spot.
12. karp-match's stuck metric leaves out bots holding a spot on purpose.
13. Bots with no business near the shell keep clear of its full swell.
14. The kits' lunge / leap guard lives in the kits (one tagged line each, bots only).
15. **(revised)** H passes from 18 m only; 12–15 m is a balance decision for the lead (§0.5).
16. **(corrected)** J(b) looks once after its teleport (a real carrier moves ≤ 1 m between looks). It covers the interceptor
    goal only; the plan's knowledge is W's.
17. The opening Roe Shell is 600 hp (§4).
18. **(new)** The 50 % keep-out for every bot of ours, the refill band, the swell seen coming (`swellAhead` 1 s) — not SPEC text;
    the SPEC's 70 % danger alone left 2 burst splats a match.
19. **(new)** A free-phase fighter stays a fighter; a Bubble Guard escort runs to a threatened carrier to share it.
20. **(new)** `clearAt` (clear the ring before our burst) is in the code, off: worse in 6 matches.

## 3. Online, and what the bots read
- **No new records.** Bots run on the host (and offline) only; the plan reads the host's engine and `G.karpGun.shots`
  (ghosts included), so a guest's Carp Shot is a danger to the host's bots like any other. A guest carrier's fuse danger comes
  from the host's own fuse and the guest's `kr` rate (NET.md).
- **No wall-hacks.** Foes through `botSight` (seen, located — the kid-form marker is a reveal — or remembered; `teamKnown` at
  the last look's spot). The enemy carrier: its public pick-up spot, then looks; the expected route from there (W, J(b)). The
  previous report's claim was wrong for the plan until this round (§0.1).
- The kits' bot-only lunge / leap guard is false for any human, remote actor, or outside Bazookarp.
- Known gap, not Bazookarp's: `bots.js`'s view of a foe (`tv`) gives its live position while its memory still says "seen",
  until the next look (≤ 0.25 s).

## 4. Numbers tuned, and why
Only `BAZOOKARP.shell.hp` (the opening Roe Shell 1000 → 600, the previous round: the first bots reach the Pond 8–11.5 s in;
first-pop medians 9.9–13.6 s in this round's sets, 10.1 and 12.7 on the last two) and the bots. `reformHp`, regrowth, the burst
radius, the Carp Shot's sizes and kick unchanged (§0.5 has what a swell / radius change would buy). `KARP_AI`: the ring
5.5–9 m, the grab at ≥ 85 % from 3.12 m, the danger 5.5 m at 70 / 60 %, the keep-out 5.1 m from 50 %, `swellAhead` 1 s,
escorts 11 / 5 / 9 m within 20 m, fighters 5.5 m, specials at 40 % / 15 m, jumps from 35 m, the wake 20 m.

## 5. Tests and their results (all local)

### 5.1 `karp-bots.js` (`MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js … page.cjs`)
43 checks and 16 teeth runs (`teeth=1`), 59 in all, plus H's what-ifs (`hwhat=1`). Full runs this round: **58 / 59**
(c1a4def2 less the keeper fix: I(b) — the keeper bug, fixed; then I + W 4 / 4 and I 2 / 2), **57 / 59** (the final code less
the Bubble Guard run and the hard grab's start: S(d) — the bug, fixed; Y(b) hard 0.17 s — §7). Then D, S and Y three times on the
final code (8350f1f6): **10 / 10 each**; the last full run on it: **59 / 59**. Earlier group runs and their fixes are in §0.

| check | final runs |
|---|---|
| A breakers out of the burst at ≥ 70 % (normal) / 60 % (hard), easy none; A(c) walk round; A(d) the swell seen coming | min 5.59–6.32 / 5.63–5.82 m; 5.51–5.55 m; stands rising, not still |
| B melee breakers (the ring at 55 % of theirs; ≥ 2.9 m and ≤ 5 m at 75 % of ours); B(b2) refills; B(d) the keep-out | out 6.26–6.53, in 3.31–4.24 m (and ×10: 10 / 10); 3.05–3.8 m; 4.74–4.86 m |
| C no touch damage in 20 bursts, all eight bots | 0 |
| D the grabber at 3.0–3.2 m, grabbing within 0.2 s after the hold (5 weapons, normal) | 3.17–3.19 m, 0.03–0.05 s |
| E an autopilot carrier, 3 carries: no ×3, no own zone, no stuck > 3 s | 3 / 3, all 0 |
| F carriers with the mitts, blade, brolly, bow, roller, charger, twins: zero own shots, subs, `sub:cantuse`, specials, climbs, leaps, rolls | 21 / 21, all 0 |
| G every forward route closed: a short ×3; G(b) a pocket of its own zone | fallback 1, zone ×3 0.63 s, moved 28.6 m; level 1 at slack 11 m, ×3 1.6 s |
| H out of a Big Burst's disc (normal, from 18 m) | 17–18 / 20; 12 m 1–3 / 10, 15 m 3–7 / 10 reported |
| I(a) the keeper at the open Gate; I(b) two weirs | 7.8–8.4 m; ok (mean 4.2–7.9 / 6.5–8.7 m) |
| J(a) the wake (15 m yes, 23 m no, a wall no, a non-carrier no, 18 m normal yes / easy no); J(b) no tracking through a wall | ok; goals ≥ 7 m off the real spot |
| K the knockback push (normal, hard; never easy) | normal 5 pushes, across in 2.67 s; hard 2.15 s; easy 0 |
| L the fuse danger for teammates; L(b) a guest carrier's | a mate 2.7 m off out to 5.9 m; ok |
| M the route hints; N super jumps; O the fuse → over the halfway line; P walkers round the shell | ok |
| R(a–d), S(a–d), Y(a–e), W(a–b) | §0.1, §0.4 |

### 5.2 Regressions (on c1a4def2 with the keeper fix; 8350f1f6 since changes Bazookarp bots only)
`bot-sight.js` (testbox, turf) **13 / 13** · `bot-specials.js` (testbox, turf) **19 / 19** · `bazookarp-rules.js` (karpbox)
**117 / 117** · `karp-loop.js` **6 / 6** · `int3.js` (karpbox) **10 / 10**. 0 console errors in all. Not run: net tests (nothing
new on the wire), the Mitts / twins / Cutlass suites (the two kit lines are bot-only and Bazookarp-only), hud, sfx, menus.

### 5.3 Bot matches
§0.3's table: 27 matches this round (karpbox, halyard, lockgate at normal, 2–3 a stage a set, one Electron instance each set,
`PLAN=`), JSONs in the session's scratchpad (not committed). karp-match now also prints the burst victims and the carries that
ended in a splat within 2.5 s / made no new ground; karp-agg prints them as a "bots:" line.

### 5.4 Pictures (`tools/botlab/jobs/batch5/karp-bots/out/`)
- **new** `karp-bots-halyard-burst.jpg` (239 KB) — a real all-bot halyard match 0.2 s after its first burst (17.7 s, Bravo's):
  Bravo's burst ink on the cabin roof, its three grabbers under it as squids 2.5–3.4 m from the Bazookarp (not visible: hidden in
  their ink), Alpha's spinner on the deck below in its own ink, 4.7 m off; Alpha's others were 25–57 m away. The first real-stage
  picture (the review: all four earlier ones were staged karpbox scenes). I looked at it: it shows the burst's ink and the one
  Alpha kid, not a ring of breakers — on halyard Bravo got there first.
- `karp-bots-burst.jpg`, `karp-bots-weir.jpg`, `karp-bots-keeper.jpg`, `karp-bots-wake.jpg` — the previous round's staged
  karpbox scenes (unchanged).

## 6. Commits and the shared files touched

This round (2026-10-16, evening):
- `a9d9fd5b` JOB-1.sh: the cap, SUBS, the folder.
- `017beb3d` no wall-hack in the defending plan; the wake within awareness; a guest carrier's fuse danger; W, J(a) 18 m, L(b).
- `02616427` the refill band, the melee keep-out, re-forming to the ring, free-phase fighters, the perch re-pick, `KARP_AI`
  numbers; checks A(c), B(b2), B(d), R, S, Y with teeth; H's name.
- `b48e307a` karp-match burst victims and short carries; karp-agg's bots line; NET.md.
- `9b9d0cc0` (scratch) the halyard picture.
- `c1a4def2` the keep-out for every bot, the band hold, the swell seen coming, the fallback steps, `clearAt` (off), the keeper's
  6 m; A(d); test isolation.
- `14b9ee07` botlab README; shots.sh.
- `8350f1f6` a Bubble Guard escort runs to the threatened carrier; the grab aims; S(c), Y(d).
- this report: a `(scratch)` commit.

The previous round: 39ce5114, 293507bf, d2b37568, 0485f186, f877849d, 03353da5, 11cfc5f5, 71aff892, 63133505, bb21cde9, 3168aebf,
c70bfacb, b025d202, 3620384a, dd4be8cc.

Shared files (all hook lines tagged `[b5-karp-bots]`):
- `src/game/bots.js`: the import (22); respawn → `karpJump` (684); `karpSpecial` (949, 1043); `karpPaintAim` (989); `karpMove`
  (1091); Vortex Strike aim (1510); `karpShields` (2518); `_pathTo`: `KA.cost`, the narrow-shell retry and the stepped fallback
  (2986–2988); **`_pickRefill` → `karpRefillSpot` (3045, new)**; `_steer` → `karpSteerOk` (3208).
- `src/game/botSpecials.js`: the import (67); `D()`'s `not` / `with` (109); `DANGER_API.line` (144); `karpDangers` (346);
  `_scan` (640, 663); `_gone` (700). (Unchanged this round.)
- `src/game/botSight.js`: `SIGHT.karpWakeR` (39); the wake in `_look` (227, **changed**: min with awareness).
- `src/game/subs.js` (508, 1094), `kits/waddle.js` (30, 420), `kits/blade.js` (18, 106), `kits/mitts.js` (28, 695): unchanged.
- `src/config.js`: `BAZOOKARP.shell.hp` (723), unchanged this round.
- `docs/NET.md`: a "bots" bullet in the Bazookarp section.
- Tools: `tools/botlab/karp-match.cjs`, `tools/botlab/karp-agg.py`, `tools/botlab/README.md`, `tools/botlab/tests/karp-bots.js`;
  scratch: `tools/botlab/jobs/batch5/karp-bots/` (`JOB-1.sh`, `shots.sh`, `shots-pre.js`, `out/`, this report).

## 7. Unfinished, flaky, uncertain
- **Carries still die young**: in every set ~half the carries end in a splat within 2.5 s of the pick-up and 55–71 % make no
  new ground. "Clear the ring" made it worse; a pre-keeper is untried. The next bot lever, for the shared balance pass.
- **Early knockouts**: 2 of the last 12 matches before 1:15 (38 s karpbox, 60 s); 5 of 26 on 3620384a. §9.1 allows 1 in 16.
  Needs ≥ 16-match sets on the Mac mini to judge; halyard (54.8 m) and lockgate (57.2 m) sit at the bottom of the 55–85 m band,
  karpbox (47 m) below it.
- **Halyard's carrierRetreatFallback is over the flag** (3.0–5.0 a match, ×3 retreat 5–12 s a match), all on the ferry's side
  corridors at the `fbAt` coordinates in §0.3: WP4b's layout. The stepped fallback did not reduce the ×3 seconds.
- **Big Bursts from 12–15 m** are near-unavoidable (§0.5): the lead's balance decision.
- **First pop**: medians 9.9–13.6 s across sets (12.7 s on the last); lockgate's walk in (11–11.5 s) is the floor there.
- **Burst splats remain**: 0.8–1.8 per 100 pops on the last two sets, melee grabbers caught 4.4–4.5 m out (at the burst's edge)
  or by a meter jump with the danger standing 0.3 s.
- **Flaky at the edges**: Y(b) hard read 0.17 s (window ≤ 0.1) in 2 of 12 trials; the grabber now aims early in each window
  (easy 0.43 s, normal 0.1 s, hard 0.1 s early), and three runs since read easy 0.37 s and hard 0.03 s in all 12 trials; the cause
  of the occasional ~0.15 s late arrival is not found. I(b) failed once on the keeper bug (fixed; 3 passes since). J(b) failed once in a full run (all 240 frames
  "seen legitimately" — its team saw the carrier at P1 from the start) and passed in 4 runs since, with `firstLegit` now
  reported should it recur; I could not reproduce it. B(d) read 4.74 m once against my first 4.8 m bound (now 4.6, §0.2).
- **The matches are small**: 2–3 a stage a set, one Electron instance each; nothing ran on the Mac mini. `JOB-1.sh` is ready.
- **Not tested with real clients**: a guest's Carp Shot as a danger to the host's bots, a guest carrier's fuse danger (L(b)
  flags the actor remote on one screen).
- **The wake has no look of its own** on this base (WP2's `bazookarpFx`).
