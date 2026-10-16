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
# … with the page at another size than the offscreen window's 1512×945 (HUD layout on a small window)
W=960 H=600 MAP=testbox PAGE=path/to/test-page.js tools/botlab/run.sh tools/botlab/page.cjs
```

- **Parallel runs:** start several at once (`… & … & wait`). `run.sh` keeps at most `SLOTS` (default 8) Electron
  instances alive and queues the rest.
- **match.cjs env:**
  - `MAP` (stage id), `MODE` (`turf` / `zones`), `SECS` (turf length)
  - `WEAPONS` / `SUBS` / `SPECIALS`: `all=<id>`, `team0=<id>;team1=<id>`, or a comma list per slot (team 0 first)
  - `OUT` (write the result JSON), `WATCHDOG` (ms)
  - `TRACK=<weapon>` (+ `TRACK_TEAM=0|1`): a closer look at the players on that weapon — damage dealt / taken and from
    how far, what they were doing when splatted, deaths without touching the killer, nearest-enemy distance; the Sponge
    Mitts add fist / splash / leap damage and leap outcomes (`RESULT_JSON.track`)
  - `TUNE='mitts.punchInterval=0.12,mitts.fistRange=4.6'`: what-if tuning for this run only (patched into the live
    `WEAPONS` / `SUBS` config; nothing in the repo changes)
  - keep `SLOTS` at 4 or less for full Zone Control matches: 8 at once crashed the GPU process on a 16 GB Mac
  - `SPECIAL_AI=0` turns the bots' awareness of enemy specials off (src/game/botSpecials.js: the old behaviour on the
    same code, for an A/B); `team0` / `team1`: on for that team only (head to head). `SPCHARGE=3`: special gauges fill
    3× as fast (more specials per match; a what-if)
  - `DIAG=1`: every stuck episode also records the bot's nav plan at its start and every 5 s after (mode, route length,
    pi, the next two route nodes, the edge into the next one — `none` when there's no such edge, e.g. after the stuck
    recovery skipped a waypoint — the goal node, noProg, the nearest nav node, climbs off, the wall climb it's at);
    every episode of 2 s or more is printed with them and listed in `RESULT_JSON.diagEps`
- **match.cjs output:**
  - stuck % and the longest stuck episodes; wall climbs at a wall (`CLIMB_STATS`: tries, done, stalled, dry, long)
  - splats by cause; splats caused by each special per team (Bomb Barrage: its thrower's bombs during it or within 3.5 s
    after), K/D per team, and the bots' `SPECIAL_STATS` (noticed / escapes / evaded / caught / avoided routes / backed
    off / retargeted / held fire …)
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
- **Online-only stages** (config `onlineOnly`, Cargo Terminal): `DEVSTAGE=1` boots every harness page with `?devstage`
  (src/main.js `DEV_STAGE`), so page tests, shots, tower checks, bakes and stage art run there offline (a solo walk: the
  stage is `noBots`, so no bot matches).
- **Stages under construction** (config `wip`: Bluestone Junction, Gulper Aquarium, Highmark Foundry until the lead
  removes the flag): every harness loads one by id as usual (`MAP=bluestone …`); players never see one in a stage
  list. `WIPSTAGES=1` boots every harness page with `?wipstages` (config `SHOW_WIP`), which lists them everywhere. The
  check: `MAP=bluestone PAGE=tools/botlab/tests/wip-stages.js tools/botlab/run.sh tools/botlab/page.cjs`, and the same
  with `WIPSTAGES=1` (then every picker must list them).
- **A stage module's audit switch:** `PAGEQ='era=2'` (any query) boots every harness page with it as well (a module
  reads its own switch from `location.search`: `?era=`, `?lava=` …).
- **Useful page-script globals:**
  - `window.__inkwave` (the game): `.match`, `.match.local`, `.debug.freeze()` / `.step(ms)` / `.freezeBots()`
  - `window.__G` (shared systems)
  - Equip players with `actor.setWeapon(id)` / `setSub(id)` / `setSpecial(id)`

Stages:
- `MAP=<id> TIME=day MODE=turf SHOTS='top,art,spawnA,mid' tools/botlab/run.sh tools/botlab/shoot.cjs`: screenshots of a
  stage (presets or custom JSON cameras; MODE zones / tower shows their marks) and a load / perf report. `PRE=script.js`
  stages a scene first (`PRE_ARGS` reaches it as `window.__preArgs`; `PLAY=1` keeps the paint).
- `tools/botlab/run.sh tools/botlab/bake.cjs <id> [<id>.zones …]`: the AO lightmap bake (build/bake-ao.cjs) offscreen.
- `STAGES=<id>,<id> tools/botlab/run.sh tools/botlab/stageart.cjs`: stage-select pictures from each layout's `art` camera.

Online (private rooms) — real clients on this machine, never the deployed relay:
- `tools/botlab/relay.cjs`: the relay's protocol (server/src/index.js) on Node `http`, WebSocket by hand
  (`node tools/botlab/relay.cjs 8788` standalone; `?relay=ws://127.0.0.1:8788` points a page at it).
- `tools/botlab/netpage.cjs`: `CLIENTS` game clients as offscreen windows of one Electron instance (each its own
  session), the relay started inside it, a Node-side script driving them (`NET=…`, returns `[{ name, ok, info }]`;
  `Q0` / `Q1` … extra page query per client, `QUALITY`, `W` / `H`, `FPS`, `OUT`, `NET_ARGS`):
  - `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-practice.cjs` — online Practice end to end (29)
  - `… NET=tools/botlab/tests/net-turf.cjs` — a Turf War with a bot count through results back to the lobby (9)
  - `CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/tests/net-mock.cjs` — the offline stand-in (11)
  - `CLIENTS=1 APP_CSP=1 NET=tools/botlab/tests/net-server.cjs` — ONLINE › SERVER: the desktop app (app://, its own CSP,
    no `?relay=`) picks a friend's server (`tools/host/selfhost.cjs` on a free localhost port) in the picker, creates a
    room; the browser build from that server and a second app client join; Practice; the links, the refusals (official
    / version), a reload, a LAN address (`NET_ARGS=nolan` skips it; `shots` saves pictures)
  - every client's session refuses the deployed relay, the official site and `*.trycloudflare.com`; `open(i, 'relay=none',
    { base })` leaves `?relay=` out and/or loads the game from another base URL (the browser build)
- The clear-all-ink wave's sync rule, deterministically on one page: `MAP=halyard PAGE=tools/botlab/tests/ink-wipe.js
  tools/botlab/run.sh tools/botlab/page.cjs` (8). Pictures: `tools/botlab/jobs/private-rooms/` (lobby-shots.cjs,
  session-shots.cjs).

Bot perception (what a bot can know about a foe: sight lines, view cone, ink, located foes, memory):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-sight.js tools/botlab/run.sh tools/botlab/page.cjs`.

Bots vs enemy specials (src/game/botSpecials.js: danger areas, escapes, routes round them, the untouchable, counter-play,
the sight rule), each scene with the awareness on and off:
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js tools/botlab/run.sh tools/botlab/page.cjs`, and the same
with `MODE=tower` for the tower rider (add `PAGE_ARGS='only=tower'` for just that; `PAGE_ARGS` reaches any page test
as `window.__pageArgs`). The scenes are small duels whose outcome varies run to run (the sim isn't bit-for-bit
repeatable): each check runs enough rounds that its bar holds on the behaviour, not on luck (the Twister Zooka's most —
~3 min a run in all). The A/B in matches: `tools/botlab/specials-ab/ab.sh` (see its README).

Bot wall climbs (src/game/bots.js `_climb`, nav climb edges) on Lockgate's drained lock chambers — the chamber stair's nav
(a node row up each flight), the climb costs, every main off the chamber floor with ink (a climb or the stair) and dry
(the stair), a climb that makes no headway given up, forced climbs up three walls weapon by weapon (seconds and ink):
`MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=ink,forced'`: just those parts).

Tower Command:
- `MAP=halyard tools/botlab/run.sh tools/botlab/tower-check.cjs` checks a track: its pieces, holes, clearance, rides at
  real speed, and pictures.
- `MAP=<id> tools/botlab/run.sh tools/botlab/tower-match.cjs` runs an all-bot tower match and reports the tower's numbers
  and the escort trace (riders and escorts' places by the real threat round the tower, full steam, route ink, riders
  hiding in the deck's ink, rolling home, a role timeline). `HUMAN=still|ride|escort` plays Alpha's first kid as a
  human would (outside the bots' team plan): AFK at spawn, or its own brain always riding / always escorting.
- The rules and ink tests: `MAP=testbox MODE=tower PAGE=tools/botlab/tests/tower-rules.js tools/botlab/run.sh
  tools/botlab/page.cjs`, and the same with `tower-ink.js`.

Bazookarp (batch 5, a wip mode: config `WIP_MODES`; the design is tools/botlab/jobs/batch5/bazookarp/SPEC.md):
- **The mode is hidden.** It is in no player-facing list, but every harness starts it by name (`MODE=bazookarp`,
  `api.startMatch`). `WIPMODES=1` boots every harness page with `?wipmodes` (config `SHOW_WIP_MODES`), which lists it
  everywhere (the mode screen, the stage chip, the lobby picker, `setSettings`); a two-client test opens its clients
  with `Q0='autopilot&wipmodes'`.
- **`MAP=karpbox`** is its test stage (tools/botlab/karpbox.js, never shipped): every case the rules need — weirs, the
  Gate, free zones, a carrierBlock, the thin wall, the hop step and the gap, a pier over water, a mover, a pod plot, a
  test-only second field state. testmaps.cjs injects it into page.cjs / match.cjs; `KARP_DEF='two'` (or a JSON
  `LAYOUT.bazookarp`) swaps its data (`'two'`: the two-weir case). Net tests import it into every client themselves.
- The rules: `MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/bazookarp-rules.js tools/botlab/run.sh
  tools/botlab/page.cjs` (every row of SPEC §2.1 in groups A–L; M: devices and subs at the Roe Shell — the re-form's
  crush, glancing off it, every damaging sub counted and stopped; `PAGE_ARGS='only=A,B,…'`).
- The same with `karp-gun.js` (the Carp Shot: charge, ranges, ink, swell, blast radius, damage, kick, enemy ink, a
  Drip Curtain, its records with a stub net), `karp-loop.js` (a shadow follower engine on LoopWire through a scripted
  match: after every discrete record it agrees with the host; late snapshots, declined grants) and `karp-two.js` (two
  scripted humans play a match to a knockout; also `MAP=halyard`), and `karp-shell-dps.js` (the Roe Shell's tuning
  table: every main, special, barrage and the Tidal Slam against a lone shell, damage counted per second;
  `PAGE_ARGS='only=shooter,zooka'`).
- The Carp Field: `DEVSTAGE=1 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js tools/botlab/run.sh
  tools/botlab/page.cjs` — karpbox's field cases, then every stage in its Bazookarp build: L, holes, the halfway line,
  hop / gap edges, checker #2's reading sweep, the load cost per state (the warm rebuild ≤ 60 ms; the build at match start reported and
  failed only past 90 ms — the SPEC's 60 ms at load needs a quiet machine) (`PAGE_ARGS='only=halyard,…'`).
- Online: `CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs
  tools/botlab/run.sh tools/botlab/netpage.cjs` (the host's view of a guest carrier, ghost landings, victim-judged blasts,
  kr, kd, kx inside an overtime, the result); the host leaving mid-carry: `CLIENTS=3 Q0=… Q1=… Q2='autopilot&wipmodes'
  NET_ARGS='part=bots' NET=tools/botlab/tests/net-karp-host.cjs …`, and `CLIENTS=2 … NET_ARGS='part=cargo'` (a humans-only
  room: the carrier's kid is removed); the shell's crush online: `CLIENTS=2 … NET=tools/botlab/tests/net-karp-crush.cjs`
  (each screen crushes its own devices, the ghosts end on the owner's word, both screens agree).
- Bot matches: `MAP=<id> tools/botlab/run.sh tools/botlab/karp-match.cjs` (an all-bot match stepped at 60 Hz: SPEC
  §10.3's numbers, a `RESULT karp …` line; env `DUR`, `OTMAX`, `DIFF`, `HUMAN=still|carry`, `KARP_DEF`, `OUT=file.json`),
  and `python3 tools/botlab/karp-agg.py *.json` (the §9.1 rows, INFO below 16 matches, a SUMMARY line).
  [b5-karp-bots] `KARP_AI=0` plays WP1's minimal bots (the A/B baseline); the report adds the bots' route shares, the Carp
  Shots they noticed (escaped / caught), the carrier's shots by kind, roles, keepers on their spot and holds (bots
  standing on purpose are not "stuck"), each team's first bot by the Pond (the walk in: the floor under the first pop) and
  where a carrierRetreatFallback happened (with the team, P there and the retreat mark). `PLAN='karpbox:normal:4,
  halyard:hard:2'` plays several matches in one instance (one slot; `OUT=dir/x.json` → `x-<map>-<diff>-<i>.json`);
  what-ifs for the balance pass, never saved: `KARP_TUNE='{"jumpR":30}'` (botsKarp's `KARP_AI`) and
  `KARP_CFG='{"shell":{"reformHp":600}}'` (`BAZOOKARP`, deep; the opening shell is re-formed with its hp). The Mac mini JOB
  template: `tools/botlab/jobs/batch5/karp-bots/JOB-1.sh` (`STAGES`, `HARD`, `TOTAL` — 8 matches a difficulty summed over
  its stages, COMMON's cap — `SUBS`; `N` a stage is the lead's consolidated pass only). A stage builder copies it into its
  own key's folder.
- The bots (SPEC §8, src/game/botsKarp.js): `MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
  tools/botlab/run.sh tools/botlab/page.cjs` — WP3's scenarios: breakers out of the burst at ≥ 70 % (60 % hard), melee
  breakers' ring, no touch damage in 20 bursts, the grabber's 3.0–3.2 m wait and grab, an autopilot carrier's 3 carries,
  kit-weapon carriers fire nothing of their own, the ×3 fallback (a sea-to-sea zone; G(b): a pocket of its own zone open
  behind it — the retreat mask's own case), out of a Big Burst ≥ 16 of 20 (a breaker standing on its spot, from 18 m;
  12 and 15 m reported), the keeper at the Gate and the weir on the route, no wall-hack and the 20 m wake, the knockback
  push, our carrier's fuse danger (a guest carrier's too), the layout's route hints, super jumps to the carrier, the fuse →
  over the halfway line, walkers round the shell; the other roles (R: escorts, the perch, the free phase's fighters,
  re-forming), the specials' rules (S), the difficulty rows (Y), no wall-hack in the defending plan (W: a hidden carrier
  never seen moves nothing), refills in the band and the 50 % keep-out (B(b2), B(d)), the swell seen coming (A(d))
  (`PAGE_ARGS='only=A,…'`; `teeth=1` runs each newer check again with its feature off and requires it to fail;
  `hwhat=1` H's 15 m what-ifs: a longer swell, a smaller Big Burst).
- Pictures: tools/botlab/scenes/karp.js through hud-shots.cjs.
- **The stage checker** (`[b5-karp-checker]`, SPEC §4.4): `MAP=<id> tools/botlab/run.sh tools/botlab/bazookarp-check.cjs`
  checks a stage's `LAYOUT.bazookarp` against SPEC §9.1 — sixteen checks on the carrier graph (hop and gap edges in),
  #16 with a kid stepped through `actor.update` with the carrier's rules (every hop / gap edge tried, every route and
  every entrance into a Gate's ring walked), #11 with a scripted carrier on both teams — and
  prints a line per check and `RESULT <id> ok|fail …`, writes `<id>-karp.json` and pictures (the top-down with the field,
  routes, entrances, zones and flags; the Pond; each weir and the Gate from both sides; each zone; each flag). `MAP=all`
  runs every shipped stage in one go and prints a table (`WIP=1` adds the stages under construction); env `OUT`,
  `KARP_DEF`, `SHOTS=0`, `CARRY=0`, `PHYS=0`, `DEVSTAGE=1` (Cargo), `ERA=` / `LAVA=` / `KSTATE=` (one stage state; a stage
  module offers its states through `G.match.stage.karpStates()`, each with the page query of its audit switch),
  `PROBE='[x,y,z,x,y,z]'` (one move traced: #16's kid frame by frame, and what it stopped against). #7 also finds the
  moves no edge holds that #16's kid really makes (rising gaps across air, jumps onto ground off the field, hops / gaps
  just beyond the rules, vaults over a low wall or a railing): a find when worth > 10 m, an entrance (with its own line
  of sight) when it lands inside a Gate's ring from outside it; an inkable step of ≤ 1.8 m the kid hops counts as a hop,
  not a climb, in every no-climb search. #16 moves the carrier both ways SPEC §2.4 allows: running as a kid, and swimming
  in its own ink (9.44 m/s, the swim-jump: about twice the kid's reach, onto ledges up to 2.2 m when it lets go of squid form at the top; 2.25 m never) from any takeoff whose floor
  takes ink — the probes' windows are the measured reach of each (`REACH`, the self-test's `reach` / `reachs` rows). A
  squid gap (lowGap) passes grates and rails, as a squid does. **[fix4]** Also: steps off the grid (a 0.3–1.8 m step up or
  0.3–3.4 m down whose face misses the 1 m grid, so nav joins nothing across it) and squid tubes (3–8 m of low passage a
  kid can't use: #16 crawls a squid through each). `KARP_SWIM=fail|warn|off` judges what only the swimming carrier makes
  (D34: default `fail`); the RESULT line prints `swim=` and splits #7d's finds by cause, `7d=<layout>/<field rule>/<swim-jump>`.
  A `waive` entry for #7d waives its whole numbered flag (`probe` and `r` optional).
  The flagged places are numbered once — the top-down's discs and its key, the `-flag-<n>` pictures, the console and the
  JSON's `flags`. The checks live in `tools/botlab/karp-check-page.js`. Self-test: `KARP_SELFTEST=1 tools/botlab/run.sh
  tools/botlab/bazookarp-check.cjs` (karpbox's clean case must pass every check, and each planted fault of
  `tools/botlab/karp-check-box.js` must FAIL its own check for its own reason, and each `notFail` case must leave its
  checks unfailed; `CASES=clean,f7,…`). The per-stage builders' brief:
  `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`.
- **The Bazookarp regression set** — run it (one at a time locally, or as a job on the Mac mini's runner when
  tools/botlab/jobs/batch5/COMMON.md says it is up) after any change to the
  mode, the Carp Field, the kit, the stage data or a stage's layout:
  - `DEVSTAGE=1 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js tools/botlab/run.sh tools/botlab/page.cjs`
    (the field on karpbox and every stage: L, holes, hop / gap edges, the reading sweep, the load cost; `PAGE_ARGS='only=<id>'`
    for one stage);
  - `bazookarp-rules.js`, `karp-gun.js`, `karp-loop.js` on karpbox (above) when the engine moved;
  - `KARP_SELFTEST=1 … bazookarp-check.cjs` when the checker moved, and `MAP=<id> … bazookarp-check.cjs` on every stage
    whose data or layout moved;
  - the other modes unchanged: `node build/check-maps.mjs` (every stage, and `<id>.bazookarp` for a stage with data) and
    `node tools/botlab/karp-layout-diff.mjs <base tree>` (Turf War / Zone Control / Tower Command / Boss Battle builds and
    the stage cards byte-identical).
- Online, the rest of SPEC §10.2 ([karp-face]): `NET_ARGS='part=face'` (steps 2–11, 16) and `NET_ARGS='part=lag'
  URLQ='netlag=150&netjitter=60'` (hits, a grab, retreat, the fuse ring under ×3, a declined grant, the window's close)
  through net-karp.cjs; net-karp-host.cjs `part=plant` / `part=shot` (`CLIENTS=3`: a plant / a Big Burst in the old
  host's last 0.1 s) and `part=guestleave` (`CLIENTS=2`); the whole thing: `CLIENTS=3 Q0='autopilot&wipmodes'
  Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' WATCHDOG=2400000 NET=tools/botlab/tests/net-karp-full.cjs` — a real
  5:00 match on halyard, autopilot kids and bots, the host leaving mid-match, played to the end on the other two screens
  (the same result and results table), back to the lobby. The narrowed flush's regressions for the other modes:
  `CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-tower.cjs` (and `net-zones.cjs`).
- The finished face: `MAP=testbox MODE=bazookarp PAGE=tools/botlab/tests/hud-karp.js` (the HUD, §6.1–6.5, the cues),
  `hud-lead.js` with `MODE=bazookarp`, and `WIPMODES=1 MAP=halyard MODE=bazookarp PAGE=tools/botlab/tests/karp-menus.js`
  (the pause strip, How to Play, the mode card, the stage select's and the lobby's stage lists — with `WIPSTAGES=1`
  every stage, the placeholder ones tagged PREVIEW; without `WIPMODES` the mode hidden).
- Pictures: tools/botlab/scenes/karp.js (WP1's) and tools/botlab/scenes/karp-face.js (every HUD state, the looks, the maps,
  the menus: `MAP=halyard MODE=bazookarp TIME=day PLAY=2 URLQ=wipmodes SCENES=tools/botlab/scenes/karp-face.js OUT=/dir
  tools/botlab/run.sh tools/botlab/hud-shots.cjs`, `W=960 H=600` for the small window, `PRE_ARGS='only=…'`) through
  hud-shots.cjs.

Stage set pieces:
- Movers (Calamari County's railcars): `MAP=calamari MODE=turf PAGE=tools/botlab/tests/movers.js tools/botlab/run.sh
  tools/botlab/page.cjs`, and the same with `MODE=zones`.
- Sprout pods (src/game/pods.js): `MAP=podbox MODE=turf PAGE=tools/botlab/tests/pods.js tools/botlab/run.sh
  tools/botlab/page.cjs` (meters, the calibration per weapon kind, growth and timing, blocking, tint, owner-only ink,
  climbing, carrying down, shoving, nav, the follower replay, bots), and the same with `MODE=tower` and `MODE=boss`.
  `MAP=podbox` is the test arena with pods (testmaps.cjs: page.cjs and match.cjs both take it).
- Stage modules (src/game/stageMods.js, docs/STAGE-MODS.md: the registry eras / pipes / lava plug into): `MAP=testbox
  PAGE=tools/botlab/tests/stage-mods.js tools/botlab/run.sh tools/botlab/page.cjs` (a test-only dummy module through the
  whole lifecycle, and the device code asking `noPlace` / `under`, `S.crushIn`'s forwarding: 36), `MAP=testbox PAGE=tools/botlab/tests/stage-mods-bake.js PAGE_ARGS='old=.botlab/bake-old.cjs' …`
  (the AO bake's page code: one pass byte-identical to an older bake.cjs copied there, a module's states as RGB channels,
  6), `CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`
  (the same online: clock, records, field 15, F.stage, a late joiner, a host change, 10), and
  `MAP=halyard PAGE=tools/botlab/tests/stage-mods-perf.js …` (what the hook-ins cost on a stage without a module).

HUD:
- `MAP=halyard MODE=turf SCENES=tools/botlab/tests/hud-lead-scenes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs`:
  pictures of a match with the HUD up (shoot.cjs hides it): the SCENES script drives each state, and each is saved as the
  full frame + a crop of the top bar.
- The who's-ahead HUD (roster sizes, LEAD / DANGER banners, the take-the-lead sting): `MAP=testbox MODE=turf PAGE=tools/botlab/tests/hud-lead.js
  tools/botlab/run.sh tools/botlab/page.cjs`, and the same with `MODE=zones` and `MODE=tower`.

Controllers (src/core/padmap.js: every pad read as a standard layout — known HORI / PowerA / PDP Switch pads, a guess for
other non-standard pads, Settings › Controller setup's own layouts): `MAP=testbox PAGE=tools/botlab/tests/pad-mapping.js
PAGE_ARGS2='phase=2' tools/botlab/run.sh tools/botlab/page.cjs` fakes the Gamepad API (an Xbox pad unchanged, a HORIPAD S
as Chrome reports it, unknown pads, Firefox ids, the guided re-map) and drives the real PlayerController; `PAGE_ARGS2`
makes page.cjs reload the page and run the script again (here: the saved layout applies after a reload, then reset).
`PAGE_ARGS='only=standard,hori,guess,ids,setup'` picks parts. Pictures of the screen: `tools/botlab/scenes/pad-setup.js`
through hud-shots.cjs.

Sub tweaks (2026-10-01: the Twirl Sprinkler's 5.5 m reach, the Lurk Mine invisible to the other team / a ghost to its
own / popping up on its windup, the Hop Beacon's jump lights and sonar, the Drip Curtain's ink meter, the Skitter /
Waddle / Mine windups — online records and the bots' danger areas included):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=sprinkler,mine,beacon,curtain,windup'`). Its pictures: `tools/botlab/scenes/sub-tweaks.js`
through shoot.cjs (`PRE=…/sub-tweaks.js PRE_ARGS=<scene>`, see its header).

Sub tweaks 2 (2026-10-02: the Tideline Bow's trail a swimmable line ×~1.9 ink, the Howl Box set down on the surface you
use it from, the Twirl Sprinkler's longer throw and landing patch, the Tracer Bolt at the crosshair, the poison bubbles
on players — src/game/statusFx.js, online through the actor tick's flags):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks2.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=bow,wail,sprinkler,tracer,poison'`); on any other stage it checks the Howl Box at that stage's
own ledges (`MAP=halyard` / `MAP=calamari`: 'wailmap'). Its pictures: `tools/botlab/scenes/sub-tweaks2.js` through
shoot.cjs (`PRE=…/sub-tweaks2.js PRE_ARGS=<scene>`, see its header).

Batch 5's four subs, scaffold (`[b5-subscaf]`: the Glide Bomb, Scrap Sentry, Chain Bobber and Dash Pellet registered end to
end — SUBS, SUB_ORDER, SUB_VIEW_SCALE, placeholder models and icons, stub kits in src/game/kits/<id>.js that refuse with
"Can't use" until each builder lands its sub):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-scaffold.js tools/botlab/run.sh tools/botlab/page.cjs` (the web of ids
for every SUB_ORDER id; each stub in hand, refused; bots on stubs) and, online, `CLIENTS=2 Q0=autopilot Q1=autopilot
NET=tools/botlab/tests/net-subscaf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs` (stub ids through the lobby into a match).

The Glide Bomb (`[b5-sub-glide]`, src/game/kits/glide.js; batch 5 subs SPEC §A: the stone that slides straight along the
floor inking a lane, bounces off walls and kids, blows when its fuse runs out; hold to cook it — shorter, bigger, the main
weapon locked meanwhile, slipping out a second past full cook):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-glide.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=reach,lane,bounce,ledge,blast,shot,fizzle,guide,bots,stubs,lock,crush,boss,start,perf,more'`; `crush`
uses the real `G.deploy.crushIn` once the sentry / bobber branches are merged, a copy of its kit loop before) and,
online, `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-glide.cjs tools/botlab/run.sh
tools/botlab/netpage.cjs` (`NET_ARGS='scene=hostleave'`: the host leaves with its stones out). Its pictures:
`tools/botlab/jobs/batch5/sub-glide/scenes.js` through hud-shots.cjs. match.cjs prints a `GLIDE` line (uses, cooks, the
bots' fight / paint / boss throws, endings — the sunk ones by thrower —, the bots' stay-on-the-stage checks, bounces, hits,
boss hits) when anyone threw one (`SUBS='all=glide'`), and a
`SUBUSE` line for every sub kind thrown (uses / enemy hits / damage / splats: the Glide against the Splat Bomb).

The Chain Bobber (`[b5-subs]`, src/game/kits/bobber*.js; SPEC §C): `MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
tools/botlab/run.sh tools/botlab/page.cjs` (C10: deploy heights over floors, walls, ceilings, the sea, a stand-in shell and
rising lava; tethers; the trigger and its hops; the damage table to N = 8; disarming; life and the hidden guard; movers,
crushIn, era flips; Drainbow, Bubble Guard, the Stamp; the net records; the teammate cue; bots; the drawing, HUD and aim
guide — `PAGE_ARGS='only=deploy,tether,…'`), and its mode runs: `MODE=tower … PAGE_ARGS='only=tower'`, `MAP=podbox …
'only=pod'`, `MAP=halyard MODE=zones … 'only=zone'`, `MAP=podbox MODE=boss … 'only=boss'`. Online: `CLIENTS=2
Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-bobber.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`. Its budget
(192 live, three 8-chains, a live 4 v 4 with 24 a bot): `MAP=testbox PAGE=tools/botlab/tests/perf-bobbers.js …page.cjs`.
`match.cjs` and `tower-match.cjs` print a BOBBER line when any were thrown (`SUBS='all=bobber'`: chains set off, N at the
trigger and its median, wasted %, what set each off — `chain:` another chain's blast, `(aimed)` a bot's shot at it — how
long foes stood in a chain's reach), then `match.cjs`'s BOBBER-SRC (per placement source — the bot plan that laid the chain:
`zdoor` / `zedge` / `zin` Zone Control, `troute` / `theat` Turf, `tower`, a fight's `pair`, a `lure` — its chain-seconds, foe
seconds within 3 m of its reach and in it, chains set off and those that caught a foe) and BOBBER-STRAYS (each chain a bot's
unaimed fire set off: its weapon, mode, distance and angle off its aim, whether its hold-fire check had said hold).
[b5-int3] `match.cjs` also prints BOBBER-WASTE (the chains set off with no foe caught, by what set them off), BOBBER-AIMED
(how each bot's aimed chain shot ended: blewMine / blewOther / foeGone / missed / noAim / readyOff) and the snaps on
BOBBER-SCAN (thrown, aimed at, fired, left); `SNAPLOG=1` adds BOBBER-SNAPLOG / BOBBER-SCANLOG (each snap's and aimed shot's
events). `TUNE='bobber.dangerHear=2.5'`: the lead's A/B knob — foes' bots notice an armed web within 2.5 m, else only in
front of them with a line (off: within 5 m whatever way they face).
`BOBBER_BOT.logOn = true` keeps a log of the bots' set-up decisions (`only=zone` prints it for a guard that falls short). A human's big web (SPEC C11's
web arm — bots stop at 4): `MAP=halyard MODE=zones PAGE=tools/botlab/tests/bobber-web.js …page.cjs` (also treehills;
`PAGE_ARGS='n=12,24 layout=lane,zone variant=trigger,clear reps=10'`: lethal area per trigger, splats per 100 ink, the share
disarmed first, the time to clear one; the Mac mini's `jobs/batch5/sub-bobber/JOB-1.sh` / `JOB-2.sh` run the full set).
Dash Pellet (`[b5-sub-dash]`, src/game/kits/dash.js — the press, the dash in ≤ 0.2 m substeps, the blast left behind):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-dash.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs`
(PAGE_ARGS picks sections: press, dir, height, limits, blast, walls, edges, hud, bots); online, `CLIENTS=2 Q0=autopilot
Q1='autopilot&netlag=150&netjitter=60' NET=tools/botlab/tests/net-sub-dash.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`;
the stage audit, any stage: `MAP=<id> PAGE=tools/botlab/tests/dash-reach.js WATCHDOG=900000 … page.cjs` (every edge
node in one run, 1–6 min locally; `dt=24` the same at 1/24 s; `step=N;off=k` a part, every `off` from 0 to N − 1 tiling a
full audit; `air=<m>` a what-if air dash; `climb=0` leaves out the dashes off a wall climb; Cargo Terminal with
`DEVSTAGE=1`); in matches, `SUBS='all=dash'` adds a DASH line to match.cjs
(`DASH_AI=0`: bots never dash).

Batch 5 wave 2's integration (`[b5-int3]`: the four subs and the Bazookarp engine together): `MAP=karpbox MODE=bazookarp
PAGE=tools/botlab/tests/int3.js tools/botlab/run.sh tools/botlab/page.cjs` (each sub against the real Roe Shell — the
Glide's bounce and blast, the dash held outside it, a bobber deployed outside it and one splash a chain, a sentry blind
through it; the re-form's crushIn ending a sentry and bobbers but never a Glide or a curtain 3 m off; the carrier's bonk,
a dash ending at the pick-up, a cook fizzling, devices working on), `MAP=testbox MODE=tower` (the tower crushing a sentry
and bobbers on its track, riding ones on its deck), `MAP=testbox MODE=turf` (a dash into an enemy Drip Curtain; a bot's
bomb press held off a human's idle chain; DECISIONS #22, a Twinfire roll and a Mitts leap into a 0.10 m wall at 60 / 24
fps) and `MAP=calamari MODE=turf PAGE_ARGS='only=rail'` (a bobber riding a railcar, a sentry refused on its roof and never
left inside it); `PAGE_ARGS='only=shell,reform,carrier,tower,curtain,throwhold,thinwall,rail'`. `karp-match.cjs` takes
`SUBS=` as tower-match.cjs does.

Tideline Bow ink (2026-10-02, bow-paint: the three arrows parallel 0.4 m apart at full draw and 8° fans below it, the
falling-spray droplets staggered into one unbroken band, the landing patches, the draw at a third of the speed in the air,
no ink refill for 0.33 s after a shot — src/game/kits/bow.js, config WEAPONS.bow, actor.js; the bots' level lane shots):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/bow-paint.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=shots,air,ink,net,damage'`; `tune=dropScale:0.6,burstPaint:1/1.2` a what-if; `MODE=tower
PAGE_ARGS='only=tower'` the draw on the tower's deck). Its pictures: a dummy kid draws for real and looses one volley on the clean deck —
`tools/botlab/jobs/bow-paint/shots.sh [full ring tap three]` (`tools/botlab/scenes/bow-paint.js`; the lead's reference
cameras).

Tracked look (2026-10-02, track-arrows / track-ribbons: one arrow wrapped round a marked player in the marking team's
colour — the game's squid icon on its side, its head the arrowhead with the eyes in it, its tentacles the tail —
hugging the body at 0.46 m, turning round them; it flies in as a ribbon from the mark's source and wraps, ripples and
flies off when the mark ends; the marking team sees it and a thin line from each of their own kids through walls, the
marked player and their teammates see it depth-tested with no line; no name tag — src/game/statusFx.js):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/track-arrows.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=arrow,clear,grow,fly,end,netsrc,sources,walls,line,net,names,poison'`; 'clear': the band never cuts
the kid's body; 'fly': each source's flight and wrap; 'end': the ripple and fly-away). Its sounds: sfx-cues.js
`PAGE_ARGS='only=marks'` (run it alone). Its pictures: `tools/botlab/scenes/track-arrows.js` through shoot.cjs
(`tools/botlab/jobs/track-arrows/shots.sh`: the fly-in sequences, the going, each with a contact strip).

Surf N' Turf (2026-10-02: the special `surf` — src/game/sp-surf.js, its looks src/fx/surfFx.js, its sounds
src/audio/sfx-surf.js, its bots src/game/sp-surf-bots.js — and the assist stat, src/game/assists.js): the throw and anchor,
the rings (count, timing, reach, speed), a hit (40 + the mark from the beacon), a jump over a ring (nothing, the owner's
assist window), the assist rules, the ink by band from the buoy, the buoy's hp, walls, the results data, the online
records and judging, bots (throwing, jumping rings, shooting buoys), its sounds:
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/surf.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=throw,pulses,hit,dodge,assist,turf,buoy,walls,results,net,bots,sounds'`). Online on two clients:
`CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-surf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs` (12). It needs autopilot clients (its hooks ride the local kids' brains): run without `Q0` / `Q1`, it
reopens them with `?autopilot` itself, and fails loudly if a local kid still has no brain.
Matches: match.cjs `SPECIALS='all=surf'` / `'team0=surf'` (and a `SURF` line: uses, hits, marks, dodges, ink, assists, the
bots' jumps). Pictures: `tools/botlab/jobs/surf/shots.sh` (scenes/surf.js), the results screen with assists
(scenes/surf-results.js) and the HUD / loadout (scenes/surf-hud.js) through hud-shots.cjs.

Deployables (src/game/deployables.js, its bots src/game/deployables-bots.js, its sounds src/audio/sfx-deploy.js: enemy
fire of every kind wears down Hop Beacons, Twirl Sprinklers, Skitter Bombs and the Surf N' Turf buoy; the tower crushes
sprinklers, beacons, Drip Curtains and buoys in its way and pushes a Lurk Mine aside; every placed / stuck device rides
any moving floor; bots shoot enemy devices with nothing better to do, never into a noticed danger):
`MAP=testbox MODE=turf PAGE=tools/botlab/tests/deployables.js tools/botlab/run.sh tools/botlab/page.cjs`
(`PAGE_ARGS='only=matrix,own,down,pop,looks,beam,standing,net,bots,sounds,floors'`), and the same with `MODE=tower
PAGE_ARGS='only=tower'`, `MAP=calamari PAGE_ARGS='only=rail'`, `MAP=podbox PAGE_ARGS='only=hedge'`. Online on two
clients: `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-deploy.cjs tools/botlab/run.sh
tools/botlab/netpage.cjs` (and `NET_ARGS='scene=tower'`; `'scene=leave'`: the host leaves). Pictures: scenes/deploy.js
through hud-shots.cjs (`MAP=halyard MODE=tower PLAY=2`). Matches: match.cjs / tower-match.cjs print a `DEPLOY` line (hits,
shot down, crushed, Skitter Bombs thrown / popped, the bots' seconds in device mode per bot, picks / re-picks / give-ups);
`DEV_AI=0` turns the bots' device shooting off (an A/B).

Audio cues (src/audio/cues.js, src/audio/sfx-cues.js, src/audio/sfx-alerts.js — every sub and special by ear: its
sound at each phase, one positional loop per moving thing, a gliding flight for every thrown sub, warnings before the big
blasts, launch alerts / "you're in it" alarms / stings for the enemy's specials, the enemy's louder than yours):
- `MAP=testbox MODE=turf PAGE=tools/botlab/tests/sfx-cues.js tools/botlab/run.sh tools/botlab/page.cjs` (records every
  audio.play / audio.loop; `PAGE_ARGS='only=subs'`, `'only=specials'`, `'only=bomb,crab'` for a part)
- the listening sheet: `tools/botlab/run.sh tools/botlab/sfx/render.cjs` renders every sub's and special's
  sounds offline to `tools/botlab/sfx/out/` (git-ignored WAVs; `cues.wav` is the whole sheet, `cues.txt` its
  index, `metrics.json` levels and how alike the sounds are). The before / after inventory:
  `tools/botlab/sfx/INVENTORY.md`.
- what the player actually hears: `tools/botlab/run.sh tools/botlab/sfx/realflow.cjs` (`OUT=file.json` for the raw
  numbers) goes title → PLAY → TURF WAR → START! with trusted key / mouse input, taps the master and every voice with
  an AnalyserNode (a cue's × the cue bus's gain and compressor at that moment), stages each sub and special from the
  local player's view over a busy fight, and holds each cue family's audible level against your weapon fire and the
  music (prints `FAMILY …` lines: the before / after table); every thrown sub's flight glide over its airtime
  (`GLIDE …`); every enemy special's launch alert and "you're in it" alarm and their lead before it hits you
  (`SPECIAL …`); the stings; the busy fight's sample peak and K-weighted loudness (`LOUDNESS …`); then pause / resume,
  quit, the Cues slider in SETTINGS → Audio (trusted clicks), a second match, the loadout screen, practice and its
  loadout (the cue director running, the loop bus open, the listener set).

Drainbow (2026-10-03, the special: src/game/sp-drainbow.js, src/fx/drainbowFx.js, src/audio/sfx-drainbow.js):
- `MAP=testbox MODE=turf PAGE=tools/botlab/tests/drainbow.js tools/botlab/run.sh tools/botlab/page.cjs` — placement and
  life, the shot halving (into it, through both sides once, a charger beam, a bomb's blast, its own team's shots full,
  out from inside), the drain / gain rates, the owner's share as bubble time and its cap, the meter frozen while it
  stands, the grey wave and the muffle on the local player only, crossings, the bots (`PAGE_ARGS='only=…'`: place,
  shots, drain, gain, meter, view, cross, bots)
- `CLIENTS=2 NET=tools/botlab/tests/net-drainbow.cjs tools/botlab/run.sh tools/botlab/netpage.cjs` — online: the ghost
  bubble, the guest's own grey / drain, the host fed and the longer life recorded, a guest's shot halved on its screen
- pictures: `tools/botlab/jobs/drainbow/shots.sh [MAP]` (tools/botlab/scenes/drainbow.js through hud-shots.cjs)
- balance: `tools/botlab/jobs/drainbow/balance.sh <outdir> [N_TURF] [N_ZONES]` (match.cjs `SPECIALS=` forces the
  specials) + `agg.cjs`; the regressions its hook-ins touch: `tools/botlab/jobs/drainbow/regress.sh`

Special rules (batch 5, `[b5-sprules]`: the gauge on a splat mid-special — specials.js `splatShare`; what outlives its
owner — kits/boomerang.js, sp-drainbow.js; the Bubble Guard chain — src/game/sp-bubble.js; the Bomb Barrages with the
Waddle and the Mystery — src/game/sp-barrage.js, src/ui/hud-barrage.js):
- `MAP=testbox MODE=turf PAGE=tools/botlab/tests/sp-rules.js tools/botlab/run.sh tools/botlab/page.cjs` — the gauge kept
  (several shares, the sea, the respawn, no special running), the boomerang / Tempest / buoy / Drainbow / shared Bubble
  Guard outliving its owner (the Bubble Blower unchanged), the chain (time carried, no refresh loop, one field a player,
  each chain once, the hint line: a copy's only with a teammate who could take it within 6 m, and under the Cheer Orb
  prompt on the HUD), both barrages (a barrage's Waddle with its own numbers, its ghost too; the Mystery: 120 throws,
  its NEXT card read on every real frame between them), the bots, the order / icons
  (`PAGE_ARGS='only=gauge,survive,chain,waddle,mystery,bots,list'`; a section that throws is one FAIL, so it also runs
  on the code before the package)
- `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sprules.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`
  — online: the chain across screens (each receiver's owner decides), the host's things outliving the host on the guest's
  screen, the guest's Mystery / Waddle Barrage on the host's screen (`NET_ARGS='only=chain,survive,barrage'`)
- pictures: `SCENES=tools/botlab/scenes/sprules.js MAP=halyard MODE=turf PLAY=6 OUT=… tools/botlab/run.sh
  tools/botlab/hud-shots.cjs`; balance: `tools/botlab/jobs/batch5/sprules/balance.sh` + `agg.cjs`; regressions:
  `tools/botlab/jobs/batch5/sprules/regress.sh`

Zipline buffs and the Cheer Orb rework (batch 5, 2026-10-04; src/game/specials.js, src/game/sp-cheer.js, src/ui/hud-cheer.js,
src/audio/sfx-cheer.js; actor.js's ink and pin hooks):
- `MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js tools/botlab/run.sh tools/botlab/page.cjs` — the Zipline's
  quarter damage mid-zip (and full before / clinging / after), 33 m/s zips that still stop at an enemy, 0.7× ink costs
  (shots, a charger's charge, a dodge roll, the "enough ink?" check); the Cheer Orb's lift (2.2 m over the ground, held:
  no walking / jumping / swimming, turning yes; let go by the throw, a splat, a swap; under a ceiling; mid-jump; on a
  moving block; lift 0 the old way), the teammate's big cheer prompt (bottom middle, its size, the pad's d-pad up, never
  for an enemy's or your own orb), the cheer (both wisps, +0.12 as the orb's lands, +4 % of the gauge as its own lands,
  the rate, the exceptions), bots cheering and a bot holding still up there (`PAGE_ARGS='only=zipdmg,zipspeed,zipink,
  lift,prompt,cheer,bots'`)
- `CLIENTS=2 NET=tools/botlab/tests/net-zipcheer.cjs tools/botlab/run.sh tools/botlab/netpage.cjs` — online, one team:
  the host risen on both screens, the guest's prompt and cheer (wisps on both screens, the charge on the orb owner's
  screen and back through its tick, the guest's gauge on its own), the throw, and the other way round
- match.cjs prints `special ends` (per team, per special, by reason) and the `zipcheer` counters (sp-cheer.js ZC_STATS);
  `TUNE='booyah.heldDamage=0.5'` is a what-if (the share of damage taken while held up: 1 in the game)
- pictures: tools/botlab/scenes/zipcheer.js through shoot.cjs (`PRE_ARGS=risen|wisps|zip`, testbox, `ACTORS=1 PLAY=1`)
  and tools/botlab/scenes/zipcheer-hud.js through hud-shots.cjs (halyard; the prompt, the wisps, the gauge's +4 %)

Loadout › SUB / SPECIAL picker (2026-10-03, src/ui/menus.js `_openKitPicker`: Enter / A / a click on the loadout's SUB or
SPECIAL chip opens a grid of every option with the weapon's own first; arrows / WASD / d-pad / stick move in 2D, Enter /
A / a click picks, Esc / B / a click outside closes; ← → on the chip still step):
- `MAP=testbox PAGE=tools/botlab/tests/loadout-picker.js tools/botlab/run.sh tools/botlab/page.cjs` — the main menu's
  LOADOUT, the hints, 2D moves and WASD, picks saved, Esc / B / outside with no change, the chip's ← →, the last special in
  a few presses, the mouse, the weapon's own (null), the pad, and Practice (L) equipping the live player
- `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-picker.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`
  — online Practice: a guest's picks in the picker reach the host's screen and the room
- pictures: `tools/botlab/scenes/loadout-picker.js` through hud-shots.cjs (any `W` / `H`)

Room lobby › SUB / SPECIAL chips (2026-10-03, src/ui/menus.js `_scr_lobby`: SUB over SPECIAL, stacked between the WEAPON
and LOOK chips in the bottom bar, each opening the kit picker above; a pick is saved and sent to the room with
`net.setMe`, null for the weapon's own; the nameplates show everyone's sub / special under their weapon badge):
- `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-lobbykit.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`
  — the bar by arrows, a guest's sub / special (Drainbow) / weapon's own by keyboard reaching the host's room and
  nameplate while it stays ready, a weapon swap moving a Weapon's Own chip, the host's pick, every room mode, the turf
  match starting with the guest's kit on both screens (14; `NET_ARGS=shots`: pictures)
- the offline stand-in: `net-mock.cjs` (above) checks the chips and its setMe's kit; pictures at 1280×720 / 960×600 and
  the picker: `CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/lobby-kit/mock-shots.cjs
  OUT=tools/botlab/jobs/lobby-kit/out tools/botlab/run.sh tools/botlab/netpage.cjs` (8 checks: the bar has room to spare,
  every weapon / sub / special name fits its chip, READY? / START!'s sub-lines whole at 1280)

Two-handed holds (batch 5, src/game/character.js `HOLD_BOTH` / `_bothHands` / `_gripRoll`: the brush, the roller, the
blaster and the Canopy Brolly keep the off hand on the weapon in every state, the menu and podium dances included):
- `MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js tools/botlab/run.sh tools/botlab/page.cjs` — the other weapons
  first (their off hand's role per state against `holds-baseline.json`, recorded on the code before the change), then
  the four through stand / run / fire / roll / jump / a fall / the respawn / the Tidal Slam / every menu and podium dance /
  the fidgets: the off hand on its grip, a natural elbow and wrist, the weapon clear of the head and (in the poses that
  hold still) not through the deck, and the roller's drum / the brush's head square to its path (≤ 5°) and on the
  midline (± 7 cm) while rolling; then the lobby emotes as the room plays them (HEY! lets the off hand go to wave and
  takes the weapon back, BOOYAH! / the dance / the flex keep it on); then a 30 s bot fight with them
  (`PAGE_ARGS='only=both,others,emotes,bots'`, `w=…`, `s=…`, `dump`, `record`)
- `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-holds.cjs tools/botlab/run.sh tools/botlab/netpage.cjs`
  — online Practice: each screen sees the other player's squidkid keep its off hand on the weapon (`NET_ARGS='a=brush;b=blaster'`)
- the room lobby (offline stand-in): `CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/batch5/holds/lobby-shots.cjs
  OUT=/dir tools/botlab/run.sh tools/botlab/netpage.cjs` — pictures of the line-up, and everyone's HEY! checked (the off
  hands let go to wave, back on after)
- pictures: `tools/botlab/scenes/holds.js` through hud-shots.cjs (`PRE_ARGS='w=… s=… v=front,fq,left,back,right,hand,handb,handd'`;
  `s=leap,hang,slam` for the Tidal Slam, `s=v0b7` a victory dance at a set beat, `s=hey0.7` the HEY! emote, `v=frontw,top`
  a roll's drum in frame)
