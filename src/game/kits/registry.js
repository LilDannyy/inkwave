import { G } from '../../core/ctx.js';
// Registries for main-weapon and sub-weapon kinds that live in their own modules (src/game/kits/<kind>.js). Each kit
// module registers itself when imported (kits/index.js imports them all); the core systems look a kind up here after
// their built-in ones. Hooks are all optional unless marked.
//
// MAIN_KITS[kind] = {
//   update(runner, dt, inp, w)         REQUIRED — per-frame trigger handling (WeaponRunner.update's switch)
//   reset?(runner)                     runner state reset (spawn, death, loadout swap)
//   busy?(runner) / firingPose?(runner)  extend WeaponRunner.busy() / firingPose()
//   moveSpeed?(runner, w)              run speed override while using the weapon (0 / undefined = default)
//   spreadDeg?(runner, w)              current spread (feeds the reticle)
//   tick?(dt) / clear?()               module-owned world objects (projectiles, shields …): once per frame / on match reset
//   blockShot?(prev, pos, team, dmg) → bool   a shot segment prev→pos hits something this kit owns (e.g. a shield)
//   damageTaken?(runner, amount, attacker, source) → amount   scale damage the wielder takes (actor.damage; e.g. the mitts'
//                                      leap armour); ≤ 0 cancels the hit
//   jump?(runner, intent) → bool       claim this frame's jump press (actor.js; e.g. the mitts' leap). runner.kit.hang
//                                      (set by the kit) holds the kid in place (wall cling)
//   bot?: { fight?(brain, ctx) → bool fire, paint?(brain, ctx) → bool fire, paintPitch?, melee?, charges?, long?, painter?,
//           tactics?(brain, ctx)      every fight / retreat frame after the dodge block: owns fire, hold, swim and move
//           stayIn?(brain, ctx) → bool   veto the low-HP retreat (keep fighting when the kill is close)
//           targetBias?(brain, enemy) → number   added to that enemy's target score in _perceive }
//   shields?(out) → out                push a descriptor for every shield up this frame (bots.js flanks held ones and
//                                      steers round launched ones). Stable per shield; getters read live state:
//                                      { kind, held, team, owner, C (disc centre), N (facing / launched: travel dir), R,
//                                        hp, hpMax, live, blocksActors, left, and launched only: pos (foot), halfW (players
//                                        are held back over ±halfW along the wall), planeOff (the blocking plane sits
//                                        planeOff along N from pos), speed }
//   [b5-sub-dash] (tools/botlab/jobs/batch5/subs/SPEC.md §0.5)
//   blockActor?(actor)                 a kit wall for players: push this actor out of what the kit holds up (subs.js
//                                      blockActor, right after every actor's move and inside every dash substep; the
//                                      Brolly: a launched canopy holds enemies back). Idempotent
//   letGo?(runner, why)                drop whatever holds the body still (the Mitts: a wall cling) — a dash leaving it
//   dropCharge?(runner) → bool         drop a charge that outlives a dive (the Cutlass cut, the Mitts leap) without its
//                                      shot: a sub that locks the main weapon (lockMain) starts
// }
// SUB_KITS[kind] = {
//   use(subs, actor, sub)              REQUIRED — the throw / placement on release (SubSystem.use)
//   hold?(runner, dt, inp, sub)        while the sub button is held (charge-up)
//   blocked?(actor, sub) → bool        refuse the throw ("Can't use" — e.g. one already out); emits 'sub:cantuse'
//   tick?(dt) / clear?()               module-owned objects
//   blockShot?(prev, pos, team, dmg) → bool   (shoot-able bombs)
//   blockRay?(from, dir, len, team, dmg) → dist   (charger beams vs shoot-able bombs)
//   damageArea?(c, radius, dmg, team)  a blast went off (G.subs.damageArea): kit objects of other teams caught in it
//   noArc?: true                       no bomb-arc preview while held (the kit draws its own aim guide)
//   bot?: { fight?(brain, dist) → bool throw now, paint?(brain) → bool }
//   [b5-subs] (batch 5's kit subs, tools/botlab/jobs/batch5/subs/SPEC.md §0.2–0.5; each optional):
//   devices?(out) → out                push a device descriptor per live device (deployables.js header: kit: true, pos,
//                                      aim, r, h, live, prefer(brain), hurt(dmg, by), crush(how), flash(), teamFire?(by))
//   rideBodies?(out) → out             push a ride body per device resting on a floor (deployables.js moves it)
//   onPress?: true · lockMain?(runner) · blockActor?(actor) · blockedWhy?(actor, sub) → string   (the other subs)
//   smash?(c, r, team, front(pos) → bool)   the Mega Stamp's swing guard defuses / disarms the kit's objects in front of it
//   botAct?(brain, dt, intent, move, busy) → aim | null   a kit's own bot behaviour, every bot, just before bots.js _tail
//   dangers?({ D, keyOf, disc, see })  add the kit's danger areas to botSpecials.js specialDangers()
//   drawMap?(c, map, tc, s, hex, viewerTeam)   minimap marks (after the built-in devices)
//   dropOwner?(actor)                  a player left: end their objects on this screen at once, quietly
//   lavaSweep?(pred)                   caldera's destroyWhere: end own devices whose pos passes pred (lava)
//   prompt?(actor) → string | null     a prompt for the local player (main.js, after the built-in ones)
//   bot.rides?: true                   may be used on the moving tower
//   threats?(out) → out                push a descriptor for every live object of this kind that hunts / hurts foes
//                                      (bots.js shoots them down or evades them). Stable per object; getters read live
//                                      state: { kind, obj, team, owner, pos (live: feet for walkers, centre for flyers),
//                                        aimY (hit centre above pos), vel, speed, radius (blast), trigger (contact reach),
//                                        ground (walks on the ground), live, state, hp, shootable, locked, target (the
//                                        actor it tracks, or null) } + kind extras (waddle: senseRadius, left;
//                                        torpedo: lockRange, hover)
//                                      [b5-sub-glide] slider: true (a Glide Bomb sliding along the floor): fuse, stopAt (its
//                                        predicted stop), score(bot actor) → number and urgent(bot actor) → bool, which
//                                        bots.js _threatScore / _threatCtl use for it in place of the walkers' / flyers' rules
//   [b5-sub-glide] (SPEC §0.5; the other batch-5 subs add theirs beside these)
//   lockMain?(runner) → bool           the held sub locks the main weapon (weapons.js: read at the top of the runner's update;
//                                      the frame it starts, a charge / stream / wind-up is dropped without firing — dropCharge)
//   smash?(c, r, team, front(pos) → bool)  a Mega Stamp's swing guard at c (reach r) smashes the kit's enemy bombs in front of it
//   dropOwner?(actor)                  online: a player who left takes this kit's objects with them (netmatch onLeave / _remove)
//   prompt?(actor) → string | null     a light-tutorial hint for the local player (main.js; richText: [RMB], {RB} …)
//   [b5-sub-dash] (SPEC §0.5; the Dash Pellet, kits/dash.js)
//   onPress?: true                     the sub acts on the PRESS (WeaponRunner.trySubPress, run in actor.update before the
//                                      move), never the release; latched until a real release with the body free (no
//                                      pipe, super jump or body special). Refused silently in squid form, while carrying,
//                                      during a Bomb Barrage, or while a special owns the sub button (G.specials.ownsSub:
//                                      the Zipline, any that replaces the main weapon); WeaponRunner.update skips its sub
//                                      block for it
//   blockedWhy?(actor, sub) → string   the reason line under "CAN'T USE" ('sub:cantuse' { reason })
//   lockMain?(runner) → bool           the sub locks the main weapon now: a charge / stream / wind-up is dropped (runner
//                                      dropCharge) the frame it starts, fire is masked, runner.mainLocked dims the reticle
//   blockActor?(actor)                 as MAIN_KITS (the dash: the Roe Shell and enemy bubbles, while dashing)
//   botAct?(brain, dt, it, move, busy, bossTh?) → { yaw, pitch } | null   the kit's own bot moves, for every bot, last
//                                      before the think's _tail (turf think; Boss Battle's with bossTh, its telegraphs at
//                                      the bot). A press: set brain._bombAim (and, the dash, brain.dashDir); an aim
//                                      returned is held this frame
//   prompt?(actor, dt) → string | null   a first-time tip for the local player (main.js prompt chain)
// }
//
// Online (src/net/netmatch.js), any kit:
//   ghost?(actor, data)                a remote player's world object, from the owner's G.netm.recKit(actor, kind, data)
//                                      (data: a short array of rounded numbers): build a visual copy — it never paints
//                                      (netmatch mutes paint while ghost() runs; the kit keeps muting in its own tick for
//                                      ghost objects) and never hurts (a remote attacker's hits are dropped). Shields /
//                                      curtains stay solid (they block the local player's shots like the owner's do).
//   netHurt?(id, dmg, by)              the owner's side of a device hit made on another screen (registry netHurt; [b5-subs]
//                                      by: the attacker's actor on this screen, or null)
// [b5-subs] batch 5's kit-device hooks (tools/botlab/jobs/batch5/subs/SPEC.md §0.2–0.5), SUB_KITS[kind]:
//   devices?(out)                      push one stable descriptor per live device (deployables.js walks them: shots, the
//                                      tower, rolls, standing fire, crushIn, the bots' device shooting): { kind, kit: true,
//                                      obj, team, owner, pos (the hit capsule's foot), aim (its centre), r, h, hitH, normal,
//                                      floor (block id under it or −1), ghost, rides (the block it rides or null), live,
//                                      prefer(brain), hurt(dmg, by), crush(how), flash(), teamFire?(by) }
//   rideBodies?(out)                   push one ride body per live device on this screen (wave 1's attach / carry / netOn /
//                                      _pushes / _lost move it): { pos, normal, mesh, state: 'kit', floor: true, kind, team,
//                                      ghost, gid, owner, netKind, kill(why), lost?() }
//   lavaSweep?(pred)                   own devices whose pos passes pred end in the lava (caldera's destroyWhere)
//   drawMap?(c, map, tc, s, hex, viewerTeam)   minimap marks, after the built-in devices
//   blockedWhy?(actor, sub) → string   the reason line under "CAN'T USE" ('sub:cantuse'.reason)
//   bot.rides?: true                   this sub may be used on a moving tower (bots.js)
//   threats(out) descriptors may carry turret: true (a standing gun: range, locked, target — bots.js _threatScore)
//   MAIN_KITS only: netState?(runner) → int   the pose / state bits other screens need (packed each tick)
//                   netApply?(runner, bits, dt)   a remote runner: rebuild runner.kit from those bits
// KIT_GHOSTS[kind] = { ghost } — ghost-only entries for things that aren't a main or sub kit (e.g. a special's objects)
export const MAIN_KITS = {};
export const SUB_KITS = {};
export const KIT_GHOSTS = {};
// the local owner records a spawn for the other players (no-op offline / for remote actors)
export function netRec(actor, kind, data) { G.netm?.recKit?.(actor, kind, data); }
// a network id for an owner's world object (its ghosts carry the same id): owner nid × 1e5 + a per-session sequence
let _seq = 0;
export function netId(owner) { return owner && owner.nid !== undefined ? owner.nid * 100000 + (++_seq % 100000) : 0; }
// a non-owner damaged a ghost device (a remote player's sprinkler, curtain, waddle …): the owner's copy takes it.
// (kind: 'subs' for SubSystem items, else the kit kind — its netHurt(id, dmg) applies it on the owner's screen)
// ([b5-subs] by: who fired it — it rides as the 'dh' message's attacker, so the owner's 'device:down'.by / assist knows)
export function netHurt(owner, kind, id, dmg, by = null) { if (id && dmg > 0) G.netm?.sendDevHit?.(owner, kind, id, dmg, by); }
// run fn with paint muted when obj is a ghost (a remote player's copy): its splats are the owner's to send
// true while a ghost (a remote player's replayed shot / bomb / sub) is being simulated: its damage to devices counts for
// nothing here — the owner's own copy hits our ghost of the device and that hit arrives by netHurt
export function netMuted() { return (G.netm?.mute | 0) > 0; }
export function ghostMute(obj, fn) {
  const nm = obj && obj.ghost ? G.netm : null;
  if (nm) nm.mute++;
  try { return fn(); } finally { if (nm) nm.mute--; }
}
