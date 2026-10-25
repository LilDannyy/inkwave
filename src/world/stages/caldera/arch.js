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

      // Dressed basalt masonry foundation
      pbox(B, 'paint', K.basaltDk, w + 0.2, 0.5, d + 0.2, 0, 0.25, 0);

      // Corrugated galvanized iron shed body
      pbox(B, 'metal', '#62686e', w, h - 0.5, d, 0, 0.5 + (h - 0.5) / 2, 0);
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
}
