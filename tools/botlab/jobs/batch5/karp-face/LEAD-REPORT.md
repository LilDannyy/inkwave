# Bazookarp WP2 (online and the finished face, key `karp-face`) — lead report

Worktree `/Users/danielosling/Desktop/1/st-b5-karp-face`, branch `b5-karp-face`, base `b5-int3` b55f7472. Nothing pushed.
The mode stays hidden behind `WIP_MODES` (`?wipmodes` / harness `WIPMODES=1`); its switch is untouched.

**Takeover.** The first builder was cut off after six commits (2ea9983e … ab84134b: the netcode, the face, docs/NET.md,
the §10.2 tests) and two untracked tests (net-tower.cjs / net-zones.cjs). I read all of it and kept it: it was sound. My own
changes are marked **[mine]**, and **[takeover]** marks a piece of the package the first builder had not started; every
result below was re-run on this head (nothing below is the first builder's claim). No pictures and no report existed.

**Done means: proven.** `net-karp-full.cjs` (new): three real clients (autopilot kids) plus five bots play a real 5:00
match on halyard; host A leaves mid-carry at 45 s; a guest takes over, the other follows; A is turned away mid-match
("Match in progress"); the match plays to its end (overtime, `stopped`) with the same result and the same results table
(names, CARRIED, POPS, splats, deaths) on both remaining screens; both go back to the lobby and A joins again. 11/11, no
page errors, no relay kicks. Events on the screens: 21 bursts, 21 pick-ups, 20 drops, 1 plant, 1 Gate, overtime, end.

## 1. What was built, against SPEC §11 WP2 and the WP1 report's "Left for WP2"

### Netcode (SPEC §7) — `NetWire` (src/game/karpWire.js) + the engine's net surface (src/game/bazookarp.js)
| item | where / how | proof |
|---|---|---|
| discrete records with `q`, sent at once (`bk`) | WP1's, kept; `_rec` now takes `max(q, lastQ) + 1`, so a new host's first record (even one made while its leave handling still runs) is never at or below what the other guests applied | host-bots 6/6, host-plant 4/4 |
| snapshots `s` 10 Hz / `S` 1 Hz on the timeline (`ks`); late snapshots skipped by `q` | WP1's; **[mine]** stamped with the **match clock** (time played + overtime, which netmatch keeps in step on every screen) instead of the engine's own clock — that starts when each screen built its match, seconds apart, and the HUD fuse rule read a snapshot's age off it | hud-karp D, lag 9b 8/8 |
| claims with `ts`, the 0.25 s hold, the newest-sample check, `kd` | WP1's, re-proven | face 3 / 4 / 5, lag 3 |
| `kx` / `u` (a declined grant) | WP1's | lag 15b |
| the window's grace (claims stamped before an S39b close) | WP1's; **[mine]** test 15c now really delivers the claim to the engine 0.3 s *after* the close (it used to arrive before it) | lag 15c |
| `kh` on the 20 Hz tick | WP1's | base 1 / lag 1 (relay peak per socket 26–44 msgs/s, the host's included; no rate kicks) |
| `kr` / `kf` | WP1's; re-sent to a new host | lag 9 |
| `onSamples` from `_sample` (real samples only, never the drawn path) | first builder (netmatch `_sample` → `karp.onSamples`; queue scored in order by `_carried`) | face 6c / 6d (thin-wall stall, 0 clamps) |
| Carp Shot blasts judged on each victim's screen, `[3]` hit marker | WP1's; **[mine]** a ghost launch `[0]` now emits `karp:shot` on every screen — other players' Carp Shots made no launch sound (the whomp) anywhere but on the shooter's screen | net-karp 5c / **5d**, face 7 / 7b |
| the fuse hold before a remote carrier's Carp Blast (`NetWire.holdFor` ≤ 0.3 s; a death record that plays meanwhile wins) | first builder | face 11, lag 9b |
| the fuse display rule on the carrier's screen (jumps forward at once, gives back ≤ 0.2 s/s) | WP1's rule, **[mine]** on the match clock | hud-karp D1/D2, lag 9b: worst rise 0, 0 at the blast |
| a remote carrier's fuse on followers | **[mine]** read forward from the newest snapshot by the match clock (≤ 0.6 s): the marker, the Carp Line and the pause strip no longer lag a playback delay (net-karp-host bots failed "fuse within 0.5 s" at 0.7 s before this) | host-bots 6/6 |
| `onLeave`'s order with the narrowed flush of `'tw'` / `'z'` / `'ks'` | first builder (netmatch.js onLeave) | net-tower 5/5, net-zones 5/5, host-plant |
| the `'k'` case for adopted actors' queued Carp Shots; `KarpGun.adopt` | first builder | host-shot 3/3 |
| `lastCarrier` / `lastPlant` (and the window, lastHit, the carrier's kr/kf, the reset start) in `S` | first builder (`S` indices 29 … 35) | host-plant 13b |
| `onHostChange`, disconnects (bots adopt / humans-only drop) | WP1 + first builder | host-bots, host-cargo 4/4, host-guestleave 2/2 |
| results packing `karpM` / `karpPops` | WP1's | face 16, lag 16, full 5 / 5c |
| latency steps (`netlag=150&netjitter=60`) | first builder's part=lag | lag 8/8 (three runs) |
| late join | matches lock the room: a returning player is turned away mid-match and joins once the room is back in the lobby | full 4 / 6 |

### The finished HUD (§6.1–6.5, src/ui/hud-karp.js) — first builder's, kept; mine marked
The count badges and the Carp Line (weirs as diamonds at their counts, grey once lowered; best notches; padlocks / open
Gates; the carp marker by the field wearing the fuse; overtime's gold frame and draining window); the status pill; the
over-head marker with its edge pin (hidden from the enemy while the carrier swims); the reticle's fuse and charge rings
for the carrier; DON'T RETREAT! / CARP-FREE ZONE! the same frame; the shell's meter tag; weir / Gate tags; the squad
badge; the carp on the special orb; prompts; call-outs replacing each other; "Can't use" notes; the minimap and TAB map
layer. **[mine]**: the status pill says `SHELL · 66% OURS / THEIRS` (the pause strip's and the tag's words); the meter tag
never rides up into the top bar (a raised Pond put it over the Carp Line); the Carp Line's carp holds still while an
enemy carrier swims hidden (it was a position leak against S31); on the TAB map the carrier's jump bubble wears the carp
(the bubble covered the map's carp icon) and the weirs / Gates / halfway dots are 1.3× bigger. **[takeover]** hud-lead
mode `karp` (§5.4 / §6.1) **did not exist**: built — the leader is `winning()` (lower count, equal counts by who got
there first, nobody at 100 / 100 so the coin stays hidden); the trailing team shrinks while the leader carries on its
half, held as it was while that carrier is hidden from the viewer's team.

### Menus (§6.6, DECISIONS #10) — first builder's, kept; mine marked
Rules cards with art, the two notes, tips, the pause strip (both counts, `<TEAM> CARRYING · n s`, SHELL / FREE / BACK TO
THE POND, weir pips), results (CARRY IT HOME, CARRIED / POPS, XP from `PROGRESSION.bazookarp`), the lobby icon, the
stage filter. **[mine]**: the mode screen with five cards overflowed (the four-card row is 114 % of the width with a
fifth card): an `is-five` row, Bazookarp's koi-coral card with the carp as its hero, smaller chips / titles so they stay
in the card at 960×600; the online lobby's stage card tags a placeholder stage PREVIEW under `?wipstages` (only the stage
select did); the offline stand-in's rooms keep session.js's stage filter; the rules texts as short as Tower Command's and
the cards a touch more compact, with four mode tabs; the results header's CARRIED / POPS no longer run together.

### Looks (§6.7) and the model — first builder's, kept; mine marked
The iridescent Roe Shell with the leading ink swirling in, cracks, the warning flash; the resting carp; weirs' curtains
and carp caps that drain and sink; the Dragon Gate's arch and light column; hatched free zones and NO CARP boards; the
carrierBlock shimmer; the wake glow; shot swell rings, blasts and the Big Burst's water-spout; the reset comet; the arc
preview. `sp_karp` (karpModel.js): a koi with kohaku patches in team ink, six fishing floats down its back, coral lips
round the muzzle that glows with the charge, barbels, a flapping tail, on the Zooka pose. **[mine]**: the weir caps sit on
their posts (they floated: the engine's weir floor is the sill's top, the kit's posts start under it); the carp's eyes a
third bigger (they read as its face at play distance).

### Sound (§6.8) — first builder's 17 cues and their director (src/audio/sfx-karp.js), kept; **[mine]** `karp_hiss`
The last 3 s of any carrier's fuse hiss on the carrier: positional for its teammates (SPEC §6.7's "warning to step
away" had a look but no sound), 2D for the carrier.

## 2. Decisions where the request left a gap
- Snapshot time base = the match clock (SPEC §7.2 says "its own match clock (synced …)"; the code used the engine clock).
- A follower reads a remote carrier's fuse forward at most 0.6 s past its newest snapshot.
- The over-head marker is not drawn over your own head; your fuse rides your reticle (first builder; SPEC §6.2 lists the
  reticle ring for the carrier). WP1's rules test L3 still expected the old placeholder (a marker over your own head,
  "WE CARRY"): updated to the finished face, as was L5 ("the carp" = the resting one or the held `sp_karp`).
- The Carp Line's carp freezes while an enemy carrier is hidden (S31's spirit; SPEC §6.1 is silent).
- The hiss is heard by everyone near (teammates are the point; enemies hearing a carrier's last 3 s is fair warning too).

## 3. Online, and bots
Records added by WP2: none on the wire beyond SPEC §7 (`S` gained indices 29 … 35, first builder). Who judges what is
SPEC §7.1 unchanged. Bots: no bot code touched (WP3's). **For the lead — the grab race is biased toward the host's own
actors:** SPEC §7.3 grants "the nearest of the valid claims", judging a remote claimant at its newest sample, which is a
tick plus a trip old; a host bot is judged where it is now and starts running one trip earlier. face step 5 (a host bot
and guest B, each 3 m from the burst, 10 bursts): bot 9 / guest 1 and bot 8 / guest 2 in the two clean runs (2 / 4 / 4
none in a run broken by load). The 0.25 s hold doesn't help at 3 m (it ends before either arrives). A fix would compare
claims at a common time (backdate the host's actors by the claimant's age, or order by `ts + off` inside a short
window): a rules change, so not made. TELL THE USER if they race the host's bots often.

## 4. Tests (all local, this Mac; load average 80–640 throughout; the Mac mini was unavailable per my instructions)
Every result is from this head's code for what it exercises: the last changes (menus / CSS only) were followed by fresh
karp-menus (12/12 both ways) and hud-karp (27/27) runs. Net tests with `Q0..Q2='autopilot&wipmodes'`.
| test | result | notes |
|---|---|---|
| `net-karp-full.cjs` (CLIENTS=3, real 5:00 match, host leaves mid-carry) | **11/11** | done-means; WATCHDOG=2400000 (a 5:00 match with three rendering clients runs slower than the wall under load) |
| `net-karp.cjs` base (WP1's 19 + 5d) | **20/20** | 5d new: A hears B's launches |
| `net-karp.cjs part=face` (§10.2 2–11, 16) | **16/16** | earlier runs on this load flaked 14/16, 14/16, 15/16 on wall-clock timing in the test (runs, swims, charges, A judged before B's [2] reached it, a count read mid-move): all moved to the sim clock / settled reads; none was a code fault |
| `net-karp.cjs part=lag` (netlag 150 + jitter 60) | **8/8** ×3 | last run after the match-clock change; 9b: worst rise 0, 0 s at the blast; 15c: claim reaches the engine 0.3 s after the close, granted |
| `net-karp-host` bots / plant / shot / cargo / guestleave | **6/6, 4/4, 3/3, 4/4, 2/2** | bots was 5/6 (other guest's fuse 0.7 s off) before the follower fuse fix |
| `net-tower.cjs` / `net-zones.cjs` (CLIENTS=3) | **5/5** / **5/5** | net-zones was 3/5 with the first builder's test (forced Zone Control's owner without ink, the host's sampling undid it); one net-tower run timed out starting the match at load ≈ 600 and passed on re-run |
| `net-practice.cjs` / `net-turf.cjs` (onLeave's change elsewhere) | **29/29** / **9/9** | |
| `hud-karp.js` | **27/27** | C2 fixed (testbox's raised spawn deck); D on the match clock; G3 the hiss |
| `hud-lead.js` MODE=bazookarp / turf / zones / tower | **13/13** / 22/22 / 14/14 / 12/12 | Bazookarp section new |
| `karp-menus.js` (new) | **12/12** `?wipmodes`, **12/12** + `?wipstages`, **4/4** hidden | |
| `sfx-cues.js` (alone) | **58/58** | |
| `bazookarp-rules.js` | 115/117 → L **14/14** | L3 / L5 checked WP1's placeholder face; updated to the finished one (§2) |
| `karp-loop` / `karp-two` / `karp-gun` / `karp-shell-dps` / `int3` | **6/6, 6/6, 12/12, 36/36, 10/10** | |
| `loadout-picker` / `wip-stages` (± `?wipstages`) / `net-lobbykit` | **23/23** / **22/22, 22/22** / **16/16** | |

Measured: grab share (face 5, host bot vs guest at 3 m, 10 bursts) bot 9 / guest 1, bot 8 / guest 2. Relay peak 26–44
msgs/s per socket, no rate kicks, no drops. Bot matches / balance: none (no number, rule or bot changed; balance sets are
the lead's consolidated pass).

**Pictures** (`tools/botlab/jobs/batch5/karp-face/out/`, 80 JPEGs, all < 300 KB, looked at): `1080-halyard-day-hud-*`
(start, shell, burst, free, carry, retreat, zone, foe, foe-pin, ally, weir, gate, ot, fuse-low) and the same 14 as
`600-halyard-day-hud-*` (960×600); `*-map-tab`, `*-map-mini`; `*-menu-mode / rules / pause / results / setup / lobby` at
both sizes; `1080-wipstages-halyard-day-menu-setup / lobby` (PREVIEW); looks `1080-halyard-day-look-*` (shell-3m,
resting, weir-standing, weir-down, gate-sealed, gate-open, carrier-front, carrier-side, shot-flight, shot-swell,
shot-blast, wake); `1080-halyard-sunset-*` (12: HUD, TAB map and the looks); `1080-lockgate-day-*` (resting, shell-3m,
carrier-side, hud-shell, hud-zone); `1080-karpbox-day-look-carrierblock`. Scenes: `tools/botlab/scenes/karp-face.js`.

## 5. Commits and the shared files touched
Code (oldest first): 2ea9983e online · 7b6a20be face · 248e31e6 model/looks fix · 1fa78a18 tests · e9a0e0bc NET.md ·
ab84134b test (first builder); bb7c0403 hud-karp C2 · 50dbba58 net-karp-full · 7d02101f net-karp steps on the sim clock
· 942a1e7b menus + karp-menus · 549f1051 hud-lead · a8aff64a docs · 686d9c4f online fixes · b556e043 face from the
pictures · 9f6a1b3d tests (net-tower / zones, rules L, face 6c) · 175362b6 menus nudge. Scratch: d6ba9e3c, b4e3d517,
83c84c29 (pictures), and this report.

Shared files (all hook-ins tagged `[karp-face]`):
- `src/net/netmatch.js`: `_sample` hands a remote holder's played samples to `karp.onSamples`; the `'k'` case plays a
  `karp` record from a non-owner sender for a now-local actor; `onLeave`'s order (narrowed flush of `'tw'` / `'z'` /
  `'ks'`, follower off before remove / adopt); `_adopt` calls `G.karpGun.adopt`.
- `src/net/session.js` / `src/net/mock.js`: the Bazookarp stage filter (`roomStages`, `setSettings`).
- `src/ui/menus.js`: rules cards / notes / tips, `BATTLE_MODES`, the stage select's filter and PREVIEW, the lobby's stage
  list and PREVIEW, the lobby's mode icon, the pause strip, results (CARRY IT HOME, CARRIED / POPS), the five-card row,
  How to Play's four tabs. `styles/ui.css`: one appended block (+ two pill positions).
- `src/ui/hud-lead.js`: mode `karp`. `src/game/minimap.js`: `drawKarpMap` under / over. `src/main.js`: the results route
  (one line). `src/game/character.js` (`ANIM_OF.sp_karp`), `src/game/character-weapons.js` (`GEO_KIT` exports
  `pistolGrip`, `GRIP_PISTOL`). `tools/botlab/hud-shots.cjs` (`URLQ`).
- Own modules: `bazookarp.js`, `karpWire.js`, `karpGun.js`, `karpShell.js`, `karpModel.js` (new), `bazookarpFx.js`,
  `hud-karp.js`, `src/audio/sfx-karp.js` (new), `src/world/karpStages.js` (new). Docs: `docs/NET.md`,
  `tools/botlab/README.md`.

## 6. Unfinished, flaky, uncertain
- **Grab races favour the host's actors** (§3): measured, reported, not changed (a rules change for the lead).
- **Halyard's Pond** (WP4b's layout, not this package): the Roe Shell on the ferry's cabin roof encloses the funnel and
  the wheelhouse railing box, and the resting carp sits half inside the funnel (`1080-halyard-day-look-resting`,
  `-shell-3m`); the data's comment says the wheelhouse is cleared for this mode — it is not in this build. Lockgate's
  Pond reads well (`1080-lockgate-day-look-resting`).
- **The kit and the engine disagree on a weir's floor** for three-element `at` (`[x, y, z]`): `bazookarp-kit.js` puts the
  posts at `y` itself, the engine finds the floor at `y + 0.5` down (the sill's top, 0.12 on halyard), which is what the
  LAYOUT format says. The looks now read the post tops; the kit is WP0 / WP4a's to fix.
- **960×600 How to Play**: the four Bazookarp cards fit, the overtime note is partly below the window. Everything else
  fits at 960×600 (pictures).
- Halyard's sunset is the stage's own dusk look and is close to its day.
- The hiss and the other cues are proven by events and handles (the runs are muted); nobody has listened to `karp_hiss`.
- Not run: `net-karp-crush`, `audio-pause`, `stage-audit` / `size-budget`, `tower-rules` / `tower-ink` / the zones page
  tests (their code is untouched: the shared changes are netmatch's — covered by net-practice / turf / tower / zones /
  the karp net tests — and menus / hud-lead, covered above).
- `tools/botlab/jobs/batch5/COMMON.md` in this worktree was edited by someone else mid-run (it now says the Mac mini is
  back). My instructions said it was unavailable and to push nothing, so I ran everything here and left that edit
  uncommitted for its author.
- No bot matches: no balance-affecting change; WP3 owns the bots (the full match's play — 21 pops, 1 plant, most carries
  short — is the minimal bots'). The machine's load (80–640) made every run slow; flakes found were test timing, fixed
  and re-run, except the one net-tower start time-out noted above.
