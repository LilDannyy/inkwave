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
//   hopper / hatch / polerack   the Feeding Deck's furniture dressed from outside its faces (art round 1)
//   turnstile / trolley / planterdress / ticketcanopy / cartdress   the wing's cover, likewise
//   aboard / bench / stanchions / luggage   the wing's small things out of the lanes
import { TOUCH } from './geo.js';

export function registerDress(D, H, KIT) {
  const { K, NS, GB, pbox, cyl, cylGeo, latheG, sphG, torG, strut, rod, letters, sign, porthole, speed, globe, handrail, roundel, HP, PI, TAU, tpl, THREE } = KIT;
  // a faux-rock skin: a plane (w × h, facing +z, its foot at y 0) cast as rockwork — courses of rounded stones (a jittered
  // running bond, ~0.42 × 0.28 m) domed up to 7.8 cm out of it, deep dark crevices between them, the stones' tops lit as
  // ledges and their undersides shaded (vertex colours multiply the part's) — so a block's face reads as a cast rockery
  // from 3–5 m, not a painted slab (the touch pools; fix round 4: LEAD-REVIEW art round 4 — the round-3 skin, 0.8–4.3 cm
  // of smooth sines, read as a rectangle painted to look like rock). (holes: [x0, x1, y0, y1] rectangles kept flat, 8 mm
  // out, behind what is mounted there — windows, portholes, a sign — the relief easing up to them over 10 cm)
  const rockSkinG = (w, h, seed, holes = []) => tpl(`rskin4|${w}|${h}|${seed}|${JSON.stringify(holes)}`, () => {
    const nx = Math.max(4, Math.round(w / 0.085)), ny = Math.max(3, Math.round(h / 0.075)), g = new THREE.PlaneGeometry(w, h, nx, ny);
    g.translate(0, h / 2, 0);
    const P = g.attributes.position, c = new Float32Array(P.count * 3), s0 = seed * 1.37;
    const hh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + s0 * 17.3) * 43758.5453; return v - Math.floor(v); };
    // a stone's centre in its cell of the running bond (row j, column i): jittered
    const ctr = (i, j) => [(i + 0.5 + 0.5 * (j & 1) + 0.5 * (hh(i, j) - 0.5)) * 0.42, (j + 0.5 + 0.35 * (hh(i + 7.1, j - 3.3) - 0.5)) * 0.28];
    const tone = new Float32Array(P.count), crev = new Float32Array(P.count);
    for (let k = 0; k < P.count; k++) {
      const x = P.getX(k) + w / 2, y = P.getY(k);
      const j0 = Math.floor(y / 0.28), i0 = Math.floor(x / 0.42 - 0.5 * (j0 & 1));
      let d1 = 9, d2 = 9, id = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 2; di++) {
        const [cx, cy] = ctr(i0 + di, j0 + dj), dx = (x - cx) / 0.42, dy = (y - cy) / 0.28, d = Math.hypot(dx, dy);
        if (d < d1) { d2 = d1; d1 = d; id = hh(i0 + di, j0 + dj + 0.5); } else if (d < d2) d2 = d;
      }
      const e = d2 - d1;                                         // 0 on a crevice, ~0.5 in a stone's middle
      const dome = Math.pow(Math.min(1, e / 0.42), 0.6) * (0.75 + 0.25 * id);
      let z = 0.008 + 0.07 * dome + 0.004 * Math.sin(x * 23 + s0) * Math.sin(y * 19 - s0);
      // flat behind the holes, easing up over 10 cm round them; and at the skin's own edges (the corners' and rim's rocks cover them)
      let ease = Math.min(1, Math.min(x, w - x) / 0.08, y / 0.06, (h - y) / 0.05);
      for (const [x0, x1, y0, y1] of holes) {
        const dx = Math.max(x0 - (x - w / 2), 0, (x - w / 2) - x1), dy = Math.max(y0 - y, 0, y - y1);
        ease = Math.min(ease, Math.hypot(dx, dy) / 0.1);
      }
      ease = Math.max(0, ease);
      z = 0.008 + (z - 0.008) * ease * ease * (3 - 2 * ease);
      P.setZ(k, Math.min(0.078, z));
      tone[k] = 0.84 + 0.3 * id; crev[k] = 0.5 + 0.5 * Math.min(1, e / 0.16);
    }
    g.computeVertexNormals();
    const N = g.attributes.normal;
    for (let k = 0; k < P.count; k++) {
      const ny2 = N.getY(k), kk = tone[k] * crev[k] * (1 + 0.24 * Math.max(0, ny2) - 0.22 * Math.max(0, -ny2));
      c.set([kk, kk * 0.985, kk * 0.955], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  });
  const blob = new Map();
  const blobG = (seed) => { let g = blob.get(seed); if (!g) { g = H.blobGeo(1, 2, seed, 0.16); blob.set(seed, g); } return g; };
  const blobLoG = (seed) => { let g = blob.get(-seed); if (!g) { g = H.blobGeo(1, 1, seed, 0.16); blob.set(-seed, g); } return g; };
  // a blob's own reach (unit radius, its noise): its largest x, z and its reach along the diagonal (x + z) / √2, per seed
  const reach = new Map();
  const reachOf = (seed) => {
    let r = reach.get(seed);
    if (!r) { const P = blobG(seed).attributes.position; r = { x: 0, z: 0, nx: 0, nz: 0 }; for (let i = 0; i < P.count; i++) { r.x = Math.max(r.x, P.getX(i)); r.z = Math.max(r.z, P.getZ(i)); r.nx = Math.max(r.nx, -P.getX(i)); r.nz = Math.max(r.nz, -P.getZ(i)); } reach.set(seed, r); }
    return r;
  };

  // a rounded boulder pair wrapping a block's vertical corner (fix round 4, the touch pools): the corner at the origin, its
  // two faces the planes x = 0 and z = 0 (outward +x, +z); a squircle column (n = 5: it reaches 1.23× further along the
  // diagonal than across) centred inside the block, so it stands at most `out` proud of either face yet wraps the corner;
  // a crevice part-way up splits it into two stones, the upper one domed `rise` over the block's top `top`
  const cornerRockG = (rho, top, rise, out, seed) => tpl(`crock|${rho}|${top}|${rise}|${out}|${seed}`, () => {
    // (c: its reach out of a face is rho × 1.035 (the profile's swell) × 1.045 (the lumps) − c = out; NS a multiple of 8, so
    // a column of vertices runs down the diagonal itself — between two, the chord cut the squircle's corner and the block's
    // corner showed through as a thin line)
    const NS = 16, ys = [], c = 1.082 * rho - out, s0 = seed * 2.17, split = 0.42 + 0.12 * Math.sin(s0);
    for (let j = 0; j <= 12; j++) ys.push((top * j) / 12);
    for (let j = 1; j <= 5; j++) ys.push(top + rise * Math.sin((j / 6) * HP));
    const sq = (f) => Math.pow(Math.pow(Math.abs(Math.cos(f)), 5) + Math.pow(Math.abs(Math.sin(f)), 5), -0.2);
    const pos = [], col = [], idx = [];
    ys.forEach((y, j) => {
      const over = y > top ? (y - top) / rise : 0;
      const gy = Math.exp(-Math.pow((y - split) / 0.045, 2)), groove = 1 - 0.13 * gy;
      const rho_y = rho * (over > 0 ? Math.cos(over * HP * 0.92) : 1 - 0.035 * Math.sin(y * 6.1 + s0)) * (y < 0.06 ? 0.96 + 0.66 * y : 1);
      for (let i = 0; i < NS; i++) {
        // (the crevice is cut everywhere but over the block's corner itself, where it let the corner show through: there it
        // is only shaded)
        const f = (i / NS) * TAU, n = Math.sin(f * 3 + s0 + y * 4.3) * Math.sin(y * 7.7 - s0 + f * 2), dg = (f - Math.PI / 4) / 0.36;
        const R = rho_y * (1 - 0.13 * gy * (1 - Math.exp(-dg * dg))) * sq(f) * (1 + 0.045 * n);
        pos.push(-c + R * Math.cos(f), y, -c + R * Math.sin(f));
        const m2 = Math.sin(f * 7 + y * 13 + s0) * Math.sin(y * 17 - f * 5 + s0 * 0.5), m3 = Math.sin(f * 13 - y * 23 + s0 * 3);
        const k = (0.86 + 0.12 * n) * (0.9 + 0.1 * m2 + 0.05 * m3) * (groove < 0.95 ? 0.62 : 1) * (1 + 0.18 * over);
        col.push(k, k * 0.985, k * 0.955);
      }
    });
    const nr = ys.length;
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < NS; i++) { const a = j * NS + i, b = j * NS + ((i + 1) % NS), d = a + NS, e = b + NS; idx.push(a, d, b, b, d, e); }
    const cap = pos.length / 3; pos.push(-c, top + rise, -c); col.push(1.12, 1.1, 1.07);
    for (let i = 0; i < NS; i++) idx.push((nr - 1) * NS + i, cap, (nr - 1) * NS + ((i + 1) % NS));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  });

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
  // the touch pool (fix round 3: from the court floor it read as a plain 2 m dark-slate box — the rim's top stands over eye
  // height, so nothing in the pool showed): a 1930s touch pool dressed from outside its block, every part within 8 cm of
  // its faces or on its off-limits top edge, nothing on the dais (TOUCH, geo.js):
  //   · a cast-rockwork skin over every face (fix round 4: courses of rounded stones up to 7.8 cm proud with dark crevices
  //     and lit ledges), a rounded boulder pair wrapping each vertical corner over both faces and rising 0.22 m over the
  //     rim, and ten heavier boulders along the rim 0.2–0.3 m over it (LEAD-REVIEW art round 4: the round-3 rockery read
  //     as a painted box — thin fins at the corners, flat chips on the faces, an unbroken outline at the ends)
  //   · two brass-framed acrylic viewing panels at child height on each long face and a porthole in each end, the pool's
  //     water seen through them (looks.js traces it, with a sea star, an urchin and an anemone pressed to each face's glass)
  //   · a brass handrail along the rim on brackets, ball ends at the corners
  //   · TOUCH POOL · TWO FINGERS, PLEASE on a navy board in a brass frame between the court face's panels (0.15 m letters)
  D.aquarium_touchpool = {
    desc: 'the touch pool on its dais (pos = the dais top, 1.0; the pool block 5.0 × 2.6 to 2.0): rockery, panels, rail, sign',
    build(B) {
      const { w: BW, d: BD, h: BH, win, frame, panels, port } = TOUCH, hw = BW / 2, hd = BD / 2;
      const SKIN = '#aaa49a';
      // the skin: cast rockwork over every face, each to its face's edges (fix round 4: the corner boulders wrap the
      // corners now; the round-3 skins ran 3.5 cm past them and showed as a sliver through the boulders)
      // (flat behind the windows, the portholes and the sign: [x0, x1, y0, y1] in each skin's own frame — the arch face's is
      // turned, so its x runs the other way)
      const fy0 = win.y0 + win.h / 2 - frame.h / 2 - 0.03, fy1 = win.y0 + win.h / 2 + frame.h / 2 + 0.03;
      for (const s of [-1, 1]) {
        const holes = panels.filter((p) => p[0] === s).map(([, cx]) => [s * cx - frame.w / 2 - 0.03, s * cx + frame.w / 2 + 0.03, fy0, fy1]);
        if (s > 0) holes.push([-0.76, 0.76, 0.03, 0.8]);
        B.add('paint', rockSkinG(+(BW + 0.01).toFixed(3), BH + 0.004, 3 + s, holes.map((h) => h.map((v) => +v.toFixed(3)))), SKIN, 0, -0.002, s * hd, { ry: s > 0 ? 0 : PI });
        B.add('paint', rockSkinG(+(BD + 0.01).toFixed(3), BH + 0.002, 7 + s, [[-port.r - 0.07, port.r + 0.07, port.y - port.r - 0.07, port.y + port.r + 0.07].map((v) => +v.toFixed(3))]), SKIN, s * hw, -0.001, 0, { ry: s * HP });
      }
      // the rockery (fix round 4: LEAD-REVIEW art round 4 — four thin fins at the corners, flat chips on the faces, an
      // unbroken box outline at the ends): pale warm penguin-rock and granite greys. A rounded boulder pair wraps each
      // vertical corner over both faces and rises 0.22 m over the rim; heavier boulders sit along the rim, three on each
      // long face and two on each end, their tops 0.2–0.3 m over it. Each is placed by its own reach (reachOf), so nothing
      // stands more than 7.8 cm out of a face
      const ROCK = ['#bdb7ad', '#a8a298', '#c6c2ba', '#9b958c', '#b0aaa0'], OUT = 0.078;
      for (const [sx, sz, k] of [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]]) {
        // (the corner rock is built for the (+x, +z) corner: turned a quarter at a time for the others)
        const ry = sx > 0 ? (sz > 0 ? 0 : HP) : (sz > 0 ? -HP : PI);
        B.add('paint', cornerRockG(0.26, BH, 0.22 + 0.03 * (k % 2), OUT, 3 + k), ROCK[(k + 1) % 5], sx * hw, 0, sz * hd, { ry });
      }
      // a rim boulder on a face (f: +1 / −1 the long faces' z side, or the ends' x side with `end`), centred t along it
      const rim = (seed, end, f, t, len, depth, ht, y, c) => {
        const r = reachOf(seed);
        if (end) B.add('paint', blobG(seed), c, f * (hw + OUT - depth * (f > 0 ? r.x : r.nx)), y, t, { sx: depth, sy: ht, sz: len });
        else B.add('paint', blobG(seed), c, t, y, f * (hd + OUT - depth * (f > 0 ? r.z : r.nz)), { sx: len, sy: ht, sz: depth });
      };
      for (const f of [-1, 1]) {
        (f > 0 ? [-1.45, 0.02, 1.5] : [-1.25, 0.05, 1.3]).forEach((t, k) => rim(50 + k + (f > 0 ? 0 : 5), false, f, t, 0.62 - 0.06 * k, 0.24, 0.2 + 0.04 * ((k + (f > 0 ? 0 : 1)) % 2), 1.04, ROCK[(k + (f > 0 ? 1 : 3)) % 5]));
        for (const t of [-0.52, 0.55]) rim(60 + (t > 0 ? 1 : 0) + (f > 0 ? 2 : 0), true, f, t, 0.4, 0.24, 0.21, 1.05, ROCK[(t > 0 ? 4 : 1 + (f > 0 ? 1 : 0)) % 5]);
      }
      // the viewing panels: a brass frame round the acrylic (the glass and what is behind it: backdrop.js / looks.js), a sill
      // under it, four bolts
      for (const [s, cx] of panels) {
        B.push(cx, 0, s * hd, s > 0 ? 0 : PI);
        const fy = win.y0 + win.h / 2, fw = frame.w, fh = frame.h, bar = (fw - win.w) / 2;
        pbox(B, 'metal', K.brass, fw, bar, 0.03, 0, fy + fh / 2 - bar / 2, 0.06);
        pbox(B, 'metal', K.brass, fw, bar, 0.03, 0, fy - fh / 2 + bar / 2, 0.06);
        for (const sx of [-1, 1]) pbox(B, 'metal', K.brass, bar, fh - 2 * bar, 0.03, sx * (fw / 2 - bar / 2), fy, 0.06);
        pbox(B, NS('metal'), K.brassLt, fw + 0.04, 0.025, 0.07, 0, fy - fh / 2 - 0.012, 0.045);   // (the sill)
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.add(NS('metal'), sphG(0.016, 6, 4, HP), K.brassDk, sx * (fw / 2 - bar / 2), fy + sy * (fh / 2 - bar / 2), 0.068, { rx: HP });
        B.pop();
      }
      // the end portholes
      for (const s of [-1, 1]) {
        B.push(s * hw, 0, 0, s * HP);
        B.add('metal', torG(port.r + 0.03, 0.028, 8, 26), K.brass, 0, port.y, 0.05, {});
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; B.add(NS('metal'), sphG(0.014, 6, 4, HP), K.brassDk, Math.cos(a) * (port.r + 0.03), port.y + Math.sin(a) * (port.r + 0.03), 0.064, { rx: HP }); }
        B.pop();
      }
      // the handrail along the rim (6 cm out, at 0.86), brackets every metre; the court face's rail breaks round the sign
      const RY = 0.86, RO = 0.058;
      const rail = (P, Q, n) => { handrail(B, P, Q, { r: 0.018, ball: 0.026 }); for (let k = 0; k <= n; k++) { const t = n ? k / n : 0.5, x = P[0] + (Q[0] - P[0]) * t, z = P[2] + (Q[2] - P[2]) * t, nx = Math.abs(x) > hw ? Math.sign(x) : 0, nz = Math.abs(z) > hd ? Math.sign(z) : 0; strut(B, NS('metal'), K.brassDk, [x - nx * RO, RY, z - nz * RO], [x, RY, z], 0.025); } };
      // (fix round 4: they stop short of the corner boulders, which wrap 0.45 m of each face)
      rail([-hw + 0.52, RY, -(hd + RO)], [hw - 0.52, RY, -(hd + RO)], 4);
      rail([-hw + 0.52, RY, hd + RO], [-0.82, RY, hd + RO], 1);
      rail([0.82, RY, hd + RO], [hw - 0.52, RY, hd + RO], 1);
      for (const s of [-1, 1]) rail([s * (hw + RO), RY, -hd + 0.52], [s * (hw + RO), RY, hd - 0.52], 2);
      // the sign: TOUCH POOL · TWO FINGERS, PLEASE on three lines, navy in a brass frame
      B.push(0, 0, hd + 0.035, 0);
      { const sw = 1.42, sh = 0.7, sy = 0.06 + sh / 2;
        B.box('paint', K.navy, sw, sh, 0.03, 0, sy, 0.0, { r: 0.012 });
        for (const yy of [sy - sh / 2, sy + sh / 2]) pbox(B, NS('metal'), K.brass, sw + 0.05, 0.035, 0.04, 0, yy, 0.005);
        for (const xx of [-sw / 2, sw / 2]) pbox(B, NS('metal'), K.brass, 0.035, sh + 0.02, 0.04, xx, sy, 0.005);
        letters(B, 'TOUCH POOL', { h: 0.17, y: sy + 0.13, z: 0.016, c: K.brassLt, flat: true, mat: 'paint', wt: 0.18, track: 0.1 });
        pbox(B, NS('metal'), K.brass, 1.0, 0.012, 0.01, 0, sy + 0.09, 0.016);
        letters(B, 'TWO FINGERS,', { h: 0.15, y: sy - 0.09, z: 0.016, c: K.cream, flat: true, mat: 'paint', wt: 0.18, track: 0.1 });
        letters(B, 'PLEASE', { h: 0.15, y: sy - 0.29, z: 0.016, c: K.cream, flat: true, mat: 'paint', wt: 0.18, track: 0.1 }); }
      B.pop();
      // in the pool: rocks, starfish, urchins, anemones just under the water (the water: backdrop.js)
      for (let i = 0; i < 8; i++) {
        const x = -2.0 + i * 0.58, z = ((i * 37) % 7) / 7 - 0.5;
        B.add('paint', blobLoG(11 + (i % 3)), '#776f67', x, 1.0, z * 1.4, { sx: 0.3, sy: 0.12, sz: 0.25 });
        if (i % 2) for (let k = 0; k < 5; k++) pbox(B, NS('paint'), '#c96a4a', 0.18, 0.025, 0.05, x + 0.15 + Math.cos((k * TAU) / 5) * 0.08, 1.015, z * 1.4 + 0.2 - Math.sin((k * TAU) / 5) * 0.08, { ry: (k * TAU) / 5 });
        else B.add(NS('paint'), sphG(0.08, 8, 6), '#4b3b56', x + 0.2, 1.02, z * 1.4 - 0.25, {});
      }
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

  // ---------------------------------------------------------------------------------------------------- the deck's furniture
  // and the wing's cover (art round 1: "a ring of bare cubes", "mustard / blue-grey / green / pink cubes"). Each dresses an
  // inkable cover block from OUTSIDE its faces: brass lips at the top edge and corner angles a centimetre or two proud, feet,
  // handles, wheels, chutes and poles standing off a face; the faces themselves carry the block's pattern and, where a face
  // is worth it, a mural under the ink (murals.js 9–11). Nothing sits on a top anyone can stand on.
  // pos = the block's foot centre, rotY = its turn; o.w (local x), o.d (local z), o.h (its height over pos)
  const lip = (B, w, d, h, c = K.brass, t = 0.035, hh = 0.07) => {
    for (const s of [-1, 1]) { pbox(B, 'metal', c, w + 2 * t, hh, t, 0, h - hh / 2, s * (d / 2 + t / 2)); pbox(B, 'metal', c, t, hh, d, s * (w / 2 + t / 2), h - hh / 2, 0); }
  };
  const corners = (B, w, d, h, c = K.brass, t = 0.014, a = 0.07, y0 = 0) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      pbox(B, 'metal', c, a, h - y0, t, sx * (w / 2 - a / 2 + 0.01), y0 + (h - y0) / 2, sz * (d / 2 + t / 2));
      pbox(B, 'metal', c, t, h - y0, a, sx * (w / 2 + t / 2), y0 + (h - y0) / 2, sz * (d / 2 - a / 2 + 0.01));
    }
  };
  D.aquarium_hopper = {
    desc: "a fish-food hopper's brass lip, splayed feet, chute and scoop round its 1 × 1 cover block (o.out: the chute's face, local +x)",
    build(B, o) {
      const w = o.w ?? 1, d = o.d ?? 1, h = o.h ?? 1.2;
      lip(B, w, d, h, K.brassLt, 0.035, 0.09);
      corners(B, w, d, h * 0.52, K.seagreenDk, 0.016, 0.09);
      // splayed feet at the corners (angle iron, out and down to the deck)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(B, 'metal', K.seagreenDk, [sx * (w / 2 + 0.01), 0.42, sz * (d / 2 + 0.01)], [sx * (w / 2 + 0.12), 0.0, sz * (d / 2 + 0.12)], 0.06);
      // the chute on the outward face: a sloped steel spout under a brass-rimmed gate, a scoop on a hook beside it
      B.push(w / 2, 0, 0, HP);
      pbox(B, 'metal', K.steel, 0.36, 0.05, 0.34, 0, 0.52, 0.15, { rx: 0.45 });
      for (const s of [-1, 1]) pbox(B, 'metal', K.steel, 0.03, 0.12, 0.34, s * 0.18, 0.56, 0.15, { rx: 0.45 });
      pbox(B, 'metal', K.brassLt, 0.42, 0.22, 0.03, 0, 0.72, 0.015);
      cyl(B, 'metal', K.red, 0.05, 0.06, 0.24, 0.84, 0.05, { rx: HP, seg: 10 });
      rod(B, 'metal', K.steelDk, [-0.32, 0.95, 0.02], [-0.32, 0.95, 0.09], 0.012);
      B.add('metal', latheG('scoop', [[0, 0], [0.09, 0], [0.11, 0.12], [0.1, 0.12], [0.08, 0.02], [0, 0.02]], 10), K.steel, -0.32, 0.62, 0.12, { rx: 0.2 });
      rod(B, 'metal', K.teakDk, [-0.32, 0.76, 0.12], [-0.32, 0.94, 0.08], 0.014);
      B.pop();
    },
  };
  D.aquarium_hatch = {
    desc: "a feeding hatch's brass corner angles, top lip, hinge bars and ring pulls round its 2 × 1 cover block (local +z: the deck's middle)",
    build(B, o) {
      const w = o.w ?? 2, d = o.d ?? 1, h = o.h ?? 1.2;
      lip(B, w, d, h, K.brassLt, 0.03, 0.06);
      corners(B, w, d, h, K.brass, 0.014, 0.08);
      // hinge bars on the outer long face's top edge, a hasp on the inner face, ring pulls on both
      for (const x of [-0.6, 0.6]) { B.add('metal', cylGeo(0.035, 0.035, 0.34, 10), K.brass, x, h - 0.05, -d / 2 - 0.045, { rz: HP }); pbox(B, 'metal', K.brassDk, 0.3, 0.16, 0.012, x, h - 0.14, -d / 2 - 0.007); }
      pbox(B, 'metal', K.brassDk, 0.12, 0.2, 0.014, 0, h - 0.12, d / 2 + 0.008);
      for (const s of [-1, 1]) { B.push(0, 0, s * (d / 2 + 0.012), s > 0 ? 0 : PI); pbox(B, 'metal', K.brassDk, 0.1, 0.06, 0.012, 0, 0.52, 0); B.add('metal', torG(0.075, 0.014, 6, 16), K.brassLt, 0, 0.44, 0.022, { rx: 0.25 }); B.pop(); }
    },
  };
  D.aquarium_polerack = {
    desc: "the feeding-pole rack: poles, a net and a boat hook leaning on its outer face (local −z), a hose reel on its end",
    build(B, o) {
      const w = o.w ?? 2, d = o.d ?? 0.4, h = o.h ?? 1.0;
      lip(B, w, d, h, K.brass, 0.03, 0.06);
      corners(B, w, d, h, K.seagreenDk, 0.014, 0.06);
      // the rack's rail and its hooks on the outer face
      pbox(B, 'metal', K.brass, w * 0.9, 0.04, 0.04, 0, h * 0.82, -d / 2 - 0.05);
      const poles = [[-0.78, 2.0, '#b08a5e', 'wood'], [-0.48, 1.85, K.brass, 'metal'], [-0.18, 2.1, '#a07c52', 'wood'], [0.12, 1.75, '#c09a6a', 'wood'], [0.42, 1.95, '#b08a5e', 'wood'], [0.72, 1.7, K.brass, 'metal']];
      poles.forEach(([x, L, c, m], i) => {
        const P = [x, 0.02, -d / 2 - 0.16], Q = [x + 0.12 * (i % 2 ? 1 : -1), L, -d / 2 - 0.05];
        rod(B, m, c, P, Q, 0.024, { seg: 6 });
        if (i === 1) { B.add('metal', torG(0.2, 0.014, 4, 18), K.steelDk, Q[0], Q[1] + 0.18, Q[2], { rx: HP * 0.9 }); for (let k = 0; k < 5; k++) rod(B, 'metal', K.rope, [Q[0] + Math.cos(k * 1.26) * 0.18, Q[1] + 0.18, Q[2] + Math.sin(k * 1.26) * 0.05], [Q[0], Q[1] - 0.1, Q[2]], 0.006, { seg: 3 }); }
        if (i === 4) { rod(B, 'metal', K.steelDk, Q, [Q[0], Q[1] + 0.16, Q[2]], 0.015); rod(B, 'metal', K.steelDk, [Q[0], Q[1] + 0.16, Q[2]], [Q[0] + 0.1, Q[1] + 0.08, Q[2]], 0.013); }
      });
      // the hose reel on the +x end: a red drum between two discs with the green hose coiled on it
      B.push(w / 2 + 0.03, 0, 0, HP);
      for (const s of [-1, 1]) cyl(B, 'metal', K.redDk, 0.3, 0.02, 0, 0.55, s * 0.09, { rx: HP, seg: 18 });
      for (let k = 0; k < 4; k++) B.add('gloss', torG(0.19 + k * 0.025, 0.022, 6, 18), '#3f6b4f', 0, 0.55, -0.06 + k * 0.04, {});
      cyl(B, 'metal', K.steelDk, 0.05, 0.24, 0, 0.55, 0, { rx: HP, seg: 10 });
      B.pop();
    },
  };
  D.aquarium_turnstile = {
    desc: "a turnstile's brass posts, stainless top and arms, coin box round its cover block (o.gap: the passage side, ±1 local x)",
    build(B, o) {
      const w = o.w ?? 0.6, d = o.d ?? 0.6, h = o.h ?? 1.0, g = o.gap ?? 1;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(B, 'metal', K.brassLt, 0.03, h + 0.02, sx * (w / 2 + 0.01), (h + 0.02) / 2, sz * (d / 2 + 0.01), { seg: 8 });
      pbox(B, 'metal', '#c9cfd2', w + 0.08, 0.035, d + 0.08, 0, h + 0.02, 0);
      // the hub on the passage side and its three stainless arms (one level across the gap)
      B.push(g * (w / 2 + 0.03), h * 0.8, 0, 0);
      cyl(B, 'metal', '#c9cfd2', 0.07, 0.12, 0, 0, 0, { rz: HP, seg: 12 });
      for (let k = 0; k < 3; k++) { const a = (k * TAU) / 3; rod(B, 'metal', '#d9dee0', [g * 0.05, 0, 0], [g * (0.05 + 0.42 * Math.cos(a)), 0.42 * Math.sin(a), 0], 0.018); }
      B.pop();
      // the coin box on the queue side (local −z) with its slot and a brass plate
      B.push(0, 0, -d / 2 - 0.05, 0);
      pbox(B, 'metal', K.brass, 0.22, 0.26, 0.1, 0, h * 0.72, 0);
      pbox(B, NS('paint'), K.ink, 0.1, 0.012, 0.01, 0, h * 0.78, -0.051);
      B.pop();
    },
  };
  D.aquarium_trolley = {
    desc: "a luggage trolley round a cover block: wheels, a brass push handle at one end, side rails and luggage straps",
    build(B, o) {
      const w = o.w ?? 2, d = o.d ?? 1, h = o.h ?? 1.4, long = w >= d;
      const L = long ? w : d, S = long ? d : w;
      B.push(0, 0, 0, long ? 0 : HP);
      // wheels at the four bottom corners (outside the long faces), the chassis rail
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(B, 'rubber', K.rubber, 0.13, 0.06, sx * (L / 2 - 0.22), 0.13, sz * (S / 2 + 0.035), { rx: HP, seg: 14 }); cyl(B, 'metal', K.steel, 0.05, 0.07, sx * (L / 2 - 0.22), 0.13, sz * (S / 2 + 0.04), { rx: HP, seg: 8 }); }
      for (const sz of [-1, 1]) { pbox(B, 'metal', K.steelDk, L + 0.04, 0.05, 0.03, 0, 0.3, sz * (S / 2 + 0.016)); rod(B, 'metal', K.brass, [-L / 2, h - 0.12, sz * (S / 2 + 0.03)], [L / 2, h - 0.12, sz * (S / 2 + 0.03)], 0.016); }
      // the push handle at the −x end: a brass U out and up
      for (const sz of [-1, 1]) rod(B, 'metal', K.brass, [-L / 2 - 0.01, h - 0.15, sz * (S / 2 - 0.08)], [-L / 2 - 0.26, h + 0.22, sz * (S / 2 - 0.08)], 0.02);
      rod(B, 'metal', K.brassLt, [-L / 2 - 0.26, h + 0.22, -(S / 2 - 0.08)], [-L / 2 - 0.26, h + 0.22, S / 2 - 0.08], 0.022);
      // luggage straps down the long faces (leather, a brass buckle), a luggage tag
      for (const x of [-L * 0.22, L * 0.24]) for (const sz of [-1, 1]) { pbox(B, 'paint', '#6b4a2e', 0.07, h - 0.36, 0.012, x, (h + 0.36) / 2, sz * (S / 2 + 0.007)); pbox(B, NS('metal'), K.brassLt, 0.09, 0.06, 0.016, x, h * 0.6, sz * (S / 2 + 0.01)); }
      pbox(B, 'paint', K.cream, 0.12, 0.08, 0.01, L / 2 - 0.3, h * 0.82, S / 2 + 0.02, { rz: 0.3 });
      B.pop();
    },
  };
  // ---------------------------------------------------------------------------------------------------- planter deco
  // (fix round 4: LEAD-REVIEW art round 4 — the planters in front of both spawns were undressed cubes.) The planters are
  // inkable cover, so their faces and tops are drawn under the ink (floorart.js: cast stone in courses, a granite plinth,
  // faience speed lines, the coping band over the block's own rounded edge, the sea-holly bed, the topiary's clipped
  // fish); here only what must stand off them: trailing planting spilling over the coping and down the faces (every
  // leaf within 6 cm of its face and under the walkable top) with a sea-holly head here and there, and brass plates.
  // a strand of the trailing planting: leaf pairs down a wandering stem from its top (y 0) to −len, against a face (local
  // +z out of it; every leaf from 0 to 5.5 cm out), vertex colours (multipliers of the part's green)
  const frac = (v) => v - Math.floor(v);
  const rnd1 = (k) => frac(Math.sin(k * 127.1 + 31.7) * 43758.5453);
  const strandG = (len, seed) => tpl(`strand|${len.toFixed(2)}|${seed}`, () => {
    const g = new GB(), n = Math.max(2, Math.round(len / 0.065));
    let x = 0;
    for (let i = 0; i < n; i++) {
      const y = -0.02 - (i * (len - 0.03)) / n, sz = 0.072 * (1 - (0.35 * i) / n), z0 = Math.min(0.026, 0.006 + (0.02 * i) / Math.max(1, n - 1));
      x += 0.016 * Math.sin(seed * 2.3 + i * 1.9);
      for (const sd of [-1, 1]) {
        const L = sz * (0.8 + 0.4 * rnd1(seed * 13 + i * 2 + sd)), tone = 0.75 + 0.5 * rnd1(seed * 7 + i * 3 + sd);
        const ang = sd * (0.55 + 0.35 * rnd1(seed + i * 5 + sd)) - Math.PI / 2;   // (down and out to the side)
        const dx = Math.cos(ang), dy = Math.sin(ang), wx = -dy * L * 0.36, wy = dx * L * 0.36;
        const zt = z0 + 0.012 + 0.012 * rnd1(seed * 3 + i + sd);
        const a = g.v(x, y, z0, 0, 0.3, 1, tone * 0.85), b = g.v(x + dx * L * 0.5 + wx, y + dy * L * 0.5 + wy, (z0 + zt) / 2 + 0.004, 0, 0.3, 1, tone);
        const c = g.v(x + dx * L, y + dy * L, zt, 0, 0.3, 1, tone * 1.1), d = g.v(x + dx * L * 0.5 - wx, y + dy * L * 0.5 - wy, (z0 + zt) / 2 + 0.004, 0, 0.3, 1, tone * 0.95);
        g.quad(a, b, c, d);
      }
    }
    return g.geo();
  });
  // a sea-holly head: a steel-blue cone in a ruff of six spiny bracts (facing +z, within 3 cm of its centre)
  const hollyG = () => tpl('holly', () => {
    const g = new GB();
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * TAU, a1 = a0 + 0.35, am = a0 + 0.17;
      const o = g.v(0, 0, 0.004, 0, 0, 1, 0.9), p = g.v(Math.cos(a0) * 0.012, Math.sin(a0) * 0.012, 0.006, 0, 0, 1, 0.95);
      const t = g.v(Math.cos(am) * 0.03, Math.sin(am) * 0.03, 0.002, 0, 0, 1, 1.15), q = g.v(Math.cos(a1) * 0.012, Math.sin(a1) * 0.012, 0.006, 0, 0, 1, 0.95);
      g.tri(o, p, t); g.tri(o, t, q);
    }
    return g.geo();
  });
  const coneG = () => tpl('hollycone', () => new THREE.IcosahedronGeometry(0.011, 0).scale(1, 1.25, 1));
  // strands at t along a face (a frame: origin on the face at its top edge, +z out): len, seed; a head on every other
  const strands = (B, list) => {
    for (const [t, len, seed] of list) {
      // a cascade: the long strand and two shorter ones either side of it, a little proud of the face
      B.add('paint', strandG(len, seed), '#56703f', t, -0.004, 0, {});
      B.add('paint', strandG(+(len * 0.6).toFixed(2), seed + 101), '#4d6a39', t - 0.07, -0.006, 0.004, {});
      B.add('paint', strandG(+(len * 0.45).toFixed(2), seed + 202), '#5f7a45', t + 0.075, -0.005, 0.002, {});
      if (seed % 2 === 0) {
        const hy = -0.06 - 0.5 * len * rnd1(seed * 9), hx = t + 0.03 * Math.sin(seed);
        B.add('paint', hollyG(), '#7d8ea4', hx, hy, 0.03, {});
        B.add('paint', coneG(), '#4a5684', hx, hy, 0.036, {});
      }
    }
  };
  D.aquarium_planterdeco = {
    desc: "a Deco planter's trailing planting and brass plates (kind 'oct': a round planter of apothem r, its spokes' tops "
      + "stepping down 9 cm from top; 'box': w × d, top h; pos = its foot centre, rotY its turn)",
    build(B, o) {
      const seed0 = o.seed ?? 1;
      if (o.kind === 'oct') {
        const r = o.r ?? 1.0, top = o.top ?? 1.2, skip = o.skip ?? [];
        for (let k = 0; k < 8; k++) {
          if (skip.includes(k)) continue;
          const a = (k * PI) / 4, h = top - 0.09 * (k % 4), L = 2 * r * Math.tan(PI / 8);
          // (the builder's frame: local x = world x; the face's outward normal at bearing a, i.e. (cos a, sin a) in (x, z))
          B.push(Math.cos(a) * r, h, Math.sin(a) * r, Math.atan2(Math.cos(a), Math.sin(a)));
          const sd = seed0 * 17 + k;
          strands(B, [[(rnd1(sd) - 0.5) * L * 0.5, 0.22 + 0.2 * rnd1(sd + 1), sd]]);
          B.pop();
        }
        return;
      }
      const w = o.w ?? 2, d = o.d ?? 2, h = o.h ?? 1.1;
      for (const [fx, fz, len] of [[0, 1, w], [0, -1, w], [1, 0, d], [-1, 0, d]]) {
        B.push((fx * w) / 2, h, (fz * d) / 2, Math.atan2(fx, fz));
        const n = Math.max(1, Math.round(len / 0.75)), list = [];
        for (let i = 0; i < n; i++) { const sd = seed0 * 31 + i * 7 + (fx + 2) * 3 + fz * 11 + 40; list.push([(-len / 2 + ((i + 0.5) * len) / n) + (rnd1(sd) - 0.5) * 0.25, 0.2 + 0.28 * rnd1(sd + 2), sd]); }
        strands(B, list);
        B.pop();
      }
      for (const pl of o.plates || []) {
        const [fx, fz] = pl.face;
        B.push((fx * w) / 2 + fx * 0.004, 0, (fz * d) / 2 + fz * 0.004, Math.atan2(fx, fz));
        sign(B, pl.label, pl.x ?? 0, pl.y ?? h * 0.62, { h: 0.06, board: K.brass, c: K.ink, border: false, pad: 0.04, track: 0.1 });
        B.pop();
      }
    },
  };
  D.aquarium_planterdress = {
    desc: "a round planter's granite lip and brass name plates (r = its apothem, h its top)",
    build(B, o) {
      const r = o.r ?? 0.9, h = o.h ?? 1.3;
      B.add('paint', cylGeo(r / Math.cos(PI / 8) + 0.04, r / Math.cos(PI / 8) + 0.06, 0.16, 8, true), K.granite, 0, 0.08, 0, { ry: PI / 8 });
      for (const a of o.plates || [0]) { B.push(Math.sin(a) * (r + 0.012), 0, Math.cos(a) * (r + 0.012), a); sign(B, o.label || 'FISH TOPIARY', 0, 0.62, { h: 0.06, board: K.brass, c: K.ink, border: false, pad: 0.04, track: 0.1 }); B.pop(); }
    },
  };
  D.aquarium_ticketcanopy = {
    desc: 'the ticket-machine bank: its Deco canopy on two posts (inside the bank) with TICKETS on both edges and a lamp',
    build(B, o) {
      const w = o.w ?? 2.4, d = o.d ?? 0.8, h = o.h ?? 1.5;
      lip(B, w, d, h, K.brass, 0.03, 0.06);
      for (const sx of [-1, 1]) { cyl(B, 'metal', K.brass, 0.045, 2.35, sx * (w / 2 + 0.07), 2.35 / 2, 0, { seg: 10 }); B.add('paint', cylGeo(0.1, 0.12, 0.12, 10), K.granite, sx * (w / 2 + 0.07), 0.06, 0, {}); }
      B.box('paint', K.render, w + 0.5, 0.14, d + 1.0, 0, 2.42, 0, { r: 0.05 });
      pbox(B, 'gloss', K.faience, w + 0.52, 0.04, d + 1.02, 0, 2.38, 0);
      for (const s of [-1, 1]) { B.push(0, 0, s * (d / 2 + 0.51), s > 0 ? 0 : PI); letters(B, 'TICKETS', { h: 0.1, y: 2.38, z: 0.005, c: K.navy, flat: true, mat: 'paint', track: 0.14 }); B.pop(); }
      globe(B, 0, 2.28, 0, 0.09, { glow: 1.3 });
    },
  };
  D.aquarium_cartdress = {
    desc: "the gelato cart's brass bands, its handle and a GELATO board on the parasol pole (the cart block 1.4 × 1.5, to 1.4)",
    build(B, o) {
      const w = o.w ?? 1.4, d = o.d ?? 1.5, h = o.h ?? 1.4;
      lip(B, w, d, h, K.brassLt, 0.03, 0.07);
      for (const y of [0.42, 0.5]) for (const s of [-1, 1]) { pbox(B, 'gloss', K.coral, w + 0.04, 0.05, 0.012, 0, y, s * (d / 2 + 0.006)); pbox(B, 'gloss', K.coral, 0.012, 0.05, d + 0.04, s * (w / 2 + 0.006), y, 0); }
      for (const s of [-1, 1]) rod(B, 'metal', K.brass, [-w / 2 - 0.01, h - 0.2, s * 0.45], [-w / 2 - 0.3, h - 0.1, s * 0.45], 0.018);
      rod(B, 'metal', K.brassLt, [-w / 2 - 0.3, h - 0.1, -0.45], [-w / 2 - 0.3, h - 0.1, 0.45], 0.02);
      B.push(0.55, 0, -0.6, -HP);
      B.box('paint', K.cream, 0.7, 0.24, 0.03, 0, 2.55, 0.03, { r: 0.02 });
      letters(B, 'GELATO', { h: 0.12, y: 2.49, z: 0.05, c: K.coralDk, flat: true, mat: 'paint', track: 0.14 });
      B.pop();
    },
  };

  D.aquarium_scale = {
    desc: "the Ticket Hall's luggage scale round its cover block: a brass dial on its hall-side face, the weighing plate's rim",
    build(B, o) {
      const w = o.w ?? 1.2, d = o.d ?? 1.0, h = o.h ?? 1.2;
      lip(B, w, d, h, K.brassDk, 0.03, 0.05);
      B.push(w / 2 + 0.01, 0, 0, HP);
      B.add('metal', torG(0.24, 0.035, 6, 24), K.brassLt, 0, h * 0.62, 0.03, {});
      B.add('glow', cylGeo(0.23, 0.23, 0.02, 24), K.cream, 0, h * 0.62, 0.02, { rx: HP, glow: 0.8 });
      for (let i = 0; i < 10; i++) { const a = -2.2 + (i / 9) * 4.4; pbox(B, NS('paint'), K.ink, 0.012, 0.04, 0.01, Math.sin(a) * 0.18, h * 0.62 + Math.cos(a) * 0.18, 0.035, { rz: -a }); }
      pbox(B, NS('paint'), K.red, 0.012, 0.17, 0.01, 0.04, h * 0.62 + 0.06, 0.04, { rz: -0.5 });
      letters(B, 'LUGGAGE', { h: 0.06, y: h * 0.62 - 0.36, z: 0.012, c: K.ink, flat: true, mat: 'paint' });
      B.pop();
    },
  };
  D.aquarium_pegs = {
    desc: "the school-trip coat pegs: brass pegs along both long faces' top edges with coats, satchels and caps hanging",
    build(B, o) {
      const w = o.w ?? 1.4, d = o.d ?? 0.6, h = o.h ?? 1.1;
      lip(B, w, d, h, K.brass, 0.025, 0.05);
      const cols = ['#c0574a', '#4f6f9c', '#d9b24a', '#5d8a64', '#8a5a9c', '#d98a4a'];
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
        const x = -w / 2 + 0.16 + i * ((w - 0.32) / 4), z = s * (d / 2 + 0.02);
        rod(B, 'metal', K.brassLt, [x, h - 0.12, s * d / 2], [x, h - 0.08, z + s * 0.06], 0.012);
        const c = cols[(i + (s > 0 ? 0 : 3)) % cols.length];
        if (i % 2 === 0) B.box('paint', c, 0.2, 0.42, 0.05, x, h - 0.36, z + s * 0.02, { r: 0.03 });
        else { B.box('paint', c, 0.18, 0.16, 0.08, x, h - 0.26, z + s * 0.04, { r: 0.03 }); rod(B, 'paint', '#3b2a1e', [x - 0.08, h - 0.18, z + s * 0.04], [x, h - 0.1, z + s * 0.06], 0.008); }
      }
    },
  };
  // the wing's small things out of the lanes (visual only, like every prop here: against walls, beside cover, behind the
  // queue): A-boards, a bench, queue stanchions with their rope, stacked luggage
  D.aquarium_aboard = {
    desc: "a folding A-board sign (o.text, o.sub; local +z its face)",
    build(B, o) {
      for (const s of [-1, 1]) {
        B.push(0, 0, s * 0.16, s > 0 ? 0 : PI);
        B.box('paint', K.navy, 0.62, 0.86, 0.03, 0, 0.52, 0, { r: 0.015, rx: -0.18 });
        B.push(0, 0.52, 0.02, 0, -0.18);
        letters(B, o.text || 'FLOOR DRY', { h: 0.09, y: 0.12, z: 0.0, c: K.cream, flat: true, mat: 'paint', track: 0.12 });
        if (o.sub) letters(B, o.sub, { h: 0.06, y: -0.04, z: 0.0, c: K.brassLt, flat: true, mat: 'paint', track: 0.1 });
        B.pop(); B.pop();
      }
      for (const s of [-1, 1]) pbox(B, 'metal', K.brass, 0.6, 0.025, 0.02, 0, 0.97, s * 0.02);
    },
  };
  D.aquarium_bench = {
    desc: 'a Deco teak bench with brass ends (o.len along local x; its back to local −z)',
    build(B, o) {
      const L = o.len ?? 1.8;
      for (const z of [-0.12, 0.0, 0.12]) pbox(B, 'wood', K.teak, L, 0.04, 0.1, 0, 0.44, z);
      for (const y of [0.62, 0.76]) pbox(B, 'wood', K.teak, L, 0.09, 0.03, 0, y, -0.2, { rx: 0.12 });
      for (const s of [-1, 1]) { B.add('metal', torG(0.24, 0.035, 6, 16, PI), K.brass, s * (L / 2 - 0.05), 0.24, 0, { ry: HP }); pbox(B, 'metal', K.brass, 0.05, 0.85, 0.05, s * (L / 2 - 0.05), 0.42, -0.2); }
    },
  };
  D.aquarium_stanchions = {
    desc: 'queue stanchions along local x (o.len, o.n posts) with a red rope between them',
    build(B, o) {
      const L = o.len ?? 2.6, n = o.n ?? 4;
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + (L * i) / (n - 1);
        B.add('metal', latheG('stanch', [[0, 0], [0.16, 0], [0.16, 0.03], [0.04, 0.05], [0.025, 0.9], [0.045, 0.94], [0.03, 0.98], [0, 0.98]], 12), K.brassLt, x, 0, 0, {});
        if (i < n - 1) { const x1 = -L / 2 + (L * (i + 1)) / (n - 1); for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, sag = (t) => 0.82 - 0.12 * Math.sin(t * PI); rod(B, 'gloss', K.red, [x + (x1 - x) * t0, sag(t0), 0], [x + (x1 - x) * t1, sag(t1), 0], 0.02, { seg: 6 }); } }
      }
    },
  };
  D.aquarium_luggage = {
    desc: 'stacked luggage: two suitcases, a trunk, a hatbox',
    build(B) {
      B.box('paint', '#7a5236', 0.9, 0.42, 0.55, 0, 0.21, 0, { r: 0.04 });
      for (const x of [-0.3, 0.3]) pbox(B, 'metal', K.brassLt, 0.06, 0.44, 0.57, x, 0.21, 0);
      B.box('paint', '#2f5a63', 0.62, 0.36, 0.42, 0.05, 0.6, 0.02, { r: 0.05, ry: 0.2 });
      pbox(B, 'paint', '#3b2a1e', 0.2, 0.04, 0.04, 0.05, 0.8, 0.02, { ry: 0.2 });
      B.box('paint', '#c9a978', 0.5, 0.3, 0.36, -0.05, 0.93, -0.02, { r: 0.05, ry: -0.3 });
      cyl(B, 'paint', '#d9b6b0', 0.2, 0.22, 0.62, 0.11, 0.42, { seg: 16 });
      pbox(B, 'paint', K.cream, 0.1, 0.07, 0.01, 0.2, 0.3, 0.28, { rz: 0.4 });
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
