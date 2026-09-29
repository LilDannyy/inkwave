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
  const { THREE, PALETTE, TAU, col, mixc, blobGeo, puffGeo, roundBox } = H;
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
      + 'leafy tufts along its sides and small blossoms; o.tint (the grower\'s ink) tints the leaves and colours the blossoms.',
    params: { size: '[w, h, d] (m): width (local x), height, depth (local z)', tint: 'THREE.Color | null: the grower\'s ink' },
    variants: 1, mount: 'ground',
    build(B, o) {
      const [w, h, d] = o.size || [o.w ?? 3, o.h ?? 1.8, o.d ?? 0.9];
      const tint = o.tint ? col(o.tint) : null;
      const leaf = (base, k = 0.4) => (tint ? mixc(base, tint, k) : base);
      // the clipped body (flat top: the ink sits on it), a darker skirt of older growth at its foot
      B.add('foliage', roundBox(w - 0.04, h - 0.02, d - 0.04, 0.09), leaf(mixc('leaf', 'leaflight', 0.25)), 0, (h - 0.02) / 2, 0);
      B.box('foliage', leaf('leafdark', 0.3), w - 0.02, 0.22, d - 0.02, 0, 0.11, 0, { r: 0.05 });
      // tufts breaking up the sides (sunk into the body: at most ~4 cm proud)
      const n = Math.max(3, Math.round(w / 0.42)), rows = Math.max(2, Math.round(h / 0.5));
      for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) for (const sd of [1, -1]) {
        if (B.r() < 0.35) continue;
        const x = -w / 2 + ((i + 0.5 + B.r(-0.25, 0.25)) / n) * w, y = 0.25 + ((j + 0.5) / rows) * (h - 0.45);
        B.add('foliage', once('puff' + ((i + j) % 6), () => puffGeo(1, (i + j) % 6)), leaf(mixc('leaf', 'leaflight', B.r(0.1, 0.5))),
          x, y, sd * (d / 2 - 0.12), { s: 0.2, sz: 0.16, ry: B.r(0, TAU), ao: false });
      }
      for (const sx of [1, -1]) for (let j = 0; j < rows; j++) {
        B.add('foliage', once('puff2', () => puffGeo(1, 2)), leaf(mixc('leaf', 'leaflight', B.r(0.1, 0.4))),
          sx * (w / 2 - 0.12), 0.25 + ((j + 0.5) / rows) * (h - 0.45), B.r(-0.15, 0.15), { s: 0.18, sx: 0.16, ry: B.r(0, TAU), ao: false });
      }
      // blossoms in the grower's ink (white untinted)
      const bl = once('blossom', () => new THREE.IcosahedronGeometry(1, 0)), bc = tint ? mixc(tint, 'white', 0.15) : 'white';
      const nb = Math.round(w * h * 5);
      for (let k = 0; k < nb; k++) {
        const face = B.r(), s = 0.035 + B.r(0, 0.025);
        if (face < 0.8) {
          const sd = face < 0.4 ? 1 : -1;
          B.add('gloss', bl, bc, B.r(-w / 2 + 0.12, w / 2 - 0.12), B.r(0.35, h - 0.12), sd * (d / 2 + 0.01), { s, ao: false });
        } else B.add('gloss', bl, bc, B.r(-w / 2 + 0.1, w / 2 - 0.1), h + 0.005, B.r(-d / 2 + 0.1, d / 2 - 0.1), { s: s * 0.8, sy: s * 0.5, ao: false });
      }
    },
  };
}
