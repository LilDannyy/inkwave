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
    basalt: '#55595f', basaltDk: '#3f4248', scoria: '#5c3830',
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
        B.push(s * cx, 0, s * cz, (ry * PI) / 180);
        // 1. Basalt masonry foundation / plinth course at base (y = 0 to 1.4)
        B.box('paint', K.basaltDk, w + 0.04, 1.4, d + 0.06, 0, 0.7, 0, { r: 0.03 });
        B.box('paint', '#2c2e33', w + 0.06, 0.12, d + 0.08, 0, 1.46, 0);

        // 2. Main wall body in warm dark industrial brick
        B.box('paint', K.brick, w, h - 1.5, d, 0, 1.5 + (h - 1.5) / 2, 0, { r: 0.02 });

        // 3. Structural vertical iron pilasters at wall ends
        for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) {
          B.box('metal', K.greenDk, 0.22, h, d + 0.06, sx, cy, 0, { r: 0.02 });
        }

        // 4. Belt course girder at y = 3.6
        B.box(NS('metal'), K.ironDk, w + 0.04, 0.12, d + 0.06, 0, 3.6, 0);

        // 5. Clerestory window openings with warm furnace interior glow
        const winW = Math.min(w * 0.72, 1.8);
        if (h > 4.5 && winW > 0.8) {
          for (const fz of [-(d / 2) - 0.02, (d / 2) + 0.02]) {
            B.box('glow', K.glass, winW, 1.1, 0.05, 0, 4.4, fz, { glow: 1.1 });
            B.box(NS('metal'), K.greenDk, winW + 0.06, 0.06, 0.08, 0, 4.4, fz);
            B.box(NS('metal'), K.greenDk, 0.06, 1.16, 0.08, 0, 4.4, fz);
          }
        }

        // 6. Coping and eaves cornice along roofline
        B.box('paint', K.verd, w + 0.14, 0.22, d + 0.16, 0, h + 0.11, 0);
        B.box(NS('metal'), K.ironDk, w + 0.18, 0.08, 0.1, 0, h + 0.22, (d / 2) + 0.05);

        // 7. Roof forms on upper storeys
        B.box('metal', '#4a4f56', w * 0.96, 0.45, d * 0.92, 0, h + 0.34, 0, { rx: 0.12 });

        // 8. Industrial skyline elements (every few segments)
        if (idx % 3 === 0) {
          B.cyl('paint', K.brick, 0.45, 3.2, 0, h + 1.8, 0, { seg: 8 });
          B.tor(NS('metal'), K.ironDk, 0.52, 0.06, 0, h + 3.4, 0);
          B.cyl(NS('metal'), K.iron, 0.65, 0.25, 0, h + 3.6, 0, { seg: 8 });
        } else if (idx % 3 === 1) {
          B.cyl(NS('metal'), K.greenDk, 0.18, 1.2, 0, h + 0.8, 0, { seg: 6 });
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
  D.caldera_chain_bollard = {
    build(B) {
      // Heavy iron chain bollard
      B.cyl('metal', K.iron, 0.28, 0.85, 0, 0.42, 0, { seg: 12 });
      B.sph('metal', K.iron, 0.32, 0, 0.88, 0, { ws: 8, hs: 6 });
      B.tor(NS('metal'), K.ironLt, 0.18, 0.05, 0, 0.65, 0.22, { rx: HP });
    },
  };
  D.caldera_mooring_bollard = {
    build(B) {
      B.cyl('metal', K.iron, 0.25, 0.7, 0, 0.35, 0, { r2: 0.3, seg: 12 });
      B.sph('metal', K.iron, 0.32, 0, 0.72, 0, { ws: 8, hs: 6 });
    },
  };
  D.caldera_capstan = {
    build(B) {
      B.cyl('metal', K.greenDk, 0.55, 0.8, 0, 0.4, 0, { r2: 0.45, seg: 14 });
      B.cyl('metal', K.iron, 0.6, 0.15, 0, 0.85, 0, { seg: 14 });
      for (let k = 0; k < 4; k++) {
        B.push(0, 0.88, 0, (k * PI) / 2);
        B.box(NS('metal'), K.iron, 1.6, 0.08, 0.08, 0, 0, 0);
        B.pop();
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Tide Board & Ladle Car
  D.caldera_tide_board = {
    build(B) {
      // Cream enamel board on two works-green posts at causeway foot
      for (const sx of [-0.9, 0.9]) strut(B, [sx, 0, 0], [sx, 2.2, 0], 0.12);
      B.box('paint', K.green, 2.1, 1.4, 0.15, 0, 1.5, 0, { r: 0.03 });
      B.box('paint', K.cream, 1.9, 1.2, 0.08, 0, 1.5, 0.05, { r: 0.02 });
    },
  };
  D.caldera_ladle_car = {
    build(B) {
      // 4-wheel foundry car carrying heavy ladle
      B.box('metal', K.iron, 1.6, 0.25, 1.2, 0, 0.3, 0, { r: 0.03 });
      // 4 wheels
      for (const sx of [-0.65, 0.65]) for (const sz of [-0.48, 0.48]) {
        B.cyl('metal', K.ironLt, 0.22, 0.08, sx, 0.22, sz, { rx: HP, seg: 12 });
      }
      // Ladle
      B.lathe('metal', K.ironDk, [[0, 0.9], [0.55, 0.9], [0.45, 0.1], [0, 0]], 0, 0.45, 0, { seg: 14 });
      B.cyl(NS('glow'), K.seam, 0.48, 0.04, 0, 1.3, 0, { seg: 12, glow: 1.2 });
    },
  };

  // ------------------------------------------------------------------------------------------ Lamp post
  D.caldera_lamp_post = {
    build(B) {
      B.cyl('metal', K.greenDk, 0.18, 0.8, 0, 0.4, 0, { r2: 0.12, seg: 10 });
      B.cyl('metal', K.green, 0.08, 2.6, 0, 1.7, 0, { seg: 8 });
      B.box('metal', K.green, 0.3, 0.08, 0.3, 0, 3.0, 0);
      B.cyl(NS('glow'), K.cream, 0.16, 0.3, 0, 3.2, 0, { seg: 8, glow: 1.3 });
      B.lathe('metal', K.green, [[0, 0.15], [0.26, 0]], 0, 3.35, 0, { seg: 8 });
    },
  };

  // ------------------------------------------------------------------------------------------ Slump Hornitos & Cairn
  D.caldera_hornito = {
    build(B) {
      B.lathe('paint', K.scoria, [[0, 1.3], [0.35, 1.3], [0.75, 0.7], [1.1, 0.0], [0, 0.0]], 0, 0, 0, { seg: 12 });
      // Glowing crater vent
      B.cyl(NS('glow'), K.seam, 0.28, 0.08, 0, 1.28, 0, { seg: 10, glow: 1.4 });
    },
  };
  D.caldera_cairn = {
    build(B) {
      for (let i = 0; i < 4; i++) {
        const y = i * 0.28, r = 0.55 - i * 0.1;
        B.cyl('paint', K.basaltDk, r, 0.26, 0, y + 0.13, 0, { seg: 7 });
      }
    },
  };

  // ------------------------------------------------------------------------------------------ Casting Floor Props (LOW)
  D.caldera_pig_bed = {
    build(B) {
      // Flush rows of ingot moulds in sand bed
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
        B.box('metal', K.iron, 0.65, 0.04, 0.24, -1.5 + c * 0.75, 0.02, -0.9 + r * 0.6, { r: 0.01 });
      }
    },
  };
  D.caldera_floor_drain = {
    build(B) {
      B.box('metal', K.iron, 0.9, 0.03, 0.9, 0, 0.015, 0, { r: 0.02 });
      for (let k = -3; k <= 3; k++) B.box(NS('metal'), K.ironDk, 0.7, 0.04, 0.04, 0, 0.02, k * 0.1);
      B.cyl(NS('glow'), K.seam, 0.2, 0.02, 0, 0.01, 0, { seg: 8, glow: 1.2 });
    },
  };
  D.caldera_mould_stack = {
    build(B) {
      for (let i = 0; i < 4; i++) {
        B.box('metal', K.ironDk, 1.3 - i * 0.05, 0.38, 1.3 - i * 0.05, 0, i * 0.4 + 0.2, 0, { r: 0.04 });
        B.box(NS('metal'), K.ironLt, 1.35, 0.05, 1.35, 0, i * 0.4 + 0.38, 0);
      }
    },
  };
  D.caldera_ladle_stand = {
    build(B) {
      strut(B, [-0.65, 0, -0.65], [-0.65, 1.8, -0.65], 0.12, K.greenDk);
      strut(B, [0.65, 0, -0.65], [0.65, 1.8, -0.65], 0.12, K.greenDk);
      strut(B, [-0.65, 0, 0.65], [-0.65, 1.8, 0.65], 0.12, K.greenDk);
      strut(B, [0.65, 0, 0.65], [0.65, 1.8, 0.65], 0.12, K.greenDk);
      B.box('metal', K.iron, 1.5, 0.15, 1.5, 0, 1.85, 0, { r: 0.03 });
      // Resting crucible ladle
      B.lathe('metal', K.iron, [[0, 0.7], [0.45, 0.7], [0.35, 0], [0, 0]], 0, 1.95, 0, { seg: 12 });
    },
  };

  // ------------------------------------------------------------------------------------------ Spillway Bridge & Slag Pot
  D.caldera_spillway_bridge = {
    build(B) {
      // Works-green riveted bridge girders with SPILLWAY cast plates
      B.box('metal', K.green, 5.5, 0.55, 0.3, 0, 0.2, 4.4, { r: 0.03 });
      B.box('metal', K.green, 5.5, 0.55, 0.3, 0, 0.2, -4.4, { r: 0.03 });
      // Cast iron plate on outer face
      B.box('metal', K.iron, 1.8, 0.35, 0.08, 0, 0.2, 4.56, { r: 0.02 });
      B.box('metal', K.iron, 1.8, 0.35, 0.08, 0, 0.2, -4.56, { r: 0.02 });
    },
  };
  D.caldera_slag_pot = {
    build(B) {
      B.lathe('metal', K.ironDk, [[0, 1.1], [0.55, 1.1], [0.48, 0.6], [0.32, 0.0], [0, 0.0]], 0, 0, 0, { seg: 12 });
      B.cyl(NS('metal'), K.iron, 0.58, 0.1, 0, 0.95, 0, { seg: 12 });
    },
  };
  D.caldera_gauge_post = {
    build(B) {
      // Whitewashed blockhouse on horn tip with masonry trim, green door, and siren
      B.box('paint', K.white, 3.2, 1.6, 3.0, 0, 0.8, 0, { r: 0.04 });
      // Plinth trim and coping
      B.box('metal', K.ironDk, 3.26, 0.08, 3.06, 0, 0.04, 0);
      B.box('metal', K.iron, 3.3, 0.08, 3.1, 0, 1.6, 0);
      // Green door with iron frame
      B.box('metal', K.ironDk, 0.98, 1.18, 0.1, 0, 0.6, 1.52);
      B.box('metal', K.green, 0.9, 1.1, 0.08, 0, 0.6, 1.53);
      // Hand siren on roof
      B.cyl(NS('metal'), K.iron, 0.12, 0.35, 0.6, 1.75, 0.6, { seg: 8 });
      B.lathe(NS('metal'), K.iron, [[0, 0.22], [0.16, 0]], 0.6, 1.95, 0.6, { seg: 8 });
    },
  };

  // ------------------------------------------------------------------------------------------ Moulding Terrace Props
  D.caldera_pattern_doors = {
    build(B) {
      B.box('wood', K.wood, 3.8, 2.2, 0.12, 0, 1.1, 0, { r: 0.02 });
      // Weatherboard slats
      for (let k = 0; k < 6; k++) B.box(NS('wood'), '#785f44', 3.7, 0.04, 0.14, 0, 0.3 + k * 0.32, 0.01);
      // "THE TAP ROOM" sign
      B.box('paint', K.cream, 1.6, 0.35, 0.06, 0, 2.0, 0.08, { r: 0.01 });
    },
  };
  D.caldera_pattern_crates = {
    build(B) {
      B.box('wood', K.wood, 1.2, 0.85, 1.1, 0, 0.42, 0, { r: 0.02 });
      B.box(NS('metal'), K.ironLt, 1.22, 0.06, 1.12, 0, 0.8, 0);
    },
  };
  D.caldera_firebrick_store = {
    build(B) {
      B.box('paint', K.brick, 3.2, 3.4, 2.2, 0, 1.7, 0, { r: 0.04 });
      B.box('metal', K.green, 1.4, 2.2, 0.1, 0, 1.1, 1.12, { r: 0.02 });
    },
  };
  D.caldera_flask_stack = {
    build(B) {
      for (let i = 0; i < 3; i++) {
        B.box('metal', '#5c5248', 1.2, 0.45, 0.9, 0, i * 0.5 + 0.25, 0, { r: 0.03 });
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
  D.caldera_jib = {
    build(B) {
      B.push(0, 10.0, 0, Math.atan2(24 - 16, -60 + 56.5));
      B.box('metal', K.green, 0.7, 0.9, 9.0, 0, 0, 4.5, { r: 0.06 });
      B.box('metal', K.green, 0.6, 0.6, 3.0, 0, 0, -1.6, { r: 0.05 });
      B.box('paint', K.iron, 1.0, 1.2, 1.2, 0, -0.2, -3.0, { r: 0.05 });
      B.box(NS('metal'), K.iron, 0.06, 4.0, 0.06, 0, -2.4, 8.4);
      B.pop();
      B.box('paint', K.green, 1.6, 1.2, 1.6, 0, 12.6, 0, { r: 0.05 });
    },
  };
  D.caldera_weigh_office = {
    build(B) {
      // Small scale hut beside weighbridge
      B.box('paint', K.white, 2.4, 2.2, 2.0, 0, 1.1, 0, { r: 0.04 });
      B.box('paint', K.verd, 2.6, 0.2, 2.2, 0, 2.25, 0, { r: 0.03 });
      B.box(NS('paint'), K.green, 1.2, 0.9, 0.08, 0, 1.2, 1.03);   // window
    },
  };
  D.caldera_casting_stack = {
    build(B, o) {
      const kind = o.kind || 'manholes';
      if (kind === 'manholes') {
        for (let i = 0; i < 8; i++) {
          B.cyl('metal', K.iron, 0.45, 0.08, 0, i * 0.09 + 0.05, 0, { seg: 14 });
        }
      } else if (kind === 'bollards') {
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
          B.cyl('metal', K.ironDk, 0.2, 0.7, -0.4 + c * 0.4, 0.35, -0.2 + r * 0.4, { seg: 10 });
        }
      } else if (kind === 'pipes') {
        for (let i = 0; i < 5; i++) {
          B.cyl('metal', K.ironLt, 0.16, 2.2, -0.3 + i * 0.15, 0.2 + (i & 1) * 0.15, 0, { rx: HP, seg: 10 });
        }
      }
    },
  };
  D.caldera_charging_shed = {
    build(B) {
      // Lean-to shed with open front
      B.box('metal', K.greenDk, 4.0, 2.6, 2.5, 0, 1.3, 0, { r: 0.04 });
      B.box('metal', K.verd, 4.4, 0.15, 2.8, 0, 2.65, 0.1, { rx: -0.15, r: 0.03 });
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
    build(B) {
      B.cyl('paint', K.basalt, 0.32, 0.65, 0, 0.32, 0, { r2: 0.45, seg: 10 });
      B.sph(NS('paint'), '#3f5845', 0.38, 0, 0.75, 0, { ws: 8, hs: 6 });
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
  { type: 'caldera_socket_collar', pos: [0, 0, 0] },
  { type: 'caldera_organ_stump', pos: [0, 0, 0] },
  { type: 'caldera_hall_roof', pos: [0, 0, 0] },
  { type: 'caldera_cupola_hood', pos: [-3.2, 0, -64.3] },
  { type: 'caldera_surge_office', pos: [(OFFICE.x0 + OFFICE.x1) / 2, 0, (OFFICE.z0 + OFFICE.z1) / 2] },
  { type: 'caldera_jib', pos: [0, 0, 0] },
  { type: 'caldera_rim_head_dressing', pos: [0, 0, 0] },
  { type: 'caldera_yard_cover_dressing', pos: [0, 0, 0] },
  { type: 'caldera_horizon_dressing', pos: [0, 0, 0], mirror: false },

  // Flank & Slump
  { type: 'caldera_winch_house', pos: [-23.2, 1.2, -19.6], rotY: -139.5 * D_ },
  { type: 'caldera_hornito', pos: [-25.2, 0, -6.8] },
  { type: 'caldera_hornito', pos: [-24.8, 0, -11.2] },
  { type: 'caldera_hornito', pos: [-21.0, 0, -14.0] },
  { type: 'caldera_hornito', pos: [-26.5, 0, -4.5] },
  { type: 'caldera_cairn', pos: [17.5, 2.4, -10.5] },

  // Moorings & Lakefront
  { type: 'caldera_tide_board', pos: [-7.8, 1.2, -23.4] },
  { type: 'caldera_capstan', pos: [-14.4, 1.8, -29.8] },
  { type: 'caldera_chain_bollard', pos: [-17.2, 1.8, -28.6] },
  { type: 'caldera_mooring_bollard', pos: [-13.6, 1.8, -23.4] },
  { type: 'caldera_mooring_bollard', pos: [-4.0, 1.2, -23.2] },
  { type: 'caldera_ladle_car', pos: [2.5, 1.2, -26.0] },

  // Casting Floor (LOW)
  { type: 'caldera_pig_bed', pos: [10.5, 0, -17.5] },
  { type: 'caldera_pig_bed', pos: [8.0, 0, -13.5] },
  { type: 'caldera_floor_drain', pos: [13.0, 0, -15.0] },
  { type: 'caldera_mould_stack', pos: [12.0, 0, -18.4] },
  { type: 'caldera_mould_stack', pos: [14.5, 0, -15.5] },
  { type: 'caldera_ladle_stand', pos: [14.0, 0, -13.6] },

  // Spillway
  { type: 'caldera_spillway_bridge', pos: [22.75, 2.3, -25.26], rotY: -38 * D_ },
  { type: 'caldera_slag_pot', pos: [22.75, 2.3, -26.5] },
  { type: 'caldera_gauge_post', pos: [22.4, 1.2, -19.5] },

  // Moulding Terrace
  { type: 'caldera_pattern_doors', pos: [-20.5, 2.4, -36.5], rotY: 60 * D_ },
  { type: 'caldera_pattern_crates', pos: [-11.8, 3.0, -38.2] },
  { type: 'caldera_firebrick_store', pos: [-7.5, 2.4, -42.0] },
  { type: 'caldera_flask_stack', pos: [-13.5, 2.4, -37.5] },
  { type: 'caldera_firebrick_pallet', pos: [-9.5, 2.4, -40.0] },

  // Yard
  { type: 'caldera_weigh_office', pos: [PIT.x0 - 1.5, 3.6, (PIT.z0 + PIT.z1) / 2] },
  { type: 'caldera_charging_shed', pos: [10.0, 3.6, -60.0], rotY: -90 * D_ },
  { type: 'caldera_casting_stack', pos: [-8.0, 3.6, -58.0], kind: 'manholes' },
  { type: 'caldera_casting_stack', pos: [-22.0, 3.6, -52.0], kind: 'bollards' },
  { type: 'caldera_casting_stack', pos: [4.0, 3.6, -56.0], kind: 'pipes' },
  { type: 'caldera_firebrick_pallet', pos: [-18.0, 3.6, -56.0] },
  { type: 'caldera_pipe_manifold', pos: [-14.0, 3.6, -48.0] },
  { type: 'caldera_pipe_manifold', pos: [-10.0, 4.8, -66.5] },

  // Spawn Gallery Balustrade Urns
  { type: 'caldera_planter_urn', pos: [PAD[0] - 3.5, 4.8, HALL_LINE[0][1] + 1.8] },
  { type: 'caldera_planter_urn', pos: [PAD[0] + 3.5, 4.8, HALL_LINE[0][1] + 1.8] },
];
