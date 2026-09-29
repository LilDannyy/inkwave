# Botlab — headless bot matches and page tests

Runs the real game (Electron, `electron/main.cjs`) offscreen and muted, in isolated profiles, to measure and tune the
bots without touching a normal install. Needs `npm install` (Electron) and macOS / Linux with a GPU.

```bash
# a stepped all-bot match (sim time: machine load doesn't change the numbers)
MAP=halyard MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs
MAP=lockgate MODE=zones tools/botlab/run.sh tools/botlab/match.cjs          # full 5:00 Zone Control
WEAPONS='team0=blade;team1=shooter' SUBS='all=waddle' MAP=crossmarket MODE=turf tools/botlab/run.sh tools/botlab/match.cjs

# an in-page test (your script returns [{ name, ok, info }])
MAP=testbox PAGE=path/to/test-page.js tools/botlab/run.sh tools/botlab/page.cjs
```

- **Parallel runs:** start several at once (`… & … & wait`). `run.sh` keeps at most `SLOTS` (default 8) Electron
  instances alive and queues the rest.
- **match.cjs env:**
  - `MAP` (stage id), `MODE` (`turf` / `zones`), `SECS` (turf length)
  - `WEAPONS` / `SUBS`: `all=<id>`, `team0=<id>;team1=<id>`, or a comma list per slot (team 0 first)
  - `OUT` (write the result JSON), `WATCHDOG` (ms)
  - `TRACK=<weapon>` (+ `TRACK_TEAM=0|1`): a closer look at the players on that weapon — damage dealt / taken and from
    how far, what they were doing when splatted, deaths without touching the killer, nearest-enemy distance; the Sponge
    Mitts add fist / splash / leap damage and leap outcomes (`RESULT_JSON.track`)
  - `TUNE='mitts.punchInterval=0.12,mitts.fistRange=4.6'`: what-if tuning for this run only (patched into the live
    `WEAPONS` / `SUBS` config; nothing in the repo changes)
  - keep `SLOTS` at 4 or less for full Zone Control matches: 8 at once crashed the GPU process on a 16 GB Mac
- **match.cjs output:**
  - stuck % and the longest stuck episodes
  - splats by cause
  - per weapon: players, splats dealt, deaths, average turf
  - specials and super jumps
  - Zone Control: objective stats
  - sight honesty (ground truth, sampled every 0.25 s while a bot fights): how much of the fight its foe is out of sight
    (a wall between the bot's eyes and the foe's chest and head), how much of that its aim is still on the foe
    (tracking through walls), how much trigger time goes at a foe out of sight (shooting at nothing); the bots' own
    cost (BotBrain.update ms per simulated second) and their perception counters (`SIGHT_STATS`, src/game/botSight.js)
  - console warnings/errors
  - a final `RESULT_JSON {…}` line for scripts
- **Scratch files** (profiles, locks) go to `.botlab/` (git-ignored); set `BOTLAB_OUT` to move them.
- **Useful page-script globals:**
  - `window.__inkwave` (the game): `.match`, `.match.local`, `.debug.freeze()` / `.step(ms)` / `.freezeBots()`
  - `window.__G` (shared systems)
  - Equip players with `actor.setWeapon(id)` / `setSub(id)` / `setSpecial(id)`

Stages:
- `MAP=<id> TIME=day MODE=turf SHOTS='top,art,spawnA,mid' tools/botlab/run.sh tools/botlab/shoot.cjs`: screenshots of a
  stage (presets or custom JSON cameras; MODE zones / tower shows their marks) and a load / perf report.
- `tools/botlab/run.sh tools/botlab/bake.cjs <id> [<id>.zones …]`: the AO lightmap bake (build/bake-ao.cjs) offscreen.
- `STAGES=<id>,<id> tools/botlab/run.sh tools/botlab/stageart.cjs`: stage-select pictures from each layout's `art` camera.

Bot perception (what a bot can know about a foe: sight lines, view cone, ink, located foes, memory):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-sight.js tools/botlab/run.sh tools/botlab/page.cjs`.

Tower Command:
- `MAP=halyard tools/botlab/run.sh tools/botlab/tower-check.cjs` checks a track: its pieces, holes, clearance, rides at
  real speed, and pictures.
- `MAP=<id> tools/botlab/run.sh tools/botlab/tower-match.cjs` runs an all-bot tower match and reports the tower's numbers
  and the escort trace (riders and escorts' places by the real threat round the tower, full steam, route ink, riders
  hiding in the deck's ink, rolling home, a role timeline). `HUMAN=still|ride|escort` plays Alpha's first kid as a
  human would (outside the bots' team plan): AFK at spawn, or its own brain always riding / always escorting.
- The rules and ink tests: `MAP=testbox MODE=tower PAGE=tools/botlab/tests/tower-rules.js tools/botlab/run.sh
  tools/botlab/page.cjs`, and the same with `tower-ink.js`.

Stage set pieces:
- Movers (Calamari County's railcars): `MAP=calamari MODE=turf PAGE=tools/botlab/tests/movers.js tools/botlab/run.sh
  tools/botlab/page.cjs`, and the same with `MODE=zones`.
- Sprout pods (src/game/pods.js): `MAP=podbox MODE=turf PAGE=tools/botlab/tests/pods.js tools/botlab/run.sh
  tools/botlab/page.cjs` (meters, the calibration per weapon kind, growth and timing, blocking, tint, owner-only ink,
  climbing, carrying down, shoving, nav, the follower replay, bots), and the same with `MODE=tower` and `MODE=boss`.
  `MAP=podbox` is the test arena with pods (testmaps.cjs: page.cjs and match.cjs both take it).

HUD:
- `MAP=halyard MODE=turf SCENES=tools/botlab/tests/hud-lead-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs`:
  pictures of a match with the HUD up (shoot.cjs hides it): the SCENES script drives each state, and each is saved as the
  full frame + a crop of the top bar.
- The who's-ahead HUD (roster sizes, LEAD / DANGER banners, the take-the-lead sting): `MAP=testbox MODE=turf PAGE=tools/botlab/tests/hud-lead.js
  tools/botlab/run.sh tools/botlab/page.cjs`, and the same with `MODE=zones` and `MODE=tower`.
