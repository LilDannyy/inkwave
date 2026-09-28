# Turf War Craters (`craters`): design

**Name:** Turf War Craters. **Times:** day (bright, breezy coast) / dusk (sunset; the memorial's lanterns lit).

## The place

On the chalk downs beside The Cape, on the north shore of Inkopolis Bay, the ground is still pocked with the craters
of the Great Turf War, fought about a hundred years ago when the seas rose and every species fought for what land was
left. Most craters have grassed over; some hold rainwater; the old trench lines and pillboxes are kept as a memorial
park. Red wildflowers grow thickest in the craters. Across the bay, Inkopolis.

What the players should read from any camera:
- **The Great Crater** at the centre: a big dry crater bowl, its floor sunk below the downs, grassy rim, chalk showing
  through where the turf is thin, rubble and twisted rebar. Two rusted war relics half-buried in its walls (mirrored):
  e.g. the barrel and turret ring of a giant ink cannon, and a huge ribbed shell casing. They are cover, climbable.
- **Flooded craters**: round ponds of dark water ringed by reeds and wildflowers (the water is the death plane), which
  the lanes bend around.
- **The trenches**: zig-zag trench lines (straight runs with square and 45° corners) across each half, cut into the
  chalk: sandbag and timber-revetment walls, duckboard floors, fire steps, rusty corrugated iron, plank bridges over
  them. Barbed-wire entanglements on iron pickets (rail colliders).
- **Pillboxes**: squat concrete bunkers (hexagonal or square, embrasure slits, chipped paint, moss); their roofs are high
  ground you get onto from behind.
- **The memorial**: a white obelisk ("THE GREAT TURF WAR · NEVER AGAIN"), wreaths, a stone bench ring; a visitor path
  of gravel with interpretive boards ("TRENCH LINE B", a map of the battle); small remembrance lanterns along it (they
  glow at dusk).
- **Spawns**: each is the observation deck of the modern visitor pavilion (board-marked concrete and glass, a slim
  cantilevered roof, a coin-operated binocular viewer at the rail), looking out over the field.
- The coastline: the downs end in **white chalk cliffs** on the stage's long sides, straight down into the sea.

## Layout (world metres; Alpha at −Z, Bravo at +Z; bounds ≈ ±26 × ±45)

A **curved** stage: the outline is a chain of crater rims and cliff edges (arcs and facets), never a rectangle.
- **The Great Crater** (centre, radius ~9–10 m to the rim crest): floor y −1.0 (flat, ~12 m across), inner slopes as
  ramps (≤ 24°) and short chalk ledges, rim at +1.3 with gaps where the lanes come in. The tower starts on its floor;
  the centre zone is its floor. (The crater floor stays above the water: −1.0 > −1.6.)
- **Flooded craters**, one per half at the left flank (e.g. centred (−15, −13), mirrored (15, 13)), ~6–7 m across, the
  lane bending around them on a rim path.
- **Trench line** per half at z ≈ ∓20…∓26: a zig-zag across the map (floor −1.0, 3–3.5 m wide where the tower rides it,
  narrower elsewhere; 1.0–1.3 m walls with sandbag parapets above ground). Ramps / fire-step stairs in and out, two
  plank bridges over it. The trench is both a safe route and a trap.
- **Pillboxes**, one per half near the trench's right end (roof 2.4, enter the roof from the rear by a ramp or a
  squid-climb; the inside is solid, so not a room), and the **memorial obelisk** on a stepped plinth (1.3 / 2.4) on the
  right flank of each half.
- **The visitor pavilion** (spawn deck 3.0–3.8) with stairs down both sides and a ramp.
- Lanes: left — the rim path round the flooded crater (low, open, long sightlines across water); mid — pavilion stair →
  trench bridge → downs → the Great Crater; right — pillbox, memorial plinth, trench end (high ground, cover).

Heights: −1.0 crater floor and trench floors · 0 downs · 1.3 crater rims, parapets, plinth step · 2.4 pillbox roofs,
plinth top · 3.0–3.8 spawn deck.

How it plays differently: the centre is a pit you fight down into and out of (defenders on the rim, attackers jumping
in); the trenches make sunken, covered routes with bridges above them; the flooded craters and curved rims give it
rolling, round sightlines unlike any other stage.

## Modes

- **Zone Control.** Centre: the Great Crater's floor (a disc or polygon of ~9–10 m across at y −1.2…−0.8). Side: the
  downs between the memorial and the trench (flat, y 0, ~9 × 8 m), with the pillbox roof overlooking it.
- **Tower Command.** Suggested (Alpha pushing toward +z; refine it): the crater floor → +x across it → a **climb** up
  the crater's rim wall (1.0 + 1.3; or an incline up a rim ramp if the climb reads badly) → +z over the downs
  (checkpoint 1 at the rim) → a **drop** into the trench → along one straight trench leg (−x) → a **climb** out
  (checkpoint 2 beside it) → +z to the goal in front of the pavilion, ~12 m short of the spawn pad. About 80–90 m.
  A tower rolling down a trench is the picture; make that trench leg wide enough (3.2 m+) and keep its bridges above
  the headroom (or put no bridge over that leg).
- **Boss Battle.** Check the boss can use the crater (nav on the slopes) and the downs. Report.

## The world round it (env)

- Inkopolis is right across the bay here, so the default bay scenery may stay (`bay: true`) if it reads right from the
  stage (the city's skyline across the water, the lighthouse). Judge it in your shots; if the port cranes or anything
  else fight the place, turn `bay` off and build the skyline you want into your backdrop instead.
- Your backdrop: the rest of the Cape's headland: rolling downland running off beyond the stage, pocked with more
  craters (round dimples, some flooded, catching the sky), a coastal path with a fence line, the chalk cliffs continuing
  along the shore (under the stage's long sides too: use `kit.runs` for the cliff faces under the deck edges), the Cape's
  point with its rocks. `edge: 'none'` (cliffs, not pier piles), `boats: false`.
- Gulls stay. The sea here is open and choppy (the default sea is fine; maybe a greener chalk-coast shallows colour).
- Dusk: the memorial lanterns, the pavilion's glass lit from inside.

## Surfaces (your 3 slots)

Suggestions: downland turf (tussocky grass over chalk, wildflower flecks), chalk (white-grey, flint nodules, crumbly),
and sandbags / trench timber (hessian weave or revetment planks). Board-marked concrete for the pavilion and pillboxes
if you can fit it (or use the shared concrete).
