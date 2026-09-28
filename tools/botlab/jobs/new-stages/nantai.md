# Mount Nantai (`nantai`): design

**Name:** Mount Nantai. **Times:** day (crisp alpine morning) / dusk (sunset into a starry sky; the star party is on).

## The place

The Nantai Observatory stands on the summit shoulder of Mount Nantai (2,657 ft), the highest point between The Cape
and Inkopolis. A small alpine tarn fills the saddle below the summit, and the **Nantai Brook**, the stream that becomes
the river at the mountain's foot (where Ryu Chang comes from), spills out of it and runs across the grounds in a rocky
bed before it falls away down the mountainside. Tonight Grizzco is hosting a star party on the lawn.

What the players should read from any camera:
- **Twin observatory domes** (white, riveted panels, the shutter slit; at dusk the slit is open and glowing, a telescope
  inside), one behind each spawn: the landmark silhouettes. Each spawn is the dome's forecourt terrace on top of the
  control building (stone base, timber-and-steel upper storey, weather instruments on a mast: anemometer, a Stevenson
  screen, a lightning rod).
- **The Nantai Brook**: clear teal water over pale stones between boulders, crossed by bridges. The water is the death
  plane (y −1.6), so the brook's bed is a real gap in the deck, 3–5 m wide, with rocky banks.
- **The star-party lawn** at the centre: the flat grassy meadow between the two brook crossings, dressed with telescopes
  on tripods (refractors, a big Dobsonian), folding camp chairs, blankets, a Grizzco marquee and bunting ("GRIZZCO STAR
  PARTY", the bear logo, orange and brown), string lights, a projector screen showing a star chart, thermos flasks.
  Grizzco's crates and a generator on wheels.
- **Pearl's rehearsal rock**, one per half (mirrored): a big flat-topped granite boulder with a ring of shockwave cracks
  (radial fractures, blast-bleached lichen), a battered mic stand and a crate of spare mic cables, a hand-painted sign
  "QUIET PLEASE — REHEARSAL (P.)". The rock is high ground and the side zone.
- **Where it all began**: a single bench on a lookout ledge facing the bay, with a small brass plaque. It's a one-off
  (`mirror: false`), on the edge out of the main flow.
- The mountain itself: granite outcrops, scree, alpine grass, dwarf pines bent by the wind, cairns, trail markers,
  wooden trail signs ("SUMMIT 0.2 KM · OCTO VALLEY 6 KM · INKOPOLIS 14 KM").

## Layout (world metres; Alpha at −Z, Bravo at +Z; bounds ≈ ±26 × ±45)

A **moat layout**: each half has its own brook crossing between its base and mid.
- The brook runs across the map twice: Alpha's crossing at z ≈ −14 and its mirror (Bravo's) at z ≈ +14. Each is a
  diagonal, bending channel, not a straight ditch (e.g. running from (−26, −9) to (26, −19) with a kink), 3–5 m wide.
  Three crossings per brook:
  - **left: a log bridge** (two split logs with a rope rail) at ground level: narrow (1.6 m), the sneaky flank.
  - **centre: the Old Stone Bridge**, a humped granite arch, 4 m wide, rising to ~0.8 m, parapets as cover. The main
    lane and the tower's route (it must carry the 2.5 m platform with 3.72 m of headroom: open sky, no arch above).
  - **right: the weir**: a concrete weir with a sluice board (the tarn's outflow) and a steel gantry walkway at 1.3 m
    over it; squids can ink the weir face.
- **The lawn** (|z| < ~10) between the two brooks: flat (y 0) centre meadow, ~20 × 18 m, with cover from the star-party
  dressing (the marquee's table stack, the Dobsonian on its crate, the generator, low stone walls). The tower starts
  here and the centre zone is here.
- **Each base half** climbs from the brook to the dome in terraces: brook bank 0 → 1.3 → 2.6 → spawn 3.8. Mountain
  stairs (stone steps with timber risers), a switchback ramp (≤ 24°, gravel), and ink-climbable granite faces.
  - left lane: a low shore trail along the tarn (0 / 1.3), boulders and dwarf pines.
  - mid lane: the stair flight down from the dome terrace to the Old Stone Bridge.
  - right lane: a high rocky ridge (2.6) with a timber viewing platform, the rehearsal rock at 1.3–2.4 and a
    boardwalk down to the weir gantry.
- The footprint is a rocky promontory in the tarn: its edge is irregular granite shore (angled facets and bays, not a
  rectangle), and the two brooks cut it into three pieces. Dress every exposed edge with rock and scree (env.edge
  'none' + your own banks; `kit.runs` gives the deck edges for cliffs in the backdrop).

Heights: 0 lawn, banks, tarn shore · 0.8 bridge crown · 1.3 weir gantry, first terrace, rock-top · 2.6 ridge, second
terrace · 3.8 spawn terrace · the domes above are out of bounds (roof).

How it plays differently: the brooks make every push a crossing (three bridges, three chokepoints, and a squid-only weir
face); the bases are tall and defensive; the lawn in the middle is open, with sightlines broken only by party gear.

## Modes

- **Zone Control.** Centre: the lawn, one zone of ~11 × 10 m in front of the marquee (y 0). Side: the top of Pearl's
  rehearsal rock and the flat ground at its foot on the right-lane side (a two-part zone is fine, `polys`), closer to its
  team's spawn than to the centre, reachable from the stair, the ridge and the brook bank.
- **Tower Command.** The track tells the story "over the bridge and up the mountain". Suggested (Alpha pushing toward
  +z; refine it): centre → +z across the lawn → over the Old Stone Bridge (incline up and down; checkpoint 1 on the far
  bank) → −x along the brook bank → a **climb** up the first terrace wall (1.3) → +z up the terrace (checkpoint 2 by the
  switchback) → +x → a **climb** to 2.6 → +z to the goal on the second terrace below the dome stair, ~12 m short of the
  spawn pad. About 80–90 m, 2 checkpoints.
- **Boss Battle.** The lawn is the arena; check that the boss can roam it and reach both brook banks. Report.

## The world round it (env)

- `bay: false`. Your backdrop: the summit ridge of Mount Nantai rising on one side (the observatory's shoulder is just
  under it: a granite crest with a small trig pillar), lower forested ridges falling away on the others, and **down the
  mountain, far off, Inkopolis Bay** glinting with the city's towers across it (a low, distant, hazy silhouette: the
  world map puts the bay south of Nantai). Octo Valley's hills to the north. Dwarf pines on the near slopes (instanced),
  scree fans, a few snow patches only on the highest far peaks.
- The water round the arena reads as the tarn: `theme.all` sea colours for a cold, clear mountain lake (deep teal-green,
  pale green shallows), calm (`waveStrength` low). No gulls, buoys or moored boats (perhaps one rowing boat pulled up on
  the shore, as a prop).
- `stars: true` for the dusk star party; a little low mist in the valleys (`weather.mist`, sparse) if it helps the sense
  of height.
- Theme overrides: day with a deeper blue zenith and crisper air; dusk: the sunset theme with the stars, the domes'
  slits and string lights glowing.

## Surfaces (your 3 slots)

Suggestions: granite (lichen-spotted, pale grey with feldspar speckle), alpine turf (short grass with moss and gravel
showing through), and a timber boardwalk / weathered deck or gravel path. Team ink should read clearly on all of them.
