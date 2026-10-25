// Highmark Foundry — stage surface materials (texlib layers `caldera:<name>`) on this stage's reserved PATTERN slots 70–72
// (stages/surfaces.js STAGE_SLOTS). See src/world/stages/cargo/surfaces.js for the contract.
//
// DESIGN.md §5.3:
//   caldera_tuff (70): pale warm-grey tuff flags (#a8a49e, dark joints): quays, terrace, yard, island top. Ink pops on it.
//   caldera_basalt (71): raw and dressed basalt in two looks from one slot (rough columnar rock for the rims, the cliff
//     and the island's sides; dressed ashlar with pale lime joints for the works' walls), #5f636b, with rust and red
//     scoria tints on the rims: every wall and all the natural ground.
//   caldera_glaze (72): glassy, ropy lava rock with flow lines (#6e6862 base): every ledge (the Slump shelves, the
//     Spillways, the Casting Floors), so a ledge reads as a lava bed even dry. It lives below the high mark, so the
//     shader's glaze darkens it to about #4d4945 and makes it glossy (engine rule 38: sRGB luminance ≥ 0.35).
import { PATTERN } from '../../mapkit.js';

export const SURF = { tuff: 70, basalt: 71, glaze: 72 };

const GRID = 1, HEX = 2;

const tuff = {
  detail: 0.5, scale: 2.4, tint: true, mask: true, alpha: false, mode: HEX, sym: 7, hr: [-0.005, 0.002], ao: 0.35,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.52, 7001u); f[1] = FB(uv, ivec2(10), 3, 0.5, 7003u); f[2] = FB(uv, ivec2(64), 2, 0.5, 7007u);
  f[3] = FB(uv, ivec2(24), 2, 0.55, 7009u); w[0] = WO(uv, ivec2(2), 0.78, 7011u); w[1] = WO(uv, ivec2(72), 0.9, 7013u);`,
  surf: /* glsl */`
  // volcanic tuff flags: irregular polygonal slabs (~1.2 m), dark ash-mortar joints, pitted vesicular texture
  vec4 sl = c[0];
  float sEdge = (sl.y - sl.x) * 1.2;
  float jw = 0.016 + 0.006 * n[1];
  float joint = 1.0 - aa(jw, sEdge);
  float jsoft = 1.0 - smoothstep(jw, jw + 0.1, sEdge);
  float dome = smoothstep(0.0, 0.45, sEdge);
  float tone = 0.94 + 0.11 * fract(sl.z * 7.13);
  // fine volcanic vesicles (air holes in tuff)
  vec4 pc = c[1];
  float pit = (1.0 - smoothstep(0.06, 0.18, pc.x)) * step(0.68, fract(pc.z * 13.7));
  float body = tone * (0.95 + 0.06 * n[0] + 0.04 * n[1] + 0.03 * n[2]) * (1.0 - 0.05 * jsoft) * (0.98 + 0.03 * dome);
  body *= (1.0 - 0.18 * pit);
  vec3 own = vec3(0.0); float cov = 1.0;
  // dark mortar in joints
  vec3 mort = lin(vec3(0.18, 0.17, 0.16)) * (0.9 + 0.2 * n[2]);
  own = mix(own, mort, joint * 0.85); cov *= 1.0 - joint * 0.85;
  // dark specks inside vesicles
  vec3 pitCol = lin(vec3(0.14, 0.13, 0.13));
  own = mix(own, pitCol, pit * 0.5); cov *= 1.0 - pit * 0.5;
  s.alb = own; s.a = cov * body;
  s.h = -0.004 * joint - 0.0012 * jsoft + 0.001 * dome - 0.0015 * pit + 0.0003 * n[2];
  s.rough = mix(0.78 + 0.06 * n[1], 0.92, joint);
  s.metal = 0.0;
  s.cav = (1.0 - 0.32 * joint) * (1.0 - 0.25 * pit);`,
};

const basalt = {
  detail: 0.65, scale: 2.8, tint: true, mask: true, alpha: false, mode: HEX, sym: 7, hr: [-0.012, 0.005], ao: 0.45,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.55, 7101u); f[1] = FB(uv, ivec2(12), 3, 0.5, 7103u); f[2] = FB(uv, ivec2(48), 2, 0.5, 7107u);
  f[3] = FB(uv, ivec2(18), 3, 0.52, 7109u); w[0] = WO(uv, ivec2(4), 0.92, 7111u);`,
  surf: /* glsl */`
  // columnar basalt / raw ashlar: hexagonal columnar joints, rough rock grain, rust & scoria iron staining
  vec4 cl = c[0];
  float cEdge = (cl.y - cl.x) * 0.7;
  float jw = 0.014 + 0.008 * (n[1] * 0.5 + 0.5);
  float joint = 1.0 - aa(jw, cEdge);
  float jsoft = 1.0 - smoothstep(jw, jw + 0.12, cEdge);
  float colId = fract(cl.z * 9.17);
  float tone = 0.92 + 0.12 * colId;
  float body = tone * (0.94 + 0.08 * n[0] + 0.05 * n[1] + 0.04 * n[2]);
  // rust and red scoria iron oxide patches along cracks and edges
  float rustM = smoothstep(0.32, 0.72, n[3] + 0.25 * n[0]) * (0.5 + 0.5 * jsoft);
  vec3 rustCol = lin(vec3(0.48, 0.19, 0.13)) * (0.9 + 0.2 * n[2]);
  // dark joint fissure with pale silica efflorescence
  float silica = (1.0 - smoothstep(jw, jw + 0.03, cEdge)) * step(0.65, fract(cl.z * 17.3));
  vec3 silCol = lin(vec3(0.72, 0.70, 0.66));
  vec3 jCol = lin(vec3(0.12, 0.12, 0.13));
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, rustCol, rustM * 0.65); cov *= 1.0 - rustM * 0.65;
  own = mix(own, silCol, silica * 0.5); cov *= 1.0 - silica * 0.5;
  own = mix(own, jCol, joint * 0.9); cov *= 1.0 - joint * 0.9;
  s.alb = own; s.a = cov * body;
  s.h = -0.008 * joint - 0.002 * jsoft + 0.001 * (1.0 - cEdge) + 0.0006 * n[1];
  s.rough = 0.88 + 0.06 * n[2] - 0.1 * rustM + 0.05 * joint;
  s.metal = 0.02 * rustM;
  s.cav = (1.0 - 0.4 * joint) * (1.0 - 0.15 * jsoft);`,
};

const glaze = {
  detail: 0.6, scale: 2.2, tint: true, mask: true, alpha: false, mode: GRID, sym: 1, hr: [-0.008, 0.006], ao: 0.4,
  prep: `vec2 fuv = vec2(uv.x * 1.8 + 0.3 * sin(uv.y * 5.0), uv.y * 6.0);
  f[0] = FB(uv, ivec2(2, 6), 4, 0.52, 7201u); f[1] = FB(fuv, ivec2(3, 14), 3, 0.5, 7203u); f[2] = FB(uv, ivec2(48), 2, 0.5, 7207u);
  w[0] = WO(uv, ivec2(3), 0.85, 7211u);`,
  surf: /* glsl */`
  // pahoehoe ropy flow lines and glassy basaltic lava rock; sRGB luminance >= 0.35
  float flow = 0.5 + 0.5 * sin(uv.y * 14.0 + 3.5 * n[0] + 1.5 * n[1]);
  float lobe = smoothstep(0.2, 0.8, n[0]);
  float wrinkle = smoothstep(0.35, 0.75, flow) * (0.8 + 0.2 * n[1]);
  // glassy obsidian ridges vs vesicular crust hollows
  float tone = 0.92 + 0.1 * lobe + 0.08 * wrinkle + 0.03 * n[2];
  vec3 glassCol = lin(vec3(0.16, 0.14, 0.13)) * (0.95 + 0.15 * n[2]);
  vec3 seamCol = lin(vec3(0.09, 0.08, 0.08));
  float seam = (1.0 - smoothstep(0.01, 0.06, c[0].y - c[0].x)) * 0.7;
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, seamCol, seam); cov *= 1.0 - seam;
  own = mix(own, glassCol, wrinkle * 0.45); cov *= 1.0 - wrinkle * 0.45;
  s.alb = own; s.a = cov * tone;
  s.h = 0.004 * wrinkle + 0.002 * lobe - 0.005 * seam + 0.0004 * n[2];
  s.rough = mix(0.72, 0.36, wrinkle);   // ropy crests are glossy
  s.metal = 0.04 * wrinkle;
  s.cav = (1.0 - 0.25 * seam) * (1.0 - 0.12 * (1.0 - wrinkle));`,
};

export const SURFACES = [
  { slot: 70, name: 'tarmac_tuff', mat: tuff, onWall: 71 },
  { slot: 71, name: 'basalt', mat: basalt },
  { slot: 72, name: 'glaze', mat: glaze },
];
