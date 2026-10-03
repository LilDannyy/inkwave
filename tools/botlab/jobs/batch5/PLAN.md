# Batch 5: the lead's plan and readings of the request

`REQUEST.md` is the user's message. This file says how the lead split it into work packages and how the lead reads the
points the user left open. Where this file and the user's words disagree, the user's words win: say so in your report.

## Wave 1: the "Changes" list (six packages, in parallel)

### `deploy`: deployables can be shot; the tower crushes what is in its way
User: "Deployables can be shot. These include beacons, and sprinklers, surf n turf and skitter bombs." and "If a
sprinkler, beacon, curtain, beacon or surf n turf is in the path of the tower, the tower instantly destroys it."
- Enemy fire of every kind (shots, charger / bow beams, rolled and flung ink, blasts, sub and special damage) hurts an
  enemy team's Hop Beacon, Twirl Sprinkler, Surf N' Turf buoy and Skitter Bomb, and destroys it at 0 hp. Your own team's
  fire never does. Waddle Bombs, Tide Torpedoes and the buoy are already shootable: follow how they do it (kit
  `blockShot` / `blockRay` / `damageArea`, the buoy's `hitShot` / `hitRay` / `hitArea`), and check the buoy against
  every damage source.
- Pick hit points in line with Splatoon (Sprinkler 100, Squid Beakon 120): a few shots, not one, not a magazine. A
  Skitter Bomb that is shot down pops harmlessly (no blast, no damage; a puff). Hit flash, a pop effect, a sound, and
  the shooter's hit marker.
- Bots shoot enemy deployables when they have nothing better to shoot (they already do this for buoys).
- Online: a hit on a remote-owned deployable goes to its owner, as the buoy's does.
- The tower: anything on that list (sprinkler, beacon, Drip Curtain, Surf N' Turf buoy) that the moving tower's body
  runs into is destroyed at once, with a crunch. Lead's reading: this is about things standing in the tower's way on the
  ground or on walls beside the track. A device placed ON the tower's deck keeps riding it, as today (the user asked for
  the buoy to ride the tower two days ago). Say in your report if you think the user meant otherwise.

### `sprules`: special-gauge and survival rules, the bubble chain, two new barrages
User: "Add waddle bomb barrage and mystery bomb barrage (changes bomb each time you throw)"; "The special meter
currently gives you half back of 100% if you die during the special, not how much you currently have"; "Make the
following survive after the user is splatted: boomerang, tempest, surf n turf, drainbow, bubble."; "If a bubble is shared
to a teammate, that player can also share the bubble to another teammate."
- Gauge on a splat during a special: today the player gets half of a FULL gauge back. It should be half of what was
  left of the running special at that moment. Find the code, prove the old behaviour with a test, fix it. A splat with
  no special running keeps its existing rule.
- Survive the owner's splat: Whirl Boomerang (keeps flying and finishes its burst), Ink Tempest (the cloud stays),
  Surf N' Turf (the buoy keeps pulsing), Drainbow (the bubble stays for its remaining time; the owner's life extension
  simply stops while they are away), "bubble". Lead's reading of "bubble": both the Bubble Blower's blown bubbles in the
  world and a Bubble Guard already shared onto teammates outlive the player who made them. Check every screen online:
  the remote splat now emits `splatted` with `remote: true`, and several ghosts clean themselves up on that event.
- Bubble Guard chain: a teammate who received a shared Bubble Guard can pass it on by touch to another teammate. The
  copy carries the remaining time of the one it came from (never a fresh timer), one bubble per player, no ping-pong
  refresh.
- `barrage_waddle` (Waddle Bomb Barrage) and `barrage_mystery` (Mystery Bomb Barrage: each throw is a different bomb,
  picked at random from the bombs the barrages can throw, Waddle included; the HUD and the bomb in hand show which one
  is next so the player can aim it). Appended at the END of `SPECIAL_ORDER`. Icons, blurbs, picker, bots, online.

### `zipcheer`: Zipline buffs and the Cheer Orb rework
User: "Zipline gets 75% damage reduction while zipping and make zipping 50% faster, and ink consummation during the
special 30% less." and "Using Cheer Orb rises you up in the air and you are stuck there while charging. Teammates get a
bigger prompt bottom middle to cheer. When they do cheer, send a wisp of energy to the Orb and also to their special
meter to charge it a little bit."
- Zipline (`zipcaster`): while travelling along a zip the player takes 25 % of damage; the zip travel is 1.5× as fast;
  every ink cost while the special runs is 0.7× what it is now.
- Cheer Orb (`booyah`): on use the player rises into the air (think Splatoon's Booyah Bomb) and hangs there, unable to
  move, until the orb is thrown or the special ends. Teammates get a big, obvious bottom-middle prompt to cheer (with the
  key / button). Each cheer sends a visible wisp of energy from the cheerer to the Orb AND a wisp into the cheerer's own
  special gauge on their HUD, which gains a little charge (pick the amount; say what). Bots cheer. Online on every screen.
  Keep today's damage rules for the charging player unless they make the special useless: report what you found.

### `jumpui`: super-jump alerts and the Zipline / Ink Jet return markers
User: "Give an on screen alert when a teammate is jumping to you and their name, as well as a name around the super jump
icon, and an indicator for when they're landing." and "like the super jump minimap indicator, if someone is using zipline
or inkjet, add an indicator when they start using the special so players know where they'd super jump to, and where the
player will jump back when it ends".
- When a teammate starts a super jump to YOU: an on-screen alert with their name. The landing marker (world, minimap,
  TAB map) carries the jumper's name, and shows when they land (a countdown ring or timer that reads at a glance).
- When a player starts Zipline or Ink Jet: a marker at the spot they return to when it ends, from the moment the special
  starts, in the world and on both maps, in the style of the super-jump marker, with their name. A teammate who super
  jumps to that player lands at that marker (check what happens today and make it so). Follow the existing super-jump
  marker's rule for who can see it.

### `tuning`: roller speed, charger aim assist, forgiving zones, full weapon names
User: "Make rolling with roller slightly faster than walking speed"; "reduce charger's aim assist lock on."; "Make
contesting and covering zones more forgiving"; "make sure the full weapon name can be seen in the weapon select".
- Roller: rolling is a little faster than plain walking (a few percent to about 10 %). Bots keep working.
- Charger: its aim assist (controller, and the optional mouse assist) pulls and sticks noticeably less than other
  weapons'. Only the charger.
- Zone Control: read `src/game/zones.js` and find every threshold that decides taking a zone, losing it, contesting it
  and the penalty. Make taking and contesting kinder (a zone should not need near-perfect coverage, and a contest should
  not flip on a sliver). Propose numbers, then measure on the Mac mini (lead changes, time to take, knockouts, how long
  zones sit contested) before and after, and report both.
- Weapon select: the whole weapon name is readable wherever a weapon is picked or shown as picked (the loadout screen's
  weapon list and detail, the lobby's weapon drawer and chip, the setup screen): wrap or fit, never "…".

### `holds`: two-handed holds
User: "make the player hold brush rollers blasters and brollys with both hands".
- The brush, the roller, the blaster and the brolly are held with both hands (the off hand on the weapon, with IK or
  posed so it stays on it) in every state the weapon shows in: standing, running, firing / swinging / rolling, jumping,
  the lobby and podium poses, bots and remote players. No hand through the weapon, no broken elbows. Pictures of each
  weapon from the front, the side and the back, standing and in action.

## Wave 1, at the same time: design (no code)
- `bazookarp/SPEC.md`: the new mode (the user's Rainmaker rules, as an INKWAVE engine design and a per-stage data format).
- Three stage designs with their gimmick engines: `bluestone` (the city that travels through time; never call it
  Melbourne), `aquarium` (clear pipes), `caldera` (the lava that rises and falls). The user wrote "two new maps" and then
  described three: we build all three. Display names are the designers' to propose.
- `subs/SPEC.md`: the four new sub weapons.

## Wave 2 and after (the lead decides when the designs are in)
The four subs; the Bazookarp engine, HUD, online and bots; the three stages; then a Bazookarp layout for every stage
(big redesigns allowed, as mode-only variants); integration, balance and verification sweeps on the Mac mini.
