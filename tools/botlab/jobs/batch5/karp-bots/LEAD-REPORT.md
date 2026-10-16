# Bazookarp WP3 (karp-bots) — lead report

Worktree `/Users/danielosling/Desktop/1/st-b5-karp-bots`, branch `b5-karp-bots` (from b5-int3 b55f7472). Nothing pushed.
Everything ran on this Mac, one Electron instance at a time under the shared `SLOTS=3` lock (load average 400+ for most of
the afternoon, so a single page test often queued 10 minutes for a slot).

**Takeover.** The package was started on 2026-10-10 and cut off after about two hours. Its 5 commits (39ce5114 … f877849d)
and its uncommitted edits (the grabber's 3.12 m ring, melee stand spots ahead of the swell, a melee breaker never swinging
within 0.6 m of touch range, the shell guard judged 0.3 s ahead, karp-bots test fixes) were read and kept: they were sound.
Its karp-bots run stood at 16/20 (A hard, C, J(b) and M failing); its report had no tests, matches, pictures or commits
sections and `out/` was empty. This round found the causes of the four failures (two were test bugs, two were real bot
faults), fixed them and the seven more the new scenario G(b), the reworked H and the matches turned up (§1, §5.1), retuned the
opening shell, ran the regressions and 70 bot matches (16-match sets on three heads, and 1–6-match checks), made the
pictures and wrote this report.

**`COMMON.md` changed under the worktree while this ran** (an uncommitted edit dated 2026-10-16 12:04: "THE MAC MINI IS
BACK"). This package's own instructions say the Mac mini is unavailable and to push nothing, so nothing was pushed and
everything ran here; `JOB-1.sh` is committed and ready for the lead's consolidated pass. The edit is left as it was found
(not committed by this package).

## 1. What was built, rule by rule (SPEC §8, §11 WP3, the WP1 report's "Left for WP3")

Everything is in `src/game/botsKarp.js` (WP1's 238 lines → ~1 280), wired in by short tagged hooks (`[b5-karp-bots]`) in
`bots.js`, `botSpecials.js`, `botSight.js`, `subs.js`, `kits/waddle.js`, `kits/blade.js`, `kits/mitts.js`.
`KARP_AI.enabled = false` (karp-match `KARP_AI=0`) plays WP1's minimal set unchanged, for an A/B.

### 1.1 The team plan (`karpPlan()`, §8.1)
One plan per match engine (a WeakMap on `match.karp`), re-dealt twice a second **and at once on every karp event**
(`karp:burst / pickup / drop / reset / plant / phase / field`; the listeners go into the engine's own `unsubs`). Per team,
by situation:

| situation | roles |
|---|---|
| `shell` (shielded / re-forming / resetting) | the **perch** (a charger, while there's another bot to grab) first; the **grabber** (the bot nearest the shell, no special running — its own Bubble Guard is fine — hp ≥ 60); the rest **break** (each a slot, spread on our side). Re-forming / resetting: the same spots round the resting point / the Pond, 6–8 m out |
| `free` | the grabber (nearest, not mid-special; none if a human teammate is within 3 m and closer, §8.3) and anyone within 6 m **grab**; the rest **fight** 4–7 m out toward their side |
| `ours` | **carry**, **lead** (11 m ahead on the carrier's route, inking it), **flank** (5 m beside it, on the side the known threat is), **anchor** (9 m behind it on its route); a 5th+ bot flanks |
| `theirs` | **keeper** ×1 (×2 when the carrier is known within 25 m by the field of our open Gate, or its count within 10 of its weir's), **perch** (a charger, unless 2 keepers are needed), **intercept** ×2 (×1 easy; hard: from two sides, ±0.9 rad); leftovers intercept (easy: keep) |

Humans fill the role whose spot is nearest them (bots take the rest). Hysteresis: a bot keeps its role unless another is
clearly nearer (3 m; 6 m for escorts and defenders). The dead get a role for their respawn. Team knowledge is
`teamKnown()` (≤ 4 s) read at the last look's spot (`k.guess`) — never the live position.

### 1.2 Breakers and the burst (§8.2)
- **Ranged breakers** stand on the 5.5–9 m ring (a 7 m spot, spread by slot on our side, with a kid's-eye line to the
  shell's centre) and strafe there while they shoot. `karpAim` shoots the shell when nothing better is in sight.
- **Melee breakers** (roller, brush, blade, mitts) close in to `max(2.5, r' + 0.38 + 0.5) + 0.3` m (r' the radius a little
  ahead of the meter: it swells) while the other team's side is under 50 %, and stand on the ring above it. They never swing
  from closer than 0.6 m outside touch range (a swing, roll or lunge carries the body on).
- **The danger** (≥ 70 % of theirs normal, ≥ 60 % hard, none easy): a botSpecials area (§1.5); the team behind steps out
  to ≥ 5.5 m and routes round it; the ranged ones keep shooting from the ring.
- **The grabber**: at ≥ 85 % of ours it closes to 3.12 m (touch reach at full swell 2.68 m) with a gentle radial spring; a
  charger, bow or splatling there **holds its fire** (a stream still running at the burst kept it a kid and it arrived
  late); after the burst it times its run so it arrives inside its difficulty's window (normal 0.1 s after the 0.25 s hold,
  easy 0.5 s, hard at once), swimming in through its own team's burst ink (all of it is theirs the moment it bursts).
- **Touch, never** (karp-bots C, 0 in 20 bursts):
  - a bot with no business close to the shell (not a melee breaker, not already within 3.2 m) routes clear of its **full
    swell** (nodes within rMax + 0.6 = 2.9 m: `shellWide`), and its footwork guard keeps clear of rMax + 0.38 m — a big
    hit swells the shell 0.5 m in one frame onto a bot walking past just outside its reach (that was C's one touch);
    melee breakers and bots already close use the shell's radius now + 0.6 m; where the full swell leaves no way round (a
    narrow bridge) `_pathTo` retries round the shell itself;
  - the guard is judged where the bot will be in 0.3 s at its speed toward the centre, takes the inward part off a move,
    pushes out (a kid, no charge) inside reach + 0.15 m;
  - **bots never lunge (Cutlass heavy cut) or land a Mitts leap into the sting** (`karpShellIn`, asked by the kits'
    `lungeSafe` / `landingOk`, bot-only, Bazookarp-only): the lunge sets the velocity itself, so no footwork guard can stop
    it (that was the other touch C found).
- **The shell first**: in the shell phase a breaker takes a fight only with a foe within min(0.75 × range, 10 m) or inside
  the ring; the grabber only one within 6 m. More than 18 m out they don't paint on the way in and swim our ink.
- **Specials**: breakers keep a bomb-type special (barrages, Cheer Orb, Vortex Strike) for the shell, fired at ≥ 40 % of
  ours (Vortex Strike: 2.5 m beside the shell on their side).

### 1.3 The carrier (§8.4)
- **Routes**: when its target changes (its standing weirs — each its own target — then its Gate), up to 3 candidates on
  `G.nav` with no climbs and its avoid mask: the layout's `routes` hints (mirrored for Bravo; only their waypoints still
  ahead by the field; when a stage has hints they are the only candidates), else the shortest path and k-disjoint
  alternatives (2.5 m clear of route 1 except within 6 m of the ends, ≤ 1.7× long). Re-picked every 3 / 1.5 / 1 s by
  difficulty (hard also when the number of known foes changes) by cost: what's left + 6 m per known foe within 10 m of its
  next 25 m + 0.3 × the metres of enemy ink on its next 20 m + 0.15 × the danger cost on its next 25 m; 8 m of hysteresis.
- **Walking the pick** (new this round): its goal is the picked route's node 12 m on (the target in the last 12 m), so it
  really walks the route it chose — going straight at the target it cut the corner of a longer route picked round known
  foes (karp-bots M: maxX 3.5 → 7.3). If that node lies behind its retreat mark (a route that winds back first) the goal is
  the target and the route rules find the forward way.
- **`_pathTo`** is carrier-aware at every call site: the avoid mask (both spawn zones, its own free zones, carrierBlock, the
  shell, nodes the field's current state takes away, and on its own half nodes 6 m behind its retreat mark), and a Float32
  cost refilled at most twice a second (dangers + 1.2 a node off the pick's 2 m corridor + 2 a node within 4 m of a known
  foe + **1.5 a node within 0.7 m of its own free zone**, so corners are rounded a node out). The masks are now built **per
  field state** (a zone may stand in some eras only). No path → plan again without the retreat part
  (**carrierRetreatFallback**, one count per 3 s episode, logged with the team, P and the mark); still none → level 2,
  through its own zone at a cost (a short zone ×3). A carrier standing inside its own zone leaves it the shortest way.
- **Steering** (new): `_steer`'s look-ahead never cuts a straight line across its own free zone or a carrierBlock (they
  are no walls, so the line probes didn't see them; karp-bots G(b) found a carrier cutting through a zone arm).
- **Never retreat**, never `refill` / `retreat` mode (WP1's gate).
- **Form**: kid to charge; a squid through our ink when no foe is known within 12 m (the marker hides) and never in theirs;
  just after a pick-up (1.8 s, standing in our ink) it dives and swims on along its route.
- **Shots** (`karpCarrierAct`, the only writer of `it.fire` while carrying), §8.4's order: a weir / the Gate within 4 m:
  no shots · the knockback push (normal / hard: Splashes backwards in enemy ink with a known foe within 10 m, or the fuse
  under 6 s and the target ≤ 12 m) · hard: a Splash out of a focus · a known foe within 6 m: a Splash at its feet, then a
  0.6 s step back · a known foe 6–22 m: a charged shot by the arc solver (normal / hard lob at a remembered spot; easy only
  with a line, always full; hard leads) · an enemy Waddle / Torpedo within 8 m: a Splash at it · enemy ink on the next
  10 m and nobody within 15 m: a full charge onto the route 15 m ahead.
  - **The low arc** (new): the solver returned whichever pitch fit best, now and then a 2 s high lob anyone walks out of;
    it takes the low arc, the high one only at a foe out of sight (over cover).
  - **Kick-safe** (new): never a shot whose kick (backwards along the aim, 0.75–1.8 m) would carry it off a > 0.9 m drop or
    into the water behind it — halyard's sun deck put carriers down on their own side's corridor, behind their retreat
    mark.
- **Fuse**: on its own half, when the fuse can't reach the target at 85 % of its walking pace, it heads for the first route
  node 2 m past the halfway line, so a blast drops the Bazookarp forward (O).

### 1.4 Escorts, defenders, interceptors (§8.1, §8.5)
- **Lead** 11 m ahead inking the route (the emptiest of 5 route points 4–16 m ahead in reach); **flank** 5 m to the
  threat's side; **anchor** 9 m behind. Escorts fight within 20 m of the carrier and never chase past it; they fire
  specials only while the carrier is threatened; a Bubble Guard holder within 5 m pops it then (sprules' pass-on).
- **Keeper**: a hold spot 4–9 m in front of the defended weir (two weirs: the one nearer where the carrier is known) or our
  risen Gate, on the attackers' side by the field, with a line to the objective and the approach, in cover (precomputed per
  objective and field state, ≤ 420 rays once). It fights from the spot, never chases more than 6 m off it, and inks the
  approach.
- **Interceptors** go for the carrier while the team knows where it is (seen, or located: the kid-form marker is a
  reveal), from 7.5 m (outside its Splash; melee straight in; hard from two sides); hidden, to its last known spot and then
  along the route the plan expects it to take, 8 m at a time. Never its live position (J).
- **Perch**: a charger on high ground 10–22 m from the shell or the enemy carrier / its route, re-picked every 6 s.
- **Super jumps** (`karpJump`): a respawned bot jumps to our carrier when it's alive and ≥ 35 m away (else to the anchor);
  a defender respawning while they carry stays home (N).
- Target bias +40 on the enemy carrier (WP1); the Roe Shell is a shield in the line of fire for every bot (`karpShields`).

### 1.5 Dangers and sight (§8.6) — no wall-hacks
`botSpecials.specialDangers()` calls `karpDangers()`:
- **An enemy Carp Shot in flight** (real or ghost): a disc at its predicted landing (a 0.05 s ballistic sweep, cached
  0.1 s), radius blast + 0.6 m, `tIn` = flight left + the 0.45 s swell, `vis 'near'`. New this round:
  - the disc is drawn **0.8 m back toward the shooter** and 0.8 m bigger, so the way out from under a lob is sideways or on
    beyond — back toward the shooter runs under the ball, and **a Carp Shot lands on a body in its way** (karpGun's capsule
    test): that was most of the misses in H;
  - **its way in** — the last metres of its fall below head height, short of the last one — is a projectile line
    (`DANGER_API.line`, new), an obstacle for the way out only (`dodge` 0.05 s: never a reason to run by itself), noticed
    together with the disc (`d.with`, new in botSpecials: one thing seen, two areas).
- **Landed**: the disc at the landing, `tIn` = the swell left, lethal 2 for a Big Burst, a wall is cover, `vis 'big'`.
- **Our carrier's last 3 s of fuse**: 4.5 + 1 m round it, for its teammates only (`d.not` = the carrier), `vis 'big'`, heard
  10 m (L).
- **The shell about to burst**: 5.5 m for the team behind once the other side is ≥ 70 % (normal) / 60 % (hard), none easy.

`botSight`: a submerged enemy carrier is noticed by its wake out to `SIGHT.karpWakeR` = 20 m with a clear line and the usual
0.45 s of looking — never through a wall, and only the carrier has it (J(a)).

### 1.6 Walkers round the shell (the WP1 report's open point)
Waddle Bombs route round the shell's nodes (`karpShellAvoid()`, the full swell); Skitter Bombs steer for the nearer tangent
when the straight line to their foe runs through the shell (`subs.js shellRound`). WP1's glance / wall behaviour stays
underneath, so nothing ends inside the shell (P; bazookarp-rules M5).

### 1.7 Difficulty (§8.8, `KARP_AI.diff`)

| | easy | normal | hard |
|---|---|---|---|
| carrier shots | always full, only with a line, no lead | full / by range, lobs at a remembered spot | + leads a moving target |
| knockback push | never | enemy ink with a foe ≤ 10 m; fuse < 6 s and target ≤ 12 m | + a Splash out of a focus |
| route re-pick | 3 s | 1.5 s | 1 s + when the known threat changes |
| breakers' danger | none | ≥ 70 % | ≥ 60 % |
| interceptors | 1 | 2 | 2, from two sides |
| grab after the hold | 0.6 s (aimed at 0.5) | 0.2 s (aimed at 0.1) | 0 s |

## 2. Decisions where the request / SPEC left a gap (for the lead)
1. **A Carp Shot is not a "fast" projectile** for botSpecials' miss chance: a lobbed ball, read like a thrown Splat Bomb.
2. **Our carrier's fuse danger is `vis 'big'`, heard within 10 m**, not `'actor'` (bots only keep sight memory of foes, so
   its teammates could never have noticed an `'actor'` area); `d.not` keeps the carrier itself out of it.
3. **The shell danger's threshold is the threatened team's difficulty.**
4. **Normal bots also push when the fuse is short** (§8.4's table names it for normal and hard).
5. **A layout's `routes` hints are the only candidates** when the stage has any (no current stage has hints: karpbox
   proves them, M).
6. **The retreat mask's "own half" comes from the field**, and nodes the current state removes are avoided; a **level-2
   fallback** goes through the carrier's own free zone when that is the only way on (the SPEC's fallback drops only the
   retreat part, which can leave no path at all).
7. **Team knowledge from the last look** (`k.guess`), never `e.pos`.
8. **The shell first** in the shell phase (fights only close in or inside the ring).
9. **The grabber swims in** through its own burst's ink, and aims inside its difficulty's window (not at its end).
10. **A fresh carrier dives first** (1.8 s under our ink, along its route).
11. **Keepers**: 2 when the carrier is close (§8.5); an easy team's leftovers keep.
12. **karp-match's stuck metric leaves out bots holding a spot on purpose** (keepers, ring breakers, the grabber's wait,
    perches: `kHoldUntil`), as match.cjs does a zone guard; the hold time is reported.
13. **(new) Bots with no business near the shell keep clear of its full swell (2.9 m), not of its radius now**: a melee
    breaker's close spot is the SPEC's rule; everyone else would only be walking past, and the swell can jump 0.5 m in a frame.
14. **(new) The kits' lunge / leap guard lives in the kits** (`kits/blade.js lungeSafe`, `kits/mitts.js landingOk`: one
    tagged line each, bots only, a no-op outside Bazookarp) — the same place their existing "bots don't lunge off ledges"
    rule is.
15. **(new) karp-bots H fires from 18 m, with 12 and 15 m reported.** The SPEC's "≥ 16 of 20" names no range. A Big Burst
    from 12–15 m lands in 0.5–0.7 s and blows 0.45 s later; a normal bot notices it after 0.25–0.45 s and has 4 m to cover at
    5.3 m/s on dry ground: a coin flip by the numbers (12 m: 1–6 of 10, 15 m: 1–8 of 10 across 7 runs), not by the bots. From
    18 m it is 16–20 of 20. The victim now stands on its breaker spot as the SPEC says (the old test's victim was still
    walking in from its deck, under the arc). **TELL THE USER**: a Big Burst from under ~15 m is close to unavoidable for a
    standing kid on dry ground; that is the Carp Shot's numbers (flight + 0.45 s swell, 4.0 m blast), which this package
    didn't change.
16. **(new) karp-bots J(b) looks once after its teleport.** The test jumps the carrier 12 m behind a wall in one frame;
    until the interceptor's next look (≤ 0.25 s) its fight memory still says "seen", and bots.js's view of a seen foe is the
    foe itself. A real carrier moves ≤ 1 m between two looks, so the test now makes that look at once; the plan, the
    interceptor goal and every karp decision read `k.guess` only.
17. **(new) The opening Roe Shell is 600 hp** (§4).

## 3. Online, and what the bots read
- **No new records, nothing new on the wire.** Bots run on the host (and offline) only, as every INKWAVE bot does; the plan
  reads the host's engine and `G.karpGun.shots` (ghosts included), so a guest's Carp Shot is a danger to the host's bots
  like any other. The wake rule reads the replicated `anim.form` / `submerged`.
- **No wall-hacks**: foes through `botSight` (seen, located — the kid-form marker is a reveal — or remembered, shared as
  `teamKnown`, always at the last look's spot); dangers through botSpecials' noticing rules; interceptors never read the
  carrier's live position (J).
- A bot adopting a disconnected carrier keeps carrying with these hooks.
- The kits' bot-only lunge / leap guard (`karpShellIn`) is false for any human, any remote actor and outside Bazookarp.

## 4. Numbers tuned, and why
Only `BAZOOKARP` numbers on the allowed list, and the bots; no rule changed.

| number | was | now | why |
|---|---|---|---|
| `shell.hp` (the opening Roe Shell) | 1000 | **600** | The first bots reach the Pond 8.3–11.3 s in (karp-match now logs it): the walk is the floor under the first pop. At 1000 the median first pop was 13–18 s (the previous round), at 800 11.6 s on karpbox (n 6), 14.5 lockgate, 13.1 halyard; at 600 on the head 9.7 s on karpbox, 12.6 halyard, 12.4 lockgate (normal). §9.1 wants 6–12. Below ~600 the first team there would burst it alone. |
| `shell.reformHp`, `regen`, `regenDelay`, `burstR`, the Carp Shot's sizes and `kick` | — | unchanged | Re-formed shells pop every 4–15 s; the knockout rate is already inside 20–60 % (§5.3; a `reformHp` 700 what-if didn't help the early knockouts); overtimes too few to judge the 15 % row; normal and hard cross K's 7.5 m of enemy ink in 2.2–3.2 s with the push (easy, which never pushes, 2.9–4.2 s). The shared balance pass judges these. |
| bots: `KARP_AI` | — | ring 5.5–9 m, grab at ≥ 85 % from 3.12 m, danger 5.5 m at 70 / 60 %, escorts 20 m, jumps from 35 m, wake 20 m | the SPEC's numbers |

## 5. Tests and their results (all local; nothing on the Mac mini)

### 5.1 `karp-bots.js` (`MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js … page.cjs`)
**22/22 on the head (3620384a).** About 40 runs of single groups and 5 full runs this round (16/20 → 20/21 → 21/22 →
21/22 → 22/22); the history of each check is in the right-hand column.

| check (SPEC §11 WP3) | final run | notes |
|---|---|---|
| A breakers out of the burst at ≥ 70 % (normal) / 60 % (hard), keeping the 5.5 m ring; easy has no danger | min 5.59 / 5.91 m | the previous round had loosened it to 4.6 m after a 3.78 m run; now 5.46–6.39 m in 9 runs, so it is back at 5.3 m (the ring with 0.2 m of slack) |
| B melee breakers: the ring at 55 % of theirs, ≥ 2.9 m and in reach at 75 % of ours | out 6.4–6.9 m, in 4.1 m | |
| C no touch damage in 20 bursts, all eight bots | 0 | it failed twice this round (a passing bucket caught by a 0.5 m swell in one frame; a Cutlass lunge): both fixed (§1.2) |
| D the grabber at 3.0–3.2 m, grabbing within 0.2 s after the hold (5 weapons) | 3.17–3.19 m, 0.05–0.17 s | failed twice (a spinner's stream at 0.25 s; a shooter at 0.23 s): fixed (it holds stream / charge weapons on the ring; aims inside the window) |
| E an autopilot carrier, 3 scripted carries: no ×3, no own zone, no stuck > 3 s | 3/3, 0 / 0 / 0 | |
| F carriers with the mitts, blade, brolly, bow, roller, charger, twins, 3 carries each: zero own shots, subs, `sub:cantuse`, specials, climbs, leaps, rolls | 21/21 carries, all 0 | |
| G every forward route closed (a sea-to-sea own zone): a short ×3 instead of standing still | fallback 1, zone ×3 0.63 s, moved 28.6 m | |
| G(b) **new**: a pocket of its own zone open behind it — the retreat mask's own case: level-1 fallback, a short retreat ×3, round the arm, on | ×3 1.6 s, zone 0 s | found the carrier cutting across a zone arm (the steering fix, §1.3) |
| H a breaker standing where a Big Burst lands leaves the disc (normal, ≥ 16 of 20) | 20/20 (18 m) | 16–20 of 20 in 7 runs; 12 m 1–6 of 10, 15 m 1–8 of 10, reported (§2 #15) |
| I(a) the keeper holds the open Gate | 8.5 m from it | |
| I(b) two weirs: the keeper on the weir on the carrier's route, switching with it | ok both | once 9.56 m against the 9.5 m bound (then 4 passes): flaky at the edge |
| J(a) the wake: seen at 15 m in the open, not at 23 m, not behind a wall; a non-carrier at 15 m not | ok | |
| J(b) an interceptor doesn't track a hidden carrier through a wall | its goals ≥ 12.3 m off the real spot | was failing on the test's own teleport (§2 #16) |
| K the knockback push in enemy ink (normal and hard; never easy) | normal 4–5 pushes, crossing in 2.8–3.1 s; easy 0 | |
| L our carrier's last 3 s of fuse: a danger to its teammates, never to itself | a mate 2.7 m off gets out to 5.9–7.4 m | |
| M the layout's route hints are the only candidates; two known foes on one move the pick, and the carrier walks it | picks east, walks to x 7.3 | was failing: a test bug (re-granting a held Bazookarp) and a real one (it walked straight at the target, §1.3) |
| N super jumps to the carrier ≥ 35 m off; a defender stays home | ok | |
| O a fuse that can't make it: over the halfway line first | ok | |
| P walkers (Skitter, Waddle) round the shell to a foe behind it | Skitter 21 of 110 frames pressed against it, 0 inside; Waddle 0 | the bound "under a quarter of the walk" is the previous round's (it was < 12 frames) |

### 5.2 Regressions (on this round's code)
| test | result |
|---|---|
| `bot-sight.js` (testbox, turf) | 13/13 |
| `bot-specials.js` (testbox, turf) / (tower) | 19/19 / 1/1 |
| `bazookarp-rules.js` (karpbox) | 117/117 (twice; A4 reads `BAZOOKARP.shell.hp`) |
| `karp-loop.js` | 6/6 (twice) |
| `karp-two.js` karpbox / halyard | 6/6 (twice) / 6/6 |
| `int3.js` karpbox / testbox turf | 10/10 (twice; once on the head 3620384a) / 4/4 |

Not run (untouched by this package's changes, or hooks that are no-ops outside Bazookarp): net tests (nothing new on the
wire), the Mitts / twins / Cutlass suites (the two kit lines are bot-only and Bazookarp-only), hud, sfx, menus.

### 5.3 Bot matches (`karp-match.cjs`, all-bot, 300 s + overtime at 60 Hz; `karp-agg.py`)
**The head (3620384a), 16 matches** — karpbox, halyard, lockgate at normal ×4 / ×3 / ×3, and ×2 each at hard, one
Electron instance (`PLAN=…`), 16:12–16:28:

| stage | diff | result | KO at | first pop (bots by the Pond) | pops A/B | carries (made new ground) | plants | fallback | ×3 retreat / zone s | carrier stuck > 3 s | clamp | stuck % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| halyard | hard | B knockout | 102.7 | 12.92 (9/9) | 3/6 | 9 (8) | 1 | 2 | 5.4 / 0 | 0 | 0 | 0.1 |
| halyard | hard | A stopped | – | 16.42 (9.8/9.8) | 7/12 | 19 (7) | 1 | 7 | 19.1 / 0 | 0 | 0 | 0.5 |
| halyard | normal | B knockout | 272.5 | 12.63 (9/9.5) | 6/16 | 22 (8) | 1 | 2 | 3.6 / 0 | 0 | 0 | 0.5 |
| halyard | normal | A time | – | 13.78 (9/8.8) | 20/10 | 30 (5) | 2 | 5 | 11.8 / 0 | 0 | 0 | 0.4 |
| halyard | normal | B knockout | 258.6 | 10.25 (10/9.5) | 14/14 | 28 (12) | 2 | 2 | 2.8 / 0 | 0 | 0 | 0.2 |
| karpbox | hard | B stopped | – | 11.06 (8.3/8.3) | 13/17 | 30 (8) | 2 | 0 | 0 / 0 | 0 | 0 | 0.6 |
| karpbox | hard | A knockout | 84.9 | 20.27 (9.3/8.5) | 4/1 | 5 (3) | 2 | 1 | 0 / 0 | 0 | 0 | 2 |
| karpbox | normal | A knockout | 180.4 | 9.3 (9/8.8) | 11/7 | 18 (9) | 1 | 0 | 0 / 0 | 0 | 0 | 0 |
| karpbox | normal | A knockout | 116.1 | 10.07 (8.3/8) | 3/6 | 9 (8) | 1 | 0 | 0 / 0 | 0 | 0 | 0 |
| karpbox | normal | A knockout | 178 | 13.99 (8.3/8) | 11/5 | 16 (7) | 1 | 0 | 0 / 0 | 0 | 0 | 1.8 |
| karpbox | normal | B knockout | 198.1 | 9.15 (9/8.8) | 5/17 | 22 (7) | 1 | 0 | 0 / 0 | 0 | 0 | 0.2 |
| lockgate | hard | A stopped | – | 12.08 (10.8/11) | 12/3 | 15 (8) | 2 | 1 | 2.8 / 0 | 0 | 0 | 0.3 |
| lockgate | hard | A time | – | 13.45 (11.3/11) | 11/15 | 25 (12) | 1 | 0 | 0 / 0 | 0 | 0 | 0.4 |
| lockgate | normal | B time | – | 12.38 (10.8/11.3) | 10/12 | 22 (9) | 2 | 0 | 0 / 0 | 0 | 0 | 0.2 |
| lockgate | normal | B time | – | 11.98 (10.8/11.8) | 14/9 | 22 (9) | 1 | 0 | 0 / 0 | 0 | 0 | 0.1 |
| lockgate | normal | A time | – | 12.9 (11/10.8) | 5/16 | 21 (9) | 1 | 0 | 0 / 0 | 0 | 0 | 0.2 |

"carries (made new ground)": carries, and in brackets those that pushed their team's best further (the rest died before
passing the spot where the last one fell). 0 console lines, 0 frame errors in all 16.

| §9.1 row (all 16) | result |
|---|---|
| knockout rate 20–60 % | **PASS** 8/16 (50 %): karpbox normal 4/4, hard 1/2; halyard 2/3, 1/2; lockgate 0/3, 0/2 |
| early knockouts ≤ 1 of 16, median ≥ 2:30 | **PASS** 0 early, median 179 s (but **3 of 16** in the previous set below: §7) |
| weir planted ≥ 75 % | **PASS** 16/16 |
| side balance | **PASS** A 9, B 7 |
| first pop median 6–12 s | **FAIL** 12.5 s: karpbox 9.7 s (normal) / 15.7 (hard), halyard 12.6 / 14.7, lockgate 12.4 / 12.8 — the first bots reach the Pond at 8–11.8 s |
| Carp Blasts ≤ 1.5, resets ≤ 2 a match | **PASS** 0, 0 |
| own-free-zone time ≤ 3 s | **PASS** 0.0 s |
| stuck ≤ 1 %, carrier > 5 s: 0 | **PASS** 0.5 %, **0 carrier episodes > 3 s in all 16** (the done criterion: karpbox's 6 too) |
| losing team wins ≥ 15 % of S38a / S38c overtimes | report only: 0/1 |
| shared-bubble knockouts ≤ 25 % | **PASS** 0/8 |
| clamp rejections 0 | **PASS** 0 |
| carrierRetreatFallback ≤ 1 a match (a stage builder's flag) | **FLAG** 1.25: halyard 3.0 (normal) / 4.5 (hard), karpbox 0 / 0.5, lockgate 0 / 0.5 |

The other sets this round (all through `karp-agg.py`; the JSONs are in the session's scratchpad, not committed):

| set | code | n | knockouts | early (< 1:15) | first pop median | stuck | carrier > 3 s | clamp | fallback / match |
|---|---|---|---|---|---|---|---|---|---|
| baseline | 63133505, 800 hp | 16 | 6 (38 %) | 2 (47, 60 s) | 13–15 s (cells) | 0.2–0.4 % | 0 | 0 | halyard 3.7 / 4.0, others ≤ 0.5 |
| opening shell 600 hp (`KARP_CFG`) | 63133505 | 5 | 2 | 0 | karpbox 10.5, lockgate 15.1 | ≤ 0.9 % | 0 | 0 | ≤ 1 |
| pre-head check | 3168aebf + D fix | 16 | 7 (44 %) | **3** (43, 44, 55 s) | 11.4 s | 1.0 % | 0 | 0 | 1.0 (halyard 2.3 / 4.5) |
| head check | 3620384a | 4 | 2 | **2** (35, 43 s) | ~10 s | 0–0.3 % | 0 | 0 | halyard 6 / 0, karpbox 0 / 0 |
| what-if `reformHp` 700 | 3620384a | 6 | 2 (33 %) | **2** (42, 49 s) | 12.7 s | 0.2 % | 0 | 0 | halyard 3.5, others 0 |


### 5.4 Pictures (`tools/botlab/jobs/batch5/karp-bots/out/`, karpbox, made by `shots.sh` + `shots-pre.js`)
- `karp-bots-burst.jpg` (241 KB) — Bravo bursts the opening shell at 8.2 s: Alpha's breakers stand 6.2–12.5 m out on
  the ring (outside the 4.5 m burst), Bravo's grabber 2.8 m from the Bazookarp running in.
- `karp-bots-weir.jpg` (216 KB) — an Alpha carrier swimming up its weir's ramp in its lead's ink (only its marker pillar
  shows), the lead already on the weir, the flank behind.
- `karp-bots-keeper.jpg` (244 KB) — Alpha's keeper 6 m in front of its risen Gate, the approach inked.
- `karp-bots-wake.jpg` (116 KB) — an Alpha interceptor's eyes, Bravo's carrier swimming hidden in its ink 15 m off: no
  marker, a faint ripple; the bot notices it by the wake rule (`seen: true`).

## 6. Commits and the shared files touched

The previous round (2026-10-10, kept):
- `39ce5114` the team plan, the carrier's routes and shot table, the danger areas, the wake, walkers round the shell.
- `293507bf` karp-bots.js A–M; the grabber's timed run, the ring hold, the shell guard, team knowledge from the last look.
- `d2b37568` a fresh carrier dives first; karp-bots N, O, P; `JOB-1.sh`; README.
- `0485f186` tuning: the opening shell 1000 → 800 hp; breakers hurry in.
- `f877849d` karp-match `PLAN` / `REPEAT`; roles as bot-seconds.

This round (2026-10-16):
- `03353da5` the shell's full swell (guard, routes), no lunge / leap into the sting, the carrier walks its picked route and
  never steers across its own zone; its uncommitted edits; karp-bots C, G(b), J(b), M.
- `11cfc5f5` Carp Shot dodging (the way-in line, `d.with`, the disc drawn back), the low arc; karp-bots H reworked.
- `71aff892` the grabber holds stream / charge weapons on its ring.
- `63133505` the carrier's masks per field state; the narrow-shell retry.
- `bb21cde9` kick-safe carrier shots; the look-ahead falls back to the target behind the mark; karp-match what-ifs,
  arrival, the fallback log.
- `3168aebf` tuning: the opening shell 800 → 600 hp; karp-bots A back to the ring.
- `c70bfacb` (scratch) the pictures.
- `b025d202` botlab README.
- `3620384a` unreachable spots (nearest point on the way, else a pause), the perch's fallbacks, the grabber's window.
- this report: a `(scratch)` commit after it.

Shared files (all hook lines tagged `[b5-karp-bots]`):
- `src/game/bots.js`: the import (22); respawn → `karpJump` (684); `karpSpecial` in the fight and paint special
  decisions (949, 1043); `karpPaintAim` (989); `karpMove` before the carrier's last guard (1091); Vortex Strike aim →
  `karpStrikeAt` (1510); `karpShields` in the shields list (2518); `_pathTo`: `KA.cost`, the narrow-shell retry and the
  level-2 fallback (2986–2988); `_steer`'s look-ahead → `karpSteerOk` (3206).
- `src/game/botSpecials.js`: the import (67); `D()` gains `not` and `with` (109); `DANGER_API` gains `line` (144);
  `karpDangers` (346); `_scan` skips `d.not` (640) and notices `d.with` with its partner (663); `_gone` counts per source
  (700).
- `src/game/botSight.js`: `SIGHT.karpWakeR` (39) and the wake in `_look` (227).
- `src/game/subs.js`: the Skitter's heading through `shellRound` (508) and the function (1094).
- `src/game/kits/waddle.js` (30, 420), `kits/blade.js` (18, 106), `kits/mitts.js` (28, 695): one import and one line each.
- `src/config.js`: `BAZOOKARP.shell.hp` (723).
- `tools/botlab/karp-match.cjs` (PLAN, KARP_AI, KARP_TUNE / KARP_CFG, arrival, the bots' report),
  `tools/botlab/tests/bazookarp-rules.js` (A4), `tools/botlab/README.md`.
- New: `tools/botlab/tests/karp-bots.js`; `tools/botlab/jobs/batch5/karp-bots/` (`JOB-1.sh`, `shots.sh`, `shots-pre.js`,
  `out/*.jpg`, this report).

## 7. Unfinished, flaky, uncertain
- **Early knockouts (§9.1's row: no knockout before 1:15 in more than 1 of 16; median ≥ 2:30) fail** — 0 of 16 on the head, but 3 of 16 in the set before it (43, 44, 55 s) and 2 of 4 in the head's own check (35, 43 s); 2 of 16 at 800 hp. They
  come from runaway sequences on the first-cut layouts: one team bursts, carries 18–28 m to its weir in 4–6 s (a carrier
  swims its team's ink at 9.4 m/s), re-pops the 500 hp shell where it dropped on the other half before the other team is
  back from its spawn, and walks the last 20 m. Halyard (L 54.8 m) and lockgate (57.2 m) sit at the bottom of §9.1's
  55–85 m band, karpbox (47 m) below it. Levers for the shared balance pass, none applied: `shell.reformHp` up (a 6-match what-if at 700 still had 2 runaways at 42 and 49 s: it is not the lever),
  a "pre-keeper" (when the other side leads the meter, one of ours falls back to our weir), longer stages (WP4b).
- **Most carries make no new ground**: 60–80 % of carries end in a splat within ~2 s of the pick-up. At the burst the
  other team waits on its ring 5.5–9 m out (the danger keeps it out of the 4.5 m burst, so `burst splats` is 0–2 a match)
  and focuses the carrier (+40). Progress still accumulates (the shell re-forms where its carrier fell, and the knockout rate
  is inside the band), but a "clear the ring before the burst" / "regroup behind the team" behaviour is the next bot lever.
- **Halyard's carrierRetreatFallback is over the flag** (3.0 at normal, 4.5 at hard on the head; 2.3–4.5 in every set a match; karpbox and lockgate 0). The log
  (`[x, y, z, level, team, P, mark]`) puts them all on the ferry's side corridors (y 1.3, |z| 3.5–5): a Bazookarp that
  re-forms on a team's own corridor, behind the cabin, has no forward way that doesn't first go 6+ m back. The kick-safe
  shots stopped carriers knocking themselves down there; the rest is the first-cut layout (WP4b), as §9.1 says.
- **The first pop on lockgate stays over 12 s** (median 12.4 s at normal, 12.8 at hard on the head; 12.4–19.8 across the sets): its bots reach the bridge Pond at 10.3–11.5 s; the
  shell's hp can't fix the walk. Karpbox and halyard are inside 6–12 s at 600 hp.
- **Big Bursts from under ~15 m are near-unavoidable** for a standing kid on dry ground (§2 #15, H's report row).
- **Overtime's "losing team wins ≥ 15 %"**: too few S38a / S38c overtimes to judge (report only).
- **Flaky at the edges**: I(b) once 9.56 m against its 9.5 m bound (4 passes since); H 16–20 of 20 at 18 m; D's window
  (fixed twice this round, 7 passes since); A 5.46 m at its lowest against 5.3.
- **P's bound** (a Skitter pressed against the shell for under a quarter of its walk; 21 of 110 frames) is the previous
  round's loosening of "< 12 frames"; the Skitter does round the shell and never ends inside it.
- **Nothing ran on the Mac mini**: the shared balance pass (`JOB-1.sh`: 16 matches per stage at normal on karpbox,
  halyard, lockgate and 16 at hard on halyard, lockgate) is committed and not run; this report's sets are 2–4 per cell.
  (`COMMON.md` in this worktree now says the Mac mini is back; this package's instructions said to push nothing.)
- **Not tested with real clients**: a guest's Carp Shot as a danger to the host's bots (it reads the ghost the host already
  flies; nothing new on the wire).
- **bots.js's view of a foe** (`tv`) gives the live position while its memory still says "seen" — until the next look,
  ≤ 0.25 s. Not Bazookarp's; left alone (J(b)'s teleport showed it).
- **The wake has no look of its own** on this base (WP2's `bazookarpFx` owns it): the wake picture shows a ripple only.

