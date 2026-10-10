# Highmark Foundry: the lava engine (the Bellows' breath) — after fix round 2

The lava is a registry stage module (key `lava`). Fix round 2 answers the second independent review (`LEAD-REVIEW.json`,
verdict REDO: 4 major and 5 minor issues). Everything ran on this Mac, one Electron instance at a time under the shared
SLOTS=3 lock, WATCHDOG=900000, because the Mac mini is down. Nothing is pushed.

Worktree: /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera. Fix-round-2 commits: e301dabc …
38b430a7 (listed in §5). At the final code:
- lava.js **55 / 55** at the final code (F7 / F8 now count every lava death; G1 samples the stone's line to the end;
  F9b new).
- lava-bots.js (new; ENGINE §6 step 8, 20 trials per scenario on both halves, every lava death counted): ledges 0 / 120,
  stones 1 / 120, edges 5 / 120 at the final code — from 16 / 108 at its first run this round. Not 20 of 20 everywhere:
  §6 says what is left.
- Bot matches at the final code and one step before: 7 matches (3 Turf War, 4 Zone Control), **1 lava death** (knocked in
  off a special's landing, attacker credited), no sea falls, a lookout held in 6 of 7; stuck 0.1–1.4 %.
- boss-check.js **5 / 5** (was 4 / 5): home ground 463 m² (was 222), roams 74 m.
- lava-audit.js 8 / 10: rule 45 down from 50 bad outline points to 1; rule 44 is the lead's decision (§0 issue 4).
- net-lava.cjs 12 / 13: the late joiner's grid now equals the host's exactly; the guest's differs by 1 cell of 438,753.
- Regressions: world-build Caldera / Halyard 5 / 5, stage-mods 36 / 36, bot-sight 13 / 13, deployables 34 / 34,
  bot-climb (Lockgate) 7 / 7, a Halyard bot match clean; check-maps ok.

## The user's note ("from the top down it looks familiar")

It came with this run again. The binding record says it is about Bluestone: `stages/STAGE-RULES.md`, "The lead's
correction (2026-10-10)" — "The user looked at the round-B top-downs next to Crossroads Market and was still not
satisfied" — and Bluestone was rebuilt as a kinked Z because of it. The lead then passed Highmark's round-B blockout
("two interlocking crescents round the lava lake") after looking at the pictures. The reviewer asks whether the note
could be about Highmark, because its top-down still has a round island inside a ring of lava between two spawn ends
(the motif the blockout reviews compared to Craters and Gulper Aquarium). I did not change the stage's macro shape: that
is the lead's call, not an engine fix, and the record ties the note to Bluestone. What the lead needs to answer the
reviewer's question is already in the branch: `out/blockout/r3-shape-sheet.jpg` puts Highmark (LOW and HIGH) beside
Gulper Aquarium, Craters and Halyard at one scale, with the walkable-floor footprints (Highmark's is an S / Z; Craters'
a rounded blob; Aquarium's a skewed band) — the shared part is the round mid island, not the outline. **The lead should
confirm with the user which stage the note meant before the art phase.**

## 0. Fix round 2: each issue, what I did, the proof

**1 (major) Bots still walked off into the lava, and the bot tests were flaky and skipped deaths. Fixed; the tests now
count every death, repeated 20 times on both halves.**

The reviewer's cause was right, and it was not the only one. I rebuilt the repeated trials first (with a frame trail for
every death) and fixed what they showed, one cause at a time:

| cause (what the trails showed) | fix |
|---|---|
| botAct / the personal line / the claim read the bot's node with `nav.nearest()`, which on a dry edge returns the drowning floor 1.2 m below: escapes planned from the floor below steered bots off the edge | `StageLava._foot(a)`: what the actor stands on, from its own feet — the ground block's stone (a rider) until it sinks; else, with the feet below HIGH + kill in the region, the static node within 0.5 m of the feet; else dry. Used by botAct, `_mine`, `_lookPlan`, `_lookAct`, `_escapeShove` |
| escapers ending on the same edge node shoved each other back in (the match's soft push moves bodies with no velocity, so no guard sees it) | escapes end on the nearest **inland** node (dry, every neighbour dry, floor all round within 1.25 m; `navMeta.safe`), walked on while dry; `noPush(a)`: no soft push within ~1.25 m of open lava (the glow's proximity field at the current level) |
| duel dodges, stuck hops and kit hops at run speed fly 4–6 m: bots hopped off the causeway into the drowning Casting Floor mid-fight | bots.js: no hop whose ballistic arc (walls stop it) comes down on the sea or the lava; no dodge / stuck / kit hop within 3 m of either; a twins / dualies roll only where its slide stays dry (a route's hop lets go of the trigger); a hop up onto something only where a nav node stands (a roof stub on the lookout slid a holder into the lake) |
| air control bent flights over the lava | bots.js: in the air, when the arc as flown would come down wet, steer back the way it came |
| stepping down a 0.1 m coping lifts the body off the ground for a frame and the edge guard skipped it; momentum carried bots over narrow copings | bots.js: the edge guard runs a frame off the ground (≤ 0.35 m over it), brakes against momentum (where the body is carried in 0.3 s), recentres a body hanging off a lip, and on a tip (half a 0.55 m ring wet) steers back to the floor |
| a Pumice stone sinks with the lava, so the level's reach called it dry: a duelling bot stepped from the island onto Race 7 1.3 s before it sank | `wet()` calls a stone's top wet when the stone won't be up `ahead` s from now |
| a Torpedo or Waddle threat held the bot's aim, and bots.js then skipped the stage's `botAct`: no escape at all | `stageUrgent` (set by the lava while the bot stands on floor it takes, on a stone, or escapes): bots.js runs the stage's `botAct` ahead of the threat's footwork |
| the escape's hop out was stopped at the step's foot by the guards (the floor under the step's coping reads as lava in the last seconds, a sunk stone's seam as void); a stone that sank 1 m below the head needed the hop from 2.3 m out | `guardOff` for the module's straight run at a step up (only where the line there is floor all the way), reaching 3 m out |
| in enemy ink a jump reaches 0.73 m, not the step's 1.2 (a roller hopped at the causeway's foot until the lava had it) | the escaper stands and inks its feet (aimed back down behind it), then hops |
| a charging charger crept off a sinking stone at 1.8 m/s; a route that ran out never re-planned; a next node past a hop's reach | slow-firing kits let go of the trigger while escaping; re-plan when the route is exhausted; step back to the node a hop reaches |
| the Horn Step's tip by the north Slump head — the walk-off at (−19.4, 8.4…9.9) — was a 0.1–0.4 m finger of bare 1.2 floor beside the lava (a tuck column whose higher neighbour's coping was pulled back from the acute tip); bodies stood on it by their foot's edge | `caldera/ground.js`: a coping is not pulled back from an acute corner next to a tuck; the tip is a clean 1.4 m coping wedge (0.1 m ground maps before / after below) |
| a wall climb planned up a moving column's side; a lookout holder's run-speed footwork carried it off the top | no climb edge onto a rider node; the holder's footwork at a walk, kept 0.9 m inside the top with its momentum |

The Horn Step's tip at t 41.3, 0.1 m columns (x −21.5 → −17.5), `L` ladle road 2.4, `#` coping, `=` floor 1.2, `.` lava:

```
before                                         after
 9.5 LLLLLLLLLLLLLL##==.......................  LLLLLLLLLLLLLL#########..................
 9.0 LLLLLLLLLLLLLL###=.......................  LLLLLLLLLLLLLL#######....................
 8.7 LLLLLLLLLLLLLL####.......................  LLLLLLLLLLLLLL#####......................
```

Proof:
- **`tools/botlab/tests/lava-bots.js`** (new; ENGINE §6 step 8): three scenarios, each 20 trials with 3 bots per team on
  their own half (both halves every trial), brains on, everyone else parked on their pads; **every** lava death of a
  crew bot fails it, with its trail. ledges = the drowning ledges at the rise warning (24.7 → 44.7); stones = every
  stone of both Races, race6 / race7 included, at the fall warning (58 → 79); edges = dry 1.1–1.5 m edges over the
  Casting Floors, the Spillways and the heads (spread by farthest-point sampling, plus the review's two walk-off spots),
  through a rise and then a fall.

| run (this round) | ledges | stones | edges |
|---|---|---|---|
| first run of the new test (after `_foot` only), 6 trials | 8 / 36 | 1 / 36 | 7 / 36 |
| + guards, noPush, inland exits, 20 trials | 4 / 120 | 1 / 120 | 8 / 120 |
| + stone wet, air guard, rolls, 20 trials | 6 / 120 | 0 / 120 | 6 / 120 |
| + hop arcs with walls, tips, enemy ink, 20 trials | 0 / 120 | 2 / 120 | 3 / 120 |
| + standable landings, air guard off a route's hop, climb exemption (final −1) | 2 / 120 | 0 / 120 | 3 / 120 |
| **final code** (+ the tip guard's columns) | 0 / 120 | 1 / 120 | 5 / 120 |

- lava.js **F7 / F8** now count every lava death (the "dry node" exemption is gone): 7 of 7 and 4 of 4 with no lava death in every full run at the final code.
- lava-match.js keeps a 1.5 s trail for every bot lava death and fails on any unforced warned lava death.
- Bot matches (§4): 7 matches at the final code and one step before it: 1 lava death in all (Zone Control, knocked in off a special's landing in a fall, attacker credited: 0.075 per bot per 3:00 in that match), no sea falls.

**2 (major) The stone's line went out 2.9 s before the stone killed. Fixed.**
- `_mine` (and botAct) read the stone from the ground block under the feet (`a.ground.block`'s `lavaRider`) until it
  sinks, never `nearest()` (which hid the stone once 0.3 m off its nav pose).
- Proof: **G1** now samples the line every 0.5 s with a kid kept still on race1 and on race7 from 61 s to 76.0 s: 31 of
  31 samples show "THE STONES ARE SINKING" on each (lava.js 55 / 55 in every full run since). Bots: the stones scenario above.

**3 (major) Boss Battle: the boss barely moved. Found why, fixed: 5 / 5.**
- Cause: HULLBREAKER's nav marks a cell a wall when a block stands at floor + 1.45 / 2.6 / 3.8 / **5.2** m. The Surge
  Gauge's two tie girders (6.0–6.9 m) stand 4.8 m over the island: walls, and with the 2.9 m clearance they cut the
  island in two. The home ground was half the island and one causeway (222 m²). The lamp plinths, the Organs and the
  Pour Floor were not the cause (the picture shows both causeways clear).
- Fix: `layout.boss.headroom` (bossNav.js, one tagged option: pieces wholly above it are overhead) = 4.6 m on Highmark;
  the boss's shell tops out ~4.5 m (container y 3.0 + 1.3 + hatch), under the girders.
- Proof: boss-check.js **5 / 5**: home ground **463 m²** (the island and both causeways, one piece), it roams **74 m**
  over 9 cells, longest idle 7 s, moves played barrage 12, charge 4, slam 1, crablets 2 (4 stuns). Picture
  `out/fix2/fix2-boss-homeground-before-after.jpg` (green = home ground; pink = too close to a wall).
- Not reached: DESIGN §4.5's "about 1,300 m²". The Lakefronts and heads stay outside it: the boss needs 2.9 m from any
  wall and 1.8 m from any drop, and those crescents are narrow and dressed. Widening them, or a Boss-only variant that
  clears props, is a stage decision for the lead / art phase.

**4 (major) ENGINE rule 44 (no unplanned jumps across lava): not changed — a layout decision, with the evidence for it.**
- The audit at the final code is unchanged: a plain running jump crosses the design's 4.5 m gaps in 3 places per half
  (the south head's corner onto a Lakefront coping, from (∓10.5, 1.2, ∓23.5); the north head's corner onto the Slump
  bay's coping, from (±21.5, 1.2, ∓2.5); the island onto the causeway across the lake corner, from (∓7.5, 1.2, ∓10.5));
  swim jumps out of your own ink cross 5.4–5.7 m gaps (up to 45 m of detour saved), a jump + the Dash Pellet's air dash
  more; and the gap march flags 1,602 (LOW) / 2,212 (HIGH) samples of 0.35–4.4 m gaps — the drains and gutters the
  design floods and terrace edges 3.9 m apart across the Spillway bay.
- Why not decided here: either answer changes the stage — widening means moving the heads' corners, the Lakefront
  copings and the causeway's lake end, which the lead passed in the blockout; accepting means adding routes. No gap width
  this layout can take stops a swim jump (≈ 5.7 m) or a dash jump.
- **My recommendation to the lead:** widen the three running-jump corners to ≥ 5.5 m (trim the landing copings / the
  head and causeway corners), so a plain run + jump never crosses; accept swim and dash jumps as intended skill routes
  (visible, deadly if missed, symmetric), listed for Bazookarp's checker #16 from the audit's output; give bots no links
  (the round-2 hop guard already keeps them from trying); keep rule 44's running-jump check as the gate; decide the
  drains (grate them, or accept them as deliberate step-overs and drop them from the gap march).

**5 (minor) Dry high ground showed "GET OFF THE LOW GROUND". Fixed** (issue 1's `_foot`).
- Proof: **F9b** (new): no personal line anywhere the feet stand at or above HIGH + kill — 29,093 dry spots on a 0.5 m
  grid over the region in the warning, the rise and at HIGH, none with a line; the real kid on the review's six spots
  ((−28.5, 1.3, −6.25) … (−19, 1.1, 15)) gets none.

**6 (minor) Rule 45 (the outline ≥ 0.5 m into every bank). Fixed in the engine: 1 outline point of 284 left.**
- `LavaWorld._fitMask` at load: the drawn region grows outward ≤ 0.75 m into banks (solid at the high mark, top ≥ HIGH +
  0.3) and ≤ 1.5 m over open void (no floor above LOW − 0.5), never onto a floor, never within 0.7 m of a lip (a falls
  polygon), void only from the drawn region or void (never through a bank: it ran on behind the thin back of the Slump
  cliff), against the layout's own blocks only (never prop colliders: every screen must fit the same region — net-lava's
  late joiner differed by 2,418 lava cells until this). The mask, the lava map, the paint clip, the burn, the kill and
  the stain all read it.
- Proof: lava-audit.js rule 45: 50 bad outline points (min inset 0.05 m, 3 open points by the south heads, one under a
  Spillway Bridge) → 1 of 284 (inset 0.2 m at one raster corner of the north head's back, Alpha's side only — its twin passes; min inset elsewhere ≥ 0.7 m; no open points). net-lava's late joiner: 0 of 72,046 lava cells and 0 of 438,753 grid cells differ (2,418 lava cells differed before the layout-only fit).

**7 (minor) Bazookarp: deferred to its merge, as the review's fix says; the dock is pre-wired.**
- `lavaFx.js` `DOCKS.bazookarp = 'karpDock'`: when the finished Bazookarp HUD (karp-face, SPEC §6) sets `hud.karpDock`
  (a column under the clock, like `.iw-zo` / `.iw-tw`), the chip docks there; until then it keeps its Turf War spot.
  The WP1 placeholder in `st-b5-karp` hangs its status line under the timer (`.iw-kst`), so the two would overlap until
  karp-face lands. lava-karp.js (SPEC §5.5) and G7 for Bazookarp need the mode in the branch: not built.

**8 (minor) Steam at rest and in rises. Fixed.**
- `lavaFx.js`: ambient steam only on the way down — the fall's warning (0.5), the fall (2.6), the first 6 s of the ebb
  fading out; none at HIGH, none in a rise or its warning, none at rest at LOW. Shot / bomb / device fizzles are ember
  sparks (#ff7424) and dark ash (#5e524c), never steam-white. The burn's puffs stay in the ink's colour.
- Proof: pictures `out/fix2/fix2-steam-{high-rest,rising,falling,ebb-3s,low-rest}.jpg` and `fix2-fizzle-high.jpg`
  (the same view from the south Slump head, each after enough seconds for the last scene's particles to die): no white steam at HIGH rest, in the rise or 20 s into LOW; billowing steam and the orange band in the fall; a few puffs fading 3 s into the ebb; the fizzles are small orange sparks and dark ash.

**9 (minor) Slump crossings and the 7.4 ms frame.**
- The 7.4 ms lava update did not come back: lava-perf.js now breaks the update's worst call down by part; over 8 windows
  (LOW, rise, HIGH, fall, twice) the lava update's worst single frame was 1.0 ms (its parts: the look 0.9, the riders
  0.5, the burn 0.6), the burn test's 0.5 ms; one whole frame of 394 ms at LOW with the lava's update at 0.2 ms — a
  GC / shader-compile pause, not the lava. Nothing to spread.
- Crossings: 9, 7, 6 in the three final Turf War matches (target ≥ 4); 0, 1, 1, 3 in the Zone Control matches, as in round 1 (2–6): Zone Control keeps its fights at the zones. Left for the Mac mini balance pass, schedule data first, as the review says.

## 1. What I built, rule by rule
**The level**
- One horizontal surface covers the region: the lake, both Spillways and both Slump bays. It is mirrored, drawn
  0.5–1.1 m into every bank and fitted to the level at load (fix round 2, `_fitMask`: ≤ 0.75 m further into banks, ≤ 1.5 m
  over open void, never onto a floor or past a lip, from the layout's own blocks only).
- LOW is −0.6 and HIGH is +0.8.
- The level is a pure function of the shared stage clock (lavaCore.js `lavaSchedule` / `lavaAt`).
- Each move takes 10 s on a smoothstep, peaking at 0.21 m/s, after a 10 s warning.
- The region is a 0.25 m mask texture (R) with two proximity channels (G at LOW, B at HIGH) for the glow. The level
  shader, the lava surface, paint, nav and the minimap read it.

**Schedules** (A1–A3)
- Turf War 3:00: rises at 35 s and 110 s, falls at 70 s and 140 s.
- Turf War 1:30: rises at 30 s, falls at 55 s.
- Zone Control, Tower Command and Bazookarp: rises at 35 / 125 / 215 s, falls at 80 / 170 / 260 s, never a fourth rise.
- Every match ends at LOW; Turf War has at least 25 s of LOW at the end.
- Nothing moves in the first 30 s or the last 12 s.
- Overtime holds: a move already running finishes, a pending warning is cancelled, and the callout says "LAVA HOLDS" (H1).
- Practice loops 20 / 35 / 35 and the menu backdrop 8 / 15 / 15, picked by the match flags.
- Boss Battle is held at LOW, and the riders are placed before BossNav builds (H3).

**Notice** (A6): the ledges become deadly 13.8 s after the rise warning starts and are dry again 16.2 s after the fall
warning starts.

**Touching lava kills** (B1–B3)
- Feet below L + 0.15 inside the region splat you, cause `lava`; the attacker is credited if they hit you in the last 4 s.
- Dropping into the lake at LOW is cause `lava`, and so is falling over a Spillway lip into the chute.
- No walk-off edge reports the sea (663 edges from every nav node).
- The death card says "Burned in the lava" or "Knocked into the lava", with a lava icon and a #a3121a flood.

**Covered ground is gone** (C6)
- Once the surface is 0.05 m over a floor, that floor's collider switches off; it comes back after the fall.
- No ink lands under the surface (`setClip`; the clip reads the furthest stage time reached).
- The 13,132 cells always under LOW are retired: never turf.
- Ink is burned off as the surface climbs, on the furthest stage time reached (§0, issue 5): grid cells plus an atlas
  pass. After a fall the ledges take ink again (D1, D2, D4).
- The Organ decks take ink but are never turf. The stones never take ink (D3). The lookout's inkable sides take none
  under their waterline and lose what a fall carries under it (E6).

**The Pumice Race** (C1, C2, C5, C10)
- While up, a stone's top is L + 0.45; relative to the lava it moves from −0.45 to +0.45 over 2.4 s.
- It becomes solid exactly when the shelf becomes deadly and stops exactly when the shelf dries: checked every frame.
- Peak speed while solid is 0.58 m/s. A kid still on a stone when the shelf dries splats at 76.2 s, after 16 s of warning.
- Race 3's boulder heaves up and sinks back with its stone's solidity (collider and mesh).

**The Organ Pipes** (C3, C4): tops linear in L (A 1.4 → 2.35, B 1.8 → 3.5, L 2.3 → 4.65), each one hop (≤ 1.15 m)
above the one before, starting from the island; three turned boxes each, dynamic level blocks; they carry kids (never
airborne over 0.1 s). 36 rider parts (cap 40).

**Devices** (E1–E3, E6)
- On every move the device owner's screen sweeps 4 times a second: mines, beacons and sprinklers the lava reaches go with
  no blast (`device:down` how `lava`), and a device riding a socketed Organ past its rim is crushed (how `crush`).
- `R.noPlace` refuses placement where the lava will be within the warning + the move + 1 s.

**Shots and super jumps** (E4, E5): shots, bombs and thrown subs fizzle at the surface; `liquidY` is L inside the region;
a super jump that would land under the lava lands on the nearest node that will be dry (≤ 12 m), else on the pad.

**Rising and falling are announced as opposites on every channel** (C7–C9, G1–G7)
- Surge Gauge: needle EBB → HIGH MARK (7 m on the mid boards); beacons off / flashing red / steady red / flashing white.
- Sound (sfx-lava.js, synthesized; rise and fall share none): bell, rumble, ticks / siren up, eruption, pops, lock / two
  whistle blasts / siren down, hiss, drain / the all-clear whistle.
- HUD chip under the timer (Turf War) or as the last row of the mode's own HUD (Zone Control, Tower Command): "▲ SURGE n"
  → "RISING ▲" → "HIGH · falls m:ss" → "▼ EBB n" → "FALLING ▼" → "LOW · surge m:ss", its fill within 2 % of the level.
- Callouts: "LAVA RISING" / "Off the low ground: n" (counting down), "SURGE!", "HIGH MARK", "LAVA FALLING" / "The stones
  sink in n" (counting), "EBB" (3.5 s late when it would land on Zone Control's FINAL 30).
- Personal line: "GET OFF THE LOW GROUND → n m" on floor the lava reaches; "THE STONES ARE SINKING → n m" on a stone —
  read from the feet (`_foot`: the ground block's stone until it sinks; dry above HIGH + kill), fix round 2.
- Minimap / TAB map: the ledges hatched and pulsing in the warning; the fill spreads as the lava rises (incremental).
- World: the rind pulses red before a rise and pale before a fall; a seething front climbs the walls and a hot band
  follows the surface down (both only on faces in or over the lava, G8); embers stream up in a rise, dense steam billows
  down off the leaving floors in a fall and only then (its warning, the fall, the first 6 s of the ebb); fizzles are
  ember sparks and dark ash; the stones crack (charred, ember-lit fissures) before they sink; the Organs
  shed rubble; a 0.25 shake when a rise starts; heat shimmer at quality high.

**The stain line and the lava's look**
- Level shader band (program key `inkwave-level-v8-lava`): below the mark every face in the region is glazed and darkened
  (×0.66–0.74, roughness 0.34) — readable now on the mid-value rock (rule 38); an ash-white rind ~6 cm tall at the mark;
  the glow only on faces that look at the lava and stand near open lava.
- Painted HIGH MARK dashes at 0.81–0.89 m on the causeway faces and quay walls.
- Lava surface: dark crust (#3b1f1a / #4a2219) in plates, lit seams crimson → scarlet → white-hot (seam width 0.36: lit
  share 33–38 % at rest); the orange band only for matches with no orange / red / gold ink; full orange only on the lavafalls.

## 2. Decisions where the request left a gap

1. **No `G.deploy.crushIn` in this branch.** The sweep walks `G.subs.items` itself and switches to
   `S.crushIn({ where }, 'lava')` once crushIn exists.
2. **Bot timings are more cautious than ENGINE.md** (1/5 s per route metre, +60 when shut within 4 s of arrival, escape
   below escD / 4 + 3.5 s).
3. **The lookout claim** (round 1): one claimant per team, on its own side's lookout, from the rise warning to the fall
   warning; long-range kits first, else the longest reach ≥ 10 m. The lead may prefer chargers only.
4. **The EBB callout deferred, not the schedule moved** (round 1).
5. **Fix round 2, bots:** an escape ends a step inland, not on the edge's lip; bots never hop (dodge, stuck, kit) within
   3 m of the lava or the sea and never steer a flight down onto either; slow-firing kits (charger, splatling, spinner,
   bow, roller) stop firing while they escape; there is no soft push within ~1.25 m of open lava, for players too (nobody
   can be body-shoved off a lip). DESIGN §3.7's "still shooting" holds for the other kits.
6. **Fix round 2, the region:** fitted to the level at load from the layout's blocks (rule 45), so the hand-drawn
   polygons no longer have to meet every bank exactly.
7. **Fix round 2, the stage:** copings at acute corners next to a tuck are no longer pulled back (11 copings per half);
   `boss.headroom` 4.6.
8. **Shared files touched:** bots.js grew several tagged guards (§5); bossNav.js got one option. They act on every map
   (the sea is "wet" to the same guards); the regressions in §4 cover them.
9. **Rule 44** is left to the lead, with a recommendation (§0 issue 4).
10. **The lava's callouts overlap the docked chip for 3.2 s** in Zone Control / Tower Command (shared callout spot).

## 3. Online and bots

**Online** — no new network record. The level, warnings, riders, absent floors, nav windows and the burn are pure
functions of the stage clock; the burn and the clip run on the furthest stage time each screen has reached. The region
fit reads only the layout's blocks, so every screen in a room fits the same mask. `noPush` is local (the soft push is
each screen's own). A squidkid's lava death is judged by its owner; a device's removal by its owner. Splats near the
region carry the painter's stage time (field 15).

net-lava.cjs (12 / 13 at the final code): Turf War 1:30, the level agrees within 0.03 m over 147 samples; the pinned guest dies by lava at
33.89 s (the deadly moment 33.8) and the host's feed shows it; its devices are gone on both screens; lava cells 99.98 %
identical (17 of 74,464, on the waterlines where the test paints); the same result at time-up; Practice's late joiner at
HIGH agrees with the host (level, stones) and its whole imported grid equals the host's (0 of 438,753 cells; 0 of 72,046 lava cells); the guest's grid differs from the host's by 1 cell (172 vs 171 inked, on the cliff the test paints across the waterline) — that one cell fails the check; the host leaving mid-rise: the new host's fall at 55 ± 0.4 s,
the stones deadly at 61.2 ± 0.4 s on both remaining screens.

**Bots** (they know only what the HUD shows):
- Nav: built at both rider poses and merged, explicit step links over every rider seam; no leap edges (F1, F2); windows
  at arrival time (F3); `nearest()` never returns a sunk stone (F4); the Organ climb at both levels (F5) and with the grid
  shifted 0.25 / 0.5 m (rule 46); floor nodes only where the lava reaches the feet (F9); no wall climb onto a rider.
- What a bot stands on comes from its feet (`_foot`), never from the nearest node.
- Escapes: to the nearest inland node, over any stone still up at arrival, re-planned when the route runs out; the hop
  out steered by the module (guards off on a clear straight line ≤ 3 m), inking its feet first in enemy ink.
- Guards (bots.js): edge guard with momentum, a frame off the ground, lips and tips; hops by ballistic arc; rolls by
  their slide; no near-lava dodges; air steering; a stone that won't be up is wet; the stage's botAct ahead of threats.
- Lookouts: the claim (round 1), the holder's footwork at a walk inside the top.
- Leaps and lunges never onto floor the lava takes (round 1).

## 4. Tests, pictures, balance

**lava.js** 55 / 55 at the final code (and in four earlier full runs this round; one run failed F10 because a frozen autopilot P1 held a claim: the test now gives it its brain) (55 checks: round 1's 54 plus F9b; F7 / F8 / G1 made stricter).
**lava-bots.js** (new) ledges 0 / 120, stones 1 / 120, edges 5 / 120 at the final code (16 / 108 at its first run this round). **lava-audit.js** 8 / 10 (rule 44: the lead's decision; rule 45: 1 raster point of 284). **net-lava.cjs** 12 / 13 at the final code. **boss-check.js** 5 / 5.
**lava-perf.js**: the lava update ≤ 1.0 ms in every window (median 0.07–0.14 ms); draw calls 67–109.

**Regressions** (bots.js, bossNav.js and the stage changed): world-build Caldera 5 / 5 and Halyard 5 / 5; stage-mods 36 / 36; bot-sight 13 / 13; deployables 34 / 34; bot-climb (Lockgate) 7 / 7 (5 / 7 before the climb exemption — fixed; 7 / 7 on the pre-round-2 bots.js too); a Halyard Turf War bot match: no sea splats, stuck 0.7 %, no console errors; check-maps (`WIPSTAGES=1`) caldera ok (Halyard's
one ramp issue predates this branch: the same with my changes stashed).

**Bot matches** (lava-match.js, all bots, the full schedule, the final or near-final code):

| match | code | lava deaths | sea | lookout s at HIGH (team A / B; long-range) | stuck % (longest) | Slump crossings |
|---|---|---|---|---|---|---|
| turf | final −1 | 0 | 0 | 0 (7 claims, none up) | 0.36 (—) | 6 |
| turf | final −1 | 0 | 0 | 35.0 (10.2 / 24.8; 9.6) | 0.19 (—) | 7 |
| zones | final −1 | 0 | 0 | 5.0 (2.7 / 2.3; 2.3) | 1.31 (10.75 s, beside Bravo's Organs: the tip guard read the columns as drops — fixed in the last commit) | 3 |
| zones | final −1 | 0 | 0 | 50.6 (10.2 / 40.4; 50.6) | 1.36 (2.75 s) | 1 |
| zones | **final** | 0 | 0 | 19.1 (0 / 19.1; 19.1) | 0.24 (—) | 0 |
| turf | **final** | 0 | 0 | 19.2 (7.4 / 11.8; 18.3) | 0.10 (—) | 9 |
| zones | **final** | 1 (fall, knocked, a special's landing) | 0 | 69.4 (24.5 / 44.9; 69.4) | 0.67 (2.75 s) | 1 |

Earlier in the round (before the hop-landing and air-guard fixes, which had broken the lookout climb): 4 Turf War and
3 Zone Control matches, 0 lava deaths, lookout held in 2 of 7. ("final −1": everything but the last commit, the tip
guard's columns.)

**Pictures** (`out/fix2/`): fix2-boss-homeground-before-after.jpg; fix2-steam-high-rest / -rising / -falling /
-ebb-3s / -low-rest.jpg; fix2-fizzle-high.jpg. Earlier: `out/engine/eng-*` (40), `out/fix1/fix1-*`.

Balance sets were skipped, as COMMON.md says.

## 5. Commits and shared files

**Fix round 2:** e301dabc, 1719595c, 8ffe1772, e9471da2, c93fffc6, 0953eb57, bce60cf8, ca0379c4, 1648ef09, 6640895d, a6f3210f, da70682b, b33f84b4, f3169229, 38b430a7 (and the scratch pictures commit after them).

**Shared files** (all tagged `[b5-caldera]`):
- `src/game/bots.js` — `_tail`: the edge guard's call (momentum, a frame off the ground, `guardOff`), the hop guard
  (`pathHop`, rolls, near-lava ring), the air guard, `_lastFoot`; `_hopSafe` (ballistic arc, walls, `_standable`),
  `_standable`, `_rollSafe`, `_arcWet`, `_nearWetHi`, `_wetHi`; `_edgeGuard` (momentum brake, lip recentring, tips); the
  stage's `botAct` call runs while `stageUrgent`; `_wv`.
- `src/boss/bossNav.js` — `layout.boss.headroom` (the wall samples).
- Round 1 (unchanged): docs/NET.md (one paragraph); `kits/mitts.js`, `kits/blade.js` (one line each).

**Module files:** src/game/lava.js, src/game/lavaCore.js, src/world/lava-data.js, src/fx/lavaFx.js,
src/audio/sfx-lava.js. **Stage files:** caldera/lava.js, layout.js (colours, copings, plinths, sand bin, boss headroom),
ground.js (copings at acute tuck corners), geo.js (the region's outline), props.js. **Tests:** tools/botlab/tests/lava.js,
lava-bots.js (new), lava-audit.js, lava-look.js, lava-look-report.py, net-lava.cjs, lava-match.js, lava-perf.js,
lava-hud-scenes.js.

## 6. Unfinished, flaky or uncertain

- **Rule 44** — the lead's decision (§0 issue 4); the audit still fails it.
- **Boss home ground** 463 m², not DESIGN's ~1,300 m²: the Lakefronts are too narrow and dressed for the boss's
  clearances (§0 issue 3).
- **Bazookarp** is not in this branch: the dock key is pre-wired, lava-karp.js and G7-for-Bazookarp are not built.
- **The bots.js guards act on every map.** The regressions above passed; the Mac mini's consolidated pass should watch
  stuck % and duels near the sea on the other stages (bots no longer dodge-hop within 3 m of water).
- **The repeated bot trials are not 20 of 20 in every scenario** (§0 issue 1: 6 of 360 bot-trials at the final code).
  The last ones: three duelling bots walking off the **tip of Bravo's Horn Step coping** (19.4, 1.4, −8.6) — the corner is
  a narrowing point the bots still walk out to; the art phase should blunt it (end the Horn Step where it is ≥ 0.9 m
  wide; the region fit now fills the void left with lava); an escaper too slow off the Bravo Casting Floor's twin; a
  Sponge Mitts leap landing short of the island in the lava (round 1's landing check reads the stage's `wet`, but a
  leap's real landing falls short of its aim). One step before: a squid surfacing at swim speed off the Spillway ford at
  LOW, a bot walking off the bank by the Spillway Bridge. All are fights at the lava's edge in a stress test that parks
  bots on the edges; the matches had one (knocked) lava death in seven.
- **net-lava cells** are 99.98 %, not exact (17 of 74,464, at the waterlines where the test paints): unproven, a splat
  record's 1 cm rounding.
- **Lookout use** varies with the kits a team draws (a team of short-range kits has no claimant by design).
- **Not built:** the stones' chains, the pig beds' glow, the Bellows Vent plume and ash burst, the red under-light at
  HIGH, the far scenery; **not done:** the lightmap bake with the lava.
- **The harness profiles run at quality 'low'.** The fix2 scenes rebuild the particles as at 'high'.
- **The user's note** — which stage it meant is for the lead to confirm (top of this report).

## Module API

**Registration.** `registerStageMod({ key: 'lava', order: 20, worldAs: 'lavaWorld', matchAs: 'lava', liquid: true, world:
LavaWorld, match: StageLava })`, active when `LAYOUT.lava` exists (DESIGN §3.2's format: `low`, `high`, `region`, `falls`,
`timing`, `schedule`, `mirror`, `riders`, `steps`, `gauges`, `cascades`, `vents`, `flotsam`, `look`, `text`).

**Pure core** (lavaCore.js): `LAVA`, `lavaSchedule`, `lavaAt`, `lavaY`, `lavaMax`, `crossTime`, `stoneRel`, `riderTop`,
`expandLava`, `partPose`, `inRider`, `pointInPoly`.

**World** (`G.lavaWorld`): `inRegion`, `fallsIn`, `box`, `mask` (fitted at load: `fitAdded`), `map` (R region, G / B glow
proximity at LOW / HIGH), `uniforms`, `drown`, `floorY`, `riders`, `navMeta { kind, shutY, rider, pose, top, escD, exit,
safe, safeD, reach }`, `proxAt(x, z, y)`, `proxMs`, `look`.

**Match** (`match.lava`): state `clock`, `y`, `st`, `tMax`, `burnY`, `state()`, `stats { deaths, byTeam, warned, burned,
devices, lookout, lookTeam, lookLong, lookClaims, lookHold, lookLog, … }`; queries `surfaceAt`, `liquidY`, `under`,
`covers`, `wet`, `burns`, `noPlace`, `danger`, `inkClip`, `restMask`, `maxOver`, `yAt`, `_foot(a)` (what an actor stands
on); tests `debugT(t)` and `?lava=low|high|rise|fall`.

**Registry hooks served:** update, seek, dispose, kill, fallCause, superJumpLanding, noPush, navEdge, navNode, goalWeight,
beforePath, botHold, botAct, wet, under, fizzle, liquidY, noPlace, restMask, danger, sweeps, splatTime, onSplat, drawMap,
hud, state. **Bot fields it sets** (bots.js reads them): `stageUrgent`, `guardOff`, `_needJump`.

**Events:** `lava:warn`, `lava:move`, `lava:rest`, `lava:hold`, `lava:set`, `lava:rider`, `device:down` (how `lava` /
`crush`), `shake`; cause `lava`. **Sounds:** lava_rumble, lava_erupt, lava_hiss, lava_drain, lava_sizzle, lava_pop,
lava_lock, lava_tick, lava_bell, lava_siren_up, lava_siren_down, lava_whistle.

## For the art phase

- **Palette** (`LOOK` in lavaFx.js): crust #3b1f1a / #4a2219; seams #a3121a → #e0301e → (#ff7a1e, dropped for hot inks)
  → #fff0c8; lavafalls #ff8a1e / #ffc84a; rind (0.82, 0.80, 0.76) linear; basalt #646870 / #73777e; pumice #bdb8ae /
  #8f8a80; needle #c8202a; beacons #ff1206 / #f4f6ff; fizzles #ff7424 sparks / #5e524c ash.
- **Keep the region's surfaces at sRGB luminance ≥ 0.35** (rule 38; lava-audit.js checks it) so the stain reads.
- **The region is fitted at load** against the layout's blocks: new banks are picked up; re-run rule 45 after the art.
- **Surface** `SURF_FS`: Worley plates, seam width 0.36 + 0.07 rise + 0.06 warn − 0.1 fall; clipped to the region.
- **Level band**: below the mark glaze ×0.66–0.74; rind ~6 cm; glow exp(−3.2 h) × (1 − 0.9 up) × proximity; the front
  and the hot band; the warning pulse; ink dims the glow; props get the darkening and rind (`patchStain`).
- **Particles**: embers 0.12–0.26 m (up, in rises), steam 1–2 m (down, only on the way down), 150 / 300 / 600 by quality.
- **Not built**: the chains, the pig beds' glow, the Bellows Vent plume, the red under-light; the far scenery.
- **Lightmap**: the drowned floors bake with the stain; the riders are dynamic.
