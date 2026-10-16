# Online play — session contract (`G.net`)

Private rooms with a 5-character code, up to 8 players (4 v 4, as many bots as the host asks for in the empty slots). The
room creator is the **host**: their browser runs the bots, the match clock and the final judge. Besides the four match
modes a room can play **Practice**: no clock, no score — everyone plays on the host's stage until the host ends it,
swapping loadouts, clearing the ink and changing stage as they go (see *Practice* below). Every player simulates their
own squidkid locally (instant controls) and streams it to the others, who render it through the same animation system
as a local character, interpolated ~100 ms behind. Ink is replicated splat-for-splat from whoever painted it, so every
screen shows the same turf.

Transport: one WebSocket per player to a Cloudflare Durable Object relay (`server/`), one room object per code.

**Which relay** (src/net/transport.js `relayInfo`, first match wins): `?relay=…` (dev / tests) · a page served by
`tools/host/selfhost.cjs` (its `<meta name="inkwave-relay" content="same-origin">`: the relay on the page's own host) ·
the player's choice on **ONLINE › SERVER** — *Official* or *Friend's server* plus a pasted link (settings `server` /
`serverLink`; `parseServerLink` turns https / http / bare hosts into `wss://` / `ws://` host[:port]) · a page from this
machine or the LAN: `wrangler dev` on :8787 · the deployed Worker. The SERVER chip checks the relay's `/health` once
when the screen opens and after a change. A refused handshake whose relay still answers `/health` is reported as
"turned this game away" (e.g. the official relay and the desktop app's `app://inkwave` until its origin rule is
deployed), apart from "can't reach". The desktop app's page CSP (electron/main.cjs) allows ws / wss / http / https
connections for this. A self-hosted server admits the desktop app, its own pages, `*.trycloudflare.com`, localhost
and the LAN; players on different game versions are turned away by the relay's protocol check (`v=`).

## `G.net` — the session (src/net/session.js)

```js
G.net.state      // 'offline' | 'connecting' | 'lobby' | 'starting' | 'match' | 'error'
G.net.code       // 'K7QXM' while in a room, else null
G.net.myId       // this player's id in the room
G.net.hostId
G.net.isHost     // boolean
G.net.error      // last error message (string) or null
G.net.lobby = {
  map: 'tidewater' | 'random',                 // 'random': the host rolls one from the mode's stages at the start
  time: 'day' | 'golden' | 'sunset' | 'random', // the look itself (config roomTheme); 'dusk' from older clients = 'sunset'
  duration: 180, difficulty: 'normal',
  mode: 'turf' | 'zones' | 'tower' | 'boss' | 'practice',
  botCount: -1 | 0..7,                          // -1 = fill every empty spot (a match's default; Practice starts at 0)
  bots: true,                                   // (older clients) true when there will be any bots
  live: null | { mode: 'practice', map, time, gen },   // the Practice session running right now (joiners drop in)
  players: [{ id, name, team: 0 | 1, weapon, sub, special, style, ready, host, you, ping }],   // stable order: join order
  maxPlayers: 8,
}

// actions (all safe to call in any state; invalid ones are ignored)
await G.net.create(name)          // → code; state goes connecting → lobby (you are host)
await G.net.join(code, name)      // rejects with Error('Room not found' | 'Room is full' | 'Match in progress' | 'Could not connect')
G.net.leave()                     // back to 'offline'
G.net.setMe({ name, weapon, sub, special, style, ready, team })   // any subset; team: 0 | 1 | 'auto'
G.net.setSettings({ map, time, duration, botCount, difficulty, mode })   // host only (Zone Control always runs 5:00 + overtime)
                                  //   botCount: -1 | 'fill' | 0..7; `bots: true | false` (older clients) = fill / none
G.net.botPlan()                   // → { total, team: [onA, onB], free }: the bots the room gets as it stands (config roomBotPlan)
G.net.canStart()                  // host: true when everyone present is ready (host counts as ready; Practice: no ready-up)
G.net.start()                     // host only → state 'starting' for everyone, then 'match'
G.net.practiceSwap({ map, time }) // host, mid-Practice: everyone moves to another stage / look in place ('random' allowed)
G.net.practicing                  // a Practice session is running (state 'match', cfg.practice)
G.net.emote(name)                 // 'booyah' | 'wave' | 'dance' | 'flex' — shown on your lobby character for everyone
G.net.on(event, fn) → unsubscribe
//   'state'  { state }                 any state change
//   'lobby'  { lobby }                 settings / players changed (fires after join / leave / setMe / setSettings)
//   'join'   { player }                'leave' { player, reason }       'host' { hostId }   (host migrated)
//   'emote'  { id, name }              'error'  { message }
//   'match'  { phase: 'start' | 'end', late }  match launched / ended (results shown, then everyone returns to 'lobby')
//   'practice' { phase: 'join' | 'swap', … }  host: someone dropped into the session / everyone: a stage swap began
```

Rules the UI can rely on:
- `lobby.players` always contains you (`you: true`) while in a room; the host is `host: true`.
- Teams are kept balanced by the host (≤ 4 per team). `setMe({ team })` is a request; the host may refuse.
- Bots: `botCount` of them (all the free spots for -1), split so the teams come out as even as they can (≤ 4 a side);
  Boss Battle is one squad of up to 8. A humans-only stage (config `noBots`) forces 0 (the host's own count comes back
  on the next stage); 'random' never rolls a humans-only stage the room couldn't start on or that would turn away the
  bots asked for.
- A stage under construction (config `wip`) is never offered: the host refuses it in `setSettings` / `practiceSwap`,
  'random' never rolls it, and a room opened over one starts on the first stage. A host whose page has `?wipstages`
  lists and picks them; every client loads the stage it is sent by id, flag or not.
- `start()` launches the match on every client; the menus should hide themselves when `state === 'match'` (main.js
  also does it). When the match's results finish, everyone returns to the lobby screen with `state === 'lobby'`.
- A player leaving mid-match is replaced by a bot on the same actor; if the host leaves, the room migrates to the next
  player (bots and clock move with it).
- Your locker look (`profile.style`) and loadout (`profile.weapon`, `.sub`, `.special`; a null sub / special means the
  weapon's own) are sent automatically on join; call `setMe` again when they change in the lobby. Bots get a random sub /
  special about half the time, as offline.

## Practice

`mode: 'practice'` in the lobby. The start config is a turf stage with `practice: 1` and `gen: 0` (Match `practice`: no
intro, no clock, no judge, no results); the teams come from the lobby, the host's bots are normal bots, and the relay
room is **not** locked. The session runs until the host ends it (`{k:'end'}`, the same as after a match's results →
everyone back in the lobby; the room stays). Pausing never freezes anything (as in any online match): the pause menu,
and the `L` loadout overlay, just take your hands off the controls while they're up.
- **Loadouts** (`L`, or the pause menu): applied at once (main.js `_applyPracticeLoadout`), recorded on the owner's
  timeline as `['lo', nid, weapon, sub, special]` — every screen swaps the kit in that squidkid's hands — and sent to the
  lobby (`setMe`), so a late joiner and the next match see it.
- **Clear all ink** (host: pause menu or `K`): the host numbers the wave (`paint.wipeK + 1`) and records
  `['w', k, cx, cz, dur, reach]` on its timeline (from where it stands, ≈ 1.2–2 s to cross the stage); every screen runs
  `paint.startWipe` with those numbers: a front sweeping out flat from (cx, cz) that clears every grid cell / atlas texel it
  passes (src/world/paint.js), dressed by src/fx/inkWipeFx.js and the level shader (a shimmering front and curtain, the
  old ink boiling off behind it, steam, the whoosh-and-fizz). Ink painted behind the front stays; ink ahead goes when the
  front gets there. Splat records carry their painter's **wave tag** (`[wave, its front radius then]`, 9999 once over:
  record fields 14–15); a screen replaying one holds it until its own front has got as far (or its wave has started),
  then draws it with the ring between the painter's front and its own masked off (the wave already passed there for
  the painter); a splat from before a wave its painter hadn't heard of is "before" it. So each cell is cleared or inked
  by the same rule everywhere, whatever order the wave and the splats arrive in (tools/botlab/tests/ink-wipe.js: three
  screens with their waves behind / ahead of the painter's end with its exact grid).
- **Swap stage** (host, pause menu): `practiceSwap` broadcasts `{k:'pswap', …cfg, map, time, roster, gen: gen + 1}`:
  the live roster (current loadouts, owners after any handoff; bots dropped on a humans-only stage). Every screen
  disposes its NetMatch, makes the new generation's (so the others' first ticks there queue), and rebuilds in place
  behind a stage card (main.js `practiceSwapStage`, the world build is serialised); everyone starts at their team's pad.
  Ticks carry `g` (the generation): a peer's ticks from the stage before are ignored.
- **Joining mid-session**: the relay lets anyone in (not locked). The host, on the joiner's first `me`, drops it in on
  the side with fewer players (a full side's bot makes room: `{k:'pr', nid, g}` to everyone), tells everyone
  `{k:'pj', r, g}` (its roster entry: it spawns at its pad) and sends the joiner `{…cfg, k:'start', roster: live roster,
  late: 1}` — no countdown, straight in. Once its stage is built the joiner asks for the turf (`{k:'inkreq', g}`); the
  host answers with `paint.exportGrid()` — the gameplay grid run-length encoded, a few KB — in `{k:'ink', id, i, n,
  cells, g, map, wipe: [k, cx, cz], d}` pieces of ≤ 48 000 chars (well under the relay's 64 KB cap, ≤ 4 per 120 ms: its
  rate limit). The joiner's event playback waits for it (≤ 8 s), `importGrid` takes the grid and stamps it into the atlas
  (a rounded box per run of cells: the gameplay edge exact, the drawn one a little blockier than a live splat's) along
  with the wave count, then everything painted since plays on top.
- **Leaving**: a player who leaves mid-practice is gone (not handed to a bot); the host's bots move to the new host, who
  gets the host's controls (clear ink, swap stage, end practice) — the pause menu rebuilds itself when that happens.

## How the netcode works (src/net/netmatch.js)

**Ownership.** Every squidkid has one owner: players own themselves, the host owns the bots and runs the match clock
and the judge. Owners simulate at full frame rate and stream a 20 Hz tick (`{k:'t', ts, a:[packed actors], e:[events]}`)
through the relay; nobody else ever simulates someone else's squidkid. A player who leaves (or whose connection dies)
is adopted by the host as a bot, starting exactly where everyone last saw it; when the host leaves, the oldest
remaining player becomes host and adopts the bots, clock and judge.

**Timeline.** For each sender there is one playback clock in the sender's time, running a little behind "now":
- *offset* — the fastest packet seen sets the clock offset (network floor); it creeps up slowly for drift;
- *delay* — one tick of buffer plus 2.5 × the measured jitter, clamped to 85–300 ms and eased;
- the clock advances with this client's own frame time and steers toward `now − offset − delay` at ±20–25 %, so a
  local hitch never makes remote squidkids leap, and it slows (down to 0.35×) when the sender's samples are about
  to run out instead of running off the end of the path.

**Path.** Positions are a cubic Hermite through the owner's samples using the owner's velocities (C1: no corners at
tick boundaries); vertical motion never dips through a floor either end stands on. Past the newest sample it
extrapolates ballistically for at most 180 ms, then holds — except past a sample flagged `F.dash` (bit 23, `[b5-sub-dash]`:
the owner is mid Dash Pellet dash, 29 m/s), which holds at once: 180 ms at that speed is 5 m through whatever is ahead,
then a snap back, and shots on that screen would be judged against the wrong spot. The dash lasts 0.22 s (about 4
ticks), so most of it is interpolated between real samples anyway, and the damped correction carries it on. A teleport counter (`netTp`, bumped on respawn) makes
proxies cut instead of gliding across the map; a respawning squidkid stays hidden until its new life's first sample.

**Corrections.** The only discontinuities are new data rewriting a moment already shown (leaving an extrapolation,
an ownership handoff). Each frame the path is re-evaluated at last frame's time; any difference is carried as an
offset that settles on a critically damped curve (ω = 13), so nothing pops and nothing lurches.

**Animation.** Remote squidkids run the same `_finishFrame` / character animation as local ones, fed from the
replicated state (form, grounded, climbing, weapon pose flags, turn rate) plus the owner's animation triggers and
events (`['tr' …]`, `['ev' …]`) played on the same timeline, so a remote roller flick or dodge roll is the real clip.

**Ink and hits.** Every splat is sent by whoever painted it and replayed exactly (seeded shape), so all screens show
the same turf; other players' shots are visual-only ghosts. Hits are decided by the shooter's screen and applied by
the victim's owner (`{k:'hit'}`); splats, specials and respawns are forwarded as events. The host's final count is the
result on every screen.

**Kit weapons and subs (src/game/kits/*, subs.js).** A world object of its own (a fist, an arrow, a canopy, a thrown
sub, a Waddle …) is recorded by its owner as `['k', nid, kind, data]` and replayed by the kit's `ghost(actor, data)`:
visual-only (paint muted, hits dropped) and never deciding for itself — its owner's end / lock / path records drive it.
A hit on a ghost device (curtain, beacon, Waddle, Torpedo …) goes to its owner (`{k:'dh'}` → the kit's `netHurt`).
(Amounts are positive only. A Bubble Blower bubble's two kinds of hit — enemy fire shrinks it, its own team's charges
it until it blows — go on two channels: `kind:'sp'` and, `[b5-int1]`, `kind:'spTeam'`; team fire used to be sent as a
negative `sp` amount and was dropped, so a teammate on another screen could never set off your bubble.
`tools/botlab/tests/net-blower-team.cjs`.)
The built-in subs (subs.js) add an update record `[3, gid, …]` from the owner: a Lurk Mine tripped (it pops up on every
screen — it's invisible to the other team until then, on theirs too), a Skitter Bomb stopping to wind up (ghost Skitters
never trigger themselves), a Hop Beacon's jumps left, a Drip Curtain's ink after hits (its decay runs everywhere); a
super jump onto a remote player's beacon goes to its owner through the same device-hit channel (`beaconUse`). The
Waddle's windup is its `[5, gid, x, y, z]`.
A kit's pose state (a Mitts leap, a held Brolly canopy) rides the actor tick (`netState` / `netApply`).
`[b5-sub-glide]` A device hit names its attacker: `{k:'dh', kind, id, d, a}` (`a`: the shooter's nid, when known — the
kit's `netHurt(id, dmg, by)` gets that actor on the owner's screen, or null; older senders leave it out). A player who
leaves takes their kit objects with them: `onLeave` (before the squidkid is re-owned, on every screen) and `_remove`
call `SUB_KITS[k].dropOwner(actor)` for each of their squidkids (bots included), which ends their objects there quietly
(no blast, no paint, no `'device:down'`).

**Glide Bomb** (`src/game/kits/glide.js`, kit kind `glide`). The owner simulates; records `['k', nid, 'glide', …]`:
- `[5, level]` — the cook in the hand reached a level (1 / 2 / 3 at cook 0.6 / 1.2 / 1.8 s, i.e. held 0.75 / 1.35 /
  1.95 s); `[5, 0]` when a cook in the hand fizzles (splatted, dived, any interrupted hold). Other screens show the
  held stone's lamps (8 / 5 / 3 / 1), the team glow round the fist and the fuse sizzle (within 12 m) at that level; the
  actor tick's `subAim` flag ends it (level 0 when it drops). No new tick bits.
- `[0, gid, x, y, z, vx, vz, fuse, R]` — released: where it was set down, its slide velocity, the fuse left and the blast
  radius (the cook is decided). Every screen slides its copy with the same step function at a fixed 1/60 s step through
  an accumulator (≤ 6 steps a frame), so the frame rate never changes where it goes.
- `[4, gid, x, y, z, vx, vz, fuse]` — the owner's word every 0.25 s (the players it bounces off differ per screen): a
  ghost eases onto it (`k = 1 − e^(−14 dt)`; snaps beyond 3 m) and takes its velocity and fuse. At a bounce the record
  also carries the bounce: `[4, …, fuse, kind, who]` (kind 1 wall · 2 mover · 3 kid · 4 curtain · 5 sentry · 6 shell; who:
  the kid's nid, for a kid bounce). A ghost that hasn't bounced by itself within 0.15 s plays the clonk and sparks from
  it (the record can turn it a step before it would have touched — so the kid it bounced off still sees and hears it);
  one that has, doesn't (never twice).
- `[1, gid, x, y, z]` — the blast (the look there; paint and damage are the owner's).
- `[2, gid, why, hot]` — an end without a blast: why 0 sank, 1 popped (shot down), 2 smashed (a Mega Stamp's guard); for a
  sink, hot 1 when it went into lava or another stage hazard (`G.match.lava.under` / `G.match.stage.under`, asked before
  `G.level.liquidY`, which on caldera answers the lava's surface too): the ghost hisses (`lava.fizzle` / `stage.fizzle`)
  instead of plopping.
A ghost never paints, hurts, blows or pops by itself: at the end of its fuse it holds, pulsing, until the owner's word
(2 s at most). Enemy fire on a ghost goes to the owner (`netHurt(owner, 'glide', gid, dmg, by)`; while `netMuted()` — a
ghost's shot or blast being replayed — it only flashes). A Mega Stamp's guard that smashes a ghost on the stamper's
screen ends it there at once and tells the owner on the `glideSmash` channel. Players in the blast are judged on the
owner's screen and applied by each victim's owner (`applyHit`, as every bomb). It is a bomb, not a device: nothing
crushes it (its kit device descriptor says `crushable: false`, which `G.deploy.crushIn` skips — the tower, the re-forming
Roe Shell, lava and era-flip sweeps); a moving floor carries it on every screen alike, and the tower's and every mover's
sides are walls it bounces off. Tested by `tools/botlab/tests/net-sub-glide.cjs` (`CLIENTS=2`; `NET_ARGS='scene=hostleave'`:
the host leaves with its bot's stone and its own sliding — both ghosts end at `onLeave` on the guest, no blast).
**Dash Pellet** (`[b5-sub-dash]`, src/game/kits/dash.js). The owner simulates the dash and records one word per press,
`['k', nid, 'dash', [0, gid, x, y, z, dx, dz, air]]`: every screen plays the pop, its blast look and sound and the speed
ribbon at that take-off point (a ghost's blast never hurts and never paints). The motion itself is the owner's actor
tick (`F.dash` while it runs: never extrapolated, see *Path*); the forward-roll clip is the owner's `['tr', nid, 'roll',
{x, y, z, dur}]`. The blast's hits are judged on the dasher's screen and applied by each victim's owner (`{k:'hit'}`,
`weaponId 'dash'`; a Drainbow halves them there, from the take-off point), its devices' damage goes the usual way
(`G.subs.damageArea` → `{k:'dh'}` for a ghost device), and its paint and the ground streak are the owner's splats.
Nothing outlives the dash, so a leaving player hands nothing over. The press itself is local: the runner's press latch
(`trySubPress` / `subLatch`) and the "Can't use" refusals (`'sub:cantuse'` with its `reason`) never cross the wire.
`tools/botlab/tests/net-sub-dash.cjs` (`CLIENTS=2`).
Statuses: every screen's ghost subs track / poison the players they touch there too (the timers run out on remote
players as well); the owner's own word — tracked, poisoned — rides the actor tick's flags (`F.tracked`, `F.poisoned` →
`a.netStatus`), so the tracked look and the poison bubbles (src/game/statusFx.js) show on every screen while they last.
The tracked look needs nothing more: with two teams, tracked means tracked by the *other* team, which gives the wrapped
arrow's colour, who sees it through walls (that team) and who gets a line to them (everyone on that team, each from
their own kid) — so no tracker id rides the tick (it stays 24 fields).
The arrow's arrival (track-ribbons: it flies in from the mark's source) needs no field either: the source rides the
records that already make the mark on every screen — a ghost Echo Orb bursts and a ghost Lurk Mine blows where the
owner's did (the throw / place records), the Tracer's hit record carries its hit point (`[1, gid, x, y, z, victim]`),
a ghost special's start record brings Deep Sonar's user — so each screen flies the ribbon from the same place. A mark a
screen hears only as the owner's flag (its own ghost missed, or it joined mid-mark) pops the band in. The mark's sounds
(the marking team's chime, the marked player's evil one and its end) play from each screen's own mark:on / mark:off
(src/game/statusFx.js → src/audio/cues.js).

**Drainbow** (src/game/sp-drainbow.js). The owner's special records (`['k', nid, 'sp', …]`): the start `[0, index]`
then the bubble `[4, 'p', x, y, z, radius, life]`, its longer life `[4, 'x', life]` while its owner is fed (a few
times a second, ≥ 0.2 s at a time), and the end `[1, reason]`, which pops it. Every other screen builds a ghost bubble
from those (it pops on its own only if no end ever arrives, 3 s past its life). The rest is each screen's own, from
the positions it shows: who's inside (crossing ripples, the drain streams); the drain of the players it owns (their
ink and special meter — the host's screen does its bots) and their gains (teammates' ink and meter; the owner's share
becomes bubble time on the owner's screen only, which is why the life rides the record); the grey view and muffle of
its own player. Its ink (the splash it lands with, the film raining down when its time runs out) is the owner's splats,
replicated as usual. Shots: like every hit, the shooter's screen decides — its copy of the bubble (ghost or not) halves a
shot whose path touched it (or that reaches someone inside it), and the halved damage is what `{k:'hit'}` carries; the
victim's owner applies it as it comes (applyHit doesn't halve again while `_applyingHit`). Inside an enemy bubble
both teams' ink turns one shade (src/world/inkOne.js) — the drained player's own screen only, nothing on the wire; and
the host's bots inside one can't tell their own ink from theirs (their decisions, on the host where they run). Tested
by `tools/botlab/tests/net-drainbow.cjs` (`CLIENTS=2`).

**Surf N' Turf (src/game/sp-surf.js).** The special itself (holding the buoy machine) is an ordinary special record
(`['k', nid, 'sp', [0, index]]` … `[1, 'throw']`: the buoy in the ghost's hand). The buoy travels as its own kit kind
`surf` (`KIT_GHOSTS.surf`): the owner records `[0, gid, from, vel]` when it's thrown (every screen flies a copy),
`[3, gid, x, y, z]` where it anchored — the owner's word: each screen's copy snaps there and runs its rings from that
moment, so the six rings leave on the same beats of the owner's timeline everywhere (the polar map they run on is built
from the same anchor on every screen) — and `[4, gid]` when it's shot down or lost. Its ink is the owner's copy's splats,
replicated as usual (ghost copies paint nothing). **Hits and dodges follow the victim's owner**, like every other remote
hazard that hurts (the tornado, the speaker): each screen judges only the players it owns (its own squidkid, the host
its bots) against its own copy of the rings, where their position is exact — "jumped over it" (feet over the ribbon's
top as its front passes) is decided there. A hit is applied there (`damage(40, owner, 'surf')`, the mark through
`subs.track` → the actor tick's tracked flag) and recorded on the victim: `['k', victimNid, 'surf', [1, gid, ring]]`;
every other screen marks that player from the buoy's beacon (the ribbon flies in from there too) and plays the hit (the
owner's hit marker: an `'hit'` event with the owner as attacker). A dodge records `[2, gid, ring]` (the whoosh, the
dodge event elsewhere) and opens the owner's assist window on the victim's owner's screen. A shot / beam / blast on a
remote player's buoy goes to its owner as a device hit (`{k:'dh', kind:'surf'}` → `KIT_GHOSTS.surf.netHurt`); the
owner's copy loses the hp and, at 0, records `[4]`. tools/botlab/tests/net-surf.cjs plays it out on two real clients.

*On moving things* (the tower, the railcars, the pods' plants — any `Level.addDynamic` block): a buoy on a moving block's
top rides it, a block rising under it lifts it on, one driving into it shoves it out, and with its floor gone it falls
and anchors again below. **A ride sends nothing**: every screen carries its own copy on its own copy of the block (the
movers and pods run on the synced match clock, the tower follows the host's snapshots), so each screen's buoy sits on
the deck where that screen's tower is. The owner's word settles the rest: `[3, gid, x, y, z, lx, lz]` — anchored on a
moving block, with where on it (its local x / z: a ghost whose copy of the tower is a step behind attaches at the same
spot of the deck, not at the owner's world point); `[5, gid, x, y, z, T (, lx, lz)]` — anchored again after a fall, or
once a shove has settled: the spot and the ring clock `T` (no ring leaves while it's in the air; the ghost takes the
owner's clock); `[6, gid, i, x, y, z]` — ring `i` left from there (sent only when that's off where it last anchored:
it rode there). **Each ring is centred where it was emitted** (its own polar map from there), so a ghost's ring i
re-centres to the owner's `[6]` and every screen judges its own players against rings in the same places. Falls,
shoves and slides run on every screen alike; a ghost never decides it was crushed (that's the owner's `[4]`).
`net-surf.cjs` with `NET_ARGS='scene=tower'` checks the ride (the same spot on each screen's deck) and the ring centres
on two real clients.

**Deployables can be shot; the tower crushes them** (src/game/deployables.js, batch 5). Sprinklers, Hop Beacons, Skitter
Bombs on the ground and the Surf N' Turf buoy take enemy fire of every kind. **The device's owner decides.** A shot,
beam, blast or roller drum on a remote player's device is judged on the shooter's screen (its own projectile against
its ghost of the device) and sent to the owner as a device hit (`{k:'dh', kind:'subs' | 'surf'}`, as before); a ghost
shot only flashes a device, never hurts it (muted). Standing fire (the Ink Tempest's rain, the vortex, the Howl Box's
beam, Surf N' Turf's rings) and the tower are judged **on the owner's screen**, against its own copies of them (the
tower follows the host's snapshots; a ghost cloud / vortex / beam / ring runs there like any ghost) — the rule
tickDamage follows for players. The owner's end record says why it went: subs `[2, gid, 1]` shot down (a ghost Skitter
Bomb pops with a puff — no blast; a ghost sprinkler / beacon breaks with the pop look), `[2, gid, 2]` crushed by the
tower (the crunch on every screen); the buoy `[4, gid, 2]` crushed. Old `[2, gid]` / `[4, gid]` mean what they did. A
ghost device is never crushed by its own screen's tower — it waits for its owner's word, so both screens agree. Hit
markers are the shooter's own ('device:hit' on its screen). **A player who leaves:** the host, carrying on their
squidkid as a bot (`_adopt`), takes their devices over too (`DEPLOY.adopt`: its ghosts become its own, same gid) — so
the hits other screens send to the new owner (`dh` to the host) and the host's own hits, standing fire and tower land on
them, and the end / update records now come from the host. A squidkid taken out of the match (Practice: a player who
left; a humans-only stage) takes its devices with it on every screen ('actor:removed'). Tested by `net-deploy.cjs`
`NET_ARGS='scene=leave'` (the host leaves; the guest shoots the old host's beacon down on its own screen).

**Devices on moving floors** (the user: "lurk mines don't stick to moving floors such as the tower"). A Lurk Mine, Hop
Beacon, Twirl Sprinkler, Drip Curtain or Cling Charge set down or stuck on any moving level block (the tower's deck or
pillar, a Calamari railcar, a pod's plant, any `Level.addDynamic` block) keeps its spot in the block's own axes, on the
face it was set on, on every screen: each screen carries its copy on its own copy of the block (the movers and pods run
on the synced clock, the tower follows the host's snapshots), as the buoy does — no records while it rides. A moving
block pushing into a device lying on a floor lifts it onto its top or shoves it out of its way (the buoy's rule; the
tower crushes what's on the user's list — sprinkler, beacon, curtain, buoy — and pushes anything else, a Lurk Mine or a
Cling Charge on the floor, aside out of its path, never through it); its block going from under it, a floor device drops
onto what's below (a wall one breaks). On a stage with a stage module ([b5-int2]) a device never comes to rest in its
no-place disc (`G.level.noPlace`) or under its liquid (`G.match.stage.under`): a mine or beacon isn't planted there (the
owner's screen, before any record), a sprinkler or curtain landing there breaks, a drop or shove there counts as none —
every screen alike, from the module's pure function of the synced stage clock (the owner's end record settles a ghost,
as with any end). The
owner's word settles where it is whenever it settles somewhere: the subs record `[4, gid, x, y, z, tag, lx, ly, lz, nx,
ny, nz]` — on the moving block `tag` (its Level tag: `tower`, `tower-pillar`, `mover:<car>`, `plant:<pod>:<part>`; `#<id>`
for an untagged one) at `l` in its axes, on the face whose normal is `n` (its axes) — or `[4, gid, x, y, z]` (on still
ground again, after a drop or once a shove has settled: 0.2 s). A ghost snaps to it (one still in the air keeps it until
it lands). A mine is tripped by its owner's screen wherever the block has taken it (the `[3, gid]` / `[2, gid]` records,
as before). Old clients ignore `[4, …]` (no sub kind at `d[2]`). Tested by `tools/botlab/tests/net-deploy.cjs`
(`CLIENTS=2`; `NET_ARGS='scene=tower'`: the deck, the crush, the mine on the deck) and `tests/deployables.js`.

**The Scrap Sentry** (batch 5, `[b5-subs]`; src/game/kits/sentry.js, kit kind `sentry`). **Its owner simulates it**: the
spot rules, its eyes (the bots' sight rules: botSight's shared ray budget, against the positions the owner's screen
shows), the lock and the bursts all run on the owner's screen only (the host for its bots); its rounds are the owner's
ordinary projectiles (`recProj`: every other screen flies them as ghosts that never paint or hurt), so **a hit on a
player is judged on the owner's screen and applied by the victim's owner** (`{k:'hit'}`, weaponId `'sentry'`), its ink
replicates as the owner's splats. The records (`['k', nid, 'sentry', …]`): `[0, gid, x, y, z, nx, ny, nz, yaw]` set down
(the ghost unfolds there, riding the block under it if that moves); `[4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]`
wave 1's word on where it sits on a moving block or back on still ground (the ghost hands it to `G.deploy.netOn`, so it
rides its own screen's copy of the tower / railcar / pod at the owner's spot); `[3, gid, nid | -1]` locked onto / lost
(the ghost turns its head to that player as its screen shows them and plays the tell: the white lamp, "bip-bip", the
aim line); `[6, gid, yaw, pitch]` a burst starts (the ghost plays its three flashes and pfts, 0.11 s apart; the rounds
arrive by themselves); `[5, gid, hp]` its hp after hits (the damaged look everywhere); `[2, gid, why]` gone — 0 timed
out, 1 shot down, 2 crushed (the tower, a mover, the Bazookarp shell, an era flip, the lava), 3 folded (its owner
splatted, replaced, carried within `spawnBarrier + 4` m of the enemy pad). A ghost never decides an ending (a fallback:
`life + 3 s` with no record). **Hits on it**: a shot / beam / blast / roll on a ghost goes to its owner as
`{k:'dh', kind:'sentry', id, d, a}` — `a` (new, `[b5-subs]`, every kit device: `registry.js netHurt(…, by)` →
`sendDevHit(…, by)`) is the attacker's nid, so the owner's `'device:down'.by` names the guest who shot it down; old
senders send no `a` (null). A ghost shot, ghost blast or ghost roll replayed on a screen (`netMuted()`) only flashes a
real sentry there, never hurts it. The tower, movers, standing fire and `G.deploy.crushIn` act on each screen's own
sentries only (the owner's `[2, gid, 2]` ends the ghosts). **A player who leaves takes it with them**: `netmatch.js
onLeave` (before the leaver's squidkid is handed to the host) and `_remove` call every kit's `dropOwner(actor)`, so every
screen ends that player's sentry ghosts at once, quietly (no `'device:down'`) — unlike wave 1's subs devices, which the
host adopts. Tested by `tools/botlab/tests/net-sub-sentry.cjs` (`CLIENTS=2 Q0=autopilot Q1=autopilot`; `NET_ARGS='scene=tower'`:
the deck ride, the ghost at the owner's spot of the deck).

**The one destroyer** (`[b5-subs]`, subs SPEC §0.3). `G.deploy.crushIn(shape, how)` ends every device of this screen's own
whose body is in the shape — `{ blocks, rider }` (the tower's call: the user's list — sprinkler, beacon, curtain, buoy,
the kits' devices; a Lurk Mine or a floor Cling Charge is pushed aside instead), `{ sphere: { c, r } }` (the Bazookarp's
re-forming shell), `{ where: (pos) => bool }`, `{ standingOn: [blocks] }`, `{ liquid: depth }` — with one
`'device:down'` { how } each; each device's owner's own end record ends its ghosts (subs `[2, gid, 2]`, the buoy
`[4, gid, 2]`, the sentry `[2, gid, 2]`). Ghosts are never touched: every screen runs it on its own devices.

**Chain Bobber** (batch 5, `[b5-subs]`: src/game/kits/bobber.js, kit kind `bobber`; tools/botlab/jobs/batch5/subs/SPEC.md
§C, §0.4). **The owner simulates and decides** every bobber of theirs: where it floats, its tethers, when a chain goes,
which bobber hits the boss / the Bazookarp shell, when one is disarmed, crushed or expires. Its records (`['k', nid,
'bobber', …]`, rounded numbers):
- `[0, gid, x, y, z, vx, vy, vz]` thrown — every screen flies a copy (the flight steps at exactly 1/60 s on every screen,
  the arc preview's own integrator);
- `[3, gid, x, y, z, hover]` settled (its float spot, rounded to 0.01 m on the owner's screen too, so every screen holds
  the same spot; `hover` its height over its floor or the liquid) — again when it re-floats (its floor went: a parked
  block, an era flip), when a ghost eases there over 0.3 s; the lava's rise and fall each screen follows itself (a pure
  function of the synced clock);
- `[4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]` wave 1's ride word for its foot (the moving block it rides, or still
  ground after a shove), under the kit's own kind (`deployables.js _onRec` writes `it.netKind`); the ghost's ride body
  takes it through `G.deploy.netOn`;
- `[5, gidA1, gidB1, gidA2, gidB2, …]` the owner's whole tether list, sent whenever it changes; every other screen draws
  exactly that list (its chains — and so the lamps' N — are that list's connected groups). **Ghosts never link**;
- `[1, gid0, N, by, gid, hop, gid, hop, …]` a chain set off: its size at the trigger, the trigger's nid (`-1` none), the
  blow order as hop levels (gid0 is level 0). Every screen plays the sparks and blasts at its own 0.07 s hops from the
  moment it hears it;
- `[2, gid, why]` gone without a blast: 0 expired (or the hidden guard retired it), 1 disarmed (every screen sags it and
  pops it 0.4 s later), 2 crushed (the tower, a mover, the shell, an era flip, lava, a block through it), 3 refused (too
  near the enemy pad, a no-place disc);
- `[6, gid0, dmg, killed]` **from the victim's screen, on the victim** (`['k', victimNid, 'bobber', …]`): a chain caught
  that player there — the owner's hit marker and its CHAIN ×N callout's tick.

**Damage to players is judged where the victim is owned** (as Surf N' Turf's rings and the vortex): each screen replays
the chain from `[1]` and applies each blast to the players it owns only (its own squidkid; the host its bots), at their
true positions, with its own one-explosion-a-victim ledger (a victim caught by several blasts of one chain takes only the
strongest: each later blast adds its excess), the Drainbow halving from the bobber, the triggering teammate's assist
window opened on the victim (`G.assists.noteDamage(victim, by)`); the splat and its assist are that screen's, forwarded as
usual. The owner's screen alone paints the chain's ink (replicated as usual), hurts devices (`G.subs.damageArea`: a ghost
device's hit goes to its owner), sets off its team's other chains in reach, and makes the one body blast on the boss
(`boss.splash(…, { body: true })` — the rest `{ body: false }`, crablets only) and the one `G.objTargets.splash` on the
shell. **Hits on a ghost bobber go to its owner**: enemy fire as a device hit (`{k:'dh', kind:'bobber', id, d, a}`), team
fire on its own channel (`{k:'dh', kind:'bobberPop', id, d: 1, a}` — positive, so `registry.netHurt` sends it; at most
one a quarter second a bobber; the ghost flashes "struck" meanwhile). `a` is the shooter's nid (new: `sendDevHit(…, by)`
adds it, the `'dh'` case hands `byNid.get(a)` to the kit's `netHurt` as `by`; old senders send none: `null`) — the
owner credits the trigger with it. **Ghost fire never touches a real bobber**: a ghost round, blast or chain replayed on
the owner's screen (`netMuted()`) is absorbed with a flash and does nothing else (the shooter's screen sent the hit). **A
player who leaves takes their bobbers with them**: `netmatch.js onLeave` calls `SUB_KITS[k].dropOwner(a)` for every
squidkid of the leaver before anyone takes it over (and `_remove` does the same), so no inert ghost soaks shots for
someone gone. A ghost whose owner's end never came goes 3 s past its life. Tested by
`tools/botlab/tests/net-sub-bobber.cjs` (`CLIENTS=2 Q0=autopilot Q1=autopilot`) and `tests/sub-bobber.js` ('net').

**What outlives its owner** (batch 5, `[b5-sprules]`). A remote splat (`NetMatch._remoteSplat`) emits `'splatted'` with
`remote: true` on every other screen, after the owner's own records that went before it (a special's end `[1, 'splat']`
is recorded inside `actor.splat()`, ahead of the forwarded event). The Whirl Boomerang's ghost no longer fizzles on it:
like the owner's copy it notes where its thrower went down (`it.home`, from that screen's copy of the thrower) and whirls
back there; the owner's burst record `[1, gid, x, y, z, big]` still says where and when it goes off. A Drainbow whose
owner is splatted is orphaned by the end record (`popOnOwnerSplat: false`) and runs out its life on its own clock on
every screen (pop 'time', not the 3 s 'lost' fallback). The Ink Tempest's cloud and the Surf N' Turf buoy never
depended on their thrower (their own records). The gauge a splat leaves (half of what was left of a running special,
`specials.js splatShare` — an orphaned Drainbow's too, [b5-int2]) is the victim's own screen's, synced as usual (`sp` in
the actor tick).

**Bubble Guard chain** (src/game/sp-bubble.js). The user's own field comes from the special's start record (every
screen runs `IMPL.bubbler.start`). Passing a field on by touch is decided by the **receiver's owner** (its own squidkid;
the host its bots), from its view of everyone's synced positions — the same rule as damage: each screen hands copies
only to the players it owns and records it on the receiver, `['k', receiverNid, 'sp', [5, giverNid, timeLeft,
chainOwnerNid]]`; every other screen gives that player the same copy with that time (`netGhost` case 5 → `shieldNet`),
joined to its own copy of that chain (keyed by the chain owner's nid), so "each chain once a player" holds everywhere.
A copy heard that way runs to the chain's end on that screen (when its copy of the user's field runs out there), not to
the record's time, which is a playback delay late by then: so every copy of a chain runs out together on each screen,
however many hops it took (the record's time only for a chain the screen hasn't seen).
Tested by `tools/botlab/tests/net-sprules.cjs` (`CLIENTS=2 Q0=autopilot Q1=autopilot`).

**Bomb Barrages** (src/game/sp-barrage.js). The variant is the special's start record (`[0, index]`; Waddle and Mystery
appended to `SPECIAL_ORDER`). The bombs are their own records as ever (`'b'` for the Splat Bomb, the subs' and kits'
`'k'` for the rest, the Waddle's `[0 …]`). The Mystery Bomb Barrage's owner records each next bomb as the special's
moment `[4, 'nb', SUB_ORDER index]` (at the start and after every throw), so every screen shows the same bomb in that
player's hand. A barrage's Waddle senses and chases with the Waddle Bomb Barrage's own numbers (`barrageBomb`:
`waddleSense` / `waddleLife`); its ghost reads them from the owner's barrage running on that screen when its `[0 …]`
record arrives (records keep their order, so a Mystery's `'nb'` after the throw never gets there first).

**Zipline and Cheer Orb (batch 5; src/game/specials.js, src/game/sp-cheer.js).** The Zipline's quarter damage while
travelling along a zip is judged where every hit is applied, on the zipper's owner's screen (`filterDamage`: its own
special, not a ghost, mid-zip); its faster zips and cheaper ink are the owner's own movement and tank, so nothing new
crosses the wire. The Cheer Orb's lift isn't on the wire either: the owner moves its player up and holds it there, and
the position rides the actor tick (every screen's ghost shows it up there, legs hanging). A cheer is recorded by the
cheerer's owner (each player its own kid, the host its bots) as `['k', nid, 'cheer', [gain, nid …]]`: whether its own
gauge gains, and the users of the orbs it sent wisps to. Every other screen plays the "Yeah!" and flies the same wisps
(`KIT_GHOSTS.cheer`). The orb's charge is its user's owner's: that screen adds the cheer when its own copy of the wisp
reaches the orb, and the charge reaches everyone through the user's tick (`specialNetState`, as before); a ghost orb
only pulses. The gauge gain is the cheerer's own screen's (it owns its gauge). Tested by
`tools/botlab/tests/net-zipcheer.cjs` (`CLIENTS=2`: a guest cheers the host's orb, and the other way round).

**A special's stand-in** (batch 5, `[b5-int1]`). Another screen learns a player's special runs from two places: the
owner's tick flag (`F.special`) and the owner's start record (`[0, index]`). When the flag gets there first, or the record
is lost, `applyRemote` gives that player a stand-in `{ id, def, net: true }` (its special's own numbers, no ghost) until
the record starts the ghost over it, and drops it with the flag. Anything that reads a running special's numbers for a
remote player (the cue director's Mega Stamp / Kraken / Bubble Blower loops) finds them on the stand-in; the cue
director also falls back to `SPECIALS[id]` for a state without them. Tested by `tools/botlab/tests/net-late-special.cjs`
(`CLIENTS=2`: the guest's screen holds the host's start records back — 1.2 s, or for good).

**Assists (src/game/assists.js).** Judged where the splat is: on the victim's owner's screen, which applies every hit
on that player (its 'damage' events: the damage rule, ≤ 3 s before the splat) and judges every dodge of a Surf N' Turf
ring (the forced-jump rule, ≤ 3.5 s). `actor.splat()` asks the judge before it emits `'splatted'`; the forwarded event
carries the helpers' net ids as `as: "3,5"` (a string: the event packer drops arrays), and `NetMatch._remoteSplat`
credits them on every other screen. The host's final count (`{k:'res'}` `st` rows) carries each player's assists as a
seventh field, so every results screen shows the host's numbers.

**Super jumps and the Ink Jet / Zipline return marks (src/game/jumpMarks.js, src/ui/hud-jumps.js).** A super jump
is its owner's: the actor tick only says charge or flight (`F.sjCharge` / `F.sjFlight`), and the forwarded
`'superjump'` events carry the rest — the charge event its `target` (a teammate → `{n: nid}`, or a point: a beacon,
the base), `home` (an Ink Jet / Zipline jump back) and `instant`; the flight event its `from` / `to` / `dur` (the owner's
landing spot and flight time). `sjNetEvent` / `sjNetFill` (netmatch.js `_playEvent` / `applyRemote`) put those on the
remote player's `superJumpState` with its own clock (`t`, reset as the flags change phase), so every screen reads the
same jump: the "NAME is jumping to you!" alert on the target's own screen (a guest jumping to the host alerts the host),
the named landing tags and their countdown, the travel lines on both maps, the world reticle, and a jump to a remote
player who is itself mid-flight (`jumpAnchor`). A jump onto a teammate riding Tower Command's tower lands on the moving
deck: the owner's landing follows its tower, and every other screen's copy (with netmatch's landing ring) follows that
screen's tower from the offset at launch. An Ink Jet / Zipline user's take-off point is its ghost special's
`origin` (the ghost starts on the special's start record, on the same timeline as the positions, so it is where the
owner took off), and its countdown is the ghost's own clock: each screen's tags count down to the touchdown *it* will
show. A jump onto such a user lands at that point on the jumper's screen (`jumpAnchor`; the jumper owns its jump).
Nothing new on the wire beyond those event fields. Tested by `tools/botlab/tests/net-jump-ui.cjs` (`CLIENTS=2`; `NET_ARGS='scene=tower'`: the tower ride).

**Zone Control.** The host runs the rules; every decision (capture, control, penalty, rotation, overtime, the end
with its exact counts) and a count snapshot twice a second go on its event timeline as `['z', …]`, so they land in
step with the paint that caused them. Guests follow (zones.js `netEvent`): they only predict the count between
snapshots, and each client fills its own players' special gauges. A flip waits until the ink has stayed over its line for
`ZONES.flipHold` s (0.6): that wait runs on the host only, and the capture record goes out when the flip lands, so guests
apply it at once and never see a flip that was inked straight back.

**Stage modules** (src/game/stageMods.js, docs/STAGE-MODS.md: eras, pipes, lava). A module's state is a pure function
of the stage clock wherever it can be (nothing on the wire): the match clock every follower tracks, and in Practice the
host's stage clock on its ticks (`msg.c[2]`: the movers', else the pods', else the stage modules' clock). What can't be
(a host-run decision) goes as `['sm', key, data]` on the sender's timeline (`StageRun.rec` → the module's `netEvent`).
A splat near a module's change carries its painter's stage time as record field 15 (`opts.et` on replay: the eras' ink
guard and the lava's clip judge it at the painter's moment on every screen); the pads before it (pod 0, wave
`[0, 9999]`) read exactly as no tag. A module may flag a squidkid in the tick (`F.stage`, bit 22: the aquarium's pipe
ride) and draw a proxy itself (`carryRemote`, after the sample's flags and yaw). A late joiner of a Practice session
gets the modules' snapshot in its start config (`stage`) and restores it when its first host clock arrives (then
`seek(t, 'late')`); a host change tells the modules (`hostChanged`). Tested by `tools/botlab/tests/net-stagemods.cjs`.

**Tower Command.** Likewise: the host runs the rules and records control, checkpoints (reach / clear / refill),
overtime and the end as `['tw', …]`, plus a position snapshot 10× a second (tower.js `netEvent`). Guests ease the
tower onto the host's position (dead-reckoned between snapshots); each client carries its own players standing on it
and fills its own players' gauges. The start config carries `mode: 'tower'` and its fixed 5:00.

**Bazookarp** ([b5-karp], a wip mode: `config WIP_MODES`, rooms take it only with `?wipmodes`). The host runs the rules
(src/game/bazookarp.js) and talks to the wire only through a `KarpWire` (src/game/karpWire.js `NetWire`;
tools/botlab/jobs/batch5/bazookarp/SPEC.md §7):
- **host → all.** Discrete records sent **at once** as `{ k: 'bk', e }` (not on the timeline: a burst, a grant or a drop
  reaches a guest one trip after it happens), each with `q`, the host's sequence number: `['p', q, nid]` grant ·
  `['u', q, nid, x, y, z]` a grant undone · `['b', q, team, x, y, z, byNid, tb]` burst (`tb`, review round 3: its host
  wire time) · `['d', q, how, x, y, z]` dropped / moved · `['r', q, x, y, z, why]` reset flight · `['w', q, team, index]`
  plant · `['x', q, nid, x, y, z, own]` Carp Blast · `['t', q, losing, why]` overtime · `['e', q, winner, reason, c0, c1,
  b0, b1, otT]` end (`otT`, review round 3: the overtime played, to 0.01 s — the host keeps the same rounded number, and
  followers take it: their own overtime clock trails the host's by the playback delay, and the results round it up to
  whole seconds, so an overtime that ended just past a whole second read `OVERTIME +0:04` on the host and `+0:03` on a
  guest; net-karp `part=ottag`). Snapshots on the host's **timeline**
  as `['ks', …]` events: `'s'` 10× a second (phase, position, holder, meter, fuse, rate, counts, overtime, the window)
  and `'S'` once a second (plus best metres, reach times, weirs lowered, `touched`, the field state …). A follower applies
  a snapshot **at all** only when its `q` is at least the last discrete record's and nobody has won yet (`[karp-face]`
  review round 1: a snapshot the host took before a grant, a drop or the end plays after that record on the timeline —
  it used to keep its counts, fuse and overtime clock, which reset a new carrier's ring to the last carry's leftover and
  put a knockout's 0 back up). A snapshot's fuse and rate are read only when its holder is this screen's holder. The
  start config carries `mode: 'bazookarp'`, its fixed 5:00 and the hidden `karpCoin`.
- **guest → host.** `{ k: 'kc', nid, ts, fs, fr, fl, fo }` a pick-up claim (`fs`, `[karp-face]`: seconds after the
  Bazookarp went free on the guest's own screen that it touched it; `fr` / `fl` / `fo`, review round 3, only when `fr` >
  0: how much its player was already running in toward it at that moment, 0–1, how late that moment was after the burst
  on the host's clock as the guest reads it, and the guest's floor offset to the host — see the race below; re-sent every 0.3 s while touching; its kit locked until an answer, at most 1.5 s), `{ k: 'kx', nid, q }` a grant declined (its player died first), `{ k: 'kr', nid, rate, why,
  half, zone }` the carrier's own judgement of its fuse rate / half / free zone (on change, ≤ 1 per tick), `{ k: 'kf',
  nid, x, y, z, half, zone }` its last footing (≤ 5/s; a half or zone change at once), and **`kh`, a field on the guest's
  ordinary 20 Hz tick** (`msg.kh = [nid, dmg, …]`): its shell hits since the last tick, summed, already × 0.5 / capped
  (src/game/objTargets.js `takeHits`; the host's `karp.netHits`). Host → one guest: `{ k: 'kd', nid }` a refused claim.
- **who judges what.** The shooter's screen decides a hit on the shell, the host applies it; the burst's and the Carp
  Blast's splats are each victim's owner's (its own players in the radius, from the record's centre); a Carp Shot's
  blast is judged on each **victim's** screen when the shooter's kit record `[2, gid, x, y, z, c]` plays there (not
  through `applyHit`, which drops a remote attacker; the victim's owner records `[3, gid, dmg]` on the victim so the
  shooter gets its hit marker); the carrier's own screen judges its retreat, half, free zone and last footing (`kr` /
  `kf`); the host scores a remote carrier only from the real samples it sent (`NetWire.samples`, never its drawn
  position), through the continuity clamp; pick-ups are the host's, from claims checked against the claimant's newest
  sample. Carp Shots are the owner's kit records `['k', nid, 'karp', [0 | 1 | 2 | 3, gid, …]]` (`KIT_GHOSTS.karp`).
- **declines, refusals, the grant's samples.** A guest whose own player is dead when its grant (`p`) plays answers
  `kx` and takes nothing; the host restores its pre-grant state (`touched`, the last carrier, overtime and its window,
  the spot) and records `u`; a host-side death record for that player inside 1.5 s of the grant waits 0.4 s for the
  `kx` first, so a declined grant is never a carrier's loss (S39c). `kd` reaches the guest's engine (its claim lock
  ends). A remote carrier is scored only from samples after the one its claim was judged on (never its samples from
  before the pick-up). Remote claimants are measured where their newest sample is, or any sample they sent in the last
  0.4 s; the host's own actors where they are or where they touched it.
- **the race (`[karp-face]`, review round 1).** First-come on the host gave its own bots every near-even grab (a guest
  hears of the burst a trip late and its claim lands a trip later still: a host bot won 10 of 10 at equal distance).
  Now every claim carries `since` — how long after it went free **on the claimant's own screen** it touched it (`fs`;
  the host's actors' from the host's) — and once a claim is in, the host holds the grant open for claims in flight:
  `NetWire.rttTo` (its relay round trip plus the guest's lobby ping, plus that peer's playback delay: its tick spacing
  and jitter) plus a frame, for each guest that hasn't claimed but whose newest sample is within `pickR + claimNear`
  (6 m), at most `claimWait` (0.3 s); none near → at once (offline,
  lone grabs). Then the valid claim with the smallest `since` wins (a touch inside the 0.25 s hold counts as the hold's
  end), equal → the nearest (SPEC §7.3). When an S39b window's grace runs out with a grant still held open, it is
  decided then. A touch is timed where the positions are (the end of the last frame: the engine runs before the actors
  move), less the overshoot past `pickR` at the toucher's speed; a fresh free phase lets a guest claim at once (its
  re-send clock from its last claim used to hold it back up to 0.3 s). The host keeps its last 40 decisions in
  `karp.stats.grantLog`. Measured: net-karp `part=race` / `part=racekid` (a host bot / the host's own player against
  the guest, 16 rounds each). **The bias that is left (review round 2):** `since` starts at each screen's own "free"
  moment, which on a guest is one way after the host's. A racer who has to SEE the burst before it moves (standing at
  the shell: the common case) is timed fairly; a guest already running in when it bursts — and not held up by its own
  copy of the shell — keeps running through that one-way delay, so at equal real touch times its `since` is smaller by
  the one-way delay and it wins (`part=racerun`: both run in from 7 m, setting off at the same moment of the host's
  clock). Ordering by the host's clock instead would hand that delay to the host for every standing start. **Review
  round 3: the running start's credit.** On a guest, the moment it goes free, the engine reads its own player's last
  ~0.1 s of movement toward the Bazookarp (`_runIn`: positions, not `a.vel` — a swim or a test's mover moves it without
  one) as `fr`, 0 (standing, walking away or across) … 1 (at 0.8 × run speed or more), and how late that moment was
  after the burst on the host's clock as `fl`: `'b'` carries its host wire time `tb`, and `fl` = (the wire time of the
  frame the guest's `freeT0` belongs to — a `bk` lands between frames) − its floor offset to the host − `tb`. The floor
  offset (`peer.off`, receive − send at its fastest) is the two clocks' difference plus the fastest one-way trip, so `fl`
  leaves that trip out; the claim carries the guest's floor offset as `fo`, and the host adds back half of `fo` + its
  own floor offset to this guest (the two fastest one-way trips, both ways alike; 0–0.3 s). The host adds `fr × late`
  (−0.1 … 0.25 s; no `fl` — the free phase came from a `u` or a snapshot — its own one-way estimate `NetWire.oneWay`)
  to that claim's `since` (`grantLog` shows it as `cr`). A racer standing at the shell (`fr` 0) is timed from its own
  "free" as before; one already running in is timed from the host's burst, as the host's actors are. (The first cut
  read `fl` as `hostNow(host) − tb` at the record's arrival: hostNow adds the one-way estimate built from relay round
  trips, which carry each page's event-loop wait, and ran 10–100 ms high on a loaded machine — a running guest lost
  every dead heat. A guest's own stats keep `bLog` / `kcLog`, what it saw of each burst and sent in each claim, for the
  tests.) The numbers are in the karp-face report (`part=racerun` / `racefair`, with and without lag).
- **devices and subs at the shell (fix round 2).** No new record. Every screen grows its own copy of a re-forming
  shell from the `d` / `r` / `w` records and, every frame it grows and while it stands, crushes **its own** devices
  inside it (`G.deploy.crushIn({ sphere }, 'shell')`: a sprinkler, beacon, Drip Curtain, Lurk Mine, stuck Cling Charge,
  the Surf N' Turf buoy); the owner's existing end records — subs `[2, gid, 2]`, the buoy `[4, gid, 2]` — end the
  ghosts everywhere with the crunch, so a ghost is never crushed by a screen that doesn't own it. Thrown and walking
  subs glance off / stop on each screen's own copy of the standing shell (ghosts too: the owner's records still decide
  how each ends); the Whirl Boomerang's owner records where it stopped on the shell, `['k', nid, 'boomerang', [4, gid,
  x, y, z]]` (a ghost still flying out snaps there and hovers). Tested by `tools/botlab/tests/net-karp-crush.cjs`.
- **a remote carrier's samples (`[karp-face]`).** On the host, `_sample` hands the engine every buffered sample of the
  holder that has just played (`prevTr < t ≤ tr`, with its alive flag): `match.karp.onSamples(a, samples)`; the engine
  scores them in order (field reading, the continuity clamp, plant and Gate triggers) and never reads the drawn path.
  When the carrier changes hands (a guest's carrier adopted by the host as a bot) the clamp's baseline starts afresh.
- **the fuse and a remote carrier (`[karp-face]`).** The host burns the fuse at the carrier's newest `kr` rate. When it
  reaches 0 for a remote carrier, the host waits that peer's playback delay (`NetWire.holdFor`, at most 0.3 s) before it
  records `x`: a death record of the carrier that plays meanwhile wins (the splat / fall row of SPEC §2.6, no Carp Blast).
  The host's own carriers blow at once.
- **the carrier's HUD fuse (`[karp-face]`).** The carrier's own screen runs `hud.fuseShown` at the rate it judges itself;
  each snapshot gives `hostNow = s.fuse − s.rate × (wire.hostNow(sender) − s.t)`: shown > hostNow + 0.1 → it jumps to
  hostNow at once (less time); shown < hostNow − 0.1 → it gives time back by at most 0.2 s per second
  (`BAZOOKARP.fuseSync`). It never visibly rewinds under ×3 (net-karp lag 9b, netlag 150 + jitter 60). A snapshot's `t`
  is the host's **wire clock** (its tick clock, `performance.now`), and a follower reads the host's clock now as
  `now − peer.off + oneWay` (`NetWire.hostNow`: the sender's peer offset — the floor of receive − send — plus the one-way
  delay, half its own relay round trip plus half the host's lobby ping). Review round 1: the match clock it used before
  is only kept within 0.2 s on a guest and trails the host's by the one-way delay, so at ×3 the ring ran 0.4–0.6 s long
  under netlag 150. Other screens read a remote carrier's fuse forward the same way (≤ 0.6 s), from the grant on.
- **`S`, the full state (`[karp-face]`).** Besides the snapshot it carries best metres, reach times, weirs lowered,
  `touched`, `otLosing`, `phaseT`, the shell's hp, the field state, the resting node, overtime and — new, indices 29 … 35 —
  the last carrier `[team, how, left]` and the last plant `[team, left, window, inOvertime]` (a new host's S38 decision
  at time-up), the overtime window `[left, open, grace]`, the burst's credit (`lastHit` per team, nids), the remote
  carrier's own word `[half, zone, rate, why]` (its `kr`) and last footing `[x, y, z, half, zone]` (its `kf`), the reset
  flight's start. Followers also keep the last carrier / last plant from the discrete records themselves (`d`, `r`, `x`,
  `w`), so a new host has them even between two `S`.
- **host migration.** `netmatch.onLeave(id, hostChanged)` now runs in this order on every client (`[karp-face]`, SPEC
  §7.6): 1. **the narrowed flush** — only the departed host's queued *rule* records (`'tw'` Tower Command, `'z'` Zone
  Control, `'ks'` Bazookarp snapshots) play at once, in order, and leave its queue (every client received the same stream
  before the leave notice: the relay keeps order); everything else (paint, kit ghost records — a Carp Shot in the air —
  special ghosts, forwarded events) stays queued and plays out on that peer's clock as before (the departed peer stays in
  `peers`). This also fixes, for Tower Command and Zone Control, screens disagreeing about a control or checkpoint record
  in the old host's last 100–300 ms (net-tower / the zones net test re-run); 2. the new host sets `match.follower = false`
  **before** the leaver's squidkids are removed or adopted, so its rules engines handle them (a removed carrier on a
  humans-only stage → `left` at once); 3. remove / adopt; 4. `match.karp.onHostChange(isHost)`: the new host's records
  carry on above the last `q` it applied (`_rec` itself takes `max(q, lastQ) + 1`, so even a record made during step 3
  is never dropped by the other guests), shell hits it had batched for the old host count, a holder that is gone or dead
  is lost as `left` at its last real sample (its half / zone from the last `S`'s `kr`), an adopted carrier keeps carrying
  with its own screen's judgement read afresh, the clamp resets, the timers (re-form, reset flight, the hold, the window,
  the fuse) carry on from the last `S` plus the records since, and a full `S` goes out at once. (Review round 2: a
  follower holds its last snapshot's fuse, overtime clock and window RAW — it reads a remote carrier's fuse forward each
  frame, and the narrowed flush has just played the newest raw — so the new host reads them forward to now on the old
  host's clock, `wire.hostNow(oldHost) − t`, at most 0.6 s; a carrier on the new host's own screen never gets back time
  its ring has shown spent: `min(read forward, fuseShown)`. They used to step UP by the snapshot's age × the rate: +0.34 s
  under netlag 100, a carrier who became the host rewound its own ring 0.2 s. `karp.stats.takeover` logs what it took;
  net-karp-host `part=bots` and `part=ring;who=1|2`.) A carrying guest re-sends
  `kr` / `kf` to the new host; claimants re-send their claims every 0.3 s.
- **the `'k'` case and adopted actors (`[karp-face]`).** A `karp` kit record is played even when its actor is now local,
  as long as its sender is not this client (a departed host's queued Carp Shot for a bot this client just adopted), so
  the blast still judges this screen's own players. An adopted actor's shots in the air (`KarpGun.adopt`, from
  `netmatch._adopt`) — and a launch record that plays for it after the adoption — are the new owner's: its screen flies
  them on with collisions, lands them, swells them and blows them, and records `[1]` / `[2]` under the same `gid`, which
  the other screens' ghosts (launched from the old owner's `[0]`) take. So an old-host bot's Big Burst fired 0.1 s before
  the host leaves still swells 0.45 s and splats on every screen (net-karp-host `part=shot`). **Review round 3:**
  `KarpGun.adopt(a, queued)` gets the departed peer's queue (netmatch passes `peers.get(id).events`): a shot whose `[2]`
  is still queued there is NOT taken — its queued `[1]` / `[2]` land and blow it on the adopter as on every other screen
  (the adopter blowing it too, when its swell ended before the queued `[2]` played, put a second `[2]` on the wire and the
  third screens judged the blast twice: 1 leave round in 5); one whose `[1]` is queued but not its `[2]` waits for that
  landing and is then the adopter's to blow; only a shot with neither queued is flown on from where it is. Every screen
  judges a gid at most once (`blown`). A Carp Shot's gid is its shooter's own count, `nid × 1e5 + n` (`a._kseq`), which
  every screen learns from the launches it plays and an adopter carries on past every launch it has seen or that is
  queued (+8): netmatch's per-client `netId` count restarted on a new host, whose first shots for an adopted bot reused
  the old host's gids (a launch whose gid a screen still held for its 2 s was dropped there). net-karp-host `part=dbl`
  (3 clients; the old host's queued `[2]` held back 0.25 s on the others: the race every time).
- **a carrier who disconnects.** On a stage with bots the host adopts the squidkid (`_adopt`): `a.carry` stays, the
  bot's brain carries on, the fuse keeps burning at the host's own judgement (mark unset, read afresh). On a humans-only
  stage the squidkid is removed: a splat at its last real sample (`left`).
- **late join (`[karp-face]`).** A Bazookarp match locks the room like every match (`tr.lock(!practice)`): a player who
  drops and asks back in mid-match is turned away (`Match in progress`) and can join again once the room is back in the
  lobby. The 1 Hz `S` is what a new host rebuilds from, and would be what a late joiner needs if that ever changes.
- **results (`[b5-karp]`).** The end record `e` carries the exact counts and best metres; the results message's
  per-player `st` rows add `karpM` (metres of progress gained carrying) and `karpPops` (shells burst) at indices 7 and 8,
  so every screen's results table (CARRIED, POPS) and its XP (`PROGRESSION.bazookarp`) read the host's numbers.
- **the lobby (`[karp-face]`, DECISIONS #10).** In this mode a room's stage list (`roomStages('bazookarp')`, the host's
  `setSettings`, Random's pool; the offline stand-in alike) holds only the stages with a Bazookarp layout
  (`src/world/karpStages.js`); with `?wipstages` every stage is offered and the lobby's stage card tags the ones still on
  placeholder data PREVIEW. A room switched to Bazookarp on a stage without one moves to the first that has one.
- Tested by `NET=tools/botlab/tests/net-karp.cjs` (`CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes'`, through
  `tools/botlab/netpage.cjs`): the base part (21 checks: the host's view of a guest carrier, a guest's own message rate
  while it fires at the shell, ghost landings, the victim-judged blast and `[3]`, `kr`, `kd`, `kx` inside an S39
  overtime, the same result), `NET_ARGS='part=snap'` (late snapshots after a grant and after the end: a new carrier's
  ring and another screen's view of its fuse start at 60 after a carry that left 7 s or a Carp Blast's 0; a knockout's
  counts stay put on the guest), `NET_ARGS='part=face'` (SPEC
  §10.2 steps 2–11 and 16: the burst on its victims' screens, races, a swim-through grant, the grab share, the carrier's
  rules on its own screen, the thin-wall stall with frozen ticks, the step-out, the guest's gauge and sting, a two-weir
  plant, the fuse on the own half) and `NET_ARGS='part=lag' URLQ='netlag=150&netjitter=60'` (hits, a grab, retreat, the
  fuse ring under ×3, a declined grant, the window's close); and `tools/botlab/tests/net-karp-host.cjs` (`CLIENTS=3`:
  `part=bots` the host leaves mid-carry, `part=plant` a plant in the old host's last 0.1 s, `part=shot` a Big Burst in the
  air at the migration, `part=dbl` a Big Burst that blew as its host left, judged once everywhere; `CLIENTS=2`: `part=cargo` a humans-only room, `part=guestleave` a carrying guest disconnects);
  and the package's whole-match proof, `tools/botlab/tests/net-karp-full.cjs` (`CLIENTS=3`, nothing staged: three
  autopilot clients and bots play a real 5:00 match on halyard, the host leaves mid-match, a guest takes over, the old
  host is turned away mid-match, the match plays to its end with the same result and results table on both remaining
  screens, back to the lobby, the old host joins again). The narrowed flush's regression for the other modes:
  `tools/botlab/tests/net-tower.cjs` and `net-zones.cjs` (`CLIENTS=3`: the host flips control and leaves 60 ms later; both
  remaining screens agree on the owner, the new host runs the rules, the same result).

**Relay (server/).** One Durable Object per room code: membership, host election, join refusal (unknown / full /
match running) and blind fan-out of `b|` / `s|to|` payloads. Clients send `"ping"` every 2 s, answered by the runtime
without waking the room; a sweep drops sockets silent for 10 s during a match (150 s in the lobby).

**Testing without wrangler.** `tools/botlab/relay.cjs` is the relay's protocol on plain Node `http` (the WebSocket
handshake and framing by hand: welcome / join / leave / err, `b|` / `s|`, lock, `ping` → `pong`, MSG_MAX, the rate limit,
the liveness sweep — and the desktop app's own origin, app://inkwave). `tools/botlab/netpage.cjs` runs several
game clients as offscreen windows of one Electron instance (each its own session / profile) against it, driven by a test
script: `CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-practice.cjs tools/botlab/run.sh
tools/botlab/netpage.cjs` (Practice end to end: settings, start, loadouts, the wave, swaps, a late joiner, a guest
leaving, host migration, the end), `…/net-turf.cjs` (a match with a bot count through results back to the lobby),
`…/net-mock.cjs` with `CLIENTS=1 Q0='netmock=1&mockauto=0'` (the offline stand-in), `CLIENTS=1 APP_CSP=1 …/net-server.cjs`
(ONLINE › SERVER: the app on a friend's `selfhost.cjs` with the app's own CSP, a browser client from that server, the
refusals, Practice). Nothing touches the deployed relay: netpage refuses it (and any tunnel) in every client's session.

`node tools/net-test.mjs` (game on :8490, `cd server && npx wrangler dev --port 8787`) plays real headless
clients against the local relay and reports consistency (clock, coverage, rosters, results) and what is drawn:
per-frame "kink" and path error of every remote squidkid against its owner's own frames.
`--clients 3 --leave host --drop kill|freeze` tests migration, `--full` plays through results back to the lobby,
`--net "netlag=40&netjitter=30&netspike=0.01"` simulates a real connection, `WORST=8` explains the worst frames.

## Showcase lobby set (src/game/showcase.js)

Both online screens are staged in the **lobby set** (`src/game/lobbySet.js`, a back alley at blue hour after rain; its own
scene and lights), which the showcase draws full-frame. `showcase.fullFrame` is true while the set covers the whole
screen: main.js then skips drawing and simulating the world (the showcase clears the canvas and draws the frame itself).
It is false during the set's ~0.45 s cross-dissolves (to / from the world, the loadout / locker pedestal, the results
podium), which need the live world underneath. The set is built lazily on the first `showHub` / `showLobby`, parked
(not drawn) through locker trips and whole matches, and released ~1.5 s after the online screens are left for good.

`showcase.showHub(style, color, weapon)` — your squidkid on the set's hub spot, framed right of the create / join cards
(it bursts out of an ink puddle when the alley first comes up; look / weapon changes get the pedestal's reactions).
`showcase.showLobby(players, colors, { reduced })` — the room: the set's camera glides from the hub framing to the
line-up while you duck into the ink and burst out of a puddle on your mark (front centre); whoever is already in the
room surfaces on their marks right after you. `showcase.updateLobby(players, colors)` diffs the list:
- **join** → the squidkid swims in from the alley mouth along `set.lanes(mark)` (a low, fast squid swim laying a wet
  ink trail in its team colour; rivals hop up the dock stairs), leaps out as a kid, splashes down on its mark and turns
  to camera; several joins are spaced out; paths steer round kids already standing;
- **leave** → it turns, dives into its own ink and swims out along `set.exitPath(mark)`;
- **team change** → swims from its old mark to the new one (out along its exit path, in along the new lane); when *you*
  change teams everyone ducks through the ink and resurfaces on the other side;
- weapon / look swaps and ready / unready get a reaction on the spot (queued until landing for a kid still arriving).

`showcase.lobbyEmote(id, name)`, `lobbyGetSet()` (countdown: everyone squares up, the camera leans in),
`lobbyLaunch()` → seconds (everyone super-jumps out, front centre first), `lobbyAnchor(id, out)` → screen point above
a player's head for the DOM nameplate — it follows the squid while it swims in (`out.vis` 0 while hidden or when the
point would sit under a UI panel), `lobbySlotAnchor(row, i, out)` (unclaimed marks → "OPEN" / "BOT" plates),
`leaveLobby()` (the others duck away; your kid stays and heads back to the hub spot on `showHub`). Coming back to the
room (locker, a match) finds everyone already standing on their marks: arrivals never replay. `opts.quick` is still
accepted and no longer needed. Audits: `showcase.debugCam = { pos, target, fov }` overrides the set camera.
