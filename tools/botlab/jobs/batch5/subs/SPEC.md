# Batch 5: the four new sub weapons (design spec)

This is the document the wave-2 sub builders build from. It is paper design only: no code was changed to write it.
`REQUEST.md` (section "sub weapons:") holds the user's words, and those words win over anything here. `PLAN.md` wave 1
(`deploy`) sets the rules every deployable follows: it can be shot, and the tower crushes it. The two deployables in
this spec (B and C) follow those rules. Numbers are metres, seconds, % of the ink tank, and hit points out of a
player's 100.

**Revision 3 (after the second review).** Every point of the second review is fixed in place; "Review log, revision 3"
at the end lists them. The biggest changes:
- The four kits now use the **final** contracts of the other packages:
  - Bazookarp's `G.objTargets` (`splash` beside every `G.boss?.splash`, one read-only `spheres()` accessor);
  - caldera's `G.match.lava` (`surfaceAt` / `under` / `covers`, and its `lavaSweep` hook);
  - bluestone's `era:flip` event;
  - the aquarium's "no device aprons".
  The invented `G.level.liquidY`, `G.level.noPlace`, `shellBlocks` and the `damageArea` chain tag are gone (§0.5, §0.6).
- A chain hits the boss and the shell exactly once (C1.5).
- `F.dash` moves off the aquarium's bit (D8).
- The dash's substeps also run the launched Brolly canopy, the Roe Shell and Bubble Blower bubbles (D1.3, new
  `blockActor` kit hook).
- The dash press runs before the movement step, so the press frame moves (§0.5).
- A scripted "web arm" measures a human's 12- and 24-bobber web (C11).
- A long list of builder-level fixes: the Glide's cook clock (A1.1), bot dash dodges (D7), per-bot `prefer`,
  one `'device:down'` per ending, orphaned ghosts when a player leaves, the HUD reason line.

**Revision 2 (after the first review)** added: the dash's substeps (D1.3); the press as an edge (§0.5); the exact
wave-1 hook-ins (§0.2) and one shared destroyer, `G.deploy.crushIn` (§0.3); sentry spacing and the spawn rules (B1);
the Chain Bobber's drawing and CPU budget (C4.1); the main-weapon lock, the slip and the visible cook for the Glide
(A1, A2, A8).

| | Name | id | Ink | In one line |
|---|---|---|---|---|
| A | **Glide Bomb** | `glide` | 65 % | Slides straight along the floor, inking a lane and bouncing off walls, then blows when its fuse runs out. Hold to cook it: a shorter slide and a bigger blast. |
| B | **Scrap Sentry** | `sentry` | 65 % | A junk-built turret you set down. For 15 s it shoots foes it can see with a small Spritzer-style ink gun. One at a time, never two of a team's within 4 m. |
| C | **Chain Bobber** | `bobber` | 40 % | A floating bomb. Your team's fire sets it off and foes' fire disarms it. Bobbers close together tether up, and the bigger the chain, the bigger every blast. No limit on how many. |
| D | **Dash Pellet** | `dash` | 55 % | Pops under your feet and blasts you a few metres the way you're steering, on the ground or in the air. Its blast stays where you left. |

Names follow the roster's pattern of a verb or adjective plus a noun (Skitter Bomb, Waddle Bomb, Pop Pellet, Lurk Mine).
The ids are short, unique among `SUBS`, and appended to the end of `SUB_ORDER`:
`[..., 'mist', 'glide', 'sentry', 'bobber', 'dash']`. (`dash` is also a character-style preset id in
`character-style.js`. That is a different table, so there is no clash.)

---

## 0. Ground rules for all four

**Where the code goes.** Each sub is a self-registering kit module, `src/game/kits/<id>.js`, imported by
`kits/index.js`. Each module registers:
- its model, through `registerSubModel`;
- its icon, in `SUB_ICONS`;
- its sounds, in `SFX` (synthesized, no audio files);
- its hooks, in `SUB_KITS[id]`;
- its numbers, in `SUBS[id]` in `config.js`;
- its drawn size, in `SUB_VIEW_SCALE[id]`.

Shared files get only short hook-ins tagged `// [b5-subs]`.

**The existing subs to compare against** (config.js today, plus wave 1's device hit points):

| | Ink | Blast radius | Damage (max / min) | Other |
|---|---|---|---|---|
| Splat Bomb | 70 | 3.1 | 180 / 35 | paint 2.7, fuse 0.95 |
| Cling Charge | 70 | 4.0 | 180 / 35 | fuse 2.4 |
| Pop Pellet | 40 | 2.1 | 60 direct / 35 splash | paint 1.8 |
| Skitter Bomb | 65 | 2.8 | 180 / 35 | runs 6.3 m/s for 4.5 s, trail 0.6, hp 30 (wave 1, `b5-deploy` ad96683) |
| Waddle Bomb | 65 | 3.0 | 180 / 35 | hp 30 |
| Shaker Bomb | 60 | | | hold-to-charge, 2.7 s |
| Twirl Sprinkler | 60 | | 8 per drop | hp 100 (wave 1) |
| Hop Beacon | 70 | | | hp 120 (wave 1) |
| Lurk Mine | 55 | | 45 | |
| Tracer Bolt | 40 | | | |

Device damage today (`b5-deploy` subs.js, the flat `dmg` every blast passes to `damageArea`): Splat Bomb / Cling
Charge 60, Lurk Mine 30, Pop Pellet 25.

Main weapons and movement:
- Spritzer: 36 per shot, every 0.10 s, range 12.5 m, 34 m/s. The weakest single shots in the game are the Squall
  Spinner's 26 and the Gyre Splatling's 28; the Twinfire's are 30.
- Twinfire roll: 3.4 m in 0.3 s for 7 ink.
- Mitts leap: 4.5 to 13 m.
- Player: run 6 m/s, swim 11.8 m/s. A kid reaches 1.8 m up (jump plus ledge assist).
- Blast falloff everywhere: `k = 1 - clamp((d - 0.8) / (R - 0.8))`, `damage = lerp(min, max, k²)`, measured from the blast
  centre to the victim's chest (`pos.y + 0.7`, squid `+0.3`), with a line-of-sight check. All four subs use this formula.

### 0.1 Deployables (B and C) follow wave 1

The rules come from `src/game/deployables.js` on `b5-deploy`:
- Enemy fire of every kind wears them down. Your own team's fire never does, except that it sets a Chain Bobber off
  (C1.4).
- A hit flashes white with a squash and a "tok", and fires `'device:hit'` { attacker, kind, team, damage, obj, pos } for
  the shooter's hit marker.
- At 0 hp they break, firing `'device:down'` { kind, team, pos, by, how }. `how` is `'shot'`, `'crush'`, `'shell'`,
  `'flip'` or `'lava'` (§0.3).
- The moving tower's body destroys them on contact ("crush"). One that sits on the tower's deck rides it.
- The same "moving blocks remember their last move" rule (`b.dp`, as the Surf N' Turf buoy uses) carries them on any
  moving floor: a railcar, a pod, the tower. A moving block pushing into one lifts it onto its top or shoves it aside,
  and crushes it when there is nowhere to go (wave 1's `_pushes`).
- **Not solid to players.** Players walk through a sentry and a bobber, as they do through a sprinkler or a beacon
  today. Their capsules stop shots, beams and the Glide only.

### 0.2 Wave 1's device code: the exact hook-ins

Wave 1's code walks only `G.subs.items` and the Surf N' Turf buoy, so kit devices need a way in. Each kit with devices
(B, C) adds two hooks:
- `SUB_KITS[k].devices?(out)` pushes one **descriptor** per live device. The descriptor is a stable object, and its
  getters read live state.
- `SUB_KITS[k].rideBodies?(out)` pushes one **ride body** per live device on this screen, ghosts included.

The descriptor carries wave 1's own field names, so `devices()` can pass it straight on:

```
{ kind: 'sentry' | 'bobber', kit: true, obj, team, owner,
  pos     Vector3, the hit capsule's foot (a bobber: the bottom of its sphere)
  aim     Vector3, the hit centre (bots aim here; wave 1's name for it)
  r, h    the capsule's radius and height (config numbers, never the drawn model)
  hitH    = h (wave 1's name)
  normal  UP (both stand upright)
  floor   the level block id under it, or -1 (a bobber over water)
  ghost, rides (the block it rides, or null)
  live    getter: true while it can be shot
  prefer(brain)  the bots' pick multiplier for THIS bot (pick score = distance × prefer, lowest first)
  hurt(dmg, by), crush(how), flash(), teamFire?(by) }
```

`prefer(brain)` is a function, because its answer depends on the bot asking. A sentry: 0.8 (as the Hop Beacon: it
hurts). A bobber: 0.7 when it is within 4 m of that bot's route ahead (the segments through `brain.path[brain.pi]` and
the next 2 nodes) or within R(N) of where that bot stands; otherwise 1.0.

`crush(how)` ends the device with the crunch look (a sizzle for `'lava'`) and records `[2, gid, 2]`. It never emits
`'device:down'`: see the rule below the table.

Every place in wave 1's code that has to learn about kit devices, with the change. All are short and tagged `[b5-subs]`.

| File and place | What it does today | The change |
|---|---|---|
| `deployables.js devices(out)` | Pushes subs items and the buoy. | After them, `for (const k in SUB_KITS) SUB_KITS[k].devices?.(out)`. |
| `deployables.js crush(T)` (the tower) | Walks subs items and buoys. | Becomes `crushIn({ blocks: [T.block, T.pillar], rider: T }, 'crush')` (§0.3), which also covers kit descriptors. |
| `deployables.js sweep(a, …)` (roller drum, brush) | Hurts enemy subs items and the buoy. | Also kit descriptors. Enemy: `d.hurt(dmg, a)`. Own team with `teamFire`: `d.teamFire(a)`. The same per-device cooldown map. |
| `deployables.js _standing(dt)` (rain, vortex, Howl beam, Surf rings) | This screen's own non-ghost devices; enemy sources only. | Also own non-ghost kit descriptors (`mid` = `d.aim`). A source of the device's own team calls `d.teamFire(sourceOwner)` when the descriptor has it, instead of being skipped. |
| `deployables.js struck(dev, dmg, by)` | Returns early for kinds `devKind()` doesn't know: no flash, no `'device:hit'`. | First line: `if (dev.kit) { dev.flash(); if (!netMuted() && dmg > 0) { DEPLOY_STATS.hits++; emit('device:hit', { attacker: by \|\| null, kind: dev.kind, team: dev.team, damage: dmg, obj: dev.obj, pos: dev.aim.clone() }); } return; }`. The kits call `G.deploy.struck(desc, dmg, by)` from their own `hurt`. |
| `deployables.js` `'device:down'` and `DEPLOY_STATS` | Emitted by `down()` / `crush()` / `_pushes` for subs items. | One emitter per ending (the rule below the table). |
| `deployables.js attach / carry / netOn / _onRec` (riding) | Read `it.state`, `it.mesh`, `it.normal`; record under `'subs'`. | Kit devices hand these functions their **ride body** (below). `_onRec` records under `it.netKind \|\| 'subs'`. |
| `deployables.js _pushes` | Floor test on `it.state`; nowhere to go → `endLook(it, 2)`, bump, emit. | The floor test gains `it.floor \|\|`. Nowhere to go: `it.kill ? it.kill(2) : this.endLook(it, 2)`, then the bump and the emit exactly as today (wave 1 emits; `kill` doesn't). |
| `deployables.js _lost` | No floor within 40 m below → `G.subs._destroy(it)`, no event. | `it.lost ? it.lost() : it.kill ? it.kill(2) : G.subs._destroy(it)`. A bobber's ride body has `lost()`: it re-floats over whatever is below, liquid included (C1.2), so a bobber whose pod or railcar moves away over the sea keeps floating. A sentry's has no `lost`: `kill(2)`, no event, as wave 1 does for its own devices. |
| `deployables.js tick → _pushes(items)` (lifts, shoves) | `G.subs.items` only. | `_pushes(items.concat(kitBodies))`, `kitBodies` from every `SUB_KITS[k].rideBodies?.(out)`. A Treehills hedge growing under a sentry or under a bobber's foot lifts it onto its top; one spreading into it shoves it out; nowhere to go crushes it (wave 1's rule, unchanged). |
| `deployables-bots.js live(d)` | `obj.state === 'beacon'` for any kind it doesn't know. | `d.kit ? d.live : (the old rule)`. |
| `deployables-bots.js` the pick (`devShootAim`, the bot is `b = sense.b`) | `!PREFER[x.kind] → continue`. | `const pref = x.kit ? x.prefer(b) : PREFER[x.kind]; if (!pref) continue;` and the score uses `pref`. |
| `deployables-bots.js` the footwork's middle point | `o.mesh.userData.hitH`, `o.normal`. | `d.kit ? d.aim : (the old computation)`. |
| `deployables-bots.js DEV_BOT` | Counters per kind. | Add `sentry: 0, bobber: 0`. |

**The ride body.** A plain object wave 1 can move like one of its own floor devices:

```
rb = { pos      the foot on the floor (the sentry's foot; the bobber's float spot minus its hover height)
       normal   UP
       mesh     an empty THREE.Object3D: wave 1 writes position and quaternion; the kit reads them back
       state    'kit'      floor  true      hover  0 (sentry) or the bobber's height over its floor
       kind, team, ghost, gid, owner   (wave 1's crush path reads kind and team for 'device:down' and its counters)
       netKind  'sentry' | 'bobber'
       on, ride, onRec, pendOn, pushRec, pushT   (wave 1's own bookkeeping fields)
       kill(why)            ends the device and records [2, gid, why] (why 2 = crushed); never emits 'device:down'
       lost?()              the bobber only: its block went from under it; re-float (C1.2) instead of ending }
```

**One `'device:down'` per ending.** The code that decides an ending emits the event once and bumps the stats once:
- **Wave-1 code** (`crushIn` from any caller, `_pushes` with nowhere to go) emits `'device:down'` { how } and bumps
  `DEPLOY_STATS.crushed[kind]`, then calls `d.crush(how)` / `rb.kill(2)`, which only end the device and record.
- **The kit** emits for the endings it decides itself, and bumps the same counters:
  - shot down (`how: 'shot'`, `DEPLOY_STATS.down[kind]`);
  - its own 0.1 s body-in-block test (`'crush'`);
  - its own `era:flip` listener (`'flip'`, §0.6);
  - its `lavaSweep` (`'lava'`, §0.6).
- **No event** for endings that aren't destructions: expired, folded, replaced, owner splatted, deploy refused, and
  `_lost` with nothing below. This is what wave 1 does for its own devices.

`tools/botlab/tests/deployables.js` checks that each kit ending fires exactly one `'device:down'` and moves exactly one
counter by 1.

Each frame the kit puts its model at `rb.pos + (0, hover, 0)` and takes the yaw of `rb.mesh.quaternion`. The owner's
word on where it sits is wave 1's `[4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]`, recorded under the kit's own kind
(`'sentry'` / `'bobber'`). The kit's ghost handler passes it to `G.deploy.netOn(rb, data)`. This replaces the
`(lx, lz)` suffixes revision 1 put on the placement records: those had no block tag, height or normal, so a ghost could
not tell which moving block it rode.

**A bobber inside a block.** A bobber floats 1.0 m over its foot, so a block can reach it without touching the foot (a
railcar body, a hedge growing up through it). Every 0.1 s the owner tests the bobber's centre against every solid
dynamic block (`G.level.pointInBlock(b, centre, 0.12)`). Inside one, it is crushed (`kill(2)`), and the kit emits
`'device:down'` how `'crush'` (the rule above).

### 0.3 One destroyer for the tower and the shell: `G.deploy.crushIn(shape, how)`

The tower and the re-forming Bazookarp shell destroy devices of every kind. They both go through one new helper in
`deployables.js`, so neither has to know every kind of device:

```
G.deploy.crushIn(shape, how) → number destroyed
  shape, one of:
    { blocks: [b, …], rider?: T }   capsule inside any of these blocks (devices riding T are skipped)
    { sphere: { c, r } }            capsule overlapping this sphere
    { where: (pos) => bool }        the predicate is true at the device's pos (subs item: it.pos; buoy: w.pos;
                                    kit descriptor: d.pos, which is a sentry's foot and a bobber's sphere bottom)
  how: 'crush' | 'shell' | 'lava'   (it becomes 'device:down'.how)
```

It walks every placed or stuck subs item (sprinkler, beacon, Drip Curtain, Lurk Mine, a stuck Cling Charge), the buoy,
and every kit descriptor. It touches only this screen's own non-ghost devices that are still live; the owner's end
record ends the ghosts everywhere. The capsule test is wave 1's `_bodyIn` (foot, middle and top samples). For each
device it ends, it emits `'device:down'` and bumps `DEPLOY_STATS.crushed` once (§0.2), then ends kit descriptors with
`d.crush(how)` and the others with wave 1's crunch path. Who calls it:
- **The tower:** `crush(T)` becomes `crushIn({ blocks: [T.block, T.pillar], rider: T }, 'crush')`.
- **The Bazookarp shell,** every frame of its 0.8 s re-form: `crushIn({ sphere: { c, r: current radius } }, 'shell')`.
  Bazookarp §2.2 already plans to use "the deploy package's tower-crush helper" for this. This is that helper.
- **Caldera** may call `crushIn({ where: (p) => lava.under(p, -0.05) }, 'lava')` in place of its own `destroyWhere`
  (its ENGINE.md, risk 13, says to use wave 1's helper if it has this shape). If caldera keeps its own `destroyWhere`,
  that calls `SUB_KITS[k].lavaSweep(pred)`, which these kits implement (§0.6). Either way each device ends once,
  because a device that has already ended is skipped.
- **Bluestone's era flips** don't need it. Its H17 handles subs items, and the two kits listen to `era:flip`
  themselves (§0.6).

Revision 2's `standingOn` and `liquid` shapes are gone: nobody calls them now.

### 0.4 Online

**The same pattern as the Waddle and Shaker.**
- The owner simulates and records `['k', nid, id, [op, gid, …]]` (rounded numbers).
- Other screens replay a ghost that never paints (paint is muted) and never hurts.
- The owner's records decide every end, lock and blast.
- A hit on a ghost device goes to its owner through `netHurt(owner, id, gid, dmg, by)`, which travels as `{k:'dh'}`.
- Hits on players are judged on the owner's screen and applied by the victim's owner (`applyHit`, as always).
- The owner's ink splats replicate as usual.
- Ghosts time out on their own (`age > life + 3 s`), as a fallback.
- Docs go in `docs/NET.md` under "Kit weapons and subs".

**An owner who leaves takes their devices with them.** When a player leaves, the host adopts their squidkid
(`netmatch.js onLeave → _adopt`). Their real devices lived on their own client, so they go with it. Every other screen
holds only ghosts, and on the host `sendDevHit` returns early because the adopted actor isn't remote any more. Left
alone, up to 24 inert bobbers per leaver would absorb every team's shots for 33 s, and nobody could trigger or disarm
them. So, a new kit hook, `SUB_KITS[k].dropOwner?(actor)`:
- It ends every object of this kit owned by `actor` on this screen at once, with the kit's quiet end look (a puff, no
  blast, no paint, no `'device:down'`).
- `netmatch.js onLeave(id)` calls `for (const k in SUB_KITS) SUB_KITS[k].dropOwner?.(a)` for every actor `a` with
  `a.owner === id` (bots included, so a leaving host's bots' devices go too). It does this **before** `a.owner` is
  reassigned, on every screen. `_remove(a)` makes the same call.
- All four kits implement it: Glide stones in flight, sentries, bobbers. The dash has nothing that lasts.
- `net-subs5.cjs` checks it (§G).

**Who hit it.** `netHurt` gains an optional fifth argument, the attacker. `registry.js`:
`netHurt(owner, kind, id, dmg, by)` → `G.netm.sendDevHit(owner, kind, id, dmg, by)`, which adds `a: by?.nid` to the
`{k:'dh'}` message. `netmatch.js`'s `'dh'` case calls `K.netHurt(d.id, d.d, this.byNid.get(d.a) || null)`. Old callers
send no `a` and get `null`, as today. The bobber uses it to credit the triggering teammate (C9); both kits use it for
`'device:down'.by`.

**Ghost fire never touches a real device.** For every kit device, `hurt` and `teamFire` return at once while
`netMuted()` is true (a ghost shot, ghost blast or ghost chain being replayed on this screen). It neither hurts,
triggers nor disarms; the white flash still shows. The owner's real device is touched only by its own screen's real
fire, or by a `netHurt` / `bobberPop` sent from the shooter's screen. (This is the rule `waddle.js hurt` already
follows.)

One trap to avoid: `registry.js netHurt` drops values ≤ 0. Do not signal "team fire" with a negative damage, the way the
Bubble Blower does (see Open question 16). Use a separate channel key, as the Hop Beacon's `beaconUse` does.

**Fixed steps.** Anything other screens replay with the owner's step function (the Glide's slide, its aim guide)
steps at exactly 1/60 s through an accumulator on every screen, so the frame rate never changes where it goes.

**A remote dasher** must not be extrapolated through a wall (D8). Its tick flag is `F.dash`, bit 23 (8388608): bit 22
belongs to the aquarium's `F.pipe`.

### 0.5 New hooks

**The sub press for `onPress` kits (`SUB_KITS[k].onPress: true`), used by D.** It acts once, on the press, and it runs
**before the movement step**, so the dash already moves on the press frame. (Revision 2 put it in the weapon runner,
which runs after `_integrate`, actor.js:345 / 391, so the press frame didn't move.)
- `actor.js`, next to `firePressed` (line 258): `const subPressed = intent.sub && !prev.sub;`. On the press frame the
  actor is already a kid: a sub press beats the swim button (`subWins`, actor.js:290).
- `actor.js`, right after the dodge-velocity override (lines 316–317) and before `tryDodge` (line 322), every frame:
  ```
  this.weaponRunner.trySubPress(intent.sub, subPressed);                      // [b5-subs]
  const dsv = this.weaponRunner.dashVelocity(_dashV);                         // [b5-subs] D1.3
  if (dsv) { this.vel.x = dsv.x; this.vel.z = dsv.z; }
  ```
- `weapons.js`, a new runner method:
  ```
  trySubPress(held, pressed) {
    const a = this.a, sub = a.sub, SK = sub && SUB_KITS[sub.kind];
    if (!SK?.onPress) return;
    const free = !a.pipe && !a.superJumpState && !a.specialActive?.body;
    if (!held) { if (free) this.subLatch = false; return; }        // a real release, with the body free
    if (!pressed || this.subLatch) return;
    this.subLatch = true;
    if (a.form === 'squid' || a._spWeapon || a.carry || a.specialActive?.kind === 'barrage') return;
    if (SK.blocked?.(a, sub)) emit('sub:cantuse', { actor: a, kind: sub.kind, reason: SK.blockedWhy?.(a, sub) });
    else if (a.ink < sub.inkCost) { if (a.isLocal) { G.audio?.play('low_ink'); emit('lowink', { actor: a, need: sub.inkCost }); } }
    else { a.ink -= sub.inkCost; a.lastFire = 0; G.subs.use(a, sub); }
  }
  ```
  - `reset()` sets `subLatch = true`, so after any reset (pipe capture, Bazookarp pick-up, super jump, death) the
    button has to be released and pressed again.
  - The latch clears only on a frame where the button is up **and** the body is free. The aquarium's pipe 'pop' phase
    forces `intent.sub = false` (its ENGINE H3(b)); that frame doesn't count as a release.
  - So a sub held through a pipe ride doesn't dash on the exit. A held button gives one dash. "Can't use" sounds once
    per press, never every frame.
  - The Bazookarp carrier's press is left to the Bazookarp's own weapon block, which bonks it (Bazookarp S20).
  - A Bomb Barrage owns the sub button while it runs.
  - `_spWeapon` is the previous frame's value: a special that replaced the main weapon.
- `weapons.js update()`: for a kit with `onPress` (and no barrage running), the sub block does nothing. It never sets
  `aimingSub` and never throws on release.

**`SUB_KITS[k].lockMain?(runner) → bool`: the sub locks the main weapon.** Used by A (while cooking) and D (while
dashing).
- `weapons.js update()`: compute `bar`, `sub` and `SK` (today lines 152–154) **at the top**, before the main-weapon
  switch. Then:
  ```
  const locked = !!SK?.lockMain?.(this);
  if (locked && !this.mainLocked) this.dropCharge();
  this.mainLocked = locked;
  if (locked) inp = LOCKED_INP(inp);       // a copy with fire and firePressed false
  ```
- `dropCharge()` is `cancelForSwim()` without its `aimingSub` line (`cancelForSwim(keepSub = false)`, and
  `dropCharge() { return this.cancelForSwim(true); }`). It drops a charge, a stream or a wind-up, but not the held sub.
  Revision 2 called `cancelForSwim()` itself, which also cleared `aimingSub` and cancelled the Glide in hand.
- `runner.mainLocked` goes to the HUD (`frame.mainLocked`, main.js): the reticle dims to 40 % (hud.js, one class).

**`runner.subSpent`: a held press that has already been used.** The Glide's slip (A1.1) throws while the button is
still held. Without a latch, the next frame's `inp.sub && !aimingSub` would start a new hold.
- At the top of the sub block: `if (this.subSpent) { this.aimingSub = false; if (!inp.sub && !inp.subReleased) this.subSpent = false; }`.
- The hold test becomes `inp.sub && !this.aimingSub && !this.subSpent`. The release can't throw, because `aimingSub`
  is false.

**`SUB_KITS[k].blockActor?(actor)` and `MAIN_KITS[k].blockActor?(actor)`: kit walls for players.**
- `subs.js blockActor(a)`, after its curtain loop:
  `for (const k in SUB_KITS) SUB_KITS[k].blockActor?.(a); for (const k in MAIN_KITS) MAIN_KITS[k].blockActor?.(a);`
- `blockActor(a)` runs once a frame for every actor, right after its `_integrate`, and inside every substep of a dash
  (D1.3).
- **Brolly:** its `blockActors(c)` (brolly.js:369) is split into `blockOne(c, e)`. The kit tick keeps calling it for
  every enemy, unchanged. `MAIN_KITS.brolly.blockActor(a)` calls `blockOne(c, a)` for each live launched canopy. That
  is idempotent: a body already outside the 0.56 m band isn't moved.
- **Dash:** `SUB_KITS.dash.blockActor(a)` acts only while `a.weaponRunner.dashT > 0` (D1.3). It covers the Roe Shell
  and enemy Bubble Blower bubbles.

**`SUB_KITS[k].smash?(c, r, team, frontFn)`.** Lets the Mega Stamp's swing guard defuse the kit's bombs in front of it,
as `STAMP_SMASHES` does for the built-in bombs. Used by A and C.

**`SUB_KITS[k].botAct?(brain, dt, it, move, busy) → aim | null`: a kit's own bot behaviour, for every bot.**
- `bots.js`: one loop just before the turf think's `this._tail(...)` call (after `sp.act`, so nothing later in the
  frame clears what it sets). `busy` is true when `thrAim` is already set by threats, canopies, pods or escapes.
- A returned aim sets `wantYaw` / `wantPitch` and `thrAim`. A kit that only wants to press the sub sets
  `brain._bombAim = true` and returns null. `_tail` presses on this frame and releases on the next, as it does for
  every bot throw.
- Each kit scans at most every 0.1 s per bot, staggered by the bot's think phase, and holds its last answer between
  scans.
- Sight rays come from botSight's shared frame budget through a new export, `sightRay(a, b) → true | false | null`
  (null: this frame's 24 rays are spent, so try next frame). It has the same counter and reset as `Sight.check`.
- Used by C (any teammate bot sets off a chain) and D (dodges, break-offs, gap closes, D7).

**`SUB_KITS[k].drawMap?(c, map, tc, s, hex, viewerTeam)`.** Minimap marks, drawn after the built-in devices. Used by B
and C.

**`SUB_KITS[k].devices?(out)` and `rideBodies?(out)`.** See §0.2.

**`SUB_KITS[k].dropOwner?(actor)`.** See §0.4.

**`SUB_KITS[k].lavaSweep?(pred)`.** Caldera's `destroyWhere` calls it (§0.6). Used by B and C.

**`SUB_KITS[k].bot.rides?: true`: this sub may be used on a moving tower.** Used by B. `bots.js:1005`
(`!onT && this._paintSub()`) becomes `(!onT || SUB_KITS[a.sub?.kind]?.bot?.rides) && this._paintSub()`.

**`MAIN_KITS[k].letGo?(runner, why)`: drop whatever holds the body still.** Used by D (D1.5). For the Mitts:
`letGo: (r, why) => dropCling(r, r.kit, why)` (one line in `kits/mitts.js`).

**`'sub:cantuse'` gains an optional `reason` string, and `SUB_KITS[k].blockedWhy?(actor, sub) → string`.**
- hud.js `_cantUse(kind, reason)` shows the reason as a small second line under "CAN'T USE" (hidden when empty).
- A new event, `'sub:note'` { actor, kind, text }, reuses the same callout slot with `text` in place of "CAN'T USE".
  It is quieter: no red ✕, 70 % opacity, and the kind's own sting instead of `sub_cantuse`. Used by B ("SENTRY DOWN").

**Kit HUD pieces are drawn by the kits** on `G.hud.xh`, the way the Shaker draws its pips (`shaker.js pips()`): the
Glide's cook bar, the sentry's life ring, the bobber count and "CHAIN ×N", and the dash's air pip. hud.js changes only
for the reason line, `'sub:note'` and the dimmed reticle.

**What the kits read from other packages.** Each read is optional-chained, so without that package today's behaviour
holds:
- `G.objTargets?.splash(...)` and `G.objTargets?.spheres?.(out)` (Bazookarp, §0.6).
- `G.match?.lava?.surfaceAt / under / covers` (caldera).
- The `era:flip` event (bluestone).
- `a.pipe` (aquarium: only in `trySubPress` above).

The kits use one helper for the liquid under a point:
`liquidTop(x, z) = max(PLAYER.waterY, G.match?.lava?.surfaceAt?.(x, z) ?? -Infinity)`.

Revision 2's `G.level.noPlace` and `G.level.liquidY` are gone. No stage provides them: the aquarium dropped device
aprons, and caldera has its own lava API.

**`boss.js splash(attacker, c, R, dmax, dmin, wid, o)`** gains an optional last argument. `o.body === false` hits only
the crablets: `if (!this.visible || o?.body === false) return;` after the crab loop. Used by C (C1.5).

### 0.6 The other batch-5 packages

**Bazookarp** (`bazookarp/SPEC.md` §2.2 the Roe Shell, §2.4 the carrier, S20). The shell is an objective target in
`G.objTargets` (`segHit`, `hit`, `splash`, `tick`), hit the way Boss Battle's boss is hit. Bazookarp §2.2 says "The
batch-5 subs add theirs", so these are our calls, made beside each `G.boss?.…` call:

| | Rule |
|---|---|
| Glide blast | `G.objTargets?.splash(owner, c, R, 180, 35, 'glide')` with the cook's R. True player numbers, never the device numbers. |
| Dash blast | `G.objTargets?.splash(owner, from, 2.2, 50, 25, 'dash')`. |
| Bobber blasts | **A chain counts once on the shell.** At the trigger, the chain picks the bobber whose centre is nearest the shell's surface (`spheres()`) with a clear line (`physics.los`, from 0.3 m above the bobber to the nearest surface point, as `boss.splash` tests), within R(N). Only that bobber's blast calls `G.objTargets?.splash(owner, c, R(N), max(N), min(N), 'bobber')`, at the moment it blows. Every bobber of a chain blows at the same R and damage, so the nearest is the strongest. No tag, no ledger on the shell's side. (Bazookarp has one shell. If objective targets ever multiply, ask `G.objTargets` for a per-target splash.) |
| Sentry rounds | Ordinary projectiles. The projectile path's `G.objTargets.segHit` / `hit` (which Bazookarp WP1 adds beside the existing `G.boss.segHit`, weapons.js:1671) stops them on the shell and counts them at face value, like any shot. The × 0.5 of revision 2 is dropped: the sentry never aims at the shell and can't see through it, so only a stray round reaches it, as a stray round from any player would. |
| Glide body | Bounces off the shell like a wall. For each solid sphere from `spheres()`, the puck touches when its horizontal distance to `c` is under `sqrt(r² − dy²) + 0.28`, with `dy` the height from `c` to the puck's middle. The normal is the horizontal part of (stone − c), with e = 0.8 then × 0.92. |
| Thrown bobber | Its flight segment tested against each solid sphere. On contact it deploys 0.45 m out from the surface along the normal, with its height clamped as for a wall hit (C1.2). |
| Sentry sight | A foe is not seen when the segment from the muzzle to their chest passes within `r` of a solid sphere's `c`. A segment-sphere test, no ray. |
| Dash | Inside its substeps, `SUB_KITS.dash.blockActor` pushes the dasher out of every solid sphere positionally and removes the inward part of its velocity (D1.3). The shell's own 6 m/s radial shove (S6) is a velocity, which the dash overrides every frame, so without this a 4.5 m dash would cross a 3.2–4.6 m shell. |
| Re-forming shell | Destroys sentries and bobbers inside its sphere, through `crushIn({ sphere }, 'shell')` (§0.3), which Bazookarp §2.2 already plans as "the deploy package's tower-crush helper". |
| The carrier | Can't use subs (S20): the press bonks, through Bazookarp's own weapon block. A dash running at the pick-up ends at once: the pick-up resets the runner, and `reset()` calls `endDash()` (D1.5). A Glide cooking at the pick-up fizzles (A1.1). A sentry or bobbers already out keep working (Bazookarp §2.4, "devices"). |

**Asked of Bazookarp: one read-only accessor.** `G.objTargets.spheres(out) → out` pushes `{ c: Vector3, r: number,
solid: true }` for each objective target that is a sphere and is solid now: the intact Roe Shell, with `r` its current
radius (1.6 to 2.3 m). It doesn't list the shell while it re-forms, after it has burst, or while the Bazookarp is
carried. The objects are stable (no allocation per call). That is the whole ask. The lead passes it to the Bazookarp
designer for their §2.2 / §11 list, so both builders read the same contract (I don't edit their document).

**The three new stages** (each stage's final ENGINE.md):

| Stage | Rule |
|---|---|
| **caldera**, lava (`stages/caldera/ENGINE.md` §3, §4.2, H16–H19) | **Liquid top:** `liquidTop(x, z)` (§0.5): the lava's `surfaceAt` where finite, else the sea's −1.6. **Glide:** sinks with a hiss and no blast when `G.match?.lava?.under(pos)`, the same test caldera's H16 puts on bombs. **Bobber:** floats 1.0 m over the higher of its floor and `liquidTop`, re-checked every 0.25 s and eased at ≤ 1 m/s, so it rides rising lava up and settles as it falls. Over the void lake (no floor), it floats 1.0 m over the lava. **Sentry:** placement refused where `G.match?.lava?.covers(x, z, floorY, 1)` (lava there now or within 1 s). **Devices in rising lava:** caldera's ENGINE.md H17 / H19 has its `destroyWhere(pred)` call `SUB_KITS[k].lavaSweep?.(pred)` at 4 Hz. Both kits implement it: own, non-ghost devices whose `pos` passes `pred` end with the sizzle, `'device:down'` how `'lava'`, record `[2, gid, 2]`. A bobber's `pos` is its sphere's bottom, 0.88 m over the lava it floats on, so it never matches `under(p, −0.05)` (L + 0.2) unless the lava outruns the 0.25 s re-float. That would take 2.7 m/s; caldera's lava peaks at 0.36 m/s (LOW −1.6 to HIGH +0.8 in a 10 s smoothstep; its ENGINE.md summary and §3.3). If caldera calls `G.deploy.crushIn({ where: pred }, 'lava')` instead (§0.3), the same devices end through wave 1. Nothing is asked of caldera: its ENGINE.md already names "batch 5's new turret and floating bomb" in H19. **Dash:** the player's lava rules apply. |
| **bluestone**, era flips (`stages/bluestone/ENGINE.md` H17, event `era:flip` { group, on: [blockIds], off: [blockIds] }) | Bluestone's H17 handles subs items and the buoy. **The two kits listen to `era:flip` themselves**, so nothing is asked of bluestone. On each flip, for this screen's own non-ghost devices: a **sentry** whose floor block is in `off`, or whose capsule (wave 1's `_bodyIn`) is inside a block in `on`, ends (`'flip'`, the crunch, `[2, gid, 2]`). A **bobber** whose sphere is inside a block in `on` ends the same way. One whose foot's floor is in `off` re-floats (`lost()`, C1.2) over what is below: bluestone keeps every vanishing top ≤ 2.6 m over a floor of the new era. The owner's records end or move the ghosts everywhere. A sliding **Glide** meets whatever is solid at that moment. |
| **aquarium**, pipes (`stages/aquarium/ENGINE.md` §1.4 table: "device aprons … **not supported**", and §3.10) | No placement hook: sentries and bobbers go wherever the normal rules allow (revision 2's Open question 24 is closed by the stage's decision). Pipes and glass are ordinary solid geometry: walls to the Glide (it bounces) and to a thrown bobber (it deploys on them); the stage's ENGINE.md §7, risk 9, says the new subs need no hooks there. A pipe capture calls `weaponRunner.reset()` (its row 0 and H3), which ends a dash (`reset()` → `endDash()`) and fizzles a Glide in hand. A sub held through the ride doesn't dash on the exit (the press latch, §0.5). |

### 0.7 Bots and specials

**Bots never cheat.** Every bot decision about these subs uses only what a player could see or hear (`botSight.js`
rules), after the bot's reaction time.

**Specials, for all four** (detail in each section):
- *Bubble Guard, Kraken, spawn invulnerability:* the target takes 0 damage. The sentry skips a target with
  `botSpecials.immunity(e, mx, my, mz) < 0.3`, with the muzzle's position, as the bots do (botSpecials.js:404, 873).
- *Drainbow:* halves what crosses an enemy bubble, through the existing `pass` / `cut` paths. Pass the blast centre as
  `from` and the projectile as `shot`.
- *Boss Battle:* the Glide and the Dash call `G.boss?.splash(owner, c, R, max, min, id)` for each blast. A chain hits
  the boss's body once (C1.5). Sentry rounds hit the boss through the projectile path.
- *Bazookarp:* §0.6.

---

## A. Glide Bomb (`glide`)

> User: "A bomb that travels in a straight line across the floor, leaving a trail of ink and bouncing off of walls and
> obstacles. It explodes after its timer expires. The maximum distance of the bomb can be shortened by holding the
> deployment button to 'cook' the timer before release. This makes the blast radius larger."

**Reference.** This is from memory and approximate, so treat it as flavour, not data. Splatoon 2 and 3's Curling Bomb:
- costs 70 %, does 180 at the centre and about 30 at the edge;
- leaves on the floor at about a swimming squid's speed and slows as it goes;
- inks a lane about one squid wide and bounces off walls;
- has a fuse of a few seconds that starts burning while you hold the button;
- a full cook (about 1 to 1.5 s) leaves a short slide and a blast a little bigger than a Splat Bomb's; an uncooked one
  slides far and makes a small blast.

Below, that is mapped onto this game's scale: Splat Bomb radius 3.1, spawn to mid about 60 m since Long Stages.

### A1. Behaviour

1. **Hold.** Press the sub button: the kid raises the stone. If you have the ink (65), the aim guide (A3) shows.
   - **One clock.** `held` is the time since the press. The cook is `cook = clamp(held − 0.15, 0, 1.8)`: the first
     0.15 s are a grace that never cooks, so a tap stays uncooked. **Every "cook" number in this spec is this `cook`.**
     `held` is named where it is meant.
   - From `held` 0.15 s, **the fuse burns in your hand**. The 8 lamps round its waist go out one by one as the cook
     grows.
   - Full cook (`cook` 1.8 s) comes at `held` 1.95 s. Past that the stone stays at full cook: all lamps out but the
     last, which throbs. It never goes off in the hand.
   - **While it cooks, your main weapon is locked.** You can walk, jump, aim and dive, but the trigger does nothing.
     The Glide's `lockMain(runner)` (§0.5) is `runner.aimingSub && cook > 0 && !barrage`. It is read at the top of the
     runner's update, so the lock starts one frame after the grace ends. On that frame a charge, stream or wind-up in
     progress is dropped without firing (`dropCharge()`, which keeps the stone in hand). A tap is never locked: it is
     thrown before the grace ends. (Not `busy()`: that would also block diving, and diving must still fizzle the
     stone, A1.7.)
   - **It can't be held forever.** After 1.0 s at full cook (`held` 2.95 s) the stone slips. It is released exactly
     as if you had let go: 65 ink paid, a 0.6 s fuse. Then `runner.subSpent` is set (§0.5): the button still being
     held doesn't start a new stone, and its release throws nothing. Over the last 0.5 s before the slip, the last
     lamp throbs at 8 Hz and the HUD cook bar flashes red.
   - Without 65 ink the stone never cooks: no lock, no slip, and the release only plays the low-ink sound.
   - **Barrage.** A stone thrown by a Bomb Barrage (Open question 14) never cooks: `hold` and `lockMain` return at
     once while `a.specialActive?.kind === 'barrage'`. The barrage promises the main weapon stays free.
   - **Interrupted holds fizzle (the Shaker's rule, shaker.js:197 and 601).** The cook state keeps `t1`, the last
     time `hold` ran. The kit's tick drops any cook whose `hold` hasn't run for 0.15 s as a fizzle: no ink, the A1.7
     fizzle look, record `[5, 0]`. That covers every runner `reset()`: a pipe capture, a Bazookarp pick-up, a super
     jump, a loadout swap.
   - **Everyone sees the cook.** The held stone's lamps and a hand glow (team colour, brighter with the cook) show on
     every screen (A8), and the fuse sizzle is heard by others within 12 m.
2. **Release.** You pay 65 % and the stone is set down on the floor 0.5 m ahead of your feet (at your feet if a wall is
   closer).
   - It leaves along your aim's yaw (pitch is ignored) at 10 m/s.
   - Released in mid-air, it drops from the hand with gravity 24, keeping its slide velocity, and starts sliding where it
     lands.
   - All of its motion, on every screen, steps at a fixed 1/60 s through an accumulator (at most 6 steps a frame), so
     the frame rate never changes where it stops.
3. **Slide.** On the floor it slows linearly at 3.0 m/s² and never drops below 1.2 m/s.
   - Every 0.35 m of travel it lays a splat of radius 0.55 m: a swimmable lane about 1.1 m wide.
   - It follows the floor: steps up to 0.3 m are ridden over, and ramps up to 35° are followed.
   - It sails off ledges: gravity 24, horizontal speed kept, and no slowing while in the air. It lands and keeps
     sliding.
4. **Bounces.** These are walls to it:
   - a surface with |normal.y| < 0.6, or a riser over 0.3 m, struck at the puck's middle (0.14 m up);
   - an enemy player's body: a circle of radius 0.38 m round their axis, if their feet are within ±0.8 m of the puck;
   - an enemy Drip Curtain;
   - any team's Scrap Sentry (a circle of radius 0.32 m round its axis);
   - an intact Bazookarp shell, from `G.objTargets?.spheres?.(out)` (§0.6; normal = horizontal part of stone − c);
   - pipes and aquarium glass (ordinary level geometry);
   - the tower and any mover's sides.

   It reflects: `v ← v − (1 + e)(v·n)n` with e = 0.8, then `v ← v × 0.92`.
   - Off a moving block it also takes that block's velocity (`b.dp / dt`).
   - Off a player, e = 0.5 and it keeps × 0.6 (a heavy clonk off the shins). The same player can't be bounced off again
     within 0.25 s.
   - It never goes off on contact, and teammates don't touch it.
5. **Fuse.** The fuse after release is 2.4 s minus the cook. When it runs out, the blast goes off where the stone is.
   - Over the last 0.8 s (or the whole fuse, if that is shorter), the blast radius shows round it as the Splat Bomb's
     danger ring, with beep pulses quickening from 7 to 20 a second (`fx.dangerRing` / `fx.beepPulse`, the Skitter
     windup language).
   - Until then, a faint ring of the same radius rides with it, so foes can read how big this one will be.
6. **Blast.** Radius, damage and ink depend on the cook (A2). It paints the floor under it with four satellite splats
   (`subs.js _paint`), and hurts enemy devices by `damageArea(c, R, 40 → 60, team, owner)`.
   - It also calls `G.boss?.splash(owner, c, R, 180, 35, 'glide')` and `G.objTargets?.splash(owner, c, R, 180, 35,
     'glide')`: the true player numbers.
   - **Turf and special charge.** Its trail and blast paint go through the subs `_credit` rule: the owner's turf and
     special charge (`addTurf`), or turf only (`addTurfNoSpecial`) when thrown by a barrage (`it.sp`).
7. **Endings without a blast.**
   - It sinks: below the sea (`PLAYER.waterY`), into lava (`G.match?.lava?.under(pos)`, caldera's test for bombs), or
     off the map. No blast, a small plop (a hiss and steam in lava, `G.match.lava.fizzle(pos)`).
   - It is popped by enemy fire (hp 40): a harmless puff, exactly like the wave-1 Skitter rule.
   - It is smashed by an enemy Mega Stamp's swing guard.
   - Splatted, or diving into ink while cooking: it fizzles in the hand (the Shaker's rule). No ink is spent, because ink
     is only paid on release.

### A2. Numbers (`SUBS.glide`)

| key | value | why |
|---|---|---|
| inkCost | 65 | Skitter and Waddle cost 65 for "a bomb that travels and inks". Uncooked, it is weaker than a Splat Bomb (70). Fully cooked it matches one, paid for with 1.8 s of holding with the main weapon locked. The lever runs 60 to 70. |
| speed0 | 10 m/s | Faster than a run (6), slower than a swim (11.8). A swimmer can outrun it once it slows. |
| decel, minSpeed | 3.0 m/s², 1.2 m/s | Linear slowing makes the cook change the distance evenly. |
| fuse | 2.4 s | Uncooked reach is 10 × 2.4 − 1.5 × 2.4² = **15.4 m** (end speed 2.8), about a quarter of a half-stage. |
| cookGrace, cookMax | 0.15 s, 1.8 s | `cook = clamp(held − cookGrace, 0, cookMax)` (A1.1). A tap stays uncooked. A full cook (`held` 1.95 s) leaves a 0.6 s fuse, so reach = **5.5 m**. Half cook (0.9 s, `held` 1.05 s): 11.6 m. |
| overHold | 1.0 s | Held this long at full cook, the stone slips out (`held` 2.95 s, A1.1). No fighting with a primed stone in hand. |
| radius | 2.2 → 3.2 (linear in cook / 1.8) | Uncooked is about a Pop Pellet (2.1). Full cook is a Splat Bomb's blast (3.1), a touch wider, and under a Cling Charge (4.0). Revision 1 had 3.4; review: it outclassed the Splat Bomb at a lower cost. |
| damageMax / Min | 180 / 35 | The roster's bomb line. The lethal core grows with the cook: ≤ 1.26 m uncooked, ≤ 1.59 m full (Splat Bomb 1.56). |
| paintRadius | 1.8 → 2.8 | Matches the blast growth (Splat Bomb 2.7). |
| devDamage | 40 → 60 | The Splat Bomb hurts devices by 60. |
| trailEvery, trailRadius | 0.35, 0.55 | Skitter: 0.35 / 0.6. About 16 m² of lane on a full slide. |
| bodyRadius, hitR, hitH | 0.28, 0.22, 0.24 | Contact radius for bounces; shot capsule. Config numbers, never read off the model. |
| hp | 40 | Two Spritzer shots, two Twinfire shots, one Blaster hit or charger beam. The Skitter and the Waddle are 30 (one Spritzer shot): they hunt you, so they must be easy to stop. The Glide goes in a straight, readable line, and the user's "bouncing off walls" only matters if it survives a stray shot, so it takes one more. |
| restitution, scrape, playerE, playerKeep | 0.8, 0.92, 0.5, 0.6 | As in A1.4. |
| step | 1/60 s | The fixed step for the slide, the aim guide and the ghosts (§0.4). |

Reach by cook: 0 s → 15.4 m · 0.6 s → 13.1 m · 1.2 s → 9.8 m · 1.8 s → 5.5 m (held 0.15 / 0.75 / 1.35 / 1.95 s).
Radius: 2.2 / 2.53 / 2.87 / 3.2. Paint radius: 1.8 / 2.13 / 2.47 / 2.8.

### A3. Controls and aim guide

- **Tap** (under 0.15 s): uncooked, the long slide. **Hold**: cook, with the release whenever you like, up to the slip
  (A1.1). `noArc: true`.
- **Guide** (local player only, while held). The real slide's step function at the same fixed 1/60 s step, run ahead
  for the fuse that would be left if you let go now, ignoring players:
  - a dashed team-coloured line laid on the floor (+0.05 m) through up to 3 bounces;
  - a ring of the current blast radius where it would stop.

  As you cook, the line shortens and the ring grows. It turns grey if you lack the ink. Recompute it 20 times a second
  (every 0.05 s), at most 144 steps (2.4 s) each, each step one `physics.segment` and one floor ray. Between
  recomputes, only the ring's radius follows the cook.
- **HUD cook bar** under the crosshair's sub chip, in the place the Shaker's pips use (drawn by the kit on `G.hud.xh`,
  §0.5):
  - a bar fills over the 1.8 s of cook (held 0.15 to 1.95 s), with a tick at each lamp;
  - the chip's number shows the reach, e.g. "15 m" falling to "6 m".
  - On full cook the bar flashes once with a clink; over the last 0.5 s before the slip it flashes red.
  - While the cook locks the main weapon, the reticle dims to 40 % (`frame.mainLocked`, §0.5).

### A4. Model, look, icon, sounds

- **Model** (`registerSubModel('glide')`, hand scale, origin at the bottom centre, +Z forward). A curling stone made a
  bomb:
  - a dark rubber skirt ring at the base (r 0.095, h 0.012);
  - a cream "granite" lower body with a slight belly, flecked with a few dark speckle decals, to y 0.045;
  - a dark gasket band at the equator, carrying 8 lamp sockets (lamps are per-instance meshes, team emissive, as on the
    Shaker);
  - a team-ink upper dome to y 0.07, with a squid decal;
  - a curling handle on top: a dark gooseneck rising 0.022 from the centre, then bending forward into a horizontal
    rubber grip bar 0.07 long. The left fist holds it; it is the grip.
  - an amber LED at the handle's root, and two hazard chevrons on the front and back of the lower body.
- **World size.** Built Ø 0.36 m; `SUB_VIEW_SCALE.glide = 1.6` (drawn Ø 0.58 m). Sliding, it spins about its vertical
  axis at 0.8 rad/s per m/s of speed (the "curl"). The lamps show the fuse left.
- **In the hand, on every screen.** The held stone's lamps show the cook level (A8): 8 lit, then 5, 3, and 1 throbbing
  at levels 0 to 3. A team-coloured glow round the fist (a sprite, radius 0.15 m at level 1 rising to 0.3 m at level
  3) makes a primed stone readable from across a lane.
- **Icon** (`SUB_ICONS.glide`, 64 × 64, the roster style: dark #15121c outline 3 px, light #e4e8ef fills, team colour =
  `currentColor`). The stone in three-quarter view:
  - a cream lower body and a team dome;
  - a dark band with three lit white dots;
  - the handle on top;
  - three speed lines behind it (left), and a short ink streak under it.
- **Sounds** (`SFX`, plus a `SUB_CUE.glide` row):

  | sound | what it is |
  |---|---|
  | `glide_cook` (loop: local, and positional for others within 12 m at 50 % volume) | A fuse sizzle: high-passed noise plus crackles, rising with the cook. |
  | `glide_release` (cue `throw`) | A weighty stone-on-ice "thock": tone 180 → 110 Hz over 0.08 s, plus a noise burst and a short whoosh. |
  | `glide_slide` (positional loop) | A low gritty rumble: band-limited noise 200 to 600 Hz. Its level and pitch follow speed, with a fuse beep (square 1.2 kHz) layered on, quickening from 3 to 14 a second as the fuse runs out. |
  | `glide_bounce` | A "clonk": tone 420 → 240 Hz plus a click, its volume set by impact speed. |
  | `glide_boom` (cue `boom`) | The bomb boom, pitched 1.1 uncooked down to 0.85 full. |
  | `glide_pop` (cue `end`) | A dull "thup" with a fizz. |

  Add `'glide'` to `THROWN_SUBS` in `cues.js` with no flight voice: it slides; its loop is the slide.

### A5. Interactions

| With | Result |
|---|---|
| Enemy shots, beams, blasts, roller / brush, standing fire | Hurt it (hp 40). At 0 it pops harmlessly. A blast that pops it does not set it off. |
| Own team's fire | Nothing. |
| The tower and movers | Their sides are walls it bounces off, taking their velocity. On a moving floor it rides (`b.dp`). It is not "crushed": it is a bomb, not a device. |
| Water, lava, off the map | Sinks, no blast (A1.7): the sea, `G.match?.lava?.under(pos)`, or off the map. |
| Grates and rails | Floors it slides on. They don't take ink, so the trail leaves no ink there. |
| Bazookarp | Bounces off an intact shell (`spheres()`); its blast calls `G.objTargets?.splash` with 180 / 35 at R (§0.6). Its carrier can't throw one. A cook in hand at the pick-up fizzles (A1.1). |
| bluestone era flips | It meets whatever is solid at that moment: a block that appears in front of it is a wall; a floor that vanishes under it drops it. |
| aquarium pipes and glass | Walls: it bounces. It never rides a pipe. |
| Enemy spawn | Nothing special: spawn invulnerability (1.6 s) covers it. |
| Scrap Sentry | Bounces off any team's sentry body (circle r 0.32). Its blast hurts enemy sentries (devDamage). |
| Chain Bobber | Passes under (bobbers float at 1.0 m). Its blast sets off its own team's chains and disarms enemy bobbers within R + 0.2 m (C1.4, C1.6). |
| Dash Pellet | None directly. |
| Bubble Guard / Kraken | Untouchable: 0 damage. It still bounces off them. |
| Drainbow | Sliding through an enemy bubble marks it (`G.drainbow.pass`), and its blast is halved, as for thrown bombs. |
| Mega Stamp | The swing guard defuses an enemy Glide in front of it (the `smash` hook). |
| Splatted owner | A released stone carries on and blows. One in the hand fizzles (A1.7). |
| Bomb Barrage | Not a barrage bomb. Mystery Barrage: Open question 14; if it joins, a barrage stone never cooks and never locks the main weapon (A1.1). |

### A6. Counterplay

- Its lane is visible on the floor, and so is its size ring. Step off the lane: its contact circle is only 0.66 m round
  your axis.
- Shoot it: two shots.
- Swim away once it slows.
- Watch the cook: a short, fast stone is a big blast; a long one is a small blast far away. A thrower with a glowing
  fist is holding a primed stone and can't shoot you back.

### A7. Bots

**Using it** (`SUB_KITS.glide.bot`):
- `fight(brain, dist)`. Conditions:
  - a target in sight, 5 to 15 m away, with |dy| < 1.2 m;
  - a clear floor line (`_dryLine` + `_fatLos` at 0.3 m height along the yaw);
  - a 3 % chance per frame × (1 + fireDiscipline);
  - then `bombCd` 6 to 11 s.

  The kit's `hold` picks the cook so the predicted stop (A3 step function) lands within 1.5 m of the target's position
  led by velocity × the fuse left. It solves the reach formula (A2) for `f`, sets `cook = clamp(2.4 − f, 0, 1.8)`, and
  holds for `held = cook + 0.15` s before releasing (the grace counts in the hold, A1.1; the `botHold` pattern from the
  Shaker). A bot never holds past full cook (`held` 1.95 s), so it never reaches the slip at 2.95 s.
- `paint(brain)`. A 0.8 % chance per frame when the 12 m ahead along the aim is under 40 % ours. `G.paint.regionStats`
  is a disc query, so sample three discs of radius 2 m centred 2, 6 and 10 m ahead along the aim yaw and average their
  `own / n`. Uncooked, for the lane. Then `bombCd` 9 to 15 s.
- Leave `THROWN.glide` unset (it isn't a lob). Optional, if cheap: a Zone Control guard on the zone's level slides one
  across the zone's enemy ink.

**Facing one.**
- A `threats()` descriptor `{ kind: 'glide', ground: true, slider: true, … }`:
  - `pos`, and `aimY` 0.12;
  - `vel` live, and `radius` = current R;
  - `shootable` while sliding;
  - `fuse` left, and `stopAt` = its predicted stop point. Cache it, re-predicting every 0.2 s or on a bounce.
- `bots.js _threatScore`, a new `slider` branch. Score 1.2 + 2 / (0.3 + fuse) if we are within R + 0.5 of `stopAt`, or
  within 1 m of its lane ahead and in its path. Otherwise 0. Then the existing control: shoot it if we can, otherwise
  `_thrEvade` (step off its line).
- `bots.js _threatCtl` computes `eta` and `urgent` from `d.speed` and `d.trigger`, which default to 4 and 1.2 and mean
  nothing for a slider. Add a `slider` branch before the generic one: `urgent = fuse < 1.5 && dist(us, stopAt) < R +
  0.5`, or (we are within 1 m of its line ahead and it reaches us in under 1 s at its current speed).
- `botSpecials.specialDangers()`: a disc at `stopAt`, R + 0.3, tIn = fuse left, lethal 2 when R ≥ 2.6 (else 1),
  `los: true`, `vis: 'near'` (seen, or heard within 8 m: it rumbles). The escape logic does the rest.

### A8. Online (kit kind `glide`)

| record | meaning |
|---|---|
| `[5, level]` | The cook in the hand reached a level: 1 at cook 0.6 s, 2 at 1.2 s, 3 at 1.8 s (full), which is `held` 0.75 / 1.35 / 1.95 s. At most three per hold, plus `[5, 0]` when a cook in hand fizzles (splatted, dived, any interrupted hold, A1.1). Other screens show the held stone's lamps, the hand glow and the sizzle at that level (A4). The actor tick's `subAim` flag says when the hold ends: when it drops, the level resets to 0. |
| `[0, gid, x, y, z, vx, vz, fuse, R]` | Released: the floor start point, slide velocity, fuse left, blast radius (the cook is decided). Every screen slides a ghost with the same step function at the same fixed 1/60 s step. |
| `[4, gid, x, y, z, vx, vz, fuse]` | The owner's correction at every bounce and every 0.25 s. Ghost players differ per screen, so ghosts drift. The ghost eases onto it (`k = 1 − e^(−14 dt)`) and takes the velocity. |
| `[1, gid, x, y, z]` | The blast: the look, there. Damage and paint are the owner's. |
| `[2, gid, why]` | Ended without a blast: 0 sank, 1 popped, 2 smashed. A ghost never blows or pops by itself. If it reaches the end of its fuse first, it holds there, pulsing, until the owner's word (2 s timeout). |

Enemy fire on a ghost → `netHurt(owner, 'glide', gid, dmg, by)`. The ghost's own `hurt` obeys the `netMuted()` rule
(§0.4).

### A9. HUD, prompts, picker

- **Picker blurb:** "Slides straight along the floor, inking a lane and bouncing off walls, then blows when its fuse runs
  out. Hold to cook it: a shorter slide and a bigger blast." Ink cost 65 %.
- **Prompts** (`main.js` light tutorial). `[sub]` below is the sub button for the device the player last used
  (`G.input.lastDevice`): "RMB or E" on keyboard and mouse, "RB" on a pad, drawn with the existing glyph helpers
  (`ui-icons.js keycap / mouseGlyph / padGlyph`, as the controls screen does). Never a hard-coded "E".
  - The first two times per match that the player taps it uncooked: "Hold [sub] to cook the Glide Bomb: shorter slide,
    bigger blast".
  - While holding: no prompt (the guide speaks).
- **Feed and death screen:** weaponId `'glide'` (the name and icon come from SUBS / SUB_ICONS).

### A10. Tests (`tools/botlab/tests/sub-glide.js`, testbox, hits logged and not dealt, as `sub-tweaks.js`)

1. A tap (held 0.1 s) slides 15.4 ± 0.5 m on the flat deck and blows at 2.40 s ± 1 frame. Holds of 0.75 / 1.35 /
   1.95 s (cooks of 0.6 / 1.2 / 1.8 s) give 13.1 / 9.8 / 5.5 m (± 0.5) and radii 2.53 / 2.87 / 3.2 (± 0.02, from the
   `bomb:explode` radius). It never blows in the hand. Holding 4 s: it slips at held 2.95 s ± 1 frame (ink −65, a
   full-cook slide), not later. After the slip, keep holding to 4 s and release: no second stone, no "Can't use", no
   second ink payment (`subSpent`).
   Run all of this at dt = 1/60, 1/30 and 1/24: the stop point is the same within 0.05 m (the fixed step).
2. The lane: ≥ 90 % of the ground track is inked, and the lane is ≥ 1.0 m wide at the middle of the slide.
3. Bounces:
   - off the testbox wall at 45° to the wall, it leaves at 39° ± 3° (normal part × 0.8) with speed × 0.83 ± 0.03;
   - off a riser > 0.3 m, it bounces; over a 0.25 m step, it rides up;
   - off an enemy kid, it bounces with × 0.6 and does no damage on contact;
   - through a teammate, it passes.
4. Off a ledge, it falls and keeps sliding. Into the sea, there is no blast and no paint after the plop.
5. Damage at the blast: 180 within 0.8 m, the k² falloff, 35 at R; none behind a wall (LOS). Devices in radius take
   40 → 60.
6. Shot down by 2 Spritzer shots: a puff, no blast, `'device:hit'` and `'device:down'`. A teammate's shots do nothing.
7. Splatted while cooking: a fizzle, ink unchanged, `[5, 0]` recorded. The same for a runner `reset()` mid-cook (the
   stand-in for a pipe capture or a Bazookarp pick-up): the fizzle within 0.15 s + 1 frame, no ink, no stone.
8. The aim guide's end ring sits within 0.3 m of where the real stone stops, for 6 scripted throws (with 0 to 2 bounces).
9. Bots: a fighting bot throws one at a foe 10 m off, and its stop is within 2 m of the foe's led spot. A bot in a
   predicted stop disc leaves it before the blast (`SPECIAL_STATS.escapes` increases), or shoots it.
10. Online (`net-subs5.cjs`, below): the ghost's blast is within 0.3 m of the owner's; a pop on the guest's screen
    reaches the owner and ends it everywhere; while the host cooks, the guest's copy of the host's hand shows cook
    levels 1, 2, 3 in order (each within 0.3 s of the host's mark).
11. Lava and the shell, with stubs in the testbox:
    - a stand-in `G.match.lava = { surfaceAt, under, covers, fizzle }` whose surface is 0.5 m over one half of the
      deck;
    - a stand-in `G.objTargets = { spheres(out), splash(...) }` with one solid sphere, r 1.6.

    It sinks with no blast where the "lava" is. It bounces off the sphere (the exit angle as test 3). Its blast calls
    the stub's `splash` once, with 180 / 35 and the cook's R.
12. The main weapon is locked while cooking.
    - A Spritzer held on fire with the sub held for 1 s fires no shot from held 0.15 s + 1 frame on.
    - A charger mid-charge when the cook starts drops the charge with no shot, and the stone stays in hand and keeps
      cooking (`dropCharge` keeps `aimingSub`).
    - A tap (0.1 s) never interrupts the fire.
    - Diving while cooking still fizzles the stone (test 7).
    - Under a Bomb Barrage stand-in that hands out the Glide, a held throw never cooks (radius 2.2) and never stops the
      main weapon.

### A11. Balance levers and what to measure

- **Levers:** inkCost, speed0 / decel (reach), fuse, cookMax, the radius range, hp, trailRadius.
- **Measure** (Mac mini, `SUBS='all=glide'` against `SUBS='all=bomb'` with the same `WEAPONS`, Turf 180 s, 4 stages,
  16 matches per arm; then head to head `team0=glide;team1=bomb`, 16 matches):
  - splats per 100 uses;
  - damage per use;
  - turf per use (m²);
  - uses per match;
  - the cook spread (bots);
  - the share popped or sunk.
- **The close-range human arm** (bots never play the full-cook roll, so the bot A/B understates it). A scripted page
  test on the testbox, 40 trials per arm: a scripted thrower cooks fully and rolls the Glide at a scripted foe 3 m away
  who starts strafing at 6 m/s when the stone leaves the hand (a fixed reaction of 0.25 s); the same thrower throws a
  Splat Bomb at the same foe instead. Count splats.
- **Targets:** splats per use 0.8 to 1.25 × the Splat Bomb's, and turf per use 1.0 to 1.5 × (the lane). In the close
  arm, the full-cook Glide's splat rate at most 1.1 × the Splat Bomb's. Over that, the first lever is the full-cook
  radius (3.2 → 3.0), then inkCost 70.

---

## B. Scrap Sentry (`sentry`)

> User: "A deployable that the player can place down, and it will shoot in a turret mode. It shoots with its
> Splattershot-like weapon. The weapon is made from recycled materials."

The Spritzer is this game's Splattershot, so the sentry fires Spritzer-style rounds: the same teardrop look, trail and
ink, with smaller numbers.

### B1. Behaviour

1. **Place.** Release the sub (`placed: true`, `noArc: true`). The sentry is set down on the floor 0.9 m ahead of your
   feet along your aim yaw; if that fails, at your feet. A spot is valid only if all of these hold:
   - the floor is found by a ray from 0.6 m above, 2.2 m down;
   - the floor's normal.y ≥ 0.85;
   - |floor y − feet y| ≤ 0.6 (≤ 1.6 when you're in the air);
   - there is line of sight from your chest to the spot;
   - it is not a roof, rail, perch or water, and not lava now or within 1 s (`G.match?.lava?.covers(x, z, floorY, 1)`,
     caldera; absent elsewhere);
   - it has 0.4 m clearance from walls;
   - it is at least `G.level.spawnBarrier + 4` from the enemy spawn pad (8.2 m on every stage today). Read the
     barrier from `G.level`; never hard-code 4.2;
   - **it is at least 4.0 m from every live sentry of your own team** (centre to centre, horizontal). Your own older
     sentry doesn't count: it is about to be replaced. A tower deck (2.5 × 2.5 m) therefore holds one.

   (There are no pipe aprons: the aquarium's final ENGINE.md doesn't support them, §0.6.)

   If no spot is valid, the sentry refuses (`blocked()`): "Can't use", the ink is kept, and `blockedWhy()` names the
   first failed rule on the callout's second line (B9, §0.5).
   **One per player.** Placing a second folds up the first, which pops harmlessly.
2. **Unfold:** 0.6 s. It thumps down, three legs ratchet out, and the head pops up. It can be shot during the unfold, but
   doesn't fire. It faces your aim yaw.
3. **Watch.** Its eye sits 0.55 m up, and it sees all round (360°) out to 11 m (muzzle to chest), **by the bots' sight
   rules** (`botSight.js`):
   - a line of sight to a foe's chest or head (grates and rails don't block);
   - a squid still under its own ink is seen only within 2 m;
   - a swimmer's ripples are seen within 1 to 9 m (by speed) after 0.45 s of looking;
   - nothing through walls, and nothing through an intact Bazookarp shell: a segment-sphere test against
     `G.objTargets?.spheres?.(out)`, before any ray (§0.6).

   It looks every 0.2 s (staggered by gid), at most 2 rays per foe in range. Each ray is `botSight.sightRay(a, b)`
   (§0.5), out of the shared 24-a-frame budget; a `null` (over budget) defers the rest of that look to the next frame.
   Its sight runs only on the owner's screen.
   With no target it idles, the head sweeping ±45° round its facing at 40°/s.
4. **Target.** The nearest visible foe in range that it can hurt. It skips any target with
   `botSpecials.immunity(e, mx, my, mz) < 0.3` (the muzzle's position; the threshold the bots use): Bubble Guard,
   Kraken, more than 1 s of spawn invulnerability, a Crab Rig from the front. **It never targets a foe within
   `G.level.spawnBarrier + 1` m (5.2 m today) of that foe's own spawn pad**, so no sentry, however placed or carried,
   fires into a spawn. It keeps its current target unless another is 1.5 m nearer.
5. **Lock:** 0.4 s on a new target. The head snaps toward them, the bottle-cap lamp blinks white, it goes "bip-bip", and
   a faint team-coloured aim line runs from the muzzle to them for those 0.4 s (`'sentry:lock'` { obj, target }). A
   target lost for under 0.6 s and seen again needs no new lock.
6. **Fire.** Bursts of 3 shots, 0.11 s apart, with 0.5 s from a burst's last shot to the next burst's first (4.2
   shots/s). It aims at the target's **current** chest, with no lead: a crude gun, so a target moving across it at range
   mostly gets missed. The head turns at 4 rad/s in yaw and 3 rad/s in pitch, pitch limited to −35° … +50°, and it
   fires only while within 6° of the target.
   - **It aims for the drop.** The rounds fly straight for 0.12 s (3.6 m), then fall under gravity 28 with drag 0.8:
     uncorrected they would drop about 0.3 m by 8 m and 1 m by 11 m. The head's pitch is solved with
     `G.projectiles._ballistic(muzzle, dir, chest, 30, 0.12, 28, 0.8, 11)`, the same solver the Squall Spinner uses
     (weapons.js:1381), so a still target at 11 m is hit. The spread is added after the solve.
   - Each round is `G.projectiles.fireCustom(owner, muzzle, solvedDir ± spread, { type: 'shot', speed: 30, damage: 22,
     straight: 0.12, range: 11, radius: 0.7, size: 0.13, trailEvery: 1.2, trailRadius: 0.36, grav: 28, drag: 0.8,
     weaponId: 'sentry' })`.
   - Its ink counts as the owner's turf and charges the owner's meter, as Sprinkler drops do. Its hits are the owner's,
     credited as `'sentry'`.
7. **Life:** 15 s. Its tank (a clear bottle on its back) drains visibly over the 15 s. From 12 s it sputters: smoke
   puffs and a coughing nozzle, though it still fires. At 15 s it folds and pops harmlessly.
8. **Damage.** Enemy fire of every kind, by the wave-1 rule, at 120 hp. Below 40 hp it sparks and trails smoke. At 0 it
   breaks into a burst of tin bits and ink, with `'device:down'` (how `'shot'`, emitted by the kit, §0.2) and the
   owner's "SENTRY DOWN" note (`'sub:note'`, B3).
9. **The owner splatted:** it folds and pops at once, like the Twirl Sprinkler (Open question 3).
10. **The tower** crushes it if the tower's body runs into it. Placed on the tower's deck, it rides and keeps shooting.
    On any moving floor it rides (`b.dp`, through its ride body, §0.2). A mover pushing into it lifts or shoves it, and
    crushes it if there is nowhere to go (wave 1's `_pushes`).
11. **Carried toward a spawn.** A sentry whose foot comes within `G.level.spawnBarrier + 4` m (8.2 m) of the enemy pad
    while riding anything folds at once (record `[2, gid, 3]`). The placement rule is checked only at placement, so this
    closes the tower-deck route. (Today no tower goal comes that close: the goals are 11.6 m (lockgate), 11.8 m
    (saltpan), 12.3 m (kelpline), 13.3 m (crossmarket), 14.9 m (tidewater) and 18.3 m (terraces) from the enemy pad,
    measured from `tower-data.js` and the layouts. The rule is for future movers and Bazookarp layouts.)
12. **Solidity.** Not solid to players (§0.1). Its hit capsule (r 0.32, h 0.72) stops shots and beams, and the Glide
    bounces off it.

### B2. Numbers (`SUBS.sentry`)

| key | value | why |
|---|---|---|
| inkCost | 65 | It deals damage for its whole life. Sprinkler 60, Beacon 70. The lever runs 60 to 70. |
| placed, max | true, 1 | "Place down". One a player keeps it a side tool. |
| spacing | 4.0 m | From any live sentry of your team (B1.1). Four teammates can't stack four turrets at one choke or on one deck. |
| spawnPad | `spawnBarrier + 4` placement and carry; `spawnBarrier + 1` targeting | B1.1, B1.4, B1.11. |
| hp | 120 | The wave-1 Beacon value. That is 4 Spritzer shots (0.3 s), 1 full charge, 1 Blaster direct, 2 Splat Bombs (60 each), or 1 roller roll (140). |
| setup | 0.6 s | Placing it in someone's face doesn't work. |
| life | 15 s | Area denial for a push, not a permanent post. |
| range | 11 m | The Spritzer reaches 12.5, so a shooter outranges it by 1.5 m. The Blaster's 10.5 is about even. |
| lock | 0.4 s | Readable: the aim line and the bip are the warning. |
| burst, burstGap, burstPause | 3, 0.11 s, 0.5 s | 4.2 shots/s, against the Spritzer's 10. |
| damage | 22 | 61 % of a Spritzer round. Five hits to splat. A reading to confirm with the user: Open question 21. |
| speed, straight, spread | 30 m/s, 0.12 s, 4.5° | At 8 m the spread is ±0.63 m. A still target gets hit, a strafing one at range mostly gets missed. The drop is solved (B1.6). |
| turnYaw, turnPitch, fireCone | 4, 3 rad/s, 6° | It tracks a runner at 2 m or more (6 m/s at 2 m is 3 rad/s). |
| eyeH, muzzleH | 0.55, 0.50 m | |
| hitR, hitH | 0.32, 0.72 | The shot capsule, sized to the drawn model. These are config numbers, so a view-scale change doesn't change gameplay (`sub-scale.js`). |
| devDamage | none | It doesn't blast. Its rounds are ordinary shots: they hurt enemy devices as any shot does. |

**Time to splat a standing target at 6 m, every shot hitting, from the lock starting to the 5th hit:** the 5th round
leaves at 0.4 s lock + 0.22 s (rounds 1 to 3) + 0.5 s + 0.11 s = 1.23 s, and flies about 0.20 s to 6 m (0.12 s
straight for 3.6 m, then 2.4 m slowing under drag 0.8). So **about 1.43 s** (5 hits = 110). A Spritzer player splats in
0.2 s once on target. So the sentry punishes standing still and ignoring it; it doesn't win duels.

Two sentries of one team can still cover one spot from 4 m apart: 6 hits in the first 0.22 s of fire (132), about
0.62 s from the lock to the splat. That is the strongest legal stack; B11 measures it.

### B3. Controls and aim guide

- Hold to see the guide; release to place.
- **Guide** (local): a translucent sentry ghost at the spot it would go, plus a dashed 11 m ring on the floor round it
  at 30 % alpha. Team colour when valid, grey with a small "×" when not (B1.1).
- **HUD:**
  - While your sentry stands, the sub badge carries a small life ring: the 15 s running down (drawn by the kit on
    `G.hud.xh`, §0.5).
  - Its turret mark on the minimap (B4) shows it to the team.
  - When it is destroyed by enemy fire, a short "SENTRY DOWN" callout in the deny slot, quieter than "Can't use", with a
    tin-clank sting: `emit('sub:note', { actor: owner, kind: 'sentry', text: 'SENTRY DOWN' })`, which hud.js shows in
    the same slot without the red ✕ (§0.5). Owner's screen only.

### B4. Model, look, icon, sounds

- **Model** (`registerSubModel('sentry')`). Built about 0.48 m tall in the world; `SUB_VIEW_SCALE.sentry = 1.5` (drawn
  about 0.72 m: hip height on a kid). Everything reads as junk from a beach clean-up, held together with tape.
  - **Legs:** three bent metal rods (gunmetal, `M.metal`), each ending in a **red bottle-cap foot**: a crimped lathe
    with 21 crimps. They are separate parts, so they can unfold (folded along the can in the hand, splayed 35° in the
    world).
  - **Hub:** a **rusty tin can** (#b4623a, corrugated lathe, `M.satin`), its lid half peeled back. There are 3
    mismatched screws (`screw`), and a dented scrap plate on its front (a flattened `superEllipsoid`, faded #d9d2c0)
    with a team-ink squid stencil.
  - **Head:** a **squeezy detergent bottle** lying on its side (faded teal #5fb3a8, `M.gloss`) on a swivel. Its clear
    window shows team ink inside: a per-instance ink mesh whose height drains over the life.
  - **Barrel:** the bottle's spout, lengthened with a short **copper pipe** (#c8793e, `M.metal`) and a dark rubber muzzle
    ring.
  - **Duct tape:** two grey bands (#9aa0a6, `M.satin`, faceted) strap the bottle to the swivel.
  - **Eye:** a **bottle-cap lamp** on top of the head (per-instance emissive). It pulses slowly in team colour when
    idle, blinks white while locking, and glows bright while firing.
  - **Antenna:** a bent **coat-hanger** loop at the back, carrying a cardboard tag (#c49a6c) with a squid doodle. The
    loop is the grip in the hand.
- **Icon** (`SUB_ICONS.sentry`): three splayed legs with red cap feet, a rust can, the teal bottle head pointing right
  with a copper barrel and a grey tape band, the bottle-cap lamp in `currentColor`, and a small ink drop leaving the
  muzzle.
- **Sounds** (`SFX`, plus `SUB_CUE.sentry`; add `'sentry'` to `PLACED_SUBS`):

  | sound | what it is |
  |---|---|
  | `sentry_place` (cue `throw`) | A tin clatter: three short metallic partials (1.8 / 2.9 / 4.6 kHz) and a thud. |
  | `sentry_unfold` (cue `land`) | A ratchet of 6 rapid clicks and a spring "boing". |
  | `sentry_idle` (quiet positional loop, within 10 m) | A 90 Hz servo hum with random creaks. |
  | `sentry_lock` (cue `warn`) | "Bip-bip": two square-wave notes at 1.6 kHz. Heard by everyone within 25 m, louder for the target. |
  | `sentry_shot` | A tinny Spritzer "pft": `shoot_shooter` at pitch 1.25, plus a 2.4 kHz tin ping. |
  | `sentry_hit` | A tin clank layered on wave 1's `device_hit`. |
  | `sentry_sputter` | Three noise coughs. |
  | `sentry_fold` | The ratchet run down. |
  | `sentry_break` (cue `end`) | A can crumple (noise swept down), a clank, and a falling spring boing. |

- **Minimap** (`drawMap`): everyone's sentries, like the Sprinkler's mark (everyone sees sprinklers today): a small
  turret glyph in team colour with its 11 m range circle at 30 % alpha. For your own team only, its life ring.

### B5. Interactions

| With | Result |
|---|---|
| Enemy fire, any kind | 120 hp (wave-1 rule: shots, beams, blasts, roller / brush sweep, rain / vortex / beam / Surf rings). |
| Own team's fire | Nothing. |
| Tower | Crushed by its body (`crushIn`). Rides its deck, one per team per deck (the 4 m spacing). Never fires into a spawn (B1.4); folds if carried within 8.2 m of the enemy pad (B1.11). |
| Movers | Rides a moving floor. Lifted, shoved or crushed by one pushing into it (wave 1's `_pushes`). Not on railcar roofs (they are roofs). |
| Water, lava | Can't be placed in water, or where caldera's `covers(x, z, floorY, 1)` says lava is there now or within 1 s. Rising lava that reaches its foot destroys it: caldera's `destroyWhere` → `lavaSweep(pred)` (or `crushIn({ where })`), how `'lava'`. |
| Bazookarp | The shell blocks its sight (`spheres()` segment test). A stray round that hits the shell counts at face value, as any shot. The re-forming shell crushes it (`crushIn({ sphere })`). §0.6. |
| bluestone era flips | The kit's own `era:flip` listener: destroyed if its floor block is in `off` or its capsule is inside a block in `on` (`'flip'`). |
| aquarium pipes | No apron rule (the stage doesn't support aprons). Pipes and glass are walls to its sight. |
| Other sentries | Your team's: placement 4 m apart. Enemy ones: it targets players only, never devices; its rounds hurt an enemy sentry they happen to hit, as any shot. |
| Glide Bomb | Glides bounce off it. An enemy Glide's blast hurts it (40 → 60). |
| Chain Bobber | Its rounds are team fire: a round that hits its owner's team's bobber sets that chain off. A round that hits an enemy bobber disarms it. It doesn't aim at bobbers. |
| Dash Pellet | The blast hurts it (25). |
| Bubble Guard, Kraken, spawn / landing invulnerability | Not targeted (`immunity()`). A shielded player in its line of fire soaks the rounds (0 damage). |
| Drainbow | Rounds crossing an enemy bubble are halved (projectile path). |
| Ink Jet / Zipline riders | Targeted like anyone in sight and range. A zipping player takes 25 % (wave 1 `zipcheer`). |
| Super jumpers | Not targeted mid-jump. On landing, skipped while invulnerable. |
| Splatted owner | Folds (B1.9). |
| Boss Battle | Targets the nearest crablet in range and sight, else the boss's nearest hit shape (use the bots' boss target list, `bots.js` ~line 3255). Rounds hit through `G.boss.segHit`. |

### B6. Counterplay

- Outrange it: shooters, chargers, the bow, the bucket's lob.
- Approach it swimming: unseen while still, and ripples only after 0.45 s.
- Strafe at range: it doesn't lead.
- Break its sight: it never sees through walls.
- Splat its owner, and it folds.
- Throw a bomb at it: two Splat Bombs kill it.
- It warns before every new target: the bip and the aim line.

### B7. Bots

**Using it** (`SUB_KITS.sentry.bot`):
- `fight(brain, dist)`: a known foe 6 to 14 m off, and the bot not hit in the last 1 s, gives a 2.5 % chance per frame.
  The sentry goes down 0.9 m ahead along the bot's yaw toward the fight. Then `bombCd` 10 to 14 s.
- `paint(brain)`, by mode:
  - **Zone Control:** a `zRole` guard within 6 m of its zone's edge, facing the enemy side, 1.5 % per frame.
  - **Tower Command:** a rider on the deck, 2 % per frame (it rides along). Today `bots.js:1005` calls `_paintSub`
    only when `!onT` ("nothing planted on a moving tower"), so this needs the `bot.rides` exception (§0.5). Only when no
    teammate's sentry is on the deck.
  - **Turf:** only near the front line (progress 0.4 to 0.7, as `_paintSub` measures it), 0.4 % per frame.
- Never with a teammate's sentry within 6 m (the placement rule refuses under 4 m anyway).

**Facing one.**
- **Shooting it.** `devices()` lists it, so wave 1's `deployables-bots.js` shoots it when nothing better is in sight. It
  also gets a threat descriptor `{ kind: 'sentry', ground: true, turret: true, pos, aimY: 0.45, range: 11, hp,
  shootable, target, locked }`. In `bots.js _threatScore`, a new `turret` branch scores it:
  - 2.0 if it is locked on us and we are within range;
  - 0.6 within range;
  - 0 otherwise.

  Then the existing control: shoot it when in reach with a line on it; otherwise `_thrEvade`, picking headings that
  leave its 11 m or break its line of sight. Two changes in `bots.js` make that true:
  - `_threatCtl`: a `turret` branch for `urgent` (the generic one reads `d.speed` and `d.trigger`, which a turret
    lacks): `urgent = locked on us && dist < range`. Out of reach and not urgent: `_thrDrift` as today.
  - `_pickEvade`: the line-of-sight bonus (+2 for a heading whose end point the threat can't see) applies today only
    when `!d.ground`. Make it `(!d.ground || d.turret)`, with the line taken from the turret's eye (`pos.y + 0.55`). Add
    +1.5 for a heading whose end point (3.2 m out) is beyond `d.range` from it.
- **Being hit by it.** A hit by its rounds makes the bot notice that sentry at once. Its position becomes threat memory;
  it does not reveal the owner. `botSight` already treats sub ids as "not a weapon".
- **Routing round it.** `botSpecials.specialDangers()` lists each enemy sentry as a disc of 11 m with `los: true`,
  `lethal: 1`, `linger: true`, `vis: 'big'` (it's a visible machine). The team's route cost then steers bots round its
  sight unless they mean to kill it.

### B8. Online (kit kind `sentry`)

| record | meaning |
|---|---|
| `[0, gid, x, y, z, nx, ny, nz, yaw]` | Placed. A ghost unfolds. |
| `[4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]` | Wave 1's word on where it sits (§0.2): on a moving block, which block (its tag) and where on it, in the block's own axes; or back on still ground. Sent whenever it settles on, is lifted onto, shoved off or dropped from a block. The ghost hands it to `G.deploy.netOn(rb, data)`. |
| `[3, gid, targetNid \| -1]` | Locked onto, or lost. The ghost turns its head to that actor as this screen shows them, and plays the lock tell. |
| `[6, gid, yaw, pitch]` | A burst starts. The ghost plays 3 muzzle flashes and `sentry_shot` 0.11 s apart. The rounds arrive by themselves: owner projectiles are recorded automatically (`Projectiles._push → recProj`). |
| `[2, gid, why]` | Gone: 0 timed out or folded, 1 shot down, 2 crushed (tower, mover, shell, era flip, lava), 3 owner splatted, replaced, or carried too near the enemy spawn. |

When its owner leaves the room, every screen ends its ghost at once (`dropOwner`, §0.4).

Hits on a ghost → `netHurt(owner, 'sentry', gid, dmg, by)`. The `netMuted()` rule holds (§0.4). Sight and targeting run
only on the owner's screen (the host for bots), against the positions it shows.

### B9. HUD, prompts, picker

- **Picker blurb:** "A turret built from junk. Set it down and for 15 s it shoots foes it can see with a little ink gun,
  until it's shot down. One at a time." Ink cost 65 %.
- **Prompts** (on a refusal: "CAN'T USE" with the first failed rule as its second line, from
  `SUB_KITS.sentry.blockedWhy`, through `'sub:cantuse'.reason` and hud.js `_cantUse(kind, reason)`, §0.5):
  - Floor, slope, height, sight, clearance, water, lava: "Set it down on open ground".
  - Near the enemy spawn: "Too close to their spawn".
  - Within 4 m of a teammate's sentry: "Too close to another sentry".
- **Feed:** `'sentry'`. A splat by it reads "<owner>'s Scrap Sentry".

### B10. Tests (`tools/botlab/tests/sub-sentry.js`)

1. **Placement:**
   - on flat ground, 0.9 m ahead;
   - at the feet when a wall is closer;
   - refused, with "Can't use" and the ink kept, in mid-air 3 m up, on a roof, in water, and 6 m from the enemy pad;
   - with a teammate's live sentry 3.9 m away: refused with "Too close to another sentry"; at 4.1 m: placed. Your own
     older sentry 1 m away doesn't block (it is replaced);
   - with the lava stub of A10.11: refused on the "lava" half (and where its `covers(…, 1)` says lava arrives within
     1 s), placed on the dry half;
   - every refusal shows its reason line (`'sub:cantuse'.reason` matches B9's text);
   - a second one replaces the first.
   - **Spawn rules:** a scripted foe standing 5.0 m from their own pad, in the open, 9 m from a live sentry, is never
     locked or fired on (5 s); at 5.4 m it is. A sentry on a test mover (`L.addDynamic`, as `input-swim.js` does)
     driven to 8.0 m from the enemy pad folds with `[2, gid, 3]`. With the testbox's `spawnBarrier` changed to 5.0,
     the thresholds move with it (9.0 m placement, 6.0 m targeting).
2. **Unfold:** no shot before 0.6 s.
3. **Sight:**
   - a kid at 10 m in the open is locked in 0.4 s ± 1 frame and fired on;
   - one behind a wall is not;
   - one at 12 m is not;
   - a still squid in its own ink at 3 m is not, and at 1.5 m is;
   - a swimmer at 6 m is noticed after ≥ 0.45 s.
4. **Fire:** bursts of 3 at 0.11 s, a 0.5 s pause, 22 per hit (logged), weaponId `'sentry'`. On a standing dummy at
   6 m with spread off: the 5th hit at 1.43 s ± 2 frames from the lock's start. On standing dummies at 8, 10 and 11 m
   (the same height, and 1.5 m lower) with spread off: every round hits (the drop is solved). On a dummy strafing at
   6 m/s at 9 m with spread on: under 35 % of rounds hit (crude aim), over 200 rounds.
5. **Skips:** a Bubble Guard target, a spawn-invulnerable one, a Kraken. It retargets to a hurtable foe in range.
6. **Life:** its tank level falls over 15 s; it folds at 15 s with no blast; it folds when its owner is splatted.
7. **Device rules:** it dies to 4 Spritzer shots, 1 full charge, 2 Splat Bombs, and 1 roller roll; own-team fire does
   nothing; the tower crushes it; on the tower deck it rides and fires; railcar roofs refuse placement (test 1); on a
   Treehills pod it rides; a test block growing up under it lifts it onto its top, one spreading into it shoves it
   out, and one boxed in by walls crushes it. `'device:hit'` drives the hit marker and the white flash shows.
   `G.deploy.crushIn` with each shape (`blocks`, `sphere`, `where`) destroys it with the matching `how`, and
   `SUB_KITS.sentry.lavaSweep(pred)` does too (`'lava'`). A scripted `era:flip` with its floor block in `off` ends it
   (`'flip'`); one with a block in `on` around it ends it. Every ending fires exactly one `'device:down'` (§0.2).
   A ghost shot (`netMuted()` held up by the test) passing through it does nothing.
   With a stub `G.objTargets.spheres()` sphere between it and a foe in range, the foe is not locked.
8. **Bots:** a guard bot places one at its zone. A Tower Command rider places one on the deck. A bot it locks onto,
   armed with a Spritzer, shoots it down. A roller bot it locks onto, out of reach, leaves its range or sight within
   3 s. `deployables-bots.js` picks an idle enemy sentry (`DEV_BOT.sentry` increases).
9. **Online:** the ghost unfolds where the owner's did; the guest sees the lock tell and the bursts; a guest's shots
   take its hp on the owner's screen, and the owner's `'device:down'.by` is the guest's actor; it is gone everywhere
   at 0. On the tower deck (`NET_ARGS='scene=tower'`) the ghost rides at the owner's spot within 0.1 m. When the
   guest who owns a sentry leaves, the host's ghost of it is gone within 1 frame of `onLeave`.

### B11. Balance levers and what to measure

- **Levers:** damage, burst / pause, lock, range, spread, hp, life, inkCost, setup.
- **Measure** (Mac mini; `SUBS='all=sentry'` against `'all=sprinkler'` and against `'all=waddle'`, same weapons; Turf
  and Zone Control, 4 stages, 16 per arm; plus `MODE=tower` 8 matches, the deck ride; plus a **stacked arm**: Zone
  Control, 4 stages, 16 matches, where every guard bot on a team places its sentry at the legal spot nearest its
  team's other live sentry (4.0 to 4.5 m away), so each team fields up to 4 sentries clustered on its zone edge):
  - damage per sentry;
  - splats per sentry;
  - the share of its life spent locked;
  - how it ended (shot / timed out / owner splatted / crushed);
  - hp left when it timed out;
  - its turf;
  - the enemy deaths within 11 m of a live sentry.

  (Builders: add a SENTRY line to `match.cjs`, as the SURF line.)
- **Targets:**
  - ≥ 35 % of sentries shot down by enemies (counterplay works);
  - splats per match by sentries no higher than the top existing sub's +10 %;
  - in Tower Command, the deck-riding sentry's splats per use ≤ 1.5 × its ground use;
  - in the stacked arm, splats per sentry ≤ 1.3 × the spread-out arm's. Over that, raise `spacing` to 6 m first.

---

## C. Chain Bobber (`bobber`)

> User: "A floating bomb that explodes after being attacked by a weapon. The more you link together, the bigger the
> explosion. They can be connected by a tether if nearby, but enemies can disarm them by shooting them. This uses 40%
> in, and you can throw out as many as you like, but they disappear after a fair bit of time."
> Lead's reading: own-team fire sets one off and the blast runs along the tethers; enemy fire disarms the one hit (and
> breaks the chain there); 40 % each; no cap; a long timer.

### C1. Behaviour

1. **Throw.** A normal bomb lob (`throwVelocity`, throwSpeed 12), using the standard arc and landing ring plus an overlay
   (C3).
2. **Deploy.** On first touching anything, it pops open: an inflate from 40 % to 100 % scale over 0.35 s while rising to
   its float spot.
   - **Floor hit:** 1.0 m above that floor.
   - **Wall hit:** 0.45 m out from the wall at the hit height, with its height clamped to between 0.6 and 2.2 m above
     the floor below.
   - **Ceiling hit:** 1.0 m above the floor below.
   - **Bazookarp shell hit:** 0.45 m out from the shell's surface along its normal, height clamped as for a wall
     (`G.objTargets?.spheres?.(out)`, §0.6).
   - **Over liquid, or with no floor within 6 m below:** 1.0 m above `liquidTop(x, z)` (§0.5): the sea at −1.6, or
     caldera's lava (`G.match.lava.surfaceAt`) where there is lava. In general the float height is 1.0 m over the
     higher of the floor and `liquidTop`, re-checked every 0.25 s and eased at ≤ 1 m/s, so a bobber rides rising lava
     up and settles back as it falls.
   - **Re-floating.** When the floor under it goes (`lost()` from wave 1's `_lost`: the block it rode moved away or
     parked; or bluestone's `era:flip` put its floor in `off`), it doesn't end. It re-floats 1.0 m over whatever is
     below by the same rule (floor within 6 m, else `liquidTop`), easing at ≤ 3 m/s. The owner records a new `[3]`
     (C8), and its chain re-links. A ghost re-floats the same way and snaps to the owner's `[3]`.
   - It can't deploy within `G.level.spawnBarrier + 2` m (6.2 m today) of the enemy spawn pad: it fizzles there with a
     puff (`[2, gid, 3]`). That stops spawn traps. (No pipe aprons: the aquarium doesn't support them, §0.6.)
   - **The settled spot is rounded** to 0.01 m (the precision the `[3]` record carries), on the owner's screen too, so
     every screen holds exactly the same float spot.

   It is live once settled. It bobs ±0.05 m at 0.7 Hz and turns slowly; the bob is drawn only, and every rule uses the
   settled spot. **It is not solid:** players and bombs pass through it. Shots and beams are a different matter: any
   team's shot or beam that touches it is absorbed there (C5). It triggers on nothing but fire.
3. **Tethers.** When one of your bobbers settles, your bobbers re-link:
   - Any two of **your own** live bobbers within **5.0 m** (centre to centre), with a clear line between them, are
     candidates. Walls block the line; grates and rails don't (`physics.los`).
   - Candidates are taken nearest first, ties broken by the lower pair of gids, and each bobber takes at most
     **3 tethers**.
   - A **chain** is a connected group, and **N** is its size.

   Re-link on settle, on removal, and every 0.5 s while any of yours rides a moving floor. A tether that stretches past
   5.5 m or loses its line snaps (spark, tick). **Only the owner links.** Every time the owner's tether list changes,
   it records the whole list (`[5, …]`, C8), and every other screen draws exactly that list. Ghosts never compute
   links, so both screens always show the same tethers.
4. **Own-team fire sets it off.** Anything from the owner's team that would hurt an enemy device sets off the whole
   chain of the bobber it touches:
   - shots, flung ink, drops, sentry rounds, beams, blasts, roller and brush sweeps, standing fire;
   - the owner's own fire included;
   - teammates' fire too.

   The touched bobber blows first. Then the blast runs out along the tethers, breadth-first, **0.07 s per hop** (a spark
   races down each tether). Every bobber in the chain blows at its own spot, at the size for that chain's N at the
   moment of triggering. A blast is own-team fire, so it also sets off your team's other chains within its radius: those
   are separate explosions.
5. **One chain, one explosion per victim.**
   - **Players.** A foe caught by several blasts of the same chain takes only the strongest of them. Each later blast
     adds only the excess over what that victim already took from this chain. The kit keeps the ledger (`chain.taken`:
     victim → most dealt).
   - **The boss's body and the Bazookarp shell** apply blast damage themselves (`boss.splash`, boss.js:304, returns
     nothing; `G.objTargets.splash` likewise), so a ledger can't trim them. Instead each takes **exactly one blast per
     chain**:
     - At the trigger, for each such target, the chain picks the bobber whose centre is nearest the target's surface,
       within R(N), with a clear line from 0.3 m above it to the nearest surface point. For the boss, the surface is
       its active, non-weak `G.boss.model.hitShapes` (the shapes `boss.splash` itself measures from). For the shell, it
       is `G.objTargets.spheres()`.
     - Only that bobber's blast reaches the target, when it blows: `G.boss.splash(owner, c, R, max, min, 'bobber',
       { body: true })` and `G.objTargets?.splash(owner, c, R, max, min, 'bobber')`.
     - Every bobber in a chain blows at the same R and damage, so the nearest is the strongest blast.
     - Without this, a 24-bobber chain round HULLBREAKER would deal up to 24 × 180.
   - **Crablets.** Every bobber's blast calls `G.boss?.splash(owner, c, R, max, min, 'bobber', { body: false })`, which
     hits only the crablets (the `body` option, §0.5). A crablet inside two blasts of one chain takes both: `boss.splash`
     gives crablets a flat `dmax` with no ledger. They are minions, and N ≥ 3 kills one anyway.
   - **Devices** take each blast that reaches them, as wave 1 deals it.
6. **Enemy fire disarms it.** Its hp is **25**: one hit of any gun's main shot (Spritzer 36, Twinfire and Dualies 30,
   Splatling 28, Squall Spinner 26, any charger beam, Blaster, bucket, a roller's flick, a Mitts fist), and any blast
   (device damage: Pop Pellet 25, Lurk Mine 30, Splat Bomb 60). Only the small hits need more: the Brolly's 8-damage
   pellets (4 of one blast), a brush's far swipe drops (12), a tapped bow arrow (14 to 20), Sprinkler drops (8).
   Enemy damage of every kind (the wave-1 rule) that reaches 25 disarms it:
   - its lamps die, and its tethers snap with a spark and a tick;
   - it sags and drops, then pops in a puff 0.4 s later, with no blast and no damage (`'device:down'` how `'shot'`,
     emitted by the kit, §0.2);
   - its chain splits there, and the rest re-link.

   An enemy blast disarms every bobber whose centre is within the blast's radius + 0.2 m (its hitR; no line-of-sight
   test, as wave 1's `damageArea` for devices): a Pop Pellet, a Dash Pellet's take-off blast, a lone enemy bobber, a
   Splat Bomb. Any bomb clears a cluster: that is the counter to a web. Only standing fire with small ticks
   (an Ink Tempest's rain, 34 a second) takes more than a moment.
7. **Life:** 30 s each. It blinks for the last 3 s, then fizzles harmlessly and the chain re-links.
8. **The owner splatted:** the bobbers stay. They are placed things, and any teammate can still set them off.
9. **No cap on how many**, per the user. There is one invisible technical guard: 24 live bobbers per player, past which
   the oldest fizzles (Open question 8). The real limits are the ink (40 each; about 1 s of swimming refills one) and the
   30 s life. The worst case the game must carry is 8 players × 24 = 192 live bobbers; C4.1 gives the drawing and CPU
   budget for it and the test that proves it.
10. **Movers and the tower.**
    - Over a moving floor (tower deck, pod, railcar roof) it rides it, through its ride body (§0.2): its foot (float
      spot minus 1.0 m) rides the block, and the bobber floats 1.0 m over it.
    - The tower's body crushes it (`crushIn`). A mover pushing into its foot lifts or shoves it (wave 1's `_pushes`);
      a block that reaches its body is caught by the 0.1 s centre test (§0.2). Crushed: harmless, and the chain splits.
    - A block it rode that moves away or parks leaves it floating: it re-floats (C1.2), even over the sea.
    - Era flips (the kit's own `era:flip` listener), the re-forming Bazookarp shell (`crushIn({ sphere })`) and caldera's
      lava (`liquidTop`, `lavaSweep`): §0.6.
11. **An owner who leaves the room** takes their bobbers with them: every screen ends their ghosts at once
    (`dropOwner`, §0.4).

### C2. Numbers (`SUBS.bobber`)

| key | value | why |
|---|---|---|
| inkCost | 40 | The user. The same as the Pop Pellet. |
| throwSpeed | 12 | A little shorter than a Splat Bomb (13.5): it is set up near you. |
| floatH, wallOut, floatMin / Max | 1.0, 0.45, 0.6 / 2.2 m | About shoulder height. A blast at 1.0 m reaches a kid's chest (0.7) and a squid (0.3) next to it. |
| deployTime | 0.35 s | |
| linkRange, linkSnap, maxTethers | 5.0, 5.5 m, 3 | 5 m reads as "nearby" on screen and lets 4 bobbers span a 15 m lane. Three tethers each keeps webs readable. |
| hopDelay | 0.07 s | A 4-chain finishes in 0.21 s. A running foe (6 m/s) moves 1.3 m: enough to see the spark coming, not enough to escape. |
| hp | 25 | One main shot of every gun (the least is the Spinner's 26) and any blast (device damage 25 and up) disarms (C1.6). The user asked that enemies can disarm them by shooting. Revision 1 had 30, which let the Spinner, the Splatling, the Pop Pellet, the Dash Pellet and a lone bobber fail to disarm, against its own tests. |
| life | 30 s | "A fair bit of time": longer than any device but the Sprinkler. |
| hitR | 0.20 | The shot sphere (config). |
| maxPerPlayer | 24 | The hidden guard (C1.9). |
| noDeployR | `spawnBarrier + 2` (6.2 m today) | From the enemy spawn pad. |

**The blast by chain size** (every bobber in the chain blows at this size):

| N | radius | damage max / min | paint | device damage | lethal core (full-health foe) |
|---|---|---|---|---|---|
| 1 (lone) | 1.8 | 60 / 25 | 1.3 | 25 (disarms an enemy bobber) | none: about a Pop Pellet splash; it chips |
| 2 | 2.2 | 95 / 30 | 1.7 | 35 | none: it splats a foe who is already hurt |
| 3 | 2.6 | 140 / 35 | 2.1 | 45 | ≤ 1.18 m |
| ≥ 4 (cap) | 3.0 | 180 / 35 | 2.5 | 60 | ≤ 1.53 m: Splat Bomb grade |

**Where it stops growing:** at 4. A bigger chain still covers more ground, because every bobber blows, but each blast is
the 4-size. So 4 bobbers (160 % of a tank, refilled along the way) buy four Splat-Bomb blasts strung along a lane, and a
lone one is a 40 % pellet. The user wrote "the more you link together, the bigger the explosion" with no limit; the
cap is a reading to confirm (Open question 20).

### C3. Controls and aim guide

- **Throw** like a bomb: hold to aim, release to throw.
- **Guide** (local, on top of the standard arc):
  - a team-coloured float marker 1.0 m above the landing ring, with a dotted drop line;
  - dashed preview tethers to your live bobbers within 5 m of that float spot;
  - a small "×N" label (the chain it would make).
- **HUD:**
  - Next to the sub badge, a count of your live bobbers ("×7"), with a thin ring for the oldest one's time left.
  - When a chain of yours goes off, a callout by the crosshair: "CHAIN ×4" (N), with a hit tick per foe it caught.
  - When a foe disarms one of yours: a quiet low "doo" (yours only).
- **The teammate cue.** Teammates' shots are the main trigger, so every player on the bobbers' team (the owner too)
  gets a cue on any of the team's chains. A chain **glows** (its tethers and lamps at 1.6 × brightness, pulsing at
  3 Hz) while an enemy that this player can see is within R(N) − 0.3 m of any of its bobbers. "Can see": the enemy is
  on screen and `physics.los` from the camera to their chest is clear, checked every 0.1 s (no wall-hack: the HUD
  never shows a foe the player couldn't see). When that player also has a line from their eye to a bobber of that
  chain within their weapon's range, a small "Shoot to set off" hint sits on the nearest such bobber (screen-space,
  like the jump marker's name). Enemies never see the glow or the hint.

### C4. Model, look, icon, sounds

- **Model** (`registerSubModel('bobber')`). Built Ø 0.24 m world; `SUB_VIEW_SCALE.bobber = 1.5` (drawn Ø 0.36 m). A
  fishing bobber made a bomb, so its silhouette reads "float", unlike the Surf N' Turf buoy machine (big, boxy):
  - a sphere with a **team-ink upper half** and a **cream lower half**;
  - a dark equator band with a hazard pinstripe above it;
  - **4 small lamps** on the band (per-instance emissive) that show the chain's N, 1 to 4, for both teams: foes can read
    how big it will blow;
  - a short dark stem on top ending in a **metal eye-ring** (the tether anchor);
  - a stubby dark rubber **keel spike** underneath;
  - a squid decal on the cream half.

  The hand grip is the stem (the held model is an ordinary `registerSubModel` mesh). **In the world, bobbers are drawn
  instanced** (C4.1), never as one mesh group per bobber. The world bobber bobs and turns.
- **Tethers:** a tube from eye-ring to eye-ring, radius 0.025 m, sagging 0.15 m per 5 m (a quadratic through the
  midpoint). Team colour, with a scrolling shimmer (UV scroll shader). Brightness rises with N (0.6 / 0.75 / 0.9 / 1.0).
  When a chain is triggered, a white-hot spark runs down each tether, taking 0.07 s. Drawn instanced, with the sag and
  the bob done in the vertex shader (C4.1).
- **Icon** (`SUB_ICONS.bobber`): two bobbers (team top, cream bottom, dark band), the right one higher, joined by a wavy
  tether with a small spark star in the middle.
- **Sounds** (`SFX`, plus `SUB_CUE.bobber`; add to `THROWN_SUBS`; `FLIGHT_KIND.bobber`, a light voice):

  | sound | what it is |
  |---|---|
  | `bobber_throw` (cue `throw`) | A light "bloop" whoosh. |
  | `bobber_inflate` (cue `land`) | A "fwip": noise swept 600 → 2400 Hz plus a small squeak. |
  | `bobber_link` | A "zing": sine 900 → 1800 Hz, a semitone higher per N. |
  | `bobber_fuse` | A crackle that runs down the tethers, one hop at a time. |
  | `bobber_boom` (cue `boom`) | N = 1 is a pellet-sized pop; N ≥ 4 a big low boom. Pitch is 1.15 − 0.08 × (N − 1); gain rises with N. |
  | `bobber_disarm` (cue `end`) | A deflating "pfffw" and a fizzle. |
  | `bobber_expire` | A quiet pip-pop. |

- **Minimap** (`drawMap`): every live bobber, any team (they are in plain sight), as small team-coloured dots with their
  tethers as thin lines.

### C4.1 The budget for "as many as you like"

The worst case the game must carry is 8 players × 24 = **192 live bobbers** and up to 3 tethers each (at most
192 × 3 / 2 = **288 tethers**). Built naively (about 12 meshes a bobber, a tube per tether rebuilt every frame for the
bob) that is about 2,300 draw calls and 288 geometry rebuilds a frame. So it is built like this:

**Drawing.**
- **One `THREE.InstancedMesh` per part per team**, sized for 192 and grown by doubling if ever needed: the two
  half-spheres, the band with its pinstripe (one geometry), the stem with its eye-ring and keel (one geometry), the
  decal, and the 4 lamps (one instanced mesh of 4 × 192). About 6 parts × 2 teams + 2 lamp meshes = **14 draw calls for
  all bobbers**, whatever the count. The lamps' on / off and brightness (N, the blink of the last 3 s, the teammate
  glow) are per-instance colour (`setColorAt`). The decal is per instance too.
- Each frame the kit writes one matrix per live bobber per part (bob, spin, inflate, sag-and-drop). 192 × 6 matrix
  writes is a few tenths of a millisecond.
- **Tethers: one instanced tube** per team: an 8-segment, 6-sided tube along a unit length. Per-instance attributes:
  end A, end B, sag, brightness, spark phase. The vertex shader places each ring along the quadratic between A and B,
  adds the sag, and adds each end's bob (`0.05 × sin(2π × 0.7 × t + phase)`, the bobber's own phase, the same formula
  the matrices use). No geometry is rebuilt per frame; the attribute buffer (288 × 12 floats) is updated only when the
  tether list or a riding bobber's position changes. **2 draw calls for all tethers.**
- Hidden at more than 60 m from the camera (an instance scaled to 0), as other small props are.

**CPU.**
- **A spatial hash** for this kit's bobbers: a grid of 4 m cells over x, z, rebuilt when a bobber settles, moves (rides)
  or ends. `blockShot`, `blockRay`, `damageArea`, `smash` and the linking all ask only the cells their segment, ray or
  radius touches. A projectile segment then tests the 1 to 4 bobbers near it, not all 192.
- **Linking** is done only on the events in C1.3, only for the owner's own bobbers, using the hash.
- **`botAct`** scans every 0.1 s per bot (§0.5), using the hash to find the team's chains near the enemies it already
  knows, and spends rays through `botSight.sightRay` (the shared 24-a-frame budget).
- **The bots' side of a big web.** Three bot systems scale with the number of bobbers:
  - `deployables-bots.js devShootAim` walks every descriptor every 0.35 s per bot. That is a distance test each, and
    a line-of-sight ray only for a candidate that beats the best so far (about log₂ 192 ≈ 8 rays per scan in the
    worst case).
  - `specialDangers()` lists bobber discs **only for armed chains** (C7: a player of the chain's team has a line of
    sight to one of its bobbers within 20 m). Armed is re-checked every 0.25 s per chain, staggered, with rays through
    `sightRay`. There are **at most 48 bobber discs in all** each frame: the bobbers of armed chains nearest any bot of
    the other team, ties by gid. Every bot's route cost and escape tests loop over this list, so the cap bounds them.
  - The teammate cue (C3) is the local player's only: one camera ray per enemy near a chain, every 0.1 s.

**Chain blasts.**
- Damage: each hop level (all the bobbers 0.07 s × k after the trigger) is one pass over the actors, with the ledger
  (C1.5).
- Paint: one splat per bobber, as any bomb.
- Sound: **one `bobber_boom` per hop level**, at the centroid of that level's bobbers, gain × (1 + 0.25 × (count − 1))
  capped at × 2. Never one boom per bobber.
- Effects: the explosion effect per bobber is scaled down so a chain's particles total at most 400 (a level with k
  bobbers gets `min(1, 400 / (k × particles per explosion))` of each). Screen shake once per chain.

**The proof** (`tools/botlab/tests/perf-bobbers.js`, a page test on the testbox, with dynamic resolution held fixed and
the fps cap off):
1. The empty testbox, 8 bots standing still, 600 frames: record the p95 frame time and `renderer.info.render.calls`.
2. The same with 192 live bobbers (24 for each of the 8 actors, spread over the deck in 3- and 4-chains), 600 frames.
3. Then trigger three 8-chains at once and record the 60 frames that follow.
4. **Live bots.** A live Turf match on the testbox, 4 v 4 bots fighting, routing and scanning devices, 1800 frames,
   first with no bobbers, then with 24 bobbers per bot kept topped up by the script (192 live). Record the p95 frame
   time, the bots' think time (the sum of every `BotBrain.think` per frame, `performance.now()` round each), the
   number of `specialDangers()` discs, and `SIGHT_STATS.deferred` per second.
5. Pass:
   - step 2's p95 frame time is within **+2 ms** of step 1, and step 3's within **+4 ms**;
   - draw calls rise by at most **20**;
   - the bobber kit's own `tick` stays under **0.5 ms** a frame (measured with `performance.now()` round it);
   - in step 4, the p95 frame time with bobbers is within **+3 ms** of without, the bots' think time p95 within
     **+1.0 ms**, and `SIGHT_STATS.deferred` at most doubles (the bots' own sight isn't starved).

   Report all of these numbers, and the `recProj` / record rate per second in step 3 (the wire).
6. Run it on the Mac mini through `run.sh` three times (flakiness), and once locally. The page test runs the same
   modules the web build serves, in Electron's Chromium, so it stands for both builds.

If it fails, the levers in order: draw distance (60 → 40 m), the particle cap (400 → 250), the danger-disc cap
(48 → 24), then the hidden guard (24 → 16 per player, Open question 8).

### C5. Interactions

| With | Result |
|---|---|
| Own team's shots, beams, flung ink, drops, sentry rounds | Set off the chain. Every hit is absorbed (`blockShot` returns true; `blockRay` stops at it). |
| Own team's blasts (bombs, Glide, Dash Pellet, specials, other chains) | Set off every own chain they reach. |
| Own team's roller / brush sweep, rain, vortex, beam, Surf rings | Set off the chain (`teamFire` in `devices()`). |
| Enemy fire, any kind | 25 hp, then disarmed (C1.6). Shots are absorbed. |
| Ghost fire (a remote player's shot or blast replayed here) | Nothing: `netMuted()` (§0.4). The shooter's own screen sends the hit. |
| Enemy players | Pass through it. Nothing happens. |
| Glide Bomb | Passes under. Blasts: as the rows above. |
| Scrap Sentry | Its rounds: as shots above. Its body: no contact (the bobber floats). |
| Dash Pellet | Its blast at the take-off point: as blasts above (25 to devices disarms an enemy bobber). So a dash out of your own web sets it off behind you. |
| Tower / movers | Crushed by their bodies. Rides their floors (§0.2). |
| Liquid (sea, lava) | Floats 1.0 m over it, riding rising lava up and down (C1.2). |
| Bazookarp | A chain hits the shell once: the blast of its bobber nearest the shell (C1.5, §0.6). A thrown bobber deploys 0.45 m off the shell. The re-forming shell crushes bobbers inside it (`crushIn({ sphere })`). |
| Boss Battle | A chain hits HULLBREAKER's body once (its bobber nearest the body); every blast hits crablets (C1.5). |
| bluestone era flips | The kit's own `era:flip` listener: ended if a block in `on` appears where it floats (`'flip'`); re-floats if its floor is in `off` (C1.2). |
| aquarium pipes | No apron rule (the stage doesn't support aprons). Pipes and glass are walls: it deploys on them. |
| Bubble Guard / Kraken | 0 damage to them. Their own fire, if from the enemy team, disarms. |
| Drainbow | A blast from inside, or reaching across, an enemy bubble is halved for those inside (`from` = the bobber). |
| Mega Stamp | The swing guard disarms enemy bobbers in front of it (`smash`). |
| Bubble Blower bubbles | An own chain's blast reaching an own bubble sets it off (`specials.areaHit`), and the reverse. Big combo. Fine. |
| Splatted owner | They stay (C1.8). |

### C6. Counterplay

- Shoot them: one Spritzer shot each.
- Lob any bomb into a cluster: it disarms everything in its radius.
- Walk round webs while a foe has sight of one.
- Read the lamps: N tells you how big it will blow.
- The hop delay gives the far end of a long chain 0.07 to 0.21 s of warning, seen as the spark.

### C7. Bots

**Using them** (`SUB_KITS.bobber.bot`):
- `paint(brain)`, setting up. Conditions:
  - not under fire for 1.5 s;
  - ink ≥ 60;
  - **Zone Control:** a guard's zone edge on the enemy side;
  - **Tower Command:** a landing spot within 6 m of the tower's path ahead, but at least 2 m outside the tower's swept
    body: more than `TOWER.platformR` (1.25) + 2.0 = 3.25 m from the track's centre line, measured to the float spot.
    Anything nearer would be crushed when the tower arrives;
  - **Turf:** the fight's front line (progress 0.45 to 0.65);
  - a 2 % chance per frame, landing 3 to 5 m from the bot's newest live bobber when it has one (to grow a chain);
  - the bot stops adding at a 4-chain;
  - then `bombCd` 1.5 to 3 s between links and 10 to 16 s after a chain is done.
- `fight`: rarely. A lone throw just in front of a foe who is chasing the bot, so a teammate can shoot it. 0.5 % per frame.

**Setting them off** (`SUB_KITS.bobber.botAct`, run for **every** bot on the bobbers' team; this is the trigger). It
scans every 0.1 s per bot, staggered, and holds its answer between scans (§0.5). It acts only when `busy` is false (no
threat, canopy or escape already owns the aim this frame). The bot knows its team's bobbers. It shoots a chain when all
of these hold:
- an enemy it *sees* (sight rules) is within R(N) − 0.3 of any bobber in that chain, in the height band ±1.6 m;
- the bot has a line on one bobber of the chain and that bobber is within its weapon's reach;
- no better shot is under way (its target is not in its sights).

It turns to that bobber (the usual aim error × 0.7) and fires until the chain blows, or 0.6 s pass. Count the result in
`THREAT_STATS` as `chainShots`.

**Accidents.** A bot's normal fire at a foe may pass through its own team's bobber and set it off early. Allow it, but
count it (`chainWasted`: a chain that blew with no enemy within R) and tune it if it is over 30 %.

**Facing enemy bobbers.**
- `devices()` lists them, so wave 1's device shooting covers them when idle. The pick in `deployables-bots.js` is
  distance × `prefer(brain)`, lowest first, for the bot that is picking (§0.2): 0.7 when the bobber is within 4 m of
  that bot's route ahead (`brain.path` from `brain.pi`, 3 nodes) or within R(N) of where it stands, and 1.0 otherwise.
- `specialDangers()`: each **armed** enemy chain (a player of the chain's team has a line of sight to any bobber of it
  within 20 m, re-checked every 0.25 s). One disc per bobber, R(N) + 0.3, `lethal: N ≥ 3 ? 2 : 1`, `linger: true` (a
  route cost, not an escape), `vis: 'near'`. At most 48 bobber discs in all (C4.1).
- A bot standing in one while a foe has sight of it steps out (escape, tIn 0.3).

### C8. Online (kit kind `bobber`)

| record | meaning |
|---|---|
| `[0, gid, x, y, z, vx, vy, vz]` | Thrown. Every screen flies a ghost. |
| `[3, gid, x, y, z]` | Settled at this float spot, rounded to 0.01 m. The owner's own bobber snaps to the same rounded spot (C1.2). Sent again when it re-floats (its floor went, C1.2); the ghost eases to the new spot over 0.3 s. |
| `[4, gid, x, y, z (, tag, lx, ly, lz, nx, ny, nz)]` | Wave 1's word on where its ride body's foot sits (§0.2): on which moving block and where, or back on still ground. The ghost hands it to `G.deploy.netOn(rb, data)` and floats 1.0 m over the foot. |
| `[5, gidA1, gidB1, gidA2, gidB2, …]` | The owner's whole tether list, sent whenever it changes (a settle, a removal, a re-link while riding). Every screen draws exactly these tethers. Ghosts never compute links. |
| `[1, gid0, N, gid1, …]` | Chain triggered, from the owner: N and the blow order, breadth-first from gid0. Every screen plays the sparks and blasts with the 0.07 s hops. Damage and paint are the owner's. |
| `[2, gid, why]` | Gone without a blast: 0 expired, 1 disarmed, 2 crushed (tower, mover, shell, era flip, lava, a block through it), 3 deploy refused (too near the enemy spawn). |

- Enemy fire on a ghost: `netHurt(owner, 'bobber', gid, dmg, by)`.
- **Team fire on a ghost:** a separate channel, `KIT_GHOSTS.bobberPop = { netHurt: (gid, 1, by) => owner's copy
  triggers its chain, crediting by }`, sent as `netHurt(owner, 'bobberPop', gid, 1, shooter)`. Positive, so registry
  `netHurt` doesn't drop it; the fifth argument carries the shooter (§0.4) so the owner can credit the assist (C9). On
  the sending screen the shot is absorbed and the ghost shows a "struck" flash until the owner's `[1]` arrives. This
  costs about one round trip.
- The `netMuted()` rule holds (§0.4): on the owner's screen, a ghost shot or ghost blast replayed through the owner's
  real bobber neither triggers nor disarms it. Only the `bobberPop` / `'dh'` message from the shooter's screen does.
- The owner's chain, at the moment it triggers, is the authority on N and order, and on which bobber hits the boss and
  the shell (C1.5).
- An owner who leaves: every screen ends their ghosts at once (`dropOwner`, §0.4). A ghost bobber never absorbs shots
  for an owner who is gone.

### C9. HUD, prompts, picker

- **Picker blurb:** "A floating bomb that tethers to your others close by. Your team's shots set the chain off; foes'
  shots disarm it. The longer the chain, the bigger every blast. Throw as many as you like." Ink cost 40 %.
- **Prompts:**
  - "Shoot your team's Chain Bobbers to set them off" the first two times per match that the teammate cue's hint
    (C3) appears for this player, whoever owns the chain.
  - "Bobbers within 5 m tether up" on the first throw of a match.
- **Feed:** `'bobber'`. The splat credit goes to the bobber's owner, with the triggering teammate getting an assist
  (`assists.js` damage rule: send the trigger's actor as `by`). Online, the trigger's actor comes from the `bobberPop`
  message's attacker (C8).

### C10. Tests (`tools/botlab/tests/sub-bobber.js`)

1. **Deploy heights:** floor +1.0 ± 0.03; wall 0.45 out and clamped; ceiling to floor +1.0; over the sea +1.0 above the
   water; off a stub `G.objTargets.spheres()` sphere, 0.45 m out from its surface. With a stand-in `G.match.lava`
   whose `surfaceAt` rises from −1.6 to 0.5 over 2 s over a pit with no floor, it rises to 1.5 and comes back down
   when the stub falls, and the stub's `under(pos, −0.05)` never matches it. Refused within 6.2 m of the enemy pad.
   A bobber on a test mover over the sea whose block parks (`_lost`): it re-floats at −0.6 (1.0 m over the sea), keeps
   its chain, and sends a new `[3]`.
2. **Tethers:**
   - 2 bobbers at 4.9 m link; at 5.1 m they don't;
   - a wall between them blocks the link; a grate between them doesn't;
   - at most 3 tethers each, nearest first; at equal distances the lower gid pair wins;
   - N is shown on the lamps;
   - a `[5]` record is sent on every change, and the ghost draws exactly that list.
3. **Trigger:**
   - an owner's shot on bobber 1 of a 4-chain blows all 4, in breadth-first order, at 0.07 s steps (± 1 frame), each with
     R 3.0 / 180 / 35;
   - a teammate's shot does the same;
   - an own Splat Bomb, Glide, Dash blast, roller sweep, and a Tempest's rain each set it off;
   - an own chain's blast sets off a second own chain 2 m away (a separate N).
4. **Damage table:** N = 1 / 2 / 3 / 4 gives 60 / 95 / 140 / 180 at the centre and 25 / 30 / 35 / 35 at R. A victim
   between two bobbers of one chain takes the larger, never the sum.
5. **Disarm:**
   - an enemy Spritzer shot (36), a Squall Spinner shot (26) and a Twinfire shot (30) each disarm one: no blast, no
     damage, the chain splits and re-links;
   - an enemy Pop Pellet, Dash Pellet blast and lone enemy bobber each disarm the bobbers in their radius;
   - an enemy Splat Bomb disarms all whose centre is within 3.1 + 0.2 = 3.3 m (blast radius + hitR), none at 3.4 m;
   - enemy players walking through do nothing;
   - a ghost shot replayed with `netMuted()` held up by the test does nothing to a real bobber.
6. **Life:** expire at 30 s with no blast. The 25th bobber retires the oldest. The owner's splat leaves them standing.
7. **Tower and movers:** crushed in the tower's path, riding on its deck. A Treehills pod: rides. A test block driven
   through a bobber's float height (not its foot) crushes it within 0.1 s. `crushIn` with each shape (`blocks`,
   `sphere`, `where`) and `lavaSweep(pred)` end it with the matching `how`. A scripted `era:flip` with a block in `on`
   round its sphere ends it; one with its floor in `off` makes it re-float. Every ending fires exactly one
   `'device:down'`, and expiry fires none (§0.2).
   **Boss and shell, once per chain:** with Boss Battle's HULLBREAKER stood beside a 6-chain (`MODE=boss`), one
   trigger calls `boss.splash` with `body: true` exactly once and with `body: false` five times, and the body's hp
   drops by one blast's damage at most. With a stub `G.objTargets`, its `splash` is called once per chain, from the
   bobber nearest the sphere.
8. **Bots:** a teammate bot with sight of a chain shoots it when a foe enters R(N) − 0.3, within (reaction + 0.6) s. An
   enemy bot shoots bobbers near its route (`DEV_BOT.bobber` increases). A bot sets up a 3 to 4 chain at its zone
   within 20 s of being a guard. In Tower Command, no bot bobber settles within 3.25 m of the track's centre line.
9. **Online:** a guest's team shot on the host's ghost bobber sets off the chain on the host (within 0.3 s, local relay),
   every screen plays the same order, and the host's assist goes to the guest's actor. A guest's enemy shot disarms.
   The tether lists on both screens are identical after every change (compare the `[5]` list with the host's). The
   guest lays 6 bobbers and leaves: on the host, all 6 ghosts are gone within 1 frame of `onLeave`, and a host shot
   through their spot hits the wall behind.
10. **Teammate cue:** with a foe in the open within R(N) − 0.3 of a teammate's chain, the local player's view shows the
    glow and, with a line and range, the hint; with the foe behind a wall from the local player, neither shows.
11. **Performance:** `perf-bobbers.js` (C4.1).

### C11. Balance levers and what to measure

- **Levers:** the N table (radius, damage, cap N), linkRange, hopDelay, hp, life, floatH, the bots' setup rate.
- **Measure** (`SUBS='all=bobber'` against `'all=mine'` and against `'all=bomb'`; Turf and Zone Control; 4 stages; 16
  per arm; a BOBBER line in `match.cjs`):
  - thrown per match;
  - the chain-size histogram at trigger;
  - triggers that hit ≥ 1 foe, and wasted triggers;
  - splats per trigger;
  - disarmed, expired and crushed shares;
  - ink spent per splat;
  - who triggers (owner / teammate / sentry / blast).
- **Targets:**
  - median N at trigger 2 to 3;
  - ≥ 40 % of triggers hit someone;
  - 30 to 60 % of bobbers disarmed by enemies (counterplay works);
  - splats per match by bobbers within the roster's range.

**The web arm: what a human's big web does** (bots stop at a 4-chain, so the bot A/B never meets one).
- **The risk.** C1.9 allows 24 live bobbers per player, and C1.3 links every own bobber within 5 m. Swim refill is
  42 ink/s (`PLAYER.inkRefillSwim`), so one player can lay about 20 within the 30 s life. One shot then sets off about
  20 Splat-Bomb-sized blasts (N ≥ 4: R 3.0, 180 / 35, paint 2.5) strung over 60 to 100 m. That is about 20 × 19.6 =
  390 m² of paint and a 1.53 m lethal core round every bobber. The per-victim ledger stops damage stacking on one foe,
  not the coverage.
- **The test** (`tools/botlab/tests/bobber-web.js`, a page test, Zone Control on halyard and on treehills):
  - **Teams.** A scripted player with 3 friendly bots whose bobber `botAct` is switched off (only the script
    triggers), against 4 enemy bots at normal difficulty.
  - **Laying.** The script lays N = 12 and N = 24 bobbers within 30 s, one every 1.2 s (about what swimming refills),
    along two layouts:
    - a lane: every 4.5 m along the nav path from its zone edge toward the enemy side;
    - a zone: a 4.5 m grid over the zone.
  - **Two variants.**
    - **Trigger:** the script shoots the web at the first moment ≥ 2 enemy bots stand within R(N) of any live bobber,
      or at 30 s.
    - **Clear:** it never triggers.
  - 10 webs per N, per layout, per stage, per variant: 160 webs in all. On the Mac mini, in 2 jobs.
- **Measure.**
  - The lethal area per trigger: the union of the 1.53 m cores of every bobber that blew, sampled on a 0.25 m grid.
  - Enemy deaths per web, and splats per 100 ink spent laying it.
  - The share of the web disarmed before the trigger, for webs an enemy bot saw for ≥ 3 s.
  - In the clear variant: the time from the first enemy sight of any bobber to the whole web disarmed, and the ink
    the clearers spent.
- **Targets.**
  - A 24-web's splats per 100 ink no better than the Splat Bomb's, from the C11 A/B's `'all=bomb'` arm.
  - Enemy bots disarm ≥ 50 % of a seen web before it is triggered.
- **Levers if it misses, in this order.** Each changes the user's words ("as many as you like", "the more you link
  together, the bigger the explosion"), so **each needs the user's sign-off** before it ships (Open question 25):
  1. Only the 8 bobbers nearest the struck one (by hop count, then distance) blow. The rest detach, stay live and
     re-link.
  2. `maxTethers` 3 → 2: chains become lines, which are easier to cut.
  3. The hidden guard 24 → 12 per player.

---

## D. Dash Pellet (`dash`)

> User: "A bomb that acts similar to a Burst Bomb. Unlike the Burst Bomb, it is used as a movement tool to dodge attacks.
> It can be used on land or in mid-air. The user dashes omni-directional to get to a new spot or close the gap, and
> leaves behind an explosion. This uses more ink than a regular Burst Bomb."
> Lead: the Pop Pellet is our Burst Bomb; the dash goes where the player is steering, any direction, in the air too; the
> explosion stays where they left.

### D1. Behaviour

1. **Press** the sub button. It acts **on the press**, not the release: a dodge must be instant (`onPress: true`, see
   Open question 10). The press is an edge (`subPressed` and the runner's `subLatch`, §0.5): holding the button gives
   one dash, never a dash every frame, and a refused press says "Can't use" once. The press is handled by
   `runner.trySubPress` in `actor.update` **before** `_horizontal` / `_integrate` (§0.5), so the press frame already
   moves.
   - You pay 55 %. The pellet pops at your feet the same frame, and you're blasted along your steering direction.
   - Out of squid form: the press already turns you to kid form on that frame (`actor.js subWins`), so swim and press
     gives a dash straight out of the ink.
2. **Direction.** For a bot, `brain.dashDir` when set (D7; read once and cleared). Otherwise `intent.move` (stick or
   WASD, camera-relative) if its length is ≥ 0.3; otherwise the way you face (aim yaw). That works in any of the 360°
   on the ground, and in the air. Horizontal only: "omni-directional" is read as every horizontal direction, never
   upward (Open question 19).
3. **Motion.** The actor's horizontal velocity is overridden for `dashTime` 0.22 s with
   `v(u) = v0 (1 − 0.6 u)`, u from 0 to 1, as the Twinfire roll's `dodgeVelocity`.
   - **Ground:** dist 4.5 m, so v0 = 4.5 / (0.7 × 0.22) = 29.2 m/s, ending at 11.7.
   - **Air:** dist 3.5 m (v0 = 22.7).
   - At the end, the horizontal speed is clamped to ≤ 7 m/s along the dash (`endSpeed`), and normal control resumes.
   - **Swept, so it never passes through anything.** The actor's movement is `pos += vel × dt` with no sweep
     (`actor.js _integrate`, line 559). `physics.collideBody` pushes a body out along the nearest face, so a step that
     carries the body's centre past a wall's mid-plane comes out on the far side. The Drip Curtain's `blockActor` and
     the launched Brolly canopy's push pick the side from the current position (`subs.js`, r = 0.5; `brolly.js:369`,
     a ±0.56 m band). At 29.2 m/s one frame moves the body 0.49 m at 60 fps, 0.97 m at 30 fps and 1.22 m at the
     1/24 s clamp (`main.js:1245`). So walls thinner than 0.21 m (60 fps) or 1.18 m (30 fps) would be crossed, a
     curtain below about 58 fps, and a launched canopy below about 52 fps.
   - **The substep loop.** At the one place where `this._integrate → G.subs.blockActor(this) → this._spawnBarrier()`
     run (`actor.js` 345 to 347): **while `runner.dashT > 0`, split the frame into `n = ceil(|v_h| × dt / 0.2)`
     substeps** and run all three for each with `dt / n`.
     - At the ground dash's 29.2 m/s, n is 3 at 60 fps, 5 at 30 fps and 7 at 1/24 s. At the air dash's 22.7 m/s, it
       is 2, 4 and 5.
     - A step of at most 0.2 m is less than the body's radius (0.38), the curtain's half-width (0.5) and the canopy's
       band (0.56), so the body is always pushed back out the side it came from.
     - `G.subs.blockActor` now also runs the kit `blockActor` hooks (§0.5): the launched Brolly canopy (both teams'
       kits push only their enemies), and, from the dash kit itself, the **Roe Shell** and enemy **Bubble Blower
       bubbles**. For each solid sphere in `G.objTargets?.spheres?.(out)` and each enemy bubble (`G.specials.world`,
       `kind === 'bubble'`), with `dy` the height from its centre to the body's middle (`pos.y + 0.8`): if
       `|dy| < r` and the horizontal distance is under `R = sqrt(r² − dy²) + PLAYER.radius`, the body is put at `R`
       along the horizontal from the centre and the inward part of its velocity is removed (the bubble's own push,
       specials.js:1068, done inside the loop). The shell's own 6 m/s shove is a velocity, which the dash overrides
       every frame, so without this a 4.5 m dash would cross a 3.2 to 4.6 m shell.
     - The dash velocity is set once before the substeps. A wall met in one substep removes the velocity into it, and
       the rest slide along.
     - `jumped` is passed to the first substep only.
     - `_resolve` adds a fixed 1/60 to `airTime` per call (actor.js:636). So the loop saves `air0 = this.airTime`
       first, and afterwards, if the body was airborne in every substep, sets `this.airTime = air0 + 1/60`. If it
       touched ground in any substep, it keeps what `_resolve` left.
     - Nothing else in the frame changes.
   - Walls stop it, ledges drop it, enemy Drip Curtains, launched enemy canopies, the Roe Shell and enemy bubbles stop
     it, the enemy spawn barrier stops it, and the sea takes it if you dash off into it.
4. **No height gain, ever.**
   - On the ground: vy = 0 (`stepUp` and `stepDown` keep it on curbs and ramps).
   - In the air: vy is clamped to between −1.5 and +1.0 at the start, and gravity is × 0.3 during the 0.22 s. A dash can
     flatten an arc, but never raise it. Jump reach stays 1.8 m.
   - A jump pressed during a ground dash is buffered until the dash ends. While `dashT > 0` on the ground, the jump
     test is skipped and `jumpBuffer` doesn't decay, so the jump fires on the first frame after the dash.
   - A Twinfire or Dualies roll pressed during a dash is refused: `tryDodge` returns false while `dashT > 0`.
5. **Limits.**
   - **One air dash per airtime.** It resets on landing, on a wall climb, or on a super-jump landing. A second press in
     the air gives "Can't use".
   - None while already dashing (0.22 s), while a special owns the body or replaces the main weapon (`_spWeapon`), while
     carrying the Bazookarp, or during a Bomb Barrage (`trySubPress`, §0.5).
   - **No firing during the dash.** The dash kit's `lockMain(runner)` is `runner.dashT > 0` (§0.5), so the main weapon's
     `fire` and `firePressed` are masked. (Revision 2 said `busy()`, which only gates swimming and ink refill.) A charge
     in progress (charger, spinner, bow draw, Mitts leap charge) is dropped without firing at the dash's start
     (`dropCharge()`); see Open question 13. `busy()` is also true while `dashT > 0`, so you can't dive mid-dash.
   - No invulnerability: it dodges by speed only.
   - Enemy ink doesn't slow the dash.
   - **Edge cases.** Ending a dash early always goes through one runner call, `runner.endDash()`. It sets `dashT = 0`
     and clamps the horizontal speed to `endSpeed` (7 m/s); the actor's own movement then takes it to its normal top
     speed. `endDodge()` calls it, and so does `reset()` (when `dashT > 0`), so everything that ends a roll or resets
     the runner ends a dash: a pipe capture, a Bazookarp pick-up, a super jump, a death.

   | Case | Rule |
   |---|---|
   | A ground dash runs off a ledge | It carries on with the air rules from the frame it leaves the ground: the vy clamp then, gravity × 0.3 for the rest of the 0.22 s. Its speed profile stays the ground one. **It counts as the air dash**: no air dash until you land. |
   | A Twinfire or Dualies roll is running (`dodgeT > 0` or `dodge`) | Refused, "Can't use". The post-roll turret or lock (`turret`, `lockT`) is ended (`endDodge()`) and the dash goes. |
   | Clinging to a wall with the Sponge Mitts (`kit.hang`) | `MAIN_KITS.mitts.letGo(runner, 'dash')` first (§0.5; without it `_integrate` zeroes the velocity every frame), then an air dash, which counts as the air dash. If the steering points into the wall, the direction is the wall's normal. |
   | A Mitts leap in flight (`kit.leaping`) | Refused, "Can't use": the leap's armour and landing splash belong to the leap. |
   | A charge in progress (charger, spinner, splatling, bow draw, Mitts leap charge) | Dropped without firing (`dropCharge()`), then the dash (Open question 13). |
   | Picking up the Bazookarp during a dash | The pick-up resets the runner (Bazookarp §2.3), and `reset()` calls `endDash()`: ≤ 7 m/s that frame, then the carrier's run rule (4.8 m/s) brakes it at `runDecel` 58 m/s², so ≤ 4.8 m/s within 0.05 s on the ground. |
   | A super jump, a body special, a pipe taking you in (aquarium), a Zipline or Ink Jet starting | `endDash()` (the super jump and the pipe through `reset()`). |
   | The sub button held through a pipe ride | No dash on the exit: the press latch clears only on a real release with the body free (§0.5). |
   | Pressing while climbing a wall as a squid | The press makes you a kid (`subWins`), you leave the wall, and it is an air dash. |
   | The ink lever at 50 or below | A full tank then holds two dashes, so the `dash-reach` audit (D10.6) must add ground-then-air chains. |
6. **The blast** (left where you took off, at once):
   - radius 2.2, damage 50 → 25 (k² falloff), LOS from 0.3 m over the take-off point;
   - paint 2.0 at the take-off point, credited through `_credit` (turf and special charge for the owner);
   - devices take 25 (an enemy bobber, hp 25, is disarmed);
   - `G.boss?.splash(owner, from, 2.2, 50, 25, 'dash')` and `G.objTargets?.splash(owner, from, 2.2, 50, 25, 'dash')`;
   - `'bomb:explode'` and `'sub:dash'` { actor, from, dir, air }.

   The dash also lays a thin streak on the floor under the ground part of its path: splats of radius 0.45 every 0.6 m
   (about 7). It's a short swim lane back.
7. **The look.**
   - The kid tucks into a fast forward roll. Use `character.trigger('roll', dir)` with `dur 0.22`, replicated as
     `['tr' …]`; that is the Twinfire clip.
   - A team-coloured speed ribbon trails behind (a 0.3 s fading strip).
   - The pellet's pop flash and ink burst stay at the take-off point.

### D2. Numbers (`SUBS.dash`)

| key | value | why |
|---|---|---|
| inkCost | 55 | "More ink than a regular Burst Bomb" (40). At 55, one dash from a full tank leaves 45 to fight with; two dashes in a row need a refill. The lever runs 50 to 60. |
| dashDist, airDashDist | 4.5, 3.5 m | More than the Twinfire roll (3.4), a fraction of a Mitts leap (4.5 to 13). The air dash is shorter so it doesn't cross gaps the stages rely on (D10, test 6). |
| dashTime, endSpeed | 0.22 s, ≤ 7 m/s | A blink, then normal run speed (6). |
| airVyMin / Max, airGravMul | −1.5 / +1.0, 0.3 | Flattens the arc, never raises it. |
| radius, damageMax / Min, paintRadius | 2.2, 50 / 25, 2.0 | The Pop Pellet splash is 35 in 2.1. This blast hits whoever is chasing you. At its centre (within 0.8 m) it does 50, so it splats a chaser already at 50 or less; a full-health one needs two Spritzer shots after it (50 + 72), or one Blaster direct hit. (Revision 1 said "one shot": 50 + 36 = 86 isn't a splat.) |
| devDamage | 25 | The Pop Pellet's. It disarms an enemy bobber (hp 25). |
| substep | 0.2 m | The longest step the dash moves the body in one go (D1.3). |
| streakEvery, streakRadius | 0.6, 0.45 | |
| airDashes | 1 | |

### D3. Controls and aim guide

- **Tap or press:** a dash where you steer. There is no hold and no guide (`noArc: true`; with `onPress` no aim state is
  ever set).
- **HUD:**
  - The sub badge greys with a small "air" pip once the air dash is spent, until you land (drawn by the kit on
    `G.hud.xh`, §0.5).
  - "Can't use" on a refused press, with a reason line from `blockedWhy`: "Air dash used", "Already dashing",
    "Rolling", "Mid-leap".

### D4. Model, look, icon, sounds

- **Model** (`registerSubModel('dash')`): the Pop Pellet's capsule (`buildBurst`) re-dressed. Seen in the hand, and for
  0.08 s at the feet before it pops. `SUB_VIEW_SCALE.dash = 2`.
  - a ring of **four dark exhaust vents** round the nose instead of the rubber trigger nub;
  - a **team-ink lightning chevron** wrapped on each flank;
  - a red pinstripe behind the cage;
  - tail fins swept back further (× 1.4);
  - the knurled tail stub stays (the grip).
- **Icon** (`SUB_ICONS.dash`): the pellet tilted up to the right; a curved motion arrow sweeping from behind it, in
  `currentColor`; a small four-point burst at its tail.
- **Sounds** (`SFX`, plus `SUB_CUE.dash`; no flight voice):

  | sound | what it is |
  |---|---|
  | `dash_pop` (cue `throw` / `boom`) | The pellet pop plus an air "fwump". |
  | `dash_whoosh` (local, or positional for others) | An air rush: a noise band 800 → 2400 Hz over 0.25 s. |
  | `dash_air` | The whoosh pitched up. |

  "Can't use" uses the existing bonk.

### D5. Interactions

| With | Result |
|---|---|
| Enemy players | The blast at the take-off point. No contact damage from the dash itself. |
| Walls / ledges / the sea | The actor's own collision, swept in 0.2 m substeps (D1.3): no wall is ever passed through, however thin and whatever the frame rate. The sea splats you, as walking off does. |
| Enemy ink | No slowing during the dash. Ink damage carries on as usual. |
| Drip Curtain (enemy) | Blocks the dash like a wall (`blockActor`, run every substep). |
| Launched Brolly canopy (enemy) | Blocks the dash like a wall: brolly's `blockActor` hook runs every substep (§0.5, D1.3). |
| Enemy spawn barrier | Stops it (`_spawnBarrier`, run every substep). |
| Bubble Blower bubble (enemy) | Pushes you back. Its own push (specials.js:1068) runs once a frame, so the dash kit's `blockActor` repeats it every substep (D1.3); at low frame rates the dash would otherwise cross a bubble's thin top or bottom. |
| Roe Shell (Bazookarp) | Stops it: pushed out positionally every substep (D1.3, from `G.objTargets.spheres()`). The shell's own touch damage and shove (S6) apply as for anyone. |
| Chain Bobber | The blast sets off your team's chains within 2.2 m and disarms enemy bobbers within it. |
| Glide Bomb / Scrap Sentry | The blast hurts enemy devices (25). An enemy sentry tracks you by its turn rate (4 rad/s): a dash past it at close range breaks its aim for a moment. |
| Bubble Guard / Kraken | Untouchable: 0 damage. |
| Drainbow | The blast is halved for victims inside an enemy bubble (`from`). |
| Specials | Unusable while a special owns the body or replaces the main weapon (`_spWeapon`: no sub at all then, as for every sub today), and during a Bomb Barrage (it owns the sub button). |
| Super jump / Bazookarp carrier | Can't use. A pick-up during a dash ends it (`reset()` → `endDash()`, D1.5). The blast calls `G.objTargets?.splash` with 50 / 25 at 2.2 m (§0.6). |
| Twinfire / Dualies rolls, Mitts cling and leap | D1.5. |
| aquarium pipes | A pipe that takes the dasher in ends the dash (`reset()` → `endDash()`). A sub held through the ride doesn't dash on the exit (§0.5). |
| bluestone era flips, caldera lava | The player's own rules: the dash adds nothing. |

### D6. Counterplay

- The blast is small and stays put: don't chase straight through the take-off point.
- After the dash the dasher has only 45 ink: punish the landing.
- The air dash is spent until they land.

### D7. Bots

Every bot use of the dash lives in **one function, `SUB_KITS.dash.botAct(brain, dt, it, move, busy)`** (§0.5). That is
the call site: the loop just before `_tail`, after the threat block and `sp.act`, so nothing later in the frame clears
it. The kit has no `bot.fight` / `bot.paint` (they return false), so `bombCd` and `_fightSub` never gate it. To dash,
`botAct` sets `brain.dashDir` (a unit x, z) and `brain._bombAim = true`, and returns null. `_tail` presses the sub this
frame and releases it the next, and `trySubPress` reads and clears `brain.dashDir` (D1.2).

Every use needs:
- ink ≥ 55, the dash not on its own 4 s cooldown (`brain.dashCd`), and the air dash unspent when airborne;
- a dry, clear landing: `_dryLine` and `_fatLos` from the bot to the dash end (4.5 m, or 3.5 m in the air), and no drop
  into the sea or of more than 2 m along the way.

The four uses, in this order of priority:
- **Dodge** (the user's headline use). Three small `bots.js` additions expose the threat block's choice:
  - `brain.thrEvNew`: set true by `_thrEvade` when it picks a fresh heading (bots.js:2623, the `thrEvT` refresh), and by
    `_thrSidestep` when it picks a side (bots.js:2635, `!this.thrSide`). `botAct` clears it.
  - `brain.thrEvYaw`: already set by `_thrEvade`. `_thrSidestep` now also sets it to
    `atan2(px · thrSide, pz · thrSide)`.
  - `brain.thrIn`, written in `_threatCtl`: seconds until the threat lands. `d.fuse` for a slider (the Glide), `ttl`
    for a flyer, `eta` for a walker.

  Dash along `thrEvYaw` when `thrEvNew && thrIn < 0.6`. Or, when `brain.sp.esc` holds an escape (picked last frame by
  `SpecialSense._escape`) whose danger lands within 0.5 s (`tInAt(d, x, z)`, botSpecials.js:473, exported for this), dash along
  `esc.yaw`. Both are moves the bot was about to make anyway; the dash makes them 4.5 m in 0.22 s instead of a run.
- **Break off.** HP < 45 with a foe within 5 m who hit it in the last 1 s: dash directly away from the foe, then the
  usual retreat swims.
- **Close the gap.** Melee kits (roller, brush, blade, mitts) with a target 4 to 8 m off, seen for > 0.5 s, when
  `busy` is false: dash at them, 4 % per frame.
- **Charger rushed.** A charger with a foe within 4 m, when `busy` is false: dash directly away.
- **Facing a dasher.** Nothing special. Bots re-acquire after the move through their normal reaction time. The blast is
  instant, so there is no forewarning.

### D8. Online (kit kind `dash`)

- `[0, gid, x, y, z, dx, dz, air]`: the pop. Every screen plays the pop, blast look and speed ribbon at the take-off
  point. The motion rides the actor tick, and the roll clip rides `['tr']`.
- **No extrapolation through walls.** Remote squidkids are drawn from the owner's samples and, when the buffer runs
  dry, extrapolated ballistically for up to 180 ms (`netmatch.js _pathAt`, `docs/NET.md` "Path"). At 29 m/s that is a
  5 m overshoot through whatever is ahead, then a snap back, and shots on that screen would be judged against the
  wrong spot. So: a new tick flag `F.dash` is set while `runner.dashT > 0` (`packActor`), and `_pathAt` extrapolates
  **0 s** past a sample that has it: the remote holds at the last sample until the next one arrives, and the usual
  damped correction (ω = 13) carries it on. The dash lasts 0.22 s, about 4 ticks, so most of it is interpolated between
  real samples anyway.
- **The bit.** `F.dash = 8388608` (bit 23). Bits 0 to 21 are used today (netmatch.js:42–47), and the aquarium's
  ENGINE.md (H10) takes bit 22 for `F.pipe`. If the integrator lands the two in another order, `F.dash` takes the next
  free bit after `F.pipe`; the integrator assigns it. Both flags are JS int bits (≤ bit 30 is safe in `|` / `&`).
  `netmatch.js` exports the flag table as `NET_FLAGS` (one line), and `net-subs5.cjs` checks that every value in it is
  a distinct power of two.
- Damage and paint come from the owner's screen. There is no other record.

### D9. HUD, prompts, picker

- **Picker blurb:** "Pops under your feet and blasts you a few metres the way you're steering, on the ground or in the
  air. Its blast hits anyone you leave behind." Ink cost 55 %.
- **Prompt:** "Tap [sub] to dash where you're steering, on the ground or in the air", the first time it's equipped in
  a match. `[sub]` is the device glyph rule in A9 ("RMB or E", or "RB").
- **Feed:** `'dash'`.

### D10. Tests (`tools/botlab/tests/sub-dash.js`)

1. **On the press frame:** the ink is −55, the blast is at the take-off point (`'bomb:explode'` radius 2.2), and the
   motion starts the same frame. A release does nothing more. **Holding the button for 2 s with 100 ink gives exactly
   one dash and no `'sub:cantuse'`.** A press during the dash gives exactly one `'sub:cantuse'`. Two separate taps
   0.3 s apart with 100 ink: one dash, then a low-ink refusal (45 left).
2. **Distance and direction:** ground 4.5 ± 0.2 m in 0.22 s ± 1 frame, in 8 directions relative to the camera. With no
   stick input it goes the way the kid faces. Air 3.5 ± 0.2 m. The end speed is ≤ 7.
3. **No height gain:** dashing at a jump's rise, apex and fall never raises the peak above a plain jump's (± 0.02 m). A
   1.9 m block stays unclimbable with any jump plus dash timing.
4. **Limits:** a second air dash gives "Can't use" until landing; a held charger charge drops on a dash; out of squid
   form, it dashes on the press frame. A Spritzer held on fire through a dash fires no shot while `dashT > 0`
   (`lockMain`). A jump pressed mid-dash fires on the first frame after it. A Twinfire roll pressed mid-dash is
   refused. With the sub held through a stand-in pipe ride (`a.pipe` set, then the 'pop' phase forcing `intent.sub`
   false, then cleared), there is no dash on the exit until a release and a new press.
5. **The blast:** 50 at the centre and 25 at R; hits foes behind the dasher; nothing through a wall; sets off own
   bobbers; disarms enemy ones (hp 25); the streak is inked.
6. **`dash-reach` audit** (every stage; the treehills-pods physical way-round search, with ground and air dashes, and a
   ground dash off a ledge, added to the moves): no roof, perch or out-of-bounds spot becomes reachable. List any spot
   newly reachable on foot for the lead. Run the search's movement at dt = 1/60 **and** 1/24. Required on every
   shipped stage, on the three new stages (bluestone in each era, aquarium, caldera at low and high lava) and on every
   `LAYOUT.bazookarp` variant as each lands. If `inkCost` ever goes to 50 or below, add ground-then-air chains.
7. **Bots:** a bot whose Torpedo or Glide threat will land in < 0.5 s dashes clear in ≥ 70 % of 20 trials (against
   ≤ 40 % with dash disabled), through `botAct`'s dodge (`thrEvNew` / `thrIn`). A bot inside a Splat Bomb's danger
   disc (an escape with tIn < 0.5 s) dashes along `esc.yaw` in ≥ 70 % of 20 trials. No bot dashes into the sea in 20
   Turf matches. `THREAT_STATS.dashDodge`, `.dashBreak`, `.dashClose` count each use.
8. **Online:** the guest sees the pop at the owner's take-off point (≤ 0.3 m) and the roll clip; damage is applied once.
   With the relay delaying the host's ticks by 150 ms, a host dash ending against a 0.25 m wall never shows the host's
   proxy on the far side of it on the guest's screen (sampled every frame).
9. **Walls and curtains, at every frame rate.**
   - **The obstacles.**
     - Test walls built with `L.addDynamic` + `moveDynamic` (as `input-swim.js` does), 2 m tall: 0.10 m, 0.25 m and
       0.50 m thick.
     - An enemy Drip Curtain.
     - A launched enemy Brolly canopy, held still.
     - A stand-in Roe Shell: a stub `G.objTargets.spheres()` sphere of r 1.6, its centre 1.0 m over the deck.
     - An enemy Bubble Blower bubble of r 0.9.
   - **The dashes.** The kid starts touching each (and, separately, 0.3 m short of it) and dashes straight into it at
     dt = 1/60, 1/30 and 1/24. The ground dash's substep count is 3 / 5 / 7 at those steps.
   - **Pass.**
     - The body never ends on the far side; against a wall it ends within 0.05 m of touching the near face.
     - A dash at 45° into a 0.10 m wall slides along it.
     - A dash into the enemy spawn barrier stops at it.
     - `airTime` after one airborne dash frame grows by 1/60, not by n / 60.
10. **Edge cases (D1.5):** a ground dash off a 2 m ledge then a press in the air: "Can't use". A dash during a Twinfire
    roll: "Can't use"; during its post-roll turret: the turret ends and the dash goes. A dash from a Mitts wall cling:
    the cling drops and the kid moves 3.5 ± 0.2 m away from the wall. A dash during a Mitts leap: "Can't use". A
    Bazookarp pick-up mid-dash (a stand-in that sets `a.carry` and calls `weaponRunner.reset()`): `dashT` is 0 and the
    speed ≤ 7 m/s that frame, and ≤ 4.8 m/s within 0.05 s on the ground. A press while `a.carry` is set does nothing
    here (Bazookarp's weapon block bonks it). A stand-in pipe capture (`reset()`) mid-dash ends it the same way.

### D11. Balance levers and what to measure

- **Levers:** inkCost, dashDist / airDashDist, dashTime, blast damage and radius, airDashes, whether charges are kept.
- **Measure:**
  - A/B: `SUBS='all=dash'` against `'all=burst'`, the same weapons, Turf, 4 stages, 16 per arm.
  - Head to head.
  - A bot-only "dash disabled" control: damage taken in the 1.5 s after a threat is noticed; deaths per match; splats by
    melee kits after a gap-close dash; sea deaths after a dash (must be 0); stuck %.
- **Targets:**
  - damage taken after a noticed threat −15 % or better against the control;
  - the melee kits' K/D within 0.9 to 1.15 × the Pop Pellet arm (no runaway);
  - stuck % unchanged.

---

## E. How the four meet each other (summary)

| ↓ hits → | Glide | Sentry | Bobber (own team / enemy) | Dash |
|---|---|---|---|---|
| **Glide blast** | none | enemy: 40 to 60 dmg | sets off / disarms in R + 0.2 | none |
| **Glide body** | passes | bounces off it | passes under | none |
| **Sentry rounds** | enemy Glide: shot (it pops at 40) | enemy: damage | sets off / disarms the one hit | normal hits |
| **Bobber blast** | enemy Glide: device damage 25 to 60 (pops it from N = 3) | enemy: 25 to 60 | own chains in R also go / enemy disarmed (hp 25) | normal damage |
| **Dash blast** | enemy Glide: 25 (doesn't pop it) | enemy: 25 | sets off / disarms in 2.2 + 0.2 m | none |

Combos the design allows on purpose:
- A sentry behind your own web sets it off when it fires through it.
- A dash out of your own web blows it behind you.
- A cooked Glide into an enemy web clears it.

---

## F. Shared files the builders touch (for the integrator), all tagged `[b5-subs]`

- `src/config.js`:
  - `SUBS.glide / sentry / bobber / dash`;
  - `SUB_ORDER` appended at the end;
  - `SUB_VIEW_SCALE`: glide 1.6, sentry 1.5, bobber 1.5, dash 2.
- `src/game/kits/index.js`: four imports.
- `src/game/kits/registry.js`:
  - `netHurt(owner, kind, id, dmg, by)`: pass `by` on to `sendDevHit` (§0.4);
  - document the new hooks:
    - `SUB_KITS`: `devices`, `rideBodies`, `onPress`, `lockMain`, `blockActor`, `smash`, `botAct`, `drawMap`,
      `dropOwner`, `lavaSweep`, `blockedWhy`, `bot.rides`;
    - `MAIN_KITS`: `blockActor`, `letGo`;
    - the `slider` / `turret` threat flags.
- `src/game/kits/mitts.js` (1 line): `letGo: (r, why) => dropCling(r, r.kit, why)` on its `MAIN_KITS` entry.
- `src/game/kits/brolly.js` (about 4 lines): split `blockActors(c)` into `blockOne(c, e)`. The tick still calls it for
  every enemy; the new `MAIN_KITS.brolly.blockActor(a)` calls it for `a` against each live launched canopy (§0.5).
- `src/game/weapons.js` (about 30 lines):
  - **Top of `update()`.** `bar` / `sub` / `SK` computed first. The `lockMain` mask with `dropCharge()` on the frame
    it starts, and `runner.mainLocked` (§0.5). The `subSpent` latch in the sub block. The sub block skipped for an
    `onPress` kit when no barrage runs.
  - **New methods.**
    - `trySubPress(held, pressed)` with `subLatch` (§0.5).
    - `cancelForSwim(keepSub = false)` and `dropCharge()`.
    - `dashT` on the runner, `dashVelocity(out)` next to `dodgeVelocity`, and `endDash()` (clamps to 7 m/s).
  - **Changes.**
    - `endDodge()` calls `endDash()`.
    - `reset()` calls `endDash()` when `dashT > 0`, then sets `dashT = 0`, `subLatch = true`, `subSpent = false` and
      restores the air dash.
    - `busy()` is true while `dashT > 0`.
    - `tryDodge` returns false while `dashT > 0`.
- `src/game/actor.js` (about 20 lines):
  - `subPressed` next to `firePressed` (line 258);
  - after the dodge-velocity override (lines 316–317): `trySubPress(intent.sub, subPressed)` and the dash velocity
    override (§0.5);
  - the dash's gravity × 0.3 in `_integrate`'s air branch, and its vy clamp at the start;
  - **the substep loop** round `_integrate → G.subs.blockActor → _spawnBarrier` while `dashT > 0` (D1.3): n =
    ceil(|v_h| × dt / 0.2), `jumped` on the first substep only, `airTime` advanced once;
  - the air-dash reset on landing, climb and super-jump landing; leaving the ground mid-dash spends it (D1.5);
  - the jump test skipped and `jumpBuffer` held while dashing on the ground.
- `src/game/subs.js` (2 lines): `blockActor(a)` ends with the `SUB_KITS` / `MAIN_KITS` `blockActor` loop (§0.5).
  (Revision 2's `damageArea(…, tag)` is dropped.)
- `src/game/specials.js` (2 lines): the Mega Stamp's `guardSweep` calls `SUB_KITS[k].smash?.(…)`. (Revision 2's
  `areaHit` tag is dropped.)
- `src/boss/boss.js` (1 line): `splash(…, wid, o)` returns after the crab loop when `o?.body === false` (§0.5, C1.5).
- `src/game/botSight.js` (5 lines): `export function sightRay(a, b) → true | false | null`. It shares `_frameT` /
  `_frameRays` / `SIGHT.frameRays` with `Sight.check`, and counts in `SIGHT_STATS.rays` / `.deferred` (§0.5).
- `src/game/botSpecials.js`:
  - the dangers for the Glide's stop disc, enemy sentries, and armed enemy chains (at most 48 bobber discs);
  - `export` on `tInAt` (D7).
- `src/game/bots.js`:
  - `_threatScore`: the `slider` and `turret` branches;
  - `_threatCtl`: the `slider` and `turret` branches for `urgent` (A7, B7), and `this.thrIn` (D7);
  - `_thrEvade` / `_thrSidestep`: `thrEvNew`, and `thrEvYaw` from the sidestep (D7);
  - `_pickEvade`: the line-of-sight bonus for `d.turret`, and the out-of-range bonus (B7);
  - line 1005: the `bot.rides` exception to `!onT` (§0.5);
  - the `botAct` loop just before the turf think's `_tail` call, with `busy = !!thrAim` (§0.5).
- `src/game/deployables.js` (wave 1, about 35 lines): every row of the table in §0.2, the one-emitter rule for
  `'device:down'`, and the new `crushIn` (§0.3) with its `blocks`, `sphere` and `where` shapes, which `crush(T)`
  becomes a call of.
- `src/game/deployables-bots.js` (wave 1, about 4 lines): `live`, the pick's `prefer(b)`, the middle point, and the
  `DEV_BOT` counters (§0.2).
- `src/game/minimap.js`: call `SUB_KITS[k].drawMap?.(…)`.
- `src/ui/hud.js` (about 12 lines):
  - `'sub:cantuse'` passes `reason`, and `_cantUse(kind, reason)` shows it as a second line (`iw-deny__why`);
  - the `'sub:note'` listener, with `_subNote(kind, text)` in the same slot (no ✕, 70 % opacity, the kind's sting);
  - the reticle's `is-locked` class from `frame.mainLocked` (40 % opacity).

  The kits' own HUD pieces are drawn by the kits on `G.hud.xh` (§0.5).
- `src/audio/cues.js`: `SUB_CUE` rows; `THROWN_SUBS` += glide, bobber; `PLACED_SUBS` += sentry; `FLIGHT_KIND.bobber`.
- `src/main.js`:
  - the prompts (A9, B9, C9, D9), with the device glyph rule (A9);
  - the bobber teammate hint (C3);
  - `frame.mainLocked`.
- `src/net/netmatch.js` (about 8 lines):
  - `sendDevHit(owner, kind, id, dmg, by)` adds `a: by?.nid`; the `'dh'` case passes `this.byNid.get(d.a) || null`;
  - `F.dash = 8388608` (bit 23, after the aquarium's `F.pipe`; the integrator confirms), set in `packActor` while
    `wr.dashT > 0`; `_pathAt` extrapolates 0 s past a sample with it;
  - `export const NET_FLAGS = F`;
  - `onLeave` and `_remove`: `SUB_KITS[k].dropOwner?.(a)` for each actor of the leaver, before re-owning (§0.4).
- `docs/NET.md`:
  - the four record sets, the `bobberPop` channel and the `'dh'` attacker field;
  - the `F.dash` flag and its extrapolation rule;
  - the `netMuted()` rule for kit devices;
  - `dropOwner` on a leave;
  - the 1/60 s fixed step for replayed slides.
- `tools/botlab/match.cjs`: the GLIDE / SENTRY / BOBBER / DASH counter lines.

**Asked of other packages.** These are their builders' work, not ours. The lead passes each line to that package's
designer, so both builders read the same contract; I don't edit their documents.
- **Bazookarp** (`bazookarp/SPEC.md` §2.2 / §11):
  - `G.objTargets.spheres(out) → out`, with `{ c, r, solid: true }` for the intact shell only (§0.6);
  - the shell's re-form calls `G.deploy.crushIn({ sphere: { c, r } }, 'shell')`. Their §2.2 already plans "the deploy
    package's tower-crush helper", so this only names it.

  Nothing else: no `hitArea` tag, no `hitShot` × 0.5, no `shellBlocks`. The kits make their own `G.objTargets.splash`
  calls, as Bazookarp §2.2 expects ("The batch-5 subs add theirs").
- **Caldera:** nothing required. Its ENGINE.md H17 / H19 already calls `SUB_KITS[k].lavaSweep?.(pred)`, which both kit
  devices implement. Optional: per its risk 13, its `destroyWhere` may become `G.deploy.crushIn({ where: pred },
  'lava')`.
- **Bluestone:** nothing. The kits listen to `era:flip` themselves (§0.6).
- **Aquarium:** nothing. No aprons. The pipe capture's `weaponRunner.reset()` already ends a dash and fizzles a cook.
  The press latch handles the 'pop' phase's forced `intent.sub = false` (§0.5).

## G. Test plan summary

- **New page tests** (testbox, `MAP=testbox MODE=turf PAGE=… tools/botlab/run.sh tools/botlab/page.cjs`):
  `sub-glide.js`, `sub-sentry.js`, `sub-bobber.js`, `sub-dash.js`, plus the `dash-reach` stage audit (run at dt 1/60
  and 1/24, on every stage, era, lava level and Bazookarp layout, D10.6).
- **New performance test:** `perf-bobbers.js` (C4.1).
  - 192 live bobbers and three 8-chains: p95 frame time within +2 ms (+4 ms while blowing) of the empty testbox, at
    most 20 more draw calls, the kit's tick under 0.5 ms.
  - A live 4 v 4 bot Turf match with 192 bobbers: p95 frame time within +3 ms, the bots' think time p95 within
    +1.0 ms, and `SIGHT_STATS.deferred` at most doubled.
- **New web test:** `bobber-web.js` (C11): 12- and 24-bobber webs, lane and zone layouts, trigger and clear variants,
  halyard and treehills in Zone Control, 160 webs on the Mac mini in 2 jobs.
- **New two-client test:** `tools/botlab/tests/net-subs5.cjs` (`CLIENTS=2`, the `net-surf.cjs` pattern). It runs, on
  both screens:
  - each sub's records, including the Glide's cook levels `[5]` and the bobber's tether lists `[5]`;
  - a guest hitting the host's ghost device (sentry hp, bobber disarm, Glide pop), with the guest's actor arriving as
    `by` on the host;
  - a guest's team shot setting off a host chain, with the assist to the guest;
  - a ghost shot passing through the host's real bobber on the host's screen: nothing happens (`netMuted`);
  - blasts landing in the same place;
  - damage applied once;
  - a host dash against a thin wall, with 150 ms of added relay delay: the guest never draws the host beyond it;
  - every value in `NET_FLAGS` is a distinct power of two, and `F.dash` is not `F.pipe` when both exist;
  - **a player leaving:** the guest has a sentry, 6 bobbers and a sliding Glide out, then leaves. On the host, every
    ghost of theirs is gone within 1 frame of `onLeave` (`dropOwner`), and a host shot through a former bobber's spot
    reaches the wall behind it. The same with the host leaving and a guest taking over its bots.

  Add `NET_ARGS='scene=tower'` for the sentry and a bobber riding the deck (the `[4]` ride word).
- **Regressions to extend and re-run:**
  - `sub-scale.js`: the four kinds; the gameplay trace identical at any view scale;
  - `loadout-picker.js`: tiles = SUB_ORDER + 1 = 20, and the picker scrolls;
  - `sfx-cues.js`: alone, the new cue rows;
  - `deployables.js` (wave 1), with the sentry and the bobber named in each check, by the path it exercises:
    - `devices()` lists them with `aim` and `live`, and `prefer(brain)` differs for two bots on different routes;
    - `struck()` flashes them and fires `'device:hit'`;
    - `sweep` hurts enemy ones and calls `teamFire` on own bobbers; `_standing` (rain, vortex, Howl beam, Surf ring)
      the same;
    - `crush(T)` / `crushIn` with the `blocks`, `sphere` and `where` shapes;
    - `attach / carry / netOn` on the tower deck, a Calamari railcar floor and a Treehills pod;
    - `_pushes` lifting, shoving and crushing their ride bodies;
    - `_lost` when the block parks: a sentry ends with no event, a bobber re-floats;
    - **exactly one `'device:down'` and one counter step per ending, from each emitter (§0.2)**;
    - `deployables-bots.js` picking each;
  - `bot-specials.js`: the new dangers, and the 48-disc cap;
  - `bot-sight.js`: unchanged numbers with a sentry's `sightRay` calls sharing the budget;
  - `surf-movers.js`, `treehills-pods.js`, `tower-rules.js`: unchanged (the `crushIn` refactor of `crush(T)`);
  - `input-swim.js`: unchanged (the `subPressed` edge and `trySubPress` in `actor.update`);
  - `sub-tweaks.js` and `sub-tweaks2.js`: unchanged (the `lockMain` / `subSpent` / top-of-update changes in the sub
    block);
  - a Brolly check (in `sub-dash.js`, since no Brolly test exists in `tools/botlab/tests/`): a launched canopy still
    holds a walking enemy back as before, now also through `blockActor`.
- **Mac mini:** each regression batch three times for flakiness; the balance sets in A11, B11, C11 and D11 as job
  scripts `jobs/batch5/<key>/JOB-<n>.sh` (COMMON.md's runner protocol). **Tonight's cap is 8 matches per mode and
  config** (COMMON.md, "Running things" 6). The 16s in A11 to D11 are for the lead's consolidated pass after
  integration; tonight each arm runs 8.

---

## H. Open questions for the lead (each with my recommendation)

1. **Can the Glide Bomb be shot (hp 40, pops harmlessly)?** The user listed the Skitter Bomb (a ground bomb) as
   shootable; Splatoon's Curling Bomb can't be shot. **Yes:** it is consistent with the other ground bombs (Skitter,
   Waddle) and gives bots and players a skill counter.
2. **Glide ink 65 or 70?** **65:** uncooked it is weaker than a Splat Bomb, and fully cooked (radius 3.2) it matches
   one only after 1.8 s of holding with the main weapon locked. Revisit after A11 (the close-range human arm decides).
3. **Does the Scrap Sentry survive its owner's splat?** **No:** it folds, like the Twirl Sprinkler. A 15 s turret that
   outlives its owner has no counter but shooting it. (The user's survive list this batch doesn't include it.)
4. **Sentry life: 15 s, or until shot down?** **15 s**, with the tank shown draining.
5. **Sentry on the tower deck: ride and shoot?** **Allow it** (the buoy rides too). Measure it in B11, with a one-line
   lever to forbid deck placement if it dominates Tower Command.
6. **Chain Bobber links: your own only, or any teammate's?** **Own only.** Team play still comes through "any
   teammate's fire sets it off". Team-wide links would split one chain's authority across owners online.
7. **Chain damage: the strongest blast per victim, not the sum?** **Yes.** One chain is one explosion. Summing would make
   any 4-chain lane lethal end to end.
8. **"As many as you like": a hidden technical guard of 24 per player?** **Yes, 24:** invisible in normal play (ink and
   the 30 s life limit you well below it). It bounds the worst case at 192 bobbers, which the instanced drawing, the
   spatial hash and the 48-disc danger cap (C4.1) are built for, and `perf-bobbers.js` proves, with standing and with
   live bots. If that test fails after the cheaper levers, 16. Whether a human's big web is fair is a separate
   question, measured by the web arm (C11, Open question 25).
9. **Bobbers survive the owner's splat?** **Yes.**
10. **Dash on press or on release?** **Press:** a dodge must be instant (a release adds the hold time, about 70 ms on a
    tap). Every other sub stays on release.
11. **Dash ink 55 or 50?** **55:** one dash from a full tank, not two in a row.
12. **Air dash 3.5 m or the same 4.5 m as the ground?** **3.5 until the `dash-reach` audit is clean,** then 4.5 if
    nothing leaks.
13. **The dash drops a held charge (charger, spinner, bow, Mitts)?** **Yes:** no dash-sniping. A lever if the user
    wants it.
14. **Should the new subs join Mystery Bomb Barrage's pool** (wave-1 `sprules`)? **The Glide only,** thrown uncooked:
    during a barrage its `hold` and `lockMain` return at once, so it never cooks and never locks the main weapon the
    barrage promises to keep (A1.1). The Bobber needs follow-up fire, the Dash is movement, and the Sentry is
    placed.
15. **Names:** Glide Bomb, Scrap Sentry, Chain Bobber, Dash Pellet. **Keep them.** "Scrap" carries the user's "recycled
    materials"; "Chain" carries linking.
16. **Existing bug noticed in passing (not this spec's code):** `kits/registry.js netHurt` sends only `dmg > 0`. The
    Bubble Blower sends team fire on a remote player's bubble as `-dmg` (`specials.js _bubbleHit` →
    `netHurtObj(dmg < 0 …)`), so **online, a teammate on another screen can't set off your Bubble Blower bubble.**
    **Fix it in integration:** let `netHurt` pass negative values, or move the blower to a separate positive channel
    like `bobberPop`. Add a two-client check.
17. **A sentry's rounds set off its own team's bobbers in their way.** **Keep it:** it is the user's "explodes after
    being attacked by a weapon", and it makes a sentry plus a web a combo. Measure wasted triggers (C11).
18. **The Glide bounces off enemy players and never blows on contact?** **Yes:** the user said it explodes "after its
    timer expires". The bounce makes a well-timed cook land at their feet; the main-weapon lock, the slip and the
    visible cook (A1.1) are what keep that fair.
19. **"Omni-directional" for the dash: horizontal only, or upward too?** The spec reads it as every horizontal
    direction, in the air as well, with no height gain ever (D1.4), because an upward dash would let a kid reach roofs
    and perches the stages rely on being out of reach (the kid-reach rule: about 1.8 m). **Recommend horizontal only;
    ask the user.** If they want up, the safe version is a small upward dash (vy = 4 m/s, no more than a jump's
    height) that still can't beat 1.8 m, proven by `dash-reach`.
20. **"The more you link together, the bigger the explosion": stop growing at N = 4?** The user gave no limit. The
    spec caps the blast at the 4-chain (Splat Bomb grade, radius 3.0) and lets longer chains cover more ground instead,
    because a 6-chain at radius 3.8 and 220 damage would splat everything in a lane from one shot. **Recommend the cap
    at 4; ask the user** whether they meant the blast keeps growing. If so, the gentlest form is +0.2 m radius per
    bobber past 4, damage held at 180, up to N = 8 (radius 3.8).
21. **Sentry damage 22 a round (61 % of a Spritzer round) under the user's "Splattershot-like weapon"?** The look, the
    trail and the ink are the Spritzer's; the numbers are smaller because it fires on its own for 15 s. A turret with
    the Spritzer's own 36 and 10 shots a second would splat in 0.3 s and out-duel the player who placed it. **Recommend
    22; tell the user** it is Spritzer-like in look and feel, not in damage.
22. **The same tunnelling exists today for the Twinfire roll and the Mitts leap.** The roll starts at 16.2 m/s (0.67 m
    a frame at the 1/24 s clamp). From touching, it crosses an enemy Drip Curtain (half-width 0.5 m), walls under
    about 0.6 m, and a launched enemy Brolly canopy (band 0.56 m) below about 29 fps (16.2 × dt > 0.56). The leap
    reaches 18.6 m/s. Not this spec's code. **Recommend** applying D1.3's substep rule to any actor whose horizontal
    step in a frame exceeds 0.25 m, as a separate small integration change after the dash proves it. The new
    `blockActor` kit hook (§0.5) means the canopy and the Roe Shell are already inside that loop.
23. **The Glide's cook: main weapon locked, a slip after 1.0 s at full cook, full-cook radius 3.2 (revision 1: shoot
    while holding, hold forever, 3.4).** The review showed a full cook could be carried into a fight indefinitely and
    rolled at a foe's feet for a 0.6 s, bigger-than-Splat-Bomb blast. **Recommend all three** (A1.1, A2). The lock
    matches Splatoon, where you can't fire while holding a sub.
24. **Aquarium device aprons. Closed.** The aquarium's final ENGINE.md (§1.4, §3.10) doesn't support device aprons
    ("the pop fan-out and shootable deployables do the job"). This spec follows it: `G.level.noPlace` is dropped, and
    sentries and bobbers go wherever the normal rules allow. Nothing for the lead to decide unless the stage changes
    its mind. Then the hook comes back as one call in each placement path.
25. **A human's big bobber web (C11, the web arm).** One player can lay about 20 bobbers in 30 s. One shot then blows
    about 20 Splat-Bomb-sized blasts over 60 to 100 m (about 390 m² of paint). The ledger stops damage stacking on one
    foe, but not the coverage. **Recommend:** ship as the user worded it, run the web arm (C11) before the release, and
    if it misses its targets ask the user to choose among the levers in order:
    - only the 8 bobbers nearest the struck one blow (the rest stay);
    - 2 tethers each instead of 3;
    - a 12-bobber guard instead of 24.

    Each one narrows "as many as you like" or "the more you link together, the bigger the explosion", so none ships
    without the user's yes.
26. **The Glide's cook clock.** `cook = held − 0.15 s` (capped at 1.8 s), so full cook is at 1.95 s of holding and the
    slip at 2.95 s (A1.1). Revision 2 said both 0.15 s of grace and a slip at 2.8 s, which disagreed. **Recommend** this
    reading (the grace never cooks, so a tap is always the long slide). The other reading, where the grace counts
    toward the cook, would make a 0.1 s tap slightly cooked.
27. **Sentry rounds on the Bazookarp shell at face value** (revision 2: × 0.5). The sentry never aims at the shell and
    can't see through it, so only stray rounds reach it, as from any player. **Recommend** face value: it saves a
    special case in the Bazookarp's `hit`. If a sentry parked by the shell turns out to swing tug-of-wars (Bazookarp's
    `karp-shell-dps.js` table can show it), add `BAZOOKARP` per-weapon × 0.5 for `'sentry'` there.

---

## Review log (revision 2, 2026-10-04)

The review's verdict was "needs-work": 1 blocker, 6 majors, 5 minors. Every point was checked against the code
(`b5-design` and `b5-deploy`) before changing the spec. All are fixed in the document; where the review was partly
wrong, the evidence is given and the fix was made anyway when the underlying problem was real.

| # | Severity | Issue | Verdict | What changed, and where |
|---|---|---|---|---|
| 1 | blocker | The Dash Pellet passes through thin walls and enemy Drip Curtains at 29 m/s | **Right.** `actor.js _integrate` is `pos += vel·dt`; `collideBody` pushes out along the nearest face; `main.js:1245` clamps dt to 1/24 s. | D1.3: the dash runs `_integrate → blockActor → _spawnBarrier` in substeps of at most 0.2 m (shorter than the body radius 0.38 and the curtain half-width 0.5). D8: no extrapolation of a dashing remote. D10.9: 0.10 / 0.25 / 0.50 m walls and a curtain at dt 1/60, 1/30, 1/24. D10.6: the audit at 1/24 too. Open question 22: the same exists today for the Twinfire roll and the Mitts leap. **Where the review overcounted:** its examples of thin walls are ground pieces, not walls. `nantai 'lawn-e'` is the east lawn's ground fill (`fill(LAWN_E, { y0: FL, top: G0 })`), `terraces` gutters are pebble joints 10 cm lower than the floor slabs, and `craters 'path'` is a ground rectangle. A dash runs over them, not into them. Real walls under 1.18 m (30 fps) and every curtain are enough to make it a blocker. Also, from touching, a curtain is crossed below about 58 fps (a step over 0.5 m), not 53. |
| 2 | major | `onPress` repeats the dash every held frame | **Right.** The runner sees only the held `winp.sub` (actor.js:387) and the release. **One point wrong:** a press is not lost on a squid frame: a sub press beats swim (`subWins`, actor.js:290) and `wantSquid = swimWins && !busy`, so the actor is a kid on the press frame. | §0.5: `subPressed` edge in `winp` plus a runner `subLatch`, with the exact code. D1.1. D10.1: hold 2 s with 100 ink gives one dash and no "Can't use"; a press during a dash gives exactly one. |
| 3 | major | "No cap" bobbers have no draw / CPU budget and no test | **Right.** | C4.1: instanced drawing (about 14 draw calls for all bobbers, 2 for all tethers, sag and bob in the vertex shader), a 4 m spatial hash for `blockShot` / `blockRay` / `damageArea` / linking, `botAct` every 0.1 s on `botSight`'s budget, one boom per hop level, a 400-particle cap per chain. `perf-bobbers.js` with pass numbers (+2 ms p95, +4 ms while blowing, ≤ 20 more draw calls, kit tick < 0.5 ms), and levers if it fails. G. Open question 8. |
| 4 | major | Sentries stack and reach the enemy spawn from the tower deck | **Right.** Measured from `tower-data.js` and the layouts: the goal is 11.6 m (lockgate), 11.8 (saltpan), 12.3 (kelpline), 13.3 (crossmarket), 14.9 (tidewater), 18.3 (terraces) from the enemy pad; range 11 m. | B1.1: 4 m spacing from a teammate's live sentry ("Too close to another sentry"; a 2.5 m deck holds one); the pad distance read from `G.level.spawnBarrier`. B1.4: never targets a foe within `spawnBarrier + 1` of their own pad. B1.11: folds if carried within `spawnBarrier + 4`. B2 (two-sentry stack worked out), B9 prompts, B10.1 tests, B11 stacked arm with a target. |
| 5 | major | Wave 1's code won't handle kit devices as claimed | **Right**, on every point: `PREFER` skip, `live()` default, `hitH` / `normal` footwork, `aim` vs `mid`, `struck()` early return, the ride code walking `G.subs.items` only, the ride records lacking tag / ly / normal, lifts and shoves. | §0.2: the descriptor with wave 1's own field names (`aim`, `hitH`, `normal`, `live`, `prefer`, `floor`), a table of every wave-1 place and its change (`devices`, `crush`, `sweep`, `_standing`, `struck`, `'device:down'`, `attach / carry / _lost / netOn / _onRec`, `_pushes`, and in `deployables-bots.js` `live`, `PREFER`, the middle point, `DEV_BOT`), a **ride body** so kit devices reuse wave 1's riding and the `[4]` word under their own kind, and a 0.1 s body-in-block test for floating bobbers. B8 / C8 records replaced. G names the regression paths. |
| 6 | major | The Bazookarp shell and the three new stages don't know these devices | **Right.** Bazookarp §2.2's crush list omits them; bluestone H17 walks `G.subs.items`; aquarium wants pipe aprons for "the new turret"; caldera has no engine doc yet. | §0.3: one destroyer, `G.deploy.crushIn(shape, why)` with `blocks`, `sphere`, `standingOn`, `liquid` shapes, used by the tower, the shell, era flips and lava. §0.5: `G.level.noPlace` and `G.level.liquidY`. §0.6: a Bazookarp table (a chain counts once on the shell through a `tag` ledger; sentry rounds × 0.5 and the shell blocks its sight; the Glide bounces off it; the re-form crushes devices) and a stage table. Rows in A5, B5, C5, D5. F lists what is asked of the other packages. Open question 24. |
| 7 | major | A full-cook Glide outclasses the Splat Bomb, can be held while shooting, and its cook is invisible | **Right.** `weapons.js` runs the main weapon every frame regardless of `aimingSub`. | A1.1: the main weapon is locked once the cook passes 0.15 s (a new `lockMain` hook, not `busy()`, so diving still fizzles it); the stone slips after 1.0 s at full cook. A2: full-cook radius 3.4 → 3.2 (lethal core 1.59 m vs the Splat Bomb's 1.56). A4 / A8: the cook level is replicated with `[5, level]` records at the 0.6 / 1.2 / 1.8 s marks (kit-local, no new tick bits) and shown as lamps, a hand glow and a sizzle on every screen. A11: a scripted close-range human arm with a target (≤ 1.1 × the Splat Bomb) and the next levers. A10.1, A10.12. Open question 23. |
| 8 | minor | Numbers that contradict each other | **Right.** | Bobber hp 30 → **25** (C1.6, C2), so every gun's main shot (the least is the Spinner's 26) and every blast (device damage ≥ 25: Pop Pellet, Dash Pellet, a lone bobber) disarms; chosen over raising blast device damage to 30 because it leaves the Pop Pellet's existing 25 alone and makes "enemies can disarm them by shooting" hold for the Spinner and Splatling too. The Brolly pellet, far brush drops, tapped bow arrows and sprinkler drops still need more than one hit (stated). The Skitter row is 30 and the Glide's hp rationale rewritten (A2). The sentry's 5th hit is at about 1.43 s at 6 m, flight included (B2, B10.4). The sentry solves the drop with `G.projectiles._ballistic` (B1.6, B10.4 tests 8 / 10 / 11 m). The dash's "one shot splats" claim is corrected (D2). E table fixed. |
| 9 | minor | Online gaps | **Right.** `sendDevHit` sends `{kind, id, d}` only. | §0.4: `netHurt(…, by)` and `'dh'.a`; the `netMuted()` rule for every kit device; a 1/60 s fixed step for replayed slides. C1.2 / C1.3 / C8: rounded settled spots, a (distance, gid) tie-break, and the owner's authoritative tether list `[5]`, so ghosts never compute links. D8: `F.dash` and zero extrapolation. A1.2 / A3 / A8: the fixed step. Tests in A10, C10, D10, G. |
| 10 | minor | Bot hooks that conflict with existing gates | **Right.** | §0.5 / B7: the `bot.rides` exception to `bots.js:1005`'s `!onT`. B7: `_pickEvade` line-of-sight bonus for `d.turret` plus an out-of-range bonus; a `turret` branch for `urgent` in `_threatCtl`. A7: a `slider` branch for `urgent`; the paint test as three discs. C7: Tower Command bobbers at least 3.25 m from the track's centre line; `botAct` every 0.1 s. |
| 11 | minor | Dash edge rules undefined | **Right.** | D1.5 (in the Limits item): off a ledge (air rules, counts as the air dash), during a roll (refused) or its turret (ended), a Mitts cling (`MAIN_KITS.mitts.letGo`, a new one-line hook) and leap (refused), charges (dropped), a Bazookarp pick-up, super jumps, body specials, pipes (`endDash()`), and the ink lever at 50. D10.6: the audit on the new stages, each era and lava level, and every Bazookarp layout. D10.10 tests. |
| 12 | minor | Readings to raise, and text fixes | **Right.** | Open questions 19 (dash upward), 20 (the N = 4 cap), 21 (sentry damage 22). C3: a teammate cue (a glow when a foe the player can see is in a chain's radius, and a "Shoot to set off" hint with a line and range; no wall-hack). A9 / D9: the key / pad glyph rule ("RMB or E", "RB") instead of "E". C1.2's "shots of nobody's" sentence fixed. §0.1 / B1.12: devices are not solid to players. A1.6 / D1.6: turf and special charge through `_credit`. |

**Kept from revision 1 unchanged:** the four names and ids, the ink costs (65 / 65 / 40 / 55), the Glide's reach
table, the sentry's range, lock, burst and 15 s life, the chain's N table and 0.07 s hops, the dash's distances and
blast, and open questions 1 to 18.

---

## Review log, revision 3 (2026-10-04)

The second review's verdict was "needs-work": 5 majors and 6 minors, no blockers. I checked every point against the
code (`b5-design`, and `b5-deploy` for wave 1) and against the other packages' final documents
(`bazookarp/SPEC.md`, `stages/{aquarium,bluestone,caldera}/ENGINE.md`) before changing the spec. All 11 are right, and
all are fixed in the document. Where my fix differs from the one the review proposed, the reason is given.

| # | Severity | Issue | Verdict and evidence | What changed, and where |
|---|---|---|---|---|
| 1 | major | Bazookarp: the kits' damage went down a path the shell doesn't read; chain-once can't be built | **Right.** The shell is an objective target in `G.objTargets` (`segHit` / `hit` / `splash` / `tick`, bazookarp §2.2) and counts "never the device numbers `G.subs.damageArea` passes". `hitArea`, `hitShot` and `shellBlocks` don't exist there. `boss.js:304 splash()` applies its damage and returns nothing, so a kit-side ledger can't trim the boss either. | §0.6 rewritten. The Glide and the Dash call `G.objTargets?.splash` beside `G.boss?.splash` with the true numbers (A1.6, D1.6). C1.5: a chain hits the shell and the boss's body **once**, from its bobber nearest the target's surface with a line (all of a chain's blasts are the same size, so that is the strongest). Crablets are hit by every blast through a one-token `boss.splash(…, { body: false })` (§0.5, F). The only ask of Bazookarp is `G.objTargets.spheres(out)`, used by the Glide's bounce, the bobber's deploy, the sentry's sight and the dash's push-out (§0.6, F). The damage tag in `damageArea` / `areaHit` is dropped. **Where I differ:** the review kept sentry rounds × 0.5 through the shell's `hit`. I dropped the halving instead: the sentry never aims at the shell and can't see through it, so only stray rounds reach it, as from any player. That is one fewer special case in another package (Open question 27, with a fallback). |
| 2 | major | `F.dash` takes the aquarium's `F.pipe` bit | **Right.** aquarium ENGINE.md line 76 and H10 set `F.pipe = 4194304` (bit 22); netmatch.js:42–47 uses bits 0–21. | D8, §0.4, F: `F.dash = 8388608` (bit 23); if the order changes, the next free bit after `F.pipe`, assigned by the integrator. netmatch exports `NET_FLAGS`, and `net-subs5.cjs` checks every value is a distinct power of two (G). |
| 3 | major | The dash still passes the launched Brolly canopy and the Roe Shell | **Right.** brolly.js `blockActors` (369–385) runs once a frame from the kit tick (484), with a ±0.56 m band, so a dash crosses it below about 52 fps. The shell's push is a 6 m/s radial shove (bazookarp S6), which the dash's velocity override beats. | New kit hook `blockActor?(actor)` for `SUB_KITS` and `MAIN_KITS`, called from `subs.js blockActor`, so it runs in every dash substep (§0.5). Brolly's push is split into `blockOne(c, e)` and also called from the hook (its tick is unchanged). The dash kit pushes the dasher out of every solid `spheres()` sphere and every enemy Bubble Blower bubble positionally (D1.3). **Found while checking:** the bubble's own push (specials.js:1068) is once a frame too, and near its top or bottom its horizontal radius falls to 0.38 m, so revision 2's "pushes you back, as today" didn't hold at low frame rates; it is now in the loop too (D5). D10.9 adds the canopy, a stand-in shell and a bubble at dt 1/60, 1/30, 1/24. Open question 22 now names the Twinfire roll's canopy crossing below about 29 fps. |
| 4 | major | §0.5 / §0.6 contradict the stages' final ENGINE.md | **Right.** Caldera defines `G.match.lava` (`surfaceAt` / `under` / `covers`), its H17 `destroyWhere` calls `SUB_KITS[k].lavaSweep?.(pred)`, and H19 names "batch 5's new turret and floating bomb"; nobody provides `G.level.liquidY`. Bluestone H17 walks `G.subs.items` only. The aquarium calls aprons "not supported", and its capture calls `weaponRunner.reset()`, which didn't end a dash. | §0.5 / §0.6: `liquidTop(x, z)` from `surfaceAt` or the sea; the Glide sinks on `lava.under(pos)`; the sentry refuses `lava.covers(x, z, floorY, 1)`; the bobber floats over `liquidTop`. Both kit devices implement `lavaSweep(pred)`, which caldera already calls, so **nothing is asked of caldera**. `crushIn` gets a `{ where: pred }` shape for the alternative caldera's own risk 13 names. Each device ends once either way. `G.level.liquidY`, `G.level.noPlace` and the `standingOn` / `liquid` shapes are gone. Open question 24 is closed by the aquarium's decision. `reset()` calls `endDash()` (D1.5, F). **Where I differ on bluestone:** instead of asking bluestone to change its H17 to `crushIn`, the two kits listen to the `era:flip` event themselves (its payload carries `on` and `off` block ids, bluestone ENGINE.md line 426). That is one fewer cross-package dependency; bluestone's H17 stays as written. A bobber whose floor vanishes re-floats instead of ending. |
| 5 | major | "As many as you like": a human's big web is never measured | **Right.** Bots stop at a 4-chain (C7), and the perf test used still bots. | C11: a scripted **web arm** (`bobber-web.js`): 12- and 24-bobber webs, lane and zone layouts, trigger and clear variants, on halyard and treehills. It measures lethal area per trigger, deaths per web, splats per 100 ink, the disarm share before the trigger, and the clear time and ink. Targets: a 24-web no better per 100 ink than the Splat Bomb, and ≥ 50 % of a seen web disarmed before the trigger. Ordered levers, each needing the user's sign-off (Open question 25). C4.1: `perf-bobbers.js` step 4 runs a live 4 v 4 bot Turf match with 192 bobbers (frame time, bots' think time, sight deferrals). The bots' side is bounded: armed chains only, at most 48 bobber discs. |
| 6 | minor | The Glide's cook timing contradicts itself (2.8 s vs 2.95 s) | **Right.** | A1.1 defines `cook = clamp(held − 0.15, 0, 1.8)`: full cook at held 1.95 s, the slip at 2.95 s. `[5]` levels at held 0.75 / 1.35 / 1.95 s (A8); the bot holds `cook + 0.15` (A7); A2's table and A10.1 match. Open question 26. |
| 7 | minor | The Glide's hold code: lock order, `cancelForSwim` side effect, no latch after the slip, barrage, resets | **Right** on all five (weapons.js:77, 151–156). | §0.5: `bar` / `sub` / `SK` at the top of `update()`; `dropCharge()` (`cancelForSwim(true)`, keeps `aimingSub`); `runner.subSpent`, set by the slip and cleared on release; `hold` and `lockMain` return during a barrage (A1.1, Q14). **Where I differ on resets:** instead of a new reset hook, the Glide uses the Shaker's stale-hold rule (shaker.js:197, 601). Any cook whose `hold` hasn't run for 0.15 s fizzles with no ink and `[5, 0]`. That covers every `reset()` (pipe, pick-up, super jump, loadout) with no new hook. A10.7, A10.12. |
| 8 | minor | The dash press runs after the movement step; wrong substep counts; "no firing" not wired; `airTime` | **Right.** actor.js integrates at 345 and runs the runner at 391; ceil(29.2 × dt / 0.2) is 3 / 5 / 7; `busy()` (weapons.js:81) doesn't gate the main weapon; `_resolve` adds 1/60 per call (actor.js:636). | §0.5: `runner.trySubPress(intent.sub, subPressed)` and the dash velocity override run in `actor.update` right after the dodge-velocity override, before `tryDodge` and `_integrate`, so the press frame moves. D1.3: counts 3 / 5 / 7 (air 2 / 4 / 5); `jumped` on the first substep only; `airTime` advanced once. D1.5: the dash kit's `lockMain` masks fire; `tryDodge` refuses during a dash. D10.4, D10.9. |
| 9 | minor | The bot dash dodge has no call site | **Right.** Only `bot.fight` / `bot.paint` exist, behind `bombCd` (bots.js:895, 1005). | D7 rewritten. All dash use lives in `SUB_KITS.dash.botAct`. The loop sits just before `_tail`, after `sp.act`, because `SpecialSense._escape` clears `it.sub` and `_bombAim` mid-escape (botSpecials.js:755 and 759); revision 2's "after the threat block" would have been undone. `bots.js` exposes `thrEvNew`, `thrEvYaw` (now also from `_thrSidestep`) and `thrIn`. The escape heading comes from `brain.sp.esc` with `tInAt` (exported). It presses through `_bombAim` with `brain.dashDir`. D10.7 adds an escape case and per-use counters. |
| 10 | minor | Wave-1 hook-ins: per-bot `prefer`, double `'device:down'`, `_lost` kills a floating bobber | **Right.** deployables-bots.js:50–53 has the bot but read a getter; deployables.js `_pushes` (383–387) and `crush` emit around `endLook`; `_lost` (240–251) destroys with no floor within 40 m. | §0.2: `prefer(brain)` and the pick `x.prefer(b)`; one emitter per ending (wave 1 for `crushIn` and `_pushes`; the kit for shot, its own block test, `era:flip` and `lavaSweep`; none for expiry and the like), checked in `deployables.js`; `_lost` calls `it.lost()` for the bobber, which re-floats (C1.2, C1.10), and `kill(2)` with no event for the sentry. |
| 11 | minor | Missing from §F, and online edge cases | **Right.** (a) botSight's budget is module-private (botSight.js:51, 119–120); `immunity` is `(e, ax, ay, az)` (botSpecials.js:404). (b) hud.js `_cantUse(kind)` (1877) shows only an icon. (c) After a leave, ghosts are orphaned and `sendDevHit` returns on the host (netmatch.js:188–190). (d) The pipe 'pop' phase forces `intent.sub` false. | (a) `export sightRay(a, b)`, used by the sentry and `botAct` (§0.5, B1.3); `immunity(e, mx, my, mz) < 0.3` (§0.7, B1.4). (b) `'sub:cantuse'.reason`, `_cantUse(kind, reason)`, `'sub:note'` for SENTRY DOWN, kit-drawn HUD pieces, hud.js in F. (c) `SUB_KITS[k].dropOwner(actor)`, called from `onLeave` (before re-owning, on every screen) and `_remove` (§0.4, B8, C8, G). (d) **Where I differ:** neither of the review's two options works alone. Clearing the latch only on `!inp.sub` still clears it during the pop phase, because the aquarium's H3(b) forces `intent.sub = false` before actor.js:258–265 reads it. And leaving `_prevIntent.sub` alone isn't enough either, because line 265 copies the forced `false` into it. Fix: `reset()` *sets* the latch, and only a release on a frame with the body free (`!a.pipe`, no super jump, no body special) clears it (§0.5, D1.5, D10.4). |

**Also fixed while revising:**
- D1.5's `endDash()` clamps to 7 m/s everywhere, and D10.10's pick-up test allows the carrier's run rule 0.05 s to
  brake to 4.8 m/s. Revision 2 said "the next frame", which the run decel can't do from 7 m/s in one frame.
- B9's refusal texts are shortened to fit the callout's second line.
- G names job scripts `JOB-<n>.sh` (COMMON.md's runner protocol) and tonight's 8-match cap.

**Kept from revision 2 unchanged:** the four names and ids; the ink costs (65 / 65 / 40 / 55); every gameplay number
(the Glide's reach and radius table, the sentry's 11 m, 0.4 s lock, 22 per round and 15 s, the chain's N table, 25 hp,
5 m links and 0.07 s hops, the dash's 4.5 / 3.5 m and its 50 / 25 blast); the substep size; the `crushIn` idea; the
owner-authoritative records, `netMuted`, `bobberPop`; open questions 1 to 21 and 23.
