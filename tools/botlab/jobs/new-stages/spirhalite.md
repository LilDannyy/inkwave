# Spirhalite Islands (`spirhalite`): design

**Name:** Spirhalite Islands. **Times:** golden (a misty, silvery late morning: soft light, pale sea) / dusk (a hazy
sunset through the mist).

## The place

A remote archipelago that rose out of the sea in a tectonic shift. Nobody lives here. The only way in is by helicopter,
and Deep Cut (Shiver, Frye and Big Man) have set up an expedition camp to investigate its ruins: tiered stone pillars
and arches older than anyone can explain, with water somehow cascading down them.

The reference picture (`spirhalite-ref.webp`) is the look: **white sand dunes** with mats of **green moss** creeping
over them; a **twisted palm with huge split monstera leaves and hanging aerial roots**; **yellow pompom flowers** on
thin stalks; **washed-up debris** (a teal tarp, crates, a big green glass float in a net, an orange buoy / life vest);
a **huge stone arch** over the sea; an **ancient tiered pillar** (stacked round drums narrowing upward with a bulb /
finial on top) with **water pouring down its tiers** into the sea; a strange pinwheel-like vane in the water; a
**misty sea**, turquoise in the shallows, soft grey-blue sky.

What the players should read from any camera:
- **The Great Arch** at the centre: a colossal weathered stone arch spanning the central sandbar (legs well outside the
  play lanes, e.g. at x ≈ ±12, crown ~10 m up), its underside dripping.
- **The cascade pillars**: one per half on its flank islet (mirrored): stacked drums on a round stepped base, water
  sheets pouring from the top tier and splashing into a pool at the foot (animate it: a backdrop `objects` mesh with a
  scrolling water shader can stand in the arena; the pillar's collider is a prop / layout piece).
- **Deep Cut's expedition camp** on each half: canvas tents, tarp shelters on poles, crates stencilled "DEEP CUT
  EXPEDITION", a generator, a radio mast with a windsock, survey tripods, a camp table with maps and a lantern, their
  flag. Keep their branding tasteful (a stylised logo of your own, the name in text).
- **Spawns**: each is a steel helicopter landing pad on stilts over the dunes (the "H" marking, edge lights that glow
  at dusk, a windsock), with the helicopter itself parked just behind it out of bounds (rotor blades drooping, cargo
  net), stairs and a ramp down onto the sand.
- The flora and debris from the reference everywhere: monstera palms (props with trunk colliders), moss mats over
  sand and rock, pompom flower clusters, driftwood logs (cover), tarps, crates, floats, a half-buried rowing boat.

## Layout (world metres; Alpha at −Z, Bravo at +Z; bounds ≈ ±26 × ±45)

An **island chain linked by sandbars**: organic outlines everywhere, water channels between the islets (the death
plane), open and bright with longer sightlines than the other stages.
- **The central sandbar** under the Great Arch: flat sand (y 0), ~18 × 12 m, the tower's start and the centre zone;
  cover from driftwood, a stranded crate stack, the arch's fallen stones.
- **Each half** (the islets toward each base):
  - left lane: a chain of low islets linked by sandbars and a driftwood-log bridge over a water channel; moss and
    pompom flowers, a stranded rowing boat. Low (0) with dune humps (0.8–1.3) as cover.
  - mid lane: the dune spine from the helipad down to the sandbar: sand ramps (≤ 24°) and wind-cut dune ridges (1.3),
    the camp in a dune hollow.
  - right lane: the pillar islet, reached by a broken ancient **causeway** of worn stone slabs (1.3 → 0) from the dune
    spine; the cascade pillar's tiers as high ground (base ring 1.3, next tier 2.6 reachable by squid-climbing; the top
    is out of reach, roof).
- **Helipad** spawn deck at ~3.0–3.6.
- The footprint: islands, sandbars, spits and channels: very clearly not a rectangle.

Heights: 0 sand, sandbars · 0.8–1.3 dune ridges, the causeway, the pillar's base ring · 2.6 pillar tier, dune tops ·
3.0–3.6 helipads.

How it plays differently: open, bright, long sightlines across water channels (chargers love it), with low, soft cover
(dunes, driftwood) instead of walls; the pillars are the only tall cover; the channels funnel pushes onto the sandbars.

## Modes

- **Zone Control.** Centre: the sandbar under the arch (~11 × 9 m, y 0). Side: the camp's clearing in its dune hollow
  (flat sand, ~9 × 8 m), with dune ridges round it for cover.
- **Tower Command.** Suggested (Alpha pushing toward +z; refine it): the sandbar under the arch → +x along the sandbar
  → +z onto the ancient causeway (an incline or a **climb** onto its 1.3 slabs; checkpoint 1 at its foot) → along the
  causeway → a **drop** off its far end onto the sand → −x across the dune hollow past the camp (checkpoint 2) → +z up
  the dune spine to the goal below the helipad, ~12 m short of the spawn pad. About 80–90 m. Every sandbar the tower
  crosses needs 2.5 m of floor under the whole platform (widen spits where the track runs).
- **Boss Battle.** Open sand should suit the boss; check the channels don't strand it. Report.

## The world round it (env)

- `bay: false`. Your backdrop: more of the archipelago fading into the mist: sheer-sided islets with green tops and
  monstera palms, sea stacks, another great arch far off, more tiered pillars as grey silhouettes in the haze (one with
  its own cascade), the strange vanes in the water, low cloud banks. It should feel remote: no city, no lighthouse.
- `weather.mist` (strong: banks drifting on the water between the far islets and the stage), `theme` overrides: golden
  softened into a misty light (lower contrast, more haze, closer fog), the sea pale jade-turquoise with white foam;
  dusk: a hazy pink-orange sunset through the mist. Gulls stay; `boats: false`, `buoys: false`, `edge: 'none'` (sand
  shelving into the water, not piers: dress the shore with wet sand, foam, rocks).

## Surfaces (your 3 slots)

Suggestions: white dune sand (ripples, footprints, shell fragments; team ink reads on it), moss mat (green, spongy,
over sand), and the ancient stone (weathered pale-grey blocks with carved bands, water stains, lichen).
