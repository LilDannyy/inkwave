// Gulper Aquarium — the smaller dressing (owner: the aquarium stage): kiosks, exhibits, the penguins' rockery, the rails
// and the clutter of a working aquarium. Visual only (no colliders), like arch.js: each builder wraps an off-limits
// block a few centimetres proud (pos = the block's foot centre, rotY = the block's turn), or stands where nobody walks.
//   kiosk        a Deco kiosk round a 2.5 m block: a rounded body with a speed-line band, a serving window, a striped
//                awning, a roof cap and its trade on top (ice cream: a giant cone; souvenirs: a plush shark; ferry
//                tickets; the timetable pillar)
//   hut          the penguin keeper's hut (2 × 2, to 3.9) · buckets: the feeding-bucket rack · chute: the feeding chute
//   rock         a faux-Antarctic concrete outcrop (Penguin Point) · coral: a coral sculpture on its plinth · clam
//   helmet       the bronze diving helmet on its bed · lectern: the Tubeway map lectern · touchpool: its rock rim
//   column       the moon-jelly columns' and the bubble column's brass base and cap (the glass and what swims in it:
//                backdrop.js)
//   postbox      the Tubeway post-box column (a red pillar box with the network map in enamel)
//   cart         the ice-cream cart's wheels and parasol · deckchairs: striped chairs on the stack
//   rail         a railing: white posts, a brass top rail with ball ends, a mid rail (and string lights over it at dusk)
//   glassframe   brass frames over the penguin glass bays · cove: the penguins' cove (rocks, ice floes, the pool)
export function registerDress(D, H, KIT) {
  const { K, NS, pbox, cyl, cylGeo, latheG, sphG, torG, strut, rod, letters, sign, porthole, speed, globe, handrail, roundel, HP, PI, TAU } = KIT;
  const blob = new Map();
  const blobG = (seed) => { let g = blob.get(seed); if (!g) { g = H.blobGeo(1, 2, seed, 0.16); blob.set(seed, g); } return g; };

  // ---------------------------------------------------------------------------------------------------- kiosk
  // o.w / o.d / o.h: the block's size (local x, z) and height over pos; o.front: local +z faces the customers
  D.aquarium_kiosk = {
    desc: 'a Deco kiosk round an off-limits block (kind: icecream | souvenir | ferry | timetable)',
    build(B, o) {
      const w = (o.w ?? 2.5) + 0.06, d = (o.d ?? 2.5) + 0.06, h = o.h ?? 2.6, kind = o.kind || 'icecream';
      if (kind === 'timetable') {
        B.box('paint', K.seagreen, w, h - 0.3, d, 0, (h - 0.3) / 2, 0, { r: 0.12 });
        B.box('paint', K.render, w + 0.1, 0.3, d + 0.1, 0, h - 0.15, 0, { r: 0.06 });
        for (const s of [0, 1, 2, 3]) {
          B.push(0, 0, 0, (s * PI) / 2);
          const ww = s % 2 ? d : w;
          B.push(0, 0, (s % 2 ? w : d) / 2, 0);
          pbox(B, 'paint', K.cream, ww - 0.25, 1.1, 0.03, 0, 1.25, 0.015);
          for (let i = 0; i < 6; i++) pbox(B, NS('paint'), K.navy, (ww - 0.45) * (i % 2 ? 0.7 : 0.9), 0.04, 0.01, 0, 1.68 - i * 0.14, 0.035);
          letters(B, s % 2 ? 'FERRIES' : 'TIMETABLE', { h: 0.12, y: 1.86, z: 0.03, c: K.navy, flat: true, mat: 'paint' });
          B.pop(); B.pop();
        }
        // a clock on top
        cyl(B, 'paint', K.render, 0.32, 0.18, 0, h + 0.3, 0, { rx: HP, seg: 20 });
        for (const s of [-1, 1]) B.add(NS('glow'), cylGeo(0.27, 0.27, 0.02, 20), K.cream, 0, h + 0.3, s * 0.095, { rx: HP, glow: 0.9 });
        return;
      }
      const body = kind === 'ferry' ? K.render : K.render, band = kind === 'souvenir' ? K.coral : kind === 'ferry' ? K.navy : K.faience;
      B.box('paint', body, w, h - 0.35, d, 0, (h - 0.35) / 2, 0, { r: 0.18 });
      pbox(B, 'gloss', band, w + 0.02, 0.1, d + 0.02, 0, 0.7, 0);
      pbox(B, 'gloss', band, w + 0.02, 0.05, d + 0.02, 0, 0.84, 0);
      B.box('paint', K.render, w + 0.3, 0.35, d + 0.3, 0, h - 0.17, 0, { r: 0.1 });
      pbox(B, NS('gloss'), band, w + 0.32, 0.06, d + 0.32, 0, h - 0.24, 0);
      // the serving window and the awning (front, local +z)
      B.push(0, 0, d / 2, 0);
      pbox(B, NS('gloss'), '#3b4f58', w - 0.5, 0.9, 0.03, 0, 1.55, 0.015);
      pbox(B, 'wood', K.teak, w - 0.4, 0.06, 0.32, 0, 1.08, 0.15);
      for (let i = 0; i < 6; i++) pbox(B, NS('paint'), i % 2 ? K.stripeA : band, (w - 0.2) / 6, 0.05, 0.6, -((w - 0.2) / 2) + ((i + 0.5) * (w - 0.2)) / 6, 2.12, 0.3, { rx: 0.35 });
      const word = kind === 'icecream' ? 'ICE CREAM' : kind === 'souvenir' ? 'SOUVENIRS' : 'FERRY TICKETS';
      letters(B, word, { h: 0.15, y: h - 0.26, z: 0.17, c: K.navy, flat: true, mat: 'paint', track: 0.12 });
      B.pop();
      // the trade on top
      if (kind === 'icecream') {
        B.add('paint', latheG('cone', [[0, 0], [0.32, 0.9], [0.34, 0.95], [0, 0.95]], 12), K.mustard, 0, h + 0.02, 0, {});
        B.add('paint', sphG(0.38, 14, 10), '#f1e3d3', 0, h + 1.05, 0, {});
        B.add('paint', sphG(0.3, 12, 8), '#e9b9b0', 0, h + 1.4, 0, {});
      } else if (kind === 'souvenir') {
        // a plush shark (grey, white belly) leaping over the roof, and plush-shark shelves on the side walls
        B.push(0, h + 0.55, 0, 0.4);
        B.add('paint', sphG(0.38, 14, 10), K.plush, 0, 0, 0, { sx: 2.4, sz: 0.9, rz: 0.25 });
        B.add('paint', sphG(0.3, 12, 8), K.white, 0.05, -0.12, 0, { sx: 2.2, sz: 0.75, rz: 0.25 });
        B.add('paint', cylGeo(0, 0.22, 0.5, 4), K.plush, -0.1, 0.48, 0, { rz: 0.4 });
        B.add('paint', cylGeo(0, 0.2, 0.5, 4), K.plush, -1.0, 0.0, 0, { rz: 1.6 });
        for (const s of [-1, 1]) B.add(NS('paint'), sphG(0.05, 6, 4), K.ink, 0.6, 0.12, s * 0.27, {});
        B.pop();
        for (const s of [-1, 1]) {
          B.push(s * w / 2, 0, 0, s * HP);
          for (let i = 0; i < 3; i++) B.add('paint', sphG(0.16, 10, 8), [K.plush, '#d9a7b0', '#c7b585'][i], -0.6 + i * 0.6, 1.5, 0.12, { sx: 1.8 });
          pbox(B, 'wood', K.teak, 2.0, 0.05, 0.22, 0, 1.33, 0.1);
          B.pop();
        }
      } else if (kind === 'ferry') {
        roundel(B, 0, h + 0.55, 0.42, ['FERRY', '⚓'.replace('⚓', '')], { field: K.navy });
      }
    },
  };

  // ---------------------------------------------------------------------------------------------------- penguin point
  D.aquarium_hut = {
    desc: "the penguin keeper's hut round its 2 × 2 block (o.h over pos)",
    build(B, o) {
      const h = o.h ?? 2.7, hb = h - 0.75;
      B.box('paint', K.render, 2.06, hb, 2.06, 0, hb / 2, 0, { r: 0.12 });
      speed(B, -1.02, 1.02, 0.45, { n: 3, gap: 0.12, t: 0.05 });
      B.push(0, 0, 1.03, 0);
      pbox(B, 'paint', K.seagreenDk, 0.8, 1.75, 0.04, -0.4, 0.875, 0.02);
      B.add(NS('metal'), sphG(0.04, 8, 6), K.brass, -0.1, 0.9, 0.07, {});
      porthole(B, 0.55, 1.3, 0.22, { lit: true });
      B.pop();
      B.box('paint', K.graniteLt, 2.5, 0.2, 2.5, 0, hb + 0.1, 0, { r: 0.05 });
      B.box('paint', K.render, 1.7, 0.55, 1.7, 0, hb + 0.47, 0, { r: 0.1 });
      // PENGUIN POINT on its roof, both ways
      for (const sg of [0, 1]) { B.push(0, 0, 0, sg * PI); B.push(0, 0, 0.86, 0); letters(B, 'PENGUIN POINT', { h: 0.17, y: hb + 0.27, z: 0.0, c: K.navy, wt: 0.2, flat: true, mat: 'paint' }); B.pop(); B.pop(); }
    },
  };
  D.aquarium_buckets = {
    desc: 'the feeding-bucket rack (1.2 × 1.2, o.h over pos)',
    build(B, o) {
      const h = o.h ?? 1.2;
      for (const [x, z] of [[-0.58, -0.58], [0.58, -0.58], [0.58, 0.58], [-0.58, 0.58]]) pbox(B, 'metal', K.steelDk, 0.06, h, 0.06, x, h / 2, z);
      for (const y of [0.05, h * 0.5]) pbox(B, 'wood', K.teak, 1.24, 0.06, 1.24, 0, y, 0);
      for (const y of [0.08, h * 0.5 + 0.03]) for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]) {
        B.add('gloss', latheG('bucket', [[0, 0], [0.17, 0], [0.22, 0.42], [0.2, 0.42], [0.15, 0.04], [0, 0.04]], 12), [K.seagreen, K.white, K.mustard][Math.abs(Math.round(x * 3 + z * 5 + y * 2)) % 3], x, y, z, {});
      }
      pbox(B, 'wood', K.teak, 1.3, 0.08, 1.3, 0, h - 0.04, 0);
      B.push(0, 0, 0.62, 0); sign(B, 'FISH · 06:00', 0, h * 0.5 - 0.42, { h: 0.08, board: K.cream, c: K.navy, border: K.brass, pad: 0.05 }); B.pop();
    },
  };
  D.aquarium_chute = {
    desc: 'the penguin feeding chute (1.4 × 1.4, o.h over pos; its slide runs out through the glass, local −x)',
    build(B, o) {
      const h = o.h ?? 1.4, hb = h - 0.55;
      B.box('metal', K.steel, 1.44, hb, 1.44, 0, hb / 2, 0, { r: 0.06 });
      B.add('metal', latheG('hopper', [[0.2, 0], [0.75, 0.55], [0.78, 0.58], [0, 0.58]], 4), K.steel, 0, hb, 0, { ry: PI / 4 });
      pbox(B, 'metal', K.steelDk, 1.4, 0.06, 0.5, -0.95, hb * 0.6, 0, { rz: -0.35 });
      B.push(0, 0, 0.73, 0); sign(B, 'CHUTE', 0, hb * 0.45, { h: 0.1, board: K.hazard, c: K.ink, border: false, pad: 0.06 }); B.pop();
    },
  };
  D.aquarium_rock = {
    desc: "a faux-Antarctic concrete outcrop over an off-limits block (o.w, o.d, o.h)",
    build(B, o) {
      const w = o.w ?? 1.4, d = o.d ?? 2.0, h = o.h ?? 2.4;
      B.add('paint', blobG(o.seed ?? 5), o.c ?? K.rock, 0, h * 0.45, 0, { sx: w * 0.62, sy: h * 0.58, sz: d * 0.62 });
      B.add('paint', blobG((o.seed ?? 5) + 1), o.c ?? K.rock, w * 0.1, h * 0.75, -d * 0.12, { sx: w * 0.42, sy: h * 0.33, sz: d * 0.42 });
    },
  };
  // the penguin glass's brass frames: a bay of glass along local x (len), standing from y0 to y1, 0.4 m thick
  D.aquarium_glassframe = {
    desc: 'brass frames over a bay of the penguin glass (len along local x, h): thin strips on both faces',
    build(B, o) {
      const L = o.len, h = o.h ?? 3.2, n = Math.max(2, Math.round(L / 2.4));
      for (const s of [-1, 1]) {
        for (let i = 0; i <= n; i++) pbox(B, 'metal', K.brassLt, 0.07, h - 0.3, 0.04, -L / 2 + (i * L) / n, (h + 0.3) / 2, s * 0.22);
        pbox(B, 'metal', K.brassLt, L + 0.08, 0.08, 0.05, 0, h - 0.04, s * 0.22);
      }
      pbox(B, 'metal', K.brass, L + 0.1, 0.06, 0.46, 0, h + 0.03, 0);
    },
  };

  // the penguins' cove (Alpha's, world frame; the twin turns it): boulders along the shore, ice floes on the cove floor (0.3),
  // the penguins' pool with its rim (its water: backdrop.js), a slide into it, two nest boxes against the glass
  D.aquarium_cove = {
    desc: "the penguins' cove dressing (world frame, Alpha)",
    build(B) {
      const C30 = Math.cos(PI / 6), W = (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w];
      const shore = (s) => -20 - 2.5 * (1 - ((s - 7.5) / 23.5) ** 2);
      const gIn = (s) => (s < -3 ? -17.4 : s < 10 ? -18.2 : s < 24 ? -17.4 : -17.0);
      for (let s = -15; s <= 30; s += 1.5) {
        const [x, z] = W(s, shore(s) + 0.2), k = Math.round(s * 3);
        B.add('paint', blobG(20 + (Math.abs(k) % 5)), Math.abs(k) % 3 ? '#c9ced0' : '#b4babd', x, 0.25, z, { sx: 0.9 + (Math.abs(k) % 4) * 0.2, sy: 0.5 + (Math.abs(k) % 3) * 0.25, sz: 0.8, ry: s });
      }
      // ice floes (flat, white-blue, chamfered) between the glass and the shore
      for (const [s, dw, w, d, r] of [[-12, 1.2, 1.8, 1.2, 0.3], [-6, 1.6, 1.4, 1.0, -0.5], [1, 1.1, 2.2, 1.3, 0.8], [13, 1.0, 1.8, 1.1, -0.2], [17.5, 1.7, 1.2, 0.9, 1.1], [24, 1.2, 1.6, 1.0, 0.4], [28.5, 0.9, 1.2, 0.8, -0.9]]) {
        const [x, z] = W(s, gIn(s) - dw);
        B.box('gloss', K.ice, w, 0.18, d, x, 0.39, z, { r: 0.06, ry: r });
      }
      // the pool (Ø 2.3 at s 6.4, w −20.0), its rim, a slide down a rock into it
      {
        const [x, z] = W(6.4, -20.0);
        B.add('paint', latheG('poolrim', [[1.15, 0.3], [1.42, 0.3], [1.42, 0.58], [1.15, 0.58]], 24), '#d6dadb', x, 0, z, {});
        B.add('paint', cylGeo(1.16, 1.16, 0.06, 24), '#2f5f6b', x, 0.33, z, {});
        const [rx, rz] = W(9.0, -19.6);
        B.add('paint', blobG(31), '#c9ced0', rx, 0.3, rz, { sx: 1.0, sy: 0.9, sz: 0.9 });
        B.push(rx, 0.3, rz, -30 * PI / 180 + PI / 2);
        pbox(B, 'gloss', K.ice, 2.0, 0.08, 0.6, -0.95, 0.42, 0, { rz: 0.32 });
        B.pop();
      }
      // nest boxes against the glass (little Deco huts with round doors)
      for (const s of [-9, 18]) {
        const [x, z] = W(s, gIn(s) - 0.55);
        B.push(x, 0.3, z, -30 * PI / 180 - PI / 2);
        B.box('paint', K.render, 0.9, 0.6, 0.7, 0, 0.3, 0, { r: 0.08 });
        B.add('paint', cylGeo(0.2, 0.2, 0.02, 14), '#2b2d33', 0, 0.28, 0.36, { rx: HP });
        B.pop();
      }
    },
  };

  // ---------------------------------------------------------------------------------------------------- court exhibits
  D.aquarium_coral = {
    desc: 'a coral sculpture (on a Ø 1.6 off-limits base, to 1.6)',
    build(B, o) {
      B.add('paint', cylGeo(0.78, 0.86, 0.5, 8), K.granite, 0, 0.25, 0, { ry: PI / 8 });
      const c = o.c ?? K.coral, r = B.rng;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + r() * 0.4, rr = 0.15 + r() * 0.45, h = 0.6 + r() * 0.9;
        const P = [Math.cos(a) * rr * 0.4, 0.5, Math.sin(a) * rr * 0.4], Q = [Math.cos(a) * rr, 0.5 + h, Math.sin(a) * rr];
        rod(B, 'paint', c, P, Q, 0.06 + r() * 0.04, { seg: 6 });
        B.add('paint', sphG(0.09, 8, 6), K.coralLt, Q[0], Q[1], Q[2], {});
        if (i % 2) { const R2 = [Q[0] * 1.3, Q[1] + 0.3, Q[2] * 1.3]; rod(B, 'paint', c, Q, R2, 0.05, { seg: 6 }); B.add('paint', sphG(0.07, 8, 6), K.coralLt, R2[0], R2[1], R2[2], {}); }
      }
    },
  };
  D.aquarium_clam = {
    desc: 'the giant clam (on a Ø 2.0 off-limits base, to 1.2)',
    build(B) {
      B.add('paint', cylGeo(0.95, 1.05, 0.3, 10), K.granite, 0, 0.15, 0, {});
      const ribs = 7;
      for (const s of [-1, 1]) {
        B.push(0, 0.32, 0, 0, s * 0.42);
        B.add('gloss', sphG(1.0, 18, 8, HP), K.coralLt, 0, 0, s * 0.02, { sy: 0.55, sz: 0.9, rx: s > 0 ? 0 : PI });
        for (let i = 0; i < ribs; i++) { const a = (-0.42 + (i / (ribs - 1)) * 0.84) * PI; B.add(NS('gloss'), torG(0.98, 0.05, 4, 12, PI * 0.42), '#c79a8c', 0, 0, 0, { ry: a + HP, rz: s > 0 ? HP * 0.3 : -HP * 0.3, sy: 0.6 }); }
        B.pop();
      }
      B.add('gloss', sphG(0.6, 14, 8), '#7f9a8c', 0, 0.42, 0, { sy: 0.4 });
      B.add(NS('gloss'), sphG(0.12, 12, 8), '#f4efe6', 0.2, 0.62, 0.1, {});
    },
  };
  D.aquarium_helmet = {
    desc: 'the bronze diving helmet on its bed (pos = the bed top, 0.9; Ø 2.6 to 3.5)',
    build(B) {
      B.add('metal', latheG('collar', [[0, 0], [1.3, 0], [1.32, 0.25], [1.1, 0.5], [0.9, 0.55], [0, 0.55]], 24), K.bronze, 0, 0, 0, {});
      B.add('metal', sphG(1.0, 22, 14), K.bronzeLt, 0, 1.55, 0, {});
      for (const [a, y, r] of [[0, 1.55, 0.42], [HP, 1.6, 0.3], [-HP, 1.6, 0.3], [0.35 * PI, 2.3, 0.2]]) {
        B.push(Math.sin(a) * 0.96, y, Math.cos(a) * 0.96, a);
        B.add('metal', torG(r, r * 0.18, 8, 22), K.brassLt, 0, 0, 0.02, {});
        B.add(NS('gloss'), cylGeo(r * 0.92, r * 0.92, 0.03, 20), '#2d3d45', 0, 0, 0.0, { rx: HP });
        if (r > 0.35) for (let i = 0; i < 3; i++) pbox(B, NS('metal'), K.brassLt, 0.04, r * 1.7, 0.04, -r * 0.5 + i * r * 0.5, 0, 0.05);
        B.pop();
      }
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; B.add(NS('metal'), sphG(0.07, 6, 4), K.brassLt, Math.cos(a) * 1.2, 0.42, Math.sin(a) * 1.2, {}); }
      B.add('metal', cylGeo(0.12, 0.12, 0.4, 10), K.brass, 0.0, 2.5, -0.55, { rx: -0.8 });
    },
  };
  D.aquarium_lectern = {
    desc: 'the Tubeway map lectern (2.0 × 0.6, to 1.2)',
    build(B) {
      B.box('paint', K.render, 2.04, 0.95, 0.5, 0, 0.475, 0, { r: 0.06 });
      speed(B, -1.0, 1.0, 0.3, { n: 2, gap: 0.1, t: 0.04 });
      B.push(0, 1.05, 0, 0, -0.55);
      B.box('metal', K.brass, 2.1, 0.08, 0.7, 0, 0, 0, { r: 0.02 });
      pbox(B, NS('gloss'), K.navy, 1.94, 0.02, 0.56, 0, 0.05, 0);
      // the network: a ring (the drum), two swept wings, the legs as lines, mouths as dots
      B.add(NS('paint'), torG(0.18, 0.012, 4, 24), K.cream, 0, 0.065, 0, { rx: HP });
      for (const [x0, z0, x1, z1, c] of [[-0.2, 0, 0.2, 0, K.brassLt], [-0.05, 0.12, 0.25, -0.15, '#e8c56b'], [0.05, -0.12, -0.25, 0.15, '#e8c56b'], [0.18, 0.05, 0.6, -0.2, K.cream], [-0.18, -0.05, -0.6, 0.2, K.cream], [0.12, -0.15, 0.35, 0.18, '#9bd0c0'], [-0.12, 0.15, -0.35, -0.18, '#9bd0c0']]) strut(B, NS('paint'), c, [x0, 0.068, z0], [x1, 0.068, z1], 0.018, { h: 0.006 });
      B.push(0, 0.068, 0, 0, -HP); letters(B, 'THE TUBEWAY', { h: 0.06, x: -0.55, y: 0.17, z: 0.001, c: K.cream, flat: true, mat: 'paint' }); B.pop();
      B.pop();
    },
  };
  D.aquarium_touchpool = {
    desc: 'the touch pool on its dais (pos = the dais top, 1.0; the pool block 5.0 × 2.6 to 2.0)',
    build(B) {
      const w = 5.06, d = 2.66;
      for (const s of [-1, 1]) { B.box('paint', K.rockDk, w, 1.02, 0.22, 0, 0.51, s * (d / 2 - 0.08), { r: 0.06 }); B.box('paint', K.rockDk, 0.22, 1.02, d, s * (w / 2 - 0.08), 0.51, 0, { r: 0.06 }); }
      pbox(B, NS('metal'), K.brass, w + 0.04, 0.05, 0.08, 0, 1.03, d / 2 - 0.02);
      pbox(B, NS('metal'), K.brass, w + 0.04, 0.05, 0.08, 0, 1.03, -d / 2 + 0.02);
      // in the pool: rocks, starfish, urchins, anemones just under the water (the water: backdrop.js)
      for (let i = 0; i < 8; i++) {
        const x = -2.0 + i * 0.58, z = ((i * 37) % 7) / 7 - 0.5;
        B.add('paint', blobG(11 + (i % 3)), '#776f67', x, 1.0, z * 1.4, { sx: 0.3, sy: 0.12, sz: 0.25 });
        if (i % 2) for (let k = 0; k < 5; k++) pbox(B, NS('paint'), '#c96a4a', 0.18, 0.025, 0.05, x + 0.15 + Math.cos((k * TAU) / 5) * 0.08, 1.015, z * 1.4 + 0.2 - Math.sin((k * TAU) / 5) * 0.08, { ry: (k * TAU) / 5 });
        else B.add(NS('paint'), sphG(0.08, 8, 6), '#4b3b56', x + 0.2, 1.02, z * 1.4 - 0.25, {});
      }
      B.push(0, 0, d / 2 + 0.01, 0); sign(B, 'TOUCH POOL · TWO FINGERS, PLEASE', 0, 0.4, { h: 0.075, board: K.cream, c: K.navy, border: K.brass, pad: 0.05, track: 0.1 }); B.pop();
    },
  };
  // the moon-jelly columns (Ø 3.0 blocks to 4.2) and the bubble column (Ø 2.4 to 5.8): brass base and cap only
  D.aquarium_column = {
    desc: "a glass column's brass base and cap (r = its circumradius; h = its top)",
    build(B, o) {
      const r = o.r ?? 1.63, h = o.h ?? 4.2;
      B.add('paint', cylGeo(r + 0.06, r + 0.12, 0.36, 24), K.granite, 0, 0.18, 0, {});
      B.add('metal', torG(r + 0.04, 0.06, 6, 32), K.brass, 0, 0.38, 0, { rx: HP });
      B.add('metal', cylGeo(r + 0.08, r + 0.08, 0.3, 24), K.brass, 0, h - 0.15, 0, {});
      B.add('paint', cylGeo(r - 0.1, r + 0.08, 0.2, 24), K.render, 0, h + 0.1, 0, {});
      if (o.lamp) globe(B, 0, h + 0.45, 0, 0.18, { glow: 1.2 });
      if (o.label) for (const s of [0, PI]) { B.push(0, 0, 0, s); B.push(0, 0, r + 0.1, 0); letters(B, o.label, { h: 0.11, y: 0.06, z: 0.01, c: K.brassLt, flat: true, mat: 'paint' }); B.pop(); B.pop(); }
    },
  };
  D.aquarium_postbox = {
    desc: 'the Tubeway post-box column (Ø 1.2, to 2.4): a red pillar box with the network map in enamel',
    build(B) {
      B.add('gloss', latheG('pbx', [[0, 0], [0.66, 0], [0.66, 0.12], [0.62, 0.16], [0.62, 2.0], [0.7, 2.08], [0.7, 2.2], [0.5, 2.38], [0.2, 2.46], [0, 2.47]], 24), K.red, 0, 0, 0, {});
      pbox(B, NS('paint'), K.ink, 0.5, 0.06, 0.05, 0, 1.75, 0.6);
      B.push(0, 0, 0.63, 0);
      roundel(B, 0, 1.15, 0.3, ['TUBEWAY'], { field: K.navy, ring: K.brassLt });
      letters(B, 'POST', { h: 0.09, y: 1.92, c: K.brassLt, flat: true, mat: 'paint' });
      B.pop();
    },
  };
  D.aquarium_cart = {
    desc: "the ice-cream cart's wheels and parasol (pos = the cart block's foot centre, 1.4 × 1.5, to 1.4)",
    build(B) {
      for (const s of [-1, 1]) { cyl(B, 'paint', K.rubber, 0.3, 0.08, s * 0.74, 0.3, 0.3, { rz: HP, seg: 14 }); B.add('metal', torG(0.22, 0.02, 4, 14), K.brass, s * 0.79, 0.3, 0.3, { ry: HP }); }
      rod(B, 'metal', K.brass, [0.55, 1.4, -0.6], [0.55, 3.25, -0.6], 0.03);
      B.push(0.55, 3.2, -0.6, 0.3);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; B.add('paint', cylGeo(0, 1.1, 0.35, 3, true, a, TAU / 8), i % 2 ? K.stripeA : K.coral, 0, 0.17, 0, {}); }
      B.pop();
    },
  };
  D.aquarium_deckchairs = {
    desc: 'striped deckchairs folded against the stack (pos = the stack foot, 1.4 × 1.4)',
    build(B) {
      for (let i = 0; i < 4; i++) {
        B.push(0, 0, 0, (i * PI) / 2);
        B.push(0, 0, 0.73, 0);
        pbox(B, 'wood', K.wood, 1.1, 0.05, 0.05, 0, 1.15, 0.03);
        for (let k = 0; k < 5; k++) pbox(B, 'paint', k % 2 ? K.stripeA : [K.coral, K.faience, K.mustard, K.navy][i], 0.2, 1.05, 0.02, -0.4 + k * 0.2, 0.62, 0.02);
        B.pop(); B.pop();
      }
    },
  };

  // ---------------------------------------------------------------------------------------------------- rails
  // a railing along local x (len, h, rise): white posts, a brass handrail with ball ends, a mid rail; o.lights: a string
  // of warm bulbs sagging between every other post (lit at dusk)
  D.aquarium_rail = {
    desc: 'a railing along local x (len, h, rise): white posts, a brass top rail, a mid rail; string lights',
    build(B, o) {
      const L = o.len, h = o.h ?? 1.0, rise = o.rise ?? 0, n = Math.max(1, Math.round(L / 1.6));
      for (let i = 0; i <= n; i++) { const x = -L / 2 + (L * i) / n, y0 = rise * (i / n - 0.5); pbox(B, 'paint', K.white, 0.06, h - 0.04, 0.06, x, y0 + (h - 0.04) / 2, 0); }
      const a = Math.atan2(rise, L), Lr = Math.hypot(L, rise);
      B.add('metal', cylGeo(0.032, 0.032, Lr, 8), K.brass, 0, h - 0.02, 0, { rz: HP + a });
      if (o.balls !== false) for (const s of [-1, 1]) B.add('metal', sphG(0.05, 8, 6), K.brass, s * L / 2, h - 0.02 + (s * rise) / 2, 0, {});
      pbox(B, NS('paint'), K.white, Lr, 0.035, 0.035, 0, h * 0.5, 0, { rz: a });
      if (o.lights) {
        for (let i = 0; i < n; i += 2) {
          const x0 = -L / 2 + (L * i) / n, x1 = -L / 2 + (L * Math.min(n, i + 2)) / n;
          for (let k = 1; k < 6; k++) { const t = k / 6, x = x0 + (x1 - x0) * t, sag = 0.25 * Math.sin(t * PI); B.add(NS('glow'), sphG(0.04, 6, 4), K.litWarm, x, h + 0.55 - sag + rise * ((x + L / 2) / L - 0.5), 0, { glow: 1.6 }); }
          if (i + 2 <= n) for (const x of [x0, x1]) rod(B, 'metal', K.white, [x, h - 0.04 + rise * ((x + L / 2) / L - 0.5), 0], [x, h + 0.6 + rise * ((x + L / 2) / L - 0.5), 0], 0.015);
        }
      }
    },
  };
}
