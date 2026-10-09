// Gulper Aquarium — stage surface materials (texlib layers `aquarium:<name>`) on this stage's reserved PATTERN slots 67–69
// (stages/surfaces.js STAGE_SLOTS). Contract: see src/world/stages/cargo/surfaces.js (mat = a texlib material: prep
// declares up to 4 fbm + 2 worley requests, surf writes s.alb / s.a / s.h / s.rough / s.metal / s.cav, heights in m).
// All three are `mask` layers: s.a = the tinted part (the block colour picks the tone in layout.js), s.alb = the
// layer's own colours on top — warm neutrals everywhere a player inks, so team ink stays the loudest thing on screen
// (DESIGN.md §5.3 / §5.4).
//
//   terrazzo  the 1936 house floor: a warm cream matrix (#d6cfc0 from the block) set with marble chips — grey, ochre,
//             white, a few charcoal and sea-green ones and the odd brass fleck — ground flat and polished (a soft sheen
//             under the ink's own gloss). Isotropic (hex tiling): the stage's floors are rasterised into many tiles, so
//             nothing in it may depend on where a tile starts. (DESIGN.md's brass divider strips on a 2 m grid would jump
//             at every tile seam for that reason; the brass is in the chips, the lettering and the props instead.)
//   teak      the Feeding Deck, the promenades, the balconies and the spawn decks: 125 mm silver-brown boards running
//             along the face's u, dark caulked seams, staggered butt joints, a silvered weathering per board, nail pairs
//   render    smooth white render with a trowelled surface and the Streamline Moderne "speed lines": three glazed
//             sea-green faience bands (#9bb3a8) 0.62–0.96 m over a wall's foot (walls standing on the foundations at
//             y −2 show them at 0.6–1.0 m over the floor, then every 4 m up: 4.6 and 8.6 m on the gatehouse). Its tops are
//             drawn as concrete (no stripes across a roof)
import { PATTERN } from '../../mapkit.js';

// (slots 67–69 belong to this stage)
export const SURF = { terrazzo: 67, teak: 68, render: 69 };

const GRID = 1, HEX = 2;

const terrazzo = {
  detail: 0.45, scale: 2.0, tint: true, mask: true, alpha: false, mode: HEX, sym: 7, hr: [-0.002, 0.0006], ao: 0.25,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.5, 6701u); f[1] = FB(uv, ivec2(11), 3, 0.5, 6703u); f[2] = FB(uv, ivec2(60), 2, 0.5, 6707u);
  f[3] = FB(uv, ivec2(5), 3, 0.55, 6709u); w[0] = WO(uv, ivec2(120), 0.92, 6711u); w[1] = WO(uv, ivec2(48), 0.85, 6713u);`,
  surf: /* glsl */`
  // two sizes of chip (≈ 1.7 cm and ≈ 4 cm), each cell a chip or matrix by its id; chips ground flat (no relief), the
  // matrix a little lower and duller; per-chip colour from a marble set, a rare brass fleck (metallic)
  vec4 a = c[0], b = c[1];
  float eA = a.y - a.x, eB = b.y - b.x;
  float onA = step(0.5, fract(a.z * 7.31)) * smoothstep(0.05, 0.16, eA);
  float onB = step(0.84, fract(b.z * 5.17)) * smoothstep(0.04, 0.12, eB);
  float idA = fract(a.z * 13.7), idB = fract(b.z * 3.91);
  float id = onB > 0.0 ? idB : idA, chip = max(onA, onB);
  vec3 cc = id < 0.38 ? lin(vec3(0.62, 0.61, 0.58)) : id < 0.62 ? lin(vec3(0.79, 0.64, 0.42)) : id < 0.84 ? lin(vec3(0.93, 0.91, 0.87))
          : id < 0.92 ? lin(vec3(0.33, 0.33, 0.34)) : id < 0.985 ? lin(vec3(0.5, 0.63, 0.58)) : lin(vec3(0.72, 0.56, 0.3));
  float brass = step(0.985, id) * chip;
  cc *= 0.9 + 0.2 * fract(id * 31.7);
  float tone = 0.86 * (1.0 + 0.035 * n[0] + 0.02 * n[1] + 0.012 * n[2]) * (1.0 - 0.03 * smoothstep(0.3, 0.8, n[3]));
  s.alb = cc * chip;
  s.a = tone * (1.0 - chip);
  s.h = -0.0004 * (1.0 - chip) + 0.00008 * n[2];
  s.rough = mix(0.42 + 0.06 * n[1], mix(0.3, 0.28, brass), chip);
  s.metal = brass * 0.8;
  s.cav = 1.0 - 0.06 * (1.0 - chip) * smoothstep(0.0, 0.05, eA);`,
};

const teak = {
  detail: 0.4, scale: 2.0, tint: true, mask: true, alpha: false, mode: GRID, sym: 1, hr: [-0.008, 0.002], ao: 0.4,
  prep: `int row = int(floor(P.y / 0.125)); int rw = int(mod(float(row), 16.0));
  float rh = hf(ivec2(rw, 0), 6801u), rh2 = hf(ivec2(rw, 1), 6803u);
  uint sd = uint(rw) * 7919u + 6811u;
  float ly = P.y - float(row) * 0.125;
  f[0] = FNP(vec2(P.x * 1.6, ly * 26.0) + rh * 40.0, 4, sd); f[1] = FNP(vec2(P.x * 0.5, ly * 6.0) + rh2 * 30.0, 3, sd + 17u);
  f[2] = FB(uv, ivec2(5), 3, 0.55, 6819u); w[0] = WO(uv, ivec2(18), 0.8, 6823u);`,
  surf: /* glsl */`
  // 125 mm boards along u, 6 mm caulked seams (dark pitch, a little sunk), one butt joint per board per 2 m (staggered),
  // grain streaks, a few knots, per-board tone and silvering, nail pairs over the joists every 0.6 m
  const float PW = 0.125;
  int row = int(floor(P.y / PW));
  int rw = int(mod(float(row), 16.0));
  float ly = P.y - float(row) * PW;
  float off = 2.0 * hf(ivec2(rw, 3), 6831u);
  float xp = mod(P.x - off, 2.0);
  float eSide = min(ly, PW - ly), eEnd = min(xp, 2.0 - xp);
  vec2 ps = edgeProf(eSide, 0.003, 0.005, 0.0015, 0.006);
  vec2 pe = edgeProf(eEnd, 0.0015, 0.004, 0.001, 0.005);
  float seam = max(ps.y, pe.y);
  float h = min(ps.x, pe.x);
  float rh = hf(ivec2(rw, 0), 6801u), rh3 = hf(ivec2(rw, 2), 6805u);
  float streak = n[0], warp = n[1];
  float ring = 0.5 + 0.5 * cos((ly * 90.0 + warp * 3.0 + rh * 9.0) * 3.14159);
  float lines = smoothstep(0.72, 1.0, ring);
  vec4 kn = c[0];
  float knot = step(0.93, kn.z) * (1.0 - smoothstep(0.04, 0.12, kn.x));
  float nx = mod(P.x + 0.3, 0.6) - 0.3;
  float nail = (1.0 - smoothstep(0.003, 0.007, length(vec2(nx, abs(ly - PW * 0.5) - 0.032)))) * (1.0 - seam);
  float silver = smoothstep(-0.3, 0.6, streak) * 0.45 + 0.3 * rh3 + 0.15 * n[2];
  float tone = 0.82 * (0.86 + 0.24 * rh) * (1.0 - 0.09 * lines) * (1.0 + 0.1 * silver) * (1.0 - 0.3 * knot);
  vec3 pitch = lin(vec3(0.16, 0.14, 0.12));
  s.alb = pitch * seam * 0.9 + lin(vec3(0.2, 0.2, 0.21)) * nail;
  s.a = tone * (1.0 - seam * 0.9) * (1.0 - 0.8 * nail);
  s.h = mix(h + 0.0003 * lines - 0.0008 * knot + 0.0002 * streak, -0.004, seam);
  s.rough = mix(0.74 + 0.1 * silver - 0.05 * lines, 0.55, seam) - 0.3 * nail;
  s.metal = 0.6 * nail;
  s.cav = (1.0 - 0.35 * seam) * (1.0 - 0.25 * knot);`,
};

const render = {
  detail: 0.55, scale: 4.0, tint: true, mask: true, alpha: false, mode: GRID, sym: 1, hr: [-0.002, 0.0015], ao: 0.3,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.55, 6901u); f[1] = FB(uv, ivec2(13), 3, 0.5, 6903u); f[2] = FB(uv, ivec2(70), 2, 0.5, 6907u);
  f[3] = FB(uv, ivec2(20, 6), 3, 0.5, 6909u);`,
  surf: /* glsl */`
  // smooth trowelled render (soft mottling, faint trowel arcs, fine sand grain), and three glazed faience speed lines
  // (6 cm, 8 cm apart) at v 2.62 / 2.76 / 2.90 of every 4 m repeat: a raised, rounded, glossy tile band in its own
  // sea-green, a slightly darker grout line along each edge
  float v = P.y;
  float d1 = abs(v - 2.62), d2 = abs(v - 2.76), d3 = abs(v - 2.90);
  float dl = min(d1, min(d2, d3));
  float band = 1.0 - aa(0.03, dl);
  float rim = smoothstep(0.03, 0.022, dl) * (1.0 - smoothstep(0.022, 0.012, dl));
  float tile = jd(P.x, 0.3);
  float tj = (1.0 - aa(0.0015, tile)) * band;
  vec3 faience = lin(vec3(0.61, 0.70, 0.66)) * (0.95 + 0.06 * n[1]) * (1.0 - 0.25 * tj);
  float tone = 0.88 * (1.0 + 0.03 * n[0] + 0.018 * n[1] + 0.012 * n[2]) * (1.0 - 0.02 * smoothstep(0.2, 0.8, n[3]));
  s.alb = faience * band;
  s.a = tone * (1.0 - band);
  float dome = sqrt(clamp(1.0 - dl / 0.03, 0.0, 1.0));
  s.h = 0.0006 * n[1] + 0.00025 * n[2] + band * (0.0012 * dome) - 0.0008 * tj;
  s.rough = mix(0.82 - 0.05 * n[0], 0.22, band);
  s.cav = 1.0 - 0.2 * rim - 0.3 * tj;`,
};

export const SURFACES = [
  { slot: 67, name: 'terrazzo', onWall: 69, mat: terrazzo },
  { slot: 68, name: 'teak', onWall: 69, mat: teak },
  { slot: 69, name: 'render', onTop: PATTERN.concrete, mat: render },
];
