# Sub and special audio: inventory (before sfx-cues)

State of `new-stages` 5c6b1c6, read from the code. Every sound is procedural (src/audio/audio.js `SFX`, plus the kit
modules' own `SFX.*`). **P** = positional (PannerNode at the object), **2D** = no position (the local player's own
action), **—** = no sound. "near" = only played when the camera is within ~30–40 m. "(shared)" = the same sound is used
by other subs / specials, so it can't tell them apart by ear.

## Subs

| Sub | Throw / deploy | Flight | Landing / arming | Active / moving | Warning | Trigger / explode | End / destroyed |
|---|---|---|---|---|---|---|---|
| Splat Bomb (`bomb`, weapons.js) | `bomb_throw` 2D own / P (shared) | — | `bomb_beep` P (shared) | — (bounces and rolls silently) | `bomb_beep` ticks every 0.3→0.1 s, pitch 1→1.25, P near (shared) | `bomb_explode` P (shared) | — |
| Cling Charge (`sticky`) | `bomb_throw` (shared) | — | `bomb_beep` P near (shared) | — | `bomb_beep` ticks 0.45→0.1 s, pitch 1→1.3 (shared) | `bomb_explode` (shared) | — |
| Pop Pellet (`burst`) | `bomb_throw` ×1.2 (shared) | — | pops on impact (never rolls) | — | — | `blaster_boom` ×1.2 (the Blaster's sound) | — |
| Skitter Bomb (`seeker`) | `bomb_throw` (shared) | — | — | — (scuttles silently) | — | `bomb_explode` (shared) | fell in the sea: — |
| Echo Orb (`scan`) | `bomb_throw` (shared) | — | — | cloud: — | — | `special_activate` ×1.6 (the special jingle) | — |
| Drip Curtain (`curtain`) | `bomb_throw` (shared) | — | `swim_splash` ×0.8 (shared) | — | — | — | faded / shot down: `splat_small` ×0.8 (shared) |
| Twirl Sprinkler (`sprinkler`) | `bomb_throw` (shared) | — | `bomb_beep` ×1.4 (shared) | — (the drops splat on their own) | — | — | shot / owner splatted: `splat_small` (shared) |
| Lurk Mine (`mine`) | `bomb_beep` ×0.8 (shared) | — | armed after 0.9 s: — | hidden: — | trip: `bomb_beep` ×1.5 P, 0.35 s before (shared) | `bomb_explode` ×1.2 (shared) | oldest replaced: `bomb_explode` |
| Hop Beacon (`beacon`) | `bomb_beep` ×1.3 (shared) | — | — | — | — | jumped to: — | used up / shot: `splat_small` (shared) |
| Murk Bomb (`mist`) | `bomb_throw` (shared) | — | — | mist burst: `enemy_ink_sizzle` ×0.7 as a 1.2 s one-shot, then — | — | (no blast) | — |
| Shaker Bomb (`shaker`, kits/shaker.js) | hold: `shaker_clink` / `_max`, `shaker_fizz` loop 2D (local only); throw `bomb_throw` (shared) | — | `bomb_beep` ×1.25 (shared) | hops: `shaker_hop` P | — (no fuse sound between blasts) | `bomb_explode` ×1.1+ (shared) | splatted holding: `shaker_fizzle` |
| Waddle Bomb (`waddle`, kits/waddle.js) | `bomb_throw` ×1.08 (shared) | — | `waddle_land` P | `waddle_walk` loop P (kit-owned, near 42 m) | sensing: `bomb_beep` ticks (shared); lock `waddle_lock` P | `bomb_explode` (shared) | popped: `splat_small` ×1.3 |
| Tide Torpedo (`torpedo`, kits/torpedo.js) | `bomb_throw` (shared) + `torpedo_throw` | `torpedo_whirr` loop P (kit-owned, only if near at the throw) | lock: `torpedo_transform` P + `torpedo_lock` 2D (target / owner) | launch `torpedo_launch` P; whirr pitch up | lock pips only | `bomb_explode` (shared) + `torpedo_pop` | shot down: `splat_small` + `torpedo_pop` |
| Tracer Bolt (`tracer`, kits/tracer.js) | `tracer_zap` | `tracer_hum` loop P (kit-owned, only if near at the shot) | bounces `tracer_bounce` P | trail hum fades | — | hit: `tracer_hit` | — |
| Whirl Boomerang (`boomerang`, kits/boomerang.js) | `boomerang_throw` | `boomerang_whirr` loop P (kit-owned) | hover: whirr higher | back `boomerang_return`, orbit `boomerang_orbit` loop, shred ticks | caught a foe: `bomb_beep` ticks (shared) | `boomerang_burst` / big: `bomb_explode` (shared) | fizzle: `splat_small` |

## Specials

Every special also plays the shared `special_activate` at the start (P for others, 2D for you) and, for the
transformations, the shared `special_ending` 2 s before the end and `special_end` when time runs out.

| Special | Start / deploy | Flight / travel | Landing / arming | Active / moving | Warning | Trigger / explode | End |
|---|---|---|---|---|---|---|---|
| Tidal Slam (`slam`, actor.js) | shared activate only | leap: — | — | — | — | `special_slam` P | — |
| Ink Tempest (`storm`) | shared activate only (no throw sound) | — | cloud: `storm_thunder` P | `storm_rain` loop P (follows the drift; **orphaned on quit**: Projectiles.clear never stops it) | — | rain damage | `storm:end`: loop stops, no sound |
| Bomb Barrage (`barrage*`) | shared activate only | each bomb as its sub (shared bomb sounds) | as the sub | — (nothing says a barrage is running) | as the sub | as the sub | `special_end` |
| Bubble Guard (`bubbler`) | `shield_up` | — | — | — (no hum while shielded) | — | hits: `shield_hit` | `shield_pop` |
| Deep Sonar (`sonar`) | `sonar_ping` 2D for everyone; `sonar_mark` for the revealed | — | — | revealed 8 s: — | — | — | — |
| Vortex Strike (`strike`) | aiming: — | `strike_launch` at the thrower; `strike_whistle` P at the target (near 40 m, from 35 % of the flight) | ring on the ground: — | `tornado` loop P (vortex) | the whistle (~1.4 s) | `strike_impact` P | vortex ends: loop stops |
| Twister Zooka (`zooka`) | shared activate only | twisters: — (silent flight) | — | — | — | `zooka_fire` at the shooter; twister end `splat_big` (shared) | `special_end` |
| Howl Box (`wail`) | held on the shoulder: — | — | set down: `wail_charge` P | `wail_blast` loop P | the 1.24 s charge | beam | loop stops |
| Kraken (`kraken`) | `kraken_on` | moving: — | — | — (no body sound) | jump attack: `kraken_jump` only | `kraken_slam` P | `special_end` |
| Bubble Blower (`blower`) | shared activate only | `blower_inflate` loop while blowing (only if near at the start) | release `bubble_release` | drifting bubbles: — | charged by team fire: — | `bubble_blast` / timed out `bubble_pop` | `special_end` |
| Ink Jet (`jetpack`) | shared activate only | `jet_loop` loop (only if near at the start) | boost: `zip_pull` (the Zipline's) | shots `jet_fire` | — | — | `jet_end` |
| Mega Stamp (`stamp`) | shared activate only | carried: — | — | swings `stamp_swing`, smashes `stamp_slam` | — | thrown: `stamp_throw` at the thrower (flight silent), `stamp_slam` on landing (shared with the swings) | `special_end` |
| Cheer Orb (`booyah`) | `booyah_charge` loop (only if near at the start) | orb flight: — | landing: `bomb_beep` ×0.6 once (shared) | fuse 1.5 s: — | — (one beep) | `booyah_blast` P | — |
| Zipline (`zipcaster`) | shared activate only | `zip_fire`, `zip_pull` | `zip_latch` P | the aura: —; zipping: — (one-shot pull only) | — | impact: `blaster_boom` ×1.25 (the Blaster's) | `special_end` |
| Crab Rig (`crab`) | shared activate only | — | — | `crab_move` / `crab_roll` loop (only if near at the start; swapped on roll) | cannon: — | gatling `crab_gatling`, cannon `crab_cannon`, shell: `bomb_explode` ×0.8 (shared), flight silent | `crab_break` |

## What was missing (the brief's checklist)

- **Shared sounds:** `bomb_throw`, `bomb_beep`, `bomb_explode` cover eleven subs; `splat_small` is the end of five;
  `blaster_boom` is the Pop Pellet, the Zipline impact and the Blaster; `special_activate` is the only start of seven
  specials.
- **Silent movers:** the Skitter Bomb, rolling Splat Bombs, Zooka twisters, drifting bubbles, the Cheer Orb in flight,
  a moving Kraken, the carried / thrown Stamp, the zipping Zipline, the Crab's shells, the Strike missile's fall.
- **Loops that start only if near at the start:** jet, crab, blower, booyah, torpedo, tracer. Walk up to one and it
  stays silent.
- **No friend / foe difference** anywhere: an enemy bomb at your feet sounds like your own.
- **No warning** for the Splat Bomb's roll, the Shaker between blasts, the Kraken's dive, the thrown Stamp, the
  Crab's shells, the Cheer Orb's fuse (one beep), the Slam's leap, a Strike aimed at you, a Waddle on your heels.
- **Orphan risk:** `storm_rain` survives a quit mid-storm (Projectiles.clear removes the cloud but not its loop), and
  `jet_loop` / `crab_move` / `crab_roll` / `booyah_charge` / `blower_inflate` survive a quit mid-special
  (Match.dispose never ends a running special, so its `end()` never stops the loop).
