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
  // (fix round 7, LEAD-REVIEW 7: only the front was dressed; the other three faces were the body's plain render, its 18 cm
  // chamfers showing the block's own cream at every corner, foot and head.) Every face now: a black-granite skirting with a
  // brass line, a square render pilaster on each corner (a fluted face each way, 2 cm proud of the body) carrying a render
  // frieze under the cornice with three faience speed lines that run round every face and across the pilasters; the
  // trade's own boards on the plain faces — ice cream: the flavours board on the back (GELATO style), a striped service
  // shutter on each side; souvenirs: a framed GULPER AQUARIUM GIFTS poster with a plush shark on the back; ferry: the FERRY
  // TO INKOPOLIS route board on the back, a porthole service door on the free side. In the block's frame (BW × BD, local +z
  // the front), z out of each face from the block's own face: everything within 8.5 cm of it, nothing over the cornice
  // (its underside h − 0.345)
  D.aquarium_kioskfaces = {
    desc: "a kiosk's other faces (fix round 7): skirting, corner pilasters, the frieze's speed lines, the trade's boards (kind: icecream | souvenir | ferry)",
    build(B, o) { const kind = o.kind || 'icecream'; kioskFaces(B, kind, o.w ?? 2.5, o.d ?? 2.5, o.h ?? 2.6, kind === 'souvenir' ? K.coral : kind === 'ferry' ? K.navy : K.faience); },
  };
  function kioskFaces(B, kind, BW, BD, h, band) {
    const top = h - 0.345, y0 = 0.16;
    // the skirting and its brass line, round the foot (over the body's foot chamfer)
    pbox(B, 'paint', K.granite, BW + 0.104, y0, BD + 0.104, 0, y0 / 2, 0);
    pbox(B, NS('metal'), K.brass, BW + 0.112, 0.016, BD + 0.112, 0, y0 + 0.006, 0);
    // the corner pilasters (0.18 square, 5 cm proud of the block's faces: 2 cm over the body's), a flute up each outer face
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (BW / 2 - 0.04), cz = sz * (BD / 2 - 0.04);
      pbox(B, 'paint', K.render, 0.18, top - y0, 0.18, cx, (top + y0) / 2, cz);
      pbox(B, NS('paint'), K.renderSh, 0.03, top - y0 - 0.34, 0.004, cx, (top + y0) / 2 - 0.04, sz * (BD / 2 + 0.052));
      pbox(B, NS('paint'), K.renderSh, 0.004, top - y0 - 0.34, 0.03, sx * (BW / 2 + 0.052), (top + y0) / 2 - 0.04, cz);
    }
    const face = (s, fn) => { B.push(0, 0, 0, (s * PI) / 2); B.push(0, 0, (s % 2 ? BW : BD) / 2, 0); fn(s % 2 ? BD : BW); B.pop(); B.pop(); };
    // the frieze between the pilasters (over the body's head chamfer, where the block showed), the three speed lines round
    // it and across the pilasters; on a front whose serving window reaches into it (the ferry kiosk), only across them
    const fz0 = top - 0.215, lines = [top - 0.17, top - 0.1, top - 0.03];
    for (const s of [0, 1, 2, 3]) face(s, (L) => {
      const win = s === 0 && fz0 < 2.01;
      if (!win) pbox(B, 'paint', K.render, L - 0.2, 0.215, 0.05, 0, fz0 + 0.1075, 0.01);
      for (const y of lines) {
        if (win) for (const e of [-1, 1]) pbox(B, NS('gloss'), K.faience, 0.18, 0.035, 0.008, e * (L / 2 - 0.04), y - 0.0175, 0.054);
        else pbox(B, NS('gloss'), K.faience, L + 0.116, 0.035, 0.03, 0, y - 0.0175, 0.043);
      }
    });
    // the trade's boards (z from the block's face: the body's face is at 0.03)
    if (kind === 'icecream') {
      // the back: the flavours board in the ice-cream cart's GELATO style (cream letters on sea-green in a brass frame),
      // a painted cone roundel, a row of scoops
      face(2, () => {
        const y = 1.06, bw = 1.9, bh = 0.92, zb = 0.03;
        B.box('paint', '#3f5a52', bw, bh, 0.022, 0, y + bh / 2, zb + 0.011, { r: 0.008 });
        for (const yy of [y, y + bh]) pbox(B, NS('metal'), K.brass, bw + 0.03, 0.024, 0.03, 0, yy, zb + 0.015);
        for (const xx of [-bw / 2, bw / 2]) pbox(B, NS('metal'), K.brass, 0.024, bh + 0.02, 0.03, xx, y + bh / 2, zb + 0.015);
        // the roundel: a cream disc in a brass ring, a cone with two scoops painted on it
        const rx = -0.6, ry = y + bh / 2;
        B.add('metal', torG(0.29, 0.022, 6, 28), K.brass, rx, ry, zb + 0.03, {});
        B.add('paint', cylGeo(0.29, 0.29, 0.012, 28), K.cream, rx, ry, zb + 0.028, { rx: HP });
        B.add('paint', latheG('cone', [[0, 0], [0.32, 0.9], [0.34, 0.95], [0, 0.95]], 12), K.mustard, rx, ry - 0.2, zb + 0.035, { s: 0.27, sz: 0.03 });
        B.add('paint', sphG(0.38, 14, 10), '#e9b9b0', rx - 0.045, ry + 0.07, zb + 0.035, { s: 0.2, sz: 0.025 });
        B.add('paint', sphG(0.38, 14, 10), '#f1e3d3', rx + 0.05, ry + 0.11, zb + 0.036, { s: 0.18, sz: 0.025 });
        letters(B, 'ICE CREAM', { h: 0.15, x: 0.3, y: y + 0.6, z: zb + 0.023, c: K.cream, flat: true, mat: 'paint', wt: 0.19, track: 0.12 });
        letters(B, 'CORNETS · WAFERS · 2 SCOOPS', { h: 0.052, x: 0.3, y: y + 0.45, z: zb + 0.023, c: K.brassLt, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
        ['#f1e3d3', '#e9b9b0', '#b9c98a', '#6e4a32', '#ecd77a'].forEach((c, i) => {
          const x = -0.14 + i * 0.22;
          B.add('paint', cylGeo(0.062, 0.062, 0.01, 16), c, x, y + 0.24, zb + 0.027, { rx: HP });
          B.add('paint', cylGeo(0.07, 0.07, 0.006, 16), K.cream, x, y + 0.24, zb + 0.023, { rx: HP });
        });
      });
      // each side: a closed roller shutter (stripes in the awning's colours, slat lines), its box over it, guide rails, a
      // brass bottom rail with a pull
      for (const s of [1, 3]) face(s, () => {
        const sw = 1.5, y = 1.12, sh = 0.82, zb = 0.03, n = 10;
        for (let i = 0; i < n; i++) pbox(B, 'paint', i % 2 ? K.stripeA : band, sw / n, sh, 0.012, -sw / 2 + (i + 0.5) * (sw / n), y + sh / 2, zb + 0.006);
        for (let j = 1; j < 12; j++) pbox(B, NS('paint'), K.renderSh, sw, 0.006, 0.014, 0, y + (j * sh) / 12, zb + 0.007);
        B.box('paint', K.render, sw + 0.12, 0.13, 0.045, 0, y + sh + 0.065, zb + 0.0225, { r: 0.015 });
        pbox(B, NS('gloss'), band, sw + 0.13, 0.022, 0.047, 0, y + sh + 0.03, zb + 0.0235);
        for (const e of [-1, 1]) pbox(B, NS('metal'), K.steel, 0.035, sh + 0.02, 0.025, e * (sw / 2 + 0.017), y + sh / 2, zb + 0.0125);
        pbox(B, NS('metal'), K.brass, sw + 0.02, 0.035, 0.03, 0, y + 0.017, zb + 0.015);
        pbox(B, NS('metal'), K.brassLt, 0.14, 0.025, 0.022, 0, y + 0.06, zb + 0.041);
      });
    } else if (kind === 'souvenir') {
      // the back: a framed poster — GULPER AQUARIUM over a plush shark on sea-blue, GIFTS under it
      face(2, () => {
        const y = 1.0, pw = 1.36, ph = 0.98, zb = 0.03;
        B.box('paint', '#2f5f73', pw, ph, 0.018, 0, y + ph / 2, zb + 0.009, { r: 0.006 });
        pbox(B, NS('paint'), K.cream, pw - 0.1, 0.012, 0.004, 0, y + ph - 0.08, zb + 0.02);
        pbox(B, NS('paint'), K.cream, pw - 0.1, 0.012, 0.004, 0, y + 0.27, zb + 0.02);
        for (const yy of [y, y + ph]) pbox(B, NS('metal'), K.brass, pw + 0.05, 0.03, 0.034, 0, yy, zb + 0.017);
        for (const xx of [-pw / 2, pw / 2]) pbox(B, NS('metal'), K.brass, 0.03, ph + 0.03, 0.034, xx, y + ph / 2, zb + 0.017);
        letters(B, 'GULPER AQUARIUM', { h: 0.075, y: y + ph - 0.18, z: zb + 0.019, c: K.cream, flat: true, mat: 'paint', wt: 0.2, track: 0.12 });
        letters(B, 'GIFTS', { h: 0.15, y: y + 0.07, z: zb + 0.019, c: K.coralLt, flat: true, mat: 'paint', wt: 0.2, track: 0.16 });
        // the plush shark (grey, white belly, fins, an eye), in low relief
        const sx = 0, sy = y + 0.53, zs = zb + 0.03;
        B.add('paint', sphG(0.38, 14, 10), K.plush, sx, sy, zs, { sx: 0.95, sy: 0.38, sz: 0.04 });
        B.add('paint', sphG(0.3, 12, 8), K.white, sx + 0.02, sy - 0.05, zs + 0.004, { sx: 0.9, sy: 0.2, sz: 0.035 });
        B.add('paint', cylGeo(0, 0.09, 0.2, 3), K.plush, sx - 0.02, sy + 0.17, zs, { sz: 0.12 });
        B.add('paint', cylGeo(0, 0.09, 0.22, 3), K.plush, sx - 0.4, sy + 0.02, zs, { rz: 1.2, sz: 0.12 });
        B.add('paint', cylGeo(0, 0.08, 0.2, 3), K.plush, sx - 0.39, sy - 0.08, zs, { rz: 1.95, sz: 0.12 });
        B.add('paint', sphG(0.014, 8, 6), K.ink, sx + 0.24, sy + 0.04, zs + 0.006, {});
      });
    } else if (kind === 'ferry') {
      // the back: the FERRY TO INKOPOLIS route board in the Ticket Hall plate's navy and brass (the route: two stops and a
      // ferry between them)
      face(2, () => {
        const y = 1.1, bw = 1.62, bh = 0.66, zb = 0.03;
        B.box('paint', K.navy, bw, bh, 0.022, 0, y + bh / 2, zb + 0.011, { r: 0.008 });
        for (const yy of [y, y + bh]) pbox(B, NS('metal'), K.brass, bw + 0.03, 0.024, 0.032, 0, yy, zb + 0.016);
        for (const xx of [-bw / 2, bw / 2]) pbox(B, NS('metal'), K.brass, 0.024, bh + 0.02, 0.032, xx, y + bh / 2, zb + 0.016);
        letters(B, 'FERRY TO INKOPOLIS', { h: 0.085, y: y + bh - 0.15, z: zb + 0.023, c: K.brassLt, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
        letters(B, 'SAILINGS EVERY 20 MINUTES', { h: 0.048, y: y + 0.06, z: zb + 0.023, c: K.cream, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
        const ly = y + 0.3;
        pbox(B, NS('paint'), K.cream, 1.1, 0.014, 0.004, 0, ly, zb + 0.024);
        for (const e of [-1, 1]) {
          B.add('paint', cylGeo(0.045, 0.045, 0.008, 16), K.brassLt, e * 0.58, ly, zb + 0.026, { rx: HP });
          B.add('paint', cylGeo(0.025, 0.025, 0.01, 12), K.navy, e * 0.58, ly, zb + 0.028, { rx: HP });
        }
        letters(B, 'AQUARIUM', { h: 0.035, x: -0.58, y: ly - 0.1, z: zb + 0.023, c: K.cream, flat: true, mat: 'paint', wt: 0.2 });
        letters(B, 'INKOPOLIS', { h: 0.035, x: 0.58, y: ly - 0.1, z: zb + 0.023, c: K.cream, flat: true, mat: 'paint', wt: 0.2 });
        // the ferry on the line (a hull and its funnel)
        pbox(B, NS('paint'), K.coralLt, 0.16, 0.035, 0.006, 0.05, ly + 0.035, zb + 0.026);
        pbox(B, NS('paint'), K.cream, 0.08, 0.035, 0.006, 0.03, ly + 0.07, zb + 0.026);
        pbox(B, NS('paint'), K.red, 0.025, 0.04, 0.006, 0.08, ly + 0.09, zb + 0.026);
      });
      // the free side (local −x; the timetable pillar stands against the front half of the other): a porthole service door
      face(3, () => {
        const dw = 0.78, y = y0 + 0.01, dh = top - 0.215 - y - 0.06, zb = 0.03;
        B.box('paint', K.render, dw + 0.12, dh + 0.06, 0.02, 0, y + (dh + 0.06) / 2, zb + 0.01, { r: 0.006 });
        B.box('paint', K.navy, dw, dh, 0.03, 0, y + dh / 2, zb + 0.015, { r: 0.01 });
        // (its porthole: a brass ring 2.5 cm proud of the door, the glass just in front of it)
        B.add('metal', torG(0.15, 0.015, 6, 20), K.brass, 0, y + dh * 0.7, zb + 0.04, {});
        B.add('gloss', tpl('kdoorG', () => new THREE.CircleGeometry(0.14, 18)), '#3e5560', 0, y + dh * 0.7, zb + 0.032, {});
        pbox(B, NS('metal'), K.brass, dw - 0.06, 0.16, 0.006, 0, y + 0.1, zb + 0.033);
        rod(B, 'metal', K.brassLt, [dw / 2 - 0.1, y + dh * 0.45, zb + 0.032], [dw / 2 - 0.1, y + dh * 0.45 + 0.2, zb + 0.032], 0.014);
        for (const yy of [y + 0.25, y + dh - 0.25]) pbox(B, NS('metal'), K.brassDk, 0.03, 0.12, 0.01, -dw / 2 + 0.02, yy, zb + 0.034);
        letters(B, 'STAFF ONLY', { h: 0.045, y: y + dh * 0.7 - 0.27, z: zb + 0.031, c: K.cream, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
      });
    }
  }
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
      // (fix round 5: its other three sides were blank — a four-pane window with sea-green shutters folded back on each side,
      // and on its back the keepers' feeding board and a hose reel; all within 6 cm of the walls)
      for (const sx of [-1, 1]) {
        B.push(sx * 1.03, 0, 0, sx * HP);
        pbox(B, 'gloss', '#2c3f48', 0.62, 0.52, 0.012, 0, 1.36, 0.006);
        for (const yy of [1.1, 1.36, 1.62]) pbox(B, NS('paint'), K.navy, 0.68, 0.04, 0.03, 0, yy, 0.015);
        for (const xx of [-0.32, 0, 0.32]) pbox(B, NS('paint'), K.navy, 0.04, 0.56, 0.03, xx, 1.36, 0.015);
        pbox(B, 'metal', K.brass, 0.8, 0.035, 0.06, 0, 1.065, 0.03);
        for (const xs of [-1, 1]) {
          pbox(B, 'paint', K.seagreenDk, 0.3, 0.58, 0.022, xs * 0.53, 1.36, 0.012);
          for (let k = 0; k < 6; k++) pbox(B, NS('paint'), K.seagreen, 0.26, 0.02, 0.03, xs * 0.53, 1.13 + k * 0.09, 0.016);
        }
        B.pop();
      }
      B.push(0, 0, -1.03, PI);
      sign(B, 'PENGUIN FEEDS', -0.35, 1.25, { h: 0.075, board: K.cream, c: K.navy, border: K.brass, w: 0.72, hh: 0.42, sub: '11:00 · 15:00', subH: 0.06, subC: K.ink, pad: 0.05 });
      cyl(B, 'paint', K.red, 0.18, 0.05, 0.5, 0.62, 0.03, { rx: HP, seg: 18 });
      B.add('paint', torG(0.15, 0.022, 6, 20), '#2f6b4f', 0.5, 0.62, 0.05, {});
      B.add('paint', torG(0.11, 0.02, 6, 18), '#2f6b4f', 0.5, 0.62, 0.05, {});
      B.add('metal', sphG(0.025, 8, 6), K.brass, 0.5, 0.62, 0.065, {});
      B.pop();
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
      // (fix round 6, LEAD-REVIEW 6: its speed lines sat inside the body and its court face and ends were plain render) a
      // black-granite skirting with a brass line, three faience speed lines round all four faces, 1 cm proud
      pbox(B, 'paint', K.granite, 2.06, 0.13, 0.52, 0, 0.065, 0);
      pbox(B, NS('metal'), K.brass, 2.07, 0.016, 0.53, 0, 0.138, 0);
      for (const y of [0.62, 0.7, 0.78]) pbox(B, NS('gloss'), K.faience, 2.06, 0.035, 0.52, 0, y, 0);
      // THE TUBEWAY route map on its court face (+z): a navy enamel plate in a brass frame — the network (the Great Tank's
      // ring, the Gulper Run across it, the Arch Lines, the Kelp Lines up the drums, the Express) and the name
      B.push(0, 0, 0.26, 0);
      B.box('paint', K.navy, 1.36, 0.36, 0.02, 0, 0.385, 0.01, { r: 0.01 });
      for (const yy of [0.205, 0.565]) pbox(B, NS('metal'), K.brass, 1.39, 0.018, 0.03, 0, yy, 0.012);
      for (const xx of [-0.685, 0.685]) pbox(B, NS('metal'), K.brass, 0.018, 0.378, 0.03, xx, 0.385, 0.012);
      letters(B, 'THE TUBEWAY', { h: 0.065, x: -0.33, y: 0.47, z: 0.021, c: K.brassLt, flat: true, mat: 'paint', wt: 0.18, track: 0.12 });
      letters(B, 'ALL LINES', { h: 0.038, x: -0.33, y: 0.27, z: 0.021, c: K.cream, flat: true, mat: 'paint', wt: 0.18, track: 0.12 });
      B.add(NS('paint'), torG(0.1, 0.009, 4, 22), K.cream, 0.36, 0.385, 0.022, {});
      for (const [x0, y0, x1, y1, c] of [[0.14, 0.385, 0.58, 0.385, K.brassLt], [0.36, 0.25, 0.36, 0.52, '#9bd0c0'], [0.07, 0.31, 0.2, 0.42, K.cream], [0.52, 0.35, 0.65, 0.46, K.cream], [0.2, 0.5, 0.6, 0.27, '#e8c56b']])
        strut(B, NS('paint'), c, [x0, y0, 0.022], [x1, y1, 0.022], 0.012, { h: 0.012 });
      for (const [x, y] of [[0.14, 0.385], [0.58, 0.385], [0.36, 0.25], [0.36, 0.52], [0.07, 0.31], [0.65, 0.46], [0.2, 0.5], [0.6, 0.27]]) B.add(NS('paint'), sphG(0.016, 8, 4, HP), K.cream, x, y, 0.022, { rx: HP });
      B.pop();
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
  // (fix round 7, LEAD-REVIEW 7: three of the scale's faces were plain olive brass; floorart.js draws their riveted panels
  // and the LUGGAGE · WEIGH HERE · MAX 25 KG stencil under the ink.) A brass kick plate along every face's foot, and the
  // maker's plate on the back (local −x) — 1.4 cm proud at most, well under the top
  D.aquarium_scaletrim = {
    desc: "the luggage scale's kick plates and maker's plate (fix round 7)",
    build(B, o) {
      const w = o.w ?? 1.2, d = o.d ?? 1.0, h = o.h ?? 1.2;
      for (const s of [0, 1, 2, 3]) {
        B.push(0, 0, 0, (s * PI) / 2); const L = s % 2 ? d : w; B.push(0, 0, (s % 2 ? w : d) / 2, 0);
        pbox(B, NS('metal'), K.brassLt, L - 0.04, 0.09, 0.008, 0, 0.055, 0.004);
        for (let i = 0; i < 5; i++) B.add(NS('metal'), sphG(0.008, 6, 4, HP), K.brassDk, -L / 2 + 0.08 + (i * (L - 0.16)) / 4, 0.055, 0.008, { rx: HP });
        B.pop(); B.pop();
      }
      B.push(-w / 2, 0, 0, -HP);
      B.box('metal', K.brassLt, 0.46, 0.13, 0.008, 0, h * 0.34, 0.004, { r: 0.004 });
      letters(B, 'INKOPOLIS SCALE CO.', { h: 0.028, y: h * 0.34 + 0.015, z: 0.0085, c: K.ink, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
      letters(B, 'EST. 1936 · NO. 47', { h: 0.022, y: h * 0.34 - 0.045, z: 0.0085, c: K.ink, flat: true, mat: 'paint', wt: 0.2, track: 0.1 });
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

  // ---------------------------------------------------------------------------------------------------- fix round 5
  // (the complete eye-level sweep.) The faces and tops are drawn under the ink (floorart.js); here only what must stand off
  // them, within 8.5 cm of a face and below its walkable top: plates, the PENGUIN POINT plaque, the basking rock's lumps,
  // the pump sets' pipe stubs and handwheels, the stairs' brass string-courses, the keeper's hut's windows (its block is
  // off-limits: wrapped like round 1's hut).
  // an enamel plate on a face (local +z out of it; pos its foot centre): a navy board in a brass frame and one to three
  // lines of letters [text, height, colour] (4.5 cm proud at most)
  D.aquarium_plate = {
    desc: 'an enamel plate on a face (local +z out of it): navy board, brass frame, lines of letters',
    build(B, o) {
      const w = o.w ?? 1.2, h = o.h ?? 0.3, y = o.y ?? 0;
      B.box('paint', o.board ?? K.navy, w, h, 0.022, 0, y + h / 2, 0.011, { r: 0.008 });
      for (const yy of [y, y + h]) pbox(B, NS('metal'), K.brass, w + 0.03, 0.022, 0.032, 0, yy, 0.016);
      for (const xx of [-w / 2, w / 2]) pbox(B, NS('metal'), K.brass, 0.022, h + 0.02, 0.032, xx, y + h / 2, 0.016);
      const L = o.lines || [], tot = L.reduce((a, l, i) => a + l[1] + (i ? l[1] * 0.45 : 0), 0);
      let cur = y + h / 2 + tot / 2;
      L.forEach(([t, lh, c], i) => { if (i) cur -= L[i - 1][1] * 0.45; cur -= lh; letters(B, t, { h: lh, y: cur, z: 0.023, c: c ?? K.cream, flat: true, mat: 'paint', wt: 0.18, track: 0.1 }); });
    },
  };
  // the PENGUIN POINT plaque on the upper rock's plaza face (local +z out of it; pos its foot centre): a Deco plaque — a navy
  // board with a stepped brass frame, the name in brass, a line under it, an emperor penguin in enamel at its left
  D.aquarium_penguinplaque = {
    desc: 'the PENGUIN POINT plaque (local +z out of the face): navy board, stepped brass frame, the name, a penguin',
    build(B, o) {
      const w = 1.9, h = 0.62, y = o.y ?? 1.2;
      B.box('paint', K.navy, w, h, 0.024, 0, y + h / 2, 0.012, { r: 0.02 });
      for (const [d, t] of [[0.0, 0.03], [0.045, 0.012]]) {
        for (const yy of [y - d, y + h + d]) pbox(B, NS('metal'), d ? K.brassDk : K.brass, w + 0.04 + 2 * d, t, 0.034 - d * 0.3, 0, yy, 0.017);
        for (const xx of [-w / 2 - d, w / 2 + d]) pbox(B, NS('metal'), d ? K.brassDk : K.brass, t, h + 0.04 + 2 * d, 0.034 - d * 0.3, xx, y + h / 2, 0.017);
      }
      letters(B, 'PENGUIN POINT', { h: 0.13, x: 0.2, y: y + 0.34, z: 0.025, c: K.brassLt, flat: true, mat: 'paint', wt: 0.2, track: 0.12 });
      pbox(B, NS('metal'), K.brass, 1.2, 0.012, 0.01, 0.2, y + 0.28, 0.026);
      letters(B, 'FEEDS 11:00 · 15:00', { h: 0.075, x: 0.2, y: y + 0.13, z: 0.025, c: K.cream, flat: true, mat: 'paint', wt: 0.18, track: 0.1 });
      // the penguin (enamel, 3 cm proud): black back and head, white front, a yellow-orange ear patch and beak, feet
      const px = -0.7, py = y + 0.08;
      B.add('paint', sphG(0.1, 14, 10), K.ink, px, py + 0.2, 0.02, { sx: 1.05, sy: 1.95, sz: 0.12 });
      B.add('paint', sphG(0.075, 14, 10), K.white, px + 0.012, py + 0.18, 0.026, { sx: 0.95, sy: 2.0, sz: 0.1 });
      B.add('paint', sphG(0.062, 12, 8), K.ink, px - 0.004, py + 0.43, 0.022, { sx: 1, sy: 1.05, sz: 0.13 });
      B.add('paint', sphG(0.022, 8, 6), K.mustard, px + 0.03, py + 0.39, 0.03, { sx: 1.2, sy: 0.8, sz: 0.25 });
      B.add('paint', cylGeo(0.0, 0.016, 0.07, 6), K.mustard, px + 0.085, py + 0.43, 0.026, { rz: -HP * 1.1 });
      for (const fx of [-0.03, 0.03]) pbox(B, NS('paint'), K.ink, 0.05, 0.016, 0.01, px + fx, py + 0.01, 0.026);
    },
  };
  // the basking rock's lumps (fix round 5; pos its foot centre, the world box w × d): a rounded boulder pair wrapping each
  // vertical corner (the touch pools' corner rock, smaller: 7.8 cm out of either face, its dome below the walkable top)
  // and a few low lumps along its foot, so it reads round, not as a square pillar
  D.aquarium_baskinglumps = {
    desc: "the basking rock's corner lumps and foot lumps (world box w × d, top h)",
    build(B, o) {
      const w = o.w ?? 1.2, d = o.d ?? 1.2, h = o.h ?? 2.2, OUT = 0.078, C = ['#b8b3aa', '#a7a29a', '#c3c0b8', '#9c978f'];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], k) => {
        const ry = sx > 0 ? (sz > 0 ? 0 : HP) : (sz > 0 ? -HP : PI);
        B.add('paint', cornerRockG(0.17, h - 0.32, 0.18 + 0.03 * (k % 2), OUT, 21 + k), C[k], (sx * w) / 2, 0, (sz * d) / 2, { ry });
      });
      // low lumps along the foot (on the floor side and on the terrace side), each placed by its own reach
      for (const [seed, f, t, len, ht, y] of o.foot || []) {
        const r = reachOf(seed), dep = 0.2;
        if (Math.abs(f) === 1) B.add('paint', blobG(seed), C[seed % 4], t, y, f * (d / 2 + OUT - dep * (f > 0 ? r.z : r.nz)), { sx: len, sy: ht, sz: dep });
        else B.add('paint', blobG(seed), C[seed % 4], (Math.sign(f) * w) / 2 + Math.sign(f) * (OUT - dep * (f > 0 ? r.x : r.nx)), y, t, { sx: dep, sy: ht, sz: len });
      }
    },
  };
  // a pump set's pipework (fix round 5; pos the casing's foot centre, local x along its drum (len), z across it (wid)): a
  // flanged pipe stub on each end at the drum's axis, a red handwheel and a pressure gauge on its aisle side (o.aisle ±1)
  D.aquarium_pumpdress = {
    desc: "a pump set's pipe stubs, handwheel and gauge (local x along its drum)",
    build(B, o) {
      const L = o.len ?? 2.0, Wd = o.wid ?? 1.5, ay = 0.63, s = o.aisle ?? 1;
      for (const e of o.ends || [-1, 1]) {
        B.push(e * L / 2, 0, 0, e * HP);   // (local +z out of the end face)
        cyl(B, 'metal', K.steelDk, 0.2, 0.024, 0, ay, 0.012, { rx: HP, seg: 18 });
        cyl(B, 'metal', '#5f7f75', 0.12, 0.05, 0, ay, 0.045, { rx: HP, seg: 14 });
        cyl(B, 'metal', K.steelDk, 0.15, 0.016, 0, ay, 0.068, { rx: HP, seg: 16 });
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; B.add(NS('metal'), sphG(0.016, 6, 4, HP), K.rivet, Math.cos(a) * 0.17, ay + Math.sin(a) * 0.17, 0.024, { rx: HP }); }
        B.pop();
      }
      B.push(0, 0, s * Wd / 2, s > 0 ? 0 : PI);
      { const x = -L / 2 + 0.36, yy = 0.52;
        cyl(B, 'metal', K.steelDk, 0.025, 0.04, x, yy, 0.02, { rx: HP, seg: 8 });
        B.add('metal', torG(0.11, 0.014, 6, 18), K.red, x, yy, 0.05, {});
        for (let k = 0; k < 3; k++) pbox(B, NS('metal'), K.red, 0.016, 0.21, 0.012, x, yy, 0.05, { rz: (k * PI) / 3 });
        B.add('metal', torG(0.065, 0.012, 6, 16), K.brass, L / 2 - 0.3, 0.82, 0.025, {});
        B.add(NS('glow'), cylGeo(0.058, 0.058, 0.01, 14), K.cream, L / 2 - 0.3, 0.82, 0.02, { rx: HP, glow: 0.6 });
        pbox(B, NS('paint'), K.red, 0.008, 0.05, 0.004, L / 2 - 0.3 + 0.012, 0.832, 0.027, { rz: -0.6 }); }
      B.pop();
    },
  };
  // a stair's brass string-courses (fix round 5: the grand stair, the Penguin Steps, the Ticket Hall's stair, the deck ramp),
  // as round 2's on the deck stair: a brass bar 3.4 cm proud along each flank's raked edge (world frame; o.low / o.high the
  // ramp's ends [x, y, z], o.w its width, o.t0 / o.t1 how much of the run from the low end it covers)
  D.aquarium_raketrim = {
    desc: "a stair's brass string-courses along its flanks' raked edges (world frame)",
    build(B, o) {
      const [lx, ly, lz] = o.low, [hx, hy, hz] = o.high, run = Math.hypot(hx - lx, hz - lz), u = [(hx - lx) / run, (hz - lz) / run], p = [-u[1], u[0]];
      const rake = Math.atan2(hy - ly, run), t0 = o.t0 ?? 0.05, t1 = o.t1 ?? run - 0.05, tm = (t0 + t1) / 2, L = (t1 - t0) / Math.cos(rake);
      const ys = (t) => ly + ((hy - ly) * t) / run;
      for (const sg of o.sides || [1, -1]) {
        const n = [sg * p[0], sg * p[1]], hw = o.w / 2 + 0.017, x = lx + u[0] * tm + n[0] * hw, z = lz + u[1] * tm + n[1] * hw;
        const lxDir = [n[1], -n[0]], rz = (u[0] * lxDir[0] + u[1] * lxDir[1]) > 0 ? rake : -rake;
        B.push(x, 0, z, Math.atan2(n[0], n[1]));
        pbox(B, 'metal', K.brass, L, 0.065, 0.034, 0, ys(tm) - 0.0535, 0, { rz });
        pbox(B, NS('metal'), K.brassDk, L, 0.012, 0.04, 0, ys(tm) - 0.0535 - 0.034 / Math.cos(rake), 0.002, { rz });
        B.pop();
      }
    },
  };

  // ---------------------------------------------------------------------------------------------------- fix round 6
  // (LEAD-REVIEW 6's list.) The faces and tops are drawn under the ink (floorart.js); here only what stands off them, within
  // 8.5 cm of a face and below its walkable top: the Feeding Step's brass corner guards, the whale-tail benches' bronze
  // flukes, the Kelp Ramp parapet's render pilasters over its joints and ends, the trolley stack's casters and push bars.
  // a brass corner guard round a block's rounded vertical edge (pos = the edge's bevel axis at its foot; a quarter round of
  // radius r from bearing t0 (three's theta: 0 = +z, π/2 = +x), y0 → y1), its two edges a little heavier
  D.aquarium_cornerguard = {
    desc: "a brass corner guard hugging a block's rounded vertical edge (quarter round, r, t0, y0 → y1)",
    build(B, o) {
      const r = o.r ?? 0.14, y0 = o.y0 ?? 0.1, y1 = o.y1 ?? 1.05, t0 = o.t0 ?? 0, h = y1 - y0;
      B.add('metal', cylGeo(r, r, h, 10, true, t0, HP), K.brass, 0, (y0 + y1) / 2, 0, {});
      for (const a of [t0 + 0.06, t0 + HP - 0.06]) cyl(B, 'metal', K.brassDk, 0.012, h, Math.sin(a) * (r + 0.004), (y0 + y1) / 2, Math.cos(a) * (r + 0.004), { seg: 6 });
      for (const y of [y0 + 0.06, (y0 + y1) / 2, y1 - 0.06]) for (const a of [t0 + 0.35, t0 + HP - 0.35]) B.add(NS('metal'), sphG(0.011, 6, 4), K.brassLt, Math.sin(a) * (r + 0.003), y, Math.cos(a) * (r + 0.003), {});
    },
  };
  // a whale's tail in bronze relief on a bench's end face (local +z out of it; pos its foot centre): the stalk rising from
  // the floor, the two flukes spread under the bench's cap, its trailing edge notched — the bench's armrest (4.6 cm proud
  // at most, its top 9 cm under the bench's top)
  const flukeG = () => tpl('fluke6', () => {
    const S = new THREE.Shape();
    S.moveTo(-0.13, 0.04); S.lineTo(0.13, 0.04);
    S.quadraticCurveTo(0.095, 0.35, 0.09, 0.6);
    S.quadraticCurveTo(0.24, 0.66, 0.42, 0.82); S.quadraticCurveTo(0.53, 0.94, 0.565, 1.1);
    S.quadraticCurveTo(0.42, 1.03, 0.25, 1.04); S.quadraticCurveTo(0.08, 1.05, 0.0, 0.965);
    S.quadraticCurveTo(-0.08, 1.05, -0.25, 1.04); S.quadraticCurveTo(-0.42, 1.03, -0.565, 1.1);
    S.quadraticCurveTo(-0.53, 0.94, -0.42, 0.82); S.quadraticCurveTo(-0.24, 0.66, -0.09, 0.6);
    S.quadraticCurveTo(-0.095, 0.35, -0.13, 0.04);
    const g = new THREE.ExtrudeGeometry(S, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.009, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, 0.016);
    return g;
  });
  D.aquarium_fluke = {
    desc: "a whale-tail fluke in bronze relief on a bench end (local +z out of the face)",
    build(B) {
      B.add('metal', flukeG(), K.bronzeLt, 0, 0, 0, {});
      // the fluke's ridge and a darker patina line along its trailing edge
      pbox(B, NS('metal'), K.bronze, 0.03, 0.52, 0.012, 0, 0.32, 0.051);
      for (const s of [-1, 1]) strut(B, NS('metal'), K.bronze, [s * 0.05, 0.98, 0.05], [s * 0.42, 1.03, 0.05], 0.014, { h: 0.01 });
    },
  };
  // a render pilaster over a joint (or an end) of the Kelp Ramp's parapet (local +z out of the face, pos its foot centre):
  // the parapet's granite skirting and brass line round its foot, a moulded cap under the parapet's top
  D.aquarium_pilaster = {
    desc: "a render pilaster with a granite foot and a moulded cap (w wide, d deep, back buried b; foot y0, top y1)",
    build(B, o) {
      const w = o.w ?? 0.5, d = o.d ?? 0.07, b = o.b ?? 0.05, y0 = o.y0 ?? 0, y1 = o.y1 ?? 1.0, zc = (d - b) / 2, dd = d + b;
      pbox(B, 'paint', K.render, w, y1 - y0 - 0.05, dd, 0, (y0 + y1 - 0.05) / 2, zc);
      pbox(B, 'paint', K.render, w + 0.03, 0.05, dd + 0.015, 0, y1 - 0.025, zc + 0.0075);
      pbox(B, 'paint', K.renderSh, w + 0.01, 0.012, dd + 0.008, 0, y1 - 0.058, zc + 0.004);
      pbox(B, 'paint', K.granite, w + 0.01, 0.15, dd + 0.01, 0, y0 + 0.075, zc + 0.005);
      pbox(B, NS('metal'), K.brass, w + 0.012, 0.016, dd + 0.012, 0, y0 + 0.157, zc + 0.006);
      for (const y of o.lines || []) pbox(B, NS('gloss'), K.faience, w + 0.006, 0.04, dd + 0.006, 0, y, zc + 0.003);
    },
  };
  // the trolley stack's running gear (pos its foot centre, local x along it, L × S, top H): a caster pair under each of the
  // nested trolleys on both long faces (its fork on a steel plate), and at the −x end the nested trolleys' brass push bars
  // laid flat against the end, one over the next (all within 6.5 cm of a face, under the top)
  D.aquarium_trolleystack = {
    desc: "the nested luggage trolleys' casters and push bars (local x along the stack, L × S, top H)",
    build(B, o) {
      const L = o.L ?? 2.0, S = o.S ?? 1.2, H = o.H ?? 1.4;
      for (let i = 0; i < 5; i++) {
        const x = -L / 2 + 0.05 + 0.38 * i + 0.17;
        for (const sz of [-1, 1]) {
          cyl(B, 'rubber', K.rubber, 0.085, 0.035, x, 0.09, sz * (S / 2 + 0.03), { rx: HP, seg: 12 });
          cyl(B, 'metal', K.steel, 0.035, 0.04, x, 0.09, sz * (S / 2 + 0.03), { rx: HP, seg: 8 });
          pbox(B, 'metal', K.steelDk, 0.05, 0.1, 0.012, x, 0.17, sz * (S / 2 + 0.054));
          pbox(B, NS('metal'), K.steelDk, 0.14, 0.03, 0.02, x, 0.23, sz * (S / 2 + 0.01));
        }
      }
      for (let i = 0; i < 3; i++) {
        const xo = -L / 2 - 0.018 - 0.016 * i, y = H - 0.22 - 0.07 * i, hw = S / 2 - 0.1 - 0.035 * i;
        rod(B, 'metal', K.brassLt, [xo, y, -hw], [xo, y, hw], 0.016);
        for (const sz of [-1, 1]) rod(B, 'metal', K.brass, [xo, y - 0.3, sz * hw], [xo, y, sz * hw], 0.014);
      }
      pbox(B, 'paint', K.cream, 0.006, 0.08, 0.12, -L / 2 - 0.012, 0.5, 0.25, { rz: 0.1 });
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
