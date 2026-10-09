// Highmark Foundry — stage props (prop types prefixed 'caldera_') and set dressing (PLACEMENTS: the half list, mirrored
// unless `mirror: false`).
//
// BLOCKOUT: only what the blockout needs to read as this place before the art pass —
//   caldera_lava         the placeholder lava surface over the whole region at this build's level (lava.js LAVA_Y);
//                        the lava engine's LavaLook replaces it (delete with BLOCKOUT_LAVA)
//   caldera_rails        every railing's look (the layout's rail colliders are invisible by design)
//   caldera_surge_gauge  the landmark's silhouette: lattice, gauge boards and needle, clock house, bell cage, pyramid
//   caldera_hall_roof    the Casting Hall's north-light sawtooth roof, chimneys and round furnace window
//   caldera_cupola_hood, caldera_jib, caldera_office_roof   the yard's skyline
// No colliders here: every collider is a layout piece (layout.js).
import { RAILS, GANTRY_RAILS } from './layout.js';
import { REGION_ALL, inPoly, ch, S_LIP } from './geo.js';
import { LAVA_Y, BLOCKOUT_LAVA } from './lava.js';

export function register(D, H) {
  const { THREE, PI, HP } = H;
  const NS = (m) => (H.noShadow ? H.noShadow(m) : m);
  const K = { green: '#2f5a48', greenDk: '#24473a', white: '#eee9de', cream: '#efe8d4', verd: '#7fb5a3', iron: '#3d4146', brick: '#b98f6a',
    ash: '#f4f1ea', crust: '#6e2a1c', seam: '#ff5a24', basalt: '#55595f', red: '#c8202a', glass: '#ffb469' };

  // ------------------------------------------------------------------------------------------ the placeholder lava
  // a 0.5 m grid over every region polygon (cells whose centre is inside; the region lies 0.5 m inside every bank, so
  // the cells' outer halves hide in the bank faces), unlit, crust and lit seams from a cheap value noise
  D.caldera_lava = {
    build(B) {
      const S = 0.5, cells = new Set();
      for (const poly of REGION_ALL) {
        let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
        for (let i = Math.floor(x0 / S); i <= Math.ceil(x1 / S); i++) for (let j = Math.floor(z0 / S); j <= Math.ceil(z1 / S); j++) {
          if (inPoly(poly, (i + 0.5) * S, (j + 0.5) * S)) cells.add(i + ',' + j);
        }
      }
      const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
      const vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
        return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v; };
      const cA = new THREE.Color(K.crust), cB = new THREE.Color(K.seam), tmp = new THREE.Color();
      const pos = [], nor = [], colr = [], uv = [], idx = [], vid = new Map();
      const vert = (i, j) => {
        const key = i + ',' + j; let k = vid.get(key);
        if (k !== undefined) return k;
        const x = i * S, z = j * S, n = vn(x * 0.35, z * 0.35) * 0.65 + vn(x * 1.1 + 7, z * 1.1 - 3) * 0.35;
        const seam = Math.max(0, 1 - Math.abs(n - 0.5) * 7);           // thin bright bands where the noise crosses 0.5
        tmp.copy(cA).lerp(cB, Math.min(1, seam * 1.1));
        k = pos.length / 3; vid.set(key, k);
        pos.push(x, 0, z); nor.push(0, 1, 0); colr.push(tmp.r, tmp.g, tmp.b); uv.push(0, 0);
        return k;
      };
      for (const key of cells) {
        const [i, j] = key.split(',').map(Number);
        const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
        idx.push(a, c, b, a, d, c);
      }
      // the lavafalls: past each Spillway's lip the lava pours down the outer flank in a chute (out of play), at both
      // levels: each breach reads from outside as a river of lava leaving the caldera, fanning out as it runs (the
      // backdrop's real lavafall and its glow replace this; until ENGINE H22 removes the sea it stays above y −1.5)
      for (const sg of [1, -1]) {
        const N = 28, M = 12, base = pos.length / 3, drop = LAVA_Y + 1.45;
        for (let a = 0; a <= N; a++) for (let b = 0; b <= M; b++) {
          const u = a / N, s = S_LIP - 0.3 + a * 0.6, t = (-6.3 + (12.6 * b) / M) * (1 + u * 0.9), [x, z] = ch(s, t);
          const n = vn(x * 0.35 + 3, z * 0.35) * 0.65 + vn(x * 1.1 + 7, z * 1.1 - 3) * 0.35, seam = Math.max(0, 1 - Math.abs(n - 0.5) * 5);
          tmp.copy(cA).lerp(cB, Math.min(1, 0.25 + seam + u * 0.6));
          pos.push(sg * x, -Math.sqrt(u) * drop, sg * z); nor.push(0, 1, 0); colr.push(tmp.r, tmp.g, tmp.b); uv.push(0, 0);
        }
        for (let a = 0; a < N; a++) for (let b = 0; b < M; b++) {
          const k = base + a * (M + 1) + b, k2 = k + M + 1;
          idx.push(k, k + 1, k2, k + 1, k2 + 1, k2);   // (the turn about y keeps the winding)
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      B.add('glow', g, '#ffffff', 0, LAVA_Y, 0, { glow: 1.9 });
    },
  };

  // ------------------------------------------------------------------------------------------ railings
  // works-green iron: a top rail and posts every ~1.6 m along each rail line (both halves: the list is Alpha's)
  const railLine = (B, x0, z0, x1, z1, y0, h, y1 = y0) => {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz), dy = y1 - y0;
    const n = Math.max(1, Math.round(L / 1.6));
    B.push((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, ry, -Math.atan2(dy, L));
    const Ls = Math.hypot(L, dy);
    B.box('metal', K.green, 0.07, 0.07, Ls, 0, h - 0.04, 0, { r: 0.015 });
    B.box(NS('metal'), K.green, 0.04, 0.04, Ls, 0, h * 0.5, 0, { r: 0.01 });
    B.pop();
    for (let i = 0; i <= n; i++) { const t = i / n; B.box(NS('metal'), K.greenDk, 0.07, h, 0.07, x0 + dx * t, y0 + dy * t + h / 2, z0 + dz * t, { r: 0.015 }); }
  };
  D.caldera_rails = {
    build(B, o) {
      for (const r of o.list || RAILS) {
        const [x0, z0, x1, z1, y, h, y1] = r;
        railLine(B, x0, z0, x1, z1, y, h, y1 ?? y);
        railLine(B, -x0, -z0, -x1, -z1, y, h, y1 ?? y);
      }
    },
  };

  // ------------------------------------------------------------------------------------------ the Surge Gauge
  // a 22 m iron tower on four basalt piers (the piers and girders are layout pieces): an A-frame lattice across the piers
  // to 12 m, a square shaft to 17 m, the clock house, the bell cage with the Surge Bell, a verdigris pyramid and the
  // ladle weathervane. A 7 m gauge board on the south and north faces with its float needle.
  const strut = (B, a, b, t = 0.22, c = K.green, mat = 'metal') => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    B.push((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)));
    B.box(mat, c, t, t, L, 0, 0, 0, { r: 0.03 });
    B.pop();
  };
  D.caldera_surge_gauge = {
    build(B) {
      const legs = [[4.2, 1.75], [4.2, -1.75], [-4.2, 1.75], [-4.2, -1.75]];
      // the A-frame: from each pier top (7.0) up and in to the shaft's corners (12.0), with braces and a ring girder
      for (const [x, z] of legs) strut(B, [x, 7.0, z], [Math.sign(x) * 1.8, 12.0, Math.sign(z) * 1.8], 0.42);
      for (const sz of [-1, 1]) { strut(B, [-4.2, 7.0, sz * 1.75], [4.2, 7.0, sz * 1.75], 0.36); strut(B, [-4.2, 7.0, sz * 1.75], [0, 12, sz * 1.8], 0.22); strut(B, [4.2, 7.0, sz * 1.75], [0, 12, sz * 1.8], 0.22); }
      for (const sx of [-1, 1]) { strut(B, [sx * 4.2, 7.0, -1.75], [sx * 1.8, 12, 1.8], 0.18); strut(B, [sx * 4.2, 7.0, 1.75], [sx * 1.8, 12, -1.8], 0.18); }
      for (const y of [9.5]) for (const sz of [-1, 1]) strut(B, [-3.0, y, sz * 1.78], [3.0, y, sz * 1.78], 0.2);
      // the shaft (12 → 17): corner posts, rings, X braces
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(B, [sx * 1.8, 12, sz * 1.8], [sx * 1.8, 17, sz * 1.8], 0.32);
      for (const y of [12, 14.5, 17]) { for (const s of [-1, 1]) { strut(B, [-1.8, y, s * 1.8], [1.8, y, s * 1.8], 0.22); strut(B, [s * 1.8, y, -1.8], [s * 1.8, y, 1.8], 0.22); } }
      for (const s of [-1, 1]) { strut(B, [-1.8, 12, s * 1.8], [1.8, 14.5, s * 1.8], 0.14); strut(B, [1.8, 14.5, s * 1.8], [-1.8, 17, s * 1.8], 0.14); strut(B, [s * 1.8, 12, -1.8], [s * 1.8, 14.5, 1.8], 0.14); strut(B, [s * 1.8, 14.5, 1.8], [s * 1.8, 17, -1.8], 0.14); }
      // the clock house (17 → 18.5), whitewashed, a dial on each side
      B.box('paint', K.white, 3.0, 1.5, 3.0, 0, 17.75, 0, { r: 0.05 });
      for (const [x, z, ry] of [[0, 1.52, 0], [0, -1.52, PI], [1.52, 0, HP], [-1.52, 0, -HP]]) {
        B.push(x, 17.75, z, ry); B.cyl('paint', K.cream, 0.6, 0.06, 0, 0, 0, { rx: HP, seg: 20 }); B.box(NS('metal'), K.iron, 0.06, 0.5, 0.04, 0, 0.12, 0.05); B.pop();
      }
      // the bell cage (18.5 → 20.5): four posts, the 1.6 m Surge Bell, two siren trumpets, beacons
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(B, [sx * 1.4, 18.5, sz * 1.4], [sx * 1.4, 20.5, sz * 1.4], 0.2);
      B.lathe('metal', '#8a6a3a', [[0, 0.95], [0.18, 0.95], [0.35, 0.8], [0.45, 0.3], [0.62, 0.0], [0.8, -0.12], [0, -0.12]], 0, 19.0, 0, { seg: 18 });
      for (const sx of [-1, 1]) { B.push(sx * 1.0, 20.2, 0, sx > 0 ? HP : -HP); B.cyl('metal', K.iron, 0.28, 0.9, 0, 0, 0.4, { r2: 0.08, rx: HP, seg: 12 }); B.pop(); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.sph(NS('glow'), K.red, 0.16, sx * 1.4, 20.65, sz * 1.4, { ws: 8, hs: 6, glow: 1.6 });
      // the cap (20.5 → 22): verdigris pyramid, the weathervane (a ladle pouring a flame)
      B.box('paint', K.green, 3.0, 0.2, 3.0, 0, 20.6, 0, { r: 0.04 });
      B.lathe('paint', K.verd, [[0, 1.6], [0.02, 1.6], [1.75, 0.0], [0, 0.0]], 0, 20.7, 0, { seg: 4, ry: PI / 4 });
      B.box(NS('metal'), K.iron, 0.06, 1.0, 0.06, 0, 22.7, 0);
      B.box(NS('metal'), K.iron, 0.9, 0.12, 0.06, 0.2, 23.0, 0); B.sph(NS('metal'), K.iron, 0.16, 0.7, 23.0, 0, { ws: 8, hs: 5 });
      // the gauge boards (8 → 15 m) on the south and north faces: cream enamel, the HIGH MARK band at the top, the needle
      for (const sz of [-1, 1]) {
        B.push(0, 11.5, sz * 2.5, sz > 0 ? 0 : PI);
        B.box('paint', K.green, 2.6, 7.2, 0.25, 0, 0, -0.02, { r: 0.04 });
        B.box('paint', K.cream, 2.3, 6.9, 0.06, 0, 0, 0.12, { r: 0.02 });
        B.box(NS('paint'), K.ash, 2.3, 0.7, 0.07, 0, 3.0, 0.13, { r: 0.01 });
        for (let i = 0; i < 6; i++) B.box(NS('paint'), K.iron, 0.9, 0.06, 0.07, -0.55, -3.0 + i * 1.2, 0.14, { r: 0.01 });
        B.box(NS('metal'), K.iron, 0.12, 6.4, 0.08, 0.35, 0, 0.15);
        B.box('metal', K.red, 1.4, 0.3, 0.16, 0.35, -2.8, 0.22, { r: 0.05 });   // the float needle (at EBB)
        B.pop();
      }
    },
  };

  // ------------------------------------------------------------------------------------------ the yard's skyline
  D.caldera_hall_roof = {
    build(B) {
      // north-light sawtooth: five teeth from the gable (z −69) back out of play, glazed faces toward the lake
      for (let i = 0; i < 5; i++) {
        const z = -69.2 - i * 3.2;
        B.push(0, 12.0, z - 1.6, 0, -0.5);
        B.box('paint', K.verd, 32.6, 0.18, 3.6, 0, 0.95, 0, { r: 0.03 });
        B.pop();
        B.box(NS('paint'), '#3a5560', 32.0, 1.7, 0.12, 0, 12.85, z - 0.05, { r: 0.02 });
      }
      B.box('paint', K.white, 32.0, 12.0, 19.0, 0, 6.0, -78.5, { r: 0.05 });   // the hall (its collider is the layout's), running back out of play
      for (const sx of [-1, 1]) B.box('paint', K.white, 6.0, 8.0 + (sx > 0 ? 0.15 : 0), 3.0, sx * 13, 4.0 + (sx > 0 ? 0.075 : 0), -67.5, { r: 0.05 });   // the wings
      for (const x of [-11, 11]) { B.box('paint', K.brick, 1.4, 6.0, 1.4, x, 15.5, -74.5, { r: 0.04 }); B.box(NS('paint'), K.iron, 1.6, 0.3, 1.6, x, 18.6, -74.5); }
      // the gable over the gallery: the round furnace window and the works clock
      B.push(0, 9.2, -68.9, 0);
      B.cyl('paint', K.green, 2.3, 0.2, 0, 0, 0, { rx: HP, seg: 28 });
      B.cyl(NS('glow'), K.glass, 2.0, 0.22, 0, 0, 0.02, { rx: HP, seg: 28, glow: 1.4 });
      for (let k = 0; k < 4; k++) B.box(NS('paint'), K.green, 0.14, 4.0, 0.25, 0, 0, 0.05, { rz: (k * PI) / 4 });
      B.pop();
      B.box('paint', K.white, 33.0, 0.5, 0.6, 0, 12.25, -69.1, { r: 0.05 });
    },
  };
  D.caldera_cupola_hood = {
    build(B) {
      // (the furnace body and stack are layout octagons; this is the verdigris spark hood on the stack's top)
      B.lathe('paint', K.verd, [[0, 2.2], [0.3, 2.2], [1.6, 0.4], [1.8, 0.0], [0, 0.0]], 0, 15.05, 0, { seg: 16 });
      for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; B.box(NS('metal'), K.iron, 0.1, 0.9, 0.1, Math.cos(a) * 1.2, 15.4, Math.sin(a) * 1.2); }
    },
  };
  D.caldera_jib = {
    build(B) {
      // the jib parked pointing out over the east edge (ESE), its counter-jib back over the yard wall; floodlights
      B.push(0, 10.0, 0, Math.atan2(24 - 16, -60 + 56.5));
      B.box('metal', K.green, 0.7, 0.9, 9.0, 0, 0, 4.5, { r: 0.06 });
      B.box('metal', K.green, 0.6, 0.6, 3.0, 0, 0, -1.6, { r: 0.05 });
      B.box('paint', K.iron, 1.0, 1.2, 1.2, 0, -0.2, -3.0, { r: 0.05 });
      B.box(NS('metal'), K.iron, 0.06, 4.0, 0.06, 0, -2.4, 8.4);
      B.pop();
      B.box('paint', K.green, 1.6, 1.2, 1.6, 0, 12.6, 0, { r: 0.05 });
    },
  };
  D.caldera_office_roof = {
    build(B) {
      // two storeys: a verdigris hipped roof, works-green window bands, the Surge Board frame on its south face
      B.lathe('paint', K.verd, [[0, 1.8], [0.05, 1.8], [5.3, 0.0], [0, 0.0]], 0, 9.5, 0, { seg: 4, ry: PI / 4, sx: 0.95, sz: 0.85 });
      for (const y of [5.6, 8.0]) for (const sz of [-1, 1]) B.box(NS('paint'), K.green, 6.2, 0.9, 0.08, 0, y, sz * 3.02);
      B.box('paint', K.cream, 3.0, 1.8, 0.2, 3.5 - 3.0, 6.2, -3.1, { r: 0.03 });
    },
  };
}

// one placement each (the layout's own geometry is mirrored by the level; these draw both halves themselves, or are
// mirrored as usual)
export const PLACEMENTS = [
  ...(BLOCKOUT_LAVA ? [{ type: 'caldera_lava', pos: [0, 0, 0], mirror: false }] : []),
  { type: 'caldera_rails', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_rails', pos: [0, 0, 0], mirror: false, list: GANTRY_RAILS, onlyIn: 'bazookarp' },
  { type: 'caldera_surge_gauge', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_hall_roof', pos: [0, 0, 0] },
  { type: 'caldera_cupola_hood', pos: [13.5, 0, -46.5] },
  { type: 'caldera_jib', pos: [18.2, 0, -56.5] },
  { type: 'caldera_office_roof', pos: [-19.5, 0, -50.5] },
];
