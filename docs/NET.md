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
extrapolates ballistically for at most 180 ms, then holds. A teleport counter (`netTp`, bumped on respawn) makes
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
The built-in subs (subs.js) add an update record `[3, gid, …]` from the owner: a Lurk Mine tripped (it pops up on every
screen — it's invisible to the other team until then, on theirs too), a Skitter Bomb stopping to wind up (ghost Skitters
never trigger themselves), a Hop Beacon's jumps left, a Drip Curtain's ink after hits (its decay runs everywhere); a
super jump onto a remote player's beacon goes to its owner through the same device-hit channel (`beaconUse`). The
Waddle's windup is its `[5, gid, x, y, z]`.
A kit's pose state (a Mitts leap, a held Brolly canopy) rides the actor tick (`netState` / `netApply`).
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
onto what's below (a wall one breaks). The
owner's word settles where it is whenever it settles somewhere: the subs record `[4, gid, x, y, z, tag, lx, ly, lz, nx,
ny, nz]` — on the moving block `tag` (its Level tag: `tower`, `tower-pillar`, `mover:<car>`, `plant:<pod>:<part>`; `#<id>`
for an untagged one) at `l` in its axes, on the face whose normal is `n` (its axes) — or `[4, gid, x, y, z]` (on still
ground again, after a drop or once a shove has settled: 0.2 s). A ghost snaps to it (one still in the air keeps it until
it lands). A mine is tripped by its owner's screen wherever the block has taken it (the `[3, gid]` / `[2, gid]` records,
as before). Old clients ignore `[4, …]` (no sub kind at `d[2]`). Tested by `tools/botlab/tests/net-deploy.cjs`
(`CLIENTS=2`; `NET_ARGS='scene=tower'`: the deck, the crush, the mine on the deck) and `tests/deployables.js`.

**What outlives its owner** (batch 5, `[b5-sprules]`). A remote splat (`NetMatch._remoteSplat`) emits `'splatted'` with
`remote: true` on every other screen, after the owner's own records that went before it (a special's end `[1, 'splat']`
is recorded inside `actor.splat()`, ahead of the forwarded event). The Whirl Boomerang's ghost no longer fizzles on it:
like the owner's copy it notes where its thrower went down (`it.home`, from that screen's copy of the thrower) and whirls
back there; the owner's burst record `[1, gid, x, y, z, big]` still says where and when it goes off. A Drainbow whose
owner is splatted is orphaned by the end record (`popOnOwnerSplat: false`) and runs out its life on its own clock on
every screen (pop 'time', not the 3 s 'lost' fallback). The Ink Tempest's cloud and the Surf N' Turf buoy never
depended on their thrower (their own records). The gauge a splat leaves (half of what was left of a running special,
`specials.js splatShare`) is the victim's own screen's, synced as usual (`sp` in the actor tick).

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

**Assists (src/game/assists.js).** Judged where the splat is: on the victim's owner's screen, which applies every hit
on that player (its 'damage' events: the damage rule, ≤ 3 s before the splat) and judges every dodge of a Surf N' Turf
ring (the forced-jump rule, ≤ 3.5 s). `actor.splat()` asks the judge before it emits `'splatted'`; the forwarded event
carries the helpers' net ids as `as: "3,5"` (a string: the event packer drops arrays), and `NetMatch._remoteSplat`
credits them on every other screen. The host's final count (`{k:'res'}` `st` rows) carries each player's assists as a
seventh field, so every results screen shows the host's numbers.

**Zone Control.** The host runs the rules; every decision (capture, control, penalty, rotation, overtime, the end
with its exact counts) and a count snapshot twice a second go on its event timeline as `['z', …]`, so they land in
step with the paint that caused them. Guests follow (zones.js `netEvent`): they only predict the count between
snapshots, and each client fills its own players' special gauges. A flip waits until the ink has stayed over its line for
`ZONES.flipHold` s (0.6): that wait runs on the host only, and the capture record goes out when the flip lands, so guests
apply it at once and never see a flip that was inked straight back.

**Tower Command.** Likewise: the host runs the rules and records control, checkpoints (reach / clear / refill),
overtime and the end as `['tw', …]`, plus a position snapshot 10× a second (tower.js `netEvent`). Guests ease the
tower onto the host's position (dead-reckoned between snapshots); each client carries its own players standing on it
and fills its own players' gauges. The start config carries `mode: 'tower'` and its fixed 5:00.

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
