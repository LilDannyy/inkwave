# Bazookarp: the engine design spec

INKWAVE's Rainmaker, with Splatoon 3's checkpoints. This document is what the engineers build from. The user's rule
text (`../REQUEST.md`, "New mode: bazookarp") is the authority. Section 2 maps every sentence of it to an INKWAVE rule.
Where this document and the user's words disagree, the user's words win. Section 12 lists the open questions.

**Revision 3 (2026-10-04).** This revision answers the second rules-fidelity review and the second engine / netcode
review. Every issue is fixed in the spec; the "Review log (revision 3)" at the end lists each one. The biggest changes:

- **The host scores a remote carrier only from the positions that carrier really sent** (each received sample, as it
  plays), never from the smoothed or extrapolated position it draws, and a continuity clamp refuses any reading that
  jumps further than a carrier can move. Plants and knockouts are judged the same way (§3.4, §7.5).
- **The carrier graph knows hops and gap jumps.** The nav graph has no edge for a 1.25–1.8 m hop or a jump across a
  gap, so the field and the checker missed real moves (up to 46 m of count on terraces). The Carp Field now adds hop
  and gap edges, and the checker proves them with a kid stepped through the real physics (§3.2, §4.4).
- **Stage states** (bluestone's eras, caldera's lava) reset the retreat mark at every switch, and one interface table
  states what each new stage provides (§3.3, §5.5). Caldera's "rebuild the field mid-match" is replaced by two
  precomputed lava states.
- **"Instantly splatted" is literal:** the burst and the Carp Blast also ignore spawn, super-jump and Tidal Slam
  invulnerability. Resting spots stay 9.7 m from every spawn pad, so a burst never reaches a respawn (§2.1 S4, §2.7).
- **The gauge freeze is one guard on the carrier**, so a teammate's Drainbow can't charge it either (S22).
- **The Carp Shot's blast is applied on each victim's screen without `applyHit`** (which netmatch drops for a remote
  shooter), and the victim records the hit so the shooter gets its marker (§2.5, §7.5).
- **Five hook sites fixed:** barrage bombs count as specials on the shell, the Tidal Slam is hooked, the carrier's
  Bubble Guard is really removed on every screen, the Mitts leap and dodge rolls are gated, and shots stop on the shell
  before the players behind it (§5.4).
- **Bots:** a carrier gate in `BotBrain.update` and a carrier-aware `_pathTo` replace "about 25 lines" (§8.7).
- **The build plan is re-cut:** a small WP0 (the field, data and kit) first, then the engine, the shell's damage
  plumbing and the checker in parallel, with the online structure built in from the first package (§11).

Units: metres, seconds, hit points (a kid has 100), special points `p` (a gauge holds 170–200, `WEAPONS.*.specialCost`).
"Alpha" in code means team 0 and "Bravo" team 1. Neither is the user's hidden Alpha in rule S40 (section 2.9).

---

## 0. The design in ten lines

1. **Start.** A carp-shaped ink bazooka, the **Bazookarp**, rests in **the Pond** at the stage's centre, inside a **Roe
   Shell**. Both teams shoot the shell in a tug-of-war. When one team's ink fills it, it bursts and splats every
   opponent within 4.5 m who has a clear line to it, whatever armour or invulnerability they have.
2. **Carrying.** Anyone runs into the freed Bazookarp to pick it up. The carrier:
   - is 20 % slower;
   - cannot super jump, enter a spawn, or use their main, sub or special;
   - has a special gauge that cannot rise;
   - fires the **Carp Shot**: a charged, arcing ink bomb that blows up 0.45 s after it lands, splats at full charge,
     costs no ink and kicks the carrier backwards.
3. **Fuse.** Each pick-up starts a 60 s fuse. It burns 3× as fast while the carrier retreats on their own half or
   stands in their own **Carp-Free Zone**. At 0 the Bazookarp explodes.
4. **Score.** The score is a count from 100 at the Pond to 0 at the enemy's **Dragon Gate**. It is measured along the
   **Carp Field**, a walking-distance field over the stage's nav graph plus the hops and gap jumps a carrier can make.
   It is read through the node under the carrier's feet, so no spot reads closer than it really is. Each team keeps
   its best count.
5. **Weirs.** Each side has one weir, or two on different routes, near the middle of the way from the Pond to the
   Gate. A team cannot score past its weirs until it lands the Bazookarp on one of them. Landing it on either:
   - sets the Bazookarp on that weir;
   - lowers all of that team's weirs;
   - raises that team's Dragon Gate;
   - re-forms the shell. A re-formed shell is half as tough as the opening one.
6. **Knockout.** Carrying it into the risen Gate is a knockout. Otherwise the lower count wins at 5:00. On equal
   counts, whoever got there first wins.
7. **Overtime** follows the user's three start conditions and four end conditions, timed in seconds. Its 10 s pick-up
   windows count only while somebody could act on the Bazookarp.
8. **Online.** The host is the judge of the score, the clock, the shell's meter, pick-ups, drops, plants and
   explosions. For a remote carrier it judges only from the positions that carrier sent. A carrier's own screen
   simulates its movement and shots and judges where it stands: the fuse's ×3, its half, its free zone and its last
   footing. A Carp Shot's blast is judged on each victim's own screen, like a Surf N' Turf ring, so the 0.45 s dodge
   window survives lag.
9. **Stage data.** Each stage has `LAYOUT.bazookarp`: the Pond, the weirs, the Gate and the free zones, drawn for
   Alpha's attack on Bravo's half (the same convention as Tower Command). Mode-only pieces use `onlyIn: 'bazookarp'`
   and get a lightmap variant `<id>.bazookarp`. `tools/botlab/bazookarp-check.cjs` checks every stage against
   section 9.
10. **Build plan** (§11):
    - WP0: the Carp Field, the stage data and the kit (small, first);
    - then in parallel: WP1a (the engine, online-shaped from day one, with the Carp Shot), WP1b (the shell and every
      damage site) and WP4a (the checker);
    - then WP2 (the wire, HUD, menus, looks, sound) and WP3 (bots) in parallel, and WP4b (the two reference layouts,
      halyard and lockgate), balanced together with WP3.

    After WP4b, the per-stage layout builders work in parallel.

---

## 1. Fiction and names

A carp that leaps the waterfall at the Dragon Gate becomes a dragon. The Bazookarp is that carp, made into an ink
bazooka by a Grizzco-adjacent prop shop (its scales are fishing floats). Every name follows from that picture.

| thing | name | look |
|---|---|---|
| the mode | **Bazookarp** (menu label `BAZOOKARP`) | the user's name |
| the object | **the Bazookarp** ("the carp" in casual HUD lines) | a koi carp about 1.1 m long, worn on the shoulder like the Twister Zooka. The mouth is the muzzle, the tail fin is the grip, the back is a row of float-scales. Resting, it is white-gold and glows. Held, its scales take the carrier's team ink. |
| its shield | **the Roe Shell** | a giant translucent fish egg, 1.6 m in radius. Each team's hits swirl their ink into it from the side they hit. It swells to 2.3 m and cracks as one team pulls ahead. |
| the shell bursting | **Roe Burst** | an ink explosion in the bursting team's colour, with a visible shock ring at 4.5 m (the splat radius) |
| the shot | **the Carp Shot**, in three sizes: *Splash* (charge < 50 %), *Burst* (50–99 %) and *Big Burst* (full) | an ink ball the size of a head, lobbed. It splats where it lands, swells, then bursts. A Big Burst also throws up a short spinning water-spout, which nods to the user's "small twister … large tornado-like twister". |
| the timer | **the fuse** | a burning wick of seconds over the carrier's head |
| the fuse running out | **Carp Blast** | a huge burst in the *enemy's* ink |
| the start / reset pedestal | **the Pond** | a round ink basin flush with the floor at the stage's exact centre |
| checkpoints | **weirs** (one per side, or two on different routes) | two stone posts with carp-head caps and a curtain of falling ink (the attacking team's colour) between them. "Lowering" means the curtain drains and the caps sink 0.6 m. |
| the goal pedestal | **the Dragon Gate** | a low round plinth 3.4 m across between two tall posts. It is sealed (dark lid, arch down) until the team lands the Bazookarp on a weir. Then a carp-dragon arch rises between the posts with a column of light in the attacking team's ink. |
| the free zones | **Carp-Free Zones**, signposted **NO CARP** | a crossed-out carp on a post at each entrance; faint diagonal hatching on the floor in the owning team's ink |
| the glow of a swimming carrier | **the wake glow** | a carp-shaped shimmer under the ink surface with ripples, in the carrier's ink |
| the halfway line | **the halfway line** | not drawn in the world; shown faintly on the TAB map |

### 1.1 Every HUD string

INKWAVE's voice: call-outs in capitals with a short sub-line, prompts in sentence case, and `[KEY]` tokens that the
HUD's `richText` turns into the player's own bindings.

**Call-outs** (`_zCall` banners; "us" means the viewer's team):

| when | us | them |
|---|---|---|
| match start | `BURST THE ROE SHELL!` / sub `Then carry the Bazookarp to their Dragon Gate` | the same |
| shell burst | `SHELL BURST!` / sub `GRAB THE BAZOOKARP!` | `THEY BURST THE SHELL!` / sub `STOP THE GRAB!` |
| pick-up (by you) | `YOU'VE GOT THE BAZOOKARP!` / sub `60 s to land it — go!` | |
| pick-up (a teammate / an enemy) | `WE'VE GOT THE BAZOOKARP!` | `THEY'VE GOT THE BAZOOKARP!` / sub `SPLAT THE CARRIER!` |
| carrier splatted | `WE LOST THE BAZOOKARP!` | `CARRIER DOWN!` |
| landed on a weir (all of that team's weirs lower) | `WEIR DOWN!` / sub `Their Dragon Gate is open!` | `THEY TOOK A WEIR!` / sub `Our Dragon Gate is open — defend it!` |
| their carrier near our open Gate (count ≤ 15) | | `THEY'RE AT THE GATE!` |
| fuse ran out | `IT BLEW UP ON US!` | `THEIR BAZOOKARP BLEW UP!` |
| reset to the Pond | `BACK TO THE POND!` (small) | the same |
| knockout | `KNOCKOUT!` (the existing knockout banner) | the same |
| overtime, losing team | `OVERTIME!` / sub `Grab it within 10 s!` or `Carry it past their count!` | |
| overtime, winning team | | `OVERTIME!` / sub `Stop them — 10 s to hold!` |

**Bottom of the carrier's screen.** These are the user's two messages, in big type above the prompt line, with the
fuse's ×3 ring:

- `DON'T RETREAT!` / sub `Fuse burning 3× — turn around` (the user's words, kept verbatim)
- `BAZOOKARP-FREE ZONE!` / sub `Fuse burning 3× — get out` (the user's "Rainmaker-free zone!")

**Prompts** (`frame.prompt`, the light tutorial line):

- `Shoot the Roe Shell in the middle — when your ink bursts it, foes close by are splatted` (first 8 s)
- `Run into the Bazookarp to grab it` (the Bazookarp is free and you are within 12 m)
- `Hold [FIRE] to charge a Carp Shot · carry it to a weir` (first carry)
- `Land it on a weir to open their Dragon Gate` (carrying, the team's weirs are still up)
- `Into the Dragon Gate for a knockout!` (carrying, the Gate is up)
- `Burst the shell again and carry it on to the Dragon Gate` (after your team lands it on a weir)
- `Their carrier's marked — follow the carp` (enemy carrying, you are not carrying)

**"Can't use" bonk** (the existing `sub:cantuse` callout, kind `karp`):

- `Can't use your kit while carrying` (sub or special pressed)
- `Can't super jump with the Bazookarp` (TAB map)
- `You can't take it into a spawn` (the barrier shoves you, at most once per 3 s)
- `Finish your special first` (touching the free Bazookarp mid-special)

**Over the carrier's head** (world marker): the carp glyph plus the fuse seconds (`42`). Under 10 s it turns red and
beats every second. It shows `×3` while the fuse burns fast.

**Results reasons** (winner's view / loser's view):

| reason | winner | loser |
|---|---|---|
| `knockout` | `KNOCKOUT!` | `Knocked out` |
| `time` | `Time's up` | `Time's up` |
| `untouched` | `Nobody touched it — the coin was yours` | `Nobody touched it — the coin went their way` |
| `comeback` | `Carried past them in overtime!` | `Overtaken in overtime` |
| `retake` | `Took it back in overtime` | `Lost it in overtime` |
| `no-pickup` | `Held them off in overtime` | `Too slow to grab it in overtime` |
| `stopped` | `Stopped their carrier in overtime` | `Carrier splatted in overtime` |
| `overtime-cap` | `Won at the overtime limit` | `Lost at the overtime limit` |

---

## 2. The rules

All numbers live in `BAZOOKARP` in `src/config.js`. The full block is in the appendix.

### 2.1 The rules table, sentence by sentence

| # | the user's sentence (abridged) | INKWAVE rule |
|---|---|---|
| S0 | "our version of Rainmaker" | The mode `bazookarp`: 4 v 4, 5:00 + overtime, count 100 → 0. Offered on every stage, offline and online. |
| S1 | "teams … move a certain object to a point in the other team's base" | Alpha carries the Bazookarp to its Dragon Gate on Bravo's half, and Bravo to its Gate on Alpha's half (the mirror). |
| S2 | "only one player may have control … and they control where it goes" | Exactly one carrier at a time (`karp.holder`). The Bazookarp moves only with its carrier, or by the engine's drop / reset rules. |
| S3 | "encased in a shield … must be freed before it can be picked up" | The Roe Shell (§2.2). While the shell is intact or re-forming, nobody can pick the Bazookarp up. |
| S4 | "If one team bursts the … shield, all players of the other team caught in the blast radius are instantly splatted" | The shell bursts when one team's net damage fills it (1000 for the opening shell, 500 for a re-formed one). Every player of the *other* team whose chest is within **4.5 m** of the shell's centre, with a clear line from the centre to the chest, is splatted at once with cause `karp-burst`. The line-of-sight test is the one every INKWAVE blast uses (§2.9). "Instantly" is literal: the splat calls `actor.splat()` directly, so it ignores Bubble Guard, Kraken armour, kit armour **and every kind of `invuln`**: spawn invulnerability (1.6 s), a super jump's flight and landing (flight + 0.2 s) and the Tidal Slam's 0.3 s. A burst still never reaches a respawning player: the Bazookarp never rests within **9.7 m** of a spawn pad (spawn barrier 4.2 + burst radius 4.5 + 1.0, §2.7), and players respawn 1.1 m from the pad's centre. The one exception is the aquarium's pipe riders, who are inside a glass pipe (`a.pipe && a.pipe.phase !== 'suck'`, §9.4). The kill is credited to the bursting team's last hitter. |
| S5 | "can then be picked up by either team" | A burst shell leaves the Bazookarp **free**. Any living player of either team can pick it up (§2.3), after a 0.25 s hold that keeps online races fair (§7.3). |
| S6 | "Touching an intact shield causes a small amount of damage" | Touching the shell does **20** damage, at most once every **0.5 s**, and shoves you out at **6 m/s**, never off an edge (§2.2). It never takes you below **1 hp**: "a small amount" never splats. Your own team's players are hurt too. |
| S7 | "effects on the carrier" | §2.4. |
| S8 | "within sixty seconds or it explodes, splats the carrier and every friendly player in the blast radius, and covers the ground with enemy ink" | The **fuse** is **60 s**, fresh on every pick-up. At 0, the Carp Blast splats the carrier and every one of the carrier's teammates within **4.5 m**, with a clear line from the centre (the same test as S4; cause `karp-fuse`; credited to nobody). Like the burst, it calls `actor.splat()` directly and ignores armour and every `invuln`; only aquarium pipe riders are skipped. (It could reach a teammate dropping onto the carrier's own pad only if the carrier let the fuse run out at its own spawn barrier's edge, which is inside its own Carp-Free Zone at ×3: self-inflicted, and once.) It paints the *other* team's ink over a **5.0 m** radius. Where the Bazookarp goes next: §2.6. |
| S9 | "The marker displaying the time remaining appears above the carrier's head" | A world marker over the carrier: the carp glyph plus the whole seconds left. Red under 10 s; `×3` while fast (§6.4). |
| S10 | "on their side of the map and they retreat a certain distance backwards, 'Don't retreat!' … three times faster" | Applies only on the carrier's own half (§3.3). `mark` is the carrier's best progress along the Carp Field since the pick-up, since entering their own half, or since the stage last switched state (an era or lava change, §3.3), whichever is latest. When the carrier's progress falls **8 m** or more below `mark`, the fuse burns at **3×** and `DON'T RETREAT!` shows on the carrier's screen at once (it is judged on that screen, §3.3). |
| S11 | "moves close enough back to where they began to retreat, the message disappears and the timer ticks at its normal rate" | The penalty clears when progress is back within **3 m** of `mark`. The 8 m / 3 m gap is hysteresis, so the penalty never flickers. Leaving their own half also clears it. |
| S12 | "also ticks faster … in a prohibited area, displaying 'Rainmaker-free zone!'" | In one of their *own* team's Carp-Free Zones, the fuse burns at **3×** and `BAZOOKARP-FREE ZONE!` shows. Retreat and free zone together still make 3× (the faster of the two, not 9×). |
| S13 | "when the carrier … explodes on their side of the stage, the Rainmaker resets to the center" | The Splatoon 2/3 behaviour is used. A Carp Blast on the carrier's own half sends the Bazookarp back to the Pond. A blast on the enemy half leaves it at the drop spot where the carrier stood, and the shell re-forms there. |
| S14 | "shooting large bursts of ink which lands in a small area on landing before causing a huge explosion after a short delay" | The Carp Shot (§2.5): it lands, splats **0.9–1.5 m** of ink, swells for **0.45 s**, then blows over **1.8–4.0 m**. |
| S15 | "similar attributes to a charger-class weapon … a charge mechanic" | Hold fire to charge. Full charge takes **1.2 s**. Release to fire. The carrier walks at **2.4 m/s** while charging. A full-charge ring and a ding mark full charge, as the charger has. |
| S16 | "range from a small twister or burst to a large tornado-like twister or big, explosive burst depending on the length of time … held" | Size scales with charge (Splash → Burst → Big Burst, §2.5). The Splatoon 2/3 exploding ball is built, not Splatoon 1's twisters: S14, S17 and S18 describe the ball, and the Twister Zooka already owns twisters. The Big Burst's water-spout is the visual nod. |
| S17 | "At maximum charge, the shot is lethal" | A Big Burst does **180** within **2.4 m** (one splat). It falls to 55 at its 4.0 m edge. Below full charge, the centre does at most **90**, so full charge is what kills. |
| S18 | "fired in an arc … hit enemies behind cover … much less effective in close quarters" | The shot leaves the carp's mouth **1.4 m** above the carrier's feet, lobbed **25°** above the aim, with gravity 22. At level aim it comes down to the floor the carrier stands on **7.8 m** (Splash) to **20.1 m** (Big Burst) away, and reaches about 24 m aiming up. The flight (0.68–0.99 s) plus the 0.45 s swell is what makes it weak up close: a foe at 3 m has time to step out. Online, that dodge is judged on the foe's own screen (§7.5). There is no aim assist; an arc preview with the landing ring shows where it will go. |
| S19 | "shots … do not consume ink" | Carp Shots cost **0** ink. The tank refills as usual (swimming), so the carrier drops the Bazookarp with the ink they have. |
| S20 | "cannot Super Jump, enter any spawn point, nor … use any of their main, sub, or special weapons" | While carrying: `canSuperJump()` is false (TAB map bonk). The spawn barrier holds the carrier out of **both** spawns: its own pad as well as the enemy's (radius `spawnBarrier`, 4.2 m). Fire drives the Carp Shot; sub and special presses bonk. A special cannot be started (`specialReady()` is false). The carrier's own Bubble Guard ends at the pick-up (§2.3), and a carrier never passes a Bubble Guard on to a teammate: passing it is using a special. Dodge rolls and kit jump actions (the Mitts leap) are off: the jump button only jumps. Teammates *can* super jump to the carrier. |
| S21 | "movement speed and swim speed are reduced by 20%, and speed-increasing abilities affect the player normally no matter what weapon" | Every speed of the carrier's body is **`PLAYER`'s speed × 0.8**, the same for every weapon ("no matter what weapon"): run 6.0 → **4.8**; in the air max(4.8, `airMinSpeed` 4.6) = **4.8**; swim 11.8 → **9.44**; squid on dry ground 2.9 → **2.32**; wall climb 7.5 → **6.0** (sideways 5.2 → **4.16**); wading enemy ink 1.9 → **1.52**. The weapon's own `moveSpeed()` is never used for a carrier: the brolly, mitts, bow and blade kits change it. INKWAVE has no speed abilities; the slows that exist (Murk Bomb, Deep Sonar) multiply on top, as they do for anyone. Jump height is unchanged. |
| S22 | "The special gauge does not charge while carrying" | **Nothing raises a carrier's gauge.** This is one guard on the carrier, not a hook per source: at the pick-up the carrier's screen stores `carry.sp = a.special`; at the end of every frame (after actors, specials, subs and the engine) it sets `a.special = min(a.special, carry.sp)` and then `carry.sp = a.special`. So turf (`addTurf`), passive charge, a cheer (zipcheer's wisp), a **teammate's Drainbow share** (sp-drainbow.js gives every teammate inside it gauge while it drains foes) and any future source are all blocked. The gauge may still **fall**: an enemy Drainbow drains a carrier's gauge as it drains anyone's, since the user forbids only charging. `specialReady()` is false while carrying, so no `special:ready` fires. |
| S23 | "If it is dropped, the … shield reforms around it" | Every drop re-forms the shell around the Bazookarp: **0.8 s** to grow, then a fresh shell at **500** hp (`shell.reformHp`; the opening shell is 1000, §2.2). |
| S24 | "It can then be recaptured by any player on both teams" | After the shell bursts again (S3–S5). |
| S25 | "falling off the stage while behind the halfway point … resets … in the center" | A carrier who falls (water, void, lava, any `fallDeath`) while their **last solid footing** was on their own half: the Bazookarp goes back to the Pond. |
| S26 | "falling off the stage over the halfway point … regenerates its shield where the player fell from" | If that last footing was on the enemy half, the Bazookarp lands at that footing (its drop spot, §2.7: the nearest acceptable resting node, on that same half) and the shell re-forms there. It never resets to the Pond from the enemy half. |
| S27 | "After firing … a knockback effect" | Every shot kicks the carrier **backwards** along the aim's horizontal direction: **2.5 m/s** (Splash) to **6.0 m/s** (Big Burst), decaying with τ = **0.3 s**. That is about 0.75 m (Splash) to 1.8 m (Big Burst) per shot. In the air the kick is × 0.6. |
| S28 | "pushback … through enemy ink reasonably quickly … firing … behind repeatedly … a little extra push" | The kick is added *after* the movement model, so enemy ink's 1.52 m/s cap never cancels it. Splash shots fired backwards as fast as allowed (one per 0.4 s) move a carrier through enemy ink at about **3.4 m/s**, against 1.52 m/s walking. |
| S29 | "the rainmaker symbol marking them for everyone to see above their head alongside the sixty-seconds explosion timer" | The world marker (S9) for every player of both teams, plus the carp badge on the carrier's squad icon. |
| S30 | "seen on the map and even through walls when the player is in humanoid form" | In kid form: shown to everyone on the minimap and TAB map, and over the head through walls (a DOM marker, pinned to the screen edge with an arrow when off screen). Through `registerReveal('karp', …)` the carrier counts as *revealed* to the enemy, which is also how bots know (§8.6). |
| S31 | "When swimming in ink … the symbol disappears for the enemy team … but an additional glow is added where the carrier swims" | While the carrier is submerged or swimming up an inked wall: the enemy loses the over-head marker, the edge pin, the map icon and the reveal. Other reveals still apply (tracked, hurt, standing in enemy ink). The carrier's own team still sees all of it. Everyone sees the **wake glow** in the world, depth-tested (only with line of sight); bots notice it with a clear line out to 20 m (§8.6). Squid on dry ground is not swimming: the marker stays. |
| S32 | "one or two goals closer to the middle of the stage called checkpoints" | Each side has **1 or 2 weirs** between the Pond and the Gate, each at **40–55 %** of the Pond-to-Gate distance (count 60–45, §9.1). Two weirs are alternatives on two different routes, at the same count (±2). Every weir has two workable routes from the Pond (the research's "at least two workable routes to each checkpoint", checker #5). |
| S33 | "Once a player plants the Rainmaker on a checkpoint, all checkpoints will lower and the Rainmaker goal will pop up" | A carrier entering one of their team's standing weirs plants it: feet within **1.8 m** horizontally of its centre and within **±0.6 m** of its floor. The Bazookarp is set on that weir and the carrier is released. **All** of that team's weirs lower, and its Dragon Gate rises (**1.4 s**). This is the literal reading: with two weirs, planting either one lowers both. The other team's weirs, on the other half, are untouched (§2.9). |
| S34 | "The shield will reform, and either team can then break the shield and take the Rainmaker" | A plant re-forms the shell around the Bazookarp on the weir (0.8 s, 500 hp). Then S3–S5 again. |
| S35 | "the special gauge of the player carrying it will display the Rainmaker and the player icons at the top of the screen will show which player is holding it" | The carrier's special orb shows the carp glyph (frozen fill). The carrier's squad icon at the top carries a carp badge, on both teams' HUDs, all the time. |
| S36 | "A team must land the Rainmaker on a checkpoint before they can score any points beyond it" | Until a team plants, its count cannot go below its weir's count. With two weirs, the cap is the higher of their two counts (§3.4). |
| S37 | "'winning team' … closer to the other team's base … (if tied, the team who carried to the tied point first)" | `winning()` is the lower count. On equal counts, the earlier `reachT` (match time the count was first reached). With both at 100 (nobody has scored), the hidden coin team (§2.9). |
| S38a | OT begins: "latest carrier, on the winning team, gets splatted while holding … less than fifteen seconds before the end of regulation" | At time-up, overtime starts if all of these hold: nobody holds the Bazookarp; the last carrier was on the winning team; and that carrier lost it to a splat (any cause, including a fall or the fuse) with **less than 15 s** on the clock. "Less than" is strict: at 14.9 s yes, at 15.0 s no. |
| S38b | OT begins: "The losing team is in control" | At time-up, overtime starts if the losing team holds the Bazookarp. |
| S38c | OT begins: "latest carrier, on the losing team, breaks through the checkpoint less than a few seconds before the end" | At time-up, overtime starts if all of these hold: the last carrier was on the losing team; it planted a weir with **less than 5 s** on the clock (strict); and nobody holds the Bazookarp now. "A few seconds" = 5. |
| S39a | OT ends: "The winning team regains control" | A winning-team player picks it up: the winning team wins (`retake`). |
| S39b | OT ends: "losing team fails to pick up … 10 seconds after: overtime commences / … breaks through the checkpoint" | A **10 s** pick-up window opens at the user's two moments: (1) when overtime starts; (2) when the losing team plants a weir, either in overtime or as the S38c plant that started it. For an S38c start the window therefore counts from the plant, as the user wrote, not from time-up. Time while the Bazookarp is re-forming (0.8 s) or flying back to the Pond (1.5 s) does not count, since nobody can touch it then (§2.9). If the losing team does not hold the Bazookarp when the window closes, the winning team wins (`no-pickup`). Online, a guest's claim sent before the window closed still counts if it reaches the host within 0.4 s (`claimAge`) of the close (§7.3). While the losing team holds it, the window is moot. Example: a plant with 4 s on the clock opens a window that closes 10.8 s after the plant, which is 6.8 s into overtime. |
| S39c | OT ends: "carrier on the losing team gets splatted while holding" | Any loss of the Bazookarp by a losing-team carrier ends overtime for the winning team (`stopped`): a splat, a fall, the fuse, or leaving a humans-only room. A plant does not end it. Nor does a grant that the claimant's screen declines because its player had already died there (§7.3): that player never held it. |
| S39d | OT ends: "losing team carries … past the winning team's score, giving them the victory" | The losing team's count drops strictly below the winning team's, including through a weir plant: the losing team wins (`comeback`). A knockout also wins. |
| — | (no cap in the user's text) | A safety cap: **300 s** of overtime, after which the winning team wins (`overtime-cap`). The fuse makes this practically unreachable (section 12, Q7). |
| S40 | "not been touched for the whole match, Team Alpha wins" | `touched` becomes true on the first **pick-up** by anyone (a declined grant, §7.3, is undone and does not count). If it is still false at time-up, the coin team wins (`untouched`). No overtime is possible: nobody ever held it. |
| S41 | "Alpha and Bravo are assigned randomly … players are not informed" | The host rolls a hidden **coin** (0/1) at match start. It goes in the start config, never in the HUD. The results reveal it only through the `untouched` reason. See §2.9. |
| S42 | "status of the shield (popped or not) does not matter" | A burst shell does not make the Bazookarp "touched"; only a pick-up does. |
| S43–S44 | "When a team possesses the Rainmaker, the special gauges of the opposing team will fill at 3p per second" | While team T holds it, every living player of the other team not running a special gains **3 p/s**. |
| S45 | "When the Rainmaker is unclaimed, the special gauges of the losing team will fill at 3p per second" | While nobody holds it (shielded, re-forming, free, resetting), the losing team gains **3 p/s**. Exception: while both counts are 100, nobody gains, so the coin never shows (section 12, Q5). |
| S46 | "Prohibited areas … areas that are harder for the enemy team to reach" | Carp-Free Zones are drawn per stage (§4) over high ground or back areas on a team's own half that the enemy cannot reasonably reach. Every stage has at least one per team: its spawn deck beyond the barrier. A flagged plateau must be covered completely (checker #9). |
| S47 | (history: version 2.4.0) | nothing |
| S48 | "indicated with a … signpost by their entrance" | A NO CARP signpost at each entrance (data `signs`, auto-built as mode-only pieces). The checker lists every entrance of every zone and FAILs one with no sign within 2 m (checker #9). Placeholder zones get their signs placed automatically at their entrances. The floor inside is hatched for everyone. |
| S49 | "enters the prohibited area on their side … timer ticks faster, just like when retreating" | S12. A zone lies wholly on its owner's own half: the checker FAILs any zone node that is not on the owner's half (`D_owner > D_other`, checker #9), so a zone can never put the ×3 on a carrier who stands on the enemy half. |
| S50 | "runs out of time or gets splatted in the prohibited area, the Rainmaker respawns at the center" | A carrier splatted for any reason (fuse included) while inside their own Carp-Free Zone: back to the Pond. A fall from inside a zone is judged by S25/S26, unless the last footing was inside the zone, which also means the Pond. |
| S51 | "effects do not occur when the attacking team enters the prohibited area of the defenders" | The other team's zones do nothing to a carrier: no ×3, no reset. A carrier splatted in the enemy's zone drops at the nearest acceptable resting spot outside it, on the same half, however far that is (§2.7); never at the Pond. Why not inside the zone: a free zone is by definition ground the zone's enemies cannot reasonably reach, so a shell resting there could be fought over by one team only, and the zone's owners would then start their carry inside their own zone at ×3. Just outside it is the nearest fair spot. |
| S52 | "feel free to do vast stage redesigns to make all stages playable" | Section 9: mode-only redesigns through `onlyIn: 'bazookarp'`, their own lightmap. |

### 2.2 The Roe Shell, exactly

- **Meter.** One signed number `m` from −hp to +hp; it starts at 0. Alpha's damage adds and Bravo's subtracts. At
  `m = +hp`, Alpha bursts it and Bravo players nearby are splatted; at −hp the reverse.
- **Toughness.** The opening shell at the Pond has **1000** hp (`shell.hp`). Every re-formed shell has **500**
  (`shell.reformHp`): after a drop, a plant, a reset to the Pond, or a move off a covered resting spot (§2.7). Why the
  difference:
  - the opening tug-of-war is a full-team fight that should last 6–12 s;
  - a re-form is a local fight, usually a few players against one or two;
  - overtime gives the losing team 10 s to burst it *and* pick it up (S39b). Against a fresh 1000 hp tug-of-war that
    is close to impossible, which would turn two of the user's three overtime starts into an automatic loss.

  Both numbers are starting values. WP3 tunes them against the bot-match targets in §9.1 (time to the first pop, and
  overtime wins by the losing team).
- **How damage reaches it.** The shell is an *objective target*, hit the way Boss Battle's boss is hit, not the way
  devices are. A new registry, `G.objTargets` (`src/game/objTargets.js`, about 150 lines), offers the boss's calls with
  the same arguments plus one optional options object:
  - `segHit(a, b, pad) → { t, point } | null`: `t` is the fraction along the segment a → b where it meets the shell.
    The projectile, beam and fling code asks it **before** it tests players. A projectile that meets the shell is
    stopped there: its segment is cut to `point` before the actor loop, so it can only hit players in front of the
    shell (weapons.js tests actors at 1642–1665 and the boss only at 1671; the boss check is not the model for the
    order). A beam compares distances, as the charger beam does with the boss (weapons.js 1302–1304): the nearer of
    the shell and the first player stops it;
  - `hit(attacker, dmg, wid, point, o)`: a shot, beam, fling, droplet or melee swing that connected;
  - `splash(attacker, c, R, dmgMax, dmgMin, wid, o)`: every blast;
  - `tick(owner, shape, dmg, wid, o)`: continuous damage (a Vortex Strike vortex, a Howl Box beam, Ink Tempest rain, a
    Surf N' Turf ring), batched like `boss.rain`;
  - `spheres(out) → out`: pushes `{ c, r, solid: true }` for the shell while it is intact (phase `shielded`), with `r`
    its current radius (1.6–2.3 m). Nothing while it re-forms, after it bursts, or while the Bazookarp is carried. The
    objects are reused (no allocation per call). The batch-5 subs read it (§5.5).

  `o` is `{ special: true }` when the damage comes from a special. Every object that already carries the `sp` flag
  passes it: a bomb (weapons.js:1506 `sp: !!a.specialActive`), a projectile (`p.sp`, weapons.js:1619) and a sub item
  (`it.sp`). That is how a **Bomb Barrage's bombs** count as a special: their blasts use the weapon id `'bomb'`
  (weapons.js:1551) or the sub's kind (subs.js:908), which are not special ids.

  The calls go beside the existing `G.boss?.…` calls. To find them:
  `grep -n "G\.boss" src/game/*.js src/game/kits/*.js` (56 lines today, in weapons.js, the kits, specials.js, subs.js,
  player.js, pods.js and the bots; WP1b sorts the damage sites from the guards and bot reads). The damage sites are:
  - in weapons.js: slosh splash, the charger beam, the bomb blast and bomb flight, shots, the blaster splash and the
    Tempest rain;
  - `blast()` in specials.js (which also covers the Cheer Orb's and the Kraken's slams);
  - the sub blasts in subs.js;
  - the blade, brolly, bow, mitts, shaker, torpedo and waddle kits.

  Rolls and the brush's run are **not** in the list: they are touches (S6), and the shell has no `rollHit`.

  Special damage that Boss Battle does not route through those sites gets a call of its own:
  - the two `tickDamage` loops in specials.js (Vortex Strike, Howl Box);
  - the Twister Zooka's twister hits, the Mega Stamp swing and the Zipcaster impact (`applyHit` in specials.js);
  - the Surf N' Turf ring in sp-surf.js;
  - **the Tidal Slam**, in actor.js `_slamImpact` beside its damage loop (`splash(this, c, sp.radius, sp.damageMax,
    sp.damageMin, 'slam')`, which is 5.2 m, 180 and 55). The boss gets the slam through `on('special:slam')` in src/boss/boss.js:68–71, which a grep of
    `src/game` misses. Do not copy that listener: the Cheer Orb (specials.js:1253) and the Kraken (specials.js:1499)
    emit `special:slam` too, and they already count through `blast()`.

  The batch-5 subs add theirs (§5.5). WP1b lists every site it hooked in its report. Boss Battle never runs this mode,
  so a later refactor may fold `G.boss` into `G.objTargets`, but that is not required.
- **What it counts.**
  - The true player damage at that call: the numbers the boss gets, e.g. 180 for a Splat Bomb's centre. Never the
    device numbers `G.subs.damageArea` passes (60 for every bomb).
  - Blast falloff is taken at the nearest point of the shell's surface, with a clear line from the blast centre to
    that point, exactly as `boss.splash` does.
  - Specials count **× 0.5**: the weapon id is a special id (`SPECIALS[wid]` exists), or `o.special` is true.
  - Continuous damage counts × 0.5 of its damage per second while it overlaps the shell.
  - One hit counts at most **220**, after the × 0.5.
  - A Carp Shot never meets a shell: while the Bazookarp is carried, there is no shell.
- **Who decides a hit.** The shooter's screen, as for every weapon. Offline and on the host, the hit applies at once.
  On a guest, it is summed and sent to the host on its next tick (`kh`, §7.4). Ghost shots never hit it.
- **Credit.** Each counted hit stores its attacker as `lastHit[team]`. The burst is credited to the bursting team's
  last hitter (`stats.karpPops`, and the kills in S4).
- **The tuning table.** WP1b adds the test `karp-shell-dps.js`. Each main weapon (all of `WEAPON_ORDER`, kits
  included) and each special fires at a lone shell for 5 s, from its best range (2.5 m for melee). The barrages get a
  row each (all their bombs, × 0.5), and so does the Tidal Slam. The test prints what each put in per second. The lead
  sets `shell.hp` from that table against the first-pop target (§12 Q12).
- **Blocking.** The shell blocks every projectile and beam of both teams: they stop on it and count. Blasts are not
  blocked; they count if their radius reaches the shell's surface.
- **Regrowth.** After **1.5 s** with no hit from either team, `m` drifts back toward 0 at **200 per second**.
- **Size.** The radius is 1.6 m at rest and swells to `1.6 + 0.7 × (|m| / hp)²`: 2.3 m on the point of bursting.
  Cracks appear above 60 %. It flashes white and sounds a warning above 75 %. The swelling is the honest tell for
  "stand back".
- **Solid to players.** It is a sphere that players are pushed out of (S6), not a level block, so the nav graph stays
  static. The push is radial at 6 m/s, with one exception. Take a point 1 m out along the push. If there is no floor
  within 1.2 m below that point (water, void, a drop), the part of the push in that direction is removed. You are
  pushed along an edge, never off it (the same test bots' `_edgeGuard` makes in bots.js).
- **Re-forming.** Every drop, plant, reset and move grows a new shell over **0.8 s**. While it grows, it can't be
  hurt, can't be picked up and doesn't hurt, but it does shove players out. Every frame of the growth it calls
  `G.deploy.crushIn({ sphere: { c, r: current radius } }, 'shell')`, the deploy package's one destroyer (subs
  SPEC §0.3), which ends every device inside it: sprinkler, beacon, Drip Curtain, Surf N' Turf buoy, Lurk Mine, and the
  batch-5 sentries and bobbers. Until `deploy` is merged, WP1b uses a stub that does nothing (§11).
- **Burst.** Splat rule S4. It paints the bursting team's ink over **3.5 m** and leaves the Bazookarp free on the spot.

### 2.3 Picking it up

- **Who.** Any living player of either team who is not super jumping and has no special running, with two
  exceptions:
  - **Their own Bubble Guard.** The pick-up is allowed and **ends it**. The user wrote that the carrier cannot use
    "any of their … special weapons", and ending it beats making them wait up to 6.5 s in a race.
  - **Drainbow.** Allowed. It is a placed bubble the player has already left (`free`), like a placed sub.

  Anyone else with a special running gets `Finish your special first`. Any form counts: kid, squid, mid-air.
- **Where.** All of these must hold:
  - the feet are within **1.3 m** horizontally of the Bazookarp's centre;
  - the feet are from **0.6 m below** to **1.8 m above** the floor the Bazookarp rests on (a full jump is 1.41 m),
    so nobody grabs it through a deck from underneath;
  - there is a clear line from the chest (1.1 m above the feet) to the Bazookarp's centre, so nobody grabs it through
    a wall or a floor.
- **What happens** (on every screen, when the grant is applied: at once offline and on the host, on `p` elsewhere):
  - **their own Bubble Guard ends, on every screen.** A Bubble Guard is a status (`a.status.shield`), not the special
    itself: `IMPL.bubbler.end` returns unless the reason is `'time'` (specials.js:1273), and only `_dropShield`
    (specials.js:511) removes the shield. So every screen, applying the grant, calls
    `G.specials._dropShield(a, true)` when `a._shieldOwner && a.status.shield > 0`. Remote screens drop their ghost's
    shield the same way: the grant record is what tells them, so no extra record is needed. The carrier's own screen
    also ends the running special, `G.specials.end(a, 'karp')`, so its special record closes;
  - **copies the player had already shared out keep running** with their remaining time (the `sprules` rule: shared
    copies outlive the player they came from);
  - **a Bubble Guard a teammate shared onto them stays** (it is not their special, §2.9). They cannot pass it on to
    anyone else while carrying: the `sprules` pass-on loop skips a giver with `a.carry`;
  - the weapon runner resets (`reset()`): a main-weapon charge in progress is dropped, a dash ends, a Glide being
    cooked fizzles (subs SPEC D1.5, A1.1);
  - the kid shoulders the Bazookarp (held model `sp_karp`);
  - the fuse starts at 60 s, `mark` resets and `carry.sp` stores the gauge (S22);
  - `touched` becomes true;
  - `karp:pickup` fires.
- **Races.** After a burst, nobody can pick it up for **0.25 s** (`pickHold`). This applies offline as well as
  online, so a bot or the host's own player is never ahead of a guest by the network delay (§7.3). After that,
  online, the host grants pick-ups (§7.3). Offline, when two players qualify in the same frame, the one closer to the
  centre gets it.
- **A grant to a player who has just died.** Online, the host may grant a claim to a guest whose player died on its own
  screen after it claimed. That guest's screen declines the grant (`kx`), and the host undoes it: the Bazookarp is free
  again at the same spot, and `touched`, the last carrier and the overtime state are as they were (§7.3).

### 2.4 The carrier

| | rule |
|---|---|
| speed | `PLAYER`'s speeds × 0.8, never the weapon's (S21); 2.4 m/s while charging |
| form | kid or squid freely. Charging needs kid form; going squid cancels a charge without a shot. In squid form the Bazookarp is shown as the wake glow under the ink (S31). |
| jump | an ordinary jump only. A dodge roll (twins, dualies: `tryDodge`, actor.js:322) and a kit's jump action (the Mitts' fire + jump leap, `MAIN_KITS[kind].jump`, actor.js:325) are skipped while carrying |
| spawn | both pads' barriers push the carrier out; so do `carrierBlock` volumes (§4.1) |
| super jump | no; the TAB map bonks |
| main / sub / special | fire drives the Carp Shot; sub and special presses bonk |
| gauge | cannot rise; may fall to an enemy Drainbow's drain (S22) |
| ink | refills normally; shots cost nothing |
| damage | normal (100 hp, normal regen); no armour from carrying |
| super jump *to* them | allowed. A teammate lands next to the carrier, as for any player |
| devices | already-placed subs keep running. A Bubble Guard a teammate shares onto the carrier works (it is not the carrier's special) but the carrier cannot pass it on; the carrier's own ended at the pick-up |
| leaving the carry | only through the engine: plant, knockout, splat, fall, fuse, leaving the room |

### 2.5 The Carp Shot, exactly

`c` is the charge from 0 to 1: `c = clamp((held − 0.15) / (1.2 − 0.15), 0, 1)`. A release before 0.15 s fires a
`c = 0` shot when 0.15 s is reached, so a tap is never lost. After a shot there is a **0.25 s** cooldown before
charging again, which makes the fastest rate one Splash per 0.4 s.

The shot starts at the carp's mouth: **1.4 m** above the carrier's feet and 0.5 m in front of the body along the aim.
"Range" below is where the arc comes back down to the height of the floor under the carrier's feet.

| | Splash (c = 0) | Burst (c = 0.5) | Big Burst (c = 1) |
|---|---|---|---|
| launch speed (m/s), 25° above the aim, gravity 22 | 12.7 | 17.6 | 22.4 |
| range at level aim | 7.8 m | 13.2 m | 20.1 m |
| flight time to that range | 0.68 s | 0.83 s | 0.99 s |
| landing ink | 0.9 m | 1.2 m | 1.5 m |
| swell before the blast | 0.45 s | 0.45 s | 0.45 s |
| blast radius | 1.8 m | 2.6 m | **4.0 m** |
| blast damage, centre → edge | 40 → 25 | 65 → 25 | **180 within 2.4 m**, then → 55 at 4.0 m |
| blast ink | 0.85 × radius | 0.85 × radius | 0.85 × radius |
| knockback on the carrier | 2.5 m/s | 4.25 m/s | 6.0 m/s |
| ink cost | 0 | 0 | 0 |

Partial charges interpolate linearly: launch speed `12.7 + 9.7c`, radius `1.8 + 1.6c`, centre damage `40 + 50c`. Only
`c = 1` uses the Big Burst row. Aiming up, a Big Burst reaches about 24 m (at 43° of total launch angle). The shot
hurts only the other team, with a clear line from the blast centre (0.35 m above the landing point, as `blast()`).

- **Flight.** On the shooter's screen, the shot flies until it touches one of these: level geometry, a player of the
  other team (as the shooter sees them), an enemy deployable, a shield (Brolly canopy, Drip Curtain) or a moving block.
  There it lands: it stops, splats its landing ink, swells, and blows. A shot that lands on a player does no direct
  damage.
- **The blast is judged on each victim's screen** (§7.5).
  - The shooter records the landing (`[1]`) and the blast (`[2]`, with its centre and charge). Every screen replays
    the swell from `[1]`.
  - At `[2]`, each screen applies the blast to its *own* players (offline: everyone; the host: its player and its
    bots; a guest: its player) **without going through `G.projectiles.applyHit`**. `applyHit` asks
    `netmatch.shouldApplyHit`, which returns `'drop'` whenever the attacker is remote (netmatch.js:855–861), so on
    every screen but the shooter's nobody would be hurt. The path, copied from the Surf N' Turf ring (sp-surf.js
    `_cross` and `_hit`, around line 540):
    1. for each own player of the other team within the blast radius, with a clear line from the centre (0.35 m up)
       to the chest, compute the damage from its distance (§2.5's table);
    2. if a Drainbow is live, `dmg = G.drainbow.cut(shooter, victim, dmg, null, centre)`;
    3. `victim.damage(dmg, shooter, 'karp')` (armour, Bubble Guard and kit filters apply as for any weapon), with
       `G.netm.mute` set to 0 around it, as `_cross` does, because a ghost's `[2]` plays inside `mute++`
       (netmatch.js:548) and the victim's own splat burst is this screen's real word;
    4. `emit('hit', { attacker: shooter, victim, damage: dmg, killed, weaponId: 'karp' })`;
    5. online, when the victim is this screen's own and the shot has a `gid`: `netRec(victim, 'karp', [3, gid, dmg])`.
       Every other screen plays `[3]` as a hit event with the shooter as the attacker, so **the shooter's screen gets
       its hit marker even for a non-lethal Splash**. A kill is credited through the victim's ordinary `splatted`
       record, which names the attacker.
  - A player who stepped out during the swell on their own screen is therefore safe, whatever the lag. Offline this
    is the same code with one screen (no `[3]`).
  - Enemy deployables are hit on the shooter's screen, as every blast hits them.
- **Feedback.** An arc preview while charging with the landing ring at the blast radius of the current charge; a
  charge ring at the reticle; a ding at full charge; the carp's mouth glows with charge (the glow rides the actor tick
  for remote viewers).
- **No aim assist.** The arc preview is the aid.

### 2.6 Where the Bazookarp goes: every case

| what happened | where | rule |
|---|---|---|
| the carrier was splatted (weapon, sub, special, burst, enemy ink …), not in their own free zone | **drop**: the drop spot (§2.7) from where they stood; the shell re-forms | S23 |
| the carrier was splatted inside their own Carp-Free Zone | **the Pond** | S50 |
| the fuse ran out on their own half, or anywhere inside their own free zone | **the Pond** (the Carp Blast first, where they stood) | S13, S50 |
| the fuse ran out on the enemy half, not in their own zone | **drop** from where they stood (after the Carp Blast) | S13 |
| the carrier fell off (water, void, lava), last footing on their own half or in their own free zone | **the Pond** | S25, S50 |
| the carrier fell off, last footing on the enemy half | **drop**: the drop spot from that last footing | S26 |
| planted on a weir | on that weir's centre; all of that team's weirs lower; the shell re-forms | S33, S34 |
| carried into the risen Gate | knockout; it stays in the Gate | — |
| the carrier left the room, and a bot takes over (any stage with bots) | nothing: the bot carries on carrying (§7.6) | — |
| the carrier left a humans-only room (Cargo: the actor is removed) | as a splat at its last known position: drop, or the Pond if in their own free zone. If the host itself left, the new host does this (§7.6). | — |
| resting, and its spot is about to be covered or is covered: a mover's sweep, a hedge growing, a lava warning (`lava:warn`), an era warning (`era:warn`, a danger node) | **moved**: a new drop spot from where it rests, with a 0.8 s re-form | §2.7 |
| the match ends | stays | — |

"Their own half" and "last footing" are defined in §3.3. "Where they stood" is the carrier's own position offline and
on the host; for a remote carrier it is its newest real sample (§7.5). "Their own half" and "in their own free zone"
for a remote carrier come from its own screen's newest report (`kr`, §7.2), never from the host's view of it.

**Resetting to the Pond.** The Bazookarp leaps out of the drop spot as a glowing comet and arcs to the Pond in
**1.5 s**. It lands in a splash, and the shell re-forms (0.8 s) at 500 hp with `m = 0`. While it flies, nobody can
touch it.

### 2.7 The drop spot

The Bazookarp never rests mid-air, on a moving block, where it can't be reached on foot, where its shell would shove
passers-by into the sea, or where its burst could reach a spawn. The host computes the drop spot from a start point
`p` and a half `h`:

- `p` is where the carrier was (the host's own actor: its position; a remote carrier: its newest real sample, §7.5),
  or the last footing for a fall (§3.3), or the resting spot for a move;
- `h` is the half the decision used: for a splat or a Carp Blast, the carrier's half (a remote carrier: the half its
  own screen last reported in `kr`); for a fall, the last footing's half; for a move, the half of the resting node.

**At match start**, `karpField` marks every valid node of the carrier graph with flags, once per field state (§3.2
step 6: one state on most stages, three on bluestone, two on caldera).

- `restOk[s]`: all of these hold in state `s`:
  - the node is valid in `s`. On bluestone, also valid in **every later era** of the match (eras only advance in a
    Bazookarp match: jumps at 100 s and 200 s, none in overtime), so it can never be taken away from under the
    Bazookarp. On caldera, standable at that rest level (§5.5);
  - not in a spawn zone (`node.zone < 0`), and more than **9.7 m** horizontally from either pad
    (`rest.padR` = spawn barrier 4.2 + burst radius 4.5 + 1.0), so a burst can never reach a spawn deck where
    players respawn (they land 1.1 m from the pad's centre; S4);
  - not in any mover's **whole sweep corridor**: the union of each car's footprint over its full path between its
    stops (movers.js gives the stops and the car size, `sweepRect(car)`; every node the car can ever cover, not only
    `nav.blocked` at that moment);
  - not on or within 1 m of a pod plot (pods.js `p.nav`, grown or not);
  - not inside either team's Carp-Free Zone (polygon and height band, in that state when a zone carries `eras`), a
    `noRest` polygon, or a `carrierBlock` volume (§4.1). A shell in a `carrierBlock` could be burst but never carried
    out, because the barrier would shove the picker straight out;
  - not within **2.7 m** horizontally and **±1.6 m** vertically of either Gate's centre (its 1.7 m trigger + 1 m),
    whatever the Gate's state;
  - not `overWater`, and a finite Carp Field value for both teams in `s`.
- `wide`: all 8 neighbouring cells hold a node within 0.5 m of this node's height, and `wet == 0` (no open water
  within 2.2 m). A 2 m pier or a pontoon is never wide. Cheap, so it is computed for every node at load.
- `clear`: no solid geometry within **2.3 m** (the shell's full radius) in 8 horizontal directions at 1.3 m above the
  floor, so the shell can be shot from every side. (Splatoon 1's Ver. 2.2.0 fixed a shield that could not be hurt
  against a wall.) This takes 8 raycasts, so it is computed **lazily**: only for nodes a search actually considers, and
  then cached for the match. A whole-stage pass would be 50 000+ raycasts on every client at load.

**Dynamic exclusions**, tested by the search and the re-check, because they change during a match:

- within **2.8 m** horizontally and ±1.6 m vertically of a weir (either team's) that is **still standing** (its 1.8 m
  trigger + 1 m). A Bazookarp resting there would hand a plant to whoever picks it up;
- on bluestone, from `era:warn` to `era:done`: `G.match.eras.dangerAt(node)` (a piece about to change);
- on caldera: the state in force switches at `lava:warn` (§3.2 step 6), so during a warning and a move the flags of the
  coming rest level apply.

**The search**, done when the Bazookarp drops or must move:

1. Candidates are nodes with `restOk` in the state now in force, not caught by a dynamic exclusion, and on half `h` (the
   field's side test in that state: on Alpha's own half when `D_A > D_B`, else on Bravo's).
2. Walk rings of cells outward from `p`, with no distance limit (`nav.nearest` only reaches 3 cells, so this is its own
   search). The score of a node is its horizontal distance from `p` + 3 × |dy|. Stop once a ring's inner distance is
   more than 4 m beyond the best score found.
3. Among the candidates within 4 m of the best score, take the best one that is `wide` and `clear`. If there is none,
   the best `wide` one. If there is none, the best.
4. Only if half `h` has no candidate at all does the Bazookarp go to the Pond. This is a deliberate exception that a
   playable stage never meets: checker #11 FAILs a stage where any splat or fall spot of a carrier's route finds no
   candidate on its half.

So a carrier splatted in the middle of a large enemy free zone drops just outside it on the enemy half, however far
the edge is (S51), and a carrier who falls from an enemy-half flank where all ground within 12 m is lava-reachable
drops on the nearest dry ground of that half (S26). Neither goes to the Pond.

The Bazookarp rests on that node's floor. The shell's centre is **1.3 m** above it. The Pond and a planted weir's
centre are the two spots exempt from `restOk`.

**Re-check while resting.** Every 0.5 s, and at once on `lava:warn` and `era:warn`, the host checks that the resting
node is still acceptable:

- not in `nav.blocked` (a car's current footprint);
- not covered by a grown hedge;
- `restOk` in the state now in force (so a lava warning moves it before the lava comes, and an era change never leaves
  it on removed ground);
- not caught by a dynamic exclusion.

If any check fails, it runs the search again from the resting spot and moves the Bazookarp there (`karp:drop` with
how `moved`, a 0.8 s re-form). The flags make this cheap.

### 2.8 Scoring, winning, the end

- **Count.** A team's count is `ceil(100 × D_T / L_T)`, clamped to 0…100, where:
  - `D_T` is the Carp Field distance from the carrier to team T's Gate, read by `fieldAt` (§3.2);
  - `L_T` is the same distance from the Pond (§3).

  It is computed while team T holds the Bazookarp, on the host: from its own carrier's position each frame, or from
  each real sample a remote carrier sent (§3.4, §7.5). It is capped by T's unplanted weirs and by the continuity clamp
  (§3.4).
- **Best.** The team's score is its **best** (lowest) count, which never goes up. `best_m[T]` (metres of progress) is
  kept for results. `reachT[T]` is the match clock the first time the current best count was reached.
- **Knockout.** Count 0: the carrier enters the risen Gate. The feet must be within **1.7 m** horizontally of its
  centre and within **±0.6 m** of its floor (for a remote carrier: in a real sample, §7.5).
- **Time-up.** If no overtime condition holds (§2.1, S38), the winning team wins (`time`), or the coin team if the
  Bazookarp was never touched (`untouched`).

### 2.9 Collisions with INKWAVE, and the choices made

| collision | choice | why |
|---|---|---|
| Splatoon assigns Alpha and Bravo randomly, unknown to players. INKWAVE's team 0 is always your team offline, its names show in the results, and online the room sets teams. | The "Team Alpha wins" rule becomes a **hidden coin** rolled by the host at match start (`cfg.karpCoin`), independent of team index. | It keeps what the rule is for: a random default winner nobody can play around. Using team 0 would make the local player win every untouched offline match. |
| At 100 / 100 there is no visible "losing team" for passive charge (S45), but the coin would name one. | No passive charge while both counts are 100. | Charging one side would leak the coin. The rule's intent (help the team behind) has nothing to act on yet. |
| Zone Control fills the team *not* holding at 4.5 p/s and, while neutral, the team behind at 1.5 p/s. Tower Command fills the team *in control* at 4.5 p/s and, while neutral, the team behind at 2.25 p/s (`ZONES` / `TOWER` `gaugeHeld`, `gaugeNeutral`). | Bazookarp uses the user's 3 p/s in both cases, and the user's direction: the team *without* it while it is held, the team behind while it is not. | The user's numbers and rule. |
| INKWAVE's "instant" damage paths all go through `damage()`, which checks `invuln` (actor.js:182) and the armour filters. INKWAVE sets `invuln` at a respawn (1.6 s), during a super jump's flight (+ 0.2 s, actor.js:841) and after a Tidal Slam (0.3 s, actor.js:938). | Burst and fuse splats call `actor.splat()` directly, which checks neither (actor.js:209). They ignore armour **and** every `invuln`. A burst never reaches a spawn because no resting spot is within 9.7 m of a pad (§2.7). Aquarium pipe riders are the only players skipped. | "Instantly splatted" is absolute in the user's text, and Splatoon has no invulnerability on a super jump landing. Revision 2 said the splat respected spawn invulnerability "though nobody spawns near a shell"; that was both self-contradictory (`splat()` has no such check) and untrue (a swimming defender covers 12–19 m in 1.6 s, and re-formed shells can rest 12–20 m from a pad). Q9. |
| The user: "all players … caught in the blast radius", "every friendly player in the blast radius". | A player is caught when within 4.5 m **with a clear line** from the centre to the chest. | Every INKWAVE blast already stops at walls: `blast()` in specials.js and every bomb in weapons.js test `G.physics.los` from the centre. A splat through a wall, or through a deck onto the floor below, would read as a bug. It would also kill players who could neither see nor shoot the shell. "Caught in the blast" reads naturally as "the blast reaches them". Q9. |
| The user: "Once a player plants … on a checkpoint, all checkpoints will lower and the … goal will pop up". | Two weirs are **alternatives** on two different routes at the same count; planting either lowers both and raises the Gate. | It is the literal reading. It also puts the second weir on a second route. Separately, every weir has two workable routes of its own from the Pond (§9.1 #4, checker #5), which is what the research recommends ("at least two workable routes to each checkpoint"). Q1. |
| "All checkpoints will lower" could be read as both teams' weirs. | Only the planting team's weirs lower. | The other team's weirs stand on our half and gate *their* progress. S36 is per team: "A team must land the Rainmaker on a checkpoint before they can score any points beyond it". Lowering them would hand the other team free count as a reward for our plant. |
| Splatoon 1's twisters vs Splatoon 2/3's exploding ball. | Exploding ball, plus a water-spout look on the Big Burst. | §2.1 S16. |
| The fuse across drops: Splatoon players argue both ways. | Fresh 60 s on every pick-up. | "The player who holds it must carry it … within sixty seconds": per holder. Re-popping the shell is already the cost of a drop. |
| Touch damage that can splat would make the shell a weapon. | Floors at 1 hp. | "a small amount of damage". |
| The user: the carrier cannot use any special. The user also asked (Changes): "If a bubble is shared to a teammate, that player can also share the bubble to another teammate." INKWAVE's Bubble Guard is a 6.5 s status that can be shared by touch, and from batch 5's `sprules` passed on. | The carrier's **own** Bubble Guard ends at the pick-up, on every screen. Copies it had already shared keep their remaining time. A Bubble Guard a teammate shares onto the carrier stays, but **the carrier cannot pass it on** to anyone. | Being protected by a teammate's special is not using one; passing a bubble on is an action with a special, which the carrier rule forbids. That makes the carrier rule win over the chain rule only for the carrier, and nowhere else. Shared copies outliving their source is `sprules`' own rule. A shared bubble makes a carrier shove-only for up to 6.5 s, which is a balance risk; the bot matches watch it (§9.1) and Q13 raises it. |
| Two of the user's overtime starts (S38a, S38c) hand the losing team a shielded Bazookarp, and S39b gives it 10 s. | A re-formed shell has 500 hp (the opening one 1000), and a 10 s window does not count time while the Bazookarp is re-forming or resetting. | With a fresh 1000 hp tug-of-war, and the clock running during the 0.8 s re-form or the 2.3 s reset, "pick it up within 10 s" would be close to impossible. Q17. |
| The user: "less than fifteen seconds", "less than a few seconds". | Strict: `< 15 s`, `< 5 s`. | The user's words. |
| Treehills' hedges only take their grower's ink, so a carrier on its own hedge top is unreachable high ground. | Hedges are `roof` for a carrier (they slide off), through `isRoofFor` in actor.js (§5.4). The pods keep running in this mode, and the Bazookarp never rests on a pod plot (§2.7). | S46's intent, without a free zone over a moving thing. |
| Tower Command's riders ride a moving collider. Calamari's railcars have roof tops (`roof: car.def.roof !== false`, movers.js:141), so nobody stands on one today. | The Bazookarp never rests on a dynamic block or in a mover's whole path (§2.7). A carrier can ride only a car whose def says `roof: false` (none today); while riding there is no own node, so the field keeps its last value. Checker #7a counts such a ride ending inside a Gate's 15 m ring as an entrance. | The nav graph is static; a resting spot must be on it and stay uncovered. |
| The user: "The special gauge does not charge while carrying it." INKWAVE has many gauge sources: turf, passive charge, cheers, and a teammate's Drainbow (sp-drainbow.js:176–181). | One guard on the carrier caps the gauge at its value from the pick-up, every frame (S22). It may fall (an enemy Drainbow). | A per-source list missed Drainbow and would miss the next source. The user forbids charging, not draining. |
| A free zone is "harder for the enemy team to reach". | The Bazookarp never rests inside either team's free zone; a drop there lands just outside, on the same half (S51, §2.7). | A shell resting in a zone could be fought over by one team only. |
| At 100 / 100 an overtime start (only possible by S38b, the losing team holding at time-up) shows which team the coin favours, because only the losing team gets overtime. | Accepted. The banners stay as in §1.1. | The coin exists so nobody can play around a known default winner during the match. At time-up the match is ending; nothing can be played around. Disabling passive charge at 100 / 100 still keeps it hidden while play is on. |

---

## 3. Scoring geometry: the Carp Field

### 3.1 Why a field and not a drawn path

Tower Command's drawn polyline works because the tower runs on it. A carrier walks anywhere. Projecting a flank-route
carrier onto a winding polyline jumps the score between segments; Splatoon's own "scores not changing smoothly" bugs
are this. The Carp Field instead measures **how far the carrier still has to walk**, along the routes the stage really
has. Every route then counts fairly, retreat has one meaning, and the halfway line falls out of it. A drawn line is
still useful as route *hints* for the checker and bots (§4.1 `routes`); it never scores.

### 3.2 Building it

`src/game/karpField.js` runs at match start, after the nav graph is built for the `bazookarp` build of the stage.

1. **The carrier graph** is `G.nav`'s valid nodes and edges with these changes. It is the field's own graph; bots'
   `G.nav` is not changed.
   - It drops nodes with `zone ≥ 0` (either spawn barrier) and nodes inside `carrierBlock` volumes (§4.1).
   - It keeps walk, jump, drop and climb edges (the carrier is a squid on inked walls too), and has no edges onto
     `roof` tops (the nav already excludes those).
   - **It adds hop edges.** nav.js makes jump edges only for rises of 0.5–1.25 m (nav.js:104), but a kid lands on
     anything up to about 1.8 m (jumpVel 8.4, gravity 25, apexGravityMul 0.82, plus ledgeAssist 0.35), and so does a
     carrier, whose jump is unchanged. A hop edge goes from node `n` up to node `m` when all of these hold:
     - `m` is **1.25–1.8 m** above `n` (`hop.rise`);
     - they are at most **1.2 m** apart horizontally (orthogonal neighbour cells) and no nav edge joins them already;
     - the waist line is clear (`nav._blocked(n, m, m.y)`, 0.6 m above the upper node);
     - the head line is clear: nothing solid on the vertical from 0.3 m above `n` to 1.6 m above `m`, and nothing on
       the horizontal at `m.y + 1.0` between the two cells;
     - the pair is not in the stage's `hopVeto` list (§4.1), which holds the pairs the checker proved a kid cannot
       make (checker #16).
   - **It adds gap edges.** nav.js has no edge across open air. A gap edge joins `n` and `m` when all of these hold:
     - they are more than 1.2 m and at most **3.0 m** apart horizontally (`gap.max`). A carrier runs at 4.8 m/s and a
       level jump lasts about 0.7 s, so 3.0 m leaves margin;
     - `m` is at most 0.6 m above `n`. When `m` is more than 0.6 m below, the edge is one-way, down only (as a drop
       edge is), down to 3.4 m below;
     - the line between them is open air: sampled every 0.25 m, no floor within 1.0 m below it (otherwise they are
       joined by walking and the nav graph has it), and the waist line is clear;
     - they are not already joined by a graph walk of at most 6 m;
     - the pair is not in `hopVeto`.
   - On a stage with states (step 6), an edge counts in a state only where the stage's mask allows it (bluestone:
     `e.em & bit`; caldera: both ends standable at that rest, §5.5).
   - An aquarium pipe leg is an edge only if it is open to carriers (`modes.bazookarp.carp`), with the leg's own
     length (§9.4). No leg is open today.
2. **Edge length** in metres:
   - walk: `hypot(flat, dy)`;
   - jump and hop: `flat + dy`;
   - drop: `flat + 0.5·|dy|` (a drop is quick);
   - gap: `flat + 0.5·max(0, −dy)`;
   - climb: `flat + rise`;
   - a pipe leg: its own length.
3. **Distances.** For each team T, run Dijkstra *backwards* (over reversed edges) from the Gate's seed nodes, with
   distance 0 there. The seed nodes are the valid nodes in the Gate trigger: within 1.7 m horizontally of the Gate's
   centre and within ±0.6 m of its floor. That gives `D_T[node]`: the walking metres from the node *to* T's Gate,
   honouring one-way drops and gaps. Unreached nodes get `Infinity`.
4. **Lengths.** `L_T = fieldAt(T, Pond)`. For a mirrored stage `L_A ≈ L_B`; the checker requires them within 2 %. Each
   team normalises by its own L, so both start at exactly 100.
5. **Cost.** Measured in Node on the twelve current stages (4 600–7 300 nodes, layout colliders only): 1.3–8.7 ms
   per Dijkstra. The hop and gap scan looks at each node's 8 neighbour cells (hops) and the cells within 3 m (gaps),
   rejects almost every pair on height before any ray, and casts at most 14 rays for a survivor. WP0 measures it on
   every stage and reports it; the budget is **60 ms per state** at load, all included.
6. **Stage states.** Some stages change their routes during a match. Such a stage gives the field a finite list of
   states, and §5.5 states exactly what each stage provides:
   - **bluestone:** three eras. The field switches at `era:done` (100 s and 200 s of regulation; no jumps in
     overtime).
   - **caldera:** two rest levels, LOW and HIGH. The field switches at **`lava:warn`** to the level the coming move
     ends at, and stays there through the move. A node about to be flooded is dropped from the field 10 s early (a
     carrier on it keeps its last value, so nothing is banked from it); a stone path appears in the field when its
     rise is announced.
   - every other stage: one state.

   The field computes `D_T` and `restOk` for every state at load (2 teams × the number of states). A switch swaps the
   arrays. **There is never a rebuild mid-match**: caldera's ENGINE.md §4.3 asks for one on `lava:rest` and
   `lava:move`, and this spec replaces that with the two precomputed states (§5.5, Q19). `L` stays the Pond's value in
   the start state, and best counts never rise. Every screen switches on the same stage-clock event, and each switch
   resets the retreat mark (§3.3) and the host's continuity clamp (§3.4). §9.4 states what such a stage must keep true.

**Reading it at a point** (`fieldAt(T, pos)`):

1. **Own node.** `n0` is the nearest node, among the 3 × 3 cells around `pos`, that meets all of these:
   - it is valid in the state now in force;
   - its height is within **0.5 m** of the feet;
   - it is within **0.9 m** horizontally;
   - a clear waist-height line joins it to `pos` (`nav._blocked`, 0.6 m above the higher of the two).
2. **Reading.** First take `r = min(D[n0] + |pos − n0|, D[m] + |pos − m|)`, where the second term is the minimum over
   every node `m` that `n0` has an edge to in the carrier graph (walk, jump, drop, climb, hop, gap), and `|·|` is the
   straight 3D distance. Then clamp `r` into `[D[n0] − |pos − n0|, D[n0] + |pos − n0|]`. Both bounds are true: from
   `n0` you can walk straight to `pos`.
3. **No own node.** This covers airborne, climbing or swimming up a wall, sliding off a roof, riding a mover or a pipe,
   standing on ground the state has just removed, and being off the graph. In all these cases, keep the last value.
   Counts and best change only on readings that have an own node.

The reading is continuous along a walk, so the count ticks down smoothly.

**Why the reading goes through the own node** (revision 2). The first version read every node in the 3 × 3 cells
within 1.2 m of height. Those cells include nodes on the far side of thin walls, rails and ledges, which can be a long
walk away. Since best counts never rise, standing at such a spot for one frame banked count the team never walked. It
was measured with a read-only Node script on all twelve stages, using the real `Level`, `Physics` and `NavGraph`
(layout colliders only), Gates at §9.3's spots, and Alpha's field:

| stage | old rule: nodes reading > 3 m too close | > 10 m | worst | new rule: worst |
|---|---|---|---|---|
| craters | 75 | 21 | 22.4 m | 1.00 m |
| terraces | 15 | 5 | 42.8 m (a count of 100 read as 48) | 1.00 m |
| kelpline (and cargo) | 18 | 5 | 20.0 m | 2.08 m (5 points by a post next to the Gate) |
| tidewater | 7 | 0 | 8.7 m | 1.00 m |
| nantai | 2 | 0 | 7.2 m | 1.02 m |
| treehills | 4 | 0 | 6.3 m | 1.02 m |
| lockgate | 1 | 0 | 5.2 m | 1.03 m |
| spirhalite | 2 | 0 | 5.0 m | 1.00 m |
| crossmarket | 2 | 0 | 4.4 m | 0.78 m |
| calamari | 1 | 0 | 3.2 m | 1.00 m |
| saltpan | 0 | 0 | 3.0 m | 1.00 m |
| halyard | 0 | 0 | 1.5 m | 1.00 m |

At every node the new rule reads exactly `D`. It was also sampled at 260 000–435 000 points per stage (the quarter and
half points of every walk edge, plus ±0.3 m across where the waist line is clear) and compared with a proven lower
bound of the true walk, `max(D[a] − |p − a|, D[b] − |p − b|)`. The worst gap is 1 m: at most 2 counts on a 55 m stage.
On kelpline, 5 points beside a post read up to 2.1 m low; there the waist line is clear but the post may block the
body.

**Why the hop and gap edges** (revision 3). The engine review ran a read-only probe (real `Level`, `Physics` and
`NavGraph`, layout colliders only, a reversed Dijkstra to a proxy Gate 14 m in front of Bravo's pad). It counted node
pairs no more than 1.2 m apart with a 1.25–1.8 m rise and no nav edge, and the field gain across each; and gaps of
1.6–3.0 m over open air. This revision re-ran it on terraces and halyard and got the same numbers:

| stage | hop pairs | hops gaining > 10 m | worst hop gain | gaps gaining > 10 m |
|---|---|---|---|---|
| craters | 503 | 70 | 24.0 m | 2 |
| terraces | 217 | 55 | 46.2 m | 0 |
| nantai | 262 | 13 | 21.7 m | 0 |
| halyard | 28 | 2 | 13.9 m | 0 |
| kelpline (and cargo) | 4 | 2 | 13.2 m | 0 |
| spirhalite | — | 5 over 10 m | — | 0 |

Without these edges the field reads the top of such a step as further than it is. A carrier who hops up then sees its
progress fall, which is a false `DON'T RETREAT!`; and the checker cannot prove "no shortcut into a base", because it
measures routes on a graph that lacks moves a carrier can make. With them, both the field and the checker measure the
moves a kid really has. Checker #16 proves the edge rule against the real physics on every stage (§4.4).

### 3.3 Halves, progress, retreat, last footing

- **Progress** of team T at `pos`: `P_T(pos) = L_T − D_T(pos)` metres. It is 0 at the Pond, `L_T` at the Gate, and
  negative behind the Pond.
- **Halfway line.** `pos` is on **team T's own half** when `D_T(pos) > D_(1−T)(pos)`: it is a longer walk from there
  to T's target Gate than to T's own defended Gate. The line is where the two walks are equal. It runs through the Pond
  on a mirrored stage, and bends with the routes, which is fairer than a straight cut. The TAB map draws it faintly.
- **Retreat** (S10, S11), on the carrier's own half only:
  - `mark = max(P)` since the pick-up, since entering the own half, or since the last field-state switch, whichever
    is latest;
  - retreating when `mark − P ≥ 8 m`;
  - cleared when `mark − P ≤ 3 m`, or on leaving the own half.
- **A field-state switch** (an era, a lava level) changes `D` under a carrier who has not moved: when rising lava drops
  a flank's nodes, or an era removes a bridge, `D` can rise and `P` fall by metres. So on every switch, the carrier's
  own screen:
  1. clears the retreat flag (the rate goes back to ×1 unless the carrier stands in its own free zone);
  2. sets `mark` to "unset";
  3. on the next frame with an own node, reads the field in the new state, sets `mark = P` and recomputes its own
     half and its own-zone flag, before any retreat test runs. Until then there is no retreat test.

  A carrier standing still across a switch therefore never gets the ×3. On a guest, the resulting `kr` (if anything
  changed) goes to the host at once. The host resets its continuity clamp at the same switch (§3.4).
- **`noRetreat` polygons** (§4.1) switch the retreat test off inside them. They are the escape hatch for a stretch of
  route that must briefly walk "away" from the Gate (Splatoon's Undertow Spillway fix), and only that. Without limits,
  one could turn own-half high ground into a stalling spot (Splatoon's Inkblot fix was the mirror case: "Don't
  retreat!" missing where it should show). So:
  - the checker FAILs any `noRetreat` polygon that overlaps, or comes within 3 m of, an own-half plateau (checker #9)
    or a Carp-Free Zone;
  - every one is listed with a picture in the stage note;
  - the checker's retreat sanity test (#10) is what proposes them.
- **Where the carrier stands is judged on the carrier's own screen.** That screen knows the floor under its player
  (`a.ground.block`) and its exact position every frame; the host sees only 20 Hz samples. The field is deterministic:
  every screen builds the same one. So the carrier's own screen (offline: the one screen; the host: its own player and
  bots; a guest: its player) judges four things every frame:
  - **the fuse rate**: retreat and own zone, showing `DON'T RETREAT!` / `BAZOOKARP-FREE ZONE!` at once;
  - **its half**: own or enemy, from its latest reading. The flag flips only once the reading is clearly past the line
    (`|D_A − D_B| ≥ 1.0 m` on the other side, about 0.5 m past it), so a carrier walking along the line never makes
    it chatter;
  - **its zone**: inside one of its own Carp-Free Zones or not;
  - **the last footing**: each frame its carrier stands grounded on a static block that is not `roof`, not dynamic (no
    railcar, tower or hedge), with an own node by the reading rule, it stores that position, which half it is on and
    whether it is inside an own free zone.

  A guest reports them to the host (§7.2):
  - `kr` `{ rate, why, half, zone }` the moment **any** of those four fields changes, held back at most one tick
    (50 ms) so it never exceeds 20 a second; in practice a carry sends a handful;
  - `kf` `{ x, y, z, half, zone }` (the last footing) when its node moves more than 2 m, at most 5 times a second;
    but a change of the footing's half or zone is sent at once, outside that cap.

  The host uses the newest `kr` for the fuse rate and for every own-half and own-zone decision about a remote carrier
  (a Carp Blast's row, a splat inside the own zone, §2.6), and the newest `kf` for falls (S25, S26). These reports go
  out at once, while death records ride the playback timeline, so the newest report is always there before the death
  that it decides.

### 3.4 The count, the weirs and the cap

- `weirCount[T][i] = ceil(100 × fieldAt(T, weir_i) / L_T)` in the start state.
- `capCount[T]`: until T plants, the **higher** of its weirs' counts (with one weir, its count). After T's plant, 0.
- **What the host scores from.** For its own carriers (its player, its bots, offline everyone): the position every
  frame. For a **remote** carrier: each real sample that carrier sent, read at the sample's exact position, in order,
  as it plays on the host's playback clock for that peer. Concretely, `netmatch._sample` hands the engine every
  buffered sample of the holder with `prevTr < s.t ≤ tr` and the `F.alive` flag (`match.karp.onSamples(a, samples)`).
  The host never scores from the actor's drawn position: that is a Hermite path plus a correction offset of up to 4 m
  (`net.err`, netmatch.js:371–392), and when the buffer runs dry, a ballistic extrapolation of up to 0.18 s with no
  collision test (`_pathAt`, netmatch.js:345–351). A swimmer stalled at a thin wall would be drawn up to 1.7 m through
  it, and the far side's `D` banked for good. Samples arrive at 20 Hz: a swimmer moves 0.47 m between two, far less
  than any trigger (weir 1.8 m, Gate 1.7 m), so nothing is skipped.
- **The continuity clamp.** A reading `D_new` is accepted only if
  `D_new ≥ D_acc − (vMax × (t − t_acc) + 0.5 m)`, where `D_acc` and `t_acc` are the last accepted reading and its time
  (the sample's time for a remote carrier) and `vMax = 15.5 m/s` (swimming 9.44 + the full knockback 6.0, rounded up).
  A rejected reading is not banked and does not move `D_acc`. The allowance grows with time, so a real move is
  accepted at the next sample. Nothing a carrier can do moves `D` faster: a drop of 3.4 m lowers `D` by 1.7 m + its
  flat run over 0.5 s, and hops and gaps are crossed at 4.8 m/s. The baseline resets at the pick-up and at every
  field-state switch, and leaving a carp-open pipe leg adds that leg's length to the allowance once (no such leg
  exists today). Every rejection is counted in `karp.stats.clamped` (the match tool reports it; it should be 0).
- While T holds the Bazookarp: `now = max(capCount[T], ceil(100 × D / L_T))` for each accepted reading `D`, and
  `best = min(best, now)`.
- A plant on weir i:
  - sets `now = weirCount[T][i]` (with two weirs, at most 2 below the cap) and `best = min(best, now)`;
  - lowers all of T's weirs;
  - sets the cap to 0;
  - raises T's Gate.
- The cap means a carrier who walks past a weir gains nothing beyond it until they land it on a weir (S36).
- The checker requires each weir's count to be the lowest count anywhere within 3 m of it on its floor, so landing it
  is never worth less than walking past it.

---

## 4. Stage data, mode-only pieces, the checker

### 4.1 `LAYOUT.bazookarp`

Per stage in `src/world/bazookarp-data.js` (`BAZOOKARP_DEFS`), merged into `MAP_LAYOUTS[id].bazookarp` by `maps.js`
exactly as `TOWER_DEFS` is. A layout may also carry its own.

**Convention: it describes Alpha's attack.** Weirs and the Gate are drawn on **Bravo's half** (the half holding
Bravo's spawn pad, `spawnPads[1]`, which is +z on every current stage). The free zones on that half are **Bravo's own**
Carp-Free Zones. The engine mirrors everything 180° about the vertical through the origin for Bravo's attack and
Alpha's zones, like `half` pieces and Tower Command paths.

> **Watch out:** the Long Stages notes (`tools/botlab/jobs/stretch/<id>.md`) give their Bazookarp spots on *Alpha's*
> half. Negate x and z to enter them here. Section 9.3 has them converted.

```js
// src/world/bazookarp-data.js
export const BAZOOKARP_DEFS = {
  halyard: {
    // the Pond: the exact centre. y optional (the floor under it; a raised start like S1 Blackbelly gives its y).
    // Never off the centre: the field's symmetry depends on it.
    start: [0, 0],
    // Alpha's weirs on Bravo's half: 1, or 2 on different routes at the same count (±2) (§9.1 #2)
    //   at:  [x, z] | [x, y, z]
    //   yaw: degrees, the direction the carrier walks through it (default: the field's downhill direction)
    //   r:   trigger radius, default BAZOOKARP.weirR (1.8)
    weirs: [{ at: [-8.0, 27.5], yaw: 180 }],
    // Alpha's Dragon Gate, in front of Bravo's spawn or a level below
    gate: { at: [0, 52.5], yaw: 0 },
    // Bravo's own Carp-Free Zones on Bravo's half (mirrored: Alpha's). y0 / y1 = floor heights counted, as zones-data.
    // Wholly on the owner's half (checker #9). A sign within 2 m of every entrance (checker #9 lists the entrances).
    freeZones: [
      { poly: [[-6, 60], [6, 60], [6, 70], [-6, 70]], y0: 2.2, y1: 6,
        signs: [[-6.4, 59.6, 180], [6.4, 59.6, 180]],     // [x, z, yaw°] at each entrance
        eras: null },                                     // optional: [1, 2] = the zone exists only in those eras
    ],
    // optional (each entry may also carry eras: [...] on a stage with eras):
    noRetreat: [],        // [{ poly, y0, y1 }]: no retreat test here (§3.3; limited by checker #9)
    carrierBlock: [],     // [{ poly, y0, y1 }]: a carrier can't enter (pushed out to the nearest edge; others pass);
                          //  closes a shortcut the checker found (#7) without changing the other modes
    noRest: [],           // [{ poly, y0, y1 }]: the Bazookarp never rests here (beyond §2.7's automatic exclusions)
    hopVeto: [],          // [[x, y, z, x, y, z]]: hop / gap pairs the checker proved a kid can't make (#16); the
                          //  checker prints them ready to paste. Mirrored like everything else.
    routes: {             // named route hints, Alpha's attack, [x, z] | [x, y, z] waypoints:
      centre: [[0, 12], [-3, 30], [0, 48]],   //  the checker names and measures them; bots prefer them
      pier:   [[12, 10], [14, 40], [4, 50]],
    },
    pondPlinth: null,     // optional { h, r }: a raised Pond (the start is then on it)
    shellHp: null,        // optional per-stage override of BAZOOKARP.shell.hp (balance only, logged)
  },
};
```

(The coordinates above only show the format. §9.3 has each stage's starting values.)

**`carrierBlock`** replaces the first revision's `field.block`. Dropping nodes from the field could not stop a
shortcut: a carrier who used it anyway would read the far side's low `D` as soon as it came out. A `carrierBlock` is
physical:

- it is a vertical volume (a polygon and a height band) that pushes only a carrier out. `_spawnBarrier`'s radial code
  (actor.js:692) cannot do a polygon, so the actor hook calls `karp.field.pushOutBlock(a)`: a carrier whose feet are
  inside a volume is moved to the nearest point of the polygon's edge plus 0.05 m, and the part of its velocity that
  points inward is removed;
- other players pass through it;
- it is drawn as a faint shimmer with the NO CARP glyph;
- the carrier graph drops the nodes inside it, so the field agrees with it.

Use it where geometry (an `onlyIn` wall) would spoil the other modes.

**A stage without an entry** gets a placeholder (`karpField.placeholder(level)`, flagged `placeholder: true`), so the
mode always runs:

- the Pond at the centre;
- the Gate on the nav route from the centre toward Bravo's pad, 4 m outside its barrier (as `tower.js`
  `placeholderPath` finds a goal);
- one weir at 50 % of that route;
- no free zones except a circle of 9 m radius round each pad above `pad.y − 1` (the spawn deck), with a NO CARP sign
  placed automatically at each of its entrances (the checker's entrance rule, #9, run at load).

The stage select shows the stage normally; the checker fails it.

### 4.2 Mode-only pieces

**Auto-built from the data** by `src/world/bazookarp-kit.js`:

- **Weir:** two posts (0.5 × 0.5 × 2.4 m, stone) **5.4 m apart** (centre to centre) across the walking direction, a
  0.12 m sill between them (walk-over), and a floor ring decal. The posts' centres are 2.7 m from the weir's centre, so
  their inner faces (2.45 m) stay outside the shell even at its full 2.3 m swell: a re-formed shell on the weir meets
  its own `clear` rule, and the posts block only a 10° slice of shots from each side.
- **Gate:** a plinth 0.15 m high and 3.4 m across (a step-up, walkable) and two posts (0.6 × 0.6 × 3.2 m) 4.4 m apart.
- **Sign:** a post 0.15 m thick and 1.9 m tall with the NO CARP board.

The posts and signs are `roof: true`: their 0.15–0.6 m tops are off-limits, as the Halyard bar asks for every top
nobody should stand on. The plinth and the sill are walkable. These pieces are static and solid, so the nav graph
knows them. Everything that moves (curtains, caps, the arch, the shell, the light, the `carrierBlock` shimmer) is drawn
by `bazookarpFx` and never collides.

**Where they are added.** They are added inside `layoutFor(layout, 'bazookarp')` in `variants.js`: when the mode is
`'bazookarp'` and `layout.bazookarp` exists, the returned `half` list gets `karpKitPieces(layout.bazookarp)` appended.
`hasVariant(layout, dressing, 'bazookarp')` returns true whenever `layout.bazookarp` exists. They are **never** pushed
into `layout.half` itself, because some code reads the raw lists unfiltered:

- the stage-card thumbnails in `main.js` (`layoutThumbSVG(MAP_LAYOUTS[…])`);
- module-level piece indexes such as craters/props.js `FLOOR_IDX`.

They are mirrored (they are `half` pieces) and baked like any piece.

**Builders' own pieces** go in the stage's `layout.js`, `props.js` and dressing, tagged `onlyIn: 'bazookarp'` or
`notIn: 'bazookarp'` and read by `variants.js` as for every mode (the mode string is just `'bazookarp'`). This covers:

- clearing a centre piece for the Pond (as Halyard's wheelhouse does for the tower);
- moving a Gate's surroundings;
- ramps and walls;
- whole redesigned base fronts.

Turf War, Zone Control and Tower Command must build byte-identical to today (`hasVariant` false for them).

**Lightmap.** Every stage with Bazookarp data gets `assets/lightmaps/<id>.bazookarp.{png,json}` (`variantKey`), baked
on the Mac mini, inside the size budget (`tools/botlab/tests/size-budget.js`). `bake.cjs` already bakes `<id>.<mode>`
keys (its `split('.')`); it only needs `startMatch` to accept the mode.

### 4.3 Placement rules the data must meet

Section 9.1 has the numbers. In short:

- the Pond at the exact centre, on walkable floor, with fighting room round it;
- weirs on walkable floor, not on moving blocks, not in a free zone, each at a count in the band, with 3 m of clear
  room round each one (the weir's own posts stand at 2.7 m and are excepted), and two workable routes to each from the
  Pond. With two weirs, they sit on different routes at the same count;
- the Gate in front of the spawn or a level below, with 2–5 entrances, all seen from the spawn deck;
- free zones wholly on their owner's half (every node inside one has `D_owner > D_other`), a NO CARP sign within 2 m
  of every entrance, never covering a weir, the Gate or a main route, and covering every node of a plateau they are
  there for.

### 4.4 `tools/botlab/bazookarp-check.cjs`

Modelled on `tower-check.cjs`: one stage, built in `bazookarp` mode, offscreen. It needs only `karpField`, the data and
the kit (WP0), not the engine, so it is built in parallel with the engine (§11). The three new stages already depend
on it (bluestone ENGINE T4, caldera rule 28, aquarium rule 22).

```
MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs
env: OUT=dir (default .botlab/karp-check)
     KARP_DEF='{…}'   try data without editing bazookarp-data.js
     SHOTS=0          no pictures
     CARRY=0          no carry walk
     PHYS=0           skip #16's physical proof (quick iterations only; a RESULT ok needs it)
     DEVSTAGE=1       Cargo (noBots: the carry walk uses the scripted walker)
     ERA=1|2|3, LAVA=low|high   a stage state (§3.2 step 6); without it, every state in turn
```

It prints one line per check (`OK`, `WARN` or `FAIL` with numbers), then
`RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=…`, and writes `<id>-karp.json` with every number. All
routes below are measured on the **carrier graph** (§3.2: hop and gap edges included).

| # | check | pass |
|---|---|---|
| 1 | **Data.** The Pond within 0.3 m of (0, 0) on floor. Every weir, the Gate and every sign on floor. Nothing in a spawn zone or on a roof. Post and sign tops are `roof`. The mirror lands on floor too (dressing may differ by half). | all |
| 2 | **Field.** `L_A`, `L_B`; nodes reachable on foot from the Pond with `D = ∞` (holes); the halfway line drawn; the count of hop and gap edges added and the largest field gain across one. **Reading sweep:** at every valid node, \|`fieldAt` − `D`\| ≤ 0.05 m; at the quarter and half points of every walk edge (and ±0.3 m across where the waist line is clear), `fieldAt ≥ max(D[a] − \|p − a\|, D[b] − \|p − b\|) − 2.5 m`; the number of points more than 1.5 m low is reported. | `\|L_A − L_B\| ≤ 2 %`; holes 0 (or every hole is a roof or pit listed in the JSON); sweep clean |
| 3 | **Distances and counts.** Pond → weir(s) → Gate along the field; weir counts; with two weirs, the difference of their counts and their distance apart; Gate → pad. | §9.1 bands |
| 4 | **Reachability for a carrier on foot.** A path over the carrier graph with climb edges off, both spawn zones off, the team's free zones and `carrierBlock` nodes *off*: Pond → each weir → Gate, both teams. | each leg exists |
| 5 | **Two routes to every checkpoint and to the Gate.** Route 1 is the shortest no-climb path. Route 2 is the shortest no-climb path that avoids every node within 2.5 m of route 1, except within 6 m of either end. For **every weir** (one or two): Pond → weir needs route 1 and route 2, and weir → Gate needs route 1 and route 2. **With two weirs**, also: the two weirs' routes 1 from the Pond are disjoint by the same 2.5 m rule, the weirs are ≥ 12 m apart, and neither weir's route 1 passes within 4 m of the other weir. A third route with climbs allowed is reported. `routes` hints are measured and named. | route 2 ≤ 1.6 × route 1 on every leg, both teams |
| 6 | **Carry times.** Each route's length at 4.8 m/s (walking) and 9.44 m/s (swimming), per leg and in total. | Pond → Gate walking 11.5–18 s on the shortest route |
| 7 | **No shortcut into a base.** (a) **Entrances:** every carrier-graph edge (hops and gaps included) crossing inward into the **15 m ring** round the Gate, grouped (within 3 m) into entrances. Also counted as entrances: a ride on a car with `roof: false` whose stop lies inside the ring (none today), and a carp-open pipe exit inside it (aquarium; none open today). Each entrance needs a line of sight from 1.5 m above the spawn deck's edge to 1 m above the entrance. (b) **Climb shortcuts:** the field with climbs vs without, from the halfway line to the Gate. Any climb edge on the with-climbs shortest path that saves > 20 % is listed with a picture. (c) **Drops** > 2.5 m into the 15 m ring are listed with pictures. (d) **Connections the carrier graph does not know.** Five probes, each listing any find where `D` differs by more than 10 m between the two ends, with a picture: *low gaps* (two valid nodes ≤ 3 m apart, not joined within 6 m of graph walking, where a squid sphere of radius 0.35 m swept 0.3 m above the floor gets through); *tall walls* (the `_climbEdges` wall scan rerun without its 5.5 m limit: an inkable wall over 5.5 m with a node on top); *long drops* (a ledge node over a node more than 3.4 m below with open air between: `nav.js` makes no drop edge past 3.4 m); *high hops* (pairs 1.8–2.1 m apart in height, ≤ 1.2 m apart: just beyond the hop rule, so #16 tries them physically); *long gaps* (3.0–3.8 m over open air: just beyond the gap rule, likewise). | (a) 2–5 entrances, all seen; (b, c, d) none, or each one closed (geometry, `onlyIn`, `carrierBlock`) or waived by the lead in the stage note |
| 8 | **Gate placement.** Distance from the pad; height relative to the pad; inside the cone ±40° round the pad → Pond line; line of sight from the pad's deck; not in a free zone. | 12–20 m from the pad; `y ≤ pad.y + 0.2`; in the cone; seen |
| 9 | **High ground and free zones.** On each half, *plateaus*: connected nodes standing ≥ 1.4 m above the lowest floor within 3 m. For each: area; entrances; the enemy's arrival time from the halfway line (walking 6 m/s, climbs at 7.5 m/s, hops and gaps at 6 m/s); the owner's from its pad; how many of its nodes lie inside an owner's free zone (polygon and height band). **Zone entrances:** every carrier-graph edge (climbs included) that crosses into a zone's polygon and height band, chained into entrances (crossings within 3 m of each other are one entrance). **Zone side:** for every node inside a zone, whether it is on the owner's half. | FAIL: a plateau the owner's carrier can reach but the enemy only by climbing, unless **every** node of it lies inside one of the owner's zones. FAIL: a free zone touching a weir, the Gate, or route 1 / route 2. FAIL: an entrance with no sign within 2 m of one of its crossings; an entrance wider than 8 m needs a sign within 2 m of each end. FAIL: a zone node with `D_owner ≤ D_other` (not wholly on its owner's half). FAIL: a `noRetreat` polygon that overlaps, or comes within 3 m of, an own-half plateau or a Carp-Free Zone. WARN: enemy arrival > 2 × owner's, or a single entrance. |
| 10 | **Retreat sanity.** Along each team's own-half routes (route 1 and route 2 from its own Gate area to the halfway line), `P` must not dip by more than 6 m. Also across every state switch for a still carrier on those routes (it must not dip at all: §3.3 resets the mark). | none, or covered by `noRetreat` (within #9's limits) |
| 11 | **Carry walk** (CARRY=1). A scripted carrier per team, with no enemies: pick up, walk route 1 to weir 1, plant, re-pop, walk to the Gate. Reports the time, stuck episodes, plant and knockout. Then more walks: a retreat walk on its own half (the ×3 flag on at 8 m back, off at 3 m); a free-zone visit (×3); a fall from the nearest water edge on each half (Pond vs last footing); a splat on the narrowest walkway near each weir (the drop spot lands on `wide` floor, §2.7). **Drop coverage:** a splat is simulated at every 4th node of route 1 and route 2 of every leg, both teams, and at every node inside each free zone; each must find a drop spot on its own half (§2.7 step 4), within 12 m except inside a large enemy zone. | knockout both teams; stuck 0; flags as specified; no drop falls back to the Pond |
| 12 | **Variant.** `<id>.bazookarp` differs from Turf War only by tagged pieces and the kit; whether its lightmap exists and is fresh (hash). | exists, fresh |
| 13 | **Deep spawns** (§9.1 #6). Ways off the spawn deck: nav edges leaving the deck's nodes, grouped within 3 m. The apron: blocks at least 1.2 m tall standing within 4 m of route 1 between the deck's edge and the Gate. | ≥ 3 ways off; ≥ 2 cover blocks on the apron |
| 14 | **The Pond** (§9.1 #10). Nav coverage of the ring 4.5–10 m round the Pond (node area ÷ ring area). The shell's centre (1.3 m up) seen from 1.5 m up at 7 m in 8 compass directions. | coverage ≥ 70 %; seen from ≥ 6 of 8 |
| 15 | **Weir room** (§9.1 #9). Solid geometry within 3.0 m of each weir's centre between 0.3 m and 3.6 m above its floor, the weir's own two posts (at 2.7 m) excepted. The weir's centre (1.3 m up) seen from 1.5 m up at route 1's node 8 m before it (the attackers) and 8 m after it (the defenders), and from 7 m in 8 compass directions. | none within 3.0 m; both approaches see it; ≥ 3 of 8 |
| 16 | **The hop and gap edges, proved physically** (PHYS=1, the default). For every hop and gap edge the field added, and every *high hop* and *long gap* candidate of #7d, a kid with `carry` set (so 4.8 m/s, the carrier's jump) is stepped through `actor.update` at 1/60 s alone in the stage, as `tools/botlab/tests/treehills-pods.js` does its way-round search: from 1.5 m and from 3 m before the low end, facing the far end, it runs and jumps (jump pressed at each of 5 distances before the edge); success is standing grounded on the far node's floor within 0.5 m of it inside 2 s. | every added edge made at least once (else it is printed as a `hopVeto` entry to paste, and the field must not have it); every candidate beyond the rules **not** made, or listed under #7d with its gain |

**Self-test** (`KARP_SELFTEST=1` on `karpbox`, §10.1). Each of these must FAIL on its own: a deliberate climb shortcut;
the squid-only gap; **a 1.5 m non-inkable ledge into one Gate's ring that only a hop climbs** (#7a/#7d must see it as an
entrance, and #16 must prove the hop); an unreachable plateau with a zone covering only half of it; a weir with only
one route from the Pond; a `noRetreat` over the plateau; a weir against a wall; two weirs 8 m apart; a free zone with an
unsigned entrance; a free zone poking 2 m over the halfway line. Then the clean karpbox passes.

**Pictures** (JPEG < 300 KB, `sips -Z 1000`):

- `<id>-karp-top.jpg`: the whole stage from above with:
  - the field as a heat map in Alpha's colour, with iso-lines every 10 counts;
  - the halfway line;
  - weirs (diamonds) and the Gate (circle);
  - route 1 / route 2 per leg in two colours;
  - Gate entrances (arrows) and zone entrances (with their signs);
  - hop and gap edges as short ticks (red where #16 failed);
  - free zones hatched, `noRetreat`, `carrierBlock` and `noRest` outlined;
  - plateaus outlined (red if FAIL).
- `-pond.jpg`.
- Per weir: `-weir-<i>-approach.jpg` (from the attackers' side, 12 m back, 1.6 m up) and `-weir-<i>-defend.jpg`.
- `-gate-deck.jpg` (from the spawn deck) and `-gate-approach.jpg`.
- `-zone-<i>.jpg` (each free zone with its signs) and `-noretreat-<i>.jpg`.
- `-flag-<n>.jpg` for each WARN or FAIL that has a place, and for each #7 find.

---

## 5. Engine architecture

### 5.1 Modules (new files)

| file | what | about |
|---|---|---|
| `src/game/bazookarp.js` | `class Bazookarp`: the rules engine, no UI (like `tower.js`). The state machine, scoring (with the continuity clamp), weirs and Gate, fuse and rate, drops, moves and resets, overtime, passive charge, records, `netEvent`, `onSamples`, `onHostChange`, `state()`, `prompt(actor)`. Registers the reveal. Talks to the network only through a `KarpWire`. | 1 000 lines |
| `src/game/karpWire.js` | The `KarpWire` interface and `LoopWire`, its offline implementation (below). WP2's `NetWire` lives in netmatch.js. | 120 lines |
| `src/game/karpField.js` | The Carp Field (§3): the carrier graph with hop and gap edges, build per stage state, `setState`, `fieldAt`, `side`, `inFreeZone`, `inNoRetreat`, `pushOutBlock`, zone entrances, the rest flags and `dropSpot` (§2.7), placeholder data (with auto signs). Pure functions over `G.nav` and the layout; used by the engine, the checker, the HUD bar and bots. | 600 lines |
| `src/game/objTargets.js` | The objective-target registry (§2.2): `segHit`, `hit`, `splash`, `tick`, `spheres`, with a guest's batching of hits for the host. Boss Battle's hooks are the model. | 150 lines |
| `src/game/karpShell.js` | The Roe Shell (API below): the meter, the toughness, the × 0.5 and cap filters, touch-and-shove for this screen's own players (with the edge rule), growth and crushing (via `G.deploy.crushIn`), `spheres()` and `shields()`. | 320 lines |
| `src/game/karpGun.js` | The Carp Shot: charge, arc preview data, launch from the muzzle, shot objects (flight, landing, swell, the blast applied to this screen's own players by §2.5's path), knockback, the ghost (`KIT_GHOSTS.karp`, records `[0]`–`[3]`), the held model (`registerWeaponModel('sp_karp', …)`), the shot list bots read for dangers, the bot API (§8.4). | 520 lines |
| `src/game/botsKarp.js` | `karpPlan()` (team roles), the carrier gate's pieces (`karpCarrierAct`, `karpPathArgs`) and the roles' hooks (`karpSync`, `karpEngage`, `karpGoal`, `karpFightNav`, `karpAim`, `karpJump`), called from `bots.js` (§8.7). | 900 lines |
| `src/fx/bazookarpFx.js` | Every look: the Bazookarp (resting, held, wake glow), the Roe Shell shader, burst, Carp Blast, reset comet, weirs (curtain, caps, lowering), the Gate (sealed lid, rising arch, light column), free-zone hatching and signs' glow, the `carrierBlock` shimmer, the light pillar over the Bazookarp, shot visuals. Built and cleared on `match:state` like `TowerFx`. | 900 lines |
| `src/ui/hud-karp.js` | `class KarpHud` owned by the HUD (`hud.karp`, like `hud.lead`): the score bar, the carrier marker and edge pin, the shell meter tag, the reticle fuse ring, bottom messages, call-outs, gauge and squad badges, the minimap and TAB map layer (`drawKarpMap`). | 700 lines |
| `src/world/bazookarp-data.js` | `BAZOOKARP_DEFS` per stage. | — |
| `src/world/bazookarp-kit.js` | Weir, Gate and sign pieces from the data (§4.2), `karpKitPieces(def)`. | 120 lines |

**The shell's API.** WP1a (the engine) and WP1b (the shell and the damage sites) are built in parallel, so the engine
uses the shell only through this:

```js
class KarpShell {                        // src/game/karpShell.js
  constructor(engine)
  form(pos, hp, grow = 0.8)              // grow a shell round the Bazookarp resting at pos (the centre is pos + lift)
  clear()                                // no shell: carried, resetting, done
  get state()                            // 'none' | 'growing' | 'intact'
  get meter()  get hp()  radius()        // signed meter −hp…+hp; toughness; current radius 1.6–2.3 m
  add(team, amount, attacker)            // host / offline: one counted hit, already filtered (× 0.5, 220 cap).
                                         //  At |meter| ≥ hp it calls engine.onBurst(team, lastHit)
  setFromNet(meter, hp)                  // followers: from snapshots
  update(dt, own)                        // host: regrowth. Everyone: growth timer and crushIn; touch damage and shove
                                         //  for `own` (this screen's own players)
  segHit(a, b, pad)  hitFilter(dmg, wid, o)   // what G.objTargets asks it
  spheres(out)  shields(out)             // subs (§5.5) / bots
}
```

Until WP1b lands, WP1a uses a stub with the same API whose `add` is called by the tests directly.

**The wire.** The engine never calls netmatch. Every message in §7 goes through a `KarpWire`:

```js
// host side                              // guest side
wire.record(rec)    // discrete, sent at once, gets q      wire.claim(nid)                         // kc
wire.snapshot(rec)  // s / S, on the event timeline        wire.decline(nid)                       // kx
wire.toGuest(nid, msg)  // kd                               wire.reportRate(nid, rate, why, half, zone)   // kr
wire.on('claim' | 'decline' | 'rate' | 'foot' | 'hits', fn) wire.reportFoot(nid, x, y, z, half, zone)  // kf
                                                            wire.hits(sums)   // kh, on the next tick
```

`LoopWire` (offline) is a host whose records go nowhere, except in the test `karp-loop.js` (§10.1), where it also
feeds them, 0.1 s late, to a second `Bazookarp` instance built as a follower. So the follower path runs from WP1a on,
long before WP2 plugs in `NetWire`.

### 5.2 The state machine

The Bazookarp is in exactly one phase. `karp.pos` is where it is; while carried, it is the carrier's position as this
screen draws it (visual only: nothing is judged from a remote carrier's drawn position).

```
                 ┌────────────────────────── reform 0.8 s ◄───────────────────┐
                 ▼                                                            │
   (match start) SHIELDED ── |m| ≥ hp → burst ──► FREE ── pick-up ──► CARRIED
          ▲      ▲  │ covered (§2.7)                (after 0.25 s hold)   │  │
          │      │  └──► REFORMING at a new spot    plant on a weir ◄─────┘  │ splat / fall / fuse / left
          │      │                                   (pos = weir)            ▼
   RESETTING ────┘ (1.5 s flight to the Pond,       → REFORMING  ◄── drop spot (§2.6, §2.7), or
   then REFORMING)                                                   → RESETTING (to the Pond)
   CARRIED ── into the risen Gate ──► DONE (knockout)
   CARRIED ── grant declined (§7.3) ──► FREE (same spot, nothing else changed)
```

| phase | can be hit | can be picked | touch hurts | where |
|---|---|---|---|---|
| `shielded` | yes | no | yes | resting spot |
| `reforming` | no | no | no (shoves) | resting spot |
| `free` | — | yes, after the 0.25 s hold | — | resting spot |
| `carried` | — | — | — | with the carrier |
| `resetting` | no | no | no | flying to the Pond |
| `done` | — | — | — | in the Gate |

**Engine state** (also what `state()` returns, plus derived values):

- position and holder: `phase`, `phaseT` (re-form, reset flight or pick-up hold time left), `pos`, `restNode`,
  `holder` (actor or null), `holderTeam`, `grantT` and the pre-grant snapshot (host, for a declined grant);
- shell: `meter`, `hp` (1000 or 500), `lastHit[2]` (time, actor);
- fuse: `fuse`, `rate` (1 or 3), `rateWhy` (`retreat` | `zone` | null), and from the carrier's report `half`, `zone`;
  `lastFoot { pos, side, inZone }`;
- on the carrier's own screen only: `mark` (or unset), the retreat flag, `fuseShown` (the HUD's fuse, §7.2);
- weirs and Gate: `weirs[team][i] { pos, yaw, count }`, `lowered[2]`, `gateUp[2]`;
- field: `L[2]`, the field state now in force;
- score: `count[2]`, `bestM[2]`, `reachT[2]`, the clamp baseline `{ D, t }`, `stats.clamped`;
- rules: `touched`, `coin`, `lastCarrier { team, how, t }`, `lastPlant { team, t }`;
- overtime: `overtime`, `otLosing`, `otWindow { left, open, closeT }` (seconds of window left; it counts down only
  while the phase is `shielded` or `free`), `overtimeT`;
- online: `q` (the last discrete record's sequence number, §7.2), the claim list (host);
- end: `winner`, `reason`, `log[]`.

**Per frame** (`update(dt)`, called by `match.js` before the actors move, like the tower). There are three lists. A
step runs only on the screens its list names.

**On every screen** (offline, the host and guests):

1. `clock += dt`.
2. For this screen's **own** players (offline: everyone; the host: its player and its bots; a guest: its player):
   - shell touch damage and shove against this screen's copy of the shell (phase `shielded`; while re-forming, the
     shove only);
   - pick-up detection against a `free` Bazookarp (§2.3). Offline and on the host, this adds a claim to the claim
     list. On a guest, `wire.claim` (§7.3);
   - passive special charge (S43–S45) from the replicated phase, holder and counts;
   - if the player is the holder: the field reading (§3.2), the retreat mark and test, the own-half and own-zone
     tests, and the last footing (§3.3). Offline and on the host, the rate goes straight to the fuse; a guest calls
     `wire.reportRate` / `wire.reportFoot` on change (§3.3's rules).
3. The carried model on this screen's copy of the holder.
4. The carrier's own HUD fuse (`fuseShown`): simulated locally at the local rate, and corrected from the host's
   snapshots by §7.2's rule (it may jump forward; it never moves back by more than 0.2 s per second).
5. **The gauge guard** (S22) runs at the **end** of `Match.update`, after the actors, specials, subs and this engine,
   for every actor this screen owns that carries: `a.special = min(a.special, a.carry.sp); a.carry.sp = a.special`.

**On the host only** (and offline):

6. Phase timers (re-form, reset flight, the pick-up hold). Shell regrowth. Continuous-damage batches.
7. **Carried:**
   - readings: the host's own carrier each frame; a remote carrier from `onSamples` (each real sample in order, §3.4);
   - for each reading: the continuity clamp, then `count` / `best` (§3.4), a plant check against every standing weir of
     the holder's team, and a Gate check → knockout;
   - `fuse -= dt × rate` (the rate: its own judgement, or the newest `kr`);
   - fuse ≤ 0 → the Carp Blast (§2.1 S8, §2.6), with §7.5's hold for a remote carrier.
8. **Resting** (`shielded`, `free`): the resting-spot re-check every 0.5 s and on `lava:warn` / `era:warn` (§2.7).
9. **Free:** grant a pick-up from the claim list once the hold is over (§7.3).
10. Overtime: the S38 checks at time-up; in overtime, the S39 checks and the window's countdown, with the 0.4 s grace
    for in-flight claims at the window's close (§7.3).
11. Records: the snapshot `s` at 10 Hz and the full state `S` at 1 Hz through `wire.snapshot`; discrete records at once
    through `wire.record` (§7.2).

**On followers only** (online guests):

12. Apply snapshots, but skip any whose `q` is older than the last discrete record applied. Ease a resting, free or
    resetting Bazookarp onto the snapshot.
13. Apply discrete records as they arrive (`netEvent`).
14. From a holder's `splatted` until the `d` or `r` record arrives, show the Bazookarp lying at the holder's death
    spot.

**Carrier lifecycle hooks** (host):

- `on('splatted')`: if the victim is the holder, apply §2.6 with the cause (`water` / `lava` / … means a fall). For a
  **remote** holder granted less than 1.5 s ago, first wait up to 0.4 s (`claimAge`) for a `kx` decline (§7.3).
- `on('actor:removed')`: the same, as `left`.
- `onHostChange()`: §7.6.
- A bot adopting an actor needs nothing for the carry itself: `a.carry` survives `_adopt`. Its new owner sets `mark`
  to unset (§3.3), since the old owner's mark never crossed the wire.

**Field-state switches** (`on('era:done')`, `on('lava:warn')`, through `karp.field.setState`, §5.5): every screen
switches the arrays; the carrier's own screen resets its mark (§3.3); the host resets the clamp baseline and re-checks
the resting spot at once.

### 5.3 Events

All are emitted on every screen (followers from `netEvent`), so the HUD, fx, audio and bots listen in one place.

| event | payload |
|---|---|
| `karp:phase` | `{ phase, prev }` |
| `karp:hit` | `{ team, meter }` (this screen's own hits, throttled to 10/s; for sound and the flash) |
| `karp:burst` | `{ team, pos, by }` (team = who burst it) |
| `karp:pickup` | `{ actor, team }` |
| `karp:undo` | `{ actor }` (a declined grant was undone, §7.3) |
| `karp:drop` | `{ actor, team, pos, how: 'splat' \| 'fall' \| 'fuse' \| 'left' \| 'moved' }` |
| `karp:reset` | `{ from, why: 'fall' \| 'fuse' \| 'zone' \| 'left' }` |
| `karp:plant` | `{ team, index }` (all of that team's weirs lower) |
| `karp:gate` | `{ team }` (the Gate risen for that team's attack) |
| `karp:rate` | `{ actor, rate, why }` |
| `karp:fuse` | `{ actor, left }` (each whole second under 10) |
| `karp:explode` | `{ actor, pos, own }` |
| `karp:field` | `{ state }` (the field switched state, §3.2 step 6) |
| `karp:shot` / `karp:land` / `karp:blast` | `{ actor, charge, from, vel }` / `{ actor, pos, charge }` / `{ actor, pos, radius, charge }` (karpGun) |
| `karp:overtime` | `{ losing, why: 'held' \| 'dropped' \| 'planted' }` |
| `karp:end` | `{ winner, reason, counts }` |

### 5.4 Hook-ins in shared files

Every hook is short and tagged `[b5-karp]`. The mode string is `'bazookarp'`; the match property is `match.karp`.

| file | hook |
|---|---|
| `src/config.js` | the `BAZOOKARP` block (appendix); `PROGRESSION.bazookarp = { turfScale: 0.6, xpPerCarryM: 3, xpPerPop: 60, xpKnockout: 300 }`; `lastMode` comment |
| `src/game/match.js` | Accept `'bazookarp'` in the mode list, with duration `BAZOOKARP.duration`. Create `this.karp = new Bazookarp(this, wire)` in `setup()` and `_setupRoster()` (a `LoopWire` offline, netmatch's `NetWire` online). In the `playing` branch, a block like the tower's (`update`, break on state change or overtime). **At the end of `update`, the gauge guard** (§5.2 step 5). `timeUp()` takes `this.zones \|\| this.tower \|\| this.karp`. Add `endKarp → endZones`, a `_judge` branch (result `{ mode: 'bazookarp', winner, reason, counts, best, len, overtime, coin? }`) and `dispose`. `teamSummary()` adds `carrier: a === this.karp?.holder`. |
| `src/main.js` | Mode lists at `?autostart` and in `startMatch` (`['boss', 'zones', 'tower', 'bazookarp']`) and the duration. Build, clear and update `BazookarpFx`. Prompts: `m.karp?.prompt(a)` in the prompts block. `frame.karp = { ...m.karp.state(), viewer, carrying }`. The results branch (judge mode `bazookarp`, the zones reveal with the carp icon) and XP. `frame.specialId = 'karp'` while carrying. |
| `src/game/actor.js` | (1) `this.carry` (null or `{ since, sp }`), set and cleared by the engine. (2) `_horizontal`, while carrying: the kid's run target is `PLAYER.runSpeed × 0.8` (or `chargeWalk` while charging) **instead of** `weaponRunner.moveSpeed()`; the airborne target is `max(PLAYER.runSpeed × 0.8, airMinSpeed)` (today the air branch reads `moveSpeed()` too); the swim and dry-squid `vt` × 0.8; the enemy-ink cap `enemyInkSpeed × 0.8`. A carrier never calls `moveSpeed()`. (3) `_updateClimb`: `climbSpeed` and `climbSideSpeed` × 0.8. (4) After `_horizontal`: add `this.kick` (§2.1 S27). (5) `_spawnBarrier`: also the own pad while carrying; then `G.match?.karp?.field.pushOutBlock(this)` for `carrierBlock` volumes (a polygon push, not the radial code). (6) `canSuperJump`: `&& !this.carry`. (7) `specialReady`: `&& !this.carry`. (8) **`&& !this.carry`** on the dodge roll (`tryDodge`, line 322) and on the kit jump (`MAIN_KITS[kind].jump`, line 325), so a Mitts carrier's fire + jump is a plain jump and never a leap. (9) The weapon block: while carrying, `this._spWeapon = G.karpGun.update(this, dt, winp)`; sub or special presses emit `sub:cantuse { kind: 'karp' }`. (10) A helper `isRoofFor(block, actor)` = `block.roof \|\| (actor.carry && block.tag?.startsWith('plant:'))`, used at the two roof reads (the jump's `onRoof` and the slide's `rb.roof`), so a hedge is a roof for a carrier. (11) `_slamImpact` (the Tidal Slam): `G.objTargets?.splash(this, c, sp.radius, sp.damageMax, sp.damageMin, 'slam')` beside its damage loop. About 40 lines. (There is no `addTurf` hook: the guard covers every gauge source.) |
| `src/game/specials.js` | The `G.objTargets` calls beside `blast()`'s boss call and in the Vortex Strike, Howl Box, Twister Zooka, Mega Stamp and Zipcaster damage code (§2.2). No Bubble Guard or cheer change: the engine calls the existing `G.specials._dropShield(a, true)` and `G.specials.end(a, 'karp')` at the pick-up (§2.3), and the guard covers the cheer. |
| `src/game/weapons.js` | In the projectile step, `G.objTargets?.segHit(p.prev, p.pos, p.size * 0.6)` **before** the actor loop: on a hit, the segment is cut to the hit point (so only players in front of the shell can be hit), and after the loop, if no player was hit, `objTargets.hit(p.owner, p.damage, wid, point, { special: p.sp })`. The charger beam compares the shell's distance with the nearest player's, as it does for the boss (lines 1302–1304). The bomb blast passes `{ special: b.sp }`. Every other site: one line beside its `G.boss?.…` call. |
| `src/game/subs.js` | Beside `G.boss?.splash` in the sub blast (line 908): `G.objTargets?.splash(it.owner, center, radius, dmgMax, dmgMin, it.kind, { special: it.sp })`. |
| `src/game/sp-surf.js`, `src/game/kits/*.js` | One `G.objTargets?.…` line beside each `G.boss?.…` line, plus the Surf N' Turf ring (`tick`, §2.2). |
| `src/game/character.js` | `ANIM_OF.sp_karp = 'sp_zooka'` (the Zooka's shoulder pose), or a `HOLD.sp_karp` if the model needs its own grips. |
| `src/game/bots.js` | The carrier gate and the role hooks (§8.7): a `KARP_W` weapon stand-in for a carrier, a gate that skips every other trigger, sub, special and climb path, and a carrier-aware `_pathTo`. About 80 lines; the rest is in `botsKarp.js`. |
| `src/game/botSpecials.js` | Three danger areas: an enemy Carp Shot (in flight and landed), our own carrier in its last 3 s of fuse, and the shell when the other team's side of the meter is ≥ 70 % (§8.6). |
| `src/game/botSight.js` | A submerged enemy carrier is noticed by its wake out to `SIGHT.karpWakeR` (20 m) with a clear line (§8.6). |
| `src/game/minimap.js` | `if (G.match?.karp) drawKarpMap(c, this, tc, s, hex, t)` beside the tower's block. |
| `src/game/movers.js` | `sweepRect(car)`: each car's full corridor between its stops, read by `karpField`'s rest flags. |
| `src/game/pods.js` | Nothing: hedges are a roof for a carrier through `isRoofFor` in actor.js; `karpField` reads each pod's `p.nav` for the rest flags. |
| `src/ui/hud.js` | `this.karp = new KarpHud(this)`; `this.karp.update(dt, f.karp)`; squads draw a carp badge for `carrier`; the special orb shows the carp glyph for `specialId === 'karp'`; `judge({ mode: 'bazookarp' })` → `_judgeZones` with the carp icon; `_zLive` includes `match.karp`. |
| `src/ui/hud-lead.js` | Mode `karp`: the leader is `winning()`, with no leader at 100 / 100. The trailing team shrinks while the leader holds the Bazookarp on the trailing team's half. |
| `src/ui/menus.js` | Section 6.6. |
| `src/net/session.js` | `ROOM_MODES` append `'bazookarp'` **at the end**. The start config's mode line (about line 340) maps every mode except zones and tower to `'turf'` today: add `'bazookarp'` to the kept modes, and `BAZOOKARP.duration` to the duration line. Also `karpCoin: Math.random() < 0.5 ? 0 : 1`. |
| `src/net/mock.js` | Accept the mode. |
| `src/net/netmatch.js` | `NetWire` (§5.1): discrete records sent at once (`{ k: 'bk', e }`), snapshots on the timeline, `case 'bk'` → `match.karp.netEvent`. Guest → host `kc`, `kx`, `kr`, `kf` as messages, and `kh` **as a field on the guest's 20 Hz tick** (`msg.kh`; the host reads it, others ignore it). Host → one guest `kd`. In `_sample`, on the host, the holder's newly played real samples go to `match.karp.onSamples(a, samples)` (§3.4). The `'k'` case: a `karp` record from a peer that is no longer the actor's owner (a departed host's queued shot for a bot this client just adopted) is played, not dropped (§7.6). `onLeave`: the new order with the narrowed flush (§7.6). Result pack and unpack for `bazookarp`, and `karpM` / `karpPops` in the per-player `st` rows. |
| `src/world/maps.js` | Merge `BAZOOKARP_DEFS` into the layouts (data only; no pieces). |
| `src/world/variants.js` | `layoutFor(layout, 'bazookarp')` appends `karpKitPieces(layout.bazookarp)` to `half`; `hasVariant(…, 'bazookarp')` is true when `layout.bazookarp` exists (§4.2). |
| `src/audio/*` | The cues in §6.8, synthesized like the rest. |
| `docs/NET.md` | A **Bazookarp** section (§7), the `onLeave` change and the `'k'` case change. |
| `tools/botlab/match.cjs`, `page.cjs` | `MODE=bazookarp` accepted. (`bake.cjs` already handles `<id>.bazookarp`.) |

### 5.5 Interfaces with the other batch-5 packages

One table, so each builder reads the same contract. Where another package's document says something different, this
table is the proposal the lead settles (Q19, Q20). This spec does not edit other designers' documents.

| package | what it provides to Bazookarp | what Bazookarp provides to it | status |
|---|---|---|---|
| `deploy` (wave 1) | `G.deploy.crushIn(shape, how)` (subs SPEC §0.3): `{ sphere: { c, r } }` ends every live device of this screen inside the sphere, with `how: 'shell'`. | The shell calls it every frame of its 0.8 s growth with its current radius. | Merged before WP1b is done; a no-op stub until then. |
| `zipcheer` (wave 1) | The cheer's wisp into the cheerer's gauge. | Nothing: S22's guard caps a carrier's gauge whatever raised it. | No hook needed. |
| `sprules` (wave 1) | Bubble Guard passing; shared copies outlive their source with their remaining time. | One condition in its pass-on loop: a giver with `a.carry` never passes a bubble on (§2.3). | Merged before WP1a is done; until then the condition has nothing to guard. |
| subs (batch 5, its revision 3 §0.6) | Its blasts call `G.objTargets?.splash(owner, c, R, max, min, wid)` beside each `G.boss?.splash` (a bobber chain once, from its nearest bobber). Its sentry rounds are ordinary projectiles and count at face value through `segHit` / `hit`. Its Glide bounce, bobber deploy, sentry sight and dash `blockActor` read `spheres()`. A sub object that a barrage can throw (the Mystery Bomb Barrage may pick any barrage bomb) passes `{ special: !!obj.sp }` as the 7th argument. | `G.objTargets.splash(…, o)`, `segHit`, `hit` and `spheres(out)` exactly as §2.2 defines them; `crushIn` on growth ends its sentries and bobbers. There is **no** `G.karp.shellBlocks` and no per-tag ledger: a caller that needs a segment test tests the segment against `spheres()`. | The subs SPEC's own "Asked of other packages" list (its §F, near its line 1888) still names revision 2's `hitArea` tag ledger, sentry × 0.5 and `shellBlocks`; its §0.6 has replaced them. Q20 asks the lead to have that list deleted. |
| bluestone (eras) | One union nav graph with era-masked edges (`e.em`, its H7) and per-era `valid` arrays; `era:warn` and `era:done { era }` on the stage clock; `G.match.eras.dangerAt(pos)`; no era jumps in overtime; nothing changes within 3 m of a Pond, weir or Gate (its rule 17). | `on('era:done', ({ era }) => karp.field.setState(era))` (precomputed arrays, never a rebuild); the drop spot rejects `dangerAt` nodes from `era:warn` to `era:done` and `era:warn` re-checks the resting spot; `restOk` = valid in the current era **and every later one**; free zones, `noRest`, `carrierBlock` and `noRetreat` may carry `eras`; checker `ERA=1\|2\|3`. | Its H21 says `restOk` excludes nodes "not valid in every era", and its test 12b expects a splat on the Halo to rest elsewhere. Under this revision the Halo is a legal resting spot once it exists (era 3), because it can no longer be taken away. Q19. |
| caldera (lava) | Its merged LOW + HIGH nav (its §4.3), `reach`, and **a new pure call `G.match.lava.restMask(level)`** → `Uint8Array` over nav nodes, 1 = standable at that rest level: unaffected floor always; lava-reachable floor only at LOW; a rider node only where the rider sits at that rest (sunk stones 0). It must be callable at load for both levels (from `yAt` and the riders' rest poses, no simulation). `lava:warn { to }` on the stage clock. | Two field states, LOW and HIGH, precomputed at load; `setState(to)` at `lava:warn`; `restOk` from `restMask` per state; `lava:warn` re-checks the resting spot, so a resting Bazookarp is moved before the lava arrives; checker `LAVA=low\|high`. A lava death is a fall (S25 / S26) by last footing, which is static floor only. | Its ENGINE.md §4.3 says "The Carp Field rebuilds on `lava:rest` and `lava:move`, using `closedNow(id)`". Replaced by the two precomputed states and the switch at `lava:warn`; `closedNow` is not used. Q19. |
| aquarium (pipes) | `modes.bazookarp.carp` (empty on this stage: carriers are refused at every mouth); `'pipe'` edges with `len`; riders `a.pipe`. | Pipe legs are field edges only when carp-open; the burst's and the Carp Blast's instant splats skip riders (`a.pipe && a.pipe.phase !== 'suck'`); a carp-open pipe exit inside a Gate's 15 m ring counts as an entrance (checker #7a). | Agreed as written in both documents. |

---

## 6. HUD, menus, looks and sound

### 6.1 Score

- **Count badges.** The Zone Control / Tower Command badges: your team on the left in your ink, the count 100 → 0
  filling toward the timer, and a carp tab on the team that holds it.
- **The Carp Line**, a bar under the timer:
  - Left end: *their* Gate (on your half). Right end: *your* Gate (on theirs). The Pond is in the middle.
  - **Diamonds:** each team's weirs at their counts (yours on the right half, theirs on the left), grey once lowered.
  - **Notches:** each team's best, in its ink.
  - **The carp marker:** where the Bazookarp is. On the half of team T it sits at `0.5 ± 0.5 × P_T / L_T`, by the
    field.
  - **Gates:** a padlock on a Gate still sealed.

  While a carrier holds it, the marker wears the fuse in small digits. Overtime turns the bar's frame gold with the
  pick-up window as a draining strip.
- **Lead.** `hud-lead.js` mode `karp` (§5.4). Nobody leads at 100 / 100, which also keeps the coin hidden.

### 6.2 The carrier everywhere

- **Squad icons** (top): the carrier's portrait gets a carp badge in the carrier's ink. On both teams' HUDs, always,
  including while the carrier swims: S35 says the player icons show who holds it, and that leaks a name, not a
  position.
- **Special orb** (the carrier's own HUD): the carp glyph replaces the special icon; the fill shows the frozen value.
- **Over-head marker:** the DOM marker over the head (§1.1), projected each frame like the tower pointer. Off screen
  it is pinned to the edge with an arrow and the distance (`32m`), for the carrier's team always and for the enemy
  while visible (S30, S31).
- **Reticle** (the carrier's own HUD): a fuse ring round the crosshair (whole seconds inside it, red under 10 s), the
  charge ring, and the arc preview with the landing circle.
- **Bottom** (the carrier's own HUD): `DON'T RETREAT!` / `BAZOOKARP-FREE ZONE!` in big type with the `×3` ring. They
  are judged on the carrier's own screen (§3.3), so they appear and clear at once, online too. The fuse ring runs
  locally and takes the host's corrections by §7.2's rule: it may jump forward (less time) at once, but it never moves
  back (more time) by more than 0.2 s per second, so it never visibly rewinds under ×3.

### 6.3 The shell and the objects

- A world-anchored **meter tag** over the shell: a two-colour pill with its tip at the meter. Shown when the shell is
  on screen within 45 m. On the corner minimap the shell's icon carries the same split as a pie.
- **Weir and Gate tags** (like the tower's checkpoint timers): the count each would give (`45`) over each of your
  team's standing weirs; `GATE` over your Gate once it has risen.

### 6.4 Maps (minimap and TAB map)

| item | look | who sees it |
|---|---|---|
| the Bazookarp resting or free | gold carp with the shell ring and the meter pie (no ring when free) | everyone |
| held | carp in the carrier's ink with a fuse arc | the carrier's team always; the enemy only while it is visible (S31) |
| resetting | a gold dotted arc to the Pond | everyone |
| weirs | diamonds in the attacking team's ink; grey once lowered | everyone |
| Gates | a ring; a padlock while sealed; filled and pulsing once risen | everyone |
| free zones | hatched in the owning team's ink | everyone |
| halfway line | faint dashed line (TAB map only) | everyone |

### 6.5 Prompts and call-outs

As listed in §1.1. `Bazookarp.prompt(actor)` returns the prompt line; `KarpHud` listens to the events for call-outs
and sounds. Call-outs reuse `_zCall` with the carp icon.

### 6.6 Menus

| place | change |
|---|---|
| `MODE_INFO` | `bazookarp: { id, label: 'BAZOOKARP', name: 'Bazookarp', icon: KARP_GLYPH, text: 'Burst the shell, grab the Bazookarp and carry it into their base — reach their Dragon Gate to knock out.' }`. `modeOf`, `fixedLen`, `fixedDur` and `BATTLE_MODES` include it. |
| mode screen (offline Play) | A fifth card: `BAZOOKARP`, kicker `RANKED RULES`, badge `NEW!`, art `stageArt('lockgate', 'day')`, chips `4 V 4` · `5:00 + OT` · carp glyph `CARRY IT HOME`. |
| stage select | All offline stages. The mode chip and the locked 5:00 length. A stage still on placeholder data shows a `PREVIEW` tag (dev builds and the lead's call for release, section 12, Q10). |
| How to Play rules cards | Four cards with SVG art in the `TOWER_RULE_ART` style (`KARP_RULE_ART`): **Burst the shell** ("Shoot the Roe Shell in the middle. When your team's ink bursts it, any of them close by is splatted. Touching it stings."); **Carry it** ("Run into it to pick it up: you're 20% slower and can't super jump, enter a spawn or use your kit — but it lobs huge ink bombs. Fully charged, they splat."); **Take the weir** ("Your count drops as you carry it toward their base, but not past their weir until you land it on one. That opens their Dragon Gate: carry it in for a knockout."); **Mind the fuse** ("You have 60 s with it. Retreat on your half or step into your own Carp-Free Zone and the fuse burns 3× as fast. If the fuse runs out on your half, you fall off your half, or you're splatted in your own Carp-Free Zone, it goes back to the middle."). Two notes: **Specials charge** ("while the other team holds it, and for the team behind while nobody does") and **Overtime** ("If the team behind holds it at time-up, or the team ahead just lost it in the last 15 s, or the team behind just landed a weir in the last 5 s, play goes on. Grab it within 10 s and carry it past their count."). |
| tips | Four lines in the `TIPS` style, e.g. `Bazookarp: fire the carp backwards to kick yourself through enemy ink.` and `Bazookarp: swim in your ink with it and their map loses you — but the wake glow still shows.` |
| online lobby | `LOB_MODES` gets `'bazookarp'` before `'practice'` (UI order only; `ROOM_MODES` appends at the end). The mode icon. `is-zonemode` for the locked length. |
| pause strip | The Tower Command strip: both counts, then `ALPHA-COLOUR CARRYING · 37 s`, `SHELL · 62% THEIRS`, `FREE`, or `BACK TO THE POND`; the weirs as pips. |
| results | The zone results layout, centre label `CARRY IT HOME`, both counts, the reason (§1.1), the overtime flag. Per-player columns `Carried` (metres of progress gained while carrying, `stats.karpM`) and `Pops`. XP from `PROGRESSION.bazookarp`. |

### 6.7 Looks (`bazookarpFx`)

- **The Bazookarp.** Resting: turning slowly 1.2 m above its floor inside the shell, white-gold, with a soft light.
  Held: the `sp_karp` model on the carrier's shoulder in their ink; the mouth glows with charge; droplets fall from
  the fins.
- **Light pillar** over the Bazookarp, like the tower's. Gold while unheld, the carrier's ink while held. Hidden from
  the enemy while the carrier is hidden (S31): the pillar would show through walls.
- **Roe Shell.** An iridescent membrane (the bubble shader family); the leading team's ink swirling in from the hit
  side; swelling, cracks, the white flash above 75 %. The burst sends a shock ring out to 4.5 m.
- **Carp Blast.** A huge burst in the enemy ink with a ring at 4.5 m. Before it: the last 3 s of the fuse make the
  carp shake and hiss, so teammates have a warning to step away.
- **Weirs.** Falling-ink curtain (the attacking team's ink), carp-head caps lit. Lowering: the curtain drains (0.6 s)
  and the caps sink (1.2 s), leaving grey.
- **Gate.** Sealed lid and arch down. Opening: the arch rises over 1.4 s with a fanfare and a light column.
- **Free zones.** Floor hatching (a zoneMarks-style overlay on the faces inside the polygon and height band) in the
  owner's ink at low alpha, and the NO CARP boards lit.
- **Wake glow.** Under the swimming carrier: a carp-shaped glow decal on the ink plus ripples, depth-tested.
- **Shots.** A glossy ink ball with a trail. On landing, a splat ring that swells to the blast radius, then the
  burst; a water-spout on a Big Burst.
- **Reset comet.** A gold comet arcing to the Pond, then a splash.

### 6.8 Sound and music

All synthesized in `src/audio/`, positional unless marked. These are cue names for the integrator:

| cue | when |
|---|---|
| `karp_shell_hit` | a soft tick per hit; pitch rises with your team's side of the meter |
| `karp_shell_warn` | crack and whine at 75 % |
| `karp_burst` | a wet pop plus a bass drop |
| `karp_pickup` | a rising gulp sting (stereo for you) |
| `karp_drop` | a thud and fizz |
| `karp_charge` | a rising hum loop while charging, with a ding at full |
| `karp_fire` | whomp |
| `karp_land` | plop and hiss (the swell) |
| `karp_blast` | boom sized by charge |
| `karp_fuse_tick` | the carrier's last 10 s, every second (stereo for the carrier) |
| `karp_fuse_fast` | a rattle while ×3 (carrier only) |
| `karp_explode` | a huge boom |
| `karp_reset` | a whoosh up, then a splash at the Pond |
| `karp_weir` | a fanfare, then water draining |
| `karp_gate` | a gong and a rising rumble |
| `karp_alarm` | two-note alarm when their carrier is ≥ 85 % of the way to your open Gate (count ≤ 15), at most once per 10 s |

Music: the existing final-minute cue at 1:00 and the existing overtime sting. The `karp_alarm` is the only new tension
cue (no new music files).

---

## 7. Online

### 7.1 Who decides what

| thing | authority | how the others learn it |
|---|---|---|
| score, counts, best, reach times, winning team | host: its own carriers from their positions, a remote carrier only from the real samples it sent, through the continuity clamp (§3.4) | `s` snapshots (10 Hz), `S`, the end record |
| match clock, overtime start and end, the coin | host | as today; the start config carries `karpCoin` |
| shell meter, regrowth, burst | host | snapshots; `b` (sent at once) |
| a hit on the shell | the shooter's screen decides; the host applies | a guest's sums ride its 20 Hz tick as `kh` (§7.4) |
| burst splats | each victim's owner (its own players in the radius on its screen) | the usual `splatted` events |
| touch damage and shove | each player's owner, against its copy of the shell | hp as usual |
| pick-up | host, from claims, after the 0.25 s hold (§7.3) | `p` at once; `kd` to a refused claimant; `u` if the claimant's screen declines |
| the carrier's own Bubble Guard ending | every screen, when it applies the grant (§2.3) | the grant itself |
| carrier movement, speed, no super jump, spawn barrier | the carrier's owner, locally | actor ticks |
| Carp Shot flight, landing, knockback | the shooter's screen | `karp` kit records `[0]`, `[1]` |
| Carp Shot blast damage | each victim's owner, when `[2]` plays on its screen, by §2.5's path (not `applyHit`) | the usual splat events; `[3]` from the victim gives the shooter its hit marker |
| fuse rate, own half, own zone, last footing | the carrier's owner (§3.3) | a guest sends `kr` / `kf` to the host at once; offline and the host judge their own |
| the fuse itself, the Carp Blast | host decides (with §7.5's hold for a remote carrier; own half from the newest `kr`); splats by each victim's owner; enemy ink painted by the host | `x` at once |
| drop spot, resets, moves off a covered spot | host | `d`, `r` at once |
| plant, Gate, knockout | host: its own carriers from their positions, a remote carrier from its real samples (§7.5) | `w`, `e` at once |
| passive special charge, the gauge guard | each client its own players (the host its bots), from the replicated state | — |
| marker visibility | each screen, from the carrier's replicated form and submerged flags | — |

### 7.2 Records

`NetWire` sends Bazookarp records in two ways.

- **On the host's event timeline** (in step with its paint; followers play them after the playback delay): the
  snapshot `s` and the full state `S`, as timeline events of type `'ks'`.
- **At once** (`_sendNow`, `{ k: 'bk', e }`): every discrete record. Guests then learn of a burst, a grant or a drop
  one network trip after it happens, not one trip plus the 85–300 ms playback delay.

Every discrete record carries `q`, the host's Bazookarp sequence number, which goes up by one per record. Snapshots
carry the `q` of the last discrete record before them. A follower applies a snapshot's phase, holder and position only
if its `q` is at least the last discrete `q` it applied. So a late snapshot can never undo a newer grant or drop.

| record | channel | meaning |
|---|---|---|
| `['s', q, t, phase, x, y, z, holderNid, meter, fuse, rate, why, c0, c1, otT, win]` | timeline, 10 Hz | snapshot. `t` is the host's match time when it was taken (2 decimals). `why` is 0 / 1 (retreat) / 2 (zone); `win` is the overtime window left or −1. |
| `['S', q, t, …]` | timeline, 1 Hz | full state: the snapshot plus `bestM`, `reachT`, weirs lowered per team, Gates, `touched`, `lastCarrier`, `lastPlant`, `otLosing`, `otWindow`, `phaseT`, `hp`, `lastHit` (nid per team), the carrier's `half` and `zone` (from `kr`), `lastFoot`, `restNode`, the field state. For host migration (and any future late join). No `mark`: the host never has it for a remote carrier (§7.6). |
| `['p', q, nid]` | at once | pick-up granted (the fuse starts at 60 s for that carrier) |
| `['u', q, nid, x, y, z]` | at once | a grant undone (the claimant's screen declined it, §7.3): free again at x, y, z |
| `['b', q, team, x, y, z, byNid]` | at once | burst |
| `['d', q, how, x, y, z]` | at once | dropped or moved; re-forming at x, y, z |
| `['r', q, x, y, z, why]` | at once | reset flight from x, y, z |
| `['w', q, team, index]` | at once | plant (the Bazookarp is on that weir; all of the team's weirs lower) |
| `['x', q, nid, x, y, z, own]` | at once | Carp Blast (`own`: on the carrier's own half, as its own screen last reported) |
| `['t', q, losing, why]` | at once | overtime begins |
| `['e', q, winner, reason, c0, c1, b0, b1]` | at once | end, with exact numbers |

Guest → host:

- `{ k: 'kc', nid, ts }`: a pick-up claim. `ts` is the sender's clock when it was sent; the host turns it into its own
  clock with that peer's offset (`ts + peer.off`, the same estimate netmatch already keeps for the peer's ticks);
- `{ k: 'kx', nid, q }`: the grant with that `q` is declined, because the player died before it arrived (§7.3);
- `{ k: 'kr', nid, rate, why, half, zone }`: the carrier's fuse rate, half or zone changed (§3.3). Sent at once, at
  most one per tick (50 ms);
- `{ k: 'kf', nid, x, y, z, half, zone }`: the carrier's last footing changed (§3.3): at most 5 a second, except that
  a change of its half or zone is sent at once;
- `kh: [nid, dmg, nid, dmg, …]`: **a field on the guest's ordinary 20 Hz tick** (`msg.kh`), not a message of its own:
  the shell hits since the last tick, summed per attacker, after the × 0.5 and the 220 cap. The host reads it; other
  peers ignore it.

Host → one guest: `{ k: 'kd', nid }`: a claim refused while the Bazookarp stays free.

**Message rate.** The relay kicks a socket that sends more than 90 messages a second for 4 seconds in a row
(`relay.cjs`, `RATE = 90`). A guest's Bazookarp traffic adds no message for shell hits (they ride the tick), at most
about 4 `kc` a second while it touches a free Bazookarp, and, while it carries, a handful of `kr` (never more than 20 a
second) and at most 5 `kf` (plus the rare half or zone change). So a guest firing at the shell sends its 20 ticks a
second and nothing more, and a carrier stays far below the relay's 90 (worst case about 45). Per-hit messages are never sent: fling and droplet weapons can land several hits a frame.

**The fuse on the carrier's screen.** The host's fuse is the authority, but snapshots arrive one way plus the 85–300 ms
playback delay late, which at ×3 is 0.4–1.2 fuse-seconds. So the carrier's HUD never snaps to a snapshot's raw value:

1. it runs `fuseShown` itself, at the rate its own screen judged;
2. on each snapshot it computes what the host's fuse is *now*: `hostNow = s.fuse − s.rate × max(0, time − s.t)`, with
   `time` its own match clock (synced to the host's within 0.2 s by netmatch's clock messages);
3. if `fuseShown > hostNow + 0.1 s`, it sets `fuseShown = hostNow` at once (the ring jumps forward: less time);
4. if `fuseShown < hostNow − 0.1 s`, it gives time back by at most **0.2 s per second** (the ring never visibly
   rewinds).

The two run at the same rate except for the one-way delay before the host hears of a rate change (40–125 ms, so at
most about 0.25 fuse-seconds per change). The Carp Blast is the host's (§7.5), so the ring is never long by more than
that.

Carp Shots use the owner's kit records, `netRec(a, 'karp', data)`, ghosted by `KIT_GHOSTS.karp`, on the owner's
timeline:

- `[0, gid, x, y, z, vx, vy, vz, c]`: launch;
- `[1, gid, x, y, z]`: landed here (the ghost snaps there and swells from now);
- `[2, gid, x, y, z, c]`: the blast at x, y, z with charge c. Every screen applies it to its own players (§2.5);
- `[3, gid, dmg]`, **recorded by the victim's owner on the victim** (`netRec(victim, 'karp', …)`): this player took
  `dmg` from shot `gid`. Every other screen emits a `'hit'` with the shot's owner as the attacker, so the shooter's
  screen shows its hit marker. `karpGun` keeps every shot (real and ghost) by `gid` for 2 s after its blast so `[3]`
  can find its owner.

The charge glow rides the actor tick as 6 bits, the way the Cheer Orb's charge does (`specialNetState`).

### 7.3 Pick-up races

1. **Detection.** Each screen detects its own actors touching a `free` Bazookarp (§2.3: radius, height band, line of
   sight). A guest detects its player; the host detects its player and its bots.
2. **The claim.**
   - A guest sends `kc` (with `ts`). From then, its own kit is **locked** (no super jump, special or sub) until a `p`,
     `kd` or `u` arrives, at most **1.5 s** (`claimLockMax`). It re-sends `kc` every 0.3 s while it still touches the
     Bazookarp and has had no answer.
   - The host's own actors put their claims straight into the claim list.
3. **The hold.** For **0.25 s** after a burst (`pickHold`, host time), nothing is granted to anyone, the host's own
   player and bots included. Claims collect meanwhile. The `b` record reaches guests one way, in 40–125 ms, so the hold
   covers that plus a reaction.
4. **The grant.** When the hold is over, and every frame after it while the Bazookarp is `free`, the host checks each
   claim in the list:
   - the Bazookarp is still `free`;
   - the claimant is alive (as far as the host knows), not super jumping, and has no special running (except §2.3's
     two);
   - where the claimant is: a host actor from its position; a remote claimant from its **newest received sample**
     (the last entry of `a.net.buf`), or any sample it sent in the last 0.4 s. Never from the playback-time position,
     which runs 100–300 ms behind, and in which a swimmer at 11.8 m/s is 1.2–3.5 m away from where it really is;
   - that position must be within `pickR + 0.5 m` horizontally (1.8 m), in §2.3's height band.

   Of the valid claims, the one nearest the Bazookarp's centre wins. Before applying it, the host keeps a pre-grant
   snapshot (`touched`, `lastCarrier`, the overtime state and window, the resting spot). It records `p` at once. A
   claim that is not valid while the Bazookarp stays free gets `kd`.
5. **Everyone else.** All screens attach the Bazookarp and set `a.carry` on that player when `p` arrives, and drop its
   own Bubble Guard (§2.3). The winner's client starts the fuse HUD and the restrictions. Every other claimant's lock
   ends on that `p`.
6. **A grant that arrives too late.** If the claimant's player died on its own screen after it claimed, its screen
   answers the `p` with `kx` and does not take the carry. The host then restores the pre-grant snapshot: the Bazookarp
   is `free` again at the same spot (no re-form: nothing was dropped), and records `['u', q, nid, x, y, z]`; every
   screen detaches it. `touched`, the last carrier, S38 and S39 are untouched, so that player's death is not a
   carrier's loss. Because the guest's death record rides the timeline while `kx` is sent at once, either can reach the
   host first: on a remote holder's death within 1.5 s of its grant, the host waits up to 0.4 s for a `kx` before it
   applies §2.6.
7. **The overtime window's close.** A claim that left the guest before an S39b window closed still counts: when the
   window reaches 0, the host waits **0.4 s** (`claimAge`) before it ends the match, and during that time accepts only
   claims whose `ts + peer.off` is before the close. A claim granted then keeps overtime going. The HUD shows 0 during
   the wait.

**The bias that is left.** A guest's grant reaches it one round trip after its claim (80–250 ms). Its kit stays locked
until then, so it cannot start a special in the gap. The hold means a host bot can no longer win just by hearing of the
burst first. `net-karp` measures the grab-win share of a guest against a host bot (§10.2).

### 7.4 Shell hits

The shell is an objective target in `G.objTargets` on every screen.

- A local (non-ghost) hit on a **guest** is filtered (× 0.5 for specials, the 220 cap) and added to a pending sum for
  its attacker. On its next outgoing tick (every 50 ms) the guest puts all its pending sums in `msg.kh` and clears
  them. The guest's copy flashes at once, but its meter only follows the host's snapshots.
- The **host** applies its own hits at once, and a guest's `kh` sums on arrival, in arrival order. `lastHit[team]` is
  the last attacker applied for that team. The host alone decides the burst.
- Burst splats are applied on each victim's owner's screen, against its own copy, from the `b` record's centre (the
  same pattern as Surf N' Turf rings).

### 7.5 The carrier's shots, plants and explosions

- **Carp Shots.**
  - The shooter's screen flies the shot and decides where it lands (`[1]`) and when it blows (`[2]`, 0.45 s later).
    Every other screen's ghost lands where `[1]` says and swells from then.
  - When `[2]` plays on a screen (the shooter's own: at once; the others: on the shooter's timeline), that screen
    applies the blast to **its own players only**, by §2.5's path (the Surf N' Turf pattern, not `applyHit`, which
    drops a remote attacker's hits). The victim's owner records `[3]`, which gives the shooter its hit marker; the
    victim's `splatted` record gives the kill credit.
  - Enemy deployables are hit on the shooter's screen, as every blast hits them. The knockback is the shooter's own
    movement.
  - Why: the swell is the player's chance to step out. Judged on the shooter's lagging view, a victim who had stepped
    out 0.2 s earlier on their own screen would still be splatted.
- **Plants and knockouts.** For its own carriers, the host tests the weir and Gate triggers (§2.1 S33, §2.8: radius
  and height band) every frame. For a **remote** carrier it tests them only at the real samples that carrier sent, as
  they play (§3.4): never at the drawn position, whose extrapolation could put a carrier inside a 1.7 m Gate it never
  entered. It records `w` or `e`. The carrier's screen releases on hearing it (about one network trip, 40–125 ms after
  the host saw it; the Bazookarp snaps to the weir).
- **The fuse and a remote carrier.** The host burns the fuse at the rate of the carrier's newest `kr`. When it reaches
  0 for a remote carrier, the host waits for that carrier's timeline to catch up (that peer's playback delay, at most
  0.3 s) before it records `x`. If a death record for that carrier plays first, the carrier was splatted (or fell)
  before the fuse ran out on its own screen. Then §2.6's splat or fall row applies and there is no Carp Blast. For the
  host's own player and bots, it is at once.
- **Carp Blast.** Its centre is the carrier's position (a remote carrier: its newest real sample when the hold ends);
  `own` is the half the carrier's own screen last reported in `kr`. On `x`, the carrier's own screen splats its
  carrier wherever it now is, and every screen splats its own players of the carrier's team within 4.5 m of the centre,
  with a clear line, cause `karp-fuse`. The host paints the enemy ink as its own splats, so it replicates like any
  paint. The drop spot's half is the same `own` (§2.7).

### 7.6 Late join, host migration, a carrier who disconnects

- **Late join.** Matches lock the room (`tr.lock(!practice)`), so nobody joins a running Bazookarp match. Practice is
  Turf War only. The 1 Hz full state (`S`) is enough to rebuild the mode if that ever changes, and it is what
  migration needs anyway.
- **Host migration.** `netmatch.onLeave(id, hostChanged)` today removes or adopts the leaver's actors *first* and
  only then sets `match.follower = false`. On a humans-only stage where the host was carrying, the new host's engine
  therefore receives `actor:removed` while still a follower and ignores it. It then becomes host with `holder`
  pointing at a removed actor. Separately, the old host's queued **rule** records disagree between screens: the new
  host ignores them once it is no longer a follower (as `tower.js` `netEvent` does), while the other guests apply them,
  so screens disagree about a phase or a plant in the old host's last 100–300 ms. The new order, on every client, when
  `hostChanged`:
  1. **Flush the departed host's queued rule records only:** the `'tw'` (Tower Command), `'z'` (Zone Control) and
     `'ks'` (Bazookarp snapshots) events still in `peers.get(id).events` go through `_play` at once, in order, and
     leave the queue. Every client does this, and they all received the same stream before the leave notice because
     the relay keeps order. **Everything else stays queued** and plays out on that peer's clock as it does today (the
     departed peer stays in `peers`, and its playback clock keeps running): paint, kit ghost records, special ghosts,
     forwarded `'ev'` events. So an old-host bot's Carp Shot that is in the air still swells for 0.45 s on every
     screen. (Bazookarp's discrete records were sent at once and were never queued.)
  2. The new host sets `match.follower = false` (and the Bazookarp engine's), **before** the leaver's actors are
     removed or adopted. A carrier's `actor:removed` is then handled by the new host's engine as `left`.
  3. The existing loop removes (on a humans-only stage) or adopts the leaver's actors.
  4. The new host calls `match.karp.onHostChange()`:
     - if the holder is no longer in `match.actors`, or is dead, §2.6 applies as `left` at its last known position
       (its newest real sample);
     - the timers (re-form, reset flight, hold, overtime window, fuse) carry on from the last `S` plus the records
       since;
     - a carrier it just adopted as a bot starts with `mark` unset (§3.3) and its half and zone read on its first
       frame;
     - it resets the continuity clamp's baseline at its next reading;
     - it sends a full `S` at once, and every record after it gets a `q` above the old host's.

     Claims in flight are lost; claimants re-send every 0.3 s, to the new host.
  5. A guest that is carrying re-sends `kf` and `kr` to the new host.

  **Adopted actors' queued Carp Shots.** netmatch's `'k'` case skips a record whose actor is local (`!a.remote`). After
  adoption, the departed host's queued `karp` records for a bot the new host now owns would be dropped on the new host,
  and its own players would never be judged against that shot. So for kind `karp`, the case plays a record whenever its
  sender (`from`) is not this client, even if the actor is now local.

  Steps 1–3 change shared code. The narrowed flush in step 1 also applies to Tower Command and Zone Control, where it
  fixes the same disagreement without collapsing their timed effects. WP2 runs `net-tower` and the zones net test after
  it and notes it in `docs/NET.md`.
- **A carrier disconnects** (a stage with bots): the host adopts the actor as a bot (`_adopt`). `a.carry` stays, and
  the new `BotBrain` carries on with the carrier's hooks (§8.7). The fuse keeps burning, at the rate the host's own
  judgement now gives (it owns the actor, with `mark` unset as above). Nothing is dropped.
- **A carrier disconnects on a humans-only stage** (Cargo, `noBots`): the actor is removed. The engine treats it as a
  splat at its last real sample (`left`): a drop, or the Pond if its newest report said it was in its own free zone.
  If the carrier was the host, steps 2–4 make the new host do this. In overtime, a losing-team carrier leaving ends it
  (S39c).

### 7.7 The two-client test

See §10.2.

---

## 8. Bots

All of this lives in `src/game/botsKarp.js`, wired by the `bots.js` hooks (§8.7). There are no wall-hacks: bots know
only what `teamKnown` / `revealedTo` tell them. The carrier's marker is a reveal (S30), and the wake glow is visible
only with line of sight (§8.6).

### 8.1 The team plan (`karpPlan()`, re-dealt 2×/s and on every event)

Per team, by the situation:

| situation | roles (4 bots; humans on the team count as filling the role nearest them) |
|---|---|
| shell up (shielded) | 3 **breakers** (shoot the shell), 1 **perch** (a charger or the longest range) or a 4th breaker. One breaker is the designated **grabber**: the one nearest the shell, not mid-special, hp ≥ 60. |
| free | the grabber (and anyone within 6 m of it) makes for it; the rest **fight** round it |
| we carry | the **carrier**; 2 **escorts** (`lead`: 8–14 m ahead on the carrier's route, inking it; `flank`: 3–8 m beside it, on the side the known threat is); 1 **anchor** (stays within 15 m of the carrier so respawning teammates can jump to the carrier or anchor, and fights) |
| they carry | 2 **interceptors** (at the carrier while it is known; else to its last known position and along its likely route); 1 **keeper** (holds our standing weir nearest the enemy carrier's route, or our Gate once it has risen, §8.5); 1 **perch** or a third interceptor |
| re-forming or resetting | everyone repositions: the grabber and two breakers to 6–8 m from the resting spot, outside the burst radius |

### 8.2 Breakers and the burst

- **Range.** A breaker stands **5.5–9 m** from the shell's centre (outside the 4.5 m burst, 1 m of margin), with a
  line of sight, and strafes.
- **Melee mains** (roller, brush, blade, mitts) cannot hit the shell from that ring. They break from close in while
  the other team's side of the meter is below 50 %, and above that they move out to the 5.5–9 m ring and guard it
  (they fight whoever comes in). "Close in" is never inside touch range: touch reaches the shell's radius + the
  player's 0.38 m, which is 1.98 m at rest and 2.68 m at full swell. So a melee breaker stands at
  `max(2.5, r(m) + 0.38 + 0.5)` m from the centre: 2.5 m while |m| is under about 70 % of hp, **at least 2.9 m** above
  that.
- **Danger.** When the *other* team's side of the meter is ≥ 70 %, every bot of ours keeps ≥ 5.5 m from the shell
  (a botSpecials danger area). Only a bot that can fill our side faster stays to shoot from range.
- **Bursting it.** When *our* side reaches ≥ 85 %, the grabber moves to **3.0–3.2 m** from the centre, just outside
  touch range at full swell (2.68 m), to grab right after the burst (and the 0.25 s hold): 1.7–1.9 m to cover to the
  1.3 m pick-up radius, 0.3 s at a run. The burst only splats the other team.
- **Touch.** Bots never touch the shell: path costs on nodes within the shell's current radius + 0.6 m, and no stand
  spot inside radius + 0.38 + 0.3 m.

### 8.3 When a bot picks it up

The grabber always picks it up when it can. Exceptions:

- a human teammate is within 3 m and closer;
- the bot is mid-special (its own Bubble Guard does not count: the pick-up ends it);
- hp < 40 with a known enemy within 10 m: it shoots that enemy first.

### 8.4 The carrier's job

The carrier runs inside the normal `BotBrain.update`. Perception, the danger model (`sp.tick`), `_steer`, `_unstick`,
`_backOnNav` and `_tail` all still run for it. The karp hooks (§8.7) choose only its goal and route, its mode, and its
trigger and aim.

**Routes.**

- When the target changes (our standing weirs, then the Gate), compute up to 3 candidate routes to the target on
  `G.nav` (bots walk the nav graph; the field's extra hop and gap edges are for scoring, and a bot never needs them):
  - avoid (the `avoid` mask of `nav.path`): own free-zone nodes, both spawn zones, `carrierBlock` nodes and nodes
    within the shell's radius + 0.6 m;
  - **no climb edges** (`noClimb = true`): a carrier cannot ink a wall, and checker #4 guarantees a no-climb route
    for every leg on every stage;
  - start from the stage's `routes` hints when given, else k-disjoint shortest paths, as the checker finds them;
  - with two weirs, each weir is its own target, and the candidates cover both.
- Pick the route with the lowest cost: length + 6 m per known enemy within 10 m of its next 25 m + 0.3 × the metres of
  enemy ink on its next 20 m, plus the danger costs (`sp.cost()`), with 8 m of hysteresis. Re-pick every 1.5 s or
  when the threat changes.
- The route is walked through `_pathTo`, which is made carrier-aware (§8.7): every one of its 14 call sites, including
  the internal re-plans (unstick, goal refresh), plans with the carrier's avoid mask, its cost array and `noClimb`, so
  no re-plan ever drops them.

**Never retreat.** On its own half, the carrier's cost array forbids nodes with `P < mark − 6 m` (cost `Infinity` via
the avoid mask), so the bot never triggers the ×3. A bot that picks it up deep on its own half heads forward at once.
If those masks leave **no** path (a pick-up in a dead end, a route closed by lava), the bot plans again without the
retreat mask and accepts a short ×3 rather than standing still; `karp-match` counts these (`carrierRetreatFallback`).
A carrier never enters the `refill` mode (its shots cost nothing) or the `retreat` mode (S10).

**Form.**

- Swim through our ink when no enemy is known within 12 m: this hides the marker (S31), and the bot knows it.
- Kid form to charge and fire.
- Never squid in enemy ink: walk, or use the knockback push.

**Shooting:**

| case | what the bot does |
|---|---|
| a known enemy at 6–22 m | charge (full if none is within 6 m; else Burst); aim with the arc solver (from the 1.4 m muzzle) at the enemy's known position, lobbing over cover when there is no line of sight |
| a known enemy within 6 m | a Splash at its feet, then backstep (the 0.45 s swell); the escorts take close fights |
| enemy ink on the next 10 m of route, no enemy known within 15 m | full-charge shots onto the route 12–18 m ahead (big ink, so it can swim) |
| stuck in enemy ink with a known enemy within 10 m, or the fuse < 6 s and the target ≤ 12 m away | Splash shots fired backwards (aim 180° from travel, level) as fast as allowed: the knockback push (hard and normal only) |
| a known enemy Waddle Bomb or Tide Torpedo coming at it within 8 m (the carrier gate skips `_threatCtl`, which would shoot it with the main weapon) | a Splash at it: the blast hits enemy devices on the shooter's screen |
| a weir or the Gate within 4 m | walk in; no shots |

**Fuse.** If the fuse cannot reach the target at the current pace, the bot heads for the nearest enemy-half point
2 m past the halfway line, so a blast drops the Bazookarp forward instead of resetting it.

### 8.5 Defenders

- **Keeper.** Holds a **hold spot**: a nav node 4–9 m in front of the defended weir or Gate on the attackers'
  approach, in cover (cover map), with line of sight to the approach. With two weirs, it holds the one on the enemy
  carrier's chosen route (or, with the carrier unknown, the one nearer its last known position). It inks the approach
  in our ink: an enemy carrier cannot swim there and is slowed to 1.52 m/s. There are 2 keepers when either:
  - the enemy carrier is within 25 m (by the field) of our open Gate;
  - the enemy carrier's count is within 10 of its weir's.
- **Interceptors.** Path at the known carrier, approaching from outside its Splash range (6 m), and focus it:
  splatting the carrier is worth more than any other target (a target bias of +40). When the carrier is hidden,
  they go to its last known position, then along the route the plan expects it to take (the same route costs, from
  the enemy's view).
- **Perches.** Chargers hold a sightline over the enemy carrier's likely route.

### 8.6 Free zones, the fuse, dangers, sight, specials, super jumps

- **Free zones.** Only carriers care: own free zones are forbidden in the carrier's routes. Others ignore them.
- **Dangers** (`botSpecials.js`). A landed Carp Shot is the most common danger in this mode, and bots must step out
  of it (COMMON rule 6). Three danger areas are added, built from what a player could see. They are read from
  `G.karpGun`'s shot list, ghosts included, never through walls:
  - **An enemy Carp Shot.** In flight: a disc at its predicted landing point, the blast radius + 0.6 m for its charge
    (2.4–4.6 m), `tIn` = the flight left + 0.45 s, `vis: 'near'` (a projectile seen coming). Landed: a disc at the
    landing point with the same radius, `tIn` = the swell left (≤ 0.45 s), lethal 2 for a Big Burst and 1 otherwise,
    `los: true` (a wall is cover), `vis: 'big'`. The escape response treats it like an armed Splat Bomb.
  - **Our own carrier in its last 3 s of fuse.** A disc of 4.5 + 1 m on the carrier, for its teammates only (the carp
    shakes and hisses: `vis: 'actor'`).
  - **The shell** when the other team's side of the meter is ≥ 70 %: a disc of 5.5 m (`vis: 'big'`).
- **Sight** (`botSight.js`). A submerged enemy carrier is noticed by its wake glow with a clear line out to **20 m**
  (`SIGHT.karpWakeR`), in place of a swimmer's 9 m ripples (`SIGHT.swimR`). Never through walls.
- **Specials:**
  - escorts fire specials to clear the carrier's route when the carrier is threatened;
  - interceptors fire them at the known carrier;
  - breakers use bomb-type specials (barrages, Cheer Orb, Vortex Strike) on the shell when our side ≥ 40 %;
  - a Bubble Guard holder escorting our carrier shares it with the carrier when the carrier is threatened (§2.9).
- **Super jump.** A respawned bot jumps to our carrier (or the anchor) when the carrier is ≥ 35 m away and alive.

### 8.7 Hooks in `bots.js`

In `BotBrain.update`, **after** perception (`_perceive`, line ~711) and the danger model (`this.sp.tick(dt)`, line
718). There is no early return for a carrier: perception, the danger model, `_steer`, `_unstick`, `_backOnNav`, the
danger escape and `_tail` all run for it. But a carrier's trigger means "charge a Carp Shot", and between perception and
`_tail` many paths write the trigger, the sub or the climb today: the refill and retreat entry (lines 732–746); the kit
hooks `BK.fight`, `BK.tactics`, `BK.paint` and `BK.paintAim` (868–918, 970–979); `_fightSub`, `_paintSub` and
`_memBombAim`; `_shieldFight`; `_threatCtl` (shoots Waddles and Torpedoes); `_canopyCtl`; the pods' `bot` (inks pods);
and `_climb` (inks the wall column with the main weapon, 1050–1053). `it.fire` is assigned in 74 places. So the
carrier gets a **gate**, not a single substitution:

1. **The weapon stand-in.** At the top of `update`, `const w = a.carry ? KARP_W : a.weapon;` (line 731 reads
   `a.weapon` today). `KARP_W` is a frozen descriptor `{ kind: 'karp', range: 20, … }`: not in `MELEE`, and
   `MAIN_KITS.karp` does not exist, so `BK` is undefined and every kit bot hook is skipped by itself. `_range()`
   returns 20 for a carrier.
2. **The plan:** `const kp = zp || tp ? null : karpPlan(); if (kp) karpSync(this, kp);` beside `towerPlan()` /
   `_towerSync`.
3. **Mode selection:** with `kp`, `mode = this.target && karpEngage(this, kp) ? 'fight' : 'paint'`, as the tower's.
   For a carrier, the refill and retreat blocks are skipped (`if (!a.carry)` round lines 732–746).
4. **The navigation goal:** in the `paint` branch, `else if (kp) karpGoal(this, kp)`. For the carrier this is §8.4's
   route. For the other roles it is their role's spot. In the `fight` branch, `kp && karpFightNav(this, kp)`: the
   carrier keeps walking its route while it fights, and interceptors chase.
5. **Steering, `_unstick`, `_backOnNav`:** unchanged; they run for the carrier too.
6. **The actions gate.** Right after `it.fire = false; it.sub = false; …` (line 799):
   `if (a.carry) { karpCarrierAct(this, kp, { dt, it, move, enemyVisible }); } else { …today's actions block… }`.
   `karpCarrierAct` alone sets `it.fire` (the Carp Shot's charge and release), `wantYaw` / `wantPitch` (the arc aim)
   and `aimDist`, by §8.4's table, for both the fight and the paint branch. It never sets `it.sub` or `it.special`.
   The gate also skips, for a carrier: the running-specials block (line 1037), `_threatCtl` and `_canopyCtl`
   (1039–1042; §8.4 shoots an incoming Waddle or Torpedo with a Splash instead), the pods' `bot` (1044), the tower
   rider block, and `_climb` (1050–1052). The danger escape (1054) and `_tail` (1058) run.
7. **A last guard** before `_tail`: `if (a.carry) { it.sub = false; it.special = false; }`, so a hook added later can
   never make a carrier bonk.
8. **A carrier-aware `_pathTo`.** `_pathTo(pos, maxUp)` (lines 2912–2928) has no avoid or cost argument and is called
   from 14 places, some of them internal re-plans (`_unstick`, the goal refresh, line 2607). It becomes:
   ```js
   const K = this.a.carry ? karpPathArgs(this) : null;          // { avoid, cost, noClimb: true } or null
   let p = nav.path(s, g, team, undefined, K ? true : rule, K?.avoid ?? null, K ? K.cost : this.sp.cost());
   ```
   `karpPathArgs` keeps one `Float32Array` per carrier, refilled at most twice a second: `sp.cost()` (the dangers) plus
   the route costs of §8.4; and one avoid mask: own free zones, both spawn zones, `carrierBlock`, the shell's
   radius + 0.6 m, and (on the own half) `P < mark − 6 m`. If no path comes back, `_pathTo` tries once more without
   the retreat part of the mask (§8.4's fallback). Today's climb retry (`if (!p && rule === true …)`, which allows a
   climb when there is no other way) is skipped for a carrier. `nav.path`'s `team` argument blocks only the enemy spawn zone
   (nav.js:294), which is why the avoid mask carries both spawns.
9. **Respawn:** `karpJump(this, kp)` beside `_towerJump`.
10. **Also:** the target bias (+40 for the enemy carrier); the special choice; the shell's `shields()` descriptor, so
    the existing flank logic treats it as a shield.

That is about 80 lines in `bots.js`; the rest is in `botsKarp.js`. WP3 proves the gate with carriers holding the
mitts, blade, brolly, bow, roller, a charger and the twins (§11): none of them may fire its own weapon, throw a sub,
start a special, climb, leap or dodge-roll while carrying.

### 8.8 Difficulty

| | easy (Chill) | normal (Fresh) | hard (Fierce) |
|---|---|---|---|
| carrier shots | always full charge, aimed at the known position, no lob over cover | full / Burst by range, lobs over cover | as normal, plus leading moving targets |
| knockback push | never | stuck in enemy ink only | also to dodge (a Splash backwards out of a focus) |
| route re-pick | every 3 s | every 1.5 s | every 1 s, plus on each new threat |
| breakers | ignore the danger meter | keep out at ≥ 70 % | keep out at ≥ 60 %, and time the grab |
| interceptors | 1 | 2 | 2, approaching from two sides |
| grab delay after the burst (on top of the 0.25 s hold) | 0.6 s | 0.2 s | 0 s |

The `DIFFICULTY` aim and reaction numbers apply on top, as everywhere, and so does botSpecials' miss chance for fast
projectiles (easy 35 %, normal 18 %, hard 6 %).

---

## 9. The per-stage layout brief

Every stage (the twelve, Cargo, and the three new stages) gets a Bazookarp layout. The user: "Due to this mode being
stage wide rather than section wide, feel free to do vast stage redesigns to make all stages playable." The research's
lessons are the requirements.

### 9.1 What every stage's layout must satisfy

Numbers are Carp Field metres (walking, §3). Walking time is at the carrier's 4.8 m/s.

| # | requirement | number | why (the research) |
|---|---|---|---|
| 1 | **Distance to the Gate matters most.** L = Pond → Gate on the shortest carrier route. | **55–85 m** (11.5–18 s walking, 5.8–9 s swimming); `\|L_A − L_B\| ≤ 2 %` | one push must not win in seconds; a push must still be able to succeed inside 60 s (≥ 3.3× the walk) |
| 2 | **Weirs closer to the middle.** One weir per side, or two on different routes. | each at **40–55 %** of L (count 60–45). With two: their counts within **±2** of each other, ≥ **12 m** apart, and neither weir's route 1 from the Pond passing within 4 m of the other weir (checker #5). The band and the ±2 rule are this spec's own numbers (below the table). | the user: "one or two goals closer to the middle"; planting either lowers both (S33), so they are alternatives, one per route |
| 3 | **Weir → Gate.** | ≥ 45 % of L and ≥ 25 m. This follows from #1 and #2; the checker reports it. | a plant must not hand over the knockout: re-pop the shell, then a real carry |
| 4 | **Two routes to each checkpoint and to the Gate.** Walkable by a slow carrier (stairs, ramps and hops, not climbs); squid-climb shortcuts are extras. | checker #5: **every** weir (one or two) has route 1 and route 2 from the Pond, the second ≤ 1.6× the first and disjoint from it (2.5 m apart except within 6 m of either end); every weir → Gate leg has two such routes. With two weirs, their routes 1 are also disjoint from each other. | the research: "at least two workable routes to each checkpoint"; a single corridor makes a good defence unbeatable. Revision 2 let two weirs stand in for the two routes, so each weir could sit behind one corridor; that weakened the research's rule, and is gone |
| 5 | **No hidden shortcuts into a base.** | 2–5 entrances into the Gate's 15 m ring, each in sight of the spawn deck (hops and gaps count, and so do mover rides and carp-open pipe exits that end in the ring); no climb saving > 20 %; no drop > 2.5 m into the ring; no connection the carrier graph misses (squid-only gaps, walls over 5.5 m, drops over 3.4 m, hops just over 1.8 m, gaps just over 3.0 m) with a gain > 10 m; every hop and gap edge proved physically (checker #16). Each find is closed, or waived by the lead in the note. | Nintendo kept closing Inkrail, ledge and drop routes into bases |
| 6 | **Deep spawns.** | pad → Gate 12–20 m; ≥ 3 ways off the spawn deck; an apron with ≥ 2 cover blocks between the deck and the Gate (checker #13) | defenders need room to re-form |
| 7 | **No unreachable high ground**, or a Carp-Free Zone over **all** of it. Every stage gets a free zone over each spawn deck (beyond the barrier); others where the checker's plateau test says so. | checker #9: every node of a flagged plateau inside the zone | the carrier must not hide high up; Splatoon 3 patched free-zone gaps on Eeltail Alley and Brinewater Springs |
| 8 | **The Gate in front of the spawn or a level below** it, in the defenders' view, in the ±40° cone of the pad → Pond line. | `y ≤ pad.y + 0.2`; line of sight from the deck | Nintendo moved goals back and down a level |
| 9 | **Checkpoints between the centre and the Gate**, on a spot both teams fight over (raised or landmark), reachable both ways, with room round them. | each weir's count is the lowest within 3 m of it; no solid geometry within 3 m of its centre (the shell swells to 2.3 m); its centre seen from both teams' approaches (checker #15) | the strategic point; a shell pressed against a wall can only be shot from one side (Splatoon 1, Ver. 2.2.0) |
| 10 | **The Pond at the exact centre**, on walkable floor, shootable from all round, with fighting room outside the burst radius. | checker #14: ≥ 70 % of the 4.5–10 m ring is floor; the shell seen from ≥ 6 of 8 directions | both teams must reach and shoot it fairly |
| 11 | **Retreat sanity.** No route on a team's own half dips > 6 m in progress, or a `noRetreat` covers it. A `noRetreat` never comes within 3 m of an own-half plateau or a Carp-Free Zone. | checker #10, #9 | the "Don't retreat!" while advancing bug, without making stalling spots (Inkblot's fix) |
| 12 | **Water and void edges.** Where a carrier can fall, the last-footing rule applies. No fall spot drops the Bazookarp onto unreachable ground. The Bazookarp never rests on a narrow pier (the drop spot prefers wide floor, §2.7); a builder may add `noRest` where it still could. | checker #11 | Hammerhead Bridge's support-beam exploit (Splatoon 1, Ver. 2.2.0) |
| 13 | **Every other mode unchanged.** Turf War, Zone Control and Tower Command builds byte-identical; Boss Battle unaffected; the stage-card thumbnails unchanged. | `hasVariant` false for them | |

**About #2's numbers.** The research describes Splatoon 3's checkpoints in several places: "one checkpoint right next
to the start" (Hammerhead Bridge), "in that raised area and at the base entrance" (Mahi-Mahi Resort), "in front of the
bridge and in the middle of each team's side" (Eeltail Alley). It gives no band. The 40–55 % band is this spec's
reading of the user's "closer to the middle of the stage", kept because a weir much nearer the Pond gates nothing (a
carrier walks past it in the first seconds), and a weir much nearer the Gate leaves too little between the plant and
the knockout (#3: ≥ 45 % of L and ≥ 25 m; the research: "Be wary of stages or versions where the goal is close to
the center"). The
±2 rule is also this spec's own: two weirs are alternatives, and a plant sets the count to the planted weir's, so
unequal counts would make one weir the only sensible target and collapse the second route the research asks for. A
stage that wants Mahi-Mahi's two depths can ask the lead for a waiver with bot-match evidence; none is expected.

**The bot-match targets.** From ≥ 16 all-bot matches at normal difficulty, run on the Mac mini with `karp-match.cjs`:

| target | value |
|---|---|
| knockout rate | 20–60 % |
| early knockouts | no knockout before 1:15 of match time in more than 1 of 16; median knockout time ≥ 2:30 |
| weir planted at least once | ≥ 75 % of matches |
| side balance | 16 matches: \|A − B\| ≤ 4; the full set 40–60 % |
| time to the first pop | 6–12 s (median) |
| Carp Blasts | ≤ 1.5 per match |
| resets to the Pond | ≤ 2 per match |
| own-free-zone time | ≤ 3 s per match (more means a zone traps the routes) |
| stuck | turf-standard ≤ 1 %; carrier stuck > 5 s: 0 |
| overtime | reported by start reason (S38a / S38b / S38c) and by how it ended. **The losing team wins ≥ 15 % of the overtimes started by S38a or S38c**, across the normal and hard sets together. With fewer than 6 such overtimes, report only. Below 15 %, lower `shell.reformHp` first, never the user's 10 s. |
| shared Bubble Guard | the share of knockouts that happen within 8 s of a teammate's Bubble Guard reaching the carrier. Report; above 25 % is a flag to the lead (Q13). |
| field integrity | continuity-clamp rejections (`karp.stats.clamped`): 0 in every offline match (a rejection offline means a field or reading bug) |
| bot carriers | `carrierRetreatFallback` (a carrier that had to accept a ×3 because no forward path existed): report; more than 1 per match is a flag to the stage builder |

### 9.2 What a stage layout builder delivers

1. **Data.** `BAZOOKARP_DEFS.<id>` in `src/world/bazookarp-data.js`: the Pond, the weir(s), the Gate, free zones with
   a sign at every entrance, and optional `routes`, `noRetreat`, `carrierBlock`, `noRest`, `hopVeto`.
2. **Mode-only pieces and redesigns** in the stage's own files, tagged `onlyIn: 'bazookarp'` or `notIn`. Fully
   dressed: the Halyard bar, cover every 6–10 m (cover map ≥ 90 % on the variant), varied heights, a reason for every
   piece. No roofs or ledges a kid can't read: the 1.8 m climb rule, and `roof` on everything unreachable.
3. **The lightmap variant** `assets/lightmaps/<id>.bazookarp.{png,json}`, baked on the Mac mini; `size-budget.js`
   passes; check-maps ok for `<id>.bazookarp`; climb-audit clean.
4. **The checker clean**: `RESULT ok`, plus the checker's JSON and pictures in
   `tools/botlab/jobs/batch5/karp-<id>/out/`.
5. **Bot matches.** A JOB file for the Mac mini (16 × `karp-match.cjs`, summarised by the aggregator) and its
   results, inside the targets in §9.1.
6. **Pictures** (JPEG < 300 KB), looked at before claiming anything:
   - the checker's set;
   - a player's view from each spawn exit toward its Gate;
   - from the Pond toward each weir;
   - an aerial of each redesigned area, before and after.
7. **A note** `tools/botlab/jobs/batch5/karp-<id>/NOTE.md`:
   - what was redesigned and why;
   - the numbers: L, each weir's % and count, weir → Gate, routes per leg (for both weirs where there are two),
     carry times, entrances, plateaus, free zones;
   - every `noRetreat`, `carrierBlock` and `noRest` polygon, with a picture and the reason;
   - every connection checker #7 found, and how each was closed;
   - every `hopVeto` entry checker #16 printed, with its picture, and every zone entrance with its sign (#9);
   - before and after pictures;
   - any waiver asked of the lead.
8. **Other modes untouched**: the regressions (`stage-audit`, `tower-len` / `tower-check` for the stage, a zones
   match, the thumbnails) still pass.

### 9.3 Every stage: where it starts and what it needs

The stretch notes' spots converted to `LAYOUT.bazookarp`'s convention (x and z negated, so Alpha's attack on Bravo's
half). "Shortest" is the notes' nav (or walking-line) length from mid to the goal spot. "%" is the notes' weir
position along it.

| stage | notes' weir → here (x, z, y) | notes' Gate → here | weir → Gate (straight) | shortest | weir % | what it needs |
|---|---|---|---|---|---|---|
| tidewater | (0, 24.3, 1.2), the Palm House terrace | (−5.0, 47.5, −0.2) | 23.7 | ≈ 42 (walking line) | ≈ 58 | **L too short.** Lengthen the base front: the Gate a level below the Town Hall's balcony, reached round the fountain. Weir on the terrace: keep it if it lands at 40–55 % of the new L. A second weir only if the two flanks are ≥ 12 m apart at that count. |
| halyard (WP4b reference) | (−10, 46.4, 1.3), the chandlery deck | (0, 52.5, 0) | 11.7 | ≈ 48 (walking line) | ≈ 95 | **L too short, weir far too late.** Weir forward to the Long Pier / boatyard junction (≈ z 26–30); or two weirs, one there and one in the boatyard lane, at the same count. The Gate approach lengthened (round the slip's head, down a level). The centre's nav node sits on the ferry deck and the route climbs its stairs: clear or move the centre piece for the Pond (`notIn`). Flag or free-zone the travel-lift leg tops (5.45 m, not `roof`). The piers are narrow: run checker #11's narrow-walkway splat. |
| kelpline | (24.32, 34.73, 2.4), the transfer platform | (28.03, 51.18, 0) | 16.9 | 58.6 | ≈ 72 | Weir toward mid (the side zone's base end, the lane past Block 4A); or two weirs, that lane and the opposite flank, at the same count. Gate entrances ≥ 2 and seen. The old field reading leaked 20 m here; the new one does not, but check the posts by the Gate (§3.2). |
| cargo (online, no bots) | as kelpline | as kelpline | 16.9 | as kelpline | ≈ 72 | Port Kelpline's layout hunk for hunk (as the stretch did); checker with `DEVSTAGE=1`; no bot matches (noBots), so a scripted carry walk plus a human playtest in the note. |
| saltpan | (8.25, 40.5, 1.5), the loading platform | (2.5, 53.5, 0) | 14.2 | 63.1 | ≈ 65–70 | Weir forward (the pump dyke; the mid jetty end is a narrow pier, so the weir and any resting spot stay on the dyke); keep the platform as the slice's battleground. Gate approach ≥ 25 m from the weir. |
| crossmarket | (0, 45.2, 1.2), the Butter Cross | (0, 51.8, 0) | 6.6 | 69.7 | ≈ 85 | **Weir far too late.** Weir forward to Market Street's mid block; or two weirs, Market Street's mid block and the parallel back lane, at the same count. The Cross stays the fight on the way to the Gate; the base front's rework puts the Gate ≥ 25 m beyond the weirs. |
| lockgate (WP4b reference) | (12.5, 43, 1.3), the crane staging | (2, 57.5, 0) | 17.9 | 70.4 | ≈ 64 | Closest to the bands already. Weir forward to the weigh-house yard (≈ 45–50 %); or two weirs, the weigh-house yard and the lock-side quay, at the same count. The crane staging stays the fight before the Gate. |
| terraces | (9.8, 30.45, 3.6), the lavatoio | (9.4, 44.2, 3.6) | 13.8 | 53.5 | ≈ 62 | L just short: the Gate one terrace down with a switchback approach. Weir at the lavatoio if it lands at 40–55 %. The terrace walls are thin and the old reading leaked 43 m here: run checker #7d. The terraces have **217 hops** of 1.25–1.8 m the nav graph lacks, 55 of them worth > 10 m (worst 46.2 m): checker #16 must prove them, and any that reach into a Gate's 15 m ring are entrances (#7a) to close or show. |
| nantai | (−3, 41, 2.6), Dish Knoll | (−6, 53, 1.3) | 12.4 | 60.2 | ≈ 72 | Weir forward (the first terrace by the bridge's head); the Knoll stays the battleground. The forecourt (3.8) is a free zone. 262 hops the nav graph lacks (13 worth > 10 m, worst 21.7 m): checker #16. |
| craters | (3, 43, 1.6), the regimental mound | (−3.5, 51, 0) | 10.3 | 57.5 | ≈ 81 | Weir forward (the crater's rim cut / the front trench); Gate approach lengthened. Bunker roofs (2.4): reachable and open, so the checker decides. The trench and bunker walls are thin (75 nodes leaked under the old reading): run checker #7d. **503 hops** the nav graph lacks (70 worth > 10 m, worst 24.0 m) and 2 gaps of 1.6–3.0 m worth > 10 m: the most hop-heavy stage, so #16 and #7a decide the base front. |
| calamari | (0, 39, 1.3), the fire-watch terrace | (0, 48, 0) | 9.0 | 46.7 | ≈ 80 | **L too short, weir far too late.** Rework the High Street end: the Gate on the co-op forecourt reached round the terrace. Weir at the square's south edge. Railcars: their whole corridors are never a resting spot (§2.7), and a ride whose stop lies inside a Gate's 15 m ring counts as an entrance (#7a). |
| spirhalite | (−0.4, 39.8, 1.3), the watch-post shelf | (−9.8, 49.5, 1.3) | 13.5 | 66.0 | ≈ 74 | Weir forward (the pillar islet / rope-bridge head). Watch-post floor (2.5): checker's plateau test, free zone over all of it if needed. |
| treehills | (−4, 37, 2.62), the potting deck | (5.5, 51.5, 1.3) | 17.3 | 59.7 | ≈ 65 | Weir forward (the garden stair's top / meadow edge). Hedges are `roof` for carriers (§2.9). Pods stay on; pod plots are never resting spots (§2.7). |

The pattern is clear. The Long Stages put the weir on the slice's strategic point, at 65–95 % of the way, with the goal
7–18 m behind it. The user's rule wants weirs "closer to the middle", and this spec wants ≥ 25 m from the weir to the
Gate. So, on most stages:

- weir 1 moves toward mid, to the side zone's base end or the slice's mid-side edge;
- a second weir, where a stage has two main routes ≥ 12 m apart at that count, goes on the other route at the same
  count;
- the slice's strategic point becomes the fight on the way to the Gate;
- the base front is reworked so the Gate's approach is longer and turns (one level down, one corner), without a
  straight run from the weir.

### 9.4 The three new stages (bluestone, aquarium, caldera)

Their designers own the gimmick rules (`../stages/STAGE-RULES.md` and each stage's `ENGINE.md`). §5.5 is the interface
table; this is what the Carp Field needs from each stage, and what each stage's layout must keep true.

- **bluestone (eras).** One union nav graph with era-masked edges and per-era `valid` arrays
  (`../stages/bluestone/ENGINE.md`, H7).
  - The field computes `D` and `restOk` for all three eras at load, after the era nav merge, and switches at each
    `era:done` (§3.2 step 6). Era jumps are at 1/3 and 2/3 of the 300 s regulation (100 s and 200 s played), none in
    overtime, as the bluestone engine's table gives for the 5:00 modes.
  - Each switch resets the carrier's retreat mark (§3.3), so a carrier standing still through a jump never gets ×3.
  - `D(Pond)` must stay within **±5 %** of `L` across all eras, and each weir's count within ±5. The checker builds
    each era (`ERA=1|2|3`).
  - A route that appears must not create a shortcut into a base: entrance rule #5 holds in every era.
  - The Bazookarp rests only on nodes valid in the current era and every later one (§2.7). From `era:warn` to
    `era:done` the drop spot avoids `dangerAt` nodes, and a Bazookarp resting on one is moved at `era:warn`. The Pond,
    weirs and Gates stand on ground present in all three eras (bluestone's own rule 17: nothing changes within 3 m of
    them). Bluestone's free zones are its spawn decks, which never change; any zone or polygon may carry `eras`.
- **aquarium (pipes).** The aquarium design (`../stages/aquarium/ENGINE.md`) refuses a carrier at every pipe by
  default ("Can't ride with the Bazookarp"). A leg listed in `modes.bazookarp.carp` is open to carriers; on the
  aquarium today the list is empty.
  - Only carp-open legs are field edges, with the leg's own length.
  - The checker's entrance rule counts a carp-open pipe exit inside a Gate's 15 m ring as an entrance (it must be in
    the defenders' sight); the aquarium design shuts such legs anyway.
  - A carrier rides at 0.8× speed, the fuse keeps burning, and the marker stays visible: in a pipe it is not swimming
    in ink. While riding there is no own node, so the count keeps its last value; at the exit, the continuity clamp
    allows the leg's length once (§3.4).
  - The shell burst's and the Carp Blast's instant splats skip pipe riders (`a.pipe && a.pipe.phase !== 'suck'`), as
    the aquarium design asks. This is the only exception to "instantly" (S4).
- **caldera (lava).** Lava is a fall: S25 and S26 apply, by last footing (static floor only; a rider is not footing).
  - Two field states, LOW and HIGH, precomputed at load from `G.match.lava.restMask(level)` (§5.5). The field
    switches at `lava:warn` to the level the coming move ends at. There is no rebuild mid-match (this replaces
    caldera's ENGINE.md §4.3 text, Q19). The match starts at LOW (the first rise is at 35 s).
  - Each switch resets the carrier's retreat mark (§3.3).
  - No weir, Gate or Pond on ground the lava reaches. The Bazookarp rests only where `restOk` holds for the state in
    force, which already looks ahead to the coming rest from `lava:warn` on, so it is moved before the lava arrives
    (§2.6, §2.7). At LOW, dry lava-reachable ground is a legal resting spot until the next warning.
  - Free zones may not lie on a route only the lava opens.
  - `D(Pond)` within ±5 % of `L` and weir counts within ±5 at both levels; the checker builds each (`LAVA=low|high`).

---

## 10. Tests

### 10.1 Page tests (`tools/botlab/tests/`)

Every rule group runs on **`karpbox`**: a synthetic stage defined in a shared test module (WP0), never shipped, like
`towerbox`. It is injected into `MAPS` / `MAP_LAYOUTS` before the match starts, the way `tower-match.cjs` injects
`towerbox`. Its contents:

- a flat 40 × 130 m deck with spawn decks at z = ±60;
- the Pond at the origin;
- on each half, a weir platform at z = ±28 (1.2 m, ramps both sides), and a second one on the far flank at the same
  count (used by the two-weir cases through `KARP_DEF`);
- the Gate at z = ±48 on the floor;
- a flank lane with a 3 m climbable wall;
- a water channel on each flank (for falls), crossed by a 2 m wide pier;
- a high roof plateau beside each spawn, reached only by a squid climb (the free zone's reason);
- a large Carp-Free Zone, 26 × 14 m, on Bravo's half beside the Bravo spawn deck (for the drop-outside case);
- a wall between the Pond and a test spot (line of sight for the burst);
- a 0.3 m thin wall with two nodes either side of it whose walks differ by 20 m (the field reading, and net-karp's
  stall);
- a deck 2.5 m over the floor next to one weir (pick-ups and plants from underneath);
- **a 1.5 m non-inkable ledge** on the Alpha half's flank, whose top is otherwise reached by a 14 m walk round (a hop
  edge), and **a 2.6 m gap** between two 1 m platforms over open air (a gap edge);
- a mover def (one car on a 12 m track) and one pod plot, both on the Bravo half;
- a squid-only gap (0.7 m headroom) into one Gate's ring, for the checker's self-test;
- a **test-only second field state** (`KARP_STATES=1`): state 1 removes the flank lane's nodes, switched by a test
  event, standing in for an era or a lava level.

The checker's self-test adds its deliberate faults through `KARP_SELFTEST` (§4.4), including a 1.5 m non-inkable ledge
into one Gate's ring.

Each test steps time deterministically (`dbg.freeze()` / `dbg.step`), with bots switched off, as `tower-rules.js` does.

`karp-rules.js` (`MAP=karpbox MODE=bazookarp`):

| group | checks |
|---|---|
| A. setup | the mode; `match.karp`; field built with hop and gap edges (the ledge's hop and the 2.6 m gap present); `L_A ≈ L_B`; Pond shielded at 1000 hp; counts 100 / 100; coin hidden from `state()` |
| B. shell | team hits move the meter both ways (tug-of-war); 1.5 s regrowth at 200/s; a Splat Bomb at the centre counts 180, not the device 60; a hit capped at 220; specials × 0.5 (by special id), **a Bomb Barrage's bomb × 0.5 (by its `sp` flag)** and **a Tidal Slam counted** (× 0.5); a roller's roll counts as a touch, not a hit; it blocks shots, and **a shot fired through the shell at a player standing right behind it stops on the shell and does not hurt the player**; touch: 20 every 0.5 s, shove, never below 1 hp, never off the pier's edge; burst at ±hp: enemies within 4.5 m splatted (through Bubble Guard, **and through every `invuln`: one 0.5 s after a respawn, one landing a super jump, one 0.1 s after a Tidal Slam**), one behind the wall not, friendlies not, a pipe-rider stub (`a.pipe = { phase: 'ride' }`) not, ink painted; a burst alone leaves `touched` false; a re-formed shell has 500 hp; `spheres()` lists the shell only while intact |
| C. pick-up | either team; radius 1.3; nobody for 0.25 s after the burst; refused from under the deck and through the wall; refused mid-special (Ink Jet) with the prompt; **their own Bubble Guard ends at the pick-up (`status.shield` 0 and no shield mesh), copies they had shared keep their remaining time, a shared one on them stays, and a teammate who touches the carrier gets no bubble from it**; carrier speed × 0.8 of `PLAYER` measured over 2 s (run, air, swim, squid dry, climb, enemy ink), the same with the brolly, mitts, bow and blade as with the Splattershot; `canSuperJump` false; both barriers shove; the `carrierBlock` polygon pushes a carrier out to its edge and lets others through; sub / special bonk (`sub:cantuse`); **a Mitts carrier's fire + jump is a plain jump (no leap charge, `vel.y = jumpVel`), and a twins carrier's jump while firing and moving is not a dodge roll**; **gauge cannot rise: inking, passive charge, a cheer, and 3 s inside a teammate's Drainbow that is draining a foe all leave it unchanged; an enemy Drainbow lowers it** |
| D. scoring | the count falls along a walk; capped at the weir's count when walking round it; the plant releases, sets the Bazookarp on the weir, lowers the weir, raises the Gate, re-forms the shell, count = weir count; a carrier walking under the raised weir on the floor 2.5 m below doesn't plant; **two weirs**: a plant on either lowers both, the cap is the higher count, the other team's weirs stay up; knockout at the Gate (and not from the floor under it); `best` never rises; **the hop onto the 1.5 m ledge lowers the count by the shortcut and does not trip retreat**; **the continuity clamp: a reading injected 10 m lower than possible is refused (`stats.clamped` = 1) and the next real reading is accepted**; `winning()` incl. the tie-break by `reachT` and the coin at 100 / 100 |
| E. fuse | 60 s per pick-up (fresh after a re-pick); retreat ×3 at 8 m back on the own half and back to ×1 within 3 m; nothing on the enemy half; ×3 in an own free zone, not in the enemy's; the Carp Blast splats the carrier and a teammate at 4 m (also one with spawn `invuln`) but not one at 5 m or behind the wall, and paints enemy ink at 5 m; own half → the Pond, enemy half → dropped there, own zone → the Pond |
| F. drops | a splat drops at the floor under the carrier (and, from a jump, under it); a splat on the 2 m pier drops on wide floor, not the pier; **a splat in the middle of the large Bravo zone by an Alpha carrier drops just outside it (within 1 m of its edge), on Bravo's half, never at the Pond**; a splat in either team's zone never rests inside one; the drop spot avoids spawn zones, every node within 9.7 m of a pad, roofs, the car's whole corridor (parked or not), the pod plot, `carrierBlock`, 2.8 m round a standing weir and 2.7 m round each Gate; a fall with last footing on the own half → the Pond, on the enemy half → the nearest spot on the enemy half; a splat inside an own zone → the Pond; actor removed → drop; resting in the car's path when it moves → moved, with a 0.8 s re-form; **`clear` raycasts per search < 500** (lazy) |
| G. overtime | each start condition: S38a with a splat at 14.9 s yes, at 15.0 s no; S38b; S38c with a plant at 4.9 s yes, at 5.0 s no; no overtime otherwise. Each end condition: S39a a pick-up by the winning team; S39b the 10 s window, counted from the plant for an S38c start, paused while re-forming or resetting, opened again by a losing-team plant in overtime; S39c a carrier splat, a fall and the fuse; S39d count strictly below, and an equal count not enough. The 300 s cap; untouched → coin, with no overtime. **Through `LoopWire`'s guest stub: a claim stamped 0.2 s before the window closes and arriving 0.3 s after it is granted; one stamped after the close is refused; a declined grant (`kx`) leaves `touched`, S39c and the window as they were.** |
| H. passive gauge | 3 p/s to the other team while held; to the losing team while unclaimed; none at 100 / 100; never to the carrier (the guard) |
| I. field reading | across the thin wall, the reading equals the node's own walk (not the other side's); at every valid node, \|`fieldAt` − `D`\| ≤ 0.05 m; airborne and climbing keep the last value; a node removed by the current state gives no own node |
| J. state switches | with `KARP_STATES=1`: a carrier **standing still** on its own flank across the switch to state 1 never gets ×3, its mark is reset and re-read on the next own-node frame, and its half and zone are recomputed; a carrier at ×3 retreat at the switch goes back to ×1; the host's clamp baseline resets (no rejection at the switch); a Bazookarp resting on a node state 1 removes is moved at the switch's warning event |

The other page tests:

- **`karp-loop.js`** (WP1a): the host engine and a shadow follower engine joined by `LoopWire` with a 0.1 s delay and
  a snapshot shuffled late. After every discrete record the follower's phase, holder, counts, weirs and Gates equal
  the host's; a snapshot older than the last discrete `q` is skipped; `u` (an undone grant) detaches on the follower;
  the carrier's own Bubble Guard is gone on the follower after `p`.
- **`karp-gun.js`:**
  - charge: a tap fires at 0.15 s, full at 1.2 s;
  - from the 1.4 m muzzle, ranges at level aim within ±0.5 m (7.8 / 13.2 / 20.1) and flight times within ±0.05 s
    (0.68 / 0.83 / 0.99);
  - landing ink radius; swell 0.45 s; blast radius per charge;
  - damage: Big Burst 180 within 2.4 m, partial centre ≤ 90;
  - no ink spent;
  - knockback distance per charge;
  - crossing 6 m of enemy ink: walking ≥ 3.9 s, backward Splash shots ≤ 2.2 s;
  - lands on a player and on a Drip Curtain;
  - the owner records `[0]` `[1]` `[2]` (with the centre and charge); with a stub net, a non-lethal hit on an own
    player records `[3, gid, dmg]` on the victim, and the blast does not go through `applyHit`.
- **`karp-shell-dps.js`** (WP1b): the tuning table (§2.2). Each main, each special, each barrage (all of its bombs) and
  the Tidal Slam against a lone shell for 5 s; prints per-second damage into the shell. No pass threshold; it fails
  only on an error or a weapon putting in 0.
- **`karp-field.js`** (WP0; any `MAP` with data): `L_A`, `L_B`, no NaN, the halfway line through the Pond, the hop and
  gap edge counts, and the reading sweep of checker #2. On every stage, the bounds of #2 and the count of points more
  than 1.5 m low (expected: 0 except kelpline's 5). The load-time cost per state (budget 60 ms). Weir counts in band
  only for stages with final data (WP4b on). WP4a makes it part of the regression set.
- **`hud-karp.js`** (`MAP=testbox MODE=bazookarp`):
  - badges and the Carp Line follow the state;
  - the marker: seen by both teams in kid form, hidden from the enemy (not the team) while submerged, edge pin
    likewise;
  - bottom messages on rate changes, the same frame (they are local);
  - the fuse ring's correction rule with stub snapshots (jumps forward at once, gives back ≤ 0.2 s per second);
  - the carp glyph on the special orb and the carrier's squad badge;
  - prompts at their moments;
  - call-outs per event;
  - the results screen reasons.

  Plus `hud-lead.js` with `MODE=bazookarp`, and pictures via `hud-shots.cjs` scenes.
- **`karp-bots.js`** (WP3): see WP3 in §11.
- **`eras-karp.js` and `lava-karp.js`**, once bluestone and caldera exist (their own test plans name them: bluestone
  12b, caldera step 11): a carrier standing still across every switch never gets ×3 and no field is rebuilt; L and the
  weir counts within the ±5 bands; a resting Bazookarp is moved at `era:warn` / `lava:warn` when the coming state
  removes its node; `bazookarp-check.cjs` RESULT ok in each state.
- **Regressions:**
  - `tower-rules.js`, `tower-ink.js`, the zones tests, `hud-lead.js` (all modes), `stage-audit.js`, `size-budget.js`;
  - `sfx-cues.js` with the new cues (run alone);
  - `bot-sight.js` (the carrier reveal, the wake rule) and `bot-specials.js`;
  - the systems this mode touches: the movers test, `treehills-pods.js`, `surf-movers.js`, `net-surf.cjs`, the Mitts
    and twins tests (the jump guards), the Drainbow tests, and `net-tower` plus the zones net test (the `onLeave`
    change, §7.6);
  - every other mode's world build unchanged: for each stage, Turf War, Zone Control and Tower Command keep their world
    keys and piece counts;
  - the stage-card thumbnails byte-identical (`layoutThumbSVG` over the raw layouts);
  - the menus (`loadout-picker.js`, the mode screen pictures).

### 10.2 The two-client test, `net-karp.cjs`

```
CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
NET_ARGS='map=karpbox'   URLQ='netlag=40&netjitter=20' for the latency steps
```

`karpbox` is not shipped, so the test injects it into **every** client page before the room is created or joined
(the same injection `tower-match.cjs` makes into its one page). Once WP4b lands, `map=lockgate` also works. Host A is
on Alpha and guest B on Bravo, with bots filling. The test drives the local kids and pauses bots where needed. The
migration steps run with `CLIENTS=3` (host A, guests B and C).

| step | what it shows |
|---|---|
| 1 | B's shots on the shell move the host's meter (`kh` on B's tick); the meters agree on both screens within one snapshot. B fires a fast weapon at the shell for 5 s: B sends ≤ 30 messages a second in all (expected about 20: `kh` adds none). |
| 2 | Bravo bursts it: A's local kid, standing at 3 m, is splatted on A's screen (its owner), and both screens agree |
| 3 | Pick-up race: A and B both touch the free Bazookarp right after the hold. Exactly one gets it, the same one on both screens, and the other's lock ends on `p`. |
| 4 | B swims through the Bazookarp's spot at full swim speed without stopping: the claim is granted (the newest-sample check). |
| 5 | Grab share: 10 bursts with a host bot and guest B at equal distance (3 m). Report each side's wins (no pass threshold; the lead reads it). |
| 6 | B carries: B's speed is × 0.8 on B's screen; B can't super jump; B's own Bubble Guard (started just before) is gone on both screens; the host's count falls and B's HUD shows the same count |
| 6b | **Thin-wall stall.** B swims along karpbox's 0.3 m thin wall, pressed into it; the test freezes B's outgoing ticks for 0.4 s. The host's best never drops more than 2 counts below what B's own screen reads, no plant or knockout fires, and the host's `stats.clamped` is reported. |
| 7 | B fires a Big Burst at A. A steps out during the swell on A's screen: not splatted. A stays: splatted, on A's screen. One splat each side, never two. |
| 7b | **A non-lethal Splash on A:** A loses hp on A's screen, and B's screen gets a `'hit'` event with B as the attacker (the marker, through `[3]`). |
| 8 | Guest-side rules: B's gauge rises at 3 p/s while Alpha holds it; B touching the shell loses 20 hp per 0.5 s, on B's screen |
| 9 | B retreats on its own half: `DON'T RETREAT!` shows on B's screen the same frame (local); the host's fuse rate agrees within 0.3 s |
| 9b | **The fuse ring under ×3** (`URLQ` latency on): in any 1 s window, B's shown fuse never goes up by more than 0.2 s, and at the Carp Blast B's ring shows ≤ 0.3 s |
| 10 | B plants one of the two weirs (karpbox's two-weir data): both of Bravo's weirs lowered and its Gate up, on every screen |
| 11 | Fuse: B holds it on its own half until the Carp Blast: B and a teammate at 3 m splatted; reset to the Pond on both screens |
| 12 | **Host migration mid-carry** (3 clients): A carries, then A leaves. B becomes host; on B and C, the same carrier (now a bot), fuse within 0.5 s, counts identical; the match finishes |
| 13 | **A plant in the old host's last moment** (3 clients): an Alpha bot plants, and the host A leaves 0.1 s later. On B and C, the same weirs lowered, the same phase and the same resting spot |
| 13b | **A shot in the air at migration** (3 clients): an old-host bot fires a Big Burst 0.1 s before host A leaves. On B and C the swell still lasts 0.45 ± 0.05 s, and a C kid standing in it is splatted on C's screen, and a bot B now owns standing in it is splatted on B's |
| 14 | **The host carrying on a humans-only stage** (`DEVSTAGE=1`, Cargo, 2 clients): A carries and leaves. Within 1 s, B (the new host) shows the Bazookarp dropped at A's last sample (or at the Pond, by §2.6), and nothing is held by a removed actor |
| 15 | **Carrier disconnect** (a stage with bots): on a fresh match, B carries and B's client leaves. The host adopts the actor as a bot, which keeps carrying (no drop), and the fuse runs on |
| 15b | **A declined grant:** B claims, and the test splats B on B's screen 30 ms after the claim leaves, before `p` can arrive. B answers with `kx`; the host records `u`; on both screens nobody holds it, it is free at the same spot, and `touched` is unchanged. Run inside an S39 overtime, overtime continues. |
| 15c | **The window's close:** in an S39b overtime, with `netlag=150`, B claims 0.2 s before the window closes. The claim is granted and overtime continues. |
| 16 | Results identical on every screen (counts, reason, winner, `karpM`, `karpPops`) |

### 10.3 Bot-match tool and statistics

**`tools/botlab/karp-match.cjs`**, a copy of `tower-match.cjs` adapted (WP1a):

```
MAP=<id> tools/botlab/run.sh tools/botlab/karp-match.cjs
env: DUR=300  OTMAX=120  OUT=file.json  DIFF=easy|normal|hard  HUMAN=still|carry
```

An all-bot match stepped at a fixed 60 Hz, reporting:

- winner, reason, knockout time, final counts, best metres per team;
- shell: pops per team, time to the first pop, burst splats, re-formed shells and their time to pop;
- pick-ups per team; carries (count, duration, metres of progress, how each ended: plant, knockout, splat, fall, fuse,
  reset); Carp Blasts (own half / enemy half); resets to the Pond by cause; moves off covered spots;
- weir plants (match time, which weir); Gate opened;
- overtime: started or not, the start reason (S38a / S38b / S38c), its length, how it ended, the pick-up windows
  (opened, paused time, closed);
- the carrier's time on fast fuse (retreat / zone);
- route choice shares (by route hint name);
- carrier stuck episodes > 3 s; bots stuck %; `carrierRetreatFallback`; continuity-clamp rejections;
- shots by charge tier; Carp Shot splats; bots caught by a landed Carp Shot they had noticed;
- specials, super jumps to the carrier, shared Bubble Guards on the carrier and knockouts within 8 s of one;
- console errors, simulation cost.

`RESULT` line: `karp <id> win=A|B reason=… ko=… c=…/… pops=… carries=… blasts=… ot=…/<why>`.

**Aggregator** `tools/botlab/karp-agg.py` (WP1a, in the style of the helper's `agg.py`), over N JSONs:

- knockout rate and the knockout-time distribution;
- side balance (Alpha / Bravo win rate with a 95 % interval);
- weir-plant rate; time to the first pop; Carp Blasts and resets per match;
- overtime rate and outcomes by start reason, and the losing team's win share of S38a / S38c overtimes;
- free-zone seconds; stuck; the shared-bubble knockout share;
- a PASS / FAIL row per §9.1 target.

**Mac mini JOB template** (WP3 writes it; stage builders copy it): 16 matches per stage at normal (8 + 8, two runs
of 8 at `SLOTS=3`), a second 16 at hard for the reference stages, and only the aggregator's summary lines in the
result.

---

## 11. The build plan

Seven work packages. Each is one engineer's hand-off with its own tests and its own key (`botlab-b5-<key>`). Their
order:

```
        deploy · zipcheer · sprules  (wave 1: stubs until merged; merged before WP1a / WP1b count as done)

WP0 karp-field ──┬──► WP1a karp-engine (with the Carp Shot) ──┬──► WP2 karp-face
   (small, first)│                                            │
                 ├──► WP1b karp-shell ────────────────────────┼──► WP3 karp-bots ─────────┐
                 │                                            │                           ├──► balance pass ──► stage builders
                 └──► WP4a karp-checker ──► WP4b karp-ref ◄───┘ (its matches need WP1a) ──┘
```

- WP0 is small and goes first: everything else reads the field, the data and the kit.
- WP1a, WP1b and WP4a then run in parallel. They meet only through interfaces this spec fixes: the shell's API and the
  `objTargets` calls (§2.2, §5.1), and `karpField` (WP0).
- The engine has its online shape from the first package: the three per-frame lists, owner-judged rate, half, zone and
  footing, victim-judged blasts, `q`-ordered records, all through `KarpWire`, exercised offline by `LoopWire` and
  `karp-loop.js`. WP2 adds the real wire and does not re-plumb the engine.
- WP2 and WP3 start when WP1a and WP1b are both in. WP4b starts its layout work on WP4a alone and runs matches once
  WP1a is in.
- The balance pass on the two reference stages is shared by WP3 and WP4b, judged once both are in.
- Nothing waits on a later package.

**Wave-1 prerequisites** are needed only for small parts, so they never block a start:

- `deploy`: `G.deploy.crushIn` (the growing shell crushes devices). WP1b calls it through a no-op stub until it lands;
- `zipcheer`: nothing is needed (S22's guard covers the cheer);
- `sprules`: Bubble Guard passing (one condition: a carrier never passes, §2.3). WP1a writes the condition against
  its hook and tests it once `sprules` is in.

Each of WP1a and WP1b counts as done only once the prerequisite it touches is merged and its test passes against it.

### WP0: the Carp Field, the data and the kit (key `karp-field`)

**Builds:**

- `karpField.js` (§3, §2.7): the carrier graph with hop and gap edges and `hopVeto`; the backwards Dijkstra per team
  and per state; `setState`; `fieldAt`, `side`, `inFreeZone`, `inNoRetreat`, `pushOutBlock`, zone entrances; the rest
  flags per state (`clear` lazily) and `dropSpot`; `placeholder(level)` with its auto signs;
- `bazookarp-data.js` with the format of §4.1, and first-cut data for **halyard** and **lockgate** from §9.3 (weirs
  moved toward mid, Gates where the notes put them, spawn-deck free zones). They only have to load; WP4b makes them
  good;
- `bazookarp-kit.js`, and the `variants.js` / `maps.js` hooks (§4.2), with plain placeholder pieces;
- the `karpbox` stage as a shared test module (§10.1), including the test-only second state.

**Tests:** `karp-field.js` on karpbox (hop and gap edges present, the reading at every node, the thin wall, the
second state) and as a sweep over all twelve stages (L, holes, edge counts, the reading bounds, load cost ≤ 60 ms per
state). Turf War, Zone Control and Tower Command builds unchanged; thumbnails byte-identical.

**Done means:** every other package can import the field, the data and the kit.

### WP1a: the engine, playable offline (key `karp-engine`)

Depends on WP0.

**Builds:**

- the `BAZOOKARP` config;
- mode wiring (`match.js` with the gauge guard, `main.js`, `session.js`'s mode line, menus: the mode card, a stage
  select entry, plain-text rules);
- `bazookarp.js` with every rule in §2 (overtime, coin, passive charge, the continuity clamp, declined grants and the
  window's grace included), the three per-frame lists of §5.2, and `KarpWire` / `LoopWire`;
- `karpGun.js` (§2.5): the Carp Shot, its kit records `[0]`–`[3]` with a stub net, and §2.5's victim-side blast path;
  a placeholder model (a capsule plus a cone in team ink on the Zooka pose);
- the actor hooks (all eleven in §5.4), the `sprules` pass-on condition;
- a shell stub with the §5.1 API until WP1b lands;
- placeholder looks (`bazookarpFx` minimal: a sphere shell coloured by the meter, a gold pillar, weir posts with a flat
  curtain plane, the Gate ring, free-zone outlines);
- a placeholder HUD (`hud-karp.js` minimal: counts in the zone badges; a text line under the timer, `CARRIER 42 s ×3`,
  `SHELL 62% THEM`, `FREE`; the over-head marker with seconds; the two bottom messages; the results through the zones
  judge);
- minimal bots through the real hook points: the carrier gate and `KARP_W` of §8.7 (so no carrier ever fires its own
  weapon), a carrier walking the field's downhill direction with `noClimb`, bots near the shell shooting it, every
  bot targeting a known enemy carrier;
- `karp-match.cjs` and `karp-agg.py` (§10.3), so WP3 and WP4b can measure.

**Tests:** `karp-rules.js` groups A and C–J (group B with the stub, then for real when WP1b merges), `karp-loop.js`,
`karp-gun.js`, and the regressions in §10.1. One `karp-match.cjs` match on karpbox, halyard and lockgate each that
runs to the end with no errors and no clamp rejections.

**Done means:** a human plays full 5:00 matches offline against bots on karpbox, halyard and lockgate (burst, carry,
plant, knockout, overtime); every rule test passes; `karp-loop` shows the follower path agrees; the other modes are
untouched.

### WP1b: the shell and every damage site (key `karp-shell`)

Depends on WP0. In parallel with WP1a and WP4a.

**Builds:**

- `objTargets.js` (§2.2): `segHit` (asked before the actor loop), `hit`, `splash`, `tick`, `spheres`, the special
  filter by id or by `o.special`, a guest's pending sums for `kh`;
- the call at every damage site of §2.2 and §5.4 (weapons.js, specials.js, subs.js, sp-surf.js, the kits, the Tidal
  Slam in actor.js), listed one by one in the report;
- `karpShell.js` with the §5.1 API: meter, toughness, regrowth, size, touch and shove with the edge rule, growth with
  `crushIn` (stubbed until `deploy`), `spheres()` and `shields()`.

**Tests:** `karp-shell-dps.js` (its table goes in the report: every main, special, barrage and the Tidal Slam);
`karp-rules.js` group B against the real shell; Boss Battle's tests unchanged (the boss hooks are untouched); the subs'
`spheres()` contract checked with a stub caller.

**Done means:** the engine swaps its stub for the real shell with no engine change.

### WP4a: the checker and the stage kit (key `karp-checker`)

Depends on WP0 only. In parallel with WP1a and WP1b.

**Builds:**

- `bazookarp-check.cjs` (§4.4, all sixteen checks, #16's physical proof included), with pictures, and `ERA` / `LAVA`
  support for the gimmick stages;
- the kit pieces in final form (dressed posts with `roof` tops, the weir posts 5.4 m apart, signs, the Gate plinth,
  the `carrierBlock` shimmer);
- `karp-field.js` added to the regression set;
- a builder's note template (`tools/botlab/jobs/batch5/karp-stages/BUILDER.md`) pointing at §9.

**Tests:** the checker's self-test on `karpbox` (§4.4: each fault FAILs on its own, including the 1.5 m hop into a
Gate's ring), then the clean karpbox passes.

**Done means:** an honest report on halyard and lockgate's first-cut data (failing is expected), and a table over all
twelve stages of hop and gap edges added, #16's proof results and #7d's finds, for the stage builders.

### WP2: online and the finished face (key `karp-face`)

Depends on WP1a and WP1b. In parallel with WP3.

**Builds:**

- the netcode (§7) as `NetWire`: records with `q`, immediate discrete records, claims with `ts`, the hold and the
  newest-sample check, `kd`, `kx` / `u`, the window's grace, `kh` on the tick, `kr` / `kf`, `onSamples` from
  `_sample`, Carp Shot blasts on victims' screens with `[3]`, the fuse hold for remote carriers, the fuse display rule,
  the `onLeave` order with the narrowed flush, the `'k'` case for adopted actors, `onHostChange`, disconnects, results
  packing with `karpM` / `karpPops`;
- `docs/NET.md`;
- the finished HUD (§6.1–6.5);
- the menus (§6.6): rules cards with art, tips, lobby, pause strip, results with XP;
- `bazookarpFx` in full (§6.7) and the real `sp_karp` model and pose;
- the audio cues (§6.8).

**Tests:** `net-karp.cjs` (every step of §10.2), `hud-karp.js`, `hud-lead` with `MODE=bazookarp`, `sfx-cues` (alone),
`net-tower` and the zones net test (the `onLeave` change), the menus regressions; pictures of every HUD state and every
look, day and sunset.

**Done means:** a three-client room plays a full match through a host migration, and the user's group could play it
tonight.

### WP3: bots (key `karp-bots`)

Depends on WP1a and WP1b. In parallel with WP2.

**Builds:**

- `botsKarp.js` (§8) and its hooks in `bots.js` (the full carrier gate and the carrier-aware `_pathTo`, §8.7),
  `botSpecials.js` and `botSight.js`;
- difficulty levels;
- the Mac mini JOB template;
- tuning on karpbox and the first-cut halyard and lockgate, touching only `BAZOOKARP` numbers (shell hp and reform hp,
  regrowth, burst radius, shot sizes, kick) and the bots, never a rule.

**Tests:**

- `karp-bots.js` scenario checks:
  - breakers stay outside the burst at ≥ 70 % of the enemy meter; melee breakers move out to the ring above 50 %, and
    stand ≥ 2.9 m from the centre when |m| is above 70 %; no bot takes touch damage in 20 bursts;
  - the grabber waits at 3.0–3.2 m and grabs within 0.2 s after the hold (normal);
  - an autopilot carrier finishes 3 scripted carries with no retreat ×3, no own free zone, and no stuck episode
    > 3 s;
  - **carriers holding the mitts, blade, brolly, bow, roller, a charger and the twins**, 3 carries each: zero shots of
    their own weapon, zero sub throws and `sub:cantuse` events, zero specials, zero climbs, zero Mitts leaps and zero
    dodge rolls while carrying;
  - a carrier whose forward routes are all closed accepts a short ×3 (`carrierRetreatFallback`) instead of standing
    still;
  - a bot standing where a Big Burst lands leaves the disc before it blows (normal: ≥ 16 of 20 trials);
  - the keeper holds the Gate when it opens, and the weir on the carrier's route when there are two;
  - interceptors don't track a hidden carrier through walls (`bot-sight.js` style); a wake is noticed at ≤ 20 m with
    a clear line, and not through a wall;
  - the knockback push is used in enemy ink (normal and hard);
- `bot-sight.js` and `bot-specials.js` regressions.

**Done means:** karpbox matches finish with no stuck carriers. The bots' part of the shared balance pass is ready.

### WP4b: the two reference layouts (key `karp-ref`)

Depends on WP4a (layout work) and WP1a (matches).

**Builds:**

- **halyard** and **lockgate** redesigned until the checker passes, their lightmap variants baked on the Mac mini.
  These two are the template every stage builder copies (§9.2 is their contract too).

**The shared balance pass** (WP3 and WP4b together, once both are in): 16 matches at normal and 16 at hard on each
reference stage, on the Mac mini. The lead judges them against §9.1's targets from one JOB result. WP3 adjusts numbers
and bots, and WP4b adjusts the layouts, until both stages are inside target.

**Done means:** the two reference layouts pass everything in §9.2, and stage builders can start.

### After WP4b: per-stage builders (parallel, two stages each)

Section 9.2 is their contract; Cargo and the three new stages are included. Terraces, craters and nantai carry the most
hop edges (§3.2) and should go to builders early.

---

## 12. Open questions for the lead (each with the recommended answer)

**For the user.** The rules-fidelity review asks that two of these, Q9 and Q17, go to the user, because each reads
the user's words in a particular way ("instantly splatted", "caught in the blast radius", "10 seconds").
**Recommended:** ask the user both in one message, with the recommended answers below as the defaults if there is no
reply.

1. **Two weirs and "all checkpoints will lower".** **Adopted: the literal reading.** Two weirs are alternatives on
   different routes, at the same count (±2) and 40–55 % of L. Planting either one lowers both and raises the Gate.
   The first revision read them as sequential (Weir 1, then Weir 2, then the Gate). That reading departs from the
   user's sentence ("all checkpoints will lower and the … goal will pop up") and is **not recommended**. If the lead
   wants it anyway, it needs the user's sign-off.
2. **Weir position: the user's "closer to the middle" vs the stretch notes' slice strategic points** (65–95 % of the
   way). **Recommended: the user's words.** Weirs at 40–55 % of L. The slice's strategic point stays the fight on the
   way to the Gate. This moves most weirs 10–20 m toward mid (§9.3). The band and the ±2 rule are this spec's own
   numbers; §9.1 says why, and how a stage could ask for a waiver.
3. **Pond → Gate band.** **Recommended: 55–85 m** of walking distance, 11.5–18 s at the carrier's speed. It makes
   tidewater, halyard, calamari and terraces rework their base fronts, as Nintendo did ("goal moved further back / a
   level below").
4. **The fuse after a drop.** **Recommended: a fresh 60 s on every pick-up** (per holder, as the user wrote).
5. **Passive charge at 100 / 100.** **Recommended: nobody gains**, to keep the coin hidden. The literal reading
   would charge the non-coin team from the first second.
6. **"Team Alpha wins if untouched".** **Recommended: a hidden host coin**, revealed only by the result's reason.
   INKWAVE's team 0 is always your team offline.
7. **Overtime cap.** The user's rules have none; the fuse and 10 s windows bound it already. **Recommended: a 300 s
   safety cap** like the other modes (the winning team wins).
8. **"Less than a few seconds" (S38c).** **Recommended: 5 s**, strict (`< 5 s`), as "less than fifteen seconds" is
   strict `< 15 s`.
9. **Burst and Carp Blast: armour, invulnerability and walls (for the user).** **Recommended:** "instantly" means
   instantly, so they splat through Bubble Guard, Kraken and kit armour **and every invulnerability** (a respawn's
   1.6 s, a super jump's landing, the Tidal Slam's 0.3 s). Resting spots stay 9.7 m from every pad, so a burst never
   reaches a respawn. "Caught in the blast radius" means the blast reaches you: a clear line from the centre is
   required, as for every INKWAVE blast (§2.9). Without it, a burst would splat players through walls and decks. The
   only players skipped are aquarium pipe riders, inside a glass pipe.
10. **Stages on placeholder data.** **Recommended:** offered everywhere so the mode always runs, tagged `PREVIEW` on
    the stage select until a stage's layout passes the checker. Release builds hide preview stages for Bazookarp
    only. Placeholder zones get their signs automatically.
11. **Scoring geometry.** **Recommended: the nav-based Carp Field** with hop and gap edges, read through the carrier's
    own node (§3.2), not a drawn path. Drawn `routes` are hints for the checker and bots only.
12. **Shell hp 1000 (opening) and 500 (re-formed), specials × 0.5, regrowth 200/s after 1.5 s.** **Recommended as
    starting values.** WP1b's `karp-shell-dps.js` table sets the first numbers (barrages and the Tidal Slam now count
    as specials); WP3 tunes them by bot matches (time to the first pop 6–12 s at normal; the overtime target in §9.1).
13. **Specials at the pick-up, and a shared Bubble Guard on the carrier.** **Recommended:** refused with any special
    running except Drainbow (placed) and the player's own Bubble Guard, which the pick-up **ends** on every screen.
    Copies the player had shared keep their time. A Bubble Guard a teammate shares onto the carrier stays: it is not
    the carrier's special. The carrier **cannot pass** a bubble on (passing is using a special), which is where the
    carrier rule meets the user's bubble-chain rule. That leaves a carrier shove-only for up to 6.5 s (about 31 m of
    walking), a real balance risk. The bot matches report the share of knockouts within 8 s of a shared bubble. **If
    it is above 25 %, recommended: a shared bubble on a carrier lasts at most 3 s.**
14. **Treehills hedges.** **Recommended: `roof` for a carrier;** pods stay on in this mode.
15. **Carriers in aquarium pipes.** **Adopted from the aquarium design:** refused by default; a leg opened per mode
    (`modes.bazookarp.carp`) is a field edge, and its exit near a Gate counts as an entrance.
16. **Cargo (humans only).** **Recommended: in the rotation** with the Kelpline layout ported; its acceptance is the
    checker, a scripted carry walk and one human playtest, since no bot matches are possible.
17. **Overtime windows and re-formed shells (for the user).** **Recommended:** a 10 s window does not count time while
    the Bazookarp is re-forming or flying to the Pond, and a re-formed shell has 500 hp. This is a small reading of the
    user's "10 seconds": the rule tests whether the losing team can *get* it, and nobody can touch it during those
    moments. The window still opens exactly at the user's two triggers, including the plant for an S38c start. Online,
    a claim sent before the close counts if it arrives within 0.4 s. If the lead prefers the bare 10 s, the bot-match
    target (the losing team wins ≥ 15 % of S38a / S38c overtimes) tells whether it is still winnable.
18. **Carp Shot blasts judged on the victim's screen.** Every other weapon is judged on the shooter's screen.
    **Recommended:** the exception, as Surf N' Turf rings already are, through the ring's own path (not `applyHit`).
    The 0.45 s swell exists so a foe can step out, and on the shooter's lagging view they could not.
19. **The stage contracts (bluestone, caldera).** Two of the new stages' documents say something this spec now
    replaces (§5.5). **Recommended:** the lead asks their designers to change:
    - caldera ENGINE.md §4.3, "The Carp Field rebuilds on `lava:rest` and `lava:move`, using `closedNow(id)`": replace
      with two precomputed states switched at `lava:warn`, and add the pure `restMask(level)` call;
    - bluestone ENGINE.md H21 and test 12b: `restOk` is "valid in the current era and every later one", not "in every
      era", so the Halo is a legal resting spot once it exists. The stricter rule moved drops up to 12 m, or to the
      Pond, against S23 and S26.
20. **The subs spec's stale asks.** Its revision 3 §0.6 asks Bazookarp only for `spheres()`, and this spec provides
    exactly that; but its "Asked of other packages" list (near its line 1888) still names revision 2's `hitArea` tag
    ledger, sentry rounds × 0.5 and `G.karp.shellBlocks`. **Recommended:** the subs designer deletes those three lines;
    nothing in this spec provides them. The subs' objects that a Mystery Bomb Barrage can throw should pass
    `{ special: !!obj.sp }` (§5.5).
21. **The coin at an overtime start at 100 / 100.** Overtime can then start only by S38b (the losing team holds it),
    which shows which team the coin favours. **Recommended: accept it** (§2.9): nothing can be played around at
    time-up, and the coin stays hidden while play is on.
22. **Hop and gap edges.** **Recommended:** the field adds them (§3.2) and the checker proves each one with a kid
    stepped through the physics (#16); a pair a kid cannot make goes in the stage's `hopVeto` list. Bots keep walking
    the nav graph without them. The alternative, leaving them out, under-measures terraces by up to 46 m and makes the
    "no shortcut into a base" check unprovable.

---

## Appendix: the config block

```js
// ---- Bazookarp (src/game/bazookarp.js): carry the Bazookarp to the enemy's Dragon Gate — the user's Rainmaker
export const BAZOOKARP = {
  duration: 300,              // 5:00 + overtime
  count: 100,                 // 100 at the Pond, 0 at the enemy's Dragon Gate (the Carp Field, karpField.js)
  snapHz: 10, stateHz: 1,     // online: snapshots / full state a second
  // the Roe Shell: a tug-of-war meter ±hp (Alpha +, Bravo −); a burst splats the other team within burstR (with a line)
  shell: {
    r: 1.6, rMax: 2.3, lift: 1.3,          // radius at rest / about to burst; centre above its floor
    hp: 1000, reformHp: 500,                // net damage to burst: the opening shell / every re-formed one
    regen: 200, regenDelay: 1.5,           // drift back toward 0 (/s) after this long with no hits
    reform: 0.8,                            // s to grow back after a drop / plant / reset / move
    hitCap: 220, specialMul: 0.5, contMul: 0.5,
    touch: 20, touchGap: 0.5, touchShove: 6, touchFloor: 1, shoveEdge: 1.2,   // no push toward a > 1.2 m drop
    burstR: 4.5, burstPaint: 3.5,
    crackAt: 0.6, warnAt: 0.75,
  },
  // picking it up
  pickR: 1.3, pickBelow: 0.6, pickAbove: 1.8, pickHold: 0.25,
  claimLockMax: 1.5, claimRetry: 0.3, claimSlack: 0.5,   // online (§7.3)
  claimAge: 0.4,              // s: a claim's sample age; the window-close grace; the wait for a decline (kx) after a death
  // the carrier
  speedMul: 0.8, chargeWalk: 2.4,         // × PLAYER's speeds, never the weapon's
  fuse: 60, fuseFast: 3, fuseWarn: 10,
  retreatOn: 8, retreatOff: 3,            // m of progress lost on your own half: ×3 on / back within (off)
  explodeR: 4.5, explodePaint: 5.0,       // the Carp Blast (its ink is the other team's)
  // the Carp Shot
  gun: {
    tapMin: 0.15, chargeTime: 1.2, cooldown: 0.25,
    speed: [12.7, 22.4], lob: 25, gravity: 22,  // launch speed at charge 0 → 1; degrees over the aim; m/s²
    muzzleUp: 1.4, muzzleFwd: 0.5,               // the carp's mouth above the feet / in front of the body
    landPaint: [0.9, 1.5], swell: 0.45,
    radius: [1.8, 3.4], dmg: [40, 90], edge: 25,            // partial charges (linear in c)
    fullRadius: 4.0, fullDmg: 180, fullKillR: 2.4, fullEdge: 55,
    paintK: 0.85,
    kick: [2.5, 6.0], kickTau: 0.3, kickAir: 0.6,
  },
  // weirs, the Dragon Gate (triggers: radius, and feet within ±trigBand of the floor)
  weirR: 1.8, gateR: 1.7, trigBand: 0.6, gateRise: 1.4, weirLower: 1.2, resetFly: 1.5,
  // the Carp Field (§3.2): the reading; the carrier graph's extra edges; the host's continuity clamp (§3.4)
  field: { n0R: 0.9, n0Dy: 0.5 },
  hop: { riseMin: 1.25, riseMax: 1.8, flatMax: 1.2, head: 1.6 },   // a kid lands on up to ~1.8 m
  gap: { flatMin: 1.2, flatMax: 3.0, upMax: 0.6, downMax: 3.4, airBelow: 1.0, walkMin: 6 },
  clamp: { vMax: 15.5, slack: 0.5 },      // m/s (swim 9.44 + kick 6.0, rounded up); m
  // the drop spot (§2.7)
  rest: { clear: 2.3, padR: 9.7, weirR: 2.8, gateR: 2.7, band: 1.6, near: 4, check: 0.5 },
  // the carrier's HUD fuse (§7.2): snap forward when > fwd s long; give time back at most back s per second
  fuseSync: { fwd: 0.1, back: 0.2 },
  gauge: 3,                   // passive special points / s (the user's 3p)
  // overtime (the user's rules; see §2.1 S38 / S39): strict "less than"; the pick-up window pauses while untouchable
  otDropWindow: 15, otPlantWindow: 5, otPick: 10, overtimeMax: 300,
};
```

---

## Review log (revision 2)

Two reviews of revision 1: **R** = the rules-fidelity review, **E** = the engine / netcode review. Every issue is
listed with its severity and what was done. All blockers and majors are fixed in the spec; none was rejected.

| # | severity | issue | what was done |
|---|---|---|---|
| R1 | major | The two-weir bands (65–80 %) contradicted "last weir → Gate ≥ 35 % of L". | Fixed by adopting the literal reading (R2): both weirs at 40–55 %, so weir → Gate ≥ 45 % of L and ≥ 25 m follows. #2b and the sequential bands are gone (§9.1 #2, #3). The crossmarket and lockgate suggestions in §9.3 were rewritten as parallel weirs. |
| R2 | major | "All checkpoints will lower and the goal will pop up" had been turned into sequential weirs, and the reason ignored the literal reading. | Fixed. Two weirs are alternatives on different routes at the same count (±2), each at 40–55 %. Planting either lowers all of that team's weirs and raises its Gate. The cap is the higher of the two counts (S32, S33, S36, §3.4). The checker requires them ≥ 12 m apart on disjoint routes (#5). §2.9 states why the other team's weirs are untouched. Q1 now records the literal reading as adopted and the sequential one as not recommended. |
| R3 | minor | Line of sight was added to the burst and the Carp Blast with no reason. | Kept, with the reason in §2.9 and Q9: every INKWAVE blast stops at walls (`blast()` and the bombs test `G.physics.los`); a splat through walls or decks would read as a bug. The karp-rules wall test stays (group B, E). |
| R4 | minor | The overtime window after a late plant was not pinned to the user's trigger, and "less than" had become "≤". | Fixed. For an S38c start, the window counts from the plant (S39b, with a worked example). Strict `< 15 s` and `< 5 s` (S38a, S38c, §2.9, appendix). The tests use 14.9 / 15.0 s and 4.9 / 5.0 s. |
| R5 | minor | Two player-facing rule cards misstated overtime and the reset rule. | Fixed with the reviewer's wording (§6.6). |
| R6 | minor | The middle leg on two-weir stages had no two-route check. | Moot under the literal reading: there is no Weir 1 → Weir 2 leg. Checker #5 now checks the two weirs' routes are disjoint, and two routes from each weir to the Gate. |
| R7 | minor | Free-zone coverage and `noRetreat` placement could recreate Splatoon's patched bugs. | Fixed. #9 FAILs a flagged plateau unless every node lies in a zone, and FAILs a `noRetreat` within 3 m of an own-half plateau or a free zone. Each `noRetreat` is listed with a picture in the note (§3.3, §4.4, §9.1 #7, #11, §9.2). |
| R8 | minor | There was no clearance rule for the shell at weirs or drop spots. | Fixed. Weirs need 3 m of room and must be seen from both approaches (checker #15, §9.1 #9). The drop spot prefers `clear` nodes, with no geometry within 2.3 m (§2.7). |
| R9 | minor | A carrier could keep their own Bubble Guard, against "cannot use any … special". | Fixed. The pick-up ends the carrier's own Bubble Guard. A teammate's shared bubble stays and is flagged as a balance risk with a metric and a fallback (§2.3, §2.9, §9.1, Q13). |
| E1 | blocker | The field reading leaked through walls and ledges, so a team could bank count it never walked. | Fixed with the reviewer's rule, plus a clamp. The reading goes through the carrier's own node `n0` (\|dy\| ≤ 0.5 m, ≤ 0.9 m away, clear waist line) and the nodes it has edges to, clamped to `D[n0] ± \|pos − n0\|`; with no own node, the last value is kept (§3.2). Re-measured on all twelve stages: old worst 1.5–42.8 m; new exact at nodes, and ≤ 1.03 m at 3–4 × 10⁵ sample points per stage (kelpline: 5 points by a post, 2.1 m). A sweep was added to checker #2, `karp-field.js` and karp-rules group I. |
| E2 | major | The named hooks gave no true damage, shooter or damage source for the shell. | Fixed. The shell is an objective target on Boss Battle's model: `G.objTargets` with `segHit` / `hit` / `splash` / `tick` beside every `G.boss` call, plus the special damage the boss doesn't route. It counts true damage, × 0.5 by special id, credits the owner, and a guest batches it like `bhit` / `rain`. `karp-shell-dps.js` gives the per-weapon table (§2.2, §5.1, §5.4). |
| E3 | major | Online pick-ups: the grant and the burst arrived late, claims were checked against a lagging view, and host players always grabbed first. | Fixed. Discrete records are sent at once with a sequence number. There is a 0.25 s hold for everyone after a burst. Claims are checked against the claimant's newest sample (or any in the last 0.4 s), within `pickR + 0.5 m`. The guest's lock lasts until `p` / `kd` (at most 1.5 s), and `kd` was added (§7.2, §7.3). There are net-karp steps for a full-speed swim-in and the grab share (§10.2 steps 4, 5). |
| E4 | major | Host migration: actors were removed before the takeover, queued records were dropped, and the full state was incomplete. | Fixed. A new `onLeave` order: flush the old host's queued records on every client, then `follower = false`, then remove or adopt, then `onHostChange()` (holder re-check, timers, an immediate `S`). `S` gained `phaseT`, `otWindow`, `lastHit`, `hp`, `restNode`. Tower and zones get the flush too, with their net tests as regressions (§7.6). There are net-karp steps 12–14. |
| E5 | major | The per-frame step list skipped guest pick-up detection, touch damage and passive charge. | Fixed. §5.2 now has three labelled lists: every screen, host only, followers only. There are net-karp checks for a guest's gauge and touch damage (step 8). |
| E6 | major | The host couldn't compute last footing for a remote carrier; Carp Shot blasts were judged on the shooter's screen; fuse races had no rule. | Fixed. The carrier's own screen judges the fuse rate and the last footing and sends `kr` / `kf` (§3.3). Carp Shot blasts apply on each victim's screen at `[2]` (§2.5, §7.5, Q18). The host holds a remote carrier's Carp Blast for its playback delay (at most 0.3 s) and cancels it if a death plays first (§7.5). |
| E7 | major | Bots: the carrier hook bypassed the brain, and nobody dodged a landed Carp Shot. | Fixed. The hooks sit after perception and `sp.tick` as goal, route, fire and aim providers; `_steer`, `_unstick`, `_backOnNav` and `_tail` still run (§8.4, §8.7). Carp Shot (in flight and landed) danger discs were added, and a 20 m wake sight rule. There are karp-bots checks for leaving a Big Burst and for 3 carries with no stuck episode (§8.6, WP3). |
| E8 | major | The build plan was circular, and WP1's tests needed WP4's stage work. | Fixed. WP1 (engine, karpbox, match tool, aggregator; band tests on karpbox only) → WP4a (checker, kit) → WP4b (reference layouts); WP2 and WP3 in parallel after WP1. The balance pass is shared by WP3 and WP4b. `deploy`, `zipcheer` and `sprules` are listed as prerequisites. Noted that `bake.cjs` already bakes `<id>.<mode>` (§11, §4.2). |
| E9 | major | The two-weir band contradicted the "last weir → Gate" rule. | As R1 (and the literal reading, as this review also suggested). |
| E10 | major | Overtime windows were nearly unwinnable against a fresh 1000 hp tug-of-war shell. | Fixed. Re-formed shells have 500 hp (`reformHp`), and the window pauses while the Bazookarp is untouchable. The bot-match target: the losing team wins ≥ 15 % of S38a / S38c overtimes, with outcomes reported by start reason (§2.2, S39b, §9.1, §10.3, Q17). |
| E11 | major | `field.block` couldn't stop a shortcut, and the nav graph (and so the checker) missed carrier routes. | Fixed. `field.block` was replaced by `carrierBlock`, a physical carrier-only barrier (§4.1, §5.4). Checker #7d probes for squid-only gaps, walls over 5.5 m and drops over 3.4 m. Mover rides and carp-open pipe exits into a Gate's ring count as entrances (#7a). |
| E12 | major | Resting spots: a pier, a railcar's path, a hedge plot or rising lava could cover or strand the Bazookarp. | Fixed. The drop spot uses rest flags computed at match start: whole mover corridors, pod plots, lava and era ground, and both teams' free zones are excluded, and `wide` / `clear` floor is preferred. The search is its own ring search (4 m, then 12 m), then the last footing, then the Pond. A 0.5 s re-check moves a covered Bazookarp, and the shove never pushes off an edge (§2.2, §2.6, §2.7). There are tests in karp-rules F and checker #11. |
| E13 | minor | The carrier's speed came from the weapon. | Fixed. `PLAYER` × 0.8 in every branch, including the air; `moveSpeed()` is never called for a carrier; climb and climb-side × 0.8 (S21, §5.4). A test with the four kits that change speed was added. |
| E14 | minor | The Carp Shot range table assumed a floor-level muzzle. | Fixed. A 1.4 m muzzle; launch speeds 12.7 / 17.6 / 22.4 m/s keep 7.8 / 13.2 / 20.1 m; flights 0.68 / 0.83 / 0.99 s (re-derived here; the reviewer's 12.4 / 16.9 / 21.6 land 0.3–1.3 m short) (§2.5). |
| E15 | minor | Triggers had no vertical limits. | Fixed. Pick-up: feet from 0.6 m below to 1.8 m above the floor, and a clear chest line. Weir and Gate: feet within ±0.6 m (§2.3, S33, §2.8). There are tests in groups C and D. |
| E16 | minor | Hook sites were missing or wrong. | Fixed in §5.4: the `session.js` mode and duration lines; `isRoofFor` at the two roof reads in actor.js; `roof` on post and sign tops (§4.2); the field's era masks and build order (§3.2); `karpM` / `karpPops` in the `st` rows; kit pieces generated in `layoutFor`, never pushed into `layout.half`, and `hasVariant` true with data (§4.2). |
| E17 | minor | Smaller gaps in rules and the HUD. | Fixed. Drop spots stay outside every free zone (§2.7). Retreat and zone warnings are local (§3.3, §6.2). Followers show the Bazookarp at the death spot until `d` / `r` arrives (§5.2). Melee breakers guard at the ring (§8.2). `kh` is batched per 50 ms (§7.2). The §2.9 passive-rate line was corrected. Checker items #13 (deep spawns) and #14 (the Pond) were added. |
| E18 | minor | Missing tests. | Added to §10: the reading sweep; 3-client migration with a late plant; Cargo with the host carrying; a full-speed swim-in claim; guest passive charge and touch damage; the pier, mover and hedge drops; overtime by start reason; the relay message rate; and regressions for movers, pods, surf-movers, net-surf, net-tower, other modes' world builds and the thumbnails. net-karp injects `karpbox` into every client. |


## Review log (revision 3)

Two reviews of revision 2: **R** = the rules-fidelity review (verdict needs-work: one major, five minor), **E** = the
engine / netcode review (verdict needs-work: one blocker, nine majors, six minors). Every issue was checked against
the code before it was answered; every claim in both reviews held up, so none was rejected. All blockers and majors are
fixed in the spec.

| # | severity | issue | what was done |
|---|---|---|---|
| R1 | major | S22's "gauge does not charge" missed Drainbow's share to teammates (sp-drainbow.js:176–181), and "keeps its value" was false under an enemy Drainbow (sp-drainbow.js:169). | Fixed. S22 is now one guard on the carrier, run at the end of `Match.update`: `a.special = min(a.special, carry.sp)`, then `carry.sp = a.special`. Every source is blocked, the teammate's Drainbow named; the gauge may fall (an enemy Drainbow), and "keeps its value" is gone. The per-source `addTurf` and `cheer()` hooks are dropped (§2.1 S22, §2.9, §5.2 step 5, §5.4, §5.5). karp-rules C and H test a teammate's Drainbow, a cheer and an enemy drain. |
| R2 | minor | "Instantly splatted": S4 said the splat respected spawn invulnerability while §2.9's `actor.splat()` checks none, and "nobody spawns near a shell" was untrue. | Fixed with the literal option: the burst and the Carp Blast call `splat()` and ignore every `invuln` (spawn 1.6 s, super jump flight + 0.2 s, Tidal Slam 0.3 s) as well as armour. A new rest rule keeps every resting spot 9.7 m from each pad, so a burst can never reach a respawn. The aquarium pipe riders stay the only exception, listed beside it (S4, S8, §2.7, §2.9, §9.4, Q9). karp-rules B and E test all three `invuln` kinds. |
| R3 | minor | The drop search could send the Bazookarp to the Pond from the enemy half (a large enemy zone, a lava flank), and free zones were excluded with no reason. | Fixed. The search is an unbounded ring search on the same half (§2.7); the Pond only if that half has no acceptable node at all, a stated exception that checker #11's drop-coverage walk makes a FAIL. S51 and §2.9 say why zones are never resting spots. karp-rules F: a splat mid-zone drops within 1 m of its edge. |
| R4 | minor | The checker didn't enforce S48 (a sign at each entrance) or S49 (zones on their owner's half). | Fixed. Checker #9 lists every zone entrance (carrier-graph edges into the polygon and band, chained within 3 m) and FAILs one with no sign within 2 m (both ends of an entrance wider than 8 m); it FAILs any zone node with `D_owner ≤ D_other`. Placeholder zones get signs at their entrances automatically (S48, S49, §4.1, §4.3, §4.4, self-test). |
| R5 | minor | "At least two workable routes to each checkpoint" was weakened on two-weir stages, and the band and ±2 rule were presented as the research's. | Fixed. Every weir now needs route 1 and route 2 (≤ 1.6×) from the Pond, plus the two weirs' routes disjoint from each other (S32, §9.1 #4, checker #5, self-test). A note under §9.1 quotes the research's placements (Hammerhead, Mahi-Mahi, Eeltail) and says the 40–55 % band and the ±2 rule are this spec's own numbers, and why. |
| R6 | minor | Shared Bubble Guards met the carrier rule without saying which wins: can a carrier pass one on, and do copies it shared survive? | Fixed. A carrier never passes a bubble on (passing is using a special; one condition in `sprules`' pass-on loop). Copies it shared before the pick-up keep their remaining time (`sprules`' own rule). §2.3, §2.4, §2.9, §5.5, Q13; karp-rules C tests both. |
| — | — | R's request that Q9 and Q17 go to the user. | §12 now opens with it, recommending one message to the user with the recommended answers as defaults. |
| E1 | blocker | The host scored, planted and knocked out from a remote carrier's drawn position (Hermite path + up to 4 m of correction + up to 0.18 s of collision-free extrapolation), and best counts never rise. | Fixed. The host judges a remote carrier only from the real samples it sent (`F.alive`), each read at its exact position as it plays (`netmatch._sample` → `karp.onSamples`), never the drawn position. A continuity clamp refuses any reading that lowers `D` faster than 15.5 m/s × Δt + 0.5 m, with the baseline reset at a pick-up and a state switch (§3.4, §5.2, §7.1, §7.5). net-karp 6b freezes B's ticks for 0.4 s at the thin wall; karp-rules D injects an impossible reading. |
| E2 | major | The Carp Shot's victim-screen blast went through `applyHit`, which netmatch drops for a remote attacker, and the shooter got no hit marker. | Fixed. §2.5 spells out the Surf N' Turf path: the Drainbow cut, `victim.damage(dmg, shooter, 'karp')` with the mute lifted, the `'hit'` event, and a victim-side kit record `[3, gid, dmg]` that gives the shooter its marker (§2.5, §7.2, §7.5). net-karp 7b; karp-gun checks `[3]` and that `applyHit` is not used. |
| E3 | major | The field and the checker missed 1.25–1.8 m hops and gap jumps (terraces: 217 pairs, worst 46.2 m; craters: 503, worst 24.0 m), so "no shortcut" was unprovable and hop-ups read as retreat. | Fixed. The carrier graph adds hop edges (1.25–1.8 m up, ≤ 1.2 m apart, clear waist and head) and gap edges (≤ 3.0 m over open air, ≤ 0.6 m up or down to 3.4 m), with lengths `flat + rise` and `flat + 0.5·drop` (§3.2). The probe was re-run on terraces and halyard with the same numbers. Checker #16 proves every added edge by stepping a carrying kid through `actor.update` (the treehills-pods way-round method); a pair it can't make becomes `hopVeto` data. #7d adds high-hop and long-gap probes; the self-test's 1.5 m non-inkable ledge into a Gate's ring must FAIL. Bots' `G.nav` is unchanged. |
| E4 | major | A state switch (lava, eras) changed progress under a still carrier, `mark` was never reset, and caldera's ENGINE.md wanted a mid-match rebuild this spec forbids; bluestone wanted `dangerAt` and zone `eras`. | Fixed. Every switch clears the retreat flag, unsets `mark` and re-reads half and zone on the next own-node frame (§3.3); the host resets its clamp. One interface table (§5.5) gives each stage's contract: bluestone switches at `era:done` with `dangerAt` from warn to done; caldera has two precomputed states (LOW, HIGH) from a new pure `restMask(level)`, switched at `lava:warn`, no rebuild; aquarium as agreed. `freeZones`, `noRest`, `carrierBlock` and `noRetreat` may carry `eras` (§4.1). karp-rules group J (a test-only second state on karpbox), and `eras-karp.js` / `lava-karp.js` once those stages exist. The two stage documents' conflicting lines are Q19. |
| E5 | major | The subs spec expected a device-style shell API (`hitArea` tag, sentry × 0.5, `shellBlocks`, bounce, crush). | Fixed by an interface table both builders read (§5.5). The subs spec's own revision 3 §0.6 has already moved to this spec's model: `objTargets.splash` beside each boss splash, sentry rounds at face value, one read-only `spheres(out)`, and `crushIn({ sphere }, 'shell')`. §2.2 now defines `spheres()` exactly as it asks. Its §F list still names the old three asks; Q20 asks the lead to have them deleted. |
| E6 | major | Five hook sites were wrong or missing: barrage bombs escaped × 0.5, the Tidal Slam reached the boss only through a listener, Bubble Guard's end path kept the shield, Drainbow charged a carrier, the Mitts leap wasn't gated. | Fixed. `objTargets` takes `{ special }` from the existing `sp` flag on bombs, projectiles and sub items (§2.2). The Tidal Slam calls `objTargets.splash` in `_slamImpact` (not via `special:slam`, which the Cheer Orb and Kraken also emit). At the pick-up every screen calls `_dropShield(a, true)` and the owner `end(a, 'karp')` (§2.3). The gauge guard (R1). `&& !this.carry` on `tryDodge` (actor.js:322) and the kit jump (actor.js:325) (§2.4, §5.4). Tests: barrage and slam rows in `karp-shell-dps`; karp-rules B, C; net-karp 6. |
| E7 | major | The bot plan under-scoped bots.js: 74 writes of `it.fire`, kit hooks, subs, threat, canopy, pods, climbs, and a `_pathTo` that drops masks at its 14 call sites. | Fixed. §8.7 is a carrier gate: `KARP_W` in place of the weapon (no kit hook, not melee), the refill and retreat entry skipped, the whole actions block replaced by `karpCarrierAct` (the only writer of `it.fire`), specials, `_threatCtl`, `_canopyCtl`, pods and `_climb` skipped, a final sub/special guard; `_pathTo` made carrier-aware at all 14 call sites (avoid, cost, `noClimb`) with a no-path fallback that accepts a short ×3. About 80 lines. WP3 tests carriers with the mitts, blade, brolly, bow, roller, a charger and the twins. |
| E8 | major | The fuse ring snapped to late snapshots under ×3, and own half / own zone at a blast or splat came from the host's lagged view; `kf`'s cap delayed half changes. | Fixed. The HUD fuse runs locally and corrects from age-corrected snapshots: forward at once, back at most 0.2 s per second (§7.2, §6.2). `kr` now carries `half` and `zone` and is sent on any change (at most one per 50 ms tick; the half flag has 0.5 m of hysteresis); the host takes every own-half and own-zone decision about a remote carrier from it (§3.3, §2.6, §7.5). `kf`'s half and zone changes bypass the 5/s cap. net-karp 9b. |
| E9 | major | The build plan put everything behind one huge WP1, scheduled the checker late, and added the online split in a second package. | Re-cut (§11): WP0 (field, data, kit, karpbox: small, first); then WP1a (the engine with the Carp Shot, online-shaped from day one through `KarpWire` / `LoopWire`, tested by `karp-loop.js`), WP1b (objTargets, the shell, every damage site, the dps table) and WP4a (the checker, which needs only WP0) in parallel; then WP2 and WP3; WP4b. Wave-1 packages are "merged before done", with stubs until then. The shell's API (§5.1) is the seam between WP1a and WP1b. |
| E10 | major | §7.6's flush of every queued old-host record collapsed timed effects (a Carp Shot's swell), and `S` carried a `mark` the host never had. | Fixed. Only rule records (`'tw'`, `'z'`, `'ks'`) of the departed host are flushed; ghosts, paint, specials and `'ev'` play out on its clock as today. The `'k'` case plays a departed peer's `karp` records for an actor this client has just adopted. `mark` is dropped from `S`; a newly adopted carrier starts with `mark` unset (§7.6, §7.2). net-karp 13b. |
| E11 | minor | `kh` as its own message at 20/s plus the tick broke net-karp step 1's ≤ 30/s. | Fixed: `kh` rides the guest's tick (`msg.kh`); step 1 expects about 20 messages a second (§7.2, §10.2). |
| E12 | minor | Weir posts at 1.9 m sat inside the 2.3 m swollen shell; the grabber's 2.5 m was inside touch range (2.68 m). | Fixed: posts 5.4 m apart (2.7 m from the centre, inner faces at 2.45 m) (§4.2, checker #15); the grabber waits at 3.0–3.2 m; melee breakers stand at `max(2.5, r(m) + 0.88)` m, ≥ 2.9 m above 70 % (§8.2). WP3 tests no touch damage in 20 bursts. |
| E13 | minor | `restOk` missed `carrierBlock`, the Gates and standing weirs; lava and era exclusions were too wide. | Fixed: `carrierBlock` and 2.7 m round each Gate in `restOk`; 2.8 m round any standing weir as a dynamic exclusion; "valid now and in every later era"; caldera's flags per rest level, the state switched at `lava:warn` so a resting Bazookarp moves before the lava comes (§2.7). Bluestone's stricter H21 wording is Q19. |
| E14 | minor | Smaller code mismatches: segHit order, railcar roofs, the polygon `carrierBlock`, 56k `clear` raycasts, rolls and brush in the site list, the coin at overtime. | Fixed: `segHit` before the actor loop, beams compare distances (§2.2, §5.4); only `roof: false` cars can be ridden, none today (§2.9, #7a); `pushOutBlock` to the polygon's edge (§4.1, §5.4); `clear` lazy (§2.7, karp-rules F counts raycasts); rolls and brush removed from the list (§2.2); the coin shown by an overtime start at 100 / 100 is accepted and said so (§2.9, Q21). |
| E15 | minor | Overtime and claim edges: a claim sent before the window closed but arriving after lost; a grant to a guest who had died became a carrier loss. | Fixed: claims carry `ts`; at the window's close the host waits 0.4 s for claims sent before it. A claimant's screen declines a grant that arrives after its player died (`kx`); the host restores the pre-grant state and records `u`; after a remote holder's death within 1.5 s of its grant, it waits up to 0.4 s for that decline (§7.3, S39b, S39c, S40). karp-rules G; net-karp 15b, 15c. |
| E16 | minor | Missing tests. | Added: thin-wall stall (net-karp 6b), hop and gap shortcuts in the self-test, a still carrier across a state switch (karp-rules J, eras-karp, lava-karp), barrage and slam (`karp-shell-dps`), Drainbow gauge (C, H), Mitts and twins jump guards (C), Bubble Guard dropped on remote screens (net-karp 6, `karp-loop`), kit-weapon bot carriers (WP3), the migration flush with a shot in the air (13b), the fuse ring under ×3 (9b), plus `karp-loop.js` for the follower path. |
