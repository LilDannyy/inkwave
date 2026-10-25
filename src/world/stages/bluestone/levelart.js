// Bluestone Junction — the level art: three looks of the same streets, drawn in the level shader UNDER the ink (LAYOUT.levelArt;
// the era engine hands it to the level material after its own extension, docs/STAGE-MODS.md "Level material"). Everything
// here changes the bare surface `base` (like a mural) or adds light at dusk; no geometry, no collider, no paint cell changes.
//
// Every block carries aArt = (style, ±(param + 1)) (artOf below, through the era engine's level.geomAttrs: the sign is the
// half — Bravo's twins are drawn in Alpha's frame, (x, z) → (−x, −z)). Each fragment knows its ERA from the era engine's
// own fragBase (eraOneHot: shared surfaces by their side of the front, era pieces by their own era), so the front rewrites
// a facade along a clean line as it passes: a shopfront goes from timber and gilt to plate glass to pearl and light.
//
//   BLD     the buildings (DESIGN.md §5.1): per building a family (the GPO, the Young & Jackfish, the Royal Arcade, the
//           Customs House, the Engine House, its boiler house and tram shed, the viaduct, the Boathouse), bays and storeys
//           from uBsB; a bluestone plinth, string courses and a cornice line in every era; ground floors and windows per
//           era: 1880s small-paned timber shopfronts with gilt fascias, hoardings, sash windows lit by gas; TODAY plate
//           glass, painted fascias, lofts, posters; the 3000s pearl glass, white-gold light seams, vertical gardens
//   COVER   every cover block (crates, bins, bollard blocks, troughs, benches, planters, carts, the fountain, the statue
//           plinth, the café tables, the museum's coal bin and buffer stop …): its own material and trim per era
//   STRUCT  the small structures (phone kiosks, ticket booths, the poster column, the cab shelters, the news kiosk, the
//           tram shelter, the ferry office, the boat shed, the goods wagon, the produce stacks, the grip car …)
//   TER     raised floors' faces (bluestone retaining walls with a coping, the concourse's moulded plinth, the docks)
//   GROUND  the streets: bluestone kerbs and dish drains, the carriageway's tram tracks per era (cable slot rails → grooved
//           tram rails → a light-rail guideway), road markings TODAY, light guide lines in the 3000s; the arcade's
//           floor (dust and boards → mosaic → lit mosaic); the turntable ring on the forecourt (mural 10) and the
//           concourse's inlaid dial (mural 5)
//   STATION the station's columns (a sandstone pedestal under a fluted iron shaft), the clock beam, the drum
//   STAIR   stair flanks (a stone string with a moulding; the iron flights' stringers)
//   DECK    plank decks (the balcony, the punt, the bridge, the gangway): edge boards and nail rows; glass at night
// Light: windows lit at dusk (gas-warm in the 1880s, warm white TODAY, pearl in the 3000s), the 3000s' light seams
// (white-gold, faint by day), lamp pools on the floors under the shared lamp spots (DESIGN §5.7) in the era's lamp colour.
// Palette (DESIGN §5): mid values and low chroma on anything big; team ink stays the loudest colour on screen.
// Imports nothing (layout.js stays importable in Node).

// ------------------------------------------------------------------------------------------------ the data (Alpha's half)
export const ART = { BLD: 1, COVER: 2, STRUCT: 3, TER: 4, GROUND: 5, STATION: 6, STAIR: 7, DECK: 8 };
// building families
export const FAM = { GPO: 1, HOTEL: 2, ARCADE: 3, CUSTOMS: 4, ENGINE: 5, SHED: 6, VIADUCT: 7, BOAT: 8, PIER: 9 };
// buildings: [family, bay (m), ground-floor height, storey height, wall top] + [plinth, front mask (+x 1, −x 2, +z 4, −z 8),
// variant, sign band bottom]: the bays are laid out centred on each face; the front mask says which faces are street fronts
export const BLDS = [
  /* 0 gpo        */ [FAM.GPO, 2.15, 3.0, 3.0, 6.0, 0.55, 1 | 2 | 4 | 8, 0, 2.55],
  /* 1 hotel      */ [FAM.HOTEL, 2.2, 3.1, 2.95, 9.0, 0.45, 2 | 4 | 8 | 1, 0, 2.6],
  /* 2 oriel      */ [FAM.HOTEL, 1.45, 3.1, 2.95, 9.0, 0.0, 0, 1, 2.6],
  /* 3 arch       */ [FAM.HOTEL, 2.0, 3.1, 2.95, 9.0, 0.0, 0, 2, 2.6],
  /* 4 arch pier  */ [FAM.PIER, 1.0, 3.8, 3.0, 3.8, 0.45, 15, 0, 3.0],
  /* 5 arcade E   */ [FAM.ARCADE, 3.5, 3.6, 2.4, 6.0, 0.4, 1 | 2, 0, 2.7],
  /* 6 arcade W   */ [FAM.ARCADE, 3.5, 3.6, 2.4, 6.0, 0.4, 1, 1, 2.7],
  /* 7 customs    */ [FAM.CUSTOMS, 2.5, 3.2, 2.9, 9.0, 0.6, 1 | 2 | 4 | 8, 0, 2.6],
  /* 8 engine     */ [FAM.ENGINE, 3.17, 4.4, 4.6, 9.0, 0.6, 4, 0, 6.6],
  /* 9 boiler     */ [FAM.SHED, 2.67, 3.3, 2.7, 6.0, 0.6, 1 | 4, 0, 4.6],
  /* 10 tram shed */ [FAM.SHED, 3.0, 3.3, 2.7, 6.0, 0.6, 2 | 4, 1, 4.6],
  /* 11 viaduct   */ [FAM.VIADUCT, 4.0, 3.4, 3.0, 4.1, 0.5, 1, 0, 3.4],
  /* 12 boathouse */ [FAM.BOAT, 1.75, 2.4, 2.4, 2.4, 0.3, 1 | 2 | 4 | 8, 0, 1.9],
];
const COVER = { crates: 0, bins: 1, bollards: 2, trough: 3, bench: 4, planter: 5, 'ring-bed': 6, cart: 7, fountain: 8, 'statue-plinth': 9, cafe: 10,
  'coal-bin': 11, buffer: 12, 'turntable-bench': 13, 'mooring-post': 14, 'deck-racks': 15, 'deck-plinth': 16, 'bike-dock': 17, 'bridge-lamp': 18 };
const PLANTERS = new Set(['planter', 'kerb-planter', 'ring-bed-planter', 'deck-planter', 'balcony-planter', 'gpo-planter', 'halo-planter', 'garden-planter']);
const STRUCT = { 'arcade-kiosk': 18, 'flower-stall': 19, 'phone-kiosk': 0, 'ticket-booth': 1, 'poster-column': 3, 'cab-shelter': 4, 'cabmen-shelter': 5, 'news-kiosk': 6, 'tram-shelter': 7,
  'ferry-office': 8, 'boat-shed': 9, 'goods-wagon': 10, 'crates-stack': 11, 'grip-car': 12, 'ferry-box': 13, 'tram-island': 14, 'balcony-post': 15, 'gpo-pier': 16, chimney: 17,
  glasshouse: 20 };
const TER = { terrace: 0, 'prow-place': 1, 'gpo-terrace': 2, 'customs-dock': 3, 'spawn-deck': 4, concourse: 5 };
const GROUND = { street: 0, carriageway: 1, circus: 2, 'arcade-floor': 3, kerb: 4 };
const DECKS = { balcony: 0, 'balcony-landing': 0, punt: 1, 'ferry-landing': 1, 'iron-bridge': 2, 'dock-gangway': 3, 'floating-garden': 4, halo: 5, 'hotel-stair-landing': 5, 'boat-stair-landing': 5, 'river-stair-landing': 5 };
const STAIRS = { 'knee-flight': 1, 'balcony-stair': 1, 'hotel-stair': 2, 'boat-stair': 2, 'river-stair': 2, 'boathouse-stair': 3 };

// the block → (style, param) map: the level's per-vertex attribute aArt (the half in the sign of y)
export function makeArtOf(layout) {
  const nS = layout.single.length, nH = layout.half.length;
  return (b) => {
    const side = b.id >= nS + nH && b.id < nS + 2 * nH ? -1 : 1;
    const ax = (b.center.x * side), az = (b.center.z * side);   // the centre in Alpha's frame
    const v = (style, p) => [style, side * (p + 1)];
    const t = b.tag;
    if (!t) return [0, 0];
    if (t === 'gpo') return v(ART.BLD, 0);
    if (t === 'hotel') return v(ART.BLD, 1);
    if (t === 'hotel-oriel') return v(ART.BLD, 2);
    if (t === 'hotel-arch') return v(ART.BLD, 3);
    if (t === 'arch-pier') return v(ART.BLD, 4);
    if (t === 'arcade-wall') return v(ART.BLD, ax > -28.5 ? 5 : 6);
    if (t === 'customs-house') return v(ART.BLD, 7);
    if (t === 'engine-house') return v(ART.BLD, 8);
    if (t === 'boiler-house') return v(ART.BLD, 9);
    if (t === 'tram-shed') return v(ART.BLD, 10);
    if (t === 'viaduct' || t === 'viaduct-pier') return v(ART.BLD, 11);
    if (t === 'boathouse' || t === 'boathouse-base') return v(ART.BLD, 12);
    // (fix round 1) the floating garden's 2.6 m piece (garden-01: DESIGN's glasshouse) is drawn as a glasshouse, its own
    // style (the piece, its tag and collider unchanged)
    if (t === 'garden-planter' && b.half && b.half.y > 1.0) return v(ART.STRUCT, STRUCT.glasshouse);
    if (PLANTERS.has(t)) return v(ART.COVER, COVER.planter);
    if (t in COVER) return v(ART.COVER, COVER[t]);
    if (t === 'ticket-booth') return v(ART.STRUCT, Math.abs(az) > 30 ? 2 : 1);
    if (t in STRUCT) return v(ART.STRUCT, STRUCT[t]);
    if (t in TER) return v(ART.TER, TER[t]);
    if (t === 'terrace-base' || t === 'prow-place-base' || t === 'gpo-terrace-base' || t === 'spawn-deck-base') return v(ART.TER, TER[t.replace('-base', '')]);
    if (t in GROUND) return v(ART.GROUND, GROUND[t]);
    if (t === 'street-base' || t === 'carriageway-base' || t === 'arcade-floor-base') return v(ART.GROUND, GROUND[t.replace('-base', '')]);
    if (t === 'column') return v(ART.STATION, b.center.y < 3.3 ? 0 : 1);
    if (t === 'clock-beam') return v(ART.STATION, 2);
    if (t === 'drum') return v(ART.STATION, 3);
    if (t in DECKS) return v(ART.DECK, DECKS[t]);
    if (t in STAIRS) return v(ART.STAIR, STAIRS[t]);
    if (/steps|stair|ramp/.test(t)) return v(ART.STAIR, 0);
    return [0, 0];
  };
}

// the six shared lamp spots per half (Alpha's frame; the twin mirrored): DESIGN §5.7's spots were drawn for the X — on the Z
// four of them stand in the river or on a walkable deck — so each stands in a planter (a roof top nobody stands on) where
// the street needs light: Swimston's west kerb at Customs Lane and at the knee, the GPO terrace over the quay, the circus
// ring by the hotel's arch and by the boat shed, the knee by the Customs House. Their pools light the floors at dusk
export const LAMPS = [[-25.3, -44.0], [-25.3, -23.0], [-10.3, -35.5], [-4.4, -15.6], [8.75, -10.53], [-16.2, -3.2]];

// Tartar's wires (DESIGN §3.4: the warning's pulses run out along them from the dome; LEAD-NOTES: "real overhead wires"):
// five spans per half from the drum's face out over the streets, hung on iron brackets at the parapets and on timber poles
// standing on roof tops (the Boathouse's racks, the ferryman's box, the dock's crates), never lower than 4.5 m over a route.
// Each anchor: [x, y, z, kind] — 'drum' (a bracket on the drum), 'wall' (a bracket on a parapet), 'pole' (a pole whose foot
// stands at y0: [x, y, z, 'pole', y0]). eras.pulses (layout.js) and the wire props (dress.js) both follow wirePath()
export const WIRES = [
  [[-3.1, 9.3, -7.75, 'drum'], [-17.0, 8.4, -18.55, 'wall'], [-26.05, 6.6, -30.0, 'wall'], [-15.95, 6.4, -43.0, 'wall'], [-21.0, 9.1, -69.95, 'wall']],   // up Swimston
  [[-7.75, 9.3, -3.1, 'drum'], [-25.95, 9.1, -2.6, 'wall'], [-33.05, 9.1, -11.4, 'wall'], [-36.55, 5.0, -28.0, 'wall'], [-36.55, 5.0, -47.0, 'wall']],   // Prow Place, Hoki Lane
  [[1.2, 9.3, -8.05, 'drum'], [-3.45, 9.0, -20.5, 'wall'], [-9.45, 6.4, -42.0, 'wall']],                                                                   // the quay
  [[5.75, 9.3, -5.75, 'drum'], [18.2, 6.4, -22.2, 'pole', 3.4], [14.4, 5.6, -46.95, 'pole', 1.86]],                                                       // the punt crossing
  [[-8.1, 9.3, 0.6, 'drum'], [-33.05, 9.1, -2.6, 'wall'], [-34.74, 5.4, 5.0, 'pole', 2.2]],                                                               // the knee's river walk
];
// a wire's polyline: each span sagging (sag × its length / 10, at least 0.15 m) through n points
export function wirePath(anchors, n = 8) {
  const out = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), sag = Math.max(0.15, L * 0.03);
    for (let k = i ? 1 : 0; k <= n; k++) { const t = k / n; out.push([+(a[0] + (b[0] - a[0]) * t).toFixed(3), +(a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag).toFixed(3), +(a[2] + (b[2] - a[2]) * t).toFixed(3)]); }
  }
  return out;
}

const lin = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2)); };

// the level-material extension (night: an object whose .value is the environment's night factor)
export function levelArt({ grate = false, night = { value: 0 }, lamps = ['#ffe0b8', '#ffd9a8', '#eef4ff'], lampPts = LAMPS } = {}) {
  if (grate) return null;
  const B = new Float32Array(16 * 3 * 4);
  BLDS.forEach((r, i) => B.set([r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[0], 0, 0, 0], i * 12));
  const LP = new Float32Array(8 * 4); lampPts.slice(0, 8).forEach(([x, z], i) => LP.set([x, z, 4.2, 1], i * 4));
  const LC = lamps.slice(0, 3).map((h) => lin(h));
  return {
    key: 'bsart',
    uniforms: {
      uBsNight: night, uBsB: { value: B }, uBsLamp: { value: LP }, uBsLampN: { value: Math.min(8, lampPts.length) },
      uBsLampC: { value: new Float32Array(LC.flat()) },
    },
    vertPars: VPARS, vertMain: VMAIN, fragPars: FPARS, fragBase: FBASE, fragEmissive: FEMIT, fragMural: FMURAL,
  };
}

const VPARS = /* glsl */`
attribute vec2 aArt;
varying vec2 vBsArt;`;
const VMAIN = /* glsl */`
vBsArt = aArt;`;

// ------------------------------------------------------------------------------------------------ GLSL: helpers
const FPARS = /* glsl */`
varying vec2 vBsArt;
uniform float uBsNight;
uniform vec4 uBsB[48];
uniform vec4 uBsLamp[8];
uniform int uBsLampN;
uniform vec3 uBsLampC[3];
vec3 gBsLit = vec3(0.0);        // emissive under the ink: windows lit at dusk (fragEmissive)
vec3 gBsGlow = vec3(0.0);       // the 3000s' light seams and lines: faint by day, bright at dusk
vec3 gBsRoom = vec3(0.0);       // (fix round 1) the rooms seen through glass: their own light, by day and brighter at dusk
float gBsTop = 0.0;             // a floor (lamp pools land here)
float gBsOld = 0.0;             // (fix round 1) 1880s-only paper on shared walls (hoardings, bills): it flickers in the warning
int gBsEra = 0;
float bsAA(float d, float w) { return clamp(0.5 - d / max(w, 1e-4), 0.0, 1.0); }
float bsBox(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float bsRect(vec2 p, vec2 a, vec2 b, float w) { return bsAA(bsBox(p, (a + b) * 0.5, (b - a) * 0.5), w); }
float bsH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 bsC(float r, float g, float b) { return pow(vec3(r, g, b), vec3(2.2)); }
float bsLum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// an arch-headed opening: the box (c, h) with a half-round head of radius h.x on top
float bsArchD(vec2 p, vec2 c, vec2 h) {
  vec2 q = p - c;
  float body = bsBox(q, vec2(0.0, -h.x * 0.5), vec2(h.x, h.y - h.x * 0.5));
  float head = length(q - vec2(0.0, h.y - h.x)) - h.x;
  return q.y > h.y - h.x ? head : body;
}
// "lettering" seen from a little way off: a row of letter-sized blocks with word gaps, centred at c, cap height h, width w
float bsText(vec2 p, vec2 c, float h, float w, float seed, float pw) {
  vec2 q = p - c;
  if (abs(q.y) > h * 0.5 || abs(q.x) > w * 0.5) return 0.0;
  float cw = h * 0.72, k = floor((q.x + w * 0.5) / cw), lx = fract((q.x + w * 0.5) / cw);
  float gap = step(0.82, bsH(vec2(k, seed)));
  float stem = bsAA(abs(lx - 0.5) - 0.3, pw / cw) * (1.0 - gap);
  float hole = bsAA(abs(lx - 0.5) - 0.12, pw / cw) * bsAA(abs(q.y / h) - 0.22, pw / h) * step(0.45, bsH(vec2(k, seed + 3.0)));
  return stem * (1.0 - hole);
}
// the 3000s' living walls: planting modules (0.6 m) in thin pearl frames, leaves in clusters with highlights and shade
vec3 bsLeaves(vec2 p, float pw) {
  vec2 m = fract(p / 0.6), id = floor(p / 0.6);
  vec2 c = p * 9.0, ci = floor(c), cf = fract(c) - 0.5;
  float h = h21(ci + id * 7.0);
  vec2 o = (vec2(h21(ci + 1.7), h21(ci + 5.3)) - 0.5) * 0.4;
  float leaf = 1.0 - smoothstep(0.24, 0.42, length((cf - o) * vec2(1.0, 1.6)));
  vec3 g = mix(bsC(0.2, 0.32, 0.16), bsC(0.4, 0.56, 0.28), h) * (0.55 + 0.6 * leaf);
  if (h > 0.93) g = mix(g, bsC(0.92, 0.9, 0.86), leaf);               // white flowers here and there
  float frame = 1.0 - smoothstep(0.0, 0.035, min(min(m.x, 1.0 - m.x), min(m.y, 1.0 - m.y)) * 0.6);
  return mix(g, bsC(0.9, 0.9, 0.88), frame * 0.85);
}
// a living-wall coverage mask: whole modules (no blotches), grown over part of a face
float bsGreen(vec2 p, float seed, float k) { vec2 id = floor(p / 0.6); return step(1.0 - k, h21(floor(id / vec2(3.0, 2.0)) + seed)); }
// glass: a dark pane reflecting the sky (lighter up top, a soft diagonal sheen); lit from inside at dusk by k
vec3 bsGlass(vec2 p, float y0, float y1, float tone) {
  float g = smoothstep(y0, y1, p.y);
  vec3 c = mix(bsC(0.10, 0.12, 0.14), bsC(0.33, 0.39, 0.45), g * 0.8) * tone;
  c *= 0.97 + 0.06 * smoothstep(0.3, 0.7, fract((p.x * 0.7 + p.y) * 0.18));
  return c;
}
// ---- (fix round 1) interiors behind the glass: the view ray traced into a box room behind a pane ("interior mapping"),
// so a shopfront, a pavilion or a shelter shows a lit room with depth (its back wall, its side walls receding, its floor
// and ceiling) that moves with the camera, instead of a flat dark or cream pane
// the view ray in a wall's frame: x along the face's u (fu.x), y up, z into the wall
vec3 bsViewIn() {
  vec3 Vw = normalize(vWPos - cameraPosition);
  vec3 T = normalize(vFaceTan - vWNorm * dot(vFaceTan, vWNorm));
  return vec3(dot(Vw, T), Vw.y, max(-dot(Vw, vWNorm), 0.05));
}
// a shop's goods colour: kind 0 chocolatier, 1 toys, 2 barber's bottles, 3 café, 4 books and papers, 5 florist, 6 clothes,
// 7 rowing eights, 8 a glasshouse's plants, 9 a shelter, 10 an office; mid chroma (team ink stays the loudest)
vec3 bsGoodC(float kind, float hs, int E) {
  vec3 c;
  if (kind < 0.5) c = hs < 0.3 ? bsC(0.34, 0.2, 0.14) : (hs < 0.55 ? bsC(0.52, 0.32, 0.2) : (hs < 0.8 ? bsC(0.78, 0.58, 0.6) : bsC(0.88, 0.82, 0.7)));
  else if (kind < 1.5) c = hs < 0.25 ? bsC(0.62, 0.26, 0.22) : (hs < 0.45 ? bsC(0.3, 0.42, 0.62) : (hs < 0.65 ? bsC(0.36, 0.54, 0.34) : (hs < 0.82 ? bsC(0.86, 0.8, 0.64) : bsC(0.62, 0.46, 0.3))));
  else if (kind < 2.5) c = hs < 0.4 ? bsC(0.5, 0.36, 0.18) : (hs < 0.7 ? bsC(0.3, 0.42, 0.34) : bsC(0.6, 0.66, 0.74));
  else if (kind < 3.5) c = hs < 0.5 ? bsC(0.92, 0.9, 0.86) : (hs < 0.75 ? bsC(0.58, 0.4, 0.28) : bsC(0.8, 0.62, 0.58));
  else if (kind < 4.5) c = hs < 0.2 ? bsC(0.5, 0.2, 0.18) : (hs < 0.4 ? bsC(0.22, 0.3, 0.42) : (hs < 0.6 ? bsC(0.3, 0.4, 0.3) : (hs < 0.8 ? bsC(0.78, 0.72, 0.58) : bsC(0.4, 0.3, 0.24))));
  else if (kind < 5.5) c = hs < 0.35 ? bsC(0.32, 0.46, 0.26) : (hs < 0.55 ? bsC(0.8, 0.5, 0.58) : (hs < 0.75 ? bsC(0.92, 0.9, 0.86) : bsC(0.86, 0.74, 0.4)));
  else if (kind < 6.5) c = hs < 0.3 ? bsC(0.24, 0.26, 0.32) : (hs < 0.55 ? bsC(0.62, 0.56, 0.48) : (hs < 0.8 ? bsC(0.5, 0.3, 0.3) : bsC(0.86, 0.84, 0.8)));
  else if (kind < 7.5) c = hs < 0.5 ? bsC(0.78, 0.6, 0.38) : bsC(0.94, 0.94, 0.92);
  else c = mix(bsC(0.22, 0.36, 0.18), bsC(0.42, 0.58, 0.3), hs);
  if (E == 0) c = mix(c, vec3(bsLum(c)) * vec3(1.1, 0.95, 0.75), 0.4);   // the 1880s: browner goods under gas light
  return c;
}
// a wall of the room: u along it, v up (the floor at 0), y1 its ceiling
vec3 bsShopWall(vec2 uv, float kind, float seed, int E, float y1, bool back) {
  float u = uv.x, v = uv.y;
  vec3 wallC = kind < 0.5 ? bsC(0.6, 0.48, 0.42) : (kind < 1.5 ? bsC(0.76, 0.72, 0.6) : (kind < 2.5 ? bsC(0.86, 0.86, 0.84) : (kind < 3.5 ? bsC(0.56, 0.42, 0.3) : (kind < 4.5 ? bsC(0.5, 0.36, 0.26) : (kind < 6.5 ? bsC(0.8, 0.78, 0.72) : bsC(0.86, 0.86, 0.84))))));
  if (E == 0) wallC = mix(wallC, bsC(0.36, 0.26, 0.18), 0.6);
  if (E == 2) wallC = mix(wallC, bsC(0.94, 0.94, 0.92), 0.6);
  vec3 c = wallC;
  if (kind > 6.5 && kind < 7.5) {
    // the boathouse: rowing eights racked along a timber wall (long hulls, three high), oars upright between them, planting
    // in pots along the floor
    c = mix(bsC(0.46, 0.36, 0.27), bsC(0.56, 0.46, 0.36), step(0.5, fract(v / 0.16))) * (0.9 + 0.1 * bsH(vec2(floor(u / 1.2), 3.0)));
    float pot = step(v, 0.42) * bsAA(abs(fract(u / 1.1) - 0.5) - 0.18, 0.02);
    c = mix(c, mix(bsC(0.3, 0.46, 0.26), bsC(0.85, 0.85, 0.82), step(v, 0.2)), pot);
    float r = floor((v - 0.45) / 0.55), ly = (v - 0.45) - r * 0.55;
    float hull = step(0.0, r) * step(r, 2.0) * bsAA(abs(ly - 0.24) - 0.12 * (1.0 - pow(abs(fract(u / 9.0) * 2.0 - 1.0), 6.0)), 0.01);
    c = mix(c, bsGoodC(7.0, bsH(vec2(r, seed)), E), hull);
    c = mix(c, bsC(0.5, 0.38, 0.26), bsAA(abs(ly - 0.06) - 0.025, 0.01) * step(0.0, r) * step(r, 2.0) * step(0.85, fract(u / 1.5)));
    float oar = bsAA(abs(fract(u / 2.3) - 0.5) - 0.012, 0.01) * step(v, 2.0);
    return mix(c, bsC(0.6, 0.48, 0.32), oar);
  }
  if (kind > 7.5 && kind < 8.5) {
    // a glasshouse: benches of potted plants under hanging greenery, a white frame behind
    float pot = step(v, 0.95) * step(0.55, v) * bsAA(abs(fract(u / 0.45) - 0.5) - 0.3, 0.02);
    vec3 leaf = bsLeaves(vec2(u, v), 0.01);
    c = mix(bsC(0.86, 0.88, 0.86), leaf, step(0.9, v) * step(0.3, h21(floor(vec2(u, v) / 0.6) + seed)));
    c = mix(c, leaf, step(v, 1.6) * step(0.85, v));
    c = mix(c, bsC(0.62, 0.42, 0.32), pot);
    return mix(c, bsC(0.9, 0.9, 0.88), step(v, 0.55));
  }
  if (kind > 8.5 && kind < 9.5) {
    // a shelter: a bench along the back (a moss seat on pearl in the 3000s, slats otherwise), a lit route map over it
    float seat = bsAA(abs(v - 0.47) - 0.05, 0.01), bk = bsAA(abs(v - 0.78) - 0.16, 0.01) * step(0.5, fract(v / 0.08) + 0.3);
    c = mix(c, E == 2 ? bsC(0.5, 0.6, 0.4) : bsC(0.55, 0.42, 0.28), max(seat, bk * float(back)));
    float map = bsAA(bsBox(vec2(fract(u / 2.4) * 2.4, v), vec2(1.2, 1.45), vec2(0.5, 0.3)), 0.01) * float(back);
    vec3 mc = E == 2 ? bsC(0.24, 0.28, 0.36) : bsC(0.84, 0.82, 0.74);
    mc = mix(mc, E == 2 ? bsC(0.95, 0.88, 0.7) : bsC(0.3, 0.42, 0.6), bsAA(abs(v - 1.45 - 0.12 * sin(u * 4.0)) - 0.012, 0.006));
    return mix(c, mc, map);
  }
  if (kind > 10.5) {
    // the cable tramway's engine hall: brick walls, the great winding wheels (iron rims and spokes) and their shafts
    c = E == 0 ? bsC(0.42, 0.26, 0.2) : (E == 1 ? bsC(0.6, 0.5, 0.42) : bsC(0.86, 0.86, 0.88));
    vec2 wc = vec2(mod(u, 4.2) - 2.1, v - 2.2);
    float rr = length(wc), ang = atan(wc.y, wc.x);
    float rim = bsAA(abs(rr - 1.55) - 0.1, 0.02), hub = bsAA(rr - 0.22, 0.02);
    float spoke = bsAA(abs(fract(ang / 6.2832 * 8.0 + 0.5) - 0.5) * rr * 0.785 - 0.045, 0.02) * step(rr, 1.5);
    vec3 iron = E == 0 ? bsC(0.16, 0.17, 0.17) : bsC(0.3, 0.38, 0.32);
    c = mix(c, iron, clamp(rim + hub + spoke, 0.0, 1.0));
    c = mix(c, iron * 1.3, bsAA(abs(v - 0.5) - 0.12, 0.02));   // the bed plate
    return c;
  }
  if (kind > 9.5) {
    // an office: a desk under the window, charts of the river and timetables pinned up, a lamp
    float desk = step(0.7, v) * step(v, 0.78) + step(v, 0.7) * step(0.85, fract(u / 1.2)) * 0.9;
    c = mix(c, E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.42, 0.3, 0.2), clamp(desk, 0.0, 1.0));
    vec2 pc = vec2(fract(u / 0.9), (v - 1.2) / 0.6);
    float paper = step(0.12, pc.x) * step(pc.x, 0.88) * step(0.0, pc.y) * step(pc.y, 1.0) * step(0.3, bsH(vec2(floor(u / 0.9), seed)));
    vec3 pcol = E == 2 ? bsC(0.32, 0.38, 0.48) : bsC(0.86, 0.82, 0.7);
    pcol = mix(pcol, E == 2 ? bsC(0.95, 0.88, 0.7) : bsC(0.35, 0.4, 0.5), bsAA(abs(fract(pc.y * 5.0) - 0.5) - 0.38, 0.05) * step(0.2, pc.x) * step(pc.x, 0.8));
    return mix(c, pcol, paper);
  }
  if (kind > 1.5 && kind < 2.5) {
    // the barber's: white tiles, a long mirror over a shelf of bottles; on the back wall two barber's chairs (red leather
    // on chrome pedestals) facing the mirror
    float mir = step(1.05, v) * step(v, 1.85);
    float tile = bsAA((0.5 - abs(fract(u / 0.15) - 0.5)) * 0.15 - 0.004, 0.006) + bsAA((0.5 - abs(fract(v / 0.15) - 0.5)) * 0.15 - 0.004, 0.006);
    c = mix(c, c * 0.86, clamp(tile, 0.0, 1.0));
    c = mix(c, mix(bsC(0.62, 0.68, 0.72), bsC(0.85, 0.88, 0.9), smoothstep(1.05, 1.85, v)), mir);
    float bot = step(0.88, v) * step(v, 0.88 + 0.08 + 0.08 * bsH(vec2(floor(u / 0.07), seed))) * step(0.3, fract(u / 0.07));
    c = mix(c, bsGoodC(2.0, bsH(vec2(floor(u / 0.07), seed + 2.0)), E), bot * step(0.85, v));
    if (back) {
      float cu = mod(u, 1.6) - 0.8;
      float seat = bsAA(bsBox(vec2(cu, v), vec2(0.0, 0.55), vec2(0.3, 0.07)), 0.01), bk = bsAA(bsBox(vec2(cu, v), vec2(0.0, 0.95), vec2(0.24, 0.32)), 0.01);
      float arm = bsAA(bsBox(vec2(abs(cu), v), vec2(0.3, 0.7), vec2(0.04, 0.09)), 0.01), ped = bsAA(bsBox(vec2(cu, v), vec2(0.0, 0.24), vec2(0.06 + 0.12 * step(v, 0.06), 0.24)), 0.01);
      c = mix(c, E == 2 ? bsC(0.86, 0.86, 0.9) : bsC(0.82, 0.82, 0.84), ped);
      c = mix(c, E == 0 ? bsC(0.32, 0.16, 0.12) : (E == 1 ? bsC(0.5, 0.14, 0.12) : bsC(0.9, 0.9, 0.88)), max(max(seat, bk), arm));
    }
    return c;
  }
  if (v < 0.85) {
    // the counter and the cabinets under the shelves (the counter's top lighter)
    c = E == 2 ? bsC(0.9, 0.9, 0.88) : (E == 0 ? bsC(0.3, 0.2, 0.14) : bsC(0.38, 0.28, 0.2));
    c *= 0.86 + 0.14 * step(0.5, fract(u / 0.6));
    return mix(c, c * 1.35, step(0.78, v));
  }
  if (v > y1 - 0.25) return c * 1.12;
  // shelves every 0.42 m with goods standing on each
  float sh = 0.42, r = floor((v - 0.85) / sh), ly = (v - 0.85) - r * sh;
  float cw = kind > 3.5 && kind < 4.5 ? 0.055 : (kind > 5.5 && kind < 6.5 ? 0.11 : 0.18);
  float ci = floor(u / cw), lx = fract(u / cw);
  float hs = bsH(vec2(ci + seed * 7.0, r + seed));
  float ih = (kind > 3.5 && kind < 4.5 ? 0.2 : 0.08) + (kind > 5.5 && kind < 6.5 ? 0.3 : 0.2) * bsH(vec2(ci, r + 3.1 + seed));
  float gap = kind > 3.5 && kind < 4.5 ? 0.04 : 0.1;
  float item = step(0.03, ly) * step(ly, 0.03 + ih) * step(gap, lx) * step(lx, 1.0 - gap) * step(0.16, hs);
  if (kind > 0.5 && kind < 1.5 && hs > 0.8) item *= bsAA(length(vec2((lx - 0.5) * cw, ly - 0.03 - ih * 0.5)) - ih * 0.5, 0.01) + 0.0;   // a teddy: round
  vec3 ic = bsGoodC(kind, hs, E);
  if (kind < 0.5) ic = mix(ic, bsC(0.8, 0.64, 0.32), bsAA(abs(ly - 0.03 - ih * 0.55) - 0.008, 0.006));   // the chocolates' gold ribbons
  if (kind > 4.5 && kind < 5.5) ic = mix(ic, bsC(0.3, 0.44, 0.24), step(ly, 0.03 + ih * 0.45));       // the flowers' stems and buckets
  c = mix(c, ic * (0.85 + 0.25 * step(0.5, lx)), item);
  vec3 bc = E == 2 ? bsC(0.94, 0.92, 0.86) : (E == 0 ? bsC(0.42, 0.3, 0.2) : bsC(0.62, 0.5, 0.36));
  return mix(c, bc, step(ly, 0.03));
}
// the room: q = the point on the pane (x along the face's u, centred on the window; y up from the street), V the view
// ray in the wall's frame, R = (half width, floor y, ceiling y, depth). Returns the colour seen (before the glass)
vec3 bsRoom(vec2 q, vec3 V, vec4 R, float kind, float seed, int E) {
  float tB = R.w / V.z;
  float tS = V.x > 0.0 ? (R.x - q.x) / max(V.x, 1e-4) : (R.x + q.x) / max(-V.x, 1e-4);
  float tF = V.y > 0.0 ? (R.z - q.y) / max(V.y, 1e-4) : (q.y - R.y) / max(-V.y, 1e-4);
  float t = max(min(tB, min(tS, tF)), 0.0);
  vec3 h = vec3(q, 0.0) + V * t;
  float y = h.y - R.y, yc = R.z - R.y;
  vec3 c;
  if (t >= tB - 1e-4) c = bsShopWall(vec2(h.x + R.x, y), kind, seed, E, yc, true);
  else if (t >= tS - 1e-4) c = bsShopWall(vec2(h.z + (V.x > 0.0 ? 5.3 : 9.7), y), kind, seed + 1.7, E, yc, false) * 0.82;
  else if (V.y < 0.0) {
    // the floor: boards (1880s), small black-and-white tiles (TODAY), pale stone (3000s)
    vec2 f = h.xz;
    if (E == 0) c = bsC(0.36, 0.26, 0.18) * (0.85 + 0.25 * bsH(vec2(floor(f.x / 0.18), 3.0)));
    else if (E == 1) c = mix(bsC(0.82, 0.8, 0.74), bsC(0.18, 0.18, 0.2), mod(floor(f.x / 0.3) + floor(f.y / 0.3), 2.0));
    else c = bsC(0.88, 0.88, 0.86);
    c *= 0.8;
  } else {
    // the ceiling: a gas pendant's glow (1880s), light panels (TODAY), a luminous ceiling (3000s)
    vec2 f = vec2(h.x, h.z);
    float lp = E == 0 ? exp(-dot(f - vec2(0.0, R.w * 0.5), f - vec2(0.0, R.w * 0.5)) * 2.0) : (E == 1 ? bsAA(abs(fract(f.y / 1.2) - 0.5) * 1.2 - 0.18, 0.02) * bsAA(abs(f.x) - R.x * 0.6, 0.02) : 0.8);
    c = mix(E == 0 ? bsC(0.3, 0.24, 0.18) : bsC(0.86, 0.86, 0.84), E == 0 ? bsC(1.0, 0.8, 0.5) : bsC(1.0, 0.97, 0.9), lp) * 1.3;
  }
  // the light: brightest near the glass and under the ceiling lights, falling off into the room; warm gas light in the
  // 1880s, warm white TODAY, cool white in the 3000s
  c *= mix(1.1, 0.62, h.z / R.w) * (E == 0 ? vec3(1.05, 0.86, 0.62) : (E == 1 ? vec3(1.04, 0.98, 0.9) : vec3(0.97, 0.98, 1.03)));
  return c;
}
// (fix round 1, cost) the room only where a pane shows it: the trace is skipped on the walls round the glass
vec3 bsRoomIf(float m, vec2 q, vec3 V, vec4 R, float kind, float seed, int E) {
  if (m < 0.002) return vec3(0.0);
  return bsRoom(q, V, R, kind, seed, E);
}
// a window: centre c, half-size h; bars: 0 plain / 1 one bar / 2 four lights / 3 small panes; returns
// (surround, glass, bar, sill)
vec4 bsWin(vec2 p, vec2 c, vec2 h, float bars, float sur, float pw, bool arch) {
  float dIn = arch ? bsArchD(p, c, h) : bsBox(p, c, h);
  float dOut = arch ? bsArchD(p, c + vec2(0.0, sur * 0.5), h + vec2(sur, sur * 0.5)) : bsBox(p, c, h + vec2(sur));
  float rim = bsAA(dOut, pw) * (1.0 - bsAA(dIn, pw));
  float glass = bsAA(dIn + 0.04, pw);
  float frame = bsAA(dIn, pw) * (1.0 - glass);
  vec2 q = p - c;
  float bar = 0.0;
  if (bars > 0.5) bar = max(bar, bsAA(abs(q.y) - 0.022, pw));
  if (bars > 1.5) bar = max(bar, bsAA(abs(q.x) - 0.02, pw));
  if (bars > 2.5) { bar = max(bar, bsAA(abs(fract(q.x / (h.x * 0.667) + 0.5) - 0.5) * h.x * 0.667 - 0.014, pw)); bar = max(bar, bsAA(abs(fract(q.y / (h.y * 0.5) + 0.5) - 0.5) * h.y * 0.5 - 0.014, pw)); }
  float sill = arch ? 0.0 : bsAA(bsBox(p, c - vec2(0.0, h.y + sur + 0.05), vec2(h.x + sur + 0.08, 0.05)), pw);
  return vec4(rim, glass * (1.0 - bar), max(frame, glass * bar), sill);
}
`;

// ------------------------------------------------------------------------------------------------ GLSL: the surface
const FBASE = /* glsl */`
  // ---- Bluestone Junction: the level art under the ink (src/world/stages/bluestone/levelart.js)
  if (vBsArt.x > 0.5) {
    gBsEra = eraOneHot.y > 0.5 ? 1 : (eraOneHot.z > 0.5 ? 2 : 0);
    int st = int(vBsArt.x + 0.5);
    float sd = vBsArt.y < 0.0 ? -1.0 : 1.0;
    int prm = int(abs(vBsArt.y) - 0.5);
    vec3 P = vec3(vWPos.x * sd, vWPos.y, vWPos.z * sd);     // Alpha's frame
    vec3 N = vec3(vWNorm.x * sd, vWNorm.y, vWNorm.z * sd);
    bool wall = abs(N.y) < 0.3, top = N.y > 0.7;
    // along the wall, left to right as seen from outside (the face's own u: fu.x), and the height
    vec2 W = vec2(fu.x, P.y);
    float pw = max(length(fwidth(vWPos)) * 0.75, 0.003);
    int E = gBsEra;
    vec3 WG = bsC(0.95, 0.88, 0.70);                      // white-gold (eras.colors.appear's family)
    // ============================================================== BLD
    if (st == 1 && prm < 16) {
      vec4 A = uBsB[prm * 3], Bq = uBsB[prm * 3 + 1], Cq = uBsB[prm * 3 + 2];
      int fam = int(Cq.x + 0.5), vari = int(Bq.z + 0.5);
      float bay = A.x, gf = A.y, sh = A.z, wtop = A.w, plinth = Bq.x;
      int mask = int(Bq.y + 0.5);
      int fb = N.x > 0.5 ? 1 : (N.x < -0.5 ? 2 : (N.z > 0.5 ? 4 : 8));
      bool front = (mask / fb) - ((mask / fb) / 2) * 2 == 1;
      if (wall) {
        float y = P.y;
        float nb = max(1.0, floor(fsz.x / bay));
        float mrg = (fsz.x - nb * bay) * 0.5;
        float bx = W.x - mrg, bi = floor(bx / bay);
        float lx = bx - (bi + 0.5) * bay;                     // centred in its bay
        bool inBay = bx > 0.0 && bx < nb * bay;
        vec2 p = vec2(lx, y);
        // the wall itself: per era the paint over the stone (DESIGN §5.1: TODAY repainted cream and ochre; the 3000s pale)
        vec3 tint = vec3(1.0);
        if (fam == 2) tint = E == 0 ? vec3(0.86, 0.84, 0.82) : (E == 1 ? vec3(1.08, 1.0, 0.86) : vec3(1.12, 1.1, 1.08));
        if (fam == 1) tint = E == 0 ? vec3(0.92, 0.9, 0.86) : (E == 1 ? vec3(1.02, 1.0, 0.97) : vec3(1.1, 1.1, 1.1));
        if (fam == 3) tint = E == 0 ? vec3(0.95, 0.88, 0.8) : (E == 1 ? vec3(1.04, 1.0, 0.93) : vec3(1.12, 1.12, 1.12));
        if (fam == 8) tint = E == 0 ? vec3(0.62, 0.66, 0.6) : (E == 1 ? vec3(0.95, 0.9, 0.8) : vec3(1.25, 1.25, 1.25));
        if (fam == 4 || fam == 5 || fam == 6 || fam == 7) tint = E == 2 ? vec3(1.06, 1.08, 1.1) : vec3(1.0);
        base *= tint;
        // (fix round 1) the Young & Jackfish per era (DESIGN §5.1), its walls repainted, not only tinted: the 1880s a
        // bluestone ground storey under grey-ochre render; TODAY cream render with ochre dressings (the string course, the
        // cornice, the window surrounds, quoins at the corners) and gold lettering on its fascias; the 3000s pale pearl
        bool hotelOchre = fam == 2 && E == 1;
        if (fam == 2) {
          float grain = 0.88 + 0.24 * fbm(vec2(W.x * 0.7, y * 0.9));
          vec3 rend = E == 0 ? bsC(0.6, 0.55, 0.45) : (E == 1 ? bsC(0.88, 0.84, 0.74) : bsC(0.93, 0.93, 0.92));
          base = mix(base, rend * grain, 0.78);
          if (E == 0 && y < gf - 0.02) {
            vec3 ash = bsC(0.36, 0.39, 0.43) * (0.88 + 0.16 * h21(floor(vec2(W.x / 0.75 + 0.5 * floor(y / 0.38), y / 0.38))));
            float aj = max(bsAA(abs(fract(W.x / 0.75 + 0.5 * floor(y / 0.38)) - 0.5) * 0.75 - 0.006, pw), bsAA((0.5 - abs(fract(y / 0.38) - 0.5)) * 0.38 - 0.008, pw));
            base = mix(ash, ash * 0.62, aj);
          }
          if (hotelOchre) {
            float qn = bsAA(min(W.x, fsz.x - W.x) - (mod(floor(y / 0.45), 2.0) < 1.0 ? 0.5 : 0.3), pw) * step(gf, y);
            base = mix(base, bsC(0.72, 0.6, 0.43) * grain, qn);
          }
        }
        vec3 stone = base;
        vec3 dressC = hotelOchre ? bsC(0.74, 0.62, 0.44) : stone * 1.18;
        // plinth: a bluestone course at the foot (every era: the constant)
        float pl = step(y, plinth) * step(-0.5, y);
        if (plinth > 0.01) {
          vec3 bsCol = bsC(0.34, 0.37, 0.41) * (0.9 + 0.12 * h21(floor(vec2(W.x / 0.6, y / 0.3))));
          float jt = max(bsAA(abs(fract(W.x / 0.6 + 0.5 * floor(y / 0.3)) - 0.5) * 0.6 - 0.006, pw), bsAA((0.5 - abs(fract(y / 0.3) - 0.5)) * 0.3 - 0.008, pw));
          base = mix(base, mix(bsCol, bsCol * 0.6, jt), pl);
          base = mix(base, bsC(0.48, 0.5, 0.52), bsAA(abs(y - plinth + 0.03) - 0.03, pw) * step(0.0, y));   // its weathered top
        }
        // string course over the ground floor and the cornice line under the top; the storey bands
        float sc = bsAA(abs(y - gf - 0.09) - 0.09, pw);
        float cn = bsAA(abs(y - wtop + 0.35) - 0.22, pw) * step(wtop - 0.6, y);
        float shadow = bsAA(abs(y - gf + 0.03) - 0.05, pw) * 0.35 + bsAA(abs(y - wtop + 0.62) - 0.06, pw) * 0.4;
        if (fam != 7 && fam != 8 && fam != 9) {
          base = mix(base, dressC, sc * 0.9);
          base = mix(base, hotelOchre ? dressC * 1.04 : stone * 1.22, cn);
          base *= 1.0 - shadow;
        }
        // ---- ground floor
        if (y > plinth - 0.02 && y < gf && front && fam != 7 && fam != 9 && fam != 4) {
          // shopfronts and civic fronts per family and era
          if (fam == 3 && E == 0 && vari == 0) {
            // the Royal Arcade under construction: timber hoardings with posters, GRAND OPENING 1889
            gBsOld = 1.0;
            float plank = floor(W.x / 0.22);
            vec3 wood = bsC(0.42, 0.33, 0.24) * (0.82 + 0.3 * h21(vec2(plank, 3.0))) * (0.9 + 0.12 * fbm(vec2(W.x * 2.0, y * 0.3)));
            float seam = bsAA((0.5 - abs(fract(W.x / 0.22) - 0.5)) * 0.22 - 0.01, pw);
            base = mix(wood * 0.65, wood, 1.0 - seam * 0.0) * (1.0 - 0.35 * (1.0 - bsAA(abs(fract(W.x / 0.22) - 0.5) * 0.22 - 0.103, pw)));
            // posters in two rows, overlapping, torn
            vec2 cell = floor(vec2(W.x / 1.15, (y - 0.5) / 1.25));
            vec2 lc = vec2(fract(W.x / 1.15), fract((y - 0.5) / 1.25));
            float hs = bsH(cell + 7.0);
            if (y > 0.5 && y < 3.0 && hs > 0.25) {
              vec2 pc = vec2(0.5 + (bsH(cell + 1.0) - 0.5) * 0.15, 0.5);
              float pd = bsBox(lc, pc, vec2(0.36 + 0.06 * hs, 0.4));
              float poster = bsAA(pd + 0.02 * (vnoise(W * 9.0) - 0.5), pw / 1.15);
              vec3 paper = hs > 0.7 ? bsC(0.86, 0.8, 0.66) : (hs > 0.5 ? bsC(0.72, 0.62, 0.48) : bsC(0.78, 0.74, 0.68));
              float txt = bsText(lc, vec2(pc.x, 0.68), 0.16, 0.6, cell.x * 3.1 + cell.y, pw / 1.15) + bsText(lc, vec2(pc.x, 0.42), 0.08, 0.58, cell.x + 9.0, pw / 1.15) * 0.8;
              float band = bsAA(abs(lc.y - 0.24) - 0.06, pw / 1.25) * step(abs(lc.x - pc.x), 0.34);
              vec3 ink = hs > 0.6 ? bsC(0.42, 0.14, 0.12) : bsC(0.12, 0.12, 0.14);
              base = mix(base, mix(mix(paper, ink, txt), ink, band * 0.85), poster);
            }
            // the banner along the top: GRAND OPENING 1889
            float bn = bsRect(W, vec2(0.0, 3.1), vec2(fsz.x, 3.45), pw);
            base = mix(base, bsC(0.52, 0.16, 0.13), bn);
            base = mix(base, bsC(0.9, 0.82, 0.62), bn * bsText(vec2(mod(W.x, 4.6), y), vec2(2.3, 3.28), 0.22, 3.6, 41.0, pw));
          } else {
            // a shopfront per bay: stall riser, glass, transom, fascia — or a civic arched opening
            bool civic = fam == 1 || fam == 5 || fam == 9;
            if (civic && inBay) {
              vec2 c = vec2(0.0, (plinth + gf) * 0.5 - 0.15);
              vec2 hh = vec2(min(bay * 0.28, 0.75), (gf - plinth) * 0.36);
              vec4 w = bsWin(p, c, hh, E == 0 ? 3.0 : 2.0, 0.12, pw, true);
              // rusticated ground floor: deep horizontal joints every 0.38 m
              float rj = bsAA((0.5 - abs(fract((y - plinth) / 0.38) - 0.5)) * 0.38 - 0.018, pw);
              base *= 1.0 - 0.28 * rj * (1.0 - w.x) * step(plinth, y);
              base = mix(base, stone * 1.15, w.x);
              // (fix round 1) behind the civic arches (the GPO's public hall, the hotel's bar, the boiler house) a room
              // with depth: its counters and pinned notices, lit by its own light — not a flat lit pane at dusk
              vec3 Vc = bsViewIn();
              float fc2 = 0.05 + 0.75 * pow(1.0 - Vc.z, 4.0);
              vec3 croom = bsRoomIf(w.y, p, Vc, vec4(hh.x + 0.5, plinth, gf - 0.1, 4.0), fam == 2 ? 3.0 : 10.0, float(bi) + float(prm) * 5.0, E);
              vec3 gl = E == 2 ? mix(mix(bsC(0.86, 0.88, 0.9), WG, 0.25), croom * 0.3, 0.5 * (1.0 - fc2)) : mix(croom * 0.14, bsGlass(p, c.y - hh.y, c.y + hh.y, 1.0), fc2);
              base = mix(base, gl, w.y);
              base = mix(base, E == 0 ? bsC(0.24, 0.28, 0.24) : (E == 1 ? bsC(0.86, 0.85, 0.8) : bsC(0.92, 0.92, 0.9)), w.z);
              if (w.y > 0.5) { gBaseRough = 0.12; gTexStr = 0.0; }
              gBsRoom += w.y * croom * (1.0 - fc2) * (E == 0 ? 0.7 : (E == 1 ? 0.95 : 0.55)) * (0.6 + 0.4 * step(0.3, bsH(vec2(bi, float(prm)))));   // (the 3000s: seen through pearl glass at about half)
              // keystone
              base = mix(base, stone * 1.25, bsRect(p, vec2(-0.1, c.y + hh.y + 0.02), vec2(0.1, c.y + hh.y + 0.3), pw));
            } else if (inBay || fam == 3) {
              float lx2 = fam == 3 ? mod(W.x, bay) - bay * 0.5 : lx;
              vec2 q = vec2(lx2, y);
              float hw = bay * 0.5 - 0.16;                    // the pilaster between fronts: 0.32 m
              float pil = 1.0 - bsAA(abs(q.x) - hw, pw);
              float riser = E == 1 ? 0.35 : 0.7, gTop = gf - 0.85, fas0 = gf - 0.62;
              vec3 timber = fam == 2 ? bsC(0.16, 0.24, 0.2) : (mod(bi, 3.0) < 1.0 ? bsC(0.34, 0.14, 0.12) : (mod(bi, 3.0) < 2.0 ? bsC(0.16, 0.24, 0.2) : bsC(0.18, 0.2, 0.28)));
              // (fix round 1) each shop a trade (the arcade's run in order: a chocolatier, a toy shop, a barber, a café, books
              // and papers, a florist, a clothier) and a room behind its glass, seen with depth (bsRoom)
              float sbi = fam == 3 ? floor(W.x / bay) : bi;
              float kind = fam == 3 ? mod(sbi + (vari == 1 ? 3.0 : 0.0), 7.0) : floor(bsH(vec2(bi, float(prm) + 11.0)) * 6.99);
              float sseed = sbi * 1.37 + float(prm) * 3.1;
              vec3 Vin = bsViewIn();
              float fres = 0.05 + 0.75 * pow(1.0 - Vin.z, 4.0);
              if (E == 0) {
                // the 1880s: a timber shopfront — panelled stall riser, small panes in slender bars, a gilt-lettered fascia
                float body = bsAA(abs(q.x) - hw, pw);
                vec3 col = timber * (0.92 + 0.1 * fbm(q * vec2(1.5, 6.0)));
                float panel = bsAA(bsBox(vec2(mod(q.x + hw, 0.6) - 0.3, y), vec2(0.0, (plinth + riser) * 0.5 + 0.03), vec2(0.22, (riser - plinth) * 0.35)), pw);
                float glassA = bsRect(q, vec2(-hw + 0.08, riser + 0.05), vec2(hw - 0.08, gTop), pw);
                float bars = max(bsAA(abs(fract((q.x + hw) / ((2.0 * hw) / 4.0)) - 0.5) * (2.0 * hw) / 4.0 - 0.018, pw), bsAA(abs(y - (riser + gTop) * 0.5 - 0.35) - 0.018, pw));
                vec3 room = bsRoomIf(glassA * body, q, Vin, vec4(hw + 0.2, 0.08, gf - 0.25, 3.0), kind, sseed, 0) * (0.55 + 0.45 * step(0.3, bsH(vec2(bi, 5.0))));
                vec3 g = mix(room * 0.12, bsGlass(q, riser, gTop, 0.95), fres);
                float pane = glassA * (1.0 - bars) * body;
                base = mix(base, col, body);
                base = mix(base, col * 0.72, panel * body * step(y, riser));
                base = mix(base, g, pane);
                base = mix(base, col * 1.15, glassA * bars * body);
                if (pane > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
                gBsRoom += pane * room * (1.0 - fres) * 0.75;   // gas-lit: dimmer than TODAY's
                // fascia: dark board with gilt lettering and a moulded cornice over it
                float fas = bsRect(q, vec2(-hw - 0.16, fas0), vec2(hw + 0.16, gf - 0.04), pw);
                base = mix(base, timber * 0.55, fas);
                base = mix(base, bsC(0.76, 0.6, 0.3), fas * bsText(q, vec2(0.0, (fas0 + gf) * 0.5 - 0.02), 0.2, 2.0 * hw - 0.4, bi * 3.7 + float(prm), pw));
                base = mix(base, bsC(0.8, 0.64, 0.34), bsAA(abs(y - gf + 0.06) - 0.025, pw) * fas);
                // the pilasters: stone with a console bracket under the fascia
                base = mix(base, stone * 0.95, pil * step(y, fas0));
                base = mix(base, stone * 1.2, pil * bsRect(vec2(abs(q.x) - hw - 0.16, y), vec2(-0.12, fas0 - 0.3), vec2(0.12, fas0), pw));
              } else if (E == 1) {
                // TODAY: plate glass in slim dark frames, a tiled stall riser, a painted fascia with its sign panel
                // (fix round 1) the room behind the plate glass (bsRoom: the trade's shelves and goods, a counter, the floor
                // and the light panels, with depth); a glazed door with a brass push plate at one side; the sky's
                // reflection on the glass by the view angle (lighter up top)
                float body = bsAA(abs(q.x) - hw, pw);
                float ds = bsH(vec2(sbi, float(prm) + 6.0)) < 0.5 ? -1.0 : 1.0, dx0 = hw * 0.3;
                float doorA = bsRect(vec2(q.x * ds, y), vec2(dx0, 0.04), vec2(hw - 0.06, gf - 0.62), pw);
                float glassA = max(bsRect(q, vec2(-hw + 0.06, riser), vec2(hw - 0.06, gf - 0.62), pw) * (1.0 - bsRect(vec2(q.x * ds, y), vec2(dx0 - 0.06, 0.0), vec2(hw, gf - 0.62), pw)), 0.0);
                float dglass = bsRect(vec2(q.x * ds, y), vec2(dx0 + 0.07, 0.16), vec2(hw - 0.13, gf - 0.7), pw);
                vec3 tile = mix(bsC(0.3, 0.38, 0.36), bsC(0.55, 0.5, 0.42), step(0.5, bsH(vec2(bi, float(prm) + 4.0))));
                float tj = max(bsAA((0.5 - abs(fract(q.x / 0.15) - 0.5)) * 0.15 - 0.006, pw), bsAA((0.5 - abs(fract(y / 0.075) - 0.5)) * 0.075 - 0.0035, pw));
                vec3 room = bsRoomIf((glassA + dglass) * body, q, Vin, vec4(hw + 0.25, 0.05, gf - 0.2, 3.4), kind, sseed, 1);
                vec3 refl = mix(bsC(0.1, 0.12, 0.14), bsC(0.5, 0.56, 0.62), smoothstep(riser, gf - 0.62, y));
                vec3 g = mix(room * 0.14, refl, fres);
                float pane = (glassA + dglass) * body;
                base = mix(base, bsC(0.12, 0.13, 0.14), body * (1.0 - glassA));
                base = mix(base, mix(tile, tile * 0.55, tj), body * step(y, riser) * (1.0 - doorA));
                base = mix(base, g, pane);
                // the door's push plate and its kick plate
                base = mix(base, bsC(0.72, 0.58, 0.32), bsRect(vec2(q.x * ds, y), vec2(dx0 + 0.1, 0.98), vec2(dx0 + 0.2, 1.3), pw) * doorA);
                base = mix(base, bsC(0.6, 0.6, 0.6), bsRect(vec2(q.x * ds, y), vec2(dx0 + 0.07, 0.04), vec2(hw - 0.13, 0.16), pw) * doorA);
                if (pane > 0.5) { gBaseRough = 0.06; gTexStr = 0.0; }
                gBsRoom += pane * room * (1.0 - fres) * (0.75 + 0.35 * step(0.35, bsH(vec2(sbi, 3.0 + float(prm)))));
                float fas = bsRect(q, vec2(-hw - 0.16, gf - 0.62), vec2(hw + 0.16, gf - 0.04), pw);
                vec3 fc = fam == 2 ? bsC(0.14, 0.24, 0.2) : (mod(bi, 3.0) < 1.0 ? bsC(0.2, 0.32, 0.3) : (mod(bi, 3.0) < 2.0 ? bsC(0.36, 0.18, 0.18) : bsC(0.2, 0.22, 0.3)));
                base = mix(base, fc, fas);
                float sign = bsRect(q, vec2(-hw * 0.6, gf - 0.5), vec2(hw * 0.6, gf - 0.16), pw) * fas;
                base = mix(base, fam == 2 ? bsC(0.84, 0.66, 0.32) : bsC(0.86, 0.82, 0.72), sign * bsText(q, vec2(0.0, gf - 0.33), 0.2, hw * 1.1, bi * 5.1 + float(prm) + 30.0, pw));
                if (fam == 2) base = mix(base, bsC(0.8, 0.62, 0.3), bsAA(abs(y - gf + 0.08) - 0.02, pw) * fas);   // a gilt bead under the cornice
                base = mix(base, stone, pil * step(y, gf - 0.62));
              } else {
                // the 3000s: pearl glass in white frames, light seams at the joints, planting on the piers; behind the glass
                // the same trades' rooms (bsRoom, pale and cool-lit) seen through the pearl at about half
                float body = bsAA(abs(q.x) - hw, pw);
                float glassA = bsRect(q, vec2(-hw + 0.04, 0.12), vec2(hw - 0.04, gf - 0.3), pw);
                vec3 pearl = mix(bsC(0.84, 0.86, 0.9), bsC(0.96, 0.95, 0.92), smoothstep(0.0, gf, y)) * (0.92 + 0.08 * vnoise(q * 3.0));
                base = mix(base, bsC(0.92, 0.92, 0.9), body);
                vec3 room = bsRoomIf(glassA, q, Vin, vec4(hw + 0.25, 0.05, gf - 0.1, 3.4), kind, sseed, 2);
                float through = 0.5 * (1.0 - fres);
                base = mix(base, mix(pearl, room * 0.3, through), glassA);
                gBsRoom += glassA * room * through * 1.1;
                if (glassA > 0.5) { gBaseRough = 0.14; gTexStr = 0.0; }
                float seam = max(bsAA(abs(abs(q.x) - hw + 0.02) - 0.012, pw), bsAA(abs(y - gf + 0.3) - 0.012, pw)) * body;
                base = mix(base, WG, seam);
                gBsLit += seam * WG * 1.6;
                float holo = bsRect(q, vec2(-hw * 0.55, gf - 0.62), vec2(hw * 0.55, gf - 0.36), pw) * body;
                base = mix(base, mix(bsC(0.86, 0.84, 0.92), WG, bsText(q, vec2(0.0, gf - 0.49), 0.16, hw * 0.9, bi * 3.3 + float(prm) + 60.0, pw)), holo);
                gBsGlow += holo * WG * 0.35;
                float green = (1.0 - body) * step(0.15, y) * step(y, gf - 0.1);
                base = mix(base, bsLeaves(vec2(W.x, y), pw), green);
              }
            } else {
              // a pier between fronts
              base = mix(base, stone * 0.96, 1.0);
            }
          }
        }
        // ---- the Young & Jackfish's public bar (its ground floor, the bar side: −z and +x faces under the arch)
        // ---- lane walls (the arcade's Hoki Lane face, the boiler house): rear doors, downpipes, posters, tags, a green wall
        if (((fam == 3 && vari == 1 && fb == 2) || (fam == 6 && fb == 1)) && y < gf) {
          float pipe = bsAA(abs(mod(W.x, 6.0) - 0.4) - 0.05, pw);
          float door = bsRect(vec2(mod(W.x, 7.0), y), vec2(2.4, 0.0), vec2(3.4, 2.1), pw);
          base = mix(base, E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.26, 0.24, 0.22), door);
          base = mix(base, bsC(0.24, 0.26, 0.26), pipe);
          if (E == 0) {
            vec2 cl = floor(vec2(W.x / 1.4, (y - 0.6) / 1.0)); vec2 lc = vec2(fract(W.x / 1.4), fract((y - 0.6) / 1.0));
            float pz = bsAA(bsBox(lc, vec2(0.5, 0.5), vec2(0.34, 0.4)), pw / 1.4) * step(0.55, bsH(cl)) * step(0.6, y) * step(y, 2.6) * (1.0 - door);
            base = mix(base, mix(bsC(0.8, 0.74, 0.6), bsC(0.2, 0.18, 0.16), bsText(lc, vec2(0.5, 0.62), 0.12, 0.6, cl.x + cl.y * 7.0, pw / 1.4)), pz);
            gBsOld = max(gBsOld, pz);
          } else if (E == 1) {
            float tag = smoothstep(0.62, 0.66, fbm(vec2(W.x * 1.3, y * 2.2) + 3.0)) * step(0.3, y) * step(y, 2.2) * (1.0 - door);
            base = mix(base, mix(bsC(0.32, 0.36, 0.42), bsC(0.55, 0.42, 0.5), step(0.5, fract(W.x * 0.3))), tag * 0.85);
          } else {
            float green = bsGreen(vec2(W.x, y), 11.0, 0.55) * step(0.3, y) * step(y, gf - 0.3) * (1.0 - door);
            base = mix(base, bsLeaves(vec2(W.x, y), pw), green);
          }
        }
        // ---- the Royal Arcade's upper walls (3.6 → 6): blind arcading on every face; the 1880s still raw brick in a
        //      scaffold of poles and ledgers, TODAY clean render with the shop names' panels, the 3000s light seams round
        //      the arches and planting climbing them
        if (fam == 3 && y > gf + 0.15 && y < wtop - 0.45) {
          float ax3 = mod(W.x, 1.75) - 0.875;
          float dA = bsArchD(vec2(ax3, y), vec2(0.0, gf + 0.95), vec2(0.55, 0.85)), arch = bsAA(dA, pw), rim = bsAA(dA - 0.08, pw) * (1.0 - arch);
          if (E == 0) {
            vec2 bq = vec2(W.x / 0.23 + 0.5 * floor(y / 0.075), y / 0.075);
            float j = max(bsAA((0.5 - abs(fract(bq.x) - 0.5)) * 0.23 - 0.007, pw), bsAA((0.5 - abs(fract(bq.y) - 0.5)) * 0.075 - 0.0055, pw));
            base = mix(bsC(0.54, 0.31, 0.24) * (0.85 + 0.25 * h21(floor(bq))), bsC(0.68, 0.64, 0.58), j);
            base = mix(base, base * 0.7, arch * 0.6);
            float pole = bsAA(abs(mod(W.x, 2.4) - 1.2) - 0.05, pw), ledger = bsAA(abs(y - gf - 1.25) - 0.05, pw);
            base = mix(base, bsC(0.48, 0.38, 0.26), max(pole, ledger));
          } else {
            base = mix(base, stone * 0.86, arch);
            base = mix(base, stone * 1.15, rim);
            if (E == 1) { float pan = bsRect(vec2(ax3, y), vec2(-0.4, gf + 0.55), vec2(0.4, gf + 0.95), pw); base = mix(base, bsC(0.24, 0.3, 0.3), pan); base = mix(base, bsC(0.8, 0.68, 0.4), pan * bsText(vec2(ax3, y), vec2(0.0, gf + 0.75), 0.18, 0.6, floor(W.x / 1.75) + 50.0, pw)); }
            else { base = mix(base, WG, rim * 0.6); gBsGlow += rim * WG * 0.6; float gr = bsGreen(vec2(W.x, y), 9.0, 0.5) * (1.0 - arch); base = mix(base, bsLeaves(vec2(W.x, y), pw), gr); }
          }
        }
        // ---- upper floors: windows per bay and storey
        if (y > gf + 0.18 && y < wtop - 0.6 && inBay && fam != 7 && fam != 3) {
          float k = floor((y - gf) / sh), ly = y - gf - k * sh;
          vec2 c = vec2(0.0, gf + k * sh + sh * 0.5);
          bool arch = fam == 1 || fam == 4 || fam == 5;
          vec2 hh = vec2(min(bay * 0.24, 0.62), sh * 0.3);
          if (fam == 5) hh = vec2(min(bay * 0.25, 0.75), sh * 0.32);
          if (fam == 6) hh = vec2(min(bay * 0.22, 0.55), sh * 0.22);
          float bars = E == 0 ? 2.0 : (E == 1 ? 1.0 : 0.0);
          if (fam == 5 || fam == 6) bars = E == 0 ? 3.0 : (E == 1 ? 2.0 : 0.0);
          vec4 w = bsWin(p, c, hh, bars, 0.1, pw, arch);
          vec3 trim = E == 0 ? stone * 1.12 : (E == 1 ? (hotelOchre ? dressC : bsC(0.92, 0.9, 0.84)) : bsC(0.95, 0.95, 0.94));
          base = mix(base, trim, w.x);
          vec3 gl = bsGlass(p, c.y - hh.y, c.y + hh.y, 1.0);
          if (E == 2) gl = mix(bsC(0.78, 0.82, 0.88), bsC(0.95, 0.94, 0.9), smoothstep(c.y - hh.y, c.y + hh.y, y));
          base = mix(base, gl, w.y);
          base = mix(base, E == 0 ? bsC(0.86, 0.82, 0.72) : (E == 1 ? bsC(0.95, 0.94, 0.9) : WG), w.z);
          base = mix(base, trim * 1.05, w.w);
          if (w.y > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
          float on = step(E == 0 ? 0.45 : 0.3, bsH(vec2(bi + 13.0 * k, float(prm) + 1.0)));
          gBsLit += w.y * on * (E == 0 ? bsC(1.0, 0.68, 0.36) * 0.55 : (E == 1 ? bsC(1.0, 0.85, 0.62) * 0.75 : bsC(0.94, 0.94, 1.0) * 0.6));
          if (E == 2) { gBsGlow += w.x * WG * 0.5; base = mix(base, WG, w.x * 0.4); }
        }
        // ---- the Customs House, the Engine House, the sheds and the viaduct: bluestone walls with tall arched openings
        if (fam == 4 || fam == 9) {
          // the 3000s: light seams up the corners and across at the storeys, a green farm wall in some bays
          if (E == 2) {
            float seam = bsAA((0.5 - abs(fract(y / 3.0) - 0.5)) * 3.0 - 0.012, pw) + bsAA(min(W.x, fsz.x - W.x) - 0.025, pw);
            base = mix(base, WG, clamp(seam, 0.0, 1.0) * 0.85); gBsGlow += clamp(seam, 0.0, 1.0) * WG * 0.8;
          }
        }
        if (fam == 4 && inBay && y > plinth) {
          // H.M. CUSTOMS: tall round-arched windows through two storeys, bluestone quoins at the corners
          vec2 c = vec2(0.0, front ? 3.6 : 4.4);
          vec2 hh = vec2(min(bay * 0.26, 0.62), 1.9);
          vec4 w = bsWin(p, c, hh, E == 0 ? 3.0 : (E == 1 ? 2.0 : 0.0), 0.14, pw, true);
          base = mix(base, stone * 1.28, w.x);
          vec3 gl = E == 2 ? mix(bsC(0.8, 0.84, 0.88), WG, 0.2) : bsGlass(p, c.y - hh.y, c.y + hh.y, 1.0);
          base = mix(base, gl, w.y); base = mix(base, E == 1 ? bsC(0.2, 0.2, 0.22) : bsC(0.78, 0.74, 0.64), w.z);
          if (w.y > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
          gBsLit += w.y * step(0.4, bsH(vec2(bi, 77.0))) * (E == 0 ? bsC(1.0, 0.7, 0.4) * 0.45 : (E == 1 ? bsC(1.0, 0.88, 0.7) * 0.8 : bsC(0.94, 0.94, 1.0) * 0.6));
          // a farm wall growing over some bays in the 3000s
          if (E == 2 && mod(bi, 3.0) > 1.5) { float gr = (1.0 - w.x) * (1.0 - w.y) * step(plinth + 0.3, y); base = mix(base, bsLeaves(vec2(W.x, y), pw), gr); }
        }
        if (fam == 4 || fam == 5 || fam == 6 || fam == 7) {
          // bluestone quoins at the corners
          float qn = bsAA(min(W.x, fsz.x - W.x) - (mod(floor(y / 0.42), 2.0) < 1.0 ? 0.55 : 0.32), pw) * step(plinth, y);
          base = mix(base, base * 0.82 + bsC(0.05, 0.05, 0.06), qn * 0.6);
          base *= 1.0 - 0.3 * qn * bsAA((0.5 - abs(fract(y / 0.42) - 0.5)) * 0.42 - 0.01, pw);
        }
        if (fam == 5 || fam == 6) {
          // the Engine House / boiler house / tram shed fronts: huge arched openings at the ground floor (the winding wheels
          // behind glass; the tram shed's carriage doors: boarded 1880s, glass TODAY, light gates in the 3000s)
          if (front && inBay && y < gf + 1.2 && y > plinth) {
            vec2 c = vec2(0.0, (plinth + gf + 1.2) * 0.5 - 0.1);
            vec2 hh = vec2(min(bay * 0.36, 1.25), (gf + 1.2 - plinth) * 0.46);
            float dIn = bsArchD(p, c, hh), dOut = bsArchD(p, c + vec2(0.0, 0.1), hh + vec2(0.18, 0.1));
            float rim = bsAA(dOut, pw) * (1.0 - bsAA(dIn, pw)), inside = bsAA(dIn, pw);
            base = mix(base, stone * 1.3, rim);
            vec3 fill;
            if (vari == 1) {
              // carriage doors
              float pl = floor((p.x + hh.x) / 0.18);
              fill = E == 0 ? bsC(0.32, 0.22, 0.16) * (0.8 + 0.3 * h21(vec2(pl, 1.0))) * (1.0 - 0.3 * bsAA((0.5 - abs(fract((p.x + hh.x) / 0.18) - 0.5)) * 0.18 - 0.005, pw))
                   : (E == 1 ? bsGlass(p, c.y - hh.y, c.y + hh.y, 1.0) : mix(bsC(0.86, 0.88, 0.92), WG, 0.3));
              float brace = bsAA(abs(p.y - c.y + 0.3 - p.x * 0.8) - 0.05, pw) * step(abs(p.x), hh.x);
              if (E == 0) fill = mix(fill, fill * 0.7, brace);
            } else {
              // (fix round 1: the engine hall behind the glass — its winding wheels and the iron of the cable plant, a room
              //  lit by its own light — not a flat orange pane at dusk)
              vec3 Ve = bsViewIn();
              float fe = 0.05 + 0.75 * pow(1.0 - Ve.z, 4.0);
              vec3 eroom = bsRoomIf(inside, p, Ve, vec4(hh.x + 0.4, plinth, gf + 1.6, 5.0), 11.0, float(bi), E);
              fill = E == 2 ? mix(mix(bsC(0.84, 0.86, 0.9), WG, 0.25), eroom * 0.3, 0.5 * (1.0 - fe)) : mix(eroom * 0.14, bsGlass(p, c.y - hh.y, c.y + hh.y, 1.0), fe);
              float bars = max(bsAA(abs(fract(p.x / 0.45) - 0.5) * 0.45 - 0.02, pw), bsAA(abs(fract(p.y / 0.5) - 0.5) * 0.5 - 0.02, pw));
              if (E < 2) fill = mix(fill, bsC(0.24, 0.27, 0.26), bars);
              gBsRoom += inside * (E < 2 ? 1.0 - bars : 1.0) * eroom * (1.0 - fe) * (E == 0 ? 0.7 : (E == 1 ? 0.9 : 0.5));
            }
            base = mix(base, fill, inside);
            if (inside > 0.5) { gBaseRough = vari == 1 && E == 0 ? 0.8 : 0.12; gTexStr = vari == 1 && E == 0 ? gTexStr : 0.0; }
            gBsLit += inside * (E == 2 && vari == 1 ? bsC(0.95, 0.94, 1.0) * 0.7 : (vari == 1 && E == 1 ? bsC(1.0, 0.86, 0.66) * 0.7 : vec3(0.0)));
          }
          // the lettering band over the front (the props carry the raised words; here the band they sit on)
          if (front && fb == 4) {
            float band = bsRect(W, vec2(0.6, Cq.w - 0.25), vec2(fsz.x - 0.6, Cq.w + 0.45), pw);
            base = mix(base, E == 0 ? bsC(0.22, 0.25, 0.27) : (E == 1 ? bsC(0.3, 0.2, 0.18) : bsC(0.94, 0.94, 0.92)), band * 0.85);
            if (E == 2) gBsGlow += band * WG * 0.15;
          }
        }
        if (fam == 7) {
          // the viaduct: bluestone arches between its piers — stables doors and posters in the 1880s, the mural from TODAY
          base *= 1.25;
          float ax2 = mod(W.x, bay) - bay * 0.5;
          vec2 c = vec2(ax2, 0.0);
          float dIn = bsArchD(vec2(ax2, y), vec2(0.0, 1.3), vec2(1.35, 1.75)), dOut = bsArchD(vec2(ax2, y), vec2(0.0, 1.45), vec2(1.6, 1.9));
          float rim = bsAA(dOut, pw) * (1.0 - bsAA(dIn, pw)), inside = bsAA(dIn, pw);
          base = mix(base, base * 1.18, rim);
          // voussoirs
          float ang = atan(y - 1.85, ax2);
          base *= 1.0 - 0.3 * rim * bsAA(abs(fract(ang * 2.5) - 0.5) - 0.42, 0.05);
          if (E == 0) {
            float pl = floor((ax2 + 1.35) / 0.2);
            vec3 door = bsC(0.33, 0.24, 0.17) * (0.8 + 0.3 * h21(vec2(pl, floor(W.x / bay))));
            float half2 = bsAA(abs(y - 1.2) - 0.03, pw);
            base = mix(base, mix(door, door * 0.6, max(half2, 1.0 - bsAA((0.5 - abs(fract((ax2 + 1.35) / 0.2) - 0.5)) * 0.2 - 0.01, pw))), inside);
          } else {
            base = mix(base, base * 0.8, inside * 0.35);
          }
          if (E == 2) { float seam = bsAA(abs(y - 3.72) - 0.02, pw); base = mix(base, WG, seam); gBsGlow += seam * WG; }
          // between the arches (the piers' faces): bill posters in the 1880s, gig posters TODAY
          if (E < 2 && abs(ax2) > 1.62 && y > 0.4 && y < 2.5) {
            vec2 lc = vec2((abs(ax2) - 1.62) / max(0.01, bay * 0.5 - 1.62), (y - 0.4) / 2.1);
            float pp = step(0.06, lc.x) * step(lc.x, 0.94) * step(0.04, lc.y) * step(lc.y, 0.96);
            vec3 paper = E == 0 ? bsC(0.82, 0.76, 0.6) : bsC(0.55, 0.45, 0.42);
            base = mix(base, mix(paper, bsC(0.2, 0.16, 0.14), bsText(lc, vec2(0.5, 0.7), 0.16, 0.8, floor(W.x / bay) + float(E) * 7.0, pw)), pp);
            if (E == 0) gBsOld = max(gBsOld, pp);
          }
          // a coping along the top
          base = mix(base, bsC(0.42, 0.44, 0.46), bsAA(abs(y - 3.95) - 0.15, pw));
        }
        if (fam == 8) {
          // the Boathouse: painted weatherboards (green and cream in the 1880s, café cream with big windows TODAY,
          // pearl glass panels in the 3000s), boat doors on the river front
          float bd = floor(y / 0.18);
          if (E == 0) {
            base = mix(base, base * bsC(0.6, 0.78, 0.62), 0.55);
            float door = bsRect(vec2(mod(W.x, 3.5), y), vec2(0.4, 0.0), vec2(3.1, 2.1), pw) * step(0.5, mod(floor(W.x / 3.5), 2.0));
            // (fix round 1) the boat doors as doors: vertical boards, a ledge-and-brace Z on each leaf, strap hinges
            float dx = mod(W.x, 3.5) - 0.4, lx3 = mod(dx, 1.35);
            float bd3 = bsAA((0.5 - abs(fract(dx / 0.15) - 0.5)) * 0.15 - 0.006, pw);
            float ledge = bsAA(abs(y - 0.35) - 0.06, pw) + bsAA(abs(y - 1.75) - 0.06, pw);
            float brace = bsAA(abs(y - 0.35 - (lx3 / 1.35) * 1.4) - 0.07, pw) * step(0.35, y) * step(y, 1.75);
            float hinge = bsAA(abs(y - 0.35) - 0.025, pw) * step(lx3, 0.5) + bsAA(abs(y - 1.75) - 0.025, pw) * step(lx3, 0.5);
            vec3 dc = bsC(0.82, 0.78, 0.66) * (1.0 - 0.25 * bd3);
            dc = mix(dc, bsC(0.72, 0.68, 0.56), clamp(ledge + brace, 0.0, 1.0));
            dc = mix(dc, bsC(0.16, 0.16, 0.16), hinge);
            dc = mix(dc, bsC(0.3, 0.42, 0.34), bsAA(abs(dx - 1.35) - 0.025, pw));   // the meeting stile
            base = mix(base, dc, door);
            gTexStr *= 1.0 - door;   // (the weatherboards' relief stops at the door: it read as a grid)
            gBsRoom *= 1.0 - door; gBsLit *= 1.0 - door;   // (nor does a shop's room show through it, nor its glass's gloss)
            gBaseRough = mix(gBaseRough, 0.75, door);
            base = mix(base, bsC(0.82, 0.78, 0.66), bsAA(abs(y - 2.25) - 0.08, pw));
          } else if (E == 1) {
            base = mix(base, bsC(0.86, 0.82, 0.72), 0.6);
            if (inBay) { vec4 w = bsWin(p, vec2(0.0, 1.35), vec2(bay * 0.36, 0.62), 1.0, 0.06, pw, false); base = mix(base, bsC(0.3, 0.32, 0.3), w.x); base = mix(base, bsGlass(p, 0.7, 2.0, 1.0), w.y); base = mix(base, bsC(0.3, 0.32, 0.3), w.z); gBsLit += w.y * bsC(1.0, 0.86, 0.66) * 0.8; if (w.y > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; } }
          } else {
            // (fix round 1) the Tide Pavilion: a glass pavilion — clear glazing between slim white mullions every ~1.2 m on a
            // pearl sill, a light seam at the eaves, and inside (one room the length of the face) the club's rowing eights
            // racked along the back with oars and planting (bsRoom kind 7)
            float mw = fsz.x / max(1.0, floor(fsz.x / 1.2 + 0.5));
            float mx2 = abs(fract(W.x / mw + 0.5) - 0.5) * mw;
            float pane = bsRect(W, vec2(0.08, 0.3), vec2(fsz.x - 0.08, 2.18), pw) * (1.0 - bsAA(mx2 - 0.03, pw));
            vec3 Vb = bsViewIn();
            float fb2 = 0.05 + 0.75 * pow(1.0 - Vb.z, 4.0);
            vec3 room = bsRoomIf(pane, vec2(W.x - fsz.x * 0.5, y), Vb, vec4(fsz.x * 0.5, 0.1, 2.3, 4.2), 7.0, float(fb) * 1.3, 2);
            vec3 refl = mix(bsC(0.62, 0.68, 0.76), bsC(0.9, 0.92, 0.94), smoothstep(0.3, 2.2, y));
            base = mix(bsC(0.93, 0.93, 0.92), mix(room * 0.2, refl, fb2), pane);
            gBsRoom += pane * room * (1.0 - fb2) * 0.9;
            float seam = bsAA(abs(y - 2.3) - 0.015, pw) + bsAA(abs(y - 0.22) - 0.015, pw);
            base = mix(base, WG, clamp(seam, 0.0, 1.0)); gBsLit += clamp(seam, 0.0, 1.0) * WG * 0.8;
            if (pane > 0.5) { gBaseRough = 0.06; gTexStr = 0.0; }
          }
        }
        // the 3000s: a light seam along the string course and the cornice of every building (white-gold, faint by day)
        if (E == 2 && fam != 7 && fam != 8) {
          float seam = bsAA(abs(y - gf - 0.2) - 0.018, pw) + bsAA(abs(y - wtop + 0.6) - 0.018, pw);
          base = mix(base, WG, clamp(seam, 0.0, 1.0)); gBsGlow += clamp(seam, 0.0, 1.0) * WG;
        }
      } else if (N.y < -0.7) {
        // a soffit (the hotel's arch over the quay): coffered render, a lamp at dusk
        vec2 q = vec2(P.x, P.z);
        float cof = max(bsAA(abs(fract(q.x / 1.0) - 0.5) - 0.44, pw), bsAA(abs(fract(q.y / 1.0) - 0.5) - 0.44, pw));
        base *= 1.0 - 0.25 * cof;
        if (E == 2) { gBsGlow += cof * WG * 0.5; base = mix(base, WG, cof * 0.4); }
      }
    }
    // ============================================================== COVER
    else if (st == 2 && E == 2 && (prm == 1 || prm == 2 || prm == 4 || prm == 7 || prm == 10 || prm == 13 || prm == 17)) {
      // the 3000s' street furniture (bins, benches, the bollard blocks' benches, the hover cart, the café pods, the bike
      // dock): pearl ceramic with a shadow gap and a light at the foot, fluted faces, a moss or pale-oak seat inset on top,
      // an engraved roundel; one family, each its own top
      float fy = fu.y, h = fsz.y;
      vec3 pearl = bsC(0.9, 0.9, 0.88) * (0.95 + 0.06 * vnoise(fu * 3.0));
      base = pearl;
      if (wall) {
        float gap = bsAA(fy - 0.09, pw), foot = bsAA(abs(fy - 0.1) - 0.012, pw);
        float flute = 0.5 + 0.5 * cos(fu.x / 0.12 * 6.2832);
        base = pearl * (0.93 + 0.07 * flute) * step(0.22, fy) + pearl * step(fy, 0.22);
        base = mix(base, bsC(0.2, 0.22, 0.24), gap);
        base = mix(base, WG, foot); gBsGlow += foot * WG * 1.3;
        float rd = abs(length(fu - vec2(fsz.x * 0.5, h * 0.62)) - 0.09);
        base *= 1.0 - 0.25 * bsAA(rd - 0.012, pw) * step(0.7, fsz.x);
        float top2 = bsAA(abs(fy - h + 0.05) - 0.012, pw);
        base = mix(base, WG, top2 * 0.7); gBsGlow += top2 * WG * 0.5;
      } else if (top) {
        float e2 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
        float inset = step(0.1, e2);
        vec3 seat = prm == 1 || prm == 17 ? bsC(0.86, 0.87, 0.9) : (prm == 7 || prm == 10 ? bsC(0.62, 0.54, 0.42) * (0.9 + 0.12 * vnoise(fu * vec2(2.0, 18.0))) : bsLeaves(fu, pw));
        base = mix(pearl, seat, inset);
        float ls = bsAA(abs(e2 - 0.08) - 0.01, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.6;
      }
    }
    else if (st == 2) {
      vec2 q = wall ? W : P.xz;
      float y = P.y - (vWPos.y - fu.y);                      // (wall faces: v from the face's foot)
      float fy = fu.y, h = fsz.y;
      if (prm == 0) {
        // crates: timber boards with the frame and stencilled marks (all eras: the docks keep their crates)
        float bd = wall ? fract(fy / 0.2) : fract(fu.x / 0.2);
        vec3 wood = bsC(0.62, 0.48, 0.32) * (0.85 + 0.25 * h21(vec2(floor((wall ? fy : fu.x) / 0.2), vBsArt.y * 3.0))) * (0.92 + 0.12 * fbm(vec2(fu.x * 3.0, fu.y * 10.0)));
        base = wood * (1.0 - 0.4 * bsAA((0.5 - abs(bd - 0.5)) * 0.2 - 0.006, pw));
        float fr = 1.0 - bsAA(-min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y)) + 0.09, pw);
        base = mix(base, bsC(0.44, 0.33, 0.22), fr);
        if (wall) {
          float diag = bsAA(abs((fu.x - fsz.x * 0.5) / max(fsz.x, 0.1) - (fu.y - fsz.y * 0.5) / max(fsz.y, 0.1)) * min(fsz.x, fsz.y) - 0.05, pw);
          base = mix(base, bsC(0.44, 0.33, 0.22), diag * (1.0 - fr));
          float st2 = bsText(fu, vec2(fsz.x * 0.5, fsz.y * 0.62), 0.12, fsz.x * 0.55, 3.0 + floor(vBsArt.y), pw);
          base = mix(base, E == 2 ? bsC(0.5, 0.52, 0.56) : bsC(0.18, 0.14, 0.12), st2 * 0.75 * (1.0 - diag));
        }
        if (E == 2 && top) { float ls = bsAA(abs(min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y)) - 0.05) - 0.012, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.6; }
      } else if (prm == 1) {
        // bins: an ash barrel's galvanised hoops (1880s), a green wheelie bin (TODAY), a white recycling pod (3000s)
        if (E == 0) { base = bsC(0.5, 0.52, 0.52) * (0.85 + 0.2 * vnoise(q * 5.0)); base *= 1.0 - 0.3 * bsAA((0.5 - abs(fract(fy / 0.3) - 0.5)) * 0.3 - 0.02, pw); }
        else if (E == 1) { base = bsC(0.2, 0.3, 0.22) * (0.9 + 0.1 * vnoise(q * 8.0)); base = mix(base, bsC(0.12, 0.16, 0.13), bsAA(abs(fy - h + 0.12) - 0.05, pw)); if (wall) base = mix(base, bsC(0.85, 0.82, 0.72), bsText(fu, vec2(fsz.x * 0.5, h * 0.55), 0.1, fsz.x * 0.5, 7.0, pw)); }
        else { base = bsC(0.9, 0.9, 0.88); float ls = bsAA(abs(fy - h * 0.7) - 0.02, pw) * float(wall); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.8; }
      } else if (prm == 2 && E > 0) {
        // the bollard blocks TODAY: a timber-slatted bench on a concrete plinth; in the 3000s a white bench with a light line
        if (E == 1) {
          vec3 conc = bsC(0.55, 0.55, 0.53) * (0.9 + 0.12 * vnoise(q * 5.0));
          float slat = top ? 1.0 : step(h - 0.12, fy);
          vec3 wood = bsC(0.56, 0.42, 0.28) * (0.85 + 0.2 * h21(vec2(floor((top ? fu.y : fy) / 0.1), 2.0)));
          base = mix(conc, wood * (1.0 - 0.4 * bsAA((0.5 - abs(fract((top ? fu.y : fy) / 0.1) - 0.5)) * 0.1 - 0.01, pw)), slat);
          if (wall) base = mix(base, bsC(0.3, 0.3, 0.3), bsAA(fy - 0.08, pw));
        } else {
          base = bsC(0.92, 0.92, 0.9);
          float ls = float(wall) * bsAA(abs(fy - h + 0.12) - 0.015, pw);
          base = mix(base, WG, ls); gBsGlow += ls * WG;
        }
      } else if (prm == 2 || prm == 14 || prm == 16 || prm == 9) {
        // a bluestone block (bollard bases, the statue's plinth, mooring posts): dressed stone with a chamfered coping
        vec3 bs = bsC(0.36, 0.39, 0.43) * (0.9 + 0.15 * h21(floor(vec2((wall ? fu.x : P.x) / 0.5, (wall ? fy : P.z) / 0.3))));
        base = mix(base, bs, 0.85);
        if (wall) {
          base = mix(base, bs * 1.25, bsAA(abs(fy - h + 0.07) - 0.07, pw));
          base *= 1.0 - 0.25 * bsAA((0.5 - abs(fract(fy / 0.3) - 0.5)) * 0.3 - 0.008, pw);
          if (prm == 9 || prm == 16) {
            // the statue plinth (and the deck's foundation stone): a bronze plaque per era (a lord mayor, a tram conductor, a time traveller)
            float pq = bsRect(fu, vec2(fsz.x * 0.2, h * 0.35), vec2(fsz.x * 0.8, h * 0.72), pw);
            base = mix(base, bsC(0.36, 0.27, 0.16), pq);
            base = mix(base, bsC(0.66, 0.52, 0.3), pq * bsText(fu, vec2(fsz.x * 0.5, h * 0.6), 0.07, fsz.x * 0.5, 13.0 + float(E), pw));
            base = mix(base, bsC(0.66, 0.52, 0.3), pq * bsText(fu, vec2(fsz.x * 0.5, h * 0.46), 0.045, fsz.x * 0.45, 17.0 + float(E), pw) * 0.8);
          }
          if (prm == 2 && E == 0) {
            // the 1880s: a granite mounting block — a carved step line and V.R. (the iron rings are props)
            base = mix(base, bsC(0.55, 0.55, 0.53) * (0.9 + 0.15 * vnoise(fu * 4.0)), 0.7);
            base *= 1.0 - 0.3 * bsAA(abs(fy - h * 0.5) - 0.012, pw);
            base = mix(base, bsC(0.3, 0.3, 0.3), bsText(fu, vec2(fsz.x * 0.5, h * 0.72), 0.1, 0.4, 91.0, pw) * 0.6);
          }
          if (prm == 99) {
            float pc = abs(fract(fu.x / 0.6) - 0.5) * 0.6;
            float post = bsAA(pc - 0.08, pw) * step(0.12, fy);
            vec3 pcol = E == 0 ? bsC(0.18, 0.26, 0.22) : (E == 1 ? bsC(0.1, 0.1, 0.11) : bsC(0.92, 0.92, 0.9));
            base = mix(base, pcol, post * 0.9);
            if (E == 1) base = mix(base, bsC(0.72, 0.58, 0.3), post * bsAA(abs(fy - h + 0.2) - 0.03, pw));
            if (E == 2) gBsGlow += post * bsAA(abs(fy - h + 0.18) - 0.02, pw) * WG;
          }
        }
      } else if (prm == 3) {
        // a stone horse trough: granite, the water in the 1880s, flowers TODAY, a light planter in the 3000s (fix round 1:
        // its sides the 3000s' pearl family too — they stayed granite grey boxes)
        base = E == 2 ? bsC(0.9, 0.9, 0.88) * (0.95 + 0.06 * vnoise(q * 3.0)) : bsC(0.5, 0.5, 0.48) * (0.9 + 0.15 * vnoise(q * 3.0));
        if (E == 2 && wall) { float fl3 = 0.5 + 0.5 * cos(fu.x / 0.12 * 6.2832); base *= 0.93 + 0.07 * fl3 * step(0.22, fy); float ls3 = bsAA(abs(fy - 0.1) - 0.012, pw) + bsAA(abs(fy - h + 0.14) - 0.012, pw); base = mix(base, WG, clamp(ls3, 0.0, 1.0)); gBsGlow += clamp(ls3, 0.0, 1.0) * WG * 1.1; base = mix(base, bsC(0.2, 0.22, 0.24), bsAA(fy - 0.08, pw)); }
        if (wall && E < 2) { base = mix(base, base * 1.2, bsAA(abs(fy - h + 0.06) - 0.06, pw)); base = mix(base, bsC(0.3, 0.3, 0.3), bsRect(fu, vec2(fsz.x * 0.3, h * 0.3), vec2(fsz.x * 0.7, h * 0.6), pw) * 0.3); }
        if (top) {
          float e2 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
          float inner = step(0.12, e2);
          vec3 fill = E == 0 ? bsC(0.18, 0.24, 0.24) : (E == 1 ? mix(bsC(0.3, 0.42, 0.22), bsC(0.75, 0.5, 0.55), step(0.7, h21(floor(P.xz * 6.0)))) : bsC(0.86, 0.88, 0.84));
          base = mix(base, fill * (0.85 + 0.25 * vnoise(P.xz * 9.0)), inner);
          if (E == 0) gBaseRough = mix(gBaseRough, 0.15, inner);
          if (E == 2) { float ls = bsAA(abs(e2 - 0.1) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.7; }
        }
      } else if (prm == 4 || prm == 13) {
        // benches: timber slats on iron ends (the slats along the long side)
        float along = fsz.x > fsz.y ? fu.y : fu.x;
        vec3 wood = bsC(0.56, 0.42, 0.28) * (0.85 + 0.2 * h21(vec2(floor(along / 0.11), 1.0)));
        base = wood * (1.0 - 0.45 * bsAA((0.5 - abs(fract(along / 0.11) - 0.5)) * 0.11 - 0.01, pw));
        if (wall) { float ends = bsAA(min(fu.x, fsz.x - fu.x) - 0.12, pw); base = mix(base, E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.16, 0.2, 0.18), max(ends, bsAA(fy - 0.3, pw))); }
        if (E == 2) { base = mix(base, bsC(0.88, 0.88, 0.86), 0.55); float ls = float(wall) * bsAA(abs(fy - 0.35) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.8; }
      } else if (prm == 6 && top) {
        // the ring's flower beds: clipped box and red geraniums in a cast-iron edging (1880s), grasses and lilies (TODAY),
        // white flowers in pearl edging round a light line (3000s)
        float e2 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
        float edging = 1.0 - step(0.16, e2);
        vec2 cq = P.xz * 7.5 + vec2(0.37 * floor(P.z * 7.5), 0.0);
        float bloom = step(0.55, h21(floor(cq))) * step(length(fract(cq) - 0.5 - 0.2 * (vec2(h21(floor(cq) + 1.3), h21(floor(cq) + 7.1)) - 0.5)), 0.24 + 0.1 * h21(floor(cq) + 3.0));
        vec3 leaf = (E == 0 ? bsC(0.22, 0.34, 0.18) : (E == 1 ? bsC(0.34, 0.46, 0.24) : bsC(0.38, 0.5, 0.3))) * (0.7 + 0.5 * vnoise(P.xz * 7.0));
        float fk = h21(floor(cq) + 5.0);
        vec3 fl = E == 0 ? mix(bsC(0.62, 0.14, 0.12), bsC(0.86, 0.8, 0.7), step(0.8, fk)) : (E == 1 ? mix(bsC(0.55, 0.55, 0.82), bsC(0.9, 0.82, 0.4), step(0.65, fk)) : mix(bsC(0.94, 0.94, 0.92), bsC(0.86, 0.84, 0.94), step(0.7, fk)));
        base = mix(mix(leaf, fl, bloom), E == 0 ? bsC(0.16, 0.22, 0.2) : (E == 1 ? bsC(0.42, 0.33, 0.24) : bsC(0.92, 0.92, 0.9)), edging);
        gTexStr *= 1.0 - edging;
        if (E == 2) { float ls = bsAA(abs(e2 - 0.24) - 0.012, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.8; }
      } else if (prm == 5 || prm == 6) {
        // planters: cast-iron with a beaded rim (1880s), dark concrete with a timber rim (TODAY), white ceramic with a
        // light band (3000s); planted tops (the beds on low ring-beds)
        float fy2 = fy;
        if (wall) {
          vec3 pc = E == 0 ? bsC(0.22, 0.26, 0.24) : (E == 1 ? bsC(0.4, 0.4, 0.4) : bsC(0.9, 0.9, 0.88));
          base = pc * (0.9 + 0.15 * vnoise(fu * 4.0));
          float rim = bsAA(abs(fy2 - h + 0.06) - 0.06, pw);
          base = mix(base, E == 1 ? bsC(0.5, 0.38, 0.26) : pc * 1.25, rim);
          if (E == 0) { float bead = bsAA(abs(fract(fu.x / 0.25) - 0.5) * 0.25 - 0.03, pw) * bsAA(abs(fy2 - h * 0.5) - 0.12, pw); base = mix(base, pc * 1.4, bead); }
          if (E == 2) { float ls = bsAA(abs(fy2 - h + 0.18) - 0.018, pw); base = mix(base, WG, ls); gBsGlow += ls * WG; }
          if (E == 1) base *= 1.0 - 0.2 * bsAA(abs(fract(fu.x / 1.0) - 0.5) - 0.495, pw);
        }
      } else if (prm == 7) {
        // the cart: a costermonger's barrow (1880s), an espresso cart (TODAY), a hover cart (3000s)
        if (E == 0) { float pl = fract(fy / 0.16); base = bsC(0.5, 0.36, 0.24) * (1.0 - 0.35 * bsAA((0.5 - abs(pl - 0.5)) * 0.16 - 0.006, pw)); if (top) base = mix(bsC(0.62, 0.5, 0.26), bsC(0.55, 0.15, 0.12), step(0.5, h21(floor(P.xz * 7.0)))) * (0.8 + 0.3 * vnoise(P.xz * 14.0)); }
        else if (E == 1) { base = bsC(0.22, 0.32, 0.3); if (wall) { base = mix(base, bsC(0.85, 0.82, 0.74), bsRect(fu, vec2(0.1, h * 0.45), vec2(fsz.x - 0.1, h * 0.85), pw)); base = mix(base, bsC(0.22, 0.2, 0.18), bsText(fu, vec2(fsz.x * 0.5, h * 0.66), 0.13, fsz.x * 0.7, 21.0, pw)); } if (top) base = bsC(0.5, 0.42, 0.34); }
        else { base = bsC(0.92, 0.92, 0.9); float ls = bsAA(abs(fy - 0.2) - 0.03, pw) * float(wall); base = mix(base, WG, ls); gBsGlow += ls * WG * 1.2; if (top) base = bsC(0.85, 0.87, 0.9); }
      } else if (prm == 8) {
        // the drinking fountain: polished granite with a bronze basin rim, a lion's mask on the faces
        base = bsC(0.5, 0.5, 0.49) * (0.88 + 0.22 * vnoise(q * 6.0)) * (0.95 + 0.1 * step(0.5, fract(fy / 0.4)));
        gBaseRough = 0.35;
        if (wall) {
          base = mix(base, base * 1.3, bsAA(abs(fy - h + 0.08) - 0.08, pw));
          float mk = bsAA(length(fu - vec2(fsz.x * 0.5, h * 0.55)) - 0.18, pw);
          base = mix(base, bsC(0.4, 0.3, 0.18), mk);
          base = mix(base, bsC(0.15, 0.12, 0.1), mk * bsAA(length(fu - vec2(fsz.x * 0.5, h * 0.5)) - 0.04, pw));
        }
        if (top) { float e2 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y)); float bowl = step(0.2, e2); base = mix(base, E == 2 ? bsC(0.8, 0.86, 0.9) : bsC(0.2, 0.26, 0.28), bowl); gBaseRough = mix(gBaseRough, 0.1, bowl); base = mix(base, bsC(0.48, 0.36, 0.2), bsAA(abs(e2 - 0.17) - 0.03, pw)); }
      } else if (prm == 10) {
        // the café tables (TODAY, the 3000s): a timber counter with a chalkboard menu; the 3000s a pearl café pod
        if (E == 2) { base = bsC(0.92, 0.92, 0.9); float ls = bsAA(abs(fy - h + 0.1) - 0.02, pw) * float(wall); base = mix(base, WG, ls); gBsGlow += ls * WG; }
        else {
          float bd = fract(fy / 0.12); base = bsC(0.52, 0.38, 0.26) * (1.0 - 0.3 * bsAA((0.5 - abs(bd - 0.5)) * 0.12 - 0.006, pw));
          if (wall) { float board = bsRect(fu, vec2(0.12, 0.25), vec2(fsz.x - 0.12, h - 0.15), pw); base = mix(base, bsC(0.1, 0.11, 0.1), board); base = mix(base, bsC(0.86, 0.84, 0.78), board * (bsText(fu, vec2(fsz.x * 0.5, h - 0.3), 0.09, fsz.x * 0.6, 25.0, pw) + 0.6 * bsText(fu, vec2(fsz.x * 0.5, h * 0.5), 0.05, fsz.x * 0.62, 29.0, pw))); }
          if (top) base = bsC(0.55, 0.52, 0.48) * (0.9 + 0.15 * vnoise(P.xz * 6.0));
        }
      } else if (prm == 11) {
        // the coal bin (a museum exhibit TODAY): riveted iron, coal heaped in the top; (fix round 1) in the 3000s the
        // float-tram dock keeps it in a pearl vitrine — the iron bin seen through a glass band, a lit label
        base = bsC(0.22, 0.22, 0.22) * (0.85 + 0.25 * vnoise(q * 6.0));
        if (wall) base *= 1.0 - 0.3 * bsAA(abs(fract(fu.x / 0.3) - 0.5) * 0.3 - 0.01, pw);
        if (E == 2 && wall) {
          float band = step(0.35, fy) * step(fy, h - 0.25);
          base = mix(bsC(0.9, 0.9, 0.88), mix(base * 1.4, bsC(0.55, 0.6, 0.66), 0.25), band);
          gBaseRough = mix(gBaseRough, 0.1, band);
          float ls4 = bsAA(abs(fy - 0.35) - 0.012, pw) + bsAA(abs(fy - h + 0.25) - 0.012, pw);
          base = mix(base, WG, clamp(ls4, 0.0, 1.0)); gBsGlow += clamp(ls4, 0.0, 1.0) * WG;
          float lab = bsRect(fu, vec2(fsz.x * 0.25, 0.12), vec2(fsz.x * 0.75, 0.28), pw);
          base = mix(base, bsC(0.2, 0.24, 0.3), lab); base = mix(base, WG, lab * bsText(fu, vec2(fsz.x * 0.5, 0.2), 0.07, fsz.x * 0.4, 205.0, pw)); gBsGlow += lab * WG * 0.3;
        }
        if (top) base = bsC(0.06, 0.06, 0.065) * (0.6 + 0.9 * vnoise(P.xz * 20.0));
      } else if (prm == 12) {
        // the buffer stop: timber beam on iron, the red disc and the white bar on its face
        base = bsC(0.4, 0.3, 0.2) * (0.9 + 0.15 * vnoise(q * 5.0));
        if (wall) { base = mix(base, bsC(0.55, 0.12, 0.1), bsAA(length(fu - vec2(fsz.x * 0.5, h * 0.6)) - 0.24, pw)); base = mix(base, bsC(0.9, 0.88, 0.82), bsRect(fu, vec2(fsz.x * 0.5 - 0.18, h * 0.6 - 0.04), vec2(fsz.x * 0.5 + 0.18, h * 0.6 + 0.04), pw)); }
      } else if (prm == 15) {
        // the boat racks (roof tops): timber trestles
        base = bsC(0.5, 0.38, 0.26) * (0.9 + 0.2 * vnoise(q * 4.0));
      } else if (prm == 17) {
        // the bike dock (3000s): white with a light strip
        base = bsC(0.9, 0.9, 0.88); float ls = bsAA(abs(fy - 0.5) - 0.02, pw) * float(wall); base = mix(base, WG, ls); gBsGlow += ls * WG;
      } else if (prm == 18) {
        // the bridge lamp's plinth: painted cast iron
        base = bsC(0.2, 0.24, 0.24) * (0.9 + 0.2 * vnoise(q * 6.0));
        if (wall) base = mix(base, bsC(0.6, 0.5, 0.3), bsAA(abs(fy - h + 0.1) - 0.03, pw));
      }
    }
    // ============================================================== STRUCT (small structures)
    else if (st == 3) {
      float fy = fu.y, h = fsz.y;
      vec2 f = fu;
      if (prm == 0) {
        // the telephone kiosks: dark green cast iron, glazing bars, TELEPHONE plates (props); never change (Tartar's)
        base = bsC(0.18, 0.28, 0.24) * (0.92 + 0.1 * vnoise(f * 4.0));
        if (wall) {
          vec2 gq = vec2(fract(f.x / max(fsz.x, 0.1)), fy);
          float gl = bsRect(f, vec2(0.12, 0.7), vec2(fsz.x - 0.12, h - 0.45), pw);
          float bar = max(bsAA(abs(fract((f.x - 0.12) / ((fsz.x - 0.24) / 3.0)) - 0.5) * ((fsz.x - 0.24) / 3.0) - 0.02, pw), bsAA(abs(fract((fy - 0.7) / 0.3) - 0.5) * 0.3 - 0.018, pw));
          base = mix(base, bsGlass(f, 0.7, h, 1.0), gl * (1.0 - bar));
          base = mix(base, bsC(0.86, 0.82, 0.7), bsRect(f, vec2(0.15, h - 0.38), vec2(fsz.x - 0.15, h - 0.18), pw) * 0.0);
          gBsLit += gl * (1.0 - bar) * bsC(1.0, 0.86, 0.6) * 0.45;
          if (gl * (1.0 - bar) > 0.5) { gBaseRough = 0.12; gTexStr = 0.0; }
        }
      } else if (prm == 1 || prm == 2) {
        // ticket booths: varnished timber with a ticket window (1880s), glass and steel with a lit sign (TODAY), pearl (3000s)
        vec3 c0 = E == 0 ? bsC(0.42, 0.28, 0.18) : (E == 1 ? bsC(0.3, 0.33, 0.34) : bsC(0.92, 0.92, 0.9));
        base = c0 * (0.9 + 0.12 * vnoise(f * vec2(2.0, 12.0)));
        if (E == 0) base *= 1.0 - 0.25 * bsAA((0.5 - abs(fract(f.x / 0.15) - 0.5)) * 0.15 - 0.005, pw);
        if (wall && fsz.x > 1.0) {
          float win = bsRect(f, vec2(fsz.x * 0.2, h * 0.45), vec2(fsz.x * 0.8, h * 0.82), pw);
          float frm = bsRect(f, vec2(fsz.x * 0.2 - 0.06, h * 0.45 - 0.06), vec2(fsz.x * 0.8 + 0.06, h * 0.82 + 0.06), pw) * (1.0 - win);
          base = mix(base, E == 0 ? bsC(0.62, 0.48, 0.28) : (E == 1 ? bsC(0.74, 0.76, 0.78) : WG), frm);
          if (E == 1) {
            float scr = bsRect(f, vec2(fsz.x * 0.62, h * 0.2), vec2(fsz.x * 0.86, h * 0.4), pw);
            base = mix(base, bsC(0.12, 0.2, 0.3), scr); gBsLit += scr * bsC(0.35, 0.55, 0.8) * 0.6;
            base = mix(base, bsC(0.85, 0.88, 0.9), scr * bsText(f, vec2(fsz.x * 0.74, h * 0.32), 0.05, fsz.x * 0.2, 131.0, pw));
            base = mix(base, bsC(0.6, 0.62, 0.64), bsAA(fy - 0.25, pw));
          }
          // (the 3000s: dark smart glass with the timetable in light on it, framed in white-gold)
          // (fix round 1: the 1880s' and TODAY's ticket windows show the booking clerk's office behind them — its charts,
          //  its desk — lit by its own light, not a flat lit pane at dusk)
          vec3 Vt = bsViewIn();
          float ft2 = 0.05 + 0.75 * pow(1.0 - Vt.z, 4.0);
          vec3 troom = E == 2 ? vec3(0.0) : bsRoomIf(win, vec2(f.x - fsz.x * 0.5, fy), Vt, vec4(fsz.x * 0.45, 0.05, h - 0.1, min(fsz.x, 1.6)), 10.0, float(prm) + 3.0, E);
          base = mix(base, E == 2 ? mix(bsC(0.2, 0.25, 0.32), bsC(0.32, 0.38, 0.46), smoothstep(h * 0.45, h * 0.82, fy)) : mix(troom * 0.14, bsGlass(f, h * 0.45, h * 0.82, 1.0), ft2), win);
          if (E < 2) gBsRoom += win * troom * (1.0 - ft2) * (E == 0 ? 0.7 : 0.95);
          if (E == 2) { float tt = win * (bsText(f, vec2(fsz.x * 0.5, h * 0.74), 0.07, fsz.x * 0.5, 141.0, pw) + bsText(f, vec2(fsz.x * 0.5, h * 0.64), 0.05, fsz.x * 0.48, 143.0, pw) + bsText(f, vec2(fsz.x * 0.5, h * 0.56), 0.05, fsz.x * 0.44, 147.0, pw)); base = mix(base, WG, clamp(tt, 0.0, 1.0)); gBsGlow += clamp(tt, 0.0, 1.0) * WG * 0.8; }
          if (E == 2) gBsLit += win * WG * 0.5;
          if (win > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
          float sign = bsRect(f, vec2(0.1, h - 0.32), vec2(fsz.x - 0.1, h - 0.06), pw);
          base = mix(base, E == 0 ? bsC(0.12, 0.16, 0.14) : (E == 1 ? bsC(0.14, 0.2, 0.32) : WG * 0.9), sign);
          base = mix(base, E == 2 ? bsC(0.3, 0.28, 0.24) : bsC(0.86, 0.78, 0.52), sign * bsText(f, vec2(fsz.x * 0.5, h - 0.19), 0.14, fsz.x * 0.62, 51.0, pw));
          if (E == 1) gBsLit += sign * bsC(0.3, 0.4, 0.6) * 0.3;
          if (E == 2) gBsGlow += sign * WG * 0.4;
        }
      } else if (prm == 3) {
        // the poster column: bills per era (theatre bills and auctions; gigs and festivals; slow-moving light adverts)
        base = bsC(0.26, 0.3, 0.26);
        if (wall) {
          float band = step(0.35, fy) * step(fy, h - 0.35);
          vec2 cell = floor(vec2(f.x / 0.62, (fy - 0.35) / 0.75)), lc = vec2(fract(f.x / 0.62), fract((fy - 0.35) / 0.75));
          float hs = bsH(cell + 3.0 * float(E) + 1.0);
          vec3 paper = E == 0 ? mix(bsC(0.84, 0.78, 0.64), bsC(0.7, 0.6, 0.46), hs) : (E == 1 ? mix(bsC(0.62, 0.5, 0.46), bsC(0.4, 0.48, 0.52), hs) : mix(bsC(0.86, 0.88, 0.92), WG, hs * 0.4));
          float pp = bsAA(bsBox(lc, vec2(0.5), vec2(0.46, 0.46)), pw / 0.62);
          vec3 ink = E == 2 ? bsC(0.4, 0.42, 0.5) : bsC(0.16, 0.12, 0.1);
          float tx = bsText(lc, vec2(0.5, 0.7), 0.14, 0.8, cell.x + cell.y * 5.0 + float(E) * 11.0, pw / 0.62) + bsText(lc, vec2(0.5, 0.4), 0.07, 0.76, cell.x * 2.0 + 3.0, pw / 0.62);
          base = mix(base, mix(paper, ink, clamp(tx, 0.0, 1.0)), pp * band);
          if (E == 0) gBsOld = max(gBsOld, pp * band);
          if (E == 2) gBsLit += pp * band * paper * 0.35;
          base = mix(base, bsC(0.4, 0.36, 0.26), bsAA(abs(fy - h + 0.2) - 0.1, pw));
        }
      } else if (prm == 20) {
        // (fix round 1) the floating garden's glasshouse: a pearl frame (corner posts, a sill course, glazing bars every
        // 0.6 m and a transom), clear glass over benches of potted plants and hanging greenery inside (bsRoom kind 8), a
        // white-gold light along the eaves and the roof's ridge; the roof glazed over the plants
        if (wall) {
          float bx3 = abs(fract(f.x / 0.6 + 0.5) - 0.5) * 0.6;
          float frame = max(max(bsAA(min(f.x, fsz.x - f.x) - 0.07, pw), bsAA(fy - 0.45, pw)), max(bsAA(bx3 - 0.02, pw), bsAA(abs(fy - 1.75) - 0.025, pw)));
          frame = max(frame, bsAA(h - fy - 0.08, pw));
          vec3 Vg = bsViewIn();
          float fg = 0.05 + 0.7 * pow(1.0 - Vg.z, 4.0);
          vec3 room = bsRoomIf(1.0 - frame, vec2(f.x - fsz.x * 0.5, fy), Vg, vec4(fsz.x * 0.5 - 0.02, 0.0, h - 0.1, fsz.x > 2.0 ? 1.15 : 2.75), 8.0, fsz.x, 2);
          vec3 refl = mix(bsC(0.6, 0.66, 0.7), bsC(0.9, 0.93, 0.95), smoothstep(0.4, h, fy));
          base = mix(mix(room * 0.25, refl, fg), bsC(0.93, 0.93, 0.92), frame);
          gBsRoom += (1.0 - frame) * room * (1.0 - fg) * 0.95;
          float ls = bsAA(abs(fy - h + 0.12) - 0.015, pw) + bsAA(abs(fy - 0.47) - 0.012, pw);
          base = mix(base, WG, clamp(ls, 0.0, 1.0)); gBsGlow += clamp(ls, 0.0, 1.0) * WG;
          if (frame < 0.5) { gBaseRough = 0.06; gTexStr = 0.0; }
        } else if (top) {
          vec2 tq = fu;
          float bar = max(bsAA(abs(fract(tq.x / 0.6 + 0.5) - 0.5) * 0.6 - 0.02, pw), bsAA(min(min(tq.x, fsz.x - tq.x), min(tq.y, fsz.y - tq.y)) - 0.07, pw));
          float ridge = bsAA(abs(tq.y - fsz.y * 0.5) - 0.025, pw);
          vec3 under = bsLeaves(tq * 1.3, pw) * 0.55;
          base = mix(mix(under, bsC(0.82, 0.88, 0.9), 0.35), bsC(0.93, 0.93, 0.92), bar);
          base = mix(base, WG, ridge); gBsGlow += ridge * WG * 1.2;
          gBsRoom += (1.0 - bar) * under * 0.4;
          gBaseRough = 0.08; gTexStr = 0.0;
        }
      } else if (E == 2 && wall && (prm == 4 || prm == 5 || prm == 6 || prm == 7 || prm == 8 || prm == 9 || prm == 13)) {
        // (fix round 1) the 3000s' small structures each with their function, pearl panels with light seams: the cab
        // shelters' bench and light through a wide window (a room behind), the news kiosk's hologram headlines scrolling in
        // light, the tram shelter's seat under its timetable screen, the ferry office's and boat shed's lit interiors (an
        // office's charts, the boats on their racks), the ferryman's box's route map of the river and its timetable in light
        base = bsC(0.9, 0.9, 0.88) * (0.95 + 0.06 * vnoise(f * 3.0));
        vec3 Vs = bsViewIn();
        float fs = 0.05 + 0.75 * pow(1.0 - Vs.z, 4.0);
        if (prm == 4 || prm == 5 || prm == 8 || prm == 9) {
          float wi = bsRect(f, vec2(0.15, 0.45), vec2(fsz.x - 0.15, h - 0.35), pw);
          float kd = prm == 8 ? 10.0 : (prm == 9 ? 7.0 : 9.0);
          vec3 room = bsRoomIf(wi, vec2(f.x - fsz.x * 0.5, fy), Vs, vec4(fsz.x * 0.5 - 0.1, 0.05, h - 0.2, prm == 8 ? 2.6 : 1.8), kd, float(prm) + fsz.x, 2);
          base = mix(base, mix(room * 0.22, bsC(0.8, 0.84, 0.88), fs), wi);
          gBsRoom += wi * room * (1.0 - fs);
          if (wi > 0.5) { gBaseRough = 0.08; gTexStr = 0.0; }
          float fr = bsRect(f, vec2(0.1, 0.4), vec2(fsz.x - 0.1, h - 0.3), pw) * (1.0 - wi);
          base = mix(base, WG, fr * 0.7); gBsGlow += fr * WG * 0.5;
        } else if (prm == 6) {
          float band = bsRect(f, vec2(0.08, h * 0.42), vec2(fsz.x - 0.08, h * 0.86), pw);
          base = mix(base, mix(bsC(0.16, 0.2, 0.26), bsC(0.26, 0.3, 0.4), smoothstep(h * 0.42, h * 0.86, fy)), band);
          float tt = 0.0;
          for (int k = 0; k < 3; k++) { float yk = h * (0.52 + 0.12 * float(k)); tt += bsText(vec2(mod(f.x + uEraT * (0.25 + 0.08 * float(k)), 3.0), fy), vec2(1.5, yk), 0.08, 2.8, 171.0 + float(k) * 7.0, pw); }
          tt = clamp(tt, 0.0, 1.0) * band;
          base = mix(base, WG, tt); gBsGlow += tt * WG * 1.1 + band * bsC(0.6, 0.66, 0.8) * 0.12;
          if (band > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
        } else if (prm == 7) {
          float seat = bsRect(f, vec2(0.12, 0.42), vec2(fsz.x - 0.12, 0.54), pw), moss = bsRect(f, vec2(0.16, 0.5), vec2(fsz.x - 0.16, 0.56), pw);
          base = mix(base, bsC(0.95, 0.95, 0.93), seat); base = mix(base, bsLeaves(f, pw), moss);
          float scr = bsRect(f, vec2(fsz.x * 0.2, 1.25), vec2(fsz.x * 0.8, 1.95), pw);
          base = mix(base, bsC(0.16, 0.2, 0.26), scr);
          float tt = scr * clamp(bsText(f, vec2(fsz.x * 0.5, 1.82), 0.08, fsz.x * 0.5, 181.0, pw) + bsText(f, vec2(fsz.x * 0.5, 1.66), 0.06, fsz.x * 0.52, 183.0, pw) + bsText(f, vec2(fsz.x * 0.5, 1.52), 0.06, fsz.x * 0.48, 187.0, pw) + bsText(f, vec2(fsz.x * 0.5, 1.38), 0.06, fsz.x * 0.5, 189.0, pw), 0.0, 1.0);
          base = mix(base, WG, tt); gBsGlow += tt * WG;
          if (scr > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
        } else {
          // the ferryman's box: on each face a smart-glass panel — the river's route in light (the line, the stops) over
          // the timetable
          float pan = bsRect(f, vec2(0.12, h * 0.3), vec2(fsz.x - 0.12, h * 0.86), pw);
          base = mix(base, mix(bsC(0.16, 0.2, 0.26), bsC(0.26, 0.3, 0.4), smoothstep(h * 0.3, h * 0.86, fy)), pan);
          float ry = h * 0.72 + 0.09 * sin(f.x * 3.1 + 0.6);
          float route = bsAA(abs(fy - ry) - 0.014, pw) * step(0.25, f.x) * step(f.x, fsz.x - 0.25);
          float stops = 0.0; for (int k = 0; k < 4; k++) { float sx = 0.3 + (fsz.x - 0.6) * float(k) / 3.0; stops += bsAA(length(vec2(f.x - sx, fy - (h * 0.72 + 0.09 * sin(sx * 3.1 + 0.6)))) - 0.045, pw); }
          float tt = bsText(f, vec2(fsz.x * 0.5, h * 0.52), 0.06, fsz.x * 0.62, 191.0, pw) + bsText(f, vec2(fsz.x * 0.5, h * 0.43), 0.06, fsz.x * 0.58, 193.0, pw) + bsText(f, vec2(fsz.x * 0.5, h * 0.35), 0.06, fsz.x * 0.6, 197.0, pw);
          float lit = clamp(route + stops + tt, 0.0, 1.0) * pan;
          base = mix(base, WG, lit); gBsGlow += lit * WG * 1.1 + pan * bsC(0.6, 0.66, 0.8) * 0.1;
          if (pan > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
        }
        float seam = bsAA(abs(fy - h * 0.94) - 0.015, pw) + bsAA(abs(fy - 0.3) - 0.012, pw);
        base = mix(base, WG, clamp(seam, 0.0, 1.0)); gBsGlow += clamp(seam, 0.0, 1.0) * WG;
      } else if (prm == 4 || prm == 5 || prm == 6 || prm == 7 || prm == 8 || prm == 9 || prm == 13) {
        // the cab shelters, the news kiosk, the tram shelter, the ferry office, the boat shed, the ferryman's box: timber
        // huts (green with cream window frames in the 1880s; TODAY coffee, papers and tickets behind glass; the 3000s
        // pearl panels with light seams)
        vec3 c0 = prm == 9 || prm == 13 ? bsC(0.42, 0.34, 0.26) : bsC(0.2, 0.3, 0.25);
        if (E == 1) c0 = prm == 6 ? bsC(0.18, 0.2, 0.22) : (prm == 8 ? bsC(0.22, 0.28, 0.36) : c0 * 1.15);
        if (E == 2) c0 = bsC(0.9, 0.9, 0.88);
        float boards = bsAA((0.5 - abs(fract((wall ? fy : f.x) / 0.16) - 0.5)) * 0.16 - 0.006, pw);
        base = c0 * (0.92 + 0.1 * vnoise(f * 3.0)) * (1.0 - (E == 2 ? 0.0 : 0.3) * boards);
        if (wall && fsz.x > 0.9 && h > 1.6) {
          float nwin = max(1.0, floor(fsz.x / 1.1));
          float wx = fract(f.x / (fsz.x / nwin)) * (fsz.x / nwin);
          vec2 wq = vec2(wx - fsz.x / nwin * 0.5, fy);
          float win = bsRect(wq, vec2(-fsz.x / nwin * 0.32, h * 0.5), vec2(fsz.x / nwin * 0.32, h * 0.82), pw);
          float frame = bsRect(wq, vec2(-fsz.x / nwin * 0.32 - 0.06, h * 0.5 - 0.06), vec2(fsz.x / nwin * 0.32 + 0.06, h * 0.82 + 0.06), pw) * (1.0 - win);
          float bar = bsAA(abs(wq.x) - 0.016, pw) * float(E == 0);
          base = mix(base, E == 2 ? bsC(0.98, 0.97, 0.94) : bsC(0.86, 0.82, 0.7), frame);
          // (fix round 1) a room behind each window, with its use (the shelters' benches, the news kiosk's papers, the
          // ferry office's charts, the boat shed's boats), lit by its own light — not a flat lit pane at dusk
          float hk = prm == 6 ? 4.0 : (prm == 8 || prm == 13 ? 10.0 : (prm == 9 ? 7.0 : 9.0));
          vec3 Vh = bsViewIn();
          float fh = 0.05 + 0.75 * pow(1.0 - Vh.z, 4.0);
          vec3 hroom = bsRoomIf(win, wq, Vh, vec4(fsz.x / nwin * 0.32 + 0.15, 0.05, h - 0.15, min(fsz.y, 1.8)), hk, float(prm) + floor(f.x / (fsz.x / nwin)), E);
          vec3 g = mix(hroom * 0.14, bsGlass(wq, h * 0.5, h * 0.82, 1.0), fh);
          base = mix(base, g, win * (1.0 - bar));
          base = mix(base, bsC(0.86, 0.82, 0.7), win * bar);
          gBsRoom += win * (1.0 - bar) * hroom * (1.0 - fh) * (E == 0 ? 0.7 : 0.95);
          if (win > 0.5) { gBaseRough = 0.1; gTexStr = 0.0; }
          if (E == 2) { float seam = bsAA(abs(fy - h * 0.92) - 0.015, pw); base = mix(base, WG, seam); gBsGlow += seam * WG; }
          // a fascia band under the eaves with signwriting (the props carry the important words), and a door on the long side
          if (h > 2.5) {
            float fas = bsRect(f, vec2(0.0, h - 0.42), vec2(fsz.x, h - 0.08), pw);
            base = mix(base, E == 0 ? bsC(0.86, 0.8, 0.62) : (E == 1 ? bsC(0.9, 0.88, 0.84) : bsC(0.97, 0.96, 0.94)), fas);
            base = mix(base, E == 0 ? bsC(0.3, 0.16, 0.12) : (E == 1 ? bsC(0.16, 0.24, 0.36) : WG * 0.8), fas * bsText(f, vec2(fsz.x * 0.5, h - 0.25), 0.2, fsz.x * 0.6, 111.0 + float(prm), pw));
            if (fsz.x > 4.0) { float door = bsRect(f, vec2(fsz.x - 1.35, 0.0), vec2(fsz.x - 0.45, h * 0.72), pw); base = mix(base, E == 2 ? bsC(0.98, 0.97, 0.94) : c0 * 0.7, door); base = mix(base, bsC(0.7, 0.58, 0.3), door * bsAA(length(f - vec2(fsz.x - 0.6, h * 0.36)) - 0.035, pw)); }
          }
          // the skirt
          base = mix(base, base * 0.7, bsAA(fy - 0.2, pw));
        }
        if (top) base = E == 2 ? bsC(0.92, 0.92, 0.9) : bsC(0.3, 0.32, 0.32) * (0.9 + 0.2 * vnoise(f * 3.0));
      } else if (prm == 18 || prm == 19) {
        // the arcade's kiosk and flower stall: the builders' stacked bricks and lime sacks (1880s, under construction), a
        // newsagent's kiosk / buckets of flowers in a timber stall (TODAY), a pearl kiosk / a stall of potted plants (3000s)
        if (E == 0) {
          vec2 bq = vec2((wall ? f.x : P.x) / 0.23 + 0.5 * floor(fy / 0.075), (wall ? fy : P.z) / 0.075);
          float j = max(bsAA((0.5 - abs(fract(bq.x) - 0.5)) * 0.23 - 0.007, pw), bsAA((0.5 - abs(fract(bq.y) - 0.5)) * 0.075 - 0.0055, pw));
          base = mix(bsC(0.56, 0.3, 0.22) * (0.85 + 0.25 * h21(floor(bq))), bsC(0.7, 0.66, 0.6), j);
          if (prm == 19) base = mix(base, bsC(0.82, 0.78, 0.68) * (0.9 + 0.2 * vnoise(f * 9.0)), step(h * 0.55, fy));
        } else if (E == 1) {
          vec3 c0 = prm == 18 ? bsC(0.2, 0.3, 0.26) : bsC(0.5, 0.38, 0.26);
          base = c0 * (0.9 + 0.12 * vnoise(f * 3.0));
          if (wall) {
            float win = bsRect(f, vec2(0.12, h * 0.45), vec2(fsz.x - 0.12, h * 0.85), pw);
            if (prm == 18) { base = mix(base, bsGlass(f, h * 0.45, h * 0.85, 1.0), win); gBsLit += win * bsC(1.0, 0.86, 0.64) * 0.7; base = mix(base, bsC(0.86, 0.8, 0.6), bsText(f, vec2(fsz.x * 0.5, h * 0.3), 0.1, fsz.x * 0.6, 101.0, pw)); }
            else {
              // buckets of flowers in two tiers along the stall's front
              float tier = step(h * 0.5, fy) * step(fy, h * 0.66) + step(h * 0.74, fy) * step(fy, h * 0.9);
              vec2 cq = f * vec2(12.0, 14.0);
              float bl = tier * step(0.3, h21(floor(cq))) * step(length(fract(cq) - 0.5), 0.3);
              base = mix(base, bsC(0.28, 0.4, 0.22) * (0.8 + 0.4 * vnoise(f * 20.0)), tier * 0.8);
              base = mix(base, mix(mix(bsC(0.72, 0.3, 0.36), bsC(0.88, 0.78, 0.34), step(0.5, h21(floor(cq) + 3.0))), bsC(0.92, 0.9, 0.86), step(0.8, h21(floor(cq) + 9.0))), bl);
              base = mix(base, bsC(0.5, 0.52, 0.52), bsAA(abs(fy - h * 0.49) - 0.04, pw) + bsAA(abs(fy - h * 0.73) - 0.04, pw));
            }
          }
          if (top) base = prm == 19 ? bsC(0.34, 0.46, 0.26) * (0.7 + 0.5 * vnoise(P.xz * 9.0)) : bsC(0.3, 0.32, 0.32);
        } else {
          base = bsC(0.92, 0.92, 0.9);
          if (wall && prm == 18) { float win = bsRect(f, vec2(0.12, h * 0.42), vec2(fsz.x - 0.12, h * 0.85), pw); base = mix(base, mix(bsC(0.2, 0.25, 0.32), bsC(0.32, 0.38, 0.46), smoothstep(h * 0.42, h * 0.85, fy)), win); float tt = win * bsText(f, vec2(fsz.x * 0.5, h * 0.7), 0.06, fsz.x * 0.6, 151.0, pw); base = mix(base, WG, tt); gBsGlow += tt * WG * 0.8; }
          if (wall) { float ls = bsAA(abs(fy - h + 0.1) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG; if (prm == 19) { float gr = step(h * 0.45, fy) * step(fy, h - 0.2); base = mix(base, bsLeaves(f, pw), gr); } }
          if (top) base = prm == 19 ? bsC(0.4, 0.52, 0.32) : bsC(0.9, 0.9, 0.9);
        }
      } else if (prm == 10) {
        // the goods wagon: V.R. timber planking, iron strapping (1880s); TODAY the heritage siding's last wagon, painted
        float pl = fract(fy / 0.2);
        base = (E == 0 ? bsC(0.42, 0.28, 0.2) : bsC(0.46, 0.18, 0.14)) * (1.0 - 0.3 * bsAA((0.5 - abs(pl - 0.5)) * 0.2 - 0.008, pw)) * (0.9 + 0.15 * vnoise(f * vec2(1.0, 8.0)));
        if (wall) {
          float strap = max(bsAA(abs(fract(f.x / 1.1) - 0.5) * 1.1 - 0.05, pw), bsAA(min(f.x, fsz.x - f.x) - 0.08, pw));
          base = mix(base, bsC(0.14, 0.14, 0.14), strap);
          base = mix(base, bsC(0.86, 0.82, 0.7), bsText(f, vec2(fsz.x * 0.5, h * 0.62), 0.24, min(1.4, fsz.x * 0.4), 61.0 + float(E), pw) * (1.0 - strap));
          base = mix(base, bsC(0.12, 0.12, 0.12), bsAA(fy - 0.35, pw));
        }
      } else if (prm == 11) {
        // the 1880s produce stacks: crates of apples, cabbages, oranges and potatoes under a tarpaulin edge
        vec2 cl = floor(vec2(f.x / 0.55, fy / 0.42)), lc = vec2(fract(f.x / 0.55), fract(fy / 0.42));
        float hs = bsH(cl + 9.0);
        vec3 wood = bsC(0.56, 0.42, 0.28) * (0.85 + 0.25 * hs);
        float edge = 1.0 - bsAA(-min(min(lc.x, 1.0 - lc.x), min(lc.y, 1.0 - lc.y)) * 0.42 + 0.035, pw);
        vec3 prod = hs < 0.25 ? bsC(0.6, 0.14, 0.1) : (hs < 0.5 ? bsC(0.4, 0.52, 0.22) : (hs < 0.75 ? bsC(0.78, 0.48, 0.12) : bsC(0.5, 0.4, 0.28)));
        float fruit = step(0.38, lc.y) * step(lc.y, 0.62) * (0.7 + 0.3 * step(0.5, vnoise(f * 26.0)));
        base = mix(wood, prod * (0.8 + 0.3 * vnoise(f * 30.0)), fruit * (1.0 - edge));
        base = mix(base, wood * 0.6, edge);
        if (top) base = mix(bsC(0.42, 0.4, 0.3), bsC(0.32, 0.3, 0.24), step(0.5, vnoise(P.xz * 3.0)));
      } else if (prm == 12) {
        // the grip car (the museum's exhibit TODAY; in the 1880s at work): cream and maroon timber, open sides
        base = mix(bsC(0.84, 0.76, 0.58), bsC(0.42, 0.16, 0.13), step(fy, h * 0.42)) * (0.9 + 0.1 * vnoise(f * 5.0));
        if (wall) {
          float post = bsAA(abs(fract(f.x / 1.1) - 0.5) * 1.1 - 0.06, pw) * step(h * 0.45, fy) * step(fy, h - 0.25);
          float open = (1.0 - post) * step(h * 0.48, fy) * step(fy, h - 0.3);
          base = mix(base, bsC(0.12, 0.1, 0.09), open * 0.85);
          base = mix(base, bsC(0.3, 0.2, 0.14), bsAA(abs(fy - h + 0.12) - 0.12, pw));
          base = mix(base, bsC(0.76, 0.6, 0.3), bsText(f, vec2(fsz.x * 0.5, h * 0.25), 0.16, fsz.x * 0.5, 71.0, pw) * step(fy, h * 0.42));
        }
      } else if (prm == 14) {
        // the tram island: a bluestone kerb with a white edge line TODAY and light in the 3000s
        base = bsC(0.38, 0.41, 0.45) * (0.9 + 0.15 * vnoise(f * 3.0));
        if (top && E > 0) { float e2 = min(min(f.x, fsz.x - f.x), min(f.y, fsz.y - f.y)); float ln = bsAA(abs(e2 - 0.15) - 0.05, pw); base = mix(base, E == 1 ? bsC(0.9, 0.82, 0.3) : WG, ln); if (E == 2) gBsGlow += ln * WG; }
      } else if (prm == 15) {
        // the balcony's iron posts: fluted, painted
        base = (E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.16, 0.22, 0.2)) * (0.85 + 0.25 * step(0.5, fract(f.x / 0.06)));
      } else if (prm == 16) {
        // the GPO's piers: sandstone with a moulded cap
        base *= 1.0 - 0.2 * bsAA((0.5 - abs(fract(fy / 0.4) - 0.5)) * 0.4 - 0.01, pw);
        base = mix(base, base * 1.2, bsAA(abs(fy - h + 0.1) - 0.1, pw));
      } else if (prm == 17) {
        // the chimney: soot at the crown in the 1880s, a painted café band TODAY, a light ring in the 3000s
        float soot = smoothstep(h - 4.0, h, fy) * (E == 0 ? 0.65 : 0.25);
        base = mix(base, bsC(0.08, 0.07, 0.07), soot);
        if (E == 1) { float b = bsRect(f, vec2(0.0, h - 5.0), vec2(fsz.x, h - 3.8), pw); base = mix(base, bsC(0.86, 0.82, 0.7), b); base = mix(base, bsC(0.3, 0.16, 0.14), b * bsText(f, vec2(fsz.x * 0.5, h - 4.4), 0.6, fsz.x * 0.8, 81.0, pw)); }
        if (E == 2) { float r = bsAA(abs(fy - h + 0.6) - 0.08, pw) + bsAA(abs(fy - h + 3.0) - 0.04, pw); base = mix(base, WG, clamp(r, 0.0, 1.0)); gBsGlow += clamp(r, 0.0, 1.0) * WG * 1.4; }
      }
      // every small structure's foot: a bluestone base course
      if (wall && prm != 15 && prm != 17 && prm != 14) base = mix(base, bsC(0.34, 0.37, 0.41), bsAA(fy - 0.12, pw) * 0.85);
    }
    // ============================================================== TER (raised floors' faces and tops)
    else if (st == 4) {
      if (wall) {
        float y = P.y;
        float topY = vWPos.y - fu.y + fsz.y;   // the face's top
        // a bluestone retaining wall in courses with a moulded coping; the concourse's plinth is sandstone
        vec3 bs = prm == 5 || prm == 2 ? base : bsC(0.36, 0.39, 0.43) * (0.9 + 0.14 * h21(floor(vec2(fu.x / 0.7 + 0.5 * floor(fu.y / 0.33), fu.y / 0.33))));
        float jt = max(bsAA(abs(fract(fu.x / 0.7 + 0.5 * floor(fu.y / 0.33)) - 0.5) * 0.7 - 0.006, pw), bsAA((0.5 - abs(fract(fu.y / 0.33) - 0.5)) * 0.33 - 0.007, pw));
        base = mix(bs, bs * 0.62, jt);
        float cope = bsAA(abs(y - topY + 0.09) - 0.09, pw);
        base = mix(base, bs * 1.28, cope);
        base *= 1.0 - 0.3 * bsAA(abs(y - topY + 0.2) - 0.02, pw);
        if (prm == 4) {
          // the spawn deck's face: CABLE TRAMWAY ENGINE HOUSE (the props' raised letters) over a band
          base = mix(base, E == 0 ? bsC(0.24, 0.27, 0.3) : (E == 1 ? bsC(0.3, 0.2, 0.18) : bsC(0.94, 0.94, 0.92)), bsAA(abs(y - topY + 0.75) - 0.32, pw) * 0.8);
        }
        if (E == 2) { float ls = bsAA(abs(y - topY + 0.2) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.9; }
      } else if (top) {
        gBsTop = 1.0;
        if (prm == 0) {
          // the forecourt terrace: the turntable ring (mural 10: the rails, the pit's edge) at (−21.5, −56)
          vec2 c = P.xz - vec2(-21.5, -56.0); float r = length(c);
          float ring = bsAA(abs(r - 3.6) - 0.06, pw) + bsAA(abs(r - 3.1) - 0.05, pw);
          float pit = bsAA(abs(r - 4.0) - 0.12, pw);
          base = mix(base, bsC(0.55, 0.55, 0.56), clamp(ring, 0.0, 1.0));
          base = mix(base, bsC(0.3, 0.32, 0.34), pit);
          float spoke = bsAA(abs(fract(atan(c.y, c.x) / 6.2832 * 12.0) - 0.5) * r * 0.52 - 0.05, pw) * step(r, 3.05) * step(0.6, r);
          base = mix(base, bsC(0.44, 0.38, 0.3), spoke * 0.7);
          if (E == 2) { float ls = bsAA(abs(r - 3.6) - 0.03, pw); base = mix(base, WG, ls); gBsGlow += ls * WG; }
          // the tram tracks into the depot: from the turntable to the tram shed's doors
          float tr = bsAA(abs(abs(P.x + 9.0) - 0.72) - 0.04, pw) * step(-60.0, P.z) * step(P.z, -50.5) * step(P.x, -6.0);
          base = mix(base, E == 2 ? WG : bsC(0.55, 0.55, 0.56), tr);
        } else if (prm == 5) {
          // the concourse: the inlaid dial (mural 5) round Tartar, the station's name round its rim (the props' letters)
          float r = length(P.xz);
          float rim = bsAA(abs(r - 5.6) - 0.07, pw) + bsAA(abs(r - 4.6) - 0.04, pw);
          float ang = atan(P.z, P.x);
          float tick = bsAA(abs(fract(ang / 6.2832 * 60.0 + 0.5) - 0.5) * r * 0.105 - 0.02, pw) * step(4.7, r) * step(r, 5.1);
          float hour = bsAA(abs(fract(ang / 6.2832 * 12.0 + 0.5) - 0.5) * r * 0.5236 - 0.06, pw) * step(4.7, r) * step(r, 5.5);
          vec3 brass = bsC(0.62, 0.48, 0.24);
          base = mix(base, brass, clamp(rim + tick + hour, 0.0, 1.0));
          base = mix(base, bsC(0.34, 0.37, 0.41), bsAA(abs(r - 5.1) - 0.36, pw) * 0.35 * (1.0 - clamp(tick + hour, 0.0, 1.0)));
          if (rim + hour > 0.5) gBaseRough = 0.3;
          if (E == 2) gBsGlow += clamp(rim, 0.0, 1.0) * WG * 0.6;
        }
      }
    }
    // ============================================================== GROUND (the streets)
    else if (st == 5 && top) {
      gBsTop = 1.0;
      vec2 q = P.xz;
      if (prm == 1) {
        // Swimston's carriageway (x −24.5 … −16): the tram tracks on both lines (x −22.9 and −19.5) and the kerbs
        float kerb = bsAA(min(q.x + 24.5, -16.0 - q.x) - 0.32, pw);
        for (int k = 0; k < 2; k++) {
          float cx = k == 0 ? -22.9 : -19.25;
          float d = q.x - cx;
          if (E == 0) {
            // the cable tramway: two rails and the slot between them (the grip's cable runs underneath)
            float rail = bsAA(abs(abs(d) - 0.72) - 0.035, pw), slot = bsAA(abs(d) - 0.016, pw), slotEdge = bsAA(abs(abs(d) - 0.04) - 0.012, pw);
            base = mix(base, bsC(0.58, 0.58, 0.6), max(rail, slotEdge));
            base = mix(base, bsC(0.04, 0.04, 0.04), slot);
            if (max(rail, slotEdge) > 0.5) gBaseRough = 0.3;
          } else if (E == 1) {
            // grooved tram rails in the asphalt, a yellow box line round the stop on the west track
            float rail = bsAA(abs(abs(d) - 0.72) - 0.035, pw), groove = bsAA(abs(abs(d) - 0.7) - 0.012, pw);
            base = mix(base, bsC(0.6, 0.6, 0.62), rail); base = mix(base, bsC(0.05, 0.05, 0.05), groove);
            if (rail > 0.5) gBaseRough = 0.25;
          } else {
            // the light-rail guideway: a pale strip with a white-gold centre line
            float strip = bsAA(abs(d) - 0.55, pw), line = bsAA(abs(d) - 0.03, pw);
            base = mix(base, bsC(0.86, 0.87, 0.88), strip * 0.85);
            base = mix(base, WG, line); gBsGlow += line * WG * 0.8;
          }
        }
        if (E == 1) {
          // the lane line between the tracks (broken white) and the kerb's yellow no-standing line
          float dl = bsAA(abs(q.x + 21.1) - 0.05, pw) * step(0.5, fract(q.y / 3.0));
          base = mix(base, bsC(0.88, 0.88, 0.86), dl);
          base = mix(base, bsC(0.86, 0.72, 0.2), bsAA(abs(min(q.x + 24.5, -16.0 - q.x) - 0.45) - 0.05, pw));
        }
        if (E == 2) { float gl = bsAA(abs(min(q.x + 24.5, -16.0 - q.x) - 0.4) - 0.02, pw); base = mix(base, WG, gl); gBsGlow += gl * WG * 0.7; }
        // the kerbstones and the gutter: long bluestone kerbs (every era)
        vec3 kc = bsC(0.33, 0.36, 0.4) * (0.9 + 0.15 * h21(vec2(floor(q.y / 0.9), sign(q.x + 20.0))));
        base = mix(base, kc * (1.0 - 0.35 * bsAA((0.5 - abs(fract(q.y / 0.9) - 0.5)) * 0.9 - 0.01, pw)), kerb);
        base = mix(base, kc * 0.7, bsAA(abs(min(q.x + 24.5, -16.0 - q.x) - 0.36) - 0.04, pw));
      } else if (prm == 0 || prm == 2 || prm == 4) {
        // laneways and the circus: the bluestone pitchers, a dish drain down Hoki Lane and Degrayling Lane, and the
        // footpath kerbs where the street meets the carriageway (drawn on the carriageway), the 3000s' light lines
        float drainH = bsAA(abs(q.x + 33.75) - 0.32, pw) * step(-50.0, q.y) * step(q.y, -26.0);
        float drainD = bsAA(abs(q.y + 25.75) - 0.3, pw) * step(-14.5, q.x) * step(q.x, -6.2);
        float drain = max(drainH, drainD);
        base = mix(base, base * 0.72 + bsC(0.02, 0.03, 0.03), drain);
        if (drain > 0.5) gBaseRough = mix(gBaseRough, 0.35, 0.6);
        if (E == 2) {
          // the 3000s: thin light lines inlaid along the routes (Swimston's footpaths, the ring)
          float rr = length(q);
          float ring = bsAA(abs(rr - 19.4) - 0.02, pw) * float(prm == 2);
          float fp = bsAA(abs(q.x + 25.3) - 0.02, pw) * step(-50.0, q.y) * step(q.y, -24.0) + bsAA(abs(q.x + 15.2) - 0.02, pw) * step(-29.0, q.y) * step(q.y, -24.0);
          base = mix(base, WG, clamp(ring + fp, 0.0, 1.0)); gBsGlow += clamp(ring + fp, 0.0, 1.0) * WG * 0.8;
        }
        if (E == 1 && prm == 2) {
          // TODAY: a zebra crossing from the knee to the circus ring and one to the hotel's balcony stair
          float zb = step(0.5, fract(q.x / 0.6)) * step(-19.8, q.y) * step(q.y, -17.0) * step(-24.0, q.x) * step(q.x, -18.0);
          base = mix(base, bsC(0.88, 0.88, 0.86), zb * 0.85);
        }
      } else if (prm == 3) {
        // the Royal Arcade's floor: boards and builders' dust (1880s), the mosaic (TODAY), the mosaic lit from within (3000s)
        vec2 a = q - vec2(-28.5, -35.0);
        if (E == 0) {
          float bd = fract(a.x / 0.22);
          base = bsC(0.48, 0.38, 0.28) * (0.85 + 0.25 * h21(vec2(floor(a.x / 0.22), floor(a.y / 2.4)))) * (1.0 - 0.35 * bsAA((0.5 - abs(bd - 0.5)) * 0.22 - 0.006, pw));
          base = mix(base, bsC(0.66, 0.62, 0.56), smoothstep(0.55, 0.75, fbm(q * 0.8)) * 0.6);
        } else {
          // black and white diamonds within a border, a star at the centre
          vec2 r = mat2(0.7071, 0.7071, -0.7071, 0.7071) * a;
          float chk = mod(floor(r.x / 0.42) + floor(r.y / 0.42), 2.0);
          vec3 m = mix(bsC(0.86, 0.84, 0.78), bsC(0.16, 0.16, 0.17), chk);
          float border = step(1.45, abs(a.x));
          m = mix(m, bsC(0.52, 0.22, 0.18), border * step(abs(a.x), 1.75));
          float star = bsAA(abs(length(fract(a / 3.5 + 0.5) * 3.5 - 1.75) - 0.9) - 0.06, pw);
          m = mix(m, bsC(0.62, 0.5, 0.28), star);
          base = m * (0.9 + 0.1 * vnoise(q * 40.0));
          gBaseRough = 0.35;
          if (E == 2) { gBsGlow += star * WG * 0.7 + border * step(abs(a.x), 1.5) * WG * 0.0; base = mix(base, base * 1.08, 0.5); }
        }
      }
    }
    // ============================================================== STATION
    else if (st == 6) {
      if (prm == 0 && wall) {
        // the columns' sandstone pedestals: a base moulding, a die, a cap
        float y = P.y;
        base = mix(base, base * 1.22, bsAA(abs(y - 3.2) - 0.1, pw) + bsAA(abs(y - 1.42) - 0.12, pw));
        float pan = bsRect(vec2(fu.x, y), vec2(0.14, 1.75), vec2(fsz.x - 0.14, 2.95), pw) - bsRect(vec2(fu.x, y), vec2(0.18, 1.79), vec2(fsz.x - 0.18, 2.91), pw);
        base *= 1.0 - 0.3 * clamp(pan, 0.0, 1.0);
        base *= 1.0 - 0.3 * bsAA(abs(y - 3.05) - 0.02, pw);
        if (E == 2) { float ls = bsAA(abs(y - 2.2) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG; }
      } else if (prm == 1) {
        // the iron shafts: fluted, painted green (1880s), cream and gold TODAY, white with light flutes (3000s)
        float fl = 0.5 + 0.5 * cos(fu.x / max(fsz.x, 0.1) * 6.2832 * 3.0);
        vec3 c0 = E == 0 ? bsC(0.17, 0.26, 0.22) : (E == 1 ? bsC(0.78, 0.72, 0.58) : bsC(0.9, 0.9, 0.88));
        base = c0 * (0.82 + 0.25 * fl);
        gBaseRough = 0.35;
        if (E == 1) base = mix(base, bsC(0.72, 0.56, 0.26), bsAA(abs(P.y - 7.6) - 0.1, pw) + bsAA(abs(P.y - 3.5) - 0.05, pw));
        if (E == 2) { float ls = bsAA(fl - 0.12, 0.05) * 0.8; base = mix(base, WG, ls); gBsGlow += ls * WG * 0.6; }
        if (E == 2) { float green = step(3.8, P.y) * step(P.y, 6.4) * step(0.5, fract(fu.x / max(fsz.x, 0.1) * 2.0 + 0.25)); base = mix(base, bsLeaves(vec2(fu.x * 1.6, P.y), pw), green); }
        if (false) { float green = 0.0; base = mix(base, bsC(0.3, 0.44, 0.24) * (0.75 + 0.5 * vnoise(vec2(fu.x, P.y) * 20.0)), green); }
      } else if (prm == 2) {
        // the clock beam: riveted iron with a destination band
        base = (E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.16, 0.2, 0.18)) * (0.9 + 0.1 * vnoise(fu * 6.0));
        if (wall) base = mix(base, E == 2 ? WG : bsC(0.6, 0.5, 0.3), bsAA(abs(fract(fu.x / 0.3) - 0.5) * 0.3 - 0.02, pw) * bsAA(abs(fu.y - fsz.y * 0.5) - 0.04, pw));
      } else if (prm == 3 && wall) {
        // the drum: ochre-and-cream render (1880s), weathered cream (TODAY), white under the lattice of light (3000s);
        // a band the station's name sits on (the props' letters), pilasters at the octagon's corners
        float y = P.y;
        vec3 c0 = E == 0 ? bsC(0.78, 0.66, 0.48) : (E == 1 ? bsC(0.86, 0.82, 0.72) : bsC(0.94, 0.94, 0.93));
        base = c0 * (0.9 + 0.12 * fbm(vec2(fu.x, y) * 2.0));
        float band = bsAA(abs(y - 9.0) - 0.42, pw);
        base = mix(base, E == 0 ? bsC(0.2, 0.3, 0.26) : (E == 1 ? bsC(0.24, 0.34, 0.32) : bsC(0.97, 0.97, 0.96)), band);
        base = mix(base, c0 * 1.2, bsAA(min(fu.x, fsz.x - fu.x) - 0.3, pw));
        if (E == 2) { float ls = bsAA(abs(y - 8.5) - 0.02, pw) + bsAA(abs(y - 9.5) - 0.02, pw); base = mix(base, WG, clamp(ls, 0.0, 1.0)); gBsGlow += clamp(ls, 0.0, 1.0) * WG; }
      }
    }
    // ============================================================== STAIR (flanks and nosings)
    else if (st == 7) {
      if (wall) {
        if (prm == 0) {
          // a stone flight's string: ashlar with a moulded string course along the rake (drawn level here: the face's top)
          base *= 1.0 - 0.25 * bsAA((0.5 - abs(fract(fu.y / 0.33) - 0.5)) * 0.33 - 0.007, pw);
          base = mix(base, base * 1.2, bsAA(abs(fu.y - fsz.y + 0.1) - 0.1, pw));
        } else if (prm == 1) {
          // the iron flights: a stringer with cast-iron lace panels
          vec3 ic = E == 2 ? bsC(0.9, 0.9, 0.88) : bsC(0.16, 0.22, 0.2);
          vec2 c = fract(fu / 0.3) - 0.5;
          float lace = bsAA(abs(length(c) - 0.3) - 0.03, pw / 0.3) + bsAA(abs(abs(c.x) + abs(c.y) - 0.32) - 0.03, pw / 0.3);
          base = mix(ic * 0.8, ic * 1.4, clamp(lace, 0.0, 1.0));
          if (E == 2) gBsGlow += clamp(lace, 0.0, 1.0) * WG * 0.25;
        } else if (prm == 2) {
          // the 3000s' glass flights: a white stringer with a light seam
          base = bsC(0.92, 0.92, 0.9);
          float ls = bsAA(abs(fu.y - fsz.y + 0.06) - 0.02, pw);
          base = mix(base, WG, ls); gBsGlow += ls * WG;
        } else {
          // the Boathouse's timber stair
          base = bsC(0.48, 0.36, 0.26) * (0.9 + 0.15 * vnoise(fu * vec2(1.0, 10.0)));
        }
      } else if (top && (prm == 0 || prm == 1 || prm == 3)) {
        // the treads: the texture's yellow safety nosings are TODAY's — the 1880s stone and iron, the 3000s white and light
        if (E == 0) {
          vec3 m = base; float l = bsLum(m);
          base = prm == 1 ? bsC(0.2, 0.22, 0.21) * (0.85 + 0.3 * step(0.5, fract((fu.x + fu.y) * 6.0))) : vec3(l) * vec3(1.02, 0.98, 0.92);
        } else if (E == 2) {
          float l = bsLum(base); base = mix(vec3(l * 1.25), bsC(0.92, 0.92, 0.9), 0.55);
          float ns = bsAA(abs(fract(fu.y / 0.3) - 0.92) - 0.02, pw); base = mix(base, WG, ns * 0.7); gBsGlow += ns * WG * 0.4;
        }
      } else if (top && prm == 2) {
        // glass treads: pearl glass (not the treads' yellow), a white-gold nosing on each
        base = mix(bsC(0.86, 0.89, 0.92), bsC(0.95, 0.95, 0.94), fract(fu.y / 0.3)) * (0.95 + 0.05 * vnoise(fu * 4.0));
        gBaseRough = 0.2; gTexStr = 0.0;
        float ns = bsAA(abs(fract(fu.y / 0.3) - 0.92) - 0.03, pw);
        base = mix(base, WG, ns * 0.8); gBsGlow += ns * WG * 0.5;
      }
    }
    // ============================================================== DECK (plank decks)
    else if (st == 8) {
      if (top) {
        gBsTop = 1.0;
        float e2 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
        if (prm < 4) {
          // nail rows across the boards every 1.2 m and an edge board; the bridge's deck gets iron edge plates
          float nails = bsAA(abs(fract(fu.x / 1.2) - 0.5) * 1.2 - 0.02, pw) * step(0.5, fract(fu.y / 0.15 + 0.25));
          base *= 1.0 - 0.25 * nails;
          float eb = bsAA(e2 - 0.14, pw);
          base = mix(base, prm == 2 ? bsC(0.24, 0.27, 0.27) : base * 0.8, eb);
          if (E == 2 && (prm == 1 || prm == 2)) { float ls = bsAA(abs(e2 - 0.2) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG * 0.8; }
        } else if (prm == 5) {
          // the 3000s' glass decks: a white-gold edge line
          float ls = bsAA(abs(e2 - 0.12) - 0.02, pw);
          base = mix(base, WG, ls); gBsGlow += ls * WG * 0.8;
        }
      } else if (wall) {
        // deck edges: a fascia board (timber; the 3000s white with a light seam)
        base = E == 2 ? bsC(0.92, 0.92, 0.9) : bsC(0.42, 0.32, 0.24) * (0.9 + 0.15 * vnoise(fu * vec2(1.0, 12.0)));
        if (E == 2) { float ls = bsAA(abs(fu.y - fsz.y * 0.5) - 0.015, pw); base = mix(base, WG, ls); gBsGlow += ls * WG; }
      } else if (N.y < -0.7) {
        // (fix round 1) the undersides seen from below: the 3000s' glass decks (the Halo over the circus and the balcony,
        // the stair landings) as pearl coffers between white ribs with white-gold light seams; the timber decks' joists
        vec2 cf = abs(fract(fu / 1.2) - 0.5) * 1.2;                            // from the coffer's centre, per axis (0 … 0.6)
        float dE = 0.6 - max(cf.x, cf.y);                                       // to the coffer's edge
        float rib = bsAA(dE - 0.07, pw), seam = bsAA(abs(dE - 0.1) - 0.012, pw);
        float e3 = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
        if (prm == 5 || (E == 2 && prm == 4)) {
          float well = 1.0 - smoothstep(0.08, 0.5, dE);                          // the coffer's recess, shaded toward its rim
          vec3 pearl = mix(bsC(0.93, 0.93, 0.92), bsC(0.72, 0.74, 0.8), well) * (0.96 + 0.04 * vnoise(fu * 3.0));
          base = mix(pearl, bsC(0.97, 0.96, 0.94), rib);
          base = mix(base, WG, seam * 0.8);
          float edge = bsAA(abs(e3 - 0.18) - 0.02, pw);
          base = mix(base, WG, edge);
          gBsGlow += (seam * 0.9 + edge) * WG;
          gBsLit += (1.0 - rib) * (1.0 - well) * bsC(0.95, 0.94, 0.98) * 0.35;  // a soft light in each coffer's centre
          gBaseRough = 0.3; gTexStr = 0.0;
        } else if (prm < 4) {
          float joist = bsAA(abs(fract(fu.x / 0.6) - 0.5) * 0.6 - 0.05, pw);
          base = bsC(0.34, 0.26, 0.2) * (0.85 + 0.2 * vnoise(fu * vec2(0.6, 8.0)));
          base = mix(base, base * 0.62, joist);
          gTexStr = 0.0;
        }
      }
    }
    // (fix round 1) the 1880s' paper on shared walls (the arcade's hoardings, the bills on the viaduct, the lane and the
    // poster column) turns to old film with the pieces about to vanish in jump 1's warning: it too is about to be rewritten
    if (gBsOld > 0.0 && uEraW.z > 0.0 && uEraW.x < 1.5 && uEraW.y > 1.5 && E == 0)
      base = mix(base, mix(base, vec3(bsLum(base)) * eraFilm(), clamp(uEraW.z, 0.0, 1.0)) * eraFlick(uEraW.z), gBsOld);
  }
`;

// ------------------------------------------------------------------------------------------------ GLSL: the murals
// (fix round 1) Hoki Lane's street art (mural 7) in the 3000s: DESIGN §5.1's "murals turned to slow-moving light" — the
// paint gone pale, a ghost under the light, and the outlines of its shapes (edges of the mural's alpha and luminance,
// read from the atlas round the texel) drawn in white-gold light that runs slowly along them
const FMURAL = /* glsl */`
    if (mi == 7 && eraBitHere() > 3.5) {
      // the 3000s' version of the street art, drawn 480 px under it in the atlas (stages/bluestone/murals.js hokiLight):
      // outlines of white-gold light over a pale ghost of the shapes; the light runs slowly along the lines
      vec2 muv3 = vec2(muv.x, muv.y - 480.0 / 2048.0);
      vec4 m3 = texture2D(uMural, muv3);
      float line = smoothstep(0.45, 0.9, m3.a);
      float flow = 0.35 + 0.65 * smoothstep(0.25, 1.0, sin((mx * 9.0 - my * 2.0) * 6.2832 - uEraT * 0.5) * 0.5 + 0.5);
      float mk = eraHasF(uMurEra[mi], eraBitHere());   // (the mural's era mask still governs: eras.murals 7 = '23')
      mc = vec4(m3.rgb, m3.a * mk);
      gBsGlow += line * flow * m3.rgb * 1.6 * mk;
    }`;

// ------------------------------------------------------------------------------------------------ GLSL: the light
const FEMIT = /* glsl */`
  // ---- Bluestone Junction: windows and seams lit at dusk (faint by day), lamp pools on the floors (levelart.js)
  {
    float lk = 0.1 + 0.42 * uBsNight;
    totalEmissiveRadiance += (gBsLit * lk + gBsGlow * (0.22 + 0.9 * uBsNight) + gBsRoom * (0.42 + 0.5 * uBsNight)) * (1.0 - 0.8 * gInk);
    if (uBsNight > 0.01 && vWNorm.y > 0.7) {
      vec2 q = vWPos.z > 0.0 ? -vWPos.xz : vWPos.xz;
      float pool = 0.0;
      for (int i = 0; i < 8; i++) {
        if (i >= uBsLampN) break;
        vec4 L = uBsLamp[i];
        float d = length(q - L.xy) / L.z;
        pool += L.w * (1.0 - smoothstep(0.0, 1.0, d)) * (1.0 - smoothstep(0.0, 1.0, d));
      }
      vec3 lc = uBsLampC[0] * eraOneHot.x + uBsLampC[1] * eraOneHot.y + uBsLampC[2] * eraOneHot.z;
      totalEmissiveRadiance += diffuseColor.rgb * lc * min(pool, 0.9) * uBsNight * 1.3;
    }
  }
`;
