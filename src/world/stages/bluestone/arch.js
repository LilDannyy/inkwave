// Bluestone Junction — the architecture's dressing (owner: the bluestone stage): the city over the blockout's level blocks,
// in three looks. Every builder here is visual only (no colliders): it dresses an off-limits block (`roof`, never inked) a
// few centimetres proud, or stands where nobody walks (roof lines, over the drum, behind the parapets). Inkable faces at eye
// level keep their look in the level shader (levelart.js); props on them stay within 8.5 cm of the face. Builders work in
// Alpha's world frame (placed at the origin, turned 180° for Bravo by the placement mirror) unless they say otherwise.
// An ERA builder takes o.era (1 | 2 | 3) and its placement carries the same `eras`: the era engine buckets it per era mask
// and the front swaps it as it passes (≤ 5 materials per era mask, ENGINE rule 40: metal, gloss, wood, rubber, glow).
//
//   cornices    (shared) the roof lines: moulded cornices with dentils on the GPO and the Young & Jackfish, a coped
//               parapet on the bluestone buildings, the GPO's balustraded parapet and its corner clock (DESIGN §8.3: the
//               clock on the parapet, under the dome's line)
//   station     (shared) the station's eight columns' capitals and bases, the iron arches between them under the drum,
//               the drum's cornice and pilasters, the clock beam's brackets
//   dome        (era) a fresh copper dome with gilt ribs (1880s), weathered verdigris (TODAY), white ceramic under a lattice
//               of light (3000s)
//   drumletters (era) FLOUNDERS STREET STATION round the drum's three faces toward each team: gilt on green (1880s), gold
//               lit at dusk (TODAY), letters of light (3000s)
//   clockfaces  (era) the row of five clocks over the Clock Steps: timber cases with Roman numerals (1880s), lit from
//               behind (TODAY), rings of light (3000s); the destination plates under them (shared names)
//   signs       (era) the buildings' words: the GPO, the hotel, the Royal Arcade, the Customs House, the Engine House,
//               the Boathouse, per era
//   rooftops    (era) DESIGN §5.2's superstructures on the Z (set back, above play, no colliders): today's glass and the
//               3000s' spires, shells and farms; the arcade's ROYAL ARCADE frame / planted pergola; the chimney's café
//               sign / light beam
export function registerArch(D, H, KIT) {
  const { K, pbox, cyl, cylGeo, latheG, sphG, torG, strut, rod, letters, textW, roundel, HP, PI, TAU } = KIT;
  const DEG = Math.PI / 180;
  // a frame on a face: origin (x, y, z), local +z along the outward normal (nx, nz), local +x to the right as seen from outside
  const face = (B, x, y, z, nx, nz, fn) => { B.push(x, y, z, Math.atan2(nx, nz)); fn(); B.pop(); };
  const OCT = (r, k) => { const a = (k * 45) * DEG; return [Math.sin(a) * r, Math.cos(a) * r]; };   // octagon face centre at bearing k·45°

  // ============================================================================================================ cornices
  // one moulded run along local x (length L) at the top of a face, projecting toward +z: frieze, bed moulding, dentils,
  // corona, cymatium (style 'classic'), or a plain coping (style 'cope')
  function corniceRun(B, L, style, c, c2) {
    if (style === 'cope') {
      pbox(B, 'metal', c, L + 0.24, 0.16, 0.24, 0, 0.08, 0.06);
      pbox(B, 'metal', c2, L + 0.12, 0.08, 0.1, 0, -0.06, 0.04);
      return;
    }
    pbox(B, 'gloss', c2, L, 0.34, 0.05, 0, -0.42, 0.025);                 // frieze
    pbox(B, 'gloss', c, L + 0.08, 0.08, 0.14, 0, -0.21, 0.07);            // bed moulding
    const n = Math.floor(L / 0.24);
    for (let i = 0; i < n; i++) pbox(B, 'gloss', c, 0.09, 0.1, 0.1, -L / 2 + 0.12 + i * (L - 0.24) / Math.max(1, n - 1), -0.12, 0.17);   // dentils
    pbox(B, 'gloss', c, L + 0.36, 0.12, 0.34, 0, -0.01, 0.17);            // corona
    pbox(B, 'gloss', c2, L + 0.44, 0.06, 0.4, 0, 0.08, 0.2);              // cymatium
  }
  D.bluestone_cornices = {
    desc: "the roof lines of Alpha's buildings (world frame)",
    build(B) {
      // [x0, x1, z0, z1, top, style, colour, faces (+x, −x, +z, −z)]
      const runs = [
        [-16, -9.5, -46, -42, 6.0, 'classic', K.sandLt, K.sand, [1, 1, 1, 1]],          // the GPO
        [-14, -9.5, -22.5, -18.5, 9.0, 'classic', K.sandLt, K.render, [0, 0, 1, 1]],    // the hotel
        [-17, -14, -22.5, -18.5, 9.0, 'classic', K.sandLt, K.render, [0, 1, 1, 1]],     //   its oriel
        [-9.5, -3.5, -22.5, -18.5, 9.0, 'classic', K.sandLt, K.render, [1, 0, 1, 1]],   //   its east wing over the arch
        [-33, -26, -12, -2, 9.0, 'cope', K.blueLt, K.blue, [1, 1, 1, 1]],               // the Customs House
        [-31, -12, -76, -70, 9.0, 'cope', K.blueLt, K.blue, [0, 0, 1, 0]],              // the Engine House
        [-37, -31, -76, -60, 6.0, 'cope', K.blueLt, K.blue, [1, 0, 1, 0]],              // the boiler house
        [-12, -6, -76, -60, 6.0, 'cope', K.blueLt, K.blue, [0, 1, 1, 0]],               // the tram shed
        [-31, -26, -42, -28, 6.3, 'cope', K.sandLt, K.sand, [1, 1, 1, 1]],              // the arcade's walls under the vault
      ];
      for (const [x0, x1, z0, z1, top, style, c, c2, f] of runs) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        if (f[0]) face(B, x1, top, cz, 1, 0, () => corniceRun(B, z1 - z0, style, c, c2));
        if (f[1]) face(B, x0, top, cz, -1, 0, () => corniceRun(B, z1 - z0, style, c, c2));
        if (f[2]) face(B, cx, top, z1, 0, 1, () => corniceRun(B, x1 - x0, style, c, c2));
        if (f[3]) face(B, cx, top, z0, 0, -1, () => corniceRun(B, x1 - x0, style, c, c2));
      }
      // the GPO's balustraded parapet (over its cornice) and its corner clock on the parapet at the Swimston corner
      const balus = (L) => { pbox(B, 'gloss', K.sandLt, L, 0.12, 0.3, 0, 0.88, 0); pbox(B, 'gloss', K.sand, L, 0.1, 0.32, 0, 0.08, 0);
        for (let x = -L / 2 + 0.2; x <= L / 2 - 0.19; x += 0.28) B.lathe('gloss', K.sandLt, [[0.07, 0.13], [0.09, 0.2], [0.05, 0.36], [0.08, 0.55], [0.06, 0.72], [0.08, 0.82]], x, 0, 0, { seg: 8 }); };
      face(B, -16, 6.1, -44, -1, 0, () => balus(4.0));
      face(B, -12.75, 6.1, -46, 0, -1, () => balus(6.5));
      face(B, -9.5, 6.1, -44, 1, 0, () => balus(4.0));
      face(B, -12.75, 6.1, -42, 0, 1, () => balus(6.5));
      // the clock on its plinth at the GPO's north-west corner (faces west up Swimston and north to the circus)
      pbox(B, 'gloss', K.sand, 1.4, 1.5, 1.4, -15.3, 6.85, -42.7);
      pbox(B, 'gloss', K.sandLt, 1.6, 0.14, 1.6, -15.3, 7.66, -42.7);
      B.lathe('metal', K.verdigris, [[0.9, 7.7], [0.9, 7.8], [0.0, 8.7]], -15.3, 0, -42.7, { seg: 4, ry: PI / 4 });
      for (const [nx, nz] of [[-1, 0], [0, 1]]) face(B, -15.3 + nx * 0.71, 6.95, -42.7 + nz * 0.71, nx, nz, () => {
        B.add('metal', torG(0.52, 0.05, 6, 24), K.brass, 0, 0, 0.02, {});
        B.add('gloss', cylGeo(0.5, 0.5, 0.03, 24), K.cream, 0, 0, 0.01, { rx: HP });
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; pbox(B, 'metal', K.black, 0.03, k % 3 ? 0.06 : 0.11, 0.01, Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.03, { rz: -a }); }
        pbox(B, 'metal', K.black, 0.035, 0.3, 0.01, 0.08, 0.1, 0.04, { rz: -0.9 });
        pbox(B, 'metal', K.black, 0.03, 0.4, 0.01, -0.02, -0.18, 0.045, { rz: 0.2 });
      });
      // the hotel's parapet: a pediment over the north face with the date (1868) and urns on the corners
      face(B, -11.75, 9.0, -18.5, 0, 1, () => {
        for (let i = 0; i < 9; i++) { const t = i / 8; pbox(B, 'gloss', K.sandLt, 3.4 * (1 - t) + 0.2, 0.1, 0.22, 0, 0.12 + t * 0.9, 0.0); }
        letters(B, '1868', { h: 0.2, x: 0, y: 0.32, z: 0.12, c: K.sand, dep: 0.03 });
      });
      for (const [x, z] of [[-14, -18.5], [-9.5, -18.5], [-17, -18.5], [-3.5, -18.5]]) B.lathe('gloss', K.sandLt, [[0.0, 9.05], [0.16, 9.08], [0.1, 9.2], [0.22, 9.45], [0.18, 9.62], [0.08, 9.7], [0.0, 9.85]], x, 0, z, { seg: 10 });
    },
  };

  // ============================================================================================================ station
  D.bluestone_station = {
    desc: "the station's shared iron and stone (Alpha's half of it: the four columns on its side, the arches between them)",
    build(B) {
      const COLS = [112.5, 157.5, 202.5, 247.5].map((b) => [Math.sin(b * DEG) * 8.2, Math.cos(b * DEG) * 8.2, b]);
      for (const [x, z] of COLS) {
        // the capital: an iron bell with acanthus collars, under an abacus; the base: a moulded iron foot on the pedestal
        B.lathe('metal', K.iron, [[0.47, 7.35], [0.52, 7.45], [0.6, 7.62], [0.72, 7.78], [0.78, 7.88], [0.0, 7.9]], x, 0, z, { seg: 12 });
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; B.add('metal', sphG(0.09, 6, 4), K.gilt, x + Math.cos(a) * 0.62, 7.68, z + Math.sin(a) * 0.62, {}); }
        pbox(B, 'metal', K.ironLt, 1.12, 0.12, 1.12, x, 7.96, z, { ry: 0 });
        B.lathe('metal', K.iron, [[0.62, 3.3], [0.62, 3.38], [0.55, 3.45], [0.5, 3.6], [0.47, 3.68], [0.0, 3.7]], x, 0, z, { seg: 12 });
      }
      // the iron arches between neighbouring columns (and on to the twin's first column across the x axis): a lattice
      // spandrel under the drum's ring beam, springing at 6.6
      const pairs = [];
      for (let i = 0; i < 3; i++) pairs.push([COLS[i], COLS[i + 1]]);
      pairs.push([COLS[3], [COLS[3][0], -COLS[3][1]]]);   // (the arch across x = −7.58, z −3.14 → +3.14: Alpha builds it, Bravo the one at +7.58)
      for (const [[ax, az], [bx, bz]] of pairs) {
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az) - HP;
        B.push(mx, 0, mz, ry);
        const span = L - 0.9, n = 14;
        let prev = null;
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = -span / 2 + span * t, y = 6.6 + Math.sin(t * PI) * 0.95;
          const p = [x, y, 0];
          if (prev) strut(B, 'metal', K.iron, prev, p, 0.11);
          if (i > 0 && i < n) rod(B, 'metal', K.iron, p, [x, 7.95, 0], 0.025);
          if (i % 2 === 1) B.add('metal', torG(0.16, 0.022, 4, 12), K.ironLt, x, (y + 7.95) / 2, 0, {});
          prev = p;
        }
        strut(B, 'metal', K.iron, [-span / 2, 7.95, 0], [span / 2, 7.95, 0], 0.16);
        B.pop();
      }
      // the drum's cornice and the pilasters at its octagon's corners (shared stone)
      for (let k = 3; k <= 5; k++) {
        const b = k * 45 * DEG, nx = Math.sin(b), nz = Math.cos(b);
        face(B, nx * 8.13, 10.0, nz * 8.13, nx, nz, () => { pbox(B, 'gloss', K.sandLt, 6.9, 0.16, 0.32, 0, 0.0, 0.12); pbox(B, 'gloss', K.sand, 6.8, 0.1, 0.18, 0, -0.14, 0.07); pbox(B, 'gloss', K.sandLt, 6.9, 0.12, 0.2, 0, -1.96, 0.09); });
      }
      for (const k of [2.5, 3.5, 4.5, 5.5]) {
        const b = k * 45 * DEG, r = 8.13 / Math.cos(22.5 * DEG);
        pbox(B, 'gloss', K.sandLt, 0.42, 2.0, 0.42, Math.sin(b) * r, 9.0, Math.cos(b) * r, { ry: b });
      }
      // the clock beam's iron brackets back to the columns, and the gilt finial balls on the beam's ends
      for (const s of [-1, 1]) { strut(B, 'metal', K.iron, [s * 3.1, 6.0, -7.58], [s * 3.14, 7.2, -7.58], 0.12); B.add('metal', sphG(0.12, 8, 6), K.gilt, s * 3.15, 6.7, -7.58, {}); }
    },
  };

  // ============================================================================================================ dome (era)
  D.bluestone_domeera = {
    desc: 'the station dome in one era (o.era): copper / verdigris / white ceramic',
    build(B, o) {
      const e = o.era || 1, CU = e === 1 ? K.copper : e === 2 ? K.verdigris : K.pearl, RIB = e === 1 ? K.gilt : e === 2 ? K.verdigrisDk : K.wg;
      const mat = e === 3 ? 'gloss' : 'metal';
      B.lathe(mat, CU, [[7.05, 9.98], [7.05, 10.5], [6.85, 11.3], [6.3, 12.3], [5.4, 13.3], [4.1, 14.2], [2.6, 14.85], [1.4, 15.1], [0, 15.12]], 0, 0, 0, { seg: 32 });
      // the ribs
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * TAU, pts = [[7.08, 10.4], [6.88, 11.3], [6.33, 12.3], [5.43, 13.3], [4.13, 14.2], [2.63, 14.85], [1.42, 15.1]];
        for (let i = 0; i < pts.length - 1; i++) strut(B, e === 3 ? 'glow' : 'metal', RIB, [Math.cos(a) * pts[i][0], pts[i][1], Math.sin(a) * pts[i][0]], [Math.cos(a) * pts[i + 1][0], pts[i + 1][1], Math.sin(a) * pts[i + 1][0]], e === 3 ? 0.08 : 0.12);
      }
      // the lantern (stone 1880s / TODAY, glass and light in the 3000s) and its cupola and finial
      B.cyl(e === 3 ? 'gloss' : 'metal', e === 3 ? K.pearlDk : K.sandLt, 1.75, 2.4, 0, 16.2, 0, { seg: 8 });
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + PI / 8; B.box(e === 3 ? 'glow' : 'metal', e === 3 ? K.wg : K.black, 0.5, 1.2, 0.05, Math.cos(a) * 1.72, 16.3, Math.sin(a) * 1.72, { ry: -a + HP, glow: e === 3 ? 1.2 : undefined }); }
      B.lathe(mat, CU, [[1.95, 17.4], [1.95, 17.6], [1.3, 18.4], [0.45, 19.0], [0, 19.05]], 0, 0, 0, { seg: 16 });
      B.add('metal', sphG(0.28, 10, 8), e === 3 ? K.wg : K.gilt, 0, 19.3, 0, {});
      B.cyl('metal', e === 3 ? K.wg : K.gilt, 0.05, 1.4, 0, 20.1, 0);
      if (e === 3) {
        // the lattice of light rising to 22 m over the old drum (DESIGN §5.1)
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + PI / 8; B.box('glow', K.wg, 0.14, 7.5, 0.14, Math.cos(a) * 6.2, 15.6, Math.sin(a) * 6.2, { rz: Math.cos(a) * 0.55, rx: -Math.sin(a) * 0.55, glow: 1.3 }); }
        B.add('glow', torG(2.4, 0.08, 4, 32), K.wg, 0, 21.9, 0, { rx: HP, glow: 1.4 });
        B.add('glow', torG(7.4, 0.07, 4, 48), K.wg, 0, 10.6, 0, { rx: HP, glow: 1.2 });
      }
    },
  };

  // ============================================================================================================ drum letters (era)
  D.bluestone_drumletters = {
    desc: "FLOUNDERS STREET STATION on the drum's three faces toward Alpha, in one era's lettering (o.era)",
    build(B, o) {
      const e = o.era || 1;
      const words = [['FLOUNDERS', 3], ['STREET', 4], ['STATION', 5]];   // SE, S, SW faces (left to right from outside)
      for (const [w, k] of words) {
        const b = k * 45 * DEG, nx = Math.sin(b), nz = Math.cos(b);
        face(B, nx * 8.13, 8.78, nz * 8.13, nx, nz, () => {
          if (e === 1) letters(B, w, { h: 0.5, y: 0, z: 0.05, c: K.gilt, dep: 0.05, wt: 0.2, track: 0.16, mat: 'metal' });
          else if (e === 2) { letters(B, w, { h: 0.52, y: 0, z: 0.05, c: K.giltLt, dep: 0.06, wt: 0.17, track: 0.14, mat: 'metal' }); letters(B, w, { h: 0.52, y: 0, z: 0.012, c: K.litWarm, flat: true, wt: 0.22, track: 0.14 * 0.52 / 0.52, lit: true, glow: 0.6, mat: 'glow' }); }
          else letters(B, w, { h: 0.48, y: 0.02, z: 0.04, c: K.wgLit, dep: 0.02, wt: 0.12, track: 0.2, lit: true, glow: 1.6 });
        });
      }
    },
  };

  // ============================================================================================================ clock faces (era)
  D.bluestone_clockfaces = {
    desc: 'the five clocks over the Clock Steps, both faces, in one era (o.era); the hands are the era engine\'s',
    build(B, o) {
      const e = o.era || 1, N = ['XII', 'III', 'VI', 'IX'];
      for (const x of [-2.48, -1.24, 0, 1.24, 2.48]) for (const s of [-1, 1]) {
        B.push(x, 5.95, s * 0.3, s < 0 ? PI : 0);
        if (e === 1) {
          // a timber case with a moulded hood, a cream dial with Roman numerals at the quarters and the minute track
          B.box('wood', K.timber, 1.22, 1.22, 0.1, 0, 0, -0.02, { r: 0.04 });
          B.box('wood', K.timberLt, 1.32, 0.12, 0.16, 0, 0.66, -0.01, { r: 0.03 });
          B.add('gloss', cylGeo(0.5, 0.5, 0.03, 24), K.cream, 0, 0, 0.04, { rx: HP });
          B.add('metal', torG(0.51, 0.025, 4, 24), K.gilt, 0, 0, 0.05, {});
          N.forEach((t, i) => { const a = (i / 4) * TAU; letters(B, t, { h: 0.09, x: Math.sin(a) * 0.36, y: Math.cos(a) * 0.36 - 0.045, z: 0.058, c: K.black, flat: true, wt: 0.2, track: 0.05, mat: 'metal' }); });
          for (let k = 0; k < 12; k++) if (k % 3) { const a = (k / 12) * TAU; B.box('metal', K.black, 0.025, 0.06, 0.01, Math.sin(a) * 0.4, Math.cos(a) * 0.4, 0.058, { rz: -a }); }
        } else if (e === 2) {
          // TODAY: the famous row lit from behind — a dark metal case, an opal dial that glows at dusk, gilt batons
          B.box('metal', K.black, 1.2, 1.2, 0.1, 0, 0, -0.02, { r: 0.05 });
          B.add('glow', cylGeo(0.5, 0.5, 0.03, 28), K.lit, 0, 0, 0.04, { rx: HP, glow: 0.95 });
          B.add('metal', torG(0.52, 0.03, 4, 28), K.gilt, 0, 0, 0.05, {});
          for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; B.box('metal', K.black, 0.03, k % 3 ? 0.07 : 0.13, 0.01, Math.sin(a) * 0.39, Math.cos(a) * 0.39, 0.058, { rz: -a }); }
        } else {
          // the 3000s: rings of light, the hour marks as points of light
          B.add('glow', torG(0.5, 0.035, 4, 32), K.wg, 0, 0, 0.02, { glow: 1.5 });
          B.add('glow', torG(0.3, 0.015, 4, 24), K.wg, 0, 0, 0.02, { glow: 1.1 });
          for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; B.add('glow', sphG(k % 3 ? 0.025 : 0.045, 6, 4), K.wgLit, Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.03, { glow: 1.6 }); }
          B.add('gloss', cylGeo(0.48, 0.48, 0.02, 28), K.pearlDk, 0, 0, -0.01, { rx: HP });
        }
        B.pop();
      }
    },
  };
  // the destination plates under the clocks (shared: the same names in every era)
  D.bluestone_destplates = {
    desc: "the destination plates under the clock row on Alpha's face",
    build(B) {
      const names = ['INKOPOLIS', 'THE CAPE', 'SALTWATER', 'NORTH QUAY', 'KELP HILL'];
      [-2.48, -1.24, 0, 1.24, 2.48].forEach((x, i) => face(B, x, 5.08, -7.88, 0, -1, () => {
        B.box('gloss', K.enamel, 1.14, 0.2, 0.03, 0, 0, 0, { r: 0.01 });
        letters(B, names[i], { h: 0.09, y: -0.045, z: 0.018, c: K.enamelW, flat: true, wt: 0.2, track: 0.1, mat: 'gloss' });
      }));
    },
  };

  // ============================================================================================================ signs (era)
  // the buildings' words, each era's: o.era picks the set
  D.bluestone_signs = {
    desc: "the buildings' signs in one era (o.era), Alpha's frame",
    build(B, o) {
      const e = o.era || 1;
      // a run of raised letters on a face (gilt / gold / light by era) with an optional backing board
      const say = (x, y, z, nx, nz, text, h, opt = {}) => face(B, x, y, z, nx, nz, () => {
        const w = textW(text, opt.wt ?? 0.18, opt.track ?? 0.14) * h;
        if (opt.board) B.box(e === 3 ? 'gloss' : 'wood', opt.board, w + h * 1.2, h * 1.8, 0.05, 0, h * 0.5, 0.025, { r: 0.02 });
        if (opt.border && e !== 3) for (const yy of [-h * 0.42, h * 1.42]) B.box('metal', K.gilt, w + h * 1.2, 0.035, 0.06, 0, yy, 0.04);
        const zz = opt.board ? 0.055 : 0.03;
        if (e === 3) letters(B, text, { h, y: 0, z: zz, c: K.wgLit, dep: 0.015, wt: 0.12, track: (opt.track ?? 0.14) + 0.05, lit: true, glow: 1.5 });
        else letters(B, text, { h, y: 0, z: zz, c: e === 1 ? K.gilt : (opt.c2 ?? K.giltLt), dep: 0.04, wt: opt.wt ?? 0.18, track: opt.track ?? 0.14, mat: 'metal' });
      });
      // the GPO: the frieze words on its Swimston and Customs Lane faces (the roof block: 3–6 m)
      say(-16, 4.35, -44, -1, 0, e === 1 ? 'POST OFFICE' : e === 2 ? 'GPO' : 'GPO', e === 2 ? 0.55 : 0.36);
      say(-12.75, 4.35, -46, 0, -1, e === 1 ? 'GENERAL POST OFFICE' : e === 2 ? 'GPO · SHOPS' : 'THE G.P.O. GARDENS', 0.32);
      say(-12.75, 4.35, -42, 0, 1, e === 1 ? 'G.P.O.' : e === 2 ? 'GPO' : 'GPO', 0.42);
      // the Young & Jackfish: the hotel's name across its north face over the balcony and on the oriel over Swimston
      say(-11.75, 6.55, -18.5, 0, 1, e === 1 ? 'YOUNG & JACKFISH' : e === 2 ? 'YOUNG & JACKFISH' : 'YOUNG & JACKFISH', 0.34, { board: e === 2 ? K.green : undefined, border: e === 2 });
      say(-11.75, 7.4, -18.5, 0, 1, e === 1 ? 'HOTEL' : e === 2 ? 'HOTEL' : 'SKY HOTEL', 0.5);
      say(-15.5, 7.2, -18.5, 0, 1, e === 1 ? 'ALES' : e === 2 ? 'BAR' : 'BAR', 0.3);
      say(-17, 6.1, -20.5, -1, 0, 'HOTEL', 0.42);
      // the Royal Arcade: over each mouth, and its name along the Swimston face's parapet
      say(-28.5, 4.15, -28, 0, 1, e === 1 ? 'OPENING 1889' : 'ROYAL ARCADE', e === 1 ? 0.34 : 0.4, { board: e === 1 ? K.timber : undefined });
      say(-28.5, 4.15, -42, 0, -1, e === 1 ? 'OPENING 1889' : 'ROYAL ARCADE', e === 1 ? 0.34 : 0.4, { board: e === 1 ? K.timber : undefined });
      say(-26, 4.7, -35, 1, 0, e === 1 ? 'THE ROYAL ARCADE' : e === 2 ? 'THE ROYAL ARCADE' : 'ROYAL ARCADE', 0.42);
      // the Customs House: on its circus face and its cab-rank face
      say(-26, 6.6, -7, 1, 0, e === 1 ? 'H.M. CUSTOMS' : e === 2 ? 'CUSTOMS HOUSE' : 'FARM 03', 0.42);
      say(-26, 5.9, -7, 1, 0, e === 1 ? 'BONDED' : e === 2 ? 'GALLERY · LOFTS' : 'VERTICAL FARM', 0.26);
      say(-29.5, 6.6, -12, 0, -1, e === 1 ? 'H.M. CUSTOMS' : e === 2 ? 'CUSTOMS HOUSE' : 'FARM 03', 0.38);
      // the Engine House: its name over the spawn deck (the band the level art draws at 6.6 m)
      say(-21.5, 6.45, -70, 0, 1, e === 1 ? 'CABLE TRAMWAY ENGINE HOUSE' : e === 2 ? 'TRAM MUSEUM · DEPOT' : 'FLOAT-TRAM DOCK', 0.46);
      say(-21.5, 8.1, -70, 0, 1, e === 1 ? '1885' : e === 2 ? 'EST. 1885' : '1885 · 3001', 0.3);
      // the boiler house and the tram shed
      say(-34, 4.4, -60, 0, 1, e === 1 ? 'BOILERS' : e === 2 ? 'WORKSHOPS' : 'POWER', 0.34);
      say(-9, 4.4, -60, 0, 1, e === 1 ? 'TRAM SHED' : e === 2 ? 'DEPOT' : 'DOCK 1', 0.34);
      // the Boathouse: its club board on the north face toward the ring
      say(18, 1.45, -12, 0, 1, e === 1 ? 'ROWING CLUB' : e === 2 ? 'BOATHOUSE CAFE' : 'TIDE PAVILION', 0.28, { board: e === 1 ? K.green : e === 2 ? K.cream : undefined, c2: K.green });
    },
  };

  // ============================================================================================================ rooftops (era)
  // DESIGN §5.2's rooftop superstructures on the Z: no colliders, above play; nothing on the GPO (the spawn's dome line)
  D.bluestone_rooftops = {
    desc: "the era's rooftop superstructures over Alpha's buildings (o.era 2 / 3)",
    build(B, o) {
      const e = o.era || 2;
      if (e === 2) {
        // the arcade's rooftop signage frame (6.3 → 8)
        B.push(-28.5, 6.3, -28.6, 0);
        for (const s of [-1, 1]) pbox(B, 'metal', K.aluDk, 0.08, 1.8, 0.08, s * 2.1, 0.9, 0);
        pbox(B, 'metal', K.aluDk, 4.4, 0.08, 0.08, 0, 1.75, 0);
        letters(B, 'ROYAL ARCADE', { h: 0.42, y: 0.9, z: 0.05, c: K.giltLt, dep: 0.05, wt: 0.17, track: 0.12, mat: 'metal' });
        B.pop();
        // the catenary gantries over the viaduct (4.4 → 9): the railyard's wires beyond the lane
        for (const z of [-46, -34, -22]) { pbox(B, 'metal', K.aluDk, 0.18, 4.6, 0.18, -37.6, 6.4, z); pbox(B, 'metal', K.aluDk, 0.12, 0.14, 6.0, -37.6, 8.6, z, { ry: HP }); }
        // a big screen on the Customs House's apron face (showing the city's weather: a dark panel with a lit border)
        face(B, -29.5, 5.6, -2, 0, 1, () => { B.box('metal', K.black, 4.2, 2.4, 0.12, 0, 0, 0.06, { r: 0.03 }); B.box('glow', K.lit, 4.0, 0.05, 0.02, 0, 1.12, 0.13, { glow: 0.8 }); });
      } else {
        // the arcade's planted pergola of light over the vault (6.3 → 9)
        for (let i = 0; i < 6; i++) { const z = -41 + i * 2.6; B.add('glow', torG(2.6, 0.06, 4, 24, PI), K.wg, -28.5, 6.4, z, { glow: 1.1 }); }
        for (let i = 0; i < 18; i++) B.add('rubber', sphG(0.32 + 0.1 * (i % 3), 7, 5), i % 2 ? K.leaf : K.leafLt, -28.5 + Math.sin(i * 1.7) * 2.3, 6.4 + Math.abs(Math.cos(i * 1.7)) * 2.0, -41 + i * 0.75, {});
        // the maglev guideway on the viaduct's far side (4.4 → 7): a clear tube on pylons
        for (const z of [-48, -36, -24, -14]) pbox(B, 'gloss', K.pearl, 0.4, 2.6, 0.4, -39.0, 5.6, z);
        B.add('gloss', cylGeo(1.1, 1.1, 38, 16, true), K.pearlDk, -39.0, 7.4, -31, { rx: HP });
        B.add('glow', cylGeo(0.06, 0.06, 38, 6), K.wg, -39.0, 6.4, -31, { rx: HP, glow: 1.2 });
        // the Customs House's sky-bridge (underside 12) toward the knee's far side, and its vertical farm's louvres
        // (fix round 2: from the vertical farm's north face, props.js bluestone_farmtower — its louvres and planting there now)
        B.push(-29.5, 12.0, -3.85, 0);
        pbox(B, 'gloss', K.pearl, 2.6, 0.3, 10.85, 0, 0.15, 5.425);
        for (const s of [-1, 1]) pbox(B, 'gloss', K.glassLt, 0.06, 1.6, 10.85, s * 1.25, 1.1, 5.425);
        B.add('glow', cylGeo(0.04, 0.04, 10.85, 6), K.wg, 0, 0.02, 5.425, { rx: HP, glow: 1.2 });
        B.pop();
        // the chimney's beam of light (DESIGN §5.1: the float-tram dock's beacon)
        B.add('glow', cylGeo(0.35, 0.6, 40, 12, true), K.wg, -29, 44, -73, { glow: 0.9 });
        B.add('glow', torG(1.3, 0.08, 4, 20), K.wg, -29, 24.3, -73, { rx: HP, glow: 1.4 });
      }
    },
  };
}
