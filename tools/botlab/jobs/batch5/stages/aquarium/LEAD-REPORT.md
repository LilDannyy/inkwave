# Gulper Aquarium, art phase: report after fix round 6 (review 6's list)

Worktree `/Users/danielosling/Desktop/1/st-b5-aquarium`, branch `b5-stage-aquarium`. The round answers LEAD-NOTES "After
review 6" (binding) and `LEAD-REVIEW.json` (review 6). Code head **fe5f080f**, test **5fae88bc**, cards **f7455ca9**.

How it ran:
- **Merge first.** `git merge new-stages` (632398c3, the PUBLIC BETA) was a fast-forward: new-stages already contained this
  branch. No conflict. The lead's uncommitted `COMMON.md` was byte-identical to new-stages' copy, so I restored it before the
  fast-forward. new-stages changed one stage file, `tubeway.js` (exit cooldown 2.5 → 3.5 s, the lead's camping decision),
  plus DESIGN.md and `tests/pipes.js`. All kept.
- **Checks at the merged head, before any edit:** check-maps aquarium / .tower / .zones / .bazookarp / .boss all ok
  (1774 / 1766 / 1774 / 1842 / 1774 pieces); `tests/aquarium-art.js` 36/36.
- **Where it ran.** Everything ran locally, one Electron at a time under SLOTS=3, with WATCHDOG=900000 on page tests. The
  load average ran from 12 to 280. No Mac mini job was sent and nothing was pushed.
- **How the pictures were taken.** A scratch shooter (`scratchpad/aqr7/tools/shoot2.cjs`) resets the slot profile's saved
  settings to DEFAULT_SETTINGS (quality high, fov 82). It saves the paint that followed each picture's own stepped frame and
  turns the bots' brains off. Review 6's evidence folder had been emptied, so every view was re-shot.
- **Before and after.** Before pictures come from a clean `git archive` copy of 632398c3. After pictures come from the code
  head.
- **Untouched.** The untracked `LEAD-REVIEW*.json` are the lead's; I left them alone. `wip` is still on.

## 1. Review 6's list, item by item

**What I followed everywhere:** inkable faces are drawn under the ink in `floorart.js`, in Alpha's frame, so both halves get
them. Props stand within 8.5 cm of a face and below its walkable top. No collider was added. No layout change except the
nosing.

| Item | What it is now | Proof (out/art/) |
|---|---|---|
| **The Feeding Step** (major) | **Sides:** the riser's language carried round the corner. White render over a black-granite skirting with a brass line. Three faience speed lines under a faience wave at the riser mural's height and period. A teak fascia over a brass nosing along the top edge. **Riser:** the same skirting and fascia round its mural; the mural itself is untouched. **Top:** the Feeding Deck's teak planks (staggered joints, dark caulk) inside a brass border, with a brass KEEP CLEAR wave between two rails toward the deck. **Props:** a FEEDING DECK · KEEPERS ONLY plate on each side, and brass quarter-round corner guards on the two front rounded corners. | `r6-pair-fstep-E2/-W2/-top/-front`, each with `-B` and `dusk`; `r6-ink-fstep-E2(-B)` |
| **The Kelp Ramps' parapets** (major) | **Court face:** a granite skirting with a brass line at its foot. The foot is the court, or the promenade past r 21. **Ramp face:** the same skirting along the ramp's rake. **Both faces:** three faience speed lines along the rake under a smooth coping band and its groove. **Top:** the coping. **Props:** a render pilaster over each of the three joints, covering the 3 cm notches 0.23 m to either side, with the speed lines carried across it and a granite foot. A pilaster on both ends. A KELP RAMP · UP TO THE SEA PROMENADE plate on the lowest run's court face. | `r6-pair-parapetW-court/-court2`, `-ramp-mid`, `-ramp-top-W`, `-p-drum` (each with `-B`, `dusk`); `r6-ink-parapetW-court2(-B)` |
| **The whale-tail benches** (major) | **Long faces:** a back-to-back promenade bench: a teak seat apron under a brass-nosed seat edge, upright backrest slats between brass rails, a teak cap, brass end posts. **Ends:** a teak panel in a brass frame. **Top:** teak slats. **Props:** a bronze whale-tail fluke in relief on each end as the armrest (4.6 cm proud, top 9 cm under the bench's top). A WHALE BENCH · GIFT OF THE 1936 SOCIETY plate. | `r6-pair-whale-2/-3` (`-B`, `dusk`); `r6-ink-whale-3(-B)` |
| **The Penguin Steps' head teeth** (minor) | The nosing reaches **r 31.4**: `layout.js` radBox(−120.275, 30.7 → 31.4). The steps' string-courses now end at its face. **Re-baked:** `bake-tiles.mjs` (`baked.js`, the promenade and ground layers), then the AO lightmaps: aquarium **fe6fba15** (1551 rows, 81.6 s) and aquarium.tower **135a7cc7** (1549 rows, 162.2 s). check-maps now counts 1768 / 1760 pieces: the cells under the nosing merged. | `r6-pair-psteps-head`, `-psteps-up` (`-B`, `dusk`): the teeth are gone |
| **The trolley stack** (minor) | **Faces:** nested luggage trolleys: upright bars every 12 cm over the shade inside, luggage on the bottom deck, a thicker steel upright where each of five trolleys ends, steel deck and mid rails, a brass top rail. **Top:** a steel mesh. **Props:** a caster pair under each trolley on both long faces, and three nested brass push bars laid flat on its end. | `r6-pair-tstack/-2` (`-B`, `dusk`); `r6-ink-tstack(-B)` |
| **The lectern** (minor) | **Before:** its old speed lines sat inside its body. **Now** (`dress.js`): a granite skirting, a brass line and three faience speed lines round all four faces, and THE TUBEWAY route-map plate on its court face (ring, lines, stops, name). | `r6-pair-lectern-N`, `-lectern-end` (`-B`, `dusk`) |
| **The four weak faces** (minor; props, all on off-limits blocks) | **The W (E) pylon's radial face:** four fluted render ribs with faience bands and granite feet, clear of the Arch Line's mouth and its sign. A roundel plaque with the coiled gulper and SOUTH (NORTH) GATE (`arch.js` gatehouse). **The plant room's face over the Kelp Balcony:** a louvred vent, an overhead pipe run with flanges, a valve with a red handwheel, and a PLANT ROOM · NO ADMITTANCE plate. **The deep Kelp stop's sides:** a sea-green enamel panel in a stepped, riveted brass frame with three brass speed lines and the roundel. **The ice-cream cart:** under the ink, candy stripes round its skirt and a pinstripe under its lip; GELATO menu boards on both long faces. | `r6-pair-pylonWrad`, `-plantroom(-bal)`, `-kelpdeep-side(2)`, `-cart-N/-S/-E` (`-B`, `dusk`); `r6-ink-cart-N(-B)` |
| **The topiary seam** (nit) | The planters' internal risers and the rounded edges over them now take the bed's own light (shading normal up). They were lit as walls turned from the sun: a dark navy band across the bed. | `r6-pair-topiaryUp-zoom`, `r6-pair-topiaryUp` (`-B`, `dusk`) |
| **The pavilion ink proof** (nit) | Splatted at W(34, 13.06, 2.2) as the review gave it. It lands on the flank wall, over its art. The view is moved back so the wall's art is in frame. | `r6-ink-pstair-wall(-B)`, `r6-pair-pstair-wall` |
| **pipes.js 'cam'** (check) | The shipped build has the integrator's reset: `part('cam')` sets fov and quality to DEFAULT_SETTINGS. | pipes.js **92/92** |

**The stage art cards** were re-made last, from the same hero camera and scene: `layout.art`, `scenes/aquarium-hero.js`,
tangerine-cobalt, the two Kelp Line riders, on the new lightmaps. They were rendered 3840 × 2160, then `cwebp -q 86` at
1920 × 1080 and 480 × 270.

| Picture | What it shows |
|---|---|
| `r6-card-day`, `r6-card-dusk` | The new cards |
| `r6-card-pair-day/-dusk` | Old left, new right |
| `r6-card-crops` | Both riders, old and new |

The only visible change is this round's pylon ribs and roundel.

## 2. Decisions where the list left a gap

1. **The Feeding Step's riser.** The skirting (under 9 cm) and fascia (over 1.06 m) are drawn round the mural (0.1 … 1.06 m).
   The mural is untouched. The side's wave copies the mural's height, amplitude and 14.4 cm period, so the corner reads as one
   band.
2. **The parapet's court face over the court** (about 2.5 m tall) got exactly the review's fix. The plain render field below
   the speed lines is not otherwise broken up; the plate sits in it at eye level.
3. **The trolley stack** took the review's first option (nested trolleys), drawn under the ink. Only the casters and push bars
   are props.
4. **Which way the cart faces** is unclear, so both long faces got a menu board and all four faces the stripes. Its faces are
   inkable (`cover`), so the stripes are drawn under the ink.
5. **The deep Kelp stop** took the review's first option: a framed panel, its field changed from dark brass to sea-green enamel
   so it reads as Tubeway hardware.
6. **The stage art cards were rendered at quality 'low'.** A trial at DEFAULT_SETTINGS (quality high: SSAO, bloom) darkened
   the drum's kelp across the Bravo rider's glow and made it harder to read. A quality-low render reproduces the shipped
   cards pixel for pixel outside this round's changes, so the shipped cards were evidently made with the slot profile's saved
   'low'. Keeping it keeps "the same scene". The trial is in `scratchpad/aqr7/card/`.
7. **The topiary** was fixed by lighting, not by moving the fish. The fish lies entirely on the highest spoke's top; the line
   was the step's riser and rounded edge.

## 3. Online and bots

- **Nothing that crosses the wire changed.** Every client builds the nosing from the layout. The art is built from layout
  numbers and placements on every screen. No record, rule or pipe changed in this round. The 3.5 s cooldown came with the
  merge.
- **Bots** see the nosing as a 0.23 m lip at the steps' head, under stepUp.
  - climb-audit and spawn → mid are unchanged.
  - The Turf War match: stuck 0.1 %, giveUps 0.
- **Not touched:** the Zone Control tank-rim bot bug. LEAD-NOTES puts it in a bots round.

## 4. Tests and results (all local, at the code head)

| Check | Result |
|---|---|
| check-maps aquarium / .tower / .zones / .bazookarp / .boss | ok / ok / ok / ok / ok, **1768 / 1760** / 1768 / 1836 / 1768 pieces |
| tests/aquarium-art.js | **43/43**: the 36 earlier checks and section 10's 7. Programs link, 0 console errors. |
| Section 10 at 632398c3 (the test file run on the clean copy) | **37/43**: 6 of the 7 new checks fail. The ink check is a guard and passes on a plain face too. |
| climb-audit | 144 climbs, 0 barred |
| cover-map | 98 %, largest open circle 12.2 m at (7.5, −67.5) (unchanged) |
| stage-audit turf | **3/3**: lightmap applied (aquarium, 1551 rows = the new bake, not stale); spawn → mid 6.53 / 6.75 s |
| stage-audit tower | **4/4**: lightmap applied (1549 rows = the new bake); 155 m, 100 s to the goal |
| tests/pipes.js | **92/92** |
| Turf War ×1, 180 s, PAGEQ=pipestats | See below |

**Turf War ×1, 180 s, PAGEQ=pipestats:**
- Turf 36.5 / 31. Stuck 0.1 %. Splats 31.
- Rides 17 (0.71 per bot-minute). giveUps 0, longest push at a mouth 0.53 s.
- High-ground arrivals by pipe 18.8 % (6/32).
- Camping 0.125 per landing against a base of 0.0431, so 2.9×: 2 deaths of 16 landings, at gulper:A and kelp~:B.
- The only console lines are the 7 pipestats lines.

**Section 10's checks:**
- (a) the Feeding Step's sides and top;
- (b) the parapets' court and ramp faces;
- (c) the whale-bench slats, the trolley cages and the cart stripes;
- (d) ink over the step and the parapet;
- (e) the lectern plate, the deep stop's panel and the plant room's vent;
- (f) this round's props within 8.5 cm and off walkable tops: 32 placements, farthest 7.9 cm, 0 on a top;
- (g) the Penguin Steps' nosing reaches r 31.4, and the cells end at 31.348 under it.

**Triangles.** A headless count of every placement, both halves:

| Props | Triangles |
|---|---|
| 632398c3 | 463,078 |
| Now | 510,088 |
| **Change** | **+47,010 (+10 %)** |

The +47,010 breaks down as:
- the plates' letters +21.2 k;
- the deep stops' frames and rivets about +8.3 k;
- the plant rooms +3.5 k;
- the pylon ribs and roundel +3.3 k;
- the lectern +3.2 k;
- the flukes 3.1 k;
- the trolley gear 2.5 k;
- the corner guards 1.1 k;
- the pilasters 0.8 k.

`propMeshes` is 6, as before: no draw call added. Every new part rides an existing material bucket.

**Pictures** (`out/art/`, 99 r6- files, each under 300 KB, all looked at):
- `r6-pair-<view>`, `-B`, `r6-pair-dusk-<view>` for 27 views;
- `r6-ink-*`: 6 views, day | dusk, both halves;
- `r6-pair-topiaryUp-zoom`;
- `r6-card-*`.

## 5. Commits and files

| Commit | What |
|---|---|
| 0e7558ec | The Penguin Steps' nosing to r 31.4 (`layout.js`), `baked.js`, both AO lightmaps |
| fe5f080f | The art: `floorart.js`, `dress.js`, `arch.js`, `props.js` |
| 5fae88bc | `tests/aquarium-art.js` section 10 |
| f7455ca9 | The stage art cards |
| e6838878, 48ab4417 | (scratch) The pictures |
| this report's commit | (scratch) This report |

**Files, for the integrator.**
- **Shared files touched: none.**
- Everything is in `src/world/stages/aquarium/` (`layout.js`, `baked.js`, `floorart.js`, `dress.js`, `arch.js`, `props.js`),
  `assets/lightmaps/aquarium{,.tower}.{png,json}`, `assets/stages/aquarium-*.webp` and `tools/botlab/tests/aquarium-art.js`.

## 6. Unfinished, uncertain, worth knowing

- **The topiary.** The dark band is gone. A faint lighter streak where the 9 cm steps meet remains, plus a small dark notch at
  the rim's inner corner (`r6-pair-topiaryUp-zoom`). The step's cast shadow on the lower spoke is real geometry.
- **The whale bench's pixel read** separates before from after on Bravo's half (relative contrast 0.021 → 0.249). On Alpha's
  half the sunlit plank box already read 0.267. The combined check (c) fails without the change through the cages and the
  stripes; the bench alone is weak proof there. The pictures carry it.
- **The parapet's court face** keeps a large plain render field below its speed lines (decision 2).
- **The pylon's ribs** read thin at the Penguin Steps' grazing angle, though they are clear from the promenade.
- **The deep Kelp stop's panel** is dark at dusk in shade.
- **Triangles +47 k** (above). Performance was closed at 18 % under Halyard. The plate letters are the lever if the lead wants
  them back.
- **No stage has a bazookarp lightmap** (aquarium.bazookarp included). Not this round's.
- **Not re-run:** the boss check, tower-check / tower-match, the net tests and the dusk glow probe. Nothing they measure
  changed beyond the nosing.
- **Camping 2.9×** in the one match at the new 3.5 s cooldown. It is single-match noise and belongs to the consolidated pass.
