// Highmark Foundry — architectural dressing and heavy industrial props (owner: caldera stage).
// Visual only (no colliders: layout.js holds all collision). Props within 8.5 cm of a face, nothing on walkable tops.
//
// DESIGN.md §5:
// - Casting Hall (Spawn): Red brick, riveted structural iron trusses, sawtooth glazed roofs, 28 m smelting chimneys,
//   large arched rose window with glowing furnace backlight, cast-iron pediment: HIGHMARK FOUNDRY CO. · EST. 1931.
// - Surge Office: Timber weatherboard harbourmaster office, overhanging corrugated roof, multi-pane windows with lit
//   interior (desk, brass banker's lamp, tidal charts, dials), panelled door, Tide Board on pier.
// - Surge Gauge & Gauge Post: 22 m riveted lattice tower, huge backlit dial face with flood sectors, copper float well,
//   counterweight cables, brass bell cage. Gauge Post basalt blockhouse.
// - Pour Floor & Ladle Gantry: 20-ton crucible ladle on heavy steel A-frame gantry, chains, hooks, ladle car on floor tracks,
//   cooling racks with glowing ingots, tongs rack, slag pots.
// - Casting Floor: Sand moulding beds, flask stacks, pivot jib crane with horizontal lattice boom, floor drains.
// - The Slump: Columnar basalt shelves, hollow spatter cones/hornitos with glowing lava cores, sulfur crusts, steam wisps.
// - Rim Head & Winch House: Corrugated iron winch shed, twin wire-rope winding drums, headframe sheaves, cables.
// - Organ Pipes: Hexagonal basalt columns bound with riveted iron bands, checkerplate steel climbing step links with
//   bright yellow grab handles clearly reading as climbable routes, bulkhead lamps.
// - Lighting & Clutter: Gooseneck lamps with warm glowing bulbs, pipe manifolds with brass valves, firebrick pallets.

import { HALL_LINE, PAD, PIT } from './geo.js';
import { OFFICE } from './layout.js';

export function registerArch(D, H) {
  const { THREE, PI, TAU, HP } = H;
  const NS = (m) => (H.noShadow ? H.noShadow(m) : m);
  const D_ = PI / 180;

  // Industrial Foundry Palette (DESIGN §5.3):
  const K = {
    brick: '#8b4530', brickDk: '#683222', brickMortar: '#c2b6a4',
    iron: '#2a2d32', ironDk: '#1a1c1e', ironLt: '#4f555e', ironRust: '#6e4538',
    green: '#2d5442', greenDk: '#1e382c', greenLt: '#42755e',
    wood: '#7c5f42', woodDk: '#58422e', woodLt: '#9c7b5a',
    cream: '#ede6d4', white: '#f3efe6',
    verd: '#5e9480', verdDk: '#426b5c',
    brass: '#c49a45', brassDk: '#8c6b28', copper: '#b86842',
    gold: '#e0ac32', red: '#c42822', orange: '#ff7818', lavaGlow: '#ff5a14',
    basalt: '#50545c', basaltDk: '#383b42', basaltLt: '#6e737c',
    scoria: '#5c3830', sulfur: '#d6b838', sand: '#ad9a82',
    glass: '#a8d2d8', glassLit: '#ffe8c2', lampGlow: '#ffca88',
  };

  // Cached template geometries for performance
  const TPL = new Map();
  const tpl = (key, fn) => { let g = TPL.get(key); if (!g) { g = fn(); TPL.set(key, g); } return g; };
  const boxG = () => tpl('b1', () => new THREE.BoxGeometry(1, 1, 1));
  const cylG = (r, h, seg = 12) => tpl(`c_${r}_${h}_${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg));
  const sphG = (r, ws = 8, hs = 6) => tpl(`s_${r}_${ws}_${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
  const torG = (R, r, rs = 6, ts = 16) => tpl(`t_${R}_${r}`, () => new THREE.TorusGeometry(R, r, rs, ts));

  // Geometry builder helper
  const pbox = (B, mat, col, w, h, d, x, y, z, o = {}) => {
    B.add(mat, boxG(), col, x, y, z, { ...o, sx: w, sy: h, sz: d });
  };
  const pcyl = (B, mat, col, r, h, x, y, z, o = {}) => {
    B.add(mat, cylG(r, h, o.seg || 12), col, x, y, z, o);
  };
  const psph = (B, mat, col, r, x, y, z, o = {}) => {
    B.add(mat, sphG(r), col, x, y, z, o);
  };
  const ptor = (B, mat, col, R, r, x, y, z, o = {}) => {
    B.add(mat, torG(R, r), col, x, y, z, o);
  };

  // Structural strut between two points
  const strut = (B, mat, col, a, b, t = 0.16, o = {}) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    if (L < 1e-4) return;
    const ry = Math.atan2(dx, dz), rx = -Math.asin(Math.max(-1, Math.min(1, dy / L)));
    B.add(mat, boxG(), col, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, { ...o, ry, rx, sx: o.w || t, sy: o.h || t, sz: L });
  };

  // Rivet line along an axis
  const rivets = (B, p0, p1, count, r = 0.024) => {
    for (let i = 0; i <= count; i++) {
      const u = i / count;
      const x = p0[0] + (p1[0] - p0[0]) * u;
      const y = p0[1] + (p1[1] - p0[1]) * u;
      const z = p0[2] + (p1[2] - p0[2]) * u;
      psph(B, NS('metal'), K.ironLt, r, x, y, z);
    }
  };

  // Industrial Flanged Pipe
  const flangedPipe = (B, x0, y0, z0, x1, y1, z1, r = 0.12, col = K.ironLt) => {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
    if (L < 1e-3) return;
    B.push((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(dx, dz), -Math.asin(dy / L));
    pcyl(B, 'metal', col, r, L, 0, 0, 0, { rx: HP, seg: 10 });
    // End flanges
    pcyl(B, NS('metal'), K.iron, r * 1.6, 0.05, 0, 0, -L / 2 + 0.03, { rx: HP, seg: 12 });
    pcyl(B, NS('metal'), K.iron, r * 1.6, 0.05, 0, 0, L / 2 - 0.03, { rx: HP, seg: 12 });
    B.pop();
  };

  // Industrial Gooseneck Lamp with lit warm bulb
  const industrialLamp = (B, x, y, z, rotY = 0) => {
    B.push(x, y, z, rotY);
    // Wall mount plate
    pbox(B, NS('metal'), K.iron, 0.24, 0.32, 0.05, 0, 0, 0.02);
    // Gooseneck curved arm
    strut(B, NS('metal'), K.iron, [0, 0, 0.04], [0, 0.45, 0.55], 0.04);
    strut(B, NS('metal'), K.iron, [0, 0.45, 0.55], [0, 0.38, 0.85], 0.04);
    // Conical shade
    B.push(0, 0.32, 0.85, 0);
    B.lathe('metal', K.green, [[0, 0.22], [0.08, 0.22], [0.32, 0.02], [0.35, 0.0], [0, 0.0]], 0, 0, 0, { seg: 12 });
    // Glowing warm bulb
    psph(B, 'glow', K.lampGlow, 0.09, 0, 0.08, 0);
    B.pop();
    B.pop();
  };

  // =========================================================================================================
  // 1. THE CASTING HALL (behind Alpha spawn, mirrored for Bravo)
  // Sawtooth roof, blast chimneys, rose window with glowing furnace backlight, cast-iron pediment
  // =========================================================================================================
  D.caldera_hall_roof = {
    desc: 'The great Casting Hall: brick facade, structural iron trusses, chimneys, rose window, sawtooth roof',
    build(B) {
      const [[xe, z0], [xw]] = HALL_LINE;
      const mx = (xe + xw) / 2, w = xe - xw + 0.8, d = 18.0, h = 12.0;
      const bZ = z0 - d / 2 - 0.1;

      // Heavy brick facade courses along front wall (z = z0 - 0.1)
      pbox(B, 'paint', K.brick, w, h, 0.45, mx, h / 2, z0 - 0.2);
      // Dark plinth foundation
      pbox(B, 'paint', K.brickDk, w + 0.2, 1.4, 0.6, mx, 0.7, z0 - 0.22);
      // Cornice band at roof line
      pbox(B, 'paint', K.brickDk, w + 0.3, 0.5, 0.65, mx, h - 0.25, z0 - 0.22);

      // Structural iron vertical pilasters every 4.5 m
      const nP = Math.floor(w / 4.5);
      for (let i = 0; i <= nP; i++) {
        const px = xw + (w * i) / nP;
        pbox(B, 'metal', K.iron, 0.38, h, 0.52, px, h / 2, z0 - 0.2);
        // Base plate and capital
        pbox(B, NS('metal'), K.ironDk, 0.5, 0.35, 0.6, px, 0.18, z0 - 0.2);
        pbox(B, NS('metal'), K.ironDk, 0.5, 0.35, 0.6, px, h - 0.18, z0 - 0.2);
        // Rivet rows
        rivets(B, [px - 0.14, 0.6, z0 + 0.07], [px - 0.14, h - 0.6, z0 + 0.07], 18);
        rivets(B, [px + 0.14, 0.6, z0 + 0.07], [px + 0.14, h - 0.6, z0 + 0.07], 18);
      }

      // Large central arched Rose Window with radiant tracery and glowing orange furnace backlight
      const rwX = mx, rwY = 7.2, rwR = 2.4;
      pbox(B, 'glow', K.orange, rwR * 2, rwR * 2, 0.12, rwX, rwY, z0 - 0.25, { glow: 2.2 });
      // Iron circular frame and radial spokes
      ptor(B, 'metal', K.ironDk, rwR, 0.12, rwX, rwY, z0 - 0.12);
      ptor(B, NS('metal'), K.iron, rwR * 0.5, 0.08, rwX, rwY, z0 - 0.12);
      for (let k = 0; k < 12; k++) {
        const a = k * (PI / 6);
        strut(B, NS('metal'), K.iron, [rwX, rwY, z0 - 0.12], [rwX + Math.cos(a) * rwR, rwY + Math.sin(a) * rwR, z0 - 0.12], 0.07);
      }

      // Gable Pediment across the center roofline (rises to 16.5 m)
      const pedW = 16.0, pedH = 4.2;
      B.push(mx, h + pedH / 2, z0 - 0.2);
      pbox(B, 'paint', K.brick, pedW, pedH, 0.45, 0, 0, 0);
      // Verdigris raking cornice
      strut(B, 'paint', K.verd, [-pedW / 2 - 0.2, -pedH / 2, 0.1], [0, pedH / 2 + 0.2, 0.1], 0.35);
      strut(B, 'paint', K.verd, [0, pedH / 2 + 0.2, 0.1], [pedW / 2 + 0.2, -pedH / 2, 0.1], 0.35);
      // Highmark Foundry Cast-iron Lettering on pediment face
      pbox(B, 'metal', K.ironDk, pedW - 2.0, 1.4, 0.15, 0, 0.2, 0.25);
      pbox(B, NS('paint'), K.cream, pedW - 2.4, 0.08, 0.18, 0, 0.7, 0.26);
      pbox(B, NS('paint'), K.cream, pedW - 2.4, 0.08, 0.18, 0, -0.3, 0.26);
      B.pop();

      // Sawtooth factory roof bays behind the pediment (4 bays extending in -Z)
      const nBays = 4, bayD = (d - 1.0) / nBays;
      for (let b = 0; b < nBays; b++) {
        const zMid = z0 - 0.5 - (b + 0.5) * bayD;
        const zFront = z0 - 0.5 - b * bayD;
        // North-facing vertical glazed skylight
        pbox(B, 'paint', '#2e4854', w - 1.0, 2.2, 0.15, mx, h + 1.1, zFront - 0.1);
        pbox(B, 'glow', K.glassLit, w - 1.4, 1.8, 0.08, mx, h + 1.1, zFront - 0.04, { glow: 1.4 });
        // Mullions
        for (let x = xw + 1.5; x <= xe - 1.5; x += 1.8) {
          pbox(B, NS('metal'), K.iron, 0.08, 2.0, 0.18, x, h + 1.1, zFront - 0.02);
        }
        // Sloped verdigris corrugated roof plane
        B.push(mx, h + 1.1, zMid, 0, 0);
        pbox(B, 'paint', K.verd, w - 0.4, 0.2, bayD * 1.05, 0, 0, 0, { rx: -0.42 });
        B.pop();
      }

      // Twin 28 m Smelting Blast Chimneys (at x = mx - 9.5 and mx + 9.5)
      for (const cx of [mx - 9.5, mx + 9.5]) {
        const cz = z0 - 6.0, chH = 20.0, chY = h + chH / 2;
        // Tapered brick shaft
        pcyl(B, 'paint', K.brickDk, 1.4, chH, cx, chY, cz, { seg: 16 });
        // Heavy riveted iron reinforcement rings every 2.5 m
        for (let rY = h + 1.5; rY < h + chH; rY += 2.5) {
          ptor(B, NS('metal'), K.iron, 1.42, 0.06, cx, rY, cz);
        }
        // Corbelled crown and spark arrestor cap
        pcyl(B, 'metal', K.ironDk, 1.65, 0.6, cx, h + chH + 0.3, cz, { seg: 16 });
        pcyl(B, NS('metal'), K.iron, 0.9, 0.8, cx, h + chH + 0.8, cz, { seg: 12 });
        // Ladder rungs on chimney face
        for (let lY = h + 1.0; lY < h + chH - 0.5; lY += 0.6) {
          pbox(B, NS('metal'), K.ironLt, 0.45, 0.04, 0.04, cx, lY, cz + 1.46);
        }
      }

      // Heavy Sliding Bay Doors at ground level (left and right of center)
      for (const dx of [mx - 6.5, mx + 6.5]) {
        // Door opening surround
        pbox(B, 'metal', K.iron, 3.6, 4.2, 0.55, dx, 2.1, z0 - 0.18);
        // Slotted iron bay door with hazard stripes
        pbox(B, 'metal', K.ironDk, 3.2, 3.8, 0.14, dx, 1.95, z0 - 0.1);
        pbox(B, NS('paint'), K.gold, 3.2, 0.25, 0.16, dx, 1.0, z0 - 0.08);
        pbox(B, NS('paint'), K.gold, 3.2, 0.25, 0.16, dx, 2.6, z0 - 0.08);
        // Top roller track
        pbox(B, NS('metal'), K.ironLt, 4.0, 0.18, 0.22, dx, 3.95, z0 - 0.06);
      }

      // Overhead Jib Crane Runway protruding 4 m over the yard
      pbox(B, 'metal', K.greenDk, 0.4, 0.6, 5.2, mx, 9.8, z0 + 1.8);
      // Crane trolley and forged hook
      pbox(B, 'metal', K.iron, 0.6, 0.45, 0.8, mx, 9.4, z0 + 2.8);
      pcyl(B, NS('metal'), K.ironLt, 0.03, 1.8, mx, 8.4, z0 + 2.8);
      ptor(B, 'metal', K.ironDk, 0.22, 0.06, mx, 7.4, z0 + 2.8, { rx: HP });

      // Wall Gooseneck Lamps along the hall facade
      for (const lx of [xw + 3.0, mx - 4.5, mx + 4.5, xe - 3.0]) {
        industrialLamp(B, lx, 5.2, z0 + 0.05, 0);
      }
    },
  };

  // =========================================================================================================
  // 2. THE SURGE OFFICE (at Moorings / Lakefront)
  // Timber weatherboard harbourmaster office, multi-pane windows with lit interior, desk, lamp, charts, dials, Tide Board
  // =========================================================================================================
  D.caldera_surge_office = {
    desc: 'The Surge Office: weatherboard harbourmaster building, multi-pane illuminated windows, interior desk/lamp/charts, Tide Board',
    build(B) {
      const w = OFFICE.x1 - OFFICE.x0; // ~5.0 m
      const d = OFFICE.z1 - OFFICE.z0; // ~5.0 m
      const cx = 0, cz = 0; // Local origin
      const y0 = 3.6, h = 5.8;

      // Stone plinth foundation
      pbox(B, 'paint', K.basaltDk, w + 0.15, 0.6, d + 0.15, cx, y0 + 0.3, cz);

      // Weatherboard timber body
      pbox(B, 'paint', K.cream, w, h - 0.6, d, cx, y0 + 0.6 + (h - 0.6) / 2, cz);

      // Crisp dark green corner trims and baseboard
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, NS('paint'), K.greenDk, 0.22, h, 0.22, cx + sx * (w / 2 - 0.08), y0 + h / 2, cz + sz * (d / 2 - 0.08));
      }
      pbox(B, NS('paint'), K.greenDk, w + 0.06, 0.2, d + 0.06, cx, y0 + 0.7, cz);
      pbox(B, NS('paint'), K.greenDk, w + 0.06, 0.22, d + 0.06, cx, y0 + h - 0.1, cz);

      // Multi-pane sash windows on lakefront face (+Z) and causeway face (+X)
      // Lakefront Windows (+Z face, cz + d / 2)
      for (const wx of [-1.3, 1.3]) {
        const wy = y0 + 2.5;
        // Window casing frame
        pbox(B, 'paint', K.greenDk, 1.4, 1.8, 0.14, cx + wx, wy, cz + d / 2 + 0.04);
        pbox(B, 'paint', K.white, 1.2, 1.6, 0.08, cx + wx, wy, cz + d / 2 + 0.07);
        // Illuminated interior glass
        pbox(B, 'glow', K.glassLit, 1.1, 1.5, 0.05, cx + wx, wy, cz + d / 2 + 0.08, { glow: 1.6 });
        // Timber glazing bars
        pbox(B, NS('paint'), K.greenDk, 1.1, 0.04, 0.09, cx + wx, wy, cz + d / 2 + 0.09);
        pbox(B, NS('paint'), K.greenDk, 0.04, 1.5, 0.09, cx + wx, wy, cz + d / 2 + 0.09);
        // Window sill
        pbox(B, NS('paint'), K.greenDk, 1.5, 0.1, 0.22, cx + wx, wy - 0.85, cz + d / 2 + 0.1);
      }

      // Causeway Window (+X face, cx + w / 2)
      {
        const wy = y0 + 2.5;
        pbox(B, 'paint', K.greenDk, 0.14, 1.8, 1.4, cx + w / 2 + 0.04, wy, cz);
        pbox(B, 'glow', K.glassLit, 0.05, 1.5, 1.1, cx + w / 2 + 0.08, wy, cz, { glow: 1.6 });
        pbox(B, NS('paint'), K.greenDk, 0.09, 0.04, 1.1, cx + w / 2 + 0.09, wy, cz);
        pbox(B, NS('paint'), K.greenDk, 0.09, 1.5, 0.04, cx + w / 2 + 0.09, wy, cz);
      }

      // Visible lit interior details through windows:
      // Mahogany Desk
      pbox(B, 'wood', K.woodDk, 1.8, 0.85, 0.9, cx, y0 + 0.95, cz + d / 2 - 0.8);
      // Brass Banker's Lamp
      pbox(B, 'metal', K.brass, 0.18, 0.35, 0.18, cx - 0.5, y0 + 1.55, cz + d / 2 - 0.8);
      pbox(B, 'glow', '#42e88a', 0.22, 0.1, 0.12, cx - 0.5, y0 + 1.72, cz + d / 2 - 0.8, { glow: 2.0 });
      // Maritime charts and tide diagrams on back wall
      pbox(B, NS('paint'), K.white, 1.8, 1.2, 0.05, cx, y0 + 3.0, cz - d / 2 + 0.1);
      pbox(B, NS('paint'), K.brassDk, 0.4, 0.4, 0.08, cx + 1.2, y0 + 3.2, cz - d / 2 + 0.12); // Tide dial

      // Panelled Entrance Door on East (+X) face
      {
        const dy = y0 + 1.8, dz = cz + 1.3;
        // Door surround
        pbox(B, 'paint', K.greenDk, 0.16, 2.4, 1.2, cx + w / 2 + 0.04, dy, dz);
        // Panelled door body
        pbox(B, 'wood', K.woodDk, 0.08, 2.2, 1.0, cx + w / 2 + 0.07, dy - 0.1, dz);
        // Brass handle & kickplate
        pbox(B, NS('metal'), K.brass, 0.08, 0.08, 0.06, cx + w / 2 + 0.12, dy - 0.1, dz + 0.35);
        pbox(B, NS('metal'), K.brass, 0.04, 0.25, 0.9, cx + w / 2 + 0.09, y0 + 0.72, dz);
        // Transom window with SURGE CONTROLLER lettering
        pbox(B, 'glow', K.glassLit, 0.05, 0.4, 0.9, cx + w / 2 + 0.07, dy + 1.05, dz, { glow: 1.2 });
        // Gooseneck porch lamp
        industrialLamp(B, cx + w / 2 + 0.08, dy + 1.5, dz, HP);
      }

      // Overhanging Corrugated Iron Hipped Roof
      {
        const rH = 1.8, rW = w + 0.8, rD = d + 0.8;
        B.push(cx, y0 + h, cz, 0, 0);
        // Roof eaves fascia
        pbox(B, 'paint', K.greenDk, rW, 0.2, rD, 0, 0.1, 0);
        // Hipped roof pyramid
        B.lathe('paint', K.verdDk, [[0, rH], [0.08, rH], [rW * 0.72, 0], [0, 0]], 0, 0.2, 0, { seg: 4, ry: PI / 4 });
        // Copper weather vane on peak
        pcyl(B, NS('metal'), K.copper, 0.04, 0.8, 0, rH + 0.5, 0);
        strut(B, NS('metal'), K.copper, [-0.35, rH + 0.7, 0], [0.35, rH + 0.7, 0], 0.03);
        strut(B, NS('metal'), K.copper, [0, rH + 0.7, -0.35], [0, rH + 0.7, 0.35], 0.03);
        // Zinc stove chimney flue
        pcyl(B, 'metal', K.ironLt, 0.15, 1.4, 1.2, rH * 0.5 + 0.5, -1.0, { seg: 8 });
        pcyl(B, NS('metal'), K.ironDk, 0.25, 0.2, 1.2, rH * 0.5 + 1.2, -1.0, { seg: 8 });
        B.pop();
      }
    },
  };

  // =========================================================================================================
  // 3. THE SURGE GAUGE (Island center) & GAUGE POST (SE Horn)
  // 22 m riveted lattice tower, huge backlit clock/gauge dial with warning sectors, copper float-well
  // =========================================================================================================
  D.caldera_surge_gauge = {
    desc: 'The Great Surge Gauge: 22 m riveted lattice tower, copper float-well, huge backlit dial with flood sectors, brass bell cage',
    build(B) {
      const topH = 22.0, baseH = 1.2;

      // 4 Massive Hexagonal Foundation Pier Collars on the island
      const pierR = 2.4;
      for (let k = 0; k < 4; k++) {
        const a = k * HP + PI / 4;
        const px = Math.cos(a) * pierR, pz = Math.sin(a) * pierR;
        pcyl(B, 'metal', K.ironDk, 0.55, 1.6, px, baseH + 0.8, pz, { seg: 8 });
        ptor(B, NS('metal'), K.ironLt, 0.58, 0.06, px, baseH + 0.4, pz);
        ptor(B, NS('metal'), K.ironLt, 0.58, 0.06, px, baseH + 1.2, pz);
      }

      // Central Polished Copper Float-Well Cylinder (rising to 13.5 m)
      pcyl(B, 'metal', K.copper, 1.1, 12.5, 0, baseH + 6.25, 0, { seg: 16 });
      for (let y = baseH + 2.0; y < baseH + 12.0; y += 2.0) {
        ptor(B, NS('metal'), K.brass, 1.14, 0.05, 0, y, 0);
      }

      // Riveted Lattice Tower: 4 Corner Main Chords tapering inward
      const bRad = pierR, tRad = 1.2;
      for (let k = 0; k < 4; k++) {
        const a = k * HP + PI / 4;
        const x0 = Math.cos(a) * bRad, z0 = Math.sin(a) * bRad;
        const x1 = Math.cos(a) * tRad, z1 = Math.sin(a) * tRad;
        strut(B, 'metal', K.greenDk, [x0, baseH + 1.6, z0], [x1, topH, z1], 0.22);
      }

      // Horizontal Ring Girders & Diagonal X-Bracing
      const rings = [baseH + 3.5, baseH + 6.5, baseH + 9.5, 13.0, 16.5, 19.5];
      for (let ri = 0; ri < rings.length; ri++) {
        const y = rings[ri];
        const u = (y - (baseH + 1.6)) / (topH - (baseH + 1.6));
        const curR = bRad + (tRad - bRad) * u;
        for (let k = 0; k < 4; k++) {
          const a0 = k * HP + PI / 4, a1 = (k + 1) * HP + PI / 4;
          const p0 = [Math.cos(a0) * curR, y, Math.sin(a0) * curR];
          const p1 = [Math.cos(a1) * curR, y, Math.sin(a1) * curR];
          strut(B, 'metal', K.green, p0, p1, 0.16);
          // Diagonal X-braces between tiers
          if (ri > 0) {
            const yPrev = rings[ri - 1];
            const uPrev = (yPrev - (baseH + 1.6)) / (topH - (baseH + 1.6));
            const prevR = bRad + (tRad - bRad) * uPrev;
            const q0 = [Math.cos(a0) * prevR, yPrev, Math.sin(a0) * prevR];
            const q1 = [Math.cos(a1) * prevR, yPrev, Math.sin(a1) * prevR];
            strut(B, NS('metal'), K.greenDk, p0, q1, 0.08);
            strut(B, NS('metal'), K.greenDk, p1, q0, 0.08);
          }
        }
      }

      // Massive 4.2 m Circular Backlit Tidal Dial (facing ±Z)
      const dialY = 14.8, dialR = 2.1;
      for (const s of [-1, 1]) {
        B.push(0, dialY, s * 1.35, s < 0 ? PI : 0);
        // Bezel & Housing
        ptor(B, 'metal', K.brass, dialR, 0.14, 0, 0, 0.06);
        pcyl(B, 'metal', K.ironDk, dialR + 0.1, 0.4, 0, 0, -0.15, { rx: HP, seg: 24 });
        // Backlit enamelled dial face
        pcyl(B, 'glow', K.glassLit, dialR - 0.05, 0.06, 0, 0, 0.03, { rx: HP, seg: 24, glow: 1.8 });
        // Calibrated Flood Sectors: Green (bottom), Amber (mid), Red (high surge)
        pbox(B, NS('paint'), '#348b48', dialR * 1.2, 0.12, 0.08, 0, -dialR * 0.6, 0.06);
        pbox(B, NS('paint'), '#e8a024', dialR * 1.2, 0.12, 0.08, 0, dialR * 0.2, 0.06);
        pbox(B, NS('paint'), K.red, dialR * 1.2, 0.12, 0.08, 0, dialR * 0.65, 0.06);
        // Counterbalanced Clock Hands
        strut(B, NS('metal'), K.ironDk, [0, 0, 0.08], [0, dialR * 0.75, 0.08], 0.07);
        strut(B, NS('metal'), K.red, [0, 0, 0.09], [dialR * 0.65, dialR * 0.2, 0.09], 0.05);
        psph(B, NS('metal'), K.brass, 0.16, 0, 0, 0.1);
        B.pop();
      }

      // Bell Cage at the Tower Summit (y = 20.0 to 22.5 m)
      pcyl(B, 'metal', K.ironDk, tRad + 0.2, 0.35, 0, 20.0, 0, { seg: 12 });
      for (let k = 0; k < 6; k++) {
        const a = k * (PI / 3);
        pcyl(B, NS('metal'), K.green, 0.06, 2.2, Math.cos(a) * (tRad - 0.15), 21.1, Math.sin(a) * (tRad - 0.15));
      }
      // Bronze Warning Bell with clapper
      pcyl(B, 'metal', K.brass, 0.65, 0.9, 0, 21.0, 0, { seg: 14 });
      psph(B, 'metal', K.brass, 0.65, 0, 21.4, 0);
      pcyl(B, NS('metal'), K.ironDk, 0.08, 1.2, 0, 20.6, 0);

      // Warning Beacon Lantern on apex (blinks red at dusk)
      pcyl(B, 'metal', K.iron, 0.35, 0.3, 0, 22.3, 0);
      pcyl(B, 'glow', K.red, 0.25, 0.5, 0, 22.7, 0, { glow: 2.8 });
    },
  };

  // =========================================================================================================
  // 4. THE POUR FLOOR & LADLE GANTRY (Center arena)
  // 20-ton tilting crucible ladle on heavy steel A-frame gantry, chains, hooks, ladle car on floor tracks, ingot cooling racks
  // =========================================================================================================
  D.caldera_ladle_stand = {
    desc: 'Heavy 20-ton Ladle Gantry: steel A-frames, tilting crucible ladle, lifting chains, cooling racks with glowing ingots',
    build(B) {
      // Twin Steel A-Frames spanning 3.6 m
      for (const sz of [-1.6, 1.6]) {
        strut(B, 'metal', K.greenDk, [-1.2, 0, sz], [0, 4.6, sz], 0.24);
        strut(B, 'metal', K.greenDk, [1.2, 0, sz], [0, 4.6, sz], 0.24);
        // Horizontal cross-tie
        strut(B, NS('metal'), K.green, [-0.75, 2.0, sz], [0.75, 2.0, sz], 0.18);
        // Foundation anchor plates
        pbox(B, NS('metal'), K.iron, 0.55, 0.2, 0.55, -1.2, 0.1, sz);
        pbox(B, NS('metal'), K.iron, 0.55, 0.2, 0.55, 1.2, 0.1, sz);
      }
      // Heavy Cross-beam at crown
      pbox(B, 'metal', K.greenDk, 0.6, 0.5, 3.8, 0, 4.6, 0);

      // 20-Ton Tilting Crucible Ladle suspended at center
      B.push(0, 2.6, 0, 0, 0.12); // Slightly tilted as if pouring
      // Tapered Ladle Body
      B.lathe('metal', K.iron, [[0, 0], [0.95, 0], [1.15, 2.1], [1.2, 2.2], [1.0, 2.2], [0.85, 0.2], [0, 0.2]], 0, -1.1, 0, { seg: 16 });
      // Trunnion ring and side pivot pins
      ptor(B, NS('metal'), K.ironLt, 1.18, 0.08, 0, 0, 0);
      pcyl(B, 'metal', K.ironLt, 0.16, 2.8, 0, 0, 0, { rx: HP, seg: 10 });
      // Pouring spout with incandescent molten core
      pbox(B, 'metal', K.ironDk, 0.65, 0.45, 0.85, 0, 0.95, 1.1, { rx: 0.3 });
      pbox(B, 'glow', K.lavaGlow, 0.45, 0.25, 0.65, 0, 1.0, 1.15, { rx: 0.3, glow: 2.2 });
      // Heavy forged lifting bail
      strut(B, NS('metal'), K.ironDk, [0, 0, -1.35], [0, 1.8, 0], 0.15);
      strut(B, NS('metal'), K.ironDk, [0, 0, 1.35], [0, 1.8, 0], 0.15);
      // Crane Hook and double-leg chain
      ptor(B, 'metal', K.ironDk, 0.28, 0.08, 0, 2.0, 0, { rx: HP });
      pcyl(B, NS('metal'), K.ironLt, 0.04, 1.2, 0, 3.2, 0);
      B.pop();

      // Steel Ingot Cooling Racks beside gantry
      B.push(2.2, 0, 0, HP);
      pbox(B, 'metal', K.greenDk, 2.8, 0.12, 1.2, 0, 0.45, 0);
      pbox(B, 'metal', K.greenDk, 2.8, 0.12, 1.2, 0, 0.95, 0);
      for (const lx of [-1.3, 1.3]) for (const lz of [-0.5, 0.5]) {
        pcyl(B, NS('metal'), K.iron, 0.06, 1.0, lx, 0.5, lz);
      }
      // Stacked Cooling Pig-iron Ingots (radiating dull red heat glow in crevices)
      for (let tier = 0; tier < 2; tier++) {
        const ty = 0.55 + tier * 0.5;
        for (let i = -1.1; i <= 1.1; i += 0.32) {
          pbox(B, 'metal', '#383532', 0.24, 0.18, 1.0, i, ty, 0, { r: 0.02 });
          pbox(B, 'glow', '#8c2410', 0.18, 0.06, 0.85, i, ty - 0.04, 0, { glow: 1.2 });
        }
      }
      B.pop();
    },
  };

  // Ladle Bogie Car on floor tracks
  D.caldera_ladle_car = {
    desc: 'Heavy Ladle Bogie Transfer Car on steel rails',
    build(B) {
      // 4 flanged steel wheels on two axles
      for (const wx of [-0.9, 0.9]) {
        pcyl(B, 'metal', K.ironLt, 0.06, 1.6, wx, 0.32, 0, { rx: HP, seg: 8 });
        for (const wz of [-0.85, 0.85]) {
          pcyl(B, 'metal', K.iron, 0.32, 0.09, wx, 0.32, wz, { rx: HP, seg: 14 });
          pcyl(B, NS('metal'), K.ironDk, 0.38, 0.03, wx, 0.32, wz + (wz > 0 ? 0.04 : -0.04), { rx: HP, seg: 14 });
        }
      }
      // Fabricated steel chassis
      pbox(B, 'metal', K.greenDk, 2.4, 0.28, 1.8, 0, 0.48, 0);
      pbox(B, NS('paint'), K.gold, 2.4, 0.08, 0.1, 0, 0.48, 0.92);
      pbox(B, NS('paint'), K.gold, 2.4, 0.08, 0.1, 0, 0.48, -0.92);
      // Ladle cradle trunnion brackets
      for (const cx of [-0.8, 0.8]) {
        pbox(B, 'metal', K.iron, 0.35, 0.65, 0.35, cx, 0.9, -0.75);
        pbox(B, 'metal', K.iron, 0.35, 0.65, 0.35, cx, 0.9, 0.75);
      }
      // Hand brake wheel
      ptor(B, NS('metal'), K.red, 0.22, 0.03, 1.22, 0.95, 0.65, { rx: HP });
    },
  };

  // =========================================================================================================
  // 5. THE CASTING FLOOR & PIG BEDS (LOW, y = 0)
  // Sand moulding beds, flask stacks, pivot jib crane with boom and hook, floor drainage grates
  // =========================================================================================================
  D.caldera_pig_bed = {
    desc: 'Sand moulding bed with rows of cast pig-iron channels and glowing molten iron lines',
    build(B) {
      // Timber surround frame
      pbox(B, 'wood', K.woodDk, 4.2, 0.25, 2.6, 0, 0.12, 0);
      // Moulding sand fill
      pbox(B, 'paint', K.sand, 4.0, 0.2, 2.4, 0, 0.1, 0);
      // Main central feeder runner (molten iron glow)
      pbox(B, 'glow', K.orange, 3.6, 0.04, 0.14, 0, 0.22, 0, { glow: 1.8 });
      // Branch piglet moulds extending to sides
      for (let x = -1.6; x <= 1.6; x += 0.35) {
        for (const sz of [-0.65, 0.65]) {
          pbox(B, 'metal', '#35322e', 0.16, 0.1, 0.95, x, 0.18, sz, { r: 0.02 });
          pbox(B, 'glow', K.lavaGlow, 0.1, 0.03, 0.85, x, 0.23, sz, { glow: 1.4 });
        }
      }
    },
  };

  D.caldera_flask_stack = {
    desc: 'Stack of foundry moulding flasks with alignment pins and clamping lugs',
    build(B) {
      for (let tier = 0; tier < 3; tier++) {
        const fy = tier * 0.45;
        // Cast iron rectangular flask frame (open center)
        pbox(B, 'metal', K.iron, 1.8, 0.4, 0.12, 0, fy + 0.2, -0.65);
        pbox(B, 'metal', K.iron, 1.8, 0.4, 0.12, 0, fy + 0.2, 0.65);
        pbox(B, 'metal', K.iron, 0.12, 0.4, 1.4, -0.85, fy + 0.2, 0);
        pbox(B, 'metal', K.iron, 0.12, 0.4, 1.4, 0.85, fy + 0.2, 0);
        // Sand fill
        pbox(B, 'paint', K.sand, 1.6, 0.36, 1.2, 0, fy + 0.18, 0);
        // Alignment pins and lugs
        for (const px of [-0.9, 0.9]) {
          pcyl(B, NS('metal'), K.ironLt, 0.04, 0.25, px, fy + 0.4, 0);
        }
      }
    },
  };

  D.caldera_jib = {
    desc: 'Heavy Industrial Pivot Jib Crane with horizontal lattice boom, hoist trolley and hook',
    build(B) {
      const mastH = 7.5, boomL = 9.0;
      // Tubular Steel Mast with heavy base swivel bearing
      pcyl(B, 'metal', K.greenDk, 0.45, mastH, 0, mastH / 2, 0, { seg: 14 });
      pcyl(B, NS('metal'), K.ironDk, 0.65, 0.4, 0, 0.2, 0, { seg: 16 });
      // Horizontal Lattice Boom
      B.push(0, mastH - 0.6, 0, 0.35); // Slewed angle
      pbox(B, 'metal', K.green, 0.55, 0.7, boomL, 0, 0, boomL / 2, { r: 0.04 });
      // Counterweight arm extending backward
      pbox(B, 'metal', K.green, 0.55, 0.7, 3.2, 0, 0, -1.6);
      pbox(B, 'metal', K.ironDk, 1.2, 1.4, 1.4, 0, -0.2, -2.5);
      // Top Tie-Rod Bracing
      strut(B, NS('metal'), K.ironLt, [0, 1.2, 0], [0, 0.35, boomL * 0.7], 0.06);
      strut(B, NS('metal'), K.ironLt, [0, 1.2, 0], [0, 0.35, -2.4], 0.06);
      // Rolling Hoist Trolley
      const trZ = boomL * 0.75;
      pbox(B, 'metal', K.iron, 0.7, 0.35, 0.6, 0, -0.45, trZ);
      pcyl(B, NS('metal'), K.ironLt, 0.03, 3.5, 0, -2.2, trZ);
      // Heavy Forged Crane Hook
      ptor(B, 'metal', K.ironDk, 0.26, 0.07, 0, -4.0, trZ, { rx: HP });
      B.pop();
    },
  };

  D.caldera_floor_drain = {
    desc: 'Heavy Cast-iron floor drainage grate with steam vents',
    build(B) {
      // Grate frame embedded in floor
      pbox(B, 'metal', K.ironDk, 2.2, 0.08, 1.4, 0, 0.04, 0);
      // Slotted iron grating
      for (let x = -0.95; x <= 0.95; x += 0.15) {
        pbox(B, NS('metal'), K.iron, 0.06, 0.09, 1.2, x, 0.05, 0);
      }
    },
  };

  // =========================================================================================================
  // 6. THE SLUMP & VOLCANIC HORNITOS (Shelves & cooling vents)
  // Basalt steps, hollow volcanic spatter cones/hornitos with glowing lava cores, sulfur crusts, steam
  // =========================================================================================================
  D.caldera_hornito = {
    desc: 'Volcanic Spatter Cone / Hornito: welded agglutinate chimney, incandescent lava core, sulfur crust',
    build(B) {
      const h = 2.4;
      // Irregular conical spatter chimney
      B.lathe('paint', K.scoria, [
        [0, 0], [1.3, 0], [1.15, 0.6], [0.95, 1.4], [0.75, 2.0], [0.65, h],
        [0.45, h], [0.4, 1.8], [0.35, 0.4], [0, 0.2]
      ], 0, 0, 0, { seg: 14 });
      // Sulfur mineral crust around vent lip (pale gold/yellow)
      ptor(B, NS('paint'), K.sulfur, 0.55, 0.12, 0, h - 0.04, 0);
      // Incandescent Molten Lava Vent Core (deep orange-red glow from within)
      psph(B, 'glow', K.orange, 0.42, 0, 0.9, 0, { glow: 2.6 });
      // Fissure cooling grates bolted to the rock base
      pbox(B, NS('metal'), K.ironDk, 1.4, 0.06, 0.6, 0.8, 0.04, 0.6);
      pbox(B, NS('metal'), K.ironDk, 0.6, 0.06, 1.4, -0.6, 0.04, -0.8);
    },
  };

  // =========================================================================================================
  // 7. THE RIM HEAD & WINCH HOUSE (South Slump head)
  // Corrugated iron machinery shed, double doors, windows, twin wire-rope winding drums, headframe sheaves
  // =========================================================================================================
  D.caldera_winch_house = {
    desc: 'The Rim Head Winch House: machinery shed, twin winding drums, spooled wire cables, headframe sheaves',
    build(B) {
      const w = 2.8, d = 3.2, h = 3.2;

      // Dressed basalt masonry foundation trim
      pbox(B, 'paint', K.basaltDk, w + 0.08, 0.3, d + 0.08, 0, 0.15, 0);

      // Dark green structural angle corner trims
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, NS('metal'), K.greenDk, 0.14, h, 0.14, sx * (w / 2 - 0.05), h / 2, sz * (d / 2 - 0.05));
      }

      // Pitched Corrugated Iron Roof with ridge ventilator
      B.push(0, h, 0);
      pbox(B, 'metal', K.verd, w + 0.5, 0.15, d + 0.4, 0, 0.4, 0, { rx: -0.28 });
      pcyl(B, NS('metal'), K.iron, 0.2, 0.8, 0, 0.9, 0, { seg: 8 });
      B.pop();

      // Double Corrugated Sliding Equipment Doors on front (+Z face)
      pbox(B, 'metal', K.greenDk, 2.0, 2.4, 0.12, 0, 1.4, d / 2 + 0.06);
      pbox(B, NS('metal'), K.ironLt, 2.4, 0.12, 0.16, 0, 2.65, d / 2 + 0.1); // Top roller track

      // Multi-pane factory window on side (+X face)
      pbox(B, 'paint', K.greenDk, 0.1, 1.4, 1.4, w / 2 + 0.04, 1.8, 0);
      pbox(B, 'glow', K.glassLit, 0.05, 1.2, 1.2, w / 2 + 0.08, 1.8, 0, { glow: 1.4 });

      // Heavy Electric Winding Hoist Drums (in front of machinery shed)
      B.push(0, 0.7, d / 2 + 1.2);
      pbox(B, 'metal', K.ironDk, 2.2, 0.4, 1.4, 0, 0.2, 0); // Bedplate
      // Twin grooved cable drums spooled with multi-strand steel wire rope
      for (const dx of [-0.6, 0.6]) {
        pcyl(B, 'metal', K.iron, 0.55, 0.65, dx, 0.7, 0, { rx: HP, seg: 16 });
        ptor(B, NS('metal'), K.ironLt, 0.58, 0.05, dx, 0.7, -0.3);
        ptor(B, NS('metal'), K.ironLt, 0.58, 0.05, dx, 0.7, 0.3);
        // Brake calipers
        ptor(B, NS('metal'), K.red, 0.52, 0.08, dx, 0.7, 0, { arc: PI });
      }
      B.pop();

      // Headframe Sheaves: 2 large spoked pulley wheels mounted on structural A-frames
      B.push(0, h + 0.6, d / 2 + 0.6);
      strut(B, 'metal', K.greenDk, [-0.8, -h, 0], [-0.5, 1.2, 0], 0.18);
      strut(B, 'metal', K.greenDk, [0.8, -h, 0], [0.5, 1.2, 0], 0.18);
      for (const sx of [-0.45, 0.45]) {
        ptor(B, 'metal', K.iron, 0.7, 0.08, sx, 1.2, 0, { seg: 16 });
        for (let sp = 0; sp < 6; sp++) {
          const sa = sp * (PI / 3);
          strut(B, NS('metal'), K.ironLt, [sx, 1.2, 0], [sx, 1.2 + Math.sin(sa) * 0.65, Math.cos(sa) * 0.65], 0.04);
        }
      }
      B.pop();
    },
  };

  // =========================================================================================================
  // 8. ORGAN PIPES INDUSTRIAL STEP LINKS & RETAINING COLLARS
  // Hexagonal basalt columns bound with riveted iron bands, checkerplate climbing step links with safety-yellow handles
  // =========================================================================================================
  D.caldera_organ_stump = {
    desc: 'Organ Pipes: basalt columns, heavy riveted retaining bands, checkerplate climbing step links with safety grab handles',
    build(B) {
      // Heavy Wrought-iron Hexagonal Retaining Collars
      for (const y of [1.6, 3.2, 4.8]) {
        ptor(B, 'metal', K.ironDk, 1.25, 0.09, 0, y, 0, { ts: 6 });
        // Heavy tensioning bolts
        for (let k = 0; k < 6; k++) {
          const ba = k * (PI / 3);
          pbox(B, NS('metal'), K.ironLt, 0.1, 0.14, 0.1, Math.cos(ba) * 1.3, y, Math.sin(ba) * 1.3);
        }
      }

      // Steel Climbing Step Links: checkerplate diamond-tread steps with bright safety-yellow grab handles
      for (let s = 0; s < 5; s++) {
        const sy = 0.8 + s * 0.85;
        const sa = (s & 1 ? 0.35 : -0.35);
        const sx = Math.sin(sa) * 1.22, sz = Math.cos(sa) * 1.22;
        B.push(sx, sy, sz, sa);
        // Welded mounting bracket
        pbox(B, 'metal', K.iron, 0.42, 0.12, 0.18, 0, 0, 0);
        // Checkerplate diamond-tread step plate
        pbox(B, 'metal', '#7a8288', 0.55, 0.06, 0.35, 0, 0.05, 0.15, { r: 0.02 });
        // Bright Safety-Yellow Tubular Grab Handle
        strut(B, 'paint', K.gold, [-0.22, 0.08, 0.3], [-0.22, 0.45, 0.3], 0.04);
        strut(B, 'paint', K.gold, [0.22, 0.08, 0.3], [0.22, 0.45, 0.3], 0.04);
        strut(B, 'paint', K.gold, [-0.22, 0.45, 0.3], [0.22, 0.45, 0.3], 0.04);
        B.pop();
      }

      // Caged Bulkhead Inspection Lamp along climb route
      pbox(B, NS('metal'), K.ironDk, 0.18, 0.28, 0.12, 0, 3.6, 1.28);
      psph(B, 'glow', K.lampGlow, 0.08, 0, 3.6, 1.35, { glow: 1.8 });
    },
  };

  // Socket Collars (around lava rider columns)
  D.caldera_socket_collar = {
    desc: 'Heavy cast iron socket collars with brass wear plates and grease cups',
    build(B) {
      ptor(B, 'metal', K.iron, 1.45, 0.14, 0, 0.12, 0, { ts: 8 });
      for (let i = 0; i < 8; i++) {
        const a = i * (PI / 4);
        pcyl(B, NS('metal'), K.ironLt, 0.06, 0.22, Math.cos(a) * 1.52, 0.14, Math.sin(a) * 1.52);
      }
    },
  };

  // =========================================================================================================
  // 9. INDUSTRIAL PIPE MANIFOLDS, VALVES & CLUTTER
  // Heavy steam and slurry pipe manifolds, brass handwheels, firebrick pallets, slag pots
  // =========================================================================================================
  D.caldera_pipe_manifold = {
    desc: 'High-pressure steam and slurry pipe manifold with flanged elbows and brass handwheels',
    build(B) {
      // 3 Parallel Flanged Pipes running along wall
      for (let i = 0; i < 3; i++) {
        const py = 0.6 + i * 0.7;
        flangedPipe(B, -3.0, py, 0, 3.0, py, 0, 0.14 - i * 0.02, i === 0 ? K.iron : (i === 1 ? K.green : K.copper));
        // Brass handwheel valve on center
        const vx = -1.2 + i * 1.2;
        pcyl(B, 'metal', K.brass, 0.1, 0.3, vx, py, 0.15, { rx: HP });
        ptor(B, 'paint', i === 0 ? K.red : (i === 1 ? K.gold : K.greenLt), 0.22, 0.035, vx, py, 0.32, { rx: HP });
      }
    },
  };

  D.caldera_firebrick_pallet = {
    desc: 'Pallet of refractory fireclay bricks with steel strapping',
    build(B) {
      // Timber pallet
      pbox(B, 'wood', K.wood, 1.4, 0.14, 1.4, 0, 0.07, 0);
      // Stacked Refractory Yellow Firebricks
      for (let tier = 0; tier < 4; tier++) {
        const by = 0.14 + tier * 0.22;
        pbox(B, 'paint', '#d9c28a', 1.25, 0.2, 1.25, 0, by + 0.1, 0);
      }
      // Steel strapping bands
      for (const bz of [-0.4, 0.4]) {
        pbox(B, NS('metal'), K.ironDk, 1.28, 0.9, 0.03, 0, 0.58, bz);
      }
    },
  };

  // =========================================================================================================
  // 10. POUR FLOOR PLINTH & FOUNDRY SURROUND DRESSING
  // Riveted cast-iron plinth skirts on all 4 faces (x = ±5.04, z = ±5.04), pier boots, cooling racks, tongs
  // =========================================================================================================
  D.caldera_pour_floor_dressing = {
    desc: 'Heavy cast-iron plinth skirting, pier boots, ingot cooling racks, and tongs racks for Pour Floor',
    build(B) {
      // 1. Plinth skirting panels along the 4 vertical faces of [-5, 5] x [1.2, 1.8] x [-5, 5]
      // North & South faces (z = ±5.04 m, span x: -5 to +5 m, y: 1.2 to 1.8 m)
      for (const sz of [-1, 1]) {
        const pz = sz * 5.04;
        // Iron base flange at floor line
        pbox(B, NS('metal'), K.ironDk, 10.15, 0.08, 0.08, 0, 1.24, pz);
        // Angle iron coping with yellow hazard strip along top lip
        pbox(B, 'metal', K.iron, 10.15, 0.06, 0.08, 0, 1.78, pz);
        pbox(B, NS('paint'), K.gold, 10.1, 0.04, 0.09, 0, 1.75, pz);
        // Vertical stiffener ribs every 1.25 m
        for (let x = -4.5; x <= 4.5; x += 1.25) {
          pbox(B, 'metal', K.ironLt, 0.12, 0.5, 0.06, x, 1.5, pz + sz * 0.02);
          // Rivets on stiffener
          psph(B, NS('metal'), K.ironDk, 0.022, x, 1.35, pz + sz * 0.04);
          psph(B, NS('metal'), K.ironDk, 0.022, x, 1.65, pz + sz * 0.04);
        }
        // Base drainage slots
        for (let x = -3.8; x <= 3.8; x += 2.5) {
          pbox(B, NS('metal'), K.ironDk, 0.35, 0.08, 0.06, x, 1.25, pz);
        }
      }
      // East & West faces (x = ±5.04 m, span z: -5 to +5 m, y: 1.2 to 1.8 m)
      for (const sx of [-1, 1]) {
        const px = sx * 5.04;
        // Iron base flange at floor line
        pbox(B, NS('metal'), K.ironDk, 0.08, 0.08, 10.15, px, 1.24, 0);
        // Angle iron coping with yellow hazard strip
        pbox(B, 'metal', K.iron, 0.08, 0.06, 10.15, px, 1.78, 0);
        pbox(B, NS('paint'), K.gold, 0.09, 0.04, 10.1, px, 1.75, 0);
        // Vertical stiffener ribs every 1.25 m
        for (let z = -4.5; z <= 4.5; z += 1.25) {
          pbox(B, 'metal', K.ironLt, 0.06, 0.5, 0.12, px + sx * 0.02, 1.5, z);
          psph(B, NS('metal'), K.ironDk, 0.022, px + sx * 0.04, 1.35, z);
          psph(B, NS('metal'), K.ironDk, 0.022, px + sx * 0.04, 1.65, z);
        }
      }
      // Heavy cast-iron corner brackets with hex bolts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        pbox(B, 'metal', K.ironDk, 0.28, 0.58, 0.28, sx * 5.05, 1.5, sz * 5.05);
      }

      // 2. Column Boots & Strapping for the 4 Piers at [±4.2, ±1.75], y = 1.8 to 7.0 m
      for (const px of [-4.2, 4.2]) for (const pz of [-1.75, 1.75]) {
        // Cast iron foundation boot
        pbox(B, 'metal', K.ironDk, 1.35, 0.75, 1.35, px, 2.18, pz);
        // Anchor flange rim
        pbox(B, NS('metal'), K.ironLt, 1.45, 0.08, 1.45, px, 1.85, pz);
        // Strapping bands every 1.2 m up the column
        for (let y = 2.8; y <= 6.8; y += 1.2) {
          pbox(B, NS('metal'), K.iron, 1.28, 0.1, 1.28, px, y, pz);
          // Corner rivets
          for (const dx of [-0.62, 0.62]) for (const dz of [-0.62, 0.62]) {
            psph(B, NS('metal'), K.ironLt, 0.025, px + dx, y, pz + dz);
          }
        }
        // Diagonal corner gusset plate connecting to tie-girder at y = 6.0
        strut(B, NS('metal'), K.greenLt, [px, 5.2, pz], [px, 6.0, pz + (pz > 0 ? -0.8 : 0.8)], 0.12);
      }

      // 3. Ingot Cooling Racks on the Island beside the plinth (y = 1.2)
      // Steel A-frame rack with tiers of glowing iron ingots
      for (const [rx, rz, ryaw] of [[-5.8, 2.0, HP], [5.8, -2.0, -HP], [-2.0, -5.8, 0], [2.0, 5.8, PI]]) {
        B.push(rx, 1.2, rz, ryaw);
        // A-frame ends
        for (const ex of [-1.2, 1.2]) {
          strut(B, 'metal', K.ironDk, [ex, 0, -0.45], [ex, 1.4, 0], 0.08);
          strut(B, 'metal', K.ironDk, [ex, 0, 0.45], [ex, 1.4, 0], 0.08);
          strut(B, NS('metal'), K.iron, [ex, 0.4, -0.3], [ex, 0.4, 0.3], 0.06);
          strut(B, NS('metal'), K.iron, [ex, 0.85, -0.18], [ex, 0.85, 0.18], 0.06);
        }
        // Horizontal support rails
        pbox(B, 'metal', K.iron, 2.45, 0.06, 0.06, 0, 0.4, -0.28);
        pbox(B, 'metal', K.iron, 2.45, 0.06, 0.06, 0, 0.4, 0.28);
        pbox(B, 'metal', K.iron, 2.45, 0.06, 0.06, 0, 0.85, -0.16);
        pbox(B, 'metal', K.iron, 2.45, 0.06, 0.06, 0, 0.85, 0.16);
        // Rows of cast iron ingots with molten glow
        for (let ix = -0.9; ix <= 0.9; ix += 0.36) {
          pbox(B, 'metal', '#383430', 0.28, 0.14, 0.65, ix, 0.48, 0, { r: 0.02 });
          pbox(B, 'glow', K.lavaGlow, 0.22, 0.05, 0.55, ix, 0.52, 0, { glow: 1.5 });
          pbox(B, 'metal', '#383430', 0.24, 0.12, 0.42, ix, 0.92, 0, { r: 0.02 });
          pbox(B, 'glow', K.orange, 0.18, 0.04, 0.34, ix, 0.96, 0, { glow: 1.8 });
        }
        B.pop();
      }

      // 4. Foundry Tongs & Ladles Stand
      {
        B.push(-5.8, 1.2, -3.2, HP);
        // Iron stand frame
        pbox(B, 'metal', K.ironDk, 1.8, 1.2, 0.1, 0, 0.6, 0);
        pbox(B, NS('metal'), K.iron, 2.0, 0.06, 0.25, 0, 1.18, 0);
        // Hanging long tongs and skimmers
        for (let tx = -0.7; tx <= 0.7; tx += 0.35) {
          pcyl(B, NS('metal'), K.ironLt, 0.018, 1.1, tx, 0.55, 0.12);
          pbox(B, NS('metal'), K.ironDk, 0.08, 0.2, 0.04, tx, 0.12, 0.12);
        }
        B.pop();
      }

      // 5. Island Cover Blocks Dressing (Skin within 8.5 cm)
      // Ingot Stack at [2.9, 1.2, -9.3] (1.2 x 1.1 x 1.2)
      B.push(2.9, 1.2, -9.3);
      pbox(B, 'wood', K.woodDk, 1.28, 0.1, 1.28, 0, 0.05, 0);
      for (const sx of [-0.62, 0.62]) {
        pbox(B, 'metal', K.iron, 0.06, 1.05, 1.18, sx, 0.58, 0);
        pbox(B, 'glow', K.lavaGlow, 0.07, 0.04, 1.05, sx, 0.45, 0, { glow: 1.5 });
        pbox(B, 'glow', K.lavaGlow, 0.07, 0.04, 1.05, sx, 0.75, 0, { glow: 1.5 });
      }
      for (const sz of [-0.62, 0.62]) {
        pbox(B, 'metal', K.iron, 1.18, 1.05, 0.06, 0, 0.58, sz);
        pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.08, 0, 0.3, sz);
        pbox(B, NS('metal'), K.ironRust, 1.24, 0.06, 0.08, 0, 0.85, sz);
      }
      B.pop();

      // Stilling Drum at [7.6, 1.2, -6.3] (OCT r = 1.0, h = 1.4)
      B.push(7.6, 1.2, -6.3);
      pcyl(B, 'metal', K.ironDk, 1.04, 1.38, 0, 0.7, 0, { seg: 18 });
      for (const hy of [0.25, 0.7, 1.15]) {
        ptor(B, NS('metal'), K.ironLt, 1.06, 0.035, 0, hy, 0);
      }
      // Bolted inspection manway on side
      pcyl(B, NS('metal'), K.iron, 0.32, 0.12, 0.98, 0.7, 0, { rz: HP });
      // Brass pressure relief valve and gauge
      pcyl(B, NS('metal'), K.brass, 0.08, 0.4, 0, 1.45, 0.5);
      psph(B, NS('metal'), K.brass, 0.12, 0, 1.65, 0.5);
      B.pop();

      // Ladle Stand at [11.6, 1.2, 0.8] (1.4 x 1.8 x 1.4)
      B.push(11.6, 1.2, 0.8);
      // Steel cradle frame
      for (const sx of [-0.72, 0.72]) {
        strut(B, 'metal', K.greenDk, [sx, 0, -0.85], [sx, 1.35, 0], 0.12);
        strut(B, 'metal', K.greenDk, [sx, 0, 0.85], [sx, 1.35, 0], 0.12);
        ptor(B, NS('metal'), K.ironDk, 0.22, 0.06, sx, 1.35, 0, { rz: HP });
      }
      // Tilted pouring ladle body with slag crust
      pcyl(B, 'metal', K.ironRust, 0.65, 1.1, 0, 0.85, 0, { rx: 0.25, seg: 14 });
      ptor(B, NS('metal'), K.ironDk, 0.68, 0.05, 0, 1.38, 0.12, { rx: 0.25 });
      pbox(B, 'glow', K.lavaGlow, 0.45, 0.04, 0.55, 0, 1.35, 0.15, { rx: 0.25, glow: 1.8 });
      B.pop();

      // Gauge Machine House at [-10.5, 2.4, 4.6] (3.0 x 2.2 x 4.0)
      B.push(-10.5, 2.4, 4.6);
      // Corrugated galvanized iron walls with dark green corner angles
      for (const sx of [-1.52, 1.52]) {
        pbox(B, 'metal', '#5c646b', 0.06, 2.15, 3.95, sx, 1.08, 0);
      }
      for (const sz of [-2.02, 2.02]) {
        pbox(B, 'metal', '#5c646b', 2.95, 2.15, 0.06, 0, 1.08, sz);
      }
      for (const sx of [-1.53, 1.53]) for (const sz of [-2.03, 2.03]) {
        pbox(B, NS('metal'), K.greenDk, 0.12, 2.2, 0.12, sx, 1.1, sz);
      }
      // Illuminated factory window on south face (facing mid / Pour Floor)
      pbox(B, 'glow', K.glassLit, 1.4, 1.0, 0.06, 0, 1.2, -2.04, { glow: 1.3 });
      pbox(B, NS('metal'), K.greenDk, 1.46, 0.06, 0.1, 0, 1.2, -2.04);
      pbox(B, NS('metal'), K.greenDk, 0.06, 1.06, 0.1, 0, 1.2, -2.04);
      // Copper float-well counterweight cable and dial
      pcyl(B, NS('metal'), K.copper, 0.02, 1.8, -1.1, 1.1, -2.05);
      pcyl(B, NS('metal'), K.brass, 0.24, 0.04, -1.1, 1.8, -2.06, { rx: HP });
      B.pop();

      // Valve Chest at [-6.15, 2.4, 0.0] (1.5 x 1.0 x 1.2)
      B.push(-6.15, 2.4, 0.0);
      pbox(B, 'metal', K.ironDk, 1.54, 0.08, 1.24, 0, 0.04, 0);
      // Red handwheels on rising stems
      for (const sx of [-0.4, 0.4]) {
        pcyl(B, NS('metal'), K.ironLt, 0.03, 0.45, sx, 1.12, 0);
        ptor(B, 'metal', K.red, 0.18, 0.03, sx, 1.32, 0, { rx: HP });
        psph(B, NS('metal'), K.brass, 0.04, sx, 1.32, 0);
      }
      // Bolted bonnet flanges on side faces
      for (const sz of [-0.62, 0.62]) {
        ptor(B, NS('metal'), K.iron, 0.25, 0.04, 0, 0.55, sz, { rx: HP });
      }
      B.pop();

      // Organ Stumps Columnar Dressing (basalt octagons [-6.4, -8.6], [-12.3, -2.7], [-7.0, -3.6])
      for (const [ox, oz, oy, orad] of [[-6.4, -8.6, 2.1, 0.9], [-12.3, -2.7, 2.4, 0.8], [-7.0, -3.6, 1.8, 0.8]]) {
        B.push(ox, 1.2, oz);
        // Riveted iron collar band around column
        ptor(B, NS('metal'), K.ironDk, orad + 0.04, 0.06, 0, (oy - 1.2) * 0.6, 0);
        // Climbing rungs on face toward path
        for (let ry = 0.25; ry <= (oy - 1.2) * 0.85; ry += 0.3) {
          pbox(B, NS('paint'), K.gold, 0.32, 0.04, 0.06, 0, ry, orad + 0.02);
        }
        B.pop();
      }
    },
  };

  // =========================================================================================================
  // 11. RIM HEAD, PATTERN SHOP & TERRACE DRESSING
  // Weatherboard skins, window openings, trims, roofs, crates, and firebrick pallets
  // =========================================================================================================
  D.caldera_rim_head_dressing = {
    desc: 'Architectural skins, openings, roofs, and industrial props for Rim Head and Moulding Terrace',
    build(B) {
      // 1. Pattern Shop Skin (around frameBox on terrace)
      // Planks, multi-pane illuminated windows, corner trims, corrugated roof
      B.push(-20.5, 2.4, -36.5, 60 * D_);
      // Weatherboard wall panels
      pbox(B, 'wood', K.wood, 4.2, 2.9, 0.1, 0, 1.5, 1.72);
      pbox(B, 'wood', K.wood, 0.1, 2.9, 3.4, -2.12, 1.5, 0);
      pbox(B, 'wood', K.wood, 0.1, 2.9, 3.4, 2.12, 1.5, 0);
      // Corner trim battens
      pbox(B, NS('paint'), K.white, 0.14, 3.0, 0.14, -2.14, 1.5, 1.74);
      pbox(B, NS('paint'), K.white, 0.14, 3.0, 0.14, 2.14, 1.5, 1.74);
      // Multi-pane Workshop Windows with glowing warm interior
      for (const wx of [-1.1, 1.1]) {
        pbox(B, 'metal', K.greenDk, 1.2, 1.4, 0.12, wx, 1.6, 1.74);
        pbox(B, 'glow', K.glassLit, 1.05, 1.25, 0.06, wx, 1.6, 1.76, { glow: 1.4 });
        // Window mullions
        pbox(B, NS('paint'), K.white, 0.05, 1.25, 0.14, wx, 1.6, 1.78);
        pbox(B, NS('paint'), K.white, 1.05, 0.05, 0.14, wx, 1.6, 1.78);
      }
      // Overhanging Corrugated Roof with rain gutter
      pbox(B, 'paint', K.verdDk, 4.6, 0.15, 3.8, 0, 3.05, 0);
      pbox(B, NS('metal'), K.ironLt, 4.65, 0.08, 0.08, 0, 2.98, 1.92); // Front gutter
      pcyl(B, NS('metal'), K.iron, 0.04, 2.8, -2.2, 1.5, 1.9, { seg: 6 }); // Downpipe
      // Stove pipe chimney
      pcyl(B, 'metal', K.ironLt, 0.12, 1.6, 1.2, 3.8, -0.8, { seg: 8 });
      pcyl(B, NS('metal'), K.ironDk, 0.22, 0.12, 1.2, 4.5, -0.8, { seg: 8 });
      B.pop();

      // 2. Sand Bin & Flask Stacks Skin
      B.push(-13.5, 2.4, -37.5);
      // Heavy timber plank retainers with rusty iron strapping
      pbox(B, 'wood', K.woodDk, 3.4, 1.1, 0.12, 0, 0.55, 1.8);
      pbox(B, 'wood', K.woodDk, 0.12, 1.1, 3.6, -1.7, 0.55, 0);
      for (const bx of [-1.6, 0, 1.6]) {
        pbox(B, NS('metal'), K.ironRust, 0.1, 1.15, 0.16, bx, 0.55, 1.82);
      }
      // Spilled Moulding Sand heaps at base
      pbox(B, 'paint', K.sand, 3.6, 0.35, 1.2, 0, 0.18, 2.2);
      // Flask Stack tiers
      for (let tier = 0; tier < 3; tier++) {
        const fy = tier * 0.42;
        pbox(B, 'metal', K.iron, 1.5, 0.38, 1.2, 0.4, fy + 0.2, -0.4, { r: 0.03 });
        pbox(B, 'paint', K.sand, 1.3, 0.35, 1.0, 0.4, fy + 0.22, -0.4);
      }
      B.pop();

      // 3. Stencilled Pattern Crates on Moulding Terrace
      B.push(-11.8, 2.4, -38.2);
      // Large banded crates
      pbox(B, 'wood', '#8a6e50', 1.8, 1.2, 1.4, 0, 0.6, 0);
      pbox(B, NS('metal'), K.ironRust, 1.82, 0.06, 0.06, 0, 0.15, -0.68);
      pbox(B, NS('metal'), K.ironRust, 1.82, 0.06, 0.06, 0, 1.05, -0.68);
      pbox(B, NS('metal'), K.ironRust, 1.82, 0.06, 0.06, 0, 0.15, 0.68);
      pbox(B, NS('metal'), K.ironRust, 1.82, 0.06, 0.06, 0, 1.05, 0.68);
      // Stencil badge plate
      pbox(B, NS('paint'), K.white, 0.9, 0.45, 0.02, 0, 0.65, 0.72);
      pbox(B, NS('paint'), K.ironDk, 0.8, 0.1, 0.03, 0, 0.72, 0.73);
      // Second stacked crate
      pbox(B, 'wood', '#9c7b5a', 1.2, 0.9, 1.1, 0.2, 1.65, -0.1);
      B.pop();

      // 4. Refractory Firebrick Pallets along terrace
      for (const [px, pz] of [[-7.5, -42.0], [-9.5, -40.0], [-15.5, -39.0]]) {
        B.push(px, 2.4, pz);
        pbox(B, 'wood', K.wood, 1.3, 0.12, 1.3, 0, 0.06, 0);
        for (let t = 0; t < 3; t++) {
          pbox(B, 'paint', '#d9c28a', 1.15, 0.22, 1.15, 0, 0.12 + t * 0.22 + 0.11, 0);
        }
        pbox(B, NS('metal'), K.ironDk, 1.18, 0.7, 0.03, 0, 0.45, 0);
        B.pop();
      }

      // 5. Rim Head Outcrops & Cairns Dressing (skin within 8.5 cm of faces)
      // Outcrop 1 at [-29.0, 4.2, -24.5] (1.6 x 1.3 x 1.4)
      B.push(-29.0, 4.2, -24.5);
      for (const sx of [-0.78, 0.78]) {
        pbox(B, 'paint', K.basalt, 0.06, 1.25, 1.35, sx, 0.63, 0);
        pbox(B, NS('paint'), K.basaltDk, 0.08, 1.1, 0.35, sx, 0.6, -0.35);
        pbox(B, NS('paint'), K.basaltLt, 0.08, 0.9, 0.35, sx, 0.5, 0.35);
      }
      for (const sz of [-0.68, 0.68]) {
        pbox(B, 'paint', K.basalt, 1.55, 1.25, 0.06, 0, 0.63, sz);
        pbox(B, NS('paint'), K.basaltDk, 0.45, 1.0, 0.08, -0.4, 0.55, sz);
      }
      // Forged iron mooring/anchor ring on rock
      ptor(B, NS('metal'), K.ironRust, 0.18, 0.04, 0, 0.85, 0.73, { rx: HP });
      // Scoria and basalt gravel skirts at base
      pbox(B, NS('paint'), K.scoria, 1.76, 0.15, 1.56, 0, 0.08, 0);
      B.pop();

      // Outcrop 2 at [-35.4, 4.2, -37.0] (1.4 x 1.3 x 1.6)
      B.push(-35.4, 4.2, -37.0);
      for (const sx of [-0.68, 0.68]) {
        pbox(B, 'paint', K.basalt, 0.06, 1.25, 1.55, sx, 0.63, 0);
        pbox(B, NS('paint'), K.basaltLt, 0.08, 0.8, 0.45, sx, 0.45, 0);
      }
      for (const sz of [-0.78, 0.78]) {
        pbox(B, 'paint', K.basalt, 1.35, 1.25, 0.06, 0, 0.63, sz);
      }
      // Steel surveyor benchmark tripod on outer edge
      strut(B, NS('metal'), K.gold, [-0.4, 0, -0.4], [0, 1.45, 0], 0.04);
      strut(B, NS('metal'), K.gold, [0.4, 0, -0.4], [0, 1.45, 0], 0.04);
      strut(B, NS('metal'), K.gold, [0, 0, 0.5], [0, 1.45, 0], 0.04);
      psph(B, NS('metal'), K.brass, 0.08, 0, 1.45, 0);
      B.pop();

      // Cairn 1 at [-29.2, 4.2, -35.6] (1.2 x 1.2 x 1.2)
      B.push(-29.2, 4.2, -35.6);
      for (let t = 0; t < 3; t++) {
        const ty = 0.2 + t * 0.35, tw = 1.26 - t * 0.06;
        pbox(B, 'paint', K.basaltDk, tw, 0.32, tw, 0, ty, 0);
        pbox(B, NS('paint'), K.basaltLt, tw + 0.04, 0.06, tw + 0.04, 0, ty - 0.14, 0);
      }
      // Bronze triangulation benchmark plate
      pcyl(B, NS('metal'), K.brass, 0.18, 0.04, 0, 1.22, 0);
      B.pop();

      // Cairn 2 at [-25.6, 4.2, -29.6] (1.2 x 1.2 x 1.2)
      B.push(-25.6, 4.2, -29.6);
      for (let t = 0; t < 3; t++) {
        const ty = 0.2 + t * 0.35, tw = 1.26 - t * 0.06;
        pbox(B, 'paint', K.basaltDk, tw, 0.32, tw, 0, ty, 0);
      }
      // Cast bronze warning plate on South face
      pbox(B, NS('metal'), K.brass, 0.65, 0.35, 0.04, 0, 0.75, 0.63);
      pbox(B, NS('paint'), K.ironDk, 0.55, 0.08, 0.05, 0, 0.75, 0.64);
      B.pop();
    },
  };

  // =========================================================================================================
  // 13. YARD COVER DRESSING (Cover blocks & stacked foundry workpieces)
  // Ferry castings, drain grates, ingot racks, pattern bays, drum stacks, cable reels, lamp-post stillages
  // =========================================================================================================
  D.caldera_yard_cover_dressing = {
    desc: 'Heavy cast-iron castings stacked for ferry shipment, ingot racks, drum stacks, stillage frames',
    build(B) {
      // 1. Ferry Castings Line East (x = -12.4, z = -62.5 to -46.75 and -43.25 to -40.85, y = 3.6 to 6.0)
      for (const [z0, z1] of [[-62.5, -46.75], [-43.25, -40.85]]) {
        const zc = (z0 + z1) / 2, zl = Math.abs(z1 - z0);
        B.push(-12.4, 3.6, zc);
        // Base timber dunnage runners
        pbox(B, 'wood', K.woodDk, 1.26, 0.14, zl + 0.04, 0, 0.07, 0);
        // Stacked locomotive wheel blanks and flywheel rings along faces
        for (let z = -zl / 2 + 1.2; z <= zl / 2 - 1.2; z += 2.4) {
          // East face (facing east lane)
          ptor(B, 'metal', K.iron, 0.75, 0.12, 0.63, 1.2, z);
          pcyl(B, NS('metal'), K.ironLt, 0.28, 0.24, 0.63, 1.2, z, { rx: HP });
          // West face (facing center lane)
          ptor(B, 'metal', K.ironDk, 0.75, 0.12, -0.63, 1.2, z);
          pcyl(B, NS('metal'), K.ironLt, 0.28, 0.24, -0.63, 1.2, z, { rx: HP });
        }
        // Heavy steel strapping bands every 2.0 m
        for (let z = -zl / 2 + 1.0; z <= zl / 2 - 1.0; z += 2.0) {
          pbox(B, NS('metal'), K.ironRust, 1.28, 0.08, 0.08, 0, 0.4, z);
          pbox(B, NS('metal'), K.ironRust, 1.28, 0.08, 0.08, 0, 1.8, z);
          pbox(B, NS('metal'), K.ironRust, 0.08, 2.35, 0.08, 0.62, 1.18, z);
          pbox(B, NS('metal'), K.ironRust, 0.08, 2.35, 0.08, -0.62, 1.18, z);
        }
        // Stencil plate: "HIGHMARK FOUNDRY - LOT 41"
        pbox(B, NS('paint'), K.white, 0.04, 0.45, 1.8, -0.64, 1.7, 0);
        pbox(B, NS('paint'), K.ironDk, 0.05, 0.1, 1.6, -0.65, 1.7, 0);
        B.pop();
      }

      // 2. Ferry Castings Line West (x = -27.7, z = -62.5 to -46.75, y = 3.6 to 6.0)
      {
        const z0 = -62.5, z1 = -46.75, zc = (z0 + z1) / 2, zl = Math.abs(z1 - z0);
        B.push(-27.7, 3.6, zc);
        pbox(B, 'wood', K.woodDk, 1.26, 0.14, zl + 0.04, 0, 0.07, 0);
        // Flanged steam manifold castings along faces
        for (let z = -zl / 2 + 1.5; z <= zl / 2 - 1.5; z += 3.0) {
          for (const sx of [-0.64, 0.64]) {
            pcyl(B, 'metal', K.iron, 0.35, 1.8, sx, 1.1, z, { rz: HP });
            ptor(B, NS('metal'), K.ironDk, 0.48, 0.08, sx, 1.1, z - 0.75, { rx: HP });
            ptor(B, NS('metal'), K.ironDk, 0.48, 0.08, sx, 1.1, z + 0.75, { rx: HP });
          }
        }
        for (let z = -zl / 2 + 1.0; z <= zl / 2 - 1.0; z += 2.0) {
          pbox(B, NS('metal'), K.ironRust, 1.28, 0.08, 0.08, 0, 0.4, z);
          pbox(B, NS('metal'), K.ironRust, 1.28, 0.08, 0.08, 0, 1.8, z);
        }
        B.pop();
      }

      // 3. Center Lane Gate Apron: Drain Grates & Ingot Rack (y = 3.6)
      // Drain Grates at [-20.6, 3.6, -49.4] (1.6 x 1.3 x 1.2)
      B.push(-20.6, 3.6, -49.4);
      pbox(B, 'metal', K.ironDk, 1.66, 0.12, 1.26, 0, 0.06, 0);
      for (const sx of [-0.83, 0.83]) pbox(B, 'metal', K.ironLt, 0.08, 1.28, 1.24, sx, 0.65, 0);
      for (const sz of [-0.63, 0.63]) pbox(B, 'metal', K.ironLt, 1.64, 1.28, 0.08, 0, 0.65, sz);
      // Slotted iron drainage grates
      for (let x = -0.65; x <= 0.65; x += 0.22) {
        pbox(B, NS('metal'), K.iron, 0.08, 0.1, 1.18, x, 1.32, 0);
      }
      B.pop();

      // Ingot Rack at [-14.6, 3.6, -48.7] (1.6 x 1.3 x 1.4)
      B.push(-14.6, 3.6, -48.7);
      // Steel tiered A-frame uprights
      for (const sx of [-0.82, 0.82]) {
        pbox(B, 'metal', K.greenDk, 0.08, 1.3, 1.44, sx, 0.65, 0);
        for (let tier = 0; tier < 3; tier++) {
          pbox(B, NS('metal'), K.ironLt, 0.12, 0.08, 1.46, sx, 0.25 + tier * 0.42, 0);
        }
      }
      // Glowing ingots on tiers
      for (let tier = 0; tier < 3; tier++) {
        const ty = 0.32 + tier * 0.42;
        pbox(B, 'metal', K.iron, 1.58, 0.14, 1.32, 0, ty, 0);
        pbox(B, 'glow', K.orange, 1.54, 0.04, 1.24, 0, ty + 0.08, 0, { glow: 1.2 });
      }
      B.pop();

      // 4. Drum Stack at [-36.0, 3.6, -59.8] (r = 0.85, h = 1.3)
      B.push(-36.0, 3.6, -59.8);
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
        pcyl(B, 'metal', '#4a5450', 0.38, 1.25, dx, 0.63, dz, { seg: 12 });
        ptor(B, NS('metal'), K.ironDk, 0.4, 0.03, dx, 0.35, dz);
        ptor(B, NS('metal'), K.ironDk, 0.4, 0.03, dx, 0.95, dz);
        // Bung cap
        pcyl(B, NS('metal'), K.brass, 0.06, 0.04, dx + 0.18, 1.27, dz);
      }
      B.pop();

      // 5. Cable Drum at [-7.6, 3.6, -48.6] (r = 0.8, h = 1.3)
      B.push(-7.6, 3.6, -48.6);
      // Timber side flanges
      for (const sy of [0.08, 1.22]) {
        pcyl(B, 'wood', K.woodDk, 0.82, 0.12, 0, sy, 0, { seg: 14 });
        ptor(B, NS('metal'), K.ironDk, 0.84, 0.03, 0, sy, 0);
      }
      // Steel core with wound wire rope
      pcyl(B, 'metal', K.ironLt, 0.45, 1.05, 0, 0.65, 0, { seg: 14 });
      for (let y = 0.25; y <= 1.05; y += 0.15) {
        ptor(B, NS('metal'), K.iron, 0.65, 0.06, 0, y, 0);
      }
      // Forged steel rigging shackle on top
      ptor(B, NS('metal'), K.ironRust, 0.15, 0.04, 0.25, 1.32, 0, { rx: HP });
      B.pop();

      // 6. Moulding Floor Cover: Lamp-Post Rack & Flask Stack & Ingot Pile
      // Lamp-post rack at [-26.2, 3.6, -41.6]
      B.push(-26.2, 3.6, -41.6);
      for (const sx of [-0.65, 0.65]) {
        pbox(B, 'metal', K.greenDk, 0.1, 2.15, 0.85, sx, 1.08, 0);
      }
      pbox(B, 'metal', K.green, 1.35, 0.1, 0.85, 0, 1.85, 0);
      // Cast-iron ornate lamp post brackets stored in rack
      for (let x = -0.45; x <= 0.45; x += 0.3) {
        pcyl(B, NS('metal'), K.green, 0.08, 1.95, x, 1.0, 0, { seg: 8 });
      }
      B.pop();

      // Ingot Pile at [-21.0, 3.6, -42.2] (1.2 x 1.4 x 1.2)
      B.push(-21.0, 3.6, -42.2);
      pbox(B, 'wood', K.woodDk, 1.26, 0.12, 1.46, 0, 0.06, 0);
      for (let t = 0; t < 3; t++) {
        const ty = 0.22 + t * 0.35, tw = 1.15 - t * 0.15, tl = 1.35 - t * 0.15;
        pbox(B, 'metal', K.ironDk, tw, 0.32, tl, 0, ty, 0);
        pbox(B, 'glow', K.orange, tw - 0.08, 0.04, tl - 0.08, 0, ty + 0.12, 0, { glow: 1.1 });
      }
      B.pop();
    },
  };


  // =========================================================================================================
  // 12. HORIZON ROOFS, CHIMNEYS & UPPER STOREYS (SE & NW Walls)
  // Sawtooth factory roofs, water tanks, smelting exhaust chimneys, vents, and roof forms
  // =========================================================================================================
  D.caldera_horizon_dressing = {
    desc: 'Upper storey industrial roofs, water tanks, smelting chimneys, and skyline forms',
    build(B) {
      // 1. South-East Skyline (behind Spillway Horn & Moulding Terrace, above outer walls)
      // Sawtooth factory clerestories and smelting stacks
      for (let i = 0; i < 4; i++) {
        const sx = 14.0 + i * 5.5, sz = -32.0 - i * 4.5, sy = 5.2;
        B.push(sx, sy, sz, -40 * D_);
        // Sawtooth roof ridge
        pbox(B, 'paint', K.brickDk, 5.0, 2.4, 3.5, 0, 1.2, 0);
        pbox(B, 'paint', K.verdDk, 5.2, 0.15, 3.8, 0, 2.4, 0);
        // Clerestory north-facing glass with warm lit furnace glow
        pbox(B, 'glow', K.glassLit, 4.6, 1.6, 0.1, 0, 1.4, 1.76, { glow: 1.2 });
        // Heavy Brick Smelting Chimney Stack
        pcyl(B, 'paint', K.brick, 0.65, 8.5, 2.2, 5.5, 0, { seg: 10 });
        ptor(B, NS('metal'), K.ironDk, 0.72, 0.08, 2.2, 9.4, 0);
        pcyl(B, NS('metal'), K.iron, 0.95, 0.4, 2.2, 9.7, 0, { seg: 10 }); // Cap
        B.pop();
      }

      // 2. Industrial Cylindrical Water Tank on 4-Post Steel Trestle
      {
        const tx = 28.0, tz = -38.0, ty = 4.8;
        B.push(tx, ty, tz);
        // 4 Steel Trestle legs
        for (const lx of [-1.5, 1.5]) for (const lz of [-1.5, 1.5]) {
          strut(B, 'metal', K.greenDk, [lx, 0, lz], [lx * 0.75, 4.5, lz * 0.75], 0.14);
        }
        // X-bracing on trestle
        strut(B, NS('metal'), K.green, [-1.5, 0.5, -1.5], [1.12, 4.0, -1.12], 0.06);
        strut(B, NS('metal'), K.green, [1.5, 0.5, -1.5], [-1.12, 4.0, -1.12], 0.06);
        // Mezzanine ring platform
        pcyl(B, 'metal', K.iron, 2.0, 0.15, 0, 4.55, 0, { seg: 16 });
        // Cedar/Steel Stave Water Tank
        pcyl(B, 'wood', K.woodDk, 1.7, 3.2, 0, 6.2, 0, { seg: 18 });
        // Steel retention hoops
        for (let hy = 4.8; hy <= 7.6; hy += 0.7) {
          ptor(B, NS('metal'), K.ironDk, 1.74, 0.04, 0, hy, 0);
        }
        // Conical roof cap
        B.lathe('paint', K.verd, [[0, 1.2], [0.08, 1.2], [1.85, 0], [0, 0]], 0, 7.8, 0, { seg: 16 });
        B.pop();
      }

      // 3. North-West Skyline (behind Slump & Horn, above outer walls)
      for (let i = 0; i < 3; i++) {
        const nx = -28.0 - i * 4.5, nz = -16.0 + i * 5.5, ny = 4.5;
        B.push(nx, ny, nz, 130 * D_);
        pbox(B, 'paint', K.brickDk, 4.5, 2.2, 3.2, 0, 1.1, 0);
        pbox(B, 'paint', K.verdDk, 4.7, 0.15, 3.5, 0, 2.2, 0);
        // Smelting stack
        pcyl(B, 'metal', K.iron, 0.5, 6.5, 1.8, 4.2, 0, { seg: 8 });
        pcyl(B, NS('metal'), K.ironDk, 0.75, 0.35, 1.8, 7.4, 0, { seg: 8 });
        B.pop();
      }
    },
  };
}
