// Spirhalite Islands — the ruins: the Great Arch over the central sandbar, the cascade pillars' drums and bulb, the
// causeway's posts and fallen slabs, loose blocks and shore rocks. (Prop builders; see props.js for the contract.)
export const ARCH = { leg: 25.35, rotY: Math.atan2(4.2, 25), y0: -3.5, rise: 17.25 };   // legs at world (±25, ∓4.2)

export function registerRuins(D, H, X) {
  const { THREE, K, PI, TAU, HP, NS, GB, meshGeo, tpl, pbox, colBox, ROOF, RAIL, noise3, fbm3, rng, lerp, clamp, sweep, rockGeo, col3 } = X;
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ============================================================================================== the Great Arch
  // A colossal weathered sea arch spanning the central sandbar: an elliptical rib (crown intrados ≈ 11.3 m) swept with a
  // lumpy, superelliptic section that flares at the legs, rock strata in the vertex colour, moss on its back, a dark
  // wet underside where it drips, algae + barnacle band at the sea. Legs stand in the sea past the spits' tips.
  function archGeo() {
    const XL = ARCH.leg, Y0 = ARCH.y0, BR = ARCH.rise;
    const cStone = col3(K.stone), cDk = col3(K.stoneDk), cLt = col3(K.stoneLt), cWet = col3(K.stoneWet), cAlg = col3(K.algae), cMoss = col3(K.moss), cMossDk = col3(K.mossDk);
    const tmp = new THREE.Color();
    // centreline: a flattened ellipse (a broad deck, steep legs)
    const cl = (t) => { const th = (t - 0.5) * PI, c = Math.cos(th); return [XL * Math.sin(th), Y0 + BR * Math.sign(c) * Math.pow(Math.abs(c), 0.62)]; };
    const frame = (t) => {
      const [x, y] = cl(t), e = 1e-3, [xa, ya] = cl(Math.max(0, t - e)), [xb, yb] = cl(Math.min(1, t + e));
      let tx = xb - xa, ty = yb - ya; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      let nx = -ty, ny = tx; if (ny < 0 || (Math.abs(ny) < 1e-4 && nx * x < 0)) { nx = -nx; ny = -ny; }   // outward
      if (x * nx < -1e-6 && ny < 0.2) { nx = -nx; ny = -ny; }
      return { p: [x, y, 0], n: [nx, ny, 0], b: [0, 0, 1], s: Math.abs(x) / XL };
    };
    const NK = 36;
    // stratified weathering: ledges every ~1.15 m (each stratum bulges at its top, undercut below), big lumps, joints
    const strata = (y, x, z) => { const f = (y + 0.35 * fbm3(x * 0.08, 0.3, z * 0.08, 2)) / 1.15; const fr = f - Math.floor(f); return 0.42 * sm(0.0, 0.8, fr) - 0.2 * sm(0.85, 1.0, fr); };
    const joint = (x, y, z) => { const q = x * 0.31 + 0.9 * noise3(y * 0.2, x * 0.05, z * 0.3); const fr = q - Math.floor(q); return -0.35 * (1 - sm(0.0, 0.07, Math.abs(fr - 0.5))); };
    const ring = (t, k) => {
      const f = frame(t), s = f.s, s3 = s * s * s;
      const hh = 2.3 + 1.8 * s3 + 0.9 * sm(0.9, 1, s), hd = 3.1 + 0.9 * s3 + 0.7 * sm(0.9, 1, s);
      const ph = (k / NK) * TAU, c = Math.cos(ph), sn = Math.sin(ph), q = 2 / 4.2;
      const u0 = hh * Math.sign(c) * Math.pow(Math.abs(c), q), v0 = hd * Math.sign(sn) * Math.pow(Math.abs(sn), q);
      const x = f.p[0] + f.n[0] * u0, y = f.p[1] + f.n[1] * u0, z = v0;
      const d = 0.8 * fbm3(x * 0.11 + 7, y * 0.11, z * 0.11, 3) + strata(y, x, z) * (1 - 0.75 * s3) + joint(x, y, z) + 0.12 * noise3(x * 0.9, y * 0.9, z * 0.9) + 0.45 * s3 * fbm3(x * 0.3, y * 0.18, z * 0.3 + 5, 2);
      const r = Math.hypot(u0, v0) || 1;
      return [u0 + (u0 / r) * d, v0 + (v0 / r) * d];
    };
    const colour = (x, y, z, t, k) => {
      const f = frame(t), ph = (k / NK) * TAU, up = Math.cos(ph) * f.n[1];
      const fb = (y + 0.35 * fbm3(x * 0.08, 0.3, z * 0.08, 2)) / 1.15, band = fb - Math.floor(fb), layer = Math.floor(fb);
      const tone = ((layer * 7) % 5) / 5;                                             // each stratum its own tone
      tmp.copy(cStone).lerp(tone > 0.5 ? cLt : cDk, Math.abs(tone - 0.5) * 0.7);
      tmp.multiplyScalar(0.95 + 0.1 * noise3(x * 0.45, y * 0.45, z * 0.45) - 0.08 * sm(0.85, 1, band));
      if (up < -0.3) tmp.lerp(cWet, 0.4 * sm(-0.3, -0.9, up));                     // drip-darkened underside
      if (y < 0.5) tmp.lerp(cAlg, 0.55 * sm(0.5, -1.3, y)).lerp(cWet, 0.3 * sm(-0.8, -1.6, y));
      if (up > 0.4) tmp.lerp(noise3(x * 0.35, y * 0.3, z * 0.35) > -0.1 ? cMoss : cMossDk, 0.9 * sm(0.4, 0.75, up));
      return [tmp.r, tmp.g, tmp.b];
    };
    const { pos, idx, col } = sweep(150, NK, frame, ring, colour);
    return meshGeo(pos, idx, col);
  }
  D.spirhalite_arch = {
    desc: 'the Great Arch: a colossal weathered stone sea arch spanning the central sandbar, legs in the sea (roof colliders)',
    params: {}, variants: 1, mount: 'ground',
    build(B) {
      B.add('rubber', tpl('arch', archGeo), 'white', 0, 0, 0, { ao: false });
      // legs: off-limits rock (roof); the rib itself up high (roof boxes inside the mesh, for jetpacks and zipcasters)
      for (const sx of [-1, 1]) {
        colBox(B, sx * ARCH.leg, -2.2, 0, 7.2, 9.5, 6.6, ROOF);
        for (let i = 0; i < 9; i++) {
          const th0 = (i / 9) * (PI / 2) * 0.92, th1 = ((i + 1) / 9) * (PI / 2) * 0.92;
          const x0 = ARCH.leg * Math.sin(th0), x1 = ARCH.leg * Math.sin(th1), y0 = ARCH.y0 + ARCH.rise * Math.cos(th1), y1 = ARCH.y0 + ARCH.rise * Math.cos(th0);
          if (y1 < 6.5) continue;
          B.col(sx > 0 ? x0 : -x1, Math.max(6.2, y0 - 1.6), -2.0, sx > 0 ? x1 : -x0, y1 + 1.6, 2.0, ROOF);
        }
      }
      // rubble round the legs at the waterline
      for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + sx, r = 4.2 + 1.3 * Math.sin(i * 2.7), s = 0.8 + 0.7 * ((i * 37) % 10) / 10;
        B.add('rubber', rockGeo(11 + i + (sx > 0 ? 20 : 0), 1, 1.2, 0.7, 1.0), K.rock, sx * ARCH.leg + Math.cos(a) * r, -1.7, Math.sin(a) * r * 0.9, { s, ry: a, ao: false });
      }
    },
  };

  // ============================================================================================== cascade pillar
  // The column above the pillar's tier (the plinth + tier are level pieces; so is the drum's lowest course, 2.5–4.4 m):
  // three drums narrowing upward with carved collars, a neck, the onion bulb and its finial. The side facing its own
  // base (local −z) is streaked dark and green where the cascade runs down it (the water sheet is backdrop.js).
  function pillarGeo() {
    const prof = [[1.3, 2.4], [1.33, 2.55], [1.31, 3.4], [1.3, 4.25], [1.42, 4.33], [1.47, 4.47], [1.42, 4.6], [1.26, 4.66], [1.13, 4.72], [1.12, 5.5],
      [1.11, 6.2], [1.22, 6.28], [1.29, 6.42], [1.2, 6.52], [0.98, 6.6], [0.96, 7.1], [0.95, 7.62], [1.06, 7.7], [1.03, 7.78], [0.74, 7.9], [0.66, 8.1],
      [0.66, 8.28], [0.86, 8.46], [1.13, 8.7], [1.33, 9.05], [1.38, 9.35], [1.3, 9.7], [1.08, 10.0], [0.72, 10.25], [0.42, 10.42], [0.3, 10.55],
      [0.35, 10.72], [0.3, 10.9], [0.16, 11.08], [0.0, 11.16]];
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40);
    const P = g.attributes.position, n = P.count, col = new Float32Array(n * 3);
    const cS = col3(K.stone), cLt = col3(K.stoneLt), cDk = col3(K.stoneDk), cWet = col3(K.stoneWet), cAlg = col3(K.algae), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = Math.hypot(x, z) || 1;
      const face = -z / r;   // 1 on the cascade side (local −z)
      c.copy(cS).lerp(cLt, 0.35 * sm(0.2, 1, Math.sin(y * 3.1 + x)) ).multiplyScalar(0.94 + 0.1 * noise3(x * 2, y * 2, z * 2));
      if ([4.47, 6.42, 7.7].some((b) => Math.abs(y - b) < 0.12)) c.lerp(cDk, 0.35);
      const wet = sm(0.35, 0.9, face) * sm(11, 9.3, y);
      c.lerp(cWet, 0.55 * wet).lerp(cAlg, 0.35 * wet * (0.5 + 0.5 * noise3(x * 3, y * 1.5, z * 3)));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.deleteAttribute('uv'); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    return g;
  }
  D.spirhalite_pillar = {
    desc: 'the cascade pillar column: drums narrowing upward with carved collars, onion bulb + finial (roof collider above the drum course)',
    params: {}, variants: 1, mount: 'ground',
    build(B) {
      B.add('rubber', tpl('pillar', pillarGeo), 'white', 0, 0, 0, { ao: false });
      // carved glyph panels round the lowest drum (a ring of shallow raised tablets), and spouts under the bulb
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + PI / 8;
        B.push(Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3, a);
        pbox(B, 'rubber', K.stone, 0.46, 0.7, 0.05, 0, 3.0, 0.01);
        B.tor('rubber', K.stoneLt, 0.14, 0.022, 0, 3.4, 0.045, { ts: 12, rs: 4 });
        B.tor('rubber', K.stoneLt, 0.07, 0.018, 0, 3.4, 0.048, { ts: 10, rs: 4 });
        pbox(B, 'rubber', K.stoneLt, 0.3, 0.035, 0.035, 0, 3.12, 0.045);
        B.pop();
      }
      for (const a of [-0.55, 0, 0.55]) {
        B.push(Math.sin(PI + a) * 0.95, 0, Math.cos(PI + a) * 0.95, PI + a);
        B.cyl('rubber', K.stoneDk, 0.13, 0.5, 0, 8.45, 0.18, { rx: HP, seg: 8 });
        B.pop();
      }
      B.col(-0.95, 4.4, -0.95, 0.95, 11.2, 0.95, ROOF);
    },
  };

  // ============================================================================================== causeway
  // Dressing for the level's causeway slab (x0…x1, z0…z1 in the prop frame, pos = the causeway's centre on the sea bed):
  // carved stone posts along both edges (cover: colliders), a worn kerb course along the sides, fallen slabs tilted into
  // the lagoons, rubble at its broken far end.
  D.spirhalite_causeway = {
    desc: 'ancient causeway dressing: carved posts along its edges (colliders), fallen slabs in the water, rubble at the broken end',
    params: { len: 'length along local z (m)', w: 'width (m)', top: 'deck height', posts: 'post positions along z (± sides)' },
    variants: 1, mount: 'ground',
    build(B, o) {
      const L = o.len ?? 18.5, W = o.w ?? 4.2, top = o.top ?? 1.3;
      // posts: [z, side]
      for (const [z, sd] of o.posts || []) {
        const x = sd * (W / 2 - 0.3);
        pbox(B, 'rubber', K.stone, 0.5, 0.95, 0.5, x, top, z);
        B.add('rubber', tpl('postcap', () => new THREE.CylinderGeometry(0.18, 0.3, 0.22, 8)), K.stoneLt, x, top + 1.06, z);
        pbox(B, 'rubber', K.stoneDk, 0.52, 0.08, 0.52, x, top + 0.62, z);
        colBox(B, x, top, z, 0.5, 1.0, 0.5);
      }
      // fallen slabs in the water beside it (tilted, half sunk)
      for (const [z, sd, ry, rz] of o.slabs || []) {
        B.add('rubber', X.boxG(), K.stoneDk, sd * (W / 2 + 1.1), -1.45, z, { sx: 1.8, sy: 0.45, sz: 1.2, ry, rz, ao: false });
      }
      // side kerb course: a projecting string course 0.35 m under the deck edge (shadow line) on both sides
      for (const sd of [-1, 1]) pbox(B, 'rubber', K.stoneDk, 0.14, 0.18, L, sd * (W / 2 + 0.06), top - 0.42, 0);
      for (const [x, z, s] of o.rubble || []) B.add('rubber', rockGeo(71 + Math.round(x * 3 + z), 1, 1.1, 0.6, 0.9), K.stone, x, 0, z, { s });
    },
  };

  // ============================================================================================== loose blocks & rocks
  D.spirhalite_rock = {
    desc: 'a weathered boulder (shore / sea rock); collider unless nocol',
    params: { w: 'size (m)', h: 'height factor', seed: 'shape', nocol: 'no collider', moss: 'mossy top' },
    variants: 1, mount: 'ground',
    build(B, o) {
      const w = o.w ?? 1.2, h = o.h ?? 0.6, seed = o.seed ?? 3;
      B.add('rubber', rockGeo(seed, 1, 1, h, 0.85), o.color ?? K.rock, 0, (o.sink ?? 0.15) * -w, 0, { s: w, ry: seed, ao: false });
      if (o.moss) B.add('foliage', rockGeo(seed + 50, 1, 0.8, h * 0.4, 0.68, 0.2), K.moss, 0, w * h * 0.55, 0, { s: w, ry: seed });
      if (!o.nocol) colBox(B, 0, 0, 0, w * 1.5, w * h * 0.8, w * 1.3);
    },
  };
}
