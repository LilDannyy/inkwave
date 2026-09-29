// Eco-Forest Treehills — the plan: every tier region's outline and the key numbers, in world metres (Alpha at −Z).
// Pure data (imported by layout.js for the ground and by props.js / backdrop dressing, which place things from the same
// numbers). Alpha's half is authored; Bravo's is the 180° twin ((x, z) → (−x, −z)). The east tree-hill (+X) is authored
// whole (it spans both halves); the west one is its twin. Regions share their edges exactly (no gaps, no overlaps).
//
//   heights: G0 the lowland (meadow + gardens) 0 · T1 the terraces 1.3 · T2 the hill's upper tier 2.6 ·
//            T3 the hill's crown 3.9 · SP the spawn deck (the research station's roof: one storey of modules on the
//            base terrace) 3.9
export const G0 = 0, T1 = 1.3, T2 = 2.6, T3 = 3.9, SP = 3.9;

// the station (spawn building): its roof deck is the spawn
export const STATION = { x0: -9, x1: 9, z0: -47, z1: -38 };
export const PAD = [0, SP, -42.5];

// the lowland: a self-symmetric core box (|x| ≤ 15, |z| ≤ 14) + Alpha's garden below it (its corners cut at 30° / 60°)
export const CORE = { x: 15, z: 14 };
// Alpha's garden, split by the rill (a shallow decorative channel, floor −0.3) running from the band's wall to the apron's
// chamfered wall: the strip north of it, the rill, the working garden south of it
export const RILL_Y = -0.3;
export const GARDEN_N = [[-15, -14], [-13.6, -16.2], [15, -16.2], [15, -14]];
export const RILL = [[-13.6, -16.2], [-12.836, -17.4], [15, -17.4], [15, -16.2]];
export const GARDEN_S = [[-12.836, -17.4], [-8, -25], [8, -25], [15, -21], [15, -17.4]];
export const GARDEN = [[-15, -14], [-8, -25], [8, -25], [15, -21], [15, -14]];

// the Seed Vault Plaza at mid (a single piece, self-symmetric): a raised hexagon (1.3) with flat faces north and south
// (the broad ramps), slanted faces (the stairs on SE / NW, climbable walls on SW / NE) and short flats east and west
// where the tower drops off it; the centre zone on its top; the Solar Canopy over it on six pylons (underside 7 m)
export const PLAZA = [[7.3, -2.1], [7.3, 2.1], [3.9, 6.75], [-3.9, 6.75], [-7.3, 2.1], [-7.3, -2.1], [-3.9, -6.75], [3.9, -6.75]];
export const CANOPY = { y: 7.0, R: 9.6, pylons: [[3.3, 5.6], [-3.3, 5.6], [-3.3, -5.6], [3.3, -5.6], [6.3, -2.75], [-6.3, 2.75]] };
// the greenhouse pods flanking it (Alpha's in the south-west quadrant, Bravo's its twin), the meadow's mounds
export const GREENHOUSE = { x: -9, z: -12.0, L: 8, R: 2.15 };
// the mounds: grass banks (w along their heading × d, top) with a broad ramp up each long side (run), turned deg
export const MOUNDS = [{ x: 11.0, z: -10.3, w: 4.2, d: 2.2, top: 0.8, run: 2.0, deg: 30 }, { x: -11, z: -4.8, w: 3.4, d: 1.6, top: 0.6, run: 1.5, deg: -20 }];

// Alpha's base terrace (T1): the station's apron (chequer plate) round its front, its west side up to x −15; and the
// east tree-hill's south lobe (lawn, the left lane) up to the hill's upper tier (z −10), meeting it along x 15
export const APRON = [[-9, -38], [9, -38], [9, -47], [13, -47], [13, -41.547], [15, -38.083], [15, -21], [8, -25], [-8, -25], [-15, -14],
  [-15, -38.083], [-13, -41.547], [-13, -47], [-9, -47]];
export const LOBE = [[15, -36], [21, -25.608], [25, -23.299], [31.5, -12.041], [31.5, -10], [19.5, -10], [19.5, -21], [15, -21]];
// the east tree-hill (authored whole). T1: the band along the lowland + the north strip (Bravo's right lane: the Tower
// Command route down to Bravo's plateau); T2 the upper tier (a C round the crown, open to the reservoir); T3 the crown
export const STRIP = [[15, -21], [19.5, -21], [19.5, 20], [31, 20], [28, 25.196], [28, 30], [25.5, 34.33], [19, 38.083], [15, 38.083]];
export const UPPER = [[19.5, -10], [31.5, -10], [33, -7.402], [33, -4], [26.5, -4], [26.5, 14], [33, 14], [31, 17.464], [31, 20], [19.5, 20]];
export const CROWN = [[26.5, -4], [33, -4], [35.5, 0.33], [35.5, 9.67], [33, 14], [26.5, 14]];
// the wind turbine on the crown (its base is off-limits)
export const TURBINE = { x: 32.6, z: 5, r: 1.6, hub: 15.5, rotor: 7.2 };

// Tower Command (authored on Bravo's side, z > 0): across the meadow, up the band (1.3) and the upper tier (2.6), along
// the upper tier past the crown and the turbine, down onto the north strip (1.3), along Bravo's terrace to the goal
export const TRACK = { x: 24, z: 31, goalX: 6 };

// Zone Control: the meadow's middle (centre), Alpha's terrace east of the spawn stair (side)
export const ZONE_C = [[6.4, -1.6], [6.4, 1.6], [3.4, 5.85], [-3.4, 5.85], [-6.4, 1.6], [-6.4, -1.6], [-3.4, -5.85], [3.4, -5.85]];
export const ZONE_S = [3.5, 14, -36.5, -26.5];

// the reservoir's outline (the playable ground's outer edge), for checks and the backdrop: Alpha's half, from the west
// end of the station's back round the east side to the north; the full ring is this + its twin
export const bounds = { minX: -35.5, maxX: 35.5, minZ: -47, maxZ: 47 };
