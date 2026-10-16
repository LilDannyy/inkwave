# Highmark Foundry: the lava engine (the Bellows' breath) — after fix round 3

The lava is a registry stage module (key `lava`). Fix round 3 works the lead's round-3 list (`LEAD-NOTES.md`, binding)
after the engine's third review (verdict REDO, "a short round"). A first fixer did most of it and was cut off by a usage
limit; I took over (its uncommitted claimant change finished and committed, its report draft replaced by this one). Every
run is on this Mac, one Electron instance of mine at a time under the shared SLOTS=3 lock
(BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000. Nothing is pushed. (COMMON.md now says the Mac mini is back; my
instructions said run locally and push nothing, so I did; that COMMON.md edit in the worktree is not mine and is left
uncommitted.)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera, base fdb6516f (018673b8 + the lead's notes).
**b5-int3 merged at b97b3ebf** (06171a9b). Final code head **5b42e5bf** (52f17f58 and the report commit after it are
scratch only). Review 3's JSON is in the session scratchpad (`cal-review3.json`); the worktree's LEAD-REVIEW.json is review 2's.

## 0. The lead's round-3 list: each item, what was done, the proof

**1. Bots off dry edges — DONE, the gate met twice at the final code.**
- The three ways review 3 named, closed (bots.js, all `[b5-caldera]`): *squid at speed* — `_squidWouldDrop` / `_swimDrop`
  also look along the velocity at swim-speed reach (`dry` reads the lava with its look-ahead), the edge guard's momentum
  brake works from 0.25 m/s against the drift, a squid's carry 0.45 s; *a route's own hop near the lava* — with the sea or
  the lava within 1.5 m (`_wetWithin`) the hop is made only where its flight (`_flight`: the actor's own gravity, apex /
  fall factors, air control, the body pushed out of what it meets, the ledge assist) comes down on the route node's top
  (`_hopLands`), and is flown at the node it was made for (`_hopTo`); a wiggle's hop is a stuck hop, not a route's; *a jump
  while firing* — twins / dualies / Cutlass presses are checked as a roll and as a hop.
- What the repeated trials showed next, also fixed: the air guard checks the flight as the brain steers it
  (`_flightWet`), climbs' own hops included; a body over a lip is recentred onto open floor at its own level, never into a
  wall; Sponge Mitts bots never cling over the lava, never let go or leap where the landing is wet or slides on into it
  (mitts.js); an escape never plans a wall climb; an escaper inks its feet at a step 1.5 s per step in all; a hop asked for
  and not made in 0.5 s is dropped, and a climb's top-strip hop flag holds only while the climb drives it (a stale flag let
  a bow hop off Race 2 into the lava, F8b); near the lava a route's hop is judged by the flight it will fly, not also the
  ballistic arc along the velocity (that refused lookout climbs).
- This takeover: **a lookout claimant at a column's face on enemy ink inks the deck at its feet first** (a jump on enemy
  ink reaches 0.73 m, short of the next column's 1.15 m; it stood 20 s at Organ L's face in a Zone Control match), and a
  charge kit lets go of its charge while it inks its feet (escapers too: held, the shot left only after the aim moved).
  Probe (a charger on Organ B at HIGH, the deck in enemy ink, 3 runs): 2 of 3 up without, 3 of 3 with. 48f156aa.
- `lava-bots.js` classes each death (escape = escaping in its last 1 s, else fight) and carries the gate row.

| lava-bots run (ledges / stones / edges, 120 bot-trials each, 360 in all) | escape | fight | gate |
|---|---|---|---|
| review 3's (018673b8) | 0 | 5 | — |
| first fixer, a2 → a8 (the fixes landing) | 0–4 | 0–6 | mixed |
| first fixer, a13 / a14 (b7f9e4a4) | 0 / 0 | 0 / 1 | pass / pass |
| **final f1 (52f17f58 = code 5b42e5bf)** | **0** | **0** | **pass** |
| **final f2, the next run** | **0** | **1** (a bucket in a fight on Race 2's corridor, 77.4 s) | **pass** |

- Bot matches at the final code (lava-match.js, all bots, the full schedule): **0 lava deaths and 0 sea falls in all five, every check 7/7** (review 3 asked for every check to pass in 2 Turf War +
  2 Zone Control; the first fixer's last set had two 6/7s — a claimant 20 s at Organ L's face, a match with no lookout):

| match | lava | sea | stuck % (longest) | at the stones ≥ 2 s | stone steps | Slump crossings | lookout s team A / B (long-range) | checks |
|---|---|---|---|---|---|---|---|---|
| Turf War 1 | 0 | 0 | 0.05 | 0 | 2 | 4 | 0 / 17.9 (0 / 17.9) | 7/7 |
| Zone Control 1 | 0 | 0 | 0.33 (3.25 s) | 0 | 1 | 1 | 45.3 / 48.7 (0 / 48.7) | 7/7 |
| Turf War 2 | 0 | 0 | 0.21 | 0 | 0 | 6 | 24.4 / 0 (24.4 / 0) | 7/7 |
| Zone Control 2 | 0 | 0 | 1.16 (4.75 s) | 0 | 0 | 1 | 26.6 / 31.6 (26.6 / 31.1) | 7/7 |
| Tower Command | 0 | 0 | 0.88 (3.25 s) | 0 | 0 | 0 | 39.9 / 77.9 (39.9 / 76.9) | 7/7 |

**2. b5-int3 merged; karpStates; the subs with the lava; lava-karp.js; the dock — DONE (the dock as the fallback).**
- Merged b5-int3 at **b97b3ebf** (06171a9b; one conflict, bots.js's stage hook: int3's carrier guard kept, the lava's
  `stageUrgent` kept).
- `StageLava.karpStates()` → `[{ key: 'low', nodeOk }, { key: 'high', nodeOk }]` from `restMask`, served through the
  registry (`G.match.stage.karpStates()`, stageMods.js) and written into docs/STAGE-MODS.md (queries table, API, the
  caldera contract row, H17). On the way: karpField read stage sweeps as `[x0, z0, x1, z1]`, the registry hands
  `{ x, z, hx, hz, yaw, y0, y1 }` boxes (the riders never reached Bazookarp's rest flags) — karpField reads both (`sweptBox`);
  `R.noPlace` refused every Chain Bobber over the lava — a spot with no floor under it is no no-place now.
- **lava.js E1b**: a Scrap Sentry the lava covers goes (`device:down` how `lava`, no blast); a Chain Bobber chain over the
  lake rides a whole rise 1.0 m over the surface, is never ended and keeps its tether; a Glide Bomb dropped in the lake sinks
  — one fizzle, no blast, no paint.
- **`tools/botlab/tests/lava-karp.js`** (new, SPEC §5.5): the field built with the lava's states; no rest spot on a rider,
  none on lava-reachable floor at HIGH; the HIGH drop spot lands dry; the switch at `lava:warn` both ways with no rebuild; a
  Bazookarp resting on a ledge moved at the rise warning; a carrier on the drowning shelf gets the personal line and no ×3;
  a bot carrier escapes the rise. Final: **8/8**.
- **The dock**: one CSS line in lavaFx.js — in Bazookarp the chip hangs under Bazookarp's status line (`.iw-kst`);
  `DOCKS.bazookarp = 'karpDock'` stays pre-wired (`out/fix3/fix3-karp-chip-under-status.jpg`).
- **Found by the boss gate, a b5-int3 bug (fixed, c689911f)**: in Boss Battle a squad bot's target is a part of the boss
  (`{ shape }`, no `pos`); bobber-bots.js `holdFire` and its fight pair read `target.pos` and threw every frame a bot
  carrying a Chain Bobber shot the boss (the match step aborted: 4 of my first 11 boss runs). Any stage's Boss Battle.

**3. The boss — DONE: boss-check 3 consecutive passes at the final code (96 / 55 / 69 m walked).**
- The first fixer built Boss Battle's own variant (`notIn: 'boss'`: no Surge Gauge, none of the island's dressing or the
  Lakefronts' / Moorings' dressing in the clearance ring): 910 m², one piece. It still failed ~1 run in 3.
- Why, from trails and per-10 s brain dumps: (a) the terraces stand 1.2 m over the boss's tier, inside BossNav's 1.35 m
  stride, so its home ground ran **up the Lower Surge Steps**: it walked up toward the squad on the terrace and stuck
  between the parapets (29–30 m walked, parked at the steps' foot); (b) after a charge left it **off-centre on a 10 m
  causeway**, only a pose along the causeway fits — it turned to its diagonal waypoint, could not step, picked another goal
  the same way, and stood 80 s; (c) with the squad on a terrace it settled at its preferred 10 m and played every move from
  one spot.
- Fixed (5b42e5bf): `layout.boss.maxRise` (BossNav; caldera 0.65: higher ground is no floor to it — the Pour Floor and the
  Moorings, 0.6 up, stay its ground) → **818 m², one piece** (`out/fix3/fix3-boss-homeground-maxrise.jpg`, ≥ the lead's
  800); `layout.boss.roamAfter` (bossBrain; caldera 12 s: having stood within 5 m of one spot that long it picks its next
  goal ≥ 9 m away); and in the shared brain, a walk blocked straight at its waypoint takes the heading a pose fits that best
  closes on it until the straight step fits (≤ 5 s).
- boss-check runs: before (both fixers, 9 runs over the last code states): 5 pass. During the fixes: maxRise alone 2 of 4;
  + roam 1 of 4 (the causeway trap); + the detour 3 of 4, then 4 in a row of 5 (the fifth: 35 m — the squad held it in
  back-to-back slams at the causeway's foot). **Final batch: 5/5, 5/5, 5/5** (96, 55, 69 m; 9–12 cells). The shared
  detour on another stage: boss-check on Calamari 5/5 (100 m, 12 cells, 1,121 m²).

**4. Rule 44 — NOT DONE as decided: the decision cannot pass; measured whole and written into DESIGN §3.5 for the lead.**
- The round's first rule-44 audit tried only the 260 shortest gaps, so it never saw a gap past ~6 m — that is where "swim
  jumps cross 5.4–5.7 m" came from. I measured the kid itself on flat ground (the audit's new information row, real
  physics): **running jump 3.9 m** take-off to touch-down (peak 1.35 m), **swim jump 8.65 m** (a squid in the air keeps its
  11.8 m/s; peak 1.70 m), run + air dash 6.9–7.1 m, **swim + air dash 10.4 m**.
- `lava-audit.js` rule 44 now measures it whole (321056de): every edge node over lava, 16 headings, gaps to 11 m, every
  candidate tried, a crossing = a flight over lava landing on the far floor within 1 m of its line (a kid turned along a
  curved coping read as a 9 m running jump). The gates are the lead's, unchanged. Final run (b8d1640f, code 5b42e5bf):
  - plain running jumps: **36 crossings at 13 places (LOW), 40 at 12 (HIGH)**, every one a corner between floors joined by
    land, **saving 0.8–12.5 m** (the south bay's corners, the lookout's LOW top / the island to the causeway, the north
    head's corner, the East Pool's corners, off the Spillway Bridge at HIGH);
  - swim / dash: 1,395 (LOW) and 1,537 (HIGH) crossings; **772 save > 20 m (220 > 40 m) at 51 places at LOW, 241 (31) at
    37 places at HIGH** — the whole Slump flank at LOW (the shelf, the heads, Race 1's corridor ↔ the island's west face and
    its Organs, 21–57 m), the south bay (the south head, the Lakefront, the Moorings ↔ Organ L and the island's south-west,
    "the 45 m one" among them), both Race 2 corridors (20–34 m), and at HIGH the East Pool / Spillway mouth (20–48 m).
- Why I did not build it: ≥ 6.5 m stops nothing a swim jump does (8.65 m); a rail is no lip to a squid (squids pass rails,
  level.js) and a kid stands on one (the first fixer's railing, 50016c5e, reverted in 4cba0cbd); "the 45 m one" is one of
  ~50 places per half; corners have chords of every length, so "≥ 5.5 m" is no property a corner can have (13 places, not
  3). Widening or walling the lake to stop all of it is a stage revision (the lake, the Races, the Organs' sockets, zones,
  the tower track, Bazookarp's routes, the boss's ground, cover). **The two rule-44 checks fail until the lead re-decides.**
- Options written in DESIGN §3.5 (52f17f58): (1) accept swim / dash jumps over the lava as skill movement and judge plain
  running jumps by the 20 m skill-route bar — everything measured passes (most 12.5 m), nothing to build, the list goes to
  Bazookarp checker #16; (2) make the lava unjumpable where it matters — gaps ≥ 11 m or solid ≥ 1.8 m lips on every such
  shore, a stage revision; (3) a physics change over lava (not recommended). My recommendation: (1).

**5. Rule 45 — DONE** (first fixer; re-run): `LavaWorld._fitMask` fits one half and turns it 180°; the audit checks every
outline texel and that the mask is its own twin. Final: **PASS**, 1,120 outline texels, 198 at the lips, min inset 0.55 m,
0 bad, 0 asymmetric, `fitTwin` true.

**6. The tests — DONE.** net-lava compares the grids at the results screen and judges lava cells against the same run's
other cells (both reported); lava-match's lookout check tests `lookLong`; Slump crossings are informational for the
balance pass; a bot fighting on a stone and held there 0.75 s walks along the Race to the head (`stats.stoneSteps`; no
stuck episode ≥ 2 s at the Races in the final matches); G5 judges the minimap's median step.

**7. The pictures — DONE.** The `eng-*` set was regenerated by the first fixer at c07301b8 with the same 40 scenes plus
the lavafall from its side at LOW / HIGH and the Organ Pipes from the island at LOW / HIGH (44, `out/engine/eng-*`,
d3736336). Nothing visual changed after it (the later source changes are bots.js / lava.js bot behaviour, the boss's
brain / nav and the boss's layout options: `git diff c07301b8 HEAD -- src`), so the set stands at the final head. New this
takeover: `out/fix3/fix3-boss-homeground-maxrise.jpg` (looked at: the home ground no longer runs onto the stairs; the
Lakefront wedges and the Moorings stay).

## 1. What the lava is, rule by rule (unchanged this round except where §0 says)

**The level**: one horizontal surface over the region (the lake, both Spillways, both Slump bays), LOW −0.6, HIGH +0.8,
a pure function of the shared stage clock (lavaCore `lavaSchedule` / `lavaAt`), each move 10 s on a smoothstep (peak
0.21 m/s) after a 10 s warning; the region fitted at load (one half, turned) as a 0.25 m mask with two proximity channels.
**Schedules**: Turf War 3:00 rises 35 / 110, falls 70 / 140; 1:30 rise 30, fall 55; Zone Control, Tower Command,
Bazookarp 35 / 125 / 215 up, 80 / 170 / 260 down; every match ends at LOW (Turf War ≥ 25 s), nothing moves in the first
30 s or the last 12 s; overtime holds; Practice 20 / 35 / 35, the menu backdrop 8 / 15 / 15; Boss Battle held LOW.
**Notice**: ledges deadly 13.8 s after the rise warning, dry 16.2 s after the fall warning. **Touching lava kills** (cause
`lava`, the attacker credited within 4 s); covered floors' colliders off; no ink under the surface; the burn on the
furthest stage time reached; the Pumice Races (solid exactly while the shelf is deadly), the Organ Pipes (tops linear in L,
one hop apart); devices swept (through b5-int3's `crushIn`, the kits' devices included); shots, bombs and thrown subs
fizzle; super jumps redirected; every channel announces rise and fall as opposites (Surge Gauge, sounds, the chip,
callouts, the personal line from the feet, the minimap, the rind, embers up / steam down).

## 2. Decisions where the request left a gap

1. **The merge first** ("at its head when you start"): b5-int3 at b97b3ebf before the bot work, so every proof of item 1
   is on the merged code.
2. **The gate's "escape death"** = a bot that was escaping in its last 1 s; everything else is a fight death; the gate
   allows ≤ 1 fight death per run of 360.
3. **Boss variant contents**: the whole Surge Gauge goes in Boss Battle; the terrace parapets stay. **The boss's footing**
   (this takeover): `maxRise` 0.65 rather than a stair keep-out (it is the stage's tiers that sit inside the boss's
   stride); 818 m² ≥ the lead's 800. Raised ground counts as no floor (as a deck's edge, 1.8 m clearance), not as a wall:
   a wall's 2.9 m cut the Lakefront wedges off (775 m²). `roamAfter` and `maxRise` are stage opt-ins; only the blocked-walk
   detour runs on every stage (a boss that cannot step toward its waypoint was stuck anywhere).
4. **Rule 44**: not changed (§0 item 4) — the decision's premises (three corners; swim jumps crossing ≤ 5.7 m) do not
   hold under the real physics; the audit is made to measure all of it rather than loosened.
5. **The b5-int3 Chain Bobber crash** fixed in place (two guarded reads, tagged) rather than left to the int4 integrator:
   it broke the round's own gate and any Boss Battle with a bobber bot.
6. **karpField's sweeps reader** fixed in the Bazookarp file (one tagged helper) rather than changing the registry's box
   format; **noPlace and floating devices**: a spot with no floor under it is never a no-place; **G5** judged on the median
   step.

## 3. Online and bots

**Online**: no new record. karpStates are pure (from `restMask`, at load); `lava:warn` is on the stage clock on every
screen, so every screen switches its Carp Field together. The region fit reads only layout blocks and is one half turned,
so every screen fits the same mask. The boss variant is a mode variant (`caldera.boss`); the boss's brain runs on one
client (offline, or the host) and its moves go out as move records as before — maxRise / roamAfter / the detour change
only where it walks.

**Bots** (they know what the HUD shows): `_foot`-based footing and escapes, the flight model (`_flight`, `_hopLands`,
`_flightWet`), route hops only onto the node's top near the lava and flown at it, rolls checked as hops, wiggle hops not
route hops, the squid's momentum look-ahead, the slow drift brake, recentring onto open floor, the Mitts' leaps and clings,
escapes off wall climbs, the per-step foot-inking cap, the stone step-off, the lookout claimant's hop request and (this
takeover) its foot-inking on enemy ink, the charge release while inking. Bots never jump over the lava (no nav links).

## 4. Tests, pictures, balance

Final code 5b42e5bf (runs at b8d1640f / 52f17f58: scratch commits only after it), local, one Electron of mine at a time:
- **lava.js 57/57.** **lava-audit.js 19/21** — every rule passes but rule 44's two gates (§0 item 4); rule 45 PASS.
- **lava-bots.js** f1 0 / 360, f2 0 escape + 1 fight / 360: the gate, twice in a row.
- **boss-check.js** (MODE=boss) 5/5, 5/5, 5/5 (96 / 55 / 69 m); on Calamari 5/5 (the shared brain change elsewhere).
- **Five bot matches** (2 Turf War, 2 Zone Control, 1 Tower Command): 7/7 each, 0 lava deaths, 0 sea falls (§0 item 1).
  Extra, Bazookarp 5:00: **6/7** — 0 lava deaths, 0 sea; it failed "no stuck episode ≥ 10 s": a bot in paint mode 10.25 s
  on Alpha's terrace (−5, 2.4, −32.7) at the top of the Lower Surge Steps, nowhere near the lava (the first fixer's
  Bazookarp match at b7f9e4a4 passed 7/7; nothing of this takeover acts there).
- **net-lava.cjs 12/13, then 13/13**: the first run's miss was the live guest's whole grid against the host's after the
  Practice cliff painting — 3 of 438,753 cells (176 vs 175 inked), none of them lava cells (lava cells 0 differ; the late
  joiner's imported grid exact). The netcode's ordinary splat rounding (review 3 measured ~0.13 % of non-lava cells live);
  the re-run is exact. Every other check both runs: the level within 0.015 m every 0.5 s, the guest's lava splat judged at
  33.97 s, devices gone on both screens, lava cells at the results 99.944 % vs 99.872 % for the same run's other cells, the
  host leaving mid-rise → fall at 55.00 / 55.02 s, stones deadly 61.23 / 61.22 s.
- **lava-perf.js 3/3** (shared machine): at rest median 6.8 ms a stepped frame, the lava's update 0.14 ms (max 2.1); in a
  rise median 8.3–9.8 ms, the lava 0.30–0.44 ms (its worst 14.9 ms in the first burn frame); every ledge inked then burned:
  worst frame 35.5 ms, the lava's 5.1 ms; the two-pose nav build 580 ms, 36 rider parts.
- **lava-karp.js 8/8. stage-mods.js 36/36. net-stagemods.cjs 10/10. world-build.js** caldera 5/5, halyard 5/5.
- **The shared bots.js changes on other stages** (one Turf War bot match each): Calamari stuck 0.1 % (baseline 0.1), 0 sea,
  0 frame errors, 0 console lines; Treehills stuck 0.8 % (baseline 0.2, review 3 0.4; longest 4 s, a fight in the open),
  0 sea, 0 frame errors, 0 console lines. (This takeover changed no bots.js line; those are the first fixer's.)
- **check-maps** (WIPSTAGES=1): caldera / .zones / .tower 1,735 pieces, .bazookarp 1,759, .boss 1,630 — all ok.

**Pictures**: `out/engine/eng-*` (44, at c07301b8, unchanged visuals since), `out/fix3/fix3-boss-homeground-before-after.jpg`,
`fix3-boss-homeground-maxrise.jpg`, `fix3-karp-chip-under-status.jpg`.

Balance sets: none (the lead's consolidated pass). Slump crossings in the final matches: 4, 1, 6, 1, 0 (Turf War meets DESIGN §3.7's ≥ 4; Zone Control and Tower Command keep their fights at their objectives) (for the balance pass).

## 5. Commits and shared files

Round 3 (first-parent after fdb6516f): 06171a9b (merge b5-int3), 02520e59, 2e5185cb, a076d7e1, ccb0496d, 5a3d64a4,
beab7633, 8eb384d0, 1e5f3d60, 08343e39, 2e0ba81b, cc4b1c9e, f42231a9, a95723ea, 50016c5e (railings, reverted by
4cba0cbd), 4cba0cbd, 204323cb, 86a1d1a6, 8d2d633e, e89c4045, 0dee425b, 8fad430c, 37fd65d7, b7f9e4a4 (the first fixer),
**48f156aa, c689911f, 321056de, 5b42e5bf** (this takeover), and the `(scratch)` commits 22cfcc45, 94f3b555, c07301b8,
d3736336, b8d1640f, 52f17f58 and this report's.

**Shared files** (all tagged `[b5-caldera]`):
- `src/game/bots.js` — `_tail` (the route-hop landing rule, rolls as hops, `_hopTo`, the air guard with `_flightWet` and
  climbs, the stale-hop drop), `_flight`, `_hopLands`, `_flightWet`, `_wetWithin`, `_squidWouldDrop` / `_swimDrop`,
  `_edgeGuard` (the slow drift brake, recentring, the tip's way back), `_wiggle`; the merge's stage-hook line.
- `src/game/kits/mitts.js` — `wallOverHazard`, `botLetGo`, `landingOk`'s slide check.
- `src/game/kits/bobber-bots.js` — `holdFire`'s target position and the fight pair's guard (Boss Battle).
- `src/boss/bossNav.js` — `layout.boss.maxRise`. `src/boss/bossBrain.js` — `_roam` (`layout.boss.roamAfter`), the
  blocked-walk detour in `_walk`.
- `src/game/stageMods.js` — the `karpStates` query. `src/game/karpField.js` — `sweptBox`. `src/fx/lavaFx.js` — one CSS
  line (Bazookarp).
- Stage files: caldera/layout.js (`noBoss`, `boss: { maxRise, roamAfter }`), props.js and lava.js (the gauge `notIn:
  'boss'`). Module: lava.js, lavaCore.js. Docs: STAGE-MODS.md; DESIGN.md §3.5 / §4.5 (scratch).
- Tests: lava.js (E1b, F8b, G5), lava-bots.js, lava-karp.js (new), lava-audit.js (rules 44 / 45), lava-match.js,
  net-lava.cjs, lava-hud-scenes.js, lava-eng-scenes.js (new).

**For the integrator (int4):**
- `hud.karpDock` is still undefined (the Bazookarp face package's); the chip falls back under `.iw-kst`.
- Bazookarp's Carp Field starts in state 0 (as built) until the first `lava:warn` (25 s); on Highmark it should start in
  `stateOf('low')` — a Bazookarp-side line (bazookarp.js after building the field), not done here.
- karpField's `sweptBox` reader and bobber-bots.js's boss guard (both tagged) — keep them when merging the karp and sub
  packages; the bobber crash is in b5-int3 itself.
- bossBrain's blocked-walk detour runs on every stage (opt-ins `maxRise` / `roamAfter` only on caldera). Boss-check on Calamari after it: 5/5.
- The boss variant gives Highmark a `caldera.boss` world key (no lightmap baked yet for any caldera variant).

## 6. Unfinished, flaky or uncertain

- **Rule 44** (item 4): not built — the decision cannot pass under the measured physics; the two checks fail; the lead
  decides between DESIGN §3.5's options.
- **boss-check is stochastic**: final 3/3, and 7 of the last 8 at this code; the one miss walked 35 m because the squad
  held it in back-to-back slams. The "roams" bar measures the squad's play as much as the boss.
- **lava-bots trials are not deterministic**: two gate passes in a row at the final code (0 and 1 fight death in 360);
  earlier runs of nearly the same code had 1–5 in 360.
- **The Bazookarp match** (extra) failed its stuck check once (10.25 s on the terrace, not the lava); **net-lava**'s
  late-joiner check failed once on 3 non-lava cells of the live guest (the netcode's rounding; exact on the re-run).
- Not built (unchanged): the stones' chains, the pig beds' glow, the Bellows Vent plume, the red under-light, the far
  scenery; the lightmap bake with the lava. The Organ Pipes still look blockout-plain (the art phase's).
- The harness profiles run at quality 'low'; the picture scenes rebuild the particles as at 'high'.

## Module API (for the art phase)

**Registration.** `registerStageMod({ key: 'lava', order: 20, worldAs: 'lavaWorld', matchAs: 'lava', liquid: true, world:
LavaWorld, match: StageLava })`, active when `LAYOUT.lava` exists (`low`, `high`, `region`, `falls`, `timing`,
`schedule`, `mirror`, `riders`, `steps`, `gauges` (may carry `onlyIn` / `notIn`), `cascades`, `vents`, `flotsam`,
`look`, `text`).

**Pure core** (lavaCore.js): `LAVA`, `lavaSchedule`, `lavaAt`, `lavaY`, `lavaMax`, `crossTime`, `stoneRel`, `riderTop`,
`expandLava` (filters riders, steps and gauges by mode), `partPose`, `inRider`, `pointInPoly`.

**World** (`G.lavaWorld`): `inRegion`, `fallsIn`, `box`, `mask` (fitted at load: `fitAdded`, one half turned: `fitTwin`,
`fitTwinChanged`), `map` (R region, G / B glow proximity at LOW / HIGH), `uniforms`, `drown`, `floorY`, `riders`,
`navMeta { kind, shutY, rider, pose, top, escD, exit, safe, safeD, reach }`, `proxAt(x, z, y)`, `proxMs`, `look`.

**Match** (`match.lava`): state `clock`, `y`, `st`, `tMax`, `burnY`, `state()`, `stats { deaths, byTeam, warned, burned,
devices, fizzles, lookout, lookTeam, lookLong, lookClaims, lookHold, lookLog, stoneSteps, … }`; queries `surfaceAt`,
`liquidY`, `under`, `covers`, `wet`, `burns`, `noPlace` (no floor under the spot: never), `danger`, `inkClip`,
`restMask`, `karpStates`, `maxOver`, `yAt`, `_foot(a)`; tests `debugT(t)` and `?lava=low|high|rise|fall`.

**Registry hooks served:** update, seek, dispose, kill, fallCause, superJumpLanding, noPush, navEdge, navNode,
goalWeight, beforePath, botHold, botAct, wet, under, fizzle, liquidY, noPlace, restMask, karpStates, danger, sweeps,
splatTime, onSplat, drawMap, hud, state. **Bot fields it sets**: `stageUrgent`, `guardOff`, `_needJump`.

**Events:** `lava:warn`, `lava:move`, `lava:rest`, `lava:hold`, `lava:set`, `lava:rider`, `device:down` (how `lava` /
`crush`), `shake`; cause `lava`. **Sounds:** lava_rumble, lava_erupt, lava_hiss, lava_drain, lava_sizzle, lava_pop,
lava_lock, lava_tick, lava_bell, lava_siren_up, lava_siren_down, lava_whistle.

**Stage layout keys this round added for Boss Battle:** `boss.maxRise` (m over the boss's floor beyond which ground is no
floor to it), `boss.roamAfter` (s: lingering that long, its next goal is ≥ 9 m away) — BossNav / BossBrain, any stage.

## For the art phase

- **Palette** (`LOOK` in lavaFx.js): crust #3b1f1a / #4a2219; seams #a3121a → #e0301e → (#ff7a1e, dropped for hot inks)
  → #fff0c8; lavafalls #ff8a1e / #ffc84a; rind (0.82, 0.80, 0.76) linear; basalt #646870 / #73777e; pumice #bdb8ae /
  #8f8a80; needle #c8202a; beacons #ff1206 / #f4f6ff; fizzles #ff7424 sparks / #5e524c ash.
- **Keep the region's surfaces at sRGB luminance ≥ 0.35** (rule 38; lava-audit.js checks it).
- **The region is fitted at load** against the layout's blocks (one half, turned): new banks are picked up; re-run
  lava-audit (rules 45 and 44) after the art. **Anything that changes the lake's shores changes rule 44's list.**
- **Boss Battle has no Surge Gauge** (its own variant): a boss-mode landmark must stand outside the boss's 2.9 m wall
  clearance on the island and causeways; the terraces and stairs are not its ground (`maxRise`).
- **Surface** `SURF_FS`; **level band** (glaze ×0.66–0.74, rind ~6 cm, glow, front, hot band, warning pulse); **particles**
  (embers up in rises, steam down only on the way down; they live on the look's own clock); **lavafalls** are flat curtains
  (the eng-lavafall front / side pictures show them).
- **Not built**: the chains, the pig beds' glow, the Bellows Vent plume, the red under-light; the far scenery; the Organs'
  look. **Lightmap**: none baked for any caldera variant yet.
