# Tower Command: making the stages fit the user's tracks

This is a scratch job folder. It is never merged into the PR.

INKWAVE is a Splatoon-style 4v4 shooter: three.js ES modules, no build step, run in Electron.

Tower Command is our Tower Control. A square tower platform rides a mirrored track from the centre into the enemy base:
- Riders push it; checkpoints stop it until cleared; reaching the goal is a knockout.
- The rules engine is `src/game/tower.js` (read its top comment).
- The look is `src/fx/towerFx.js`.
- The tracks are `src/world/tower-data.js`.

## What the user asked for (their words, 2026-09-28)

The user drew a track on each stage's top-down, from the centre (the cyan square) to Alpha's goal on Bravo's side. Dark-green squares are checkpoints. Yellow notes are stage changes. Magenta squares are the new inflatable cover. Blue X's mark things to remove.

What they said:
- "some stages are going to need bigger updates than others to make it work. you have overall permission to redesign some stages if i havent listed it, but keep it recognisable what the stage is"
- "keep everything in straight lines only. and the path can go up and down to trace walls and drops the tower needs to go next to"
- Their Splatoon references show the rail as a thin line on the ground in the riding team's colour, going straight up the side of boxes and walls and across their tops. "The line shows you the middle of the bottom of the tower, but it wraps up to walls and ledges even though the tower doesnt clip through it."
- "i intentionally added some lengths to make the line longer": keep every jog and detour they drew. Never shortcut their shape.
- The inflatables "are just uninkable obstacles, cannot be jumped over, and you slide off them … they can be dotted around maps when making maps for cover".
  - Place them with `{ type: 'inflatable', size: 'small' | 'long' | 'square', pos: [x, y, z], rotY }` in the stage's dressing (`src/world/props.js`, `D.inflatable`).

## How the track works now (already built — don't change tower.js; report if you think it needs to)

`tower-data.js` holds each stage's corners `[x, z]`, centre → goal, plus `checkpoints: [[x, z], …]` on Alpha's side. Bravo's side is the 180° mirror. From those corners the engine builds straight 3D pieces:
- **Runs** follow the floor under the WHOLE 2.5 m platform.
- **Inclines** are straight, over ramps and stairs.
- **CLIMBs** go straight up where the platform meets something it can't pass under with 3 m of headroom (a box, a wall, a kerb over 0.45 m). The climb happens flush in front of it, onto its top.
- **DROPs** go straight down once the platform is fully past an edge.
- **Holes** are places with no floor under the platform at all (water). These must not exist on a finished stage.

The platform never turns (fixed heading = the stage's grid). The rail is drawn over the floors and up and down the faces.

## Your job, per stage

1. **Read the stage.** Stages live in `src/world/stages/<id>/`:
   - `layout.js`: level blocks. `half` pieces are mirrored (x, z → −x, −z); `single` pieces are not.
   - `props.js`: the PropKit types plus `PLACEMENTS`, the dressing half-list, which is mirrored unless `mirror: false`.

   Halyard is the exception: it lives in `src/world/maps.js` (`HALYARD`), `src/world/dressing.js` (`DRESSING.halyard`), `src/world/props-marina-dock.js` and `src/world/props-marina-vessels.js` (boats!).

   Mirroring: author each change ONCE (either half); it appears on both sides. The user drew on Bravo's half (z > 0), so a feature drawn at (x, z) can be authored at (−x, −z).
2. **See the track as it is.**
   ```
   MAP=<id> tools/botlab/run.sh tools/botlab/tower-check.cjs
   ```
   - Output (`OUT` defaults to `.botlab/tower-check/`): every run, incline, CLIMB (with the block it goes `onto`: tag, prop collider or railing, centre, size) and DROP; holes; clearance problems; a ride test both ways; pictures `<map>-top.png` plus a shot at every climb, drop, corner, checkpoint and goal.
   - Try track tweaks without editing `tower-data.js` via `TOWER_DEF='{"path":[[0,0],…],"checkpoints":[[x,z],…]}'`.
   - `RIDE=0 SHOTS=0` gives a quick text-only run.
3. **Make the user's notes real** (per-stage list below). Keep the stage recognisable and at the quality bar of Halyard Marina: a real place, themed props and surfaces. Keep additions straight-edged (the user: straight lines only).
4. **Clear the track so it reads like Splatoon's.**
   - Long flat runs. A FEW deliberate climbs and drops onto boxes, walls and ledges, including the ones the user's notes create.
   - No stutter over clutter: benches, bollards, lamps, crates, planters, railings or kerbs the platform hops over, a dozen tiny climbs in a row, the track climbing onto a roof by accident.
   - Move or remove small props the checker names in `onto`. Lower or cut railings where the track crosses. Keep the look (move a prop aside rather than delete a landmark).
5. **Adjust the track only to fit the geometry.**
   - Shift a run ≤ ~1 m to line up with a deck, bridge or door.
   - Never change its shape, its detours or its lengths beyond that.
   - Keep checkpoints where the user put them, unless one lands mid-climb (then nudge it onto the nearest flat).
6. **Finished state per stage (the checker, both sides):**
   - 0 holes.
   - No "solid inside the tower" / headroom problems except deliberate climbs.
   - Both ride tests end in a knockout with 0 riders knocked off and no stalls.
   - Pictures show a clean rail.
7. **Don't break the other modes.**
   - Run `MAP=<id> MODE=turf SECS=120 tools/botlab/run.sh tools/botlab/match.cjs` and `MODE=zones`. They must show no console errors, and the stuck % must not jump. Compare against a run BEFORE your edits.
   - Zone Control zones (`src/world/zones-data.js`) must still sit on sensible floor. If your change breaks a zone, fix the geometry, not the zone; report if unavoidable.
   - Run `node build/check-maps.mjs`. There is a known pre-existing warning: Halyard ramp 25.7°.
8. **Rebake ambient occlusion for the tower variant only**, after geometry changes: `<id>.tower`. `<id>` and `<id>.zones` must stay byte-identical.

## Map rules (the user's standing rules)

- **Roofs and unreachable tops:** non-inkable, and players slide off (`roof: true` on layout pieces, `B.col(…, { roof: true })` on props). Exception: something the user calls inkable (Lockgate's "INKABLE ROOF").
- **Railings and grates:** use `rail: true` (block walking; shots and ink pass).
- **Perches** reachable only by specials: `perch: true`.
- **Modes:** every change is for **Tower Command ONLY** (the user, 2026-09-28). Turf War and Zone Control stay byte-identical. New pieces get `onlyIn: 'tower'`. Removed or moved pieces get `notIn: 'tower'` on the original plus an `onlyIn: 'tower'` copy. A piece already tagged `notIn: 'zones'` becomes `notIn: ['zones', 'tower']` (tags take lists). Bake only `<id>.tower`. `<id>` and `<id>.zones` must not change. See `src/world/variants.js`.
- **Git:** never touch `dist/`, never run `npm start`, never kill processes you didn't start. Commit as `-c user.name=LilDannyy -c user.email=94884334+LilDannyy@users.noreply.github.com`, message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Report (per stage)

- What you changed, and why.
- The final track (paste its `tower-data.js` entry).
- The checker summary line (`RESULT_JSON`).
- Turf and zones before/after.
- Anything you interpreted from a note that the user should confirm.

Put 4–6 key pictures (top + the interesting climbs) in `tools/botlab/jobs/tower-stages/out/<id>/` as JPG or WEBP, under 300 KB each.

---

## Per-stage notes

World metres: x up the image, z to the right; the user drew on Bravo's side (z > 0). The drawn track and checkpoints are already in `tower-data.js`. `<id>-drawn.webp` is the user's drawing and `<id>-track.webp` is the track overlay (red = our track, green = the drawing).

### Halyard Marina (the quality bar — the biggest job)

The track runs from the centre along the central pier (+x, z ≈ 0) to x 17.6, out over the water, and round to the checkpoint at (11.3, 17.8). It then goes down (−x) at z 17.6 across the pier and a boat to (−12.6, 17.6), then +z to the goal (−12.6, 30.4).

Checkpoints: (17.8, 2.1), (11.3, 17.8), (−6.9, 17.8).

Notes (world rectangles, x-range × z-range):
- **FLOAT (x 10…19.5 × z −2.8…10.5, an L-shape):** floating pontoon decking so the track can cross the water there: along the top (x 16–19.5) and down the right arm (z 5–10.5).
- **FLOAT (x 4.7…12.5 × z 14.5…23.5):** a pontoon around checkpoint 2.
- **"BOAT WITH 1 WAY DROP" (x 4.7…12 × z 25…31, arrow pointing +x / −z):** a moored boat you can drop down from but not climb back onto (one-way).
- **"RAMP ↑" (x −1.8…2 × z 22.8…26.3):** a ramp going up toward +x, next to the kiosk. Probably the way up onto that boat.
- **"BOAT" / "BACK OF BOAT" (x −4.2…−10 × z 14.5…23.5):** a boat whose back deck the track crosses. Checkpoint 3 sits on the back of the boat.
- **FLOAT (x −4.5…−10 × z 25.5…31.5):** another pontoon beside that boat.
- **"CRATE TO TOP ←" (x −1.5…−4.5 × z 3…8.8):** a crate as a step up to the top of the raised central-pier deck, from the side.
- **"RAMP ←" (x −18.5…−20.8 × z 23.8…30.3):** a ramp by the red-roofed building, rising toward −z (up onto it).
- **Blue X (remove what's there):**
  - The centre (x −2…2 × z −2…2).
  - Two spots on the pier along the track: (13.6, 0.5) about 5.5 × 2.4 m, and (11.9, 2.8) about 3.4 × 1.4 m.
- **Inflatables (Bravo side; each mirrored):**
  - small at (20.5, 13.2), (2.2, 13.8), (−2.2, 13.9), (−11.2, 21.6), (−17.5, 23.3)
  - square at (3.3, 30.1), (−3.3, 30.1)

Boats and pontoons: reuse the marina vessel and dock kits (`props-marina-*.js`) so they match. Decks are walkable and inkable, hulls not. The stage's water is not a floor, so every piece of track over water needs real deck under the whole platform.

### Tidewater Plaza

The track runs from the centre (inside the clock tower) down −x to the promenade (x −19.5), right to z 4.7, back up to x −15.4 by the stairs, then +z. It goes up past the flower bed, round it, down through the gazebo (checkpoint) to the goal by the fountain basin (−4.4, 28.4).

Checkpoints: (−15.0, 12.8), (0, 21.4).

Notes:
- **"Hollow out bottom of tower" (centre):** the Jubilee clock tower stands on the start. Open its base (arches, a clear floor ≥ 3 m high) so the tower starts inside it and rolls out.
- **"MAKE TALLER" (the gazebo, centre ≈ (−1, 21)):** raise the gazebo roof so the platform and riders pass under it with ≥ 3 m clear. Checkpoint 2 is under it.
- **"Reverse STAIRS ←" (x −17…−20 × z 6.8…19):** the stairs between the promenade and the plaza near where the track comes back up. Turn them to run the other way (arrow toward −z) so the track's climb back up works. Look at the geometry and make the climb read cleanly.
- **Inflatable:** one long at (−4.9, 5.1), its long side diagonal (running along x = z).

### Kelpline Terminal

The stage is laid out on a −37° grid. The track zig-zags between the container stacks.

Checkpoints: (−6.7, 12.0), (−1.0, 19.8), (16.9, 9.8).

Notes:
- **A yellow tag reading "GAP" (maybe "CAP"; rotated) at about (17, 10), on checkpoint 3:** the track crosses a gap there. Bridge or fill it so the platform has floor.
- **Blue X at (4.1, 11.8):** remove that object (by a container stack next to the track).

### Saltpan Basin

The track goes −x from the centre to (−17.4, 0), +z to checkpoint 1 at (−17.4, 8.6), then +x along z 8.6 to (13.0, 8.6). It continues +z to checkpoint 2 at (13.0, 18.4), −x to (2.9, 18.4), then +z to the goal (2.9, 30.2).

Blue X (remove): (−7.2, 8.5) and (−18.5, 8.7), both on the track.

A first check shows the straight track currently hops onto:
- a lot of 1.3–1.8 m clutter (prop colliders, railings)
- the gantry head at 3.6 m
- 5.4 m tops

That's 34 climbs, which is not how it should read. Clear it.

### Crossroads Market

The track runs diagonally from the centre along the hall (~30°) to checkpoint 1 at (21.1, 12.3). It then goes +z to (21.1, 17.8), −x to (16.2, 17.8), +z to (16.2, 19.7) (a step round the building corner), −x along z 19.7 to (0.4, 19.7), −z to (0.4, 10.2), −x along z 10.2 through checkpoint 2 at (−12.8, 10.0) to (−17.4, 10.2), then +z to the goal (−17.4, 30.9).

Notes:
- **"EXTEND ←" (x −10…−16 × z 10…16):** extend the planter / terrace row there toward −z so it reaches the track. The track then climbs onto it; checkpoint 2 is at its end.
- **"OVERPASS" (x −5…−15 × z 28…36, arrows from Bravo's spawn side (top right) down-left toward the goal):** an overpass (raised walkway or bridge) from Bravo's spawn deck down toward the goal area, so defenders can reach it.

### Lockgate Canals

The track runs diagonally (45°) from the centre across the canal to (−11.5, 11.5), +z to checkpoint 1 at (−11.7, 17.8), then +x along z 17.5 to (17.1, 17.5) (checkpoint 2 at (17.4, 17.9)). It then goes +z to 22.7, −x to (10.3, 22.7), then +z to the goal (10.3, 30.4).

Notes:
- **"WIDER" (the whole diagonal band through the centre, about 7 m wide, along the lock / bridge the track rides):** make that crossing wider so the tower plus fighting room fit.
- **"INKABLE ROOF" (the building at about x −6…−13 × z 19…27, next to checkpoint 1):** its roof becomes inkable and walkable.
- **"RAMP ↑" on its right side (z ≈ 28):** a ramp up onto that roof (rising toward +x).

### Terrace Heights

No notes. The track runs +z to (0, 7.7), +x to (12.8, 7.7), up the diagonal to (15.6, 21.0), a small step, −x to (6.1, 19.1), a diagonal to (−5.2, 22.4), then +z to the goal (−5.2, 37.4).

Checkpoints: (13.0, 8.4), (6.9, 19.9), (−5.4, 26.2).

Clear the track and make its climbs deliberate.
