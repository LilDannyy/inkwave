// Bluestone Junction — the stage's own far scenery (layout.env.backdrop; see the top of src/world/environment.js). Gets the
// environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, sceneryMaterial) — imports nothing, so layout.js stays
// importable in Node.
//
// One skyline per era (DESIGN.md §5.5; ENGINE.md H13: the backdrop's era sets, `sets: { 1, 2, 3 }`, each its own hidden
// group the era engine shows and swaps with the horizon run as the front leaves the arena); the low blue ranges inland
// are the main set, the same in every era (the constant that says it is the same place). BLOCKOUT: plain massing, one
// draw call per set (≤ 6 allowed), the art pass dresses it:
//   1 the 1880s: the city grid climbing away in two- and three-storey terraces, a cathedral's three spires, the brick
//     shot tower, the domed exhibition hall, gasometers and smoking chimneys, tall ships' masts on the river
//   2 today: glass towers among the old spires, one tall tower with a gold crown, the shot tower inside a glass cone
//   3 the 3000s: arcology towers with light seams and sky-bridges, the shot tower and the dome under glass bells, a
//     dark bank of storm cloud low on the southern horizon (the coming end)
export function buildBackdrop(kit) {
  const { box, cyl, xf } = kit;
  const R = kit.rnd ? kit.rnd(4127) : Math.random;
  // spots on a ring round the arena (outside its ±42 × ±80 bounds), every 360/n degrees with a jitter; mirrored
  const ring = (n, r0, r1, seed) => {
    const out = [], rr = kit.rnd ? kit.rnd(seed) : R;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rr() * 0.12, rx = (r0 + rr() * (r1 - r0)) * 0.8, rz = r0 + rr() * (r1 - r0) + 40;
      out.push([Math.cos(a) * rx, Math.sin(a) * rz, a]);
    }
    return out;
  };
  const hills = [];
  for (const [x, z] of ring(26, 300, 360, 11)) hills.push(xf(cyl(0, 70 + R() * 50, 30 + R() * 25, 7, '#7d8ea0'), x, 10, z));
  // ---- the 1880s
  const s1 = [];
  for (const [x, z, a] of ring(64, 110, 190, 21)) {
    const h = 6 + R() * 8, w = 10 + R() * 14, d = 8 + R() * 8;
    s1.push(xf(box(w, h, d, R() < 0.5 ? '#9c6b55' : '#b9a98c'), x, h / 2, z, -a));
    if (R() < 0.25) s1.push(xf(cyl(0.9, 1.1, h + 14, 8, '#7a5848'), x + 3, (h + 14) / 2, z, 0));   // chimneys
  }
  for (const [x, z] of [[-150, 170], [150, -170]]) for (const dx of [-8, 0, 8]) s1.push(xf(cyl(0, 3.2, dx ? 34 : 46, 8, '#8f8679'), x + dx, (dx ? 34 : 46) / 2 + 12, z), xf(box(6, 24, 6, '#9a9083'), x + dx, 12, z));   // the cathedral
  for (const [x, z] of [[120, 150], [-120, -150]]) s1.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z));                  // the shot tower
  for (const [x, z] of [[-170, -60], [170, 60]]) s1.push(xf(cyl(18, 18, 14, 16, '#b7ad98'), x, 7, z), xf(cyl(0.5, 17, 12, 16, '#8a7a5a'), x, 20, z));   // the exhibition dome
  for (const [x, z] of [[130, -40], [-130, 40]]) s1.push(xf(cyl(12, 12, 16, 16, '#5f6467'), x, 8, z));                   // gasometers
  // ---- today
  const s2 = [];
  for (const [x, z, a] of ring(56, 110, 200, 31)) {
    const tall = R() < 0.45, h = tall ? 40 + R() * 60 : 8 + R() * 10, w = tall ? 10 + R() * 8 : 12 + R() * 12;
    s2.push(xf(box(w, h, w * (0.7 + R() * 0.5), tall ? (R() < 0.5 ? '#7d93a3' : '#9aa9b2') : '#b0a38b'), x, h / 2, z, -a));
  }
  for (const [x, z] of [[-150, 170], [150, -170]]) for (const dx of [-8, 0, 8]) s2.push(xf(cyl(0, 3.2, dx ? 34 : 46, 8, '#8f8679'), x + dx, (dx ? 34 : 46) / 2 + 12, z), xf(box(6, 24, 6, '#9a9083'), x + dx, 12, z));
  for (const [x, z] of [[120, 150], [-120, -150]]) s2.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z), xf(cyl(6, 22, 70, 16, '#a9bcc8'), x, 35, z));   // the shot tower in its cone
  for (const [x, z] of [[-60, 210], [60, -210]]) s2.push(xf(box(16, 120, 16, '#6f8291'), x, 60, z), xf(box(10, 8, 10, '#c9a85a'), x, 124, z));   // the gold crown
  // ---- the 3000s
  const s3 = [];
  for (const [x, z, a] of ring(40, 120, 210, 41)) {
    const h = 60 + R() * 110, w = 14 + R() * 12;
    s3.push(xf(box(w, h, w, R() < 0.5 ? '#e6e9ec' : '#d6dee4'), x, h / 2, z, -a));
    s3.push(xf(box(w * 0.18, h * 0.9, w * 1.02, '#f4e9c8', true), x, h * 0.45, z, -a));   // a light seam
    if (R() < 0.35) s3.push(xf(box(w * 2.4, 2.5, 3, '#eef0f2'), x + Math.cos(a) * w, h * 0.6, z + Math.sin(a) * w, -a + Math.PI / 2));   // sky-bridges
  }
  for (const [x, z] of [[120, 150], [-120, -150]]) s3.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z), xf(cyl(18, 18, 0.6, 24, '#f4e9c8', true), x, 52, z));
  for (const [x, z] of [[-170, -60], [170, 60]]) s3.push(xf(cyl(0.5, 26, 30, 24, '#dfe7ee'), x, 15, z));                  // the dome under its glass bell
  for (let i = 0; i < 9; i++) s3.push(xf(box(120, 26 + R() * 18, 30, '#3d4250'), -300 + i * 75, 18, -420));              // the storm bank in the south
  return { static: [], plain: hills, terrain: [], instances: [], sets: { 1: { plain: s1 }, 2: { plain: s2 }, 3: { plain: s3 } } };
}
