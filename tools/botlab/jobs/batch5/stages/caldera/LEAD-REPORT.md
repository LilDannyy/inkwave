# Highmark Foundry: the lava engine (the Bellows' breath) — after fix round 1

The lava is a registry stage module (key `lava`). Fix round 1 answers the independent review (`LEAD-REVIEW.json`,
verdict REDO, 4 major and 8 minor issues). Everything ran on this Mac, one Electron instance at a time under the shared
SLOTS=3 lock, WATCHDOG=900000, because the Mac mini was down. Nothing is pushed.

Worktree: /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera. Fix-round commits: 60da45cf … f86175ce
(listed in §5). At the final code:
- lava.js 54/54 (twice at the final code) (54 checks: 45 before, plus C10, D4, E6, F9, F10, G7, G8, H4, H5 and the extended G2 / G5).
- lava-audit.js (new, ENGINE §6 step 12) 8/10 (rules 44 and 45 fail: §6).
- net-lava.cjs 13/13 (two runs: 12/13 then 13/13 after its joiner check was made meaningful; below).
- lava-look (new): the palette pictures and the lit-seam / hue / chroma report lit seams 33–38 % at rest (12 of 15 shots ≥ 35 %), 53 % rising, 26 % falling; every palette's inks louder than the lava (chroma 0.71–0.92 against 0.51–0.56).
- Regressions: world-build Halyard 5/5 and Caldera 5/5, stage-mods 36/36, net-stagemods 10/10, a Halyard bot match
  (no console errors); check-maps ok for all four Caldera variants.
- Bot matches at the final code: 8 Turf War and 1 Zone Control at or within one safety change of the final code: a lookout used in every one (9.4–43.4 s in Turf War, 66.3 s in Zone Control); 3 lava deaths in 42 bot-matches of 3:00, 0.07 per bot per 3:00 (target ≤ 0.25); no sea falls.

The user's note relayed with this run ("from the top down it looks familiar") reads as aimed at Bluestone against
Crossroads Market, as the reviewer also read it; Highmark's shape was not re-judged here.

## 0. Fix round 1: each issue, what I did, the proof

**1 (major) The lava chip covered Zone Control's and Tower Command's own HUD. Fixed.**
- In those modes the chip is appended as the last row of the mode's own HUD column under the clock (`hud.js` `.iw-zo` /
  `.iw-tw`, flex columns), so it sits under the zone chip, the shift line, the overtime bar, the tower track and its
  status whatever they show; Turf War keeps it where it was. `lavaFx.js` `LavaHud` (`DOCKS`, `.lv-chip.is-docked`; the
  tower dock 0.8u lower, the token hangs below the track).
- Proof: lava.js **G7** reads the DOM boxes in Zone Control and Tower Command at the warning, the rise, HIGH and in
  overtime: the chip's parent is the mode's HUD and it overlaps none of its parts (first run: one 7 px² overlap with the
  tower token → the extra margin). Pictures `out/fix1/fix1-hud-{zones,tower}-{warn-rise,rising,high,warn-fall,overtime}-top.jpg`
  and the two overtime full frames.
- Left as is: the lava's own callouts ("LAVA RISING", "LAVA HOLDS") use the HUD's shared callout spot, which in these
  two modes now overlaps the chip for the callout's 3.2 s (see fix1-hud-*-overtime.jpg). They say the same thing.

**2 (major) The 1.10 m copings were "low ground". Fixed.**
- `buildNav` marks a static node lava floor only when the lava can reach the feet: `y < HIGH + kill` (navLead still
  times its window). The 20 coping nodes are dry floor and ways out now.
- Proof: **F9**: no lava-floor node at or above HIGH + kill (was 20), all 20 copings kind 0, and a kid on the coping at
  (5.5, 1.1, −22.5) gets no personal line at HIGH, in the warning or in the rise (the review's probe P2 got one).

**3 (major) Bots never climbed the lookout. Fixed: the lookout is a planned objective.**
- `_lookPlan` (every 0.5 s on the screen that runs the bots): from the rise warning to the fall warning, each team's best
  long-range bot (charger 3, splatling / spinner / bow 2.5, else a kit with ≥ 10 m reach) claims its own side's lookout,
  walks to the climb's foot, goes up as the HIGH pose opens and holds the top, fighting and painting from there; if it
  runs dry it refills on the deck; no hops or rolls up there. A claimant that dies is replaced while ≥ 8 s are left. Its
  route is put back whenever the brain drops it, and is dropped only when the lava shuts it.
- Proof: **F10** (from the pads, brains on: both claimants up and holding ≥ 3 s, released at the fall warning) (two runs at the final code: claimants up at 49.6 / 50.1 s holding 11.4 / 10.9 s; up at 55.6 / 49.7 s holding 5.1 / 10.3 s);
  bot matches, seconds anyone stood on a lookout at HIGH (organL + organL~), per team:

| match | code | lookout s at HIGH (organL + organL~) | team A / B | long-range kits A / B | lava deaths | stuck % | Slump crossings |
|---|---|---|---|---|---|---|---|
| turf-1 | claim v1 | 18.5 | 5.3 / 13.2 | 5.3 / 13.2 | 1 (rise, knocked) | 0.14 | 6 |
| turf-2 | claim v1 | 17.8 | 17.8 / 0 | 17.8 / 0 | 0 | 0.59 | 5 |
| turf-3 | claim v1 | 0.2 | 0.2 / 0 | 0.2 / 0 | 0 | 0.16 | 5 |
| turf-4 | claim v1 | 5.5 | 5.2 / 0.3 | 0 / 0 | 1 (HIGH, knocked) | 0.23 | 12 |
| zones-1 | claim v1 | 60.9 | 60.9 / 0 | 60.9 / 0 | 0 | 1.95 (holds counted as stuck) | 2 |
| zones-2 | route kept | 83.1 | 53.2 / 29.9 | 0 / 29.9 | 0 | 0.35 | 4 |
| turf-5 | from the warning | 20.8 | 4.0 / 16.8 | 4.0 / 15.4 | 0 | 1.08 | 7 |
| turf-6 | from the warning | 10.6 | 9.0 / 1.6 | 9.0 / 1.6 | 2 (HIGH and fall, both knocked) | 0.90 | 5 |
| turf-7 | from the warning | 2.6 | 2.4 / 0.2 | 0 / 0 | 2 (HIGH, a Twinfire claimant rolled off the top: fixed next) | 0.16 | 8 |
| turf-8 | from the warning | 15.5 | 3.3 / 12.2 | 0.3 / 12.2 | 0 | 0.07 | 4 |
| turf-9 | no hops on top | 30.2 | 8.8 / 21.5 | 0 / 21.5 | 0 | 0.21 | 5 |
| turf-13 | stones avoided | 43.4 | 26.1 / 17.2 | 0 / 17.2 | 1 (warning, north Slump head) | 0.47 | 5 |
| turf-14 | stones avoided | 9.7 | 6.5 / 3.2 | 6.5 / 0 | 1 (warning, by Alpha's north head) | 0.10 | 6 |
| turf-15 | final −1 | 16.2 | 14.6 / 1.6 | 14.6 / 0 | 1 (LOW 16.8 s, north Slump head) | 0.21 | 4 |
| turf-16 | final −1 | 16.7 | 0 / 16.7 | 0 / 0 | 0 | 0.17 | 5 |
| zones-4 | final −1 | 66.3 | 32.6 / 33.8 | 25.4 / 33.8 | 0 | 0.82 | 6 |
| turf-17 | final | 9.4 | 0 / 9.4 | 0 / 9.4 | 0 | 0.35 | 5 |
| turf-18 | final | 40.4 | 16.1 / 24.3 | 15.4 / 23.5 | 0 | 0.35 | 5 |

("final −1": everything but the last commit, which keeps a claimant's route off the low ground too. "turf-10…12" were
stopped for that change. No sea falls in any match.)

**4 (major) ENGINE rules without a check. Built: lava-audit.js, lava-look, net-lava's two missing steps.**

| rule | check | result at the final code |
|---|---|---|
| 14 exits ≤ 12 m, never dropping | every drowning node's way out, walked | pass: worst 9.83 m (paper ≤ 10.0), no way out dips more than 0.2 m |
| 22 clear sky over riders | every rider's column, 0.3 m × 0.1 m | pass: nothing over any of the 20 riders |
| 25 lookout exposure | cover per hex edge, open sides, both teams' dry floor, height over its foot | pass: cover 1.0 m along 7 % of the edge (the stub), 5 open sides, both teams' dry floor within 2.8 / 13.3 m, 3.45 m over its foot |
| 38 region surfaces ≥ 0.35 sRGB luminance | every block in the region below HIGH + 0.3 | pass after the stage fix (luminance 0.36–0.65; was 0.28–0.34 on the drowning floors, copings, walls) |
| 39 / R1 seam share, hue, ink loudest | lava-look pictures + report | 33–38 % lit at rest (12 of 15 ≥ 35 %), 53 % rising, 26 % falling; inks louder in all six palettes; lit hue 7–10° |
| 42 no view out shows void | 96 rays below the horizon from both pads and the 24 highest outer spots | pass: 0 of 576 rays meet void |
| 44 no unplanned jumps | gap march over the lava + a physical jump search (run, swim; air dash +3.5 m) | **fail**: a plain running jump crosses the 4.5 m gaps (6 crossings, 3 places per half); list in §6 |
| 45 outline ≥ 0.5 m into banks | every second outline texel | **fail**, much reduced: 50 of 279 outline texels (was 111 of 286), min inset 0.05 m; list in §6 |
| 46 grid-shift rebuild | the nav rebuilt with the grid shifted 0.25 / 0.5 m in x and z | pass: 5 builds, no link problems, every climb and the Race chain present |
| net step 7 | the late joiner's lava cells and whole grid against the host's | 0 differences (net-lava run 2) |
| net step 6 | the host leaves mid-rise in a timed 1:30 | fall at 55.01 / 55.02 s; stones deadly at 61.22–61.23 s on both remaining screens (both runs) |

What the audit made me change:
- **Rule 38:** the region's blockout rock was near-black (glaze #4d4542, dark basalt #4f535a, scoria #5d5450, walls
  #45484e, copings, collars), so the stain's ×0.7 darkening could not read. `caldera/layout.js` K: glaze #6e6862 (ENGINE's
  value), dark basalt #5f636b, scoria #675d58, walls #5f6268, drowning copings #625c58, collars #5f6368.
- **Rule 45:** the outline met the Lakefront's face under each Spillway Bridge and the bay's and Lakefront's copings at
  0.05–0.4 m. `caldera/geo.js`: the Spillway arm's quay side 1.1 m out, the bay shore and horn side 1.0 m, the
  Lakefront arcs and the arm's mouth 0.9–1.1 m into their banks (banks stand ≥ 1.2, so nothing new drowns, takes lava
  ink or counts as lava floor).
- **R1:** the seams were measured at 25–29 % lit at rest (target ≥ 35 %): the surface shader's seam width 0.26 → 0.36.
- **Rule 44 is a design finding, not fixed:** see §6. Physically, a kid's plain running jump crosses the design's
  narrowest 4.5 m lava gaps (Lakefront ↔ south head, island ↔ causeway, both halves): the gap march measured 4.5 m and
  the jump landed on the far coping / the causeway. ENGINE rule 44 and DESIGN §3.5 assumed 4.5 m stops a jump; with
  PLAYER's jump the body reaches ~5 m. Widening them is a layout change for the lead.

**5 (minor) net-lava was flaky. Root cause fixed, the guest pinned.**
- The cause I found: the burn ran on the follower's stage clock, which is not monotone — `StageClock.tick` eases a
  follower back onto the host's clock (up to ~0.05 s a frame when it ran 1.4 s ahead) and snaps back by over 1.5 s under
  load. A level that goes up because the clock went back is no rise, but the burn cleared the ink there that its
  painter kept (on a loaded machine: 194 cells). Now the burn and the ink clip run on the furthest stage time reached
  (`tMax`): a step from tMax burns what the surface passed over it (`maxOver(tMax, t)`, so a forward snap over a whole
  rise burns up to HIGH, which it missed before); a clock going back burns nothing; inkClip clips at the line reached by
  tMax. Late joiners take tMax from their seek; a test's debug jump starts a new timeline.
- The guest is pinned (x / z, its height free) on its pad until it stands on the shelf, and on the shelf until the
  lava has had it; the reviewer's run-1 death at 19.4 s was a knock into the lava before the warning.
- Proof: **D4** (a clock going back 1.5 s in a fall burns nothing; a splat while it is back inks nothing under the line
  reached; a forward snap 30 → 74 burns up to the high mark). net-lava runs: lava cells 99.968 % (21 differ) and
  99.986 % (9 differ, 8 of them on the HIGH or LOW waterline, where the test paints); the bar is 99.9 %. Not proven exact:
  the residue sits where the paint is and is consistent with a splat record's 1 cm position rounding.

**6 (minor) The orange band read the wrong match's palette. Fixed.**
- `LavaLook.update` re-reads the match's team inks every frame (a string compare) and sets the uniform; the colour-blind
  Sun #ffd21a is in HOT_INKS.
- Proof: **H4**: right after a restart on a reused world and for each of the five palettes and the colour-blind one.
  Pictures fix1-tangerine-high.jpg, fix1-cherry-high.jpg.

**7 (minor) A fall barely read in the world. Found why, fixed.**
- Every harness profile here runs at quality 'low' (net tests write it into the shared slot profiles), where the module
  built **no** embers or steam at all: no still by the builder or the reviewer could show them. Low quality now gets 150
  particles (medium 300, high 600).
- Steam: as many as embers, 1–2 m puffs growing 0.6 m/s, 0.55 opacity, ×2.6 the spawn rate in a fall, half of it off
  the drowned floors as the surface drops below them. Embers 0.12–0.26 m (a few pixels at 10–20 m). The stones' fall
  warning: charred fissures with a crimson-ember glow in a net of cracks (a red emissive over the pale pumice read pink;
  a bright glow alone still read salmon).
- Proof: pictures fix1-fall-burst-1…6 (a fall from the south Slump head: warning, cracks, steam off the shelf),
  fix1-rise-embers-1…3. The orange "hot band" following the surface down already read well.

**8 (minor) Race 3's boulder stood in the lava without a collider. Fixed.**
- The boulder heaves up out of the lava over the stone's first 0.12 m of solid travel (~0.3 s) and sinks back over its
  last; its collider is scaled with the same factor and parked while zero; its mesh is separate from the stones'.
- Proof: **C10** (every frame of a rise and a fall: never drawn while the stone is not solid, collider solid exactly
  while drawn, drawn top on the collider's top within 1 cm). Pictures fix1-boulder-1…3.

**9 (minor) Dry mid glowed red at HIGH. Fixed.**
- `_buildProx` writes how near open lava each region texel is, at LOW (G) and at HIGH (B), into the lava map (open = no
  solid at the surface and no floor at or above it; chamfer distance; 1 within 0.25 m, 0 from 1.25 m). The level
  shader's glow and rising front are multiplied by it (mixed by the level). Built in 20–22 ms at load.
- Proof: **G8** (the island's lake faces glow at HIGH, its dry middle and the machine house's foot are 0 at both levels,
  the causeway's side over the Casting Floor only once the floor is under). Pictures fix1-mid-high-glow / -low-glow.

**10 (minor) Ink and devices on the riders ignored the lava. Fixed.**
- The device sweep runs on every move (rise or fall) and on stone flips; a device riding a socketed Organ (A, B) is
  crushed (`device:down` how 'crush') once it passes the socket's rim (read from the static floor round the column).
- The lookout's side ink: burned below the waterline as it climbs the sides in a fall (the column moves 0.95 m against
  the lava), on the same furthest-time rule as the level's; splats on the sides clip at the highest waterline between
  the painter's time and now.
- Proof: **E6** (a sprinkler stuck to Organ A's side at HIGH is crushed at 76.55 s as the fall takes it below the rim;
  378 cells of side ink at HIGH, 0 left under the LOW waterline after the fall, 0 from a splat under it).

**11 (minor) Zone Control's last ebb landed on its FINAL 30 banner. Fixed by deferring the callout.**
- When the rest at LOW comes within 2.5 s of Zone Control's final-centre moment, the EBB callout and the all-clear
  whistle wait 3.5 s. I kept the schedule: DESIGN §3.3's table and §4.2 ("the final 30 s and overtime are LOW") are the
  lead's, and Tower Command / Bazookarp share it.
- Proof: **H5** (FINAL 30 at 270.0, EBB and the whistle at 273.53).

**12 (minor) The minimap spike, the stale countdown, bots stepping off. Fixed / guarded.**
- Minimap: the lava fill is built once per minimap layout (each region pixel's flood height, sorted) and a level step
  writes only the pixels between the old and new level. **G5**: max 0.4–0.7 ms per step over a rise and a fall (was up to
  9.4 ms); the one-time build 27–54 ms.
- The warning callout's number counts down while it shows (**G2**: 10, then 8 two seconds on); the fall's "The stones
  sink in n" likewise.
- Bots: the Sponge Mitts' landing check and the Cutlass's lunge now refuse floor the stage hooks' `wet` says a hazard
  takes (`kits/mitts.js` `landingOk`, `kits/blade.js` `lungeSafe`, one tagged line each); the Twinfire roll and hops
  already asked `_wet`. A claimant on the lookout never hops or rolls (a roll carried one off the top into the lava twice
  in one match). Lava deaths in the matches below: 3 in the 6 Turf War matches at the latest code (0.07 per bot per 3:00), all at LOW or in the rise warning with no attacker, two at a north Slump head's lake corner (±23.8, ∓1.6) — see §6.

## 1. What I built, rule by rule

**The level**
- One horizontal surface covers the region: the lake, both Spillways and both Slump bays. It is mirrored and runs
  0.5–1.1 m into every bank (§0, rule 45).
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
- Personal line: "GET OFF THE LOW GROUND → n m" on floor the lava reaches; "THE STONES ARE SINKING → n m" on a stone.
- Minimap / TAB map: the ledges hatched and pulsing in the warning; the fill spreads as the lava rises (incremental).
- World: the rind pulses red before a rise and pale before a fall; a seething front climbs the walls and a hot band
  follows the surface down (both only on faces in or over the lava, G8); embers stream up in a rise, dense steam billows
  down off the leaving floors in a fall; the stones crack (charred, ember-lit fissures) before they sink; the Organs
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
   below escD / 4 + 3.5 s): at ENGINE's numbers bots drowned in the first escape tests.
3. **The lookout claim (fix round 1).** One claimant per team, on its own side's lookout, from the rise warning to the
   fall warning; long-range kits first, else the longest reach ≥ 10 m; held through fights; refills on the deck. Zone
   Control / Tower Command roles yield to it for that window (the lookout overlooks the centre zone 9–10 m away and the
   own side zone). The lead may prefer chargers only.
4. **The EBB callout deferred, not the schedule moved** (issue 11).
5. **Stage edits in this round:** the region's rock colours (rule 38) and the Spillway / Lakefront outline offsets
   (rule 45); earlier: copings at 1.10 / 1.40 / 1.50, lamp plinths at x ±3, the region at RIM_SHORE + 0.5.
6. **Two shared kit files touched** (one tagged line each): `kits/mitts.js` `landingOk`, `kits/blade.js` `lungeSafe`.
7. **Low quality gets embers and steam** (150): the fall's direction cue was absent at low.
8. **The rule 44 finding is left to the lead** (§6).
9. **The lava's callouts overlap the docked chip for 3.2 s** in Zone Control / Tower Command (shared callout spot).

## 3. Online and bots

**Online** — no new network record. The level, warnings, riders, absent floors, nav windows and the burn are pure
functions of the stage clock; the burn and the clip now run on the furthest stage time each screen has reached, so a
follower whose clock eases or snaps back neither re-burns ink nor lets ink under the line. A squidkid's lava death is
judged by its owner; a device's removal by its owner. Splats near the region carry the painter's stage time (field 15).

net-lava.cjs (13/13 on its second run):
- Turf War 1:30: the level agrees within 0.012 m over 139 samples; the pinned guest dies by lava at 33.85–33.96 s (the
  deadly moment 33.8) and the host's feed shows it; its devices are gone on both screens; lava cells 99.968 % / 99.986 %
  identical; the same result at time-up.
- Practice: a late joiner at HIGH agrees with the host (level, stones), and its whole imported grid equals the host's
  (0 of 438,725 cells differ; 180 inked) — run 1 compared only the lava cells, all bare at HIGH, and its "inked > 20"
  bar failed on that; the check now compares the whole grid.
- A timed 1:30 with three screens: the host leaves at 35 s; the new host's fall starts at 55.01 s; the stones turn
  deadly at 61.22–61.23 s on both remaining screens; the same result at time-up.

**Bots** (they know only what the HUD shows):
- Nav: built at both rider poses and merged, explicit step links over every rider seam; no leap edges (F1, F2); windows
  at arrival time (F3); `nearest()` never returns a sunk stone (F4); the Organ climb at both levels (F5), and with the
  grid shifted 0.25 / 0.5 m (rule 46); floor nodes only where the lava reaches the feet (F9).
- Escapes: F7 7 of 7 off the drowning ledges; F8 4 of 4 off the stones.
- Lookouts: the claim (§0, issue 3; F10).
- Leaps and lunges never onto floor the lava takes.

## 4. Tests, pictures, balance

**lava.js** 54/54, twice at the final code (the run before the last two claim changes failed F7 once — a bot off the north Slump head at LOW — and F10).
**lava-audit.js** 8/10 (rules 44 and 45 fail: §6). **net-lava.cjs** 13/13. **lava-look** lit seams 33–38 % at rest (12 of 15 shots ≥ 35 %), 53 % rising, 26 % falling; every palette's inks louder than the lava (chroma 0.71–0.92 against 0.51–0.56).

**Regressions** (fix round): world-build Halyard 5/5, Caldera 5/5; stage-mods 36/36; net-stagemods 10/10; a Halyard
Turf War bot match (match.cjs) finished, no console errors; check-maps caldera / .zones / .tower / .bazookarp ok.
Earlier (no Caldera code): movers 17/17, pods 39/39, tower-rules 26/26, bot-sight 13/13, deployables 34/34,
net-practice 29/29.

**Bot matches** (lava-match.js, all bots, the full schedule):

See §0, issue 3 (the same 18 matches). Earlier engine-round matches: 15, 5 lava deaths, lookout time in 4 of 15.

**Stage checks** (from the engine round, not re-run): spawn-mid 5.95 / 6.27 s; climb-audit 0 bad of 85 at both levels;
cover-map 99.5 % with the riders.

**Performance**: the minimap's lava step ≤ 0.4–0.7 ms (was 9.4); the proximity field 20–22 ms at load; the two-pose
nav build ~370 ms at load. Engine round: Caldera 93–100 draw calls against Halyard's 184.

**Pictures**
- Engine round (40): `out/engine/eng-*`.
- Fix round 1 (`out/fix1/`): fix1-hud-zones-* / fix1-hud-tower-* (warning, rising, high, warn-fall, overtime: the chip
  under the mode's HUD), fix1-fall-burst-1…6, fix1-rise-embers-1…3, fix1-boulder-1…3, fix1-mid-high-glow,
  fix1-mid-low-glow, fix1-tangerine-high, fix1-cherry-high, and the palette set fix1-look-* (fix1-look-<palette>-high.jpg for the five palettes and the colour-blind one, fix1-look-moving-{warnrise,rise,fall}.jpg).

Balance sets were skipped, as COMMON.md says.

## 5. Commits and shared files

**Fix round 1:** 60da45cf (the engine fixes), 5d86a36f (their tests), 091c0d24, cc07a998 (kits: Mitts / Cutlass), bfe9a29a (lava-audit, net-lava, scenes), fba4b656, c7e00df3, 50b1a3ed (stage: colours, Spillway outline; seams; audit), 8d2a31b8 (scratch pictures), fcbcdc1e (stage: Lakefront outline; seams 0.36), 85744caa, 477e64f3, 47d05c62, eb958478, b515e283, b4b7d936 (scratch pictures), c1702235, f86175ce.

**Shared files:** docs/NET.md (one paragraph, engine round); `src/game/kits/mitts.js` and `src/game/kits/blade.js` (one
line each, `[b5-caldera]`). Everything else is module or stage code.

**Module files:** src/game/lava.js, src/game/lavaCore.js, src/world/lava-data.js, src/fx/lavaFx.js,
src/audio/sfx-lava.js. **Stage files:** caldera/lava.js, layout.js (colours, copings, plinths, sand bin), geo.js (the
region's outline), props.js. **Tests:** tools/botlab/tests/lava.js, lava-audit.js, lava-look.js, lava-look-report.py,
net-lava.cjs, lava-match.js, lava-perf.js, lava-hud-scenes.js.

## 6. Unfinished, flaky or uncertain

- **Rule 44: a running jump crosses the narrowest lava gaps.** The design's 4.5 m (the south head ↔ Lakefront corner and
  the island ↔ causeway across the lake corner, both halves) is crossed by a plain running jump in the physical search.
  The landings: from (−10.5, 1.2, −23.5) at 158° onto a coping at (−17.5, −20.6), from (21.5, 1.2, −2.5) at 68° onto a coping at (24.3, 4.3), from the island at (−7.5, 1.2, −10.5) onto the causeway at (−5.2, −16.0), and their twins (and at HIGH from the terrace at (16.5, 2.3, −23.5) onto a coping). The gap march also flags 1,602 (LOW) / 2,212 (HIGH) samples under 4.5 m, among them the drains and gutters the design floods and terrace edges 3.9 m apart across the Spillway bay; the lead's list (swim jumps, jump + air dash: 74 / 106 at LOW, 17 / 45 at HIGH with a nav detour over 10 m) is in the audit's output. Fixing it means widening those gaps to ~5.5 m (or accepting them as intended jumps): the lead's call.
- **Rule 45** — the outline is still under 0.5 m from a bank at 50 outline texels: under the Spillway Bridges' outer abutments (copings at 0.1–0.35 m, one open slot at (12.4, −27.6)), at the south Slump heads' corners (copings at 0.15–0.4 m and three open points by (−17.4, −16.4), where the lake and the Slump bay meet), and along the Slump cliff (0.35 m). Faces there are still inside the mask (inset > 0), so the rind and the burn hold; at the open points the lava's edge may show over void at the head corners. It needs the head / bridge geometry read against the polygons: next round, or the art phase.
- **Bots walking into the lake at LOW by the north Slump heads.** turf-13, -14 and -15 each lost one bot at LOW or in the
  rise warning with no attacker, two at a north head's lake corner (±23.8, ∓1.6) and one at (−18.6, 9.9); lava.js F7
  lost one at the same corner once in four runs. turf-1…9 and -16…18 lost none that way. I found no cause (the match
  harness keeps no trail) and it is within the target (0.07 per bot per 3:00 against ≤ 0.25); two of the three were
  Twinfire bots. Next round: a trail for every lava death in lava-match.js.
- **net-lava cells** are 99.97–99.99 %, not exact; the residue (9–21 of 64,710) sits where the test paints. Unproven:
  a splat record's 1 cm position rounding.
- **Lookout use** varies with the kits a team draws and how often its claimant dies on the way; see the table.
- **Bazookarp and crushIn are not in this branch**; restMask is only unit-checked.
- **Not built:** the stones' chains, the pig beds' glow, the Bellows Vent plume and ash burst, the red under-light at
  HIGH. **Not done:** the lightmap bake with the lava ("no lightmap for caldera").
- **The harness profiles run at quality 'low'.** The look report and pictures come from them (the fix1 scenes rebuild
  the particles as at 'high'); bloom may differ at high.
- **The far scenery is not built** (`backdrop.js` returns nothing). Rule 42 passes because the arena's outer walls block
  every downward view from the sampled spots; the art phase should re-run it.

## Module API

**Registration.** `registerStageMod({ key: 'lava', order: 20, worldAs: 'lavaWorld', matchAs: 'lava', liquid: true, world:
LavaWorld, match: StageLava })`, active when `LAYOUT.lava` exists (DESIGN §3.2's format: `low`, `high`, `region`, `falls`,
`timing`, `schedule`, `mirror`, `riders`, `steps`, `gauges`, `cascades`, `vents`, `flotsam`, `look`, `text`).

**Pure core** (lavaCore.js): `LAVA`, `lavaSchedule`, `lavaAt`, `lavaY`, `lavaMax`, `crossTime`, `stoneRel`, `riderTop`,
`expandLava`, `partPose`, `inRider`, `pointInPoly`.

**World** (`G.lavaWorld`): `inRegion`, `fallsIn`, `box`, `mask`, `map` (R region, G / B glow proximity at LOW / HIGH),
`uniforms`, `drown`, `floorY`, `riders`, `navMeta { kind, shutY, rider, pose, top, escD, exit, reach }`, `proxAt(x, z,
y)`, `proxMs`, `look`.

**Match** (`match.lava`): state `clock`, `y`, `st`, `tMax`, `burnY`, `state()`, `stats { deaths, byTeam, warned, burned,
devices, lookout, lookTeam, lookLong, lookClaims, lookHold, lookLog, mapMs, mapBuildMs, … }`; queries `surfaceAt`,
`liquidY`, `under`, `covers`, `wet`, `burns`, `noPlace`, `danger`, `inkClip`, `restMask`, `maxOver`, `yAt`; tests
`debugT(t)` and `?lava=low|high|rise|fall`.

**Registry hooks served:** update, seek, dispose, kill, fallCause, superJumpLanding, navEdge, navNode, goalWeight,
botHold, botAct, wet, under, fizzle, liquidY, noPlace, restMask, danger, sweeps, splatTime, onSplat, drawMap, hud, state.

**Events:** `lava:warn`, `lava:move`, `lava:rest`, `lava:hold`, `lava:set`, `lava:rider`, `device:down` (how `lava` /
`crush`), `shake`; cause `lava`. **Sounds:** lava_rumble, lava_erupt, lava_hiss, lava_drain, lava_sizzle, lava_pop,
lava_lock, lava_tick, lava_bell, lava_siren_up, lava_siren_down, lava_whistle.

## For the art phase

- **Palette** (`LOOK` in lavaFx.js): crust #3b1f1a / #4a2219; seams #a3121a → #e0301e → (#ff7a1e, dropped for hot inks)
  → #fff0c8; lavafalls #ff8a1e / #ffc84a; rind (0.82, 0.80, 0.76) linear; basalt #646870 / #73777e; pumice #bdb8ae /
  #8f8a80; needle #c8202a; beacons #ff1206 / #f4f6ff.
- **Keep the region's surfaces at sRGB luminance ≥ 0.35** (rule 38; lava-audit.js checks it) so the stain reads.
- **Surface** `SURF_FS`: Worley plates, seam width 0.36 + 0.07 rise + 0.06 warn − 0.1 fall; `uS` = (move, warn,
  no-orange, rest at HIGH); clipped to the region.
- **Level band**: below the mark glaze ×0.66–0.74; rind ~6 cm; glow exp(−3.2 h) × (1 − 0.9 up) × proximity; the front
  and the hot band; the warning pulse; ink dims the glow ×(1 − 0.8 ink); props get the darkening and rind (`patchStain`).
- **Stones' crack glow**: the pumice material's patch (fissure darkening ×(1 − 0.85 crack), glow (1.0, 0.13, 0.02) × 1.5).
- **Particles**: embers 0.12–0.26 m and steam 1–2 m Points (`PT_FS`), 150 / 300 / 600 by quality.
- **Not built**: the chains, the pig beds' glow, the Bellows Vent plume, the red under-light; the far scenery.
- **Lightmap**: the drowned floors bake with the stain; the riders are dynamic.
