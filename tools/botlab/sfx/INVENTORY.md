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

---

# After (branch `sfx-cues`)

Every sound below is procedural (new ones in `src/audio/sfx-cues.js`, the rest already in audio.js or the kit
modules). **Loop** = one positional loop per object and channel, played by the director (`src/audio/cues.js`), that
follows the object every frame and stops the frame it's gone. **Warn** = a warning (loop or one-shot): louder and
harsher when it's the enemy's, boosted the closer you are. `sub_fly@k` = the shared in-flight whoosh at pitch k (each
kind its own pitch). Listen: `out/cues.wav` (index `out/cues.txt`).

## Subs

| Sub | Throw / deploy | Flight | Landing / arming | Active / moving | Warning | Blast | End |
|---|---|---|---|---|---|---|---|
| Splat Bomb | `bomb_throw` (plastic tok) | loop `sub_fly@1` | `bomb_beep` | the fuse loop's plastic rattle while it still rolls | loop `fuse_bomb` 0.95 s: bips 4 → 18 a second, climbing, a whine at the end | `bomb_explode` | — |
| Cling Charge | `throw_sticky` (wet schlup) | loop `sub_fly@0.85` | `sticky_stick` (suction thwuck, clamp ring) | — | loop `fuse_sticky` 2.4 s: a deep "bwom" pulse 1.6 → 10 a second (the enemy's a sour tritone, yours a fifth) | `sticky_explode` (deep, wide, long rumble, splorch) | — |
| Pop Pellet | `throw_burst` (quick high pip) | loop `sub_fly@1.5` | pops on impact (it never rolls) | — | — | `pellet_pop` (bright POK and spray) | — |
| Skitter Bomb | `throw_seeker` (ratchet wind-up) | loop `sub_fly@1.15` | `seeker_land` (clatter, motor revving) | warn loop `seeker_run`: clicky feet, servo whine; faster when it dashes; a beeping on top when it's after you | the run loop itself | `seeker_explode` (crunch, parts, motor dying) | — |
| Echo Orb | `throw_scan` (glassy ting) | loop `sub_fly@1.35` | — | — | — | `scan_burst` (sonar vwoom and ping, no blast) | — |
| Drip Curtain | `throw_curtain` (sloshing bag) | loop `sub_fly@0.7` | `curtain_up` (sheet whooshing down, splash) | loop `curtain_drip` (falling sheet, drips; thinner as it fades) | — | — | `curtain_down` (draining gurgle) |
| Twirl Sprinkler | `throw_sprinkler` (metal zing) | loop `sub_fly@1.25` | `sprinkler_stick` (clamp, spin-up) | loop `sprinkler_spin` (rotor, "tsh … tsh" pulses; half speed once tired) | — | — | `sprinkler_break` (sputter, clunk, spin-down) |
| Lurk Mine | `place_mine` (soft thunk, three quiet arming pips; 14 m) | — | — | silent while hidden | `mine_trip` (click and rising alarm, 0.35 s before) | `mine_explode` (dry snap, electric zap) | — |
| Hop Beacon | `place_beacon` (clunk, power-up chime) | — | — | loop `beacon_hum` (a soft boop every 1.2 s; 16 m); `beacon_use` when jumped to | — | — | `beacon_break` (power-down, crack) |
| Murk Bomb | `throw_mist` (squishy fwomp) | loop `sub_fly@0.8` | `mist_burst` (gassy pfoomph) | loop `mist_hiss` (murky bubbling, hiss, the enemy's low beating drone) | — | — | fades with the cloud |
| Shaker Bomb | hold: `shaker_clink`, `shaker_fizz`; `throw_shaker` (can shake, hiss) | warn loop `shaker_rattle` from the throw | `shaker_land` (clonk, fizz) | the rattle speeds up and hisses higher toward each blast; `shaker_hop` | the rattle loop (from the throw) | `shaker_blast` ×1–3 (soda-can pssh-BANG, each a step higher) | — |
| Waddle Bomb | `throw_waddle` (wind-up key, "wee!") | loop `sub_fly@1.05` | `waddle_land`; sensing `waddle_beep` toy bips speeding up; `waddle_lock` | warn loop `waddle_walk` (feet, servo, bip; faster as it closes) | warn loop `hunt_alarm` on its target (toy siren, louder and faster as it closes) | `waddle_explode` (spring boing, boom) | shot down: `waddle_pop` (squeaky deflate) |
| Tide Torpedo | `torpedo_throw` (motor start) | loop `torpedo_whirr` (warn once locked; climbs as it swims) | `torpedo_transform`, `torpedo_lock` | `torpedo_launch` | warn loop `lock_tone` on its target (missile-lock pips 4 → 18 a second) | `torpedo_burst` (wet crack, thump, droplets) | shot down: `splat_small` + `torpedo_pop` |
| Tracer Bolt | `tracer_zap` | loop `tracer_hum` (then its trail's, fading) | `tracer_bounce` per ricochet | — | — | `tracer_hit` ("marked" chime) | — |
| Whirl Boomerang | `boomerang_throw` | loop `boomerang_whirr` (out, hovering higher, back) | `boomerang_return`, `boomerang_shred` | loop `boomerang_orbit` round you | caught a foe: warn whirr + `boomerang_tick` tinks quickening (0.6 s) | `boomerang_blast` (blades spinning down, clang, boom); end: `boomerang_burst` | fizzle: `splat_small` |

## Specials

Each still starts with the shared `special_activate` jingle (and a transformation's `special_ending` / `special_end`),
then its own sounds:

| Special | Start | Travel / carried | Landing / arming | Active / moving | Warning | Blast | End |
|---|---|---|---|---|---|---|---|
| Tidal Slam | `slam_leap` (rush up) | — | — | — | warn loop `slam_warn` leap → landing: rising wind-up, quiver at the top, falling whistle (~0.9 s) | `special_slam` | — |
| Ink Tempest | `storm_throw` (heavy lob, thunder inside) | loop `sub_fly@0.6` | `storm_thunder` | loop `storm_rain` drifting with the cloud | — | rain | `storm_fade` (last drizzle, far rumble) |
| Bomb Barrage | `barrage_start` (bandolier rattle, snare fill) | each bomb as its sub | as the sub | loop `barrage_drum` (marching snare) on the thrower | every bomb's own fuse | as the sub | `special_end` |
| Bubble Guard | `shield_up` | — | — | loop `shield_hum` on every shielded kid | — | `shield_hit` | `shield_pop` |
| Deep Sonar | `sonar_ping`; `sonar_mark` for the revealed | — | — | `sonar_blip` every 2 s while you're revealed | — | — | — |
| Vortex Strike | `strike_arm`; you aiming: loop `strike_aim` (2D) | `strike_launch` | — | loop `tornado` (vortex) | warn loop `strike_mark` at the landing spot the whole 2.2 s flight (two-tone pulse speeding up, rumble swelling) + `strike_whistle` | `strike_impact` | `vortex_end` (suction spinning down) |
| Twister Zooka | `zooka_arm` (clunk, wind whirling up) | `zooka_fire` (heard to 50 m) | — | warn loop `twister` on each twister (a fast whirl: the Doppler makes the pass-by) | the twister loop | `twister_burst` | `special_end` |
| Howl Box | `wail_up` (amp powering on) | loop `wail_hold` while carried | set down: `wail_charge` (1.3 s) | warn loop `wail_blast` | warn loop `beam_lock` when you're in its line (an electric crescendo) | the beam | — |
| Kraken | `kraken_on` | loop `kraken_move` (slither, gallop with its speed, gargling growl) | `kraken_jump` | — | warn loop `kraken_dive` in the jump attack (falling whistle, ~0.67 s) | `kraken_slam` | `kraken_off` (squelchy pop) |
| Bubble Blower | `blower_start` | loop `blower_inflate` while blowing | `bubble_release` | loop `bubble_drift` per bubble | the drift loop strains (higher, faster wobble, a creak) as its team charges it | `bubble_blast`; timed out `bubble_pop` | `special_end` |
| Ink Jet | `jet_ignite` | loop `jet_loop` (yours from you) | — | `jet_boost`, `jet_fire` | — | `jet_boom` (its shots landing) | `jet_end` |
| Mega Stamp | `stamp_start` (rubber boing, clank) | loop `stamp_carry` (creak, stomp in step) | — | `stamp_swing`, `stamp_slam` | thrown: `stamp_throw` + warn loop `stamp_fly` (heavy spinning whoosh) | `stamp_crash` | `special_end` |
| Cheer Orb | loop `booyah_charge` (climbs an octave with the charge); `booyah_cheer` | `booyah_throw` + warn loop `orb_fly` (choir whoosh) | `orb_land` (thud, choir "hup!") | — | warn loop `orb_fuse` 1.5 s (choir crescendo, racing heartbeat) | `booyah_blast` | — |
| Zipline | `zip_cloak` (shimmering swell) | loop `zip_aura` on its wearer (a whisper) | `zip_fire`, `zip_latch`, `zip_pull` | loop `zip_whizz` while zipping | — | `zip_impact` (twang, thump) | `special_end` |
| Crab Rig | `crab_boot` (servos, clanks, ready beep) | loop `crab_move` / `crab_roll` (one at a time) | — | `crab_gatling`, `crab_cannon`; `crab_reload` when the mortar's loaded again | warn loop `shell_whistle` on each shell (climbs, then falls) | `shell_boom` | `crab_break` |

## Rules (src/audio/cues.js)

- **One loop per object and channel**, gathered from the world every frame and reconciled: gone from the world → its
  loop stops that frame. A pause hushes them (the loop bus); the end of the round (time's up) and a quit stop them.
- **Friend / foe**: yours and your team's are a little quieter (moving 1 / 0.9 of 1.05, warnings 0.75 / 0.7 of 1.15)
  and their warnings use the soft timbre (params.foe 0); the enemy's warnings use the harsh one and get up to ×1.55 when
  you're inside ~2 × their blast radius (and when it's after you: a Waddle's target, a Torpedo's lock, a Howl Box's
  line) — never louder than the blast. Your own throws and starts, and your own transformation's body loop, have no
  position.
- **Audible in a fight** (fixed 2026-10-01, after "I hear no sound cues"): the cues had been mixed by their own level
  offline and landed 8–18 dB under your own weapon fire and the music in a real match — playing, but masked. Now they
  carry further (the panner's reference distance 5 m, warnings 6, instead of 3), the mix is higher (above), and
  `LEVEL` (dB per sound, in cues.js) lifts the ones that measured weak. `tools/botlab/sfx/realflow.cjs` measures it
  through the real menus with an analyser on every voice and holds the bars (per family, against your weapon fire and
  the music).
- **Doppler-ish**: pitch × 1 / (1 − v_r / 55) (0.84 … 1.22) and level × (1 + v_r / 40) (0.85 … 1.25), v_r = the
  object's own speed toward the camera; the camera's own movement doesn't count (a standing sprinkler never warbles).
- **Caps**: 8 moving + 5 warning loops at once (the menus' backdrop match: 3 + 2); warnings rank first, the enemy's
  first, then the closest. A big enemy threat (Slam, Strike, Cheer Orb, Howl Box line, Stamp, Kraken dive) with you
  inside its reach dips the music (audio.duck 0.35); any enemy warning with you close to it dips it a little (0.2).
