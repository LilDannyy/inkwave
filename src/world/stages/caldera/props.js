// Highmark Foundry — stage props (prop types prefixed 'caldera_') and set dressing (PLACEMENTS: the half list, mirrored
// (x, z) → (−x, −z), rotY + π, unless an entry says `mirror: false`).
//
// DESIGN.md §5.2:
//   caldera_surge_gauge (piers, collars, girders, lattice, boards, clock, bell cage)
//   caldera_organ_stump, caldera_socket_collar
//   caldera_winch_house, caldera_chain_ring, caldera_chain_bollard, caldera_mooring_bollard, caldera_capstan
//   caldera_tide_board, caldera_ladle_car, caldera_lamp_post, caldera_lamp_plinth
//   caldera_hornito, caldera_spatter_cone, caldera_cairn, caldera_scree
//   caldera_pig_bed, caldera_floor_drain, caldera_mould_stack, caldera_ladle_stand
//   caldera_spillway_bridge, caldera_slag_pot, caldera_gauge_post
//   caldera_pattern_doors, caldera_pattern_crates, caldera_firebrick_store, caldera_casting_bed, caldera_flask_stack
//   caldera_surge_office, caldera_cupola, caldera_weigh_office, caldera_weigh_pit, caldera_jib_crane, caldera_casting_stack
//   caldera_charging_shed, caldera_casting_hall_gable, caldera_gallery_balustrade, caldera_planter_urn
//
// Rules: Visual only, no colliders (layout.js holds all collision). Props within 8.5 cm of a face.
// Nothing loose on ledges. Merged into kit materials: paint, metal, wood, rubber, gloss (noShadow for small details).
import { RAILS, GANTRY_RAILS, WALL_BOXES, OFFICE } from './layout.js';
import { REGION_ALL, inPoly, HALL_LINE, PAD, CW, CAUSE_Z, RSF, PIT, ST_CUPOLA, BR_S, AW, A } from './geo.js';
import { LAVA_Y, BLOCKOUT_LAVA, LAVA } from './lava.js';
import { registerArch } from './arch.js';

const HIGH_MARK = LAVA.high, D_ = Math.PI / 180;

export function register(D, H) {
  const { THREE, PI, HP } = H;
  const NS = (m) => (H.noShadow ? H.noShadow(m) : m);
  const K = {
    green: '#2f5a48', greenDk: '#24473a', greenLt: '#3d725c',
    white: '#f1ede4', cream: '#efe8d4', verd: '#7fb5a3',
    iron: '#34383e', ironDk: '#25282d', ironLt: '#525760',
    brick: '#8b4530', brickDk: '#683222', ash: '#f4f1ea', crust: '#6e2a1c', seam: '#ff5a24',
    basalt: '#55595f', basaltDk: '#3f4248', basaltLt: '#6e737c', scoria: '#5c3830',
    red: '#c8202a', glass: '#ffb469', brass: '#b89658', wood: '#8a6e50', sand: '#b4a288',
  };

  // Helper strut
  const strut = (B, a, b, t = 0.22, c = K.green, mat = 'metal') => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    B.push((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)));
    B.box(mat, c, t, t, L, 0, 0, 0, { r: 0.03 });
    B.pop();
  };

  // ------------------------------------------------------------------------------------------ placeholder lava
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
        const seam = Math.max(0, 1 - Math.abs(n - 0.5) * 7);
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

  // ------------------------------------------------------------------------------------------ walls
  D.caldera_walls = {
    build(B) {
      let idx = 0;
      for (const [cx, cy, cz, w, h, d, ry] of WALL_BOXES) for (const s of [1, -1]) {
        idx++;
        const y0 = cy - h / 2;
        B.push(s * cx, y0, s * cz, (ry * PI) / 180 + (s < 0 ? PI : 0));
        // 1. Basalt masonry foundation / plinth course at base (narrow skirting 0.35m high)
        // Depth d - 0.02 and width w - 0.06 ensures it stays strictly clear of adjacent floor blocks (0 m² coplanar)
        B.box('paint', K.basaltDk, Math.max(0.2, w - 0.06), 0.35, d - 0.02, 0, 0.175, 0, { r: 0.02 });
        B.box(NS('paint'), '#2c2e33', Math.max(0.2, w - 0.06), 0.06, d - 0.01, 0, 0.38, 0);

        // 2. Structural vertical iron pilasters (pulled inward from wall ends and faces)
        for (const sx of [-w / 2 + 0.22, w / 2 - 0.22]) {
          B.box('metal', K.greenDk, 0.18, h - 0.1, d - 0.02, sx, (h - 0.1) / 2, 0, { r: 0.02 });
        }

        // Downpipe along wall corner
        B.cyl(NS('metal'), K.ironLt, 0.025, h - 0.2, w / 2 - 0.25, (h - 0.2) / 2, (d / 2) - 0.02, { seg: 6 });

        // 3. Belt course girder at 60% of wall height
        if (h > 3.0) {
          B.box(NS('metal'), K.ironDk, Math.max(0.2, w - 0.06), 0.1, d - 0.02, 0, h * 0.6, 0);
        }

        // 4. Clerestory window openings with warm furnace interior glow
        const winW = Math.min(w * 0.72, 1.8);
        if (h > 4.5 && winW > 0.8) {
          const winY = h * 0.7;
          for (const fz of [-(d / 2) + 0.02, (d / 2) - 0.02]) {
            B.box('glow', K.glass, winW, 1.1, 0.03, 0, winY, fz, { glow: 1.1 });
            B.box(NS('metal'), K.greenDk, winW + 0.04, 0.06, 0.04, 0, winY, fz);
            B.box(NS('metal'), K.greenDk, 0.06, 1.16, 0.04, 0, winY, fz);
            B.box(NS('paint'), K.basaltLt, winW + 0.06, 0.08, 0.05, 0, winY - 0.58, fz); // Sill
            B.box(NS('paint'), K.basaltLt, winW + 0.06, 0.1, 0.05, 0, winY + 0.58, fz);  // Lintel
          }
        }

        // 5. Coping / cornice: on low walls, exterior fascia strip stopping 3 cm below top; on tall walls, upper roof
        if (y0 + h <= 6.5) {
          B.box('paint', K.verd, Math.max(0.2, w - 0.06), 0.06, d - 0.02, 0, h - 0.05, 0);
        } else {
          B.box('paint', K.verd, Math.max(0.2, w - 0.04), 0.22, d + 0.02, 0, h + 0.11, 0);
          B.box(NS('metal'), K.ironDk, Math.max(0.2, w - 0.04), 0.08, 0.04, 0, h + 0.22, (d / 2) + 0.01);

          // 7. Roof forms on upper storeys
          B.box('metal', '#4a4f56', w * 0.96, 0.45, d * 0.92, 0, h + 0.34, 0, { rx: 0.12 });

          // 8. Industrial skyline elements (every few segments)
          if (idx % 3 === 0) {
            B.cyl('paint', K.brick, 0.45, 3.2, 0, h + 1.8, 0, { seg: 8 });
            B.tor(NS('metal'), K.ironDk, 0.52, 0.06, 0, h + 3.4, 0, { rx: HP });
            B.cyl(NS('metal'), K.iron, 0.65, 0.25, 0, h + 3.6, 0, { seg: 8 });
          } else if (idx % 3 === 1) {
            B.cyl(NS('metal'), K.greenDk, 0.18, 1.2, 0, h + 0.8, 0, { seg: 6 });
          }
        }
        B.pop();
      }
    },
  };

  // ------------------------------------------------------------------------------------------ the Surge Gauge
  D.caldera_surge_gauge = {
    build(B) {
      const legs = [[4.2, 1.75], [4.2, -1.75], [-4.2, 1.75], [-4.2, -1.75]];
      // Basalt piers iron collars at 6.0 and 7.0 m
      for (const [x, z] of legs) {
        B.box('metal', K.iron, 2.2, 0.35, 2.2, x, 6.0, z, { r: 0.04 });
        B.box('metal', K.iron, 2.2, 0.35, 2.2, x, 7.0, z, { r: 0.04 });
      }
      // A-frame (7 to 12 m)
      for (const [x, z] of legs) strut(B, [x, 7.0, z], [Math.sign(x) * 1.8, 12.0, Math.sign(z) * 1.8], 0.42);
      for (const sz of [-1, 1]) {
        strut(B, [-4.2, 7.0, sz * 1.75], [4.2, 7.0, sz * 1.75], 0.36);
        strut(B, [-4.2, 7.0, sz * 1.75], [0, 12, sz * 1.8], 0.22);
        strut(B, [4.2, 7.0, sz * 1.75], [0, 12, sz * 1.8], 0.22);
      }
      for (const sx of [-1, 1]) {
        strut(B, [sx * 4.2, 7.0, -1.75], [sx * 1.8, 12, 1.8], 0.18);
        strut(B, [sx * 4.2, 7.0, 1.75], [sx * 1.8, 12, -1.8], 0.18);
      }
      for (const y of [9.5]) for (const sz of [-1, 1]) strut(B, [-3.0, y, sz * 1.78], [3.0, y, sz * 1.78], 0.2);
      // Shaft (12 to 17 m)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(B, [sx * 1.8, 12, sz * 1.8], [sx * 1.8, 17, sz * 1.8], 0.32);
      for (const y of [12, 14.5, 17]) {
        for (const s of [-1, 1]) {
          strut(B, [-1.8, y, s * 1.8], [1.8, y, s * 1.8], 0.22);
          strut(B, [s * 1.8, y, -1.8], [s * 1.8, y, 1.8], 0.22);
        }
      }
      for (const s of [-1, 1]) {
        strut(B, [-1.8, 12, s * 1.8], [1.8, 14.5, s * 1.8], 0.14);
        strut(B, [1.8, 14.5, s * 1.8], [-1.8, 17, s * 1.8], 0.14);
        strut(B, [s * 1.8, 12, -1.8], [s * 1.8, 14.5, 1.8], 0.14);
        strut(B, [s * 1.8, 14.5, 1.8], [s * 1.8, 17, -1.8], 0.14);
      }
      // Clock house (17 to 18.5 m)
      B.box('paint', K.white, 3.0, 1.5, 3.0, 0, 17.75, 0, { r: 0.05 });
      for (const [x, z, ry] of [[0, 1.52, 0], [0, -1.52, PI], [1.52, 0, HP], [-1.52, 0, -HP]]) {
        B.push(x, 17.75, z, ry);
        B.cyl('paint', K.cream, 0.6, 0.06, 0, 0, 0, { rx: HP, seg: 20 });
        B.box(NS('metal'), K.iron, 0.06, 0.5, 0.04, 0, 0.12, 0.05);
        B.pop();
      }
      // Bell cage (18.5 to 20.5 m)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(B, [sx * 1.4, 18.5, sz * 1.4], [sx * 1.4, 20.5, sz * 1.4], 0.2);
      B.lathe('metal', '#8a6a3a', [[0, 0.95], [0.18, 0.95], [0.35, 0.8], [0.45, 0.3], [0.62, 0.0], [0.8, -0.12], [0, -0.12]], 0, 19.0, 0, { seg: 18 });
      for (const sx of [-1, 1]) {
        B.push(sx * 1.0, 20.2, 0, sx > 0 ? HP : -HP);
        B.cyl('metal', K.iron, 0.28, 0.9, 0, 0, 0.4, { r2: 0.08, rx: HP, seg: 12 });
        B.pop();
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl(NS('metal'), K.iron, 0.2, 0.12, sx * 1.4, 20.5, sz * 1.4, { seg: 8 });
      // Cap (20.5 to 22 m)
      B.box('paint', K.green, 3.0, 0.2, 3.0, 0, 20.6, 0, { r: 0.04 });
      B.lathe('paint', K.verd, [[0, 1.6], [0.02, 1.6], [1.75, 0.0], [0, 0.0]], 0, 20.7, 0, { seg: 4, ry: PI / 4 });
      B.box(NS('metal'), K.iron, 0.06, 1.0, 0.06, 0, 22.7, 0);
      B.box(NS('metal'), K.iron, 0.9, 0.12, 0.06, 0.2, 23.0, 0);
      B.sph(NS('metal'), K.iron, 0.16, 0.7, 23.0, 0, { ws: 8, hs: 5 });
      // Gauge boards (8 to 15 m)
      for (const sz of [-1, 1]) {
        B.push(0, 11.5, sz * 2.5, sz > 0 ? 0 : PI);
        B.box('paint', K.green, 2.6, 7.2, 0.25, 0, 0, -0.02, { r: 0.04 });
        B.box('paint', K.cream, 2.3, 6.9, 0.06, 0, 0, 0.12, { r: 0.02 });
        B.box(NS('paint'), K.ash, 2.3, 0.7, 0.07, 0, 3.0, 0.13, { r: 0.01 });
        for (let i = 0; i < 6; i++) B.box(NS('paint'), K.iron, 0.9, 0.06, 0.07, -0.55, -3.0 + i * 1.2, 0.14, { r: 0.01 });
        B.box(NS('metal'), K.iron, 0.12, 6.4, 0.08, 0.35, 0, 0.15);
        B.pop();
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Organ socket collars & stumps
  D.caldera_socket_collar = {
    build(B) {
      // Cast iron collars with bolts encircling the organ sockets on Gauge Island
      B.cyl('metal', K.iron, 2.7, 0.15, -10, 1.25, -12.8, { r2: 2.6, seg: 18 });
      B.cyl('metal', K.iron, 1.7, 0.15, -10, 1.25, -9.14, { r2: 1.6, seg: 16 });
      B.cyl('metal', K.iron, 1.7, 0.15, -10, 1.25, -6.34, { r2: 1.6, seg: 16 });
      // Glowing lava seam inside socket
      B.cyl(NS('glow'), K.seam, 2.45, 0.05, -10, 1.15, -12.8, { seg: 12, glow: 1.5 });
      B.cyl(NS('glow'), K.seam, 1.45, 0.05, -10, 1.15, -9.14, { seg: 12, glow: 1.5 });
      B.cyl(NS('glow'), K.seam, 1.45, 0.05, -10, 1.15, -6.34, { seg: 12, glow: 1.5 });
    },
  };
  D.caldera_organ_stump = {
    build(B) {
      // Static basalt stumps clustered around the Organ Pipes, rough weathered tops
      const stumps = [
        [-10, 0.7, -15.6, 1.2, 0.9],
        [-12.2, 0.8, -13.2, 0.9, 1.1],
        [-12.0, 0.6, -9.8, 1.0, 0.8],
        [-11.8, 0.7, -6.0, 0.8, 0.9],
        [-8.0, 0.9, -14.5, 0.9, 1.2],
        [-8.2, 0.7, -4.5, 0.7, 0.8],
      ];
      for (const [x, h, z, r, topH] of stumps) {
        B.cyl('paint', K.basalt, r, h, x, 1.2 + h / 2, z, { seg: 6 });
        B.cyl(NS('paint'), K.basaltDk, r * 0.9, 0.06, x, 1.2 + h + 0.02, z, { seg: 6 });
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Slump Winch House & Chain Bollards
  D.caldera_winch_house = {
    build(B) {
      // Whitewashed basalt winch house on south Slump head with iron winch drum
      B.box('paint', K.white, 2.2, 2.5, 2.2, 0, 1.25, 0, { r: 0.05 });
      B.box('paint', K.verd, 2.4, 0.3, 2.4, 0, 2.6, 0, { r: 0.04 });
      B.lathe('paint', K.verd, [[0, 0.8], [0.05, 0.8], [1.4, 0.0], [0, 0.0]], 0, 2.75, 0, { seg: 4, ry: PI / 4 });
      // Winch drum and cable rings on front face
      B.push(0, 1.1, 1.18, 0);
      B.cyl('metal', K.iron, 0.45, 0.6, 0, 0, 0, { rx: HP, seg: 12 });
      B.box(NS('metal'), K.green, 0.8, 0.8, 0.2, 0, 0, -0.1);
      B.pop();
    },
  };
  // ------------------------------------------------------------------------------------------ Moorings & Lakefront Bollards & Capstan
  D.caldera_chain_bollard = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.0, d = o.d ?? 1.0;
      // Heavy cast-iron chain bollard with flared retention collar, mooring ring, and draped chain links
      for (const sz of [-1, 1]) B.box('paint', K.basaltDk, w * 0.82, 0.12, 0.035, 0, 0.28, sz * (d / 2 + 0.016), { r: 0.02 });
      for (const sx of [-1, 1]) B.box('paint', K.basaltDk, 0.035, 0.12, d * 0.82, sx * (w / 2 + 0.016), 0.28, 0, { r: 0.02 });
      B.box('metal', K.ironDk, w + 0.03, 0.06, d + 0.03, 0, h - 0.06, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.10, w / 2 - 0.10]) for (const sz of [-d / 2 + 0.10, d / 2 - 0.10]) {
        B.cyl(NS('metal'), K.ironLt, 0.03, 0.03, sx, h - 0.02, sz, { seg: 6 });
      }
      const r = Math.min(w, d) / 2 - 0.04;
      B.cyl('metal', K.iron, r, h - 0.32, 0, (h - 0.32) / 2 + 0.22, 0, { seg: 16 });
      B.cyl('metal', K.ironDk, r + 0.04, 0.06, 0, h - 0.07, 0, { seg: 16 });
      B.cyl(NS('metal'), K.ironLt, r - 0.02, 0.04, 0, h - 0.03, 0, { seg: 16 });
      B.tor(NS('metal'), K.ironLt, r + 0.01, 0.028, 0, h * 0.72, 0, { rx: HP });
      B.tor(NS('metal'), K.ironLt, 0.14, 0.028, 0, h * 0.55, d / 2 + 0.022);
    },
  };

  D.caldera_mooring_bollard = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.0, d = o.d ?? 1.0;
      // Heavy mooring block with cast-iron cap plate, bolt heads, flared horns, ring, and rust streak
      for (const sz of [-1, 1]) B.box('paint', K.basaltDk, w * 0.84, 0.12, 0.035, 0, 0.28, sz * (d / 2 + 0.016), { r: 0.02 });
      for (const sx of [-1, 1]) B.box('paint', K.basaltDk, 0.035, 0.12, d * 0.84, sx * (w / 2 + 0.016), 0.28, 0, { r: 0.02 });
      B.box('metal', K.ironDk, w + 0.04, 0.07, d + 0.04, 0, h - 0.06, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.10, w / 2 - 0.10]) for (const sz of [-d / 2 + 0.10, d / 2 - 0.10]) {
        B.cyl(NS('metal'), K.ironLt, 0.035, 0.03, sx, h - 0.02, sz, { seg: 6 });
      }
      const r = Math.min(w, d) / 2 - 0.04;
      B.cyl('metal', K.iron, r, h - 0.32, 0, (h - 0.32) / 2 + 0.22, 0, { seg: 16 });
      B.cyl('metal', K.ironDk, r + 0.04, 0.06, 0, h - 0.07, 0, { seg: 16 });
      B.cyl(NS('metal'), K.ironLt, r - 0.02, 0.04, 0, h - 0.03, 0, { seg: 16 });
      B.cyl('metal', K.ironLt, 0.065, w + 0.02, 0, h * 0.68, 0, { rz: HP, seg: 12 });
      B.sph(NS('metal'), K.ironLt, 0.045, (w + 0.02) / 2, h * 0.68, 0);
      B.sph(NS('metal'), K.ironLt, 0.045, -(w + 0.02) / 2, h * 0.68, 0);
      B.box(NS('metal'), K.ironDk, 0.12, 0.12, 0.04, 0, h * 0.52, d / 2 + 0.02, { r: 0.01 });
      B.tor(NS('metal'), K.ironLt, 0.15, 0.028, 0, h * 0.52, d / 2 + 0.022);
      B.box('paint', '#8f4228', 0.12, 0.32, 0.025, 0, 0.42, d / 2 + 0.015);
    },
  };

  D.caldera_race_bollard = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.04, d = o.d ?? 1.24;
      for (const sz of [-1, 1]) B.box('paint', K.basaltDk, w * 0.84, 0.18, 0.035, 0, 0.13, sz * (d / 2 + 0.016), { r: 0.02 });
      for (const sx of [-1, 1]) B.box('paint', K.basaltDk, 0.035, 0.18, d * 0.84, sx * (w / 2 + 0.016), 0.13, 0, { r: 0.02 });
      B.box('metal', K.ironDk, w + 0.03, 0.06, d + 0.03, 0, h - 0.06, 0, { r: 0.02 });
      const r = Math.min(w, d) / 2 - 0.04;
      B.cyl('metal', K.iron, r, h - 0.22, 0, (h - 0.22) / 2 + 0.12, 0, { seg: 16 });
      B.tor(NS('metal'), K.ironLt, r + 0.02, 0.025, 0, h * 0.72, 0, { rx: HP });
      B.cyl('metal', K.ironDk, r + 0.04, 0.06, 0, h - 0.07, 0, { seg: 16 });
      B.cyl(NS('metal'), K.iron, r - 0.02, 0.04, 0, h - 0.04, 0, { seg: 16 });
    },
  };

  D.caldera_capstan = {
    build(B, o = {}) {
      const h = o.h ?? 1.5, w = o.w ?? 1.4, d = o.d ?? 1.2;
      // Capstan: riveted base housing, drum lid, bar sockets, two wooden bars hugging sides, riveted plates
      B.box('metal', K.ironDk, w * 0.88, 0.16, d * 0.88, 0, 0.26, 0, { r: 0.03 });
      for (const sx of [-w * 0.38, w * 0.38]) for (const sz of [-d * 0.38, d * 0.38]) {
        B.cyl(NS('metal'), K.ironLt, 0.03, 0.03, sx, 0.35, sz, { seg: 6 });
      }
      B.cyl('metal', K.greenDk, 0.54, h - 0.44, 0, (h - 0.44) / 2 + 0.26, 0, { r2: 0.46, seg: 16 });
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3;
        B.box(NS('metal'), K.ironLt, 0.04, h - 0.50, 0.04, Math.cos(ang) * 0.51, (h - 0.50) / 2 + 0.28, Math.sin(ang) * 0.51);
      }
      B.tor(NS('metal'), K.brass, 0.54, 0.03, 0, 0.32, 0, { rx: HP });
      const drumY = h - 0.18;
      B.cyl('metal', K.ironDk, 0.56, 0.14, 0, drumY, 0, { seg: 16 });
      B.cyl('metal', K.iron, 0.50, 0.06, 0, h - 0.07, 0, { seg: 16 });
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        B.box(NS('metal'), K.ironLt, 0.08, 0.07, 0.08, Math.cos(a) * 0.48, drumY + 0.03, Math.sin(a) * 0.48);
      }
      for (const s of [-1, 1]) {
        B.push(s * 0.44, drumY - 0.25, 0, 0, 0, s * 0.22);
        B.box('wood', K.wood, 0.075, 0.85, 0.075, 0, 0, 0);
        B.box(NS('metal'), K.brass, 0.085, 0.10, 0.085, 0, 0.38, 0);
        B.box(NS('metal'), K.brass, 0.085, 0.10, 0.085, 0, -0.38, 0);
        B.pop();
      }
      B.sph(NS('metal'), K.ironLt, 0.07, 0, h - 0.02, 0, { ws: 8, hs: 6 });
    },
  };

  // ------------------------------------------------------------------------------------------ Tide Board & Ladle Car
  D.caldera_tide_board = {
    build(B, o = {}) {
      const h = o.h ?? 2.2, w = o.w ?? 2.4, d = o.d ?? 0.6;
      for (const sx of [-1, 1]) {
        const xc = sx * (w / 2 + 0.02);
        B.box('metal', K.greenDk, 0.06, h - 0.08, d + 0.04, xc, (h - 0.08) / 2 + 0.04, 0, { r: 0.02 });
      }
      B.box('paint', K.green, w + 0.06, 0.08, d + 0.06, 0, h - 0.07, 0, { r: 0.02 });
      B.box(NS('metal'), K.verd, w + 0.08, 0.03, d + 0.08, 0, h - 0.04, 0);
      B.box('paint', K.greenDk, w + 0.04, 0.08, d + 0.04, 0, 0.07, 0);
    },
  };
  D.caldera_ladle_car = {
    build(B, o = {}) {
      const h = o.h ?? 1.6, w = o.w ?? 1.3, d = o.d ?? 1.0;
      B.box('metal', K.iron, w + 0.04, 0.22, d + 0.04, 0, 0.15, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) for (const sz of [-d / 2 + 0.08, d / 2 - 0.08]) {
        B.cyl('metal', K.ironLt, 0.18, 0.06, sx, 0.16, sz, { rx: HP, seg: 12 });
      }
      for (const sx of [-w / 2 + 0.10, w / 2 - 0.10]) {
        B.box('metal', K.greenDk, 0.14, h - 0.28, 0.14, sx, (h - 0.28) / 2 + 0.20, 0);
      }
      B.lathe('metal', K.ironDk, [[0, 0.90], [0.46, 0.90], [0.38, 0.1], [0, 0]], 0, 0.40, 0, { seg: 14 });
      B.cyl(NS('glow'), K.seam, 0.40, 0.04, 0, 1.32, 0, { seg: 12, glow: 1.2 });
    },
  };

  // ------------------------------------------------------------------------------------------ Lamp post
  D.caldera_lamp_post = {
    build(B) {
      B.cyl('metal', K.greenDk, 0.18, 0.8, 0, 0.4, 0, { r2: 0.12, seg: 10 });
      B.cyl('metal', K.green, 0.08, 2.6, 0, 1.7, 0, { seg: 8 });
      B.box('metal', K.green, 0.3, 0.08, 0.3, 0, 3.0, 0);
      B.cyl(NS('glow'), '#fceec8', 0.09, 0.22, 0, 3.2, 0, { seg: 8, glow: 0.85 });
      B.lathe('metal', K.green, [[0, 0.15], [0.26, 0]], 0, 3.35, 0, { seg: 8 });
    },
  };

  // ------------------------------------------------------------------------------------------ Slump Hornitos, Cairns & Outcrops
  D.caldera_hornito = {
    build(B, o = {}) {
      const h = o.h ?? 1.3, w = o.w ?? 1.44, d = o.d ?? 1.44;
      // Spatter mound with rounded crusted cap, glowing vent on top, and viscous drip relief
      for (const sz of [-1, 1]) {
        B.box('paint', K.scoria, w * 0.82, 0.36, 0.045, 0, 0.23, sz * (d / 2 + 0.018), { r: 0.03 });
      }
      for (const sx of [-1, 1]) {
        B.box('paint', K.scoria, 0.045, 0.36, d * 0.82, sx * (w / 2 + 0.018), 0.23, 0, { r: 0.03 });
      }
      for (const sz of [-1, 1]) {
        B.box('paint', '#4a221b', 0.16, 0.42, 0.055, -w * 0.22, 0.28, sz * (d / 2 + 0.022), { r: 0.03 });
        B.box('paint', '#2e140f', 0.14, 0.52, 0.052, w * 0.24, 0.35, sz * (d / 2 + 0.022), { r: 0.03 });
      }
      for (const sx of [-1, 1]) {
        B.box('paint', '#4a221b', 0.055, 0.46, 0.16, sx * (w / 2 + 0.022), 0.30, d * 0.20, { r: 0.03 });
        B.box('paint', '#2e140f', 0.052, 0.38, 0.14, sx * (w / 2 + 0.022), 0.26, -d * 0.22, { r: 0.03 });
      }
      B.box('paint', K.scoria, w * 0.72, 0.38, d * 0.72, 0, 0.62, 0, { r: 0.04 });
      B.tor(NS('paint'), '#d6b838', 0.52, 0.038, 0, 0.76, 0, { rx: HP });
      B.lathe('paint', K.scoria, [[0, 0.45], [0.38, 0.45], [0.58, 0.22], [0.64, 0.0], [0, 0.0]], 0, h - 0.46, 0, { seg: 14 });
      B.tor('paint', '#8f3825', 0.36, 0.045, 0, h - 0.06, 0, { rx: HP });
      B.tor(NS('paint'), '#d6b838', 0.34, 0.025, 0, h - 0.04, 0, { rx: HP });
      B.cyl(NS('glow'), K.seam, 0.32, 0.06, 0, h - 0.08, 0, { seg: 12, glow: 1.6 });
    },
  };

  D.caldera_cairn = {
    build(B, o = {}) {
      const h = o.h ?? 1.2, w = o.w ?? 1.2, d = o.d ?? 1.2;
      // Dry-stone masonry cairn: 3 open relief courses, chamfered corners, capstone (>75% face open for ink)
      // Course 1 (y = 0.30, height 0.09)
      for (const sz of [-1, 1]) {
        B.box('paint', K.basaltDk, w * 0.42, 0.09, 0.035, -w * 0.22, 0.30, sz * (d / 2 + 0.016), { r: 0.02 });
        B.box('paint', '#444850', w * 0.42, 0.09, 0.035, w * 0.22, 0.30, sz * (d / 2 + 0.016), { r: 0.02 });
      }
      for (const sx of [-1, 1]) {
        B.box('paint', K.scoria, 0.035, 0.09, d * 0.42, sx * (w / 2 + 0.016), 0.30, -d * 0.22, { r: 0.02 });
        B.box('paint', K.basalt, 0.035, 0.09, d * 0.42, sx * (w / 2 + 0.016), 0.30, d * 0.22, { r: 0.02 });
      }
      // Course 2 (y = 0.65, height 0.09)
      for (const sz of [-1, 1]) {
        B.box('paint', K.basalt, w * 0.38, 0.09, 0.035, -w * 0.24, 0.65, sz * (d / 2 + 0.016), { r: 0.02 });
        B.box('paint', K.basaltDk, w * 0.42, 0.09, 0.035, w * 0.22, 0.65, sz * (d / 2 + 0.016), { r: 0.02 });
        B.box(NS('paint'), K.ash, 0.08, 0.06, 0.038, 0, 0.65, sz * (d / 2 + 0.018));
      }
      for (const sx of [-1, 1]) {
        B.box('paint', '#444850', 0.035, 0.09, d * 0.38, sx * (w / 2 + 0.016), 0.65, d * 0.24, { r: 0.02 });
        B.box('paint', K.basalt, 0.035, 0.09, d * 0.42, sx * (w / 2 + 0.016), 0.65, -d * 0.22, { r: 0.02 });
        B.box(NS('paint'), K.ash, 0.038, 0.06, 0.08, sx * (w / 2 + 0.018), 0.65, 0);
      }
      // Chamfered corner quoins at 4 corners
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.push(sx * (w / 2 + 0.014), (h - 0.16) / 2 + 0.06, sz * (d / 2 + 0.014), PI / 4);
        B.box('paint', K.basaltDk, 0.08, h - 0.16, 0.08, 0, 0, 0, { r: 0.02 });
        B.pop();
      }
      // Projecting capstone slab
      B.box('paint', K.basaltDk, w + 0.05, 0.08, d + 0.05, 0, h - 0.05, 0, { r: 0.03 });
      B.cyl(NS('metal'), K.ironLt, 0.05, 0.05, 0, h - 0.01, 0, { seg: 8 });
    },
  };

  D.caldera_outcrop = {
    build(B, o = {}) {
      const h = o.h ?? 1.3, w = o.w ?? 1.6, d = o.d ?? 1.4;
      // Faceted basalt rock outcrop with stepped horizontal fracture ledges and corner bevels (>75% face open for ink)
      for (const sz of [-1, 1]) {
        B.box('paint', K.basalt, w * 0.44, 0.12, 0.032, -w * 0.20, 0.38, sz * (d / 2 + 0.016), { r: 0.02 });
        B.box('paint', '#484d54', w * 0.44, 0.12, 0.035, w * 0.20, 0.72, sz * (d / 2 + 0.018), { r: 0.02 });
      }
      for (const sx of [-1, 1]) {
        B.box('paint', K.scoria, 0.032, 0.12, d * 0.44, sx * (w / 2 + 0.016), 0.38, d * 0.20, { r: 0.02 });
        B.box('paint', K.basaltLt, 0.035, 0.12, d * 0.44, sx * (w / 2 + 0.018), 0.72, -d * 0.20, { r: 0.02 });
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.push(sx * (w / 2 + 0.015), (h - 0.16) / 2 + 0.06, sz * (d / 2 + 0.015), PI / 4);
        B.box('paint', K.basaltDk, 0.08, h - 0.16, 0.08, 0, 0, 0, { r: 0.02 });
        B.pop();
      }
      B.box('paint', K.basaltDk, w * 0.65, 0.07, d * 0.65, 0, h - 0.05, 0, { r: 0.03 });
      B.cyl(NS('metal'), K.brass, 0.05, 0.04, 0.12, h - 0.015, 0.08, { seg: 8 });
      B.sph(NS('metal'), K.gold, 0.03, 0.12, h + 0.01, 0.08);
    },
  };

  // ------------------------------------------------------------------------------------------ Casting Floor Props (LOW)
  D.caldera_pig_bed = {
    build(B) {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        B.box('metal', K.iron, 0.50, 0.012, 0.20, -1.1 + c * 0.72, 0.008, -0.6 + r * 0.55, { r: 0.01 });
        B.box(NS('glow'), K.seam, 0.44, 0.008, 0.14, -1.1 + c * 0.72, 0.014, -0.6 + r * 0.55, { glow: 1.1 });
      }
    },
  };
  D.caldera_floor_drain = {
    build(B) {
      B.box('metal', K.iron, 0.85, 0.012, 0.85, 0, 0.008, 0, { r: 0.01 });
      for (let k = -3; k <= 3; k++) B.box(NS('metal'), K.ironDk, 0.65, 0.014, 0.03, 0, 0.009, k * 0.1);
      B.cyl(NS('glow'), K.seam, 0.18, 0.012, 0, 0.008, 0, { seg: 8, glow: 1.1 });
    },
  };
  D.caldera_mould_stack = {
    build(B, o = {}) {
      const h = o.h ?? 1.8, w = o.w ?? 1.4, d = o.d ?? 1.4;
      // Mould stack (paint: false): 4 stacked flask sections with perimeter clamping edges, guide pins, handles
      const nSections = 4, secH = (h - 0.08) / nSections;
      for (let i = 0; i < nSections; i++) {
        const my = 0.04 + (i + 0.5) * secH;
        B.box('metal', K.ironDk, w * 0.88, secH - 0.04, d * 0.88, 0, my, 0, { r: 0.02 });
        B.box(NS('metal'), K.iron, w + 0.03, 0.04, d + 0.03, 0, my - secH / 2 + 0.02, 0);
        B.box(NS('metal'), K.iron, w + 0.03, 0.04, d + 0.03, 0, my + secH / 2 - 0.02, 0);
        for (const sx of [-w / 2 + 0.04, w / 2 - 0.04]) for (const sz of [-d / 2 + 0.04, d / 2 - 0.04]) {
          B.cyl(NS('metal'), K.ironLt, 0.025, secH + 0.02, sx, my, sz, { seg: 6 });
        }
        for (const sx of [-w / 2 - 0.015, w / 2 + 0.015]) {
          B.tor(NS('metal'), K.ironLt, 0.08, 0.022, sx, my, 0, { ry: HP });
        }
      }
    },
  };
  D.caldera_ladle_stand = {
    build(B, o = {}) {
      const h = o.h ?? 2.0, w = o.w ?? 1.6, d = o.d ?? 1.6;
      // Riveted structural steel cradle base with ladle lip and pouring spout hugging front side
      for (const sx of [-w / 2 + 0.08, w / 2 - 0.08]) for (const sz of [-d / 2 + 0.08, d / 2 - 0.08]) {
        B.box('metal', K.greenDk, 0.15, h - 0.10, 0.15, sx, (h - 0.10) / 2 + 0.05, sz, { r: 0.02 });
      }
      for (const sz of [-d / 2 + 0.08, d / 2 - 0.08]) {
        B.box('metal', K.ironDk, w - 0.12, 0.14, 0.06, 0, 0.40, sz);
        B.box('metal', K.ironDk, w - 0.12, 0.14, 0.06, 0, h * 0.68, sz);
      }
      for (const sx of [-w / 2 + 0.08, w / 2 - 0.08]) {
        B.box('metal', K.ironDk, 0.06, 0.14, d - 0.12, sx, 0.40, 0);
        B.box('metal', K.ironDk, 0.06, 0.14, d - 0.12, sx, h * 0.68, 0);
      }
      for (const sx of [-w / 2 + 0.08, w / 2 - 0.08]) {
        B.box(NS('metal'), K.brass, 0.16, 0.08, 0.20, sx, h * 0.76, 0);
      }
      B.lathe('metal', K.ironDk, [[0, 0.88], [0.58, 0.88], [0.46, 0.08], [0, 0.08]], 0, 0.55, 0, { seg: 16 });
      B.push(0, 1.40, -d / 2 + 0.04, -0.22);
      B.box('metal', K.ironDk, 0.24, 0.12, 0.15, 0, 0, 0, { r: 0.02 });
      B.cyl(NS('glow'), K.seam, 0.12, 0.04, 0, 0.06, 0, { seg: 8, glow: 1.3 });
      B.pop();
      B.cyl(NS('glow'), K.seam, 0.52, 0.04, 0, 1.42, 0, { seg: 12, glow: 1.4 });
    },
  };

  // ------------------------------------------------------------------------------------------ Slag Pot & Gauge Post
  D.caldera_slag_pot = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.0, d = o.d ?? 1.2;
      B.box('metal', K.ironDk, w + 0.04, 0.14, d + 0.04, 0, 0.09, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.04, w / 2 - 0.04]) for (const sz of [-d / 2 + 0.04, d / 2 - 0.04]) {
        B.box(NS('metal'), K.ironDk, 0.10, h - 0.22, 0.10, sx, (h - 0.22) / 2 + 0.09, sz);
      }
      B.lathe('metal', K.ironDk, [[0, h - 0.10], [0.44, h - 0.10], [0.38, 0.45], [0.26, 0.0], [0, 0.0]], 0, 0.05, 0, { seg: 14 });
      B.cyl(NS('metal'), K.iron, 0.46, 0.05, 0, h - 0.10, 0, { seg: 14 });
      B.cyl(NS('paint'), K.scoria, 0.40, 0.04, 0, h - 0.06, 0, { seg: 10 });
    },
  };
  D.caldera_gauge_post = {
    build(B, o = {}) {
      const h = o.h ?? 1.2, w = o.w ?? 2.8, d = o.d ?? 2.6;
      B.box('metal', K.ironDk, w + 0.05, 0.12, d + 0.05, 0, 0.06, 0, { r: 0.02 });
      B.box('metal', K.ironDk, w + 0.05, 0.06, d + 0.05, 0, h - 0.06, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.06, w / 2 - 0.06]) for (const sz of [-d / 2 + 0.06, d / 2 - 0.06]) {
        B.box('paint', K.white, 0.12, h - 0.12, 0.12, sx, (h - 0.12) / 2 + 0.06, sz);
      }
      B.cyl(NS('metal'), K.iron, 0.10, 0.06, 0.6, h - 0.02, 0.6, { seg: 8 });
    },
  };

  // ------------------------------------------------------------------------------------------ Moulding Terrace Props
  D.caldera_pattern_doors = {
    build(B) {
      B.box('wood', K.wood, 2.4, 2.2, 0.04, 0, 1.1, 0.87, { r: 0.02 });
      B.box(NS('metal'), K.ironDk, 2.6, 0.08, 0.06, 0, 2.24, 0.88);
      for (let k = 0; k < 4; k++) B.box(NS('wood'), '#6e543c', 2.36, 0.04, 0.05, 0, 0.4 + k * 0.5, 0.88);
      B.box('paint', K.cream, 1.4, 0.30, 0.05, 0, 1.8, 0.90, { r: 0.01 });
    },
  };
  D.caldera_pattern_crates = {
    build(B, o = {}) {
      const h = o.h ?? 0.9, w = o.w ?? 1.0, d = o.d ?? 1.2;
      // Pattern crates (paint: false): slatted planks with recessed gaps, corner angle brackets, stencil
      const nSlats = 3, slatH = (h - 0.08) / nSlats, gap = 0.022, plankH = slatH - gap;
      for (let i = 0; i < nSlats; i++) {
        const py = 0.04 + (i + 0.5) * slatH;
        for (const sz of [-1, 1]) {
          B.box('wood', K.wood, w * 0.86, plankH, 0.032, 0, py, sz * (d / 2 + 0.015));
        }
        for (const sx of [-1, 1]) {
          B.box('wood', '#785d42', 0.032, plankH, d * 0.86, sx * (w / 2 + 0.015), py, 0);
        }
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.box('metal', K.ironLt, 0.05, h - 0.05, 0.05, sx * (w / 2 + 0.015), (h - 0.05) / 2 + 0.025, sz * (d / 2 + 0.015));
      }
      B.box('paint', K.cream, 0.38, 0.10, 0.035, 0, h * 0.52, d / 2 + 0.018);
    },
  };

  D.caldera_stone_crate = {
    build(B, o = {}) {
      const h = o.h ?? 1.2, w = o.w ?? 1.2, d = o.d ?? 1.2;
      // Heavy timber quarry crate (paint: false): slats with recessed gaps, corner iron straps, stencil
      const nSlats = 4, slatH = (h - 0.12) / nSlats, gap = 0.025, plankH = slatH - gap;
      for (let i = 0; i < nSlats; i++) {
        const py = 0.06 + (i + 0.5) * slatH;
        for (const sz of [-1, 1]) {
          B.box('wood', '#785d42', w * 0.86, plankH, 0.035, 0, py, sz * (d / 2 + 0.016));
        }
        for (const sx of [-1, 1]) {
          B.box('wood', '#6a5138', 0.035, plankH, d * 0.86, sx * (w / 2 + 0.016), py, 0);
        }
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.box('metal', K.ironRust, 0.065, h - 0.06, 0.065, sx * (w / 2 + 0.016), (h - 0.06) / 2 + 0.03, sz * (d / 2 + 0.016));
        for (let b = 0; b < 3; b++) {
          const by = 0.18 + b * ((h - 0.36) / 2);
          B.cyl(NS('metal'), K.ironLt, 0.018, 0.02, sx * (w / 2 + 0.028), by, sz * (d / 2 + 0.028), { seg: 6 });
        }
      }
      for (const sx of [-w * 0.28, w * 0.28]) {
        B.box('metal', K.ironDk, 0.05, 0.025, d + 0.03, sx, h - 0.015, 0);
      }
      B.box('paint', K.cream, 0.46, 0.12, 0.038, 0, h * 0.52, d / 2 + 0.018);
      B.box(NS('metal'), K.ironDk, 0.38, 0.04, 0.040, 0, h * 0.52, d / 2 + 0.018);
    },
  };

  D.caldera_chain_bin = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.0, d = o.d ?? 0.8;
      // Heavy riveted sheet-steel chain bin (paint: false) with draped chains and lifting lugs
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.box('metal', K.ironDk, 0.06, h - 0.06, 0.06, sx * (w / 2 + 0.015), (h - 0.06) / 2 + 0.03, sz * (d / 2 + 0.015));
      }
      B.box('metal', K.iron, w + 0.03, 0.04, d + 0.03, 0, h - 0.04, 0);
      for (let k = 0; k < 3; k++) {
        B.tor(NS('metal'), K.ironLt, 0.16, 0.032, -0.22 + k * 0.22, h - 0.08, 0, { rx: HP });
      }
      B.tor(NS('metal'), K.ironLt, 0.12, 0.024, 0.08, h - 0.12, d / 2 + 0.022);
      B.tor(NS('metal'), K.ironLt, 0.12, 0.024, 0.16, h - 0.22, d / 2 + 0.024);
      for (const sx of [-w / 2 - 0.015, w / 2 + 0.015]) {
        B.tor(NS('metal'), K.ironLt, 0.07, 0.022, sx, h * 0.65, 0, { ry: HP });
      }
    },
  };

  D.caldera_firebrick_store = {
    build(B, o = {}) {
      const h = o.h ?? 3.5, w = o.w ?? 3.23, d = o.d ?? 2.35;
      // Firebrick store: courses, dressed lintel, recessed double door within 8.5 cm, ink showing on brick
      const nCourses = 7;
      for (let i = 0; i < nCourses; i++) {
        const cy = 0.25 + i * 0.45;
        const col = i % 2 === 0 ? '#d49b56' : K.brick;
        for (const sz of [-1, 1]) {
          B.box('paint', col, w * 0.88, 0.12, 0.035, 0, cy, sz * (d / 2 + 0.016));
        }
        for (const sx of [-1, 1]) {
          B.box('paint', col, 0.035, 0.12, d * 0.88, sx * (w / 2 + 0.016), cy, 0);
        }
      }
      B.box('paint', K.basaltDk, 1.65, 0.22, 0.055, 0, 2.32, d / 2 + 0.026, { r: 0.02 });
      B.box('metal', K.greenDk, 1.45, 2.15, 0.045, 0, 1.10, d / 2 + 0.018, { r: 0.02 });
      B.box(NS('metal'), K.ironDk, 0.06, 2.15, 0.055, 0, 1.10, d / 2 + 0.024);
      for (const y of [0.45, 1.75]) {
        B.box(NS('metal'), K.ironLt, 1.40, 0.05, 0.055, 0, y, d / 2 + 0.024);
      }
      for (const sx of [-w * 0.38, w * 0.38]) {
        B.box(NS('metal'), K.ironDk, 0.18, 0.18, 0.035, sx, 2.75, d / 2 + 0.02);
        B.cyl(NS('metal'), K.ironLt, 0.03, 0.04, sx, 2.75, d / 2 + 0.038, { rx: HP, seg: 6 });
      }
      B.box('paint', K.basaltDk, w + 0.04, 0.08, d + 0.04, 0, h - 0.05, 0, { r: 0.02 });
    },
  };

  D.caldera_flask_stack = {
    build(B, o = {}) {
      const h = o.h ?? 1.6, w = o.w ?? 1.2, d = o.d ?? 0.9;
      // Moulding flasks with wooden frames, clamping brackets, guide pins, handles
      const nFlasks = 3, flH = (h - 0.08) / nFlasks;
      for (let i = 0; i < nFlasks; i++) {
        const fy = 0.04 + (i + 0.5) * flH;
        B.box('wood', '#6b543e', w * 0.88, flH - 0.03, d * 0.88, 0, fy, 0, { r: 0.02 });
        for (const sx of [-w / 2 + 0.02, w / 2 - 0.02]) for (const sz of [-d / 2 + 0.02, d / 2 - 0.02]) {
          B.box(NS('metal'), K.ironDk, 0.05, flH, 0.05, sx, fy, sz);
        }
        for (const sx of [-w / 2 + 0.05, w / 2 - 0.05]) {
          B.cyl(NS('metal'), K.ironLt, 0.022, 0.08, sx, fy + flH / 2, 0, { seg: 6 });
        }
        for (const sx of [-w / 2 - 0.015, w / 2 + 0.015]) {
          B.tor(NS('metal'), K.ironLt, 0.07, 0.02, sx, fy, 0, { ry: HP });
        }
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Yard Props
  D.caldera_surge_office = {
    build(B) {
      const hw = (OFFICE.x1 - OFFICE.x0) / 2;
      B.lathe('paint', K.verd, [[0, 1.6], [0.05, 1.6], [hw * Math.SQRT2 + 0.3, 0.0], [0, 0.0]], 0, 9.5, 0, { seg: 4, ry: PI / 4 });
      for (const y of [5.6, 8.0]) for (const s of [-1, 1]) {
        B.box(NS('paint'), K.green, 2 * hw - 0.4, 0.9, 0.08, 0, y, s * (hw + 0.03));
        B.box(NS('paint'), K.green, 0.08, 0.9, 2 * hw - 0.4, s * (hw + 0.03), y, 0);
      }
      B.box('paint', K.cream, 0.2, 1.8, 3.0, hw + 0.12, 6.2, 0, { r: 0.03 });
    },
  };
  D.caldera_cupola_hood = {
    build(B) {
      B.lathe('paint', K.verd, [[0, 2.2], [0.3, 2.2], [1.6, 0.4], [1.8, 0.0], [0, 0.0]], 0, 15.05, 0, { seg: 16 });
      for (let k = 0; k < 4; k++) {
        const a = k * HP + PI / 4;
        B.box(NS('metal'), K.iron, 0.1, 0.9, 0.1, Math.cos(a) * 1.2, 15.4, Math.sin(a) * 1.2);
      }
    },
  };
  D.caldera_lamp_post_rack = {
    build(B, o = {}) {
      const h = o.h ?? 2.2, w = o.w ?? 1.4, d = o.d ?? 1.8;
      B.box('metal', K.ironDk, w + 0.04, 0.14, d + 0.04, 0, 0.07, 0, { r: 0.02 });
      for (const sx of [-w / 2 + 0.04, w / 2 - 0.04]) for (const sz of [-d / 2 + 0.04, d / 2 - 0.04]) {
        B.box(NS('metal'), K.greenDk, 0.08, h - 0.10, 0.08, sx, (h - 0.10) / 2, sz);
      }
      for (let i = -2; i <= 2; i++) {
        B.cyl('metal', K.green, 0.05, h - 0.20, i * 0.24, (h - 0.20) / 2 + 0.10, 0, { seg: 8 });
      }
    },
  };
  D.caldera_ingot_pile = {
    build(B, o = {}) {
      const h = o.h ?? 1.3, w = o.w ?? 1.2, d = o.d ?? 1.4;
      // Stacked individual cast bronze ingots in alternating criss-cross tiers (paint: false)
      for (const sx of [-w * 0.32, w * 0.32]) {
        B.box('wood', '#684e36', 0.10, 0.08, d * 0.88, sx, 0.04, 0);
      }
      for (let k = -1; k <= 1; k++) {
        B.box('metal', K.brass, w * 0.84, 0.14, 0.26, 0, 0.15, k * 0.36, { r: 0.02 });
      }
      for (let k = -1; k <= 1; k++) {
        B.box('metal', '#c89d48', 0.26, 0.14, d * 0.84, k * 0.34, 0.31, 0, { r: 0.02 });
      }
      for (let k = -1; k <= 1; k++) {
        B.box('metal', K.brass, w * 0.80, 0.14, 0.25, 0, 0.47, k * 0.34, { r: 0.02 });
      }
      for (const sx of [-0.18, 0.18]) {
        B.box('metal', '#c89d48', 0.24, 0.14, d * 0.76, sx, 0.63, 0, { r: 0.02 });
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Casting Hall (Spawn)
  D.caldera_hall_roof = {
    build(B) {
      const [[xe, z0], [xw]] = HALL_LINE, L = xe - xw + 0.6, D0 = 16, H = 12, mx = (xe + xw) / 2;
      B.box('paint', K.white, L, H, D0, mx, H / 2, z0 - D0 / 2 - 0.2, { r: 0.05 });
      for (let k = 0; k < 4; k++) {
        const zc = z0 - 2.0 - k * 3.8;
        B.push(mx, H + 0.95, zc, 0, 0);
        B.box('paint', K.verd, L + 0.1, 0.18, 3.9, 0, 0, 0, { rx: -0.5, r: 0.03 });
        B.pop();
        B.box(NS('paint'), '#3a5560', L - 0.4, 1.7, 0.12, mx, H + 0.85, zc + 1.9, { r: 0.02 });
      }
      for (const x of [xe - 4, xw + 4]) {
        B.box('paint', K.brick, 1.4, 6.0, 1.4, x, H + 3.5, z0 - 12, { r: 0.04 });
        B.box(NS('paint'), K.iron, 1.6, 0.3, 1.6, x, H + 6.6, z0 - 12);
      }
      B.push(PAD[0], 9.2, z0 - 0.15, 0);
      B.cyl('paint', K.green, 2.3, 0.2, 0, 0, 0, { rx: HP, seg: 28 });
      B.cyl(NS('glow'), K.glass, 2.0, 0.22, 0, 0, 0.02, { rx: HP, seg: 28, glow: 1.4 });
      for (let k = 0; k < 4; k++) B.box(NS('paint'), K.green, 0.14, 4.0, 0.25, 0, 0, 0.05, { rz: (k * PI) / 4 });
      B.pop();
    },
  };
  D.caldera_planter_urn = {
    build(B, o = {}) {
      const h = o.h ?? 1.1, w = o.w ?? 1.2, d = o.d ?? 1.2;
      // Classical carved basalt planter urn with flared rim, decorative belly band, and dark volcanic soil
      B.box('paint', K.basaltDk, w + 0.02, 0.18, d + 0.02, 0, 0.09, 0, { r: 0.03 });
      B.lathe('paint', K.basalt, [[0, 0.18], [0.44, 0.18], [0.58, 0.52], [0.48, 0.88], [0.58, h - 0.06], [0, h - 0.06]], 0, 0.0, 0, { seg: 16 });
      B.tor(NS('paint'), K.basaltLt, 0.58, 0.042, 0, 0.52, 0, { rx: HP });
      B.tor('paint', K.basaltDk, 0.57, 0.048, 0, h - 0.05, 0, { rx: HP });
      B.cyl(NS('paint'), '#30241c', 0.50, 0.06, 0, h - 0.08, 0, { seg: 12 });
      for (const s of [-1, 1]) {
        B.tor(NS('paint'), K.basaltLt, 0.12, 0.035, s * 0.58, 0.65, 0, { ry: HP });
      }
    },
  };

  // Register rich architectural and industrial structures
  registerArch(D, H);
}

// Set dressing placements (Alpha's half; mirrored unless `mirror: false`)
export const PLACEMENTS = [
  ...(BLOCKOUT_LAVA ? [{ type: 'caldera_lava', pos: [0, 0, 0], mirror: false }] : []),
  { type: 'caldera_rails', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_walls', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_rails', pos: [0, 0, 0], mirror: false, list: GANTRY_RAILS, onlyIn: 'bazookarp' },
  { type: 'caldera_surge_gauge', pos: [0, 0, 0], mirror: false, notIn: 'boss' },
  { type: 'caldera_pour_floor_dressing', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_hall_roof', pos: [0, 0, 0] },
  { type: 'caldera_cupola_hood', pos: [-3.2, 0, -64.3] },
  { type: 'caldera_surge_office', pos: [(OFFICE.x0 + OFFICE.x1) / 2, 0, (OFFICE.z0 + OFFICE.z1) / 2] },
  { type: 'caldera_rim_head_dressing', pos: [0, 0, 0] },
  { type: 'caldera_yard_cover_dressing', pos: [0, 0, 0] },
  { type: 'caldera_horizon_dressing', pos: [0, 0, 0], mirror: false },
  { type: 'caldera_piece_skins', pos: [0, 0, 0] },

  // Flank & Slump
  { type: 'caldera_winch_house', pos: [-23.116, 1.2, -19.743], rotY: 139.5 * D_ },
  { type: 'caldera_hornito', pos: [-27.156, 0, -12.204], rotY: 155.8 * D_, h: 1.3 },
  { type: 'caldera_hornito', pos: [-27.797, 0, -6.417], rotY: 167.0 * D_, h: 1.3 },
  { type: 'caldera_cairn', pos: [23.895, 2.4, -15.07], rotY: 78.0 * D_, h: 1.2 },
  { type: 'caldera_cairn', pos: [-32.989, 3.6, -0.864], rotY: 178.5 * D_, h: 1.2, d: 1.4 },
  { type: 'caldera_cairn', pos: [-29.2, 4.2, -35.6], h: 1.2 },
  { type: 'caldera_cairn', pos: [-25.6, 4.2, -29.6], h: 1.2 },
  { type: 'caldera_outcrop', pos: [-29.0, 4.2, -24.5], w: 1.6, d: 1.4, h: 1.3 },
  { type: 'caldera_outcrop', pos: [-35.4, 4.2, -37.0], w: 1.4, d: 1.6, h: 1.3 },

  // Moorings & Lakefront
  { type: 'caldera_tide_board', pos: [-7.8, 1.2, -23.4], h: 2.2, w: 2.4, d: 0.6 },
  { type: 'caldera_capstan', pos: [-14.4, 1.6, -29.8], h: 1.5, w: 1.4, d: 1.2 },
  { type: 'caldera_chain_bollard', pos: [-17.2, 1.6, -28.6], h: 1.2 },
  { type: 'caldera_chain_bollard', pos: [-19.433, 1.2, -16.703], rotY: 19.0 * D_, h: 1.1 },
  { type: 'caldera_mooring_bollard', pos: [-13.6, 1.6, -23.4], h: 1.3, w: 1.0, d: 0.9 },
  { type: 'caldera_mooring_bollard', pos: [-4.0, 1.2, -23.2], h: 1.1, w: 1.0, d: 1.0 },
  { type: 'caldera_race_bollard', pos: [-26.591, 1.2, 0.696], rotY: -178.5 * D_, h: 1.1 },
  { type: 'caldera_ladle_car', pos: [6.726, 1.2, -26.876], rotY: -14.05 * D_, h: 1.6, w: 1.3, d: 1.0 },
  { type: 'caldera_stone_crate', pos: [-22.7, 1.6, -26.6], h: 1.2 },
  { type: 'caldera_chain_bin', pos: [1.8, 1.2, -29.3], h: 1.1, w: 1.0, d: 0.8 },

  // Casting Floor (LOW, single half)
  { type: 'caldera_pig_bed', pos: [10.5, 0, -15.5], mirror: false },
  { type: 'caldera_floor_drain', pos: [13.0, 0, -16.5], mirror: false },
  { type: 'caldera_mould_stack', pos: [12.0, 0, -18.4], h: 1.8, w: 1.4, d: 1.4, mirror: false },
  { type: 'caldera_ladle_stand', pos: [14.0, 0, -13.6], h: 2.0, w: 1.6, d: 1.6, mirror: false },

  // Spillway
  { type: 'caldera_slag_pot', pos: [14.934, 2.3, -25.818], rotY: 78.0 * D_, h: 1.1 },
  { type: 'caldera_gauge_post', pos: [25.071, 2.4, -26.373], rotY: 78.0 * D_, h: 1.2, w: 2.8, d: 2.6 },

  // Moulding Terrace
  { type: 'caldera_pattern_doors', pos: [-23.147, 2.4, -33.305], rotY: 126.0 * D_ },
  { type: 'caldera_pattern_crates', pos: [-11.8, 3.0, -38.2], h: 0.9, w: 1.0, d: 1.2 },
  { type: 'caldera_firebrick_store', pos: [-3.12, 2.4, -35.886], rotY: -17.2 * D_, h: 3.5, w: 3.23, d: 2.35 },
  { type: 'caldera_flask_stack', pos: [-13.55, 2.4, -37.5], h: 1.6, w: 1.2, d: 0.9 },
  { type: 'caldera_flask_stack', pos: [-23.1, 3.6, -41.75], h: 1.6, w: 1.0, d: 1.1 },

  // Yard
  { type: 'caldera_lamp_post_rack', pos: [-26.2, 3.6, -41.6], h: 2.2, w: 1.4, d: 1.8 },
  { type: 'caldera_ingot_pile', pos: [-14.6, 3.6, -48.7], h: 1.3, w: 1.2, d: 1.4 },

  // Urns
  { type: 'caldera_planter_urn', pos: [-25.4, 4.8, -57.4], h: 1.1 },
  { type: 'caldera_planter_urn', pos: [-8.6, 4.8, -64.4], h: 1.1 },
  { type: 'caldera_planter_urn', pos: [-25.4, 4.8, -65.4], h: 1.1 },
];
