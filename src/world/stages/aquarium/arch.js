// Gulper Aquarium — the architecture's dressing (owner: the aquarium stage): the 1936 Streamline Moderne building drawn
// over the blockout's level blocks. Every builder here is visual only (no colliders): it dresses an off-limits block
// (`roof`, never inked) by wrapping it a few centimetres proud, or stands where nobody can walk (on roofs, behind glass,
// over the sea). Inkable faces are never covered. Most builders work in Alpha's world frame (placed at the origin, turned
// 180° for Bravo by the placement mirror); the blade's pieces in the blade frame (bl()).
//
//   gatehouse   the Arch Tank's Deco frame, the GULPER AQUARIUM fascia over the court mouth, the SOUTH / NORTH GATE
//               fascia and its two-faced clock over the wing mouth, the tank's lid, the pylons' fluted wing faces and
//               crests, the shark-arch door surround and the hall's riser-shaft frames
//   gantry      the riveted sea-green feeding gantry (legs, box girders, the winch house with its lantern and "No. 1")
//   gulper      a bronze gulper-eel head (Deco, geometric): brow, crest fin, lit eyes, gill slits, needle teeth round
//               the Gulper Run's mouth ring (the ring and its sign stay clear)
//   tankFrame   the Great Tank's brass mullions, the FEEDING DECK plates on its rim kerbs, the diver and the rocks inside
//   colonnade   the Reef Hall's fluted brass lamp columns (globe lamps lit at dusk), the canopy's fascia and REEF HALL
//   reefWindow  the Reef Window's opaque parts (render band, granite base, brass mullions, outer wall) and its reef:
//               rock, coral heads, a moray in a pipe, the octopus den (glass, water and fish: backdrop.js)
//   drum        the kelp drum's riveted crown, the keepers' ladder, the plant room's vent, door and roof clutter, the Kelp
//               stop's and the pump housing's brass dressing
//   promenade   the brass handrails on the balustrades, the Lookout's SEA PROMENADE letters, the telescopes, the sea
//               face's Jelly Gallery portholes (lit at dusk), the deep Kelp stop
//   ticketHall  the Deco pavilion: fluted columns, the glass canopy's brass frame, the clock on the canopy, the ticket
//               booth, the TICKET HALL letters, the feeding-times board
//   pumpHall    the back wall's pilasters, pipe runs and valve wall, the sawtooth glazing, the truss, the sand filters,
//               the forklift with its fish tank, the GA vent stack over the sea
//   finTower    the entrance pavilion's fin with vertical neon AQUARIUM, its sea facade (doors, portholes, letters)
//   stops       the Express's brass stops (IN and OUT), dressed round their mouths
export function registerArch(D, H, KIT, G) {
  const { K, NS, pbox, cyl, cylGeo, latheG, sphG, torG, strut, rod, letters, lettersV, sign, porthole, speed, globe, handrail, roundel, rivets, HP, PI, TAU } = KIT;
  const DEG = Math.PI / 180;
  const C30 = Math.cos(30 * DEG);
  const W = (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w];
  const pol = (a, r, c = [0, 0]) => [c[0] + r * Math.cos(a * DEG), c[1] + r * Math.sin(a * DEG)];
  // a frame on a face: origin (x, y, z), local +z along the outward normal (nx, nz)
  const face = (B, x, y, z, nx, nz, fn) => { B.push(x, y, z, Math.atan2(nx, nz)); fn(); B.pop(); };
  // the blade frame at (s, w): local x = +w, local z = −s (toward the court)
  const bl = (B, s, w, y, fn) => { const [x, z] = W(s, w); B.push(x, y, z, -30 * DEG); fn(); B.pop(); };
  // a curved band (render / brass) along an arc round c: radii r0 → r1, bearings a0 → a1, y0 → y1, n segments
  function arcBand(B, mat, c, r0, r1, a0, a1, y0, y1, color, n = 0, cen = [0, 0]) {
    const N = n || Math.max(2, Math.ceil(Math.abs(a1 - a0) / 4));
    const rm = (r0 + r1) / 2, da = (a1 - a0) / N;
    for (let i = 0; i < N; i++) {
      const a = a0 + da * (i + 0.5), [x, z] = pol(a, rm, cen), L = 2 * r1 * Math.sin(Math.abs(da) * DEG / 2) + 0.02;
      B.push(x, (y0 + y1) / 2, z, -a * DEG + HP);
      pbox(B, mat, color, L, y1 - y0, r1 - r0, 0, 0, 0);
      B.pop();
    }
  }

  // ============================================================================================================ gatehouse
  D.aquarium_gatehouse = {
    desc: "Alpha's gatehouse dressing in its world frame (label: 'SOUTH GATE')",
    build(B, o) {
      const label = o.label || 'SOUTH GATE', court = o.court || 'GULPER AQUARIUM';
      // ---- the Arch Tank: its lid, its court and wing fascias, the lintels under its two glass ends
      pbox(B, 'paint', K.render, 12.9, 0.26, 12.6, 0, 9.13, -25.0);                           // the lid
      pbox(B, NS('metal'), K.brass, 12.9, 0.06, 0.06, 0, 9.27, -18.76);
      pbox(B, NS('metal'), K.brass, 12.9, 0.06, 0.06, 0, 9.27, -31.24);
      for (const [z, n] of [[-18.9, 1], [-31.1, -1]]) {
        pbox(B, 'paint', K.render, 13.2, 1.05, 0.3, 0, 8.82, z);                                 // fascia
        pbox(B, 'gloss', K.faience, 13.24, 0.05, 0.32, 0, 8.36, z);                             // its faience foot line
        pbox(B, 'paint', K.render, 12.2, 0.28, 0.3, 0, 5.87, z);                                 // lintel under the glass
        pbox(B, NS('metal'), K.brass, 12.2, 0.05, 0.33, 0, 6.02, z);
        // brass frame round the glass end (6.0 → 8.3), mullions every 2 m
        for (let x = -6; x <= 6.01; x += 2) pbox(B, 'metal', K.brass, 0.12, 2.3, 0.1, x, 7.15, z + n * 0.12);
        pbox(B, 'metal', K.brass, 12.2, 0.1, 0.1, 0, 8.28, z + n * 0.12);
      }
      // GULPER AQUARIUM over the court mouth (brass, lit at dusk), EST. 1936 at its ends
      face(B, 0, 0, -18.74, 0, 1, () => {
        letters(B, court, { h: 0.58, y: 8.56, c: K.brassLt, wt: 0.17, track: 0.16, dep: 0.07, lit: true, glow: 1.2 });
        letters(B, 'EST.', { h: 0.2, x: -5.75, y: 8.82, c: K.brass, flat: true, mat: 'paint' });
        letters(B, '1936', { h: 0.2, x: -5.75, y: 8.55, c: K.brass, flat: true, mat: 'paint' });
        letters(B, 'EST.', { h: 0.2, x: 5.75, y: 8.82, c: K.brass, flat: true, mat: 'paint' });
        letters(B, '1936', { h: 0.2, x: 5.75, y: 8.55, c: K.brass, flat: true, mat: 'paint' });
      });
      // SOUTH GATE over the wing mouth, the two-faced clock above it on the lid
      face(B, 0, 0, -31.26, 0, -1, () => {
        letters(B, label, { h: 0.56, y: 8.58, c: K.brassLt, wt: 0.17, track: 0.2, dep: 0.07, lit: true, glow: 1.2 });
      });
      {
        const y = 10.0, z = -31.1, r = 0.62;
        cyl(B, 'paint', K.render, r + 0.12, 0.34, 0, y, z, { rx: HP, seg: 28 });
        B.add('metal', torG(r + 0.12, 0.05, 6, 28), K.brass, 0, y, z - 0.17, {});
        B.add('metal', torG(r + 0.12, 0.05, 6, 28), K.brass, 0, y, z + 0.17, {});
        pbox(B, 'paint', K.render, 0.5, 0.45, 0.3, 0, 9.42, z);
        for (const s of [-1, 1]) {
          B.add(NS('glow'), cylGeo(r, r, 0.02, 28), K.cream, 0, y, z + s * 0.175, { rx: HP, glow: 0.9 });
          for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; pbox(B, NS('paint'), K.ink, 0.03, i % 3 ? 0.06 : 0.12, 0.01, Math.sin(a) * r * 0.82, y + Math.cos(a) * r * 0.82, z + s * 0.19, { rz: -a }); }
          pbox(B, NS('paint'), K.ink, 0.04, r * 0.55, 0.012, 0.12, y + 0.18, z + s * 0.2, { rz: -0.6 });
          pbox(B, NS('paint'), K.ink, 0.035, r * 0.75, 0.012, -0.16, y + 0.22, z + s * 0.205, { rz: 0.7 });
        }
      }
      // ---- the pylons: crests, fluted wing faces with the coiled-gulper roundel, the shark-arch door's surround
      for (const sx of [1, -1]) {
        const aOut = sx > 0 ? -70 : -110, aIn = -90 + sx * (90 - Math.acos(6 / 31.2) / DEG), aCt = -90 + sx * (90 - Math.acos(6 / 20) / DEG);
        // crest: a granite coping along the wing face and the radial face, a faience line under it
        arcBand(B, 'paint', K.graniteLt, 31.0, 31.35, Math.min(aOut, aIn), Math.max(aOut, aIn), 9.0, 9.18, K.graniteLt, 0);
        arcBand(B, 'gloss', K.faience, 31.2, 31.28, Math.min(aOut, aIn), Math.max(aOut, aIn), 8.55, 8.62, K.faience, 0);
        arcBand(B, 'paint', K.graniteLt, 19.9, 20.25, Math.min(aOut, aCt), Math.max(aOut, aCt), 9.0, 9.18, K.graniteLt, 1);
        // fluted ribs up the wing face
        for (const f of [0.18, 0.5, 0.82]) {
          const a = aIn + (aOut - aIn) * f, [x, z] = pol(a, 31.25);
          face(B, x, 0, z, Math.cos(a * DEG), Math.sin(a * DEG), () => { B.box('paint', K.render, 0.34, 7.9, 0.16, 0, 4.45, 0.05, { r: 0.05 }); pbox(B, 'gloss', K.faience, 0.36, 0.05, 0.18, 0, 0.5, 0.06); });
        }
        // the coiled-gulper roundel between the ribs, over the Gate Terrace
        {
          const a = aIn + (aOut - aIn) * 0.5, [x, z] = pol(a, 31.27);
          face(B, x, 0, z, Math.cos(a * DEG), Math.sin(a * DEG), () => {
            B.add('metal', torG(0.78, 0.07, 6, 32), K.brass, 0, 6.2, 0.12, {});
            B.add('gloss', cylGeo(0.76, 0.76, 0.05, 32), K.navy, 0, 6.2, 0.1, { rx: HP });
            // the gulper coiled into a ring (the emblem): a brass torus nearly closed, its head and jaw
            B.add('metal', torG(0.46, 0.07, 6, 24, TAU * 0.86), K.brassLt, 0, 6.2, 0.16, { rz: 0.5 });
            B.add('metal', sphG(0.13, 10, 8), K.brassLt, 0.42, 6.42, 0.17, { sx: 1.4, sy: 0.9 });
            letters(B, label.split(' ')[0], { h: 0.13, y: 5.62, z: 0.14, c: K.cream, flat: true, mat: 'paint', wt: 0.2 });
          });
        }
        // the radial face's door into the Reef Hall (east pylon only): a stepped Deco surround and the sign over it
        if (sx > 0) {
          const nx = Math.cos((aOut + 90) * DEG), nz = Math.sin((aOut + 90) * DEG), rd0 = 20 / Math.sin(70 * DEG), rd1 = 24 / Math.sin(70 * DEG);
          const rmid = (rd0 + rd1) / 2, [x, z] = pol(aOut, rmid), w = rd1 - rd0;
          face(B, x + nx * 0.0, 0, z + nz * 0.0, nx, nz, () => {
            for (const s of [-1, 1]) { pbox(B, 'paint', K.render, 0.32, 4.4, 0.14, s * (w / 2 + 0.16), 2.2, 0.07); pbox(B, 'gloss', K.faience, 0.34, 0.05, 0.16, s * (w / 2 + 0.16), 0.8, 0.08); }
            pbox(B, 'paint', K.render, w + 0.64, 0.4, 0.16, 0, 4.4, 0.08);
            pbox(B, NS('metal'), K.brass, w + 0.66, 0.05, 0.18, 0, 4.2, 0.09);
            letters(B, 'SHARK ARCH', { h: 0.24, y: 4.29, z: 0.17, c: K.brassDk, flat: true, mat: 'paint', track: 0.18 });
          });
        }
        // the riser shafts' glazing in the hall walls: brass frames (Arch Line riders flash up and down behind it)
        {
          const x = sx * 5.97;
          for (const z of [-28.3, -25.95]) pbox(B, 'metal', K.brass, 0.08, 8.3, 0.1, x, 4.15, z);
          pbox(B, 'metal', K.brass, 0.08, 0.1, 2.45, x, 8.4, -27.12);
          pbox(B, 'metal', K.brass, 0.08, 0.1, 2.45, x, 0.05, -27.12);
          for (const y of [2.2, 4.3, 6.4]) pbox(B, NS('metal'), K.brass, 0.05, 0.05, 2.3, x, y, -27.12);
        }
        // the hall walls: a brass handrail and DO NOT TAP THE GLASS plates between the shaft and the court mouth
        {
          const x = sx * 5.98;
          face(B, x, 0, -22.6, -sx, 0, () => { sign(B, 'PLEASE DO NOT TAP THE GLASS', 0, 1.7, { h: 0.11, board: K.navy, c: K.cream, border: K.brass, track: 0.1 }); });
          face(B, x, 0, -29.6, -sx, 0, () => { sign(B, 'BLACKTIP REEF SHARK', 0, 1.55, { h: 0.1, board: K.cream, c: K.navy, border: K.brass, sub: 'CARCHARHINUS MELANOPTERUS', subH: 0.055 }); });
        }
      }
      // the hall's vault: the glass ceiling's brass ribs run on down the walls as pilasters
      for (const z of [-19.15, -22.1, -25.0, -27.9, -30.85]) for (const sx of [1, -1]) if (!(z > -28.4 && z < -25.9)) pbox(B, 'metal', K.brass, 0.1, 5.8, 0.22, sx * 5.97, 2.9, z);
    },
  };

  // ============================================================================================================ gantry
  // the four legs (1.2 m square, 0 → 16.8) as riveted plate columns: corner angles, lacing battens, a granite base and a
  // bracket head; the two longitudinal box girders and the cross girder with flanges and stiffeners; the winch house
  D.aquarium_gantry = {
    desc: 'the feeding gantry over the Great Tank (single, world frame)',
    build(B) {
      const SG = K.seagreen, SD = K.seagreenDk;
      for (const [x, z] of [[5, -11], [-5, -11], [5, 11], [-5, 11]]) {
        B.box('paint', K.granite, 1.7, 0.5, 1.7, x, 0.25, z, { r: 0.04 });
        pbox(B, 'paint', K.graniteLt, 1.5, 0.08, 1.5, x, 0.54, z);
        for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          pbox(B, 'metal', SD, 0.14, 16.3, 0.06, x + cx * 0.62, 8.55, z + cz * 0.56);
          pbox(B, 'metal', SD, 0.06, 16.3, 0.14, x + cx * 0.56, 8.55, z + cz * 0.62);
        }
        for (let y = 1.2; y < 16.5; y += 1.6) for (const s of [-1, 1]) { pbox(B, NS('metal'), SD, 1.26, 0.1, 0.03, x, y, z + s * 0.62); pbox(B, NS('metal'), SD, 0.03, 0.1, 1.26, x + s * 0.62, y, z); }
        B.box('metal', SG, 1.6, 0.35, 1.6, x, 16.62, z, { r: 0.03 });
      }
      for (const x of [5, -5]) {
        pbox(B, 'metal', SD, 1.24, 0.08, 23.4, x, 17.84, 0);
        pbox(B, 'metal', SD, 1.24, 0.08, 23.4, x, 16.76, 0);
        for (let z = -11; z <= 11.01; z += 1.83) for (const s of [-1, 1]) pbox(B, NS('metal'), SD, 0.04, 1.0, 0.1, x + s * 0.52, 17.3, z);
      }
      pbox(B, 'metal', SD, 9.0, 0.08, 1.24, 0, 16.76, 0);
      for (let x = -3.6; x <= 3.61; x += 1.8) for (const s of [-1, 1]) pbox(B, NS('metal'), SD, 0.1, 1.0, 0.04, x, 17.3, s * 0.52);
      // the winch house: a Deco hut with portholes, a door, its roof cap, the lantern and "No. 1"
      pbox(B, 'paint', K.render, 3.06, 2.0, 3.06, 0, 18.82, 0);
      pbox(B, 'paint', K.graniteLt, 3.4, 0.2, 3.4, 0, 19.9, 0);
      pbox(B, 'paint', K.render, 2.2, 0.35, 2.2, 0, 20.17, 0);
      for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) face(B, nx * 1.53, 0, nz * 1.53, nx, nz, () => { porthole(B, -0.55, 18.95, 0.26, { lit: true }); porthole(B, 0.55, 18.95, 0.26, { lit: true }); speed(B, -1.45, 1.45, 18.0, { n: 2, gap: 0.12, t: 0.05 }); });
      face(B, 0, 0, 1.75, 0, 1, () => letters(B, 'No. 1', { h: 0.42, y: 20.0, c: K.brassLt, lit: true, glow: 1.0 }));
      face(B, 0, 0, -1.75, 0, -1, () => letters(B, 'No. 1', { h: 0.42, y: 20.0, c: K.brassLt, lit: true, glow: 1.0 }));
      globe(B, 0, 20.75, 0, 0.2, { glow: 1.4 });
      // the winch drum under the cross girder
      cyl(B, 'metal', K.steelDk, 0.42, 1.5, 0, 16.3, 0, { rz: HP, seg: 16 });
      for (const x of [-0.8, 0.8]) pbox(B, 'metal', SD, 0.1, 0.6, 0.9, x, 16.5, 0);
    },
  };

  // ============================================================================================================ gulper heads
  // the E head (x 9.5 … 12.7, y 0 … 2.4, z ±1.3; neck x 7.4 … 9.5 to 1.9); its mouth ring centre (12.7, 0.8, 0) r 1.06,
  // its sign 1.85 × 0.7 over 1.77 … 2.47 on the face x 12.7: everything stays behind that face above y 1.7
  D.aquarium_gulper = {
    desc: 'a bronze gulper-eel head round the Gulper Run mouth (world frame, the E head)',
    build(B) {
      const BZ = K.bronze, BD = K.bronzeDk, BL = K.bronzeLt;
      // the head's mass: stepped Deco bands round the block (2 cm proud), a brow over the top, a crest fin
      for (const [x0, x1, c] of [[9.5, 10.3, BD], [10.3, 11.4, BZ], [11.4, 12.66, BL]]) {
        pbox(B, 'metal', c, x1 - x0, 2.44, 2.64, (x0 + x1) / 2, 1.22, 0);
      }
      B.add('metal', latheG('brow', [[0, -1.55], [1.32, -1.5], [1.38, -0.9], [1.3, 0.2], [0.9, 1.15], [0, 1.45]], 20), BZ, 11.05, 2.4, 0, { rz: HP, sx: 0.55, sy: 1.0, sz: 1.0 });
      // crest fin along the top: stepped plates
      for (let i = 0; i < 6; i++) pbox(B, 'metal', BL, 0.42, 0.42 - i * 0.05, 0.08, 9.7 + i * 0.48, 3.08 - i * 0.02, 0, { rz: -0.35 });
      // lit eyes in brass bezels on both cheeks
      for (const s of [-1, 1]) {
        B.add('metal', torG(0.22, 0.05, 6, 18), K.brassLt, 11.75, 1.95, s * 1.34, {});
        B.add(NS('glow'), sphG(0.18, 12, 8), '#ffd890', 11.75, 1.95, s * 1.3, { sz: 0.5, glow: 1.6 });
        // gill slits on the neck
        for (let i = 0; i < 3; i++) pbox(B, NS('paint'), K.bronzeDk, 0.08, 1.2, 0.05, 8.2 + i * 0.4, 0.95, s * 1.02, { rz: 0.15 });
      }
      // the neck: bronze bands to the tank glass
      pbox(B, 'metal', BZ, 2.1, 1.92, 2.04, 8.45, 0.96, 0);
      for (const x of [7.8, 8.6, 9.3]) pbox(B, NS('metal'), BD, 0.12, 1.96, 2.08, x, 0.98, 0);
      for (let i = 0; i < 4; i++) pbox(B, 'metal', BL, 0.36, 0.3 - i * 0.05, 0.06, 7.7 + i * 0.5, 2.05, 0, { rz: -0.3 });
      // the jaw: a bronze lip round the mouth ring (its lower two thirds, clear of the sign), needle teeth pointing in
      B.add('metal', torG(1.2, 0.09, 6, 30, PI * 1.25), BL, 12.74, 0.8, 0, { ry: HP, rz: PI * 0.875 });
      for (let i = 0; i < 11; i++) {
        const a = -HP - PI * 0.6 + (i / 10) * PI * 1.2, cz = Math.cos(a), cy = Math.sin(a);
        if (0.8 + cy * 1.12 < 0.06) continue;
        B.add(NS('metal'), cylGeo(0, 0.05, 0.22, 5), K.cream, 12.76, 0.8 + cy * 1.12, cz * 1.12, { rx: Math.atan2(-cz, -cy) });
      }
    },
  };

  // ============================================================================================================ the Great Tank
  D.aquarium_tankframe = {
    desc: "the Great Tank's brass mullions, the rim plates and the furnishings inside (single, world frame)",
    build(B) {
      const R0 = 7.5 / Math.cos(PI / 16);
      for (let k = 0; k < 16; k++) {
        const a = (k + 0.5) * 22.5 * DEG, x = Math.cos(a) * (R0 + 0.01), z = Math.sin(a) * (R0 + 0.01);
        if (Math.abs(z) < 1.7 && Math.abs(x) > 6) continue;     // (where the gulper necks run into the glass)
        B.push(x, 0, z, -a + HP);
        pbox(B, 'metal', K.brass, 0.16, 2.06, 0.12, 0, 1.2, 0.0);
        pbox(B, NS('metal'), K.brassLt, 0.22, 0.08, 0.16, 0, 2.17, 0.0);
        B.pop();
      }
      // a brass band under the deck lid all the way round (behind the glass, its top edge)
      for (let k = 0; k < 16; k++) {
        const a = k * 22.5 * DEG;
        if (k === 0 || k === 8) continue;
        B.push(Math.cos(a) * 7.36, 2.12, Math.sin(a) * 7.36, -a + HP);
        pbox(B, NS('metal'), K.brassDk, 2.9, 0.16, 0.08, 0, 0, 0);
        B.pop();
      }
      // inside (on the sand bed, y −0.6; nothing within 2.5 m of the Gulper Run's axis z 0 or over y 0.8 there): rocks,
      // a coral garden, the bronze diver on his plinth, an amphora
      const rocks = [[-4.6, -3.6, 1.1], [-2.2, -5.6, 0.8], [3.3, -5.2, 1.0], [5.6, -2.9, 0.7], [-5.8, 2.9, 0.9], [-1.6, 5.4, 1.1], [2.6, 5.9, 0.8], [5.2, 3.6, 1.0], [0.4, -6.4, 0.6], [-6.4, -0.0, 0.0]];
      for (const [x, z, s] of rocks) if (s > 0) B.add('paint', H.blobGeo ? tpl2('rk' + s, () => H.blobGeo(1, 2, Math.round(s * 7))) : sphG(1), '#7f7a70', x, -0.62, z, { sx: s * 1.15, sy: s * 0.6, sz: s, ry: x * 3 });
      for (const [x, z] of [[-4.0, -4.6], [3.9, -4.4], [-3.4, 4.8], [4.4, 4.9]]) {
        for (let i = 0; i < 5; i++) B.add('paint', cylGeo(0.03, 0.06, 0.7, 5), i % 2 ? K.coral : K.coralLt, x + Math.cos(i * 1.3) * 0.3, -0.25, z + Math.sin(i * 1.3) * 0.3, { rz: Math.cos(i * 2.1) * 0.5, rx: Math.sin(i * 1.7) * 0.5 });
      }
      // the bronze diver (a statue): boots, suit, the round helmet, on a rock plinth
      B.push(-3.2, -0.6, -4.9, 0.6);
      B.box('paint', '#6f6a62', 1.0, 0.4, 1.0, 0, 0.2, 0, { r: 0.1 });
      for (const s of [-1, 1]) { pbox(B, 'metal', K.bronzeDk, 0.22, 0.75, 0.24, s * 0.15, 0.78, 0); pbox(B, 'metal', K.bronzeDk, 0.26, 0.14, 0.34, s * 0.15, 0.47, 0.05); }
      B.add('metal', sphG(0.32, 12, 8), K.bronze, 0, 1.45, 0, { sy: 1.25, sx: 1.05 });
      for (const s of [-1, 1]) rod(B, 'metal', K.bronze, [s * 0.3, 1.6, 0], [s * 0.42, 1.15, 0.15], 0.08);
      B.add('metal', sphG(0.3, 14, 10), K.bronzeLt, 0, 2.05, 0, {});
      B.add('metal', torG(0.12, 0.03, 6, 14), K.brassLt, 0, 2.05, 0.28, {});
      B.add(NS('gloss'), cylGeo(0.11, 0.11, 0.03, 14), '#2c3c44', 0, 2.05, 0.29, { rx: HP });
      B.pop();
      // an amphora on its side by the far rocks
      B.add('paint', latheG('amph', [[0, 0], [0.18, 0.05], [0.26, 0.35], [0.2, 0.7], [0.08, 0.82], [0.1, 0.92], [0, 0.92]], 12), '#a67c5b', 4.6, -0.42, 2.4, { rz: HP, ry: 0.7 });
    },
  };
  const _tpl2 = new Map();
  function tpl2(k, f) { let g = _tpl2.get(k); if (!g) { g = f(); _tpl2.set(k, g); } return g; }

  // ============================================================================================================ colonnade
  D.aquarium_lampcol = {
    desc: 'a fluted brass lamp column with its globe (pos = the column foot on the plinth, 0.45)',
    build(B) {
      B.add('paint', cylGeo(0.62, 0.68, 0.36, 20), K.granite, 0, 0.18, 0, {});
      B.add('metal', latheG('colflute', [[0.6, 0], [0.5, 0.25], [0.46, 0.4], [0.44, 4.1], [0.52, 4.35], [0.66, 4.5], [0.66, 4.62], [0, 4.62]], 20), K.brass, 0, 0.36, 0, {});
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; pbox(B, NS('metal'), K.brassDk, 0.05, 3.7, 0.05, Math.cos(a) * 0.45, 2.55, Math.sin(a) * 0.45, { ry: -a }); }
      globe(B, 0, 5.4, 0, 0.3, { glow: 1.35 });
    },
  };
  // the Reef Hall canopy's court fascia: speed lines and the REEF HALL letters standing on its edge (world frame)
  D.aquarium_canopy = {
    desc: 'the Reef Hall canopy dressing (world frame, Alpha)',
    build(B, o) {
      const n = 12, a0 = -70, a1 = -12, da = (a1 - a0) / n, h = (Math.abs(da) * DEG) / 2;
      for (let i = 0; i < n; i++) {
        const a = a0 + da * (i + 0.5), L = 2 * 30.5 * Math.sin(h), [x, z] = pol(a, 25.5);
        face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => {
          speed(B, -L / 2 - 0.01, L / 2 + 0.01, 4.82, { n: 3, gap: 0.12, t: 0.04, d: 0.03, mat: 'metal', c: K.brass });
          // pendant globes under the canopy, 1.5 m in
          globe(B, 0, 4.2, -1.6, 0.16, { glow: 1.2 });
          rod(B, 'metal', K.brass, [0, 4.4, -1.6], [0, 4.6, -1.6], 0.02);
        });
      }
      for (const [a, t] of [[-40.4, o.label || 'REEF HALL']]) {
        const [x, z] = pol(a, 25.6);
        face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => letters(B, t, { h: 0.5, y: 5.44, c: K.brassLt, lit: true, glow: 1.1, track: 0.18 }));
      }
    },
  };

  // ============================================================================================================ Reef Window
  // The 40 m curved window r 30.5 → 32.5 (its block is collision-only): the granite base under the glass (0 → 0.6), the
  // render band over it (3.4 → 5.0, under the canopy), brass mullions at every segment joint, the outer wall on the sea
  // side (r 32.3 → 32.5, −2 → 5.0); inside on the tank's floor (0.6) rocks, coral heads, the moray's pipe, the octopus's
  // den with its sign. (Glass, water and the reef fish: backdrop.js)
  D.aquarium_reefwindow = {
    desc: "the Reef Window's frame and reef (world frame, Alpha)",
    build(B, o) {
      const runs = o.runs || [[-70, -67, 1], [-58, -2.6, 14]];
      for (const [a0, a1, n] of runs) {
        arcBand(B, 'paint', K.granite, 30.45, 32.5, a0, a1, -0.1, 0.62, K.granite, n);
        arcBand(B, 'paint', K.render, 30.45, 32.5, a0, a1, 3.38, 5.0, K.render, n);
        arcBand(B, 'paint', K.render, 32.3, 32.55, a0, a1, -2.2, 5.02, K.render, n);
        arcBand(B, 'gloss', K.faience, 30.4, 30.47, a0, a1, 3.48, 3.56, K.faience, n);
        arcBand(B, NS('metal'), K.brass, 30.4, 30.48, a0, a1, 0.58, 0.66, K.brass, n);
        arcBand(B, NS('metal'), K.brass, 30.4, 30.48, a0, a1, 3.34, 3.42, K.brass, n);
        // the sand floor of the tank and its back wall's painted deep (dark, behind the reef)
        arcBand(B, 'paint', K.sand, 30.55, 32.3, a0, a1, 0.55, 0.64, K.sand, n);
        arcBand(B, 'paint', '#1d3a44', 32.22, 32.3, a0, a1, 0.6, 3.4, '#1d3a44', n);
        const da = (a1 - a0) / n;
        for (let i = 0; i <= n; i++) {
          const a = a0 + da * i, [x, z] = pol(a, 30.44);
          face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => pbox(B, 'metal', K.brass, 0.12, 2.8, 0.1, 0, 2.0, 0));
        }
        // the reef inside: rocks and coral heads along the back, every segment a little different
        for (let i = 0; i < n; i++) {
          const a = a0 + da * (i + 0.5), rr = 31.6;
          for (let k = 0; k < 3; k++) {
            const ak = a + da * (k - 1) * 0.3, rk = rr + ((i + k) % 3) * 0.2 - 0.1, [x, z] = pol(ak, rk), s = 0.35 + ((i * 7 + k * 3) % 5) * 0.08;
            B.add('paint', tpl2('rr' + ((i + k) % 4), () => (H.blobGeo ? H.blobGeo(1, 2, 31 + ((i + k) % 4)) : sphG(1))), k === 1 ? '#8c7f73' : '#77706a', x, 0.6, z, { sx: s * 1.4, sy: s * (1 + (k % 2)), sz: s, ry: i + k });
            const cc = [K.coral, '#c4a07c', '#a79bb8', '#d9b9a0', '#9fb39a'][(i + k) % 5];
            for (let j = 0; j < 4; j++) B.add('paint', cylGeo(0.02, 0.05, 0.45 + 0.1 * (j % 3), 5), cc, x + Math.cos(j * 1.7) * 0.18, 0.6 + s * 1.2 + 0.15, z + Math.sin(j * 1.7) * 0.18, { rz: Math.cos(j * 2.3) * 0.5, rx: Math.sin(j * 1.9) * 0.5 });
            if ((i + k) % 3 === 0) B.add('paint', sphG(0.22, 10, 6), '#c4b48a', x + 0.3, 0.75, z, { sy: 0.7 });   // a brain coral
          }
        }
        if (o.moray && a0 < -50) {
          // the moray's pipe (a terracotta drain on the sand) with its head out, and the octopus's den
          const [x, z] = pol(-31, 31.4);
          face(B, x, 0, z, -Math.cos(-31 * DEG), -Math.sin(-31 * DEG), () => {
            B.add('paint', cylGeo(0.22, 0.22, 1.0, 12, true), '#9c6a4c', 0, 0.85, 0, { rz: HP });
            B.add('paint', sphG(0.17, 10, 8), '#6b6a3a', 0.55, 0.85, 0.02, { sx: 1.5 });
            B.add(NS('paint'), sphG(0.03, 6, 4), '#e8e2c0', 0.66, 0.92, 0.13, {});
          });
          const [x2, z2] = pol(-47, 31.5);
          face(B, x2, 0, z2, -Math.cos(-47 * DEG), -Math.sin(-47 * DEG), () => {
            B.add('paint', tpl2('den', () => (H.blobGeo ? H.blobGeo(1, 2, 77) : sphG(1))), '#6e6760', 0, 0.6, -0.1, { sx: 1.0, sy: 0.75, sz: 0.6 });
            B.add('paint', sphG(0.3, 8, 6, PI / 2), '#24201e', 0, 0.62, 0.42, { sy: 0.9 });
            B.add('paint', sphG(0.16, 10, 8), '#b46e4e', 0.05, 0.78, 0.48, {});
            for (const s of [-1, 1]) B.add(NS('paint'), sphG(0.035, 6, 4), '#e7d9a7', 0.05 + s * 0.07, 0.83, 0.6, {});
          });
          // the den's plate on the glass sill: PLEASE DO NOT DISTURB: SHY
          const [x3, z3] = pol(-47, 30.38);
          face(B, x3, 0, z3, -Math.cos(-47 * DEG), -Math.sin(-47 * DEG), () => sign(B, 'PLEASE DO NOT DISTURB: SHY', 0, 0.68, { h: 0.075, board: K.cream, c: K.navy, border: K.brass, pad: 0.06, track: 0.1 }));
          const [x4, z4] = pol(-26, 30.38);
          face(B, x4, 0, z4, -Math.cos(-26 * DEG), -Math.sin(-26 * DEG), () => sign(B, 'REEF WINDOW · DO NOT TAP THE GLASS', 0, 0.68, { h: 0.075, board: K.navy, c: K.cream, border: K.brass, pad: 0.06, track: 0.1 }));
        }
      }
    },
  };

  // ============================================================================================================ kelp drum
  D.aquarium_drum = {
    desc: "the E kelp drum's crown, ladder, plant room and Kelp stop dressing (world frame; the twin dresses the W drum)",
    build(B) {
      const cx = 25, cz = 0;
      // the riveted crown: rings over and under the level's brass band, a stepped Deco crest
      B.add('metal', torG(4.63, 0.07, 6, 48), K.brassLt, cx, 10.66, cz, { rx: HP });
      B.add('metal', torG(4.63, 0.07, 6, 48), K.brassLt, cx, 9.38, cz, { rx: HP });
      B.add('metal', torG(4.64, 0.04, 6, 48), K.brassDk, cx, 10.0, cz, { rx: HP });
      // the granite foot's brass kerb and the glass's brass base ring
      B.add('metal', torG(4.55, 0.05, 6, 48), K.brass, cx, 0.42, cz, { rx: HP });
      // the keepers' ladder on the sea side, from the plant room's roof (6.0) to the crown
      B.push(cx + 4.72, 0, cz + 0.6, 0);
      for (const s of [-0.22, 0.22]) pbox(B, 'metal', K.steelDk, 0.05, 5.0, 0.05, 0, 8.4, s);
      for (let y = 6.2; y < 10.8; y += 0.3) pbox(B, NS('metal'), K.steelDk, 0.04, 0.04, 0.44, 0, y, 0);
      for (const s of [-0.22, 0.22]) rod(B, 'metal', K.steelDk, [0, 10.9, s], [-0.35, 11.2, s], 0.025);
      B.pop();
      // the plant room (x ≥ 29): its balcony wall's vent (2.4 m over the balcony), a door on the arcade side, pipes into
      // the drum, PLANT ROOM stencil, roof cowls and a header tank
      face(B, 29.0, 0, 0.6, -1, 0, () => {
        pbox(B, 'paint', K.steelDk, 1.4, 0.9, 0.06, 0.2, 4.6, 0.03);
        for (let i = 0; i < 6; i++) pbox(B, NS('metal'), K.steel, 1.3, 0.05, 0.08, 0.2, 4.25 + i * 0.14, 0.06, { rx: 0.5 });
        speed(B, -1.3, 1.3, 5.5, { n: 2, gap: 0.12, t: 0.05 });
      });
      face(B, 30.6, 0, -1.5, 0, -1, () => {
        pbox(B, 'paint', '#5f7f75', 1.0, 2.1, 0.06, -0.3, 1.05 + 2.6, 0.03);
        letters(B, 'PLANT ROOM', { h: 0.16, x: -0.3, y: 2.65 + 2.25, z: 0.06, c: K.ink, flat: true, mat: 'paint' });
      });
      // pipes from the plant room into the drum's foot (over the balcony's wall line, behind the drum)
      rod(B, 'metal', K.steel, [29.05, 5.2, -1.0], [29.3, 5.2, -1.0], 0.18, { seg: 10 });
      for (const [x, z, h] of [[31.6, -0.7, 0.9], [30.2, 0.6, 0.7]]) cyl(B, 'metal', K.steel, 0.32, h, x, 6.0 + h / 2, z, { seg: 12 });
      for (const [x, z] of [[31.6, -0.7], [30.2, 0.6]]) B.add('metal', sphG(0.36, 12, 6, HP), K.steel, x, 6.9 - (x > 31 ? 0 : 0.2), z, {});
      pbox(B, 'paint', K.render, 1.6, 0.9, 1.0, 31.3, 6.45, 0.4);
      // the Kelp stop (x 26.2 … 28.6, z −4.6 … −2.8, top 2.6; its mouth faces −z): a Deco cap over it, brass side panels
      pbox(B, 'metal', K.brass, 2.5, 0.12, 1.9, 27.4, 2.66, -3.7);
      B.box('paint', K.render, 2.3, 0.3, 1.6, 27.4, 2.87, -3.62, { r: 0.08 });
      for (const y of [2.7, 2.83]) pbox(B, NS('gloss'), K.faience, 2.32, 0.03, 1.62, 27.4, y + 0.1, -3.62);
      face(B, 26.18, 0, -3.7, -1, 0, () => { pbox(B, 'metal', K.brassDk, 1.6, 2.4, 0.03, 0, 1.3, 0.015); roundel(B, 0, 1.45, 0.38, ['KELP', 'LINE'], { field: K.navy }); });
      // the pump housing beside it: a green-painted pump casing with a gauge
      face(B, 29.5, 0, -4.62, 0, -1, () => {
        pbox(B, 'paint', '#5f7f75', 1.7, 2.5, 0.04, 0, 1.3, 0.02);
        for (let i = 0; i < 5; i++) pbox(B, NS('metal'), K.steelDk, 1.5, 0.04, 0.05, 0, 0.5 + i * 0.4, 0.05);
        B.add('metal', torG(0.16, 0.03, 6, 16), K.brass, 0.5, 2.15, 0.06, {});
        B.add(NS('glow'), cylGeo(0.14, 0.14, 0.02, 14), K.cream, 0.5, 2.15, 0.05, { rx: HP, glow: 0.8 });
      });
    },
  };

  // ============================================================================================================ promenade
  D.aquarium_promenade = {
    desc: "the SW Sea Promenade's dressing (world frame, Alpha)",
    build(B, o) {
      // brass handrails along the balustrade tops (3.3) and the Lookout's (4.5)
      for (const [a0, a1, y, r] of [[-163.6, -160.2, 3.32, 21.2], [-133, -117, 3.32, 21.2], [-143.3, -139.7, 4.52, 21.6]]) {
        const P = pol(a0, r), Q = pol(a1, r), n = Math.max(1, Math.round(Math.abs(a1 - a0) / 3.5));
        for (let i = 0; i < n; i++) { const A = pol(a0 + ((a1 - a0) * i) / n, r), C = pol(a0 + ((a1 - a0) * (i + 1)) / n, r); handrail(B, [A[0], y + 0.05, A[1]], [C[0], y + 0.05, C[1]], { balls: i === 0 || i === n - 1 ? true : false, r: 0.035 }); }
        void P; void Q;
      }
      // the Lookout's SEA PROMENADE letters on its balustrade, facing the court
      { const a = -141.5, [x, z] = pol(a, 21.38); face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => letters(B, o.label || 'SEA PROMENADE', { h: 0.2, y: 4.18, z: 0.01, c: K.brassDk, flat: true, mat: 'paint', track: 0.16 })); }
      // three coin telescopes on the telescope bay (3.0), at the sea rail
      for (const da of [-3.6, 0, 3.6]) {
        const a = -145 + da, [x, z] = pol(a, 30.2);
        B.push(x, 3.0, z, -(a + 180) * DEG + HP);
        cyl(B, 'metal', K.seagreenDk, 0.07, 1.0, 0, 0.5, 0, { seg: 8 });
        B.box('metal', K.seagreen, 0.26, 0.32, 0.22, 0, 1.12, 0, { r: 0.04 });
        cyl(B, 'metal', K.brass, 0.09, 0.7, 0, 1.32, 0.12, { rx: HP + 0.25, seg: 12, rt: 0.06 });
        B.add('metal', torG(0.095, 0.02, 6, 12), K.brassLt, 0, 1.41, 0.46, { rx: 0.25 });
        B.pop();
      }
      // the Jelly Gallery's portholes on the promenade's sea face (r 31.4, −0.6 → 1.6 over the sea), lit at dusk
      for (let a = -169; a <= -112; a += 3.2) {
        if (a > -125 && a < -115) continue;   // (the Penguin Steps)
        if (a > -134.6 && a < -129.4) continue;   // (the deep Kelp stop)
        const [x, z] = pol(a, 31.42);
        face(B, x, 0, z, Math.cos(a * DEG), Math.sin(a * DEG), () => { porthole(B, 0, 0.55, 0.34, { lit: true, glowK: 0.9 }); });
      }
      arcBand(B, 'paint', K.granite, 31.35, 31.7, -171, -110, -2.0, -0.95, K.granite, 0);
      // the deep Kelp stop (radial at α −132, r 28.3 → 33.2, top 5.0; its mouth at r 28.3 faces the court): a Deco cap
      {
        const a = -132, [x, z] = pol(a, 30.75);
        B.push(x, 0, z, -a * DEG + HP);
        B.box('paint', K.render, 2.6, 0.34, 5.1, 0, 5.17, 0, { r: 0.08 });
        for (const y of [5.06, 5.19]) pbox(B, NS('gloss'), K.faience, 2.62, 0.03, 5.12, 0, y, 0);
        for (const s of [-1, 1]) face(B, s * 1.22, 0, 0.6, s, 0, () => { pbox(B, 'metal', K.brassDk, 3.2, 3.6, 0.03, 0, 3.0, 0.015); roundel(B, 0, 3.3, 0.42, ['KELP', 'LINE'], { field: K.navy }); });
        B.pop();
      }
    },
  };

  // ============================================================================================================ Ticket Hall
  D.aquarium_tickethall = {
    desc: 'the Ticket Hall pavilion (world frame, Alpha)',
    build(B, o) {
      for (const [x, z] of [[3.0, -39.3], [9.7, -39.3], [3.0, -45.7], [9.7, -45.7]]) {
        B.add('paint', cylGeo(0.42, 0.46, 0.3, 16), K.granite, x, 1.35, z, {});
        B.add('metal', latheG('thcol', [[0.38, 0], [0.38, 4.5], [0.46, 4.75], [0.56, 4.95], [0.56, 5.1], [0, 5.1]], 16), K.brass, x, 1.5, z, {});
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; pbox(B, NS('metal'), K.brassDk, 0.04, 4.3, 0.04, x + Math.cos(a) * 0.385, 3.75, z + Math.sin(a) * 0.385, { ry: -a }); }
      }
      // the glass canopy's brass frame (x 2.5 … 10.2, z −46.2 … −38.8, 6.6 … 6.8) and its glazing bars
      for (const z of [-46.25, -38.75]) pbox(B, 'metal', K.brass, 7.85, 0.26, 0.1, 6.35, 6.7, z);
      for (const x of [2.45, 10.25]) pbox(B, 'metal', K.brass, 0.1, 0.26, 7.6, x, 6.7, -42.5);
      for (let x = 3.4; x < 10.0; x += 0.95) pbox(B, NS('metal'), K.brassDk, 0.05, 0.04, 7.4, x, 6.82, -42.5);
      // TICKET HALL on both fascias (the station clock stands on the booth: on the canopy it sat in the spawn's view of the
      // South Gate's shark window — LEAD-NOTES 2026-10-09 item 2)
      {
        face(B, 6.35, 0, -38.68, 0, 1, () => letters(B, 'TICKET HALL', { h: 0.32, y: 6.86, z: 0, c: K.brassLt, lit: true, glow: 1.0, track: 0.16 }));
        face(B, 6.35, 0, -46.32, 0, -1, () => letters(B, 'TICKET HALL', { h: 0.32, y: 6.86, z: 0, c: K.brassLt, lit: true, glow: 1.0, track: 0.16 }));
      }
      // the ticket booth (x 8.2 … 10, z −42 … −40, 1.2 → 3.7): Deco kiosk with a curved glass front, TICKETS lit
      {
        const cx = 9.1, cz = -41.0;
        pbox(B, 'paint', K.render, 1.86, 1.0, 2.06, cx, 1.7, cz);
        pbox(B, 'gloss', K.faience, 1.88, 0.05, 2.08, cx, 2.0, cz);
        pbox(B, NS('gloss'), '#40565f', 1.84, 1.2, 1.96, cx, 2.8, cz);
        for (const z of [-41.98, -40.02]) for (const x of [8.25, 9.1, 9.95]) pbox(B, NS('metal'), K.brass, 0.05, 1.2, 0.05, x, 2.8, z);
        B.box('paint', K.render, 2.1, 0.32, 2.3, cx, 3.58, cz, { r: 0.08 });
        for (const z of [-42.17, -39.83]) face(B, cx, 0, z, 0, z < cz ? -1 : 1, () => letters(B, 'TICKETS', { h: 0.17, y: 3.5, c: K.lit, lit: true, glow: 1.2, flat: true }));
        face(B, 8.18, 0, -41.0, -1, 0, () => sign(B, "TODAY'S FEEDINGS", 0, 2.25, { h: 0.1, board: K.navy, c: K.cream, border: K.brass, w: 1.6, hh: 0.62, sub: '11:00 · 15:00', subH: 0.12, subC: K.brassLt }));
        // the station clock on the booth's roof, double faced (to the plaza and the gate)
        {
          const y = 4.25, r = 0.36;
          pbox(B, 'paint', K.render, 0.5, 0.3, 0.3, cx, 3.85, cz);
          cyl(B, 'paint', K.render, r + 0.07, 0.24, cx, y, cz, { rx: HP, seg: 24 });
          for (const s2 of [-1, 1]) {
            B.add('metal', torG(r + 0.07, 0.03, 6, 24), K.brass, cx, y, cz + s2 * 0.12, {});
            B.add(NS('glow'), cylGeo(r, r, 0.02, 24), K.cream, cx, y, cz + s2 * 0.125, { rx: HP, glow: 0.9 });
            for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; pbox(B, NS('paint'), K.ink, 0.02, i % 3 ? 0.035 : 0.07, 0.01, cx + Math.sin(a) * r * 0.82, y + Math.cos(a) * r * 0.82, cz + s2 * 0.135, { rz: -a }); }
            pbox(B, NS('paint'), K.ink, 0.025, r * 0.55, 0.01, cx - 0.04, y + 0.08, cz + s2 * 0.14, { rz: 0.5 });
            pbox(B, NS('paint'), K.ink, 0.02, r * 0.75, 0.01, cx + 0.05, y - 0.08, cz + s2 * 0.142, { rz: 2.4 });
          }
        }
      }
      // the stair's brass handrails (the stair x 8 … 10, z −36.2 → −39.0: at its two edges, 0.9 m over the treads)
      for (const x of [8.05, 9.95]) handrail(B, [x, 0.95, -36.25], [x, 2.15, -38.95], { r: 0.03 });
    },
  };

  // ============================================================================================================ Pump Hall
  D.aquarium_pumphall = {
    desc: 'the Pump Hall dressing (world frame, Alpha)',
    build(B) {
      // back-wall bays (inner face w): s 3.6 … 10 at 18.9; 10.6 … 19 at 17.4; 19.6 … 21 at 15.9
      const bays = [[3.6, 10, 18.88], [10.6, 19, 17.38], [19.6, 21, 15.88]];
      // pilasters at the bays' ends and every 3 m, pipe runs at 4.2 / 4.6 m, a valve wall with red handwheels
      for (const [s0, s1, w] of bays) {
        for (let s = s0 + 0.4; s <= s1 - 0.3; s += 2.9) bl(B, s, w, 0, () => { pbox(B, 'paint', K.render, 0.5, 6.9, 0.22, 0, 3.45, 0.0); pbox(B, 'gloss', K.faience, 0.52, 0.05, 0.24, 0, 0.8, 0.0); });
        bl(B, (s0 + s1) / 2, w - 0.16, 0, () => {
          const L = s1 - s0 - 0.2;
          // (local: x = +w, z = −s; the wall runs along local z)
          for (const [y, r, c] of [[4.25, 0.16, K.steel], [4.7, 0.12, '#5f7f75'], [5.1, 0.1, K.steelDk]]) {
            rod(B, 'metal', c, [0, y, -L / 2], [0, y, L / 2], r, { seg: 10 });
            for (let z = -L / 2 + 0.5; z < L / 2; z += 1.5) B.add(NS('metal'), cylGeo(r + 0.04, r + 0.04, 0.08, 10), c, 0, y, z, { rx: HP });
          }
        });
      }
      // the valve wall between two pilasters of the long middle bay (s 13.9 … 16.8, over the bund: 2.6 m and up),
      // handwheels, gauges, the PUMP HALL · NO ADMITTANCE stencil and a hazard band (all clear of the pilasters)
      bl(B, 15.35, 17.2, 0, () => {
        B.push(0, 0, 0, -HP);
        pbox(B, 'paint', '#5f7f75', 2.2, 1.3, 0.05, 0, 3.15, 0.0);
        for (let i = 0; i < 2; i++) {
          const x = -0.55 + i * 1.1;
          rod(B, 'metal', K.steel, [x, 2.6, 0.1], [x, 4.2, 0.1], 0.08, { seg: 8 });
          B.add('metal', torG(0.2, 0.03, 6, 16), K.red, x, 3.35, 0.24, {});
          for (let k = 0; k < 3; k++) pbox(B, NS('metal'), K.red, 0.02, 0.4, 0.02, x, 3.35, 0.24, { rz: (k * PI) / 3 });
          B.add('metal', torG(0.11, 0.02, 6, 14), K.brass, x + 0.4, 3.85, 0.1, {}); B.add(NS('glow'), cylGeo(0.1, 0.1, 0.02, 12), K.cream, x + 0.4, 3.85, 0.09, { rx: HP, glow: 0.7 });
        }
        letters(B, 'PUMP HALL', { h: 0.28, y: 5.75, z: 0.02, c: K.ink, flat: true, mat: 'paint', track: 0.16 });
        letters(B, 'NO ADMITTANCE', { h: 0.15, y: 5.45, z: 0.02, c: K.ink, flat: true, mat: 'paint', track: 0.14 });
        for (let i = 0; i < 4; i++) pbox(B, NS('paint'), i % 2 ? K.ink : K.hazard, 0.5, 0.12, 0.02, -0.75 + i * 0.5, 5.25, 0.02);
        B.pop();
      });
      // the sawtooth roof: on each tooth a glazed north light (toward the court) and a sloped steel back
      const teeth = [[3.6, 6.8, 6.9, 19.5], [6.8, 10.0, 6.6, 19.5], [10.0, 13.0, 6.9, 18.0], [13.0, 16.0, 6.6, 18.0], [16.0, 19.0, 6.9, 18.0], [19.0, 21.0, 6.6, 15.9]];
      for (const [s0, s1, top, we] of teeth) {
        const L = we - 6.5, wc = (6.5 + we) / 2, ds = s1 - s0, rise = 0.55;
        bl(B, s0, wc, top, () => {
          // (local z = −s: the tooth's court side is at z = 0, its spawn side at z = −ds)
          pbox(B, NS('gloss'), '#a9c6cc', L, rise, 0.05, 0, rise / 2, -0.03);
          for (let x = -L / 2 + 0.6; x < L / 2; x += 1.2) pbox(B, NS('paint'), K.seagreenDk, 0.05, rise, 0.07, x, rise / 2, -0.04);
          const sl = Math.hypot(ds, rise);
          pbox(B, 'paint', '#a7aeb0', L, 0.05, sl, 0, rise / 2, -ds / 2, { rx: -Math.atan2(rise, ds) });
        });
        bl(B, s0, 6.42, 6.4, () => pbox(B, 'metal', K.steelDk, 0.12, 0.5, ds, 0, 0.0, -ds / 2));
      }
      // the riveted truss along the roof's open edge (w 6.5): top and bottom chords and a Warren web
      bl(B, 12.3, 6.55, 0, () => {
        const L = 17.6;
        pbox(B, 'metal', K.steelDk, 0.18, 0.14, L, 0, 6.33, 0);
        pbox(B, 'metal', K.steelDk, 0.18, 0.14, L, 0, 5.62, 0);
        for (let i = 0; i < 16; i++) { const z0 = -L / 2 + (i * L) / 16, z1 = z0 + L / 16; strut(B, 'metal', K.steelDk, [0, i % 2 ? 6.3 : 5.65, z0], [0, i % 2 ? 5.65 : 6.3, z1], 0.08); }
      });
      // the truss column (s 20): riveted
      { const x = 17.79, z = -45.32; for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pbox(B, 'metal', K.steelDk, 0.1, 6.4, 0.1, x + cx * 0.3, 3.2, z + cz * 0.3); B.box('paint', K.granite, 0.9, 0.3, 0.9, x, 0.15, z, { r: 0.03 }); }
      // industrial lamps hanging from the truss's bottom chord (over the aisle at 5.4 m: the tower passes under at 5.32)
      for (const s of [6.0, 11.0, 16.0]) bl(B, s, 6.55, 0, () => { rod(B, 'metal', K.ink, [0, 5.62, 0], [0, 5.9, 0], 0.015); B.add('metal', latheG('ilamp', [[0.02, 0.18], [0.1, 0.15], [0.26, -0.02], [0.27, -0.04], [0, -0.04]], 14), '#3d5a52', 0, 5.6, 0, {}); B.add(NS('glow'), sphG(0.07, 8, 6), K.lit, 0, 5.53, 0, { glow: 1.6 }); });
      // the sand filters (Ø 2.6, on the bund, to 4.3): riveted tanks, domed tops, gauges, FILTER n
      [[19.11, -33.59], [20.66, -37.89], [22.39, -42.09]].forEach(([x, z], i) => {
        B.add('metal', cylGeo(1.43, 1.43, 3.0, 24), '#8a979b', x, 2.7, z, {});
        B.add('metal', sphG(1.43, 24, 8, HP * 0.6), '#8a979b', x, 4.2, z, { sy: 0.45 });
        for (const y of [1.3, 2.7, 4.1]) B.add(NS('metal'), torG(1.44, 0.04, 4, 32), K.steelDk, x, y, z, { rx: HP });
        // facing the aisle (−w)
        const nx = -C30, nz = -0.5;
        face(B, x + nx * 1.44, 0, z + nz * 1.44, nx, nz, () => {
          letters(B, 'FILTER ' + (i + 1), { h: 0.22, y: 3.3, c: K.ink, flat: true, mat: 'paint', track: 0.12 });
          B.add('metal', torG(0.14, 0.03, 6, 14), K.brass, 0.0, 2.2, 0.04, {});
          B.add(NS('glow'), cylGeo(0.12, 0.12, 0.02, 12), K.cream, 0, 2.2, 0.03, { rx: HP, glow: 0.7 });
        });
      });
      // the forklift with a fish tank (x 10 … 12, z −52.3 … −49.3, to 2.2; facing the Ticket Hall's queue step, −x? it
      // stands along z): mustard body, mast, forks carrying a glass tank with a fish in it
      {
        const x = 11.0, z = -50.8;
        B.box('gloss', K.mustard, 1.6, 0.9, 2.2, x, 0.75, z + 0.3, { r: 0.08 });
        B.box('gloss', K.mustard, 1.5, 0.5, 0.9, x, 1.45, z + 0.75, { r: 0.06 });
        pbox(B, 'metal', K.ink, 1.4, 0.06, 1.1, x, 2.18, z + 0.4);
        for (const [dx, dz] of [[-0.68, -0.2], [0.68, -0.2], [-0.68, 0.95], [0.68, 0.95]]) rod(B, 'metal', K.ink, [x + dx, 1.2, z + dz], [x + dx, 2.15, z + dz], 0.025);
        for (const [dx, dz] of [[-0.62, -0.45], [0.62, -0.45], [-0.62, 1.05], [0.62, 1.05]]) cyl(B, 'paint', K.rubber, 0.3, 0.24, x + dx * 1.05, 0.3, z + dz, { rz: HP, seg: 12 });
        for (const dx of [-0.45, 0.45]) pbox(B, 'metal', K.steelDk, 0.1, 2.0, 0.1, x + dx, 1.05, z - 0.75);
        for (const dx of [-0.3, 0.3]) pbox(B, 'metal', K.steelDk, 0.12, 0.05, 1.0, x + dx, 0.35, z - 1.2);
        pbox(B, 'wood', K.wood, 1.0, 0.12, 1.0, x, 0.43, z - 1.25);
        pbox(B, NS('gloss'), '#9fc3c8', 0.95, 0.75, 0.9, x, 0.87, z - 1.25);
        pbox(B, NS('gloss'), '#2c5866', 0.9, 0.5, 0.85, x, 0.78, z - 1.25);
        B.add(NS('paint'), sphG(0.12, 8, 6), K.coral, x + 0.1, 0.85, z - 1.25, { sx: 1.8 });
      }
      // the GA vent stack over the sea behind the middle bay (s 14.5, w 20.6): Deco fins, GA in brass, a cowl
      bl(B, 14.6, 20.7, 0, () => {
        B.box('paint', K.granite, 2.8, 1.4, 2.4, 0, -1.3, 0, { r: 0.05 });
        B.box('paint', K.render, 2.2, 12.8, 1.8, 0, 5.8, 0, { r: 0.1 });
        for (const x of [-0.75, 0, 0.75]) B.box('paint', K.render, 0.22, 12.0, 0.3, x, 6.0, 1.0, { r: 0.05 });
        for (const y of [3.0, 8.6]) speed(B, -1.1, 1.1, y, { n: 3 });
        B.box('paint', K.graniteLt, 2.6, 0.4, 2.2, 0, 12.4, 0, { r: 0.05 });
        for (let i = 0; i < 4; i++) pbox(B, 'metal', K.steelDk, 2.0, 0.06, 1.6, 0, 12.75 + i * 0.25, 0);
        B.push(0, 0, 1.15, 0);
        letters(B, 'GA', { h: 1.1, y: 9.8, c: K.brassLt, lit: true, glow: 1.0, track: 0.2 });
        B.pop();
      });
    },
  };

  // ============================================================================================================ Fin Pavilion
  // the fin tower (s 43 … 46.5, w ±3, to 18; its front, local +z of the blade frame, faces the deck and the court)
  D.aquarium_fintower = {
    desc: 'the Fin Pavilion: the fin tower with vertical neon AQUARIUM and the pavilion facade over the pier (world frame)',
    build(B) {
      bl(B, 44.75, 0, 0, () => {
        // the fin: stepped Deco slabs (2 cm proud of the block), speed lines, a mast with a flag-light on top
        B.box('paint', K.render, 6.05, 18.05, 3.55, 0, 9.02, 0, { r: 0.12 });
        B.box('paint', K.render, 5.0, 1.2, 2.9, 0, 18.6, 0, { r: 0.1 });
        B.box('paint', K.render, 3.4, 1.0, 2.2, 0, 19.7, 0, { r: 0.1 });
        cyl(B, 'metal', K.brass, 0.08, 4.0, 0, 22.2, 0, { seg: 8 });
        globe(B, 0, 24.3, 0, 0.18, { glow: 1.6 });
        for (const s of [-1, 1]) {
          B.push(0, 0, s * 1.79, s > 0 ? 0 : PI);
          for (const x of [-2.6, 2.6]) B.box('paint', K.render, 0.32, 14.2, 0.18, x, 9.6, 0.06, { r: 0.05 });
          for (const y of [3.0, 3.18, 3.36]) pbox(B, 'gloss', K.faience, 4.8, 0.08, 0.06, 0, y, 0.04);
          // vertical neon AQUARIUM: a navy channel and warm-white letters
          pbox(B, 'paint', K.navy, 1.5, 11.6, 0.06, 0, 10.7, 0.04);
          lettersV(B, 'AQUARIUM', { h: 1.12, gap: 0.3, y: 16.4, z: 0.08, c: K.neon, lit: true, glow: 1.5, wt: 0.16 });
          B.pop();
        }
        for (const s of [-1, 1]) {
          B.push(s * 3.04, 0, 0, s * HP);
          for (let y = 4.0; y < 16; y += 2.4) porthole(B, 0, y, 0.3, { lit: true });
          B.pop();
        }
      });
      // the pavilion's sea face under the deck's back curve: portholes, the entrance doors to the pier, the name
      const back = (w) => 41 + 2 * (1 - (w / 16) ** 2);
      for (let w = -14; w <= 14; w += 2.8) {
        if (Math.abs(w) < 4.5) continue;
        const s = back(w) + 0.02, dsdw = (-4 * w) / 256, nx = 0.5 - C30 * dsdw * 0, a = Math.atan2(1, -dsdw);
        void nx; void a;
        bl(B, s, w, 0, () => { B.push(0, 0, 0, PI); porthole(B, 0, 1.6, 0.36, { lit: true }); B.pop(); });
      }
      bl(B, 46.5, 0, 0, () => {
        B.push(0, 0, 0, PI);
        // the entrance doors to the pier on the fin's sea face, a canopy over them, the name over that
        pbox(B, NS('gloss'), '#3a4c55', 2.8, 2.6, 0.06, 0, 1.3, 0.03);
        for (const x of [-1.4, -0.47, 0.47, 1.4]) pbox(B, NS('metal'), K.brass, 0.08, 2.6, 0.08, x, 1.3, 0.06);
        pbox(B, NS('metal'), K.brass, 2.9, 0.08, 0.08, 0, 2.62, 0.06);
        B.box('paint', K.render, 4.2, 0.22, 1.6, 0, 3.0, 0.8, { r: 0.06 });
        pbox(B, NS('gloss'), K.faience, 4.22, 0.05, 1.62, 0, 2.93, 0.8);
        letters(B, 'GULPER AQUARIUM', { h: 0.36, y: 3.4, z: 0.08, c: K.brassLt, lit: true, glow: 1.1, track: 0.14 });
        B.pop();
      });
    },
  };

  // ============================================================================================================ pier + ferry
  // behind each Fin Pavilion: the ferry pier straight out from the fin's doors (blade s 46.5 → 82, w ±2.5, its deck just
  // over the sea) with lamp posts and a Deco shelter at its head, and the ferry tied up along its east side, a little
  // white Deco steamer with a buff funnel (o.name: MV GULPER / MV BARRELEYE). Out of bounds, scenery only
  D.aquarium_pier = {
    desc: 'the ferry pier and the ferry behind a Fin Pavilion (world frame, Alpha)',
    build(B, o) {
      const name = o.name || 'MV GULPER';
      bl(B, 64.25, 0, 0, () => {
        // (local: x = w, z = −s; the pier runs along z from s 46.5 (z +17.75) to s 82 (z −17.75))
        const L = 35.5;
        pbox(B, 'wood', K.teak, 5.0, 0.22, L, 0, -0.26, 0);
        for (let z = -L / 2 + 0.4; z < L / 2; z += 0.9) pbox(B, 'wood', K.teakDk, 5.02, 0.02, 0.03, 0, -0.14, z);
        for (let z = -L / 2 + 1; z < L / 2; z += 4) for (const x of [-2.3, 2.3]) cyl(B, 'wood', K.woodDk, 0.18, 2.4, x, -1.5, z, { seg: 8 });
        for (let z = -L / 2 + 2; z < L / 2 - 2; z += 7) for (const x of [-2.35, 2.35]) { cyl(B, 'metal', K.ink, 0.06, 3.2, x, 1.45, z, { seg: 8 }); globe(B, x, 3.2, z, 0.18, { glow: 1.3 }); }
        for (let z = -L / 2 + 3; z < L / 2 - 3; z += 6) B.add('metal', latheG('bollard', [[0, 0], [0.18, 0], [0.18, 0.35], [0.24, 0.42], [0.2, 0.48], [0, 0.48]], 10), K.ink, 2.2, -0.15, z, {});
        // the shelter at the pier head
        B.push(0, -0.15, -L / 2 + 2.2, 0);
        B.box('paint', K.render, 4.4, 0.2, 3.4, 0, 2.8, 0, { r: 0.06 });
        for (const [x, z] of [[-2.0, -1.5], [2.0, -1.5], [-2.0, 1.5], [2.0, 1.5]]) cyl(B, 'metal', K.brass, 0.08, 2.7, x, 1.35, z, { seg: 10 });
        pbox(B, 'wood', K.teak, 3.0, 0.08, 0.5, 0, 0.45, -1.2);
        letters(B, 'FERRIES · INKOPOLIS 10 MIN', { h: 0.14, y: 2.65, z: 1.72, c: K.navy, flat: true, mat: 'paint' });
        B.pop();
      });
      // the ferry: along the pier's east side (s 52 … 76, w 3.1 … 8.9)
      bl(B, 64, 6.0, 0, () => {
        // hull (plan outline extruded up from −2.4 to −0.05), a navy boot top, the white sheer stripe, the name
        const prof = [[-12, -2.9], [-12, 2.9], [6, 2.9], [9.6, 2.0], [12, 0], [9.6, -2.0], [6, -2.9]].map(([z, x]) => [z, -x]);
        const hull = H.extrudeGeo(prof, 2.35, 0.08);
        B.add('gloss', hull, K.white, 0, -1.225, 0, { rz: HP });
        B.add('gloss', hull, K.navy, 0, -1.6, 0, { rz: HP, sz: 1.01, sx: 0.4, sy: 1.01 });
        for (const sx of [-1, 1]) {
          for (let z = -9; z <= 5; z += 1.4) { B.push(sx * 2.92, -0.75, z, sx * HP); porthole(B, 0, 0, 0.16, { lit: true }); B.pop(); }
          B.push(sx * 2.92, 0, 1.0, sx * HP); letters(B, name, { h: 0.34, y: -0.5, z: 0.0, c: K.navy, flat: true, mat: 'paint', track: 0.12 }); B.pop();
        }
        // the decks: the saloon (white, ribbon windows), the bridge, the buff funnel, lifeboats, the mast, rails
        B.box('gloss', K.white, 4.9, 2.0, 14.5, 0, 0.95, -2.2, { r: 0.25 });
        for (const sx of [-1, 1]) { pbox(B, NS('gloss'), '#40565f', 0.04, 0.7, 13.0, sx * 2.46, 1.15, -2.2); for (let z = -8.5; z < 4.5; z += 1.6) pbox(B, NS('gloss'), K.white, 0.06, 0.72, 0.12, sx * 2.47, 1.15, z); }
        B.box('gloss', K.white, 4.0, 1.5, 6.0, 0, 2.7, 1.0, { r: 0.2 });
        pbox(B, NS('gloss'), '#40565f', 3.6, 0.55, 0.04, 0, 2.95, 4.02);
        B.box('gloss', K.white, 6.2, 0.12, 2.0, 0, 3.5, 2.6, { r: 0.04 });
        B.add('gloss', cylGeo(0.85, 0.95, 3.2, 18), K.buff, 0, 4.9, -2.4, { rx: -0.15 });
        B.add('gloss', cylGeo(0.87, 0.87, 0.6, 18), K.ink, 0, 6.4, -2.65, { rx: -0.15 });
        for (const sx of [-1, 1]) { B.box('gloss', K.white, 1.0, 0.6, 3.4, sx * 2.1, 2.3, -6.0, { r: 0.25 }); B.box('gloss', K.coral, 1.04, 0.2, 3.44, sx * 2.1, 2.0, -6.0, { r: 0.08 }); }
        cyl(B, 'metal', K.brass, 0.07, 6.0, 0, 6.0, 6.0, { seg: 8 });
        rod(B, 'metal', K.ink, [0, 9.0, 6.0], [0, 3.6, 11.6], 0.015);
        rod(B, 'metal', K.ink, [0, 9.0, 6.0], [0, 2.0, -11.6], 0.015);
        for (let i = 0; i < 9; i++) { const t = i / 8; B.add(NS('glow'), sphG(0.06, 6, 4), K.litWarm, 0, 9.0 - t * 5.2, 6.0 + t * 5.4, { glow: 1.6 }); }
        for (const sx of [-1, 1]) handrail(B, [sx * 2.75, 0.95, -11.6], [sx * 2.75, 0.95, 5.8], { r: 0.025, balls: false });
      });
    },
  };

  // ============================================================================================================ Express stops
  D.aquarium_stops = {
    desc: "the Express's stops (world frame, Alpha): the plaza's IN housing and Penguin Point's OUT housing",
    build(B) {
      // IN: bladeBox(21, 24.5, 12.5, 16.8) to 3.2, its mouth on the w 12.5 face (the riser leaves its top at w 15.9)
      bl(B, 22.75, 14.65, 0, () => {
        B.box('paint', K.render, 4.4, 0.35, 3.6, 0, 3.36, 0, { r: 0.1 });
        for (const y of [3.24, 3.38]) pbox(B, NS('gloss'), K.faience, 4.42, 0.03, 3.62, 0, y, 0);
        // the riser's brass collar and the TUBEWAY roundels on the stop's court (+z) and plaza (−z) faces
        B.add('metal', torG(0.98, 0.1, 8, 28), K.brass, 1.25, 3.6, 0, { rx: HP });
        for (const s of [-1, 1]) { B.push(0, 0, s * 1.77, s > 0 ? 0 : PI); roundel(B, 0, 1.9, 0.62, ['TUBEWAY', '▶ EXPRESS'].map((t) => t.replace('▶ ', '')), { field: K.navy }); speed(B, -2.1, 2.1, 0.62, { n: 3 }); B.pop(); }
        B.push(2.17, 0, 0, HP); pbox(B, 'metal', K.brassDk, 3.4, 2.8, 0.03, 0, 1.6, 0.0); B.pop();
      });
      // OUT: bladeBox(−6, −1.4, −16.2, −13.8) to 5.0, its mouth on the s −6 face (the drop comes in from its top)
      bl(B, -3.7, -15.0, 0, () => {
        B.box('paint', K.render, 2.6, 0.38, 4.8, 0, 5.17, 0, { r: 0.1 });
        for (const y of [5.05, 5.2]) pbox(B, NS('gloss'), K.faience, 2.62, 0.03, 4.82, 0, y, 0);
        B.add('metal', torG(0.98, 0.1, 8, 28), K.brass, 0.7, 5.4, 0, { rx: HP });
        for (const s of [-1, 1]) { B.push(s * 1.22, 0, 0, s * HP); roundel(B, 0, 3.0, 0.58, ['TUBEWAY', 'EXPRESS'], { field: K.navy }); speed(B, -2.2, 2.2, 0.62, { n: 3 }); B.pop(); }
      });
    },
  };
}
