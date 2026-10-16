# Bluestone Junction — engine phase, first half: the era engine's world and the jump (LEAD-REPORT, after review fix round 1)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`. The engine phase's first half (ENGINE.md §6 steps 1–5 and 7–9)
is built through the stage-module registry; the independent review of it (LEAD-REVIEW.json, verdict REDO on narrow
points: 1 major, 4 minor, 1 for the next round) is answered in §0 below. Everything ran on this Mac (the task says the
Mac mini is unavailable; COMMON.md in the worktree now says it is back — not used, see §7), one Electron instance at a
time under the shared SLOTS=3 lock, with load averages of 220–390 throughout. Logs of this round:
`tools/botlab/jobs/batch5/bluestone/local-logs/review-fix1/`.

## 0. Review fix round 1 (2026-10-16): each issue, what was done, the proof

**The previous fixer's uncommitted work** (cut off on 2026-10-10 on top of 8768f720: eraFx.js, eras.js, eras-data.js,
eras-hud.js, eras-jump.js). Read in full and kept, with these changes: the minimap rebuild got a set-up path for the
time-of-day drop and builds one base per frame in its fallback (it built every missing base in one frame); the Bazookarp
weir rule measured 3 m from the weir's trigger disc (r 1.8), which made check-maps fail on the cab shelter at 2.70 m — it
now measures from the weir's centre as the Bazookarp SPEC does (below); the era callouts sat at 18.5 % of the HUD and
covered the chip and the clock (seen in the pictures) — replaced by placement in the callout slot (fix 5); its
monotonic-clock test had a timing bug (it read the crates before their flip; fixed); its theme test used a time key the
offline API does not have ('sunset': 'dusk'). Nothing of it was reverted.

### Issue 1 (major): a Bravo viewer's minimap rebuilt a base (~105 ms) at every done — FIXED
- **Cause** (as the review found): `Minimap.setViewerTeam` and a time-of-day change drop every cached era base; the next
  done's `setBase` built one in its frame.
- **Fix** (`src/game/eras.js`, no shared file): `attachMinimap` wraps the minimap instance's `setViewerTeam`, so a side
  flip (it comes while a match loads, the screen faded) rebuilds the other two eras' bases at once; `_syncTheme` (in the
  StageEras constructor, i.e. at match set-up) lets the minimap take a new time of day there (`mm.update(0)`) and builds
  the bases, so a world kept for a match at another time never meets the drop in its intro; as a last resort
  `StageEras.update` rebuilds a missing base one per frame, never during a jump. `W.stats.baseBuilds` logs every raster
  built (`{ e, ms, why, t }`). docs/STAGE-MODS.md's minimap note says so.
- **Proof** (eras-jump, jump-final.log / jump-2.log):
  - 'frames', a viewer flipped to Bravo mid-match: the 2 bases rebuilt at the flip (`1:side 106 ms`, `3:side 97 ms`),
    none missing at J, **no base built between J and done + 1**; a mid-match time-of-day change: rebuilt one per frame
    before the jump, none built from J to done + 1.
  - 'modes', the real load path: a Practice match on the kept world at dusk after one at day — the minimap took the new
    theme and 2 bases were built during set-up (`2:theme 86 ms @0`, `3:theme 84 ms @0`), none missing or built once
    playing.
  - Before the fix the review's probe measured a 105 ms build and a 117 ms frame at done for Bravo; the new checks call
    `W._basesMissing` / `baseBuilds`, which HEAD did not have, so the "without" run is the review's.
  - Frame times (the 50 ms cap) are reported in a separate timing check: see §4 — they pass when the machine is quiet
    enough (15.3 ms max in one run) and fail on single spikes under load (baseline frames without a jump reach 480 ms
    here).

### Issue 2 (minor): a follower's clock easing back re-fired events and flipped groups back — FIXED
- **Fix** (`eras.js`): the runtime follows a high-water mark of the stage clock (`_tHigh`; `tNow` for every query), so
  between seeks the world never runs backwards; each (jump, event) fires once (`_fired`); `seek()` (a real snap > 1 s,
  a late joiner) resets both and re-derives the world at the new time as before.
- **Proof**: eras-jump 'sched' pushes the match clock 0.9 s back just after the warning and again just after the
  crates' flip (the stage clock walks back 0.244 s each time): **one era:warn, one era:jump, one era:done, 8 flips (each
  group once), TIME JUMP said once, the crates never solid again**. The same test on HEAD's eras.js
  (jump-sched-without.log): 2 warns, TIME JUMP twice, the crates flip back and forth (12 flips).

### Issue 3 (minor): check-maps T2 lacked the objective, water and reach rules — FIXED
- **Fix** (`src/world/eras-data.js`, run by check-maps on the turf, tower, bazookarp, boss and zones builds):
  `objectiveCheck` — rule 14 (12 m of a spawn pad, never on its deck), 15 (2 m of every zone outline at any height),
  16 (1 m of the tower's swept platform ±1.25 m and its 3.72 m headroom), 17 (3 m of the Pond, a weir and the Gate),
  36 (no era-only waterline deck slab), 37 (R_max ≤ 85); `railCheck` (a river rail ends on land or on another rail);
  `turfRules` (11–13), asserted on the live paint grid in eras-world part 2.
- **The weir, where the review and the previous fixer differed**: the review measured 4.5 m from the weir's centre; the
  previous fixer measured from its 1.8 m trigger disc (2.70 m: a failure). The Bazookarp SPEC §4.3 defines the weir's
  room as "3 m of clear room round each one (the weir's own posts stand at 2.7 m and are excepted)", i.e. from its
  centre, so the review's reading is the SPEC's; the Gate is measured from its 3.4 m plinth's edge, the Pond from its
  start. **The review is right; the stage passes.**
- **Proof**: check-maps: bluestone ok; nearest era piece — a pad 15.92 m, a zone 3.5 m, a weir 4.5 m, the tower's swept
  volume 1.38 m (the Halo over its headroom), the reach 84.53 m; 16 / 28 / 20 river rails checked per era. The only
  failure in the repo is still halyard's 25.7° ramp (not this branch). **`tools/botlab/tests/eras-static.mjs`** (Node,
  11/11): the stage passes, and each check fails on one planted violation — a crate 10 m from the pad (14), a box 1.5 m
  from the side zone 4 m up (15), one across the tower track (16), one 2 m from the weir (17), a waterline slab (36), a box
  86 m out (37), a river rail cut 1.5 m short (`punt-rail` half[275]), turf numbers out of range (11, 12 both ways, 13).
  eras-world part 2: turf **5,495 / 5,642 / 6,644 m²** (era 2 +2.7 %, era 3 +17.8 %), 0 m² vanishing in either jump.

### Issue 4 (minor): the GPO's era-2 tower / era-3 spire hid the dome from the spawn — FIXED
- **Fix** (`stages/bluestone/props.js`): nothing stands on the GPO's roof in any era (DESIGN §8.3: the dome is exactly
  behind it from the spawn deck); its glass tower and spire stand on the tram shed beside the spawn deck (−9, −68), out
  of the spawn → dome line. Measuring showed the hotel's era-3 spire also cut the dome's rim (80.5 % open), so the hotel's
  extension and spire moved 2.7 m west to rise straight behind its turret (DESIGN §5.2's "behind the turret"). DESIGN §8.3
  notes the rule.
- **Proof**: **eras-look part 3** casts rays from each spawn eye (pad + 1.7 m) to 103 points on the dome's near side and
  its lantern and asks that ≥ 90 % of those the shared city leaves open stay open past each era's meshes. Before: era 1
  100 %, **era 2 8 % / 7 %, era 3 3.4 % / 3.5 %** (look3-before.log: the GPO's tower and spire); GPO pair moved only: era 3
  80.5 % (the hotel spire); now **97/97 open in every era from both spawns**. Pictures `era2-spawn.jpg`, `era3-spawn.jpg`:
  the dome and lantern in full view (looked at).

### Issue 5 (minor): the era callouts were drawn on the viewer's team-ink ribbon and cleared gameplay callouts — FIXED
- **Fix** (`src/fx/eraFx.js`, `eras.js` `_say`): `EraHud.say` draws TIME JUMP, the era banner, NEW ROUTES OPEN / NEW
  AREAS! and Tartar's line as the module's own DOM in the HUD — the chip's white-gold `#f4e9c8` on a dark band (the big
  banner `#fff6dc` on a dark gradient), the HUD's sounds — replacing only the era's previous callout. `_place` puts the
  band in the HUD's callout slot (27 %) and moves it down past the chip, a gameplay callout (checked every frame while
  one shows) and Zone Control's callouts; its own pop animation fades in place (the HUD's slides up as it fades, which
  carried the big banner over the chip and the clock).
- **Proof**: eras-hud 8/8 at 1280 × 720 (hud5.log): colours (white-gold on dark, far from the run's team inks: cyan /
  red there; the pictures show the same band under lime / magenta, yellow / purple and pink / green palettes), the
  module's own `er-call` animation, none routed through `HUD._callout`, a gameplay callout kept on screen; alone at 27 %
  clear of the chip; the 3000s banner [148, 241] px clear of the chip [88, 116]; under a gameplay callout at 37.8 %. Pictures:
  `jump-swimston-J-10.jpg` (the chip's countdown fully readable over TIME JUMP), `jump2-circus-J+0.6.jpg` (the banner clear
  of the chip and clock), `jump-swimston-done+1.jpg`, `zones-warn-callouts.jpg` (Zone Control: SPLATTED BY and TIME JUMP
  together, neither covering the other).
- **Seen, not mine to change here:** in Zone Control the chip docks under the zones HUD, where the HUD's own callouts
  (a splat, WIPEOUT) appear: a gameplay callout covers the docked chip for its 2.4 s (zones-warn-callouts.jpg). That is
  the docking chosen in the first half against the HUD's callout slot; moving the docked chip is a HUD decision for the
  lead.

### Issue 6 (next round, not blocking): stale minimap ink in the pictures; look polish
- **The tool** (`eras-shots.cjs`): the minimap ink layer is redrawn in full before composing (`mm._band = 0;
  mm.update(0.2, true)`); minimap-era1/2/3 and the warning pictures re-shot — only this match's ink shows.
- **Mirrored numerals: FIXED** (`eraFx.js`): the glyph strip runs against the angle on the curtain's front faces and
  with it on its back faces (`gl_FrontFacing`). The review's pictures were taken from outside the front (it comes toward
  you), where they read mirrored; now VII, IX, XII read correctly (jump-swimston-J+1.5, jump2-circus-J+0.6).
- **The Swimston camera** (tool): raised to (−20.5, 3.2, −51.5), over the news kiosk.
- **Left for the art pass, as the review allows:** jump 2's own hexagonal-shard curtain (still pearl with the brass
  glyphs), a softer dissolve than the 20 cm blocks, wires under the beads.

### Re-run after the fixes (all local)
eras-world 20/20 (parts 1–5), eras-look 10/10, eras-hud 8/8, eras-jump 17/19 (the two failures are the frame-time caps
under load, §4), eras-static 11/11, check-maps (bluestone ok), the full picture set (29 + 1, 0 console errors), and
three bot matches through the jumps (§3). Not re-run: stage-mods, world-build, ink-wipe, movers, pods (no shared file
or other stage was touched this round).

## 1. What was built, step by step (the user: "a full map effect plays that simulates going forward to the current time,
which changes how the map looks and opens up new routes … then … 3000s … adds new areas"; Tartar "an old telephone")

**Step 1, the data and the Level.** `era.js`: `ERA_DEFAULT` is the union; `?era=n` (PAGEQ='era=2') no longer filters
the layout — the engine starts in era n and never jumps. `src/game/eras.js` registers the `eras` / `eraGroup` block
fields (presence: era 1 = 1, 2 = 2, 3 = 4, shared 0; `presenceAll` 7), so face hiding, grounded bottoms and bevels ask
only blocks present in every era of the face's block. Groups are keyed `eraGroup + :a/:b` by the side of the block's
centre; r_g = distance from Tartar (0, 0) to the centre of the members' union AABB. Every vertex carries
`aEra = (mask, r_g)` (registry `geomAttrs`). On the Z as built: **52 groups**; jump 1 changes **4 / 4 groups per half,
26 blocks**; jump 2 **22 / 22, 130 blocks**; era-only blocks **21.9 %**; 156 era blocks of 712; **R_max 84.5 m + 2 →
done = J + 3.96 s** (the Z's numbers replace ENGINE's X numbers). `src/world/eras-data.js` (three-free) gives
check-maps T2: overlaps only between pieces that share an era; `bluestone#1/#2/#3` (568 / 590 / 700 pieces); rules 3–7;
the appear check (19–20, 19b as restated) and the vanish check (27) in the turf build and the tower / bazookarp / boss /
zones variants; the 2 m strip test per era (0 strips over 25 m in each era); **and since fix round 1** the objective
rules 14–17, 36, 37, the river rails' ends and the turf rules 11–13 (§0, issue 3), each shown failing on a planted
violation by `eras-static.mjs`.

**Step 2, paint.** Per cell `cellPres` = its face's eras minus the eras of any block burying its sample point; per group
its own faces' cells and the cells it buries, re-tested at its flip against the blocks as they stand (mid-jump the city
is part one era, part the next); `apply(e)` recounts in one pass. Turf: **87,974 / 90,362 / 106,486 cells**, **5,495 /
5,642 / 6,644 m²** in eras 1 / 2 / 3. A splat on an absent or guarded block claims nothing (the registry's block gate,
`inkOk(b, et)` with the painter's time). Appearing pieces are cleared (grid + atlas) at the warning; vanished pieces'
faces are zeroed at done + 1 s; shared ground keeps its ink.

**Step 3, nav.** Three `NavGraph`s (one per era's solidity) merged into one union graph: nodes by (cell, height ±0.15),
edges keyed (from, to, type, cost) with `e.em`; per-era `valid` / `exitable` / `validIds` / wet / overWater columns;
`nav.edgeMask` = the era in force; `edge()` honours the mask. **5,952 nodes** (valid 4,808 / 4,958 / 5,844), 36,602
edges; merge **6.6–26 ms**. Union path costs equal fresh per-era graphs on 200 random pairs per era: **worst 0 %**.
Degrayling Lane: Swimston → the quay at mid-leg **21.96 → 13.16** from era 2. The Halo's nodes valid only in era 3.

**Step 4, load.** Nav ×3 **599–700 ms** in the first half's loads (this round: 671 ms judged, the lower of two builds;
builds 193–262 ms each), merge 7–26 ms, paint masks 28–53 ms, era meshes 5–21 ms. World build 950–1,560 ms with the
engine, 380–1,940 without on this loaded Mac. Match loadMs 7,238 / 7,489 ms (first half), 8,130 ms this round at load
~380. Under 700 ms nav, so no dirty-region rebuild (4b) was built; it is the lever if the Mac mini's numbers say
otherwise.

**Step 5, looks.** One level mesh per era mask present (1, 3, 4, 6), built while every block is solid, shown only in
its eras (both eras' during a jump; the coming era's from the warning, collapsed). The level-shader extension
(`src/fx/eraFx.js`): each fragment's era (shared ground by its side of the front, a piece by its own flip); the era
tint and the re-skins (granite → asphalt → pavers, planks → glasstile) on the bare surface; the mural masks
(`uMurEra`); the AO channel of that era; the 0.3 s dissolve; the sepia flicker on what will go; the 4 s white-gold
pulse on what is new; the front's white-gold line with minute ticks. Era meshes and era prop buckets cast shadows
through depth materials that collapse absent pieces and sit out the GTAO pass while both eras are up. **No ghosts**
(pixel-identical, max diff 0, at rest and mid-jump after the flip). Draw calls from the spawn camera on high: **96 / 99 /
97** in eras 1 / 2 / 3 and **115** mid-jump (budget 334 / 390).

**Step 7, props and backdrop.** Era props are tagged buckets (`bucketTag 'e' + mask`, an era material clone and depth
material): the era-slot kit's tram (one tram type visible per era over one shared collider), lamps in the kerb
planters, today's glass towers and the 3000s' spires on three roofs — **since fix round 1: the Customs House, the
hotel (straight behind its turret) and the tram shed beside the spawn deck; nothing on the GPO** (the dome stays in
sight from both spawns in every era) — and the 3000s' light lattice over the dome; ≤ 4 materials per era mask. One
skyline per era (`backdrop.js` sets 1–3) swapped by the horizon run. Tartar is three animated parts.

**Step 8, the runtime (StageEras).** The schedule is a pure function of the host stage clock: Turf War 3:00 jumps at
60 / 120 s, 1:30 at 30 / 60, the five-minute modes (and Bazookarp) at 100 / 200 (never in overtime), Boss Battle fixed
in era 2, Practice every 60 s with the rewind 3 → 1, the menu backdrop every 40 s, `?era=n` held. **Since fix round 1
the runtime never runs backwards between seeks** (`_tHigh`, each event once). Events: pre-bell (J − 20), warn (J − 10:
Tartar's ring + the two nearest kiosks, "TIME JUMP / 1880s → TODAY in 10", holograms of every appearing block, the wire
beads, appearing faces cleared, the bots' danger layer), rings at J − 5, −3, −2, the pickup at J − 1, J (the swell, a
0.25 shake, the curtain of clock light riding the front with Roman numerals — reading the right way since fix round 1
— and gears, brass in jump 1, pearl in jump 2 and the rewind; the time-lapse sky), each group's flip at J + r_g / 25,
done (nav era, danger layer released, bots replan, the minimap's cached base swapped, "NEW ROUTES OPEN" / "NEW AREAS!" /
"BACK TO THE 1880s", fresh nodes ×2 as paint goals for 30 s), the look settled at done + 0.7, the vanished faces zeroed
at done + 1. Shove, rescue (over water, or on a roof with nothing walkable within 3.4 m below), devices destroyed
(`S.crushIn`, then the module's walk of `G.subs.items`). Sounds synthesized in `src/audio/sfx-eras.js`.

**Step 9, HUD and maps.** The era chip under the clock (docked under Zone Control's / Tower Command's HUD): the three
names with the current one lit, a bar to the next jump, "TODAY in 20" from the pre-bell, the big countdown 10 … 1 with
Tartar's ringing phone glyph, "TIME JUMP!" during the jump. **The era callouts are the module's own since fix round 1**
(white-gold on dark, in the callout slot, never covering or clearing a gameplay callout, the chip or the clock). The
minimap's base per era (three rasters, rebuilt whenever the minimap drops them — a side flip, a time of day — never at
done) and the outlines from the warning to done. The thumbnail: era 1 as usual, the 78 later pieces dashed. Colours:
only `eras.colors` (#f4e9c8 / #a9a49a) and white light.

**Names.** Flounders Street Station everywhere (LEAD-NOTES item 4).

## 2. Decisions where the contract left a gap
1. **The tram block became collision-only** (`hidden: true, paint: false`): the era-slot kit as DESIGN §2.10 describes
   it. The only data change to the frozen blockout.
2. **`nav.validIds` is per era** (a union list would send bots to the Halo in era 1).
3. **The rescue / shove fallback picks only a node whose floor stands now.**
4. **The coming era's meshes are drawn collapsed from the warning** and every era program is compiled at load.
5. **The look settles without `setTheme`** (risk 10): uniforms + one PMREM rebuild at done + 0.7.
6. **The guard is per block.**
7. **Kiosks:** the two nearest the camera ring aloud.
8. **Callout texts** for the rewind ("THE CLOCK RUNS BACK", "Back to the beginning. Again.") are mine.
9. **Lamps stand in the kerb planters.**
10. *(fix round 1)* **The runtime holds the world at its high-water mark** while a follower's clock eases back (it may
    stand still for up to the size of the correction, never re-run); a real snap (> 1 s) still re-derives the world at
    the new time through `seek`.
11. *(fix round 1)* **Rule 17 is measured as the Bazookarp SPEC measures its clearances**: a weir from its centre, the
    Gate from its plinth's edge, the Pond from its start.
12. *(fix round 1)* **Rooftop superstructures**: the GPO carries none in any era (its pair is on the tram shed); the
    hotel's pair rises straight behind its turret. Look-only props, no colliders: play is unchanged.
13. *(fix round 1)* **The era callouts' place**: the HUD's callout slot, moved down past whatever is there, fading in
    place.

## 3. Online and bots
Nothing new on the wire: the state is a pure function of the stage clock on every screen, a clock snap calls `seek`
(`era:set`); `R.splatTime` stamps field 15 only from J − 1 to done + 1; each screen shoves / rescues / pops its own
(docs/NET.md). Fix round 1 makes a follower's world monotonic between snaps (issue 2) and keeps each screen's own
minimap free at done whichever side it views from (issue 1); still no two-client test (net-eras.cjs is step 11). Bots:
the danger layer from the warning, replans at done, fresh nodes ×2 for 30 s.
**Bot matches this round (local, after every fix, through both jumps):**

| Match | Result | Stuck | Water splats | Console |
|---|---|---|---|---|
| Turf War 3:00 #1 | 32.7 / 28.0 % | 0 % | 0 | "no lightmap" only |
| Turf War 3:00 #2 | 39.5 / 25.6 % | 0 % | 0 | "no lightmap" only |
| Zone Control | Bravo by time, 67 vs 17 | 0.4 % | 0 | "no lightmap" only |

(First half: 40.2 / 20.4 % and 35.2 / 31.1 %, stuck 0.1 / 0 %. The review's: 35.7 / 35.4, 34.5 / 30.3, Zone Control
Alpha by time.) No balance sets (the lead's consolidated pass).

## 4. Tests (local, final code; logs in `local-logs/engine/` (first half) and `local-logs/review-fix1/`)
- `eras-world.js` **20/20** (parts 1–5; new: the turf rules 11–13 on the live grid).
- `eras-look.js` **10/10** (new part 3: the dome from both spawns in every era).
- `eras-hud.js` **8/8** (the era callouts: colours, own DOM and animation, placement against the chip and a gameplay
  callout, at 1280 × 720).
- `eras-static.mjs` (new, Node) **11/11**.
- `eras-jump.js` **19 checks** (new: the clock pushed back; Bravo and time-of-day base drops; the kept-world load at
  another time of day). Final full run **17/19**: every behaviour check passes; the two frame-time caps failed at load
  average ~370 — the main frames check 190 ms max (one frame; p95 25.9, median 4.4) against a no-jump baseline whose own
  frames reach 485 ms, and the new Bravo / time-of-day timing check 88 / 265 ms max. In the run before (jump-2.log) the
  main frames check **passed at 15.3 ms max** (era update ≤ 1.4 ms) and the new timing check failed only on single
  spikes (138 / 113 ms, second-worst 21 / 20 ms; baseline 480 ms). No base raster is built in any jump in any run.
  Flaky here; a quiet machine is needed to judge the 50 ms cap.
- check-maps: every stage ok except halyard's half[41] ramp 25.7° (not this branch).
- First half, not re-run this round (nothing they cover changed): stage-mods 36/36, world-build 5/5, ink-wipe 8/8,
  movers 17/17, pods 39/39, stage-audit halyard / calamari / treehills 3/3 each.

## 5. Pictures (`out/engine/`, JPEG 94–131 KB; all re-shot this round and looked at)
`era{1,2,3}-spawn` (the dome in view in every era), `-circus`, `-top`; `jump-swimston-J-10` (TIME JUMP under the chip,
countdown readable), `jump-phone-J+0`, `jump-swimston-J+1.5` (numerals read correctly), `-J+3`, `-done+1` (NEW ROUTES
OPEN); `jump2-circus-J-5`, `-J+0.6` (the 3000s banner clear of the chip and clock), `-done+1`;
`vanish-halo-inked-before`, `vanish-halo-after-flip`; `appear-bridge-before`, `appear-bridge-after`;
`minimap-era{1,2,3}` and `minimap-warn-jump1/2` (fresh ink only); `gtao-probe-era1/2`; new `zones-warn-callouts` (Zone
Control: the docked chip, a gameplay callout and TIME JUMP).

## 6. Commits; files
First half: 2b0dd6c1, f00a30c2, aed8aff2, 81f88b12, 67444e02, eb52adff, c0977466, 2c3cef62, 4d70601a; scratch 06569ead,
729fc6d9, c536e29c, d5afd821, 8768f720.
Fix round 1: **9ab92b10** (check-maps T2 rules + eras-static.mjs), **cb5123ee** (the GPO's superstructures moved;
eras-look part 3), **6aa69669** (minimap bases; monotonic runtime; STAGE-MODS note), **678596cf** (the era callouts),
**5cc9d2cc** (the curtain's numerals), **7a645bd4** (the callouts fade in place), **aa77a2c3** (eras-world turf rules);
scratch **48a942cf** (pictures, eras-shots.cjs) and the commit carrying this report, DESIGN.md §8.3's note and the logs.
Files this round: `src/game/eras.js`, `src/fx/eraFx.js`, `src/world/eras-data.js`, `src/world/stages/bluestone/props.js`,
`tools/botlab/tests/eras-{world,look,jump,hud}.js`, new `tools/botlab/tests/eras-static.mjs`, `docs/STAGE-MODS.md` (the
minimap note). **No shared engine file was edited** (minimap.js, main.js, hud.js, level.js … untouched; the minimap's
`setViewerTeam` is wrapped on the instance by the module and restored at dispose).

## 7. Unfinished, flaky or uncertain
- **The 50 ms frame caps** in eras-jump (the first half's and the new Bravo / time-of-day one) fail on this machine at
  load 220–390 and pass when it is quieter; the deterministic part (no raster built from J to done + 1) passes in every
  run. They need a quiet machine. COMMON.md in this worktree (uncommitted, not mine) says the Mac mini is back since
  2026-10-16; my task said it was unavailable, so nothing was sent to it — a JOB with `PAGE_ARGS='only=frames'` ×3 is
  the natural first job there.
- **The fallback rebuild** (a time of day changed mid-match, which no game path does today) costs one frame of ~0.1–0.2 s
  per base outside a jump. The load paths (side flip, kept world) pay at set-up, behind the faded screen.
- **Zone Control / Tower Command:** the docked chip sits where the HUD's own callouts appear; a splat callout covers it
  for 2.4 s (§0 issue 5). A HUD decision for the lead.
- **The minimap base rasters on a fresh world** are built by the update fallback in the match's 'init' state (one per
  frame) when the minimap's own idle build has not happened before the era world's idle prebuild — at load, not in play.
- **Not in this phase:** step 6 (`W.bakePasses()` implemented, never baked), 10 (eras-bots.js, sweeps, H16b), 11
  (net-eras.cjs: two clients, late join, host change — would also exercise fix 2 online), 12 (eras-modes.js; Bazookarp
  H21 against a stub), 12c (no stage murals yet for `uMurEra`).
- **Art pass:** jump 2's hexagonal-shard curtain, a softer dissolve, wires under the beads, the GPO clock on its
  parapet; the striker clock's `era_strike` has no prop yet; era ambiences and the end-of-match cosmetic (§3.10).
- The roof rescue is tested only by a direct call (no garden-on-roof on the Z). `stats.eraShoves` is not in match.cjs's
  RESULT_JSON.
