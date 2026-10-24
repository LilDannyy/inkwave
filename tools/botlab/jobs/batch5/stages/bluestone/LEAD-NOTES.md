# Bluestone Junction: the lead's decisions (read before the engine and art phases)

## After the round-C blockout passed (2026-10-10)

The lead looked at the reviewer's top-downs (one camera, one scale: Crossroads Market, Bluestone era 1, era 3) and the
walkable masks. The kinked Z reads: spawns in opposite corners, offset legs, the dome on the crossbar, a harbour basin in
each re-entrant corner. It cannot be mistaken for Crossroads Market. **The blockout is accepted. Its geometry is frozen
for the engine phase:** the era engine serves the layout as built (`DESIGN.md` §8), and no geometry changes are made
in the engine phase unless an engine rule forces one (say so in the report).

Decisions on the review's open items:

1. **The Halo (era 3).** Accept the measured mean (48 % over 25 runs since fix 1; 3 runs under 30 %). Do NOT build the
   builder's proposed reversed river stair before art. The Halo is re-checked in the consolidated balance pass when the
   Mac mini is back (ENGINE.md §7 risk 16 lists the layout levers if it needs them).
2. **The knee's far apron** (208 m² per team behind the Customs House). Carried to the balance pass with the reviewer's
   target: era-3 mean ≥ 40 %, no run under 25 %. If it misses there, put the apron on a route (the Customs House ground
   floor as a colonnade from the cab rank through to the apron), not more cover, and mind the era-3 margin (+10.1 % over
   era 2; any floor added to every era is taken from the apron or matched in era 3). The art phase may give the apron a
   purpose and dressing (a goods yard, a customs shed's loading bay) but adds no floor.
3. **The size measure.** The directive's floor numbers are `cover-map`'s floorCells (top floor per column). The
   every-level count (5,711 / 5,856 / 6,904 m²) is recorded in DESIGN.md §8.8 for the record; no change.
4. **Names.** The station is **Flounders Street Station** everywhere (the user's name). "Flathead Street" is retired: a
   station takes its street's name, so the old river road / the crossbar street is **Flounders Street**. Fix every
   remaining mention in DESIGN.md (the identity paragraph, §1, §2, the lettering in the look table: "FLOUNDERS STREET
   STATION" on the drum), ENGINE.md, the code comments, `surfaces.js`, and any signage data. Swimston Street, Degrayling
   Lane, Hoki Lane, Centre Plaice, the Young & Jackfish, the Yabby stay.

## For the engine phase (`src/game/eras.js` through the stage-module registry)

- `ENGINE.md` is the contract (revision 2, written for the X layout); `DESIGN.md` §8.6 is the era set on the Z as
  built; `docs/STAGE-MODS.md` "Bluestone Junction: eras" says which registry hook serves each ENGINE.md item. Where
  ENGINE.md names a hook-in in a shared file that the registry already serves, use the registry. Where the X-era
  numbers in ENGINE.md (bounds, R_max, group counts) differ from the Z, the Z wins: re-measure and record.
- The schedule per mode stays as designed (jumps at 1/3 and 2/3 of the clock; Boss Battle fixed in era 2; Practice
  cycles with the rewind and its rescue; overtime never jumps).
- The jump is the showpiece. The user loved the Practice clear-ink wave and asked for "a full map effect". The order of
  events must be readable by a first-time player: Tartar's phone rings (the pre-bell at J − 20), the clock rows count
  down, the HUD countdown, wire pulses from the dome outward, holograms of what appears, then the radial front from the
  telephone at 25 m/s rewriting the city as it passes, the time-lapse sky, the done callout ("TODAY" / "3000s"). Neutral
  highlight colours (white-gold / warm grey), never a team ink.
- Fair: nobody inside an appearing piece (shove), nobody dropped into the river (rescue), the guard window, ink kept on
  ground that exists in both eras, pieces that vanish take their ink, pieces that appear arrive blank. Nothing a team
  relies on is taken away without the warning.
- Bazookarp: wave 2's `karp-engine` is not merged yet. Build H21's hook (`karpField.setState(era)` at done, the drop
  spot's danger rule) against the registry's query surface and a stub, with a test that runs once the karp module is
  present; the per-era Bazookarp checks run at integration.
- The lightmap: implement the per-era bake passes (`W.bakePasses()`, three per key) and prove them with one bake of
  one key; the full nine-pass bake belongs to the art phase, when the stage is final.
- Bots and online are not optional (COMMON.md). Locally: 2–4 bot matches per era schedule and mode, not the Mac mini's
  six.

## The era engine PASSED its final review (2026-10-17, head 2833d04b). What carries forward

The engine is accepted: both halves built, the final review found no era shove, no splat caused by a jump in a match,
no desync, no doubled or skipped jump, no floating device, no stuck bot; the jump reads in order. The reviewer's six
minors go to these owners:
1. **The art phase's first commit (an engine item, small):** `superJumpLanding(a, s)` in StageEras: at launch, if the
   group under the landing will be absent at touchdown and the floor below is then water or a bare roof, move the
   landing to the rescue's own choice (the nearest node valid in the era in force); a check in eras-jump with the
   reviewer's probe (Practice rewind, bridge-2 / bridge-3 / garden-11, touchdown 0.3 s after the flip: 3 of 3 died).
2. **The art phase also:** per-era lamp colours (ENGINE rule 42, `eras.look[e].lamps` applied to `decor.lamps` and
   blended in the time-lapse) once lamps exist; Tartar ringing once in the intro fly-in (DESIGN §3.5); a pixel check
   on the warning's sepia flicker; the rule-22 accept text to the measured 3.75 m; every jump picture re-shot with
   eras-shots2.cjs so the set the user sees shows the current HUD. And the art's real job, the reviewer's words: "the
   shared city barely changes as the front passes" and "the 20 cm blocky dissolve still reads as a digital glitch":
   the era re-skins, props, murals and tint must make the front rewrite the city, not only the skyline.
3. **The Mac mini:** the frame budget on a quiet machine (the branch's JOB-6 with a real-time rAF-paced frame check
   beside the stepped one), and the bots' use of jump 1's new ground per mode (the balance pass; the lever is
   `_pickPaintGoal` drawing from `E.fresh` for 30 s after done).
4. **The integrator:** the karp `anyValid` one-liner (`tools/botlab/jobs/batch5/bluestone/karp-anyValid.patch`) when
   b5-stage-bluestone merges with the Bazookarp packages, then `eras-karp.js` part B and `bazookarp-check.cjs
   ERA=1/2/3` on the merged head.
The art phase waits for the weekly usage reset (Friday 2026-10-23 06:00).
- **The frame budget: CLOSED (2026-10-17, the Mac mini's JOB-6 at 986f1af9, idle machine, ×3).** Worst frame from
  J − 0.5 to done + 1.5: 35.4 / 32.0 / 32.1 ms (the jump frame at about J + 1.5 s), p95 4.6–5.0 ms, era update
  ≤ 2.5 ms; the Bravo viewer's 2→3 and the sunset 3→1 jumps peak at 10–16 ms; 'first' 3/3 with no shader compiled
  during a jump. net-eras and the lagged run passed there too. One aside for the engine in general, not this stage:
  the first inking frame of any match is 160–260 ms (a paint-atlas first-use cost).

## The art phase (2026-10-25): the place, in three eras

The era engine is accepted. The reviewer's words on the engine pictures are the art phase's brief: "the shared city
barely changes as the front passes" and "the 20 cm blocky dissolve still reads as a digital glitch". The art must make
the FRONT REWRITE THE CITY at street level, not only the skyline. Binding:
1. **Three looks of the same streets** (DESIGN.md §5 and its per-building table): every building face, kerb, lamp,
   tram, sign, cart and mural has its 1880s, TODAY and 3000s version through the engine's era re-skins (surfaces,
   murals with era masks, era props, tint, the backdrop sets, `eras.look[e].lamps`), so that a player standing anywhere
   sees the era change around them. Prove it with the same camera in all three eras at eight places (the circus, the
   knee, Swimston, the quay, Hoki Lane, the arcade, the forecourt, the Halo) and the sweep tool in each era.
2. **The Halyard bar everywhere** (`tools/botlab/stage-sweep.cjs` in each era, day and dusk, TWIN=1): no bare box at
   eye level in any era; every structure is something; signage, props, iron lace, bluestone kerbs, the station's
   clocks and dome dressed per era; Flounders Street Station named on the drum in every era's lettering.
3. **The jump's look**: the front's dissolve becomes the showpiece (the Practice clear-ink wave is the reference: a
   clean sweeping edge with the Roman-numeral curtain, no 20 cm blocks), the holograms and wire pulses in the
   highlight colours, the time-lapse sky; a jump picture sequence from Swimston and the knee at J − 10, J + 0, J + 1.5,
   J + 3, done + 1, and the hero shot for the stage art (day and dusk cards) showing the three eras' identity.
4. **The engine's art-phase list** (LEAD-NOTES "The era engine PASSED"): superJumpLanding in Practice's rewind; lamps
   per era; Tartar ringing once in the intro fly-in; the sepia-flicker pixel check; the rule-22 accept text; every jump
   picture re-shot.
5. **Play geometry is frozen**: no collider or layout change (check-maps piece counts, climb-audit, cover-map,
   spawn-mid, tower-check per era unchanged); dressing within 8.5 cm of faces, nothing on walkable tops; the bake
   (nine passes: three keys × three eras) at the end, on the Mac mini or locally; performance against Halyard per era
   with the fixed-view probe (calls and cpuRender level; triangles within +15 %).
6. The stage stays BETA until the lead accepts the art.
