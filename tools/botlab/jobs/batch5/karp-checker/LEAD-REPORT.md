# Bazookarp WP4a: the checker and the stage kit (key `karp-checker`): lead report

## At a glance

- **Review 1's verdict (REDO) is answered: all 8 issues are fixed, each with proof** (§0).
- **The checker is now harder to fool.** The reviewer's three hidden Gate entrances (H2p, H2bp, H2q) now FAIL #7. On
  real stages, each of the review's rising-jump shortcuts is now a #7 find.
- **No more false climb FAILs:** inkable steps of up to 1.8 m that a kid hops count as hops.
- **Self-test: 48/48** (25 cases before), no console errors.
- **halyard and lockgate:** their first-cut data still fail, as expected.
- **For the lead:** two changes to the Carp Field itself (a rising-gap edge, and hop edges where nav has a climb edge)
  and one reading of the spec (D23). They are marked **TELL THE LEAD**.
- Nothing was pushed and nothing ran on the Mac mini.

**Where and how this ran.**

- Worktree `st-b5-karp-checker`, branch `b5-karp-checker` from `b5-int3` b55f7472.
- Everything ran locally, as my task required: the Mac mini was unavailable. One Electron instance at a time under the
  shared SLOTS=3 lock.
- The machine's load:
  - first build and takeover: load average 230–760;
  - this round: 20–225.

**How the work got here.**

- **The first builder (2026-10-10)** wrote the checker, the self-test box, the kit, the stage-state hook, the README
  section and the builders' brief.
- **A takeover (2026-10-16 morning)** finished it:
  - #16's walks;
  - the kit's tag regression;
  - four checker defects;
  - the all-stages table.
- **Review 1 (on 4387bed6, verdict REDO)** found that small variants of the planted faults passed every check. It also
  found that #16's own kid made shortcuts no check reported.
- **This is fix round 1.** §0 answers each issue with what I did and the proof. The rest of the report is the full
  updated report; **[r1]** marks what this round changed.

## 0. Review 1 (verdict REDO): each issue, what I did, the proof

Review 1 ran on 4387bed6. This round (fix round 1) runs from ef762c16 to the last commit listed in §5. Every run below
is local (my task says the Mac mini is unavailable), one Electron at a time under SLOTS=3, at load average 40–225.
The review's verdict rested on issue 1: small changes to the planted faults passed every check. Each issue is now
fixed and proved.

### Issue 1 (blocker): #7 missed rising jumps across open air. FIXED

**What changed** (karp-check-page.js, #7d / #16 / #7a):

- **A rising-gap probe.** It takes rim node pairs 1.2–3.0 m apart (flat) where the far one is 0.6–1.8 m higher, with
  open air between them, a clear waist line, and no 6 m walk joining them. This is the reviewer's own definition.
  - #16's kid tries each one that matters, with the five-timing trial. One matters when it gains more than 10 m, or
    when it starts outside a Gate's 15 m ring and lands inside it.
  - A made one gaining more than 10 m is a #7d FAIL (`riseGap`).
- **Jumps onto ground the field doesn't hold**, level or rising. D2 used to cover only the hop into a neighbouring
  cell. Now it also covers a jump from a field rim node to an off-field rim node:
  - 1.2–3.8 m flat, from 3.4 m down to 1.8 m up, across a real gap (somewhere no floor within 1 m below the lower end:
    D21) and with a clear waist line;
  - tried when its best exit is more than 10 m nearer a Gate, or when it has an exit inside a ring it entered from
    outside.
- **An off-field top now has more exits.** Besides nav's own edges, stepping or dropping off its edge counts: onto field
  floor up to 2 cells out and 0.3–3.4 m lower, open above, with a clear waist line.
  - H2p needed this. Its 1.0 m landing sits in a 1 m strip, where nav has no node beside the ledge because a body
    doesn't fit against it. So the landing had no nav edge off it at all, yet a kid just walks off.
- **#7a counts every move #16's kid makes from outside a Gate's 15 m ring to inside it as an entrance:** made high hops,
  long gaps, rising gaps, and moves onto off-field ground.
  - Each move has its own line of sight, from the spawn deck's edge (1.5 m up) to 1 m above where it lands, or to any
    exit it has inside the ring.
  - A move joins the entrance with a graph crossing nearest it (within 3 m). It never chains two entrances into one,
    and it is never "seen" through that entrance's walk crossings (D22).
- **The gain of a one-way move is measured in its own direction:** high hops, long gaps and rising gaps now use
  D(from) − D(to) for the team it helps.
  - H2q's "long gap" back out of the ring took the carrier 14.8 m further from the Gate. It was a find only because of
    |ΔD|. This is the "accident" the reviewer named, and it is gone (x7rq below now lists only its riseGaps).
  - The static probes keep SPEC's |ΔD|.

**Proof:**

- **Self-test.** The reviewer's three faults are now cases that must FAIL #7 for their own reason. All three PASS:
  in the 48/48 run, again after the direction change, and again on the final code (the 8 entrance cases):

  | case | the reviewer's fault | before (review 1) | now |
  |---|---|---|---|
  | x7r | H2p: a 2.0 m moat in front of a 1.0 m landing just inside the ring, off the field, behind f7's screen | every check OK | FAIL #7: "(a) team 0: an entrance at (-14.5, 47.5) [jump onto off-field ground] not seen from the spawn deck" (and team 1's mirror); (d) 8 offGap finds, 10.1–11.1 m |
  | x7rb | H2bp: a 1.3 m moat in front of a 1.5 m landing, off the field | every check OK | FAIL #7: the same "(a) … [jump onto off-field ground] not seen"; (d) 8 offGap finds, 10.7 m |
  | x7rq | H2q: the same moat in front of an on-field landing with a ramp into the ring, screened | #7 failed only through the reverse long gap | FAIL #7: "(a) team 0: an entrance at (-14.5, 47.5) [rising gap] not seen from the spawn deck"; (d) 4 riseGap finds, 10.8–11.8 m, and no longGap |

- **Real stages:** MAP=all, §2.3, on the final code. Every rising-gap find is a move #16's kid really made, gaining
  more than 10 m:

  | stage | rising-gap finds (made) | example: the review's own where it gave one |
  |---|---|---|
  | halyard | 10 | (−5.5, −0.74, −37.5) → (−4.5, 0, −35.5), 19.0 m |
  | terraces | 27 | (11.5, 1.2, −44.5) → (8.5, 2.4, −44.5), 24.7 m |
  | craters | 10 | (1.5, 2.12, −56.5) → (3.5, 3, −58.5), 19.8 m |
  | kelpline (and Cargo) | 5 | (−12.5, 1.04, −39.5) → (−15.5, 2.6, −39.5), 11.3 m |
  | treehills | 20 | (none from the review) |
  | calamari | 8 | (none from the review) |
  | spirhalite | 4 | (none from the review) |
  | nantai | 2 | (none from the review) |
  | lockgate | 0 | its 2 worth trying are not made; the review found its top four not made too |

  - Each find is flagged, and on halyard and lockgate pictured.
  - Jumps onto off-field ground across a real gap add more finds:
    - halyard 255, almost all across the slips onto the moored boats (`halyard-flag-22.jpg`: a yacht's deck bridges
      quay and pontoon);
    - kelpline 20, terraces 14;
    - craters 4, spirhalite 3;
    - lockgate 4: the boat frame on blocks by the warehouse wall, `lockgate-flag-6.jpg`.
  - Kid moves into a ring are now entrances:
    - halyard has 6 a side: a long gap into the ring at (±4.5, ±41.5) is new, and a rising gap joins the deck entrance;
    - kelpline's long gap into its ring is unseen from the deck;
    - calamari goes from 5 to 6 a side. The old grouping had chained two entrances together through the off-hop's exit
      crossings (D22).

**For the lead (WP0):** the clean fix belongs in the field itself. A rising-gap edge in karpField (rise 0.6–1.8 m over
1.2–3.0 m, proved by #16 like the hop and gap edges) would let the field *read* these moves too. Until then a carrier who
makes one reads the far side's D at once, which the continuity clamp may reject. Jumps onto off-field tops (D2) are the
same gap. **TELL THE LEAD.**

### Issue 2 (major): inkable steps of 1.3–1.8 m counted as climb-only. FIXED

**What changed:**

- `climbHops` now runs before any route is searched. It takes every nav climb edge of at most 1.8 m between field nodes
  that passes the hop rule's own geometry tests: the waist line over the top, nothing overhead at the foot, and the head
  across.
- #16's kid tries each one with the five-timing trial. Its jump is pressed before the wall point nav recorded for that
  climb.
- A made one counts as a hop, not a climb, in every no-climb search:
  - #4 and #5's routes;
  - #7b, which also no longer lists it as a climb shortcut;
  - #9's enemy reach;
  - #13's apron route;
  - #16's walks, which take its trial when the walking kid misses it;
  - the #11 carry walk's re-plans.
- The masks carry over to the carry walk's fresh match.
- #16's text and JSON report "climbs of ≤ 1.8 m tried as hops: made of tried".
- The field's D is unchanged: a climb edge and a hop edge have the same length (flat + rise).
- With PHYS=0 the geometry alone decides, and the text says it is unproven.

**Proof:**

- **w4, the reviewer's W4.** The weir platform is a 1.5 m inkable box with its ramps gone. It is a `notFail` case: #4
  and #9 must not fail, and #16 must report the climbs it hopped.
  - Before: #4 failed "no climb-free carrier route" and #9 failed "a plateau of 28 m² … the enemy only by climbing".
  - Now: PASS. #4 OK, #9 only WARN, #5 OK at 27.5 / 29.2 m, #15 OK, and "climbs of ≤ 1.8 m tried as hops: 92 of 92
    made" (144 trials).
- **Real stages** (MAP=all, climbs of ≤ 1.8 m hopped, made of tried):

  | stage | climbs hopped (made of tried) |
  |---|---|
  | terraces | 408 of 410 |
  | nantai | 371 of 371 |
  | spirhalite | 284 of 284 |
  | craters | 224 of 226 |
  | calamari | 138 of 138 |
  | treehills | 91 of 91 |
  | lockgate | 86 of 94 |
  | saltpan | 58 of 58 |
  | kelpline | 52 of 52 |
  | halyard | 24 of 24 |
  | tidewater | 11 of 11 |

  - The review counted how many of these had no hop edge nearby: lockgate 77 of 94, kelpline 26 of 52, craters 149 of
    228, terraces 226 of 410, halyard 2 of 24. They are now hops wherever the kid makes them.
  - Visible effect: **spirhalite's #9 no longer FAILs.** The last report's table listed #9 among its FAILs. Now 0 of its
    47 plateaus is climb-only (a WARN only), which fits its 284 hopped climbs. This is an inference: I didn't re-run the
    old code.
  - lockgate's 14 m² plateau at (±12.9, 2.5, ±29.4) stays climb-only: the climbs onto it are not among those a kid
    hops.

**For the lead (WP0):** karpField's `_hasNav` skips the hop edge whenever any nav edge joins the pair, climb edges
included. Adding the hop edge there too (or not counting a climb as "joined") would make the field's own graph say what
the checker now says. **TELL THE LEAD.**

### Issue 3 (major): #15 sampled points and missed thin solids. FIXED

**What changed:** #15 is now exact. Each solid block is clipped to 0.3–3.6 m above the weir's floor and projected down.
Its corners inside that band, plus its edges' crossings of the band's two planes, form a convex hull, and #15 measures
the hull's distance from the weir's axis. Under 3.0 m FAILs and names the block with its distance. The weir's own posts
and sill are still excepted.

**Proof:**

- x15t, the reviewer's T1 (a 0.2 × 0.2 × 3 m lamp post 2.2 m from the weir's centre), was "clear, 6/8" before. It now
  FAILs with "team 0 weir 1: solid within 3 m: kcheck-lamp (2.1 m)": the post's nearest corner is 2.1 m out.
- f15 (a pillar 2 m out) still FAILs.
- The clean box still passes #15 (6/8).

### Issue 4 (minor): kit posts could float off a ledge. FIXED (as a check)

**What changed:** #1 now checks every kit piece that stands on the floor: each weir and Gate post's footing
(`-base`), the plinth and its rim, the sill, and each sign's foot.

- It samples 3 × 3 points at ±80 % of the piece's footprint. Each point needs floor (any non-kit solid top) at most
  0.1 m below the piece's bottom. Buried is fine.
- A piece that fails is listed and flagged with its place, for both teams.

I did not make the kit build each post at its own floor height. A post sunk silently to the floor below a ledge would
hide a bad weir spot, which the builder must move instead (D25).

**Proof:**

- x1, the reviewer's W5 (the weir at [2, 1.2, 28]), had "FAILING none". It now FAILs with "2 kit piece(s) not resting on
  floor: karp-weir-base at [4.7,1.33,28] (9/9 points 1.15 m above it)" and the mirror.
- The clean box still passes #1.
- In the self-test it also caught a real knock-on: f5's corridor weir at x −17.5 now stands a post past the deck's edge.

### Issue 5 (minor): the carrierBlock glyph drew on an opaque cream square. FIXED

**What changed:** `drawNoCarp` reads `'bg' in opts ? opts.bg : '#efe9dc'`. The shimmer's `{ bg: null }` is now
transparent, and the sign boards keep their cream (ef762c16).

**Proof:** I re-took `out/kit-carrierblock.jpg` and looked at it next to the old one. The crossed-out carp now floats on
the shimmer walls with no cream squares, and the shimmer bands still show.

### Issue 6 (minor): the top-down's flags couldn't be decoded. FIXED

**What changed:**

- **One numbering** (`numberFlags`): every FAIL or WARN check's flags with a place, in check order. A check's flags of
  one kind (the text without its numbers) within 2 m of each other are one flag; its `also` counts the rest.
- **Where the numbers appear:**
  - the discs on the top-down;
  - a key panel under the map (number, check, what, where; three columns; every flag);
  - the `-flag-<n>.jpg` pictures;
  - the JSON's `flags`;
  - the console, which lists every flag after the RESULT line, #11's drop and carry places included.
- **Discs no longer overlap:** each moves round its place and outward until it is clear.
- **Every #7d find is flagged now**, the moves #16's kid made included. Finds of one probe within 3 m are one flag
  ("7d riseGap ×4: gain 10.2–11.3 m").
- **Flag pictures:** there is now a `-flag-<n>.jpg` for every #7 flag (SPEC §4.4), then the first FLAGSHOTS others, at
  most 40.
- **No clipped rings:** the camera bounds are padded to hold both Gates' 15 m rings.
- **Fainter ticks:** made hop and gap ticks are drawn faint, so FAILs stand out.

**Proof:**

- `out/self-x7h-karp-top.jpg`: 8 flags, each decodable from the key ("#7d highHop ×2: gain 48.3–49.3 m @ (17.5,
  -48.5)").
- `out/halyard-karp-top.jpg`: 49 flags with a 3-column key; the riseGap flags (10, 12) are their own entries now
  (`69abedc0`: only flags of one kind merge).
- `out/lockgate-karp-top.jpg`: 22 flags.
- `out/kelpline-karp-top.jpg`: 50 flags.
- Craters' ring is no longer clipped (`out/craters-karp-top.jpg`).
- Every picture is under 290 KB (`deef4377`: the size drops when the quality floor isn't enough).
- The console lists each flag as `  12 #7  (x, y, z): what`.

### Issue 7 (minor): the self-test checked only one sub-rule per check. FIXED

**What changed:** 23 new cases, 48 in all. Each one plants a fault the old set never planted and must FAIL its check
for its own reason, matched by an `expect` pattern on the check's text. W4 is a `notFail` case.

| sub-rule (the reviewer's list) | case |
|---|---|
| #7 (a) an entrance count outside 2–5 | x7a: two more ring openings → "6 entrances … (2–5)" |
| #7 (c) a drop into the ring | x7c: a 3 m deck outside a west opening → "(c) 12 drop(s) > 2.5 m into a Gate's ring" |
| #7d tallWall | x7t: a 5.8 m inkable platform up a long ramp → "tallWall … 18.6 m" |
| #7d longDrop | x7l: a 4 m platform's far edge → "longDrop … 10.6 m" |
| #7d highHop | x7h: a 1.83 m ledge in a ring opening → "highHop … 49.3 m" |
| #7d longGap | x7g: the GAP's far platform 3.6 m off → "longGap … 10.2 m" |
| #7 rising gaps / off-field jumps (H2p, H2bp, H2q) | x7r, x7rb, x7rq (issue 1) |
| #9 a zone touching a weir / the Gate / a route | x9d / x9g / x9e |
| #9 a wide entrance with an end unsigned | x9f: "a 10 m entrance … needs a sign within 2 m of each end" |
| #13 fewer than 3 ways off the deck | x13: "1 way(s) off (≥ 3)" |
| #14 floor coverage | x14: "ring 4.5–10 m 65.5 % floor (≥ 70)" |
| #3 weir → Gate under 25 m | x3: "weir 1 → Gate 10.1 m (≥ 25 m and ≥ 45 % of L …)" |
| #5 route 2 over 1.6 × route 1 | x5b: "route 2 58.4 m = 2.23 × route 1 (≤ 1.6)" |
| #15 an approach that can't see the weir | x15a: a chicane in the alley → "not seen from the attackers' approach" |
| #15 thin solids (T1) | x15t (issue 3) |
| #11 a failing carry walk | x11: f16w's slot on route 1 → "16 stuck episode(s)", no plant; x11r: noRetreat over each whole half → "retreat ×3 on at null m" |
| W4 (must not fail #4 / #9), W5 | w4, x1 |

**Proof:** `KARP_SELFTEST=1`: **48/48, no console errors**, twice:

- 16.5 min at load 40–100, on 248405e8;
- 14 min, on 69abedc0, after the direction change (D23), the real-gap rule (D21) and the flag kinds.

The #7a grouping fix (d5795858) re-ran its 8 entrance cases 8/8 (§2.1).

Three cases needed redesigning before they planted cleanly. Each was caught because its pattern didn't match, which is
what the patterns are for:

- x5b's first 6 m gap let two routes 3 m apart through;
- x7h's first platform was reached by hops onto its own ramp's side;
- x11r's first noRetreat missed the stretch near the Gate, so it failed by a 0.02 m tolerance, not by its fault.

### Issue 8 (minor): docs and the job file were stale about the Mac mini. FIXED

**What changed:**

- karp-stages/BUILDER.md (rows 3 and 5) and tools/botlab/README.md (the regression set) now point at COMMON.md's runner
  protocol instead of "while the Mac mini is away". They also describe the new #1 / #4 / #7 / #15 rules and the
  numbered flags.
- JOB-1.sh is split in two:
  - JOB-1: the field's load budget and the self-test, with a 1.5 h watchdog;
  - JOB-2 (`# after: JOB-1`): MAP=all on its own, with a 2.5 h watchdog, inside the runner's 3 h cap. It took 20 min
    here at load 20–35.
- COMMON.md's uncommitted edit (the Mac mini back as of 10-16) is still not mine. I left it as I found it, because my
  task says the Mac mini is unavailable.

## 1. What was built

### 1.1 `tools/botlab/bazookarp-check.cjs`: the checker (SPEC §4.4)

```
MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs      one stage
MAP=all  …   every shipped stage (the twelve and Cargo) in one go, then the table   (WIP=1 adds bluestone, aquarium, caldera)
MAPS=a,b …   some stages
KARP_SELFTEST=1 … the self-test on karpbox (CASES=clean,f7,… picks cases)
PROBE='[x,y,z,x,y,z]' MAP=<id> …   one move traced: #16's kid frame by frame on the node pair nearest those points, and
                                   the blocks (pieces, prop colliders) where each trial stopped
PROBE='walk:<text>' MAP=<id> …     one of #16's walks (the one whose name holds <text>) again, every frame, with its path
env: OUT=dir (default .botlab/karp-check)   KARP_DEF='{…}' trial data   SHOTS=0 / CARRY=0 / PHYS=0 (quick; a RESULT ok
     needs all three)   DEVSTAGE=1 (Cargo; MAP=all adds ?devstage for Cargo itself)   ERA=1|2|3 / LAVA=low|high /
     KSTATE=<key> one stage state, else every state in turn   FLAGSHOTS=n   KITSHOTS=1 (the kit up close)
```

Always run it with `BOTLAB_OUT=…/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=…`.

**What it prints and writes:**

- One line per check: `OK`, `WARN`, `FAIL` or `SKIP`, with its numbers.
- Then the result line:

  ```
  RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=… walks=<routes ok/n>+<entrances ok/n> [FAIL=… SKIP=…]
  ```

- **New this round:** the numbered flags. Every flagged place, in the same numbering as the top-down's discs and key,
  the `-flag-<n>.jpg` pictures and the JSON's `flags`.
- `<id>-karp.json`: every check's numbers and flagged places, the flags, the walks, the carry walks and the drop
  coverage.
- The pictures.

`RESULT ok` needs all sixteen checks OK or WARN, with the physical proof and the carry walk run. One stage takes 40 s –
4 min here.

**Where the checks run:** in the game page (`tools/botlab/karp-check-page.js`), on the engine's own Carp Field
(`src/game/karpField.js`) and the level's own physics:

- the carrier graph is nav's valid nodes minus the spawn zones and carrierBlock volumes;
- its edges are nav's walk, jump, drop and climb edges plus the field's hop and gap edges.

Every team-dependent check runs for both teams. The data describes Alpha's attack; Bravo's attack is the mirror.

**"No climbs" (#4, #5, #7b, #9, #13, #16's walks, the carry walk) means no squid climb.** A climb edge of at most 1.8 m
that #16's kid hops counts as a hop (`climbHops`, review 1).

**How each check judges.** The numbers are SPEC §4.4 / §9.1's. A \* marks my reading where the spec left a gap (§3).
**[r1]** marks what this round changed.

| # | check | judged |
|---|---|---|
| 1 | Data | FAIL any of: the Pond > 0.3 m off (0, 0); the Pond, any weir, either Gate or any sign (both teams) with no floor within 0.3 m under it, on a `roof` block, or inside a spawn zone (barrier + 0.6 m, above the pad − 1 m); no carrier-graph node under the Pond; a kit post / sign block (`karp-weir*`, `karp-gatepost*`, `karp-sign*`) that is not `roof` or takes ink.\* **[r1]** A kit piece that stands on the floor (each post's footing, the Gate's plinth and rim, the sill, each sign's foot) with floor more than 0.1 m below its bottom at any of 3 × 3 points over its footprint, both teams, each flagged.\* (The sill and the plinth are floor and take ink.) |
| 2 | Field | FAIL any of: \|L_A − L_B\| > 2 %; a hole (a node reached on the carrier graph from the Pond with D = ∞ for a team, unless the data waives it\*); \|fieldAt − D\| > 0.05 m at any node; any sweep point (¼, ½, ¾ of every walk edge, ±0.3 m across where the waist line is clear) more than 2.5 m below its proven lower bound. Reported: the hop / gap edges added, the largest gain across one, the points > 1.5 m low. The halfway line is drawn. |
| 3 | Distances and counts | FAIL any of: a weir's count outside 45–60 (40–55 % of L); a weir with no field reading at all; weir → Gate < 25 m or < 45 % of L; two weirs > 2 counts apart or < 12 m apart; 0 or > 2 weirs; L outside 55–85 m. Reported: Pond → weir → Gate along the field and on route 1; the Gate's distance from its pad; the lowest count within 3 m of each weir (reported, not judged: D1). |
| 4 | Reachability | FAIL: no carrier route for Pond → each weir or weir → Gate, either team, without squid climbs, spawn zones, the team's own free zones or carrierBlock. |
| 5 | Two routes | Route 1 is the shortest no-climb route. Route 2 is the shortest one avoiding every node within 2.5 m (3D\*) of route 1, except within 6 m of either end. Route 3 (squid climbs allowed, off both) is reported. FAIL: a leg with no route at all, no route 2, or route 2 > 1.6 × route 1, for every weir both ways, both teams. With two weirs, also FAIL when: their routes 1 meet (≤ 2.5 m apart outside 6 m of the ends); either route 1 passes within 4 m of the other weir; or the weirs are < 12 m apart. `routes` hints are measured and named. |
| 6 | Carry times | FAIL: Pond → Gate (L) outside 11.5–18 s at 4.8 m/s. Reported per leg via each weir, walking and swimming (9.44 m/s). |
| 7 | No shortcut into a base | **(a)** Every carrier-graph edge crossing into the Gate's 15 m ring, grouped single-linkage within 3 m. Also counted: a roof-less car's stop in the ring, and **[r1]** every move #16's kid really makes from outside the ring to inside it (a high hop, long gap or rising gap beyond the rules; a hop or jump onto off-field ground with an exit in the ring), at its landing. FAIL: outside 2–5 entrances, or an entrance none of whose crossings is seen from 1.5 m above any edge node of the defenders' spawn deck (to 1 m above the crossing); **[r1]** a kid's move into the ring needs its own line of sight (to its landing or an exit of it in the ring). **(b)** The field without squid climbs vs with, from every halfway-line node. FAIL: a with-climbs path saving > 20 % (its climb edges are listed; a climb the kid hops is not one). **(c)** FAIL: a drop or down-gap edge of > 2.5 m ending inside a ring. **(d)** The probes; each find is flagged (finds of one probe within 3 m are one flag) and pictured. FAIL when the find gains > 10 m; WARN when one end is off the field (a hiding place, D3). The static probes measure \|ΔD\| as SPEC words it: low gaps (a 0.35 m squid tube 0.3 m up, between nodes ≤ 3 m apart not joined by ≤ 6 m of walking); tall walls (nav's climb scan over 5.5 m); long drops (> 3.4 m with open air; signed). The moves #16's kid really makes are measured in their own direction **[r1]**: high hops (1.8–2.1 m) and long gaps (3.0–3.8 m); **[r1] rising gaps** (rim pairs 1.2–3.0 m apart, 0.6–1.8 m up, open air, no 6 m walk; tried when worth > 10 m or into a ring); hops onto off-field ground (D2) and **[r1] jumps onto off-field ground across a real gap** (1.2–3.8 m, 3.4 m down to 1.8 m up; tried when an exit is worth > 10 m or in a ring), whose gain is to their best exit (nav's edges off that ground and **[r1]** stepping off its edge). A find within 2 m of a `waive` entry of that check is waived.\* |
| 8 | Gate placement | FAIL any of: not 12–20 m from the defending pad (horizontal); more than 0.2 m above the pad; outside ±40° of the pad → Pond line; not seen from the deck; inside any free zone. |
| 9 | High ground and free zones | **Plateaus:** connected carrier-graph nodes ≥ 1.4 m above the lowest node within 3 m (≥ 2 nodes\*), on the half most of their nodes are on. FAIL a plateau the owner's carrier reaches (any carrier route from the Pond) and the enemy kid reaches only by a squid climb (no no-climb route from the halfway line, one with), unless every node is inside the owner's zones. **Zone entrances:** every carrier-graph edge (climbs included) into a zone's polygon and band; the crossings (edge midpoints\*) chained within 3 m. FAIL an entrance with no sign (of any of the owner's zones\*) within 2 m of a crossing, or one wider than 8 m without a sign within 2 m of each end (its two farthest crossings). **Also FAIL:** a zone node with D_owner ≤ D_other (both finite\*); a zone touching a weir trigger, a Gate trigger, or a route 1 / route 2 node of any leg; a `noRetreat` polygon within 3 m of a plateau or a zone. **WARN:** enemy arrival (walk 6 m/s, climb 7.5) > 2 × the owner's (from its deck), or a single entrance (plateaus ≥ 4 m²\*). |
| 10 | Retreat sanity | Route 1 and route 2 from each team's own Gate area to the Pond, on its own half. FAIL a dip of P (= L − D) below its running best of > 6 m outside `noRetreat`. Across every state switch the carrier's mark resets (§3.3), so the dip is 0 by rule; the raw change of P a still carrier would see on the routes is reported. |
| 11 | Carry walk | A fresh match per team, bots out, a scripted carrier (WASD + space): it picks the Bazookarp up at the Pond, walks route 1 to weir 1 (re-planning on the carrier graph after 2.5 s without progress: a stuck episode, logged with its place and edge, **[r1]** and flagged), plants, re-pops and walks to the Gate. Then four more walks: a retreat on its own half (×3 on at 8 m back, off at 3 m, measured from its own `mark`); a visit to its own zone (×3); a fall into the water from the wet node nearest the Pond on each half (own half → the Pond; enemy half → dropped by the last footing on that half, ≤ 12 m; up to 8 edges tried when a railing stops the fall); a splat on the narrowest walk near each weir (must rest on `wide` floor). **Drop coverage:** the field's drop spot at every 4th node of route 1 and route 2 of every leg, and at every node inside each zone (its enemy carrying). Each must land on the carrier's half, ≤ 12 m away except inside an enemy zone, never at the Pond. FAIL any of these. |
| 12 | Variant | FAIL any of: a piece in the Bazookarp build that Turf War lacks and that is neither the kit nor tagged `onlyIn: 'bazookarp'`; a Turf War piece missing without `notIn: 'bazookarp'`; no `assets/lightmaps/<id>.bazookarp.json`, or a stale one (the level applied none). A test stage (karpbox) is never baked. |
| 13 | Deep spawns | **Ways off the deck** (a level flood from the pad, ≤ 16 m): nav edges leaving it, chained within 3 m; FAIL < 3. **The apron:** route 1 from the deck's edge to the Gate in front of it; FAIL < 2 solid static blocks (≥ 0.45 m across, prop colliders count, not the kit, not the deck's own blocks) rising ≥ 1.2 m above a route node within 4 m of it. |
| 14 | The Pond | FAIL: < 70 % of the 4.5–10 m ring is floor (nav cells at any level within ±5 m of the Pond\*), or the shell's centre (1.3 m up) is seen from fewer than 6 of 8 points 7 m out (1.5 m above their floor). |
| 15 | Weir room | FAIL any of: **[r1]** a solid block nearer than 3.0 m to the weir's axis between 0.3 and 3.6 m above its floor, measured exactly (the block's box clipped to that band, projected down: its hull's distance; any weir's own posts and sill excepted; the block and its distance named); no route to look along; its centre not seen from 1.5 m above route 1's node 8 m before it or 8 m after it; seen from fewer than 3 of 8 points 7 m out. |
| 16 | Proved physically | **(i) The edges.** Tried: every hop and gap edge the field added; every high-hop and long-gap candidate of #7d; **[r1]** the rising gaps and jumps onto off-field ground that can matter; every hop onto off-field ground; and **[r1]**, before any route is searched, every climb edge of at most 1.8 m that passes the hop rule's tests (`climbHops`: a made one counts as a hop in every no-climb search). A kid with `carry` set (4.8 m/s, the carrier's jump, both spawn barriers, carrierBlock) is stepped through `actor.update` at 1/60 s, alone (everyone else parked). It starts 1.5 m and 3 m before the low end, shortened toward it until it stands on floor (D11). It faces the far end and steers to it; a move down is first tried as a run-off; jump is pressed 0.2 / 0.5 / 0.8 / 1.1 / 1.4 m before the edge (a hop: its riser; a climb hop: the wall nav found; a gap: the rim). Made = grounded on the far node's floor within 0.5 m of it inside 2 s (or on that floor ≤ 3 m away with a clear waist line). **(ii) The walks.** The same kid walks every route 1 and route 2 of every leg, both teams, and goes through every entrance into each Gate's ring: one crossing per entrance with an 8 m run-up from the Pond side, then on to the Gate (squid climbs, rides and the moves proved apart excepted). It steers at the next node. It jumps on a jump, hop or climb-hop edge within 1.6 m of the node; on a walk edge only at a real riser (the floor 0.45 m ahead above the step-up, never a ramp's slope); at a rim; and after 0.8 s without progress. Standing on something right over its node, it heads for the next one. A grounded kid whose own node (the field's reading rule) is one of the next 8 path nodes has reached it. A hop, gap, climb-hop or nav jump edge it doesn't make on the way is decided by that edge's own five-timing trial (made: it is set down on the far node and goes on, counted). **FAIL:** an added edge never made (printed as `hopVeto` entries to paste, broken down by kind); a walk stuck 2.5 s, fallen off or out of time (its place is printed and drawn: ⊗). A walk stuck against a dynamic block (a parked mover) is reported, not judged. Made candidates beyond the rules go to #7d with their gain. |

**Pictures** (JPEG < 290 KB; the page encodes them):

- **`<id>-karp-top.jpg`**: the whole stage from above, Alpha attacking left → right. **[r1]** The camera bounds now
  hold both Gates' rings. It shows:
  - Alpha's count as a heat map, with dots every 10 counts, and the halfway line;
  - Alpha's routes Pond → weir and weir → Gate (route 2 dashed);
  - both Gates with their 15 m rings and entrance arrows (red = unseen); weirs as diamonds; the Pond and its burst
    ring;
  - the free zones hatched in the owner's ink, with their signs and entrances (green ring = signed, red X = not);
  - `noRetreat` / `carrierBlock` / `noRest` outlined; plateaus (red = FAIL);
  - hop / gap edges as ticks: made faint green **[r1]**, not made thick red. Moves made beyond the rules (high hops,
    long gaps, rising gaps, jumps onto off-field ground) are faint magenta, bold when they are a #7d find;
  - #16's failed walks as ⊗;
  - **[r1]** every flag as a numbered red disc on a leader (moved round its place until it covers no other), and
    **a key panel** under the map that lists every flag: its number, check, what it is and where.
- **The rest:**
  - `-pond`;
  - `-weir-<i>-approach` / `-defend` (from the farthest clear point 6–14 m back / on along the route, preferring open
    floor);
  - `-gate-approach`, `-gate-deck`, `-zone-<i>`, `-noretreat-<i>`;
  - **[r1]** `-flag-<n>`: one for every #7 flag, then the first FLAGSHOTS others, at most 40. The n is the flag's own
    number;
  - with `KITSHOTS=1`, the kit up close.

### 1.2 Stage states, generically

A stage module offers its field states through `R.karpStates() → [{ key, nodeOk(id), query }]`.
`G.match.stage.karpStates()` is new in `src/game/stageMods.js` (the first module offering any); it is the call the
engine already made. `query` is the page query of the module's own audit switch (`era=2`, `lava=high`).

- The checker lists the field's states. Without ERA / LAVA / KSTATE it checks each in turn, each on a page loaded with
  its `query`, so the world is in that state for the sight lines, the kid and the carry walk; the field is switched to
  it.
- `ERA=2` loads `?era=2` and checks the state keyed 2.
- docs/STAGE-MODS.md has the row, and T4 is marked served.

**Proof:** the self-test's `states` case. A test-only module, `tools/botlab/karp-check-states.js`, raises a wall 2.6 m
from the weir in its state `w` only. #15 passes in state 0 and FAILs in state `w`, built from `?kcstate=w`. karpbox's
own test-only state (`testStates`) is checked as a field state on the same page.

On this base `eras.js`, `lava.js` and `pipes.js` are 6-line placeholders that register nothing, so no shipped stage has
states yet.

### 1.3 The kit in final form (`src/world/bazookarp-kit.js`, `src/fx/karpKitFx.js`)

- **Weir:** two dressed stone posts, 5.4 m apart centre to centre across the walking direction. Each post is a 0.72 m
  footing (0.3 m high), a 0.5 m shaft, a dark band at 1.55–1.68 m and a 0.64 m capital: 2.4 m in all. Every part is
  `roof` and takes no ink. Between them is a 0.12 m stone sill for the curtain to fall onto; it is floor and takes ink.
  The shafts' inner faces are 2.45 m out, so the footings and capitals clear the shell's full 2.3 m swell at their
  heights.
- **Dragon Gate:** an octagonal plinth 3.4 m across the flats, 0.15 m high. It is built as mapkit's OCT in the Gate's
  own frame: a plus of slabs with its four corners a 0.05 m step, and no shared tops. Two posts stand 4.4 m apart: a
  0.8 m footing, a 0.6 m shaft, a gold band and a capital, 3.2 m in all. The posts are `roof` with no ink.
- **NO CARP sign:** a stone foot, a 0.15 m wooden post and a 0.75 × 0.5 m board facing the sign's yaw, 1.9 m tall in all;
  every part `roof`, no ink. `karpKitFx` puts the crossed-out carp over "NO CARP" in the owning team's ink on both faces of
  the board.
- **Tags:** each post's shaft and each sign's post carry the plain tag (`karp-weir`, `karp-gatepost`, `karp-sign`: one
  per post, as bazookarp-rules L7 counts them). The other parts are suffixed (`-base`, `-band`, `-cap`, `-foot`,
  `-board`).
- **carrierBlock shimmer** (`karpKitFx`): a faint wall on each polygon edge, from the volume's floor up 2.4 m. Diagonal
  bands drift upward, brightest at the floor, with the NO CARP glyph (a dark violet carp) mid-wall. Everyone sees it.
  **[r1]** The glyph is drawn on a transparent background again. `drawNoCarp` read `bg` with `??`, so the shimmer's
  `{ bg: null }` became the board's cream square.
- `karpKitFx` is its own module, built and cleared on `match:state` and animated in `onBeforeRender`, so WP2's rebuild of
  `bazookarpFx.js` doesn't collide with it.

Pictures (`out/`):

- `kit-weir.jpg`, `kit-weir-post.jpg`, `kit-gate.jpg`, `kit-sign.jpg`, and `kit-carrierblock.jpg` (**[r1]** re-taken:
  no cream squares) on karpbox;
- `halyard-kit-*.jpg` and `lockgate-kit-*.jpg` on the real stages.

The kit pieces read as dressed stone and wood in the game's chunky style, and every perchable top is `roof` with no ink.
The curtain and the Gate's ring are bazookarpFx's placeholders, WP2's to finish.

### 1.4 `karp-field.js` in the regression set; the builder's template

- `tools/botlab/README.md`: the checker, its self-test (with `notFail` cases), `PROBE=`, **[r1]** the moves a kid makes,
  the climbs it hops and the numbered flags. Its Bazookarp regression set:
  - karp-field.js on karpbox and every stage;
  - the rules, gun and loop tests when the engine moves;
  - the checker's self-test and per-stage runs;
  - check-maps and karp-layout-diff for the other modes.

  **[r1]** It now runs locally or as a job on the Mac mini's runner, per COMMON.md.
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`: the per-stage builder's brief, pointing at SPEC §9:
  - the eight deliverables of §9.2 and their format;
  - the checker's usage and what to fix per check;
  - waivers, stage states and the regressions;
  - the NOTE.md template.

  **[r1]** Its Mac mini rows (the bake, the bot matches) point at COMMON.md's runner protocol. It now covers #1's kit
  footings, the climbs a kid hops (#4), #7's moves and entrances, #15's exact room and the numbered flags.

## 2. Tests and results (all local)

### 2.1 The checker's self-test (karpbox): 48/48

`KARP_SELFTEST=1` runs every case below. Each planted fault must FAIL its own check, and the check's text must match the
case's `expect` pattern, so the fault is caught for the reason it plants and not by a knock-on. A `notFail` case must
leave its checks unfailed. The clean karpbox must pass every check, including the carry walk and #16's trials and walks.

**Result: 48/48, no console errors.**

- The full run took 16.5 min at load 40–100 and came before the last three checker changes (D21's real gap, D23's
  direction, the flag kinds).
- The cases those changes can touch re-ran afterwards: x7g, x7h, x7rq and f7 (4/4), then x7r, x7rb and f7 (3/3).
- **The final full run, on 69abedc0, was 48/48 with no console errors** (14 min, 17:33–17:47 at load ~20).
- Two changes came after it, and each was re-checked:
  - deef4377, the picture size, touches only the JPEG encoder. It was checked on kelpline and Cargo (MAPS=, no console
    errors, top-downs 289 / 265 KB).
  - d5795858, the #7a grouping of kid moves, could touch only cases with a kid's move into a ring. All of those
    (clean, f7, x7r, x7rb, x7rq, x7h, x7a, x7c) re-ran 8/8 on it, with no console errors.

| case | check | the fault | result | checks failing |
|---|---|---|---|---|
| clean | – | the clean box | PASS | (none) |
| f1 | #1 | a NO CARP sign standing in the spawn zone | PASS | #1 |
| f2 | #2 | a wall on Bravo's half only (a `single`): Alpha's walk 50 % longer | PASS | #2 #15 |
| f3 | #3 | the weir at 85 % of the way (count ≈ 15) | PASS | #3 #15 |
| f4 | #4 | the weir on a 3 m box only a climb reaches | PASS | #3 #4 #5 #9 #15 |
| f5 | #5 | the weir at the end of a 3 m dead-end corridor | PASS | #1 #3 #5 #15 (#1 is new: its west post stands past the deck's edge) |
| f6 | #6 | a third ring opening, straight in from the south: Pond → Gate ≈ 10 s | PASS | #3 #6 |
| f7 | #7 | a 1.5 m non-inkable ledge through the ring wall that only a hop climbs, screened from the deck | PASS | #7 |
| f8 | #8 | the Gate 45° off the pad → Pond line | PASS | #3 #5 #6 #8 |
| f9 | #9 | a free-zone entrance with no sign | PASS | #9 |
| f10 | #10 | low walls either side of the Pond: the own-half route walks back | PASS | #10 |
| f11 | #11 | a noRest polygon over 26 m of the routes | PASS | #11 |
| f12 | #12 | a crate tagged notIn: 'turf' | PASS | #12 |
| f13 | #13 | the apron's crates gone | PASS | #13 |
| f14 | #14 | two 3 m walls 5.5 m out from the Pond: seen from 3 of 8 | PASS | #14 |
| f15 | #15 | a pillar 2 m from the weir | PASS | #15 |
| f16 | #16 | an awning over the flank lane's 1.5 m step: the field adds the hop, no kid makes it | PASS | #16 |
| f16w | #16 | a thin fence's 0.5 m slot on route 1: the graph walks through, no body fits | PASS | #16 |
| x5 | #5 | two weirs 8 m apart | PASS | #3 #5 #15 |
| x7b | #7 | a climb shortcut (an inkable stretch of ring wall, the opening far round) | PASS | #3 #5 #6 #7 #9 #10 |
| x7d | #7 | a squid-only gap (0.7 m headroom) through the ring wall | PASS | #7 |
| x9a | #9 | a climb-only 3 m plateau with a zone over half of it | PASS | #9 |
| x9b | #9 | a noRetreat polygon over the spawn deck's zone | PASS | #9 |
| states | #15 | a stage module's state `w` (its world on ?kcstate=w) raises a wall 2.6 m from the weir | PASS | #15 in `w` only |
| x9c | #9 | a free zone poking 2 m over the halfway line | PASS | #9 |
| **x7r** | #7 | **H2p** (review 1): a 2.0 m moat, a 1.0 m landing just inside the ring off the field, f7's screen | PASS | #7 |
| **x7rb** | #7 | **H2bp**: a 1.3 m moat, a 1.5 m landing off the field | PASS | #7 |
| **x7rq** | #7 | **H2q**: the moat in front of an on-field landing with a ramp into the ring, screened (a rising gap) | PASS | #7 |
| **x7a** | #7a | two more ring openings on the deck side: 6 entrances | PASS | #7 |
| **x7c** | #7c | a 3 m deck outside a west opening, up a ramp: 3 m drops into the ring | PASS | #7 |
| **x7t** | #7d | a 5.8 m inkable platform up a long ramp (tallWall) | PASS | #7 |
| **x7l** | #7d | a 4 m platform up a long ramp (longDrop) | PASS | #7 |
| **x7h** | #7d | a 1.83 m ledge in a ring opening, a ramp into the ring, the SW opening closed (highHop) | PASS | #5 #7 |
| **x7g** | #7d | the GAP's far platform 1 m on and 0.5 m down: 3.6 m of air (longGap) | PASS | #7 |
| **x3** | #3 | the weir past its platform, 13 m from the ring (weir → Gate 10 m) | PASS | #3 #15 |
| **x5b** | #5 | a wall across the deck with a 3 m gap on route 1: route 2 round by the flank lane (2.23 ×) | PASS | #5 |
| **x9d** | #9 | a free zone over the weir's platform | PASS | #9 #15 |
| **x9e** | #9 | a free zone on the floor across the Pond → weir routes | PASS | #9 |
| **x9f** | #9 | an open-floor zone signed at one corner only: a 10 m entrance, an end unsigned | PASS | #9 |
| **x9g** | #9 | a free zone over the Gate | PASS | #8 #9 |
| **x13** | #13 | two of the parapet's three openings closed: 1 way off | PASS | #13 |
| **x14** | #14 | open water x 3…14, z 0…10 beside the Pond (mirrored): 65.5 % floor | PASS | #14 |
| **x15t** | #15 | **T1**: a 0.2 m lamp post 2.2 m from the weir (2.1 m to its corner) | PASS | #15 |
| **x15a** | #15 | the weir in the alley behind a chicane: its approach can't see it | PASS | #3 #5 #15 |
| **x1** | #1 | **W5**: the weir at x 2 on its 8 m platform: a post off the edge | PASS | #1 |
| **x11** | #11 | f16w's slot on route 1: the scripted carrier sticks (16 episodes), no plant | PASS | #11 |
| **x11r** | #11 | a noRetreat over each whole half: "retreat ×3 on at null m" | PASS | #9 #11 |
| **w4** | #4 #9 must NOT fail | **W4**: the weir's platform a 1.5 m inkable box, no ramps (92 of 92 climbs hopped) | PASS | (none) |

The clean box is unchanged:

- L 61.58 / 61.45 m and weir count 60;
- 18 hop and 24 gap edges, all made;
- walks 8/8 routes and 8/8 entrances;
- 8 rising-gap candidates, none worth trying;
- the carry knocks out both ways (weir 5.9 + Gate 7.7 s, and 5.7 + 7.5 s), stuck 0;
- retreat ×3 on at 8.22 m, off at 2.91 m;
- 250 drop splats fine.

Pictures (`out/`):

- `self-clean-*` (the clean set);
- the top-downs of the new cases: `self-x7r`, `x7rb`, `x7rq`, `x7h`, `x7a`, `x7c`, `x7t`, `x7l`, `x7g`, `x15t`, `x1`,
  `w4`, `x9f` and `x11`;
- `selftest.json`.

### 2.2 The honest report: halyard's and lockgate's first-cut data (this round's code)

Both still fail, as expected.

**What changed since the last report:**

- #7 now sees rising gaps and jumps onto off-field ground, measures one-way moves in their own direction, and counts
  the kid's moves into a ring as entrances;
- the climbs a kid hops count as hops;
- the flags are numbered.

Everything else is as before. `out/halyard-*`, `out/lockgate-*` hold the full sets (a `-flag-<n>` for every #7 flag)
and the JSON.

**Halyard** (first cut: weir at (−8, 27.5), Gate at (0, 52.5), a spawn-deck zone with two signs). L 54.8 / 54.7 m.
FAIL #3 #5 #6 #7 #9 #10 #12 #13 #14 #16.

- **#3 / #6, L and the weir:** L is 54.8 m (< 55) and weir → Gate is 24.4 m (< 25 m, and < 45 % of L). The weir count
  is 45, the band's edge. Pond → Gate takes 11.4 s walking (< 11.5). Lengthen the Gate's approach (§9.3).
- **#5:** Pond → weir route 2 is 51.2 m = 1.81 × route 1.
- **#7:**
  - (a) **6 entrances a side (now > 5):**
    - a **long gap** a kid jumps from outside the ring into it at (±4.5, ±41.5) is a new entrance (seen);
    - a **rising gap** joins the deck-side entrance at (∓10.5, ±62).
  - (c) 20 drops of 3.2 m off the spawn deck's edge into the ring (D4).
  - (d) **284 finds over 10 m:**
    - **255 jumps onto off-field ground**, almost all of them across the slips onto the **moored boats**. These are
      flags 21 / 22 at (±19.5, ±34.5), 121 and 134 pairs, gaining 10.1–20 m: a carrier jumps from the quay onto a
      yacht's deck, walks along it and steps off onto the pontoon. `halyard-flag-22.jpg` shows the yacht. The boats'
      decks are walkable colliders the field doesn't hold, so they want `roof` tops or a carrierBlock.
    - 11 hops onto off-field tops at x ±22.5…24, one gaining 41.8 m.
    - **10 rising gaps** at (±5.5…6.5, −0.74, ±37.5) up onto the slipway's quay (17–19 m; flags 10 / 12). The
      review's example is among them: (−5.5, −0.74, −37.5) → (−4.5, 0, −35.5), 19 m.
    - 8 long gaps at the slipway (14.9–16.9 m) and at (−8.5, −15) (12–13 m).
  - (d) WARN: 16 squid-only gaps behind the spawn deck (hiding places).
  - **The previous report's "four long gaps from the 2.6 m tops down to the yard" are gone.** In their own direction
    neither team gains more than 10 m from them; the old 10.3–26.4 m was |ΔD|, a move away from a Gate (D23).
- **#9:** as before. Climb-only plateaus are not wholly in a zone: the deck's wings at (±7.8, ±65.9) have 9 of 21 nodes
  in it, two 4 m² tops 3 of 4, and the 15 m² top at (±14.5, ±18.5) none. All four zone entrances a side are unsigned.
- **#10:** route 1 dips 6.6 m at (∓11.5, 2.4, ∓1.5).
- **#12:** no lightmap yet.
- **#13:** one cover block on the apron.
- **#14:** 47.9 % floor round the Pond.
- **#16:** 12 of 546 added edges are not made (hopVeto printed). The 24 climbs of ≤ 1.8 m are all hopped. Walks:
  routes 8/8, entrances 10/10.
- **Passes:**
  - #1, #2 (L within 0.2 %, no holes), #4, #8, #15;
  - **#11:** the carry knocks out both ways, with stuck 0, the flags right, the falls right and 204 drop splats fine.

**Lockgate** (first cut: weir at (0, 24), Gate at (0, 52), a spawn-deck zone with two signs). L 58.0 / 57.9 m.
FAIL #5 #7 #9 #11 #12 #14 #15 #16.

- **#5:** route 2 is 2.55 × route 1 to the weir.
- **#7:**
  - (a) 4 entrances a side, all seen.
  - (c) 10 drops of 3.1–3.3 m into the ring.
  - (d) **4 finds:** jumps onto off-field ground from (±20.5, 1.08, ±38.5) onto the 1.67 m top of the boat frame on its
    blocks by the warehouse wall, a prop collider (10.8 / 12.5 m; flags 5 / 6, `lockgate-flag-6.jpg`).
  - **The previous report's 14 "long gaps from the quay down into the lock chamber" are gone.** Jumping into the chamber
    takes a carrier more than 10 m *further* from the Gate, so it is no shortcut (D23).
  - Rising gaps: 143 candidates; only 2 are worth trying, and neither is made. The review found the same: its top four
    were not made.
- **#9:**
  - the climb-only 14 m² plateau at (±12.9, 2.5, ±29.4). It stays climb-only with the hopped climbs counted (86 of
    lockgate's 94), so the way up onto it is a squid climb;
  - the zone's four entrances a side are unsigned.
- **#11:** the narrow-walk splat by the weir rests on narrow floor.
- **#12:** no lightmap yet.
- **#14:** 63.9 % floor, and the shell is seen from 4 of 8 directions.
- **#15:** the weir is 1.5 m from the office (exact now: office, roof and parapet at 1.5 m, a prop collider at 1.72 m),
  and the defenders' approach can't see it.
- **#16:** 13 gaps down from the office's edge are not made (hopVeto printed). Walks 8/8, 8/8.
- **Passes:** #1, #2, #3 (count 50, weir → Gate 29.0 m), #4 (with the hopped climbs), #6 (12.1 s), #8, #10, #13.

### 2.3 Every shipped stage (`MAP=all`, the final checker)

`MAP=all` ran every shipped stage in one Electron on the final checker (d5795858): 20 min (17:54–18:14) at load
20–35, no harness errors, no console errors.

- Its first 12 columns are identical to the run before the #7a grouping fix (on 3693a126 / 69abedc0).
- Only the entrance counts moved: tidewater's Bravo side went back to 7 (the earlier run's 6 was the chaining D22 fixes)
  and calamari's went to 6 / 6.
- Only halyard and lockgate have data. The other eleven run on the engine's placeholder data and fail by design
  (DECISIONS #10). For those, what the stage itself holds (edges, proof, finds, climbs) is real. What depends on the
  Pond, weir and Gate spots is the placeholder's.

| stage | L (m) | weir counts | result | failing checks | hop + gap edges | #16 made / not made (hopVeto) | #16 walks: routes, entrances | beyond the rules made | rising gaps: candidates / tried / made | climbs ≤ 1.8 m hopped | #7d finds (gain > 10 m) | entrances A/B | s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tidewater (placeholder) | 57.02 / 55.45 | 100 | fail | #2 #3 #4 #5 #7 #11 #12 #15 #16 | 6 + 108 | 104 / 10 (h 0, g 0, g↓ 10) | 0/0, 12/12 | 41 of 46 | 8 / 0 / 0 | 11 of 11 | 51: lowGap 27, longDrop 13, longGap 6, offHop 5 | 5/7 | 47 |
| kelpline (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1707 / 7 (h 0, g 2, g↓ 5) | 8/8, 6/6 | 330 of 332 | 279 / 7 / 7 | 52 of 52 | 37: lowGap 10, longGap 2, riseGap 5, offGap 20 | 3/3 | 30 |
| halyard | 54.8 / 54.68 | 45 | fail | #3 #5 #6 #7 #9 #10 #12 #13 #14 #16 | 16 + 530 | 534 / 12 (h 0, g 2, g↓ 10) | 8/8, 10/10 | 160 of 162 | 167 / 12 / 12 | 24 of 24 | 300: lowGap 16, longGap 8, riseGap 10, offHop 11, offGap 255 | 6/6 | 33 |
| saltpan (placeholder) | 83.48 / 81.06 | 50 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 91 + 186 | 261 / 16 (h 0, g 6, g↓ 10) | 8/8, 4/4 | 169 of 183 | 110 / 6 / 6 | 58 of 58 | 28: lowGap 28 | 2/2 | 62 |
| crossmarket (placeholder) | 65.13 / 65.4 | 49 | fail | #5 #7 #8 #9 #11 #12 #13 #14 #15 #16 | 0 + 173 | 167 / 6 (h 0, g 0, g↓ 6) | 6/6, 8/8 | 115 of 123 | 28 / 0 / 0 | 0 of 0 | 6: longGap 6 | 4/4 | 58 |
| lockgate | 58.03 / 57.9 | 50 | fail | #5 #7 #9 #11 #12 #14 #15 #16 | 66 + 426 | 479 / 13 (h 0, g 0, g↓ 13) | 8/8, 8/8 | 208 of 237 | 143 / 2 / 0 | 86 of 94 | 4: offGap 4 | 4/4 | 59 |
| terraces (placeholder) | 66.01 / 61.2 | 48 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 145 + 641 | 780 / 6 (h 2, g 2, g↓ 2) | 8/8, 10/10 | 192 of 196 | 217 / 31 / 31 | 408 of 410 | 52: lowGap 10, longGap 1, riseGap 27, offGap 14 | 5/5 | 67 |
| nantai (placeholder) | 72.85 / 72.99 | 50 | fail | #7 #8 #9 #12 #13 #15 #16 | 99 + 323 | 420 / 2 (h 0, g 2, g↓ 0) | 8/8, 4/4 | 123 of 137 | 123 / 2 / 2 | 371 of 371 | 20: lowGap 18, riseGap 2 | 2/2 | 27 |
| craters (placeholder) | 69.39 / 69.26 | 50 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 317 + 1376 | 1545 / 148 (h 16, g 20, g↓ 112) | 8/8, 2/2 | 412 of 450 | 1155 / 34 / 10 | 224 of 226 | 16: lowGap 1, riseGap 10, offHop 1, offGap 4 | 1/1 | 36 |
| calamari (placeholder) | 64.82 / 64.82 | 48 | fail | #7 #8 #9 #11 #12 #13 #16 | 74 + 239 | 311 / 2 (h 0, g 0, g↓ 2) | 8/8, 12/12 | 112 of 128 | 118 / 8 / 8 | 138 of 138 | 12: lowGap 4, riseGap 8 | 6/6 | 55 |
| spirhalite (placeholder) | 80.25 / 79.54 | 50 | fail | #5 #7 #8 #11 #12 #13 #14 #15 | 84 + 622 | 706 / 0 | 8/8, 2/2 | 192 of 208 | 259 / 4 / 4 | 284 of 284 | 25: lowGap 14, highHop 2, riseGap 4, offHop 2, offGap 3 | 1/1 | 52 |
| treehills (placeholder) | 70.93 / 70.48 | 52 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 197 + 200 | 393 / 4 (h 0, g 0, g↓ 4) | 8/8, 6/6 | 188 of 210 | 133 / 20 / 20 | 91 of 91 | 42: lowGap 16, longGap 6, riseGap 20 | 3/3 | 63 |
| cargo (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1707 / 7 (h 0, g 2, g↓ 5) | 8/8, 6/6 | 330 of 332 | 279 / 7 / 7 | 52 of 52 | 37: lowGap 10, longGap 2, riseGap 5, offGap 20 | 3/3 | 28 |

Reading it:

- **Hop + gap edges** are what the field added. **#16 made / not made** is the per-edge proof: h = hops, g = gaps up
  or level, g↓ = gaps down. Every not-made edge is printed in that stage's JSON (`checks.16.nums.hopVeto`), ready to
  paste.
  - Craters' 148 are real: thin balustrades and rails that the field's level waist line passes over (D18).
- **#16 walks:** every route 1 and route 2 of every leg, and every entrance into both Gates' rings, walked by the kid
  with the carrier's rules, on all 13 stages. Tidewater's placeholder weir has no reading, so it has no routes.
- **Beyond the rules made:** the 1.8–2.1 m hops, the 3.0–3.8 m gaps and **[r1]** the rising gaps worth trying that the
  kid really makes.
- **[r1] Rising gaps:**
  - the candidates (the reviewer's definition, with a 6 m walk that may now hop a climb);
  - those worth trying (> 10 m, or into a ring);
  - those made.

  Craters' 1155 candidates compare with the review's 1667, and terraces' 217 with 682. The difference is that a climb
  the kid hops now joins a pair by a walk. The sets that matter match the review's: halyard 10 over 10 m, kelpline 5,
  terraces 27, craters 10 made of 34 tried, lockgate 0 made.
- **[r1] Climbs ≤ 1.8 m hopped:** the climbs of the hop rule's height that pass its tests, made of tried.
- **#7d finds**, by probe:
  - The static probes (lowGap, tallWall, longDrop) are as before.
  - High hops, long gaps and rising gaps count in their own direction (D23). That is why the last table's long-gap
    finds on halyard's yard tops and lockgate's lock chamber are gone.
  - The jumps onto off-field ground across a real gap (offGap) are new:
    - halyard 255, at the moored boats;
    - kelpline 20, terraces 14, craters 4, lockgate 4, spirhalite 3.
  - The full list with both ends is in `out/all-stages.json` (`c7.d`) and in each stage's JSON.
- **Entrances A / B:** #7a's count per Gate, the kid's moves into a ring now included.
  - halyard went from 5 to 6: the long gap at (±4.5, ±41.5).
  - calamari went from 5 to 6. Its walk entrances at (∓15, ±45) and (∓2.3, ±45.2) used to be chained into one by the
    old off-hop's exit crossings; they are two (D22).
  - Craters' and spirhalite's single entrance comes from the placeholder Gate's spot.
- **What else changed since the last table:** spirhalite's #9 no longer FAILs (§0, issue 2). Every other stage fails
  the same checks as before.

Pictures:

- `out/<id>-karp-top.jpg` for all 13 stages, each with its flag key;
- the full set (pond, weirs, Gate, zone, a `-flag-<n>` for every #7 flag) for halyard and lockgate.

### 2.4 Regressions (what this round could have broken)

- **The checker's self-test:** 48/48 (§2.1).
- **`MAP=all`:** 13 stages, no harness or console errors (§2.3).
- **`bazookarp-rules.js` (karpbox): 117/117**, no console errors. I ran it because `karpKitFx` (the glyph's background)
  is loaded in every Bazookarp match.
- **Not re-run, because nothing they test changed this round** (`git diff 4387bed6..HEAD -- src` is one line in
  `src/fx/karpKitFx.js`):
  - **karp-field.js:** `src/game/karpField.js` is untouched.
  - **check-maps and karp-layout-diff:** no layout, no data, and no kit geometry (`bazookarp-kit.js` untouched). The
    glyph is a canvas texture, not a block.
  - **karp-loop.js and karp-gun.js:** the engine is untouched.
  - **The sfx and net tests:** nothing crosses the wire or makes a sound.

  The previous round's results stand for these: karp-field 19/21 (its two load-cost rows noise-bound at load 230–290),
  check-maps byte-identical to b55f7472, karp-layout-diff RESULT same (96/96), karp-loop 6/6.

## 3. Decisions where the spec left a gap (for the lead)

- **D1. #3's "each weir's count is the lowest within 3 m of it on its floor" is reported, not judged.**
  - On any floor that falls toward the Gate, the nodes 3 m on read about 5 counts lower, so the literal rule fails every
    placement (the clean box's weir: count 60, 55 within 3 m).
  - Its purpose ("landing it is never worth less than walking past it") already holds through the cap (§3.4): until the
    plant, the count stops at the highest weir count, and a plant sets the planted weir's.
  - The JSON keeps `low3` per weir. **TELL THE LEAD.**
- **D2. Hops onto off-field ground are a #7d probe, and #7a counts them.**
  - The field's hop edges join field nodes only, and nav keeps only nodes it can walk to and back from. So a ledge top
    that only a hop reaches is outside the field: no field edge, no entrance, no reading.
  - SPEC §4.4's own self-test fault (f7) is that case.
  - **[r1]** This is extended to jumps across a real gap (D21).
  - The engine could take such tops into the field (WP0's / the lead's call). **TELL THE LEAD.**
- **D3. A #7d find with one end off the field** (D = ∞) is a WARN, a hiding place, not a FAIL: its gain has no number.
- **D4. #7c counts drops off the defenders' own spawn deck into the ring**, as the spec's words say.
- **D5. Waivers live in the data:** `waive: [{ check: '7d', at: [x, z], why }]` (Alpha's attack, mirrored). A find of
  that check within 2 m of the spot is reported as waived.
- **D6. The self-test box is karpbox plus a clean variant** (`karp-check-box.js`). karpbox itself is left untouched,
  because the rules tests rely on it.
- **D7. The self-test.**
  - One fault per check, plus SPEC §4.4's own list.
  - **[r1]** One case per sub-rule that had none, and the reviewer's faults (§2.1): 48 cases.
  - `notFail` cases prove a false FAIL gone.
- **D8. #9's plateau WARNs** apply to plateaus of 4 m² or more. The FAIL rule is the spec's, for any size.
- **D9. #13's "ways off the deck"** are nav edges of any type leaving a level flood of the deck, chained within 3 m. The
  deck's own blocks are not apron cover.
- **D10. #14 counts floor at any level within ±5 m of the Pond.**
- **D11. #16's run-up:** when 1.5 m or 3 m back is not floor at the low end's height, the start moves toward the edge in
  0.3 m steps. With no start at all, the edge counts as not made.
- **D12. #11's falls** use the wet node nearest the Pond on each half. "The narrowest walkway near each weir" is the
  route node within 12 m of the weir (≥ 3 m from it) with the fewest nodes within 1.5 m.
- **D13. The kit's looks live in their own module** (`karpKitFx.js`).
- **D14. Stage states carry a `query`**, so one generic checker builds each state's world.
- **D15. One tagged line in the Carp Field (`src/game/karpField.js`, WP0's code): a one-way gap edge down needs open air
  over its landing below the ledge it leaves** (nav's drop rule).
  - Without it, deck tops had "gap" edges down to the floor under that same deck. Removing them took crossmarket from
    443 to 173 gap edges, calamari from 804 to 239 and lockgate from 684 to 426.
  - **TELL THE LEAD.**
- **D16. The self-test checks the reason, not only the check number:** each case carries an `expect` pattern on its
  check's text.
- **D17. #16's walks** run the routes and entrances the graph claims with a real body. The walker's habits were tuned
  on traces, not guessed.
- **D18. Craters' not-made gap edges are real:** thin balustrades the field's level waist line passes over. A down-gap
  waist line that follows the fall would drop most of them at the source (WP0). **TELL THE LEAD.**
- **D19. #5 FAILs a leg with no route at all.**

New this round (review 1):

- **D20. Rising gaps** use the reviewer's definition:
  - rim pairs 1.2–3.0 m apart (flat), the far one 0.6–1.8 m up;
  - "open air" somewhere under the line (no floor within 1 m below it);
  - a clear waist line;
  - no 6 m carrier-graph walk joining them, so a step a kid can walk to and hop is no candidate.

  **Which ones #16 tries:** only those that can change a verdict, i.e. worth more than 10 m, or from outside a Gate's
  ring to inside it. The rest are counted (`candidates / tried / made` in the table). Their gain is in the move's own
  direction (D23).
- **D21. Jumps onto off-field ground:**
  - from a field rim node to an off-field rim node (nav-invalid, not a spawn zone, not a carrierBlock);
  - 1.2–3.8 m flat, from 3.4 m down to 1.8 m up;
  - across a **real gap**: somewhere along the line, no floor within 1 m below the lower end.

  The real-gap test is stricter than D20's. Measured against the rising line itself, a running jump onto a box across
  its own floor counted as "air". Kelpline had 56 such pairs onto one box by its spawn, and f7 had 26 onto its ledge.
  Those are the off-hop from the box's foot (D2) seen from further back.

  **An off-field top's exits** are nav's own edges off it, plus stepping or dropping off its edge: field floor up to 2
  cells out and 0.3–3.4 m lower, open above, with a clear waist line. Nav has no node right beside a ledge where a body
  doesn't fit against it, so H2p's landing had no nav exit at all.

  **Tried** when its best exit is more than 10 m nearer a Gate, or it has an exit inside a ring entered from outside.
- **D22. #7a's moves.**
  - A move #16's kid makes from outside a Gate's ring to inside it is an entrance at its landing (or, onto off-field
    ground, at the landing if that is in the ring, else its first exit in the ring).
  - It joins the entrance with a graph crossing nearest it within 3 m, so a jump beside a doorway does not add a sixth
    entrance. Otherwise it groups with the other moves.
  - It never chains two separate entrances into one (d5795858; at 69abedc0 tidewater's Bravo side lost one so).
  - It is never "seen" through that entrance's walk crossings. It needs its own line of sight, to its landing or to any
    of its exits in the ring.
- **D23. The gain of a one-way move** (a high hop, a long gap, a rising gap; the off-field moves already were) is
  measured in its own direction: D(from) − D(to), for the team it helps.
  - **Why:** #16 proves each move one way, and a move that lands further from both Gates is no shortcut. H2q's long gap
    back out of the ring went 14.8 m the wrong way.
  - The static probes keep SPEC's "differs" (\|ΔD\|): a squid gap goes both ways, and a tall wall's top is read
    through the drop off it.
  - **TELL THE LEAD** if SPEC's word should rule there too.
- **D24. Climbs a kid hops** (issue 2).
  - **What counts:** a nav climb edge of at most 1.8 m between field nodes that passes the hop rule's own tests (waist
    line, head over the foot, head across), and that #16's kid makes (its jump timed off the wall nav found). It counts
    as a hop in every no-climb search; #7b doesn't list it.
  - **What doesn't change:** the field's own D (a climb and a hop are the same length).
  - **PHYS=0:** the geometry alone decides, and the text says "unproven".
  - The climb edges above 1.8 m stay squid climbs.
- **D25. #1's kit footings.**
  - The check samples 3 × 3 points at ±80 % of each footing, plinth slab, sill and sign foot.
  - Floor (any solid non-kit top) must be at most 0.1 m below the piece's bottom. Buried is fine.
  - **The kit is not changed** to build each post at its own floor: a post sunk silently to the ground below a ledge
    would hide a weir spot the builder must move. It FAILs instead.
- **D26. The flags.**
  - One numbering for the picture, its key, the `-flag-<n>` pictures, the JSON and the console.
  - A check's flags within 2 m of each other are one; #7d's finds of one probe within 3 m are one.
  - There are pictures for every #7 flag, then FLAGSHOTS others, at most 40.
- **D27. #15 excepts any weir's own posts and sill** (the `karp-weir*` / `karp-sill` tags). Gate posts and NO CARP signs
  count.

## 4. Online, bots

Nothing crosses the wire:

- the checker is a tool;
- the kit pieces are static level pieces built the same on every screen, from the data, in `layoutFor`;
- `karpKitFx` is local looks;
- `G.match.stage.karpStates()` is a query.

No bot code changed. Bots walk nav, not the carrier graph, so D15 doesn't touch them. The checker's new findings
(rising gaps, off-field jumps, hopped climbs) are measurements, not engine changes.

## 5. Commits and shared files

**By the first builder (2026-10-10):** f9066b54, d076d897, f5d9cfa6, 41b3af85, 67fc76a0, 1fa1d0cf, 8a7bd6ca, da478a62.

**The takeover (2026-10-16 morning):** 6423a8b7, 8f19bfc0, ec272051, 3ecb30b6, e84f4669, cff56eaf, 49894ea9, d7f07321,
3f1ec4a7, 8c19a918, a51212ef. Scratch commits: 4d8e193a, 50ad9e2c, 746fe97e, 4387bed6.

**This round (fix round 1, review 1):**

- ef762c16 karpKitFx: the carrierBlock glyph's background is transparent again (issue 5)
- 4cabc0db bazookarp-check (review 1):
  - #7 sees the moves no edge holds: rising gaps and jumps onto off-field ground;
  - kid moves into a ring are #7a entrances;
  - off-field exits by stepping off the edge;
  - climbs of ≤ 1.8 m the kid hops count as hops;
  - #15 is exact;
  - #1 checks the kit footings;
  - the numbered flags, the key and the padded bounds.

  (Issues 1, 2, 3, 4 and 6.)
- 5770f4db bazookarp-check.cjs: the flags printed and in the JSON; the self-test's notFail cases
- 5eb949cb README / karp-stages BUILDER.md: the Mac mini lines and the new rules (issue 8)
- bab228f5 (scratch) JOB-1.sh split into JOB-1 / JOB-2 (issue 8)
- 248405e8 bazookarp-check self-test: 23 more cases, 48 in all (issue 7)
- 98a679a4 bazookarp-check MAP=all table: rising gaps and hopped climbs per stage
- 2591cc21 (scratch) out/kit-carrierblock.jpg re-taken (issue 5)
- ab1e9afc bazookarp-check #7d: one-way moves gain in their own direction (D23)
- 3693a126 bazookarp-check #7d: a jump onto off-field ground needs a real gap (D21)
- 69abedc0 bazookarp-check flags: only flags of one kind merge
- deef4377 bazookarp-check pictures: under 290 KB by quality, then size
- ef4782a5 (scratch) out/: every stage's top-down, halyard's and lockgate's full sets, the self-test's pictures,
  selftest.json
- d5795858 bazookarp-check #7a: a kid's move joins the nearest entrance and never chains two (D22)
- 0398e735 (scratch) out/ on the final checker: MAP=all's top-downs and every stage's JSON, halyard's and lockgate's full
  sets, the self-test's entrance cases re-taken
- (this report: one `(scratch)` commit after these)

**Shared files touched** (each hook tagged `[b5-karp-checker]`):

- `src/game/karpField.js`: one condition in the gap scan (D15, the first builder's). It is untouched this round.
- `src/game/stageMods.js`: `'karpStates'` in `R_HOOKS`, and `StageRun.karpStates()`.
- `src/main.js`: the import of `KarpKitFx` and one constructor line.
- `src/world/bazookarp-kit.js`: the kit, rewritten (WP0's file).
- `src/world/bazookarp-data.js`: the `waive` field documented in its header.
- `src/fx/karpKitFx.js` (new; **[r1]** one line in `drawNoCarp`).
- `docs/STAGE-MODS.md`: the `karpStates` row, and T4 served.
- `tools/botlab/README.md`: the checker, PROBE and the regression set (**[r1]**).
- New files:
  - `tools/botlab/bazookarp-check.cjs`, `karp-check-page.js`, `karp-check-box.js` and `karp-check-states.js`;
  - `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`.

## 6. Unfinished, uncertain

- **The field itself still lacks these moves** (TELL THE LEAD, WP0):
  - rising gaps;
  - jumps onto off-field ground;
  - hop edges where nav already has a climb edge.

  The checker finds and reports them, but the engine does not read them. A carrier who makes a rising gap reads the far
  side at once, which the continuity clamp may reject, and a carrier on an off-field top keeps its last value.
- **Rising gaps and off-field jumps worth 10 m or less, not into a ring, are not tried.** They could not change a
  verdict, so the table counts them as candidates only.
- **An off-field top's exits are not proved physically.** The kid proves the jump onto the top. An exit is a step or
  drop off its edge with a clear waist line, which nothing but a rail at waist height would stop.
- **D23 reads SPEC's "differs" as the move's own direction** for the one-way moves #16 proves. That removed real-looking
  but wrong finds (H2q's, halyard's yard tops, lockgate's lock chamber). The lead may want SPEC's literal \|ΔD\| back.
- **Halyard's 255 boat finds are real moves**, a yacht's deck bridging a slip (`halyard-flag-22.jpg`), but they are
  many. They group into 1 flag a side (21 / 22). WP4b will close them with `roof` boat tops or a carrierBlock, or ask for a waiver.
- **#16's kid tries a fixed set of moves.** It steers straight at the far node, from 1.5 m and 3 m back, with five jump
  timings. A move that needs another line could read as not made. A builder should run `PROBE=` on a listed edge
  before pasting its hopVeto.
- **COMMON.md was changed in this worktree, not by me** (uncommitted: "THE MAC MINI IS BACK" as of 2026-10-16). My task
  says the Mac mini is unavailable and to push nothing, so I ran everything locally and left the file as I found it.
  JOB-1 / JOB-2 (committed, not pushed) are ready for the runner once the lead pushes `botlab-b5-karp-checker`.
- **The 60 ms field budget is still unmeasured on a quiet machine:** JOB-1, or karp-field.js locally at the low load seen
  this evening. karpField is untouched this round.
- **The gimmick stages have no states yet on this base.** The generic state path is proved only with the test module
  and karpbox's test state.
- **The kit's look was judged from pictures only, with no lightmap** (the variants are unbaked). WP2 owns the moving
  parts.
