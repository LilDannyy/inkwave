// Bluestone Junction — the street's dressing (owner: the bluestone stage): lamps, railings, overhead wires, signs and plates,
// the planters' planting, the arcade's vault and striker clock, the balcony's iron lace, the kiosks' plates, the hanging
// signs, the 3000s' floating café pods and drones. Visual only (no colliders). Props that stand stand in a cover block's or
// a roof's footprint (the lamps in the planters, nothing on a walkable top); props on an inkable face stay within 8.5 cm
// of it; anything over a route is at least 2.6 m up (a kid is 1.45 m). ERA builders take o.era and their placement the
// same `eras` (≤ 5 materials per era mask: metal, gloss, wood, rubber, glow).
//
//   lamp        (era) on the six shared lamp spots (DESIGN §5.7; the decor's glass carries the light at the head the
//               body is built round): a fluted gas lamp with a square lantern (1880s), a heritage street light (TODAY),
//               a white light mast with a ring of light (3000s)
//   walllamp    (era) the lanes' bracket lamps: gas brackets, LED lanterns, a light strip
//   rail        a railing for a rail collider (o.kind): iron lace (the balcony), the gallery's iron rail (the spawn decks),
//               the Boathouse's timber rail, rope on posts (the punt), the Iron Bridge's lattice (TODAY), glass with a
//               rail of light (the 3000s)
//   wires       (era) the 1880s' telephone wires across Swimston from roof poles; TODAY's tram catenary on span wires
//   planting    (era) the planters' tops (only roof tops): box and geraniums (1880s), grasses and agapanthus (TODAY),
//               white flowers round a light (3000s)
//   vault       (shared ribs; era glass) the Royal Arcade's iron-and-glass barrel vault over its flat roof block: half
//               glazed (1880s, under construction), glazed (TODAY), glazed and lit (3000s); the striker clock with its two
//               fish-folk giants over the north mouth
//   lace        (shared) the Young & Jackfish's iron lace: the frieze under the balcony and the brackets at its posts
//   plates      (shared) the enamel street plates (SWIMSTON ST, HOKI LANE, DEGRAYLING LANE …) and the kiosks' TELEPHONE
//               plates and domes
//   hangsigns   (era) the shop signs over the footpaths: carved emblems (1880s), lit blade signs (TODAY), light panels
//   pods        (era 3) floating café pods over Degrayling Lane, delivery drones over Swimston
export function registerDress(D, H, KIT) {
  const { K, pbox, cylGeo, latheG, sphG, torG, strut, rod, letters, textW, HP, PI, TAU } = KIT;
  const face = (B, x, y, z, nx, nz, fn) => { B.push(x, y, z, Math.atan2(nx, nz)); fn(); B.pop(); };

  // ============================================================================================================ lamp (era)
  // local frame: the base at y 0, the arm along +x, the decor's light at (0.92, 4.92, 0) (decor.js _buildLamps)
  D.bluestone_lamp = {
    desc: 'a street lamp in one era (o.era) round the decor light at (0.92, 4.92)',
    build(B, o) {
      const e = o.era || 1, hx = 0.92, hy = 4.92;
      if (e === 1) {
        const I = K.iron;
        B.lathe('metal', I, [[0.0, 0.0], [0.22, 0.0], [0.22, 0.12], [0.16, 0.2], [0.15, 0.6], [0.18, 0.66], [0.1, 0.8], [0.085, 1.0], [0.075, 3.9], [0.11, 4.0], [0.0, 4.02]], 0, 0, 0, { seg: 10 });
        pbox(B, 'metal', I, 0.6, 0.04, 0.04, 0, 3.75, 0);   // the ladder bar
        B.tube ? B.tube('metal', I, [[0, 4.0, 0], [0.2, 4.45, 0], [0.55, 4.62, 0], [hx, 4.6, 0]], 0.035) : rod(B, 'metal', I, [0, 4.0, 0], [hx, 4.6, 0], 0.035);
        rod(B, 'metal', I, [hx, 4.6, 0], [hx, hy - 0.2, 0], 0.03);
        // the square lantern round the light: four glazing frames, a pyramid hood, a finial
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) rod(B, 'metal', I, [hx + sx * 0.17, hy - 0.22, sz * 0.17], [hx + sx * 0.21, hy + 0.2, sz * 0.21], 0.012);
        pbox(B, 'metal', I, 0.36, 0.04, 0.36, hx, hy - 0.24, 0);
        B.lathe('metal', I, [[0.3, hy + 0.2], [0.3, hy + 0.24], [0.0, hy + 0.48]], hx, 0, 0, { seg: 4, ry: PI / 4 });
        B.add('metal', sphG(0.04, 6, 4), K.gilt, hx, hy + 0.52, 0, {});
      } else if (e === 2) {
        const S = K.aluDk;
        B.lathe('metal', S, [[0.0, 0.0], [0.17, 0.0], [0.17, 0.5], [0.09, 0.62], [0.07, 5.25], [0.0, 5.26]], 0, 0, 0, { seg: 10 });
        rod(B, 'metal', S, [0, 5.1, 0], [hx, 5.32, 0], 0.035);
        // the heritage-style head: a dark cap over the glass
        B.lathe('metal', S, [[0.0, hy + 0.36], [0.06, hy + 0.36], [0.28, hy + 0.16], [0.3, hy + 0.1], [0.0, hy + 0.1]], hx, 0, 0, { seg: 12 });
        rod(B, 'metal', S, [hx, hy + 0.36, 0], [hx, 5.32, 0], 0.02);
        // the pole's banner arm and a tram-stop-style street plate (blue enamel)
        pbox(B, 'gloss', K.signBlue, 0.04, 0.5, 0.36, 0.09, 2.7, 0);
      } else {
        // the 3000s: a slim white mast, a light strip down its outer face, a ring of light round the head
        B.lathe('gloss', K.pearl, [[0.0, 0.0], [0.14, 0.0], [0.08, 0.3], [0.05, 5.6], [0.0, 5.62]], 0, 0, 0, { seg: 10 });
        pbox(B, 'glow', K.wg, 0.02, 4.6, 0.02, 0.055, 2.6, 0, { glow: 1.3 });
        rod(B, 'gloss', K.pearl, [0, 5.2, 0], [hx, hy + 0.05, 0], 0.025);
        B.add('glow', torG(0.3, 0.035, 4, 24), K.wg, hx, hy, 0, { rx: HP, glow: 1.6 });
        B.add('glow', torG(0.42, 0.015, 4, 24), K.wg, hx, hy - 0.06, 0, { rx: HP, glow: 1.2 });
      }
    },
  };
  // a bracket lamp on a lane wall (local +z off the wall, the lamp at (0, y, 0.55))
  D.bluestone_walllamp = {
    desc: 'a wall lamp in one era (o.era), local +z out of the wall',
    build(B, o) {
      const e = o.era || 1, y = o.y ?? 3.2;
      if (e === 1) {
        pbox(B, 'metal', K.iron, 0.14, 0.3, 0.04, 0, y - 0.2, 0.02);
        rod(B, 'metal', K.iron, [0, y - 0.1, 0.03], [0, y + 0.05, 0.5], 0.025);
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) rod(B, 'metal', K.iron, [sx * 0.11, y - 0.16, 0.55 + sz * 0.11], [sx * 0.14, y + 0.12, 0.55 + sz * 0.14], 0.01);
        B.add('glow', sphG(0.09, 8, 6), K.litWarm, 0, y - 0.03, 0.55, { glow: 1.4 });
        B.lathe('metal', K.iron, [[0.2, y + 0.12], [0.2, y + 0.15], [0.0, y + 0.32]], 0, 0, 0.55, { seg: 4, ry: PI / 4 });
      } else if (e === 2) {
        pbox(B, 'metal', K.black, 0.18, 0.18, 0.04, 0, y, 0.02);
        pbox(B, 'metal', K.black, 0.06, 0.06, 0.42, 0, y + 0.05, 0.24);
        pbox(B, 'metal', K.black, 0.3, 0.1, 0.3, 0, y + 0.02, 0.5);
        pbox(B, 'glow', K.lit, 0.26, 0.02, 0.26, 0, y - 0.04, 0.5, { glow: 1.3 });
      } else {
        pbox(B, 'glow', K.wg, 0.04, 1.6, 0.03, 0, y - 0.4, 0.02, { glow: 1.5 });
        B.add('glow', sphG(0.07, 8, 6), K.wgLit, 0, y + 0.45, 0.06, { glow: 1.6 });
      }
    },
  };

  // ============================================================================================================ rail
  // along local x (len), h tall, its foot at y 0 (rise: the top runs up by rise over the length)
  D.bluestone_rail = {
    desc: 'a railing along local x (len, h) of one kind: lace / gallery / timber / rope / lattice / glass',
    build(B, o) {
      const L = o.len, h = o.h ?? 1.0, kind = o.kind || 'gallery';
      if (kind === 'lace') {
        // cast-iron lace between a top rail and a bottom rail, posts every 1.5 m (the Young & Jackfish's balcony)
        const n = Math.max(1, Math.round(L / 1.5));
        for (let i = 0; i <= n; i++) { const x = -L / 2 + (L * i) / n; B.cyl('metal', K.iron, 0.04, h, x, h / 2, 0, { seg: 8 }); B.add('metal', sphG(0.05, 8, 6), K.iron, x, h + 0.02, 0, {}); }
        pbox(B, 'metal', K.iron, L, 0.05, 0.08, 0, h - 0.03, 0);
        pbox(B, 'metal', K.iron, L, 0.04, 0.05, 0, 0.1, 0);
        const m = Math.max(1, Math.round(L / 0.3));
        for (let i = 0; i < m; i++) {
          const x = -L / 2 + (L / m) * (i + 0.5);
          B.add('metal', torG(0.11, 0.014, 4, 14), K.iron, x, h * 0.55, 0, {});
          B.add('metal', torG(0.05, 0.01, 4, 10), K.iron, x, h * 0.55, 0, {});
          rod(B, 'metal', K.iron, [x - L / m / 2, 0.12, 0], [x, h * 0.55 - 0.11, 0], 0.01);
          rod(B, 'metal', K.iron, [x + L / m / 2, 0.12, 0], [x, h * 0.55 - 0.11, 0], 0.01);
          rod(B, 'metal', K.iron, [x, h * 0.55 + 0.11, 0], [x, h - 0.05, 0], 0.01);
        }
      } else if (kind === 'gallery') {
        // iron rail with dog bars and gilt ball finials (the spawn galleries)
        const n = Math.max(2, Math.round(L / 0.14));
        for (let i = 0; i <= n; i++) { const x = -L / 2 + (L * i) / n; B.cyl('metal', K.iron, 0.012, h - 0.08, x, (h - 0.08) / 2 + 0.04, 0, { seg: 5 }); }
        pbox(B, 'metal', K.iron, L + 0.06, 0.06, 0.08, 0, h - 0.03, 0);
        pbox(B, 'metal', K.iron, L, 0.04, 0.05, 0, 0.06, 0);
        for (const s of [-1, 1]) { B.cyl('metal', K.iron, 0.04, h, s * L / 2, h / 2, 0, { seg: 8 }); B.add('metal', sphG(0.06, 8, 6), K.gilt, s * L / 2, h + 0.04, 0, {}); }
      } else if (kind === 'timber') {
        const n = Math.max(1, Math.round(L / 1.6));
        for (let i = 0; i <= n; i++) pbox(B, 'wood', K.timberLt, 0.1, h, 0.1, -L / 2 + (L * i) / n, h / 2, 0);
        pbox(B, 'wood', K.oak, L + 0.1, 0.07, 0.12, 0, h - 0.035, 0);
        pbox(B, 'wood', K.timberLt, L, 0.05, 0.04, 0, h * 0.5, 0);
      } else if (kind === 'rope') {
        const n = Math.max(1, Math.round(L / 2.0));
        for (let i = 0; i <= n; i++) { const x = -L / 2 + (L * i) / n; B.cyl('wood', K.timber, 0.07, h + 0.15, x, (h + 0.15) / 2, 0, { seg: 8 }); }
        for (let i = 0; i < n; i++) for (const yy of [h - 0.05, h * 0.5]) {
          const x0 = -L / 2 + (L * i) / n, x1 = -L / 2 + (L * (i + 1)) / n, sag = 0.12;
          let p = [x0, yy, 0];
          for (let k = 1; k <= 6; k++) { const t = k / 6, q = [x0 + (x1 - x0) * t, yy - Math.sin(t * PI) * sag, 0]; rod(B, 'wood', K.rope, p, q, 0.018); p = q; }
        }
      } else if (kind === 'lattice') {
        // the Iron Bridge's riveted lattice rail (TODAY)
        pbox(B, 'metal', K.ironLt, L, 0.1, 0.1, 0, h - 0.05, 0);
        pbox(B, 'metal', K.ironLt, L, 0.08, 0.08, 0, 0.06, 0);
        const n = Math.max(2, Math.round(L / 0.45));
        for (let i = 0; i < n; i++) { const x0 = -L / 2 + (L * i) / n, x1 = -L / 2 + (L * (i + 1)) / n; strut(B, 'metal', K.ironLt, [x0, 0.1, 0], [x1, h - 0.1, 0], 0.035); strut(B, 'metal', K.ironLt, [x1, 0.1, 0], [x0, h - 0.1, 0], 0.035); }
        for (const s of [-1, 1]) pbox(B, 'metal', K.ironLt, 0.14, h + 0.1, 0.14, s * L / 2, (h + 0.1) / 2, 0);
      } else {
        // glass (the 3000s: the Halo, the glass stairs, the Iron Bridge): clear panels (the 'glass' bucket — a see-through
        // material with a fresnel edge, the era module's: fix round 1, the panels were opaque blue-grey slabs and these
        // rails are shoot-through) between slim pearl posts every ~1.5 m, a pearl handrail with the rail of light on top,
        // a pearl foot
        const n = Math.max(1, Math.round(L / 1.5)), gm = o.bucketTag && o.bucketTag[0] === 'e' ? 'glass' : 'gloss';   // ('glass' is an era bucket's)
        pbox(B, gm, K.glassClear, L - 0.04, h - 0.2, 0.024, 0, 0.1 + (h - 0.2) / 2, 0);
        for (let i = 0; i <= n; i++) { const x = -L / 2 + (L * i) / n; pbox(B, 'gloss', K.pearl, 0.05, h - 0.04, 0.05, Math.max(-L / 2 + 0.025, Math.min(L / 2 - 0.025, x)), (h - 0.04) / 2, 0); }
        pbox(B, 'gloss', K.pearl, L, 0.05, 0.075, 0, h - 0.065, 0);
        pbox(B, 'glow', K.wg, L, 0.025, 0.05, 0, h - 0.025, 0, { glow: 1.3 });
        pbox(B, 'gloss', K.pearl, L, 0.08, 0.06, 0, 0.04, 0);
        pbox(B, 'glow', K.wg, L - 0.06, 0.012, 0.064, 0, 0.082, 0, { glow: 0.9 });
      }
    },
  };

  // ============================================================================================================ wires (era)
  // a sagging wire from P to Q (world frame), n segments
  const wire = (B, mat, c, P, Q, sag, r = 0.012, n = 10) => {
    let p = P;
    for (let k = 1; k <= n; k++) { const t = k / n, q = [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t - Math.sin(t * PI) * sag, P[2] + (Q[2] - P[2]) * t]; rod(B, mat, c, p, q, r, { seg: 4 }); p = q; }
  };
  D.bluestone_wires = {
    desc: "Alpha's overhead wires in one era (o.era): telephone wires (1880s), the tram catenary (TODAY)",
    build(B, o) {
      const e = o.era || 1;
      if (e === 1) {
        // telephone poles on the arcade's and the hotel's roofs, a cat's cradle of wires across Swimston between them
        const poles = [[-26.4, 6.3, -33], [-26.4, 6.3, -41], [-14.3, 9.0, -21.0], [-16.1, 6.1, -45.5], [-26.4, 6.3, -29]];
        for (const [x, y, z] of poles) {
          B.cyl('wood', K.timber, 0.09, 3.2, x, y + 1.6, z, { seg: 8 });
          for (const yy of [y + 2.7, y + 3.05]) { pbox(B, 'wood', K.timber, 1.4, 0.08, 0.1, x, yy, z); for (let k = -2; k <= 2; k++) B.add('gloss', sphG(0.04, 6, 4), K.cream, x + k * 0.3, yy + 0.07, z, {}); }
        }
        const top = (p, k, dy) => [p[0] + k * 0.3, p[1] + dy, p[2]];
        for (let k = -2; k <= 2; k++) for (const dy of [2.77, 3.12]) {
          wire(B, 'metal', K.black, top(poles[0], k, dy), top(poles[2], k, dy), 0.45, 0.01);
          wire(B, 'metal', K.black, top(poles[1], k, dy), top(poles[3], k, dy), 0.4, 0.01);
          wire(B, 'metal', K.black, top(poles[0], k, dy), top(poles[1], k, dy), 0.25, 0.01);
        }
      } else if (e === 2) {
        // span wires from rosettes on the arcade's wall to the GPO, a pole in the kerb planter and the hotel's oriel;
        // the contact wires over both tracks (x −22.9 and −19.25) at 5.6 m
        const spans = [[-44, [-26, 6.0], [-16, 5.8]], [-29, [-26, 6.0], [-16.7, 7.0]], [-21, [-26, 6.0], [-17, 6.2]]];
        // the pole in the planter at (−16.7, −29)
        B.cyl('metal', K.aluDk, 0.12, 5.8, -16.7, 1.5 + 2.9, -29, { seg: 10 });
        B.add('metal', sphG(0.14, 8, 6), K.aluDk, -16.7, 7.35, -29, {});
        for (const [z, [x0, y0], [x1, y1]] of spans) {
          B.add('metal', cylGeo(0.12, 0.12, 0.05, 10), K.aluDk, x0 + 0.03, y0, z, { rz: HP });
          if (x1 < -16.5 || x1 > -16.05) B.add('metal', cylGeo(0.12, 0.12, 0.05, 10), K.aluDk, x1 - 0.03, y1, z, { rz: HP });
          wire(B, 'metal', K.black, [x0, y0, z], [x1, y1, z], 0.25, 0.012, 8);
          for (const cx of [-22.9, -19.25]) { const t = (cx - x0) / (x1 - x0); rod(B, 'metal', K.black, [cx, y0 + (y1 - y0) * t - 0.2, z], [cx, 5.68, z], 0.01); pbox(B, 'metal', K.aluDk, 0.06, 0.06, 0.5, cx, 5.66, z); }
        }
        for (const cx of [-22.9, -19.25]) { rod(B, 'metal', K.black, [cx, 5.6, -50], [cx, 5.6, -17], 0.012, { seg: 4 }); rod(B, 'metal', K.black, [cx, 5.95, -50], [cx, 5.95, -17], 0.009, { seg: 4 }); }
      }
    },
  };

  // ============================================================================================================ planting (era)
  // the planting on a planter's top (local frame: the top's centre at y 0; o.w × o.d)
  D.bluestone_planting = {
    desc: "a planter's top planting in one era (o.era): w × d",
    build(B, o) {
      const e = o.era || 2, w = o.w ?? 1.2, d = o.d ?? 1.2, n = Math.max(3, Math.round((w * d) / 0.22));
      for (let i = 0; i < n; i++) {
        const fx = (B.r() - 0.5) * (w - 0.24), fz = (B.r() - 0.5) * (d - 0.24), s = 0.16 + B.r() * 0.12;
        if (e === 1) {
          B.add('rubber', sphG(s, 9, 6), i % 3 ? K.leafDk : K.leaf, fx, s * 0.6, fz, { sy: 0.8 });
          if (i % 2) B.add('gloss', sphG(0.05, 5, 4), K.red, fx + 0.06, s * 1.25, fz, {});
        } else if (e === 2) {
          for (let k = 0; k < 3; k++) { const a = B.r() * TAU, L = 0.25 + B.r() * 0.2; strut(B, 'rubber', i % 2 ? K.leafLt : K.leaf, [fx, 0, fz], [fx + Math.cos(a) * 0.12, L, fz + Math.sin(a) * 0.12], 0.025); }
          if (i % 4 === 0) { rod(B, 'rubber', K.leaf, [fx, 0, fz], [fx, 0.55, fz], 0.01); for (let k = 0; k < 5; k++) B.add('gloss', sphG(0.03, 5, 4), '#8a8fc8', fx + Math.cos(k * 1.26) * 0.05, 0.57 + (k % 2) * 0.02, fz + Math.sin(k * 1.26) * 0.05, {}); }
        } else {
          B.add('rubber', sphG(s * 0.9, 9, 6), K.leafLt, fx, s * 0.5, fz, { sy: 0.7 });
          B.add('gloss', sphG(0.045, 5, 4), K.white, fx + 0.05, s * 0.95, fz + 0.03, {});
          if (i === 0) { B.add('glow', sphG(0.07, 8, 6), K.wgLit, 0, 0.45, 0, { glow: 1.6 }); rod(B, 'gloss', K.pearl, [0, 0, 0], [0, 0.4, 0], 0.012); }
        }
      }
    },
  };

  // ============================================================================================================ vault
  // the Royal Arcade's barrel vault over its flat glass roof block (x −31 … −26, z −42 … −28, the block's top 6.3):
  // shared iron ribs (o.era absent) or one era's glass (o.era 1 half glazed / 2 / 3 lit)
  D.bluestone_vault = {
    desc: "the Royal Arcade's iron-and-glass vault (world frame): ribs (no era) or the era's glass",
    build(B, o) {
      const cx = -28.5, r = 2.5, y0 = 6.3, z0 = -42, z1 = -28, n = 9, e = o.era || 0;
      const arc = (k) => { const a = PI * (k / 8); return [cx + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.55]; };
      if (!e) {
        for (let i = 0; i < n; i++) {
          const z = z0 + 0.2 + ((z1 - z0 - 0.4) * i) / (n - 1);
          for (let k = 0; k < 8; k++) { const [x0, ya] = arc(k), [x1, yb] = arc(k + 1); strut(B, 'metal', K.iron, [x0, ya, z], [x1, yb, z], 0.09); }
        }
        for (let k = 0; k <= 8; k++) { const [x, y] = arc(k); strut(B, 'metal', K.iron, [x, y, z0 + 0.2], [x, y, z1 - 0.2], 0.06); }
        // the striker clock over the north mouth with its two fish-folk giants (the hours: era_strike, unused yet)
        face(B, cx, 5.0, z1, 0, 1, () => {
          B.box('wood', K.timber, 1.6, 1.6, 0.3, 0, 0, 0.12, { r: 0.05 });
          B.add('gloss', cylGeo(0.62, 0.62, 0.04, 28), K.cream, 0, 0, 0.29, { rx: HP });
          B.add('metal', torG(0.64, 0.04, 4, 28), K.gilt, 0, 0, 0.3, {});
          for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; pbox(B, 'metal', K.black, 0.03, k % 3 ? 0.07 : 0.14, 0.01, Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0.31, { rz: -a }); }
          pbox(B, 'metal', K.black, 0.04, 0.36, 0.01, 0.1, 0.12, 0.32, { rz: -0.6 }); pbox(B, 'metal', K.black, 0.03, 0.48, 0.01, -0.06, -0.2, 0.325, { rz: 0.3 });
          for (const s of [-1, 1]) {
            // a fish-folk giant: a robed body, a fish's head with a fin crest, a hammer raised to the bell
            B.lathe('gloss', s < 0 ? K.green : K.maroon, [[0.0, -0.8], [0.26, -0.8], [0.22, -0.3], [0.16, 0.2], [0.0, 0.22]], s * 1.25, 0, 0.2, { seg: 10 });
            B.add('gloss', sphG(0.17, 10, 8), K.verdigris, s * 1.25, 0.36, 0.22, { sx: 1.0, sz: 1.35 });
            B.add('gloss', sphG(0.03, 6, 4), K.black, s * 1.25 + 0.08, 0.4, 0.4, {});
            pbox(B, 'gloss', K.verdigrisDk, 0.03, 0.18, 0.22, s * 1.25, 0.54, 0.2);
            rod(B, 'metal', K.brass, [s * 1.12, 0.05, 0.3], [s * 0.85, 0.62, 0.3], 0.025);
          }
          B.add('metal', sphG(0.2, 10, 8, PI / 2), K.brass, 0, 0.98, 0.2, { rx: PI });
        });
      } else {
        // the glass between the ribs (pearl panes in the 3000s; in the 1880s only the south half is glazed yet)
        for (let k = 0; k < 8; k++) {
          const [x0, ya] = arc(k), [x1, yb] = arc(k + 1), mx = (x0 + x1) / 2, my = (ya + yb) / 2, L = Math.hypot(x1 - x0, yb - ya), a = Math.atan2(yb - ya, x1 - x0);
          const zz0 = z0 + 0.2, zz1 = e === 1 ? -35 : z1 - 0.2;
          pbox(B, 'gloss', e === 3 ? K.pearlDk : K.glassLt, L, 0.02, zz1 - zz0, mx, my, (zz0 + zz1) / 2, { rz: a });
          if (e === 3 && k % 2 === 0) pbox(B, 'glow', K.wg, 0.03, 0.03, zz1 - zz0, mx, my + 0.03, (zz0 + zz1) / 2, { glow: 1.2 });
        }
        if (e === 1) { for (let i = 0; i < 4; i++) pbox(B, 'wood', K.timberLt, 4.6, 0.12, 0.2, cx, 6.5 + i * 0.3, -33 + i * 1.6); }   // the builders' planks over the unglazed half
      }
    },
  };

  // ============================================================================================================ lace (shared)
  D.bluestone_lace = {
    desc: "the Young & Jackfish's iron lace frieze under the balcony's north edge and its post brackets (world frame)",
    build(B) {
      // the frieze along z −15.5 under the balcony slab (2.1 → 1.92) from x −12.2 to −5, and along x −5 (the east edge)
      const run = (P, Q) => {
        const L = Math.hypot(Q[0] - P[0], Q[2] - P[2]), n = Math.max(2, Math.round(L / 0.28)), ry = Math.atan2(Q[0] - P[0], Q[2] - P[2]) - HP;
        B.push((P[0] + Q[0]) / 2, 0, (P[2] + Q[2]) / 2, ry);
        pbox(B, 'metal', K.iron, L, 0.04, 0.04, 0, 1.93, 0);
        for (let i = 0; i < n; i++) { const x = -L / 2 + (L / n) * (i + 0.5); B.add('metal', torG(0.075, 0.011, 4, 12), K.iron, x, 2.01, 0, {}); }
        B.pop();
      };
      run([-12.2, 0, -15.47], [-5.0, 0, -15.47]);
      run([-5.03, 0, -15.5], [-5.03, 0, -18.5]);
      // the brackets at the posts: quarter-round lace in the post / slab corner
      for (const [x, z] of [[-5.1, -16]]) for (const s of [-1, 1]) { B.push(x, 2.1, z, s < 0 ? PI : 0); for (let k = 0; k < 4; k++) { const a = (k / 4) * HP; rod(B, 'metal', K.iron, [0, -0.02, 0], [Math.cos(a) * 0.32, -Math.sin(a) * 0.3, 0], 0.012); } B.add('metal', torG(0.22, 0.014, 4, 12, HP), K.iron, 0, 0, 0, { rz: -HP }); B.pop(); }
    },
  };

  // ============================================================================================================ plates (shared)
  D.bluestone_plates = {
    desc: "the enamel street plates and the kiosks' TELEPHONE plates and domes (Alpha's, world frame)",
    build(B) {
      const plate = (x, y, z, nx, nz, text) => face(B, x, y, z, nx, nz, () => {
        const w = textW(text, 0.19, 0.12) * 0.13 + 0.26;
        B.box('gloss', K.enamel, w, 0.26, 0.025, 0, 0, 0.012, { r: 0.01 });
        for (const yy of [-0.11, 0.11]) pbox(B, 'gloss', K.enamelW, w - 0.06, 0.012, 0.004, 0, yy, 0.026);
        letters(B, text, { h: 0.13, y: -0.065, z: 0.026, c: K.enamelW, flat: true, wt: 0.2, track: 0.12, mat: 'gloss' });
      });
      plate(-16.0, 2.75, -42.6, -1, 0, 'SWIMSTON ST');
      plate(-15.6, 2.75, -46.0, 0, -1, 'CUSTOMS LANE');
      plate(-26.0, 2.75, -41.3, 1, 0, 'SWIMSTON ST');
      plate(-31.0, 2.75, -41.3, -1, 0, 'HOKI LANE');
      plate(-36.5, 2.75, -47.5, 1, 0, 'HOKI LANE');
      plate(-14.0, 2.75, -22.3, -1, 0, 'DEGRAYLING LANE');
      plate(-26.0, 2.75, -11.6, 1, 0, 'FLOUNDERS ST');
      plate(-32.6, 2.75, -12.0, 0, -1, 'PROW PLACE');
      plate(-9.5, 2.75, -42.4, 1, 0, 'THE QUAY');
      // the TELEPHONE plates on every face of the two kiosks on the ring, and their domed roofs
      for (const [x0, x1, z0, z1] of [[17.13, 18.33, -3.73, -2.53], [-17.7, -16.5, -13.4, -12.2]]) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) face(B, cx + nx * 0.6, 2.18, cz + nz * 0.6, nx, nz, () => {
          B.box('gloss', K.enamelW, 0.98, 0.16, 0.02, 0, 0, 0.01, { r: 0.005 });
          letters(B, 'TELEPHONE', { h: 0.085, y: -0.042, z: 0.021, c: K.enamel, flat: true, wt: 0.2, track: 0.1, mat: 'gloss' });
        });
        B.lathe('metal', K.green, [[0.66, 2.4], [0.66, 2.46], [0.5, 2.62], [0.25, 2.72], [0.0, 2.74]], cx, 0, cz, { seg: 4, ry: PI / 4 });
        B.add('metal', sphG(0.06, 6, 4), K.gilt, cx, 2.8, cz, {});
      }
    },
  };

  // ============================================================================================================ hanging signs (era)
  D.bluestone_hangsigns = {
    desc: "the shop signs hung over the footpaths in one era (o.era), Alpha's frame",
    build(B, o) {
      const e = o.era || 1;
      // [x, z, nx, nz]: on the arcade's Swimston face, the hotel's west face, the GPO's west face
      const spots = [[-26, -40.2, 1, 0], [-26, -36.7, 1, 0], [-26, -33.2, 1, 0], [-26, -29.7, 1, 0], [-17, -21.4, -1, 0], [-16, -44.0, -1, 0]];
      spots.forEach(([x, z, nx, nz], i) => face(B, x, 3.15, z, nx, nz, () => {
        if (e === 1) {
          pbox(B, 'metal', K.iron, 0.04, 0.04, 0.8, 0, 0.3, 0.4);
          rod(B, 'metal', K.iron, [0, 0.0, 0.02], [0, 0.28, 0.6], 0.015);
          // carved emblems: a boot, a pocket watch, a key, a pestle and mortar, a tankard, an envelope
          const sh = i % 6;
          B.push(0, 0.0, 0.62, HP);
          if (sh === 0) { pbox(B, 'wood', K.timber, 0.12, 0.42, 0.18, 0, -0.04, 0); pbox(B, 'wood', K.timber, 0.12, 0.14, 0.42, 0, -0.18, 0.12); }
          else if (sh === 1) { B.add('metal', cylGeo(0.2, 0.2, 0.06, 18), K.gilt, 0, -0.08, 0, { rx: HP }); B.add('gloss', cylGeo(0.16, 0.16, 0.07, 18), K.cream, 0, -0.08, 0, { rx: HP }); }
          else if (sh === 2) { B.add('metal', torG(0.11, 0.035, 6, 14), K.gilt, 0, 0.02, 0, {}); pbox(B, 'metal', K.gilt, 0.05, 0.38, 0.05, 0, -0.25, 0); pbox(B, 'metal', K.gilt, 0.05, 0.05, 0.14, 0, -0.38, 0.06); }
          else if (sh === 3) { B.lathe('wood', K.oak, [[0.0, -0.32], [0.18, -0.3], [0.2, -0.12], [0.14, 0.0], [0.0, 0.0]], 0, 0, 0, { seg: 10 }); }
          else if (sh === 4) { B.add('wood', cylGeo(0.13, 0.11, 0.3, 12), K.oak, 0, -0.15, 0, {}); B.add('metal', torG(0.08, 0.02, 4, 10), K.oak, 0.14, -0.15, 0, { ry: HP }); }
          else { B.box('wood', K.cream, 0.04, 0.3, 0.42, 0, -0.12, 0, { r: 0.01 }); }
          B.pop();
        } else if (e === 2) {
          // a blade sign: an aluminium frame, a lit panel both sides
          pbox(B, 'metal', K.aluDk, 0.06, 0.06, 0.5, 0, 0.42, 0.25);
          B.box('metal', K.aluDk, 0.08, 0.62, 0.62, 0, 0.05, 0.42, { r: 0.02 });
          const cs = [K.teal, K.maroon, K.signBlue, K.ochre];
          pbox(B, 'glow', cs[i % 4], 0.09, 0.5, 0.5, 0, 0.05, 0.42, { glow: 0.6 });
        } else {
          // a light panel standing off the wall on a hair-thin arm
          rod(B, 'gloss', K.pearl, [0, 0.2, 0.02], [0, 0.2, 0.45], 0.01);
          B.box('gloss', K.pearl, 0.03, 0.7, 0.4, 0, 0.0, 0.5, { r: 0.015 });
          pbox(B, 'glow', K.wg, 0.035, 0.6, 0.02, 0, 0.0, 0.32, { glow: 1.3 }); pbox(B, 'glow', K.wg, 0.035, 0.6, 0.02, 0, 0.0, 0.68, { glow: 1.3 });
        }
      }));
    },
  };

  // ============================================================================================================ pods (era 3)
  D.bluestone_pods = {
    desc: 'the 3000s: floating café pods over Degrayling Lane, delivery drones over Swimston (world frame)',
    build(B) {
      for (const [x, y, z, r] of [[-12.4, 4.9, -26.2, 0.9], [-10.6, 5.6, -24.0, 0.7]]) {
        B.add('gloss', sphG(r, 16, 10), K.pearl, x, y, z, { sy: 0.62 });
        B.add('glow', torG(r * 1.02, 0.04, 4, 28), K.wg, x, y, z, { rx: HP, glow: 1.4 });
        B.add('gloss', sphG(r * 0.8, 14, 8, PI / 2), K.glassLt, x, y + r * 0.2, z, {});
        B.add('glow', cylGeo(r * 0.5, r * 0.2, 0.08, 16), K.wg, x, y - r * 0.62, z, { glow: 1.2 });
      }
      for (const [x, y, z] of [[-20.5, 8.6, -38], [-22.5, 9.4, -27], [-30.5, 8.8, -20.5]]) {
        B.box('gloss', K.pearl, 0.5, 0.12, 0.5, x, y, z, { r: 0.05 });
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.add('glow', torG(0.14, 0.015, 4, 12), K.wg, x + sx * 0.36, y + 0.04, z + sz * 0.36, { rx: HP, glow: 1.2 });
        B.add('gloss', sphG(0.1, 8, 6), K.glassLt, x, y - 0.12, z, {});
      }
    },
  };

  // ============================================================================================================ small things
  // a cast-iron mooring bollard on a mooring block's top (a roof: nobody stands there): local origin at the top's centre
  D.bluestone_bollardcap = {
    desc: 'a cast-iron mooring bollard standing on a block top',
    build(B) {
      B.lathe('metal', K.black, [[0.0, 0.0], [0.2, 0.0], [0.17, 0.08], [0.13, 0.12], [0.12, 0.4], [0.2, 0.46], [0.22, 0.52], [0.0, 0.54]], 0, 0, 0, { seg: 12 });
    },
  };
  // rowing shells racked on the Boathouse's deck racks (a roof top): along local z, o.len
  D.bluestone_shells = {
    desc: 'two rowing eights racked on trestles (local z along the shells)',
    build(B, o) {
      const L = o.len || 2.4;
      for (const [y, c] of [[0.12, K.cream], [0.42, K.maroon]]) {
        // (the lathe's axis is its length: stretched along y, then laid down along local z; flattened to a hull's depth)
        B.lathe('gloss', c, [[0.0, -0.5], [0.12, -0.42], [0.2, -0.2], [0.21, 0.0], [0.2, 0.2], [0.12, 0.42], [0.0, 0.5]], 0, y + 0.1, 0, { seg: 8, sy: L * 1.6, sx: 1.0, sz: 0.55, rx: Math.PI / 2 });
      }
      for (const z of [-L * 0.45, L * 0.45]) pbox(B, 'wood', K.timberLt, 0.9, 0.06, 0.08, 0, 0.62, z);
    },
  };
  // iron hitching rings on a granite mounting block's long faces (1880s): o.w × o.d, o.h; within 3 cm of the faces
  D.bluestone_rings = {
    desc: "hitching rings on a block's faces (o.w, o.d, o.h)",
    build(B, o) {
      const w = o.w, d = o.d, h = o.h;
      for (const [x, z, ry] of [[0, d / 2, 0], [0, -d / 2, Math.PI], [w / 2, 0, Math.PI / 2], [-w / 2, 0, -Math.PI / 2]]) {
        B.push(x, h * 0.62, z, ry);
        B.add('metal', torG(0.07, 0.012, 4, 14), K.black, 0, -0.06, 0.02, {});
        pbox(B, 'metal', K.black, 0.05, 0.05, 0.02, 0, 0.0, 0.01);
        B.pop();
      }
    },
  };
  // bike hoops hugging a block's long faces (TODAY): flat steel hoops 4 cm off the face
  D.bluestone_hoops = {
    desc: "bike hoops on a block's long faces (o.w, o.d)",
    build(B, o) {
      const w = o.w, d = o.d, L = Math.max(w, d), alongX = w >= d;
      for (const s of [-1, 1]) {
        B.push(alongX ? 0 : s * (w / 2), 0, alongX ? s * (d / 2) : 0, alongX ? (s > 0 ? 0 : Math.PI) : (s > 0 ? Math.PI / 2 : -Math.PI / 2));
        for (const x of [-L * 0.25, L * 0.25]) {
          pbox(B, 'metal', K.alu, 0.04, 0.72, 0.03, x - 0.22, 0.36, 0.04);
          pbox(B, 'metal', K.alu, 0.04, 0.72, 0.03, x + 0.22, 0.36, 0.04);
          B.add('metal', torG(0.22, 0.02, 4, 12, Math.PI), K.alu, x, 0.72, 0.04, {});
        }
        B.pop();
      }
    },
  };

  // ============================================================================================================ Tartar's wires
  // o.paths (levelart.js wirePath per wire) and o.anchors: the wires themselves (o.era: 1 / 2 black, 3 a thin light
  // filament) or, with no era, the brackets and poles they hang on (shared)
  D.bluestone_pulsewires = {
    desc: "Tartar's wires from the drum to the streets (o.paths, o.anchors; o.era the wire's look, none = the fittings)",
    build(B, o) {
      const e = o.era || 0;
      if (e) {
        for (const p of o.paths || []) for (let i = 1; i < p.length; i++) rod(B, e === 3 ? 'glow' : 'metal', e === 3 ? K.wg : K.black, p[i - 1], p[i], e === 3 ? 0.014 : 0.018, { seg: 4, glow: e === 3 ? 1.3 : undefined });
        return;
      }
      for (const w of o.anchors || []) for (const a of w) {
        const [x, y, z, kind, y0] = a;
        if (kind === 'pole') {
          B.cyl('wood', K.timber, 0.08, y - y0 + 0.4, x, (y + y0 + 0.4) / 2, z, { seg: 8 });
          pbox(B, 'wood', K.timber, 0.9, 0.08, 0.1, x, y + 0.05, z);
          for (const dx of [-0.35, 0, 0.35]) B.add('gloss', sphG(0.045, 6, 4), K.cream, x + dx, y + 0.12, z, {});
        } else {
          // an iron bracket and a white insulator
          B.add('metal', sphG(0.07, 6, 4), K.iron, x, y + 0.02, z, {});
          B.add('gloss', cylGeo(0.05, 0.06, 0.12, 8), K.cream, x, y + 0.1, z, {});
        }
      }
    },
  };
}
