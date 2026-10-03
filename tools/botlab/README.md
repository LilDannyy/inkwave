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

Loadout › SUB / SPECIAL picker (2026-10-03, src/ui/menus.js `_openKitPicker`: Enter / A / a click on the loadout's SUB or
SPECIAL chip opens a grid of every option with the weapon's own first; arrows / WASD / d-pad / stick move in 2D, Enter /
A / a click picks, Esc / B / a click outside closes; ← → on the chip still step):
- `MAP=testbox PAGE=tools/botlab/tests/loadout-picker.js tools/botlab/run.sh tools/botlab/page.cjs` — the main menu's
  LOADOUT, the hints, 2D moves and WASD, picks saved, Esc / B / outside with no change, the chip's ← →, Drainbow in a few
  presses, the mouse, the weapon's own (null), the pad, and Practice (L) equipping the live player
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
