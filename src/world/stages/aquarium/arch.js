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
//   finTower    the entrance pavilion's fin with vertical neon AQUARIUM, its sea facade (doors, portholes, letters), and
//               (fix round 3) the spawn deck's plaza fascia: skirting, pilasters, frieze, portholes, roundels
//   stops       the Express's brass stops (IN and OUT), dressed round their mouths
//   shafts      (fix round 9) the Arch Line's riser shafts: a caged service ladder, guide brackets round the riser, the
//               ARCH LINE · RISER plates, caged bulkhead lamps (their tiled walls and grille floors: floorart.js)
import { LOOKOUT } from './geo.js';
import { PIPES, allLegs, centreline } from './tubeway.js';

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
      // the lid (its ends 5 cm inside the fascias' faces: at 12.6 m it stood 4 cm proud of them, and the raised letters'
      // second strokes — the bowls of P and R, the top of the R — sat behind its front face: "GULꟊEK AQUAKIUM")
      pbox(B, 'paint', K.render, 12.9, 0.26, 12.4, 0, 9.13, -25.0);
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
      // SOUTH GATE over the wing mouth; the two-faced clock on the lid's centre line between the two Tide Gauges (on the
      // wing edge it sat in front of a gauge from the far pad: 1.6° apart, the clock over the tide's world cue — LEAD-
      // REVIEW art round 1; here it is ≥ 4° off both gauges from either pad's camera)
      face(B, 0, 0, -31.26, 0, -1, () => {
        letters(B, label, { h: 0.56, y: 8.58, c: K.brassLt, wt: 0.17, track: 0.2, dep: 0.07, lit: true, glow: 1.2 });
      });
      {
        const y = 10.06, z = -25.0, r = 0.62;
        cyl(B, 'paint', K.render, r + 0.12, 0.34, 0, y, z, { rx: HP, seg: 28 });
        B.add('metal', torG(r + 0.12, 0.05, 6, 28), K.brass, 0, y, z - 0.17, {});
        B.add('metal', torG(r + 0.12, 0.05, 6, 28), K.brass, 0, y, z + 0.17, {});
        pbox(B, 'paint', K.render, 0.5, 0.2, 0.3, 0, 9.36, z);
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
        // (fix round 6, LEAD-REVIEW 6: the west pylon's radial face onto the promenade — 10 × 6.6 m of plain render over the
        // Penguin Steps' head) fluted render ribs up it as on its wing face (clear of the Arch Line's mouth at r 28 and its
        // sign), and between the first two a roundel plaque with the coiled gulper and the gate's name
        if (sx < 0) {
          const nx = Math.cos((aOut - 90) * DEG), nz = Math.sin((aOut - 90) * DEG), off = 0.4;
          const onFace = (r) => { const [x, z] = pol(aOut, r); return [x + nx * off, z + nz * off]; };
          for (const r of [21.75, 24.05, 26.0, 30.45]) {
            const [x, z] = onFace(r);
            face(B, x, 0, z, nx, nz, () => { B.box('paint', K.render, 0.34, 6.45, 0.16, 0, 5.625, 0.05, { r: 0.05 }); pbox(B, 'gloss', K.faience, 0.36, 0.05, 0.18, 0, 2.95, 0.06); pbox(B, 'paint', K.granite, 0.38, 0.15, 0.2, 0, 2.475, 0.06); });
          }
          const [x, z] = onFace(22.9);
          face(B, x, 0, z, nx, nz, () => {
            B.add('metal', torG(0.62, 0.06, 6, 32), K.brass, 0, 5.7, 0.1, {});
            B.add('gloss', cylGeo(0.6, 0.6, 0.05, 32), K.navy, 0, 5.7, 0.08, { rx: HP });
            B.add('metal', torG(0.36, 0.055, 6, 24, TAU * 0.86), K.brassLt, 0, 5.82, 0.13, { rz: 0.5 });
            B.add('metal', sphG(0.1, 10, 8), K.brassLt, 0.33, 5.99, 0.14, { sx: 1.4, sy: 0.9 });
            letters(B, label.split(' ')[0], { h: 0.11, y: 5.3, z: 0.11, c: K.cream, flat: true, mat: 'paint', wt: 0.2 });
            letters(B, 'GATE', { h: 0.08, y: 5.17, z: 0.11, c: K.brassLt, flat: true, mat: 'paint', wt: 0.2, track: 0.16 });
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
        // the hall walls: DO NOT TAP THE GLASS plates between the vault's pilasters (the west wall's 2.7 m bay, z −22.2 …
        // −24.9; on the east wall, where the Reef Hall door takes that bay, a two-line plate on the 0.9 m between the door
        // and the pilaster — the plates were cut by a pilaster and hung in the doorway: LEAD-REVIEW art round 1)
        {
          const x = sx * 5.98;
          if (sx < 0) face(B, x, 0, -23.55, -sx, 0, () => { sign(B, 'PLEASE DO NOT TAP THE GLASS', 0, 1.7, { h: 0.11, board: K.navy, c: K.cream, border: K.brass, track: 0.1 }); });
          else face(B, x, 0, -24.45, -sx, 0, () => { sign(B, 'DO NOT TAP', 0, 1.6, { h: 0.1, w: 0.74, hh: 0.42, board: K.navy, c: K.cream, border: K.brass, track: 0.1, sub: 'THE GLASS', subH: 0.08 }); });
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
      const SG = '#2c4f5c', SD = '#213b44';   // (the gantry's own dark, bluer sea-green: layout.js K.gantry)
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
      // the keepers' kit on each leg's face toward the deck (off the floor: the legs are off-limits): a life ring on its
      // hook, FEEDING DECK · KEEPERS ONLY, a coiled hose on its bracket, and a stack of feed buckets on the granite base
      for (const [x, z] of [[5, -11], [-5, -11], [5, 11], [-5, 11]]) {
        const s = z < 0 ? 1 : -1;
        face(B, x, 0, z + s * 0.635, 0, s, () => {
          B.add('gloss', torG(0.3, 0.065, 8, 24), K.white, 0, 1.95, 0.08, {});
          for (let k = 0; k < 4; k++) B.add('gloss', torG(0.302, 0.068, 8, 6, TAU / 12), K.red, 0, 1.95, 0.08, { rz: (k * TAU) / 4 - TAU / 24 });
          rod(B, 'metal', K.steelDk, [0, 2.3, 0.0], [0, 2.3, 0.1], 0.02);
          sign(B, 'FEEDING DECK', 0, 2.55, { h: 0.1, w: 1.0, hh: 0.36, board: K.navy, c: K.cream, border: K.brass, track: 0.12, sub: 'KEEPERS ONLY', subH: 0.07, subC: K.brassLt });
          pbox(B, 'metal', K.steelDk, 0.06, 0.06, 0.22, -0.32, 1.02, 0.11);
          for (let k = 0; k < 4; k++) B.add('gloss', torG(0.17 - k * 0.012, 0.022, 6, 18), '#3f6b4f', -0.32, 0.86, 0.12 + k * 0.035, {});
          for (let k = 0; k < 3; k++) B.add('gloss', latheG('fbucket', [[0, 0], [0.15, 0], [0.19, 0.3], [0.17, 0.3], [0.13, 0.03], [0, 0.03]], 12), [K.seagreen, K.white, K.mustard][k], 0.42, 0.5 + k * 0.1, 0.3, {});
        });
      }
    },
  };

  // ============================================================================================================ deck stair trim
  // the deck stair's two flanks (layout.js radRamp(−135, 13.5 → 7.2, 0 → 2.4, 4.0 wide); the twin turns it to +45): a
  // brass string-course 3.4 cm proud along each flank's raked top edge, from the tank's glass (t 7.48 along the stair's
  // axis) to where it meets the court floor (t 13.27); floorart.js draws the render, the speed lines under it, the
  // skirting and the portholes on the face itself (under the ink). Visual only (LEAD-REVIEW art round 2: the flanks were
  // bare grey slabs in mid)
  D.aquarium_stairtrim = {
    desc: "the deck stair's flank string-courses (world frame, Alpha's stair; the twin is Bravo's)",
    build(B) {
      const ax = [-Math.SQRT1_2, -Math.SQRT1_2], pr = [Math.SQRT1_2, -Math.SQRT1_2], rake = Math.atan2(2.4, 6.3);
      const t0 = 7.48, t1 = 13.27, tm = (t0 + t1) / 2, ys = (t) => (2.4 * (13.5 - t)) / 6.3, L = (t1 - t0) / Math.cos(rake);
      for (const sg of [1, -1]) {
        const l = sg * 2.017, x = tm * ax[0] + l * pr[0], z = tm * ax[1] + l * pr[1];
        face(B, x, 0, z, sg * pr[0], sg * pr[1], () => {
          pbox(B, 'metal', K.brass, L, 0.065, 0.034, 0, ys(tm) - 0.0535, 0, { rz: -sg * rake });
          pbox(B, NS('metal'), K.brassDk, L, 0.012, 0.04, 0, ys(tm) - 0.0535 - 0.034 / Math.cos(rake), 0.002, { rz: -sg * rake });
        });
      }
    },
  };

  // ============================================================================================================ gulper heads
  // The E head fills its collision block (x 9.5 … 12.7, y 0 … 2.4, z ±1.3; `hidden` since art round 1, like every other
  // stand-in the dressing draws) and the neck's (x 7.4 … 9.5 to 1.9, z ±1.0). The Gulper Run's mouth is the engine's: its
  // white ring (r 0.885 … 1.055) and dark bore at x 12.73, its sign 0.14 m in front of the face over y 1.78 … 2.47 — the
  // head stays behind x 12.66 inside r 1.06, and its upper jaw arches over the ring behind the sign.
  //   skull   a lofted Deco eel skull: widest and highest over the brow (x 10.4: ±1.30, 2.40), tapering to the snout
  //           (x 12.62: ±1.12, 2.0); patinated bronze, darker toward the floor, verdigris in its stepped crown bands
  //   jaws    the upper jaw a heavy bronze arch over the ring with needle teeth hanging into the gape; the lower jaw bones
  //           running from the hinge behind the eyes down to the chin at the floor, teeth standing up along them
  //   eyes    lit amber eyes in brass bezels set into the cheeks under a brow ridge; gill covers and slits behind them
  //   crest   a Deco dorsal crest of graduated fins from the crown along the neck
  //   neck    the eel's body: a ringed bronze tube dipping from the skull into the tank glass
  const THREE = KIT.THREE;
  const loftCache = new Map();
  // a lofted shell (open at the floor): sections [x, hw, top, rc, bot?] in x order; each a rounded rectangle in the y-z
  // plane (top corners of radius rc); vertex colours from shade(y, x); end caps optional ('front' at the last section)
  function loft(key, secs, shade, caps = {}) {
    let g = loftCache.get(key); if (g) return g;
    const ring = (hw, top, rc, bot) => {
      const pts = [], nArc = 6;
      pts.push([-hw, bot]);
      for (let i = 0; i <= nArc; i++) { const a = Math.PI - (i / nArc) * (Math.PI / 2); pts.push([-hw + rc + Math.cos(a) * rc, top - rc + Math.sin(a) * rc]); }
      for (let i = 0; i <= nArc; i++) { const a = Math.PI / 2 - (i / nArc) * (Math.PI / 2); pts.push([hw - rc + Math.cos(a) * rc, top - rc + Math.sin(a) * rc]); }
      pts.push([hw, bot]);
      return pts;
    };
    const P = [], C = [], I = [];
    const rings = secs.map(([x, hw, top, rc, bot = 0]) => ring(hw, top, rc, bot).map(([z, y]) => [x, y, z]));
    const m = rings[0].length;
    for (const r of rings) for (const [x, y, z] of r) { P.push(x, y, z); const c = shade(y, x, z); C.push(c[0], c[1], c[2]); }
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < m - 1; i++) { const a = k * m + i, b = a + 1, c = a + m, d = c + 1; I.push(a, b, c, b, d, c); }
    const fan = (k, sign) => {
      const r = rings[k], o = P.length / 3, cx = r[0][0], cy = (r[0][1] + Math.max(...r.map((q) => q[1]))) / 2;
      P.push(cx, cy, 0); const c0 = shade(cy, cx, 0); C.push(c0[0], c0[1], c0[2]);
      for (let i = 0; i < m; i++) { P.push(...r[i]); const c = shade(r[i][1], cx, r[i][2]); C.push(c[0], c[1], c[2]); }
      for (let i = 0; i < m - 1; i++) { if (sign > 0) I.push(o, o + 1 + i, o + 2 + i); else I.push(o, o + 2 + i, o + 1 + i); }
      I.push(...(sign > 0 ? [o, o + m, o + 1] : [o, o + 1, o + m]));
    };
    if (caps.front) fan(rings.length - 1, 1);
    if (caps.back) fan(0, -1);
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((P.length / 3) * 2), 2));
    g.setIndex(I);
    g.computeVertexNormals();
    loftCache.set(key, g);
    return g;
  }
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const BRZ = lin('#a07a46'), BRZ_D = lin('#5e4628'), BRZ_L = lin('#c8a062'), VERD = lin('#6f9a86');
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const bronzeShade = (y, x, z, topY = 2.4) => {
    const t = Math.max(0, Math.min(1, y / topY));
    let c = mix3(BRZ_D, BRZ, Math.min(1, t * 1.6));
    c = mix3(c, BRZ_L, Math.max(0, t - 0.7) * 2.2);
    return c;
  };
  D.aquarium_gulper = {
    desc: 'a bronze gulper-eel head round the Gulper Run mouth (world frame, the E head)',
    build(B) {
      const W1 = '#ffffff';
      // ---- the skull
      const SK = [[9.5, 1.2, 2.18, 0.75], [9.85, 1.28, 2.34, 0.8], [10.4, 1.3, 2.4, 0.85], [11.0, 1.29, 2.38, 0.85], [11.6, 1.25, 2.3, 0.8], [12.15, 1.19, 2.18, 0.7], [12.5, 1.14, 2.06, 0.6], [12.64, 1.12, 2.0, 0.58]];
      B.add('metal', loft('gskull', SK.map(([x, hw, t, rc]) => [x, hw, t, rc, -0.02]), (y, x, z) => bronzeShade(y, x, z), { front: true, back: true }), W1, 0, 0, 0, {});
      // the crown's stepped Deco bands (a raised ring every 0.6 m over the brow, verdigris in their recess)
      for (const [x, hw, t, rc] of [[10.05, 1.3, 2.39, 0.82], [10.7, 1.31, 2.41, 0.86], [11.35, 1.28, 2.35, 0.83]]) {
        B.add('metal', loft('gband' + x, [[x - 0.06, hw + 0.035, t + 0.035, rc + 0.02, 0.3], [x + 0.06, hw + 0.035, t + 0.035, rc + 0.02, 0.3]], (y) => mix3(BRZ_L, VERD, 0.25 + 0.2 * (1 - y / 2.4))), W1, 0, 0, 0, {});
      }
      // a raised spine along the crown and two flanking ribs (the Deco "speed" on the bronze)
      for (const z of [-0.42, 0, 0.42]) {
        const h = z === 0 ? 0.07 : 0.045;
        const tops = SK.map(([x, hw, t, rc]) => [x, t - (Math.abs(z) > 0.01 ? Math.max(0, Math.abs(z) - (hw - rc)) ** 2 / (2 * rc) : 0)]);
        for (let i = 1; i < tops.length - 1; i++) strut(B, 'metal', K.bronzeLt, [tops[i][0], tops[i][1] + h * 0.4, z], [tops[i + 1][0], tops[i + 1][1] + h * 0.4, z], 0.06, { h });
      }
      // ---- the dorsal crest: graduated fins from the crown back along the neck (thin bronze plates, raked back)
      for (let i = 0; i < 7; i++) {
        const x = 11.25 - i * 0.48, base = i < 4 ? 2.38 - Math.max(0, (11.0 - x)) * 0.1 : 1.86 - (9.4 - x) * 0.12, h = 0.42 - i * 0.035;
        B.add('metal', H.extrudeGeo([[-0.22, 0], [0.2, 0], [-0.1, h]], 0.07, 0.012), K.bronzeLt, x, base - 0.04, 0, { ry: HP });
      }
      // ---- the upper jaw: a heavy arch over the ring (its front at x 12.74, behind the sign at 12.84), the jaw's side
      // tips standing out of the face left and right of the ring (to x 12.86: they stood 0.4 m out, on the mouth's approach —
      // LEAD-REVIEW art round 2), a fang hanging from each; teeth into the gape
      B.add('metal', torG(1.28, 0.2, 10, 32, PI * 0.92), '#a8814a', 12.62, 0.8, 0, { ry: HP, rz: PI * 0.04, sz: 0.6 });
      B.add('metal', torG(1.5, 0.06, 6, 30, PI * 0.84), K.brassLt, 12.6, 0.8, 0, { ry: HP, rz: PI * 0.08 });
      for (const s of [-1, 1]) {
        B.add('metal', H.extrudeGeo([[0, 0], [0.22, 0.1], [0.18, 0.62], [0, 1.0]], 0.2, 0.04), '#a8814a', 12.6, 0.95, s * 1.2, { ry: HP });
        B.add('metal', cylGeo(0.07, 0, 0.42, 6), K.cream, 12.78, 0.78, s * 1.13, { rz: s * 0.08 });
      }
      for (let i = 0; i < 13; i++) {
        const a = PI * 0.1 + (i / 12) * PI * 0.8, cz = Math.cos(a), cy = Math.sin(a), r0 = 1.12, len = i % 2 ? 0.17 : 0.24;
        B.add(NS('metal'), cylGeo(0.035, 0, len, 5), K.cream, 12.77, 0.8 + cy * (r0 - len / 2), cz * (r0 - len / 2), { rx: Math.atan2(cz, cy) });
      }
      // ---- the lower jaw: bones from the hinge (behind and under the eye) down to the chin at the floor, a lip along
      // each, teeth standing up and inward along it
      for (const s of [-1, 1]) {
        const P0 = [10.75, 1.3, s * 1.29], P1 = [12.66, 0.16, s * 1.17];
        strut(B, 'metal', K.bronzeLt, P0, P1, 0.24, { w: 0.13, h: 0.46 });
        strut(B, 'metal', K.bronzeDk, [P0[0], P0[1] - 0.26, s * 1.31], [P1[0], P1[1] - 0.2, s * 1.19], 0.08, { w: 0.1, h: 0.08 });
        // the hinge boss
        B.add('metal', sphG(0.2, 12, 8), K.bronzeLt, P0[0], P0[1], s * 1.3, { sz: 0.6 });
        for (let i = 0; i < 7; i++) {
          const t = 0.36 + i * 0.1, x = P0[0] + (P1[0] - P0[0]) * t, y = P0[1] + (P1[1] - P0[1]) * t + 0.2;
          B.add(NS('metal'), cylGeo(0, 0.032, 0.2, 5), K.cream, x, y + 0.08, s * 1.17, { rx: -s * 0.35 });
        }
      }
      // the chin: the lower jaw's bar across the front at the floor, set into the head's face (12.53 … 12.71: it stood
      // 0.4 m out on the mouth's approach, and riders walked through it — LEAD-REVIEW art round 2; the fangs and the jaw
      // bones' ends and the side tips came back with it: nothing of the head stands more than 0.16 m in front of its collider's
      // face at 12.7)
      pbox(B, 'metal', K.bronzeLt, 0.18, 0.12, 2.3, 12.62, 0.06, 0);
      // ---- the eyes: lit amber in brass bezels, a brow ridge over each; gill covers and slits behind
      for (const s of [-1, 1]) {
        const ex = 11.55, ey = 1.55, ez = s * 1.265;
        B.push(ex, ey, ez, s > 0 ? 0 : PI);
        B.add('metal', torG(0.27, 0.07, 8, 22), K.brassLt, 0, 0, 0.03, {});
        B.add('metal', cylGeo(0.27, 0.27, 0.06, 22), K.bronzeDk, 0, 0, 0.0, { rx: HP });
        B.add(NS('glow'), sphG(0.21, 14, 10), '#ffcf7a', 0, 0, 0.04, { sz: 0.45, glow: 1.7 });
        B.add(NS('paint'), sphG(0.07, 8, 6), '#2a1e10', 0.02, 0.0, 0.13, { sx: 0.6, sy: 1.5, sz: 0.4 });
        B.pop();
        strut(B, 'metal', K.bronzeLt, [11.0, 1.93, s * 1.2], [12.05, 1.83, s * 1.13], 0.12, { w: 0.15, h: 0.1 });
        // gill cover: a flattened bronze dome on the cheek behind the jaw's hinge; three gill slits on the neck behind it
        B.add('metal', sphG(0.45, 16, 10, PI / 2), K.bronze, 10.0, 1.0, s * 1.3, { rx: s * HP, sy: 0.2, sz: 1.25 });
        B.add('metal', torG(0.45, 0.03, 6, 20, PI), K.bronzeLt, 10.0, 1.0, s * 1.31, { rz: -HP, sy: 1.25 });
        for (let i = 0; i < 3; i++) pbox(B, NS('paint'), K.bronzeDk, 0.05, 0.95 - i * 0.12, 0.03, 9.36 - i * 0.16, 0.95, s * (1.0 + 0.012 - i * 0.012), { rz: 0.1 });
      }
      // ---- the neck: a ringed bronze tube dipping from the skull into the tank glass (x 9.52 → 7.42)
      const NK = [[7.42, 0.86, 1.55, 0.7], [7.9, 0.9, 1.62, 0.72], [8.4, 0.94, 1.72, 0.74], [8.95, 0.98, 1.82, 0.76], [9.52, 1.0, 1.88, 0.76]];
      B.add('metal', loft('gneck', NK.map(([x, hw, t, rc]) => [x, hw, t, rc, -0.02]), (y, x, z) => bronzeShade(y, x, z, 1.9), {}), W1, 0, 0, 0, {});
      for (const x of [7.75, 8.2, 8.65, 9.1]) {
        const k = (x - 7.42) / (9.52 - 7.42), hw = 0.86 + 0.14 * k, t = 1.55 + 0.33 * k;
        B.add('metal', loft('gnr' + x, [[x - 0.05, hw + 0.03, t + 0.03, 0.74, 0.1], [x + 0.05, hw + 0.03, t + 0.03, 0.74, 0.1]], (y) => mix3(BRZ_D, VERD, 0.35 + 0.25 * (y / 1.9))), W1, 0, 0, 0, {});
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
      // its glazing seen from above (the hero shot and the Lookouts look down on it; its block is glass tile since art
      // round 2): brass glazing bars running out across it every half segment, a brass curb round its court edge
      // (the block's segments alternate their tops 5.3 / 5.4, layout.js arcBand: each bar sits on its own segment's top)
      const topOf = (i) => (Math.min(n - 1, Math.max(0, i)) % 2 ? 5.4 : 5.3);
      for (let i = 0; i <= 2 * n; i++) {
        const a = a0 + (da * i) / 2, [x, z] = pol(a, 28.0), y = i % 2 ? topOf((i - 1) / 2) : Math.max(topOf(i / 2 - 1), topOf(i / 2));
        B.push(x, y + 0.02, z, -a * DEG + HP);
        pbox(B, NS('metal'), i % 2 ? K.brassDk : K.brass, 0.06, 0.05, 5.0, 0, 0, 0);
        B.pop();
      }
      for (let i = 0; i < n; i++) {
        const a = a0 + da * (i + 0.5), [x, z] = pol(a, 25.58);
        B.push(x, topOf(i) + 0.04, z, -a * DEG + HP);
        pbox(B, 'metal', K.brass, 2 * 25.6 * Math.sin(h) + 0.04, 0.08, 0.14, 0, 0, 0);
        B.pop();
      }
      // REEF HALL on a navy Deco board standing on the canopy's edge (without one, the GA stack's letters far behind
      // showed through the gaps from the colonnade and the court: "REEE HALL" — LEAD-REVIEW art round 1)
      for (const [a, t] of [[-40.4, o.label || 'REEF HALL']]) {
        const [x, z] = pol(a, 25.6);
        face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => {
          B.box('paint', K.navy, 3.7, 0.78, 0.08, 0, 5.79, -0.06, { r: 0.03 });
          pbox(B, 'metal', K.brass, 3.76, 0.05, 0.1, 0, 6.19, -0.06);
          pbox(B, 'metal', K.brass, 3.76, 0.05, 0.1, 0, 5.39, -0.06);
          for (const sx of [-1, 1]) { pbox(B, 'metal', K.brass, 0.05, 0.84, 0.1, sx * 1.88, 5.79, -0.06); pbox(B, NS('metal'), K.brassDk, 0.08, 0.5, 0.08, sx * 1.4, 5.15, -0.1); }
          letters(B, t, { h: 0.5, y: 5.53, c: K.brassLt, lit: true, glow: 1.1, track: 0.18 });
        });
      }
    },
  };

  // ============================================================================================================ Reef Window
  // The 40 m curved window r 30.5 → 32.5 (its block is collision-only): the granite base under the glass (0 → 0.6), the
  // render band over it (3.4 → 5.0, under the canopy), brass mullions at every segment joint, the outer wall on the sea
  // side (r 32.3 → 32.5, −2 → 5.0), the den's and the window's signs on the sill. (The reef: looks.js buildExhibits;
  // glass, water and the reef fish: backdrop.js)
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
        // (the sand, the back wall and the reef — rock, corals, fans, sponges, anemones, the moray and the octopus — are
        // looks.js buildExhibits since fix round 3: lit from the window's lid, glowing at dusk, one draw call for both halves)
        const da = (a1 - a0) / n;
        for (let i = 0; i <= n; i++) {
          const a = a0 + da * i, [x, z] = pol(a, 30.44);
          face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => pbox(B, 'metal', K.brass, 0.12, 2.8, 0.1, 0, 2.0, 0));
        }
        if (o.moray && a0 < -50) {
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
      // (fix round 6, LEAD-REVIEW 6: the plant room's face over the Kelp Balcony was render with three lines; DESIGN §5.1:
      // "pumps and a vent in the wall over the balcony") its wall along bearing 15 from the drum (layout.js segBox, 0.8
      // thick, top 6.08; the balcony at 3.6 on its far side): a louvred vent, a pipe run with a valve and a red handwheel
      // overhead, a PLANT ROOM · NO ADMITTANCE plate
      {
        const n = [Math.cos(105 * DEG), Math.sin(105 * DEG)], [x, z] = pol(15, 6.075, [cx + 0.104, cz - 0.386]);
        face(B, x + n[0] * 0.4, 0, z + n[1] * 0.4, n[0], n[1], () => {
          pbox(B, 'paint', K.steelDk, 1.3, 0.95, 0.05, -0.5, 4.62, 0.025);
          pbox(B, NS('metal'), K.steel, 1.38, 0.05, 0.07, -0.5, 5.12, 0.035); pbox(B, NS('metal'), K.steel, 1.38, 0.05, 0.07, -0.5, 4.12, 0.035);
          for (let i = 0; i < 6; i++) pbox(B, NS('metal'), K.steel, 1.22, 0.045, 0.09, -0.5, 4.27 + i * 0.15, 0.07, { rx: 0.55 });
          rod(B, 'metal', K.steel, [-1.62, 5.62, 0.14], [1.62, 5.62, 0.14], 0.075, { seg: 10 });
          for (const xx of [-1.0, 0.6, 1.5]) cyl(B, 'metal', K.steelDk, 0.11, 0.035, xx, 5.62, 0.14, { rz: HP, seg: 12 });
          for (const xx of [-1.35, 0.05, 1.3]) { pbox(B, NS('metal'), K.steelDk, 0.05, 0.22, 0.1, xx, 5.62, 0.06); }
          B.box('metal', '#5f7f75', 0.26, 0.24, 0.24, 0.32, 5.62, 0.16, { r: 0.04 });
          cyl(B, 'metal', K.steelDk, 0.02, 0.18, 0.32, 5.4, 0.16, { seg: 8 });
          B.add('metal', torG(0.13, 0.016, 6, 18), K.red, 0.32, 5.3, 0.16, { rx: HP });
          for (let k = 0; k < 3; k++) pbox(B, NS('metal'), K.red, 0.25, 0.014, 0.016, 0.32, 5.3, 0.16, { ry: (k * PI) / 3 });
          sign(B, 'PLANT ROOM', 0.95, 4.35, { h: 0.1, w: 1.0, hh: 0.36, board: K.cream, c: K.ink, border: K.brass, track: 0.12, sub: 'NO ADMITTANCE', subH: 0.065, subC: K.red });
        });
      }
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
      // the court-edge balustrades' joints (layout.js arcBandIn r 21 → 21.4: the segments meet at their court-side corners,
      // so the promenade face had a 3 cm V-notch at every joint with light through it — LEAD-REVIEW art round 2): a render
      // pilaster 3–4 cm proud over each joint on the promenade face, and over the tall sections a render coping cap the
      // brass handrail sits on (the caps overlap at the joints, their tops alternating 4 mm)
      {
        const gap = Math.asin(3 / 21) / DEG, SECT = [[-163.6, -152 - gap, 3.3, 1], [-152 + gap, -133, 2.5, 3], [-133, -117, 3.3, 4], [-117, -110, 2.5, 2]];
        const joints = [];
        SECT.forEach(([a0, a1, top, n], si) => {
          for (let i = 1; i < n; i++) joints.push([a0 + ((a1 - a0) * i) / n, top]);
          const nx = SECT[si + 1];
          if (nx && Math.abs(nx[0] - a1) < 0.01) joints.push([a1, Math.min(top, nx[2])]);
          if (top > 3) {
            const da = (a1 - a0) / n, h = (Math.abs(da) * DEG) / 2, dIn = 21 * Math.cos(h), L = 2 * 21.44 * Math.sin(h) + 0.06;
            for (let i = 0; i < n; i++) {
              const am = a0 + da * (i + 0.5), [x, z] = pol(am, (dIn - 0.03 + 21.44) / 2);
              B.push(x, 0, z, -am * DEG + HP);
              pbox(B, 'paint', K.render, L, 0.04 + (i % 2) * 0.004, 21.44 - dIn + 0.03, 0, 3.32 + (i % 2) * 0.002, 0);
              B.pop();
            }
          }
        });
        for (const [a, top] of joints) {
          const [x, z] = pol(a, 21.415);
          face(B, x, 0, z, Math.cos(a * DEG), Math.sin(a * DEG), () => {
            pbox(B, 'paint', K.render, 0.14, top - 2.4, 0.05, 0, (2.4 + top) / 2, 0);
          });
        }
      }
      // the Lookout's SEA PROMENADE letters on its balustrade, facing the court
      { const a = -141.5, [x, z] = pol(a, 21.38); face(B, x, 0, z, -Math.cos(a * DEG), -Math.sin(a * DEG), () => letters(B, o.label || 'SEA PROMENADE', { h: 0.2, y: 4.18, z: 0.01, c: K.brassDk, flat: true, mat: 'paint', track: 0.16 })); }
      // (fix round 4) the Lookout (layout.js radBox(−141.5, r 21.4 → 24.4, 3.6 wide, top 3.6)): its faces are drawn under the
      // ink (floorart.js: render, skirting, speed lines, portholes, the teak deck edge with its brass nosing); here a LOOKOUT
      // plate on its sea face, and its court balustrade (r 21.4 → 21.8, top 4.5) given the balustrades' render pilasters
      // at its ends and a render coping cap under the brass handrail
      {
        const a = LOOKOUT.a, dL = [Math.cos(a * DEG), Math.sin(a * DEG)], pL = [-dL[1], dL[0]];
        const at = (u, v) => [dL[0] * u + pL[0] * v, dL[1] * u + pL[1] * v];
        { const [x, z] = at(LOOKOUT.r1 + 0.002, 0); face(B, x, 0, z, dL[0], dL[1], () => sign(B, 'LOOKOUT', 0, 2.79, { h: 0.1, board: K.navy, c: K.brassLt, pad: 0.07, track: 0.14 })); }
        for (const sv of [-1, 1]) {
          const [x, z] = at(LOOKOUT.r0, sv * (LOOKOUT.half - 0.11));
          face(B, x, 0, z, -dL[0], -dL[1], () => pbox(B, 'paint', K.render, 0.14, LOOKOUT.bal - 2.4, 0.05, 0, (2.4 + LOOKOUT.bal) / 2, 0));
        }
        { const [x, z] = at((LOOKOUT.r0 + LOOKOUT.rb) / 2, 0); face(B, x, 0, z, dL[0], dL[1], () => pbox(B, 'paint', K.render, 2 * LOOKOUT.half + 0.06, 0.04, LOOKOUT.rb - LOOKOUT.r0 + 0.06, 0, LOOKOUT.bal + 0.02, 0)); }
      }
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
        // (fix round 6, LEAD-REVIEW 6: each side was one flat 3.2 × 3.6 m dark-brass panel) a sea-green enamel panel in a
        // moulded brass frame — a stepped border, rivets along it, three brass speed lines low across it — and the roundel
        for (const s of [-1, 1]) face(B, s * 1.22, 0, 0.6, s, 0, () => {
          pbox(B, 'metal', K.seagreenDk, 3.2, 3.6, 0.03, 0, 3.0, 0.015);
          for (const [d, t, z, c] of [[0, 0.11, 0.045, K.brass], [0.13, 0.035, 0.055, K.brassLt]]) {
            for (const yy of [1.2 + d + t / 2, 4.8 - d - t / 2]) pbox(B, 'metal', c, 3.2 - 2 * d, t, z, 0, yy, z / 2);
            for (const xx of [-1.6 + d + t / 2, 1.6 - d - t / 2]) pbox(B, 'metal', c, t, 3.6 - 2 * d, z, xx, 3.0, z / 2);
          }
          rivets(B, [-1.545, 1.255, 0.045], [1.545, 1.255, 0.045], 0.26, { c: K.brassDk, r: 0.018 });
          rivets(B, [-1.545, 4.745, 0.045], [1.545, 4.745, 0.045], 0.26, { c: K.brassDk, r: 0.018 });
          rivets(B, [-1.545, 1.5, 0.045], [-1.545, 4.5, 0.045], 0.3, { c: K.brassDk, r: 0.018 });
          rivets(B, [1.545, 1.5, 0.045], [1.545, 4.5, 0.045], 0.3, { c: K.brassDk, r: 0.018 });
          for (const y of [1.75, 1.92, 2.09]) pbox(B, NS('metal'), K.brass, 2.84, 0.05, 0.035, 0, y, 0.03);
          roundel(B, 0, 3.3, 0.42, ['KELP', 'LINE'], { field: K.navy });
        });
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
      // the canopy lit from below (its glazing glows warm at dusk over the hall: DESIGN.md §5.7; the floor's pool is
      // floorart.js's), pendant lamps under its two long frames
      pbox(B, 'glow', '#fff0d8', 7.5, 0.02, 7.2, 6.35, 6.56, -42.5, { glow: 0.55 });
      for (const z of [-45.6, -39.4]) for (const x of [4.2, 6.35, 8.5]) { rod(B, 'metal', K.brass, [x, 6.55, z], [x, 6.15, z], 0.012); globe(B, x, 6.0, z, 0.13, { glow: 1.3 }); }
      // TICKET HALL on both fascias (the station clock stands on the booth: on the canopy it sat in the spawn's view of the
      // South Gate's shark window — LEAD-NOTES 2026-10-09 item 2)
      // (the pad side's name hangs on a board under the canopy's edge, not on its fascia: at 6.9 m it lined up with SOUTH
      // GATE from the spawn deck and read "SOUTH GATETICKET HALL" — LEAD-REVIEW art round 1. Under the edge it reads
      // 3–4° below the gatehouse's letters from either pad, with the canopy's edge between them)
      {
        face(B, 6.35, 0, -38.68, 0, 1, () => letters(B, 'TICKET HALL', { h: 0.32, y: 6.86, z: 0, c: K.brassLt, lit: true, glow: 1.0, track: 0.16 }));
        // (east of the Tower lane, x 7.45 … 9.2: over the lane it would hang in the tower's 3.72 m headroom)
        face(B, 8.33, 0, -46.2, 0, -1, () => {
          for (const x of [-0.7, 0.7]) rod(B, 'metal', K.brass, [x, 6.56, 0.0], [x, 6.12, 0.0], 0.016);
          B.box('paint', K.navy, 1.74, 0.38, 0.06, 0, 5.94, 0.0, { r: 0.02 });
          for (const y of [5.75, 6.13]) pbox(B, NS('metal'), K.brass, 1.78, 0.03, 0.08, 0, y, 0.0);
          letters(B, 'TICKET HALL', { h: 0.2, y: 5.84, z: 0.035, c: K.brassLt, lit: true, glow: 1.0, track: 0.16, flat: true });
        });
      }
      // the ticket booth (x 8.2 … 10, z −42 … −40, 1.2 → 3.7): Deco kiosk with a curved glass front, TICKETS lit
      {
        const cx = 9.1, cz = -41.0;
        pbox(B, 'paint', K.render, 1.86, 1.0, 2.06, cx, 1.7, cz);
        // (its one faience band at 2.0 is the base's three speed lines since fix round 8: aquarium_boothbase)
        // (fix round 7, LEAD-REVIEW 7: the glass was 1.96 deep, z −41.98 … −40.02, 2 cm INSIDE the off-limits block's own
        // cream faces at z −42 / −40, so both TICKETS faces showed blank render between thin brass strips; now 4 cm proud
        // of every face, its mullions at its corners and middle on the z faces, 3.5 cm proud of the glass)
        pbox(B, NS('gloss'), '#40565f', 1.88, 1.2, 2.08, cx, 2.8, cz);
        for (const z of [-42.05, -39.95]) for (const x of [8.16, 9.1, 10.04]) pbox(B, NS('metal'), K.brass, 0.05, 1.2, 0.05, x, 2.8, z);
        B.box('paint', K.render, 2.1, 0.32, 2.3, cx, 3.58, cz, { r: 0.08 });
        for (const z of [-42.17, -39.83]) face(B, cx, 0, z, 0, z < cz ? -1 : 1, () => letters(B, 'TICKETS', { h: 0.17, y: 3.5, c: K.lit, lit: true, glow: 1.2, flat: true }));
        face(B, 8.155, 0, -41.0, -1, 0, () => sign(B, "TODAY'S FEEDINGS", 0, 2.25, { h: 0.1, board: K.navy, c: K.cream, border: K.brass, w: 1.6, hh: 0.62, sub: '11:00 · 15:00', subH: 0.12, subC: K.brassLt }));
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
      // (no stair handrails: a visible rail needs a rail collider, and the stair's sides are open in play — LEAD-REVIEW
      // art round 1 found the rods floating there with no posts and no collider)
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
        // the fish tank on the pallet: a black-framed glass box, deep water to 3/4 of it, a light lid, two fish and weed
        // (art round 1: "a pale blue box" — now its frame, waterline and the fish read)
        {
          const tx = x, tz = z - 1.25, y0 = 0.49, Wt = 0.94, Ht = 0.78, Dt = 0.88;
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) pbox(B, 'metal', K.ink, 0.035, Ht, 0.035, tx + sx * Wt / 2, y0 + Ht / 2, tz + sz * Dt / 2);
          for (const y of [y0 + 0.02, y0 + Ht]) for (const s2 of [-1, 1]) { pbox(B, 'metal', K.ink, Wt, 0.035, 0.035, tx, y, tz + s2 * Dt / 2); pbox(B, 'metal', K.ink, 0.035, 0.035, Dt, tx + s2 * Wt / 2, y, tz); }
          pbox(B, 'gloss', '#1f4c58', Wt - 0.03, Ht * 0.72, Dt - 0.03, tx, y0 + Ht * 0.36 + 0.02, tz);
          pbox(B, 'gloss', '#6fa3ad', Wt - 0.03, 0.02, Dt - 0.03, tx, y0 + Ht * 0.72 + 0.03, tz);
          pbox(B, 'gloss', '#cfe3e6', Wt - 0.03, Ht * 0.26, Dt - 0.03, tx, y0 + Ht * 0.86 + 0.01, tz, { });
          pbox(B, 'paint', K.cream, Wt + 0.04, 0.04, Dt + 0.04, tx, y0 + Ht + 0.03, tz);
          for (const [fx, fy, fz, c] of [[0.1, 0.32, 0.47, K.coral], [-0.15, 0.22, 0.46, K.mustard], [-0.05, 0.3, -0.47, K.coral], [0.2, 0.18, -0.46, '#9db0c4']]) { B.add('paint', sphG(0.07, 8, 6), c, tx + fx, y0 + fy, tz + fz, { sx: 1.9, sz: 0.5 }); B.add('paint', cylGeo(0, 0.05, 0.08, 4), c, tx + fx - 0.15, y0 + fy, tz + fz, { rz: HP }); }
          for (const k of [-0.3, -0.2, 0.28]) rod(B, 'paint', K.kelp, [tx + k, y0 + 0.04, tz + 0.45], [tx + k + 0.03, y0 + 0.4, tz + 0.45], 0.012);
        }
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
      // the spawn deck's glass-block fascia toward the plaza (s 31, w −13 … 13, to 3.38; fix round 3: at eye level from the
      // plaza it read as a bare tiled block): a black-granite skirting with a brass line, render pilasters dividing it into
      // six bays (three faience speed lines wrapping each one's head), a render frieze with speed lines under the deck's
      // edge (its top 6 cm under the walkable deck), lit portholes into the foyer in the outer bays and an enamel FIN
      // PAVILION roundel in the two middle ones. All of it 4–8 cm proud of the face, nothing on the deck
      bl(B, 31, 0, 0, () => {
        const L = 26.0, top = 3.32;
        pbox(B, 'paint', K.granite, L + 0.06, 0.36, 0.04, 0, 0.18, 0.02);
        pbox(B, NS('metal'), K.brass, L + 0.06, 0.025, 0.05, 0, 0.372, 0.025);
        pbox(B, 'paint', K.render, L + 0.06, top - 2.98, 0.045, 0, (2.98 + top) / 2, 0.0225);
        speed(B, -L / 2 - 0.03, L / 2 + 0.03, 3.05, { n: 3, gap: 0.085, t: 0.04, d: 0.055 });
        for (const w of [-12.74, -8.67, -4.33, 0, 4.33, 8.67, 12.74]) {
          pbox(B, 'paint', K.render, 0.48, 2.62, 0.05, w, 0.36 + 1.31, 0.025);
          for (const dx of [-0.1, 0.1]) pbox(B, NS('paint'), K.renderSh, 0.03, 2.1, 0.054, w + dx, 1.5, 0.027);
          for (const y of [2.6, 2.7, 2.8]) pbox(B, NS('gloss'), K.faience, 0.52, 0.045, 0.065, w, y, 0.0325);
        }
        for (const w of [-10.72, -6.5, 6.5, 10.72]) for (const dx of [-0.75, 0.75]) porthole(B, w + dx, 1.75, 0.34, { lit: true });
        for (const w of [-2.17, 2.17]) roundel(B, w, 1.75, 0.62, ['FIN', 'PAVILION'], { h: 0.2 });
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
        // (fix round 9, LEAD-REVIEW 9: its speed lines run on across the new corner pilasters: aquarium_stopinfaces)
        for (const s of [-1, 1]) { B.push(0, 0, s * 1.77, s > 0 ? 0 : PI); roundel(B, 0, 1.9, 0.62, ['TUBEWAY', '▶ EXPRESS'].map((t) => t.replace('▶ ', '')), { field: K.navy }); B.pop(); }
        B.push(2.17, 0, 0, HP); pbox(B, 'metal', K.brassDk, 3.4, 2.8, 0.03, 0, 1.6, 0.0); B.pop();
      });
      // OUT: bladeBox(−6, −1.4, −16.2, −13.8) to 5.0, its mouth on the s −6 face (the drop comes in from its top)
      bl(B, -3.7, -15.0, 0, () => {
        B.box('paint', K.render, 2.6, 0.38, 4.8, 0, 5.17, 0, { r: 0.1 });
        for (const y of [5.05, 5.2]) pbox(B, NS('gloss'), K.faience, 2.62, 0.03, 4.82, 0, y, 0);
        B.add('metal', torG(0.98, 0.1, 8, 28), K.brass, 0.7, 5.4, 0, { rx: HP });
        // (fix round 8, LEAD-REVIEW 8: its speed lines were drawn here at 0.62 over the foundations' frame — inside Penguin
        // Point's 1.2 m rock terrace, so both long faces showed the roundel alone on plain render. They stand on the stop's
        // own floor now, with the rest of its long faces' dressing: aquarium_stopfaces)
        for (const s of [-1, 1]) { B.push(s * 1.22, 0, 0, s * HP); roundel(B, 0, 3.0, 0.58, ['TUBEWAY', 'EXPRESS'], { field: K.navy }); B.pop(); }
      });
    },
  };

  // ============================================================================================================ fix round 8
  // (LEAD-REVIEW 8, the last three faces) The Express OUT stop's long faces, the Ticket Hall booth's render base, the Reef
  // Window's short west run and the Service Gate's jambs, in the language the kiosks set in fix round 7: a black-granite
  // skirting with a brass line, render corner pilasters, faience speed lines, a plate. Visual only: every part within
  // 8.5 cm of its block (off-limits blocks, never inked), none on a walkable top, no collider; their own prop types, so
  // aquarium-art.js section 12 checks this round's parts alone.
  const flute = (B, w, h, x, y, z) => pbox(B, NS('paint'), K.renderSh, w, h, 0.004, x, y, z);
  // a framed navy plate (face frame, centred at x, foot y; z out of the face): a board, a brass frame, two lines
  function plate(B, x, y, w, h, l1, l2, o = {}) {
    const zb = o.z ?? 0.0, h1 = o.h1 ?? 0.1, h2 = o.h2 ?? 0.055, t = o.t ?? 0.012;
    pbox(B, 'paint', o.board ?? K.navy, w, h, t, x, y + h / 2, zb + t / 2);
    for (const yy of [y, y + h]) pbox(B, NS('metal'), K.brass, w + 0.024, 0.022, t + 0.008, x, yy, zb + (t + 0.008) / 2);
    for (const xx of [x - w / 2, x + w / 2]) pbox(B, NS('metal'), K.brass, 0.022, h + 0.02, t + 0.008, xx, y + h / 2, zb + (t + 0.008) / 2);
    letters(B, l1, { h: h1, x, y: y + h - h1 - (h - h1 - h2) * 0.36, z: zb + t + 0.001, c: o.c1 ?? K.brassLt, flat: true, mat: 'paint', wt: 0.19, track: 0.13 });
    if (l2) letters(B, l2, { h: h2, x, y: y + (h - h1 - h2) * 0.3, z: zb + t + 0.001, c: o.c2 ?? K.cream, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
  }

  // the Express OUT stop on Penguin Point (bladeBox(−6, −1.4, −16.2, −13.8) to 5.0, standing on the 1.2 m rock terrace; in
  // the blade frame local ±x are its long faces, 4.6 m, local +z its mouth face (s −6), −z its back against the keeper's
  // hut): on both long faces the IN stop's three faience speed lines 0.62 m over the stop's own floor (1.82 / 1.96 / 2.10)
  // running across the corner pilasters, a black-granite skirting with a brass line (1.2 → 1.36, round the back too; not
  // across the mouth face, its nozzle's), a 0.18 m square render pilaster at each corner (2 cm proud of both faces, fluted)
  // up to the cap, a brass-ringed porthole either side of the TUBEWAY roundel and a framed ARRIVALS · FROM FERRY PLAZA
  // plate over it
  D.aquarium_stopfaces = {
    desc: "the Express OUT stop's long faces and back (world frame, Alpha; fix round 8)",
    build(B) {
      bl(B, -3.7, -15.0, 0, () => {
        const HW = 1.2, HL = 2.3, F = 1.2, y0 = F + 0.16, top = 4.975;
        for (const s of [-1, 1]) {
          pbox(B, 'paint', K.granite, 0.05, 0.16, 2 * HL + 0.1, s * (HW + 0.025), F + 0.08, 0);
          pbox(B, NS('metal'), K.brass, 0.056, 0.016, 2 * HL + 0.112, s * (HW + 0.028), y0 + 0.006, 0);
        }
        pbox(B, 'paint', K.granite, 2 * HW + 0.1, 0.16, 0.05, 0, F + 0.08, -(HL + 0.025));
        pbox(B, NS('metal'), K.brass, 2 * HW + 0.112, 0.016, 0.056, 0, y0 + 0.006, -(HL + 0.028));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const cx = sx * (HW - 0.07), cz = sz * (HL - 0.07), hh = top - y0, ym = (top + y0) / 2;
          pbox(B, 'paint', K.render, 0.18, hh, 0.18, cx, ym, cz);
          pbox(B, NS('paint'), K.render, 0.21, 0.06, 0.21, cx, top - 0.03, cz);                        // (its cap)
          flute(B, 0.03, hh - 0.4, cx, ym - 0.05, sz * (HL + 0.022));
          B.push(sx * (HW + 0.022), 0, cz, HP); flute(B, 0.03, hh - 0.4, 0, ym - 0.05, 0); B.pop();
        }
        for (const s of [-1, 1]) {
          B.push(s * HW, 0, 0, s * HP);
          speed(B, -(HL + 0.03), HL + 0.03, F + 0.62, { n: 3, d: 0.045 });
          for (const x of [-1.38, 1.38]) porthole(B, x, 3.0, 0.27);
          plate(B, 0, 3.74, 1.56, 0.42, 'ARRIVALS', 'FROM FERRY PLAZA', { h1: 0.15, h2: 0.07 });
          B.pop();
        }
      });
    },
  };

  // the Ticket Hall booth's render base (the block x 8.2 … 10, z −42 … −40 from the hall's 1.2 floor; the base 3 cm proud
  // to 2.2, the glazing over it): a black-granite skirting with a brass line (1.2 → 1.356), a 0.16 m square render pilaster
  // at each corner (5 cm proud of the block, fluted) up to the glazing, three faience speed lines round all four faces and
  // across the pilasters (they replace its one band), a brass counter ledge under the glass with a speaking grille on both
  // TICKETS faces and the price plate under it; on the x faces a recessed panel line, and on the plaza face (+x, the hall's
  // edge) a TICKET OFFICE plate in it
  D.aquarium_boothbase = {
    desc: "the Ticket Hall booth's render base (world frame, Alpha; fix round 8)",
    build(B) {
      const cx = 9.1, cz = -41.0, HX = 0.9, HZ = 1.0, F = 1.2, y0 = 1.356, top = 2.19;
      pbox(B, 'paint', K.granite, 2 * HX + 0.09, 0.14, 2 * HZ + 0.09, cx, F + 0.07, cz);
      pbox(B, NS('metal'), K.brass, 2 * HX + 0.1, 0.016, 2 * HZ + 0.1, cx, F + 0.148, cz);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const px = cx + sx * (HX - 0.03), pz = cz + sz * (HZ - 0.03), ym = (top + y0) / 2;
        pbox(B, 'paint', K.render, 0.16, top - y0, 0.16, px, ym, pz);
        flute(B, 0.025, top - y0 - 0.2, px, ym, pz + sz * 0.082);
        B.push(px + sx * 0.082, 0, pz, HP); flute(B, 0.025, top - y0 - 0.2, 0, ym, 0); B.pop();
      }
      for (const y of [1.9, 1.97, 2.04]) pbox(B, NS('gloss'), K.faience, 2 * HX + 0.11, 0.035, 2 * HZ + 0.11, cx, y, cz);
      // the TICKETS faces (z −42 and −40; the base's face 3 cm out): the ledge, the grille on the glass, the price plate
      for (const sz of [-1, 1]) {
        face(B, cx, 0, cz + sz * (HZ + 0.03), 0, sz, () => {
          pbox(B, 'metal', K.brass, 1.5, 0.035, 0.04, 0, 2.16, 0.02);
          pbox(B, NS('metal'), K.brassDk, 1.5, 0.012, 0.034, 0, 2.137, 0.017);
          B.add('metal', torG(0.075, 0.012, 6, 18), K.brass, 0.42, 2.5, 0.024, {});
          B.add('gloss', cylGeo(0.07, 0.07, 0.006, 18), K.brassDk, 0.42, 2.5, 0.017, { rx: HP });
          for (const dy of [-0.03, 0, 0.03]) pbox(B, NS('paint'), K.ink, 0.09, 0.008, 0.004, 0.42, 2.5 + dy, 0.022);
          plate(B, 0, 1.47, 1.24, 0.36, 'ADULTS 2 SHELLS', 'CHILDREN 1 SHELL', { h1: 0.072, h2: 0.072, c2: K.brassLt });
        });
      }
      // the x faces (−x into the hall under the FEEDINGS board, +x the plaza face on the hall's edge): a recessed panel
      // line between the pilasters; on the plaza face the TICKET OFFICE plate in it
      for (const sx of [-1, 1]) {
        face(B, cx + sx * (HX + 0.03), 0, cz, sx, 0, () => {
          const pw = 2 * HZ - 0.42, ph = 0.4, py = 1.44;
          for (const yy of [py, py + ph]) pbox(B, NS('paint'), K.renderSh, pw, 0.012, 0.004, 0, yy, 0.002);
          for (const xx of [-pw / 2, pw / 2]) pbox(B, NS('paint'), K.renderSh, 0.012, ph, 0.004, xx, py + ph / 2, 0.002);
          for (const yy of [py + 0.012, py + ph + 0.012]) pbox(B, NS('paint'), '#f6f1e6', pw - 0.02, 0.006, 0.003, 0, yy, 0.0015);
          if (sx > 0) plate(B, 0, py + 0.06, 1.0, 0.28, 'TICKET OFFICE', 'FERRIES · TUBEWAY · EXHIBITS', { h1: 0.075, h2: 0.04, z: 0.004 });
        });
      }
    },
  };

  // the Reef Window's ends and its short west run's outer face (layout.js: the window's blocks are radBox chords — the short
  // run one chord α −70 … −67, the long run's first α −58 … −54.04 — and the outer wall here a slab on each, its face at
  // r 32.55, 6–7 cm off the chord): the Gate Terrace's face of the short run takes the pylon wing face's language beside it
  // (a black-granite skirting 0 → 0.16 with a brass line, the three faience speed lines at its 0.62 / 0.76 / 0.90, render
  // pilasters at its corners, a REEF HALL plate), and every open end of the window (α −70 beside the pylon, the Service
  // Gate's α −67 and α −58) a render jamb over the granite base's end with the speed lines across it (the reef showed
  // through them in section). In each chord's frame: local +z out of the outer face, local x along it toward lower α
  D.aquarium_reefjambs = {
    desc: "the Reef Window's jambs and its short west run's outer face (world frame, Alpha; fix round 8)",
    build(B) {
      const chord = (a0, a1, n, i) => {
        const da = (a1 - a0) / n, h = Math.abs(da) / 2, ac = a0 + da * (i + 0.5), out = 32.5 * Math.cos(h * DEG), r0 = Math.min(30.5, out - 0.05);
        return { ac, rm: (r0 + out) / 2, zIn: r0 - (r0 + out) / 2, zOut: out - (r0 + out) / 2, hl: 32.5 * Math.sin(h * DEG) };
      };
      const inChord = (c, fn) => { const [x, z] = pol(c.ac, c.rm); face(B, x, 0, z, Math.cos(c.ac * DEG), Math.sin(c.ac * DEG), fn); };
      const W0 = chord(-70, -67, 1, 0), L0 = chord(-58, -2.6, 14, 0);
      // the outer wall slab's face (r 32.55 at the chord's middle), in each frame
      const wallZ = (c) => 32.55 - c.rm;
      // a jamb at the chord's end e (+1: its low-α end, local +x; −1: its high-α end): 1.2–3.0 cm off the end, the glass's
      // radius to the wall's face; the granite base's end under it, render over it, the three speed lines on it
      const jamb = (c, e) => {
        const x = e * (c.hl + 0.021), zi = 30.43 - c.rm, zo = wallZ(c), zc = (zi + zo) / 2, d = zo - zi;
        pbox(B, 'paint', K.granite, 0.018, 0.64, d, x, 0.3, zc);
        pbox(B, 'paint', K.render, 0.018, 5.0 - 0.62, d, x, (5.0 + 0.62) / 2, zc);
        pbox(B, NS('metal'), K.brass, 0.022, 0.016, d, x + e * 0.002, 0.628, zc);
        for (const y of [0.62, 0.76, 0.9]) pbox(B, NS('gloss'), K.faience, 0.01, 0.06, d - 0.02, x + e * 0.014, y, zc);
        // (a fluted rib up its middle over the lines, as on the pylon's wing face beside it: 3.5 cm off the jamb)
        B.box('paint', K.render, 0.035, 4.0, 0.3, x + e * 0.0265, 2.97, zc, { r: 0.012 });
        pbox(B, NS('paint'), K.renderSh, 0.004, 3.4, 0.04, x + e * 0.0445, 2.97, zc);
        // (fix round 9, LEAD-REVIEW 9: on the cream jamb the rib read as nothing — 2 × 4.4 m of plain render over the lines)
        // a 1.5 cm shadow groove either side of the rib, a brass strip up its face, and a brass-ringed porthole (r 0.3, dark
        // glass) at 1.6 m into the reef behind, on the window side of the rib; its ring flattened to stay within 7 cm of the
        // block's end
        for (const sz of [-1, 1]) pbox(B, NS('paint'), K.renderSh, 0.003, 4.0, 0.015, x + e * 0.0105, 2.97, zc + sz * 0.1575);
        pbox(B, NS('metal'), K.brass, 0.005, 3.9, 0.026, x + e * 0.0465, 2.97, zc);
        B.push(x + e * 0.009, 0, zc - 0.62, e * HP);
        B.add('metal', torG(0.3, 0.048, 6, 24), K.brass, 0, 1.6, 0.018, { sz: 0.45 });
        B.add(NS('gloss'), cylGeo(0.29, 0.29, 0.006, 24), '#3e5560', 0, 1.6, 0.006, { rx: HP });
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + PI / 8; B.add(NS('metal'), sphG(0.014, 6, 4, HP), K.brassDk, Math.cos(a) * 0.3, 1.6 + Math.sin(a) * 0.3, 0.036, { rx: HP }); }
        B.pop();
      };
      // a render pilaster on the chord's outer corner at end e: 7 cm out of the chord's face (flush with the wall's to 0.9 cm
      // over it), 3.2 cm past its end (its side just over the jamb's face); a granite foot
      const pil = (c, e) => {
        const w = 0.24, x = e * (c.hl + 0.032 - w / 2), z = c.zOut + 0.07 - w / 2;
        pbox(B, 'paint', K.granite, w, 0.176, w, x, 0.088, z);
        pbox(B, 'paint', K.render, w, 5.0 - 0.176, w, x, (5.0 + 0.176) / 2, z);
        pbox(B, NS('gloss'), K.faience, w + 0.004, 0.05, w + 0.004, x, 0.5, z);
        flute(B, 0.04, 4.2, x, 2.75, c.zOut + 0.072);
      };
      // the outer face's skirting, brass line and speed lines along x0 … x1, 0.8–1.2 cm over the wall's face (which stands
      // 6.1–6.9 cm off the chord's)
      const band = (c, x0, x1) => {
        const z = wallZ(c), L = x1 - x0, xm = (x0 + x1) / 2;
        pbox(B, 'paint', K.granite, L, 0.16, 0.01, xm, 0.08, z + 0.005);
        pbox(B, NS('metal'), K.brass, L, 0.016, 0.012, xm, 0.168, z + 0.006);
        for (const y of [0.62, 0.76, 0.9]) pbox(B, NS('gloss'), K.faience, L, 0.06, 0.008, xm, y, z + 0.004);
      };
      inChord(W0, () => {
        band(W0, -(W0.hl + 0.012), W0.hl + 0.012);
        pil(W0, 1); pil(W0, -1);
        jamb(W0, 1); jamb(W0, -1);
        B.push(0, 0, wallZ(W0) + 0.001, 0); plate(B, 0, 1.3, 1.08, 0.34, 'REEF HALL', '← SERVICE GATE', { h1: 0.1, h2: 0.06, t: 0.008 }); B.pop();
      });
      // the long run's α −58 end: its jamb, the corner pilaster, the metre of its outer face the pump wall leaves open
      inChord(L0, () => {
        jamb(L0, 1); pil(L0, 1);
        band(L0, L0.hl - 1.3, L0.hl + 0.012);
      });
    },
  };

  // ============================================================================================================ fix round 9
  // (LEAD-REVIEW 9) The Express IN stop on the ferry plaza brought up to the OUT stop's standard (bladeBox(21, 24.5, 12.5,
  // 16.8) from the plaza's floor (F = 0) to its cap at 3.2; in the blade frame bl(22.75, 14.65) local ±z are its long faces,
  // 4.3 m, local −x its mouth face (w 12.5), +x its back): on both long faces the three faience speed lines at 0.62 / 0.76 /
  // 0.90 running across the corner pilasters (they were drawn by aquarium_stops, to ±2.1), a black-granite skirting with a
  // brass line (0 → 0.16, round the back too; not across the mouth face, its nozzle's), a 0.18 m square render pilaster at
  // each corner (2 cm proud of both faces, fluted) up to the cap, a brass-ringed porthole either side of the TUBEWAY roundel.
  // Within 8.5 cm of the block, none over its top, no collider
  D.aquarium_stopinfaces = {
    desc: "the Express IN stop's long faces and back (world frame, Alpha; fix round 9)",
    build(B) {
      bl(B, 22.75, 14.65, 0, () => {
        const HX = 2.15, HZ = 1.75, F = 0, y0 = F + 0.16, top = 3.175;
        for (const s of [-1, 1]) {
          pbox(B, 'paint', K.granite, 2 * HX + 0.1, 0.16, 0.05, 0, F + 0.08, s * (HZ + 0.025));
          pbox(B, NS('metal'), K.brass, 2 * HX + 0.112, 0.016, 0.056, 0, y0 + 0.006, s * (HZ + 0.028));
        }
        pbox(B, 'paint', K.granite, 0.05, 0.16, 2 * HZ + 0.1, HX + 0.025, F + 0.08, 0);
        pbox(B, NS('metal'), K.brass, 0.056, 0.016, 2 * HZ + 0.112, HX + 0.028, y0 + 0.006, 0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const cx = sx * (HX - 0.07), cz = sz * (HZ - 0.07), hh = top - y0, ym = (top + y0) / 2;
          pbox(B, 'paint', K.render, 0.18, hh, 0.18, cx, ym, cz);
          pbox(B, NS('paint'), K.render, 0.21, 0.06, 0.21, cx, top - 0.03, cz);
          flute(B, 0.03, hh - 0.4, cx, ym - 0.05, sz * (HZ + 0.022));
          B.push(sx * (HX + 0.022), 0, cz, HP); flute(B, 0.03, hh - 0.4, 0, ym - 0.05, 0); B.pop();
        }
        for (const s of [-1, 1]) {
          B.push(0, 0, s * HZ, s > 0 ? 0 : PI);
          speed(B, -(HX + 0.03), HX + 0.03, F + 0.62, { n: 3, d: 0.045 });
          for (const x of [-1.42, 1.42]) porthole(B, x, 1.9, 0.27);
          B.pop();
        }
      });
    },
  };

  // (LEAD-REVIEW 9, major) The Arch Line's two glazed riser shafts in the gatehouse's pylons (layout.js PY.void: x ±6.15 …
  // ±8.5 behind the hall's glass, z −28.25 … −26.0, floor 0 to the lid at 8.4) were empty white boxes behind 2.25 × 8.4 m of
  // glass on the main lane. Their walls, floor and lid are floorart.js's (white glazed tile, the skirting, the speed lines,
  // a brass grille floor with a drain); here the parts in them. The riser (tubeway.js 'arch'): east up from the Reef Hall
  // mouth at x 7.32, z −27.13, its bend diving into the back wall under 2.3 m; west down to 3.2 and out through the back
  // wall to the promenade, its bend there from 2.3 to 5.0 m. Every part stands ≥ 0.15 m clear of the riser's glass (r 0.88:
  // ≥ 1.03 m from its centreline, aquarium-art.js section 13 measures it), none in the hall, no collider; Alpha's frame,
  // placed twice (rotY π for Bravo, whose plates read N. …). Per shaft:
  //   - a brass service ladder in the back wall's wing-side corner (rails 6 cm off it at z −27.90 / −28.20, rungs every
  //     0.3 m, stand-offs every 1.5 m) from the floor to the lid, its cage of hoops every metre from 2.2 m with three bars;
  //   - brass guide brackets on the back wall round the riser at a 2 m pitch where it rises plumb or nearly (east 3.6 / 5.6,
  //     west 5.35 / 6.5 — its 4.5 lies in the bend, too near the back wall): a curved shoe 0.17–0.30 m clear of the glass,
  //     two arms to the wall on bolted plates;
  //   - the navy and brass ARCH LINE · RISER plate on the back wall facing the glass, over → S. REEF HALL (east, 2.3 m: its
  //     bend fills the wall under it) or → S. PROMENADE (west, 1.4 m);
  //   - a caged bulkhead lamp on each side wall at 2.4 and 7.6 m, toward the back corner, lit at dusk (the glow material)
  D.aquarium_shafts = {
    desc: "the Arch Line's riser shafts' ladders, guide brackets, plates and lamps (world frame, Alpha; o.half 'S' | 'N'; fix round 9)",
    build(B, o) {
      const NS_ = o.half === 'N' ? 'N.' : 'S.';
      // the riser's centreline, densified to 2 cm (centreline() samples its fillets; a straight is its two ends)
      const c0 = centreline(allLegs(PIPES).find((l) => l.id === 'arch'), 0.05), CL = [c0[0]];
      for (let i = 1; i < c0.length; i++) {
        const a = c0[i - 1], b = c0[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.02));
        for (let k = 1; k <= n; k++) CL.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, a[2] + ((b[2] - a[2]) * k) / n]);
      }
      const clr = (x, y, z) => { let d = 9; for (const q of CL) { const e = Math.hypot(x - q[0], y - q[1], z - q[2]); if (e < d) d = e; } return d; };
      for (const sx of [1, -1]) {
        const X = (v) => sx * v;
        // ---- the ladder
        const xr = 8.44, z1 = -27.9, z2 = -28.2, zc = (z1 + z2) / 2;
        for (const z of [z1, z2]) rod(B, 'metal', K.brassLt, [X(xr), 0, z], [X(xr), 8.38, z], 0.016, { seg: 8 });
        for (let y = 0.3; y < 8.3; y += 0.3) rod(B, 'metal', K.brass, [X(xr), y, z1], [X(xr), y, z2], 0.011, { seg: 6 });
        for (let y = 0.6; y < 8.3; y += 1.5) for (const z of [z1, z2]) rod(B, 'metal', K.brassDk, [X(xr), y, z], [X(8.5), y, z], 0.009, { seg: 6 });
        const hoop = (t, y) => [X(xr - 0.26 * Math.cos(t)), y, zc + 0.15 * Math.sin(t)];
        for (let y = 2.2; y < 8.35; y += 1.0) for (let k = 0; k < 10; k++) rod(B, 'metal', K.brassLt, hoop(-HP + (k / 10) * PI, y), hoop(-HP + ((k + 1) / 10) * PI, y), 0.012, { seg: 5 });
        for (const t of [-PI / 4, 0, PI / 4]) rod(B, 'metal', K.brassLt, hoop(t, 2.2), hoop(t, 8.2), 0.01, { seg: 5 });
        // ---- the guide brackets: the riser's centre at each height, a shoe round its back at the least radius (from 1.06 m,
        // 1 cm steps) whose every point keeps 1.06 m off the centreline (a bend leans the tube toward the wall or away)
        for (const y of sx > 0 ? [3.6, 5.6] : [5.35, 6.5]) {
          let A = null, bd = 9;
          for (const q of CL) if (Math.sign(q[0]) === sx && Math.abs(q[0]) > 6.1 && Math.abs(q[1] - y) < bd) { bd = Math.abs(q[1] - y); A = q; }
          const span = 40 * DEG, arc = (r, n = 8) => { const out = []; for (let k = 0; k <= n; k++) { const t = -span + (2 * span * k) / n; out.push([A[0] + sx * r * Math.cos(t), y, A[2] + r * Math.sin(t)]); } return out; };
          let r = 1.06;
          while (r < 1.3 && arc(r, 16).some((p) => clr(p[0], y + 0.03, p[2]) < 1.06 || clr(p[0], y - 0.03, p[2]) < 1.06)) r += 0.01;
          if (8.5 - Math.abs(A[0]) - (r + 0.025) < 0.02) continue;                  // (no room behind it: none)
          const mid = arc(r + 0.0125);
          for (let k = 0; k < 8; k++) strut(B, 'metal', K.brassLt, mid[k], mid[k + 1], 0.025, { w: 0.025, h: 0.07 });
          for (const t of [-28 * DEG, 28 * DEG]) {
            const P = [A[0] + sx * (r + 0.02) * Math.cos(t), y, A[2] + (r + 0.02) * Math.sin(t)];
            strut(B, 'metal', K.brassDk, P, [X(8.49), y, P[2]], 0.02, { w: 0.02, h: 0.05 });
            pbox(B, 'metal', K.brassDk, 0.012, 0.16, 0.1, X(8.494), y, P[2]);
            for (const dy of [-0.055, 0.055]) B.add(NS('metal'), sphG(0.011, 6, 4, HP), K.brass, X(8.488), y + dy, P[2], { rz: sx * HP });
          }
        }
        // ---- the plate on the back wall, facing the glass
        face(B, X(8.5), 0, -27.13, -sx, 0, () => {
          plate(B, 0, sx > 0 ? 2.3 : 1.4, 1.24, 0.44, 'ARCH LINE · RISER', '→ ' + NS_ + (sx > 0 ? ' REEF HALL' : ' PROMENADE'), { h1: 0.085, h2: 0.066 });
        });
        // ---- the lamps: on each side wall toward the back corner, at 2.4 and 7.6 m
        for (const [zw, n] of [[-26.0, -1], [-28.25, 1]]) for (const y of [2.4, 7.6]) {
          face(B, X(7.95), 0, zw, 0, n, () => {
            const R = 0.085, zt = 0.112;
            B.add('metal', cylGeo(0.11, 0.11, 0.02, 20), K.brassDk, 0, y, 0.01, { rx: HP });
            B.add(NS('glow'), sphG(R, 16, 8, HP), K.lit, 0, y, 0.02, { rx: HP, glow: 1.6 });
            B.add('metal', torG(R + 0.006, 0.01, 5, 20), K.brass, 0, y, 0.024, {});
            for (const [dx, dy] of [[1, 0], [0, 1]]) {
              rod(B, 'metal', K.brass, [-dx * R, y - dy * R, 0.024], [-dx * R, y - dy * R, zt], 0.007, { seg: 4 });
              rod(B, 'metal', K.brass, [dx * R, y + dy * R, 0.024], [dx * R, y + dy * R, zt], 0.007, { seg: 4 });
              rod(B, 'metal', K.brass, [-dx * R, y - dy * R, zt], [dx * R, y + dy * R, zt], 0.007, { seg: 4 });
            }
          });
        }
      }
    },
  };
}
