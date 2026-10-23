# Lead's notes for Gulper Aquarium after the blockout passed (2026-10-09)

The blockout passed review in round 2. The reviewer's five minor items, decided:
1. Spawn → mid 6.4 s against the design's 6.3 s ceiling: accepted (the Long Stages standard is "about 6 s").
2. The Express span, its spine and the lowered Pump Hall roof make one bar across the spawn view at the skyline: fix it
   in this phase (thin the spine, raise or re-route the span, or lower the roof) so the bathysphere and the tank read
   whole from the spawn's player camera; re-take spawn-play-camera.jpg.
3. Two tower pictures reported as re-taken are stale: re-take them.
4. The Zone Control lead-change criterion: dropped as an acceptance item; keep it as a number you report.
5. The side zone nearer the centre than its own spawn: accepted (every Long Stage does the same).
DECISIONS.md #24 (device aprons through G.level.noPlace): the registry offers it; use it only where DESIGN.md wants an
apron (pipe mouths, the deck's exits); do not add aprons the design does not ask for.

# After the pipe engine passed (2026-10-10): decisions for the art phase
1. Bots planning pipes they will be refused at (own cooldown, an active special) and pushing at the mouth for up to
   2 s: fix it as the reviewer's "fix" text says (price those keys at Infinity in beforePath; drop the path on a
   refusal), and show two Turf War matches with giveUps 0.
2. The S. Promenade landing (Arch B and its twin): move the kiosk 1–1.5 m to the side so the cover stays within 3 m but
   is off the pop axis; re-take the arch-4/5/6 pictures.
3. Feeding Time (DESIGN §3.4): build it in this phase as a cosmetic set-piece on the stage clock (fish rush, bubbles,
   a PA chime); it must not change play.
4. Add the share of arrivals at mid's high ground that come by pipe to PAGEQ=pipestats and report it (DESIGN §6.2(e)
   target 10–35 %); if it is outside, say so and propose the lever, do not retune in this phase.
5. The 2-client kink report (net-test.mjs) is not required; net-pipes.cjs and net-pipes-leave.cjs stand for it.

## After the art phase's third review (2026-10-16): the lead's decisions for fix round 3

The lead looked at the stage art card and the reviewer's day, dusk, ring and touch-pool sheets. The place is there: the
Streamline gatehouses, the gantry and bathysphere, the Great Tank's brass rim, the kelp drums, Reef Hall, the signage,
the dusk glows. The stage art card is accepted. This round is dressing and shaders only: no collider changes, no
re-bake, nothing on a walkable top, nothing that touches play.

1. **The touch pools** (the review's major): do exactly as the review asks (viewing panels with the pool's water and
   creatures at child height on the long faces, a rockery skin that breaks the top line, a brass handrail, a proper
   sign), on both halves, and re-shoot from the court floor at 1.7 m from the three places named.
2. **The three minors as written:** the corner z-fighting (covered by the rockery if it wraps the corners), the rays
   rebuilt as eagle rays with pale bellies (one draw call kept), the Reef Window filled with a real reef in DESIGN
   §5.4's palette with its own glow at dusk, the Deep Dome tube dim at dusk with only the streak and the collar lamps.
3. **Two faces the lead saw at eye level that the review did not list:** (a) `scratchpad/aqrev3/shots/day2/
   aquarium-day-court-NE-eye.jpg` is half filled by one flat dark face with no detail; find what it is (a gantry leg
   seen close, the deck block's flank, a tank base?) and, if it is a stage face a player walks past at eye level, give
   it what its neighbours have (string-course, portholes, a plaque, faience lines); (b) `aquarium-day-plaza-sea.jpg`:
   the long plain tiled wall behind the crates reads as a bare block; break it with pilasters, a mural band or
   portholes in the stage's style. Prove both with a before / after picture pair.
4. **The boss check:** "stays on its home ground" failed in both of the reviewer's runs (243 and 262 of 300 samples
   off the planned cells) after passing in review 2. Run it 3 times; read the boss's trail; if the boss really leaves
   its ground (a navigation input changed, a prop collider in the way), fix it; if it is fight variance, show the
   trail and say so. The home ground on Bravo's ferry plaza stands (the lead's call in review 2).
5. **Performance** is accepted as level with Halyard (cpuRender within noise, draw calls 5–10 % over in the same
   render mode). Add nothing that costs a draw call per instance: the new reef, rays and panels batch like the fish.
After this round the stage waits for integration (the wave 2 base, a Bazookarp layout, the wip flag off at the end).

## After review 5 (2026-10-16 evening): the LAST art round, and how it ends the eye-level hunt

Reviews 3, 4 and 5 each found new bare pieces because each walked new places. That stops now: this round is ONE
complete eye-level sweep by the builder, then one review that repeats the sweep. If it fails again the stage waits.

1. **The complete sweep, first.** From `layout.js` list every structure on Alpha's half (the mirror follows): every
   cover block, plinth, dais, rock, pile, wall face, stair flank and nosing, hut, set, tank base and sign. Shoot each
   at 1.7 m from the floor a player walks past, day and dusk, as one contact sheet per area (`r5-sweep-<area>.jpg`),
   and mark on the sheet what is bare. Dress everything marked in the same pass, in the language the earlier rounds
   set (shader faces under the ink; props within 8.5 cm of a face and below walkable tops; no collider, no layout
   change except item 3). The review's list is the minimum: Penguin Point's terrace faces and tops, the upper rock,
   the basking rock, the ice pile (as the review specifies, with the PENGUIN POINT plaque), the Pump Hall's pump sets,
   the touch-pool dais and step, the Ticket Hall's plaza plinth face.
2. **Nits:** the Lookout portholes' dusk glow goes warm like the rest; the topiary's spokes blend into the bed.
3. **The grand stair's head (the lead's call): add the granite nosing block** across the head, as `penguin-nosing`
   does (radBox, about 8 cm proud, `paint: false`), on both halves, then re-bake aquarium and aquarium.tower (locally
   or on the Mac mini, your choice) and re-run check-maps, climb-audit, stage-audit, cover-map; prove the sawtooth is
   gone from court-promwall, stairtopB and stairfoot-up.
4. **The stage art cards** are re-made last, from the same hero camera and scene, after everything above.
5. **Exit camping** is not this round's: the lead has sent the Mac mini the pipes on / off set.
6. **Triangles** +6–12 % over Halyard with level draw calls and render time: accepted by the lead.
7. **The boss** off its planned cells by ≤ 1.5 m in the ring's necks: accepted as fight variance; the home ground on
   Bravo's ferry plaza stands.

## The Mac mini's pipes on / off set (2026-10-17, 24 matches at e1169a39; `aquarium/results/JOB-4.txt` on botlab-b5-aquarium)

- **Camping:** pooled over both modes 1.74× the base (cap 2×), but Turf War alone 2.99× [1.7–4.9], concentrated at
  the Kelp Lines' B ends and the Gulper's B end; Zone Control 0.74×; every Arch end 0/29. **Decision:** the design's
  one step, exit cooldown 2.5 → 3.5 s, in every mode, applied at integration (not in the art round); the B-end
  asymmetry (why Bravo's kelp and gulper exits are the camped ones) is a question for the consolidated pass.
- **Rides** 0.65 / 0.61 per bot-minute and **high-ground arrivals by pipe** 17 / 23 %: within target. Turf and splats
  on vs off within ±10 % except one knockout match.
- **A real bot bug, pipes on only, Zone Control:** stuck 2.05 % (bar 1 %), longest 20.25 s (bar 10 s); 16 of 18
  episodes ≥ 2 s at the Great Tank: bots on the tank's rim / sand bed at (±1.1–1.7, y −0.6…0.5, z ≈ −6.8) whose next
  nav edge is a 'jump' up to the Feeding Deck node (±1.5, 2.4, −7.5) they cannot make (noProg 0.1–1.3); and a roller
  idle on the deck 20 s with its goal 0.5 m away (goal tolerance at the deck node). With the pipes off: no episode
  there in 6 matches. **To fix before the stage merges** (a small bots round after the art round; the Mac mini re-runs
  6 Zone Control matches to prove it): the impossible jump edge (a pipe-module nav edge or a stale one at the tank),
  and the deck goal tolerance.

## After review 6 (2026-10-17): the stage waits for the weekly usage reset; review 6's list is THE list

Review 6 swept every tag of Alpha's half (121 tags, 164 views) and found what round 5's sweep passed over: the
Feeding Step's two sides and top (mid's main hop-up), the Kelp Ramps' parapets, the whale-tail benches, the Penguin
Steps' head teeth (one line: the nosing to r 31.4 + re-bake), the trolley stack, the lectern, four weak large faces
(the pylon's radial face, the plant room's face, the deep Kelp stop's panels, the ice-cream cart's back), the topiary
seam, the pavilion ink proof. Everything else is dressed and accepted. **The next round (after Friday 2026-10-23 06:00,
when the weekly usage resets) does exactly that list, one fix + one review, and nothing else.** Two items go elsewhere:
- `tests/pipes.js` 'cam' fails on the shared slot profile's saved fov 50 / quality low: a harness fix for the
  integrator (reset `g.settings` to DEFAULT_SETTINGS for the ride check), not the stage's.
- Performance: the shoot.cjs REPORT numbers are not like-for-like (each stage's own load camera, a loaded Mac). The
  lead has sent the fixed-view probe (`tools/perf6.js`, default settings, day and dusk, both stages) to the Mac mini.
  If triangles stay over +12 % or cpuRender is not level there, the next round also turns the plates' lettering into
  murals / a texture (about 29 k triangles), starting with the eight biggest plates.
- **Performance: CLOSED (2026-10-17, the Mac mini's fixed-view probe, quality high, 3 runs per cell, load 2–4).**
  Aquarium is level with Halyard on draw calls (×0.93–1.03) and cpuRender (×0.93–0.98), day and dusk, and about
  18 % UNDER on triangles per view (2.7 M vs 3.3 M). No lettering-to-mural work is needed. `aquarium/results/JOB-5.txt`.

## After review 7 (2026-10-23): the kiosks, and the sweep becomes a tool

Review 6's list is closed. Review 7's sweep (a new tool: every tagged block clustered, 3–8 eye positions each, 530
views) found the one family no sweep had walked: the kiosks. This round, binding:
1. **Adopt the sweep as a repo tool first:** copy the reviewer's `scratchpad/aqrev7/tools/sweep.cjs` into
   `tools/botlab/stage-sweep.cjs` (MAP=, TIME=, OUT=; sheets per cluster; a list of clusters with no eye-level view),
   document it in tools/botlab/README.md, and run it on this stage before and after your changes; attach the sheets.
   Every later stage review uses it.
2. **The Ticket Hall booth's glazing buried 2 cm inside its block** (both TICKETS faces blank): a bug; bring the glazing
   proud of the face, both halves.
3. **The South Promenade ice-cream kiosk's three bare faces** (its back is the centrepiece at the head of the Penguin
   Steps), **the other three kiosks' backs, the luggage scale's three faces**: dress as the review specifies (pilasters
   and the speed lines on every face; the flavours board on the ice-cream back; shutters or framed posters on the
   sides; the scale's dial, plate and brass trim), within 8.5 cm, nothing over the cornice, no collider.
4. Re-shoot the review's named cameras, re-run aquarium-art.js (with a pixel read of the kiosk back and the booth
   glazing that fails at de3bd111), pipes.js, one Turf War match; the cards only if a card view changed.
Accepted and unchanged: triangles, the boss, camping (cooldown 3.5), the Great Tank bot bug (the beta fix round), the
skylights' tile, the pavilion stair flanks.

## After review 8 (2026-10-24): the last three faces

Review 7's list is closed; the sweep tool is in the repo. Review 8 lists what is left; all of it this round, binding:
1. **The Express OUT stop on Penguin Point** (a bug: its speed lines are drawn 0.3–0.6 m inside the rock terrace):
   lift the lines over the stop's own floor and give both long faces the kiosk pass (skirting with a brass line,
   corner pilasters, brass portholes or a framed ARRIVALS plate), as the review specifies; a pixel read in
   aquarium-art.js that fails at a2f28b8d.
2. **The Ticket Hall booth's render base** and **the Reef Window's short west run / the Service face** the review
   names: the same language (skirting, pilasters, speed lines, a plate), within 8.5 cm, no collider.
3. **aquarium-art.js section 8(c)** (the spawn decks' planters) is flaky: make it read where the ink cannot land, or
   splat first; 3 runs clean.
4. Nits: the dusk sheet titles; the three sweep cameras against a face (nudge them in the tool).
Then the sweep before / after, the named cameras, pipes.js, one Turf War match. Nothing else is open on this stage.
