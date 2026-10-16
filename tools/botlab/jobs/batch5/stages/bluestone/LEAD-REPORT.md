# Bluestone Junction — engine phase, second half: everything around the jump (LEAD-REPORT)

Branch `b5-stage-bluestone`, worktree `st-b5-bluestone`, on top of the first half (d99607dd; its report is
`git show d99607dd:tools/botlab/jobs/batch5/stages/bluestone/LEAD-REPORT.md`). Built: ENGINE.md §6 steps 10–13, 12b, 12c
and 6, all through the stage-module registry, hook-ins tagged `[b5-eras]`. Before that, the second engine review's five
issues (LEAD-REVIEW.json, "redo on narrow points") were fixed. Everything ran on this Mac. The task says the Mac mini is
unavailable; COMMON.md in the worktree (uncommitted, not mine) says it is back. I did not use it (§7). One Electron of mine
ran at a time under the shared SLOTS=3 lock, at load averages of 9–220. Logs: `tools/botlab/jobs/batch5/bluestone/local-logs/engine2/`
(`final/` holds the runs at the final code, `regress/`, `matches/`).

## 0. Review 2's issues (fixed first)
1. **(major) First-use shader compiles in the first warning.** Fixed in `EraWorld._precompile`, which now also covers the
   kiosks' bell sprites (drawn at opacity 0), two one-box hologram stand-ins (EraFx, 40 m under the stage), the backdrop's
   era sets, the wires, and **the paint atlas's clearing quad** (`paint.clearFaces`' program). That last one was the
   real ~80 ms hitch: the warning clears the appearing pieces' faces and compiled it there. EraHud also lays both callout
   kinds out once at set-up. Proof is eras-jump 'first' on a fresh page, on the real schedule. Before: programs went
   150 → 151 at J − 10 and the warning frame's era update took 86.5 ms (`jump-1.log`). After: no program compiled from
   J − 20 to done + 1.5, and the warning frame took 6.4–6.9 ms (`final/eras-jump-2.log`, `jump-first-2.log`).
2. **GTAO off present pieces for the whole warning.** The gate is now per mesh. In the warning only the meshes whose mask
   lacks the era in force sit out; during the jump all of them do, as before. eras-look checks it two ways:
   - a unit check: present mesh drawRange Infinity, coming-era mesh 0;
   - a pixel check in jump 1's warning: the goods wagon renders identically with and without the gate on the present
     meshes (max diff 0, GTAO on). Before the fix the review measured 77,982 px off.
3. **EraHud laid itself out every frame.** The band is now placed in `say()`. It is placed again only when a gameplay
   callout, a Zone Control callout or **a HUD banner** comes or goes (a MutationObserver), or when the chip changes state.
   Reads come before writes, and the bar's width is written only when it changes. eras-hud measured 4 layouts over a
   997-frame jump; before, it was one per frame. A gameplay callout that arrives after an era callout still pushes the
   band down.
4. **ENGINE rules 8–9 were unchecked.** `eras-data.js capacityRules` now checks them, asserted on the live union in
   eras-world part 4: 12,312 m² paintable, 11.3 % era-only, 1,142 lightmap rows. eras-static plants one violation of each
   (12/12).
5. **Pictures.**
   - One continuous jump on the real 3:00 schedule, with one palette.
   - The bell glyph's size on screen is capped at ~6 % of the view's height up close.
   - The rewind picture is gone: the rescue pictures are named by their moment.

## 1. What was built, against the user's words
The user: "a full map effect plays that simulates going forward to the current time, which changes how the map looks
and opens up new routes … 3000s … adds new areas"; Tartar "an old telephone".

**Bots (H16, H16b; `eras.js`, `match.cjs`, `tower-match.cjs`, `tests/eras-bots.js`).**
- **The danger layer** (first half) runs from the warning to done. It now has a control run (`E.noDanger`). Four bots whose
  every paint goal is on the Halo stand on it when the rewind is warned. With the layer, none is on it at its flip; without
  it, all four are.
- **Replans at done** are counted. A route over a vanished piece is dropped; a street route is kept.
- **Fresh nodes ×2** as paint goals for 30 s after done (first half). New this phase: each bot's time to first stand on the
  new era's ground is recorded per done (`botReport().visits`).
- **H16b, pre-position: built, but it only waits when waiting pays.** From J − 8 (looked at again until J − 0.5), a
  paint-mode bot within 14 m of a gate that opens takes the coming era's route through it (`nav.path` with that era's edge
  mask) and waits 3–6 m short of the gate, outside the danger layer, until the gate's own flip. It does so only when the
  route through the gate gets there no later than the detour, give or take a 1.5 s rush allowance. On the Z the gates save
  only a few metres: Degrayling Lane against the GPO terrace's hop is ~10 m against ~14 m. So a bot waits only in the last
  second or so before a flip. Test results:
  - just before the flip, the bot waits and goes through: it arrives at J + 3.29, against J + 3.43 for the control's
    detour;
  - at J − 8 it does not wait;
  - in the 7 bot matches it fired once.
- **Perches: no new code.** The Halo's and the balconies' nodes are valid in their eras, and chargers already score high
  ground (`clamp(y, 0, 5) × 1.6`, so the Halo gets the full +8). Bots were on the Halo for 2.75 bot-s in a 26 s era-3
  window (eras-bots live), and a picture shows one standing there.
- **Statistics** (`StageEras.stats.bots`, `botReport()`, printed by match.cjs and tower-match.cjs as `ERAS` lines):
  - at each flip: own squidkids on a vanishing top, and inside an appearing piece;
  - bot-seconds inside an appearing piece's box before its flip (4 Hz);
  - splats no weapon dealt: counted as the jump's within 4 m of a block that flipped in the last 2 s, the others apart;
  - replans and pre-positions.

**Online (H11; `tests/net-eras.cjs`, docs/NET.md).** There is nothing new on the wire.
- **New: a follower's clock snapping forward across a done still fires that done once** (`era:done { snapped: true }`).
  It brings the fresh weight, the pulse, and the callout if the done is ≤ 2 s old. Bazookarp's field switches on that event,
  so a stalled screen must not skip it. A late join and a test seek do not fire it.
- net-eras covers, with two clients and a third for the late join:
  - the flip skew;
  - solid flags and the nav era after each done;
  - a device on a vanishing piece;
  - the Iron Bridge's cells through its guard window;
  - the results;
  - a host change between the jumps;
  - Practice's clock;
  - a late joiner in era 3;
  - the rewind on all three screens.
- Bluestone is a stage under construction, so the room lists it only with `?wipstages` (`URLQ=wipstages`).

**Every mode (`tests/eras-modes.js`, tower-check).**
- **Zone Control:** each zone's cells are identical (the same ids, all live) before and after each jump on the real
  5:00 schedule.
- **Overtime:** 40 s of stage clock past regulation with no event and no flip.
- **Boss Battle:** in era 2, with no event in 60 s. BossNav's ring is 352 m². An era-3 BossNav built for the record has a
  ring of 0 m², so a change of `fixed` fails the test.
- **Practice's rewind:** a kid on the floating garden is rescued to the quay; a kid on the Halo drops alive to the circus.
- **The menu backdrop (attract):** a jump every 40 s through the rewind, with no chip, callout or era sound.
- **tower-check ERA=1/2/3:** 73.99 m both sides, 0 holes, clearance clean, both rides a knockout, in every era.

**Bazookarp (H21, 12b; the karp module is not merged).** On the era side:
- `StageEras.karpStates()` returns `[{ key: 1…3, nodeOk(id) }]`, each era's valid nodes. The registry forwards it as
  `G.match.stage.karpStates()` (stageMods.js, [b5-eras]), the name the karp engine already calls (b5-karp
  `bazookarp.js _stageStates`).
- `restMask(era)`: a node valid in the era in force and every later one.
- `danger(pos, 0)` covers the drop spot.
- `LAYOUT.bazookarp.statesAdvance = true` (karpField ANDs each state's rests with the later states').
- The karp engine itself switches its field on `era:done`.

`tests/eras-karp.js` part A drives a stand-in built and fed exactly as karpField builds and feeds its own (5/5):
- one build at load, then switches at each done;
- a carrier on ground opened before done has no own node, so it keeps its last value;
- the drop spot never picks a danger node: in a rewind's warning the nearest rest to the Halo is a Halo node, and the
  drop goes to the ground;
- never a node a later era removes: 0 bad rests in 4,808 / 4,892 / 5,844;
- Q19: a Halo drop in era 3 stays on the Halo.

Part B runs the same checks on the real KarpField when a bazookarp match builds `match.karp`; here it reports SKIP.
**Part B is written against the karp API as read in st-b5-karp at fcd3a028, but it has never run.**

**Integration finding:** karpField builds its carrier graph from `nav.valid` at match start, which is era 1's set. It must
read `nav.anyValid`, or the era-3 states lack the Halo and the floating garden. That is one line in the karp package.

**The EraFx dressing (12c).**
- **Pre-bell (J − 20):** one distant ring (`era_bell`) that also shows: Tartar gives a single shake and the kiosks' bells
  flash. The clock rows start counting down (centre hands gold), and the chip shows "TODAY in 20".
- **The warning:**
  - the holograms are up within 0.6 s, where before they ramped over 5.5 s and were invisible at the callout;
  - the wire beads now run along faint drawn wires (new, `colors.appear`) out from the dome.
- **Mural era masks:** `stages/bluestone/murals.js` draws, from nothing:
  - 4, the circus hour ring (all eras);
  - 6, the café mural (eras 2–3);
  - 7, Hoki Lane's street art on the viaduct (eras 2–3: squids, fish-folk, a giant telephone, HOKI LANE);
  - 8, the tram stop markings (era 2);
  - 9, the ghost sign CABLE TRAMS 3d · FLOUNDERS ST (era 1);
  - 11, the 3000s' light seams with FLOOD LEVEL 3026 (era 3).

  The front paints each one in or out as it passes (picture `mural-hoki-J+2.05`).
- **`eras.colors` on every highlight:**
  - the warning's film tint is now derived from `colors.vanish`'s hue;
  - the HUD chip's and callouts' CSS, the bell glyph and the curtain's body take the layout's colours.
- **The time-lapse** (first half) is now tested: the sun swings 45.7°, the clouds race 20×, exposure and the grade are
  held, and the look settles at done. **The env map** is rebuilt once at done + 0.7.

**The bake (T1).**
- `tools/botlab/run.sh tools/botlab/bake.cjs bluestone` took 193.9 s locally: states 1, 2, 3 of 3, hash 22885, 1,142 of
  2,048 rows, an RGB PNG (688 KB, committed). stage-audit with PAGEQ era=1/2/3 says "lightmap applied" 3/3 in each.
- eras-bake.js (3/3) probes the lightmap:

  | Probe | R | G | B |
  |---|---|---|---|
  | Beside Degrayling's era-1 crates | 175 | 217 | 217 |
  | Under them | 166 | 213 | 213 |
  | Shared ground on the forecourt | 253 | 253 | 253 |

- World keys on this branch: `bluestone`, `bluestone.tower` and **`bluestone.boss`** (the poster column is
  `notIn: 'boss'`). There is no `bluestone.bazookarp` until the karp kit's `onlyIn` pieces land. Each key bakes three
  passes (`W.bakePasses()` lives on the world).

**Performance** (REPORTs and probes; Halyard measured on the same machine at the same time; all on high).

| | Draw calls | Triangles | cpuRender | loadMs (lower of two) |
|---|---|---|---|---|
| Halyard | 330 / 400 | 3.37 / 3.52 M | 6.6–6.7 ms | 8,443 ms |
| Bluestone era 1 | 268–288 | 0.75–0.78 M | 4.0–6.9 ms (eras 1–3) | 7,542 ms |
| Bluestone era 2 | 280–339 | 0.80–0.85 M | | 8,075 ms |
| Bluestone era 3 | 262–280 | 0.64–0.87 M | | 9,455 ms |
| Jump 1 → 2 | 329–338 | 0.72–0.76 M | | |
| Jump 2 → 3 | 294–326 | 0.74–0.76 M | | |

- Draw calls come from the spawn camera, characters included. The static scene with characters hidden is 96 / 99 / 97
  calls, 115 mid-jump (eras-look).
- The machine was loaded and Halyard itself took 8.4–9.8 s, so Bluestone loads no slower than Halyard. ENGINE §7 risk 1's
  remedies are not needed. Nav ×3 took 624–699 ms.
- Render per frame, three alternated 3 s runs each:
  - at rest: 5.2–5.4 ms median;
  - jump 1 → 2: 5.7–7.9 ms;
  - jump 2 → 3: 5.0–5.9 ms.

  The REPORT's 12 ms for jump 2 → 3 did not repeat; it was the EMA catching a stall.
- The 50 ms frame check over jump 1: max 12.4 / 40.5 ms (two runs).
- Paint density on high: 27.6 ppm on the 4,096 atlas (Halyard 27.6). Lightmap 1,142 rows (Halyard 740).

## 2. Decisions where the request left a gap
1. **H16b waits only when waiting pays** (arrival through the gate no later than the detour + 1.5 s), and it walks at the
   gate group's own flip, not at done. A literal "hold at J − 8" would idle a bot 12 s to save 4 m on this stage.
2. **Perches:** no new weight. The union graph plus chargers' existing high-ground score cover them. The Halo is risk 16
   (dominance), so I did not add a pull toward it.
3. **"Every bot … within 20 s (median)"** is judged as the median over the bots. A bot that never reaches new ground
   counts as never.
4. **The pre-bell shows its ring** (Tartar's shake, the kiosks' bells) as well as playing it: the task's "Tartar's phone
   and the kiosks ring".
5. **Holograms at full strength 0.6 s into the warning.** The sepia flicker still ramps.
6. **Wires are drawn under the pulses** (FX, in the warning). The real overhead wires are the art pass's.
7. **The era band clears the HUD's banners.** In a 3:00 Turf War "1 minute left!" and jump 2's "3000s" come on the same
   frame.
8. **A snapped done fires its event** (H11, above).
9. **Murals on the Z's faces** (DESIGN §5.4 is updated): the viaduct is Hoki Lane's west wall here, so the street art
   goes on it. 5 and 10 are left to the art pass.
10. **The bake is committed** (one key) so the stage audits apply it. The art phase re-bakes all keys.
11. **`statesAdvance: true`** in the Bazookarp data (era states only advance in a match).

## 3. Online and bots
- **Online:** no records were added. The state is a pure function of the host's stage clock.
  - **Splats:** field 15 (the painter's time) runs from J − 1 to done + 1, and every screen judges the guard at that time.
  - **Own actors:** each screen shoves, rescues and pops its own squidkids and devices.
  - **Followers:** a follower snaps to the host's clock (`seek('clock')`), and a snap past a done fires that done.
  - **Late joiner:** applies the host's era on its first tick (`seek('late')`).
  - **Host change:** the new host's clock simply runs on.

  docs/NET.md says so.
- **Bots (local; the stage set's average from the Mac mini's sp-fixes / drainbow JOBs: Turf War 0.10 %, Zone Control 0.37 %):**

| Match | Result | Stuck | Era shoves | Splats by a jump | Era-3 visits (median) |
|---|---|---|---|---|---|
| Turf War 3:00 #1 | 33.2 / 34.0 % | 0 % | 0 | 0 | 8.8 s |
| Turf War 3:00 #2 | 38.6 / 28.4 % | 0.1 % | 0 | 0 (one water fall on the punt 2.5 s after the last flip, 13 m from it: not counted) | 18.7 s |
| Turf War 3:00 #3 | 24.6 / 43.2 % | 0.1 % | 0 | 0 | 17.1 s |
| Zone Control #1 | Alpha by time 68–72 | 0.5 % | 0 | 0 | 18.4 s |
| Zone Control #2 | Alpha by knockout | 0.1 % | 0 | 0 (1 other) | 19.8 s |
| Tower Command #1 | Alpha by time 35–73 | 0.1 % | 0 | 0 | 11.5 s |
| Tower Command #2 | Bravo by time 100–31 | 0.1 % | 0 | 0 | — (2 of 8; the riders keep to the tower) |

  - At every flip of all seven matches, 0 bots were on a vanishing top and 0 were inside an appearing piece.
  - Bot-seconds in an appearing box before its flip: ≤ 0.27.
  - Pre-position fired once.
  - eras-bots live (1:30): 0 / 0 / 0, era-3 median 3.65 s, stuck 0 %.

## 4. Tests (local, at the final code unless marked)

| Test | Result |
|---|---|
| eras-jump | **21/22**: every behaviour check passes, including 'first', 'sky', the snapped done and the 50 ms frame check over jump 1 (max 40.5 ms). The failure is the review-fix-1 *timing* check on the Bravo / time-of-day jumps: single 84 / 65 ms spikes, against a no-jump baseline of 521 ms. It is flaky on a shared machine; its deterministic half (no base raster built from J to done + 1) passes. |
| eras-bots | 5/5 |
| eras-hud | 10/10 |
| eras-look | 12/12 |
| eras-modes | 6/6 |
| eras-karp | 5/5 (B: SKIP) |
| eras-world | 21/21 |
| eras-bake | 3/3 |
| eras-static | 12/12 |
| net-eras | **12/12** (run 3). Flip skew 0.118 s (jump 1) / 0.035 s (jump 2); clock skew 0.07–0.09 s. Run 2 showed 0.63 s: the harness's own 20 ms polling had held the guest's frames back; the test now waits in the page. |
| tower-check ERA=1/2/3 | clean |
| stage-audit PAGEQ era=1/2/3 | 3/3 each |
| check-maps | bluestone ok in all three eras (0 strips). The repo's only failure is still halyard's 25.7° ramp, which is not this branch. |

Regressions (`regress/`):

| Test | Result |
|---|---|
| world-build | 5/5 |
| ink-wipe | 8/8 |
| movers | 17/17 |
| pods | 39/39 |
| treehills-pods | 14/14 |
| stage-audit halyard / calamari / treehills | 3/3 each |
| stage-mods | 36/36 |
| net-stagemods | 10/10 |
| net-practice (CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1) | 29/29 |
| net-stageclock | 3/3 |
| net-turf | 9/9 |

Halyard, calamari and treehills keep the program key `inkwave-level-v8` (eras-world part 5).

**Pictures** (`out/engine/`, 45–155 KB each, all looked at):
- `prebell-phone`
- `jump1-knee-{J-10,J+1.5,done+1}`, `jump1-quay-{J-10,J+1.5,done+1}`
- `pulses-warn`
- `mural-hoki-{era1,J+2.05,era2}`, `mural-seams-era3`
- `timelapse-sky-J+{0.1,1.0,2.0,3.0}`
- `jump2-quay-{J-10,J+2,done+1}`
- `minimap-era{1,2,3}`, `minimap-era1-warn`, `tabmap-era{1,2,3}`
- `bot-on-halo`
- `rescue-garden-{before,after}`
- `lightmap-probe` (`probe-lightmap.js`): R / G / B of the street face under the crates. R is at the floor value under
  them; G and B are light, with the café tables' contact AO.

## 5. Commits; files
**Commits:**
- **Module and test commits:** 5aa9068b, 59789c95, 0cd06847, 82b103ac, 3f91bc2b, 1cd31873, c2c676ce, 1d60e8f4,
  cd62e353, a764f6fe, 1cd5e1d7 (the bake), 268c007c.
- **Scratch commits:** cc6aa6ea, 74dc1672, 513a7533 (pictures), and the commit carrying this report, its logs and the
  probe picture.

**Shared files, for the integrator (each change small and tagged):**
- `src/game/stageMods.js`: `karpStates` in R_HOOKS plus one query method [b5-eras].
- `tools/botlab/match.cjs` and `tools/botlab/tower-match.cjs`: `RESULT_JSON.eras` and the ERAS lines [b5-eras].
- `docs/NET.md`: the eras paragraph.
- `docs/STAGE-MODS.md`: the `karpStates` row, H16b, the H21 integration note.

**Module and stage files:**
- `src/game/eras.js`, `src/fx/eraFx.js`, `src/world/eras-data.js`;
- `src/world/stages/bluestone/{layout.js, murals.js}`: mural fields and `statesAdvance`, **no geometry change**;
- `assets/lightmaps/bluestone.{png,json}`.

**New tests:** `tools/botlab/tests/eras-{bots,modes,karp,bake}.js`, `net-eras.cjs`.

## 6. What the art phase must know
- **The module's API.**
  - The world `G.eraWorld` (EraWorld):
    - `names`, `uniforms` (`uEra`, `uEraW`, `uEraTint`, `uEraRemap`, `uMurEra`, `uEraColA`, `uEraColV`, `uEraT`,
      `uEraFar`), `groups`, `meshes`, `propMeshes`, `fx`, `stats`;
    - build hooks: `prop`, `colliders`, `attachLevel`, `attachPaint`, `levelMaterial`, `levelFilter`, `afterMeshes`,
      `buildNav`, `attachMinimap`, `mapBlock`, `attachEnv`, `ready`;
    - `apply(e)`, `looks`, `inkOk(b, et)`, `present`, `now`, `bakePasses()`, `bakeMode`, `dispose`.
  - The runtime `G.match.eras` (StageEras):
    - state: `sched`, `era`, `phase`, `next`, `front`, `fresh`;
    - queries: `eraAt(r, t)` / `eraAtPoint`, `eraInForce`, `jumps`, `present`, `inkOk`, `near`, `splatTime`,
      `dangerAt(pos, pad)` / `danger`, `outlines()`, `restMask(era)`, `karpStates()`;
    - hooks: `goalWeight(id)`, `botAct`, `drawMap`;
    - per frame and clock: `update`, `seek(t, why)`;
    - tests and audits: `state()`, `botReport()`, `debugJump(to, { inS, instant })`, `dispose`.
  - Events: `era:prebell / warn / ring / jump / flip { group, on, off, r } / done { era, snapped? } / set`.
  - Audit switch: `?era=n`.
  - Test switches: `E.noDanger`, `E.noPrepos`.
- **Era meshes.** One level mesh per mask, `level:era<m>` (+ grate twins):

  | Mask | Eras | Pieces |
  |---|---|---|
  | 1 | 1 only | the Degrayling crates |
  | 3 | 1–2 | the cab-shelter top, the boat shed, the ferry booking office (2 halves), the goods wagon |
  | 4 | 3 only | the Halo (16 sides, 36 rails, 12 planters), the hotel / boat / river stairs, their landings and glass, the bike dock, the floating garden (12 tiles, 10 planters) |
  | 6 | 2–3 | the Iron Bridge (6 spans, 12 rails, the lamp), the café tables |

  The tram block is a shared hidden collider; its three looks are props.
- **Prop buckets** are `props:<material>@e<mask>` (metal / wood / glow @e1, rubber / gloss / metal / glow @e2,
  rubber / glow / gloss @e4). Era props:
  - cable tram / tram / float-tram;
  - gas lamp / street light / light mast ×10 each;
  - glass towers ×6 (era 2), spires ×6 and the light lattice (era 3).

  Rule 40 allows ≤ 5 materials per mask and **static merged parts only**.
- **Material tags:**
  - the level program key ends in `-eras`;
  - era prop materials have the cache key `…|era-aTag`;
  - shadows use `era-depth-aEra` / `era-depth-aTag`;
  - the backdrop's era sets have `|eraset`;
  - `aEra` = (mask, r_g) on every level vertex; `aTag` on the era props.
- **Highlight colours:**
  - `eras.colors.appear #f4e9c8`: holograms, wires, beads, the outlines' dashes, the done pulse, the front line, the
    bell glyph, the HUD chip and callouts;
  - `eras.colors.vanish #a9a49a`: the hatching, the warning's film tint (its hue);
  - the curtain's foot: brass `#c79a4e` in jump 1, pearl `#e9ecf2` in jump 2 and the rewind;
  - never a team ink.
- **Sound cues** (`src/audio/sfx-eras.js`): `era_bell` (pre-bell), `era_ring` (long / short), `era_kiosk`,
  `era_pickup`, `era_swell`, `era_front` (a loop riding the front), `era_pop`. `era_strike` is registered but unused:
  the striker clock has no prop yet.
- **Bake passes.** `W.bakePasses()` is `[apply(1), apply(2), apply(3)]` into R / G / B; the JSON says `channels: 3`.
  - Keys: `bluestone`, `bluestone.tower`, `bluestone.boss`, and `bluestone.bazookarp` once the karp kit adds its pieces.
  - Re-bake after any collider change (`run.sh bake.cjs bluestone bluestone.tower bluestone.boss`).
- **Left to the art pass:**
  - jump 2's hexagonal-shard curtain;
  - a softer dissolve than the 20 cm blocks;
  - real overhead wires;
  - murals 5 and 10;
  - the striker clock's prop;
  - era ambiences;
  - the GPO clock;
  - the curtain's brass foot against Tangerine ink (it is transient, but worth a look).

## 7. Unfinished, flaky or uncertain
- **The review-fix-1 frame timing check** (Bravo / time-of-day jumps, 50 ms cap) fails on single spikes on this shared
  machine. Its no-jump baseline itself spikes to 521 ms. It needs a quiet machine: `JOB-6.sh` (committed, for the record:
  frames and 'first' ×3, the perf REPORTs, net-eras) is the job for the Mac mini.
- **COMMON.md (uncommitted in this worktree) says the Mac mini is back.** My task said unavailable, so nothing was sent
  and nothing was pushed.
- **Bazookarp part B has never run** (no karp module here). The karpField `nav.anyValid` integration line is for the
  karp package.
- **Era-3 visits in Tower Command:** 2 of 8 bots in one match. Objective roles keep bots off the new ground; the fresh
  weight only applies to paint goals.
- **The lightmap is baked for this geometry.** Any collider change makes it stale (the loader warns and skips it).
- **No balance sets were run** (the lead's consolidated pass); the Halo-dominance check is still risk 16.
