// Bluestone Junction — the stage's own far scenery (layout.env.backdrop; see the top of src/world/environment.js). Gets the
// environment's SCENERY_KIT (+ THREE, bounds, runs, rnd, sceneryMaterial) — imports nothing, so layout.js stays importable
// in Node.
//
// One skyline per era (DESIGN.md §5.5; ENGINE.md H13: the backdrop's era sets, `sets: { 1, 2, 3 }`, each its own hidden
// group the era engine shows and swaps with the horizon run as the front leaves the arena); the low blue ranges inland
// are the main set, the same in every era (the constant that says it is the same place). Each era set is one city mesh
// (the far scenery's own facade shader, HZ_CITY: window rows by day, lit windows at dusk — each building's facade style
// per era) plus one plain mesh for what has no windows: ≤ 2 draw calls a set (the cap is 6).
//   1 the 1880s: the city grid climbing away in two- to four-storey terraces with punched windows, a cathedral's three
//     spires, the brick shot tower, the domed exhibition hall, gasometers, factory chimneys under smoke, the masts of the
//     tall ships and a paddle steamer on the river
//   2 today: the old city kept under glass towers (curtain walls and ribbon windows), one tall tower with a gold crown,
//     the shot tower inside a glass cone, the arts precinct's lattice spire, stadium light towers, an observation wheel
//   3 the 3000s: arcology towers with light seams, hanging gardens and sky-bridges, the shot tower and the exhibition dome
//     under glass bells, garden platforms floating on the river, the sea wall across the bay with the sea high against it,
//     the faint arc of an orbital ring, and a dark bank of storm cloud low on the southern horizon (the coming end)
export function buildBackdrop(kit) {
  const { box, cyl, sph, xf, THREE } = kit;
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
  // a city mesh: parts carrying the facade attribute bld = (style, seed, base y), merged by hand (prep: non-indexed,
  // colour, glow), drawn with the far scenery's material and its city facade shader
  const tagged = [];
  const bld = (g, style, seed, baseY = 0) => {
    const p = kit.prep ? kit.prep(g) : g, n = p.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = style; a[i * 3 + 1] = seed; a[i * 3 + 2] = baseY; }
    p.setAttribute('bld', new THREE.BufferAttribute(a, 3));
    tagged.push(p);
    return p;
  };
  const cityMesh = (parts, name) => {
    if (!parts.length || !kit.sceneryMaterial) return null;
    const keys = ['position', 'normal', 'color', 'glow', 'bld'];
    const tot = parts.reduce((s, g) => s + g.attributes.position.count, 0);
    const geo = new THREE.BufferGeometry();
    for (const k of keys) {
      const sz = parts[0].attributes[k].itemSize, arr = new Float32Array(tot * sz);
      let o = 0;
      for (const g of parts) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
      geo.setAttribute(k, new THREE.BufferAttribute(arr, sz));
    }
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, kit.sceneryMaterial({ city: true }));
    m.name = name; m.frustumCulled = false;
    return m;
  };
  const hills = [];
  for (const [x, z] of ring(26, 300, 360, 11)) hills.push(xf(cyl(0, 70 + R() * 50, 30 + R() * 25, 7, '#7d8ea0'), x, 10, z));

  // ---- the 1880s
  const s1 = [], c1 = [];
  const BRICK = ['#9c6b55', '#a6765e', '#8d6150'], STONE = ['#b9a98c', '#c4b597', '#a99a7e'];
  for (const [x, z, a] of ring(70, 105, 195, 21)) {
    const h = 7 + R() * 9, w = 10 + R() * 14, d = 8 + R() * 8, col = R() < 0.5 ? BRICK[(R() * 3) | 0] : STONE[(R() * 3) | 0];
    c1.push(bld(xf(box(w, h, d, col), x, h / 2, z, -a), 1, R() * 10));
    s1.push(xf(box(w + 0.6, 0.7, d + 0.6, '#5d5650'), x, h + 0.35, z, -a));   // the roofs' parapets
    if (R() < 0.3) s1.push(xf(cyl(0.9, 1.1, h + 14, 8, '#7a5848'), x + 3, (h + 14) / 2, z, 0));   // chimneys
  }
  for (const [x, z] of [[-150, 170], [150, -170]]) for (const dx of [-8, 0, 8]) {
    s1.push(xf(cyl(0, 3.2, dx ? 34 : 46, 8, '#8f8679'), x + dx, (dx ? 34 : 46) / 2 + 24, z));
    c1.push(bld(xf(box(6, 24, 6, '#9a9083'), x + dx, 12, z), 1, 3));
  }
  for (const [x, z] of [[-150, 170], [150, -170]]) c1.push(bld(xf(box(30, 18, 14, '#9a9083'), x, 9, z), 1, 7));   // the cathedral's nave
  for (const [x, z] of [[120, 150], [-120, -150]]) s1.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z), xf(cyl(5.2, 5.2, 2, 12, '#6f3e30'), x, 50, z));   // the shot tower
  for (const [x, z] of [[-170, -60], [170, 60]]) { c1.push(bld(xf(cyl(18, 18, 14, 16, '#b7ad98'), x, 7, z), 5, 2)); s1.push(xf(cyl(0.5, 17, 12, 16, '#8a7a5a'), x, 20, z), xf(cyl(0.3, 0.6, 6, 8, '#8a7a5a'), x, 29, z)); }   // the exhibition dome
  for (const [x, z] of [[130, -40], [-130, 40]]) s1.push(xf(cyl(12, 12, 16, 16, '#5f6467'), x, 8, z), xf(cyl(12.3, 12.3, 0.5, 16, '#4d5255'), x, 6, z), xf(cyl(12.3, 12.3, 0.5, 16, '#4d5255'), x, 12, z));   // gasometers
  // smoke over the factory chimneys (pale grey puffs drifting east)
  for (const [x, z] of [[140, -90], [-140, 90], [100, -120], [-100, 120], [160, 20], [-160, -20]]) {
    s1.push(xf(cyl(1.4, 1.8, 30, 8, '#6b4c40'), x, 15, z));
    for (let k = 0; k < 4; k++) s1.push(xf(sph(4 + k * 1.6, 8, 6, k < 2 ? '#8e8a86' : '#b3afa8'), x + k * 6, 33 + k * 3.5, z + k * 1.5));
  }
  // tall ships' masts and a paddle steamer on the river (east and west beyond the wharves)
  for (const [x, z] of [[-85, -40], [-95, 10], [85, 40], [95, -10]]) {
    s1.push(xf(box(22, 3, 6, '#3d3631'), x, 1.2, z, Math.PI / 2));
    for (const dz of [-6, 0, 6]) { s1.push(xf(cyl(0.25, 0.35, 22, 6, '#4a3a2c'), x, 12, z + dz)); s1.push(xf(box(0.3, 0.3, 7, '#4a3a2c'), x, 18, z + dz, Math.PI / 2)); }
  }
  for (const [x, z] of [[-78, 60], [78, -60]]) { s1.push(xf(box(5, 3.5, 24, '#2f2b28'), x, 1.6, z), xf(box(4, 2.4, 14, '#e8dcc0'), x, 4.4, z), xf(cyl(0.8, 0.9, 7, 10, '#3a2a22'), x, 8, z), xf(cyl(3, 3, 1.2, 14, '#7a2c22'), x + 2.6, 2.4, z, 0, 0, Math.PI / 2)); }

  // ---- today
  const s2 = [], c2 = [];
  for (const [x, z, a] of ring(64, 105, 205, 31)) {
    const tall = R() < 0.42, h = tall ? 40 + R() * 70 : 8 + R() * 12, w = tall ? 10 + R() * 8 : 12 + R() * 12;
    const col = tall ? (R() < 0.5 ? '#7d93a3' : '#9aa9b2') : (R() < 0.5 ? '#b0a38b' : '#a1765f');
    c2.push(bld(xf(box(w, h, w * (0.7 + R() * 0.5), col), x, h / 2, z, -a), tall ? (R() < 0.5 ? 3 : 2) : 1, R() * 10));
    if (tall && R() < 0.5) s2.push(xf(box(w * 0.5, 3, w * 0.4, '#5d6b75'), x, h + 1.5, z, -a));   // plant rooms
  }
  for (const [x, z] of [[-150, 170], [150, -170]]) for (const dx of [-8, 0, 8]) { s2.push(xf(cyl(0, 3.2, dx ? 34 : 46, 8, '#8f8679'), x + dx, (dx ? 34 : 46) / 2 + 24, z)); c2.push(bld(xf(box(6, 24, 6, '#9a9083'), x + dx, 12, z), 1, 3)); }
  for (const [x, z] of [[120, 150], [-120, -150]]) s2.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z), xf(cyl(6, 22, 70, 16, '#a9bcc8'), x, 35, z));   // the shot tower in its cone
  for (const [x, z] of [[-60, 210], [60, -210]]) { c2.push(bld(xf(box(16, 120, 16, '#6f8291'), x, 60, z), 3, 5)); s2.push(xf(box(10, 8, 10, '#c9a85a'), x, 124, z), xf(cyl(0.3, 0.5, 14, 6, '#c9a85a'), x, 135, z)); }   // the gold crown
  for (const [x, z] of [[-95, -120], [95, 120]]) { for (let k = 0; k < 10; k++) s2.push(xf(box(1.2, 8, 1.2, '#dfe4e8'), x + Math.cos(k * 0.63) * (6 - k * 0.5), 4 + k * 8, z + Math.sin(k * 0.63) * (6 - k * 0.5), k * 0.63)); }   // the lattice spire
  for (const [x, z] of [[-140, -10], [140, 10], [-125, -40], [125, 40]]) s2.push(xf(cyl(0.6, 0.9, 50, 6, '#9aa1a5'), x, 25, z), xf(box(6, 3, 1, '#e6e6e0', 0.6), x, 51, z));   // stadium light towers
  for (const [x, z] of [[95, -60], [-95, 60]]) {
    s2.push(xf(new THREE.TorusGeometry(22, 0.7, 6, 48), x, 26, z, Math.PI / 2 * 0 + (x > 0 ? 0.4 : -0.4)));
    for (let k = 0; k < 16; k++) { const t = (k / 16) * Math.PI * 2; s2.push(xf(box(0.4, 22, 0.4, '#d7dce0'), x + Math.cos(x > 0 ? 0.4 : -0.4) * Math.sin(t) * 11 * 0, 26, z, x > 0 ? 0.4 : -0.4, 0, t)); }
    s2.push(xf(box(2, 26, 2, '#c7ccd0'), x, 13, z));
  }

  // ---- the 3000s
  const s3 = [], c3 = [];
  for (const [x, z, a] of ring(44, 115, 215, 41)) {
    const h = 60 + R() * 120, w = 14 + R() * 12;
    c3.push(bld(xf(box(w, h, w, R() < 0.5 ? '#e6e9ec' : '#d6dee4'), x, h / 2, z, -a), R() < 0.5 ? 4 : 2, R() * 10));
    s3.push(xf(box(w * 0.18, h * 0.9, w * 1.02, '#f4e9c8', 1), x, h * 0.45, z, -a));   // a light seam
    for (let k = 1; k < 4; k++) if (R() < 0.6) s3.push(xf(box(w * 1.06, 1.6, w * 1.06, '#6f8a5a'), x, h * (k / 4), z, -a));   // hanging gardens
    if (R() < 0.35) s3.push(xf(box(w * 2.4, 2.5, 3, '#eef0f2'), x + Math.cos(a) * w, h * 0.6, z + Math.sin(a) * w, -a + Math.PI / 2));   // sky-bridges
  }
  for (const [x, z] of [[120, 150], [-120, -150]]) s3.push(xf(cyl(4, 5.5, 50, 12, '#8c4f3c'), x, 25, z), xf(sph(16, 16, 10, '#dfe7ee'), x, 30, z, 0, 0, 0, 1, 1.9, 1), xf(cyl(18, 18, 0.6, 24, '#f4e9c8', 1), x, 52, z));   // the shot tower under its bell
  for (const [x, z] of [[-170, -60], [170, 60]]) s3.push(xf(cyl(18, 18, 14, 16, '#b7ad98'), x, 7, z), xf(sph(26, 20, 12, '#dfe7ee'), x, 14, z, 0, 0, 0, 1, 0.85, 1));   // the dome under its glass bell
  // the floating garden platforms on the river and the sea wall across the bay with its tide gates (the sea high on it)
  for (const [x, z] of [[-85, -30], [-92, 20], [85, 30], [92, -20]]) s3.push(xf(cyl(9, 10, 1.2, 14, '#e8ecef'), x, 0.2, z), xf(cyl(8.6, 8.6, 0.8, 14, '#6f8a5a'), x, 1.1, z), xf(cyl(8.8, 8.8, 0.2, 24, '#f4e9c8', 1), x, 0.85, z));
  for (const s of [-1, 1]) { s3.push(xf(box(360, 14, 6, '#d9dee2'), 0, 4, s * 260)); for (let k = -3; k <= 3; k++) s3.push(xf(box(4, 22, 8, '#c7ced4'), k * 50, 8, s * 260), xf(box(0.6, 18, 8.2, '#f4e9c8', 1), k * 50 + 2.3, 8, s * 260)); s3.push(xf(box(360, 1.2, 40, '#2a4252'), 0, 9.5, s * 285)); }
  // the orbital ring's faint arc and the storm bank in the south (the coming end)
  s3.push(xf(new THREE.TorusGeometry(900, 2.2, 4, 96, Math.PI), 0, -120, 600, 0.3, -0.2, 0));
  for (let i = 0; i < 9; i++) s3.push(xf(box(120, 26 + R() * 18, 30, '#3d4250'), -300 + i * 75, 18, -420));
  return {
    static: [], plain: hills, terrain: [], instances: [],
    sets: {
      1: { plain: s1, objects: [cityMesh(c1, 'StageCity:1')].filter(Boolean) },
      2: { plain: s2, objects: [cityMesh(c2, 'StageCity:2')].filter(Boolean) },
      3: { plain: s3, objects: [cityMesh(c3, 'StageCity:3')].filter(Boolean) },
    },
  };
}
