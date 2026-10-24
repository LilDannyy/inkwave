// Bluestone Junction — stage surface materials (texlib layers `bluestone:<name>`) on this stage's reserved PATTERN slots 64–66
// (stages/surfaces.js STAGE_SLOTS). Contract: see src/world/stages/cargo/surfaces.js and crossmarket/surfaces.js (mat = a
// texlib material: prep declares up to 4 fbm + 2 worley requests, surf writes s.alb / s.h / s.rough / s.cav, heights in m).
// All three take the block's colour (tint: true), so layout.js's colours pick the tone (DESIGN.md §5.3; team ink stays the
// loudest thing on screen: mid values, low chroma):
//   bluestone  the laneways, the circus, the kerbs and the terraces: dark blue-grey basalt PITCHERS (225 × 112 mm, laid in
//              courses across u in a stretcher bond), dark joints with grit, the odd vesicle (the basalt's gas holes),
//              crowns polished by a century of feet. THE CONSTANT: the same in every era, so ink always reads against the
//              same dark mid-grey. Its walls (the Customs House, the engine house, the viaduct) take `sandstone`'s ashlar
//              in the block's blue-grey: coursed bluestone blocks
//   granite    the carriageways in the 1880s: grey granite setts (0.28 × 0.16) in courses across u with sand joints (today
//              and the 3000s re-skin it: eras.remap → PATTERN.asphalt, PATTERN.pavers). The tram tracks are the level
//              art's (stages/bluestone/levelart.js), per era, world-aligned
//   sandstone  coursed ashlar (0.34 m courses, 0.68 m ± blocks, a drafted margin round a tooled face) on walls — the GPO,
//              the station's bases, every bluestone building in the block's blue-grey — and pale flags in running bond on
//              tops (the concourse, the GPO terrace and steps)
export const SURF = { bluestone: 64, granite: 65, sandstone: 66 };

const GRID = 1;

// one course of stones: a = along the course (m), b = across (m), CH = course height, SL = mean stone length, NS / NR =
// stones per course / courses per repeat (the jitter hash wraps on them), JIT = joint jitter, R = corner radius. Returns
// vec4(edge distance e (m, > 0 inside), local x / half-length, local y / half-height, stone id hash)
const COURSE = (fn, CH, SL, NS, NR, JIT, R) => /* glsl */`
  float rowf_${fn} = floor(b / ${CH});
  int rid_${fn} = wrp(ivec2(int(rowf_${fn}), 0), ivec2(${NR}, 1)).x;
  float ly_${fn} = b - rowf_${fn} * ${CH};
  float xs_${fn} = a - (float(rid_${fn} - (rid_${fn} / 2) * 2) * 0.5 + 0.25 * hf(ivec2(rid_${fn}, 3), 5u)) * ${SL};
  float kf_${fn} = floor(xs_${fn} / ${SL});
  float b0_${fn} = kf_${fn} * ${SL} + (hf(wrp(ivec2(int(kf_${fn}), rid_${fn}), ivec2(${NS}, ${NR})), 7u) - 0.5) * ${JIT};
  float b1_${fn} = (kf_${fn} + 1.0) * ${SL} + (hf(wrp(ivec2(int(kf_${fn}) + 1, rid_${fn}), ivec2(${NS}, ${NR})), 7u) - 0.5) * ${JIT};
  if (xs_${fn} < b0_${fn}) { b1_${fn} = b0_${fn}; kf_${fn} -= 1.0; b0_${fn} = kf_${fn} * ${SL} + (hf(wrp(ivec2(int(kf_${fn}), rid_${fn}), ivec2(${NS}, ${NR})), 7u) - 0.5) * ${JIT}; }
  else if (xs_${fn} > b1_${fn}) { b0_${fn} = b1_${fn}; kf_${fn} += 1.0; b1_${fn} = (kf_${fn} + 1.0) * ${SL} + (hf(wrp(ivec2(int(kf_${fn}) + 1, rid_${fn}), ivec2(${NS}, ${NR})), 7u) - 0.5) * ${JIT}; }
  ivec2 sid_${fn} = wrp(ivec2(int(kf_${fn}), rid_${fn}), ivec2(${NS}, ${NR}));
  vec2 hb_${fn} = vec2((b1_${fn} - b0_${fn}) * 0.5, ${CH} * 0.5);
  vec2 lp_${fn} = vec2(xs_${fn} - (b0_${fn} + b1_${fn}) * 0.5, ly_${fn} - ${CH} * 0.5);
  float e_${fn} = -sdRB(lp_${fn}, hb_${fn}, ${R});
  vec4 ${fn} = vec4(e_${fn}, lp_${fn} / hb_${fn}, hf(sid_${fn}, 11u));
`;

const bluestone = {
  detail: 0.55, scale: 1.8, tint: true, alpha: false, mode: GRID, sym: 3, hr: [-0.018, 0.005], ao: 0.62,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.5, 6401u); f[1] = FB(uv, ivec2(12), 3, 0.5, 6403u); f[2] = FB(uv, ivec2(96), 2, 0.5, 6409u);
  f[3] = FB(uv, ivec2(40), 2, 0.5, 6413u); w[0] = WO(uv, ivec2(160), 1.0, 6411u); w[1] = WO(uv, ivec2(72), 0.85, 6417u);`,
  surf: /* glsl */`
  // basalt pitchers: 0.1125 m courses along u, stones 0.225 m ± 3 cm in a stretcher bond, 9 mm gritty joints, crowns
  // domed and polished by wear, a fine-grained dark stone with tone per pitcher (blue-grey, a warmer grey, a near-black),
  // vesicles (small gas holes) on some, a few pale lichen spots in the joints
  const float GS = 1.8 / 160.0, GV = 1.8 / 72.0;
  float a = P.x, b = P.y;
  ${COURSE('q', '0.1125', '0.225', 8, 16, '0.06', '0.014')}
  float t1 = q.w, t2 = fract(q.w * 7.31), t3 = fract(q.w * 13.7);
  vec3 hue = t2 < 0.4 ? vec3(0.97, 0.99, 1.04) : (t2 < 0.75 ? vec3(1.03, 1.0, 0.97) : vec3(0.9));
  float dome = clamp((1.0 - q.y * q.y) * (1.0 - q.z * q.z), 0.0, 1.0);
  float wear = smoothstep(0.1, 0.8, n[0] * 0.5 + 0.5 + 0.3 * (t3 - 0.5)) * dome;
  vec4 g = c[1];
  float ves = step(0.72, fract(t1 * 5.7)) * step(0.83, g.z) * (1.0 - aa(0.0035 + 0.002 * fract(g.z * 3.1), g.x * GV));
  float tone = 0.78 * (1.0 + 0.2 * (t1 - 0.5)) * (1.0 + 0.05 * n[1] + 0.03 * n[2]);
  vec3 stone = vec3(tone) * hue * (1.0 + 0.09 * wear) * (1.0 - 0.45 * ves);
  stone *= 1.0 - 0.12 * clamp(1.0 - (q.x - 0.004) / 0.016, 0.0, 1.0);
  float lich = smoothstep(0.55, 0.9, n[3] * 0.5 + 0.5) * 0.6;
  vec3 joint = mix(vec3(0.42, 0.42, 0.42), vec3(0.62, 0.62, 0.55), lich) * (1.0 + 0.2 * n[2]);
  vec2 pr = edgeProf(q.x, 0.0045, 0.022, 0.007, 0.013);
  float inJ = pr.y;
  s.alb = mix(stone, joint, inJ);
  s.h = pr.x + 0.004 * dome * (1.0 - inJ) + 0.00015 * n[1] - 0.0012 * ves;
  s.rough = mix(0.72 - 0.3 * wear + 0.05 * n[2], 0.95, inJ);
  s.cav = mix(1.0, 0.45, inJ) * (1.0 - 0.35 * ves);`,
};

const granite = {
  detail: 0.55, scale: 2.24, tint: true, alpha: false, mode: GRID, sym: 3, hr: [-0.02, 0.006], ao: 0.6,
  prep: `f[0] = FB(uv, ivec2(3), 4, 0.5, 6501u); f[1] = FB(uv, ivec2(12), 3, 0.5, 6503u); f[2] = FB(uv, ivec2(96), 2, 0.5, 6509u);
  f[3] = FB(uv, ivec2(40), 2, 0.5, 6513u); w[0] = WO(uv, ivec2(150), 1.0, 6511u);`,
  surf: /* glsl */`
  // granite road setts: 0.16 m courses, setts 0.28 m ± 5 cm, 12 mm sand joints with dung-dark grit, domed crowns rubbed
  // pale by iron tyres, grey granite with mica flecks
  const float GS = 2.24 / 150.0;
  float a = P.x, b = P.y;
  ${COURSE('q', '0.16', '0.28', 8, 14, '0.1', '0.026')}
  float t1 = q.w, t2 = fract(q.w * 7.31), t3 = fract(q.w * 13.7);
  vec3 hue = t2 < 0.5 ? vec3(1.02, 1.0, 0.97) : vec3(0.97, 0.99, 1.02);
  float dome = clamp((1.0 - q.y * q.y) * (1.0 - q.z * q.z), 0.0, 1.0);
  float wear = smoothstep(0.15, 0.75, n[0] * 0.5 + 0.5 + 0.35 * (t3 - 0.5)) * dome;
  vec4 g = c[0];
  float fleck = step(0.84, g.z) * (1.0 - aa(0.0035 + 0.002 * fract(g.z * 5.3), g.x * GS));
  float tone = 0.8 * (1.0 + 0.24 * (t1 - 0.5)) * (1.0 + 0.05 * n[1] + 0.03 * n[2]);
  vec3 stone = vec3(tone) * hue * (1.0 - 0.28 * fleck) * (1.0 + 0.1 * wear);
  stone *= 1.0 - 0.1 * clamp(1.0 - (q.x - 0.006) / 0.02, 0.0, 1.0);
  vec3 joint = vec3(0.36, 0.33, 0.29) * (1.0 + 0.18 * n[2]);
  vec2 pr = edgeProf(q.x, 0.006, 0.03, 0.009, 0.016);
  float inJ = pr.y;
  s.alb = mix(stone, joint, inJ);
  s.h = pr.x + 0.0045 * dome * (1.0 - inJ) + 0.00015 * n[1] - 0.0002 * fleck;
  s.rough = mix(0.74 - 0.26 * wear + 0.05 * n[2], 0.96, inJ);
  s.cav = mix(1.0, 0.42, inJ);`,
};

const sandstone = {
  detail: 0.8, scale: 2.72, tint: true, alpha: false, mode: GRID, sym: 1, hr: [-0.008, 0.0025], ao: 0.5,
  prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 6601u); f[1] = FB(uv, ivec2(12), 3, 0.5, 6603u); f[2] = FB(uv, ivec2(120), 2, 0.5, 6607u);
  f[3] = Req(vec2(uv.x * 6.0, uv.y * 90.0), ivec2(6, 90), 3, 0.5, 6609u); w[0] = WO(uv, ivec2(48), 0.9, 6611u);`,
  surf: /* glsl */`
  // coursed ashlar: 0.34 m courses, blocks 0.68 m ± 0.15 in a broken bond, 6 mm lime joints, a 25 mm drafted margin round
  // a face tooled in fine vertical batting (the Victorian finish), per-block tone and bedding lines, the odd weathered or
  // iron-stained block. On tops it reads as flags. The block colour makes it sandstone (cream) or bluestone (blue-grey)
  float a = P.x, b = P.y;
  ${COURSE('q', '0.34', '0.68', 4, 8, '0.3', '0.004')}
  vec2 pr = edgeProf(q.x, 0.003, 0.006, 0.002, 0.006);
  float inJ = pr.y;
  float face = smoothstep(0.018, 0.03, q.x);
  float t1 = q.w, t2 = fract(q.w * 7.31), t3 = fract(q.w * 3.77);
  float tool = 0.5 + 0.5 * sin(a * 260.0 + 2.0 * n[2] + t1 * 20.0);
  float bed = n[3];
  vec3 hue = mix(vec3(1.03, 0.995, 0.95), vec3(0.97, 0.99, 1.02), t2);
  float tone = 0.8 * (1.0 + 0.12 * (t1 - 0.5)) * (1.0 + 0.04 * n[1] + 0.03 * bed) * (1.0 - 0.03 * face * tool);
  float worn = step(0.88, t3) * smoothstep(-0.2, 0.5, n[0]);
  vec4 g = c[0];
  float pit = worn * step(0.6, g.z) * (1.0 - aa(0.006, g.x * (2.72 / 48.0) * 0.4));
  float stain = step(0.95, fract(t1 * 17.3)) * smoothstep(0.2, -0.6, q.z) * 0.5;
  vec3 col = vec3(tone) * hue * (1.0 - 0.1 * worn) * (1.0 - 0.25 * pit);
  col = mix(col, col * vec3(1.05, 0.88, 0.74), stain);
  col *= 1.0 + 0.03 * (1.0 - face);
  vec3 mort = vec3(0.88, 0.87, 0.83) * (1.0 + 0.05 * n[2]);
  s.alb = mix(col, mort, inJ);
  s.h = pr.x + (0.0011 * face * (0.55 + 0.45 * n[2]) + 0.0002 * face * tool - 0.0014 * pit + 0.0002 * bed) * (1.0 - inJ);
  s.rough = mix(0.8 + 0.05 * face + 0.08 * worn, 0.93, inJ);
  s.cav = mix(1.0, 0.72, inJ) * (1.0 - 0.3 * pit);`,
};

export const SURFACES = [
  { slot: 64, name: 'bluestone', onWall: 66, mat: bluestone },
  { slot: 65, name: 'granite', onWall: 66, mat: granite },
  { slot: 66, name: 'sandstone', mat: sandstone },
];
