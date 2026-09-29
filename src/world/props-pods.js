// Sprout pods' default looks (src/game/pods.js): the seed bulb (and a planter, for a layout that asks the engine for
// one) and the hedge it grows, for any stage whose LAYOUT.pods doesn't name prop types of its own. A stage's own types
// follow the same contract:
//
//   pod type — built by the engine (PropKit.buildPart, in the pod's own frame):
//     o.part === 'bulb'     the swelling part, its origin at its own base: the engine anchors it at the pod's bulbY
//                           (the planter's height), scales it from there as the meters fill, blushes it toward the team
//                           that's ahead and makes it glow — through its own copies of the materials (build it pale)
//     o.part === 'planter'  the planter, origin at the pod's ground point — only drawn by the engine when the layout
//                           asks it to (pods.planter); a stage normally places its planters as props with colliders
//     (no part: both, for a static placement)
//   hedge type — built at o.size = [w, h, d] (also o.w, o.h, o.d): w across (local x), d along local z, origin at its
//     base centre, no colliders (the engine's block). o.tint (a THREE.Color: the grower's ink; null = untinted) and
//     o.team: bake the team into the look (the engine builds one per team, again when the palette changes). On top, the
//     engine gives its own copies of the 'foliage' (leaves) and 'gloss' (blossoms) materials a sheen of that ink and
//     browns them as it wilts. Keep the outside within ~5 cm of the w × h × d box and the top flat-ish: the team's ink
//     is drawn on the box's faces (swimmable walls, a standable top).
export function registerPods(D, H) {
  const { THREE, PALETTE, TAU, HP, col, mixc, blobGeo, roundBox } = H;
  const cache = new Map();
  const once = (k, fn) => { let g = cache.get(k); if (!g) { g = fn(); cache.set(k, g); } return g; };

  D.sprout_pod = {
    desc: 'Sprout pod (the pods engine\'s default look): a pale green seed bulb cupped in leaf petals (0.5 m, origin at its base) and, for a '
      + 'layout that asks the engine for planters, a low round concrete planter of dark soil ringed with leaves (0.9 × 0.5 m).',
    params: { part: "'planter' | 'bulb' (both when unset: the bulb sits at 0.5 m)" },
    variants: 1, mount: 'ground',
    build(B, o) {
      const planter = o.part !== 'bulb', bulb = o.part !== 'planter';
      if (planter) {
        B.blob(1.2, 1.2);
        // the planter: a squat concrete bowl with a rolled lip, soil at 0.44 m
        const prof = [[0, 0], [0.4, 0], [0.45, 0.04], [0.47, 0.44], [0.44, 0.5], [0.38, 0.49], [0.37, 0.42], [0, 0.42]];
        B.lathe('paint', mixc('concrete', 'warmgrey', 0.35), prof, 0, 0, 0, { seg: 18 });
        B.cyl('rubber', PALETTE.soil, 0.37, 0.04, 0, 0.44, 0, { seg: 16 });
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU + B.r(-0.15, 0.15);
          B.add('foliage', once('leaf' + (i % 4), () => blobGeo(1, 1, i % 4)), mixc('leaf', 'leaflight', B.r(0, 0.4)),
            Math.cos(a) * 0.31, 0.49, Math.sin(a) * 0.31, { sx: 0.13, sy: 0.05, sz: 0.09, ry: -a, ao: false });
        }
      }
      if (bulb) {
        // the bulb (origin at its base): a teardrop seed pod (pale, so the team blush reads), leaf petals cupping it, a
        // curled shoot on top
        const y0 = o.part === 'bulb' ? 0 : 0.46;
        const prof = [[0, 0], [0.13, 0.03], [0.21, 0.11], [0.23, 0.2], [0.2, 0.3], [0.13, 0.39], [0.06, 0.45], [0, 0.47]];
        B.lathe('gloss', '#d9ecb8', prof, 0, y0, 0, { seg: 16 });
        for (const [x, z] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2], [0.14, 0.14], [-0.14, -0.14]]) B.add('foliage', once('petal', () => blobGeo(1, 1, 5)), 'leaf',
          x, y0 + 0.1, z, { sx: 0.11, sy: 0.16, sz: 0.05, ry: Math.atan2(x, z), rx: 0.35, ao: false });
        B.cyl('foliage', 'leafdark', 0.018, 0.14, 0.02, y0 + 0.53, 0, { seg: 6, rz: 0.4 });
        B.add('foliage', once('bud', () => blobGeo(1, 1, 2)), 'leaflight', 0.06, y0 + 0.59, 0, { sx: 0.05, sy: 0.035, sz: 0.04, ao: false });
      }
    },
  };

  D.sprout_hedge = {
    desc: 'Sprout pod hedge (the pods engine\'s default look): a clipped boxwood wall (o.size = [w, h, d], default 3 × 1.8 × 0.9) with a flat top, '
      + 'its faces covered in small leaf sprays; o.tint (the grower\'s ink) lightly tints the leaves and colours its blossoms.',
    params: { size: '[w, h, d] (m): width (local x), height, depth (local z)', tint: 'THREE.Color | null: the grower\'s ink' },
    variants: 1, mount: 'ground',
    build(B, o) {
      const [w0, h, d0] = o.size || [o.w ?? 3, o.h ?? 1.8, o.d ?? 0.9];
      const w = w0 + 0.03, d = d0 + 0.04;                 // (a touch over its size: it covers the planter it grows from)
      const tint = o.tint ? col(o.tint) : null;
      const leaf = (c, k = 0.06) => (tint ? mixc(c, tint, k) : col(c));
      // the clipped body: dark inner growth, just inside the sprays (and all round the planter)
      B.add('foliage', roundBox(w - 0.04, h - 0.03, d - 0.02, 0.05), leaf(mixc('leafdark', 'leaf', 0.3), 0.04), 0, (h - 0.03) / 2, 0);
      // leaf sprays over every face (flattened clusters, ~3 cm proud of the body): the sides, the ends, the top
      const spray = (x, y, z, rx, ry, s) => B.add('foliage', once('spray' + ((x * 7 + y * 13 + z * 5) & 7), () => blobGeo(1, 0, ((x * 7 + y * 13 + z * 5) & 7) + 1)),
        leaf(mixc('leaf', 'leaflight', B.r(0, 0.55))), x, y, z, { sx: s, sy: s * 0.85, sz: 0.045, rx, ry, rz: B.r(0, TAU), ao: false });
      const cell = 0.19;
      for (const sd of [1, -1]) {
        for (let y = 0.12; y < h - 0.08; y += cell) for (let x = -w / 2 + 0.1; x < w / 2 - 0.05; x += cell)
          spray(x + B.r(-0.05, 0.05), y + B.r(-0.04, 0.04), sd * (d / 2 - 0.035), 0, sd > 0 ? 0 : Math.PI, B.r(0.1, 0.14));
        for (let y = 0.12; y < h - 0.08; y += cell) for (let z = -d / 2 + 0.1; z < d / 2 - 0.05; z += cell)
          spray(sd * (w / 2 - 0.035), y + B.r(-0.04, 0.04), z + B.r(-0.04, 0.04), 0, sd * HP, B.r(0.1, 0.14));
      }
      for (let x = -w / 2 + 0.1; x < w / 2 - 0.05; x += cell) for (let z = -d / 2 + 0.1; z < d / 2 - 0.05; z += cell)
        spray(x + B.r(-0.05, 0.05), h - 0.03, z + B.r(-0.04, 0.04), -HP, 0, B.r(0.11, 0.15));
      // blossoms in the grower's ink (white untinted), on the sides and the top
      const bl = once('blossom', () => new THREE.IcosahedronGeometry(1, 1)), bc = tint || 'white';
      const nb = Math.round(w * h * 7);
      for (let k = 0; k < nb; k++) {
        const face = B.r(), s = 0.045 + B.r(0, 0.03);
        if (face < 0.85) {
          const sd = face < 0.425 ? 1 : -1;
          B.add('gloss', bl, bc, B.r(-w / 2 + 0.12, w / 2 - 0.12), B.r(0.3, h - 0.1), sd * (d / 2 + 0.005), { s, sz: s * 0.6, ao: false });
        } else B.add('gloss', bl, bc, B.r(-w / 2 + 0.1, w / 2 - 0.1), h + 0.01, B.r(-d / 2 + 0.1, d / 2 - 0.1), { s: s * 0.8, sy: s * 0.4, ao: false });
      }
    },
  };
}
