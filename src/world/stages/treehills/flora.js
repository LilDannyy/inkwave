// Eco-Forest Treehills — the planting: the hills' evergreens (Hinoki cypress, Thujopsis), young cypress clumps in round
// planters, the meadow's planters and pollinator borders, shrub fringes; and the stage's gimmick, the sprout pods (the
// dormant seed bulb in its planter) and the hedge a pod grows (built at the size the pods engine asks for, tinted in
// the owner team's colour).

export function registerFlora(D, H, T) {
  const { PI, TAU, HP, mixc, col } = H;
  const { K, NS, pbox, ccyl, seg, colC, ROOF, evergreen, shrub, flowerBed, puff, blob, tpl, latheGeo, hash, letters } = T;

  // ------------------------------------------------------------------------------------------ evergreens
  // a Hinoki cypress / Thujopsis on the tiers: h tall, w width factor; its trunk and the dense lower foliage are cover
  // (a solid core, its top off-limits); the spray tips beyond are soft
  D.treehills_tree = {
    desc: 'evergreen (Hinoki cypress or Thujopsis): h tall; the lower foliage core is solid cover',
    build(B, o) {
      const h = o.h ?? 7, w = o.w ?? 0.8, kind = o.kind ?? 'hinoki';
      const tone = o.c ?? mixc(kind === 'thujopsis' ? K.thu : K.cyp, kind === 'thujopsis' ? K.thuLt : K.cypLt, (hash((o.seed ?? 1) * 1.7) - 0.3) * 0.4);
      evergreen(B, 0, 0, 0, h, { kind, seed: o.seed ?? 1, w, c: tone, rot: o.rot });
      // a mulch ring at the foot
      B.cyl(NS('paint'), '#6b5a45', Math.min(0.75, h * 0.1), 0.03, 0, 0.015, 0, { seg: 12 });
      if (o.solid !== false) { const cw = o.core ?? Math.min(1.8, h * w * 0.3); colC(B, 0, 0, 0, cw, Math.min(3.2, h * 0.45), cw, ROOF); }
    },
  };
  // young cypress clump: three young Hinoki in a round steel planter (cover in the meadow)
  D.treehills_clump = {
    desc: 'young cypress clump: three young Hinoki in a round planter (solid cover)',
    build(B, o) {
      const r = o.r ?? 1.1, ph = 0.55, s = o.seed ?? 3;
      B.cyl('paint', K.mod, r, ph - 0.06, 0, (ph - 0.06) / 2, 0, { seg: 12 });
      B.tor('gloss', K.trim, r, 0.05, 0, ph - 0.04, 0, { rx: HP, rs: 4, ts: 24 });
      B.cyl(NS('paint'), K.soil, r - 0.06, 0.04, 0, ph - 0.05, 0, { seg: 12 });
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + hash(s) * 2, rr = r * 0.45;
        evergreen(B, Math.cos(a) * rr, ph - 0.05, Math.sin(a) * rr, 2.6 + hash(s + k) * 1.1, { kind: 'hinoki', seed: s + k, w: 0.62, c: mixc(K.cyp, K.cypLt, 0.25 + 0.3 * hash(s * 3 + k)) });
      }
      shrub(B, 0, ph - 0.05, 0, 0.9, s + 7, K.shrubLt, { n: 3, ns: true });
      colC(B, 0, 0, 0, 2 * r * 0.92, ph, 2 * r * 0.92);
      colC(B, 0, ph, 0, 1.5, 2.2, 1.5, ROOF);
    },
  };

  // ------------------------------------------------------------------------------------------ planters, borders
  // a rectangular steel planter (w × d × h): module-green body, a pale rim, shrubs / flowers / a small tree
  D.treehills_planter = {
    desc: 'raised steel planter (w × d × h) with shrubs and flowers (cover)',
    build(B, o) {
      const w = o.w ?? 2.2, d = o.d ?? 0.9, h = o.h ?? 0.6, s = o.seed ?? 5;
      pbox(B, 'paint', o.c ?? K.mod, w, h - 0.06, d, 0, (h - 0.06) / 2, 0);
      for (let k = 1; k < Math.round(w / 0.6); k++) for (const sz of [-1, 1]) pbox(B, NS('paint'), K.modLt, 0.06, h - 0.2, 0.02, -w / 2 + (k * w) / Math.round(w / 0.6), (h - 0.06) / 2, sz * (d / 2 + 0.006));
      pbox(B, 'gloss', K.trim, w + 0.08, 0.07, d + 0.08, 0, h - 0.035, 0);
      pbox(B, NS('paint'), K.soil, w - 0.1, 0.04, d - 0.1, 0, h - 0.05, 0);
      const n = Math.max(2, Math.round(w / 0.7));
      for (let i = 0; i < n; i++) shrub(B, -w / 2 + ((i + 0.5) * w) / n, h - 0.06, (hash(s + i) - 0.5) * d * 0.3, Math.min(d, 0.9) * 1.05, s + i * 5, i % 2 ? K.shrubLt : K.shrub, { n: 3 });
      flowerBed(B, 0, h - 0.04, 0, w * 0.9, d * 0.8, Math.round(w * 9), s * 7, { lift: 0.3, spread: 0.2, cols: o.flowers });
      if (o.tree) evergreen(B, o.tree * w * 0.3, h - 0.05, 0, 2.8, { kind: 'hinoki', seed: s, w: 0.6 });
      B.col(-w / 2, 0, -d / 2, w / 2, h, d / 2);
    },
  };
  // pollinator border: a long flower strip (L along local x, 0.8 wide) behind a low timber edging, with bee-hotel posts
  // (visual only: ankle-high, you walk through it)
  D.treehills_border = {
    desc: 'pollinator border: flower strip with timber edging and bee-hotel posts (visual)',
    build(B, o) {
      const L = o.L ?? 6, d = o.d ?? 0.8, s = o.seed ?? 9;
      for (const z of [-d / 2, d / 2]) pbox(B, 'wood', K.timber, L, 0.12, 0.06, L / 2, 0.06, z);
      pbox(B, NS('paint'), K.soilDk, L - 0.06, 0.03, d - 0.08, L / 2, 0.02, 0);
      const n = Math.round(L / 0.55);
      for (let i = 0; i < n; i++) B.add(NS('foliage'), puff(0, (s + i) % 6), mixc('#6f9a4e', '#98b862', hash(s + i)), ((i + 0.5) * L) / n, 0.16, (hash(s * 3 + i) - 0.5) * d * 0.5, { sx: 0.3, sy: 0.22, sz: 0.28 });
      flowerBed(B, L / 2, 0.08, 0, L * 0.95, d * 0.8, Math.round(L * 14), s * 11, { lift: 0.2, spread: 0.35 });
      for (let k = 0; k < Math.max(1, Math.round(L / 5)); k++) {
        const x = ((k + 0.5) * L) / Math.max(1, Math.round(L / 5));
        ccyl(B, 'wood', K.timberDk, 0.04, 1.0, x, 0.5, 0, { seg: 6 });
        pbox(B, 'wood', K.timber, 0.34, 0.3, 0.2, x, 1.1, 0);
        pbox(B, NS('wood'), K.timberDk, 0.4, 0.05, 0.26, x, 1.27, 0);
        for (let i = 0; i < 6; i++) B.cyl(NS('paint'), K.soilDk, 0.025, 0.02, x - 0.1 + (i % 3) * 0.1, 1.04 + Math.floor(i / 3) * 0.12, 0.1, { rx: HP, seg: 6 });
      }
    },
  };
  // shrub fringe along the foot of a wall (L along local x): visual
  D.treehills_fringe = {
    desc: 'shrub fringe along a wall foot (visual)',
    build(B, o) {
      const L = o.L ?? 4, s = o.seed ?? 13, n = Math.max(2, Math.round(L / 0.9));
      for (let i = 0; i < n; i++) shrub(B, ((i + 0.3 + hash(s + i) * 0.4) * L) / n, 0, (hash(s * 5 + i) - 0.5) * 0.3, 0.8 + hash(s + i * 2) * 0.5, s + i * 3, i % 3 ? K.shrub : '#4d7a47', { n: 3, flat: 0.7 });
      if (o.flowers !== false) flowerBed(B, L / 2, 0.02, 0, L, 0.6, Math.round(L * 5), s * 5, { lift: 0.35, spread: 0.3 });
    },
  };

  // ------------------------------------------------------------------------------------------ sprout pods
  // The pod (src/game/pods.js draws the bulbs; the stage places the planters):
  //   part 'planter' — the low round planter (0.9 across, 0.5 high: green steel, a pale rim, dark soil at 0.46); the
  //                    stage's static prop, collider 0.9 × 0.5 × 0.9 (never inked)
  //   part 'bulb'    — the seed bulb, origin at its own base: the engine anchors it on the soil (LAYOUT.pods.bulbY 0.46),
  //                    scales it from there as the meters fill and blushes / lights it through its own material copies,
  //                    so it is built pale
  //   (no part)      — both (the bulb set on the soil)
  const PH = 0.5, SOIL = 0.46;
  const bulbGeo = () => tpl('thbulb', () => latheGeo([[0, 0], [0.12, 0.01], [0.24, 0.07], [0.3, 0.17], [0.29, 0.28], [0.22, 0.39], [0.13, 0.47], [0.06, 0.54], [0.03, 0.62], [0, 0.64]], 14));
  const veinGeo = () => tpl('thvein', () => latheGeo([[0, 0.005], [0.125, 0.015], [0.245, 0.075], [0.305, 0.17], [0.295, 0.28], [0.225, 0.39], [0.135, 0.47], [0.062, 0.54], [0, 0.56]], 7));
  D.treehills_pod = {
    desc: "sprout pod: a pale seed bulb (origin at its base) in its low round planter (part 'planter' | 'bulb' | both)",
    params: { part: "'planter' (static, collides) | 'bulb' (the engine's moving part, origin at its base) | undefined (both)" },
    build(B, o) {
      if (o.part !== 'bulb') {
        B.cyl('paint', K.modDk, 0.45, PH - 0.05, 0, (PH - 0.05) / 2, 0, { seg: 12 });
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; pbox(B, NS('paint'), K.mod, 0.08, PH - 0.14, 0.03, Math.cos(a) * 0.452, (PH - 0.05) / 2, Math.sin(a) * 0.452, { ry: -a + HP }); }
        B.tor('gloss', K.trim, 0.45, 0.04, 0, PH - 0.03, 0, { rx: HP, rs: 4, ts: 20 });
        B.cyl(NS('paint'), K.soil, 0.41, 0.03, 0, SOIL, 0, { seg: 12 });
        for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.4; B.add(NS('foliage'), blob(0, k), '#6f9a4e', Math.cos(a) * 0.3, SOIL + 0.03, Math.sin(a) * 0.3, { sx: 0.08, sy: 0.04, sz: 0.08, ao: false }); }
        pbox(B, NS('paint'), K.label, 0.16, 0.1, 0.01, 0, 0.3, 0.452);
        if (o.part === 'planter') B.col(-0.45, 0, -0.45, 0.45, PH, 0.45);
      }
      if (o.part !== 'planter') {
        const y0 = o.part === 'bulb' ? 0 : SOIL;
        B.add('gloss', bulbGeo(), '#d8eebb', 0, y0, 0, {});
        for (let k = 0; k < 7; k++) B.add('gloss', veinGeo(), '#b3d692', 0, y0, 0, { ry: (k / 7) * TAU, sx: 0.12, sz: 1.02 });
        // the sprout on top: a curled shoot and two first leaves
        seg(B, 'foliage', '#8fbf62', [0, y0 + 0.62, 0], [0.04, y0 + 0.8, 0.02], 0.035, 0.035, { round: true });
        for (const s of [-1, 1]) B.add('foliage', blob(0, s > 0 ? 2 : 5), '#a8d47a', s * 0.1, y0 + 0.82, 0.02, { sx: 0.12, sy: 0.03, sz: 0.07, rz: s * 0.4 });
        // roots gripping the soil
        for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.3; seg(B, NS('wood'), '#8a7a52', [Math.cos(a) * 0.18, y0 + 0.05, Math.sin(a) * 0.18], [Math.cos(a) * 0.33, y0 + 0.005, Math.sin(a) * 0.33], 0.025, 0.02, { round: true, seg: 4 }); }
      }
    },
  };
  // The hedge a pod grows: w (across, local x) × h × d, origin at its base centre, no colliders (the engine's block is
  // the size + 2 cm). A dense clipped boxwood wall: a flat top (the owner's ink is drawn on the block's faces), leafy
  // clumps flush with the faces (the look stays within a few cm of the box, a little deeper than the 0.9 m planter it
  // bursts from). o.tint (THREE.Color: the grower's ink): a light touch in the leaves ('foliage', the engine adds a
  // faint sheen); the full colour in its blossoms ('gloss', a stronger sheen); the stems ('wood') never glow.
  D.treehills_hedge = {
    desc: 'grown sprout hedge (w × h × d from `size`, origin at its base centre, tinted by `tint`; no colliders)',
    params: { size: '[w, h, d] (m)', tint: 'owner team colour (optional)' },
    build(B, o) {
      const [w0, h, d0] = o.size || [o.w ?? 3, o.h ?? 1.8, o.d ?? 0.9];
      const w = w0 + 0.03, d = d0 + 0.04, t = o.tint ?? null, s = o.seed ?? 21;
      // tinted: the leaves keep their green with a touch of the owner's colour; its blossoms carry the colour itself
      const leaf = t ? mixc('#b4dc98', t, 0.2) : col(K.leafMid);
      const leafDk = t ? mixc('#86b36d', t, 0.16) : col('#86b36d');
      const bloom = t ? mixc(t, '#ffffff', 0.12) : null;
      // the clipped body (flat top) just inside the faces, and a darker skirt of stems at the base
      B.box('foliage', mixc(leafDk, leaf, 0.35), w - 0.05, h - 0.03, d - 0.05, 0, (h - 0.03) / 2, 0, { round: true, r: 0.06 });
      pbox(B, NS('wood'), '#6b5a3e', w - 0.3, 0.12, d - 0.2, 0, 0.06, 0);
      // leafy clumps on both faces and the ends (a jittered grid, random sizes, lighter toward the top), each one flush:
      // its outer side ≤ ~3 cm past the face; sprigs along the top edges (≤ 4 cm over the top)
      const rnd = (i) => hash(s * 1.37 + i * 0.731);
      let q = 0;
      const clumps = (nx, ny, place) => {
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const u = (i + 0.2 + 0.6 * rnd(q++)) / nx, v = (j + 0.2 + 0.6 * rnd(q++)) / ny, r = 0.15 + 0.12 * rnd(q++);
          const c = mixc(leafDk, leaf, Math.min(1, 0.25 + v * 0.6 + 0.3 * rnd(q++)));
          place(u, v, r, c, (i * 7 + j) % 6);
        }
      };
      const flat = 0.09;
      for (const sz of [-1, 1]) clumps(Math.max(3, Math.round(w / 0.4)), Math.max(2, Math.round(h / 0.42)), (u, v, r, c, k) =>
        B.add('foliage', puff(0, k), c, -w / 2 + r * 0.9 + u * (w - r * 1.8), 0.1 + r * 0.8 + v * (h - r * 1.8 - 0.14), sz * (d / 2 - flat * 0.7), { sx: r, sy: r * 0.92, sz: flat, ry: (rnd(q++) - 0.5) * 0.4 }));
      for (const sx of [-1, 1]) clumps(Math.max(2, Math.round(d / 0.36)), Math.max(2, Math.round(h / 0.42)), (u, v, r, c, k) =>
        B.add('foliage', puff(0, k), c, sx * (w / 2 - flat * 0.7), 0.1 + r * 0.8 + v * (h - r * 1.8 - 0.14), -d / 2 + r * 0.8 + u * (d - r * 1.6), { sx: flat, sy: r * 0.92, sz: r }));
      const ns = Math.round(w / 0.28);
      for (const sz of [-1, 1]) for (let i = 0; i < ns; i++) {
        const x = -w / 2 + 0.15 + ((i + rnd(q++)) / ns) * (w - 0.3), r = 0.09 + 0.06 * rnd(q++);
        B.add('foliage', puff(0, i % 6), leaf, x, h - 0.02, sz * (d / 2 - 0.06), { sx: r * 1.3, sy: 0.05, sz: r * 0.7 });
      }
      // blossoms in little clusters on the faces (the owner's colour when tinted; mixed flowers otherwise)
      const nb = Math.round(w * h * (t ? 4.2 : 2.2));
      for (let i = 0; i < nb; i++) {
        const side = rnd(q++) < 0.5 ? -1 : 1, x = (rnd(q++) - 0.5) * (w - 0.3), y = 0.35 + rnd(q++) * (h - 0.55);
        const c = bloom ?? K.flowers[i % K.flowers.length];
        for (let k = 0; k < 3; k++) B.add('gloss', blob(0, (i + k) % 8), c, x + (k - 1) * 0.07, y + (k % 2) * 0.06, side * (d / 2 + 0.015), { s: 0.05 + 0.025 * rnd(q++), sz: 0.03, ao: false });
      }
    },
  };
}
